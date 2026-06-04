// [PP] v1.2.4 · sprint:PP-S-09 · mod:26 · autor:Rune · 2026-06-04 UTC-6
// locus-sprint-project.js
// Última actualización: 2026-05-19 UTC-6
// Módulo: Gestión de proyectos + helpers de prefijo/sprint
// Renombrado de ai-tracker-sprint-project.js
// T-202606-016: funciones de export de backlog migradas a locus-backlog-generator.js
import { loadHtmlMap } from './locus-map-viewer.js';
import { _syncCleanProjectBtn } from './locus-reports.js';
import { _blogLog, _effectiveVersion, _offlineQueuePush, _PREFIX_MAP, _tplKey, getActiveProject, getActiveSprints, getActiveTracker, getProjectSessions, getState, getSupabaseUserId, save } from './locus-storage.js';
import { esc, switchSubTab, switchTab, getCurrentSubTab } from './locus-ui-shell.js';


import { renderAnalytics } from './locus-analytics-render.js';

import { loadBacklog, renderStats, updateBacklogBanner, updateStatusFilterUI, getItems} from './locus-backlog-core.js';
import { closeQuickCapture } from './locus-sesiones-capture.js';

import { updateBacklogFooter } from './locus-backlog-item.js';

import { renderBacklogList } from './locus-backlog-render.js';

import { _renderTplProjBanner } from './locus-docs.js';


import { _gconfirmOpen, closeModal } from './locus-modals.js';

import { renderProyectos } from './locus-projects.js';

import { _updateHeaderProjectLabel } from './locus-sesiones-stats.js';

import { render } from './locus-sesiones.js';

import { closePopup } from './locus-session-popup.js';

import { showToast, showToastInline } from './locus-toast.js';

// ── Utilidades de módulo — T3.bis ─────────────────────────────────────────────
export function pad(n) { return String(n).padStart(2, '0'); }
export function _sprintNum(id) {
  if (!id) return null;
  const m = String(id).match(/S-(\\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

// T-202604-243: prefijo de documento vivo según proyecto activo — OL-CONTEXT §7
// R-202605-002: _PREFIX_MAP consumida desde locus-storage.js — sin declaración local
export function _docPrefix() {
  const proj = getActiveProject();
  if (!proj) return 'XX';
  if (proj.prefix) return proj.prefix;
  const name = proj.name || '';
  return _PREFIX_MAP[name] || (name.slice(0, 2).toUpperCase() || 'XX');
}

// R-1: _updateHeaderProjectLabel — definición canónica en checkpoint.js
// Este módulo la llama via guard — no la redefine.

// ── Keyboard shortcuts ──
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const s = document.getElementById('search-global');
    if (s) { s.focus(); s.select(); }
  }
  if (e.key === 'Escape') {
    closePopup();
    closePendPanel();
    closeModal('add-modal');
    closeModal('tag-modal');
    const _qcOverlay = document.getElementById('qc-modal-overlay'); if (_qcOverlay) _qcOverlay.classList.remove('open');
    closeQuickCapture();
  }
});

// Init — diferido post-DOMContentLoaded con gate de auth
document.addEventListener('DOMContentLoaded', function _sprintProjectInit() {
  if (!getSupabaseUserId()) return;

  const state = getState();
  (function _ensureProjectFilter() {
    if (_getActiveProjectFilter()) return;
    const active = (state.projects || []).find(p => p.status === 'active' || (!p.status && !p.archived));
    if (active) _setActiveProjectFilter(active.id);
  })();

  if (state.projects && state.projects.some(p => p.status === 'paused')) {
    state.projects.forEach(p => { if (p.status === 'paused') p.status = 'archived'; });
    save();
  }
});
// ── T-077: Panel selector proyectos ──

const PROJ_COLORS = ['#7c6af7','#38bdf8','#2ecc78','#e8a832','#e85555','#f472b6','#a3e635','#fb923c','#8BC34A','#64748b'];

function _projListDragStartHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  if (row) projDragStart(e, row.dataset.dragProjId, row);
}
function _projListDragEndHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  projDragEnd(e, row);
}
function _projListDragOverHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  if (row) projDragOver(e, row.dataset.dragProjId, row);
}
function _projListDragLeaveHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  projDragLeave(e, row);
}
function _projListDropHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  if (row) projDrop(e, row.dataset.dragProjId, row);
}

