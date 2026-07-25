// [PP] mod:53 · autor:Rune · 2026-07-25 UTC-6
// INC-202607-035 (fix, con _ob-DocStandards.md adjunto — confirma §3 "Ítems `historico` — regla
// de exclusión" y tabla "Qué NO le pertenece al backlog exportado"): la sección '## Historico —
// detalle' no está declarada en el estándar, y el comentario de código en _buildHistoricoDetailMd
// ("No requiere el Checkpoint Log — deriva directamente de getHistoricoItemsSync()/getItems()")
// contradecía explícitamente §3 ("Fuente para el detalle cuando se solicita: el Checkpoint Log
// (§12) ... no el backlog exportado de sesión normal"). El detalle ítem-por-ítem de sprints
// cerrados no le pertenece a este generador bajo ninguna condición — vive exclusivamente en el
// mecanismo de Checkpoint Log (§12), un export dedicado y separado que este archivo no implementa
// y que no está en scope de este fix. _buildHistoricoDetailMd() retirada completa; opts.includeHistorico
// deja de leerse en _generateBacklogContent() — 'historico' sigue excluido siempre de '## Ítems'
// (Regla 0, sin cambio) y sigue resumido a nivel de sprint en '## Historial de sprints'
// (_buildSprintHistorialMd, sin cambio) — único punto de visibilidad de historico en este export,
// tal como exige §3. exportBacklogMd() conserva el parámetro `opts` (lo usa opts.fullHistory) pero
// ya no reenvía semántica de includeHistorico — cualquier caller que aún lo pase es no-op silencioso,
// sin crash. contract_update: no — _buildHistoricoDetailMd() no era exportada, sin consumidor externo.
// [PP] mod:52 · autor:Rune · 2026-07-25 UTC-6
// Fix de 4 INC de Q-INC (naming/coherencia de exports fuera de Taxonomía __OB-Strategy §5):
// - INC-202607-033 (exportSprintsMd/_generateSprintsExportMd/_generateSprintsContent):
//   filename sin guion bajo inicial ('PP-SPRINTS_v1.8.0.md') → '_PP-sprints-v1.8.0.md'.
//   Header sin línea infra_version pese a _infraVersionStr() ya existir en el archivo —
//   agregada. 'sprints' no es un tipo declarado en la Taxonomía — sin decisión de founder/Vera
//   sobre agregarlo, se mantiene como slug descriptivo no-canónico (ver Propuesta de mejora
//   en CHECKPOINT de esta sesión).
// - INC-202607-034 (exportFullHistoryMd/_generateFullHistoryBySprintMd/_generateFullHistoryContent):
//   mismo patrón — '${pfx}-BACKLOG-FULL_${ver}.md' → '_${pfx}-backlog-full-${ver}.md' +
//   infra_version agregado. Mismo gap de Taxonomía sin resolver, misma escalación.
// - INC-202607-036 (_buildHistorialItemsMd): heading '## Historial' renombrado a
//   '## Historial — ítems done adicionales' — eliminada colisión con '## Historial de
//   sprints' (_ob-DocStandards §9).
// - INC-202607-035 (_buildHistoricoDetailMd): NO resuelto en esta sesión — requiere
//   _ob-DocStandards.md adjunto para confirmar el schema de 'Checkpoint Log' que la sección
//   debería usar como fuente (comentario de código en L757 contradice la regla del estándar).
//   Bloqueado — ver CHECKPOINT.
// [PP] mod:51 · autor:Rune · 2026-07-24 UTC-6
// TKT1 (REQ CAEL-0724-11, ref_id CAEL-0724-12): retiro final de 'KE' — inalcanzable desde
// _GEN2_TYPES (locus-backlog-core.js mod:131, fusión KE→PRB.root_cause_confirmed, infra_version
// 51). _isActiveQIncItem() pierde la rama `t === 'KE'`. itemC/maxId de _computeBacklogCounters()
// pierden la clave KE (6 claves, no 7). contadoresStr/counterStr pierden el segmento KE. Los dos
// objetos `order` (sort de export de backlog y de historial done) pierden la clave KE:5 — CHG
// conserva su valor 6 sin reindexar, el fallback `order[t] !== undefined ? order[t] : 7` no
// depende de contigüidad numérica. Sin cambio de comportamiento para REQ/TKT/INC/DISC/PRB/CHG
// reales — todas las ramas retiradas eran código muerto, nunca alcanzado desde que itemKind()
// dejó de emitir 'KE'.

// [PP] mod:50 · autor:Rune · 2026-07-24 11:40 UTC-6
// Corrección de gap detectado por Finn en QA de TKT1 (mod:49): el header de mod:49 describía
//   el listado `- code · title` por ítem de Q-Backlog, pero itemsBodyMd seguía calculando solo
//   qBacklogCount sin construir el listado — el código no reflejaba el comentario. Ahora
//   qBacklogItems (array, no solo .length) se mapea a `- ${code} · ${title || '(sin título)'}`
//   bajo el conteo existente. Verificado contra grep: sin otro consumidor programático de
//   itemsBodyMd fuera de la interpolación en el template final.
// [PP] mod:49 · autor:Rune · 2026-07-24 11:00 UTC-6
// TKT1 (ref_id CAEL-0724-02, parent REQ ref_id CAEL-0724-01) — DISC-202607-025: fallback de
//   itemsBodyMd (_generateBacklogContent, sprint activo vacío) solo mostraba qBacklogCount —
//   founder no podía identificar los ítems de Q-Backlog sin abrir Locus. Intención: listar
//   `- code · title` por ítem bajo el conteo existente, mismo patrón `title || '(sin título)'`
//   ya usado por _buildItemsMd/_buildHistorialItemsMd. Sin cambio cuando mainMd no está vacío
//   (ese caso ya lista vía _buildItemsMd, fuera de scope).
// [PP] mod:48 · autor:Rune · 2026-07-23 10:15 UTC-6
// TKT3 (REQ CAEL-0722-01, ref_id CAEL-0722-04): _isActiveQIncItem() — rama INC leía
//   i.incident_status crudo (snake_case) sin fallback camelCase, siempre false para INC en
//   memoria (parseado o hidratado). Ahora usa incIncidentStatus(i) — mismo accessor canónico
//   ya usado por locus-incidents-render.js y locus-backlog-panel.js. Ramas PRB/KE/CHG sin
//   cambio — ya correctas leyendo i.status tras TKT1 (mirror en _mapRowToIncident()).
// [PP] mod:47 · autor:Rune · 2026-07-21 12:00 UTC-6
// INC-PP-no-incluye-forEach: exportBacklogMd() crasheaba con TypeError en item.no_incluye.forEach
//   is not a function (_buildItemFieldsMd, ~L1187). no_incluye es string según schema
//   (__BR-Ecosystem §8 / __BR-Execution §1) — el código lo trataba como array. Fix: impresión
//   inline del string, mismo patrón ya usado para item.intencion.no_incluye (L1181). Sin cambio
//   de contrato de datos — no_incluye nunca fue array en el schema vigente.
// [PP] mod:46 · autor:Rune · 2026-07-19 15:00 UTC-6
// INC-PP-export-confirm-dead-shell: _showExportConfirmModal() migrada de #export-confirm-overlay
//   (retirado en REQ CAEL-0720-01 TKT2) a _gconfirmOpen (locus-modals.js). Afecta a los 4 exports
//   que pasan por este helper: exportBacklogMd (reportado por founder), exportFullHistoryMd,
//   exportSprintsMd y el export de CONTEXT (L1425) — los cuatro no hacían nada al click.
//   Requiere locus-modals.js mod:4 (bodyHtml ahora se renderiza en #gconfirm-body-html).
// [PP] mod:45 · autor:Rune · 2026-07-18 01:10 UTC-6
// INC-[pendiente-ID] (contador Últimos IDs desincronizado), 2º fix del mismo INC:
//   exportBacklogMd() no calentaba el cache de historico antes del path sync — verificado en
//   locus-ui-shell.js que btn-export-backlog dispara 'shell:export-backlog' sin warm-up previo,
//   a diferencia de exportFullHistoryMd()/exportSprintsMd() en este mismo archivo. Sin visitar
//   antes el sub-tab Historico en la sesión, el mismo fix de mod:44 leía un cache vacío. Ahora
//   exportBacklogMd() es async y hace await refreshHistoricoCache() antes de generar, mismo
//   patrón ya usado por las otras dos funciones de export de este archivo.
// [PP] mod:44 · autor:Rune · 2026-07-18 00:36 UTC-6
// INC-[pendiente-ID] (contador Últimos IDs desincronizado): _computeBacklogCounters() escaneaba
//   solo getItems() para maxId — excluye 'historico' desde T-202606-106, subestimando el
//   consecutivo real por tipo cuando había REQ/TKT ya archivados tras cierre de sprint. Ahora usa
//   _allItemsWithHistorico() (mismo universo que ya consume itemC/exportItems en este archivo).
// TKT-202607-INC-NAMING (INC-[pendiente-ID]): _buildQIncMd() — columna SLA Priority del
//   backlog exportado leía solo sla_priority (snake), sin fallback a slaPriority (camel).
//   Un INC recién creado en la sesión activa (aún no hidratado desde Supabase) mostraba '—'
//   en esa columna del .md que Cael/Rune/Finn cargan al abrir sesión (__OB-Strategy §8).
//   Mismo TKT que locus-backlog-core.js/locus-storage.js/locus-backlog-render.js/
//   locus-notifications.js/locus-backlog-item.js — sexto y último punto encontrado en
//   barrido completo del proyecto.
// TKT1 · TKT2 (req historico-export): ## Historial de sprints en tabla + omisión sin sprints
// cerrados; historico excluido siempre de ## Ítems; flag includeHistorico (default false) con
// detalle agrupado por sprint en ## Historico — detalle.
// Limpieza: _buildIndexLines() eliminada — sin llamadores desde TKT2, superseded por contadoresStr
// locus-backlog-generator.js
// Responsabilidad: Generación y export de documentos — Backlog, Historial, Sprints, Context.
// Extraído de locus-sprint-project.js — T-202606-016.
// Dependencias: locus-storage.js · locus-backlog-core.js · locus-toast.js
// T-202606-166: _docPrefix movida a locus-storage.js — import actualizado.

