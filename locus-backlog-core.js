// [PP] v0.2.0 · sprint:PP-S-01 · mod:9 · autor:Rune · 2026-06-12 UTC-6
// locus-backlog-core.js
// Responsabilidad: State global (ITEMS, undo/redo), carga, parse, importación,
//   filtros, vistas, sort, stats, footer, helpers de badge/status/effort.

// T-202606-057: imports hacia módulos que importan a locus-backlog-core eliminados.
// Funciones desacopladas via _coreCallbacks (getters/acciones controladas)
// y shell:* events (notificaciones de render — window per B-202606-021).
import { _blogLog, _effectiveVersion, _isInSession, _loadFromSupabase, _tplKey, getAI, getActiveSprints, getAllSessions, getState, saveBacklog } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';
import { esc } from './locus-ui-shell.js';

// ── Callback registry — T-202606-057 ─────────────────────────────────────────
// Módulos consumidores registran sus funciones aquí al inicializarse.
// locus-backlog-core no las importa directamente — elimina ciclos.
//
// Registro de callbacks obligatorios por módulo registrante:
//   locus-backlog-editor.js  → openItemEditor
//   locus-backlog-merge.js   → confirmDiscard, confirmRetroceso
//   locus-backlog-panel.js   → backlogSetSelected, openItemPanel, closeItemPanel
//   locus-modals.js          → gconfirmOpen
//   locus-notifications.js   → hasRecentSession
//   locus-backlog-sprints.js → getActiveSprint, getSprintById
//   locus-sprint-project.js  → getActiveProjectFilter
const _coreCallbacks = {};

export function _registerCoreCallback(name, fn) {
  if (typeof fn !== 'function') {
    console.warn('[locus-backlog-core] _registerCoreCallback: "' + name + '" no es función — ignorado');
    return;
  }
  _coreCallbacks[name] = fn;
}

// shell:* events despachados por este módulo (todos en window per B-202606-021):
//   shell:backlog-render-dirty  → listener: _markBacklogListDirty() + renderBacklogList()
//   shell:backlog-filter-changed → listener: updateClearFilterBtn()
//   shell:backlog-footer-update  → listener: updateBacklogFooter()
//   shell:backlog-modified       → listener: _setBacklogModified()
//   shell:backlog-subtab-update  → listener: _updateSubTabButtons(detail.tab)
//   shell:sprint-render          → listener: renderSprintBurndown() + renderSprintItems()

// T-202604-216: Skeleton helpers
const _SKEL_HTML_4 = Array(4).fill('<div class="skel-row"></div>').join('');
const _SKEL_HTML_5 = Array(5).fill('<div class="skel-row"></div>').join('');
const _SKEL_TBL    = Array(4).fill('<div class="skel-row skel-row--tbl"></div>').join('');
export function _skelShow(el, variant) {
  if (!el) return;
  const h = variant === 'tbl' ? _SKEL_TBL : variant === 5 ? _SKEL_HTML_5 : _SKEL_HTML_4;
  el.innerHTML = h;
  el.classList.add('is-loading');
}
export function _skelHide(el) { if (el) el.classList.remove('is-loading'); }

// _generateContextContent + exportContextMd — migradas a locus-sprint-project.js


// ── TAB-BACKLOG — State, parser, importación, render, filtros, búsqueda ──
// HTML MAP viewer extraído a locus-map-viewer.js

// T-202604-187: CSS para children colapsables y toggle árbol/plano


// T-202604-323: HTML-MAP — barras proporcionales por módulo con color por tipo


let currentFilter = 'all';
// T-202606-047: normalizeStatus — punto canónico único de validación y normalización de status
// Firma: normalizeStatus(raw: string, type?: string) → string
// Consumidores: ITEMS IIFE · _normalizeItems · parseBacklogMd · locus-session-parse.js (T-202606-048)
export function normalizeStatus(raw, type) {
  const s = (raw || '').trim().toLowerCase();
  // Aliases de entrada conocidos
  if (s === 'en_revision' || s === 'en revisión' || s === 'en-revisión') return 'en-revision';
  // Valores canónicos directos
  if (s === 'done')        return 'done';
  if (s === 'en-revision') return 'en-revision';
  if (s === 'descartado')  return 'descartado';
  if (s === 'historico')   return 'historico';
  if (s === 'promovida')   return type === 'P' ? 'promovida' : 'pendiente';
  if (s === 'pendiente')   return 'pendiente';
  // Valor desconocido → pendiente
  return 'pendiente';
}

var ITEMS = (() => { // ESM-B: var para evitar TDZ en grafo circular — migrar a módulo de estado en PP-S-10
  // T-202604-006: leer clave por proyecto activo sin depender de _tplKey (aún no definida)
  const _initProjId = localStorage.getItem('current-project-filter') || '';
  const _initKey = _initProjId ? 'backlog-items-' + _initProjId : null;
  const stored = _initKey ? localStorage.getItem(_initKey) : null;
  if (!stored && _initProjId) {
    // B-202605-062: proyecto activo sin datos — feedback explícito
    console.warn('[AI Tracker] ITEMS IIFE: proyecto activo "' + _initProjId + '" no tiene datos en localStorage.');
    // El empty window.state visual se muestra en renderBacklogList cuando ITEMS queda vacío
  }
  if (stored) {
    try {
      const items = JSON.parse(stored);
      // Migración inline: normalizar status legacy antes de que cualquier código use ITEMS
      // T-202606-047: consume normalizeStatus() — punto canónico único
      let migrated = false;
      items.forEach(item => {
        const norm = normalizeStatus(item.status, item.type);
        if (item.status !== norm) { item.status = norm; migrated = true; }
      });
      if (migrated) {
        try { localStorage.setItem(_initKey, JSON.stringify(items)); } catch {}
        console.log('[AI Tracker] ITEMS migration: legacy status values normalized');
      }
      return items;
    } catch {
      return [];
    }
  }
  return [];
})();

// getItems(): acceso canónico al array ITEMS — reemplaza window.ITEMS (ESM-1 · T-202606-037)
export function getItems() { return ITEMS; }
function _setITEMS(arr) {
  ITEMS.splice(0, ITEMS.length, ...(Array.isArray(arr) ? arr : []));
}

// B-202604-002: undo/redo stack para ITEMS (20 niveles)
const UNDO_MAX = 20;
let _undoStack = [];
let _redoStack = [];

// B-202604-194: Set de ids de ítems cuyos AC fueron reemplazados en la sesión activa.
// Vive solo en memoria — nunca se persiste a localStorage ni se serializa con ITEMS.
// Se limpia automáticamente al recargar la página (nueva sesión).
const _acReplacedSet = new Set();

// B-202605-012: wrapper para llamadas inline a openItemEditor
export function _openItemEditorSafe(id, code) {
  const _openItemEditorCb = _coreCallbacks.openItemEditor;
  if (_openItemEditorCb) {
    _openItemEditorCb(id, code);
  } else {
    showToast({ title: 'No se pudo abrir el editor', body: 'Recarga la página.', type: 'error' });
    console.error('[AI Tracker] openItemEditor no disponible — módulo externo no cargado');
  }
}

export function _undoSnapshot() {
  _undoStack.push(JSON.stringify(ITEMS));
  if (_undoStack.length > UNDO_MAX) _undoStack.shift();
  _redoStack = [];
  _updateUndoUI();
}

export function undoBacklog() {
  if (!_undoStack.length) return;
  _redoStack.push(JSON.stringify(ITEMS));
  _setITEMS(JSON.parse(_undoStack.pop()));
  saveBacklog();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  renderStats();
  _updateUndoUI();
  showToast('info', '↩ Deshacer aplicado');
}

export function redoBacklog() {
  if (!_redoStack.length) return;
  _undoStack.push(JSON.stringify(ITEMS));
  _setITEMS(JSON.parse(_redoStack.pop()));
  saveBacklog();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  renderStats();
  _updateUndoUI();
  showToast('info', '↪ Rehacer aplicado');
}

export function _updateUndoUI() {
  const btnU = document.getElementById('btn-undo-backlog');
  const btnR = document.getElementById('btn-redo-backlog');
  if (btnU) { btnU.disabled = !_undoStack.length; btnU.title = _undoStack.length ? `Deshacer (${_undoStack.length})  Ctrl+Z` : 'Sin acciones para deshacer'; }
  if (btnR) { btnR.disabled = !_redoStack.length; btnR.title = _redoStack.length ? `Rehacer (${_redoStack.length})  Ctrl+Shift+Z` : 'Sin acciones para rehacer'; }
}

let backlogSearchQuery = '';
let _backlogSelectedCode = null; // T-202604-253: ítem seleccionado para Space → done
// T-202604-424: sprint eliminado como opción de sort — la agrupación por sprint es el modo de vista por defecto
// Opciones válidas: priority | effort | type | code | completedAt | createdAt
let backlogSortMode = 'priority';
let backlogSortDir = 'desc'; // T-072: asc | desc — default desc (nuevo → viejo)
let activeEfforts = new Set([1, 2, 3]); // T-071: todos activos por defecto
// T-202604-245: filtro por rol responsable — null = todos (sin filtro activo)
let activeRoleFilter = null;
// T-202604-357: filtro por prioridad — Set vacío = todos activos
let activePriorityFilter = new Set(); // vacío = sin filtro activo (todos visibles)
// T-202604-363: filtro Sin AC — pendientes sin criterios de aceptación
let _backlogNoAcMode = false;
// T-202604-339: vista Mike — filtro puntual T's pendientes del sprint activo (no persiste)
// T-202604-366: renombrado a Mi vista — filtro rotativo por rol con T's pendientes en sprint activo
let _backlogMikeMode = false;
let _miViewRoleIndex = 0; // índice del rol activo en la rotación

// T-202606-062: _backlogSprintGroupMode eliminado — _renderVistaLista es la vista por defecto
// T-202606-012: vistas árbol y plana eliminadas — vista C colapsable es la vista por defecto
const _backlogViewModeRaw = localStorage.getItem('backlog-view-mode');
let _backlogKanbanMode = _backlogViewModeRaw === 'kanban';
// T-202604-187: set de rCodes con bloque hijos colapsado
const _collapsedChildren = new Set();

// T-049: window.state de filtros mixtos
let activeTypes = new Set(['T','R','B','P']);
// T-202606-021: clave canónica para persistencia de activeStatuses
const _ACTIVE_STATUSES_KEY = 'locus-active-statuses';
function _loadActiveStatuses() {
  try {
    const raw = localStorage.getItem(_ACTIVE_STATUSES_KEY);
    if (!raw) return new Set(['pendiente', 'en-revision']);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return new Set(['pendiente', 'en-revision']);
    return new Set(parsed);
  } catch { return new Set(['pendiente', 'en-revision']); }
}
function _saveActiveStatuses() {
  try { localStorage.setItem(_ACTIVE_STATUSES_KEY, JSON.stringify([...activeStatuses])); } catch {}
}
let activeStatuses = _loadActiveStatuses(); // done oculto por defecto si no hay valor guardado
let _blFooterCollapsed = false; // T-202604-360: footer fijo colapsable

const VERSIONS_ORDER = ['v2.0.0','futura'];
const VERSION_LABELS = {
  'v2.0.0':'Sprint activo',
  'futura':'Versión futura — sin fecha'
};

// T-202606-014: colapso de Rs en vista C — clave canónica por proyecto+rCode
export function _vcCollapseGet(projectId, rCode) {
  try { return localStorage.getItem(`locus-vc-collapse-${projectId}-${rCode}`) === '1'; } catch { return false; }
}
export function _vcCollapseSet(projectId, rCode, collapsed) {
  try {
    if (collapsed) { localStorage.setItem(`locus-vc-collapse-${projectId}-${rCode}`, '1'); }
    else { localStorage.removeItem(`locus-vc-collapse-${projectId}-${rCode}`); }
  } catch {}
}

// T-049: colapso por versión — persiste en localStorage
const _CV_KEY = 'backlog-collapsed-versions';
function _cvLoad() {
  try { return new Set(JSON.parse(localStorage.getItem(_CV_KEY) || '[]')); } catch { return new Set(); }
}
function _cvSave() {
  try { localStorage.setItem(_CV_KEY, JSON.stringify([...collapsedVersions])); } catch {}
}
const collapsedVersions = _cvLoad();

// T-202606-104: Modo R eliminado — Colapsar opera solo sobre headers de sección
export function toggleCollapseAll() {
  // T-202605-112: incluir section-group-body para icebox y pendientes
  const bodies = document.querySelectorAll('.version-group-body, .section-group-body');
  const arrows = document.querySelectorAll('.version-collapse-arrow, .section-group-arrow');
  const btn = document.getElementById('bl-collapse-all-btn');
  const label = btn ? btn.querySelector('.bl-collapse-btn-label') : null;
  const icon = btn ? btn.querySelector('.bl-collapse-btn-icon') : null;

  const anySprintExpanded = Array.from(bodies).some(b => !b.classList.contains('collapsed'));

  if (anySprintExpanded) {
    // Colapsar todos los sprints/secciones
    bodies.forEach(b => {
      const id = b.id ? b.id.replace('vbody-', '') : null;
      b.classList.add('collapsed');
      if (id) collapsedVersions.add(id);
    });
    _cvSave();
    arrows.forEach(a => {
      if (a.classList.contains('section-group-arrow')) {
        a.classList.add('collapsed');
      } else {
        a.textContent = '▸';
      }
    });
    if (btn) btn.classList.add('is-collapsed');
    if (label) label.textContent = 'Expandir';
    if (icon) icon.textContent = '⊞';
  } else {
    // Expandir todos los sprints/secciones
    bodies.forEach(b => {
      const id = b.id ? b.id.replace('vbody-', '') : null;
      b.classList.remove('collapsed');
      if (id) collapsedVersions.delete(id);
    });
    _cvSave();
    arrows.forEach(a => {
      if (a.classList.contains('section-group-arrow')) {
        a.classList.remove('collapsed');
      } else {
        a.textContent = '▾';
      }
    });
    if (btn) btn.classList.remove('is-collapsed');
    if (label) label.textContent = 'Colapsar';
    if (icon) icon.textContent = '⊟';
  }
}

