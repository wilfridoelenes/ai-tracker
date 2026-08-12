// [PP] mod:6 · autor:Rune · 2026-08-12 06:15 UTC-6
// TKT2 (CAEL-08111815-01): saveWorker()/deleteWorker() agregados en los 5 sitios de mutación
// de Worker (avatar, alta, archived, y las dos bajas) — save()/saveImmediate() ya no persisten
// ais en tracker_state, cada sitio persiste su propio cambio vía el canal dedicado.
// TKT-[pendiente-ID] (REQ CAEL-01): AVATAR_LOGOS.claude reemplazado — logo oficial
// de marca (fill="#d97757" fijo) en vez del ícono abstracto circular anterior.
// [PP] mod:4 · autor:Rune · 2026-07-13 UTC-6
// INC-[pendiente-ID]: APP_VERSION exportada — locus-docs.js la consumía vía
// typeof APP_VERSION !== 'undefined' sin import real; el guard nunca era true
// (variable module-privada, no global) y siempre caía al fallback 'v0'/_effectiveVersion.
// [PP] mod:3 · autor:Rune · 2026-07-11 00:00 UTC-6
// locus-workers.js
// Módulo: CRUD de Workers (IAs) — add, delete, archive, avatar, card menu, inline confirm.
//   Define AVATAR_LOGOS (SVGs de avatares) — movido desde locus-checkpoint-stats.js.
// Extraído de: ai-tracker-ai-notes.js
// Última actualización: 2026-05-27 UTC-6
// Carga después de: locus-modals.js, locus-toast.js, locus-ui-shell.js
// Carga antes de: locus-sesiones-stats.js · locus-sesiones-capture.js

import { _restoreModalFocus, _saveModalTrigger, closeModal } from './locus-modals.js';

import { showToast, toast } from './locus-toast.js';
import { esc, switchTab } from './locus-ui-shell.js';

import { _mutateSessions, getAI, getAISessions, save, saveImmediate, state, saveWorker, deleteWorker } from './locus-storage.js';
import { getPopAIId } from './locus-session-popup.js';

// ── AVATAR_LOGOS — fuente de verdad de SVGs de avatares ──
const AVATAR_LOGOS = {
  // CAEL-02 (REQ CAEL-01): logo oficial de marca — fill="#d97757" fijo, no currentColor.
  // Excepción declarada frente al resto de AVATAR_LOGOS (abstractos, heredan --accent del tema):
  // este es el logotipo real, debe verse en su color de marca para ser reconocible.
  claude: '<svg fill="none" viewBox="0 -.01 39.5 39.53" xmlns="http://www.w3.org/2000/svg"><path d="m7.75 26.27 7.77-4.36.13-.38-.13-.21h-.38l-1.3-.08-4.44-.12-3.85-.16-3.73-.2-.94-.2-.88-1.16.09-.58.79-.53 1.13.1 2.5.17 3.75.26 2.72.16 4.03.42h.64l.09-.26-.22-.16-.17-.16-3.88-2.63-4.2-2.78-2.2-1.6-1.19-.81-.6-.76-.26-1.66 1.08-1.19 1.45.1.37.1 1.47 1.13 3.14 2.43 4.1 3.02.6.5.24-.17.03-.12-.27-.45-2.23-4.03-2.38-4.1-1.06-1.7-.28-1.02c-.1-.42-.17-.77-.17-1.2l1.23-1.67.68-.22 1.64.22.69.6 1.02 2.33 1.65 3.67 2.56 4.99.75 1.48.4 1.37.15.42h.26v-.24l.21-2.81.39-3.45.38-4.44.13-1.25.62-1.5 1.23-.81.96.46.79 1.13-.11.73-.47 3.05-.92 4.78-.6 3.2h.35l.4-.4 1.62-2.15 2.72-3.4 1.2-1.35 1.4-1.49.9-.71h1.7l1.25 1.86-.56 1.92-1.75 2.22-1.45 1.88-2.08 2.8-1.3 2.24.12.18.31-.03 4.7-1 2.54-.46 3.03-.52 1.37.64.15.65-.54 1.33-3.24.8-3.8.76-5.66 1.34-.07.05.08.1 2.55.24 1.09.06h2.67l4.97.37 1.3.86.78 1.05-.13.8-2 1.02-2.7-.64-6.3-1.5-2.16-.54h-.3v.18l1.8 1.76 3.3 2.98 4.13 3.84.21.95-.53.75-.56-.08-3.63-2.73-1.4-1.23-3.17-2.67h-.21v.28l.73 1.07 3.86 5.8.2 1.78-.28.58-1 .35-1.1-.2-2.26-3.17-2.33-3.57-1.88-3.2-.23.13-1.11 11.95-.52.61-1.2.46-1-.76-.53-1.23.53-2.43.64-3.17.52-2.52.47-3.13.28-1.04-.02-.07-.23.03-2.36 3.24-3.59 4.85-2.84 3.04-.68.27-1.18-.61.11-1.09.66-.97 3.93-5 2.37-3.1 1.53-1.79-.01-.26h-.09l-10.44 6.78-1.86.24-.8-.75.1-1.23.38-.4 3.14-2.16z" fill="#d97757"/></svg>',
  gpt4: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/></svg>',
  gemini: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 8l3 3-3 3-3-3 3-3z" fill="currentColor"/><path d="M15 11l3-3v6l-3-3z" fill="currentColor" opacity="0.6"/><path d="M9 11l-3-3v6l3-3z" fill="currentColor" opacity="0.6"/></svg>',
  llama: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/><path d="M10 14c0 1 1 2 2 2s2-1 2-2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 9l-1.5-2.5M17 9l1.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  mistral: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/></svg>',
  cohere: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/><circle cx="14" cy="11" r="1.5" fill="currentColor"/><path d="M10 11l2-3 2 3" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
  anthropic: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M8 11h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15.5" cy="9" r="1" fill="currentColor"/></svg>',
  default: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/><path d="M7 15c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
};

