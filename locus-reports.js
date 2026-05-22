// locus-reports.js
// Última actualización: 2026-05-19 UTC-6
// Módulo: Reports, Export/Import de datos, Purge, Danger zones
// Extraído de ai-tracker-ai-notes.js

// ai-tracker-ai-notes.js
// Última actualización: 2026-05-13 UTC-6
// UI de IAs, Item Editor, Paste Items, Templates, Proyectos, Documentos, Plan, Contratos, Misc UI
// Analytics extraído a ai-tracker-analytics.js


// Workers (IAs) — CRUD extraído a locus-workers.js

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


// T-202604-005: Escape closes inline confirm
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.inline-confirm.open').forEach(el => el.remove());
    const m = document.getElementById('more-menu'); if (m) m.classList.add('is-hidden');
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
    const m = document.getElementById('more-menu'); if (m) m.classList.add('is-hidden');
  }
});

// T-202604-009: toggle ⋯ dropdown
// B — position:fixed para escapar overflow:hidden del header (Nova 2026-05-12)
function toggleMoreMenu() {
  const m   = document.getElementById('more-menu');
  const btn = document.getElementById('more-menu-btn');
  if (!m) return;

  const isHidden = m.classList.contains('is-hidden');

  if (isHidden) {
    // Anclar coords relativas al viewport — necesario porque .more-menu usa position:fixed
    if (btn) {
      const rect = btn.getBoundingClientRect();
      m.style.top   = rect.bottom + 6 + 'px';
      m.style.right = window.innerWidth - rect.right + 'px';
      m.style.left  = 'auto';
    }
    m.classList.remove('is-hidden');

    // T-202604-295: sync checked state desde localStorage — shell estático en index.html
    const cur = (typeof _templateTrigger === 'function' ? _templateTrigger() : 'session');
    const sesRad = document.getElementById('tmpl-trigger-session');
    const sprRad = document.getElementById('tmpl-trigger-sprint');
    if (sesRad) sesRad.checked = cur === 'session';
    if (sprRad) sprRad.checked = cur === 'sprint';

    // Cerrar al hacer click fuera del menú
    const _closeOnOutside = (e) => {
      if (!m.contains(e.target) && e.target !== btn) {
        m.classList.add('is-hidden');
        document.removeEventListener('mousedown', _closeOnOutside);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', _closeOnOutside), 0);
  } else {
    m.classList.add('is-hidden');
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
  body.classList.toggle('is-hidden');
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
  if (typeof _gconfirmOpen !== 'function') return;
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
  if (typeof _gconfirmOpen !== 'function') return;
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
    if (typeof loadHtmlMap === 'function') loadHtmlMap();
    if (typeof renderHtmlMap === 'function') renderHtmlMap();
    if (typeof updateHtmlMapBanner === 'function') updateHtmlMapBanner();
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
  // AC-3: comparar por id (igual que confirmImport) — comparar por nombre causaba
  // falso "0 IAs nuevas" cuando el mismo AI tenía distinto id en backup vs local
  const currentAIIds = new Set(currentAIs.map(a => a.id));
  const newAIs = d.ais.filter(a => !currentAIIds.has(a.id));
  const existingAIs = d.ais.filter(a => currentAIIds.has(a.id));

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
  // AC-2/AC-5: limpiar el input para que onchange dispare si el usuario
  // selecciona el mismo archivo después de cancelar el diff
  const imp = document.getElementById('imp');
  if (imp) imp.value = '';
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
