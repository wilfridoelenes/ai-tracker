// [PP] mod:80 · autor:Rune · 2026-07-28 00:12 UTC-6
// TKT3 (REQ-202607-046, depends_on TKT-202607-145): _doSaveSession() — retirado el bloque que
// coordinaba #merge-diff-overlay contra #ingest-modal-overlay antes de invocar
// showMergeDiffPanel. Esa coordinación era necesaria bajo la arquitectura de dos overlays
// independientes (TKT-202607-128/129, superada); con el shell único (#modal-split-shell,
// TKT-202607-144/145) showMergeDiffPanel abre el shell directamente. Guard de proyecto activo
// (línea ~358, _needsProject → _showProjRequiredInPanel) sin cambio — solo se eliminó el
// bloque de coordinación previa. contract_update: no — firma de la invocación sin cambio
// (mismos 4 argumentos). Ver mismo fix aplicado en locus-session-parse.js (mod:150) y en
// locus-sesiones.js (TKT-202607-145 AC2).
// [PP] mod:78 · autor:Rune · 2026-07-25 09:10 UTC-6
// Hallazgo fuera de scope de INC-202607-019, resuelto en la misma sesión (excepción de
// resolución directa — dueño presente, nivel Patch, sin bifurcación de founder, confirmado
// por el founder): remanente de 'KE' retirado de este archivo — 3 puntos vivos (entrada en
// VALID_TRANSITIONS, contador inicial de tracker.counters, alternativa en el regex de
// code.match). Inalcanzable desde la fusión KE→PRB.root_cause_confirmed (infra_version 51) —
// itemKind() no puede resolver 'KE' desde _GEN2_TYPES (locus-backlog-core.js mod:131). Mismo
// patrón ya aplicado en locus-backlog-item.js (mod:139-140). Sin cambio de comportamiento
// para INC/PRB/CHG/REQ/TKT/DISC reales. node --check limpio.
// [PP] mod:75 · autor:Rune · 2026-07-24 UTC-6
// INC-202607-019 (fix): VALID_TRANSITIONS.CHG usaba _ITIL_STATUS_SET — invertía la validación
// (rechazaba pendiente/en-revision/done/descartado, aceptaba detected/resolved/closed). CHG
// es la excepción de vocabulario de la rama Reactiva (__BR-Ecosystem §4b) — vocabulario Scrum,
// no ITIL. Nuevo _CHG_STATUS_SET declarado; comentario adyacente que agrupaba
// "INC/PRB/KE/CHG" como homogéneo corregido. Ver detalle junto a VALID_TRANSITIONS, más abajo.
// INC-[pendiente-ID] (fix gate req-sin-tkt vs reparenting — ver locus-backlog-item.js mod:142
// para el detalle completo): parámetro patchItems agregado a _mergeBacklogWithProject() y a
// _applyCheckpointBatch() — propagado hasta mergeBacklogFromTG en sus 2 call sites reales de
// este archivo (single-CHECKPOINT y batch).
// TKT2 (REQ CAEL-0717-01 · AC1-4, parte 3/3): _ckptMeta gana finnRelease: parsed.finnRelease
//   || null — cierra la cadena de propagación de finn_release iniciada en
//   locus-session-parse.js (mod:124, parseCheckpoint → ai._parsed.finnRelease) y consumida
//   por _buildFinnReleaseSection() en locus-backlog-merge.js (mod:53). Con este cambio el
//   flujo embebido (ruta principal de ingesta de CHECKPOINT vía card de sesión) muestra la
//   tarjeta de liberación de Finn — el flujo standalone ya quedó completo en
//   locus-session-parse.js mod:124. no_incluye: no toca newSess (objeto de persistencia de
//   historial, línea ~520 de este archivo) — finn_release no se agrega ahí, mismo criterio
//   que finnObservations, que sí persiste en newSess por ser campo informativo de historial,
//   pero finn_release es del DIFF (_ckptMeta), no del mini-historial; ampliar newSess no fue
//   pedido por el TKT y se deja fuera para no expandir scope. No toca el flujo batch
//   (_gatedDoApplyBatch en locus-session-parse.js, ckptMeta:{} hardcodeado) — deuda
//   preexistente ya señalada en ese archivo, no ampliada aquí.
// [PP] mod:70 · autor:Rune · 2026-07-13 16:10 UTC-6
// TKT1 (REQ-[pendiente-ID] · promovida de DISC-202607-010): eliminado el import huérfano
//   _tryIngestSprintProposal (sin FromParsed) — cero call sites en este archivo confirmado
//   via grep. Resto de la línea de import (_setPhase, parseSprintProposal, parsePaste,
//   _buildTriggeredBySuggestion) sin cambio.
// [PP] mod:64 · autor:Rune · 2026-07-12 UTC-6
// TKT (REQ-[pendiente-ID] · ref: consolidación de punto de entrada único de sprint_proposal —
//   decisión del founder): revertido TKT1 (mod:62) — retirados el import de
//   setPendingSprintProposal y el bloque que persistía _validSpProposal a storage por proyecto
//   desde el flujo de card del worker. Pegar un CHECKPOINT con sprint_proposal en la card ya no
//   alimenta el panel "+ Sprint nuevo" de Tab Sprint — la única ruta de creación de sprint es
//   el paste propio de ese panel (locus-sprint.js). _ckptMeta.sprintProposal se conserva sin
//   cambio — sigue siendo la fuente del gate de exclusividad §12 en showMergeDiffPanel (no crea
//   sprint por sí mismo, onApproveProposal ya no existe desde TKT3/mod:63). no_incluye: no toca
//   _ckptMeta.sprintProposal ni el resto del flujo del DIFF — solo la vía de persistencia
//   paralela agregada en mod:62. Ver mismo TKT en locus-session-parse.js (retiro Step 0
//   standalone) y locus-sprint.js (paste nuevo en el panel).
// [PP] mod:63 · autor:Rune · 2026-07-11 UTC-6
// TKT (INC-202607-001 · fix — guard huérfano de draft:true bloqueaba persistencia en
//   _doApplyMergeAndFinish): eliminado el guard "defensa secundaria" (T-202606-013 AC-1) que
//   retornaba antes de _mergeBacklogWithProject cuando parsed.draft === true — contradecía
//   __BR-Ecosystem §8 (un ítem con draft:true debe persistirse, solo queda invisible en
//   vistas activas hasta el aval de Finn). El guard "primario" equivalente ya había sido
//   eliminado en la ruta standalone (locus-session-parse.js) por REQ-202607-026/TKT1 — este
//   quedó huérfano, sin actualizar, y era el único bloqueante real: la propagación de draft
//   a tgItems (locus-session-parse.js) y la asignación de código real (_assignPendingIds) ya
//   funcionaban correctamente antes de este fix. Toast conservado pero resignificado: ya no
//   es un bloqueo, es confirmación de guardado en estado borrador — mensaje y tipo ('success')
//   ajustados para reflejar que la persistencia sí ocurrió. no_incluye: no toca el guard de
//   "draft ausente" (BR-Ecosystem §8, campo obligatorio sin valor por defecto) — ese es un
//   guard distinto, sigue vigente sin cambio. No modifica _resolveCheckpointBatch (bug
//   separado, ya no llama a _assignPendingIds — registrado como deuda distinta, no parte de
//   este INC). No modifica locus-session-parse.js — draft ya se propaga correctamente ahí.
// [PP] mod:62 · autor:Rune · 2026-07-11 23:12 UTC-6
// TKT1 (REQ-[pendiente-ID] · migración Step 0 DIFF → panel Sprint subtab): sprint_proposal
// válido ahora también se persiste vía setPendingSprintProposal(proj.id, _validSpProposal) —
// en paralelo a ckptMeta.sprintProposal, sin alterar el Step 0 del DIFF en este TKT.
// TKT-202607-077 (REQ-[pendiente-ID] · cadena de merge async, depends_on: TKT3):
//   _mergeBacklogWithProject() pasa a async — await mergeBacklogFromTG(tgItems, sessId) en
//   vez de asignación síncrona, propagando la cadena async iniciada aguas abajo (mismo patrón
//   de TKT3/TKT-202607-076: _getNextItemCode() requiere await). _applyCheckpointBatch() pasa
//   a async y hace await de _mergeBacklogWithProject(...) — su único caller conocido,
//   _gatedDoApplyBatch en locus-session-parse.js (TKT5), debe actualizarse para await la
//   llamada. _doApplyMergeAndFinish() (ya async) ahora hace await con try/catch alrededor de
//   _mergeBacklogWithProject(...): en rechazo, toast de error + return antes de
//   applyPatchesFromTG, sincronización de newSess.trackerRefs, merge de CONTEXT-SECTION y el
//   resto del cierre de sesión — la sesión ya empujada a activeProj.sessions (orden
//   preexistente) queda registrada sin ítems de backlog aplicados. _doSaveSession no cambia
//   de firma ni se vuelve async — sin relación con este TKT.
// TKT-202607-014: eliminado bloque inalcanzable en buildBacklogMd() — el return incondicional
//   dentro del bloque `{ const { md } = _generateBacklogContent(version); return md; }` hacía
//   que el comentario de fallback, el cálculo de timestamp y el segundo return con el string
//   de warning nunca se ejecutaran. Sin cambio de comportamiento: mismo output para todo input,
//   la rama fallback nunca fue alcanzable. Sin cambio de firma — buildBacklogMd(version) → string.
// [PP] mod:56 · autor:Rune · 2026-07-07 UTC-6
// INC-202607-XXX (triggered_by: n/a — detectado en producción, sin TKT activo): SyntaxError de
//   módulo — import de _tryIngestPlan/_tryIngestPlanFromParsed desde locus-session-parse.js,
//   que ya no los exporta desde mod:95 (REQ-execution-plan-deprecation retiró el feature
//   EXECUTION-PLAN completo por ser código huérfano de Gen1, fuera de schema __BR-Ecosystem §8).
//   Impacto lateral no declarado en su momento: el TKT que retiró el export en
//   locus-session-parse.js no verificó ni actualizó el único consumidor (este archivo).
//   Fix: retirados ambos nombres del import + eliminado el bloque que los invocaba
//   (ingesta de ---PLAN---/---EXECUTION-PLAN--- y parsed.executionPlan). Mismo archivo,
//   sin scope nuevo, verificable por Finn junto con la causa raíz — variante ligera aplicable
//   si el founder confirma la carga del módulo en app.
// [PP] mod:55 · autor:Rune · 2026-07-02 08:10 UTC-6
// TKT4 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs con resolución de [tmp:slug]
//   cross-CHECKPOINT, depends_on: TKT3 done): _applyCheckpointBatch(blocks, sessionId) de
//   TKT2 se separa en dos responsabilidades — decisión de arquitectura del founder: batch debe
//   pasar por showMergeDiffPanel antes de persistir, igual que el flujo single. Esta función
//   pasa de "resolver Y persistir en el mismo loop" a "solo persistir" — recibe tgItems ya
//   resueltos por _resolveCheckpointBatch (nueva, locus-session-parse.js). El gate de
//   duplicados [tmp:slug] (antes AC3 de TKT2, aquí mismo) se movió a _resolveCheckpointBatch —
//   la resolución, no la persistencia, es donde el diff panel necesita conocer el rechazo
//   antes de abrirse. parseCheckpoint, _splitCheckpointBlocks y _blogLog quedan sin uso en
//   este archivo tras el traslado — retirados del import.
// [PP] mod:54 · autor:Rune · 2026-07-02 03:40 UTC-6
// TKT2 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs con resolución de [tmp:slug]
//   cross-CHECKPOINT): agregada _applyCheckpointBatch(blocks, sessionId) — orquestador nuevo,
//   no declarado en contract_detail original de Cael (ver nota junto a la función). Recibe
//   bloques de _splitCheckpointBlocks (TKT1), parsea cada uno, aplica gate de duplicados
//   [tmp:slug] a nivel de batch completo (AC3), y mergea secuencialmente encadenando slugMap
//   vía opts.seedSlugMap de mergeBacklogFromTG (TKT2, locus-backlog-item.js). Imports nuevos:
//   parseCheckpoint + _splitCheckpointBlocks (locus-session-parse.js) · _blogLog (locus-storage.js).
// [PP] mod:53 · autor:Rune · 2026-06-30 UTC-6
// locus-session-save.js
// Última actualización: B-202606-105 — CHANGELOG_KEY local eliminada, usa LOCUS_KEYS.CHANGELOG
// (locus-storage.js) como fuente única de verdad de la clave de changelog.
// Responsabilidad: changelog, buildBacklogMd, saveSession, _doSaveSession, _doApplyMergeAndFinish.
// Dependencias: locus-storage.js · locus-toast.js · locus-session-parse.js
import { loadBacklog, renderStats, getItems, getAnyItem, itemKind } from './locus-backlog-core.js'; // [tmp:tkt7-session-save-preview]: getAnyItem agregada
import { mergeBacklogFromTG, applyPatchesFromTG } from './locus-backlog-item.js'; // INC-[pendiente-ID]: applyPatchesFromTG restaurado — ver header mod:53
import { showMergeDiffPanel } from './locus-backlog-merge.js';
import { _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { updateTabNotifBadges } from './locus-notifications.js';
import { _markRadarDirty, renderGlobalRadarSidebar, toggleRadarSidebar } from './locus-radar.js';
import { stopSessionTimer } from './locus-sesiones-utils.js';
import { _getLocalStorageUsage } from './locus-sprint-project.js';
import { _generateBacklogContent, _generateBacklogMd } from './locus-backlog-generator.js';
import { LOCUS_KEYS, _docPrefix, _effectiveVersion, _findSession, _tplKey, getAI, getActiveProject, getActiveSprints, getActiveTracker, getSupabaseContext, saveImmediate, _mutateSessions } from './locus-storage.js'; // TKT4: _blogLog retirado — DocLog de duplicados ahora vive en _resolveCheckpointBatch (locus-session-parse.js) · TKT1 REQ-sessions-mutator: _mutateSessions agregado · TKT (REQ-[pendiente-ID] · consolidación sprint_proposal): setPendingSprintProposal retirado del import — la persistencia paralela que agregó se revierte, ver header mod nuevo


import { extractContextSections, extractDocUpdates, extractHtmlMapSections, mergeContextSections, mergeHtmlMapSections, processDocUpdate } from './locus-docs.js';

import { showCheckpointPanel } from './locus-sesiones-viz.js';

import { render } from './locus-sesiones.js';

import { _showProjRequiredInPanel, interpretHora } from './locus-session-hora.js';

import { _setPhase, parseSprintProposal, parsePaste, _buildTriggeredBySuggestion } from './locus-session-parse.js'; // T-202606-032: isParseInFlight eliminado — AC-5 | T-202606-021: _buildTriggeredBySuggestion | TKT3 (REQ-[pendiente-ID]): _tryIngestSprintProposalFromParsed/_applySprintInheritanceToItems retirados del import — sin consumidor en este archivo tras mover la aprobación a locus-sprint.js (TKT2) | TKT1 (REQ-[pendiente-ID] · promovida de DISC-202607-010): _tryIngestSprintProposal (sin FromParsed) retirado del import — confirmado sin call site en este archivo (Hallazgo fuera de scope de TKT3, resuelto aquí); el símbolo en sí sigue exportado en locus-session-parse.js, ver Hallazgo fuera de scope declarado en CHECKPOINT | TKT4: parseCheckpoint + _splitCheckpointBlocks retirados — el uso se trasladó a _resolveCheckpointBatch en locus-session-parse.js, no requiere importarlos de vuelta | INC-202607-XXX: _tryIngestPlan + _tryIngestPlanFromParsed retirados del import — locus-session-parse.js mod:95 (REQ-execution-plan-deprecation) eliminó ambos exports; este archivo seguía importándolos y rompía la carga del módulo

import { _getAllSessionsChron, _rebuildLogBody } from './locus-session-popup.js';

import { showToast } from './locus-toast.js';

import { esc, getCurrentTab } from './locus-ui-shell.js';

// Changelog — INC-[pendiente-ID] (mod:53, triggered_by TKT-202606-014): applyPatchesFromTG(parsed.patchItems, ...)
//   restaurado en _doApplyMergeAndFinish — se había eliminado por "redundante" con la llamada de
//   locus-backlog-merge.js (_mdiffDoApply), que en realidad nunca aplica patches sobre ítems
//   existentes (filtra tgItems por type==='patch', pero _buildPatchTgImes convierte esos patches
//   en representaciones sintéticas que pierden el type 'patch'). Root cause de "DIFF reconoce el
//   cambio pero el status queda en el original" tanto para el patch de TKT-202606-014 como para
//   CHECKPOINTs normales de avance de status. Rol propagado correctamente esta vez (parsed.rol) —
//   el bug que motivó la eliminación original (rol siempre '') no se reintroduce. Ver detalle en
//   el comentario junto a la llamada, más abajo.
// [PP] mod:52 · autor:Rune · 2026-06-30 UTC-6
// TKT-202606-011 (REQ-202606-003 · AC1/AC4): _ckptMeta.draftPending = parsed.draft === true —
//   showMergeDiffPanel (locus-backlog-merge.js) usa el flag para badge + botón deshabilitado en
//   vez de bloquear antes de abrir el panel. Con draftPending, sprint_proposal no se ofrece como
//   Step 0 — solo se activa cuando llega el CHECKPOINT final de Finn con draft:false.
//   Corrección de header: una sesión previa insertó un segundo header "mod:1" en primera línea,
//   sin detectar el header canónico ya existente aquí — eliminado, mod continúa desde 49.
// TKT-PARSER-2b (REQ-[pendiente-ID] · VALID_TRANSITIONS PRB/KE/CHG, counters, code.match,
//   eliminar isHotfix): PRB/KE/CHG agregados a VALID_TRANSITIONS con el mismo Set ITIL de INC
//   — antes caían en "tipo desconocido → ignorar silenciosamente". Counters del tracker y
//   pattern de code.match ampliados con PRB-/KE-/CHG-. Filtro isHotfix eliminado de
//   getActiveSprints — S-HOTFIX deprecado. Header migrado a formato canónico __BR-Execution §9
//   (era v0.8.0 · sprint:PP-S-10 · mod:48 — formato legacy) y reposicionado tras el bloque de
//   imports (estaba en primera línea, antes de los imports — inconsistente con §9 en ESM).

// T-202606-020 · AC-5 · TKT0c-gen2: tabla de transiciones válidas por tipo de ítem — BR-Core §4
// Clave: tipo de ítem Gen2 ('REQ' | 'TKT' | 'INC' | 'PRB' | 'CHG' | 'DISC'). Valor: Set de status permitidos.
// Sets exactos de __BR-Ecosystem §5 — no es 1:1 con los sets Gen1 que reemplaza:
// REQ amplía a en-proceso/orphaned (no existían en R). INC/PRB usan ciclo ITIL completo (no el de B).
// CHG es la excepción de vocabulario de la rama Reactiva (__BR-Ecosystem §4b) — declara status
// con el mismo vocabulario Scrum que TKT, nunca ITIL. Corregido en INC-202607-019 (ver abajo);
// este comentario asumía "INC/PRB/KE/CHG" como grupo homogéneo — no lo es.
// Nota: tipo desconocido → no validar (AC-6, ignorar silenciosamente).
// TKT-PARSER-2b (REQ-[pendiente-ID]): PRB agregado con el mismo Set ITIL que ya
// declaraba INC — antes caía en "tipo desconocido → ignorar silenciosamente" (AC-6 de arriba).
// Caso de error, no de uso normal: _buildItilItem (locus-session-parse.js) nunca deja pasar
// item.status en un ítem ITIL — esta detección solo se activa ante status Scrum residual.
// INC-202607-019 (fix): CHG estaba mapeado a _ITIL_STATUS_SET — invertía la regla de
// __BR-Ecosystem §4b (rechazaba pendiente/en-revision/done/descartado, aceptaba
// detected/resolved/closed). CHG usa ahora _CHG_STATUS_SET, vocabulario Scrum-compatible
// idéntico en valores al de TKT pero declarado en set propio — no comparte referencia con
// TKT.status para no acoplar accidentalmente ambos vocabularios a futuro.
// Hallazgo fuera de scope (resuelto en la misma sesión, INC-202607-019): entrada 'KE' retirada
// de este objeto — inalcanzable desde la fusión KE→PRB.root_cause_confirmed (infra_version 51,
// itemKind() ya no resuelve 'KE' desde _GEN2_TYPES, locus-backlog-core.js mod:131). Mismo
// patrón de limpieza ya aplicado en locus-backlog-item.js (mod:139-140). Sin cambio de
// comportamiento para INC/PRB/CHG reales.
const _ITIL_STATUS_SET = new Set(['detected', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated_to_prb', 'escalated_to_chg', 'descartado']);
const _CHG_STATUS_SET = new Set(['pendiente', 'en-revision', 'done', 'descartado']);
export const VALID_TRANSITIONS = {
  REQ: new Set(['pendiente', 'en-proceso', 'en-revision', 'bloqueado', 'orphaned', 'descartado']),
  TKT: new Set(['pendiente', 'en-revision', 'done', 'descartado']),
  INC: _ITIL_STATUS_SET,
  PRB: _ITIL_STATUS_SET,
  CHG: _CHG_STATUS_SET,
  DISC: new Set(['discovery', 'promoted', 'descartado'])
};

// T-202606-020 · AC-2 · AC-5 · AC-6
// Recibe el array de tgItems ya procesado por mergeBacklogFromTG (post-clasificación).
// Devuelve array de { code, type, status, reason } para ítems con transición inválida.
// Solo evalúa ítems con type conocido y status declarado — el resto se ignora silenciosamente (AC-6).
export function validateLifecycleTransitions(tgItems) {
  if (!tgItems || !tgItems.length) return [];
  const invalid = [];
  tgItems.forEach(item => {
    const type   = itemKind(item);
    const status = item.status;
    // AC-6: tipo desconocido → ignorar silenciosamente
    if (!type || !VALID_TRANSITIONS[type]) return;
    // Sin status declarado → no hay transición que validar
    if (!status) return;
    if (!VALID_TRANSITIONS[type].has(status)) {
      // Construir motivo legible para el panel DIFF (AC-3)
      let reason = '';
      if (type === 'DISC' && status === 'done') {
        reason = 'DISC no puede tener status done — solo promoted o descartado';
      } else if (type === 'REQ' && status === 'done') {
        reason = 'REQ no puede marcarse done directamente — requiere sesión de cierre de Finn';
      } else if (type === 'TKT' && status === 'bloqueado') {
        reason = 'TKT no puede tener status bloqueado — solo pendiente, en-revision, done o descartado';
      } else {
        reason = `${type} no puede tener status '${status}' según BR-Core §4`;
      }
      invalid.push({ code: item.code, type, status, reason });
    }
  });
  return invalid;
}

const _confirmTimers = {};            // timers de confirmación por worker ID

// T-202604-061: Changelog interno
const CHANGELOG_MAX = 50;

function _addChangelogEntry(parsed) {
  // estado formato: "YYYY-MM-DD HH:MM UTC-6 — descripción"
  // archivos formato: "AI-Tracker-vX.X.X.X.html, ..."
  const estadoMatch = parsed.estado.match(/^(\d{4}-\d{2}-\d{2}[^\—–-]*?)\s*[—–-]+\s*(.+)$/);
  const fecha = estadoMatch ? estadoMatch[1].trim() : parsed.estado.slice(0, 16);
  const desc  = estadoMatch ? estadoMatch[2].trim() : parsed.estado;

  // extraer versión del campo archivos
  const versionMatch = (parsed.archivos || '').match(/AI-Tracker-(v[\d.]+)\.html/i);
  const version = versionMatch ? versionMatch[1] : APP_VERSION;

  const entry = { version, fecha, desc, titulo: parsed.titulo || '', ts: Date.now() };

  let log = [];
  try { log = JSON.parse(localStorage.getItem(LOCUS_KEYS.CHANGELOG) || '[]'); } catch { log = []; }
  log.unshift(entry);
  if (log.length > CHANGELOG_MAX) log = log.slice(0, CHANGELOG_MAX);
  localStorage.setItem(LOCUS_KEYS.CHANGELOG, JSON.stringify(log));
}

export function openChangelog() {
  // R-202604-047: shell estático en index.html
  const overlay = document.getElementById('changelog-overlay');
  if (!overlay) return;
  const body = document.getElementById('changelog-body');
  if (body) body.innerHTML = _buildChangelogInner();
  overlay.classList.add('open');
  const closeBtn = overlay.querySelector('[data-close-changelog]');
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'), { once: true });
}

function _buildChangelogInner() {
  let log = [];
  try { log = JSON.parse(localStorage.getItem(LOCUS_KEYS.CHANGELOG) || '[]'); } catch { log = []; }

  const rows = log.length ? log.map(e => `
    <div class="chlog-entry">
      <div class="changelog-row-date">
        <span class="chlog-version">${esc(e.version)}</span>
      </div>
      <div class="changelog-row-body">
        ${e.titulo ? `<div class="chlog-title">${esc(e.titulo)}</div>` : ''}
        <div class="chlog-body">${esc(e.desc)}</div>
        <div class="chlog-date">${esc(e.fecha)}</div>
      </div>
    </div>`).join('')
  : `<div class="chlog-empty">Sin entradas aún — se registran al guardar sesiones con bloque CHECKPOINT.</div>`;

  return `
    <div class="modal-title">📋 Changelog</div>
    <div class="changelog-scroll">${rows}</div>
    <div class="modal-actions changelog-actions">
      <button data-close-changelog>Cerrar</button>
    </div>`;
}

// Alias legacy — por si hay referencias directas
function _buildChangelogHTML() {
  return `<div class="modal modal--changelog">${_buildChangelogInner()}</div>`;
}


// B-202605-517: stub legacy reemplazado — delegación a _generateBacklogContent (ai-tracker-sprint-project.js)
// La función anterior leía tracker.items (schema legacy, solo sesiones) en lugar de getItems() (backlog global),
// produciendo exports truncados con backlogs de 24+ ítems.
export function buildBacklogMd(version) {
  const { md } = _generateBacklogContent(version);
  return md;
}

// R-202604-022: muestra alerta de cuota de localStorage si supera umbrales
export function _checkStorageQuota() {

  const { usedKB, totalKB, pct } = _getLocalStorageUsage();
  if (pct >= 0.85) {
    showToast('error', `⚠ localStorage al ${Math.round(pct * 100)}% (${usedKB} KB / ${totalKB} KB) — limpia ítems o exporta datos`, null, 8000);
  } else if (pct >= 0.70) {
    showToast('warning', `⚠ localStorage al ${Math.round(pct * 100)}% (${usedKB} KB / ${totalKB} KB)`, null, 6000);
  }
}

export function saveSession(id) {
  // T-202606-032: guard isParseInFlight eliminado — AC-5.
  // saveSession solo se llama desde dentro de parsePaste (auto-trigger) o desde el botón manual
  // después de que parsePaste completó. El parámetro _retryCount ya no es necesario.
  // B-202605-054: getAI(id) puede devolver null si el worker fue eliminado entre el inicio
  // de la sesión y el guardado (ej: purge concurrente). Sin guard, ai._parsed explota.
  const ai = getAI(id);
  if (!ai) {
    showToast('error', '⚠ No se encontró el worker — recarga la página');
    return;
  }
  const parsed = ai._parsed || {};
  // CAEL-22: #ingest-ta es único y global desde CAEL-07/08 — ya no hay textarea por id.
  const ta = document.getElementById('ingest-ta');
  const raw = ta ? ta.value.trim() : '';
  // B-202604-NNN: evitar que marcas de bloque (---CHECKPOINT---, ```) queden como título
  const _rawFallbackLine = raw.split('\n').find(l => { const t = l.trim(); return t && !t.startsWith('---') && !t.startsWith('```'); }) || '';
  const title = parsed.title || _rawFallbackLine.slice(0, 80) || '';
  if (!title) {
    showToast('warning', '⚠ El textarea está vacío — pega el resumen de la sesión');
    const ta2 = document.getElementById('ingest-ta');
    if (ta2) { ta2.focus(); ta2.style.setProperty('--input-border-flash', 'var(--red)'); ta2.classList.add('input-border-error'); setTimeout(() => { ta2.classList.remove('input-border-error'); }, 2000); }
    return;
  }

  // B-202606-037: horaRaw se lee dentro del callback del DIFF — no aquí.
  // El input hora-[id] del card fue reemplazado por mdiff-duration-input en el DIFF.

  // Proyecto: leer del selector del card, con fallback al activo global
  const projSelectEl = document.getElementById('sess-proj-' + id);
  const selectedProjId = projSelectEl ? projSelectEl.value : '';
  const activeProj = (selectedProjId ? (state.projects || []).find(p => p.id === selectedProjId) : null)
    || getActiveProject();
  // R-202605-095: sin proyecto → no abortar con toast. El panel de ítems comunica el problema inline.
  // Si no hay ítems que mostrar en el panel, aún así abrir el panel con solo el banner.
  const _needsProject = !activeProj;
  if (_needsProject) {
    // Marcar el selector con error visual (sin toast)
    if (projSelectEl) { projSelectEl.classList.add('input-outline-error'); setTimeout(() => { projSelectEl.classList.remove('input-outline-error'); }, 2000); }
    // Abrir el panel con banner bloqueante — el usuario debe seleccionar proyecto desde el card
    // B-202606-037: horaResult aún no disponible en este gate — se resuelve en el DIFF
    _showProjRequiredInPanel(id, parsed, null);
    return;
  }

  // P-202604-115: validar campo Proyecto del CHECKPOINT vs proyecto del card
  // Solo aplica a CHECKPOINTs (no a sesiones manuales sin bloque)
  if (parsed.isCheckpoint) {
    const _ckptProj = (parsed.ckptProyecto || '').trim();
    const _cardProjName = (activeProj.name || '').trim();
    const _projMatch = _ckptProj && _cardProjName === _ckptProj;
    const _projMismatch = _ckptProj && !_projMatch;
    const _projMissing = !_ckptProj;

    if (_projMismatch || _projMissing) {
      // Aviso no ignorable — requiere acción explícita: Continuar o Cancelar
      const _msg = _projMissing
        ? `El CHECKPOINT no tiene campo <strong>Proyecto:</strong>.<br>Se guardará en <strong>${esc(_cardProjName)}</strong>.`
        : `El CHECKPOINT declara <strong>${esc(_ckptProj)}</strong> pero el card tiene seleccionado <strong>${esc(_cardProjName)}</strong>.`;
      _showProjMismatchModal({
        msg: _msg,
        // B-202606-037: horaResult aún no disponible — se resuelve en el DIFF
        onContinue: () => _doSaveSession(id, ai, parsed, activeProj, null)
      });
      return;
    }
  }

  // B-202606-037: horaResult ya no se pasa desde aquí — se resuelve dentro del DIFF
  _doSaveSession(id, ai, parsed, activeProj, null);
}

// P-202604-115: modal Continuar/Cancelar para discrepancia de proyecto
function _showProjMismatchModal({ msg, onContinue }) {
  // R-202604-047: shell estático en index.html
  const overlay = document.getElementById('proj-mismatch-overlay');
  if (!overlay) return;
  const msgEl = document.getElementById('proj-mismatch-msg');
  if (msgEl) msgEl.innerHTML = msg;
  overlay.classList.add('open');
  // Reemplazar botón para limpiar handlers acumulados
  const btn = document.getElementById('proj-mismatch-continue');
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      onContinue();
    });
  }
}

