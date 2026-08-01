// [PP] mod:19 · autor:Rune · 2026-08-01 UTC-6
// inline_fix (triggered_by: TKT2, ref_id CAEL-0801-02): comentario en _registerSesSPCallback
// (línea ~514) quedado desalineado desde mod:17 — declaraba openProjModal() "viva con 4 call
// sites" pese a que mod:18 (este mismo archivo) ya la había retirado. Detectado en sesión de
// reverificación contra archivos reales, mismo patrón de deuda ya visto en mod:11→mod:12.
// [PP] mod:18 · autor:Rune · 2026-08-01 UTC-6
// TKT2 (REQ-202607-083, ref_id CAEL-0801-02): openProjModal()/closeProjModal()/
// editProjInline()/confirmProjForm()/cancelProjForm() retiradas — sin call sites reales,
// verificado por grep contra locus-projects.js/locus-sprint-project.js/index.html antes de
// eliminar (AC de contrato de TKT2). Reemplazadas por el panel embebido K-02 en
// locus-projects.js (_openProyPanel/_closeProyPanel/_confirmProyPanel). Wiring de
// #proj-modal-overlay/#proj-modal-close-btn/#proj-form-cancel-btn/#proj-form-confirm-btn/
// #proj-name-input en _sprintProjectUIInit retirado en el mismo movimiento (referenciaba las
// funciones eliminadas). inline_fix: 'edit' en _projListClickDelegate (dentro de
// _renderProjList, huérfana) llamaba a editProjInline() — referencia rota removida sin
// reemplazo, ver Hallazgo fuera de scope en CHECKPOINT.
// [PP] mod:17 · autor:Rune · 2026-07-31 UTC-6
// TKT-202607-213 (REQ-202607-083): openProjPanel()/renderProjPanel() eliminadas — sin call
//   sites reales. Wiring de #proj-panel-overlay y listener 'shell:open-proj-panel' retirados
//   en el mismo movimiento. openProjModal() y #proj-modal-overlay NO tocados — fuera de scope,
//   call site real activo en locus-projects.js.
// TKT1 REQ-cleanup-toolbar-legacy: eliminado bloque no-op ftypes/fstatus — #filter-bar-types
//   no existe en HTML, #filter-bar-status nunca tuvo is-hidden. Guard `if (typeof getItems()...)`
//   y las tres llamadas (renderStats/updateBacklogBanner/updateStatusFilterUI) se preservan.
// INC-[pendiente-ID]: import roto a ensureHotfixSprint (eliminada de locus-sprint.js en TKT-B1)
//   causaba SyntaxError de módulo ESM al cargar — bloqueaba la app completa. Import eliminado,
//   call site removido sin reemplazo (S-HOTFIX deprecado, Q-INC es zona persistente sin sprint
//   inicial requerido al crear proyecto).
// Header migrado a formato canónico __BR-Execution §9 — versión/sprint legacy (v0.5.0·PP-S-05)
//   removidos: el archivo pertenece al proyecto, no a un sprint.
// locus-sprint-project.js
// T-202606-010: call site huérfano renderHoy eliminado (guard typeof inerte)
// Última actualización: 2026-06-06 · T-202606-058: Romper ciclo locus-sesiones ↔ locus-sprint-project
// Módulo: Gestión de proyectos + helpers de prefijo/sprint
// Renombrado de ai-tracker-sprint-project.js
// T-202606-016: funciones de export de backlog migradas a locus-backlog-generator.js
import { loadHtmlMap } from './locus-map-viewer.js';
import { _syncCleanProjectBtn } from './locus-reports.js';
import { _blogLog, _effectiveVersion, _offlineQueuePush, _PREFIX_MAP, _tplKey, getActiveProject, getActiveSprints, getActiveTracker, getProjectSessions, getState, getSupabaseReadyPromise, getSupabaseUserId, save } from './locus-storage.js';
import { esc, switchSubTab, switchTab, getCurrentSubTab, getCurrentTab } from './locus-ui-shell.js';
// Símbolos movidos a locus-proj-core.js en T-202606-197 (opción d — ESM puro)
import { _getActiveProjectFilter, _setActiveProjectFilter, _updateProjBreadcrumb, _updateProjFilterBtn, _countProjSessions, closeProjPanel, selectProjectFilter, getProjectById, getProjContext, setProjContext, _setClearProjFilter } from './locus-proj-core.js';


