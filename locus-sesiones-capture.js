// [PP] mod:22 · autor:Rune · 2026-08-08 15:40 UTC-6
// TKT2 (parent CAEL-08081500-01, ref_id CAEL-08081500-03): openQuickCapture() valida proyecto
// activo al abrir (antes solo confirmQuickCapture() lo hacía, al final). ai.status/resetTime/
// resetEpoch e interruptSession() se aplican dentro del .then() de _qcAttemptSave, no antes de
// guardar — sess.push sigue precediendo al guardado (excepción ya documentada, sin cambio).
// Cierra Hallazgo A-10 / Patrón A-10 de _Locus-ux-ref.
// TKT2 (REQ CAEL-08061000-01): confirmQuickCapture bloquea el guardado cuando
// interpretHora(horaRaw).withinResetWindow es false — mismo criterio de ventana
// máxima de 5h que _horaUpdate ya aplica visualmente. Reutiliza el patrón de error
// ya usado para título vacío (input-border-error), sin componente nuevo.
// TKT-202607-213 (REQ-202607-083): shell:open-proj-panel → switchTab('proyectos') — proj-panel
// overlay retirado, sin cambio de comportamiento observable (mismo destino: tab Proyectos).
// locus-sesiones-capture.js
// Responsabilidad: Quick Capture modal (stepper de 2 pasos) + estado de WIP (interrupted, T-055).
// Dependencias: locus-sesiones-stats.js · locus-storage.js · locus-toast.js
// TKT1/TKT3 (CAEL-0723-02/04): checkbox #quick-wip cableado en confirmQuickCapture() →
// interruptSession(id). confirmInterruptInline/cancelInterruptInline retiradas (huérfanas,
// dot-menu 'Interrumpir' eliminado — ver locus-sesiones.js mod:53). interruptSession()
// simplificada a mutador puro (sin _gconfirmOpen anidado ni save/toast propios). Imports
// huérfanos _gconfirmOpen/closeCardMenu retirados.
// TKT-202607-213: proj-panel overlay retirado — switchTab('proyectos') reemplaza el dispatch
// shell:open-proj-panel de T-202606-167 (openProjPanel/openProjModal ya no existen)
import { showToast, toast } from './locus-toast.js';


import { _horaUpdate, interpretHora } from './locus-session-hora.js';

import { getAI, getActiveProject, getState, save, saveImmediate } from './locus-storage.js';

import { esc, getCurrentTab, switchTab } from './locus-ui-shell.js';

import { openAddAI } from './locus-workers.js';

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

  // TKT2 (parent CAEL-08081500-01, ver _Locus-ux-ref Patrón A-10): proyecto activo es una
  // precondición evaluable antes de que el founder escriba nada — se comprueba al abrir, no
  // al confirmar. Antes, confirmQuickCapture() la comprobaba después de título/resumen/hora/WIP
  // ya cargados, invirtiendo ese trabajo si fallaba. Mismo mensaje y mismo destino que ya se
  // usaban en el chequeo tardío retirado.
  if (!getActiveProject()) {
    showToast('warning', '⚠ Selecciona un proyecto antes de guardar la sesión');
    switchTab('proyectos');
    return;
  }

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
  const _qcWipReset = _qcEl('quick-wip');
  if (_qcWipReset) _qcWipReset.checked = false;

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

  // TKT2 (REQ CAEL-08061000-01): bloquear guardado si la hora excede la ventana de 5h —
  // mismo criterio interpretHora().withinResetWindow que _horaUpdate usa visualmente.
  if (horaResult && !horaResult.withinResetWindow) {
    const _hi = _qcEl('quick-hora');
    if (_hi) { _hi.focus(); _hi.classList.add('input-border-error'); setTimeout(() => _hi.classList.remove('input-border-error'), 1200); }
    return;
  }

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

  // v3: sesión va al proyecto activo con aiId — openQuickCapture() ya bloqueó la apertura
  // si no hay proyecto activo (TKT2, ver arriba); este chequeo era la validación tardía
  // que el Hallazgo A-10 señalaba y ya no puede fallar aquí.
  sess.aiId = _quickAIId;
  const activeProj = getActiveProject();
  if (!activeProj.sessions) activeProj.sessions = [];
  // TKT1 (CAEL-01): sess se empuja antes del guardado — excepción documentada y sin cambio,
  // el retry reintenta saveImmediate() sobre el mismo estado, sin reconstruir ni duplicar.
  activeProj.sessions.push(sess);

  // TKT2 (parent CAEL-08081500-01, ver _Locus-ux-ref Patrón A-10): mutación del worker
  // (status/resetTime/resetEpoch) e interruptSession() ya no ocurren aquí — se diferían antes
  // de que _qcAttemptSave confirmara la persistencia. Si saveImmediate() fallaba, ai.status ya
  // había quedado en 'exhausted' en memoria pese a que nada se guardó. Ahora viajan como datos
  // a _qcAttemptSave y se aplican solo dentro de su .then().
  const _qcWipEl = _qcEl('quick-wip');
  const wipChecked = !!(_qcWipEl && _qcWipEl.checked);
  _qcAttemptSave(ai, horaResult, wipChecked);
}

