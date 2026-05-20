// locus-misc-ui.js
// Última actualización: 2026-05-19 UTC-6
// Módulo: Helpers de UI — getNextOccurrence, _resetExpired, Tags, Pendientes, Doc Activity Drawer
// Extraído de ai-tracker-ai-notes.js

// B-202604-007: corrección — proyección correcta evita countdown vacío
function getNextOccurrence(resetTime) {
  if (!resetTime) return null;
  const [h, m] = resetTime.split(':').map(Number);
  const r = new Date(); r.setHours(h, m, 0, 0);
  if (r <= new Date()) r.setDate(r.getDate() + 1);
  return r;
}
// B-202604-009: usa epoch absoluto cuando está disponible — evita liberar IAs por coincidencia de hora
function _resetExpired(resetTime, resetEpoch) {
  if (!resetTime) return false;
  // Si hay epoch absoluto, comparar contra él — fuente de verdad
  if (resetEpoch) return Date.now() >= resetEpoch;
  // Fallback legacy (IAs sin epoch — estado guardado antes del fix)
  const [h, m] = resetTime.split(':').map(Number);
  const r = new Date(); r.setHours(h, m, 0, 0);
  return r <= new Date();
}

function getCD(resetTime, resetEpoch) {
  if (!resetTime) return '';
  // B-202604-009: usar epoch absoluto si está disponible
  if (resetEpoch) {
    const d = resetEpoch - Date.now();
    if (d <= 0) return '00:00:00';
    const H = Math.floor(d / 3600000), M = Math.floor((d % 3600000) / 60000), S = Math.floor((d % 60000) / 1000);
    return `${String(H).padStart(2,'0')}:${String(M).padStart(2,'0')}:${String(S).padStart(2,'0')}`;
  }
  // Fallback legacy — si ya expiró retornar 00:00:00, no proyectar +24h (B-202604-008)
  if (_resetExpired(resetTime)) return '00:00:00';
  const r = getNextOccurrence(resetTime);
  if (!r) return '';
  const d = r - new Date();
  if (d <= 0) return '00:00:00';
  const H = Math.floor(d / 3600000), M = Math.floor((d % 3600000) / 60000), S = Math.floor((d % 60000) / 1000);
  return `${String(H).padStart(2,'0')}:${String(M).padStart(2,'0')}:${String(S).padStart(2,'0')}`;
}

// T-058 + T-082: intervalo usando getNextOccurrence para consistencia con getCD()
setInterval(() => {
  let changed = false;
  state.ais.forEach(ai => {
    if (ai.status !== 'exhausted' || !ai.resetTime) return;
    // B-202604-009: pasar resetEpoch a _resetExpired para comparación exacta
    if (_resetExpired(ai.resetTime, ai.resetEpoch)) {
      ai.status = 'available';
      ai.resetTime = '';
      ai.resetEpoch = null;
      changed = true;
      showToast('info', `${ai.name} ya disponible`);
      return;
    }
    const cd = getCD(ai.resetTime, ai.resetEpoch);
    const el = document.getElementById('cd-' + ai.id);
    if (el) el.textContent = cd || '--:--:--';
  });
  if (changed) {
    save(); render();
    if (currentTab === 'hoy') renderHoy();
  }
  updateStats();
  renderStatusBar();
}, 1000);

// ── Tags ──
function openTagModal(aiId, sessId) {
  if (typeof _saveModalTrigger === 'function') _saveModalTrigger('tag-modal');
  tagModalAIId = aiId; tagModalSessId = sessId; selectedColor = 0;
  renderTagPicker(); renderColorPicker();
  document.getElementById('tag-new-input').value = '';
  document.getElementById('tag-modal').classList.add('open');
  setTimeout(() => document.getElementById('tag-new-input').focus(), 80);
}
function renderTagPicker() {
  const found = tagModalSessId ? _findSession(tagModalSessId) : null;
  const s = found ? found.sess : null;
  const selected = s ? s.tags || [] : [];
  const list = document.getElementById('tag-picker-list');
  if (!list) return;
  if (!state.tags.length) { list.innerHTML = `<div class="pi-no-ac">Sin etiquetas aún — crea una abajo</div>`; return; }
  list.innerHTML = state.tags.map(t => {
    const ci = TAG_COLORS.indexOf(t.color);
    const isSel = selected.includes(t.id);
    return `<div class="tag-picker-row${isSel ? ' selected' : ''}" onclick="toggleTagOnSession('${t.id}')">
      <div class="tag-picker-dot" style="--dot-color:${t.color}"></div>
      <div class="tag-picker-name">${esc(t.name)}</div>
      ${isSel ? `<span class="tag-picker-check">✓</span>` : ''}
    </div>`;
  }).join('');
}
function renderColorPicker() {
  const row = document.getElementById('color-picker-row');
  if (!row) return;
  row.innerHTML = TAG_COLORS.map((c, i) =>
    `<div class="color-dot-btn${i === selectedColor ? ' sel' : ''}" style="--dot-color:${c}" onclick="selectColor(${i})"></div>`
  ).join('');
}
function selectColor(i) { selectedColor = i; renderColorPicker(); }
function toggleTagOnSession(tagId) {
  const found = tagModalSessId ? _findSession(tagModalSessId) : null;
  const s = found ? found.sess : null;
  if (!s) return;
  if (!s.tags) s.tags = [];
  const idx = s.tags.indexOf(tagId);
  if (idx >= 0) s.tags.splice(idx, 1); else s.tags.push(tagId);
  save(); renderTagPicker(); render();
  if (popAIId === tagModalAIId && popSessId === tagModalSessId) openDetail(tagModalAIId, tagModalSessId);
}
function addNewTag() {
  const name = document.getElementById('tag-new-input').value.trim();
  if (!name) { showToast('warning', 'Escribe un nombre'); return; }
  if (state.tags.find(t => t.name.toLowerCase() === name.toLowerCase())) { showToast('warning', 'Ya existe esa etiqueta'); return; }
  const tag = {id:'tag-'+Date.now(), name, color:TAG_COLORS[selectedColor]};
  state.tags.push(tag);
  const found = tagModalSessId ? _findSession(tagModalSessId) : null;
  const s = found ? found.sess : null;
  if (s) { if (!s.tags) s.tags = []; s.tags.push(tag.id); }
  save(); renderTagPicker(); renderColorPicker(); render();
  document.getElementById('tag-new-input').value = '';
  showToast('success', `Etiqueta "${name}" creada`);
}

