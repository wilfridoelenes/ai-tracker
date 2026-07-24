// [PP] mod:10 · autor:Rune · 2026-07-24 11:20 UTC-6
// TKT-202607-087 (parent: REQ-202607-018, gap de integración detectado por Finn en Momento 2 —
// cierre de REQ): _isActiveIncident() agrega 'root_cause_confirmed' al set activo de PRB — antes
// solo detected/in_progress/resolved. El retiro de la rama KE en mod:8 (TKT-202607-065) eliminó el
// tipo separado sin trasladar su semántica de "activo" al estado que lo absorbió (PRB.root_cause_
// confirmed, infra_version 51), dejando a todo PRB en ese status fuera de '## Índice de estado' y
// sin contar en 'PRB=N' de '## Estado actual' — pese a que __BR-Ecosystem §5 (Agrupación UI de
// status por grupo) declara root_cause_confirmed como "Activo ITIL" para PRB, y a que
// _ob-DocStandards §3b exige explícitamente que un PRB en ese status sea "visible en el Índice de
// estado", no solo en el ítem completo. Único cambio: una condición adicional en el OR de la rama
// PRB de _isActiveIncident(). closed/descartado siguen retornando false — sin regresión sobre el
// filtro ya vigente. Sin cambio de firma — signature_change: false. contract_update: sí (ver
// contract_detail de TKT-202607-087) — side effect declarado: cambia el conjunto `active` que
// consumen _buildIndiceMd() y counts.PRB en _generateIncidentsMd().
// [PP] mod:9 · autor:Rune · 2026-07-24 UTC-6
// TKT2 (parent: REQ-202607-018): alinea _generateIncidentsMd()/_buildIndiceMd() a
// _ob-DocStandards §3b. (1) Header '## Estado actual' agregado antes de la línea
// '**Q-INC:**' — antes esa línea no tenía sección propia. (2) Línea 'Contadores:
// INC=N | PRB=N | CHG=N' agregada al final de '## Índice de estado' (separador ' | ',
// distinto del ' · ' de la línea Q-INC — AC lo declara explícito) — reusa byType ya
// computado en _buildIndiceMd(), sin segunda pasada de conteo. (3) Columna
// 'comportamiento_actual' agregada a la tabla PRB del índice — ausente en detected/
// in_progress renderiza '—' (mismo fallback ya usado en el resto de la tabla, sin
// código nuevo de rama de error). (4) Columna 'triggered_by' agregada a la tabla INC
// del índice — ausente renderiza '—'. (5) resolution_type ausente en la fila INC del
// índice ahora renderiza 'n/a' en vez de '—' (AC6 — cambio acotado a esta única celda,
// el resto de columnas de la tabla conserva '—' como fallback genérico). Sin cambio de
// firma en _generateIncidentsMd()/_buildIndiceMd() — ambas siguen sin parámetro nuevo,
// mismos dos call sites (locus-map-generator.js:614, locus-incidents-render.js:316) sin
// impacto. contract_update: n/a — no exportada, sin call sites externos a este archivo.
// [PP] mod:8 · autor:Rune · 2026-07-23 UTC-6
// TKT-202607-065 (REQ-202607-018): retiro completo de 'KE' del universo de tipos ITIL activos
// (fusión KE→PRB.root_cause_confirmed, infra_version 51). _isActiveIncident() sin rama KE —
// itemKind()==='KE' cae al `return false` final, sin excepción. _buildIndiceMd() sin bloque
// '### KE' ni clave byType.KE — comentario de columnas por tipo actualizado a 3 tipos (antes
// 4). _buildItemsMd() sin clave byType.KE — nunca se poblaba de todas formas, ya que itera
// sobre INCIDENT_TYPES (locus-backlog-core.js, sin 'KE' desde antes de este REQ), retirada
// por consistencia. Línea Q-INC (`**Q-INC:** INC=N · PRB=N · CHG=N activos`) sin token KE —
// counts sin clave KE. AC de error verificado: ítem histórico con type:'KE' persistido en
// Supabase — itemKind(i) devuelve 'KE', byType['KE'] es undefined en ambas funciones builder,
// `if (byType[t])` falsy, el ítem se excluye del render sin crash — no se migra, comportamiento
// idéntico al ya vigente para cualquier tipo no reconocido por byType. Sin cambio de firma en
// ninguna función exportada — signature_change: false. Comentarios de mod-log históricos
// (líneas 33/46/54/59-60) describen el estado del sistema en TKTs anteriores — no se reescriben,
// mismo criterio ya aplicado al resto del ecosistema (registro histórico, no estado activo).
// DDL requerido: no — mismo criterio que locus-backlog-core.js mod:131 y locus-session-parse.js
// mod:136 (sin columna ni constraint físico afectados).
// [PP] mod:7 · autor:Rune · 2026-07-22 UTC-6
// TKT-B (REQ CAEL-0722-01, ref_id CAEL-0722-06 · contract_update: sí): _buildItemsMd()
// refactorizada — el bloque por-ítem se extrae a _buildItemBlockMd(i, t), nueva función
// interna. copyIncidentItemMd(code) agregada y exportada — arma el mismo bloque para un
// solo ítem, consumida por el botón "Copiar ítem" de buildQIncItem() (locus-backlog-item.js).
// Sin cambio de comportamiento en _generateIncidentsMd()/_buildItemsMd() — mismo output para
// el export completo, verificar en QA que el snapshot de _${prefix}-incidents.md no cambia.
// contract_detail: _buildItemBlockMd(i, t) → array de líneas, sin efectos secundarios, misma
// fuente de datos (getIncidents()) que el resto del módulo.

