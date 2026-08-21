// [PP] mod:15 · autor:Rune · 2026-08-20 21:40 UTC-6
// TKT-202608-431 (REQ-202608-174 · Q-DISC): chips de filtro de área en Promoted/Descartadas —
// mismo componente visual .stat-area-chip/.qdisc-area-chips que ya usa Discovery
// (locus-backlog-zone-engine.js), sin clase ni token CSS nuevo (AC de coherencia del REQ padre).
// No reutiliza el mecanismo _nsGetArea/_nsToggleArea de locus-backlog-core.js — ese namespace
// es fijo a 'qbacklog'|'qdisc'|'qinc' (single-select por subtab, no por bloque de status dentro
// de qdisc) y _nsGetArea('qdisc') sigue siendo exclusivo del bloque Discovery, fuera de scope de
// este TKT ("No toca Discovery"). Estado propio, local a este módulo: _qdiscBlockAreaFilter,
// single-select por bloque (mismo comportamiento de toggle que _nsToggleArea — click en la
// misma área limpia, click en otra reemplaza), sin persistir en storage ni en namespace
// compartido. contract_update: no — no se modifica ningún export ni firma existente; la
// función nueva (_qdiscAreaChipsHtml) y el estado (_qdiscBlockAreaFilter) son internos, sin
// caller fuera de este archivo.
// [PP] mod:14 · autor:Rune · 2026-08-11 UTC-6
// TKT3 (REQ-202607-alineacion-qbacklog-qdisc, design_intent: alineacion-render-qbacklog-qdisc):
// renderQDiscPanel pasa statsBarId:'qdisc-filter-bar' — la stats-bar interactiva (prioridad+
// área) sale de #qdisc-panel-body (dentro del bloque colapsable Discovery) y pasa a un nodo
// propio del header, mismo mecanismo que ya usa qbacklog (statsBarId, ver
// locus-backlog-zone-engine.js). No reutiliza #qdisc-stats-bar — ese nodo lo rellena
// _renderQDiscStatsBlock() por ID con los totales estáticos; pasar ese mismo ID como statsBarId
// habría hecho que _renderZonePanel sobreescribiera su innerHTML en cada render de Q-DISC,
// perdiendo los 4 conteos estáticos. #qdisc-filter-bar es un nodo hermano nuevo (index.html)
// exclusivo para este propósito. contract_update: no — mismo shape de opts que ya acepta
// _renderZonePanel, sin cambio de firma.
// [PP] mod:12 · autor:Rune · 2026-07-27 20:35 UTC-6
// Housekeeping (Excepción de resolución directa — dueño presente, nivel Patch, sin
// bifurcación): eliminada línea muerta querySelectorAll('.tpl-nav-btn') — clase sin
// referencias en el DOM desde la limpieza de locus-proyectos.css (REQ CAEL-01). No-op sin
// cambio de comportamiento — el toggle de .active real de este botón lo hace switchSubTab()
// (locus-ui-shell.js), que dispara en el mismo click vía listener delegado independiente.
// [PP] mod:8 · autor:Rune · 2026-07-12 UTC-6
// locus-backlog-qdisc.js
// Responsabilidad: renderQDiscPanel — render del sub-tab Q-DISC (Discoveries: DISC, único tipo
//   aceptado — __BR-Ecosystem §5) — + su listener de sub-tab y su re-render reactivo sobre
//   shell:backlog-render-dirty. No conoce Q-Backlog ni Q-INC.
// Dependencias: locus-backlog-core.js · locus-backlog-zone-engine.js
//
// REQ refactor-zonas TKT4: extraído de locus-backlog-render.js (mod:72) sin cambio de
// comportamiento observable. Sin bloque "Terminados": DISC nunca alcanza status 'done'
// (ver REQ congruencia-qdisc previo — hasDoneState/hasChildren:false, sin _attachDoneGroupToggle
// ('qdisc') llamado nunca desde este módulo).
//
// TKT-202607-012 (TKT4 REQ-202607-006): #qdisc-done-group era shell HTML muerto en index.html
// (sin JS que lo poblara desde este módulo) — eliminado. _renderZonePanel (zone-engine.js) sigue
// resolviendo `${nsKey}-done-group` a null para 'qdisc' sin romperse — guard ya existente, sin
// cambio de firma ni de comportamiento en el motor compartido.
//
// TKT-202607-011 (TKT3 REQ-202607-006): renderQDiscPanel pasa showAreaChips:true a
//   _renderZonePanel — único caller que lo activa (qbacklog no lo declara, default false).
// TKT-202607-013 (TKT5 REQ-202607-006): _renderQDiscGroomingBanner — banner de grooming
//   pendiente, mismo patrón de shell estático que _renderQDiscLimitIndicator (rellena/vacía un
//   nodo que ya existe en index.html, nunca lo crea ni destruye).

