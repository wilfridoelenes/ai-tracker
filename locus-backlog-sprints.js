// [PP] mod:70 · autor:Rune · 2026-08-18 UTC-6
// TKT-202608-375 (REQ-202608-151, origen_disc DISC-202608-156): extiende el gate duro de
// cierre por origen_disc (_scmExecuteClose(), mod:65/TKT-202608-361) al caso huérfano —
// origen_disc que no resuelve a ningún ítem real del backlog, antes explícitamente fuera de
// scope ("problema de integridad distinto, no bloquea"). AC1-AC3 de este TKT (happy path DISC
// en discovery/promoted, sprint sin origen_disc) ya estaban cubiertos por la implementación
// existente — verificado contra el archivo real antes de escribir el delta, sin cambio de
// comportamiento para esos tres casos. Único cambio: el branch que antes retornaba en
// silencio ante origenDisc sin ítem real ahora empuja un blocker con mensaje 'DISC de origen
// no encontrada'. Hallazgo fuera de scope (ver CHECKPOINT de esta entrega): el `problema` de
// REQ-202608-151 describe el gate como si aún no existiera ("solo alerta pasiva de DocLog")
// — desactualizado desde PP-S-38 (2026-08-15, TKT-202608-361). No corregido en este TKT —
// contenido del REQ, fuera del scope de Rune.
// [PP] mod:68 · autor:Rune · 2026-08-16 UTC-6
// Fix inline (triggered_by TKT-202608-377, auditoría Finn): comentario de markRetroEvaluated()
// (líneas ~919-921) seguía afirmando "sin wiring a UI, invocación queda para sesión posterior"
// pese a que este mismo TKT ya la invoca desde locus-session-parse.js — corregido abajo para
// reflejar el estado real.
// [PP] mod:67 · autor:Rune · 2026-08-16 UTC-6
// TKT-202608-377 (REQ-202608-150, depends_on TKT-202608-373): markRetroEvaluated(id) —
// declarada en mod:66 sin caller — ahora tiene invocación real desde
// locus-session-parse.js (_applyRetroEvaluatedSprint, flujos single y batch de ingesta de
// CHECKPOINT). Sin cambio de firma ni de comportamiento interno de esta función. Ver
// header de locus-session-parse.js para el detalle del wiring.
// [PP] mod:66 · autor:Rune · 2026-08-16 09:15 UTC-6
// TKT-202608-373 (REQ-202608-150): setSprintStatus() setea sp.retroEvaluated = false al
// transicionar a 'closed' — mismo bloque de asignaciones que closedAt/endsAt, antes del
// _upsertSprint() ya existente al final de la función (persiste el valor sin llamada extra).
// Función de marcado nueva: markRetroEvaluated(id) — busca el sprint, setea
// retroEvaluated = true, persiste vía _upsertSprint() (mismo patrón que confirmEditSprint()),
// save(), renderSprintTab(), toast de confirmación. Sin wiring a UI en este TKT — la
// invocación (ej. desde el badge de TKT-202608-374) queda fuera de scope de TKT1. AC de
// mecanismo de disparo ("CHECKPOINT de Cael declarando evaluación") resuelto como contrato de
// función invocable directamente — no existe hoy un canal de patch de CHECKPOINT sobre
// tracker_sprints (type: patch solo targetea tracker_items/tracker_incidents,
// __BR-Ecosystem §8); extenderlo está fuera de scope de este TKT.
// [PP] mod:65 · autor:Rune · 2026-08-15 UTC-6
// TKT-202608-361 (REQ-202608-144, origen_disc DISC-202608-150): gate duro en _scmExecuteClose()
// — sprint no cierra si algún ítem del sprint declara origen_disc cuya DISC referenciada no
// tiene status:'promoted'. Insertado entre el gate de DOC-UPDATEs (línea ~1533, sin cambio) y
// el bloque de aplicar migraciones — mismo nivel, mismo patrón: showToast('error', ...) + return
// antes de cualquier mutación. Resuelve la DISC vía getItems().find(it => it.code ===
// i.origenDisc) — mismo patrón ya usado en mergeBacklogFromTG() (locus-backlog-item.js
// mod:164) para el chequeo no bloqueante de ingesta; getItems() ya estaba importado en este
// archivo, sin import nuevo. itemKind(i) !== 'DISC' excluye DISCs del propio sprint del
// barrido de origenDisc (una DISC no referencia otra DISC como origen en el modelo vigente,
// __BR-Ecosystem §5) — evita falso positivo si una DISC quedara con sprint asignado por error
// de datos. Ítem huérfano (origenDisc que no resuelve a ningún ítem real) no bloquea —
// declarado explícitamente fuera de scope en el AC (problema de integridad distinto). Un solo
// toast lista todos los pares bloqueantes del sprint, no solo el primero. contract_update: sí
// — primera entrada de _scmExecuteClose() en _Locus-module-contracts.md §2, ver CHECKPOINT de
// esta entrega.
// [PP] mod:64 · autor:Rune · 2026-08-15 UTC-6
// TKT-202608-351 (REQ-202608-138): botón 'Ver pendientes' en el Paso 2 (DOC-UPDATEs) del
// modal de cierre de sprint — navega al panel real de pendientes en Documentos. Agregado:
// _scmGoToDocUpdates() y case 'scm-go-to-doc-updates' en la delegación de #sprint-close-body.
// _scmStepDocUpdatesHtml() renderiza el botón solo en la rama con pendientes (la rama vacía,
// más arriba en la función, ya retorna antes sin tocar). AC del REQ nombra el target como
// '#doc-updates-list' — id retirado desde la unificación de renderDocUpdatesUnified()
// (locus-docs.js, ver TKT-202608-237/238); el contenedor vigente es '#du-unified-list', mismo
// elemento funcional. Sin CSS nuevo: reutiliza .scm-docgen-btn (ya usada dos veces en este
// archivo) y el patrón de arrow-en-texto '→' ya establecido en este mismo módulo (ej.
// nextBtn.textContent = 'Siguiente →') en vez de un ícono SVG — sin _Locus-css-ref/_Locus-ux-ref
// adjuntos en esta sesión para validar un símbolo de sprite nuevo. Navegación: mismo patrón
// switchTab()+setTimeout()+switchSubTab()+scrollIntoView ya usado en locus-ui-shell.js (atajo
// 'paste-ckpt' y breadcrumb-proj→Documentos/Contexto) — sin mecanismo nuevo.
// [PP] mod:63 · autor:Rune · 2026-08-08 15:40 UTC-6
// TKT1 (parent CAEL-08081500-01, ref_id CAEL-08081500-02): _SCM_STEPS reemplaza el mapeo
// hardcodeado paso→render/indicador/totalSteps, antes triplicado en _scmBack/_scmNext/_scmRender.
// Renombrados por contenido: _scmStep1Html→_scmStepResumenHtml, _scmStepDuHtml→
// _scmStepDocUpdatesHtml, _scmStep2Html→_scmStepMigracionHtml, _scmStep3Html→_scmStepRetroHtml.
// Cierra Hallazgo E de _Locus-ux-ref — ver index.html para el 4º nodo de indicador agregado.
// INC-202608-093: _generateSprintRetroMd() leía duAplicados/duDescartados desde
// _scmState.docUpdates filtrando por d.resolucion — campo vestigial desde CHG-202608-002
// (Paso 2 del wizard es de solo lectura, `resolucion` nunca se muta ahí), así que ambas
// listas de la retro reportaban 0 siempre, sin importar cuántos DOC-UPDATEs se hubieran
// resuelto realmente vía Doc Log durante el sprint. Fuente corregida: docUpdateResolvedLog
// (TKT-202608-236, _getDocUpdateResolvedLog()/locus-storage.js) — poblado exclusivamente por
// _pushDocUpdateResolved() (locus-docs.js) al hacer clic Aplicar/Descartar en Doc Log, único
// lugar donde un DOC-UPDATE se resuelve desde CHG-202608-002. Se acota a la ventana del
// sprint (resolvedAt >= sprint.startedAt) — mismo criterio ya usado para incidentes cerrados
// (_incEligibleForSprintClose), evita arrastrar resoluciones de sprints anteriores. Campos
// `aplicado-por`/`escalar-a` retirados del formato de línea — docUpdateResolvedLog no declara
// `resolvedBy` (Locus es single-user, ver comentario de _pushDocUpdateResolved() en
// locus-docs.js); reemplazados por la fecha de resolución (mismo formato _incDate ya usado
// para incidentes). Import nuevo: _getDocUpdateResolvedLog desde locus-storage.js — export ya
// existente, sin cambio de firma, consumido hoy también por locus-docs.js (sin conflicto).
// Hallazgo fuera de scope registrado en CHECKPOINT de esta entrega, no corregido aquí: el
// template de salida de la retro (más abajo en esta función) rotula la segunda lista como
// "Doc-Updates pendientes:" pese a estar poblada con descartados — mismatch de etiqueta
// preexistente a este fix, fuera del AC de INC-202608-093.
// [PP] mod:61 · autor:Rune · 2026-08-05 UTC-6
// CHG-202608-002: Paso 2 del wizard de cierre (DOC-UPDATEs) — limpieza de código muerto tras
// la conversión a solo lectura ya presente en _scmStepDocUpdatesHtml(). Retirado: case 'scm-du-resolve'
// del delegador de clicks (sin botones que lo disparen desde mod:60), bloque de persistencia
// de resolución en _scmExecuteClose() (no-op — solo corría con docUpdates.length===0), y el
// check de `resolucion` en _scmUpdateDuNextBtn() (campo vestigial, nunca mutado). Los gates
// de bloqueo de "Siguiente" y de cierre se simplifican a docUpdates.length > 0 — mismo
// comportamiento observable, sin lógica muerta. Hallazgo fuera de scope registrado en
// CHECKPOINT: _generateSprintRetroMd() sigue leyendo d.resolucion para las secciones
// "Doc-Updates aplicados/Descartados" de la retro — con resolucion siempre null desde
// CHG-202608-002 (y desde antes, dado que _scmStepDocUpdatesHtml ya era solo-lectura en mod:60), esas
// dos secciones de la retro reportan 0 siempre. Además desalineado con __BR-Ecosystem §5
// ("Doc-Updates aplicados/pendientes no son campos propios de la retro... no se duplican
// aquí"). No corregido en este CHG — toca una función distinta (generación de retro), fuera
// del origin_module declarado. Ver INC registrado en el CHECKPOINT de esta entrega.
// INC-202608-085 (auditoría end-to-end footer DOC-UPDATEs solicitada por el founder):
// confirmCloseSprint() leía sp.docUpdates para poblar el Paso 2 del modal de cierre — campo
// que ningún archivo del repo asigna jamás (grep confirmado); el Paso 2 siempre renderizaba
// vacío, desconectado del índice real (docUpdateIndex, locus-docs.js). Fix: leer
// _getDocUpdateIndex() directamente — mismo scoping por proyecto activo que ya usaba el
// bloque de cómputo de `vencido` en _scmExecuteClose(). Gate duro agregado en
// _scmExecuteClose() — antes solo el botón Siguiente se deshabilitaba (_scmUpdateDuNextBtn),
// sin guard en el cierre en sí; con docUpdates ahora poblado, ese gate era vacuo (longitud 0)
// y nunca bloqueaba. La resolución del Paso 2 (Aplicado/Descartado por fila) ahora se
// persiste sobre el índice real al ejecutar el cierre — antes solo mutaba _scmState local sin
// tocar docUpdateIndex, dejando las entradas "resueltas" en el wizard visibles otra vez en el
// panel de Backlog. contract_update: sí — ver CHECKPOINT de esta entrega, docUpdates de
// _scmState gana campo `key` (referencia directa a docUpdateIndex, evita reconstruir
// doc+'::'+seccion). No modifica _scmStepDocUpdatesHtml() ni el markup del Paso 2 — mismos campos
// consumidos (doc/seccion/escalarA/resolucion), solo cambia su origen.
// [PP] mod:59 · autor:Rune · 2026-07-26 09:40 UTC-6
// Corrección de trazabilidad — resuelta en sesión (Patch, dueño presente, sin bifurcación
// de founder): el header de mod:58 y las referencias inline citaban 'TKT-202607-131
// (REQ-202607-039)' — código incorrecto. TKT-202607-131 es un ticket real y no relacionado
// (Ingest validation panel, REQ-202607-041, done). El código correcto es TKT-202607-134
// (TKT4, REQ-202607-039) — mismo criterio y detalle que la corrección espejo en
// locus-sprint.js mod:118. Gap de dependencia registrado, no resuelto por esta corrección:
// TKT-202607-134 depende de TKT-202607-126, que está en-revision, no done. Ver CHECKPOINT
// de esta entrega.
// [PP] mod:58 · autor:Rune · 2026-07-26 08:15 UTC-6
// TKT-202607-134 (REQ-202607-039): retirados renderSprintBurndown()/renderSprintItems()
// (+ helpers privados _updateCloseReadyState/_renderSprintSection/_buildSprintItemRow/
// renderScopeAdded/_buildScopeAddedRow/renderSprintWorkers/_buildWorkerPill) y el listener
// 'shell:sprint-render' — pipeline duplicado, consolidado en _renderSprintItems(sprint)
// (locus-sprint.js). Ver comentario de retiro completo más abajo en este archivo.
// Corrección de base — el archivo adjunto como mod:56 declaraba el header de TKT-202607-130
// pero conservaba el fallback all[0] sin retirar (discrepancia de versión detectada por el
// founder). Fix reaplicado sobre esta base real.
// TKT-202607-130 (REQ-202607-040, origen_disc DISC-202607-044): _getActiveSprint() pierde el
// fallback a all[0] — antes retornaba un sprint arbitrario (el primero con status:'active') cuando
// ningún sprint declaraba current:true, mientras renderSprintBurndown() (línea 1597, sin cambio)
// ya exigía el chequeo estricto current:true. Ambas funciones producen ahora el mismo resultado
// (sprint real o null) para el mismo estado de datos. contract_update: sí — ver CHECKPOINT de esta
// entrega y _Locus-module-contracts.md.

// [PP] mod:55 · autor:Rune · 2026-07-25 UTC-6
// TKT-202607-112: setItemSprint() bloquea la asignación si item.parentId no resuelve a un
// ítem real en getItems() — antes el gate de herencia se saltaba en silencio y procedía a
// asignar sin verificar. Sin cambio de comportamiento cuando parentItem sí se encuentra.

// [PP] mod:54 · autor:Rune · 2026-07-24 15:30 UTC-6
// INC (ref_id QA-0724-02): _renderSprintPanel/_buildSprintItemRow — sección 'bloqueado' ahora
// incluye REQ con status real 'bloqueado' (antes solo cubría heurística de staleness vía
// _isBlocked). Ícono 🔒 distingue el motivo (gap de integración vs staleness) por título.
// Sin cambio de firma exportada.