// T-202605-120: construye una versión enriquecida de tgItems para visualización en el panel diff.
// Para cada patchItem, busca el ítem real en getItems() global y genera un objeto con los campos
// del patch aplicados encima — permite que el panel muestre qué ítems serán actualizados
// sin aplicar los cambios reales (eso ocurre en el callback vía applyPatchesFromTG).
// [tmp:tkt7-session-save-preview]: getAnyItem — un patch sobre un INC existente se omitía
// silenciosamente del preview (el patch real sí se aplicaba bien vía applyPatchesFromTG).
function _buildPatchTgItems(patchItems, existingTgItems) {
  if (!patchItems || !patchItems.length) return existingTgItems || [];
  const base = (existingTgItems || []).slice();
  if (typeof getItems() === 'undefined' || !Array.isArray(getItems())) return base;
  const existingCodes = new Set(base.map(x => x.code));
  patchItems.forEach(patch => {
    if (!patch.code || /^\[/.test(patch.code)) return; // ignorar placeholders
    if (existingCodes.has(patch.code)) return; // ya está en tgItems — no duplicar
    const real = getAnyItem(patch.code);
    if (!real) return;
    // Construir representación visual: ítem real con campos del patch aplicados
    const synthetic = Object.assign({}, real);
    Object.keys(patch).forEach(k => { if (k !== 'type' && k !== 'code') synthetic[k] = patch[k]; });
    base.push(synthetic);
  });
  return base;
}

// B-202604-116: merge de backlog apuntando al proyecto del card, no al filtro global activo.
// Sobrescribe temporalmente current-project-filter + recarga getItems() del proyecto destino,
// ejecuta el merge, y restaura el estado anterior (filtro + getItems() del proyecto original).
// _setActiveProjectFilter no se usa porque tiene side-effects de UI.
// FIX (sesión 2026-07-24, gate req-sin-tkt vs reparenting): parámetro patchItems (opcional)
// agregado — se propaga a mergeBacklogFromTG como opts.patchItems. Ver comentario completo
// en mergeBacklogFromTG (locus-backlog-item.js) y en _applyCheckpointBatch (este archivo).
// INC-202607-032 (cerrado — triggered_by INC-202607-031, ver DISC-202607-036): parámetro
// ckptRol (opcional, default '') se propaga a mergeBacklogFromTG como opts.ckptRol. Flujo
// single (más abajo en este archivo): wireado con parsed.rol. Flujo batch
// (_applyCheckpointBatch, este archivo): NO wireado — decisión final, no gap pendiente.
// Motivo: el guard REQ→bloqueado de mergeBacklogFromTG (locus-backlog-item.js L2608) opera
// exclusivamente sobre `tgItems` — pero type:'patch' nunca llega a tgItems, se enruta siempre
// a patchItems (locus-session-parse.js, tanto en flujo single como batch). La única vía real
// de un type:'patch' REQ→bloqueado es applyPatchesFromTG, que ya resuelve el rol correctamente
// en ambos flujos (ckptHeaderRole single / roleByIdx batch, INC-202607-031+037). El guard de
// mergeBacklogFromTG solo protegería contra reemisión completa de un ítem existente cambiando
// su status en vez de usar type:patch — patrón ya prohibido por BR-Ecosystem §8 (Regla dura de
// uso obligatorio). Wirear ckptRol aquí agregaría superficie para cerrar un riesgo inalcanzable
// en el flujo compliant — no se hace por default de resolución de raíz sin justificación real.
export async function _mergeBacklogWithProject(tgItems, sessId, projId, patchItems, ckptRol) {
  if (!tgItems || !tgItems.length) return { created:[], updated:[], ignored:[], advanced:[], retroceso:[], discarded:[], slugMap: new Map(), refIdTitleMap: new Map() }; // TKT2 (REQ-[pendiente-ID] · CAEL-05): slugMap/refIdTitleMap agregados al guard — sin esto, un batch de solo patches (tgItems vacío) nunca obtenía estos mapas para resolver code de sus propios patches
  const _prevFilter = localStorage.getItem('current-project-filter') || '';
  const _filterChanged = projId && projId !== _prevFilter;
  if (_filterChanged) {
    // Apuntar al proyecto del card y recargar getItems() correspondientes
    localStorage.setItem('current-project-filter', projId);
    loadBacklog();
  }
  let result;
  try {
    result = await mergeBacklogFromTG(tgItems, sessId, { patchItems: patchItems || [], ckptRol: ckptRol || '' });
  } finally {
    if (_filterChanged) {
      // Restaurar filtro original y recargar getItems() del proyecto original
      if (_prevFilter) localStorage.setItem('current-project-filter', _prevFilter);
      else localStorage.removeItem('current-project-filter');
      loadBacklog();
    }
  }
  return result; // B-202606-022: result ya incluye slugMap desde mergeBacklogFromTG
}

// TKT4 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs con resolución de [tmp:slug]
//   cross-CHECKPOINT, depends_on: TKT3 done): _applyCheckpointBatch — ahora solo persiste.
//   Recibe tgItems ya combinados y resueltos por _resolveCheckpointBatch (locus-session-parse.js),
//   que corrió el gate de duplicados [tmp:slug] antes de que showMergeDiffPanel se abriera.
//   Reemplaza la versión de TKT2 que resolvía (parseaba bloques + gate de duplicados) Y
//   persistía en el mismo loop — separación exigida por decisión de arquitectura del founder:
//   el batch debe pasar por el diff panel de confirmación antes de que nada persista, igual
//   que el flujo single-CHECKPOINT.
// Invariants:
//   - No repite la validación de duplicados de [tmp:slug] — esa gate ya corrió en
//     _resolveCheckpointBatch antes de que tgItems llegara aquí.
//   - Un único mergeBacklogFromTG → saveBacklog() atómico para todo el batch combinado, no
//     uno por bloque (a diferencia de TKT2, que mergeaba secuencialmente bloque por bloque).
//   - tgItems vacío → no-op, sin llamar a mergeBacklogFromTG ni a saveBacklog() — retorna undefined.
// sideEffects:
//   - Persiste a backlog vía saveBacklog() (dentro de _mergeBacklogWithProject) — mismo side
//     effect que _doApply del flujo single, ahora con el array combinado del batch.
// TKT2 (REQ-[pendiente-ID] · CAEL-05): agregado `return` del resultado de _mergeBacklogWithProject
// — antes no retornaba nada. Cambio aditivo: ningún caller existente leía el valor de retorno
// (era efectivamente void), así que no hay regresión sobre comportamiento previo. El caller de
// locus-session-parse.js (_gatedDoApplyBatch) ahora lo necesita para acceder a slugMap/refIdTitleMap
// y aplicar patchItems del batch después del merge — mismo patrón que _doApply del flujo single.
// TKT2 (REQ-[pendiente-ID] · CAEL-05): agregado `return` del resultado de _mergeBacklogWithProject
// — antes no retornaba nada. Cambio aditivo: ningún caller existente leía el valor de retorno
// (era efectivamente void), así que no hay regresión sobre comportamiento previo. El caller de
// locus-session-parse.js (_gatedDoApplyBatch) ahora lo necesita para acceder a slugMap/refIdTitleMap
// y aplicar patchItems del batch después del merge — mismo patrón que _doApply del flujo single.
// TKT2: guard de tgItems vacío removido del early-return — un batch de SOLO patches (tgItems
// vacío, patchItems con contenido) debe poder llegar a _mergeBacklogWithProject para obtener
// slugMap/refIdTitleMap (aunque sean mapas vacíos, ver guard actualizado de esa función) y así
// permitir que el caller aplique los patches. _mergeBacklogWithProject ya es no-op seguro con
// tgItems vacío (no llama mergeBacklogFromTG real ni saveBacklog) — delegar ahí no reintroduce
// el side effect que este guard prevenía originalmente.
// FIX (sesión 2026-07-24, gate req-sin-tkt vs reparenting): parámetro patchItems agregado —
// opcional, default [] — para propagar los type:'patch' del mismo batch hasta
// mergeBacklogFromTG. Sin esto, un batch con un REQ nuevo + patches de reparenting hacia ese
// REQ (sin TKT nuevo en el batch) caía siempre en 'req-sin-tkt' — ver comentario completo en
// mergeBacklogFromTG (locus-backlog-item.js). Caller: _onApplyBatch en locus-session-parse.js,
// que ya tiene patchItems en scope desde _resolveCheckpointBatch.
export async function _applyCheckpointBatch(tgItems, patchItems) {
  const activeProj = getActiveProject();
  if (!activeProj) {
    showToast('warning', '⚠ Selecciona un proyecto antes de aplicar');
    return undefined;
  }
  const syntheticSessId = 'standalone-batch-' + Date.now();
  // DISC-202607-036 (triggered_by INC-202607-032, cerrado): 5º parámetro ckptRol de
  // _mergeBacklogWithProject omitido intencionalmente aquí — no es un gap. Ver comentario
  // completo en el header de _mergeBacklogWithProject, arriba en este mismo archivo.
  return await _mergeBacklogWithProject(tgItems, syntheticSessId, activeProj.id, patchItems);
}

// T-202606-070: parsea el campo archivos del CHECKPOINT al formato de array estructurado.
// Entrada: string con segmentos separados por ' | ', cada segmento con formato
//   "nombre · mod:N · autor:Nombre" o solo "nombre" (sin mod/autor).
// Segmentos sin mod: o sin autor: se omiten. Segmentos sin separadores → campo ausente → [].
// Retorna array de { nombre, mod, autor }.
function _parseFilesField(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const result = [];
  const segments = raw.split(/\s*\|\s*/);
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    const modM   = trimmed.match(/mod\s*:\s*(\d+)/i);
    const autorM = trimmed.match(/autor\s*:\s*([^·|]+)/i);
    // AC-7/AC-8: segmento sin mod: o sin autor: → omitir
    if (!modM || !autorM) continue;
    // Extraer nombre: todo antes del primer ' · '
    const nombreM = trimmed.match(/^([^·]+)/);
    const nombre = nombreM ? nombreM[1].trim() : trimmed;
    result.push({ nombre, mod: parseInt(modM[1]), autor: autorM[1].trim() });
  }
  return result;
}

