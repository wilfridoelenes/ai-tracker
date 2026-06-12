// [PP] v1.0.0 · sprint:PP-S-09 · mod:2 · autor:Rune · 2026-06-12 00:00 UTC-6
// locus-pend.js
// Módulo: Panel de Pendientes — openPendPanel · closePendPanel
// Extraído de locus-misc-ui.js (T2 · T-202605-073)
import { _restoreModalFocus } from './locus-modals.js';
import { getState, getAISessions, _relTs } from './locus-storage.js'; // T-202606-097: _relTs importada via ESM — reemplaza fallback window._relTs
import { openDetail } from './locus-session-popup.js';
import { esc } from './locus-ui-shell.js';

const _esc = (s) => esc(s);

// ── Pendientes panel ──
export function openPendPanel() {
  const body = document.getElementById('pend-panel-body');
  let html = ''; let total = 0;
  getState().ais.forEach(ai => {
    const aiSess = getAISessions(ai.id);
    const withPending = aiSess.filter(s => s.pending && s.pending.trim());
    if (!withPending.length) return;
    total += withPending.length;
    const dotColor = ai.status === 'available' ? 'var(--green)' : 'var(--red)';
    html += `<div class="pend-ai-group">
      <div class="pend-ai-name"><span class="pend-ai-dot" style="--ai-dot-color:${dotColor}"></span>${_esc(ai.name)}</div>`;
    [...withPending].reverse().forEach(s => {
      html += `<div class="pend-item" data-action="pend-open-detail" data-ai-id="${ai.id}" data-sess-id="${s.id}">
        <div class="pend-item-pending">${_esc(s.pending)}</div>
        <div class="pend-item-meta">${_esc(s.title)} · ${s.dateShort || ''}</div>
      </div>`;
    });
    html += '</div>';
  });
  body.innerHTML = total ? html : `<div class="pend-empty">🎉 Sin pendientes — todo resuelto</div>`;
  document.getElementById('pend-overlay').classList.add('open');
}

export function closePendPanel() {
  document.getElementById('pend-overlay').classList.remove('open');
  _restoreModalFocus('pend-overlay');
}

// ── Listeners ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Pendientes panel — overlay click + botón cerrar
  const pendOverlay = document.getElementById('pend-overlay');
  if (pendOverlay) pendOverlay.addEventListener('click', e => { if (e.target === pendOverlay) closePendPanel(); });
  const pendCloseBtn = document.getElementById('pend-close-btn');
  if (pendCloseBtn) pendCloseBtn.addEventListener('click', closePendPanel);

  // Pendientes panel body — openDetail
  const pendPanelBody = document.getElementById('pend-panel-body');
  if (pendPanelBody) pendPanelBody.addEventListener('click', e => {
    const item = e.target.closest('[data-action="pend-open-detail"]');
    if (item) { closePendPanel(); openDetail(item.dataset.aiId, item.dataset.sessId); }
  });
});
// ─────────────────────────────────────────────────────────────────────────

// ── Exposición pública ───────────────────────────────────────────────────
