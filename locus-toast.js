// [PP] mod:12 · autor:Rune · 2026-08-31 11:32 UTC-6
// TKT-202608-512 (REQ-202608-212): confirm/copy/neutral con prioridad explícita en
// _TOAST_PRIORITY — ya no caen al fallback ?? 99. Orden relativo previo sin cambio.
// TKT-202608-510 (REQ-202608-212): rama mobile muerta en showToastInline() retirada —
// proyecto es desktop-only (_pp-strategy §6), sin viewport móvil soportado.
// TKT-202608-508 (REQ-202608-212): _TOAST_ICONS migrado de carácter Unicode a id de sprite
// SVG para success/download/warning/error/confirm/copy — mismo patrón que .toast-dismiss
// (<use href="#ti-*">). info y neutral quedan en Unicode — sin id semánticamente
// equivalente en el sprite de index.html (31 símbolos, verificado en esta sesión), señalado
// explícitamente en vez de forzar un ícono no relacionado (AC3). Detalle completo en el
// comentario junto a la declaración de _TOAST_ICONS, más abajo.
// TKT-202608-507 (REQ-202608-211): región aria-live assertive propia para error/warning —
//   antes warning caía en role="status" (polite) y error dependía solo de role="alert"
//   heredado del contenedor #toast-stack (aria-live="polite" a nivel de contenedor), con
//   anuncio inconsistente entre lectores de pantalla. Ahora cada .toast-item declara
//   aria-live/aria-atomic explícitos sobre sí mismo — región de urgencia propia por ítem,
//   independiente del contenedor y de otros toasts coexistentes en el stack.
// TKT-202608-506 (REQ-202608-211): keydown Enter/Space en el toast ejecuta onClick()
//   antes de _dismissToast() cuando el toast lo tiene — paridad con click en .toast-msg
//   (WCAG 2.1.1). Guard el._dismissed evita doble disparo por auto-repeat de teclado.
// REQ CAEL-0724-02, TKT1: _TOAST_ICONS cubre los 8 tipos — confirm/copy/neutral
// ya no caen al fallback 'ℹ'. TKT2: dismiss usa sprite SVG local (<use href="#ti-x">)
// — mismo patrón que TKT-202608-286 (REQ-202608-117 TKT5) migró en 8 archivos del
// ecosistema. mod:6 revirtió esto a webfont por diagnóstico incorrecto — el símbolo
// #ti-x sí existe en index.html; la causa real del ícono gigante es que ninguna hoja
// CSS define la regla .ti-svg. Revertido a sprite (patrón vigente). Fix real bloqueado
// — requiere Nova (INC consolidado, ver CHECKPOINT).
import { esc } from './locus-ui-shell.js';
// locus-toast.js
// Última actualización: 2026-05-19 00:00 UTC-6
// Toast stack system — extraído de ai-tracker-checkpoint.js (R-202605-003)
// Carga antes que cualquier módulo que llame funciones toast.