export function _getActiveProjectFilter() {
  return localStorage.getItem('current-project-filter') || '';
}

export function _setActiveProjectFilter(projId) {
  if (projId) localStorage.setItem('current-project-filter', projId);
  else localStorage.removeItem('current-project-filter');
  _updateProjBreadcrumb();
  _updateProjFilterBtn();
  _updateHeaderProjectLabel();
  _syncCleanProjectBtn();
}

export function _updateProjBreadcrumb() {
  // absorbido por _updateProjFilterBtn — no-op
}

export function _updateProjFilterBtn() {
  const btn = document.getElementById('proj-filter-btn');
  if (!btn) return;
  const filterId = _getActiveProjectFilter();
  if (filterId) {
    const proj = getProjectById(filterId);
    const avatar = proj
      ? (proj.icon
          ? `<span class="proj-filter-icon">${esc(proj.icon)}</span>`
          : `<span class="proj-filter-initial" style="--proj-color:${proj.color || '#7c6af7'}">${esc((proj.name||'P')[0].toUpperCase())}</span>`)
      : '';
    const name = proj ? esc(proj.name) : 'Proyecto';
    btn.innerHTML = `${avatar}${name} <span title="Limpiar filtro" class="proj-filter-clear">✕</span>`;
    btn.classList.add('active');
    const clearSpan = btn.querySelector('.proj-filter-clear');
    if (clearSpan) {
      clearSpan.addEventListener('click', function(e) {
        e.stopPropagation();
        clearProjectFilter();
      });
    }
  } else {
    btn.innerHTML = '📁 Proyectos';
    btn.classList.remove('active');
  }
}