// [PP] mod:6 · autor:Rune · 2026-07-21 15:10 UTC-6
// INC-[pendiente-ID] (fix — SyntaxError reportado por founder: locus-incidents-render.js:43 no
// podía importar '_countClosedIncidents', ausente en este módulo): agrega el export faltante.
// Mismo cálculo que closedCount interno de _generateIncidentsMd() (all.length - active.length,
// sobre getIncidents() — invariant de fuente de datos preservado) — ahora factorizado en una sola
// función y reutilizado por ambas, evitando lógica duplicada. Único archivo tocado. Variante ligera
// (BR-Core §6): sin cambio de comportamiento visible salvo la corrección del import roto.

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
// de status por grupo) y __BR-Core §6 (ciclos de vida ITIL), aplicada a INC/PRB/CHG.
// CHG es la única excepción de vocabulario (usa status, no incident_status — §4b).
function _isActiveIncident(i) {
  const t = itemKind(i);
  if (t === 'CHG') return i.status === 'pendiente' || i.status === 'en-revision';
  const st = incIncidentStatus(i);
  if (t === 'INC') return !!st && st !== 'closed' && st !== 'descartado';
  if (t === 'PRB') return st === 'detected' || st === 'in_progress' || st === 'root_cause_confirmed' || st === 'resolved';
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

// Sección '## Índice de estado' — un bloque por tipo. sla_priority uniforme en los 3 (TKT2,
// _ob-DocStandards §3b v1.16): INC: código/título/status/priority/deadline/resolution_type ·
// PRB: código/título/status/priority/derived_items · CHG: código/título/status/priority/
// derived_items.
// Tipo sin ítems activos declara 'ninguno' — nunca se omite.
function _buildIndiceMd(active) {
  const byType = { INC: [], PRB: [], CHG: [] };
  active.forEach(i => {
    const t = itemKind(i);
    if (byType[t]) byType[t].push(i);
  });

  const lines = ['## Índice de estado', ''];

  lines.push('### INC', '');
  if (!byType.INC.length) {
    lines.push('ninguno', '');
  } else {
    lines.push('| Código | Título | Status | Priority | Deadline | resolution_type | triggered_by |', '|---|---|---|---|---|---|---|');
    _sortIncs(byType.INC).forEach(i => {
      lines.push(`| \`${i.code}\` | ${i.title || '—'} | ${incIncidentStatus(i) || '—'} | ${incSlaPriority(i) || '—'} | ${_fmtDeadline(i)}${_riesgoTag(i)} | ${incResolutionType(i) || 'n/a'} | ${i.triggered_by || '—'} |`);
    });
    lines.push('');
  }

  lines.push('### PRB', '');
  if (!byType.PRB.length) {
    lines.push('ninguno', '');
  } else {
    lines.push('| Código | Título | Status | Priority | comportamiento_actual | derived_items |', '|---|---|---|---|---|---|');
    byType.PRB.forEach(i => {
      const derived = incDerivedItems(i);
      lines.push(`| \`${i.code}\` | ${i.title || '—'} | ${incIncidentStatus(i) || '—'} | ${incSlaPriority(i) || '—'} | ${incComportamientoActual(i) || '—'} | ${derived && derived.length ? derived.join(', ') : '—'} |`);
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

  lines.push(`Contadores: INC=${byType.INC.length} | PRB=${byType.PRB.length} | CHG=${byType.CHG.length}`, '');

  return lines.join('\n');
}

// _buildItemBlockMd(i, t) — bloque de un solo ítem, criterio de campos-presentes.
// TKT-B (REQ CAEL-0722-01, ref_id CAEL-0722-06): extraída del forEach interno de
// _buildItemsMd() — antes el criterio de qué campos imprimir vivía inline y sin
// nombre propio. Ahora es la única fuente de ese criterio: _buildItemsMd() y
// copyIncidentItemMd() (nueva, ver abajo) llaman esta misma función — ningún
// consumidor duplica la lista de campos ni el orden. `t` se pasa explícito (no se
// re-deriva con itemKind(i)) porque _buildItemsMd() ya lo tiene disponible del
// agrupamiento por tipo — evita una segunda llamada redundante en el loop original.
function _buildItemBlockMd(i, t) {
  const lines = [];
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
  return lines;
}

// Sección '## Ítems' — cuerpo completo por ítem, TODOS los ítems (incluye closed/descartado,
// a diferencia de '## Índice de estado' que es solo activos). Un bloque por tipo, mismo orden
// que el índice. Campos: origin_module, archivos, comportamiento_actual, resolution_type,
// discard_reason — solo se imprime la línea del campo si el ítem lo declara (no listar
// campos ausentes como '—' aquí; el índice ya cubre ese caso de forma tabular).
function _buildItemsMd(all) {
  const byType = { INC: [], PRB: [], CHG: [] };
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
      lines.push(..._buildItemBlockMd(i, t), '');
    });
  });

  return lines.join('\n');
}

