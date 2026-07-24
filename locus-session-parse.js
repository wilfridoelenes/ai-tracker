// [PP] mod:138 · autor:Rune · 2026-07-24 UTC-6
// TKT-078 (REQ-202607-022, ref_id CAEL-0724-05): _resolveCheckpointBatch — cada entrada de
// metas ahora lleva idx: b.idx (spread sobre el objeto de _extractCkptMeta). Antes metas[i]
// dependía de que el consumidor asumiera correspondencia 1:1 con la posición secuencial de
// bloques válidos — divergía de b.idx (posición real en _parsedBlocks) en batches con bloques
// inválidos intercalados. Mismo patrón que TKT1 (idx en tgItems/patchItems) y skipped (idx desde
// TKT4). Sin cambio de firma pública — metas sigue siendo array, solo gana un campo por entrada.
// contract_update: sí — ver CHECKPOINT de este TKT.
// [PP] mod:137 · autor:Rune · 2026-07-24 UTC-6
// TKT1 (REQ CAEL-0724-02 · ref_id CAEL-0724-03): _resolveCheckpointBatch — cada ítem de
// tgItems/patchItems combinado en Paso 3 ahora lleva idx: b.idx (índice del bloque de origen
// dentro de blocks). Antes idx solo existía en skipped y como variable local del forEach de
// Paso 3, nunca expuesto en los ítems ya combinados. Habilita que mergeBacklogFromTG (TKT2,
// locus-backlog-item.js) agrupe por bloque en el panel DIFF. Cambia el invariant documentado de
// "batch de tamaño 1 → tgItems idéntico sin diferencia observable" (_Locus-module-contracts) —
// ahora ese único ítem también lleva idx:0, diferencia esperada de este TKT, no regresión.
// contract_update: sí — ver CHECKPOINT de TKT1.
// [PP] mod:136 · autor:Rune · 2026-07-24 UTC-6
// TKT (REQ CAEL-0724-01): retiro de KE residual — fusionado a PRB.root_cause_confirmed
// (infra_version 51). _ITIL_TYPES ya no incluye 'KE'. _VALID_KE_STATUS/_KE_STATUS_LIST
// retiradas (exports). Rama 'KE' de _buildItilItem retirada (alerta ke-sin-comportamiento-actual
// ya no aplica). _itilStatusSet/_itilStatusList sin rama KE. 3 mensajes de error corregidos
// (líneas ~471/1375/2275, antes listaban KE como valor válido) — código ya era inalcanzable
// vía _validTypes=_GEN2_TYPES desde TKT-202607-067 (locus-backlog-core.js mod:131), este TKT
// alinea el texto visible al founder y retira el resto del código muerto. Sin cambio de
// comportamiento para REQ/TKT/DISC/INC/PRB/CHG — verificado, mismos resultados exactos.
// [PP] mod:135 · autor:Rune · 2026-07-22 22:18 UTC-6
// TKT3 (REQ CAEL-0721-01): los 3 puntos de construcción de tgItems nunca propagaban
//   kill_criteria/next_role/design_intent/blocked_at/contract_update desde el ítem parseado —
//   mismo patrón de pérdida ya corregido para draft (TKT1/REQ-202607-027) y contract_detail
//   (TKT4/REQ-contract-rename), pero nunca aplicado a estos 5 campos. Además: contract_detail
//   faltaba en el sitio 1 (sesión embebida) y archivos faltaba en los sitios 2 y 3 (batch) —
//   inconsistencia entre los 3 sitios, alineados aquí. Ver locus-backlog-item.js TKT1 (mismo
//   REQ) — sin esta propagación, ese fix no tenía dato real que copiar.
// TKT (REQ CAEL-0720-22 · ref_id CAEL-0720-23 · módulo crítico, kill_criteria aprobado por
//   founder): handlePaste/handleInput ganan _routeParse(id, ta) — si _splitCheckpointBlocks
//   (ta.value).length > 1, delega a _processIngestBatch() en vez de parsePaste(id). Bloque único
//   (0 o 1 bloque) preserva el path histórico exacto, incluido el reintento 150/300ms de
//   handlePaste. Sin cambio de firma en ninguna de las dos funciones (contract_detail:
//   signature_change: false) — cambio interno de sideEffects únicamente. no_incluye: no toca
//   el botón/listener de #ingest-process-batch-btn (locus-sesiones.js) ni la lógica interna de
//   _splitCheckpointBlocks/_processIngestBatch.
// TKT4 (REQ CAEL-0718-01 · AC1): bloque de solo sprint_proposal en el modal batch ahora se
//   marca skipped:{type:'sprint_proposal'} (distinto de 'invalid') — _processIngestBatch muestra
//   aviso "se procesa en Tab Sprint" en vez de silenciarlo. AC2 verificado sin cambio de código:
//   locus-sprint.js ya hereda el gate §12 vía parseCheckpoint()._jsonParseError (línea ~809,
//   sin tocar en este TKT). Gap cerrado fuera del contrato original de este TKT: _processIngestBatch
//   pasaba ckptMeta:{} hardcodeado a showMergeDiffPanel — metas (TKT1) nunca llegaba a TKT3.
//   Sin este wire-up, la paridad batch/single del REQ no se cumplía pese a TKT1/TKT3 done — ver
//   CHECKPOINT de entrega. no_incluye: ai._parsed.sprintProposal (flujo A, línea ~1592) NO se
//   retira — su único consumidor conocido es locus-session-save.js, no adjunto en esta sesión ni
//   declarado en `archivos` del TKT — mismo bloqueo ya señalado por TKT2 (finn_release) en el
//   comentario adyacente a ese campo.
// [PP] mod:129 · autor:Rune · 2026-07-18 UTC-6
// Fix inline (triggered_by: TKT2 CAEL-0718-03): header de identidad no se había incrementado en
//   la entrega anterior — el cambio de TKT2 (retiro del pre-chequeo JSON.parse redundante en
//   _processIngestBatch, ver comentario en línea junto a esa función) ya estaba en el archivo
//   pegado por el founder, pero el header seguía declarando mod:128 (mismo valor que TKT1).
//   Mismo archivo, sin scope nuevo — solo corrección de metadata de identidad (BR-Core §7).
// [PP] mod:128 · autor:Rune · 2026-07-18 UTC-6
// TKT1 (REQ CAEL-0718-01 · AC1-3): agregada _extractCkptMeta(ckpt) — función pura compartida
//   que extrae resumen/aprendizaje/bloqueantes/decision/proximoPaso/docUpdates/
//   finnObservations/finnRelease/draft/draftRaw/rol/titulo de un ckpt ya parseado, sin
//   sprintProposal (AC3 — retirado por diseño, ver TKT4). Consumida en dos puntos: (1) parsePaste
//   reemplaza los ternarios inline que construían docUpdates/finnObservations/finnRelease/draft/
//   draftRaw/rol dentro de ai._parsed por _ckptMetaShared — mismos valores producidos, cero
//   regresión (AC1); sprintProposal sigue construyéndose inline, fuera del contrato de esta
//   función. (2) _resolveCheckpointBatch gana campo `metas` — un _extractCkptMeta por bloque
//   válido del batch, empujado en el mismo forEach que combina tgItems/patchItems (Paso 3), por
//   lo que metas[i] corresponde siempre al bloque i-ésimo válido en el mismo orden (AC1). Bloque
//   sin resumen → metas[i].resumen es '' sin excepción (AC2). _parseBatchBlock propaga `ckpt` en
//   su return (ya lo tenía, solo no llegaba hasta _resolveCheckpointBatch — ahora capturado en
//   Paso 1 junto a tgItems/patchItems). no_incluye: no modifica showMergeDiffPanel (TKT3, otro
//   archivo) ni retira sprint_proposal de este flujo (TKT4).
// [PP] mod:127 · autor:Rune · 2026-07-17 21:15 UTC-6
// TKT-202607-033 (REQ-202607-005 AC3): agregada const _INFRA_DOC_NAMES (br-core/br-ecosystem/
//   br-execution/ob-strategy, ver __OB-Strategy §5) y detección dentro del forEach de
//   ckpt._rawDocUpdates en parsePaste — cada entrada con doc normalizado (toLowerCase) presente
//   en el set dispara _blogLog('doc-update-infra-detectado', '[doc]::[section]', mensaje canónico
//   __BR-Ecosystem §11, 'backlog'). No bloquea el ingest — se ejecuta junto al processDocUpdate
//   ya existente, sin alterar su resultado (conflicto/msg). doc ausente o vacío → _duDocNorm
//   falsy → sin alerta (AC4). no_incluye: no toca _parseBatchBlock — mismo criterio de deuda
//   preexistente ya documentado en mod:126 (doc_updates no llega a processDocUpdate en el flujo
//   batch; esta detección hereda esa misma ausencia, consistente con el scope declarado del TKT
//   sobre este archivo). No modifica processDocUpdate ni locus-docs.js (no adjunto en esta sesión).
// [PP] mod:126 · autor:Rune · 2026-07-17 12:40 UTC-6
// TKT2 (REQ CAEL-0717-01 · AC1-4, parte 2/2 — ver locus-backlog-merge.js mod:53 para la parte
//   de render): propagado finn_release desde el CHECKPOINT JSON parseado. parseCheckpoint()
//   extrae _rawFinnRelease (mismo guard que _rawSprintProposal — objeto real, no array, {}
//   vacío tratado como ausente sin advertencia DocLog). Propagado a dos consumidores dentro de
//   este archivo: ai._parsed.finnRelease (flujo embebido) y _ckptMetaStandalone.finnRelease
//   (flujo standalone, consumido directo por showMergeDiffPanel en la línea de este mismo
//   archivo que lo invoca). Flujo batch (_gatedDoApplyBatch, ckptMeta:{} hardcodeado) no
//   recibe el campo — mismo criterio ya aplicado ahí a resumen/aprendizaje/sprintProposal,
//   deuda preexistente no ampliada por este TKT.
//   Bloqueo detectado durante implementación: el punto donde el flujo embebido invoca
//   showMergeDiffPanel vive en locus-session-save.js (comentario línea ~1515 de este archivo),
//   construyendo su propio ckptMeta — probablemente desde ai._parsed. Ese archivo no está
//   adjunto en esta sesión y no fue declarado en el campo `archivos` del TKT (solo
//   locus-backlog-item.css / locus-backlog-merge.js / locus-session-parse.js). Sin él, el
//   flujo embebido (la ruta más común de ingesta de CHECKPOINT) no muestra la tarjeta de
//   finn_release aunque el dato ya llegue propagado hasta ai._parsed — el flujo standalone
//   sí queda completo con este cambio. no_incluye: no modifica locus-session-save.js (no
//   adjunto) ni el flujo batch (fuera del scope declarado en `archivos`).
// [PP] mod:123 · autor:Rune · 2026-07-15 16:20 UTC-6
// CAEL-31 (TKT7): agregado _renderIngestResultItems() — lista de ítems en #ingest-result-items,
//   cierra el no_incluye de CAEL-29/30. Sin cambio de HTML — shell ya existía.
// [PP] mod:119 · autor:Rune · 2026-07-14 UTC-6
// CAEL-30 (TKT6): agregado próximo paso + bloqueantes (3 estados: n/a / referencia a ítem /
//   texto libre) a _showIngestValidationResult() — completa el no_incluye declarado en
//   CAEL-29 (mod:118, abajo). Nuevo helper _renderIngestBlockers() + shell estático en
//   index.html (#ingest-result-next-step, #ingest-result-blockers) — BR-Execution §5.
// [PP] mod:118 · autor:Rune · 2026-07-14 UTC-6
// CAEL-29 (TKT5): agregado _showIngestValidationResult() — migra identidad de resultado
//   (badges de proyecto/título/resumen/archivo) del bloque roto que usaba `prev` (variable
//   nunca declarada en el scope de parsePaste — ReferenceError en cada paste con title o
//   summary truthy, la rama principal tras validación exitosa) a #ingest-validation-result.
//   Fix inline (mismo archivo, sin scope nuevo, verificable por Finn junto con el TKT):
//   el bloque también leía `state.projects` vía `sess-proj-${id}` — selector de proyecto
//   por-Worker que no existe desde la migración a #ingest-ta global (CAEL-22). Reemplazado
//   por getActiveProject(), ya usado como fuente única de proyecto activo en el resto de
//   este archivo (líneas 1722/2258/2305 antes de este cambio). no_incluye: próximo paso /
//   bloqueantes (TKT6) y lista de ítems vía buildTGPreview (TKT7) — ninguno se renderiza en
//   #ingest-validation-result todavía; ambos TKTs sin especificar por Cael a la fecha de
//   este entrega. `esc()` y `buildTGPreview` quedan sin consumidor en esta función tras el
//   retiro del bloque — ambos con otros call sites en el archivo (ver imports), no huérfanos.
// [PP] mod:117 · autor:Rune · 2026-07-13 18:10 UTC-6
// CAEL-26 (TKT2): migrados los 4 warnings no bloqueantes de parsePaste() (rol ausente /
//   done-sin-AC / discrepancia raw-vs-parseado / CHECKPOINT duplicado) del target legacy
//   inexistente 'prev' a #ingest-validation-warnings, vía nuevo helper interno
//   _showIngestValidationWarning() (junto a _showIngestValidationError() de CAEL-25).
//   Botón #ingest-validation-force-btn compartido entre los 4 tipos: se clona en cada
//   invocación del helper para no acumular listeners entre warnings consecutivos.
//   _resetIngestValidationPanel() extendido para limpiar también #ingest-validation-warning-msg.
//   Bloque de pills de preview (~L635, if (title||summary){...}) sigue referenciando 'prev' —
//   fuera de scope de CAEL-26 (no_incluye), mapea a sub-vista .validation-result, TKT5 pendiente.
// TKT3 (REQ-[pendiente-ID] · Hallazgo fuera de scope de TKT1, promovido a DISC y evaluado en la
//   misma sesión): eliminada la función _tryIngestSprintProposal (ingesta legacy Markdown de
//   sprint_proposal, sin FromParsed) — su único importador (locus-session-save.js) fue retirado
//   en TKT1, dejándola sin call sites en todo el repo. Se retira también del comentario de
//   'Responsabilidad' del módulo. no_incluye: no toca parseSprintProposal ni
//   _tryIngestSprintProposalFromParsed — ambas con consumidor activo, verificado antes de este cambio.
// [PP] mod:109 · autor:Rune · 2026-07-12 UTC-6
// TKT2 (REQ-[pendiente-ID] · promovida de DISC-202607-011): eliminada la función y export
//   _applySprintInheritanceToItems — confirmado via grep exhaustivo (código real + comentarios)
//   cero call sites en todo el repo tras la consolidación de sprint_proposal a locus-sprint.js.
//   Se retira también el comentario de sección que la describía (T-202606-020, huérfano tras
//   este cambio). no_incluye: no toca _tryIngestSprintProposal ni parseSprintProposal — ver TKT1
//   (locus-session-save.js) para el import huérfano relacionado, symbol distinto sin tocar aquí.
// [PP] mod:108 · autor:Rune · 2026-07-12 UTC-6
// TKT (REQ-[pendiente-ID] · ref: consolidación de punto de entrada único de sprint_proposal —
//   decisión del founder): retirado el manejo de sprint_proposal del flujo standalone
//   (saveStandaloneCheckpoint) — eliminados el gate Step 0 (_spProposalSa/_validSpProposalSa/
//   _spStep0Approved/_gatedDoApply) y onApproveProposal/onRejectProposal de _ckptMetaStandalone.
//   showMergeDiffPanel ahora recibe _doApply directo, sin wrapper de gate. Retirado también el
//   campo sprintProposal de _standaloneLastParsed (parsePasteStandalone) — sin consumidor tras
//   este cambio. La única ruta de creación de sprint queda en locus-sprint.js (panel "+ Sprint
//   nuevo", Tab Sprint), vía paste propio + _tryIngestSprintProposalFromParsed. Ver mismo TKT en
//   locus-session-save.js (retiro de setPendingSprintProposal) y locus-sprint.js (paste nuevo).
//   no_incluye: no toca _tryIngestSprintProposalFromParsed (exportada, consumida ahora solo por
//   locus-sprint.js) ni _applySprintInheritanceToItems (exportada, sin consumidor conocido tras
//   este TKT — Hallazgo fuera de scope, export no eliminado sin visibilidad de otros
//   consumidores). No toca _tryIngestSprintProposal ni parseSprintProposal (legacy Markdown,
//   ya sin consumidor de producción antes de este TKT — deuda preexistente, no tocada aquí).
// [PP] mod:107 · autor:Rune · 2026-07-11 UTC-6
// TKT-202607-011 (Sprint PP-S-01): _parseBatchBlock gana gate de draft obligatorio — un bloque
//   del batch con REQ/TKT nuevo o con cambio de status y sin draft declarado (ckpt.draftRaw
//   undefined) se rechaza como bloque inválido (mismo tratamiento que JSON malformado), sin
//   abortar el resto del batch. Antes de este TKT, _resolveCheckpointBatch/_parseBatchBlock no
//   aplicaban este gate — solo el flujo inline de parsePaste lo tenía. Mismo criterio de
//   _draftGateTypes = ['REQ','TKT'] que parsePaste post TKT-202607-003 (INC/PRB/KE/CHG excluidos
//   — rama Reactiva sin Fase 5).
// TKT (REQ-[pendiente-ID] · ref_id CAEL-01/CAEL-02 · Resolución de ref_id+title, parte 1/2 —
//   propagación): los 3 puntos de construcción de tgItems (parsePaste inline ~L999,
//   _buildTgItemsFromParsed rama rol-no-autorizado-bloqueado ~L1873 y rama normal ~L1920)
//   ganan campo refId: it.ref_id || null — antes ausente por completo. Sin esta propagación,
//   mergeBacklogFromTG (locus-backlog-item.js) no puede construir el mapa ref_id→title
//   declarante necesario para normalizar objetos {ref_id,title} en campos de referencia.
//   parentId (y demás campos de referencia) ya propagaban el objeto crudo sin distinguirlo
//   de un string — sin cambio aquí, la normalización a [tmp:REF_ID] vive en el otro archivo.
//   no_incluye: no normaliza el objeto {ref_id,title} — eso ocurre en mergeBacklogFromTG,
//   antes de _assignPendingIds. No modifica _resolveCheckpointBatch/_parseBatchBlock — ambas
//   ya propagan tgItems sin filtrar campos, heredan refId sin cambio propio.
// [PP] mod:102 · autor:Rune · 2026-07-11 UTC-6
// TKT (REQ-[pendiente-ID] · ref_id CAEL-01/CAEL-02 · Rechazar CHECKPOINT con sprint_proposal +
//   items REQ/TKT): parseCheckpoint gana un gate único, justo después de extraer
//   _rawSprintProposal e items, antes del return de éxito — si _rawSprintProposal es no-null
//   y hay al menos un item con type REQ o TKT (type:'patch' excluido), retorna el mismo shape
//   de _jsonParseError que un JSON malformado, con el mensaje canónico de BR-Ecosystem §8/§12.
//   Se propaga sin tocar los 3 consumidores (parsePaste L843-846, parsePasteStandalone
//   L2075-2079, _parseBatchBlock L1936-1938) — los tres ya bloquean sobre ckpt._jsonParseError.
//   El path sin fence reusa el path con fence vía la llamada recursiva
//   parseCheckpoint('```\n' + _trimmed + '\n```') — hereda el gate sin código adicional.
//   no_incluye: no modifica el schema ni mensaje de los demás _jsonParseError (JSON malformado,
//   título ausente). No cambia parseSprintProposal (legacy ---SPRINT-PROPOSAL---, Markdown).
//   No agrega el gate a nivel de UI — vive una sola vez en parseCheckpoint.
// [PP] mod:101 · autor:Rune · 2026-07-11 UTC-6
// TKT1 (REQ-202607-026 · AC1, blocked_at AC2/AC3 — asignación de código real + invisibilidad
//   en vistas activas al ingestar REQ/TKT con draft:true): eliminados los 2 guards de bloqueo
//   total sobre ckpt.draft === true que quedaban en el path standalone — _parseBatchBlock
//   (batch) y parsePasteStandalone (single) — mismo criterio ya aplicado a parsePaste
//   (embedded) en TKT-202606-011. Corregida además la propagación de draft: es campo de nivel
//   CHECKPOINT (ckpt.draft) que se perdía sin llegar a los tgItems en los 3 puntos de
//   construcción del objeto en este archivo (parsePaste inline, _buildTgItemsFromParsed rama
//   bloqueado y rama normal) — mismo patrón de pérdida ya corregido para contract_detail en
//   TKT4 (mod:98). Sin este fix, mergeBacklogFromTG nunca veía item.draft aunque el guard de
//   ingesta ya no bloqueara. AC2 (invisibilidad Q-Backlog) y AC3 (invisibilidad sprint)
//   blocked_at — la lógica de filtrado de esas vistas no vive en ninguno de los 2 archivos
//   declarados en TKT1 (locus-session-parse.js / locus-backlog-item.js); ver CHECKPOINT de
//   entrega. AC4 (Kanban) inaplicable — vista Kanban removida del codebase en TKT-202607-027.
//   Reimplementado sobre el árbol de código real de esta entrega (mod:99) — la entrega previa
//   (mod:98→99 sobre copia desactualizada, misma sesión) queda descartada sin efecto sobre
//   este archivo.
// [PP] mod:99 · autor:Rune · 2026-07-10 UTC-6
// TKT2 (REQ-202607-025): rama rol-no-autorizado-bloqueado (~L1801) y rama fallback general
//   (~L1834) — ambas construían tgItems con `sprint: it.sprint` directo, sin pasar por
//   _resolveSprintFields() (que sí usa la rama principal, ~L942). Corregido: ambas ramas
//   ahora resuelven sprint_id/sprint_name con el mismo helper ya existente en este archivo
//   — sin duplicar lógica, sin cambiar _resolveSprintFields(). _normalizeSprint() (legacy)
//   sigue ejecutándose después sin cambio de comportamiento — sigue operando sobre
//   item.sprint (aquí un campo plano, no el alias getter/setter de core.js, porque estos
//   objetos no pasan por _newBacklogItem()).
// [PP] mod:98 · autor:Rune · 2026-07-09 20:15 UTC-6
// TKT-consolidar-valid-statuses-gate (deuda registrada durante TKT1 · REQ type-safety DISC
//   status — fix inline autorizado por el founder, sin REQ propio): _validStatuses estaba
//   duplicada literalmente en parsePaste (~L813) y en _buildTgItemsFromParsed (~L1722) —
//   mismo array, mismo riesgo de edición asimétrica. Consolidada en _VALID_STATUSES_GATE
//   (constante de módulo, junto a _KNOWN_STATUS_INPUTS). Ambos gates ahora leen de la misma
//   fuente — sin cambio de comportamiento, mismos 4 valores, mismo orden.
// REQ-execution-plan-deprecation: removido feature EXECUTION-PLAN completo — _tryIngestPlan,
//   _tryIngestPlanFromParsed, parsePlanBlock, parseo de execution_plan del schema JSON
//   (_rawExecutionPlan, validación de archivos huérfanos, transporte a ai._parsed/_standaloneLastParsed),
//   import de locus-sprint-plan.js. Campo execution_plan no está en __BR-Ecosystem §8 — código
//   huérfano de Generación 1 (comentarios R-202604-*/T-202605-524 lo confirman).
// TKT4 (REQ-contract-rename · depends_on: TKT2): _buildTgItemsFromParsed propaga
//   contract_detail a los dos objetos tgItems que construye (rama de transición bloqueada
//   ~L1893 y alta normal ~L1925) — antes se perdía entre el parseo y mergeBacklogFromTG,
//   dejando siempre null la columna equivalente en Supabase aunque TKT1/TKT2 estuvieran
//   correctos. Sin cambio en el objeto ITIL (_itilResult3.item, ~L1832) — contract_detail
//   no aplica a INC/PRB/KE/CHG. no_incluye: no propaga kill_criteria/archivos/design_intent/
//   next_role/blocked_at — mismo patrón ausente en esta función, deuda distinta registrada
//   como DISC (auditoría de campos Gen2 ausentes en tgItems), fuera de este TKT.
// TKT1 (REQ-contract-rename): los dos puntos de aplicación a Contratos de Módulo
//   (_rawItems.forEach en parsePaste ~L1010, parsedJSON.forEach en parsePasteStandalone
//   ~L2141) leen it.contract_detail en vez de it.contract — alineado a BR-Execution §2.
//   Sin retrocompatibilidad: un item con solo el campo legacy `contract` no se aplica a
//   Contratos (verificado con grep — cero matches de `.contract` fuera de `contract_detail`/
//   `contract_update` en todo el archivo). no_incluye: no modifica _ctrMergeFromItem en
//   locus-contracts.js — solo el nombre del campo leído en el caller.
// [PP] mod:92 · autor:Rune · 2026-07-02 09:20 UTC-6
// TKT1 (REQ-[pendiente-ID] · Custom properties del pill de proyecto vía setProperty en vez
//   de string interpolado — CSS Purity): el pill de proyecto (P-202604-115) ya no lleva el
//   atributo style con --pill-bg / --pill-color / --pill-border embebido en el string de
//   innerHTML. _pillRuntimeVars retiene los tres valores calculados (sin cambio de lógica
//   ni de colores) y se aplican con element.style.setProperty() sobre el nodo real
//   (`.ckpt-proj-pill`) inmediatamente después de insertar el bloque en prev.innerHTML —
//   patrón permitido por CSS Purity para custom properties con valor runtime. Sin cambio
//   visual. no_incluye: no toca _pillBg/_pillColor/_pillBorder ni ningún otro pill del
//   archivo — scope limitado a este elemento. contract_update: n/a — cambio interno sin
//   firma exportada afectada.
// TKT4 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs con resolución de [tmp:slug]
//   cross-CHECKPOINT, depends_on: TKT3 done): _resolveCheckpointBatch(blocks, sessionId) →
//   { tgItems, skipped } — combina los bloques válidos del batch en un solo array de tgItems
//   sin persistir, reutilizando _parseBatchBlock (TKT3) por bloque. Gate de duplicados
//   [tmp:slug] (antes AC3 de TKT2, en locus-session-save.js) trasladado aquí — la resolución,
//   no la persistencia, es donde showMergeDiffPanel necesita conocer el rechazo antes de
//   abrirse. saveStandaloneCheckpoint() agrega rama isBatch al inicio: llama a
//   _resolveCheckpointBatch, si hay skip type:'rejected' muestra el motivo y no abre el diff
//   panel; si no, pasa tgItems combinados por showMergeDiffPanel — al confirmar, invoca
//   _applyCheckpointBatch(tgItems) (locus-session-save.js, refactorizada en este mismo TKT a
//   solo-persistencia) con un único saveBacklog() para todo el batch (AC1/AC4). no_incluye:
//   no combina doc_updates/sprint_proposal/finn_observations de múltiples bloques en el mismo
//   panel — cada CHECKPOINT del batch los pierde si los declara; registrado como deuda técnica
//   en el CHECKPOINT de entrega, no silenciado.
// TKT3 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs con resolución de [tmp:slug]
//   cross-CHECKPOINT, depends_on: TKT1 done · TKT2 done): parsePasteStandalone detecta
//   modo batch vía _splitCheckpointBlocks(text).length > 1 — renderiza N pills con
//   buildTGPreview por bloque (AC1), pill de error '⚠ CHECKPOINT inválido — omitido del
//   batch' para bloques JSON malformados sin abortar el resto (AC2), batch de tamaño 1
//   preserva exactamente el path y output histórico (AC3, verificado con harness),
//   botón 'Aplicar' habilitado si la suma de ítems válidos del batch > 0 (AC4/AC5).
//   Extraída _buildTgItemsFromParsed(ckpt, parsedJSON) desde el loop inline de
//   parsePasteStandalone — mismo comportamiento, reutilizada por el path single y por
//   _parseBatchBlock(blockText) (nueva, valida un bloque del batch: parseCheckpoint +
//   gates de isCheckpoint/titulo/_jsonParseError/draft, ya existentes, replicados por
//   bloque). _standaloneLastParsed gana campo isBatch — true con array `blocks` (modo
//   batch) o false con shape histórica (modo single) — consumido por TKT4, no wireado
//   aquí: no_incluye de TKT3 excluye doc_updates/sprint_proposal/finn_observations
//   múltiples y wiring de "Aplicar" a _applyCheckpointBatch — ambos quedan para TKT4.
//   contract_update: n/a — funciones nuevas/extraídas son internas al módulo, sin
//   export, sin consumidores externos.
// TKT1 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs con resolución de [tmp:slug]
//   cross-CHECKPOINT): agregada _splitCheckpointBlocks(text) → string[] — separa un texto
//   pegado en N bloques CHECKPOINT delimitados por fence ``` (con o sin especificador json).
//   Función pura, exportada, sin efectos laterales — no valida JSON (eso ocurre en
//   parseCheckpoint, invocado por TKT2 sobre cada elemento del array), no resuelve slugMap,
//   no toca UI del textarea. AC4 (sin bloques delimitados → []) y AC2 (un solo bloque →
//   array de 1, comportamiento histórico preservado) verificados. Hallazgo fuera de scope:
//   un bloque con ``` embebido dentro de un valor string JSON (ej. doc_updates.content con
//   ejemplo de fence) corta el bloque en ese punto — mismo riesgo ya documentado en
//   T-202606-019 para el path de parseCheckpoint. Fuera de los AC de este TKT — señalar a
//   Cael si aparece en uso real.
export function _splitCheckpointBlocks(text) {
  if (!text) return [];
  const _re = /```(?:json)?\s*[\s\S]*?```/g;
  const _matches = text.match(_re);
  return _matches || [];
}
// [PP] mod:87 · autor:Rune · 2026-07-01 15:40 UTC-6
// TKT-202606-014 (REQ-202606-003 · AC2): agregado draftRaw — valor crudo de _parsed.draft
//   (undefined/true/false) propagado sin colapsar desde parseCheckpoint → ai._parsed →
//   ambos ckptMeta (sesión y standalone). El campo `draft` existente (=== true) no sirve
//   para el gate de TKT-014 porque undefined y false colapsan al mismo valor.
// [PP] mod:83 · autor:Rune · 2026-06-30 UTC-6
// TKT-202606-011 (REQ-202606-003 · AC2): eliminado el guard de T-202606-006 en parsePaste —
//   draft:true ya no vacía tgItems ni bloquea el botón Guardar vía _itemsJsonError. El estado
//   "pendiente de aval Finn" se comunica en el panel DIFF (badge + botón deshabilitado, ver
//   locus-backlog-merge.js AC3), no antes de abrirlo. ai._parsed.draft sigue propagándose sin
//   cambio (línea ~984) — es la fuente que showMergeDiffPanel consume.
// INC-[pendiente-ID] (Validador de status global rechaza 'discovery' para DISC):
//   _KNOWN_STATUS_INPUTS amplía con 'discovery'. _canonicalStatus agrega discriminador
//   explícito 'discovery' válido solo para type DISC — null para cualquier otro tipo,
//   mismo patrón ya existente para 'promoted'. Gate final de validación en ambos paths
//   de ingesta (parsePaste línea ~798, standalone línea ~1804) amplía la excepción de
//   _validStatuses para aceptar 'discovery' junto a 'promoted'/'bloqueado'. Mensajes de
//   error de status inválido para DISC ahora listan 'discovery' además de 'promoted'.
//   Causa raíz real estaba en locus-backlog-core.js — normalizeStatus() no tenía caso
//   explícito para 'discovery' y caía al fallback silencioso 'pendiente' (línea 102-103
//   de ese archivo); ver mod correspondiente en ese header. Sin este segundo fix, el
//   valor 'discovery' habría pasado el gate local pero se habría reescrito en silencio
//   a 'pendiente' al normalizar — bug distinto y más grave que el síntoma original.
// TKT-PARSER-2b (REQ-[pendiente-ID] · fix chk_status_by_type para INC/PRB/KE/CHG nuevos):
//   _buildItilItem ahora setea item.status (mirror de incident_status para INC/PRB/KE; valor
//   canónico Scrum directo para CHG) — mergeBacklogFromTG ya leía item.status en creación
//   (línea 2206) pero _buildItilItem nunca lo poblaba, default ciego a 'pendiente' violaba
//   constraint. _VALID_INCIDENT_STATUS se mantiene como vocabulario INC; _VALID_PRB_STATUS y
//   _VALID_KE_STATUS nuevas, exportadas — subconjuntos propios __BR-Ecosystem §5. CHG sale del
//   camino incident_status — usa status con vocabulario TKT (pendiente/en-revision/done/
//   descartado), validado vía _canonicalStatus — sigue en _ITIL_TYPES solo para _resolveItilQueue
//   (autoasignación a Q-INC), no para validación de status.
// TKT-PARSER-2a (REQ-[pendiente-ID] · validación de transición ITIL en mergeBacklogFromTG):
//   _VALID_INCIDENT_STATUS y _INCIDENT_STATUS_LIST exportadas — locus-backlog-item.js las
//   consume para validar transiciones de incidentStatus sin duplicar la tabla. Sin cambio
//   de comportamiento de ingesta — solo visibilidad ampliada de dos constantes locales.
// TKT (REQ-[pendiente-ID] · Parser: ciclo ITIL completo y tipos PRB/KE/CHG):
//   _validTypes ampliado a 7 tipos Gen2 (_GEN2_TYPES) en ambos paths de ingesta (parsePaste +
//   variante standalone). Ítems ITIL (INC/PRB/KE/CHG) desviados a _buildItilItem() antes de
//   cualquier validación de status/sprint orientada a Scrum — su ciclo vive en incidentStatus,
//   nunca en status. Objeto interno ITIL: incidentStatus/slaPriority/slaDeadline/resolutionType/
//   comportamientoActual/originModule/derivedItems/queue mapeados, sin campo 'status'. Queue de
//   PRB/KE/CHG sin valor se autoasigna a [Prefijo]-Q-INC vía _PREFIX_MAP (locus-storage.js,
//   import nuevo) usando el campo 'project' del CHECKPOINT — no getActiveProject(). REQ/TKT/DISC
//   con queue terminada en '-Q-INC' rechazados con mensaje canónico BR-Core §6. INC sin
//   sla_priority → 'medium' + DocLog. Mensaje de "status de ciclo TKT" generalizado a los 4 tipos
//   ITIL (${it.type}) en vez de literal 'INC' — el AC original solo mencionaba INC; Finn audita
//   si esto requiere ajuste de AC o es aceptable por alcance del REQ (PRB/KE/CHG comparten el
//   mismo problema). Hallazgo fuera de scope: 2 referencias activas a sp.isHotfix en lógica de
//   sprint_proposal (líneas ~1402, ~1489) — no tocadas, pertenecen al REQ "Limpieza final"
//   (locus-backlog-sprints.js no declara este archivo en su campo archivos — gap a señalar a Cael).
// locus-session-parse.js
// Responsabilidad: parseCheckpoint, parsePaste, handlePaste/Input, _processIngestBatch,
//   statusLabel, buildTGPreview, STATUS_LABELS, TG_PARSER_CONFIG.
//   TKT4 (REQ CAEL-0716-01): parsePasteStandalone/saveStandaloneCheckpoint/
//   openStandaloneCheckpoint/closeStandaloneCheckpoint eliminadas — cadena standalone-ckpt
//   inalcanzable desde la unificación del split view (TKT1-3, mismo REQ).
// Dependencias: locus-storage.js · locus-toast.js · locus-session-hora.js