function clearProjectFilter() {
  _setActiveProjectFilter('');
  loadBacklog(); loadHtmlMap();
  render(); if (typeof renderHoy === 'function') renderHoy();
  if (typeof currentTab !== 'undefined' && currentTab === 'analytics') renderAnalytics();
  renderBacklogList(); renderStats();
  _renderTplProjBanner();
  switchSubTab(getCurrentSubTab()); {
  renderProjPanel();
  document.getElementById('proj-panel-overlay').classList.add('open');
  const btn = document.getElementById('proj-filter-btn');
  if (btn) btn.classList.add('active');
}

export function closeProjPanel() {
  document.getElementById('proj-panel-overlay').classList.remove('open');
  const btn = document.getElementById('proj-filter-btn');
  if (btn) btn.classList.remove('active');
}

function renderProjPanel() {
  const state = getState();
  const body = document.getElementById('proj-panel-body');
  if (!body) return;
  const filterId = _getActiveProjectFilter();
  const projects = (state.projects || []).filter(p => p.status !== 'archived');

  let html = '';

  if (!projects.length) {
    html += `<div class="proj-panel-empty">Sin proyectos — crea uno abajo</div>`;
  } else {
    projects.forEach(proj => {
      const sessCount = _countProjSessions(proj);
      const isActive = filterId === proj.id;
      html += `<div class="proj-row${isActive ? ' active' : ''}" data-proj-id="${proj.id}">
        ${proj.icon ? `<span class="proj-row-icon">${esc(proj.icon)}</span>` : `<span class="proj-row-dot" style="--proj-color:${proj.color || '#7c6af7'}"></span>`}
        <span class="proj-row-name">${esc(proj.name)}${proj.notes ? `<span class="proj-row-notes">${esc(proj.notes)}</span>` : ''}</span>
        <span class="proj-row-count">${sessCount}</span>
        <button class="proj-row-edit" data-proj-edit-id="${proj.id}" title="Editar">✎</button>
      </div>`;
    });
  }

  if (filterId) {
    html += `<div class="proj-all-row proj-all-row--separator" data-proj-clear="1">
      <span class="proj-all-row-icon">✕</span>
      <span class="proj-all-row-label">Sin filtro activo</span>
    </div>`;
  }

  body.innerHTML = html;

  body.addEventListener('click', function _projPanelDelegate(e) {
    const editBtn = e.target.closest('[data-proj-edit-id]');
    if (editBtn) {
      e.stopPropagation();
      closeProjPanel();
      openProjModal(true, editBtn.dataset.projEditId);
      return;
    }
    const clearRow = e.target.closest('[data-proj-clear]');
    if (clearRow) { selectProjectFilter(''); return; }
    const row = e.target.closest('[data-proj-id]');
    if (row) { selectProjectFilter(row.dataset.projId); return; }
  }, { once: true });
}

export function _countProjSessions(proj) {
  return getProjectSessions(proj.id).length;
}

export function selectProjectFilter(projId) {
  _setActiveProjectFilter(projId);
  closeProjPanel();
  loadBacklog(); loadHtmlMap();
  render(); if (typeof renderHoy === 'function') renderHoy();
  if (typeof currentTab !== 'undefined' && currentTab === 'analytics') renderAnalytics();
  renderBacklogList(); renderStats();
  _renderTplProjBanner();
  switchSubTab(getCurrentSubTab());
  if (projId) {
    const proj = getProjectById(projId);
    showToast('info', proj ? `Filtro: ${proj.name}` : 'Filtro activo');
  } else {
    showToast('info', 'Filtro limpiado');
  }
}

// ── T-080: Modal gestión proyectos CRUD ──

let _projEditId = null;
let _projSelectedColor = 0;

export function openProjModal(editMode, projId) {
  _projEditId = editMode && projId ? projId : null;
  _projSelectedColor = 0;
  _renderProjColorRow();
  _renderProjList();

  const heading = document.getElementById('proj-form-heading');
  const nameInput = document.getElementById('proj-name-input');
  const emojiInput = document.getElementById('proj-emoji');

  if (_projEditId) {
    const proj = getProjectById(_projEditId);
    if (proj) {
      if (heading) heading.textContent = '✎ Editar proyecto';
      if (nameInput) nameInput.value = proj.name;
      if (emojiInput) emojiInput.value = proj.icon || '';
      const prefixInput = document.getElementById('proj-prefix-input');
      if (prefixInput) prefixInput.value = proj.prefix || '';
      const notesInput = document.getElementById('proj-notes-input');
      if (notesInput) notesInput.value = proj.notes || '';
      _projSelectedColor = PROJ_COLORS.indexOf(proj.color);
      if (_projSelectedColor < 0) _projSelectedColor = 0;
      _renderProjColorRow();
    }
  } else {
    if (heading) heading.textContent = '+ Nuevo proyecto';
    if (nameInput) nameInput.value = '';
    if (emojiInput) emojiInput.value = '';
  }

  const projModalOverlay = document.getElementById('proj-modal-overlay');
  if (projModalOverlay) projModalOverlay.classList.add('open');
  setTimeout(() => { if (nameInput) nameInput.focus(); }, 80);
}

export function closeProjModal() {
  const projModalOverlay = document.getElementById('proj-modal-overlay');
  if (projModalOverlay) projModalOverlay.classList.remove('open');
  _projEditId = null;
}

function cancelProjForm() {
  _projEditId = null;
  const heading = document.getElementById('proj-form-heading');
  const nameInput = document.getElementById('proj-name-input');
  const emojiInput = document.getElementById('proj-emoji');
  const prefixInput = document.getElementById('proj-prefix-input');
  if (heading) heading.textContent = '+ Nuevo proyecto';
  if (nameInput) nameInput.value = '';
  if (emojiInput) emojiInput.value = '';
  if (prefixInput) prefixInput.value = '';
  const notesInput = document.getElementById('proj-notes-input');
  if (notesInput) notesInput.value = '';
  _projSelectedColor = 0;
  _renderProjColorRow();
}

function _renderProjColorRow() {
  const row = document.getElementById('proj-color-row');
  if (!row) return;
  row.innerHTML = PROJ_COLORS.map((c, i) =>
    `<div class="proj-color-dot${i === _projSelectedColor ? ' sel' : ''}" style="--proj-color:${c}" data-color-idx="${i}" title="${c}"></div>`
  ).join('');
  row.addEventListener('click', function _colorRowDelegate(e) {
    const dot = e.target.closest('[data-color-idx]');
    if (dot) selectProjColor(parseInt(dot.dataset.colorIdx, 10));
  }, { once: true });
}

function selectProjColor(i) {
  _projSelectedColor = i;
  _renderProjColorRow();
}

function confirmProjForm() {
  const state = getState();
  const name = (document.getElementById('proj-name-input') || {value:''}).value.trim();
  if (!name) {
    const el = document.getElementById('proj-name-input');
    if (el) { el.classList.add('input-border-error'); setTimeout(() => el.classList.remove('input-border-error'), 1200); }
    showToast('warning', 'El nombre es obligatorio'); return;
  }
  const emoji = (document.getElementById('proj-emoji') || {value:''}).value.trim();
  const notes = (document.getElementById('proj-notes-input') || {value:''}).value.trim();
  const color = PROJ_COLORS[_projSelectedColor] || PROJ_COLORS[0];

  if (!state.projects) state.projects = [];

  if (_projEditId) {
    const proj = getProjectById(_projEditId);
    if (proj) {
      proj.name = name;
      proj.color = color;
      proj.icon = emoji;
      proj.prefix = (document.getElementById('proj-prefix-input') || {value:''}).value.trim().toUpperCase().slice(0, 3);
      proj.notes = notes;
      showToastInline('success', `Proyecto "${name}" actualizado`, document.getElementById('proj-form-confirm-btn'));
    }
    save();
    closeProjModal();
    _renderProjList();
    _updateProjBreadcrumb();
    _updateProjFilterBtn();
    _updateHeaderProjectLabel();
    return;
  } else {
    const id = 'proj-' + Math.random().toString(36).slice(2, 8);
    const prefix = (document.getElementById('proj-prefix-input') || {value:''}).value.trim().toUpperCase().slice(0, 3);
    state.projects.push({ id, name, color, icon: emoji, prefix, notes, status: 'active', context: '', contextVersion: '', backlog: [], backlogVersion: '' });
    showToastInline('success', `Proyecto "${name}" creado`, document.getElementById('proj-form-confirm-btn'));
  }

  save();
  cancelProjForm();
  _renderProjList();
  _updateProjBreadcrumb();
  _updateProjFilterBtn();
}

function _toggleProjArchivedSection() {
  var k = 'proj-modal-archived-open';
  var now = localStorage.getItem(k) !== '0';
  localStorage.setItem(k, now ? '0' : '1');
  _renderProjList();
}

function _renderProjList() {
  const state = getState();
  const list = document.getElementById('proj-list');
  if (!list) return;
  const projects = state.projects || [];
  if (!projects.length) {
    list.innerHTML = `<div class="proj-empty-hint">Aún no hay proyectos — crea uno arriba</div>`;
    return;
  }

  const activeProjs = projects.filter(p => p.status !== 'archived');
  const archivedProjs = projects.filter(p => p.status === 'archived');

  function _projRow(proj) {
    const sessCount = _countProjSessions(proj);
    const isArchived = proj.status === 'archived';
    return `<div class="proj-list-row${isArchived ? ' paused' : ''}" draggable="${isArchived ? 'false' : 'true'}"
      id="prow-${proj.id}"
      data-drag-proj-id="${proj.id}">
      <span class="proj-list-drag">${isArchived ? '' : '⠿'}</span>
      ${proj.icon
        ? `<span class="proj-list-icon">${esc(proj.icon)}</span>`
        : proj.prefix
          ? `<span class="proj-list-prefix" style="--proj-color:${proj.color || '#7c6af7'}">${esc(proj.prefix)}</span>`
          : `<span class="proj-list-dot" style="--proj-color:${proj.color || '#7c6af7'}"></span>`}
      <span class="proj-list-name">${esc(proj.name)}${proj.notes ? `<br><span class="proj-list-notes">${esc(proj.notes)}</span>` : ''}</span>
      <span class="proj-list-meta">${sessCount} ses.</span>
      <div class="proj-list-actions">
        <button class="proj-list-btn" data-proj-action="edit" data-proj-id="${proj.id}" title="Editar">✎</button>
        <button class="proj-list-btn" data-proj-action="archive" data-proj-id="${proj.id}" title="${isArchived ? 'Restaurar' : 'Archivar'}">${isArchived ? '↩' : '📦'}</button>
        <button class="proj-list-btn danger" data-proj-action="delete" data-proj-id="${proj.id}" title="Eliminar">✕</button>
      </div>
    </div>`;
  }

  const archivedKey = 'proj-modal-archived-open';
  const archivedOpen = localStorage.getItem(archivedKey) !== '0';

  let html = activeProjs.map(_projRow).join('');
  if (archivedProjs.length) {
    html += `<div class="proj-archived-section">
      <button class="proj-archived-toggle" data-proj-action="toggle-archived">
        <span class="proj-archived-arrow">${archivedOpen ? '▾' : '▸'}</span>
        <span>Archivados (${archivedProjs.length})</span>
      </button>
      ${archivedOpen ? archivedProjs.map(_projRow).join('') : ''}
    </div>`;
  }
  list.innerHTML = html || `<div class="proj-empty-hint">Aún no hay proyectos — crea uno arriba</div>`;

  function _projListClickDelegate(e) {
    const btn = e.target.closest('[data-proj-action]');
    if (!btn) return;
    const action = btn.dataset.projAction;
    const projId = btn.dataset.projId;
    if (action === 'edit') { editProjInline(projId); return; }
    if (action === 'archive') { toggleProjArchive(projId); return; }
    if (action === 'delete') { deleteProjConfirm(projId); return; }
    if (action === 'toggle-archived') { _toggleProjArchivedSection(); return; }
  }
  list.removeEventListener('click', _projListClickDelegate);
  list.addEventListener('click', _projListClickDelegate);

  list.removeEventListener('dragstart', _projListDragStartHandler);
  list.removeEventListener('dragend',   _projListDragEndHandler);
  list.removeEventListener('dragover',  _projListDragOverHandler);
  list.removeEventListener('dragleave', _projListDragLeaveHandler);
  list.removeEventListener('drop',      _projListDropHandler);
  list.addEventListener('dragstart', _projListDragStartHandler);
  list.addEventListener('dragend',   _projListDragEndHandler);
  list.addEventListener('dragover',  _projListDragOverHandler);
  list.addEventListener('dragleave', _projListDragLeaveHandler);
  list.addEventListener('drop',      _projListDropHandler);
}

function editProjInline(projId) {
  _projEditId = projId;
  const proj = getProjectById(projId);
  if (!proj) return;
  const heading = document.getElementById('proj-form-heading');
  const nameInput = document.getElementById('proj-name-input');
  const emojiInput = document.getElementById('proj-emoji');
  if (heading) heading.textContent = '✎ Editar: ' + proj.name;
  if (nameInput) { nameInput.value = proj.name; nameInput.focus(); }
  if (emojiInput) emojiInput.value = proj.icon || '';
  const notesInput = document.getElementById('proj-notes-input');
  if (notesInput) notesInput.value = proj.notes || '';
  _projSelectedColor = PROJ_COLORS.indexOf(proj.color);
  if (_projSelectedColor < 0) _projSelectedColor = 0;
  _renderProjColorRow();
  const form = document.getElementById('proj-form');
  if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleProjArchive(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const wasArchived = proj.status === 'archived';
  proj.status = wasArchived ? 'active' : 'archived';
  if (!wasArchived && _getActiveProjectFilter() === projId) {
    _setActiveProjectFilter('');
  }
  save();
  _renderProjList();
  renderProyectos();
  showToast('info', !wasArchived ? `"${proj.name}" archivado` : `"${proj.name}" restaurado`);
}

function deleteProjConfirm(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const sessCount = _countProjSessions(proj);
  const msg = sessCount > 0
    ? `Las ${sessCount} sesiones de las IAs vinculadas mantendrán sus datos.`
    : `Esta acción no se puede deshacer.`;
  _gconfirmOpen({ title: `¿Eliminar "${proj.name}"?`, msg, okLabel: 'Eliminar', danger: true }, () => {
    const state = getState();
    state.projects = (state.projects || []).filter(p => p.id !== projId);
    if (_getActiveProjectFilter() === projId) _setActiveProjectFilter('');
    save();
    _renderProjList();
    _updateProjBreadcrumb();
    showToast('success', `Proyecto eliminado`);
  });
}

let _projDragId = null;
function projDragStart(e, projId, rowEl) {
  _projDragId = projId;
  if (rowEl) rowEl.classList.add('dragging');
}
function projDragEnd(e, rowEl) {
  if (rowEl) rowEl.classList.remove('dragging');
  document.querySelectorAll('.proj-list-row').forEach(r => r.classList.remove('drag-over'));
  _projDragId = null;
}
function projDragOver(e, projId, rowEl) {
  e.preventDefault();
  if (_projDragId === projId) return;
  document.querySelectorAll('.proj-list-row').forEach(r => r.classList.remove('drag-over'));
  if (rowEl) rowEl.classList.add('drag-over');
}
function projDragLeave(e, rowEl) {
  if (rowEl) rowEl.classList.remove('drag-over');
}
function projDrop(e, toId, rowEl) {
  e.preventDefault();
  if (rowEl) rowEl.classList.remove('drag-over');
  if (!_projDragId || _projDragId === toId) return;
  const state = getState();
  const projs = state.projects || [];
  const fromIdx = projs.findIndex(p => p.id === _projDragId);
  const toIdx   = projs.findIndex(p => p.id === toId);
  if (fromIdx < 0 || toIdx < 0) return;
  const [moved] = projs.splice(fromIdx, 1);
  projs.splice(toIdx, 0, moved);
  save();
  _renderProjList();
}

export function getProjectById(id) {
  const state = getState();
  return (state.projects || []).find(p => p.id === id);
}
function getProjectsByAI(aiId) {
  const state = getState();
  return (state.projects || []).filter(p => (p.sessions || []).some(s => s.aiId === aiId));
}

export function getProjContext(projId) {
  const proj = getProjectById(projId);
  return proj ? (proj.context || '') : '';
}
export function setProjContext(projId, text, version) {
  const proj = getProjectById(projId);
  if (!proj) return;
  proj.context = text || '';
  if (version !== undefined) proj.contextVersion = version || '';
  save();
}

function _notesKey(projId) {
  return projId ? 'notes-' + projId : 'notes';
}

function _loadNotes(projId) {
  try {
    return JSON.parse(localStorage.getItem(_notesKey(projId)) || '[]');
  } catch { return []; }
}

function _saveNotes(projId, notes) {
  try {
    localStorage.setItem(_notesKey(projId), JSON.stringify(notes));
  } catch (e) { console.warn('[AI Tracker] _saveNotes error:', e); }
  if (typeof _supabase !== 'undefined' && _supabase && typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    const sbKey = projId ? 'notes-' + projId : 'notes-global';
    _supabase.from('tracker_docs').upsert(
      [{ user_id: _supabaseUser.id, key: sbKey, value: { notes, updatedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }],
      { onConflict: 'user_id,key' }
    ).then(({ error }) => {
      if (error) {
        console.warn('[AI Tracker] _saveNotes Supabase error:', error);
        _offlineQueuePush({ type: 'notes', projId: projId || null });
      }
    });
  }
}

function _noteId() {
  return 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function createNote(text, itemRef) {
  const projId = _getActiveProjectFilter();
  const proj = projId ? getProjectById(projId) : null;
  if (!proj && projId) return null;
  const notes = _loadNotes(projId);
  const now = Date.now();
  const note = { id: _noteId(), text: text || '', createdAt: now, updatedAt: now };
  if (itemRef) note.itemRef = itemRef;
  notes.push(note);
  _saveNotes(projId, notes);
  if (proj) { proj.quickNotes = notes; save(); }
  return note;
}

function editNote(noteId, text, itemRef) {
  const projId = _getActiveProjectFilter();
  const proj = projId ? getProjectById(projId) : null;
  const notes = _loadNotes(projId);
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx === -1) return false;
  notes[idx].text = text !== undefined ? text : notes[idx].text;
  notes[idx].updatedAt = Date.now();
  if (itemRef !== undefined) {
    if (itemRef) notes[idx].itemRef = itemRef;
    else delete notes[idx].itemRef;
  }
  _saveNotes(projId, notes);
  if (proj) { proj.quickNotes = notes; save(); }
  return true;
}

function deleteNote(noteId) {
  const projId = _getActiveProjectFilter();
  const proj = projId ? getProjectById(projId) : null;
  const notes = _loadNotes(projId);
  const filtered = notes.filter(n => n.id !== noteId);
  if (filtered.length === notes.length) return false;
  _saveNotes(projId, filtered);
  if (proj) { proj.quickNotes = filtered; save(); }
  return true;
}

function getActiveProjectNotes() {
  const projId = _getActiveProjectFilter();
  return _loadNotes(projId);
}

function _filteredAIs() {
  const state = getState();
  const filterId = _getActiveProjectFilter();
  if (!filterId) return state.ais;
  const proj = getProjectById(filterId);
  if (!proj) return state.ais;
  const aiIds = new Set((proj.sessions || []).map(s => s.aiId).filter(Boolean));
  return state.ais.filter(a => aiIds.has(a.id));
}

// Init backlog si hay ítems
if (typeof getItems() !== 'undefined' && getItems().length) {
  const ftypes = document.getElementById('filter-bar-types');
  const fstatus = document.getElementById('filter-bar-status');
  if (ftypes) ftypes.classList.remove('is-hidden');
  if (fstatus) fstatus.classList.remove('is-hidden');
  renderStats();
  updateBacklogBanner();
  updateStatusFilterUI();
  updateBacklogFooter();
}

document.addEventListener('DOMContentLoaded', function _sprintProjectUIInit() {
  document.querySelectorAll('.tracker-only').forEach(el => el.classList.add('is-hidden'));
  document.querySelectorAll('.analytics-only').forEach(el => el.classList.add('is-hidden'));
  const _savedTab = localStorage.getItem('active-tab');
  switchTab(_savedTab || 'tracker');
  loadHtmlMap();
  if (typeof renderHoy === 'function') renderHoy();
  if (typeof renderAIStatusBar === 'function') renderAIStatusBar();
  if (typeof _updateProjBreadcrumb === 'function') _updateProjBreadcrumb();
  if (typeof _updateProjFilterBtn === 'function') _updateProjFilterBtn();
  _updateHeaderProjectLabel();

  const _projPanelOverlay = document.getElementById('proj-panel-overlay');
  if (_projPanelOverlay) {
    _projPanelOverlay.addEventListener('click', function(e) {
      if (e.target === _projPanelOverlay) closeProjPanel();
    });
  }
  const _projPanelCloseBtn = document.getElementById('proj-panel-close-btn');
  if (_projPanelCloseBtn) _projPanelCloseBtn.addEventListener('click', closeProjPanel);
  const _projPanelNuevoBtn = document.getElementById('proj-panel-btn-nuevo');
  if (_projPanelNuevoBtn) _projPanelNuevoBtn.addEventListener('click', function() { closeProjPanel(); openProjModal(); });
  const _projPanelGestionarBtn = document.getElementById('proj-panel-btn-gestionar');
  if (_projPanelGestionarBtn) _projPanelGestionarBtn.addEventListener('click', function() { closeProjPanel(); openProjModal(); });

  const _projModalOverlay = document.getElementById('proj-modal-overlay');
  if (_projModalOverlay) {
    _projModalOverlay.addEventListener('click', function(e) {
      if (e.target === _projModalOverlay) closeProjModal();
    });
  }
  const _projModalCloseBtn = document.getElementById('proj-modal-close-btn');
  if (_projModalCloseBtn) _projModalCloseBtn.addEventListener('click', closeProjModal);
  const _projFormCancelBtn = document.getElementById('proj-form-cancel-btn');
  if (_projFormCancelBtn) _projFormCancelBtn.addEventListener('click', cancelProjForm);
  const _projFormConfirmBtn = document.getElementById('proj-form-confirm-btn');
  if (_projFormConfirmBtn) _projFormConfirmBtn.addEventListener('click', confirmProjForm);
  const _projNameInput = document.getElementById('proj-name-input');
  if (_projNameInput) _projNameInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') confirmProjForm(); });
});

// T-047: inicializar botón de rango activo al cargar
(function() {
  const saved = parseInt(localStorage.getItem('analytics-range') || '3', 10);
  if (typeof setAnalyticsRange === 'function') setAnalyticsRange(saved);
  document.querySelectorAll('.range-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.range) === saved);
  });
})();

// ── Splash screen controller ──
const SplashController = {
  splash: null,
  progressFill: null,
  statusEl: null,
  startTime: Date.now(),
  minDuration: 1200,
  
  init() {
    this.splash = document.getElementById('pepe-splash');
    this.progressFill = document.getElementById('pepe-progress-fill');
    this.statusEl = document.getElementById('splash-status');
    const title = document.title.match(/v([\\d.]+)/);
    if (title) {
      const versionEl = document.getElementById('splash-version');
      if (versionEl) versionEl.textContent = 'v' + title[1];
    }
    return this;
  },
  
  updateProgress(percent, status) {
    if (this.progressFill) {
      this.progressFill.style.setProperty('--splash-progress', percent + '%');
      if (percent === 100) {
        this.progressFill.classList.remove('indeterminate');
      }
    }
    if (this.statusEl && status) {
      this.statusEl.textContent = status;
    }
  },
  
  hide() {
    const elapsed = Date.now() - this.startTime;
    const delay = Math.max(0, this.minDuration - elapsed);
    setTimeout(() => {
      if (this.splash) {
        this.splash.classList.add('fade-out');
        setTimeout(() => {
          if (this.splash && this.splash.parentNode) {
            this.splash.remove();
          }
        }, 600);
      }
    }, delay);
  }
};

export function _getLocalStorageUsage() {
  const LIMIT = 5 * 1024 * 1024;
  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += (key + localStorage.getItem(key)).length;
    }
  }
  return { usedKB: (used / 1024).toFixed(1), totalKB: (LIMIT / 1024).toFixed(0), pct: used / LIMIT };
}