// R-202604-017 + P-202604-115: lógica central de guardado extraída para reutilización
export function _doSaveSession(id, ai, parsed, activeProj, horaResult) {
  // CAEL-22: #ingest-ta es único y global — no hay textarea por id.
  const ta = document.getElementById('ingest-ta');
  const raw = ta ? ta.value.trim() : '';
  // B-202604-NNN: evitar que marcas de bloque (---CHECKPOINT---, ```) queden como título
  const _rawFallbackLine = raw.split('\n').find(l => { const t = l.trim(); return t && !t.startsWith('---') && !t.startsWith('```'); }) || '';
  const title = parsed.title || _rawFallbackLine.slice(0, 80) || '';
  const tgRefsRaw = parsed.tgItems || [];
  const trackerRefs = tgRefsRaw.map(x => x.code).filter(Boolean);
  const now = new Date();
  const dateShort = now.toLocaleDateString('es-MX', {day:'2-digit', month:'short'});
  const dateFull = now.toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'}) + ' ' +
                   now.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

  const tgItems = parsed.tgItems || [];

  // R-202605-049: sessionGroupId — hereda del checkpoint activo del worker o genera nuevo
  const _allSessForGroup = (activeProj.sessions || []).filter(s => s.aiId === ai.id && !s.resetAt);
  const _lastSessForGroup = _allSessForGroup.length ? _allSessForGroup[_allSessForGroup.length - 1] : null;
  const _sessionGroupId = (_lastSessForGroup && _lastSessForGroup.sessionGroupId)
    ? _lastSessForGroup.sessionGroupId
    : 'sg-' + Date.now();

  // v3.0.0: sesión va al proyecto activo con aiId
  // R-202604-017 AC-3: ckptProyecto registrado en sesión para trazabilidad en log
  const newSess = {
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
    aiId: ai.id,
    title, summary: parsed.summary || '', files: parsed.files || '',
    pending: parsed.pending || '', tags: [],
    nextStep: parsed.nextStep || '',
    trackerRefs,
    ckptProyecto: parsed.ckptProyecto || '',
    // R-202604-039: campos de memoria narrativa
    decision:    parsed.decision    || '',
    contexto:    parsed.contexto    || '',
    bloqueantes: parsed.bloqueantes || '',
    aprendizaje: parsed.aprendizaje || '',
    // T-202606-016: campos informativos adicionales del CHECKPOINT
    duration:         parsed.duration         || '',
    docsVerified:     parsed.docsVerified      || '',
    tensionsResolved: parsed.tensionsResolved  || '',
    // T-202606-018: finn_observations — almacenadas en sesión como campo informativo
    finnObservations: parsed.finnObservations  || null,
    // T-202606-070: rol y archivos del CHECKPOINT persistidos en sesión
    rol:      parsed.rol      || '',
    archivos: _parseFilesField(parsed.archivos || ''),
    // T-202606-030: sprint activo del proyecto al momento de guardar — único sprint con status
    // 'active' por invariante T-202606-023 AC-4 (sprints.filter(active).length ≤ 1)
    // TKT-PARSER-2b (REQ-[pendiente-ID]): filtro isHotfix eliminado — S-HOTFIX deprecado.
    sprintId: (getActiveSprints().find(sp => sp.status === 'active') || {}).id || '',
    // T-202606-013: señal de doc_updates para badge en mini-historial (_renderRow)
    hasDocUpdates: Array.isArray(parsed.docUpdates) && parsed.docUpdates.length > 0,
    // T-202606-072: señal de devolución Finn→Cael — presente solo cuando parsed.devolucion_cael está definido
    ...(parsed.devolucion_cael !== undefined ? { devolucion_cael: parsed.devolucion_cael } : {}),
    resetAt: '',  // B-202606-037: se completa en el callback del DIFF tras leer mdiff-duration-input
    // R-202605-049: sessionGroupId — agrupa checkpoints bajo sesión como contenedor
    sessionGroupId: _sessionGroupId,
    // T-202605-446: tiempo cronometrado de la sesión en ms
    // B-202606-037: stopSessionTimer se llama aquí para capturar elapsed antes de que el usuario
    // interactúe con el DIFF. durationMs se recalcula en el callback si hay horaResult.
    durationMs: stopSessionTimer(id),
    dateShort, date: dateFull
  };
  // B-202605-004: newSess NO se persiste aquí. El push de sessions[] y el populate de
  // tracker.items ocurren en _doApplyMergeAndFinish, después de confirmación del panel.
  // Si el usuario cancela, ni sessions[] ni tracker.items quedan con entradas huérfanas.
  const sessId = newSess.id;

  // T-098: merge del TRACKER-GLOBAL al Backlog en memoria (acumulable)
  // T-202604-121: recoger resultado detallado para super toast
  // B-202604-116: usar proyecto del card, no filtro global activo
  // T-202604-201: panel de confirmación diff antes de aplicar el merge
  // T-202606-037 AC-3: extraer campos narrativos del CHECKPOINT parseado para pasarlos como ckptMeta.
  // B-202606-037: el callback recibe horaRaw desde mdiff-duration-input, interpreta horaResult,
  // completa newSess.resetAt y recalcula durationMs como horaResult.epoch - (Date.now() - newSess.durationMs).
  const _ckptMeta = {
    resumen:     parsed.summary    || '',
    // TKT-[pendiente-ID] (REQ-[pendiente-ID] · AC-1): rol del CHECKPOINT — antes ausente de este
    // objeto. newSess.rol (línea ~403) sí lo capturaba, pero _ckptMeta (el objeto que llega a
    // showMergeDiffPanel → mergeBacklogFromTG/applyPatchesFromTG) nunca lo incluía, por lo que
    // _ckptMeta.rol||'' resolvía siempre a '' downstream — los guards de rol para
    // REQ→bloqueado (locus-backlog-item.js) y REQ→done (locus-backlog-item.js, applyPatchesFromTG)
    // rechazaban toda transición sin importar el rol real declarado. T-202606-028 ya había
    // propagado el campo en el call site (locus-backlog-merge.js) asumiendo que existía aquí —
    // fix incompleto, corregido en la fuente.
    rol:         parsed.rol        || '',
    aprendizaje: parsed.aprendizaje || '',
    bloqueantes: parsed.bloqueantes || '',
    decision:    parsed.decision    || '',
    proximoPaso: parsed.nextStep    || '',
    // TKT-202607-172 (REQ-202607-058 · AC4-6, gap cerrado — hallazgo de Finn en Momento 1):
    //   nextStep/nextRole no existían en este objeto — _singleMeta.nextStep/.nextRole en
    //   locus-backlog-merge.js (const _metaSiguiente) siempre resolvían a undefined para el
    //   flujo single, cayendo directo a proximoPaso pese a que _extractCkptMeta ya calculaba
    //   ambos campos correctamente desde TKT-202607-172. parsed.nextStepMeta/.nextRoleMeta
    //   (locus-session-parse.js, mismo TKT) son la fuente — no colisionan con parsed.nextStep
    //   (arriba, alias legacy de proximoPaso, sin cambio).
    nextStep:    parsed.nextStepMeta || '',
    nextRole:    parsed.nextRoleMeta || '',
    // TKT-202606-011 AC1: pendiente de aval Finn — el DIFF renderiza el badge y deshabilita
    // el botón de confirmar (ver locus-backlog-merge.js) en vez de bloquear antes de llegar aquí.
    draftPending: parsed.draft === true,
    // TKT-202606-014: valor crudo de draft (undefined/true/false) — gate de "draft ausente"
    // en showMergeDiffPanel necesita distinguir undefined de false, draftPending ya colapsa eso.
    draftRaw: parsed.draftRaw,
    // TKT2 (REQ CAEL-0717-01 · AC1-4, parte 3/3 — cierra la propagación iniciada en
    //   locus-session-parse.js mod:124 y consumida en locus-backlog-merge.js mod:53):
    //   finn_release del CHECKPOINT parseado, propagado hasta ai._parsed.finnRelease por
    //   parseCheckpoint(). null si el CHECKPOINT no lo declara — AC3, sin tarjeta, sin hueco.
    finnRelease: parsed.finnRelease || null,
    // B-202606-037 AC-3: resetTime del worker para pre-llenar mdiff-duration-input en el DIFF.
    // Formato "HH:MM" — el DIFF stripea el separador antes de asignarlo al input.
    // Widget card: si el founder escribió hora en bexhaust-hora-{id} antes de pegar el CHECKPOINT,
    // preferirla sobre ai.resetTime — interpretHora valida antes de usar.
    resetTime: (() => {
      const _cardHoraEl = document.getElementById('bexhaust-hora-' + id);
      const _cardRaw = _cardHoraEl ? _cardHoraEl.value.replace(/\D/g, '') : '';
      const _cardResult = _cardRaw ? interpretHora(_cardRaw) : null;
      return _cardResult ? _cardResult.hhmm : (ai.resetTime || '');
    })(),
  };
  const _patchItemsN = parsed.patchItems || [];
  const _tgItemsForPanel = _buildPatchTgItems(_patchItemsN, tgItems);
  // T-202606-155: si el CHECKPOINT tiene ---SPRINT-PROPOSAL--- válido, pasarlo a showMergeDiffPanel
  // como ckptMeta.sprintProposal para que Step 0 sea el gate de creación del sprint.
  // El sprint NO se crea aquí — se crea solo al aprobar Step 0 en el DIFF.
  // T-202606-017 AC-2: path JSON puro — leer sprint_proposal del objeto parsed (fuente primaria).
  // En el path JSON, raw no contiene '---SPRINT-PROPOSAL---' — la detección por raw falla silenciosamente.
  // Fallback al path Markdown legacy: parseSprintProposal(raw) cuando parsed.sprintProposal no existe.
  const _spProposal = parsed.sprintProposal  // path JSON puro (T-202606-017)
    || ((raw && raw.includes('---SPRINT-PROPOSAL---')) ? parseSprintProposal(raw) : null);
  const _validSpProposal = (_spProposal && !_spProposal.error) ? _spProposal : null;
  // TKT (REQ-[pendiente-ID] · ref: consolidación de punto de entrada único de sprint_proposal):
  // persistencia paralela vía setPendingSprintProposal (TKT1 mod:62) revertida — decisión del
  // founder: pegar un CHECKPOINT en la card del worker ya no alimenta el panel "+ Sprint nuevo"
  // de Tab Sprint. La única ruta de creación de sprint es el paste propio de ese panel
  // (locus-sprint.js). _ckptMeta.sprintProposal se conserva sin cambio — sigue siendo la fuente
  // del gate de exclusividad §12 en showMergeDiffPanel (sprint_proposal no puede convivir con
  // ítems REQ/TKT en el mismo CHECKPOINT); ese gate ya lo enforce parseCheckpoint aguas arriba
  // (_jsonParseError) independientemente de este bloque.
  // TKT-202606-011 AC4: con draftPending, sprint_proposal tampoco se aplica — no se ofrece
  // Step 0 de aprobación. El CHECKPOINT final emitido por Finn (draft:false) sí lo activa.
  // TKT3 (REQ-[pendiente-ID] · migración Step 0 → panel Sprint subtab): _ckptMeta.sprintProposal
  // se mantiene — sigue siendo la fuente del gate de exclusividad §12 en showMergeDiffPanel.
  // onApproveProposal se retira: sin consumidores tras el retiro de Step 0 en locus-backlog-merge.js
  // (mod:50) — la aprobación ahora vive en locus-sprint.js vía _tryIngestSprintProposalFromParsed
  // directo (TKT2, ya importado en ese módulo).
  if (_validSpProposal && !_ckptMeta.draftPending) {
    _ckptMeta.sprintProposal = _validSpProposal;
  }
  // T-202606-021: Trigger 3 — sugerencia 1-tap de sprint para INC con triggered_by en sprint activo.
  // No-bloqueante: si el founder ignora, el INC se ingesta sin sprint (Q-Backlog, default).
  const _tgSuggestion = _buildTriggeredBySuggestion(_tgItemsForPanel);
  if (_tgSuggestion) {
    _ckptMeta.triggeredBySuggestion = {
      ..._tgSuggestion,
      onAccept: function() {
        _tgSuggestion.b.sprint = _tgSuggestion.suggestedSprint;
      },
    };
  }
  // Todo CHECKPOINT válido pasa por el DIFF — sin excepción.
  // B-202605-NNN: cancelar timer Supabase de draft antes de abrir el panel diff.
  // Si el usuario tarda >3s en confirmar, el timer se dispara y hace upsert del draft.
  // Ese upsert puede llegar por realtime DESPUÉS del delete post-confirm → restoreDrafts restaura el textarea.
  clearTimeout(window['_draftSbTimer_' + id]);
  // TKT2 (REQ CAEL-01): fase 2 ("Revisar") se marca aquí — el momento real en que el DIFF
  // se abre y el founder empieza a revisar. Antes se marcaba al validar el pegado (ver
  // locus-session-parse.js). Edge case (revertir si se cierra sin confirmar) resuelto vía
  // onClose (L692) — comentario previo quedó desactualizado tras esa entrega, corregido aquí.
  _setPhase(id, 2);
  // TKT3 (REQ-202607-046, depends_on TKT-202607-145): mecanismo de acoplamiento por CSS
  // retirado — showMergeDiffPanel (locus-backlog-merge.js, TKT2) abre #modal-split-shell
  // directamente, sin necesitar que este caller coordine el overlay de diff contra el de
  // ingesta primero. La clase CSS que aplicaba ese acoplamiento ya no existe (retirada por
  // Nova en TKT1) ni tiene consumidores JS. Guard de proyecto activo (línea ~358, _needsProject
  // → _showProjRequiredInPanel) sin cambio — este bloque solo eliminaba ese código de
  // coordinación, no tocó la condición de gate.
  showMergeDiffPanel(_tgItemsForPanel, sessId, activeProj.id, (horaRaw) => {
    // B-202606-037: leer horaRaw desde el input del DIFF (mdiff-duration-input).
    // interpretHora convierte HHMM → { label, hhmm, epoch }. Si vacío → null → worker disponible.
    const horaResult = interpretHora((horaRaw || '').replace(/\D/g, ''));
    if (horaResult) {
      newSess.resetAt = horaResult.label;
      // Recalcular durationMs: desde inicio de sesión (epoch estimado) hasta hora de desbloqueo.
      // startEpoch estimado = Date.now() - elapsed acumulado (stopSessionTimer ya lo detuvo).
      const _estimatedStartEpoch = Date.now() - (newSess.durationMs || 0);
      const _calcDuration = horaResult.epoch - _estimatedStartEpoch;
      if (_calcDuration > 0) newSess.durationMs = _calcDuration;
    }
    _doApplyMergeAndFinish(id, ai, parsed, activeProj, horaResult, sessId, tgItems, newSess);
  }, _ckptMeta, () => _setPhase(id, 1)); // TKT2 (REQ CAEL-01): onClose — revierte 'Revisar' si cierra sin confirmar
}