import { renderStats, getItems, normalizeStatus, itemKind, _GEN2_TYPES } from './locus-backlog-core.js'; // TKT0-gen2: itemKind agregado · TKT1: _GEN2_TYPES (REQ-[pendiente-ID])
import { _isPlaceholderCode, applyPatchesFromTG, _assignPendingIds } from './locus-backlog-item.js'; // T-202606-089 AC-3 · TKT3 (REQ CAEL-0716-01): mergeBacklogFromTG retirado del import — sin consumidores directos en este archivo (dry-run per-keystroke ya se había removido antes; dry-run de batch removido en este TKT, ver _processIngestBatch). La persistencia real sigue viva vía _applyCheckpointBatch (locus-session-save.js), que la invoca internamente
import { showMergeDiffPanel } from './locus-backlog-merge.js'; // TKT3 (REQ CAEL-0716-01): chipTonesFromDiff retirado — _processIngestBatch ya no renderiza resumen de chips, invoca showMergeDiffPanel real (mismo panel que el flujo single). Sigue vivo en locus-backlog-merge.js (uso interno propio, L726) — no se elimina de ese archivo
import { renderBacklogList } from './locus-backlog-render.js';
import { _ctrMergeFromItem } from './locus-contracts.js';
import { extractContextSections, extractDocUpdates, extractHtmlMapSections, mergeContextSections, mergeHtmlMapSections, processDocUpdate } from './locus-docs.js';
import { showCheckpointPanel } from './locus-sesiones-viz.js';
import { _checkStorageQuota, _mergeBacklogWithProject, saveSession, _applyCheckpointBatch } from './locus-session-save.js'; // T-202606-032: saveSession para auto-trigger | TKT4: _applyCheckpointBatch — persistencia de batch, invocada solo en el callback de confirmación de showMergeDiffPanel (no en tiempo de evaluación del módulo, mismo patrón ya usado por _mergeBacklogWithProject en esta misma línea)
import { _blogLog, _offlineQueuePush, getAI, getActiveProject, getActiveSprints, getActiveTracker, getSupabaseContext, save, saveImmediate, _upsertSprint, LOCUS_KEYS, CANONICAL_PROJECTS, _PREFIX_MAP, getInfraVersionData } from './locus-storage.js';
// T-202606-029: INFRA_VERSION_ACTIVE (constante) reemplazada por getInfraVersionActive() / setInfraVersionActive() — AC-4 de T-202606-027
import { showToast, toast } from './locus-toast.js';



import { esc } from './locus-ui-shell.js';

// T-202606-012: _INFRA_VERSION_ACTIVE eliminada — importada como INFRA_VERSION_ACTIVE desde locus-storage.js
// T-202606-029: INFRA_VERSION_ACTIVE (constante) migrada a getInfraVersionActive() / setInfraVersionActive() — AC-4 de T-202606-027 cerrado

// T-202606-210: Set en memoria para detección de CHECKPOINTs duplicados en sesión activa.
// Scope: por carga de página (sesión activa del navegador). Se resetea con recarga.
const _processedCheckpointHashes = new Set();

// T-202604-215: Labels de status en español — fuente de verdad para UI
// Movido desde locus-checkpoint-hoy.js
export const STATUS_LABELS = {
  available:    'Disponible',
  exhausted:    'Agotada',
  insession:    'En curso',
  interrupted:  'Interrumpida'
};

const TG_PARSER_CONFIG = {
  TYPES: ['DISC', 'TKT', 'REQ', 'INC'],
  TYPE_NAMES: { DISC: 'Ideas', TKT: 'Tickets', REQ: 'Requerimientos', INC: 'Bugs' },
  STATUS_ALIASES: {
    'pendiente':'📤 Pendiente', '📤 pendiente':'📤 Pendiente',
    'backlog':'⏳ Backlog', '⏳ backlog':'⏳ Backlog',
    'done':'✅ DONE', '✅ done':'✅ DONE', 'listo':'✅ DONE',
    'en progreso':'🔄 En progreso', '🔄 en progreso':'🔄 En progreso',
    'in-progress':'🔄 En progreso', 'progreso':'🔄 En progreso',
    'descartado':'🗑 Descartado', '🗑 descartado':'🗑 Descartado',
    'en-revision':'🔍 En revisión',                                       // aliases 'en_revision'/'en revisión' retirados 2026-07-22 — ver locus-backlog-core.js normalizeStatus()
    'promoted':'🔁 Promovida', '🔁 promoted':'🔁 Promovida'                // T-202606-023 AC1+AC2
  }
};

function statusLabel(raw) {
  if (!raw) return '📤 Pendiente';
  const key = raw.trim().toLowerCase();
  const resolved = TG_PARSER_CONFIG.STATUS_ALIASES[key];
  if (!resolved) {
    console.warn('[AI Tracker] statusLabel: status desconocido "' + raw.trim() + '" — usando "📤 Pendiente"');
    return '📤 Pendiente';
  }
  return resolved;
}

// T-202606-002: _canonicalStatus es ahora wrapper de normalizeStatus (locus-backlog-core.js).
// Preserva semántica de rechazo estricto: retorna null para valores desconocidos.
// normalizeStatus retorna 'pendiente' para desconocidos — wrapper detecta ese caso
// comparando el raw original contra la lista de entradas conocidas.
// T-202606-018: 'promoted' con type T/R/B → null (rechazo bloqueante en validación).
// Casos especiales no cubiertos por normalizeStatus:
//   'histórico' (con acento) → mapear a 'historico' antes de delegar
//   'listo' → alias de 'done' (usado en TG_PARSER_CONFIG)
//   'promoted' con type≠DISC → null (normalizeStatus devuelve 'pendiente' — override requerido)
const _KNOWN_STATUS_INPUTS = new Set([
  'done', 'en-revision',
  'descartado', 'historico', 'histórico', 'pendiente', 'promoted',
  'listo',
  'bloqueado', // T-202606-031: válido solo para R — validación de rol en parsePaste
  'orphaned', // T-202606-017: válido solo para R — sin Ts válidos
  'discovery', // INC-[pendiente-ID]: único status inicial válido para DISC — __BR-Ecosystem §5
]);

// TKT-consolidar-valid-statuses-gate (deuda registrada en TKT1 · REQ type-safety DISC status):
// _validStatuses estaba duplicada literalmente en parsePaste (~L813) y en la variante
// standalone _buildTgItemsFromParsed (~L1722) — mismo array, mismo riesgo de que una edición
// futura toque un gate y no el otro. Consolidada aquí, fuente única para ambos paths de ingesta.
const _VALID_STATUSES_GATE = ['done', 'pendiente', 'descartado', 'en-revision'];

// TKT1 (REQ-[pendiente-ID]): _GEN2_TYPES movida a locus-backlog-core.js — fuente única,
// importada abajo junto al resto de imports de ese módulo. Sin cambio de valor ni de uso.
// Tipos cuyo ciclo de vida vive en incident_status (ITIL) — nunca en status (Scrum).
const _ITIL_TYPES = new Set(['INC', 'PRB', 'CHG']);
// Valores válidos de incident_status — BR-Core §6.
// TKT-PARSER-2a (REQ-[pendiente-ID]): exportadas — locus-backlog-item.js las consume para
// validar transiciones ITIL en mergeBacklogFromTG sin duplicar la tabla.
export const _VALID_INCIDENT_STATUS = new Set([
  'detected', 'assigned', 'in_progress', 'resolved', 'closed',
  'escalated_to_prb', 'escalated_to_chg', 'descartado'
]);
export const _INCIDENT_STATUS_LIST = 'detected · assigned · in_progress · resolved · closed · escalated_to_prb · escalated_to_chg';
// TKT-PARSER-2b (REQ-[pendiente-ID]): vocabulario propio por tipo ITIL — __BR-Ecosystem §5.
// PRB es subconjunto de INC sin assigned/escalated_to_chg. KE tiene ciclo propio (active, no detected).
// CHG usa vocabulario Scrum (pendiente/en-revision/done/descartado) — no pasa por estas constantes,
// se valida con _canonicalStatus, igual que TKT.
export const _VALID_PRB_STATUS = new Set([
  'detected', 'in_progress', 'resolved', 'closed', 'descartado'
]);
export const _PRB_STATUS_LIST = 'detected · in_progress · resolved · closed · descartado';

// Mensaje canónico BR-Core §6 — REQ/TKT/DISC no pueden asignarse a Q-INC.
function _isQIncQueue(queue) {
  return (queue || '').trim().toLowerCase().endsWith('-q-inc');
}

// REQ-[pendiente-ID]: prefijo de queue se extrae del campo 'project' del CHECKPOINT vía
// _PREFIX_MAP (locus-storage.js) — no desde getActiveProject() (founder puede tener otro
// proyecto activo en la UI mientras pega un CHECKPOINT de otro proyecto).
function _prefixFromCheckpointProject(projectName) {
  return _PREFIX_MAP[(projectName || '').trim()] || null;
}

