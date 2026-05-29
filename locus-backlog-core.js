// [PP] v1.2.4 · sprint:PP-S-09 · mod:6 · autor:Rune · 2026-05-29 UTC-6
// locus-backlog-core.js
// Responsabilidad: State global (ITEMS, undo/redo), carga, parse, importación,
//   filtros, vistas, sort, stats, footer, helpers de badge/status/effort.

import { _normalizeStatus, updateBacklogFooter } from './locus-backlog-item.js';
import { _markBacklogListDirty, renderBacklogList, updateClearFilterBtn } from './locus-backlog-render.js';
import { _getActiveSprint, _getSprintById, renderSprintBurndown, renderSprintItems } from './locus-backlog-sprints.js';
import { openItemEditor } from './locus-item-editor.js';
import { _blogLog, _effectiveVersion, _loadFromSupabase, _tplKey, getAI, getActiveSprints, getAllSessions, saveBacklog } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';

import { _confirmDiscard, _confirmRetroceso } from './locus-backlog-merge.js';

import { _backlogSetSelected, closeItemPanel, openItemPanel } from './locus-backlog-panel.js';

import { _setBacklogModified, _updateSubTabButtons } from './locus-docs.js';

import { normalize } from './locus-map-generator.js';

import { _gconfirmOpen } from './locus-modals.js';

import { hasRecentSession } from './locus-notifications.js';

import { _isInSession } from './locus-sesiones-stats.js';

import { render } from './locus-sesiones.js';

import { openDetail } from './locus-session-popup.js';

import { _getActiveProjectFilter } from './locus-sprint-project.js';

