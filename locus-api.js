// locus-api.js
// Última actualización: 2026-05-24 | Contrato público del ecosistema Locus
// Carga como ÚLTIMO script en index.html — todos los módulos ya están definidos.
//
// Módulos que alimentan este contrato:
//   locus-toast.js             → showToast, showToastDigest, showToastInline, toast
//   locus-ui-shell.js          → switchTab, switchSubTab
//   locus-tracker.js           → render, selectTrackerAI, buildHoyCard
//   locus-tracker-utils.js     → startSessionTimer, stopSessionTimer,
//                                renderSuggestionBanner, _buildWeeklySummary
//   locus-storage.js           → save, saveImmediate, saveBacklog, saveContextDocs,
//                                getActiveProject, getActiveSprints, getAllSessions,
//                                getAI, _getActiveProjectFilter, _tplKey
//   locus-pulso.js             → openPulsoPanel, closePulsoPanel, renderPulsoDot
//   locus-modals.js            → closeModal, _gconfirmClose, _gconfirmOk
//   locus-map-viewer.js        → renderHtmlMap, setHtmlMapFilter, loadHtmlMap, updateHtmlMapBanner
//   locus-radar.js             → renderGlobalRadarSidebar, _rsbToggleCollapseAll
//   locus-checkpoint-stats.js  → _updateHeaderProjectLabel
//
// AC-3: cada valor es referencia directa a la función del módulo.
// Si el módulo no cargó, el valor es undefined — el caller usa window.Locus?.fn?.()
// AC-5: los window.fn sueltos existentes se preservan — este archivo no los toca.

// AC-1: window.Locus declarado como objeto vacío antes de cualquier asignación.
window.Locus = {};

// ── locus-toast.js ────────────────────────────────────────────────────────────
window.Locus.showToast        = showToast;
window.Locus.showToastDigest  = showToastDigest;
window.Locus.showToastInline  = showToastInline;
window.Locus.toast            = toast;

// ── locus-ui-shell.js ─────────────────────────────────────────────────────────
window.Locus.switchTab        = switchTab;
window.Locus.switchSubTab     = switchSubTab;

// ── locus-tracker.js ──────────────────────────────────────────────────────────
window.Locus.render           = render;

// ── locus-tracker-utils.js ────────────────────────────────────────────────────
window.Locus.startSessionTimer      = startSessionTimer;
window.Locus.stopSessionTimer       = stopSessionTimer;
window.Locus.renderSuggestionBanner = renderSuggestionBanner;
window.Locus._buildWeeklySummary    = _buildWeeklySummary;

// ── locus-storage.js ──────────────────────────────────────────────────────────
window.Locus.save                    = save;
window.Locus.saveImmediate           = saveImmediate;
window.Locus.saveBacklog             = saveBacklog;
window.Locus.saveContextDocs         = saveContextDocs;
window.Locus.getActiveProject        = getActiveProject;
window.Locus.getActiveSprints        = getActiveSprints;
window.Locus.getAllSessions           = getAllSessions;
window.Locus.getAI                   = getAI;
window.Locus._getActiveProjectFilter = _getActiveProjectFilter;
window.Locus._tplKey                 = _tplKey;

// ── locus-pulso.js ────────────────────────────────────────────────────────────
window.Locus.openPulsoPanel   = openPulsoPanel;
window.Locus.closePulsoPanel  = closePulsoPanel;
window.Locus.renderPulsoDot   = renderPulsoDot;

// ── locus-modals.js ───────────────────────────────────────────────────────────
window.Locus.closeModal       = closeModal;
window.Locus._gconfirmClose   = _gconfirmClose;
window.Locus._gconfirmOk      = _gconfirmOk;

// ── locus-map-viewer.js ───────────────────────────────────────────────────────
window.Locus.renderHtmlMap        = renderHtmlMap;
window.Locus.setHtmlMapFilter     = setHtmlMapFilter;
window.Locus.loadHtmlMap          = loadHtmlMap;
window.Locus.updateHtmlMapBanner  = updateHtmlMapBanner;

// ── locus-radar.js ────────────────────────────────────────────────────────────
window.Locus.renderGlobalRadarSidebar = renderGlobalRadarSidebar;
window.Locus._rsbToggleCollapseAll    = _rsbToggleCollapseAll;

// ── locus-checkpoint-stats.js ─────────────────────────────────────────────────
window.Locus._updateHeaderProjectLabel = _updateHeaderProjectLabel;