import { _isQDiscActive, _isQDisc, getItems, QDISC_ACTIVE_LIMIT, _nsGetQuery, _nsSetQuery } from './locus-backlog-core.js';
import { _renderZonePanel, _zoneStaleness } from './locus-backlog-zone-engine.js';
// TKT2 (REQ CAEL-01): buildBacklogItem + delegation reusados directamente — mismo import que
// zone-engine.js usa internamente para el bloque Discovery. Promoted/Descartadas no pasan por
// _renderZonePanel (sin chips, fuera de scope de este REQ) — necesitan su propia delegación de
// clicks por contenedor.
import { _attachBacklogListDelegation, _resetBacklogListDelegation, buildBacklogItem } from './locus-backlog-item.js';

// TKT-202607-010: rellena #qdisc-limit-indicator (shell estático, ver index.html) con el
// conteo de DISCs activos sobre el límite — mismo universo que _isQDiscActive (excluye
// descartado/promoted/historico). Color neutro bajo el límite, advertencia al llegar a él.
// TKT1 (REQ CAEL-08111700-00, ref_id): retirada la barra de progreso mini (pieza 3 de
// "Mejora visual DISC") — desde infra_version 92 (__BR-Ecosystem §5), Q-DISC no tiene tope
// de entrada; la barra sugería un límite duro que ya no existe en el modelo de ítems.
// Se conserva el texto "N / QDISC_ACTIVE_LIMIT" y el toggle de color de advertencia —
// mismo dato, mismo umbral de aviso, solo sin representación de barra.
function _renderQDiscLimitIndicator() {
  const el = document.getElementById('qdisc-limit-indicator');
  if (!el) return;
  const count = getItems().filter(_isQDiscActive).length;
  el.innerHTML = `<span class="qdisc-limit-text">${count} / ${QDISC_ACTIVE_LIMIT}</span>`;
  el.classList.toggle('qdisc-limit--warn', count >= QDISC_ACTIVE_LIMIT);
}

// TKT histórico — sin CHECKPOINT confirmado (REQ histórico — sin CHECKPOINT confirmado): rellena #qdisc-stats-block (shell estático, ver
// index.html) con el conteo por status. Universo: _isQDisc — todos los DISC del proyecto,
// sin filtrar por status (a diferencia de _isQDiscActive, que excluye descartado/promoted).
// Total es la suma exacta de los tres — no hay un cuarto status posible para DISC
// (__BR-Ecosystem §5: discovery | promoted | descartado). Sin datos → las 4 celdas caen a 0,
// el bloque nunca se oculta.
function _renderQDiscStatsBlock() {
  const totalEl = document.getElementById('qdisc-stat-total');
  const discoveryEl = document.getElementById('qdisc-stat-discovery');
  const promotedEl = document.getElementById('qdisc-stat-promoted');
  const discardedEl = document.getElementById('qdisc-stat-discarded');
  if (!totalEl || !discoveryEl || !promotedEl || !discardedEl) return;
  const discItems = getItems().filter(_isQDisc);
  let discoveryCount = 0, promotedCount = 0, discardedCount = 0;
  discItems.forEach(i => {
    if (i.status === 'discovery') discoveryCount++;
    else if (i.status === 'promoted') promotedCount++;
    else if (i.status === 'descartado') discardedCount++;
  });
  totalEl.textContent = discItems.length;
  discoveryEl.textContent = discoveryCount;
  promotedEl.textContent = promotedCount;
  discardedEl.textContent = discardedCount;
  // REQ homologación visual Q-Backlog/Q-DISC: llamada retirada — #qdisc-proportion-bar ya no
  // existe en el DOM (index.html), sin contenedor donde pintar. Función queda comentada abajo,
  // no borrada — restaurable como fila aparte bajo .stats-row--compact si el founder la pide.
}

