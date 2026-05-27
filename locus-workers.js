// locus-workers.js
// Módulo: CRUD de Workers (IAs) — add, delete, archive, avatar, card menu, inline confirm.
//   Define AVATAR_LOGOS (SVGs de avatares) — movido desde locus-checkpoint-stats.js.
// Extraído de: ai-tracker-ai-notes.js
// Última actualización: 2026-05-27 UTC-6
// Carga después de: locus-modals.js, locus-toast.js, locus-ui-shell.js
// Carga antes de: locus-sesiones-stats.js · locus-sesiones-capture.js

// ── AVATAR_LOGOS — fuente de verdad de SVGs de avatares ──
const AVATAR_LOGOS = {
  claude: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.7"/><path d="M8 12a4 4 0 018 0" fill="currentColor"/></svg>',
  gpt4: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/></svg>',
  gemini: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 8l3 3-3 3-3-3 3-3z" fill="currentColor"/><path d="M15 11l3-3v6l-3-3z" fill="currentColor" opacity="0.6"/><path d="M9 11l-3-3v6l3-3z" fill="currentColor" opacity="0.6"/></svg>',
  llama: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/><path d="M10 14c0 1 1 2 2 2s2-1 2-2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 9l-1.5-2.5M17 9l1.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  mistral: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/></svg>',
  cohere: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/><circle cx="14" cy="11" r="1.5" fill="currentColor"/><path d="M10 11l2-3 2 3" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
  anthropic: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M8 11h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15.5" cy="9" r="1" fill="currentColor"/></svg>',
  default: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/><path d="M7 15c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
};

// ── Estado interno ──
let avatarModalAIId = null;
let selectedAvatarKey = null;
let _cardMenuScrollHandler = null; // B-202605-049: referencia al listener de scroll activo

// ── T-011: Avatar selector ──
function openAvatarModal(aiId) {
  if (typeof _saveModalTrigger === 'function') _saveModalTrigger('avatar-modal');
  const ai = getAI(aiId);
  if (!ai) return;
  avatarModalAIId = aiId;

  const currentLogoKey = Object.entries(AVATAR_LOGOS).find(([k, v]) => v === ai.avatar)?.[0] || null;
  selectedAvatarKey = currentLogoKey;

  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = Object.entries(AVATAR_LOGOS).map(([key, svg]) => `
    <div class="avatar-option ${key === selectedAvatarKey ? 'selected' : ''}"
         onclick="selectAvatarOption('${key}')"
         title="${key}">
      ${svg}
    </div>
  `).join('');

  document.getElementById('avatar-modal').classList.add('open');
}

function selectAvatarOption(key) {
  selectedAvatarKey = key;
  document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
  event.target.closest('.avatar-option').classList.add('selected');
}

function confirmAvatarModal() {
  if (!avatarModalAIId || !selectedAvatarKey) return;
  const ai = getAI(avatarModalAIId);
  if (!ai) return;
  ai.avatar = AVATAR_LOGOS[selectedAvatarKey] || AVATAR_LOGOS.default;
  closeAvatarModal();
  save();
  render();
  if (popAIId === avatarModalAIId) {
    const popAvatar = document.getElementById('pop-avatar');
    if (popAvatar) popAvatar.innerHTML = ai.avatar;
  }
  showToast('success', 'Avatar actualizado');
}

function closeAvatarModal() {
  document.getElementById('avatar-modal').classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus('avatar-modal');
  avatarModalAIId = null;
  selectedAvatarKey = null;
}

// ── Agregar IA ──
function openAddAI() {
  // B-202604-177: rotate feedback antes de abrir modal
  const addBtn = document.querySelector('.radar-sidebar-add-btn');
  if (addBtn) { addBtn.classList.add('is-triggered'); setTimeout(() => addBtn.classList.remove('is-triggered'), 300); }
  if (typeof _saveModalTrigger === 'function') _saveModalTrigger('add-modal');
  document.getElementById('new-name').value = '';
  document.getElementById('add-modal').classList.add('open');
  setTimeout(() => document.getElementById('new-name').focus(), 50);
}

function confirmAddAI() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) { showToast('warning', 'Escribe un nombre'); return; }
  // T-093: validar duplicados case-insensitive
  const nameLower = name.toLowerCase();
  const duplicate = state.ais.find(a => a.name.toLowerCase() === nameLower);
  if (duplicate) {
    if (typeof showToast === 'function') showToast('warning', `Ya existe una IA llamada "${duplicate.name}"`);
    else console.warn('[locus-workers] showToast no disponible — duplicado bloqueado:', duplicate.name);
    const inp = document.getElementById('new-name');
    inp.focus(); inp.select();
    return;
  }
  state.ais.push({ id: 'ai-' + Date.now() + '-' + Math.random().toString(36).slice(2), name, status: 'available', resetTime: '', sessions: [], showAll: false, notes: '', avatar: AVATAR_LOGOS.default }); // B-202605-079: componente random evita colisión en mismo ms
  if (typeof closeModal === 'function') closeModal('add-modal');
  document.getElementById('add-modal').classList.remove('open');
  save();
  if (typeof switchTab === 'function' && currentTab !== 'tracker') switchTab('tracker'); else render();
  showToast('success', 'IA agregada');
}

