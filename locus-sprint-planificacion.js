// [PP] mod:41 · autor:Rune · 2026-07-26 UTC-6
// TKT-202607-127 (REQ-202607-039): puebla el Stats Shell (#spp-stats-block, entregado por
// Nova en index.html mod:161) y alterna el empty-state (#spp-content-empty) desde
// _renderPlanningView() vía nuevo helper _updatePlanStatsShell(unassigned, openSprints,
// velocityAvg) — recibe los tres valores ya computados en el render, sin segunda pasada
// sobre getItems(). 4 celdas: Q-Backlog (unassigned.length) · Asignados (suma de ítems
// activos en todos los openSprints) · Effort asignado (suma de effort de esos mismos ítems)
// · vs velocidad (% sobre _calcEstimatedVelocity().avg, '—' sin velocidad histórica — mismo
// fallback que _sprintMeterHtml). Shell nunca se oculta con las 4 celdas en 0 (AC de
// TKT-202607-127, mismo criterio que TKT-202607-126) — solo #sprint-planificar-container
// alterna con #spp-content-empty según unassigned.length. Sin cambio de firma en ninguna
// función existente — _updatePlanStatsShell es función nueva, no exportada.
// contract_update: no.
// [PP] mod:40 · autor:Rune · 2026-07-24 UTC-6
// INC (triggered_by análisis de render de Planificación, sla_priority: high — módulo crítico
// locus-backlog-item.js referenciado por contrato, jerarquía REQ→TKT es invariante estructural):
// Causa raíz real de "Planificación no refleja jerarquía parent/child" — mod:39 (este mismo
// archivo) escribía _reqCodesInList/_groupChildrenAfterParent/_planCard(isChild)/_planDrop
// comparando contra i.parent en las 6 ocurrencias, pero _Locus-module-contracts §_loadFromSupabase
// y locus-backlog-item.js (L2441-2443, comentario explícito "parentId es el único campo canónico
// en JS — item.parent se elimina del objeto en memoria tras normalizar") declaran parentId como
// único campo válido en ítems en memoria. mod:37/38/39 nunca fallaron por CSS ni por dato faltante
// — comparaban siempre contra un campo inexistente, childCodes.size era 0 en el 100% de los casos,
// sin error visible. Fix: las 6 ocurrencias de i.parent → i.parentId (_reqCodesInList sin cambio,
// no lee parent; _groupChildrenAfterParent L194-196; isChild en _sprintDestCard L297 y en la
// columna izquierda L330; _planDrop L449 — impacto lateral: antes de este fix, mover un REQ de
// sprint tampoco arrastraba sus TKT hijos activos, mismo root cause, función distinta). Sin cambio
// de firma en ninguna función. contract_update: no — no toca locus-backlog-item.js, solo corrige
// el nombre de campo leído desde fuera.
// [PP] mod:39 · autor:Rune · 2026-07-24 UTC-6
// TKT1 (REQ-202607-033, TKT-202607-106 — agrupación visual REQ→TKT en Planificación):
// unassigned e inSprint ya no se renderizan como listas planas de getItems().filter() —
// nuevo helper _groupChildrenAfterParent(list) reordena cada lista para que un TKT con
// parent === código de REQ presente en esa misma lista se inserte inmediatamente después
// de ese REQ (AC1), preservando el orden relativo entre múltiples hijos del mismo REQ
// (AC2) y sin mover TKTs cuyo parent no está en la lista — esos conservan su posición de
// sort por prioridad/effort intacta (AC3). Reutiliza _reqCodesInList ya existente (mod:37)
// — el Set no cambia por reordenar, se calcula sobre la lista ya agrupada. Aplicado a
// unassigned (antes de reqCodesLeft/leftCards) y a inSprint dentro de _sprintDestCard
// (antes de reqCodesDest/cards) — mismo criterio en ambas columnas. No toca
// doneUnassigned/_planDoneCard (no_incluye del TKT). Sin línea conectora — fuera de
// scope, ya declarado en CAEL-0724-03. Sin cambio de firma en _planCard/_sprintDestCard/
// _reqCodesInList. contract_update: no.
// [PP] mod:38 · autor:Rune · 2026-07-24 UTC-6
// INC (Fast Track — sla_priority medium, un solo archivo, fix en la misma sesión de registro):
// openSprints (_renderPlanningView, L112) e isProgramado (_sprintDestCard, L225) comparaban
// contra el literal 'programado' (nombre BR-Ecosystem §5) en vez de 'scheduled' (nombre Locus
// real — único valor que setSprintStatus() asigna, confirmado contra locus-backlog-sprints.js
// L442/450/478: "valores válidos extendidos — 'active' | 'closed' | 'scheduled' | 'discarded'").
// Un sprint con status:'scheduled' nunca matcheaba ninguno de los dos filtros — invisible en
// Planificación pese a que mod:36 (este mismo archivo, misma fecha) creía haber agregado el
// soporte. Sin cambio de lógica ni de firma — solo el literal comparado. contract_update: no.
// [PP] mod:37 · autor:Rune · 2026-07-24 UTC-6
// TKT1 (REQ CAEL-0724-03 · sangría visual TKT bajo REQ en Planificación): _planCard acepta
// 4to parámetro isChild — agrega clase bl-plan-card--child (Nova, locus-sprint-ui.css, entrega
// pendiente de integración — archivo real no adjunto en esta sesión, ver doc_updates). Nuevo
// helper _reqCodesInList(list) calcula, por cada lista renderizada de forma independiente (columna
// Q-Backlog / cada sprint destino), el set de códigos REQ presentes en esa misma lista — un TKT
// recibe isChild=true solo si item.parent está en ese set (AC1). Sin match → sin sangría, mismo
// render que antes (AC2/AC3, incluye TKT sin parent). Bloque Terminados (doneUnassigned/_planDoneCard)
// fuera de scope — no_incluye del TKT, sin cambio. No dibuja línea conectora entre REQ y TKT — solo
// indentación + borde izquierdo en la card hija, simplificación declarada sobre el borrador visual
// aprobado por el founder (ver CHECKPOINT de la sesión). Sin cambio de firma pública — _planCard
// sigue siendo función interna del closure de _renderPlanningView, no exportada. contract_update: no.
// [PP] mod:36 · autor:Rune · 2026-07-24 UTC-6
// TKT2 (REQ CAEL-0724-02): openSprints ahora incluye status 'programado' además de 'active'
// (antes solo active — bloqueaba trabajo adelantado explícito, BR-Ecosystem §5). _sprintDestCard
// distingue programado con .bl-plan-dest-sprint--programado + .bl-plan-dest-programado-badge
// (mod:13 de locus-sprint-ui.css, Nova). _planCard(i, false, sprint.id) → _planCard(i, true,
// sprint.id) en _sprintDestCard — items ya asignados a un sprint (active o programado) ahora
// son draggable, habilitando drop directo Activos↔Planificados vía el mismo _planDrop genérico
// (ya no distinguía origen, solo targetCol — sin cambio en _planDrop). Orden de openSprints:
// active primero, luego programado por id — visual estable, sin tocar activationOrder real.
// Sin cambio de firma en _planCard/_planDrop/_sprintDestCard. contract_update: no.
// [PP] mod:35 · autor:Rune · 2026-07-18 01:30 UTC-6
// Fix inline (limpieza de código muerto, DISC de mod:69 de module-contracts): comentario de
//   módulo (L43 anterior) seguía describiendo "sprint selector bar" pese a que ese subsistema
//   ya fue eliminado en mod:34 — verificado con grep, sin código real que limpiar, solo el
//   comentario estaba desactualizado. Sin cambio de comportamiento. contract_update: no.
// [PP] mod:34 · autor:Rune · 2026-07-17 UTC-6
// TKT1 (REQ-[pendiente-ID] Consolidar wiring de Histórico): subsistema muerto "Sprint selector
// bar" eliminado — _roadmapSprintFilter, _statusPills, roadmapGoToSprint, _buildSprintOption,
// _buildSprintSelector, _blSprintOpen, _blSprintClose, _blSprintSelect, _blSprintToggleClosed,
// _attachSprintBarDelegation, _renderSprintRoadmap. Sin call sites reales fuera del propio
// bloque (AC3, grep confirmado sobre locus-sprint-planificacion.js + locus-backlog-render.js).
// 4 imports huérfanos reducidos (AC5): _sprintDisplay, openSprintRetroView,
// _getActiveStatuses/updateStatusFilterUI, _markBacklogListDirty/renderBacklogList. Import de
// _statusPills en locus-backlog-render.js retirado (AC2, ver mod:87 de ese archivo). Sin cambio
// de firma en funciones que permanecen. contract_update: no.
// [PP] mod:33 · autor:Rune · 2026-07-17 UTC-6
// TKT2 (REQ CAEL-0717-01): persistencia de estado expandido/colapsado del bloque Terminados
// a través de re-renders de _renderPlanningView() disparados por _planDrop() — nueva
// variable de módulo _planDoneExpanded, leída por doneBlockHtml y escrita por
// _togglePlanDoneGroup. Sin cambio de firma en ninguna función existente. contract_update: no.
// [PP] mod:32 · autor:Rune · 2026-07-17 UTC-6
// TKT1 (REQ CAEL-0717-01): bloque Terminados colapsable en columna Q-Backlog (Sin Sprint) de
// Planificar — items done sin sprint ahora visibles y arrastrables ahí (antes solo visibles
// en la barra Terminados de Q-Backlog, tab Backlog). Nuevo: doneUnassigned, _planDoneCard,
// doneBlockHtml, _togglePlanDoneGroup, handler data-action="bl-plan-done-toggle" (click +
// keydown). Sin cambio de firma en _renderPlanningView/_planCard/_attachPlanViewDelegation.
// [PP] mod:31 · autor:Rune · 2026-07-12 01:35 UTC-6
// TKT-202607-020 (REQ CAEL-01): unassigned excluye DISC (itemKind(i) !== 'DISC') — DISC nunca
// persiste sprint (BR-Ecosystem §5/§4b), no debe renderizarse como candidato a jalar a sprint.
// Título de #bl-plan-col-left: "Sin sprint" → "Q-Backlog (Sin Sprint)".
// [PP] mod:29 · autor:Rune · 2026-07-11 UTC-6
// TKT1 (CAEL-02 · REQ deuda técnica CSS Purity): L132 _buildSprintOption — style="width:${pct}%"
// reemplazado por style="--sprint-option-bar-w:${pct}%". CSS (.bl-sprint-option-bar-fill,
// locus-backlog.css mod:87) ya consume la custom property — entregable de Nova integrado.
// [PP] mod:28 · autor:Rune · 2026-07-11 15:35 UTC-6
// TKT2 (REQ CAEL-01 · deuda técnica auditoría): openSprints=[] hardcodeado eliminado en
// _buildSprintSelector y _blSprintOpen — post-migración solo existe activeSprint/closedSprints,
// la rama muerta (else if openSprints.length / spread ...openSprints) no era alcanzable.
// TKT-202607-010: código muerto _planDragOver/_planDragLeave eliminado — sin call sites reales,
// la delegación inline en _attachPlanViewDelegation (dragenter/dragover/dragleave) ya cubre el comportamiento.
// INC-[pendiente-ID]: fix drag&drop — currentTarget es getter-only en Event (post-ESM, strict mode).
// Object.assign(e, {currentTarget}) lanzaba TypeError. _planDragStart/_planDragEnd/_planDrop
// ahora reciben el elemento destino como parámetro explícito en vez de mutar el Event nativo.
// TKT1 (limpieza post-rename): comentario en L9 actualizado — locus-backlog-archive.js → locus-backlog-historico.js. Sin cambio de código.
// locus-sprint-planificacion.js
// Módulo: Vista Planificación — drag & drop planning view
// Migrado desde locus-backlog-render.js (T-202605-090)
// T-202606-091: headers colapsables en sprints destino — delegación en bl-plan-col-header
// T-202606-092: drop de R mueve Ts hijos activos al mismo sprint destino
// TKT1 (REQ-[pendiente-ID] Consolidar wiring de Histórico): toggleClosedSprintsBody eliminada —
// era alias de compatibilidad sin call sites reales (solo importada, nunca invocada) que
// dependía de toggleArchivoHistorico, export eliminado de locus-backlog-historico.js al quitar
// el acordeón colapsable del subtab Histórico.

