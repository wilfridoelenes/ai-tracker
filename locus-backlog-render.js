// [PP] v1.2.4 · sprint:PP-S-14 · mod:14 · autor:Rune · 2026-05-31 UTC-6
import { renderArchivoHistorico, toggleArchivoHistorico } from './locus-backlog-archive.js';
import { _buildRoleChips, _getMiViewLabel, _getMiViewRoles, _hasDepsBlocked, _isBlocked, _isCountableItem, _skelHide, _skelShow, _undoSnapshot, itemType, renderStats, toggleBacklogFocusMode, updateStatusFilterUI, _getBacklogTreeMode, _getBacklogKanbanMode, _getBacklogFocusMode, _getBacklogMikeMode, _getBacklogSprintGroupMode, _getBacklogNoAcMode, _getActiveTypes, _getActiveStatuses, _getActiveEfforts, _getActiveRoleFilter, _getActivePriorityFilter, _getBacklogBlockerFilter, _getDepsFilter, _getBacklogSortMode, _getBacklogSortDir, _getMiViewRoleIndex, _getBacklogSearchQuery, _getCollapsedVersions, toggleTypeFilter, toggleStatusFilter, toggleVersionCollapse, toggleSectionGroup, toggleEffortFilter, toggleRoleFilter, toggleBacklogMikeMode, toggleBacklogNoAcMode } from './locus-backlog-core.js';

import { _attachBacklogDnD, _attachBacklogListDelegation, _collapsedChildren, _renderKanban, buildBacklogItem, setFilter, updateBacklogFooter } from './locus-backlog-item.js';

import { _getActiveSprint, _getSprintById, openSprintRetroView, setItemSprint } from './locus-backlog-sprints.js';

import { _setBacklogModified } from './locus-docs.js';

import { _getActiveProjectFilter, openProjPanel } from './locus-sprint-project.js';

import { getActiveSprints } from './locus-storage.js';

import { showToast } from './locus-toast.js';

import { esc, switchTab } from './locus-ui-shell.js';
import { _renderPlanningView, _attachPlanViewDelegation, _statusPills, toggleClosedSprintsBody } from './locus-sprint-planificacion.js';

// [PP] v1.2.4 · sprint:PP-S-09 · mod:5 · autor:Rune · 2026-05-28 UTC-6
// Responsabilidad: Renderizado del backlog — vista árbol, sprint health panel,
//   roadmap, planning (drag & drop), renderBacklogList, sprint selector inline.
// Dependencias: locus-backlog-core.js · locus-backlog-archive.js · locus-backlog-item.js · locus-backlog-sprints.js

// T-202604-187: colapsar/expandir bloque de hijos de un R
function toggleChildrenBlock(rCode) {
  if (_collapsedChildren.has(rCode)) {
    _collapsedChildren.delete(rCode);
  } else {
    _collapsedChildren.add(rCode);
  }
  const body = document.getElementById('rchildren-body-' + CSS.escape(rCode));
  const arrow = document.getElementById('rchildren-arrow-' + CSS.escape(rCode));
  if (body) body.classList.toggle('collapsed', _collapsedChildren.has(rCode));
  if (arrow) arrow.textContent = _collapsedChildren.has(rCode) ? '▸' : '▾';
}

// R-202604-016: asignar parent a un T/B desde item-body
function setItemParent(code, parentCode) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  item.parentId = parentCode || null;
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList();
  renderStats();
  showToast('success', parentCode ? `${code} vinculado a ${parentCode}` : `${code} desvinculado`);
}

export function updateClearFilterBtn() {
  const btn = document.getElementById('filter-clear-btn');
  if (!btn) return;
  const allTypes = _getActiveTypes().size === 4;
  const defaultStatus = _getActiveStatuses().size === 1 && _getActiveStatuses().has('pendiente') && !_getActiveStatuses().has('done');
  const noSearch = !_getBacklogSearchQuery();
  const noRoleFilter = _getActiveRoleFilter() === null;
  const noPriorityFilter = _getActivePriorityFilter().size === 0; // T-202604-357
  const isDefault = allTypes && defaultStatus && noSearch && noRoleFilter && noPriorityFilter && !_getBacklogFocusMode() && !_getBacklogNoAcMode();
  btn.classList.toggle('is-hidden', isDefault);

  // R-202605-094: chips individuales limpiables por filtro activo
  const wrap = document.getElementById('active-filter-chips');
  if (!wrap) return;
  if (isDefault) { wrap.innerHTML = ''; return; }

  // Delegation en #active-filter-chips — se registra una sola vez
  if (!wrap._delegationAttached) {
    wrap._delegationAttached = true;
    wrap.addEventListener('click', function _afcClick(e) {
      const chip = e.target.closest('[data-afc]');
      if (!chip) return;
      const act = chip.dataset.afc;
      const val = chip.dataset.afcVal;
      if (act === 'type')          { if (typeof toggleTypeFilter     === 'function') toggleTypeFilter(val); }
      else if (act === 'status')   { if (typeof toggleStatusFilter   === 'function') toggleStatusFilter(val); }
      else if (act === 'role')     { if (typeof toggleRoleFilter     === 'function') toggleRoleFilter(val); }
      else if (act === 'priority') { if (typeof togglePriorityFilter === 'function') togglePriorityFilter(val); }
      else if (act === 'effort')   { if (typeof toggleEffortFilter   === 'function') toggleEffortFilter(parseInt(val, 10)); }
      else if (act === 'search')   { if (typeof clearBacklogSearch   === 'function') clearBacklogSearch(); }
      else if (act === 'noac')     { if (typeof toggleBacklogNoAcMode  === 'function') toggleBacklogNoAcMode(); }
      else if (act === 'focus')    { if (typeof toggleBacklogFocusMode === 'function') toggleBacklogFocusMode(); }
    });
  }

  const chips = [];
  const _chip = (label, afcAction, afcVal = '') =>
    `<span class="afc-chip" data-afc="${afcAction}" data-afc-val="${esc(String(afcVal))}">${esc(label)} <span class="afc-chip-x">✕</span></span>`;

  if (!allTypes) {
    const excluded = ['T','R','B','P'].filter(t => !_getActiveTypes().has(t));
    excluded.forEach(t => {
      const labels = { T:'Ticket', R:'Req', B:'Bug', P:'Posibilidad' };
      chips.push(_chip(`Sin ${labels[t]}`, 'type', t));
    });
  }
  if (!defaultStatus) {
    [..._getActiveStatuses()].filter(s => s !== 'pendiente').forEach(s => {
      chips.push(_chip(`+${s}`, 'status', s));
    });
    if (!_getActiveStatuses().has('pendiente')) {
      chips.push(_chip('−Pendiente', `function(){toggleStatusFilter('pendiente')}`));
    }
  }
  if (!noRoleFilter) {
    const label = _getActiveRoleFilter() === '__none__' ? 'Sin rol' : _getActiveRoleFilter();
    chips.push(_chip(`Rol: ${label}`, 'role', _getActiveRoleFilter()));
  }
  if (!noPriorityFilter) {
    [..._getActivePriorityFilter()].forEach(p => {
      chips.push(_chip(`Pri: ${p}`, 'priority', p));
    });
  }
  if (_getActiveEfforts().size < 3) {
    [1,2,3].filter(e => !_getActiveEfforts().has(e)).forEach(e => {
      chips.push(_chip(`Sin E${e}`, 'effort', e));
    });
  }
  if (!noSearch) chips.push(_chip(`"${_getBacklogSearchQuery()}"`, 'search'));
  if (_getBacklogNoAcMode()) chips.push(_chip('Sin AC', 'noac'));
  if (_getBacklogFocusMode()) chips.push(_chip('Focus top 10', 'focus'));

  wrap.innerHTML = chips.join('');
}

