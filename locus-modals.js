// locus-modals.js
// Módulo: sistema de modal genérico y focus management
// Extraído de: ai-tracker-ai-notes.js (_gconfirmCb, _gconfirmOpen, _gconfirmClose, _gconfirmOk)
//              ai-tracker-checkpoint.js (_modalTriggerMap, _saveModalTrigger, _restoreModalFocus, _focusFirstInteractive)
// Carga antes de: ai-tracker-checkpoint.js, ai-tracker-ai-notes.js

// ── Generic confirm/prompt modal (T-090) ──
// _gconfirmCb: interno del módulo — no expuesto en window.*
let _gconfirmCb = null;

function _gconfirmOpen({ title, msg, okLabel = 'Confirmar', danger = true, inputLabel = null, inputPlaceholder = '' }, cb) {
  _gconfirmCb = cb;
  document.getElementById('gconfirm-title').textContent = title;
  document.getElementById('gconfirm-msg').textContent = msg;
  const okBtn = document.getElementById('gconfirm-ok-btn');
  okBtn.textContent = okLabel;
  okBtn.className = 'btn-primary' + (danger ? ' danger' : '');
  const wrap = document.getElementById('gconfirm-input-wrap');
  if (inputLabel) {
    wrap.classList.remove('is-hidden');
    document.getElementById('gconfirm-input-label').textContent = inputLabel;
    const inp = document.getElementById('gconfirm-input');
    inp.placeholder = inputPlaceholder;
    inp.value = '';
    setTimeout(() => inp.focus(), 60);
  } else {
    wrap.classList.add('is-hidden');
  }
  document.getElementById('gconfirm-overlay').classList.add('open');
}

function _gconfirmClose() {
  document.getElementById('gconfirm-overlay').classList.remove('open');
  _gconfirmCb = null;
}

function _gconfirmOk() {
  const inputWrap = document.getElementById('gconfirm-input-wrap');
  const val = !inputWrap.classList.contains('is-hidden') ? document.getElementById('gconfirm-input').value.trim() : null;
  document.getElementById('gconfirm-overlay').classList.remove('open');
  if (_gconfirmCb) { const cb = _gconfirmCb; _gconfirmCb = null; cb(val); }
}

// ── Focus management ──
const _modalTriggerMap = new Map(); // modal id → elemento que tenía foco antes de abrir

function _saveModalTrigger(id) {
  const active = document.activeElement;
  if (active && active !== document.body) _modalTriggerMap.set(id, active);
}

function _restoreModalFocus(id) {
  const trigger = _modalTriggerMap.get(id);
  if (trigger && typeof trigger.focus === 'function') {
    try { trigger.focus(); } catch(_) {}
  }
  _modalTriggerMap.delete(id);
}

function _focusFirstInteractive(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const sel = 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])';
  const el = container.querySelector(sel);
  if (el) setTimeout(() => el.focus(), 50);
}

// ── closeModal ──
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus(id);
}

// ── Window fallback para inline handlers de index.html ──
// Garantiza que _gconfirmClose, _gconfirmOk y closeModal existen en window aunque el módulo falle al cargar.
// Los inline onclick en index.html (L822, L828, L831, L832) no pueden usar guard typeof —
// este fallback evita ReferenceError si locus-modals.js no cargó.
// closeModal tiene callers inline en index.html (L648, L679).
window._gconfirmClose = window._gconfirmClose || function() {};
window._gconfirmOk    = window._gconfirmOk    || function() {};
window.closeModal     = window.closeModal     || function() {};
