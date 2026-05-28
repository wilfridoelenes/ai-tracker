// [PP] v1.2.3 · sprint:PP-S-09 · mod:2 · autor:Rune · 2026-05-28 00:00 UTC-6
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

function updateClearFilterBtn() {
  const btn = document.getElementById('filter-clear-btn');
  if (!btn) return;
  const allTypes = activeTypes.size === 4;
  const defaultStatus = activeStatuses.size === 1 && activeStatuses.has('pendiente') && !activeStatuses.has('done');
  const noSearch = !backlogSearchQuery;
  const noRoleFilter = activeRoleFilter === null;
  const noPriorityFilter = activePriorityFilter.size === 0; // T-202604-357
  const isDefault = allTypes && defaultStatus && noSearch && noRoleFilter && noPriorityFilter && !_backlogFocusMode && !_backlogNoAcMode;
  btn.classList.toggle('is-hidden', isDefault);

  // R-202605-094: chips individuales limpiables por filtro activo
  const wrap = document.getElementById('active-filter-chips');
  if (!wrap) return;
  if (isDefault) { wrap.innerHTML = ''; return; }

  const chips = [];
  const _chip = (label, clearFn) =>
    `<span class="afc-chip" onclick="(${clearFn})()">${esc(label)} <span class="afc-chip-x">✕</span></span>`;

  if (!allTypes) {
    const excluded = ['T','R','B','P'].filter(t => !activeTypes.has(t));
    excluded.forEach(t => {
      const labels = { T:'Ticket', R:'Req', B:'Bug', P:'Posibilidad' };
      chips.push(_chip(`Sin ${labels[t]}`, `function(){toggleTypeFilter('${t}')}`));
    });
  }
  if (!defaultStatus) {
    [...activeStatuses].filter(s => s !== 'pendiente').forEach(s => {
      chips.push(_chip(`+${s}`, `function(){toggleStatusFilter('${s}')}`));
    });
    if (!activeStatuses.has('pendiente')) {
      chips.push(_chip('−Pendiente', `function(){toggleStatusFilter('pendiente')}`));
    }
  }
  if (!noRoleFilter) {
    const label = activeRoleFilter === '__none__' ? 'Sin rol' : activeRoleFilter;
    chips.push(_chip(`Rol: ${label}`, `function(){toggleRoleFilter(${activeRoleFilter === '__none__' ? "'__none__'" : `'${activeRoleFilter}'`})}`));
  }
  if (!noPriorityFilter) {
    [...activePriorityFilter].forEach(p => {
      chips.push(_chip(`Pri: ${p}`, `function(){togglePriorityFilter('${p}')}`));
    });
  }
  if (activeEfforts.size < 3) {
    [1,2,3].filter(e => !activeEfforts.has(e)).forEach(e => {
      chips.push(_chip(`Sin E${e}`, `function(){toggleEffortFilter(${e})}`));
    });
  }
  if (!noSearch) chips.push(_chip(`"${backlogSearchQuery}"`, `function(){clearBacklogSearch()}`));
  if (_backlogNoAcMode) chips.push(_chip('Sin AC', `function(){toggleBacklogNoAcMode()}`));
  if (_backlogFocusMode) chips.push(_chip('Focus top 10', `function(){toggleBacklogFocusMode()}`));

  wrap.innerHTML = chips.join('');
}

