// [PP] v1.0.0 · sprint:PP-S-01 · mod:4 · autor:Rune · 2026-06-11 10:00 UTC-6 
// main.js — punto de entrada único de Locus (ES Modules nativos)
// T2: imports en el mismo orden que index.html declaraba los <script src>
// El ciclo storage↔sprint-project se resuelve inyectando las referencias via opts en _initApp

import { _getActiveProjectFilter, _initApp, _effectiveVersion, getProjectById, LOCUS_KEYS } from './locus-storage.js';
import { applyTheme, _initUiShellRefs } from './locus-ui-shell.js';
import './locus-analytics-core.js';
import './locus-analytics-digest.js';
import './locus-analytics-render.js';
import './locus-analytics-charts.js';
import './locus-toast.js';
import './locus-sesiones.js';
import './locus-sesiones-utils.js';
import './locus-modals.js';
import './locus-workers.js';
import './locus-pulso.js';
import './locus-notifications.js';
import './locus-sesiones-stats.js';
import './locus-sesiones-capture.js';
import './locus-sesiones-viz.js';
import './locus-sesiones-arranque.js';
import './locus-radar.js';
import { parsePaste, handlePaste, handleInput } from './locus-session-parse.js';
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
import { exportBacklogMd } from './locus-backlog-generator.js';
import { getItems, _localStorageUsageRatio, _migrateItemTypes, _purgeStaleBacklogCache } from './locus-backlog-core.js';
import { renderSprintTab } from './locus-sprint.js';
import { relDate } from './locus-session-hora.js';
import './locus-map-generator.js';
import { initCommandPalette } from './locus-command-palette.js';import { _maybeShowWeeklySummary } from './locus-sesiones-utils.js';
import { _itemVizConfirm, _itemVizClose, closeCkptPanel } from './locus-sesiones-viz.js';

// ── Funciones migradas desde inline script de index.html (T-202606-006) ──────

// toggleTheme: invoca applyTheme ESM — reemplaza función global del script no-module
function _toggleTheme() {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(t);
  _syncToggleLabel(t);
}

// _syncToggleLabel: sincroniza aria-label del theme-toggle-btn con el tema activo
// Reemplaza el patch window.applyTheme del script no-module (líneas 1608-1627 de index.html)
function _syncToggleLabel(t) {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.setAttribute('aria-label', t === 'dark' ? 'Cambiar a tema light' : 'Cambiar a tema dark');
}

// _updateBackupBadge: actualiza badge del botón backup según datos en localStorage
// T-202604-210: migrado desde inline script
function _updateBackupBadge() {
  try {
    const badge = document.getElementById('backup-badge');
    if (!badge) return;
    const raw = localStorage.getItem(LOCUS_KEYS.STATE);
    const hasData = raw && raw.length > 50;
    badge.classList.toggle('visible', !!hasData);
    const vp = document.getElementById('version-pill');
    if (vp) {
      const ver = _effectiveVersion?.() ?? '';
      vp.title = ver + ' · Ver changelog';
    }
  } catch(e) {}
}

// _validateResetSessionsInput / _validateResetBacklogInput: expuestas en window
// porque son invocadas desde HTML dinámico generado por locus-modals.js
// B-202605-503 / B-202605-037: migradas desde inline script
window._validateResetSessionsInput = function(el) {
  const v = el.value.trim();
  const ok = v === 'RESET';
  document.getElementById('reset-sessions-confirm-btn').disabled = !ok;
  const hint = document.getElementById('reset-sessions-hint');
  if (v.length > 0 && !ok) { hint.textContent = 'Debe ser exactamente: RESET (mayúsculas)'; hint.classList.remove('is-hidden'); }
  else { hint.classList.add('is-hidden'); }
};

window._validateResetBacklogInput = function(el) {
  const v = el.value.trim();
  const ok = v === 'RESET';
  document.getElementById('reset-backlog-confirm-btn').disabled = !ok;
  const hint = document.getElementById('reset-backlog-hint');
  if (v.length > 0 && !ok) { hint.textContent = 'Debe ser exactamente: RESET (mayúsculas)'; hint.classList.remove('is-hidden'); }
  else { hint.classList.add('is-hidden'); }
};

// B-202606-024: window.parsePaste · handlePaste · handleInput eliminados — todos los consumidores usan ESM import

// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // R-202605-002: title dinámico con versión efectiva
  try {
    const ver = _effectiveVersion();
    document.title = ver ? 'Locus ' + ver : 'Locus';
  } catch(e) { document.title = 'Locus'; }

  // Inicializar command palette (reemplaza llamada del script inline L1429)
  initCommandPalette();

  // T-202606-006: theme toggle — listener sobre #theme-toggle-btn (reemplaza toggleTheme global)
  const _themeBtn = document.getElementById('theme-toggle-btn');
  if (_themeBtn) _themeBtn.addEventListener('click', _toggleTheme);

  // T-202606-006: sincronizar aria-label con tema activo al cargar
  const _themeInit = document.documentElement.getAttribute('data-theme') || 'light';
  _syncToggleLabel(_themeInit);

  // T-202606-006: _updateBackupBadge — ejecutar 800ms post-DOMContentLoaded
  setTimeout(_updateBackupBadge, 800);

  // T-202605-448: panel de resumen semanal — se activa los lunes al abrir la app
  setTimeout(function() {
    _maybeShowWeeklySummary();
  }, 1200);

  // T-202605-062: inline handlers → addEventListener (CSS Purity)
  const _ivzConfirm = document.getElementById('item-viz-confirm-btn');
  if (_ivzConfirm) _ivzConfirm.addEventListener('click', function() { _itemVizConfirm(); });
  const _ivzClose = document.getElementById('item-viz-close-btn');
  if (_ivzClose) _ivzClose.addEventListener('click', function() { _itemVizClose(); });
  const _ckptClose = document.getElementById('ckpt-header-close-btn');
  if (_ckptClose) _ckptClose.addEventListener('click', function() { closeCkptPanel(); });

  // Arrancar app — inyectar referencias directas para romper ciclos storage↔sprint-project y storage↔backlog-core
  // ESM-B: getProjectById · _localStorageUsageRatio · _migrateItemTypes · _purgeStaleBacklogCache agregados
  // T-202606-006 T3: renderSprintTab agregado — elimina window.renderSprintTab en storage
  _initApp({
    getActiveProjectFilter: _getActiveProjectFilter,
    exportBacklogMd,
    getItems,
    localStorageUsageRatio: _localStorageUsageRatio,
    migrateItemTypes: _migrateItemTypes,
    purgeStaleBacklogCache: _purgeStaleBacklogCache,
    getProjectById,
    renderSprintTab,
  });

  // T-202606-006 T3: inyectar refs en ui-shell — rompe ciclos ui-shell ↔ backlog-core y ui-shell ↔ session-hora
  _initUiShellRefs({ getItems, relDate });
});