import { _getActiveSprint, _getSprintById, setItemSprint } from './locus-backlog-sprints.js';
import { showToast } from './locus-toast.js';
import { getItems, itemKind } from './locus-backlog-core.js';
import { getActiveSprints } from './locus-storage.js';
import { esc } from './locus-ui-shell.js';
import { _calcEstimatedVelocity } from './locus-backlog-render.js';

// ---------------------------------------------------------------------------
// Estado interno
// ---------------------------------------------------------------------------

// R-202605-130: drag & drop handlers para vista planificación
let _planDragCode = null;

// TKT2 (REQ CAEL-0717-01): persiste el estado expandido/colapsado del bloque Terminados
// entre invocaciones de _renderPlanningView() disparadas por _planDrop() — sin esto, cada
// drop reconstruye doneBlockHtml y el bloque siempre nace is-hidden, perdiendo el estado
// que el founder tenía abierto. Vive solo dentro de la misma vista viva — no persiste entre
// recargas de página (AC no_incluye).
let _planDoneExpanded = false;

// ---------------------------------------------------------------------------
// Vista Planificación
// ---------------------------------------------------------------------------

// R-202605-130: vista Planificación — layout dos columnas con drag & drop
// T-202605-028: columna derecha muestra todos los sprints active como destinos
export function _renderPlanningView(listEl, closeCallback) {
  const activeSprint = _getActiveSprint();
  const allSprints   = getActiveSprints();
  // T-202605-028: todos los sprints con status active son destinos válidos
  // TKT2 (REQ CAEL-0724-02): programado también es destino válido — BR-Ecosystem §5 contempla
  // trabajo adelantado explícito hacia sprint programado. Orden estable: active primero (isCurrent
  // ya lo distingue visualmente igual), luego programado por id — sin tocar activationOrder real.
  const openSprints  = allSprints
    .filter(s => s.status === 'active' || s.status === 'scheduled')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return String(a.id).localeCompare(String(b.id));
    });

  // Columna izquierda: ítems pendientes sin sprint (no done, no descartado, no historico)
  // T-202605-024: '' o ausente es el valor canónico de "sin sprint asignado" — Q-Backlog
  const unassigned = getItems().filter(i =>
    !i.sprint &&
    itemKind(i) !== 'DISC' &&
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

  // TKT1 (REQ CAEL-0717-01): ítems done sin sprint — antes invisibles en Planificar aunque
  // ya visibles en la barra Terminados de Q-Backlog (tab Backlog). Mismo criterio de sort que
  // unassigned. No modifica el filtro de unassigned — los done siguen excluidos de esa lista.
  const doneUnassigned = getItems().filter(i =>
    !i.sprint &&
    itemKind(i) !== 'DISC' &&
    i.status === 'done'
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

  // TKT1 (REQ CAEL-0724-03): set de códigos REQ presentes en una lista renderizada — determina
  // qué TKTs de esa misma lista reciben sangría (AC1/AC2). Cálculo por lista, no global — un REQ
  // en el sprint A no hace sangrar a un TKT hijo que cayó en Q-Backlog o en otro sprint.
  function _reqCodesInList(list) {
    return new Set(list.filter(i => itemKind(i) === 'REQ').map(i => i.code));
  }

  // TKT1 (REQ-202607-033/TKT-202607-106): agrupa cada TKT hijo inmediatamente después de su
  // REQ padre cuando ambos están en la misma lista — sin esto, un TKT hijo puede quedar lejos
  // o antes que su REQ pese a la sangría visual ya correcta (mod:14 de locus-sprint-ui.css).
  // Preserva el resto del orden ya calculado (prioridad/effort, AC3) — solo reubica los TKTs
  // cuyo parent es un REQ visible en la misma lista, en el mismo orden relativo que ya tenían
  // entre sí (AC2). Early return sin costo si no hay hijos que mover.
  function _groupChildrenAfterParent(list) {
    const reqCodes = _reqCodesInList(list);
    const childrenByParent = new Map();
    const childCodes = new Set();
    list.forEach(i => {
      if (itemKind(i) === 'TKT' && i.parentId && reqCodes.has(i.parentId)) {
        if (!childrenByParent.has(i.parentId)) childrenByParent.set(i.parentId, []);
        childrenByParent.get(i.parentId).push(i);
        childCodes.add(i.code);
      }
    });
    if (!childCodes.size) return list;
    const result = [];
    list.forEach(i => {
      if (childCodes.has(i.code)) return;
      result.push(i);
      if (itemKind(i) === 'REQ' && childrenByParent.has(i.code)) {
        result.push(...childrenByParent.get(i.code));
      }
    });
    return result;
  }

  // Helper: card compacta de ítem
  // TKT1 (REQ CAEL-0724-03): 4to parámetro isChild — agrega bl-plan-card--child (sangría +
  // borde izquierdo, Nova/locus-sprint-ui.css) cuando el TKT tiene parent visible en la misma
  // lista. Default false — sin cambio de comportamiento para callers que no lo pasan.
  function _planCard(item, draggable, sprintId, isChild = false) {
    const type  = itemKind(item) || '';
    const typeColors = { TKT: '#2ecc78', REQ: '#38bdf8', INC: '#e85555', DISC: '#7c6af7' };
    const tc    = typeColors[type] || 'var(--hint)';
    const eff   = parseInt(item.effort) || 1;
    const dots  = Array.from({length: 3}, (_, i) =>
      `<span class="bl-plan-dot${i < eff ? ' on' : ''}"></span>`).join('');
    const prioClass = item.priority === 'high' ? 'bl-plan-prio--high' : item.priority === 'low' ? 'bl-plan-prio--low' : '';
    // T-202605-028: data-sprint-dest indica el sprint destino del drop
    return `<div class="bl-plan-card${draggable ? ' bl-plan-card--draggable' : ''}${isChild ? ' bl-plan-card--child' : ''}"
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

  // TKT1 (REQ CAEL-0717-01): variante de _planCard para ítems done sin sprint — agrega
  // bl-plan-card--done al string ya generado por _planCard en vez de duplicar el markup o
  // cambiar la firma de _planCard (contract_update: no — sin cambio de firma de función
  // existente). draggable siempre true — el AC de arrastre no distingue por status.
  function _planDoneCard(item) {
    return _planCard(item, true, 'left')
      .replace('class="bl-plan-card bl-plan-card--draggable"', 'class="bl-plan-card bl-plan-card--draggable bl-plan-card--done"');
  }

  // Helper: meter HTML para un sprint destino
  function _sprintMeterHtml(sprintId) {
    const sprintEffort = getItems()
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
    const isCurrent   = activeSprint && sprint.id === activeSprint.id;
    // TKT2 (REQ CAEL-0724-02): programado nunca coincide con activeSprint — isCurrent ya lo
    // excluye por construcción, sin condición adicional.
    const isProgramado = sprint.status === 'scheduled';
    // TKT-[pendiente-ID]: patrón id · label — fallback a solo id si no hay label propio
    const displayName = sprint.label ? `${sprint.id} · ${sprint.label}` : sprint.id;
    const inSprint  = getItems().filter(i =>
      i.sprint === sprint.id &&
      i.status !== 'done' &&
      i.status !== 'descartado' &&
      i.status !== 'historico'
    );
    // TKT2 (REQ CAEL-0724-02): draggable=true — antes false, bloqueaba drop directo
    // Activos↔Planificados. _planDrop ya es genérico por targetCol, sin cambio ahí.
    // TKT1 (REQ CAEL-0724-03): reqCodesDest — mismo criterio que reqCodesLeft, acotado a esta
    // columna de sprint destino. Independiente entre sprints — un REQ en PP-S-06 no sangra un
    // TKT hijo listado en PP-S-07.
    // TKT1 (REQ-202607-033/TKT-202607-106): mismo criterio de agrupación que la columna
    // izquierda — inSprintGrouped es independiente por sprint, un REQ en PP-S-06 no reordena
    // un TKT hijo listado en PP-S-07.
    const inSprintGrouped = _groupChildrenAfterParent(inSprint);
    const reqCodesDest = _reqCodesInList(inSprintGrouped);
    const cards = inSprintGrouped.map(i =>
      _planCard(i, true, sprint.id, itemKind(i) === 'TKT' && !!i.parentId && reqCodesDest.has(i.parentId))
    ).join('') || `<div class="bl-plan-empty">Sprint vacío — arrastra ítems aquí</div>`;
    const currentBadge = isCurrent
      ? `<span class="bl-plan-dest-current-badge" aria-label="Sprint en curso">en curso</span>`
      : isProgramado
      ? `<span class="bl-plan-dest-programado-badge" aria-label="Sprint programado">programado</span>`
      : '';
    const stateClass = isCurrent ? ' bl-plan-dest-sprint--current' : isProgramado ? ' bl-plan-dest-sprint--programado' : '';
    // T-202606-091: header colapsable — data-action en el header completo, chevron visible
    return `<div class="bl-plan-dest-sprint bl-plan-col${stateClass}"
               data-plan-col="${esc(sprint.id)}">
      <div class="bl-plan-col-header" data-action="bl-plan-dest-collapse">
        <span class="bl-plan-col-title">${esc(displayName)}</span>
        ${currentBadge}
        <span class="bl-plan-col-count">${inSprint.length} ítems</span>
        <span class="bl-plan-dest-chevron" aria-hidden="true">▾</span>
      </div>
      ${_sprintMeterHtml(sprint.id)}
      <div class="bl-plan-col-body">
        ${cards}
      </div>
    </div>`;
  }

  // Construir columna izquierda
  // TKT1 (REQ CAEL-0724-03): reqCodesLeft calculado sobre unassigned — mismo universo que la
  // columna renderiza, antes del map. AC1: TKT con parent en este set → isChild=true.
  // TKT1 (REQ-202607-033/TKT-202607-106): agrupa TKT bajo su REQ padre antes de calcular
  // reqCodesLeft/leftCards — mismo universo de columna que ya usaba unassigned, sin afectar
  // doneUnassigned (no_incluye del TKT).
  const unassignedGrouped = _groupChildrenAfterParent(unassigned);
  const reqCodesLeft = _reqCodesInList(unassignedGrouped);
  const leftCards = unassignedGrouped.map(i =>
    _planCard(i, true, 'left', itemKind(i) === 'TKT' && !!i.parentId && reqCodesLeft.has(i.parentId))
  ).join('') || `<div class="bl-plan-empty">Sin ítems sin sprint</div>`;

  // TKT1 (REQ CAEL-0717-01): bloque Terminados — colapsable, nace colapsado (AC4), no se
  // renderiza si doneUnassigned está vacío (AC7 — sin header con contador 0).
  // TKT2 (REQ CAEL-0717-01): lee _planDoneExpanded para que el bloque nazca en el mismo
  // estado que tenía antes del re-render — sin esto, todo drop lo re-colapsaba (AC3/AC4).
  const doneBlockHtml = doneUnassigned.length
    ? `<div class="bl-plan-done-group">
        <div class="bl-plan-done-header" role="button" tabindex="0" aria-expanded="${_planDoneExpanded ? 'true' : 'false'}" data-action="bl-plan-done-toggle">
          <span class="bl-plan-dest-chevron" aria-hidden="true">${_planDoneExpanded ? '▾' : '▸'}</span>
          <span class="bl-plan-col-title">Terminados</span>
          <span class="bl-plan-col-count">${doneUnassigned.length}</span>
        </div>
        <div class="bl-plan-done-body${_planDoneExpanded ? '' : ' is-hidden'}">
          ${doneUnassigned.map(_planDoneCard).join('')}
        </div>
      </div>`
    : '';

  // Construir columna derecha — T-202605-028: N cards, uno por sprint active
  const rightColContent = openSprints.length
    ? openSprints.map(_sprintDestCard).join('')
    : `<div class="bl-plan-empty bl-plan-dest-empty">No hay sprints abiertos</div>`;

  // TKT-202607-127 (REQ-202607-039): Stats Shell + empty-state viven en index.html (mod:161,
  // Nova), fuera de listEl — #spp-stats-block/#spp-content-empty son hermanos estáticos de
  // #sprint-planificar-container, no se regeneran en cada render. _updatePlanStatsShell()
  // solo actualiza textContent + alterna is-hidden, mismo patrón ya usado por Rune en el
  // sub-tab Ítems (TKT-202607-126) para #spi-stats-block/#spi-content-empty.
  _updatePlanStatsShell(unassigned, openSprints, velocityAvg);

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
        <!-- Columna izquierda: Q-Backlog (sin sprint) -->
        <div class="bl-plan-col bl-plan-col--left"
             id="bl-plan-col-left"
             data-plan-col="left">
          <div class="bl-plan-col-header">
            <span class="bl-plan-col-title">Q-Backlog (Sin Sprint)</span>
            <span class="bl-plan-col-count">${unassigned.length} ítems</span>
          </div>
          <div class="bl-plan-col-body" id="bl-plan-left-body">
            ${leftCards}
            ${doneBlockHtml}
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

// TKT-202607-127 (REQ-202607-039): puebla el Stats Shell estático (#spp-stats-block) y
// alterna el empty-state (#spp-content-empty) entregados por Nova en index.html mod:161.
// Mismo criterio que #spi-stats-block/#spi-content-empty (TKT-202607-126, sub-tab Ítems):
// shell nunca se oculta (BR-Execution §5) — solo textContent cambia. El empty-state alterna
// con #sprint-planificar-container (nunca ambos, nunca ninguno) cuando Q-Backlog no tiene
// ítems elegibles para asignar al sprint — mismo criterio que "unassigned" ya calculado
// arriba, sin duplicar el filtro.
// no_incluye: no recalcula unassigned/openSprints/velocityAvg — recibe los ya computados
// por _renderPlanningView() para evitar dos pasadas sobre getItems().
function _updatePlanStatsShell(unassigned, openSprints, velocityAvg) {
  const statsBlock = document.getElementById('spp-stats-block');
  const emptyState  = document.getElementById('spp-content-empty');
  const container   = document.getElementById('sprint-planificar-container');
  if (!statsBlock) return; // shell no adjunto en esta sesión de DOM — no bloquear el render principal

  const assigned = openSprints.reduce((acc, s) =>
    acc + getItems().filter(i =>
      i.sprint === s.id &&
      i.status !== 'done' &&
      i.status !== 'descartado' &&
      i.status !== 'historico'
    ).length, 0);
  const assignedEffort = openSprints.reduce((acc, s) =>
    acc + getItems()
      .filter(i => i.sprint === s.id && i.status !== 'done' && i.status !== 'descartado' && i.status !== 'historico')
      .reduce((sum, i) => sum + (parseInt(i.effort) || 1), 0), 0);
  const vsVelocidad = (velocityAvg !== null && velocityAvg > 0)
    ? `${Math.round((assignedEffort / velocityAvg) * 100)}%`
    : '—';

  const qbEl  = document.getElementById('spp-stat-qbacklog');
  const asEl  = document.getElementById('spp-stat-asignados');
  const efEl  = document.getElementById('spp-stat-effort');
  const vvEl  = document.getElementById('spp-stat-vs-velocidad');
  if (qbEl) qbEl.textContent = String(unassigned.length);
  if (asEl) asEl.textContent = String(assigned);
  if (efEl) efEl.textContent = String(assignedEffort);
  if (vvEl) vvEl.textContent = vsVelocidad;

  // AC — empty-state: Q-Backlog sin ítems elegibles para el sprint. El Stats Shell (arriba)
  // permanece visible con las 4 celdas en 0 — no colapsa, no se oculta (mismo AC que
  // TKT-202607-126). Solo #sprint-planificar-container alterna con #spp-content-empty.
  const isEmpty = unassigned.length === 0;
  if (emptyState) emptyState.classList.toggle('is-hidden', !isEmpty);
  if (container) container.classList.toggle('is-hidden', isEmpty);
}

// ---------------------------------------------------------------------------
// Drag & drop handlers
// ---------------------------------------------------------------------------

function _planDragStart(e, card) {
  _planDragCode = card.dataset.code;
  card.classList.add('bl-plan-card--dragging');
  e.dataTransfer.effectAllowed = 'move';
  // B-202606-034: setData requerido — sin él el browser no dispara el evento drop
  e.dataTransfer.setData('text/plain', _planDragCode);
}

function _planDragEnd(e, card) {
  card.classList.remove('bl-plan-card--dragging');
  // T-202605-028: limpiar drag-over en todos los destinos (sprint cards y columna izquierda)
  document.querySelectorAll('.bl-plan-col, .bl-plan-dest-sprint').forEach(c => c.classList.remove('bl-plan-col--over'));
  _planDragCode = null;
}

function _planDrop(e, col, targetCol, listEl) {
  e.preventDefault();
  // T-202605-028: limpiar en el destino exacto que recibió el drop
  if (col) col.classList.remove('bl-plan-col--over');
  if (!_planDragCode) return;

  const item = getItems().find(i => i.code === _planDragCode);
  if (!item) return;

  if (targetCol === 'left') {
    const currentSprint = item.sprint;
    if (!currentSprint) return;
    setItemSprint(item.code, '');
  } else {
    const targetSprintId = targetCol;
    if (!targetSprintId) return;
    if (item.sprint === targetSprintId) return;
    // T-202606-133: gate formallyOpened — bloquear drop sobre sprint no aprobado
    const destSprint = _getSprintById(targetSprintId);
    if (destSprint && destSprint.formallyOpened === false) {
      showToast('warning', 'Sprint pendiente de aprobación — el founder debe aprobarlo antes de asignar ítems');
      return;
    }
    setItemSprint(item.code, targetSprintId);
    // T-202606-092: si el ítem es R, mover Ts hijos activos al mismo sprint
    if (itemKind(item) === 'REQ') {
      const activeStatuses = new Set(['pendiente', 'en-revision']);
      const childTs = getItems().filter(i =>
        i.parentId === item.code &&
        itemKind(i) === 'TKT' &&
        activeStatuses.has(i.status)
      );
      childTs.forEach(t => setItemSprint(t.code, targetSprintId));
      if (childTs.length > 3) {
        showToast('t-neutral', `R movido · ${childTs.length} Ts al sprint ${targetSprintId}`);
      }
    }
  }

  // B-202606-034: re-renderizar usando el listEl del closure de _attachPlanViewDelegation.
  // getElementById('backlog-list') existe en el DOM aunque oculto — resolverlo desde
  // el closure garantiza que el re-render va al container visible correcto.
  if (listEl) _renderPlanningView(listEl);
}

// T-202605-054: delegación de eventos para #backlog-list — plan view drag handlers
// Cubre: _planDragStart · _planDragEnd · dragenter/dragover/dragleave (inline) · _planDrop
// T-202605-028: data-plan-col ahora puede ser 'left' o un sprintId real
// B-202606-034: acepta listEl como parámetro — desde tab Sprint el container es
// #sprint-planificar-container, no #backlog-list. Sin el parámetro los listeners
// se adjuntaban al elemento equivocado y el drop nunca disparaba.
export function _attachPlanViewDelegation(listEl) {
  if (!listEl) listEl = document.getElementById('backlog-list');
  if (!listEl || listEl._planDelegationAttached) return;
  listEl._planDelegationAttached = true;

  listEl.addEventListener('dragstart', function _planViewDragStart(e) {
    const card = e.target.closest('.bl-plan-card');
    if (!card) return;
    _planDragStart(e, card);
  });
  listEl.addEventListener('dragend', function _planViewDragEnd(e) {
    const card = e.target.closest('.bl-plan-card');
    if (!card) return;
    _planDragEnd(e, card);
  });
  listEl.addEventListener('dragenter', function _planViewDragEnter(e) {
    // B-202606-034: preventDefault en toda la zona del listEl — el browser requiere
    // que dragenter (además de dragover) no cancele para mantener el drop habilitado.
    // Se llama antes del guard de col para que contenedores intermedios sin
    // data-plan-col (bl-plan-col-header, bl-plan-dest-list) no cancelen la operación.
    e.preventDefault();
    const col = e.target.closest('[data-plan-col]');
    if (!col) return;
    // B-202606-040: limpiar --over en todos los destinos antes de activar el nuevo —
    // dragleave no se dispara de forma confiable al moverse entre sprints destino,
    // lo que deja la clase activa en el sprint de origen. dragenter es el único
    // punto donde se conoce el destino nuevo con certeza.
    listEl.querySelectorAll('[data-plan-col]').forEach(c => c.classList.remove('bl-plan-col--over'));
    col.classList.add('bl-plan-col--over');
  });
  listEl.addEventListener('dragover', function _planViewDragOver(e) {
    // B-202606-034: preventDefault antes del guard — si el cursor pasa por un
    // contenedor intermedio sin data-plan-col (bl-plan-col-header, bl-plan-dest-list)
    // el browser cancelaba el drop. Llamar preventDefault() siempre dentro del listEl
    // mantiene la operación activa en toda la zona de drop válida.
    e.preventDefault();
    const col = e.target.closest('[data-plan-col]');
    if (!col) return;
    e.dataTransfer.dropEffect = 'move';
    col.classList.add('bl-plan-col--over');
  });
  listEl.addEventListener('dragleave', function _planViewDragLeave(e) {
    // B-202606-034: dragleave solo actúa cuando el cursor sale del listEl completo —
    // dragenter ya limpia --over entre columnas en §594. Si relatedTarget sigue dentro
    // de listEl el movimiento es inter-columna y no hay nada que limpiar aquí.
    if (listEl.contains(e.relatedTarget)) return;
    listEl.querySelectorAll('[data-plan-col]').forEach(c => c.classList.remove('bl-plan-col--over'));
  });
  listEl.addEventListener('drop', function _planViewDrop(e) {
    // B-202606-039: e.target puede ser el wrapper .bl-plan-col--right (sin data-plan-col)
    // cuando el drop cae en el gap entre sprint cards. Intentar también con
    // .bl-plan-dest-sprint que sí declara data-plan-col con el sprintId.
    const col = e.target.closest('[data-plan-col]') || e.target.closest('.bl-plan-dest-sprint');
    if (!col || !col.dataset.planCol) return;
    _planDrop(e, col, col.dataset.planCol, listEl);
  });

  listEl.addEventListener('click', function _planViewClick(e) {
    // T-202606-091: toggle colapso de sprint destino — delegación en el header completo
    const collapseBtn = e.target.closest('[data-action="bl-plan-dest-collapse"]');
    if (collapseBtn) {
      const destSprint = collapseBtn.closest('.bl-plan-dest-sprint');
      if (!destSprint) return;
      const body    = destSprint.querySelector('.bl-plan-col-body');
      const chevron = collapseBtn.querySelector('.bl-plan-dest-chevron');
      if (!body) return;
      const isCollapsed = destSprint.classList.contains('is-collapsed');
      destSprint.classList.toggle('is-collapsed', !isCollapsed);
      body.classList.toggle('is-hidden', !isCollapsed);
      if (chevron) chevron.classList.toggle('is-rotated', !isCollapsed);
      return;
    }

    // TKT1 (REQ CAEL-0717-01): toggle del bloque Terminados en Q-Backlog (Sin Sprint) —
    // mismo criterio que el toggle de sprint destino de arriba (AC5).
    const doneToggle = e.target.closest('[data-action="bl-plan-done-toggle"]');
    if (doneToggle) {
      _togglePlanDoneGroup(doneToggle);
      return;
    }

    const btn = e.target.closest('[data-action="bl-plan-close"]');
    if (!btn) return;
    // Volver al sub-tab Ítems — event dispatch para evitar ciclo con locus-sprint.js
    window.dispatchEvent(new CustomEvent('sprint:switch-subtab', { detail: { subtab: 'items', triggerBtn: document.getElementById('spt-tab-items') || null } }));
  });

  // TKT1 (REQ CAEL-0717-01) AC6: Enter/Space sobre el header Terminados (tabindex="0")
  // produce el mismo toggle que el click — accesibilidad de teclado, mismo patrón de
  // delegación sobre listEl que el resto de handlers de este bloque.
  listEl.addEventListener('keydown', function _planViewKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const doneToggle = e.target.closest('[data-action="bl-plan-done-toggle"]');
    if (!doneToggle) return;
    e.preventDefault();
    _togglePlanDoneGroup(doneToggle);
  });
}

// TKT1 (REQ CAEL-0717-01): toggle compartido entre click y keydown — evita duplicar la
// lógica de aria-expanded/is-hidden/chevron entre los dos listeners de arriba.
function _togglePlanDoneGroup(headerEl) {
  const group = headerEl.closest('.bl-plan-done-group');
  if (!group) return;
  const body    = group.querySelector('.bl-plan-done-body');
  const chevron = headerEl.querySelector('.bl-plan-dest-chevron');
  if (!body) return;
  const isHidden = body.classList.contains('is-hidden');
  body.classList.toggle('is-hidden', !isHidden);
  headerEl.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
  if (chevron) chevron.textContent = isHidden ? '▾' : '▸';
  // TKT2 (REQ CAEL-0717-01): persistir el nuevo estado — sobrevive al próximo re-render
  // disparado por _planDrop().
  _planDoneExpanded = isHidden;
}

// Handler de cierre de la vista Planificación desde el tab Sprint.
// Se registra en #sprint-planificar-container — separado de #backlog-list.
export function _attachPlanCloseHandler() {
  const container = document.getElementById('sprint-planificar-container');
  if (!container || container._planCloseAttached) return;
  container._planCloseAttached = true;
  container.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action="bl-plan-close"]');
    if (!btn) return;
    window.dispatchEvent(new CustomEvent('sprint:switch-subtab', { detail: { subtab: 'items', triggerBtn: document.getElementById('spt-tab-items') || null } }));
  });
}