// [PP] mod:53 · autor:Rune · 2026-07-21 23:13 UTC-6
// TKT (INC histórico — sin CHECKPOINT confirmado · retiro archivedInSprint): _incEligibleForSprintClose pierde el
//   parámetro sprintId y el criterio archivedInSprint (campo eliminado del modelo, BR-Ecosystem
//   §4b) — único criterio de elegibilidad ahora es la ventana de tiempo closedAt/statusChangedAt
//   >= sprintOpenedAt, ya existente como fallback. Call site en _generateSprintRetroMd actualizado
//   (ya no pasa `id`). Sin cambio en qué ítems aparecen en la retro — mismo resultado para
//   incidentes cuyo cierre cae dentro de la ventana del sprint. contract_update: no.
// [PP] mod:52 · autor:Rune · 2026-07-17 UTC-6
// TKT-202607-031: _scmExecuteClose() ya no vacía docUpdateIndex al cerrar sprint
//   (_setDocUpdateIndex({}) + log 'descartado · sprint cerrado' eliminados — violaba
//   __BR-Ecosystem §3, vencimiento no es descarte por inacción). En su lugar, cada entrada
//   sobreviviente con createdAt conocido gana vencido:true cuando 2+ sprints del proyecto
//   cerraron con closedAt posterior a ese createdAt (getActiveSprints().filter(status===
//   'closed')). Entradas sin createdAt no se marcan — antigüedad desconocida. Persistido vía
//   _setDocUpdateIndex(_duIndex) (mutación in-place, no reemplazo por {}). contract_update: sí
//   — ver CHECKPOINT de esta entrega, docUpdateIndex[key][].vencido es campo nuevo compartido.
// [PP] mod:50 · autor:Rune · 2026-07-13 UTC-6
// TKT1 (REQ CAEL-04): navigateToItem() extraída a locus-item-navigator.js — no gestionaba
// ningún dato de sprints (__BR-Ecosystem §7). Re-importada para los 2 call sites internos.
// Sin cambio de lógica ni de firma — navigateToItem(code) → void.
// [PP] mod:49 · autor:Rune · 2026-07-12 UTC-6
// INC histórico — sin CHECKPOINT confirmado: navigateToItem() agrega rama DISC — switchSubTab('qdisc') en vez de
// 'backlog' cuando itemKind(item) === 'DISC'. Selector de scroll sin cambio (.item[data-code],
// DISC comparte shell con REQ/TKT vía buildBacklogItem()). contract_update: n/a — firma sin cambio.
// TKT3 (REQ CAEL-01, contract_update: sí): navigateToItem() ahora distingue ítems ITIL
// (getIncidents(), navega a 'incidentes', selector .qinc-item) de REQ/TKT/DISC (getItems(),
// 'backlog', selector .item) — antes un código INC nunca se encontraba y el deep-link fallaba
// en silencio. Firma sin cambio: navigateToItem(code) → void.
// TKT1 (REQ-202607-026 · AC3 — cierre de blocked_at, archivos corregido por Cael vía patch):
//   renderSprintItems() — spRs gana condición !i.draft. Un REQ con draft:true y sprint ya
//   asignado (heredado del sprint que Cael declaró al especificar) no aparece en la lista del
//   sprint activo hasta que Finn lo avale. no_incluye: no toca el contador "X/Y TKT" de
//   _buildSprintItemRow (children de un REQ visible) — ese contador es progreso agregado, no
//   una fila independiente por TKT; fuera del AC de este TKT.
// [PP] mod:45 · autor:Rune · 2026-07-10 17:15 UTC-6
// TKT7 (REQ-202607-015): revertido el bloque TKT5 — _scmExecuteClose ya no recolecta,
//   persiste ni elimina incidentes elegibles al cerrar sprint. AC3 del REQ (verificado por
//   Finn contra __BR-Core §6 y confirmado por el founder: Q-INC/ITEMS son poblaciones
//   separadas, incident_status:closed es terminal, Q-INC no migra a historico) prohíbe esa
//   migración. TKT5/TKT6 permanecen descartado. Único call site de deleteIncidentRows()
//   era este bloque — import removido, export retirado de locus-storage.js (ver ese header).
//   Módulo crítico — activar verificación de regresiones en Finn.
// TKT-202607-045 (REQ-202607-015): _incEligibleForSprintClose se evalúa contra
//   getItems().concat(getIncidents()) en _generateSprintRetroMd (~línea 222) y en la
//   migración a historico de _scmExecuteClose (~línea 1341) — INC/PRB/KE/CHG viven en
//   INCIDENTS desde REQ-202607-003, getItems() solo no los incluía.
// TKT1 (REQ-sprints-migration): import muerto _loadSprintsFromSupabase eliminado — la función
//   fue reemplazada por _loadAllProjectsSprintsFromSupabase() en locus-storage.js y este módulo
//   nunca la invocaba (solo quedaba en comentario línea ~959). Sin este fix, TKT1 entregado solo
//   rompía la carga de la app — import ESM con nombre inexistente lanza SyntaxError.
// INC histórico — sin CHECKPOINT confirmado: confirmEditSprint() no persistía label/goal/version_target/release_type
//   a tracker_sprints — save() excluye sprints del blob. Fix: _upsertSprint(sp, projId) tras
//   save(), mismo patrón que setSprintStatus.
// TKT-PARSER-sprints (REQ histórico — sin CHECKPOINT confirmado · retro Q-INC, gate cierre sin isHotfix):
//   _getActiveSprint sin !isHotfix — todos los sprints son expuestos por status:active únicamente.
//   Bloque retro S-HOTFIX reemplazado por INC/PRB/KE/CHG con incidentStatus:'closed'
//   cuyo closedAt >= sprint.startedAt — incluidos en sección "Incidentes cerrados".
//   setSprintStatus: guard isHotfix en newStatus==='closed' eliminada — todos los sprints son cerrables.
//   Gates de activación, formallyOpened y parent heredado: exenciones isHotfix eliminadas.
//   Scheduled queue en activación automática: isHotfix eliminado.
//   Cero referencias activas a isHotfix/S-HOTFIX/hotfix.
//   locus-session-parse.js: !sp.isHotfix eliminado en _tryIngestSprintProposal
//   y _tryIngestSprintProposalFromParsed — sp.status==='active' sin condición adicional.
//   Header migrado de legacy v0.7.0/sprint:PP-S-08 a formato canónico __BR-Execution §9.
// locus-backlog-sprints.js
// Responsabilidad: Catálogo de sprints — CRUD, asignación de ítems, retro,
//   modal de cierre de sprint (SCM), createSprintFromGroup.

import { _calcPriority, _getActiveSessionAiId, _isBlocked, _undoSnapshotItems, itemKind, renderStats, updateStatusFilterUI, getItems, getIncidents, _registerCoreCallback } from './locus-backlog-core.js'; // TKT-202607-045: getIncidents agregada — _incEligibleForSprintClose evalúa ITEMS+INCIDENTS
import { _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { _templateTrigger } from './locus-session-hora.js';
import { exportFullHistoryMd } from './locus-backlog-generator.js';
import { renderSprintTab } from './locus-sprint.js';
import { _blogLog, _docPrefix, _effectiveVersion, getActiveProject, getActiveSprints, getAllSessions, getProjectById, save, saveBacklog, saveImmediate, saveHistoricoItems, getHistoricoItems, _invalidateHistoricoCache, _getDocUpdateIndex, _setDocUpdateIndex, _getDocUpdateResolvedLog, _upsertSprint, _sprintDisplay } from './locus-storage.js'; // T-202606-107 · T-202606-005 · TKT1 (REQ-sprints-migration): _loadSprintsFromSupabase eliminado del import — sin call site real, solo referenciado en comentario línea ~959. Función reemplazada por _loadAllProjectsSprintsFromSupabase() en locus-storage.js, sin uso en este módulo. TKT7 (REQ-202607-015): deleteIncidentRows removida del import — su único call site (_scmExecuteClose) fue eliminado; export retirado de locus-storage.js. TKT-202607-134: getAI retirada — su único call site (renderSprintWorkers) fue retirado. INC-202608-093: _getDocUpdateResolvedLog agregada — export existente de locus-storage.js (TKT-202608-236), ya consumido por locus-docs.js, sin cambio de firma.
import { showToast, toast } from './locus-toast.js';
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';
// TKT-202607-134: import de navigateToItem retirado — sus únicos call sites (delegación
// 'spi-navigate') fueron retirados junto con renderSprintItems(). navigateToItem() sigue
// viva en locus-item-navigator.js, consumida por locus-sprint.js para el sprint board activo.

import { _setBacklogModified } from './locus-docs.js';
import { openMapGenerator } from './locus-map-generator.js'; // T-202606-089 AC-3 — ciclo seguro: uso solo dentro de handler

import { render } from './locus-sesiones.js';

// ── T-sprints: Catálogo de sprints ──

// T-202606-072: helper compartido — filtra getActiveSprints() por projId.
// Si projId es null/undefined → retorna todos los sprints sin filtro de proyecto.
// Usado por _getActiveSprint y _getConflictingSprints.
function _sprintsForProject(projId) {
  if (!projId) return getActiveSprints();
  return getActiveSprints().filter(s => s.projId === projId || s.projectId === projId);
}

export function _getActiveSprint() {
  // T-202606-072: _sprintsForProject(null) — sin filtro de proyecto, comportamiento original preservado.
  // TKT-PARSER-sprints (REQ histórico — sin CHECKPOINT confirmado): isHotfix eliminado — S-HOTFIX deprecado Gen2.
  // TKT-202607-130 (REQ-202607-040): fallback a all[0] retirado — mismo criterio estricto que
  // renderSprintBurndown() (línea ~1604): solo current:true cuenta como sprint activo.
  const all = _sprintsForProject(null).filter(s => s.status === 'active');
  return all.find(s => s.current === true) || null;
}

export function _getSprintById(id) {
  return getActiveSprints().find(s => s.id === id) || null;
}

// T-202606-105: Retorna sprints activos en conflicto del proyecto activo.
// El primero por startedAt más reciente se considera el activo canonical — se excluye.
// Retorna el resto de sprints con status 'active' del mismo proyecto.
export function _getConflictingSprints() {
  const proj = getActiveProject();
  const projId = proj ? proj.id : null;
  // T-202606-072: usar helper compartido — equivalente al filtro inline anterior.
  const active = _sprintsForProject(projId).filter(s => s.status === 'active');
  if (active.length <= 1) return [];
  // Ordenar por startedAt desc — el más reciente es el canonical
  const sorted = [...active].sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
  return sorted.slice(1);
}

// T-202605-500: ID con prefijo de proyecto — [PREFIJO]-S[NN], consecutivo por proyecto
// B-202605-077: acepta projId opcional — si se pasa, opera exclusivamente sobre los sprints
//   de ese proyecto, resolviendo el ID incorrecto cuando el DIFF se abre con projId != filtro global
function _nextSprintId(projId) {
  const allSprints = getActiveSprints();

  let prefix;
  let sprintsForCalc;

  if (projId) {
    // B-202606-091: leer desde getActiveSprints() (_sprintsCache) en lugar de proj.sprints directamente
    const sprintsOfProj = getActiveSprints().filter(s => s.projId === projId || s.projectId === projId);
    if (sprintsOfProj.length) {
      const m = (sprintsOfProj[0].id || '').match(/^([A-Za-z]+)-S\d+$/i);
      prefix = m ? m[1].toUpperCase() : 'XX';
    } else {
      const proj = getProjectById(projId);
      if (proj && proj.prefix) {
        prefix = proj.prefix.toUpperCase();
      } else if (proj && proj.name) {
        prefix = proj.name.split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 3) || 'XX';
      } else {
        prefix = _docPrefix();
      }
    }
    sprintsForCalc = sprintsOfProj;
  } else {
    // Comportamiento original — prefijo del proyecto activo en filtro global
    prefix = _docPrefix();
    sprintsForCalc = allSprints;
  }

  const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-S(\\d+)$', 'i');
  const nums = sprintsForCalc
    .map(s => { const m = (s.id || '').match(re); return m ? parseInt(m[1], 10) : NaN; })
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return prefix + '-S' + String(max + 1).padStart(2, '0');
}

// T-202605-500: validar que el nombre descriptivo no esté vacío — el ID lo genera PP automáticamente
function _isValidSprintName(label) {
  return !!(label && label.trim());
}

// R-202605-134: sugerir release_type basado en el contenido del sprint
// Solo INC/TKT → Patch · REQs features/UX → Minor · REQs arquitectura/refactor → Major · mezcla REQs+INC → Minor
function _suggestReleaseType(sprintItems) {
  if (!sprintItems || !sprintItems.length) return 'Patch';
  const hasR = sprintItems.some(i => i.type === 'REQ');
  const hasB = sprintItems.some(i => i.type === 'INC');
  const hasT = sprintItems.some(i => i.type === 'TKT');
  if (!hasR) return 'Patch';
  // REQs arquitectura/refactor → Major (keywords heurísticos)
  const archKeywords = /migra|refactor|arquitectura|core|parser|schema|json/i;
  const hasArch = sprintItems.some(i => i.type === 'REQ' && archKeywords.test(i.title || ''));
  if (hasArch) return 'Major';
  // mezcla REQs+INC → Minor
  if (hasR && hasB) return 'Minor';
  // REQs features/UX → Minor
  return 'Minor';
}

// R-202605-134: sugerir version_target basado en última versión registrada
// Incrementa el segmento correcto según release_type
function _suggestVersionTarget(releaseType) {
  try {
    const vStr = _effectiveVersion() || '0.0.0';
    const clean = vStr.replace(/^v/i, '');
    const parts = clean.split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    if (releaseType === 'Major') return `v${major + 1}.0.0`;
    if (releaseType === 'Minor') return `v${major}.${minor + 1}.0`;
    return `v${major}.${minor}.${patch + 1}`;
  } catch { return 'futura'; }
}

// TKT2 (REQ-inc-historico): criterio único de elegibilidad para listar INC/PRB/KE/CHG closed
// en la retro del sprint — compartido con _generateSprintRetroMd (texto de retro), para que
// ambos coincidan exactamente (AC de contrato). No migra el ítem a historico — Q-INC no
// depende del ciclo de vida de sprint (BR-Ecosystem §4b).
// INC histórico — sin CHECKPOINT confirmado (retiro archivedInSprint): parámetro sprintId retirado — sin uso una vez
// eliminado el criterio de archivedInSprint (campo retirado del modelo, BR-Ecosystem §4b: "no
// existe vínculo INC↔sprint que declarar"). Único criterio de elegibilidad ahora es la ventana
// de tiempo closedAt/statusChangedAt >= sprintOpenedAt — mismo fallback que ya existía.
function _incEligibleForSprintClose(i, sprintOpenedAt) {
  if (i.type !== 'INC' && i.type !== 'PRB' && i.type !== 'KE' && i.type !== 'CHG') return false;
  if (i.incidentStatus !== 'closed') return false;
  const _closedTs = i.closedAt || i.statusChangedAt || 0;
  return _closedTs >= (sprintOpenedAt || 0);
}

