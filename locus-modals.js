// [PP] v1.0.0 · sprint:PP-S-01 · mod:1 · autor:Rune · 2026-06-11 07:00 UTC-6
// locus-modals.js
// Módulo: sistema de modal genérico y focus management
// Extraído de: ai-tracker-ai-notes.js (_gconfirmCb, _gconfirmOpen, _gconfirmClose, _gconfirmOk)
//              ai-tracker-checkpoint.js (_modalTriggerMap, _saveModalTrigger, _restoreModalFocus, _focusFirstInteractive)
// T-202605-030 Fase 1A: addEventListener para closeModal (add-modal, tag-modal) y
//              handlers de gconfirm-overlay (overlay-click, cancelar, ok, enter/escape en input)
//              Elimina inline onclick/onkeydown de index.html para estas funciones.
// Carga antes de: ai-tracker-checkpoint.js, ai-tracker-ai-notes.js

// T-202606-077: registrar _gconfirmOpen en _coreCallbacks
import { _registerCoreCallback } from './locus-backlog-core.js';

// ── Generic confirm/prompt modal (T-090) ──
// _gconfirmCb: interno del módulo — no expuesto públicamente
let _gconfirmCb = null;

export function _gconfirmOpen({ title, msg, okLabel = 'Confirmar', danger = true, inputLabel = null, inputPlaceholder = '' }, cb) {
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

export function _gconfirmClose() {
  document.getElementById('gconfirm-overlay').classList.remove('open');
  _gconfirmCb = null;
}

export function _gconfirmOk() {
  const inputWrap = document.getElementById('gconfirm-input-wrap');
  const val = !inputWrap.classList.contains('is-hidden') ? document.getElementById('gconfirm-input').value.trim() : null;
  document.getElementById('gconfirm-overlay').classList.remove('open');
  if (_gconfirmCb) { const cb = _gconfirmCb; _gconfirmCb = null; cb(val); }
}

// ── Focus management ──
const _modalTriggerMap = new Map(); // modal id → elemento que tenía foco antes de abrir

export function _saveModalTrigger(id) {
  const active = document.activeElement;
  if (active && active !== document.body) _modalTriggerMap.set(id, active);
}

export function _restoreModalFocus(id) {
  const trigger = _modalTriggerMap.get(id);
  if (trigger && typeof trigger.focus === 'function') {
    try { trigger.focus(); } catch(_) {}
  }
  _modalTriggerMap.delete(id);
}

export function _focusFirstInteractive(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const sel = 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])';
  const el = container.querySelector(sel);
  if (el) setTimeout(() => el.focus(), 50);
}

// ── closeModal ──
export function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  _restoreModalFocus(id);
}

// ── addEventListener — T-202605-030 ──
document.addEventListener('DOMContentLoaded', () => {

  const addModalCancel = document.getElementById('add-modal-cancel');
  if (addModalCancel) addModalCancel.addEventListener('click', () => closeModal('add-modal'));

  const tagModalClose = document.getElementById('tag-modal-close');
  if (tagModalClose) tagModalClose.addEventListener('click', () => closeModal('tag-modal'));

  const gconfirmOverlay = document.getElementById('gconfirm-overlay');
  if (gconfirmOverlay) {
    gconfirmOverlay.addEventListener('click', (e) => {
      if (e.target === gconfirmOverlay) _gconfirmClose();
    });
  }

  const gconfirmInput = document.getElementById('gconfirm-input');
  if (gconfirmInput) {
    gconfirmInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _gconfirmOk();
      if (e.key === 'Escape') _gconfirmClose();
    });
  }

  const gconfirmOkBtn = document.getElementById('gconfirm-ok-btn');
  if (gconfirmOkBtn) gconfirmOkBtn.addEventListener('click', _gconfirmOk);

  const gconfirmCancelBtn = document.getElementById('gconfirm-cancel-btn');
  if (gconfirmCancelBtn) gconfirmCancelBtn.addEventListener('click', _gconfirmClose);

  // T-202606-077: registrar _gconfirmOpen en _coreCallbacks
  // locus-backlog-core lo consume para confirms de discard y retroceso de ítems.
  _registerCoreCallback('gconfirmOpen', _gconfirmOpen);

});

// ── window.* — para callers externos que aún no usan import ──────────────────
