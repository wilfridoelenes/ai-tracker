
function toggleNotes(id) {
  const textEl = document.getElementById('notes-text-' + id);
  const toggleEl = document.getElementById('notes-toggle-' + id);
  if (!textEl || !toggleEl) return;
  const expanded = textEl.classList.toggle('expanded');
  toggleEl.textContent = expanded ? '▴ ver menos' : '▾ ver más';
}

// ── T-011: Avatar selector ──
let avatarModalAIId = null;
let selectedAvatarKey = null;

function openAvatarModal(aiId) {
  if (typeof _saveModalTrigger === 'function') _saveModalTrigger('avatar-modal');
  const ai = getAI(aiId);
  if (!ai) return;
  avatarModalAIId = aiId;
  
  // Detectar el logo actual para pre-seleccionar
  const currentLogoKey = Object.entries(AVATAR_LOGOS).find(([k, v]) => v === ai.avatar)?.[0] || null;
  selectedAvatarKey = currentLogoKey;
  
  // Generar grid de avatares
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
  // Si está abierto el detail popup, actualizar avatar allí también
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
    showToast('warning', `Ya existe una IA llamada "${duplicate.name}"`);
    const inp = document.getElementById('new-name');
    inp.focus(); inp.select();
    return;
  }
  state.ais.push({id:'ai-'+Date.now()+'-'+Math.random().toString(36).slice(2), name, status:'available', resetTime:'', sessions:[], showAll:false, notes:'', avatar:AVATAR_LOGOS.default}); // B-202605-079: componente random evita colisión en mismo ms
  save(); closeModal('add-modal');
  if (currentTab !== 'tracker') switchTab('tracker'); else render();
  showToast('success', 'IA agregada');
}

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
    save(); render();
  }
}

// R-005: Exportación markdown de sesiones por IA
function downloadReport(id) {
  const ai = getAI(id);
  const aiSess = getAISessions(id);
  if (!ai || aiSess.length < 2) return;

  const sorted = [...aiSess].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const dateFirst = sorted[0].dateShort || sorted[0].date?.slice(0,10) || '—';
  const dateLast  = sorted[sorted.length - 1].dateShort || sorted[sorted.length - 1].date?.slice(0,10) || '—';
  const nowYM = new Date().toISOString().slice(0,7);

  let md = `# ${ai.name} — Reporte de sesiones\n\n`;
  md += `**Período:** ${dateFirst} → ${dateLast}  \n`;
  md += `**Total sesiones:** ${aiSess.length}  \n`;
  md += `\n---\n\n`;
  md += `| Fecha | Título | Resumen | Items TG |\n`;
  md += `|-------|--------|---------|----------|\n`;

  const tracker = getActiveTracker();
  [...sorted].reverse().forEach(s => {
    const fecha = s.dateShort || s.date?.slice(0,10) || '—';
    const titulo = (s.title || '—').replace(/\|/g, '\\|');
    const resumen = (s.summary || '—').replace(/\n/g, ' ').replace(/\|/g, '\\|');
    const tgItems = (tracker.items || []).filter(x => x.sessionId === s.id);
    const tgStr = tgItems.length > 0
      ? tgItems.map(x => x.code || `${x.type}-?`).join(', ')
      : '—';
    md += `| ${fecha} | ${titulo} | ${resumen} | ${tgStr} |\n`;
  });

  const safeName = (ai.name || 'IA').replace(/[^a-zA-Z0-9_-]/g, '-');
  const filename = `${safeName}-sesiones-${nowYM}.md`;
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast('download', `📥 Reporte descargado: ${filename}`);
}

// T-095: Reporte multi-IA — exportar todas las IAs no archivadas en un solo markdown
function downloadGlobalReport() {
  const activeAIs = state.ais.filter(a => !a.archived);
  const allSess = getAllSessions();
  const activeAIsWithSess = activeAIs.filter(ai => allSess.some(s => s.aiId === ai.id));
  if (!activeAIsWithSess.length) { showToast('warning', 'Sin IAs con sesiones para reportar'); return; }

  const now = new Date();
  const dateStr = now.toISOString().slice(0,10);
  const totalSess = allSess.filter(s => activeAIs.some(a => a.id === s.aiId)).length;

  // Encabezado global
  let md = `# Locus — Reporte global\n\n`;
  md += `**Exportado:** ${dateStr}  \n`;
  md += `**IAs activas:** ${activeAIsWithSess.length}  \n`;
  md += `**Sesiones totales:** ${totalSess}  \n`;
  md += `\n---\n\n`;

  const tracker = getActiveTracker();
  activeAIsWithSess.forEach((ai, idx) => {
    const aiSess = allSess.filter(s => s.aiId === ai.id);
    const sorted = [...aiSess].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const dateFirst = sorted[0]?.dateShort || sorted[0]?.date?.slice(0,10) || '—';
    const dateLast  = sorted[sorted.length - 1]?.dateShort || sorted[sorted.length - 1]?.date?.slice(0,10) || '—';

    md += `## ${ai.name}\n\n`;
    md += `**Período:** ${dateFirst} → ${dateLast}  \n`;
    md += `**Total sesiones:** ${aiSess.length}  \n`;
    md += `\n`;
    md += `| Fecha | Título | Resumen | Items TG |\n`;
    md += `|-------|--------|---------|----------|\n`;

    [...sorted].reverse().forEach(s => {
      const fecha = s.dateShort || s.date?.slice(0,10) || '—';
      const titulo = (s.title || '—').replace(/\|/g, '\\|');
      const resumen = (s.summary || '—').replace(/\n/g, ' ').replace(/\|/g, '\\|');
      const tgItems = (tracker.items || []).filter(x => x.sessionId === s.id);
      const tgStr = tgItems.length > 0 ? tgItems.map(x => x.code || `${x.type}-?`).join(', ') : '—';
      md += `| ${fecha} | ${titulo} | ${resumen} | ${tgStr} |\n`;
    });

    if (idx < activeAIsWithSess.length - 1) md += `\n---\n\n`;
  });

  const filename = `ai-tracker-reporte-${dateStr}.md`;
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast('download', `📥 Reporte global: ${filename}`);
}

// T-202604-049: Menú ⋯ en cards
function toggleCardMenu(id, e) {
  e.stopPropagation();
  const dd = document.getElementById('dotmenu-' + id);
  if (!dd) return;
  const isOpen = dd.classList.contains('open');
  // Cerrar todos los menús abiertos
  document.querySelectorAll('.card-dot-dropdown.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) dd.classList.add('open');
}
function closeCardMenu(id) {
  const dd = document.getElementById('dotmenu-' + id);
  if (dd) dd.classList.remove('open');
}
// Cerrar menú al click fuera
document.addEventListener('click', function() {
  document.querySelectorAll('.card-dot-dropdown.open').forEach(el => el.classList.remove('open'));
});

// T-033: Archivar / restaurar IA
function archiveAI(id) {
  const ai = getAI(id);
  if (!ai) return;
  ai.archived = !ai.archived;
  save(); render();
  showToast('info', ai.archived ? `${ai.name} archivada` : `${ai.name} restaurada`);
}
function toggleArchivedSection(btn) {
  const grid = document.getElementById('archived-grid');
  if (!grid) return;
  const open = grid.classList.toggle('open');
  localStorage.setItem('archived-open', open ? '1' : '0');
  btn.textContent = (open ? '▼' : '▶') + btn.textContent.slice(1);
}
function showInlineConfirm(id, action, msg) {
  document.querySelectorAll('.inline-confirm.open').forEach(el => el.remove());
  const card = document.getElementById('card-' + id);
  if (!card) return;
  const div = document.createElement('div');
  div.className = 'inline-confirm open'; div.id = 'iconf-' + id;
  div.innerHTML = `
    <div class="inline-confirm-msg">${esc(msg)}</div>
    <div class="inline-confirm-actions">
      <button class="btn-danger" onclick="executeConfirm('${id}','${action}')">Confirmar</button>
      <button onclick="closeInlineConfirm('${id}')">Cancelar</button>
    </div>`;
  card.appendChild(div);
}
function closeInlineConfirm(id) { const el = document.getElementById('iconf-' + id); if (el) el.remove(); }
function executeConfirm(id, action) {
  closeInlineConfirm(id);
  if (action === 'clear') {
    const ai = getAI(id);
    // v3: eliminar sesiones de esta IA de todos los proyectos
    (state.projects || []).forEach(proj => {
      if (proj.sessions) proj.sessions = proj.sessions.filter(s => s.aiId !== id);
    });
    save(); render(); showToast('success', `Historial de ${ai.name} limpiado`);
  }
  else if (action === 'delete') { state.ais = state.ais.filter(a => a.id !== id); save(); render(); }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus(id);
}

// T-202604-005: Escape closes inline confirm
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.inline-confirm.open').forEach(el => el.remove());
    const m = document.getElementById('more-menu'); if (m) m.classList.add('hidden');
    // Cerrar panel CHECKPOINT con Escape
    const ckpt = document.getElementById('ckpt-panel');
    if (ckpt && ckpt.classList.contains('open')) closeCkptPanel();
  }
  // B-202604-002: Ctrl+Z / Ctrl+Shift+Z undo/redo — solo en sub-tab backlog, sin foco en input
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.altKey) {
    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || activeEl.isContentEditable);
    if (!isInput && currentSubTab === 'backlog') {
      e.preventDefault();
      if (e.shiftKey) redoBacklog();
      else undoBacklog();
    }
  }
});

// Cerrar panel CHECKPOINT con click fuera
document.addEventListener('click', e => {
  const ckpt = document.getElementById('ckpt-panel');
  if (ckpt && ckpt.classList.contains('open') && !ckpt.contains(e.target)) closeCkptPanel();
}, true);
// T-202604-005: Click outside card closes inline confirm
document.addEventListener('click', e => {
  if (!e.target.closest('.inline-confirm') && !e.target.closest('.btn-danger-ghost')) {
    document.querySelectorAll('.inline-confirm.open').forEach(el => el.remove());
  }
  // T-202604-009: close more-menu on outside click
  if (!e.target.closest('#more-menu-wrap')) {
    const m = document.getElementById('more-menu'); if (m) m.classList.add('hidden');
  }
});

// T-202604-009: toggle ⋯ dropdown
// B — position:fixed para escapar overflow:hidden del header (Nova 2026-05-12)
function toggleMoreMenu() {
  const m   = document.getElementById('more-menu');
  const btn = document.getElementById('more-menu-btn');
  if (!m) return;

  const isHidden = m.classList.contains('hidden');

  if (isHidden) {
    // Anclar coords relativas al viewport — necesario porque .more-menu usa position:fixed
    if (btn) {
      const rect = btn.getBoundingClientRect();
      m.style.top   = rect.bottom + 6 + 'px';
      m.style.right = window.innerWidth - rect.right + 'px';
      m.style.left  = 'auto';
    }
    m.classList.remove('hidden');

    // T-202604-295: sync checked state desde localStorage — shell estático en index.html
    const cur = (typeof _templateTrigger === 'function' ? _templateTrigger() : 'session');
    const sesRad = document.getElementById('tmpl-trigger-session');
    const sprRad = document.getElementById('tmpl-trigger-sprint');
    if (sesRad) sesRad.checked = cur === 'session';
    if (sprRad) sprRad.checked = cur === 'sprint';

    // Cerrar al hacer click fuera del menú
    const _closeOnOutside = (e) => {
      if (!m.contains(e.target) && e.target !== btn) {
        m.classList.add('hidden');
        document.removeEventListener('mousedown', _closeOnOutside);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', _closeOnOutside), 0);
  } else {
    m.classList.add('hidden');
  }
}
document.querySelectorAll('.modal-overlay,.popup-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) { el.classList.remove('open'); if (el.id === 'detail-popup') { popAIId = null; popSessId = null; } } });
});

function exportData() {
  // Bundlear claves de localStorage por proyecto — context, html-map
  // backlog viene de ITEMS en memoria (Supabase) + localStorage como fallback
  const _DOC_KEYS = [
    'context-raw', 'context-sections', 'context-meta',
    'html-map-raw', 'html-map-sections', 'html-map-meta'
  ];
  const exportedAt = Date.now();
  const docs = {};
  (state.projects || []).forEach(p => {
    const projDocs = {};
    _DOC_KEYS.forEach(key => {
      const val = localStorage.getItem(key + '-' + p.id);
      if (val) projDocs[key] = val;
    });
    // Backlog: serializar ITEMS en memoria si corresponden a este proyecto
    // Con Supabase activo el backlog no siempre vive en localStorage
    const activeProjId = _getActiveProjectFilter ? _getActiveProjectFilter() : null;
    if (activeProjId === p.id || (!activeProjId && p === (state.projects || [])[0])) {
      if (typeof ITEMS !== 'undefined' && ITEMS.length > 0) {
        const meta = JSON.parse(localStorage.getItem('backlog-meta-' + p.id) || '{}');
        meta._exportedAt = exportedAt;
        projDocs['backlog-items'] = JSON.stringify(ITEMS);
        projDocs['backlog-meta']  = JSON.stringify(meta);
      }
    } else {
      // Proyecto no activo — leer desde localStorage si existe
      const blItems = localStorage.getItem('backlog-items-' + p.id);
      if (blItems) {
        const meta = JSON.parse(localStorage.getItem('backlog-meta-' + p.id) || '{}');
        meta._exportedAt = exportedAt;
        projDocs['backlog-items'] = blItems;
        projDocs['backlog-meta']  = JSON.stringify(meta);
      }
    }
    if (Object.keys(projDocs).length) docs[p.id] = projDocs;
  });
  const exportObj = { ...state, _exportedAt: exportedAt };
  if (Object.keys(docs).length) exportObj._docs = docs;
  const b = new Blob([JSON.stringify(exportObj, null, 2)], {type:'application/json'});
  const u = URL.createObjectURL(b); const a = document.createElement('a');
  a.href = u; a.download = 'ai-tracker-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click(); URL.revokeObjectURL(u); showToast('download', 'Backup exportado');
}

// ── T-090: Generic confirm/prompt modal ──
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
    wrap.classList.remove('hidden');
    document.getElementById('gconfirm-input-label').textContent = inputLabel;
    const inp = document.getElementById('gconfirm-input');
    inp.placeholder = inputPlaceholder;
    inp.value = '';
    setTimeout(() => inp.focus(), 60);
  } else {
    wrap.classList.add('hidden');
  }
  document.getElementById('gconfirm-overlay').classList.add('open');
}
function _gconfirmClose() {
  document.getElementById('gconfirm-overlay').classList.remove('open');
  _gconfirmCb = null;
}
function _gconfirmOk() {
  const inputWrap = document.getElementById('gconfirm-input-wrap');
  const val = !inputWrap.classList.contains('hidden') ? document.getElementById('gconfirm-input').value.trim() : null;
  document.getElementById('gconfirm-overlay').classList.remove('open');
  if (_gconfirmCb) { const cb = _gconfirmCb; _gconfirmCb = null; cb(val); }
}

// ── T-038: Purgar sesiones antiguas ──
function purgeOldSessions() {
  // T-090: abrir modal inline en lugar de prompt() nativo
  openPurgeModal();
}
function openPurgeModal() {
  document.getElementById('purge-months-input').value = '3';
  document.getElementById('purge-confirm-btn').disabled = true;
  document.getElementById('purge-preview').textContent = 'Ingresa un número de meses para ver el conteo.';
  document.getElementById('purge-preview').className = 'purge-preview empty';
  document.getElementById('purge-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('purge-months-input').focus(), 50);
}
function closePurgeModal() {
  document.getElementById('purge-modal-overlay').classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus('purge-modal-overlay');
}

function toggleBacklogDangerZone() {
  const body = document.getElementById('backlog-danger-body');
  if (!body) return;
  body.classList.toggle('hidden');
}

function openResetBacklogModal() {
  if (typeof _saveModalTrigger === 'function') _saveModalTrigger('reset-backlog-overlay');
  const input = document.getElementById('reset-backlog-input');
  if (input) { input.value = ''; }
  const btn = document.getElementById('reset-backlog-confirm-btn');
  if (btn) btn.disabled = true;
  document.getElementById('reset-backlog-overlay').classList.add('open');
  if (typeof _focusFirstInteractive === 'function') _focusFirstInteractive('reset-backlog-overlay');
}

function closeResetBacklogModal() {
  document.getElementById('reset-backlog-overlay').classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus('reset-backlog-overlay');
}

function confirmResetBacklog() {
  const input = document.getElementById('reset-backlog-input');
  if (!input || input.value.trim() !== 'RESET') return;
  // Vaciar ITEMS en memoria y persistir
  ITEMS.length = 0;
  localStorage.removeItem(_tplKey('backlog-items'));
  localStorage.removeItem(_tplKey('backlog-meta'));
  localStorage.removeItem('backlog-raw');
  // saveBacklog persiste ITEMS=[] — también sincroniza a Supabase si el usuario está autenticado
  saveBacklog();

  // AC-9: borrar backlog en Supabase cuando el usuario está autenticado
  if (typeof _supabase !== 'undefined' && _supabase &&
      typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    (async () => {
      try {
        const projId = (typeof _getActiveProjectFilter === 'function') ? _getActiveProjectFilter() : null;
        const suffix = projId ? '-' + projId : '-global';
        const { error } = await _supabase
          .from('tracker_backlog')
          .delete()
          .eq('user_id', _supabaseUser.id)
          .in('key', ['items' + suffix, 'meta' + suffix]);
        if (error) throw error;
        if (typeof setSyncStatus === 'function') setSyncStatus('synced', '✓ sincronizado');
      } catch (err) {
        console.error('[AI Tracker] confirmResetBacklog: Supabase sync error:', err);
        if (typeof setSyncStatus === 'function') setSyncStatus('offline', '✕ sin conexión');
        if (typeof _offlineQueuePush === 'function') _offlineQueuePush({ type: 'backlog' });
        showToast('warning', '⚠️ Reset local aplicado — Supabase se sincronizará al reconectar');
      }
    })();
  }

  closeResetBacklogModal();
  _updateSubTabButtons('backlog');
  renderBacklogList();
  updateBacklogBanner();
  renderStats();
  showToast('success', 'Backlog reseteado — ya puedes importar un nuevo Backlog.md');
}
function toggleSidebarDanger() {
  const body = document.getElementById('tpl-danger-body');
  if (!body) return;
  body.classList.toggle('open');
}

function resetContextData() {
  _gconfirmOpen({
    title: '🗑 Resetear Context',
    msg: 'Se eliminará el Context importado. Tendrás que re-importar el CONTEXT.md desde cero. Esta acción es irreversible.',
    okLabel: 'Resetear',
    danger: true,
  }, () => {
    localStorage.removeItem(_tplKey('context-raw'));
    localStorage.removeItem(_tplKey('context-sections'));
    localStorage.removeItem(_tplKey('context-meta'));
    saveContextDocs();
    _contextModifiedInSession = false;
    _contextSectionsTouched = [];
    renderContext();
    updateContextBanner();
    _updateSubTabButtons('context');
    showToast('success', 'Context reseteado — ya puedes importar un nuevo CONTEXT.md');
  });
}

function resetHtmlMapData() {
  _gconfirmOpen({
    title: '🗑 Resetear Module Map',
    msg: 'Se eliminará el Module Map importado. Tendrás que re-importar el HTML-MAP.md desde cero. Esta acción es irreversible.',
    okLabel: 'Resetear',
    danger: true,
  }, () => {
    localStorage.removeItem(_tplKey('html-map-raw'));
    localStorage.removeItem(_tplKey('html-map-sections'));
    localStorage.removeItem(_tplKey('html-map-meta'));
    HTML_MAP_SECTIONS = [];
    saveContextDocs();
    _htmlMapModifiedInSession = false;
    loadHtmlMap();
    renderHtmlMap();
    updateHtmlMapBanner();
    showToast('success', 'Module Map reseteado — ya puedes importar un nuevo HTML-MAP.md');
  });
}

function _calcPurgeCount(months) {
  if (isNaN(months) || months < 1) return -1;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  let total = 0;
  getAllSessions().forEach(s => {
    if (!s.date) return;
    const d = new Date(s.date);
    if (!isNaN(d.getTime()) && d < cutoff) total++;
  });
  return total;
}
function updatePurgePreview() {
  const months = parseInt(document.getElementById('purge-months-input').value);
  const prev = document.getElementById('purge-preview');
  const btn = document.getElementById('purge-confirm-btn');
  const total = _calcPurgeCount(months);
  if (total < 0) {
    prev.className = 'purge-preview empty';
    prev.textContent = 'Ingresa un número válido de meses.';
    btn.disabled = true; return;
  }
  if (total === 0) {
    prev.className = 'purge-preview empty';
    prev.textContent = `Sin sesiones anteriores a ${months} mes${months !== 1 ? 'es' : ''}.`;
    btn.disabled = true; return;
  }
  prev.className = 'purge-preview';
  prev.innerHTML = `Se eliminarán <strong>${total} sesión${total !== 1 ? 'es' : ''}</strong> anteriores a ${months} mes${months !== 1 ? 'es' : ''}. Esta acción no se puede deshacer.`;
  btn.disabled = false;
}
function confirmPurge() {
  const months = parseInt(document.getElementById('purge-months-input').value);
  const total = _calcPurgeCount(months);
  if (total <= 0) return;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  (state.projects || []).forEach(proj => {
    proj.sessions = (proj.sessions || []).filter(s => {
      if (!s.date) return true;
      const d = new Date(s.date);
      return isNaN(d.getTime()) || d >= cutoff;
    });
  });
  save(); render(); closePurgeModal();
  showToast('success', `${total} sesión${total !== 1 ? 'es' : ''} eliminadas`);
}
let _pendingImportData = null;
function importData(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (!d.ais) throw new Error('invalid');
      // T-091: mostrar diff modal antes de importar
      _pendingImportData = d;
      _showImportDiff(d);
    } catch {
      showToast('error', 'Archivo inválido — verifica el formato JSON');
    }
  };
  r.readAsText(f); e.target.value = '';
}
// Cuenta sesiones desde projects[].sessions (formato v3 nativo)
function _importCountSessions(d) {
  return (d.projects || []).reduce((a, p) => a + (p.sessions ? p.sessions.length : 0), 0);
}

function _showImportDiff(d) {
  const incomingAIs = d.ais.length;
  // Leer sesiones desde projects[].sessions (v3) con fallback a ais[].sessions (v2/legacy)
  const incomingSess = _importCountSessions(d) ||
    d.ais.reduce((a, x) => a + (x.sessions ? x.sessions.length : 0), 0);

  const currentAIs = state.ais || [];
  const currentNames = new Set(currentAIs.map(a => a.name.toLowerCase()));
  const newAIs = d.ais.filter(a => !currentNames.has(a.name.toLowerCase()));
  const existingAIs = d.ais.filter(a => currentNames.has(a.name.toLowerCase()));

  // Contar sesiones nuevas: diferencia por session.id entre proyectos entrantes y actuales
  const currentSessIds = new Set(
    (state.projects || []).flatMap(p => (p.sessions || []).map(s => s.id))
  );
  const incomingSessIds = new Set(
    (d.projects || []).flatMap(p => (p.sessions || []).map(s => s.id))
  );
  // Fallback v2: sesiones en ais[].sessions
  d.ais.forEach(ai => (ai.sessions || []).forEach(s => incomingSessIds.add(s.id)));
  const sessToAdd = [...incomingSessIds].filter(id => !currentSessIds.has(id)).length;

  // Contar proyectos nuevos
  const currentProjIds = new Set((state.projects || []).map(p => p.id));
  const newProjects = (d.projects || []).filter(p => !currentProjIds.has(p.id));

  // Fecha del backup
  const exportedAt = d._exportedAt;
  const backupDateStr = exportedAt
    ? new Date(exportedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Desconocida';

  // Comparar docs del backup vs local por timestamp
  let docsNewer = 0, docsOlder = 0, docsNew = 0;
  if (d._docs) {
    Object.entries(d._docs).forEach(([projId, projDocs]) => {
      const backupMeta = (() => { try { return JSON.parse(projDocs['backlog-meta'] || '{}'); } catch { return {}; } })();
      const localMetaRaw = localStorage.getItem('backlog-meta-' + projId);
      const localMeta = (() => { try { return JSON.parse(localMetaRaw || '{}'); } catch { return {}; } })();
      const backupTs = backupMeta._exportedAt || 0;
      const localTs  = localMeta._exportedAt  || localMeta.importedAt || 0;
      if (!localMetaRaw) docsNew++;
      else if (backupTs > localTs) docsNewer++;
      else docsOlder++;
    });
  }
  const docsCount = docsNew + docsNewer + docsOlder;

  const inc = document.getElementById('import-diff-incoming');
  inc.innerHTML = `
    <div class="modal-title import-diff-section-label">ARCHIVO A IMPORTAR</div>
    <div class="import-diff-row"><span class="import-diff-label">Fecha backup</span><span class="import-diff-val">${backupDateStr}</span></div>
    <div class="import-diff-row"><span class="import-diff-label">IAs</span><span class="import-diff-val">${incomingAIs}</span></div>
    <div class="import-diff-row"><span class="import-diff-label">Sesiones totales</span><span class="import-diff-val">${incomingSess}</span></div>
    ${docsCount > 0 ? `<div class="import-diff-row"><span class="import-diff-label">Docs incluidos</span><span class="import-diff-val">${docsCount}</span></div>` : ''}
  `;
  const ch = document.getElementById('import-diff-changes');
  const docsStatus = docsCount === 0 ? '' :
    docsNew > 0 && docsNewer === 0 && docsOlder === 0
      ? `<div class="import-diff-row"><span class="import-diff-label">Docs</span><span class="import-diff-val new">+${docsNew} nuevos</span></div>`
      : `<div class="import-diff-row"><span class="import-diff-label">Docs más recientes</span><span class="import-diff-val ${docsNewer > 0 ? 'new' : ''}">${docsNewer}</span></div>
         <div class="import-diff-row"><span class="import-diff-label">Docs locales más nuevos</span><span class="import-diff-val">${docsOlder}</span></div>
         ${docsNew > 0 ? `<div class="import-diff-row"><span class="import-diff-label">Docs nuevos</span><span class="import-diff-val new">+${docsNew}</span></div>` : ''}`;
  ch.innerHTML = `
    <div class="modal-title import-diff-section-label">CAMBIOS VS ESTADO ACTUAL</div>
    <div class="import-diff-row"><span class="import-diff-label">IAs nuevas</span><span class="import-diff-val ${newAIs.length > 0 ? 'new' : ''}">+${newAIs.length}</span></div>
    <div class="import-diff-row"><span class="import-diff-label">IAs existentes</span><span class="import-diff-val">${existingAIs.length}</span></div>
    <div class="import-diff-row"><span class="import-diff-label">Proyectos nuevos</span><span class="import-diff-val ${newProjects.length > 0 ? 'new' : ''}">+${newProjects.length}</span></div>
    <div class="import-diff-row"><span class="import-diff-label">Sesiones a agregar</span><span class="import-diff-val ${sessToAdd > 0 ? 'new' : ''}">+${sessToAdd}</span></div>
    ${docsStatus}
  `;
  document.getElementById('import-diff-overlay').classList.add('open');
}
function closeImportDiff() {
  document.getElementById('import-diff-overlay').classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus('import-diff-overlay');
  _pendingImportData = null;
}
function confirmImport() {
  if (!_pendingImportData) return;
  const d = _pendingImportData;

  // ── Protección 1: auto-backup pre-import ──────────────────────────────────
  try {
    const backupKey = 'ai-tracker-pre-import';
    const backup = { state: JSON.parse(JSON.stringify(state)), ts: Date.now() };
    localStorage.setItem(backupKey, JSON.stringify(backup));
  } catch(e) { console.warn('[AI Tracker] No se pudo guardar pre-import backup:', e); }

  // ── Protección 2: merge de IAs por id ────────────────────────────────────
  const currentAIsById = {};
  (state.ais || []).forEach(ai => { currentAIsById[ai.id] = ai; });
  const mergedAIs = [...(state.ais || [])];
  const mergedAIIds = new Set(mergedAIs.map(a => a.id));
  (d.ais || []).forEach(incoming => {
    if (!mergedAIIds.has(incoming.id)) {
      mergedAIs.push({ ...incoming, sessions: [] });
      mergedAIIds.add(incoming.id);
    } else {
      // Actualizar campos de configuración del AI existente (sin tocar sessions)
      const cur = currentAIsById[incoming.id];
      if (cur) {
        cur.status     = incoming.status     ?? cur.status;
        cur.resetTime  = incoming.resetTime  ?? cur.resetTime;
        cur.resetEpoch = incoming.resetEpoch ?? cur.resetEpoch;
        cur.notes      = incoming.notes      ?? cur.notes;
        cur.avatar     = incoming.avatar     || cur.avatar;
        cur.archived   = incoming.archived   ?? cur.archived;
      }
    }
  });

  // ── Protección 3: merge de proyectos + sesiones por id ───────────────────
  const currentProjsById = {};
  (state.projects || []).forEach(p => { currentProjsById[p.id] = p; });
  const mergedProjects = [...(state.projects || [])];
  const mergedProjIds = new Set(mergedProjects.map(p => p.id));

  (d.projects || []).forEach(incomingProj => {
    if (!mergedProjIds.has(incomingProj.id)) {
      // Proyecto nuevo — agregar completo
      mergedProjects.push({ ...incomingProj });
      mergedProjIds.add(incomingProj.id);
    } else {
      // Proyecto existente — merge de sesiones por id
      const cur = currentProjsById[incomingProj.id];
      const curSessIds = new Set((cur.sessions || []).map(s => s.id));
      (incomingProj.sessions || []).forEach(s => {
        if (!curSessIds.has(s.id)) {
          cur.sessions.push(s);
          curSessIds.add(s.id);
        }
      });
      // Merge de sprints por id
      const curSprintIds = new Set((cur.sprints || []).map(sp => sp.id));
      (incomingProj.sprints || []).forEach(sp => {
        if (!curSprintIds.has(sp.id)) { cur.sprints.push(sp); curSprintIds.add(sp.id); }
      });
      // Merge de tracker items por id
      const curItemIds = new Set((cur.tracker?.items || []).map(i => i.id));
      (incomingProj.tracker?.items || []).forEach(item => {
        if (!curItemIds.has(item.id)) { cur.tracker.items.push(item); curItemIds.add(item.id); }
      });
    }
  });

  // Fallback v2: sesiones en ais[].sessions sin proyecto asignado
  // → agregar al primer proyecto que coincida por aiId, o al primero disponible
  const allCurrentSessIds = new Set(mergedProjects.flatMap(p => (p.sessions || []).map(s => s.id)));
  (d.ais || []).forEach(incomingAI => {
    (incomingAI.sessions || []).forEach(s => {
      if (allCurrentSessIds.has(s.id)) return;
      const targetProj = mergedProjects.find(p => (p.sessions || []).some(ps => ps.aiId === incomingAI.id))
        || mergedProjects[0];
      if (targetProj) {
        if (!targetProj.sessions) targetProj.sessions = [];
        targetProj.sessions.push({ ...s, aiId: incomingAI.id });
        allCurrentSessIds.add(s.id);
      }
    });
  });

  // ── Protección 4: restaurar docs de localStorage (_docs bundle) ─────────
  // backlog-items, context-raw, html-map-raw, etc. no viven en state{}
  // Lógica timestamp-aware: restaura si la clave está ausente O si el backup es más reciente
  let docsRestored = 0;
  if (d._docs && typeof d._docs === 'object') {
    Object.entries(d._docs).forEach(([projId, projDocs]) => {
      // Calcular timestamp del backup para este proyecto
      const backupMeta = (() => { try { return JSON.parse(projDocs['backlog-meta'] || '{}'); } catch { return {}; } })();
      const backupTs = backupMeta._exportedAt || d._exportedAt || 0;

      Object.entries(projDocs).forEach(([key, val]) => {
        const lsKey = key + '-' + projId;
        const localVal = localStorage.getItem(lsKey);

        let shouldRestore = false;
        if (!localVal) {
          // Clave ausente — restaurar siempre
          shouldRestore = true;
        } else if (key === 'backlog-meta') {
          // Para backlog-meta: comparar timestamps para decidir
          const localMeta = (() => { try { return JSON.parse(localVal || '{}'); } catch { return {}; } })();
          const localTs = localMeta._exportedAt || localMeta.importedAt || 0;
          shouldRestore = backupTs > localTs;
        } else if (key === 'backlog-items') {
          // Para backlog-items: restaurar junto con backlog-meta si el backup gana
          const localMeta = (() => { try { return JSON.parse(localStorage.getItem('backlog-meta-' + projId) || '{}'); } catch { return {}; } })();
          const localTs = localMeta._exportedAt || localMeta.importedAt || 0;
          shouldRestore = backupTs > localTs;
        }
        // context-* y html-map-*: solo restaurar si ausentes (el local siempre gana)

        if (shouldRestore) {
          try { localStorage.setItem(lsKey, val); docsRestored++; } catch(e) {}
        }
      });
    });
  }

  // ── Aplicar estado mergeado ───────────────────────────────────────────────
  state = {
    ...state,          // preservar config local (theme, tags, quickNotes)
    ais:      mergedAIs,
    projects: mergedProjects,
    _stateVersion: d._stateVersion || state._stateVersion
  };

  save(); render(); applyTheme(state.theme || 'dark');
  // Hidratar ITEMS desde localStorage restaurado
  if (typeof loadBacklog === 'function') loadBacklog();

  const totalSess = mergedProjects.reduce((a, p) => a + (p.sessions || []).length, 0);
  const docsMsg = docsRestored > 0 ? ` · ${docsRestored} doc${docsRestored > 1 ? 's' : ''} restaurado${docsRestored > 1 ? 's' : ''}` : '';
  closeImportDiff();
  showToast('success', `Importado — ${mergedAIs.length} IAs · ${totalSess} sesiones${docsMsg} · backup guardado`, null, 5000);
}

// ── T-202604-109: Editor de ítems del Backlog ──
let _editorItemId = null; // null = nuevo, o id existente para editar

// T-202604-048: paste items modal
let _piItems = []; // array de ítems parseados { type, title, priority, effort, area, status, desc, ac, selected }

function openPasteItems() {
  // Fusionado en item editor — redirigir
  openItemEditor();
}

function closePasteItems() {
  // Fusionado en item editor — redirigir
  closeItemEditor();
}

function piDragOver(e) {
  e.preventDefault();
  document.getElementById('pi-textarea').classList.add('drag-over');
}
function piDragLeave(e) {
  document.getElementById('pi-textarea').classList.remove('drag-over');
}
function piDrop(e) {
  e.preventDefault();
  document.getElementById('pi-textarea').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('pi-textarea').value = ev.target.result;
    piParse();
  };
  reader.readAsText(file);
}

function _piDetectType(line) {
  // Detecta tipo desde título "### [pendiente-ID] · ..." o "### T-202604-xxx · ..."
  const m = line.match(/^###\s+(?:\[pendiente-ID\]|([PTRB])-\d{6}-\d{3})\s+·\s+(.+)$/i);
  if (!m) return null;
  // Si tiene código real, extraer tipo y código completo
  if (m[1]) {
    const codeMatch = line.match(/([PTRB]-\d{6}-\d{3})/i);
    return { type: m[1].toUpperCase(), title: m[2].trim(), code: codeMatch ? codeMatch[1].toUpperCase() : null };
  }
  return { type: 'T', title: m[2].trim(), code: null };
}

function _piParseField(lines, field) {
  for (const l of lines) {
    const m = l.match(new RegExp(`^\\*\\*${field}:\\*\\*\\s*(.+)$`, 'i'));
    if (m) return m[1].trim();
  }
  return '';
}

function _piParseAC(lines) {
  const ac = [];
  let inAC = false;
  for (const l of lines) {
    if (/^###\s+criterios/i.test(l)) { inAC = true; continue; }
    if (inAC && /^###/.test(l)) break;
    if (inAC && /^-\s+/.test(l)) ac.push(l.replace(/^-\s+\[.\]\s*/, '').replace(/^-\s+/, '').trim());
  }
  return ac;
}

function piParse() {
  const raw = document.getElementById('pi-textarea').value;
  const errEl = document.getElementById('pi-error');
  errEl.classList.remove('visible');
  // T-202604-060: deshabilitar botón al inicio de cada parse — evita estado activo intermedio
  document.getElementById('pi-confirm-btn').disabled = true;
  document.getElementById('pi-preview').classList.remove('visible');

  // Dividir en bloques por "### "
  const blocks = raw.split(/(?=^###\s)/m).filter(b => b.trim());
  _piItems = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    const header = lines[0];
    const parsed = _piDetectType(header);
    if (!parsed) continue;

    const priority = _piParseField(lines, 'Priority') || 'medium';
    const effortRaw = _piParseField(lines, 'Effort');
    const effort = parseInt(effortRaw) || 1;
    // R-202605-122 AC4: marcar para revisión si effort no estaba en el bloque pegado
    const _needsEffortReview = !effortRaw || effortRaw.trim() === '';
    const area = _piParseField(lines, 'Area') || '';
    const statusRaw = _piParseField(lines, 'Status') || 'pendiente';
    const ac = _piParseAC(lines);

    // Descripción: líneas entre campos y criterios que no sean **campo:**
    const descLines = lines.slice(1).filter(l =>
      l.trim() && !/^\*\*\w/.test(l) && !/^###/.test(l) && !/^-\s/.test(l)
    );
    const desc = descLines.join('\n').trim();

    // Normalizar status al valor canónico
    const status = _normalizeStatus(statusRaw);

    // T-202604-066: si es [pendiente-ID], buscar match por título en ITEMS
    let matchedCode = parsed.code || null; // parsed.code solo existe si el header tenía código real
    let _titleMatchWarning = false;
    if (!matchedCode) {
      const normTitle = parsed.title.toLowerCase().trim();
      const titleMatch = (typeof ITEMS !== 'undefined') && ITEMS.find(i => i.title.toLowerCase().trim() === normTitle);
      if (titleMatch) { matchedCode = titleMatch.code; _titleMatchWarning = true; }
    }
    _piItems.push({ type: parsed.type, title: parsed.title, priority, effort, area, status, desc, ac, selected: true, code: matchedCode, _titleMatchWarning, _needsEffortReview });
  }

  if (!_piItems.length && raw.trim()) {
    errEl.textContent = '⚠ No se detectaron ítems válidos — verifica el formato Markdown.';
    errEl.classList.add('visible');
    document.getElementById('pi-preview').classList.remove('visible');
    document.getElementById('pi-confirm-btn').disabled = true;
    return;
  }

  piRenderPreview();
}

function piRenderPreview() {
  const preview = document.getElementById('pi-preview');
  const list = document.getElementById('pi-list');
  const countEl = document.getElementById('pi-count');
  const confirmBtn = document.getElementById('pi-confirm-btn');

  if (!_piItems.length) {
    preview.classList.remove('visible');
    confirmBtn.disabled = true;
    return;
  }

  const selected = _piItems.filter(i => i.selected).length;
  countEl.textContent = `${selected} de ${_piItems.length} seleccionado${_piItems.length !== 1 ? 's' : ''}`;
  confirmBtn.disabled = selected === 0;

  // Contadores para header summary
  const nNew    = _piItems.filter(i => !i.code || i._titleMatchWarning).length;
  const nUpdate = _piItems.filter(i => i.code && !i._titleMatchWarning).length;
  const nWarn   = _piItems.filter(i => !i.effort || !i.area || !i.ac || !i.ac.length).length;

  const statsHtml = `<div class="pi-summary-stats">
    ${nNew    > 0 ? `<span class="pi-stat-new">+ ${nNew} nuevo${nNew !== 1 ? 's' : ''}</span>` : ''}
    ${nUpdate > 0 ? `<span class="pi-stat-update">↑ ${nUpdate} actualizar</span>` : ''}
    ${nWarn   > 0 ? `<span class="pi-stat-warn">⚠ ${nWarn} campo${nWarn !== 1 ? 's' : ''} faltante${nWarn !== 1 ? 's' : ''}</span>` : ''}
  </div>`;

  list.innerHTML = statsHtml + _piItems.map((item, i) => {
    const isUpdate = item.code && !item._titleMatchWarning;
    const isTitleMatch = !!item._titleMatchWarning;
    const missingFields = [];
    if (!item.effort) missingFields.push('effort');
    if (!item.area)   missingFields.push('area');
    if (!item.ac || !item.ac.length) missingFields.push('ac');
    const hasWarning = missingFields.length > 0;
    const autoExpand = hasWarning;

    const statusPill = isUpdate
      ? `<span class="pi-status-update">↑ ${esc(item.code)}</span>`
      : isTitleMatch
        ? `<span class="pi-status-title-match">↑ actualizar: ${esc(item.code)}</span>`
        : `<span class="pi-status-new">+ nuevo</span>`;

    const typePill = item.type ? `<span class="pi-type-pill">${esc(item.type)}</span>` : '';
    const warnBadge = hasWarning ? `<span class="pi-item-warning">⚠ falta: ${missingFields.join(', ')}</span>` : '';

    const acHtml = item.ac && item.ac.length
      ? `<div class="pi-ac-mt"><div class="pi-ac-header">${item.ac.length} criterio${item.ac.length !== 1 ? 's' : ''}</div><ul class="pi-item-ac-list">${item.ac.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>`
      : `<div class="pi-no-ac">Sin criterios de aceptación</div>`;

    return `
    <div class="pi-item${item.selected ? '' : ' deselected'}${hasWarning ? ' has-warning' : ''}" id="pi-item-${i}">
      <div class="pi-item-header" onclick="piToggleCard(${i}, event)">
        <input type="checkbox" class="pi-item-check" ${item.selected ? 'checked' : ''} onchange="piToggle(${i},this.checked)" onclick="event.stopPropagation()">
        <span class="pi-item-collapse${autoExpand ? ' open' : ''}">▶</span>
        <div class="pi-item-summary">
          ${typePill}
          <span class="pi-item-summary-title">${esc(item.title)}</span>
          ${statusPill}
          ${warnBadge}
        </div>
        <button class="pi-item-del" onclick="piDeleteItem(${i});event.stopPropagation();" title="Quitar del preview">✕</button>
      </div>
      <div class="pi-item-body${autoExpand ? ' open' : ''}" id="pi-body-${i}">
        <div class="pi-item-fields">
          <div class="pi-item-field"><span class="pi-item-field-label">Status</span><span>${esc(item.status || '—')}</span></div>
          <div class="pi-item-field"><span class="pi-item-field-label">Priority</span><span>${esc(item.priority || '—')}</span></div>
          <div class="pi-item-field"><span class="pi-item-field-label">Effort</span><span>${item.effort ? item.effort + '/3' : '<span class="pi-missing-val">—</span>'}</span></div>
          <div class="pi-item-field"><span class="pi-item-field-label">Area</span><span>${item.area ? esc(item.area) : '<span class="pi-missing-val">—</span>'}</span></div>
          ${item.sprint ? `<div class="pi-item-field"><span class="pi-item-field-label">Sprint</span><span>${esc(item.sprint)}</span></div>` : ''}
        </div>
        ${item.desc ? `<div class="pi-item-desc">${esc(item.desc)}</div>` : ''}
        ${acHtml}
      </div>
    </div>`;
  }).join('');

  preview.classList.add('visible');
}

function piToggleCard(i, e) {
  const body = document.getElementById('pi-body-' + i);
  const arrow = document.querySelector(`#pi-item-${i} .pi-item-collapse`);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open', isOpen);
}

function piToggle(i, checked) {
  _piItems[i].selected = checked;
  document.getElementById(`pi-item-${i}`).classList.toggle('deselected', !checked);
  const selected = _piItems.filter(x => x.selected).length;
  document.getElementById('pi-count').textContent = `${selected} de ${_piItems.length} seleccionado${_piItems.length !== 1 ? 's' : ''}`;
  document.getElementById('pi-confirm-btn').disabled = selected === 0;
}

function piEditTitle(i, val) { _piItems[i].title = val; }
function piEditType(i, val) { _piItems[i].type = val; }
function piEditStatus(i, val) { _piItems[i].status = val; }

function piDeleteItem(i) {
  _piItems.splice(i, 1);
  piRenderPreview();
  if (!_piItems.length) {
    document.getElementById('pi-preview').classList.remove('visible');
    document.getElementById('pi-confirm-btn').disabled = true;
  }
}

function piConfirm() {
  const toAdd = _piItems.filter(i => i.selected);
  if (!toAdd.length) return;

  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  if (!meta.counters) meta.counters = { P:0, T:0, R:0, B:0 };
  const yyyymm = new Date().toISOString().slice(0,7).replace('-','');
  const updated = [];
  const priorityMap = {
    'high': 'high', 'importante': 'high', 'important': 'high', 'crítico': 'high',
    'critical': 'high', 'alta': 'high', 'alto': 'high',
    'medium': 'medium', 'mejora': 'medium', 'media': 'medium', 'medio': 'medium',
    'proceso': 'medium', 'pulido': 'medium',
    'low': 'low', 'baja': 'low', 'bajo': 'low', 'futura': 'low'
  };
  for (const item of toAdd) {
    const normPriority = priorityMap[(item.priority||'').toLowerCase()] || 'medium';
    const existingIdx = item.code ? ITEMS.findIndex(i => i.code === item.code) : -1;
    if (existingIdx >= 0) {
      const existing = ITEMS[existingIdx];
      ITEMS[existingIdx] = {
        ...existing,
        title: item.title,
        priority: normPriority,
        effort: item.effort,
        area: item.area,
        desc: item.desc,
        ac: item.ac,
        status: item.status || existing.status,
        version: item.version || existing.version,
        sprint: item.sprint || existing.sprint || '',
        parentId: item.parentId || existing.parentId || null,
      };
      updated.push(item.code);
    } else {
      const type = item.type;
      meta.counters[type] = (meta.counters[type] || 0) + 1;
      const num = String(meta.counters[type]).padStart(3,'0');
      const code = item.code || `${type}-${yyyymm}-${num}`;
      const id = 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
      ITEMS.push({
        id, code,
        title: item.title,
        priority: normPriority,
        effort: item.effort,
        area: item.area,
        desc: item.desc,
        ac: item.ac,
        status: item.status || 'backlog',
        version: item.version || 'futura',
        sprint: item.sprint || _activeSprint(),
        parentId: item.parentId || null,
        _needsEffortReview: item._needsEffortReview || false,
        schema_version: 1,
      });
      added.push(code);
    }
  }

  localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
  _undoSnapshot();
  saveBacklog();
  renderBacklogList();
  renderStats();
  updateBacklogBanner();
  closeItemEditor();

  const parts = [];
  if (added.length) parts.push(`${added.length} agregado${added.length > 1 ? 's' : ''}: ${added.slice(0,3).join(', ')}${added.length > 3 ? '…' : ''}`);
  if (updated.length) parts.push(`${updated.length} actualizado${updated.length > 1 ? 's' : ''}: ${updated.slice(0,3).join(', ')}${updated.length > 3 ? '…' : ''}`);
  showToast('success', '✓ ' + parts.join(' · '));
}

function _refreshParentIdDropdown(selectedType, selectedParentId) {
  const field = document.getElementById('field-parentid');
  const sel = document.getElementById('item-parentid');
  if (!field || !sel) return;
  // Solo T y B pueden tener R padre
  const show = selectedType === 'T' || selectedType === 'B';
  field.classList.toggle('hidden', !show);
  if (!show) { sel.value = ''; return; }
  // Poblar con R disponibles
  const rItems = ITEMS.filter(i => i.code && i.code[0] === 'R');
  sel.innerHTML = '<option value="">— Sin R padre —</option>' +
    rItems.map(r => `<option value="${esc(r.code)}"${r.code === selectedParentId ? ' selected' : ''}>${esc(r.code)} · ${esc(r.title || r.desc || '')}</option>`).join('');
}

// T-202604-294: helper — retorna id del sprint activo si existe, '' si no
function _activeSprint() {
  if (typeof _getActiveSprint !== 'function') return '';
  const s = _getActiveSprint();
  return s ? s.id : '';
}

function openItemEditor(itemId = null, itemCode = null) {
  if (typeof _saveModalTrigger === 'function') _saveModalTrigger('item-editor-overlay');
  const overlay = document.getElementById('item-editor-overlay');
  // T-522: guard — si el overlay no existe el módulo externo no cargó correctamente
  if (!overlay) {
    console.warn('[openItemEditor] item-editor-overlay no encontrado — módulo externo no cargado');
    return;
  }
  const title = document.getElementById('item-editor-title');
  const typeSelect = document.getElementById('item-type');
  // T-202605-451: reset save-as panel on open
  const savePanel = document.getElementById('tpl-save-panel');
  if (savePanel) savePanel.classList.remove('open');



  if (itemId || itemCode) {
    // Editar ítem existente — buscar por id primero, luego por code como fallback
    const item = itemId
      ? (ITEMS.find(i => i.id === itemId) || ITEMS.find(i => i.code === itemId))
      : ITEMS.find(i => i.code === itemCode);
    if (!item) return;
    _editorItemId = item.id || item.code; // guardar lo que tengamos
    title.textContent = '✎ Editar ítem';
    // AC-7: indicar visualmente que es actualización
    title.className = (title.className || '').replace(/item-editor-title--\S+/g, '').trim() + ' item-editor-title--edit';
    
    typeSelect.value = item.code[0];
    document.getElementById('item-code').value = item.code;
    document.getElementById('item-title').value = item.title || '';
    document.getElementById('item-priority').value = item.priority || 'medium';
    document.getElementById('item-effort').value = item.effort || 1;
    document.getElementById('item-area').value = item.area || '';
    document.getElementById('item-desc').value = item.desc || '';
    document.getElementById('item-ac').value = (item.ac || []).join('\n');
    const notesEl = document.getElementById('item-notes');
    if (notesEl) notesEl.value = item.notes || '';
    const bbEl = document.getElementById('item-blocked-by');
    if (bbEl) bbEl.value = (item.blockedBy || []).join(', ');
    const archivosEl = document.getElementById('item-archivos');
    if (archivosEl) archivosEl.value = (item.archivos || []).join(', ');
    _refreshParentIdDropdown(item.code[0], item.parentId || '');
  } else {
    // Nuevo ítem
    _editorItemId = null;
    title.textContent = '➕ Nuevo ítem';
    title.className = (title.className || '').replace(/item-editor-title--\S+/g, '').trim();
    typeSelect.value = 'T';
    document.getElementById('item-code').value = '';
    document.getElementById('item-title').value = '';
    document.getElementById('item-priority').value = 'medium';
    document.getElementById('item-effort').value = 1;
    document.getElementById('item-area').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-ac').value = '';
    const notesElNew = document.getElementById('item-notes');
    if (notesElNew) notesElNew.value = '';
    const bbElNew = document.getElementById('item-blocked-by');
    if (bbElNew) bbElNew.value = '';
    const archivosElNew = document.getElementById('item-archivos');
    if (archivosElNew) archivosElNew.value = '';
    _refreshParentIdDropdown('T', '');
  }

  // Resetear bloque pegar siempre al abrir
  _piItems = [];
  const piTa = document.getElementById('pi-textarea');
  if (piTa) piTa.value = '';
  const piErr = document.getElementById('pi-error');
  if (piErr) piErr.classList.remove('visible');
  const piPrev = document.getElementById('pi-preview');
  if (piPrev) piPrev.classList.remove('visible');
  const piList = document.getElementById('pi-list');
  if (piList) piList.innerHTML = '';
  const piCnt = document.getElementById('pi-count');
  if (piCnt) piCnt.textContent = '';
  const piBtn = document.getElementById('pi-confirm-btn');
  if (piBtn) piBtn.disabled = true;

  // Actualizar dropdown al cambiar tipo
  typeSelect.onchange = () => _refreshParentIdDropdown(typeSelect.value, document.getElementById('item-parentid').value);

  // Paste-to-autofill en campo Prompt/Descripción
  const descTA = document.getElementById('item-desc');
  descTA.onpaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    if (!pasted) return;
    const filled = _ieAutofillFromPaste(pasted);
    if (filled) {
      e.preventDefault();
      _refreshParentIdDropdown(document.getElementById('item-type').value, document.getElementById('item-parentid').value);
    }
  };
  
  overlay.classList.add('open');
  document.getElementById('item-title').focus();
}

// Parser paste-to-autofill para el item editor.
// Soporta dos formatos:
//   1) Línea CHECKPOINT: T: [pendiente-ID]: Título | effort:2 | area:X | ac: c1 / c2
//   2) Bloque Markdown:  ### T-202604-001 · Título\n**Priority:** ...\n**Area:** ...\n
// Retorna true si se detectó y pobló algún campo.
function _ieAutofillFromPaste(text) {
  const t = text.trim();

  // ── Formato 1: línea CHECKPOINT ───────────────────────────────────────────
  // [PTRBI]: ([código]|[pendiente-ID]|[tmp:slug]): desc | effort:N | area:X | ac: c1 / c2
  const cpRe = /^([PTRB])\s*:\s*(?:\[pendiente-ID\]|\[tmp:[^\]]+\]|[PTRB]-\d{6}-\d{3}(?:-[A-Z]+)?)\s*:\s*(.+?)(?:\s*\|(.+))?$/i;
  const cpMatch = t.match(cpRe);
  if (cpMatch) {
    const typeChar = cpMatch[1].toUpperCase() === 'I' ? 'I' : cpMatch[1].toUpperCase();
    const descRaw  = cpMatch[2].trim();
    const rest     = cpMatch[3] || '';

    // Extraer pipes
    const pipes = {};
    rest.split('|').forEach(seg => {
      const kv = seg.match(/^\s*([a-z]+)\s*:\s*(.+)/i);
      if (kv) pipes[kv[1].toLowerCase().trim()] = kv[2].trim();
    });

    // AC: separado por " / "
    const acRaw = pipes['ac'] || '';
    const acList = acRaw ? acRaw.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean) : [];

    // Poblar formulario
    document.getElementById('item-type').value      = typeChar;
    document.getElementById('item-title').value     = descRaw;
    document.getElementById('item-area').value      = pipes['area'] || '';
    document.getElementById('item-effort').value    = parseInt(pipes['effort']) || 1;
    document.getElementById('item-ac').value        = acList.join('\n');
    document.getElementById('item-desc').value      = '';
    // T-202604-288: blockedBy desde pipe
    const bbAutofillEl = document.getElementById('item-blocked-by');
    if (bbAutofillEl) bbAutofillEl.value = pipes['blockedby'] || pipes['blockedBy'] || '';
    const archivosAutofillEl = document.getElementById('item-archivos');
    if (archivosAutofillEl) archivosAutofillEl.value = pipes['archivos'] || pipes['files'] || '';

    // Sprint / priority si viene
    if (pipes['priority']) document.getElementById('item-priority').value = pipes['priority'].toLowerCase();

    _ieHighlightAutofilled();
    showToast('success', '✓ Formulario autocompletado desde CHECKPOINT — verifica y guarda', null, 3000);
    return true;
  }

  // ── Formato 2: bloque Markdown ────────────────────────────────────────────
  // ### [CODE|pendiente-ID] · Título
  const mdHeaderRe = /^###\s+(?:(\[pendiente-ID\]|\[tmp:[^\]]+\]|([PTRB])-\d{6}-\d{3}(?:-[A-Za-z]+)?))\s+·\s+(.+)/im;
  // También acepta header sin código: ### Título (menos preciso — solo si hay campos **field:**)
  const mdHeaderSimple = /^###\s+(.+)/im;
  let mdMatch = t.match(mdHeaderRe);
  let mdSimple = false;
  if (!mdMatch) {
    // Intentar si hay al menos un campo **Field:** en el texto
    if (/\*\*(?:Priority|Area|Effort|Status)\*\*/.test(t)) {
      mdMatch = t.match(mdHeaderSimple);
      mdSimple = true;
    }
  }

  if (mdMatch) {
    const typeChar = mdSimple ? null : (mdMatch[2] ? mdMatch[2].toUpperCase() : null);
    const codeRaw  = mdSimple ? '' : (mdMatch[1] || '');
    const titleRaw = mdSimple ? mdMatch[1].trim() : mdMatch[3].trim();

    const get = (field) => {
      const m = t.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`, 'i'));
      return m ? m[1].trim() : '';
    };

    const priority = get('Priority') || 'medium';
    const area     = get('Area') || '';
    const effort   = parseInt(get('Effort')) || 1;

    // Descripción: bloque entre **Version:** y ### Criterios (o fin)
    const descMatch = t.match(/\*\*Version:\*\*[^\n]*\n+([\s\S]*?)(?=###\s*Criterios|$)/i);
    const desc = descMatch ? descMatch[1].trim() : '';

    // AC
    const acMatch = t.match(/###\s*Criterios de aceptación\s*\n([\s\S]*?)(?=\n---|$)/i);
    const ac = [];
    if (acMatch) {
      acMatch[1].split('\n').forEach(l => {
        const m = l.match(/^-\s+\[[ x]\]\s+(.+)/i);
        if (m) ac.push(m[1].trim());
        else {
          const m2 = l.match(/^-\s+(.+)/);
          if (m2) ac.push(m2[1].trim());
        }
      });
    }

    // Código real si viene
    const isRealCode = !mdSimple && codeRaw && /[PTRB]-\d{6}-\d{3}/i.test(codeRaw);

    // Poblar
    if (typeChar) document.getElementById('item-type').value  = typeChar;
    if (isRealCode) document.getElementById('item-code').value = codeRaw;
    document.getElementById('item-title').value    = titleRaw;
    document.getElementById('item-priority').value = priority.toLowerCase();
    document.getElementById('item-effort').value   = effort;
    document.getElementById('item-area').value     = area;
    document.getElementById('item-desc').value     = desc;
    document.getElementById('item-ac').value       = ac.join('\n');
    // T-202604-288: blockedBy desde MD
    const bbMdEl = document.getElementById('item-blocked-by');
    if (bbMdEl) bbMdEl.value = get('BlockedBy') || '';
    const archivosEl = document.getElementById('item-archivos');
    if (archivosEl) archivosEl.value = get('Archivos') || get('Files') || '';

    _ieHighlightAutofilled();
    showToast('success', '✓ Formulario autocompletado desde Markdown — verifica y guarda', null, 3000);
    return true;
  }

  return false; // no se detectó ningún formato — comportamiento normal
}

// Flash visual en campos rellenados automáticamente
function _ieHighlightAutofilled() {
  const ids = ['item-type','item-code','item-title','item-priority','item-effort','item-area','item-desc','item-ac','item-archivos'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('ie-autofilled');
    void el.offsetWidth; // reflow para reiniciar animación
    el.classList.add('ie-autofilled');
    setTimeout(() => el.classList.remove('ie-autofilled'), 1200);
  });
}

function closeItemEditor() {
  document.getElementById('item-editor-overlay').classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus('item-editor-overlay');
  _editorItemId = null;
}

function confirmItemEditor() {
  const type = document.getElementById('item-type').value;
  const code = document.getElementById('item-code').value.trim();
  const title = document.getElementById('item-title').value.trim();
  
  if (!title) { showToast('warning', '⚠ Título es obligatorio'); return; }

  // R-202605-122 AC1: effort obligatorio para ítems no tipo P
  const effortRaw = document.getElementById('item-effort').value;
  if (type !== 'P' && (!effortRaw || effortRaw === '0' || effortRaw === '')) {
    const effortEl = document.getElementById('item-effort');
    if (effortEl) {
      effortEl.classList.add('field-error');
      effortEl.focus();
      setTimeout(() => effortEl.classList.remove('field-error'), 2000);
    }
    showToast('warning', '⚠ Effort es obligatorio — selecciona 1, 2 o 3');
    return;
  }

  const priority = document.getElementById('item-priority').value;
  const effort = parseInt(effortRaw) || 1;
  const area = document.getElementById('item-area').value.trim();
  const desc = document.getElementById('item-desc').value.trim();
  const acText = document.getElementById('item-ac').value.trim();
  const ac = acText ? acText.split('\n').map(l => l.replace(/^[-*]\s*(\[[ x]\]\s*)?/, '').trim()).filter(Boolean) : [];
  const parentId = (document.getElementById('item-parentid').value || '').trim() || null;
  const notesEl2 = document.getElementById('item-notes');
  // B-202605-068: si #item-notes no existe, emitir warning y preservar notes existentes
  if (!notesEl2) {
    console.warn('[AI Tracker] confirmItemEditor: #item-notes no encontrado en el DOM — notes no se actualizará');
  }
  const notes = notesEl2 ? notesEl2.value.trim() : null;
  const bbEl2 = document.getElementById('item-blocked-by');
  const blockedBy = bbEl2
    ? bbEl2.value.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const archivosEl2 = document.getElementById('item-archivos');
  const archivos = archivosEl2
    ? archivosEl2.value.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  
  // Generar código si está vacío — usa _getNextItemCode() para consistencia con el sistema
  let finalCode = code;
  if (!finalCode) {
    finalCode = _getNextItemCode(type);
  }

  if (_editorItemId) {
    // Editar existente
    const item = ITEMS.find(i => i.id === _editorItemId) || ITEMS.find(i => i.code === _editorItemId);
    if (!item) return;

    // AC-10: detectar colisión de código (código cambiado a uno que ya existe en otro ítem)
    if (finalCode !== item.code) {
      const collision = ITEMS.find(i => i.code === finalCode && i.code !== item.code);
      if (collision) {
        showToast('warning', '⚠ El código ' + finalCode + ' ya existe en otro ítem');
        return;
      }
    }

    // AC-6: lógica de status desde el editor (si hubiera selector de status en el editor en el futuro)
    // Por ahora el editor no expone selector de status — se gestiona desde inline/CHECKPOINT
    item.code = finalCode;
    item.title = title;
    item.priority = priority;
    item.effort = effort;
    item.area = area;
    item.desc = desc;
    item.ac = ac;
    // B-202605-068: si notes es null (#item-notes ausente del DOM), preservar valor existente
    // T-528: normalizar notes null→'' — ítems cargados desde CHECKPOINT sin campo notes
    if (notes !== null) item.notes = notes;
    if (item.notes == null) item.notes = '';
    item.blockedBy = blockedBy;
    item.archivos = archivos;
    item.parentId = parentId || null;
    _blogLog('editado', finalCode, title, 'backlog');
    _undoSnapshot();
    saveBacklog();
    showToast('success', '✓ ' + finalCode + ' actualizado');
  } else {
    // AC-9: crear nuevo — código generado o ingresado manualmente
    // Verificar colisión también en creación
    const collision = ITEMS.find(i => i.code === finalCode);
    if (collision) {
      showToast('warning', '⚠ El código ' + finalCode + ' ya existe — edita el ítem existente');
      return;
    }
    const id = 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
    // B-202604-015: heredar sprint del padre si existe; T-202604-294: fallback a sprint activo
    const _newItemSprint = parentId
      ? ((ITEMS.find(p => p.code === parentId) || {}).sprint || _activeSprint())
      : _activeSprint();
    ITEMS.push({
      id, code: finalCode, title, priority, effort, area, desc, ac,
      notes: notes || '',
      blockedBy: blockedBy,
      archivos: archivos,
      parentId: parentId || null,
      sprint: _newItemSprint,
      status: 'pendiente', version: 'futura',
      schema_version: 1,
    });
    _blogLog('creado', finalCode, title, 'backlog');
    _undoSnapshot();
    saveBacklog();
    showToast('success', '✓ ' + finalCode + ' creado');
  }

  closeItemEditor();
  renderBacklogList();
  updateBacklogBanner();
}




// ══════════════════════════════════════════════════════════════════════════════
// T-202605-451 · TEMPLATES DE ÍTEMS — predefinidos y personalizados
// ══════════════════════════════════════════════════════════════════════════════

const _ITEM_TEMPLATES_KEY = 'ai-tracker-item-templates';

const _PREDEFINED_TEMPLATES = [
  {
    id: 'tpl-r-feature',
    name: 'R — Feature',
    builtin: true,
    type: 'R',
    priority: 'medium',
    effort: 2,
    area: 'UI · Feature',
    desc: '',
    ac: [
      'Visible en UI en el estado esperado',
      'Persiste correctamente en localStorage',
      'CSS Purity — sin style= inline',
      'Sin romper layout mobile (<600px)',
    ],
    notes: '',
  },
  {
    id: 'tpl-r-refactor',
    name: 'R — Refactor',
    builtin: true,
    type: 'R',
    priority: 'low',
    effort: 2,
    area: 'Refactor',
    desc: '',
    ac: [
      'Comportamiento externo idéntico al anterior',
      'Sin regresiones en módulos adyacentes',
      'CSS Purity — sin style= inline',
      'Deuda técnica documentada en CHECKPOINT',
    ],
    notes: '',
  },
  {
    id: 'tpl-b-bug',
    name: 'B — Bug',
    builtin: true,
    type: 'B',
    priority: 'high',
    effort: 1,
    area: '',
    desc: '',
    ac: [
      'Reproducir con pasos exactos',
      'Fix verificable: [descripción del estado esperado]',
      'Sin regresión en flujo afectado',
    ],
    notes: '',
  },
  {
    id: 'tpl-t-impl',
    name: 'T — Implementación',
    builtin: true,
    type: 'T',
    priority: 'medium',
    effort: 1,
    area: '',
    desc: '',
    ac: [
      'Implementado según AC del R padre',
      'CSS Purity — sin style= inline',
      'Verificado en happy path y edge case',
    ],
    notes: '',
  },
];

function _loadCustomTemplates() {
  try {
    const raw = localStorage.getItem(_ITEM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function _saveCustomTemplates(list) {
  try {
    localStorage.setItem(_ITEM_TEMPLATES_KEY, JSON.stringify(list));
  } catch (e) {
    showToast('error', '❌ Error al guardar template — almacenamiento lleno');
  }
}

function _getAllTemplates() {
  return [..._PREDEFINED_TEMPLATES, ..._loadCustomTemplates()];
}

// Abre el picker de templates
function openTemplatePicker() {
  const overlay = document.getElementById('tpl-picker-overlay');
  if (!overlay) return;
  _renderTemplatePicker();
  overlay.classList.add('open');
}

function closeTemplatePicker() {
  const overlay = document.getElementById('tpl-picker-overlay');
  if (overlay) overlay.classList.remove('open');
}

function _renderTemplatePicker() {
  const list = document.getElementById('tpl-picker-list');
  if (!list) return;
  const all = _getAllTemplates();

  const predefined = all.filter(t => t.builtin);
  const custom = all.filter(t => !t.builtin);

  const renderGroup = (items, label) => {
    if (!items.length) return '';
    const header = label ? `<div class="tpl-section-label">${label}</div>` : '';
    return header + items.map(tpl => {
      const typeClass = 'tag-' + tpl.type.toLowerCase();
      const acCount = (tpl.ac || []).length;
      const deleteBtn = tpl.builtin ? '' :
        `<button class="tpl-delete-btn" onclick="event.stopPropagation();_deleteCustomTemplate('${tpl.id}')" title="Eliminar template">✕</button>`;
      return `
        <div class="tpl-picker-item" onclick="_applyTemplate('${tpl.id}')">
          <div class="tpl-item-info">
            <div class="tpl-item-name">${tpl.name}</div>
            <div class="tpl-item-meta">
              <span class="tpl-item-tag ${typeClass}">${tpl.type}</span>
              <span>Effort ${tpl.effort}</span>
              ${tpl.area ? `<span>${tpl.area}</span>` : ''}
              ${acCount ? `<span>${acCount} AC</span>` : ''}
              ${!tpl.builtin ? '<span class="tpl-item-custom-badge">personalizado</span>' : ''}
            </div>
          </div>
          ${deleteBtn}
        </div>`;
    }).join('');
  };

  const html = renderGroup(predefined, '') + renderGroup(custom, custom.length ? 'Personalizados' : '');
  list.innerHTML = html || '<div class="tpl-empty">No hay templates. Crea uno desde un ítem existente.</div>';
}

function _applyTemplate(tplId) {
  const tpl = _getAllTemplates().find(t => t.id === tplId);
  if (!tpl) return;

  const typeSelect = document.getElementById('item-type');
  if (typeSelect) typeSelect.value = tpl.type;

  document.getElementById('item-title').value = '';
  document.getElementById('item-priority').value = tpl.priority || 'medium';
  document.getElementById('item-effort').value = tpl.effort || 1;
  document.getElementById('item-area').value = tpl.area || '';
  document.getElementById('item-desc').value = tpl.desc || '';
  document.getElementById('item-ac').value = (tpl.ac || []).join('\n');
  const notesEl = document.getElementById('item-notes');
  if (notesEl) notesEl.value = tpl.notes || '';

  if (typeof _refreshParentIdDropdown === 'function') {
    _refreshParentIdDropdown(tpl.type, '');
  }

  closeTemplatePicker();
  _ieHighlightAutofilled();
  document.getElementById('item-title').focus();
  showToast('success', '✓ Template aplicado — completa el título y guarda', null, 2500);
}

function _deleteCustomTemplate(tplId) {
  const customs = _loadCustomTemplates().filter(t => t.id !== tplId);
  _saveCustomTemplates(customs);
  _renderTemplatePicker();
  showToast('success', '✓ Template eliminado');
}

// Guarda el ítem actual (en editor abierto) como template personalizado
function saveCurrentItemAsTemplate() {
  const title = document.getElementById('item-title').value.trim();
  const type = document.getElementById('item-type').value;
  const priority = document.getElementById('item-priority').value;
  const effort = parseInt(document.getElementById('item-effort').value) || 1;
  const area = document.getElementById('item-area').value.trim();
  const desc = document.getElementById('item-desc').value.trim();
  const acText = document.getElementById('item-ac').value.trim();
  const ac = acText ? acText.split('\n').map(l => l.replace(/^[-*]\s*(\[[ x]\]\s*)?/, '').trim()).filter(Boolean) : [];
  const notesEl = document.getElementById('item-notes');
  const notes = notesEl ? notesEl.value.trim() : '';

  const tplNameInput = document.getElementById('tpl-save-name-input');
  const tplName = tplNameInput ? tplNameInput.value.trim() : (title || (type + ' — template'));
  if (!tplName) { showToast('warning', '⚠ Asigna un nombre al template'); return; }

  const customs = _loadCustomTemplates();
  const newTpl = {
    id: 'tpl-custom-' + Date.now(),
    name: tplName,
    builtin: false,
    type, priority, effort, area, desc, ac, notes,
  };
  customs.push(newTpl);
  _saveCustomTemplates(customs);

  // Ocultar el save-as panel
  const savePanel = document.getElementById('tpl-save-panel');
  if (savePanel) savePanel.classList.remove('open');

  showToast('success', '✓ Template "' + tplName + '" guardado');
}

function toggleTplSavePanel() {
  const panel = document.getElementById('tpl-save-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    const title = document.getElementById('item-title').value.trim();
    const type = document.getElementById('item-type').value;
    const nameInput = document.getElementById('tpl-save-name-input');
    if (nameInput) nameInput.value = title || type + ' — template';
    nameInput && nameInput.focus();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FIN T-202605-451
// ══════════════════════════════════════════════════════════════════════════════

// T-082: Helper centralizado — retorna el próximo Date en que resetTime ocurre
// Siempre retorna un Date futuro: si la hora ya pasó hoy, proyecta a mañana (+24h)
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

// T-202604-293: Búsqueda global unificada — IAs + sesiones + notas
// T-202604-420: Ampliada — Backlog + Proyectos como grupos adicionales
// B-202605-236: filtro por proyecto activo
// B-202605-237: highlight del término buscado en resultados
let _searchScopeAll = false;
function _toggleSearchScope() {
  _searchScopeAll = !_searchScopeAll;
  const btn = document.getElementById('search-scope-btn');
  if (btn) btn.textContent = _searchScopeAll ? '🌐 Todos los proyectos' : '📁 Proyecto activo';
  onSearch();
}
function onSearch() {
  const q = (document.getElementById('search-global').value || '').toLowerCase().trim();
  const countEl = document.getElementById('search-count');

  // Limpiar panel unificado previo
  const prevPanel = document.getElementById('search-unified-results');
  if (prevPanel) prevPanel.remove();

  if (!q) {
    render();
    if (countEl) countEl.textContent = '';
    return;
  }

  // B-202605-236: proyecto activo para filtrar sesiones/proyectos
  const _activeProjId = (typeof _getActiveProjectFilter === 'function' && !_searchScopeAll)
    ? _getActiveProjectFilter()
    : null;

  // B-202605-237: helper para resaltar término buscado en texto
  const _esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function hlText(raw, term) {
    if (!raw || !term) return _esc(raw || '');
    const escaped = _esc(raw);
    const escapedTerm = _esc(term);
    const re = new RegExp('(' + escapedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escaped.replace(re, '<mark class="sur-hl">$1</mark>');
  }

  // ── 1. IAs coincidentes (nombre o notas) ──
  const aiMatches = (state.ais || []).filter(ai =>
    !ai.archived &&
    (ai.name.toLowerCase().includes(q) || (ai.notes || '').toLowerCase().includes(q))
  );

  // ── 2. Sesiones coincidentes ──
  const sessMatches = [];
  (state.projects || []).forEach(proj => {
    // B-202605-236: filtrar por proyecto activo cuando el scope no es "todos"
    if (_activeProjId && proj.id !== _activeProjId) return;
    (proj.sessions || []).forEach(s => {
      if (
        s.title.toLowerCase().includes(q) ||
        (s.summary || '').toLowerCase().includes(q) ||
        (s.pending || '').toLowerCase().includes(q) ||
        (s.files || '').toLowerCase().includes(q) ||
        (s.tags || []).some(tid => {
          const t = (state.tags || []).find(x => x.id === tid);
          return t && t.name.toLowerCase().includes(q);
        })
      ) {
        const ai = (state.ais || []).find(a => a.id === s.aiId);
        sessMatches.push({ sess: s, proj, ai });
      }
    });
  });
  // Cronológica inversa, máx 30
  sessMatches.sort((a, b) => parseInt(b.sess.id) - parseInt(a.sess.id));
  const sessSlice = sessMatches.slice(0, 30);

  // ── 3. Notas rápidas coincidentes ──
  // B-202605-022: respetar scope de proyecto activo — filtrar por projectId cuando aplica
  const noteMatches = (state.quickNotes || []).filter(n => {
    const textHit = (n.text || '').toLowerCase().includes(q) || (n.itemRef || '').toLowerCase().includes(q);
    if (!textHit) return false;
    if (_activeProjId && n.projectId && n.projectId !== _activeProjId) return false;
    return true;
  });

  // ── 4. T-202604-420: Ítems de backlog coincidentes ──
  const backlogMatches = (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(item => {
    if (item.status === 'descartado') return false;
    const titleHit = (item.title || item.desc || '').toLowerCase().includes(q);
    const codeHit = (item.code || '').toLowerCase().includes(q);
    const acHit = (item.ac || []).some(a => (typeof a === 'string' ? a : (a.text || '')).toLowerCase().includes(q));
    return titleHit || codeHit || acHit;
  });

  // ── 5. T-202604-420: Proyectos coincidentes ──
  const projMatches = (state.projects || []).filter(p =>
    p.status !== 'archived' &&
    // B-202605-236: si scope es proyecto activo, solo mostrar ese proyecto
    (!_activeProjId || p.id === _activeProjId) &&
    ((p.name || '').toLowerCase().includes(q) || (p.icon || '').toLowerCase().includes(q))
  );

  const total = aiMatches.length + sessMatches.length + noteMatches.length;
  // R-202604-075: contratos en búsqueda global
  const contratoMatches = (typeof searchContratos === 'function') ? searchContratos(q) : [];
  // B-243: búsqueda en contexto del proyecto activo — usa _ctxSections ya cargado
  const contextMatches = [];
  if (_ctxSections && _ctxSections.length) {
    const qNorm = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    _ctxSections.forEach(sec => {
      const titleNorm = sec.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const bodyNorm  = sec.lines.join('\n').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (titleNorm.includes(qNorm) || bodyNorm.includes(qNorm)) {
        contextMatches.push(sec);
      }
    });
  }

  const totalWithContratos = total + contratoMatches.length + backlogMatches.length + projMatches.length + contextMatches.length;
  if (countEl) countEl.textContent = totalWithContratos
    ? `${totalWithContratos} resultado${totalWithContratos !== 1 ? 's' : ''} · IAs, sesiones, notas, backlog, proyectos, contexto`
    : 'Sin resultados';

  // ── Filtrar cards del grid (comportamiento previo) ──
  state.ais.forEach(ai => {
    const card = document.getElementById('card-' + ai.id);
    if (!card) return;
    const nameMatch = ai.name.toLowerCase().includes(q);
    const notesMatch = (ai.notes || '').toLowerCase().includes(q);
    const hasSessMatch = sessMatches.some(({ ai: sai }) => sai && sai.id === ai.id);
    card.classList.toggle('hidden', !(nameMatch || notesMatch || hasSessMatch));
    const list = card.querySelector('.sess-list');
    if (!list) return;
    const aiSess = getAISessions(ai.id);
    const matchSessIds = new Set(sessMatches.filter(({ ai: sai }) => sai && sai.id === ai.id).map(({ sess }) => sess.id));
    list.querySelectorAll('.sess-row').forEach(row => {
      const titleEl = row.querySelector('.sess-row-title');
      const rowTitle = titleEl ? titleEl.textContent : '';
      const match = notesMatch || aiSess.some(s => matchSessIds.has(s.id) && s.title === rowTitle);
      row.classList.toggle('hidden', !match);
    });
  });

  // ── Renderizar panel de resultados agrupados ──
  const grid = document.getElementById('grid');
  if (!grid) return;

  // B-202605-237: hlText definido arriba — escHtml ya no se necesita aquí

  // B-202605-236: scope toggle label
  const scopeLabel = _activeProjId ? '\u{1F4C1} Proyecto activo' : '\u{1F310} Todos los proyectos';

  let html = '<div class="sur-inner">';

  // B-202605-236: control de scope visible en cabecera del panel
  html += `<div class="sur-scope-row"><button class="sur-scope-btn" id="search-scope-btn" onclick="_toggleSearchScope()">${scopeLabel}</button></div>`;

  // Grupo IAs
  if (aiMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">\u{1F916} IAs (${aiMatches.length})</div>
      <div class="sur-rows">`;
    aiMatches.forEach(ai => {
      const statusDot = ai.status === 'available' ? '\u{1F7E2}' : '\u{1F534}';
      const noteSnip = ai.notes ? `<span class="sur-meta">${hlText(ai.notes.slice(0, 80), q)}${ai.notes.length > 80 ? '\u2026' : ''}</span>` : '';
      html += `<div class="sur-row" onclick="navigateToCard('${ai.id}')">
        <span class="sur-row-icon">${statusDot}</span>
        <span class="sur-row-title">${hlText(ai.name, q)}</span>
        ${noteSnip}
      </div>`;
    });
    html += '</div></div>';
  }

  // Grupo Sesiones
  if (sessSlice.length) {
    const moreCount = sessMatches.length - sessSlice.length;
    html += `<div class="sur-group">
      <div class="sur-group-label">\u{1F4CB} Sesiones (${sessMatches.length})</div>
      <div class="sur-rows">`;
    sessSlice.forEach(({ sess, proj, ai }) => {
      const aiName = ai ? hlText(ai.name, q) : '\u2014';
      const projName = proj ? _esc((proj.icon || '\u{1F4C1}') + ' ' + proj.name) : '';
      const dateLabel = (typeof relDate === 'function' ? relDate(sess.date, sess.savedAt || sess.createdAt) : '') || sess.dateShort || '';
      const summSnip = sess.summary ? `<span class="sur-meta">${hlText(sess.summary.slice(0, 80), q)}${sess.summary.length > 80 ? '\u2026' : ''}</span>` : '';
      html += `<div class="sur-row" onclick="openDetail('${ai ? ai.id : ''}','${sess.id}')">
        <span class="sur-row-icon">\u{1F4C4}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(sess.title, q)}</span>
          <span class="sur-row-sub">${aiName}${projName ? ' \u00B7 ' + projName : ''}${dateLabel ? ' \u00B7 ' + dateLabel : ''}</span>
          ${summSnip}
        </div>
      </div>`;
    });
        if (moreCount > 0) {
      html += `<div class="sur-more">+${moreCount} sesión${moreCount !== 1 ? 'es' : ''} más — usa Log para explorar</div>`;
    }
    html += '</div></div>';
  }

  // Grupo Notas
  if (noteMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">📝 Notas (${noteMatches.length})</div>
      <div class="sur-rows">`;
    noteMatches.slice(0, 20).forEach(n => {
      const dateLabel = (typeof relDate === 'function' ? relDate(n.updatedAt || n.createdAt) : '') || '';
      const refBadge = n.itemRef ? `<span class="sur-badge">${hlText(n.itemRef, q)}</span>` : '';
      html += `<div class="sur-row" onclick="openQuickNote('${n.id}')">
        <span class="sur-row-icon">🗒</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(n.text.slice(0, 100), q)}${n.text.length > 100 ? '…' : ''}</span>
          <span class="sur-row-sub">${refBadge}${dateLabel}</span>
        </div>
      </div>`;
    });
    if (noteMatches.length > 20) {
      html += `<div class="sur-more">+${noteMatches.length - 20} nota${noteMatches.length - 20 !== 1 ? 's' : ''} más</div>`;
    }
    html += '</div></div>';
  }

  // Grupo Contratos — R-202604-075
  if (contratoMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">📐 Contratos (${contratoMatches.length})</div>
      <div class="sur-rows">`;
    contratoMatches.forEach(r => {
      const icon = r.type === 'contrato-modulo' ? '📄' : '⚙';
      html += `<div class="sur-row" onclick="(${r.action.toString()})()">
        <span class="sur-row-icon">${icon}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(r.label, q)}</span>
          <span class="sur-row-sub">${_esc(r.sub)}</span>
        </div>
      </div>`;
    });
    html += '</div></div>';
  }

  // Grupo Backlog — T-202604-420
  if (backlogMatches.length) {
    const bSlice = backlogMatches.slice(0, 25);
    const bMore = backlogMatches.length - bSlice.length;
    html += `<div class="sur-group">
      <div class="sur-group-label">🗃 Backlog (${backlogMatches.length})</div>
      <div class="sur-rows">`;
    bSlice.forEach(item => {
      const typeIcons = { R: '🔵', T: '🟢', B: '🔴', P: '🟣' };
      const typeChar = (item.code || '').charAt(0);
      const icon = typeIcons[typeChar] || '📌';
      const statusLabel = item.status === 'done' ? ' · ✓' : '';
      html += `<div class="sur-row" onclick="navigateToItem(${JSON.stringify(item.code)})">
        <span class="sur-row-icon">${icon}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(item.title || item.desc || item.code, q)}</span>
          <span class="sur-row-sub"><span class="sur-badge">${_esc(item.code)}</span>${statusLabel}</span>
        </div>
      </div>`;
    });
    if (bMore > 0) {
      html += `<div class="sur-more">+${bMore} ítem${bMore !== 1 ? 's' : ''} más — usa filtros de Backlog para explorar</div>`;
    }
    html += '</div></div>';
  }

  // Grupo Proyectos — T-202604-420
  if (projMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">📁 Proyectos (${projMatches.length})</div>
      <div class="sur-rows">`;
    projMatches.forEach(p => {
      const sessCount = (p.sessions || []).length;
      html += `<div class="sur-row" onclick="typeof selectProjectFilter==='function'&&selectProjectFilter(${JSON.stringify(p.id)})">
        <span class="sur-row-icon">${_esc(p.icon || '📁')}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(p.name, q)}</span>
          <span class="sur-row-sub">${sessCount} sesión${sessCount !== 1 ? 'es' : ''}</span>
        </div>
      </div>`;
    });
    html += '</div></div>';
  }

  if (!totalWithContratos) {
    html += `<div class="sur-empty">Sin resultados para "<strong>${_esc(q)}</strong>"</div>`;
  }

  // B-243: Grupo Contexto — secciones del sub-tab Contexto que coinciden con la búsqueda
  if (contextMatches.length) {
    const ctxSlice = contextMatches.slice(0, 6);
    const ctxMore  = contextMatches.length - ctxSlice.length;
    html += `<div class="sur-group">
      <div class="sur-group-label">📄 Contexto (${contextMatches.length})</div>
      <div class="sur-rows">`;
    ctxSlice.forEach(sec => {
      const secIdx = _ctxSections.indexOf(sec);
      const snippet = sec.lines.find(l => {
        const n = l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return n.includes(q.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      }) || '';
      html += `<div class="sur-row" onclick="
        (function(){
          if(typeof switchTab==='function') switchTab('backlog');
          setTimeout(function(){
            if(typeof switchSubTab==='function') switchSubTab('context');
            setTimeout(function(){
              if(typeof toggleContextSection==='function') toggleContextSection(${secIdx});
              var el=document.getElementById('ctx-sec-${secIdx}');
              if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
            },120);
          },80);
        })()">
        <span class="sur-row-icon">📄</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(sec.title, q)}</span>
          ${snippet ? `<span class="sur-meta">${hlText(snippet.trim().slice(0, 80), q)}${snippet.trim().length > 80 ? '…' : ''}</span>` : ''}
        </div>
      </div>`;
    });
    if (ctxMore > 0) {
      html += `<div class="sur-more">+${ctxMore} sección${ctxMore !== 1 ? 'es' : ''} más — abre Contexto para explorar</div>`;
    }
    html += '</div></div>';
  }

  html += '</div>';

  const panel = document.createElement('div');
  panel.id = 'search-unified-results';
  panel.className = 'search-unified-results';
  panel.innerHTML = html;
  grid.insertAdjacentElement('afterend', panel);
}

// ── T-202604-061: Analytics — gráfico comparativo mensual ──

// Reutiliza los mismos colores que chrono para consistencia visual
const ANALYTICS_COLORS = ['#8BC34A','#38bdf8','#e8a832','#e85555','#f472b6','#a3e635','#fb923c','#2ecc78'];

function getAnalyticsColor(idx) {
  return ANALYTICS_COLORS[idx % ANALYTICS_COLORS.length];
}

// ── Analytics período: 'week' | 'month' | 'quarter' (default: week) ──
let _analyticsPeriod = localStorage.getItem('analytics-period') || 'week';
// R-202604-070: Comparación side-by-side — dos proyectos independientes
let _compareProjectIdA = null;
let _compareProjectIdB = null;
// Alias legacy para retrocompatibilidad con setCompareProject existente
function setCompareProject(projId) {
  _compareProjectIdB = projId || null;
  renderAnalytics();
}
function setCompareProjectA(projId) {
  _compareProjectIdA = projId || null;
  renderAnalytics();
}
function setCompareProjectB(projId) {
  _compareProjectIdB = projId || null;
  renderAnalytics();
}
function clearComparison() {
  _compareProjectIdA = null;
  _compareProjectIdB = null;
  renderAnalytics();
}

function setAnalyticsPeriod(p) {
  _analyticsPeriod = p;
  localStorage.setItem('analytics-period', p);
  document.querySelectorAll('.period-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.period === p);
  });
  renderAnalytics();
}

// Legacy — mantenido para compatibilidad con exportAnalyticsMd y otros llamadores
let _analyticsRange = 3;
function setAnalyticsRange(n) { _analyticsRange = n; renderAnalytics(); }

// T-202605-452: Gráfico de flujo acumulativo — filtros de proyecto y tipo
let _cfProjId   = '';
let _cfTypeFilter = '';
function setCfProject(id)   { _cfProjId = id || ''; renderAnalytics(); }
function setCfType(t)        { _cfTypeFilter = t || ''; renderAnalytics(); }

// Devuelve { current: {start,end}, previous: {start,end} } para el período activo
function _getPeriodBounds() {
  const now = new Date();
  if (_analyticsPeriod === 'week') {
    // T-202604-399: 7 días rodantes (hoy incluido) en lugar de semana calendario
    const end = new Date(now); end.setHours(23,59,59,999);
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0,0,0,0);
    const prevEnd = new Date(start); prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    const prevStart = new Date(prevEnd); prevStart.setDate(prevEnd.getDate() - 6); prevStart.setHours(0,0,0,0);
    return { current: { start, end }, previous: { start: prevStart, end: prevEnd } };
  }
  if (_analyticsPeriod === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const pStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const pEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { current: { start, end }, previous: { start: pStart, end: pEnd } };
  }
  // quarter
  const q = Math.floor(now.getMonth() / 3);
  const qStart = new Date(now.getFullYear(), q * 3, 1);
  const qEnd = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
  const pqStart = new Date(now.getFullYear(), q * 3 - 3, 1);
  const pqEnd = new Date(now.getFullYear(), q * 3, 0, 23, 59, 59, 999);
  return { current: { start: qStart, end: qEnd }, previous: { start: pqStart, end: pqEnd } };
}

// Filtra sesiones dentro de un rango {start,end}
function _sessInRange(sessions, range) {
  return sessions.filter(s => {
    if (!s.date) return false;
    let d = new Date(s.date);
    if (isNaN(d.getTime())) d = _parseSpanishDate(s.date);
    return d && !isNaN(d.getTime()) && d >= range.start && d <= range.end;
  });
}

// Devuelve etiqueta del período actual
function _periodLabel() {
  const now = new Date();
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  if (_analyticsPeriod === 'week') {
    // T-202604-399: etiqueta de 7 días rodantes
    const bounds = _getPeriodBounds();
    const s = bounds.current.start, e = bounds.current.end;
    return `Últ. 7 días · ${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]}`;
  }
  if (_analyticsPeriod === 'month') return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `Q${q} ${now.getFullYear()}`;
}

// Etiqueta del período anterior
function _prevPeriodLabel() {
  const now = new Date();
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  if (_analyticsPeriod === 'week') {
    const bounds = _getPeriodBounds();
    const s = bounds.previous.start, e = bounds.previous.end;
    return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]}`;
  }
  if (_analyticsPeriod === 'month') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${MONTHS[prev.getMonth()]} ${prev.getFullYear()}`;
  }
  const q = Math.floor(now.getMonth() / 3);
  const prevQ = q === 0 ? 4 : q;
  const prevY = q === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return `Q${prevQ} ${prevY}`;
}

// Delta formateado con flecha
function _delta(curr, prev) {
  if (prev === 0 && curr === 0) return { html: '<span class="kpi-delta neutral">—</span>', dir: 0 };
  if (prev === 0) return { html: `<span class="kpi-delta up">▲ nuevo</span>`, dir: 1 };
  const d = curr - prev;
  if (d === 0) return { html: `<span class="kpi-delta neutral">= igual</span>`, dir: 0 };
  const pct = Math.round(Math.abs(d / prev) * 100);
  if (d > 0) return { html: `<span class="kpi-delta up">▲ ${pct}%</span>`, dir: 1 };
  return { html: `<span class="kpi-delta down">▼ ${pct}%</span>`, dir: -1 };
}

// Genera semanas dentro del período actual para el gráfico de barras
// Mantenido por compatibilidad — internamente delega a _getIntervalsInPeriod
function _getWeeksInPeriod() {
  return _getIntervalsInPeriod().intervals;
}

// Granularidad adaptativa según período:
//   week   → días (7 barras)
//   month  → días (28–31 barras)
//   quarter → semanas (12–13 barras)
// Devuelve { intervals, granularity } donde cada interval es { start, end, idx }
function _getIntervalsInPeriod() {
  const bounds = _getPeriodBounds();
  const { start, end } = bounds.current;
  const granularity = _analyticsPeriod === 'quarter' ? 'week' : 'day';
  const intervals = [];

  if (granularity === 'day') {
    // Un intervalo por día desde start hasta end
    const d = new Date(start); d.setHours(0,0,0,0);
    const endDay = new Date(end); endDay.setHours(23,59,59,999);
    let idx = 0;
    while (d <= endDay) {
      const iStart = new Date(d);
      const iEnd = new Date(d); iEnd.setHours(23,59,59,999);
      intervals.push({ start: iStart, end: iEnd, idx: idx++ });
      d.setDate(d.getDate() + 1);
    }
  } else {
    // Un intervalo por semana (lunes→domingo)
    const d = new Date(start);
    const dow = d.getDay();
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diffToMon);
    d.setHours(0,0,0,0);
    let idx = 0;
    while (d <= end) {
      const wStart = new Date(d);
      const wEnd = new Date(d); wEnd.setDate(d.getDate() + 6); wEnd.setHours(23,59,59,999);
      intervals.push({ start: wStart, end: wEnd, idx: idx++ });
      d.setDate(d.getDate() + 7);
    }
  }

  return { intervals, granularity };
}

// Devuelve los últimos N meses como strings 'YYYY-MM', más antiguo primero (legacy)
function lastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// Legacy — usado por exportAnalyticsMd
function getAnalyticsMonths() { return lastNMonths(3); }

// Formatea 'YYYY-MM' → 'Ene 25' para eje X
function fmtMonth(ym) {
  const [y, m] = ym.split('-');
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return names[parseInt(m, 10) - 1] + ' ' + String(y).slice(2);
}

// Extrae 'YYYY-MM' de un campo date de sesión
function sessionYM(s) {
  if (!s.date) return null;
  let d = new Date(s.date);
  if (isNaN(d.getTime())) d = _parseSpanishDate(s.date);
  if (!d || isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Parsea formato de fecha español legacy: "12 abr 2026 11:08 a.m."
function _parseSpanishDate(str) {
  const _MES = {ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11};
  const m = String(str).toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?))?/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = _MES[m[2].slice(0,3)];
  const year = parseInt(m[3], 10);
  if (mon === undefined || isNaN(day) || isNaN(year)) return null;
  let hour = m[4] ? parseInt(m[4], 10) : 12;
  const min = m[5] ? parseInt(m[5], 10) : 0;
  if (m[6]) {
    const pm = m[6].replace(/\./g,'') === 'pm';
    if (pm && hour !== 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
  }
  return new Date(year, mon, day, hour, min, 0);
}

// Extrae fecha YYYY-MM-DD de sesión para cálculos de racha
function sessionDateKey(s) {
  if (!s.date) return null;
  let d = new Date(s.date);
  if (isNaN(d.getTime())) d = _parseSpanishDate(s.date);
  if (!d || isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Tooltip singleton
let _analyticsTooltip = null;
function getTooltip() {
  if (!_analyticsTooltip) {
    _analyticsTooltip = document.createElement('div');
    _analyticsTooltip.className = 'analytics-tooltip';
    document.body.appendChild(_analyticsTooltip);
  }
  return _analyticsTooltip;
}

function showAnalyticsTooltip(e, monthLabel, rows) {
  const tip = getTooltip();
  const total = rows.reduce((s, r) => s + r.count, 0);
  tip.innerHTML = `
    <div class="atip-header">
      <span class="atip-date">${monthLabel}</span>
      <span class="atip-total">${total}</span>
    </div>
    <div class="atip-rows">
      ${rows.map(r => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
        return `<div class="atip-row">
          <span class="atip-dot" style="--tip-dot-color:${r.color}"></span>
          <span class="atip-name">${esc(r.name)}</span>
          <span class="atip-count">${r.count}</span>
          <div class="atip-bar-track"><div class="atip-bar-fill" style="--tip-bar-pct:${pct}%;--tip-bar-color:${r.color}"></div></div>
        </div>`;
      }).join('')}
    </div>`;
  tip.classList.add('visible');
  _posTooltip(e);
}

function _posTooltip(e) {
  const tip = getTooltip();
  const tw = tip.offsetWidth || 140;
  const th = tip.offsetHeight || 80;
  let x = e.clientX + 14;
  let y = e.clientY - th / 2;
  if (x + tw > window.innerWidth - 8) x = e.clientX - tw - 14;
  if (y < 4) y = 4;
  if (y + th > window.innerHeight - 4) y = window.innerHeight - th - 4;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}

function hideAnalyticsTooltip() {
  const tip = getTooltip();
  tip.classList.remove('visible');
}

// ═══ T-202604-380: Count-up en métricas numéricas de cards de proyectos ═══
let _countupDone = false;

function _animateCountUp(container) {
  if (_countupDone) return;
  _countupDone = true;

  const els = container.querySelectorAll('[data-countup]');
  if (!els.length) return;

  const duration = 400;
  const start = performance.now();

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeOut(progress);

    els.forEach(el => {
      const target = parseInt(el.dataset.countup, 10);
      if (isNaN(target)) return;
      const current = Math.round(ease * target);

      // Preserve first text node (the number + optional suffix like "%")
      // Children (e.g. .proy2-metric-frac) are untouched — only the leading text node
      const firstChild = el.firstChild;
      if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
        const full = firstChild.textContent;
        // Replace leading integer in the text node
        firstChild.textContent = full.replace(/^\d+/, current);
      } else if (!el.querySelector('[data-countup-skip]')) {
        // Fallback: element has no text node prefix (pure number, no suffix)
        const saved = el.innerHTML;
        el.dataset.countupSaved = el.dataset.countupSaved || saved;
        el.textContent = String(current);
      }
    });

    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ═══ T-202604-119: Tab Proyectos — Dashboard estratégico ═══
function renderProyectos() {
  const el = document.getElementById('tab-proyectos-inner');
  if (!el) return;

  const allProjects = state.projects || [];
  const activeProjects = allProjects.filter(p => p.status !== 'archived');
  const archivedProjects = allProjects.filter(p => p.status === 'archived');
  const activeProjId = _getActiveProjectFilter();

  // — helpers —
  function _weekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  function _projSessions(proj) {
    return getProjectSessions(proj.id) || [];
  }

  function _sessThisWeek(proj) {
    const from = _weekStart();
    return _projSessions(proj).filter(s => {
      const d = s.date ? new Date(s.date) : null;
      return d && d >= from;
    });
  }

  function _lastSession(proj) {
    const sess = _projSessions(proj).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return sess[0] || null;
  }

  // T-202604-276: tendencia de actividad — compara últimas 2 semanas vs 2 semanas anteriores
  // Retorna: { badge: string|null, dir: "up"|"down"|null }
  function _trend(proj) {
    const sessions = _projSessions(proj);
    if (!sessions.length) return { badge: null, dir: null };
    const now = Date.now();
    const W2 = 14 * 24 * 60 * 60 * 1000;
    const recent = sessions.filter(s => s.date && (now - new Date(s.date).getTime()) <= W2).length;
    const prev   = sessions.filter(s => s.date && (now - new Date(s.date).getTime()) > W2 && (now - new Date(s.date).getTime()) <= W2 * 2).length;
    if (prev === 0 && recent === 0) return { badge: null, dir: null };
    if (prev === 0) return { badge: null, dir: null }; // primer periodo sin base — neutro
    const delta = (recent - prev) / prev;
    if (delta >= 0.2)  return { badge: '<span class="proy2-trend proy2-trend-up">↑ acelerando</span>', dir: "up" };
    if (delta <= -0.2) return { badge: '<span class="proy2-trend proy2-trend-down">↓ desacelerando</span>', dir: "down" };
    return { badge: null, dir: null };
  }

  function _relTimeShort(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 2) return 'ahora';
    if (m < 60) return `hace ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `hace ${d}d`;
    const w = Math.floor(d / 7);
    if (w < 5) return `hace ${w}sem`;
    return `hace ${Math.floor(d / 30)}mes`;
  }

  function _backlogStats(proj) {
    const key = _projKey('backlog-items', proj.id);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const items = JSON.parse(raw);
      if (!items || !items.length) return null;
      // Lógica R-con-hijos: R con hijos → excluir R, contar hijos. R sin hijos → contar R.
      const rCodesWithChildren = new Set(items.filter(i => i.parentId).map(i => i.parentId));
      const countable = items.filter(i => {
        if ((i.code || '')[0] === 'R' && rCodesWithChildren.has(i.code)) return false;
        return i.status !== 'descartado';
      });
      const total = countable.filter(i => i.status === 'pendiente' || i.status === 'done').length;
      const done = countable.filter(i => i.status === 'done').length;
      const pending = countable.filter(i => i.status === 'pendiente').length;
      const highPending = countable.filter(i => i.status === 'pendiente' && i.priority === 'high').length;
      const next = countable.find(i => i.status === 'pendiente');
      return { total, done, pending, highPending, next };
    } catch { return null; }
  }

  function _typeColor(code) {
    if (!code) return 'var(--accent)';
    if (code.startsWith('T')) return 'var(--green)';
    if (code.startsWith('B')) return 'var(--red)';
    if (code.startsWith('R')) return '#38bdf8';
    return '#7c6af7';
  }

  function _effortDots(n) {
    const v = parseInt(n) || 1;
    return '●'.repeat(v) + '○'.repeat(Math.max(0, 3 - v));
  }

  function _buildCard(proj, isArchived, idx = 0) {
    const isSelected = proj.id === activeProjId;
    const weekly = _sessThisWeek(proj);
    const last = _lastSession(proj);
    const bk = _backlogStats(proj);
    // T-202604-276: tendencia — solo para proyectos activos
    const trendData = !isArchived ? _trend(proj) : { badge: null };

    // Icon
    const iconHtml = proj.icon
      ? `<div class="proy2-icon">${esc(proj.icon)}</div>`
      : `<div class="proy2-icon proy2-icon--default" style="--proj-color-bg:${proj.color||'#7c6af7'}22;--proj-color-border:${proj.color||'#7c6af7'}44;--proj-color:${proj.color||'#7c6af7'}">📁</div>`;

    // Badges
    const statusBadge = isArchived
      ? `<span class="proy2-badge proy2-badge-paused">📦 Archivado</span>`
      : `<span class="proy2-badge proy2-badge-active">● Activo</span>`;
    const selectedBadge = ''; // T-375: removed pill — visual handled by card class + CSS
    // T-202604-276: badge de tendencia (solo activos, solo si hay dato)
    const trendBadge = trendData.badge || '';
    // T-202604-272: badge "Estancado" — activos con 7+ días sin sesión
    let stagnantBadge = '';
    if (!isArchived && last) {
      const daysSince = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
      if (daysSince >= 7) {
        stagnantBadge = `<span class="proy2-badge proy2-badge-stagnant">⏸ Estancado · ${daysSince}d</span>`;
      }
    }

    // Actions — T-202604-318: Eliminar con inline confirm, sin modal global
    const actionsHtml = isArchived
      ? `<button class="proy2-btn" onclick="event.stopPropagation();toggleProjArchive('${proj.id}')">↩ Restaurar</button>
         <button class="proy2-btn" onclick="event.stopPropagation();openProjModal(true,'${proj.id}')">Editar</button>
         <button class="proy2-btn proy2-btn-danger" onclick="event.stopPropagation();_proyDeleteInline('${proj.id}')" title="Eliminar">✕</button>`
      : `<button class="proy2-btn proy2-btn-icon" onclick="event.stopPropagation();toggleProjArchive('${proj.id}')" title="Archivar">📦</button>
         <button class="proy2-btn" onclick="event.stopPropagation();openProjModal(true,'${proj.id}')">Editar</button>
         <button class="proy2-btn proy2-btn-primary" onclick="event.stopPropagation();_proyAbrir('${proj.id}')">Abrir</button>
         <button class="proy2-btn proy2-btn-danger" onclick="event.stopPropagation();_proyDeleteInline('${proj.id}')" title="Eliminar">✕</button>`;

    // Metrics row — only for active
    let metricsHtml = '';
    if (!isArchived) {
      // Progress
      let progressContent;
      if (!bk) {
        progressContent = `<div class="proy2-metric-value proy2-muted">—</div><div class="proy2-metric-sub">sin backlog</div>`;
      } else {
        const pct = bk.total > 0 ? Math.round((bk.done / bk.total) * 100) : 0;
        progressContent = `
          <div class="proy2-metric-value" data-countup="${pct}">${pct}% <span class="proy2-metric-frac">${bk.done}/${bk.total}</span></div>
          <div class="proy2-progress-bg"><div class="proy2-progress-fill" style="--proj-progress-pct:${pct}%;--proj-progress-color:${proj.color||'var(--green)'}"></div></div>`;
      }

      // Checkpoints this week
      const weekActive = weekly.length > 0;
      const weekContent = weekActive
        ? `<div class="proy2-metric-value proy2-green" data-countup="${weekly.length}">${weekly.length}</div><div class="proy2-metric-sub"><span class="proy2-dot proy2-dot-green"></span>Activo esta semana</div>`
        : `<div class="proy2-metric-value proy2-muted" data-countup="0">0</div><div class="proy2-metric-sub"><span class="proy2-dot proy2-dot-gray"></span>Sin actividad</div>`;

      // Last checkpoint
      const lastContent = last
        ? `<div class="proy2-metric-value proy2-metric-sm">${_relTimeShort(last.date)}</div>`
        : `<div class="proy2-metric-value proy2-muted proy2-metric-sm">—</div>`;

      // Pending items
      let pendContent;
      if (!bk) {
        pendContent = `<div class="proy2-metric-value proy2-muted">—</div>`;
      } else {
        pendContent = `<div class="proy2-metric-value" data-countup="${bk.pending}">${bk.pending}</div>
          <div class="proy2-metric-sub">${bk.highPending > 0 ? `${bk.highPending} prioridad alta` : 'sin prioridad alta'}</div>`;
      }

      metricsHtml = `<div class="proy2-metrics">
        <div class="proy2-metric">
          <div class="proy2-metric-label">Progreso backlog</div>
          ${progressContent}
        </div>
        <div class="proy2-metric">
          <div class="proy2-metric-label">Checkpoints semana</div>
          ${weekContent}
        </div>
        <div class="proy2-metric">
          <div class="proy2-metric-label">Último checkpoint</div>
          ${lastContent}
        </div>
        <div class="proy2-metric">
          <div class="proy2-metric-label">Ítems pendientes</div>
          ${pendContent}
        </div>
      </div>`;
    }

    // R-202604-063 AC-03: velocidad del proyecto en card
    // R-202604-063 AC-05: fecha estimada de cierre
    // Note: _calcProjVelocity and _estimateSprintClose are defined in renderProyectos scope
    let velocityHtml = '';
    let sprintEstHtml = '';
    if (!isArchived && typeof _calcProjVelocity === 'function') {
      const vel = _calcProjVelocity(proj);
      const est = typeof _estimateSprintClose === 'function' ? _estimateSprintClose(proj) : null;
      velocityHtml = `<div class="proy2-velocity">
        <span class="proy2-velocity-label">Velocidad</span>
        <span class="proy2-velocity-val">${vel > 0 ? vel + ' ses/sem' : '—'}</span>
      </div>`;
      sprintEstHtml = `<div class="proy2-sprint-est">
        <span class="proy2-sprint-est-label">Cierre estimado</span>
        <span class="proy2-sprint-est-val">${est || '—'}</span>
      </div>`;
    }

    // R-202604-063 AC-07 (T-377): timeline heatmap horizontal — 14 días
    let heatmapHtml = '';
    if (!isArchived) {
      const sessions = _projSessions(proj);
      const dots = [];
      for (let d = 13; d >= 0; d--) {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - d);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const count = sessions.filter(s => {
          const sd = s.date ? new Date(s.date) : null;
          return sd && sd >= dayStart && sd < dayEnd;
        }).length;
        const level = count === 0 ? 'heat-0' : count === 1 ? 'heat-1' : 'heat-2';
        const label = dayStart.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
        dots.push(`<div class="proy2-heat-dot ${level}" title="${label}${count ? ' · ' + count + ' sesión' + (count > 1 ? 'es' : '') : ''}"></div>`);
      }
      heatmapHtml = `<div class="proy2-heatmap">${dots.join('')}</div>`;
    }

    // Next item
    let nextHtml = '';
    if (bk && bk.next) {
      const c = bk.next.code || '';
      nextHtml = `<div class="proy2-next">
        <span class="proy2-next-label">🚩 Próximo</span>
        <div class="proy2-next-content">
          <div>
            <span class="proy2-next-code" style="--item-type-color:${_typeColor(c)}">${esc(c)}</span>
            ${c ? `<span class="proy2-next-sep">·</span>` : ''}
            <span class="proy2-next-desc">${esc((bk.next.title || '').slice(0, 90))}</span>
          </div>
          <div class="proy2-next-meta">
            <span>${_effortDots(bk.next.effort)}</span>
            ${bk.next.area ? `<span>${esc(bk.next.area)}</span>` : ''}
            ${bk.next.sprint ? `<span>sprint ${esc(bk.next.sprint)}</span>` : '<span>sin sprint</span>'}
          </div>
        </div>
      </div>`;
    } else if (!isArchived) {
      nextHtml = `<div class="proy2-next">
        <span class="proy2-next-label">🚩 Próximo</span>
        <span class="proy2-next-empty">Sin ítems pendientes</span>
      </div>`;
    }

    // T-202604-263: última sesión visible sin click
    let lastSessHtml = '';
    if (!isArchived) {
      if (last) {
        const lastAI = state.ais.find(a => a.id === last.aiId);
        const lastAIName = lastAI ? lastAI.name : (last.aiId || '—');
        const lastDate = (typeof relDate === 'function' ? relDate(last.date, last.savedAt || last.createdAt) : null) || _relTimeShort(last.date) || '';
        lastSessHtml = `<div class="proy2-last-sess">
          <span class="proy2-last-sess-label">Última sesión</span>
          <div class="proy2-last-sess-body">
            <span class="proy2-last-sess-date">${esc(lastDate)}</span>
            <span class="proy2-last-sess-sep">·</span>
            <span class="proy2-last-sess-ai">${esc(lastAIName)}</span>
            <span class="proy2-last-sess-sep">·</span>
            <span class="proy2-last-sess-title">${esc((last.title || '').slice(0, 80))}</span>
          </div>
        </div>`;
      } else {
        lastSessHtml = `<div class="proy2-last-sess">
          <span class="proy2-last-sess-label">Última sesión</span>
          <span class="proy2-last-sess-empty">Sin sesiones aún</span>
        </div>`;
      }
    }

    const cardClass = ['proy2-card', isSelected ? 'proy2-selected' : '', isArchived ? 'proy2-paused' : ''].filter(Boolean).join(' ');
    const sessCount = _countProjSessions ? _countProjSessions(proj) : (proj.sessions || []).length;
    const deleteMsg = sessCount > 0
      ? `${sessCount} sesiones se conservarán. ¿Eliminar "${esc(proj.name)}"?`
      : `¿Eliminar "${esc(proj.name)}"? Esta acción no se puede deshacer.`;

    return `<div class="${cardClass}" id="proy2-card-${proj.id}" style="--card-idx:${idx}">
      <div class="proy2-header">
        ${iconHtml}
        <div class="proy2-title-block">
          <div class="proy2-name">${esc(proj.name)}</div>
          <div class="proy2-badges">${statusBadge}${selectedBadge}${trendBadge}${stagnantBadge}</div>
        </div>
        <div class="proy2-actions">${actionsHtml}</div>
      </div>
      ${heatmapHtml}
      ${nextHtml}
      ${metricsHtml}
      <div class="proy2-footer-meta">
        ${velocityHtml}
        ${sprintEstHtml}
      </div>
      ${lastSessHtml}
      <div class="inline-confirm proy2-inline-confirm" id="proy2-del-confirm-${proj.id}">
        <div class="inline-confirm-msg">${deleteMsg}</div>
        <div class="inline-confirm-actions">
          <button class="btn-sm danger" onclick="event.stopPropagation();_proyDeleteExecute('${proj.id}')">Sí, eliminar</button>
          <button class="btn-sm" onclick="event.stopPropagation();_proyDeleteInline('${proj.id}')">Cancelar</button>
        </div>
      </div>
    </div>`;
  }

  // — render —
  const activeCount = activeProjects.length;
  const totalCount = allProjects.length;

  if (!totalCount) {
    el.innerHTML = `
      <div class="proy2-top-bar">
        <div class="proy2-top-title">📁 Proyectos</div>
        <button class="proy2-btn proy2-btn-new" onclick="openProjModal()">+ Nuevo</button>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Sin proyectos</div>
        <div class="empty-state-hint">Los proyectos agrupan tus sesiones y backlog. Crea el primero para organizar tu trabajo.</div>
        <button class="empty-state-btn" onclick="openProjModal()">＋ Nuevo proyecto</button>
      </div>`;
    return;
  }

  // T-202604-389: Activos primero — proyectos con sesión esta semana antes que inactivos
  const sortedActiveProjects = [...activeProjects].sort((a, b) => {
    const aActive = _sessThisWeek(a).length > 0 ? 1 : 0;
    const bActive = _sessThisWeek(b).length > 0 ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    // secundario: último checkpoint más reciente primero
    const aLast = _lastSession(a);
    const bLast = _lastSession(b);
    return new Date(bLast?.date || 0) - new Date(aLast?.date || 0);
  });
  const activeCardsHtml = sortedActiveProjects.map((p, i) => _buildCard(p, false, i)).join('');

  const archivedOpen = localStorage.getItem('proy2-archived-open') !== '0';
  const archivedSectionHtml = archivedProjects.length
    ? `<div class="proy2-archived-section">
        <button onclick="
          var o=localStorage.getItem('proy2-archived-open')!=='0';
          localStorage.setItem('proy2-archived-open',o?'0':'1');
          renderProyectos();
        " class="proy2-archived-toggle">
          <span>${archivedOpen ? '▾' : '▸'}</span>
          <span>Archivados (${archivedProjects.length})</span>
        </button>
        ${archivedOpen ? archivedProjects.map((p, i) => _buildCard(p, true, i)).join('') : ''}
      </div>`
    : '';

  // R-202604-063 AC-02: velocidad = sesiones/semana promedio últimas 4 semanas por proyecto
  function _calcProjVelocity(proj) {
    const sessions = _projSessions(proj);
    if (!sessions.length) return 0;
    const now = Date.now();
    const W4 = 28 * 24 * 60 * 60 * 1000;
    const recent = sessions.filter(s => s.date && (now - new Date(s.date).getTime()) <= W4);
    return Math.round((recent.length / 4) * 10) / 10; // 1 decimal
  }

  // R-202604-063 AC-04: fecha estimada de cierre basada en ítems pendientes / velocidad
  function _estimateSprintClose(proj) {
    const vel = _calcProjVelocity(proj);
    if (vel === 0) return null;
    const bk = _backlogStats(proj);
    if (!bk || bk.pending === 0) return null;
    const weeksNeeded = bk.pending / vel;
    const closeDate = new Date(Date.now() + weeksNeeded * 7 * 24 * 60 * 60 * 1000);
    const dd = String(closeDate.getDate()).padStart(2, '0');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `~${dd} ${months[closeDate.getMonth()]}`;
  }

  // R-202604-063 AC-06: sugerencia del día — proyecto con más high priority sin sesión esta semana
  function _suggestionProj() {
    const candidates = activeProjects.filter(p => _sessThisWeek(p).length === 0);
    if (!candidates.length) return null;
    const scored = candidates.map(p => {
      const bk = _backlogStats(p);
      return { proj: p, score: bk ? bk.highPending : 0 };
    }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);
    return scored[0] ? scored[0].proj : null;
  }
  const suggestion = _suggestionProj();

  // R-202604-063 AC-01: header ecosistema — total activos + sesiones globales + high priority urgente
  const totalGlobalSess = (state.ais || []).reduce((acc, ai) => {
    return acc + (getAISessions ? getAISessions(ai.id).length : 0);
  }, 0);
  const allHighPending = activeProjects.reduce((acc, p) => {
    const bk = _backlogStats(p);
    return acc + (bk ? bk.highPending : 0);
  }, 0);

  const suggestionHtml = suggestion
    ? `<div class="proy2-suggestion">💡 Sugerencia: <span class="proy2-suggestion-name">${esc(suggestion.name)}</span> — sin actividad esta semana, tiene ítems de prioridad alta</div>`
    : '';

  const ecosHeaderHtml = `
    <div class="proy2-eco-header">
      <div class="proy2-eco-stats">
        <span class="proy2-eco-stat"><strong>${activeCount}</strong> proyecto${activeCount !== 1 ? 's' : ''}</span>
        <span class="proy2-eco-sep">·</span>
        <span class="proy2-eco-stat"><strong>${totalGlobalSess}</strong> sesiones totales</span>
        ${allHighPending > 0 ? `<span class="proy2-eco-sep">·</span><span class="proy2-eco-stat proy2-eco-high"><strong>${allHighPending}</strong> prioridad alta pendientes</span>` : ''}
      </div>
      ${suggestionHtml}
    </div>`;

  el.innerHTML = `
    <div class="proy2-top-bar">
      <div class="proy2-top-title">📁 Proyectos <span class="proy2-top-count">${activeCount} activo${activeCount !== 1 ? 's' : ''}</span></div>
      <button class="proy2-btn proy2-btn-new" onclick="openProjModal()">+ Nuevo</button>
    </div>
    ${ecosHeaderHtml}
    <div class="proy2-list">
      ${activeCardsHtml}
      ${archivedSectionHtml}
    </div>`;

  // T-202604-380: count-up solo en primer render de página
  _animateCountUp(el);
}

// T-202604-318: confirmación inline en card de proyecto — sin modal global
function _proyDeleteInline(projId) {
  const el = document.getElementById(`proy2-del-confirm-${projId}`);
  if (!el) return;
  el.classList.toggle('open');
}

function _proyDeleteExecute(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  state.projects = (state.projects || []).filter(p => p.id !== projId);
  if (typeof _getActiveProjectFilter === 'function' && _getActiveProjectFilter() === projId) {
    _setActiveProjectFilter('');
  }
  save();
  renderProyectos();
  if (typeof _updateProjBreadcrumb === 'function') _updateProjBreadcrumb();
  showToast('success', `Proyecto eliminado`);
}

function _proyAbrir(projId) {
  _setActiveProjectFilter(projId);
  _updateProjBreadcrumb();
  _updateProjFilterBtn();
  // Recargar templates con las keys del proyecto recién activado
  loadBacklog();
  loadHtmlMap();
  // Refrescar el sub-tab activo si Templates está visible
  if (currentSubTab) switchSubTab(currentSubTab);
  switchTab('hoy');
  showToast('info', 'Proyecto activo: ' + (getProjectById(projId)?.name || projId));
}

// ── Helpers globales de backlog por rango — usados por renderAnalytics y exportWeeklySummary ──

// Retorna count de ítems con status=done cuyo timestamp de cierre cae en range {start,end}
function _closedItemsInRange(range) {
  let count = 0;
  (state.projects || []).forEach(p => {
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        if (item.status !== 'done') return;
        const ts = item.closedAt || item.updatedAt || item.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (!isNaN(d) && d >= range.start && d <= range.end) count++;
      });
    } catch {}
  });
  return count;
}

// Retorna count de ítems creados en range {start,end}
function _openedItemsInRange(range) {
  let count = 0;
  (state.projects || []).forEach(p => {
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        const ts = item.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (!isNaN(d) && d >= range.start && d <= range.end) count++;
      });
    } catch {}
  });
  return count;
}

// Retorna array de ítems done en range, con campos {code, title, projId, projName}
function _closedItemsDetailInRange(range) {
  const results = [];
  (state.projects || []).forEach(p => {
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        if (item.status !== 'done') return;
        const ts = item.closedAt || item.updatedAt || item.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (!isNaN(d) && d >= range.start && d <= range.end) {
          results.push({ code: item.code || '—', title: item.title || '—', projId: p.id, projName: p.name || p.id });
        }
      });
    } catch {}
  });
  return results;
}

// Retorna array de ítems creados en range, con campos {code, title, projId, projName}
function _openedItemsDetailInRange(range) {
  const results = [];
  (state.projects || []).forEach(p => {
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        const ts = item.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (!isNaN(d) && d >= range.start && d <= range.end) {
          results.push({ code: item.code || '—', title: item.title || '—', projId: p.id, projName: p.name || p.id });
        }
      });
    } catch {}
  });
  return results;
}

// ── T-202604-273: Resumen semanal exportable a MD ──
function exportWeeklySummary() {
  const now = new Date();

  // Últimos 7 días (hoy inclusive)
  const end   = new Date(now); end.setHours(23,59,59,999);
  const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0,0,0,0);
  const range = { start, end };

  // B-202605-040: guard typeof — getAllSessions puede no estar disponible si el módulo no cargó
  if (typeof getAllSessions !== 'function') {
    showToast('error', 'Error al exportar — módulo de sesiones no disponible');
    return;
  }
  const allSess  = getAllSessions();
  const weekSess = _sessInRange(allSess, range);

  // Sesiones por proyecto
  const projSessMap = {};
  weekSess.forEach(s => {
    const pid = s.projectId || '__none__';
    if (!projSessMap[pid]) {
      const p = pid === '__none__' ? null : (state.projects || []).find(x => x.id === pid);
      projSessMap[pid] = { name: p ? p.name : 'Sin proyecto', sessions: [] };
    }
    projSessMap[pid].sessions.push(s);
  });

  // Ítems done y nuevos en la semana con detalle
  const doneItems   = _closedItemsDetailInRange(range);
  const newItems    = _openedItemsDetailInRange(range);

  // Checkpoints por proyecto (de T-274, misma lógica)
  const ckptByProj = Object.entries(projSessMap)
    .sort((a, b) => b[1].sessions.length - a[1].sessions.length)
    .map(([, v]) => `| ${v.name} | ${v.sessions.length} |`)
    .join('\n');

  // Formatear rango
  const MO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const fmtDate = d => `${d.getDate()} ${MO[d.getMonth()]} ${d.getFullYear()}`;
  const fechaFile = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  // Sesiones individuales agrupadas por proyecto
  let sessByProjMd = '';
  Object.values(projSessMap).forEach(({ name, sessions }) => {
    sessByProjMd += `\n### ${name}\n`;
    sessions
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .forEach(s => {
        const dateStr = s.dateShort || (s.date ? s.date.slice(0, 10) : '—');
        sessByProjMd += `- **${dateStr}** · ${s.title || '(sin título)'}\n`;
        if (s.summary) sessByProjMd += `  ${s.summary}\n`;
      });
  });
  if (!sessByProjMd) sessByProjMd = '\n_Sin sesiones en este período._\n';

  const doneSection = doneItems.length
    ? doneItems.map(i => `- \`${i.code}\` ${i.title} _(${i.projName})_`).join('\n')
    : '_Sin ítems cerrados en la semana._';

  const newSection = newItems.length
    ? newItems.map(i => `- \`${i.code}\` ${i.title} _(${i.projName})_`).join('\n')
    : '_Sin ítems nuevos en la semana._';

  // T-202605-454: Insight de horas productivas para el resumen semanal
  const _wkInsight = _buildHourlyInsightData(weekSess);
  const _wi_fmt = n => String(n).padStart(2, '0');
  let weeklyInsightMd = '';
  if (_wkInsight.maxSess > 0) {
    const wSessLabel   = _wkInsight.peakSessH >= 0 ? `${_wi_fmt(_wkInsight.peakSessH)}:00–${_wi_fmt(_wkInsight.peakSessH)}:59` : '—';
    const wClosedLabel = _wkInsight.peakClosedH >= 0 ? `${_wi_fmt(_wkInsight.peakClosedH)}:00–${_wi_fmt(_wkInsight.peakClosedH)}:59` : '—';
    const wSame = _wkInsight.peakSessH >= 0 && _wkInsight.peakSessH === _wkInsight.peakClosedH;
    const wText = wSame
      ? `Tu hora más productiva esta semana fue ${wSessLabel} — máxima actividad y máximos cierres coincidieron`
      : _wkInsight.peakClosedH >= 0
        ? `Iniciaste más sesiones a las ${wSessLabel} (${_wkInsight.maxSess}), pero cerraste más ítems a las ${wClosedLabel} (${_wkInsight.maxClosed})`
        : `Tu hora de mayor actividad esta semana fue ${wSessLabel} (${_wkInsight.maxSess} sesiones)`;
    weeklyInsightMd = `\n## Insight de horas productivas\n\n${wText}\n\n| Métrica | Hora pico | Total |\n|---------|-----------|-------|\n| Sesiones iniciadas | ${wSessLabel} | ${_wkInsight.maxSess} |\n${_wkInsight.maxClosed > 0 ? `| Ítems cerrados | ${wClosedLabel} | ${_wkInsight.maxClosed} |\n` : ''}`;
  }

  const md =
`# PEPE — Resumen semanal
> Período: ${fmtDate(start)} – ${fmtDate(end)} · Generado: ${fmtDate(now)}

## Checkpoints por proyecto

| Proyecto | Checkpoints |
|----------|-------------|
${ckptByProj || '| — | 0 |'}

**Total:** ${weekSess.length} checkpoint${weekSess.length !== 1 ? 's' : ''}

## Sesiones de la semana
${sessByProjMd}
## Ítems cerrados (done)

${doneSection}

## Ítems nuevos creados

${newSection}
${weeklyInsightMd}`;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `PEPE-Resumen-${fechaFile}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('success', 'Resumen semanal exportado');
}

// ── T-202604-271: Digest contextual al abrir app ──
const _DIGEST_KEY      = 'digest-last-open';
const _DIGEST_COOLDOWN = 8 * 60 * 60 * 1000; // 8 h en ms
const _DIGEST_MAX      = 3;

function _runDigestToasts() {
  // Guardia: no mostrar si la app se abrió hace menos de 8 h
  const now      = Date.now();
  const lastOpen = parseInt(localStorage.getItem(_DIGEST_KEY) || '0', 10);
  if (now - lastOpen < _DIGEST_COOLDOWN) return;
  localStorage.setItem(_DIGEST_KEY, String(now));

  const toasts = [];

  // AC1 — proyectos activos con más de 3 días sin sesión
  const activeProjs = (state.projects || []).filter(p => p.status !== 'paused');
  for (const proj of activeProjs) {
    if (toasts.length >= _DIGEST_MAX) break;
    const sessions = getProjectSessions(proj.id) || [];
    if (!sessions.length) continue; // proyecto sin sesiones — no aplica
    const lastDate = sessions
      .map(s => s.date ? new Date(s.date).getTime() : 0)
      .reduce((a, b) => Math.max(a, b), 0);
    if (!lastDate) continue;
    const daysSince = Math.floor((now - lastDate) / 86400000);
    if (daysSince > 3) {
      toasts.push({
        msg: `📂 <strong>${proj.name}</strong> lleva ${daysSince} días sin sesión`,
        type: 'info'
      });
    }
  }

  // AC2 — ítems bloqueados (sprint + pendiente + 14+ días sin movimiento)
  if (toasts.length < _DIGEST_MAX) {
    const BLOCKED_CUTOFF = now - 14 * 24 * 60 * 60 * 1000;
    const allItems       = typeof ITEMS !== 'undefined' ? ITEMS : [];
    const blockedCount   = allItems.filter(i =>
      i.sprint &&
      i.status === 'pendiente' &&
      (i.updatedAt || i.createdAt) &&
      (i.updatedAt || i.createdAt) < BLOCKED_CUTOFF
    ).length;
    if (blockedCount > 0) {
      toasts.push({
        msg: `🔒 ${blockedCount} ítem${blockedCount !== 1 ? 's' : ''} bloqueado${blockedCount !== 1 ? 's' : ''} — <a href="#" onclick="switchTab('tab-proyectos');return false;" class="analytics-link">ver Proyectos</a>`,
        type: 'warning'
      });
    }
  }

  // Emitir hasta _DIGEST_MAX toasts con stagger de 600 ms
  toasts.slice(0, _DIGEST_MAX).forEach((t, i) => {
    setTimeout(() => showToast(t.type, t.msg, null, 7000), i * 600);
  });
}

// Hook: correr tras load() + render() sin bloquear el render inicial
window.addEventListener('load', () => {
  setTimeout(_runDigestToasts, 1800);
});

// ── T-202605-452: Gráfico de flujo acumulativo — ítems creados vs cerrados ──
function _buildCumulativeFlowChart() {
  const W = 760, H = 220, PAD_L = 42, PAD_R = 16, PAD_T = 16, PAD_B = 36;
  const CHART_W = W - PAD_L - PAD_R;
  const CHART_H = H - PAD_T - PAD_B;

  // ── Recolectar todos los ítems de todos los proyectos (con filtro de proyecto) ──
  const allItems = [];
  (state.projects || []).forEach(p => {
    if (_cfProjId && p.id !== _cfProjId) return;
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        if (_cfTypeFilter && !(item.code || '').startsWith(_cfTypeFilter)) return;
        allItems.push(item);
      });
    } catch {}
  });

  if (!allItems.length) {
    return `<div class="analytics-empty">Sin datos para mostrar — registra ítems en el backlog</div>`;
  }

  // ── Determinar rango temporal: primer createdAt → hoy ──
  const now = new Date();
  const timestamps = allItems.map(i => i.createdAt).filter(Boolean).map(t => new Date(t));
  if (!timestamps.length) return `<div class="analytics-empty">Sin ítems con fecha de creación</div>`;

  const firstDate = new Date(Math.min(...timestamps));
  firstDate.setHours(0, 0, 0, 0);
  const lastDate = new Date(now);
  lastDate.setHours(23, 59, 59, 999);

  // Granularidad: si el rango > 60 días → semanas; si > 180 días → meses
  const totalDays = Math.ceil((lastDate - firstDate) / 86400000);
  let granularity = 'day';
  if (totalDays > 180) granularity = 'month';
  else if (totalDays > 60) granularity = 'week';

  // ── Construir array de puntos en el tiempo ──
  function buildPoints() {
    const points = [];
    const d = new Date(firstDate);

    while (d <= lastDate) {
      const pEnd = new Date(d);
      if (granularity === 'day')       { pEnd.setHours(23, 59, 59, 999); }
      else if (granularity === 'week') { pEnd.setDate(d.getDate() + 6); pEnd.setHours(23, 59, 59, 999); }
      else                             { pEnd.setMonth(d.getMonth() + 1, 0); pEnd.setHours(23, 59, 59, 999); }

      let opened = 0, closed = 0;
      allItems.forEach(item => {
        const created = item.createdAt ? new Date(item.createdAt) : null;
        const closedTs = item.status === 'done' ? (item.closedAt || item.updatedAt ? new Date(item.closedAt || item.updatedAt) : null) : null;
        if (created && !isNaN(created) && created <= pEnd) opened++;
        if (closedTs && !isNaN(closedTs) && closedTs <= pEnd) closed++;
      });

      points.push({ date: new Date(d), opened, closed });

      if (granularity === 'day')       d.setDate(d.getDate() + 1);
      else if (granularity === 'week') d.setDate(d.getDate() + 7);
      else                             d.setMonth(d.getMonth() + 1);
    }
    return points;
  }

  const points = buildPoints();
  if (points.length < 2) return `<div class="analytics-empty">Insuficientes datos temporales para graficar</div>`;

  const maxVal = Math.max(...points.map(p => p.opened), 1);

  // ── Helper: coordenadas x/y ──
  function xOf(i) { return PAD_L + (i / (points.length - 1)) * CHART_W; }
  function yOf(v) { return PAD_T + CHART_H - (v / maxVal) * CHART_H; }

  // ── Construir paths ──
  function buildPath(key) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p[key]).toFixed(1)}`).join(' ');
  }

  const pathOpened = buildPath('opened');
  const pathClosed = buildPath('closed');

  // ── Area fills (opened - gap between curves) ──
  const areaFill = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p.opened).toFixed(1)}`).join(' ')
    + ' '
    + [...points].reverse().map((p, ri, arr) => {
        const i = points.length - 1 - ri;
        return `${ri === 0 ? 'L' : 'L'}${xOf(i).toFixed(1)},${yOf(p.closed).toFixed(1)}`;
      }).join(' ')
    + ' Z';

  // ── Anotaciones de sprint ──
  const allSprints = (state.projects || []).flatMap(p => {
    if (_cfProjId && p.id !== _cfProjId) return [];
    return (p.sprints || []).map(s => ({ ...s, projName: p.name }));
  });

  const sprintAnnots = allSprints
    .filter(s => s.id)
    .map(s => {
      // Inferir fecha de inicio del sprint a partir del primer ítem done en ese sprint
      let startTs = null;
      allItems.forEach(item => {
        if ((item.sprint || '') !== s.id) return;
        const ts = item.createdAt;
        if (!ts) return;
        if (!startTs || ts < startTs) startTs = ts;
      });
      return startTs ? { id: s.id, ts: new Date(startTs) } : null;
    })
    .filter(Boolean)
    .filter(a => a.ts >= firstDate && a.ts <= lastDate);

  // ── Y-axis ticks ──
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((maxVal / tickCount) * i));

  const DAYS_SHORT  = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
  const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  function fmtDate(d) {
    if (granularity === 'day')   return `${DAYS_SHORT[d.getDay()]} ${d.getDate()}`;
    if (granularity === 'week')  return `${d.getDate()}/${d.getMonth() + 1}`;
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }

  // X-axis labels — show subset to avoid crowding
  const labelStep = Math.ceil(points.length / 8);
  const xLabels = points
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i % labelStep === 0 || i === points.length - 1)
    .map(({ p, i }) => `<text x="${xOf(i).toFixed(1)}" y="${(H - 6).toFixed(1)}" class="acf-axis-label" text-anchor="middle">${esc(fmtDate(p.date))}</text>`);

  // Sprint annotation lines
  const sprintLines = sprintAnnots.map(a => {
    // Find nearest point index
    const idx = points.reduce((best, p, i) => {
      return Math.abs(p.date - a.ts) < Math.abs(points[best].date - a.ts) ? i : best;
    }, 0);
    const x = xOf(idx).toFixed(1);
    return `
      <line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + CHART_H}" class="acf-sprint-line"/>
      <text x="${x}" y="${(PAD_T - 3).toFixed(1)}" class="acf-sprint-label" text-anchor="middle">${esc(a.id)}</text>`;
  });

  // Dots at last point
  const lastIdx = points.length - 1;
  const lastPt = points[lastIdx];

  return `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="acf-svg" role="img" aria-label="Flujo acumulativo de ítems">
      <defs>
        <linearGradient id="acf-grad-gap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--acf-color-gap-top, rgba(234,88,12,0.18))"/>
          <stop offset="100%" stop-color="var(--acf-color-gap-bot, rgba(234,88,12,0.04))"/>
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      ${yTicks.map(v => {
        const y = yOf(v).toFixed(1);
        return `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" class="acf-grid-line"/>
                <text x="${(PAD_L - 6).toFixed(1)}" y="${y}" class="acf-axis-label" text-anchor="end" dominant-baseline="middle">${v}</text>`;
      }).join('')}

      <!-- Sprint annotations -->
      ${sprintLines.join('')}

      <!-- Gap fill between lines -->
      <path d="${areaFill}" class="acf-area-gap"/>

      <!-- Line: opened (creados acumulados) -->
      <path d="${pathOpened}" class="acf-line acf-line--opened"/>

      <!-- Line: closed (cerrados acumulados) -->
      <path d="${pathClosed}" class="acf-line acf-line--closed"/>

      <!-- X-axis labels -->
      ${xLabels.join('')}

      <!-- Endpoint dots -->
      <circle cx="${xOf(lastIdx).toFixed(1)}" cy="${yOf(lastPt.opened).toFixed(1)}" r="4" class="acf-dot acf-dot--opened">
        <title>Creados: ${lastPt.opened}</title>
      </circle>
      <circle cx="${xOf(lastIdx).toFixed(1)}" cy="${yOf(lastPt.closed).toFixed(1)}" r="4" class="acf-dot acf-dot--closed">
        <title>Cerrados: ${lastPt.closed}</title>
      </circle>
    </svg>
    <div class="acf-legend">
      <div class="acf-legend-item">
        <span class="acf-legend-dot acf-legend-dot--opened"></span>
        <span class="acf-legend-label">Creados acumulados</span>
        <span class="acf-legend-val">${lastPt.opened}</span>
      </div>
      <div class="acf-legend-item">
        <span class="acf-legend-dot acf-legend-dot--closed"></span>
        <span class="acf-legend-label">Cerrados acumulados</span>
        <span class="acf-legend-val">${lastPt.closed}</span>
      </div>
      <div class="acf-legend-item acf-legend-item--gap">
        <span class="acf-legend-dot acf-legend-dot--gap"></span>
        <span class="acf-legend-label">Backlog neto</span>
        <span class="acf-legend-val">${lastPt.opened - lastPt.closed}</span>
      </div>
    </div>`;
}

function renderAnalytics() {
  const container = document.getElementById('tab-analytics-inner');
  if (!container) return;
  // T-202604-216: skeleton while computing analytics
  const _skelAnalytics = Array(4).fill('<div class="skel-row skel-row--lg"></div>').join('');
  container.innerHTML = _skelAnalytics;
  container.classList.add('is-loading');

  const bounds = _getPeriodBounds();
  const allSess = getAllSessions();
  const allProjects = state.projects || [];

  const currSess = _sessInRange(allSess, bounds.current);
  const prevSess = _sessInRange(allSess, bounds.previous);

  // R-202605-178: guard estado vacío — sin sesiones registradas
  if (!allSess.length) {
    container.classList.remove('is-loading');
    container.innerHTML = `
      <div class="empty-state empty-state--mt">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-title">Las métricas aparecen cuando tengas sesiones registradas</div>
        <div class="empty-state-hint">Pega tu primer CHECKPOINT en el tab Tracker para empezar.</div>
        <button class="empty-state-btn" onclick="if(typeof switchTab==='function')switchTab('tracker')">Ir al Tracker</button>
      </div>`;
    return;
  }

  // ── KPI helpers ──
  function _dominantProject(sessions) {
    const cnt = {};
    sessions.forEach(s => { if (s.projectId) cnt[s.projectId] = (cnt[s.projectId] || 0) + 1; });
    const top = Object.entries(cnt).sort((a,b) => b[1]-a[1])[0];
    if (!top) return null;
    const proj = getProjectById(top[0]);
    return proj ? { proj, count: top[1] } : null;
  }

  function _activeProjectCount(sessions) {
    return new Set(sessions.map(s => s.projectId).filter(Boolean)).size;
  }

  // ── KPI data ──
  const kpiSessions   = { curr: currSess.length, prev: prevSess.length };
  const kpiProjects   = { curr: _activeProjectCount(currSess), prev: _activeProjectCount(prevSess) };
  const kpiClosed     = { curr: _closedItemsInRange(bounds.current), prev: _closedItemsInRange(bounds.previous) };
  const kpiOpened     = { curr: _openedItemsInRange(bounds.current), prev: _openedItemsInRange(bounds.previous) };
  const domProj       = _dominantProject(currSess);

  // ── KPI Archivos modificados ──
  // Fuente: s.files de sesiones en el período (comma-separated, ej: "ai-tracker-backlog.js, ai-tracker-checkpoint.js")
  function _filesKpi(sessions) {
    let mods = 0;
    const unique = new Set();
    sessions.forEach(s => {
      if (!s.files) return;
      const names = s.files.split(',').map(f => f.trim()).filter(Boolean);
      if (names.length) {
        mods++;
        names.forEach(n => unique.add(n));
      }
    });
    return { mods, unique: unique.size };
  }
  const _fCurr = _filesKpi(currSess);
  const _fPrev = _filesKpi(prevSess);
  const kpiFiles = { curr: _fCurr.mods, prev: _fPrev.mods, uniqueCurr: _fCurr.unique, uniquePrev: _fPrev.unique };
  const _kpiFilesExtra = _fCurr.unique > 0
    ? `<div class="akpi-files-unique">${_fCurr.unique} archivo${_fCurr.unique !== 1 ? 's' : ''} distinto${_fCurr.unique !== 1 ? 's' : ''}</div>`
    : '<div class="akpi-files-unique akpi-muted">sin archivos registrados</div>';

  // ── IA KPIs ──
  const activeDays = new Set(currSess.map(s => sessionDateKey(s)).filter(Boolean));
  const aiKpiCheckpoints = currSess.length;
  const aiKpiAvgPerDay   = activeDays.size ? (currSess.length / activeDays.size).toFixed(1) : '0';
  // Día con más checkpoints
  const dayCounts = {};
  currSess.forEach(s => { const k = sessionDateKey(s); if (k) dayCounts[k] = (dayCounts[k]||0)+1; });
  const peakDay = Object.entries(dayCounts).sort((a,b)=>b[1]-a[1])[0];
  const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  let peakDayLabel = '—';
  if (peakDay) {
    const pd = new Date(peakDay[0]);
    peakDayLabel = `${DAYS_ES[pd.getDay()]} ${pd.getDate()} ${MONTHS_ES[pd.getMonth()]} · ${peakDay[1]} checkpoints`;
  }

  // ── Gráfico barras: sesiones por día o semana dentro del período, coloreadas por proyecto ──
  function _buildBarChart() {
    const { intervals, granularity } = _getIntervalsInPeriod();
    if (!intervals.length) return '<div class="analytics-empty">Sin datos en período</div>';

    // Proyectos con sesiones en el período actual
    const projIds = [...new Set(currSess.map(s=>s.projectId).filter(Boolean))];
    const projColors = {};
    projIds.forEach((id, i) => { projColors[id] = getAnalyticsColor(i); });

    // Por intervalo: contar sesiones por proyecto
    const DAY_SHORT = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
    const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    const intervalData = intervals.map(iv => {
      const ivSess = _sessInRange(allSess, iv);
      const byProj = {};
      ivSess.forEach(s => {
        const pid = s.projectId || '__none__';
        byProj[pid] = (byProj[pid]||0) + 1;
      });
      return { iv, byProj, total: ivSess.length };
    });

    const maxTotal = Math.max(...intervalData.map(d=>d.total), 1);
    // T-202604-403: ancho completo del contenedor — W adaptativo, no fijo
    const W = 900, H = 240;
    const PAD = { top: 20, right: 20, bottom: 40, left: 38 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;
    const n = intervals.length;
    const barW = Math.max(4, Math.floor((cW / n) * 0.65));
    const gap = cW / n;

    const yStep = maxTotal <= 4 ? 1 : maxTotal <= 10 ? 2 : 5;
    const yTop = Math.max(Math.ceil(maxTotal / yStep) * yStep, yStep);
    const yOf = v => PAD.top + cH - (v / yTop) * cH;
    const xOf = i => PAD.left + gap * i + gap / 2;

    // Determinar qué índices deben mostrar etiqueta en el eje X
    // Para días: mostrar solo algunos para no saturar
    function _shouldShowLabel(i, total) {
      if (granularity === 'week') return true; // siempre para semanas
      if (total <= 14) return true;             // todos si caben
      if (total <= 31) return i % 3 === 0;     // cada 3 días
      return i % 7 === 0;                       // cada semana
    }

    function _intervalLabel(iv, granularity) {
      if (granularity === 'day') {
        const d = iv.start;
        return `${DAY_SHORT[d.getDay()]} ${d.getDate()}`;
      }
      // semana: mostrar inicio de semana
      const s = iv.start;
      return `${s.getDate()}/${s.getMonth()+1}`;
    }

    function _intervalTooltipLabel(iv, granularity) {
      if (granularity === 'day') {
        const d = iv.start;
        return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
      }
      const s = iv.start, e = iv.end;
      return `Sem ${s.getDate()}/${s.getMonth()+1} – ${e.getDate()}/${e.getMonth()+1}`;
    }

    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="analytics-bar-svg">
      <defs>
        <style>
          @keyframes barRise {
            from { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
            to   { transform: scaleY(1); transform-origin: bottom; opacity: 0.85; }
          }
          .analytics-bar-seg {
            animation: barRise 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
            transform-box: fill-box;
            transform-origin: bottom;
          }
        </style>
      </defs>`;

    // Guías Y — T-202604-403: eje Y legible con labels prominentes
    for (let v = 0; v <= yTop; v += yStep) {
      const yy = yOf(v);
      svg += `<line x1="${PAD.left}" y1="${yy}" x2="${W-PAD.right}" y2="${yy}" stroke="var(--border)" stroke-width="${v===0?'1.5':'1'}" stroke-dasharray="${v===0?'none':'4,5'}" opacity="${v===0?'0.8':'0.5'}"/>`;
      svg += `<text x="${PAD.left-8}" y="${yy+4}" font-size="10" fill="var(--text2)" font-family="JetBrains Mono,monospace" text-anchor="end" font-weight="500">${v}</text>`;
    }

    // Barras apiladas por proyecto
    intervalData.forEach((id, i) => {
      const x = xOf(i) - barW / 2;
      let yBase = yOf(0);
      const allProjIds = Object.keys(id.byProj);
      allProjIds.sort();

      allProjIds.forEach(pid => {
        const cnt = id.byProj[pid] || 0;
        if (!cnt) return;
        const barH = (cnt / yTop) * cH;
        yBase -= barH;
        const color = projColors[pid] || 'var(--hint)';
        const proj = pid !== '__none__' ? getProjectById(pid) : null;
        const ivLabel = _intervalTooltipLabel(id.iv, granularity);
        const tip = `${ivLabel} · ${proj ? proj.name : 'Sin proyecto'}: ${cnt}`;
        const staggerDelay = (i * 28 + 20).toFixed(0);
        svg += `<rect x="${x}" y="${yBase}" width="${barW}" height="${barH}" fill="${color}" rx="2" data-tip="${esc(tip)}" class="analytics-bar-seg" style="--bar-delay:${staggerDelay}ms;animation-delay:var(--bar-delay)"/>`;
      });

      // Etiqueta eje X (selectiva para no saturar)
      if (_shouldShowLabel(i, n)) {
        const lbl = _intervalLabel(id.iv, granularity);
        svg += `<text x="${xOf(i)}" y="${H-PAD.bottom+14}" font-size="10" fill="var(--text2)" font-family="JetBrains Mono,monospace" text-anchor="middle">${lbl}</text>`;
      }

      // Total encima de barra (solo si hay sesiones y barras no son demasiado densas)
      if (id.total > 0 && (granularity === 'week' || n <= 21)) {
        svg += `<text x="${xOf(i)}" y="${yOf(id.total)-4}" font-size="10" fill="var(--text)" font-family="JetBrains Mono,monospace" text-anchor="middle" font-weight="600">${id.total}</text>`;
      }
    });

    svg += `</svg>`;

    // Leyenda de proyectos
    const legendItems = projIds.map(pid => {
      const proj = getProjectById(pid);
      return `<span class="abar-legend-item"><span class="abar-legend-dot" style="--legend-dot-color:${projColors[pid]}"></span>${esc(proj ? proj.name : 'Sin proyecto')}</span>`;
    }).join('');

    return `<div class="abar-wrap">${svg}</div>
      <div class="abar-legend">${legendItems}</div>`;
  }

  // ── R-202605-111: Empty state helpers — KPI cards sin datos en el período ──
  // Distingue: período vacío (sin sesiones) vs período con sesiones pero métrica en 0
  const _periodHasSessions = currSess.length > 0;
  const _emptyPeriodHint = `<div class="akpi-hint akpi-muted">Sin datos en este período</div>`;

  function _kpiEmptyExtra(baseExtra, metric) {
    // Si el período no tiene sesiones, reemplaza cualquier extra con mensaje contextual
    if (!_periodHasSessions) return _emptyPeriodHint;
    // Si el período tiene sesiones pero la métrica es 0, añade indicador junto al extra
    if (metric === 0 && !baseExtra) return `<div class="akpi-hint akpi-muted">Sin registros en el período</div>`;
    return baseExtra;
  }

  // ── T-402: KPIs nuevas — Velocidad de cierre · Eficiencia sesión · Deuda acumulada ──

  // Helper: ítems cerrados en un range usando los mismos helpers existentes
  // Velocidad de cierre = ítems done / días activos en el período
  const _closedCurr = kpiClosed.curr;
  const _closedPrev = kpiClosed.prev;
  const _activeDaysCurr = activeDays.size;
  const _activeDaysPrev = new Set(prevSess.map(s => sessionDateKey(s)).filter(Boolean)).size;
  const kpiCloseVelocity = {
    curr: _activeDaysCurr ? parseFloat((_closedCurr / _activeDaysCurr).toFixed(1)) : 0,
    prev: _activeDaysPrev ? parseFloat((_closedPrev / _activeDaysPrev).toFixed(1)) : 0,
  };

  // Eficiencia de sesión = ítems cerrados / sesiones (cuántos ítems cierra cada sesión)
  const kpiSessionEfficiency = {
    curr: currSess.length ? parseFloat((_closedCurr / currSess.length).toFixed(1)) : 0,
    prev: prevSess.length ? parseFloat((_closedPrev / prevSess.length).toFixed(1)) : 0,
  };

  // Deuda acumulada = ítems pendientes globales (todos los proyectos, no filtrados por período)
  // Más alto = peor (semanticDir = -1)
  function _totalPendingItems() {
    let count = 0;
    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status === 'pendiente') count++;
        });
      } catch {}
    });
    return count;
  }
  const kpiDebt = {
    curr: _totalPendingItems(),
    prev: kpiClosed.curr > 0 ? Math.max(0, _totalPendingItems() + kpiClosed.curr - kpiOpened.curr) : _totalPendingItems(),
  };

  // ── T-401: Sparklines — datos históricos por intervalo ──
  function _sparklineForIntervals(metricFn, intervals) {
    if (!intervals || intervals.length < 2) return [];
    return intervals.map(iv => metricFn(iv));
  }
  const { intervals: _sparkIntervals } = _getIntervalsInPeriod();
  const _sparkSessions   = _sparklineForIntervals(iv => _sessInRange(allSess, iv).length, _sparkIntervals);
  const _sparkClosed     = _sparklineForIntervals(iv => _closedItemsInRange(iv), _sparkIntervals);
  const _sparkOpened     = _sparklineForIntervals(iv => _openedItemsInRange(iv), _sparkIntervals);
  const _sparkEfficiency = _sparkIntervals.map(iv => {
    const s = _sessInRange(allSess, iv).length;
    const c = _closedItemsInRange(iv);
    return s ? parseFloat((c / s).toFixed(1)) : 0;
  });

  // ── T-401: KPI card HTML — color semántico + sparkline ──
  // sparklineData: array de números (valores históricos, más antiguo primero)
  // semanticDir: 1 = más es mejor (sesiones, cerrados), -1 = más es peor (deuda), 0 = neutro
  function _kpiCard(icon, label, curr, prev, extraHtml, unit, sparklineData, semanticDir) {
    const d = _delta(curr, prev);
    const prevLabel = _prevPeriodLabel();
    const unitSpan = unit ? `<span class="akpi-unit">${unit}</span>` : '';

    // Color semántico en el valor según dirección + delta
    let valueColorClass = '';
    if (semanticDir && d.dir !== 0) {
      const positive = d.dir * semanticDir > 0;
      valueColorClass = positive ? ' akpi-value--up' : ' akpi-value--down';
    }

    // Sparkline SVG inline — solo si hay datos
    let sparkHtml = '';
    if (sparklineData && sparklineData.length >= 2) {
      const W = 60, H = 22, PAD = 2;
      const vals = sparklineData;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = max - min || 1;
      const n = vals.length;
      const pts = vals.map((v, i) => {
        const x = PAD + (i / (n - 1)) * (W - PAD * 2);
        const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      // Color de línea basado en tendencia
      const trend = vals[vals.length - 1] - vals[0];
      const lineDir = trend > 0 ? 1 : trend < 0 ? -1 : 0;
      const lineColor = semanticDir && lineDir !== 0
        ? (lineDir * semanticDir > 0 ? 'var(--green,#2ecc78)' : 'var(--red,#e85555)')
        : 'var(--hint)';
      sparkHtml = `<svg class="akpi-sparkline" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <polyline points="${pts}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
        <circle cx="${pts.split(' ').pop().split(',')[0]}" cy="${pts.split(' ').pop().split(',')[1]}" r="2" fill="${lineColor}"/>
      </svg>`;
    }

    return `<div class="akpi-card${extraHtml && extraHtml.includes('akpi-muted') && !extraHtml.includes('akpi-files') ? ' akpi-card--no-data' : ''}">
      <div class="akpi-icon">${icon}</div>
      <div class="akpi-body">
        <div class="akpi-label">${label}</div>
        <div class="akpi-value-row">
          <div class="akpi-value${valueColorClass}">${curr}${unitSpan}</div>
          ${sparkHtml}
        </div>
        <div class="akpi-meta">${d.html} <span class="akpi-prev">vs ${prevLabel}: ${prev}</span></div>
        ${extraHtml || ''}
      </div>
    </div>`;
  }

  // ── Proyecto dominante ──
  const domHtml = domProj
    ? `<div class="akpi-dom-proj" style="--dom-proj-color:${domProj.proj.color||'var(--accent)'}">
        <span class="akpi-dom-icon">${domProj.proj.icon||'📁'}</span>
        <span class="akpi-dom-name">${esc(domProj.proj.name)}</span>
        <span class="akpi-dom-count">${domProj.count} sesión${domProj.count!==1?'es':''}</span>
      </div>`
    : '<span class="akpi-muted">Sin sesiones</span>';

  // ── R-202604-070: Comparación side-by-side — dos proyectos independientes ──
  let compColHtml = '';
  const _projects = state.projects || [];
  const _hasComparison = _compareProjectIdA || _compareProjectIdB;

  if (_hasComparison) {
    function _projMetricsSbs(sessions, prevSessions) {
      const files = sessions.reduce((acc, s) => {
        if (!s.files) return acc;
        s.files.split(',').map(f => f.trim()).filter(Boolean).forEach(f => acc.add(f));
        return acc;
      }, new Set());
      const prevFiles = prevSessions.reduce((acc, s) => {
        if (!s.files) return acc;
        s.files.split(',').map(f => f.trim()).filter(Boolean).forEach(f => acc.add(f));
        return acc;
      }, new Set());
      const days = new Set(sessions.map(s => sessionDateKey(s)).filter(Boolean));
      const prevDays = new Set(prevSessions.map(s => sessionDateKey(s)).filter(Boolean));
      return {
        sessions: sessions.length,
        prevSessions: prevSessions.length,
        files: files.size,
        prevFiles: prevFiles.size,
        days: days.size,
        prevDays: prevDays.size,
        avgPerDay: days.size ? (sessions.length / days.size).toFixed(1) : '0',
        prevAvgPerDay: prevDays.size ? (prevSessions.length / prevDays.size).toFixed(1) : '0',
      };
    }

    function _sessForProj(projId, sessions) {
      if (!projId) return sessions;
      return sessions.filter(s => s.projectId === projId);
    }

    const projA = _compareProjectIdA ? getProjectById(_compareProjectIdA) : null;
    const projB = _compareProjectIdB ? getProjectById(_compareProjectIdB) : null;
    const sessA     = _sessForProj(_compareProjectIdA, currSess);
    const prevSessA = _sessForProj(_compareProjectIdA, prevSess);
    const sessB     = _sessForProj(_compareProjectIdB, currSess);
    const prevSessB = _sessForProj(_compareProjectIdB, prevSess);
    const mA = _projMetricsSbs(sessA, prevSessA);
    const mB = _projMetricsSbs(sessB, prevSessB);

    const labelA = projA ? `${projA.icon || '📁'} ${projA.name}` : '📊 Todos';
    const labelB = projB ? `${projB.icon || '📁'} ${projB.name}` : '📊 Todos';
    const colorA = projA?.color || 'var(--text2)';
    const colorB = projB?.color || 'var(--accent)';

    function _cmpRow(icon, label, valA, valB, prevA, prevB) {
      const dA = _delta(valA, prevA);
      const dB = _delta(valB, prevB);
      const aWins = valA > valB, bWins = valB > valA;
      return `<div class="acmp-metric-row">
        <div class="acmp-metric-label">${icon} ${label}</div>
        <div class="acmp-metric-vals">
          <div class="acmp-val acmp-val-a${aWins ? ' acmp-val--winner' : ''}">
            <span class="acmp-val-num">${valA}</span>
            <span class="acmp-val-delta">${dA.html}</span>
          </div>
          <div class="acmp-divider"></div>
          <div class="acmp-val acmp-val-b${bWins ? ' acmp-val--winner' : ''}">
            <span class="acmp-val-num">${valB}</span>
            <span class="acmp-val-delta">${dB.html}</span>
          </div>
        </div>
      </div>`;
    }

    compColHtml = `
      <div class="analytics-section acmp-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">⚖️ Comparación de proyectos</div>
          <div class="analytics-section-sub">${periodLabel}</div>
        </div>
        <div class="acmp-wrap">
          <div class="acmp-headers">
            <div class="acmp-header acmp-header-a" style="--comp-col-color:${colorA}">
              <span class="acmp-header-dot" style="--acmp-dot-color:${colorA}"></span>
              <span class="acmp-header-name">${esc(labelA)}</span>
            </div>
            <div class="acmp-header acmp-header-b" style="--comp-col-color:${colorB}">
              <span class="acmp-header-dot" style="--acmp-dot-color:${colorB}"></span>
              <span class="acmp-header-name">${esc(labelB)}</span>
            </div>
          </div>
          <div class="acmp-metrics">
            ${_cmpRow('📋', 'Sesiones', mA.sessions, mB.sessions, mA.prevSessions, mB.prevSessions)}
            ${_cmpRow('🗂', 'Archivos distintos', mA.files, mB.files, mA.prevFiles, mB.prevFiles)}
            ${_cmpRow('📅', 'Días activos', mA.days, mB.days, mA.prevDays, mB.prevDays)}
            ${_cmpRow('📈', 'Promedio / día', parseFloat(mA.avgPerDay), parseFloat(mB.avgPerDay), parseFloat(mA.prevAvgPerDay), parseFloat(mB.prevAvgPerDay))}
          </div>
          <div class="acmp-footer">
            <button class="acmp-clear-btn" onclick="clearComparison()">✕ Limpiar comparación</button>
          </div>
        </div>
      </div>`;
  }

  // ── R-070: Selectores side-by-side en control bar ──
  function _buildCompareSelector(slot, currentId) {
    const opts = _projects
      .filter(p => p.id && p.name)
      .map(p => `<option value="${esc(p.id)}"${p.id === currentId ? ' selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`)
      .join('');
    return `<select class="period-btn compare-proj-select compare-proj-select--${slot}" onchange="setCompareProject${slot.toUpperCase()}(this.value || null)" title="Proyecto ${slot.toUpperCase()}">
      <option value="">＋ Proyecto ${slot.toUpperCase()}</option>
      ${opts}
    </select>`;
  }
  const compareSelectHtml = _projects.length >= 2
    ? `<div class="acmp-selectors">
        ${_buildCompareSelector('a', _compareProjectIdA)}
        <span class="acmp-vs-label">vs</span>
        ${_buildCompareSelector('b', _compareProjectIdB)}
       </div>`
    : '';

  // ── T-202605-453: Tiempo promedio pendiente → done ──
  // Recolecta todos los ítems done con createdAt + closedAt de todos los proyectos
  function _cycleTimeData() {
    const byType   = { R: [], T: [], B: [] };
    const byEffort = { 1: [], 2: [], 3: [] };
    const outlierCandidates = [];

    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          const created = item.createdAt || item.StatusChangedAt;
          const closed  = item.closedAt || item.updatedAt;
          if (!created || !closed) return;
          const days = Math.max(0, Math.round((closed - created) / 86400000));
          const t = (item.code || '')[0];
          const e = parseInt(item.effort) || 1;
          const entry = {
            days,
            code:    item.code  || '—',
            title:   item.title || item.desc || '—',
            type:    t,
            effort:  e,
            projId:  p.id,
          };
          if (byType[t])           byType[t].push(entry);
          if (byEffort[e])         byEffort[e].push(entry);
          outlierCandidates.push(entry);
        });
      } catch {}
    });

    function avg(arr) {
      if (!arr.length) return null;
      return Math.round(arr.reduce((s, i) => s + i.days, 0) / arr.length);
    }

    // Promedio global para detectar outliers (>2× promedio global)
    const globalAvg = avg(outlierCandidates) || 0;
    const outliers  = outlierCandidates
      .filter(i => i.days > globalAvg * 2 && globalAvg > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 6);

    // Tendencia sprint a sprint: comparar últimos 2 sprints cerrados con ítems done
    // Agrupa done items por sprint field → ordena por sprint id → toma los 2 últimos
    const bySprint = {};
    outlierCandidates.forEach(e => {
      // Recuperar sprint del item desde localStorage (ya tenemos el entry, buscar sprint)
      // Como ya parseamos, simplemente asociamos por sprint field obtenido antes
    });

    // Recolecta tendencia: sprints con avg cycle time
    const sprintAvgs = [];
    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        const sprintMap = {};
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          const created = item.createdAt || item.StatusChangedAt;
          const closed  = item.closedAt  || item.updatedAt;
          if (!created || !closed || !item.sprint) return;
          const days = Math.max(0, Math.round((closed - created) / 86400000));
          if (!sprintMap[item.sprint]) sprintMap[item.sprint] = [];
          sprintMap[item.sprint].push(days);
        });
        Object.entries(sprintMap).forEach(([sp, vals]) => {
          const existing = sprintAvgs.find(x => x.sprint === sp);
          if (existing) {
            existing.vals.push(...vals);
          } else {
            sprintAvgs.push({ sprint: sp, vals });
          }
        });
      } catch {}
    });

    // Ordena sprints por nombre (S-01, S-02…) y toma los últimos 5 para tendencia
    const sprintTrend = sprintAvgs
      .sort((a, b) => a.sprint.localeCompare(b.sprint, undefined, { numeric: true }))
      .slice(-5)
      .map(x => ({ sprint: x.sprint, avg: Math.round(x.vals.reduce((s, v) => s + v, 0) / x.vals.length) }));

    // Tendencia: comparar último sprint con el anterior
    let trendDir = 0; // 0=sin datos, 1=mejorando, -1=empeorando
    if (sprintTrend.length >= 2) {
      const last = sprintTrend[sprintTrend.length - 1].avg;
      const prev = sprintTrend[sprintTrend.length - 2].avg;
      if (last < prev) trendDir = 1;
      else if (last > prev) trendDir = -1;
    }

    return {
      byType:  { R: avg(byType.R), T: avg(byType.T), B: avg(byType.B) },
      byEffort:{ 1: avg(byEffort[1]), 2: avg(byEffort[2]), 3: avg(byEffort[3]) },
      globalAvg,
      outliers,
      sprintTrend,
      trendDir,
      totalDone: outlierCandidates.length,
    };
  }
  const _ctData = _cycleTimeData();

  function _ctDaysLabel(n) {
    if (n === null) return '<span class="ct-nodata">—</span>';
    return `<span class="ct-days">${n}</span><span class="ct-days-unit"> d</span>`;
  }

  function _ctTrendHtml(dir) {
    if (dir === 0) return '';
    if (dir === 1) return '<span class="ct-trend ct-trend--up">▼ mejorando</span>';
    return '<span class="ct-trend ct-trend--down">▲ empeorando</span>';
  }

  // Mini sparkline para trend sprint a sprint
  function _ctSparkHtml(sprintTrend) {
    if (sprintTrend.length < 2) return '';
    const W = 80, H = 28, PAD = 3;
    const vals = sprintTrend.map(x => x.avg);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const n = vals.length;
    const pts = vals.map((v, i) => {
      const x = PAD + (i / (n - 1)) * (W - PAD * 2);
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const trend = vals[vals.length - 1] - vals[0];
    // Para cycle time: bajar es bueno (semanticDir -1)
    const lineColor = trend < 0 ? 'var(--green,#2ecc78)' : trend > 0 ? 'var(--red,#e85555)' : 'var(--hint)';
    const lastPt = pts.split(' ').pop();
    return `<svg class="ct-sparkline" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <polyline points="${pts}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
      <circle cx="${lastPt.split(',')[0]}" cy="${lastPt.split(',')[1]}" r="2.2" fill="${lineColor}"/>
    </svg>`;
  }

  // HTML de outliers
  function _ctOutliersHtml(outliers, globalAvg) {
    if (!outliers.length) return '<div class="ct-no-outliers">Sin outliers detectados</div>';
    return outliers.map(o => {
      const typeClass = o.type === 'R' ? 'ct-pill-r' : o.type === 'T' ? 'ct-pill-t' : 'ct-pill-b';
      return `<button class="ct-outlier-row" onclick="navigateToItem(${JSON.stringify(o.code)})" title="Ir al ítem">
        <span class="ct-outlier-code ct-pill ${typeClass}">${esc(o.code)}</span>
        <span class="ct-outlier-title">${esc(o.title.length > 42 ? o.title.slice(0, 42) + '…' : o.title)}</span>
        <span class="ct-outlier-days">${o.days}d</span>
        <span class="ct-outlier-mult">${globalAvg > 0 ? (o.days / globalAvg).toFixed(1) + '×' : ''}</span>
      </button>`;
    }).join('');
  }

  const _ctHtml = `
    <div class="ct-section analytics-section">
      <div class="analytics-section-header">
        <div class="analytics-section-title">⏱ Tiempo pendiente → done</div>
        <div class="analytics-section-sub">Promedio global · ${_ctData.totalDone} ítem${_ctData.totalDone !== 1 ? 's' : ''} cerrado${_ctData.totalDone !== 1 ? 's' : ''}</div>
      </div>

      <!-- Global + tendencia -->
      <div class="ct-global-row">
        <div class="ct-global-card">
          <div class="ct-global-val">${_ctData.globalAvg > 0 ? _ctData.globalAvg : '—'}<span class="ct-global-unit">${_ctData.globalAvg > 0 ? ' d' : ''}</span></div>
          <div class="ct-global-label">promedio global</div>
        </div>
        <div class="ct-trend-block">
          ${_ctSparkHtml(_ctData.sprintTrend)}
          ${_ctTrendHtml(_ctData.trendDir)}
          ${_ctData.sprintTrend.length >= 2 ? `<div class="ct-trend-label">${_ctData.sprintTrend.map(x => `<span title="${esc(x.sprint)}">${x.avg}d</span>`).join('<span class="ct-trend-sep">→</span>')}</div>` : '<div class="ct-trend-label ct-nodata">Sin datos de sprint</div>'}
        </div>
      </div>

      <!-- Por tipo -->
      <div class="ct-grid">
        <div class="ct-block">
          <div class="ct-block-header">Por tipo</div>
          <div class="ct-type-rows">
            <div class="ct-type-row">
              <span class="ct-pill ct-pill-r">R</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byType.R !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byType.R / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--blue,#38bdf8)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byType.R)}</span>
            </div>
            <div class="ct-type-row">
              <span class="ct-pill ct-pill-t">T</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byType.T !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byType.T / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--green,#2ecc78)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byType.T)}</span>
            </div>
            <div class="ct-type-row">
              <span class="ct-pill ct-pill-b">B</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byType.B !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byType.B / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--red,#e85555)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byType.B)}</span>
            </div>
          </div>
        </div>

        <div class="ct-block">
          <div class="ct-block-header">Por effort</div>
          <div class="ct-type-rows">
            <div class="ct-type-row">
              <span class="ct-effort-badge">E1</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byEffort[1] !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byEffort[1] / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--accent)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byEffort[1])}</span>
            </div>
            <div class="ct-type-row">
              <span class="ct-effort-badge ct-effort-badge--2">E2</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byEffort[2] !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byEffort[2] / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--accent)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byEffort[2])}</span>
            </div>
            <div class="ct-type-row">
              <span class="ct-effort-badge ct-effort-badge--3">E3</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byEffort[3] !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byEffort[3] / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--accent)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byEffort[3])}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Outliers -->
      <div class="ct-outliers-wrap">
        <div class="ct-outliers-header">
          <span class="ct-outliers-title">Outliers — más del doble del promedio</span>
          ${_ctData.globalAvg > 0 ? `<span class="ct-outliers-baseline">baseline ${_ctData.globalAvg}d</span>` : ''}
        </div>
        <div class="ct-outliers-list">
          ${_ctOutliersHtml(_ctData.outliers, _ctData.globalAvg)}
        </div>
      </div>
    </div>`;

  // ── R-202605-128: Forecast — sprints estimados para vaciar el backlog ──
  function _buildForecastData() {
    // Recolectar sprints cerrados con effort_done calculado desde ítems
    const closedSprintEffort = {};

    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          if (!item.sprint) return;
          const type = (item.code || item.type || '')[0];
          if (type === 'P') return; // excluir tipo P
          const e = parseInt(item.effort) || 0;
          if (!e) return; // excluir sin effort
          if (!closedSprintEffort[item.sprint]) closedSprintEffort[item.sprint] = 0;
          closedSprintEffort[item.sprint] += e;
        });
      } catch {}
    });

    // Obtener IDs de sprints cerrados desde state
    const closedSprintIds = new Set(
      (state.projects || [])
        .flatMap(p => (p.sprints || []))
        .filter(s => s.status === 'closed')
        .map(s => s.id)
    );

    // Solo sprints cerrados con effort > 0
    const closedWithData = Object.entries(closedSprintEffort)
      .filter(([id, eff]) => closedSprintIds.has(id) && eff > 0)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

    if (closedWithData.length < 2) {
      return { insufficient: true, closedCount: closedWithData.length };
    }

    // Últimos 3 sprints cerrados con datos
    const last3 = closedWithData.slice(-3);
    const avgVelocity = Math.round(
      last3.reduce((sum, [, e]) => sum + e, 0) / last3.length
    );

    // Backlog pendiente: T + R + B con effort, sin sprint cerrado, sin descartado
    let pendingEffort = 0;
    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status === 'done' || item.status === 'descartado') return;
          const type = (item.code || item.type || '')[0];
          if (type === 'P') return;
          const e = parseInt(item.effort) || 0;
          if (!e) return;
          pendingEffort += e;
        });
      } catch {}
    });

    if (avgVelocity <= 0) return { insufficient: true, closedCount: closedWithData.length };

    const sprintsNeeded = Math.ceil(pendingEffort / avgVelocity);

    return {
      insufficient: false,
      avgVelocity,
      pendingEffort,
      sprintsNeeded,
      sprintsUsed: last3.map(([id]) => id),
      closedCount: closedWithData.length,
    };
  }

  const _fcData = _buildForecastData();

  const _forecastHtml = (() => {
    if (_fcData.insufficient) {
      const msg = _fcData.closedCount < 2
        ? `Datos insuficientes para forecast — se necesitan al menos 2 sprints cerrados con effort registrado (actualmente ${_fcData.closedCount || 0})`
        : 'Datos insuficientes para calcular forecast';
      return `
    <div class="fcst-section analytics-section">
      <div class="analytics-section-header">
        <div class="analytics-section-title">🔭 Forecast de backlog</div>
        <div class="analytics-section-sub">Sprints estimados al ritmo actual</div>
      </div>
      <div class="fcst-insufficient">${msg}</div>
    </div>`;
    }

    const sprintLabel = _fcData.sprintsNeeded === 1 ? 'sprint' : 'sprints';
    const effortLabel = `${_fcData.pendingEffort} effort pendiente`;
    const velocityLabel = `ritmo: ${_fcData.avgVelocity} effort / sprint`;
    const sprintsRef = _fcData.sprintsUsed.join(', ');

    return `
    <div class="fcst-section analytics-section">
      <div class="analytics-section-header">
        <div class="analytics-section-title">🔭 Forecast de backlog</div>
        <div class="analytics-section-sub">Basado en ${_fcData.sprintsUsed.length} sprint${_fcData.sprintsUsed.length !== 1 ? 's' : ''} cerrado${_fcData.sprintsUsed.length !== 1 ? 's' : ''} · ${sprintsRef}</div>
      </div>
      <div class="fcst-main-row">
        <div class="fcst-number-block">
          <span class="fcst-number">${_fcData.sprintsNeeded}</span>
          <span class="fcst-number-unit">${sprintLabel}</span>
        </div>
        <div class="fcst-detail-block">
          <div class="fcst-detail-line">
            <span class="fcst-detail-label">Backlog pendiente</span>
            <span class="fcst-detail-val">${effortLabel}</span>
          </div>
          <div class="fcst-detail-line">
            <span class="fcst-detail-label">Velocidad promedio</span>
            <span class="fcst-detail-val">${velocityLabel}</span>
          </div>
          <div class="fcst-hint">A tu ritmo actual, el backlog se vaciaría en ~${_fcData.sprintsNeeded} ${sprintLabel}</div>
        </div>
      </div>
    </div>`;
  })();

  // ── Render principal ──
  const periodLabel = _periodLabel();
  const prevLabel   = _prevPeriodLabel();

  container.innerHTML = `
    <div class="analytics-v2-wrap">

      <!-- T-202604-399/400: Barra de control Analytics — pill group + zona acciones -->
      <div class="analytics-control-bar">
        <div class="analytics-period-pills">
          <button class="period-btn${_analyticsPeriod==='week'?' active':''}" data-period="week" onclick="setAnalyticsPeriod('week')">Últ. 7 días</button>
          <button class="period-btn${_analyticsPeriod==='month'?' active':''}" data-period="month" onclick="setAnalyticsPeriod('month')">Este mes</button>
          <button class="period-btn${_analyticsPeriod==='quarter'?' active':''}" data-period="quarter" onclick="setAnalyticsPeriod('quarter')">Este trimestre</button>
          <span class="analytics-period-label">${periodLabel}</span>
        </div>
        <div class="analytics-actions-group">
          ${compareSelectHtml}
          <button class="analytics-action-btn" onclick="exportWeeklySummary()" title="Exportar resumen de los últimos 7 días">⬇ Resumen semanal</button>
        </div>
      </div>

      <!-- KPIs principales — T-401: color semántico + sparkline -->
      <div class="akpi-row">
        ${_kpiCard('📋', 'Sesiones', kpiSessions.curr, kpiSessions.prev, _kpiEmptyExtra(null, kpiSessions.curr), null, _sparkSessions, 1)}
        ${_kpiCard('📁', 'Proyectos activos', kpiProjects.curr, kpiProjects.prev, _kpiEmptyExtra(null, kpiProjects.curr), null, null, 1)}
        ${_kpiCard('✅', 'Ítems cerrados', kpiClosed.curr, kpiClosed.prev, _kpiEmptyExtra(null, kpiClosed.curr), null, _sparkClosed, 1)}
        ${_kpiCard('➕', 'Ítems abiertos', kpiOpened.curr, kpiOpened.prev, _kpiEmptyExtra(null, kpiOpened.curr), null, _sparkOpened, 0)}
        ${_kpiCard('🗂', 'Archivos modificados', kpiFiles.curr, kpiFiles.prev, _kpiEmptyExtra(_kpiFilesExtra, kpiFiles.curr), null, null, 1)}
      </div>

      <!-- T-402: KPIs nuevas — Velocidad · Eficiencia · Deuda -->
      <div class="akpi-row akpi-row-new">
        ${_kpiCard('⚡', 'Velocidad de cierre', kpiCloseVelocity.curr, kpiCloseVelocity.prev, _kpiEmptyExtra(`<div class="akpi-hint">ítems / día activo</div>`, kpiCloseVelocity.curr), null, null, 1)}
        ${_kpiCard('🎯', 'Eficiencia de sesión', kpiSessionEfficiency.curr, kpiSessionEfficiency.prev, _kpiEmptyExtra(`<div class="akpi-hint">ítems / sesión</div>`, kpiSessionEfficiency.curr), null, _sparkEfficiency, 1)}
        ${_kpiCard('📦', 'Deuda acumulada', kpiDebt.curr, kpiDebt.prev, `<div class="akpi-hint">ítems pendientes totales</div>`, null, null, -1)}
      </div>

      <!-- T-202605-453: Tiempo promedio pendiente → done -->
      ${_ctHtml}

      <!-- R-202605-128: Forecast de backlog -->
      ${_forecastHtml}

      <!-- Proyecto dominante -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">🏆 Foco del período</div>
          <div class="analytics-section-sub">Proyecto con más sesiones · ${periodLabel}</div>
        </div>
        ${domHtml}
      </div>

      <!-- R-202604-070: Comparación side-by-side -->
      ${compColHtml}

      <!-- Gráfico de barras por día o semana según período -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">📊 Sesiones por ${_analyticsPeriod === 'quarter' ? 'semana' : 'día'}</div>
          <div class="analytics-section-sub">Por proyecto · ${periodLabel}</div>
        </div>
        <div id="analytics-chart-wrap" class="analytics-chart-wrap">
          ${_buildBarChart()}
        </div>
      </div>

      <!-- T-202605-452: Flujo acumulativo — ítems entrando vs saliendo -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">📈 Flujo acumulativo</div>
          <div class="analytics-section-sub">Ítems creados vs cerrados · todos los períodos</div>
        </div>
        <div class="acf-toolbar">
          <select class="acf-select" onchange="setCfProject(this.value)" aria-label="Filtrar por proyecto">
            <option value="">Todos los proyectos</option>
            ${(state.projects || []).map(p => `<option value="${esc(p.id)}" ${_cfProjId === p.id ? 'selected' : ''}>${esc(p.name || p.id)}</option>`).join('')}
          </select>
          <select class="acf-select" onchange="setCfType(this.value)" aria-label="Filtrar por tipo">
            <option value="">Todos los tipos</option>
            <option value="R" ${_cfTypeFilter === 'R' ? 'selected' : ''}>R — Requerimientos</option>
            <option value="T" ${_cfTypeFilter === 'T' ? 'selected' : ''}>T — Tickets</option>
            <option value="B" ${_cfTypeFilter === 'B' ? 'selected' : ''}>B — Bugs</option>
            <option value="P" ${_cfTypeFilter === 'P' ? 'selected' : ''}>P — Ideas</option>
          </select>
        </div>
        <div class="acf-chart-wrap">
          ${_buildCumulativeFlowChart()}
        </div>
      </div>

      <!-- KPIs de IAs -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">🤖 Checkpoints</div>
          <div class="analytics-section-sub">Registros de sesión · ${periodLabel}</div>
        </div>
        ${!_periodHasSessions
          ? `<div class="analytics-empty">Sin checkpoints en este período</div>`
          : `<div class="akpi-row akpi-row-sm">
          <div class="akpi-card akpi-card-sm">
            <div class="akpi-icon">📌</div>
            <div class="akpi-body">
              <div class="akpi-label">Total checkpoints</div>
              <div class="akpi-value">${aiKpiCheckpoints}</div>
            </div>
          </div>
          <div class="akpi-card akpi-card-sm">
            <div class="akpi-icon">📈</div>
            <div class="akpi-body">
              <div class="akpi-label">Promedio por día activo</div>
              <div class="akpi-value">${aiKpiAvgPerDay}</div>
            </div>
          </div>
          <div class="akpi-card akpi-card-sm">
            <div class="akpi-icon">🔥</div>
            <div class="akpi-body">
              <div class="akpi-label">Día pico</div>
              <div class="akpi-value akpi-value-sm">${peakDayLabel}</div>
            </div>
          </div>
        </div>`}
      </div>

      <!-- Heatmap -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">🗓 Actividad diaria</div>
          <div class="analytics-section-sub">Últimas 12 semanas · sesiones por día</div>
        </div>
        <div id="analytics-heatmap"></div>
      </div>

      <!-- Histograma por hora -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">⏰ Distribución por hora</div>
          <div class="analytics-section-sub">Hora del día más frecuente de trabajo</div>
        </div>
        <div id="analytics-hourly"></div>
      </div>

      <!-- B-QA-069-05: analytics-two-col — 2 columnas en ≥1100px -->
      <div class="analytics-two-col">

      <!-- T-202604-275: Patrones de productividad -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">🧠 Patrones de productividad</div>
          <div class="analytics-section-sub">Día y hora pico por proyecto · mín. ${_PROD_MIN_SESSIONS} sesiones</div>
        </div>
        <div id="analytics-productivity"></div>
      </div>

      <!-- T-202604-274: Checkpoints por proyecto -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">📌 Checkpoints por proyecto</div>
          <div class="analytics-section-sub">Semana · mes · total acumulado</div>
        </div>
        <div id="analytics-ckpt-by-proj"></div>
      </div>

      </div><!-- /analytics-two-col -->

    </div>`;
  container.classList.remove('is-loading');
  // T-407: trigger animación de entrada en secciones
  requestAnimationFrame(() => {
    container.querySelectorAll('.analytics-section, .akpi-row, .akpi-row-new, .analytics-control-bar').forEach((el, i) => {
      el.style.setProperty('--section-delay', `${i * 40}ms`);
      el.classList.add('analytics-section--animate');
    });
  });

  // Tooltip sobre barras del gráfico
  const chartWrap = document.getElementById('analytics-chart-wrap');
  if (chartWrap) {
    chartWrap.addEventListener('mousemove', function(e) {
      const seg = e.target.closest('.analytics-bar-seg');
      if (!seg) { hideAnalyticsTooltip(); return; }
      const tip = seg.dataset.tip;
      if (tip) {
        // Parse "Lu 14 Abr · Proyecto: 3" → premium layout
        const parts = tip.split(' · ');
        const dateLabel = parts[0] || '';
        const rest = parts.slice(1).join(' · ');
        const match = rest.match(/^(.+):\s*(\d+)$/);
        const tip2 = getTooltip();
        if (match) {
          const count = parseInt(match[2], 10);
          const color = seg.getAttribute('fill') || 'var(--accent)';
          tip2.innerHTML = `
            <div class="atip-header">
              <span class="atip-date">${dateLabel}</span>
              <span class="atip-total">${count}</span>
            </div>
            <div class="atip-rows">
              <div class="atip-row">
                <span class="atip-dot" style="--atip-color:${color}"></span>
                <span class="atip-name">${esc(match[1])}</span>
                <span class="atip-count">${count}</span>
                <div class="atip-bar-track"><div class="atip-bar-fill" style="--atip-color:${color}"></div></div>
              </div>
            </div>`;
        } else {
          tip2.innerHTML = `<div class="atip-header"><span class="atip-date">${esc(tip)}</span></div>`;
        }
        tip2.classList.add('visible');
        _posTooltip(e);
      }
    });
    chartWrap.addEventListener('mouseleave', hideAnalyticsTooltip);
  }

  renderHeatmap();
  renderHourly();
  renderProductivityPatterns();
  renderCheckpointsByProject();
}

// T-088: Helper — retorna AIs respetando filtro activo de proyecto (legacy)
function _getAnalyticsAIs() {
  const filterId = _getActiveProjectFilter();
  if (!filterId) return state.ais;
  const proj = getProjectById(filterId);
  if (!proj) return state.ais;
  const aiIdsInProj = new Set((proj.sessions || []).map(s => s.aiId).filter(Boolean));
  return state.ais.filter(ai => aiIdsInProj.has(ai.id));
}

// renderRanking y renderStreak eliminados — reemplazados por KPI cards en renderAnalytics v2

// ── T-042: Heatmap de actividad por día de la semana ──
const HEATMAP_WEEKS = 12; // últimas N semanas — configurable

function renderHeatmap() {
  const el = document.getElementById('analytics-heatmap');
  if (!el) return;

  // Construir mapa fecha → count (T-088: respeta filtro proyecto)
  const dayCount = {};
  let _excludedCount = 0;
  getAllSessions().forEach(s => {
    const k = sessionDateKey(s);
    if (k) dayCount[k] = (dayCount[k] || 0) + 1;
    else _excludedCount++;
  });

  if (!Object.keys(dayCount).length) {
    el.innerHTML = '<div class="analytics-empty">Sin sesiones registradas</div>';
    return;
  }

  // Construir grid: semanas × 7 días (L=0 … D=6)
  const today = new Date();
  // Ajustar al domingo más reciente como fin de semana
  const endDate = new Date(today);
  // Ir hasta el sábado de esta semana (día 6)
  const dayOfWeek = today.getDay(); // 0=Dom … 6=Sab
  endDate.setDate(today.getDate() + (6 - dayOfWeek));

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (HEATMAP_WEEKS * 7 - 1));

  // Generar todas las celdas
  const weeks = [];
  let week = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dow = d.getDay(); // 0=Dom
    week.push({ k, count: dayCount[k] || 0, dow });
    if (dow === 6) { weeks.push(week); week = []; }
    d.setDate(d.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  const maxCount = Math.max(...Object.values(dayCount), 1);

  function levelClass(count) {
    if (!count) return 'empty';
    const r = count / maxCount;
    if (r < 0.25) return 'l1';
    if (r < 0.5)  return 'l2';
    if (r < 0.75) return 'l3';
    return 'l4';
  }

  const DAY_LABELS = ['D','L','M','X','J','V','S'];
  const SHOW_LABELS = [0, 2, 4]; // Dom, Mar, Jue para no saturar

  // Etiquetas de semana (mes abreviado en primera semana del mes)
  const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  let weeksHtml = '';
  let prevMonth = -1;
  weeks.forEach(wk => {
    const firstDay = wk.find(c => c.k);
    const dt = firstDay ? new Date(firstDay.k) : null;
    const mo = dt ? dt.getMonth() : -1;
    const weekLabel = (dt && mo !== prevMonth) ? MONTH_SHORT[mo] : '';
    if (mo !== prevMonth && mo !== -1) prevMonth = mo;

    // Rellenar si la semana no tiene 7 días (primera/última parcial)
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const cell = wk.find(c => c.dow === i);
      if (cell) {
        const lvl = levelClass(cell.count);
        const weekIdx = weeks.indexOf(wk);
        cells.push(`<div class="heatmap-cell ${lvl}" data-level="${lvl}" data-week="${weekIdx}" title="${cell.k}${cell.count ? ' · ' + cell.count + ' sesión' + (cell.count > 1 ? 'es' : '') : ''}"></div>`);
      } else {
        cells.push(`<div class="heatmap-cell heatmap-cell--hidden"></div>`);
      }
    }

    weeksHtml += `<div class="heatmap-week-col">
      <div class="heatmap-week-header">${weekLabel}</div>
      ${cells.join('')}
    </div>`;
  });

  // Columna de etiquetas días
  const labelsHtml = DAY_LABELS.map((l, i) =>
    `<div class="heatmap-day-label">${SHOW_LABELS.includes(i) ? l : ''}</div>`
  ).join('');

  // Leyenda de niveles
  const legendCells = ['empty','l1','l2','l3','l4'].map(cls =>
    `<div class="heatmap-cell ${cls} heatmap-cell--legend"></div>`
  ).join('');

  el.innerHTML = `
    <div class="heatmap-wrap">
      <div class="heatmap-grid">
        <div class="heatmap-labels-col">${labelsHtml}</div>
        <div class="heatmap-weeks">${weeksHtml}</div>
      </div>
      <!-- T-202604-404: Leyenda inline debajo del grid -->
      <div class="heatmap-legend heatmap-legend--inline">
        <span class="heatmap-legend-label">Menos</span>
        <div class="heatmap-legend-cells">${legendCells}</div>
        <span class="heatmap-legend-label">Más</span>
      </div>
    </div>
    ${_excludedCount > 0 ? `<div class="heatmap-excluded-notice" title="Sesiones sin fecha registrada — no se pueden ubicar en el heatmap">⚠ ${_excludedCount} sesión${_excludedCount > 1 ? 'es' : ''} sin fecha excluida${_excludedCount > 1 ? 's' : ''}</div>` : ''}`;

  // AC2: Stagger reveal por columna (week index)
  requestAnimationFrame(() => {
    el.querySelectorAll('.heatmap-cell[data-week]').forEach(cell => {
      const wIdx = parseInt(cell.dataset.week, 10) || 0;
      cell.style.setProperty('--hm-delay', `${wIdx * 18}ms`);
    });
  });
}

// ── T-045: Distribución de sesiones por hora del día ──
// ── T-202605-454: Insight de horas productivas — dos métricas separadas ──
// Métrica A: hora con más sesiones iniciadas (resetAt)
// Métrica B: hora con más ítems cerrados (closedAt de backlog cruzado con hora de sesión)
function _buildHourlyInsightData(allSess) {
  // A — sesiones por hora
  const sessCountsByHour = new Array(24).fill(0);
  allSess.forEach(s => {
    if (!s.resetAt) return;
    const t = String(s.resetAt).replace(/\D/g, '');
    if (t.length < 3) return;
    const h = parseInt(t.length === 3 ? t[0] : t.slice(0, 2), 10);
    if (h >= 0 && h <= 23) sessCountsByHour[h]++;
  });

  // B — ítems cerrados por hora (closedAt del backlog global)
  const closedCountsByHour = new Array(24).fill(0);
  try {
    const allProjects = (typeof state !== 'undefined' && state.projects) ? state.projects : [];
    allProjects.forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          const ts = item.closedAt || item.updatedAt;
          if (!ts) return;
          const d = new Date(ts);
          if (isNaN(d.getTime())) return;
          const h = d.getHours();
          if (h >= 0 && h <= 23) closedCountsByHour[h]++;
        });
      } catch {}
    });
  } catch {}

  const maxSess   = Math.max(...sessCountsByHour, 0);
  const maxClosed = Math.max(...closedCountsByHour, 0);
  const peakSessH   = maxSess   > 0 ? sessCountsByHour.indexOf(maxSess)   : -1;
  const peakClosedH = maxClosed > 0 ? closedCountsByHour.indexOf(maxClosed) : -1;

  return { sessCountsByHour, closedCountsByHour, maxSess, maxClosed, peakSessH, peakClosedH };
}

function renderHourly() {
  const el = document.getElementById('analytics-hourly');
  if (!el) return;

  // Contar sesiones por hora (0–23) usando resetAt como proxy (T-088: respeta filtro proyecto)
  const counts = new Array(24).fill(0);
  let total = 0;
  getAllSessions().forEach(s => {
    if (!s.resetAt) return; // excluir quickCapture sin hora
    const t = String(s.resetAt).replace(/\D/g, '');
    if (t.length < 3) return;
    const hour = parseInt(t.length === 3 ? t[0] : t.slice(0, 2), 10);
    if (hour >= 0 && hour <= 23) { counts[hour]++; total++; }
  });

  if (!total) {
    el.innerHTML = '<div class="analytics-empty">Sin sesiones con hora registrada</div>';
    return;
  }

  const maxCount = Math.max(...counts, 1);
  const peakHour = counts.indexOf(maxCount);

  const bars = counts.map((c, h) => {
    const heightPct = Math.round((c / maxCount) * 100);
    const isPeak = c === maxCount && c > 0;
    const tip = `${c} sesión${c !== 1 ? 'es' : ''} entre ${String(h).padStart(2,'0')}:00 y ${String(h).padStart(2,'0')}:59`;
    const label = h % 4 === 0 ? String(h).padStart(2,'0') : '';
    return `<div class="hourly-bar-col" title="${tip}">
      <div class="hourly-bar${isPeak ? ' peak' : ''}" style="--bar-h:${Math.max(heightPct, 2)}%"></div>
      <div class="hourly-label">${label}</div>
    </div>`;
  }).join('');

  // T-202605-454: Insight accionable — dos métricas separadas
  const _allSessForInsight = getAllSessions();
  const _insight = _buildHourlyInsightData(_allSessForInsight);
  const _fmt2 = n => String(n).padStart(2, '0');

  let insightHtml = '';
  if (_insight.maxSess > 0 || _insight.maxClosed > 0) {
    const sessLabel = _insight.peakSessH >= 0
      ? `${_fmt2(_insight.peakSessH)}:00 – ${_fmt2(_insight.peakSessH)}:59`
      : '—';
    const closedLabel = _insight.peakClosedH >= 0
      ? `${_fmt2(_insight.peakClosedH)}:00 – ${_fmt2(_insight.peakClosedH)}:59`
      : '—';
    const sameHour = _insight.peakSessH >= 0 && _insight.peakSessH === _insight.peakClosedH;
    const insightText = sameHour
      ? `Tu hora más productiva es ${sessLabel} — máxima actividad y máximos cierres coinciden`
      : _insight.peakClosedH >= 0
        ? `Inicias más sesiones a las ${sessLabel}, pero cierras más ítems a las ${closedLabel}`
        : `Tu hora de mayor actividad es ${sessLabel}`;
    insightHtml = `
    <div class="hourly-insight-row">
      <div class="hourly-insight-icon">💡</div>
      <div class="hourly-insight-body">
        <div class="hourly-insight-text">${insightText}</div>
        <div class="hourly-insight-metrics">
          <span class="hourly-insight-pill hourly-insight-pill--sess" title="Hora con más sesiones iniciadas">
            <span class="hourly-insight-pill-label">Sesiones</span>
            <span class="hourly-insight-pill-val">${sessLabel}</span>
            <span class="hourly-insight-pill-count">${_insight.maxSess}</span>
          </span>
          ${_insight.maxClosed > 0 ? `<span class="hourly-insight-pill hourly-insight-pill--closed" title="Hora con más ítems cerrados">
            <span class="hourly-insight-pill-label">Cierres</span>
            <span class="hourly-insight-pill-val">${closedLabel}</span>
            <span class="hourly-insight-pill-count">${_insight.maxClosed}</span>
          </span>` : ''}
        </div>
      </div>
    </div>`;
  }

  el.innerHTML = `
    <div class="hourly-hero-row">
      <div class="hourly-hero-badge">⚡</div>
      <div class="hourly-hero-body">
        <div class="hourly-hero-time">${String(peakHour).padStart(2,'0')}:00 – ${String(peakHour).padStart(2,'0')}:59</div>
        <div class="hourly-hero-label">Hora pico · ${maxCount} sesión${maxCount !== 1 ? 'es' : ''}</div>
      </div>
    </div>
    ${insightHtml}
    <div class="hourly-wrap">
      <div class="hourly-bars">${bars}</div>
    </div>`;
}

// ── T-202604-275: Patrones de productividad — día y hora más efectivo por proyecto ──
const _PROD_MIN_SESSIONS = 5;
const _DOW_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const _DOW_SHORT  = ['D','L','M','X','J','V','S'];

function renderProductivityPatterns() {
  const el = document.getElementById('analytics-productivity');
  if (!el) return;

  const allSess = getAllSessions();
  if (!allSess.length) {
    el.innerHTML = '<div class="analytics-empty">Sin sesiones registradas</div>';
    return;
  }

  // T-406: ítems cerrados por proyecto en el período activo
  const _pBounds = _getPeriodBounds();
  function _closedForProj(projId) {
    let count = 0;
    const projsToCheck = projId === '__global__' ? (state.projects || []) : (() => {
      const p = getProjectById(projId); return p ? [p] : [];
    })();
    projsToCheck.forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          const ts = item.closedAt || item.updatedAt || item.createdAt;
          if (!ts) return;
          const d = new Date(ts);
          if (!isNaN(d) && d >= _pBounds.current.start && d <= _pBounds.current.end) count++;
        });
      } catch {}
    });
    return count;
  }

  const projMap = {};

  const _makeEntry = (name, color) => ({
    name,
    color,
    dowCounts: new Array(7).fill(0),
    hourCounts: new Array(24).fill(0),
    total: 0
  });

  projMap['__global__'] = _makeEntry('Global', 'var(--accent)');

  allSess.forEach(s => {
    let dow = null;
    if (s.date) {
      let d = new Date(s.date);
      if (isNaN(d.getTime())) d = _parseSpanishDate(s.date);
      if (d && !isNaN(d.getTime())) dow = d.getDay();
    }

    let hour = null;
    if (s.resetAt) {
      const t = String(s.resetAt).replace(/\D/g, '');
      if (t.length >= 3) {
        const h = parseInt(t.length === 3 ? t[0] : t.slice(0, 2), 10);
        if (h >= 0 && h <= 23) hour = h;
      }
    }

    if (dow === null && hour === null) return;

    const projId = s.projectId || '__none__';
    if (projId !== '__none__') {
      if (!projMap[projId]) {
        const proj = getProjectById(projId);
        if (proj) projMap[projId] = _makeEntry(proj.name, proj.color || 'var(--accent)');
      }
    }

    const targets = [projMap['__global__']];
    if (projId !== '__none__' && projMap[projId]) targets.push(projMap[projId]);

    targets.forEach(entry => {
      if (dow !== null) entry.dowCounts[dow]++;
      if (hour !== null) entry.hourCounts[hour]++;
      entry.total++;
    });
  });

  const entries = Object.values(projMap).filter(e => e.total >= _PROD_MIN_SESSIONS);

  if (!entries.length) {
    el.innerHTML = `<div class="analytics-empty">Sin datos suficientes — se necesitan al menos ${_PROD_MIN_SESSIONS} sesiones</div>`;
    return;
  }

  function _peakDow(entry) {
    const max = Math.max(...entry.dowCounts);
    if (!max) return { label: '—', count: 0 };
    return { label: _DOW_LABELS[entry.dowCounts.indexOf(max)], count: max };
  }

  function _peakHour(entry) {
    const max = Math.max(...entry.hourCounts);
    if (!max) return { label: '—', count: 0 };
    const h = entry.hourCounts.indexOf(max);
    return { label: `${String(h).padStart(2,'0')}:00`, count: max };
  }

  function _miniDowBar(counts) {
    const max = Math.max(...counts, 1);
    return _DOW_SHORT.map((l, i) => {
      const pct = Math.round((counts[i] / max) * 100);
      const active = counts[i] === Math.max(...counts) && counts[i] > 0;
      return `<div class="ppat-bar-col" title="${_DOW_LABELS[i]}: ${counts[i]}">
        <div class="ppat-bar${active ? ' ppat-bar-peak' : ''}" style="--ppat-h:${Math.max(pct, 4)}%"></div>
        <div class="ppat-bar-label">${l}</div>
      </div>`;
    }).join('');
  }

  function _miniHourBar(counts) {
    const max = Math.max(...counts, 1);
    const groups = [];
    for (let i = 0; i < 24; i += 3) {
      const sum = counts.slice(i, i + 3).reduce((a, b) => a + b, 0);
      const peakInGroup = Math.max(...counts.slice(i, i + 3));
      const globalMax = Math.max(...counts);
      const active = peakInGroup === globalMax && globalMax > 0;
      const pct = Math.round((sum / (max * 3)) * 100);
      groups.push(`<div class="ppat-bar-col" title="${String(i).padStart(2,'0')}–${String(i+2).padStart(2,'0')}h: ${sum}">
        <div class="ppat-bar${active ? ' ppat-bar-peak' : ''}" style="--ppat-h:${Math.max(pct, 4)}%"></div>
        <div class="ppat-bar-label">${String(i).padStart(2,'0')}</div>
      </div>`);
    }
    return groups.join('');
  }

  const rows = entries.map((entry, _entryIdx) => {
    const dow  = _peakDow(entry);
    const hour = _peakHour(entry);
    const colorDot = entry.color.startsWith('var') ? 'var(--accent)' : entry.color;
    // T-406: efectividad cruzada — ítems cerrados en período activo para este proyecto
    const projIdForEff = Object.keys(projMap).find(k => projMap[k] === entry) || '__global__';
    const closedCount  = _closedForProj(projIdForEff);
    const efficiency   = entry.total ? (closedCount / entry.total).toFixed(2) : '0.00';
    const effClass     = parseFloat(efficiency) >= 0.5 ? 'ppat-eff--high' : parseFloat(efficiency) >= 0.2 ? 'ppat-eff--mid' : 'ppat-eff--low';
    return `<div class="ppat-row" style="--ppat-entry-delay:${_entryIdx * 60}ms">
      <div class="ppat-proj-name">
        <span class="ppat-dot" style="--ppat-dot-color:${colorDot}"></span>
        <span>${esc(entry.name)}</span>
        <span class="ppat-total">${entry.total} ses.</span>
      </div>
      <div class="ppat-charts">
        <div class="ppat-chart-block">
          <div class="ppat-chart-label">Día pico · <strong>${dow.label}</strong> (${dow.count})</div>
          <div class="ppat-bars">${_miniDowBar(entry.dowCounts)}</div>
        </div>
        <div class="ppat-chart-block">
          <div class="ppat-chart-label">Hora pico · <strong>${hour.label}</strong> (${hour.count})</div>
          <div class="ppat-bars">${_miniHourBar(entry.hourCounts)}</div>
        </div>
        <div class="ppat-chart-block ppat-eff-block">
          <div class="ppat-chart-label">Efectividad · período activo</div>
          <div class="ppat-eff-row">
            <span class="ppat-eff-num ${effClass}">${efficiency}</span>
            <span class="ppat-eff-detail">${closedCount} ítem${closedCount !== 1 ? 's' : ''} / ${entry.total} ses.</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="ppat-wrap">
      <div class="ppat-note">Mínimo ${_PROD_MIN_SESSIONS} sesiones para mostrar patrón. Hora derivada de hora de reset registrada.</div>
      ${rows}
    </div>`;
}

// ── T-202604-274: Checkpoints por proyecto — esta semana, este mes, total ──
function renderCheckpointsByProject() {
  const el = document.getElementById('analytics-ckpt-by-proj');
  if (!el) return;

  const allSess = getAllSessions();
  if (!allSess.length) {
    el.innerHTML = '<div class="analytics-empty">Sin sesiones registradas</div>';
    return;
  }

  // Calcular bounds fijos (semana actual y mes actual) independientes del período seleccionado
  const now = new Date();

  // Semana actual: lunes→domingo
  const dow = now.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(now); weekStart.setDate(now.getDate() + diffToMon); weekStart.setHours(0,0,0,0);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);

  // Mes actual
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const weekSess  = _sessInRange(allSess, { start: weekStart, end: weekEnd });
  const monthSess = _sessInRange(allSess, { start: monthStart, end: monthEnd });

  // Acumular por proyecto
  const projData = {}; // projId → { name, color, icon, week, month, total }

  function _addToProj(sessArr, field) {
    sessArr.forEach(s => {
      const pid = s.projectId || '__none__';
      if (!projData[pid]) {
        if (pid === '__none__') {
          projData[pid] = { name: 'Sin proyecto', color: 'var(--text3)', icon: '—', week: 0, month: 0, total: 0 };
        } else {
          const p = getProjectById(pid);
          projData[pid] = {
            name: p ? p.name : pid,
            color: p ? (p.color || 'var(--accent)') : 'var(--accent)',
            icon: p ? (p.icon || '📁') : '📁',
            week: 0, month: 0, total: 0
          };
        }
      }
      projData[pid][field]++;
    });
  }

  // Total: contar todas las sesiones primero para asegurar que aparezcan proyectos con 0 en semana/mes
  allSess.forEach(s => {
    const pid = s.projectId || '__none__';
    if (!projData[pid]) {
      if (pid === '__none__') {
        projData[pid] = { name: 'Sin proyecto', color: 'var(--text3)', icon: '—', week: 0, month: 0, total: 0 };
      } else {
        const p = getProjectById(pid);
        projData[pid] = {
          name: p ? p.name : pid,
          color: p ? (p.color || 'var(--accent)') : 'var(--accent)',
          icon: p ? (p.icon || '📁') : '📁',
          week: 0, month: 0, total: 0
        };
      }
    }
    projData[pid].total++;
  });
  _addToProj(weekSess, 'week');
  _addToProj(monthSess, 'month');

  const entries = Object.values(projData).sort((a, b) => b.total - a.total);

  if (!entries.length) {
    el.innerHTML = '<div class="analytics-empty">Sin datos</div>';
    return;
  }

  const maxTotal = Math.max(...entries.map(e => e.total), 1);

  const rowsHtml = entries.map(e => {
    const barPct = Math.round((e.total / maxTotal) * 100);
    const colorStyle = e.color.startsWith('var') ? e.color : e.color;
    const dotStyle = e.color.startsWith('var') ? `color:${e.color}` : `color:${e.color}`;
    return `<div class="ckpt-proj-row">
      <div class="ckpt-proj-name">
        <span class="ckpt-proj-icon">${esc(e.icon)}</span>
        <span class="ckpt-proj-label">${esc(e.name)}</span>
      </div>
      <div class="ckpt-proj-nums">
        <span class="ckpt-num" title="Esta semana">${e.week}</span>
        <span class="ckpt-num" title="Este mes">${e.month}</span>
        <span class="ckpt-num ckpt-num-total" title="Total">${e.total}</span>
      </div>
      <div class="ckpt-proj-bar-track">
        <div class="ckpt-proj-bar-fill" style="--ckpt-bar-pct:${barPct}%;--proj-bar-color:${e.color.startsWith('var') ? 'var(--accent)' : e.color}"></div>
      </div>
    </div>`;
  }).join('');

  // Totales globales
  const totalWeek  = weekSess.length;
  const totalMonth = monthSess.length;
  const totalAll   = allSess.length;

  el.innerHTML = `
    <div class="ckpt-proj-wrap">
      <div class="ckpt-proj-header">
        <div class="ckpt-proj-header-name">Proyecto</div>
        <div class="ckpt-proj-header-nums">
          <span>Semana</span>
          <span>Mes</span>
          <span>Total</span>
        </div>
      </div>
      <div class="ckpt-proj-rows">${rowsHtml}</div>
      <div class="ckpt-proj-footer">
        <span>Total</span>
        <div class="ckpt-proj-header-nums">
          <span>${totalWeek}</span>
          <span>${totalMonth}</span>
          <span>${totalAll}</span>
        </div>
      </div>
    </div>`;
}

// ── T-046: Exportar resumen de analytics en markdown ──
function exportAnalyticsMd() {
  const now = new Date();
  const months = getAnalyticsMonths();
  const rangeLabel = _analyticsRange === 0 ? 'Todo el historial' : `Últimos ${_analyticsRange} mes${_analyticsRange > 1 ? 'es' : ''}`;

  // Totales por IA en el período
  const rows = state.ais.map(ai => {
    const aiSess = getAISessions(ai.id);
    const count = aiSess.filter(s => {
      const ym = sessionYM(s);
      return ym && months.includes(ym);
    }).length;
    return { name: ai.name, count };
  }).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

  const totalSess = rows.reduce((a, r) => a + r.count, 0);
  const topAI = rows[0]?.name || '—';

  // Racha
  const daySet = new Set();
  getAllSessions().forEach(s => {
    const k = sessionDateKey(s);
    if (k) daySet.add(k);
  });
  let maxStreak = 0, streak = 0;
  const sortedDays = [...daySet].sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { streak = 1; }
    else {
      const diff = Math.round((new Date(sortedDays[i]) - new Date(sortedDays[i-1])) / 86400000);
      streak = diff === 1 ? streak + 1 : 1;
    }
    if (streak > maxStreak) maxStreak = streak;
  }

  const fecha = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const monthRows = months.map(ym => {
    const total = getAllSessions().filter(s => sessionYM(s) === ym).length;
    return `| ${fmtMonth(ym)} | ${total} |`;
  });

  const md = `# Locus — Resumen Analytics
> Generado: ${fecha} · Período: ${rangeLabel}

## Métricas clave
- **Sesiones en período:** ${totalSess}
- **IA más activa:** ${topAI}
- **Racha máxima:** ${maxStreak} días consecutivos
- **Días únicos con sesión:** ${daySet.size}
- **IAs activas en período:** ${rows.length}

## Sesiones por IA
${rows.map((r, i) => `${i+1}. **${r.name}** — ${r.count} sesión${r.count !== 1 ? 'es' : ''}`).join('\n')}

## Sesiones por mes
| Mes | Sesiones |
|-----|----------|
${monthRows.join('\n')}
`;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${fecha}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('success', 'Resumen exportado');
}

// ── T-057: Vista cronológica ──
// Colores por IA — generados dinámicamente a partir del índice
const CHRONO_COLORS = ['#7c6af7','#2ecc78','#38bdf8','#e8a832','#e85555','#f472b6','#a3e635','#fb923c'];

function getAIColor(aiId) {
  const idx = state.ais.findIndex(a => a.id === aiId);
  return CHRONO_COLORS[idx % CHRONO_COLORS.length] || '#7c6af7';
}

// Detectar mobile
function isMobile() { return window.innerWidth <= 600; }

// viewMode eliminado — siempre 'cards' (T-202604-202 deprecado)
const viewMode = 'cards';
function setViewMode() {} // no-op — eliminado
function applyViewMode() { if (typeof render === 'function') render(); }

// T-078: Estado de filtros inline de la vista proyecto
let _projViewFilterAI = ''; // aiId activo o ''
let _projViewSearch = '';

function renderProject(query) {
  // query viene del buscador global — sincronizar con estado interno
  if (query !== undefined) _projViewSearch = query.toLowerCase().trim();
  const q = _projViewSearch;
  // Usar tracker-detail como contenedor para que overflow-y:auto active el scroll
  const trackerPanel = document.querySelector('.tracker-detail') || document.getElementById('tab-tracker');

  // Limpiar vista anterior si existe
  ['project-view-header','project-view-title','project-sess-list','project-list'].forEach(id => {
    const el = document.getElementById(id); if (el) el.remove();
  });

  // Construir lista plana de sesiones según filtro global de proyecto
  const filterId = _getActiveProjectFilter();
  const sourceAIs = state.ais.filter(a => !a.archived);
  const _projForFilter = filterId ? getProjectById(filterId) : null;
  const _aiIdsInProj = _projForFilter ? new Set((_projForFilter.sessions || []).map(s => s.aiId).filter(Boolean)) : null;
  let filteredAIs = (_aiIdsInProj)
    ? sourceAIs.filter(a => _aiIdsInProj.has(a.id))
    : sourceAIs;

  // Aplicar filtro inline de IA
  if (_projViewFilterAI) filteredAIs = filteredAIs.filter(a => a.id === _projViewFilterAI);

  let allSessions = [];
  filteredAIs.forEach(ai => {
    getAISessions(ai.id).forEach(s => {
      // Si hay filtro de proyecto, solo incluir sesiones de ese proyecto
      if (filterId && s.projectId !== filterId) return;
      if (q && !(
        s.title.toLowerCase().includes(q) ||
        (s.summary || '').toLowerCase().includes(q) ||
        ai.name.toLowerCase().includes(q)
      )) return;
      allSessions.push({ ai, s });
    });
  });

  // Ordenar más reciente primero
  allSessions.sort((a, b) => new Date(b.s.date || 0) - new Date(a.s.date || 0));

  // ── Stats card (sobre todas las sesiones de las AIs en scope, sin filtros inline) ──
  const scopeAIs = _aiIdsInProj ? sourceAIs.filter(a => _aiIdsInProj.has(a.id)) : sourceAIs;
  const scopeSessions = filterId
    ? scopeAIs.flatMap(a => getAISessions(a.id).filter(s => s.projectId === filterId))
    : scopeAIs.flatMap(a => a.sessions);
  const totalSess = scopeSessions.length;
  const lastSessDate = scopeSessions.length
    ? scopeSessions.reduce((latest, s) => {
        const d = new Date(s.date || 0);
        return d > latest ? d : latest;
      }, new Date(0))
    : null;
  const lastSessLabel = lastSessDate && lastSessDate > new Date(0)
    ? (relDate(lastSessDate.toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'})) || lastSessDate.toLocaleDateString('es-MX', {day:'2-digit', month:'short'}))
    : '—';
  const uniqueAIs = scopeAIs.filter(a => a.sessions.length > 0).length;
  const now = new Date();
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);
  const activeDays30 = new Set(
    scopeSessions
      .filter(s => s.date && new Date(s.date) >= monthAgo)
      .map(s => new Date(s.date).toDateString())
  ).size;

  const projName = filterId ? (getProjectById(filterId)?.name || 'Proyecto') : 'Todos';

  // R-202604-045: empty state cuando el proyecto activo no tiene sesiones
  // Usa scopeSessions (fuente real) — _projObj.sessions puede estar vacío en path legacy v2
  if (filterId && scopeSessions.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.id = 'project-view-header';
    emptyEl.className = 'proj-no-sessions-empty';
    emptyEl.innerHTML = `
      <div class="proj-no-sessions-icon">🗂</div>
      <div class="proj-no-sessions-title">Proyecto nuevo — sin sesiones aún</div>
      <div class="proj-no-sessions-hint">Inicia una sesión desde el Tracker y asígnala a este proyecto para empezar a registrar.</div>
      <button class="proj-no-sessions-cta" onclick="switchTab('tab-tracker')">Ir al Tracker →</button>`;
    trackerPanel.appendChild(emptyEl);
    return;
  }

  // T-202604-030: próximo paso de la última sesión del proyecto activo
  const _projSessions = filterId
    ? (getProjectById(filterId)?.sessions || []).slice().sort((a,b) => new Date(b.date||0) - new Date(a.date||0))
    : [];
  const _lastNextStep = _projSessions.find(s => s.nextStep)?.nextStep || '';

  // Header con stats
  const headerEl = document.createElement('div');
  headerEl.id = 'project-view-header';
  headerEl.className = 'proj-view-header';

  // Chips de filtro por IA
  const aiChips = scopeAIs.length > 1
    ? `<span class="proj-filter-label">Filtrar por IA:</span>` + scopeAIs.map(a =>
        `<span class="proj-filter-chip${_projViewFilterAI === a.id ? ' active' : ''}"
          onclick="_projToggleAIFilter('${a.id}')">${esc(a.name)}</span>`
      ).join('')
    : '';

  headerEl.innerHTML = `
    <div class="proj-stats-card">
      <div class="proj-stat-item">
        <div class="proj-stat-value">${totalSess}</div>
        <div class="proj-stat-label">Sesiones totales</div>
      </div>
      <div class="proj-stat-item">
        <div class="proj-stat-value proj-stat-value--sm">${lastSessLabel}</div>
        <div class="proj-stat-label">Última sesión</div>
      </div>
      <div class="proj-stat-item">
        <div class="proj-stat-value">${uniqueAIs}</div>
        <div class="proj-stat-label">IAs involucradas</div>
      </div>
      <div class="proj-stat-item">
        <div class="proj-stat-value">${activeDays30}</div>
        <div class="proj-stat-label">Días activos /30</div>
      </div>
    </div>
    ${_lastNextStep ? `<div class="proj-next-step"><span class="proj-next-step-arrow">→</span><span>${esc(_lastNextStep)}</span></div>` : ''}
    <div class="proj-filters-row">
      ${aiChips}
      <input class="proj-search-input" type="text" placeholder="Buscar en proyecto…"
        value="${esc(q)}" oninput="_projViewSearchInput(this.value)"
        autocomplete="off">
    </div>`;
  trackerPanel.appendChild(headerEl);

  // T-079: Botón toggle analytics + sección analytics
  if (filterId) {
    const analyticsToggleEl = document.createElement('div');
    analyticsToggleEl.className = 'proj-analytics-toggle-wrap';
    analyticsToggleEl.innerHTML = `<button class="proj-analytics-toggle" id="proj-analytics-toggle-btn"
      onclick="_toggleProjAnalytics('${filterId}')">📊 Ver analytics del proyecto</button>`;
    trackerPanel.appendChild(analyticsToggleEl);

    const analyticsEl = document.createElement('div');
    analyticsEl.id = 'proj-analytics-section';
    analyticsEl.className = 'proj-analytics-section';
    trackerPanel.appendChild(analyticsEl);

    // Restaurar estado abierto si estaba abierto
    if (renderProject._analyticsOpen) {
      analyticsEl.classList.add('open');
      renderProjectAnalytics(filterId);
      const btn = analyticsToggleEl.querySelector('#proj-analytics-toggle-btn');
      if (btn) btn.textContent = '📊 Ocultar analytics';
    }
  }

  // Título de lista
  const titleEl = document.createElement('div');
  titleEl.id = 'project-view-title';
  titleEl.className = 'proj-view-title';
  titleEl.textContent = `${projName} — ${allSessions.length} sesión${allSessions.length !== 1 ? 'es' : ''}`;
  trackerPanel.appendChild(titleEl);

  // T-202604-265: indicador salud sprint activo
  if (filterId) {
    const sprintEl = document.createElement('div');
    sprintEl.id = 'project-sprint-health';
    sprintEl.className = 'proj-sprint-health';
    const activeSprint = typeof _getActiveSprint === 'function' ? _getActiveSprint() : null;
    if (activeSprint) {
      const sprintItems = (typeof ITEMS !== 'undefined' ? ITEMS : [])
        .filter(i => i.sprint === activeSprint.id && i.status !== 'descartado');
      const total = sprintItems.length;
      const done = sprintItems.filter(i => i.status === 'done').length;
      const totalEffort = sprintItems.reduce((sum, i) => sum + (parseInt(i.effort) || 1), 0);
      const doneEffort = sprintItems.filter(i => i.status === 'done').reduce((sum, i) => sum + (parseInt(i.effort) || 1), 0);
      const pct = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;
      const sprintLabel = activeSprint.label || activeSprint.id;
      sprintEl.innerHTML = `
        <div class="sprint-health-header">
          <span class="sprint-health-label">${esc(sprintLabel)}</span>
          <span class="sprint-health-counts">${done}/${total} ítems · ${pct}% effort</span>
        </div>
        <div class="sprint-health-bar-wrap">
          <div class="sprint-health-bar" style="--sprint-pct:${pct}%"></div>
        </div>`;
    } else {
      sprintEl.innerHTML = `
        <div class="sprint-health-empty">
          <span class="sprint-health-none">Sin sprint activo</span>
          <button class="btn-ghost btn-sm sprint-health-cta" onclick="switchTab('backlog');if(typeof switchSubTab==='function')switchSubTab('backlog')">+ Crear sprint</button>
        </div>`;
    }
    trackerPanel.appendChild(sprintEl);
  }

  // T-202604-285: contexto rico del proyecto — preview MD + secciones colapsables + edición inline
  if (filterId) {
    const proj = getProjectById(filterId);
    const ctxRaw = proj ? (proj.context || '') : '';
    const ctxEl = document.createElement('div');
    ctxEl.id = 'project-ctx-section';
    ctxEl.className = 'proj-ctx-section';
    ctxEl.dataset.projId = filterId;
    ctxEl.dataset.editing = '0';

    const _renderCtxPreview = (md) => {
      if (!md) return '<div class="proj-ctx-empty">Sin contexto registrado. Haz click en Editar para agregar.</div>';
      // Dividir por encabezados ## — secciones colapsables
      const sections = [];
      let currentTitle = null;
      let currentLines = [];
      for (const line of md.split('\n')) {
        if (/^## /.test(line)) {
          if (currentTitle !== null) sections.push({ title: currentTitle, body: currentLines.join('\n') });
          else if (currentLines.some(l => l.trim())) sections.push({ title: null, body: currentLines.join('\n') });
          currentTitle = line.replace(/^## /, '').trim();
          currentLines = [];
        } else {
          currentLines.push(line);
        }
      }
      if (currentTitle !== null) sections.push({ title: currentTitle, body: currentLines.join('\n') });
      else if (currentLines.some(l => l.trim())) sections.push({ title: null, body: currentLines.join('\n') });

      if (!sections.length) return '<div class="proj-ctx-empty">Sin contenido</div>';

      // Si no hay secciones ## → render plano sin colapsables
      if (sections.length === 1 && sections[0].title === null) {
        return `<div class="proj-ctx-body">${renderContextMd(sections[0].body)}</div>`;
      }

      return sections.map((sec, idx) => {
        const sId = `proj-ctx-sec-${filterId}-${idx}`;
        if (sec.title === null) {
          return `<div class="proj-ctx-body proj-ctx-lead">${renderContextMd(sec.body)}</div>`;
        }
        return `<div class="proj-ctx-sec">
          <div class="proj-ctx-sec-header" onclick="_projCtxToggleSec('${sId}')">
            <span class="proj-ctx-sec-arrow" id="${sId}-arrow">▾</span>
            <span class="proj-ctx-sec-title">${esc(sec.title)}</span>
          </div>
          <div class="proj-ctx-sec-body" id="${sId}">${renderContextMd(sec.body)}</div>
        </div>`;
      }).join('');
    };

    const _buildCtxEl = (editing) => {
      if (editing) {
        ctxEl.innerHTML = `
          <div class="proj-ctx-header">
            <span class="proj-ctx-label">📄 Contexto</span>
            <div class="proj-ctx-actions">
              <button class="proj-ctx-btn proj-ctx-save" onclick="_projCtxSave('${filterId}')">Guardar</button>
              <button class="proj-ctx-btn proj-ctx-cancel" onclick="_projCtxCancelEdit('${filterId}')">Cancelar</button>
            </div>
          </div>
          <textarea class="proj-ctx-textarea" id="proj-ctx-ta-${filterId}">${esc(ctxRaw)}</textarea>`;
        setTimeout(() => {
          const ta = document.getElementById('proj-ctx-ta-' + filterId);
          if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
        }, 50);
      } else {
        ctxEl.innerHTML = `
          <div class="proj-ctx-header">
            <span class="proj-ctx-label">📄 Contexto</span>
            <button class="proj-ctx-btn proj-ctx-edit" onclick="_projCtxStartEdit('${filterId}')">Editar</button>
          </div>
          <div class="proj-ctx-preview">${_renderCtxPreview(ctxRaw)}</div>`;
      }
    };

    _buildCtxEl(false);
    trackerPanel.appendChild(ctxEl);
  }

  // T-202604-264: top 3 ítems sugeridos por score
  if (filterId) {
    const suggestedEl = document.createElement('div');
    suggestedEl.id = 'project-suggested-items';
    suggestedEl.className = 'proj-suggested-section';
    const candidateItems = (typeof ITEMS !== 'undefined' ? ITEMS : [])
      .filter(i => i.status === 'pendiente')
      .map(i => ({ ...i, _score: typeof _calcRelevanceScore === 'function' ? _calcRelevanceScore(i) : (i._score || 0) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 3);
    if (candidateItems.length) {
      const typeColor = c => {
        if (!c) return 'var(--accent)';
        if (c[0] === 'T') return 'var(--green, #2ecc78)';
        if (c[0] === 'B') return 'var(--red, #e85555)';
        if (c[0] === 'R') return '#38bdf8';
        return '#7c6af7';
      };
      suggestedEl.innerHTML = `
        <div class="proj-suggested-header">
          <span class="proj-suggested-title">⚡ Sugeridos</span>
          <span class="proj-suggested-count">${candidateItems.length}</span>
        </div>
        <div class="proj-suggested-list">
          ${candidateItems.map(i => `
            <div class="proj-suggested-row" onclick="_qnNavToItem('${esc(i.code)}')">
              <span class="proj-suggested-code" style="--item-type-color:${typeColor(i.code)}">${esc(i.code)}</span>
              <span class="proj-suggested-desc">${esc((i.title || i.desc || '').slice(0, 80))}</span>
              <span class="proj-suggested-score" title="Score de relevancia">${i._score}</span>
            </div>`).join('')}
        </div>`;
    } else {
      suggestedEl.innerHTML = `
        <div class="proj-suggested-header">
          <span class="proj-suggested-title">⚡ Sugeridos</span>
        </div>
        <div class="proj-suggested-empty">Sin ítems pendientes</div>`;
    }
    trackerPanel.appendChild(suggestedEl);
  }

  // T-202604-266: sección Bloqueados — ítems con sprint asignado y 14+ días sin movimiento
  if (filterId) {
    const BLOCKED_DAYS = 14;
    const blockedCutoff = Date.now() - BLOCKED_DAYS * 24 * 60 * 60 * 1000;
    const blockedItems = (typeof ITEMS !== 'undefined' ? ITEMS : [])
      .filter(i =>
        i.sprint &&
        i.status === 'pendiente' &&
        (i.updatedAt || i.createdAt) &&
        (i.updatedAt || i.createdAt) < blockedCutoff
      )
      .map(i => ({
        ...i,
        _daysBlocked: Math.floor((Date.now() - (i.updatedAt || i.createdAt)) / 86400000)
      }))
      .sort((a, b) => b._daysBlocked - a._daysBlocked);

    if (blockedItems.length) {
      const blockedEl = document.createElement('div');
      blockedEl.id = 'project-blocked-items';
      blockedEl.className = 'proj-blocked-section';
      const typeColor = c => {
        if (!c) return 'var(--accent)';
        if (c[0] === 'T') return 'var(--green, #2ecc78)';
        if (c[0] === 'B') return 'var(--red, #e85555)';
        if (c[0] === 'R') return '#38bdf8';
        return '#7c6af7';
      };
      blockedEl.innerHTML = `
        <div class="proj-blocked-header">
          <span class="proj-blocked-title">🔒 Bloqueados</span>
          <span class="proj-blocked-count">${blockedItems.length}</span>
        </div>
        <div class="proj-blocked-list">
          ${blockedItems.map(i => `
            <div class="proj-blocked-row" onclick="_qnNavToItem('${esc(i.code)}')">
              <span class="proj-blocked-code" style="--item-type-color:${typeColor(i.code)}">${esc(i.code)}</span>
              <span class="proj-blocked-desc">${esc((i.title || i.desc || '').slice(0, 80))}</span>
              <span class="proj-blocked-days" title="${i._daysBlocked} días sin movimiento">${i._daysBlocked}d</span>
            </div>`).join('')}
        </div>`;
      trackerPanel.appendChild(blockedEl);
    }
  }

  const listEl = document.createElement('div');
  listEl.id = 'project-sess-list';
  listEl.className = 'proj-sess-list';

  const countEl = document.getElementById('search-count');
  if (q && countEl) countEl.textContent = `${allSessions.length} resultado${allSessions.length !== 1 ? 's' : ''} encontrado${allSessions.length !== 1 ? 's' : ''}`;
  else if (countEl) countEl.textContent = '';

  if (!allSessions.length) {
    listEl.innerHTML = `<div class="project-empty">${q || _projViewFilterAI ? 'Sin resultados con los filtros actuales' : 'Sin sesiones registradas'}</div>`;
  } else {
    listEl.innerHTML = allSessions.map(({ ai, s }) =>
      `<div class="proj-sess-row" onclick="openDetail('${ai.id}','${s.id}')">
        <span class="proj-sess-ai">${esc(ai.name)}</span>
        <span class="proj-sess-title">${esc(s.title)}</span>
        <span class="proj-sess-date">${relDate(s.date, s.savedAt || s.createdAt) || s.dateShort || ''}</span>
      </div>`
    ).join('');
  }
  trackerPanel.appendChild(listEl);

  // T-202604-269: sección Notas rápidas del proyecto
  if (filterId) {
    const projNotes = (state.quickNotes || []).filter(n => {
      // Incluir todas las notas — filtradas opcionalmente por vínculo a ítem del proyecto
      // Mostrar todas (notas son globales, no tienen projectId)
      return true;
    });
    const notesEl = document.createElement('div');
    notesEl.id = 'project-notes-section';
    notesEl.className = 'proj-notes-section';
    if (projNotes.length) {
      notesEl.innerHTML = `
        <div class="proj-notes-header">
          <span class="proj-notes-title">📝 Notas</span>
          <span class="proj-notes-count">${projNotes.length}</span>
        </div>
        <div class="proj-notes-list">
          ${projNotes.map(n => `
            <div class="proj-note-row" onclick="openQuickNote('${n.id}')">
              <div class="proj-note-body">
                <span class="proj-note-text">${esc(n.text)}</span>
                ${n.itemRef ? `<span class="proj-note-badge" onclick="event.stopPropagation();_qnNavToItem('${esc(n.itemRef)}')" title="Ir a ${esc(n.itemRef)}">${esc(n.itemRef)}</span>` : ''}
              </div>
              <span class="proj-note-date">${typeof relDate === 'function' ? (relDate(n.updatedAt || n.createdAt) || '') : ''}</span>
            </div>`).join('')}
        </div>`;
    } else {
      notesEl.innerHTML = `
        <div class="proj-notes-header">
          <span class="proj-notes-title">📝 Notas</span>
        </div>
        <div class="proj-notes-empty">Sin notas registradas</div>`;
    }
    trackerPanel.appendChild(notesEl);
  }

  // T-202604-289: sección Decisiones del proyecto
  if (filterId) {

    const proj = getProjectById(filterId);
    const decisions = (proj && Array.isArray(proj.decisions)) ? proj.decisions : [];
    const decisionsEl = document.createElement('div');
    decisionsEl.id = 'project-decisions-section';
    decisionsEl.className = 'proj-decisions-section';
    decisionsEl.dataset.projId = filterId;
    _renderDecisionsSection(decisionsEl, filterId, decisions);
    trackerPanel.appendChild(decisionsEl);
  }
}

// R-B: helper para refrescar solo la sección de notas sin re-renderizar el panel completo
function _refreshProjectNotes() {
  const el = document.getElementById('project-notes-section');
  if (!el) return; // panel no visible — no hay nada que refrescar
  const projNotes = state.quickNotes || [];
  if (projNotes.length) {
    el.innerHTML = `
      <div class="proj-notes-header">
        <span class="proj-notes-title">📝 Notas</span>
        <span class="proj-notes-count">${projNotes.length}</span>
      </div>
      <div class="proj-notes-list">
        ${projNotes.map(n => `
          <div class="proj-note-row" onclick="openQuickNote('${n.id}')">
            <div class="proj-note-body">
              <span class="proj-note-text">${esc(n.text)}</span>
              ${n.itemRef ? `<span class="proj-note-badge" onclick="event.stopPropagation();_qnNavToItem('${esc(n.itemRef)}')" title="Ir a ${esc(n.itemRef)}">${esc(n.itemRef)}</span>` : ''}
            </div>
            <span class="proj-note-date">${typeof relDate === 'function' ? (relDate(n.updatedAt || n.createdAt) || '') : ''}</span>
          </div>`).join('')}
      </div>`;
  } else {
    el.innerHTML = `
      <div class="proj-notes-header">
        <span class="proj-notes-title">📝 Notas</span>
      </div>
      <div class="proj-notes-empty">Sin notas registradas</div>`;
  }
}
window._refreshProjectNotes = _refreshProjectNotes;

// T-202604-289: render interno de la sección Decisiones (reutilizable por CRUD)
function _renderDecisionsSection(el, projId, decisions) {
  const sorted = [...decisions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const rowsHtml = sorted.map(d => `
    <div class="proj-dec-row" data-dec-id="${esc(d.id)}">
      <div class="proj-dec-body">
        <div class="proj-dec-text" id="proj-dec-text-${esc(d.id)}">${esc(d.text)}</div>
        <div class="proj-dec-meta">
          <span class="proj-dec-date">${esc(d.date || '—')}</span>
          ${d.author ? `<span class="proj-dec-sep">·</span><span class="proj-dec-author">${esc(d.author)}</span>` : ''}
        </div>
      </div>
      <div class="proj-dec-actions">
        <button class="proj-dec-btn" title="Editar" onclick="_projEditDecision('${esc(projId)}','${esc(d.id)}')">✎</button>
        <button class="proj-dec-btn proj-dec-btn-del" title="Eliminar" onclick="_projDeleteDecision('${esc(projId)}','${esc(d.id)}')">✕</button>
      </div>
    </div>`).join('');

  el.innerHTML = `
    <div class="proj-dec-header">
      <span class="proj-dec-title">🗂 Decisiones</span>
      ${decisions.length ? `<span class="proj-dec-count">${decisions.length}</span>` : ''}
      <button class="proj-dec-add-btn" onclick="_projOpenAddDecision('${esc(projId)}')" title="Agregar decisión">＋ Agregar</button>
    </div>
    <div id="proj-dec-form-${esc(projId)}" class="proj-dec-form hidden">
      <textarea class="proj-dec-textarea" id="proj-dec-ta-${esc(projId)}" placeholder="Describe la decisión tomada…" rows="3"></textarea>
      <div class="proj-dec-form-row">
        <input class="proj-dec-input" id="proj-dec-author-${esc(projId)}" type="text" placeholder="Autor / rol (ej: PO · Alex)" maxlength="60">
        <div class="proj-dec-form-actions">
          <button class="proj-dec-btn proj-dec-btn-save" onclick="_projSaveDecision('${esc(projId)}')">Guardar</button>
          <button class="proj-dec-btn" onclick="_projCancelDecision('${esc(projId)}')">Cancelar</button>
        </div>
      </div>
    </div>
    ${sorted.length
      ? `<div class="proj-dec-list">${rowsHtml}</div>`
      : `<div class="proj-dec-empty">Sin decisiones registradas.</div>`}`;
}

// T-202604-289: abrir formulario de nueva decisión
function _projOpenAddDecision(projId) {
  const form = document.getElementById('proj-dec-form-' + projId);
  if (!form) return;
  const ta = document.getElementById('proj-dec-ta-' + projId);
  const auth = document.getElementById('proj-dec-author-' + projId);
  if (ta) { ta.value = ''; ta.removeAttribute('data-edit-id'); }
  if (auth) auth.value = '';
  form.classList.remove('hidden');
  if (ta) setTimeout(() => ta.focus(), 40);
}

// T-202604-289: guardar decisión (nueva o edición)
function _projSaveDecision(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const ta = document.getElementById('proj-dec-ta-' + projId);
  const auth = document.getElementById('proj-dec-author-' + projId);
  const text = (ta ? ta.value.trim() : '');
  if (!text) { showToast('warning', 'El texto de la decisión no puede estar vacío'); return; }
  const editId = ta ? ta.getAttribute('data-edit-id') : null;
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  if (!Array.isArray(proj.decisions)) proj.decisions = [];
  if (editId) {
    const dec = proj.decisions.find(d => d.id === editId);
    if (dec) { dec.text = text; dec.author = (auth ? auth.value.trim() : ''); dec.updatedAt = Date.now(); }
  } else {
    proj.decisions.push({ id: 'dec-' + Date.now(), text, author: (auth ? auth.value.trim() : ''), date: dateStr, createdAt: Date.now() });
  }
  save();
  const el = document.getElementById('project-decisions-section');
  if (el) _renderDecisionsSection(el, projId, proj.decisions);
  showToast('success', editId ? 'Decisión actualizada' : 'Decisión guardada');
}

// T-202604-289: cancelar formulario
function _projCancelDecision(projId) {
  const form = document.getElementById('proj-dec-form-' + projId);
  if (form) form.classList.add('hidden');
}

// T-202604-289: abrir formulario en modo edición
function _projEditDecision(projId, decId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const dec = (proj.decisions || []).find(d => d.id === decId);
  if (!dec) return;
  const form = document.getElementById('proj-dec-form-' + projId);
  const ta = document.getElementById('proj-dec-ta-' + projId);
  const auth = document.getElementById('proj-dec-author-' + projId);
  if (!form || !ta) return;
  ta.value = dec.text || '';
  ta.setAttribute('data-edit-id', decId);
  if (auth) auth.value = dec.author || '';
  form.classList.remove('hidden');
  setTimeout(() => ta.focus(), 40);
}

// T-202604-289: eliminar decisión con confirmación inline
function _projDeleteDecision(projId, decId) {
  const proj = getProjectById(projId);
  if (!proj || !Array.isArray(proj.decisions)) return;
  const idx = proj.decisions.findIndex(d => d.id === decId);
  if (idx < 0) return;
  proj.decisions.splice(idx, 1);
  save();
  const el = document.getElementById('project-decisions-section');
  if (el) _renderDecisionsSection(el, projId, proj.decisions);
  showToast('success', 'Decisión eliminada');
}

// T-202604-266: navegar a ítem en Backlog y hacer scroll al elemento
function _qnNavToItem(code) {
  if (!code) return;
  switchTab('backlog');
  if (typeof switchSubTab === 'function') switchSubTab('backlog');
  // Esperar render del backlog antes de scroll
  setTimeout(() => {
    // buildBacklogItem genera id="bl-item-{code}" — intentar directo primero
    let el = document.getElementById('bl-item-' + code);
    // Fallback: buscar por data-code
    if (!el) el = document.querySelector(`[data-code="${CSS.escape(code)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
}

// T-202604-285: helpers edición inline de contexto de proyecto
function _projCtxStartEdit(projId) {
  const ctxEl = document.getElementById('project-ctx-section');
  if (!ctxEl) return;
  ctxEl.dataset.editing = '1';
  const proj = getProjectById(projId);
  const raw = proj ? (proj.context || '') : '';
  ctxEl.innerHTML = `
    <div class="proj-ctx-header">
      <span class="proj-ctx-label">📄 Contexto</span>
      <div class="proj-ctx-actions">
        <button class="proj-ctx-btn proj-ctx-save" onclick="_projCtxSave('${projId}')">Guardar</button>
        <button class="proj-ctx-btn proj-ctx-cancel" onclick="_projCtxCancelEdit('${projId}')">Cancelar</button>
      </div>
    </div>
    <textarea class="proj-ctx-textarea" id="proj-ctx-ta-${projId}">${esc(raw)}</textarea>`;
  setTimeout(() => {
    const ta = document.getElementById('proj-ctx-ta-' + projId);
    if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }, 50);
}

function _projCtxSave(projId) {
  const ta = document.getElementById('proj-ctx-ta-' + projId);
  if (!ta) return;
  const newText = ta.value;
  if (typeof setProjContext === 'function') setProjContext(projId, newText);
  else {
    const proj = getProjectById(projId);
    if (proj) { proj.context = newText; save(); }
  }
  renderProject();
}

function _projCtxCancelEdit(projId) {
  renderProject();
}

function _projCtxToggleSec(sId) {
  const body = document.getElementById(sId);
  const arrow = document.getElementById(sId + '-arrow');
  if (!body) return;
  const isOpen = !body.classList.contains('collapsed');
  body.classList.toggle('collapsed', isOpen);
  if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
}

function _projToggleAIFilter(aiId) {
  _projViewFilterAI = _projViewFilterAI === aiId ? '' : aiId;
  renderProject();
}

function _projViewSearchInput(val) {
  _projViewSearch = val.toLowerCase().trim();
  renderProject();
}

// ── T-079: Analytics por proyecto ──
renderProject._analyticsOpen = false;

function _toggleProjAnalytics(projId) {
  const section = document.getElementById('proj-analytics-section');
  const btn = document.getElementById('proj-analytics-toggle-btn');
  if (!section) return;
  renderProject._analyticsOpen = !section.classList.contains('open');
  section.classList.toggle('open');
  if (btn) btn.textContent = section.classList.contains('open') ? '📊 Ocultar analytics' : '📊 Ver analytics del proyecto';
  if (section.classList.contains('open')) renderProjectAnalytics(projId);
}

function renderProjectAnalytics(projId) {
  const section = document.getElementById('proj-analytics-section');
  if (!section) return;
  const proj = getProjectById(projId);
  if (!proj) return;

  const allSess = getProjectSessions(projId);
  const projAIIds = new Set(allSess.map(s => s.aiId).filter(Boolean));
  const projAIs = state.ais.filter(ai => projAIIds.has(ai.id) && !ai.archived);

  if (!allSess.length) {
    section.innerHTML = `<div class="proj-analytics-block"><div class="proj-analytics-block-title">Sin datos</div>
      <div class="proj-no-data-hint">Este proyecto no tiene sesiones registradas aún.</div></div>`;
    return;
  }

  // ── 1. Gráfico sesiones/mes (respeta rango T-047) ──
  const now = new Date();
  const months = getAnalyticsMonths();
  const monthLabels = months.map(ym => fmtMonth(ym));
  const rangeLabel = _analyticsRange === 0 ? 'Todo el historial' : `Últimos ${_analyticsRange} mes${_analyticsRange > 1 ? 'es' : ''}`;
  const counts = months.map(ym =>
    allSess.filter(s => sessionYM(s) === ym).length
  );
  const maxC = Math.max(...counts, 1);
  const barWidth = 100 / months.length;

  let barsHtml = counts.map((c, i) => {
    return `<div class="proj-analytics-col">
      <div class="proj-analytics-col-code">${c || ''}</div>
      <div class="proj-analytics-bar-wrap">
        <div class="proj-analytics-sess-bar" style="--sess-bar-h:${pct}%;--sess-bar-min-h:${c?2:0}px"></div>
      </div>
      <div class="proj-analytics-bar-label">${monthLabels[i]}</div>
    </div>`;
  }).join('');

  // ── 2. Ranking IAs más activas ──
  const aiRanks = projAIs.map(ai => ({ name: ai.name, count: getProjectSessions(projId).filter(s => s.aiId === ai.id).length }))
    .sort((a, b) => b.count - a.count);
  const maxR = aiRanks[0]?.count || 1;
  const rankHtml = aiRanks.map(r => `
    <div class="proj-ai-rank-row">
      <span class="proj-ai-rank-name">${esc(r.name)}</span>
      <div class="proj-ai-rank-bar-wrap"><div class="proj-ai-rank-bar" style="--rank-bar-pct:${(r.count/maxR*100).toFixed(1)}%"></div></div>
      <span class="proj-ai-rank-count">${r.count}</span>
    </div>`).join('');

  // ── 3. Racha del proyecto ──
  const daySet = new Set(allSess.map(s => sessionDateKey(s)).filter(Boolean));
  let streak = 0, bestStreak = 0, tempStreak = 0;
  const d = new Date();
  // Racha actual
  while (true) {
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (daySet.has(k)) { streak++; d.setDate(d.getDate()-1); }
    else if (streak === 0) { d.setDate(d.getDate()-1); if (d < new Date(now.getFullYear(), now.getMonth()-3, 1)) break; }
    else break;
  }
  // Mejor racha histórica
  const sortedDays = Array.from(daySet).sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { tempStreak = 1; }
    else {
      const prev = new Date(sortedDays[i-1]); prev.setDate(prev.getDate()+1);
      const cur = new Date(sortedDays[i]);
      tempStreak = prev.toDateString() === cur.toDateString() ? tempStreak+1 : 1;
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
  }

  section.innerHTML = `
    <div class="proj-analytics-block">
      <div class="proj-analytics-block-title">Sesiones por mes — ${esc(proj.name)} <span class="proj-analytics-range-label">${rangeLabel}</span></div>
      <div class="proj-analytics-bars-row">${barsHtml}</div>
    </div>
    <div class="proj-analytics-block">
      <div class="proj-analytics-block-title">IAs más activas</div>
      ${rankHtml || '<div class="pi-no-ac">Sin datos</div>'}
    </div>
    <div class="proj-analytics-block proj-analytics-block--flex">
      <div>
        <div class="proj-racha-value">${streak}</div>
        <div class="proj-racha-label">Racha actual (días)</div>
      </div>
      <div>
        <div class="proj-racha-value">${bestStreak}</div>
        <div class="proj-racha-label">Mejor racha (días)</div>
      </div>
      <div>
        <div class="proj-racha-value">${allSess.length}</div>
        <div class="proj-racha-label">Sesiones totales</div>
      </div>
    </div>
    <div class="proj-analytics-export-row">
      <button class="btn-export-analytics" onclick="downloadProjectReport('${projId}')">⬇️ Descargar reporte del proyecto</button>
    </div>`;
}

function downloadProjectReport(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const projSess = getProjectSessions(projId);
  const projAIIds = new Set(projSess.map(s => s.aiId).filter(Boolean));
  const projAIs = state.ais.filter(ai => projAIIds.has(ai.id) && !ai.archived);
  const allSess = projSess
    .map(s => ({ ai: getAI(s.aiId), s }))
    .filter(x => x.ai)
    .sort((a, b) => new Date(b.s.date||0) - new Date(a.s.date||0));

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', {year:'numeric',month:'2-digit',day:'2-digit'});
  let md = `# Reporte de proyecto — ${proj.name}
`;
  md += `Generado: ${dateStr} · ${projSess.length} sesiones · ${projAIs.length} IAs

`;
  md += `## IAs involucradas
`;
  projAIs.forEach(ai => { md += `- **${ai.name}**: ${projSess.filter(s => s.aiId === ai.id).length} sesiones
`; });
  md += `
## Sesiones
`;
  allSess.forEach(({ ai, s }) => {
    md += `
### ${s.title || '(sin título)'}
`;
    md += `**IA:** ${ai.name} · **Fecha:** ${s.date || '—'}
`;
    if (s.summary) md += `**Resumen:** ${s.summary}
`;
    if (s.pending) md += `**Pendiente:** ${s.pending}
`;
  });

  // T-202604-289: sección Decisiones
  const decisions = Array.isArray(proj.decisions) ? proj.decisions : [];
  if (decisions.length) {
    md += `\n## Decisiones\n\n`;
    md += `| Fecha | Autor | Decisión |\n|-------|-------|----------|\n`;
    [...decisions]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .forEach(d => {
        md += `| ${d.date || '—'} | ${d.author || '—'} | ${(d.text || '').replace(/\n/g, ' ')} |\n`;
      });
  }

  const blob = new Blob([md], {type:'text/markdown'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reporte-${(proj.name||'proyecto').replace(/\s+/g,'-').toLowerCase()}.md`;
  a.click(); URL.revokeObjectURL(a.href);
  showToast('success', 'Reporte descargado');
}

function toggleProjectSection(key) {
  // Mantenido por compatibilidad — T-078 ya no usa secciones colapsables
  if (!renderProject._collapsed) renderProject._collapsed = {};
  const body = document.getElementById('pbody-' + key);
  const arrow = document.getElementById('parrow-' + key);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open', isOpen);
  renderProject._collapsed[key] = isOpen;
}



// ── T-202604-048: Sub-tabs Templates ──

let currentSubTab = 'backlog';

// T-202604-108: tracking modificaciones Context en sesión activa
let _contextModifiedInSession = false;
let _contextSectionsTouched = []; // headers tocados esta sesión — para detección de conflicto

// T-202604-109: tracking modificaciones HTML-MAP en sesión activa
let _htmlMapModifiedInSession = false;
let _htmlMapModifiedTimer = null;

// T-202604-110: tracking modificaciones Backlog en sesión activa
let _backlogModifiedInSession = false;

function _updateSubTabButtons(sub) {
  const btnB = document.getElementById('btn-import-backlog');
  const btnE = document.getElementById('export-backlog-btn');
  const btnFull = document.getElementById('btn-export-backlog-full'); // R-202604-052: historial completo
  const btnNew = document.getElementById('btn-new-item');
  const btnM = document.getElementById('btn-import-htmlmap');
  const btnME = document.getElementById('btn-export-htmlmap');
  // T-202604-124 / T-202604-006: bootstrap único por proyecto
  const _backlogRaw = localStorage.getItem(_tplKey('backlog-items'));
  const backlogBootstrapped = !!_backlogRaw && (() => { try { return JSON.parse(_backlogRaw).length > 0; } catch { return false; } })();
  if (btnB) btnB.classList.add('hidden'); // R-202604-052: import manual eliminado
  if (btnE) btnE.classList.toggle('hidden', sub !== 'backlog');
  if (btnFull) btnFull.classList.toggle('hidden', sub !== 'backlog');
  if (btnNew) btnNew.classList.toggle('hidden', sub !== 'backlog');
  const undoRow = document.getElementById('tpl-undo-row');
  const btnUndo = document.getElementById('btn-undo-backlog');
  const btnRedo = document.getElementById('btn-redo-backlog');
  if (undoRow) undoRow.classList.toggle('hidden', sub !== 'backlog');
  if (btnUndo) btnUndo.classList.toggle('hidden', sub !== 'backlog');
  if (btnRedo) btnRedo.classList.toggle('hidden', sub !== 'backlog');
  if (sub === 'backlog' && typeof _updateUndoUI === 'function') _updateUndoUI();
  // T-202604-123 / T-202604-006: bootstrap único por proyecto
  const mapBootstrapped = !!localStorage.getItem(_tplKey('html-map-raw'));
  if (btnM) btnM.classList.toggle('hidden', !(sub === 'htmlmap' && !mapBootstrapped));
  if (btnME) {
    btnME.classList.toggle('hidden', sub !== 'htmlmap');
    const hasData = !!localStorage.getItem(_tplKey('html-map-raw'));
    btnME.disabled = !hasData;
    btnME.title = hasData ? 'Exportar MODULE-MAP.md' : 'Sin datos — importa primero';
  }
  // [tmp:map-generator] — botón Generar MAP visible siempre en sub htmlmap
  const btnGenMap = document.getElementById('btn-generate-map');
  if (btnGenMap) btnGenMap.classList.toggle('hidden', sub !== 'htmlmap');
  const btnIC = document.getElementById('btn-import-context');
  if (btnIC) btnIC.classList.add('hidden');
  const btnEC = document.getElementById('btn-export-context');
  if (btnEC) {
    const hasContext = !!localStorage.getItem(_tplKey('context-raw'));
    btnEC.classList.toggle('hidden', sub !== 'context');
    btnEC.disabled = !hasContext;
    btnEC.title = hasContext ? 'Exportar CONTEXT.md actualizado' : 'Sin datos — importa primero';
  }
  // Sidebar danger zone — show always, per-sub reset button visible
  const dangerZone = document.getElementById('tpl-sidebar-danger');
  if (dangerZone) dangerZone.classList.remove('hidden');
  const dbBacklog   = document.getElementById('sidebar-danger-btn-backlog');
  const dbHistorico = document.getElementById('sidebar-danger-btn-historico');
  const dbContext = document.getElementById('sidebar-danger-btn-context');
  const dbHtmlmap = document.getElementById('sidebar-danger-btn-htmlmap');
  const dbContratos = document.getElementById('sidebar-danger-btn-contratos');
  if (dbBacklog)    dbBacklog.classList.toggle('hidden', sub !== 'backlog');
  if (dbHistorico)  dbHistorico.classList.toggle('hidden', sub !== 'backlog');
  if (dbContext)    dbContext.classList.toggle('hidden', sub !== 'context');
  if (dbHtmlmap)    dbHtmlmap.classList.toggle('hidden', sub !== 'htmlmap');
  if (dbContratos)  dbContratos.classList.toggle('hidden', sub !== 'contratos');
  // Contratos — botones toolbar
  const btnExpContratos = document.getElementById('btn-export-contratos');
  if (btnExpContratos) {
    btnExpContratos.classList.toggle('hidden', sub !== 'contratos');
    const hasContratos = !!localStorage.getItem(_tplKey('contratos-data'));
    btnExpContratos.disabled = !hasContratos;
    btnExpContratos.title = hasContratos ? 'Exportar Contratos.md' : 'Sin contratos definidos aún';
  }
  // Collapse danger body when switching tabs
  const dangerBody = document.getElementById('tpl-danger-body');
  if (dangerBody) dangerBody.classList.remove('open');
  // sub-tab plan — no tiene botones de acción ni danger zone (read-only)
  if (sub === 'plan') {
    if (dangerZone) dangerZone.classList.add('hidden');
  }
  // Hide actions section label if no buttons visible
  const actionsSection = document.querySelector('.tpl-sidebar-actions');
  if (actionsSection) {
    const allItems = actionsSection.querySelectorAll('button, .tpl-action-row');
    const anyVisible = Array.from(allItems).some(el => !el.classList.contains('hidden'));
    actionsSection.classList.toggle('hidden', !anyVisible);
  }
}

function switchSubTab(sub) {
  currentSubTab = sub;
  ['backlog','htmlmap','context','plan','contratos'].forEach(s => {
    const btn = document.getElementById('sstab-btn-' + s);
    const panel = document.getElementById('sspanel-' + s);
    if (btn) btn.classList.toggle('active', s === sub);
    if (panel) panel.classList.toggle('active', s === sub);
  });
  _updateSubTabButtons(sub);
  _renderTplProjBanner();
  if (sub === 'htmlmap') { renderHtmlMap(); updateHtmlMapModificationBadge(); }
  if (sub === 'backlog') { loadBacklog(); renderBacklogList(); renderStats(); updateBacklogModificationBadge(); }
  if (sub === 'context') { renderContext(); }
  if (sub === 'plan') { if (typeof renderPlan === 'function') renderPlan(); }
  if (sub === 'contratos') { renderContratos(); }
  if (typeof renderAIStatusBar === 'function') renderAIStatusBar();
  _renderDocsOnboarding(); // T-202604-204
}

// T-202604-204: Checklist onboarding de documentos


function _docsOnboardingSteps() {
  const hasBacklog = !!localStorage.getItem(_tplKey('backlog-items')) &&
    (() => { try { return JSON.parse(localStorage.getItem(_tplKey('backlog-items'))).length > 0; } catch { return false; } })();
  const hasContext = !!localStorage.getItem(_tplKey('context-raw'));
  const hasMap     = !!localStorage.getItem(_tplKey('html-map-raw'));
  return [
    {
      title: 'Importar Backlog.md',
      hint: 'Sube el archivo Backlog.md del proyecto activo.',
      done: hasBacklog,
      action: () => { switchSubTab('backlog'); setTimeout(() => document.getElementById('backlog-file-input')?.click(), 80); }
    },
    {
      title: 'Importar CONTEXT.md',
      hint: 'Sube el archivo de contexto del proyecto.',
      done: hasContext,
      action: () => { switchSubTab('context'); setTimeout(() => document.getElementById('context-file-input')?.click(), 80); }
    },
    {
      title: 'Importar MODULE-MAP.md',
      hint: 'Sube el mapa de módulos del proyecto.',
      done: hasMap,
      action: () => { switchSubTab('htmlmap'); setTimeout(() => document.getElementById('htmlmap-file-input')?.click(), 80); }
    }
  ];
}

function _renderDocsOnboarding() {
  // Buscar el contenedor del sub-tab activo — insertar banner antes del contenido
  const panel = document.getElementById('sspanel-' + currentSubTab);
  if (!panel) return;

  // Si ya fue descartado → no mostrar nunca
  if (localStorage.getItem('onboarding-docs-seen') === '1') {
    const existing = document.getElementById('docs-onboarding-banner');
    if (existing) existing.remove();
    return;
  }

  const steps = _docsOnboardingSteps();
  const doneCount = steps.filter(s => s.done).length;

  // Si los 3 pasos están completos → colapsar y setear flag
  if (doneCount === 3) {
    _dismissDocsOnboarding();
    return;
  }

  // Crear o reusar el banner
  let banner = document.getElementById('docs-onboarding-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'docs-onboarding-banner';
    // Insertar al inicio del panel activo
    panel.insertBefore(banner, panel.firstChild);
  } else if (banner.parentNode !== panel) {
    panel.insertBefore(banner, panel.firstChild);
  }

  const stepsHtml = steps.map((s, i) => `
    <div class="docs-ob-step${s.done ? ' done' : ''}">
      <div class="docs-ob-num">${s.done ? '✓' : i + 1}</div>
      <div class="docs-ob-step-text">
        <div class="docs-ob-step-title">${s.title}</div>
        <div class="docs-ob-step-hint">${s.hint}</div>
        ${!s.done ? `<button class="docs-ob-step-action" onclick="_docsOnboardingAction(${i})">Hacer ahora →</button>` : ''}
      </div>
    </div>`).join('');

  banner.innerHTML = `
    <div class="docs-ob-header" onclick="this.parentElement.querySelector('.docs-ob-body').classList.toggle('hidden');this.querySelector('.docs-ob-progress').textContent=this.parentElement.querySelector('.docs-ob-body').classList.contains('hidden')?'▸':'▾'">
      <span class="docs-ob-icon">📋</span>
      <span class="docs-ob-title">Configura los documentos del proyecto</span>
      <span class="docs-ob-progress">${doneCount}/3 ▾</span>
      <button class="docs-ob-dismiss" onclick="event.stopPropagation();_dismissDocsOnboarding()" title="No mostrar de nuevo">✕</button>
    </div>
    <div class="docs-ob-body">${stepsHtml}</div>`;
}

function _docsOnboardingAction(idx) {
  const steps = _docsOnboardingSteps();
  const fn = steps[idx]?.action;
  if (fn) fn();
}

function _dismissDocsOnboarding() {
  localStorage.setItem('onboarding-docs-seen', '1');
  const banner = document.getElementById('docs-onboarding-banner');
  if (banner) {
    banner.classList.add('collapsed');
    setTimeout(() => banner.remove(), 350);
  }
}

// T-202604-006: Banner proyecto activo en Templates
function _renderTplProjBanner() {
  const banner = document.getElementById('tpl-proj-banner');
  if (!banner) return;
  const proj = getActiveProject();
  if (!proj) { banner.classList.add('d-none'); banner.classList.remove('d-flex'); return; }
  banner.classList.remove('d-none'); banner.classList.add('d-flex');
  const icon = document.getElementById('tpl-proj-icon');
  const name = document.getElementById('tpl-proj-name');
  if (icon) icon.textContent = proj.icon || '📁';
  if (name) name.textContent = proj.name;
}

// T-202604-006: Render Tracker del proyecto activo en sub-panel Templates


let HTML_MAP_SECTIONS = [];
let htmlMapFilter = 'all';

function importHtmlMap(event) {
  // R-202605-137: acepta JSON (nuevo) o Markdown (legado read-only)
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const isJson = _isMapJson(text);
    const sections = isJson ? _parseMapJson(text) : parseHtmlMapMd(text);
    if (isJson && sections === null) {
      showToast('error', 'MAP JSON inválido — verifica el formato del archivo');
      return;
    }
    HTML_MAP_SECTIONS = sections;
    localStorage.setItem(_tplKey('html-map-raw'), text);
    localStorage.setItem(_tplKey('html-map-sections'), JSON.stringify(sections));
    // Meta
    let version = '—';
    let fileName = file.name;
    if (isJson) {
      try { const obj = JSON.parse(_extractMapJson(text)); version = obj.version || '—'; fileName = obj.project ? `${obj.project}-MAP_${version}` : file.name; } catch(e) {}
    } else {
      const vm = text.match(/Versión:\s*([\d.]+)/); if (vm) version = vm[1];
      const fm = text.match(/^#\s+(.+)/m); if (fm) fileName = fm[1].trim();
    }
    const meta = {
      file: fileName,
      version,
      importedAt: new Date().toLocaleString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
      total: sections.length,
      format: isJson ? 'json' : 'markdown'
    };
    localStorage.setItem(_tplKey('html-map-meta'), JSON.stringify(meta));
    updateHtmlMapBanner();
    updateHtmlMapModificationBadge();
    renderHtmlMap();
    _setHtmlMapModified();
    _blogLog('importado', meta.file, `v${meta.version} · ${sections.length} secciones${isJson ? ' (JSON)' : ''}`, 'htmlmap');
    _updateDocLogCount('htmlmap');
    document.getElementById('htmlmap-filter-bar').classList.remove('hidden');
    showToast('success', `Module Map importado — ${sections.length} secciones`);
  };
  reader.readAsText(file);
  event.target.value = '';
}

// R-202605-137: detectar si el texto es un MAP en formato JSON
function _isMapJson(text) {
  if (!text || !text.trim()) return false;
  const raw = _extractMapJson(text);
  if (!raw) return false;
  try {
    const obj = JSON.parse(raw);
    return typeof obj === 'object' && obj !== null && Array.isArray(obj.files);
  } catch(e) { return false; }
}

// R-202605-137: extraer JSON crudo del bloque ```json ... ``` o del texto directo
function _extractMapJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  const t = text.trim();
  if (t.startsWith('{')) return t;
  return null;
}

// R-202605-137: parsear MAP JSON al schema {type, file, name, line, area} que usa renderHtmlMap
function _parseMapJson(text) {
  const raw = _extractMapJson(text);
  if (!raw) return null;
  let obj;
  try { obj = JSON.parse(raw); } catch(e) { return null; }
  if (!Array.isArray(obj.files)) return null;
  const sections = [];
  obj.files.forEach(f => {
    const ext = (f.type || f.name.split('.').pop() || 'js').toLowerCase();
    (f.functions || []).forEach(fn => {
      sections.push({
        type: ext,
        file: f.name,
        name: fn.name || '',
        line: fn.line != null ? String(fn.line) : '',
        area: fn.area || '',
        comment: fn.area || '',
        lines: fn.line != null ? String(fn.line) : ''
      });
    });
  });
  return sections;
}

// R-202605-137: Markdown legacy — read-only, sin cambios al parser original
function parseHtmlMapMd(text) {
  const sections = [];
  const lines = text.split('\n');
  // Formato modular v3: headers H2 = archivos, tablas = funciones con Línea/Función/Área
  // Formato legacy: ## CSS / ## HTML / ## JS + tablas planas
  let currentFile = null;
  let currentType = null;
  // Detectar si es formato modular (tiene headers con nombres de archivo)
  const isModular = /##\s+\S+\.(js|css|html)\b/i.test(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      const header = line.slice(3).trim();
      if (isModular) {
        const fileMatch = header.match(/^(\S+\.(js|css|html))/i);
        if (fileMatch) {
          currentFile = fileMatch[1];
          currentType = fileMatch[2].toLowerCase();
        } else {
          currentFile = null;
        }
      } else {
        if (/CSS/i.test(header)) { currentType = 'css'; currentFile = null; }
        else if (/HTML/i.test(header)) { currentType = 'html'; currentFile = null; }
        else if (/JS/i.test(header)) { currentType = 'js'; currentFile = null; }
        else { currentFile = null; }
      }
      continue;
    }
    if (!line.startsWith('|')) continue;
    if (/^\|\s*[-:]+/.test(line)) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 2) continue;
    const firstCol = cols[0].toLowerCase();
    if (['sección','elemento','section','línea','linea','líneas','función','funcion','function','line'].includes(firstCol)) continue;
    if (cols[0].startsWith('---') || cols[0].startsWith('===')) continue;

    if (isModular && currentFile) {
      const lineNum = cols[0];
      const fnName = cols[1] || '';
      const area = cols[2] || '';
      sections.push({
        type: currentType || 'js',
        file: currentFile,
        name: fnName,
        line: lineNum,
        area: area,
        comment: area,
        lines: lineNum
      });
    } else {
      sections.push({
        type: currentType || 'js',
        file: null,
        name: cols[0],
        line: cols[2] || '',
        area: '',
        comment: cols[1] || '',
        lines: cols[2] || ''
      });
    }
  }
  return sections;
}

function loadHtmlMap() {
  const stored = localStorage.getItem(_tplKey('html-map-sections'));
  if (stored) { try { HTML_MAP_SECTIONS = JSON.parse(stored); } catch { HTML_MAP_SECTIONS = []; } } else { HTML_MAP_SECTIONS = []; }
}

// ── B-202605-514: _getMapContent() — retorna string del MAP con versión aplicada ──
// Retorna null si no hay datos en localStorage.
// exportHtmlMapMd() y _mgExportAllZip() consumen esta función.
function _getMapContent(ver) {
  const raw = localStorage.getItem(_tplKey('html-map-raw'));
  if (!raw) return null;
  const resolvedVer = ver || (typeof _effectiveVersion !== 'undefined' && _effectiveVersion
    ? _effectiveVersion
    : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v0'));
  const isJson = (typeof _isMapJson === 'function') ? _isMapJson(raw) : false;
  let updated = raw;
  if (isJson) {
    try {
      const jsonRaw = (typeof _extractMapJson === 'function') ? _extractMapJson(raw) : raw;
      const obj = JSON.parse(jsonRaw);
      obj.version = resolvedVer;
      const newJson = JSON.stringify(obj, null, 2);
      updated = raw.includes('```json')
        ? raw.replace(/```json\s*[\s\S]*?\s*```/, '```json\n' + newJson + '\n```')
        : newJson;
    } catch(e) { /* T-202605-516: JSON inválido — _getMapContent() retorna raw sin modificar */ }
  } else {
    updated = raw.replace(/Versi[oó]n:\s*[\d.]+/, `Versión: ${resolvedVer}`);
  }
  return updated;
}

// ── T-103 / T-202604-123: Exportar HTML-MAP con versión editable ──
function exportHtmlMapMd() {
  const raw = localStorage.getItem(_tplKey('html-map-raw'));
  if (!raw) { showToast('warning', 'Sin datos — importa primero'); return; }
  const overlay = document.getElementById('htmlmap-export-overlay');
  if (!overlay) return;
  const _hmVer = (typeof _effectiveVersion !== 'undefined' && _effectiveVersion)
    ? _effectiveVersion
    : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v0');
  const isJson = _isMapJson(raw);
  const ext = isJson ? 'json' : 'md';
  const versionInput = document.getElementById('hmexport-version-input');
  const preview = document.getElementById('hmexport-filename-preview');
  if (versionInput) versionInput.value = _hmVer;
  if (preview) preview.textContent = `${_docPrefix()}-MAP_${_hmVer}.${ext}`;
  overlay.classList.add('open');
  const btn = document.getElementById('hmexport-confirm-btn');
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      const ver = document.getElementById('hmexport-version-input').value.trim() || _hmVer;
      // B-202605-514: usar _getMapContent() — lógica de versioning centralizada
      const updated = _getMapContent(ver) || raw;
      overlay.classList.remove('open');
      _clearHtmlMapModifiedBadge();
      const fname = `${_docPrefix()}-MAP_${ver}.${ext}`;
      const mtype = isJson ? 'application/json' : 'text/markdown';
      const b = new Blob([updated], { type: mtype });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = fname;
      a.click(); URL.revokeObjectURL(u);
      _blogLog('exportado', fname, '', 'htmlmap');
      _updateDocLogCount('htmlmap');
      showToast('download', `${fname} exportado`);
    });
  }
}

// ── T-202604-102: Context vivo — import/store/export ──

// R-202605-136: detectar si el texto es JSON de CONTEXT (no Markdown)
function _isContextJson(text) {
  if (!text || !text.trim()) return false;
  try {
    const o = JSON.parse(text.trim());
    return typeof o === 'object' && o !== null && 'version' in o;
  } catch(e) { return false; }
}

// R-202605-136: parsear CONTEXT en formato JSON a estructura de secciones para renderContext
function parseContextJson(text) {
  let obj;
  try { obj = JSON.parse(text.trim()); }
  catch(e) { return { version: '—', sections: [], raw: text, isJson: true, error: e.message }; }

  const version = obj.version || '—';
  const sections = [];

  // Stack
  if (Array.isArray(obj.stack) && obj.stack.length) {
    const rows = obj.stack.map(s => `| ${s.layer||''} | ${s.tech||''} |`).join('\n');
    sections.push({ name: 'Stack', content: `| Capa | Tecnología |\n|------|------------|\n${rows}` });
  }

  // Estado / sprint
  if (obj.sprints) {
    const sp = obj.sprints;
    const sprintLines = [
      sp.active       ? `Sprint activo: ${sp.active}`              : null,
      sp.goal         ? `Goal: ${sp.goal}`                         : null,
      sp.version_target ? `Version target: ${sp.version_target}`   : null,
      sp.release_type ? `Release type: ${sp.release_type}`         : null
    ].filter(Boolean);
    sections.push({ name: 'Estado actual', content: sprintLines.join('\n') });
  }

  // Contadores
  if (obj.counters) {
    const c = obj.counters;
    sections.push({ name: 'Contadores', content: `P=${c.P||0} · T=${c.T||0} · R=${c.R||0} · B=${c.B||0}` });
  }

  // Decisiones técnicas
  if (Array.isArray(obj.decisions) && obj.decisions.length) {
    const rows = obj.decisions.map(d => `| ${d.date||'—'} | ${(d.text||'').replace(/\|/g,'\\|')} |`).join('\n');
    sections.push({ name: 'Decisiones técnicas registradas', content: `| Fecha | Decisión |\n|-------|----------|\n${rows}` });
  } else {
    sections.push({ name: 'Decisiones técnicas registradas', content: '_Sin decisiones técnicas registradas._' });
  }

  // Gaps
  if (Array.isArray(obj.gaps) && obj.gaps.length) {
    const rows = obj.gaps.map(g => `| ${g.code||'—'} | ${(g.title||'').replace(/\|/g,'\\|')} | ${g.priority||'—'} |`).join('\n');
    sections.push({ name: 'Gaps / pendientes sprint activo', content: `| Código | Título | Priority |\n|--------|--------|----------|\n${rows}` });
  } else {
    sections.push({ name: 'Gaps / pendientes sprint activo', content: '_Sin ítems pendientes en el sprint activo._' });
  }

  // Notas / Memoria operativa
  if (obj.notes && obj.notes.trim()) {
    sections.push({ name: 'Notas / Memoria operativa', content: obj.notes });
  }

  return { version, sections, raw: text, isJson: true };
}

function parseContextMd(text) {
  // Extrae versión y secciones del CONTEXT.md — read-only para CONTEXTs históricos en Markdown
  const versionMatch = text.match(/[Vv]ersi[oó]n:\s*([\d.]+)/);
  const version = versionMatch ? versionMatch[1] : '—';
  
  // Parsear secciones (por ## Nombre)
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push({
          name: currentSection,
          content: currentContent.join('\n').trim()
        });
      }
      currentSection = line.slice(3).trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    sections.push({
      name: currentSection,
      content: currentContent.join('\n').trim()
    });
  }
  
  return { version, sections, raw: text };
}

function importContextMd() {
  // Legacy stub — redirige al file picker (textarea eliminado)
  document.getElementById('context-file-input')?.click();
}

function _importContextMdFromText(text) {
  if (!text || !text.trim()) { showToast('warning', '⚠ Archivo vacío o inválido'); return; }

  // R-202605-136: detectar formato JSON vs Markdown
  const looksJson = text.trim().startsWith('{');
  let parsed;
  if (looksJson) {
    // Validar JSON explícitamente antes de proceder
    try { JSON.parse(text.trim()); }
    catch(e) {
      showToast('error', `✗ JSON inválido: ${e.message}`);
      return;
    }
    parsed = parseContextJson(text);
  } else {
    parsed = parseContextMd(text);
  }

  const now = new Date().toLocaleString('es-MX', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });

  const meta = {
    version: parsed.version,
    importedAt: now,
    sectionCount: parsed.sections.length,
    lastModified: null,
    format: parsed.isJson ? 'json' : 'markdown'
  };
  localStorage.setItem(_tplKey('context-raw'), text);
  localStorage.setItem(_tplKey('context-meta'), JSON.stringify(meta));
  localStorage.setItem(_tplKey('context-sections'), JSON.stringify(parsed.sections));
  renderContext();
  _updateSubTabButtons('context');
  _blogLog('importado', `v${parsed.version}`, `${parsed.sections.length} secciones`, 'context');
  _updateDocLogCount('context');
  const fmtLabel = parsed.isJson ? ' · JSON' : '';
  showToast('success', `✓ CONTEXT v${parsed.version} importado (${parsed.sections.length} secciones${fmtLabel})`);
}

function updateContextBanner() {
  const meta = JSON.parse(localStorage.getItem(_tplKey('context-meta')) || '{}');
  const vEl = document.getElementById('cmeta-version');
  const iEl = document.getElementById('cmeta-imported');
  const cEl = document.getElementById('cmeta-section-count');
  const fEl = document.getElementById('cmeta-format'); // opcional — graceful si no existe
  if (vEl) vEl.textContent = meta.version ? 'v' + meta.version : '—';
  if (iEl) iEl.textContent = meta.importedAt || '—';
  if (cEl) {
    const n = meta.sectionCount || 0;
    cEl.textContent = n ? n + ' secciones' : '';
  }
  if (fEl) fEl.textContent = meta.format ? meta.format.toUpperCase() : '';
}

// renderContextStatus — legacy stub (llamado desde código externo)
function renderContextStatus() { renderContext(); }

function _importContextMdFromFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => _importContextMdFromText(e.target.result);
  reader.readAsText(file);
}

// Handler unificado para dropzones — context, htmlmap, backlog
function _dropzoneHandle(event, doc) {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  if (doc === 'context') {
    const reader = new FileReader();
    reader.onload = e => _importContextMdFromText(e.target.result);
    reader.readAsText(file);
  } else if (doc === 'htmlmap') {
    importHtmlMap({ target: { files: [file], value: '' } });
  } else if (doc === 'backlog') {
    importBacklog({ target: { files: [file], value: '' } });
  }
}

// T-202604-108: marcar context como modificado en sesión + badge en sub-tab btn
function _setContextModified() {
  _contextModifiedInSession = true;
  const btn = document.getElementById('sstab-btn-context');
  if (btn && !btn.querySelector('.sstab-modified-dot')) {
    const dot = document.createElement('span');
    dot.className = 'sstab-modified-dot';
    dot.title = 'Context modificado en esta sesión';
    btn.appendChild(dot);
  }
  // Actualizar campo "Modificado" en banner
  const modSep = document.getElementById('cmeta-mod-sep');
  const modLabel = document.getElementById('cmeta-mod-label');
  const modVal = document.getElementById('cmeta-mod-val');
  const now = new Date().toLocaleString('es-MX', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  if (modSep) modSep.classList.remove('hidden');
  if (modLabel) modLabel.classList.remove('hidden');
  if (modVal) { modVal.classList.remove('hidden'); modVal.textContent = now; }
}

function _clearContextModifiedBadge() {
  const btn = document.getElementById('sstab-btn-context');
  if (btn) { const dot = btn.querySelector('.sstab-modified-dot'); if (dot) dot.remove(); }
  const modSep = document.getElementById('cmeta-mod-sep');
  const modLabel = document.getElementById('cmeta-mod-label');
  const modVal = document.getElementById('cmeta-mod-val');
  if (modSep) modSep.classList.add('hidden');
  if (modLabel) modLabel.classList.add('hidden');
  if (modVal) modVal.classList.add('hidden');
}

// T-202604-109: badge HTML-MAP modificado en sesión
function _setHtmlMapModified() {
  _htmlMapModifiedInSession = true;
  const btn = document.getElementById('sstab-btn-htmlmap');
  if (btn && !btn.querySelector('.sstab-modified-dot')) {
    const dot = document.createElement('span');
    dot.className = 'sstab-modified-dot';
    dot.title = 'Module Map modificado en esta sesión';
    btn.appendChild(dot);
  }
  // T-202604-109: Mostrar badge de actualización en el panel
  updateHtmlMapModificationBadge();
  // B-202604-118: auto-dismiss del badge después de 8s
  clearTimeout(_htmlMapModifiedTimer);
  _htmlMapModifiedTimer = setTimeout(() => _clearHtmlMapModifiedBadge(), 8000);
}

// B-202604-118: ocultar badge MAP-SECTION sin limpiar el flag de sesión
function _clearHtmlMapModifiedBadge() {
  clearTimeout(_htmlMapModifiedTimer);
  _htmlMapModifiedTimer = null;
  const modSep = document.getElementById('hmeta-mod-sep');
  const modLabel = document.getElementById('hmeta-mod-label');
  const modVal = document.getElementById('hmeta-mod-val');
  if (modSep) modSep.classList.add('hidden');
  if (modLabel) modLabel.classList.add('hidden');
  if (modVal) modVal.classList.add('hidden');
}

function updateHtmlMapModificationBadge() {
  const meta = JSON.parse(localStorage.getItem('html-map-meta') || '{}');
  const htmlmapMeta = document.getElementById('htmlmap-meta-banner');
  if (!htmlmapMeta) return;
  
  const modSep = document.getElementById('hmeta-mod-sep');
  const modLabel = document.getElementById('hmeta-mod-label');
  const modVal = document.getElementById('hmeta-mod-val');
  
  if (_htmlMapModifiedInSession && meta.version) {
    const now = new Date().toLocaleString('es-MX', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    if (modSep) modSep.classList.remove('hidden');
    if (modLabel) modLabel.classList.remove('hidden');
    if (modVal) { modVal.classList.remove('hidden'); modVal.textContent = now; }
  }
}

// T-202604-110: badge Backlog modificado en sesión
function _setBacklogModified() {
  _backlogModifiedInSession = true;
  const btn = document.getElementById('sstab-btn-backlog');
  if (btn && !btn.querySelector('.sstab-modified-dot')) {
    const dot = document.createElement('span');
    dot.className = 'sstab-modified-dot';
    dot.title = 'Backlog modificado en esta sesión';
    btn.appendChild(dot);
  }
  // T-202604-110: Mostrar badge de actualización en el panel
  updateBacklogModificationBadge();
}

function updateBacklogModificationBadge() {
  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const backlogMeta = document.getElementById('backlog-meta-banner');
  if (!backlogMeta) return;
  
  const modSep = document.getElementById('bmeta-mod-sep');
  const modVal = document.getElementById('bmeta-mod-val');
  
  if (_backlogModifiedInSession && meta.version) {
    const now = new Date().toLocaleString('es-MX', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    if (modSep) modSep.classList.remove('hidden');
    if (modVal) { modVal.classList.remove('hidden'); modVal.textContent = '✎ ' + now; }
  }
}

// T-202604-108: extraer bloques CONTEXT-SECTION del texto pegado
function extractContextSections(text) {
  const sections = [];
  // AC-3: solo procesar secciones dentro del bloque CHECKPOINT
  const ckptMatch = text.match(/---CHECKPOINT---([\s\S]*?)---FIN-CHECKPOINT---/);
  const scope = ckptMatch ? ckptMatch[1] : '';
  if (!scope) return sections;
  // Regex: CONTEXT-SECTION: <contenido> CONTEXT-SECTION-END
  const re = /CONTEXT-SECTION:\s*([\s\S]*?)CONTEXT-SECTION-END/g;
  let m;
  while ((m = re.exec(scope)) !== null) {
    const block = m[1].trim();
    // El header ## es la primera línea del bloque
    const headerMatch = block.match(/^(##[^\n]+)/);
    if (!headerMatch) continue;
    const header = headerMatch[1].trim();
    const content = block; // incluye el header
    sections.push({ header, content });
  }
  return sections;
}

// T-202604-108: merge de secciones al Context raw almacenado
function mergeContextSections(sections, projId) {
  if (!sections.length) return;
  const _ctxKey = base => projId ? _projKey(base, projId) : _tplKey(base);
  let raw = localStorage.getItem(_ctxKey('context-raw')) || '';

  // Detección de conflicto: sección ya tocada en esta sesión
  const conflicts = sections.filter(s => _contextSectionsTouched.includes(s.header));
  if (conflicts.length) {
    const conflictArea = document.getElementById('context-conflict-area');
    if (conflictArea) {
      const names = conflicts.map(c => `<code>${esc(c.header)}</code>`).join(', ');
      conflictArea.innerHTML = `
        <div class="context-conflict-banner">
          ⚠ Conflicto — ${names} ya fue modificada en esta sesión.
          <button onclick="this.closest('.context-conflict-banner').remove()">Ignorar</button>
        </div>`;
    }
    showToast('warning', '⚠ Conflicto de sección — revisa el banner en Context');
    return;
  }

  // Aplicar cada sección
  sections.forEach(({ header, content }) => {
    _contextSectionsTouched.push(header);
    const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sectionRe = new RegExp(`(${escapedHeader}[\\s\\S]*?)(?=\\n## |$)`);
    if (sectionRe.test(raw)) {
      raw = raw.replace(sectionRe, content);
    } else {
      raw = raw.trimEnd() + '\n\n' + content;
    }
  });

  const meta = JSON.parse(localStorage.getItem(_ctxKey('context-meta')) || '{}');
  const vMatch = sections.map(s => s.content).join('\n').match(/[Vv]ersi[oó]n:\s*([\d.]+)/);
  if (vMatch) meta.version = vMatch[1];

  localStorage.setItem(_ctxKey('context-raw'), raw);
  localStorage.setItem(_ctxKey('context-meta'), JSON.stringify(meta));
  _setContextModified();
  _blogLog('sección mergeada', '', `${sections.length} sección(es)`, 'context');
  _updateDocLogCount('context');
  saveContextDocs();
  updateContextBanner();
  if (currentSubTab === 'context') renderContext();
  showToast('success', `✓ Context actualizado — ${sections.length} sección(es) mergeada(s)`);
}

// extraer bloques MAP-SECTION del texto pegado
function extractHtmlMapSections(text) {
  const sections = [];
  // AC-3: solo procesar secciones dentro del bloque CHECKPOINT
  const ckptMatch = text.match(/---CHECKPOINT---([\s\S]*?)---FIN-CHECKPOINT---/);
  const scope = ckptMatch ? ckptMatch[1] : '';
  if (!scope) return sections;
  const re = /MAP-SECTION:\s*([\s\S]*?)MAP-SECTION-END/g;
  let m;
  while ((m = re.exec(scope)) !== null) {
    const block = m[1].trim();
    const headerMatch = block.match(/^(##[^\n]+)/);
    if (!headerMatch) continue;
    const header = headerMatch[1].trim();
    sections.push({ header, content: block });
  }
  return sections;
}

// merge de secciones MAP-SECTION al HTML-MAP raw almacenado
function mergeHtmlMapSections(sections, projId) {
  if (!sections.length) return;
  const _mapKey = base => projId ? _projKey(base, projId) : _tplKey(base);
  let raw = localStorage.getItem(_mapKey('html-map-raw')) || '';
  if (!raw) {
    showToast('warning', '⚠ Module Map no importado — secciones MAP-SECTION ignoradas');
    return;
  }
  sections.forEach(({ header, content }) => {
    const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sectionRe = new RegExp(`(${escapedHeader}[\\s\\S]*?)(?=\\n## |$)`);
    if (sectionRe.test(raw)) {
      raw = raw.replace(sectionRe, content);
    } else {
      raw = raw.trimEnd() + '\n\n' + content;
    }
  });
  // Re-parsear secciones navegables
  const parsed = parseHtmlMapMd(raw);
  HTML_MAP_SECTIONS = parsed;
  localStorage.setItem(_mapKey('html-map-raw'), raw);
  localStorage.setItem(_mapKey('html-map-sections'), JSON.stringify(parsed));
  _setHtmlMapModified();
  _blogLog('sección mergeada', '', `${sections.length} sección(es)`, 'htmlmap');
  _updateDocLogCount('htmlmap');
  if (currentSubTab === 'htmlmap') renderHtmlMap();
  showToast('success', `✓ Module Map actualizado — ${sections.length} sección(es) mergeada(s)`);
}

// T-202604-108: renderContext — two states: empty / loaded
function renderContext() {
  const emptyEl = document.getElementById('context-empty-state');
  const loadedEl = document.getElementById('context-loaded-state');
  if (!emptyEl || !loadedEl) return;

  const raw = localStorage.getItem(_tplKey('context-raw'));
  const hasData = !!raw;

  emptyEl.classList.toggle('hidden', hasData);
  loadedEl.classList.toggle('hidden', !hasData);

  if (!hasData) return;

  // Actualizar banner
  updateContextBanner();

  let sections;
  if (_isContextJson(raw)) {
    // R-202605-136: formato JSON — convertir a {title, lines} para _renderContextSections
    const parsed = parseContextJson(raw);
    sections = parsed.sections.map(s => ({
      title: s.name,
      lines: (s.content || '').split('\n')
    }));
  } else {
    // Markdown legacy — read-only: parsear por ## headers
    const lines = raw.split('\n');
    sections = [];
    let current = null;
    for (const line of lines) {
      if (/^## /.test(line)) {
        if (current) sections.push(current);
        current = { title: line.replace(/^## /, '').trim(), lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    }
    if (current) sections.push(current);
  }

  _ctxSections = sections; // cache para búsqueda
  _renderContextSections(sections, '');
}

// Cache interno de secciones para búsqueda sin re-parsear
let _ctxSections = [];

function _renderContextSections(sections, query) {
  const el = document.getElementById('context-content');
  if (!el) return;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sections.filter(s => s.title.toLowerCase().includes(q) || s.lines.join('\n').toLowerCase().includes(q))
    : sections;

  if (!filtered.length) {
    el.innerHTML = `<div class="ctx-search-empty">Sin resultados para "<strong>${esc(q)}</strong>"</div>`;
    return;
  }

  let html = '';
  filtered.forEach((sec, idx) => {
    const bodyMd = sec.lines.join('\n').trim();
    const bodyHtml = renderContextMd(bodyMd);
    // Secciones modificadas por CHECKPOINT en esta sesión — resaltar
    const isTouched = _contextSectionsTouched.includes('## ' + sec.title);
    const touchedClass = isTouched ? ' ctx-sec-touched' : '';
    const touchedBadge = isTouched ? '<span class="ctx-touched-badge">✎ actualizado</span>' : '';
    // Primera sección abierta por defecto (solo sin query)
    const openClass = (!q && idx === 0) ? ' open' : (q ? ' open' : '');
    html += `
      <div class="context-section${openClass}${touchedClass}" id="ctx-sec-${idx}">
        <div class="context-section-header" onclick="toggleContextSection(${idx})">
          <span class="context-section-title">${esc(sec.title)}</span>
          ${touchedBadge}
          <span class="context-section-toggle">▾</span>
        </div>
        <div class="context-section-body">${bodyHtml}</div>
      </div>`;
  });
  el.innerHTML = html;
}

function onContextSearch() {
  const input = document.getElementById('ctx-search-input');
  const clear = document.getElementById('ctx-search-clear');
  const q = input ? input.value : '';
  if (clear) clear.classList.toggle('hidden', !q);
  _renderContextSections(_ctxSections, q);
}

function clearContextSearch() {
  const input = document.getElementById('ctx-search-input');
  const clear = document.getElementById('ctx-search-clear');
  if (input) input.value = '';
  if (clear) clear.classList.add('hidden');
  _renderContextSections(_ctxSections, '');
}

function contextShowImport() {
  const emptyEl = document.getElementById('context-empty-state');
  const loadedEl = document.getElementById('context-loaded-state');
  if (emptyEl) emptyEl.classList.remove('hidden');
  if (loadedEl) loadedEl.classList.add('hidden');
}

function toggleContextSection(idx) {
  const el = document.getElementById('ctx-sec-' + idx);
  if (el) el.classList.toggle('open');
}

// Render básico de Markdown a HTML para el body de secciones Context
function renderContextMd(md) {
  if (!md) return '';
  let html = '';
  const lines = md.split('\n');
  let inCode = false;
  let codeBuf = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return '';
    let t = '<table>';
    tableRows.forEach((row, i) => {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (i === 0) {
        t += '<tr>' + cells.map(c => `<th>${renderContextInline(c)}</th>`).join('') + '</tr>';
      } else if (/^[-:| ]+$/.test(row.replace(/\|/g, ''))) {
        // separador — skip
      } else {
        t += '<tr>' + cells.map(c => `<td>${renderContextInline(c)}</td>`).join('') + '</tr>';
      }
    });
    t += '</table>';
    tableRows = [];
    return t;
  };

  for (const line of lines) {
    // Bloques de código
    if (line.startsWith('```')) {
      if (inCode) {
        html += `<pre>${esc(codeBuf.join('\n'))}</pre>`;
        codeBuf = []; inCode = false;
      } else { inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // Tablas
    if (line.startsWith('|')) {
      if (inTable) { tableRows.push(line); }
      else { inTable = true; tableRows = [line]; }
      continue;
    } else if (inTable) {
      html += flushTable(); inTable = false;
    }

    // h3
    if (/^### /.test(line)) { html += `<h3>${esc(line.replace(/^### /, ''))}</h3>`; continue; }
    // listas
    if (/^[-*] /.test(line)) { html += `<li>${renderContextInline(line.replace(/^[-*] /, ''))}</li>`; continue; }
    if (/^\d+\. /.test(line)) { html += `<li>${renderContextInline(line.replace(/^\d+\. /, ''))}</li>`; continue; }
    // párrafo
    if (line.trim()) { html += `<p>${renderContextInline(line)}</p>`; continue; }
  }
  if (inCode) html += `<pre>${esc(codeBuf.join('\n'))}</pre>`;
  if (inTable) html += flushTable();
  return html;
}

function renderContextInline(text) {
  // bold, inline code, escaped
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// ── Context panel CSS ──


// ── Analytics v2 — estilos inyectados ──


// ════════════════════════════════════════════════════════════════════
// R-202604-076 · Bloque ---PLAN--- · Sub-tab Plan en Documentos
// ════════════════════════════════════════════════════════════════════

// Storage key para planes por proyecto
function _planKey(projId) { return `ai-tracker-plan-${projId}`; }

// R-202605-120: savePlan — localStorage inmediato + Supabase async (tracker_docs, key plan-{suffix})
// El objeto plan se envuelve en { data, _savedAt } para comparación de timestamps en _loadFromSupabase
function savePlan(projId, plan) {
  // localStorage inmediato
  const payload = { data: plan, _savedAt: Date.now() };
  try { localStorage.setItem(_planKey(projId), JSON.stringify(payload)); } catch(e) {}

  // Supabase async — no bloquea el caller
  if (typeof _supabase !== 'undefined' && _supabase &&
      typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    const suffix = '-' + projId;
    const nowIso = new Date().toISOString();
    _supabase.from('tracker_docs').upsert(
      [{ user_id: _supabaseUser.id, key: 'plan' + suffix, value: payload, updated_at: nowIso }],
      { onConflict: 'user_id,key' }
    ).then(({ error }) => {
      if (error) {
        console.warn('[AI Tracker] savePlan Supabase failed:', error);
        if (typeof _offlineQueuePush === 'function') _offlineQueuePush({ type: 'plan', projId });
      }
    });
  }
}

// R-202605-120: loadPlan — lee desde localStorage (caché)
// La hidratación desde Supabase ocurre en _loadFromSupabase() paso 6
function loadPlan(projId) {
  try {
    const raw = localStorage.getItem(_planKey(projId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Soporte legacy: si el valor es array directo (antes de R-202605-120) — devolver tal cual
    // Si es el nuevo wrapper { data, _savedAt } — devolver solo data
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.data !== undefined)
      ? parsed.data
      : parsed;
  } catch(e) { return null; }
}

// T-202605-510: leer _savedAt del wrapper sin exponer data al caller
function _planSavedAt(projId) {
  try {
    const raw = localStorage.getItem(_planKey(projId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed._savedAt)
      ? parsed._savedAt
      : null;
  } catch(e) { return null; }
}

// T-202605-509: helpers para toggle colapso zona --done
const _PLAN_ZONE_DONE_KEY = 'locus-plan-zone-done-collapsed';

function _planZoneDoneCollapsed() {
  try {
    const val = localStorage.getItem(_PLAN_ZONE_DONE_KEY);
    if (val === null) return false;
    const parsed = JSON.parse(val);
    return parsed === true || parsed === false ? parsed : false;
  } catch(e) { return false; }
}

function togglePlanZoneDone() {
  const next = !_planZoneDoneCollapsed();
  try { localStorage.setItem(_PLAN_ZONE_DONE_KEY, JSON.stringify(next)); } catch(e) {}
  const row = document.querySelector('.plan-zone--done .plan-sessions-row');
  const btn = document.querySelector('.plan-zone--done .plan-zone-toggle');
  if (row) { row.classList.toggle('is-hidden', next); }
  if (btn) {
    btn.innerHTML        = next ? '&#x25b2;' : '&#x25be;';
    btn.title            = next ? 'Expandir' : 'Colapsar';
    btn.setAttribute('aria-label', next ? 'Expandir completadas' : 'Colapsar completadas');
  }
}

// Renderizar el sub-tab Plan para el proyecto activo
// R-202604-085 + R-B: dos scopes diferenciados — sesion (superior) y sprint (inferior)
// Backward compatible: planes legacy (sin campo scope) se muestran en sección sprint
function renderPlan() {
  const panel = document.getElementById('sspanel-plan');
  if (!panel) return;

  const proj = getActiveProject();
  if (!proj) {
    panel.innerHTML = `<div class="plan-empty">Selecciona un proyecto para ver su plan.</div>`;
    return;
  }

  const sprints = loadPlan(proj.id);
  if (!sprints || !sprints.length) {
    panel.innerHTML = `<div class="plan-empty">Sin plan activo — pega un CHECKPOINT con bloque <code>---EXECUTION-PLAN---</code> para ver el plan.</div>`;
    return;
  }

  // T-202605-488: chip "Generado automáticamente" si el plan vino del Generator
  let autoChipHtml = '';
  try {
    const metaKey = `ai-tracker-plan-auto-${proj.id}`;
    const metaRaw = localStorage.getItem(metaKey);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      const d = new Date(meta.ts);
      const label = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
      autoChipHtml = `<div class="plan-auto-chip">⚙ Generado automáticamente · ${label}</div>`;
    }
  } catch(e) {}

  // T-202605-510: timestamp de última actualización del plan
  let savedTsHtml = '';
  try {
    const savedAt = _planSavedAt(proj.id);
    if (savedAt) {
      const d = new Date(savedAt);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      savedTsHtml = `<div class="plan-saved-ts">Actualizado: ${hh}:${mm}</div>`;
    }
  } catch(e) {}

  // Resolver ítems del backlog en tiempo real
  const backlog = (() => {
    try {
      const raw = localStorage.getItem(_tplKey('backlog-items'));
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  })();
  const _itemByCode = {};
  backlog.forEach(it => { if (it.code) _itemByCode[it.code] = it; });

  const _statusClass   = st => st === 'done' ? 'plan-item--done' : st === 'descartado' ? 'plan-item--discarded' : '';
  const _statusLabel   = st => st === 'done' ? '✓' : st === 'descartado' ? '—' : '○';
  const _liveStatus    = code => { const it = _itemByCode[code]; return it ? (it.status || 'pendiente') : 'pendiente'; };
  const _liveTitle     = code => { const it = _itemByCode[code]; return it ? (it.title || it.desc || '') : ''; };
  const _sessIsDone    = sess => {
    const codes = sess.items || [];
    return codes.length > 0 && codes.every(c => { const s = _liveStatus(c); return s === 'done' || s === 'descartado'; });
  };
  const _sessIsBlocked = (sess, doneIds) => {
    const deps = (sess.depende_de || []).filter(Boolean);
    return deps.length > 0 && !deps.every(d => doneIds.has(d));
  };

  // Pre-poblar mapa id→sesión para etiquetas de bloqueo
  const _allSessionsById = {};
  sprints.forEach(sp => { (sp.sessions || []).forEach(sess => { if (sess.id) _allSessionsById[sess.id] = sess; }); });

  // SVG conector vertical entre sesiones secuenciales
  const _connector = () => `<div class="plan-connector">
    <svg width="2" height="32" viewBox="0 0 2 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="1" y1="0" x2="1" y2="26" stroke="var(--border2, var(--border))" stroke-width="2" stroke-dasharray="4 2"/>
      <polygon points="1,32 -3,24 5,24" fill="var(--border2, var(--border))"/>
    </svg>
  </div>`;

  // Card de sesión
  const _sessCard = (sess, idx, extraClass) => {
    const codes         = sess.items || [];
    const resolvedItems = codes.map(code => ({ code, status: _liveStatus(code), title: _liveTitle(code) }));
    const allDone       = _sessIsDone(sess);
    const archivos      = (sess.archivos   || []).filter(Boolean);
    const dependeDe     = (sess.depende_de || []).filter(Boolean);
    const badgeHtml     = allDone
      ? `<span class="plan-session-badge plan-session-badge--done">✓ Completa</span>`
      : extraClass === 'plan-session--blocked'
        ? `<span class="plan-session-badge plan-session-badge--blocked">⛔ Bloqueada</span>`
        : '';
    const depsHtml = (extraClass === 'plan-session--blocked' && dependeDe.length)
      ? dependeDe.map(depId => {
          const depSess = _allSessionsById[depId];
          if (!depSess) {
            return `<span class="plan-file-pill plan-file-pill--broken">⚠ dep no encontrada: ${esc(depId)}</span>`;
          }
          const label = depSess.rol ? `${depSess.rol} · ${depId}` : depId;
          return `<span class="plan-file-pill">Bloqueada por ${esc(label)}</span>`;
        }).join('')
      : '';

    // T-202605-512: micro-barra de progreso X/N por sesión
    const _sessDone  = resolvedItems.filter(it => it.status === 'done' || it.status === 'descartado').length;
    const _sessTotal = resolvedItems.length;
    const _sessPct   = _sessTotal ? Math.round((_sessDone / _sessTotal) * 100) : 0;
    const _sessProgHtml = _sessTotal
      ? `<div class="plan-session-prog">
          <div class="plan-session-prog-bar" style="--sess-prog-pct:${_sessPct}%"></div>
          <span class="plan-session-prog-label">${_sessDone}/${_sessTotal}</span>
        </div>`
      : '';

    return `<div class="plan-session ${allDone ? 'plan-session--done' : extraClass}">
      <div class="plan-session-header">
        <span class="plan-session-num">Sesión ${idx}</span>
        ${sess.id  ? `<span class="plan-session-id">${esc(sess.id)}</span>` : ''}
        ${sess.rol ? `<span class="plan-session-rol">${esc(sess.rol)}</span>` : ''}
        ${badgeHtml}
      </div>
      ${depsHtml ? `<div class="plan-session-deps">${depsHtml}</div>` : ''}
      ${archivos.length ? `<div class="plan-session-files">${archivos.map(f => `<span class="plan-file-pill">${esc(f)}</span>`).join('')}</div>` : ''}
      <div class="plan-session-items">
        ${resolvedItems.map(it => `
          <div class="plan-item ${_statusClass(it.status)}">
            <span class="plan-item-status" title="${esc(it.status)}">${_statusLabel(it.status)}</span>
            <span class="plan-item-code">${esc(it.code)}</span>
            <span class="plan-item-title">${esc(it.title)}</span>
          </div>`).join('')}
        ${resolvedItems.length === 0 ? `<div class="plan-item-empty">Sin ítems declarados</div>` : ''}
      </div>
      ${_sessProgHtml}
    </div>`;
  };

  // T-202605-511: lookup de sprints activos para chip 'activo'
  const _activeSprintIds = (() => {
    try {
      if (typeof getActiveSprints !== 'function') return new Set();
      return new Set(
        getActiveSprints()
          .filter(sp => sp.status === 'active')
          .map(sp => sp.id)
      );
    } catch(e) { return new Set(); }
  })();

  // Render de un grupo de sprints — reutilizable para ambos scopes
  const _renderSprintGroup = group => {
    let html = '';
    let globalSessIdx = 0;

    group.forEach(sprint => {
      const sprintLabel  = sprint.id ? sprint.id : 'Sin sprint';
      const sessions     = sprint.sessions || [];
      const doneIds      = new Set(sessions.filter(s => _sessIsDone(s)).map(s => s.id).filter(Boolean));
      const doneSessions = sessions.filter(s =>  _sessIsDone(s));
      const available    = sessions.filter(s => !_sessIsDone(s) && !_sessIsBlocked(s, doneIds));
      const blocked      = sessions.filter(s => !_sessIsDone(s) &&  _sessIsBlocked(s, doneIds));
      const allCodes     = sessions.flatMap(s => s.items || []);
      const totalItems   = allCodes.length;
      const doneItems    = allCodes.filter(c => { const st = _liveStatus(c); return st === 'done' || st === 'descartado'; }).length;
      const pct          = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
      const isActive     = sprint.id && _activeSprintIds.has(sprint.id);

      html += `<div class="plan-sprint-block">
        <div class="plan-sprint-header">
          <span class="plan-sprint-id">${esc(sprintLabel)}</span>${isActive ? `<span class="plan-sprint-badge--active">activo</span>` : ''}
          ${totalItems ? `<div class="plan-sprint-progress-bar-wrap">
            <div class="plan-sprint-progress-bar" style="--plan-pct:${pct}%"></div>
            <span class="plan-sprint-progress-label">${doneItems}/${totalItems} ítems (${pct}%)</span>
          </div>` : ''}
        </div>`;

      if (!sessions.length) {
        html += `<div class="plan-empty plan-empty--inline">Sin sesiones declaradas.</div>`;
      }

      if (available.length) {
        html += `<div class="plan-zone plan-zone--available"><div class="plan-zone-label">Pendientes</div><div class="plan-sessions-row">`;
        available.forEach(sess => { globalSessIdx++; html += _sessCard(sess, globalSessIdx, ''); });
        html += `</div></div>`;
      }
      if (blocked.length) {
        html += `<div class="plan-zone plan-zone--sequential"><div class="plan-zone-label">Bloqueadas</div><div class="plan-sessions-row">`;
        blocked.forEach((sess, i) => { globalSessIdx++; if (i > 0) html += _connector(); html += _sessCard(sess, globalSessIdx, 'plan-session--blocked'); });
        html += `</div></div>`;
      }
      if (doneSessions.length) {
        const _doneCollapsed = _planZoneDoneCollapsed();
        const _doneAriaLabel = _doneCollapsed ? 'Expandir completadas' : 'Colapsar completadas';
        const _doneTitleAttr = _doneCollapsed ? 'Expandir' : 'Colapsar';
        const _doneChevron   = _doneCollapsed ? '&#x25b2;' : '&#x25be;';
        html += `<div class="plan-zone plan-zone--done">`;
        html += `<div class="plan-zone-label">Completadas<button class="plan-zone-toggle" onclick="togglePlanZoneDone()" aria-label="${_doneAriaLabel}" title="${_doneTitleAttr}">${_doneChevron}</button></div>`;
        html += `<div class="plan-sessions-row${_doneCollapsed ? ' is-hidden' : ''}">`;
        doneSessions.forEach(sess => { globalSessIdx++; html += _sessCard(sess, globalSessIdx, 'plan-session--done'); });
        html += `</div></div>`;
      }

      html += `</div>`; // /plan-sprint-block
    });

    return html;
  };

  // Separar sprints por scope — sesion vs sprint (legacy sin scope → sprint)
  const sprintsSesion = sprints.filter(sp => sp.scope === 'sesion');
  const sprintsSprint = sprints.filter(sp => sp.scope !== 'sesion');

  // Construir HTML — sección sesion primero (AC de Nova)
  let html = autoChipHtml + savedTsHtml;

  // SECCIÓN SESIÓN
  html += `<div class="plan-scope-section plan-scope-section--sesion">
    <div class="plan-scope-header">
      <span class="plan-scope-label">Sesión activa</span>
      <span class="plan-scope-hint">Ítems en curso esta sesión</span>
    </div>`;

  if (sprintsSesion.length) {
    try {
      // R-202605-153: clonar sesiones antes de truncar — no mutar datos en memoria
      const sesionCloned = sprintsSesion.map(sp => ({
        ...sp,
        sessions: (sp.sessions || []).map(sess => ({ ...sess, items: [...(sess.items || [])] }))
      }));
      const totalItemsSesion = sesionCloned.flatMap(sp => sp.sessions.flatMap(s => s.items)).length;
      if (totalItemsSesion > 3) {
        html += `<div class="plan-scope-truncated-badge">⚠ Plan de sesión tiene ${totalItemsSesion} ítems — mostrando primeros 3</div>`;
        let itemCount = 0;
        sesionCloned.forEach(sp => {
          sp.sessions.forEach(sess => { sess.items = sess.items.filter(() => itemCount++ < 3); });
        });
      }
      html += _renderSprintGroup(sesionCloned);
    } catch(e) {
      console.warn('[AI Tracker] renderPlan sesion error:', e);
      html += `<div class="plan-scope-empty plan-scope-empty--error">Error al renderizar sesión activa — el bloque puede estar malformado.</div>`;
    }
  } else {
    html += `<div class="plan-scope-empty">Sin sesión activa — el plan se actualiza al pegar el próximo CHECKPOINT</div>`;
  }

  html += `</div>`; // /plan-scope-section--sesion

  // SECCIÓN SPRINT
  html += `<div class="plan-scope-section plan-scope-section--sprint">
    <div class="plan-scope-header">
      <span class="plan-scope-label">Plan de sprint</span>
      <span class="plan-scope-hint">Referencia del ciclo completo</span>
    </div>`;

  if (sprintsSprint.length) {
    try {
      html += _renderSprintGroup(sprintsSprint);
    } catch(e) {
      console.warn('[AI Tracker] renderPlan sprint error:', e);
      html += `<div class="plan-scope-empty plan-scope-empty--error">Error al renderizar plan de sprint — el bloque puede estar malformado.</div>`;
    }
  } else {
    html += `<div class="plan-scope-empty">Sin plan de sprint — abre sprint para generar</div>`;
  }

  html += `</div>`; // /plan-scope-section--sprint

  panel.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════════
// R-076: sección Planes activos en panel Pulso
// ════════════════════════════════════════════════════════════════════
function _buildPulsoPlanesHtml() {
  const projects = (state.projects || []).filter(p => !p.archived);
  const rows = [];

  const backlog = (() => {
    try {
      const raw = localStorage.getItem(_tplKey('backlog-items'));
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  })();
  const _itemByCode = {};
  backlog.forEach(it => { if (it.code) _itemByCode[it.code] = it; });
  const _liveStatus = code => { const it = _itemByCode[code]; return it ? (it.status || 'pendiente') : 'pendiente'; };

  projects.forEach(proj => {
    const sprints = loadPlan(proj.id);
    if (!sprints || !sprints.length) return;

    // Aplanar todas las sesiones de todos los sprints
    const allSessions = sprints.flatMap(sp => sp.sessions || []);
    const totalSess = allSessions.length;
    const doneSess = allSessions.filter(sess => {
      const codes = sess.items || [];
      return codes.length > 0 && codes.every(code => {
        const st = _liveStatus(code);
        return st === 'done' || st === 'descartado';
      });
    }).length;

    // Sprint activo — primer sprint con sesiones pendientes
    const activeSprint = sprints.find(sp =>
      (sp.sessions || []).some(sess =>
        (sess.items || []).some(code => {
          const st = _liveStatus(code);
          return st !== 'done' && st !== 'descartado';
        })
      )
    );
    const sprintLabel = activeSprint ? (activeSprint.id || 'Sin sprint') : (sprints[sprints.length - 1]?.id || '—');

    // Próxima sesión pendiente
    const nextSess = allSessions.find(sess =>
      (sess.items || []).some(code => {
        const st = _liveStatus(code);
        return st !== 'done' && st !== 'descartado';
      })
    );
    const nextItems = nextSess
      ? (nextSess.items || []).filter(code => {
          const st = _liveStatus(code);
          return st !== 'done' && st !== 'descartado';
        }).join(' · ')
      : '';

    rows.push(`<div class="pls-plan-row pls-plan-row--clickable" onclick="closePulsoPanel();if(typeof switchTab==='function')switchTab('backlog');setTimeout(()=>{if(typeof switchSubTab==='function')switchSubTab('plan');},80)" title="Ver plan completo">
      <span class="pls-plan-proj">${esc(proj.name)}</span>
      <span class="pls-plan-sprint">${esc(sprintLabel)}</span>
      <span class="pls-plan-progress">${doneSess}/${totalSess} sesiones</span>
      ${nextItems ? `<span class="pls-plan-next">→ ${esc(nextItems)}</span>` : ''}
    </div>`);
  });

  if (!rows.length) return '';
  return `<div class="pls-section pls-section--list">
    <span class="pls-label">Planes activos</span>
    ${rows.join('')}
  </div>`;
}






// ════════════════════════════════════════════════════════════════════
// R-202604-075 · CONTRATOS DE MÓDULO
// ════════════════════════════════════════════════════════════════════

// Storage helpers
function _ctrKey()    { return _tplKey('contratos-data'); }
function _ctrLoad()   { try { return JSON.parse(localStorage.getItem(_ctrKey()) || '{}'); } catch { return {}; } }
function _ctrSave(d)  { try { localStorage.setItem(_ctrKey(), JSON.stringify(d)); } catch(e) { console.error('ctr save error', e); } }

// Modelo:
// contratosData = {
//   [filename]: {
//     file: string,
//     updatedAt: timestamp,
//     updatedBy: string,   // código de ítem o 'manual'
//     functions: [
//       {
//         name: string,
//         signature: string,
//         invariants: string[],
//         sideEffects: string[],
//         lastTouched: string,   // código de ítem
//         riskSprints: string[]  // sprints donde fue modificada
//       }
//     ]
//   }
// }

// Merge de contrato desde un ítem parseado
// ítem.contract = { file, functions: [ { name, signature, invariants, sideEffects, lastTouched, riskSprints } ] }
function _ctrMergeFromItem(itemCode, contract) {
  if (!contract || !contract.file) return;
  const data = _ctrLoad();
  const now = Date.now();
  if (!data[contract.file]) {
    data[contract.file] = { file: contract.file, updatedAt: now, updatedBy: itemCode, functions: [] };
  }
  const mod = data[contract.file];
  mod.updatedAt = now;
  mod.updatedBy = itemCode;
  (contract.functions || []).forEach(fn => {
    if (!fn.name) return;
    const existing = mod.functions.find(f => f.name === fn.name);
    if (existing) {
      if (fn.signature)    existing.signature    = fn.signature;
      if (fn.invariants)   existing.invariants   = fn.invariants;
      if (fn.sideEffects)  existing.sideEffects  = fn.sideEffects;
      existing.lastTouched = itemCode;
      if (fn.riskSprints)  existing.riskSprints  = [...new Set([...(existing.riskSprints||[]), ...fn.riskSprints])];
    } else {
      mod.functions.push({
        name:        fn.name,
        signature:   fn.signature   || '',
        invariants:  fn.invariants  || [],
        sideEffects: fn.sideEffects || [],
        lastTouched: itemCode,
        riskSprints: fn.riskSprints || []
      });
    }
  });
  _ctrSave(data);
  _ctrUpdateBadge();
}

// Badge en nav
function _ctrUpdateBadge() {
  const data = _ctrLoad();
  const badge = document.getElementById('tpl-badge-contratos');
  if (!badge) return;
  const modCount = Object.keys(data).length;
  badge.textContent = modCount > 0 ? modCount : '';
}

// Estado de búsqueda
let _ctrSearchQuery = '';
let _ctrActiveModule = null;

function onContratosSearch() {
  const inp = document.getElementById('ctr-search-input');
  _ctrSearchQuery = inp ? inp.value.trim().toLowerCase() : '';
  const clr = document.getElementById('ctr-search-clear');
  if (clr) clr.classList.toggle('ctr-search-clear--visible', !!_ctrSearchQuery);
  renderContratos();
}

function clearContratosSearch() {
  _ctrSearchQuery = '';
  const inp = document.getElementById('ctr-search-input');
  if (inp) inp.value = '';
  const clr = document.getElementById('ctr-search-clear');
  if (clr) clr.classList.remove('ctr-search-clear--visible');
  renderContratos();
}

// Determinar si una función es área de riesgo — modificada en últimos 2 sprints activos
function _ctrIsRisk(fn) {
  if (!fn.riskSprints || !fn.riskSprints.length) return false;
  const allSprints = (state.projects || []).flatMap(p => p.sprints || []);
  const activeSprints = allSprints.filter(s => s.status !== 'closed').map(s => s.id);
  // Tomar últimos 2 sprints por orden
  const sorted = allSprints.sort((a, b) => (a.id > b.id ? -1 : 1)).slice(0, 2).map(s => s.id);
  const recent = [...new Set([...activeSprints, ...sorted])];
  return fn.riskSprints.some(sp => recent.includes(sp));
}

// Render principal del sub-tab
function renderContratos() {
  const listEl   = document.getElementById('ctr-list-panel');
  const detailEl = document.getElementById('ctr-detail-panel');
  if (!listEl || !detailEl) return;

  const data = _ctrLoad();
  const modules = Object.values(data);
  _ctrUpdateBadge();

  // Sin contratos → empty state
  if (!modules.length) {
    listEl.innerHTML = `<div class="ctr-empty">
      <span class="ctr-empty-icon">📐</span>
      <p class="ctr-empty-title">Sin contratos definidos</p>
      <p class="ctr-empty-hint">Rune genera el contrato inicial de un módulo en el CHECKPOINT de la primera sesión que lo toca.<br>Agrega el campo <code>contract</code> en un ítem R o T del bloque <code>---ITEMS---</code>.</p>
    </div>`;
    detailEl.innerHTML = '';
    return;
  }

  // Filtrar por búsqueda
  const q = _ctrSearchQuery;
  const filtered = q
    ? modules.filter(m =>
        m.file.toLowerCase().includes(q) ||
        (m.functions || []).some(f => f.name.toLowerCase().includes(q) || f.signature.toLowerCase().includes(q))
      )
    : modules;

  if (!filtered.length) {
    listEl.innerHTML = `<div class="ctr-empty"><p class="ctr-empty-title">Sin resultados para "${_ctrSearchQuery}"</p></div>`;
    detailEl.innerHTML = '';
    return;
  }

  // Lista de módulos
  listEl.innerHTML = filtered.map(m => {
    const fnCount   = (m.functions || []).length;
    const riskCount = (m.functions || []).filter(_ctrIsRisk).length;
    const isActive  = _ctrActiveModule === m.file;
    const updDate   = m.updatedAt ? new Date(m.updatedAt).toLocaleDateString('es-MX', { day:'2-digit', month:'short' }) : '—';
    return `<div class="ctr-module-row${isActive ? ' ctr-module-row--active' : ''}" onclick="openContratoDetail('${_esc(m.file)}')">
      <span class="ctr-module-name">${_esc(m.file)}</span>
      <span class="ctr-module-meta">
        <span class="ctr-fn-count" title="${fnCount} funciones">${fnCount} fn</span>
        ${riskCount ? `<span class="ctr-risk-badge" title="${riskCount} función${riskCount !== 1 ? 'es' : ''} modificada${riskCount !== 1 ? 's' : ''} en últimos 2 sprints">⚠ ${riskCount}</span>` : ''}
        <span class="ctr-updated" title="Última actualización">${updDate}</span>
      </span>
    </div>`;
  }).join('');

  // Detalle del módulo activo
  if (_ctrActiveModule && data[_ctrActiveModule]) {
    _renderContratoDetail(data[_ctrActiveModule], detailEl);
  } else {
    detailEl.innerHTML = `<div class="ctr-detail-placeholder"><span>← Selecciona un módulo para ver sus contratos</span></div>`;
  }
}

function openContratoDetail(file) {
  _ctrActiveModule = file;
  renderContratos();
}

function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function _renderContratoDetail(mod, el) {
  const fns = mod.functions || [];
  const q = _ctrSearchQuery;
  const visible = q
    ? fns.filter(f => f.name.toLowerCase().includes(q) || f.signature.toLowerCase().includes(q))
    : fns;

  const rows = visible.map(fn => {
    const isRisk = _ctrIsRisk(fn);
    const invariantsHtml = (fn.invariants || []).length
      ? `<ul class="ctr-fn-list">${fn.invariants.map(i => `<li>${_esc(i)}</li>`).join('')}</ul>`
      : `<span class="ctr-fn-none">—</span>`;
    const sideEffectsHtml = (fn.sideEffects || []).length
      ? `<ul class="ctr-fn-list">${fn.sideEffects.map(s => `<li>${_esc(s)}</li>`).join('')}</ul>`
      : `<span class="ctr-fn-none">—</span>`;
    return `<div class="ctr-fn-row${isRisk ? ' ctr-fn-row--risk' : ''}">
      <div class="ctr-fn-header">
        <span class="ctr-fn-name">${_esc(fn.name)}</span>
        ${isRisk ? `<span class="ctr-risk-badge ctr-risk-badge--inline" title="Modificada en últimos 2 sprints">⚠ riesgo</span>` : ''}
        ${fn.lastTouched ? `<span class="ctr-fn-touched" title="Último ítem que la tocó">${_esc(fn.lastTouched)}</span>` : ''}
      </div>
      ${fn.signature ? `<code class="ctr-fn-sig">${_esc(fn.signature)}</code>` : ''}
      <div class="ctr-fn-section">
        <span class="ctr-fn-label">Invariantes</span>
        ${invariantsHtml}
      </div>
      <div class="ctr-fn-section">
        <span class="ctr-fn-label">Efectos secundarios</span>
        ${sideEffectsHtml}
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `<div class="ctr-detail-wrap">
    <div class="ctr-detail-header">
      <span class="ctr-detail-title">${_esc(mod.file)}</span>
      <button class="ctr-detail-close" onclick="_ctrActiveModule=null;renderContratos()" title="Cerrar detalle">✕</button>
    </div>
    <div class="ctr-fn-list-wrap">
      ${rows || `<div class="ctr-empty"><p class="ctr-empty-title">Sin funciones registradas</p></div>`}
    </div>
  </div>`;
}

// Export MD
function exportContratosMd() {
  const data = _ctrLoad();
  const modules = Object.values(data);
  if (!modules.length) { showToast('warn', 'Sin contratos para exportar'); return; }

  const pad = (s, n) => String(s).padEnd(n);
  let md = `# Contratos de Módulo\n\n`;
  md += `Exportado: ${new Date().toLocaleString('es-MX')}\n\n---\n\n`;

  modules.forEach(m => {
    const fns = m.functions || [];
    const riskCount = fns.filter(_ctrIsRisk).length;
    md += `## ${m.file}\n\n`;
    md += `Última actualización: ${m.updatedAt ? new Date(m.updatedAt).toLocaleString('es-MX') : '—'} · Ítem: ${m.updatedBy || '—'}\n`;
    md += `Funciones: ${fns.length} · Áreas de riesgo: ${riskCount}\n\n`;
    if (!fns.length) { md += `_Sin funciones registradas_\n\n`; return; }
    fns.forEach(fn => {
      const risk = _ctrIsRisk(fn);
      md += `### ${fn.name}${risk ? ' ⚠' : ''}\n\n`;
      if (fn.signature) md += `**Firma:** \`${fn.signature}\`\n\n`;
      if (fn.lastTouched) md += `**Última sesión:** ${fn.lastTouched}\n\n`;
      if ((fn.invariants || []).length) {
        md += `**Invariantes:**\n${fn.invariants.map(i => `- ${i}`).join('\n')}\n\n`;
      }
      if ((fn.sideEffects || []).length) {
        md += `**Efectos secundarios:**\n${fn.sideEffects.map(s => `- ${s}`).join('\n')}\n\n`;
      }
      if ((fn.riskSprints || []).length) {
        md += `**Sprints con modificación:** ${fn.riskSprints.join(', ')}\n\n`;
      }
    });
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Contratos.md';
  a.click();
  showToast('success', 'Contratos.md exportado');
}

// Reset
function resetContratosData() {
  localStorage.removeItem(_ctrKey());
  _ctrActiveModule = null;
  _ctrUpdateBadge();
  renderContratos();
  showToast('success', 'Contratos reseteados');
}

// Búsqueda global — incluir contratos en scope
function searchContratos(q) {
  const data = _ctrLoad();
  const results = [];
  const ql = q.toLowerCase();
  Object.values(data).forEach(m => {
    if (m.file.toLowerCase().includes(ql)) {
      results.push({ type: 'contrato-modulo', label: m.file, sub: `${(m.functions||[]).length} funciones`, action: () => { switchTab('backlog'); setTimeout(() => { switchSubTab('contratos'); openContratoDetail(m.file); }, 80); } });
    }
    (m.functions || []).forEach(fn => {
      if (fn.name.toLowerCase().includes(ql) || fn.signature.toLowerCase().includes(ql)) {
        results.push({ type: 'contrato-fn', label: fn.name, sub: m.file, action: () => { switchTab('backlog'); setTimeout(() => { switchSubTab('contratos'); openContratoDetail(m.file); }, 80); } });
      }
    });
  });
  return results;
}

// Resetear Sesiones — preserva Workers y Proyectos
function openResetSessionsModal() {
  const input = document.getElementById('reset-sessions-input');
  if (input) { input.value = ''; }
  const btn = document.getElementById('reset-sessions-confirm-btn');
  if (btn) btn.disabled = true;
  const hint = document.getElementById('reset-sessions-hint');
  if (hint) hint.classList.add('hidden');
  document.getElementById('reset-sessions-overlay').classList.add('open');
  if (typeof _focusFirstInteractive === 'function') _focusFirstInteractive('reset-sessions-overlay');
}

function closeResetSessionsModal() {
  document.getElementById('reset-sessions-overlay').classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus('reset-sessions-overlay');
}

function confirmResetSessions() {
  const input = document.getElementById('reset-sessions-input');
  if (!input || input.value.trim() !== 'RESET') return;

  // Vaciar sesiones y sprints de todos los proyectos — preservar workers, proyectos, theme, tags
  if (typeof state !== 'undefined' && Array.isArray(state.projects)) {
    state.projects.forEach(proj => {
      proj.sessions = [];
      proj.sprints = [];
    });
  }

  // Persistir state limpio en localStorage
  try {
    localStorage.setItem('ai-tracker-v4', JSON.stringify(state));
  } catch (e) {
    showToast('error', '❌ Error al guardar — intenta de nuevo');
    return;
  }

  // AC-9: sincronizar reset a Supabase cuando el usuario está autenticado
  if (typeof _supabase !== 'undefined' && _supabase &&
      typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    (async () => {
      try {
        // Borrar sesiones en tracker_sessions para todos los proyectos
        const { error: sessErr } = await _supabase
          .from('tracker_sessions')
          .delete()
          .eq('user_id', _supabaseUser.id);
        if (sessErr) throw sessErr;

        // Sobrescribir state en tracker_state con sesiones y sprints vacíos
        const stateWithoutSessions = {
          ...state,
          projects: (state.projects || []).map(p => {
            const { sessions, ...rest } = p;
            return { ...rest, sprints: [] };
          })
        };
        const { error: stateErr } = await _supabase
          .from('tracker_state')
          .upsert({
            user_id: _supabaseUser.id,
            key: 'main',
            value: stateWithoutSessions,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,key' });
        if (stateErr) throw stateErr;

        if (typeof setSyncStatus === 'function') setSyncStatus('synced', '✓ sincronizado');
      } catch (err) {
        console.error('[AI Tracker] confirmResetSessions: Supabase sync error:', err);
        if (typeof setSyncStatus === 'function') setSyncStatus('offline', '✕ sin conexión');
        if (typeof _offlineQueuePush === 'function') _offlineQueuePush({ type: 'state' });
        showToast('warning', '⚠️ Reset local aplicado — Supabase se sincronizará al reconectar');
      }
    })();
  }

  closeResetSessionsModal();

  // Re-render
  if (typeof renderSessionList === 'function') renderSessionList();
  if (typeof renderStats === 'function') renderStats();

  showToast('success', 'Sesiones y sprints reseteados — Workers y Proyectos conservados');
}
