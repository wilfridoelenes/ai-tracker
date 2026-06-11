// [PP] v1.2.4 · sprint:PP-S-01 · mod:16 · autor:Rune · 2026-06-11 UTC-6
// locus-misc-ui.js
// Módulo: Helpers de UI — getNextOccurrence, _resetExpired
// Extraído de ai-tracker-ai-notes.js — Tags migrado a locus-tags.js (T-202605-072)
// Pendientes migrado a locus-pend.js (T-202605-073)
// Doc Activity Log migrado a locus-doc-log.js (T-202605-074)
import { openStandaloneCheckpoint, closeStandaloneCheckpoint } from './locus-session-parse.js';
import { getNextOccurrence, _resetExpired, getCD } from './locus-sesiones-utils.js';
// openPendPanel / closePendPanel viven en locus-pend.js — no se re-exportan desde aquí

const _getCurrentTab = () => window.currentTab || '';

// ── Listeners ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Standalone checkpoint — botón cancelar
  const ckptCancelBtn = document.getElementById('standalone-ckpt-cancel-btn');
  if (ckptCancelBtn) ckptCancelBtn.addEventListener('click', closeStandaloneCheckpoint);
  // Doc log listeners → locus-doc-log.js
});
// ─────────────────────────────────────────────────────────────────────────

// ── Search — extraído a locus-ui-shell.js ────────────────────────────────
// _searchScopeAll, _toggleSearchScope, onSearch
// ─────────────────────────────────────────────────────────────────────────

// ── Exposición pública ───────────────────────────────────────────────────
// openDocLog · closeDocLog · _updateDocLogCount · clearDocLog → locus-doc-log.js
// openStandaloneCheckpoint, closeStandaloneCheckpoint → locus-session-parse.js
// getCD, _resetExpired, getNextOccurrence → locus-sesiones-utils.js
