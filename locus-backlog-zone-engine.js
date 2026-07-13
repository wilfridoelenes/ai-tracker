// [PP] mod:3 · autor:Rune · 2026-07-12 UTC-6
// TKT-202607-011 (TKT3 REQ-202607-006): chips de área en stats-bar — exclusivo de qdisc vía
//   opts.showAreaChips. Conteo sobre activeZoneItems (mismo universo que chips de tipo/prioridad
//   ya existentes). Top 6 por conteo descendente + chip estático "+N más" cuando hay más de 6
//   áreas distintas — el chip "+N más" no cuenta ni filtra, es puramente informativo (AC-3).
//   "Sin área" (DISC sin campo area o vacío) es un chip propio, siempre al final, fuera del
//   límite de 6 — no compite por el top-6 con las áreas nombradas (supuesto: la Fase 1 no
//   distingue si "Sin área" cuenta contra el límite; se declara aquí como comportamiento
//   asumido, ver CHECKPOINT). Filtro single-select vía _nsToggleArea/_nsGetArea (core.js) —
//   distinto de los chips de tipo/prioridad, que son multi-toggle.
// locus-backlog-zone-engine.js
// Responsabilidad: _renderZonePanel — motor genérico de renderizado para paneles de zona
//   persistente (Q-Backlog, Q-DISC — no Q-INC, que tiene su propio render en
//   locus-backlog-render.js por schema/agrupación distintos). Incluye el bloque estático
//   "Terminados" (_renderDoneGroup/_attachDoneGroupToggle) y el umbral de staleness por tipo
//   (_zoneStaleness). No conoce 'qbacklog' ni 'qdisc' como conceptos propios — opera 100% sobre
//   los parámetros de `opts` que cada zona concreta le pasa (ver locus-backlog-qbacklog.js /
//   locus-backlog-qdisc.js).
// Dependencias: locus-backlog-core.js · locus-backlog-hierarchy.js · locus-backlog-item.js ·
//   locus-storage.js
//
// REQ refactor-zonas TKT2: extraído de locus-backlog-render.js (mod:72) sin cambio de contrato
// público — _renderZonePanel recibe los mismos `opts`, misma firma. Dos cambios de detalle:
// (1) la delegación de click de la stats-bar (zp-type/zp-priority) ya no detecta la zona activa
//     inspeccionando el id del DOM ni importa renderQBacklogPanel/renderQDiscPanel para
//     re-renderizar (habría creado import circular con los módulos de zona, que ahora importan
//     _renderZonePanel desde aquí) — usa nsKey/opts ya disponibles por closure y se re-invoca a
//     sí misma. Mismo resultado observable.
// (2) inline_fix (triggered_by: TKT2 de este REQ): _renderDoneGroup llamaba a _sortGroup(), una
//     función anidada dentro de renderBacklogList() en locus-backlog-render.js — fuera de scope
//     para cualquier caller top-level. _renderDoneGroup vivía a nivel de módulo, no dentro de
//     renderBacklogList — la referencia era un ReferenceError en tiempo de ejecución, no un typo
//     de import. No se manifestó todavía porque Q-Backlog no tiene ningún ítem en status 'done'
//     en el backlog actual (v1.0.1: Done=0) — el bloque Terminados de qbacklog nunca ejecutó esa
//     línea con doneItems.length > 0. Fix: sort local equivalente (priority asc → effort asc,
//     respeta _getBacklogSortDir()) — misma lógica que _sortGroup, sin depender de su closure.

import { itemKind, getItems, _nsGetTypes, _nsGetStatuses, _nsGetPriority, _nsGetQuery, _nsToggleType, _nsTogglePriority, _nsGetArea, _nsToggleArea, _getBacklogSortDir } from './locus-backlog-core.js'; // TKT-202607-011: _nsGetArea/_nsToggleArea agregados
import { _attachBacklogListDelegation, _resetBacklogListDelegation, buildBacklogItem } from './locus-backlog-item.js';
import { _getActiveProjectFilter } from './locus-storage.js';
import { _buildChildMap } from './locus-backlog-hierarchy.js';

// T-202606-163 / TKT-C1: _zoneStaleness (antes _iceboxStaleness) — umbral de alerta por tipo de
// ítem en vista Q-Backlog/Q-DISC. Umbrales: REQ/TKT → 14d · DISC → 30d · INC priority:high → 7d ·
// resto → sin alerta. Referencia: statusChangedAt || createdAt. Retorna { days, label } o null.
export function _zoneStaleness(item) {
  if (!item) return null;
  const type = itemKind(item);
  const priority = (item.priority || '').toLowerCase();
  let threshold;
  if (type === 'REQ' || type === 'TKT') threshold = 14;
  else if (type === 'DISC') threshold = 30;
  else if (type === 'INC' && priority === 'high') threshold = 7;
  else return null;
  const refTs = item.statusChangedAt || item.createdAt;
  if (!refTs) return null;
  const days = Math.floor((Date.now() - refTs) / 86400000);
  if (days < threshold) return null;
  const label = days === 1 ? '1d' : days + 'd';
  return { days, label };
}