// T-202606-087: toggleShowChildren — mostrar/ocultar hijos de Rs en vista árbol
// Persiste en localStorage bajo 'backlog-show-children' ('1' = activo, '0' = inactivo)
// T-202606-103: migrado de .bl-children-wrap → .bl-vl-r-body
export function toggleShowChildren(checked) {
  const childWraps = document.querySelectorAll('.bl-vl-r-body');
  if (checked) {
    childWraps.forEach(w => {
      if (w.children.length > 0) {
        w.classList.remove('collapsed');
      }
    });
  } else {
    childWraps.forEach(w => {
      w.classList.add('collapsed');
    });
  }
  try { localStorage.setItem('backlog-show-children', checked ? '1' : '0'); } catch {}
}

// R-[tmp:toolbar-backlog-redesign]: filtro bloqueados — volátil
let _backlogBlockerFilter = false;
function toggleBacklogBlockerFilter() {
  _backlogBlockerFilter = !_backlogBlockerFilter;
  const btn = document.getElementById('fbar-blocker-btn');
  if (btn) btn.classList.toggle('active', _backlogBlockerFilter);
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-202605-449: filtro por ítems con dependencias bloqueantes activas
// 0 = sin filtro | 1 = solo bloqueados | 2 = solo desbloqueados
let _depsFilter = 0;
function toggleDepsFilter() {
  _depsFilter = (_depsFilter + 1) % 3;
  const btn = document.getElementById('fbar-deps-btn');
  const labels = ['🔗 Deps', '🔒 Bloqueados', '🔓 Libres'];
  if (btn) {
    btn.textContent = labels[_depsFilter];
    btn.classList.toggle('active', _depsFilter > 0);
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-202605-449: helper — ítems con blockedBy[] que aún no están done
export function _hasDepsBlocked(item) {
  if (!item.blockedBy || !item.blockedBy.length) return false;
  return item.blockedBy.some(c => {
    const dep = ITEMS.find(i => i.code === c);
    return !dep || dep.status !== 'done';
  });
}

// T-202604-261: ítem bloqueado — pendiente con sprint asignado y sin cambio de status en >14 días
const _BLOCKED_DAYS = 14;
export function _isBlocked(item) {
  if (!item || item.status !== 'pendiente') return false;
  if (!item.sprint) return false;
  if (!item.statusChangedAt) return false;
  const daysSince = (Date.now() - item.statusChangedAt) / 86400000;
  return daysSince > _BLOCKED_DAYS;
}

// T-202604-259: sin mención en sesión en últimos 14 días — solo pendiente con sprint asignado
const _NO_SESSION_DAYS = 14;
// Wrapper — delega a hasRecentSession() canónica (checkpoint.js)
// B-202604-200: ítems recientes sin mención retornan true via fallback createdAt en hasRecentSession
export function _hasRecentSession(item) {
  if (!item || item.status !== 'pendiente') return true; // no aplica
  if (!item.sprint) return true; // no aplica sin sprint — R-202605-046: campo ausente es canónico, guard 'n/a' eliminado
// guardia — función canónica no disponible
  // R-202605-041: excluir sesiones anteriores al createdAt del ítem al evaluar actividad reciente
  // Ítems legacy sin createdAt → comportamiento anterior sin cambio
  if (item.createdAt) {
    const allSessions = getAllSessions();
    const hasPostCreation = allSessions.some(s =>
      ((s.trackerRefs || []).includes(item.code) || (s.backlogRefs || []).includes(item.code)) &&
      (s.savedAt || 0) >= item.createdAt &&
      (Date.now() - (s.savedAt || 0)) / 86400000 <= _NO_SESSION_DAYS
    );
    return hasPostCreation;
  }
  const _hasRecentSessionCb = _coreCallbacks.hasRecentSession;
  return _hasRecentSessionCb ? _hasRecentSessionCb(item, _NO_SESSION_DAYS) : false;
}

// T-202604-297: prioridad automática desde señales del ítem — retorna 'high' | 'medium' | 'low'
// Reglas en orden de precedencia:
//   1. Tipo B → high
//   2. Sprint activo asignado → high
//   3. Effort 1 + cualquier sprint asignado → high
//   4. Sin sprint + effort 3 → low
//   5. Todo lo demás → medium
export function _calcPriority(item) {
  if (!item) return 'medium';
  const type = (item.code || '')[0];
  if (type === 'B') return 'high';
  if (item.sprint) {
    const sp = (_coreCallbacks.getSprintById || (() => null))(item.sprint);
    // T-202605-529: guard explícita — si el sprint asignado no tiene registro en getSprintById,
    // tratar el ítem como sin sprint asignado y continuar con lógica estándar por effort.
    // No retornar 'high' automáticamente por este caso (comportamiento implícito previo eliminado).
    if (sp === null || sp === undefined) {
      // Sprint asignado pero sin registro → calcular por effort sin elevación por sprint
      if (!item.sprint && parseInt(item.effort) === 3) return 'low';
      return 'medium';
    }
    const sprintIsOpen = sp.status === 'active';
    // B-202605-059: effort 1 → high solo si el sprint está activo — nunca en sprints cerrados
    if (sprintIsOpen) return 'high';
  }
  if (!item.sprint && parseInt(item.effort) === 3) return 'low';
  return 'medium';
}

// T-202604-297: aplicar prioridad calculada a todos los ítems pendientes
function _applyAllPriorities() {
  ITEMS.forEach(item => {
    if (item.status === 'pendiente') {
      item.priority = _calcPriority(item);
    }
  });
}

// T-202604-257: score de relevancia por ítem — retorna 0–100
// Señales: antigüedad, tipo, effort, sprint asignado, última mención en sesión, AC definidos
export function _calcRelevanceScore(item, allSessionsCache) { // B-202605-009: allSessionsCache evita O(n×m)
  if (!item || item.status !== 'pendiente') return 0;

  let score = 0;

  // 1. TIPO — urgencia intrínseca (0–25)
  const typeScores = { B: 25, T: 18, R: 12, P: 6 };
  const type = itemType(item.code) || 'T';
  score += typeScores[type] ?? 10;

  // 2. SPRINT ASIGNADO (0–20)
  if (item.sprint) {
    const sp = (_coreCallbacks.getSprintById || (() => null))(item.sprint);
    if (sp && sp.status === 'active') score += 20;   // sprint activo
    else if (item.sprint)                 score += 6;  // sprint no registrado — heredado de import
  }

  // 3. EFFORT — favorece los fáciles de cerrar (0–15)
  const effortN = parseInt(item.effort) || 2;
  if (effortN === 1) score += 15;
  else if (effortN === 2) score += 8;
  // effort 3 = 0 puntos extra

  // 4. ANTIGÜEDAD — más viejo sube relevancia (0–20)
  if (item.createdAt) {
    const daysSinceCreation = Math.floor((Date.now() - item.createdAt) / 86400000);
    // Escala logarítmica: 0 días=0, 7 días=8, 30 días=14, 90+ días=20
    const ageScore = Math.min(20, Math.round(Math.log1p(daysSinceCreation / 7) * 9));
    score += ageScore;
  }

  // 5. ÚLTIMA MENCIÓN EN SESIÓN — reciente baja relevancia (evita doble trabajo), antigua sube (olvidado)
  // Rango: -10 a +10
  // B-202605-009: allSessionsCache ya calculado en _recalcAllScores — una llamada por ciclo, no una por ítem
  if (allSessionsCache && allSessionsCache.length) {
    let lastMentionTs = 0;
    allSessionsCache.forEach(s => {
      if ((s.backlogRefs || s.trackerRefs || []).includes(item.code)) {
        const ts = s.savedAt || s.createdAt || 0;
        if (ts > lastMentionTs) lastMentionTs = ts;
      }
    });
    if (lastMentionTs) {
      const daysSinceMention = Math.floor((Date.now() - lastMentionTs) / 86400000);
      if (daysSinceMention <= 2)  score -= 10; // trabajado reciente — baja prioridad
      else if (daysSinceMention <= 7)  score += 0;  // neutro
      else if (daysSinceMention <= 14) score += 5;  // algo olvidado
      else                             score += 10; // olvidado — sube
    }
    // Sin mención histórica: +5 (nunca referenciado = posiblemente olvidado desde import)
    else if (item.createdAt) score += 5;
  }

  // 6. AC DEFINIDOS — sin AC baja score (0 o +10)
  if (item.ac && item.ac.length > 0) score += 10;
  else score -= 5; // sin AC no es accionable

  return Math.max(0, Math.min(100, score));
}

// T-202604-257: recalcular score en todos los ITEMS pendientes y estamparlo en item._score
function _recalcAllScores() {
  // B-202605-009: una sola llamada a getAllSessions() por ciclo — no O(n×m)
  const _sessCache = getAllSessions();
  ITEMS.forEach(item => {
    item._score = (item.status === 'pendiente') ? _calcRelevanceScore(item, _sessCache) : 0;
  });
}

// B-202605-210: sanear ítems con status 'pendiente' en sprints cerrados.
// Un ítem pendiente en un sprint cerrado es data inconsistente — el sprint ya no
// puede trabajarse. Se desasigna el sprint (sprint → '') para que vuelva al
// backlog general sin asignar, conservando el status 'pendiente' y el history.
// Retorna la cantidad de ítems saneados para el log.
function _sanitizePendingInClosedSprints() {
  const closedSprintIds = new Set(
    getActiveSprints()
      .filter(s => s.status === 'closed')
      .map(s => s.id)
  );
  if (!closedSprintIds.size) return 0;
  let count = 0;
  ITEMS.forEach(item => {
    if (
      item.status === 'pendiente' &&
      item.sprint &&
      closedSprintIds.has(item.sprint)
    ) {
      if (!item.history) item.history = [];
      item.history.push({
        type: 'sprint',
        ts: Date.now(),
        data: { from: item.sprint, to: null, reason: 'sanitize-closed-sprint' }
      });
      delete item.sprint; // R-202605-046: campo ausente = canónico para "sin sprint"
      count++;
    }
  });
  // Segunda pasada: ítems con doneAt populado pero status pendiente
  // Causa: merge desde CHECKPOINT sobrescribió status sin respetar doneAt existente
  // B-202604-[pendiente-ID]: si el ítem tiene discardReason, el status correcto es 'descartado', no 'done'
  // B-202605-008: snapshot antes de mutar — resultado deshacible via undoBacklog()
  const pendingWithDoneAt = ITEMS.filter(item => item.status === 'pendiente' && item.doneAt);
  if (pendingWithDoneAt.length > 0) _undoSnapshot();
  let revived = 0;
  pendingWithDoneAt.forEach(item => {
      const targetStatus = item.discardReason ? 'descartado' : 'done';
      item.status = targetStatus;
      if (!item.history) item.history = [];
      item.history.push({
        type: 'status',
        ts: Date.now(),
        data: { from: 'pendiente', to: targetStatus, reason: 'sanitize-doneat-mismatch' }
      });
      revived++;
    });
  if (revived > 0) console.log(`[AI Tracker] sanitize-doneat-mismatch: ${revived} ítem(s) con doneAt populado restaurados a status correcto`);
  return count;
}

// T-[pendiente-ID]: Purga inteligente de localStorage — ítems done/descartado >90 días
// Retorna el número de ítems purgados del caché local (no se eliminan de Supabase).
export function _localStorageUsageRatio() {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      total += (localStorage.getItem(k) || '').length;
    }
    // Límite conservador: 4.5MB (localStorage típico es 5MB por origen)
    return total / (4.5 * 1024 * 1024);
  } catch (_) { return 0; }
}

export function _purgeStaleBacklogCache() {
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - NINETY_DAYS_MS;
  const purgeable = ['done', 'descartado'];
  const before = ITEMS.length;

  // B-202605-045: snapshot antes de mutar para que la purga sea deshacible
  _undoSnapshot();

  // Filtrar del array en memoria — Supabase conserva el registro completo
  _setITEMS(ITEMS.filter(item => {
    if (!purgeable.includes(item.status)) return true; // nunca purgar pendientes/en-curso
    const ts = item.statusChangedAt || item.doneAt || 0;
    return ts > cutoff; // conservar si fue cerrado hace menos de 90 días
  }));

  const purged = before - ITEMS.length;
  if (purged > 0) {
    console.log(`[AI Tracker] _purgeStaleBacklogCache: ${purged} ítem(s) purgado(s) del caché local (>90 días done/descartado)`);
    // B-202605-045: persistir tras mutación para que el estado sea consistente
    saveBacklog();
  }
  return purged;
}

// T-[pendiente-ID]: Purge permanente de ítems históricos pre-reset
// Elimina del array en memoria todos los ítems con status 'historico'.
// Acción irreversible (salvo undo inmediato) — requiere confirmación explícita.
function purgeAllHistorico() {
  const historicos = ITEMS.filter(i => i.status === 'historico');
  if (!historicos.length) {
    showToast('info', 'No hay ítems históricos para purgar.');
    return;
  }
  (_coreCallbacks.gconfirmOpen || (() => {}))({
    title: 'Purgar archivo histórico',
    msg: `¿Eliminar permanentemente los ${historicos.length} ítem${historicos.length !== 1 ? 's' : ''} históricos? Esta acción no se puede deshacer después de guardar.`,
    okLabel: 'Purgar',
    danger: true
  }, () => {
    _undoSnapshot();
    const before = ITEMS.length;
    _setITEMS(ITEMS.filter(i => i.status !== 'historico'));
    const purged = before - ITEMS.length;
    saveBacklog();
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
    renderStats();
    console.log(`[AI Tracker] purgeAllHistorico: ${purged} ítem(s) histórico(s) eliminados permanentemente.`);
    showToast('success', `🗑 ${purged} ítem${purged !== 1 ? 's' : ''} histórico${purged !== 1 ? 's' : ''} eliminado${purged !== 1 ? 's' : ''}.`);
  });
}

// R-202605-070: _normalizeItems — función pura que garantiza el contrato de datos de ITEMS
// antes de que cualquier módulo consuma el array.
// Absorbe las responsabilidades de _migrateItemTypes y las migraciones inline de loadBacklog().
// Retorna el array normalizado. No tiene efectos laterales (no escribe en Supabase ni localStorage).
// Toda corrección aplicada se registra en DocLog via _blogLog con el código del ítem afectado.
function _normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  items.forEach(item => {
    // ── schema_version ────────────────────────────────────────────────────────
    // Ítems sin campo → versión 0. Migrar a 1 (schema actual).
    if (item.schema_version === undefined) {
      item.schema_version = 1;
      _blogLog('normalize', item.code || '(sin código)', 'schema_version ausente → 1', 'backlog');
    }

    // ── code ──────────────────────────────────────────────────────────────────
    // code vacío o ausente: conservar ítem, registrar warning. No asignar código aquí
    // (los IDs los asigna Locus). Ítems placeholder ([pendiente-ID], [tmp:slug]) son válidos.
    if (!item.code) {
      _blogLog('normalize-warn', '(sin código)', 'code ausente — ítem conservado sin modificar', 'backlog');
    }

    // ── type ──────────────────────────────────────────────────────────────────
    // Ausente: inferir desde prefijo del code. Default 'T' si no inferible.
    if (!item.type) {
      const firstChar = (item.code || '').charAt(0);
      if ('PTRB'.includes(firstChar)) {
        item.type = firstChar;
        _blogLog('normalize', item.code || '(sin código)', `type inferido desde prefijo → ${item.type}`, 'backlog');
      } else {
        item.type = 'T';
        _blogLog('normalize-warn', item.code || '(sin código)', 'type ausente y no inferible → T (default)', 'backlog');
      }
    }

    // ── status ────────────────────────────────────────────────────────────────
    // ── T-202606-024: migración explícita de status "en curso" ─────────────────
    // "en curso" no es status válido según BR-Ecosystem §5. Migrar a "pendiente"
    // con entrada nominada en DocLog antes de la normalización genérica.
    if (item.status === 'en curso') {
      _blogLog('migrate', item.code || '(sin código)', 'status "en curso" → "pendiente" — no válido según BR-Ecosystem §5', 'backlog');
      item.status = 'pendiente';
    }

    // T-202606-047: normalizeStatus() es el punto canónico — VALID_STATUSES eliminado
    const rawStatus = item.status;
    const normalizedStatus = normalizeStatus(rawStatus, item.type);
    if (item.status !== normalizedStatus) {
      item.status = normalizedStatus;
      _blogLog('normalize', item.code || '(sin código)', `status "${rawStatus}" → "${normalizedStatus}"`, 'backlog');
    }

    // ── title ─────────────────────────────────────────────────────────────────
    // Ausente → '[sin título]'. Migración desc→title si title está vacío.
    if (item.desc !== undefined) {
      if (!item.title || item.title.trim() === '') {
        item.title = item.desc;
        _blogLog('normalize', item.code || '(sin código)', 'desc migrado a title', 'backlog');
      }
      delete item.desc;
    }
    if (!item.title || item.title.trim() === '') {
      item.title = '[sin título]';
      _blogLog('normalize-warn', item.code || '(sin código)', 'title ausente → "[sin título]"', 'backlog');
    }

    // ── id ────────────────────────────────────────────────────────────────────
    // Ítems importados sin id: asignar id interno (no confundir con code).
    if (!item.id) {
      item.id = 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    }

    // ── history ───────────────────────────────────────────────────────────────
    if (!item.history) {
      item.history = [];
      if (item.statusChangedAt) {
        item.history.push({ type: 'status', ts: item.statusChangedAt, data: { to: item.status } });
      }
    }
  });

  // T-202606-084: migración sprint → sprint_id + sprint_name
  // Separa el campo sprint compuesto ('PP-S-01 · Nombre') en dos campos atómicos.
  // Idempotente: ítems ya migrados (sprint_id presente) no se retocan.
  // item.sprint se conserva como alias de solo lectura = sprint_id (AC-4).
  items.forEach(item => {
    // Idempotente: si sprint_id ya existe, skip.
    if (item.sprint_id !== undefined) return;

    const raw = item.sprint; // puede ser string, undefined, null
    if (raw && typeof raw === 'string' && raw.trim() !== '') {
      const idx = raw.indexOf(' · ');
      if (idx !== -1) {
        item.sprint_id   = raw.slice(0, idx);
        item.sprint_name = raw.slice(idx + 3); // ' · ' es 3 chars
      } else {
        item.sprint_id   = raw;
        item.sprint_name = '';
      }
    } else {
      // Sin sprint (icebox canónico = campo ausente o vacío)
      item.sprint_id   = '';
      item.sprint_name = '';
    }

    // AC-4: item.sprint es alias de solo lectura de sprint_id.
    // Se redefine como getter para que cualquier lectura de item.sprint
    // devuelva siempre el valor actual de sprint_id sin duplicar el dato.
    const _id = item.sprint_id;
    Object.defineProperty(item, 'sprint', {
      get() { return this.sprint_id; },
      set(v) { this.sprint_id = v; },
      configurable: true,
      enumerable: true,
    });
    // Sincronizar sprint_id con el valor derivado (el defineProperty ya captó _id,
    // pero sprint_id puede haber sido reescrito — reasignar para consistencia).
    item.sprint_id = _id;

    _blogLog('migrate', item.code || '(sin código)',
      `sprint → sprint_id:"${item.sprint_id}" sprint_name:"${item.sprint_name}"`,
      'backlog');
  });

  // T-202606-038: validar asignación a sprint HOTFIX — solo B con priority: high
  // Cualquier ítem que no cumpla ambas condiciones: sprint limpiado a icebox con DocLog.
  // BR-Core §6: [Prefijo]-S-HOTFIX solo acepta Bs con priority: high.
  items.forEach(item => {
    if (!item.sprint || !item.sprint.endsWith('-S-HOTFIX')) return;
    const isValidB    = item.type === 'B';
    const isValidPrio = item.priority === 'high';
    if (!isValidB || !isValidPrio) {
      const reason = !isValidB
        ? `tipo ${item.type} — S-HOTFIX solo acepta Bs`
        : `priority ${item.priority} — S-HOTFIX solo acepta priority: high`;
      _blogLog(
        'hotfix-rejected',
        item.code || '(sin código)',
        `${item.sprint} rechazado: ${reason} → sprint limpiado a icebox`,
        'backlog'
      );
      delete item.sprint; // icebox canónico = ausencia de campo
    }
  });

  // T-202606-011: R existente sin Ts válidos → convertir a P automáticamente.
  // Se ejecuta sobre el array ya normalizado (types y statuses canónicos).
  // Un R es válido como R solo si tiene al menos un T (no descartado) con parentId apuntando a él.
  // La conversión persiste: _normalizeItems retorna el array mutado → loadBacklog llama saveBacklog().
  // Idempotente: un R ya convertido a P no vuelve a evaluarse (type !== 'R').
  items.forEach(item => {
    if (item.type !== 'R') return;
    if (item.status === 'descartado') return; // Rs descartados no se convierten
    const _hasValidChild = items.some(i =>
      i.type === 'T' && i.parentId === item.code && i.status !== 'descartado'
    );
    if (!_hasValidChild) {
      item.type = 'P';
      item.ac = [];
      _blogLog('r-degradado-a-p', item.code || '(sin código)',
        (item.code || '(sin código)') + ' sin Ts válidos convertido a P — refinar antes de promover',
        'backlog');
    }
  });

  return items;
}

