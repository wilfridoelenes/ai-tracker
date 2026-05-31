// [PP] v1.2.4 · sprint:PP-S-13 · mod:2 · autor:Rune · 2026-05-31 UTC-6
// locus-sprint-planificacion.js
// Módulo: Vista Planificación — sprint selector bar + drag & drop planning view
// Migrado desde locus-backlog-render.js (T-202605-090)

import { _getActiveSprint, openSprintRetroView, setItemSprint } from './locus-backlog-sprints.js';
import { itemType, _getActiveStatuses, updateStatusFilterUI } from './locus-backlog-core.js';
import { getActiveSprints } from './locus-storage.js';
import { esc } from './locus-ui-shell.js';
import { _calcEstimatedVelocity, _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';

// ---------------------------------------------------------------------------
// Estado interno
// ---------------------------------------------------------------------------

// T-202604-284: Sprint Roadmap — filtro activo (sprintId | null)
let _roadmapSprintFilter = null;

// R-202605-130: drag & drop handlers para vista planificación
let _planDragCode = null;

// ---------------------------------------------------------------------------
// Status pills helper — usado en sprint bar y renderBacklogList
// ---------------------------------------------------------------------------

export function _statusPills(items) {
  const counts = { pendiente: 0, done: 0, descartado: 0 };
  // P's (ideas) no son trabajo activo — excluir de pendiente, consistente con _isCountableItem
  items.forEach(i => {
    if (i.status === 'pendiente' && itemType(i.code) === 'P') return;
    if (counts[i.status] !== undefined) counts[i.status]++;
  });
  const cfg = [
    { key: 'pendiente', label: 'pendiente', color: 'var(--accent)',  bg: 'color-mix(in srgb, var(--accent) 15%, transparent)' },
    { key: 'done',      label: 'done',      color: 'var(--green)',   bg: 'color-mix(in srgb, var(--green) 15%, transparent)' },
    { key: 'descartado',label: 'desc.',     color: 'var(--c-done-text)', bg: 'var(--c-done-bg)' },
  ];
  return cfg
    .filter(c => counts[c.key] > 0)
    .map(c => `<span class="status-pill status-pill--${c.key}">${counts[c.key]} ${c.label}</span>`)
    .join('');
}

// R-202605-103: toggleClosedSprintsBody reemplazada por toggleArchivoHistorico
// Alias de compatibilidad — invocado desde renderBacklogList
export function toggleClosedSprintsBody() {
  if (typeof window.toggleArchivoHistorico === 'function') window.toggleArchivoHistorico();
}

// ---------------------------------------------------------------------------
// Sprint selector bar
// ---------------------------------------------------------------------------

// T-202604-284: navegar al grupo de un sprint en el backlog
export function roadmapGoToSprint(sprintId) {
  // T-202604-364: click feedback en chip
  requestAnimationFrame(() => {
    document.querySelectorAll('.rm-chip').forEach(el => {
      if (el.title && el.title.startsWith(sprintId + ' ·') || el.onclick && el.getAttribute('onclick') && el.getAttribute('onclick').includes(`'${sprintId}'`)) {
        el.classList.remove('rm-chip--clicked');
        void el.offsetWidth;
        el.classList.add('rm-chip--clicked');
        el.addEventListener('animationend', () => el.classList.remove('rm-chip--clicked'), { once: true });
      }
    });
  });
  // Si se hace click sobre el sprint ya activo → limpia filtro
  _roadmapSprintFilter = (_roadmapSprintFilter === sprintId) ? null : sprintId;

  // B-202604-159: actualizar chips visuales
  _renderSprintRoadmap();

  // T-202604-424: agrupación por sprint es siempre activa — no es necesario forzar sortMode
  // Asegurar status pendiente incluido
  if (!_getActiveStatuses().has('pendiente')) {
    _getActiveStatuses().add('pendiente');
    updateStatusFilterUI();
  }

  _markBacklogListDirty(); renderBacklogList();

  if (!_roadmapSprintFilter) return;

  // Scroll al grupo tras render
  requestAnimationFrame(() => {
    const groupId = sprintId === '__unassigned__'
      ? 'sin-asignar'
      : sprintId.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const groupEl = document.getElementById('vbody-' + groupId)?.closest('.version-group');
    if (!groupEl) return;
    groupEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    groupEl.classList.add('roadmap-sprint-highlight');
    setTimeout(() => groupEl.classList.remove('roadmap-sprint-highlight'), 1800);
  });
}

// B-202605-058: función de módulo única — elimina duplicación verbatim en _buildSprintSelector y _blSprintOpen
function _buildSprintOption(sp) {
  const id = sp.id;
  const label = sp.label || sp.id;
  const status = sp.status || 'active';
  const isActive = status === 'active';
  const isClosed = status === 'closed';
  const isSelected = _roadmapSprintFilter === id;
  const ITEMS = window.ITEMS || [];
  const total = ITEMS.filter(i => (i.sprint || '').trim() === id).length;
  const done  = ITEMS.filter(i => (i.sprint || '').trim() === id && i.status === 'done').length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const mark  = isActive ? '★' : isClosed ? '·' : '○';
  const badgeCls = isActive ? 'bl-sprint-badge--active' : isClosed ? 'bl-sprint-badge--closed' : 'bl-sprint-badge--active';
  const badgeTxt = isActive ? 'activo' : isClosed ? 'cerrado' : 'activo';
  const activeCls = isActive ? ' is-active-sprint' : '';
  const selectedCls = isSelected ? ' is-selected' : '';
  // T-202604-417: botón "Ver retro" para sprints cerrados con retroDoc guardado
  const retroBtn = isClosed && sp.retroDoc
    ? `<button class="bl-sprint-retro-btn" data-action="bl-sprint-retro" data-sprint-id="${esc(id)}" title="Ver retrospectiva" type="button">retro</button>`
    : '';
  return `<button class="bl-sprint-option${activeCls}${selectedCls}" data-action="bl-sprint-select" data-sprint-id="${esc(id)}" type="button">
    <span class="bl-sprint-option-mark">${mark}</span>
    <span class="bl-sprint-option-name">${esc(label)}</span>
    <div class="bl-sprint-option-meta">
      <div class="bl-sprint-option-bar-wrap"><div class="bl-sprint-option-bar-fill" style="width:${pct}%"></div></div>
      <span class="bl-sprint-option-pct">${pct}%</span>
      <span class="bl-sprint-option-badge ${badgeCls}">${badgeTxt}</span>
      ${retroBtn}
    </div>
  </button>`;
}

function _buildSprintSelector() {
  const ITEMS = window.ITEMS || [];
  const allSprints = getActiveSprints() || [];
  if (!allSprints.length) return '';

  // Sprint activo para el trigger
  const activeSprint = allSprints.find(s => s.status === 'active');
  const openSprints  = []; // AC-7: post-migración no existen sprints con status distinto de 'active' o 'closed'
  const closedSprints = allSprints.filter(s => s.status === 'closed');

  // datos del sprint activo para la barra de progreso del trigger
  let triggerName = '', triggerPct = 0;
  if (activeSprint) {
    const id = activeSprint.id;
    const total = ITEMS.filter(i => (i.sprint || '').trim() === id).length;
    const done  = ITEMS.filter(i => (i.sprint || '').trim() === id && i.status === 'done').length;
    triggerPct = total > 0 ? Math.round((done / total) * 100) : 0;
    triggerName = activeSprint.label || activeSprint.id;
  } else if (openSprints.length) {
    triggerName = openSprints[openSprints.length - 1].label || openSprints[openSprints.length - 1].id;
  }

  const triggerNameHtml = triggerName
    ? `<span class="bl-sprint-active-name">${esc(triggerName)}</span>`
    : `<span class="bl-sprint-active-name is-empty">Sin sprint activo</span>`;

  const progressHtml = activeSprint ? `
    <div class="bl-sprint-trigger-progress">
      <div class="bl-sprint-trigger-bar-wrap">
        <div class="bl-sprint-trigger-bar-fill" style="--sbar-w:${triggerPct}%"></div>
      </div>
      <span class="bl-sprint-trigger-pct">${triggerPct}%</span>
    </div>` : '';

  // builder de opción individual — B-202605-058: referencia a función de módulo _buildSprintOption
  const closedOptionsHtml = closedSprints.map(_buildSprintOption).join('');
  const closedSection = closedSprints.length ? `
    <button class="bl-sprint-closed-toggle" id="bl-sprint-closed-toggle" data-action="bl-sprint-toggle-closed" type="button">
      <span class="bl-sprint-closed-toggle-label">Cerrados</span>
      <span class="bl-sprint-closed-toggle-count">${closedSprints.length}</span>
      <span class="bl-sprint-closed-toggle-arrow">▾</span>
    </button>
    <div class="bl-sprint-closed-list is-hidden" id="bl-sprint-closed-list">
      ${closedOptionsHtml}
    </div>` : '';

  return `<div class="bl-sprint-trigger" id="bl-sprint-trigger" data-action="bl-sprint-open" role="button" tabindex="0" data-keyaction="bl-sprint-open">
    <span class="bl-sprint-trigger-label">Sprint</span>
    ${triggerNameHtml}
    ${progressHtml}
    <span class="bl-sprint-trigger-arrow">▾</span>
  </div>`;
}

// abrir dropdown del sprint selector
function _blSprintOpen() {
  const ITEMS = window.ITEMS || [];
  const bar = document.getElementById('bl-sprint-bar');
  const trigger = document.getElementById('bl-sprint-trigger');
  if (!bar || !trigger) return;
  if (document.getElementById('bl-sprint-dropdown')) return; // ya abierto

  trigger.classList.add('is-open');

  // construir dropdown
  const allSprints = getActiveSprints() || [];
  const activeSprint = allSprints.find(s => s.status === 'active');
  const openSprints  = []; // AC-7: post-migración no existen sprints con status distinto de 'active' o 'closed'
  const closedSprints = allSprints.filter(s => s.status === 'closed');

  // B-202605-058: referencia a función de módulo _buildSprintOption — elimina duplicación
  const openOptionsHtml   = [activeSprint, ...openSprints].filter(Boolean).map(_buildSprintOption).join('');
  const closedOptionsHtml = closedSprints.map(_buildSprintOption).join('');
  const closedSection = closedSprints.length ? `
    <button class="bl-sprint-closed-toggle" id="bl-sprint-closed-toggle" data-action="bl-sprint-toggle-closed" type="button">
      <span class="bl-sprint-closed-toggle-label">Cerrados</span>
      <span class="bl-sprint-closed-toggle-count">${closedSprints.length}</span>
      <span class="bl-sprint-closed-toggle-arrow">▾</span>
    </button>
    <div class="bl-sprint-closed-list is-hidden" id="bl-sprint-closed-list">
      ${closedOptionsHtml}
    </div>` : '';

  bar.insertAdjacentHTML('beforeend', `
    <div class="bl-sprint-dropdown" id="bl-sprint-dropdown">
      <div class="bl-sprint-list" id="bl-sprint-list">
        ${openOptionsHtml}
        ${closedSection}
      </div>
    </div>
    <div class="bl-sprint-overlay" id="bl-sprint-overlay" data-action="bl-sprint-close"></div>
  `);
}

// cerrar dropdown — con animación de salida
function _blSprintClose() {
  const dropdown = document.getElementById('bl-sprint-dropdown');
  const overlay  = document.getElementById('bl-sprint-overlay');
  const trigger  = document.getElementById('bl-sprint-trigger');
  if (trigger) trigger.classList.remove('is-open');
  if (overlay) overlay.remove();
  if (dropdown) {
    dropdown.classList.add('is-closing');
    dropdown.addEventListener('animationend', () => dropdown.remove(), { once: true });
  }
}

// seleccionar sprint — filtra la lista y cierra
function _blSprintSelect(sprintId) {
  _blSprintClose();
  roadmapGoToSprint(sprintId);
}

// toggle sección cerrados dentro del dropdown
function _blSprintToggleClosed() {
  const toggle = document.getElementById('bl-sprint-closed-toggle');
  const list   = document.getElementById('bl-sprint-closed-list');
  const arrow  = toggle ? toggle.querySelector('.bl-sprint-closed-toggle-arrow') : null;
  if (!list) return;
  const isOpen = !list.classList.contains('is-hidden');
  list.classList.toggle('is-hidden', isOpen);
  if (toggle) toggle.classList.toggle('is-open', !isOpen);
  if (arrow) arrow.textContent = isOpen ? '▾' : '▴';
}

// T-202605-054: delegación de eventos para #bl-sprint-bar — reemplaza handlers inline
// Cubre: bl-sprint-open · bl-sprint-close · bl-sprint-select · bl-sprint-toggle-closed
export function _attachSprintBarDelegation() {
  const bar = document.getElementById('bl-sprint-bar');
  if (!bar || bar._delegationAttached) return;
  bar._delegationAttached = true;

  bar.addEventListener('click', function _sprintBarClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const act = action.dataset.action;

    if (act === 'bl-sprint-open') {
      _blSprintOpen();
      return;
    }
    if (act === 'bl-sprint-close') {
      _blSprintClose();
      return;
    }
    if (act === 'bl-sprint-select') {
      _blSprintSelect(action.dataset.sprintId);
      return;
    }
    if (act === 'bl-sprint-toggle-closed') {
      _blSprintToggleClosed();
      return;
    }
    if (act === 'bl-sprint-retro') {
      openSprintRetroView(action.dataset.sprintId);
      return;
    }
  });

  bar.addEventListener('keydown', function _sprintBarKeydown(e) {
    const action = e.target.closest('[data-keyaction="bl-sprint-open"]');
    if (!action) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      _blSprintOpen();
    }
  });
}