// Toast stack system — múltiples toasts simultáneos con spring animation
// TKT-202608-508 (REQ-202608-212): migrado de carácter Unicode a id del sprite SVG de
// index.html — mismo patrón que .toast-dismiss (<use href="#ti-x">). Verificado contra
// index.html real en esta sesión (31 símbolos): success→ti-check · download→ti-backup
// (flecha hacia abajo con línea — mismo semántico que el '↓' anterior) · warning→
// ti-alert-triangle · error→ti-x · confirm→ti-check (mismo símbolo que success — ambos
// eran variantes de check en Unicode: '✓'/'✔') · copy→ti-copy. info y neutral NO tienen
// id semánticamente equivalente en el sprite (no existe ícono de información ni de punto
// simple — ti-dots son 3 puntos de menú, no un bullet) — quedan en su carácter Unicode
// original como excepción declarada (AC3 de TKT-202608-508), en vez de forzar un ícono
// no relacionado. Valores 'ti-*' son ids de sprite; el resto ('ℹ', '•') son fallback
// Unicode — _toastIconHtml() distingue por el prefijo 'ti-'.
const _TOAST_ICONS = { success: 'ti-check', download: 'ti-backup', info: 'ℹ', warning: 'ti-alert-triangle', error: 'ti-x', confirm: 'ti-check', copy: 'ti-copy', neutral: '•' };
// TKT-202608-508: único punto de traducción tipo→markup — usado por _toastRender()
// (.toast-icon) y por showToastInline() (rama sin acciones), los dos consumidores
// reales de _TOAST_ICONS en este archivo. Si el valor mapeado empieza con 'ti-' se
// interpreta como id de sprite y renderiza <svg><use>; si no, es el fallback Unicode
// tal cual (info/neutral, o cualquier tipo ausente del mapa → 'ℹ' por defecto).
function _toastIconHtml(type) {
  const icon = _TOAST_ICONS[type];
  if (!icon) return 'ℹ';
  if (icon.indexOf('ti-') === 0) return `<svg class="ti-svg" aria-hidden="true"><use href="#${icon}"></use></svg>`;
  return icon;
}
// T-202604-229: duraciones base por tipo; 0 = sin auto-dismiss
// T-202604-279: duraciones calibradas — base mínima + 40ms/char sobre el mínimo
//   success : mín 2000ms + 40ms/char
//   error   : 0 (sin auto-dismiss — requiere acción del usuario)
//   warning : mín 3000ms + 40ms/char
//   info    : mín 2000ms + 40ms/char
//   download: Math.min(8000, 4000 + 40ms/char) — o hasta dismiss
//   copy / neutral / confirm: planos (sin contenido variable largo)
const _TOAST_DEFAULTS = { success: 2000, download: 4000, error: 0, warning: 3000, info: 2000, confirm: 3500, copy: 2000, neutral: 2500 };
// T-202604-279: calcula duración calibrada según tipo y longitud del texto visible
function _toastDuration(type, title, body) {
  const base = _TOAST_DEFAULTS[type] ?? 2000;
  if (base === 0) return null; // error → sin auto-dismiss
  if (type === 'copy' || type === 'neutral' || type === 'confirm') return base;
  const len = (title ? title.replace(/<[^>]+>/g, '').length : 0) + (body ? body.replace(/<[^>]+>/g, '').length : 0);
  const calibrated = base + len * 40;
  if (type === 'download') return Math.min(8000, calibrated);
  return calibrated;
}

// T-202604-280: stack rules — máximo 3 visibles, queue, prioridad, digest
const _TOAST_MAX = 3;
const _TOAST_PRIORITY = { error: 0, warning: 1, success: 2, info: 3, download: 4, confirm: 5, copy: 6, neutral: 7 };
let _toastQueue = []; // { type, title, body, base, onClick }

export function _toastVisibleCount() {
  const stack = document.getElementById('toast-stack');
  if (!stack) return 0;
  return Array.from(stack.querySelectorAll('.toast-item')).filter(t => !t._dismissed).length;
}