// T-202606-121: generar MD de retrospectiva con schema canónico del BR
// Secciones: ## Retro · [Prefijo]-S-XX → Done · Descartado ·
//   Doc-Updates aplicados · Doc-Updates pendientes → ## Narrativa · [Prefijo]-S-XX
// Campo "Migrado" eliminado del schema — ver __BR-Ecosystem §5, DOC-UPDATE 2026-07-02.
// AC-8: el string se asigna a sprint.retroDoc antes de save() en _scmExecuteClose.
// Accede a _scmState vía closure de módulo para leer docUpdates con resolución.
function _generateSprintRetroMd(id, notes) {

  // ── AC-2: Done — ítems que estaban done al cerrar el sprint.
  // _scmExecuteClose ya mutó done/descartado → historico antes de llamar esta función.
  // Incluir 'historico' para reflejar la realidad post-cierre.
  const sprintItems  = getItems().filter(i => _sprintIdOf(i) === id);
  const doneItems    = sprintItems.filter(i => i.status === 'done' || i.status === 'historico');

  // Campo "Migrado" eliminado del schema de retro (__BR-Ecosystem §5, DOC-UPDATE
  // aplicado 2026-07-02) — bajo el Gate duro de cierre el valor era siempre
  // "ninguno" para R/T/B, sin información variable. Ver auditoría 2026-06-22
  // que ya había fijado el valor constante antes de esta eliminación completa.

  // ── AC-4: Descartado — ítems descartados con justificación.
  // Incluye: ítems del sprint que tenían status=descartado + pendientes con dest=__discard__.
  const discardedItems = [];
  {
    // Ítems que ya eran descartado en el backlog (status descartado al cierre)
    sprintItems
      .filter(i => i.status === 'descartado')
      .forEach(i => discardedItems.push(i));
    // Pendientes que el founder eligió descartar en el stepper (dest=__discard__)
    if (_scmState && Array.isArray(_scmState.pendingItems)) {
      _scmState.pendingItems.forEach(pi => {
        const dest = _scmState.migrations[pi.code];
        if (dest !== '__discard__') return;
        const live = getItems().find(i => i.code === pi.code);
        if (live && !discardedItems.some(d => d.code === live.code)) {
          discardedItems.push(live);
        }
      });
    }
  }

  // Ventana del sprint — movida antes del bloque de Doc-Updates (INC-202608-093): la
  // ventana debe existir antes de filtrar el log de resueltos, no solo para incidentes.
  // TKT-PARSER-sprints (REQ histórico — sin CHECKPOINT confirmado): INC closed de Q-INC con closedAt >= sprint.openedAt
  // reemplaza bloque de S-HOTFIX — Gen2: Q-INC es la cola ITIL, S-HOTFIX deprecado.
  // INC closed antes de la apertura del sprint no se incluyen.
  const _sprintForRetro = _getSprintById(id);
  const _sprintOpenedAt = _sprintForRetro ? (_sprintForRetro.startedAt || 0) : 0;
  const _pad = n => String(n).padStart(2, '0');
  const _incDate = ts => {
    const d = new Date(ts || Date.now());
    return `${d.getFullYear()}-${_pad(d.getMonth()+1)}-${_pad(d.getDate())}`;
  };

  // ── AC-5/AC-6: Doc-Updates — corregido INC-202608-093. _scmState.docUpdates es el
  // snapshot del índice ABIERTO (docUpdateIndex) capturado al abrir el modal de cierre —
  // desde CHG-202608-002 el Paso 2 es de solo lectura y `resolucion` nunca se muta ahí, así
  // que filtrar por d.resolucion producía siempre dos listas vacías. La fuente real de qué
  // se resolvió (aplicado/descartado) y cuándo es docUpdateResolvedLog (TKT-202608-236,
  // _getDocUpdateResolvedLog()/_pushDocUpdateResolved() — locus-storage.js/locus-docs.js),
  // poblado exclusivamente desde Doc Log, único lugar donde un DOC-UPDATE se resuelve desde
  // ese CHG. Acotado a la ventana del sprint (resolvedAt >= _sprintOpenedAt) — mismo criterio
  // ya usado para incidentes cerrados (_incEligibleForSprintClose) — para no arrastrar a esta
  // retro resoluciones de sprints anteriores.
  const _duResolvedLog = _getDocUpdateResolvedLog();
  const _duInWindow     = _duResolvedLog.filter(d => (d.resolvedAt || 0) >= _sprintOpenedAt);
  const duAplicados     = _duInWindow.filter(d => d.action === 'aplicado');
  const duDescartados   = _duInWindow.filter(d => d.action === 'descartado');

  // TKT-202607-045 (REQ-202607-015): concat(getIncidents()) — INC/PRB/KE/CHG viven en INCIDENTS
  // desde REQ-202607-003, getItems() ya no los incluye. Sin este concat, ningún incidente
  // aparecía en la retro pese a estar closed dentro de la ventana del sprint.
  const incClosedItems = getItems().concat(getIncidents()).filter(i => _incEligibleForSprintClose(i, _sprintOpenedAt));
  const _incClosedList = incClosedItems.length
    ? incClosedItems.map(i => `- ${i.code}: incident \u00b7 ${_incDate(i.closedAt || i.statusChangedAt)}`).join('\n')
    : '';

  // ── Helpers de serialización ──

  // AC-2: lista de códigos de ítems Scrum done
  const _doneList = doneItems.length
    ? doneItems.map(i => `- ${i.code}`).join('\n')
    : 'ninguno';

  // AC-4: lista con justificación — si no tiene discard_reason → 'sin justificación declarada'
  const _discardedList = discardedItems.length
    ? discardedItems.map(i => {
        const reason = i.discard_reason ? i.discard_reason : 'sin justificación declarada';
        return `- ${i.code}: ${reason}`;
      }).join('\n')
    : 'ninguno';

  // AC-5: Doc-Updates aplicados — 'doc: [nombre] · sección: [sección] · aplicado: [fecha]'.
  // Campo `aplicado-por` retirado (INC-202608-093) — docUpdateResolvedLog no declara
  // resolvedBy (Locus es single-user, ver comentario de _pushDocUpdateResolved() en locus-docs.js).
  const _duAplicadosList = duAplicados.length
    ? duAplicados.map(d => `- doc: ${d.doc} · sección: ${d.section} · aplicado: ${_incDate(d.resolvedAt)}`).join('\n')
    : 'ninguno';

  // AC-6: Doc-Updates descartados — 'doc: [nombre] · sección: [sección] · descartado: [fecha]'.
  // Campo `escalar-a` retirado (INC-202608-093), mismo motivo que arriba.
  const _duDescartadosList = duDescartados.length
    ? duDescartados.map(d => `- doc: ${d.doc} · sección: ${d.section} · descartado: ${_incDate(d.resolvedAt)}`).join('\n')
    : 'ninguno';

  // AC-7: sección Narrativa — placeholder vacío
  const narrativaSection = `## Narrativa · ${id}\n\n[Agregar narrativa por rol]`;

  // ── Componer output ──
  // Orden exacto de AC-1: ## Retro · [id] → Done · Descartado ·
  //   Doc-Updates aplicados · Doc-Updates pendientes → ## Narrativa · [id]
  // B-202606-029: headers usan [id] — [label] era incorrecto y fue corregido
  // TKT-PARSER-sprints: incluir sección de incidentes cerrados si existen
  const _incSection = _incClosedList
    ? `\nIncidentes cerrados:\n${_incClosedList}`
    : '';

  return `## Retro · ${id}

Done: ${_doneList}
Descartado: ${_discardedList}
Doc-Updates aplicados:
${_duAplicadosList}
Doc-Updates pendientes:
${_duDescartadosList}${_incSection}

${narrativaSection}
`;
}

// T-202604-262: mostrar modal de descarga opcional de retrospectiva
// T-202604-417: abre el overlay de retro en modo vista — muestra retro guardada del sprint cerrado
export function openSprintRetroView(id) {
  const sp = _getSprintById(id);
  if (!sp) return;
  const sprintLabel = sp.label ? `${sp.id} · ${sp.label}` : sp.id;
  const retroDoc = sp.retroDoc || '';
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const closedAt = sp.closedAt ? new Date(sp.closedAt) : now;
  const closedStr = `${closedAt.getFullYear()}-${pad(closedAt.getMonth()+1)}-${pad(closedAt.getDate())}`;
  const pfx = _docPrefix();
  const filename = `${pfx}-Retrospectiva-${id}-${closedStr}.md`;

  const overlay = document.getElementById('sprint-retro-overlay');
  if (!overlay) return;

  const titleEl   = document.getElementById('sprint-retro-title');
  const bodyEl    = document.getElementById('sprint-retro-body');
  const notesEl   = document.getElementById('sprint-retro-notes');
  const filenameEl = document.getElementById('sprint-retro-filename');

  if (titleEl)   titleEl.textContent = `📄 Retrospectiva — ${sprintLabel}`;
  if (filenameEl) filenameEl.textContent = filename;

  // Mostrar MD como texto pre-formateado en el body
  if (bodyEl) bodyEl.textContent = retroDoc || '(sin retrospectiva guardada)';

  // Campo de notas solo lectura en vista
  if (notesEl) {
    notesEl.value = sp.retroNotes || '';
    notesEl.readOnly = true;
    notesEl.placeholder = '';
  }

  overlay.classList.add('open', 'sprint-retro-overlay--view');

  // Botón descargar: usa el retroDoc guardado
  const dlBtn = document.getElementById('sprint-retro-dl-btn');
  if (dlBtn) {
    const newDlBtn = dlBtn.cloneNode(true);
    dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);
    newDlBtn.addEventListener('click', () => {
      const md = retroDoc || _generateSprintRetroMd(id, sp.retroNotes || '');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('download', 'Retrospectiva descargada', filename);
    });
  }
}

function closeSprintRetroOverlay() {
  const overlay = document.getElementById('sprint-retro-overlay');
  if (overlay) overlay.classList.remove('open', 'sprint-retro-overlay--view');
}

// T-202604-417: prompt de descarga post-cierre — distinto de la vista de retro guardada
function _openRetroDownloadPrompt(id) {
  const sp = _getSprintById(id);
  if (!sp) return;
  const sprintLabel = sp.label ? `${sp.id} · ${sp.label}` : sp.id;
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const closedAt = sp.closedAt ? new Date(sp.closedAt) : now;
  const closedStr = `${closedAt.getFullYear()}-${pad(closedAt.getMonth()+1)}-${pad(closedAt.getDate())}`;
  const pfx = _docPrefix();
  const filename = `${pfx}-Retrospectiva-${id}-${closedStr}.md`;

  const overlay = document.getElementById('sprint-retro-overlay');
  if (!overlay) return;
  overlay.classList.remove('sprint-retro-overlay--view');

  const titleEl    = document.getElementById('sprint-retro-title');
  const bodyEl     = document.getElementById('sprint-retro-body');
  const notesEl    = document.getElementById('sprint-retro-notes');
  const filenameEl = document.getElementById('sprint-retro-filename');

  if (titleEl)    titleEl.textContent = `✅ Sprint cerrado — ${sprintLabel}`;
  if (filenameEl) filenameEl.textContent = filename;
  if (bodyEl)     bodyEl.textContent = '';  // no mostrar MD completo en prompt de descarga
  if (notesEl) { notesEl.classList.add('is-hidden'); }

  overlay.classList.add('open');

  const dlBtn = document.getElementById('sprint-retro-dl-btn');
  if (dlBtn) {
    const newDlBtn = dlBtn.cloneNode(true);
    dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);
    newDlBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      const md = sp.retroDoc || _generateSprintRetroMd(id, sp.retroNotes || '');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('download', 'Retrospectiva descargada', filename);
    });
  }
}