// REQ-[pendiente-ID]: resuelve queue para un ítem ITIL (INC/PRB/KE/CHG).
// - Con queue declarado y correcto (termina en '-Q-INC') → se respeta tal cual.
// - INC-parser-queue-no-forzado: con queue declarado pero incorrecto (no termina en '-Q-INC')
//   → se fuerza al valor correcto + señal DocLog. Antes de este fix, solo INC/PRB/KE/CHG SIN
//   queue declarado se autoasignaban — un valor presente pero incorrecto se respetaba tal cual,
//   contradiciendo __BR-Ecosystem §8: "queue con valor distinto a Q-INC en INC/PRB/KE/CHG nuevo
//   → Locus aplica el ítem con queue: [Prefijo]-Q-INC y alerta en DocLog."
// - Sin queue declarado → autoasignación previa, sin cambio de comportamiento.
// - REQ/TKT/DISC con queue que termina en '-Q-INC' → error bloqueante, no se autoasigna nada.
function _resolveItilQueue(it, projectName, ckptTitulo) {
  const _rawQueue = (it.queue || '').trim();
  if (!_ITIL_TYPES.has(it.type)) {
    // REQ/TKT/DISC nunca debe declarar una queue de Q-INC.
    if (_isQIncQueue(_rawQueue)) {
      return { error: `Q-INC solo acepta INC/PRB/CHG — ${it.type} ${it.code || '[pendiente-ID]'} no puede asignarse a esta zona` };
    }
    return { queue: _rawQueue || null };
  }
  if (_rawQueue && _isQIncQueue(_rawQueue)) return { queue: _rawQueue };
  // Queue ausente, o presente pero incorrecto — autoasignar/forzar.
  const _prefix = _prefixFromCheckpointProject(projectName);
  if (!_prefix) return { queue: null }; // proyecto no reconocido — ya bloqueado en otra validación
  const _autoQueue = `${_prefix}-Q-INC`;
  if (_rawQueue) {
    _blogLog(
      'queue-forzado-a-qinc',
      it.code || '[pendiente-ID]',
      `Queue asignado en ${it.type} nuevo ignorado — Q-INC aplicado.`,
      'backlog'
    );
    return { queue: _autoQueue };
  }
  _blogLog(
    'queue-autoasignada',
    it.code || '[pendiente-ID]',
    `queue asignado automáticamente a ${_autoQueue}`,
    'backlog'
  );
  return { queue: _autoQueue };
}
function _canonicalStatus(raw, type) {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!_KNOWN_STATUS_INPUTS.has(s)) return null; // valor desconocido — rechazo estricto
  // Casos que normalizeStatus no cubre directamente
  if (s === 'listo') return 'done';
  if (s === 'histórico') return 'historico';
  if (s === 'promoted' && type !== 'DISC') return null; // T-202606-018 — Gen2 puro: discriminador 'DISC'
  if (s === 'discovery' && type !== 'DISC') return null; // INC-[pendiente-ID]: discovery solo válido para DISC — mismo patrón que promoted
  if (s === 'bloqueado') return type === 'REQ' ? 'bloqueado' : null; // T-202606-031: solo válido para REQ
  if (s === 'orphaned') return type === 'REQ' ? 'orphaned' : null; // T-202606-017: solo válido para REQ
  return normalizeStatus(raw, type) || null;
}

// REQ-[pendiente-ID]: valida un ítem ITIL (INC/PRB/KE/CHG) y devuelve el objeto interno
// listo para acumular en tgItems, o un error bloqueante. Compartida por parsePaste y la
// variante standalone.
// TKT-PARSER-2b: CHG usa vocabulario Scrum (status, no incident_status) — __BR-Ecosystem §5
// declara su ciclo igual al de TKT (pendiente/en-revision/done/descartado). INC/PRB/KE
// siguen exclusivamente por incident_status — pero ahora se espeja a item.status (mismo
// valor, mismo campo que lee mergeBacklogFromTG) porque chk_status_by_type valida status
// para las 7 filas de tracker_items sin excepción — no hay columna paralela.
function _buildItilItem(it, ckptHeaderRole, projectName, ckptTitulo) {
  const _isChg = it.type === 'CHG';

  let _incStatus = null;
  if (_isChg) {
    // CHG: status de ciclo TKT — exactamente lo que antes era el caso de error.
    const _chgStatus = _canonicalStatus(it.status, 'TKT'); // vocabulario TKT = vocabulario CHG
    if (!_chgStatus) {
      return {
        error: `CHG ${it.code || '[pendiente-ID]'}: status inválido o ausente "${it.status || ''}". Valores válidos: pendiente · en-revision · done · descartado`
      };
    }
    if (it.incident_status) {
      return {
        error: `CHG ${it.code || '[pendiente-ID]'} usa incident_status — CHG no tiene ciclo ITIL, usar status. Valores válidos: pendiente · en-revision · done · descartado`
      };
    }
    _incStatus = _chgStatus;
  } else {
    // INC/PRB/KE: status de ciclo TKT en un ítem ITIL → error bloqueante explícito.
    if (it.status) {
      return {
        error: `${it.type} ${it.code || '[pendiente-ID]'} usa status de ciclo TKT — usar incident_status. Valores válidos: ${_itilStatusList(it.type)}`
      };
    }
    const _raw = (it.incident_status || '').trim();
    const _validSet = _itilStatusSet(it.type);
    if (!_raw || !_validSet.has(_raw)) {
      return {
        error: `${it.type} ${it.code || '[pendiente-ID]'}: incident_status inválido o ausente "${it.incident_status || ''}". Valores válidos: ${_itilStatusList(it.type)}`
      };
    }
    _incStatus = _raw;
  }

  // INC sin comportamiento_actual → bloqueante (excepción literal aceptada sin alerta).
  if (it.type === 'INC') {
    const _comportamiento = (it.comportamiento_actual || '').trim();
    const _EXCEPCION = 'no observado directamente — síntoma reportado por founder';
    if (!_comportamiento) {
      return { error: `INC ${it.code || '[pendiente-ID]'} sin comportamiento_actual — campo obligatorio. Adjuntar CHECKPOINT corregido.` };
    }
  }

  // TKT (REQ CAEL-0724-01): rama 'KE' sin comportamiento_actual retirada — KE fusionado a
  // PRB.root_cause_confirmed (infra_version 51), type:'KE' ya no alcanza este punto desde que
  // _GEN2_TYPES lo excluye (TKT-202607-067, locus-backlog-core.js mod:131) — código muerto.
  const _q = _resolveItilQueue(it, projectName, ckptTitulo);
  if (_q.error) return { error: _q.error };

  // INC sin sla_priority → medium por defecto + advertencia DocLog (ingesta continúa).
  let _slaPriority = (it.sla_priority || '').trim();
  if (it.type === 'INC' && !_slaPriority) {
    _slaPriority = 'medium';
    _blogLog(
      'sla-priority-default',
      it.code || '[pendiente-ID]',
      `INC sin sla_priority — asignado 'medium' por defecto`,
      'backlog'
    );
  }

  return {
    item: {
      type:               it.type,
      code:               it.code,
      title:              it.title || it.desc || '',
      desc:               it.title || it.desc || '',
      priority:           it.priority || 'medium',
      // status: mirror de incidentStatus para INC/PRB/KE (chk_status_by_type lo exige);
      // para CHG es el valor canónico de origen — no hay incidentStatus paralelo.
      status:              _incStatus,
      incidentStatus:      _isChg ? null : _incStatus,
      slaPriority:         _slaPriority || null,
      slaDeadline:         it.sla_deadline != null ? it.sla_deadline : null,
      resolutionType:      it.resolution_type || null,
      comportamientoActual: it.comportamiento_actual || null,
      originModule:        it.origin_module || null,
      derivedItems:        Array.isArray(it.derived_items) ? it.derived_items : [],
      queue:               _q.queue,
      effort:             it.effort != null ? (parseInt(it.effort) || null) : null,
      area:               it.area || '',
      ac:                 Array.isArray(it.ac) ? it.ac : [],
      role:               it.role || ckptHeaderRole,
      discardReason:      it.discard_reason || it.reason || '',
      triggeredBy:        it.triggered_by || null,
      origenDisc:         it.origen_disc || null,
      schema_version:     it.schema_version || null
    }
  };
}

// TKT-PARSER-2b: helpers de vocabulario por tipo ITIL — INC/PRB únicamente (CHG no pasa por aquí).
// TKT (REQ CAEL-0724-01): rama 'KE' retirada — KE fusionado a PRB.root_cause_confirmed
// (infra_version 51). _GEN2_TYPES ya no incluye 'KE' desde TKT-202607-067 (locus-backlog-core.js
// mod:131), por lo que type:'KE' nunca alcanzaba este punto — código muerto retirado.
function _itilStatusSet(type) {
  if (type === 'PRB') return _VALID_PRB_STATUS;
  return _VALID_INCIDENT_STATUS; // INC
}
function _itilStatusList(type) {
  if (type === 'PRB') return _PRB_STATUS_LIST;
  return _INCIDENT_STATUS_LIST; // INC
}

function buildTGPreview(items, discrepancy) {
  if (!items.length && !discrepancy) return '';
  let html = `<div class="preview-tg">
    <div class="preview-tg-header">
      <div class="preview-tg-header-label">📋 Items detectados</div>
      <div class="preview-tg-header-count">${items.length} ítem${items.length !== 1 ? 's' : ''}</div>
    </div>`;
  if (discrepancy) {
    html += `<div class="preview-tg-discrepancy">
      ⚠ ${discrepancy.raw} línea${discrepancy.raw !== 1 ? 's' : ''} en el texto — solo ${discrepancy.parsed} parseada${discrepancy.parsed !== 1 ? 's' : ''}. Verifica el formato de las líneas no detectadas.
    </div>`;
  }
  html += `<div class="preview-tg-badges-row">`;
  TG_PARSER_CONFIG.TYPES.forEach(type => {
    const count = items.filter(x => x.type === type).length;
    if (count) html += `<span class="preview-tg-badge ${type}" title="${TG_PARSER_CONFIG.TYPE_NAMES[type]} (${count})">${type} ${count}</span>`;
  });
  html += `</div>`;
  items.forEach(item => {
    const existing = (getActiveTracker().items || []).find(x => x.code === item.code);
    const tag = existing
      ? `<span class="preview-tg-tag update">↑ actualizar</span>`
      : `<span class="preview-tg-tag new">+ nuevo</span>`;
    // T-202605-436 AC4: indicador visual para ítems nuevos sin AC
    const noAcTag = (!existing && (!item.ac || item.ac.length === 0))
      ? `<span class="preview-tg-tag preview-tg-tag--warn" title="Ítem nuevo sin criterios de aceptación">sin AC</span>`
      : '';
    // T-202606-106: badges --info para campos obligatorios ausentes en ítems nuevos
    const noNoIncluyeTag = (!existing && itemKind(item) === 'TKT' && (!item.no_incluye || item.no_incluye.length === 0))
      ? `<span class="preview-tg-tag preview-tg-tag--info" title="TKT nuevo sin campo no_incluye">sin no_incluye</span>`
      : '';
    const noIntencionTag = (!existing && itemKind(item) === 'REQ' && !item.intencion)
      ? `<span class="preview-tg-tag preview-tg-tag--info" title="REQ nuevo sin campo intencion">sin intencion</span>`
      : '';
    const noTriggeredByTag = (!existing && itemKind(item) === 'INC' && !item.triggeredBy)
      ? `<span class="preview-tg-tag preview-tg-tag--info" title="INC nuevo sin campo triggered_by">sin triggered_by</span>`
      : '';
    html += `<div class="preview-tg-row">
      <span class="preview-tg-badge ${item.type}">${item.type}</span>
      <span class="preview-tg-code">${esc(item.code)}</span>
      <span class="preview-tg-desc">${esc(item.title)}${tag}${noAcTag}${noNoIncluyeTag}${noIntencionTag}${noTriggeredByTag}</span>
      <span class="preview-tg-status">${esc(item.status)}</span>
    </div>`;
  });
  html += `</div>`;
  return html;
}

// R-202604-037: tabla canónica de proyectos del ecosistema — declarada en locus-storage.js
// La validación en parsePaste() es case-sensitive: 'Locus' es válido, 'locus' no.
// OL-CONTEXT §7: strings canónicos — 'Obsidiana'/'Obsidiana Labs' deprecados · 'ASVAB App' deprecado (→ 'Alisto') · 'AI Tracker' deprecado (→ 'Locus')
// R-202605-002: CANONICAL_PROJECTS consumida desde locus-storage.js — sin declaración local

// R-202605-063: Levenshtein simple para sugerencia de string canónico
function _levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function _suggestCanonical(raw) {
  let best = null, bestDist = Infinity;
  CANONICAL_PROJECTS.forEach(p => {
    const d = _levenshtein(raw.toLowerCase(), p.toLowerCase());
    if (d < bestDist) { bestDist = d; best = p; }
  });
  return { suggestion: best, distance: bestDist };
}

// T-202606-039: extrae bloques inline_fix del texto crudo del CHECKPOINT (formato Markdown legacy).
// Retorna array de { descripcion, archivo, triggered_by } — vacío si no hay bloques.
// Un CHECKPOINT puede tener múltiples bloques inline_fix consecutivos — todos se indexan como array.
// Formato esperado (por bloque):
//   inline_fix:
//     descripcion: [texto]
//     archivo: [nombre]
//     triggered_by: [código]
function _parseInlineFixes(text) {
  if (!text || !text.includes('inline_fix:')) return [];
  const fixes = [];
  // Detectar cada bloque inline_fix: con sus campos anidados (indentados con espacios o tabs)
  // Captura desde "inline_fix:" hasta la siguiente línea no indentada o fin de texto
  const blockRe = /^inline_fix:\s*\n((?:[ \t]+.+\n?)+)/gm;
  let match;
  while ((match = blockRe.exec(text)) !== null) {
    const body = match[1];
    const descM      = body.match(/^\s+descripcion\s*:\s*(.+)$/m);
    const archivoM   = body.match(/^\s+archivo\s*:\s*(.+)$/m);
    const triggeredM = body.match(/^\s+triggered_by\s*:\s*(.+)$/m);
    // Solo indexar si tiene al menos descripcion y triggered_by (campos mínimos útiles para trazabilidad)
    if (descM && triggeredM) {
      fixes.push({
        descripcion:  descM[1].trim(),
        archivo:      archivoM ? archivoM[1].trim() : '',
        triggered_by: triggeredM[1].trim()
      });
    }
  }
  return fixes;
}

// TKT-202607-033 (REQ-202607-005 AC3 — Vigencia y bloqueo de DOC-UPDATEs vencidos):
// docs de infraestructura (dueño Vera) nunca pasan por la cola doc_updates de Locus —
// ver __BR-Ecosystem §11 y __BR-Core OWNERSHIP DE DOCUMENTOS. Comparación normalizada
// a minúsculas — 'BR-Core' y 'br-core' matchean igual.
const _INFRA_DOC_NAMES = new Set(['br-core', 'br-ecosystem', 'br-execution', 'ob-strategy']);

// T-202606-005: parseCheckpoint — path único JSON puro (fence sin especificador de lenguaje)
// Path único: bloque ``` { ... } ``` sin especificador de lenguaje con schema completo
export function parseCheckpoint(text) {
  // ── Path único: JSON puro ─────────────────────────────────────────────────────
  // Detectar bloque ``` { ... } ``` sin especificador de lenguaje
  // T-202606-055: anclar detección al inicio del texto — evita falso positivo con bloques
  // embebidos en campos de texto (doc_updates, ejemplos en ---ITEMS---).
  // Solo activa el path JSON cuando el bloque ``` es el primer contenido del texto.
  // T-202606-019: anclar match al inicio — evita captura prematura por ``` en doc_updates.content
  const _jsonFenceMatch = /^\s*```(?:json)?\s*\{/.test(text) ? text.match(/^\s*```(?:json)?\s*(\{[\s\S]*?\})\s*```/) : null;
  if (_jsonFenceMatch) {
    let _parsed = null;
    let _jsonErr = null;
    try {
      _parsed = JSON.parse(_jsonFenceMatch[1].trim());
    } catch (e) {
      _jsonErr = e.message || 'JSON inválido';
    }
    if (_jsonErr || !_parsed || typeof _parsed !== 'object' || Array.isArray(_parsed)) {
      // JSON detectado pero inválido — devolver resultado con error marcado
      return {
        titulo: '', proyecto: '', rol: '', resumen: '', archivos: '',
        discItems: '', tktItems: '', reqItems: '', incItems: '',
        estado: '', decision: '', proximoPaso: '',
        contexto: '', bloqueantes: '', aprendizaje: '',
        isCheckpoint: true,
        _jsonParseError: _jsonErr || 'El bloque ```json no contiene un objeto válido',
        rawCounts: { DISC: 0, TKT: 0, REQ: 0, INC: 0 }
      };
    }
    // JSON válido — extraer campos del schema R-202605-133
    const items = Array.isArray(_parsed.items) ? _parsed.items : [];
    // Clasificar ítems por tipo para rawCounts (compatibilidad con preview)
    const _countByType = (t) => items.filter(i => i.type === t).length;
    // Serializar items de vuelta a texto para compatibilidad con buildTGPreview
    // discItems/tktItems/reqItems/incItems no se usan como fuente de datos — solo para display
    const _typedLines = (t) => items
      .filter(i => i.type === t)
      .map(i => `${i.code}: ${i.title || i.desc || ''}`)
      .join('\n');
    // T-202606-039: extraer inline_fix(es) del schema JSON — debe ser array
    // T1-parser-validaciones: objeto singular rechazado con DocLog canónico — no normalizar
    const _inlineFixRaw = _parsed.inline_fix || _parsed.inline_fixes || null;
    let _inlineFixes = [];
    if (_inlineFixRaw !== null && _inlineFixRaw !== undefined) {
      if (Array.isArray(_inlineFixRaw)) {
        _inlineFixes = _inlineFixRaw;
      } else {
        // objeto singular — rechazar, no normalizar
        _blogLog('inline-fix-objeto-singular', '', 'inline_fix debe ser array — objeto singular no válido', 'backlog');
        // _inlineFixes queda [] — no se indexa
      }
    }
    // T-202606-017: extraer doc_updates — array de objetos DOC-UPDATE del schema JSON
    const _rawDocUpdates = Array.isArray(_parsed.doc_updates) ? _parsed.doc_updates : [];
    // T-202606-017: extraer sprint_proposal — objeto del schema JSON (null si ausente)
    // T-202606-034-2f: sprint_proposal: null → tratar como ausente (falsy — ya cubierto por &&)
    // T-202606-079: sprint_proposal: {} (objeto vacío) → tratar como ausente, sin advertencia DocLog
    //   Entrada: sprint_proposal: {}; Salida: _rawSprintProposal = null, sin Step 0, sin advertencia
    const _rawSprintProposalCandidate = (_parsed.sprint_proposal !== null && _parsed.sprint_proposal !== undefined && typeof _parsed.sprint_proposal === 'object' && !Array.isArray(_parsed.sprint_proposal))
      ? _parsed.sprint_proposal
      : null;
    const _rawSprintProposal = (_rawSprintProposalCandidate && Object.keys(_rawSprintProposalCandidate).length > 0)
      ? _rawSprintProposalCandidate
      : null;
    // T-202606-018: extraer finn_observations — array de objetos tipados (null si ausente o vacío)
    const _rawFinnObservations = Array.isArray(_parsed.finn_observations) && _parsed.finn_observations.length
      ? _parsed.finn_observations
      : null;
    // TKT2 (REQ CAEL-0717-01 · AC3): extraer finn_release — objeto del schema JSON (null si
    //   ausente). Mismo criterio de guard que sprint_proposal: objeto real, no array, con al
    //   menos una clave — un {} vacío se trata como ausente, sin advertencia DocLog (mismo
    //   comportamiento que T-202606-079 para sprint_proposal).
    const _rawFinnReleaseCandidate = (_parsed.finn_release && typeof _parsed.finn_release === 'object' && !Array.isArray(_parsed.finn_release))
      ? _parsed.finn_release
      : null;
    const _rawFinnRelease = (_rawFinnReleaseCandidate && Object.keys(_rawFinnReleaseCandidate).length > 0)
      ? _rawFinnReleaseCandidate
      : null;
    // TKT-[pendiente-ID] (REQ-[pendiente-ID] · sprint_proposal + items REQ/TKT — BR-Ecosystem
    //   §8/§12): un CHECKPOINT con sprint_proposal no puede convivir con ítems REQ/TKT nuevos —
    //   el parser rechaza el bloque completo con el mismo shape de _jsonParseError ya usado para
    //   JSON malformado, para que los 3 consumidores (parsePaste, parsePasteStandalone,
    //   _parseBatchBlock) lo bloqueen sin cambios propios. type:'patch' no cuenta — no es un
    //   ítem REQ/TKT nuevo para este criterio.
    if (_rawSprintProposal && items.some(_it => _it && _it.type !== 'patch' && (_it.type === 'REQ' || _it.type === 'TKT'))) {
      return {
        titulo: '', proyecto: '', rol: '', resumen: '', archivos: '',
        discItems: '', tktItems: '', reqItems: '', incItems: '',
        estado: '', decision: '', proximoPaso: '',
        contexto: '', bloqueantes: '', aprendizaje: '',
        isCheckpoint: true,
        _jsonParseError: 'sprint_proposal debe ir en CHECKPOINT independiente antes de los ítems. Separar y reemitir.',
        rawCounts: { DISC: 0, TKT: 0, REQ: 0, INC: 0 }
      };
    }
    return {
      titulo:       _parsed.title        || '',
      proyecto:     _parsed.project      || '',
      rol:          _parsed.role         || '',
      resumen:      _parsed.summary      || '',
      archivos:     _parsed.files        || '',
      discItems:    _typedLines('DISC'),
      tktItems:     _typedLines('TKT'),
      reqItems:     _typedLines('REQ'),
      incItems:     _typedLines('INC'),
      estado:       '',
      decision:     _parsed.decision     || '',
      proximoPaso:  _parsed.next_step    || '',
      contexto:     _parsed.context      || '',
      bloqueantes:  _parsed.blockers     || '',
      aprendizaje:  _parsed.learning      || '',
      // T-202606-016: campos informativos adicionales del schema JSON
      duration:      _parsed.duration       || '',
      docsVerified:  _parsed.docs_verified  || '',
      tensionsResolved: _parsed.tensions_resolved || '',
      isCheckpoint: true,
      _isJsonFormat: true,
      _rawItems:        items,          // ítems ya parseados — parsePaste los usa directamente
      _inlineFixes,                     // T-202606-039: array de inline_fix extraídos del schema JSON
      _rawDocUpdates,                   // T-202606-017: array de doc_updates del schema JSON
      _rawSprintProposal,               // T-202606-017: objeto sprint_proposal del schema JSON (null si ausente)
      _rawFinnObservations,             // T-202606-018: array de finn_observations del schema JSON (null si ausente)
      _rawFinnRelease,                  // TKT2 (REQ CAEL-0717-01): objeto finn_release del schema JSON (null si ausente)
      draft: _parsed.draft === true,    // T-202606-006: exponer draft para guard en parsePaste
      // TKT-202606-014 (REQ-202606-003 · AC2/AC3): valor crudo de _parsed.draft sin colapsar —
      //   necesario para distinguir "ausente" (undefined) de "false" explícito. `draft` de arriba
      //   ya no sirve para ese gate porque === true colapsa ambos casos al mismo false.
      draftRaw: _parsed.draft,
      rawCounts: {
        DISC: _countByType('DISC'),
        TKT:  _countByType('TKT'),
        REQ:  _countByType('REQ'),
        INC:  _countByType('INC'),
      }
    };
  }

  // Path alternativo: JSON puro sin fence — texto pegado desde botón copiar de Claude.ai
  // El botón copiar entrega el contenido del bloque sin los backticks del fence.
  const _trimmed = text.trim();
  if (_trimmed.startsWith('{') && _trimmed.endsWith('}')) {
    let _parsedRaw = null;
    let _jsonErrRaw = null;
    try { _parsedRaw = JSON.parse(_trimmed); } catch (e) { _jsonErrRaw = e.message; }
    if (!_jsonErrRaw && _parsedRaw && typeof _parsedRaw === 'object' && !Array.isArray(_parsedRaw) && _parsedRaw.title) {
      // Reusar path fence — reconstruir fence mínimo y re-invocar para evitar duplicación de lógica
      return parseCheckpoint('```\n' + _trimmed + '\n```');
    }
    // B-[pendiente-ID] AC-1/AC-2: JSON sin fence inválido, o válido sin "title" —
    // mismo objeto de error estructurado que el path con fence. Nunca null aquí:
    // parsePaste accede a ckpt.titulo sin guard y un null no capturado rompe la ingesta completa.
    return {
      titulo: '', proyecto: '', rol: '', resumen: '', archivos: '',
      discItems: '', tktItems: '', reqItems: '', incItems: '',
      estado: '', decision: '', proximoPaso: '',
      contexto: '', bloqueantes: '', aprendizaje: '',
      isCheckpoint: true,
      _jsonParseError: _jsonErrRaw || 'El bloque JSON sin fence no contiene un objeto válido con campo "title"',
      rawCounts: { DISC: 0, TKT: 0, REQ: 0, INC: 0 }
    };
  }

  // T-202606-005: texto sin fence ``` → devolver null (no es CHECKPOINT)
  return null;
}

