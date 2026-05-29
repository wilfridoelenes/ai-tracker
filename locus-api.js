// [PP] v1.2.4 · sprint:PP-S-09 · mod:1 · autor:Rune · 2026-05-28 UTC-6
// locus-api.js
// Última actualización: 2026-05-27 | Contrato público del ecosistema Locus
// Carga como ÚLTIMO script en index.html — todos los módulos ya están definidos.
//
// Módulos que alimentan este contrato:
//   locus-toast.js             → showToast, showToastDigest, showToastInline, toast
//   locus-ui-shell.js          → switchTab, switchSubTab
//   locus-tracker.js           → render
//   locus-tracker-utils.js     → startSessionTimer, stopSessionTimer,
//                                renderSuggestionBanner
//   locus-storage.js           → save, saveImmediate, saveBacklog, saveContextDocs,
//                                getActiveProject, getActiveSprints, getAllSessions,
//                                getAI, getCanonicalProjects (via _effectiveVersion wrapper)
//   locus-pulso.js             → openPulsoPanel, closePulsoPanel, renderPulsoDot
//   locus-modals.js            → closeModal
//   locus-map-viewer.js        → renderHtmlMap, setHtmlMapFilter, loadHtmlMap, updateHtmlMapBanner
//   locus-radar.js             → renderGlobalRadarSidebar
//
// Cada valor es referencia directa a la función del módulo.
// Si el módulo no cargó, el valor es undefined — el caller usa window.Locus?.fn?.()
// Los window.fn sueltos existentes se preservan — este archivo no los toca.

// window.Locus declarado como objeto vacío antes de cualquier asignación.
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
// _buildWeeklySummary: función interna — eliminada del contrato (AC-1)

// ── locus-storage.js ──────────────────────────────────────────────────────────
window.Locus.save             = save;
window.Locus.saveImmediate    = saveImmediate;
window.Locus.saveBacklog      = saveBacklog;
window.Locus.saveContextDocs  = saveContextDocs;
window.Locus.getActiveProject = getActiveProject;
window.Locus.getActiveSprints = getActiveSprints;
window.Locus.getAllSessions   = getAllSessions;
window.Locus.getAI            = getAI;
// _getActiveProjectFilter: función interna — eliminada del contrato (AC-1)
// _tplKey: función interna — eliminada del contrato (AC-1)

// getVersion: wrapper público sobre _effectiveVersion (AC-2)
window.Locus.getVersion = function () {
  return typeof _effectiveVersion === 'function' ? _effectiveVersion() : undefined;
};

// getCanonicalProjects: expone CANONICAL_PROJECTS desde locus-storage.js (AC-3)
window.Locus.getCanonicalProjects = function () {
  return typeof CANONICAL_PROJECTS !== 'undefined' ? CANONICAL_PROJECTS : [];
};

// ── locus-pulso.js ────────────────────────────────────────────────────────────
window.Locus.openPulsoPanel   = openPulsoPanel;
window.Locus.closePulsoPanel  = closePulsoPanel;
window.Locus.renderPulsoDot   = renderPulsoDot;

// ── locus-modals.js ───────────────────────────────────────────────────────────
window.Locus.closeModal       = closeModal;
// _gconfirmClose: función interna — eliminada del contrato (AC-1)
// _gconfirmOk: función interna — eliminada del contrato (AC-1)

// ── locus-map-viewer.js ───────────────────────────────────────────────────────
window.Locus.renderHtmlMap        = renderHtmlMap;
window.Locus.setHtmlMapFilter     = setHtmlMapFilter;
window.Locus.loadHtmlMap          = loadHtmlMap;
window.Locus.updateHtmlMapBanner  = updateHtmlMapBanner;

// ── locus-radar.js ────────────────────────────────────────────────────────────
window.Locus.renderGlobalRadarSidebar = renderGlobalRadarSidebar;
// _rsbToggleCollapseAll: función interna — eliminada del contrato (AC-1)

// ── locus-checkpoint-stats.js ─────────────────────────────────────────────────
// _updateHeaderProjectLabel: función interna — eliminada del contrato (AC-1)
