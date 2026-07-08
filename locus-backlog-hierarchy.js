// [PP] mod:2 · autor:Rune · 2026-07-07 18:00 UTC-6
// locus-backlog-hierarchy.js
// Responsabilidad: _buildChildMap — agrupación de hijos (TKT/INC) por REQ padre, con sort
//   topológico por depends_on. Único consumidor de datos: itemKind() de locus-backlog-core.js.
// Dependencias: locus-backlog-core.js
//
// REQ refactor-zonas TKT1: extraído de locus-backlog-render.js (mod:72, líneas 143-231) sin
// cambio de comportamiento — mismo contrato, mismos parámetros, mismo valor de retorno.
// Motivo de extracción: _buildChildMap tiene dos consumidores con responsabilidades distintas —
// renderSprintGroup (Vista Lista/Histórico, en locus-backlog-render.js) y _renderZonePanel
// (motor de paneles de zona, en locus-backlog-zone-engine.js). Colocarlo en cualquiera de los
// dos módulos consumidores habría creado import circular entre ellos. Vive en módulo neutral —
// ninguno de los dos consumidores es su dueño de dato, ambos son igual de válidos.

import { itemKind } from './locus-backlog-core.js';

// T-202606-022: _buildChildMap — agrupación de hijos por R con sort topológico por depends_on
// Recibe los ítems de un sprint (o de una zona) y retorna Map: rCode → [hijos ordenados]
// INC-[pendiente-ID] TKT1: includeHistorico (default false) — cuando true, hijos con status
// 'historico' se incluyen en el árbol igual que cualquier otro status. Default false preserva
// el contrato original para todo consumidor existente — sin cambio de comportamiento. Único
// caller con includeHistorico:true es _renderVistaLista para grupos de sprint closed.
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
    // INC triggered_by TKT-202607-063: leía item.depends_on (snake_case) — campo canónico
    // en memoria es item.dependsOn (camelCase).
    const internal = (Array.isArray(item.dependsOn) ? item.dependsOn : [])
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