// TKT1 (REQ CAEL-0718-01 · AC1-3, parte 1/2 — extracción): función pura compartida que extrae
//   los campos narrativos de un ckpt ya parseado (parseCheckpoint). Antes de este TKT existían
//   dos construcciones independientes del mismo tipo de dato: inline en ai._parsed (parsePaste,
//   flujo embebido) y ausente por completo en el flujo batch (ckptMeta:{} hardcodeado en
//   _processIngestBatch — deuda declarada en mod:126/mod:127). Este TKT unifica la extracción;
//   la propagación por bloque en el flujo batch (campo `metas` de _resolveCheckpointBatch) y el
//   consumo en showMergeDiffPanel quedan en el mismo TKT (parte 2/2, más abajo en este archivo)
//   y en TKT3 (locus-backlog-merge.js) respectivamente.
// Invariants: función pura — nunca muta `ckpt`. No incluye sprintProposal — retirado por diseño
//   del REQ (ver TKT4, Opción B aprobada por el founder: la única ruta de creación de sprint
//   queda en locus-sprint.js). No incluye duration/docsVerified/tensionsResolved/archivos — esos
//   campos no forman parte del contrato de tarjeta narrativa (TKT3); siguen viviendo solo en
//   ai._parsed para el flujo embebido, sin cambio en este TKT.
// AC1: dos ckpt con resumen distinto → cada llamada retorna el resumen de su propio ckpt, sin
//   mezcla entre llamadas (función pura, sin estado compartido).
// AC2: ckpt sin resumen (o ckpt null) → resumen: '' — nunca undefined, sin excepción lanzada.
// AC3: ckpt._rawSprintProposal presente (no-null) → el objeto retornado no declara ninguna clave
//   sprintProposal, ni siquiera undefined.
function _extractCkptMeta(ckpt) {
  const _c = ckpt || {};
  return {
    resumen:          _c.resumen     || '',
    aprendizaje:      _c.aprendizaje || '',
    bloqueantes:      _c.bloqueantes || '',
    decision:         _c.decision    || '',
    proximoPaso:      _c.proximoPaso || '',
    docUpdates:       _c._isJsonFormat ? (_c._rawDocUpdates || [])        : [],
    finnObservations: _c._isJsonFormat ? (_c._rawFinnObservations || null) : null,
    finnRelease:      _c._isJsonFormat ? (_c._rawFinnRelease || null)      : null,
    draft:            _c.draft === true,
    draftRaw:         _c.draftRaw,
    rol:              _c.rol    || '',
    titulo:           _c.titulo || ''
  };
}

// T-202604-200: actualiza la mini barra de progreso 3 fases del card
// phase: 1=Pegar (inicial), 2=Confirmar (CHECKPOINT válido), 3=Guardar (sesión persistida)
export function _setPhase(id, phase) {
  const p1 = document.getElementById('phase-paste-'   + id);
  const p2 = document.getElementById('phase-confirm-' + id);
  const p3 = document.getElementById('phase-save-'    + id);
  if (!p1 || !p2 || !p3) return;
  p1.className = 'sc-step' + (phase === 1 ? ' active' : phase > 1 ? ' done' : '');
  p2.className = 'sc-step' + (phase === 2 ? ' active' : phase > 2 ? ' done' : '');
  p3.className = 'sc-step' + (phase === 3 ? ' done' : '');
  // aria-current
  [p1,p2,p3].forEach((p,i) => {
    if (phase === i+1) p.setAttribute('aria-current','step');
    else p.removeAttribute('aria-current');
  });
}

// R-202605-046: normalizar campo sprint al ingestar ítems
// Valores centinela -> delete item.sprint (campo ausente = canónico para "sin sprint")
// Sprint cerrado -> delete item.sprint + advertencia DocLog
// T-202606-036 AC3: T con parentId cuyo sprint difiere del parent -> usar sprint del parent + señal informativa
// T-202606-158: pendingItems — ítems del CHECKPOINT actual aún no persistidos.
// Permite heredar sprint del parent R cuando R y T vienen en el mismo CHECKPOINT.
export function _normalizeSprint(item, pendingItems) {
  const raw = item.sprint;
  // AC-1: centinelas → campo ausente
  if (!raw || raw === 'n/a' || raw === 'N/A' || String(raw).trim() === '') {
    delete item.sprint;
    return;
  }
  // AC-6: sprint cerrado → campo ausente + advertencia DocLog
  {
    const allSprints = getActiveSprints(); // B-202605-065: devuelve proj.sprints completo — abiertos y cerrados
    const sprintObj  = allSprints.find(s => s.id === raw);
    if (sprintObj && sprintObj.status === 'closed') {
      _blogLog('sprint-normalizado', item.code || '', `Sprint cerrado normalizado a campo ausente: ${raw}`, 'backlog');
      delete item.sprint;
      return;
    }
  }
  // T-202606-036 AC3 / T-202606-158: TKT con parentId — heredar sprint del parent si difiere.
  // Busca el parent primero en pendingItems (ítems del CHECKPOINT actual aún no persistidos)
  // y luego en getItems() (backlog persistido), para cubrir el caso en que REQ y TKT vienen en el mismo CHECKPOINT.
  // T-202606-015: guards AC4 (placeholder parentId), AC5 (parent inexistente + advertencia),
  //   y verificación de status active/programado antes de heredar (AC1).
  if (item.parentId && item.code && itemKind(item) === 'TKT') {
    // AC-4: parentId placeholder → sin herencia automática
    if (_isPlaceholderCode(item.parentId)) return;
    const _allItems = getItems();
    const parent = (pendingItems && pendingItems.find(i => i.code === item.parentId)) ||
                   _allItems.find(i => i.code === item.parentId);
    if (parent) {
      const parentSprint = parent.sprint || '';
      if (raw !== parentSprint) {
        // AC-1: solo heredar si el sprint del parent está en estado active o programado.
        // Si parentSprint está vacío (sin sprint — Q-Backlog/Q-DISC), la herencia aplica sin verificación de status (AC-2).
        // Si parentSprint apunta a un sprint cerrado, ya fue normalizado a campo ausente antes
        // de llegar aquí (bloque AC-6 líneas 409-416), por lo que parentSprint vacío = sin sprint asignado (AC-3).
        // TKT-PARSE4: 'icebox' eliminado como término canónico — reemplazado por campo vacío/ausente.
        if (parentSprint) {
          const _allSprints = getActiveSprints();
          const _parentSprintObj = _allSprints.find(s => s.id === parentSprint);
          if (_parentSprintObj && _parentSprintObj.status !== 'active' && _parentSprintObj.status !== 'programado') {
            // Sprint del parent no está en active ni programado — no heredar, dejar sprint del T sin modificar
            return;
          }
        }
        _blogLog('sprint-heredado', item.code, `${item.code} sprint ajustado al de su parent ${item.parentId}: ${parentSprint || '(sin sprint)'}`, 'backlog');
        if (parentSprint) {
          item.sprint = parentSprint;
        } else {
          delete item.sprint;
        }
        return;
      }
    } else {
      // AC-5: parent no encontrado en backlog ni en pendingItems — advertencia informativa en DocLog
      _blogLog('parent-no-encontrado', item.code, `${item.code} parent ${item.parentId} no encontrado en backlog — herencia no aplicada`, 'backlog');
    }
  }
  // AC-5: sprint válido — conservar sin modificar
  // T-202606-085 AC-4: sprint_id no coincidente con ningún sprint registrado → advertencia DocLog, ítem se aplica igual
  {
    const _allSprints = getActiveSprints();
    const _found = _allSprints.find(s => s.id === raw);
    if (!_found) {
      _blogLog('sprint-id-no-registrado', item.code || '', `sprint_id "${raw}" no coincide con ningún sprint registrado — ítem aplicado igual`, 'backlog');
    }
  }
}

// T-202606-085: resolver campos sprint_id y sprint_name desde un ítem raw del CHECKPOINT.
// Acepta tres formatos de entrada:
//   (a) sprint_id + sprint_name separados (formato nuevo)
//   (b) sprint como string compuesto legacy 'PP-S-01 · Nombre' → descompone en sprint_id + sprint_name
//   (c) sprint: '' / ausente / n/a → sin sprint asignado (Q-Backlog/Q-DISC en Gen2)
// TKT-PARSE4: 'icebox' como formato (c) eliminado — BR-Execution §2 sin retrocompatibilidad.
// Devuelve { sprintAlias, sprint_id, sprint_name } donde sprintAlias es el valor para item.sprint
// (compatibilidad con _normalizeSprint que sigue operando sobre item.sprint).
function _resolveSprintFields(it) {
  // Formato (a): campos separados presentes — tienen precedencia
  if (it.sprint_id !== undefined) {
    const _id   = String(it.sprint_id  || '').trim();
    const _name = String(it.sprint_name || '').trim();
    return { sprintAlias: _id || undefined, sprint_id: _id, sprint_name: _name };
  }
  // Formato (b)/(c): solo campo sprint
  const raw = it.sprint;
  if (!raw || String(raw).trim() === '' || raw === 'n/a' || raw === 'N/A') {
    return { sprintAlias: undefined, sprint_id: '', sprint_name: '' };
  }
  const _rawStr = String(raw).trim();
  const _idx = _rawStr.indexOf(' · ');
  if (_idx !== -1) {
    // Formato compuesto legacy: 'PP-S-01 · Nombre'
    const _id   = _rawStr.slice(0, _idx).trim();
    const _name = _rawStr.slice(_idx + 3).trim();
    return { sprintAlias: _id, sprint_id: _id, sprint_name: _name };
  }
  // Valor simple: sprint_id sin nombre (Gen2 — 'icebox' Gen1 eliminado, TKT-PARSE4)
  return { sprintAlias: _rawStr, sprint_id: _rawStr, sprint_name: '' };
}

// B-202606-022: resolver [tmp:slug] en campo parent/parentId de un patch contra tgItems del mismo CHECKPOINT.
// Llama antes de acumular el patch en _patchItems_${id}.
// CAEL-25: helpers de #ingest-validation-panel — reemplazan el target prev-${id},
// inexistente en el DOM desde la migración a #ingest-ta global (CAEL-22).
function _showIngestValidationError(msgHtml) {
  const panel = document.getElementById('ingest-validation-panel');
  const errEl = document.getElementById('ingest-validation-error');
  const errMsgEl = document.getElementById('ingest-validation-error-msg');
  const warnEl = document.getElementById('ingest-validation-warnings');
  const resultEl = document.getElementById('ingest-validation-result');
  if (!panel || !errEl || !errMsgEl) return;
  panel.classList.remove('is-hidden');
  errEl.classList.remove('is-hidden');
  errMsgEl.innerHTML = msgHtml;
  if (warnEl) warnEl.classList.add('is-hidden');
  if (resultEl) resultEl.classList.add('is-hidden');
}

// CAEL-26: helper de warnings dinámicos — mismo shell que _showIngestValidationError,
// target #ingest-validation-warnings. Botón compartido entre los 4 tipos de warning:
// se clona antes de adjuntar el listener para no acumular listeners entre warnings
// consecutivos de la misma sesión de textarea (AC de contrato interno).
function _showIngestValidationWarning(msgHtml, onForce) {
  const panel = document.getElementById('ingest-validation-panel');
  const warnEl = document.getElementById('ingest-validation-warnings');
  const warnMsgEl = document.getElementById('ingest-validation-warning-msg');
  const forceBtn = document.getElementById('ingest-validation-force-btn');
  const errEl = document.getElementById('ingest-validation-error');
  const resultEl = document.getElementById('ingest-validation-result');
  if (!panel || !warnEl || !warnMsgEl || !forceBtn) return;
  panel.classList.remove('is-hidden');
  warnEl.classList.remove('is-hidden');
  warnMsgEl.innerHTML = msgHtml;
  if (errEl) errEl.classList.add('is-hidden');
  if (resultEl) resultEl.classList.add('is-hidden');
  const _freshBtn = forceBtn.cloneNode(true);
  forceBtn.parentNode.replaceChild(_freshBtn, forceBtn);
  _freshBtn.addEventListener('click', onForce, { once: true });
}

function _resetIngestValidationPanel() {
  const panel = document.getElementById('ingest-validation-panel');
  const errEl = document.getElementById('ingest-validation-error');
  const errMsgEl = document.getElementById('ingest-validation-error-msg');
  const warnEl = document.getElementById('ingest-validation-warnings');
  const warnMsgEl = document.getElementById('ingest-validation-warning-msg'); // CAEL-26
  const resultEl = document.getElementById('ingest-validation-result');
  if (panel) panel.classList.add('is-hidden');
  if (errEl) errEl.classList.add('is-hidden');
  if (errMsgEl) errMsgEl.innerHTML = '';
  if (warnEl) warnEl.classList.add('is-hidden');
  if (warnMsgEl) warnMsgEl.innerHTML = ''; // CAEL-26
  if (resultEl) resultEl.classList.add('is-hidden');
}

// CAEL-29 (TKT5): identidad de resultado — reemplaza el bloque que usaba `prev` y `state.projects`,
// ninguno declarado en el scope de parsePaste (ReferenceError en cada paste con title o summary
// truthy — la rama principal tras validación exitosa). Mismo patrón de referencia muerta ya
// resuelto para prev-${id} en CAEL-25/26/27 y para sess-proj-${id} aquí (fix inline — mismo
// archivo, sin scope nuevo, verificable por Finn junto con el TKT: la card por-Worker con
// selector de proyecto propio no existe desde la migración a #ingest-ta global, CAEL-22;
// getActiveProject() ya es la fuente única de proyecto activo en el resto de este archivo,
// líneas 1722/2258/2305). Migra badges de proyecto + título + resumen + archivo a
// #ingest-validation-result. no_incluye: próximo paso / bloqueantes (TKT6) y lista de ítems
// (TKT7) — quedan sin renderizar hasta que esos TKTs se emitan (ver AC de CAEL-29).
// CAEL-30 (TKT6): agregado próximo paso (nextStep) + bloqueantes (blockers) — 3 estados vía
// _renderIngestBlockers. Regex de código de ítem propio de este TKT (sin precedente en el
// archivo ni en module-contracts) — mismo patrón canónico [Tipo][YYYYMM][NNN]-[Sigla] de
// __BR-Ecosystem §4, sigla de 2-4 letras.
const _INGEST_BLOCKER_CODE_RE = /[A-Z]{2,4}-\d{6}-\d{3}/g;

function _renderIngestBlockers(containerEl, blockersRaw) {
  // Conserva el label estático (.validation-result-blockers-label) — limpia solo filas previas.
  containerEl.querySelectorAll('.blocker-row').forEach((el) => el.remove());
  const _raw = (blockersRaw || '').trim();
  const row = document.createElement('div');
  row.className = 'blocker-row';

  // AC3 (CAEL-30) — estado n/a
  if (!_raw || _raw.toLowerCase() === 'n/a') {
    row.classList.add('blocker-row--ok');
    const icon = document.createElement('i');
    icon.className = 'ti ti-check';
    icon.setAttribute('aria-hidden', 'true');
    row.appendChild(icon);
    row.appendChild(document.createTextNode('n/a'));
    containerEl.appendChild(row);
    return;
  }

  // AC4 (CAEL-30) — referencia a ítem: al menos un match del patrón de código
  _INGEST_BLOCKER_CODE_RE.lastIndex = 0;
  if (_INGEST_BLOCKER_CODE_RE.test(_raw)) {
    row.classList.add('blocker-row--ref');
    _INGEST_BLOCKER_CODE_RE.lastIndex = 0;
    let lastIndex = 0;
    let match;
    while ((match = _INGEST_BLOCKER_CODE_RE.exec(_raw)) !== null) {
      if (match.index > lastIndex) {
        row.appendChild(document.createTextNode(_raw.slice(lastIndex, match.index)));
      }
      const chip = document.createElement('span');
      chip.className = 'blocker-chip';
      chip.textContent = match[0];
      row.appendChild(chip);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < _raw.length) {
      row.appendChild(document.createTextNode(_raw.slice(lastIndex)));
    }
    containerEl.appendChild(row);
    return;
  }

  // AC5 (CAEL-30) — texto libre sin ID
  row.classList.add('blocker-row--warning');
  const icon = document.createElement('i');
  icon.className = 'ti ti-alert-triangle';
  icon.setAttribute('aria-hidden', 'true');
  row.appendChild(icon);
  row.appendChild(document.createTextNode(_raw));
  containerEl.appendChild(row);
}

// CAEL-31 (TKT7): lista de ítems — 3ª y última pieza que restablece el no_incluye original
// de CAEL-29. Shell (.validation-result-items) ya existe en index.html desde CAEL-19/23 —
// sin cambio de HTML en este TKT.
function _renderIngestResultItems(containerEl, items) {
  const _items = Array.isArray(items) ? items : [];
  // AC3 (CAEL-31) — reset: sin ítems, ocultar y vaciar
  if (_items.length === 0) {
    containerEl.classList.add('is-hidden');
    containerEl.innerHTML = '';
    return;
  }
  // AC1/AC2 (CAEL-31) — happy path + status badge ('nuevo' si el ítem no declara status)
  containerEl.innerHTML = '';
  containerEl.classList.remove('is-hidden');
  _items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'validation-result-item';
    const desc = document.createElement('span');
    desc.textContent = `${item.type} · ${item.title}`;
    const status = document.createElement('span');
    status.className = 'validation-result-item-status';
    status.textContent = item.status || 'nuevo';
    row.appendChild(desc);
    row.appendChild(status);
    containerEl.appendChild(row);
  });
}

function _showIngestValidationResult({ ckptProyecto, activeProjectName, title, summary, files, nextStep, blockers, items }) {
  const panel = document.getElementById('ingest-validation-panel');
  const resultEl = document.getElementById('ingest-validation-result');
  const badgeProjectEl = document.getElementById('ingest-result-badge-project');
  const titleEl = document.getElementById('ingest-result-title');
  const summaryEl = document.getElementById('ingest-result-summary');
  const fileEl = document.getElementById('ingest-result-file');
  const fileNameEl = document.getElementById('ingest-result-file-name');
  const nextStepRowEl = document.getElementById('ingest-result-next-step');
  const nextStepTextEl = document.getElementById('ingest-result-next-step-text');
  const blockersRowEl = document.getElementById('ingest-result-blockers');
  const itemsEl = document.getElementById('ingest-result-items');
  // AC guard — sin DOM: retorna sin lanzar excepción si falta cualquiera de los 10 targets.
  if (!panel || !resultEl || !badgeProjectEl || !titleEl || !summaryEl || !fileEl || !fileNameEl
      || !nextStepRowEl || !nextStepTextEl || !blockersRowEl || !itemsEl) return;
  const errEl = document.getElementById('ingest-validation-error');
  const warnEl = document.getElementById('ingest-validation-warnings');

  // AC1/AC2/AC3 — badge de proyecto
  const _ckptProj = (ckptProyecto || '').trim();
  const _activeProj = (activeProjectName || '').trim();
  if (_ckptProj && _activeProj && _ckptProj === _activeProj) {
    badgeProjectEl.classList.remove('validation-badge--warning');
    badgeProjectEl.classList.add('validation-badge--success');
    badgeProjectEl.textContent = `✓ Proyecto: ${_ckptProj}`;
  } else if (_ckptProj) {
    badgeProjectEl.classList.replace('validation-badge--success', 'validation-badge--warning');
    badgeProjectEl.textContent = `⚠ Proyecto: ${_ckptProj}`;
  } else {
    badgeProjectEl.classList.add('validation-badge--warning');
    badgeProjectEl.textContent = '⚠ Sin campo Proyecto';
  }

  // AC4/AC5
  titleEl.textContent = title || '';
  summaryEl.textContent = summary || '';

  // AC6/AC7
  if (files) {
    fileEl.classList.remove('is-hidden');
    fileNameEl.textContent = files;
  } else {
    fileEl.classList.add('is-hidden');
  }

  // AC1/AC2 (CAEL-30) — próximo paso, texto plano sin variante de tono
  const _nextStep = (nextStep || '').trim();
  if (_nextStep) {
    nextStepRowEl.classList.remove('is-hidden');
    nextStepTextEl.textContent = _nextStep;
  } else {
    nextStepRowEl.classList.add('is-hidden');
  }

  // AC3/AC4/AC5 (CAEL-30) — bloqueantes, tres estados vía _renderIngestBlockers
  _renderIngestBlockers(blockersRowEl, blockers);

  // AC1/AC2/AC3 (CAEL-31) — lista de ítems
  _renderIngestResultItems(itemsEl, items);

  // AC8 — mostrar panel, mismo criterio que _showIngestValidationError/_showIngestValidationWarning
  panel.classList.remove('is-hidden');
  resultEl.classList.remove('is-hidden');
  if (errEl) errEl.classList.add('is-hidden');
  if (warnEl) warnEl.classList.add('is-hidden');
}

