// [PP] v1.2.4 · sprint:PP-S-09 · mod:10 · autor:Rune · 2026-05-30 UTC-6
// locus-misc-ui.js
// Módulo: Helpers de UI — getNextOccurrence, _resetExpired, Tags, Pendientes, Doc Activity Drawer
// Extraído de ai-tracker-ai-notes.js
import { openStandaloneCheckpoint, closeStandaloneCheckpoint } from './locus-session-parse.js';
import { _restoreModalFocus, _saveModalTrigger } from './locus-modals.js';
import { getState, save, getAISessions, _findSession } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';
import { openDetail } from './locus-session-popup.js';

import { renderStatusBar, updateStats } from './locus-sesiones-stats.js';
import { getNextOccurrence, _resetExpired, getCD } from './locus-sesiones-utils.js';

import { render } from './locus-sesiones.js';

import { esc } from './locus-ui-shell.js';

// Helpers para globales que viven en módulos no adjuntos (TAG_COLORS, esc, currentTab, renderHoy, _relTs, popAIId, popSessId)
// Acceso via window con guards — patrón establecido en este stack para evitar ciclos de importación
const _esc = (s) => esc(s);
const _getTagColors = () => window.TAG_COLORS || [];
const _getCurrentTab = () => window.currentTab || '';
const _renderHoy = () => { if (typeof window.renderHoy === 'function') window.renderHoy(); };
const _relTs = (ts) => window._relTs ? window._relTs(ts) : '';

// ── Tags ──
export function openTagModal(aiId, sessId) {
  _saveModalTrigger('tag-modal');
  tagModalAIId = aiId; tagModalSessId = sessId; selectedColor = 0;
  renderTagPicker(); renderColorPicker();
  document.getElementById('tag-new-input').value = '';
  document.getElementById('tag-modal').classList.add('open');
  setTimeout(() => document.getElementById('tag-new-input').focus(), 80);
}
export function renderTagPicker() {
  const found = tagModalSessId ? _findSession(tagModalSessId) : null;
  const s = found ? found.sess : null;
  const selected = s ? s.tags || [] : [];
  const list = document.getElementById('tag-picker-list');
  if (!list) return;
  if (!getState().tags.length) { list.innerHTML = `<div class="pi-no-ac">Sin etiquetas aún — crea una abajo</div>`; return; }
  list.innerHTML = getState().tags.map(t => {
    const ci = _getTagColors().indexOf(t.color);
    const isSel = selected.includes(t.id);
    return `<div class="tag-picker-row${isSel ? ' selected' : ''}" data-action="toggle-tag" data-tag-id="${t.id}">
      <div class="tag-picker-dot" style="--dot-color:${t.color}"></div>
      <div class="tag-picker-name">${_esc(t.name)}</div>
      ${isSel ? `<span class="tag-picker-check">✓</span>` : ''}
    </div>`;
  }).join('');
}
export function renderColorPicker() {
  const row = document.getElementById('color-picker-row');
  if (!row) return;
  row.innerHTML = _getTagColors().map((c, i) =>
    `<div class="color-dot-btn${i === selectedColor ? ' sel' : ''}" style="--dot-color:${c}" data-action="select-color" data-color-idx="${i}"></div>`
  ).join('');
}
export function selectColor(i) { selectedColor = i; renderColorPicker(); }
export function toggleTagOnSession(tagId) {
  const found = tagModalSessId ? _findSession(tagModalSessId) : null;
  const s = found ? found.sess : null;
  if (!s) return;
  if (!s.tags) s.tags = [];
  const idx = s.tags.indexOf(tagId);
  if (idx >= 0) s.tags.splice(idx, 1); else s.tags.push(tagId);
  save(); renderTagPicker(); render();
  if (window.popAIId === tagModalAIId && window.popSessId === tagModalSessId) openDetail(tagModalAIId, tagModalSessId);
}
export function addNewTag() {
  const name = document.getElementById('tag-new-input').value.trim();
  if (!name) { showToast('warning', 'Escribe un nombre'); return; }
  if (getState().tags.find(t => t.name.toLowerCase() === name.toLowerCase())) { showToast('warning', 'Ya existe esa etiqueta'); return; }
  const tag = {id:'tag-'+Date.now(), name, color:_getTagColors()[selectedColor]};
  getState().tags.push(tag);
  const found = tagModalSessId ? _findSession(tagModalSessId) : null;
  const s = found ? found.sess : null;
  if (s) { if (!s.tags) s.tags = []; s.tags.push(tag.id); }
  save(); renderTagPicker(); renderColorPicker(); render();
  document.getElementById('tag-new-input').value = '';
  showToast('success', `Etiqueta "${name}" creada`);
}

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

// ── Doc Activity Drawer ──

let _docLogDrawerOpen = false;

export function openDocLog(doc) {
  _docLogDrawerOpen = true;
  const drawer = document.getElementById('doc-log-drawer');
  const overlay = document.getElementById('doc-log-overlay');
  if (!drawer) return;
  drawer.setAttribute('data-doc', doc);
  const titles = { backlog: '📋 Log · Backlog', context: '📄 Log · Context', htmlmap: '🗺 Log · Module Map' };
  const titleEl = drawer.querySelector('#doc-log-title');
  if (titleEl) titleEl.textContent = titles[doc] || 'Log';
  _renderDocLog(doc);
  drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  // T-202604-300: desplazar toast-stack para no solapar con el drawer (360px + 16px gap)
  document.documentElement.style.setProperty('--toast-right-offset', '376px');
}