export function loadBacklog() {
  // R-[pendiente-ID]: Supabase-first — si el usuario está autenticado, delegar a
  // _loadFromSupabase() que implementa lógica timestamp-first en su paso 5.
  // Migración one-shot (founder only): si localStorage tiene datos y Supabase está
  // vacío, _loadFromSupabase detecta ITEMS.length === 0 post-carga y no sobreescribe;
  // saveBacklog() al final del flujo empuja los datos locales a Supabase.
  if (typeof _supabase !== 'undefined' && _supabase &&
      typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    // Cargar localStorage como base inmediata (evita flash de backlog vacío)
    const s = localStorage.getItem(_tplKey('backlog-items'));
    if (s) { try { _setITEMS(JSON.parse(s)); } catch { _setITEMS([]); } } else { _setITEMS([]); }
    // Lanzar carga remota en background — _loadFromSupabase re-renderiza al terminar
    _loadFromSupabase();
    // Ejecutar migraciones locales sobre los datos inmediatos mientras Supabase responde
  } else {
    const s = localStorage.getItem(_tplKey('backlog-items'));
    if (s) { try { _setITEMS(JSON.parse(s)); } catch { _setITEMS([]); } } else { _setITEMS([]); }
  }
  // R-202605-070: normalizar contrato de datos antes de cualquier uso downstream.
  // _normalizeItems absorbe: type, status, title/desc, id, history, schema_version.
  _setITEMS(_normalizeItems(ITEMS));

  // B-202605-210: sanear pendientes en sprints cerrados (migración retroactiva)
  const sanitized = _sanitizePendingInClosedSprints();
  if (sanitized > 0) {
    console.log(`[AI Tracker] B-202605-210: ${sanitized} ítem(s) pendiente(s) en sprints cerrados → desasignados`);
  }
  _applyAllPriorities(); // T-202604-297: recalcular prioridad automática al cargar
  _recalcAllScores();    // T-202604-257: estampar score en memoria tras cargar
  // Guardar siempre tras normalización — _normalizeItems puede haber corregido campos
  saveBacklog();
  // AC aria tablist: sincronizar estado inicial de atributos aria desde variables de estado
  _syncViewAriaStates();
}

// T-049: derivar tipo del código
export function itemType(code) {
  const c = (code || '')[0];
  const t = ['I','T','R','B','P'].includes(c) ? c : null;
  return t === 'I' ? 'P' : t; // I es alias de P — normalizado
}

// T-049: toggle filtros tipo
// B-202604-146: reset explícito de filtros de tipo
function clearTypeFilters() {
  activeTypes = new Set(['T','R','B','P']);
  updateTypeFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

export function toggleTypeFilter(type) {
  const allActive = activeTypes.size === 4; // T/R/B/P
  if (allActive) {
    // primer click: desactiva todos, activa solo el clickeado
    activeTypes = new Set([type]);
  } else if (activeTypes.has(type)) {
    // click en activo: si es el único, restaura todos
    if (activeTypes.size === 1) {
      activeTypes = new Set(['T','R','B','P']);
    } else {
      activeTypes.delete(type);
    }
  } else {
    // click en inactivo con otros ya activos: acumula
    activeTypes.add(type);
  }
  updateTypeFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  // T-202604-364: filter-pulse feedback
  requestAnimationFrame(() => {
    document.querySelectorAll('.bl-fc-type-' + type).forEach(el => {
      el.classList.remove('filter-pulse');
      void el.offsetWidth;
      el.classList.add('filter-pulse');
      el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true });
    });
  });
}
function updateTypeFilterUI() {
  if (!document.getElementById('ftype-T')) return; // elementos ftype-* no presentes en el DOM actual
  ['T','R','B','P'].forEach(t => {
    const btn = document.getElementById('ftype-' + t);
    if (btn) {
      const isActive = activeTypes.has(t);
      btn.classList.toggle('active', isActive);
    }
    // chips accionables en stats bar
    const chip = document.querySelector(`.stat-type-chip.tc-${t}`);
    if (chip) chip.classList.toggle('active', activeTypes.has(t));
  });
  // B-UX: indicar visualmente cuando todos los tipos están activos = estado neutro "sin filtro"
  const sTypesEl = document.querySelector('.stat-card.s-types');
  if (sTypesEl) sTypesEl.classList.toggle('s-types--all-active', activeTypes.size === 4);
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
}

