// [PP] mod:1 · autor:Rune · 2026-07-09 UTC-6

// TKT-[pendiente-ID] (REQ-centralizar-accesores-itil, TKT1): punto único de
// canonicalización para los campos ITIL que conviven en dos convenciones de
// naming — camelCase en el modelo de sesión/memoria (locus-session-parse.js,
// items ya normalizados) y snake_case en las columnas reales de Postgres
// (tracker_items / tracker_incidents, ver _toItemRow / _toIncidentRow /
// _mapRowToItem / _mapRowToIncident en locus-storage.js).
//
// Antes de este módulo, cada archivo que necesitaba leer uno de estos campos
// reimplementaba su propio fallback `campo || campo_snake` — 24 ocurrencias
// dispersas en 7 archivos (locus-backlog-core.js, locus-storage.js,
// locus-backlog-render.js, locus-notifications.js, locus-backlog-item.js,
// locus-backlog-generator.js). El fallback faltante en sla_priority /
// comportamiento_actual / origin_module fue exactamente la causa raíz del
// INC de naming ITIL resuelto en la sesión anterior (mod anteriores de
// locus-storage.js / locus-backlog-core.js).
//
// Regla de prioridad: camelCase tiene precedencia sobre snake_case cuando
// ambos están presentes con valores distintos. En la práctica un ítem nunca
// trae ambas convenciones pobladas simultáneamente con valores en conflicto
// — o viene recién parseado de sesión (solo camelCase) o hidratado desde
// Supabase (solo snake_case) — por lo que el orden de precedencia no altera
// comportamiento observado hoy. Ver nota en CHECKPOINT del TKT sobre algunos
// call sites que originalmente leían en orden snake-primero.
//
// No tocar: row.incident_status / row.resolution_type en _mapRowToItem /
// _mapRowToIncident (lectura de fila cruda de Supabase, siempre snake) ni
// los campos ya normalizados a camelCase puro dentro de locus-backlog-item.js
// (existing.slaPriority, item.derivedItems, etc.) — esos son el modelo de
// memoria interno, no el límite de traducción camelCase↔snake_case que este
// módulo centraliza.

function incSlaPriority(item) {
  if (!item) return null;
  return item.slaPriority || item.sla_priority || null;
}

function incComportamientoActual(item) {
  if (!item) return null;
  return item.comportamientoActual || item.comportamiento_actual || null;
}

function incOriginModule(item) {
  if (!item) return null;
  return item.originModule || item.origin_module || null;
}

function incDerivedItems(item) {
  if (!item) return null;
  if (Array.isArray(item.derivedItems)) return item.derivedItems;
  if (Array.isArray(item.derived_items)) return item.derived_items;
  return null;
}

function incIncidentStatus(item) {
  if (!item) return null;
  return item.incidentStatus || item.incident_status || null;
}

function incResolutionType(item) {
  if (!item) return null;
  return item.resolutionType || item.resolution_type || null;
}

export {
  incSlaPriority,
  incComportamientoActual,
  incOriginModule,
  incDerivedItems,
  incIncidentStatus,
  incResolutionType
};