export async function setSprintStatus(id, newStatus) {
  // T-202606-015 AC-2: valores válidos extendidos — 'active' | 'closed' | 'scheduled' | 'discarded'
  // TKT-PARSER-sprints: guard isHotfix eliminada — S-HOTFIX deprecado Gen2, todos los sprints son cerrables.
  // if (newStatus === 'closed') — bloque eliminado, sin guard activa.
  // T-202606-015 AC-3: 'discarded' solo opera sobre sprints con status 'scheduled'
  // sprints 'active' o 'closed' no pueden descartarse — toast de error + retorno temprano sin modificar
  if (newStatus === 'discarded') {
    const target = _getSprintById(id);
    if (!target) return;
    if (target.status !== 'scheduled') {
      showToast('error', 'Solo sprints programados pueden descartarse');
      return;
    }
  }
  if (newStatus === 'active') {
    // T-202606-106: gate — rechazar si ya existe sprint active para el proyecto distinto al id recibido
    const _targetForGate = _getSprintById(id);
    const _projIdForGate = _targetForGate ? (_targetForGate.projId || _targetForGate.projectId || null) : null;
    const _existingActive = getActiveSprints().find(s => {
      if (s.status !== 'active') return false;
      if (s.id === id) return false;          // el mismo sprint — no es conflicto
      if (!_projIdForGate) return false;      // sin projId no se puede filtrar — no bloquear
      return (s.projId === _projIdForGate || s.projectId === _projIdForGate);
    });
    if (_existingActive) {
      // TKT2 histórico — sin CHECKPOINT confirmado: _sprintDisplay aplica patrón id · label en mensaje de conflicto
      showToast('error', `Ya hay un sprint activo: ${_sprintDisplay(_existingActive.id)}. Ciérralo antes de activar otro.`);
      return false; // B-202606-042: retorno explícito — permite que callers detecten el rechazo
    }
  }
  const sp = _getSprintById(id);
  if (!sp) return;
  sp.status = newStatus;
  if (newStatus === 'active')     sp.startedAt   = sp.startedAt   || Date.now();
  if (newStatus === 'closed')     sp.closedAt    = sp.closedAt    || Date.now();
  if (newStatus === 'closed')     sp.endsAt      = sp.endsAt      || Date.now();
  // TKT-202608-373 (REQ-202608-150): retro sin evaluar por default en todo cierre — el
  // _upsertSprint() más abajo en esta misma función persiste el valor, sin llamada extra.
  if (newStatus === 'closed')     sp.retroEvaluated = false;
  // T-202606-015 AC-2: timestamps para nuevos valores
  if (newStatus === 'scheduled')  sp.scheduledAt = sp.scheduledAt || Date.now();
  if (newStatus === 'discarded')  sp.discardedAt = sp.discardedAt || Date.now();
  if (newStatus !== 'closed') { delete sp.closedAt; delete sp.endsAt; }
  // B-202606-005: limpiar current:true al cerrar — state no debe tener sprints cerrados marcados como en curso
  if (newStatus === 'closed')    delete sp.current;
  // inline_fix: limpiar current:true al descartar — sprint descartado no puede estar en curso
  if (newStatus === 'discarded') delete sp.current;
  // B-202605-210 guard: al cerrar un sprint directamente (sin modal), desasignar
  // ítems pendientes que quedaron huérfanos para evitar data inconsistente.
  if (newStatus === 'closed') {
    let guardCount = 0;
    getItems().forEach(item => {
      if (item.status === 'pendiente' && item.sprint === id) {
        if (!item.history) item.history = [];
        item.history.push({
          type: 'sprint',
          ts: Date.now(),
          data: { from: id, to: null, reason: 'sprint-closed-guard' }
        });
        item.sprint = '';
        guardCount++;
      }
    });
    if (guardCount > 0) {
      console.log(`[AI Tracker] B-202605-210 guard: ${guardCount} ítem(s) pendiente(s) desasignados de ${id} al cerrar`);
    }
    // B-202605-232: migrar done/descartado → historico al cerrar sprint directamente (sin modal 3 pasos)
    // T-202606-108: conectar con storage dedicado (T-202606-105) — mismo patrón que _scmExecuteClose
    const closeTs = Date.now();
    const _historicoCodesDirectClose = new Set();
    getItems().forEach(i => {
      if (_sprintIdOf(i) === id && (i.status === 'done' || i.status === 'descartado')) {
        i.status = 'historico';
        i.archivedAt = closeTs;
        _historicoCodesDirectClose.add(i.code);
      }
    });
    // AC-4: 0 ítems califican → no invocar saveHistoricoItems ni getHistoricoItems, sin excepción.
    if (_historicoCodesDirectClose.size > 0) {
      const _itemsArr = getItems();
      const _newHistorico = _itemsArr.filter(i => _historicoCodesDirectClose.has(i.code));
      // Acumular sobre lo ya persistido — saveHistoricoItems() sobreescribe la clave completa.
      try {
        const _existingHistorico = await getHistoricoItems();
        await saveHistoricoItems([...(_existingHistorico || []), ..._newHistorico]);
      } catch (err) {
        // AC-3: fallo de escritura no revierte el cierre — fallback a localStorage cubierto
        // internamente por saveHistoricoItems. Registrar en DocLog con sprint_id afectado.
        console.error('[AI Tracker] setSprintStatus closed: fallo al persistir historico en storage dedicado', err);
        _blogLog('historico-write-error', id, `Fallo al persistir ${_historicoCodesDirectClose.size} ítem(s) historico en storage dedicado al cerrar ${id} (cierre directo): ${err.message || err}`, 'backlog');
      }
      // AC-2: remover de ITEMS — splice in-place sobre referencia mutable, fuera del try/catch
      // para garantizar que ocurre independientemente del resultado de saveHistoricoItems.
      for (let _idx = _itemsArr.length - 1; _idx >= 0; _idx--) {
        if (_historicoCodesDirectClose.has(_itemsArr[_idx].code)) _itemsArr.splice(_idx, 1);
      }
      // INC histórico — sin CHECKPOINT confirmado: invalidar cache sync de historico — independiente de si
      // saveHistoricoItems tuvo éxito (ITEMS ya se mutó arriba; el próximo read debe reflejarlo).
      _invalidateHistoricoCache();
    }
    if (guardCount > 0 || _historicoCodesDirectClose.size > 0) {
      saveBacklog(); // una sola vez tras ambas operaciones
    }
  }
  // T-202606-005 AC-5: upsert del sprint actualizado a tracker_sprints — no depende del blob.
  // sp ya fue mutado arriba — _upsertSprint refleja el estado actualizado en Supabase y cache.
  const _projIdForStatusUpsert = sp.projId || sp.projectId || getActiveProject()?.id || '';
  _upsertSprint(sp, _projIdForStatusUpsert).catch(err => {
    console.error('[Locus] T-202606-005: setSprintStatus upsert falló', err);
  });

  // T-202606-003 AC-1/AC-2: closed usa saveImmediate() — evita pérdida del cierre si el
  // founder navega o recarga antes de que el debounce de save() dispare _saveFlush().
  // Otras transiciones (active/scheduled/discarded) mantienen save() con debounce normal.
  if (newStatus === 'closed') {
    try {
      await saveImmediate();
    } catch (err) {
      console.error('[AI Tracker] setSprintStatus closed: fallo al persistir de forma inmediata', err);
      _blogLog('persist-error', id, `Fallo al persistir cierre de sprint ${id} de forma inmediata: ${err.message || err}`, 'backlog');
      showToast('warning', `${id} marcado cerrado localmente — sincronización pendiente`);
    }
  } else {
    save();
  }
  _markBacklogListDirty(); renderBacklogList();
  showToast('info', id + ' → ' + newStatus);
}

// T-202605-026: setSprintCurrent vive en locus-sprint.js (T-202605-107)
// Implementación eliminada de este módulo — era duplicación con filtro roto (s.projectId siempre undefined).
// window.setSprintCurrent lo expone locus-sprint.js.

// [tmp:tkt-unify-sprint-inherit]: función compartida de herencia de sprint parent→hijo
// (BR-Ecosystem §5) — antes duplicada entre setItemSprint() y el handler de type:patch
// en locus-backlog-item.js. Única fuente de la regla: propagación incondicional a TKT
// cuyo sprint difiere del destino. No-op silencioso si el REQ no tiene hijos o ya coinciden.
// [tmp:tkt2-sprint-inherit-cleanup] (REQ2 · limpieza vestigial): INC/PRB/KE/CHG nunca
// heredan sprint — __BR-Ecosystem §4b, viven exclusivamente en Q-INC. 'INC' removido del
// filtro de tipo; ver auditoria-separacion-item-incident.md, decisión founder: Opción A.
export function _inheritSprintToChildren(reqItem, normalizedSprintId) {
  if (!reqItem || !reqItem.code || itemKind(reqItem) !== 'REQ') return;
  const _movedChildren = [];
  getItems().forEach(child => {
    if (child.parentId === reqItem.code && child.code && ['TKT'].includes(itemKind(child))) {
      const prevChildSprint = child.sprint || '';
      if (prevChildSprint === normalizedSprintId) return; // ya está en el sprint destino — no-op
      child.sprint = normalizedSprintId;
      _movedChildren.push(child.code);
      if (!child.history) child.history = [];
      child.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevChildSprint, to: normalizedSprintId, inherited_from: reqItem.code } });
    }
  });
  if (_movedChildren.length > 0 && normalizedSprintId) {
    const _targetSprint = _getSprintById(normalizedSprintId);
    if (_targetSprint) {
      if (!Array.isArray(_targetSprint.docLog)) _targetSprint.docLog = [];
      _targetSprint.docLog.push(`${_movedChildren.length} Ts movidos a sprint ${normalizedSprintId} por asignación de parent ${reqItem.code}: ${_movedChildren.join(', ')}`);
    }
  }
}

export function setItemSprint(code, sprintId) {
  // T-202606-133: gate formallyOpened — bloquear asignación a sprint no aprobado
  // TKT-PARSER-sprints: exención isHotfix eliminada — S-HOTFIX deprecado Gen2.
  if (sprintId) {
    const targetSprint = _getSprintById(sprintId);
    if (targetSprint && targetSprint.formallyOpened === false) {
      showToast('warning', 'Sprint pendiente de aprobación — el founder debe aprobarlo antes de asignar ítems');
      return;
    }
  }
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  // T-202606-036 AC5: T con parent — bloquear asignación de sprint distinto al del parent
  // TKT-PARSER-sprints: exención isHotfix eliminada — S-HOTFIX deprecado Gen2.
  if (item.parentId && item.code && itemKind(item) === 'TKT') {
    // TKT-PARSER-sprints: exención isHotfix eliminada — gate aplica a todos los sprints.
    const targetSprintForParentGate = _getSprintById(sprintId);
    const parentItem = getItems().find(i => i.code === item.parentId);
    if (parentItem) {
      const parentSprint = parentItem.sprint || '';
      const incomingSprint = sprintId || '';
      if (incomingSprint !== parentSprint) {
        showToast('warning', 'El sprint del T se hereda de su parent ' + item.parentId);
        return;
      }
    } else {
      // TKT-202607-112: parentId declarado pero no resuelve a ningún ítem real en getItems() —
      // antes esto saltaba el gate en silencio y dejaba asignar el sprint sin verificar herencia.
      // Bloquear igual que el caso "parent encontrado con sprint distinto" — no hay base para
      // asumir que la asignación es segura si el padre declarado no existe.
      showToast('warning', 'No se pudo verificar el sprint del parent ' + item.parentId + ' — parent no encontrado');
      return;
    }
  }
  const prevSprint = item.sprint || '';
  // TKT-B3 (BR-Ecosystem §5): sprint vacío o falsy = sin sprint asignado (Q-Backlog) — '' es el valor canónico.
  const normalizedId = sprintId || '';
  item.sprint = normalizedId;
  item.priority = _calcPriority(item); // T-202604-297
  // R-202605-131: marcar scope_added si el sprint destino está activo al momento de asignar
  // Solo sprints reales (con sprint asignado) califican para scope_added
  if (normalizedId) {
    const targetSprint = _getSprintById(normalizedId);
    if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
      item.scope_added = true;
    } else if (prevSprint === normalizedId) {
      // No marcar si se mueve al mismo sprint
    }
  } else {
    // Al desasignar de sprint (vuelve a Q-Backlog), limpiar el flag
    delete item.scope_added;
  }
  if (!item.history) item.history = [];
  item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevSprint || null, to: item.sprint || null } });

  // [tmp:tkt-unify-sprint-inherit]: propagación delegada a _inheritSprintToChildren —
  // misma función que usa el handler de type:patch (locus-backlog-item.js).
  _inheritSprintToChildren(item, normalizedId);

  _undoSnapshotItems();
  saveBacklog();
  _setBacklogModified();
  // INC histórico — sin CHECKPOINT confirmado: renderBacklogList() directo reemplazado — era ciego a qué panel disparó
  // el cambio (Q-Backlog/Q-DISC quedaban con la vista vieja al reasignar sprint desde esas cards).
  // shell:backlog-render-dirty ya lo escuchan #backlog-list, qbacklog-panel-body y qdisc-panel-body
  // (ver locus-backlog-render.js).
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  renderStats();
}

// T-202604-246: edición inline del nombre de sprint desde el header del grupo
// R-202605-123: incluye campo goal editable
export function editSprintInline(sprintId) {
  const wrap = document.getElementById('sprint-label-wrap-' + CSS.escape(sprintId));
  if (!wrap) return;
  const sp = _getSprintById(sprintId);
  if (!sp) return;
  // T-202605-500: separar ID fijo del nombre descriptivo editable
  const currentDescriptive = (sp.label || sp.id).replace(/^[A-Z]+[-\s]S\d+\s*·?\s*/i, '').trim() || (sp.label || sp.id);
  const currentGoal = sp.goal || '';
  // R-202605-134: leer o sugerir version_target y release_type
  const spItems   = getItems().filter(i => i.sprint === sprintId);
  const suggestRt = sp.release_type  || _suggestReleaseType(spItems);
  const suggestVt = sp.version_target || _suggestVersionTarget(suggestRt);
  const inputId = 'edit-sprint-inp-' + sprintId;
  const goalId  = 'edit-sprint-goal-' + sprintId;
  const vtId    = 'edit-sprint-vt-'   + sprintId;
  const rtId    = 'edit-sprint-rt-'   + sprintId;
  wrap.innerHTML = `<div class="sprint-inline-edit-wrap sprint-inline-edit-wrap--with-goal" data-action="sprint-edit-stop-prop">
    <span class="sprint-inline-id-preview">${esc(sprintId)} ·</span>
    <input id="${esc(inputId)}" type="text" value="${esc(currentDescriptive)}"
      class="sprint-inline-input sprint-inline-input--wide"
      data-action="sprint-edit-keydown" data-sprint-id="${esc(sprintId)}">
    <button data-action="sprint-edit-confirm" data-sprint-id="${esc(sprintId)}" class="sprint-inline-confirm">&#10003;</button>
    <button data-action="sprint-edit-cancel" class="sprint-inline-cancel">&#10005;</button>
    <input id="${esc(goalId)}" type="text" value="${esc(currentGoal)}"
      placeholder="Goal del sprint (opcional, max 120)"
      class="sprint-inline-goal-input"
      maxlength="120"
      data-action="sprint-edit-keydown" data-sprint-id="${esc(sprintId)}">
    <div class="sprint-inline-release-row">
      <label class="sprint-inline-release-label">Versión:</label>
      <input id="${esc(vtId)}" type="text" value="${esc(suggestVt)}"
        class="sprint-inline-vt-input" placeholder="v3.5"
        data-action="sprint-edit-keydown" data-sprint-id="${esc(sprintId)}">
      <label class="sprint-inline-release-label">Tipo:</label>
      <select id="${esc(rtId)}" class="sprint-inline-rt-select">
        <option value="Patch"${suggestRt==='Patch'?' selected':''}>Patch</option>
        <option value="Minor"${suggestRt==='Minor'?' selected':''}>Minor</option>
        <option value="Major"${suggestRt==='Major'?' selected':''}>Major</option>
      </select>
    </div>
  </div>`;
  setTimeout(() => {
    const inp = document.getElementById(inputId);
    if (inp) { inp.focus(); inp.select(); }
  }, 30);
}

