// [PP] v0.8.0 · sprint:PP-S-XX · mod:15 · autor:Rune · 2026-07-06 18:35 UTC-6
// TKT-202607-044 (REQ-202607-015): getIncidents importado desde locus-backlog-core.js +
// agregado a opts de _initApp — cierra el wiring del lado de main.js para que
// locus-storage.js reciba la referencia real en vez del fallback [] con warning.
// getIncidents asumido exportado desde locus-backlog-core.js — no verificado directamente
// (archivo no adjunto en esta sesión); evidenciado por AC de TKT-202607-045 y por el
// comentario ya presente en locus-storage.js ("INCIDENTS separado de ITEMS desde
// TKT-202607-005"). Gap de verificación registrado — ver CHECKPOINT.
// REQ refactor-zonas TKT5: side-effect imports de locus-backlog-qbacklog.js y
// locus-backlog-qdisc.js agregados — sus IIFEs de listener de sub-tab y (qbacklog)
// _attachDoneGroupToggle deben ejecutar al cargar la app. locus-backlog-zone-engine.js y
// locus-backlog-hierarchy.js no requieren import explícito aquí — son módulos puramente
// exportadores sin side effects de nivel módulo, se resuelven transitivamente.
// REQ-[pendiente-ID] Unificar vocabulario historico — TKT2: side-effect import
// actualizado hacia locus-backlog-historico.js (ex locus-backlog-archive.js).
// main.js — punto de entrada único de Locus (ES Modules nativos)
// El ciclo storage↔sprint-project se resuelve inyectando las referencias via opts en _initApp
// Limpieza: imports duplicados consolidados (side-effect imports redundantes eliminados)

import { _getActiveProjectFilter, _initApp, _effectiveVersion, getProjectById, LOCUS_KEYS, verifyConstraintsSync } from './locus-storage.js';
import { _initUiShellRefs } from './locus-ui-shell.js';
import './locus-analytics-core.js';
import './locus-analytics-digest.js';
import './locus-analytics-render.js';
import './locus-analytics-charts.js';
import './locus-toast.js';
import './locus-sesiones.js';
import { _maybeShowWeeklySummary } from './locus-sesiones-utils.js';
import './locus-modals.js';
import './locus-workers.js';
import './locus-pulso.js';
import './locus-notifications.js';
import './locus-sesiones-stats.js';
import './locus-sesiones-capture.js';
import { _itemVizConfirm, _itemVizClose, closeCkptPanel } from './locus-sesiones-viz.js';
import './locus-sesiones-arranque.js';
import './locus-radar.js';
import { parsePaste, handlePaste, handleInput } from './locus-session-parse.js';
import { relDate } from './locus-session-hora.js';
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
import { getItems, getIncidents, _localStorageUsageRatio, _migrateItemTypes, _purgeStaleBacklogCache } from './locus-backlog-core.js';
import './locus-backlog-item.js';
import './locus-backlog-merge.js';
import './locus-backlog-panel.js';
import './locus-backlog-render.js';
import './locus-backlog-qbacklog.js';
import './locus-backlog-qdisc.js';
import './locus-backlog-sprints.js';
import './locus-backlog-historico.js';
import { renderSprintTab } from './locus-sprint.js';
import { exportBacklogMd } from './locus-backlog-generator.js';
import './locus-map-generator.js';
import { initCommandPalette } from './locus-command-palette.js';

// ── Funciones migradas desde inline script de index.html (T-202606-006) ──────

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

// R-202606-002: _validateResetSessionsInput / _validateResetBacklogInput
// Los overlays reset-sessions-overlay y reset-backlog-overlay no existen en index.html aún —
// se registran por delegation para cuando sean añadidos al DOM.
function _validateResetSessionsInput(el) {
  const v = el.value.trim();
  const ok = v === 'RESET';
  document.getElementById('reset-sessions-confirm-btn').disabled = !ok;
  const hint = document.getElementById('reset-sessions-hint');
  if (v.length > 0 && !ok) { hint.textContent = 'Debe ser exactamente: RESET (mayúsculas)'; hint.classList.remove('is-hidden'); }
  else { hint.classList.add('is-hidden'); }
}

function _validateResetBacklogInput(el) {
  const v = el.value.trim();
  const ok = v === 'RESET';
  document.getElementById('reset-backlog-confirm-btn').disabled = !ok;
  const hint = document.getElementById('reset-backlog-hint');
  if (v.length > 0 && !ok) { hint.textContent = 'Debe ser exactamente: RESET (mayúsculas)'; hint.classList.remove('is-hidden'); }
  else { hint.classList.add('is-hidden'); }
}

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
    // TKT-202607-044 (REQ-202607-015): getIncidents inyectado — locus-storage.js ya
    // acepta opts.getIncidents (mismo patrón lazy ref que getItems). Completa el wiring
    // que _getIncidents en locus-storage.js dejó pendiente.
    getIncidents,
    localStorageUsageRatio: _localStorageUsageRatio,
    migrateItemTypes: _migrateItemTypes,
    purgeStaleBacklogCache: _purgeStaleBacklogCache,
    getProjectById,
    renderSprintTab,
  });

  // T-202606-006 T3: inyectar refs en ui-shell — rompe ciclos ui-shell ↔ backlog-core y ui-shell ↔ session-hora
  _initUiShellRefs({ getItems, relDate });

  // R-202606-002: registrar listeners de validación de reset — delegation para overlays futuros
  const _rsInput = document.getElementById('reset-sessions-input');
  if (_rsInput) _rsInput.addEventListener('input', function() { _validateResetSessionsInput(this); });
  const _rbInput = document.getElementById('reset-backlog-input');
  if (_rbInput) _rbInput.addEventListener('input', function() { _validateResetBacklogInput(this); });

  // TKT1b: verifyConstraintsSync — herramienta de consola, sin consumidores ESM internos.
  // Expuesta en window por diseño (mismo patrón que las herramientas de diagnóstico ya
  // retiradas) — uso manual del founder, no se invoca desde ningún módulo de la app.
  window._verifyConstraintsSync = verifyConstraintsSync;
});
