// [PP] mod:68 · autor:Rune · 2026-06-30 UTC-6
// INC-[pendiente-ID] (normalizeStatus sin caso explícito para 'discovery' — fallback
//   silencioso a 'pendiente'): agregado caso explícito 'discovery' → 'discovery' para
//   type DISC, 'pendiente' para cualquier otro tipo — mismo patrón que 'promoted'/
//   'promovida' en la línea anterior. Ver locus-session-parse.js mod:82 para el fix
//   complementario en el gate de validación del parser.
// TKT1 (REQ-getactiveprojectfilter): comentario de propietario de getActiveProjectFilter
//   corregido — locus-sprint-project.js ya no posee la función desde T-202606-197.
// [tmp:tkt-isqinc-unify]: isQIncItem(i) exportada — consolida _isQInc (renderBacklogList)
//   y _isQIncItem (renderQIncPanel) en función única. _getCountableBaseForSubtab('qinc')
//   actualizada para consumirla. locus-backlog-render.js la importa.
// TKT (REQ-[pendiente-ID] · UI: sub-tab Q-INC reemplaza Hotfix): empty state
//   label de tipo INC en chips de filtro corregido de 'Sin Bugs' a 'Sin Incidentes'.
//   typeScores (PRB:20/KE:15/CHG:10), namespace qinc y _nsGetTypes('qinc') ya
//   estaban implementados desde TKT-A2 (mod:58) — sin cambio adicional requerido.
// TKT-A2 (REQ-[pendiente-ID]): Q-INC reemplaza S-HOTFIX como zona ITIL.
//   namespace _subtabNS.hotfix → qinc (types INC/PRB/KE/CHG); gate de sprint S-HOTFIX
//   reemplazado por gate de queue Q-INC con mensaje canónico BR-Core §6; universo
//   _getCountableBaseForSubtab('hotfix') → ('qinc') sobre campo item.queue; activeTypes
//   por defecto amplía de 4 a 7 tipos Gen2 (TKT/REQ/INC/DISC/PRB/KE/CHG) — clearTypeFilters,
//   toggleTypeFilter, clearAllFilters y reset de filter-panel actualizados consistentemente;
//   typeScores de _calcRelevanceScore incluye PRB:20/KE:15/CHG:10. __BR-Execution §2.
// TKT-C1b (REQ-C): wrapper transitorio _isIcebox eliminado — TKT-C1 (locus-backlog-render.js
//   mod:45) ya no la importa. Comentarios de INC-[pendiente-ID] y referencia a renderIceboxPanel
//   retirados. __BR-Execution §2 Sin retrocompatibilidad.
// locus-backlog-core.js
// Responsabilidad: State global (ITEMS, undo/redo), carga, parse, importación,
//   filtros, vistas, sort, stats, footer, helpers de badge/status/effort.

// T-202606-057: imports hacia módulos que importan a locus-backlog-core eliminados.
// Funciones desacopladas via _coreCallbacks (getters/acciones controladas)
// y shell:* events (notificaciones de render — window per B-202606-021).
import { _blogLog, _effectiveVersion, _isInSession, _loadFromSupabase, _sprintDisplay, _tplKey, getAI, getActiveSprints, getAllSessions, getState, saveBacklog } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';
import { esc, getCurrentSubTab } from './locus-ui-shell.js';

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
//   locus-proj-core.js       → getActiveProjectFilter
var _coreCallbacks; // ESM-B: var + lazy init — evita TDZ en ciclo locus-ui-shell ↔ locus-docs ↔ locus-backlog-core

export function _registerCoreCallback(name, fn) {
  if (!_coreCallbacks) _coreCallbacks = {}; // lazy init — var hoist como undefined en ciclo ESM
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
// Consumidores: ITEMS IIFE · _normalizeItems · locus-session-parse.js (T-202606-048)
export function normalizeStatus(raw, type) {
  const s = (raw || '').trim().toLowerCase();
  // Aliases de entrada conocidos
  if (s === 'en_revision' || s === 'en revisión' || s === 'en-revisión') return 'en-revision';
  // Valores canónicos directos
  if (s === 'done')        return 'done';
  if (s === 'en-revision') return 'en-revision';
  if (s === 'descartado')  return 'descartado';
  if (s === 'historico')   return 'historico';
  if (s === 'promovida' || s === 'promoted') return type === 'DISC' ? 'promoted' : 'pendiente';
  if (s === 'discovery') return type === 'DISC' ? 'discovery' : 'pendiente'; // INC-[pendiente-ID]: discovery solo válido para DISC — __BR-Ecosystem §5
  // TKT-202606-006: legado 'pendiente' (o status ausente/vacío) en DISC migra a 'discovery' — REQ-202606-002
  if (s === 'pendiente' || s === '') return type === 'DISC' ? 'discovery' : 'pendiente';
  // Valor desconocido → pendiente
  return 'pendiente';
}

// TKT1 (REQ-[pendiente-ID] · Integridad de generación y persistencia de código de ítems):
//   _GEN2_TYPES movida desde locus-session-parse.js — fuente única consumida por
//   locus-session-parse.js y locus-backlog-item.js. Ambos módulos ya importaban de
//   locus-backlog-core.js — sin ciclo nuevo. locus-backlog-core.js no importa de
//   ninguno de los dos.
export const _GEN2_TYPES = ['REQ', 'TKT', 'DISC', 'INC', 'PRB', 'KE', 'CHG'];

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
      // T-202606-106: carga local — excluir status:historico del valor inicial de ITEMS.
      // historico es de solo lectura, asignado únicamente por Locus al cerrar sprint, y vive
      // en su storage dedicado (T-202606-105) — nunca debe poblar ITEMS, ni siquiera al iniciar.
      return items.filter(i => i.status !== 'historico');
    } catch {
      return [];
    }
  }
  return [];
})();