import { _blogLog, _docPrefix, _effectiveVersion, _sprintDisplay, _tplKey, getActiveProject, getActiveSprints, getActiveTracker, getState, getInfraVersionData, refreshHistoricoCache, getHistoricoItemsSync } from './locus-storage.js';
import { getItems, getIncidents, itemKind, updateBacklogBanner } from './locus-backlog-core.js'; // [tmp:tkt2-qinc-count]: getIncidents agregada — _allItemsWithHistorico()
import { showToast } from './locus-toast.js';
import { incSlaPriority, incIncidentStatus } from './locus-inc-fields.js'; // TKT1 REQ-centralizar-accesores-itil · incIncidentStatus: TKT3 (ref_id CAEL-0722-04)
import { _gconfirmOpen } from './locus-modals.js'; // INC-PP-export-confirm-dead-shell

// ── _itemTypeGen2 — detección de tipo Gen 2 ──────────────────────────────────
// [tmp:tkt1-itemtype-fn] AC-1: wrapper sobre itemKind() de locus-backlog-core.js.
// Retorna tipo Gen 2 canónico ('REQ'/'TKT'/'INC'/'DISC'/'PRB'/'CHG') o 'UNKNOWN'.
// Reemplaza toda detección por code[0] o startsWith Gen 1 en este módulo.
function _itemTypeGen2(item) {
  const t = itemKind(item);
  return t || 'UNKNOWN';
}

// [tmp:tkt-backlog-gen-core] AC-2/AC-4/AC-6/AC-7: predicados de pertenencia a Q-DISC y Q-INC.
// Q-DISC y Q-INC son zonas persistentes — un ítem pertenece a ellas por su status ITIL/discovery,
// independiente de si tiene sprint asignado. Reutilizados por exportItems, _buildQDiscMd,
// _buildQIncMd y _buildCurrentStateMd para evitar duplicar el criterio de "activo".
function _isActiveDisc(i) {
  return _itemTypeGen2(i) === 'DISC' && i.status === 'discovery';
}
function _isActiveQIncItem(i) {
  const t = _itemTypeGen2(i);
  // TKT3 (ref_id CAEL-0722-04): INC leía i.incident_status crudo (snake_case) sin fallback a
  // incidentStatus (camelCase, formato real en memoria tras parse o hidratación) — siempre false.
  // incIncidentStatus() resuelve ambos formatos, mismo accessor ya usado por locus-incidents-render.js
  // y locus-backlog-panel.js. PRB/CHG sin cambio — ya correctos leyendo i.status tras TKT1
  // (ref_id CAEL-0722-02, mirror status↔incident_status aplicado en _mapRowToIncident()).
  if (t === 'INC') { const s = incIncidentStatus(i); return !!s && s !== 'closed' && s !== 'descartado'; }
  if (t === 'PRB') return i.status === 'detected' || i.status === 'in_progress' || i.status === 'resolved';
  if (t === 'CHG') return i.status === 'pendiente' || i.status === 'en-revision';
  return false;
}

// [tmp:inc-historico-generator] Fix INC — getItems() excluye status 'historico' desde T-202606-106
// (barrera dura en locus-backlog-core.js). Retro/velocidad por sprint cerrado (%entrega, doneEffort)
// deben mergear con getHistoricoItemsSync() — este módulo opera solo sobre el proyecto activo, sin
// loop cross-proyecto. El caller es responsable de haber llamado refreshHistoricoCache() antes
// (ver entry points export* más abajo).
function _allItemsWithHistorico() {
  // [tmp:tkt2-qinc-count]: getIncidents() agregado — INC/PRB/KE/CHG viven en INCIDENTS,
  // nunca en ITEMS ni en historico (Q-INC es zona persistente, no migra — __BR-Ecosystem
  // §4b). Sin esto, "## Estado actual" y "## Q-INC" del export siempre reportaban 0/vacío.
  return getItems().concat(getHistoricoItemsSync()).concat(getIncidents());
}

// ── Versión canónica para naming de docs exportados ─────────────────────────
// T-202606-022: usa version_target del sprint activo como fuente de verdad.
// Fallback a _effectiveVersion() si no hay sprint activo o no tiene version_target declarado.
function _backlogVersion() {
  const sprints = getActiveSprints();
  const activeSprint = sprints.find(s => s.status === 'active' && s.current === true)
    || sprints.find(s => s.status === 'active');
  const versionTarget = activeSprint && activeSprint.version_target
    ? activeSprint.version_target.trim()
    : null;
  const _src = versionTarget || _effectiveVersion() || 'v0.0.0'; // T-202606-029: fallback canónico
  const m = _src.replace(/^v/, '').match(/^(\d+\.\d+(?:\.\d+)?)/);
  return m ? `v${m[1]}` : 'v0.0.0'; // T-202606-029: fallback canónico ante formato no semver
}

// R-202604-052: sprint cerrado más reciente del proyecto activo
// R-202605-002: usa getActiveSprints() como fuente de verdad v3
function _lastClosedSprint() {
  const sprints = getActiveSprints();
  const closed = sprints.filter(s => s.status === 'closed');
  if (!closed.length) return null;
  return closed.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0))[0];
}

// ── Modal de confirmación de export ─────────────────────────────────────────
// INC-PP-export-confirm-dead-shell (2026-07-19): #export-confirm-overlay/-title/-filename/-btn
// fueron retirados de index.html en REQ CAEL-0720-01 TKT2 (reemplazados por #gconfirm-overlay +
// bodyHtml) — esta función seguía apuntando al shell viejo, por lo que `overlay` era siempre null
// y el export (Backlog/Historial completo/Sprints/CONTEXT, los 4 callers de este helper) no hacía
// nada al click: sin error visible, sin toast, sin modal. Migrado a _gconfirmOpen — mismo patrón
// ya usado por _openStatusConfirm (locus-backlog-merge.js).
function _showExportConfirmModal(label, filename, onConfirm) {
  _gconfirmOpen({
    title: `⬇ Exportar ${label}`,
    msg: '',
    okLabel: 'Exportar',
    danger: false,
    bodyHtml: `<div>${filename}</div>`
  }, () => { onConfirm(); });
}

// ── Export Backlog ───────────────────────────────────────────────────────────
// T-202606-108: verifica si version_target, release_type o scope del sprint activo son n/a o ausentes.
// Retorna true si alguno falla — false si todos están completos o no hay sprint activo (AC-4).
function _sprintHasIncompleteFields() {
  const sprints = getActiveSprints();
  const activeSprint = sprints.find(s => s.status === 'active' && s.current === true)
    || sprints.find(s => s.status === 'active');
  if (!activeSprint) return false; // AC-4: sin sprint activo → no advertir
  const _isEmpty = v => !v || v === 'n/a';
  return _isEmpty(activeSprint.version_target)
    || _isEmpty(activeSprint.release_type)
    || _isEmpty(activeSprint.scope);
}

// INC-202607-035 (mod:53): opts.includeHistorico ya no tiene efecto — _generateBacklogContent()
// no lo lee más. `opts` se conserva como parámetro porque opts.fullHistory sigue siendo válido.
export async function exportBacklogMd(opts = {}) {
  // TKT1 AC-1: backlog vacío ya no bloquea el export — _ob-DocStandards §3 v1.10
  // exige declarar el vacío explícito en el .md, no omitir el archivo.
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  // T-202606-069: separador canónico punto — reemplazar _ por . en segmento de versión
  // [tmp:tkt-backlog-gen-housekeeping] AC-5: naming canónico _[PREFIJO]-backlog-v[X].[Y].[Z].md
  const _canonVer = ver => ver.replace(/_/g, '.');
  // INC-[pendiente-ID] (2026-07-18): _generateBacklogContent() lee _allItemsWithHistorico() →
  //   getHistoricoItemsSync() de forma sync. Verificado en locus-ui-shell.js que btn-export-backlog
  //   dispara 'shell:export-backlog' sin ningún warm-up previo del cache — a diferencia de
  //   exportFullHistoryMd()/exportSprintsMd() (mismo archivo), esta función no tenía su propio
  //   await refreshHistoricoCache(). Si el founder exporta backlog sin haber visitado antes el
  //   sub-tab Historico en la sesión, el cache arranca vacío y tanto el conteo de ítems done por
  //   sprint como maxId (fix anterior de este mismo INC) leen historico como si no existiera.
  await refreshHistoricoCache(); // fix INC — cache poblado antes de que el generador sync lea getHistoricoItemsSync(), mismo patrón que exportFullHistoryMd/exportSprintsMd
  const _doExport = () => _showExportConfirmModal('Backlog', `_${pfx}-backlog-${_canonVer(ver)}.md`, () => _generateBacklogMd(ver, opts));
  // T-202606-108: AC-1/AC-2 — advertir si sprint activo tiene campos incompletos
  if (_sprintHasIncompleteFields()) {
    showToast(
      'warning',
      'Sprint sin version_target / release_type / scope — el backlog exportado tendrá campos incompletos.',
      'Continuar de todas formas',
      0,        // AC-2: sin auto-dismiss
      _doExport // AC-3: onClick dispara el export
    );
    return;
  }
  _doExport(); // AC-5: sprint completo → export directo sin toast
}

// AC-5: Exportar historial completo — todos los ítems sin filtro generacional
export async function exportFullHistoryMd() {
  // TKT1 AC-2: backlog vacío ya no bloquea el export — _ob-DocStandards §3 v1.10
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  const _canonVer2 = v => v.replace(/_/g, '.');
  await refreshHistoricoCache(); // fix INC — cache poblado antes de que el generador sync lea getHistoricoItemsSync()
  // INC-202607-034: naming alineado a patrón de Docs — guion bajo inicial + '-' antes de versión.
  // 'backlog-full' no está declarado como tipo en la Taxonomía (__OB-Strategy §5) — escalado a
  // Vera como Propuesta de mejora (¿agregar el tipo, o tratar este export como no-canónico?).
  // Mientras no se resuelva, se usa el slug descriptivo sin pretender infra_version tracking pleno.
  _showExportConfirmModal('Historial completo', `_${pfx}-backlog-full-${_canonVer2(ver)}.md`, () => _generateFullHistoryBySprintMd(ver));
}

