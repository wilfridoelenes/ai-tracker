// [PP] v1.2.3 · sprint:PP-S-09 · mod:1 · autor:Rune · 2026-05-28 UTC-6
// locus-modals.js
// Módulo: sistema de modal genérico y focus management
// Extraído de: ai-tracker-ai-notes.js (_gconfirmCb, _gconfirmOpen, _gconfirmClose, _gconfirmOk)
//              ai-tracker-checkpoint.js (_modalTriggerMap, _saveModalTrigger, _restoreModalFocus, _focusFirstInteractive)
// T-202605-030 Fase 1A: addEventListener para closeModal (add-modal, tag-modal) y
//              handlers de gconfirm-overlay (overlay-click, cancelar, ok, enter/escape en input)
//              Elimina inline onclick/onkeydown de index.html para estas funciones.
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

// ── addEventListener — T-202605-030 ──
// Reemplaza los inline onclick/onkeydown eliminados de index.html.
// Usa DOMContentLoaded para garantizar que los elementos existen al adjuntar.
document.addEventListener('DOMContentLoaded', () => {

  // closeModal('add-modal') — botón Cancelar en #add-modal
  const addModalCancel = document.querySelector('#add-modal .modal-actions button[type="button"]');
  if (addModalCancel) addModalCancel.addEventListener('click', () => closeModal('add-modal'));

  // closeModal('tag-modal') — botón Listo en #tag-modal
  const tagModalClose = document.querySelector('#tag-modal .modal-actions button[type="button"]');
  if (tagModalClose) tagModalClose.addEventListener('click', () => closeModal('tag-modal'));

  // gconfirm-overlay — click en backdrop cierra modal
  const gconfirmOverlay = document.getElementById('gconfirm-overlay');
  if (gconfirmOverlay) {
    gconfirmOverlay.addEventListener('click', (e) => {
      if (e.target === gconfirmOverlay) _gconfirmClose();
    });
  }

  // gconfirm-input — Enter confirma, Escape cancela
  const gconfirmInput = document.getElementById('gconfirm-input');
  if (gconfirmInput) {
    gconfirmInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _gconfirmOk();
      if (e.key === 'Escape') _gconfirmClose();
    });
  }

  // gconfirm-ok-btn — click confirma
  const gconfirmOkBtn = document.getElementById('gconfirm-ok-btn');
  if (gconfirmOkBtn) gconfirmOkBtn.addEventListener('click', _gconfirmOk);

  // gconfirm cancelar — botón Cancelar en .gconfirm-actions
  const gconfirmCancelBtn = document.querySelector('#gconfirm-overlay .gconfirm-actions button[type="button"]');
  if (gconfirmCancelBtn) gconfirmCancelBtn.addEventListener('click', _gconfirmClose);

});

// ── Exponer en window.* para callers externos (otros módulos JS) ──
window._gconfirmOpen  = _gconfirmOpen;
window._gconfirmClose = _gconfirmClose;
window._gconfirmOk    = _gconfirmOk;
window.closeModal     = closeModal;
window._saveModalTrigger     = _saveModalTrigger;
window._restoreModalFocus    = _restoreModalFocus;
window._focusFirstInteractive = _focusFirstInteractive;
