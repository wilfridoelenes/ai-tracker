// [PP] mod:5 · autor:Rune · 2026-07-21 UTC-6
// TKT4 (parent: REQ CAEL-0721-01, depends_on: TKT3): "Closed en el período" → "Cerrados —
// acumulado histórico" en Estadísticas finales — rótulo alineado con lo que el campo
// realmente calcula (ver comentario inline junto al campo).

// [PP] mod:4 · autor:Rune · 2026-07-21 UTC-6
// TKT3 (parent: REQ CAEL-0721-01, depends_on: TKT2): agrega sección '## Ítems' — cuerpo
// completo por ítem (origin_module, archivos, comportamiento_actual, resolution_type,
// discard_reason) para los cuatro tipos, incluidos cerrados/descartados. Antes el doc solo
// tenía índice + estadísticas — Rune no podía usarlo como punto de entrada de investigación
// sin abrir archivos reales (gap identificado en auditoría de _ob-DocStandards).

// [PP] mod:3 · autor:Rune · 2026-07-21 UTC-6
// TKT2 (parent: REQ CAEL-0721-01): _buildIndiceMd() — sla_priority ahora uniforme en las
// 4 tablas (antes solo INC), comportamiento_actual agregado a la fila de KE, derived_items
// agregado a la fila de CHG, resolution_type agregado a la fila de INC. Alinea con
// _ob-DocStandards §3b v1.16 (doc_update aplicado por Vera esta sesión). Sin cambio de firma
// de _generateIncidentsMd() — invariant preservado, verificado contra los dos call sites
// (locus-map-generator.js:614, locus-incidents-render.js:316).

// [PP] mod:2 · autor:Rune · 2026-07-20 23:10 UTC-6
// TKT-[pendiente-ID] (deuda técnica, DISC promovida en cierre de REQ CAEL-0720-01): umbral
// de riesgo SLA movido a locus-inc-fields.js (SLA_RIESGO_WINDOW_MS, exportado) — antes vivía
// duplicado a mano aquí y en locus-backlog-render.js. _riesgoTag() sin cambio de comportamiento.
//
// [PP] mod:1 · autor:Rune · 2026-07-20 11:20 UTC-6
// TKT1 (parent: REQ CAEL-0720-01 · "Incidents export — _PP-incidents.md"): generador de
// contenido dedicado a la rama Reactiva (INC/PRB/KE/CHG) — decisión de arquitectura del
// founder (Opción A, sesión de especificación 2026-07-20): archivo nuevo, exclusivo,
// separado de locus-backlog-generator.js (rama Planeada). locus-map-generator.js consumirá
// _generateIncidentsMd() (TKT2) igual que ya consume exportBacklogMd() de
// locus-backlog-generator.js — queda como orquestador puro, sin generación propia.
//
// locus-incidents-generator.js
// Responsabilidad: generación de contenido de _[PREFIJO]-incidents.md — snapshot de Q-INC
// (INC/PRB/KE/CHG). No versiona en el nombre, no se renombra al cerrar sprint
// (__OB-Strategy §5 — Live Queue), no se edita manualmente.
// Dependencias: locus-backlog-core.js · locus-storage.js · locus-inc-fields.js
//
// Hallazgo fuera de scope (declarado en CHECKPOINT, no corregido aquí — fuera de `archivos`
// de este TKT): _isActiveQIncItem() en locus-backlog-generator.js clasifica PRB/KE leyendo
// i.status, campo que tracker_incidents no declara — todo PRB/KE hidratado desde Supabase
// queda excluido del conteo "activo" ahí. Este módulo usa incIncidentStatus() (canónico,
// locus-inc-fields.js) para evitar heredar el mismo bug — la clasificación de este archivo
// puede diferir de la de locus-backlog-generator.js hasta que ese bug se corrija.

import { getIncidents, itemKind, INCIDENT_TYPES } from './locus-backlog-core.js';
import { _docPrefix, getActiveProject } from './locus-storage.js';
import {
  incSlaPriority,
  incDerivedItems,
  incIncidentStatus,
  incResolutionType,
  incComportamientoActual,
  incOriginModule,
  incDiscardReason,
  SLA_RIESGO_WINDOW_MS
} from './locus-inc-fields.js';

const _SLA_ORDER = { high: 0, medium: 1, low: 2 };

// Clasificación de "activo" por tipo — misma semántica de __BR-Ecosystem §5 (Agrupación UI
// de status por grupo) y __BR-Core §6 (ciclos de vida ITIL), aplicada a INC/PRB/KE/CHG.
// CHG es la única excepción de vocabulario (usa status, no incident_status — §4b).
function _isActiveIncident(i) {
  const t = itemKind(i);
  if (t === 'CHG') return i.status === 'pendiente' || i.status === 'en-revision';
  const st = incIncidentStatus(i);
  if (t === 'INC') return !!st && st !== 'closed' && st !== 'descartado';
  if (t === 'PRB') return st === 'detected' || st === 'in_progress' || st === 'resolved';
  if (t === 'KE')  return st === 'active';
  return false;
}

function _pad(n) { return String(n).padStart(2, '0'); }