// ── Versión de la app — fuente de verdad ──
// R-202605-012: movida desde locus-sesiones-stats.js — locus-workers.js carga antes.
// R-202604-086: _mgApplyBumpedVersion() en locus-map-generator.js sobreescribe via localStorage.
export const APP_VERSION = 'v3.4';

// ── Estado interno ──
let avatarModalAIId = null;
let selectedAvatarKey = null;
let _cardMenuScrollHandler = null; // B-202605-049: referencia al listener de scroll activo

// ── T-011: Avatar selector ──
export function openAvatarModal(aiId) {
  _saveModalTrigger('avatar-modal');
  const ai = getAI(aiId);
  if (!ai) return;
  avatarModalAIId = aiId;

  const currentLogoKey = Object.entries(AVATAR_LOGOS).find(([k, v]) => v === ai.avatar)?.[0] || null;
  selectedAvatarKey = currentLogoKey;

  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = Object.entries(AVATAR_LOGOS).map(([key, svg]) => `
    <div class="avatar-option ${key === selectedAvatarKey ? 'selected' : ''}"
         data-avatar-key="${key}"
         title="${key}">
      ${svg}
    </div>
  `).join('');

  document.getElementById('avatar-modal').classList.add('open');
}

export function selectAvatarOption(key) {
  selectedAvatarKey = key;
  document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
  const target = document.querySelector(`.avatar-option[data-avatar-key="${key}"]`);
  if (target) target.classList.add('selected');
}

export function confirmAvatarModal() {
  if (!avatarModalAIId || !selectedAvatarKey) return;
  const ai = getAI(avatarModalAIId);
  if (!ai) return;
  ai.avatar = AVATAR_LOGOS[selectedAvatarKey] || AVATAR_LOGOS.default;
  closeAvatarModal();
  save();
  // TKT2 (CAEL-08111815-01): Workers persisten en tracker_workers — save() ya no sube ais.
  saveWorker(ai);
  window.dispatchEvent(new CustomEvent('shell:render-tracker'));
  if (getPopAIId() === avatarModalAIId) {
    const popAvatar = document.getElementById('pop-avatar');
    if (popAvatar) popAvatar.innerHTML = ai.avatar;
  }
  showToast('success', 'Avatar actualizado');
}

