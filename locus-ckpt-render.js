// [PP] mod:3 · autor:Rune · 2026-08-27 UTC-6
// TKT ref_id CAEL-08271600-01 (origen_disc DISC-202608-225): _OP_ICON_MAP/_opIcon movidos
// aquí desde locus-backlog-merge.js (donde vivían exportados a nivel de módulo desde
// TKT ref_id CAEL-08271500-02/mod:110, con este mismo destino ya documentado como "ideal"
// en ese momento — el archivo simplemente no estaba adjunto en esa sesión). Este es el
// módulo dueño del catálogo de render de CHECKPOINT — destino correcto para un mapeo
// reutilizable cls→ícono que hoy solo consume el panel DIFF pero que IDP/Q-DISC podrían
// reutilizar sin duplicar. Sin cambio de comportamiento: mismo mapa cerrado de 4 tipos,
// mismo fallback '' para cls no mapeado. contract_update: sí — nuevo export cross-module,
// consumido por locus-backlog-merge.js (ver su propio header, mismo mod que este commit).
// [PP] mod:2 · autor:Rune · 2026-08-13 UTC-6
// TKT-202608-340 (REQ-202608-132): _HINT_CLASS.status-strip corregido de idp-title (placeholder
// incorrecto declarado en TKT-202608-339) a .mdiff-status-chip — clase real confirmada contra
// locus-backlog-item.css L5033 (TKT-202607-204, "Zona Identidad del panel de revisión de
// CHECKPOINT", AC1 "Estado de aval draft → avalado"). idp-title sigue siendo la clase correcta
// para el grupo Identidad (sin cambio) — el error estaba solo en el mapeo de Aval/borrador.

/**
 * Motor de render core — TKT-202608-339 (REQ-202608-132).
 * Función pura: consume el catálogo de _Locus-ckpt-render-ref.md (hardcodeado
 * aquí como tabla de lookup — sin fetch de archivo, el catálogo es contrato
 * de documentación, no dato en runtime) y produce { html, hint } por campo.
 */

// Tabla de lookup — item_type → field → render_hint. Extraída 1:1 de
// _Locus-ckpt-render-ref.md §Catálogo por item_type + §Grupos visuales.
// Mantener sincronizada manualmente con ese doc — Rune, dueño de ambos.
const _CKPT_FIELD_HINTS = {
  REQ: {
    code: 'header', title: 'header', schema_version: 'header', ref_id: 'header',
    status: 'pill', priority: 'pill', effort: 'pill',
    sprint: 'chip',
    blocked_by_external: 'link-list',
    intencion: 'expandable-section', ac: 'expandable-section', kill_criteria: 'expandable-section',
    design_intent: 'conditional-badge', doc_relevance: 'conditional-badge',
    doc_relevance_confirmada: 'conditional-badge',
    draft: 'status-strip', verified_by: 'status-strip'
  },
  TKT: {
    code: 'header', title: 'header', schema_version: 'header',
    status: 'pill', blocked_at: 'pill',
    parent: 'link-list', depends_on: 'link-list', triggered_by: 'link-list', archivos: 'link-list',
    no_incluye: 'expandable-section', ac: 'expandable-section',
    design_intent: 'conditional-badge', doc_relevance: 'conditional-badge',
    doc_relevance_confirmada: 'conditional-badge',
    contract_update: 'inline-detail', contract_detail: 'inline-detail'
  },
  DISC: {
    code: 'header', zona: 'chip',
    status: 'pill', discard_reason: 'pill',
    origen_registro: 'link-list', promovida_a: 'link-list', triggered_by: 'link-list',
    ac: 'expandable-section'
  },
  INC: {
    code: 'header',
    sla_priority: 'pill', incident_status: 'pill', resolution_type: 'pill', discard_reason: 'pill',
    queue: 'chip',
    triggered_by: 'link-list', origin_module: 'link-list', archivos: 'link-list', derived_items: 'link-list',
    comportamiento_actual: 'expandable-section'
  },
  PRB: {
    code: 'header',
    sla_priority: 'pill', incident_status: 'pill',
    queue: 'chip',
    derived_items: 'link-list', triggered_by: 'link-list', origin_module: 'link-list', archivos: 'link-list',
    comportamiento_actual: 'expandable-section'
  },
  CHG: {
    code: 'header',
    sla_priority: 'pill', status: 'pill',
    queue: 'chip',
    derived_items: 'link-list', triggered_by: 'link-list', origin_module: 'link-list', archivos: 'link-list'
  },
  patch: { type: 'header', code: 'header' },
  'patch-intencion': {
    type: 'header', code: 'header', founder_confirmado: 'header',
    intencion: 'expandable-section', kill_criteria: 'expandable-section', ac: 'expandable-section'
  }
};

