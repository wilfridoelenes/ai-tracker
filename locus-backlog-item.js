// [PP] v1.2.4 · sprint:PP-S-01 · mod:40 · autor:Rune · 2026-06-05 UTC-6
// locus-backlog-item.js
// Última actualización: 2026-05-24 | Renderizado de ítems individuales del backlog
// Responsabilidad: Renderizado de ítems individuales — Kanban, buildBacklogItem, promoción, merge desde TRACKER-GLOBAL.
//   showMergeDiffPanel + modales de confirmación migrados a locus-backlog-merge.js (R-202605-033)
// Dependencias: locus-backlog-core.js · locus-backlog-sprints.js · locus-backlog-editor.js · locus-toast.js
import { _applyDoneStatus, _getActiveEfforts, _getActiveRoleFilter, _getActiveStatuses, _getActiveTypes, _getBacklogKanbanMode, _getBacklogNoAcMode, _getBacklogSprintGroupMode, _getNextItemCode, _hasDepsBlocked, _hasRecentSession, _isBlocked, _isCountableItem, _openItemEditorSafe, _skelHide, _undoSnapshot, buildItemRefs, effortDots, getItems, itemType, renderStats, setItemStatus, updateBacklogBanner } from './locus-backlog-core.js';
import { _markBacklogListDirty, renderBacklogList, updateClearFilterBtn } from './locus-backlog-render.js';
import { _normalizeSprint } from './locus-session-parse.js';
import { _blogLog, _tplKey, getAI, getActiveSprints, getAllSessions, saveBacklog } from './locus-storage.js';


import { _buildItemMentionedIn, _buildItemMigratedBlock, openItemPanel } from './locus-backlog-panel.js';

import { _getActiveSprint, navigateToItem, setItemSprint, openSprintRetroView } from './locus-backlog-sprints.js';

import { _setBacklogModified } from './locus-docs.js';

import { _gconfirmOpen } from './locus-modals.js';

import { validateLifecycleTransitions } from './locus-session-save.js'; // T-202606-020

import { render } from './locus-sesiones.js';

import { showToast } from './locus-toast.js';

import { esc, getCurrentTab, switchTab } from './locus-ui-shell.js';
import { openDetail } from './locus-session-popup.js';

// Constantes canónicas del ecosistema — roles disponibles para el select de ítem
// Fuente: OB-STRATEGY §6. Actualizar aquí si se agregan/eliminan roles.
const _ECOSYSTEM_ROLES = [
  'ST · Vera', 'GW · Lena', 'CPO · Noa', 'CMO · Maya',
  'PO · Cael', 'FS · Rune', 'UX · Nova', 'QA · Finn',
  'CC · Flux', 'ET · Eden', 'GC · Sage', 'DA · Iris'
];

// Días sin cambio de status para considerar un ítem bloqueado (alineado con _isBlocked en core)
const _BLOCKED_DAYS = 14;

// Estado de colapso de bloques de hijos (R → Ts) — compartido con locus-backlog-render.js via export
export const _collapsedChildren = new Set();

// Estado de colapso del footer de filtros del backlog
let _blFooterCollapsed = false;

// Labels de tipo de ítem para display en UI
const TYPE_LABELS = { R: 'Requerimiento', T: 'Ticket', B: 'Bug', P: 'Posibilidad' };

// Helpers de badge — funciones del monolito original declaradas localmente al modularizar
function badgeLabel(priority) {
  return { high: 'Alta', medium: 'Media', low: 'Baja' }[priority] || priority || '—';
}
function badgeClass(priority) {
  return 'badge-prio-' + (priority || 'medium');
}
function statusLabel(status) {
  return { pendiente: 'Pendiente', 'en-revision': 'En revisión', done: 'Done', descartado: 'Descartado', historico: 'Histórico' }[status] || status || '—';
}
function statusClass(status) {
  return 'badge-status-' + (status || 'pendiente');
}

// B-202604-194: flag de sesión — ítems cuyo AC fue reemplazado via merge. Se vacía al recargar.
const _acReplacedSet = new Set();

// ── Estado del módulo ──────────────────────────────────────────────────────
// Búsqueda activa — compartida con locus-backlog-render.js via window.backlogSearchQuery
let backlogSearchQuery = '';
window.backlogSearchQuery = backlogSearchQuery;
// Getter/setter para mantener window sincronizado
function _getBacklogSearch() { return backlogSearchQuery; }
function _setBacklogSearch(v) { backlogSearchQuery = v; window.backlogSearchQuery = v; }
// Filtro de tipo activo
let currentFilter = 'all';
// ──────────────────────────────────────────────────────────────────────────

export function _renderKanban(listEl) {
  // R-202604-091: 3 columnas — 'en curso' eliminado, ítems activos decorados en 'pendiente'
  const COLS = [
    { id: 'pendiente',  label: 'Pendiente',  status: 'pendiente',  colorVar: 'var(--text2)',  accentColor: 'rgba(124,106,247,0.4)' },
    { id: 'done',       label: 'Hecho',        status: 'done',       colorVar: '#2ecc78',       accentColor: 'rgba(46,204,120,0.4)' },
    { id: 'descartado', label: 'Descartado',  status: 'descartado', colorVar: 'var(--hint)',   accentColor: 'rgba(120,120,120,0.3)' }
  ];

  // Mapeo de status normalizados para compatibilidad
  function _kanbanStatus(item) {
    // R-202604-091: 'en curso' → 'pendiente'
    const s = item.status;
    if (s === 'in-progress' || s === 'en progreso' || s === 'progreso' || s === 'en curso') return 'pendiente';
    return s; // pendiente | done | descartado
  }

  // Filtrar aplicando los mismos filtros activos del backlog
  const q = backlogSearchQuery;
  let allFiltered = getItems().filter(i => {
    const type = itemType(i.code);
    const typeOk = type ? _getActiveTypes().has(type) : true;
    const _rawEffortK = parseInt(i.effort) || 1;
    const _normEffortK = _rawEffortK > 3 ? 3 : _rawEffortK < 1 ? 1 : _rawEffortK;
    const effortOk = _getActiveEfforts().has(_normEffortK); // B-202605-233: effort >3 normalizado a 3
    let roleOk = true;
    if (_getActiveRoleFilter() === '__none__') roleOk = !i.role || !i.role.trim();
    else if (_getActiveRoleFilter() !== null) roleOk = (i.role || '').trim() === _getActiveRoleFilter();
    return typeOk && effortOk && roleOk && i.status !== 'historico'; // B-202605-266
  });
  if (q) {
    allFiltered = allFiltered.filter(i =>
      i.code.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      (i.area || '').toLowerCase().includes(q)
    );
  }

  // Agrupar por columna
  const byCol = {};
  COLS.forEach(c => { byCol[c.id] = []; });
  allFiltered.forEach(item => {
    const cs = _kanbanStatus(item);
    if (byCol[cs]) byCol[cs].push(item);
    else byCol['pendiente'].push(item); // fallback
  });

  // Construir card Kanban (compacta: código + tipo + título + sprint + effort)
  function _kanbanCard(item) {
    const type = itemType(item.code) || '';
    const typeColors = { T:'#2ecc78', R:'#38bdf8', B:'#e85555', P:'#7c6af7' };
    const typeColor = typeColors[type] || 'var(--hint)';
    const effortN = parseInt(item.effort) || 0;
    const dots = Array.from({length:3}, (_,i) =>
      `<span class="kb-effort-dot${i < effortN ? ' on' : ''}"></span>`
    ).join('');
    const sprintBadge = item.sprint ? `<span class="kb-card-sprint">${esc(item.sprint)}</span>` : '';
    const prioBadge = (!item.status || item.status === 'pendiente') && item.priority && item.priority !== 'medium'
      ? `<span class="kb-card-prio kb-prio-${item.priority}">${badgeLabel(item.priority)}</span>` : '';
    const kbIsActive = _isActiveRecently(item);
    // T-202605-449: tratamiento visual Kanban para ítems bloqueados por dependencia
    const kbIsDepBlocked = _hasDepsBlocked(item);
    const kbDepBadge = kbIsDepBlocked ? '<span class="kb-dep-blocked-badge" title="Tiene dependencias pendientes">🔒</span>' : '';
    return `<div class="kb-card${kbIsActive ? ' kb-card--active' : ''}${kbIsDepBlocked ? ' kb-card--dep-blocked' : ''}" data-code="${esc(item.code)}" data-status="${esc(item.status)}"
        style="--kb-type-color:${typeColor}"
        draggable="true">
      <div class="kb-card-header">
        <span class="kb-card-type">${type}</span>
        <span class="kb-card-code">${esc(item.code)}</span>
        <div class="kb-card-header-right">${kbDepBadge}${kbIsActive ? '<span class="kb-activity-dot" title="Actividad reciente"></span>' : ''}${prioBadge}</div>
      </div>
      <div class="kb-card-title">${esc(item.title)}</div>
      <div class="kb-card-footer">
        ${sprintBadge}
        <div class="kb-effort-dots">${dots}</div>
        ${item.area ? `<span class="kb-card-area">${esc(item.area)}</span>` : ''}
      </div>
    </div>`;
  }

  // Construir HTML de columnas
  let html = '<div class="kb-board">';
  COLS.forEach(col => {
    const colItems = byCol[col.id];
    html += `<div class="kb-col" id="kb-col-${col.id}"
        data-col-status="${col.id}">
      <div class="kb-col-header" style="--col-accent:${col.accentColor}">
        <span class="kb-col-title">${col.label}</span>
        <span class="kb-col-count">${colItems.length}</span>
      </div>
      <div class="kb-col-body" id="kb-body-${col.id}">
        ${colItems.length ? colItems.map(_kanbanCard).join('') : `<div class="kb-col-empty">Sin ítems</div>`}
      </div>
    </div>`;
  });
  html += '</div>';

  listEl.classList.add('kb-active');
  listEl.innerHTML = html;
  _skelHide(listEl);
}

// T-202604-287: handler drop Kanban — reutiliza setItemStatus con lógica de confirmación existente
function _kbDrop(event, toStatus) {
  event.preventDefault();
  const col = event.currentTarget;
  col.classList.remove('kb-col-dragover');
  const code = event.dataTransfer.getData('text/plain');
  if (!code) return;
  // Mapear columna 'progreso' al status real del sistema
  // R-202604-091: solo 3 columnas — 'en-curso' eliminado
  // Se almacena como 'in-progress' en item.status para conservar estado
  // R-202604-091: 'en-curso' eliminado del statusMap
  const statusMap = { pendiente: 'pendiente', done: 'done', descartado: 'descartado' };
  const newStatus = statusMap[toStatus] || toStatus;
  setItemStatus(code, newStatus);
}

// T-202604-287: click en card Kanban abre el editor del ítem
function _kbCardClick(event, code) {
  // No abrir si fue un drag (el drag pone clase antes del click)
  if (event.defaultPrevented) return;
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  _openItemEditorSafe(item.id || null, code); // B-202605-012
}