// TKT1 (CAEL-01): intento de guardado real — separado de confirmQuickCapture() para que
// Reintentar reinvoque saveImmediate() sin reconstruir sess (evita push duplicado).
// TKT2 (parent CAEL-08081500-01): recibe horaResult/wipChecked para aplicar la mutación del
// worker solo tras confirmar persistencia — ver Patrón A-10 en _Locus-ux-ref.
function _qcAttemptSave(ai, horaResult, wipChecked) {
  _qcSaving = true;
  _qcSetSavingState(true);
  // B-202605-XXX: usar saveImmediate() para garantizar escritura en Supabase antes de
  // cualquier recarga. save() con debounce de 5s podía perder resetTime/resetEpoch/status
  // si el usuario recargaba la tab antes de que el timer disparara.
  saveImmediate().then(() => {
    _qcSaving = false;
    _qcRetryFn = null;

    // TKT2: mutación diferida — solo se aplica una vez que saveImmediate() resolvió.
    if (horaResult) {
      // T-089: solo cambiar status a exhausted si estaba disponible
      if (ai.status === 'available') ai.status = 'exhausted';
      ai.resetTime = horaResult.hhmm;
      ai.resetEpoch = horaResult.epoch;
    }
    // TKT1 (CAEL-0723-02): checkbox "Este worker tiene un WIP" — invoca interruptSession()
    // (mutador puro, sin modal ni save propio), ahora tras confirmar el guardado.
    if (wipChecked) interruptSession(ai.id);

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
    _qcRetryFn = () => _qcAttemptSave(ai, horaResult, wipChecked);
  });
}

// ── END R-[pendiente-ID] Quick Capture ──

// ── T-055: Sesión interrumpida ──
// TKT3 (CAEL-0723-04): confirmInterruptInline/cancelInterruptInline retiradas — huérfanas
// tras retirar 'Interrumpir' del dot-menu (index.html mod:154, locus-sesiones.js mod:53).
// interruptSession(id) — contract_detail TKT3: firma sin cambio, mismos invariants
// (status='exhausted' + interrupted=true). Simplificada a mutador puro: pierde el
// _gconfirmOpen anidado (pedía hora aparte) y su propio save()/toast/setTimeout — el
// nuevo punto de entrada es confirmQuickCapture(), que ya persiste y notifica una sola
// vez para todo el flujo de Quick Capture. Llamar aquí a la versión con modal habría
// abierto un segundo confirm dentro del propio modal de Quick Capture.
function interruptSession(id) {
  const ai = getAI(id);
  ai.status = 'exhausted';
  ai.interrupted = true;
  // R-202604-061 AC-2: clase transitoria antes de interrupted-state — no-op si la card
  // no está montada en este contexto (ej. invocada desde Quick Capture).
  const _intCard = document.getElementById('card-' + id);
  if (_intCard) _intCard.classList.add('tracker-card--interrupting');
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