// T-049: toggle filtros status
export function toggleStatusFilter(status) {
  if (status === 'done' || status === 'descartado') {
    if (activeStatuses.has(status)) {
      activeStatuses.delete(status);
    } else {
      activeStatuses.add(status);
    }
  } else {
    // pendiente y en-revision: no toggleable a off si es el único activo
    if (activeStatuses.has(status)) {
      if (activeStatuses.size > 1) activeStatuses.delete(status);
    } else {
      activeStatuses.add(status);
    }
  }
  _saveActiveStatuses();
  updateStatusFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  // T-202604-364: filter-pulse feedback
  requestAnimationFrame(() => {
    const btnId = status === 'done' ? 'fstatus-done' : status === 'descartado' ? 'fstatus-descartado' : status === 'en-revision' ? 'fstatus-en-revision' : 'fstatus-pendiente';
    const el = document.getElementById(btnId);
    if (el) { el.classList.remove('filter-pulse'); void el.offsetWidth; el.classList.add('filter-pulse'); el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true }); }
  });
}
export function updateStatusFilterUI() {
  const pendBtn = document.getElementById('fstatus-pendiente');
  if (pendBtn) pendBtn.classList.toggle('active', activeStatuses.has('pendiente'));
  const enRevBtn = document.getElementById('fstatus-en-revision');
  if (enRevBtn) enRevBtn.classList.toggle('active', activeStatuses.has('en-revision'));
  const doneBtn = document.getElementById('fstatus-done');
  if (doneBtn) doneBtn.classList.toggle('active', activeStatuses.has('done'));
  const discBtn = document.getElementById('fstatus-descartado');
  if (discBtn) discBtn.classList.toggle('active', activeStatuses.has('descartado'));
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
}

// T-051: colapso por versión
export function toggleVersionCollapse(v) {
  if (collapsedVersions.has(v)) collapsedVersions.delete(v);
  else collapsedVersions.add(v);
  _cvSave();
  const body = document.getElementById('vbody-' + v);
  const arrow = document.getElementById('varrow-' + v);
  if (body) body.classList.toggle('collapsed', collapsedVersions.has(v));
  if (arrow) arrow.textContent = collapsedVersions.has(v) ? '▸' : '▾';
}

