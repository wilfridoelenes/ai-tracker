// [PP] mod:16 · autor:Rune · 2026-08-18 22:30 UTC-6
// TKT-202608-263 (parent: REQ-202608-104, depends_on: TKT-202608-262): nueva función exportada
// _generateIncidentsFullMd() — export puntual "histórico completo" que el comentario de mod:14
// (línea 8, sin cambiar) ya anticipaba. Reutiliza _isIndexEligible() (mod:13, conservada sin
// llamar en _generateIncidentsMd() desde mod:14 exactamente para este propósito) para
// '## Índice de estado' — closed(INC/PRB)/done(CHG) incluidos, solo `descartado` fuera. A
// diferencia del export activo, '## Ítems' recibe `all` sin ningún filtro — incluye
// `descartado`, porque este es el snapshot histórico completo, complemento natural del export
// activo (que desde mod:14 excluye tanto closed como descartado). Sin sección '## Cerrados
// recientes' — esa sección es el complemento del filtro del export activo; aquí no hay
// complemento que declarar, todo vive ya en '## Ítems'. Sin llamada a markIncidentsExported() —
// ese mecanismo de snapshot/delta es exclusivo del export activo (shell:export-qinc), no tiene
// relación con un snapshot puntual sin filtro. Fuente de datos: exclusivamente getIncidents() —
// mismo invariant que _generateIncidentsMd(). Sin parámetro de versión — mismo criterio.
// Naming del archivo (`_${prefix}-incidents-full.md`, sin versión en el nombre) vive en el
// caller (locus-incidents-render.js) — este módulo solo genera contenido, nunca decide
// filename, mismo split de responsabilidad que _generateIncidentsMd(). contract_update: no —
// función nueva sin consumidor previo, sin cambio de firma en ninguna función existente.
// [PP] mod:14 · autor:Rune · 2026-08-06 UTC-6
// TKT-202608-262 (parent: REQ-202608-104, depends_on: []): _generateIncidentsMd() pasa a ser
// el export "activo" en sentido estricto — '## Estado actual', '## Índice de estado' y
// '## Ítems' ahora se calculan sobre `active` (ítems no-closed vía _isActiveIncident()) en vez
// de `all`/`indexEligible`. Efecto directo: _buildIndiceMd() vuelve a recibir el set estrecho —
// la ampliación de mod:13 (INC-202607-039, indexEligible incluía closed(INC/PRB)/done(CHG)) queda
// revertida para este export; esa visibilidad de histórico completo la cubrirá el export puntual
// separado _[Prefijo]-incidents-full.md (TKT-202608-263, mismo REQ) — _isIndexEligible() se
// conserva sin llamar en este archivo, no se borra: TKT-202608-263 la reutilizará para ese export.
// Nueva sección '## Cerrados recientes' (_buildCerradosRecientesMd) inmediatamente después de
// '## Ítems' — tabla Código/Tipo/Título/resolution_type·discard_reason/Cerrado sobre
// closedItems = all \ active (INC/PRB en closed o descartado, CHG en done o descartado — mismo
// criterio que ya excluye _isActiveIncident(), sin predicado nuevo). Columna 'Cerrado' usa el
// nuevo helper genérico _fmtTs(ms) (factoriza el cálculo ya usado por _fmtDeadline, sin cambiar
// su output) sobre i.statusChangedAt (tracker_incidents, columna agregada en TKT-202607-122) —
// '—' si el ítem no la declara (filas hidratadas antes de ese ALTER).
// '## Estadísticas finales': eliminadas las filas 'Cerrados — desde el último export' y
// 'Cerrados — acumulado histórico' (mod:5/mod:12) junto con las variables locales que solo
// alimentaban esas dos filas (closedCount, _exportSnapshot, _closedSinceLastExport) — AC4 exige
// que las tres secciones (Estado actual/Índice/Estadísticas) calculen valores exclusivamente
// sobre el set filtrado; una fila de "cerrados" es por definición un valor del complemento, no
// del set filtrado, y esa cobertura la absorbe la nueva '## Cerrados recientes' (lista completa,
// no solo un conteo) y el export full de TKT-202608-263 (histórico acumulado real). 'Ítems
// totales' pasa de `all.length` a `active.length` (AC4, ejemplo literal: 5 totales/2 closed →
// base 3, no 5) — la fila 'Activos' queda como duplicado exacto del mismo valor y se retira en
// vez de dejar dos filas idénticas sin valor informativo.
// _countClosedIncidents() (mod:6, exportada) NO se toca — consumidor externo
// (locus-incidents-render.js → markIncidentsExported()) sigue necesitando all.length-active.length
// sin relación con el contenido del .md exportado. contract_update: no — _buildIndiceMd()/
// _buildItemsMd() siguen sin cambio de firma (mismo tipo de parámetro, un array de ítems), _fmtTs()
// y _buildCerradosRecientesMd() son funciones internas nuevas sin consumidor fuera de este archivo.
// [PP] mod:13 · autor:Rune · 2026-07-25 UTC-6
// INC-202607-039 (fix — hallazgo de auditoría contra _ob-DocStandards §3b, sin ítem padre):
// _buildIndiceMd() recibía `active` (filtrado por _isActiveIncident()) — INC/PRB en closed y
// CHG en done quedaban fuera de '## Índice de estado' pese a que ambas tablas ya tienen columna
// Status para diferenciarlos visualmente. Fix: nueva función _isIndexEligible(i) — mismo criterio
// que _isActiveIncident() salvo que no excluye closed(INC/PRB)/done(CHG), solo excluye
// `descartado` (ítem cancelado, sin valor de índice). _generateIncidentsMd() ahora filtra `all`
// con _isIndexEligible() y pasa ese resultado a _buildIndiceMd() — la línea '**Q-INC:** ... activos'
// y `counts` siguen usando `active`/_isActiveIncident() sin cambio, ya que esa línea mide actividad,
// no cobertura del índice. Sin cambio de firma en _buildIndiceMd() — sigue recibiendo un array de
// ítems, solo cambia cuál. contract_update: no — función interna, sin consumidor externo a este
// archivo.
// INC-202607-041 (verificado, sin cambio de código — hallazgo ya resuelto por mod:12): la fila
// 'Cerrados — desde el último export' en '## Estadísticas finales' ya está presente desde TKT3
// (REQ-202607-035, mod:12, mismo día) — el INC quedaba `detected` porque nadie lo transicionó
// tras ese TKT, no porque el código siguiera sin el campo. Verificado por grep contra este archivo
// antes de declarar resolved — sin fix adicional necesario.
// [PP] mod:12 · autor:Rune · 2026-07-25 UTC-6
// TKT3 (parent: REQ-202607-035, depends_on: n/a): Estadísticas finales de _generateIncidentsMd()
// declara 'Cerrados — desde el último export' como valor separado de 'Cerrados — acumulado
// histórico' — antes solo existía el acumulado. Delta calculado contra
// proj.incidentsExportSnapshot.closedCount (poblado por markIncidentsExported(), mecanismo ya
// existente desde REQ CAEL-0721-07 y ya consumido por TKT-202607-115 en _buildIndiceMd() — sin
// persistencia nueva, sin cambio de schema). Snapshot ausente (primer export, null por default) →
// el delta muestra el mismo valor que el acumulado, sin restar nada. Sin cambio de firma de
// _generateIncidentsMd() — invariant preservado. No toca _buildIndiceMd, _buildItemsMd ni
// markIncidentsExported() — fuera de scope declarado en el TKT. contract_update: no — cambio
// interno a una función sin consumidor que dependa de las filas exactas de la tabla generada.
// [PP] mod:11 · autor:Rune · 2026-07-24 UTC-6
// INC-202607-021 (fix — hallazgo de auditoría contra _ob-DocStandards §3b, sin ítem padre):
// _infraVersionLine() leía proj.infraVersion (campo per-proyecto, semántica distinta a la
// requerida) y nunca emitía el desglose BR-Core/BR-Ecosystem/BR-Execution/OB-Strategy exigido
// por el encabezado canónico — corregido a leer getInfraVersionData() (locus-storage.js, fuente
// global ya consumida por locus-ui-shell.js para #gf-infra-version). Ver comentario inline junto
// a la función para detalle completo. Sin cambio de firma — _generateIncidentsMd() sigue sin
// parámetro de versión (invariant preservado, ver _Locus-module-contracts §2). Un solo archivo
// tocado, sin lógica de negocio nueva — Variante Fast Track (__BR-Core §6). contract_update: no —
// _infraVersionLine() no es exportada, sin call sites externos a este archivo.
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
// INC histórico — sin CHECKPOINT confirmado (fix — SyntaxError reportado por founder: locus-incidents-render.js:43 no
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
// TKT histórico — sin CHECKPOINT confirmado (deuda técnica, DISC promovida en cierre de REQ CAEL-0720-01): umbral
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
import { _docPrefix, getActiveProject, getInfraVersionData } from './locus-storage.js';
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