// R-202605-132: Export "Por sprint"
async function exportSprintsMd() {
  // TKT1: backlog vacío ya no bloquea el export — _ob-DocStandards §3 v1.10
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  const _canonVer3 = v => v.replace(/_/g, '.');
  await refreshHistoricoCache(); // fix INC — cache poblado antes de que el generador sync lea getHistoricoItemsSync()
  // INC-202607-033: mismo fix de naming que exportFullHistoryMd (INC-202607-034) — 'sprints'
  // tampoco está declarado como tipo en la Taxonomía, misma escalación a Vera pendiente.
  _showExportConfirmModal('Sprints — historial completo', `_${pfx}-sprints-${_canonVer3(ver)}.md`, () => _generateSprintsExportMd(ver));
}

// R-202605-132: genera Markdown por sprint
function _generateSprintsContent(newVersion) {
  const state = getState();
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;
  const pfx = _docPrefix();
  const _activeProj = getActiveProject();
  const _projName = _activeProj ? (_activeProj.name || 'Sin proyecto') : 'Sin proyecto';

  const allSprints = (state && Array.isArray(state.sprints)) ? state.sprints : [];
  const closedSprints = allSprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  const activeSprints = allSprints.filter(s => s.status === 'active');
  const orderedSprints = [...closedSprints, ...activeSprints];

  const _itemRow = (i, sprintOpenedAt) => {
    const effortN = parseInt(i.effort) || 1;
    const effortDots = '●'.repeat(effortN) + '○'.repeat(3 - effortN);
    const typeLabel = _itemTypeGen2(i);
    let scopeNote = '';
    if (sprintOpenedAt && i.createdAt) {
      const createdTs = new Date(i.createdAt).getTime();
      if (!isNaN(createdTs) && createdTs > sprintOpenedAt) scopeNote = ' ⊕';
    }
    return `| \`${i.code}\` | ${i.title || '—'} | ${typeLabel} | ${effortDots} (${effortN}) | ${i.status || '—'} |${scopeNote ? ' scope added' : ''} |`;
  };

  const _itemRowHeader = () =>
    `| Código | Título | Tipo | Effort | Status final | Nota |\n|--------|--------|------|--------|--------------|------|`;

  let sprintSections = '';

  orderedSprints.forEach(sp => {
    const spItems = _allItemsWithHistorico().filter(i => i.sprint === sp.id);
    const doneItems = spItems.filter(i => i.status === 'done' || i.status === 'historico');
    const doneEffort = doneItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const totalEffort = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const pctEntrega = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;
    const closedDate = sp.closedAt
      ? (() => { const d = new Date(sp.closedAt); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })()
      : '—';

    const metaRows = [
      `| ID | ${sp.id} |`,
      `| Nombre | ${sp.label || sp.name || sp.id} |`,
      `| Status | ${sp.status || '—'} |`,
      sp.goal ? `| Goal | ${sp.goal} |` : '',
      sp.version_target ? `| Versión target | ${sp.version_target} |` : '',
      sp.release_type ? `| Release type | ${sp.release_type} |` : '',
      `| Cerrado | ${closedDate} |`,
      `| Effort planeado | ${totalEffort} |`,
      `| Effort done | ${doneEffort} |`,
      `| % entrega | ${pctEntrega}% |`,
    ].filter(Boolean).join('\n');

    const sprintOpenedAt = sp.openedAt || sp.createdAt || 0;
    const itemsBlock = spItems.length
      ? `${_itemRowHeader()}\n${spItems.map(i => _itemRow(i, sprintOpenedAt)).join('\n')}`
      : '_Sin ítems registrados._';

    const retroBlock = (sp.retroMd || sp.retro)
      ? `\n#### Retrospectiva\n\n${sp.retroMd || sp.retro}\n`
      : '';

    sprintSections += `\n### ${sp.label || sp.name || sp.id}\n\n| Campo | Valor |\n|---|---|\n${metaRows}\n\n${itemsBlock}\n${retroBlock}\n---\n`;
  });

  const noSprintItems = getItems().filter(i => !i.sprint || i.sprint === 'n/a');
  let noSprintSection = '';
  if (noSprintItems.length) {
    noSprintSection = `\n### Sin sprint asignado\n\n${_itemRowHeader()}\n${noSprintItems.map(i => _itemRow(i, 0)).join('\n')}\n\n---\n`;
  }

  const velocityRows = closedSprints.map(sp => {
    const spItems = _allItemsWithHistorico().filter(i => i.sprint === sp.id);
    const doneEffort = spItems
      .filter(i => i.status === 'done' || i.status === 'historico')
      .reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const totalEffort = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const pct = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;
    return `| ${sp.id} | ${sp.label || sp.name || sp.id} | ${totalEffort} | ${doneEffort} | ${pct}% |`;
  }).join('\n');

  const avgVelocity = closedSprints.length
    ? (() => {
        const totals = closedSprints.map(sp =>
          _allItemsWithHistorico().filter(i => i.sprint === sp.id && (i.status === 'done' || i.status === 'historico'))
               .reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0)
        );
        return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
      })()
    : 0;

  const md = `# _${pfx}-sprints-${newVersion.replace(/_/g, ".")}.md
<!-- Versión: ${newVersion} | Última actualización: ${dateStr} | Export estructurado de sprints -->
${_infraVersionStr()}

---

## Meta

| Campo | Valor |
|---|---|
| Proyecto | ${_projName} |
| Versión | ${newVersion} |
| Última actualización | ${dateStr} |
| Sprints totales | ${allSprints.length} |
| Sprints cerrados | ${closedSprints.length} |
| Velocidad promedio | ${avgVelocity} effort/sprint |

---

## Velocidad por sprint

| Sprint | Nombre | Planeado | Done | % Entrega |
|--------|--------|----------|------|-----------|
${velocityRows || '_Sin sprints cerrados._'}

---

## Detalle por sprint
${orderedSprints.length ? sprintSections : '\n_Sin sprints registrados._\n'}
${noSprintSection}`;

  return md;
}

function _generateSprintsExportMd(newVersion) {
  const pfx = _docPrefix();
  const md = _generateSprintsContent(newVersion);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // INC-202607-033: guion bajo inicial + separador '-v' — mismo patrón que _generateBacklogContent
  const fileName = `_${pfx}-sprints-${newVersion.replace(/_/g, ".")}.md`;
  a.download = fileName; // T-202606-069
  a.click();
  URL.revokeObjectURL(url);
  showToast('download', `📥 ${fileName} descargado`);
}