import { renderAnalytics } from './locus-analytics-render.js';
import { setAnalyticsRange } from './locus-analytics-core.js'; // T-202606-089 AC-3

import { loadBacklog, renderStats, updateBacklogBanner, updateStatusFilterUI, getItems} from './locus-backlog-core.js';
import { closeQuickCapture } from './locus-sesiones-capture.js';

import { renderBacklogList } from './locus-backlog-render.js';

import { _gconfirmOpen, closeModal } from './locus-modals.js';

// renderProyectos — accedida via window.* para evitar ciclo con locus-projects.js (T-202606-197)

import { _updateHeaderProjectLabel } from './locus-sesiones-stats.js';
// T-202606-058: import { render } from './locus-sesiones.js' eliminado — ciclo A↔B roto.
// render() reemplazado por window.dispatchEvent(new CustomEvent('shell:sesiones-render'))
// per B-202606-021. locus-sprint-project registra sus funciones en locus-sesiones
// via _registerSesSPCallback en DOMContentLoaded.

import { closePopup } from './locus-session-popup.js';

import { showToast } from './locus-toast.js';

// T-202606-058: import desde locus-sesiones-registry.js (módulo sin dependencias) — no desde locus-sesiones.js
import { _registerSesSPCallback } from './locus-sesiones-registry.js';

// ── Utilidades de módulo — T3.bis ─────────────────────────────────────────────
export function pad(n) { return String(n).padStart(2, '0'); }
export function _sprintNum(id) {
  if (!id) return null;
  const m = String(id).match(/S-(\\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

// T-202606-166: export eliminado — función movida a locus-storage.js. Conservada internamente para call sites locales.
function _docPrefix() {
  const proj = getActiveProject();
  if (!proj) return 'XX';
  if (proj.prefix) return proj.prefix;
  const name = proj.name || '';
  return _PREFIX_MAP[name] || (name.slice(0, 2).toUpperCase() || 'XX');
}

// R-1: _updateHeaderProjectLabel — definición canónica en checkpoint.js
// Este módulo la llama via guard — no la redefine.

// ── Keyboard shortcuts ──
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const s = document.getElementById('search-global');
    if (s) { s.focus(); s.select(); }
  }
  if (e.key === 'Escape') {
    closePopup();
    closeProjPanel();
    closeModal('add-modal');
    closeModal('tag-modal');
    const _qcOverlay = document.getElementById('qc-modal-overlay'); if (_qcOverlay) _qcOverlay.classList.remove('open');
    closeQuickCapture();
  }
});

// Init — diferido post-DOMContentLoaded con gate de auth
// TKT-202607-201 (REQ-202607-076): el gate síncrono `if (!getSupabaseUserId()) return;`
// asumía que la sesión de Supabase ya estaba resuelta al momento de DOMContentLoaded. Cuando
// la sesión resuelve después vía onAuthStateChange (asíncrono — sin sesión cacheada), este
// init corría antes de tiempo, el guard evaluaba falso, y _ensureProjectFilter() nunca se
// ejecutaba — el filtro de proyecto activo quedaba sin aplicar en Tab Proyectos hasta un
// refresh manual. _initApp() no tenía este bug porque su flujo interno ya espera la
// resolución de auth antes de decidir la rama de storage. Fix: await sobre
// getSupabaseReadyPromise() (accessor nuevo en locus-storage.js, mismo patrón que
// getSupabaseContext()/isSupabaseAuthed()) antes de leer getSupabaseUserId(). La promesa
// siempre resuelve — nunca rechaza, incluso sin sesión (Promise.resolve(null)) — por lo que
// el caso de usuario deslogueado no requiere try/catch: getSupabaseUserId() simplemente
// evalúa falso después del await y la función retorna sin lanzar excepción ni quedar en loop.
document.addEventListener('DOMContentLoaded', async function _sprintProjectInit() {
  await getSupabaseReadyPromise();
  if (!getSupabaseUserId()) return;

  const state = getState();
  (function _ensureProjectFilter() {
    if (_getActiveProjectFilter()) return;
    const active = (state.projects || []).find(p => p.status === 'active' || (!p.status && !p.archived));
    if (active) _setActiveProjectFilter(active.id);
  })();

  if (state.projects && state.projects.some(p => p.status === 'paused')) {
    state.projects.forEach(p => { if (p.status === 'paused') p.status = 'archived'; });
    save();
  }
});
// ── T-077: Panel selector proyectos ──

