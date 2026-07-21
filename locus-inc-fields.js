// [PP] mod:3 · autor:Rune · 2026-07-21 UTC-6
// TKT-[pendiente-ID] (parent: REQ CAEL-0721-01 · "_PP-incidents.md — alineación con
// _ob-DocStandards §3b v1.16"): agrega incDiscardReason() — mismo patrón de los 6 getters
// existentes. Único accessor de discard_reason que faltaba en este módulo; discardReason →
// discard_reason ya se normaliza en locus-backlog-core.js (línea ~1182) pero ese módulo no lo
// exportaba como getter canónico de lectura — locus-incidents-generator.js (TKT3) lo necesita
// para el cuerpo de ítem sin reimplementar el fallback camelCase||snake_case a mano.

// [PP] mod:2 · autor:Rune · 2026-07-20 23:25 UTC-6
// TKT-[pendiente-ID] (deuda técnica, DISC promovida en cierre de REQ CAEL-0720-01):
// SLA_RIESGO_WINDOW_MS = 21600000 (6h) agregada como export — antes vivía duplicada a mano
// en locus-incidents-generator.js y locus-backlog-render.js, ambos ya migrados a importarla
// de aquí. Sin cambio en los 6 getters ITIL existentes.
//
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

const SLA_RIESGO_WINDOW_MS = 21600000; // 6h — umbral de indicador de riesgo/vencimiento SLA

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

function incDiscardReason(item) {
  if (!item) return null;
  return item.discardReason || item.discard_reason || null;
}

export {
  SLA_RIESGO_WINDOW_MS,
  incSlaPriority,
  incComportamientoActual,
  incOriginModule,
  incDerivedItems,
  incIncidentStatus,
  incResolutionType,
  incDiscardReason
};