// B-202605-515: _generateFullHistoryContent — función pura que retorna el string Markdown
export function _generateFullHistoryContent(newVersion) {
  const state = getState();
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;
  const pfx = _docPrefix();
  const _activeProj = getActiveProject();
  const _projName = _activeProj ? (_activeProj.name || 'Sin proyecto') : 'Sin proyecto';

  const SPRINT_DATA_THRESHOLD = 23;
  const _sprintNum = id => {
    if (!id) return null;
    const m = String(id).match(/S-(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  };

  const allSprints = (state && Array.isArray(state.sprints)) ? state.sprints : [];
  const closedSprints = allSprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  const sprintsWithData = closedSprints.filter(s => (_sprintNum(s.id) || 0) >= SPRINT_DATA_THRESHOLD);
  const legacySprintIds = new Set(
    closedSprints
      .filter(s => (_sprintNum(s.id) || 0) < SPRINT_DATA_THRESHOLD)
      .map(s => s.id)
  );

  const _itemRow = (i, sprintOpenedAt) => {
    const effortN = parseInt(i.effort) || 1;
    const effortDots = '●'.repeat(effortN) + '○'.repeat(3 - effortN);
    const typeLabel = _itemTypeGen2(i);
    let scopeAdded = '';
    if (sprintOpenedAt && i.createdAt) {
      const createdTs = new Date(i.createdAt).getTime();
      if (!isNaN(createdTs) && createdTs > sprintOpenedAt) scopeAdded = ' ⊕';
    }
    return `| \`${i.code}\` | ${i.title || '—'} | ${typeLabel} | ${effortDots} (${effortN}) | ${i.status || '—'} |${scopeAdded ? ` _scope added_` : ''} |`;
  };

  const _itemRowHeader = () =>
    `| Código | Título | Tipo | Effort | Status | Nota |\n|--------|--------|------|--------|--------|------|`;

  let sprintSections = '';
  sprintsWithData.forEach(sp => {
    const spItems = _allItemsWithHistorico().filter(i => i.sprint === sp.id);
    const doneItems = spItems.filter(i => i.status === 'done' || i.status === 'historico');
    const doneEffort = doneItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const totalEffort = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const pctEntrega = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;
    const closedDate = sp.closedAt
      ? (() => { const d = new Date(sp.closedAt); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })()
      : '—';

    const metaRows = [
      `| ID | ${sp.id} |`,
      `| Nombre | ${sp.label || sp.name || sp.id} |`,
      sp.goal ? `| Goal | ${sp.goal} |` : '',
      sp.version_target ? `| Versión | ${sp.version_target} |` : '',
      sp.release_type ? `| Release | ${sp.release_type} |` : '',
      `| Cerrado | ${closedDate} |`,
      `| Effort done | ${doneEffort} / ${totalEffort} (${pctEntrega}%) |`,
    ].filter(Boolean).join('\n');

    const sprintOpenedAt = sp.openedAt || sp.createdAt || 0;
    const itemsBlock = spItems.length
      ? `${_itemRowHeader()}\n${spItems.map(i => _itemRow(i, sprintOpenedAt)).join('\n')}`
      : '_Sin ítems registrados._';

    const retroBlock = (sp.retroMd || sp.retro)
      ? `\n#### Retrospectiva\n\n${sp.retroMd || sp.retro}\n`
      : '';

    sprintSections += `\n### ${sp.label || sp.name || sp.id}\n\n| Campo | Valor |\n|---|---|\n${metaRows}\n\n${itemsBlock}\n${retroBlock}\n---\n`;
  });

  const legacyItems = _allItemsWithHistorico().filter(i => i.sprint && legacySprintIds.has(i.sprint));
  let legacySection = '';
  if (legacyItems.length) {
    legacySection = `\n### Histórico pre-S-${SPRINT_DATA_THRESHOLD} (sin datos de sprint)\n\n_Ítems de sprints anteriores sin datos de effort registrados._\n\n${_itemRowHeader()}\n${legacyItems.map(i => _itemRow(i, 0)).join('\n')}\n\n---\n`;
  }

  const noSprintItems = getItems().filter(i => !i.sprint || i.sprint === 'n/a');
  let noSprintSection = '';
  if (noSprintItems.length) {
    noSprintSection = `\n### Sin sprint asignado\n\n${_itemRowHeader()}\n${noSprintItems.map(i => _itemRow(i, 0)).join('\n')}\n\n---\n`;
  }

  const md = `# _${pfx}-backlog-full-${newVersion.replace(/_/g, ".")}.md
<!-- Versión: ${newVersion} | Última actualización: ${dateStr} | Historial completo agrupado por sprint -->
${_infraVersionStr()}

---

## Meta

| Campo | Valor |
|---|---|
| Proyecto | ${_projName} |
| Versión del backlog | ${newVersion} |
| Última actualización | ${dateStr} |
| Generado por | TL — export historial completo |

---

## Sprints cerrados
${sprintsWithData.length ? sprintSections : '\n_Sin sprints cerrados con datos completos._\n\n---\n'}
${legacySection}${noSprintSection}
## Estadísticas

| Métrica | Valor |
|---------|-------|
| Total ítems | ${getItems().length} |
| Sprints cerrados con datos | ${sprintsWithData.length} |
| Sprints históricos (pre-S-${SPRINT_DATA_THRESHOLD}) | ${legacySprintIds.size} |
`;

  return md;
}

function _generateFullHistoryBySprintMd(newVersion) {
  const md = _generateFullHistoryContent(newVersion);
  if (!md) return;
  const pfx = _docPrefix();
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // INC-202607-034: guion bajo inicial + separador '-v' — mismo patrón que _generateBacklogContent
  const fileName = `_${pfx}-backlog-full-${newVersion.replace(/_/g, ".")}.md`;
  a.download = fileName; // T-202606-069
  a.click();
  URL.revokeObjectURL(url);
  showToast('download', `📥 ${fileName} descargado`);
}

// R-202605-053: bloque ## Sprint activo — primera sección del backlog exportado
function _buildSprintActivoMd() {
  const all = getActiveSprints().filter(s => s.status === 'active');
  const currentSprint = all.find(s => s.current === true) || null;
  // TKT2 AC-1: sin sprint abierto → declarar el vacío explícito, nunca retornar ''
  if (!currentSprint) {
    return [
      '## Sprint activo',
      '',
      '| Campo | Valor |',
      '|---|---|',
      '| sprint | ninguno — proyecto sin sprint abierto |',
      '| status | n/a |',
      '| version_target | n/a |',
      '| release_type | n/a |',
      '| scope | n/a |',
      '| goal | n/a |',
      '',
      '---',
      '',
    ].join('\n');
  }
  const lines = [
    '## Sprint activo',
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| sprint | ${_sprintDisplay(currentSprint.id)} |`,
    `| status | ${currentSprint.status} |`,
    `| version_target | ${currentSprint.version_target || 'n/a'} |`,
    `| release_type | ${currentSprint.release_type || 'n/a'} |`,
    `| scope | ${currentSprint.scope || 'n/a'} |`,
    // T-202606-067: campo goal — 'n/a' si no declarado + warn en consola
    (() => {
      if (!currentSprint.goal) {
        console.warn(`[locus-backlog-generator] Sprint ${currentSprint.id} sin goal declarado — exportando como n/a`);
        return `| goal | n/a |`;
      }
      return `| goal | ${currentSprint.goal} |`;
    })(),
    '',
    '---',
    '',
  ];
  return lines.join('\n');
}

// T-202606-060: sección ## Sprints programados — solo si existen sprints con status 'programado'.
// Campos: Sprint · Orden activación · Ítems asignados (R=N · T=N · B=N) · Effort total · Adelantados.
// Se omite completamente si no hay sprints programados.
// Aparece después de ## Sprint activo y antes de ## Meta.
function _buildSprintsProgramadosMd() {
  const sprints = getActiveSprints();
  const programados = sprints.filter(s => s.status === 'programado' || s.status === 'scheduled');
  if (!programados.length) return '';

  const allItems = getItems();

  // Orden de activación: si el objeto sprint tiene campo de orden, usarlo; sino usar posición en array
  const rows = programados.map((sp, idx) => {
    const spItems = allItems.filter(i => {
      if (!i.sprint) return false;
      const m = String(i.sprint).match(/^([A-Za-z]+-S-?\d+)/i);
      const normId = m ? m[1] : i.sprint;
      return normId === sp.id;
    });
    const rCount = spItems.filter(i => _itemTypeGen2(i) === 'REQ').length;
    const tCount = spItems.filter(i => _itemTypeGen2(i) === 'TKT').length;
    const bCount = spItems.filter(i => _itemTypeGen2(i) === 'INC').length;
    const effortTotal = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const doneCount = spItems.filter(i => i.status === 'done').length;

    const orden = sp.activationOrder != null ? sp.activationOrder : (idx + 1);
    const label = _sprintDisplay(sp.id);
    return `| ${label} | ${orden} | R=${rCount} · T=${tCount} · INC=${bCount} | ${effortTotal} | ${doneCount} done |`;
  });

  return [
    '## Sprints programados',
    '',
    '| Sprint | Orden activación | Ítems asignados | Effort total | Adelantados |',
    '|--------|-----------------|-----------------|--------------|-------------|',
    ...rows,
    '',
    '---',
    '',
  ].join('\n');
}


function _buildCurrentStateMd() {
  const state = getState();
  const lines = ['## Estado actual', ''];

  const pendientes = getItems().filter(i => i.status === 'pendiente');
  if (pendientes.length) {
    const byType = {};
    pendientes.forEach(i => {
      if (!i.code) return;
      const t = _itemTypeGen2(i);
      byType[t] = (byType[t] || 0) + 1;
    });
    const pendStr = Object.entries(byType).map(([t, n]) => `${t}=${n}`).join(' | ');
    lines.push(`**Pendientes:** ${pendStr} (${pendientes.length} total)`);
  } else {
    // TKT3 AC-1: cero explícito — nunca omitir la línea de Pendientes
    lines.push(`**Pendientes:** REQ=0 | TKT=0 (0 total)`);
  }
  // B-202606-011 AC-2: en-revision como categoría propia en ## Estado actual
  const enRevision = getItems().filter(i => i.status === 'en-revision');
  if (enRevision.length) {
    const byTypeER = {};
    enRevision.forEach(i => {
      if (!i.code) return;
      const t = _itemTypeGen2(i);
      byTypeER[t] = (byTypeER[t] || 0) + 1;
    });
    const erStr = Object.entries(byTypeER).map(([t, n]) => `${t}=${n}`).join(' | ');
    lines.push(`**En revisión:** ${erStr} (${enRevision.length} total)`);
  }

  // [tmp:tkt-backlog-gen-core] AC-7: Q-DISC y Q-INC declarados siempre en ## Estado actual —
  // visibilidad de zonas persistentes independiente de si tienen ítems.
  const qDiscCount = getItems().filter(_isActiveDisc).length;
  lines.push(`**Q-DISC:** ${qDiscCount} activas`);
  // [tmp:tkt2-qinc-count]: getIncidents() — INC/PRB/KE/CHG viven en INCIDENTS, no en ITEMS.
  const qIncCount = getIncidents().filter(_isActiveQIncItem).length;
  lines.push(`**Q-INC:** ${qIncCount} activos`);

  const allSessions = [];
  (state.projects || []).forEach(p => (p.sessions || []).forEach(s => allSessions.push(s)));
  allSessions.sort((a, b) => parseInt(b.id) - parseInt(a.id));
  const lastWithBlocker = allSessions.find(s => s.bloqueantes);
  if (lastWithBlocker) {
    lines.push(`**Último bloqueante:** ${lastWithBlocker.bloqueantes}`);
    lines.push(`*(registrado: ${lastWithBlocker.date || lastWithBlocker.dateShort || '—'})*`);
  }

  lines.push('', '---', '');
  // TKT3 AC-2: el bloque ## Estado actual se declara siempre — nunca string vacío
  return lines.join('\n');
}

// [tmp:tkt-backlog-gen-core] AC-1/AC-2: sección '## Q-DISC' — snapshot de la zona persistente.
// Entrada: array de ítems (exportItems o getItems()). Salida: sección Markdown, nunca omitida —
// declara 'Sin DISCs activas' explícito cuando no hay DISCs en status discovery.
function _buildQDiscMd(items) {
  const discs = (items || []).filter(_isActiveDisc);
  const lines = ['## Q-DISC', ''];
  if (!discs.length) {
    lines.push('Sin DISCs activas', '', '---', '');
    return lines.join('\n');
  }
  lines.push('| Código | Título | Área | Priority |');
  lines.push('|--------|--------|------|----------|');
  discs.forEach(d => {
    lines.push(`| \`${d.code}\` | ${d.title || '—'} | ${d.area || '—'} | ${d.priority || '—'} |`);
  });
  lines.push('', '---', '');
  return lines.join('\n');
}

// [tmp:tkt-backlog-gen-core] AC-3/AC-4: sección '## Q-INC' — snapshot de INC/PRB/KE/CHG activos.
// Entrada: array de ítems (exportItems o getItems()). Salida: sección Markdown, nunca omitida —
// declara 'Sin incidentes activos' explícito cuando no hay ítems ITIL activos.
function _buildQIncMd(items) {
  const incs = (items || []).filter(_isActiveQIncItem);
  const lines = ['## Q-INC', ''];
  if (!incs.length) {
    lines.push('Sin incidentes activos', '', '---', '');
    return lines.join('\n');
  }
  lines.push('| Código | Título | Status | SLA Priority |');
  lines.push('|--------|--------|--------|--------------|');
  incs.forEach(i => {
    const statusVal = i.incident_status || i.status || '—';
    // TKT1 (REQ-centralizar-accesores-itil): fallback centralizado en locus-inc-fields.js
    // — un INC recién creado en la sesión activa, antes de round-trip por Supabase, solo
    // trae el campo camelCase. Sin fallback, la columna SLA Priority del backlog
    // exportado quedaba en '—' para esos casos.
    lines.push(`| \`${i.code}\` | ${i.title || '—'} | ${statusVal} | ${incSlaPriority(i) || '—'} |`);
  });
  lines.push('', '---', '');
  return lines.join('\n');
}