const PROJ_COLORS = ['#7c6af7','#38bdf8','#2ecc78','#e8a832','#e85555','#f472b6','#a3e635','#fb923c','#8BC34A','#64748b'];

function _projListDragStartHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  if (row) projDragStart(e, row.dataset.dragProjId, row);
}
function _projListDragEndHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  projDragEnd(e, row);
}
function _projListDragOverHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  if (row) projDragOver(e, row.dataset.dragProjId, row);
}
function _projListDragLeaveHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  projDragLeave(e, row);
}
function _projListDropHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  if (row) projDrop(e, row.dataset.dragProjId, row);
}

// _getActiveProjectFilter — movida a locus-proj-core.js en T-202606-197

// _setActiveProjectFilter — movida a locus-proj-core.js en T-202606-197

// _updateProjBreadcrumb — movida a locus-proj-core.js en T-202606-197

// _updateProjFilterBtn — movida a locus-proj-core.js en T-202606-197

export function clearProjectFilter() {
  _setActiveProjectFilter('');
  loadBacklog(); loadHtmlMap();
  window.dispatchEvent(new CustomEvent('shell:sesiones-render'));
  if (getCurrentTab() === 'analytics') renderAnalytics();
  renderBacklogList(); renderStats();
  switchSubTab(getCurrentSubTab());
}
_setClearProjFilter(clearProjectFilter);

// openProjPanel() y renderProjPanel() eliminadas — TKT-202607-213 (REQ-202607-083).
// Sin call sites reales verificados contra locus-projects.js y locus-proj-core.js —
// el listener 'shell:open-proj-panel' (wiring retirado más abajo en este mismo TKT)
// no tenía ningún dispatcher real en el repo. renderProjPanel() era helper privado
// exclusivo de openProjPanel — huérfano por la misma razón, retirado en el mismo movimiento.

// closeProjPanel — movida a locus-proj-core.js en T-202606-197

// _countProjSessions — movida a locus-proj-core.js en T-202606-197

// selectProjectFilter — movida a locus-proj-core.js en T-202606-197

// ── T-080: Modal gestión proyectos CRUD ──

let _projEditId = null;
let _projSelectedColor = 0;

// openProjModal()/closeProjModal()/cancelProjForm() eliminadas — TKT2 (REQ-202607-083,
// ref_id CAEL-0801-02). Reemplazadas por el panel embebido K-02 en locus-projects.js
// (_openProyPanel/_closeProyPanel/_confirmProyPanel). Sin call sites verificados por grep
// contra todo el repo adjunto en sesión antes de retirar — AC de contrato de TKT2.

function _renderProjColorRow() {
  const row = document.getElementById('proj-color-row');
  if (!row) return;
  row.innerHTML = PROJ_COLORS.map((c, i) =>
    `<div class="proj-color-dot${i === _projSelectedColor ? ' sel' : ''}" style="--proj-color:${c}" data-color-idx="${i}" title="${c}"></div>`
  ).join('');
  row.addEventListener('click', function _colorRowDelegate(e) {
    const dot = e.target.closest('[data-color-idx]');
    if (dot) selectProjColor(parseInt(dot.dataset.colorIdx, 10));
  }, { once: true });
}

function selectProjColor(i) {
  _projSelectedColor = i;
  _renderProjColorRow();
}

// confirmProjForm() eliminada — TKT2 (ref_id CAEL-0801-02). Reemplazada por
// _confirmProyPanel() en locus-projects.js.

function _toggleProjArchivedSection() {
  var k = 'proj-modal-archived-open';
  var now = localStorage.getItem(k) !== '0';
  localStorage.setItem(k, now ? '0' : '1');
  _renderProjList();
}