export function _toastRender(type, title, body, base, onClick) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;

  const el = document.createElement('div');
  el.className = 'toast-item t-' + type;
  // TKT-202608-507: error y warning son urgentes por igual — antes solo 'error' recibía
  // role="alert", warning caía en 'status' (polite). Cada toast urgente declara aria-live
  // y aria-atomic sobre sí mismo — no depende de que #toast-stack sea aria-live="polite"
  // a nivel de contenedor, y no interfiere con otros toasts no-urgentes coexistiendo en
  // el mismo stack (cada .toast-item es su propia región de urgencia).
  const _isUrgent = type === 'error' || type === 'warning';
  el.setAttribute('role', _isUrgent ? 'alert' : 'status');
  el.setAttribute('aria-live', _isUrgent ? 'assertive' : 'polite');
  el.setAttribute('aria-atomic', 'true');

  // TKT-202608-508: ícono vía sprite SVG (o fallback Unicode declarado) — ver _toastIconHtml()
  const icon = _toastIconHtml(type);
  // B-202605-043: regex estricto — requiere nombre de tag HTML válido seguido de espacio, '/' o '>'
  // Evita falsos positivos con expresiones como '<3', '<3 items', etc.
  const _isHtml = s => /<[a-z][a-z0-9]*[\s/>]/i.test(s) || /<\/[a-z][a-z0-9]*>/i.test(s);
  const titleHtml = _isHtml(title) ? title : esc(title);
  const bodyHtml  = body ? (_isHtml(body) ? body : esc(body)) : null;
  const progressHtml = base !== null ? `<div class="toast-progress"></div>` : '';

  el.innerHTML =
    `<span class="toast-icon">${icon}</span>` +
    `<span class="toast-msg">` +
      `<span class="toast-title">${titleHtml}</span>` +
      (bodyHtml ? `<span class="toast-body">${bodyHtml}</span>` : '') +
    `</span>` +
    `<button class="toast-dismiss" aria-label="Cerrar notificación"><svg class="ti-svg" aria-hidden="true"><use href="#ti-x"></use></svg></button>` +
    progressHtml;

  el.querySelector('.toast-dismiss').addEventListener('click', (e) => {
    e.stopPropagation();
    _dismissToast(el);
  });

  if (onClick) {
    el.querySelector('.toast-msg').classList.add('toast-clickable');
    el.querySelector('.toast-msg').addEventListener('click', () => { onClick(); _dismissToast(el); }, { once: true });
  } else if (type === 'error' || type === 'warning') {
    el.classList.add('toast-clickable');
    el.addEventListener('click', () => _dismissToast(el), { once: true });
  }

  // T-202604-228: stagger — cap 3 → 180ms máx
  const _staggerIdx = Math.min(_toastVisibleCount(), _TOAST_MAX - 1);
  const _staggerDelay = _staggerIdx * 60;

  stack.appendChild(el);
  if (base === null) el._noDismiss = true;
  el.getBoundingClientRect();
  if (_staggerDelay > 0) el.style.setProperty('--toast-stagger-delay', _staggerDelay + 'ms');
  el.classList.add('show');
  if (_staggerDelay > 0) setTimeout(() => { el.style.removeProperty('--toast-stagger-delay'); }, _staggerDelay + 300);

  if (base !== null) {
    el.style.setProperty('--toast-duration', (base / 1000) + 's');
    el._hideTimer = setTimeout(() => _dismissToast(el), base);
    el._timerEnd = Date.now() + base;

    el.addEventListener('mouseenter', () => {
      if (el._dismissed) return;
      clearTimeout(el._hideTimer);
      el._hideTimer = null;
      el._remaining = Math.max(0, el._timerEnd - Date.now());
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'paused');
    });
    el.addEventListener('mouseleave', () => {
      if (el._dismissed || el._remaining == null) return;
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'running');
      el._timerEnd = Date.now() + el._remaining;
      el._hideTimer = setTimeout(() => _dismissToast(el), el._remaining);
      el._remaining = null;
    });
    // T-202604-221: touch — pausa en touchstart, reanuda en touchend/touchcancel fuera del toast
    el.addEventListener('touchstart', () => {
      if (el._dismissed) return;
      clearTimeout(el._hideTimer);
      el._hideTimer = null;
      el._remaining = Math.max(0, el._timerEnd - Date.now());
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'paused');
    }, { passive: true });
    const _touchResume = () => {
      if (el._dismissed || el._remaining == null) return;
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'running');
      el._timerEnd = Date.now() + el._remaining;
      el._hideTimer = setTimeout(() => _dismissToast(el), el._remaining);
      el._remaining = null;
    };
    el.addEventListener('touchend', _touchResume, { passive: true });
    el.addEventListener('touchcancel', _touchResume, { passive: true });
  }

  // T-202604-221: accesibilidad teclado — Tab navega entre toasts, Enter/Space cierra
  // TKT-202608-506 (REQ-202608-211): paridad mouse↔teclado — si el toast tiene onClick,
  // Enter/Space lo ejecuta antes de descartar, mismo resultado que click en .toast-msg.
  // Guard el._dismissed evita doble disparo de onClick() por auto-repeat del teclado —
  // _dismissToast() ya marca el._dismissed de forma síncrona en su primera línea.
  el.setAttribute('tabindex', '0');
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (el._dismissed) return;
    if (onClick) onClick();
    _dismissToast(el);
  });
}

// T-202604-222: nueva firma (type, title, body?, duration?, onClick?)
// T-202604-278: regla onClick — solo usar cuando la acción NO es accesible de otra forma en el
//   contexto actual. Toasts informativos van sin onClick. Si el usuario puede encontrar la acción
//   en la UI principal, onClick es redundante y se omite.
//   Ejemplos válidos: navegar a una sección que se acaba de modificar en otro tab.
//   Ejemplos inválidos: dismiss manual (ya hay botón ×), re-abrir modal que tiene acceso directo.
export function showToast(type, title, body = null, duration = null, onClick = null) {
  // T-202604-229: duration explícito tiene prioridad; si no → _toastDuration calibra por tipo+len
  // T-202604-279: _toastDuration() aplica fórmula base + 40ms/char; error siempre null (no dismiss)
  const base = duration !== null ? duration : _toastDuration(type, title, body);

  // T-202604-280: si ya hay _TOAST_MAX visibles → encolar; persistentes (base=null) siempre pasan directo
  if (base !== null && _toastVisibleCount() >= _TOAST_MAX) {
    _toastQueue.push({ type, title, body, base, onClick });
    // Reordenar queue por prioridad
    _toastQueue.sort((a, b) =>
      (_TOAST_PRIORITY[a.type] ?? 99) - (_TOAST_PRIORITY[b.type] ?? 99)
    );
    return;
  }

  _toastRender(type, title, body, base, onClick);
}