// T-202605-054: delegación de eventos para #backlog-list — reemplaza handlers inline
// Cubre: copyItemCode · copyItemToClipboard · _inlineEditTitle · _confirmUnlinkChild
//        child-expand · drag-handle · kanban card (click + drag) · kb-col (drag) · _promoteSelectType
export function _attachBacklogListDelegation() {
  const listEl = document.getElementById('backlog-list');
  if (!listEl || listEl._delegationAttached) return;
  listEl._delegationAttached = true;

  // --- Click delegation ---
  listEl.addEventListener('click', function _blListClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const act = action.dataset.action;

    if (act === 'copy-code') {
      e.stopPropagation();
      const code = action.dataset.code;
      const idx  = parseInt(action.dataset.idx, 10);
      if (typeof copyItemCode === 'function') copyItemCode(e, code, idx);
      return;
    }
    if (act === 'copy-item') {
      e.stopPropagation();
      if (typeof copyItemToClipboard === 'function') copyItemToClipboard(e, action.dataset.code);
      return;
    }
    if (act === 'unlink-child') {
      e.stopPropagation();
      if (typeof _confirmUnlinkChild === 'function') _confirmUnlinkChild(action.dataset.childCode, action.dataset.rCode);
      return;
    }
    if (act === 'child-expand') {
      e.stopPropagation();
      const code   = action.dataset.childCode;
      const safeId = action.dataset.safeId;
      const ci = getItems().findIndex(x => x.code === code);
      if (ci >= 0) toggleItemExpand(ci);
      const arrow = document.getElementById('ciarrow-' + safeId);
      const body  = document.getElementById('ibody-'  + safeId);
      if (arrow && body) arrow.textContent = body.classList.contains('open') ? '▾' : '▸';
      return;
    }
    if (act === 'drag-handle') {
      e.stopPropagation();
      return;
    }
    // kanban card click
    if (act === 'kb-card-click' || e.target.closest('.kb-card')) {
      const card = e.target.closest('.kb-card');
      if (!card) return;
      if (e.defaultPrevented) return;
      if (typeof _kbCardClick === 'function') _kbCardClick(e, card.dataset.code);
      return;
    }
    if (act === 'ref-chip-session') {
      switchTab('sesiones');
      setTimeout(() => { openDetail(action.dataset.aiId, action.dataset.sessId); }, 120);
      return;
    }
    if (act === 'item-expand') {
      const idx = parseInt(action.dataset.idx, 10);
      if (typeof toggleItemExpand === 'function') toggleItemExpand(idx);
      return;
    }
    if (act === 'edit-child') {
      e.stopPropagation();
      _openItemEditorSafe(null, action.dataset.code);
      return;
    }
    if (act === 'toggle-children') {
      e.stopPropagation();
      if (typeof toggleChildrenBlock === 'function') toggleChildrenBlock(action.dataset.rCode);
      return;
    }
    if (act === 'navigate-origin') {
      e.stopPropagation();
      navigateToItem(action.dataset.origin);
      return;
    }
    if (act === 'quick-assign-effort') {
      e.stopPropagation();
      if (typeof _quickAssignEffort === 'function') _quickAssignEffort(action.dataset.code);
      return;
    }
    if (act === 'open-blocker') {
      e.stopPropagation();
      openItemPanel(action.dataset.code);
      return;
    }
    if (act === 'promote-item') {
      e.stopPropagation();
      if (typeof _promoteItem === 'function') _promoteItem(action.dataset.code);
      return;
    }
    if (act === 'discard-idea') {
      e.stopPropagation();
      setItemStatus(action.dataset.code, 'descartado');
      return;
    }
    if (act === 'open-status-popover') {
      if (typeof _openStatusPopover === 'function') _openStatusPopover(e, action.dataset.code);
      return;
    }
    if (act === 'navigate-discard-ref') {
      e.stopPropagation();
      navigateToItem(action.dataset.ref);
      return;
    }
    if (act === 'bitem-edit') {
      _openItemEditorSafe(null, action.dataset.code);
      return;
    }
    if (act === 'bitem-promote') {
      e.stopPropagation();
      if (typeof _promoteItem === 'function') _promoteItem(action.dataset.code);
      return;
    }
    if (act === 'bitem-promote-ttor') {
      e.stopPropagation();
      if (typeof _promoteTtoR === 'function') _promoteTtoR(action.dataset.code);
      return;
    }
    if (act === 'bitem-migrate') {
      e.stopPropagation();
      if (typeof _openMigrateItem === 'function') _openMigrateItem(action.dataset.code);
      return;
    }
    if (act === 'promote-modal-cancel') {
      const overlay = document.getElementById('promote-modal-overlay');
      if (overlay) overlay.classList.remove('open');
      return;
    }
    if (act === 'promote-confirm') {
      if (typeof _promoteConfirm === 'function') _promoteConfirm(action.dataset.code);
      return;
    }
    if (act === 'promote-ttor-cancel') {
      const overlay = document.getElementById('promote-modal-overlay');
      if (overlay) overlay.classList.remove('open');
      return;
    }
    if (act === 'promote-ttor-confirm') {
      if (typeof _promoteTtoRConfirm === 'function') _promoteTtoRConfirm(action.dataset.code);
      return;
    }
    if (act === 'acv-toggle') {
      e.stopPropagation();
      if (typeof _acvToggle === 'function') _acvToggle(action.dataset.panelId);
      return;
    }
    if (act === 'acv-open-editor') {
      e.stopPropagation();
      _openItemEditorSafe(null, action.dataset.code);
      return;
    }
    if (act === 'acv-clarify') {
      e.stopPropagation();
      if (typeof _acvStartEdit === 'function') _acvStartEdit(action.dataset.rowId, action.dataset.code, parseInt(action.dataset.ci, 10));
      return;
    }
    if (act === 'acv-confirm') {
      e.stopPropagation();
      if (typeof _acvConfirm === 'function') _acvConfirm(action.dataset.code, action.dataset.panelId);
      return;
    }
    if (act === 'bitem-meta-stop') {
      e.stopPropagation();
      return;
    }
    if (act === 'status-change') {
      e.stopPropagation();
      setItemStatus(action.dataset.code, action.value || action.dataset.value);
      return;
    }
    // Render-level actions (from locus-backlog-render.js)
    if (act === 'bl-sprint-retro') {
      e.stopPropagation();
      openSprintRetroView(action.dataset.sprintId);
      return;
    }
    if (act === 'bl-plan-close') {
      const cb = action.dataset.callback;
      if (cb && window[cb]) { window[cb](); }
      else if (typeof toggleBacklogPlanningMode === 'function') { toggleBacklogPlanningMode(); }
      return;
    }
    if (act === 'es-switch-tab') {
      switchTab(action.dataset.tab);
      return;
    }
    if (act === 'es-open-proj-panel') {
      if (typeof openProjPanel === 'function') openProjPanel();
      return;
    }
    if (act === 'es-open-new-sprint') {
      if (typeof openNewSprintInline === 'function') openNewSprintInline();
      return;
    }
    if (act === 'es-clear-search') {
      if (typeof clearBacklogSearch === 'function') clearBacklogSearch();
      return;
    }
    if (act === 'es-toggle-mike') {
      if (typeof toggleBacklogMikeMode === 'function') toggleBacklogMikeMode();
      return;
    }
    if (act === 'es-toggle-focus') {
      if (typeof toggleBacklogFocusMode === 'function') toggleBacklogFocusMode();
      return;
    }
    if (act === 'es-filter-all') {
      setFilter('all');
      return;
    }
    if (act === 'es-clear-filters') {
      const btn = document.getElementById('filter-clear-btn');
      if (btn) btn.click();
      return;
    }
    if (act === 'version-collapse') {
      if (typeof toggleVersionCollapse === 'function') toggleVersionCollapse(action.dataset.groupId);
      return;
    }
    if (act === 'section-group-toggle') {
      if (typeof toggleSectionGroup === 'function') toggleSectionGroup(action.dataset.group);
      return;
    }
  });

  // --- Change delegation (status-select, role, sprint, parent) ---
  listEl.addEventListener('change', function _blListChange(e) {
    const sel = e.target.closest('.item-status-select');
    if (!sel) return;
    e.stopPropagation();
    const code = sel.dataset.code;
    const type = sel.dataset.selectType;
    if (!code) return;
    if (type === 'role') {
      if (typeof setItemRole === 'function') setItemRole(code, sel.value);
    } else if (type === 'sprint') {
      setItemSprint(code, sel.value);
    } else if (type === 'parent') {
      if (typeof setItemParent === 'function') setItemParent(code, sel.value);
    } else {
      // status select (no data-select-type)
      setItemStatus(code, sel.value);
    }
  });

  // --- Dblclick delegation (inline edit title) ---
  listEl.addEventListener('dblclick', function _blListDblClick(e) {
    const action = e.target.closest('[data-action="inline-edit-title"]');
    if (!action) return;
    e.stopPropagation();
    if (typeof _inlineEditTitle === 'function') _inlineEditTitle(action.dataset.code, e);
  });

  // --- Kanban card drag ---
  listEl.addEventListener('dragstart', function _blListDragStart(e) {
    // kb-card drag
    const card = e.target.closest('.kb-card');
    if (card) {
      e.dataTransfer.setData('text/plain', card.dataset.code);
      card.classList.add('kanban-card--dragging');
      return;
    }
  });
  listEl.addEventListener('dragend', function _blListDragEnd(e) {
    const card = e.target.closest('.kb-card');
    if (card) { card.classList.remove('kanban-card--dragging'); return; }
  });

  // --- Kanban column drag (kb-col) ---
  listEl.addEventListener('dragover', function _blListDragOver(e) {
    const col = e.target.closest('.kb-col');
    if (col) { e.preventDefault(); col.classList.add('kb-col-dragover'); }
  });
  listEl.addEventListener('dragleave', function _blListDragLeave(e) {
    const col = e.target.closest('.kb-col');
    if (col) col.classList.remove('kb-col-dragover');
  });
  listEl.addEventListener('drop', function _blListDrop(e) {
    const col = e.target.closest('.kb-col');
    if (col) {
      e.preventDefault();
      col.classList.remove('kb-col-dragover');
      if (typeof _kbDrop === 'function') _kbDrop(e, col.dataset.colStatus);
    }
  });
}

// _attachBacklogListDelegation: llamado al final de renderBacklogList (ver locus-backlog-render.js)

// Promote modal delegation — #promote-modal-overlay es DOM estático, attachment único
(function _attachPromoteModalDelegation() {
  document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('promote-modal-overlay');
    if (!overlay) return;
    overlay.addEventListener('click', function(e) {
      const action = e.target.closest('[data-action="promote-select-type"]');
      if (!action) return;
      if (typeof _promoteSelectType === 'function') _promoteSelectType(action.dataset.type);
    });
  });
})();

// T-202604-076: DnD para reordenar ítems dentro de grupo sprint (no aplica a done/descartado ni a modo plano)
export function _attachBacklogDnD() {
  // B-202605-013: T-202604-424 eliminó 'sprint' como valor de backlogSortMode — guard era inalcanzable.
  // DnD activo cuando la agrupación por sprint está activa y no hay modo exclusivo que tome el rendering.
  if (!_getBacklogSprintGroupMode() || _getBacklogKanbanMode() || _getBacklogNoAcMode()) return;
  // Solo grupos sprint: vbody-{groupId} — excluye sgbody-done, sgbody-discarded y vbody-flat
  const sprintBodies = document.querySelectorAll('[id^="vbody-"]:not(#vbody-flat)');
  sprintBodies.forEach(body => {
    const items = body.querySelectorAll('.item[data-code]');
    items.forEach(el => {
      const handle = el.querySelector('.item-drag-handle');
      if (!handle) return; // sin handle = sin sprint = no draggable
      el.draggable = true;
      handle.addEventListener('mousedown', () => { handle.classList.add('cursor-grabbing'); });
      handle.addEventListener('mouseup', () => { handle.classList.remove('cursor-grabbing'); });
      el.addEventListener('dragstart', e => {
        // B-202605-013: eliminado guard e.target === handle — dragstart dispara en el (.item), no en el handle
        // La activación ya está acotada: solo ítems con .item-drag-handle llegan aquí (guard L3650)
        e.dataTransfer.setData('text/plain', el.dataset.code);
        el.classList.add('item-dragging');
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('item-dragging');
        handle.classList.remove('cursor-grabbing');
      });
      el.addEventListener('dragover', e => {
        e.preventDefault();
        el.classList.add('item-drag-over');
      });
      el.addEventListener('dragleave', () => {
        el.classList.remove('item-drag-over');
      });
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('item-drag-over');
        const fromCode = e.dataTransfer.getData('text/plain');
        const toCode = el.dataset.code;
        if (!fromCode || fromCode === toCode) return;
        const fromIdx = getItems().findIndex(i => i.code === fromCode);
        const toIdx   = getItems().findIndex(i => i.code === toCode);
        if (fromIdx < 0 || toIdx < 0) return;
        if ((getItems()[fromIdx].sprint || '') !== (getItems()[toIdx].sprint || '')) return;
        const [moved] = getItems().splice(fromIdx, 1);
        getItems().splice(toIdx, 0, moved);
        _undoSnapshot();
        saveBacklog();
        _markBacklogListDirty(); renderBacklogList();
      });
    });
  });
}

// T-202604-074: edición inline de título con doble click
function _inlineEditTitle(code, e) {
  e.stopPropagation(); // evitar toggleItemExpand
  const span = e.target.closest('[data-action="inline-edit-title"]');
  const item = getItems().find(i => i.code === code);
  if (!item) return;

  const originalTitle = item.title;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'item-title-edit-input';
  input.value = originalTitle;

  span.replaceWith(input);
  input.focus();
  input.select();

  function _commit() {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== originalTitle) {
      item.title = newTitle;
      _undoSnapshot();
      saveBacklog();
    }
    _markBacklogListDirty(); renderBacklogList();
  }

  function _cancel() {
    _markBacklogListDirty(); renderBacklogList();
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); _commit(); }
    if (e.key === 'Escape') { e.preventDefault(); _cancel(); }
    e.stopPropagation();
  });
  input.addEventListener('blur', _commit);
  input.addEventListener('click', e => e.stopPropagation());
}

// T-202604-048: construir mini progress-bar de hijos para R
// T-202604-187/188: _buildChildrenBlock con colapsable y progreso
function _buildChildrenBlock(rCode) {
  // B-202604-158: respetar filtros activos — solo mostrar hijos que pasan tipo y status
  const allChildren = getItems().filter(i => i.parentId === rCode);
  if (!allChildren.length) return '';
  const children = allChildren.filter(i => {
    const t = itemType(i.code);
    const typeOk = t ? _getActiveTypes().has(t) : true;
    const statusOk = _getActiveStatuses().has(i.status);
    return typeOk && statusOk;
  });
  if (!children.length) return '';
  const doneCount = children.filter(i => i.status === 'done').length;
  const pct = Math.round((doneCount / children.length) * 100);
  const isCollapsed = _collapsedChildren.has(rCode);

  const childRows = children.map(child => {
    // B-202605-011: IDs de DOM desde item.code — estables ante mutaciones de getItems()
    const cSafeId = child.code.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cType = itemType(child.code) || '';
    const isDoneC = child.status === 'done';
    return `<div class="child-item t-item${isDoneC ? ' is-done' : ''}">
      <span class="child-collapse-arrow" id="ciarrow-${cSafeId}" data-action="child-expand" data-child-code="${esc(child.code)}" data-safe-id="${cSafeId}">&#x25B8;</span>
      <span class="item-type-pill ${cType} item-type-pill--sm">${cType}</span>
      <span class="child-title" data-action="child-expand" data-child-code="${esc(child.code)}" data-safe-id="${cSafeId}">${esc(child.title)}</span>
      <span class="badge ${statusClass(child.status)} badge--sm">${statusLabel(child.status)}</span>
    </div>
    <div class="item-body item-body--child" id="ibody-${cSafeId}">
      <div id="code-badge-${cSafeId}" data-action="copy-code" data-code="${esc(child.code)}" data-idx="-1" title="Click para copiar ID" class="item-code-badge">${esc(child.code)}</div>
      <div class="child-meta-row">
        <span class="badge ${badgeClass(child.priority)} badge--sm">${badgeLabel(child.priority)}</span>
        ${child.area ? `<span class="badge badge-area badge--sm">${esc(child.area)}</span>` : ''}
        ${child.effort ? `<div class="effort-dots effort-dots--inline">${effortDots(child.effort)}</div>` : ''}
      </div>
      ${child.ac && child.ac.length ? `<ul class="ac-list open ac-list--child">${child.ac.map(c => `<li class="ac-list-item--sm">${esc(c)}</li>`).join('')}</ul>` : ''}
      <div class="child-actions">
        <button data-action="edit-child" data-code="${esc(child.code)}" class="btn-ghost btn-ghost--sm" title="Editar ítem">✎ Editar</button>
        <button data-action="unlink-child" data-child-code="${esc(child.code)}" data-r-code="${esc(rCode)}" class="btn-ghost btn-ghost--sm btn-ghost--muted" title="Desvincular del R padre">⊠ Desvincular</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="r-children-block">
    <div class="r-children-header" data-action="toggle-children" data-r-code="${esc(rCode)}">>
      <span class="r-children-tickets-label">Tickets</span>
      <div class="r-children-bar-wrap"><div class="r-children-bar" style="--rch-bar-w:${pct}%"></div></div>
      <span class="r-children-label">${doneCount}/${children.length} · ${pct}%</span>
      <span id="rchildren-arrow-${esc(rCode)}" class="r-children-arrow">${isCollapsed ? '▸' : '▾'}</span>
    </div>
    <div class="r-children-list${isCollapsed ? ' collapsed' : ''}" id="rchildren-body-${esc(rCode)}"><div class="r-children-inner">${childRows}</div></div>
  </div>`;
}

// T-202604-004: desvincular child de R padre con confirmación
function _confirmUnlinkChild(childCode, rCode) {
  _gconfirmOpen({
    title: 'Desvincular ítem',
    msg: `¿Desvincular ${childCode} de ${rCode}? El ítem quedará sin padre.`,
    okLabel: 'Desvincular',
    danger: true
  }, () => {
    const item = getItems().find(i => i.code === childCode);
    if (item) { item.parentId = null; saveBacklog(); _markBacklogListDirty(); renderBacklogList(); renderStats(); showToast('success', `${childCode} desvinculado`); }
  });
}

// T-202604-028: timestamps legibles para item-body
function _buildItemTimestamps(item) {
  const _fmt = ts => {
    if (!ts) return null;
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays/7)} sem.`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays/30)} mes${Math.floor(diffDays/30)>1?'es':''}`;
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  };
  const _iso = ts => ts ? new Date(ts).toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' }) : '';
  const rows = [];
  if (item.createdAt) rows.push(`<span title="${_iso(item.createdAt)}">📅 Creado: <strong>${_fmt(item.createdAt)}</strong></span>`);
  if (item.statusChangedAt) rows.push(`<span title="${_iso(item.statusChangedAt)}">🔄 Último cambio: <strong>${_fmt(item.statusChangedAt)}</strong></span>`);
  if (item.doneAt) rows.push(`<span title="${_iso(item.doneAt)}">✅ Completado: <strong>${_fmt(item.doneAt)}</strong></span>`);
  if (!rows.length) return '';
  return `<div class="bitem-timestamps">${rows.join('')}</div>`;
}

