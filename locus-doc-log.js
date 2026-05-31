// [PP] v1.2.4 · sprint:PP-S-12 · mod:1 · autor:Rune · 2026-05-30 UTC-6
// locus-doc-log.js
// Módulo: Doc Activity Log — openDocLog · closeDocLog · _updateDocLogCount · _renderDocLog · clearDocLog
// Migrado desde locus-misc-ui.js (T-202605-074)

import { _restoreModalFocus } from './locus-modals.js';
import { esc } from './locus-ui-shell.js';

const _esc = (s) => esc(s);
const _relTs = (ts) => window._relTs ? window._relTs(ts) : '';

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
  _updateDocLogCount(doc);
}

// ── Listeners ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Doc log drawer — limpiar y cerrar
  const docLogClearBtn = document.getElementById('doc-log-clear-btn');
  if (docLogClearBtn) docLogClearBtn.addEventListener('click', clearDocLog);
  const docLogCloseBtn = document.getElementById('doc-log-close-btn');
  if (docLogCloseBtn) docLogCloseBtn.addEventListener('click', closeDocLog);
});
// ─────────────────────────────────────────────────────────────────────────

// ── Exposición pública ───────────────────────────────────────────────────
window._updateDocLogCount = _updateDocLogCount;
window.openDocLog         = openDocLog;
window.clearDocLog        = clearDocLog;
window.closeDocLog        = closeDocLog;