(function() {
  const PEPE_URI = document.querySelector('link[rel="icon"]').href;
  SplashController.init();
  const logoImg = document.getElementById('pepe-logo');
  if (logoImg) logoImg.src = PEPE_URI;
  const splashImg = document.getElementById('pepe-splash-img');
  if (splashImg) splashImg.src = PEPE_URI;
  SplashController.updateProgress(20, '↓ Cargando sesiones...');
  setTimeout(() => { SplashController.updateProgress(50, '↓ Sincronizando...'); }, 300);
  setTimeout(() => { SplashController.updateProgress(85, '✓ Procesando datos...'); }, 600);
  setTimeout(() => {
    SplashController.updateProgress(100, '✓ Listo');
    setTimeout(() => { SplashController.hide(); }, 400);
  }, 900);
})();

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// T-202606-016: funciones de export removidas de window.* — viven en locus-backlog-generator.js
window.getProjectById            = getProjectById;
window._getActiveProjectFilter   = _getActiveProjectFilter;
window.pad                       = window.pad || pad;
window._sprintNum                = _sprintNum;
window.openProjPanel             = openProjPanel;
window.selectProjectFilter       = selectProjectFilter;
window._docPrefix                = _docPrefix;
window.getProjContext            = getProjContext;
window._countProjSessions        = _countProjSessions;
window._setActiveProjectFilter   = _setActiveProjectFilter;
window._updateProjBreadcrumb     = _updateProjBreadcrumb;
window._updateProjFilterBtn      = _updateProjFilterBtn;
window.setProjContext            = setProjContext;
window._getLocalStorageUsage     = _getLocalStorageUsage;
window.openProjModal             = openProjModal;
window.closeProjPanel            = closeProjPanel;
window.closeProjModal            = closeProjModal;
window.clearProjectFilter        = clearProjectFilter;
window.renderProjPanel           = renderProjPanel;
window.cancelProjForm            = cancelProjForm;
window.selectProjColor           = selectProjColor;
window.confirmProjForm           = confirmProjForm;
window.editProjInline            = editProjInline;
window.toggleProjArchive         = toggleProjArchive;
window.deleteProjConfirm         = deleteProjConfirm;
window.projDragStart             = projDragStart;
window.projDragEnd               = projDragEnd;
window.projDragOver              = projDragOver;
window.projDragLeave             = projDragLeave;
window.projDrop                  = projDrop;
window.createNote                = createNote;
window.editNote                  = editNote;
window.deleteNote                = deleteNote;
window.getActiveProjectNotes     = getActiveProjectNotes;