import { esc, switchTab } from './locus-ui-shell.js';

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
let ITEMS = (() => {
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
      // B-202604-193: 'historico' es valor canónico — NO normalizar a pendiente
      let migrated = false;
      items.forEach(item => {
        const norm = item.status === 'done' ? 'done' : item.status === 'descartado' ? 'descartado' : item.status === 'historico' ? 'historico' : 'pendiente';
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

// Exponer ITEMS en window para módulos que acceden directamente (legacy pre-module).
// _setITEMS(arr): reemplaza el contenido de ITEMS sin romper la referencia de window.ITEMS.
window.ITEMS = ITEMS;
function _setITEMS(arr) {
  ITEMS.splice(0, ITEMS.length, ...(Array.isArray(arr) ? arr : []));
  // window.ITEMS apunta al mismo array — no necesita reasignación
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
  if (openItemEditor) {
    openItemEditor(id, code);
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
  _markBacklogListDirty(); renderBacklogList();
  renderStats();
  _updateUndoUI();
  showToast('info', '↩ Deshacer aplicado');
}

export function redoBacklog() {
  if (!_redoStack.length) return;
  _undoStack.push(JSON.stringify(ITEMS));
  _setITEMS(JSON.parse(_redoStack.pop()));
  saveBacklog();
  _markBacklogListDirty(); renderBacklogList();
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

// T-202604-258: modo Focus — top 10 por score descendente
let _backlogFocusMode = false;

// R-[tmp:sprint-group-toggle]: agrupación por sprint en backlog activo — activo por defecto
const _backlogSprintGroupRaw = localStorage.getItem('backlog-sprint-group-mode');
let _backlogSprintGroupMode = _backlogSprintGroupRaw !== null ? _backlogSprintGroupRaw !== 'false' : true;

// T-202604-187: toggle vista árbol (R con hijos colapsables) vs plana
// B-202604-122: leer desde localStorage para persistir entre recargas
// T-202604-287: backlog-view-mode extiende a 3 valores: 'true' | 'false' | 'kanban'
const _backlogViewModeRaw = localStorage.getItem('backlog-view-mode');
let _backlogKanbanMode = _backlogViewModeRaw === 'kanban';
let _backlogTreeMode = !_backlogKanbanMode && (_backlogViewModeRaw !== null
  ? _backlogViewModeRaw !== 'false'
  : true); // default: árbol
// T-202604-187: set de rCodes con bloque hijos colapsado
const _collapsedChildren = new Set();

// T-049: window.state de filtros mixtos
let activeTypes = new Set(['T','R','B','P']);
let activeStatuses = new Set(['pendiente', 'en-revision']); // done oculto por defecto
let _blFooterCollapsed = false; // T-202604-360: footer fijo colapsable

const VERSIONS_ORDER = ['v2.0.0','futura'];
const VERSION_LABELS = {
  'v2.0.0':'Sprint activo',
  'futura':'Versión futura — sin fecha'
};

// T-049: colapso por versión — persiste en localStorage
const _CV_KEY = 'backlog-collapsed-versions';
function _cvLoad() {
  try { return new Set(JSON.parse(localStorage.getItem(_CV_KEY) || '[]')); } catch { return new Set(); }
}
function _cvSave() {
  try { localStorage.setItem(_CV_KEY, JSON.stringify([...collapsedVersions])); } catch {}
}
const collapsedVersions = _cvLoad();

// R-[tmp:toolbar-backlog-redesign]: collapse all — volátil, no persiste entre sesiones
export function toggleCollapseAll() {
  const bodies = document.querySelectorAll('.version-group-body');
  const arrows = document.querySelectorAll('.version-collapse-arrow');
  const btn = document.getElementById('bl-collapse-all-btn');
  const label = btn ? btn.querySelector('.bl-collapse-btn-label') : null;
  const icon = btn ? btn.querySelector('.bl-collapse-btn-icon') : null;
  // detectar estado actual — si alguno está expandido, colapsar todo; si todos colapsados, expandir
  const anyExpanded = Array.from(bodies).some(b => !b.classList.contains('collapsed'));
  bodies.forEach(b => {
    const id = b.id ? b.id.replace('vbody-', '') : null;
    b.classList.toggle('collapsed', anyExpanded);
    if (id) anyExpanded ? collapsedVersions.add(id) : collapsedVersions.delete(id);
  });
  _cvSave();
  arrows.forEach(a => { a.textContent = anyExpanded ? '▸' : '▾'; });
  if (btn) btn.classList.toggle('is-collapsed', anyExpanded);
  if (label) label.textContent = anyExpanded ? 'Expandir' : 'Colapsar';
  if (icon) icon.textContent = anyExpanded ? '⊞' : '⊟';
}

// R-[tmp:toolbar-backlog-redesign]: filtro bloqueados — volátil
let _backlogBlockerFilter = false;
function toggleBacklogBlockerFilter() {
  _backlogBlockerFilter = !_backlogBlockerFilter;
  const btn = document.getElementById('fbar-blocker-btn');
  if (btn) btn.classList.toggle('active', _backlogBlockerFilter);
  _markBacklogListDirty(); renderBacklogList();
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
  _markBacklogListDirty(); renderBacklogList();
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
  if (typeof hasRecentSession !== 'function') return true; // guardia — función canónica no disponible
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
  return hasRecentSession(item, _NO_SESSION_DAYS);
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
    const sp = _getSprintById(item.sprint);
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
    const sp = _getSprintById(item.sprint);
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
  if (typeof getActiveSprints !== 'function') return 0;
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
  _gconfirmOpen({
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
    _markBacklogListDirty(); renderBacklogList();
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

  const VALID_STATUSES = new Set(['done', 'pendiente', 'descartado', 'historico']);

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
    // Ausente o inválido → 'pendiente'. Usa _normalizeStatus si disponible.
    const rawStatus = item.status;
    let normalizedStatus;
    if (typeof _normalizeStatus === 'function') {
      normalizedStatus = _normalizeStatus(rawStatus);
    } else {
      // Fallback inline — misma lógica que _normalizeStatus para los valores canónicos
      normalizedStatus = VALID_STATUSES.has(rawStatus) ? rawStatus : 'pendiente';
    }
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
  // Guard: _normalizeStatus debe estar disponible (dependency de _normalizeItems).
  if (typeof _normalizeStatus !== 'function') {
    console.error('[AI Tracker] loadBacklog: _normalizeStatus no disponible — normalización abortada. Verificar orden de carga de módulos.');
    showToast({ title: 'Error de carga', body: '_normalizeStatus no disponible. Recarga la página.', type: 'error' });
    return;
  }
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
  if (typeof _syncViewAriaStates === 'function') _syncViewAriaStates();
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
  _markBacklogListDirty(); renderBacklogList();
}

function toggleTypeFilter(type) {
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
  _markBacklogListDirty(); renderBacklogList();
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
  updateClearFilterBtn();
}

// T-049: toggle filtros status
function toggleStatusFilter(status) {
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
  updateStatusFilterUI();
  _markBacklogListDirty(); renderBacklogList();
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
  const enCursoBtn = document.getElementById('fstatus-en-curso');
  if (enCursoBtn) enCursoBtn.classList.toggle('active', activeStatuses.has('en curso'));
  updateClearFilterBtn();
}

// T-051: colapso por versión
function toggleVersionCollapse(v) {
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
      const status   = _normalizeStatus(get('Status'));
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

// T-048: actualizar banner
export function updateBacklogBanner() {
  const banner = document.getElementById('backlog-meta-banner');
  const exportBtn = document.getElementById('export-backlog-btn');
  if (!_getActiveProjectFilter() || !ITEMS.length) {
    if (banner) banner.classList.remove('visible');
    if (exportBtn) exportBtn.classList.add("is-hidden");
    return;
  }
  if (banner) banner.classList.add('visible');
  // Mostrar botón exportar solo si estamos en tab backlog
  if (exportBtn && typeof currentTab !== 'undefined' && currentTab === 'backlog') exportBtn.classList.remove("is-hidden")

  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('bmeta-version', meta.version || '—');
  el('bmeta-total', ITEMS.length + ' ítem' + (ITEMS.length !== 1 ? 's' : ''));
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
      _markBacklogListDirty(); renderBacklogList();
      updateBacklogFooter();
      _setBacklogModified();
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
      _updateSubTabButtons('backlog'); // ocultar botón importar tras bootstrap exitoso
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
  if (typeof window.state === 'undefined' || typeof _isInSession !== 'function') return null;
  const ai = (window.state.ais || []).find(a => !a.archived && _isInSession(a));
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
    _confirmDiscard(code, '', '');
    return;
  }

  // Retroceso done → pendiente/backlog: requiere confirmación
  if (item.status === 'done' && (newStatus === 'pendiente' || newStatus === 'backlog' || newStatus === 'in-progress')) {
    _resetStatusSelect(code, item.status);
    _confirmRetroceso(code, newStatus);
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
    _gconfirmOpen({
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
    const activeSprint = _getActiveSprint();
    const itemInActiveSprint = activeSprint && item.sprint && item.sprint === activeSprint.id;
    if (itemInActiveSprint) {
      _showInlineConfirmDone(code);
      return;
    }
  }

  const _prevStatus = item.status;
  _applyStatusChange(code, newStatus, _prevStatus);
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
  // R-202604-015: registrar cambio en history[]
  if (!item.history) item.history = [];
  item.history.push({ type: 'status', ts: item.statusChangedAt, aiId: _getActiveSessionAiId() || undefined, data: { from: prevStatus, to: newStatus, role: item.role || '' } });
  if (newStatus === 'pendiente') item.priority = _calcPriority(item); // T-202604-297
  _recalcAllScores(); // T-202604-257: recalcular scores tras cambio de status
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
  // C8: animación salida si el ítem va a desaparecer del filtro activo
  if (newStatus === 'done' && !activeStatuses.has('done')) {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.classList.add('item-exit-anim');
      setTimeout(() => { _markBacklogListDirty(); renderBacklogList(); renderStats(); renderSprintBurndown(); renderSprintItems(); }, 360); // T-202605-058 T-202605-044
      return;
    }
  }
  _markBacklogListDirty(); renderBacklogList();
  renderStats();
  renderSprintBurndown(); // T-202605-058
  renderSprintItems(); // T-202605-044
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

  // C8: animación salida si el ítem va a desaparecer del filtro activo
  if (!activeStatuses.has('done')) {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.classList.add('item-exit-anim');
      setTimeout(() => { _markBacklogListDirty(); renderBacklogList(); renderStats(); renderSprintBurndown(); renderSprintItems(); }, 360); // T-202605-058 T-202605-044
      return;
    }
  }
  _markBacklogListDirty(); renderBacklogList();
  renderStats();
  renderSprintBurndown(); // T-202605-058
  renderSprintItems(); // T-202605-044
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
  if (!_getActiveProjectFilter() || !ITEMS.length) { document.getElementById('stats-bar').innerHTML = ''; return; }

  // T-202604-106: excluir ítems de sprints cerrados del módulo principal
  const closedSprintIds = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  const isInClosedSprint = i => i.sprint && closedSprintIds.has(i.sprint);

  const _countable = i => _isCountableItem(i);

  const countableItems = ITEMS.filter(i => _countable(i) && !isInClosedSprint(i) && i.status !== 'descartado' && i.status !== 'historico');

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

  // Nivel 1: totales globales — P (ideas) excluidas de todos los contadores de trabajo activo
  const backlogCount = countableItems.filter(i => i.status === 'pendiente').length;
  const done     = countableItems.filter(i => i.status === 'done').length;
  // T-202604-358: descartados — discreto, no afecta pct
  const descartadoCount = ITEMS.filter(i => _isCountableItem(i) && i.status === 'descartado').length;
  const total    = backlogCount + done;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
  // Contador separado de P (ideas) — visible pero fuera del flujo de trabajo activo
  const pIdeasCount = ITEMS.filter(i => itemType(i.code) === 'P' && !isInClosedSprint(i) && i.status !== 'descartado' && i.status !== 'historico').length;

  document.getElementById('stats-bar').innerHTML = `
    <div class="stats-row">
      <!-- Nivel 1: progreso global -->
      <div class="stat-card s-progress">
        <div class="stat-progress-top">
          <div class="stat-progress-nums">
            <div class="stat-progress-item">
              <span class="stat-progress-n">${backlogCount}</span>
              <span class="stat-progress-l">Pendiente</span>
            </div>
            <div class="stat-progress-item">
              <span class="stat-progress-n s-done">${done}</span>
              <span class="stat-progress-l">Hecho</span>
            </div>
            ${descartadoCount > 0 ? `<div class="stat-progress-item stat-progress-item--discarded">
              <span class="stat-progress-n s-discarded">${descartadoCount}</span>
              <span class="stat-progress-l">Descartado</span>
            </div>` : ''}
          </div>
          <span class="stat-progress-pct">${pct}%</span>
        </div>
        <div class="stat-mini-track"><div class="stat-mini-fill" style="--stat-mini-w:${pct}%"></div></div>
      </div>
      <!-- Nivel 2: chips de tipo accionables — P (ideas) separado del flujo activo -->
      <div class="stat-card s-types">
        <div class="stat-detail-label">Tipo · filtrables</div>
        <div class="stat-detail-items">
          ${activeTypes.size < 4 ? `<span class="stat-type-chip stat-type-chip--all" onclick="clearTypeFilters()" title="Mostrar todos los tipos">✕ Todos</span>` : ''}
          ${[['B','Bug','Bugs / correcciones'],['T','Ticket','Tickets técnicos'],['R','Req','Requerimientos / epics']].map(([t,label,hint]) =>
            `<span class="stat-type-chip tc-${t}${activeTypes.has(t) ? ' active' : ''}" onclick="toggleTypeFilter('${t}')" title="${hint} — click para filtrar">
              <span class="tc-count">${byType[t]}</span><span class="tc-label">${label}</span>
            </span>`
          ).join('')}
          ${pIdeasCount > 0 ? `<span class="stat-type-chip tc-P stat-type-chip--ideas${activeTypes.has('P') ? ' active' : ''}" onclick="toggleTypeFilter('P')" title="Posibilidades — no afectan contadores de trabajo activo">
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
            <span class="stat-pri-chip pri-high${activePriorityFilter.has('high') ? ' active' : ''}" onclick="togglePriorityFilter('high')" title="Filtrar por prioridad alta — click para activar/desactivar"><span class="spc-n">${c.high}</span> Alto</span>
            <span class="stat-pri-chip pri-medium${activePriorityFilter.has('medium') ? ' active' : ''}" onclick="togglePriorityFilter('medium')" title="Filtrar por prioridad media"><span class="spc-n">${c.medium}</span> Med</span>
            <span class="stat-pri-chip pri-low${activePriorityFilter.has('low') ? ' active' : ''}" onclick="togglePriorityFilter('low')" title="Filtrar por prioridad baja"><span class="spc-n">${c.low}</span> Bajo</span>
          </div>
        </div>
        <div class="stat-meta-block">
          <div class="stat-meta-label">Esfuerzo · filtrables${noEffortCount > 0 ? ` <span class="stat-effort-missing" title="Ítems sin effort asignado — requerido para burndown" onclick="toggleBacklogBlockerFilter && toggleEffortFilter(0)">${noEffortCount} sin effort</span>` : ''}</div>
          <div class="stat-meta-row">
            <span class="stat-effort-card${activeEfforts.has(1) ? ' active' : ''}" id="feff-1" onclick="toggleEffortFilter(1)" title="Filtrar effort 1"><span class="sec-count">${byEffort[1]}</span><span class="eff-label">● simple</span></span>
            <span class="stat-effort-card${activeEfforts.has(2) ? ' active' : ''}" id="feff-2" onclick="toggleEffortFilter(2)" title="Filtrar effort 2"><span class="sec-count">${byEffort[2]}</span><span class="eff-label">●● medio</span></span>
            <span class="stat-effort-card${activeEfforts.has(3) ? ' active' : ''}" id="feff-3" onclick="toggleEffortFilter(3)" title="Filtrar effort 3"><span class="sec-count">${byEffort[3]}</span><span class="eff-label">●●● complejo</span></span>
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
    `<span class="item-ref-chip" title="${esc(s.title)}" onclick="switchTab('tracker');setTimeout(()=>openDetail('${ai.id}','${s.id}'),120)">${esc(ai.name)} · ${s.dateShort || s.date || ''}</span>`
  ).join('');
  return `<div class="item-refs"><span class="item-ref-label">Sesiones</span>${chips}</div>`;
}

// T-104/106: labels de tipo completos
const TYPE_LABELS = { I: 'Posibilidad', P: 'Pendiente', T: 'Ticket', R: 'Requerimiento', B: 'Bug' };

// T-108: toggle colapso de ítem individual
function toggleItemExpand(idx) {
  const body = document.getElementById('ibody-' + idx);
  const arrow = document.getElementById('iarrow-' + idx);
  if (!body) return;
  const open = body.classList.toggle('open');
  if (arrow) arrow.textContent = open ? '▾' : '▸';
  // T-202604-253: marcar ítem como seleccionado al expandir/colapsar
  _backlogSetSelected(body.closest ? body.closest('.item[data-code]') : null);
  // R-202604-015: abrir/cerrar panel lateral al expandir ítem
  const itemEl = body.closest ? body.closest('.item[data-code]') : null;
  const code = itemEl ? itemEl.dataset.code : null;
  if (open && code) {
    openItemPanel(code);
  } else if (!open) {
    closeItemPanel();
  }
}

// T-104/106: toggle secciones done/futura
function toggleSectionGroup(key) {
  const body = document.getElementById('sgbody-' + key);
  const arrow = document.getElementById('sgarrow-' + key);
  if (!body) return;
  const collapsed = body.classList.toggle('collapsed');
  if (arrow) arrow.textContent = collapsed ? '▸' : '▾';
  try { localStorage.setItem('backlog-' + key + '-open', collapsed ? '0' : '1'); } catch {}
}

// T-109: limpiar todos los filtros
function clearAllFilters() {
  activeTypes = new Set(['T','R','B','P']);
  activeStatuses = new Set(['pendiente']);
  activeEfforts = new Set([1, 2, 3]); // T-071
  activeRoleFilter = null; // T-202604-245
  activePriorityFilter = new Set(); // T-202604-357
  _backlogNoAcMode = false; // T-202604-363
  backlogSearchQuery = '';
  backlogSortMode = 'priority'; // T-202604-424: sprint eliminado como opción de sort
  backlogSortDir = 'desc'; // T-072 — default desc
  _backlogFocusMode = false; // T-202604-258
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
  updateClearFilterBtn();
  _markBacklogListDirty(); renderBacklogList();
}

// R-202605-122 AC3: asignación rápida de effort desde badge sin abrir editor completo
function _quickAssignEffort(codeOrId) {
  const item = ITEMS.find(i => i.code === codeOrId || i.id === codeOrId);
  if (!item) return;
  const val = prompt('Asignar effort a ' + (item.code || item.id) + ' (1 = simple · 2 = medio · 3 = complejo):', '1');
  const n = parseInt(val);
  if (!val || isNaN(n) || n < 1 || n > 3) { showToast('warning', '⚠ Valor no válido — ingresa 1, 2 o 3'); return; }
  item.effort = n;
  if (item._needsEffortReview) delete item._needsEffortReview;
  _undoSnapshot();
  saveBacklog();
  _markBacklogListDirty(); renderBacklogList();
  renderStats();
  showToast('success', '✓ Effort ' + n + ' asignado a ' + (item.code || item.id));
}

// T-071: toggle filtro por esfuerzo
function toggleEffortFilter(e) {
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
  _markBacklogListDirty(); renderBacklogList();
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
function setItemRole(code, role) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  item.role = role || '';
  _undoSnapshot();
  _blogLog('rol →', code, role || '(vacío)', 'backlog');
  saveBacklog();
  _setBacklogModified();
  _markBacklogListDirty(); renderBacklogList();
  renderStats();
  showToast('success', role ? `${code} → ${role}` : `${code} rol limpiado`);
}

// T-202604-245: toggle filtro por rol
function toggleRoleFilter(role) {
  // null = 'Sin rol'; string = rol específico
  if (activeRoleFilter === role) {
    activeRoleFilter = null; // segundo click = quitar filtro
  } else {
    activeRoleFilter = role;
  }
  updateRoleFilterUI();
  updateClearFilterBtn();
  _markBacklogListDirty(); renderBacklogList();
}

// T-202604-357: toggle filtro por prioridad — acumulable, combina con otros filtros
function togglePriorityFilter(p) {
  if (activePriorityFilter.has(p)) {
    activePriorityFilter.delete(p);
  } else {
    activePriorityFilter.add(p);
  }
  updateClearFilterBtn();
  _markBacklogListDirty(); renderBacklogList();
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
    return `<button class="fbtn frole-chip${isActive ? ' active' : ''}" data-role="${esc(r)}" onclick="toggleRoleFilter('${esc(r)}')" title="Filtrar por rol: ${esc(r)}">${esc(r)}</button>`;
  });
  if (noneCount > 0) {
    const isActive = activeRoleFilter === null && activeRoleFilter !== undefined && activeRoleFilter !== 'initial';
    // chip Sin rol: activo cuando activeRoleFilter === '__none__' (sentinel)
    const isSinRolActive = activeRoleFilter === '__none__';
    chips.push(`<button class="fbtn frole-chip${isSinRolActive ? ' active' : ''}" data-role="__none__" onclick="toggleRoleFilter('__none__')" title="Ítems sin rol asignado">Sin rol</button>`);
  }
  return `<div class="frole-bar" id="frole-bar">${chips.join('')}</div>`;
}

function onBacklogSortChange(val) {
  // T-202604-424: ignorar 'sprint' si llega de localStorage legacy o select antiguo
  if (val === 'sprint') val = 'priority';
  backlogSortMode = val;
  _markBacklogListDirty(); renderBacklogList();
}

// T-072: toggle dirección de sort
function toggleSortDir() {
  backlogSortDir = backlogSortDir === 'asc' ? 'desc' : 'asc';
  const btn = document.getElementById('fbar-sort-dir-btn');
  if (btn) btn.textContent = backlogSortDir === 'asc' ? '↑' : '↓';
  _markBacklogListDirty(); renderBacklogList();
}

// T-202604-187: toggle árbol vs vista plana
// B-202604-122: persistir estado en localStorage
// T-202604-287: toggle vista Kanban
// T-202604-313/366: Mi vista — T's pendientes del rol activo en sprint activo, rotativo
export function _getMiViewRoles() {
  const activeSprint = _getActiveSprint();
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
function toggleBacklogFooter() {
  _blFooterCollapsed = !_blFooterCollapsed;
  const filtersRow = document.getElementById('bl-footer-filters');
  const toggleBtn  = document.getElementById('bl-footer-toggle');
  if (filtersRow) filtersRow.classList.toggle('bl-footer-row--hidden', _blFooterCollapsed);
  if (toggleBtn)  toggleBtn.textContent = _blFooterCollapsed ? '▼' : '▲';
}

// AC: aria tablist — sincroniza atributos aria-selected (vistas de agrupación) y aria-checked (modificadores)
// Vistas de agrupación mutuamente excluyentes: Sprints · Árbol · Kanban · Planificar
// Modificadores combinables: Focus · Mi vista
// Regla: nunca todas las vistas de agrupación inactivas — default Sprints
function _syncViewAriaStates() {
  // Vistas de agrupación — aria-selected refleja estado de cada variable
  const sprintBtn   = document.getElementById('fbar-sprint-btn');
  const treeBtn     = document.getElementById('fbar-tree-btn');
  const kanbanBtn   = document.getElementById('fbar-kanban-btn');

  // Determinar vista de agrupación activa
  // Prioridad: Kanban > Árbol > Sprints (default)
  const anyGroupActive = _backlogKanbanMode || _backlogTreeMode || _backlogSprintGroupMode;
  // Garantizar default: si ninguna activa, activar Sprints
  if (!anyGroupActive) {
    _backlogSprintGroupMode = true;
    localStorage.setItem('backlog-sprint-group-mode', 'true');
    if (sprintBtn) sprintBtn.classList.add('active');
  }

  if (sprintBtn)   sprintBtn.setAttribute('aria-selected',   String(_backlogSprintGroupMode && !_backlogKanbanMode));
  if (treeBtn)     treeBtn.setAttribute('aria-selected',     String(_backlogTreeMode && !_backlogKanbanMode));
  if (kanbanBtn)   kanbanBtn.setAttribute('aria-selected',   String(_backlogKanbanMode));

  // AC: aria tabpanel — #backlog-list labelledby refleja el tab activo
  // B-202605-046: default fbar-tree-btn (fbar-sprint-btn eliminado del DOM)
  const backlogPanel = document.getElementById('backlog-list');
  if (backlogPanel) {
    let activeTabId = 'fbar-tree-btn'; // default
    if (_backlogKanbanMode)     activeTabId = 'fbar-kanban-btn';
    else if (_backlogTreeMode)  activeTabId = 'fbar-tree-btn';
    // Guard: solo aplicar si el tab existe en el DOM
    if (document.getElementById(activeTabId)) {
      backlogPanel.setAttribute('aria-labelledby', activeTabId);
    }
  }

  // Modificadores — aria-checked refleja estado
  const focusBtn = document.getElementById('fbar-focus-btn');
  const mikeBtn  = document.getElementById('fbar-mike-btn');
  if (focusBtn) focusBtn.setAttribute('aria-checked', String(_backlogFocusMode));
  if (mikeBtn)  mikeBtn.setAttribute('aria-checked',  String(_backlogMikeMode));
}

function toggleBacklogMikeMode() {
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
  updateClearFilterBtn();
  _syncViewAriaStates();
  _markBacklogListDirty(); renderBacklogList();
}

function toggleBacklogKanbanMode() {
  _backlogKanbanMode = !_backlogKanbanMode;
  if (_backlogKanbanMode) {
    _backlogTreeMode = false;
    localStorage.setItem('backlog-view-mode', 'kanban');
  } else {
    localStorage.setItem('backlog-view-mode', 'false'); // plano al salir de kanban
  }
  // Actualizar botón árbol
  const treeBtn = document.getElementById('fbar-tree-btn');
  if (treeBtn) {
    treeBtn.textContent = _backlogTreeMode ? '⊞ Árbol' : '☰ Plano';
    treeBtn.classList.toggle('active', _backlogTreeMode);
  }
  // Actualizar botón kanban
  const kbBtn = document.getElementById('fbar-kanban-btn');
  if (kbBtn) kbBtn.classList.toggle('active', _backlogKanbanMode);
  _syncViewAriaStates();
  _markBacklogListDirty(); renderBacklogList();
}

function toggleBacklogTreeMode() {
  if (_backlogKanbanMode) { _backlogKanbanMode = false; }
  _backlogTreeMode = !_backlogTreeMode;
  localStorage.setItem('backlog-view-mode', String(_backlogTreeMode));
  const btn = document.getElementById('fbar-tree-btn');
  if (btn) {
    btn.textContent = _backlogTreeMode ? '⊞ Árbol' : '☰ Plano';
    btn.title = _backlogTreeMode ? 'Vista árbol activa — click para vista plana' : 'Vista plana activa — click para vista árbol';
    btn.classList.toggle('active', _backlogTreeMode);
  }
  _syncViewAriaStates();
  _markBacklogListDirty(); renderBacklogList();
}

// T-202604-258: toggle modo Focus — top 10 ítems por score descendente
export function toggleBacklogFocusMode() {
  _backlogFocusMode = !_backlogFocusMode;
  const btn = document.getElementById('fbar-focus-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogFocusMode);
    // T-202604-421: tooltip explica criterios
    btn.title = _backlogFocusMode
      ? 'Focus activo — Top 10 por: tipo · sprint · effort · antigüedad · click para desactivar'
      : 'Activar Focus — Top 10 por: tipo · sprint · effort · antigüedad';
    if (!_backlogFocusMode) btn.textContent = '🎯 Focus'; // reset label al desactivar
  }
  // B-202604-157: recalcular scores al activar Focus — garantiza orden por relevancia actualizado
  if (_backlogFocusMode) _recalcAllScores();
  updateClearFilterBtn();
  _syncViewAriaStates();
  _markBacklogListDirty(); renderBacklogList();
}

// T-202604-363: toggle filtro Sin AC — pendientes sin criterios de aceptación
function toggleBacklogNoAcMode() {
  _backlogNoAcMode = !_backlogNoAcMode;
  const btn = document.getElementById('fbar-no-ac-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogNoAcMode);
    btn.title = _backlogNoAcMode ? 'Sin AC activo — click para desactivar' : 'Filtrar ítems sin criterios de aceptación';
  }
  updateClearFilterBtn();
  _markBacklogListDirty(); renderBacklogList();
}

// R-202605-130: vista Planificación — drag & drop de ítems sin sprint al sprint siguiente

// B-202605-XXX: _migrateItemTypes — stub de compatibilidad para call site en locus-storage.js
// R-202605-070: la lógica real fue absorbida por _normalizeItems(). Este stub redirige
// la llamada post-carga remota de _loadFromSupabase a _normalizeItems para mantener
// el contrato de datos sin duplicar lógica.
export function _migrateItemTypes() {
  if (typeof ITEMS === 'undefined') return;
  _setITEMS(_normalizeItems(ITEMS));
  saveBacklog();
}
window._migrateItemTypes = _migrateItemTypes;

// T-202605-053: Migrar handlers inline de index.html → addEventListener
// Funciones cubiertas: undoBacklog · redoBacklog · toggleBacklogTreeMode · toggleBacklogKanbanMode
// toggleBacklogFocusMode · toggleBacklogMikeMode · toggleCollapseAll · onBacklogSearch
// clearBacklogSearch · toggleStatusFilter (×5) · toggleBacklogBlockerFilter
// toggleBacklogNoAcMode · clearAllFilters
document.addEventListener('DOMContentLoaded', function () {
  // Undo / Redo
  const _btnUndo = document.getElementById('btn-undo-backlog');
  if (_btnUndo) _btnUndo.addEventListener('click', function () { if (typeof undoBacklog === 'function') undoBacklog(); });

  const _btnRedo = document.getElementById('btn-redo-backlog');
  if (_btnRedo) _btnRedo.addEventListener('click', function () { if (typeof redoBacklog === 'function') redoBacklog(); });

  // Vista — Árbol / Kanban / Focus / Mi vista
  const _btnTree = document.getElementById('fbar-tree-btn');
  if (_btnTree) _btnTree.addEventListener('click', function () { if (typeof toggleBacklogTreeMode === 'function') toggleBacklogTreeMode(); });

  const _btnKanban = document.getElementById('fbar-kanban-btn');
  if (_btnKanban) _btnKanban.addEventListener('click', function () { if (typeof toggleBacklogKanbanMode === 'function') toggleBacklogKanbanMode(); });

  const _btnFocus = document.getElementById('fbar-focus-btn');
  if (_btnFocus) _btnFocus.addEventListener('click', function () { if (typeof toggleBacklogFocusMode === 'function') toggleBacklogFocusMode(); });

  const _btnMike = document.getElementById('fbar-mike-btn');
  if (_btnMike) _btnMike.addEventListener('click', function () { if (typeof toggleBacklogMikeMode === 'function') toggleBacklogMikeMode(); });

  // Colapsar / expandir todos
  const _btnCollapse = document.getElementById('bl-collapse-all-btn');
  if (_btnCollapse) _btnCollapse.addEventListener('click', function () { if (typeof toggleCollapseAll === 'function') toggleCollapseAll(); });

  // Búsqueda
  const _inputSearch = document.getElementById('backlog-search-input');
  if (_inputSearch) _inputSearch.addEventListener('input', function () { if (typeof onBacklogSearch === 'function') onBacklogSearch(); });

  const _btnSearchClear = document.getElementById('backlog-search-clear');
  if (_btnSearchClear) _btnSearchClear.addEventListener('click', function () { if (typeof clearBacklogSearch === 'function') clearBacklogSearch(); });

  // Filtros de status
  const _statusMap = {
    'fstatus-pendiente':  'pendiente',
    'fstatus-en-revision': 'en-revision',
    'fstatus-done':       'done',
    'fstatus-en-curso':   'en curso',
    'fstatus-descartado': 'descartado'
  };
  Object.keys(_statusMap).forEach(function (id) {
    const _btn = document.getElementById(id);
    if (_btn) _btn.addEventListener('click', (function (val) {
      return function () { if (typeof toggleStatusFilter === 'function') toggleStatusFilter(val); };
    }(_statusMap[id])));
  });

  // Filtro Bloqueados
  const _btnBlocker = document.getElementById('fbar-blocker-btn');
  if (_btnBlocker) _btnBlocker.addEventListener('click', function () { if (typeof toggleBacklogBlockerFilter === 'function') toggleBacklogBlockerFilter(); });

  // Filtro Sin AC
  const _btnNoAc = document.getElementById('fbar-no-ac-btn');
  if (_btnNoAc) _btnNoAc.addEventListener('click', function () { if (typeof toggleBacklogNoAcMode === 'function') toggleBacklogNoAcMode(); });

  // Limpiar todos los filtros
  const _btnClearFilters = document.getElementById('filter-clear-btn');
  if (_btnClearFilters) _btnClearFilters.addEventListener('click', function () { if (typeof clearAllFilters === 'function') clearAllFilters(); });
});