// T-202606-009: INFRA_VERSIONS reemplazado por getInfraVersionData() desde storage.
// Fallback a valores hardcodeados si storage vacío (sin sync previo).
// [tmp:tkt-backlog-gen-housekeeping] AC-1: valores Gen 2 vigentes — infra_version:13, ver __OB-Strategy §5.
const _INFRA_FALLBACK = {
  infraVersion: 13,
  brCore: '1.4',
  brEcosystem: '1.5',
  brExecution: '1.4',
  obStrategy: '1.10',
};

function _infraVersionStr() {
  const data = getInfraVersionData() || _INFRA_FALLBACK;
  const v = f => (f !== undefined && f !== null) ? f : 'n/a';
  return `<!-- **infra_version: ${v(data.infraVersion)}** | BR-Core v${v(data.brCore)} · BR-Ecosystem v${v(data.brEcosystem)} · BR-Execution v${v(data.brExecution)} · OB-Strategy v${v(data.obStrategy)} -->`;
}

// ── Normalización de sprint ID — usada por el resumen de Historial de sprints ──
// [tmp:tkt-historial-sprints] Patrón con guion opcional entre 'S' y el consecutivo —
// mismo criterio de tolerancia que _normSprintIdForSort() en _generateBacklogContent.
// INC-202607-035 (mod:53): antes también servía a _buildHistoricoDetailMd(), retirada.
function _normSprintIdShared(val) {
  if (!val) return null;
  const m = String(val).match(/^([A-Za-z]+-S-?\d+)/i);
  return m ? m[1] : val;
}

// ── Generación de contenido Backlog ─────────────────────────────────────────
// [tmp:tkt-historial-sprints] TKT1 — ## Historial de sprints — sección del backlog exportado.
// Reemplaza T-202606-149: formato tabla (Sprint | Label | version_target | release_type |
// Fecha cierre | Ítems done) según _ob-DocStandards v1.11 §3. Sin sprints cerrados → sección
// omitida completamente (AC-3) — ya no se declara con placeholder '(sin sprints cerrados)'.
function _buildSprintHistorialMd() {
  const pad = n => String(n).padStart(2, '0');
  const sprints = getActiveSprints();
  const closed = sprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  if (!closed.length) return ''; // AC-3: sección omitida — no placeholder

  const allWithHistorico = _allItemsWithHistorico();

  const rows = closed.map(sp => {
    const label = sp.label || sp.name || sp.id;
    const vt = sp.version_target ? sp.version_target.trim() : '—';
    const rt = sp.release_type ? sp.release_type.trim() : '—';
    const closedDate = sp.closedAt
      ? (() => { const d = new Date(sp.closedAt); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })()
      : '—';
    // Ítems done del sprint: 'done' o 'historico' (fix DISC — done pasa a historico al cerrar sprint)
    const doneCount = allWithHistorico.filter(i =>
      (i.status === 'done' || i.status === 'historico') &&
      _normSprintIdShared(i.sprint) === _normSprintIdShared(sp.id)
    ).length;
    return `| ${sp.id} | ${label} | ${vt} | ${rt} | ${closedDate} | ${doneCount} |`;
  });

  const header = '| Sprint | Label | version_target | release_type | Fecha cierre | Ítems done |\n|---|---|---|---|---|---|';

  return `## Historial de sprints\n\n${header}\n${rows.join('\n')}\n`;
}

