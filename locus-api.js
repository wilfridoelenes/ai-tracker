// [PP] v1.2.4 · sprint:PP-S-01 · mod:10 · autor:Rune · 2026-06-04 23:55 UTC-6
// locus-api.js
// T-202606-007: window.* bridge eliminado — todos los consumidores migrados a ESM en main.js

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
import { setSprintCurrent, renderSprintTab } from './locus-sprint.js'; // T-202605-133 · T-202606-020

// T-202606-007: exports nombrados — contrato público del módulo vía ESM
// Los consumidores importan directamente desde este archivo o desde el módulo de origen.
// window.Locus y todos los bridges window.fn eliminados — ningún consumidor los usaba.
export {
  // locus-tags.js
  addNewTag, openTagModal,
  // locus-toast.js
  showToast, showToastDigest, showToastInline, toast,
  // locus-ui-shell.js
  switchTab, switchSubTab, applyTheme,
  // locus-sesiones.js
  render,
  // locus-sesiones-utils.js
  startSessionTimer, renderSuggestionBanner, _maybeShowWeeklySummary,
  // locus-storage.js
  save, saveImmediate, saveBacklog, saveContextDocs,
  getActiveProject, getActiveSprints, getAllSessions, getAI,
  _effectiveVersion, _initApp,
  // locus-pulso.js
  openPulsoPanel, closePulsoPanel, renderPulsoDot,
  // locus-modals.js
  closeModal,
  // locus-map-viewer.js
  renderHtmlMap, setHtmlMapFilter, loadHtmlMap, updateHtmlMapBanner,
  // locus-radar.js
  renderGlobalRadarSidebar,
  // locus-sprint-project.js
  _getActiveProjectFilter,
  // locus-backlog-generator.js
  exportBacklogMd,
  // locus-sesiones-viz.js
  _itemVizClose, _itemVizConfirm, closeCkptPanel,
  // locus-command-palette.js
  initCommandPalette, openCommandPalette,
  // locus-sprint.js
  setSprintCurrent, renderSprintTab,
};