// T-202604-213: _statusPills — migrada a locus-sprint-planificacion.js (B-202605-046)
// R-202605-103: toggleClosedSprintsBody — migrada a locus-sprint-planificacion.js (B-202605-046)

// T-202604-290 · T-202605-450: velocidad por sprint — retorna { avg, sprints: [{id, label, planned, real}] }
// planned = suma effort asignado (excluye descartados)
// real    = suma effort done
export function _calcEstimatedVelocity() {
  const closedSprints = getActiveSprints()
    .filter(s => s.status === 'closed')
    .slice(-5); // R-202605-126: últimos 5 cerrados (antes: 3)
  if (closedSprints.length < 2) return null;
  const sprintData = closedSprints.map(sp => {
    const spItems = ITEMS.filter(i => i.sprint === sp.id && i.status !== 'descartado');
    const planned = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const real    = spItems.filter(i => i.status === 'done' || i.status === 'historico')
                           .reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    // R-202605-126: días activos del sprint para velocidad/día
    const tsStart  = sp.startedAt || sp.createdAt || null;
    const tsEnd    = sp.closedAt  || null;
    const daysActive = (tsStart && tsEnd)
      ? Math.max(1, Math.floor((tsEnd - tsStart) / 86400000))
      : null;
    const velPerDay = (daysActive !== null && real > 0)
      ? Math.round((real / daysActive) * 10) / 10
      : (daysActive !== null ? 0 : null);
    return { id: sp.id, label: sp.label || sp.id, planned, real, daysActive, velPerDay };
  });
  const reals = sprintData.map(d => d.real);
  const avg = Math.round((reals.reduce((a, b) => a + b, 0) / reals.length) * 10) / 10;
  return { avg, sprints: sprintData };
}

// R-202605-066: label inline de effort vs velocidad para header del sprint activo
// Retorna HTML con clase hsr-velocity, o '' si no hay sprint activo
function _sprintVelocityLabel(sprintId) {
  if (!sprintId) return '';
  const spItems = ITEMS.filter(i => (i.sprint || '').trim() === sprintId && i.status === 'pendiente');
  const effortTotal = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const vel = _calcEstimatedVelocity();
  const velLabel = (vel && typeof vel.avg === 'number') ? vel.avg : null;
  const velStr = velLabel !== null ? velLabel : '—';
  return `<span class="hsr-velocity">Effort: ${effortTotal} / vel. ${velStr}</span>`;
}

// T-202604-284: Sprint Roadmap — filtro activo (sprintId | null)
// T-202605-118: dirty flag — render quirúrgico
let _backlogListDirty = false;
export function _markBacklogListDirty() { _backlogListDirty = true; }
window._markBacklogListDirty = _markBacklogListDirty;

