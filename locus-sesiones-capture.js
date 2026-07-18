// [PP] mod:18 · autor:Rune · 2026-07-17 15:40 UTC-6
// locus-sesiones-capture.js
// Responsabilidad: Quick Capture modal (stepper de 2 pasos) + Sesión interrumpida (T-055).
// Dependencias: locus-sesiones-stats.js · locus-storage.js · locus-toast.js
// T-202606-167: openProjPanel desacoplada — dispatch shell:open-proj-panel en lugar de import directo
import { showToast, toast } from './locus-toast.js';


import { _gconfirmOpen } from './locus-modals.js';

import { _horaUpdate, interpretHora } from './locus-session-hora.js';

import { getAI, getActiveProject, getState, save, saveImmediate } from './locus-storage.js';

import { esc, getCurrentTab } from './locus-ui-shell.js';

import { closeCardMenu, openAddAI } from './locus-workers.js';

// ── R-[pendiente-ID]: Quick Capture — modal unificado con stepper ──
// Reemplaza: T-071 (quick-modal-overlay) + selectAIForQuickCapture (ai-quick-select-modal)
// Shell HTML: #qc-modal-overlay con #qc-panel-1 (selector) y #qc-panel-2 (formulario)
// CSS: locus-modals-misc.css §qc- (corregido — el nombre anterior "locus-modals.css" es el monolito pre-split, ya no existe)

let _quickAIId = null;
let _qcStep = 0; // 0 = sin inicializar · 1 = paso 1 · 2 = paso 2
let _qcSaving = false; // TKT1 (CAEL-01): evita doble submit mientras saveImmediate() resuelve
let _qcRetryFn = null; // TKT1 (CAEL-01): reintenta el mismo intento de guardado sin reconstruir sess

// ── Helpers internos ──

function _qcEl(id) { return document.getElementById(id); }

// ── TKT1 (CAEL-01): estado de guardado — botón + campos ──
function _qcSetSavingState(loading) {
  const btn = _qcEl('qc-next-btn');
  const title = _qcEl('quick-title');
  const summary = _qcEl('quick-summary');
  const hora = _qcEl('quick-hora');
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.innerHTML = '<span class="qc-spinner" aria-hidden="true"></span>Guardando…';
    [title, summary, hora].forEach(el => { if (el) el.disabled = true; });
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
    btn.textContent = 'Guardar';
    [title, summary, hora].forEach(el => { if (el) el.disabled = false; });
  }
}

// ── TKT1 (CAEL-01): banner de error de guardado ──
function _qcShowError(msg) {
  const banner = _qcEl('qc-error-banner');
  const msgEl = _qcEl('qc-error-msg');
  if (!banner || !msgEl) return;
  msgEl.textContent = msg;
  banner.classList.remove('is-hidden');
}

function _qcHideError() {
  const banner = _qcEl('qc-error-banner');
  if (banner) banner.classList.add('is-hidden');
}

// AC-10: transición entre pasos via .hidden — sin style.display (CSS Purity H-01/H-02)
function _qcSetStep(step) {
  _qcStep = step;
  const panel1 = _qcEl('qc-panel-1');
  const panel2 = _qcEl('qc-panel-2');
  const dot1   = _qcEl('qc-dot-1');
  const dot2   = _qcEl('qc-dot-2');
  const stepper = _qcEl('qc-stepper');
  const backBtn = _qcEl('qc-back-btn');
  const nextBtn = _qcEl('qc-next-btn');

  if (step === 1) {
    panel1.classList.remove('is-hidden');
    panel2.classList.add('is-hidden');
    dot1.classList.add('qc-dot--active');
    dot2.classList.remove('qc-dot--active');
    stepper.setAttribute('aria-label', 'Paso 1 de 2');
    backBtn.textContent = 'Cancelar';
    nextBtn.textContent = 'Continuar';
    nextBtn.disabled = !_qcEl('qc-worker-list').querySelector('.qc-worker-item--selected');
  } else {
    panel1.classList.add('is-hidden');
    panel2.classList.remove('is-hidden');
    dot1.classList.remove('qc-dot--active');
    dot2.classList.add('qc-dot--active');
    stepper.setAttribute('aria-label', 'Paso 2 de 2');
    backBtn.textContent = 'Atrás';
    nextBtn.textContent = 'Guardar';
    nextBtn.disabled = false;
    // AC-11: foco al primer elemento interactivo del Paso 2
    setTimeout(() => { const qt = _qcEl('quick-title'); if (qt) qt.focus(); }, 60);
  }
}