function _renderProjList() {
  const state = getState();
  const list = document.getElementById('proj-list');
  if (!list) return;
  const projects = state.projects || [];
  if (!projects.length) {
    list.innerHTML = `<div class="proj-empty-hint">Aún no hay proyectos — crea uno arriba</div>`;
    return;
  }

  const activeProjs = projects.filter(p => p.status !== 'archived');
  const archivedProjs = projects.filter(p => p.status === 'archived');

  function _projRow(proj) {
    const sessCount = _countProjSessions(proj);
    const isArchived = proj.status === 'archived';
    return `<div class="proj-list-row${isArchived ? ' paused' : ''}" draggable="${isArchived ? 'false' : 'true'}"
      id="prow-${proj.id}"
      data-drag-proj-id="${proj.id}">
      <span class="proj-list-drag">${isArchived ? '' : '⠿'}</span>
      ${proj.icon
        ? `<span class="proj-list-icon">${esc(proj.icon)}</span>`
        : proj.prefix
          ? `<span class="proj-list-prefix" style="--proj-color:${proj.color || '#7c6af7'}">${esc(proj.prefix)}</span>`
          : `<span class="proj-list-dot" style="--proj-color:${proj.color || '#7c6af7'}"></span>`}
      <span class="proj-list-name">${esc(proj.name)}${proj.notes ? `<br><span class="proj-list-notes">${esc(proj.notes)}</span>` : ''}</span>
      <span class="proj-list-meta">${sessCount} ses.</span>
      <div class="proj-list-actions">
        <button class="proj-list-btn" data-proj-action="edit" data-proj-id="${proj.id}" title="Editar">✎</button>
        <button class="proj-list-btn" data-proj-action="archive" data-proj-id="${proj.id}" title="${isArchived ? 'Restaurar' : 'Archivar'}">${isArchived ? '↩' : '📦'}</button>
        <button class="proj-list-btn danger" data-proj-action="delete" data-proj-id="${proj.id}" title="Eliminar">✕</button>
      </div>
    </div>`;
  }

  const archivedKey = 'proj-modal-archived-open';
  const archivedOpen = localStorage.getItem(archivedKey) !== '0';

  let html = activeProjs.map(_projRow).join('');
  if (archivedProjs.length) {
    html += `<div class="proj-archived-section">
      <button class="proj-archived-toggle" data-proj-action="toggle-archived">
        <span class="proj-archived-arrow">${archivedOpen ? '▾' : '▸'}</span>
        <span>Archivados (${archivedProjs.length})</span>
      </button>
      ${archivedOpen ? archivedProjs.map(_projRow).join('') : ''}
    </div>`;
  }
  list.innerHTML = html || `<div class="proj-empty-hint">Aún no hay proyectos — crea uno arriba</div>`;

  function _projListClickDelegate(e) {
    const btn = e.target.closest('[data-proj-action]');
    if (!btn) return;
    const action = btn.dataset.projAction;
    const projId = btn.dataset.projId;
    // 'edit' retirado — llamaba a editProjInline(), eliminada en TKT2 (ref_id CAEL-0801-02).
    // Sin reemplazo aquí: este delegador pertenece a _renderProjList(), huérfana desde que
    // openProjModal() (único caller) fue retirada en el mismo TKT — ver Hallazgo fuera de scope.
    if (action === 'archive') { toggleProjArchive(projId); return; }
    if (action === 'delete') { deleteProjConfirm(projId); return; }
    if (action === 'toggle-archived') { _toggleProjArchivedSection(); return; }
  }
  list.removeEventListener('click', _projListClickDelegate);
  list.addEventListener('click', _projListClickDelegate);

  list.removeEventListener('dragstart', _projListDragStartHandler);
  list.removeEventListener('dragend',   _projListDragEndHandler);
  list.removeEventListener('dragover',  _projListDragOverHandler);
  list.removeEventListener('dragleave', _projListDragLeaveHandler);
  list.removeEventListener('drop',      _projListDropHandler);
  list.addEventListener('dragstart', _projListDragStartHandler);
  list.addEventListener('dragend',   _projListDragEndHandler);
  list.addEventListener('dragover',  _projListDragOverHandler);
  list.addEventListener('dragleave', _projListDragLeaveHandler);
  list.addEventListener('drop',      _projListDropHandler);
}

// editProjInline() eliminada — TKT2 (ref_id CAEL-0801-02). Reemplazada por
// _openProyPanel('edit', projId, triggerEl) en locus-projects.js.

function toggleProjArchive(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const wasArchived = proj.status === 'archived';
  proj.status = wasArchived ? 'active' : 'archived';
  if (!wasArchived && _getActiveProjectFilter() === projId) {
    _setActiveProjectFilter('');
  }
  save();
  _renderProjList();
  window.dispatchEvent(new CustomEvent('shell:render-proyectos'));
  showToast('info', !wasArchived ? `"${proj.name}" archivado` : `"${proj.name}" restaurado`);
}