// T-202604-213: pills de contadores de status para headers de grupo
function _statusPills(items) {
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
function toggleClosedSprintsBody() { toggleArchivoHistorico(); }

// T-202604-290 · T-202605-450: velocidad por sprint — retorna { avg, sprints: [{id, label, planned, real}] }
// planned = suma effort asignado (excluye descartados)
// real    = suma effort done
function _calcEstimatedVelocity() {
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
let _roadmapSprintFilter = null;

// T-202604-284: navegar al grupo de un sprint en el backlog
function roadmapGoToSprint(sprintId) {
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
  if (!activeStatuses.has('pendiente')) {
    activeStatuses.add('pendiente');
    updateStatusFilterUI();
  }

  if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList();

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

// T-202604-284: construir HTML del roadmap de sprints
// R-[tmp:toolbar-backlog-redesign]: sprint selector — trigger colapsado + dropdown on-demand

// B-202605-058: función de módulo única — elimina duplicación verbatim en _buildSprintSelector y _blSprintOpen
function _buildSprintOption(sp) {
  const id = sp.id;
  const label = sp.label || sp.id;
  const status = sp.status || 'active';
  const isActive = status === 'active';
  const isClosed = status === 'closed';
  const isSelected = _roadmapSprintFilter === id;
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
    ? `<button class="bl-sprint-retro-btn" onclick="event.stopPropagation();openSprintRetroView('${esc(id)}')" title="Ver retrospectiva" type="button">retro</button>`
    : '';
  return `<button class="bl-sprint-option${activeCls}${selectedCls}" onclick="_blSprintSelect('${esc(id)}')" type="button">
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
    <button class="bl-sprint-closed-toggle" id="bl-sprint-closed-toggle" onclick="_blSprintToggleClosed()" type="button">
      <span class="bl-sprint-closed-toggle-label">Cerrados</span>
      <span class="bl-sprint-closed-toggle-count">${closedSprints.length}</span>
      <span class="bl-sprint-closed-toggle-arrow">▾</span>
    </button>
    <div class="bl-sprint-closed-list is-hidden" id="bl-sprint-closed-list">
      ${closedOptionsHtml}
    </div>` : '';

  return `<div class="bl-sprint-trigger" id="bl-sprint-trigger" onclick="_blSprintOpen()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')_blSprintOpen()">
    <span class="bl-sprint-trigger-label">Sprint</span>
    ${triggerNameHtml}
    ${progressHtml}
    <span class="bl-sprint-trigger-arrow">▾</span>
  </div>`;
}

// abrir dropdown del sprint selector
function _blSprintOpen() {
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
    <button class="bl-sprint-closed-toggle" id="bl-sprint-closed-toggle" onclick="_blSprintToggleClosed()" type="button">
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
    <div class="bl-sprint-overlay" id="bl-sprint-overlay" onclick="_blSprintClose()"></div>
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

// render/update del sprint selector en #bl-sprint-bar
function _renderSprintRoadmap() {
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

// alias legacy — roadmapGoToSprint sigue funcionando igual

// R-202605-130: vista Planificación — layout dos columnas con drag & drop
function _renderPlanningView(listEl, closeCallback) {
  const activeSprint = _getActiveSprint();
  const allSprints   = getActiveSprints();
  // Determinar sprint destino: siguiente abierto no activo, o null si no hay
  const openSprints  = allSprints.filter(s => s.status === 'active');
  // Sprint destino = sprint activo, o null si no hay
  const targetSprint = activeSprint || null;

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

  // Columna derecha: ítems ya en el sprint destino (pendientes)
  const inTarget = targetSprint
    ? ITEMS.filter(i =>
        i.sprint === targetSprint.id &&
        i.status !== 'done' &&
        i.status !== 'descartado' &&
        i.status !== 'historico'
      )
    : [];

  // Calcular effort acumulado en sprint destino
  const targetEffort = inTarget.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);

  // Velocidad promedio — AC-6/AC-7: _calcEstimatedVelocity disponible
  const velocityData  = _calcEstimatedVelocity();
  const velocityAvg   = velocityData ? velocityData.avg : null;
  const isOverloaded  = velocityAvg !== null && targetEffort > velocityAvg * 1.3;
  const pct           = velocityAvg !== null && velocityAvg > 0
    ? Math.min(Math.round((targetEffort / velocityAvg) * 100), 999)
    : null;

  // Barra de esfuerzo acumulado
  const effortBarWidth = velocityAvg
    ? Math.min((targetEffort / (velocityAvg * 1.3)) * 100, 100)
    : 0;

  // Meter HTML
  const meterHtml = velocityAvg !== null ? `
    <div class="bl-plan-meter">
      <div class="bl-plan-meter-bar">
        <div class="bl-plan-meter-fill ${isOverloaded ? 'bl-plan-meter-fill--over' : ''}"
             style="--plan-meter-pct: ${effortBarWidth}%"></div>
        <div class="bl-plan-meter-threshold" title="Velocidad promedio (${velocityAvg} effort)"></div>
      </div>
      <span class="bl-plan-meter-label ${isOverloaded ? 'bl-plan-meter-label--over' : ''}">
        ${targetEffort} / ${velocityAvg} effort${pct !== null ? ` (${pct}%)` : ''}
        ${isOverloaded ? ' · ⚠ Sobrecarga' : ''}
      </span>
    </div>` : `
    <div class="bl-plan-meter">
      <span class="bl-plan-meter-label">Effort acumulado: <strong>${targetEffort}</strong> — sin velocidad histórica</span>
    </div>`;

  // Helper: card compacta de ítem
  function _planCard(item, draggable, col) {
    const type  = itemType(item.code) || '';
    const typeColors = { T: '#2ecc78', R: '#38bdf8', B: '#e85555', P: '#7c6af7' };
    const tc    = typeColors[type] || 'var(--hint)';
    const eff   = parseInt(item.effort) || 1;
    const dots  = Array.from({length: 3}, (_, i) =>
      `<span class="bl-plan-dot${i < eff ? ' on' : ''}"></span>`).join('');
    const prioClass = item.priority === 'high' ? 'bl-plan-prio--high' : item.priority === 'low' ? 'bl-plan-prio--low' : '';
    return `<div class="bl-plan-card${draggable ? ' bl-plan-card--draggable' : ''}"
         draggable="${draggable ? 'true' : 'false'}"
         data-code="${esc(item.code)}"
         data-col="${col}"
         style="--item-type-color:${tc}"
         ondragstart="_planDragStart(event)"
         ondragend="_planDragEnd(event)">
      <div class="bl-plan-card-header">
        <span class="bl-plan-card-type">${type}</span>
        <span class="bl-plan-card-code">${esc(item.code)}</span>
        ${prioClass ? `<span class="bl-plan-card-prio ${prioClass}">${item.priority === 'high' ? '↑' : '↓'}</span>` : ''}
        <span class="bl-plan-dots">${dots}</span>
      </div>
      <div class="bl-plan-card-title">${esc(item.title || '')}</div>
    </div>`;
  }

  // Construir columnas
  const leftCards  = unassigned.map(i => _planCard(i, true, 'left')).join('') ||
    `<div class="bl-plan-empty">Sin ítems sin sprint</div>`;
  const rightCards = inTarget.map(i => _planCard(i, false, 'right')).join('') ||
    `<div class="bl-plan-empty">Sprint vacío — arrastra ítems aquí</div>`;

  const targetLabel = targetSprint ? (targetSprint.label || targetSprint.id) : 'Sin sprint destino';

  listEl.innerHTML = `
    <div class="bl-planning-view" id="bl-planning-view">
      <div class="bl-plan-header">
        <div class="bl-plan-header-title">
          <span class="bl-plan-header-icon">📋</span>
          Planificación
        </div>
        <button class="bl-plan-close-btn" onclick="${closeCallback ? closeCallback : 'toggleBacklogPlanningMode()'}" title="Volver al backlog">✕ Cerrar planificación</button>
      </div>

      <div class="bl-plan-columns">
        <!-- Columna izquierda: sin sprint -->
        <div class="bl-plan-col bl-plan-col--left"
             id="bl-plan-col-left"
             ondragover="_planDragOver(event)"
             ondragleave="_planDragLeave(event)"
             ondrop="_planDrop(event,'left')">
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

        <!-- Columna derecha: sprint destino -->
        <div class="bl-plan-col bl-plan-col--right ${!targetSprint ? 'bl-plan-col--disabled' : ''}"
             id="bl-plan-col-right"
             ondragover="_planDragOver(event)"
             ondragleave="_planDragLeave(event)"
             ondrop="_planDrop(event,'right')">
          <div class="bl-plan-col-header">
            <span class="bl-plan-col-title">${esc(targetLabel)}</span>
            <span class="bl-plan-col-count">${inTarget.length} ítems</span>
          </div>
          ${meterHtml}
          <div class="bl-plan-col-body" id="bl-plan-right-body">
            ${rightCards}
          </div>
        </div>
      </div>

      ${!targetSprint ? '<div class="bl-plan-no-sprint">No hay sprint destino disponible. Crea un sprint para empezar a planificar.</div>' : ''}
    </div>`;
}

// R-202605-130: drag & drop handlers para vista planificación
let _planDragCode = null;

function _planDragStart(e) {
  const card = e.currentTarget;
  _planDragCode = card.dataset.code;
  card.classList.add('bl-plan-card--dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function _planDragEnd(e) {
  e.currentTarget.classList.remove('bl-plan-card--dragging');
  document.querySelectorAll('.bl-plan-col').forEach(c => c.classList.remove('bl-plan-col--over'));
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
  e.preventDefault();
  e.currentTarget.classList.remove('bl-plan-col--over');
  if (!_planDragCode) return;

  const item = ITEMS.find(i => i.code === _planDragCode);
  if (!item) return;

  if (targetCol === 'right') {
    // Asignar al sprint destino
    const activeSprint = _getActiveSprint();
    const targetSprint = activeSprint || null;
    if (!targetSprint) return;
    if (item.sprint === targetSprint.id) return; // ya está asignado
    setItemSprint(item.code, targetSprint.id);
  } else if (targetCol === 'left') {
    // Desasignar del sprint — solo si venía de la derecha (tiene sprint asignado)
    const currentSprint = item.sprint;
    if (!currentSprint || currentSprint === 'icebox') return;
    setItemSprint(item.code, 'icebox');
  }

  // Re-renderizar la vista planificación inmediatamente — renderBacklogList()
  // actualiza el backlog normal pero no este panel; sin este re-render el DOM
  // queda desactualizado y la card parece regresar visualmente.
  if (typeof _renderSprintPlanificar === 'function') {
    _renderSprintPlanificar();
  }
}

// T-202605-118: dirty flag — render quirúrgico
let _backlogListDirty = false;
function _markBacklogListDirty() { _backlogListDirty = true; }
window._markBacklogListDirty = _markBacklogListDirty;

function renderBacklogList(onRendered) {
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
  const q = backlogSearchQuery;

  // R-[tmp:toolbar-backlog-redesign]: botones de vista ya son estáticos en HTML — solo actualizar estado
  (function _updateViewBtns() {
    const treeBtn   = document.getElementById('fbar-tree-btn');
    const focusBtn  = document.getElementById('fbar-focus-btn');
    const kanbanBtn = document.getElementById('fbar-kanban-btn');
    const mikeBtn   = document.getElementById('fbar-mike-btn');

    if (treeBtn) {
      treeBtn.classList.toggle('active', _backlogTreeMode);
      treeBtn.textContent = _backlogTreeMode ? '⊞ Árbol' : '☰ Plano';
      treeBtn.title = _backlogTreeMode ? 'Vista árbol activa — click para vista plana' : 'Vista plana activa — click para vista árbol';
    }
    if (kanbanBtn) {
      kanbanBtn.classList.toggle('active', _backlogKanbanMode);
      kanbanBtn.title = _backlogKanbanMode ? 'Vista Kanban activa — click para desactivar' : 'Vista Kanban — columnas por status';
    }
    if (focusBtn) {
      focusBtn.classList.toggle('active', _backlogFocusMode);
      focusBtn.title = _backlogFocusMode
        ? 'Focus activo — Top 10 por: tipo · sprint · effort · antigüedad · click para desactivar'
        : 'Activar Focus — Top 10 por: tipo · sprint · effort · antigüedad';
      if (!_backlogFocusMode) focusBtn.textContent = '🎯 Focus';
    }
    // Mi vista — visible solo con sprint activo + roles disponibles
    if (mikeBtn) {
      const activeSprint = _getActiveSprint();
      const miRoles = _getMiViewRoles();
      const show = !!(activeSprint && miRoles.length);
      mikeBtn.classList.toggle('is-hidden', !show);
      if (show) {
        mikeBtn.classList.toggle('active', _backlogMikeMode);
        mikeBtn.textContent = _backlogMikeMode ? _getMiViewLabel() : 'Mi vista';
      }
    }
    // Sin AC y bloqueados
    const noAcBtn = document.getElementById('fbar-no-ac-btn');
    if (noAcBtn) noAcBtn.classList.toggle('active', _backlogNoAcMode);
    const blockerBtn = document.getElementById('fbar-blocker-btn');
    if (blockerBtn) blockerBtn.classList.toggle('active', _backlogBlockerFilter);
    // R-[tmp:sprint-group-toggle]: botón agrupación por sprint
    const sprintBtn = document.getElementById('fbar-sprint-btn');
    if (sprintBtn) {
      sprintBtn.classList.toggle('active', _backlogSprintGroupMode);
      sprintBtn.title = _backlogSprintGroupMode ? 'Agrupación por sprint activa — click para vista plana' : 'Vista plana activa — click para agrupar por sprint';
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
          <button class="empty-state-btn" onclick="if(typeof switchTab==='function')switchTab('proyectos')">Ir a Proyectos</button>
        </div>`;
    } else {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">Selecciona un proyecto</div>
          <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
          <button class="empty-state-btn" onclick="openProjPanel()">📁 Seleccionar proyecto</button>
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
        <button class="empty-state-btn" onclick="openProjPanel()">Cambiar proyecto</button>
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
          <button class="empty-state-btn" onclick="if(typeof switchTab==='function')switchTab('tracker')">Ir al Tracker</button>
        </div>`;
    } else {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">Abre un sprint para empezar</div>
          <div class="empty-state-hint">El backlog necesita un sprint activo. Abre uno para organizar y ejecutar tu trabajo.</div>
          <button class="empty-state-btn" onclick="openNewSprintInline()">＋ Abrir sprint</button>
        </div>`;
    }
    _skelHide(listEl);
    return;
  }

  // T-202604-287: desviar a vista Kanban si está activa
  if (_backlogKanbanMode) {
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

  // R-[tmp:toolbar-backlog-redesign]: sprint selector en #bl-sprint-bar (Capa 3)
  (function _ensureSprintRoadmap() {
    _renderSprintRoadmap();
    // B-202604-161: si el Item Detail Panel está abierto, mantener oculto
    if (_itemPanelCode) {
      const el = document.getElementById('bl-sprint-bar');
      if (el) el.classList.add('is-hidden');
    }
  })();

  // Filtrado por tipo + status + effort (T-071)
  // T-202604-048/187: excluir T/B con parentId en modo árbol — en modo plano se muestran todos
  // B-202604-193: excluir ítems históricos del plano activo — van a sección colapsada al fondo
  let filtered = ITEMS.filter(i => {
    if (i.status === 'historico') return false;
    const type = itemType(i.code);
    const typeOk = type ? activeTypes.has(type) : true;
    const statusOk = activeStatuses.has(i.status);
    const _rawEffort = parseInt(i.effort) || 1;
    const _normEffort = _rawEffort > 3 ? 3 : _rawEffort < 1 ? 1 : _rawEffort;
    const effortOk = activeEfforts.has(_normEffort); // T-071 · B-202605-233: effort >3 normalizado a 3
    // T-202604-245: filtro de rol
    let roleOk = true;
    if (activeRoleFilter === '__none__') {
      roleOk = !i.role || !i.role.trim();
    } else if (activeRoleFilter !== null) {
      roleOk = (i.role || '').trim() === activeRoleFilter;
    }
    const isChild = !!i.parentId; // en modo árbol, hijos aparecen bajo su R padre
    // T-202604-357: filtro por prioridad — vacío = todos
    let priorityOk = true;
    if (activePriorityFilter.size > 0) {
      const p = i.priority || 'medium';
      const isHigh = p === 'high' || p === 'important' || p === 'critical' || p === 'importante';
      const isLow  = p === 'low' || p === 'futura' || p === 'baja';
      if (activePriorityFilter.has('high') && isHigh) priorityOk = true;
      else if (activePriorityFilter.has('low') && isLow) priorityOk = true;
      else if (activePriorityFilter.has('medium') && !isHigh && !isLow) priorityOk = true;
      else priorityOk = false;
    }
    return typeOk && statusOk && effortOk && roleOk && priorityOk && (_backlogTreeMode ? !isChild : true);
  });

  // T-202604-363: Sin AC — solo pendientes sin criterios de aceptación
  if (_backlogNoAcMode) {
    filtered = filtered.filter(i => i.status === 'pendiente' && (!i.ac || !i.ac.length));
  }

  // R-[tmp:toolbar-backlog-redesign]: solo bloqueados — pendiente con sprint asignado sin cambio >14 días
  if (_backlogBlockerFilter) {
    filtered = filtered.filter(i => _isBlocked(i));
  }

  // T-202605-449: filtro por dependencias explícitas bloqueantes
  if (_depsFilter === 1) {
    filtered = filtered.filter(i => _hasDepsBlocked(i));
  } else if (_depsFilter === 2) {
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
  if (_backlogFocusMode) {
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
  if (_backlogMikeMode) {
    const _activeSprint = _getActiveSprint();
    if (_activeSprint) {
      const _miRoles = _getMiViewRoles();
      const _miRole = _miRoles[_miViewRoleIndex % _miRoles.length] || null;
      filtered = filtered.filter(i =>
        itemType(i.code) === 'T' &&
        i.status === 'pendiente' &&
        i.sprint === _activeSprint.id &&
        (!_miRole || (i.role || '').trim() === _miRole)
      );
    }
  }

  // T-202604-065: sort dentro de cada grupo — T-072: respeta backlogSortDir
  const _priOrder = { high: 0, important: 0, critical: 0, importante: 0, medium: 1, low: 2, futura: 2, baja: 2 };
  const _typeOrder = { B: 0, T: 1, R: 2, I: 3 };
  const _dir = backlogSortDir === 'desc' ? -1 : 1;

  // T-202604-424: sort interno dentro de cada grupo de sprint — priority desc → effort asc
  // B-[pendiente-ID]: aplicar _dir para respetar backlogSortDir — el botón ↑↓ ahora funciona en modo sprint group
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
      if (backlogSortMode === 'priority') {
        const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
        cmp = pa !== pb ? pa - pb : a.code.localeCompare(b.code);
      } else if (backlogSortMode === 'effort') {
        const ea = parseInt(a.effort) || 1, eb = parseInt(b.effort) || 1;
        cmp = ea !== eb ? eb - ea : a.code.localeCompare(b.code);
      } else if (backlogSortMode === 'type') {
        const ta = _typeOrder[itemType(a.code)] ?? 9, tb = _typeOrder[itemType(b.code)] ?? 9;
        cmp = ta !== tb ? ta - tb : a.code.localeCompare(b.code);
      } else if (backlogSortMode === 'completedAt') {
        // Ítems sin doneAt van al final (independiente de dir)
        const ha = a.doneAt != null, hb = b.doneAt != null;
        if (ha !== hb) return ha ? -1 : 1; // los que tienen fecha primero
        cmp = ha && hb ? (a.doneAt - b.doneAt) : a.code.localeCompare(b.code);
      } else if (backlogSortMode === 'createdAt') {
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
  const doneItems      = activeStatuses.has('done')
    ? ITEMS.filter(i => i.status === 'done' && _isCountableItem(i) && _matchesQuery(i))
    : [];
  const descartadoItems = activeStatuses.has('descartado')
    ? ITEMS.filter(i => i.status === 'descartado' && _matchesQuery(i))
    : [];

  let html = '';

  // B-202605-206: agrupación por sprint es el comportamiento por defecto.
  // T-202604-424 eliminó 'sprint' como opción del selector de sort, pero la condición de entrada
  // quedó atada a backlogSortMode === 'sprint' — inalcanzable. Fix: agrupar siempre que no haya
  // un modo exclusivo activo que tome control del rendering (kanban, focus, mike, noAc).
  const _useSprintGroups = _backlogSprintGroupMode && !_backlogKanbanMode && !_backlogFocusMode && !_backlogMikeMode && !_backlogNoAcMode;

  if (_useSprintGroups) {
    // ── Modo Sprint: agrupar pendientes por sprint ──
    const sprintMap = {};
    pendienteItems.forEach(i => {
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
        <div onclick="toggleVersionCollapse('${groupId}')" class="version-collapse-trigger">
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
      const isCollapsed = collapsedVersions.has(groupId);
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
        <div onclick="toggleVersionCollapse('${groupId}')" class="version-collapse-trigger">
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

  } else {
    // ── Modo plano: lista sin grupos de sprint ──

    // R-202604-051: sección Bloqueantes activos — sobre En curso y Pendientes
    const blockingItems = pendienteItems.filter(i => i.blocking);
    if (blockingItems.length && activeStatuses.has('pendiente')) {
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
  if (ideaItems.length && activeTypes.has('P')) {
    const ideasOpen = localStorage.getItem('backlog-ideas-open') === '1';
    html += `<div class="section-group sg-ideas" id="sg-ideas">
      <div class="section-group-header" onclick="toggleSectionGroup('ideas')">
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
      <div class="section-group-header" onclick="toggleSectionGroup('done')">
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
  if (descartadoItems.length && activeStatuses.has('descartado')) {
    const discOpen = localStorage.getItem('backlog-discarded-open') === '1';
    html += `<div class="section-group sg-discarded" id="sg-discarded">
      <div class="section-group-header" onclick="toggleSectionGroup('discarded')">
        <span class="section-group-arrow" id="sgarrow-discarded">${discOpen ? '▾' : '▸'}</span>
        <span>Descartados</span>
        <span class="section-group-count">${descartadoItems.length} ítem${descartadoItems.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="section-group-body items-grid${discOpen ? '' : ' collapsed'}" id="sgbody-discarded">`;
    descartadoItems.forEach(item => { html += buildBacklogItem(item); });
    html += `</div></div>`;
  }

  // B-202604-NNN: evaluar empty state sobre pendientes+done+descartados — no solo filtered (pendientes)
  const _hasVisible = pendienteItems.length || ideaItems.length || doneItems.length || (descartadoItems.length && activeStatuses.has('descartado'));
  if (!_hasVisible) {
    // T-202604-319: empty state contextual según causa
    const _activeSprint = _getActiveSprint();
    const _hasTypeFilter  = activeTypes.size < 4;
    const _hasRoleFilter  = activeRoleFilter !== null;
    const _hasStatusFilter = !(activeStatuses.has('pendiente') && activeStatuses.size === 1);
    const _hasEffortFilter = activeEfforts.size < 3;
    const _hasAnyFilter = q || _hasTypeFilter || _hasRoleFilter || _hasStatusFilter || _hasEffortFilter || _backlogFocusMode || _backlogMikeMode;

    let emptyIcon = '🔍', emptyTitle = '', emptyHint = '', emptyCTA = '';

    if (q) {
      emptyTitle = `Sin resultados para "${esc(q)}"`;
      emptyHint  = 'Prueba con otro término o limpia la búsqueda.';
      emptyCTA   = `<button class="empty-state-btn" onclick="clearBacklogSearch()">✕ Limpiar búsqueda</button>`;
    } else if (_backlogMikeMode && _activeSprint) {
      const _miRoles = _getMiViewRoles();
      const _miRole = _miRoles[_miViewRoleIndex % _miRoles.length] || 'este rol';
      emptyIcon  = '⚡';
      emptyTitle = `Sin T's pendientes para ${_miRole} en ${_activeSprint.label || _activeSprint.id}`;
      emptyHint  = 'No hay tickets pendientes asignados a este rol en el sprint activo. Rota al siguiente rol o desactiva Mi vista.';
      emptyCTA   = `<button class="empty-state-btn" onclick="toggleBacklogMikeMode()">↻ Rotar rol / desactivar</button>`;
    } else if (_backlogFocusMode) {
      emptyIcon  = '🎯';
      emptyTitle = 'Sin ítems en Focus';
      emptyHint  = 'No hay ítems pendientes con los filtros actuales.';
      emptyCTA   = `<button class="empty-state-btn" onclick="toggleBacklogFocusMode()">✕ Desactivar Focus</button>`;
    } else if (backlogSortMode === 'sprint' && _activeSprint) {
      emptyIcon  = '📅';
      emptyTitle = `Sin ítems en ${_activeSprint.label || _activeSprint.id}`;
      emptyHint  = 'El sprint activo no tiene ítems con los filtros actuales. Asigna ítems desde el editor o cambia el sprint.';
      emptyCTA   = `<button class="empty-state-btn" onclick="setFilter('all')">Ver todos los ítems</button>`;
    } else if (_hasAnyFilter) {
      emptyTitle = 'Sin ítems con estos filtros';
      emptyHint  = 'Los filtros activos no coinciden con ningún ítem. Limpia los filtros para ver el backlog completo.';
      emptyCTA   = `<button class="empty-state-btn" onclick="document.getElementById('filter-clear-btn').click()">✕ Limpiar filtros</button>`;
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
  _updateDocLogCount('backlog');

  // T-202604-362: placeholder del buscador refleja scope activo
  (function _updateSearchPlaceholder() {
    const inp = document.getElementById('backlog-search-input');
    if (!inp) return;
    const parts = [];
    const activeSprint = _getActiveSprint();
    const sprintFiltered = backlogSortMode === 'sprint' && activeSprint && !activeStatuses.has('done') && !activeStatuses.has('descartado');
    if (sprintFiltered) parts.push(activeSprint.label || activeSprint.id);
    if (activeTypes.size < 4) parts.push([...activeTypes].join('/'));
    if (activePriorityFilter.size > 0) parts.push('pri:' + [...activePriorityFilter].join('/'));
    const scopeCount = (pendienteItems.length + doneItems.length + (descartadoItems.length && activeStatuses.has('descartado') ? descartadoItems.length : 0));
    if (parts.length) {
      inp.placeholder = '🔍 Buscando en ' + parts.join(' · ') + ' · ' + scopeCount + ' ítem' + (scopeCount !== 1 ? 's' : '');
    } else {
      inp.placeholder = '🔍 Buscar…';
    }
  })();

  if (typeof onRendered === 'function') onRendered();
}