export function closeAvatarModal() {
  document.getElementById('avatar-modal').classList.remove('open');
  _restoreModalFocus('avatar-modal');
  avatarModalAIId = null;
  selectedAvatarKey = null;
}

// ── Agregar IA ──
export function openAddAI() {
  // B-202604-177: rotate feedback antes de abrir modal
  const addBtn = document.querySelector('.radar-sidebar-add-btn');
  if (addBtn) { addBtn.classList.add('is-triggered'); setTimeout(() => addBtn.classList.remove('is-triggered'), 300); }
  _saveModalTrigger('add-modal');
  document.getElementById('new-name').value = '';
  document.getElementById('add-modal').classList.add('open');
  setTimeout(() => document.getElementById('new-name').focus(), 50);
}

export function confirmAddAI() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) { showToast('warning', 'Escribe un nombre'); return; }
  // T-093: validar duplicados case-insensitive
  const nameLower = name.toLowerCase();
  const duplicate = state.ais.find(a => a.name.toLowerCase() === nameLower);
  if (duplicate) {
    showToast('warning', `Ya existe una IA llamada "${duplicate.name}"`);
    const inp = document.getElementById('new-name');
    inp.focus(); inp.select();
    return;
  }
  const _newAi = { id: 'ai-' + Date.now() + '-' + Math.random().toString(36).slice(2), name, status: 'available', resetTime: '', sessions: [], showAll: false, notes: '', avatar: AVATAR_LOGOS.default }; // B-202605-079: componente random evita colisión en mismo ms
  state.ais.push(_newAi);
  closeModal('add-modal');
  document.getElementById('add-modal').classList.remove('open');
  save();
  // TKT2 (CAEL-08111815-01): alta de Worker — persistir la fila nueva en tracker_workers.
  saveWorker(_newAi);
  if (currentTab !== 'tracker') switchTab('tracker'); else window.dispatchEvent(new CustomEvent('shell:render-tracker'));
  showToast('success', 'IA agregada');
}

// ── Eliminar / limpiar ──
export function confirmClear(id) {
  const ai = getAI(id);
  const sess = getAISessions(id);
  if (!sess.length) { showToast('warning', 'Sin sesiones'); return; }
  showInlineConfirm(id, 'clear', `¿Eliminar las ${sess.length} sesiones de "${ai.name}"?`);
}