// Timestamp UTC-6 — mismo cálculo manual que _generateBacklogContent() en
// locus-backlog-generator.js (no usa hora local del navegador).
function _nowUtc6Str() {
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  return `${utcM6.getUTCFullYear()}-${_pad(utcM6.getUTCMonth() + 1)}-${_pad(utcM6.getUTCDate())} ` +
         `${_pad(utcM6.getUTCHours())}:${_pad(utcM6.getUTCMinutes())} UTC-6`;
}

// Línea de infra_version — mismo patrón que _generateMap(ver) en locus-map-generator.js:
// proj.infraVersion si está declarada y no vacía tras trim, literal de ausencia si no.
function _infraVersionLine() {
  const proj = getActiveProject();
  const raw = (proj && proj.infraVersion) ? String(proj.infraVersion).trim() : '';
  return raw ? `<!-- **infra_version: ${raw}** -->` : `<!-- infra_version: no declarada en proyecto -->`;
}

function _sortIncs(list) {
  return list.slice().sort((a, b) => {
    const pa = _SLA_ORDER[incSlaPriority(a)];
    const pb = _SLA_ORDER[incSlaPriority(b)];
    const pna = pa === undefined ? 3 : pa;
    const pnb = pb === undefined ? 3 : pb;
    if (pna !== pnb) return pna - pnb;
    const da = typeof a.slaDeadline === 'number' ? a.slaDeadline : Infinity;
    const db = typeof b.slaDeadline === 'number' ? b.slaDeadline : Infinity;
    return da - db;
  });
}

function _fmtDeadline(i) {
  if (typeof i.slaDeadline !== 'number') return '—';
  const d = new Date(i.slaDeadline);
  return `${d.getUTCFullYear()}-${_pad(d.getUTCMonth() + 1)}-${_pad(d.getUTCDate())} ` +
         `${_pad(d.getUTCHours())}:${_pad(d.getUTCMinutes())} UTC`;
}

// Indicador de riesgo/vencimiento — solo INC high, mismo umbral que renderQIncPanel().
function _riesgoTag(i) {
  if (itemKind(i) !== 'INC') return '';
  if (incSlaPriority(i) !== 'high') return '';
  if (typeof i.slaDeadline !== 'number') return '';
  const now = Date.now();
  if (i.slaDeadline < now) return ' · ⚠️ VENCIDO';
  if (i.slaDeadline < now + SLA_RIESGO_WINDOW_MS) return ' · ⚠️ en riesgo';
  return '';
}