export function _generateBacklogContent(newVersion, opts = {}) {
  const state = getState();
  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const _activeProj = getActiveProject();
  const _projName = _activeProj ? (_activeProj.name || 'Sin proyecto') : 'Sin proyecto';
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;

  let exportItems;
  if (opts.fullHistory) {
    // [tmp:tkt2-qinc-count]: getIncidents() agregado — _buildQIncMd(exportItems) también
    // se llama en esta rama, misma causa que _allItemsWithHistorico().
    exportItems = getItems().concat(getIncidents());
  } else {
    const lastClosed = _lastClosedSprint();
    const lastClosedId = lastClosed ? lastClosed.id : null;
    const activeSprint = (state.sprints || []).find(s => s.status === 'active');
    const activeSprintId = activeSprint ? activeSprint.id : null;
    // B-202606-014: normalizar ID de sprint — i.sprint puede almacenarse como label completo
    // ("PP-S-01 · ESM Migration...") en lugar del ID canónico ("PP-S-01").
    // Extraer solo el segmento "[Prefijo]-S-XX" antes de comparar.
    const _normSprintId = val => {
      if (!val) return val;
      const m = String(val).match(/^([A-Za-z]+-S\d+)/i); // T-202606-063: guion canónico obligatorio — sin '?'
      return m ? m[1] : val;
    };
    const _normActiveSprintId = _normSprintId(activeSprintId);
    const _normLastClosedId   = _normSprintId(lastClosedId);
    // Pre-computar set de REQs activos para regla de hijos (TKT/INC con parent en REQ no cerrado)
    const allItems = getItems();
    const activeRCodes = new Set(
      allItems
        .filter(i => _itemTypeGen2(i) === 'REQ' && i.status !== 'done' && i.status !== 'descartado')
        .map(i => i.code)
    );
    // T-202606-058: pre-computar set de TKTs hijos de REQs activos para Regla 3
    const activeTCodes = new Set(
      allItems
        .filter(i => _itemTypeGen2(i) === 'TKT' &&
          activeRCodes.has(i.parentId || i.parent))
        .map(i => i.code)
    );
    exportItems = _allItemsWithHistorico().filter(i => {
      // TKT2 AC-1 + INC-202607-035 (mod:53): 'historico' nunca aparece individualmente en
      // ## Ítems — sin excepción por sprint. Único punto de visibilidad de historico en este
      // export: el resumen agregado por sprint en ## Historial de sprints
      // (_buildSprintHistorialMd). El detalle ítem por ítem no le pertenece a este generador
      // — vive exclusivamente en Checkpoint Log (§12, _ob-DocStandards), fuera de scope de
      // este archivo. Reemplaza la regla anterior que dejaba pasar el historico del sprint
      // cerrado más reciente.
      if (i.status === 'historico') return false;
      if (i.status === 'en curso') return false; // B-202606-052: status no canónico — fuera de BR-Ecosystem §5
      if (i.status === 'backlog') return false; // [tmp:tkt4-infra-fallback] AC-2: status no canónico — fuera de BR-Ecosystem §5
      // Regla 1: status activos directos — incluye en-revision
      if (i.status === 'pendiente' || i.status === 'en-revision') return true;
      // TKT1 AC-3: Regla 1b — REQ en cualquier status activo Gen2 no cubierto por Regla 1
      if (_itemTypeGen2(i) === 'REQ' &&
          (i.status === 'en-proceso' || i.status === 'bloqueado' || i.status === 'orphaned')) return true;
      // TKT1 AC-4/AC-6: Regla 1c — DISC activa, independiente de sprint (Q-DISC persistente)
      if (_isActiveDisc(i)) return true;
      // TKT1 AC-4/AC-6: Regla 1d — PRB/KE/CHG activos en Q-INC, independiente de sprint
      if (_isActiveQIncItem(i)) return true;
      // Regla 2: hijos (TKT o INC) de REQ activo — exportar sin importar su status
      if ((_itemTypeGen2(i) === 'TKT' || _itemTypeGen2(i) === 'INC') &&
          (i.parentId || i.parent) && activeRCodes.has(i.parentId || i.parent)) return true;
      // Regla 3 (T-202606-058): INC con triggered_by apuntando a TKT del REQ activo y status pendiente o en-revision
      if (_itemTypeGen2(i) === 'INC' &&
          (i.status === 'pendiente' || i.status === 'en-revision') &&
          i.triggered_by && activeTCodes.has(i.triggered_by)) return true;
      // Sprint cerrado más reciente: ítems done (historico excluido siempre — Regla 0, TKT2 AC-1)
      // B-202606-014: normalizar i.sprint antes de comparar
      if (i.status === 'done' && _normLastClosedId && _normSprintId(i.sprint) === _normLastClosedId) return true;
      // Sprint activo: ítems done o descartados
      // B-202606-014: normalizar i.sprint antes de comparar
      if (_normActiveSprintId && _normSprintId(i.sprint) === _normActiveSprintId &&
          (i.status === 'done' || i.status === 'descartado')) return true;
      return false;
    });
  }

  // T-202606-068: _computeBacklogCounters — fuente única para itemCounters y counters (max-ID).
  // Los tres bloques (Estado actual · Índice · Estadísticas) derivan de esta misma llamada.
  // B-202606-005: itemC cuenta desde exportItems para que el índice refleje solo los ítems
  // efectivamente renderizados en ## Ítems. maxId usa _allItemsWithHistorico() para preservar
  // los contadores máximos de ID sin importar el status del ítem — INC-[pendiente-ID] (2026-07-18):
  // getItems() excluye 'historico' desde T-202606-106, así que un TKT/REQ archivado tras cierre
  // de sprint quedaba fuera del escaneo y "Últimos IDs" subestimaba el consecutivo real por tipo
  // (ver REQ-202607-015 — TKT-202607-044/045/046/056/057 historico no contaban para maxId.TKT/REQ).
  // [tmp:tkt1-itemtype-fn] AC-2/AC-5: claves Gen 2 — REQ/TKT/INC/DISC/PRB/CHG.
  // Regex de extracción de NNN migrado a /-(\\d{3})$/ para soportar prefijos multi-char Gen 2.
  const _computeBacklogCounters = () => {
    const allForCount = _allItemsWithHistorico();
    const itemC = { REQ:0, TKT:0, INC:0, DISC:0, PRB:0, CHG:0 };
    const maxId  = { REQ:0, TKT:0, INC:0, DISC:0, PRB:0, CHG:0 };
    exportItems.forEach(i => {
      if (!i.code) return;
      const t = _itemTypeGen2(i);
      if (itemC[t] !== undefined) itemC[t]++;
    });
    allForCount.forEach(i => {
      if (!i.code) return;
      const t = _itemTypeGen2(i);
      if (maxId[t] === undefined) return;
      const m = i.code.match(/-(\d{3})$/);
      if (m) { const n = parseInt(m[1]); if (n > maxId[t]) maxId[t] = n; }
    });
    const activeC = getActiveTracker().counters || {};
    Object.keys(activeC).forEach(t => {
      if (maxId[t] !== undefined && activeC[t] > (maxId[t] || 0)) maxId[t] = activeC[t];
    });
    return { itemC, maxId };
  };
  const { itemC: itemCounters, maxId: counters } = _computeBacklogCounters();
  // [tmp:tkt-backlog-gen-housekeeping] AC-2: Contadores: una línea por tipo — reemplaza
  // la agrupación 'Tipo (status):' con códigos y el label 'Ítems:' de una sola línea combinada.
  const contadoresStr = ['REQ', 'TKT', 'INC', 'DISC', 'PRB', 'CHG']
    .map(t => `${t}: ${itemCounters[t]}`)
    .join('\n');
  const counterStr = `REQ=${String(counters.REQ).padStart(3,'0')} | TKT=${String(counters.TKT).padStart(3,'0')} | INC=${String(counters.INC).padStart(3,'0')} | DISC=${String(counters.DISC).padStart(3,'0')} | PRB=${String(counters.PRB).padStart(3,'0')} | CHG=${String(counters.CHG).padStart(3,'0')}`;

  // T-202606-061: orden canónico OBDS §3 §6 en ## Ítems
  // (1) Rs sprint activo + hijos, (2) T/B sprint activo huérfanos,
  // (3) Rs sprints programados/otros + hijos, (4) Rs sin sprint (Q-Backlog) + hijos, (5) DISC (Q-DISC)
  // [tmp:tkt3-sprint-zona] AC-1: grupo 'sin sprint' detectado por ausencia de sprint —
  // ya no compara contra string 'icebox'. DISC siempre cae en su propio grupo via _itemTypeGen2.
  const _normSprintIdForSort = val => {
    if (!val) return null;
    const m = String(val).match(/^([A-Za-z]+-S-?\d+)/i);
    return m ? m[1] : val;
  };
  const _activeSprintIdForSort = (() => {
    const sp = (state.sprints || []).find(s => s.status === 'active' && s.current === true)
            || (state.sprints || []).find(s => s.status === 'active');
    return sp ? sp.id : null;
  })();
  const _programadosIdsForSort = new Set(
    (state.sprints || [])
      .filter(s => s.status === 'programado' || s.status === 'scheduled')
      .map(s => s.id)
  );
  const _sprintGroup = item => {
    const normId = _normSprintIdForSort(item.sprint);
    if (normId && normId === _activeSprintIdForSort) return 0;   // sprint activo
    if (normId && _programadosIdsForSort.has(normId)) return 1;  // programado
    if (_itemTypeGen2(item) === 'DISC') return 3;                // DISC — siempre Q-DISC, grupo propio
    if (!normId) return 2;                                       // sin sprint (Q-Backlog)
    return 1; // sprint asignado no activo ni Q-Backlog → grupo otros
  };
  const _typeOrder = code => {
    const t = _itemTypeGen2({ code });
    const order = { REQ:0, TKT:1, INC:2, DISC:3, PRB:4, CHG:6 };
    return order[t] !== undefined ? order[t] : 7;
  };
  const sortedExportItems = [...exportItems].sort((a, b) => {
    const ga = _sprintGroup(a), gb = _sprintGroup(b);
    if (ga !== gb) return ga - gb;
    return _typeOrder(a.code) - _typeOrder(b.code);
  });

  const { mainMd, orphansMd } = _buildItemsMd(sortedExportItems);

  // TKT4 AC-2/AC-3: ## Ítems declara vacío explícito en vez de quedar en blanco entre separadores.
  // Si hay REQ/TKT refinados sin sprint asignado (Q-Backlog), lo declara aparte —
  // distingue "sprint vacío" de "backlog vacío" (_ob-DocStandards §3 v1.10).
  let itemsBodyMd = mainMd;
  if (!mainMd) {
    const qBacklogItems = getItems().filter(i => {
      const t = _itemTypeGen2(i);
      return (t === 'REQ' || t === 'TKT') && !i.sprint;
    });
    itemsBodyMd = qBacklogItems.length
      ? `Sin ítems pendientes en sprint activo.\n\nQ-Backlog: ${qBacklogItems.length} ítems refinados en espera.\n\n${qBacklogItems.map(i => `- ${i.code} · ${i.title || '(sin título)'}`).join('\n')}`
      : `Sin ítems pendientes en sprint activo.`;
  }

  const totalItems = exportItems.length;
  const doneCount = exportItems.filter(i => i.status === 'done').length;
  const enRevisionCount = exportItems.filter(i => i.status === 'en-revision').length; // T-202606-110

  const currentStateMd = _buildCurrentStateMd();
  const sprintActivoMd = _buildSprintActivoMd();
  const sprintsProgramadosMd = _buildSprintsProgramadosMd(); // T-202606-060
  const historialItemsMd = _buildHistorialItemsMd(exportItems); // B-202606-010
  // INC-202607-035 (mod:53): historicoTailMd ya no une dos secciones — '## Historico — detalle'
  // fue retirada (no le pertenece a este generador, ver §3 _ob-DocStandards). Único contenido:
  // el resumen por sprint, que puede ser '' (AC-3 de _buildSprintHistorialMd).
  const historialSprintsMd = _buildSprintHistorialMd(); // [tmp:tkt-historial-sprints] TKT1 — puede ser '' (AC-3)
  const historicoTailMd = historialSprintsMd;
  const qDiscMd = _buildQDiscMd(exportItems); // [tmp:tkt-backlog-gen-core] AC-1
  const qIncMd = _buildQIncMd(exportItems); // [tmp:tkt-backlog-gen-core] AC-3
  const _appVerStr = _effectiveVersion();
  const pfx = _docPrefix();

  // [tmp:tkt-backlog-gen-housekeeping] AC-4: encabezado declara dueño: y descripción breve —
  // reemplaza 'App: AI-Tracker-${_appVerStr}' (campo no canónico según _ob-DocStandards).
  // [tmp:tkt-backlog-gen-housekeeping] AC-5: título del doc sigue patrón canónico
  // _[PREFIJO]-backlog-v[X].[Y].[Z].md — reemplaza '${pfx}-BACKLOG_${ver}.md'.
  const md = `# _${pfx}-backlog-${newVersion.replace(/_/g, ".")}.md
<!-- Versión: ${newVersion} | Última actualización: ${dateStr} | dueño: PO · Cael | Backlog exportado del proyecto -->
${_infraVersionStr()}

---

${sprintActivoMd}${sprintsProgramadosMd}## Meta

| Campo | Valor |
|---|---|
| Proyecto | ${_projName} |
| Versión del backlog | ${newVersion} |
| Última actualización | ${dateStr} |
| Generado por | Locus — exportado desde app |

---

${currentStateMd}${qDiscMd}${qIncMd}## Índice de estado

\`\`\`
Contadores:
${contadoresStr}
Últimos IDs: ${counterStr}
App: ${_appVerStr} — exportado desde tracker
\`\`\`

---

## Ítems

---

${itemsBodyMd}

---

${orphansMd ? `## Ítems huérfanos\n\n> TKTs e INCs sin parent declarado — requieren revisión de Cael antes del próximo sprint.\n\n---\n\n${orphansMd}\n\n---\n\n` : ''}${historialItemsMd ? `${historialItemsMd}\n---\n\n` : ''}${historicoTailMd}
---

## Estadísticas finales

| Métrica | Valor |
|---------|-------|
| Ítems totales | ${totalItems} |
| Done | ${doneCount} |
| En revisión | ${enRevisionCount} |
| Pendientes | ${exportItems.filter(i => i.status === 'pendiente').length} |
| Próxima versión | ${newVersion} |
`;

  return { md, meta, counters, dateStr };
}

export function _generateBacklogMd(newVersion, opts = {}) {
  const pfx = _docPrefix();
  const { md, meta, counters, dateStr } = _generateBacklogContent(newVersion, opts);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // [tmp:tkt-backlog-gen-housekeeping] AC-5: naming canónico _[PREFIJO]-backlog-v[X].[Y].[Z].md
  a.download = `_${pfx}-backlog-${newVersion.replace(/_/g, ".")}.md`;
  a.click();
  URL.revokeObjectURL(url);

  meta.version = newVersion;
  meta.updated = dateStr;
  meta.counters = counters;
  localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
  updateBacklogBanner();

  showToast('download', `📥 _${pfx}-backlog-${newVersion}.md descargado`);
}


// T-202606-017: determina si un T tiene bloqueo activo.
// Un T está bloqueado cuando al menos un código en depends_on apunta a un T
// cuyo status es 'pendiente' o 'en-revision'. 'descartado' equivale a done — no bloquea.
function _isItemBlocked(item) {
  if (!item.dependsOn || !item.dependsOn.length) return { blocked: false, blockers: [] };
  const blockers = [];
  item.dependsOn.forEach(depCode => {
    const dep = getItems().find(i => i.code === depCode);
    if (!dep) return; // código no resuelto — no bloquea
    const s = dep.status || 'pendiente';
    if (s === 'pendiente' || s === 'en-revision') blockers.push(depCode);
    // 'done', 'descartado', 'historico' — no bloquean
  });
  return { blocked: blockers.length > 0, blockers };
}

// T-202606-017: genera los campos de un ítem sin el encabezado de título.
// T-202606-109: campos no canónicos movidos a bloque metadata al final.
//   Campos nuevos: schema_version (AC-2), depends_on array vacío (AC-3), no_incluye (AC-4), intencion (AC-5).
//   AC-3: campo canónico verificado = dependsOn (camelCase) — corregido por INC triggered_by TKT-202607-063.
//   La entrada del CHECKPOINT usa depends_on (snake_case); mergeBacklogFromTG lo normaliza a
//   dependsOn antes de _assignPendingIds (ver locus-backlog-item.js) — ese es el campo que vive
//   en memoria y el que este generador debe leer.
// T-202606-071: campos calculados para Ts y Bs del sprint activo.
// Entrada: item (T o B), sessions (array flat de todas las sesiones del proyecto activo).
// Retorna objeto con last_checkpoint, last_mod, gap_activo, qa_iteracion — ausente si no aplica.
function _computeCalcFields(item, sessions) {
  if (!item.code) return {};
  const code = item.code;

  // Sesiones que referencian este ítem — ordenadas cronológicamente ascendente por id numérico
  const refs = sessions
    .filter(s => Array.isArray(s.trackerRefs) && s.trackerRefs.includes(code))
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));

  if (!refs.length) return {};

  const result = {};

  // last_checkpoint: título de la sesión más reciente con trackerRefs que incluye el código
  const lastRef = refs[refs.length - 1];
  if (lastRef.title) result.last_checkpoint = lastRef.title;

  // last_mod: 'mod:N · autor:Rol' del primer objeto archivos de la sesión más reciente con archivos no vacío
  const lastWithArchivos = [...refs].reverse().find(s => Array.isArray(s.archivos) && s.archivos.length > 0);
  if (lastWithArchivos) {
    const first = lastWithArchivos.archivos[0];
    if (first && first.mod !== undefined && first.autor) {
      result.last_mod = `mod:${first.mod} · autor:${first.autor}`;
    }
  }

  // gap_activo — señal primaria: devolucion_cael explícita
  const refsWithDC = refs.filter(s => s.devolucion_cael !== undefined && s.devolucion_cael !== null);
  if (refsWithDC.length > 0) {
    // Usar la sesión más reciente con devolucion_cael declarado
    const lastDC = [...refsWithDC].sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const latestDC = lastDC[lastDC.length - 1];
    if (latestDC.devolucion_cael === true) {
      // true: verificar si hay sesión posterior con rol PO
      const laterPO = refs.find(s =>
        parseInt(s.id) > parseInt(latestDC.id) &&
        typeof s.rol === 'string' && s.rol.startsWith('PO')
      );
      result.gap_activo = !laterPO;
    } else {
      result.gap_activo = false;
    }
  } else {
    // Fallback: sin devolucion_cael en ninguna sesión del ítem
    const lastSess = refs[refs.length - 1];
    const isLastQA = typeof lastSess.rol === 'string' && lastSess.rol.startsWith('QA');
    const hasPriorPO = refs.some(s =>
      s !== lastSess &&
      typeof s.rol === 'string' && s.rol.startsWith('PO')
    );
    result.gap_activo = isLastQA && hasPriorPO;
  }

  // qa_iteracion: conteo de sesiones con rol que comienza con 'QA'
  const qaCount = refs.filter(s => typeof s.rol === 'string' && s.rol.startsWith('QA')).length;
  if (qaCount > 0) result.qa_iteracion = qaCount;

  return result;
}

function _buildItemFieldsMd(item, state) {
  let md = '';
  md += `**Priority:** ${item.priority || 'medium'}\n`;
  const _area = (item.area || '').includes('**') ? '' : (item.area || '').trim();
  md += `**Area:** ${_area}\n`;
  md += `**Effort:** ${item.effort || 1}\n`;
  md += `**Status:** ${item.status || 'pendiente'}\n`;
  md += `**SchemaVersion:** 2\n`; // T-202606-065: siempre schema_version 2 — independiente del valor en storage
  if (item.discardReason) md += `**DiscardReason:** ${item.discardReason}\n`;
  if (item.discardRef)    md += `**DiscardRef:** ${item.discardRef}\n`;
  if (item.sprint) {
    // T-202606-067: DISC siempre exportan con zona: Q-DISC — independiente del valor en storage
    const _itemT = _itemTypeGen2(item);
    const _sprintVal = (_itemT === 'DISC') ? `${_docPrefix()}-Q-DISC` : item.sprint;
    // [pendiente-ID]: leer sprint_id y sprint_name directamente si están presentes (formato nuevo).
    // Fallback a split de item.sprint para ítems legacy sin campos separados.
    let _sprintId, _sprintName;
    if (item.sprint_id) {
      _sprintId   = item.sprint_id;
      _sprintName = item.sprint_name || '';
    } else {
      const _sprintParts = String(_sprintVal).split(' · ');
      _sprintId   = _sprintParts[0];
      _sprintName = _sprintParts.length > 1 ? _sprintParts.slice(1).join(' · ') : '';
    }
    md += `**SprintId:** ${_sprintId}\n`;
    if (!_sprintId.includes('Q-DISC') && _sprintName) md += `**SprintName:** ${_sprintName}\n`;
  }
  if (item.role)     md += `**Role:** ${item.role}\n`;
  if (item.parentId) md += `**ParentId:** ${item.parentId}\n`;
  // T-202606-065: dependsOn — emitir siempre en TKTs con [] si no existe
  // INC triggered_by TKT-202607-063: leía item.depends_on (snake_case) — el campo canónico
  // en memoria es item.dependsOn (camelCase, ver mergeBacklogFromTG en locus-backlog-item.js).
  if (_itemTypeGen2(item) === 'TKT') {
    const _deps = Array.isArray(item.dependsOn) ? item.dependsOn : [];
    md += `**DependsOn:** ${_deps.length ? _deps.join(', ') : '[]'}\n`;
  } else if (item.dependsOn != null) {
    md += `**DependsOn:** ${item.dependsOn.length ? item.dependsOn.join(', ') : '[]'}\n`;
  }
  if (item.origin)   md += `**Origin:** ${item.origin}\n`;
  if (item.blockedBy && item.blockedBy.length) md += `**BlockedBy:** ${item.blockedBy.join(', ')}\n`;
  // T-202606-065: triggered_by — emitir siempre en INC con n/a si no existe
  if (_itemTypeGen2(item) === 'INC') {
    md += `**TriggeredBy:** ${item.triggered_by || 'n/a'}\n`;
  }
  // T-202606-030: triggered_by en TKT y DISC — opcional, omitir si no existe
  if ((_itemTypeGen2(item) === 'TKT' || _itemTypeGen2(item) === 'DISC') && item.triggered_by) {
    md += `**TriggeredBy:** ${item.triggered_by}\n`;
  }
  // T-202606-030: promovida_a — solo DISC con promovida_a declarado
  if (_itemTypeGen2(item) === 'DISC' && item.promovida_a) {
    md += `**PromovidaA:** ${item.promovida_a}\n`;
  }
  // T-202606-030: origenDisc — REQ, TKT, INC que trazan su origen a una DISC
  if (item.code && item.origenDisc) {
    md += `**OrigenDisc:** ${item.origenDisc}\n`;
  }
  if (item.archivos && item.archivos.length)   md += `**Archivos:** ${item.archivos.join(', ')}\n`;
  if (item.desc)     md += `\n${item.desc}\n`;
  // AC-5: bloque intencion estructurado — solo si existe
  if (item.intencion) {
    md += `\n**Intención:**\n`;
    if (item.intencion.problema)    md += `- Problema: ${item.intencion.problema}\n`;
    if (item.intencion.done_cuando) md += `- Done cuando: ${item.intencion.done_cuando}\n`;
    if (item.intencion.no_incluye)  md += `- No incluye: ${item.intencion.no_incluye}\n`;
  }
  // T-202606-065: no_incluye — emitir siempre en TKTs. Es string (schema __BR-Ecosystem §8),
  // no array — INC-PP-no-incluye-forEach: item.no_incluye.forEach no es función sobre un string.
  if (_itemTypeGen2(item) === 'TKT') {
    if (item.no_incluye) {
      md += `\n**No incluye:** ${item.no_incluye}\n`;
    } else {
      md += `\n**No incluye:** n/a\n`;
    }
  }
  if (item.ac && item.ac.length) {
    md += `\n### Criterios de aceptación\n`;
    item.ac.forEach(c => {
      const checked = item.status === 'done' ? 'x' : ' ';
      md += `- [${checked}] ${c}\n`;
    });
  }
  if (item.notes) md += `\n**Notes:** ${item.notes}\n`;
  // T-202606-071: campos calculados — solo TKTs e INC del sprint activo (no Q-DISC, no REQ, no DISC)
  const _itemTForCalc = _itemTypeGen2(item);
  // [tmp:tkt-backlog-gen-housekeeping] AC-3: campos calculados solo para TKT — INC excluido
  if (_itemTForCalc === 'TKT' && item.sprint && !item.sprint.includes('Q-')) {
    const _activeSprint = (state.sprints || []).find(s => s.status === 'active');
    const _activeSprintId = _activeSprint ? _activeSprint.id : null;
    const _normSId = val => {
      if (!val) return val;
      const m = String(val).match(/^([A-Za-z]+-S\d+)/i);
      return m ? m[1] : val;
    };
    if (_activeSprintId && _normSId(item.sprint) === _normSId(_activeSprintId)) {
      const _activeProj = getActiveProject();
      const _allSessions = _activeProj ? (_activeProj.sessions || []) : [];
      const calc = _computeCalcFields(item, _allSessions);
      const _calcParts = [];
      if (calc.last_checkpoint !== undefined) _calcParts.push(`LastCheckpoint:${calc.last_checkpoint}`);
      if (calc.last_mod        !== undefined) _calcParts.push(`LastMod:${calc.last_mod}`);
      if (calc.gap_activo      !== undefined) _calcParts.push(`GapActivo:${calc.gap_activo}`);
      if (calc.qa_iteracion    !== undefined) _calcParts.push(`QaIteracion:${calc.qa_iteracion}`);
      if (_calcParts.length) md += `<!-- calc: ${_calcParts.join(' · ')} -->\n`;
    }
  }
  // AC-1: createdAt, statusChangedAt, impact, version → bloque metadata al final
  const _metaParts = [];
  if (item.createdAt)       _metaParts.push(`CreatedAt:${item.createdAt}`);
  if (item.statusChangedAt) _metaParts.push(`StatusChangedAt:${item.statusChangedAt}`);
  if (item.impact)          _metaParts.push(`Impact:${item.impact}`);
  if (item.version)         _metaParts.push(`Version:${item.version}`);
  if (item.doneAt)          _metaParts.push(`DoneAt:${item.doneAt}`);
  if (_metaParts.length)    md += `<!-- metadata: ${_metaParts.join(' · ')} -->\n`;
  return md;
}