// RETIRADA (REQ homologación visual Q-Backlog/Q-DISC) — sin caller activo, #qdisc-proportion-bar
// ya no existe en index.html. Se conserva comentada (no se borra el archivo) para restauración
// rápida si el founder decide traer de vuelta la franja de proporción.
// function _renderQDiscProportionBar(total, discoveryCount, promotedCount, discardedCount) {
//   const discoveryEl = document.getElementById('qdisc-prop-discovery');
//   const promotedEl = document.getElementById('qdisc-prop-promoted');
//   const discardedEl = document.getElementById('qdisc-prop-discarded');
//   if (!discoveryEl || !promotedEl || !discardedEl) return;
//   const pct = n => total > 0 ? (n / total * 100).toFixed(2) : 0;
//   discoveryEl.style.setProperty('--w', pct(discoveryCount) + '%');
//   promotedEl.style.setProperty('--w', pct(promotedCount) + '%');
//   discardedEl.style.setProperty('--w', pct(discardedCount) + '%');
// }

// TKT-202607-013 (TKT5 REQ-202607-006): rellena #qdisc-grooming-banner (shell estático, ver
// index.html) con el aviso de grooming pendiente. Universo idéntico a _isQDiscActive — mismo
// criterio que el indicador de límite, para que ambas señales cuenten sobre el mismo conjunto
// (AC de coherencia del REQ). _zoneStaleness ya excluye lo no aplicable (retorna null fuera de
// umbral) — el umbral de DISC es 30 días (zone-engine.js). Sin staleness → textContent = '' y
// .qdisc-grooming-banner:empty{display:none} (locus-backlog.css) → cero elementos DOM visibles,
// consistente con AC-2. No hay pluralización real en la plantilla — ambos números son sustitución
// directa (ver CHECKPOINT, AC "edge case singular" no cambia palabras, solo valores).
function _renderQDiscGroomingBanner() {
  const el = document.getElementById('qdisc-grooming-banner');
  if (!el) return;
  const activeItems = getItems().filter(_isQDiscActive);
  const staleCount = activeItems.filter(i => _zoneStaleness(i) !== null).length;
  // Mejora visual DISC (aprobada por founder): ícono + números en <strong> — el texto plano
  // no distinguía el dato accionable (cuántas/cuántos días) del resto de la oración. Sin
  // staleness, innerHTML vuelve a '' — :empty{display:none} sigue aplicando igual que con
  // textContent (el elemento no diferencia el mecanismo de escritura, solo si queda vacío).
  if (staleCount === 0) { el.innerHTML = ''; return; }
  el.innerHTML = `<span class="qdisc-grooming-icon" aria-hidden="true">🧹</span>` +
    `<strong>${activeItems.length}</strong> discoveries requieren grooming antes de abrir sprint — ` +
    `<strong>${staleCount}</strong> con más de 30 días sin movimiento`;
}

// TKT2 (REQ CAEL-01 · design_intent: QDISC-headers-3-bloques-verticales): rellena el header de
// contador del bloque Discovery — universo idéntico a _isQDiscActive, el mismo que ya filtra
// #qdisc-panel-body vía _renderZonePanel (isZone). No duplica el cálculo del stats block
// (_isQDisc, sin filtrar) — este contador refleja solo lo que el bloque Discovery muestra hoy.
function _renderQDiscDiscoveryCount() {
  const el = document.getElementById('qdisc-discovery-count');
  if (!el) return;
  el.textContent = getItems().filter(_isQDiscActive).length;
}