export function parsePaste(id) {
  const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
  const text = ta ? ta.value : '';
  const ai = getAI(id); // B-202606-017: declarado al inicio de parsePaste — disponible en todos los branches (incluido el else de texto vacío, línea ~729)
  if (!ai) return;
  // T-202606-005: detectar CHECKPOINT via fence (con o sin especificador json) o JSON puro sin fence
  const isCheckpoint = /^\s*```(?:json)?\s*\{/.test(text) || (text.trim().startsWith('{') && text.trim().endsWith('}'));

  let title = '', summary = '', files = '', nextStep = '', bloqueantesRaw = '', tgItems = [], ckpt = null;
  if (isCheckpoint) {
    ckpt = parseCheckpoint(text);
    // B-[pendiente-ID] AC-3: guard explícito — parseCheckpoint puede retornar null
    // en paths no cubiertos; sin este guard, un null aquí rompe toda la ingesta.
    if (!ckpt) {
      ckpt = {
        titulo: '', proyecto: '', rol: '', resumen: '', archivos: '',
        discItems: '', tktItems: '', reqItems: '', incItems: '',
        estado: '', decision: '', proximoPaso: '',
        contexto: '', bloqueantes: '', aprendizaje: '',
        isCheckpoint: true,
        _jsonParseError: 'No se pudo interpretar el CHECKPOINT — formato no reconocido',
        rawCounts: { DISC: 0, TKT: 0, REQ: 0, INC: 0 }
      };
    }
    title = ckpt.titulo;
    summary = ckpt.resumen;
    files = ckpt.archivos;
    nextStep = ckpt.proximoPaso;
    bloqueantesRaw = ckpt.bloqueantes || '';

    // TKT-202606-011 AC2: el guard de T-202606-006 (bloqueo total de ingesta cuando draft:true)
    // queda eliminado — tgItems se preserva igual que con draft:false. El estado "pendiente de
    // aval Finn" ya no se comunica bloqueando el botón Guardar antes de abrir el panel: se comunica
    // dentro del panel DIFF (badge + botón confirmar deshabilitado — locus-backlog-merge.js AC3).
    // ai._parsed.draft (línea ~984, sin cambio en este TKT) sigue siendo la fuente que el panel lee.
    // R-202605-133: si parseCheckpoint detectó error en el bloque ```json, marcar error bloqueante
    if (ckpt._jsonParseError) {
      window[`_itemsJsonError_${id}`] = ckpt._jsonParseError;
    }
    // R-202605-133: si el CHECKPOINT es JSON puro, los ítems ya están en ckpt._rawItems — no buscar ---getItems()---
    else if (ckpt._isJsonFormat) {
      delete window[`_itemsJsonError_${id}`];
      const _rawItems = Array.isArray(ckpt._rawItems) ? ckpt._rawItems : [];
      const _validTypes    = _GEN2_TYPES;
      const _validStatuses = _VALID_STATUSES_GATE;
      const ckptHeaderRole = ckpt.rol || '';
      const _proyectoRawForQueue = (ckpt.proyecto || '').trim();
      let _itemError = null;
      const _rsNoAc = []; // T-202606-030 fix AC-3: acumular Rs sin AC — no hacer break en el primero
      for (let _i = 0; _i < _rawItems.length; _i++) {
        const _it = _rawItems[_i];
        // R-202605-062: patch — instrucción de operación, no tipo de ítem
        if (_it.type === 'patch') {
          if (!_it.code || _isPlaceholderCode(_it.code)) {
            // AC-7: patch sobre código placeholder → ignorar + advertencia DocLog
            _blogLog('patch-ignorado', _it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (_it.code || '(vacío)'), 'backlog');
            // T-202606-055 AC-1: toast visible al founder — el _blogLog solo no es suficiente
            showToast('warn', `Patch descartado: código placeholder no patcheable — ${_it.code || '(vacío)'}. Usa el código real asignado por Locus.`);
          } else {
            // T-202606-080: validación de rol para patch con status: bloqueado sobre R
            // AC-1: si status normalizado es 'bloqueado' y el ítem target en backlog es type R,
            //       verificar que ckptHeaderRole === 'QA · Finn' antes de acumular
            // AC-2: al fallar → _blogLog con mensaje canónico + patch descartado
            // AC-3: patch autorizado ('QA · Finn') → acumular normalmente sin advertencia
            // AC-4: patches con status distinto a bloqueado → flujo normal sin modificar
            const _patchNormSt = _it.status ? _canonicalStatus(_it.status, 'REQ') : null;
            if (_patchNormSt === 'bloqueado') {
              const _patchTarget = (getItems() || []).find(x => x.code === _it.code);
              if (_patchTarget && itemKind(_patchTarget) === 'REQ') {
                const _patchAuthorizedRole = 'QA · Finn';
                if (ckptHeaderRole !== _patchAuthorizedRole) {
                  _blogLog(
                    'rol-no-autorizado-bloqueado',
                    _it.code,
                    `Transición bloqueado en R ${_it.code} rechazada: solo Finn puede mover un R a bloqueado. Origen: ${ckpt ? (ckpt.titulo || '') : ''}`,
                    'backlog'
                  );
                  continue; // AC-2: patch descartado — no acumular en _patchItems
                }
              }
            }
            window[`_patchItems_${id}`] = window[`_patchItems_${id}`] || [];
            window[`_patchItems_${id}`].push(_it);
          }
          continue;
        }
        if (!_it.type || !_it.code) {
          _itemError = `Ítem [${_i}]: faltan campos obligatorios (type, code). Recibido: ${JSON.stringify(_it)}`;
          break;
        }
        if (!_validTypes.includes(_it.type)) {
          _itemError = `Ítem [${_i}]: type inválido "${_it.type}". Valores válidos: REQ · TKT · DISC · INC · PRB · CHG`;
          break;
        }
        // REQ-[pendiente-ID]: ítems ITIL (INC/PRB/KE/CHG) — ciclo de vida vive en incident_status,
        // nunca en status. Desvío completo antes de cualquier validación orientada a Scrum.
        if (_ITIL_TYPES.has(_it.type)) {
          const _itilResult = _buildItilItem(_it, ckptHeaderRole, _proyectoRawForQueue, ckpt.titulo);
          if (_itilResult.error) {
            _itemError = _itilResult.error;
            break;
          }
          tgItems.push(_itilResult.item);
          continue;
        }
        if (!_it.status) {
          _itemError = `Ítem [${_i}]: faltan campos obligatorios (type, code, status). Recibido: ${JSON.stringify(_it)}`;
          break;
        }
        // INC-parser-status-invalido-omite-item: status 'historico' o inválido para el tipo ya
        // NO bloquea el CHECKPOINT ni omite el ítem — __BR-Ecosystem §8 declara que Locus "aplica
        // el ítem pero ignora el campo status". _normSt cae a 'pendiente' (mismo default usado en
        // el resto del pipeline — ver item.status || 'pendiente' en locus-backlog-item.js) y el
        // ítem continúa su construcción normal con el resto de sus campos intactos.
        const _isHistoricoRaw = _it.status.trim().toLowerCase() === 'historico' || _it.status.trim().toLowerCase() === 'histórico';
        // R-202605-023: normalizar antes de validar — acepta variantes de en-revision y otros
        let _normSt = _isHistoricoRaw ? null : _canonicalStatus(_it.status, _it.type);
        if (!_normSt || (!_validStatuses.includes(_normSt) && _normSt !== 'promoted' && _normSt !== 'bloqueado' && _normSt !== 'discovery')) {
          _blogLog(
            _isHistoricoRaw ? 'status-historico-emitido' : 'status-invalido-ignorado',
            _it.code || '[pendiente-ID]',
            _isHistoricoRaw
              ? `Status "historico" no es emitible — asignado exclusivamente por Locus al cerrar sprint. Campo ignorado.`
              : `Status "${_it.status}" inválido para tipo ${_it.type}. Campo ignorado.`,
            'backlog'
          );
          _normSt = 'pendiente';
        }
        // T-202606-035: bloqueo sin-sprint + en-revision — BR-Ecosystem §5
        // T-202606-085: leer sprint_id como fallback cuando sprint no está presente (formato nuevo)
        // TKT-PARSE4: 'icebox' (Gen1) eliminado — sin sprint = campo vacío o ausente (Q-Backlog/Q-DISC Gen2)
        const _sprintRaw = (_it.sprint || _it.sprint_id || '').trim().toLowerCase();
        const _sinSprint = _sprintRaw === '' || _sprintRaw.endsWith('-q-backlog');
        if (_normSt === 'en-revision' && _sinSprint) {
          _itemError = `CHECKPOINT bloqueado: ${_it.code || '[pendiente-ID]'} tiene status en-revision sin sprint asignado. Asignar sprint antes de continuar.`;
          break;
        }
        // T-202606-031: validación de rol autorizado para transición R → bloqueado
        // AC-1: solo 'QA · Finn' puede emitir R con status bloqueado
        // AC-2: al fallar → advertencia en DocLog con mensaje canónico + omitir cambio de status
        // AC-3: otros cambios del CHECKPOINT continúan aplicándose (continue, no break)
        // AC-4: misma validación aplica a ítem R completo (no solo patch) con status: bloqueado
        if (itemKind(_it) === 'REQ' && _normSt === 'bloqueado') {
          const _authorizedRole = 'QA · Finn';
          if (ckptHeaderRole !== _authorizedRole) {
            _blogLog(
              'rol-no-autorizado-bloqueado',
              _it.code || '[pendiente-ID]',
              `Transición bloqueado en R ${_it.code || '[pendiente-ID]'} rechazada: solo Finn puede mover un R a bloqueado. Origen: ${ckpt ? (ckpt.titulo || '') : ''}`,
              'backlog'
            );
            continue; // AC-2+AC-3: omitir este ítem — resto del CHECKPOINT continúa
          }
        }
        // T-202606-030: bloqueo R sin AC — BR-Ecosystem §5 + BR-Core §8 regla dura
        // AC-1: R con ac ausente o vacío → acumular en _rsNoAc (AC-3: no break — seguir loop)
        // AC-2: mensaje canónico con título del R + Origen: [título del CHECKPOINT]
        // AC-3: acumular todos los Rs sin AC — emitir mensaje consolidado al final del loop
        if (itemKind(_it) === 'REQ' && (!Array.isArray(_it.ac) || _it.ac.length === 0)) {
          _rsNoAc.push(`R ${_it.code || '[pendiente-ID]'} "${_it.title || _it.desc || ''}"`);
          continue;
        }
        // T-202606-085: resolver sprint_id y sprint_name antes de construir el ítem
        const _sprintF = _resolveSprintFields(_it);
        tgItems.push({
          type:          _it.type,
          code:          _it.code,
          // TKT (REQ-[pendiente-ID] · ref_id+title en 2 archivos): tercer punto de
          // construcción de tgItems — mismo campo que los otros dos, ver comentario en
          // _buildTgItemsFromParsed.
          refId:         _it.ref_id || null,
          title:         _it.title  || _it.desc  || '',
          desc:          _it.title  || _it.desc  || '',
          priority:      _it.priority || 'medium',                             // T-202606-031
          status:        _normSt,
          _noStatus:     false,
          effort:        _it.effort != null ? (parseInt(_it.effort) || null) : null,
          area:          _it.area   || '',
          sprint:        _sprintF.sprintAlias,                                 // T-202606-085: alias → _normalizeSprint opera sobre este campo
          sprint_id:     _sprintF.sprint_id,                                   // T-202606-085
          sprint_name:   _sprintF.sprint_name,                                 // T-202606-085
          ac:            Array.isArray(_it.ac) ? _it.ac : [],
          role:          _it.role   || ckptHeaderRole,
          discardReason: _it.discard_reason || _it.reason || '',
          discardRef:    _it.ref    || '',
          blockedBy:     Array.isArray(_it.blockedBy) ? _it.blockedBy : [],
          parentId:      _it.parentId || _it.parent || null,  // B-202605-055: schema usa "parent", campo interno es "parentId"
          origin:        _it.origin   || null,  // R-202605-004: trazabilidad de ítems derivados
          dependsOn:     Array.isArray(_it.depends_on) ? _it.depends_on : [],  // T-202605-139
          triggeredBy:   _it.triggered_by  || null,                            // T-202605-139
          origenDisc:    _it.origen_disc   || null,                            // T-202605-139 // T-[pendiente-ID]: origen_p→origen_disc
          promovida_a:   _it.promovida_a   || null,                            // T-202605-139
          intencion:     _it.intencion     || null,                            // T-202606-105
          no_incluye:    Array.isArray(_it.no_incluye) ? _it.no_incluye : [], // T-202606-105
          archivos:      Array.isArray(_it.archivos) ? _it.archivos : [],     // T-[pendiente-ID]: BR-Ecosystem v5.2 — archivos reales que el T toca, declarado por Cael en Fase 2
          // TKT3 (REQ CAEL-0721-01): contract_detail no se propagaba en este sitio (sí en los
          // otros 2 puntos de construcción) — se perdía entre parseo y mergeBacklogFromTG
          // específicamente en el path de sesión embebida. Alineado a BR-Execution §2.
          contract_detail: _it.contract_detail || null,
          // TKT3 (REQ CAEL-0721-01): kill_criteria/next_role/design_intent/blocked_at/
          // contract_update nunca se propagaban a tgItem en ninguno de los 3 puntos de
          // construcción del parser — mismo patrón de pérdida ya corregido para draft
          // (TKT1/REQ-202607-027) y contract_detail (TKT4/REQ-contract-rename). Sin esta
          // propagación, _buildCommonItemFields() (locus-backlog-item.js, TKT1 de este mismo
          // REQ) nunca tiene el dato disponible para persistir, sin importar lo declarado
          // en el CHECKPOINT.
          kill_criteria: _it.kill_criteria || null,
          nextRole:      _it.next_role     || null,
          designIntent:  _it.design_intent || null,
          blockedAt:     _it.blocked_at    || null,
          contract_update: _it.contract_update || null,
          // TKT1 (REQ-202607-026 · AC1): draft es campo de nivel CHECKPOINT (ckpt.draft), no
          // del ítem individual — se propaga aquí (path de sesión embebida) para que
          // mergeBacklogFromTG lo persista en cada ítem nuevo del batch. Sin esta propagación,
          // un REQ/TKT nuevo se persistía como draft:false por default independiente de lo
          // declarado en el CHECKPOINT.
          draft:         ckpt.draft === true,
          schema_version: _it.schema_version || null                          // T-202606-105
        });
        // R-202605-046: normalizar sprint a campo ausente si es centinela o sprint cerrado
        // T-202606-158: pasar tgItems para heredar sprint de parent R en mismo CHECKPOINT
        _normalizeSprint(tgItems[tgItems.length - 1], tgItems);
        // T-202606-008: alerta DocLog si T tiene contract_update: 'sí' y doc_updates ausente o vacío
        // AC-1: extraer campo contract_update del ítem T
        // AC-2: si valor es 'sí' y _rawDocUpdates está vacío → entrada en DocLog
        // AC-3: si doc_updates tiene al menos una entrada → sin alerta
        // AC-4: valores 'no' y 'n/a' no activan verificación
        // AC-5: ingesta continúa en ambos casos — no es bloqueo
        if (itemKind(_it) === 'TKT' && (_it.contract_update || '').toLowerCase() === 'sí') {
          const _hasDocUpdates = Array.isArray(ckpt._rawDocUpdates) && ckpt._rawDocUpdates.length > 0;
          if (!_hasDocUpdates) {
            _blogLog(
              'contract-update-sin-doc-update',
              _it.code || '[pendiente-ID]',
              `contract_update declarado sí — DOC-UPDATE de module-contracts ausente en CHECKPOINT ${ckpt.titulo || ''}`,
              'backlog'
            );
          }
        }

        // T-202606-018: advertencia si DISC tiene status promoted sin promovida_a
        if (itemKind(_it) === 'DISC' && _normSt === 'promoted' && !_it.promovida_a) {
          _blogLog('promoted-sin-ref', _it.code || '[pendiente-ID]', 'DISC ' + (_it.code || '[pendiente-ID]') + ' con status promoted sin campo promovida_a — trazabilidad incompleta', 'backlog');
        }
        // T-202606-014: advertencia si depends_on contiene [pendiente-ID] literal con 2+ ítems nuevos en el CHECKPOINT
        // INC-parser-tmpslug-mensaje: mensaje recomendaba [tmp:slug] — deprecado desde infra_version 33
        // (__BR-Ecosystem §4). El motor interno sigue resolviendo vía [tmp:slug] (ver locus-backlog-item.js
        // L98-100, decisión aceptada de no reescribir el motor) — pero el mensaje dirigido al rol emisor
        // debe recomendar el mecanismo vigente para declarar en CHECKPOINTs nuevos: ref_id + title.
        if (Array.isArray(_it.depends_on) && _it.depends_on.includes('[pendiente-ID]')) {
          const _newItemCount = _rawItems.filter(i => i.type !== 'patch' && _isPlaceholderCode(i.code || '')).length;
          if (_newItemCount >= 2) {
            _blogLog('dep-placeholder-ambiguo', _it.code || '[pendiente-ID]', (_it.code || '[pendiente-ID]') + ' depends_on contiene [pendiente-ID] no resoluble — usar ref_id + title para referencias cruzadas (ver __BR-Ecosystem §4).', 'backlog');
          }
        }
      }
      // TKT-202606-014 (REQ-202606-003 · TKT4 · AC1/AC2/AC4): gate de bloqueo total —
      // BR-Ecosystem §8 regla dura: draft obligatorio sin default cuando items incluye
      // REQ/TKT nuevos o con status declarado — se omite cuando items está vacío, solo
      // contiene DISC, o solo contiene INC/PRB/KE/CHG (rama Reactiva, sin Fase 5). Usa
      // draftRaw (AC2 de este mismo TKT, ya presente arriba) para distinguir undefined
      // (ausente) de false (explícito, AC3).
      // TKT-202607-003: _draftGateTypes incluía INC y CHG por error — ambos son rama
      // Reactiva (§4b) y nunca deben gatear sobre draft, igual que PRB y KE (ya excluidos
      // correctamente). Solo REQ/TKT (rama Planeada) requieren draft obligatorio.
      const _draftToastKey = `_draftGateToastSeen_${id}`;
      if (!_itemError) {
        const _draftGateTypes = ['REQ', 'TKT'];
        const _hasDraftGatedItem = _rawItems.some(_di => _di && _di.type !== 'patch' && _draftGateTypes.includes(_di.type));
        if (_hasDraftGatedItem && ckpt.draftRaw === undefined) {
          _itemError = 'Campo "draft" ausente — CHECKPOINT no aplicado. Declarar draft: true o false.';
          if (!window[_draftToastKey]) {
            showToast('error', _itemError);
            window[_draftToastKey] = true;
          }
        } else {
          delete window[_draftToastKey];
        }
      }
      // T-202606-030 fix AC-2+AC-3: emitir _itemError consolidado si hay Rs sin AC
      // Origen: título del CHECKPOINT — disponible en ckpt.titulo
      if (!_itemError && _rsNoAc.length > 0) {
        const _ckptOrigen = ckpt.titulo || '';
        _itemError = `CHECKPOINT bloqueado: ${_rsNoAc.join(' · ')} no tiene${_rsNoAc.length !== 1 ? 'n' : ''} AC de coherencia de conjunto. Origen: ${_ckptOrigen}. Adjuntar CHECKPOINT corregido antes de continuar.`;
      }
      if (_itemError) {
        window[`_itemsJsonError_${id}`] = _itemError;
        tgItems = [];
        delete window[`_patchItems_${id}`];
      } else {
        // T-[pendiente-ID] (REQ-contract-rename): campo alineado a BR-Execution §2 —
        // contract_detail reemplaza a contract, sin retrocompatibilidad (BR-Execution §2).
        _rawItems.forEach(it => { if (it.contract_detail) _ctrMergeFromItem(it.code || '[pendiente-ID]', it.contract_detail); });
        // T-202606-010 AC-7: llamar processDocUpdate por cada entrada de doc_updates antes de finalizar ingesta.
        // AC-7b: si retorna conflicto:true → toast visible pero ingesta continúa normalmente (no bloquea).
        if (Array.isArray(ckpt._rawDocUpdates) && ckpt._rawDocUpdates.length > 0) {
          const _ckptTitleForDu = ckpt.titulo || '';
          ckpt._rawDocUpdates.forEach(du => {
            const { conflicto, msg } = processDocUpdate(du, _ckptTitleForDu);
            if (conflicto && msg) showToast('warn', msg);
            // TKT-202607-033 (REQ-202607-005 AC3): doc_updates dirigido a doc de infraestructura —
            // alerta en DocLog, no bloquea el ingest. AC4: doc ausente o vacío → sin alerta.
            const _duDocNorm = (du.doc || '').toLowerCase().trim();
            if (_duDocNorm && _INFRA_DOC_NAMES.has(_duDocNorm)) {
              _blogLog(
                'doc-update-infra-detectado',
                `${_duDocNorm}::${du.section || ''}`,
                'DOC-UPDATE dirigido a doc de infraestructura — nunca pasa por esta cola, ver __BR-Ecosystem §11',
                'backlog'
              );
            }
          });
        }
      }
    }
  }

  // T-202606-039: extraer inline_fix del CHECKPOINT — path JSON usa ckpt._inlineFixes,
  // path legacy usa _parseInlineFixes sobre el texto crudo.
  const _inlineFixes = (ckpt && ckpt._isJsonFormat)
    ? (ckpt._inlineFixes || [])
    : (isCheckpoint ? _parseInlineFixes(text) : []);

  const _pendingPatches = window[`_patchItems_${id}`] || [];
  delete window[`_patchItems_${id}`];
  // TKT1 (REQ CAEL-0718-01 · no_incluye): docUpdates/finnObservations/finnRelease/draft/draftRaw/
  //   rol se leían antes vía ternarios inline repetidos aquí — ahora vienen de _extractCkptMeta,
  //   misma función que alimenta `metas` en el flujo batch (_resolveCheckpointBatch, más abajo).
  //   Valores producidos idénticos a los ternarios previos — ver equivalencia en el CHECKPOINT de
  //   entrega. sprintProposal queda fuera del contrato de _extractCkptMeta (AC3) — sigue
  //   construyéndose inline aquí sin cambio, retiro completo pendiente de TKT4.
  const _ckptMetaShared = _extractCkptMeta(ckpt);
  ai._parsed = { title, summary, files, tgItems, patchItems: _pendingPatches, isCheckpoint, nextStep, ckptProyecto: ckpt ? (ckpt.proyecto || '') : '', inlineFixes: _inlineFixes,
    // T-202606-016: campos informativos adicionales
    duration:         ckpt ? (ckpt.duration         || '') : '',
    docsVerified:     ckpt ? (ckpt.docsVerified      || '') : '',
    tensionsResolved: ckpt ? (ckpt.tensionsResolved  || '') : '',
    // T-202606-017: doc_updates y sprint_proposal — path JSON puro
    docUpdates:       _ckptMetaShared.docUpdates,
    sprintProposal:   (ckpt && ckpt._isJsonFormat) ? (ckpt._rawSprintProposal || null) : null,
    // T-202606-018: finn_observations — path JSON puro
    finnObservations: _ckptMetaShared.finnObservations,
    // TKT2 (REQ CAEL-0717-01): finn_release — path JSON puro. Propagado hasta aquí; el punto
    //   donde este flujo llama a showMergeDiffPanel vive en locus-session-save.js (no adjunto
    //   en esta sesión, no declarado en el campo `archivos` del TKT) — ver bloqueo declarado
    //   en el CHECKPOINT de entrega.
    finnRelease: _ckptMetaShared.finnRelease,
    // T-202606-070: persistir rol y archivos del CHECKPOINT — ambos paths JSON y legacy
    rol:      _ckptMetaShared.rol,
    archivos: ckpt ? (ckpt.archivos || '') : '',
    // T-202606-013: propagar draft a ai._parsed. El guard "secundario" en _doApplyMergeAndFinish
    //   que motivó esta propagación fue eliminado por huérfano (INC-202607-001, locus-session-save.js).
    //   La propagación sigue siendo necesaria por otros consumidores: draftPending (locus-session-save.js:551)
    //   y _baseMsg (locus-session-save.js:863) — DISC-202607-009.
    draft: _ckptMetaShared.draft,
    // TKT-202606-014: propagar valor crudo (undefined/true/false) — ckpt.draftRaw es undefined
    // cuando ckpt es el fallback de parseCheckpoint nulo (línea ~700), igual que ausencia real del campo.
    draftRaw: _ckptMetaShared.draftRaw,
    // T-202606-072: detectar devolución Finn→Cael — presente solo cuando rol comienza con 'QA' y texto contiene patrón
    ...(() => {
      const _rol = ckpt ? (ckpt.rol || '') : '';
      if (!_rol.startsWith('QA')) return {};
      const _hasDev = /pasar a cael|devolver a cael/i.test(text);
      return { devolucion_cael: _hasDev };
    })(),
  };

  // Calcular discrepancia raw vs parseado
  let rawTotal = 0, parsedTotal = tgItems.length;
  if (isCheckpoint && ckpt && ckpt.rawCounts) {
    rawTotal = Object.values(ckpt.rawCounts).reduce((a, b) => a + b, 0);
  }
  const _discrepancy = rawTotal > 0 && rawTotal !== parsedTotal ? { raw: rawTotal, parsed: parsedTotal } : null;

  const cc = document.getElementById('cc-' + id);
  if (cc) {
    const len = text.length;
    cc.textContent = len > 0 ? `${len} caracteres` : '';
    cc.className = len > 2000 ? 'char-counter warn' : 'char-counter';
  }

  // T-088: feedback visual paste-wrap según validez del checkpoint
  const wrap = ta ? ta.closest('.paste-wrap') : null;
  if (wrap) {
    if (isCheckpoint && title) {
      wrap.classList.add('paste-wrap--valid');
    } else {
      wrap.classList.remove('paste-wrap--valid');
    }
  }
  // TKT2 (REQ CAEL-01): fase 2 ("Revisar") ya no se activa al validar el pegado — solo
  // refleja que el pegado sigue vigente (fase 1). Fase 2 se marca en _doSaveSession
  // (locus-session-save.js) justo antes de abrir showMergeDiffPanel — momento real en que
  // el founder empieza a revisar. Antes: _setPhase(id, (isCheckpoint && title) ? 2 : 1).
  _setPhase(id, 1);

  // TKT2 (REQ CAEL-01) AC4: dry-run debounced retirado — target real 'diff-preview-' + id
  // no existe en ningún HTML del proyecto (grep exhaustivo, mismo criterio que el hallazgo de
  // _setPhase en TKT1) — getElementById siempre null, el único efecto observable era el costo
  // de un mergeBacklogFromTG(dryRun:true) real por cada keystroke sin salida visible. window
  // timer '_diffPreviewTimer_'+id retirado junto con el bloque — sin otro consumidor del timer.

  const draftKey = LOCUS_KEYS.DRAFT_KEY_PREFIX + id;
  if (text.trim()) {
    try {
      localStorage.setItem(draftKey, text);
      // TKT2 (REQ-restore-draft) AC6: timestamp de guardado — _maybeRestoreDraft() lo usa
      // para el sufijo "hace N min" del banner. Mismo bloque que el setItem del texto,
      // sin función nueva.
      localStorage.setItem(draftKey + '-ts', String(Date.now()));
    } catch (e) {
      // B-202605-NNN: QuotaExceededError — storage lleno. El draft no se guarda
      // pero el render del preview continúa sin interrupciones.
      _checkStorageQuota();
    }
    // R-3: persistir borrador en Supabase con debounce para no saturar en cada keystroke
    // INC-[pendiente-ID]: typeof _supabase !== 'undefined' era guard siempre falso — este
    // upsert nunca se ejecutaba, el draft nunca llegaba a Supabase pese al debounce.
    clearTimeout(window['_draftSbTimer_' + id]);
    window['_draftSbTimer_' + id] = setTimeout(() => {
      const _sbCtx = getSupabaseContext();
      if (_sbCtx) {
        const savedText = localStorage.getItem(draftKey);
        if (savedText) {
          _sbCtx.client.from('tracker_docs').upsert(
            [{ user_id: _sbCtx.userId, key: draftKey, value: { text: savedText, savedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }],
            { onConflict: 'user_id,key' }
          ).then(({ error }) => {
            if (error) _offlineQueuePush({ type: 'draft', aiId: id });
          });
        }
      }
    }, 3000); // 3s debounce — no escribe en cada keystroke
    const dot = document.getElementById('draft-' + id);
    if (dot) dot.className = 'draft-dot visible';
  } else {
    localStorage.removeItem(draftKey);
    localStorage.removeItem(draftKey + '-ts'); // TKT2 (REQ-restore-draft) AC6 — sin huérfanos
    const dot = document.getElementById('draft-' + id);
    if (dot) dot.className = 'draft-dot';
    if (wrap) wrap.classList.remove('paste-wrap--valid');
    // B-202604-195: reset completo al vaciar el textarea
    // Limpiar errores JSON, flags de warning no bloqueante y toast activo
    delete window[`_itemsJsonError_${id}`];
    delete window[`_noItemsWarnSeen_${id}`];
    delete window[`_rolFieldWarnSeen_${id}`];
    delete window[`_doneNoAcWarnSeen_${id}`];
    delete window[`_discrepancyWarnSeen_${id}`];
    delete window[`_draftGateToastSeen_${id}`];
    // Resetear preview y ta-has-items al estado inicial
    // CAEL-25: prev-${id} no existe en el DOM desde CAEL-22 (migración a #ingest-ta global) —
    // target real es #ingest-validation-panel.
    _resetIngestValidationPanel();
    const _taEl = document.getElementById('ingest-ta') /* CAEL-22 */;
    if (_taEl) _taEl.classList.remove('ta-has-items');
    ai._parsed = { title: '', summary: '', files: '', tgItems: [], isCheckpoint: false, nextStep: '', ckptProyecto: '' };
    return;
  }

  // CAEL-25: 'prev' (prev-${id}) retirado — no existe en el DOM desde CAEL-22.
  // Target real de los checks bloqueantes: #ingest-validation-error, vía _showIngestValidationError.
  if (text.trim()) {
    // T-202606-005: gate de validación — presencia de field 'title' + JSON válido
    // ---FIN-CHECKPOINT--- no requerido · path legacy eliminado
    const _isJsonFmt = !!(ckpt && ckpt._isJsonFormat);
    // T-202605-435: CHECKPOINT de transición — si campo WIP: presente y Resumen: ausente,
    // inferir summary como 'WIP' para no bloquear la validación.
    const hasWip = /^\s*WIP\s*:/mi.test(text);
    const effectiveSummary = summary || (hasWip ? 'WIP' : '');
    // CAEL-25 AC1-3: checks separados en mensajes atómicos — cada uno con su literal exacto,
    // sin condición compuesta con 'o'.
    if (!isCheckpoint) {
      _showIngestValidationError('\u26A0 Formato inv\xE1lido \u2014 Formato inv\xE1lido \u2014 se esperaba bloque JSON sin especificador de lenguaje.');
      return;
    }
    if (!title) {
      _showIngestValidationError('\u26A0 Formato inv\xE1lido \u2014 Falta el campo <code>title</code> dentro del bloque JSON.');
      return;
    }
    if (!effectiveSummary) {
      _showIngestValidationError('\u26A0 Formato inv\xE1lido \u2014 Falta el campo <code>summary</code> dentro del bloque JSON.');
      return;
    }

    // R-202604-038 / R-202605-133: validar resultado del parser JSON de ---getItems()--- o ```json
    // AC-2: JSON inválido → error bloqueante antes de procesar cualquier otra cosa
    const _itemsJsonErr = window[`_itemsJsonError_${id}`];
    if (_itemsJsonErr) {
      _showIngestValidationError(`&#9940; Bloque de ítems inválido — ${esc(_itemsJsonErr)}.<br><span class="paste-hint">Corrige el JSON antes de procesar. El bloque debe ser un array de objetos con al menos <code>type</code>, <code>code</code> y <code>status</code>.</span>`);
      return;
    }
    // T-202606-005: path único JSON — ítems van dentro del bloque JSON (campo items: [])
    // Si items está ausente o vacío el CHECKPOINT se guarda sin ítems — comportamiento esperado.

    // T-202604-350: CONTEXT-SECTION eliminado del modelo — parser no lo busca ni procesa.
    // T-202604-351: CHECKPOINTs históricos con CONTEXT-SECTION pasan en silencio — degradación silenciosa.

    // Base Rules V2.0.1 §11: campo Rol: obligatorio — aviso no bloqueante si ausente
    // No retroactivo: CHECKPOINTs históricos sin Rol: pasan con aviso
    // CAEL-26: target migrado de prev-${id} (inexistente desde CAEL-22) a #ingest-validation-warnings.
    const _hasRolField = /^\s*Rol\s*:/m.test(text) || !!(ckpt && ckpt._isJsonFormat && ckpt.rol);
    const _rolWarnKey  = `_rolFieldWarnSeen_${id}`;
    if (isCheckpoint && !_hasRolField && !window[_rolWarnKey]) {
      _showIngestValidationWarning(
        '⚠ Falta el campo <code>Rol:</code> en el CHECKPOINT.<br><span class="paste-hint">Formato esperado: <code>Rol: FS · Mike</code>. El paste funcionará igual sin este campo.</span>',
        () => { window[_rolWarnKey] = true; parsePaste(id); }
      );
      return;
    }
    if (window[_rolWarnKey]) delete window[_rolWarnKey];

    // T-202605-436: ítems done sin AC — aviso no bloqueante
    // AC-1: solo ítems con status done y ac vacío o ausente
    // AC-2: aviso lista los códigos afectados — no genérico
    // AC-3: ítems pendiente o descartado sin AC no generan aviso
    // CAEL-26: target migrado de prev-${id} (inexistente desde CAEL-22) a #ingest-validation-warnings.
    const _doneWarnKey = `_doneNoAcWarnSeen_${id}`;
    if (isCheckpoint && !window[_doneWarnKey]) {
      const _doneNoAc = tgItems.filter(it => it.status === 'done' && (!it.ac || it.ac.length === 0));
      if (_doneNoAc.length > 0) {
        const _codes = _doneNoAc.map(it => `<code>${esc(it.code)}</code>`).join(', ');
        _showIngestValidationWarning(
          `⚠ ${_doneNoAc.length} ítem${_doneNoAc.length !== 1 ? 's' : ''} marcado${_doneNoAc.length !== 1 ? 's' : ''} como done sin criterios de aceptación: ${_codes}.<br><span class="paste-hint">Un ítem done sin AC no es verificable. Agrega AC antes de marcar como done, o continúa si es intencional.</span>`,
          () => { window[_doneWarnKey] = true; parsePaste(id); }
        );
        return;
      }
    }
    if (window[_doneWarnKey]) delete window[_doneWarnKey];

    // R-202604-037: validar Proyecto: contra tabla de strings canónicos
    // AC-1: tabla canónica CANONICAL_PROJECTS declarada en locus-storage.js
    // AC-2: valor no canónico → error bloqueante — muestra valor recibido + lista de válidos
    // AC-4: vacío → aviso no bloqueante (comportamiento actual preservado)
    // AC-5: validación case-sensitive
    const _proyectoRaw = isCheckpoint ? (ckpt ? (ckpt.proyecto || '').trim() : '') : '';
    if (isCheckpoint && _proyectoRaw && !CANONICAL_PROJECTS.includes(_proyectoRaw)) {
      const _validList = CANONICAL_PROJECTS.map(p => `<code>${esc(p)}</code>`).join(' · ');
      // B-202605-078: suprimir toast si el panel de validación ya muestra este mismo error.
      // CAEL-25: target migrado de prev-${id} (inexistente) a #ingest-validation-error.
      // CAEL-25: #ingest-validation-error solo se muestra vía _showIngestValidationError —
      // su visibilidad ya es la señal de "error ya mostrado", sin necesidad de inspeccionar
      // el string 'paste-error' (ausente en el nuevo target, presente solo en el prev-${id} legacy).
      const _errEl = document.getElementById('ingest-validation-error');
      const _previewAlreadyShowing = !!_errEl && !_errEl.classList.contains('is-hidden');
      _showIngestValidationError(`⛔ CHECKPOINT inválido — <code>Proyecto:</code> contiene un valor no reconocido: <strong>${esc(_proyectoRaw)}</strong>.<br><span class="paste-hint">Valores válidos (case-sensitive): ${_validList}. Corrige el campo <code>Proyecto:</code> antes de procesar.</span>`);
      if (!_previewAlreadyShowing) showToast('error', `⛔ Proyecto no reconocido: "${esc(_proyectoRaw)}" — corrige el campo`);
      // R-202605-063: sugerencia de string canónico por distancia de edición
      {
        const { suggestion, distance } = _suggestCanonical(_proyectoRaw);
        if (distance <= 3) {
          _blogLog('proyecto-no-reconocido', '', `Proyecto no reconocido: "${_proyectoRaw}". ¿Quisiste decir "${suggestion}"?`, 'parser');
        } else {
          _blogLog('proyecto-no-reconocido', '', `Proyecto no reconocido: "${_proyectoRaw}". Verificar string canónico.`, 'parser');
        }
      }
      return;
    }

    // T-202606-203: detección de desfase de infra_version — aviso informativo no bloqueante
    // AC-1: extraer infra_version del header del texto pegado — formato: <!-- **infra_version: N** | ... -->
    // AC-2: si el valor difiere del activo → mostrar alerta con formato exacto de BR-Core §1
    // T-202606-083: la validación aplica solo a Docs vivos (context, strategy, backlog) — no a CHECKPOINTs.
    //   Rama else-if (isCheckpoint) eliminada: los CHECKPOINTs no declaran infra_version y no deben
    //   disparar ninguna alerta por su ausencia. Sin regresión en la validación de Docs vivos.
    // AC-4: la ingesta continúa normalmente — no bloquea
    {
      const _infraMatch = text.match(/<!--\s*\*\*infra_version:\s*(\d+)\*\*/);
      if (_infraMatch) {
        const _infraDoc = parseInt(_infraMatch[1], 10);
        if (_infraDoc !== (getInfraVersionData()?.infraVersion ?? _infraDoc)) {
          const _docName = (ckpt && ckpt.titulo) ? ckpt.titulo : (ckpt && ckpt.proyecto) ? ckpt.proyecto : 'doc';
          showToast('warn', `infra_version desactualizada: ${_docName} declara infra_version:${_infraDoc}, valor activo es infra_version:${getInfraVersionData()?.infraVersion ?? '?'}. Verificar consistencia antes de continuar.`);
        }
      }
    }

    // G-04: parse exitoso → silencio. El preview renderizado es la confirmación.
    // Toast solo en error (ver bloque de validaciones previo).
  }


  // T-202606-034: aviso no bloqueante de discrepancia raw vs parseado
  // AC-1: si no hay discrepancia o rawTotal === 0, silencio — auto-trigger corre normalmente.
  // AC-2: si rawTotal !== parsedTotal y rawTotal > 0, mostrar aviso con botón "Continuar de todas formas".
  // AC-3: al hacer click en "Continuar de todas formas", marcar flag visto y re-invocar parsePaste (auto-trigger corre en esa segunda pasada).
  // AC-4: aviso usa clase CSS paste-warn — sin clase nueva.
  // AC-5: reutiliza _discrepancy ya calculado — sin duplicar lógica.
  // CAEL-26: target migrado de prev-${id} (inexistente desde CAEL-22) a #ingest-validation-warnings.
  const _discrepancyWarnKey = `_discrepancyWarnSeen_${id}`;
  if (_discrepancy && !window[_discrepancyWarnKey]) {
    _showIngestValidationWarning(
      `⚠ ${_discrepancy.raw} línea${_discrepancy.raw !== 1 ? 's' : ''} detectada${_discrepancy.raw !== 1 ? 's' : ''} en el texto — solo ${_discrepancy.parsed} parseada${_discrepancy.parsed !== 1 ? 's' : ''} correctamente. Verifica el formato de los ítems no detectados.`,
      () => { window[_discrepancyWarnKey] = true; parsePaste(id); }
    );
    return;
  }
  if (window[_discrepancyWarnKey]) delete window[_discrepancyWarnKey];

  // T-202606-210: detección de CHECKPOINT duplicado — AC-1/AC-2/AC-3
  // Hash = texto completo trimmed (coincidencia exacta según AC-1).
  // Guard usa patrón warn-key idéntico al de _discrepancyWarnKey.
  // CAEL-26: target migrado de prev-${id} (inexistente desde CAEL-22) a #ingest-validation-warnings.
  const _dupWarnKey = `_dupCheckpointWarnSeen_${id}`;
  if (isCheckpoint && title) {
    const _ckptHash = text.trim();
    if (_processedCheckpointHashes.has(_ckptHash) && !window[_dupWarnKey]) {
      _showIngestValidationWarning(
        '⚠ Este CHECKPOINT ya fue procesado. ¿Continuar de todas formas?',
        () => { window[_dupWarnKey] = true; parsePaste(id); }
      );
      return;
    }
    if (window[_dupWarnKey]) delete window[_dupWarnKey];
  }

  // T-202606-032: auto-trigger — AC-1/AC-2/AC-3/AC-6/AC-7
  // Parse completó sin avisos ni errores bloqueantes → lanzar saveSession directamente.
  // horaRaw: saveSession lee document.getElementById('hora-' + id).value internamente (AC-2).
  // Los gates de proyecto-no-seleccionado (AC-6) y mismatch de proyecto (AC-7) viven en saveSession.
  // B-202606-068 AC1+AC2: guard _saveSessionInFlight — evita doble invocación de saveSession
  // cuando handleInput y handlePaste disparan parsePaste concurrentemente en el mismo paste.
  // El flag se limpia con queueMicrotask para permitir re-saves legítimos en parsePastes
  // subsecuentes (ej: el usuario edita el textarea después del paste).
  const _saveGuardKey = `_saveSessionInFlight_${id}`;
  if (isCheckpoint && title && !window[_saveGuardKey]) {
    window[_saveGuardKey] = true;
    queueMicrotask(() => { delete window[_saveGuardKey]; });
    _processedCheckpointHashes.add(text.trim()); // T-202606-210: registrar hash al procesar
    saveSession(id);
  }

  // T-409: atenuar textarea cuando hay ítems detectados en fase CONFIRMAR
  const _ta409 = document.getElementById('ingest-ta') /* CAEL-22 */;
  if (_ta409) {
    if (tgItems.length > 0) {
      _ta409.classList.add('ta-has-items');
    } else {
      _ta409.classList.remove('ta-has-items');
    }
  }

  if (title || summary) {
    // CAEL-29 (TKT5): identidad de resultado vía _showIngestValidationResult —
    // reemplaza el bloque roto que usaba `prev`/`state.projects` (ver comentario junto
    // a esa función). Proyecto activo vía getActiveProject() — única fuente vigente desde
    // la migración a #ingest-ta global (CAEL-22); la card por-Worker con su propio selector
    // de proyecto (sess-proj-${id}) no existe más.
    const _activeProjIVR = getActiveProject();
    _showIngestValidationResult({
      ckptProyecto: ckpt ? (ckpt.proyecto || '') : '',
      activeProjectName: _activeProjIVR ? (_activeProjIVR.name || '') : '',
      title,
      summary,
      files,
      nextStep,
      blockers: bloqueantesRaw,
      items: tgItems
    });
    // CAEL-31 (TKT7): lista de ítems (tgItems) ahora se renderiza — cierra el no_incluye
    // original de CAEL-29. #ingest-validation-result queda completo: badges, título,
    // resumen, archivo, próximo paso, bloqueantes e ítems, todos vía un solo call site.
  } else {
    const _resultElReset = document.getElementById('ingest-validation-result');
    if (_resultElReset) _resultElReset.classList.add('is-hidden');
  }
}
// T-202606-032: _pasteInFlight (módulo) e isParseInFlight eliminados — AC-4/AC-5.
// El guard de saveSession se eliminó. handlePaste usa su propia variable local _pasteRetry
// para el mecanismo de retry del browser (esperar inserción del clipboard) — propósito distinto.