// AC-3: guardar persiste en state.sprints y re-renderiza
// R-202605-123: también persiste el goal editado
// R-202605-134: persiste version_target y release_type
function confirmEditSprint(sprintId) {
  const inputId = 'edit-sprint-inp-' + sprintId;
  const goalId  = 'edit-sprint-goal-' + sprintId;
  const vtId    = 'edit-sprint-vt-'   + sprintId;
  const rtId    = 'edit-sprint-rt-'   + sprintId;
  const inp = document.getElementById(inputId);
  const raw = inp ? inp.value.trim() : '';
  if (!raw) { _markBacklogListDirty(); renderBacklogList(); return; } // AC-4: cancelar si vacío — no modifica
  // T-202605-500: raw es el nombre descriptivo — el ID no cambia
  if (!_isValidSprintName(raw)) {
    if (inp) { inp.classList.add('sprint-inline-input--warn'); inp.title = 'El nombre descriptivo no puede estar vacío'; }
    showToast('warning', '⚠ El nombre descriptivo no puede estar vacío');
    return;
  }
  if (inp) inp.classList.remove('sprint-inline-input--warn');
  const sp = _getSprintById(sprintId);
  if (!sp) { _markBacklogListDirty(); renderBacklogList(); return; }
  // B histórico — sin CHECKPOINT confirmado: label NO concatena el ID — id y label son campos separados (BR-Ecosystem §5)
  sp.label = raw;
  // R-202605-123: persistir goal si el campo existe
  const goalInp = document.getElementById(goalId);
  if (goalInp !== null) {
    sp.goal = goalInp.value.trim().slice(0, 120);
  }
  // R-202605-134: persistir version_target y release_type
  const vtInp = document.getElementById(vtId);
  const rtSel = document.getElementById(rtId);
  if (vtInp !== null) sp.version_target = vtInp.value.trim();
  if (rtSel !== null) sp.release_type   = rtSel.value;
  save();
  // INC histórico — sin CHECKPOINT confirmado: confirmEditSprint mutaba sp.label/goal/version_target/release_type
  // solo en _sprintsCache sin persistir a tracker_sprints — save() excluye sprints del blob
  // (T-202606-005 AC-3). El edit se veía aplicado en la sesión activa por mutación de la
  // misma referencia, pero se perdía en el siguiente _loadSprintsFromSupabase(). Mismo
  // patrón que setSprintStatus (línea ~703): _upsertSprint persiste el sprint mutado.
  const _projIdForEditUpsert = sp.projId || sp.projectId || getActiveProject()?.id || '';
  _upsertSprint(sp, _projIdForEditUpsert).catch(err => {
    console.error('[Locus] INC histórico — sin CHECKPOINT confirmado: confirmEditSprint upsert falló', err);
  });
  _markBacklogListDirty(); renderBacklogList();
  // TKT2 histórico — sin CHECKPOINT confirmado: _sprintDisplay aplica patrón id · label en confirmación
  showToast('success', '✓ Sprint actualizado: ' + _sprintDisplay(sp.id));
}

// TKT-202608-373 (REQ-202608-150): función de marcado — mueve retro_evaluated de false a
// true para un sprint puntual. Invocación real desde locus-session-parse.js
// (_applyRetroEvaluatedSprint, TKT-202608-377) — ver header de ese archivo para el wiring
// completo. TKT-202608-374 (badge en Tab Sprint) solo lee el campo, no invoca esta función.
// Mismo patrón de persistencia que confirmEditSprint(): mutar sp en memoria →
// _upsertSprint() → save() → re-render.
export function markRetroEvaluated(id) {
  const sp = _getSprintById(id);
  if (!sp) return;
  if (sp.retroEvaluated === true) return; // AC implícito: no-op si ya estaba evaluada
  sp.retroEvaluated = true;
  const _projIdForRetroUpsert = sp.projId || sp.projectId || getActiveProject()?.id || '';
  _upsertSprint(sp, _projIdForRetroUpsert).catch(err => {
    console.error('[Locus] TKT-202608-373: markRetroEvaluated upsert falló', err);
  });
  save();
  renderSprintTab();
  showToast('success', '✓ Retro evaluada: ' + _sprintDisplay(sp.id));
}

// R-202604-089: estado del modal de cierre de sprint
let _scmState = null; // { id, step, pendingItems, doneItems, migrations, docUpdates, retroNotes, ... }

// B histórico — sin CHECKPOINT confirmado: normaliza el campo sprint de un ítem al ID canónico (PP-S-XX).
// Ítems legacy pueden tener sprint: "PP-S-07 · label completo" — extraer solo el prefijo.
// Si el valor ya es un ID canónico o no matchea el patrón, devuelve el valor original.
function _sprintIdOf(item) {
  if (!item.sprint) return item.sprint;
  const m = item.sprint.match(/^([A-Za-z]+-S-\d+)/i);
  return m ? m[1] : item.sprint;
}

export function confirmCloseSprint(id) {
  // R-202604-089: abre modal de 4 pasos en lugar de confirm directo
  const sp = _getSprintById(id);
  if (!sp) return;
  const pendingItems = getItems().filter(i => _sprintIdOf(i) === id && i.status !== 'done' && i.status !== 'descartado' && itemKind(i) !== 'DISC');
  const doneItems    = getItems().filter(i => _sprintIdOf(i) === id && (i.status === 'done' || i.status === 'descartado'));
  const skipStep3    = pendingItems.length === 0; // antiguo skipStep2 — ahora es el Paso 3 (migración)

  // R-202605-125: snapshot de effort al abrir modal de cierre
  const allSprintItems     = getItems().filter(i => _sprintIdOf(i) === id && itemKind(i) !== 'DISC');
  const effortPlanned      = allSprintItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortDone         = doneItems.filter(i => i.status === 'done').reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortScopeAdded   = allSprintItems.filter(i => i.scope_added).reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortNotDone      = pendingItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const hasItemsWithoutEffort = allSprintItems.some(i => !i.effort || parseInt(i.effort) === 0);

  // T-202606-120 AC-6 — corregido (INC-202608-085, auditoría end-to-end footer
  // DOC-UPDATEs): leía sp.docUpdates, campo que ningún archivo del repo asigna jamás — el
  // Paso 2 de este wizard siempre renderizaba vacío, desconectado de docUpdateIndex (el
  // índice real, poblado por processDocUpdate() y consumido por el panel de Backlog,
  // locus-docs.js renderDocUpdatesPending()). Se lee ahora _getDocUpdateIndex() directamente
  // — ya scoped al proyecto activo (mismo criterio que el bloque de cómputo de `vencido` más
  // abajo en _scmExecuteClose(), que ya confía en ese scoping sin filtrar de nuevo). Cada key
  // presente en el índice es, por definición, una entrada sin resolver — Aplicar/Descartar
  // (locus-docs.js _initDocUpdatesListeners) elimina la key al resolverla. `key` se conserva
  // en cada fila — necesario en _scmExecuteClose() para persistir la resolución del Paso 2
  // sobre el índice real sin reconstruir doc+'::'+seccion (evita bug si alguno contuviera '::').
  const _duIndexOpen = _getDocUpdateIndex();
  const docUpdates = Object.keys(_duIndexOpen).map((key, idx) => {
    const [docName, seccionName] = key.split('::');
    const _entry = (_duIndexOpen[key] || [])[0] || {};
    return {
      id:         idx,
      key,
      doc:        docName    || '—',
      seccion:    seccionName || '—',
      escalarA:   _entry.escalateTo || '',
      resolucion: null, // 'aplicado' | 'descartado' | null
    };
  });

  _scmState = {
    id,
    step: 1,
    skipStep3,
    pendingItems,
    doneItems,
    migrations: {},
    docUpdates,   // T-202606-120 AC-3
    retroNotes: '',
    effortPlanned,
    effortDone,
    effortScopeAdded,
    effortNotDone,
    hasItemsWithoutEffort,
  };
  // Fix Gate duro de cierre (__BR-Ecosystem §5): la única salida válida de un ítem
  // activo es done o descartado — nunca reasignación a otro sprint/icebox.
  // Todo pendiente nace como candidato a descartar; requiere justificación antes de avanzar.
  pendingItems.forEach(i => { _scmState.migrations[i.code] = '__discard__'; });

  const overlay = document.getElementById('sprint-close-overlay');
  if (!overlay) return;
  overlay.classList.toggle('skip-step3', skipStep3); // renombrado de skip-step2
  const titleEl = document.getElementById('sprint-close-title');
  if (titleEl) titleEl.textContent = 'Cerrar sprint ' + id;

  _scmRender();
  overlay.classList.add('open');
}

function closeCloseSprintModal() {
  const overlay = document.getElementById('sprint-close-overlay');
  if (overlay) overlay.classList.remove('open');
  _scmState = null;
}

// TKT1 (parent CAEL-08081500-01, ver _Locus-ux-ref Hallazgo E): única fuente de verdad para
// número de paso, rótulo del indicador y condición de salto — antes duplicada como literal
// `skipStep3 ? 3 : 4` en _scmNext/_scmRender y como bucle estático [1,2,3,4] con un `if (n===3)`
// hardcodeado en el indicador. _scmBack, _scmNext y _scmRender consumen esta misma lista —
// ninguno vuelve a declarar el mapeo por su cuenta.
const _SCM_STEPS = [
  { n: 1, label: '1 · Resumen' },
  { n: 2, label: '2 · DOC-UPDATEs' },
  { n: 3, label: '3 · Migración', skippableWhen: (state) => !!state.skipStep3 },
  { n: 4, label: '4 · Confirmar' },
];

// Pasos que se muestran en la secuencia activa para el sprint en curso — filtra el paso 3
// cuando skipStep3. Su longitud reemplaza el literal `skipStep3 ? 3 : 4` en los tres puntos
// que antes lo declaraban por separado.
function _scmActiveSteps(state) {
  return _SCM_STEPS.filter(s => !(s.skippableWhen && s.skippableWhen(state)));
}

function _scmBack() {
  if (!_scmState) return;
  if (_scmState.step <= 1) return;
  _scmState.step--;
  // Paso 3 (migración) se salta si skipStep3 — Paso 2 (DOC-UPDATEs) nunca se salta
  if (_scmState.skipStep3 && _scmState.step === 3) _scmState.step--;
  _scmRender();
}

function _scmNext() {
  if (!_scmState) return;
  const totalSteps = _scmActiveSteps(_scmState).length;
  if (_scmState.step >= totalSteps) {
    _scmExecuteClose();
    return;
  }
  _scmState.step++;
  // Paso 3 (migración) se salta si skipStep3 — Paso 2 (DOC-UPDATEs) nunca se salta
  if (_scmState.skipStep3 && _scmState.step === 3) _scmState.step++;
  _scmRender();
}

// _scmBulkApply eliminada — Gen2: _scmStepMigracionHtml no ofrece opciones de sprint.
// Todos los ítems activos solo pueden descartarse (Gate duro §5).

function _scmRender() {
  if (!_scmState) return;
  const { step, skipStep3, pendingItems, doneItems, migrations, id, docUpdates } = _scmState;
  const totalSteps = _scmActiveSteps(_scmState).length;
  const sp = _getSprintById(id);

  // TKT1 (CAEL-08081500-02): indicador derivado de _SCM_STEPS — rótulo (textContent) y clase
  // se recalculan en cada render desde la única fuente, nunca desde el texto estático del HTML.
  // Cierra Hallazgo E: antes solo existían 3 nodos (scs-step-1..3) para 4 pasos reales, y el
  // paso 4 quedaba absorbido en silencio por el `if (!el) return;`.
  _SCM_STEPS.forEach(def => {
    const el = document.getElementById('scs-step-' + def.n);
    if (!el) return;
    el.textContent = def.label;
    el.classList.remove('active', 'done', 'skipped');
    if (def.skippableWhen && def.skippableWhen(_scmState)) { el.classList.add('skipped'); return; }
    if (step === def.n) el.classList.add('active');
    else if (step > def.n) el.classList.add('done');
  });

  // botones de navegación
  const backBtn = document.getElementById('sprint-close-back-btn');
  const nextBtn = document.getElementById('sprint-close-next-btn');
  const isFirst = step === 1;
  const isLast  = step >= totalSteps;

  if (backBtn) {
    backBtn.hidden = isFirst;
    backBtn.disabled = isFirst;
  }
  if (nextBtn) {
    if (isLast) {
      nextBtn.textContent = 'Cerrar sprint';
      nextBtn.classList.add('is-close');
    } else {
      nextBtn.textContent = 'Siguiente →';
      nextBtn.classList.remove('is-close');
    }
  }

  // renderizar cuerpo del paso activo
  const body = document.getElementById('sprint-close-body');
  if (!body) return;

  // B-202605-067: extraer métricas de _scmState antes de llamar a _scmStepResumenHtml
  const _step1Metrics = {
    effortPlanned:         _scmState.effortPlanned          || 0,
    effortDone:            _scmState.effortDone             || 0,
    effortScopeAdded:      _scmState.effortScopeAdded       || 0,
    effortNotDone:         _scmState.effortNotDone          || 0,
    hasItemsWithoutEffort: _scmState.hasItemsWithoutEffort  || false,
  };

  if (step === 1) {
    body.innerHTML = _scmStepResumenHtml(sp, pendingItems, doneItems, _step1Metrics);
    // T-202606-118: gate de campos obligatorios
    const _gv = (v) => v && v !== 'n/a' && String(v).trim() !== '';
    const gateOk = sp && _gv(sp.version_target) && _gv(sp.release_type) && _gv(sp.scope);
    if (nextBtn) nextBtn.disabled = !gateOk;
  } else if (step === 2) {
    // T-202606-120 AC-2/AC-4/AC-5: Paso 2 siempre presente — DOC-UPDATEs
    body.innerHTML = _scmStepDocUpdatesHtml(docUpdates || []);
    // T-202606-120 AC-4: gate — Siguiente habilitado solo si todos tienen resolución
    _scmUpdateDuNextBtn(nextBtn);
  } else if (step === 3 && !skipStep3) {
    // Paso 3: descarte obligatorio de ítems activos (Gate duro de cierre — sin opción de reasignar)
    body.innerHTML = _scmStepMigracionHtml(pendingItems, migrations);
    _scmUpdateMigrationNextBtn(nextBtn);
  } else if (step === 4 || (step === 3 && skipStep3)) {
    // Paso 4 (o 3 si skipStep3): retro
    body.innerHTML = _scmStepRetroHtml(pendingItems, doneItems, migrations, skipStep3);
    const notesTA = document.getElementById('scm-retro-notes-ta');
    if (notesTA) notesTA.addEventListener('input', () => { if (_scmState) _scmState.retroNotes = notesTA.value; });
    if (nextBtn) nextBtn.disabled = false;
  }
}

// T-202606-120 AC-4 — simplificado por CHG-202608-002: el Paso 2 es de solo lectura desde
// _scmStepDocUpdatesHtml(), la resolución ya no ocurre en este wizard (vive en Doc Log). El campo
// `resolucion` de cada entrada de _scmState.docUpdates es ahora vestigial — nunca se muta,
// así que el gate se reduce a "hay o no hay entradas pendientes en el índice real".
function _scmUpdateDuNextBtn(nextBtn) {
  if (!_scmState || !nextBtn) return;
  const du = _scmState.docUpdates || [];
  nextBtn.disabled = du.length > 0;
}