// Inyecta lista de Workers en Paso 1 — genera qc-worker-item por cada Worker activo
// TKT2 (CAEL-01): si no hay Workers disponibles, reemplaza el contenido por el empty state
function _qcRenderWorkerList() {
  const list = _qcEl('qc-worker-list');
  if (!list) return;
  const available = (getState().ais || []).filter(a => !a.archived);
  if (available.length === 0) {
    list.innerHTML = `
      <div class="qc-empty">
        <p class="qc-empty-title">No hay Workers registrados</p>
        <p class="qc-empty-hint">Crea uno para poder registrar una sesión.</p>
        <button class="btn-primary" id="qc-empty-cta" type="button">Crear Worker</button>
      </div>
    `;
    return;
  }
  list.innerHTML = available.map(ai => `
    <button class="qc-worker-item" data-worker-id="${esc(ai.id)}">
      <span class="qc-worker-avatar">${esc((ai.sigla || ai.name || '?').slice(0,2).toUpperCase())}</span>
      <span class="qc-worker-name">${esc(ai.name)}</span>
      <span class="qc-worker-check is-hidden">✓</span>
    </button>
  `).join('');
}

// ── API pública ──

// AC-03/04/05: abre modal — con id salta Paso 1 (skip), sin id muestra selector
export function openQuickCapture(id) {
  const overlay = _qcEl('qc-modal-overlay');
  if (!overlay) return;

  // Limpiar estado previo
  _quickAIId = null;
  _qcStep = 0;
  _qcSaving = false;
  _qcRetryFn = null;
  _qcHideError();
  _qcSetSavingState(false);
  _qcEl('quick-title').value = '';
  _qcEl('quick-summary').value = '';
  _qcEl('quick-hora').value = '';
  _qcEl('quick-hora-disp').textContent = 'hora de desbloqueo (opcional)';

  const available = (getState().ais || []).filter(a => !a.archived);

  if (id) {
    // Llamado directo con Worker conocido — skip Paso 1 (AC-05)
    _quickAIId = id;
    _qcEl('qc-stepper').classList.add('is-hidden'); // sin stepper en skip
    _qcEl('qc-worker-chip-name').textContent = (getAI(id) || {}).name || id;
    overlay.classList.add('open');
    _qcSetStep(2);
  } else if (available.length === 1) {
    // AC-05: un solo Worker — skip Paso 1 directamente
    _quickAIId = available[0].id;
    _qcEl('qc-stepper').classList.add('is-hidden');
    _qcEl('qc-worker-chip-name').textContent = available[0].name;
    overlay.classList.add('open');
    _qcSetStep(2);
  } else {
    // Múltiples Workers — mostrar Paso 1
    _qcEl('qc-stepper').classList.remove('is-hidden');
    _qcRenderWorkerList();
    overlay.classList.add('open');
    _qcSetStep(1);
  }
}

// AC-04: selección de Worker en Paso 1
function qcSelectWorker(el) {
  _qcEl('qc-worker-list').querySelectorAll('.qc-worker-item').forEach(item => {
    item.classList.remove('qc-worker-item--selected');
    item.querySelector('.qc-worker-check').classList.add('is-hidden');
  });
  el.classList.add('qc-worker-item--selected');
  el.querySelector('.qc-worker-check').classList.remove('is-hidden');
  _quickAIId = el.dataset.workerId;
  _qcEl('qc-next-btn').disabled = false;
}