// TKT2 (REQ CAEL-01 · design_intent: QDISC-headers-3-bloques-verticales): renderiza los bloques
// Promoted/Descartadas — status fijo (no reciben filtro de chips, fuera de scope de este REQ,
// ver AC de coherencia del REQ). AC-1 (happy path): cada card usa buildBacklogItem, mismo
// render que Discovery. AC-2 (estado vacío): sin ítems, el contenedor queda con innerHTML=''
// — el header + contador "0" sigue visible (CSS: .qdisc-status-body no colapsa, ver
// locus-backlog.css). Delegación de eventos por contenedor — mismo patrón que
// _renderZonePanel (zone-engine.js línea ~132), necesario porque estos dos contenedores no
// pasan por ese motor.
// REQ nuevo toolbar Q-DISC (buscar + colapsar todo): mismo criterio de búsqueda que
// _renderZonePanel usa para Discovery (zone-engine.js ~L518-532) — código/título/área,
// case-insensitive. El contador (countEl) sigue reflejando el universo YA filtrado por
// búsqueda (mismo criterio que _renderQDiscDiscoveryCount vía _renderZonePanel) — con
// búsqueda activa y 0 matches, el header muestra "0" en vez de esconderse (AC-2 ya vigente
// para el estado vacío de estos bloques, sin cambio).
// TKT-202608-431: sentinel idéntico al de zone-engine.js — mismo bucket "Sin área" que
// Discovery, misma clase .stat-area-chip--none. Estado single-select por bloque de status
// ('promoted' | 'descartado'), independiente entre sí y de Discovery.
const _QDISC_SIN_AREA = '__sin_area__';
const _qdiscBlockAreaFilter = { promoted: null, descartado: null };

// TKT-202608-431: construye el bloque de chips de área para Promoted/Descartadas — conteo
// sobre _statusItems (universo completo del bloque de status, previo a búsqueda), mismo
// criterio que zone-engine.js (los chips reflejan la zona base, no el subconjunto ya angostado
// por texto). AC edge case "bloque sin ítems": _statusItems.length===0 → '' → sin chips, sin
// depender de si había un filtro de área activo de una render anterior.
function _qdiscAreaChipsHtml(status, statusItems) {
  if (!statusItems.length) return '';
  const activeArea = _qdiscBlockAreaFilter[status];
  const countByArea = {};
  let sinAreaCount = 0;
  statusItems.forEach(i => {
    const a = (i.area || '').trim();
    if (!a) { sinAreaCount++; return; }
    countByArea[a] = (countByArea[a] || 0) + 1;
  });
  const areaBtns = Object.entries(countByArea)
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) =>
      `<button class="stat-area-chip${activeArea === area ? ' active' : ''}" data-qdisc-area="${area.replace(/"/g, '&quot;')}" title="Filtrar por área ${area.replace(/"/g, '&quot;')}"><span class="sac-n">${count}</span><span class="sac-label">${area}</span></button>`
    ).join('');
  const sinAreaBtn = sinAreaCount > 0
    ? `<button class="stat-area-chip stat-area-chip--none${activeArea === _QDISC_SIN_AREA ? ' active' : ''}" data-qdisc-area="${_QDISC_SIN_AREA}" title="Filtrar ítems sin área declarada"><span class="sac-n">${sinAreaCount}</span><span class="sac-label">Sin área</span></button>`
    : '';
  return (areaBtns || sinAreaBtn) ? `<div class="qdisc-area-chips">${areaBtns}${sinAreaBtn}</div>` : '';
}