// render/update del sprint selector en #bl-sprint-bar
export function _renderSprintRoadmap() {
  const bar = document.getElementById('bl-sprint-bar');
  if (!bar) return;
  if (document.getElementById('bl-sprint-dropdown')) return;
  const prevClosedList = document.getElementById('bl-sprint-closed-list');
  const closedWasOpen = prevClosedList ? !prevClosedList.classList.contains('is-hidden') : false;
  const html = _buildSprintSelector();
  bar.innerHTML = html;
  if (closedWasOpen) {
    const newList   = document.getElementById('bl-sprint-closed-list');
    const newToggle = document.getElementById('bl-sprint-closed-toggle');
    const newArrow  = newToggle ? newToggle.querySelector('.bl-sprint-closed-toggle-arrow') : null;
    if (newList)   newList.classList.remove('is-hidden');
    if (newToggle) newToggle.classList.add('is-open');
    if (newArrow)  newArrow.textContent = '▴';
  }
}

// ---------------------------------------------------------------------------
// Vista Planificación
// ---------------------------------------------------------------------------

// R-202605-130: vista Planificación — layout dos columnas con drag & drop
// T-202605-028: columna derecha muestra todos los sprints active como destinos
export function _renderPlanningView(listEl, closeCallback) {
  const ITEMS = window.ITEMS || [];
  const activeSprint = _getActiveSprint();
  const allSprints   = getActiveSprints();
  // T-202605-028: todos los sprints con status active son destinos válidos
  const openSprints  = allSprints.filter(s => s.status === 'active');

  // Columna izquierda: ítems pendientes sin sprint (no done, no descartado, no historico)
  // T-202605-024: icebox es el valor canónico de "sin sprint asignado" (BR-Ecosystem V1.6)
  const unassigned = ITEMS.filter(i =>
    (!i.sprint || i.sprint === 'icebox') &&
    i.status !== 'done' &&
    i.status !== 'descartado' &&
    i.status !== 'historico'
  ).sort((a, b) => {
    const prioOrder = { high: 0, medium: 1, low: 2 };
    const pa = prioOrder[a.priority] ?? 1;
    const pb = prioOrder[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return (parseInt(b.effort) || 1) - (parseInt(a.effort) || 1);
  });

  // Velocidad promedio — para meter de cada sprint destino
  const velocityData = _calcEstimatedVelocity();
  const velocityAvg  = velocityData ? velocityData.avg : null;

  // Helper: card compacta de ítem
  function _planCard(item, draggable, sprintId) {
    const type  = itemType(item.code) || '';
    const typeColors = { T: '#2ecc78', R: '#38bdf8', B: '#e85555', P: '#7c6af7' };
    const tc    = typeColors[type] || 'var(--hint)';
    const eff   = parseInt(item.effort) || 1;
    const dots  = Array.from({length: 3}, (_, i) =>
      `<span class="bl-plan-dot${i < eff ? ' on' : ''}"></span>`).join('');
    const prioClass = item.priority === 'high' ? 'bl-plan-prio--high' : item.priority === 'low' ? 'bl-plan-prio--low' : '';
    // T-202605-028: data-sprint-dest indica el sprint destino del drop
    return `<div class="bl-plan-card${draggable ? ' bl-plan-card--draggable' : ''}"
         draggable="${draggable ? 'true' : 'false'}"
         data-code="${esc(item.code)}"
         data-col="${sprintId || 'left'}"
         style="--item-type-color:${tc}">
      <div class="bl-plan-card-header">
        <span class="bl-plan-card-type">${type}</span>
        <span class="bl-plan-card-code">${esc(item.code)}</span>
        ${prioClass ? `<span class="bl-plan-card-prio ${prioClass}">${item.priority === 'high' ? '↑' : '↓'}</span>` : ''}
        <span class="bl-plan-dots">${dots}</span>
      </div>
      <div class="bl-plan-card-title">${esc(item.title || '')}</div>
    </div>`;
  }

  // Helper: meter HTML para un sprint destino
  function _sprintMeterHtml(sprintId) {
    const sprintEffort = ITEMS
      .filter(i => i.sprint === sprintId && i.status !== 'done' && i.status !== 'descartado' && i.status !== 'historico')
      .reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    if (velocityAvg === null) {
      return `<div class="bl-plan-meter"><span class="bl-plan-meter-label">Effort: <strong>${sprintEffort}</strong> — sin velocidad histórica</span></div>`;
    }
    const isOver = sprintEffort > velocityAvg * 1.3;
    const pct    = velocityAvg > 0 ? Math.min(Math.round((sprintEffort / velocityAvg) * 100), 999) : null;
    const barW   = Math.min((sprintEffort / (velocityAvg * 1.3)) * 100, 100);
    return `<div class="bl-plan-meter">
      <div class="bl-plan-meter-bar">
        <div class="bl-plan-meter-fill ${isOver ? 'bl-plan-meter-fill--over' : ''}" style="--plan-meter-pct:${barW}%"></div>
        <div class="bl-plan-meter-threshold" title="Velocidad promedio (${velocityAvg} effort)"></div>
      </div>
      <span class="bl-plan-meter-label ${isOver ? 'bl-plan-meter-label--over' : ''}">
        ${sprintEffort} / ${velocityAvg} effort${pct !== null ? ` (${pct}%)` : ''}${isOver ? ' · ⚠ Sobrecarga' : ''}
      </span>
    </div>`;
  }

  // Helper: bloque HTML de un sprint destino en columna derecha
  // T-202605-028: cada sprint activo es una zona de drop independiente con su data-plan-col = sprintId
  function _sprintDestCard(sprint) {
    const isCurrent = activeSprint && sprint.id === activeSprint.id;
    const label     = sprint.label || sprint.id;
    const inSprint  = ITEMS.filter(i =>
      i.sprint === sprint.id &&
      i.status !== 'done' &&
      i.status !== 'descartado' &&
      i.status !== 'historico'
    );
    const cards = inSprint.map(i => _planCard(i, false, sprint.id)).join('') ||
      `<div class="bl-plan-empty">Sprint vacío — arrastra ítems aquí</div>`;
    const currentBadge = isCurrent
      ? `<span class="bl-plan-dest-current-badge" aria-label="Sprint en curso">en curso</span>`
      : '';
    return `<div class="bl-plan-dest-sprint bl-plan-col${isCurrent ? ' bl-plan-dest-sprint--current' : ''}"
               data-plan-col="${esc(sprint.id)}">
      <div class="bl-plan-col-header">
        <span class="bl-plan-col-title">${esc(label)}</span>
        ${currentBadge}
        <span class="bl-plan-col-count">${inSprint.length} ítems</span>
      </div>
      ${_sprintMeterHtml(sprint.id)}
      <div class="bl-plan-col-body">
        ${cards}
      </div>
    </div>`;
  }

  // Construir columna izquierda
  const leftCards = unassigned.map(i => _planCard(i, true, 'left')).join('') ||
    `<div class="bl-plan-empty">Sin ítems sin sprint</div>`;

  // Construir columna derecha — T-202605-028: N cards, uno por sprint active
  const rightColContent = openSprints.length
    ? openSprints.map(_sprintDestCard).join('')
    : `<div class="bl-plan-empty bl-plan-dest-empty">No hay sprints abiertos</div>`;

  listEl.innerHTML = `
    <div class="bl-planning-view" id="bl-planning-view">
      <div class="bl-plan-header">
        <div class="bl-plan-header-title">
          <span class="bl-plan-header-icon">📋</span>
          Planificación
        </div>
        <button class="bl-plan-close-btn" data-action="bl-plan-close" data-callback="${closeCallback || ''}" title="Volver al backlog">✕ Cerrar planificación</button>
      </div>

      <div class="bl-plan-columns">
        <!-- Columna izquierda: icebox -->
        <div class="bl-plan-col bl-plan-col--left"
             id="bl-plan-col-left"
             data-plan-col="left">
          <div class="bl-plan-col-header">
            <span class="bl-plan-col-title">Sin sprint</span>
            <span class="bl-plan-col-count">${unassigned.length} ítems</span>
          </div>
          <div class="bl-plan-col-body" id="bl-plan-left-body">
            ${leftCards}
          </div>
        </div>

        <!-- Separador -->
        <div class="bl-plan-sep">
          <div class="bl-plan-sep-arrow">→</div>
        </div>

        <!-- Columna derecha: sprints destino (T-202605-028) -->
        <div class="bl-plan-col bl-plan-col--right bl-plan-col--dest-stack"
             id="bl-plan-col-right">
          <div class="bl-plan-col-header">
            <span class="bl-plan-col-title">Sprints abiertos</span>
            <span class="bl-plan-col-count">${openSprints.length} sprint${openSprints.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="bl-plan-col-body bl-plan-dest-list" id="bl-plan-right-body">
            ${rightColContent}
          </div>
        </div>
      </div>

      ${!openSprints.length ? '<div class="bl-plan-no-sprint">No hay sprints abiertos. Crea un sprint para empezar a planificar.</div>' : ''}
    </div>`;
}

// ---------------------------------------------------------------------------
// Drag & drop handlers
// ---------------------------------------------------------------------------

function _planDragStart(e) {
  const card = e.currentTarget;
  _planDragCode = card.dataset.code;
  card.classList.add('bl-plan-card--dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function _planDragEnd(e) {
  e.currentTarget.classList.remove('bl-plan-card--dragging');
  // T-202605-028: limpiar drag-over en todos los destinos (sprint cards y columna izquierda)
  document.querySelectorAll('.bl-plan-col, .bl-plan-dest-sprint').forEach(c => c.classList.remove('bl-plan-col--over'));
  _planDragCode = null;
}

function _planDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const col = e.currentTarget;
  col.classList.add('bl-plan-col--over');
}

function _planDragLeave(e) {
  e.currentTarget.classList.remove('bl-plan-col--over');
}

function _planDrop(e, targetCol) {
  const ITEMS = window.ITEMS || [];
  e.preventDefault();
  // T-202605-028: limpiar en el destino exacto que recibió el drop
  const dropTarget = e.currentTarget;
  if (dropTarget) dropTarget.classList.remove('bl-plan-col--over');
  if (!_planDragCode) return;

  const item = ITEMS.find(i => i.code === _planDragCode);
  if (!item) return;

  if (targetCol === 'left') {
    // Desasignar del sprint — solo si venía con sprint asignado
    const currentSprint = item.sprint;
    if (!currentSprint || currentSprint === 'icebox') return;
    setItemSprint(item.code, 'icebox');
  } else {
    // T-202605-028: targetCol es el sprintId del card destino (no 'right' genérico)
    const targetSprintId = targetCol;
    if (!targetSprintId) return;
    if (item.sprint === targetSprintId) return; // ya está asignado a este sprint
    setItemSprint(item.code, targetSprintId);
  }

  // Re-renderizar la vista planificación inmediatamente
  // Nota: _attachPlanViewDelegation() no se re-invoca — los listeners de delegación
  // viven en #backlog-list (el contenedor) y sobreviven al innerHTML replace de _renderPlanningView.
  const _planListEl = document.getElementById('backlog-list');
  if (_planListEl) {
    _renderPlanningView(_planListEl);
  }
}

// T-202605-054: delegación de eventos para #backlog-list — plan view drag handlers
// Cubre: _planDragStart · _planDragEnd · _planDragOver · _planDragLeave · _planDrop
// T-202605-028: data-plan-col ahora puede ser 'left' o un sprintId real
export function _attachPlanViewDelegation() {
  const listEl = document.getElementById('backlog-list');
  if (!listEl || listEl._planDelegationAttached) return;
  listEl._planDelegationAttached = true;

  listEl.addEventListener('dragstart', function _planViewDragStart(e) {
    const card = e.target.closest('.bl-plan-card');
    if (!card) return;
    _planDragStart(Object.assign(e, { currentTarget: card }));
  });
  listEl.addEventListener('dragend', function _planViewDragEnd(e) {
    const card = e.target.closest('.bl-plan-card');
    if (!card) return;
    _planDragEnd(Object.assign(e, { currentTarget: card }));
  });
  listEl.addEventListener('dragover', function _planViewDragOver(e) {
    // T-202605-028: aceptar drop en sprint-dest cards individuales o en columna izquierda
    const col = e.target.closest('[data-plan-col]');
    if (!col) return;
    _planDragOver(Object.assign(e, { currentTarget: col }));
  });
  listEl.addEventListener('dragleave', function _planViewDragLeave(e) {
    const col = e.target.closest('[data-plan-col]');
    if (!col) return;
    _planDragLeave(Object.assign(e, { currentTarget: col }));
  });
  listEl.addEventListener('drop', function _planViewDrop(e) {
    const col = e.target.closest('[data-plan-col]');
    if (!col) return;
    _planDrop(Object.assign(e, { currentTarget: col }), col.dataset.planCol);
  });

  listEl.addEventListener('click', function _planViewClick(e) {
    const btn = e.target.closest('[data-action="bl-plan-close"]');
    if (!btn) return;
    // Volver al sub-tab Ítems — window._sptSwitch expuesto por locus-sprint.js
    if (typeof window._sptSwitch === 'function') {
      const itemsBtn = document.getElementById('spt-tab-items');
      window._sptSwitch('items', itemsBtn || null);
    }
  });
}
