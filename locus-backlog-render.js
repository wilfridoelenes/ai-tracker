// [PP] v1.2.4 · sprint:PP-S-06 · mod:45 · autor:Rune · 2026-06-08 UTC-6
// T-202606-166: _getActiveProjectFilter importada desde locus-storage.js
// T-202606-167: openProjPanel desacoplada — dispatch shell:open-proj-panel en lugar de import directo
// T-202606-163: _iceboxStaleness — alertas diferenciadas por tipo en vista icebox
import { renderArchivoHistorico, toggleArchivoHistorico } from './locus-backlog-archive.js';
import { _hasDepsBlocked, _isBlocked, _isCountableItem, _skelHide, _skelShow, _undoSnapshot, itemType, renderStats, updateStatusFilterUI, _getBacklogKanbanMode, _getBacklogNoAcMode, _getActiveTypes, _getActiveStatuses, _getActiveEfforts, _getActivePriorityFilter, _getBacklogBlockerFilter, _getDepsFilter, _getBacklogSortMode, _getBacklogSortDir, _getBacklogSearchQuery, _getCollapsedVersions, toggleTypeFilter, toggleStatusFilter, toggleVersionCollapse, toggleSectionGroup, toggleEffortFilter, toggleBacklogNoAcMode, _vcCollapseGet, _vcCollapseSet, getDoneItems, getItems } from './locus-backlog-core.js';

import { _attachBacklogDnD, _attachBacklogListDelegation, _collapsedChildren, _renderKanban, buildBacklogItem, updateBacklogFooter } from './locus-backlog-item.js';

import { _getActiveSprint, _getSprintById, openSprintRetroView, setItemSprint } from './locus-backlog-sprints.js';

import { _setBacklogModified } from './locus-docs.js';

import { _getActiveProjectFilter, getActiveSprints } from './locus-storage.js';

import { showToast } from './locus-toast.js';

import { esc } from './locus-ui-shell.js';
import { _renderPlanningView, _attachPlanViewDelegation, _statusPills, toggleClosedSprintsBody } from './locus-sprint-planificacion.js';
import { _updateDocLogCount } from './locus-doc-log.js';

// [PP] v1.2.4 · sprint:PP-S-01 · mod:41 · autor:Rune · 2026-06-07 UTC-6
// Responsabilidad: Renderizado del backlog — vista Lista (sprint groups + jerarquía R→T/B),
//   sprint health panel, roadmap, planning (drag & drop), renderBacklogList, sprint selector inline.
// Dependencias: locus-backlog-core.js · locus-backlog-archive.js · locus-backlog-item.js · locus-backlog-sprints.js

// T-202606-022: _buildChildMap — agrupación de hijos por R con sort topológico por depends_on
// Recibe los ítems de un sprint y retorna Map: rCode → [hijos ordenados]
export function _buildChildMap(sprintItems) {
  // Conjunto de códigos R presentes en sprintItems — gate de parentId válido
  const rCodesInSprint = new Set(
    sprintItems.filter(i => itemType(i.code) === 'R').map(i => i.code)
  );

  // Recopilar hijos: Ts y Bs con parentId apuntando a un R del sprint, excluyendo históricos
  const childrenByR = new Map();
  for (const r of rCodesInSprint) childrenByR.set(r, []);

  for (const item of sprintItems) {
    const t = itemType(item.code);
    if (t !== 'T' && t !== 'B') continue;
    if (item.status === 'historico') continue;
    if (!item.parentId || !rCodesInSprint.has(item.parentId)) continue;
    childrenByR.get(item.parentId).push(item);
  }

  // Ordenar hijos de cada R por depends_on — sort topológico con detección de ciclos
  for (const [rCode, children] of childrenByR) {
    childrenByR.set(rCode, _topoSort(children));
  }

  return childrenByR;
}