// Elegibilidad para '## Índice de estado' — INC-202607-039. Más amplia que _isActiveIncident():
// incluye closed(INC/PRB) y done(CHG), porque el índice ya declara Status por fila y OBDS §3b
// exige visibilidad de esos estados ahí, no solo en '## Ítems'. Solo excluye `descartado` —
// ítem cancelado, sin valor de índice de estado.
// TKT-202608-262: sin call site en este archivo desde este mod — _generateIncidentsMd() (export
// activo) volvió a `active` para el índice, ver mod:14. Se conserva sin borrar: TKT-202608-263
// (mismo REQ, export full histórico) reutiliza este criterio ampliado para ese archivo.
function _isIndexEligible(i) {
  const t = itemKind(i);
  if (t === 'CHG') return i.status !== 'descartado';
  const st = incIncidentStatus(i);
  if (t === 'INC' || t === 'PRB') return !!st && st !== 'descartado';
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

// Línea de infra_version — INC-202607-021 (fix): la versión anterior leía proj.infraVersion,
// campo per-proyecto de semántica distinta (default 0, ver locus-storage.js — "campo infra_version
// del proyecto", no confundir con el breakdown de módulos BR) y nunca emitía BR-Core/BR-Ecosystem/
// BR-Execution/OB-Strategy — el header quedaba incompleto incluso cuando proj.infraVersion sí tenía
// valor, y "no declarada en proyecto" cuando no lo tenía, pese a que la fuente de verdad real
// (getInfraVersionData(), locus-storage.js) sí podía tener el dato. Fuente correcta: state.infraVersionData
// { infraVersion, brCore, brEcosystem, brExecution, obStrategy } — mismo dato que ya consume
// locus-ui-shell.js para #gf-infra-version en la barra de estado (locus-ui-shell.js, ver
// _Locus-module-contracts §2). Formato alineado a _ob-DocStandards §3b §1 Encabezado — sin
// "Generación" ni "Historial Gen 1" (esos campos son exclusivos de docs categoría Docs: CONTEXT/
// STRATEGY/MAP, no de este Doc Ref-como-Live-Queue). _generateIncidentsMd() sigue sin aceptar
// parámetro de versión — invariant preservado (ver contract_detail), la función lee el estado
// global en el momento de la llamada, igual que antes leía proj vía getActiveProject().
function _infraVersionLine() {
  const d = getInfraVersionData();
  if (!d || typeof d.infraVersion !== 'number' || !Number.isFinite(d.infraVersion) || d.infraVersion <= 0) {
    return '<!-- infra_version: no declarada en proyecto -->';
  }
  const parts = [];
  if (d.brCore) parts.push(`BR-Core v${d.brCore}`);
  if (d.brEcosystem) parts.push(`BR-Ecosystem v${d.brEcosystem}`);
  if (d.brExecution) parts.push(`BR-Execution v${d.brExecution}`);
  if (d.obStrategy) parts.push(`OB-Strategy v${d.obStrategy}`);
  const suffix = parts.length ? ` | ${parts.join(' · ')}` : '';
  return `<!-- **infra_version: ${d.infraVersion}**${suffix} -->`;
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

// _fmtTs(ms) — TKT-202608-262: formateador genérico de timestamp UTC, factorizado del cálculo
// que _fmtDeadline() ya hacía inline para slaDeadline. Mismo output exacto — _fmtDeadline() no
// cambia de comportamiento, solo delega. Reutilizado por _buildCerradosRecientesMd() para la
// columna 'Cerrado' (i.statusChangedAt).
function _fmtTs(ms) {
  if (typeof ms !== 'number') return '—';
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${_pad(d.getUTCMonth() + 1)}-${_pad(d.getUTCDate())} ` +
         `${_pad(d.getUTCHours())}:${_pad(d.getUTCMinutes())} UTC`;
}

function _fmtDeadline(i) {
  if (typeof i.slaDeadline !== 'number') return '—';
  return _fmtTs(i.slaDeadline);
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
// INC-202607-039 (mod:13): recibe ítems filtrados por _isIndexEligible() — closed(INC/PRB) y
// done(CHG) incluidos, solo `descartado` queda fuera. Ya no es "solo activos" pese al nombre
// del parámetro histórico — cada tabla tiene columna Status para diferenciar.
// Tipo sin ítems declara 'ninguno' — nunca se omite.
function _buildIndiceMd(items) {
  const byType = { INC: [], PRB: [], CHG: [] };
  items.forEach(i => {
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

// Sección '## Ítems' — cuerpo completo por ítem del set recibido. Un bloque por tipo, mismo
// orden que el índice. Campos: origin_module, archivos, comportamiento_actual, resolution_type,
// discard_reason — solo se imprime la línea del campo si el ítem lo declara (no listar
// campos ausentes como '—' aquí; el índice ya cubre ese caso de forma tabular).
// TKT-202608-262 (mod:14): corrección de comentario — este bloque describía "TODOS los ítems
// (incluye closed/descartado)" desde antes de este TKT; desde mod:14 el único call site pasa
// `active` (ver _generateIncidentsMd), no `all` — el nombre del parámetro (`all`) es residual
// del período pre-TKT y no se renombra aquí por no ser parte del scope (sin impacto funcional,
// solo el nombre de la variable local). El comentario anterior quedaba contradictorio con el
// comportamiento real desde este mismo mod — corregido en la misma sesión (Excepción de
// resolución directa: Patch, sin bifurcación, dueño presente — __BR-Core NO DEJAR DEUDA EN
// SILENCIO).
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

// Sección '## Cerrados recientes' — TKT-202608-262 (REQ-202608-104). Complemento de '## Ítems',
// que desde este TKT solo lista activos (no-closed). closedItems = all \ active — INC/PRB en
// incident_status closed o descartado, CHG en status done o descartado (mismo criterio que ya
// excluye _isActiveIncident(), sin predicado nuevo). Empty state 'ninguno' — mismo patrón ya
// usado por _buildIndiceMd()/_buildItemsMd() por tipo, nunca tabla vacía sin mensaje.
function _buildCerradosRecientesMd(closedItems) {
  const lines = ['## Cerrados recientes', ''];
  if (!closedItems.length) {
    lines.push('ninguno', '');
    return lines.join('\n');
  }
  lines.push(
    '| Código | Tipo | Título | resolution_type/discard_reason | Cerrado |',
    '|---|---|---|---|---|'
  );
  closedItems.forEach(i => {
    const t = itemKind(i);
    const rd = incResolutionType(i) || incDiscardReason(i) || 'n/a';
    lines.push(`| \`${i.code}\` | ${t} | ${i.title || '—'} | ${rd} | ${_fmtTs(i.statusChangedAt)} |`);
  });
  lines.push('');
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
  // TKT-202608-262: 'closedItems' reemplaza el uso previo de closedCount agregado en este
  // export — ahora se listan los ítems cerrados completos en '## Cerrados recientes' en vez de
  // solo un conteo. _countClosedIncidents() (mod:6, exportada) sigue siendo la fuente para
  // markIncidentsExported() — no se toca, es un consumidor externo sin relación con el .md.
  const closedItems = all.filter(i => !_isActiveIncident(i));

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

  // TKT-202608-262 (AC4): '## Índice de estado' vuelve a calcularse sobre `active` — la
  // ampliación de mod:13/INC-202607-039 (indexEligible, incluía closed/done) queda revertida
  // para este export activo. _isIndexEligible() se conserva sin llamar aquí — TKT-202608-263
  // (export full histórico, mismo REQ) la reutiliza.
  md += _buildIndiceMd(active);
  md += '\n---\n\n';

  // TKT-202608-262 (AC1): '## Ítems' solo lista no-closed — antes recibía `all`.
  md += _buildItemsMd(active);
  md += '\n---\n\n';

  // TKT-202608-262 (AC2): nueva sección — complemento de '## Ítems' para los ítems que el
  // filtro de arriba excluyó, sin obligar a abrir el export full para verlos.
  md += _buildCerradosRecientesMd(closedItems);
  md += '\n---\n\n';

  // TKT-202608-262 (AC4): 'Ítems totales' pasa de `all.length` a `active.length` — la fila
  // 'Activos' (mod:1) quedaría como duplicado exacto del mismo valor y se retira. Las filas de
  // cerrados (mod:5/mod:12) se retiran — un valor de cerrados es por definición del complemento
  // del set filtrado; esa cobertura la asume '## Cerrados recientes' (arriba) y el export full.
  md += '## Estadísticas finales\n\n';
  md += '| Campo | Valor |\n|---|---|\n';
  md += `| Ítems totales | ${active.length} |\n`;

  return md;
}