// T-202606-032: _pasteRetry reemplaza _pasteInFlight en handlePaste — variable local al módulo.
// Solo controla el mecanismo de retry del browser (clipboard insert delay) — no es el guard de saveSession.
const _pasteRetry = {};

// TKT2 (REQ CAEL-01) AC1/AC2: contador de bloques del modal de ingesta — derivado en vivo de
// _splitCheckpointBlocks(textarea.value), sin estado propio de acumulación (push). Función
// separada de parsePaste — parsePaste conserva su responsabilidad de parseo single-item, ya
// invocada también desde 4 callbacks de warning (rol ausente/done/discrepancia/duplicado,
// ~L1639-1743) que no deben recalcular el contador del modal en cada re-intento.
function _updateIngestBlockCount() {
  const el = document.getElementById('ingest-block-count');
  if (!el) return;
  const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
  const n = ta ? _splitCheckpointBlocks(ta.value).length : 0;
  el.textContent = n === 1 ? '1 bloque detectado' : `${n} bloques detectados`;
}

// TKT (REQ CAEL-0720-22 · ref_id CAEL-0720-23): _routeParse(id, ta) — punto único de decisión
//   single vs batch, compartido por handlePaste y handleInput. Si _splitCheckpointBlocks(ta.value)
//   detecta 2+ bloques ``` completos, delega a _processIngestBatch() — mismo camino que ya
//   disparaba el botón manual #ingest-process-batch-btn, ahora también alcanzable desde paste/input
//   sin acción adicional del founder (AC1/AC4 del TKT). Con 0 o 1 bloque, comportamiento histórico
//   exacto vía parsePaste(id) — sin cambio (AC2/AC3).
// TKT-202607-041 (DISC-202607-018): el comentario original de este bloque afirmaba que
//   _processIngestBatch ya invocaba _updateIngestBlockCount() indirectamente vía su propio flujo
//   de UI — verificado contra el cuerpo real de _processIngestBatch() y es incorrecto: la función
//   nunca la llama, ni siquiera tras `ta.value = ''` al aplicar el batch (#ingest-block-count
//   quedaba con el conteo pre-batch). Fix: _updateIngestBlockCount() se invoca aquí mismo, en la
//   rama batch, con el mismo criterio síncrono que ya usa la rama single (llamada justo después
//   de la decisión de ruteo, sin esperar la resolución async de _processIngestBatch).
function _routeParse(id, ta) {
  if (ta && _splitCheckpointBlocks(ta.value).length > 1) {
    _processIngestBatch();
    _updateIngestBlockCount(); // TKT-202607-041 AC1
    return true;
  }
  return false;
}