function _renderQDiscStatusGroup(status, containerId, countId) {
  const container = document.getElementById(containerId);
  const countEl = document.getElementById(countId);
  if (!container || !countEl) return;
  const _q = (_nsGetQuery('qdisc') || '').trim().toLowerCase();
  // TKT-202608-431: _statusItems — universo completo del bloque (status, sin búsqueda ni área)
  // — base para los chips. `items` (abajo) es el subconjunto ya angostado por área + búsqueda,
  // el que efectivamente se renderiza como cards.
  const _statusItems = getItems().filter(i => _isQDisc(i) && i.status === status);
  const _activeArea = _qdiscBlockAreaFilter[status];
  const items = _statusItems.filter(i => {
    if (_activeArea) {
      const areaOk = _activeArea === _QDISC_SIN_AREA ? !(i.area || '').trim() : (i.area || '').trim() === _activeArea;
      if (!areaOk) return false;
    }
    if (!_q) return true;
    return i.code.toLowerCase().includes(_q) || (i.title || '').toLowerCase().includes(_q) || (i.area || '').toLowerCase().includes(_q);
  });
  countEl.textContent = items.length;
  container.innerHTML = _qdiscAreaChipsHtml(status, _statusItems) + items.map(i => buildBacklogItem(i, {})).join('');
  _resetBacklogListDelegation(containerId);
  _attachBacklogListDelegation(containerId);
  // TKT-202608-431: delegación propia para el click de chip de área — permanente (a diferencia
  // de _resetBacklogListDelegation/_attachBacklogListDelegation, que reciclan su listener vía
  // AbortController en cada render), guardada por flag en el propio container. No colisiona con
  // la delegación de cards: esa escucha por [data-action], esta por [data-qdisc-area] — mismo
  // patrón de separación de namespace de atributo que zp-type/zp-priority/zp-area en
  // zone-engine.js usan frente al resto del DOM.
  if (!container._qdiscAreaDelegationAttached) {
    container._qdiscAreaDelegationAttached = true;
    container.addEventListener('click', e => {
      const btn = e.target.closest('[data-qdisc-area]');
      if (!btn) return;
      const area = btn.dataset.qdiscArea;
      _qdiscBlockAreaFilter[status] = (_qdiscBlockAreaFilter[status] === area) ? null : area;
      _renderQDiscStatusGroup(status, containerId, countId);
    });
  }
}

// B-202606-052 → TKT-C1: renderQDiscPanel — sub-tab Discoveries (Q-DISC: DISC).
export function renderQDiscPanel() {
  _renderZonePanel({
    bodyId: 'qdisc-panel-body',
    badgeId: 'tpl-badge-qdisc',
    // TKT1 (REQ CAEL-0723-01): aria-label hablado en el botón de tab — badge visual
    // es aria-hidden (index.html), este es el texto real para lectores de pantalla.
    tabButtonId: 'sstab-btn-qdisc',
    tabLabel: 'Discoveries',
    nsKey: 'qdisc',
    isZone: _isQDiscActive,
    // TKT3 (REQ-202607-alineacion-qbacklog-qdisc): separa la stats-bar interactiva del cuerpo
    // de #qdisc-panel-body — ver detalle en el header del módulo.
    statsBarId: 'qdisc-filter-bar',
    showTypeChips: false,
    // TKT-202607-011: único caller que activa showAreaChips — qbacklog no lo declara.
    showAreaChips: true,
    emptyTitle: 'No hay discoveries pendientes',
    emptyIcon: '💡',
    // Mejora visual DISC (aprobada por founder): hint accionable en el empty-state real (sin
    // filtro activo) — opts.emptyHint es aditivo en _renderZonePanel, opcional, sin default;
    // qbacklog no lo declara y no cambia su comportamiento (ver impacto lateral en zone-engine.js).
    emptyHint: 'Registra tu primera idea en el chat con el founder — Cael la promueve a REQ o TKT cuando esté lista.',
    // TKT1 REQ hide-done-qdisc: DISC nunca alcanza status 'done' (__BR-Ecosystem §5) — bloque
    // Terminados era código muerto. DISC no tiene depends_on ni jerarquía R→hijos.
    hasDoneState: false,
    hasChildren: false
  });
  // TKT-202607-010: indicador independiente del universo filtrado de _renderZonePanel —
  // siempre refleja el conteo real de activos, incluso sin proyecto seleccionado (getItems()
  // ya resuelve vacío en ese caso, indicador cae a "0 / 15" sin error).
  _renderQDiscLimitIndicator();
  // TKT histórico — sin CHECKPOINT confirmado: universo propio (_isQDisc, todos los status) — independiente del
  // universo filtrado de _renderZonePanel y del universo activo de _renderQDiscLimitIndicator.
  _renderQDiscStatsBlock();
  // TKT-202607-013: misma razón — señal independiente del universo filtrado por chips/búsqueda.
  _renderQDiscGroomingBanner();
  // TKT2 (REQ CAEL-01): contador del header Discovery — mismo universo que #qdisc-panel-body.
  _renderQDiscDiscoveryCount();
  // TKT2 (REQ CAEL-01): bloques Promoted/Descartadas — status fijo, sin chips (fuera de scope).
  _renderQDiscStatusGroup('promoted', 'qdisc-promoted-body', 'qdisc-promoted-count');
  _renderQDiscStatusGroup('descartado', 'qdisc-descartadas-body', 'qdisc-descartadas-count');
}