// ── Pendientes panel ──
function openPendPanel() {
  const body = document.getElementById('pend-panel-body');
  let html = ''; let total = 0;
  state.ais.forEach(ai => {
    const aiSess = getAISessions(ai.id);
    const withPending = aiSess.filter(s => s.pending && s.pending.trim());
    if (!withPending.length) return;
    total += withPending.length;
    const dotColor = ai.status === 'available' ? 'var(--green)' : 'var(--red)';
    html += `<div class="pend-ai-group">
      <div class="pend-ai-name"><span class="pend-ai-dot" style="--ai-dot-color:${dotColor}"></span>${esc(ai.name)}</div>`;
    [...withPending].reverse().forEach(s => {
      html += `<div class="pend-item" onclick="closePendPanel();openDetail('${ai.id}','${s.id}')">
        <div class="pend-item-pending">${esc(s.pending)}</div>
        <div class="pend-item-meta">${esc(s.title)} · ${s.dateShort || ''}</div>
      </div>`;
    });
    html += '</div>';
  });
  body.innerHTML = total ? html : `<div class="pend-empty">🎉 Sin pendientes — todo resuelto</div>`;
  document.getElementById('pend-overlay').classList.add('open');
}
function closePendPanel() {
  document.getElementById('pend-overlay').classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus('pend-overlay');
}

// B-202604-138: modal standalone de CHECKPOINT — merge de ítems sin crear sesión de IA
function openStandaloneCheckpoint() {
  // R-202604-047: shell estático en index.html — solo inject content + classList
  const overlay = document.getElementById('standalone-ckpt-overlay');
  if (!overlay) return;
  overlay.classList.remove('force-hidden');
  overlay.classList.add('open');
  setTimeout(() => {
    const ta = document.getElementById('standalone-ckpt-ta');
    if (ta) ta.focus();
  }, 80);
}

function closeStandaloneCheckpoint() {
  const overlay = document.getElementById('standalone-ckpt-overlay');
  // B-new: forzar display:none además de quitar clase open
  // El overlay tiene z-index:9200 > item-viz-overlay(8500) — si solo se quita .open
  // puede seguir bloqueando visualmente el panel diff que se abre inmediatamente después.
  if (overlay) { overlay.classList.remove('open'); overlay.classList.add('force-hidden'); }
}

// ── Doc Activity Drawer ──

let _docLogDrawerOpen = false;

function openDocLog(doc) {
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

function closeDocLog() {
  _docLogDrawerOpen = false;
  const drawer = document.getElementById('doc-log-drawer');
  const overlay = document.getElementById('doc-log-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  // T-202604-300: restaurar posición por defecto del toast-stack
  document.documentElement.style.removeProperty('--toast-right-offset');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus('doc-log-overlay');
}

function _updateDocLogCount(doc) {
  const btnId = { backlog: 'doc-log-btn-backlog', context: 'doc-log-btn-context', htmlmap: 'doc-log-btn-htmlmap' }[doc];
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const key = doc === 'context' ? 'context-log' : doc === 'htmlmap' ? 'html-map-log' : 'backlog-log';
  let log = [];
  try { log = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  const badge = btn.querySelector('.doc-log-count');
  if (badge) badge.textContent = log.length ? log.length : '';
}

function _renderDocLog(doc) {
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
      <span class="doc-log-action">${icon} ${esc(e.action)}</span>
      ${e.code ? `<span class="doc-log-code">${esc(e.code)}</span>` : ''}
      ${e.detail ? `<span class="doc-log-detail">${esc(e.detail)}</span>` : ''}
    </div>`;
  }).join('');
}

function clearDocLog() {
  const drawer = document.getElementById('doc-log-drawer');
  const doc = drawer ? drawer.getAttribute('data-doc') : 'backlog';
  const key = doc === 'context' ? 'context-log' : doc === 'htmlmap' ? 'html-map-log' : 'backlog-log';
  try { localStorage.removeItem(key); } catch {}
  _renderDocLog(doc);
  // update count badge
  _updateDocLogCount(doc);
}


// ── Search — extraído a locus-ui-shell.js ────────────────────────────────
// _searchScopeAll, _toggleSearchScope, onSearch
// ─────────────────────────────────────────────────────────────────────────
