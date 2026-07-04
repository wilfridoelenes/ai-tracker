// [PP] mod:68 · autor:Rune · 2026-07-05 UTC-6
// TKT1 (limpieza post-rename): comentario en L48 actualizado — describía capacidad vigente referenciando locus-backlog-archive.js; corregido a locus-backlog-historico.js. Notas históricas de L3/L25 (documentan el rename en sí) se conservan sin cambio.
// REQ-[pendiente-ID] Unificar vocabulario historico — TKT2 (continuación): call sites
// actualizados hacia locus-backlog-historico.js (ex locus-backlog-archive.js, ver TKT2 en
// ese archivo, mod:22): import renombrado (renderArchivoHistorico→renderHistoricoSection,
// getArchivoHistoricoCount→getHistoricoCount, getArchivoHistoricoStats→getHistoricoStats) +
// los 3 call sites correspondientes + comentarios que documentan arquitectura actual (no
// changelog histórico) actualizados al nombre nuevo de archivo/función. Sin cambio de
// comportamiento — mismo contrato, mismos parámetros, mismo valor de retorno. No incluye:
// no toca comentarios de mods anteriores que narran "Antes: [nombre viejo]" (registro
// histórico, ver header de locus-backlog-historico.js §criterio) ni el import huérfano ya
// documentado como removido (toggleArchivoHistorico, línea de mod:66 arriba).
// [PP] mod:66 · autor:Rune · 2026-07-04 UTC-6
// INC-[pendiente-ID]: fix — renderSprintGroup() no renderizaba ítems con status:'historico' en
// grupos de sprint cerrado (isClosed:true). _rootPool y el bloque "Done items sueltos" excluían
// 'historico' sin excepción — _buildChildMap ya tenía includeHistorico para los hijos (línea 96)
// pero nunca se propagó a los filtros de root ni al bloque de done-sueltos. Efecto: el header del
// grupo pinta bien (doneInGroup cuenta 'historico') pero #vbody-[groupId] queda vacío al expandir.
// Fix: cuando isClosed:true, _rootPool ya no excluye 'done'/'historico' — se renderiza todo salvo
// 'descartado', igual que antes para el caso no-cerrado. El bloque "Done items sueltos" se omite
// por completo cuando isClosed:true — queda cubierto por el _rootPool ampliado, evita duplicado.
// Afecta ambos consumidores de renderSprintGroup: panel Histórico (locus-backlog-historico.js) y
// Backlog Vista Lista al mostrar un sprint closed.
// TKT1 (REQ-[pendiente-ID] Consolidar wiring de Histórico): _initHistoricoSubTab eliminado —
// renderHistoricoPanel pasa a ser el único listener de 'shell:render-historico'. Imports
// huérfanos removidos: toggleArchivoHistorico (locus-backlog-archive.js, export eliminado) y
// toggleClosedSprintsBody (locus-sprint-planificacion.js, dead code eliminado en ese archivo).
// TKT1 (REQ-[pendiente-ID] unificar renderer de #active-filter-chips): updateClearFilterBtn()
//   reducida a delegar en renderActiveFilterChips() (core.js) — ya no construye innerHTML de
//   #active-filter-chips ni referencia #bl-filter-badge/#fbar-filter-btn (elementos inexistentes
//   desde el REQ de consolidación de toolbar). Listener shell:backlog-filter-changed duplicado
//   eliminado — queda solo el de core.js. inline_fix: imports huérfanos removidos.
// TKT (fix groupId): renderSprintGroup acepta contextPrefix — ver comentario en la función.
//   Reaplicado sobre mod:60 (simplificación _useVistaLista, TKT-[pendiente-ID] paralelo) —
//   sin conflicto, cuerpos no se solapan.
// TKT-[pendiente-ID]: eliminada la condición tautológica _useVistaLista (kanban ya desvía
//   incondicionalmente en L926, anterior en el flujo) — llamada directa a _renderVistaLista().
//   Variable html huérfana eliminada — sin otro uso en la función tras la simplificación.
// mod:59 · autor:Rune · TKT-[pendiente-ID] (REQ-[pendiente-ID] unificar render Sin AC — resuelve INC-[pendiente-ID]):
//   _useVistaLista ya no excluye noAc — pendienteItems (ya filtrado por _getBacklogNoAcMode() en
//   L957) se enruta por _renderVistaLista() en vez de un path standalone que nunca los renderizaba
//   (bug: filtro 'Sin AC' dejaba el backlog list en blanco). Bloque Cerradas/empty-state/tail
//   duplicado del path noAc eliminado — inalcanzable tras el cambio de condición.
// mod:58 · autor:Rune: eliminados _renderVistaC, _vcDoToggle y la variable huérfana
//   _useSprintGroups — sin caller desde R-202606-017. Import de _vcCollapseGet/_vcCollapseSet
//   removido — sin otro consumidor en el módulo. Sin cambio de comportamiento visible.
// TKT1 (REQ Histórico unificado con Vista Lista de Backlog): extraído renderSprintGroup(sprintItems, isClosed)
//   de _renderVistaLista — bloque de header+progress bar+jerarquía R→hijos+done items de un grupo-por-sprint,
//   ahora reusable e invocable desde locus-backlog-historico.js. Función pura respecto a filtros/búsqueda del
//   módulo (no usa _matchesQuery/_getActiveStatuses/_sortGroup internamente) — el caller decide qué items son
//   visibles y los pasa ya filtrados/ordenados en sprintItems. _warmHistoricoCacheIfNeeded() se movió fuera de
//   la función extraída (era un side effect no declarado en el contrato — contract_detail declara sideEffects:
//   ninguno) — ahora vive en el caller, antes de invocar renderSprintGroup.
//   Deuda declarada (ver CHECKPOINT de esta sesión): antes childMap se construía siempre desde el universo
//   completo del sprint (getItems()/_getAllItemsWithHistorico() sin filtrar), por lo que los hijos anidados
//   bajo un R ignoraban los filtros activos de búsqueda/status/tipo. Con la extracción, childMap se construye
//   desde sprintItems (ya filtrado por el caller) — los hijos anidados ahora respetan los mismos filtros que
//   los ítems raíz. Cambio de comportamiento menor y consistente (no bloqueante) — registrado como DISC.
// TKT1 REQ2 S'02: isZone de renderQBacklogPanel/renderQDiscPanel y _updateSubtabBadges
//   migrados a _isQBacklogActive/_isQDiscActive (excluye descartado/promoted).
// TKT3 REQ2 S'02: stats-bar interactiva (_renderZonePanel) — chips de tipo/prioridad,
//   delegación de click propia por bodyId, reuso 100% de clases .qinc-stats-bar de Q-INC.
// inline_fix TKT3: _statsBarHtml se calculaba pero nunca se inyectaba en body.innerHTML —
//   corregido en las dos ramas de salida (filtro vacío y grid con ítems).
// [tmp:tkt-isqinc-unify]: _isQInc local (renderBacklogList) y _isQIncItem local (renderQIncPanel,
//   _updateSubtabBadges) eliminadas. Todos los call sites usan isQIncItem() importada desde
//   locus-backlog-core.js.
// TKT-C7 fix: bl-icebox-item-alert→bl-done-item-alert (L1300-1302) — consume mod:54 de Nova,
//   resuelve conflicto entre clase CSS eliminada y código JS activo que la generaba.
// TKT-C1 (REQ-C): _updateSubtabBadges migrada — badgeIcebox (Gen1, tpl-badge-icebox eliminado
//   en TKT-C6) reemplazado por badgeQBacklog (tpl-badge-qbacklog) + badgeQDisc (tpl-badge-qdisc),
//   usando _isQBacklog/_isQDisc/_zoneStaleness. _isBacklogScope: sId==='icebox'→_isQBacklog/_isQDisc.
//   Bloque if(false) de sprint-grupos con _isIcebox/_iceboxStaleness eliminado (287 líneas de
//   código muerto desde R-202606-017, __BR-Execution §2 Sin retrocompatibilidad).
// T-202606-093: AC-2/AC-4 corregidos — _updateSubtabBadges() desacoplada de renderBacklogList(),
//   ahora llamada hermana en sus call sites reales (shell:backlog-render-dirty · shell:render-backlog-list)
// inline_fix: restaurado bloque if/else de placeholder de búsqueda y separación de comentario/función
//   que se corrompieron en mod:27 (T-202606-093, primera implementación)
// T-202606-093: _updateSubtabBadges — actualización reactiva de badges icebox/qinc/histórico
// B-202606-052: renderIceboxPanel implementada + listener sstab-btn-icebox + re-render en shell:backlog-render-dirty
// T-202606-166: _getActiveProjectFilter importada desde locus-storage.js
// T-202606-167: openProjPanel desacoplada — dispatch shell:open-proj-panel en lugar de import directo
// T-202606-163: _iceboxStaleness — alertas diferenciadas por tipo en vista icebox
import { renderHistoricoSection, getHistoricoCount, getHistoricoStats } from './locus-backlog-historico.js';
import { _hasDepsBlocked, _isBlocked, _isCountableItem, _isQBacklog, _isQBacklogActive, _isQDisc, _isQDiscActive, isQIncItem, _skelHide, _skelShow, _undoSnapshot, itemKind, renderStats, renderActiveFilterChips, updateStatusFilterUI, _getBacklogKanbanMode, _getBacklogNoAcMode, _getActiveTypes, _getActiveStatuses, _getActiveEfforts, _getActivePriorityFilter, _getDepsFilter, _getBacklogSortMode, _getBacklogSortDir, _getBacklogSearchQuery, _getCollapsedVersions, toggleVersionCollapse, toggleSectionGroup, getDoneItems, getItems, _nsGetTypes, _nsGetStatuses, _nsGetPriority, _nsGetQuery, _nsSetQuery, _nsToggleType, _nsTogglePriority, _nsReset } from './locus-backlog-core.js'; // TKT1 REQ unificar chips: renderActiveFilterChips agregada · toggleTypeFilter/toggleStatusFilter/toggleEffortFilter/toggleBacklogNoAcMode huérfanos removidos (inline_fix)