// R-[pendiente-ID]: bloque de origen P padre — muestra enlace al P que originó este ítem
function _buildItemPOriginBlock(item) {
  if (!item.origin) return '';
  const pItem = getItems().find(i => i.code === item.origin);
  const pTitle = pItem ? esc(pItem.title) : '';
  return `<div class="bitem-origin-p-block">
    <span class="bitem-origin-p-label">Origen</span>
    <button class="bitem-origin-p-link" data-action="navigate-origin" data-origin="${esc(item.origin)}" title="${pTitle}">${esc(item.origin)}</button>
    ${pTitle ? `<span class="bitem-origin-p-name" title="${pTitle}">${pTitle}</span>` : ''}
  </div>`;
}

// T-202604-NNN: bloque de origen — IA, sesión y archivos relacionados del ítem
function _buildItemOriginBlock(item) {
  if (!item.sessionId) return '';

  // getAllSessions() retorna sesiones planas con s.aiId — no {sess,ai} pairs
  const allSessions = getAllSessions();
  const foundSess = allSessions.find(s => s && s.id === item.sessionId);
  if (!foundSess) return '';

  const foundAi = getAI(foundSess.aiId);

  const aiName = foundAi ? esc(foundAi.name || foundAi.id) : '—';
  const aiAvatar = (foundAi && foundAi.avatar) ? `<span class="bitem-origin-avatar">${foundAi.avatar}</span>` : '';

  // Fecha de sesión
  const _fmtSessDate = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  };
  const sessDate = foundSess.date ? esc(foundSess.date) : _fmtSessDate(foundSess.savedAt || foundSess.createdAt);
  const sessTitle = foundSess.title ? esc(foundSess.title) : '';
  const sessLabel = sessTitle ? `${sessTitle}${sessDate ? ' · ' + sessDate : ''}` : (sessDate || foundSess.id);

  // Archivos relacionados — sess.files es string (texto libre del paste), convertir a array
  const _filesRaw = foundSess.files || foundSess.archivos || '';
  const files = Array.isArray(_filesRaw)
    ? _filesRaw.filter(Boolean)
    : _filesRaw.split(/[\n,]+/).map(f => f.trim()).filter(Boolean);
  const filesHtml = files.length
    ? `<div class="bitem-origin-row bitem-origin-row--files">
        <span class="bitem-origin-label">Archivos</span>
        <div class="bitem-origin-files">
          ${files.map(f => `<span class="bitem-origin-file-pill" title="${esc(f)}">${esc(f)}</span>`).join('')}
        </div>
       </div>`
    : '';

  return `<div class="bitem-origin-block">
    <div class="bitem-origin-row">
      <span class="bitem-origin-label">IA</span>
      <span class="bitem-origin-value">${aiAvatar}${aiName}</span>
    </div>
    <div class="bitem-origin-row bitem-origin-row--mt">
      <span class="bitem-origin-label">Sesión</span>
      <span class="bitem-origin-value" title="${esc(foundSess.id || '')}">${sessLabel}</span>
    </div>
    ${filesHtml}
  </div>`;
}

// R-202605-010: status chip popover — un solo popover activo a la vez
let _statusPopoverCode = null;
function _openStatusPopover(e, code) {
  e.stopPropagation();
  // Cerrar popover previo
  const prev = document.getElementById('status-popover');
  if (prev) prev.remove();
  if (_statusPopoverCode === code) { _statusPopoverCode = null; return; }
  _statusPopoverCode = code;

  const item = getItems().find(i => i.code === code);
  if (!item) { _statusPopoverCode = null; return; }

  const isIdea = (itemType(code) || '') === 'P';
  const options = [
    { val: 'pendiente', label: 'Pendiente' },
    ...(!isIdea ? [{ val: 'en-revision', label: 'En revisión' }] : []),
    ...(!isIdea ? [{ val: 'done', label: 'Hecho' }] : []),
    { val: 'descartado', label: 'Descartado' }
  ];

  const pop = document.createElement('div');
  pop.id = 'status-popover';
  pop.className = 'bitem-status-popover';
  pop.setAttribute('role', 'menu');
  pop.onclick = e2 => e2.stopPropagation();

  pop.innerHTML = options.map(o =>
    `<button class="bitem-status-popover-btn${item.status === o.val ? ' is-current' : ''}" data-val="${o.val}">${o.label}</button>`
  ).join('');

  pop.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const newVal = btn.dataset.val;
      pop.remove();
      _statusPopoverCode = null;
      if (newVal !== item.status) {
        try {
          setItemStatus(code, newVal);
        } catch(err) {
          showToast('error', 'Error al cambiar status', null, 3000);
          // chip revierte automáticamente tras el re-render de renderBacklogList
        }
      }
    });
  });

  document.body.appendChild(pop);

  // Posicionar bajo el chip trigger
  const trigger = e.currentTarget;
  const rect = trigger.getBoundingClientRect();
  const popW = 120;
  let left = rect.left + window.scrollX;
  if (left + popW > window.innerWidth) left = window.innerWidth - popW - 8;
  pop.style.setProperty('--sp-top', (rect.bottom + window.scrollY + 4) + 'px');
  pop.style.setProperty('--sp-left', left + 'px');

  // Cerrar con Escape
  const _escHandler = ev => {
    if (ev.key === 'Escape') { pop.remove(); _statusPopoverCode = null; document.removeEventListener('keydown', _escHandler); }
  };
  document.addEventListener('keydown', _escHandler);

  // Cerrar al click fuera
  const _outsideHandler = ev => {
    if (!pop.contains(ev.target) && ev.target !== trigger) {
      pop.remove();
      _statusPopoverCode = null;
      document.removeEventListener('click', _outsideHandler, true);
    }
  };
  setTimeout(() => document.addEventListener('click', _outsideHandler, true), 0);
}