// getItems(): acceso canónico al array ITEMS — reemplaza window.ITEMS (ESM-1 · T-202606-037)
export function getItems() { return ITEMS; }
// T-202606-106: barrera común — ITEMS nunca contiene ítems status:historico, sin importar
// el call site (_loadFromSupabase, undo/redo, purge, normalize, etc). status:historico es
// de solo lectura, asignado únicamente por Locus al cerrar sprint — vive en su storage
// dedicado (T-202606-105), nunca en ITEMS.
function _setITEMS(arr) {
  const _safe = Array.isArray(arr) ? arr.filter(i => i.status !== 'historico') : [];
  ITEMS.splice(0, ITEMS.length, ..._safe);
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
  const _openItemEditorCb = (_coreCallbacks || {}).openItemEditor;
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

// T-202606-005 (T2): namespaces de filtro aislados por subtab — q-backlog y qinc tienen su
// propio state independiente del state global de Backlog (activeTypes/activeStatuses/etc).
// Cold start: todos los tipos/statuses habilitados, searchQuery vacío — sin herencia del global.
// TKT-A2: namespace de cola ITIL legacy reemplazado por 'qinc' — zona acepta INC/PRB/KE/CHG.
const _subtabNS = {
  'q-backlog': {
    types:    new Set(['TKT','REQ','INC','DISC']),
    statuses: new Set(['pendiente','en-revision','done','descartado','promoted']),
    priority: new Set(),
    query:    ''
  },
  qinc: {
    types:    new Set(['INC','PRB','KE','CHG']),
    statuses: new Set(['detected','assigned','in_progress','resolved','closed','escalated_to_prb','escalated_to_chg','descartado']),
    priority: new Set(),
    query:    ''
  }
};

// Getters de namespace por subtab
export function _nsGetTypes(sub)    { return _subtabNS[sub] ? _subtabNS[sub].types    : new Set(['TKT','REQ','INC','DISC']); }
export function _nsGetStatuses(sub) { return _subtabNS[sub] ? _subtabNS[sub].statuses : new Set(['pendiente','en-revision','discovery']); } // TKT-202606-006: fallback incluye 'discovery' — gobierna default visible de Q-DISC
export function _nsGetPriority(sub) { return _subtabNS[sub] ? _subtabNS[sub].priority : new Set(); }
export function _nsGetQuery(sub)    { return _subtabNS[sub] ? _subtabNS[sub].query    : ''; }

// Setters de namespace por subtab
export function _nsSetQuery(sub, q) {
  if (!_subtabNS[sub]) return;
  _subtabNS[sub].query = q;
}

// Toggle de tipo en namespace
export function _nsToggleType(sub, type) {
  if (!_subtabNS[sub]) return;
  const s = _subtabNS[sub].types;
  if (s.has(type)) { s.delete(type); } else { s.add(type); }
}

// Toggle de prioridad en namespace
export function _nsTogglePriority(sub, pri) {
  if (!_subtabNS[sub]) return;
  const s = _subtabNS[sub].priority;
  if (s.has(pri)) { s.delete(pri); } else { s.add(pri); }
}

// Reset de namespace (todos los filtros al estado inicial)
export function _nsReset(sub) {
  if (!_subtabNS[sub]) return;
  _subtabNS[sub].types    = new Set(['TKT','REQ','INC','DISC']);
  _subtabNS[sub].statuses = new Set(['pendiente','en-revision','done','descartado','promoted']);
  _subtabNS[sub].priority = new Set();
  _subtabNS[sub].query    = '';
}
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
// TKT-A2: activeTypes por defecto incluye los 7 tipos Gen2 — PRB/KE/CHG no quedan
// filtrados fuera por default aunque normalmente vivan en Q-INC, no en el Backlog regular.
let activeTypes = new Set(['TKT','REQ','INC','DISC','PRB','KE','CHG']);
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
// T-202606-103: migrado de .bl-children-wrap → .bl-vl-req-body
export function toggleShowChildren(checked) {
  const childWraps = document.querySelectorAll('.bl-vl-req-body');
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

// T-202605-449: filtro por ítems con dependencias bloqueantes activas
// 0 = sin filtro | 1 = solo bloqueados | 2 = solo desbloqueados
let _depsFilter = 0;
export function toggleDepsFilter() {
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
  const _hasRecentSessionCb = (_coreCallbacks || {}).hasRecentSession;
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
  if (itemKind(item) === 'INC') return 'high';
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
  // TKT-A2: PRB/KE/CHG agregados — viven en Q-INC, score relativo entre INC(25) y DISC(6)
  const typeScores = { INC: 25, TKT: 18, REQ: 12, PRB: 20, KE: 15, CHG: 10, DISC: 6 };
  const type = itemKind(item) || 'TKT';
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
  // Segunda pasada: ítems con doneAt populado pero status distinto de done/descartado/historico
  // Causa: merge desde CHECKPOINT sobrescribió status sin respetar doneAt existente
  // B-202606-085: _mdiffDoApply no limpiaba doneAt al retroceder — produce en-revision + doneAt
  // B-202604-[pendiente-ID]: si el ítem tiene discardReason, el status correcto es 'descartado', no 'done'
  // B-202605-008: snapshot antes de mutar — resultado deshacible via undoBacklog()
  // B-202606-086: filtro ampliado — antes solo capturaba status 'pendiente', ahora captura cualquier
  //   status activo (pendiente, en-revision, bloqueado, etc.) con doneAt populado
  const pendingWithDoneAt = ITEMS.filter(item =>
    item.doneAt &&
    item.status !== 'done' &&
    item.status !== 'descartado' &&
    item.status !== 'historico'
  );
  if (pendingWithDoneAt.length > 0) _undoSnapshot();
  let revived = 0;
  pendingWithDoneAt.forEach(item => {
      const targetStatus = item.discardReason ? 'descartado' : 'done';
      item.status = targetStatus;
      if (!item.history) item.history = [];
      item.history.push({
        type: 'status',
        ts: Date.now(),
        data: { from: item.status, to: targetStatus, reason: 'sanitize-doneat-mismatch' }
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

// T-202606-104: Purge permanente de ítems legacy (status historico sin sprint cerrado).
// Exportada para que locus-backlog-archive.js pueda invocarla desde el botón Purgar de la sección legacy.
// Elimina del array en memoria todos los ítems con status 'historico'.
// Acción irreversible (salvo undo inmediato) — requiere confirmación explícita.
export function purgeAllHistorico() {
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
    // Ausente: inferir con itemKind() — usa prefijo de code contra GEN2_TYPES.
    // Sin default forzado: si itemKind retorna null, item.type queda undefined.
    if (!item.type) {
      const inferred = itemKind(item);
      if (inferred) {
        item.type = inferred;
        _blogLog('normalize', item.code || '(sin código)', `type inferido desde prefijo → ${item.type}`, 'backlog');
      } else {
        _blogLog('normalize-warn', item.code || '(sin código)', 'type ausente y no inferible — item.type queda undefined', 'backlog');
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

  // TKT-A2: gate de asignación a Q-INC — solo INC/PRB/KE/CHG pueden vivir en queue [Prefijo]-Q-INC.
  // BR-Core §6: Q-INC solo acepta INC/PRB/KE/CHG — ningún REQ, TKT ni DISC puede asignarse a Q-INC.
  items.forEach(item => {
    if (!item.queue || !item.queue.endsWith('-Q-INC')) return;
    const _qincTypes = ['INC', 'PRB', 'KE', 'CHG'];
    const _type = itemKind(item);
    if (!_qincTypes.includes(_type)) {
      _blogLog(
        'qinc-rejected',
        item.code || '(sin código)',
        `Q-INC solo acepta INC/PRB/KE/CHG — ${_type || item.type} ${item.code || '(sin código)'} no puede asignarse a esta zona`,
        'backlog'
      );
      delete item.queue; // tipo no válido para Q-INC — queue limpiado
    }
  });

  // T-202606-011: SUSPENDIDO — P pendiente de Vera (ciclo de vida de R sin Ts).
  // Degradación silenciosa R→P desactivada hasta que BR-Core §4 y BR-Ecosystem §5
  // definan el nuevo modelo: gate en parser + flag orphaned + P como único origen de R.
  // R existente sin Ts → flag orphaned:true, sin degradación de type.
  items.forEach(item => {
    if (item.type !== 'REQ') return;
    if (item.status === 'descartado') return;
    const _hasValidChild = items.some(i =>
      i.type === 'TKT' && i.parentId === item.code && i.status !== 'descartado'
    );
    if (!_hasValidChild) {
      item.orphaned = true;
      _blogLog('r-sin-ts', item.code || '(sin código)',
        (item.code || '(sin código)') + ' sin Ts válidos — marcado orphaned:true (degradación suspendida)',
        'backlog');
    } else {
      // Limpiar flag si el R recuperó hijos válidos
      if (item.orphaned) delete item.orphaned;
    }
  });

  return items;
}

// Guard de re-entrada — evita recursión infinita entre renderStats() y loadBacklog()
// cuando ITEMS está vacío durante init y getItems aún no está registrado.
let _loadBacklogInFlight = false;

export function loadBacklog() {
  if (_loadBacklogInFlight) return;
  _loadBacklogInFlight = true;
  try {
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

  // B-202606-016: sanear ítems con status:'historico' cuyo sprint no está cerrado.
  // Origen: normalizeStatus acepta 'historico' como canónico — si el dato llegó con
  // ese valor sin tener sprint cerrado, _normalizeItems lo pasa sin mutar.
  // Fix: detectar post-normalización, resetear a 'pendiente' y registrar en DocLog.
  {
    const closedIds = new Set(
      getActiveSprints().filter(s => s.status === 'closed').map(s => s.id)
    );
    let sanitizedHistorico = 0;
    ITEMS.forEach(i => {
      if (i.status === 'historico' && !closedIds.has(i.sprint)) {
        i.status = 'pendiente';
        sanitizedHistorico++;
        _blogLog('fix', i.code || '(sin código)',
          `B-202606-016: status:historico sin sprint cerrado → pendiente (sprint: ${i.sprint || '(sin sprint)'})`,
          'backlog');
      }
    });
    if (sanitizedHistorico > 0) {
      console.log(`[AI Tracker] B-202606-016: ${sanitizedHistorico} ítem(s) con status:historico inválido → pendiente`);
    }
  }

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
  // inline_fix: badges del sidebar no se poblaban al init — _updateSubtabBadges() solo
  // se llamaba reactivamente. shell:render-backlog-list dispara renderBacklogList() +
  // renderStats() + _updateSubtabBadges() sin introducir dependencia circular.
  // Path Supabase: _loadFromSupabase() ya despacha este evento al terminar (locus-storage.js:1461)
  // — este dispatch cubre el path localStorage y el snapshot inmediato del path Supabase.
  window.dispatchEvent(new CustomEvent('shell:render-backlog-list'));
  } finally {
    _loadBacklogInFlight = false;
  }
}

// TKT0-gen2: deriva el tipo del ítem — campo type explícito si existe,
// si no, prefijo multi-char Gen2 del code (REQ-/TKT-/DISC-/INC-/PRB-/KE-/CHG-).
// Reemplaza a itemType(code) — Gen1 derivaba por un solo carácter (T-049).
// Sin alias I→P: un code que empieza con 'I-' no resuelve a tipo válido.
const GEN2_TYPES = ['REQ', 'TKT', 'DISC', 'INC', 'PRB', 'KE', 'CHG'];
export function itemKind(item) {
  if (!item) return null;
  if (item.type && GEN2_TYPES.includes(item.type)) return item.type;
  const code = item.code || '';
  for (const t of GEN2_TYPES) {
    if (code.startsWith(t + '-')) return t;
  }
  return null;
}

// TKT0-gen2: toggle filtros tipo — claves Gen2 (REQ/TKT/DISC/INC)
// T-049 (histórico): versión original operaba sobre T/R/B/P
// B-202604-146: reset explícito de filtros de tipo
function clearTypeFilters() {
  activeTypes = new Set(['TKT','REQ','INC','DISC','PRB','KE','CHG']);
  updateTypeFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

export function toggleTypeFilter(type) {
  const allActive = activeTypes.size === 7; // TKT/REQ/DISC/INC/PRB/KE/CHG
  if (allActive) {
    // primer click: desactiva todos, activa solo el clickeado
    activeTypes = new Set([type]);
  } else if (activeTypes.has(type)) {
    // click en activo: si es el único, restaura todos
    if (activeTypes.size === 1) {
      activeTypes = new Set(['TKT','REQ','INC','DISC','PRB','KE','CHG']);
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
  // [tmp:tkt-typefilter-gen2]: iteración sobre 7 códigos Gen2 — Gen1 (T/R/B/P) eliminados
  ['REQ','TKT','INC','DISC','PRB','KE','CHG'].forEach(t => {
    const btn = document.getElementById('ftype-' + t);
    if (btn) btn.classList.toggle('active', activeTypes.has(t));
    // chips accionables en stats bar
    const chip = document.querySelector(`.stat-type-chip.tc-${t}`);
    if (chip) chip.classList.toggle('active', activeTypes.has(t));
  });
  // B-UX: indicar visualmente cuando todos los tipos están activos = estado neutro "sin filtro"
  const sTypesEl = document.querySelector('.stat-card.s-types');
  if (sTypesEl) sTypesEl.classList.toggle('s-types--all-active', activeTypes.size === 7);
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
}

// T-049: toggle filtros status
// [pendiente-ID]: descartado sincroniza promoted — bloque Cerradas unificado
export function toggleStatusFilter(status) {
  if (status === 'done' || status === 'descartado') {
    if (activeStatuses.has(status)) {
      activeStatuses.delete(status);
      if (status === 'descartado') activeStatuses.delete('promoted');
    } else {
      activeStatuses.add(status);
      if (status === 'descartado') activeStatuses.add('promoted');
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
    // T-202606-066 AC-1: mismo pulse en la píldora del panel correspondiente
    const fpId = status === 'done' ? 'fp-done' : status === 'descartado' ? 'fp-descartado' : status === 'pendiente' ? 'fp-pendiente' : null;
    if (fpId) {
      const fpEl = document.getElementById(fpId);
      if (fpEl) { fpEl.classList.remove('filter-pulse'); void fpEl.offsetWidth; fpEl.classList.add('filter-pulse'); fpEl.addEventListener('animationend', () => fpEl.classList.remove('filter-pulse'), { once: true }); }
    }
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
  // T-202606-056: sincronizar píldoras del panel con el mismo estado
  const fpPend = document.getElementById('fp-pendiente');
  if (fpPend) fpPend.classList.toggle('active', activeStatuses.has('pendiente'));
  const fpDone = document.getElementById('fp-done');
  if (fpDone) fpDone.classList.toggle('active', activeStatuses.has('done'));
  const fpDesc = document.getElementById('fp-descartado');
  if (fpDesc) fpDesc.classList.toggle('active', activeStatuses.has('descartado'));
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

// B-202606-032: helper compartido — consume _getCountableBase() (T-202606-100)
// Misma fuente canónica que renderStats() — garantiza universo idéntico entre banner y stats.
function _getCountableForBanner() {
  return _getCountableBase();
}

// T-048: actualizar banner
export function updateBacklogBanner() {
  const banner    = document.getElementById('backlog-meta-banner');
  const exportBtn = document.getElementById('export-backlog-btn');
  const gfItems   = document.getElementById('gf-items');
  const gfToggle  = document.getElementById('gf-footer-toggle');
  const _bannProjId = _coreCallbacks.getActiveProjectFilter?.() || localStorage.getItem('current-project-filter') || '';
  if (!_bannProjId || !ITEMS.length) {
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
function _applyExitAnimOrRender(code, rCode) {
  if (!activeStatuses.has('done')) {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.classList.add('item-exit-anim');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
        if (rCode) window.dispatchEvent(new CustomEvent('shell:backlog-r-auto-advanced', { detail: { rCode } }));
        renderStats();
        window.dispatchEvent(new CustomEvent('shell:sprint-render'));
      }, 360); // T-202605-058 T-202605-044
      return;
    }
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  if (rCode) window.dispatchEvent(new CustomEvent('shell:backlog-r-auto-advanced', { detail: { rCode } }));
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
  if (!changedItem || changedItem.type !== 'TKT' || !changedItem.parentId) return;

  const parent = ITEMS.find(i => i.code === changedItem.parentId && i.type === 'REQ');
  if (!parent) return;

  // AC-5 (B-039): REQ ya en done o descartado — no modificar
  if (parent.status === 'done' || parent.status === 'descartado') return;

  // Obtener todos los TKTs hijos del REQ, excluyendo descartados
  const activeSiblings = ITEMS.filter(i =>
    i.type === 'TKT' && i.parentId === parent.code && i.status !== 'descartado'
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
      return parent.code; // B-202606-009: señal para micro-flash en pill del R
    }
    return null;
  }

  // B-202606-040: en-revision → en-proceso — algún T retrocedió de done, ya no todos están done
  if (parent.status === 'en-revision') {
    parent.status = 'en-proceso';
    parent.statusChangedAt = Date.now();
    if (!parent.history) parent.history = [];
    parent.history.push({ type: 'status', ts: parent.statusChangedAt, data: { from: 'en-revision', to: 'en-proceso', reason: 'auto-child-retroceded' } });
    _blogLog('status-auto →', parent.code, 'en-revision → en-proceso (T hijo retrocedió de done)', 'backlog');
    return parent.code; // B-202606-009: señal para micro-flash en pill del R
  }

  // AC-1 (B-039): pendiente → en-proceso — el T que cambió salió de pendiente y no es descartado
  if (parent.status === 'pendiente' && newTStatus !== 'descartado') {
    parent.status = 'en-proceso';
    parent.statusChangedAt = Date.now();
    if (!parent.history) parent.history = [];
    parent.history.push({ type: 'status', ts: parent.statusChangedAt, data: { from: 'pendiente', to: 'en-proceso', reason: 'auto-child-advanced' } });
    _blogLog('status-auto →', parent.code, 'pendiente → en-proceso (T hijo avanzó)', 'backlog');
    return parent.code; // B-202606-009: señal para micro-flash en pill del R
  }

  return null;
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
  // Capa 2 — done sin sprint (Q-Backlog): alerta informativa per BR-Ecosystem §5 (suave — no bloquea)
  if (newStatus === 'done' && (!item.sprint || item.sprint === '')) {
    setTimeout(() => showToast('warning', `${code} marcado done sin sprint asignado — asignar a sprint para trazabilidad correcta.`, null, 6000), 400);
  }
  // R-202604-015: registrar cambio en history[]
  if (!item.history) item.history = [];
  item.history.push({ type: 'status', ts: item.statusChangedAt, aiId: _getActiveSessionAiId() || undefined, data: { from: prevStatus, to: newStatus, role: item.role || '' } });
  if (newStatus === 'pendiente') item.priority = _calcPriority(item); // T-202604-297
  _recalcAllScores(); // T-202604-257: recalcular scores tras cambio de status
  // B-202606-039: sincronizar status del R padre si el ítem cambiado es un T hijo
  // B-202606-009: capturar rCode si hubo transición automática para micro-flash post-render
  const _autoAdvancedRCode = _syncParentRStatus(code, newStatus);
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
  // B-202606-009: emitir shell:backlog-r-auto-advanced si el R padre avanzó automáticamente
  if (newStatus === 'done') _applyExitAnimOrRender(code, _autoAdvancedRCode);
  else {
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
    if (_autoAdvancedRCode) window.dispatchEvent(new CustomEvent('shell:backlog-r-auto-advanced', { detail: { rCode: _autoAdvancedRCode } }));
    renderStats();
    window.dispatchEvent(new CustomEvent('shell:sprint-render'));
  }
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
// B-202606-097 fix: Rs no pueden ir a done desde la UI — requieren sesión de cierre de Finn
// (BR-Core §4 · ciclo de vida de R). El CHECK constraint chk_status_by_type de Postgres
// fue actualizado (B-202606-100) para permitir 'done' en type:R — el upsert ya no falla
// con error 23514 para este caso. El gate de origen sigue siendo JS: solo un patch dentro
// de un CHECKPOINT con role 'QA · Finn' puede pasar authorized=true. Cualquier llamada desde
// UI (_showInlineConfirmDone, fallback sin DOM) nunca pasa authorized — sigue bloqueada.
export function _applyDoneStatus(code, authorized) {
  const item = ITEMS.find(i => i.code === code);
  if (!item || item.status === 'done') return;

  // Gate de tipo REQ — done solo es válido si llega autorizado (patch de Finn vía CHECKPOINT).
  // Cualquier otro origen (UI manual, drag&drop, IDP) sigue bloqueado sin excepción.
  if (itemKind(item) === 'REQ' && authorized !== true) {
    setTimeout(() => showToast('warning', `${code} es un REQ — no puede marcarse done desde la UI. Requiere sesión de cierre de Finn (BR-Core §4).`, null, 7000), 0);
    return;
  }

  const _prevStatus = item.status;
  item.status = 'done';
  item.statusChangedAt = Date.now();
  if (!item.doneAt) item.doneAt = Date.now();
  item.closedInVersion = _effectiveVersion();
  // Capa 2 — done sin sprint (Q-Backlog): alerta informativa per BR-Ecosystem §5 (suave — no bloquea)
  if (!item.sprint || item.sprint === '') {
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

// R-202606-033: Rs con hijos cuentan como ítems vivos — tienen AC de coherencia propios.
// Solo P queda excluida de contadores de trabajo activo.
export function _isCountableItem(i) {
  if (itemKind(i) === 'DISC') return false; // DISC (discoveries) no contaminan contadores de trabajo activo
  return true;
}

// Gen2 — zonas Q-Backlog y Q-DISC. Consumidas por _getCountableBaseForSubtab() (este archivo)
// y por los paneles Q-Backlog / Q-DISC en locus-backlog-render.js (Cluster C).
export function _isQBacklog(i) {
  return (itemKind(i) === 'REQ' || itemKind(i) === 'TKT') && (!i.sprint || i.sprint === '');
}
export function _isQDisc(i) {
  return itemKind(i) === 'DISC' && (!i.sprint || i.sprint === '');
}

// TKT-C1b: _isIcebox wrapper transitorio eliminado — locus-backlog-render.js mod:45 (TKT-C1)
// ya no la importa. __BR-Execution §2 Sin retrocompatibilidad.

// [tmp:tkt-isqinc-unify]: función exportada única para detectar ítems ITIL de Q-INC.
// Consolida _isQInc (locus-backlog-render.js renderBacklogList) y _isQIncItem
// (locus-backlog-render.js renderQIncPanel) — locus-backlog-render.js importa esta.
// Patrón análogo a _isQBacklog / _isQDisc.
export function isQIncItem(i) {
  return (i.queue || '').endsWith('-Q-INC') || ['INC', 'PRB', 'KE', 'CHG'].includes(itemKind(i));
}

// T-202606-100: _getCountableBase() — función canónica compartida entre renderStats() y _getCountableForBanner()
// Retorna ITEMS filtrado por: _isCountableItem === true · status !== descartado · status !== historico
//   · sprint no en closedSprintIds · NOT (status === done AND sin sprint o sprint === icebox)
// renderStats() y updateBacklogBanner()/_getCountableForBanner() consumen este array base
// antes de aplicar sus propios filtros internos — garantiza universo idéntico entre ambas funciones.
// T-202606-008 AC2 — único consumidor del universo "backlog": no se modifica ni se extiende a otros subtabs.
export function _getCountableBase() {
  const closedSprintIds = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  return ITEMS.filter(i =>
    _isCountableItem(i) &&
    i.status !== 'descartado' &&
    i.status !== 'historico' &&
    !(i.sprint && closedSprintIds.has(i.sprint)) &&
    !(i.status === 'done' && (!i.sprint || i.sprint === ''))
  );
}

// T-202606-008 — universo de stats-bar por subtab activo. AC1/AC2/AC6/edge-historico.
// no_incluye T-202606-008: no extiende _getCountableBase() — cada subtab usa su propio
// filtro directo sobre ITEMS, declarado explícitamente por AC en lugar de heredar
// exclusiones diseñadas para el universo del backlog regular (T-202606-100).
// Gen2: subtabs q-backlog y q-disc reemplazan a icebox.
export function _getCountableBaseForSubtab(sub) {
  if (sub === 'q-backlog') {
    // universo Q-Backlog: REQ/TKT sin sprint asignado
    return ITEMS.filter(i => _isQBacklog(i) && i.status !== 'descartado' && i.status !== 'historico');
  }
  if (sub === 'q-disc') {
    // universo Q-DISC: DISC sin sprint asignado
    return ITEMS.filter(i => _isQDisc(i) && i.status !== 'descartado' && i.status !== 'historico');
  }
  if (sub === 'qinc') {
    // [tmp:tkt-isqinc-unify]: usa isQIncItem() exportada — misma lógica que locus-backlog-render.js
    return ITEMS.filter(i => isQIncItem(i) && i.status !== 'descartado' && i.status !== 'historico');
  }
  if (sub === 'historico') {
    // Edge case AC — universo Histórico: status historico, excluido explícitamente de _getCountableBase()
    return ITEMS.filter(i => i.status === 'historico');
  }
  // AC2 — Backlog (default): comportamiento preservado sin cambios
  return _getCountableBase();
}

export function renderStats() {
  // T-202606-098 (T1): renderStats() es exclusiva del subtab Backlog.
  // Icebox/Qinc/Histórico tienen sus propias funciones de stats-bar (renderIceboxStats,
  // renderQincStats, renderHistoricoStats) — invocadas desde sus propios call sites.
  // Early-return para cualquier subtab distinto de 'backlog'.
  const _activeSub = getCurrentSubTab ? getCurrentSubTab() : 'backlog';
  if (_activeSub !== 'backlog') return;

  const _rsProjId = _coreCallbacks.getActiveProjectFilter?.() || localStorage.getItem('current-project-filter') || '';
  if (!_rsProjId) { document.getElementById('stats-bar').innerHTML = ''; return; }
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
        toggleEffortFilter(0);
      } else if (act === 'stats-role-filter') {
        toggleRoleFilter(btn.dataset.role);
      } else if (act === 'stats-toggle-collapse') {
        // T-202606-048: toggle colapso de stats bar — persiste en localStorage
        const isCollapsed = localStorage.getItem('locus-statsbar-collapsed') === 'true';
        localStorage.setItem('locus-statsbar-collapsed', String(!isCollapsed));
        renderStats();
      }
    });
  }

  // T-202606-048: leer estado de colapso persistido
  const _statsCollapsed = localStorage.getItem('locus-statsbar-collapsed') === 'true';

  // T-202606-048 AC 6/7: obtener sprint activo — metadata se calcula sobre ítems del sprint activo.
  const _activeSprint = (_coreCallbacks && _coreCallbacks.getActiveSprint) ? _coreCallbacks.getActiveSprint() : null;

  // Universo countable de Backlog
  const countableItems = _getCountableBaseForSubtab('backlog');

  // B-202606-008: incluir búsqueda activa — los contadores deben reflejar
  // los mismos ítems que aparecen en la lista, incluyendo el filtro de búsqueda.
  const _q = (backlogSearchQuery || '').trim().toLowerCase();
  const _matchesSearch = _q
    ? i => i.code.toLowerCase().includes(_q) || (i.title || '').toLowerCase().includes(_q) || (i.area || '').toLowerCase().includes(_q)
    : () => true;

  const visible = countableItems.filter(i => {
    const type = itemKind(i);
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
  const byType = {INC:0, TKT:0, REQ:0, DISC:0, PRB:0, KE:0, CHG:0};
  visible.forEach(i => { const t = itemKind(i); if (t && byType[t] !== undefined) byType[t]++; });

  // Por effort (sobre visibles)
  const byEffort = {1:0, 2:0, 3:0};
  visible.forEach(i => { const e = parseInt(i.effort)||1; if (byEffort[e] !== undefined) byEffort[e]++; });
  // R-202605-122 AC5 (histórico): contador de ítems sin effort (excluye DISC e históricos)
  const noEffortCount = countableItems.filter(i => !i.effort && itemKind(i) !== 'DISC' && i.status !== 'historico').length;

  // T-202606-048 AC 7: Backlog sin sprint activo — render simplificado
  if (!_activeSprint) {
    document.getElementById('stats-bar').innerHTML = `
      <div class="stats-bar-header">
        <span class="stats-bar-title">Stats</span>
        <button class="stats-bar-chevron" data-action="stats-toggle-collapse" title="${_statsCollapsed ? 'Expandir' : 'Colapsar'}">${_statsCollapsed ? '▸' : '▾'}</button>
      </div>
      ${!_statsCollapsed ? '<div class="stats-bar-body"><span class="stats-bar-no-sprint">Sin sprint activo</span></div>' : ''}
    `;
    updateTypeFilterUI();
    return;
  }

  // T-202606-048 AC 6: métricas sobre ítems del sprint activo
  const _sprintItems = ITEMS.filter(i => i.sprint === _activeSprint.id && i.status !== 'descartado' && i.status !== 'historico');
  const _sprintEffortTotal = _sprintItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);

  // T-202606-096: universo canónico — activos = countableItems (pendiente + en-revision + done)
  const backlogCount    = countableItems.filter(i => i.status === 'pendiente').length;
  const enRevisionCount = countableItems.filter(i => i.status === 'en-revision').length;
  const done            = countableItems.filter(i => i.status === 'done').length;
  // T-202606-048 AC 6: done/total sobre sprint activo
  const _sprintDone  = _sprintItems.filter(i => i.status === 'done').length;
  const _sprintTotal = _sprintItems.length;
  const total = backlogCount + enRevisionCount + done;
  const pct   = _sprintTotal > 0 ? Math.round((_sprintDone / _sprintTotal) * 100) : 0;
  // Contador separado de P (ideas) — visible pero fuera del flujo de trabajo activo
  // T-202606-100: closedSprintIds disponible via _getCountableBase() — recalcular inline para Ps (no pasan _isCountableItem)
  const _closedIdsForP = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  // T-202606-102: excluir promoted — pIdeasCount solo cuenta DISC con status pendiente
  // TKT-202606-006: 'pendiente' → 'discovery' — vocabulario DISC alineado a __BR-Ecosystem §5
  const pIdeasCount = ITEMS.filter(i => itemKind(i) === 'DISC' && !(_closedIdsForP.size && _closedIdsForP.has(i.sprint)) && i.status === 'discovery').length;
  // T-202606-101: desglose histórico — fuente real: ITEMS en memoria
  const _emitidos = ITEMS.length;
  const _descartadosTotal = ITEMS.filter(i => i.status === 'descartado').length;
  const _promovidasTotal = ITEMS.filter(i => i.status === 'promoted').length;
  const _cerradosSinTrabajo = _descartadosTotal + _promovidasTotal;
  const _doneTotal = ITEMS.filter(i => i.status === 'done').length;
  const _closedIdsForActivos = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  const _activosTotal = ITEMS.filter(i =>
    (i.status === 'pendiente' || i.status === 'en-revision') &&
    !(_closedIdsForActivos.size && _closedIdsForActivos.has(i.sprint)) &&
    !(itemKind(i) === 'DISC' && i.status === 'promoted')
  ).length;

  // UX-redesign: stats bar en una sola fila compacta — pendientes primero (foco en trabajo activo)
  const _hasPending = (backlogCount + enRevisionCount) > 0;

  // T-202606-048 AC 6 · TKT1-sprint-display-2: label metadata de sprint activo vía _sprintDisplay()
  const _sprintLabel = _sprintDisplay(_activeSprint.id) || '';
  const _metaLabel = `${_sprintDone}/${_sprintTotal} · effort ${_sprintEffortTotal}`;

  document.getElementById('stats-bar').innerHTML = `
    <div class="stats-bar-header">
      <span class="stats-bar-title">Stats <span class="stats-bar-sprint-label">${_sprintLabel}</span></span>
      ${!_statsCollapsed ? `<span class="stats-bar-meta-inline">${_metaLabel}</span>` : ''}
      <button class="stats-bar-chevron" data-action="stats-toggle-collapse" title="${_statsCollapsed ? 'Expandir' : 'Colapsar'}">${_statsCollapsed ? '▸' : '▾'}</button>
    </div>
    ${!_statsCollapsed ? `<div class="stats-bar-body">
    <div class="stats-row stats-row--compact">
      <!-- Bloque de conteos: pendientes primero -->
      <div class="stat-compact-counts">
        <div class="stat-compact-item stat-compact-item--primary">
          <span class="stat-compact-n${_hasPending ? ' stat-compact-n--primary' : ' stat-compact-n--muted'}">${backlogCount + enRevisionCount}</span>
          <span class="stat-compact-l">pendientes</span>
        </div>
        ${enRevisionCount > 0 ? `<div class="stat-compact-item stat-compact-item--revision">
          <span class="stat-compact-n stat-compact-n--revision">${enRevisionCount}</span>
          <span class="stat-compact-l">en revisión</span>
        </div>` : ''}
        <div class="stat-compact-item stat-compact-item--done">
          <span class="stat-compact-n${_hasPending ? ' stat-compact-n--muted stat-compact-n--sm' : ''}">${done}</span>
          <span class="stat-compact-l">hechos</span>
        </div>
      </div>
      <!-- Separador -->
      <div class="stat-compact-sep"></div>
      <!-- Chips de tipo filtrables -->
      <div class="stat-compact-types">
        ${activeTypes.size < 7 ? `<span class="stat-type-chip stat-type-chip--all" data-action="stats-clear-types" title="Mostrar todos los tipos">✕</span>` : ''}
        ${[['INC','INC','Incidentes'],['TKT','TKT','Tickets técnicos'],['REQ','REQ','Requerimientos / epics'],['PRB','PRB','Problems — causa raíz'],['KE','KE','Known Errors'],['CHG','CHG','Changes estructurales']].map(([t,label,hint]) =>
          byType[t] > 0 ? `<span class="stat-type-chip tc-${t}${activeTypes.has(t) ? ' active' : ''}" data-action="stats-type-filter" data-type="${t}" title="${hint} — click para filtrar">
            <span class="tc-count">${byType[t]}</span><span class="tc-label">${label}</span>
          </span>` : ''
        ).join('')}
        ${pIdeasCount > 0 ? `<span class="stat-type-chip tc-DISC stat-type-chip--ideas${activeTypes.has('DISC') ? ' active' : ''}" data-action="stats-type-filter" data-type="DISC" title="Posibilidades — no afectan contadores de trabajo activo">
          <span class="tc-count">${pIdeasCount}</span><span class="tc-label">💡</span>
        </span>` : ''}
      </div>
      <!-- Separador -->
      <div class="stat-compact-sep"></div>
      <!-- Prioridad -->
      <div class="stat-compact-priority">
        <span class="stat-pri-chip pri-high${activePriorityFilter.has('high') ? ' active' : ''}" data-action="stats-priority-filter" data-priority="high" title="Filtrar prioridad alta"><span class="spc-n">${c.high}</span> Alto</span>
        <span class="stat-pri-chip pri-medium${activePriorityFilter.has('medium') ? ' active' : ''}" data-action="stats-priority-filter" data-priority="medium" title="Filtrar prioridad media"><span class="spc-n">${c.medium}</span> Med</span>
        <span class="stat-pri-chip pri-low${activePriorityFilter.has('low') ? ' active' : ''}" data-action="stats-priority-filter" data-priority="low" title="Filtrar prioridad baja"><span class="spc-n">${c.low}</span> Bajo</span>
      </div>
      <!-- Separador -->
      <div class="stat-compact-sep"></div>
      <!-- Esfuerzo -->
      <div class="stat-compact-effort">
        ${noEffortCount > 0 ? `<span class="stat-effort-missing" title="Ítems sin effort" data-action="stats-effort-missing">${noEffortCount} sin effort</span>` : ''}
        <span class="stat-effort-card${activeEfforts.has(1) ? ' active' : ''}" id="feff-1" data-action="stats-effort-filter" data-effort="1" title="Filtrar effort 1"><span class="sec-count">${byEffort[1]}</span><span class="eff-label">● simple</span></span>
        <span class="stat-effort-card${activeEfforts.has(2) ? ' active' : ''}" id="feff-2" data-action="stats-effort-filter" data-effort="2" title="Filtrar effort 2"><span class="sec-count">${byEffort[2]}</span><span class="eff-label">●● medio</span></span>
        <span class="stat-effort-card${activeEfforts.has(3) ? ' active' : ''}" id="feff-3" data-action="stats-effort-filter" data-effort="3" title="Filtrar effort 3"><span class="sec-count">${byEffort[3]}</span><span class="eff-label">●●● complejo</span></span>
      </div>
    </div>
    </div>` : ''}
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
  activeTypes = new Set(['TKT','REQ','INC','DISC','PRB','KE','CHG']);
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
  _syncFilterBtn(); // T-202606-059: sincronizar badge + icono del botón Filtros
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

export function onBacklogSortChange(val) {
  // T-202604-424: ignorar 'sprint' si llega de localStorage legacy o select antiguo
  if (val === 'sprint') val = 'priority';
  backlogSortMode = val;
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-072: toggle dirección de sort
export function toggleSortDir() {
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
    if (itemKind(i) === 'TKT' && i.status === 'pendiente' && i.sprint === activeSprint.id && i.role && i.role.trim())
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
  // T-202606-066 AC-2: filter-pulse en fbar-no-ac-btn (toolbar) y fp-noac (panel)
  requestAnimationFrame(() => {
    ['fbar-no-ac-btn', 'fp-noac'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.remove('filter-pulse'); void el.offsetWidth; el.classList.add('filter-pulse'); el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true }); }
    });
  });
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
export function _getDepsFilter()             { return _depsFilter; }
export function getDoneItems(matchesQuery)   { // T-202606-028: computed global — evita ITEMS.filter() duplicado en renderBacklogList
  const fn = typeof matchesQuery === 'function' ? matchesQuery : () => true;
  // T-202606-060: typeOk aplicado — el chip de tipo de stats bar debe combinarse en AND con status done
  return ITEMS.filter(i => {
    const type = itemKind(i);
  });
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

// T-202606-058 mejora: extraer lógica de reset de _depsFilter — evita duplicación en chips de Bloqueados/Libres
function _resetDepsFilter() {
  _depsFilter = 0;
  const _db = document.getElementById('fbar-deps-btn');
  if (_db) { _db.textContent = '🔗 Deps'; _db.classList.remove('active'); }
  const _fp = document.getElementById('fp-deps');
  if (_fp) _fp.classList.remove('active');
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
}

// T-202606-058: fila de chips activos — colección de filtros fuera del estado default
// Retorna array de { label, removeFn } para cada filtro activo.
// Estado default: activeStatuses={'pendiente','en-revision'} · activeTypes={TKT,REQ,INC,DISC} ·
//   activeEfforts={1,2,3} · activePriorityFilter=vacío · activeRoleFilter=null ·
//   _backlogNoAcMode=false · _depsFilter=0 · backlogSearchQuery=''
function _getActiveFilterChips() {
  const chips = [];

  // Status fuera del default
  if (activeStatuses.has('done'))
    chips.push({ label: 'Done',            key: 'status:done',         removeFn: () => toggleStatusFilter('done') });
  if (activeStatuses.has('descartado'))
    chips.push({ label: 'Descartado',      key: 'status:descartado',   removeFn: () => toggleStatusFilter('descartado') });
  if (!activeStatuses.has('pendiente'))
    chips.push({ label: 'Sin Pendiente',   key: 'status:!pendiente',   removeFn: () => toggleStatusFilter('pendiente') });
  if (!activeStatuses.has('en-revision'))
    chips.push({ label: 'Sin En revisión', key: 'status:!en-revision', removeFn: () => toggleStatusFilter('en-revision') });

  // Sin AC
  if (_backlogNoAcMode)
    chips.push({ label: 'Sin AC', key: 'noac', removeFn: () => toggleBacklogNoAcMode() });

  // Deps
  if (_depsFilter === 1)
    chips.push({ label: '🔒 Bloqueados', key: 'deps:1', removeFn: _resetDepsFilter });
  if (_depsFilter === 2)
    chips.push({ label: '🔓 Libres',     key: 'deps:2', removeFn: _resetDepsFilter });

  // Prioridad — un chip por prioridad activa
  activePriorityFilter.forEach(function (p) {
    const _pLabel = p === 'high' ? 'Alto' : p === 'medium' ? 'Medio' : 'Bajo';
    chips.push({ label: 'Prioridad: ' + _pLabel, key: 'priority:' + p, removeFn: () => {
      window.dispatchEvent(new CustomEvent('shell:togglePriorityFilter', { detail: { val: p } }));
    }});
  });

  // Rol
  if (activeRoleFilter !== null) {
    const _rLabel = activeRoleFilter === '__none__' ? 'Sin rol' : activeRoleFilter;
    chips.push({ label: 'Rol: ' + _rLabel, key: 'role:' + activeRoleFilter, removeFn: (function (_r) {
      return () => toggleRoleFilter(_r);
    }(activeRoleFilter)) });
  }

  // Tipos excluidos (cuando activeTypes no tiene los 4)
  ['TKT', 'REQ', 'INC', 'DISC'].forEach(function (t) {
    if (!activeTypes.has(t)) {
      const _tLabel = t === 'TKT' ? 'Sin Tickets' : t === 'REQ' ? 'Sin Reqs' : t === 'INC' ? 'Sin Incidentes' : 'Sin Ideas';
      chips.push({ label: _tLabel, key: 'type:!' + t, removeFn: (function (_t) {
        return () => toggleTypeFilter(_t);
      }(t)) });
    }
  });

  // Effort excluido
  [1, 2, 3].forEach(function (e) {
    if (!activeEfforts.has(e)) {
      chips.push({ label: 'Effort ' + e + ' oculto', key: 'effort:!' + e, removeFn: (function (_e) {
        return () => toggleEffortFilter(_e);
      }(e)) });
    }
  });

  // Búsqueda activa
  if (backlogSearchQuery.length > 0)
    chips.push({ label: '🔍 "' + backlogSearchQuery + '"', key: 'search', removeFn: () => {
      backlogSearchQuery = '';
      const _si = document.getElementById('backlog-search-input');
      if (_si) _si.value = '';
      const _sc = document.getElementById('backlog-search-clear');
      if (_sc) _sc.classList.remove('visible');
      window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
      window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
    }});

  return chips;
}

// T-202606-058: render de la fila #active-filter-chips
// AC-1: con filtros activos → label 'Activos:' + chips con X + 'Limpiar todo'
// AC-2: clic en X desactiva ese filtro (clearFn) — el re-render ocurre vía shell:backlog-filter-changed
// AC-3: sin filtros activos → contenedor vacío (oculto vía CSS cuando está vacío)
export function renderActiveFilterChips() {
  const _container = document.getElementById('active-filter-chips');
  if (!_container) return;

  const chips = _getActiveFilterChips();

  // AC-3: sin filtros → vaciar y ocultar contenedor
  if (!chips.length) {
    _container.innerHTML = '';
    _container.classList.add('is-hidden');
    return;
  }
  _container.classList.remove('is-hidden');

  // AC-1: construir HTML de la fila — data-filter-key identifica el chip por tipo+valor, no por posición
  _container.innerHTML =
    '<span class="afc-label">Activos:</span>' +
    chips.map(function (chip) {
      return '<button class="afc-chip" type="button" data-filter-key="' + esc(chip.key) + '">' +
        esc(chip.label) +
        '<span class="afc-chip-x" aria-hidden="true">×</span>' +
      '</button>';
    }).join('') +
    '<button class="afc-clear-all" type="button">Limpiar todo</button>';

  // Delegación de eventos — se registra una sola vez por contenedor via flag
  if (!_container._afcListenerAttached) {
    _container._afcListenerAttached = true;
    _container.addEventListener('click', function (e) {
      // AC-2: clic en chip — buscar removeFn por key (resistente a reordenamiento entre renders)
      const _chip = e.target.closest('.afc-chip');
      if (_chip) {
        const _key = _chip.dataset.filterKey;
        const _current = _getActiveFilterChips();
        const _match = _current.find(function (c) { return c.key === _key; });
        if (_match) _match.removeFn();
        return;
      }
      // Limpiar todo
      if (e.target.closest('.afc-clear-all')) {
        clearAllFilters();
      }
    });
  }
  _syncFilterBtn(); // T-202606-059: sincronizar badge + icono tras cada render de chips
}

// T-202606-059: sincronizar badge + icono + aria-label del botón Filtros
// Filtros del panel: status fuera del default (done/descartado/sin-pendiente/sin-en-revision) · noac · deps · hijos
function _syncFilterBtn() {
  const _btn   = document.getElementById('fbar-filter-btn');
  const _badge = document.getElementById('bl-filter-badge');
  const _icon  = _btn && _btn.querySelector('.bl-filter-toggle-icon');
  if (!_btn || !_badge || !_icon) return;

  // Contar filtros del panel activos
  let _count = 0;
  if (activeStatuses.has('done'))        _count++;
  if (activeStatuses.has('descartado'))  _count++;
  if (!activeStatuses.has('pendiente'))  _count++;
  if (!activeStatuses.has('en-revision')) _count++;
  if (_backlogNoAcMode)                  _count++;
  if (_depsFilter > 0)                   _count++;
  if (localStorage.getItem('backlog-show-children') === '1') _count++;

  if (_count > 0) {
    _badge.textContent = String(_count);
    _badge.classList.remove('is-hidden');
    _icon.textContent = '✕';
    _btn.setAttribute('aria-label', 'Filtros activos — clic para limpiar');
    _btn.dataset.hasFilters = '1';
  } else {
    _badge.textContent = '';
    _badge.classList.add('is-hidden');
    _icon.textContent = '▾';
    _btn.setAttribute('aria-label', 'Filtros');
    delete _btn.dataset.hasFilters;
  }
}

// T-202606-055: toggle de panel inline de filtros
function toggleFilterPanel() {
  const panel = document.getElementById('bl-filter-panel');
  const btn   = document.getElementById('fbar-filter-btn');
  if (!panel || !btn) return;
  const isOpen = !panel.classList.contains('is-hidden');
  panel.classList.toggle('is-hidden', isOpen);
  panel.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
  btn.classList.toggle('active', !isOpen);
  btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
}

// Inline handlers dinámicos — no tienen ID fijo, no pueden migrar a addEventListener
// Se exponen en window para que onclick="fn()" en HTML generado en runtime funcione

// T-202605-053: Migrar handlers inline de index.html → addEventListener
// Funciones cubiertas: undoBacklog · redoBacklog · toggleBacklogKanbanMode
// toggleBacklogMikeMode · toggleCollapseAll
// toggleStatusFilter (×5)
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
  // T-202606-047: fbar-blocker-btn eliminado

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

  // T-202606-058: actualizar fila de chips activos en cada cambio de filtro
  window.addEventListener('shell:backlog-filter-changed', function () { renderActiveFilterChips(); });
  renderActiveFilterChips(); // render inicial

  // T-202606-218: listener shell:togglePriorityFilter — invocación cross-módulo sin export
  window.addEventListener('shell:togglePriorityFilter', function (e) {
    togglePriorityFilter(e.detail && e.detail.val);
  });

  // T-202606-099: toggle de filtros del backlog desde footer global
  const _btnGfToggle = document.getElementById('gf-footer-toggle');
  if (_btnGfToggle) _btnGfToggle.addEventListener('click', function () { toggleBacklogFooter(); });

  // T-202606-059: botón Filtros — cuando icono es ✕ (data-has-filters) → limpiar filtros del panel
  // Cuando icono es ▾ → toggle de panel (comportamiento original T-202606-055)
  const _btnFilterPanel = document.getElementById('fbar-filter-btn');
  if (_btnFilterPanel) _btnFilterPanel.addEventListener('click', function () {
    if (_btnFilterPanel.dataset.hasFilters === '1') {
      // Limpiar solo filtros del panel: status (done/descartado), noac, deps, hijos
      if (activeStatuses.has('done'))       toggleStatusFilter('done');
      if (activeStatuses.has('descartado')) toggleStatusFilter('descartado');
      if (!activeStatuses.has('pendiente'))  toggleStatusFilter('pendiente');
      if (!activeStatuses.has('en-revision')) toggleStatusFilter('en-revision');
      if (_backlogNoAcMode) toggleBacklogNoAcMode();
      if (_depsFilter > 0) _resetDepsFilter();
      // AC11: resetear activeTypes al conjunto completo
      activeTypes = new Set(['TKT','REQ','INC','DISC','PRB','KE','CHG']);
      updateTypeFilterUI();
      if (localStorage.getItem('backlog-show-children') === '1') {
        const _tbHijos = document.getElementById('fbar-show-children-btn');
        const _fpHijos = document.getElementById('fp-hijos');
        if (_tbHijos) { _tbHijos.classList.remove('active'); _tbHijos.textContent = 'Hijos'; }
        if (_fpHijos) _fpHijos.classList.remove('active');
        toggleShowChildren(false);
        window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
      }
      // Cerrar panel si estaba abierto
      const _panel = document.getElementById('bl-filter-panel');
      if (_panel && !_panel.classList.contains('is-hidden')) toggleFilterPanel();
    } else {
      toggleFilterPanel();
    }
  });

  // T-202606-056: píldoras del panel — grupo Estado
  const _fpDone = document.getElementById('fp-done');
  if (_fpDone) _fpDone.addEventListener('click', function () { toggleStatusFilter('done'); });

  const _fpDesc = document.getElementById('fp-descartado');
  if (_fpDesc) _fpDesc.addEventListener('click', function () { toggleStatusFilter('descartado'); });

  const _fpPend = document.getElementById('fp-pendiente');
  if (_fpPend) _fpPend.addEventListener('click', function () { toggleStatusFilter('pendiente'); });

  // T-202606-056: píldoras del panel — grupo Flags
  const _fpNoAc = document.getElementById('fp-noac');
  if (_fpNoAc) _fpNoAc.addEventListener('click', function () { toggleBacklogNoAcMode(); });

  const _fpDeps = document.getElementById('fp-deps');
  if (_fpDeps) _fpDeps.addEventListener('click', function () {
    // toggle binario: 0→1 (bloqueados) | 1→0 (sin filtro). Estado 2 (libres) no aplica desde panel.
    _depsFilter = _depsFilter > 0 ? 0 : 1;
    const depsBtnToolbar = document.getElementById('fbar-deps-btn');
    const labels = ['🔗 Deps', '🔒 Bloqueados', '🔓 Libres'];
    if (depsBtnToolbar) {
      depsBtnToolbar.textContent = labels[_depsFilter];
      depsBtnToolbar.classList.toggle('active', _depsFilter > 0);
    }
    _fpDeps.classList.toggle('active', _depsFilter > 0);
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
    // T-202606-066 AC-3: filter-pulse en fp-deps
    requestAnimationFrame(() => {
      _fpDeps.classList.remove('filter-pulse'); void _fpDeps.offsetWidth; _fpDeps.classList.add('filter-pulse'); _fpDeps.addEventListener('animationend', () => _fpDeps.classList.remove('filter-pulse'), { once: true });
    });
  });

  const _fpHijos = document.getElementById('fp-hijos');
  if (_fpHijos) {
    const _fpHijosStored = localStorage.getItem('backlog-show-children');
    _fpHijos.classList.toggle('active', _fpHijosStored === '1');
    _fpHijos.addEventListener('click', function () {
      const nowActive = !_fpHijos.classList.contains('active');
      _fpHijos.classList.toggle('active', nowActive);
      // sincronizar botón Hijos de toolbar
      const _tbHijos = document.getElementById('fbar-show-children-btn');
      if (_tbHijos) {
        _tbHijos.classList.toggle('active', nowActive);
        _tbHijos.textContent = nowActive ? 'Hijos ✓' : 'Hijos';
      }
      toggleShowChildren(nowActive);
      // T-202606-066 AC-4: filter-pulse en fp-hijos
      requestAnimationFrame(() => {
        _fpHijos.classList.remove('filter-pulse'); void _fpHijos.offsetWidth; _fpHijos.classList.add('filter-pulse'); _fpHijos.addEventListener('animationend', () => _fpHijos.classList.remove('filter-pulse'), { once: true });
      });
    });
  }
});