// Botón Continuar / Guardar
function qcHandleNext() {
  if (_qcStep === 1) {
    if (!_quickAIId) return;
    _qcEl('qc-worker-chip-name').textContent = (getAI(_quickAIId) || {}).name || _quickAIId;
    _qcSetStep(2);
  } else {
    confirmQuickCapture();
  }
}

// Botón Cancelar / Atrás
function qcHandleBack() {
  if (_qcStep === 2 && _qcEl('qc-stepper') && !_qcEl('qc-stepper').classList.contains('is-hidden')) {
    // En Paso 2 con stepper visible → volver a Paso 1
    _quickAIId = null;
    _qcSetStep(1);
  } else {
    closeQuickCapture();
  }
}

// Cierra el modal y limpia estado
export function closeQuickCapture(e) {
  if (e && e.target !== _qcEl('qc-modal-overlay')) return;
  _qcEl('qc-modal-overlay').classList.remove('open');
  _quickAIId = null;
  _qcStep = 0;
}

// Alias legacy — closeQuickModal referenciado en cascade Escape y quickTitleKey
function closeQuickModal(e) { closeQuickCapture(e); }

// T-202605-430: usa _horaUpdate — feedback visual completo igual que la referencia
function quickParseHora() {
  const inp = _qcEl('quick-hora');
  const disp = _qcEl('quick-hora-disp');
  if (inp && !inp.value.replace(/\D/g, '')) {
    if (disp) { disp.textContent = 'hora de desbloqueo (opcional)'; disp.className = 'hora-disp--hint'; }
    return;
  }
  _horaUpdate(inp, disp);
}

function quickTitleKey(e) {
  if (e.key === 'Enter') { e.preventDefault(); confirmQuickCapture(); }
  if (e.key === 'Escape') { closeQuickCapture(); }
}

function confirmQuickCapture() {
  if (_qcSaving) return;
  if (!_quickAIId) return;
  const title = _qcEl('quick-title').value.trim();
  if (!title) {
    _qcEl('quick-title').focus();
    const _qt = _qcEl('quick-title');
    if (_qt) { _qt.classList.add('input-border-error'); setTimeout(() => _qt.classList.remove('input-border-error'), 1200); }
    return;
  }
  _qcHideError();
  const summary = _qcEl('quick-summary').value.trim();
  const horaRaw = _qcEl('quick-hora').value.replace(/\D/g,'');
  const horaResult = horaRaw ? interpretHora(horaRaw) : null;

  const ai = getAI(_quickAIId);
  const now = new Date();
  const sess = {
    id: 'sess-' + Date.now(),
    title,
    summary,
    files: '',
    pending: '',
    tags: [],
    trackerRefs: [],
    starred: false,
    quickCapture: true,
    resetAt: horaResult ? horaResult.hhmm : '',
    dateShort: now.toLocaleDateString('es-MX', {day:'2-digit',month:'short'}),
    date: now.toISOString(),
    // R-202605-049 AC-3: sesión rápida genera sessionGroupId propio — siempre grupo de un solo checkpoint
    sessionGroupId: 'sg-' + Date.now()
  };

  // v3: sesión va al proyecto activo con aiId
  sess.aiId = _quickAIId;
  const activeProj = getActiveProject();
  if (!activeProj) {
    showToast('warning', '⚠ Selecciona un proyecto antes de guardar la sesión');
    window.dispatchEvent(new CustomEvent('shell:open-proj-panel')); // T-202606-167
    return;
  }
  if (!activeProj.sessions) activeProj.sessions = [];
  activeProj.sessions.push(sess);

  if (horaResult) {
    // T-089: solo cambiar status a exhausted si estaba disponible
    if (ai.status === 'available') ai.status = 'exhausted';
    ai.resetTime = horaResult.hhmm;
    ai.resetEpoch = horaResult.epoch;
  }

  // TKT1 (CAEL-01): sess ya está en activeProj.sessions — el retry reintenta saveImmediate()
  // sobre el mismo estado, sin reconstruir ni duplicar el objeto sess.
  _qcAttemptSave(ai);
}