// T-108: construir un ítem colapsado
export function buildBacklogItem(item) {
  const globalIdx = getItems().indexOf(item);
  const isDone = item.status === 'done';
  const isDiscarded = item.status === 'descartado';
  const isHistorico = item.status === 'historico'; // B-202604-193: read-only
  const type = itemType(item.code) || '';
  const typeLabel = TYPE_LABELS[type] || type;
  // R-202605-098: gate único para toda lógica diferenciada de tipo P
  const isIdea = type === 'P';

  // T-202604-050: detectar campos obligatorios faltantes (no aplica a descartados ni a P)
  // R-202605-098: P no tiene effort ni AC obligatorios — son conceptos que emergen al promoverse
  const missingFields = [];
  if (!isDiscarded) {
    if (!isIdea && !item.effort) missingFields.push('effort');
    if (!item.area)   missingFields.push('area');
    if (!isIdea && (!item.ac || !item.ac.length)) missingFields.push('ac');
  }
  // R-202605-122 AC2/AC3: badge 'sin effort' con acción rápida de asignación
  const _missingEffort = !isDiscarded && !isIdea && !item.effort;
  const _effortQuickBadge = _missingEffort
    ? `<span class="badge-missing badge-missing--effort" title="Esfuerzo no declarado — requerido para burndown">⚠ sin effort <button class="badge-effort-quick" data-action="quick-assign-effort" data-code="${esc(item.code || item.id)}" title="Asignar effort rápidamente">Asignar</button></span>`
    : '';
  const _otherMissing = missingFields.filter(f => f !== 'effort');
  const missingAlert = (_missingEffort || _otherMissing.length)
    ? `<div class="bitem-missing-row">${_effortQuickBadge}${_otherMissing.map(f => `<span class="badge-missing">⚠ falta ${f}</span>`).join(' ')}</div>`
    : '';

  // AC list
  const acHtml = item.ac && item.ac.length
    ? `<div class="bitem-ac-block">
        <div class="bitem-ac-header">
          <span class="bitem-ac-check">✓</span>
          <span class="bitem-ac-count">${item.ac.length} criterio${item.ac.length !== 1 ? 's' : ''}</span>
        </div>
        <ul class="bitem-ac-list open">
          ${item.ac.map(c => `<li><span class="bitem-ac-dot"></span><span>${esc(c)}</span></li>`).join('')}
        </ul>
       </div>`
    : `<div class="bitem-ac-block"><div class="bitem-ac-header bitem-ac-header--empty">Sin criterios de aceptación</div></div>`;

  // Effort dots — large version for header, styled
  const effortN = parseInt(item.effort) || 0;
  const effortDotsHtml = (() => {
    let d = '';
    for (let i = 0; i < 3; i++) d += `<span class="bitem-effort-dot${i < effortN ? ' on' : ''}"></span>`;
    return `<div class="bitem-effort-dots" title="Esfuerzo ${effortN}/3">${d}</div>`;
  })();

  // Priority color
  const prioColors = { high:'#e85555', medium:'#f59e0b', low:'var(--hint)' };
  const prioColor = prioColors[item.priority] || 'var(--hint)';
  const prioBadgeHtml = (!isDone && !isDiscarded && item.priority)
    ? `<span class="bitem-prio-badge prio-${item.priority}">${badgeLabel(item.priority)}</span>`
    : '';
  // T-202604-199: badge "Sin AC" — solo en pendiente sin criterios
  const noAcBadge = (!isDone && !isDiscarded && item.status === 'pendiente' && (!item.ac || !item.ac.length))
    ? '<span class="badge-missing badge-missing--warning">Sin AC</span>'
    : '';
  // T-202604-261: badge "bloqueado" — pendiente con sprint >14 días sin cambio de status
  const blockedBadge = _isBlocked(item)
    ? '<span class="badge-missing badge-missing--blocked" title="Sin cambio de status en más de 14 días">⛔ bloqueado</span>'
    : '';
  // R-202605-045 · T-202605-083: staleness-pill — punto único de cálculo via _staleness()
  // B-202605-048: omitir pill si item.createdAt es inválido (legacy sin timestamp) — manejado en _staleness()
  const _stalenessData = (!isDone && !isDiscarded) ? _staleness(item) : null;
  const noSessionBadge = _stalenessData
    ? `<span class="staleness-pill staleness--${_stalenessData.modifier}" title="Sin sesión vinculada — ${_stalenessData.days}d desde último cambio de status">${_stalenessData.label}</span>`
    : '';

  // Children count + progreso para R type (T-188)
  // B-202605-052: usar getItems() sin filtrar como denominador — los filtros activos no afectan el porcentaje
  const childCount = type === 'R' ? getItems().filter(i => i.parentId === item.code).length : 0;
  const childDoneCount = type === 'R' ? getItems().filter(i => i.parentId === item.code && i.status === 'done').length : 0;
  const childBadge = (type === 'R' && childCount > 0 && !isDone && !isDiscarded)
    ? `<span class="bitem-child-badge" title="${childDoneCount}/${childCount} tickets done">${childDoneCount}/${childCount} <span class="bitem-child-badge-label">tickets</span></span>`
    : '';

  // T-202604-288: badge "Bloqueado por [código]" — blockedBy explícito pendiente
  const blockedByItems = (!isDone && !isDiscarded && item.blockedBy && item.blockedBy.length)
    ? item.blockedBy.filter(c => { const dep = getItems().find(i => i.code === c); return !dep || dep.status !== 'done'; })
    : [];
  const blockedByBadge = blockedByItems.length
    ? blockedByItems.map(c =>
        `<span class="badge-missing badge-missing--blocked badge-blocked-by" data-action="open-blocker" data-code="${esc(c)}" title="Ir al ítem bloqueante">🔒 ${esc(c)}</span>`
      ).join('')
    : '';

  // R-202604-051: badge blocking:true — ítem bloqueante activo
  const blockingBadge = (!isDone && !isDiscarded && item.blocking)
    ? `<span class="badge-blocking" title="Este ítem bloquea a otros — debe resolverse primero">⚠ bloqueante</span>`
    : '';

  // B-202604-194: badge "AC actualizados" — flag de sesión en _acReplacedSet, desaparece al recargar
  const acReplacedBadge = (!isDone && !isDiscarded && _acReplacedSet.has(item.id))
    ? '<span class="badge-ac-replaced" title="Los criterios de aceptación fueron reemplazados en esta sesión via merge">↺ AC</span>'
    : '';

  // R-202604-091: decorador de actividad reciente — sesión vinculada en los últimos 7 días
  const isActive = (!isDone && !isDiscarded) ? _isActiveRecently(item) : false;

  // R-202605-131: badge scope added — ítem añadido durante el sprint activo
  const scopeAddedBadge = (!isDone && !isDiscarded && item.scope_added)
    ? '<span class="badge-scope-added" title="Añadido al sprint después de su apertura">＋ scope</span>'
    : '';

  // Header right slot
  // R-202605-098: para P pendiente — acciones inline en header sin necesidad de expandir
  const _ideaQuickActions = (isIdea && !isDiscarded && !isDone)
    ? `<div class="item-quick-actions">
        <button class="btn-promote" data-action="promote-item" data-code="${esc(item.code)}" title="Promover a Ticket o Requerimiento">⬆ Promover</button>
        <button class="btn-discard-idea" data-action="discard-idea" data-code="${esc(item.code)}" title="Descartar esta idea">✕ Descartar</button>
       </div>`
    : '';
  // R-202605-010: status chip inline clickeable — solo para ítems pendientes (no P, no done, no descartado)
  const _statusChipHtml = (!isDone && !isDiscarded && !isIdea)
    ? `<button class="bitem-status-chip bitem-status-chip--${esc(item.status || 'pendiente')}" data-action="open-status-popover" data-code="${esc(item.code)}" title="Cambiar status" type="button">${statusLabel(item.status || 'pendiente')}</button>`
    : '';
  const headerRight = isDiscarded
    ? `<span class="bitem-discarded-icon">🗑</span>`
    : isDone
      ? `<span class="bitem-done-check">✓</span>`
      : isIdea
        ? `<div class="bitem-header-right">${_ideaQuickActions}</div>`
        : `<div class="bitem-header-right">${_statusChipHtml}${scopeAddedBadge}${noAcBadge}${acReplacedBadge}${blockingBadge}${blockedBadge}${blockedByBadge}${noSessionBadge}${childBadge}${prioBadgeHtml}${effortDotsHtml}</div>`;

  // R-202605-098: subline discard reason diferenciado para P
  // P descartado por promoción → chip con ref; P descartado manual → razón libre
  const _discardReasonHtml = (isDiscarded && item.discardReason)
    ? isIdea && item.discardRef
      ? `<span class="idea-promoted-chip" data-action="navigate-discard-ref" data-ref="${esc(item.discardRef)}" title="Ir al ítem promovido">${esc(item.discardRef)}</span>`
      : `<span class="idea-discard-reason">${esc(item.discardReason)}</span>`
    : isDiscarded && !isIdea && item.discardReason
      ? `<span class="bitem-discard-reason">🗑 ${esc(item.discardReason)}${item.discardRef ? ' · ' + esc(item.discardRef) : ''}</span>`
      : '';

  // Subline (area, sprint, discard reason, missing warning)
  const subline = `<div class="bitem-subline">
    ${item.role ? `<span class="bitem-subline-role" title="Rol responsable">${esc(item.role)}</span>` : ''}
    ${item.role && item.area ? `<span class="bitem-subline-sep">·</span>` : ''}
    ${item.area ? `<span class="bitem-subline-area" title="${esc(item.area)}">${esc(item.area)}</span>` : ''}
    ${item.area && (item.sprint || isIdea) ? `<span class="bitem-subline-sep">·</span>` : ''}
    ${item.sprint ? `<span class="bitem-subline-sprint" title="${esc((() => { const _s = getActiveSprints().find(s => s.id === item.sprint); return _s ? (_s.label || item.sprint) : item.sprint; })())}">${esc((() => { const _s = getActiveSprints().find(s => s.id === item.sprint); return _s ? _s.id : item.sprint; })())}</span>` : (isIdea && !isDone && !isDiscarded ? '<span class="bitem-no-sprint" title="Sin sprint asignado">sin sprint</span>' : '')}
    ${_discardReasonHtml}
    ${missingFields.length ? `<span class="bitem-missing-warn" title="Faltan: ${missingFields.join(', ')}">⚠</span>` : ''}
  </div>`;

  // Type block — the dominant visual element
  const typeBlock = type
    ? `<div class="bitem-type-block bitem-type-${type}">
        <span class="bitem-type-letter">${type}</span>
        <span class="bitem-type-label">${typeLabel}</span>
       </div>`
    : '';

  // R-202605-098: isPromoted — P descartado por promoción (tiene discardRef)
  const isPromoted = isIdea && isDiscarded && !!item.discardRef;
  // R-202605-165: .blf-hidden colapsa ítems fuera del Top-10 con transición 150ms ease-out
  const _blfHiddenClass = item._blfHidden ? ' blf-hidden' : '';
  const _blfAriaHidden  = item._blfHidden ? ' aria-hidden="true"' : '';
  return `<div class="item bitem${isDone ? ' is-done' : ''}${isDiscarded ? ' is-discarded' : ''}${isActive ? ' bitem--active' : ''}${isIdea ? ' bitem--idea' : ''}${isPromoted ? ' bitem--promoted' : ''}${_blfHiddenClass}" data-type="${type}" data-code="${esc(item.code)}"${_blfAriaHidden}>
    <div class="item-header bitem-header" data-action="item-expand" data-idx="${globalIdx}">
      ${(!isDone && !isDiscarded && item.sprint) ? `<span class="item-drag-handle" data-action="drag-handle" title="Arrastrar para reordenar en sprint">⠿</span>` : ''}
      ${isActive ? '<span class="bitem-activity-dot" title="Actividad reciente — sesión vinculada en los últimos 7 días"></span>' : ''}
      ${typeBlock}
      <div class="bitem-title-col">
        <span class="bitem-code" id="code-badge-${globalIdx}" data-action="copy-code" data-code="${esc(item.code)}" data-idx="${globalIdx}" title="Click para copiar ID">${item._focusRank ? `<span class="bitem-focus-rank" title="Posición en Focus">#${item._focusRank}</span> ` : ''}${esc(item.code)}</span>
        <span class="bitem-title"${(!isDone && !isDiscarded) ? ' data-action="inline-edit-title" data-code="${esc(item.code)}" title="Doble click para editar título"' : ''}>${esc(item.title)}</span>${isDiscarded && (!item.title || item.title.trim() === item.code) ? '<span class="bitem-ghost-note" title="Ítem sin título — posiblemente generado por un CHECKPOINT malformado">⚠ ítem fantasma — generado por CHECKPOINT malformado</span>' : ''}
        ${subline}
      </div>
      <button id="copy-item-btn-${esc(item.code)}" class="copy-item-btn" data-action="copy-item" data-code="${esc(item.code)}" aria-label="Copiar ítem" title="Copiar ítem para sesión FS"><svg class="copy-btn-icon copy-btn-icon--clipboard" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="5" y="2" width="9" height="12" rx="1.5"/><path d="M5 4H4a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 4 15h7a1.5 1.5 0 0 0 1.5-1.5V13"/></svg><svg class="copy-btn-icon copy-btn-icon--check is-hidden" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 8l4 4 6-6"/></svg></button>
      <span class="bitem-collapse-arrow" id="iarrow-${globalIdx}">▸</span>
      ${headerRight}
    </div>
    <div class="item-body bitem-body" id="ibody-${globalIdx}">
      ${item.notes ? `<div class="bitem-notes-block"><span class="bitem-notes-label">Notas</span><span class="bitem-notes-text">${esc(item.notes)}</span></div>` : ''}
      ${_isBlocked(item) ? `<div class="bitem-missing-row"><span class="badge-missing badge-missing--blocked">⛔ bloqueado — sin cambio de status en más de ${_BLOCKED_DAYS} días</span></div>` : ''}
      ${_stalenessData ? `<div class="bitem-missing-row"><span class="staleness-pill staleness--${_stalenessData.modifier}" title="Sin sesión vinculada — ${_stalenessData.days}d desde último cambio de status">${_stalenessData.label} sin sesión</span></div>` : ''}
      ${missingAlert}
      <div class="bitem-meta-grid" data-action="bitem-meta-stop">
        <div class="bitem-meta-cell">
          <span class="bitem-meta-label">Status</span>
          <select class="item-status-select bitem-select" data-code="${esc(item.code)}" data-action="bitem-meta-stop">
            <option value="pendiente"${item.status==='pendiente'?' selected':''}>Pendiente</option>
            ${!isIdea ? `<option value="done"${item.status==='done'?' selected':''}>Hecho</option>` : ''}
            <option value="descartado"${item.status==='descartado'?' selected':''}>Descartado</option>
          </select>
        </div>
        ${item.status === 'done' ? `<div class="bitem-meta-cell"><span class="bitem-meta-label">Versión</span><span class="bitem-meta-value mono">${esc(item.version || 'futura')}</span></div>` : ''}
        ${!isIdea ? `<div class="bitem-meta-cell">
          <span class="bitem-meta-label">Esfuerzo</span>
          <div class="bitem-effort-display">
            ${(() => { let d=''; for(let i=0;i<3;i++) d+=`<span class="bitem-effort-dot-sm${i<effortN?' on':''}"></span>`; return d; })()}
            <span class="bitem-effort-num">${item.effort ? item.effort+'/3' : '<span class="effort-missing">—</span>'}</span>
          </div>
        </div>` : ''}
        <div class="bitem-meta-cell">
          <span class="bitem-meta-label">Tipo</span>
          <span class="bitem-meta-value">${typeLabel || '—'}</span>
        </div>
        <div class="bitem-meta-cell" data-action="bitem-meta-stop">
          <span class="bitem-meta-label">Rol</span>
          <select class="item-status-select bitem-select bitem-select-role" data-code="${esc(item.code)}" data-select-type="role">
            <option value="">— Sin rol —</option>
            ${_ECOSYSTEM_ROLES.map(r => `<option value="${esc(r)}"${(item.role||'')=== r?' selected':''}>${esc(r)}</option>`).join('')}
          </select>
        </div>
        <div class="bitem-meta-cell" data-action="bitem-meta-stop">
          <span class="bitem-meta-label">Sprint</span>
          <div id="sprint-select-wrap-${esc(item.code)}">
            <select class="item-status-select bitem-select" data-code="${esc(item.code)}" data-select-type="sprint">
              <option value="icebox"${(!item.sprint || item.sprint === 'icebox') ? ' selected' : ''}>icebox</option>
              ${getActiveSprints().filter(s=>s.status!=='closed').map(s=>`<option value="${esc(s.id)}"${item.sprint===s.id?' selected':''}>${esc(s.label||s.id)}${s.status==='active'?' ★':''}</option>`).join('')}
              ${item.sprint && item.sprint !== 'icebox' && !getActiveSprints().find(s=>s.id===item.sprint) ? `<option value="${esc(item.sprint)}" selected>${esc(item.sprint)}</option>` : ''}
              <option value="__new__">＋ Nuevo sprint...</option>
            </select>
          </div>
        </div>
        ${(type === 'T' || type === 'B') ? (() => {
          // T-202604-354: solo R pendientes, orden descendente por código, label ID · Título truncado 60 chars
          const rItems = getItems()
            .filter(i => itemType(i.code) === 'R' && i.status === 'pendiente')
            .sort((a, b) => b.code.localeCompare(a.code));
          const _rLabel = r => { const t = r.title || ''; return r.code + ' · ' + (t.length > 60 ? t.slice(0, 57) + '…' : t); };
          const currentParent = item.parentId ? getItems().find(i => i.code === item.parentId) : null;
          const ghostOption = (currentParent && !rItems.find(r => r.code === item.parentId))
            ? '<option value="' + esc(currentParent.code) + '" selected>' + esc(_rLabel(currentParent)) + ' [' + esc(currentParent.status) + ']</option>'
            : '';
          return '<div class="bitem-meta-cell" data-action="bitem-meta-stop">'
            + '<span class="bitem-meta-label">R padre</span>'
            + '<select class="item-status-select bitem-select" data-code=\'' + esc(item.code) + '\' data-select-type="parent">'
            + '<option value="">— Sin padre</option>'
            + ghostOption
            + rItems.map(r => '<option value="' + esc(r.code) + '"' + (item.parentId === r.code ? ' selected' : '') + '>' + esc(_rLabel(r)) + '</option>').join('')
            + '</select></div>';
        })() : ''}
      </div>
      ${isIdea ? '' : acHtml}
      ${(() => {
        // R-202604-074: AC Vivo — solo en pendientes con sprint; R-202605-098: nunca en P
        if (isIdea || isDone || isDiscarded || !item.sprint) return '';
        // Sin AC definidos — mensaje + CTA
        if (!item.ac || !item.ac.length) {
          const _emptyId = `acv-panel-empty-${globalIdx}`;
          return `<div class="acv-wrap acv-wrap--empty" id="${_emptyId}">
            <button class="acv-toggle" data-action="acv-toggle" data-panel-id="${_emptyId}" title="Revisión de AC">
              <span class="acv-toggle-arrow">▸</span> Revisión de AC
            </button>
            <div class="acv-body acv-body--hidden">
              <p class="acv-empty-msg">Este ítem no tiene AC — agrega criterios antes de implementar.</p>
              <button class="acv-confirm-btn" data-action="acv-open-editor" data-code="${esc(item.code)}" title="Abrir editor de ítem">✎ Ir a Item Editor</button>
            </div>
          </div>`;
        }
        // Revisar si ya fue confirmado recientemente (< 48h)
        const _acRev = item.acReviewed;
        const _reviewed = _acRev && (Date.now() - _acRev) < 48 * 60 * 60 * 1000;
        // Parser heurístico de ambigüedad
        const _ambigTerms = [
          { re: /tiempo real/i,        desc: '"tiempo real" — define frecuencia o evento exacto' },
          { re: /correctamente/i,      desc: '"correctamente" — sin criterio explícito de corrección' },
          { re: /adecuadamente/i,      desc: '"adecuadamente" — ambiguo sin referencia' },
          { re: /\bfunciona\b/i,       desc: '"funciona" — define qué resultado es válido' },
          { re: /visible\b(?!.*\bcon\b.*\bcontraste\b)/i, desc: '"visible" — sin criterio explícito (contraste, posición, tamaño)' },
          { re: /sin regresi[oó]n(?!\s+en\s+\S)/i, desc: '"sin regresión" — scope no definido' },
        ];
        const _classify = (ac) => {
          if (/click|button|tab|badge|color|layout|css|px|rem|visible|muestra|aparece|oculta/i.test(ac)) return { cls: 'visual', label: 'visual' };
          if (/guarda|persiste|localStorage|storage|calcula|retorna|devuelve|valor/i.test(ac)) return { cls: 'datos', label: 'datos' };
          return { cls: 'funcional', label: 'funcional' };
        };
        const _acRows = item.ac.map((c, ci) => {
          const ambig = _ambigTerms.find(t => t.re.test(c));
          const cat   = _classify(c);
          const rowId = `acv-row-${globalIdx}-${ci}`;
          if (ambig) {
            return `<li class="acv-row acv-row--warn" id="${rowId}">
              <span class="acv-badge acv-badge--warn" title="${esc(ambig.desc)}">⚠</span>
              <span class="acv-text">${esc(c)}</span>
              <button class="acv-clarify-btn" data-action="acv-clarify" data-row-id="${rowId}" data-code="${esc(item.code)}" data-ci="${ci}" title="Aclarar este AC">Aclarar</button>
            </li>`;
          }
          return `<li class="acv-row acv-row--ok" id="${rowId}">
            <span class="acv-badge acv-badge--ok acv-badge--${cat.cls}" title="${cat.label}">✓</span>
            <span class="acv-text">${esc(c)}</span>
          </li>`;
        }).join('');
        const _panelId  = `acv-panel-${globalIdx}`;
        const _revClass = _reviewed ? ' acv-reviewed' : '';
        return `<div class="acv-wrap${_revClass}" id="${_panelId}">
          <button class="acv-toggle" data-action="acv-toggle" data-panel-id="${_panelId}" title="Revisión de AC">
            <span class="acv-toggle-arrow">▸</span> Revisión de AC
          </button>
          <div class="acv-body acv-body--hidden">
            <ul class="acv-list">${_acRows}</ul>
            <button class="acv-confirm-btn" data-action="acv-confirm" data-code="${esc(item.code)}" data-panel-id="${_panelId}" title="Marcar revisión como completada">✓ Confirmar y proceder</button>
          </div>
        </div>`;
      })()}
      ${buildItemRefs(item.code)}
      ${type === 'R' ? _buildChildrenBlock(item.code) : ''}
      ${_buildItemTimestamps(item)}
      ${_buildItemOriginBlock(item)}
      ${item.origin ? _buildItemPOriginBlock(item) : ''}
      ${item.migratedFrom ? _buildItemMigratedBlock(item) : ''}
      ${_buildItemMentionedIn(item)}
      <div class="bitem-footer">
        ${isHistorico ? '' : `<button data-action="bitem-edit" data-code="${esc(item.code)}" class="bitem-edit-btn" title="Editar ítem">✎ Editar</button>`}
        ${(!isHistorico && isIdea && !isDone && !isDiscarded) ? `<button data-action="bitem-promote" data-code="${esc(item.code)}" class="bitem-promote-btn" title="Promover esta posibilidad a Ticket o Requerimiento">⬆ Promover</button>` : ''}
        ${(!isHistorico && type === 'T' && !isDone && !isDiscarded) ? `<button data-action="bitem-promote-ttor" data-code="${esc(item.code)}" class="bitem-promote-btn" title="Promover Ticket a Requerimiento">⬆ → R</button>` : ''}
        ${(!isHistorico && !isDone && !isDiscarded) ? `<button data-action="bitem-migrate" data-code="${esc(item.code)}" class="bitem-promote-btn" title="Mover item a otro proyecto">&#x21C4; Mover</button>` : ''}
      </div>
    </div>
  </div>`;
}

// R-[pendiente-ID]: Promover ítem P → T o R con trazabilidad de origen
function _promoteItem(code) {
  const item = getItems().find(i => i.code === code);
  if (!item) return;

  // R-202604-047: shell estático en index.html — inject content + classList
  const overlay = document.getElementById('promote-modal-overlay');
  if (!overlay) return;
  const body = document.getElementById('promote-modal-body');
  if (body) {
    body.innerHTML = `
      <div class="promote-modal-title" id="promote-modal-title-el">⬆ Promover idea</div>
      <div class="promote-modal-sub">${esc(code)} · ${esc(item.title)}</div>
      <div class="promote-modal-desc">¿A qué tipo quieres promover esta idea?</div>
      <div class="promote-type-btns">
        <button class="promote-type-btn" id="promote-btn-T" data-action="promote-select-type" data-type="T">
          <div class="promote-type-letter">T</div>
          <div class="promote-type-name">Ticket</div>
          <div class="promote-type-hint">Tarea técnica concreta</div>
        </button>
        <button class="promote-type-btn" id="promote-btn-R" data-action="promote-select-type" data-type="R">
          <div class="promote-type-letter">R</div>
          <div class="promote-type-name">Requerimiento</div>
          <div class="promote-type-hint">Feature o épica con tickets</div>
        </button>
      </div>
      <div class="promote-modal-actions">
        <button data-action="promote-modal-cancel" class="btn-cancel">Cancelar</button>
        <button id="promote-confirm-btn" data-action="promote-confirm" data-code="${esc(code)}" class="btn-primary" disabled>Promover</button>
      </div>`;
  }
  _promoteTargetType = null;
  overlay.classList.add('open');
  // AC: foco inicial en primer botón de tipo (flujo P)
  requestAnimationFrame(() => {
    const first = overlay.querySelector('.promote-type-btn');
    if (first) first.focus();
  });
}

let _promoteTargetType = null;

function _promoteSelectType(type) {
  _promoteTargetType = type;
  ['T', 'R'].forEach(t => {
    const btn = document.getElementById('promote-btn-' + t);
    if (btn) btn.classList.toggle('selected', t === type);
  });
  const confirmBtn = document.getElementById('promote-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = false;
}

function _promoteConfirm(originCode) {
  if (!_promoteTargetType) return;
  const originItem = getItems().find(i => i.code === originCode);
  if (!originItem) return;

  const newCode = _getNextItemCode(_promoteTargetType);
  const nowTs = Date.now();

  // Crear ítem hijo con campos heredados + origin
  // R-202605-098: ítem hijo nace sin esfuerzo — el campo no se hereda del P original
  getItems().push({
    id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2, 6),
    code: newCode,
    title: originItem.title,
    desc: originItem.desc || '',
    priority: originItem.priority || 'medium',
    area: originItem.area || '',
    effort: null,
    impact: originItem.impact || 'Medio',
    status: 'pendiente',
    version: 'futura',
    sprint: (originItem.sprint && originItem.sprint.trim() !== 'n/a') ? originItem.sprint : '',
    ac: originItem.ac ? [...originItem.ac] : [],
    origin: originCode,
    sessionId: null,
    createdAt: nowTs,
    statusChangedAt: nowTs,
    doneAt: null
  });

  // R-202605-098: P padre → descartado automático con discardReason trazable
  // No requiere acción manual del founder
  originItem.status = 'descartado';
  originItem.statusChangedAt = nowTs;
  originItem.discardReason = 'promovido a ' + _promoteTargetType + ' ' + newCode;
  originItem.discardRef = newCode; // ref al ítem hijo — habilita bitem--promoted chip

  _blogLog('promovido', originCode, originCode + ' → ' + newCode, 'backlog');
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();

  const _pmo = document.getElementById('promote-modal-overlay');
  if (_pmo) _pmo.classList.remove('open');
  _promoteTargetType = null;

  _markBacklogListDirty(); renderBacklogList(() => navigateToItem(newCode));
  renderStats();
  showToast('success', `⬆ ${originCode} promovido → ${newCode}`);
}

// T-202604-236: Promover T → R desde Backlog UI
function _promoteTtoR(code) {
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  // AC-5: solo en T pendiente o progreso
  if (item.status === 'done' || item.status === 'descartado') return;

  // R-202604-047: shell estático en index.html — inject content + classList
  // DUP-02: usa shell unificado #promote-modal-overlay
  const overlay = document.getElementById('promote-modal-overlay');
  if (!overlay) return;
  const body = document.getElementById('promote-modal-body');
  if (body) {
    body.innerHTML = `
      <div class="promote-modal-title" id="promote-modal-title-el">⬆ Promover Ticket a Requerimiento</div>
      <div class="promote-modal-sub">${esc(code)} · ${esc(item.title)}</div>
      <div class="promote-modal-info">
        Se creará un <strong>R</strong> heredando los campos del T.<br>
        El T origen quedará <strong>descartado</strong> con referencia al R nuevo.
      </div>
      <div class="promote-modal-actions">
        <button data-action="promote-ttor-cancel"
          class="btn-ghost">Cancelar</button>
        <button data-action="promote-ttor-confirm" data-code="${esc(code)}" class="btn-primary" id="promote-ttor-confirm-btn">⬆ Promover</button>
      </div>`;
  }
  overlay.classList.add('open');
  // AC: foco inicial en botón confirmar (flujo T — sin selector de tipo)
  requestAnimationFrame(() => {
    const confirmBtn = overlay.querySelector('#promote-ttor-confirm-btn');
    if (confirmBtn) confirmBtn.focus();
  });
}

function _promoteTtoRConfirm(originCode) {
  const originItem = getItems().find(i => i.code === originCode);
  if (!originItem) return;

  const newCode = _getNextItemCode('R');
  const nowTs = Date.now();

  // AC-2: R hereda desc · area · sprint · tags del T origen
  // AC-4: origin del R apunta al T
  getItems().push({
    id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2, 6),
    code: newCode,
    title: originItem.title,
    desc: originItem.desc || '',
    priority: originItem.priority || 'medium',
    area: originItem.area || '',
    effort: originItem.effort || 1,
    impact: originItem.impact || 'Medio',
    status: 'pendiente',
    version: 'futura',
    sprint: (originItem.sprint && originItem.sprint.trim() !== 'n/a') ? originItem.sprint : '',
    tags: originItem.tags ? [...originItem.tags] : [],
    ac: [],
    origin: originCode,
    sessionId: null,
    createdAt: nowTs,
    statusChangedAt: nowTs,
    doneAt: null
  });

  // AC-3: T origen → descartado con reason:reemplazado + ref al R nuevo
  originItem.status = 'descartado';
  originItem.statusChangedAt = nowTs;
  originItem.discardReason = 'reemplazado';
  originItem.discardRef = newCode;

  _blogLog('promovido-a-r', originCode, originCode + ' → ' + newCode, 'backlog');
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();

  const overlay = document.getElementById('promote-modal-overlay'); // DUP-02: shell unificado
  if (overlay) overlay.classList.remove('open');

  _markBacklogListDirty(); renderBacklogList(() => navigateToItem(newCode));
  renderStats();
  showToast('success', `⬆ ${originCode} promovido → ${newCode}`);
}

function copyItemCode(e, code, idx) {
  e.stopPropagation();
  // e.currentTarget es el listEl cuando se llama desde delegación — usar closest para obtener el badge real
  const btn = e.target.closest('[data-action="copy-code"]');
  const iconClipboard = btn ? btn.querySelector('.copy-btn-icon--clipboard') : null;
  const iconCheck     = btn ? btn.querySelector('.copy-btn-icon--check') : null;

  const _applyFeedback = () => {
    if (btn) btn.classList.add('is-copied');
    if (iconClipboard) iconClipboard.classList.add('is-hidden');
    if (iconCheck)     iconCheck.classList.remove('is-hidden');
    setTimeout(() => {
      if (btn) btn.classList.remove('is-copied');
      if (iconClipboard) iconClipboard.classList.remove('is-hidden');
      if (iconCheck)     iconCheck.classList.add('is-hidden');
    }, 1500);
  };

  navigator.clipboard.writeText(code).then(() => {
    _applyFeedback();
  }).catch(() => {
    // fallback execCommand
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.className = 'clipboard-ghost';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    _applyFeedback();
  });
}

// T-202604-178: copia ítem formateado para sesión FS
function copyItemToClipboard(e, code) {
  e.stopPropagation();
  const item = getItems().find(i => i.code === code);
  if (!item) return;

  const lines = [];

  // Línea 1: código + título
  lines.push(`[${item.code}] ${item.title || ''}`);

  // Línea 2: campos de contexto
  const meta = [`Status: ${item.status || 'pendiente'}`];
  if (item.effort) meta.push(`Effort: ${item.effort}`);
  if (item.area)   meta.push(`Area: ${item.area}`);
  if (item.sprint) meta.push(`Sprint: ${item.sprint}`);
  lines.push(meta.join(' | '));

  // AC
  if (item.ac && item.ac.length) {
    lines.push('');
    lines.push('AC:');
    item.ac.forEach(c => lines.push(`- ${c}`));
  }

  // Notas (desc)
  if (item.desc && item.desc.trim()) {
    lines.push('');
    lines.push(`Notas: ${item.desc.trim()}`);
  }

  // Tags (si el ítem los tiene)
  if (item.tags && item.tags.length) {
    const tagNames = item.tags.map(tid => {
      const t = (window.state.tags || []).find(t => t.id === tid);
      return t ? t.name : tid;
    });
    lines.push(`Tags: ${tagNames.join(', ')}`);
  }

  const text = lines.join('\n');
  const btnId = `copy-item-btn-${code}`;

  const _feedback = () => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const iconClipboard = btn.querySelector('.copy-btn-icon--clipboard');
    const iconCheck     = btn.querySelector('.copy-btn-icon--check');
    btn.classList.add('is-copied');
    if (iconClipboard) iconClipboard.classList.add('is-hidden');
    if (iconCheck)     iconCheck.classList.remove('is-hidden');
    setTimeout(() => {
      btn.classList.remove('is-copied');
      if (iconClipboard) iconClipboard.classList.remove('is-hidden');
      if (iconCheck)     iconCheck.classList.add('is-hidden');
    }, 1500);
  };

  navigator.clipboard.writeText(text).then(_feedback).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.className = 'clipboard-ghost';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    _feedback();
  });
}

function toggleAc(idx) {
  const list = document.getElementById(`ac-list-${idx}`);
  const arrow = document.getElementById(`ac-arrow-${idx}`);
  if (!list) return;
  list.classList.toggle('open');
  arrow.textContent = list.classList.contains('open') ? '▾' : '▸';
}

export function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('.f-' + f);
  if (btn) btn.classList.add('active');
  _markBacklogListDirty(); renderBacklogList();
}

function onBacklogSearch() {
  const input = document.getElementById('backlog-search-input');
  _setBacklogSearch((input ? input.value : '').toLowerCase().trim());
  const clearBtn = document.getElementById('backlog-search-clear');
  if (clearBtn) clearBtn.classList.toggle('visible', !!backlogSearchQuery);
  updateClearFilterBtn();
  _markBacklogListDirty(); renderBacklogList();
  renderStats(); // B-202605-205: actualizar contadores de tipo con búsqueda activa
}

function clearBacklogSearch() {
  const input = document.getElementById('backlog-search-input');
  if (input) input.value = '';
  _setBacklogSearch('');
  const clearBtn = document.getElementById('backlog-search-clear');
  if (clearBtn) clearBtn.classList.remove('visible');
  updateClearFilterBtn();
  _markBacklogListDirty(); renderBacklogList();
  renderStats(); // B-202605-205: restaurar contadores al limpiar búsqueda
}

export function updateBacklogFooter() {
  // T-202604-360: footer fijo colapsable — dos filas: info + filtros accionables
  const footer = document.getElementById('backlog-footer');
  if (!footer) return;

  // Delegation para filter chips del footer — se registra una sola vez
  if (!footer._delegationAttached) {
    footer._delegationAttached = true;
    footer.addEventListener('click', function _blFooterClick(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const act = btn.dataset.action;
      if (act === 'footer-type-filter') {
        if (typeof toggleTypeFilter === 'function') toggleTypeFilter(btn.dataset.type);
      } else if (act === 'footer-status-filter') {
        if (typeof toggleStatusFilter === 'function') toggleStatusFilter(btn.dataset.status);
      } else if (act === 'footer-effort-filter') {
        if (typeof toggleEffortFilter === 'function') toggleEffortFilter(parseInt(btn.dataset.effort, 10));
      } else if (act === 'footer-clear-filters') {
        if (typeof clearAllFilters === 'function') clearAllFilters();
      }
    });
  }

  const d = new Date().toISOString().split('T')[0];
  const closedSprintIds = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  const countable = getItems().filter(i => _isCountableItem(i) && !i.sprint || !closedSprintIds.has(i.sprint));
  const total    = getItems().filter(i => _isCountableItem(i)).length;
  const pend     = getItems().filter(i => _isCountableItem(i) && i.status === 'pendiente').length;
  const done     = getItems().filter(i => _isCountableItem(i) && i.status === 'done').length;
  const pIdeas   = getItems().filter(i => itemType(i.code) === 'P' && i.status !== 'descartado').length;
  const byType   = { B: 0, T: 0, R: 0, P: 0 };
  getItems().forEach(i => { const t = itemType(i.code); if (t && byType[t] !== undefined) byType[t]++; });
  const activeSp = _getActiveSprint();

  footer.innerHTML = `
    <div class="bl-footer-row bl-footer-row--filters" id="bl-footer-filters">
      <div class="bl-footer-filter-group">
        <span class="bl-filter-label">Tipo</span>
        ${[['B','Bug'],['T','Ticket'],['R','Req'],['P','Pos.']].map(([t,l]) =>
          `<button class="bl-filter-chip bl-fc-type-${t}${_getActiveTypes().has(t) ? ' active' : ''}" data-action="footer-type-filter" data-type="${t}" title="${l}">${t} <span>${byType[t]}</span></button>`
        ).join('')}
      </div>
      <div class="bl-footer-filter-group">
        <span class="bl-filter-label">Status</span>
        <button class="bl-filter-chip${_getActiveStatuses().has('pendiente') ? ' active' : ''}" data-action="footer-status-filter" data-status="pendiente">Pendiente <span>${pend}</span></button>
        <button class="bl-filter-chip${_getActiveStatuses().has('done') ? ' active' : ''}" data-action="footer-status-filter" data-status="done">Done <span>${done}</span></button>
      </div>
      <div class="bl-footer-filter-group">
        <span class="bl-filter-label">Esfuerzo</span>
        ${[1,2,3].map(e => {
          const cnt = getItems().filter(i => (parseInt(i.effort)||1) === e).length;
          return `<button class="bl-filter-chip${_getActiveEfforts().has(e) ? ' active' : ''}" data-action="footer-effort-filter" data-effort="${e}" title="Effort ${e}">E${e} <span>${cnt}</span></button>`;
        }).join('')}
      </div>
      <button class="bl-footer-clear" data-action="footer-clear-filters" title="Limpiar todos los filtros">✕ Limpiar</button>
    </div>
  `;

  // restaurar estado colapsado si aplica
  if (_blFooterCollapsed) {
    const filtersRow = document.getElementById('bl-footer-filters');
    const toggleBtn  = document.getElementById('bl-footer-toggle');
    if (filtersRow) filtersRow.classList.add('bl-footer-row--hidden');
    if (toggleBtn)  toggleBtn.textContent = '▼';
  }
}

// B-202604-198: Helper — detecta si un code es placeholder (nunca matchear contra backlog)
export function _isPlaceholderCode(code) {
  if (!code) return true;
  if (code === '[pendiente-ID]') return true;
  if (/^\[tmp:[a-z0-9_-]+\]$/i.test(code)) return true;
  return false;
}

// B-202604-198: Helper — busca ítem existente cuyo title es similar a un [tmp:slug]
// Retorna { item, score } o null. Solo sugiere — nunca aplica automáticamente.
// T-202605-136: incomingType restringe la búsqueda al mismo type — evita que un T nuevo
// con [tmp:slug] matchee contra una P existente con título similar.
function _findTmpMatch(tmpCode, desc, existingItems, incomingType) {
  if (!desc) return null;
  const needle = desc.trim().toLowerCase();
  let best = null, bestScore = 0;
  existingItems.forEach(item => {
    // T-202605-136: solo matchear contra ítems del mismo type que el entrante
    if (incomingType && item.type && item.type !== incomingType) return;
    const haystack = (item.title || '').trim().toLowerCase();
    if (!haystack) return;
    // Similitud: palabras en común / total palabras
    const needleWords = needle.split(/\s+/);
    const haystackWords = haystack.split(/\s+/);
    const common = needleWords.filter(w => w.length > 3 && haystackWords.includes(w)).length;
    const score = common / Math.max(needleWords.length, haystackWords.length);
    if (score > 0.5 && score > bestScore) { best = item; bestScore = score; }
  });
  return best ? { item: best, score: bestScore } : null;
}

// B-202605-guardar-sesion: _assignPendingIds — convierte [pendiente-ID] en código real.
// Llamado por mergeBacklogFromTG antes de procesar ítems.
// AC-3: ítems sin type válido se dejan con [pendiente-ID] sin modificar.
// AC-4: ítems con código real pasan sin modificación.
// AC-5: [tmp:slug] pasan sin modificación — tienen su propio flujo (_findTmpMatch).
// B-202605-ids: reservedCodes acumula los códigos asignados en esta pasada para que
// _getNextItemCode no repita el mismo número cuando hay múltiples [pendiente-ID] del
// mismo tipo — los ítems nuevos aún no están en getItems() en el momento de la asignación.
// T-202605-140 T2: Paso 1 — asignar IDs reales y construir slugMap.
//   slugMap mapea [tmp:slug] y [pendiente-ID] asignado → código real.
//   Ítems con código real existente se registran como identidad: code → code.
// T-202605-140 T2: Paso 2 — resolver referencias cruzadas (dependsOn, parentId,
//   triggeredBy, origenP, promovida_a) usando slugMap. Referencia no resuelta → null/[].
function _assignPendingIds(tgItems) {
  const validTypes = new Set(['P', 'T', 'R', 'B']);
  const reservedCodes = new Set();

  // T-202605-140 T2 · Paso 1: construir slugMap mientras se asignan IDs
  const slugMap = new Map();

  // Pre-poblar slugMap con códigos reales ya existentes (identidad: code → code)
  tgItems.forEach(item => {
    if (item.code && !_isPlaceholderCode(item.code)) {
      slugMap.set(item.code, item.code);
    }
  });

  // T-202605-137: Paso 1 separado en dos sub-pasos para garantizar que slugMap esté completo
  // antes de resolver referencias. Esto cubre el caso donde un patch con promovida_a:[pendiente-ID]
  // aparece antes del ítem nuevo en el array — el orden en el CHECKPOINT no debe importar.

  // Sub-paso 1a: asignar IDs reales a todos los [pendiente-ID] y [tmp:slug] con type válido,
  // y construir slugMap completo ANTES de resolver cualquier referencia cruzada.
  const paso1 = tgItems.map(item => {
    // T-202606-005: [tmp:slug] con type válido — asignar código real y registrar en slugMap
    // para que las referencias cruzadas (parent, depends_on, triggered_by, origen_p, promovida_a)
    // dentro del mismo bloque resuelvan correctamente.
    // [tmp:slug] sin type válido: conservar literal — siguen flujo _findTmpMatch existente.
    if (item.code && /^\[tmp:[a-z0-9_-]+\]$/i.test(item.code)) {
      if (!item.type || !validTypes.has(item.type)) return item; // sin type — conservar literal
      const newCode = _getNextItemCode(item.type, reservedCodes);
      reservedCodes.add(newCode);
      slugMap.set(item.code, newCode); // tmp:slug → código real asignado
      slugMap.set(newCode, newCode);   // identidad del código asignado
      return { ...item, code: newCode, _wasAssigned: true };
    }
    if (item.code !== '[pendiente-ID]') return item; // AC-4: código real — sin modificación
    if (!item.type || !validTypes.has(item.type)) return item; // AC-3: type inválido — no asignar
    const newCode = _getNextItemCode(item.type, reservedCodes);
    reservedCodes.add(newCode);
    // T-202605-137: registrar con clave única por item (usando índice implícito en el código asignado)
    // para que múltiples [pendiente-ID] no se sobreescriban. El slugMap usa el código asignado
    // como clave de identidad; la clave '[pendiente-ID]' es solo el último asignado (compat legacy).
    slugMap.set('[pendiente-ID]', newCode); // identidad de la última asignación — compat legacy bloques de un ítem
    slugMap.set(newCode, newCode);          // identidad del código asignado — para resolución directa
    return { ...item, code: newCode, _wasAssigned: true };
  });

  // Sub-paso 1b: construir índice invertido de códigos asignados para resolver referencias
  // cross-item. Para cada item que fue asignado, su código real ya está en slugMap.
  // Si hay exactamente un [pendiente-ID] en el batch original, slugMap['[pendiente-ID]'] lo resuelve.
  // Si hay múltiples, la resolución es ambigua — conservar literal (comportamiento previo).
  const assignedCount = paso1.filter(i => i._wasAssigned).length;
  // Si hay más de un [pendiente-ID] asignado, la clave '[pendiente-ID]' apunta solo al último.
  // En ese caso, references que usen [pendiente-ID] como valor quedan sin resolver (conservar literal).
  if (assignedCount > 1) {
    // Eliminar la clave genérica para forzar conservar-literal en Paso 2
    slugMap.delete('[pendiente-ID]');
  }

  // T-202605-140 T2 · Paso 2: resolver referencias cruzadas usando slugMap
  // Campos de referencia: dependsOn, parentId, triggeredBy, origenP, promovida_a
  // Referencia presente en slugMap → reemplazar con código real.
  // [pendiente-ID] no resuelta → conservar literal — puede resolverse en pasada posterior.
  // [tmp:slug] no resuelta → null/[] + _blogLog('tmp-slug-no-resoluble') — slug sin type
  //   que no aparece como ítem en el bloque: no tiene sentido conservar la referencia.
  // Referencia con formato de código real (no placeholder) no existente en backlog →
  //   null/[] + _blogLog('ref-no-resuelta') — el código debería existir y no existe.
  const _refFields = ['parentId', 'triggeredBy', 'origenP', 'promovida_a'];
  const _listFields = ['dependsOn'];

  return paso1.map(item => {
    let changed = false;
    const patch = {};

    // Campos escalares de referencia
    _refFields.forEach(field => {
      const val = item[field];
      if (!val) return;
      if (_isPlaceholderCode(val)) {
        // Placeholder: intentar resolver via slugMap
        const resolved = slugMap.get(val);
        if (resolved) {
          patch[field] = resolved;
          changed = true;
        } else if (field === 'promovida_a') {
          // T-202605-137: AC error — promovida_a con pendiente-ID sin ítem nuevo correspondiente
          // Conservar literal para pasadas posteriores, pero registrar advertencia en DocLog
          _blogLog('promovida-a-no-resuelta', item.code || '[sin-código]',
            'promovida_a: ' + val + ' no pudo resolverse — no hay ítem nuevo con ese pendiente-ID en este CHECKPOINT',
            'backlog');
        } else if (/^\[tmp:[a-z0-9_-]+\]$/i.test(val)) {
          // T-202606-005: [tmp:slug] sin type valido no resoluble — null + log
          // No tiene sentido conservar la referencia: el slug no tiene item correspondiente en el bloque.
          _blogLog('tmp-slug-no-resoluble', item.code || '[sin-codigo]',
            field + ': ' + val + ' no pudo resolverse — [tmp:slug] sin type valido en este bloque',
            'backlog');
          patch[field] = null;
          changed = true;
        }
        // [pendiente-ID] sin resolucion — conservar literal para pasadas posteriores
      } else {
        // Código con formato real: si no existe en backlog → null + log
        const existsInBacklog = getItems() && getItems().find(i => i.code === val);
        if (!existsInBacklog) {
          _blogLog('ref-no-resuelta', item.code || '[sin-código]', field + ': ' + val + ' no existe en el backlog', 'backlog');
          patch[field] = null;
          changed = true;
        }
      }
    });

    // Campos de lista de referencias (dependsOn)
    _listFields.forEach(field => {
      const arr = item[field];
      if (!Array.isArray(arr) || !arr.length) return;
      let listChanged = false;
      const resolved = arr.map(val => {
        if (!val) return val;
        if (_isPlaceholderCode(val)) {
          // Placeholder: intentar resolver via slugMap
          const mapped = slugMap.get(val);
          if (mapped) { listChanged = true; return mapped; }
          // T-202606-005: [tmp:slug] sin resolucion — null + log (se filtra del array)
          if (/^\[tmp:[a-z0-9_-]+\]$/i.test(val)) {
            _blogLog('tmp-slug-no-resoluble', item.code || '[sin-codigo]',
              field + '[]: ' + val + ' no pudo resolverse — [tmp:slug] sin type valido en este bloque',
              'backlog');
            listChanged = true;
            return null;
          }
          // [pendiente-ID] sin resolucion — conservar literal para pasadas posteriores
          return val;
        } else {
          // Código con formato real: si no existe en backlog → null + log
          const existsInBacklog = getItems() && getItems().find(i => i.code === val);
          if (!existsInBacklog) {
            _blogLog('ref-no-resuelta', item.code || '[sin-código]', field + '[]: ' + val + ' no existe en el backlog', 'backlog');
            listChanged = true;
            return null;
          }
          return val;
        }
      }).filter(v => v !== null);
      if (listChanged) { patch[field] = resolved; changed = true; }
    });

    return changed ? { ...item, ...patch } : item;
  });
}

// ── T-098: Merge TRACKER-GLOBAL → getItems() en memoria ──
// Llamado desde saveSession(). Acumula múltiples sesiones sin exportar.
// T-202604-121: retorna {created, updated, ignored} para super toast
export function mergeBacklogFromTG(tgItems, sessionId, opts) {
  if (!tgItems || !tgItems.length) return { created:[], advanced:[], retroceso:[], discarded:[], updated:[], ignored:[], createdAndClosed:[], tmpSuggestions:[], invalidTransition:[] };
  const _dryRun = !!(opts && opts.dryRun);

  // B-202604-198: Separar placeholders ANTES de _assignPendingIds para preservar su naturaleza.
  // Los placeholders siempre son ítems nuevos — nunca matchean contra el backlog.
  // _assignPendingIds se aplica solo a los que tienen type char válido (P/T/R/B) y código real.
  tgItems = _assignPendingIds(tgItems);

  // B-202605-016: normalizar campo parent (schema CHECKPOINT) → parentId (campo interno)
  // El schema declara "parent" pero el código usa parentId — mapear antes del loop
  tgItems = tgItems.map(item => {
    if (item.parent && !item.parentId) { item.parentId = item.parent; }
    return item;
  });

  let changed = false;
  const created = [], advanced = [], retroceso = [], discarded = [], updated = [], ignored = [];
  // B-202604-198: grupo propio para ítems que nacen y cierran en el mismo CHECKPOINT
  const createdAndClosed = [];
  // B-202604-198: sugerencias de match [tmp:slug] → ID real existente (para confirmación del usuario)
  const tmpSuggestions = [];

  // Orden de avance: pendiente < done < descartado (descartado solo vía confirmación)
  const _statusRank = { pendiente: 0, 'en-revision': 0.5, promovida: 0.8, done: 1, descartado: 2 }; // T-202606-032 / B-202606-016: promovida con rank 0.8

  // B-202605-007: snapshot antes de cualquier mutación — incluye cierre automático de P padre
  if (!_dryRun) _undoSnapshot();

  tgItems.forEach(item => {
    if (!item.code) return;
    if (item._invalidType) { ignored.push({ code: item.code || '[sin-código]', reason: 'tipo-invalido', desc: item.title }); return; }
    if (item._duplicate) {
      // B-202605-XXX: ítem duplicado (título matchea existente via _assignPendingIds) —
      // aunque se ignore para status/creación, si trae AC se mergean sobre el existente.
      if (item.ac && item.ac.length && item._existingCode && !_dryRun) {
        const dupExisting = getItems().find(i => i.code === item._existingCode);
        if (dupExisting) {
          dupExisting.ac = item.ac;
          _acReplacedSet.add(dupExisting.id);
          if (sessionId && dupExisting.sessionId !== sessionId) dupExisting.sessionId = sessionId;
          if (!dupExisting.history) dupExisting.history = [];
          dupExisting.history.push({ type: 'field', ts: Date.now(), origin: 'checkpoint', sessionId: sessionId || null, data: { field: 'ac', from: null, to: item.ac } });
          changed = true;
        }
      }
      ignored.push({ code: '[pendiente-ID]', reason: 'duplicado', desc: item.title, existingCode: item._existingCode || '' });
      return;
    }

    // B-202604-198: REGLA DE PLACEHOLDER — forzar rama "nuevo" sin intentar match
    // Un [tmp:slug] o [pendiente-ID] NUNCA matchea contra getItems() existentes.
    // Nota: _assignPendingIds ya habrá convertido [pendiente-ID] con type char real si tiene
    // suficiente info; si no pudo (sin type), sigue siendo placeholder.
    const isPlaceholder = _isPlaceholderCode(item.code);

    // B-202604-198: REGLA DE TMP — detectar si [tmp:slug] corresponde a un ID real existente
    // por similitud de título. Si hay match potencial, registrar sugerencia y NO crear duplicado.
    if (isPlaceholder && /^\[tmp:[a-z0-9_-]+\]$/i.test(item.code)) {
      const tmpMatch = _findTmpMatch(item.code, item.title, getItems(), item.type);
      if (tmpMatch) {
        tmpSuggestions.push({
          tmpCode: item.code,
          desc: item.title,
          suggestedCode: tmpMatch.item.code,
          suggestedTitle: tmpMatch.item.title,
          score: tmpMatch.score
        });
        // No crear duplicado — el usuario confirma el match en el panel
        return;
      }
    }

    // B-202604-198: si es placeholder, saltar directamente a rama "nuevo"
    const existing = isPlaceholder ? null : getItems().find(i => i.code === item.code);
    if (existing) {
      // B-202605-XXX: normalizar type si falta — inferir desde prefijo del código
      if (!existing.type && existing.code) {
        const inferredType = existing.code.charAt(0);
        if ('PTRB'.includes(inferredType)) existing.type = inferredType;
      }
      const newStatus = item.status; // T-202606-034: item.status ya canónico desde T1 — _tgStatusToBacklog eliminada
      const oldStatus = existing.status || 'pendiente';
      const changes = [];

      // --- Lógica de status ---
      if (!item._noStatus && newStatus && newStatus !== oldStatus) {
        const oldRank = _statusRank[oldStatus] ?? 0;
        const newRank = _statusRank[newStatus] ?? 0;

        if (newStatus === 'descartado') {
          // Descarte: encolar para confirmación — no persistir todavía
          discarded.push({ code: item.code, desc: existing.title, from: oldStatus, reason: item.discardReason || existing.discardReason || '', ref: item.discardRef || existing.discardRef || '' });
          // No tocar existing todavía — se aplica en _confirmDiscard()
        } else if (newRank > oldRank) {
          // Avance: aplicar directo (no en dryRun)
          changes.push({ field: 'status', from: oldStatus, to: newStatus }); // T-202604-414
          if (!_dryRun) {
            existing.status = newStatus;
            existing.statusChangedAt = Date.now();
            if (newStatus === 'done' && !existing.doneAt) existing.doneAt = Date.now();
            _blogLog('ckpt-avance', item.code, oldStatus + ' → ' + newStatus, 'backlog');
            changed = true;
          }
          advanced.push({ code: item.code, desc: existing.title, from: oldStatus, to: newStatus });
        } else if (newRank < oldRank) {
          // Retroceso: encolar para confirmación — no persistir todavía
          retroceso.push({ code: item.code, desc: existing.title, from: oldStatus, to: newStatus });
          // No tocar existing todavía — se aplica en _confirmRetroceso()
        }
        // newRank === oldRank: status idéntico al existente — ignorar silenciosamente (B-202605-086)
      }

      // --- Resto de campos: entrante gana si trae valor (vacíos no degradan) ---
      // T-202604-414: changes es array de {field, from, to} para diff inline en panel
      if (item.title && item.title !== existing.title) { changes.push({ field: 'title', from: existing.title || '—', to: item.title }); if (!_dryRun) { existing.title = item.title; changed = true; } }
      if (item.desc && item.desc !== existing.desc) { changes.push({ field: 'desc', from: existing.desc || '—', to: item.desc }); if (!_dryRun) { existing.desc = item.desc; changed = true; } }
      if (item.effort && item.effort !== existing.effort) { changes.push({ field: 'effort', from: existing.effort || '—', to: item.effort }); if (!_dryRun) { existing.effort = item.effort; changed = true; } }
      if (item.area && item.area !== existing.area) { changes.push({ field: 'area', from: existing.area || '—', to: item.area }); if (!_dryRun) { existing.area = item.area; changed = true; } }
      // B-202605-233: sprint vacío explícito ('' ) mueve ítem a Ideas — antes se ignoraba por falsy
      if (item.sprint !== undefined && item.sprint !== existing.sprint) { changes.push({ field: 'sprint', from: existing.sprint || '—', to: item.sprint }); if (!_dryRun) { existing.sprint = item.sprint; changed = true; } }
      // B-202604-179: ac: reemplaza si entrante trae contenido — no acumula entre CHECKPOINTs
      if (item.ac && item.ac.length) {
        changes.push({ field: 'ac', from: existing.ac || [], to: item.ac });
        if (!_dryRun) { existing.ac = item.ac; _acReplacedSet.add(existing.id); changed = true; }
      }
      // AC-4: role entrante gana si trae valor; si vacío no degrada el existente
      if (item.role && item.role !== existing.role) { changes.push({ field: 'role', from: existing.role || '—', to: item.role }); if (!_dryRun) { existing.role = item.role; changed = true; } }
      // parentId: entrante gana si trae valor; si vacío no degrada el existente
      if (item.parentId && item.parentId !== existing.parentId) { changes.push({ field: 'parentId', from: existing.parentId || '—', to: item.parentId }); if (!_dryRun) { existing.parentId = item.parentId; changed = true; } }
      // origin: entrante gana si trae valor; si vacío no degrada el existente
      if (item.origin && item.origin !== existing.origin) { changes.push({ field: 'origin', from: existing.origin || '—', to: item.origin }); if (!_dryRun) { existing.origin = item.origin; changed = true; } }
      // notes: entrante gana si trae valor; si vacío no degrada el existente
      if (item.notes && item.notes !== existing.notes) { changes.push({ field: 'notes', from: existing.notes || '—', to: item.notes }); if (!_dryRun) { existing.notes = item.notes; changed = true; } }
      // discardReason / discardRef
      if (item.discardReason && item.discardReason !== existing.discardReason) { changes.push({ field: 'discardReason', from: existing.discardReason || '—', to: item.discardReason }); if (!_dryRun) { existing.discardReason = item.discardReason; changed = true; } }
      if (item.discardRef    && item.discardRef    !== existing.discardRef)    { changes.push({ field: 'discardRef',    from: existing.discardRef    || '—', to: item.discardRef    }); if (!_dryRun) { existing.discardRef    = item.discardRef;    changed = true; } }
      // T-202604-288: blockedBy — append con dedup
      if (item.blockedBy && item.blockedBy.length) {
        const existingBB = existing.blockedBy || [];
        const newBB = item.blockedBy.filter(c => !existingBB.includes(c));
        if (newBB.length) { changes.push({ field: 'blockedBy', from: existingBB.join(', ') || '—', to: [...existingBB, ...newBB].join(', ') }); if (!_dryRun) { existing.blockedBy = [...existingBB, ...newBB]; changed = true; } }
      }
      // R-202604-051: blocking
      if (item.blocking === true && !existing.blocking) { changes.push({ field: 'blocking', from: '—', to: 'true' }); if (!_dryRun) { existing.blocking = true; changed = true; } }
      // T-202605-137: promovida_a — actualizar en la P y escribir origenP en el ítem destino
      if (item.promovida_a && item.promovida_a !== existing.promovida_a) {
        changes.push({ field: 'promovida_a', from: existing.promovida_a || '—', to: item.promovida_a });
        if (!_dryRun) {
          existing.promovida_a = item.promovida_a;
          changed = true;
          // AC edge case: si promovida_a apunta a código real existente, escribir origenP en el destino
          if (!_isPlaceholderCode(item.promovida_a)) {
            const destItem = getItems().find(i => i.code === item.promovida_a);
            if (destItem && !destItem.origenP) {
              destItem.origenP = existing.code;
              _blogLog('origen-p-escrito', existing.code, existing.code + ' → origenP en ' + item.promovida_a, 'backlog');
            }
          }
        }
      }
      // origenP: entrante gana si trae valor; si vacío no degrada el existente
      if (item.origenP && item.origenP !== existing.origenP) { changes.push({ field: 'origenP', from: existing.origenP || '—', to: item.origenP }); if (!_dryRun) { existing.origenP = item.origenP; changed = true; } }
      // Estampar sessionId siempre que venga uno (CHECKPOINT más reciente gana)
      if (!_dryRun && sessionId && existing.sessionId !== sessionId) { existing.sessionId = sessionId; changed = true; }

      // T-202604-423: registrar cambios de merge en history[] con origin 'checkpoint'
      // B-202605-241: origin era 'import' — corregido a 'checkpoint' para display correcto en timeline
      if (!_dryRun && changes.length) {
        if (!existing.history) existing.history = [];
        const importTs = Date.now();
        changes.forEach(ch => {
          // status ya se registra en setItemStatus — aquí solo los demás campos
          if (ch.field === 'status') return;
          existing.history.push({
            type: 'field',
            ts: importTs,
            origin: 'checkpoint',
            sessionId: sessionId || null,
            data: { field: ch.field, from: ch.from !== '—' ? ch.from : null, to: ch.to || null }
          });
        });
      }

      if (changes.length) {
        if (!advanced.find(a => a.code === item.code)) {
          // T-202604-414: emitir changes array estructurado + change string para backward compat
          // T-202606-018: changes[] en el objeto updated contiene solo campos auditados por AC-2:
          //   status · priority · effort · sprint · title · area · role
          //   from: null cuando el campo no existía en el backlog (era undefined o '—' placeholder)
          //   El array interno `changes` sin filtrar se conserva para history[] (ya aplicado arriba)
          const _AUDITED_FIELDS = new Set(['status', 'priority', 'effort', 'sprint', 'title', 'area', 'role']);
          const changesForPanel = changes
            .filter(c => _AUDITED_FIELDS.has(c.field))
            .map(c => ({
              field: c.field,
              from: (c.from === '—' || c.from === undefined || c.from === null) ? null : c.from,
              to: c.to
            }));
          updated.push({ code: item.code, desc: existing.title, changes: changesForPanel, change: changes.map(c => c.field).join(' · '), parent: item.parent || null });
        }
      } else if (!advanced.find(a => a.code === item.code) && !retroceso.find(r => r.code === item.code) && !discarded.find(d => d.code === item.code)) {
        // Distinguir: ya tenía ese status (ok) vs no hubo cambio de status porque no llegó uno válido
        const noStatusIncoming = !item.status || item.status === 'pendiente'; // T-202606-034: item.status ya canónico — comparación directa
        const alreadyInStatus = newStatus === oldStatus;
        if (alreadyInStatus && !noStatusIncoming) {
          ignored.push({ code: item.code, reason: 'ya-en-status', desc: existing.title, status: oldStatus });
        } else if (noStatusIncoming) {
          ignored.push({ code: item.code, reason: 'sin-status', desc: existing.title });
        } else {
          ignored.push({ code: item.code, reason: 'sin-cambios', desc: existing.title });
        }
      }
    } else {
      // AC-9: ítem nuevo — marcar si no tenía código real
      const isNew = item._wasAssigned;
      const nowTs = Date.now();
      const initialStatus = item.status || 'pendiente'; // T-202606-034: item.status ya canónico desde T1

      // T-202606-010: R sin Ts válidos → degradar a P antes de persistir.
      // Un R es válido como R solo si hay al menos un T (no descartado) que lo referencia.
      // Se busca en: (a) el propio batch tgItems del CHECKPOINT, (b) getItems() existentes.
      // Si no hay ninguno → ingestar como P con campos preservados: title, area, priority, intencion.
      // Campos descartados: ac, kill_criteria, depends_on, parent, schema_version.
      const _incomingTypePreCheck = item.type || (item.code ? item.code.charAt(0) : '');
      if (_incomingTypePreCheck === 'R') {
        const _rCode = item.code;
        const _hasChildInBatch = tgItems.some(i => {
          const iType = i.type || (i.code ? i.code.charAt(0) : '');
          const iParent = i.parentId || i.parent || null;
          return iType === 'T' && iParent === _rCode && i.status !== 'descartado' && i.status !== 'discarded';
        });
        const _hasChildInBacklog = getItems() && getItems().some(i =>
          i.parentId === _rCode && i.type === 'T' && i.status !== 'descartado'
        );
        if (!_hasChildInBatch && !_hasChildInBacklog) {
          // Degradar: ingestar como P
          const _degradedItem = {
            id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2,6),
            code: _rCode,
            type: 'P',
            title: item.title || _rCode,
            desc: '',
            priority: item.priority || 'medium',
            area: item.area || '',
            effort: 1,
            impact: 'Medio',
            status: 'pendiente',
            version: 'futura',
            sprint: item.sprint || '',
            ac: [],
            role: item.role || '',
            origin: null,
            parentId: null,
            dependsOn: [],
            triggeredBy: null,
            origenP: null,
            promovida_a: null,
            blockedBy: [],
            blocking: false,
            sessionId: sessionId || null,
            createdAt: nowTs,
            statusChangedAt: nowTs,
            doneAt: null,
            ...(item.intencion ? { intencion: item.intencion } : {})
          };
          if (!_dryRun) {
            getItems().push(_degradedItem);
            _blogLog('r-degradado-a-p', _rCode, _rCode + ' sin Ts válidos convertido a P — refinar antes de promover', 'backlog');
            changed = true;
          }
          created.push({ code: _rCode, desc: item.title, _wasAssigned: isNew, _degradedFromR: true });
          // Actualizar contadores
          if (!_dryRun) {
            const _numMatch = _rCode.match(/[PTRB]-\d{6}-(\d{3})/);
            if (_numMatch) {
              const _num = parseInt(_numMatch[1]);
              const _metaDegrad = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
              if (!_metaDegrad.counters) _metaDegrad.counters = { P:0, T:0, R:0, B:0 };
              // Registrar en P (ítem degradado vive como P)
              if (_num > (_metaDegrad.counters['P'] || 0)) {
                _metaDegrad.counters['P'] = _num;
                localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(_metaDegrad));
              }
            }
          }
          return; // saltar el resto del procesamiento de ítem nuevo
        }
      }

      // R-202605-021: resolver parentId para ítems nuevos
      // AC: solo T o B pueden tener parentId — R con parentId → ignorar + DocLog
      // AC: si parentId apunta a T o B existente → ignorar + DocLog
      // AC: si parentId no existe en backlog → ignorar + DocLog
      let _resolvedParentId = null;
      const _incomingType = item.type || (item.code ? item.code.charAt(0) : 'T');
      if (item.parentId) {
        if (_incomingType === 'R') {
                      _blogLog('parentId-ignorado', item.code || '', 'parentId ignorado: ítems tipo R no pueden tener padre. parentId recibido: ' + item.parentId, 'backlog');
        } else {
          const _parentCandidate = getItems().find(p => p.code === item.parentId);
          if (!_parentCandidate) {
                          _blogLog('parentId-ignorado', item.code || '', 'parentId ignorado: código ' + item.parentId + ' no existe en el backlog', 'backlog');
          } else if (_parentCandidate.type !== 'R') {
                          _blogLog('parentId-ignorado', item.code || '', 'parentId ignorado: ' + item.parentId + ' es de tipo ' + _parentCandidate.type + ' — solo R puede ser padre', 'backlog');
          } else {
            _resolvedParentId = item.parentId;
          }
        }
      }

      // B-202604-015: heredar sprint del padre si el ítem no trae sprint propio
      const _parentSprint = (!item.sprint && _resolvedParentId)
        ? (getItems().find(p => p.code === _resolvedParentId) || {}).sprint || ''
        : '';
      if (!_dryRun) {
        getItems().push({
          id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2,6),
          code: item.code,
          type: _incomingType,
          title: item.title || item.code,
          desc: '',
          priority: item.priority || 'medium',  // T-202606-032 / B-202606-015: tomar priority del ítem entrante — no hardcodear 'medium'
          area: item.area || '',
          effort: item.effort || 1,
          impact: 'Medio',
          status: initialStatus,
          version: 'futura',
          sprint: item.sprint || _parentSprint,
          ac: item.ac || [],
          role: item.role || '',
          origin: item.origin || null,
          parentId: _resolvedParentId,
          dependsOn: item.dependsOn || [],
          triggeredBy: item.triggeredBy || null,
          origenP: item.origenP || null,
          promovida_a: item.promovida_a || null,
          // T-202606-025: persistir discard_reason solo en P con status descartado
          ...(_incomingType === 'P' && initialStatus === 'descartado' && item.discard_reason !== undefined
            ? (() => {
                const _VALID_DISCARD_REASONS = new Set(['duplicado', 'fuera de alcance', 'reemplazado', 'obsoleto']);
                if (!_VALID_DISCARD_REASONS.has(item.discard_reason)) {
                  _blogLog('discard-reason-no-canonico', item.code, 'discard_reason con valor no canónico: ' + item.discard_reason, 'backlog');
                }
                return { discard_reason: item.discard_reason };
              })()
            : {}),
          blockedBy: item.blockedBy || [],
          blocking: item.blocking || false,
          sessionId: sessionId || null,
          createdAt: nowTs,
          statusChangedAt: nowTs,
          doneAt: initialStatus === 'done' ? nowTs : null
        });
        _blogLog('ckpt-creado', item.code, item.title || '', 'backlog');
        changed = true;

        // R-[pendiente-ID]: si el nuevo ítem tiene origin → cerrar automáticamente el P padre
        if (item.origin) {
          const pParent = getItems().find(p => p.code === item.origin);
          if (pParent && pParent.status !== 'done') {
            pParent.status = 'done';
            pParent.doneAt = pParent.doneAt || nowTs;
            pParent.statusChangedAt = nowTs;
            pParent.discardRef = item.code;
            _blogLog('ckpt-promovido', item.origin, item.origin + ' → ' + item.code, 'backlog');
          }
        }
      }
      // B-202604-198: si el ítem nace con status done en el mismo CHECKPOINT → grupo propio
      const initialStatusForGroup = item.status || 'pendiente'; // T-202606-034: item.status ya canónico desde T1
      if (initialStatusForGroup === 'done') {
        createdAndClosed.push({ code: item.code, desc: item.title, _wasAssigned: isNew });
      } else {
        created.push({ code: item.code, desc: item.title, _wasAssigned: isNew });
      }
    }
    // Actualizar contadores en backlog-meta (no en dryRun)
    if (!_dryRun) {
      const typeChar = item.code[0];
      if ('PTRB'.includes(typeChar)) {
        const numMatch = item.code.match(/[PTRB]-\d{6}-(\d{3})/);
        if (numMatch) {
          const num = parseInt(numMatch[1]);
          const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
          if (!meta.counters) meta.counters = { P:0, T:0, R:0, B:0 };
          if (num > (meta.counters[typeChar] || 0)) {
            meta.counters[typeChar] = num;
            localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
          }
        }
      }
    }
  });

  if (!_dryRun && changed) {
    saveBacklog(); // B-202605-007: _undoSnapshot() movido antes del forEach
    _setBacklogModified();
    renderStats(); // siempre actualizar stat bar aunque no estemos en tab Backlog
    if (getCurrentTab() === 'backlog') { _markBacklogListDirty(); renderBacklogList(); updateBacklogBanner(); }
  }
  return { created, advanced, retroceso, discarded, updated, ignored, createdAndClosed, tmpSuggestions, invalidTransition: validateLifecycleTransitions(tgItems) }; // T-202606-020
}




// T-202606-034: _tgStatusToBacklog y _normalizeStatus eliminadas — item.status llega canónico desde locus-session-parse.js (_canonicalStatus)

// T-202605-083: _staleness — punto único de cálculo de días de estancamiento para staleness-pill
// Retorna objeto { days, modifier, label } si el pill debe renderizar, null si no aplica.
// Gate: _hasRecentSession debe retornar false (ítem sin sesión reciente).
// Modificadores: fresh (≤3d) · warn (4–7d) · stale (>7d).
// Si statusChangedAt y createdAt son ambos null/undefined → retorna null (sin crash, sin valor inventado).
function _staleness(item) {
  if (!item || item.status !== 'pendiente') return null;
  if (!item.sprint || item.sprint === 'n/a') return null;
  if (!item.createdAt) return null;
  if (_hasRecentSession(item)) return null;
  const _refTs = item.statusChangedAt || item.createdAt;
  if (!_refTs) return null;
  const days = Math.floor((Date.now() - _refTs) / 86400000);
  const modifier = days <= 3 ? 'fresh' : days <= 7 ? 'warn' : 'stale';
  const label = days === 0 ? 'hoy' : days === 1 ? '1d' : days + 'd';
  return { days, modifier, label };
}

// R-202604-091: decorador de actividad — pendiente con sesión vinculada en los últimos 7 días
const _ACTIVE_RECENT_DAYS = 7;
function _isActiveRecently(item) {
  if (!item || item.status !== 'pendiente') return false;

  const allSessions = getAllSessions();
  let lastTs = 0;
  allSessions.forEach(s => {
    if ((s.backlogRefs || s.trackerRefs || []).includes(item.code)) {
      const ts = s.savedAt || s.createdAt || 0;
      // R-202605-041: excluir sesiones anteriores al createdAt del ítem
      // Ítems legacy sin createdAt → comportamiento anterior sin cambio
      if (item.createdAt && ts < item.createdAt) return;
      if (ts > lastTs) lastTs = ts;
    }
  });
  if (!lastTs) return false;
  return (Date.now() - lastTs) / 86400000 <= _ACTIVE_RECENT_DAYS;
}


// R-202605-062: applyPatchesFromTG — aplica patches de campo individual sobre ítems existentes
// AC-1: type: "patch" es instrucción de operación — no tipo de ítem
// AC-2: solo requiere code + campos a patchear
// AC-3: campos patcheables: title, status, priority, effort, area, sprint, role, ac, origin
// AC-3b: campos no patcheables (code, type, schema_version) → advertencia DocLog, sin crash
// AC-4: ac presente → reemplaza array completo
// AC-5: código no existe en backlog → advertencia DocLog, sin crash
// AC-6: código placeholder → ignorado (manejado en parsePaste antes de llegar aquí)
// AC-7: status done → mismas reglas de confirmación que done manual (vía setItemStatus)
// AC-8: mezcla ítems + patches en mismo ---getItems()--- → parser separa por type
// AC-9: panel diff muestra solo campos del patch (changes array)
// AC-11: sin regresión en mergeBacklogFromTG
const _PATCH_ALLOWED_FIELDS = new Set(['title', 'status', 'priority', 'effort', 'area', 'sprint', 'role', 'ac', 'origin', 'parentId', 'promovida_a', 'origenP', 'discard_reason']); // R-202605-004: origin patcheable · B-202605-016: parentId patcheable · T-202605-137: promovida_a + origenP patcheables · T-202606-025: discard_reason patcheable
const _PATCH_NON_PATCHEABLE = new Set(['code', 'type', 'schema_version']);

export function applyPatchesFromTG(patches, sessionId) {
  if (!patches || !patches.length) return { patched: [], ignored: [] };

  const patched = [];
  const ignoredPatches = [];

  _undoSnapshot();

  patches.forEach(patch => {
    // B-202605-016: normalizar campo parent (schema CHECKPOINT) → parentId (campo interno)
    if (patch.parent && !patch.parentId) { patch.parentId = patch.parent; }
    const code = patch.code;

    // AC-5: código no existe en backlog → advertencia DocLog
    const existing = (typeof getItems() !== 'undefined') ? getItems().find(i => i.code === code) : null;
    if (!existing) {
              _blogLog('patch-ignorado', code, 'Patch ignorado: código no existe en el backlog. code: ' + code, 'backlog');
      ignoredPatches.push({ code, reason: 'no-existe' });
      return;
    }

    // AC-3b: advertir sobre campos no patcheables presentes en el objeto patch
    Object.keys(patch).forEach(k => {
      if (_PATCH_NON_PATCHEABLE.has(k)) {
                  _blogLog('patch-campo-ignorado', code, 'Campo no patcheable ignorado: ' + k, 'backlog');
      }
    });

    const changes = [];
    const nowTs = Date.now();

    // Iterar solo sobre campos patcheables presentes en el objeto patch
    _PATCH_ALLOWED_FIELDS.forEach(field => {
      if (!(field in patch)) return; // campo no incluido en este patch → no tocar
      const incoming = patch[field];
      const current  = existing[field];

      if (field === 'status') {
        const normalized = incoming; // T-202606-034: incoming ya canónico desde parser — _normalizeStatus eliminada
        if (normalized !== existing.status) {
          const _prevStatus = existing.status;
          if (normalized === 'done') {
            // B-202605-XXX: patch programático → _applyDoneStatus directo, sin modal inline
            // setItemStatus dispara _showInlineConfirmDone para ítems en sprint activo,
            // lo que requiere interacción del usuario y cancela el patch silenciosamente.
            _applyDoneStatus(existing.code);
            changes.push({ field: 'status', from: _prevStatus, to: normalized });
          } else if (normalized && normalized !== existing.status) {
            changes.push({ field: 'status', from: existing.status, to: normalized });
            existing.status = normalized;
            existing.statusChangedAt = nowTs;
          }
        }
        return;
      }

      if (field === 'ac') {
        // AC-4: ac reemplaza array completo
        if (Array.isArray(incoming)) {
          changes.push({ field: 'ac', from: existing.ac || [], to: incoming });
          existing.ac = incoming;
        }
        return;
      }

      if (field === 'sprint') {
        // Sprint: aplicar _normalizeSprint sobre objeto temporal para normalizar centinelas
        const tempItem = { sprint: incoming };
        _normalizeSprint(tempItem);
        const normalizedSprint = tempItem.sprint; // undefined si centinela, valor si válido
        if (normalizedSprint !== current) {
          changes.push({ field: 'sprint', from: current || '—', to: normalizedSprint });
          if (normalizedSprint === undefined) delete existing.sprint;
          else existing.sprint = normalizedSprint;
        }
        return;
      }

      // Resto de campos patcheables: title, priority, effort, area, role, origenP
      // T-202605-137: promovida_a — campo especial: al patchear en una P, escribir origenP en el destino
      // T-202606-019: si promovida_a es placeholder → intentar resolver contra getItems() (ítems recién ingresados)
      if (field === 'promovida_a') {
        if (incoming !== undefined && incoming !== null && incoming !== current) {
          let resolvedIncoming = incoming;
          // T-202606-019 AC1: resolver placeholder contra ítems ya en getItems()
          // mergeBacklogFromTG corre antes de applyPatchesFromTG — los ítems nuevos ya tienen código real
          if (_isPlaceholderCode(incoming) && typeof getItems() !== 'undefined') {
            // Buscar ítem recién creado cuyo origenP apunta a esta P, o cuyo código es real y fue
            // creado en este CHECKPOINT (no tiene origenP aún pero puede inferirse si solo hay un candidato)
            const candidates = getItems().filter(i =>
              !_isPlaceholderCode(i.code) &&
              (i.origenP === existing.code || (!i.origenP && i.code !== existing.code))
            );
            // Preferir candidato con origenP ya escrito (resolución determinista)
            const withOrigenP = candidates.find(i => i.origenP === existing.code);
            if (withOrigenP) {
              resolvedIncoming = withOrigenP.code;
            } else {
              // No resoluble con certeza — conservar placeholder + advertencia
              _blogLog('promovida-a-placeholder-en-patch', existing.code,
                'promovida_a en patch contiene placeholder ' + incoming + ' — no resoluble en applyPatchesFromTG. Usar código real en el patch.',
                'backlog');
            }
          }
          changes.push({ field, from: current !== undefined ? current : '—', to: resolvedIncoming });
          existing[field] = resolvedIncoming;
          // AC edge case: si promovida_a apunta a código real existente, escribir origenP en el destino
          if (!_isPlaceholderCode(resolvedIncoming)) {
            const destItem = (typeof getItems() !== 'undefined') ? getItems().find(i => i.code === resolvedIncoming) : null;
            if (destItem && !destItem.origenP) {
              destItem.origenP = existing.code;
              _blogLog('origen-p-escrito', existing.code, existing.code + ' → origenP en ' + resolvedIncoming, 'backlog');
            }
          }
        }
        return;
      }
      // T-202606-025: discard_reason — solo persiste en P con status descartado
      if (field === 'discard_reason') {
        const _targetType = existing.type;
        const _targetStatus = existing.status;
        // AC-3: si el ítem no es P con status descartado → ignorar silenciosamente
        if (_targetType !== 'P' || _targetStatus !== 'descartado') return;
        if (incoming !== undefined && incoming !== null && incoming !== current) {
          const _VALID_DISCARD_REASONS = new Set(['duplicado', 'fuera de alcance', 'reemplazado', 'obsoleto']);
          if (!_VALID_DISCARD_REASONS.has(incoming)) {
            _blogLog('discard-reason-no-canonico', code, 'discard_reason con valor no canónico: ' + incoming, 'backlog');
          }
          changes.push({ field, from: current !== undefined ? current : '—', to: incoming });
          existing[field] = incoming;
        }
        return;
      }
      if (incoming !== undefined && incoming !== null && incoming !== current) {
        changes.push({ field, from: current !== undefined ? current : '—', to: incoming });
        existing[field] = incoming;
      }
    });

    if (changes.length) {
      // Registrar en history del ítem
      if (!existing.history) existing.history = [];
      changes.forEach(ch => {
        if (ch.field === 'status') return; // status lo registra setItemStatus
        existing.history.push({
          type: 'field',
          ts: nowTs,
          origin: 'patch',
          sessionId: sessionId || null,
          data: { field: ch.field, from: ch.from !== '—' ? ch.from : null, to: ch.to || null }
        });
      });
      if (sessionId && existing.sessionId !== sessionId) existing.sessionId = sessionId;

      patched.push({
        code,
        desc: existing.title,
        changes,
        change: changes.map(c => c.field).join(' · ')
      });

      saveBacklog();
    } else {
      ignoredPatches.push({ code, reason: 'sin-cambios' });
    }
  });

  _markBacklogListDirty(); renderBacklogList();
  renderStats();

  return { patched, ignored: ignoredPatches };
}