// Sort topológico de un array de ítems por depends_on.
// Ítems sin dependencias van primero, resolviendo la cadena completa.
// Ciclos detectados: los ítems en ciclo van al final, ordenados por código.
function _topoSort(items) {
  if (items.length <= 1) return items;

  const codeSet = new Set(items.map(i => i.code));
  const byCode = Object.fromEntries(items.map(i => [i.code, i]));

  // Construir grafo de dependencias — solo entre ítems del mismo grupo
  const deps = {}; // code → Set de dependencias internas
  for (const item of items) {
    const internal = (Array.isArray(item.depends_on) ? item.depends_on : [])
      .filter(d => codeSet.has(d));
    deps[item.code] = new Set(internal);
  }

  // Kahn's algorithm para sort topológico
  const inDegree = {};
  const adjList = {}; // code → [codes que dependen de él]
  for (const item of items) {
    inDegree[item.code] = 0;
    adjList[item.code] = [];
  }
  for (const item of items) {
    for (const dep of deps[item.code]) {
      adjList[dep].push(item.code);
      inDegree[item.code]++;
    }
  }

  // Cola: ítems sin dependencias internas, ordenados por código para determinismo
  const queue = items
    .filter(i => inDegree[i.code] === 0)
    .map(i => i.code)
    .sort();

  const sorted = [];
  while (queue.length) {
    const code = queue.shift();
    sorted.push(byCode[code]);
    for (const dependent of (adjList[code] || [])) {
      inDegree[dependent]--;
      if (inDegree[dependent] === 0) {
        // Insertar manteniendo orden alfabético en la cola
        const insertIdx = queue.findIndex(c => c > dependent);
        if (insertIdx === -1) queue.push(dependent);
        else queue.splice(insertIdx, 0, dependent);
      }
    }
  }

  // Ítems restantes forman ciclos — van al final ordenados por código
  if (sorted.length < items.length) {
    const sortedCodes = new Set(sorted.map(i => i.code));
    const cycleItems = items
      .filter(i => !sortedCodes.has(i.code))
      .sort((a, b) => a.code.localeCompare(b.code));
    sorted.push(...cycleItems);
  }

  return sorted;
}

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
  const item = getItems().find(i => i.code === code);
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
  const _as = _getActiveStatuses();
  const defaultStatus = _as.size === 2 && _as.has('pendiente') && _as.has('en-revision'); // B-202606-008: size===2 + has ambos es suficiente — no puede haber otros si size es exactamente 2
  const noSearch = !_getBacklogSearchQuery();
  const noPriorityFilter = _getActivePriorityFilter().size === 0; // T-202604-357
  const allEfforts = _getActiveEfforts().size === 3; // B-202606-006
  const isDefault = allTypes && defaultStatus && noSearch && noPriorityFilter && allEfforts && !_getBacklogNoAcMode(); // T-202606-098: noRoleFilter eliminado
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
      if (act === 'type')          { toggleTypeFilter(val); }
      else if (act === 'status')   { toggleStatusFilter(val); }
      else if (act === 'priority') { if (typeof togglePriorityFilter === 'function') togglePriorityFilter(val); }
      else if (act === 'effort')   { toggleEffortFilter(parseInt(val, 10)); }
      else if (act === 'search')   { if (typeof clearBacklogSearch   === 'function') clearBacklogSearch(); }
      else if (act === 'noac')     { toggleBacklogNoAcMode(); }
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
    const neutralStatuses = new Set(['pendiente', 'en-revision']);
    [..._getActiveStatuses()].filter(s => !neutralStatuses.has(s)).forEach(s => {
      chips.push(_chip(`+${s}`, 'status', s));
    });
    if (!_getActiveStatuses().has('pendiente')) {
      chips.push(_chip('−Pendiente', 'status', 'pendiente'));
    }
    if (!_getActiveStatuses().has('en-revision')) {
      chips.push(_chip('−En revisión', 'status', 'en-revision'));
    }
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
    const spItems = getItems().filter(i => i.sprint === sp.id && i.status !== 'descartado');
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
  const spItems = getItems().filter(i => (i.sprint || '').trim() === sprintId && i.status === 'pendiente');
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