// TKT1 (CAEL-01): intento de guardado real — separado de confirmQuickCapture() para que
// Reintentar reinvoque saveImmediate() sin reconstruir sess (evita push duplicado).
function _qcAttemptSave(ai) {
  _qcSaving = true;
  _qcSetSavingState(true);
  // B-202605-XXX: usar saveImmediate() para garantizar escritura en Supabase antes de
  // cualquier recarga. save() con debounce de 5s podía perder resetTime/resetEpoch/status
  // si el usuario recargaba la tab antes de que el timer disparara.
  saveImmediate().then(() => {
    _qcSaving = false;
    _qcRetryFn = null;
    // AC edge case: si el usuario cerró el modal manualmente mientras guardaba, no reabrir
    // ni mostrar el toast final — el guardado ya completó, solo faltaba el feedback visual.
    const stillOpen = _qcEl('qc-modal-overlay').classList.contains('open');
    if (stillOpen) {
      closeQuickCapture();
      showToast('success', `${ai.name} — sesión rápida guardada`);
    }
    window.dispatchEvent(new CustomEvent('shell:render-tracker'));
    // TKT1 [pendiente-ID]: auto-selección del Worker usado en Quick Capture si el founder
    // está en tab Sesiones — reutiliza shell:select-tracker-ai (locus-sesiones.js), mismo
    // patrón de evento que shell:sesiones-render, sin import directo.
    if (getCurrentTab() === 'sesiones') {
      window.dispatchEvent(new CustomEvent('shell:sesiones-render'));
      window.dispatchEvent(new CustomEvent('shell:select-tracker-ai', { detail: { aiId: ai.id } }));
    }
  }).catch(() => {
    _qcSaving = false;
    _qcSetSavingState(false);
    _qcShowError('No se pudo guardar. Revisa tu conexión.');
    _qcRetryFn = () => _qcAttemptSave(ai);
  });
}

// ── END R-[pendiente-ID] Quick Capture ──

// ── T-055: Sesión interrumpida ──
// T-093: confirmación inline dentro del dropdown antes de interrumpir
export function confirmInterruptInline(id, triggerBtn) {
  const dropdown = document.getElementById('dotmenu-' + id);
  if (!dropdown) return;
  // Si ya hay un confirm-row, no duplicar
  if (dropdown.querySelector('.dot-confirm-row')) return;
  // Ocultar el botón trigger
  triggerBtn.classList.add('is-hidden');
  const row = document.createElement('div');
  row.className = 'dot-confirm-row';
  row.innerHTML = `<span class="dot-confirm-label">⚡ ¿Interrumpir?</span>
    <button class="dot-confirm-cancel">No</button>
    <button class="dot-confirm-ok">Sí</button>`;
  triggerBtn.after(row);
  // Delegación en dropdown — evita onclick inline en innerHTML dinámico (T-202605-033 + B-202605-017).
  dropdown.addEventListener('click', function _dotConfirmHandler(e) {
    if (e.target.classList.contains('dot-confirm-cancel')) {
      cancelInterruptInline(id);
      dropdown.removeEventListener('click', _dotConfirmHandler);
    } else if (e.target.classList.contains('dot-confirm-ok')) {
      closeCardMenu(id);
      interruptSession(id);
      dropdown.removeEventListener('click', _dotConfirmHandler);
    }
  });
}

function cancelInterruptInline(id) {
  const dropdown = document.getElementById('dotmenu-' + id);
  if (!dropdown) return;
  const row = dropdown.querySelector('.dot-confirm-row');
  if (row) row.remove();
  const btn = dropdown.querySelector('[data-action="interrupt"]');
  if (btn) btn.classList.remove('is-hidden');
}