export function deleteAI(id) {
  // T-202604-212: confirmar solo si tiene sesiones — sin historial, borrar directo
  // B-202605-023: verificar sesiones en state.projects Y en ai.sessions (formato legacy v2)
  const ai = getAI(id);
  const hasSessionsInProjects = (state.projects || []).some(p => (p.sessions || []).some(s => s.aiId === id));
  const hasSessionsLegacy = ai && (ai.sessions || []).length > 0;
  const hasSessions = hasSessionsInProjects || hasSessionsLegacy;
  if (hasSessions) {
    showInlineConfirm(id, 'delete', '¿Eliminar esta IA y todo su historial?');
  } else {
    state.ais = state.ais.filter(a => a.id !== id);
    saveImmediate(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
    // TKT2 (CAEL-08111815-01): saveImmediate() ya no borra Workers del blob — retirar la
    // fila de tracker_workers explícitamente (idempotente, mismo criterio que deleteAI()).
    deleteWorker(id);
  }
}

// ── T-202604-049: Menú ⋯ en cards ──
// B-202605-020: el dropdown se mueve a document.body al abrir para escapar de
// ancestros con overflow:auto (.tracker-col--card) que rompen position:fixed.
// Al cerrar se devuelve al wrap original para mantener la estructura del DOM.

// btn: elemento botón pasado explícitamente desde el delegador de locus-sesiones.js.
// e.currentTarget en delegadores apunta al document — no al botón — por eso se separa.
export function toggleCardMenu(id, btn, e) {
  if (e) e.stopPropagation();
  const dd = document.getElementById('dotmenu-' + id);
  if (!dd) return;
  const isOpen = dd.classList.contains('open');
  // Cerrar cualquier otro menú abierto (devuelve al wrap si está en body)
  document.querySelectorAll('.card-dot-dropdown.open').forEach(el => {
    const elId = el.id.replace('dotmenu-', '');
    _closeCardMenuPortal(elId);
  });
  if (!isOpen) {
    const rect = btn.getBoundingClientRect();
    // B-202605-042: limpiar coordenadas antes de mover para evitar flash de posición anterior.
    // Las coordenadas se aplican DESPUÉS del appendChild — el nodo llega a body sin posición
    // stale visible, luego recibe las nuevas coordenadas y .open en el mismo tick sincrónico.
    // B-202605-020: min-width declarado en CSS (188px) — offsetWidth es 0 con display:none
    const menuWidth = 188;
    dd.style.removeProperty('--card-menu-top');
    dd.style.removeProperty('--card-menu-left');
    dd.dataset.wrapId = 'dotmenu-wrap-' + id;
    // B-202605-044: guardar referencia al trigger para devolver foco al cerrar por Escape
    dd.dataset.triggerId = id;
    document.body.appendChild(dd);
    // Coordenadas post-appendChild — previene flash de posición stale
    dd.style.setProperty('--card-menu-top',  (rect.bottom + 4) + 'px');
    dd.style.setProperty('--card-menu-left', (rect.right - menuWidth) + 'px');
    dd.classList.add('open');

    // B-202605-049: cerrar menú al hacer scroll en .tracker-col--card
    _cardMenuScrollCleanup();
    const scrollContainer = document.querySelector('.tracker-col--card');
    if (scrollContainer) {
      _cardMenuScrollHandler = function() {
        document.querySelectorAll('.card-dot-dropdown.open').forEach(el => {
          const elId = el.id.replace('dotmenu-', '');
          _closeCardMenuPortal(elId);
        });
      };
      scrollContainer.addEventListener('scroll', _cardMenuScrollHandler, { passive: true });
    }
  }
}

function _cardMenuScrollCleanup() {
  if (_cardMenuScrollHandler) {
    const scrollContainer = document.querySelector('.tracker-col--card');
    if (scrollContainer) scrollContainer.removeEventListener('scroll', _cardMenuScrollHandler);
    _cardMenuScrollHandler = null;
  }
}

function _closeCardMenuPortal(id, returnFocus) {
  const dd = document.getElementById('dotmenu-' + id);
  if (!dd) return;
  dd.classList.remove('open');
  _cardMenuScrollCleanup(); // B-202605-049: limpiar listener de scroll al cerrar
  // Devolver al wrap original si fue movido a body
  const wrapId = dd.dataset.wrapId;
  if (wrapId) {
    const wrap = document.getElementById(wrapId);
    if (wrap && dd.parentNode === document.body) wrap.appendChild(dd);
    // B-202605-044: devolver foco al .sc-menu-btn trigger al cerrar por Escape
    if (returnFocus) {
      const trigger = wrap.querySelector('.sc-menu-btn');
      if (trigger) trigger.focus();
    }
    delete dd.dataset.wrapId;
  }
  delete dd.dataset.triggerId;
}

export function closeCardMenu(id) {
  _closeCardMenuPortal(id);
}

// Cerrar menú al click fuera — ignorar clicks dentro del propio card-dot-menu
document.addEventListener('click', function(e) {
  if (e.target.closest('.card-dot-menu')) return;
  document.querySelectorAll('.card-dot-dropdown.open').forEach(el => {
    const id = el.id.replace('dotmenu-', '');
    _closeCardMenuPortal(id);
  });
});

// B-202605-044: cerrar menú al presionar Escape — devuelve foco al trigger
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.card-dot-dropdown.open').forEach(el => {
    const id = el.id.replace('dotmenu-', '');
    _closeCardMenuPortal(id, true);
  });
});