export function closeDocLog() {
  _docLogDrawerOpen = false;
  const drawer = document.getElementById('doc-log-drawer');
  const overlay = document.getElementById('doc-log-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  // T-202604-300: restaurar posición por defecto del toast-stack
  document.documentElement.style.removeProperty('--toast-right-offset');
  _restoreModalFocus('doc-log-overlay');
}

export function _updateDocLogCount(doc) {
  const btnId = { backlog: 'doc-log-btn-backlog', context: 'doc-log-btn-context', htmlmap: 'doc-log-btn-htmlmap' }[doc];
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const key = doc === 'context' ? 'context-log' : doc === 'htmlmap' ? 'html-map-log' : 'backlog-log';
  let log = [];
  try { log = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  const badge = btn.querySelector('.doc-log-count');
  if (badge) badge.textContent = log.length ? log.length : '';
}

export function _renderDocLog(doc) {
  const key = doc === 'context' ? 'context-log' : doc === 'htmlmap' ? 'html-map-log' : 'backlog-log';
  const body = document.getElementById('doc-log-body');
  if (!body) return;
  let log = [];
  try { log = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  if (!log.length) {
    body.innerHTML = '<div class="doc-log-empty">Sin acciones registradas.</div>';
    return;
  }
  const ACTION_ICONS = {
    creado: '✦', editado: '✎', 'status →': '→', descartado: '🗑', retroceso: '↓',
    'ckpt-creado': '✦', 'ckpt-avance': '→', 'ckpt-descarte': '🗑',
    importado: '↑', exportado: '⬇', mergeado: '⇌', 'sección mergeada': '⇌'
  };
  body.innerHTML = log.slice(0, 100).map(e => {
    const icon = ACTION_ICONS[e.action] || '·';
    return `<div class="doc-log-row">
      <span class="doc-log-ts">${_relTs(e.ts)}</span>
      <span class="doc-log-action">${icon} ${_esc(e.action)}</span>
      ${e.code ? `<span class="doc-log-code">${_esc(e.code)}</span>` : ''}
      ${e.detail ? `<span class="doc-log-detail">${_esc(e.detail)}</span>` : ''}
    </div>`;
  }).join('');
}

export function clearDocLog() {
  const drawer = document.getElementById('doc-log-drawer');
  const doc = drawer ? drawer.getAttribute('data-doc') : 'backlog';
  const key = doc === 'context' ? 'context-log' : doc === 'htmlmap' ? 'html-map-log' : 'backlog-log';
  try { localStorage.removeItem(key); } catch {}
  _renderDocLog(doc);
  // update count badge
  _updateDocLogCount(doc);
}


// ── Listeners — handlers migrados desde index.html (T-202605-056) ────────
document.addEventListener('DOMContentLoaded', () => {
  // Pendientes panel — overlay click + botón cerrar
  const pendOverlay = document.getElementById('pend-overlay');
  if (pendOverlay) pendOverlay.addEventListener('click', e => { if (e.target === pendOverlay) closePendPanel(); });
  const pendCloseBtn = document.getElementById('pend-close-btn');
  if (pendCloseBtn) pendCloseBtn.addEventListener('click', closePendPanel);

  // Standalone checkpoint — botón cancelar
  const ckptCancelBtn = document.getElementById('standalone-ckpt-cancel-btn');
  if (ckptCancelBtn) ckptCancelBtn.addEventListener('click', closeStandaloneCheckpoint);

  // Doc log drawer — limpiar y cerrar
  const docLogClearBtn = document.getElementById('doc-log-clear-btn');
  if (docLogClearBtn) docLogClearBtn.addEventListener('click', clearDocLog);
  const docLogCloseBtn = document.getElementById('doc-log-close-btn');
  if (docLogCloseBtn) docLogCloseBtn.addEventListener('click', closeDocLog);

  // T8: delegation tag-picker-list — toggleTagOnSession
  const tagPickerList = document.getElementById('tag-picker-list');
  if (tagPickerList) tagPickerList.addEventListener('click', e => {
    const row = e.target.closest('[data-action="toggle-tag"]');
    if (row) toggleTagOnSession(row.dataset.tagId);
  });

  // T8: delegation color-picker-row — selectColor
  const colorPickerRow = document.getElementById('color-picker-row');
  if (colorPickerRow) colorPickerRow.addEventListener('click', e => {
    const dot = e.target.closest('[data-action="select-color"]');
    if (dot) selectColor(Number(dot.dataset.colorIdx));
  });

  // T8: delegation pend-panel-body — closePendPanel + openDetail
  const pendPanelBody = document.getElementById('pend-panel-body');
  if (pendPanelBody) pendPanelBody.addEventListener('click', e => {
    const item = e.target.closest('[data-action="pend-open-detail"]');
    if (item) { closePendPanel(); openDetail(item.dataset.aiId, item.dataset.sessId); }
  });
});
// ─────────────────────────────────────────────────────────────────────────

// ── Search — extraído a locus-ui-shell.js ────────────────────────────────
// _searchScopeAll, _toggleSearchScope, onSearch
// ─────────────────────────────────────────────────────────────────────────

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
window._updateDocLogCount       = _updateDocLogCount;
window.openStandaloneCheckpoint = openStandaloneCheckpoint;
window.openPendPanel            = openPendPanel;
window.openDocLog               = openDocLog;
window.getCD                    = getCD;
window.closeStandaloneCheckpoint = closeStandaloneCheckpoint;
window.closePendPanel           = closePendPanel;
window._resetExpired            = _resetExpired;
window.getNextOccurrence        = getNextOccurrence;
window.clearDocLog              = clearDocLog;
window.openTagModal             = openTagModal;
window.renderTagPicker          = renderTagPicker;
window.renderColorPicker        = renderColorPicker;
window.selectColor              = selectColor;
window.toggleTagOnSession       = toggleTagOnSession;
window.addNewTag                = addNewTag;
window.closeDocLog              = closeDocLog;
