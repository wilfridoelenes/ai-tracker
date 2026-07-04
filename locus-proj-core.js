// [PP] mod:9 · autor:Rune · 2026-07-03 UTC-6
// TKT-CONSOLID-PROJFILTER: _getActiveProjectFilter y getProjectById dejan de tener implementación
//   local — se importan de locus-storage.js (dueña de state.projects, __BR-Ecosystem §7) y se
//   re-exportan para no romper los 5 consumidores que las importan desde este módulo. Elimina
//   duplicación divergente registrada en LMC mod:23. _setActiveProjectFilter permanece aquí —
//   no es duplicado, tiene side effects propios (breadcrumb, filtro UI, header, clean-btn).
// TKT1 (REQ-getactiveprojectfilter): _getActiveProjectFilter registrada en _coreCallbacks de
//   locus-backlog-core.js — import directo crearía ciclo (este módulo ya importa loadBacklog/
//   renderStats desde ahí). Mismo patrón de inyección diferida que _getItems en locus-storage.js.
// TKT-C10 (REQ-C): renderIceboxPanel()→renderQBacklogPanel()+renderQDiscPanel() en
//   selectProjectFilter. Import actualizado — renderIceboxPanel retirado.
// T-202606-010: call site huérfano renderHoy eliminado (guard typeof inerte)
// T-202606-093 AC-4: _updateSubtabBadges() invocada junto a renderQBacklogPanel/renderQDiscPanel
// Módulo compartido — símbolos de proyecto sin deps circulares
// Creado en T-202606-197 (opción d): rompe ciclo locus-projects ↔ locus-sprint-project
// Importado por: locus-projects.js · locus-sprint-project.js
// NO importa desde locus-projects.js ni locus-sprint-project.js

import { getProjectSessions, save, getProjectById, _getActiveProjectFilter } from './locus-storage.js';
import { esc, switchSubTab, getCurrentSubTab } from './locus-ui-shell.js';
import { showToast } from './locus-toast.js';
import { renderAnalytics } from './locus-analytics-render.js';
import { loadBacklog, renderStats, _registerCoreCallback } from './locus-backlog-core.js';
import { renderBacklogList, renderQBacklogPanel, renderQDiscPanel, _updateSubtabBadges } from './locus-backlog-render.js'; // TKT-C10: renderIceboxPanel→renderQBacklogPanel+renderQDiscPanel
import { loadHtmlMap } from './locus-map-viewer.js';
import { _renderTplProjBanner } from './locus-docs.js';
import { _updateHeaderProjectLabel } from './locus-sesiones-stats.js';
import { _syncCleanProjectBtn } from './locus-reports.js';

// ── Filtro de proyecto activo ────────────────────────────────────────────────

// T-202606-006 T3: clearProjectFilter vive en locus-sprint-project — ciclo si se importa directo.
// locus-sprint-project llama _setClearProjFilter(clearProjectFilter) al cargarse.
let _clearProjFilterFn = null;
export function _setClearProjFilter(fn) { _clearProjFilterFn = fn; }

// TKT-CONSOLID-PROJFILTER: _getActiveProjectFilter consolidada en locus-storage.js (dueña
// de state.projects) — este módulo la re-exporta para no romper los 5 consumidores que
// importan desde aquí. Ver LMC mod:23/24.
export { _getActiveProjectFilter };

export function _setActiveProjectFilter(projId) {
  if (projId) localStorage.setItem('current-project-filter', projId);
  else localStorage.removeItem('current-project-filter');
  _updateProjBreadcrumb();
  _updateProjFilterBtn();
  _updateHeaderProjectLabel();
  _syncCleanProjectBtn();
}

// ── Lookup de proyecto ───────────────────────────────────────────────────────

// TKT-CONSOLID-PROJFILTER: getProjectById consolidada en locus-storage.js — re-exportada
// para no romper los consumidores que importan desde este módulo. Ver LMC mod:23/24.
export { getProjectById };