// ── T-033: Archivar / restaurar IA ──
export function archiveAI(id) {
  const ai = getAI(id);
  if (!ai) return;
  ai.archived = !ai.archived;
  saveImmediate(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
  // TKT2 (CAEL-08111815-01): persistir el toggle de archived en tracker_workers.
  saveWorker(ai);
  showToast('info', ai.archived ? `${ai.name} archivada` : `${ai.name} restaurada`);
}

export function toggleArchivedSection(btn) {
  const grid = document.getElementById('archived-grid');
  if (!grid) return;
  const open = grid.classList.toggle('open');
  localStorage.setItem('archived-open', open ? '1' : '0');
  btn.textContent = (open ? '▼' : '▶') + btn.textContent.slice(1);
}

// ── Inline confirm ──
export function showInlineConfirm(id, action, msg) {
  document.querySelectorAll('.inline-confirm.open').forEach(el => el.remove());
  const card = document.getElementById('card-' + id);
  if (!card) return;
  const div = document.createElement('div');
  div.className = 'inline-confirm open'; div.id = 'iconf-' + id;
  div.addEventListener('click', function(e) {
    e.stopPropagation();
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'confirm') executeConfirm(id, action);
    else if (btn.dataset.action === 'cancel') closeInlineConfirm(id);
  });
  div.innerHTML = `
    <div class="inline-confirm-msg">${esc(msg)}</div>
    <div class="inline-confirm-actions">
      <button class="btn-danger" data-action="confirm">Confirmar</button>
      <button data-action="cancel">Cancelar</button>
    </div>`;
  card.appendChild(div);
}

export function closeInlineConfirm(id) {
  const el = document.getElementById('iconf-' + id);
  if (el) el.remove();
}

export function executeConfirm(id, action) {
  closeInlineConfirm(id);
  if (action === 'clear') {
    const ai = getAI(id);
    // TKT4 · REQ-sessions-mutator: eliminar sesiones de esta IA de todos los proyectos
    // vía _mutateSessions('remove', ...) — mismo mutador que confirmPurge() (TKT2) y
    // deleteCurrentSession() (TKT4, locus-session-popup.js).
    (state.projects || []).forEach(proj => {
      const toRemove = (proj.sessions || []).filter(s => s.aiId === id).map(s => s.id);
      toRemove.forEach(sessId => _mutateSessions(proj, 'remove', sessId));
    });
    saveImmediate(); window.dispatchEvent(new CustomEvent('shell:render-tracker')); showToast('success', `Historial de ${ai.name} limpiado`);
  } else if (action === 'delete') {
    state.ais = state.ais.filter(a => a.id !== id);
    saveImmediate(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
    // TKT2 (CAEL-08111815-01): mismo caso que deleteAI() — baja de Worker vía inline confirm.
    deleteWorker(id);
  }
}

// ── T-202605-046: Listeners — avatar-modal + avatar-grid ─────────────────────
// Migrado desde index.html — reemplaza onclick inline en .btn-cancel, .btn-confirm
// y en .avatar-option (generado dinámicamente, delegado en #avatar-grid).

document.addEventListener('DOMContentLoaded', function() {
  // btn-cancel / btn-confirm del modal de avatar
  const avatarModal = document.getElementById('avatar-modal');
  if (avatarModal) {
    const btnCancel  = avatarModal.querySelector('.btn-cancel');
    const btnConfirm = avatarModal.querySelector('.btn-confirm');
    if (btnCancel)  btnCancel.addEventListener('click',  closeAvatarModal);
    if (btnConfirm) btnConfirm.addEventListener('click', confirmAvatarModal);
  }

  // Event delegation en #avatar-grid para .avatar-option generados dinámicamente
  const grid = document.getElementById('avatar-grid');
  if (grid) {
    grid.addEventListener('click', function(e) {
      const opt = e.target.closest('.avatar-option[data-avatar-key]');
      if (opt) selectAvatarOption(opt.dataset.avatarKey);
    });
  }
});

// ── Window fallback para inline handlers de index.html ──
// closeModal tiene callers inline en index.html (L648, L679) — fallback evita ReferenceError si locus-workers.js no cargó.
// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────

// ── B-202605-019: Listener — #add-ai-confirm-btn ─────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const addAiConfirmBtn = document.getElementById('add-ai-confirm-btn');
  if (addAiConfirmBtn) addAiConfirmBtn.addEventListener('click', confirmAddAI);

  // #new-name: Enter → confirmAddAI (migrado desde onkeydown inline en index.html)
  const newNameInput = document.getElementById('new-name');
  if (newNameInput) newNameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') confirmAddAI();
  });
});
// ── END B-202605-019 ─────────────────────────────────────────────────────────
