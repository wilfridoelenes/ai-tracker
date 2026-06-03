// [PP] v1.2.4 · sprint:PP-S-09 · mod:8 · autor:Rune · 2026-06-03 UTC-6
// main.js — punto de entrada único de Locus (ES Modules nativos)
// T2: imports en el mismo orden que index.html declaraba los <script src>
// El ciclo storage↔sprint-project se resuelve inyectando las referencias via opts en _initApp

import { _initApp, _effectiveVersion } from './locus-storage.js';
import './locus-analytics-core.js';
import './locus-analytics-digest.js';
import './locus-analytics-render.js';
import './locus-analytics-charts.js';
import './locus-toast.js';
import './locus-sesiones.js';
import './locus-sesiones-utils.js';
import './locus-ui-shell.js';
import './locus-modals.js';
import './locus-workers.js';
import './locus-pulso.js';
import './locus-notifications.js';
import './locus-sesiones-stats.js';
import './locus-sesiones-capture.js';
import './locus-sesiones-viz.js';
import './locus-sesiones-arranque.js';
import './locus-radar.js';
import './locus-session-parse.js';
import './locus-session-hora.js';
import './locus-session-save.js';
import './locus-tags.js';
import './locus-session-popup.js';
import './locus-reports.js';
import './locus-backlog-editor.js';
import './locus-misc-ui.js';
import './locus-projects.js';
import './locus-docs.js';
import './locus-sprint-plan.js';
import './locus-contracts.js';
import './locus-map-viewer.js';
import './locus-backlog-core.js';
import './locus-backlog-item.js';
import './locus-backlog-merge.js';
import './locus-backlog-panel.js';
import './locus-backlog-render.js';
import './locus-backlog-sprints.js';
import './locus-backlog-archive.js';
import './locus-sprint.js';
import { _getActiveProjectFilter, getProjectById } from './locus-sprint-project.js';
import { exportBacklogMd } from './locus-backlog-generator.js';
import { getItems, _localStorageUsageRatio, _migrateItemTypes, _purgeStaleBacklogCache } from './locus-backlog-core.js';
import './locus-map-generator.js';
import { initCommandPalette } from './locus-command-palette.js';
import './locus-api.js';

document.addEventListener('DOMContentLoaded', () => {
  // R-202605-002: title dinámico con versión efectiva
  try {
    const ver = _effectiveVersion();
    document.title = ver ? 'Locus ' + ver : 'Locus';
  } catch(e) { document.title = 'Locus'; }

  // Inicializar command palette (reemplaza llamada del script inline L1429)
  if (typeof initCommandPalette === 'function') initCommandPalette();

  // Arrancar app — inyectar referencias directas para romper ciclos storage↔sprint-project y storage↔backlog-core
  // ESM-B: getProjectById · _localStorageUsageRatio · _migrateItemTypes · _purgeStaleBacklogCache agregados
  _initApp({
    getActiveProjectFilter: _getActiveProjectFilter,
    exportBacklogMd,
    getItems,
    localStorageUsageRatio: _localStorageUsageRatio,
    migrateItemTypes: _migrateItemTypes,
    purgeStaleBacklogCache: _purgeStaleBacklogCache,
    getProjectById,
  });
});