// T-202606-017: estructura nueva — Rs como headers H3 con Ts anidados (H4) e indicadores de bloqueo.
// T-202606-059: retorna { mainMd, orphansMd } — orphansMd contiene T y B sin parent declarado.
//   orphansMd es string vacío cuando no hay huérfanos.
function _buildItemsMd(items) {
  const state = getState();
  const src = items || getItems();

  // Índice de TKTs por parentId para lookup O(1)
  const tsByParent = {};
  src.forEach(i => {
    if (_itemTypeGen2(i) !== 'TKT') return;
    const pid = i.parentId || i.parent;
    if (!pid) return;
    if (!tsByParent[pid]) tsByParent[pid] = [];
    tsByParent[pid].push(i);
  });

  // TKTs con parent declarado — se renderizan bajo su REQ, no en la lista plana
  const tsWithParent = new Set(
    src.filter(i => _itemTypeGen2(i) === 'TKT' && (i.parentId || i.parent))
       .map(i => i.code)
  );

  // T-202606-064: AC-1 — triggerBSet: INC en src sin parentId con triggered_by apuntando a TKT hijo de REQ activo.
  // activeTCodes proviene de _generateBacklogContent via el array ya filtrado en exportItems —
  // reconstruimos el set localmente desde src para que _buildItemsMd sea autónoma.
  const _activeTCodesLocal = (() => {
    const activeRCodesLocal = new Set(
      src
        .filter(i => _itemTypeGen2(i) === 'REQ' && i.status !== 'done' && i.status !== 'descartado')
        .map(i => i.code)
    );
    return new Set(
      src
        .filter(i => _itemTypeGen2(i) === 'TKT' &&
          activeRCodesLocal.has(i.parentId || i.parent))
        .map(i => i.code)
    );
  })();
  const triggerBSet = new Set(
    src
      .filter(i => _itemTypeGen2(i) === 'INC' &&
        !(i.parentId || i.parent) &&
        i.triggered_by && _activeTCodesLocal.has(i.triggered_by))
      .map(i => i.code)
  );

  // T-202606-059: AC-1 — huérfanos: TKT o INC en src sin parentId y sin parent declarado
  // T-202606-064: AC-3 — INC en triggerBSet excluidos de orphanCodes
  const orphanCodes = new Set(
    src
      .filter(i => i.code &&
        (_itemTypeGen2(i) === 'TKT' || _itemTypeGen2(i) === 'INC') &&
        !(i.parentId || i.parent) &&
        !triggerBSet.has(i.code))
      .map(i => i.code)
  );

  const sections = [];
  const orphanSections = [];

  src.forEach(item => {
    if (!item.code) return;
    const type = _itemTypeGen2(item);

    // TKTs con parent — se renderizan bajo su REQ
    if (type === 'TKT' && tsWithParent.has(item.code)) return;

    // [tmp:tkt-backlog-gen-core] AC-9: ítems que pertenecen a Q-DISC/Q-INC por _isActiveDisc/
    // _isActiveQIncItem se excluyen del loop genérico — se renderizan únicamente en su sección
    // dedicada ('## Q-DISC' / '## Q-INC'), nunca en '## Ítems'.
    if (_isActiveDisc(item) || _isActiveQIncItem(item)) return;

    // T-202606-059: AC-2 — huérfanos excluidos del loop normal, acumulados en orphanSections
    if (orphanCodes.has(item.code)) {
      const { blocked, blockers } = type === 'TKT' ? _isItemBlocked(item) : { blocked: false, blockers: [] };
      const blockerTag = blocked ? ` ⚠ bloqueado por ${blockers.join(', ')}` : '';
      let md = `### ${item.code} · ${item.title || '(sin título)'}${blockerTag}\n`;
      md += _buildItemFieldsMd(item, state);
      orphanSections.push(md);
      return;
    }

    if (type === 'REQ') {
      // ── REQ como header H3 con TKTs anidados ──────────────────────────────
      let md = `### ${item.code} · ${item.title || '(sin título)'}\n`;
      md += _buildItemFieldsMd(item, state);

      const children = tsByParent[item.code] || [];
      if (children.length) {
        md += `\n#### Tickets\n\n`;
        children.forEach(t => {
          const { blocked, blockers } = _isItemBlocked(t);
          const blockerTag = blocked ? ` ⚠ bloqueado por ${blockers.join(', ')}` : '';
          md += `##### ${t.code} · ${t.title || '(sin título)'}${blockerTag}\n`;
          md += _buildItemFieldsMd(t, state);
          md += '\n';
        });
      }
      // T-202606-064: AC-2 — INC en triggerBSet cuyo triggered_by apunta a TKT hijo de este REQ
      // se renderizan después del último TKT hijo, bajo el mismo encabezado del REQ
      const triggerBsForR = src.filter(i =>
        triggerBSet.has(i.code) &&
        i.triggered_by && _activeTCodesLocal.has(i.triggered_by) &&
        (tsByParent[item.code] || []).some(t => t.code === i.triggered_by)
      );
      if (triggerBsForR.length) {
        if (!children.length) md += `\n#### Tickets\n\n`;
        triggerBsForR.forEach(b => {
          md += `##### ${b.code} · ${b.title || '(sin título)'}\n`;
          md += _buildItemFieldsMd(b, state);
          md += '\n';
        });
      }
      sections.push(md);

    } else if (type === 'TKT') {
      // ── TKT sin REQ padre pero con parent declarado — no debería llegar aquí post-059
      const { blocked, blockers } = _isItemBlocked(item);
      const blockerTag = blocked ? ` ⚠ bloqueado por ${blockers.join(', ')}` : '';
      let md = `### ${item.code} · ${item.title || '(sin título)'}${blockerTag}\n`;
      md += _buildItemFieldsMd(item, state);
      sections.push(md);

    } else {
      // ── DISC, INC, PRB, KE, CHG — render plano
      let md = `### ${item.code} · ${item.title || '(sin título)'}\n`;
      md += _buildItemFieldsMd(item, state);
      sections.push(md);
    }
  });

  // T-202606-059: AC-6 — orphansMd usa mismo formato _buildItemFieldsMd (ya aplicado arriba)
  const mainMd = sections.join('\n---\n\n');
  const orphansMd = orphanSections.length
    ? orphanSections.join('\n---\n\n')
    : '';

  return { mainMd, orphansMd };
}