function deleteProjConfirm(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const sessCount = _countProjSessions(proj);
  const msg = sessCount > 0
    ? `Las ${sessCount} sesiones de las IAs vinculadas mantendrán sus datos.`
    : `Esta acción no se puede deshacer.`;
  _gconfirmOpen({ title: `¿Eliminar "${proj.name}"?`, msg, okLabel: 'Eliminar', danger: true }, () => {
    const state = getState();
    state.projects = (state.projects || []).filter(p => p.id !== projId);
    if (_getActiveProjectFilter() === projId) _setActiveProjectFilter('');
    save();
    _renderProjList();
    _updateProjBreadcrumb();
    showToast('success', `Proyecto eliminado`);
  });
}

let _projDragId = null;
function projDragStart(e, projId, rowEl) {
  _projDragId = projId;
  if (rowEl) rowEl.classList.add('dragging');
}
function projDragEnd(e, rowEl) {
  if (rowEl) rowEl.classList.remove('dragging');
  document.querySelectorAll('.proj-list-row').forEach(r => r.classList.remove('drag-over'));
  _projDragId = null;
}
function projDragOver(e, projId, rowEl) {
  e.preventDefault();
  if (_projDragId === projId) return;
  document.querySelectorAll('.proj-list-row').forEach(r => r.classList.remove('drag-over'));
  if (rowEl) rowEl.classList.add('drag-over');
}
function projDragLeave(e, rowEl) {
  if (rowEl) rowEl.classList.remove('drag-over');
}
function projDrop(e, toId, rowEl) {
  e.preventDefault();
  if (rowEl) rowEl.classList.remove('drag-over');
  if (!_projDragId || _projDragId === toId) return;
  const state = getState();
  const projs = state.projects || [];
  const fromIdx = projs.findIndex(p => p.id === _projDragId);
  const toIdx   = projs.findIndex(p => p.id === toId);
  if (fromIdx < 0 || toIdx < 0) return;
  const [moved] = projs.splice(fromIdx, 1);
  projs.splice(toIdx, 0, moved);
  save();
  _renderProjList();
}

// getProjectById — movida a locus-proj-core.js en T-202606-197
function getProjectsByAI(aiId) {
  const state = getState();
  return (state.projects || []).filter(p => (p.sessions || []).some(s => s.aiId === aiId));
}

// getProjContext / setProjContext — movidas a locus-proj-core.js en T-202606-197


function _filteredAIs() {
  const state = getState();
  const filterId = _getActiveProjectFilter();
  if (!filterId) return state.ais;
  const proj = getProjectById(filterId);
  if (!proj) return state.ais;
  const aiIds = new Set((proj.sessions || []).map(s => s.aiId).filter(Boolean));
  return state.ais.filter(a => aiIds.has(a.id));
}

// Init backlog si hay ítems
if (typeof getItems() !== 'undefined' && getItems().length) {
  renderStats();
  updateBacklogBanner();
  updateStatusFilterUI();
}

document.addEventListener('DOMContentLoaded', function _sprintProjectUIInit() {
  document.querySelectorAll('.tracker-only').forEach(el => el.classList.add('is-hidden'));
  document.querySelectorAll('.analytics-only').forEach(el => el.classList.add('is-hidden'));
  const _savedTab = localStorage.getItem('active-tab');
  switchTab(_savedTab || 'tracker');
  loadHtmlMap();
  _updateProjBreadcrumb();
  _updateProjFilterBtn();
  _updateHeaderProjectLabel();

  // Wiring de #proj-panel-overlay retirado — TKT-202607-213 (REQ-202607-083).
  // El markup (#proj-panel-overlay, #proj-panel-close-btn, #proj-panel-btn-nuevo,
  // #proj-panel-btn-gestionar) ya no existe en index.html — estos listeners no
  // tenían nada que enganchar.

  // Wiring de #proj-modal-overlay retirado — TKT2 (ref_id CAEL-0801-02). El markup
  // (#proj-modal-overlay, #proj-modal-close-btn, #proj-form-cancel-btn, #proj-form-confirm-btn,
  // #proj-name-input dentro del modal) fue removido de index.html en el mismo TKT — reemplazado
  // por el panel embebido K-02 en #tab-proyectos-inner (locus-projects.js).
});

// T-047: inicializar botón de rango activo al cargar
(function() {
  const saved = parseInt(localStorage.getItem('analytics-range') || '3', 10);
  setAnalyticsRange(saved);
  document.querySelectorAll('.range-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.range) === saved);
  });
})();