export function handlePaste(id) {
  // Llamado desde onpaste — diferir para que el browser inserte el texto del clipboard.
  // B-202605-NNN: 150ms en lugar de 60ms — algunos browsers (Chrome) insertan
  // el texto del clipboard después de los 60ms originales, dejando ta.value vacío
  // cuando parsePaste corre y provocando reset completo (preview en blanco).
  // Si ta.value todavía está vacío al ejecutar, se reintenta una vez a 300ms.
  _pasteRetry[id] = true;
  const _doParse = () => {
    delete _pasteRetry[id];
    const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
    if (ta && !ta.value.trim()) {
      // Texto aún no insertado — reintentar una vez más
      _pasteRetry[id] = true;
      setTimeout(() => {
        delete _pasteRetry[id];
        const _ta2 = document.getElementById('ingest-ta') /* CAEL-22 */;
        if (_routeParse(id, _ta2)) return; // TKT CAEL-0720-23: 2+ bloques → batch, corta el path single
        parsePaste(id);
        _updateIngestBlockCount(); // TKT2 (REQ CAEL-01) AC1
        const ai = getAI(id);
        if (ai && ai._parsed && ai._parsed.title) {
          const horaEl = document.getElementById('hora-' + id);
          if (horaEl) horaEl.focus();
        }
        // T-202606-155: _tryIngestSprintProposal removido del pre-DIFF — Step 0 en showMergeDiffPanel es el gate
      }, 150);
      return;
    }
    if (_routeParse(id, ta)) return; // TKT CAEL-0720-23: 2+ bloques → batch, corta el path single
    parsePaste(id);
    _updateIngestBlockCount(); // TKT2 (REQ CAEL-01) AC1
    const ai = getAI(id);
    if (ai && ai._parsed && ai._parsed.title) {
      const horaEl = document.getElementById('hora-' + id);
      if (horaEl) horaEl.focus();
    }
    // T-202606-155: _tryIngestSprintProposal removido del pre-DIFF — Step 0 en showMergeDiffPanel es el gate
  };
  setTimeout(_doParse, 150);
}

export function handleInput(id) {
  // T-202606-032: guard _pasteInFlight eliminado — AC-4/AC-9.
  // _pasteRetry no bloquea handleInput — handlePaste y handleInput son eventos distintos.
  // parsePaste corre en cada keystroke; el auto-trigger solo se lanza cuando el parse es completo y válido.
  const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
  if (_routeParse(id, ta)) return; // TKT CAEL-0720-23: 2+ bloques → batch, corta el path single
  parsePaste(id);
  _updateIngestBlockCount(); // TKT2 (REQ CAEL-01) AC2 — contador en vivo
}

// TKT3 (REQ CAEL-0716-01): unifica el flujo batch sobre el mismo panel DIFF con Aplicar que
// usa el paste único — reemplaza el resumen de chips (#diff-preview-modal/#ingest-diff-empty,
// retirados del shell en TKT1 AC5, index.html) por showMergeDiffPanel real. Reusó el patrón que
// probaba _gatedDoApplyBatch (saveStandaloneCheckpoint, ya eliminada por TKT4 — este comentario
// actualizado tras esa entrega) — _applyCheckpointBatch + applyPatchesFromTG. Guard de JSON
// malformado (AC3) conservado igual — mismo criterio que ya tenía esta función antes de este TKT.
// no_incluye (TKT3): no modifica mergeBacklogFromTG. No agrega selección item-por-item — Aplicar
// aplica el batch completo. No toca locus-session-save.js.
export async function _processIngestBatch() {
  const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
  if (!ta) return;

  const rawBlocks = _splitCheckpointBlocks(ta.value);
  if (!rawBlocks.length) {
    showToast('warning', 'Sin batch procesado — pega CHECKPOINTs y presiona Procesar batch.');
    return;
  }

  // TKT2 (REQ CAEL-0718-01): pre-chequeo JSON.parse(rawBlocks[i]) retirado — abortaba el batch
  //   completo ante cualquier bloque inválido, pese a que _resolveCheckpointBatch (vía
  //   _parseBatchBlock → parseCheckpoint) ya tolera bloques inválidos por diseño desde TKT3/TKT4
  //   del REQ CAEL-0716-01: un bloque con JSON malformado se marca en `skipped` con su `reason`
  //   (mismo _blogLog de siempre) y el resto del batch se resuelve igual. El pre-chequeo era
  //   redundante y más estricto que el motor real — bloqueaba casos que _resolveCheckpointBatch
  //   sabe resolver.

  const syntheticSessId = 'ingest-batch-' + Date.now();
  const { tgItems, patchItems, skipped, metas } = _resolveCheckpointBatch(rawBlocks, syntheticSessId);

  // TKT4 (REQ CAEL-0718-01 · AC1): aviso distinto de error — no bloquea el resto del batch,
  // solo informa que ese bloque puntual se ignoró aquí porque su único destino es Tab Sprint.
  const _sprintProposalSkips = skipped.filter(s => s.type === 'sprint_proposal');
  if (_sprintProposalSkips.length) {
    showToast('warning', _sprintProposalSkips.length === 1
      ? 'Esta propuesta se procesa en Tab Sprint — usa el panel "+ Sprint nuevo".'
      : `${_sprintProposalSkips.length} sprint_proposal detectados — se procesan en Tab Sprint, no en este modal.`);
    // AC1: batch compuesto solo por sprint_proposal → aviso ya mostrado, no hay nada más que
    // procesar. Salir aquí evita el segundo toast genérico "Sin ítems para procesar" (abajo),
    // que sería redundante y menos claro que el aviso específico ya mostrado.
    if (!tgItems.length && !(patchItems && patchItems.length)) return;
  }

  const _rejectedEntry = skipped.find(s => s.type === 'rejected');
  if (_rejectedEntry) {
    showToast('warning', `⚠ ${_rejectedEntry.reason}`);
    return;
  }
  if (!tgItems.length && !(patchItems && patchItems.length)) {
    showToast('warning', 'Sin ítems para procesar en este batch.');
    return;
  }

  const activeProj = getActiveProject();
  if (!activeProj) {
    showToast('warning', '⚠ Selecciona un proyecto antes de procesar el batch.');
    return;
  }

  // TKT2 (REQ CAEL-0716-01) — extendido aquí: dockear #merge-diff-overlay contra
  // #ingest-modal-overlay antes de abrir. Mismo mecanismo que _doSaveSession
  // (locus-session-save.js) — TKT2 dejó el flujo batch fuera de su scope (no_incluye) porque
  // no tocaba este archivo; TKT3 aplica el mismo patrón aquí para que ambos flujos converjan
  // en el mismo panel docked.
  const _ingestOverlayForDock = document.getElementById('ingest-modal-overlay');
  const _mdiffOverlayForDock = document.getElementById('merge-diff-overlay');
  if (_ingestOverlayForDock && _ingestOverlayForDock.classList.contains('open') && _mdiffOverlayForDock) {
    _mdiffOverlayForDock.classList.add('mdiff-overlay--docked');
  }

  // AC2 — Aplicar del batch: mismo patrón que probaba _gatedDoApplyBatch (saveStandaloneCheckpoint,
  // eliminada por TKT4) — _applyCheckpointBatch persiste vía mergeBacklogFromTG(dryRun:false)
  // internamente; los patches del batch se encadenan después usando slugMap/refIdTitleMap del
  // mergeResult, mismo criterio que el flujo single.
  const _onApplyBatch = async () => {
    let _batchMergeResult;
    try {
      _batchMergeResult = await _applyCheckpointBatch(tgItems);
    } catch (err) {
      showToast('error', '✗ No se pudo aplicar el batch');
      return;
    }
    if (patchItems && patchItems.length && _batchMergeResult) {
      applyPatchesFromTG(patchItems, syntheticSessId, { slugMap: _batchMergeResult.slugMap, refIdTitleMap: _batchMergeResult.refIdTitleMap, ckptHeaderRole: '' });
    }
    renderBacklogList();
    renderStats();
    window.dispatchEvent(new CustomEvent('shell:render-tracker'));
    const _totalApplied = tgItems.length + (patchItems ? patchItems.length : 0);
    showToast('success', `✓ ${_totalApplied} ítem${_totalApplied !== 1 ? 's' : ''} aplicado${_totalApplied !== 1 ? 's' : ''} al backlog`);
    ta.value = ''; // batch consumido — mismo criterio que closeStandaloneCheckpoint() limpiaba su propio textarea
  };

  // AC1 — DIFF real (no resumen de chips) para el batch.
  // Gap descubierto durante TKT4 (REQ CAEL-0718-01) — no declarado por ningún no_incluye de
  // TKT1/TKT2/TKT3: metas (agregado por TKT1, consumido por TKT3) nunca llegaba a este call
  // site — seguía hardcodeado a {}. Sin este wire-up, la paridad batch/single (AC1 del REQ) no
  // se cumplía pese a que TKT1 y TKT3 estaban individualmente done. Mismo archivo que TKT4, sin
  // scope nuevo (es la conexión ya prevista por el contrato de ambos TKTs) — cerrado aquí en
  // vez de abrir un TKT6 separado para una línea. Señalado explícitamente en el CHECKPOINT de
  // entrega para que Cael y Finn lo tengan en el radar en la sesión de cierre del REQ.
  showMergeDiffPanel(tgItems, syntheticSessId, activeProj.id, _onApplyBatch, { metas });
}


// B-202606-019: variante de _tryIngestSprintProposal que acepta el objeto proposal ya parseado.
// Necesaria para CHECKPOINTs en formato JSON puro — en ese path, raw no contiene
// '---SPRINT-PROPOSAL---' y _tryIngestSprintProposal(raw) retorna false silenciosamente.
// El objeto proposal viene de _rawSprintProposal (parseCheckpoint) via ai._parsed.sprintProposal.
// La validación de rol emisor se omite aquí porque ya se verificó al construir _validSpProposal
// en locus-session-save.js y saveStandaloneCheckpoint (solo pasan propuestas válidas).
// Retorna el id del sprint creado (string) o false — mismo contrato que _tryIngestSprintProposal.
export function _tryIngestSprintProposalFromParsed(proposalObj) {
  if (!proposalObj || typeof proposalObj !== 'object' || Array.isArray(proposalObj)) return false;

  // B-202606-021 AC-1: el schema canónico de sprint_proposal usa el campo "id" — "sprint"
  // se conserva como fallback para CHECKPOINTs legacy que aún lo emitan.
  const sprint = proposalObj.id || proposalObj.sprint;

  // Validar campos obligatorios — mismo criterio que parseSprintProposal
  const { version_target, release_type, scope, goal } = proposalObj;
  const missing = [];
  if (!sprint) missing.push('id');
  for (const k of ['version_target', 'release_type', 'scope', 'goal']) {
    if (!proposalObj[k]) missing.push(k);
  }
  if (missing.length) {
    showToast('error', `Campos obligatorios faltantes: ${missing.join(', ')}`);
    return false;
  }

  const proj = getActiveProject();
  if (!proj) return false;

  // T-202606-006 AC-1/AC-5: tracker_sprints (via cache _sprintsCache) es la fuente de verdad —
  // ya no proj.sprints/blob de tracker_state. getActiveSprints() expone el cache poblado por
  // _loadSprintsFromSupabase() (T-202606-005).
  const _existingSprints = getActiveSprints();

  // Guard de duplicado — mismo criterio que _tryIngestSprintProposal, verificado contra el cache
  const _dupIdShort = sprint.split(/\s*·\s*/)[0].trim();
  const exists = _existingSprints.some(sp =>
    sp.id === _dupIdShort || sp.id === sprint ||
    sp.name === sprint || sp.label === sprint
  );
  if (exists) {
    showToast('error', 'Ya existe un sprint con este ID');
    return false;
  }

  // TKT-PARSER-sprints: !sp.isHotfix eliminado — S-HOTFIX deprecado Gen2.
  const _hasActiveSprint = _existingSprints.some(sp => sp.status === 'active');
  const _newSprintStatus = _hasActiveSprint ? 'scheduled' : 'active';

  const _sprintIdFull  = sprint;
  const _sprintIdShort = _sprintIdFull.split(/\s*·\s*/)[0].trim();
  // B-202606-XXX: construir label canónico desde proposalObj.label (campo separado del schema JSON).
  // El schema BR-Ecosystem §13 separa id y label — el label descriptivo llega en proposalObj.label,
  // no concatenado en proposalObj.id. Sin esta construcción, label queda igual al id ("PP-S-02")
  // y el sprint header muestra solo el ID sin nombre descriptivo.
  // Entrada: id="PP-S-02", label="Parser — JSON único + alineación BR"
  // Salida:  label="PP-S-02 · Parser — JSON único + alineación BR"
  const _labelDescriptive = (proposalObj.label && proposalObj.label !== _sprintIdShort)
    ? proposalObj.label.replace(new RegExp('^' + _sprintIdShort.replace(/[-]/g, '\\-') + '\\s*·?\\s*'), '').trim()
    : '';
  // INC-[pendiente-ID]: label guardaba _canonicalLabel (id+label concatenado) — duplicaba el ID
  // cuando _sprintDisplay()/spLabel() lo recomponían como `${sp.id} · ${sp.label}`.
  // label ahora guarda solo la parte descriptiva — mismo criterio que confirmEditSprint()
  // (línea ~672: "label NO concatena el ID — id y label son campos separados", BR-Ecosystem §5).
  const _canonicalLabel = _labelDescriptive ? `${_sprintIdShort} · ${_labelDescriptive}` : _sprintIdShort;
  const newSprint = {
    id:             _sprintIdShort,
    label:          _labelDescriptive || _sprintIdShort,
    name:           _canonicalLabel,
    version_target: version_target,
    release_type:   release_type,
    scope:          scope,
    goal:           goal,
    out_of_scope:   Array.isArray(proposalObj.out_of_scope) ? proposalObj.out_of_scope : [],
    status:         _newSprintStatus,
    current:        _newSprintStatus === 'active',
    formallyOpened: true,
    startedAt:      _newSprintStatus === 'active' ? Date.now() : null,
  };

  // T-202606-006 AC-1/AC-2: upsert directo a tracker_sprints vía _upsertSprint() (T-202606-005).
  // _upsertSprint() actualiza _sprintsCache de forma síncrona (antes de su primer await) y luego
  // hace el upsert real a Supabase de forma asíncrona — o, sin auth, escribe a localStorage
  // (mismo fallback ya establecido en T-202606-005, sin pasar por _offlineQueue: no existe rama
  // 'sprint' en _offlineQueueFlush() y agregarla está fuera de scope de este T).
  // No se espera (await) la promesa — el retorno de esta función es síncrono, igual que antes,
  // para no romper el contrato que usan los callers existentes (T-202606-020, T-202606-206).
  _upsertSprint(newSprint, proj.id);

  const _toastMsg = _newSprintStatus === 'scheduled'
    ? `✓ Sprint "${sprint}" creado como programado — se activará al cerrar el sprint activo`
    : `✓ Sprint "${sprint}" creado — pendiente de aprobación`;
  showToast('success', _toastMsg);
  return _sprintIdShort;
}