// Gate duro Gen2: Siguiente habilitado solo cuando todos los ítems activos
// tienen migrations[code] === '__discard__' confirmado por el founder.
function _scmUpdateMigrationNextBtn(nextBtn) {
  if (!_scmState || !nextBtn) return;
  const pend = _scmState.pendingItems || [];
  const mig  = _scmState.migrations   || {};
  const allConfirmed = pend.every(i => mig[i.code] === '__discard__');
  nextBtn.disabled = !allConfirmed;
}

// B-202605-067: métricas de entrega recibidas como parámetro — sin acceso a _scmState global
function _scmStepResumenHtml(sp, pendingItems, doneItems, metrics) {
  const doneCount  = doneItems.filter(i => i.status === 'done').length;
  const pendCount  = pendingItems.length;

  // R-202605-125: métricas de entrega desde snapshot pasado por _scmRender
  const m = metrics || {};
  const effortPlanned    = m.effortPlanned          || 0;
  const effortDone       = m.effortDone             || 0;
  const effortScopeAdded = m.effortScopeAdded       || 0;
  const effortNotDone    = m.effortNotDone          || 0;
  const hasNoEffort      = m.hasItemsWithoutEffort  || false;
  // % entrega = done / planeado. effortPlanned ya incluye el effort de los ítems
  // scope_added (se computa sobre allSprintItems, que no excluye scope_added) —
  // sumarlo otra vez al denominador duplicaba ese effort. Fix B — auditoría 2026-06-22.
  const denominator = effortPlanned;
  const pct = denominator
    ? Math.round(effortDone / denominator * 100)
    : (doneCount ? 100 : 0);

  const doneRows = doneItems.filter(i => i.status === 'done').map(i =>
    `<div class="scm-item-row">
      <span class="scm-item-type scm-type-${i.type||'T'}">${esc(i.type||'TKT')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title">${esc(i.title || '—')}</span>
    </div>`
  ).join('');
  const pendRows = pendingItems.map(i =>
    `<div class="scm-item-row">
      <span class="scm-item-type scm-type-${i.type||'T'}">${esc(i.type||'TKT')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title">${esc(i.title || '—')}</span>
    </div>`
  ).join('');

  // R-202605-134: mostrar version_target y release_type en el resumen del paso 1
  const vt = sp && sp.version_target ? sp.version_target : null;
  const rt = sp && sp.release_type   ? sp.release_type   : null;
  const releaseRow = (vt || rt) ? `
    <div class="scm-release-meta">
      ${vt ? `<span class="scm-release-tag scm-release-version">${esc(vt)}</span>` : ''}
      ${rt ? `<span class="scm-release-tag scm-release-type scm-release-type--${(rt||'').toLowerCase()}">${esc(rt)}</span>` : ''}
    </div>` : '';

  // T-202606-118: gate de campos obligatorios antes de avanzar al Paso 2
  const _gateVal = (v) => v && v !== 'n/a' && String(v).trim() !== '';
  const gateVt    = _gateVal(sp && sp.version_target);
  const gateRt    = _gateVal(sp && sp.release_type);
  const gateSc    = _gateVal(sp && sp.scope);
  const gateAllOk = gateVt && gateRt && gateSc;

  const _gateRow = (label, ok, val) => `
    <tr>
      <td class="scm-effort-label">${label}</td>
      <td class="scm-effort-val">
        ${ok
          ? `<span>${esc(val)}</span>`
          : `<span class="scm-gate-val--missing">${val ? esc(val) : '—'}</span>
             <span class="scm-release-tag scm-release-tag--required">requerido</span>`
        }
      </td>
    </tr>`;

  const gateBlock = `
    <table class="scm-effort-table scm-gate-table">
      <tbody>
        ${_gateRow('version_target', gateVt, sp && sp.version_target)}
        ${_gateRow('release_type',   gateRt, sp && sp.release_type)}
        ${_gateRow('scope',          gateSc, sp && sp.scope)}
      </tbody>
    </table>
    ${!gateAllOk ? `<div class="scm-effort-warn scm-gate-hint">Editá estos campos en el panel del sprint antes de cerrar.</div>` : ''}
  `;

  // R-202605-125: advertencia si hay ítems sin effort
  const effortWarn = hasNoEffort
    ? `<div class="scm-effort-warn">⚠ Algunos ítems no tienen effort asignado — % de entrega puede ser inexacto.</div>`
    : '';

  return `
    ${gateBlock}
    ${releaseRow}
    <div class="scm-summary-grid">
      <div class="scm-kpi scm-kpi--good">
        <div class="scm-kpi-value">${doneCount}</div>
        <div class="scm-kpi-label">completados</div>
      </div>
      <div class="scm-kpi${pendCount ? ' scm-kpi--warn' : ''}">
        <div class="scm-kpi-value">${pendCount}</div>
        <div class="scm-kpi-label">pendientes</div>
      </div>
      <div class="scm-kpi">
        <div class="scm-kpi-value">${pct}%</div>
        <div class="scm-kpi-label">% entrega</div>
      </div>
    </div>
    <table class="scm-effort-table">
      <tbody>
        <tr>
          <td class="scm-effort-label">Effort planeado</td>
          <td class="scm-effort-val">${effortPlanned}</td>
        </tr>
        <tr>
          <td class="scm-effort-label">Effort completado (done)</td>
          <td class="scm-effort-val scm-effort-val--done">${effortDone}</td>
        </tr>
        <tr class="${effortScopeAdded ? '' : 'scm-effort-row--muted'}">
          <td class="scm-effort-label">Scope added durante sprint</td>
          <td class="scm-effort-val">${effortScopeAdded || '—'}</td>
        </tr>
        <tr class="${effortNotDone ? 'scm-effort-row--warn' : 'scm-effort-row--muted'}">
          <td class="scm-effort-label">No completados (migran o se descartan)</td>
          <td class="scm-effort-val">${effortNotDone || '—'}</td>
        </tr>
      </tbody>
    </table>
    ${effortWarn}
    ${doneRows ? `<div class="scm-section-title">Completados</div><div class="scm-items-list">${doneRows}</div>` : ''}
    ${pendRows ? `<div class="scm-section-title">Pendientes</div><div class="scm-items-list">${pendRows}</div>` : ''}
    ${!doneRows && !pendRows ? '<div class="scm-empty-hint">Sprint sin ítems registrados.</div>' : ''}
    <div class="scm-docgen-hint">
      📄 Antes de cerrar:
      <button class="scm-docgen-btn" data-action="scm-open-map-generator">Abrir Document Generator</button>
      para generar MAP + Sprint Review.
    </div>
  `;
}

// T-202606-120 AC-2/AC-5 — reescrito por CHG-202608-002: Paso 2 pasa a ser un gate de
// solo lectura. Se retiran los botones Aplicado/Descartado (antes AC-7/AC-8/AC-9/AC-10) —
// la resolución de cada DOC-UPDATE vive exclusivamente en Doc Log (Tab Documentos,
// locus-docs.js). Este paso solo lista lo que sigue pendiente en el índice real y bloquea
// "Siguiente" mientras existan entradas — nunca las muta. Ver _scmUpdateDuNextBtn() y el
// gate de _scmExecuteClose() para la re-verificación en vivo contra el índice.
function _scmStepDocUpdatesHtml(docUpdates) {
  if (!docUpdates || docUpdates.length === 0) {
    // AC-5: estado vacío
    return `<div class="scm-du-empty">No hay DOC-UPDATEs pendientes en este sprint.</div>`;
  }

  const rows = docUpdates.map(du => {
    const escAl = du.escalarA ? `<span class="scm-du-escalar">→ ${esc(du.escalarA)}</span>` : '';
    return `
      <div class="scm-du-row" data-du-id="${du.id}">
        <div class="scm-du-meta">
          <span class="scm-du-doc">${esc(du.doc)}</span>
          <span class="scm-du-seccion">${esc(du.seccion)}</span>
          ${escAl}
        </div>
      </div>`;
  }).join('');

  return `<div class="scm-du-list">${rows}</div><div class="scm-du-empty">Resuélvelos desde Doc Log (Tab Documentos) — este paso ya no aplica ni descarta, solo bloquea el cierre mientras queden pendientes.</div><div><button class="scm-docgen-btn" data-action="scm-go-to-doc-updates" type="button">Ver pendientes →</button></div>`;
}