export function _dismissToast(el) {
  if (el._dismissed) return;
  el._dismissed = true;
  clearTimeout(el._hideTimer);
  el.classList.add('toast-hide');
  setTimeout(() => {
    el.remove();
    _toastNext(); // T-202604-280: mostrar siguiente de queue al dismissear
  }, 160); // T-202604-221: 150ms transición salida + 10ms buffer
}

// T-202604-280: extrae el siguiente toast de queue (ya ordenado por prioridad) y lo renderiza
export function _toastNext() {
  if (!_toastQueue.length) return;
  if (_toastVisibleCount() >= _TOAST_MAX) return;
  const next = _toastQueue.shift();
  _toastRender(next.type, next.title, next.body, next.base, next.onClick);
}

// T-202604-280: digest — agrupa múltiples mensajes del mismo tipo en un solo toast
export function showToastDigest(type, msgs, duration = null) {
  if (!msgs || !msgs.length) return;
  if (msgs.length === 1) {
    showToast(type, msgs[0], null, duration);
    return;
  }
  const title = msgs[0];
  const body = `y ${msgs.length - 1} más`;
  showToast(type, title, body, duration);
}

// alias — retrocompat
export function toast(msg) { showToast('info', msg); }

// T-202604-221: showToastInline — toast anclado al elemento que detona la acción
export function showToastInline(anchorEl, actionsOrType, title, opts = {}) {
  const isActionMode = Array.isArray(actionsOrType);
  const type = isActionMode ? 'info' : actionsOrType;
  const actions = isActionMode ? actionsOrType : null;

  if (!anchorEl) { showToast(type, title); return; }

  // Limpiar inline anterior en el mismo anchor si existe
  const prev = anchorEl.querySelector('.toast-inline');
  if (prev) prev.remove();

  // Asegurar position:relative en el anchor
  const pos = getComputedStyle(anchorEl).position;
  if (pos === 'static') anchorEl.style.setProperty('position', 'relative');

  const el = document.createElement('div');
  const _TOAST_INLINE_FLIP_THRESHOLD = 80;
  let placement = opts.position || 'above';
  try {
    const rect = anchorEl.getBoundingClientRect();
    if (rect.top < _TOAST_INLINE_FLIP_THRESHOLD) placement = 'below';
  } catch(e) {}
  el.className = `toast-inline t-${type} toast-inline--${placement}`;
  el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const _hideInline = () => {
    if (el._inlineDismissed) return;
    el._inlineDismissed = true;
    clearTimeout(el._inlineTimer);
    el.classList.add('toast-hide');
    setTimeout(() => el.remove(), 200);
  };

  if (isActionMode && actions.length) {
    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast-inline-msg';
    msgSpan.textContent = title;
    el.appendChild(msgSpan);

    const btnWrap = document.createElement('span');
    btnWrap.className = 'toast-inline-actions';
    actions.forEach(({ label, cls, cb }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `toast-inline-btn${cls ? ' ' + cls : ''}`;
      btn.textContent = label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _hideInline();
        if (typeof cb === 'function') cb();
      });
      btnWrap.appendChild(btn);
    });
    el.appendChild(btnWrap);

    const _outsideHandler = (e) => {
      if (!anchorEl.contains(e.target)) {
        _hideInline();
        document.removeEventListener('click', _outsideHandler, true);
      }
    };
    setTimeout(() => document.addEventListener('click', _outsideHandler, true), 0);
    el._outsideHandler = _outsideHandler;

  } else {
    // TKT-202608-508: _TOAST_ICONS ahora mezcla ids de sprite ('ti-*') y fallback Unicode
    // (info/neutral) — _toastIconHtml() resuelve el markup correcto para ambos casos, así
    // este consumidor no queda roto con un id de sprite crudo impreso como texto.
    el.innerHTML = `${_toastIconHtml(type)} `;
    const msgSpan = document.createElement('span');
    msgSpan.textContent = title;
    el.appendChild(msgSpan);
    el._inlineTimer = setTimeout(_hideInline, 2000);
  }

  anchorEl.appendChild(el);
  el.getBoundingClientRect();
  el.classList.add('show');
}

// ── window.* — solo para compatibilidad con locus-api.js (T5) ────────────────

// T-[tmp:t-listeners-storage-sesiones]: listener shell:toast — desacoplamiento de locus-storage.js
// locus-storage.js despacha shell:toast con detail: { type, msg, body, duration }
// en lugar de llamar showToast() directamente
window.addEventListener('shell:toast', (e) => {
  const { type, msg, body, duration } = e.detail || {};
  showToast(type, msg, body, duration);
});