// T-202604-201: segunda mitad de _doSaveSession — ejecutada tras confirmación del panel de diff
async function _doApplyMergeAndFinish(id, ai, parsed, activeProj, horaResult, sessId, tgItems, newSess) {
  // B-202605-004: push atómico — la sesión entra en activeProj.sessions solo aquí,
  // después de que el usuario confirmó el panel MergeDiff (o en el fallback directo).
  // Garantiza que cancelar el panel no deja sesiones huérfanas en el array.
  if (!activeProj.sessions) activeProj.sessions = [];
  // TKT1 · REQ-sessions-mutator AC-1: _mutateSessions() reemplaza el push directo — agrega
  // la sesión y la marca dirty en un solo paso, sin lo cual _saveSessions() no la subiría.
  if (newSess && !activeProj.sessions.find(s => s.id === newSess.id)) {
    _mutateSessions(activeProj, 'add', newSess);
  }

  // v3.0.0: tracker del proyecto activo — también aquí para atomicidad con sessions[].
  // Sin esto, tracker.items quedaría con sessionId huérfano si el usuario cancela el panel.
  // TKT-PARSER-2b (REQ-[pendiente-ID]): PRB/CHG agregados a counters — antes solo DISC/TKT/REQ/INC.
  // Hallazgo fuera de scope (resuelto en la misma sesión, INC-202607-019): 'KE' retirado del
  // objeto inicial — inalcanzable, mismo motivo que en VALID_TRANSITIONS más arriba.
  if (!activeProj.tracker) activeProj.tracker = { items: [], counters: { DISC: 0, TKT: 0, REQ: 0, INC: 0, PRB: 0, CHG: 0 } };
  const tracker = activeProj.tracker;
  let newCount = 0, updCount = 0;
  tgItems.forEach(item => {
    const existing = tracker.items.find(x => x.code === item.code);
    if (existing) {
      existing.desc = item.desc; existing.status = item.status; existing.sessionId = sessId;
      updCount++;
    } else {
      const c = tracker.counters;
      // TKT-PARSER-2b: pattern ampliado con PRB-/CHG- — antes solo DISC/TKT/REQ/INC.
      // 'KE-' retirado del patrón (mismo hallazgo fuera de scope de arriba) — ningún código
      // real con ese prefijo puede existir desde la fusión KE→PRB.root_cause_confirmed.
      const numMatch = item.code.match(/^(DISC|TKT|REQ|INC|PRB|CHG)-\d{6}-(\d{3})/);
      if (numMatch) { const num = parseInt(numMatch[2]); const key = numMatch[1]; if (num >= (c[key] || 0)) c[key] = num; }
      tracker.items.push({id:'tgi-'+Date.now()+'-'+Math.random().toString(36).slice(2,6), code:item.code, desc:item.desc, status:item.status, sessionId:sessId});
      newCount++;
    }
  });

  const raw = (document.getElementById('ingest-ta') || {}).value || ''; // CAEL-22
  // INC-202607-001 fix: guard de bloqueo total sobre draft:true eliminado — ver header del
  // archivo (mod:63). draft:true ya no impide la persistencia; solo mantiene el ítem invisible
  // en vistas activas (Q-Backlog, sprint, Kanban) hasta que Finn emita type:patch con
  // draft:false, comportamiento que vive en mergeBacklogFromTG/Locus, no en este guard.
  // TKT-202607-077 AC2: await obligatorio — _mergeBacklogWithProject() es async (encadena
  // el await de mergeBacklogFromTG). Si rechaza, no ejecutar ningún paso posterior que
  // dependa de mergeResult (applyPatchesFromTG, trackerRefs, CONTEXT-SECTION, y el resto
  // del cierre de sesión). La sesión ya fue empujada a activeProj.sessions arriba — orden
  // preexistente, sin cambio en este TKT — queda registrada pero sin ítems de backlog aplicados.
  let mergeResult;
  try {
    // FIX (sesión 2026-07-24, gate req-sin-tkt vs reparenting): parsed.patchItems propagado —
    // ya estaba en scope pero no se pasaba hasta el gate de mergeBacklogFromTG. Ver comentario
    // completo en mergeBacklogFromTG (locus-backlog-item.js). Este es el path exacto del caso
    // reportado: REQ draft:true con ref_id + 3 type:patch de reparenting en el mismo CHECKPOINT.
    mergeResult = await _mergeBacklogWithProject(tgItems, sessId, activeProj.id, parsed.patchItems, parsed.rol || '');
  } catch (err) {
    showToast('error', '⚠ Error al aplicar backlog — reintentar guardado');
    return;
  }
  // INC-[pendiente-ID] (triggered_by TKT-202606-014 · fix): applyPatchesFromTG(parsed.patchItems, ...)
  // restaurado. Se había eliminado como "redundante" con la llamada de locus-backlog-merge.js
  // (_mdiffDoApply, post-onApply) — pero esa llamada nunca fue equivalente: opera sobre
  // tgItems.filter(i => i.type === 'patch'), y tgItems ahí es _tgItemsForPanel, construido por
  // _buildPatchTgItems (línea ~289 de este archivo). Esa función convierte cada patch sobre un
  // ítem EXISTENTE en una representación sintética que preserva el `type` real del ítem (ej. 'TKT')
  // — no 'patch' — para que el DIFF calcule el diff de campos vía mergeBacklogFromTG en dry-run.
  // Efecto: el filtro por type==='patch' en locus-backlog-merge.js siempre da array vacío para
  // patches sobre ítems existentes → applyPatchesFromTG nunca se invocaba ahí. El DIFF mostraba
  // el cambio correctamente (dry-run sobre la representación sintética) pero nada se persistía —
  // exactamente el síntoma reportado: "DIFF lo reconoce, status queda en el original".
  // Esta llamada SÍ usa parsed.patchItems (items crudos, type:'patch' intacto) — mismo patrón ya
  // correcto en el path standalone (locus-session-parse.js:1999, _doApply). El bug original que
  // motivó la eliminación (rol nunca propagado, siempre '') se corrige aquí pasando parsed.rol.
  if (parsed.patchItems && parsed.patchItems.length) {
    applyPatchesFromTG(parsed.patchItems, sessId, { ckptHeaderRole: parsed.rol || '', slugMap: mergeResult.slugMap, refIdTitleMap: mergeResult.refIdTitleMap }); // TKT1 (REQ-[pendiente-ID] · CAEL-04): refIdTitleMap agregado
  }

  // B-202604-XXX: actualizar trackerRefs con códigos reales post-_assignPendingIds
  // _mergeBacklogWithProject resuelve [pendiente-ID] → código real en tgItems
  // newSess.trackerRefs fue construido antes de esa resolución — se sincroniza aquí
  if (newSess && tgItems.length) {
    newSess.trackerRefs = tgItems.map(x => x.code).filter(c => c && /^[PTRB]-\d{6}-\d{3}/.test(c));
  }

  // T-202604-108: merge de secciones CONTEXT-SECTION si las hay en el paste
  const contextSections = extractContextSections(raw);
  const mergedCtxNames = [];
  if (contextSections.length) {
    contextSections.forEach(s => mergedCtxNames.push(s.header.replace(/^##\s*/, '')));
    mergeContextSections(contextSections, activeProj.id);
  }

  // merge de secciones MAP-SECTION si las hay en el paste
  const mapSections = extractHtmlMapSections(raw);
  if (mapSections.length) mergeHtmlMapSections(mapSections, activeProj.id);

  // INC-202607-XXX: bloque de ingesta ---PLAN---/---EXECUTION-PLAN--- y parsed.executionPlan
  // eliminado — REQ-execution-plan-deprecation (locus-session-parse.js mod:95) retiró
  // _tryIngestPlan/_tryIngestPlanFromParsed/parsePlanBlock del origen; execution_plan no está
  // en el schema de __BR-Ecosystem §8. Código huérfano, sin AC vigente que lo respalde.

  // T-202606-017 AC-1: path Markdown — extraer y registrar DOC-UPDATEs del texto crudo.
  // Complementa el path JSON (AC-2). Se ejecuta solo si raw contiene el bloque.
  // No bloquea el resto del flujo (AC-5).
  // T-202606-073 AC-1: integración de ingesta de DOC-UPDATEs en flujo de save.
  {
    const _ckptTitleMd = (parsed && parsed.title) ? parsed.title : '';
    if (raw && raw.includes('---DOC-UPDATE---')) {
      const _mdDocUpdates = extractDocUpdates(raw);
      _mdDocUpdates.forEach(update => {
        const { conflicto, msg } = processDocUpdate(update, _ckptTitleMd);
        if (conflicto && msg) showToast('warn', msg);
      });
    }
  }
  // ── END T-202606-073 AC-1 ──

  // T-202606-017 AC-1: registrar doc_updates en el índice de DOC-UPDATEs del proyecto.
  // Path JSON puro: usar parsed.docUpdates (array ya extraído en parsePaste).
  // Espeja el patrón de saveStandaloneCheckpoint (locus-session-parse.js).
  // T-202606-073 AC-2: path JSON — cubre parsed.docUpdates.
  {
    const _ckptTitle = (parsed && parsed.title) ? parsed.title : '';
    const _docUpdates = (parsed && Array.isArray(parsed.docUpdates)) ? parsed.docUpdates : [];
    _docUpdates.forEach(update => {
      const { conflicto, msg } = processDocUpdate(update, _ckptTitle);
      if (conflicto && msg) showToast('warn', msg);
    });
  }
  // ── END T-202606-017 / T-202606-073 AC-2 ──

  if (horaResult) { ai.status = 'exhausted'; ai.resetTime = horaResult.hhmm; ai.resetEpoch = horaResult.epoch; }
  ai._parsed = {};
  // T-202604-103: limpiar timer de confirmación si quedó activo
  if (_confirmTimers[id]) { clearTimeout(_confirmTimers[id]); delete _confirmTimers[id]; }
  // B-202605-NNN: clearTimeout antes de removeItem — evita que un timer completado justo antes
  // del save haga upsert en Supabase después de que el draft ya fue eliminado de localStorage.
  // El orden incorrecto (removeItem → clearTimeout) dejaba una ventana donde el timer podía
  // leer el draft de localStorage si se disparaba entre ambas líneas.
  clearTimeout(window['_draftSbTimer_' + id]);
  localStorage.removeItem('draft-' + id);
  localStorage.removeItem('draft-' + id + '-ts');
  // R-3: eliminar borrador de Supabase al guardar sesión
  // INC-[pendiente-ID]: typeof _supabase !== 'undefined' era guard siempre falso — _supabase
  // no es global ni estaba importado en este módulo. Este delete nunca se ejecutaba.
  {
    const _sbCtx = getSupabaseContext();
    if (_sbCtx) {
      _sbCtx.client.from('tracker_docs').delete().eq('user_id', _sbCtx.userId).eq('key', 'draft-' + id)
        .then(({ error }) => { if (error) console.warn('[AI Tracker] draft delete Supabase error:', error); });
    }
  }
  const _taClear = document.getElementById('ingest-ta'); // CAEL-22
  // B-202605-NNN: no llamar parsePaste(id) aquí — parsePaste con ta.value='' puede re-disparar
  // el debounce path y reescribir el draft si hay un oninput pendiente en la cola del browser.
  // El rAF post-render ya limpia el textarea y valida el estado final.
  if (_taClear) { _taClear.value = ''; _taClear.classList.remove('ta-has-items'); }
  await saveImmediate(); render();
  // R-202604-022: alerta de cuota tras guardar
  _checkStorageQuota();
  // B-007: actualizar stat bar y lista backlog siempre al guardar sesión
  renderStats();
  // B-202604-XXX: actualizar tab Hoy tras guardar CKPT con hora de cierre — sin esto el card no refleja estado exhausted sin refresh manual
  if (getCurrentTab() === 'sesiones') render();
  if (getCurrentTab() === 'backlog') { _markBacklogListDirty(); renderBacklogList(); }
  // R-202604-016: actualizar log card
  _rebuildLogBody();
  // R-003: animar la primera sess-row del card recién guardado
  // B-202605-265: _setPhase(id,3) movido dentro de rAF — render() reconstruye el DOM con
  // grid.innerHTML='', los elementos phase-* no existen hasta el siguiente frame.
  // Segundo render() + renderGlobalRadarSidebar() garantizan sidebar y card actualizados.
  requestAnimationFrame(() => {
    _setPhase(id, 3);
    render();
    _markRadarDirty(); renderGlobalRadarSidebar();
    // B-202605-XXX: re-limpiar draft después del segundo render() — restoreDrafts() corre
    // al final de render() y puede repoblar el textarea si el draft sobrevivió en localStorage
    // (race entre parsePaste con ta.value='' y un oninput/debounce timer previo).
    localStorage.removeItem('draft-' + id);
    localStorage.removeItem('draft-' + id + '-ts');
    const _dotRaf = document.getElementById('draft-' + id);
    if (_dotRaf) _dotRaf.className = 'draft-dot';
    const _taRaf = document.getElementById('ingest-ta'); // CAEL-22
    if (_taRaf && _taRaf.value.trim()) { _taRaf.value = ''; parsePaste(id); }
    const card = document.getElementById('card-' + id);
    if (card) {
      const firstRow = card.querySelector('.sess-row');
      if (firstRow) {
        firstRow.classList.remove('fade-slide-in');
        void firstRow.offsetWidth; // forzar reflow para reiniciar animación
        firstRow.classList.add('fade-slide-in');
      }
      // T-085: destello verde en el card al guardar sesión
      card.classList.remove('card-flash');
      void card.offsetWidth;
      card.classList.add('card-flash');
      setTimeout(() => card.classList.remove('card-flash'), 650);
      // T-202604-410: estado transitorio post-merge en card
      const _hasMergeItems = mergeResult && (
        mergeResult.created.length || mergeResult.advanced.length ||
        mergeResult.updated.length || mergeResult.retroceso.length ||
        mergeResult.discarded.length
      );
      if (_hasMergeItems) {
        const _successBadge = document.createElement('div');
        _successBadge.className = 'card-merge-success-badge';
        const _counts = [];
        if (mergeResult.created.length)  _counts.push(`+${mergeResult.created.length} creado${mergeResult.created.length > 1 ? 's' : ''}`);
        if (mergeResult.advanced.length) _counts.push(`${mergeResult.advanced.length} avanzado${mergeResult.advanced.length > 1 ? 's' : ''}`);
        if (mergeResult.updated.length)  _counts.push(`${mergeResult.updated.length} actualizado${mergeResult.updated.length > 1 ? 's' : ''}`);
        if (mergeResult.retroceso.length) _counts.push(`${mergeResult.retroceso.length} retroceso${mergeResult.retroceso.length > 1 ? 's' : ''}`);
        if (mergeResult.discarded.length) _counts.push(`${mergeResult.discarded.length} descartado${mergeResult.discarded.length > 1 ? 's' : ''}`);
        _successBadge.textContent = '✓ Merge aplicado · ' + _counts.join(' · ');
        card.appendChild(_successBadge);
        requestAnimationFrame(() => _successBadge.classList.add('visible'));
        setTimeout(() => {
          _successBadge.classList.remove('visible');
          setTimeout(() => _successBadge.remove(), 400);
        }, 2600);
      }
    }
  });

  // T-202604-061: registrar entrada en changelog si es CHECKPOINT
  if (parsed.isCheckpoint && parsed.estado) _addChangelogEntry(parsed);

  // T-202604-121: super toast con detalle del merge
  // R-202605-140: proximoPaso y decision abren el panel aunque no haya ítems
  const _ckptProximoPaso = parsed.nextStep  || '';
  const _ckptDecision    = parsed.decision  || '';
  // T-202606-039 AC nuevo 1: inlineFixes del CHECKPOINT → panel para visibilidad al founder
  const _ckptInlineFixes = Array.isArray(parsed.inlineFixes) && parsed.inlineFixes.length ? parsed.inlineFixes : null;
  const _isInfoOnly = (v) => !v || v.trim().toLowerCase() === 'n/a';
  const _hasInfoFields = !_isInfoOnly(_ckptProximoPaso) || !_isInfoOnly(_ckptDecision);
  const hasMergeData = mergeResult.created.length || mergeResult.advanced.length || mergeResult.retroceso.length || mergeResult.discarded.length || mergeResult.updated.length || mergeResult.ignored.length || mergedCtxNames.length || _hasInfoFields || !!_ckptInlineFixes;
  if (hasMergeData) {
    showCheckpointPanel({ ...mergeResult, contextSections: mergedCtxNames, proximoPaso: _ckptProximoPaso, decision: _ckptDecision, inlineFixes: _ckptInlineFixes });
  }
  // INC-202607-001 fix: distinguir guardado normal de guardado en borrador (draft:true) — el
  // ítem sí se persistió (guard bloqueante eliminado arriba), pero queda invisible en vistas
  // activas hasta el aval de Finn (draft:false vía type:patch). Mensaje informativo, no de error.
  const _baseMsg = parsed.draft === true
    ? 'Sesión guardada · CHECKPOINT en borrador — invisible en vistas activas hasta aval de Finn'
    : (horaResult ? `Sesión guardada · desbloquea a las ${horaResult.label}` : 'Sesión guardada');
  showToast('success', _baseMsg);
}

