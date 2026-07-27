// [PP] mod:7 · autor:Rune · 2026-07-27 UTC-6
// Fix de esta sesión (auditoría E2E modal de ingesta, hallazgo #1): ingestModalClose cerraba
// #modal-split-shell sin limpiar el estado del panel DIFF (locus-backlog-merge.js) — a
// diferencia de Cancelar/Escape dentro del panel, dejaba _mdiffKeyHandler vivo en document.
// Fix: llama teardownMergeDiffPanel() (nuevo export, mod:70 de locus-backlog-merge.js) antes
// de cerrar el shell — idempotente, no-op si el panel DIFF no estaba abierto. Import circular
// con locus-backlog-merge.js (que ya importa _gconfirmOpen de este módulo) — seguro: ninguna
// de las dos funciones se invoca en top-level de su módulo, ambas corren dentro de callbacks
// de evento, después de que el grafo de módulos ya resolvió. contract_update: n/a — este
// módulo no expone contract_detail, solo consume el export nuevo.
// [PP] mod:6 · autor:Rune · 2026-07-26 UTC-6
// TKT2 (TKT-202607-145, REQ-202607-046 split_view_merged_shell): ingestModalClose
// (#ingest-modal-close-btn) todavía cerraba vía la cascada docked (AC4 de CAEL-0716-01
// TKT2) — mdiff-overlay--docked ya no se asigna en ningún archivo del codebase desde
// TKT1/TKT2 (Opción A, merge completo). El handler ahora cierra directamente
// #modal-split-shell, único nodo con backdrop/estado open real. Sin cambio de AC en
// closeModal() ni en el resto del módulo.
// [PP] mod:5 · autor:Rune · 2026-07-25 UTC-6
// TKT-202607-113: _gconfirmOpen() no gestionaba foco ni teclado de forma genérica —
//   Enter/Escape solo funcionaban cuando había inputLabel (listener propio de #gconfirm-input).
//   Sin input, el modal no tenía foco inicial ni respuesta a teclado. Se agrega: foco automático
//   en #gconfirm-ok-btn cuando no hay inputLabel, y un listener global en document que consolida
//   Enter/Escape para todos los casos — reemplaza el listener específico de #gconfirm-input para
//   evitar doble invocación. Guard: Enter con foco dentro de #gconfirm-body-html (ej. <select> de
//   razón de descarte en _confirmDiscard, locus-backlog-merge.js) NO confirma — solo Escape cierra
//   y el usuario debe usar el botón OK explícitamente.
// [PP] mod:4 · autor:Rune · 2026-07-19 15:00 UTC-6
// INC-PP-gconfirm-bodyHtml: _gconfirmOpen() recibía `bodyHtml` de sus callers (_openStatusConfirm en
//   locus-backlog-merge.js, y ahora _showExportConfirmModal en locus-backlog-generator.js) sin
//   destructurarlo ni renderizarlo en #gconfirm-body-html (contenedor insertado en index.html por
//   REQ CAEL-0720-01 TKT1, nunca conectado en este módulo). Efecto: el modal abría con título/msg
//   pero el contenido HTML pasado por bodyHtml no se veía nunca — para el caso de export, la falta
//   total de #export-confirm-overlay (retirado en la misma REQ) hacía que ni el modal abriera.
// [PP] mod:3 · autor:Rune · 2026-07-17 11:20 UTC-6
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

// Fix de esta sesión: limpieza del panel DIFF al cerrar el shell con × — ver mod:7 arriba.
import { teardownMergeDiffPanel } from './locus-backlog-merge.js';

// ── Generic confirm/prompt modal (T-090) ──
// _gconfirmCb: interno del módulo — no expuesto públicamente
let _gconfirmCb = null;