// ── Eliminar / limpiar ──
function confirmClear(id) {
  const ai = getAI(id);
  const sess = getAISessions(id);
  if (!sess.length) { showToast('warning', 'Sin sesiones'); return; }
  showInlineConfirm(id, 'clear', `¿Eliminar las ${sess.length} sesiones de "${ai.name}"?`);
}

function deleteAI(id) {
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
    saveImmediate(); if (typeof render === 'function') render();
  }
}

// ── T-202604-049: Menú ⋯ en cards ──
// B-202605-020: el dropdown se mueve a document.body al abrir para escapar de
// ancestros con overflow:auto (.tracker-col--card) que rompen position:fixed.
// Al cerrar se devuelve al wrap original para mantener la estructura del DOM.

function toggleCardMenu(id, e) {
  e.stopPropagation();
  const dd = document.getElementById('dotmenu-' + id);
  if (!dd) return;
  const isOpen = dd.classList.contains('open');
  // Cerrar cualquier otro menú abierto (devuelve al wrap si está en body)
  document.querySelectorAll('.card-dot-dropdown.open').forEach(el => {
    const elId = el.id.replace('dotmenu-', '');
    _closeCardMenuPortal(elId);
  });
  if (!isOpen) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    // B-202605-042: limpiar coordenadas antes de mover para evitar flash de posición anterior.
    // Las coordenadas se aplican DESPUÉS del appendChild — el nodo llega a body sin posición
    // stale visible, luego recibe las nuevas coordenadas y .open en el mismo tick sincrónico.
    // B-202605-020: min-width declarado en CSS (188px) — offsetWidth es 0 con display:none
    const menuWidth = 188;
    dd.style.top  = '';
    dd.style.left = '';
    dd.dataset.wrapId = 'dotmenu-wrap-' + id;
    // B-202605-044: guardar referencia al trigger para devolver foco al cerrar por Escape
    dd.dataset.triggerId = id;
    document.body.appendChild(dd);
    // Coordenadas post-appendChild — previene flash de posición stale
    dd.style.top  = (rect.bottom + 4) + 'px';
    dd.style.left = (rect.right - menuWidth) + 'px';
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

function closeCardMenu(id) {
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
function archiveAI(id) {
  const ai = getAI(id);
  if (!ai) return;
  ai.archived = !ai.archived;
  saveImmediate(); if (typeof render === 'function') render();
  showToast('info', ai.archived ? `${ai.name} archivada` : `${ai.name} restaurada`);
}

function toggleArchivedSection(btn) {
  const grid = document.getElementById('archived-grid');
  if (!grid) return;
  const open = grid.classList.toggle('open');
  localStorage.setItem('archived-open', open ? '1' : '0');
  btn.textContent = (open ? '▼' : '▶') + btn.textContent.slice(1);
}

// ── Inline confirm ──
function showInlineConfirm(id, action, msg) {
  document.querySelectorAll('.inline-confirm.open').forEach(el => el.remove());
  const card = document.getElementById('card-' + id);
  if (!card) return;
  const div = document.createElement('div');
  div.className = 'inline-confirm open'; div.id = 'iconf-' + id;
  div.addEventListener('click', e => e.stopPropagation());
  div.innerHTML = `
    <div class="inline-confirm-msg">${esc(msg)}</div>
    <div class="inline-confirm-actions">
      <button class="btn-danger" onclick="executeConfirm('${id}','${action}')">Confirmar</button>
      <button onclick="closeInlineConfirm('${id}')">Cancelar</button>
    </div>`;
  card.appendChild(div);
}

function closeInlineConfirm(id) {
  const el = document.getElementById('iconf-' + id);
  if (el) el.remove();
}

function executeConfirm(id, action) {
  closeInlineConfirm(id);
  if (action === 'clear') {
    const ai = getAI(id);
    // v3: eliminar sesiones de esta IA de todos los proyectos
    (state.projects || []).forEach(proj => {
      if (proj.sessions) proj.sessions = proj.sessions.filter(s => s.aiId !== id);
    });
    saveImmediate(); if (typeof render === 'function') render(); showToast('success', `Historial de ${ai.name} limpiado`);
  } else if (action === 'delete') {
    state.ais = state.ais.filter(a => a.id !== id);
    saveImmediate(); if (typeof render === 'function') render();
  }
}

// ── Window fallback para inline handlers de index.html ──
// closeModal tiene callers inline en index.html (L648, L679) — fallback evita ReferenceError si locus-workers.js no cargó.
window.closeModal = window.closeModal || function() {};