// inline_fix (triggered_by TKT2 REQ refactor-zonas): sort local — mismo criterio que _sortGroup
// (locus-backlog-render.js, priority asc → effort asc, respeta _getBacklogSortDir()) sin
// depender de su closure. Ver header del módulo para el detalle del bug corregido.
function _sortDoneItems(arr) {
  const _priOrder = { high: 0, important: 0, critical: 0, importante: 0, medium: 1, low: 2, futura: 2, baja: 2 };
  const _dir = _getBacklogSortDir() === 'desc' ? -1 : 1;
  return [...arr].sort((a, b) => {
    const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
    if (pa !== pb) return (pa - pb) * _dir;
    const ea = parseInt(a.effort) || 1, eb = parseInt(b.effort) || 1;
    return (ea - eb) * _dir;
  });
}

// Helper compartido — rellena el bloque estático "Terminados" (.bl-done-*, ver index.html) con
// los ítems done del zone correspondiente. El contenedor existe siempre en el DOM (HTML
// estático) — esta función solo escribe conteo y filas, nunca crea ni destruye el shell.
function _renderDoneGroup(prefix, doneItems) {
  const countEl = document.getElementById(`${prefix}-done-count`);
  const bodyEl  = document.getElementById(`${prefix}-done-body`);
  if (countEl) countEl.textContent = String(doneItems.length);
  if (!bodyEl) return;
  bodyEl.innerHTML = doneItems.length
    ? _sortDoneItems(doneItems).map(item => buildBacklogItem(item)).join('')
    : '';
}

// Toggle de colapso del bloque "Terminados" — header y body son estáticos (index.html), el
// listener se adjunta una sola vez al cargar el módulo, no en cada render. Solo lo usa la zona
// que declara hasDoneState:true (hoy: qbacklog — ver locus-backlog-qbacklog.js). Sin
// #[prefix]-done-header/body en el DOM, retorna en el guard temprano sin operar.
export function _attachDoneGroupToggle(prefix) {
  const header = document.getElementById(`${prefix}-done-header`);
  const body   = document.getElementById(`${prefix}-done-body`);
  const arrow  = header && header.querySelector('.bl-done-arrow');
  if (!header || !body) return;
  const key = `backlog-${prefix}-done-open`;
  const isOpen = localStorage.getItem(key) !== '0';
  body.classList.toggle('collapsed', !isOpen);
  if (arrow) arrow.textContent = isOpen ? '▾' : '▸';
  header.addEventListener('click', () => {
    const wasCollapsed = body.classList.contains('collapsed');
    body.classList.toggle('collapsed', !wasCollapsed);
    if (arrow) arrow.textContent = wasCollapsed ? '▾' : '▸';
    localStorage.setItem(key, wasCollapsed ? '1' : '0');
  });
}