export function _gconfirmOpen({ title, msg, okLabel = 'Confirmar', danger = true, inputLabel = null, inputPlaceholder = '', bodyHtml = null }, cb) {
  _gconfirmCb = cb;
  document.getElementById('gconfirm-title').textContent = title;
  document.getElementById('gconfirm-msg').textContent = msg;
  // INC-PP-gconfirm-bodyHtml: contenedor #gconfirm-body-html insertado en index.html (REQ CAEL-0720-01
  // TKT1) pero nunca poblado ni mostrado aquí — bodyHtml llegaba de los callers (_openStatusConfirm)
  // sin efecto visible. Se agrega el mismo mecanismo de toggle que el resto del modal.
  const bodyHtmlEl = document.getElementById('gconfirm-body-html');
  if (bodyHtmlEl) {
    if (bodyHtml) {
      bodyHtmlEl.innerHTML = bodyHtml;
      bodyHtmlEl.classList.remove('is-hidden');
    } else {
      bodyHtmlEl.innerHTML = '';
      bodyHtmlEl.classList.add('is-hidden');
    }
  }
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
    // TKT-202607-113: sin inputLabel, el foco inicial va al botón OK — mismo patrón de
    // timing (60ms) ya usado para el input, consistente con el resto del módulo.
    setTimeout(() => okBtn.focus(), 60);
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

  // TKT2 (TKT-202607-145, Rune): la cascada docked (INC-ingest-modal-close-unwired /
  // AC4 de CAEL-0716-01 TKT2) queda retirada — mdiff-overlay--docked no vuelve a asignarse
  // en ningún punto del codebase (0 coincidencias verificadas, ver locus-sesiones.js mod:56
  // y locus-backlog-merge.js mod:69). #ingest-modal-overlay y #merge-diff-overlay ya no
  // gestionan su propio 'open' desde TKT1 (split_view_merged_shell, Opción A) —
  // #modal-split-shell es hoy el único nodo con backdrop/estado open real. closeModal()
  // sobre el id anterior quedaba inerte; este botón cierra directamente el shell compartido.
  const ingestModalClose = document.getElementById('ingest-modal-close-btn');
  if (ingestModalClose) {
    ingestModalClose.addEventListener('click', () => {
      // Fix de esta sesión: limpia el panel DIFF (keydown listener, storage:item-excluded,
      // estado _mdiff*, onClose del caller) antes de cerrar el shell — no-op si el panel DIFF
      // no estaba abierto (columna de ingesta sola, sin batch procesado).
      teardownMergeDiffPanel();
      const shell = document.getElementById('modal-split-shell');
      if (shell) shell.classList.remove('open');
      _restoreModalFocus('modal-split-shell');
    });
  }

  const gconfirmOverlay = document.getElementById('gconfirm-overlay');
  if (gconfirmOverlay) {
    gconfirmOverlay.addEventListener('click', (e) => {
      if (e.target === gconfirmOverlay) _gconfirmClose();
    });
  }

  // TKT-202607-113: listener global consolidado — reemplaza el listener específico que
  // antes vivía solo en #gconfirm-input. Cubre Enter/Escape para cualquier estado del modal
  // (sin input, con input, con bodyHtml) desde una sola fuente — evita doble invocación.
  document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('gconfirm-overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    if (e.key === 'Escape') {
      _gconfirmClose();
      return;
    }
    if (e.key === 'Enter') {
      const bodyHtmlEl = document.getElementById('gconfirm-body-html');
      const okBtn = document.getElementById('gconfirm-ok-btn');
      const focusedInBodyHtml = bodyHtmlEl && !bodyHtmlEl.classList.contains('is-hidden')
        && e.target !== okBtn && bodyHtmlEl.contains(e.target);
      // Guard: Enter con foco en un campo propio de bodyHtml (ej. <select> de razón de
      // descarte) no confirma — previene descartes accidentales antes de elegir razón.
      if (focusedInBodyHtml) return;
      _gconfirmOk();
    }
  });

  const gconfirmOkBtn = document.getElementById('gconfirm-ok-btn');
  if (gconfirmOkBtn) gconfirmOkBtn.addEventListener('click', _gconfirmOk);

  const gconfirmCancelBtn = document.getElementById('gconfirm-cancel-btn');
  if (gconfirmCancelBtn) gconfirmCancelBtn.addEventListener('click', _gconfirmClose);

  // T-202606-077: registrar _gconfirmOpen en _coreCallbacks
  // locus-backlog-core lo consume para confirms de discard y retroceso de ítems.
  _registerCoreCallback('gconfirmOpen', _gconfirmOpen);

});

// ── window.* — para callers externos que aún no usan import ──────────────────