// TKT-202608-351 (REQ-202608-138): botón 'Ver pendientes' del Paso 2 — cierra el modal de
// cierre de sprint, activa Tab Proyectos ('Documentos') + sub-tab 'docupdates', y hace scroll
// suave hasta el contenedor real de la lista unificada de DOC-UPDATEs (#du-unified-list, ver
// renderDocUpdatesUnified() en locus-docs.js). Mismo patrón switchTab()+setTimeout()+
// switchSubTab()+scrollIntoView ya usado en locus-ui-shell.js (atajo 'paste-ckpt', línea
// ~675) — el setTimeout da margen a que switchTab() aplique 'active' antes de que
// switchSubTab()/scrollIntoView operen sobre el sub-tab/contenedor. Llamar de nuevo con el
// founder ya en Documentos/docupdates es seguro — switchTab()/switchSubTab() son idempotentes
// (solo re-aplican toggles de clase), no hay doble-render que evitar.
function _scmGoToDocUpdates() {
  closeCloseSprintModal();
  switchTab('proyectos');
  setTimeout(() => {
    switchSubTab('docupdates');
    const el = document.getElementById('du-unified-list');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

// Gate duro de cierre (__BR-Ecosystem §5 Gen2): la única salida válida de un ítem activo
// es done o descartado — reasignar a otro sprint no destraba el cierre.
// _scmStepMigracionHtml ya no ofrece opciones de sprint. Todos los ítems pendientes se descartan
// y el founder confirma ítem por ítem con un checkbox antes de avanzar.
function _scmStepMigracionHtml(pendingItems, migrations) {
  if (!pendingItems.length) {
    return '<div class="scm-migration-intro">Sin ítems activos — continúa al siguiente paso.</div>';
  }

  const rows = pendingItems.map(i => {
    const confirmed = migrations[i.code] === '__discard__';
    return `<div class="scm-migration-item">
      <div class="scm-migration-item-info">
        <span class="scm-migration-item-title">${esc(i.title || '—')}</span>
        <span class="scm-migration-item-meta">${esc(i.code)} · ${esc(i.type || 'TKT')}</span>
      </div>
      <label class="scm-discard-confirm">
        <input type="checkbox" class="scm-migration-select" data-code="${esc(i.code)}"
          value="__discard__"${confirmed ? ' checked' : ''}/>
        Confirmar descarte
      </label>
    </div>`;
  }).join('');

  return `
    <div class="scm-migration-intro">${pendingItems.length} ítem${pendingItems.length !== 1 ? 's' : ''} activo${pendingItems.length !== 1 ? 's' : ''} — confirma el descarte de cada uno para continuar:</div>
    ${rows}
  `;
}

// R-202605-129: Retro automática enriquecida al cerrar sprint — Paso 3 del modal
// B-202605-270: función nombrada para descarga de retro desde paso 3 del SCM
// Extrae la lógica del IIFE inline para evitar problemas de parsing de atributos HTML
// y adjunta el anchor al body antes del click para garantizar descarga en todos los browsers
function _scmDownloadRetro() {
  if (!_scmState) return;
  const ta = document.getElementById('scm-retro-notes-ta');
  const notes = ta ? ta.value : '';
  _scmState.retroNotes = notes;
  const md = _generateSprintRetroMd(_scmState.id || '', notes);
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ds = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const pfx = _docPrefix();
  const fname = pfx + '-Retrospectiva-' + (_scmState.id || '') + '-' + ds + '.md';
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('download', 'Retro descargada', fname);
}

function _scmStepRetroHtml(pendingItems, doneItems, migrations, skipStep3) {
  const doneCount      = doneItems.filter(i => i.status === 'done').length;
  const discardedCount = doneItems.filter(i => i.status === 'descartado').length;

  // agrupar pendientes por destino
  const toSprint   = pendingItems.filter(i => migrations[i.code] && migrations[i.code] !== '__discard__');
  const toUnassign = pendingItems.filter(i => !migrations[i.code]);
  const toDiscard  = pendingItems.filter(i => migrations[i.code] === '__discard__');

  const itemRow = (i, destLabel, cls) =>
    `<div class="scm-confirm-row">
      <span class="scm-item-type scm-type-${i.type||'T'} scm-flex-shrink-0">${esc(i.type||'TKT')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title scm-item-title-cell">${esc(i.title || '—')}</span>
      <span class="scm-confirm-dest ${cls}">${esc(destLabel)}</span>
    </div>`;

  const spLabel = id => { const s = _getSprintById(id); return s ? (s.label ? `${s.id} · ${s.label}` : s.id) : id; };

  // ── R-202605-129: datos para retro enriquecida ──
  const st    = _scmState || {};
  const spObj = _getSprintById(st.id || '');

  const goal          = spObj && spObj.goal          ? spObj.goal          : '';
  const versionTarget = spObj && spObj.version_target ? spObj.version_target : '';
  const releaseType   = spObj && spObj.release_type   ? spObj.release_type   : '';

  const effortPl  = st.effortPlanned    || 0;
  const effortDn  = st.effortDone       || 0;
  const effortSA  = st.effortScopeAdded || 0;
  const effortND  = st.effortNotDone    || 0;
  const denomPct  = effortPl + effortSA;
  const pctDel    = denomPct > 0 ? Math.round(effortDn / denomPct * 100) : 0;
  const pctCls    = pctDel >= 70 ? 'scm-retro3-pct--good' : pctDel >= 40 ? 'scm-retro3-pct--warn' : 'scm-retro3-pct--bad';

  // Comparativa sprint anterior — último cerrado con deliveryMetrics
  const _prevSp = (() => {
    const closed = getActiveSprints()
      .filter(s => s.status === 'closed' && s.deliveryMetrics && s.id !== (st.id || ''))
      .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
    return closed[0] || null;
  })();

  let deltaHtml;
  if (_prevSp) {
    const dm       = _prevSp.deliveryMetrics;
    const prevDn   = dm.effortDone       || 0;
    const prevDnom = (dm.effortPlanned   || 0) + (dm.effortScopeAdded || 0);
    const prevPct  = prevDnom > 0 ? Math.round(prevDn / prevDnom * 100) : 0;
    const delta    = pctDel - prevPct;
    const sign     = delta > 0 ? '+' : '';
    const dCls     = delta > 0 ? 'scm-retro3-delta--up' : delta < 0 ? 'scm-retro3-delta--down' : 'scm-retro3-delta--flat';
    const dIcon    = delta > 0 ? '▲' : delta < 0 ? '▼' : '→';
    deltaHtml = `<div class="scm-retro3-delta-row">
      <span class="scm-retro3-delta-label">vs ${esc(_prevSp.label ? `${_prevSp.id} · ${_prevSp.label}` : _prevSp.id)}</span>
      <span class="scm-retro3-delta ${dCls}">${dIcon} ${sign}${delta}% · prev ${prevPct}% (${prevDn} effort)</span>
    </div>`;
  } else {
    deltaHtml = `<div class="scm-retro3-delta-row">
      <span class="scm-retro3-delta-label">Comparativa</span>
      <span class="scm-retro3-delta scm-retro3-delta--none">Primer sprint con datos completos</span>
    </div>`;
  }

  // Listas compactas de ítems para la retro preview
  const _miniRow = i =>
    `<div class="scm-retro3-mini-row">
       <span class="scm-item-code">${esc(i.code)}</span>
       <span class="scm-retro3-mini-title">${esc(i.title || '—')}</span>
     </div>`;

  const completadosMini  = doneItems.filter(i => i.status === 'done').map(_miniRow).join('');
  const migradosMini     = [...toSprint, ...toUnassign].map(_miniRow).join('');
  const descartadosMini  = [...doneItems.filter(i => i.status === 'descartado'), ...toDiscard].map(_miniRow).join('');

  // release type badge
  const rtBadge = releaseType
    ? `<span class="scm-release-tag scm-release-type scm-release-type--${releaseType.toLowerCase()}">${esc(releaseType)}</span>`
    : '';
  const vtHtml = versionTarget
    ? `<span class="scm-release-tag scm-release-version">${esc(versionTarget)}</span> ${rtBadge}`
    : rtBadge;

  // Bloque retro preview (visible antes de confirmar)
  const retroPreview = `
    <div class="scm-retro3-panel">
      <div class="scm-retro3-header">
        <span class="scm-retro3-title">📄 Retrospectiva del sprint</span>
        <button class="scm-retro3-dl-btn" type="button"
          data-action="scm-download-retro">⬇ Descargar MD</button>
      </div>
      <div class="scm-retro3-body">
        ${goal ? `<div class="scm-retro3-row"><span class="scm-retro3-key">Goal</span><span class="scm-retro3-val">${esc(goal)}</span></div>` : ''}
        ${(versionTarget || releaseType) ? `<div class="scm-retro3-row"><span class="scm-retro3-key">Release</span><span class="scm-retro3-val">${vtHtml}</span></div>` : ''}
        <div class="scm-retro3-row">
          <span class="scm-retro3-key">Effort</span>
          <span class="scm-retro3-val">
            <span class="scm-retro3-effort-done">${effortDn}</span>
            <span class="scm-retro3-effort-sep"> / ${effortPl} plan.</span>
            ${effortSA > 0 ? `<span class="scm-retro3-effort-sa"> +${effortSA} scope added</span>` : ''}
            <span class="scm-retro3-pct ${pctCls}"> ${pctDel}%</span>
            ${effortND > 0 ? `<span class="scm-retro3-effort-nd"> · ${effortND} no ent.</span>` : ''}
          </span>
        </div>
        ${deltaHtml}
        ${completadosMini  ? `<div class="scm-retro3-list-wrap"><span class="scm-retro3-list-label">✅ Completados (${doneCount})</span><div class="scm-retro3-mini-list">${completadosMini}</div></div>` : ''}
        ${migradosMini     ? `<div class="scm-retro3-list-wrap"><span class="scm-retro3-list-label">⏭ Migrados (${toSprint.length + toUnassign.length})</span><div class="scm-retro3-mini-list">${migradosMini}</div></div>` : ''}
        ${descartadosMini  ? `<div class="scm-retro3-list-wrap scm-retro3-list-wrap--disc"><span class="scm-retro3-list-label">🗑 Descartados (${discardedCount + toDiscard.length})</span><div class="scm-retro3-mini-list">${descartadosMini}</div></div>` : ''}
      </div>
      <div class="scm-retro3-notes">
        <div class="scm-retro-notes-label">📝 Notas <span class="scm-retro-notes-hint">(opcional — se guardan con el sprint)</span></div>
        <textarea
          class="scm-retro-notes-ta"
          id="scm-retro-notes-ta"
          rows="3"
          placeholder="¿Qué salió bien? ¿Qué mejorar? ¿Algún aprendizaje para el próximo sprint?"
        >${esc(st.retroNotes || '')}</textarea>
      </div>
    </div>`;

  // ── Confirmación de movimientos ──
  let html = `<div class="scm-confirm-intro">Revisa la retro y los movimientos. <strong>Esta acción no se puede deshacer.</strong></div>`;
  html += retroPreview;
  html += `<div class="scm-confirm-movements-title">Movimientos de ítems</div>`;

  if (doneCount) html += `
    <div class="scm-confirm-group">
      <div class="scm-confirm-group-title">Completados (${doneCount}) → histórico</div>
      ${doneItems.filter(i => i.status === 'done').map(i => itemRow(i, 'histórico', '')).join('')}
    </div>`;

  if (discardedCount) html += `
    <div class="scm-confirm-group">
      <div class="scm-confirm-group-title">Descartados (${discardedCount}) → histórico</div>
      ${doneItems.filter(i => i.status === 'descartado').map(i => itemRow(i, 'histórico', '')).join('')}
    </div>`;

  if (!skipStep3) {
    const byDest = {};
    toSprint.forEach(i => {
      const d = migrations[i.code];
      if (!byDest[d]) byDest[d] = [];
      byDest[d].push(i);
    });
    Object.entries(byDest).forEach(([dest, items]) => {
      html += `<div class="scm-confirm-group">
        <div class="scm-confirm-group-title">→ ${esc(spLabel(dest))} (${items.length})</div>
        ${items.map(i => itemRow(i, spLabel(dest), '')).join('')}
      </div>`;
    });

    if (toUnassign.length) html += `
      <div class="scm-confirm-group">
        <div class="scm-confirm-group-title">Sin asignar (${toUnassign.length})</div>
        ${toUnassign.map(i => itemRow(i, 'sin asignar', 'scm-confirm-dest--unassign')).join('')}
      </div>`;

    if (toDiscard.length) html += `
      <div class="scm-confirm-group">
        <div class="scm-confirm-group-title">Descartar (${toDiscard.length})</div>
        ${toDiscard.map(i => itemRow(i, 'descartar', 'scm-confirm-dest--discard')).join('')}
      </div>`;
  }

  if (!doneCount && !discardedCount && pendingItems.length === 0) {
    html += '<div class="scm-empty-hint">Sprint sin ítems — se cerrará como vacío.</div>';
  }

  html += `
    <div class="scm-backup-hint">
      💾 Backup opcional:
      <button class="scm-docgen-btn" data-action="scm-export-history" type="button">Descargar historial completo</button>
    </div>`;

  return html;
}

async function _scmExecuteClose() {
  if (!_scmState) return;
  const { id, pendingItems, migrations, retroNotes,
          effortPlanned, effortDone, effortScopeAdded, effortNotDone, docUpdates } = _scmState;

  // Gate duro de cierre — DOC-UPDATE sin resolver (__BR-Ecosystem §5: "Locus bloquea el
  // cierre automáticamente si hay DOC-UPDATEs sin resolución"). Simplificado por
  // CHG-202608-002: la resolución ya no ocurre en este wizard — el Paso 2 es de solo lectura
  // (ver _scmStepDocUpdatesHtml()) y la única vía de resolver un DOC-UPDATE es Doc Log (Tab
  // Documentos, locus-docs.js). El campo `resolucion` de cada entrada nunca se muta desde
  // aquí, así que el gate se reduce a "¿sigue habiendo entradas en el índice real capturadas
  // al abrir el modal?" — defensa en profundidad, misma regla que ya debería impedir llegar
  // aquí vía UI (botón Siguiente deshabilitado, ver _scmUpdateDuNextBtn()).
  if (docUpdates && docUpdates.length) {
    showToast('error', 'Bloqueo: hay DOC-UPDATEs sin resolver — resuélvelos desde Doc Log (Tab Documentos) antes de cerrar el sprint.');
    return;
  }

  // TKT-202608-361 (REQ-202608-144, origen_disc DISC-202608-150): Gate duro de cierre —
  // DISC de origen sin promover (__BR-Ecosystem §5, infra_version 98: "Un sprint no cierra si
  // contiene un REQ o TKT con origen_disc declarado cuya DISC de origen permanece en
  // discovery"). Mismo patrón de defensa en profundidad que el gate de DOC-UPDATEs de arriba
  // — backstop mecánico para el caso donde la regla de promoción-en-mismo-bloque (Cael) se
  // omitió por error. Barre todos los ítems del sprint, no solo el primero encontrado.
  // TKT-202608-375 (REQ-202608-151, AC4): el caso huérfano (origen_disc que no resuelve a
  // ningún ítem real) ya no se ignora — antes explícitamente fuera de scope ("problema de
  // integridad distinto, no bloquea"). Ahora bloquea igual, con mensaje propio.
  {
    const _origenDiscBlockers = [];
    getItems().forEach(i => {
      if (_sprintIdOf(i) !== id) return;
      if (itemKind(i) === 'DISC') return; // una DISC no referencia origen_disc en el modelo vigente
      if (!i.origenDisc) return;
      const _discOrigen = getItems().find(it => it.code === i.origenDisc);
      if (!_discOrigen) {
        _origenDiscBlockers.push(`${i.code}: declara origen_disc: ${i.origenDisc}, DISC de origen no encontrada`);
        return;
      }
      if (_discOrigen.status !== 'promoted') {
        _origenDiscBlockers.push(`${i.code}: declara origen_disc: ${i.origenDisc}, DISC sigue en discovery`);
      }
    });
    if (_origenDiscBlockers.length) {
      showToast('error', `Sprint no cierra — ${_origenDiscBlockers.join(' · ')}. Emitir patch de promoción antes de cerrar.`);
      return;
    }
  }

  // aplicar migraciones de pendientes
  const closeTs = Date.now();
  // T-202606-107: codes marcados historico en este ciclo de cierre — recolectados para
  // remover de ITEMS y persistir en storage dedicado (T-202606-105) en la misma operación.
  const _historicoCodesThisClose = new Set();
  pendingItems.forEach(i => {
    const dest = migrations[i.code];
    if (dest === '__discard__') {
      // B-202605-231: migrar a historico — no dejar como descartado en backlog vivo
      i.status = 'historico';
      i.archivedAt = closeTs;
      i.sprint = id; // mantiene referencia al sprint cerrado
      _historicoCodesThisClose.add(i.code);
    } else {
      i.sprint = dest || ''; // sprint destino o sin asignar
    }
  });

  // B-202604-193: archivar done/descartado → histórico
  // B-[tmp:sprint-revive]: excluir ítems ya procesados por el loop de migraciones
  // (pendientes con __discard__ ya quedan como historico arriba — processedCodes los excluye)
  const processedCodes = new Set(pendingItems.map(i => i.code));
  // R-202605-134: resolver version_target del sprint antes de iterar
  const spForClose = _getSprintById(id);
  const versionTarget = spForClose && spForClose.version_target ? spForClose.version_target : null;
  // T-202606-119 AC-3: version_target inválido — no asignar version, registrar en consola. Cierre continúa.
  if (!versionTarget) console.log('version_target no válido — campo version no aplicado a ítems done');
  getItems().forEach(i => {
    if (_sprintIdOf(i) === id && !processedCodes.has(i.code) && (i.status === 'done' || i.status === 'descartado')) {
      const wasDone = i.status === 'done';
      i.status = 'historico';
      i.archivedAt = closeTs;
      // R-202605-134: aplicar version_target como version en ítems que estaban done
      if (wasDone && versionTarget) i.version = versionTarget;
      _historicoCodesThisClose.add(i.code);
    }
  });

  // TKT7 (REQ-202607-015): bloque de migración de INC/PRB/KE/CHG a historico eliminado.
  // AC3 del REQ (verificado por Finn contra __BR-Core §6 — "Q-INC no migra a historico,
  // incident_status:closed es terminal por sí mismo, zona persistente sin evento de
  // archivo") prohíbe este comportamiento — Q-INC/ITEMS son poblaciones separadas con
  // ciclos de vida propios, confirmado explícitamente por el founder. TKT5/TKT6, que
  // implementaban esta migración, permanecen descartado. getIncidents() se conserva
  // importado — sigue en uso por _generateSprintRetroMd (línea ~236) para la bitácora
  // informativa "incident · [fecha]" en retro, que no muta ni elimina el incidente.

  // T-202606-122 — bloque eliminado (TKT-B3, BR-Execution §2 Sin retrocompatibilidad).
  // Migraba ítems pendiente/en-revision a 'icebox' al cerrar sprint. Código muerto:
  // el Gate duro de cierre (__BR-Ecosystem §5) bloquea el cierre del sprint mientras existan
  // ítems en pendiente/en-proceso/en-revision — para cuando este punto del flujo se ejecuta,
  // pendingItems.forEach (arriba) ya resolvió cada ítem a historico o a sprint real.
  // Sin dato que migrar, sin valor de seguridad (BR-Execution §2).

  // T-202606-107 AC-1 + AC-2: ítems historico nunca residen en ITEMS — se escriben al
  // storage dedicado (T-202606-105) y se remueven de ITEMS en la misma operación de cierre.
  // AC-4: 0 ítems califican → no invocar saveHistoricoItems ni getHistoricoItems, sin excepción.
  // TKT7 (REQ-202607-015): gate restaurado a solo ITEMS — INC/PRB/KE/CHG nunca pasan por
  // este bloque, consistente con AC3 (incident_status:closed es terminal, sin migración).
  if (_historicoCodesThisClose.size > 0) {
    const _itemsArr = getItems();
    const _newHistorico = _itemsArr.filter(i => _historicoCodesThisClose.has(i.code));
    // Acumular sobre lo ya persistido — saveHistoricoItems() sobreescribe la clave completa,
    // no hace merge. Sin esta lectura previa, cada cierre de sprint borraría el histórico anterior.
    try {
      const _existingHistorico = await getHistoricoItems();
      await saveHistoricoItems([...(_existingHistorico || []), ..._newHistorico]);
    } catch (err) {
      // AC-3: fallo de escritura no revierte el cierre — los ítems ya marcados historico
      // quedan en localStorage como fallback (saveHistoricoItems ya cubre ese fallback
      // internamente). Registrar el fallo en DocLog con el sprint_id afectado.
      console.error('[AI Tracker] _scmExecuteClose: fallo al persistir historico en storage dedicado', err);
      _blogLog('historico-write-error', id, `Fallo al persistir ${_historicoCodesThisClose.size} ítem(s) historico en storage dedicado al cerrar ${id}: ${err.message || err}`, 'backlog');
    }
    // Remover de ITEMS — sin pasar por _setITEMS (no exportada desde locus-backlog-core.js).
    // Misma referencia mutable que getItems() retorna — splice in-place equivalente al
    // filtro interno de _setITEMS, aplicado aquí porque la mutación de status ocurrió
    // directamente sobre los objetos, no vía _setITEMS.
    for (let _idx = _itemsArr.length - 1; _idx >= 0; _idx--) {
      if (_historicoCodesThisClose.has(_itemsArr[_idx].code)) _itemsArr.splice(_idx, 1);
    }
    // INC histórico — sin CHECKPOINT confirmado: invalidar cache sync de historico — independiente de si
    // saveHistoricoItems tuvo éxito (ITEMS ya se mutó arriba; el próximo read debe reflejarlo).
    _invalidateHistoricoCache();
  }

  _undoSnapshotItems();
  saveBacklog();
  _setBacklogModified();
  // B-[tmp:historico-expand]: forzar expansión del histórico post-cierre
  // sin esto la lista principal queda vacía y el histórico aparece colapsado
  try { localStorage.setItem(_HISTORICO_KEY, '1'); } catch {}
  closeCloseSprintModal();
  setSprintStatus(id, 'closed');

  // T-202606-071: activar el sprint scheduled de scheduledAt menor del mismo proyecto.
  // Sin esto, _getActiveSprint() (post T-202606-070) puede retornar null aunque haya
  // sprints programados esperando — la cola scheduled→active no avanzaba sola.
  {
    const _closedSprint = _getSprintById(id);
    const _projIdForNext = _closedSprint ? (_closedSprint.projId || _closedSprint.projectId || null) : null;
    const _scheduledCandidates = getActiveSprints().filter(s => {
      if (s.status !== 'scheduled') return false;
      // TKT-PARSER-sprints: isHotfix eliminado — S-HOTFIX deprecado Gen2.
      if (!_projIdForNext) return true; // sin projId no se puede filtrar — no excluir
      return (s.projId === _projIdForNext || s.projectId === _projIdForNext);
    });
    if (_scheduledCandidates.length > 0) {
      const _nextSprint = _scheduledCandidates.reduce((min, s) =>
        (s.scheduledAt || 0) < (min.scheduledAt || 0) ? s : min
      );
      // B-202606-042 AC-1: capturar rechazo de setSprintStatus — fallo silencioso resuelto
      // T-202606-108: await requerido — setSprintStatus es async desde este T
      const _activated = await setSprintStatus(_nextSprint.id, 'active');
      if (_activated === false) {
        showToast('error', 'Error al activar sprint ' + _nextSprint.id);
      }
    }
  }

  renderStats(); // B-202605-269: refrescar contadores del backlog inmediatamente post-cierre

  // T-202604-417: guardar retro como documento en el sprint — accesible desde vista de sprints cerrados
  // R-202605-125: persistir métricas de entrega con el sprint cerrado
  const sp = _getSprintById(id);
  if (sp) {
    sp.retroNotes = retroNotes || '';
    sp.retroDoc   = _generateSprintRetroMd(id, retroNotes || '');
    // TKT-202607-031: bloque T-202606-010 AC-8/AC-8b (auto-descarte silencioso vía
    // _setDocUpdateIndex({}) + log 'descartado · sprint cerrado' para toda entrada
    // sobreviviente, sin importar antigüedad) eliminado — violaba __BR-Ecosystem §3
    // ("DOC-UPDATE vencido... se presenta como bloqueante explícito... no se aplica ni
    // se descarta por inacción"). Reemplazado por cómputo de vencido: cada entrada con
    // createdAt conocido gana vencido:true cuando 2+ sprints del proyecto tienen closedAt
    // posterior a ese createdAt — mismo criterio de "2 sprints sin resolución" de
    // __BR-Ecosystem §3. El sprint que se está cerrando en este ciclo ya cuenta — su
    // status/closedAt se mutan de forma síncrona en setSprintStatus() (línea ~1427, antes
    // de este bloque) sobre la misma referencia que retorna getActiveSprints(). Entradas
    // sin createdAt (persistidas antes de TKT histórico — sin CHECKPOINT confirmado · createdAt en docUpdateIndex)
    // no se marcan — antigüedad desconocida, mismo criterio de _docUpdateStaleness()
    // (locus-sesiones-stats.js). Entradas ya aplicadas/descartadas nunca llegan aquí — se
    // eliminan del índice en el momento de resolución (processDocUpdate/resolveDocUpdate/
    // _initDocUpdatesListeners, locus-docs.js) — solo entradas sin resolver sobreviven al cierre.
    {
      const _duIndex = _getDocUpdateIndex();
      const _duKeys  = Object.keys(_duIndex);
      if (_duKeys.length > 0) {
        // TKT-202607-031 · fix bug de implementación (hallazgo Finn en QA): getActiveSprints()
        // sin filtrar contaba sprints cerrados de TODOS los proyectos — docUpdateIndex es por
        // proyecto activo (locus-docs.js processDocUpdate(), línea ~810: "índice del proyecto
        // activo"). Contradecía el propio comentario de este bloque ("2+ sprints DEL PROYECTO",
        // arriba). Se filtra ahora con _sprintsForProject() al proyecto del sprint que se cierra.
        const _projIdForDu = sp.projId || sp.projectId || null;
        const _closedSprintTs = _sprintsForProject(_projIdForDu)
          .filter(s => s.status === 'closed' && typeof s.closedAt === 'number')
          .map(s => s.closedAt);
        _duKeys.forEach(k => {
          const entries = _duIndex[k] || [];
          entries.forEach(e => {
            if (typeof e.createdAt !== 'number') return;
            const _sprintsSince = _closedSprintTs.filter(ts => ts >= e.createdAt).length;
            e.vencido = _sprintsSince >= 2;
          });
        });
        _setDocUpdateIndex(_duIndex);
      }
    }
    // R-202605-125: métricas de entrega para Analytics (Nivel 2)
    // Fix denominador % entrega — effortPlanned ya incluye scope_added (allSprintItems no lo excluye),
    // no sumar effortScopeAdded otra vez. Mismo fix aplicado en _scmStepResumenHtml — ver L1159.
    const denominator = effortPlanned || 0;
    sp.deliveryMetrics = {
      effortPlanned:    effortPlanned    || 0,
      effortDone:       effortDone       || 0,
      effortScopeAdded: effortScopeAdded || 0,
      effortNotDone:    effortNotDone    || 0,
      pctDelivery:      denominator ? Math.round((effortDone || 0) / denominator * 100) : 0,
      recordedAt:       Date.now(),
    };
    save();
  }

  // T-202604-295: downloadTemplates deprecado

  // T-202604-417: ofrecer descarga de retro integrada al flujo
  if (sp && sp.retroDoc) {
    _openRetroDownloadPrompt(id);
  }

  // T-202605-147: import nombrado — circular ESM seguro (llamada en runtime, no top-level)
  renderSprintTab();
}

export function createSprintFromGroup(id, name) {
  // Registra en catálogo un sprint que ya tiene ítems pero no estaba en proj.sprints
  // B-202605-054: name opcional — si se pasa, se usa como label; si no, fallback a id
  if (_getSprintById(id)) return;
  const proj = getActiveProject();
  if (!proj) return;
  if (!proj.sprints) proj.sprints = [];
  // B-202605-036: current:true si ningún sprint activo lo tiene — mismo patrón que createSprint
  const hasCurrentSprint = proj.sprints.some(s => s.status === 'active' && s.current === true);
  proj.sprints.push({ id, label: name || id, status: 'active', current: !hasCurrentSprint ? true : undefined, formallyOpened: false, createdAt: Date.now() });
  save();
  _markBacklogListDirty(); renderBacklogList();
  // T-202605-147: import nombrado — circular ESM seguro (llamada en runtime, no top-level)
  renderSprintTab();
  showToast('success', id + ' registrado en catálogo');
}

// TKT-202607-134 (REQ-202607-039, INC-202607-045): renderSprintBurndown() · renderSprintItems()
// · _updateCloseReadyState() · _renderSprintSection() · _buildSprintItemRow() · renderScopeAdded()
// · _buildScopeAddedRow() · renderSprintWorkers() · _buildWorkerPill() retirados — pipeline
// duplicado, disparado vía evento shell:sprint-render, escribía los mismos nodos DOM
// (#spi-body-*, #sph-bd-fill/pct/label) que _renderSprintItems(sprint) en locus-sprint.js con
// clasificación de 3 buckets (en-revision folded en pendiente) y burndown item-count-based —
// vs los 4 buckets correctos y el burndown ahora effort-based del pipeline consolidado.
// _updateCloseReadyState() ya era no-op — #btn-close-sprint fue removido de index.html en
// T-202606-042. Las funciones internas no exportadas (renderScopeAdded/renderSprintWorkers/
// _buildScopeAddedRow/_buildWorkerPill/_renderSprintSection/_buildSprintItemRow) no tenían
// otro caller — se retiran junto con su único consumidor, no dejan código muerto. Ver también
// el listener 'shell:sprint-render' retirado al final del archivo y el bloque de delegación
// 'spi-navigate' retirado en _attachSprintDelegation (misma causa — markup que ya no se genera).
// T-202605-055: delegación de eventos para locus-backlog-sprints.js
// Cubre: confirmEditSprint (inputs keydown + button) · sprint-edit-cancel · _scmDownloadRetro
// Los handlers de index.html (closeCloseSprintModal · _scmBack · _scmNext · closeSprintRetroOverlay)
// se migran a listeners en DOMContentLoaded en este módulo — ver función _attachSprintStaticHandlers
(function _attachSprintDelegation() {
  // Delegación en document para form inline de edición de sprint (se re-inyecta via innerHTML)
  document.addEventListener('click', function _sprintDelegateClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const act = action.dataset.action;

    if (act === 'sprint-edit-confirm') {
      confirmEditSprint(action.dataset.sprintId);
      return;
    }
    if (act === 'sprint-edit-cancel') {
      _markBacklogListDirty();
      renderBacklogList();
      return;
    }
    if (act === 'scm-download-retro') {
      _scmDownloadRetro();
      return;
    }
  });

  document.addEventListener('keydown', function _sprintDelegateKeydown(e) {
    const inp = e.target.closest('[data-action="sprint-edit-keydown"]');
    if (!inp) return;
    const sprintId = inp.dataset.sprintId;
    if (e.key === 'Enter') {
      confirmEditSprint(sprintId);
    }
    if (e.key === 'Escape') {
      _markBacklogListDirty();
      renderBacklogList();
    }
  });
})();

// Migración de handlers del scope en index.html (DOM estático de modales de sprint)
// closeSprintRetroOverlay · closeCloseSprintModal · _scmBack · _scmNext
(function _attachSprintStaticHandlers() {
  function _attach() {
    // Usar IDs de botones declarados en index.html
    const cancelBtn = document.getElementById('sprint-close-cancel-btn');
    const backBtn   = document.getElementById('sprint-close-back-btn');
    const nextBtn   = document.getElementById('sprint-close-next-btn');

    if (cancelBtn) {
      cancelBtn.removeAttribute('onclick');
      cancelBtn.addEventListener('click', function() {
        closeCloseSprintModal();
      });
    }
    if (backBtn) {
      backBtn.removeAttribute('onclick');
      backBtn.addEventListener('click', function() {
        _scmBack();
      });
    }
    if (nextBtn) {
      nextBtn.removeAttribute('onclick');
      nextBtn.addEventListener('click', function() {
        _scmNext();
      });
    }
    // Botón Cerrar del overlay retro — id="sprint-retro-close-btn" (migrado desde onclick en index.html)
    const retroCloseBtn = document.getElementById('sprint-retro-close-btn');
    if (retroCloseBtn) {
      retroCloseBtn.addEventListener('click', function() {
        closeSprintRetroOverlay();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _attach);
  } else {
    _attach();
  }
})();

// ── T8: Delegation — #sprint-close-body + #sprint-panel-items + sprint-inline-edit-wrap ──
document.addEventListener('DOMContentLoaded', () => {
  // Sprint close modal — scm buttons
  const scmBody = document.getElementById('sprint-close-body');
  if (scmBody) scmBody.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'scm-open-map-generator':
        openMapGenerator();
        break;
      // T-202606-120 AC-7/AC-8/AC-9/AC-10 (resolución de DOC-UPDATE por fila) — retirado por
      // CHG-202608-002: _scmStepDocUpdatesHtml() ya no renderiza botones con data-action
      // "scm-du-resolve" (Paso 2 es de solo lectura, la resolución vive en Doc Log). Este case
      // era código muerto — quedaba huérfano operando sobre un elemento que ya no existe en
      // el DOM. Ver _scmUpdateDuNextBtn() para el gate simplificado.
      case 'scm-export-history':
        exportFullHistoryMd();
        break;
      case 'scm-go-to-doc-updates':
        _scmGoToDocUpdates();
        break;
    }
  });

  // Delegación change — .scm-migration-select (checkbox de confirmación de descarte, Gen2)
  // Gate duro §5: la única salida es __discard__ — el checkbox lo confirma o desmarca.
  if (scmBody) scmBody.addEventListener('change', e => {
    const cb = e.target.closest('.scm-migration-select');
    if (!cb || !_scmState) return;
    const code = cb.dataset.code;
    if (code) _scmState.migrations[code] = cb.checked ? '__discard__' : '';
    const nBtn = document.getElementById('sprint-close-next-btn');
    _scmUpdateMigrationNextBtn(nBtn);
  });

  // TKT-202607-134: delegación 'spi-navigate' retirada — su único productor de markup
  // (_buildSprintItemRow, este archivo) fue retirado con renderSprintItems(). La navegación
  // de ítems del sprint board vive en locus-sprint.js (delegación sobre '[data-item-code]',
  // ver itemsList.addEventListener('click', ...) en _sptSwitch/renderSprintTab).

  // Sprint inline edit wrap — stopPropagation (reemplaza onclick="event.stopPropagation()")
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="sprint-edit-stop-prop"]')) e.stopPropagation();
  }, true); // capture phase para interceptar antes de burbujeo
});
// ─────────────────────────────────────────────────────────────────────────

// T-202606-077: registrar getActiveSprint y getSprintById en _coreCallbacks
// locus-backlog-core los consume para asignación de sprint a ítems y render de badges.
document.addEventListener('DOMContentLoaded', () => {
  _registerCoreCallback('getActiveSprint', _getActiveSprint);
  _registerCoreCallback('getSprintById',   _getSprintById);
}, { once: true });
// ── END T-202606-077 ─────────────────────────────────────────────────────────

// TKT-202607-134: listener 'shell:sprint-render' retirado junto con renderSprintBurndown()/
// renderSprintItems() (ver comentario de retiro más arriba en este archivo). Los 3
// dispatchEvent('shell:sprint-render') en locus-backlog-core.js quedan como no-op aceptado —
// fuera de scope de este TKT (no toca módulo crítico), limpieza futura vía DISC.