// T-202604-118: generar siguiente código disponible por tipo
// B-202605-ids: acepta reservedCodes (Set) para evitar colisiones dentro de una misma
// pasada de _assignPendingIds — los ítems nuevos aún no están en ITEMS cuando se llama
// en batch, por lo que sin este parámetro todos obtienen el mismo número.
export function _getNextItemCode(typeChar, reservedCodes) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yyyymm = `${year}${month}`;
  const prefix = `${typeChar}-${yyyymm}-`;
  let maxNum = 0;
  ITEMS.forEach(item => {
    if (item.code && item.code.startsWith(prefix)) {
      const numMatch = item.code.match(new RegExp(`${prefix}(\\d{3})`));
      if (numMatch) {
        const num = parseInt(numMatch[1]);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  // B-202605-ids: también considerar códigos ya reservados en esta pasada (no están en ITEMS aún)
  if (reservedCodes && reservedCodes.size) {
    reservedCodes.forEach(rc => {
      if (rc && rc.startsWith(prefix)) {
        const numMatch = rc.match(new RegExp(`${prefix}(\\d{3})`));
        if (numMatch) {
          const num = parseInt(numMatch[1]);
          if (num > maxNum) maxNum = num;
        }
      }
    });
  }
  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${typeChar}-${yyyymm}-${nextNum}`;
}

// Bug B-202604-002: parser estricto — solo acepta ### seguido de código exacto [TIPO]-[YYYYMM]-[NNN]
function parseBacklogMd(text) {
  // T-202606-047: normalizeStatus() es el punto canónico — VALID_STATUSES_PARSE eliminado
  const items = [];
  const itemBlocks = text.split(/\n(?=###\s)/);

  itemBlocks.forEach((block, blockIdx) => {
    try {
      let headerMatch = block.match(/^###\s+([A-Z]-\d{6}-\d{3}(?:-[A-Za-z]+)?)\s+·\s*(.*)/);
      let code, title, needsAutoAssign = false;
      
      if (headerMatch) {
        code = headerMatch[1].trim();
        title = (headerMatch[2] || '').trim() || '(sin título)';
      } else {
        headerMatch = block.match(/^###\s+\[pendiente-ID\]\s+·\s+(.+)/);
        if (!headerMatch) return;
        title = headerMatch[1].trim();
        needsAutoAssign = true;
        code = null;
      }

      const get = (field) => {
        const m = block.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`));
        return m ? m[1].trim() : '';
      };

      const priority = get('Priority') || 'medium';
      const areaRaw  = get('Area') || '';
      // Fix integridad: sanear area si contiene markup de otro campo
      const area     = areaRaw.includes('**') ? areaRaw.split('**')[0].trim() : areaRaw.trim();
      const effort   = parseInt(get('Effort')) || 1;
      const impact   = get('Impact') || 'Medio';
      const status   = normalizeStatus((get('Status') || '').trim(), (get('Type') || code || '').charAt(0) === 'P' ? 'P' : undefined);
      const version  = get('Version') || 'futura';
      const sprint    = get('Sprint') || '';
      const parentId  = get('ParentId') || null;
      const role      = get('Role') || '';
      const discardReason = get('DiscardReason') || '';
      const discardRef    = get('DiscardRef') || '';
      const origin        = get('Origin') || null;

      // desc termina antes de ### Criterios, timestamps o fin de bloque.
      // Los timestamps (CreatedAt/StatusChangedAt/DoneAt) pueden aparecer antes o después del desc
      // según la versión del serializer — el regex los excluye explícitamente para evitar
      // que se acumulen en item.desc entre exports.
      const descMatch = block.match(/\*\*Version:\*\*[^\n]*\n+([\s\S]*?)(?=###\s*Criterios|\*\*CreatedAt:\*\*|\*\*StatusChangedAt:\*\*|\*\*DoneAt:\*\*|\*\*Notes:\*\*|$)/);
      const desc = descMatch ? descMatch[1].trim() : '';

      // B-202604-1001: detectar encabezado ### o formato **Criterios de aceptación:**
      const acMatch = block.match(/###\s*Criterios de aceptaci[oó]n\s*\n([\s\S]*?)(?=\n---|\n###|$)/)
                   || block.match(/\*\*Criterios de aceptaci[oó]n:\*\*\s*\n([\s\S]*?)(?=\n---|\n###|\n\*\*[A-Z]|$)/);
      const ac = [];
      if (acMatch) {
        acMatch[1].split('\n').forEach(l => {
          const m = l.match(/^-\s+\[[ x]\]\s+(.+)/);
          if (m) ac.push(m[1].trim());
        });
      }

      const createdAt      = parseInt(get('CreatedAt')) || null;
      const statusChangedAt = parseInt(get('StatusChangedAt')) || null;
      const doneAt          = parseInt(get('DoneAt')) || null;

      // T-202604-288: blockedBy — array de códigos
      const blockedByRaw = get('BlockedBy') || '';
      const blockedBy = blockedByRaw ? blockedByRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

      // R-202604-051: blocking — boolean, default false
      const blockingRaw = (get('Blocking') || '').toLowerCase();
      const blocking = blockingRaw === 'true' || blockingRaw === '1';

      // Leer notes: bloque después de ### Criterios (o ac) hasta fin o ---
      const notesMatch = block.match(/\*\*Notes:\*\*\s*(.+)/);
      const notes = notesMatch ? notesMatch[1].trim() : '';

      // T-202605-486: leer campo Archivos si existe
      const archivosRaw = get('Archivos') || '';
      const archivos = archivosRaw ? archivosRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

      items.push({ code, title, desc, priority, area, effort, impact, status, version, sprint, parentId: parentId || null, role: role || '', origin: origin || null, ac, notes, archivos, needsAutoAssign, discardReason, discardRef, createdAt, statusChangedAt, doneAt, blockedBy, blocking: blocking || false });
    } catch (err) {
      console.error('[AI Tracker] parseBacklogMd block ' + blockIdx + ' error:', err.message);
      console.error('[AI Tracker] block content (primeros 200 chars):', block.substring(0, 200));
    }
  });

  return items;
}

// T-048+T-050: parsear metadata del Backlog.md
function parseBacklogMeta(text) {
  const version = (text.match(/Versión del backlog\s*\|\s*([^\n|]+)/) || [])[1]?.trim() || '';
  const updated = (text.match(/Última actualización\s*\|\s*([^\n|]+)/) || [])[1]?.trim() || '';
  return { version, updated };
}

// T-050: tiempo relativo con granularidad h/m
function relativeImportTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  if (hours < 24) {
    const remMins = mins % 60;
    return remMins > 0 ? `hace ${hours}h ${remMins}m` : `hace ${hours}h`;
  }
  const remHours = hours % 24;
  return remHours > 0 ? `hace ${days}d ${remHours}h` : `hace ${days}d`;
}

// B-202606-032: helper compartido — mismo filtro que countableItems en renderStats()
// Excluye: históricos, descartados, ítems de sprints cerrados, done+icebox
function _getCountableForBanner() {
  const closedSprintIds = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  return ITEMS.filter(i =>
    _isCountableItem(i) &&
    i.status !== 'descartado' &&
    i.status !== 'historico' &&
    !(i.sprint && closedSprintIds.has(i.sprint)) &&
    !(i.status === 'done' && (!i.sprint || i.sprint === 'icebox'))
  );
}

// T-048: actualizar banner
export function updateBacklogBanner() {
  const banner    = document.getElementById('backlog-meta-banner');
  const exportBtn = document.getElementById('export-backlog-btn');
  const gfItems   = document.getElementById('gf-items');
  const gfToggle  = document.getElementById('gf-footer-toggle');
  // B-fix-T202606-197: _coreCallbacks.getActiveProjectFilter nunca registrado post T-202606-197 — leer localStorage directamente
  const _bannProjId = localStorage.getItem('current-project-filter') || '';
  if (!_bannProjId || !ITEMS.length) {
    // B-202606-008: misma lógica que renderStats — forzar recarga si hay proyecto activo con ITEMS vacío
    if (_bannProjId && !ITEMS.length) { loadBacklog(); }
    if (!_bannProjId || !ITEMS.length) {
      if (banner)    banner.classList.remove('visible');
      if (exportBtn) exportBtn.classList.add("is-hidden");
      if (gfItems)   gfItems.classList.add('is-hidden');
      if (gfToggle)  gfToggle.classList.add('is-hidden');
      return;
    }
  }
  if (banner) banner.classList.add('visible');
  // Mostrar botón exportar solo si estamos en tab backlog
  if (exportBtn && typeof currentTab !== 'undefined' && currentTab === 'backlog') exportBtn.classList.remove("is-hidden")

  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('bmeta-version', meta.version || '—');
  // T-202606-099: badge de conteo en gf-* — misma lógica que bmeta-total
  // B-202606-032: usar _getCountableForBanner() — excluye históricos, descartados y sprints cerrados
  const _countForBanner = _getCountableForBanner().length;
  const label = _countForBanner + ' ítem' + (_countForBanner !== 1 ? 's' : '');
  if (gfItems)  { gfItems.textContent = label; gfItems.classList.remove('is-hidden'); }
  if (gfToggle) gfToggle.classList.remove('is-hidden');
}

// Actualizar el indicador de importado cada minuto
setInterval(() => {
  if (typeof currentTab !== 'undefined' && currentTab === 'backlog') updateBacklogBanner();
}, 60000);

export function importBacklog(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target.result;
      console.log('[AI Tracker] importBacklog: iniciando, texto length:', text.length);
      const parsed = parseBacklogMd(text);
      console.log('[AI Tracker] importBacklog: parseado', parsed.length, 'ítems');
      if (!parsed.length) { 
        console.error('[AI Tracker] Parse falló: sin ítems válidos');
        showToast('error', 'No se encontraron ítems válidos en el archivo.'); 
        return; 
      }
      
      console.log('[AI Tracker] importBacklog: procesando ítems...');
      let autoAssigned = 0;
      parsed.forEach(newItem => {
        // B-202604-193: ignorar silenciosamente ítems históricos en importación
        if (newItem.status === 'historico') return;
        if (newItem.needsAutoAssign && !newItem.code) {
          let typeChar = 'T';
          if (newItem.area && (newItem.area.includes('Bug') || newItem.area.includes('bug'))) typeChar = 'B';
          else if (newItem.area && (newItem.area.includes('Requerimiento') || newItem.area.includes('Feature') || newItem.area.includes('Epic'))) typeChar = 'R';
          else if (newItem.priority === 'pendiente') typeChar = 'I';
          newItem.code = _getNextItemCode(typeChar);
          autoAssigned++;
        }
        const idx = ITEMS.findIndex(i => i.code === newItem.code);
        if (idx >= 0) {
          // B-192: no sobreescribir ítems done/descartados en memoria con versión no-done del archivo
          const inMemory = ITEMS[idx];
          if (inMemory.status === 'descartado' && newItem.status !== 'descartado') return;
          if (inMemory.status === 'done' && newItem.status === 'pendiente') return;
          ITEMS[idx] = newItem;
        } else {
          // No agregar al backlog ítems descartados que no existen en memoria
          if (newItem.status === 'descartado') return;
          ITEMS.push(newItem);
        }
      });
      
      // T-202606-074: herencia de sprint parent R → Ts hijos post-merge
      // AC-1: R que cambia de icebox a sprint real propaga a Ts hijos con sprint: icebox
      // AC-2: T con sprint distinto al parent declarado en el mismo CHECKPOINT → se corrige al del parent
      // AC-3: R que migra de sprint A a sprint B → todos sus Ts hijos migran también
      // AC-4: Ts con status done no se modifican
      (function _propagateSprintToChildren() {
        // Construir mapa rCode → sprint del R tras el merge
        const rSprintMap = {};
        ITEMS.forEach(item => {
          if (item.code && item.code[0] === 'R' && item.status !== 'descartado') {
            rSprintMap[item.code] = item.sprint || 'icebox';
          }
        });
        // Segunda pasada: corregir Ts hijos cuyo sprint difiere del parent R
        ITEMS.forEach(item => {
          if (!item.parentId) return;
          if (item.code && item.code[0] !== 'T') return;
          // AC-4: Ts done no se modifican
          if (item.status === 'done') return;
          const parentSprint = rSprintMap[item.parentId];
          if (parentSprint === undefined) return; // parent no encontrado — no modificar
          const currentSprint = item.sprint || 'icebox';
          if (currentSprint !== parentSprint) {
            _blogLog('sprint-heredado', item.code,
              item.code + ' sprint ajustado al de su parent ' + item.parentId + ': ' + parentSprint + ' (post-import)',
              'backlog');
            item.sprint = parentSprint;
          }
        });
      })();
      console.log('[AI Tracker] importBacklog: items merged en ITEMS, total:', ITEMS.length);
      
      const meta = parseBacklogMeta(text);
      meta.importedAt = Date.now();
      const countersMatch = text.match(/Contadores:\s*P=(\d+)\s*\|\s*T=(\d+)\s*\|\s*R=(\d+)\s*\|\s*B=(\d+)/);
      if (countersMatch) {
        meta.counters = { P: parseInt(countersMatch[1]), T: parseInt(countersMatch[2]), R: parseInt(countersMatch[3]), B: parseInt(countersMatch[4]) };
      }
      
      console.log('[AI Tracker] importBacklog: intentando setItem backlog-meta...');
      try {
        localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
        console.log('[AI Tracker] importBacklog: ✓ backlog-meta guardado');
      } catch (err) {
        console.error('[AI Tracker] importBacklog: ERROR setItem backlog-meta:', err.name, err.message);
        throw err;
      }
      
      // NO guardar backlog-raw en localStorage (muy pesado) — solo en Firestore si disponible
      console.log('[AI Tracker] importBacklog: backlog-raw no se guarda en localStorage (solo ítems parsedos)');

      console.log('[AI Tracker] importBacklog: llamando saveBacklog()...');
      try {
        await saveBacklog();
        console.log('[AI Tracker] importBacklog: ✓ saveBacklog() completado');
      } catch (saveErr) {
        console.error('[AI Tracker] importBacklog: saveBacklog() error:', saveErr.name, saveErr.message);
        throw saveErr;
      }

      // T-049: mostrar filtros
      const ftypes = document.getElementById('filter-bar-types');
      const fstatus = document.getElementById('filter-bar-status');
      if (ftypes) ftypes.classList.remove('is-hidden');
      if (fstatus) fstatus.classList.remove('is-hidden');

      updateBacklogBanner();
      updateStatusFilterUI();
      renderStats();
      window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
      window.dispatchEvent(new CustomEvent('shell:backlog-footer-update'));
      window.dispatchEvent(new CustomEvent('shell:backlog-modified'));
      // Toast enriquecido con pills de color por tipo y sprint
      const TYPE_COLORS_TOAST = { B:'#e85555', T:'#2ecc78', R:'#38bdf8', I:'#7c6af7', P:'#7c6af7' };
      const byTypeTst = { B:0, T:0, R:0, I:0, P:0 };
      const sprintsTst = new Set();
      parsed.forEach(it => {
        const tc = it.code ? it.code[0] : 'T';
        if (byTypeTst[tc] !== undefined) byTypeTst[tc]++;
        if (it.sprint) sprintsTst.add(it.sprint);
      });
      const pillsHtml = ['R','T','B','I']
        .filter(t => byTypeTst[t] > 0)
        .map(t => '<span class="toast-type-pill" style="--toast-type-color:' + TYPE_COLORS_TOAST[t] + '">' + t + ' ' + byTypeTst[t] + '</span>')
        .join(' ');
      const sprintHtml = sprintsTst.size
        ? '<span class="toast-sprint-pill">' + [...sprintsTst].join(', ') + '</span>'
        : '';
      const autoHtml = autoAssigned ? '<div class="toast-auto-hint">' + autoAssigned + ' ID' + (autoAssigned !== 1 ? 's' : '') + ' auto-asignado' + (autoAssigned !== 1 ? 's' : '') + '</div>' : '';
      const toastMsg = '<div class="toast-import-title">✓ ' + parsed.length + ' ítem' + (parsed.length !== 1 ? 's' : '') + ' importado' + (parsed.length !== 1 ? 's' : '') + '</div><div class="toast-import-pills">' + pillsHtml + (sprintHtml ? ' ' + sprintHtml : '') + '</div>' + autoHtml;
      showToast('success', toastMsg, null, 5000);
      window.dispatchEvent(new CustomEvent('shell:backlog-subtab-update', { detail: { tab: 'backlog' } })); // ocultar botón importar tras bootstrap exitoso
    } catch(err) {
      console.error('[AI Tracker] importBacklog CATCH:', err.name, '—', err.message, err.stack);
      const errMsg = err.name === 'QuotaExceededError' 
        ? 'Almacenamiento lleno. Limpia sesiones archivadas o usa Firebase.' 
        : (err.message || 'Error desconocido');
      showToast('error', '❌ Error al importar: ' + errMsg);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function badgeClass(p) {
  return {high:'badge-high', medium:'badge-medium', low:'badge-low',
          critical:'badge-high', important:'badge-high', mejora:'badge-medium',
          futura:'badge-low'}[p] || 'badge-area';
}
function badgeLabel(p) {
  return {high:'Alto', medium:'Medio', low:'Bajo',
          critical:'Alto', important:'Alto', mejora:'Medio', futura:'Bajo'}[p] || p;
}
function statusClass(s) {
  // B-202605-229: historico agregado como status canónico
  // T-202605-040: en-revision agregado como status canónico
  return {'pendiente':'badge-status-backlog','en-revision':'badge-status-en-revision','done':'badge-status-done','descartado':'badge-status-descartado','historico':'badge-status-historico'}[s] || 'badge-status-backlog';
}
function statusLabel(s) {
  // B-202605-229: historico agregado como status canónico
  // T-202605-040: en-revision agregado como status canónico
  return {'pendiente':'Pendiente','en-revision':'En revisión','done':'Hecho','descartado':'Descartado','historico':'Histórico'}[s] || s;
}

// B-245: helper para obtener el aiId de la sesión activa al momento de registrar en history[]
export function _getActiveSessionAiId() {
  const _st = getState();
  if (!_st) return null;
  const ai = (_st.ais || []).find(a => !a.archived && _isInSession(a));
  return ai ? ai.id : null;
}

// T-202604-066: cambio de status inline
export function setItemStatus(code, newStatus) {
  const item = ITEMS.find(i => i.code === code);
  if (!item || item.status === newStatus) return;

  // Descarte: siempre requiere confirmación
  if (newStatus === 'descartado') {
    // Resetear el select visualmente antes de que el modal confirme
    _resetStatusSelect(code, item.status);
    (_coreCallbacks.confirmDiscard || (() => {}))(code, '', '');
    return;
  }

  // Retroceso done → pendiente/backlog: requiere confirmación
  if (item.status === 'done' && (newStatus === 'pendiente' || newStatus === 'backlog' || newStatus === 'in-progress')) {
    _resetStatusSelect(code, item.status);
    (_coreCallbacks.confirmRetroceso || (() => {}))(code, newStatus);
    return;
  }

  // T-202605-449: advertir si se marca done con bloqueadores pendientes — no bloquea la acción
  if (newStatus === 'done' && _hasDepsBlocked(item)) {
    const pendingBlockers = (item.blockedBy || []).filter(c => {
      const dep = ITEMS.find(i => i.code === c);
      return !dep || dep.status !== 'done';
    });
    const msg = pendingBlockers.length === 1
      ? `⚠ ${pendingBlockers[0]} aún pendiente — ¿marcar done igual?`
      : `⚠ ${pendingBlockers.length} bloqueadores pendientes — ¿marcar done igual?`;
    // T-202605-008: reemplazar confirm() nativo por _gconfirmOpen
    const prevStatus = item.status;
    _resetStatusSelect(code, prevStatus);
    (_coreCallbacks.gconfirmOpen || (() => {}))({
      msg,
      danger: false,
      okLabel: 'Marcar done',
      onConfirm: () => _applyStatusChange(code, newStatus, prevStatus),
      onCancel: () => {}
    });
    return;
  }

  // T-A4b: marcar done en sprint activo — inline confirm no-bloqueante (Variante B)
  if (newStatus === 'done') {
    const activeSprint = (_coreCallbacks.getActiveSprint || (() => null))();
    const itemInActiveSprint = activeSprint && item.sprint && item.sprint === activeSprint.id;
    if (itemInActiveSprint) {
      _showInlineConfirmDone(code);
      return;
    }
  }

  const _prevStatus = item.status;
  _applyStatusChange(code, newStatus, _prevStatus);
}

// T-202606-027: C8 — animación de salida extraída para evitar duplicación entre _applyStatusChange y _applyDoneStatus
function _applyExitAnimOrRender(code) {
  if (!activeStatuses.has('done')) {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.classList.add('item-exit-anim');
      setTimeout(() => { window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty')); renderStats(); window.dispatchEvent(new CustomEvent('shell:sprint-render')); }, 360); // T-202605-058 T-202605-044
      return;
    }
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  renderStats();
  window.dispatchEvent(new CustomEvent('shell:sprint-render')); // T-202605-058 T-202605-044
}

// B-202606-039: transiciones automáticas de status en R padre al avanzar T hijo
// B-202606-040: retroceso en-revision → en-proceso cuando T hijo sale de done
// Reglas (BR-Ecosystem §5):
//   pendiente → en-proceso: cuando cualquier T hijo cambia desde pendiente a cualquier status ≠ descartado
//   en-proceso → en-revision: cuando todos los Ts hijos no-descartados están done
//   en-revision → en-proceso: cuando un T hijo retrocede de done — ya no todos los hijos están done
// Idempotente: no modifica R en done/descartado. T descartado ignorado en todas las transiciones.
// Batch-safe: evalúa el estado completo de hijos en el momento de la llamada — no acumula.
function _syncParentRStatus(changedItemCode, newTStatus) {
  // Solo aplica cuando el ítem que cambió es un T con parentId
  const changedItem = ITEMS.find(i => i.code === changedItemCode);
  if (!changedItem || changedItem.type !== 'T' || !changedItem.parentId) return;

  const parent = ITEMS.find(i => i.code === changedItem.parentId && i.type === 'R');
  if (!parent) return;

  // AC-5 (B-039): R ya en done o descartado — no modificar
  if (parent.status === 'done' || parent.status === 'descartado') return;

  // Obtener todos los Ts hijos del R, excluyendo descartados
  const activeSiblings = ITEMS.filter(i =>
    i.type === 'T' && i.parentId === parent.code && i.status !== 'descartado'
  );

  // AC-4 (B-039): R sin Ts activos — no ejecutar ninguna transición
  if (activeSiblings.length === 0) return;

  const prevParentStatus = parent.status;
  const allDone = activeSiblings.every(i => i.status === 'done');

  // AC-2 (B-039): → en-revision — todos los Ts activos están done
  if (allDone) {
    if (parent.status !== 'en-revision') {
      parent.status = 'en-revision';
      parent.statusChangedAt = Date.now();
      if (!parent.history) parent.history = [];
      parent.history.push({ type: 'status', ts: parent.statusChangedAt, data: { from: prevParentStatus, to: 'en-revision', reason: 'auto-all-children-done' } });
      _blogLog('status-auto →', parent.code, prevParentStatus + ' → en-revision (todos los Ts hijos done)', 'backlog');
    }
    return;
  }

  // B-202606-040: en-revision → en-proceso — algún T retrocedió de done, ya no todos están done
  if (parent.status === 'en-revision') {
    parent.status = 'en-proceso';
    parent.statusChangedAt = Date.now();
    if (!parent.history) parent.history = [];
    parent.history.push({ type: 'status', ts: parent.statusChangedAt, data: { from: 'en-revision', to: 'en-proceso', reason: 'auto-child-retroceded' } });
    _blogLog('status-auto →', parent.code, 'en-revision → en-proceso (T hijo retrocedió de done)', 'backlog');
    return;
  }

  // AC-1 (B-039): pendiente → en-proceso — el T que cambió salió de pendiente y no es descartado
  if (parent.status === 'pendiente' && newTStatus !== 'descartado') {
    parent.status = 'en-proceso';
    parent.statusChangedAt = Date.now();
    if (!parent.history) parent.history = [];
    parent.history.push({ type: 'status', ts: parent.statusChangedAt, data: { from: 'pendiente', to: 'en-proceso', reason: 'auto-child-advanced' } });
    _blogLog('status-auto →', parent.code, 'pendiente → en-proceso (T hijo avanzó)', 'backlog');
  }
}

// T-202605-008: lógica de mutación extraída para ser llamada desde _gconfirmOpen y flujo directo
function _applyStatusChange(code, newStatus, prevStatus) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  item.status = newStatus;
  item.statusChangedAt = Date.now();
  if (newStatus === 'done' && !item.doneAt) item.doneAt = Date.now();
  // B-[tmp:closed-version]: persistir versión activa al cerrar ítem
  if (newStatus === 'done' || newStatus === 'descartado') {
    item.closedInVersion = _effectiveVersion();
  }
  // Capa 2 — done+icebox: alerta informativa per BR-Ecosystem §5 (suave — no bloquea)
  if (newStatus === 'done' && (!item.sprint || item.sprint === 'icebox')) {
    setTimeout(() => showToast('warning', `${code} marcado done sin sprint asignado — asignar a sprint para trazabilidad correcta.`, null, 6000), 400);
  }
  // R-202604-015: registrar cambio en history[]
  if (!item.history) item.history = [];
  item.history.push({ type: 'status', ts: item.statusChangedAt, aiId: _getActiveSessionAiId() || undefined, data: { from: prevStatus, to: newStatus, role: item.role || '' } });
  if (newStatus === 'pendiente') item.priority = _calcPriority(item); // T-202604-297
  _recalcAllScores(); // T-202604-257: recalcular scores tras cambio de status
  // B-202606-039: sincronizar status del R padre si el ítem cambiado es un T hijo
  _syncParentRStatus(code, newStatus);
  // R-202604-051 + T-202605-449: al marcar done, notificar ítems que quedaron desbloqueados
  if (newStatus === 'done') {
    const nowUnblocked = [];
    ITEMS.forEach(dep => {
      if (dep.status === 'pendiente' && dep.blockedBy && dep.blockedBy.includes(code)) {
        if (!dep.history) dep.history = [];
        dep.history.push({ type: 'unblocked', ts: Date.now(), data: { by: code } });
        // Verificar si con este done el ítem queda completamente desbloqueado
        const stillBlocked = dep.blockedBy.filter(c => {
          if (c === code) return false; // este acaba de hacerse done
          const blocker = ITEMS.find(i => i.code === c);
          return !blocker || blocker.status !== 'done';
        });
        if (stillBlocked.length === 0) nowUnblocked.push(dep.code);
      }
    });
    if (nowUnblocked.length) {
      const label = nowUnblocked.length === 1
        ? `🔓 ${nowUnblocked[0]} desbloqueado`
        : `🔓 ${nowUnblocked.length} ítems desbloqueados: ${nowUnblocked.join(', ')}`;
      setTimeout(() => showToast('success', label, null, 4000), 400);
    }
  }
  _undoSnapshot();
  _blogLog('status →', code, prevStatus + ' → ' + newStatus, 'backlog');
  saveBacklog();
  // C8: animación salida delegada — T-202606-027
  if (newStatus === 'done') _applyExitAnimOrRender(code);
  else { window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty')); renderStats(); window.dispatchEvent(new CustomEvent('shell:sprint-render')); }
}

function _resetStatusSelect(code, currentStatus) {
  // Resetea el select al valor actual mientras el modal está abierto
  const selects = document.querySelectorAll('.item-status-select');
  selects.forEach(sel => {
    if (sel.getAttribute('onchange') && sel.getAttribute('onchange').includes("'" + code + "'")) {
      sel.value = currentStatus;
    }
  });
}

// T-A4b: inline confirm no-bloqueante para marcar done un ítem en sprint activo
function _showInlineConfirmDone(code) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  // Resetear select visualmente mientras el confirm está visible
  _resetStatusSelect(code, item.status);

  // T-202605-013: buscar en vista lista (.item) y vista Kanban (.kb-card) — independientes
  const itemEl = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`)
               || document.querySelector(`.kb-card[data-code="${CSS.escape(code)}"]`);
  if (!itemEl) {
    // Fallback: si no hay elemento en DOM, aplicar directamente
    _applyDoneStatus(code);
    return;
  }

  // Limpiar confirm previo si existe en este elemento
  const existing = itemEl.querySelector('.item-inline-confirm');
  if (existing) existing.remove();

  // Construir los botones inline
  const confirmEl = document.createElement('div');
  confirmEl.className = 'item-inline-confirm';
  confirmEl.innerHTML =
    `<button class="item-inline-confirm__accept" data-code="${code}">Marcar done</button>` +
    `<button class="item-inline-confirm__cancel" data-code="${code}">Cancelar</button>`;

  itemEl.appendChild(confirmEl);

  // Trigger de entrada con requestAnimationFrame para que la transición CSS aplique
  requestAnimationFrame(() => {
    requestAnimationFrame(() => confirmEl.classList.add('is-visible'));
  });

  // Auto-cancelación a 6s
  const autoCancel = setTimeout(() => _dismissInlineConfirm(itemEl, code), 6000);

  confirmEl.querySelector('.item-inline-confirm__accept').addEventListener('click', () => {
    clearTimeout(autoCancel);
    _dismissInlineConfirm(itemEl, code);
    _applyDoneStatus(code);
  });

  confirmEl.querySelector('.item-inline-confirm__cancel').addEventListener('click', () => {
    clearTimeout(autoCancel);
    _dismissInlineConfirm(itemEl, code);
  });
}

function _dismissInlineConfirm(itemEl, code) {
  const confirmEl = itemEl && itemEl.querySelector('.item-inline-confirm');
  if (!confirmEl) return;
  confirmEl.classList.remove('is-visible');
  // Remover del DOM tras la transición de salida — fallback si transitionend no dispara (B-202605-006)
  const fallback = setTimeout(() => confirmEl.remove(), 400);
  confirmEl.addEventListener('transitionend', () => { clearTimeout(fallback); confirmEl.remove(); }, { once: true });
}

// T-A4b: micro-flash Variante A — cambio inmediato sin confirmación
function _flashStatusConfirmed(code) {
  const itemEl = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
  if (!itemEl) return;
  itemEl.classList.remove('item-status-confirmed');
  // Forzar reflow para reiniciar la animación si ya estaba activa
  void itemEl.offsetWidth;
  itemEl.classList.add('item-status-confirmed');
  itemEl.addEventListener('animationend', () => itemEl.classList.remove('item-status-confirmed'), { once: true });
}

// T-A4b: aplica el cambio de status a done — ejecutado tras confirmación inline o directo en Variante A
export function _applyDoneStatus(code) {
  const item = ITEMS.find(i => i.code === code);
  if (!item || item.status === 'done') return;

  const _prevStatus = item.status;
  item.status = 'done';
  item.statusChangedAt = Date.now();
  if (!item.doneAt) item.doneAt = Date.now();
  item.closedInVersion = _effectiveVersion();
  // Capa 2 — done+icebox: alerta informativa per BR-Ecosystem §5 (suave — no bloquea)
  if (!item.sprint || item.sprint === 'icebox') {
    setTimeout(() => showToast('warning', `${code} marcado done sin sprint asignado — asignar a sprint para trazabilidad correcta.`, null, 6000), 400);
  }
  if (!item.history) item.history = [];
  item.history.push({ type: 'status', ts: item.statusChangedAt, aiId: _getActiveSessionAiId() || undefined, data: { from: _prevStatus, to: 'done', role: item.role || '' } });
  _recalcAllScores();

  // Notificar ítems desbloqueados
  const nowUnblocked = [];
  ITEMS.forEach(dep => {
    if (dep.status === 'pendiente' && dep.blockedBy && dep.blockedBy.includes(code)) {
      if (!dep.history) dep.history = [];
      dep.history.push({ type: 'unblocked', ts: Date.now(), data: { by: code } });
      const stillBlocked = dep.blockedBy.filter(c => {
        if (c === code) return false;
        const blocker = ITEMS.find(i => i.code === c);
        return !blocker || blocker.status !== 'done';
      });
      if (stillBlocked.length === 0) nowUnblocked.push(dep.code);
    }
  });
  if (nowUnblocked.length) {
    const label = nowUnblocked.length === 1
      ? `🔓 ${nowUnblocked[0]} desbloqueado`
      : `🔓 ${nowUnblocked.length} ítems desbloqueados: ${nowUnblocked.join(', ')}`;
    setTimeout(() => showToast('success', label, null, 4000), 400);
  }

  _undoSnapshot();
  _blogLog('status →', code, _prevStatus + ' → done', 'backlog');
  saveBacklog();

  // Micro-flash Variante A/B antes de que el render remueva el elemento
  _flashStatusConfirmed(code);

  // C8: animación salida delegada — T-202606-027
  _applyExitAnimOrRender(code);
}
export function effortDots(n) {
  let h = '';
  for (let i = 0; i < 3; i++) h += `<div class="effort-dot${i < n ? ' filled' : ''}"></div>`;
  return h;
}

// Lógica R-con-hijos: si un R tiene hijos → no contable (se cuentan los hijos). R sin hijos → contable.
export function _isCountableItem(i) {
  const rCodesWithChildren = new Set(ITEMS.filter(x => x.parentId).map(x => x.parentId));
  if (itemType(i.code) === 'P') return false; // P (posibilidades) no contaminan contadores de trabajo activo
  return !(itemType(i.code) === 'R' && rCodesWithChildren.has(i.code));
}

export function renderStats() {
  // B-fix-T202606-197: _coreCallbacks.getActiveProjectFilter nunca registrado post T-202606-197 — leer localStorage directamente
  const _rsProjId = localStorage.getItem('current-project-filter') || '';
  if (!_rsProjId) { document.getElementById('stats-bar').innerHTML = ''; return; }
  // B-202606-008: ITEMS puede estar vacío si el módulo cargó antes de que loadBacklog() corriera.
  // Forzar recarga cuando hay proyecto activo con ITEMS vacío — evita que stats-bar se limpie en carga inicial.
  if (!ITEMS.length) { loadBacklog(); }
  if (!ITEMS.length) { document.getElementById('stats-bar').innerHTML = ''; return; }

  // Delegation para stats-bar — se registra una sola vez
  const statsBarEl = document.getElementById('stats-bar');
  if (statsBarEl && !statsBarEl._delegationAttached) {
    statsBarEl._delegationAttached = true;
    statsBarEl.addEventListener('click', function _statsBarClick(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const act = btn.dataset.action;
      if (act === 'stats-clear-types') {
        clearTypeFilters();
      } else if (act === 'stats-type-filter') {
        toggleTypeFilter(btn.dataset.type);
      } else if (act === 'stats-priority-filter') {
        window.dispatchEvent(new CustomEvent('shell:togglePriorityFilter', { detail: { val: btn.dataset.priority } }));
      } else if (act === 'stats-effort-filter') {
        toggleEffortFilter(parseInt(btn.dataset.effort, 10));
      } else if (act === 'stats-effort-missing') {
        toggleBacklogBlockerFilter();
        toggleEffortFilter(0);
      } else if (act === 'stats-role-filter') {
        toggleRoleFilter(btn.dataset.role);
      }
    });
  }

  // T-202604-106: excluir ítems de sprints cerrados del módulo principal
  const closedSprintIds = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  const isInClosedSprint = i => i.sprint && closedSprintIds.has(i.sprint);

  const _countable = i => _isCountableItem(i);

  const countableItems = ITEMS.filter(i => _countable(i) && !isInClosedSprint(i) && i.status !== 'descartado' && i.status !== 'historico'
    && !(i.status === 'done' && (!i.sprint || i.sprint === 'icebox'))); // Capa 3 — done+icebox no contabiliza per BR-Ecosystem §5

  // B-202605-205: incluir búsqueda activa — los contadores deben reflejar
  // los mismos ítems que aparecen en la lista, incluyendo el filtro de búsqueda.
  const _q = (backlogSearchQuery || '').trim().toLowerCase();
  const _matchesSearch = _q
    ? i => i.code.toLowerCase().includes(_q) || (i.title || '').toLowerCase().includes(_q) || (i.area || '').toLowerCase().includes(_q)
    : () => true;

  const visible = countableItems.filter(i => {
    const type = itemType(i.code);
    const typeOk = type ? activeTypes.has(type) : true;
    const statusOk = activeStatuses.has(i.status);
    return typeOk && statusOk && _matchesSearch(i);
  });

  // Por prioridad (sobre visibles)
  const c = {high:0, medium:0, low:0};
  visible.forEach(i => {
    const p = i.priority;
    if (p === 'high' || p === 'important' || p === 'critical' || p === 'importante') c.high++;
    else if (p === 'low' || p === 'futura' || p === 'baja') c.low++;
    else c.medium++;
  });

  // Por tipo (sobre visibles)
  const byType = {B:0, T:0, R:0, P:0};
  visible.forEach(i => { const t = itemType(i.code); if (t && byType[t] !== undefined) byType[t]++; });

  // Por effort (sobre visibles)
  const byEffort = {1:0, 2:0, 3:0};
  visible.forEach(i => { const e = parseInt(i.effort)||1; if (byEffort[e] !== undefined) byEffort[e]++; });
  // R-202605-122 AC5: contador de ítems sin effort (excluye P e históricos)
  const noEffortCount = countableItems.filter(i => !i.effort && itemType(i.code) !== 'P' && i.status !== 'historico').length;

  // T-202606-096: universo canónico — activos = countableItems (pendiente + en-revision + done)
  const backlogCount    = countableItems.filter(i => i.status === 'pendiente').length;
  const enRevisionCount = countableItems.filter(i => i.status === 'en-revision').length;
  const done            = countableItems.filter(i => i.status === 'done').length;
  const total = backlogCount + enRevisionCount + done;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  // Contador separado de P (ideas) — visible pero fuera del flujo de trabajo activo
  const pIdeasCount = ITEMS.filter(i => itemType(i.code) === 'P' && !isInClosedSprint(i) && i.status !== 'descartado' && i.status !== 'historico').length;
  // T-202606-096: desglose histórico — emitidos desde meta.counters (lastIds), descartados desde ITEMS
  const _metaForStats = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const _lastIds = _metaForStats.counters || {};
  const _emitidos = (_lastIds.P || 0) + (_lastIds.T || 0) + (_lastIds.R || 0) + (_lastIds.B || 0);
  const _descartadosTotal = ITEMS.filter(i => i.status === 'descartado').length;
  const _activosTotal = _emitidos > 0 ? (_emitidos - _descartadosTotal) : 0;

  document.getElementById('stats-bar').innerHTML = `
    <div class="stats-row">
      <!-- Nivel 1: progreso global — universo activos (done + en-revision + pendiente) -->
      <div class="stat-card s-progress">
        <div class="stat-progress-top">
          <div class="stat-progress-nums">
            <div class="stat-progress-item">
              <span class="stat-progress-n s-done">${done}</span>
              <span class="stat-progress-l">Hecho</span>
            </div>
            ${enRevisionCount > 0 ? `<div class="stat-progress-item">
              <span class="stat-progress-n s-enrevision">${enRevisionCount}</span>
              <span class="stat-progress-l">En revisión</span>
            </div>` : ''}
            <div class="stat-progress-item">
              <span class="stat-progress-n">${backlogCount}</span>
              <span class="stat-progress-l">Pendiente</span>
            </div>
          </div>
          ${total > 0 ? `<span class="stat-progress-pct">${pct}% completado</span>` : ''}
        </div>
        <div class="stat-mini-track"><div class="stat-mini-fill" style="--stat-mini-w:${pct}%"></div></div>
        ${_emitidos > 0 ? `<div class="stat-progress-historical"><span class="sph-item">${_emitidos} emitidos</span><span class="sph-sep">·</span><span class="sph-item">${_descartadosTotal} descartados</span><span class="sph-sep">·</span><span class="sph-item sph-activos">${_activosTotal} activos</span></div>` : ''}
      </div>
      <!-- Nivel 2: chips de tipo accionables — P (ideas) separado del flujo activo -->
      <div class="stat-card s-types">
        <div class="stat-detail-label">Tipo · filtrables</div>
        <div class="stat-detail-items">
          ${activeTypes.size < 4 ? `<span class="stat-type-chip stat-type-chip--all" data-action="stats-clear-types" title="Mostrar todos los tipos">✕ Todos</span>` : ''}
          ${[['B','Bug','Bugs / correcciones'],['T','Ticket','Tickets técnicos'],['R','Req','Requerimientos / epics']].map(([t,label,hint]) =>
            `<span class="stat-type-chip tc-${t}${activeTypes.has(t) ? ' active' : ''}" data-action="stats-type-filter" data-type="${t}" title="${hint} — click para filtrar">
              <span class="tc-count">${byType[t]}</span><span class="tc-label">${label}</span>
            </span>`
          ).join('')}
          ${pIdeasCount > 0 ? `<span class="stat-type-chip tc-P stat-type-chip--ideas${activeTypes.has('P') ? ' active' : ''}" data-action="stats-type-filter" data-type="P" title="Posibilidades — no afectan contadores de trabajo activo">
            <span class="tc-count">${pIdeasCount}</span><span class="tc-label">💡 Posibilidades</span>
          </span>` : ''}
        </div>
      </div>
    </div>
    <div class="stats-row">
      <!-- Nivel 3: prioridad + esfuerzo compacto -->
      <div class="stat-card s-meta">
        <div class="stat-meta-block">
          <div class="stat-meta-label">Prioridad</div>
          <div class="stat-meta-row">
            <span class="stat-pri-chip pri-high${activePriorityFilter.has('high') ? ' active' : ''}" data-action="stats-priority-filter" data-priority="high" title="Filtrar por prioridad alta — click para activar/desactivar"><span class="spc-n">${c.high}</span> Alto</span>
            <span class="stat-pri-chip pri-medium${activePriorityFilter.has('medium') ? ' active' : ''}" data-action="stats-priority-filter" data-priority="medium" title="Filtrar por prioridad media"><span class="spc-n">${c.medium}</span> Med</span>
            <span class="stat-pri-chip pri-low${activePriorityFilter.has('low') ? ' active' : ''}" data-action="stats-priority-filter" data-priority="low" title="Filtrar por prioridad baja"><span class="spc-n">${c.low}</span> Bajo</span>
          </div>
        </div>
        <div class="stat-meta-block">
          <div class="stat-meta-label">Esfuerzo · filtrables${noEffortCount > 0 ? ` <span class="stat-effort-missing" title="Ítems sin effort asignado — requerido para burndown" data-action="stats-effort-missing">${noEffortCount} sin effort</span>` : ''}</div>
          <div class="stat-meta-row">
            <span class="stat-effort-card${activeEfforts.has(1) ? ' active' : ''}" id="feff-1" data-action="stats-effort-filter" data-effort="1" title="Filtrar effort 1"><span class="sec-count">${byEffort[1]}</span><span class="eff-label">● simple</span></span>
            <span class="stat-effort-card${activeEfforts.has(2) ? ' active' : ''}" id="feff-2" data-action="stats-effort-filter" data-effort="2" title="Filtrar effort 2"><span class="sec-count">${byEffort[2]}</span><span class="eff-label">●● medio</span></span>
            <span class="stat-effort-card${activeEfforts.has(3) ? ' active' : ''}" id="feff-3" data-action="stats-effort-filter" data-effort="3" title="Filtrar effort 3"><span class="sec-count">${byEffort[3]}</span><span class="eff-label">●●● complejo</span></span>
          </div>
        </div>
      </div>
    </div>
  `;
  // B-UX: reaplicar clases de estado de filtro tras recrear el DOM del stats-bar
  updateTypeFilterUI();
}
// T-053: construye el bloque de sesiones que referencian un ítem del backlog
export function buildItemRefs(code) {
  const matches = [];
  getAllSessions().forEach(s => {
    if ((s.trackerRefs || []).includes(code)) {
      const ai = getAI(s.aiId);
      if (ai) matches.push({ ai, s });
    }
  });
  if (!matches.length) return '';
  const chips = matches.map(({ ai, s }) =>
    `<span class="item-ref-chip" title="${esc(s.title)}" data-action="ref-chip-session" data-ai-id="${ai.id}" data-sess-id="${s.id}">${esc(ai.name)} · ${s.dateShort || s.date || ''}</span>`
  ).join('');
  return `<div class="item-refs"><span class="item-ref-label">Sesiones</span>${chips}</div>`;
}

// T-104/106: labels de tipo completos
const TYPE_LABELS = { I: 'Posibilidad', P: 'Pendiente', T: 'Ticket', R: 'Requerimiento', B: 'Bug' };

// T-108: toggle colapso de ítem individual
export function toggleItemExpand(idx) {
  const body = document.getElementById('ibody-' + idx);
  const arrow = document.getElementById('iarrow-' + idx);
  if (!body) return;
  const open = body.classList.toggle('open');
  if (arrow) arrow.textContent = open ? '▾' : '▸';
  // T-202604-253: marcar ítem como seleccionado al expandir/colapsar
  (_coreCallbacks.backlogSetSelected || (() => {}))(body.closest ? body.closest('.item[data-code]') : null);
  // R-202604-015: abrir/cerrar panel lateral al expandir ítem
  const itemEl = body.closest ? body.closest('.item[data-code]') : null;
  const code = itemEl ? itemEl.dataset.code : null;
  if (open && code) {
    (_coreCallbacks.openItemPanel || (() => {}))(code);
  } else if (!open) {
    (_coreCallbacks.closeItemPanel || (() => {}))();
  }
}

// T-104/106: toggle secciones done/futura
export function toggleSectionGroup(key) {
  const body = document.getElementById('sgbody-' + key);
  const arrow = document.getElementById('sgarrow-' + key);
  if (!body) return;
  const collapsed = body.classList.toggle('collapsed');
  if (arrow) arrow.classList.toggle('collapsed', collapsed);
  try { localStorage.setItem('backlog-' + key + '-open', collapsed ? '0' : '1'); } catch {}
}

// T-109: limpiar todos los filtros
export function clearAllFilters() {
  activeTypes = new Set(['T','R','B','P']);
  activeStatuses = new Set(['pendiente', 'en-revision']);
  try { localStorage.removeItem(_ACTIVE_STATUSES_KEY); } catch {} // T-202606-021: reset persiste
  activeEfforts = new Set([1, 2, 3]); // T-071
  activeRoleFilter = null; // T-202604-245
  activePriorityFilter = new Set(); // T-202604-357
  _backlogNoAcMode = false; // T-202604-363
  backlogSearchQuery = '';
  backlogSortMode = 'priority'; // T-202604-424: sprint eliminado como opción de sort
  backlogSortDir = 'desc'; // T-072 — default desc
  const sortDirBtn = document.getElementById('fbar-sort-dir-btn');
  if (sortDirBtn) sortDirBtn.textContent = '↓';
  const searchEl = document.getElementById('search-global');
  if (searchEl) searchEl.value = '';
  const bsInput = document.getElementById('backlog-search-input');
  if (bsInput) bsInput.value = '';
  const bsClear = document.getElementById('backlog-search-clear');
  if (bsClear) bsClear.classList.remove('visible');
  const sortSel = document.getElementById('fbar-sort-select');
  if (sortSel && sortSel.value === 'sprint') sortSel.value = 'priority';
  updateTypeFilterUI();
  updateStatusFilterUI();
  updateEffortFilterUI(); // T-071
  updateRoleFilterUI();   // T-202604-245
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// R-202605-122 AC3: asignación rápida de effort desde badge sin abrir editor completo
export function _quickAssignEffort(codeOrId) {
  const item = ITEMS.find(i => i.code === codeOrId || i.id === codeOrId);
  if (!item) return;
  const val = prompt('Asignar effort a ' + (item.code || item.id) + ' (1 = simple · 2 = medio · 3 = complejo):', '1');
  const n = parseInt(val);
  if (!val || isNaN(n) || n < 1 || n > 3) { showToast('warning', '⚠ Valor no válido — ingresa 1, 2 o 3'); return; }
  item.effort = n;
  if (item._needsEffortReview) delete item._needsEffortReview;
  _undoSnapshot();
  saveBacklog();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  renderStats();
  showToast('success', '✓ Effort ' + n + ' asignado a ' + (item.code || item.id));
}

// T-071: toggle filtro por esfuerzo
export function toggleEffortFilter(e) {
  const n = parseInt(e);
  const allActive = activeEfforts.size === 3;
  if (allActive) {
    // primer click: desactiva todos, activa solo el clickeado
    activeEfforts = new Set([n]);
  } else if (activeEfforts.has(n)) {
    // click en activo: si es el único, restaura todos
    if (activeEfforts.size === 1) {
      activeEfforts = new Set([1, 2, 3]);
    } else {
      activeEfforts.delete(n);
    }
  } else {
    // click en inactivo con otros activos: acumula
    activeEfforts.add(n);
  }
  updateEffortFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  // T-202604-364: filter-pulse feedback
  requestAnimationFrame(() => {
    const el = document.getElementById('feff-' + n);
    if (el) { el.classList.remove('filter-pulse'); void el.offsetWidth; el.classList.add('filter-pulse'); el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true }); }
  });
}

function updateEffortFilterUI() {
  [1, 2, 3].forEach(n => {
    const el = document.getElementById('feff-' + n);
    if (el) el.classList.toggle('active', activeEfforts.has(n));
  });
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed')); // B-202606-006
}

// T-202604-065: sort handler
// T-202604-245: roles canónicos del ecosistema — fuente: Base Rules sección 2
const _ECOSYSTEM_ROLES = [
  'PO · Alex','FS · Mike',
  'PO · Axis','FS · Rex','UX · Nova',
  'PO · Orion','ET · Eden','GC · Sage','FS · Kai',
  'ST · Vera','QA · Finn','GW · Lena'
];

// T-202604-245: cambio de rol inline desde meta-grid
export function setItemRole(code, role) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  item.role = role || '';
  _undoSnapshot();
  _blogLog('rol →', code, role || '(vacío)', 'backlog');
  saveBacklog();
  window.dispatchEvent(new CustomEvent('shell:backlog-modified'));
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  renderStats();
  showToast('success', role ? `${code} → ${role}` : `${code} rol limpiado`);
}

// T-202604-245: toggle filtro por rol
export function toggleRoleFilter(role) {
  // null = 'Sin rol'; string = rol específico
  if (activeRoleFilter === role) {
    activeRoleFilter = null; // segundo click = quitar filtro
  } else {
    activeRoleFilter = role;
  }
  updateRoleFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-202604-357: toggle filtro por prioridad — acumulable, combina con otros filtros
function togglePriorityFilter(p) {
  if (activePriorityFilter.has(p)) {
    activePriorityFilter.delete(p);
  } else {
    activePriorityFilter.add(p);
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  renderStats();
}

function updatePriorityFilterUI() {
  ['high', 'medium', 'low'].forEach(p => {
    const el = document.querySelector('.stat-pri-chip.pri-' + p);
    if (el) el.classList.toggle('active', activePriorityFilter.has(p));
  });
}
function updateRoleFilterUI() {
  document.querySelectorAll('.frole-chip').forEach(chip => {
    const val = chip.dataset.role === '__none__' ? null : chip.dataset.role;
    chip.classList.toggle('active', activeRoleFilter === val);
  });
}

// T-202604-245: derivar lista de roles únicos en ITEMS
function _getActiveRoles() {
  const roles = new Set();
  ITEMS.forEach(i => { if (i.role && i.role.trim()) roles.add(i.role.trim()); });
  return [...roles].sort();
}

// T-202604-245: construir chips de rol para inyectar en filter bar
export function _buildRoleChips() {
  const roles = _getActiveRoles();
  if (!roles.length) return '';
  const noneCount = ITEMS.filter(i => !i.role || !i.role.trim()).length;
  const chips = roles.map(r => {
    const isActive = activeRoleFilter === r;
    return `<button class="fbtn frole-chip${isActive ? ' active' : ''}" data-role="${esc(r)}" data-action="stats-role-filter" title="Filtrar por rol: ${esc(r)}">${esc(r)}</button>`;
  });
  if (noneCount > 0) {
    const isActive = activeRoleFilter === null && activeRoleFilter !== undefined && activeRoleFilter !== 'initial';
    // chip Sin rol: activo cuando activeRoleFilter === '__none__' (sentinel)
    const isSinRolActive = activeRoleFilter === '__none__';
    chips.push(`<button class="fbtn frole-chip${isSinRolActive ? ' active' : ''}" data-role="__none__" data-action="stats-role-filter" title="Ítems sin rol asignado">Sin rol</button>`);
  }
  return `<div class="frole-bar" id="frole-bar">${chips.join('')}</div>`;
}

function onBacklogSortChange(val) {
  // T-202604-424: ignorar 'sprint' si llega de localStorage legacy o select antiguo
  if (val === 'sprint') val = 'priority';
  backlogSortMode = val;
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-072: toggle dirección de sort
function toggleSortDir() {
  backlogSortDir = backlogSortDir === 'asc' ? 'desc' : 'asc';
  const btn = document.getElementById('fbar-sort-dir-btn');
  if (btn) btn.textContent = backlogSortDir === 'asc' ? '↑' : '↓';
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-202604-187: toggle árbol vs vista plana
// B-202604-122: persistir estado en localStorage
// T-202604-287: toggle vista Kanban
// T-202604-313/366: Mi vista — T's pendientes del rol activo en sprint activo, rotativo
export function _getMiViewRoles() {
  const activeSprint = (_coreCallbacks.getActiveSprint || (() => null))();
  if (!activeSprint) return [];
  const roles = new Set();
  ITEMS.forEach(i => {
    if (itemType(i.code) === 'T' && i.status === 'pendiente' && i.sprint === activeSprint.id && i.role && i.role.trim())
      roles.add(i.role.trim());
  });
  return [...roles].sort();
}

export function _getMiViewLabel() {
  const roles = _getMiViewRoles();
  if (!roles.length) return 'Mi vista';
  const role = roles[_miViewRoleIndex % roles.length] || roles[0];
  return 'Mi vista: ' + role;
}

// T-202604-360: toggle footer fijo colapsable
// T-202606-099: toggleBtn migrado a #gf-footer-toggle en global-footer
function toggleBacklogFooter() {
  _blFooterCollapsed = !_blFooterCollapsed;
  const filtersRow = document.getElementById('bl-footer-filters');
  const toggleBtn  = document.getElementById('gf-footer-toggle');
  if (filtersRow) filtersRow.classList.toggle('bl-footer-row--hidden', _blFooterCollapsed);
  if (toggleBtn)  toggleBtn.textContent = _blFooterCollapsed ? '▼' : '▲';
}

// AC: aria tablist — sincroniza atributos aria-selected (vistas de agrupación) y aria-checked (modificadores)
// Vistas de agrupación: Kanban · Vista Lista (default)
// Modificadores combinables: Focus · Mi vista
// T-202606-062: sprintBtn y _backlogSprintGroupMode eliminados — _renderVistaLista es la vista por defecto
function _syncViewAriaStates() {
  const kanbanBtn   = document.getElementById('fbar-kanban-btn');

  if (kanbanBtn)   kanbanBtn.setAttribute('aria-selected',   String(_backlogKanbanMode));

  // AC: aria tabpanel — #backlog-list labelledby refleja el tab activo
  const backlogPanel = document.getElementById('backlog-list');
  if (backlogPanel) {
    let activeTabId = 'fbar-kanban-btn';
    if (!_backlogKanbanMode) activeTabId = 'fbar-kanban-btn'; // default — Vista Lista no tiene btn propio
    if (_backlogKanbanMode) activeTabId = 'fbar-kanban-btn';
    // Guard: solo aplicar si el tab existe en el DOM
    if (document.getElementById(activeTabId)) {
      backlogPanel.setAttribute('aria-labelledby', activeTabId);
    }
  }

  // Modificadores — aria-checked refleja estado
  const mikeBtn  = document.getElementById('fbar-mike-btn');
  if (mikeBtn)  mikeBtn.setAttribute('aria-checked',  String(_backlogMikeMode));
}

export function toggleBacklogMikeMode() {
  const roles = _getMiViewRoles();
  if (!roles.length) return;
  if (!_backlogMikeMode) {
    _backlogMikeMode = true;
    _miViewRoleIndex = 0;
  } else if (roles.length === 1) {
    // Solo un rol — segundo click desactiva
    _backlogMikeMode = false;
    _miViewRoleIndex = 0;
  } else {
    // Rotar al siguiente rol
    _miViewRoleIndex = (_miViewRoleIndex + 1) % roles.length;
  }
  const btn = document.getElementById('fbar-mike-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogMikeMode);
    btn.textContent = _backlogMikeMode ? _getMiViewLabel() : 'Mi vista';
    btn.title = _backlogMikeMode
      ? 'Mi vista activa · click para rotar al siguiente rol'
      : 'Mi vista — T\'s pendientes por rol en sprint activo';
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
  _syncViewAriaStates();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

function toggleBacklogKanbanMode() {
  _backlogKanbanMode = !_backlogKanbanMode;
  if (_backlogKanbanMode) {
    localStorage.setItem('backlog-view-mode', 'kanban');
  } else {
    localStorage.setItem('backlog-view-mode', 'false');
  }
  // Actualizar botón kanban
  const kbBtn = document.getElementById('fbar-kanban-btn');
  if (kbBtn) kbBtn.classList.toggle('active', _backlogKanbanMode);
  _syncViewAriaStates();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}



// T-202604-363: toggle filtro Sin AC — pendientes sin criterios de aceptación
export function toggleBacklogNoAcMode() {
  _backlogNoAcMode = !_backlogNoAcMode;
  const btn = document.getElementById('fbar-no-ac-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogNoAcMode);
    btn.title = _backlogNoAcMode ? 'Sin AC activo — click para desactivar' : 'Filtrar ítems sin criterios de aceptación';
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// R-202605-130: vista Planificación — drag & drop de ítems sin sprint al sprint siguiente

// Getters exportados para variables de estado — consumidos por locus-backlog-render.js.
// Las variables son let/const privados (mutables), por lo que se exponen via getter en lugar de export let.
export function _getBacklogKanbanMode()      { return _backlogKanbanMode; }
export function _getBacklogMikeMode()        { return _backlogMikeMode; }
// T-202606-062: _getBacklogSprintGroupMode() eliminada — R-202606-017
export function _getBacklogNoAcMode()        { return _backlogNoAcMode; }
export function _getActiveTypes()            { return activeTypes; }
export function _getActiveStatuses()         { return activeStatuses; }
export function _getActiveEfforts()          { return activeEfforts; }
export function _getActiveRoleFilter()       { return activeRoleFilter; }
export function _getActivePriorityFilter()   { return activePriorityFilter; }
export function _getBacklogBlockerFilter()   { return _backlogBlockerFilter; }
export function _getDepsFilter()             { return _depsFilter; }
export function getDoneItems(matchesQuery)   { // T-202606-028: computed global — evita ITEMS.filter() duplicado en renderBacklogList
  const fn = typeof matchesQuery === 'function' ? matchesQuery : () => true;
  return ITEMS.filter(i => i.status === 'done' && _isCountableItem(i) && fn(i));
}
export function _getBacklogSortMode()        { return backlogSortMode; }
export function _getBacklogSortDir()         { return backlogSortDir; }
export function _getMiViewRoleIndex()        { return _miViewRoleIndex; }
export function _getBacklogSearchQuery()     { return backlogSearchQuery; }
export function _getCollapsedVersions()      { return collapsedVersions; }

// B-202605-XXX: _migrateItemTypes — stub de compatibilidad para call site en locus-storage.js
// R-202605-070: la lógica real fue absorbida por _normalizeItems(). Este stub redirige
// la llamada post-carga remota de _loadFromSupabase a _normalizeItems para mantener
// el contrato de datos sin duplicar lógica.
export function _migrateItemTypes() {
  if (typeof ITEMS === 'undefined') return;
  _setITEMS(_normalizeItems(ITEMS));
  saveBacklog();
}
// B-202606-024: window.getItems eliminado — consumidores migrados a import o _getItemsFn()

// Inline handlers dinámicos — no tienen ID fijo, no pueden migrar a addEventListener
// Se exponen en window para que onclick="fn()" en HTML generado en runtime funcione

// T-202605-053: Migrar handlers inline de index.html → addEventListener
// Funciones cubiertas: undoBacklog · redoBacklog · toggleBacklogKanbanMode
// toggleBacklogMikeMode · toggleCollapseAll
// toggleStatusFilter (×5) · toggleBacklogBlockerFilter
// toggleBacklogNoAcMode · clearAllFilters
document.addEventListener('DOMContentLoaded', function () {
  // Undo / Redo
  const _btnUndo = document.getElementById('btn-undo-backlog');
  if (_btnUndo) _btnUndo.addEventListener('click', function () { undoBacklog(); });

  const _btnRedo = document.getElementById('btn-redo-backlog');
  if (_btnRedo) _btnRedo.addEventListener('click', function () { redoBacklog(); });

  // Vista — Kanban / Focus / Mi vista
  const _btnKanban = document.getElementById('fbar-kanban-btn');
  if (_btnKanban) _btnKanban.addEventListener('click', function () { toggleBacklogKanbanMode(); });

  const _btnMike = document.getElementById('fbar-mike-btn');
  if (_btnMike) _btnMike.addEventListener('click', function () { toggleBacklogMikeMode(); });

  // Colapsar / expandir todos
  const _btnCollapse = document.getElementById('bl-collapse-all-btn');
  if (_btnCollapse) _btnCollapse.addEventListener('click', function () { toggleCollapseAll(); });

  // B-202606-011: sincronizar estado visual del botón con collapsedVersions al cargar
  // collapsedVersions ya está cargado desde localStorage — si tiene entradas, hay sprints colapsados
  if (_btnCollapse && collapsedVersions.size > 0) {
    const _colLabel = _btnCollapse.querySelector('.bl-collapse-btn-label');
    const _colIcon  = _btnCollapse.querySelector('.bl-collapse-btn-icon');
    _btnCollapse.classList.add('is-collapsed');
    if (_colLabel) _colLabel.textContent = 'Expandir';
    if (_colIcon)  _colIcon.textContent  = '⊞';
  }

  // Búsqueda — B-202605-047: handler inline, no depende de onBacklogSearch global
  const _inputSearch = document.getElementById('backlog-search-input');
  if (_inputSearch) _inputSearch.addEventListener('input', function () {
    backlogSearchQuery = _inputSearch.value.trim().toLowerCase();
    const _bsClear = document.getElementById('backlog-search-clear');
    if (_bsClear) _bsClear.classList.toggle('visible', backlogSearchQuery.length > 0);
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  });

  const _btnSearchClear = document.getElementById('backlog-search-clear');
  if (_btnSearchClear) _btnSearchClear.addEventListener('click', function () {
    backlogSearchQuery = '';
    if (_inputSearch) _inputSearch.value = '';
    _btnSearchClear.classList.remove('visible');
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  });

  // Filtros de status
  const _statusMap = {
    'fstatus-pendiente':  'pendiente',
    'fstatus-en-revision': 'en-revision',
    'fstatus-done':       'done',
    'fstatus-descartado': 'descartado'
  };
  Object.keys(_statusMap).forEach(function (id) {
    const _btn = document.getElementById(id);
    if (_btn) _btn.addEventListener('click', (function (val) {
      return function () { toggleStatusFilter(val); };
    }(_statusMap[id])));
  });

  // Filtro Bloqueados
  const _btnBlocker = document.getElementById('fbar-blocker-btn');
  if (_btnBlocker) _btnBlocker.addEventListener('click', function () { toggleBacklogBlockerFilter(); });

  // Filtro Sin AC
  const _btnNoAc = document.getElementById('fbar-no-ac-btn');
  if (_btnNoAc) _btnNoAc.addEventListener('click', function () { toggleBacklogNoAcMode(); });

  // Limpiar todos los filtros
  const _btnClearFilters = document.getElementById('filter-clear-btn');
  if (_btnClearFilters) _btnClearFilters.addEventListener('click', function () { clearAllFilters(); });

  // T-202606-087: Pill 'Hijos' — init + listener (reemplaza checkbox bl-show-children-toggle)
  const _btnShowChildren = document.getElementById('fbar-show-children-btn');
  if (_btnShowChildren) {
    // AC-6: si la clave no existe, estado inicial es inactivo (hijos ocultos)
    const _scStored = localStorage.getItem('backlog-show-children');
    const _scActive = _scStored === '1';
    _btnShowChildren.classList.toggle('active', _scActive);
    _btnShowChildren.textContent = _scActive ? 'Hijos ✓' : 'Hijos';
    if (_scActive) toggleShowChildren(true);

    _btnShowChildren.addEventListener('click', function () {
      const nowActive = !_btnShowChildren.classList.contains('active');
      _btnShowChildren.classList.toggle('active', nowActive);
      _btnShowChildren.textContent = nowActive ? 'Hijos ✓' : 'Hijos';
      toggleShowChildren(nowActive);
    });
  }

  // B-202606-008: sincronizar visibilidad del botón Limpiar filtros con el estado
  // real de los filtros en la carga inicial — antes de cualquier interacción del usuario
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));

  // T-202606-218: listener shell:togglePriorityFilter — invocación cross-módulo sin export
  window.addEventListener('shell:togglePriorityFilter', function (e) {
    togglePriorityFilter(e.detail && e.detail.val);
  });

  // T-202606-099: toggle de filtros del backlog desde footer global
  const _btnGfToggle = document.getElementById('gf-footer-toggle');
  if (_btnGfToggle) _btnGfToggle.addEventListener('click', function () { toggleBacklogFooter(); });
});