// _generateIncidentsFullMd() — TKT-202608-263. Export puntual sin filtro — histórico completo
// de Q-INC. Ver mod:15 para el detalle completo del criterio de cada sección.
export function _generateIncidentsFullMd() {
  const all = getIncidents() || [];
  const indexEligible = all.filter(_isIndexEligible);

  const prefix = _docPrefix();
  const proj = getActiveProject();
  const projName = proj ? (proj.name || 'Sin proyecto') : 'Sin proyecto';
  const updated = _nowUtc6Str();

  const counts = { INC: 0, PRB: 0, CHG: 0 };
  all.forEach(i => {
    const t = itemKind(i);
    if (counts[t] !== undefined) counts[t]++;
  });

  let md = `# _${prefix}-incidents-full.md\n`;
  md += `<!-- Última actualización: ${updated} | Proyecto: ${projName} | Export puntual — histórico completo, sin versión en el nombre -->\n`;
  md += `${_infraVersionLine()}\n`;
  md += '\n---\n\n';

  md += '## Meta\n\n';
  md += '| Campo | Valor |\n|---|---|\n';
  md += `| Proyecto | ${projName} |\n`;
  md += `| Última actualización | ${updated} |\n`;
  md += `| Generado por | Locus — exportado desde app (histórico completo, sin filtro) |\n`;
  md += '\n---\n\n';

  md += '## Estado actual\n\n';
  md += `**Q-INC (histórico completo):** INC=${counts.INC} · PRB=${counts.PRB} · CHG=${counts.CHG}\n\n`;

  // Mismo criterio de mod:13 (_isIndexEligible) — closed/done incluidos, solo descartado fuera.
  md += _buildIndiceMd(indexEligible);
  md += '\n---\n\n';

  // Sin filtro — a diferencia del export activo (que recibe `active`), aquí `all` incluye
  // también los ítems `descartado`.
  md += _buildItemsMd(all);
  md += '\n---\n\n';

  md += '## Estadísticas finales\n\n';
  md += '| Campo | Valor |\n|---|---|\n';
  md += `| Ítems totales | ${all.length} |\n`;

  return md;
}