// Mapeo cls→ícono de operación (created/advanced/updated/retroceso) — movido desde
// locus-backlog-merge.js (mod:110→112, ver header de ambos archivos). Función pura, sin
// dependencia de estado del panel DIFF ni de ningún otro closure.
export const _OP_ICON_MAP = {
  created:   'ti-square-rounded-plus',
  advanced:  'ti-arrow-big-right-lines',
  updated:   'ti-pencil',
  retroceso: 'ti-arrow-back-up',
};
// Ícono hermano del pill de texto — nunca anidado dentro del <span> (ver
// _Locus-css-ref §Patrones .mdiff-op-icon, TKT-202608-460: el selector CSS asume el
// ícono como elemento previo, no como hijo). cls no mapeado → string vacío, sin
// <svg> roto y sin alterar el chip de texto.
export const _opIcon = (cls) => {
  const iconName = _OP_ICON_MAP[cls];
  if (!iconName) return '';
  return `<svg class="ti-svg mdiff-op-icon mdiff-op-icon--${cls}" aria-hidden="true"><use href="#${iconName}"></use></svg>`;
};

// hint → clase base (fuente: _Locus-ckpt-render-ref.md §Grupos visuales,
// componente ya existente citado en cada justificación — verificado contra
// CSS real en TKT-202608-340, ver comentario de header). Sin CSS nuevo.
const _HINT_CLASS = {
  header: 'idp-title',
  pill: 'item-type-pill',
  chip: 'bl-vl-sprint-header',
  'link-list': 'idp-dep-chip',
  'expandable-section': 'mdiff-narrative-section',
  'conditional-badge': 'mdiff-docrel-badge',
  'inline-detail': 'mdiff-field-chip',
  'status-strip': 'mdiff-status-chip' // corregido en TKT-202608-340 — ver header
};

/**
 * @param {string} itemType - REQ|TKT|DISC|INC|PRB|CHG|patch|patch-intencion
 * @param {string} field - nombre del campo tal como aparece en el schema
 * @param {*} value - valor del campo en el ítem/patch real
 * @returns {{html: string, hint: string} | null}
 */
export function renderCkptField(itemType, field, value) {
  const fieldsForType = _CKPT_FIELD_HINTS[itemType];
  if (!fieldsForType) return null;

  const hint = fieldsForType[field];
  if (!hint) return null;

  // AC3 — value vacío/undefined en expandable-section retorna null, nunca
  // sección colapsable vacía. Mismo criterio se extiende a link-list (sin
  // elementos que listar) y conditional-badge (sin condición que mostrar).
  const isEmpty =
    value === undefined || value === null ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim() === '');
  if (isEmpty && ['expandable-section', 'link-list', 'conditional-badge', 'inline-detail'].includes(hint)) {
    return null;
  }

  const cls = _HINT_CLASS[hint];
  const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
  const html = `<span class="${cls}" data-field="${field}" data-hint="${hint}">${_escCkpt(displayValue)}</span>`;

  return { html, hint };
}

function _escCkpt(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