// T-202606-014: renderizado de vista C colapsable
// Rs como headers colapsables con Ts anidados. Filtros de status, tipo, effort y búsqueda
// ya aplicados sobre pendienteItems antes de llegar aquí.
// Fix: childMap construido desde getItems() completo — todos los Ts hijos se muestran
// bajo su R independientemente de su status.
function _renderVistaC(listEl, pendienteItems, doneItems, descartadoItems) {
  const projectId = _getActiveProjectFilter() || 'default';

  // Helpers de status inline — statusClass/statusLabel no están exportadas desde item.js
  const _statusLabel = s => ({ pendiente: 'Pendiente', 'en-revision': 'En revisión', done: 'Done', descartado: 'Descartado' }[s] || s || '—');
  const _statusClass = s => 'badge-status-' + (s || 'pendiente');

  // Separar tipos desde pendienteItems (Rs y sueltos filtrados)
  const rItems   = pendienteItems.filter(i => itemType(i.code) === 'R');
  const tItems   = pendienteItems.filter(i => itemType(i.code) === 'T');
  const bItems   = pendienteItems.filter(i => itemType(i.code) === 'B');
  const pItems   = pendienteItems.filter(i => itemType(i.code) === 'P');

  // Rs visibles — para saber qué parents mostrar
  const rCodes   = new Set(rItems.map(r => r.code));

  // childMap desde getItems() completo — incluye Ts con cualquier status (done, descartado, etc.)
  // Solo excluye históricos y Ts cuyo R padre no es visible en la vista actual
  const childMap = {};
  getItems().forEach(t => {
    if (itemType(t.code) !== 'T') return;
    if (t.status === 'historico') return;
    if (!t.parentId || !rCodes.has(t.parentId)) return;
    if (!childMap[t.parentId]) childMap[t.parentId] = [];
    childMap[t.parentId].push(t);
  });

  // Ts pendientes sin parent visible — huérfanos (solo los filtrados)
  const tOrphans = tItems.filter(t => !t.parentId || !rCodes.has(t.parentId));

  // _hasDepsBlocked ya vive en core e itera sobre getItems() global

  let html = '<div class="bl-vc">';

  // ── Rs con Ts anidados ──────────────────────────────────────────────────
  rItems.forEach(r => {
    const children = childMap[r.code] || [];
    // AC2: R con children.length === 0 no renderiza — ni header ni body.
    // children ya está filtrado por activeStatuses vía pendienteItems,
    // por lo que length === 0 significa que todos los Ts del R fueron excluidos por filtro.
    if (children.length === 0) return;

    const isCollapsed = _vcCollapseGet(projectId, r.code);
    const collapseClass = isCollapsed ? ' bl-vc-r--collapsed' : '';
    const arrowSvg = `<svg class="bl-vc-r-arrow" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    html += `<div class="bl-vc-r${collapseClass}" data-r-code="${esc(r.code)}">`;
    html += `<div class="bl-vc-r-header" data-action="vc-toggle-r" data-r-code="${esc(r.code)}" tabindex="0" role="button" aria-expanded="${isCollapsed ? 'false' : 'true'}">`;
    html += arrowSvg;
    html += `<span class="bl-vc-r-code">${esc(r.code)}</span>`;
    html += `<span class="bl-vc-r-title">${esc(r.title || '')}</span>`;
    html += `<span class="bl-vc-r-meta"><span class="bl-vc-r-count">${children.length} T${children.length !== 1 ? 's' : ''}</span></span>`;
    html += `</div>`; // header

    html += `<div class="bl-vc-r-body">`;
    children.forEach(t => {
      const depsCount  = Array.isArray(t.depends_on) ? t.depends_on.length : 0;
      const isBlocked  = _hasDepsBlocked(t);
      const discClass  = t.status === 'descartado' ? ' bl-vc-t--descartado' : '';

      html += `<div class="bl-vc-t${discClass}" data-t-code="${esc(t.code)}">`;
      html += `<span class="bl-vc-t-code">${esc(t.code)}</span>`;
      html += `<span class="bl-vc-t-title">${esc(t.title || '')}</span>`;
      html += `<span class="bl-vc-t-indicators">`;
      // badge de status del T
      html += `<span class="badge ${_statusClass(t.status)} badge--sm">${_statusLabel(t.status)}</span>`;
      // badge depends_on — solo si hay dependencias
      if (depsCount > 0) {
        html += `<span class="bl-vc-badge bl-vc-badge--deps">${depsCount}</span>`;
      }
      // indicador de bloqueo — solo cuando activo (dos estados: presente o ausente)
      if (isBlocked) {
        html += `<span class="bl-vc-blocked"><span class="bl-vc-blocked-dot"></span>bloqueado</span>`;
      }
      html += `</span>`; // indicators
      html += `</div>`; // bl-vc-t
    });
    html += `</div>`; // bl-vc-r-body
    html += `</div>`; // bl-vc-r
  });

  // ── Bs y Ps sueltos (no anidados bajo R) ────────────────────────────────
  const sueltos = [...bItems, ...pItems];
  if (sueltos.length) {
    sueltos.forEach(item => { html += buildBacklogItem(item); });
  }

  // ── Grupo 'Sin R padre' (Ts huérfanos) ──────────────────────────────────
  const orphansHidden = tOrphans.length === 0 ? ' is-hidden' : '';
  html += `<div class="bl-vc-orphans${orphansHidden}">`;
  html += `<div class="bl-vc-orphans-header"><span class="bl-vc-orphans-header-title">Sin R padre</span></div>`;
  html += `<div class="bl-vc-orphans-body">`;
  tOrphans.forEach(t => {
    const depsCount = Array.isArray(t.depends_on) ? t.depends_on.length : 0;
    const isBlocked = _hasDepsBlocked(t);
    const discClass = t.status === 'descartado' ? ' bl-vc-t--descartado' : '';
    html += `<div class="bl-vc-t${discClass}" data-t-code="${esc(t.code)}">`;
    html += `<span class="bl-vc-t-code">${esc(t.code)}</span>`;
    html += `<span class="bl-vc-t-title">${esc(t.title || '')}</span>`;
    html += `<span class="bl-vc-t-indicators">`;
    if (depsCount > 0) html += `<span class="bl-vc-badge bl-vc-badge--deps">${depsCount}</span>`;
    if (isBlocked)     html += `<span class="bl-vc-blocked"><span class="bl-vc-blocked-dot"></span>bloqueado</span>`;
    html += `</span></div>`;
  });
  html += `</div></div>`; // orphans-body + orphans

  html += `</div>`; // bl-vc

  listEl.innerHTML = html;
  _skelHide(listEl);

  // Delegación de eventos para toggle de colapso de R
  listEl.addEventListener('click', _vcHandleToggle, { once: true });
  listEl.addEventListener('keydown', function _vcKeyToggle(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const btn = e.target.closest('[data-action="vc-toggle-r"]');
      if (btn) { e.preventDefault(); _vcDoToggle(btn, projectId); }
    }
  }, { once: true });

  function _vcHandleToggle(e) {
    const btn = e.target.closest('[data-action="vc-toggle-r"]');
    if (btn) _vcDoToggle(btn, projectId);
  }
}

function _vcDoToggle(btn, projectId) {
  const rCode = btn.dataset.rCode;
  if (!rCode) return;
  const rEl = btn.closest('.bl-vc-r');
  if (!rEl) return;
  const isNowCollapsed = !rEl.classList.contains('bl-vc-r--collapsed');
  rEl.classList.toggle('bl-vc-r--collapsed', isNowCollapsed);
  btn.setAttribute('aria-expanded', isNowCollapsed ? 'false' : 'true');
  _vcCollapseSet(projectId, rCode, isNowCollapsed);
}

// T-202606-163: _iceboxStaleness — umbral de alerta por tipo de ítem en vista icebox
// Umbrales: R y T → 14d · P → 30d · B priority:high → 7d · B priority no-high → sin alerta
// Referencia: statusChangedAt || createdAt. Retorna { days, label } o null si no aplica.
function _iceboxStaleness(item) {
  if (!item) return null;
  const type = itemType(item.code);
  const priority = (item.priority || '').toLowerCase();
  let threshold;
  if (type === 'R' || type === 'T') threshold = 14;
  else if (type === 'P') threshold = 30;
  else if (type === 'B' && priority === 'high') threshold = 7;
  else return null;
  const refTs = item.statusChangedAt || item.createdAt;
  if (!refTs) return null;
  const days = Math.floor((Date.now() - refTs) / 86400000);
  if (days < threshold) return null;
  const label = days === 1 ? '1d' : days + 'd';
  return { days, label };
}

// R-202606-017 · T-202606-061: Vista Lista — sprint groups + jerarquía R→T/B por defecto
// Reemplaza la lógica combinada de _renderVistaC + bloque _useSprintGroups.
// Parámetros: listEl, pendienteItems, doneItems, descartadoItems ya filtrados por renderBacklogList;
//   _matchesQuery y _sortGroup vienen de renderBacklogList para reutilizar la lógica existente.
function _renderVistaLista(listEl, pendienteItems, doneItems, descartadoItems, _matchesQuery, _sortGroup, q, onRendered) {
  const _isIcebox = i => !i.sprint || i.sprint === 'icebox' || i.sprint === '';

  // AC6: ítems sin sprint → bloque Icebox al final
  const iceboxItems = pendienteItems.filter(_isIcebox);
  const sprintableItems = pendienteItems.filter(i => !_isIcebox(i));

  // Agrupar por sprint
  const sprintMap = {};
  sprintableItems.forEach(i => {
    const key = (i.sprint || '').trim();
    if (!sprintMap[key]) sprintMap[key] = [];
    sprintMap[key].push(i);
  });

  // AC2: orden descendente de sprint ID — más reciente primero
  // Sprints sin objeto en getActiveSprints() (solo ítems con sprint string) también se ordenan por número
  const sprintKeys = Object.keys(sprintMap).sort((a, b) => {
    const sa = _getSprintById(a), sb = _getSprintById(b);
    // Activo siempre primero, luego descendente por número de sprint
    const rankA = sa?.status === 'active' ? 0 : 1;
    const rankB = sb?.status === 'active' ? 0 : 1;
    if (rankA !== rankB) return rankA - rankB;
    const na = parseInt(a.replace(/\D/g, '')) || 0;
    const nb = parseInt(b.replace(/\D/g, '')) || 0;
    return nb - na; // descendente
  });

  let html = '';

  // ── Sprint groups ─────────────────────────────────────────────────────────
  sprintKeys.forEach(sprintId => {
    const group = sprintMap[sprintId];
    if (!group || !group.length) return;

    const sprintObj = _getSprintById(sprintId);
    const isActive  = sprintObj?.status === 'active';
    const isClosed  = sprintObj?.status === 'closed';
    const label     = sprintObj ? (sprintObj.label || sprintId) : sprintId;
    const groupId   = 'vl-' + sprintId.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Colapso de sprint group — usa misma clave que version-group existente para compatibilidad
    const isCollapsed = _getCollapsedVersions().has(groupId);

    // Progress
    const doneInGroup  = getItems().filter(i => (i.sprint || '').trim() === sprintId && i.status === 'done').length;
    const totalInGroup = getItems().filter(i => (i.sprint || '').trim() === sprintId).length;
    const pct = totalInGroup > 0 ? Math.round((doneInGroup / totalInGroup) * 100) : 0;

    const sprintBadge       = isClosed ? ' ·' : '';
    const sprintStatusLabel = isActive
      ? `<span class="sprint-badge-active">activo</span>`
      : isClosed
        ? `<span class="sprint-badge-closed">cerrado</span>`
        : '';

    const progressBar = `<div class="version-progress-inline">
      <div class="version-progress-bar-wrap"><div class="version-progress-bar" style="--ver-bar-w:${pct}%"></div></div>
      <span class="version-progress-label">${doneInGroup}/${totalInGroup} · ${pct}%</span>
    </div>`;

    const _velLabel = isActive ? _sprintVelocityLabel(sprintId) : '';

    // Done items dentro del sprint si el filtro lo permite
    // B-202606-048: excluir Ts/Bs done que tienen parentId apuntando a un R visible en el grupo
    // — ya se renderizan anidados bajo su R padre en el bloque de children (L532-534).
    // Sin esta exclusión, esos ítems aparecen duplicados: una vez como child y otra vez sueltos aquí.
    const _rCodesInGroupForDone = new Set(
      (sprintMap[sprintId] || []).filter(i => itemType(i.code) === 'R').map(i => i.code)
    );
    const _doneInGroup = _getActiveStatuses().has('done')
      ? getItems().filter(i => {
          if ((i.sprint || '').trim() !== sprintId) return false;
          if (i.status !== 'done') return false;
          if (!_isCountableItem(i)) return false;
          if (!_matchesQuery(i)) return false;
          // Excluir children ya renderizados bajo su R padre
          const t = itemType(i.code);
          if ((t === 'T' || t === 'B') && i.parentId && _rCodesInGroupForDone.has(i.parentId)) return false;
          return true;
        })
      : [];
    const _doneGroupHtml = _doneInGroup.length
      ? _sortGroup(_doneInGroup).map(item => buildBacklogItem(item)).join('')
      : '';

    html += `<div class="bl-vl-sprint-group${isActive ? ' sprint-group-active' : ''}${isClosed ? ' sprint-group-closed' : ''}" data-sprint-id="${esc(sprintId)}">`;
    html += `<div class="bl-vl-sprint-header version-collapse-trigger" data-action="version-collapse" data-group-id="${groupId}">`;
    html += `<div class="version-header">`;
    html += `<span id="sprint-label-wrap-${esc(sprintId)}"><span class="version-tag">${esc(sprintId)}${sprintBadge}</span>${(label && label !== sprintId) ? `<span class="sprint-name-label">${esc(label.replace(/^[A-Za-z]+[-\s]S\d+\s*·?\s*/i, ''))}</span>` : ''}</span>`;
    html += sprintStatusLabel;
    html += progressBar;
    html += _velLabel;
    html += `<span class="version-collapse-arrow" id="varrow-${groupId}">${isCollapsed ? '▸' : '▾'}</span>`;
    html += `</div></div>`; // version-header + bl-vl-sprint-header

    html += `<div class="bl-vl-sprint-body${isCollapsed ? ' collapsed' : ''}" id="vbody-${groupId}">`;

    // AC3: Rs con hijos anidados + Ts/Bs sueltos + Ps sueltas
    {
      // childMap desde getItems() completo — todos los Ts hijos con cualquier status
      const _allSprintItems = getItems().filter(i => (i.sprint || '').trim() === sprintId);
      const _childMap = _buildChildMap(_allSprintItems);

      const _rCodesInGroup = new Set(group.filter(i => itemType(i.code) === 'R').map(i => i.code));

      // Nivel raíz: Rs del grupo + huérfanos (T/B/P sin parentId en el grupo)
      const _rootItems = _sortGroup(group).filter(i => {
        if (itemType(i.code) === 'R') return true;
        return !i.parentId || !_rCodesInGroup.has(i.parentId);
      });

      _rootItems.forEach(item => {
        const t = itemType(item.code);

        // AC4: Ps siempre sueltas con buildBacklogItem — nunca anidadas
        if (t !== 'R') {
          html += buildBacklogItem(item);
          return;
        }

        // R — jerarquía con hijos
        const _children = _childMap.get(item.code) || [];

        if (_children.length > 0) {
          // AC5: colapso de R en localStorage bajo clave 'locus-r-collapsed-[rCode]'
          const _collapseKey = 'locus-r-collapsed-' + item.code;
          const _isRCollapsed = localStorage.getItem(_collapseKey) === '1';

          html += `<div class="bl-vl-r" data-r-code="${esc(item.code)}">`;
          html += buildBacklogItem(item);
          // AC9: data-action='vl-toggle-r' — sin conflicto con bl-r-toggle deprecado
          html += `<button class="bl-r-toggle${_isRCollapsed ? ' collapsed' : ''}" data-action="vl-toggle-r" data-r-code="${esc(item.code)}" aria-label="Colapsar/expandir hijos" title="Colapsar/expandir hijos" type="button"></button>`;
          html += `<div class="bl-vl-r-body${_isRCollapsed ? ' collapsed' : ''}" id="bl-vl-rbody-${esc(item.code)}">`;
          _children.forEach(child => {
            html += `<div class="bl-child-row">${buildBacklogItem(child)}</div>`;
          });
          html += `</div>`; // bl-vl-r-body
          html += `</div>`; // bl-vl-r
        } else {
          // R sin hijos — render normal
          html += buildBacklogItem(item);
        }
      });
    }

    html += _doneGroupHtml;
    html += `</div>`; // bl-vl-sprint-body
    html += `</div>`; // bl-vl-sprint-group
  });

  // AC7: Icebox al final si hay ítems sin sprint
  if (iceboxItems.length) {
    const iceboxOpen = localStorage.getItem('backlog-icebox-open') !== '0';
    // T-202606-163: contar ítems con alerta para el header
    const _iceboxAlertCount = iceboxItems.filter(i => _iceboxStaleness(i) !== null).length;
    const _iceboxAlertBadge = _iceboxAlertCount > 0
      ? `<span class="staleness-pill staleness--stale bl-icebox-alert-count" title="${_iceboxAlertCount} ítem${_iceboxAlertCount !== 1 ? 's' : ''} sin movimiento — revisar">⚠ ${_iceboxAlertCount}</span>`
      : '';
    html += `<div class="section-group sg-icebox bl-icebox-group" id="sg-icebox">
      <div class="section-group-header bl-icebox-header" data-action="section-group-toggle" data-group="icebox">
        <span class="section-group-arrow bl-icebox-arrow${iceboxOpen ? '' : ' collapsed'}" id="sgarrow-icebox">▾</span>
        <span>📥 Icebox</span>
        <span class="section-group-count bl-icebox-count">${iceboxItems.length} ítem${iceboxItems.length !== 1 ? 's' : ''}</span>
        ${_iceboxAlertBadge}
      </div>
      <div class="section-group-body items-grid bl-icebox-body${iceboxOpen ? '' : ' collapsed'}" id="sgbody-icebox">`;
    _sortGroup(iceboxItems).forEach(item => {
      // T-202606-163: badge de alerta inline por ítem
      const _stale = _iceboxStaleness(item);
      const _alertHtml = _stale
        ? `<div class="bl-icebox-item-alert"><span class="staleness-pill staleness--stale" title="Sin movimiento — ${_stale.days}d en icebox">${_stale.label} en icebox</span></div>`
        : '';
      html += _alertHtml + buildBacklogItem(item);
    });
    html += `</div></div>`;
  }

  // Descartados — igual que en el modo previo
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

  // Empty state
  const _hasVisible = pendienteItems.length || doneItems.length || (descartadoItems.length && _getActiveStatuses().has('descartado'));
  if (!_hasVisible) {
    const _activeSprint = _getActiveSprint();
    const _hasTypeFilter   = _getActiveTypes().size < 4;
    const _hasStatusFilter = !(_getActiveStatuses().has('pendiente') && _getActiveStatuses().size === 1);
    const _hasEffortFilter = _getActiveEfforts().size < 3;
    const _hasAnyFilter    = q || _hasTypeFilter || _hasStatusFilter || _hasEffortFilter; // T-202606-098: _hasRoleFilter eliminado
    let emptyIcon = '🔍', emptyTitle = '', emptyHint = '', emptyCTA = '';
    if (q) {
      emptyTitle = `Sin resultados para "${esc(q)}"`;
      emptyHint  = 'Prueba con otro término o limpia la búsqueda.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-clear-search">✕ Limpiar búsqueda</button>`;
    } else if (_hasAnyFilter) {
      emptyTitle = 'Sin resultados con los filtros activos';
      emptyHint  = 'Prueba ajustando o limpiando los filtros.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-clear-filters">✕ Limpiar filtros</button>`;
    } else {
      emptyIcon  = '📋';
      emptyTitle = 'Sin ítems pendientes';
      emptyHint  = 'Todos los ítems están completados o no hay trabajo asignado a este sprint.';
    }
    html = `<div class="empty-state">
      <div class="empty-state-icon">${emptyIcon}</div>
      <div class="empty-state-title">${emptyTitle}</div>
      <div class="empty-state-hint">${emptyHint}</div>
      ${emptyCTA}
    </div>`;
  }

  updateBacklogFooter();

  listEl.classList.remove('kb-active');
  listEl.innerHTML = html;
  _skelHide(listEl);

  renderArchivoHistorico(listEl);

  // search-count
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
  _updateDocLogCount('backlog');

  // AC9: delegación vl-toggle-r — toggle de colapso de hijos de R en Vista Lista
  // AC5: persiste en localStorage bajo clave 'locus-r-collapsed-[rCode]'
  listEl.addEventListener('click', function _vlToggleHandler(e) {
    const btn = e.target.closest('[data-action="vl-toggle-r"]');
    if (!btn) return;
    const rCode = btn.dataset.rCode;
    if (!rCode) return;
    const body = document.getElementById('bl-vl-rbody-' + CSS.escape(rCode));
    if (!body) return;
    const isNowCollapsed = !body.classList.contains('collapsed');
    body.classList.toggle('collapsed', isNowCollapsed);
    btn.classList.toggle('collapsed', isNowCollapsed);
    const _collapseKey = 'locus-r-collapsed-' + rCode;
    if (isNowCollapsed) {
      localStorage.setItem(_collapseKey, '1');
    } else {
      localStorage.removeItem(_collapseKey);
    }
  });

  // search placeholder
  (function _updateSearchPlaceholder() {
    const inp = document.getElementById('backlog-search-input');
    if (!inp) return;
    const parts = [];
    const activeSprint = _getActiveSprint();
    if (activeSprint) parts.push(activeSprint.label || activeSprint.id);
    if (_getActiveTypes().size < 4) parts.push([..._getActiveTypes()].join('/'));
    if (_getActivePriorityFilter().size > 0) parts.push('pri:' + [..._getActivePriorityFilter()].join('/'));
    const scopeCount = pendienteItems.length + doneItems.length + (descartadoItems.length && _getActiveStatuses().has('descartado') ? descartadoItems.length : 0);
    if (parts.length) {
      inp.placeholder = '🔍 Buscando en ' + parts.join(' · ') + ' · ' + scopeCount + ' ítem' + (scopeCount !== 1 ? 's' : '');
    } else {
      inp.placeholder = '🔍 Buscar…';
    }
  })();

  if (typeof onRendered === 'function') onRendered();
}

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
    const kanbanBtn = document.getElementById('fbar-kanban-btn');

    if (kanbanBtn) {
      kanbanBtn.classList.toggle('active', _getBacklogKanbanMode());
      kanbanBtn.title = _getBacklogKanbanMode() ? 'Vista Kanban activa — click para desactivar' : 'Vista Kanban — columnas por status';
    }
    // Sin AC y bloqueados
    const noAcBtn = document.getElementById('fbar-no-ac-btn');
    if (noAcBtn) noAcBtn.classList.toggle('active', _getBacklogNoAcMode());
    const blockerBtn = document.getElementById('fbar-blocker-btn');
    if (blockerBtn) blockerBtn.classList.toggle('active', _getBacklogBlockerFilter());
    // T-202606-062: bloque fbar-sprint-btn eliminado — _backlogSprintGroupMode ya no existe
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

  if (!getItems().length) {
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

  // Filtrado por tipo + status + effort (T-071)
  // B-202604-193: excluir ítems históricos del plano activo — van a sección colapsada al fondo
  let filtered = getItems().filter(i => {
    if (i.status === 'historico') return false;
    const type = itemType(i.code);
    const typeOk = type ? _getActiveTypes().has(type) : true;
    const statusOk = _getActiveStatuses().has(i.status);
    const _rawEffort = parseInt(i.effort) || 1;
    const _normEffort = _rawEffort > 3 ? 3 : _rawEffort < 1 ? 1 : _rawEffort;
    const effortOk = _getActiveEfforts().has(_normEffort); // T-071 · B-202605-233: effort >3 normalizado a 3
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
    return typeOk && statusOk && effortOk && priorityOk; // T-202606-098: roleOk eliminado
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
  // T-202605-135: Ps integradas en pendienteItems — sin sección separada
  const pendienteItems = filtered.filter(i => i.status !== 'done' && i.status !== 'descartado');
  const _matchesQuery = q
    ? (i => i.code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || (i.area || '').toLowerCase().includes(q))
    : () => true;
  const doneItems      = _getActiveStatuses().has('done')
    ? getDoneItems(_matchesQuery)  // T-202606-028: reutiliza getDoneItems global — evita getItems().filter() duplicado
    : [];
  const descartadoItems = _getActiveStatuses().has('descartado')
    ? getItems().filter(i => i.status === 'descartado' && _matchesQuery(i))
    : [];

  let html = '';

  // R-202606-017: vista Lista — vista por defecto del backlog (reemplaza _useVistaC + _useSprintGroups)
  // Se activa siempre que no haya un modo exclusivo activo (kanban, noAc)
  const _useVistaLista = !_getBacklogKanbanMode() && !_getBacklogNoAcMode();

  if (_useVistaLista) {
    _renderVistaLista(listEl, pendienteItems, doneItems, descartadoItems, _matchesQuery, _sortGroup, q, onRendered);
    return;
  }

  // Modo exclusivo restante: noAc (kanban ya desvía antes de llegar aquí)
  const _useSprintGroups = false; // R-202606-017: nunca se activa — _useVistaLista cubre todos los casos normales

  // R-202606-017: el bloque _useSprintGroups fue eliminado — _renderVistaLista cubre sprint groups + jerarquía.
  // El código siguiente solo alcanza cuando _getBacklogNoAcMode() está activo (modo exclusivo).

  if (false) {
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
      const hasAnyItem = getItems().some(i => (i.sprint || '').trim() === s.id); // hasAnyItem: verifica cualquier ítem en el sprint, no solo done
      if (!hasAnyItem) return; // sprint vacío — ignorar
      const isClosed = s.status === 'closed'; // B-fix: no hardcodear false — usar status real del sprint
      if (isClosed) return; // sprint cerrado — no renderizar en este bloque, aparece en cerrados
      const isActive = s.status === 'active';
      const groupId = s.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const doneInGroup = getItems().filter(i => (i.sprint || '').trim() === s.id && i.status === 'done').length;
      const totalInGroup = getItems().filter(i => (i.sprint || '').trim() === s.id).length;
      const pct = totalInGroup > 0 ? Math.round((doneInGroup / totalInGroup) * 100) : 0;
      const progressBar = `<div class="version-progress-inline">
          <div class="version-progress-bar-wrap"><div class="version-progress-bar" style="--ver-bar-w:${pct}%"></div></div>
          <span class="version-progress-label">${doneInGroup}/${totalInGroup} · ${pct}%</span>
        </div>`;
      // T-202605-456: ★ eliminado del version-tag — estado activo lo comunica sprint-badge-active
      const sprintBadge = '';
      const sprintStatusLabel = isActive ? `<span class="sprint-badge-active" class="sprint-badge-ml">activo</span>` : '';
      // R-202605-007: sprintActions eliminado — header solo lectura
      const _sprintAllItems = getItems().filter(i => (i.sprint || '').trim() === s.id);
      const _sprintPills = _statusPills(_sprintAllItems);
      const _velLabel066a = isActive ? _sprintVelocityLabel(s.id) : '';
      const _doneInGroupItems = _getActiveStatuses().has('done')
        ? getItems().filter(i => (i.sprint || '').trim() === s.id && i.status === 'done' && _isCountableItem(i) && _matchesQuery(i))
        : [];
      const _doneGroupHtml = _doneInGroupItems.length
        ? _sortGroup(_doneInGroupItems).map(item => buildBacklogItem(item)).join('')
        : '';
      const _groupBodyCollapsed = !_doneInGroupItems.length; // colapsado si no hay done visibles
      html += `<div class="version-group${isActive ? ' sprint-group-active' : ''}">
        <div data-action="version-collapse" data-group-id="${groupId}" class="version-collapse-trigger">
          <div class="version-header">
            <span id="sprint-label-wrap-${esc(s.id)}"><span class="version-tag">${esc(s.id)}${sprintBadge}</span>${(s.label && s.label !== s.id) ? `<span class="sprint-name-label">${esc(s.label.replace(/^[A-Za-z]+[-\s]S\d+\s*·?\s*/i, ''))}</span>` : ''}</span>${sprintStatusLabel}
            ${progressBar}
            ${_velLabel066a}
            ${_sprintPills ? `<span class="sprint-pills-secondary">${_sprintPills}</span>` : ''}
            <span class="version-collapse-arrow" id="varrow-${groupId}">${_groupBodyCollapsed ? '▸' : '▾'}</span>
          </div>
        </div>
        <div class="version-group-body items-grid${_groupBodyCollapsed ? ' collapsed' : ''}" id="vbody-${groupId}">${_doneGroupHtml}</div>
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
      const doneInGroup = getItems().filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key) && i.status === 'done').length;
      const totalInGroup = getItems().filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key)).length;
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

      const _sprintAllItems = getItems().filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key));
      const _pendCount  = group.length;
      const _doneCount  = _sprintAllItems.filter(i => i.status === 'done').length;
      const _descCount  = _sprintAllItems.filter(i => i.status === 'descartado').length;
      const _pendPill   = _pendCount  ? `<span class="status-pill status-pill--pendiente">${_pendCount} pend.</span>` : '';
      const _donePill   = _doneCount  ? `<span class="status-pill status-pill--done">${_doneCount} done</span>` : '';
      const _descPill   = _descCount  ? `<span class="status-pill status-pill--descartado">${_descCount} desc.</span>` : '';
      const _velLabel066b = isActive ? _sprintVelocityLabel(key) : '';
      // T-202606-006: done items en posición natural dentro del sprint — sin sección separada
      const _doneInGroupItems = _getActiveStatuses().has('done')
        ? getItems().filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key) && i.status === 'done' && _isCountableItem(i) && _matchesQuery(i))
        : [];
      const _doneGroupHtml = _doneInGroupItems.length
        ? _sortGroup(_doneInGroupItems).map(item => buildBacklogItem(item)).join('')
        : '';
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

      // T-202606-023: render jerárquico — Rs con hijos sangrados, huérfanos al nivel raíz
      {
        const _sprintCode = isSinAsignar ? null : key;
        // Construir childMap para este sprint usando los ítems del grupo + getItems() completo
        // sprintItems = todos los ítems del sprint (no solo los filtrados) para detectar hijos con cualquier status
        const _allSprintItems = _sprintCode
          ? getItems().filter(i => (i.sprint || '').trim() === _sprintCode)
          : getItems().filter(i => !i.sprint || i.sprint === '' || i.sprint === 'icebox');
        const _childMap = _buildChildMap(_allSprintItems);

        // Rs presentes en el grupo visible (filtrado)
        const _rCodesInGroup = new Set(group.filter(i => itemType(i.code) === 'R').map(i => i.code));

        // Ítems de nivel raíz: Rs del grupo + huérfanos (Ts/Bs/Ps sin parent en el grupo)
        const _rootItems = _sortGroup(group).filter(i => {
          if (itemType(i.code) === 'R') return true; // Rs siempre al nivel raíz
          // Ts/Bs/Ps: huérfanos si no tienen parentId apuntando a un R del grupo visible
          return !i.parentId || !_rCodesInGroup.has(i.parentId);
        });

        _rootItems.forEach(item => {
          if (itemType(item.code) !== 'R') {
            // Huérfano — nivel raíz sin sangría
            html += buildBacklogItem(item);
            return;
          }
          // R — card al nivel raíz + hijos sangrados
          const _children = _childMap.get(item.code) || [];
          const _hasChildren = _children.length > 0;

          if (_hasChildren) {
            // Estado de colapso desde localStorage
            const _collapseKey = 'locus-r-collapsed-' + item.code;
            const _isRCollapsed = localStorage.getItem(_collapseKey) === '1';
            // T-202606-087: respetar estado del pill 'Hijos' al re-renderizar
            const _showChildren = localStorage.getItem('backlog-show-children') === '1';
            const _childrenCollapsed = _isRCollapsed || !_showChildren;

            // Wrapper del R con toggle
            html += `<div class="bl-r-with-children" data-r-code="${esc(item.code)}">`;
            // Card del R con botón toggle inyectado via wrapper — buildBacklogItem sin modificar
            html += `<div class="bl-r-card-wrap">`;
            html += buildBacklogItem(item);
            html += `<button class="bl-r-toggle${_childrenCollapsed ? ' collapsed' : ''}" data-action="bl-r-toggle" data-r-code="${esc(item.code)}" aria-label="Colapsar/expandir hijos" title="Colapsar/expandir hijos" type="button"></button>`;
            html += `</div>`; // bl-r-card-wrap
            // Wrapper de hijos con sangría
            html += `<div class="bl-children-wrap${_childrenCollapsed ? ' collapsed' : ''}" id="bl-children-${esc(item.code)}">`;
            _children.forEach(child => {
              html += `<div class="bl-child-row">${buildBacklogItem(child)}</div>`;
            });
            html += `</div>`; // bl-children-wrap
            html += `</div>`; // bl-r-with-children
          } else {
            // R sin hijos — render normal sin toggle
            html += buildBacklogItem(item);
          }
        });
      }

      html += _doneGroupHtml;
      html += `</div></div>`;
    });

    // T-202606-062: bloque bl-r-toggle eliminado — reemplazado por vl-toggle-r en _renderVistaLista (T1)

    // R-202605-103: bloque sprints cerrados eliminado — absorbido por renderArchivoHistorico

    // T-202605-104: sección Icebox — ítems sin sprint asignado (icebox / '' / null)
    if (iceboxItems.length) {
      // B-202605-030: default expandido — clave ausente (null) → expandido; '0' → colapsado
      const iceboxOpen = localStorage.getItem('backlog-icebox-open') !== '0';
      // T-202606-163: contar ítems con alerta para el header
      const _iceboxAlertCount = iceboxItems.filter(i => _iceboxStaleness(i) !== null).length;
      const _iceboxAlertBadge = _iceboxAlertCount > 0
        ? `<span class="staleness-pill staleness--stale bl-icebox-alert-count" title="${_iceboxAlertCount} ítem${_iceboxAlertCount !== 1 ? 's' : ''} sin movimiento — revisar">⚠ ${_iceboxAlertCount}</span>`
        : '';
      html += `<div class="section-group sg-icebox bl-icebox-group" id="sg-icebox">
        <div class="section-group-header bl-icebox-header" data-action="section-group-toggle" data-group="icebox">
          <span class="section-group-arrow bl-icebox-arrow${iceboxOpen ? '' : ' collapsed'}" id="sgarrow-icebox">▾</span>
          <span>📥 Icebox</span>
          <span class="section-group-count bl-icebox-count">${iceboxItems.length} ítem${iceboxItems.length !== 1 ? 's' : ''}</span>
          ${_iceboxAlertBadge}
        </div>
        <div class="section-group-body items-grid bl-icebox-body${iceboxOpen ? '' : ' collapsed'}" id="sgbody-icebox">`;
      _sortGroup(iceboxItems).forEach(item => {
        // T-202606-163: badge de alerta inline por ítem
        const _stale = _iceboxStaleness(item);
        const _alertHtml = _stale
          ? `<div class="bl-icebox-item-alert"><span class="staleness-pill staleness--stale" title="Sin movimiento — ${_stale.days}d en icebox">${_stale.label} en icebox</span></div>`
          : '';
        html += _alertHtml + buildBacklogItem(item);
      });
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
    html += `<div class="items-grid" id="vbody-list">`;
    flatItems.forEach(item => { html += buildBacklogItem(item); });
    html += `</div>`;
  }

  // T-202606-006: sección #sg-done eliminada — done items en posición natural dentro de su sprint
  // via filtro s-done. Ver R-202605-036.

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
  const _hasVisible = pendienteItems.length || doneItems.length || (descartadoItems.length && _getActiveStatuses().has('descartado'));
  if (!_hasVisible) {
    // T-202604-319: empty state contextual según causa
    const _activeSprint = _getActiveSprint();
    const _hasTypeFilter  = _getActiveTypes().size < 4;
    const _hasStatusFilter = !(_getActiveStatuses().has('pendiente') && _getActiveStatuses().size === 1);
    const _hasEffortFilter = _getActiveEfforts().size < 3;
    const _hasAnyFilter = q || _hasTypeFilter || _hasStatusFilter || _hasEffortFilter; // T-202606-098: _hasRoleFilter eliminado

    let emptyIcon = '🔍', emptyTitle = '', emptyHint = '', emptyCTA = '';

    if (q) {
      emptyTitle = `Sin resultados para "${esc(q)}"`;
      emptyHint  = 'Prueba con otro término o limpia la búsqueda.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-clear-search">✕ Limpiar búsqueda</button>`;
    } else if (_hasAnyFilter) {
      emptyTitle = 'Sin resultados con los filtros activos';
      emptyHint  = 'Prueba ajustando o limpiando los filtros.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-clear-filters">✕ Limpiar filtros</button>`;
    } else {
      emptyIcon  = '📋';
      emptyTitle = 'Sin ítems pendientes';
      emptyHint  = 'Todos los ítems están completados o no hay trabajo asignado a este sprint.';
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
  _updateDocLogCount('backlog');

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


// T-202606-072: listeners shell:* — desacoplamiento de módulos consumidores
// locus-storage.js despacha estos eventos en lugar de llamar directamente a las funciones
window.addEventListener('shell:backlog-render-dirty', () => { _markBacklogListDirty(); renderBacklogList(); });
window.addEventListener('shell:mark-backlog-dirty',   () => { _markBacklogListDirty(); });
window.addEventListener('shell:render-backlog-list',  () => { renderBacklogList(); });
window.addEventListener('shell:backlog-filter-changed', () => { updateClearFilterBtn(); });