import { _attachBacklogDnD, _attachBacklogListDelegation, _resetBacklogListDelegation, _collapsedChildren, _renderKanban, buildBacklogItem, buildQIncItem, updateBacklogFooter } from './locus-backlog-item.js'; // B-202606-023: _resetBacklogListDelegation · TKT-B2b: buildQIncItem

import { _getActiveSprint, _getSprintById, openSprintRetroView, setItemSprint } from './locus-backlog-sprints.js';

import { _setBacklogModified } from './locus-docs.js';

import { _getActiveProjectFilter, getActiveSprints, saveBacklog, refreshHistoricoCache, getHistoricoItemsSync } from './locus-storage.js';

import { showToast } from './locus-toast.js';

import { esc } from './locus-ui-shell.js';
import { _renderPlanningView, _attachPlanViewDelegation, _statusPills } from './locus-sprint-planificacion.js';
import { _updateDocLogCount } from './locus-doc-log.js';

// Responsabilidad: Renderizado del backlog — vista Lista (sprint groups + jerarquía R→T/B),
//   sprint health panel, roadmap, planning (drag & drop), renderBacklogList, sprint selector inline.
// Dependencias: locus-backlog-core.js · locus-backlog-historico.js · locus-backlog-item.js · locus-backlog-sprints.js

// T-202606-022: _buildChildMap — agrupación de hijos por R con sort topológico por depends_on
// Recibe los ítems de un sprint y retorna Map: rCode → [hijos ordenados]
// INC-[pendiente-ID] TKT1: includeHistorico (default false) — cuando true, hijos con status
// 'historico' se incluyen en el árbol igual que cualquier otro status. Default false preserva
// el contrato original para todo consumidor existente (ver L1397, sin segundo argumento — sin
// cambio de comportamiento). Único caller con includeHistorico:true es _renderVistaLista para
// grupos de sprint closed.
// TKT1 (REQ Histórico unificado): hoisted a module scope — antes declarado localmente dentro de
// _renderVistaLista y de _updateSubtabBadges. Única fuente ahora, reusada por renderSprintGroup.
function _extractSprintId(s) {
  return (s || '').split(' · ')[0].trim();
}