// Sección '## Índice de estado' — un bloque por tipo. sla_priority uniforme en los 4 (TKT2,
// _ob-DocStandards §3b v1.16): INC: código/título/status/priority/deadline/resolution_type ·
// PRB: código/título/status/priority/derived_items · KE: código/título/status/priority/
// comportamiento_actual · CHG: código/título/status/priority/derived_items.
// Tipo sin ítems activos declara 'ninguno' — nunca se omite.
function _buildIndiceMd(active) {
  const byType = { INC: [], PRB: [], KE: [], CHG: [] };
  active.forEach(i => {
    const t = itemKind(i);
    if (byType[t]) byType[t].push(i);
  });

  const lines = ['## Índice de estado', ''];

  lines.push('### INC', '');
  if (!byType.INC.length) {
    lines.push('ninguno', '');
  } else {
    lines.push('| Código | Título | Status | Priority | Deadline | resolution_type |', '|---|---|---|---|---|---|');
    _sortIncs(byType.INC).forEach(i => {
      lines.push(`| \`${i.code}\` | ${i.title || '—'} | ${incIncidentStatus(i) || '—'} | ${incSlaPriority(i) || '—'} | ${_fmtDeadline(i)}${_riesgoTag(i)} | ${incResolutionType(i) || '—'} |`);
    });
    lines.push('');
  }

  lines.push('### PRB', '');
  if (!byType.PRB.length) {
    lines.push('ninguno', '');
  } else {
    lines.push('| Código | Título | Status | Priority | derived_items |', '|---|---|---|---|---|');
    byType.PRB.forEach(i => {
      const derived = incDerivedItems(i);
      lines.push(`| \`${i.code}\` | ${i.title || '—'} | ${incIncidentStatus(i) || '—'} | ${incSlaPriority(i) || '—'} | ${derived && derived.length ? derived.join(', ') : '—'} |`);
    });
    lines.push('');
  }

  lines.push('### KE', '');
  if (!byType.KE.length) {
    lines.push('ninguno', '');
  } else {
    lines.push('| Código | Título | Status | Priority | comportamiento_actual (workaround activo) |', '|---|---|---|---|---|');
    byType.KE.forEach(i => {
      lines.push(`| \`${i.code}\` | ${i.title || '—'} | ${incIncidentStatus(i) || '—'} | ${incSlaPriority(i) || '—'} | ${incComportamientoActual(i) || '—'} |`);
    });
    lines.push('');
  }

  lines.push('### CHG', '');
  if (!byType.CHG.length) {
    lines.push('ninguno', '');
  } else {
    lines.push('| Código | Título | Status | Priority | derived_items |', '|---|---|---|---|---|');
    byType.CHG.forEach(i => {
      const derived = incDerivedItems(i);
      lines.push(`| \`${i.code}\` | ${i.title || '—'} | ${i.status || '—'} | ${incSlaPriority(i) || '—'} | ${derived && derived.length ? derived.join(', ') : '—'} |`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

// Sección '## Ítems' — cuerpo completo por ítem, TODOS los ítems (incluye closed/descartado,
// a diferencia de '## Índice de estado' que es solo activos). Un bloque por tipo, mismo orden
// que el índice. Campos: origin_module, archivos, comportamiento_actual, resolution_type,
// discard_reason — solo se imprime la línea del campo si el ítem lo declara (no listar
// campos ausentes como '—' aquí; el índice ya cubre ese caso de forma tabular).
function _buildItemsMd(all) {
  const byType = { INC: [], PRB: [], KE: [], CHG: [] };
  all.forEach(i => {
    const t = itemKind(i);
    if (byType[t]) byType[t].push(i);
  });

  const lines = ['## Ítems', ''];

  INCIDENT_TYPES.forEach(t => {
    lines.push(`### ${t}`, '');
    if (!byType[t].length) {
      lines.push('ninguno', '');
      return;
    }
    byType[t].forEach(i => {
      lines.push(`#### \`${i.code}\` — ${i.title || '—'}`, '');
      const status = t === 'CHG' ? i.status : incIncidentStatus(i);
      lines.push(`- status: ${status || '—'}`);
      const om = incOriginModule(i);
      if (om) lines.push(`- origin_module: ${om}`);
      if (Array.isArray(i.archivos) && i.archivos.length) lines.push(`- archivos: ${i.archivos.join(', ')}`);
      const ca = incComportamientoActual(i);
      if (ca) lines.push(`- comportamiento_actual: ${ca}`);
      const rt = incResolutionType(i);
      if (rt) lines.push(`- resolution_type: ${rt}`);
      const dr = incDiscardReason(i);
      if (dr) lines.push(`- discard_reason: ${dr}`);
      const derived = incDerivedItems(i);
      if (derived && derived.length) lines.push(`- derived_items: ${derived.join(', ')}`);
      if (i.triggered_by) lines.push(`- triggered_by: ${i.triggered_by}`);
      lines.push('');
    });
  });

  return lines.join('\n');
}

// _generateIncidentsMd() — única función pública de este módulo. Fuente de datos: exclusivamente
// getIncidents() — nunca construye array propio ni lee state directamente (invariant declarado
// en contract_detail del TKT). Nunca acepta parámetro de versión.
export function _generateIncidentsMd() {
  const all = getIncidents() || [];
  const active = all.filter(_isActiveIncident);
  // "Closed en el período" = total - activos dentro de getIncidents() tal cual persiste hoy —
  // sin poda de closed acumulados (gap conocido, declarado en no_incluye del TKT, ver §3b).
  const closedCount = all.length - active.length;

  const prefix = _docPrefix();
  const proj = getActiveProject();
  const projName = proj ? (proj.name || 'Sin proyecto') : 'Sin proyecto';
  const updated = _nowUtc6Str();

  const counts = { INC: 0, PRB: 0, KE: 0, CHG: 0 };
  active.forEach(i => {
    const t = itemKind(i);
    if (counts[t] !== undefined) counts[t]++;
  });

  let md = `# _${prefix}-incidents.md\n`;
  md += `<!-- Última actualización: ${updated} | Proyecto: ${projName} -->\n`;
  md += `${_infraVersionLine()}\n`;
  md += '\n---\n\n';

  md += '## Meta\n\n';
  md += '| Campo | Valor |\n|---|---|\n';
  md += `| Proyecto | ${projName} |\n`;
  md += `| Última actualización | ${updated} |\n`;
  md += `| Generado por | Locus — exportado desde app |\n`;
  md += '\n---\n\n';

  md += `**Q-INC:** INC=${counts.INC} · PRB=${counts.PRB} · KE=${counts.KE} · CHG=${counts.CHG} activos\n\n`;

  md += _buildIndiceMd(active);
  md += '\n---\n\n';

  md += _buildItemsMd(all);
  md += '\n---\n\n';

  md += '## Estadísticas finales\n\n';
  md += '| Campo | Valor |\n|---|---|\n';
  md += `| Ítems totales | ${all.length} |\n`;
  md += `| Activos | ${active.length} |\n`;
  // TKT4 (parent: REQ CAEL-0721-01, depends_on: TKT3): rótulo corregido — "Closed en el
  // período" implicaba delta desde un corte temporal que este módulo no persiste (ver
  // Bifurcación real declarada por Cael en Fase 2 — Opción B elegida, Opción A del snapshot
  // en locus-storage.js queda como DISC separada). Este campo es y siempre fue acumulado
  // histórico, nunca delta — el rótulo ahora lo dice explícitamente en vez de sugerir algo
  // que el módulo no calcula.
  md += `| Cerrados — acumulado histórico (no es delta desde el último export) | ${closedCount} |\n`;

  return md;
}
