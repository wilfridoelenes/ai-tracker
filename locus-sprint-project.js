// [PP] v1.2.4 · sprint:PP-S-15 · mod:20 · autor:Rune · 2026-06-02 UTC-6
// locus-sprint-project.js
// Última actualización: 2026-05-19 UTC-6
// Módulo: Export de documentos (Backlog, Sprints, History) + gestión de proyectos
// Renombrado de ai-tracker-sprint-project.js
import { loadHtmlMap } from './locus-map-viewer.js';
import { _syncCleanProjectBtn } from './locus-reports.js';
import { _blogLog, _effectiveVersion, _offlineQueuePush, _tplKey, getActiveProject, getActiveSprints, getActiveTracker, getProjectSessions, getState, getSupabaseUserId, save } from './locus-storage.js';
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';


import { renderAnalytics } from './locus-analytics-render.js';

import { loadBacklog, renderStats, updateBacklogBanner, updateStatusFilterUI } from './locus-backlog-core.js';
import { closeQuickCapture } from './locus-sesiones-capture.js';

import { updateBacklogFooter } from './locus-backlog-item.js';

import { renderBacklogList } from './locus-backlog-render.js';

import { _renderTplProjBanner } from './locus-docs.js';


import { _gconfirmOpen, closeModal } from './locus-modals.js';

import { renderProyectos } from './locus-projects.js';

import { _updateHeaderProjectLabel } from './locus-sesiones-stats.js';

import { render } from './locus-sesiones.js';

import { closePopup } from './locus-session-popup.js';

import { showToast, showToastInline } from './locus-toast.js';

// ── Utilidades de módulo — T3.bis ─────────────────────────────────────────────
export function pad(n) { return String(n).padStart(2, '0'); }
export function _sprintNum(id) {
  if (!id) return null;
  const m = String(id).match(/S-(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

// T-202604-243: prefijo de documento vivo según proyecto activo — OL-CONTEXT §7
// R-202605-002: _PREFIX_MAP consumida desde locus-storage.js — sin declaración local
export function _docPrefix() {
  const proj = getActiveProject();
  if (!proj) return 'XX';
  if (proj.prefix) return proj.prefix;
  const name = proj.name || '';
  return _PREFIX_MAP[name] || (name.slice(0, 2).toUpperCase() || 'XX');
}

// R-1: _updateHeaderProjectLabel — definición canónica en checkpoint.js
// Este módulo la llama via guard — no la redefine.


// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
window.getProjectById            = getProjectById;
window._getActiveProjectFilter   = _getActiveProjectFilter;
window.pad                       = window.pad || pad;           // T3.bis
window._sprintNum                = _sprintNum;                   // T3.bis
window.openProjPanel             = openProjPanel;
window.selectProjectFilter       = selectProjectFilter;
window._docPrefix                = _docPrefix;
window.getProjContext            = getProjContext;
window._countProjSessions        = _countProjSessions;
window._setActiveProjectFilter   = _setActiveProjectFilter;
window._updateProjBreadcrumb     = _updateProjBreadcrumb;
window._updateProjFilterBtn      = _updateProjFilterBtn;
window.setProjContext            = setProjContext;
window._getLocalStorageUsage     = _getLocalStorageUsage;
window.openProjModal             = openProjModal;
window.closeProjPanel            = closeProjPanel;
window.closeProjModal            = closeProjModal;
// Inline handlers
window.clearProjectFilter        = clearProjectFilter;
window.renderProjPanel           = renderProjPanel;
window.cancelProjForm            = cancelProjForm;
window.selectProjColor           = selectProjColor;
window.confirmProjForm           = confirmProjForm;
window.editProjInline            = editProjInline;
window.toggleProjArchive         = toggleProjArchive;
window.deleteProjConfirm         = deleteProjConfirm;
window.projDragStart             = projDragStart;
window.projDragEnd               = projDragEnd;
window.projDragOver              = projDragOver;
window.projDragLeave             = projDragLeave;
window.projDrop                  = projDrop;
window.createNote                = createNote;
window.editNote                  = editNote;
window.deleteNote                = deleteNote;
window.getActiveProjectNotes     = getActiveProjectNotes;