// TKT2 (REQ CAEL-04 · design_intent: QDISC-headers-colapsables): toggle de colapso por header —
// click o teclado (Enter/Space), independiente por grupo (.qdisc-status-group). Delegación única
// sobre #sspanel-qdisc — los 3 headers existen siempre en el DOM (shell estático, ver index.html),
// no requieren re-adjuntar en cada renderQDiscPanel() como sí hacen los contenedores de cards.
function _initQDiscStatusToggles() {
  const panel = document.getElementById('sspanel-qdisc');
  if (!panel) return;
  function toggle(header) {
    const group = header.closest('.qdisc-status-group');
    if (!group) return;
    const collapsed = group.classList.toggle('is-collapsed');
    header.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
  panel.addEventListener('click', e => {
    const header = e.target.closest('.qdisc-status-header');
    if (header) toggle(header);
  });
  panel.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = e.target.closest('.qdisc-status-header');
    if (!header) return;
    e.preventDefault();
    toggle(header);
  });
}
_initQDiscStatusToggles();

// REQ nuevo toolbar Q-DISC (buscar + colapsar todo, homologado con Backlog/Histórico —
// #qdisc-toolbar es shell estático en index.html, dentro de #qdisc-header-unified, nunca se
// recrea — wiring una sola vez al cargar el módulo, mismo criterio que _initQDiscStatusToggles
// arriba, sin necesidad de guard _wired por render (a diferencia de _initHistoricoToolbar, que
// si necesita el guard porque su toolbar SÍ se recrea en cada renderHistoricoPanel).
function _initQDiscToolbar() {
  const collapseBtn = document.getElementById('qdisc-collapse-all-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      const groups = document.querySelectorAll('#sspanel-qdisc .qdisc-status-group');
      if (!groups.length) return;
      const anyExpanded = Array.from(groups).some(g => !g.classList.contains('is-collapsed'));
      groups.forEach(group => {
        group.classList.toggle('is-collapsed', anyExpanded);
        const header = group.querySelector('.qdisc-status-header');
        if (header) header.setAttribute('aria-expanded', String(!anyExpanded));
      });
      collapseBtn.setAttribute('aria-pressed', String(anyExpanded));
      const label = collapseBtn.querySelector('.bl-collapse-btn-label');
      if (label) label.textContent = anyExpanded ? 'Expandir todo' : 'Colapsar todo';
    });
  }

  const searchInput = document.getElementById('qdisc-search-input');
  const searchClear = document.getElementById('qdisc-search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      _nsSetQuery('qdisc', searchInput.value);
      renderQDiscPanel();
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (!searchInput) return;
      searchInput.value = '';
      _nsSetQuery('qdisc', '');
      renderQDiscPanel();
      searchInput.focus();
    });
  }
}
_initQDiscToolbar();

// B-202606-052 → TKT-C1: listener sub-tab Discoveries (Q-DISC) — reemplaza al listener único
// sstab-btn-icebox.
// TKT (REQ CAEL-04): listener local eliminado — mismo criterio que locus-backlog-qbacklog.js.
// switchSubTab() ya toggle-a clases para este sub-tab y ya despacha shell:render-qdisc.
window.addEventListener('shell:render-qdisc', renderQDiscPanel);

// B-202606-052 → TKT-C1: re-render del panel Q-DISC cuando el backlog cambia y el panel
// está activo.
window.addEventListener('shell:backlog-render-dirty', () => {
  const panel = document.getElementById('sspanel-qdisc');
  if (panel && panel.classList.contains('active')) renderQDiscPanel();
});