// ── Splash screen controller ──
const SplashController = {
  splash: null,
  progressFill: null,
  statusEl: null,
  startTime: Date.now(),
  minDuration: 1200,
  
  init() {
    this.splash = document.getElementById('pepe-splash');
    this.progressFill = document.getElementById('pepe-progress-fill');
    this.statusEl = document.getElementById('splash-status');
    const title = document.title.match(/v([\\d.]+)/);
    if (title) {
      const versionEl = document.getElementById('splash-version');
      if (versionEl) versionEl.textContent = 'v' + title[1];
    }
    return this;
  },
  
  updateProgress(percent, status) {
    if (this.progressFill) {
      this.progressFill.style.setProperty('--splash-progress', percent + '%');
      if (percent === 100) {
        this.progressFill.classList.remove('indeterminate');
      }
    }
    if (this.statusEl && status) {
      this.statusEl.textContent = status;
    }
  },
  
  hide() {
    const elapsed = Date.now() - this.startTime;
    const delay = Math.max(0, this.minDuration - elapsed);
    setTimeout(() => {
      if (this.splash) {
        this.splash.classList.add('fade-out');
        setTimeout(() => {
          if (this.splash && this.splash.parentNode) {
            this.splash.remove();
          }
        }, 600);
      }
    }, delay);
  }
};

export function _getLocalStorageUsage() {
  const LIMIT = 5 * 1024 * 1024;
  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += (key + localStorage.getItem(key)).length;
    }
  }
  return { usedKB: (used / 1024).toFixed(1), totalKB: (LIMIT / 1024).toFixed(0), pct: used / LIMIT };
}

(function() {
  const PEPE_URI = document.querySelector('link[rel="icon"]').href;
  SplashController.init();
  const logoImg = document.getElementById('pepe-logo');
  if (logoImg) logoImg.src = PEPE_URI;
  const splashImg = document.getElementById('pepe-splash-img');
  if (splashImg) splashImg.src = PEPE_URI;
  SplashController.updateProgress(20, '↓ Cargando sesiones...');
  setTimeout(() => { SplashController.updateProgress(50, '↓ Sincronizando...'); }, 300);
  setTimeout(() => { SplashController.updateProgress(85, '✓ Procesando datos...'); }, 600);
  setTimeout(() => {
    SplashController.updateProgress(100, '✓ Listo');
    setTimeout(() => { SplashController.hide(); }, 400);
  }, 900);
})();

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// Nota T-202606-197: getProjectById · _getActiveProjectFilter · _setActiveProjectFilter ·
// _updateProjBreadcrumb · _updateProjFilterBtn · _countProjSessions · closeProjPanel ·
// selectProjectFilter · getProjContext · setProjContext — expuestos via locus-proj-core.js
// T-202606-016: funciones de export removidas de window.* — viven en locus-backlog-generator.js
// B-202606-024: window.clearProjectFilter eliminado — consumida via _setClearProjFilter() callback

// T-202606-058: registrar funciones de locus-sprint-project en locus-sesiones
// para romper el ciclo A↔B. locus-sesiones las consume via _sesSPCallbacks.
document.addEventListener('DOMContentLoaded', () => {
  _registerSesSPCallback('getProjectById',          getProjectById);
  // _registerSesSPCallback('getActiveProjectFilter') eliminado — T-202606-197: _getActiveProjectFilter movida a locus-proj-core.js
  // _registerSesSPCallback('openProjModal') eliminado — inline_fix sesión 2026-07-31: sin consumidor
  //   en todo el repo desde TKT-202607-213 (locus-sesiones.js retiró su único call site vía
  //   _sesSPCallbacks.openProjModal). Nota actualizada — inline_fix (triggered_by: TKT2, ref_id
  //   CAEL-0801-02): comentario quedó desalineado tras mod:18 — openProjModal() en sí ya no existe
  //   en este archivo (retirada por TKT2). Sin call sites reales en todo el repo — verificado.
  _registerSesSPCallback('selectProjectFilter',     selectProjectFilter);
}, { once: true });
// ── END T-202606-058 ─────────────────────────────────────────────────────────

// ── T-202606-167: listener shell:open-proj-panel — eliminado TKT-202607-213 ──
// Apuntaba a openProjPanel(), retirada en este mismo TKT por no tener dispatcher
// real en el repo (verificado por grep contra todo el proyecto adjunto en sesión).