export function renderBacklogList(onRendered) {
  if (!_backlogListDirty) return;
  // AC-3 T-202605-118: skip si el item editor está abierto
  const _ieOverlay = document.getElementById('item-editor-overlay');
  if (_ieOverlay && _ieOverlay.offsetParent !== null) { return; }
  // B-202605-083: defer si hay input/textarea activo dentro de backlog-list
  const listEl = document.getElementById('backlog-list');
  const _ae = document.activeElement;
  if (listEl && _ae && listEl.contains(_ae) && (_ae.tagName === 'INPUT' || _ae.tagName === 'TEXTAREA')) {
    _ae.addEventListener('blur', function _deferRender() {
      if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty();
      renderBacklogList(onRendered);
    }, { once: true });
    return;
  }
  _backlogListDirty = false;
  _skelShow(listEl, 5);
  const q = _getBacklogSearchQuery();

  // R-[tmp:toolbar-backlog-redesign]: botones de vista ya son estáticos en HTML — solo actualizar estado
  (function _updateViewBtns() {
    const treeBtn   = document.getElementById('fbar-tree-btn');
    const focusBtn  = document.getElementById('fbar-focus-btn');
    const kanbanBtn = document.getElementById('fbar-kanban-btn');
    const mikeBtn   = document.getElementById('fbar-mike-btn');

    if (treeBtn) {
      treeBtn.classList.toggle('active', _getBacklogTreeMode());
      treeBtn.textContent = _getBacklogTreeMode() ? '⊞ Árbol' : '☰ Plano';
      treeBtn.title = _getBacklogTreeMode() ? 'Vista árbol activa — click para vista plana' : 'Vista plana activa — click para vista árbol';
    }
    if (kanbanBtn) {
      kanbanBtn.classList.toggle('active', _getBacklogKanbanMode());
      kanbanBtn.title = _getBacklogKanbanMode() ? 'Vista Kanban activa — click para desactivar' : 'Vista Kanban — columnas por status';
    }
    if (focusBtn) {
      focusBtn.classList.toggle('active', _getBacklogFocusMode());
      focusBtn.title = _getBacklogFocusMode()
        ? 'Focus activo — Top 10 por: tipo · sprint · effort · antigüedad · click para desactivar'
        : 'Activar Focus — Top 10 por: tipo · sprint · effort · antigüedad';
      if (!_getBacklogFocusMode()) focusBtn.textContent = '🎯 Focus';
    }
    // Mi vista — visible solo con sprint activo + roles disponibles
    if (mikeBtn) {
      const activeSprint = _getActiveSprint();
      const miRoles = _getMiViewRoles();
      const show = !!(activeSprint && miRoles.length);
      mikeBtn.classList.toggle('is-hidden', !show);
      if (show) {
        mikeBtn.classList.toggle('active', _getBacklogMikeMode());
        mikeBtn.textContent = _getBacklogMikeMode() ? _getMiViewLabel() : 'Mi vista';
      }
    }
    // Sin AC y bloqueados
    const noAcBtn = document.getElementById('fbar-no-ac-btn');
    if (noAcBtn) noAcBtn.classList.toggle('active', _getBacklogNoAcMode());
    const blockerBtn = document.getElementById('fbar-blocker-btn');
    if (blockerBtn) blockerBtn.classList.toggle('active', _getBacklogBlockerFilter());
    // R-[tmp:sprint-group-toggle]: botón agrupación por sprint
    const sprintBtn = document.getElementById('fbar-sprint-btn');
    if (sprintBtn) {
      sprintBtn.classList.toggle('active', _getBacklogSprintGroupMode());
      sprintBtn.title = _getBacklogSprintGroupMode() ? 'Agrupación por sprint activa — click para vista plana' : 'Vista plana activa — click para agrupar por sprint';
    }
  })();

  // Guard: backlog requiere proyecto activo
  if (!_getActiveProjectFilter()) {
    const hasProjects = (state.projects || []).length > 0;
    if (!hasProjects) {
      // R-202605-178: global empty — ningún proyecto creado → secuencia de primeros pasos
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🗂</div>
          <div class="empty-state-title">Crea tu primer proyecto para empezar</div>
          <div class="empty-state-hint">Sigue estos pasos para tener tu primer ítem en el backlog:</div>
          <ol class="empty-state-steps">
            <li><strong>Crea un proyecto</strong> en el tab Proyectos</li>
            <li><strong>Abre un sprint</strong> desde el Backlog</li>
            <li><strong>Registra tu primera sesión</strong> en el Tracker</li>
          </ol>
          <button class="empty-state-btn" data-action="es-switch-tab" data-tab="proyectos">Ir a Proyectos</button>
        </div>`;
    } else {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">Selecciona un proyecto</div>
          <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
          <button class="empty-state-btn" data-action="es-open-proj-panel">📁 Seleccionar proyecto</button>
        </div>`;
    }
    _skelHide(listEl);
    return;
  }

  if (!ITEMS.length) {
    // B-202605-062: diferenciar backlog vacío real vs proyecto sin datos en localStorage
    const _activeFilter = _getActiveProjectFilter();
    const _projKey = _activeFilter ? 'backlog-items-' + _activeFilter : null;
    const _hasStoredData = _projKey ? !!localStorage.getItem(_projKey) : false;
    if (_activeFilter && !_hasStoredData) {
      // Proyecto seleccionado pero sin datos en localStorage
      listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <div class="empty-state-title">Este proyecto no tiene ítems aún</div>
        <div class="empty-state-hint">Selecciona otro proyecto o empieza a registrar sesiones para ver ítems aquí.</div>
        <button class="empty-state-btn" data-action="es-open-proj-panel">Cambiar proyecto</button>
      </div>`;
      _skelHide(listEl);
      return;
    }
    // R-202605-178: backlog vacío — diferenciar sprint activo vs sin sprint
    const _activeSprint178 = _getActiveSprint();
    if (_activeSprint178) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">Registra tu primera sesión para ver ítems aquí</div>
          <div class="empty-state-hint">Tienes un sprint activo. Ve al Tracker, abre una sesión con tu IA y guarda el resultado.</div>
          <button class="empty-state-btn" data-action="es-switch-tab" data-tab="tracker">Ir al Tracker</button>
        </div>`;
    } else {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">Abre un sprint para empezar</div>
          <div class="empty-state-hint">El backlog necesita un sprint activo. Abre uno para organizar y ejecutar tu trabajo.</div>
          <button class="empty-state-btn" data-action="es-open-new-sprint">＋ Abrir sprint</button>
        </div>`;
    }
    _skelHide(listEl);
    return;
  }

  // T-202604-287: desviar a vista Kanban si está activa
  if (_getBacklogKanbanMode()) {
    _renderKanban(listEl);
    _updateDocLogCount('backlog');
    _skelHide(listEl);
    return;
  }

  // T-202604-245: inyectar/actualizar barra de chips de rol
  (function _ensureRoleBar() {
    const filterBar = document.getElementById('filter-bar-status'); // bl-filter-strip
    if (!filterBar) return;
    const existing = document.getElementById('frole-bar');
    const newHtml = _buildRoleChips();
    if (!newHtml) { if (existing) existing.remove(); return; }
    if (existing) { existing.outerHTML = newHtml; } else { filterBar.insertAdjacentHTML('afterend', newHtml); }
  })();

  // Filtrado por tipo + status + effort (T-071)
  // T-202604-048/187: excluir T/B con parentId en modo árbol — en modo plano se muestran todos
  // B-202604-193: excluir ítems históricos del plano activo — van a sección colapsada al fondo
  let filtered = ITEMS.filter(i => {
    if (i.status === 'historico') return false;
    const type = itemType(i.code);
    const typeOk = type ? _getActiveTypes().has(type) : true;
    const statusOk = _getActiveStatuses().has(i.status);
    const _rawEffort = parseInt(i.effort) || 1;
    const _normEffort = _rawEffort > 3 ? 3 : _rawEffort < 1 ? 1 : _rawEffort;
    const effortOk = _getActiveEfforts().has(_normEffort); // T-071 · B-202605-233: effort >3 normalizado a 3
    // T-202604-245: filtro de rol
    let roleOk = true;
    if (_getActiveRoleFilter() === '__none__') {
      roleOk = !i.role || !i.role.trim();
    } else if (_getActiveRoleFilter() !== null) {
      roleOk = (i.role || '').trim() === _getActiveRoleFilter();
    }
    const isChild = !!i.parentId; // en modo árbol, hijos aparecen bajo su R padre
    // T-202604-357: filtro por prioridad — vacío = todos
    let priorityOk = true;
    if (_getActivePriorityFilter().size > 0) {
      const p = i.priority || 'medium';
      const isHigh = p === 'high' || p === 'important' || p === 'critical' || p === 'importante';
      const isLow  = p === 'low' || p === 'futura' || p === 'baja';
      if (_getActivePriorityFilter().has('high') && isHigh) priorityOk = true;
      else if (_getActivePriorityFilter().has('low') && isLow) priorityOk = true;
      else if (_getActivePriorityFilter().has('medium') && !isHigh && !isLow) priorityOk = true;
      else priorityOk = false;
    }
    return typeOk && statusOk && effortOk && roleOk && priorityOk && (_getBacklogTreeMode() ? !isChild : true);
  });

  // T-202604-363: Sin AC — solo pendientes sin criterios de aceptación
  if (_getBacklogNoAcMode()) {
    filtered = filtered.filter(i => i.status === 'pendiente' && (!i.ac || !i.ac.length));
  }

  // R-[tmp:toolbar-backlog-redesign]: solo bloqueados — pendiente con sprint asignado sin cambio >14 días
  if (_getBacklogBlockerFilter()) {
    filtered = filtered.filter(i => _isBlocked(i));
  }

  // T-202605-449: filtro por dependencias explícitas bloqueantes
  if (_getDepsFilter() === 1) {
    filtered = filtered.filter(i => _hasDepsBlocked(i));
  } else if (_getDepsFilter() === 2) {
    filtered = filtered.filter(i => !_hasDepsBlocked(i) && i.status === 'pendiente');
  }

  if (q) {
    filtered = filtered.filter(i =>
      i.code.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      (i.area || '').toLowerCase().includes(q)
    );
  }

  updateClearFilterBtn();

  // R-202605-165: Focus mode — Top-10 sprint-aware con .blf-hidden + aria-hidden (CSS collapse 150ms)
  // AC: sprint activo + high→medium primero · sin sprint activo: score global · ≤10 = todos visibles
  // AC: NO filtra filtered — aplica _blfHidden en ítems fuera del Top-10 → buildBacklogItem añade clase
  filtered.forEach(item => { delete item._blfHidden; delete item._focusRank; });
  if (_getBacklogFocusMode()) {
    const pendienteFiltered = filtered.filter(i => i.status === 'pendiente');
    const _focusActiveSprint = _getActiveSprint();
    let sorted;
    if (_focusActiveSprint) {
      // Sprint activo: high→medium en sprint activo primero, luego resto por score
      const _priVal = p => { const v = p || 'medium'; return (v === 'high' || v === 'important' || v === 'critical' || v === 'importante') ? 0 : (v === 'medium') ? 1 : 2; };
      const inSprint  = pendienteFiltered.filter(i => (i.sprint || '').trim() === _focusActiveSprint.id && _priVal(i.priority) <= 1);
      const outSprint = pendienteFiltered.filter(i => !((i.sprint || '').trim() === _focusActiveSprint.id && _priVal(i.priority) <= 1));
      inSprint.sort((a, b) => _priVal(a.priority) - _priVal(b.priority) || (b._score || 0) - (a._score || 0));
      outSprint.sort((a, b) => (b._score || 0) - (a._score || 0));
      sorted = [...inSprint, ...outSprint];
    } else {
      sorted = [...pendienteFiltered].sort((a, b) => (b._score || 0) - (a._score || 0));
    }
    const showAll = sorted.length <= 10;
    const top10Codes = new Set(sorted.slice(0, 10).map(i => i.code));
    // Estampar rank y flag oculto — buildBacklogItem aplica .blf-hidden + aria-hidden
    sorted.slice(0, 10).forEach((item, idx) => { item._focusRank = idx + 1; });
    filtered.forEach(item => {
      if (item.status !== 'pendiente' || !top10Codes.has(item.code)) item._blfHidden = true;
    });
    // AC: label dinámico en botón con conteo real
    const focusBtn = document.getElementById('fbar-focus-btn');
    if (focusBtn) {
      const visibleCount = Math.min(sorted.length, 10);
      focusBtn.textContent = `🎯 Focus (${showAll ? 'todos' : visibleCount})`;
    }
  }

  // T-202604-313/366: Mi vista — T's pendientes del rol activo en sprint activo
  if (_getBacklogMikeMode()) {
    const _activeSprint = _getActiveSprint();
    if (_activeSprint) {
      const _miRoles = _getMiViewRoles();
      const _miRole = _miRoles[_getMiViewRoleIndex() % _miRoles.length] || null;
      filtered = filtered.filter(i =>
        itemType(i.code) === 'T' &&
        i.status === 'pendiente' &&
        i.sprint === _activeSprint.id &&
        (!_miRole || (i.role || '').trim() === _miRole)
      );
    }
  }

  // T-202604-065: sort dentro de cada grupo — T-072: respeta _getBacklogSortDir()
  const _priOrder = { high: 0, important: 0, critical: 0, importante: 0, medium: 1, low: 2, futura: 2, baja: 2 };
  const _typeOrder = { B: 0, T: 1, R: 2, I: 3 };
  const _dir = _getBacklogSortDir() === 'desc' ? -1 : 1;

  // T-202604-424: sort interno dentro de cada grupo de sprint — priority desc → effort asc
  // B-[pendiente-ID]: aplicar _dir para respetar _getBacklogSortDir() — el botón ↑↓ ahora funciona en modo sprint group
  function _sortGroup(arr) {
    return [...arr].sort((a, b) => {
      const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
      if (pa !== pb) return (pa - pb) * _dir;
      const ea = parseInt(a.effort) || 1, eb = parseInt(b.effort) || 1;
      if (ea !== eb) return (ea - eb) * _dir;
      return a.code.localeCompare(b.code) * _dir;
    });
  }

  function _sortItems(arr) {
    return [...arr].sort((a, b) => {
      let cmp = 0;
      if (_getBacklogSortMode() === 'priority') {
        const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
        cmp = pa !== pb ? pa - pb : a.code.localeCompare(b.code);
      } else if (_getBacklogSortMode() === 'effort') {
        const ea = parseInt(a.effort) || 1, eb = parseInt(b.effort) || 1;
        cmp = ea !== eb ? eb - ea : a.code.localeCompare(b.code);
      } else if (_getBacklogSortMode() === 'type') {
        const ta = _typeOrder[itemType(a.code)] ?? 9, tb = _typeOrder[itemType(b.code)] ?? 9;
        cmp = ta !== tb ? ta - tb : a.code.localeCompare(b.code);
      } else if (_getBacklogSortMode() === 'completedAt') {
        // Ítems sin doneAt van al final (independiente de dir)
        const ha = a.doneAt != null, hb = b.doneAt != null;
        if (ha !== hb) return ha ? -1 : 1; // los que tienen fecha primero
        cmp = ha && hb ? (a.doneAt - b.doneAt) : a.code.localeCompare(b.code);
      } else if (_getBacklogSortMode() === 'createdAt') {
        // Ítems sin createdAt van al final (independiente de dir)
        const ha = a.createdAt != null, hb = b.createdAt != null;
        if (ha !== hb) return ha ? -1 : 1;
        cmp = ha && hb ? (a.createdAt - b.createdAt) : a.code.localeCompare(b.code);
      } else {
        cmp = a.code.localeCompare(b.code);
      }
      return cmp * _dir;
    });
  }

  // T-202604-061: separar done/descartado del resto
  // T-202604-082: modo sprint = agrupado por sprint; otros modos = lista plana
  // B-202604-131: aplicar filtro de búsqueda a done/descartado cuando q está activo
  // R-202604-091: 'en curso' fusionado — todos los pendiente van juntos, decorador visual separa activos
  // T-202604-427: P (ideas) separadas del flujo de trabajo activo — sección propia al final
  const ideaItems      = filtered.filter(i => i.status !== 'done' && i.status !== 'descartado' && itemType(i.code) === 'P');
  const pendienteItems = filtered.filter(i => i.status !== 'done' && i.status !== 'descartado' && itemType(i.code) !== 'P');
  const _matchesQuery = q
    ? (i => i.code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || (i.area || '').toLowerCase().includes(q))
    : () => true;
  const doneItems      = _getActiveStatuses().has('done')
    ? ITEMS.filter(i => i.status === 'done' && _isCountableItem(i) && _matchesQuery(i))
    : [];
  const descartadoItems = _getActiveStatuses().has('descartado')
    ? ITEMS.filter(i => i.status === 'descartado' && _matchesQuery(i))
    : [];

  let html = '';

  // B-202605-206: agrupación por sprint es el comportamiento por defecto.
  // T-202604-424 eliminó 'sprint' como opción del selector de sort, pero la condición de entrada
  // quedó atada a _getBacklogSortMode() === 'sprint' — inalcanzable. Fix: agrupar siempre que no haya
  // un modo exclusivo activo que tome control del rendering (kanban, focus, mike, noAc).
  const _useSprintGroups = _getBacklogSprintGroupMode() && !_getBacklogKanbanMode() && !_getBacklogFocusMode() && !_getBacklogMikeMode() && !_getBacklogNoAcMode();

  if (_useSprintGroups) {
    // ── Modo Sprint: agrupar pendientes por sprint ──
    // T-202605-104: ítems icebox separados del sprintMap — sección propia al final
    const _isIcebox = i => !i.sprint || i.sprint === 'icebox' || i.sprint === '';
    const iceboxItems = pendienteItems.filter(_isIcebox);
    const sprintableItems = pendienteItems.filter(i => !_isIcebox(i));

    const sprintMap = {};
    sprintableItems.forEach(i => {
      const s = (i.sprint || '').trim();
      const key = s || '__sin_asignar__';
      if (!sprintMap[key]) sprintMap[key] = [];
      sprintMap[key].push(i);
    });

    // P-202604-097: orden visual — activos primero, luego abiertos por número, sin asignar al final
    const sprintKeys = Object.keys(sprintMap)
      .filter(k => k !== '__sin_asignar__')
      .sort((a, b) => {
        const sa = _getSprintById(a), sb = _getSprintById(b);
        const rankA = sa?.status === 'active' ? 0 : sa?.status === 'closed' ? 2 : 1;
        const rankB = sb?.status === 'active' ? 0 : sb?.status === 'closed' ? 2 : 1;
        if (rankA !== rankB) return rankA - rankB;
        const na = parseInt(a.replace(/\D/g, '')) || 0;
        const nb = parseInt(b.replace(/\D/g, '')) || 0;
        return na - nb;
      });
    if (sprintMap['__sin_asignar__']) sprintKeys.push('__sin_asignar__');

    // B-202605-XXX: sprints abiertos sin pendientes — renderizar header con botón cerrar
    // aunque no aparezcan en sprintMap (todos sus ítems están done)
    const _allOpenSprints = getActiveSprints().filter(s => s.status !== 'closed');
    _allOpenSprints.forEach(s => {
      if (sprintMap[s.id]) return; // ya está en el mapa, se procesa abajo
      const hasAnyItem = ITEMS.some(i => (i.sprint || '').trim() === s.id); // hasAnyItem: verifica cualquier ítem en el sprint, no solo done
      if (!hasAnyItem) return; // sprint vacío — ignorar
      const isClosed = s.status === 'closed'; // B-fix: no hardcodear false — usar status real del sprint
      if (isClosed) return; // sprint cerrado — no renderizar en este bloque, aparece en cerrados
      const isActive = s.status === 'active';
      const groupId = s.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const doneInGroup = ITEMS.filter(i => (i.sprint || '').trim() === s.id && i.status === 'done').length;
      const totalInGroup = ITEMS.filter(i => (i.sprint || '').trim() === s.id).length;
      const pct = totalInGroup > 0 ? Math.round((doneInGroup / totalInGroup) * 100) : 0;
      const progressBar = `<div class="version-progress-inline">
          <div class="version-progress-bar-wrap"><div class="version-progress-bar" style="--ver-bar-w:${pct}%"></div></div>
          <span class="version-progress-label">${doneInGroup}/${totalInGroup} · ${pct}%</span>
        </div>`;
      // T-202605-456: ★ eliminado del version-tag — estado activo lo comunica sprint-badge-active
      const sprintBadge = '';
      const sprintStatusLabel = isActive ? `<span class="sprint-badge-active" class="sprint-badge-ml">activo</span>` : '';
      // R-202605-007: sprintActions eliminado — header solo lectura
      const _sprintAllItems = ITEMS.filter(i => (i.sprint || '').trim() === s.id);
      const _sprintPills = _statusPills(_sprintAllItems);
      const _velLabel066a = isActive ? _sprintVelocityLabel(s.id) : '';
      html += `<div class="version-group${isActive ? ' sprint-group-active' : ''}">
        <div data-action="version-collapse" data-group-id="${groupId}" class="version-collapse-trigger">
          <div class="version-header">
            <span id="sprint-label-wrap-${esc(s.id)}"><span class="version-tag">${esc(s.id)}${sprintBadge}</span>${(s.label && s.label !== s.id) ? `<span class="sprint-name-label">${esc(s.label.replace(/^[A-Za-z]+[-\s]S\d+\s*·?\s*/i, ''))}</span>` : ''}</span>${sprintStatusLabel}
            ${progressBar}
            ${_velLabel066a}
            ${_sprintPills ? `<span class="sprint-pills-secondary">${_sprintPills}</span>` : ''}
            <span class="version-collapse-arrow" id="varrow-${groupId}">▸</span>
          </div>
        </div>
        <div class="version-group-body items-grid collapsed" id="vbody-${groupId}"></div>
      </div>`;
    });

    sprintKeys.forEach(key => {
      const group = sprintMap[key];
      if (!group || !group.length) return;
      const isSinAsignar = key === '__sin_asignar__';
      const sprintObj = isSinAsignar ? null : _getSprintById(key);
      const label = isSinAsignar ? 'Sin asignar' : (sprintObj ? sprintObj.label : key);
      const groupId = isSinAsignar ? 'sin-asignar' : key.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const isCollapsed = _getCollapsedVersions().has(groupId);
      const doneInGroup = ITEMS.filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key) && i.status === 'done').length;
      const totalInGroup = ITEMS.filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key)).length;
      const pct = totalInGroup > 0 ? Math.round((doneInGroup / totalInGroup) * 100) : 0;

      const isActive = sprintObj && sprintObj.status === 'active';
      const isClosed = sprintObj && sprintObj.status === 'closed';

      const progressBar = isSinAsignar ? '' : `<div class="version-progress-inline">
          <div class="version-progress-bar-wrap"><div class="version-progress-bar" style="--ver-bar-w:${pct}%"></div></div>
          <span class="version-progress-label">${doneInGroup}/${totalInGroup} · ${pct}%</span>
        </div>`;

      // T-202605-456: ★ eliminado del version-tag activo — estado lo comunica sprint-badge-active, formato unificado con cerrados
      const sprintBadge = isClosed ? ' ·' : '';
      const sprintStatusLabel = isActive
        ? `<span class="sprint-badge-active" class="sprint-badge-ml">activo</span>`
        : isClosed
          ? `<span class="sprint-badge-closed" class="sprint-badge-ml">cerrado</span>`
          : '';

      // R-202605-007: sprintActions eliminado — header solo lectura (AC-2)

      const _sprintAllItems = ITEMS.filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key));
      const _pendCount  = group.length;
      const _doneCount  = _sprintAllItems.filter(i => i.status === 'done').length;
      const _descCount  = _sprintAllItems.filter(i => i.status === 'descartado').length;
      const _pendPill   = _pendCount  ? `<span class="status-pill status-pill--pendiente">${_pendCount} pend.</span>` : '';
      const _donePill   = _doneCount  ? `<span class="status-pill status-pill--done">${_doneCount} done</span>` : '';
      const _descPill   = _descCount  ? `<span class="status-pill status-pill--descartado">${_descCount} desc.</span>` : '';
      const _velLabel066b = isActive ? _sprintVelocityLabel(key) : '';
      html += `<div class="version-group${isActive ? ' sprint-group-active' : ''}${isClosed ? ' sprint-group-closed' : ''}">
        <div data-action="version-collapse" data-group-id="${groupId}" class="version-collapse-trigger">
          <div class="version-header">
            ${!isSinAsignar ? `<span id="sprint-label-wrap-${esc(key)}"><span class="version-tag">${esc(key)}${sprintBadge}</span>${(label && label !== key) ? `<span class="sprint-name-label">${esc(label.replace(/^[A-Za-z]+[-\s]S\d+\s*[·]?\s*/i, ''))}</span>` : ''}</span>${sprintStatusLabel}` : ''}
            ${_pendPill}
            ${isSinAsignar ? `<span class="version-label">Sin asignar</span>` : ''}
            ${progressBar}
            ${_velLabel066b}
            ${(_donePill || _descPill) ? `<span class="sprint-pills-secondary">${_donePill}${_descPill}</span>` : ''}
            <span class="version-collapse-arrow" id="varrow-${groupId}">${isCollapsed ? '▸' : '▾'}</span>
          </div>
        </div>
        <div class="version-group-body items-grid${isCollapsed ? ' collapsed' : ''}" id="vbody-${groupId}">`;
      _sortGroup(group).forEach(item => { html += buildBacklogItem(item); }); // T-202604-424: sort interno priority desc → effort asc
      html += `</div></div>`;
    });

    // R-202605-103: bloque sprints cerrados eliminado — absorbido por renderArchivoHistorico

    // T-202605-104: sección Icebox — ítems sin sprint asignado (icebox / '' / null)
    if (iceboxItems.length) {
      // B-202605-030: default expandido — clave ausente (null) → expandido; '0' → colapsado
      const iceboxOpen = localStorage.getItem('backlog-icebox-open') !== '0';
      html += `<div class="section-group sg-icebox bl-icebox-group" id="sg-icebox">
        <div class="section-group-header bl-icebox-header" data-action="section-group-toggle" data-group="icebox">
          <span class="section-group-arrow bl-icebox-arrow" id="sgarrow-icebox">${iceboxOpen ? '▾' : '▸'}</span>
          <span>📥 Icebox</span>
          <span class="section-group-count bl-icebox-count">${iceboxItems.length} ítem${iceboxItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="section-group-body items-grid bl-icebox-body${iceboxOpen ? '' : ' collapsed'}" id="sgbody-icebox">`;
      _sortGroup(iceboxItems).forEach(item => { html += buildBacklogItem(item); });
      html += `</div></div>`;
    }

  } else {
    // ── Modo plano: lista sin grupos de sprint ──

    // R-202604-051: sección Bloqueantes activos — sobre En curso y Pendientes
    const blockingItems = pendienteItems.filter(i => i.blocking);
    if (blockingItems.length && _getActiveStatuses().has('pendiente')) {
      html += `<div class="section-group section-group--blocking" id="sg-blocking">
        <div class="section-group-header section-group-header--blocking">
          <span class="section-group-icon">⚠</span>
          <span>Bloqueantes activos</span>
          <span class="section-group-count">${blockingItems.length} ítem${blockingItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="items-grid" id="sgbody-blocking">`;
      _sortItems(blockingItems).forEach(item => { html += buildBacklogItem(item); });
      html += `</div></div>`;
    }

    const flatItems = _sortItems(pendienteItems);
    const _flatPills = _statusPills(pendienteItems);
    if (_flatPills) {
      html += `<div class="version-group-header">
        <span>${flatItems.length} ítem${flatItems.length !== 1 ? 's' : ''}</span>
        ${_flatPills}
      </div>`;
    }
    html += `<div class="items-grid" id="vbody-flat">`;
    flatItems.forEach(item => { html += buildBacklogItem(item); });
    html += `</div>`;
  }

  // T-202604-427: Ideas (P) — sección diferenciada, colapsada por defecto, antes de done
  if (ideaItems.length && _getActiveTypes().has('P')) {
    const ideasOpen = localStorage.getItem('backlog-ideas-open') === '1';
    html += `<div class="section-group sg-ideas" id="sg-ideas">
      <div class="section-group-header" data-action="section-group-toggle" data-group="ideas">
        <span class="section-group-arrow" id="sgarrow-ideas">${ideasOpen ? '▾' : '▸'}</span>
        <span>💡 Posibilidades</span>
        <span class="section-group-count">${ideaItems.length} ítem${ideaItems.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="section-group-body items-grid${ideasOpen ? '' : ' collapsed'}" id="sgbody-ideas">`;
    _sortItems(ideaItems).forEach(item => { html += buildBacklogItem(item); });
    html += `</div></div>`;
  }

  // Done al fondo — T-202604-356: colapsado por default (mismo comportamiento que descartados)
  if (doneItems.length) {
    const doneOpen = localStorage.getItem('backlog-done-open') === '1';
    html += `<div class="section-group" id="sg-done">
      <div class="section-group-header" data-action="section-group-toggle" data-group="done">
        <span class="section-group-arrow" id="sgarrow-done">${doneOpen ? '▾' : '▸'}</span>
        <span>Completados</span>
        <span class="section-group-count">${doneItems.length} ítem${doneItems.length !== 1 ? 's' : ''}</span>
        <span class="sprint-pills-wrap">${_statusPills(doneItems)}</span>
      </div>
      <div class="section-group-body items-grid${doneOpen ? '' : ' collapsed'}" id="sgbody-done">`;
    _sortItems(doneItems).forEach(item => { html += buildBacklogItem(item); });
    html += `</div></div>`;
  }

  // T-202604-059: Descartados — colapsados por defecto, visibles solo si filtro activo
  if (descartadoItems.length && _getActiveStatuses().has('descartado')) {
    const discOpen = localStorage.getItem('backlog-discarded-open') === '1';
    html += `<div class="section-group sg-discarded" id="sg-discarded">
      <div class="section-group-header" data-action="section-group-toggle" data-group="discarded">
        <span class="section-group-arrow" id="sgarrow-discarded">${discOpen ? '▾' : '▸'}</span>
        <span>Descartados</span>
        <span class="section-group-count">${descartadoItems.length} ítem${descartadoItems.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="section-group-body items-grid${discOpen ? '' : ' collapsed'}" id="sgbody-discarded">`;
    descartadoItems.forEach(item => { html += buildBacklogItem(item); });
    html += `</div></div>`;
  }

  // B-202604-NNN: evaluar empty state sobre pendientes+done+descartados — no solo filtered (pendientes)
  const _hasVisible = pendienteItems.length || ideaItems.length || doneItems.length || (descartadoItems.length && _getActiveStatuses().has('descartado'));
  if (!_hasVisible) {
    // T-202604-319: empty state contextual según causa
    const _activeSprint = _getActiveSprint();
    const _hasTypeFilter  = _getActiveTypes().size < 4;
    const _hasRoleFilter  = _getActiveRoleFilter() !== null;
    const _hasStatusFilter = !(_getActiveStatuses().has('pendiente') && _getActiveStatuses().size === 1);
    const _hasEffortFilter = _getActiveEfforts().size < 3;
    const _hasAnyFilter = q || _hasTypeFilter || _hasRoleFilter || _hasStatusFilter || _hasEffortFilter || _getBacklogFocusMode() || _getBacklogMikeMode();

    let emptyIcon = '🔍', emptyTitle = '', emptyHint = '', emptyCTA = '';

    if (q) {
      emptyTitle = `Sin resultados para "${esc(q)}"`;
      emptyHint  = 'Prueba con otro término o limpia la búsqueda.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-clear-search">✕ Limpiar búsqueda</button>`;
    } else if (_getBacklogMikeMode() && _activeSprint) {
      const _miRoles = _getMiViewRoles();
      const _miRole = _miRoles[_getMiViewRoleIndex() % _miRoles.length] || 'este rol';
      emptyIcon  = '⚡';
      emptyTitle = `Sin T's pendientes para ${_miRole} en ${_activeSprint.label || _activeSprint.id}`;
      emptyHint  = 'No hay tickets pendientes asignados a este rol en el sprint activo. Rota al siguiente rol o desactiva Mi vista.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-toggle-mike">↻ Rotar rol / desactivar</button>`;
    } else if (_getBacklogFocusMode()) {
      emptyIcon  = '🎯';
      emptyTitle = 'Sin ítems en Focus';
      emptyHint  = 'No hay ítems pendientes con los filtros actuales.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-toggle-focus">✕ Desactivar Focus</button>`;
    } else if (_getBacklogSortMode() === 'sprint' && _activeSprint) {
      emptyIcon  = '📅';
      emptyTitle = `Sin ítems en ${_activeSprint.label || _activeSprint.id}`;
      emptyHint  = 'El sprint activo no tiene ítems con los filtros actuales. Asigna ítems desde el editor o cambia el sprint.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-filter-all">Ver todos los ítems</button>`;
    } else if (_hasAnyFilter) {
      emptyTitle = 'Sin ítems con estos filtros';
      emptyHint  = 'Los filtros activos no coinciden con ningún ítem. Limpia los filtros para ver el backlog completo.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-clear-filters">✕ Limpiar filtros</button>`;
    } else {
      emptyIcon  = '📋';
      emptyTitle = 'Sin ítems que mostrar';
      emptyHint  = 'No hay ítems en el backlog con el estado actual.';
    }

    html = `<div class="empty-state">
      <div class="empty-state-icon">${emptyIcon}</div>
      <div class="empty-state-title">${emptyTitle}</div>
      <div class="empty-state-hint">${emptyHint}</div>
      ${emptyCTA}
    </div>`;
  }

  // T-202604-319: footer total real siempre visible (independiente del filtro)
  updateBacklogFooter();

  listEl.classList.remove('kb-active');
  listEl.innerHTML = html;
  _skelHide(listEl);

  // R-202605-103: archivo histórico unificado — reemplaza _renderHistoricoSection + closed-sprints-block
  renderArchivoHistorico(listEl);

  const countEl = document.getElementById('search-count');
  if (countEl) {
    if (q) {
      const total = pendienteItems.length + doneItems.length + descartadoItems.length;
      countEl.textContent = `${total} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    } else {
      countEl.textContent = '';
    }
  }

  _attachBacklogDnD();
  _attachBacklogListDelegation();
  _attachPlanViewDelegation();
  if (typeof _updateDocLogCount === 'function') _updateDocLogCount('backlog');

  // T-202604-362: placeholder del buscador refleja scope activo
  (function _updateSearchPlaceholder() {
    const inp = document.getElementById('backlog-search-input');
    if (!inp) return;
    const parts = [];
    const activeSprint = _getActiveSprint();
    const sprintFiltered = _getBacklogSortMode() === 'sprint' && activeSprint && !_getActiveStatuses().has('done') && !_getActiveStatuses().has('descartado');
    if (sprintFiltered) parts.push(activeSprint.label || activeSprint.id);
    if (_getActiveTypes().size < 4) parts.push([..._getActiveTypes()].join('/'));
    if (_getActivePriorityFilter().size > 0) parts.push('pri:' + [..._getActivePriorityFilter()].join('/'));
    const scopeCount = (pendienteItems.length + doneItems.length + (descartadoItems.length && _getActiveStatuses().has('descartado') ? descartadoItems.length : 0));
    if (parts.length) {
      inp.placeholder = '🔍 Buscando en ' + parts.join(' · ') + ' · ' + scopeCount + ' ítem' + (scopeCount !== 1 ? 's' : '');
    } else {
      inp.placeholder = '🔍 Buscar…';
    }
  })();

  if (typeof onRendered === 'function') onRendered();
}

