// [PP] v1.2.4 · sprint:PP-S-14 · mod:8 · autor:Rune · 2026-06-02 UTC-6
// locus-api.js
// Última actualización: 2026-05-28 | Contrato público del ecosistema Locus
// Carga como ÚLTIMO script en index.html — todos los módulos ya están definidos.

// ── Imports explícitos por módulo de origen ────────────────────────────────────
import { addNewTag, openTagModal } from './locus-tags.js';
import { showToast, showToastDigest, showToastInline, toast } from './locus-toast.js';
import { switchTab, switchSubTab, applyTheme } from './locus-ui-shell.js';
import { render } from './locus-sesiones.js';
import { startSessionTimer, renderSuggestionBanner, _maybeShowWeeklySummary } from './locus-sesiones-utils.js';
import {
  save, saveImmediate, saveBacklog, saveContextDocs,
  getActiveProject, getActiveSprints, getAllSessions, getAI,
  _effectiveVersion, _initApp
} from './locus-storage.js';
import { openPulsoPanel, closePulsoPanel, renderPulsoDot } from './locus-pulso.js';
import { closeModal } from './locus-modals.js';
import {
  renderHtmlMap, setHtmlMapFilter, loadHtmlMap, updateHtmlMapBanner
} from './locus-map-viewer.js';
import { renderGlobalRadarSidebar } from './locus-radar.js';
import { _getActiveProjectFilter } from './locus-sprint-project.js';
import { exportBacklogMd } from './locus-backlog-generator.js';
import { _itemVizClose, _itemVizConfirm, closeCkptPanel } from './locus-sesiones-viz.js';
import { initCommandPalette, openCommandPalette } from './locus-command-palette.js';
import { setSprintCurrent } from './locus-sprint.js'; // T-202605-133

// window.Locus = {} — bridge para handlers inline de index.html
window.Locus = {};
// Bridge para romper ciclo storage ↔ sprint-project — storage accede via window en runtime
window._getActiveProjectFilter = _getActiveProjectFilter;
window._exportBacklogMd        = exportBacklogMd;

// Funciones llamadas directamente desde scripts inline de index.html (no type=module)
window._initApp                = _initApp;
window._effectiveVersion       = _effectiveVersion;
window._itemVizClose           = _itemVizClose;
window._itemVizConfirm         = _itemVizConfirm;
window._maybeShowWeeklySummary = _maybeShowWeeklySummary;
window.applyTheme              = applyTheme;
window.closeCkptPanel          = closeCkptPanel;
window.initCommandPalette      = initCommandPalette;
window.openCommandPalette      = openCommandPalette;

// ── locus-toast.js ────────────────────────────────────────────────────────────
window.Locus.showToast        = showToast;
window.Locus.showToastDigest  = showToastDigest;
window.Locus.showToastInline  = showToastInline;

// ── locus-ui-shell.js ─────────────────────────────────────────────────────────
window.Locus.switchTab        = switchTab;
window.Locus.switchSubTab     = switchSubTab;

// ── locus-sesiones.js ─────────────────────────────────────────────────────────
window.Locus.render           = render;

// ── locus-sesiones-utils.js ───────────────────────────────────────────────────
window.Locus.startSessionTimer      = startSessionTimer;
window.Locus.renderSuggestionBanner = renderSuggestionBanner;
// stopSessionTimer: ausente en index.html y en T4-import-map — removida del contrato

// ── locus-storage.js ──────────────────────────────────────────────────────────
window.Locus.save             = save;
window.Locus.saveImmediate    = saveImmediate;
window.Locus.saveBacklog      = saveBacklog;
window.Locus.saveContextDocs  = saveContextDocs;
window.Locus.getActiveProject = getActiveProject;
window.Locus.getActiveSprints = getActiveSprints;
window.Locus.getAllSessions   = getAllSessions;
window.Locus.getAI            = getAI;

// getVersion: wrapper público sobre _effectiveVersion
window.Locus.getVersion = function () {
  return _effectiveVersion();
};

// getCanonicalProjects: CANONICAL_PROJECTS vive en locus-session-parse.js — no exportada.
// Wrapper con fallback seguro para acceso desde handlers inline.
window.Locus.getCanonicalProjects = function () {
  return typeof CANONICAL_PROJECTS !== 'undefined' ? CANONICAL_PROJECTS : [];
};

// ── locus-pulso.js ────────────────────────────────────────────────────────────
window.Locus.openPulsoPanel   = openPulsoPanel;
window.Locus.closePulsoPanel  = closePulsoPanel;
window.Locus.renderPulsoDot   = renderPulsoDot;

// ── locus-modals.js ───────────────────────────────────────────────────────────
window.Locus.closeModal       = closeModal;

// ── locus-map-viewer.js ───────────────────────────────────────────────────────
window.Locus.renderHtmlMap        = renderHtmlMap;
window.Locus.setHtmlMapFilter     = setHtmlMapFilter;
window.Locus.loadHtmlMap          = loadHtmlMap;
window.Locus.updateHtmlMapBanner  = updateHtmlMapBanner;

// ── locus-radar.js ────────────────────────────────────────────────────────────
window.Locus.renderGlobalRadarSidebar = renderGlobalRadarSidebar;

// ── locus-sprint.js ───────────────────────────────────────────────────────────
window.Locus.setSprintCurrent = setSprintCurrent; // T-202605-133

// ── locus-tags.js ─────────────────────────────────────────────────────────────
window.Locus.addNewTag    = addNewTag;
window.Locus.openTagModal = openTagModal;
