// [PP] mod:1 · autor:Rune · 2026-08-09 UTC-6
// locus-cmdk.js
// Responsabilidad: índice de búsqueda unificado para el buscador global ⌘K (REQ-202608-118).
//
// TKT-202608-287 (TKT1) — primera implementación real. El TKT había sido declarado `done`
// en una sesión previa sin que buildCmdkIndex() llegara a escribirse en ningún archivo del
// repo — gap detectado por auditoría contra código real (INC-202608-102, 2026-08-09). Este
// archivo es la entrega efectiva, no una migración de código anterior.
//
// Módulo nuevo: el dato que buildCmdkIndex() consume (ITEMS/INCIDENTS) vive en
// locus-backlog-core.js, pero el índice de búsqueda en sí es un dominio propio del
// buscador ⌘K — mismo criterio que ya separó locus-cmdk.css de locus-backlog.css
// (__BR-Ecosystem §7: función sin módulo dueño claro → módulo nuevo, no forzarla en el
// módulo invocador ni en el módulo de datos).

import { getItems, getIncidents } from './locus-backlog-core.js';

// buildCmdkIndex() → array de {code,title,type,area} por cada ítem activo del ecosistema.
// Fuente: getItems() (REQ/TKT/DISC) + getIncidents() (INC/PRB/CHG). Excluye status:historico
// de getItems() — getIncidents() no tiene equivalente historico (__BR-Core §6: Q-INC no migra
// a historico, incident_status es terminal por sí mismo), por eso no se filtra ahí.
// No pagina, no persiste el índice, no toca sesiones/workers — recalculado en cada apertura
// del modal (consumido por TKT-202608-289, aún no implementado).
export function buildCmdkIndex() {
  const items = getItems().filter(function(i) { return i.status !== 'historico'; });
  const incidents = getIncidents();

  const fromItems = items.map(function(i) {
    return { code: i.code, title: i.title, type: i.type, area: i.area };
  });
  const fromIncidents = incidents.map(function(i) {
    return { code: i.code, title: i.title, type: i.type, area: i.area };
  });

  return fromItems.concat(fromIncidents);
}