// [PP] TKT3 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs con resolución de [tmp:slug]
//   cross-CHECKPOINT): extraída de parsePasteStandalone sin cambio de comportamiento —
//   procesa ckpt._rawItems de UN bloque CHECKPOINT ya parseado en tgItems/patchItems.
//   Reutilizada por el flujo single (batch de tamaño 1, AC3 — sin regresión) y por el
//   flujo batch (2+ bloques, AC1/AC2/AC4) para construir el preview de cada bloque con
//   buildTGPreview. Sin efectos laterales propios más allá de _blogLog/showToast — mismos
//   que ya existían inline. No persiste, no wiring a _applyCheckpointBatch (eso es TKT4).
function _buildTgItemsFromParsed(ckpt, parsedJSON) {
  const _validTypes    = _GEN2_TYPES;
  const _validStatuses = _VALID_STATUSES_GATE;
  const tgItems = [];
  const patchItems = [];
  let itemError = null;

  for (let i = 0; i < parsedJSON.length; i++) {
    const it = parsedJSON[i];
    if (it.type === 'patch') {
      if (!it.code || _isPlaceholderCode(it.code)) {
        _blogLog('patch-ignorado', it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (it.code || '(vacío)'), 'backlog');
        showToast('warn', `Patch descartado: código placeholder no patcheable — ${it.code || '(vacío)'}. Usa el código real asignado por Locus.`);
      } else {
        patchItems.push(it);
      }
      continue;
    }
    if (!it.type || !it.code) {
      itemError = `Ítem [${i}]: faltan campos obligatorios (type, code).`;
      break;
    }
    if (!_validTypes.includes(it.type)) {
      itemError = `Ítem [${i}]: type inválido "${it.type}". Válidos: REQ · TKT · DISC · INC · PRB · CHG`;
      break;
    }
    if (_ITIL_TYPES.has(it.type)) {
      const _itilResult3 = _buildItilItem(it, ckpt.rol || '', (ckpt.proyecto || '').trim(), ckpt.titulo);
      if (_itilResult3.error) {
        itemError = _itilResult3.error;
        break;
      }
      tgItems.push(_itilResult3.item);
      continue;
    }
    if (!it.status) {
      itemError = `Ítem [${i}]: faltan campos obligatorios (type, code, status).`;
      break;
    }
    if (it.status && (it.status.trim().toLowerCase() === 'historico' || it.status.trim().toLowerCase() === 'histórico')) {
      _blogLog(
        'status-historico-emitido',
        it.code || '[pendiente-ID]',
        `Status "historico" no es emitible — asignado exclusivamente por Locus al cerrar sprint`,
        'backlog'
      );
      continue;
    }
    const _normSt3 = _canonicalStatus(it.status, it.type);
    if (!_normSt3 || (!_validStatuses.includes(_normSt3) && _normSt3 !== 'promoted' && _normSt3 !== 'bloqueado' && _normSt3 !== 'discovery')) {
      itemError = `Ítem [${i}]: status inválido "${it.status}". Válidos: done · pendiente · descartado · en-revision${itemKind(it) === 'DISC' ? ' · discovery · promoted' : ''}`;
      break;
    }
    const _sprintRaw3 = it.sprint ? it.sprint.trim().toLowerCase() : '';
    const _sinSprint3 = _sprintRaw3 === '' || _sprintRaw3.endsWith('-q-backlog');
    if (_normSt3 === 'en-revision' && _sinSprint3) {
      itemError = `CHECKPOINT bloqueado: ${it.code || '[pendiente-ID]'} tiene status en-revision sin sprint asignado. Asignar sprint antes de continuar.`;
      break;
    }
    if (itemKind(it) === 'REQ' && _normSt3 === 'bloqueado') {
      const _resolvedRole = (it.role && it.role.trim()) ? it.role.trim() : (ckpt.rol || '');
      const _authorizedRole = 'QA · Finn';
      if (_resolvedRole !== _authorizedRole) {
        _blogLog(
          'rol-no-autorizado-bloqueado',
          it.code || '[pendiente-ID]',
          `Transición bloqueado en R ${it.code || '[pendiente-ID]'} rechazada: solo Finn puede mover un R a bloqueado. Rol resuelto: "${_resolvedRole}". Origen: ${ckpt.titulo || ''}`,
          'backlog'
        );
        // TKT2 (REQ-202607-025): resolver sprint_id/sprint_name — mismo patrón que L942/953-955.
        const _sprintF3a = _resolveSprintFields(it);
        tgItems.push({
          type:          it.type,
          code:          it.code,
          // TKT (REQ-[pendiente-ID] · ref_id+title en 2 archivos): propagar ref_id crudo del
          // schema del ítem — sin este campo, mergeBacklogFromTG no puede construir el mapa
          // ref_id→title declarante para normalizar referencias cruzadas en objeto {ref_id,title}.
          // Opcional — ausente en la mayoría de los ítems, solo presente cuando el rol emisor
          // anticipó que otro ítem lo referenciaría (ver __BR-Ecosystem §4).
          refId:         it.ref_id || null,
          title:         it.title  || it.desc   || '',
          desc:          it.title  || it.desc   || '',
          status:        'pendiente',
          _noStatus:     false,
          effort:        it.effort != null ? (parseInt(it.effort) || null) : null,
          area:          it.area   || '',
          sprint:        _sprintF3a.sprintAlias,
          sprint_id:     _sprintF3a.sprint_id,
          sprint_name:   _sprintF3a.sprint_name,
          ac:            Array.isArray(it.ac) ? it.ac : [],
          role:          _resolvedRole,
          // INC-[pendiente-ID]: discard_reason no se propagaba en flujo standalone —
          // solo leía it.reason (legado). Alineado a _parseSingleItem.
          discardReason: it.discard_reason || it.reason || '',
          discardRef:    it.ref    || '',
          blockedBy:     Array.isArray(it.blockedBy) ? it.blockedBy : [],
          promovida_a:   it.promovida_a || null,
          parentId:      it.parent      || null,
          dependsOn:     Array.isArray(it.depends_on) ? it.depends_on : [],
          triggeredBy:   it.triggered_by  || null,
          origenDisc:    it.origen_disc   || null,
          intencion:     it.intencion     || null,
          no_incluye:    Array.isArray(it.no_incluye) ? it.no_incluye : [],
          // T-[pendiente-ID] (REQ-contract-rename, TKT4): contract_detail no se propagaba a
          // tgItems — se perdía entre el parseo y mergeBacklogFromTG. Alineado a BR-Execution §2.
          contract_detail: it.contract_detail || null,
          // TKT3 (REQ CAEL-0721-01): archivos ausente en este sitio (sí presente en el sitio 1,
          // ~L1483) — inconsistencia entre los 3 puntos de construcción. kill_criteria/next_role/
          // design_intent/blocked_at/contract_update ausentes en los 3 sitios — mismo patrón de
          // pérdida ya corregido para draft/contract_detail. Ver comentario extendido en sitio 1.
          archivos:      Array.isArray(it.archivos) ? it.archivos : [],
          kill_criteria: it.kill_criteria || null,
          nextRole:      it.next_role     || null,
          designIntent:  it.design_intent || null,
          blockedAt:     it.blocked_at    || null,
          contract_update: it.contract_update || null,
          // TKT1 (REQ-202607-026 · AC1): draft es campo de nivel CHECKPOINT (ckpt.draft), no
          // del ítem individual — se propaga aquí para que mergeBacklogFromTG lo persista en
          // el ítem nuevo. Mismo patrón de pérdida ya corregido para contract_detail en TKT4.
          draft:         ckpt.draft === true,
          schema_version: it.schema_version != null ? Number(it.schema_version) : 0
        });
        _normalizeSprint(tgItems[tgItems.length - 1], tgItems);
        continue;
      }
    }
    // TKT2 (REQ-202607-025): resolver sprint_id/sprint_name — mismo patrón que L942/953-955.
    const _sprintF3b = _resolveSprintFields(it);
    tgItems.push({
      type:          it.type,
      code:          it.code,
      // TKT (REQ-[pendiente-ID] · ref_id+title en 2 archivos): mismo campo que la rama
      // rol-no-autorizado-bloqueado arriba — ver ese comentario.
      refId:         it.ref_id || null,
      title:         it.title  || it.desc   || '',
      desc:          it.title  || it.desc   || '',
      priority:      it.priority || 'medium',
      status:        _normSt3,
      _noStatus:     false,
      effort:        it.effort != null ? (parseInt(it.effort) || null) : null,
      area:          it.area   || '',
      sprint:        _sprintF3b.sprintAlias,
      sprint_id:     _sprintF3b.sprint_id,
      sprint_name:   _sprintF3b.sprint_name,
      ac:            Array.isArray(it.ac) ? it.ac : [],
      role:          it.role   || (ckpt.rol || ''),
      // INC-[pendiente-ID]: discard_reason no se propagaba en flujo standalone —
      // solo leía it.reason (legado). Alineado a _parseSingleItem.
      discardReason: it.discard_reason || it.reason || '',
      discardRef:    it.ref    || '',
      blockedBy:     Array.isArray(it.blockedBy) ? it.blockedBy : [],
      promovida_a:   it.promovida_a || null,
      parentId:      it.parent      || null,
      dependsOn:     Array.isArray(it.depends_on) ? it.depends_on : [],
      triggeredBy:   it.triggered_by  || null,
      origenDisc:    it.origen_disc   || null,
      intencion:     it.intencion     || null,
      no_incluye:    Array.isArray(it.no_incluye) ? it.no_incluye : [],
      // T-[pendiente-ID] (REQ-contract-rename, TKT4): contract_detail no se propagaba a
      // tgItems — se perdía entre el parseo y mergeBacklogFromTG. Alineado a BR-Execution §2.
      contract_detail: it.contract_detail || null,
      // TKT3 (REQ CAEL-0721-01): archivos ausente en este sitio (sí presente en el sitio 1,
      // ~L1483) — misma inconsistencia que el sitio 2. kill_criteria/next_role/design_intent/
      // blocked_at/contract_update ausentes en los 3 sitios. Ver comentario extendido en sitio 1.
      archivos:      Array.isArray(it.archivos) ? it.archivos : [],
      kill_criteria: it.kill_criteria || null,
      nextRole:      it.next_role     || null,
      designIntent:  it.design_intent || null,
      blockedAt:     it.blocked_at    || null,
      contract_update: it.contract_update || null,
      // TKT1 (REQ-202607-026 · AC1): draft es campo de nivel CHECKPOINT (ckpt.draft), no del
      // ítem individual — se propaga a cada tgItem para que mergeBacklogFromTG lo persista en
      // el ítem nuevo. Mismo patrón de pérdida ya corregido para contract_detail en TKT4.
      draft:         ckpt.draft === true,
      schema_version: it.schema_version != null ? Number(it.schema_version) : 0
    });
    if (itemKind(it) === 'DISC' && _normSt3 === 'promoted' && !it.promovida_a) {
      _blogLog('promoted-sin-ref', it.code || '[pendiente-ID]', 'DISC ' + (it.code || '[pendiente-ID]') + ' con status promoted sin campo promovida_a — trazabilidad incompleta', 'backlog');
    }
    _normalizeSprint(tgItems[tgItems.length - 1], tgItems);
  }

  return { tgItems, patchItems, itemError };
}

// [PP] TKT3: valida y construye preview de UN bloque del batch — usado solo cuando
//   _splitCheckpointBlocks detecta 2+ bloques. AC2: bloque inválido no aborta el resto.
function _parseBatchBlock(blockText) {
  const ckpt = parseCheckpoint(blockText);
  if (!ckpt || !ckpt.isCheckpoint || !ckpt.titulo) {
    return { ok: false, error: 'Formato inválido — se esperaba bloque JSON sin especificador de lenguaje.' };
  }
  if (ckpt._jsonParseError) {
    return { ok: false, error: ckpt._jsonParseError };
  }
  // TKT1 (REQ-202607-026 · AC1): guard de bloqueo total sobre draft:true eliminado — mismo
  // criterio aplicado al path single (más abajo en este archivo) y a parsePaste
  // (TKT-202606-011). Un bloque del batch con draft:true se resuelve igual que draft:false;
  // ckpt.draftRaw sigue disponible para quien consuma el resultado del batch si necesita
  // distinguir el estado por bloque.
  const parsedJSON = Array.isArray(ckpt._rawItems) ? ckpt._rawItems : [];

  // TKT4 (REQ CAEL-0718-01 · AC1): bloque con sprint_proposal y sin ítems — caso válido y
  // esperado (§12 exige sprint_proposal en CHECKPOINT independiente, sin items). Antes de este
  // TKT, este bloque se resolvía en silencio: 0 tgItems, sprintProposal descartado por
  // _extractCkptMeta (TKT1 AC3), sin ninguna señal al founder de que su propuesta fue ignorada
  // por este modal. La única ruta real de sprint_proposal es Tab Sprint (panel "+ Sprint nuevo",
  // locus-sprint.js) — este bloque se marca aquí, no como error de parseo, para que el caller
  // (_resolveCheckpointBatch → _processIngestBatch) muestre un aviso de redirección explícito.
  if (ckpt._rawSprintProposal && !parsedJSON.length) {
    return {
      ok: false,
      isSprintProposalOnly: true,
      error: 'sprint_proposal detectado — se procesa desde Tab Sprint (panel "+ Sprint nuevo"), no desde este modal.'
    };
  }
  // TKT-202607-011 (BR-Ecosystem §8 regla dura): gate de draft obligatorio — mismo criterio
  // que parsePaste (~L1098-1120). Sin draft declarado explícitamente (true o false) en un
  // bloque con al menos un ítem REQ/TKT nuevo o con cambio de status, el bloque se trata como
  // inválido — mismo tratamiento que JSON malformado o título ausente.
  const _draftGateTypes = ['REQ', 'TKT'];
  const _hasDraftGatedItem = parsedJSON.some(_di => _di && _di.type !== 'patch' && _draftGateTypes.includes(_di.type));
  if (_hasDraftGatedItem && ckpt.draftRaw === undefined) {
    return { ok: false, error: 'Campo "draft" ausente — CHECKPOINT no aplicado. Declarar draft: true o false.' };
  }
  const { tgItems, patchItems, itemError } = _buildTgItemsFromParsed(ckpt, parsedJSON);
  if (itemError) {
    return { ok: false, error: itemError };
  }
  return { ok: true, ckpt, tgItems, patchItems };
}

// [PP] TKT4: resuelve un batch de bloques de texto ya separados por _splitCheckpointBlocks
//   (TKT1) en un único array de tgItems combinado — sin persistir. Reutiliza _parseBatchBlock
//   (TKT3) por bloque, mismo criterio de bloque inválido que el preview ya usa (AC2 heredado).
// Invariants:
//   - Nunca llama a saveBacklog() ni a ninguna función de persistencia — función pura de
//     resolución sobre datos ya en memoria.
//   - Bloque con JSON malformado o sin "title" → excluido de tgItems, entrada en skipped con
//     { idx, type: 'invalid', reason }. No aborta la resolución de los demás bloques (AC2).
//   - [tmp:slug-x] declarado como code de 2+ ítems nuevos en el batch completo (evaluado sobre
//     todos los bloques válidos antes de combinar cualquiera) → tgItems retorna vacío ([]),
//     skipped incluye { type: 'rejected', reason: '[tmp:slug-x] declarado como código de más
//     de un ítem nuevo en el mismo batch — batch rechazado.' } — rechazo atómico, ningún
//     bloque se combina, ni siquiera los que no participan del duplicado.
//   - Batch de tamaño 1 con bloque válido → tgItems idéntico al que produciría _parseBatchBlock
//     directo sobre ese único bloque, skipped vacío — sin diferencia observable (AC nuevo de
//     Cael tras gap de especificación señalado por Rune, Fase 5 v2).
// sideEffects:
//   - Bloques inválidos y el rechazo por duplicado generan entrada en DocLog vía _blogLog —
//     mismo comportamiento que TKT2 tenía, ahora emitido desde la resolución en vez de la
//     persistencia.
export function _resolveCheckpointBatch(blocks, sessionId) {
  // TKT1 (REQ CAEL-0718-01 · AC1, parte 2/2 — propagación): campo `metas` agregado — un
  //   _extractCkptMeta por bloque válido, ver Paso 3 abajo. Antes de este TKT no existía en el
  //   shape de retorno — el flujo batch (_processIngestBatch) no tenía forma de mostrar narrativa
  //   por bloque, deuda declarada en mod:126/mod:127 (ckptMeta:{} hardcodeado).
  const _result = { tgItems: [], patchItems: [], skipped: [], metas: [] }; // TKT2 (REQ-[pendiente-ID] · CAEL-05): patchItems agregado — antes se descartaba por completo, ningún patch se aplicaba jamás en el flujo batch
  if (!blocks || !blocks.length) return _result;

  // Paso 1 (AC2 heredado de TKT3): parsear cada bloque — inválido se marca, no aborta el resto.
  const _parsedBlocks = blocks.map((blockText, idx) => {
    const r = _parseBatchBlock(blockText);
    if (!r.ok) {
      // TKT4 (REQ CAEL-0718-01 · AC1): bloque de solo sprint_proposal — type distinto de
      // 'invalid' para que el caller lo distinga de un error real de parseo (AC1: "sin error de
      // parseo"). No genera entrada de DocLog como 'checkpoint-batch-invalido' — no es deuda ni
      // bloque roto, es uso correcto de sprint_proposal en el modal equivocado.
      if (r.isSprintProposalOnly) {
        _result.skipped.push({ idx, type: 'sprint_proposal', reason: r.error });
        return { idx, valid: false };
      }
      _blogLog('checkpoint-batch-invalido', '', `CHECKPOINT ${idx + 1} del batch inválido — ${r.error}. Omitido, resto del batch resuelto.`, 'backlog');
      _result.skipped.push({ idx, type: 'invalid', reason: r.error });
      return { idx, valid: false };
    }
    // TKT1: r.ckpt capturado — fuente de _extractCkptMeta en Paso 3. _parseBatchBlock ya lo
    //   retornaba (línea del `return { ok: true, ckpt, ... }`), solo no se propagaba hasta aquí.
    return { idx, valid: true, tgItems: r.tgItems, patchItems: r.patchItems || [], ckpt: r.ckpt }; // TKT2: patchItems capturado de _parseBatchBlock — ya lo retornaba (línea 1946), solo se descartaba aquí
  });

  // Paso 2: gate de duplicados — [tmp:slug] como code de más de un ítem nuevo en el batch
  // completo, evaluado sobre todos los bloques válidos antes de combinar cualquiera.
  // TKT2: el gate sigue evaluando solo tgItems — un patch nunca declara un [tmp:slug] como su
  // propio code de creación (su code referencia un ítem existente o en creación, no se declara
  // a sí mismo), por lo que no puede colisionar con este gate. Sin cambio de criterio aquí.
  const _slugOwners = new Map(); // slug → idx del primer bloque que lo declaró
  let _dupSlug = null;
  _parsedBlocks.forEach(b => {
    if (!b.valid || _dupSlug) return;
    b.tgItems.forEach(it => {
      if (!it.code || !/^\[tmp:[a-z0-9_-]+\]$/i.test(it.code)) return;
      if (_slugOwners.has(it.code) && _slugOwners.get(it.code) !== b.idx) {
        _dupSlug = it.code;
      } else {
        _slugOwners.set(it.code, b.idx);
      }
    });
  });
  if (_dupSlug) {
    const _reason = `${_dupSlug} declarado como código de más de un ítem nuevo en el mismo batch — batch rechazado.`;
    _result.tgItems = [];
    _result.patchItems = []; // TKT2: rechazo atómico — ningún patch del batch se aplica cuando el batch completo se rechaza (AC del REQ)
    _result.skipped.push({ type: 'rejected', reason: _reason });
    _blogLog('checkpoint-batch-rechazado', '', _reason, 'backlog');
    return _result;
  }

  // Paso 3 (AC1/AC4): combinar — orden de bloques preserva orden de emisión.
  // TKT1 (REQ CAEL-0724-02 · ref_id CAEL-0724-03): cada ítem combinado en tgItems/patchItems
  //   ahora lleva idx: b.idx — antes se perdía en el spread, quedando solo a nivel de b (variable
  //   local de este forEach, nunca expuesta). Sin este campo, mergeBacklogFromTG no tiene forma
  //   de saber a qué bloque pertenece cada ítem ya combinado — gap que bloqueaba TKT2 (agrupar
  //   por bloque en el panel DIFF). Mismo criterio que skipped ya usa desde TKT4 ({idx, type,
  //   reason}) — se generaliza a los ítems que sí se combinan. No pisa un idx propio del ítem si
  //   ya existiera uno (no hay caso real hoy, pero {...it, idx: b.idx} es explícito y no depende
  //   de orden de propiedades).
  _parsedBlocks.forEach(b => {
    if (b.valid) {
      _result.tgItems.push(...b.tgItems.map(it => ({ ...it, idx: b.idx })));
      _result.patchItems.push(...b.patchItems.map(it => ({ ...it, idx: b.idx }))); // TKT2: mismo criterio de orden que tgItems
      // TKT1 (REQ CAEL-0718-01 · AC1): un _extractCkptMeta por bloque válido — b.ckpt es el
      //   CHECKPOINT completo de ese bloque, no el tgItems combinado.
      // TKT-078 (REQ-202607-022, ref_id CAEL-0724-05): idx: b.idx agregado explícitamente.
      //   El comentario anterior asumía "metas[i] siempre corresponde 1:1 al bloque i-ésimo
      //   válido" — cierto solo si no hay bloques inválidos intercalados entre bloques válidos:
      //   la posición secuencial en metas (i = conteo de bloques válidos vistos hasta ahora) puede
      //   divergir de b.idx (posición real del bloque dentro de _parsedBlocks/blocks) en cuanto
      //   un batch mezcla bloques válidos e inválidos. tgItems/patchItems ya llevan idx: b.idx
      //   desde TKT1 de este mismo REQ — metas quedaba como la única pieza del resultado de
      //   _resolveCheckpointBatch sin idx propio, forzando al consumidor (TKT2/TKT3, panel de
      //   detalle por bloque) a asumir el índice de array en vez de leerlo del objeto. Mismo
      //   criterio ya usado en skipped desde TKT4 ({idx, type, reason}) — se generaliza a metas.
      //   No pisa un campo propio de _extractCkptMeta (sin colisión — verificado, ver función).
      _result.metas.push({ ...(_extractCkptMeta(b.ckpt)), idx: b.idx });
    }
  });

  return _result;
}


// T-202606-021: Trigger 3 — sugerencia 1-tap de sprint para B nuevo con triggered_by
// apuntando a un ítem en sprint activo. No es automático (a diferencia de Trigger 1/2):
// retorna { b, suggestedSprint } para que el DIFF muestre la sugerencia, o null si no aplica.
// Reglas (AC T-202606-021):
//  - Solo Bs nuevos ([pendiente-ID] o [tmp:slug]) sin sprint explícito asignado.
//  - triggered_by debe apuntar a un ítem cuyo sprint esté en estado 'active'.
//  - Si triggered_by apunta a ítem sin sprint o sprint cerrado/programado → no se sugiere.
//  - Si el B ya declara sprint explícito → no se sugiere (respetar lo declarado).
export function _buildTriggeredBySuggestion(tgItems) {
  if (!Array.isArray(tgItems) || !tgItems.length) return null;

  const activeSprints = getActiveSprints().filter(sp => sp.status === 'active');
  if (!activeSprints.length) return null;
  const activeSprintIds = new Set(activeSprints.map(sp => sp.id));

  // Mapa code -> sprint, para resolver triggered_by tanto contra ítems existentes
  // como contra otros ítems nuevos del mismo CHECKPOINT (referencias [tmp:slug]).
  const codeToSprint = new Map();
  (getActiveTracker().items || []).forEach(it => {
    if (it.code) codeToSprint.set(it.code, it.sprint);
  });
  tgItems.forEach(it => {
    if (it.code) codeToSprint.set(it.code, it.sprint || '');
  });

  for (const item of tgItems) {
    if (itemKind(item) !== 'INC') continue;
    if (!_isPlaceholderCode(item.code)) continue; // solo B nuevo
    if (!item.triggeredBy && !item.triggered_by) continue;

    const sprintDeclared = item.sprint || '';
    if (sprintDeclared !== '') continue; // B ya declara sprint explícito — respetar

    const tgCode = item.triggeredBy || item.triggered_by;
    const targetSprint = codeToSprint.get(tgCode);
    if (!targetSprint || !activeSprintIds.has(targetSprint)) continue; // sin sprint / cerrado / no resuelto

    return { b: item, suggestedSprint: targetSprint };
  }

  return null;
}

// T-202606-128: parser de bloque ---SPRINT-PROPOSAL--- / ---SPRINT-PROPOSAL-END---
// Solo extrae y retorna el objeto — no modifica storage ni UI.
// Retorna { sprint, version_target, release_type, scope, goal, out_of_scope }
// o       { error: true, missing: [...campos] } si falta algún campo obligatorio.
// Retorna null si el bloque está ausente o malformado (sin terminador).
export function parseSprintProposal(text) {
  // AC-4: bloque ausente o sin terminador → null
  const match = text.match(/---SPRINT-PROPOSAL---\s*([\s\S]*?)\s*---SPRINT-PROPOSAL-END---/);
  if (!match) return null;

  const body  = match[1];
  const lines = body.split('\n');

  let sprint         = '';
  let version_target = '';
  let release_type   = '';
  let scope          = '';
  let goal           = '';
  const out_of_scope = [];

  let inOutOfScope = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // out_of_scope: bloque multi-línea (ítems con guión)
    if (/^out_of_scope\s*:/i.test(trimmed)) {
      inOutOfScope = true;
      // inline value after colon — ignorar, los ítems van en líneas con guión
      continue;
    }
    if (inOutOfScope) {
      // AC-3: cada ítem es "  - código: justificación"
      const itemM = trimmed.match(/^-\s+(.+)$/);
      if (itemM) { out_of_scope.push(itemM[1].trim()); continue; }
      // Línea sin guión dentro de out_of_scope → fin del bloque
      inOutOfScope = false;
    }

    const sprintM         = trimmed.match(/^sprint\s*:\s*(.+)$/i);
    const versionM        = trimmed.match(/^version_target\s*:\s*(.+)$/i);
    const releaseM        = trimmed.match(/^release_type\s*:\s*(.+)$/i);
    const scopeM          = trimmed.match(/^scope\s*:\s*(.+)$/i);
    const goalM           = trimmed.match(/^goal\s*:\s*(.+)$/i);

    if (sprintM)  { sprint         = sprintM[1].trim();  continue; }
    if (versionM) { version_target = versionM[1].trim(); continue; }
    if (releaseM) { release_type   = releaseM[1].trim(); continue; }
    if (scopeM)   { scope          = scopeM[1].trim();   continue; }
    if (goalM)    { goal           = goalM[1].trim();     continue; }
  }

  // AC-3: campos obligatorios — retornar error con lista de faltantes
  const REQUIRED = { sprint, version_target, release_type, scope, goal };
  const missing  = Object.entries(REQUIRED).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return { error: true, missing };

  // AC-1 + AC-2: objeto completo
  return { sprint, version_target, release_type, scope, goal, out_of_scope };
}

// T-202605-430: componente reutilizable de hora — aplica en guardar sesión, sesiones rápidas y correctHora
// T-202605-019: exponer funciones migradas desde misc-ui para compatibilidad con locus-api.js

// T-202606-031: handler de #hdr-menu-infra-subpanel movido a locus-ui-shell.js — initInfraVersionHandler() eliminado de este módulo.