// ── Conteo de sesiones ───────────────────────────────────────────────────────

export function _countProjSessions(proj) {
  return getProjectSessions(proj.id).length;
}

// ── Breadcrumb y botón de filtro ─────────────────────────────────────────────

export function _updateProjBreadcrumb() {
  // absorbido por _updateProjFilterBtn — no-op
}

export function _updateProjFilterBtn() {
  const btn = document.getElementById('proj-filter-btn');
  if (!btn) return;
  const filterId = _getActiveProjectFilter();
  if (filterId) {
    const proj = getProjectById(filterId);
    const avatar = proj
      ? (proj.icon
          ? `<span class="proj-filter-icon">${esc(proj.icon)}</span>`
          : `<span class="proj-filter-initial" style="--proj-color:${proj.color || '#7c6af7'}">${esc((proj.name || 'P')[0].toUpperCase())}</span>`)
      : '';
    const name = proj ? esc(proj.name) : 'Proyecto';
    btn.innerHTML = `${avatar}${name} <span title="Limpiar filtro" class="proj-filter-clear">✕</span>`;
    btn.classList.add('active');
    const clearSpan = btn.querySelector('.proj-filter-clear');
    if (clearSpan) {
      clearSpan.addEventListener('click', function (e) {
        e.stopPropagation();
        if (_clearProjFilterFn) _clearProjFilterFn();
      });
    }
  } else {
    btn.innerHTML = '📁 Proyectos';
    btn.classList.remove('active');
  }
}

// ── Panel de proyectos ───────────────────────────────────────────────────────

export function closeProjPanel() {
  document.getElementById('proj-panel-overlay')?.classList.remove('open');
  const btn = document.getElementById('proj-filter-btn');
  if (btn) btn.classList.remove('active');
}

// ── Selección de proyecto con efectos secundarios ────────────────────────────

export function selectProjectFilter(projId) {
  _setActiveProjectFilter(projId);
  closeProjPanel();
  loadBacklog();
  loadHtmlMap();
  window.dispatchEvent(new CustomEvent('shell:sesiones-render'));
  if (typeof currentTab !== 'undefined' && currentTab === 'analytics') renderAnalytics();
  renderBacklogList();
  renderQBacklogPanel(); // TKT-C10: reemplaza renderIceboxPanel — re-render Q-Backlog al cambiar proyecto activo
  renderQDiscPanel();    // TKT-C10: re-render Q-DISC al cambiar proyecto activo
  _updateSubtabBadges(); // T-202606-093 AC-4: mismo motivo — selectProjectFilter no dispara shell:backlog-render-dirty
  renderStats();
  _renderTplProjBanner();
  switchSubTab(getCurrentSubTab());
  if (projId) {
    const proj = getProjectById(projId);
    showToast('info', proj ? `Filtro: ${proj.name}` : 'Filtro activo');
  } else {
    showToast('info', 'Filtro limpiado');
  }
}

// ── Contexto de proyecto ─────────────────────────────────────────────────────

export function getProjContext(projId) {
  const proj = getProjectById(projId);
  return proj ? (proj.context || '') : '';
}

export function setProjContext(projId, text, version) {
  const proj = getProjectById(projId);
  if (!proj) return;
  proj.context = text || '';
  if (version !== undefined) proj.contextVersion = version || '';
  save();
}

// ── Registro de callback en _coreCallbacks — TKT-[pendiente-ID] ─────────────
// _getActiveProjectFilter vive en este módulo desde T-202606-197. Registrada aquí
// para que locus-backlog-core.js la consuma via _coreCallbacks sin import directo
// (evita ciclo: este módulo importa loadBacklog/renderStats desde locus-backlog-core.js).
document.addEventListener('DOMContentLoaded', () => {
  _registerCoreCallback('getActiveProjectFilter', _getActiveProjectFilter);
}, { once: true });