export function _buildChildMap(sprintItems, includeHistorico = false) {
  // Conjunto de códigos R presentes en sprintItems — gate de parentId válido
  const rCodesInSprint = new Set(
    sprintItems.filter(i => itemKind(i) === 'REQ').map(i => i.code)
  );

  // Recopilar hijos: Ts y Bs con parentId apuntando a un R del sprint, excluyendo históricos
  // salvo que includeHistorico:true lo solicite explícitamente.
  const childrenByR = new Map();
  for (const r of rCodesInSprint) childrenByR.set(r, []);

  for (const item of sprintItems) {
    const t = itemKind(item);
    if (t !== 'TKT' && t !== 'INC') continue;
    if (item.status === 'historico' && !includeHistorico) continue;
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
export function toggleChildrenBlock(rCode) {
  if (_collapsedChildren.has(rCode)) {
    _collapsedChildren.delete(rCode);
  } else {
    _collapsedChildren.add(rCode);
  }
  const body = document.getElementById('req-children-body-' + CSS.escape(rCode));
  const arrow = document.getElementById('req-children-arrow-' + CSS.escape(rCode));
  if (body) body.classList.toggle('collapsed', _collapsedChildren.has(rCode));
  if (arrow) arrow.textContent = _collapsedChildren.has(rCode) ? '▸' : '▾';
}

// R-202604-016: asignar parent a un T/B desde item-body
export function setItemParent(code, parentCode) {
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  item.parentId = parentCode || null;
  // T-[pendiente-ID]: parentId es el único campo canónico en JS (REQ-unify-parent TKT2).
  // El bridge a item.parent introducido en el fix anterior (INC) se elimina — _toItemRow()
  // ya no lee it.parent, lee exclusivamente it.parentId.
  // B-[pendiente-ID]: heredar sprint del R padre al asignar parentId desde card expandido —
  // _buildChildMap filtra hijos por sprintItems del grupo del R. Si el sprint del T no coincide
  // con el del R, el hijo no aparece anidado aunque parentId esté correctamente asignado.
  // Mismo comportamiento que mergeBacklogFromTG (_parentSprint) y applyPatchesFromTG (sprint patch en R).
  if (parentCode) {
    const parentItem = getItems().find(i => i.code === parentCode);
    if (parentItem) {
      // Propagar sprint del R padre — Q-Backlog se representa como '' (sin retrocompatibilidad
      // con 'icebox', __BR-Execution §2). Consistente con _buildChildMap y herencia de B-202606-083.
      item.sprint = parentItem.sprint || '';
    }
  }
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  _markBacklogListDirty(); renderBacklogList();
  renderStats();
  showToast('success', parentCode ? `${code} vinculado a ${parentCode}` : `${code} desvinculado`);
}

// TKT1 (REQ unificar renderer de #active-filter-chips): reducida a su función real —
// visibilidad de #filter-clear-btn. El chip-render de #active-filter-chips (con cobertura
// completa de 7 tipos y ambos estados de deps) queda delegado en renderActiveFilterChips()
// de locus-backlog-core.js, que ahora también deriva el toggle is-hidden de este botón desde
// chips.length===0 — criterio que ya incluye deps, gap que este isDefault local no cubría.
export function updateClearFilterBtn() {
  renderActiveFilterChips();
}

// T-202604-213: _statusPills — migrada a locus-sprint-planificacion.js (B-202605-046)
// R-202605-103: toggleClosedSprintsBody — migrada a locus-sprint-planificacion.js (B-202605-046)

// INC-[pendiente-ID] TKT1: universo completo de ítems (activos + historico) con dedupe por code.
// getItems() (locus-backlog-core.js) nunca incluye status:historico desde T-202606-106 (_setITEMS) —
// consumidores que necesitan contar/anidar ítems de un sprint closed deben mergear con
// getHistoricoItemsSync(), ver invariant en _Locus-module-contracts.md.
// No dispara refreshHistoricoCache() por su cuenta — ver _warmHistoricoCacheIfNeeded() más abajo,
// que la garantiza tibia de forma no-bloqueante sin propagar async a renderBacklogList() y sus
// ~30 call sites (__BR-Execution §2 — mínimo impacto lateral).
function _getAllItemsWithHistorico() {
  const _active = getItems();
  const _historico = getHistoricoItemsSync();
  if (!_historico.length) return _active;
  const _seen = new Set(_active.map(i => i.code));
  const _merged = _active.slice();
  _historico.forEach(i => { if (!_seen.has(i.code)) { _merged.push(i); _seen.add(i.code); } });
  return _merged;
}

// INC-[pendiente-ID] TKT1: cache de historico tibio para sprints closed en Vista Lista.
// Mismo patrón que renderHistoricoPanel() (L1696) pero no-bloqueante — _renderVistaLista es
// llamada sync desde renderBacklogList(), con ~30 call sites en 12 archivos que no pueden
// volverse async sin impacto lateral fuera de scope de este TKT. Si el cache está frío
// (getHistoricoItemsSync() vacío) y hay al menos un sprint closed en pantalla, se refresca
// en background y se dispara un re-render cuando esté listo — mismo patrón fire-and-forget
// ya usado en el ecosistema para no bloquear el primer paint.
let _historicoCacheWarmupInFlight = false;
function _warmHistoricoCacheIfNeeded(hasClosedSprintInView) {
  if (!hasClosedSprintInView) return;
  if (getHistoricoItemsSync().length) return; // ya tibio
  if (_historicoCacheWarmupInFlight) return;
  _historicoCacheWarmupInFlight = true;
  refreshHistoricoCache().then(() => {
    _historicoCacheWarmupInFlight = false;
    _markBacklogListDirty();
    renderBacklogList();
  }).catch(() => { _historicoCacheWarmupInFlight = false; });
}

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
  // B-202606-018: normalizar campo sprint del ítem para incluir ítems con label completo
  const _extId = s => s.split(' · ')[0].trim();
  const spItems = getItems().filter(i => _extId((i.sprint || '').trim()) === sprintId && i.status === 'pendiente');
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

// T-202606-163 / TKT-C1: _zoneStaleness (antes _iceboxStaleness) — umbral de alerta por tipo de ítem
// en vista Q-Backlog/Q-DISC. Umbrales: R y T → 14d · P → 30d · B priority:high → 7d · B priority no-high → sin alerta
// Referencia: statusChangedAt || createdAt. Retorna { days, label } o null si no aplica.
function _zoneStaleness(item) {
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

// R-202606-017 · T-202606-061: Vista Lista — sprint groups + jerarquía R→T/B por defecto
// Reemplaza la lógica combinada de _renderVistaC + bloque _useSprintGroups.
// Parámetros: listEl, pendienteItems, doneItems, terminalItems ya filtrados por renderBacklogList;
//   terminalItems: R/T/B descartado + P descartado + P promovida — bloque Cerradas unificado
//   _matchesQuery y _sortGroup vienen de renderBacklogList para reutilizar la lógica existente.
// TKT1 (REQ Histórico unificado con Vista Lista de Backlog): render de un grupo-por-sprint
// (header + progress bar + jerarquía R→hijos + done items). Extraída de _renderVistaLista.
//
// Contrato (contract_detail, TKT1): recibe sprintItems e isClosed como únicos parámetros.
// sprintItems = todos los ítems visibles de UN sprint, ya filtrados y ordenados por el caller
// (root primero, luego done/historico) — la función no aplica búsqueda ni filtros de status/tipo,
// no depende de _matchesQuery/_getActiveStatuses/_sortGroup ni de ningún estado privado de UI.
// sin sideEffects — no dispara warmup de cache ni cualquier otra mutación; eso es responsabilidad
// del caller (ver _warmHistoricoCacheIfNeeded en _renderVistaLista, antes de invocar esta función).
//
// sprintId se deriva de sprintItems[0].sprint — la función retorna '' si sprintItems está vacío
// (el caso de header vacío para sprint activo/programado sin ítems se maneja fuera, en el caller
// de Backlog Vista Lista — ver _emptySprintHeaderHtml — porque no hay item del cual derivar sprintId).
// TKT (fix groupId): contextPrefix namespacing — omitido/'' preserva el groupId y la fuente
// de colapso actuales de Backlog Vista Lista (_getCollapsedVersions(), Set global en core.js).
// contextPrefix:'hist' (único otro caller: locus-backlog-historico.js) namespacea el groupId
// para que nunca colisione con el de Vista Lista, y lee el estado de colapso desde
// localStorage['arch-collapsed-'+groupId] — mismo key que ya escribe
// _attachArchChildToggleDelegation() al togglear, antes desalineado con el Set global que
// esta función leía sin distinguir contexto.
export function renderSprintGroup(sprintItems, isClosed, contextPrefix) {
  if (!sprintItems || !sprintItems.length) return '';

  const sprintId = _extractSprintId((sprintItems[0].sprint || '').trim());
  const sprintObj  = _getSprintById(sprintId);
  const isActive   = sprintObj?.status === 'active';
  const isPlanned  = !isActive && !isClosed;
  const label      = sprintObj ? (sprintObj.label || sprintId) : sprintId;
  const _prefix    = contextPrefix ? contextPrefix + '-' : '';
  const groupId    = _prefix + 'vl-' + sprintId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const isCollapsed = contextPrefix
    ? (() => { try { return localStorage.getItem('arch-collapsed-' + groupId) === '1'; } catch { return false; } })()
    : _getCollapsedVersions().has(groupId);

  // Progress — sobre sprintItems (ver nota de fidelidad en header del archivo: en el caso
  // por defecto, sin filtros/búsqueda activos, sprintItems == universo completo del sprint,
  // resultado idéntico al comportamiento anterior).
  const doneInGroup  = sprintItems.filter(i => i.status === 'done' || i.status === 'historico').length;
  const totalInGroup = sprintItems.filter(i => i.status !== 'descartado').length;
  const pct = totalInGroup > 0 ? Math.round((doneInGroup / totalInGroup) * 100) : 0;

  const sprintStatusLabel = isActive
      ? `<span class="sprint-badge-active">activo</span>`
      : isClosed
        ? `<span class="sprint-badge-closed">cerrado</span>`
        : isPlanned
          ? `<span class="sprint-badge-planned">planificado</span>`
          : '';

  // Meta secundaria: velocity para activo, fecha de cierre para cerrado, effort estimado para planificado
  const _velLabel = isActive ? _sprintVelocityLabel(sprintId) : '';
  const _metaText = isClosed
    ? (sprintObj?.closedAt ? `${sprintObj.version_target || ''} · cerrado ${sprintObj.closedAt}`.trim().replace(/^·\s*/, '') : (sprintObj?.version_target || ''))
    : isPlanned
      ? (() => { const ef = sprintItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0); return ef ? `Effort estimado: ${ef}` : ''; })()
      : '';

  const progressBar = `<div class="bl-vl-sprint-header-progress">
    <div class="bl-vl-progress-track"><div class="bl-vl-progress-fill" style="--ver-bar-w:${pct}%"></div></div>
    <span class="bl-vl-progress-label">${doneInGroup}/${totalInGroup} · ${pct}%</span>
  </div>`;

  let html = `<div class="bl-vl-sprint-group${isActive ? ' sprint-group-active' : ''}${isClosed ? ' sprint-group-closed' : ''}${isPlanned ? ' sprint-group-planned' : ''}" data-sprint-id="${esc(sprintId)}">`;
  html += `<div class="bl-vl-sprint-header version-collapse-trigger" data-action="version-collapse" data-group-id="${groupId}" tabindex="0" role="button" aria-expanded="${isCollapsed ? 'false' : 'true'}">`;
  html += `<div class="bl-vl-sprint-header-row1">`;
  html += `<span class="version-header-arrow${isCollapsed ? ' collapsed' : ''}" id="varrow-${groupId}" aria-hidden="true">${isCollapsed ? '▸' : '▾'}</span>`;
  html += `<span id="sprint-label-wrap-${esc(sprintId)}"><span class="version-tag">${esc(sprintId)}</span>${(label && label !== sprintId) ? `<span class="sprint-name-label">${esc(label)}</span>` : ''}</span>`;
  html += sprintStatusLabel;
  html += `</div>`; // bl-vl-sprint-header-row1
  if (_velLabel || _metaText) {
    html += `<div class="bl-vl-sprint-header-meta">${_velLabel || esc(_metaText)}</div>`;
  }
  html += progressBar;
  html += `</div>`; // bl-vl-sprint-header

  html += `<div class="bl-vl-sprint-body${isCollapsed ? ' collapsed' : ''}" id="vbody-${groupId}">`;

  // Root: Rs con hijos anidados + T/B/P sueltos que no son done/historico/descartado
  {
    // childMap ahora se construye desde sprintItems (visible/filtrado por el caller) — antes se
    // construía desde el universo completo sin filtrar. Ver deuda declarada en header del archivo.
    const _childMap = _buildChildMap(sprintItems, isClosed);
    const _rCodesInGroup = new Set(sprintItems.filter(i => itemKind(i) === 'REQ').map(i => i.code));
    // INC-[pendiente-ID]: en grupo cerrado (isClosed:true) todos los ítems terminan en
    // 'done'/'historico' — excluirlos de _rootPool dejaba el body sin nada que renderizar.
    // isClosed:true → solo se excluye 'descartado'. isClosed:false conserva el comportamiento
    // original (done/historico se muestran vía el bloque "Done items sueltos" más abajo).
    const _rootPool = isClosed
      ? sprintItems.filter(i => i.status !== 'descartado')
      : sprintItems.filter(i => i.status !== 'done' && i.status !== 'historico' && i.status !== 'descartado');

    const _rootItems = _rootPool.filter(i => {
      if (itemKind(i) === 'REQ') return true;
      return !i.parentId || !_rCodesInGroup.has(i.parentId);
    });

    _rootItems.forEach(item => {
      const t = itemKind(item);

      if (t !== 'REQ') {
        html += buildBacklogItem(item);
        return;
      }

      const _children = _childMap.get(item.code) || [];

      if (_children.length > 0) {
        const _collapseKey = 'locus-r-collapsed-' + item.code;
        const _isRCollapsed = localStorage.getItem(_collapseKey) === '1';

        html += `<div class="bl-vl-req" data-r-code="${esc(item.code)}">`;
        html += buildBacklogItem(item);
        html += `<button class="bl-r-toggle${_isRCollapsed ? ' collapsed' : ''}" data-action="vl-toggle-r" data-r-code="${esc(item.code)}" aria-label="Colapsar/expandir hijos" title="Colapsar/expandir hijos" type="button"></button>`;
        html += `<div class="bl-vl-req-body${_isRCollapsed ? ' collapsed' : ''}" id="bl-vl-req-body-${esc(item.code)}">`;
        _children.forEach(child => {
          html += `<div class="bl-child-row">${buildBacklogItem(child)}</div>`;
        });
        html += `</div>`; // bl-vl-req-body
        html += `</div>`; // bl-vl-req
      } else {
        html += buildBacklogItem(item);
      }
    });
  }

  // Done items sueltos — no anidados bajo un R ya renderizado en el bloque root.
  // INC-[pendiente-ID]: en grupo cerrado (isClosed:true) el _rootPool ampliado ya cubrió done Y
  // historico — repetir este bloque duplicaría el render. Solo corre para grupos no cerrados.
  if (!isClosed) {
    const _rCodesInGroupForDone = new Set(sprintItems.filter(i => itemKind(i) === 'REQ').map(i => i.code));
    const _doneFlat = sprintItems.filter(i => {
      if (i.status !== 'done') return false;
      const t = itemKind(i);
      if ((t === 'TKT' || t === 'INC') && i.parentId && _rCodesInGroupForDone.has(i.parentId)) return false;
      return true;
    });
    if (_doneFlat.length) html += _doneFlat.map(item => buildBacklogItem(item)).join('');
  }

  html += `</div>`; // bl-vl-sprint-body
  html += `</div>`; // bl-vl-sprint-group
  return html;
}

// TKT1: header-only para sprint activo/programado sin ningún ítem visible — caso que
// renderSprintGroup no puede cubrir (sin ítems no hay de dónde derivar sprintId). Exclusivo
// de Backlog Vista Lista. Progress 0/0 · 0% — sin body de ítems.
function _emptySprintHeaderHtml(sprintId, sprintObj) {
  const isActive  = sprintObj?.status === 'active';
  const isPlanned = !isActive;
  const label     = sprintObj ? (sprintObj.label || sprintId) : sprintId;
  const groupId   = 'vl-' + sprintId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const isCollapsed = _getCollapsedVersions().has(groupId);
  const sprintStatusLabel = isActive
    ? `<span class="sprint-badge-active">activo</span>`
    : `<span class="sprint-badge-planned">planificado</span>`;
  const _velLabel = isActive ? _sprintVelocityLabel(sprintId) : '';

  let html = `<div class="bl-vl-sprint-group${isActive ? ' sprint-group-active' : ''}${isPlanned ? ' sprint-group-planned' : ''}" data-sprint-id="${esc(sprintId)}">`;
  html += `<div class="bl-vl-sprint-header version-collapse-trigger" data-action="version-collapse" data-group-id="${groupId}" tabindex="0" role="button" aria-expanded="${isCollapsed ? 'false' : 'true'}">`;
  html += `<div class="bl-vl-sprint-header-row1">`;
  html += `<span class="version-header-arrow${isCollapsed ? ' collapsed' : ''}" id="varrow-${groupId}" aria-hidden="true">${isCollapsed ? '▸' : '▾'}</span>`;
  html += `<span id="sprint-label-wrap-${esc(sprintId)}"><span class="version-tag">${esc(sprintId)}</span>${(label && label !== sprintId) ? `<span class="sprint-name-label">${esc(label)}</span>` : ''}</span>`;
  html += sprintStatusLabel;
  html += `</div>`;
  if (_velLabel) html += `<div class="bl-vl-sprint-header-meta">${_velLabel}</div>`;
  html += `<div class="bl-vl-sprint-header-progress">
    <div class="bl-vl-progress-track"><div class="bl-vl-progress-fill" style="--ver-bar-w:0%"></div></div>
    <span class="bl-vl-progress-label">0/0 · 0%</span>
  </div>`;
  html += `</div>`; // bl-vl-sprint-header
  html += `<div class="bl-vl-sprint-body${isCollapsed ? ' collapsed' : ''}" id="vbody-${groupId}"></div>`;
  html += `</div>`; // bl-vl-sprint-group
  return html;
}

function _renderVistaLista(listEl, pendienteItems, doneItems, terminalItems, _matchesQuery, _sortGroup, q, onRendered) {
  // B-202606-076 / TKT-C1: _isQBacklog/_isQDisc importadas desde locus-backlog-core.js — fuente única.
  // TKT (REQ-[pendiente-ID]): ítems ITIL (INC/PRB/KE/CHG con queue Q-INC) excluidos de #backlog-list —
  // panel dedicado vive en #sspanel-qinc (sub-tab Q-INC). Filtro legacy por sprint string-match eliminado.
  // [tmp:tkt-isqinc-unify]: _isQInc local eliminada — usa isQIncItem() importada desde locus-backlog-core.js.

  // T-202606-090 AC-6 / TKT-C1: ítems sin sprint (Q-Backlog/Q-DISC) excluidos de #backlog-list —
  // viven en renderQBacklogPanel()/renderQDiscPanel() (sub-tabs dedicados).
  // TKT (REQ-[pendiente-ID]): ítems ITIL excluidos del mismo modo — ver isQIncItem importada.
  const sprintableItems = pendienteItems.filter(i => !_isQBacklog(i) && !_isQDisc(i) && !isQIncItem(i));

  // Agrupar por sprint
  // B-202606-018: normalizar la clave a solo el ID del sprint — algunos ítems almacenan
  // el campo sprint con el label completo ("PP-S-01 · Nombre del sprint") mientras otros
  // solo almacenan el ID ("PP-S-01"). Sin normalización, Object.keys produce dos entradas
  // distintas para el mismo sprint → dos headers en la vista Lista.
  const sprintMap = {};
  sprintableItems.forEach(i => {
    const key = _extractSprintId((i.sprint || '').trim());
    if (!sprintMap[key]) sprintMap[key] = [];
    sprintMap[key].push(i);
  });

  // B-202606-002: sprints que solo tienen done items visibles no aparecen en sprintMap
  // (construido solo desde sprintableItems = pendientes). Registrarlos con array vacío
  // para que el loop de sprint groups los incluya y emita _doneInGroup.
  // TKT (REQ-[pendiente-ID]): done items ITIL excluidos del mismo modo que icebox —
  // sin esto, un sprint con solo done items ITIL generaría un group header vacío en #backlog-list.
  if (_getActiveStatuses().has('done')) {
    doneItems.forEach(i => {
      if (_isQBacklog(i) || _isQDisc(i) || isQIncItem(i)) return;
      const key = _extractSprintId((i.sprint || '').trim());
      if (!sprintMap[key]) sprintMap[key] = [];
    });
  }

  // B-068: sprints 'active' o 'scheduled' (programado) sin ningún ítem visible (ni pendiente
  // ni done) no entran a sprintMap por los dos bloques anteriores — su header desaparecía de
  // la Vista Lista. Se registran aquí con array vacío para que el forEach de sprint groups los
  // incluya siempre. Q-INC queda excluido — vive en su propio sub-tab (#sspanel-qinc), no en
  // #backlog-list. Sprints 'closed' quedan excluidos — su visibilidad sin ítems no es parte de
  // este AC y se rige por el comportamiento ya existente.
  getActiveSprints().forEach(s => {
    if (s.status !== 'active' && s.status !== 'scheduled') return;
    if (!sprintMap[s.id]) sprintMap[s.id] = [];
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
  // TKT1 (REQ Histórico unificado): el bloque de render por grupo se movió a renderSprintGroup()
  // (función pura, exportada, ver definición más arriba). Este loop solo arma sprintItems
  // (unión ya filtrada/ordenada de root+done+historico) y delega.
  sprintKeys.forEach(sprintId => {
    const group = sprintMap[sprintId];
    // B-202606-002: no descartar el grupo si tiene done items visibles aunque no tenga pendientes
    const _hasDoneInGroup = _getActiveStatuses().has('done') && doneItems.some(i => _extractSprintId((i.sprint || '').trim()) === sprintId);
    // B-068: no descartar el grupo si el sprint está active/scheduled — su header se muestra
    // siempre, con o sin ítems visibles. Ver bloque getActiveSprints().forEach() más arriba.
    const _sprintObjForGate = _getSprintById(sprintId);
    const _alwaysShowHeader = _sprintObjForGate && (_sprintObjForGate.status === 'active' || _sprintObjForGate.status === 'scheduled');
    if ((!group || !group.length) && !_hasDoneInGroup && !_alwaysShowHeader) return;

    const sprintObj = _getSprintById(sprintId);
    const isClosed  = sprintObj?.status === 'closed';

    // Side effect fuera de renderSprintGroup — ver nota de header del archivo (contract_detail
    // declara sideEffects: ninguno para la función extraída).
    _warmHistoricoCacheIfNeeded(isClosed);

    // Done items visibles del grupo (respeta filtro de status 'done' + búsqueda activa)
    // B-202606-048: excluir Ts/Bs done cuyo parentId apunta a un R visible en el grupo —
    // renderSprintGroup los anida bajo su R vía childMap, evita duplicado.
    const _rCodesInGroupForDone = new Set((group || []).filter(i => itemKind(i) === 'REQ').map(i => i.code));
    const _doneVisible = _getActiveStatuses().has('done')
      ? getItems().filter(i => {
          if (_extractSprintId((i.sprint || '').trim()) !== sprintId) return false;
          if (i.status !== 'done') return false;
          if (!_isCountableItem(i)) return false;
          if (!_matchesQuery(i)) return false;
          return true;
        })
      : [];

    // Historico visible cuando el sprint está cerrado — mismo universo con historico que antes.
    const _historicoVisible = isClosed
      ? _getAllItemsWithHistorico().filter(i => i.status === 'historico' && _extractSprintId((i.sprint || '').trim()) === sprintId)
      : [];

    // Orden: root (sorted) primero, done+historico (sorted) después — mismo orden que la
    // implementación anterior (root block seguido de done block, sin merge-then-sort).
    const _groupItems = [
      ..._sortGroup(group || []),
      ..._sortGroup([..._doneVisible, ..._historicoVisible])
    ];

    if (!_groupItems.length) {
      // Sprint activo/programado sin ningún ítem visible — caso fuera de alcance de
      // renderSprintGroup (requiere al menos 1 item para derivar sprintId internamente).
      // Exclusivo de Backlog Vista Lista — Histórico nunca lo enfrenta (TKT2 AC3 cubre
      // Histórico vacío con empty-state global, no headers de sprint por sprint).
      html += _emptySprintHeaderHtml(sprintId, sprintObj);
      return;
    }

    html += renderSprintGroup(_groupItems, isClosed);
  });

  // T-202606-090 AC-6 / TKT-C1: bloque "Icebox al final" eliminado de #backlog-list — los ítems
  // sin sprint (Q-Backlog/Q-DISC) se muestran en renderQBacklogPanel()/renderQDiscPanel() (sub-tabs).
  // TKT (REQ-[pendiente-ID]): ítems ITIL excluidos del mismo modo — ver #sspanel-qinc.

  // Cerradas — R/T/B descartado + P descartado + P promovida — bloque unificado
  // Solo visible cuando fstatus-descartado está activo (activeStatuses incluye 'descartado' y 'promovida')
  if (terminalItems.length && _getActiveStatuses().has('descartado')) {
    const cerradasOpen = localStorage.getItem('backlog-cerradas-open') === '1';
    const _promCount   = terminalItems.filter(i => i.status === 'promoted').length; // TKT-202606-009: Gen2 canónico — era 'promovida' legacy
    const _descPCount  = terminalItems.filter(i => i.status === 'descartado' && itemKind(i) === 'DISC').length;
    const _descRTBCount = terminalItems.filter(i => i.status === 'descartado' && itemKind(i) !== 'DISC').length;
    const _cerradasTitle = [
      _promCount    ? `${_promCount} promovida${_promCount !== 1 ? 's' : ''}`        : '',
      _descPCount   ? `${_descPCount} P descartada${_descPCount !== 1 ? 's' : ''}`  : '',
      _descRTBCount ? `${_descRTBCount} descartado${_descRTBCount !== 1 ? 's' : ''}` : ''
    ].filter(Boolean).join(' · ');
    html += `<div class="section-group sg-cerradas" id="sg-cerradas">
      <div class="section-group-header" data-action="section-group-toggle" data-group="cerradas">
        <span class="section-group-arrow" id="sgarrow-cerradas">${cerradasOpen ? '▾' : '▸'}</span>
        <span>Cerradas</span>
        <span class="section-group-count" title="${_cerradasTitle}">${terminalItems.length} ítem${terminalItems.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="section-group-body items-grid${cerradasOpen ? '' : ' collapsed'}" id="sgbody-cerradas">`;
    terminalItems.forEach(item => { html += buildBacklogItem(item); });
    html += `</div></div>`;
  }

  // T-202606-107: empty state diferenciado — backlog vacío real vs filtros ocultan todo
  const _hasVisible = pendienteItems.length || doneItems.length || (terminalItems.length && _getActiveStatuses().has('descartado'));
  if (!_hasVisible) {
    // hasItems: hay ítems contables antes de aplicar cualquier filtro
    const hasItems = getItems().length > 0;
    // hasFiltersActive: al menos un filtro no-default está activo (criterio exacto del AC)
    const _as = _getActiveStatuses();
    const hasFiltersActive = _getActiveTypes().size < 4
      || !_as.has('pendiente')
      || !_as.has('en-revision')
      || !!q
      || _getActiveEfforts().size < 3;

    let emptyIcon = '🔍', emptyTitle = '', emptyHint = '', emptyCTA = '';
    if (!hasItems) {
      // Backlog vacío real — ningún ítem en ITEMS
      emptyIcon  = '📋';
      emptyTitle = 'El backlog está vacío';
      emptyHint  = 'Importa un backlog para comenzar.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-import">Importar backlog</button>`;
    } else if (hasFiltersActive) {
      // Hay ítems pero los filtros ocultan todo
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

  // T-202606-092 AC-5: renderArchivoHistorico() ya no se invoca desde aquí — vive en
  // renderHistoricoPanel(), sub-tab dedicado. Antes: renderArchivoHistorico(listEl).

  // search-count
  const countEl = document.getElementById('search-count');
  if (countEl) {
    if (q) {
      const total = pendienteItems.length + doneItems.length + terminalItems.length;
      countEl.textContent = `${total} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    } else {
      countEl.textContent = '';
    }
  }

  _attachBacklogDnD();
  _resetBacklogListDelegation(); // B-202606-023: reset guard antes de re-registrar
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
    const body = document.getElementById('bl-vl-req-body-' + CSS.escape(rCode));
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
    const scopeCount = pendienteItems.length + doneItems.length + (_getActiveStatuses().has('descartado') ? terminalItems.length : 0);
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
      _markBacklogListDirty();
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
          <div class="empty-state-hint">El backlog necesita un sprint activo. La apertura de sprint se propone desde Cael (sprint_proposal) — no hay creación manual desde aquí.</div>
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
  // T-202606-102: Ps promovidas excluidas de pendienteItems — van a sección Cerradas
  let filtered = getItems().filter(i => {
    if (i.status === 'historico') return false;
    const type = itemKind(i);
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
  const _typeOrder = { INC: 0, TKT: 1, REQ: 2, DISC: 3 };
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
        const ta = _typeOrder[itemKind(a)] ?? 9, tb = _typeOrder[itemKind(b)] ?? 9;
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
  // [pendiente-ID]: promovida excluida de pendienteItems — va a terminalItems
  const pendienteItems = filtered.filter(i => i.status !== 'done' && i.status !== 'descartado' && !(itemKind(i) === 'DISC' && i.status === 'promoted')); // TKT-202606-009: Gen2 canónico
  const _matchesQuery = q
    ? (i => i.code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || (i.area || '').toLowerCase().includes(q))
    : () => true;
  const doneItems      = _getActiveStatuses().has('done')
    ? getDoneItems(_matchesQuery)  // T-202606-028: reutiliza getDoneItems global — evita getItems().filter() duplicado
    : [];
  // [pendiente-ID]: terminalItems — bloque Cerradas unificado
  // Incluye: R/T/B descartado + P descartado + P promovida
  // Solo visible cuando fstatus-descartado está activo (activeStatuses incluye 'descartado')
  // T-202606-060: typeOk aplicado sobre R/T/B — Ps siempre incluidas cuando el bloque es visible
  const terminalItems = _getActiveStatuses().has('descartado')
    ? getItems().filter(i => {
        const type = itemKind(i);
        if (type === 'DISC') return (i.status === 'descartado' || i.status === 'promoted') && _matchesQuery(i); // TKT-202606-009: Gen2 canónico
        const typeOk = type ? _getActiveTypes().has(type) : true;
        return i.status === 'descartado' && typeOk && _matchesQuery(i);
      })
    : [];

  // R-202606-017 / INC-[pendiente-ID] fix: Vista Lista es la única vía de render para pendienteItems —
  // el path noAc standalone nunca los renderizaba (bug: lista en blanco con filtro Sin AC activo).
  // pendienteItems ya viene filtrado por _getBacklogNoAcMode() más arriba (L957) — _renderVistaLista
  // no requiere cambio, solo recibe el conjunto ya acotado. Kanban ya desvió en L926 (incondicional,
  // anterior) — sin condición aquí, la llamada es directa.
  _renderVistaLista(listEl, pendienteItems, doneItems, terminalItems, _matchesQuery, _sortGroup, q, onRendered);

}

// Helper compartido — rellena el bloque estático "Terminados" (.bl-done-*, ver index.html/TKT-C6)
// con los ítems done del zone correspondiente. El contenedor existe siempre en el DOM (HTML estático) —
// esta función solo escribe conteo y filas, nunca crea ni destruye el shell. AC-4 de coherencia REQ-C.
function _renderDoneGroup(prefix, doneItems) {
  const countEl = document.getElementById(`${prefix}-done-count`);
  const bodyEl  = document.getElementById(`${prefix}-done-body`);
  if (countEl) countEl.textContent = String(doneItems.length);
  if (!bodyEl) return;
  bodyEl.innerHTML = doneItems.length
    ? _sortGroup(doneItems).map(item => buildBacklogItem(item)).join('')
    : '';
}

// Toggle de colapso del bloque "Terminados" — header y body son estáticos (index.html/TKT-C6),
// el listener se adjunta una sola vez al cargar el módulo, no en cada render.
function _attachDoneGroupToggle(prefix) {
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

// TKT-C1 (REQ-C): renderIceboxPanel partida en renderQBacklogPanel (Q-Backlog: REQ/TKT)
// y renderQDiscPanel (Q-DISC: DISC) — panel único reemplazado por dos paneles separados.
// _isQBacklog/_isQDisc importadas desde locus-backlog-core.js (retira wrapper _isIcebox).
// Cada función sigue el mismo patrón que la anterior renderIceboxPanel — filtros por namespace
// propio ('qbacklog'/'qdisc'), jerarquía R→hijos vía _buildChildMap, bloque Terminados estático.
function _renderZonePanel(opts) {
  const { bodyId, badgeId, nsKey, isZone, emptyTitle, emptyIcon } = opts;
  const _emptyIcon = emptyIcon || '📦';
  const body = document.getElementById(bodyId);
  if (!body) return;

  if (!_getActiveProjectFilter()) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Selecciona un proyecto</div>
        <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
      </div>`;
    const badge = document.getElementById(badgeId);
    if (badge) badge.textContent = '';
    _renderDoneGroup(nsKey, []);
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
  const doneZoneItems = zoneItems.filter(i => i.status === 'done');
  const activeZoneItems = zoneItems.filter(i => i.status !== 'done');
  _renderDoneGroup(nsKey, doneZoneItems);

  if (!activeZoneItems.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${_emptyIcon}</div>
        <div class="empty-state-title">${emptyTitle}</div>
      </div>`;
    return;
  }

  // TKT3 REQ2 S'02 — stats-bar interactiva: conteo sobre activeZoneItems (universo sin
  // filtrar por tipo/prioridad/búsqueda), mismo criterio que renderQIncPanel (_displayable) —
  // evita que un chip desactivado muestre conteo 0 en vez del total real de la zona.
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
    </div>`;
  if (!body._zpDelegationAttached) {
    body._zpDelegationAttached = true;
    body.addEventListener('click', function _zpStatsClick(e) {
      const btn = e.target.closest('[data-zp-action]');
      if (!btn) return;
      const _k = btn.closest('[id$="-panel-body"]')?.id === 'qbacklog-panel-body' ? 'qbacklog' : 'qdisc';
      if (btn.dataset.zpAction === 'zp-type') {
        _nsToggleType(_k, btn.dataset.zpType);
      } else if (btn.dataset.zpAction === 'zp-priority') {
        _nsTogglePriority(_k, btn.dataset.zpPriority);
      } else {
        return;
      }
      if (_k === 'qbacklog') renderQBacklogPanel(); else renderQDiscPanel();
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
  const filteredItems = activeZoneItems.filter(i => {
    const type = itemKind(i);
    const typeOk = type ? _activeTypesZ.has(type) : true;
    const statusOk = _activeStatusesZ.has(i.status);
    const priorityOk = _activePriorityZ.size === 0 || _activePriorityZ.has(i.priority);
    return typeOk && statusOk && priorityOk && _matchesSearchZ(i);
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

  const _childMap  = _buildChildMap(filteredItems);
  const _rCodes    = new Set(filteredItems.filter(i => itemKind(i) === 'REQ').map(i => i.code));
  const _rootItems = sorted.filter(i => !i.parentId || !_rCodes.has(i.parentId));

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

// B-202606-052 → TKT-C1: renderQBacklogPanel — sub-tab Backlog (Q-Backlog: REQ/TKT).
export function renderQBacklogPanel() {
  _renderZonePanel({
    bodyId: 'qbacklog-panel-body',
    badgeId: 'tpl-badge-qbacklog',
    nsKey: 'qbacklog',
    isZone: _isQBacklogActive,
    showTypeChips: true,
    emptyTitle: 'No hay ítems pendientes'
  });
}

// B-202606-052 → TKT-C1: renderQDiscPanel — sub-tab Discoveries (Q-DISC: DISC).
export function renderQDiscPanel() {
  _renderZonePanel({
    bodyId: 'qdisc-panel-body',
    badgeId: 'tpl-badge-qdisc',
    nsKey: 'qdisc',
    isZone: _isQDiscActive,
    showTypeChips: false,
    emptyTitle: 'No hay discoveries pendientes',
    emptyIcon: '💡'
  });
}

// B-202606-052 → TKT-C1: listeners sub-tabs Backlog (Q-Backlog) y Discoveries (Q-DISC) —
// reemplazan al listener único sstab-btn-icebox.
(function _initQBacklogSubTab() {
  const btn = document.getElementById('sstab-btn-qbacklog');
  if (!btn) return;
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tpl-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.session-subpanel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('sspanel-qbacklog');
    if (panel) panel.classList.add('active');
    renderQBacklogPanel();
  });
})();

(function _initQDiscSubTab() {
  const btn = document.getElementById('sstab-btn-qdisc');
  if (!btn) return;
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tpl-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.session-subpanel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('sspanel-qdisc');
    if (panel) panel.classList.add('active');
    renderQDiscPanel();
  });
})();

// Toggle del bloque "Terminados" — adjuntado una sola vez al cargar el módulo (shell estático).
_attachDoneGroupToggle('qbacklog');
_attachDoneGroupToggle('qdisc');

// B-202606-052 → TKT-C1: re-render de los paneles Q-Backlog/Q-DISC cuando el backlog cambia
// y el panel correspondiente está activo.
window.addEventListener('shell:backlog-render-dirty', () => {
  const panelB = document.getElementById('sspanel-qbacklog');
  if (panelB && panelB.classList.contains('active')) renderQBacklogPanel();
  const panelD = document.getElementById('sspanel-qdisc');
  if (panelD && panelD.classList.contains('active')) renderQDiscPanel();
});

// TKT (REQ-[pendiente-ID]): _initQIncSubTab — listener del sub-tab Q-INC, faltante hasta esta
// entrega. Mismo patrón que _initQBacklogSubTab/_initQDiscSubTab: remueve .active de todos los
// .session-subpanel y .tpl-nav-btn antes de activar el propio — sin esto, sspanel-qinc nunca
// recibía .active y el panel previamente activo quedaba visible junto al contenido de Q-INC
// (renderQIncPanel() puebla #qinc-panel-body independientemente del estado de .active del padre).
(function _initQIncSubTab() {
  const btn = document.getElementById('sstab-btn-qinc');
  if (!btn) return;
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tpl-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.session-subpanel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('sspanel-qinc');
    if (panel) panel.classList.add('active');
    renderQIncPanel();
  });
})();

// TKT (REQ-[pendiente-ID]): renderQIncPanel — render del panel Q-INC en #qinc-panel-body.
// Renderiza ítems ITIL (INC/PRB/KE/CHG) cuya queue termina en '-Q-INC' del proyecto activo.
// Agrupa por incidentStatus: detected/assigned/in_progress primero, resolved/closed al fondo.
// Actualiza badge #tpl-badge-qinc con conteo y clase is-urgent si hay INC high vencido.
// Reemplaza el panel legacy de incidentes por sprint — no_incluye: CSS de SLA (TKT-D3), labels/typeScores de
// locus-backlog-core.js (TKT-C3 — ya completado en sesión previa).
const SLA_RIESGO_WINDOW_MS = 21600000; // 6h — ventana de riesgo antes del vencimiento

// Estados ITIL "activos" — orden de grupo primero. resolved/closed van al fondo.
const _QINC_ACTIVE_STATUSES = ['detected', 'assigned', 'in_progress', 'escalated_to_prb', 'escalated_to_chg'];

export function renderQIncPanel() {
  const body = document.getElementById('qinc-panel-body');
  if (!body) return;

  if (!_getActiveProjectFilter()) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Selecciona un proyecto</div>
        <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
      </div>`;
    const badge = document.getElementById('tpl-badge-qinc');
    if (badge) badge.textContent = '';
    return;
  }

  // Ítems ITIL del proyecto activo — excluir descartados del conteo y del render
  // [tmp:tkt-isqinc-unify]: _isQIncItem local eliminada — usa isQIncItem() importada desde locus-backlog-core.js.
  const allQInc = getItems().filter(isQIncItem);

  // Badge: count de ítems activos (no closed/descartado); is-urgent si hay INC high vencido
  const badge = document.getElementById('tpl-badge-qinc');
  if (badge) {
    const countable = allQInc.filter(i => i.incidentStatus !== 'closed' && i.status !== 'descartado');
    const _now = Date.now();
    const hasUrgentVencido = countable.some(i =>
      itemKind(i) === 'INC' && i.slaPriority === 'high' &&
      typeof i.slaDeadline === 'number' && i.slaDeadline < _now
    );
    if (!countable.length) {
      badge.textContent = '';
      badge.classList.remove('is-urgent');
    } else {
      badge.textContent = String(countable.length);
      badge.classList.toggle('is-urgent', hasUrgentVencido);
    }
  }

  if (!allQInc.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚨</div>
        <div class="empty-state-title">No hay incidentes activos en Q-INC</div>
      </div>`;
    return;
  }

  // Namespace propio 'qinc' — aislado del state global de Backlog
  const _qiTypes    = _nsGetTypes('qinc');
  const _qiPriority = _nsGetPriority('qinc');
  const _qiQuery     = (_nsGetQuery('qinc') || '').trim().toLowerCase();

  const _countByType = { INC: 0, PRB: 0, KE: 0, CHG: 0 };
  const _countByPri  = { high: 0, medium: 0, low: 0 };
  const _displayable = allQInc.filter(i => i.status !== 'descartado' && i.incidentStatus !== 'closed');
  _displayable.forEach(i => {
    const t = itemKind(i);
    if (t && _countByType[t] !== undefined) _countByType[t]++;
    const p = i.slaPriority;
    if (p === 'high') _countByPri.high++;
    else if (p === 'low') _countByPri.low++;
    else _countByPri.medium++;
  });

  // Empty state cuando no hay ítems o todos closed/descartado se cubre arriba (allQInc.length).
  // Si _displayable queda vacío (todos closed/descartado) pero allQInc tiene ítems, mostrar mismo empty state.
  if (!_displayable.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚨</div>
        <div class="empty-state-title">No hay incidentes activos en Q-INC</div>
      </div>`;
    return;
  }

  const _statsBarHtml = `
    <div class="qinc-stats-bar" id="qinc-stats-bar">
      <div class="qinc-stats-types">
        ${_qiTypes.size < 4 ? `<button class="stat-type-chip stat-type-chip--all" data-qi-action="qi-clear-types" title="Mostrar todos los tipos">✕</button>` : ''}
        ${[['INC','INC'],['PRB','PRB'],['KE','KE'],['CHG','CHG']].map(([t, label]) =>
          `<button class="stat-type-chip tc-${t.toLowerCase()}${_qiTypes.has(t) ? ' active' : ''}" data-qi-action="qi-type" data-qi-type="${t}" title="Filtrar por tipo ${t}">\
<span class="tc-count">${_countByType[t]}</span><span class="tc-label">${label}</span></button>`
        ).join('')}
      </div>
      <div class="qinc-stats-priority">
        <button class="stat-pri-chip pri-high${_qiPriority.has('high') ? ' active' : ''}" data-qi-action="qi-priority" data-qi-priority="high" title="Filtrar SLA alta"><span class="spc-n">${_countByPri.high}</span> Alto</button>
        <button class="stat-pri-chip pri-medium${_qiPriority.has('medium') ? ' active' : ''}" data-qi-action="qi-priority" data-qi-priority="medium" title="Filtrar SLA media"><span class="spc-n">${_countByPri.medium}</span> Med</button>
        <button class="stat-pri-chip pri-low${_qiPriority.has('low') ? ' active' : ''}" data-qi-action="qi-priority" data-qi-priority="low" title="Filtrar SLA baja"><span class="spc-n">${_countByPri.low}</span> Bajo</button>
      </div>
      <input class="qinc-search-input" type="search" placeholder="Buscar en Q-INC…" value="${_qiQuery.replace(/"/g,'&quot;')}" data-qi-action="qi-search" aria-label="Buscar en Q-INC">
    </div>`;

  const _matchesQiSearch = _qiQuery
    ? i => i.code.toLowerCase().includes(_qiQuery) || (i.title || '').toLowerCase().includes(_qiQuery) || (i.area || '').toLowerCase().includes(_qiQuery)
    : () => true;
  const filteredQInc = _displayable.filter(i => {
    const t = itemKind(i);
    const typeOk = t ? _qiTypes.has(t) : true;
    const priOk  = _qiPriority.size === 0 || _qiPriority.has(i.slaPriority);
    return typeOk && priOk && _matchesQiSearch(i);
  });

  const _now = Date.now();
  function _qincItemClasses(item) {
    const classes = [];
    if (itemKind(item) === 'INC' && typeof item.slaDeadline === 'number') {
      if (item.slaDeadline < _now) classes.push('qinc-item--sla-vencido');
      else if (item.slaDeadline < _now + SLA_RIESGO_WINDOW_MS) classes.push('qinc-item--sla-riesgo');
    }
    return classes.join(' ');
  }

  function _buildQIncItemHtml(item) {
    // TKT-B2b: buildQIncItem reemplaza buildBacklogItem — modelo ITIL propio, sin item.status/sprint/parentId.
    // Clases SLA calculadas internamente por buildQIncItem — _qincItemClasses ya no aplica aquí.
    return buildQIncItem(item);
  }

  const _listHtml = filteredQInc.length === 0
    ? `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Sin resultados</div><div class="empty-state-hint">Ningún ítem coincide con el filtro activo.</div></div>`
    : (() => {
        const _activeItems   = filteredQInc.filter(i => _QINC_ACTIVE_STATUSES.includes(i.incidentStatus));
        const _resolvedItems = filteredQInc.filter(i => !_QINC_ACTIVE_STATUSES.includes(i.incidentStatus));
        let h = '';
        if (_activeItems.length) {
          h += '<div class="qinc-section"><div class="qinc-section-header">Activos</div><div class="items-grid">';
          _activeItems.forEach(item => { h += _buildQIncItemHtml(item); });
          h += '</div></div>';
        }
        if (_resolvedItems.length) {
          h += '<div class="qinc-section"><div class="qinc-section-header">Resueltos</div><div class="items-grid">';
          _resolvedItems.forEach(item => { h += _buildQIncItemHtml(item); });
          h += '</div></div>';
        }
        return h;
      })();

  body.innerHTML = _statsBarHtml + _listHtml;

  // TKT-B2b: _attachQIncDelegation — único listener sobre #qinc-panel-body.
  // Unifica: stats-bar (qi-*), copy-code de cards buildQIncItem, y qi-toggle-comportamiento.
  // Registrado una sola vez sobre body via flag — persiste entre re-renders de innerHTML.
  // _attachBacklogListDelegation no se modifica: sigue escuchando sobre #backlog-list sin cambios.
  _attachQIncDelegation(body);
}

// TKT-B2b: delegación unificada para #qinc-panel-body.
// Parámetro container: el elemento sobre el que se registra el listener (siempre #qinc-panel-body).
// Un único listener maneja: filtros de stats-bar, copy-code de cards ITIL, expand de comportamientoActual.
// AC: exactamente un listener activo — flag _qiDelegationAttached previene acumulación en re-renders.
function _attachQIncDelegation(container) {
  if (!container || container._qiDelegationAttached) return;
  container._qiDelegationAttached = true;

  container.addEventListener('click', function _qiClick(e) {
    // --- copy-code: patrón idéntico al Backlog principal ---
    const copyBtn = e.target.closest('[data-action="copy-code"]');
    if (copyBtn) {
      e.stopPropagation();
      const code = copyBtn.dataset.code;
      if (code) {
        navigator.clipboard.writeText(code).catch(() => {});
        copyBtn.classList.add('is-copied');
        setTimeout(() => copyBtn.classList.remove('is-copied'), 1500);
      }
      return;
    }

    // --- qi-toggle-comportamiento: expandir/colapsar comportamientoActual ---
    const comportEl = e.target.closest('[data-qi-action="qi-toggle-comportamiento"]');
    if (comportEl) {
      comportEl.classList.toggle('expanded');
      return;
    }

    // --- stats-bar: filtros de tipo, prioridad, clear ---
    const el = e.target.closest('[data-qi-action]');
    if (!el) return;
    const act = el.dataset.qiAction;
    if (act === 'qi-clear-types') {
      _nsReset('qinc');
      renderQIncPanel();
    } else if (act === 'qi-type') {
      _nsToggleType('qinc', el.dataset.qiType);
      renderQIncPanel();
    } else if (act === 'qi-priority') {
      _nsTogglePriority('qinc', el.dataset.qiPriority);
      renderQIncPanel();
    }
  });

  // Search input — input event (no click)
  container.addEventListener('input', function _qiInput(e) {
    const input = e.target.closest('[data-qi-action="qi-search"]');
    if (!input) return;
    clearTimeout(container._qiSearchTimer);
    container._qiSearchTimer = setTimeout(() => {
      _nsSetQuery('qinc', input.value);
      renderQIncPanel();
    }, 200);
  });
}

// TKT (REQ-[pendiente-ID]): listener shell:render-qinc — despachado por switchSubTab en locus-ui-shell.js
// Proyecto cambiado con sub-tab Q-INC activo → re-render automático vía este evento.
window.addEventListener('shell:render-qinc', () => { renderQIncPanel(); });

// Re-render del panel Q-INC cuando el backlog cambia y el panel está activo
window.addEventListener('shell:backlog-render-dirty', () => {
  const panel = document.getElementById('sspanel-qinc');
  if (panel && panel.classList.contains('active')) renderQIncPanel();
});

// T-202606-092: renderHistoricoPanel — render del panel Histórico en #sspanel-historico.
// AC-4: renderHistoricoSection() recibe el propio #sspanel-historico como listEl — el bloque
// #historico-section se inyecta directo ahí (no en #backlog-list). TKT2 (REQ Histórico unificado)
// eliminó la distinción Por sprint / Lista plana — vista única, ver locus-backlog-historico.js.
// Panel se limpia antes de cada llamada: renderHistoricoSection ya deduplica #historico-section
// internamente (remueve instancia previa antes de crear la nueva) — el reset previo aquí es
// redundante pero inofensivo, evita acumulación en re-renders si el guard interno cambiara.
// (mismo contrato que _renderVistaLista/renderBacklogList, que resetean listEl.innerHTML antes
// de llamarla). AC-2, AC-6, AC-7, AC-8, AC-9.
// INC-[pendiente-ID]: async — refresca el cache de historico antes de leer getHistoricoCount()/
// getHistoricoStats() (que dependen del mismo cache que _buildHistoricoPartitions en
// locus-backlog-historico.js). Ambos call sites del handler (click sub-tab, shell:backlog-render-dirty)
// se ajustan a async/await.
export async function renderHistoricoPanel() {
  const panel = document.getElementById('sspanel-historico');
  if (!panel) return;

  const badge = document.getElementById('tpl-badge-historico');

  // AC-8: sin proyecto activo — mismo empty state que #backlog-list
  if (!_getActiveProjectFilter()) {
    panel.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Selecciona un proyecto</div>
        <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
      </div>`;
    if (badge) badge.textContent = '';
    return;
  }

  await refreshHistoricoCache();

  // AC-2: count interno del panel — se sigue calculando para el empty state y renderHistoricoSection.
  // B-202606-087: badge de subtab NUNCA muestra conteo en Histórico (AC T-202606-035, done) —
  // el conteo es responsabilidad de _updateSubtabBadges(); este call site solo limpia el badge.
  const count = getHistoricoCount();
  if (badge) badge.textContent = '';

  // T-202606-006: stats-bar informativa — conteos por tipo y prioridad sobre el universo
  // completo de Histórico (mismo criterio que getHistoricoCount). Chips sin
  // interacción — <span>, sin data-action, sin role/tabindex, sin listener de delegación.
  // Clases: .stats-bar/.stats-row reusadas de Backlog · .stat-type-chip--static /
  // .stat-pri-chip--static entregadas por Nova (mod:48 de locus-backlog.css).
  const _stats = getHistoricoStats();
  const _statsBarHtml = `
    <div class="stats-bar" id="historico-stats-bar">
      <div class="stats-row">
        <div class="stat-card"><span class="stat-n">${_stats.total}</span><span class="stat-l">Total</span></div>
      </div>
      <div class="stats-row">
        <span class="stat-type-chip stat-type-chip--static tc-REQ"><span class="tc-count">${_stats.byType.REQ || 0}</span><span class="tc-label">Req</span></span>
        <span class="stat-type-chip stat-type-chip--static tc-TKT"><span class="tc-count">${_stats.byType.TKT || 0}</span><span class="tc-label">Ticket</span></span>
        <span class="stat-type-chip stat-type-chip--static tc-INC"><span class="tc-count">${_stats.byType.INC || 0}</span><span class="tc-label">INC</span></span>
        <span class="stat-type-chip stat-type-chip--static tc-DISC"><span class="tc-count">${_stats.byType.DISC || 0}</span><span class="tc-label">DISC</span></span>
      </div>
      <div class="stats-row">
        <span class="stat-pri-chip stat-pri-chip--static pri-high"><span class="spc-n">${_stats.byPriority.high}</span> Alto</span>
        <span class="stat-pri-chip stat-pri-chip--static pri-medium"><span class="spc-n">${_stats.byPriority.medium}</span> Med</span>
        <span class="stat-pri-chip stat-pri-chip--static pri-low"><span class="spc-n">${_stats.byPriority.low}</span> Bajo</span>
      </div>
    </div>`;

  // TKT1 (REQ Fixes subtab Backlog Histórico): getHistoricoCount() no contempla
  // sprints cerrados sin ítems asignados — un sprint recién cerrado con 0 ítems archivados
  // producía count:0 y el empty-state genérico se mostraba en lugar de la zona vacía del
  // sprint (que renderHistoricoSection ya sabe renderizar, ver B-202606-066 en
  // locus-backlog-historico.js). hasClosedSprints amplía el gate sin tocar el contrato de
  // getHistoricoCount() ni de renderHistoricoSection.
  const hasClosedSprints = getActiveSprints().some(s => s.status === 'closed');

  // AC-7: sin sprints cerrados y sin ítems historico — renderHistoricoSection no inyecta nada
  // en ese caso (early return interno). AC-4 (T-202606-006): la stats-bar se muestra igual,
  // con conteos en cero — no se oculta cuando Histórico está vacío.
  if (!count && !hasClosedSprints) {
    panel.innerHTML = _statsBarHtml + `
      <div class="empty-state">
        <div class="empty-state-icon">🗄</div>
        <div class="empty-state-title">No hay sprints cerrados aún</div>
      </div>`;
    return;
  }

  panel.innerHTML = _statsBarHtml;
  const _listContainer = document.createElement('div');
  panel.appendChild(_listContainer);
  // Cache ya refrescado arriba — el await interno de renderHistoricoSection es no-op (Map ya poblado).
  await renderHistoricoSection(_listContainer);
}

// TKT1 (REQ-[pendiente-ID] Consolidar wiring de Histórico): _initHistoricoSubTab eliminado —
// era wiring manual duplicado (toggle de .tpl-nav-btn/.session-subpanel) sobre el mismo botón
// que switchSubTab() (locus-ui-shell.js) ya activa para los otros 7 sub-tabs. Dos listeners
// async e independientes sobre el mismo click, sin orden garantizado entre sí, eran la causa
// del render no determinístico del panel. renderHistoricoPanel se registra abajo como único
// listener de 'shell:render-historico' — mismo patrón que shell:render-qinc (línea 1494).
window.addEventListener('shell:render-historico', () => { renderHistoricoPanel(); });

// T-202606-092: re-render del panel histórico cuando el backlog cambia y el panel está activo (AC-9)
window.addEventListener('shell:backlog-render-dirty', async () => {
  const panel = document.getElementById('sspanel-historico');
  if (panel && panel.classList.contains('active')) await renderHistoricoPanel();
});

// T-202606-093: T4 · _updateSubtabBadges — actualización reactiva de los cuatro badges
// (backlog, q-backlog, q-disc, qinc, histórico) independiente de cuál sub-tab/panel esté activo.
// TKT-C1: badgeIcebox (tpl-badge-icebox, Gen1) → badgeQBacklog (tpl-badge-qbacklog) +
//   badgeQDisc (tpl-badge-qdisc) — reutiliza _isQBacklog/_isQDisc/_zoneStaleness.
// TKT (REQ-[pendiente-ID]): badge legacy → badgeQinc — reutiliza la misma lógica de
//   renderQIncPanel (countable por incidentStatus !== 'closed', is-urgent por INC high vencido).
// Reutiliza exactamente la lógica de conteo de cada render*Panel — no reimplementa
// criterios de staleness/urgencia/archivo, solo el cálculo de badge en aislado.
// AC-1, AC-5, AC-6.
export function _updateSubtabBadges() {
  const badgeBacklog   = document.getElementById('tpl-badge-backlog');
  const badgeQBacklog  = document.getElementById('tpl-badge-qbacklog');
  const badgeQDisc     = document.getElementById('tpl-badge-qdisc');
  const badgeQinc      = document.getElementById('tpl-badge-qinc');
  const badgeHistorico = document.getElementById('tpl-badge-historico');

  // AC-6: getItems() vacío → todos los badges quedan vacíos, nunca '0'
  const items = getItems();

  // T-202606-004: badge del subtab Backlog — cuenta Rs/Ts activos (pendiente/en-revision)
  // en sprint real (no Q-Backlog/Q-DISC) con status active o scheduled (programado).
  // Sin prefijo de urgencia, '' en vez de '0'.
  if (badgeBacklog) {
    const _isBacklogScope = i => {
      if (i.status !== 'pendiente' && i.status !== 'en-revision') return false;
      const t = itemKind(i);
      if (t !== 'REQ' && t !== 'TKT') return false;
      const sId = _extractSprintId(i.sprint);
      if (!sId || _isQBacklog(i) || _isQDisc(i)) return false;
      const sprint = getActiveSprints().find(s => s.id === sId);
      if (!sprint) return false;
      return sprint.status === 'active' || sprint.status === 'scheduled';
    };
    const backlogItems = items.filter(_isBacklogScope);
    badgeBacklog.textContent = backlogItems.length ? String(backlogItems.length) : '';
  }

  // TKT-C1: badge Q-Backlog — REQ/TKT sin sprint (pendiente/en-revision), con alerta de staleness.
  // TKT1 REQ2 S'02: _isQBacklogActive reemplaza filtro manual — ya excluye descartado/historico.
  if (badgeQBacklog) {
    const qbItems = items.filter(_isQBacklogActive);
    if (!qbItems.length) {
      badgeQBacklog.textContent = '';
    } else {
      const _alertCount = qbItems.filter(i => _zoneStaleness(i) !== null).length;
      badgeQBacklog.textContent = (_alertCount > 0 ? '⚠ ' : '') + qbItems.length;
    }
  }

  // TKT-C1: badge Q-DISC — DISC activas (discovery), con alerta de staleness.
  // TKT1 REQ2 S'02: _isQDiscActive reemplaza filtro manual — corrige bug: el filtro
  // manual anterior no excluía 'promoted', badge contaba DISCs ya promovidas.
  if (badgeQDisc) {
    const qdItems = items.filter(_isQDiscActive);
    if (!qdItems.length) {
      badgeQDisc.textContent = '';
    } else {
      const _alertCount = qdItems.filter(i => _zoneStaleness(i) !== null).length;
      badgeQDisc.textContent = (_alertCount > 0 ? '⚠ ' : '') + qdItems.length;
    }
  }

  // TKT (REQ-[pendiente-ID]): badge Q-INC — ítems ITIL no closed/descartado, is-urgent
  // si hay INC high con slaDeadline vencido. Misma lógica que el badge en renderQIncPanel.
  if (badgeQinc) {
    const allQInc = items.filter(isQIncItem);
    const countable = allQInc.filter(i => i.incidentStatus !== 'closed' && i.status !== 'descartado');
    if (!countable.length) {
      badgeQinc.textContent = '';
      badgeQinc.classList.remove('is-urgent');
    } else {
      const _now = Date.now();
      const hasUrgentVencido = countable.some(i =>
        itemKind(i) === 'INC' && i.slaPriority === 'high' &&
        typeof i.slaDeadline === 'number' && i.slaDeadline < _now
      );
      badgeQinc.textContent = String(countable.length);
      badgeQinc.classList.toggle('is-urgent', hasUrgentVencido);
    }
  }

  // B-202606-087: AC T-202606-035 (done) — badge de subtab Histórico nunca muestra conteo.
  // getHistoricoCount() se conserva como fuente del panel (renderHistoricoSection) —
  // este call site solo deja de escribirlo en el badge.
  if (badgeHistorico) {
    badgeHistorico.textContent = '';
  }
}

// T-202606-072: listeners shell:* — desacoplamiento de módulos consumidores
// locus-storage.js despacha estos eventos en lugar de llamar directamente a las funciones
// T-202606-093 AC-2: _updateSubtabBadges() como llamada hermana — no depende del guard
// interno de renderBacklogList() (_backlogListDirty, item-editor abierto, defer de blur)
window.addEventListener('shell:backlog-render-dirty', () => { _markBacklogListDirty(); renderBacklogList(); _updateSubtabBadges(); });
window.addEventListener('shell:mark-backlog-dirty',   () => { _markBacklogListDirty(); });
window.addEventListener('shell:render-backlog-list',  () => { _markBacklogListDirty(); renderBacklogList(); renderStats(); _updateSubtabBadges(); }); // B-202606-008: _markBacklogListDirty ausente — guard cortaba render cuando dirty=false
// TKT1 (REQ unificar renderer de #active-filter-chips): listener shell:backlog-filter-changed
// duplicado eliminado — queda solo el de locus-backlog-core.js, que ya invoca
// renderActiveFilterChips() (equivalente funcional de updateClearFilterBtn tras esta consolidación).
// B-202606-009: micro-flash en pill del R padre cuando su status avanza automáticamente
// requestAnimationFrame garantiza que el DOM post-render ya está pintado antes de aplicar la clase
window.addEventListener('shell:backlog-r-auto-advanced', e => {
  const rCode = e.detail && e.detail.rCode;
  if (!rCode) return;
  requestAnimationFrame(() => {
    const pill = document.querySelector(`.bitem-status-chip[data-code="${CSS.escape(rCode)}"]`);
    if (!pill) return;
    pill.classList.remove('item-status-confirmed');
    void pill.offsetWidth; // forzar reflow para reiniciar animación si ya estaba activa
    pill.classList.add('item-status-confirmed');
    pill.addEventListener('animationend', () => pill.classList.remove('item-status-confirmed'), { once: true });
  });
});