function interruptSession(id) {
  const ai = getAI(id);
  _gconfirmOpen({
    title: `Marcar sesión interrumpida`,
    msg: `"${ai.name}" pasará a estado agotado.`,
    okLabel: 'Confirmar',
    danger: false,
    inputLabel: 'Hora de reset (opcional)',
    inputPlaceholder: '--:--'
  }, (horaRaw) => {
    const horaResult = horaRaw ? interpretHora(horaRaw.replace(/\D/g,'')) : null;
    ai.status = 'exhausted';
    ai.interrupted = true;
    if (horaResult) { ai.resetTime = horaResult.hhmm; ai.resetEpoch = horaResult.epoch; }
    // R-202604-061 AC-2: clase transitoria antes de interrupted-state
    const _intCard = document.getElementById('card-' + id);
    if (_intCard) _intCard.classList.add('tracker-card--interrupting');
    setTimeout(() => {
      save(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
      if (getCurrentTab() === 'sesiones') window.dispatchEvent(new CustomEvent('shell:sesiones-render'));
    }, 200);
    showToast('info', `${ai.name} — sesión interrumpida`);
  });
}

export function dismissInterrupted(id) {
  const ai = getAI(id);
  ai.interrupted = false;
  save(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
  if (getCurrentTab() === 'sesiones') window.dispatchEvent(new CustomEvent('shell:sesiones-render'));
}

// T-058 ya maneja auto-disponible; al desbloquearse, si tenía interrupted, lo conservamos
// Solo limpiamos interrupted cuando el usuario hace click en "Continuar →"

// T-056: Focus Zone — eliminada (deprecada)

// ── T-202605-031: Migración handlers on* → addEventListener ──
// Handlers de locus-sesiones-capture eliminados de index.html — se bindean aquí via DOMContentLoaded.
// qc-worker-list usa delegación — los items son generados dinámicamente por _qcRenderWorkerList.
document.addEventListener('DOMContentLoaded', () => {
  // qc-modal-overlay → closeQuickCapture con event (click fuera del panel)
  const qcOverlay = document.getElementById('qc-modal-overlay');
  if (qcOverlay) qcOverlay.addEventListener('click', closeQuickCapture);

  // qc-close-btn → closeQuickCapture sin event
  const qcCloseBtn = document.getElementById('qc-close-btn');
  if (qcCloseBtn) qcCloseBtn.addEventListener('click', () => closeQuickCapture());

  // qc-worker-list → delegación para qc-worker-item (generados dinámicamente)
  // TKT2 (CAEL-01): también delega #qc-empty-cta cuando la lista renderiza el empty state
  const qcWorkerList = document.getElementById('qc-worker-list');
  if (qcWorkerList) qcWorkerList.addEventListener('click', (e) => {
    const item = e.target.closest('.qc-worker-item');
    if (item) { qcSelectWorker(item); return; }
    const cta = e.target.closest('#qc-empty-cta');
    if (cta) { closeQuickCapture(); openAddAI(); }
  });

  // qc-error-retry-btn → reintenta el mismo intento de guardado (TKT1 CAEL-01)
  const qcErrorRetryBtn = document.getElementById('qc-error-retry-btn');
  if (qcErrorRetryBtn) qcErrorRetryBtn.addEventListener('click', () => { if (_qcRetryFn) _qcRetryFn(); });

  // quick-title → quickTitleKey (onkeydown)
  const quickTitle = document.getElementById('quick-title');
  if (quickTitle) quickTitle.addEventListener('keydown', quickTitleKey);

  // quick-hora → quickParseHora (oninput) + confirmQuickCapture en Enter (onkeydown)
  const quickHora = document.getElementById('quick-hora');
  if (quickHora) {
    quickHora.addEventListener('input', quickParseHora);
    quickHora.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmQuickCapture(); });
  }

  // qc-back-btn → qcHandleBack
  const qcBackBtn = document.getElementById('qc-back-btn');
  if (qcBackBtn) qcBackBtn.addEventListener('click', qcHandleBack);

  // qc-next-btn → qcHandleNext
  const qcNextBtn = document.getElementById('qc-next-btn');
  if (qcNextBtn) qcNextBtn.addEventListener('click', qcHandleNext);
});
// ── END T-202605-031 locus-sesiones-capture ──