// TKT-C1 (REQ-C): motor común de renderIceboxPanel/renderQBacklogPanel/renderQDiscPanel —
// filtros por namespace propio ('qbacklog'/'qdisc' hoy, cualquier zona futura mañana), jerarquía
// R→hijos vía _buildChildMap, bloque Terminados estático.
export function _renderZonePanel(opts) {
  const { bodyId, badgeId, nsKey, isZone, emptyTitle, emptyIcon } = opts;
  // TKT1 REQ hide-done-qdisc: hasDoneState/hasChildren — default true preserva comportamiento
  // exacto de qbacklog (único caller previo a ese TKT). qdisc los declara en false: DISC nunca
  // alcanza status 'done' (__BR-Ecosystem §5) ni tiene jerarquía R→hijos (no aplica
  // _buildChildMap).
  const hasDoneState = opts.hasDoneState !== false;
  const hasChildren  = opts.hasChildren !== false;
  const _emptyIcon = emptyIcon || '📦';
  const body = document.getElementById(bodyId);
  if (!body) return;

  // INC-[pendiente-ID]: sin esta línea, el header de la card (data-action="item-expand") y el
  // resto de acciones delegadas (copiar código/ítem, doble-click editar título, quick-assign
  // effort, cambiar status/rol/sprint/parent, abrir bloqueante, promover) no tienen listener en
  // qbacklog-panel-body/qdisc-panel-body — buildBacklogItem() genera el mismo markup que Vista
  // Lista pero solo #backlog-list tenía la delegación adjunta. Mismo patrón que
  // renderBacklogList() (locus-backlog-render.js) — reset antes de re-adjuntar en cada render.
  _resetBacklogListDelegation(bodyId);
  _attachBacklogListDelegation(bodyId);

  // Bloque Terminados estático (.bl-done-group, ver index.html) — oculto vía .is-hidden cuando
  // hasDoneState:false, sin dejar espacio ni borde residual. qbacklog remueve is-hidden
  // explícitamente — no depende de que el DOM nazca sin la clase. Zonas sin bloque en el DOM
  // (ej. qdisc, ver REQ congruencia-qdisc) resuelven doneGroupEl:null — no-op vía el guard.
  const doneGroupEl = document.getElementById(`${nsKey}-done-group`);
  if (doneGroupEl) doneGroupEl.classList.toggle('is-hidden', !hasDoneState);

  if (!_getActiveProjectFilter()) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Selecciona un proyecto</div>
        <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
      </div>`;
    const badge = document.getElementById(badgeId);
    if (badge) badge.textContent = '';
    if (hasDoneState) _renderDoneGroup(nsKey, []);
    return;
  }

  const zoneItems = getItems().filter(isZone);

  // Badge — universo SIN filtrar (conteo real de la zona), igual que B-202606-075.
  const badge = document.getElementById(badgeId);
  if (badge) {
    if (!zoneItems.length) {
      badge.textContent = '';
    } else {
      const _alertCount = zoneItems.filter(i => _zoneStaleness(i) !== null).length;
      badge.textContent = (_alertCount > 0 ? '⚠ ' : '') + zoneItems.length;
    }
  }

  // AC-4 REQ-C: bloque Terminados siempre actualizado, incluso sin ítems activos.
  // TKT1 REQ hide-done-qdisc: con hasDoneState:false no hay split — todo zoneItems es activo
  // (DISC nunca tiene status 'done') y _renderDoneGroup no se invoca — el bloque ya quedó oculto
  // vía .is-hidden más arriba (o ni existe en el DOM, ver REQ congruencia-qdisc).
  const doneZoneItems   = hasDoneState ? zoneItems.filter(i => i.status === 'done') : [];
  const activeZoneItems = hasDoneState ? zoneItems.filter(i => i.status !== 'done') : zoneItems;
  if (hasDoneState) _renderDoneGroup(nsKey, doneZoneItems);

  if (!activeZoneItems.length) {
    // Mejora visual DISC (aprobada por founder): opts.emptyHint es opcional, sin default —
    // qbacklog no lo declara (ver locus-backlog-qbacklog.js), su empty-state no cambia.
    const _emptyHintHtml = opts.emptyHint
      ? `<div class="empty-state-hint">${opts.emptyHint}</div>`
      : '';
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${_emptyIcon}</div>
        <div class="empty-state-title">${emptyTitle}</div>
        ${_emptyHintHtml}
      </div>`;
    return;
  }

  // TKT3 REQ2 S'02 — stats-bar interactiva: conteo sobre activeZoneItems (universo sin filtrar
  // por tipo/prioridad/búsqueda), mismo criterio que renderQIncPanel (_displayable) — evita que
  // un chip desactivado muestre conteo 0 en vez del total real de la zona.
  const _activeTypesZ0    = _nsGetTypes(nsKey);
  const _activePriorityZ0 = _nsGetPriority(nsKey);
  const _countByTypeZ = {};
  const _countByPriZ  = { high: 0, medium: 0, low: 0 };
  activeZoneItems.forEach(i => {
    const t = itemKind(i);
    if (t) _countByTypeZ[t] = (_countByTypeZ[t] || 0) + 1;
    const p = i.priority;
    if (p === 'high' || p === 'important' || p === 'critical' || p === 'importante') _countByPriZ.high++;
    else if (p === 'low' || p === 'futura' || p === 'baja') _countByPriZ.low++;
    else _countByPriZ.medium++;
  });
  const _typeChipDefs = { qbacklog: [['REQ','REQ'],['TKT','TKT']], qdisc: [] }[nsKey] || [];

  // TKT-202607-011 (TKT3 REQ-202607-006): chips de área — exclusivo de qdisc (opts.showAreaChips).
  // "Sin área" es un bucket propio (sentinel '__sin_area__'), no compite por el top-6 con áreas
  // nombradas — siempre al final del listado (AC-4). Top 6 por conteo desc + "+N más" estático
  // cuando hay más de 6 áreas nombradas distintas (AC-3) — "+N más" no cuenta hacia "Sin área".
  const _SIN_AREA = '__sin_area__';
  let _areaChipsHtml = '';
  if (opts.showAreaChips) {
    const _activeAreaZ0 = _nsGetArea(nsKey);
    const _countByAreaZ = {};
    let _sinAreaCount = 0;
    activeZoneItems.forEach(i => {
      const a = (i.area || '').trim();
      if (!a) { _sinAreaCount++; return; }
      _countByAreaZ[a] = (_countByAreaZ[a] || 0) + 1;
    });
    const _namedAreasSorted = Object.entries(_countByAreaZ).sort((a, b) => b[1] - a[1]);
    const _AREA_CHIP_LIMIT = 6;
    const _visibleAreas = _namedAreasSorted.slice(0, _AREA_CHIP_LIMIT);
    const _overflowCount = _namedAreasSorted.length - _visibleAreas.length;
    const _areaChipBtns = _visibleAreas.map(([area, count]) =>
      `<button class="stat-area-chip${_activeAreaZ0 === area ? ' active' : ''}" data-zp-action="zp-area" data-zp-area="${area.replace(/"/g, '&quot;')}" title="Filtrar por área ${area.replace(/"/g, '&quot;')}"><span class="sac-n">${count}</span><span class="sac-label">${area}</span></button>`
    ).join('');
    const _overflowChip = _overflowCount > 0
      ? `<span class="stat-area-chip stat-area-chip--static" title="${_overflowCount} área${_overflowCount === 1 ? '' : 's'} adicional${_overflowCount === 1 ? '' : 'es'} sin chip propio">+${_overflowCount} más</span>`
      : '';
    const _sinAreaChip = _sinAreaCount > 0
      ? `<button class="stat-area-chip stat-area-chip--none${_activeAreaZ0 === _SIN_AREA ? ' active' : ''}" data-zp-action="zp-area" data-zp-area="${_SIN_AREA}" title="Filtrar ítems sin área declarada"><span class="sac-n">${_sinAreaCount}</span><span class="sac-label">Sin área</span></button>`
      : '';
    _areaChipsHtml = (_areaChipBtns || _overflowChip || _sinAreaChip)
      ? `<div class="qdisc-area-chips">${_areaChipBtns}${_overflowChip}${_sinAreaChip}</div>`
      : '';
  }

  const _statsBarHtml = `
    <div class="qinc-stats-bar" id="${bodyId}-stats-bar">
      ${opts.showTypeChips !== false && _typeChipDefs.length ? `<div class="qinc-stats-types">
        ${_typeChipDefs.map(([t, label]) =>
          `<button class="stat-type-chip tc-${t.toLowerCase()}${_activeTypesZ0.has(t) ? ' active' : ''}" data-zp-action="zp-type" data-zp-type="${t}" title="Filtrar por tipo ${t}"><span class="tc-count">${_countByTypeZ[t] || 0}</span><span class="tc-label">${label}</span></button>`
        ).join('')}
      </div>` : ''}
      <div class="qinc-stats-priority">
        <button class="stat-pri-chip pri-high${_activePriorityZ0.has('high') ? ' active' : ''}" data-zp-action="zp-priority" data-zp-priority="high" title="Filtrar prioridad alta"><span class="spc-n">${_countByPriZ.high}</span> Alto</button>
        <button class="stat-pri-chip pri-medium${_activePriorityZ0.has('medium') ? ' active' : ''}" data-zp-action="zp-priority" data-zp-priority="medium" title="Filtrar prioridad media"><span class="spc-n">${_countByPriZ.medium}</span> Med</button>
        <button class="stat-pri-chip pri-low${_activePriorityZ0.has('low') ? ' active' : ''}" data-zp-action="zp-priority" data-zp-priority="low" title="Filtrar prioridad baja"><span class="spc-n">${_countByPriZ.low}</span> Bajo</button>
      </div>
      ${_areaChipsHtml}
    </div>`;
  if (!body._zpDelegationAttached) {
    body._zpDelegationAttached = true;
    // REQ refactor-zonas TKT2: nsKey/opts ya identifican la zona por closure — sin necesidad de
    // inspeccionar el id del DOM ni de importar renderQBacklogPanel/renderQDiscPanel (habría
    // creado import circular con los módulos de zona concretos, que son quienes importan
    // _renderZonePanel desde aquí). Re-render = re-invocar _renderZonePanel con el mismo opts.
    body.addEventListener('click', function _zpStatsClick(e) {
      const btn = e.target.closest('[data-zp-action]');
      if (!btn) return;
      if (btn.dataset.zpAction === 'zp-type') {
        _nsToggleType(nsKey, btn.dataset.zpType);
      } else if (btn.dataset.zpAction === 'zp-priority') {
        _nsTogglePriority(nsKey, btn.dataset.zpPriority);
      } else if (btn.dataset.zpAction === 'zp-area') {
        // TKT-202607-011: el chip "+N más" no lleva data-zp-action (es <span>, no <button>,
        // sin data-zp-area) — closest('[data-zp-action]') nunca lo matchea, AC-3 cumplido sin
        // guard adicional.
        _nsToggleArea(nsKey, btn.dataset.zpArea);
      } else {
        return;
      }
      _renderZonePanel(opts);
    });
  }

  // Filtros leídos desde namespace propio — aislado del state global de Backlog y del otro panel.
  const _activeTypesZ    = _nsGetTypes(nsKey);
  const _activeStatusesZ = _nsGetStatuses(nsKey);
  const _activePriorityZ = _nsGetPriority(nsKey);
  const _qZ = (_nsGetQuery(nsKey) || '').trim().toLowerCase();
  const _matchesSearchZ = _qZ
    ? i => i.code.toLowerCase().includes(_qZ) || (i.title || '').toLowerCase().includes(_qZ) || (i.area || '').toLowerCase().includes(_qZ)
    : () => true;
  // TKT-202607-011: filtro de área — solo activo cuando opts.showAreaChips (hoy: qdisc). Sin
  // filtro de área activo (_activeAreaZ === null), areaOk siempre true — sin regresión en
  // qbacklog/qinc, que nunca activan _nsToggleArea.
  const _activeAreaZ = opts.showAreaChips ? _nsGetArea(nsKey) : null;
  const filteredItems = activeZoneItems.filter(i => {
    const type = itemKind(i);
    const typeOk = type ? _activeTypesZ.has(type) : true;
    const statusOk = _activeStatusesZ.has(i.status);
    const priorityOk = _activePriorityZ.size === 0 || _activePriorityZ.has(i.priority);
    const areaOk = !_activeAreaZ ? true : (_activeAreaZ === _SIN_AREA ? !(i.area || '').trim() : (i.area || '').trim() === _activeAreaZ);
    return typeOk && statusOk && priorityOk && areaOk && _matchesSearchZ(i);
  });

  if (!filteredItems.length) {
    body.innerHTML = _statsBarHtml + `
      <div class="empty-state">
        <div class="empty-state-icon">${_emptyIcon}</div>
        <div class="empty-state-title">${emptyTitle}</div>
        <div class="empty-state-hint">Ningún ítem coincide con el filtro activo.</div>
      </div>`;
    return;
  }

  // Ordenar: tipo (REQ→TKT→INC→DISC) y dentro de cada tipo por prioridad (high→medium→low)
  const _typeOrder = { REQ: 0, TKT: 1, INC: 2, DISC: 3 };
  const _priOrder  = { high: 0, important: 0, critical: 0, importante: 0, medium: 1, low: 2, futura: 2, baja: 2 };
  const sorted = [...filteredItems].sort((a, b) => {
    const ta = _typeOrder[itemKind(a)] ?? 9, tb = _typeOrder[itemKind(b)] ?? 9;
    if (ta !== tb) return ta - tb;
    const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
    return pa - pb;
  });

  // TKT1 REQ hide-done-qdisc: con hasChildren:false se omite _buildChildMap — DISC no tiene
  // depends_on ni jerarquía R→hijos, todo ítem filtrado es raíz.
  const _childMap  = hasChildren ? _buildChildMap(filteredItems) : new Map();
  const _rCodes    = hasChildren ? new Set(filteredItems.filter(i => itemKind(i) === 'REQ').map(i => i.code)) : new Set();
  const _rootItems = hasChildren ? sorted.filter(i => !i.parentId || !_rCodes.has(i.parentId)) : sorted;

  let html = '<div class="items-grid">';
  _rootItems.forEach(item => {
    const _stale = _zoneStaleness(item);
    const _stalePill = _stale
      ? `<div class="bl-done-item-alert"><span class="staleness-pill staleness--stale" title="Sin movimiento — ${_stale.days}d">${_stale.label}</span></div>`
      : '';
    html += _stalePill + buildBacklogItem(item);
    const _children = _childMap.get(item.code) || [];
    if (_children.length) {
      // TKT-C1: wrapper renombrado .bl-vl-req-children→.bl-vl-req-body
      html += '<div class="bl-vl-req-body">';
      _children.forEach(child => { html += buildBacklogItem(child); });
      html += '</div>';
    }
  });
  html += '</div>';

  body.innerHTML = _statsBarHtml + html;
}