// B-202606-010: ## Historial — ítems con status done que no aparecen en ## Ítems.
// exportItems ya incluye done del sprint activo y del último sprint cerrado — esos no se duplican aquí.
// Entrada: exportItems (array ya filtrado para ## Ítems).
// Salida: string con sección ## Historial, o '' si no hay ítems done adicionales (AC-2).
function _buildHistorialItemsMd(exportItems) {
  const exportCodes = new Set(exportItems.map(i => i.code));
  const doneItems = getItems().filter(i =>
    i.status === 'done' &&
    i.code &&
    !exportCodes.has(i.code)
  );
  if (!doneItems.length) return ''; // AC-2: sin sección vacía

  // Ordenar por tipo luego por código
  const _typeOrder = code => {
    const t = _itemTypeGen2({ code });
    const order = { REQ:0, TKT:1, INC:2, DISC:3, PRB:4, CHG:6 };
    return order[t] !== undefined ? order[t] : 7;
  };
  const sorted = [...doneItems].sort((a, b) => {
    const to = _typeOrder(a.code) - _typeOrder(b.code);
    if (to !== 0) return to;
    return (a.code || '').localeCompare(b.code || '');
  });

  const state = getState();
  const sections = sorted.map(item => {
    let md = `### ${item.code} · ${item.title || '(sin título)'}\n`;
    md += _buildItemFieldsMd(item, state);
    return md;
  });

  // INC-202607-036: heading original '## Historial' era homónimo parcial de
  // '## Historial de sprints' (_ob-DocStandards §9, resumen agregado por sprint) — riesgo de
  // que Cael o el founder confundan ambas secciones al leer el doc exportado. Renombrado para
  // que el título describa el contenido real: ítems `done` individuales fuera de exportItems.
  return `## Historial — ítems done adicionales\n\n${sections.join('\n---\n\n')}\n`;
}

// ── Context export ────────────────────────────────────────────────────────────
function _generateContextContent() {
  const raw = localStorage.getItem(_tplKey('context-raw'));
  if (!raw) return null;
  const _ctxVer = _effectiveVersion();

  let isJson = false;
  try { const o = JSON.parse(raw.trim()); isJson = typeof o === 'object' && o !== null && 'version' in o; } catch(e) {}
  const ext      = isJson ? 'json' : 'md';
  const mime     = isJson ? 'application/json' : 'text/markdown';
  const fileName = `${_docPrefix()}-CONTEXT_${_ctxVer}.${ext}`;
  return { raw, ext, mime, fileName };
}

export function exportContextMd() {
  const ctx = _generateContextContent();
  if (!ctx) { showToast('warning', 'Sin datos — importa primero'); return; }
  const { raw, mime, fileName } = ctx;

  _showExportConfirmModal('CONTEXT', fileName, () => {
    const b = new Blob([raw], { type: mime });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = fileName;
    a.click(); URL.revokeObjectURL(u);
    _blogLog('exportado', fileName, '', 'context');
    showToast('success', 'CONTEXT exportado');
  });
}

// B-202606-024: window.export* eliminados — todos los consumidores usan ESM import
// B-202606-XXX: locus-ui-shell.js no puede importar directamente (ciclo T-202606-055)
// — registrar listeners shell: para que ui-shell pueda invocar via dispatch
window.addEventListener('shell:export-backlog', (e) => exportBacklogMd((e && e.detail) || {}));
window.addEventListener('shell:export-history', () => exportFullHistoryMd());
window.addEventListener('shell:export-context', () => exportContextMd());