// copyIncidentItemMd(code) — TKT-B (REQ CAEL-0722-01, ref_id CAEL-0722-06): bloque de
// un solo ítem para copiar al portapapeles desde la card, sin exportar _PP-incidents.md
// completo. Reusa _buildItemBlockMd() — mismo criterio de campos-presentes que el export
// completo, sin duplicar la lista de campos. Busca en getIncidents() por code (misma
// fuente de datos que el resto del módulo — invariant preservado). Retorna null si el
// código no existe — caller (locus-incidents-render.js) decide el feedback de error.
export function copyIncidentItemMd(code) {
  const all = getIncidents() || [];
  const item = all.find(i => i.code === code);
  if (!item) return null;
  const t = itemKind(item);
  return _buildItemBlockMd(item, t).join('\n').trim();
}

// _countClosedIncidents() — export nuevo (INC fix, mod:6). Expone el mismo cálculo que
// _generateIncidentsMd() ya hacía internamente como variable local: total de getIncidents()
// menos activos según _isActiveIncident(). Único consumidor conocido: locus-incidents-render.js
// (markIncidentsExported() en el listener shell:export-qinc). Misma fuente de datos que el
// resto del módulo — exclusivamente getIncidents().
export function _countClosedIncidents() {
  const all = getIncidents() || [];
  const active = all.filter(_isActiveIncident);
  return all.length - active.length;
}

// _generateIncidentsMd() — única función pública de este módulo (junto con _countClosedIncidents).
// Fuente de datos: exclusivamente getIncidents() — nunca construye array propio ni lee state
// directamente (invariant declarado en contract_detail del TKT). Nunca acepta parámetro de versión.
export function _generateIncidentsMd() {
  const all = getIncidents() || [];
  const active = all.filter(_isActiveIncident);
  // mod:6: closedCount ahora delega en el mismo cálculo que _countClosedIncidents() — una sola fuente.
  const closedCount = all.length - active.length;

  const prefix = _docPrefix();
  const proj = getActiveProject();
  const projName = proj ? (proj.name || 'Sin proyecto') : 'Sin proyecto';
  const updated = _nowUtc6Str();

  const counts = { INC: 0, PRB: 0, CHG: 0 };
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

  md += '## Estado actual\n\n';
  md += `**Q-INC:** INC=${counts.INC} · PRB=${counts.PRB} · CHG=${counts.CHG} activos\n\n`;

  md += _buildIndiceMd(active);
  md += '\n---\n\n';

  md += _buildItemsMd(all);
  md += '\n---\n\n';

  md += '## Estadísticas finales\n\n';
  md += '| Campo | Valor |\n|---|---|\n';
  md += `| Ítems totales | ${all.length} |\n`;
  md += `| Activos | ${active.length} |\n`;
  md += `| Cerrados — acumulado histórico (no es delta desde el último export) | ${closedCount} |\n`;

  return md;
}
