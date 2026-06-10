// [PP] v1.0.0 · sprint:PP-S-01 · mod:1 · autor:Rune · 2026-06-11 07:00 UTC-6
// locus-proj-core.js
// Módulo compartido — símbolos de proyecto sin deps circulares
// Creado en T-202606-197 (opción d): rompe ciclo locus-projects ↔ locus-sprint-project
// Importado por: locus-projects.js · locus-sprint-project.js
// NO importa desde locus-projects.js ni locus-sprint-project.js

import { getProjectSessions, getState, save } from './locus-storage.js';
import { esc, switchSubTab, getCurrentSubTab } from './locus-ui-shell.js';
import { showToast } from './locus-toast.js';
import { renderAnalytics } from './locus-analytics-render.js';
import { loadBacklog, renderStats } from './locus-backlog-core.js';
import { renderBacklogList } from './locus-backlog-render.js';
import { loadHtmlMap } from './locus-map-viewer.js';
import { _renderTplProjBanner } from './locus-docs.js';

// ── Filtro de proyecto activo ────────────────────────────────────────────────

export function _getActiveProjectFilter() {
  return localStorage.getItem('current-project-filter') || '';
}

export function _setActiveProjectFilter(projId) {
  if (projId) localStorage.setItem('current-project-filter', projId);
  else localStorage.removeItem('current-project-filter');
  _updateProjBreadcrumb();
  _updateProjFilterBtn();
  // via window.* — evita imports que crearían ciclos con locus-sesiones-stats y locus-reports
  if (typeof window._updateHeaderProjectLabel === 'function') window._updateHeaderProjectLabel();
  if (typeof window._syncCleanProjectBtn === 'function') window._syncCleanProjectBtn();
}

// ── Lookup de proyecto ───────────────────────────────────────────────────────

export function getProjectById(id) {
  const state = getState();
  return (state.projects || []).find(p => p.id === id);
}

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
        if (typeof window.clearProjectFilter === 'function') window.clearProjectFilter();
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
  if (typeof renderHoy === 'function') renderHoy();
  if (typeof currentTab !== 'undefined' && currentTab === 'analytics') renderAnalytics();
  renderBacklogList();
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

// ── Exposición window.* — compatibilidad con call sites HTML y módulos legacy ─
window._getActiveProjectFilter = _getActiveProjectFilter;
