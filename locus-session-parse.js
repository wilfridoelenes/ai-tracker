// [PP] mod:191 · autor:Rune · 2026-08-10 UTC-6
// Fix INC-[pendiente-ID] (gap de especificación de TKT-202608-234, hallazgo de sesión de
// soporte): _processIngestBatch() — el guard temprano de batch sin ítems (items:[] en todos
// los bloques) asumía sin verificar que ningún bloque traía doc_updates sobrevivientes. Un
// batch de solo doc_updates (ej. DOC-UPDATE aplicado sobre un Doc Ref, sin cambios de
// backlog) tomaba la rama de éxito silencioso y retornaba sin invocar processDocUpdate() en
// ningún punto — el doc_update se perdía sin registrarse en la cola de Locus, y el panel de
// revisión (showMergeDiffPanel) nunca se activaba porque ese call site vive más abajo,
// alcanzable solo cuando hay tgItems/patchItems. Fix: antes de tomar la rama de éxito, se
// recorren metas buscando docUpdates con contenido; si los hay, se procesan aquí mismo vía
// processDocUpdate() (ya importado, mismo mecanismo que _onApplyBatch más abajo) y el toast
// final refleja el conteo real. Sin cambio de firma de _processIngestBatch() (sigue sin
// params, Promise<void>). contract_update: no — función interna sin export, comportamiento
// nuevo acotado a un caso que antes descartaba datos en silencio, sin afectar los demás
// branches del guard (sprint_proposal-only, batch inválido, batch con ítems).
// [PP] mod:190 · autor:Rune · 2026-08-09 UTC-6
// TKT-202608-278 (REQ-202608-113, origen_disc DISC-202608-115): _buildTgItemsFromParsed
// coaccionaba no_incluye a [] en silencio cuando el valor entrante no era ya un array —
// agregado _normalizeNoIncluye() (string con comas → array trimmed, string sin comas →
// array de 1, otro tipo con contenido → [] + _blogLog). Aplicado en los 2 sitios de
// construcción de tgItems dentro de la función. Ver TKT-202608-279 (locus-backlog-item.js)
// para la contraparte simétrica en patch.
// TKT-202608-267 (REQ-202608-107): loop inline de parsePaste()
// (~110 líneas, gate de type/status/ITIL/en-revision-sin-sprint/REQ+bloqueado/REQ-sin-AC/
// patch/patch-intencion) retirado y reemplazado por la llamada a _buildTgItemsFromParsed() —
// misma función que ya consumía el path batch (_parseBatchBlock). Preserva sin duplicar: todos
// los gates salvo rol-no-autorizado-bloqueado para type:'patch' sobre REQ existente, que NO se
// replica — ya enforced incondicionalmente en applyPatchesFromTG() (locus-backlog-item.js,
// capa de persistencia común a ambos paths, ver ese contrato). Único cambio observable: el
// texto exacto del mensaje DocLog para ese caso específico difiere levemente (mismo _blogLog
// key 'rol-no-autorizado-bloqueado', mismo resultado — patch rechazado). Locals ckptHeaderRole/
// _proyectoRawForQueue/_validTypes/_validStatuses retirados de parsePaste — muertos tras el
// retiro del loop, _buildTgItemsFromParsed resuelve lo mismo internamente desde ckpt completo.
// contract_update: sí — module-contracts sin entrada previa para _buildTgItemsFromParsed
// (gap ya registrado en DISC-202608-112), TKT3 de este mismo REQ ya emitió DOC-UPDATE de
// creación; este TKT amplía esa misma entrada con el nuevo consumidor (parsePaste).
// [PP] mod:185 · autor:Rune · 2026-08-08 UTC-6
// TKT3 (REQ-202608-107, ref_id CAEL-08081130-03): portado el gate de REQ sin AC (_reqsNoAc)
// desde el loop inline de parsePaste hacia _buildTgItemsFromParsed() — la función compartida
// entre el path single (vía TKT2 pendiente de este mismo REQ) y el path batch
// (_parseBatchBlock). Antes de este TKT, _buildTgItemsFromParsed no tenía ningún gate contra
// REQ sin AC — gap preexistente del path batch, nunca documentado en _Locus-module-contracts,
// que este TKT cierra como efecto colateral de la consolidación (BR-Ecosystem §5, REQ sin AC
// rechazado por Locus sin excepción de path). Mismo texto de mensaje, mismo criterio de
// acumulación sin interrupción del loop, mismo orden relativo respecto al bloque de
// REQ+bloqueado no autorizado (verificado: un REQ bloqueado con rol no autorizado sale por
// continue antes de llegar a este check, igual que en parsePaste). contract_update: sí.
// [PP] mod:184 · autor:Rune · 2026-08-07 UTC-6
// TKT2 (REQ ref_id CAEL-08061830-01): integrado tier-3 en _splitCheckpointBlocks() — _extractBareCheckpoint-
// Candidates() como último recurso, solo cuando ni fence ni bare-single-parseable aplican. Fix
// de bug propio detectado por harness antes de en-revision: el check de bare-single original
// solo verificaba límites estructurales ({...}), no que el texto completo parseara como UN
// objeto — 2+ objetos concatenados sin separador también cumplen esa forma estructural, lo que
// los desviaba a la rama equivocada antes de llegar a tier-3. Corregido verificando JSON.parse
// real sobre el texto completo antes de comprometerse a la rama single. 8/8 AC verificados con
// harness contra el archivo real, incluido el texto exacto que produjo el síntoma original del
// founder (2 CHECKPOINTs bare + frase de cierre pegada, sin fences). contract_update: sí.
// [PP] mod:182 · autor:Rune · 2026-08-06 UTC-6
// TKT1 (REQ ref_id CAEL-08061830-01): agregada _extractBareCheckpointCandidates(text) — función pura,
// sin export, sin efectos laterales. Escanea objetos JSON top-level balanceados (respetando
// strings/escapes), valida con JSON.parse real, filtra por gate title+project. No integrada
// aún a ningún caller (TKT2, siguiente sesión de este mismo REQ). 7/7 AC verificados con
// harness contra el archivo real. contract_update: sí — ver detalle en el CHECKPOINT del TKT.
// [PP] mod:181 · autor:Rune · 2026-08-06 UTC-6
// TKT-202608-265 (QA de Finn, Momento 1): comentario in-situ del fix de anclaje de fence
// (~línea 733, agregado en mod:175) todavía citaba `REQ-[pendiente-ID] ref_id CAEL-08061510-01`
// pese a que REQ-202608-106 y el propio TKT-202608-265 ya tienen código real confirmado en el
// backlog — violación de la regla dura de `__BR-Execution §9` (Referencias a ítems del backlog
// embebidas en código): una vez asignado código real, la referencia usa el código real, nunca el
// literal `[pendiente-ID]` ni el `ref_id` (exclusivo de la ventana previa a la ingesta en Locus).
// Fix: comentario actualizado a `TKT-202608-265 (REQ-202608-106, triggered_by PRB-202608-002)`.
// Sin cambio de código funcional — corrección de header/comentario únicamente, mismo criterio ya
// aplicado en mod:179/mod:180 para gaps de header distintos. contract_update: no.
// [PP] mod:180 · autor:Rune · 2026-08-06 UTC-6
// TKT-202608-265: verificación contra el AC del TKT ("anclar fence-marker a inicio/fin de línea
// real en _splitCheckpointBlocks") — confirma que el código ya presente en el archivo
// (~líneas 703-740, comentario in-situ con ref_id CAEL-08061510-02, triggered_by PRB-202608-002)
// satisface los 4 AC del TKT sin cambio de código. El regex vigente,
// `/^\s*```(?:json)?\s*\n[\s\S]*?\n\s*```\s*$/gm`, ya usa anclaje multiline (^/$): un ``` embebido
// dentro de un valor de string JSON (ej. `"content":"```sql\n...\n```"`) nunca ocupa su propia
// línea real, porque JSON serializa saltos de línea de un string como `\n` escapado (dos
// caracteres literales), nunca un salto de línea real dentro del valor — por construcción, ese
// ``` embebido siempre queda mid-line y nunca puede matchear el delimitador anclado.
// Verificado con harness aislado reproduciendo la función pura (sin dependencias externas salvo
// el side-effect de `_blogLog`, irrelevante para el resultado del split) — 7 casos: happy path
// (2 bloques fenced, el primero con ``` embebido en un campo de texto), edge case (``` mid-línea
// fuera de cualquier fence real) y los 5 casos de no-regresión declarados en el AC (bare sin
// fence · fence con prosa previa · 3+ bloques fenced con prosa intercalada · especificador json ·
// fence indentado con espacios). Los 7 pasan contra el código sin modificarlo — length esperado
// en cada caso confirmado exacto. Locus no tiene suite de tests en el repo real — verificación es
// lectura + ejecución aislada de la función pura, no un test runner del proyecto.
// Sin cambio de firma ni de comportamiento — este mod es corrección de header únicamente, mismo
// criterio ya aplicado en mod:179 para un gap de header distinto (línea ~668, TKT2608-101 pivot).
// Hallazgo fuera de scope (registrado en el CHECKPOINT de esta sesión, no resuelto aquí): los
// mods 175-178 no tienen entrada de header propia en este archivo — no reconstruibles en esta
// sesión sin CHECKPOINT ni registro disponible (mismo criterio ya usado en INC-202607-070, más
// abajo, para el salto de header 159→161 — gap conocido, no una entrada retroactiva inventada).
// contract_update: no — sin cambio de firma ni de comportamiento de ninguna función exportada.
// [PP] mod:179 · autor:Rune · 2026-08-06 16:05 UTC-6
// TKT1 (ref_id CAEL-0805-01, REQ-202608-101 — Opción A, pivote confirmado por el founder
// 2026-08-05 tras hallazgo de Finn en auditoría end-to-end del REQ): _splitCheckpointBlocks()
// retira el scanner de profundidad de llaves para bloques bare (_extractBareJsonBlocks +
// _looksLikeJsonObjectStart, TKT-202607-162/REQ CAEL-0727-01) — causa raíz confirmada de
// INC-202607-066/INC-202607-068 (una llave suelta en prosa, ej. mencionar el objeto
// {ref_id, title} al documentar schema, podía producir un bloque falso o desplazar el offset de
// bloques reales posteriores). Vuelve a ser split-por-fence puro — un batch de 2+ CHECKPOINTs
// exige que cada uno esté en su propio fence ```, ya no soporta mezclar fence + bloques bare
// sueltos (capacidad agregada en TKT4/REQ-202607-054, retirada aquí junto con su causa). El caso
// single-bare (texto completo como único objeto JSON sin fence) se conserva sin cambio, vía
// _looksLikeBareCheckpointJson() — mismo mecanismo que parsePaste() (isCheckpoint) ya usa. Sin
// cambio de firma pública — mismos 4 call sites internos (_routeParse, _updateIngestBlockCount,
// _renderIngestBlockPreview, _processIngestBatch), confirmados por grep, sin consumidor
// cross-módulo. no_incluye: no modifica parseCheckpoint()/_resolveCheckpointBatch()/
// _processIngestBatch() más allá de recibir bloques ya fence-delimited — solo el split.
// Corrección de header aplicada en esta sesión: el cambio de código (comentario in-situ,
// ~línea 668, y el cuerpo de _splitCheckpointBlocks) ya vivía en el archivo desde la sesión de
// implementación, sin que el bump de header correspondiente se aplicara sobre un archivo real —
// verificado ahora contra el archivo adjunto por el founder, discrepancia cerrada.
// [PP] mod:174 · autor:Rune · 2026-08-05 UTC-6
// TKT (ref_id CAEL-0804-01, REQ-202608-089): _renderIngestBlockPreview() pasa de función privada
// a exportada — locus-sesiones.js (_openIngestModal) la necesita para limpiar
// #ingest-block-preview-anchor cuando el modal se reabre para un Worker distinto sin draft que
// restaurar (ta.value queda '' vía reset directo, sin evento paste/input que dispare el wiring
// existente). Sin cambio de firma ni de comportamiento interno — la función ya toleraba
// ta.value === '' (rama "estado vacío" de TKT-202608-235, _metas.length === 0 → anchor.innerHTML
// = ''). contract_update: sí — nuevo consumidor cross-módulo, invariant: no acepta argumentos,
// lee #ingest-ta del DOM en cada llamada.
// [PP] mod:172 · autor:Rune · 2026-08-04 UTC-6
// TKT-202608-235 (REQ-202608-089, sprint PP-S-26): _renderIngestBlockPreview()/_ingestPreviewMeta()
//   agregadas — fila de preview por bloque detectado (icono + title truncado a 60 + subtítulo
//   "archivo · mod:N" cuando el bloque declara `files`) antes de que el founder confirme
//   'Procesar batch'. Wireada en los tres puntos que ya recalculan _updateIngestBlockCount()
//   (_routeParse rama batch, handlePaste x2, handleInput) — misma fuente de bloques
//   (_splitCheckpointBlocks(ta.value)), sin duplicar detección. Entregable visual de Nova
//   (locus-modals-base.css mod:25, design_intent: ingest_block_preview_mockup) — contenedor
//   100% dinámico, sin shell estático, montado sobre #ingest-block-preview-anchor. Bloqueo
//   declarado en el CHECKPOINT de entrega: index.html no estuvo adjunto en esta sesión — el
//   anclaje #ingest-block-preview-anchor no fue verificado contra el DOM real, requiere
//   confirmación de Cael/founder de que existe (o TKT de Rune para agregarlo) antes de done.
//   contract_update: no — funciones nuevas sin export, sin consumidores externos.
// TKT-202608-234 (REQ-202608-089, sprint PP-S-26): _processIngestBatch() — el mensaje final del
// batch distingue ahora "válido sin cambios de backlog" de "sin ítems para procesar" (error).
// Antes de este TKT, un batch de N CHECKPOINTs 100% válidos con items:[] en todos los bloques
// (solo trazabilidad de archivo, sin doc_updates ni sprint_proposal) mostraba el mismo warning
// genérico "Sin ítems para procesar en este batch." que un batch donde todos los bloques eran
// JSON malformado o sin title — indistinguibles para el founder pese a ser casos opuestos (uno
// es éxito silencioso, el otro es error real). Fix en dos puntos: (1) guard temprano
// (tgItems.length===0 && patchItems.length===0) — bifurca en metas.length>0 && skipped.length===0
// (todos los bloques válidos, ninguno rechazado/inválido) → toast success "[N] bloques válidos —
// sin cambios de backlog, solo trazabilidad de archivo"; cualquier otra combinación (algún bloque
// rechazado o inválido) cae al warning existente sin alteración — AC estado de error del TKT. (2)
// mensaje de éxito tras _applyCheckpointBatch — cuando el batch mezcla bloques con ítems y bloques
// válidos sin ítems propios, el toast resume ambos ("N aplicado(s) · M sin cambios de backlog") en
// vez de solo contar lo aplicado — AC edge case. `metas` (una entrada por bloque válido, con
// `idx`) es la fuente para ambos cálculos — sin agregar campo nuevo a _resolveCheckpointBatch ni
// a ningún schema de CHECKPOINT. No toca el motor de parseo, el criterio de validez de bloque, ni
// el panel de revisión posterior (`showMergeDiffPanel`) — solo el texto/tipo del toast en los dos
// puntos señalados. contract_update: no — _processIngestBatch conserva firma (sin params) y tipo
// de retorno (Promise<void>); ningún consumidor externo lee el texto del toast.
// [PP] mod:170 · autor:Rune · 2026-07-31 UTC-6
// Propuesta de mejora confirmada por el founder ("Sí adelante") en sesión de análisis del
// panel de ingesta (#ingest-validation-result). Hallazgo: el fallback `item.status || 'nuevo'`
// en _renderIngestResultItems() (comentario original "AC1/AC2 CAEL-31 — happy path + status
// badge ('nuevo' si el ítem no declara status)") es código muerto — ni el path ITIL
// (_buildItilItem, status siempre mirror de incident_status) ni el Scrum (_normSt, default
// 'pendiente') dejan .status falsy, y cualquier ítem con error de construcción nunca llega a
// esta función: el batch completo se descarta (tgItems=[]) y el CHECKPOINT se bloquea vía
// _showIngestValidationError() antes de renderizar la lista. Resolución directa en sesión
// (__BR-Core NO DEJAR DEUDA EN SILENCIO — Excepción de resolución directa: dueño de este
// archivo co-presente, nivel Patch, sin bifurcación de founder ya confirmada): comentario
// reescrito para reflejar que el fallback es guardia defensiva, no caso vivo — sin retirar el
// fallback en sí (CRITERIO DE RESOLUCIÓN DE RAÍZ: preservar la guardia contra un caller futuro
// que rompa el invariante actual cuesta cero y es más robusto que confiar en que ningún caller
// nuevo lo rompa). Sin cambio de comportamiento — solo el comentario junto a
// _renderIngestResultItems(). contract_update: no.
// [PP] mod:168 · autor:Rune · 2026-07-29 UTC-6
// Fix inline: delete window[_dupCheckpointWarnSeen_${id}] agregado a la lista de limpieza del
// reset de textarea vacío (~L2233) — gap detectado en Hallazgo fuera de scope de esta sesión.
// Ver comentario junto al delete para el detalle completo.
// INC-[pendiente-ID] (triggered_by: sesión de duplicación de ítem tras CHECKPOINT batch +
// Quick Capture): guard de reentrancia agregado en _routeParse() — el navegador dispara 'paste'
// e 'input' para la misma acción de pegado sobre #ingest-ta, y handleInput (inmediato) +
// handlePaste (diferido 150ms) ambos llamaban _routeParse(), que para 2+ bloques delegaba a
// _processIngestBatch() sin guard propio. Sin el guard, un mismo pegado abría
// showMergeDiffPanel() dos veces y un solo click en "Aplicar" ejecutaba
// _applyCheckpointBatch() dos veces con el mismo batch — dos códigos reales distintos
// asignados al mismo ítem. Fix scoped a `ta.value === _lastBatchRouteText` dentro de
// _BATCH_ROUTE_DEBOUNCE_MS (1000ms) — cubre la ventana de ~150ms entre ambos eventos sin
// bloquear reprocesar el mismo texto minutos después. Fix complementario (defensa en
// profundidad): locus-backlog-merge.js — showMergeDiffPanel() ahora aborta su _mdiffPanelAC
// previo y scopea los listeners de los tres botones del panel al mismo AbortController.
// Módulo crítico (locus-session-parse.js, `_pp-context §6`) — verificación de regresiones
// obligatoria en Finn. contract_update: no — sin cambio de firma en ninguna función exportada,
// solo lógica interna de _routeParse (función no exportada).
// [PP] mod:162 · autor:Rune · 2026-07-29 UTC-6
// INC-202607-070 (triggered_by: INC-202607-069 · corrección de header, sin cambio de código):
// El bloque de mod:161 (TKT-202607-172, abajo) declaraba "no_incluye: no se corrige esa
// lectura obsoleta en este alcance, queda registrada como hallazgo separado" respecto al read
// raíz de next_step en proximoPaso — pero el propio cuerpo del archivo (líneas ~1191-1221 en
// esa misma entrega) ya contenía ese fix, atribuido inline a INC-202607-069. La entrada de
// mod:161 quedó desactualizada frente a su propio contenido; no se reescribe esa entrada
// histórica — se corrige aquí con una entrada nueva, mismo criterio ya aplicado en la
// corrección de header de mod:159 (abajo). Sin cambio de código en esta entrega — solo
// corrección de documentación de header.
// AC1 (entrada de header consistente con el contenido real del archivo): cumplido — esta
// entrada documenta explícitamente que el fix de INC-202607-069 aplicó en mod:161, corrigiendo
// la afirmación contraria de esa misma entrada.
// AC2 (secuencia de mod sin saltos sin explicar): el salto 159→161 (sin entrada de mod:160) no
// se puede reconstruir — no hay CHECKPOINT ni registro de qué entrega ocurrió en mod:160
// disponible en esta sesión. Se declara como gap conocido y no resuelto — no se inventa una
// entrada retroactiva para un mod que esta sesión no puede verificar (mismo criterio que ya
// aplica este archivo: ver retirada de cita a PRB fabricado en comentarios, PRB-202607-001).
// contract_update: no — ningún cambio de código, solo header.
// [PP] mod:161 · autor:Rune · 2026-07-28 00:12 UTC-6
// TKT-202607-172 (REQ-202607-058, kill_criteria aprobado por el founder — módulo crítico):
// _extractCkptMeta() gana 2 campos — nextStep y nextRole. nextStep lee
// pendientes_y_siguiente_paso.next_step (campo vigente, __BR-Ecosystem §8 infra_version 62) vía
// el nuevo campo intermedio nextStepRaw en el objeto retornado por parseCheckpoint(); nextRole
// lee next_role de raíz del CHECKPOINT vía nextRoleRaw. Ninguno de los dos reemplaza proximoPaso
// (que sigue leyendo _parsed.next_step a nivel raíz, ubicación pre-infra_version 62 — no_incluye
// del TKT: no se corrige esa lectura obsoleta en este alcance, queda registrada como hallazgo
// separado). AC de contrato verificado: sin validación de allow-list de keys sobre el objeto
// ckpt ni sobre el retorno de _extractCkptMeta en ningún punto de este archivo (grep confirmado)
// — los 6 módulos que importan de este archivo no pueden rechazar los 2 campos nuevos por
// desestructuración estricta, JS no lanza excepción por propiedades desconocidas en un objeto.
// Consumidor real de los campos nuevos: locus-backlog-merge.js (metas[i].nextStep/.nextRole, vía
// el spread ya existente en _resolveCheckpointBatch — sin cambio en ese spread, los campos
// llegan automáticamente). El flujo single (ai._parsed, más abajo en este archivo) NO propaga
// estos 2 campos — ese objeto cherry-picking explícito de _ckptMetaShared no los incluye, y no
// se amplía en este TKT (locus-session-save.js, donde vive la construcción de ckptMeta para el
// flujo single, no está declarado en `archivos` de este TKT ni adjunto en esta sesión — ver
// Hallazgo fuera de scope en el CHECKPOINT de entrega). contract_update: sí — ver contract_detail
// del CHECKPOINT de entrega.
// [PP] mod:159 · autor:Rune · 2026-07-27 UTC-6
// Corrección de header (esta sesión): el archivo ya contenía el wiring de TKT-202607-169
// (doc_updates/inline_fix/finn_release en _onApplyBatch, ver más abajo) pero la línea de
// header nunca se incrementó de mod:157 a mod:158 en la entrega anterior — omisión de Rune,
// corregida aquí junto con el incremento a mod:159 por TKT-202607-170 (esta entrega).
// TKT1 (REQ CAEL-0727-01, triggered_by INC-202607-068, Opción B — resolución de causa raíz):
// _extractBareJsonBlocks() trackeaba profundidad de llaves sobre TODO el texto, incluida la
// prosa entre bloques CHECKPOINT — un par balanceado suelto en prosa (ej. una mención a
// "{ref_id, title}", patrón de escritura común en este ecosistema al documentar schema) se
// extraía como "bloque" propio en cuanto _depth volvía a 0, corrompiendo la extracción del
// batch completo (JSON.parse falla sobre ese candidato → 0 ítems aplicables, ver INC-202607-068).
// Fix: nueva función pura _looksLikeJsonObjectStart(text, i) — lookahead schema-aware que, al
// encontrar '{' en _depth===0, verifica que lo que sigue (tras espacios en blanco) sea una
// clave entre comillas seguida de ':' (o '}' para objeto vacío) antes de empezar a trackear esa
// apertura como un candidato real. Si el lookahead falla, la llave se ignora — no incrementa
// _depth, no toca _start, se comporta como texto literal. AC happy path: prosa con
// "{ref_id, title}" entre 2 CHECKPOINTs bare → los 2 bloques reales resuelven, la mención en
// prosa no genera un tercer candidato espurio. AC edge case (llave suelta sin par, ej. una '{'
// de prosa sin cierre correspondiente): el lookahead la descarta antes de que _depth se
// incremente, por lo que no absorbe el resto del texto hasta el próximo '}' real — el bloque
// CHECKPOINT que sigue no ve su _start desplazado. AC regresión: un solo bloque bare sin
// prosa intermedia sigue resolviendo igual — el '{' inicial de un CHECKPOINT real siempre pasa
// el lookahead (primera clave siempre entre comillas, ej. "title":). contract_update: no —
// _extractBareJsonBlocks y _splitCheckpointBlocks conservan firma y tipo de retorno
// (text) → string[]; _looksLikeJsonObjectStart es interna nueva, sin export, sin consumidores
// externos. Hallazgo fuera de scope (no bloqueante, registrado para Vera): el header de este
// archivo vive en la primera línea, antes de los imports (línea ~650) — contradice
// _pp-strategy §7 ("el header va inmediatamente después del bloque de imports"). Discrepancia
// preexistente en todos los mods anteriores de este archivo, no introducida por este TKT —
// se mantiene el patrón ya establecido para no mezclar un cambio estructural fuera de scope
// con este fix.
// [PP] mod:156 · autor:Rune · 2026-07-27 UTC-6
// TKT4 (REQ-202607-054, depends_on TKT-202607-162, origen_disc DISC-202607-051):
// _splitCheckpointBlocks() ganaba fence-priority absoluta — si el regex de fence matcheaba
// algo, el resto del texto nunca pasaba por el scanner de llaves de TKT-202607-162, sin
// importar si contenía bloques bare mezclados. Corregido: cuando hay fences, el remanente del
// texto (los fences ya removidos vía .replace(_re,'')) se escanea con el mismo
// _extractBareJsonBlocks() ya existente — los bare mezclados se agregan a continuación de los
// fenced, en vez de ignorarse en silencio. AC happy path: 1 fenced + 2 bare → array de 3. AC
// error: bloque bare incompleto al final se descarta igual que antes (comportamiento heredado
// de _extractBareJsonBlocks, sin cambio en esa función). AC edge case: solo fences sin ningún
// bare → _extractBareJsonBlocks(_remainder) devuelve [] de forma natural (no hay JSON
// balanceado en el remanente) → _matches se retorna sin concatenar, sin regresión sobre el
// comportamiento previo. contract_update: no — _splitCheckpointBlocks conserva firma y tipo de
// retorno (text) → string[]; _extractBareJsonBlocks se reutiliza sin cambio de firma, ya era
// interna sin consumidores externos.
// [PP] mod:155 · autor:Rune · 2026-07-27 UTC-6
// TKT-202607-163 (REQ-202607-054, depends_on TKT-202607-162): verificación — sin refactor.
// AC1 pedía confirmar si _resolveCheckpointBatch()/_processIngestBatch() ya consumen
// _splitCheckpointBlocks() como fuente única o duplican criterio propio de detección de
// bloques (mismo patrón de divergencia que causó INC-202607-066). Verificado contra el cuerpo
// real de ambas funciones: _processIngestBatch() llama _splitCheckpointBlocks(ta.value) para
// obtener rawBlocks (línea ~2384) y pasa ese array ya resuelto a _resolveCheckpointBatch(blocks,
// sessionId) — esta última no vuelve a invocar ningún criterio de detección de bloques, solo
// itera blocks.map(...) y delega cada elemento a _parseBatchBlock. No hay duplicación de
// criterio en ningún punto del pipeline batch — ambas funciones ya consumían la fuente única
// antes de este TKT, incluido el fix de TKT-202607-162 (mod:154): con el scanner de profundidad
// de llaves ahora devolviendo N bloques bare, _routeParse() (que decide single vs batch
// contando _splitCheckpointBlocks(ta.value).length > 1) enruta correctamente a
// _processIngestBatch(), que resuelve y combina los N bloques en tgItems — no solo los cuenta.
// Condición "si duplican, refactoriza" del AC1 evaluada como falsa — sin cambio de código
// funcional en este TKT.
// AC de contrato: _splitCheckpointBlocks, _resolveCheckpointBatch y _processIngestBatch
// conservan su firma — sin alteración. Call sites conocidos dentro de este archivo
// (_routeParse, _updateIngestBlockCount, _processIngestBatch) siguen funcionando igual.
// No se pudo confirmar contra el MAP si algún módulo externo importa _resolveCheckpointBatch
// o _processIngestBatch directamente — el MAP adjunto (_PP-map-v1.11.1.md) está desactualizado
// respecto al mod real de este archivo (declara "Changed in: TKT-202607-145", mod 150; el
// archivo real está en mod:155) y no lista _resolveCheckpointBatch en sus entradas. Sin otros
// archivos reales del proyecto adjuntos en esta sesión para grep de imports externos — riesgo
// bajo dado que ambas funciones son internas al pipeline de ingesta de este mismo módulo, pero
// gap de verificación registrado explícitamente en vez de asumido.
// contract_update: no — ninguna firma exportada cambia en este TKT.
// [PP] mod:154 · autor:Rune · 2026-07-27 UTC-6
// TKT-202607-162 (REQ-202607-054, depends_on TKT-202607-163): _splitCheckpointBlocks() gana
// soporte para 2+ objetos JSON CHECKPOINT concatenados sin fence — el gap declarado en
// DISC-202607-050 (INC-202607-066, mod:153, solo cubría un único bloque bare). Nuevo scanner
// interno _extractBareJsonBlocks(text) recorre el texto carácter por carácter contando
// profundidad de llaves, respetando el estado "dentro de string" (comillas dobles con escape
// \") para no contar llaves literales dentro de valores JSON como delimitador estructural (AC
// edge case: "llaves en strings"). Cada substring balanceado que abre en '{' de profundidad 0
// y cierra en el '}' correspondiente es un bloque — la prosa entre bloques ("Se ejecutaron 3
// comandos...", "Confirmado...") se ignora sin usarse como delimitador, simplemente no cae
// dentro de ningún rango balanceado. Bloque incompleto al final del texto (llave sin cierre)
// se descarta silenciosamente — sin entrada parcial, sin excepción lanzada (AC edge case:
// "bloque incompleto"). Fence-priority preservado sin cambio: _splitCheckpointBlocks sigue
// devolviendo los matches de fence ``` primero si el regex matchea algo — el scanner de
// llaves solo corre cuando no hay ningún fence en el texto, mismo orden que ya regía para el
// fallback de INC-202607-066 (AC regresión INC-066: un único bloque bare sigue detectándose,
// ahora vía el caso trivial N=1 del mismo scanner en vez del heurístico startsWith/endsWith
// dedicado). _looksLikeBareCheckpointJson() se conserva sin cambio de firma — parsePaste()
// la sigue usando directamente para su propio gate de isCheckpoint (línea ~1446), fuera de
// scope de este TKT tocar ese call site; el scanner nuevo no la reemplaza, coexiste con ella.
// Deliberadamente no resuelve: bloque con ``` embebido dentro de un string JSON (mismo riesgo
// ya documentado en T-202606-019 y en el TKT1 de este mismo REQ, línea ~427) — fence-priority
// se evalúa primero, así que el regex de fence corta ahí antes de que el scanner de llaves
// entre en juego; no es un caso nuevo introducido por este TKT. no_incluye: no modifica
// parsePaste() ni el gate de isCheckpoint de un único bloque bare (usa su propio heurístico
// sin tocar); no valida JSON.parse de los bloques extraídos — eso sigue ocurriendo en
// parseCheckpoint vía _parseBatchBlock, sin cambio. contract_update: no — _splitCheckpointBlocks
// conserva firma (text) → string[]; _extractBareJsonBlocks es interna, sin export, sin
// consumidores externos.
// Hallazgo fuera de scope (verificado con harness funcional antes de entregar): un fragmento de
// prosa con llaves balanceadas que no forman JSON válido (ej. "resultado {ok}.") produce un
// bloque candidato extra que _parseBatchBlock rechaza como CHECKPOINT inválido — mismo pill de
// error ya vigente para bloques malformados (AC2 de TKT3, ver línea ~407), sin abortar el resto
// del batch. No es regresión de este TKT — es el mismo comportamiento de tolerancia a bloques
// inválidos ya diseñado en el pipeline batch, ahora también alcanzable desde texto sin fence.
// Registrado para que Cael/Finn lo tengan presente si el AC de "sin ruido visual" del panel de
// ingesta llega a cubrir explícitamente este caso — no corregido aquí por estar fuera del
// alcance declarado del TKT (extracción de bloques, no filtrado heurístico de prosa con llaves).
// [PP] mod:153 · autor:Rune · 2026-07-27 UTC-6
// INC-202607-066: _splitCheckpointBlocks() solo detectaba bloques delimitados por fence ```
// (con o sin especificador json) — texto pegado como JSON puro sin fence devolvía [] pese a que
// parsePaste() (isCheckpoint, línea ~1410) sí lo procesaba y guardaba correctamente vía su propio
// fallback (text.trim().startsWith('{') && .endsWith('}')). Resultado observable: el contador
// #ingest-block-count mostraba "0 bloques detectados" con un CHECKPOINT único sin fence ya
// guardado y con detección de duplicado funcionando — dos funciones con criterios distintos de
// "qué es un bloque CHECKPOINT" sobre el mismo texto. Fix: heurístico de bloque único sin fence
// extraído a _looksLikeBareCheckpointJson() (función pura, sin efectos laterales) y reutilizado
// en ambos call sites — _splitCheckpointBlocks() gana el mismo fallback como último recurso
// (solo si el regex de fence no matchea nada), parsePaste() se refactoriza para consumir la
// misma función en vez de duplicar el heurístico inline, sin cambio de comportamiento en ese
// call site. No cubre batch (2+ objetos JSON concatenados sin fence) — sin fence no hay
// delimitador confiable entre objetos, requeriría parsing por profundidad de llaves — registrado
// como DISC-202607-050, fuera de scope de este fix. contract_update: no — ninguna firma exportada
// cambia (_splitCheckpointBlocks conserva firma y tipo de retorno; _looksLikeBareCheckpointJson
// es interna, sin export, sin consumidores externos).
// [PP] mod:152 · autor:Rune · 2026-07-27 UTC-6
// INC-202607-062: rama de mismatch en _showIngestValidationResult() usaba
// classList.replace('validation-badge--success','validation-badge--warning') — no-op si
// --success no estaba presente (primer pegado de la sesión). Reemplazado por remove+add
// explícito, mismo patrón que INC-202607-060 (rama 'sin campo Proyecto', mod:151).
// [PP] mod:151 · autor:Rune · 2026-07-27 UTC-6
// INC-202607-060: badge de proyecto en _showIngestValidationResult() conservaba
// 'validation-badge--success' al pasar a la rama 'sin campo Proyecto' — solo la rama de
// mismatch usaba .replace(). Ahora remueve --success explícitamente antes de agregar --warning.
// TKT3 (REQ-202607-046, depends_on TKT-202607-145): _processIngestBatch() — retirado el bloque
// que coordinaba #merge-diff-overlay contra #ingest-modal-overlay antes de invocar
// showMergeDiffPanel. Esa coordinación era necesaria bajo la arquitectura de dos overlays
// independientes (TKT-202607-128/129, superada); con el shell único (#modal-split-shell,
// TKT-202607-144/145) showMergeDiffPanel abre el shell directamente y este call site no
// necesita preparar nada antes de invocarla. Guard de proyecto activo (líneas ~2269-2273)
// sin cambio — solo se eliminó el bloque de coordinación previa. no_incluye del TKT: no toca
// _processIngestBatch más allá de ese bloque, no cambia showMergeDiffPanel (TKT2, ya
// entregado), no agrega call sites nuevos. contract_update: no — firma de la invocación sin
// cambio (mismos 5 argumentos). Ver mismo fix aplicado en locus-session-save.js (mod:79) y en
// locus-sesiones.js (TKT-202607-145 AC2).
// [PP] mod:149 · autor:Rune · 2026-07-26 UTC-6
// TKT-202607-138 (REQ-202607-043, depends_on TKT-202607-137): gate visible en el panel de
// ingesta para el mismo rechazo que TKT1 aplica silenciosamente en storage (applyPatchesFromTG,
// locus-backlog-item.js mod:152) — un patch REQ→done con TKT hijo no done/descartado ahora se
// muestra ANTES de confirmar el CHECKPOINT, no solo se descubre en DocLog después de aplicar.
// Insertado en parsePaste() entre el check de Proyecto no reconocido y el aviso de infra_version
// — mismo patrón bloqueante (_showIngestValidationError + return, sin "Continuar de todas
// formas"). Mismo pre-escaneo de batch que TKT1: mapa `_projected` construido sobre
// _pendingPatches + tgItems antes de evaluar, para que un patch TKT→done que aparece DESPUÉS
// del patch REQ→done en el mismo array (orden típico de emisión) no produzca falso positivo.
// AC edge case (múltiples REQ bloqueados = un check por REQ, no agregado): cada REQ bloqueado
// genera su propio <div class="blocker-row">, concatenados sin fusionar el texto en una sola
// oración. no_incluye: no toca applyPatchesFromTG (TKT1, ya entregado) ni agrega modal separado
// — reutiliza el shell existente de #ingest-validation-error.
// [PP] mod:148 · autor:Rune · 2026-07-26 UTC-6
// TKT-202607-131 (REQ-202607-041, origen DISC-202607-043): Finn devolvió el TKT en primera
// auditoría — el fix bajo ref_id CAEL-0725-03 (línea ~1601, _isNonCanonicalPlaceholder
// importada en línea ~436) solo escribe a DocLog vía _blogLog('dep-placeholder-ambiguo', ...),
// no satisface el AC literal ("el panel de validación de ingesta la señala"). Agregado warning
// visible en parsePaste() (patrón warn-key _depPlaceholderWarnSeen, mismo criterio que
// _doneWarnKey/_dupWarnKey — bloqueante con "Continuar de todas formas") que reutiliza
// _isNonCanonicalPlaceholder sobre tgItems.dependsOn ya construidos, sin duplicar ni eliminar
// el _blogLog existente. Literal exacto '[pendiente-ID]' conserva el mismo comportamiento —
// misma condición del some(), sin regresión. contract_update: n/a — sin cambio de firma exportada.

// [PP] mod:147 · autor:Rune · 2026-07-25 02:33 UTC-6
// INC-202607-031 (triggered_by REQ-202607-033): _onApplyBatch() — ckptHeaderRole:'' hardcodeado
// en la llamada a applyPatchesFromTG() reemplazado por roleByIdx (Map<idx, role>) construido
// desde metas (ya disponible en el closure, destructurado de _resolveCheckpointBatch). Causa
// raíz real del bug: un batch de 2+ CHECKPOINTs pegados juntos (patrón recomendado por BR-Core,
// "Entrega de CHECKPOINTs intermedios") puede traer patches de bloques con roles distintos —
// un solo string de rol para todo el batch no puede representar eso. metas ya llevaba { rol,
// idx } por bloque válido desde una corrección anterior (_extractCkptMeta + idx: b.idx en
// _resolveCheckpointBatch) — el fix conecta ese dato ya existente con applyPatchesFromTG
// (locus-backlog-item.js mod:145, mismo INC), que ahora resuelve el rol autorizado por
// patch.idx en vez de un valor fijo. Sin cambio de firma de applyPatchesFromTG. Hallazgo fuera
// de scope (no corregido en este INC): el guard simétrico REQ→bloqueado en mergeBacklogFromTG
// (locus-backlog-item.js) usa opts.ckptRol, resuelto desde locus-session-save.js — archivo no
// adjunto en esta sesión, no verificado si tiene el mismo patrón de bug.
// [PP] mod:146 · autor:Rune · 2026-07-24 UTC-6
// QA Finn detectó referencia de línea stale en el comentario de mod:145 — citaba líneas de
//   esc() previas al propio borrado de buildTGPreview() en ese mismo mod (46 líneas de
//   desplazamiento). Corregido a descripción sin línea exacta — mismo criterio de fragilidad
//   ya reconocido en otras entradas de este header (ver mod:110/125/132 de module-contracts,
//   patrón análogo). Sin cambio de comportamiento — Patch.
// [PP] mod:145 · autor:Rune · 2026-07-24 UTC-6
// Limpieza (hallazgo fuera de scope, sesión de ingesta): buildTGPreview() retirada — sin call
//   sites reales (solo su propia definición), superada por _showIngestValidationResult()
//   (CAEL-29/31, ver mod:118). Banner "Responsabilidad:" corregido — ya no la lista. Comentarios
//   históricos de TKT3/TKT4 (ingesta batch de CHECKPOINTs standalone) que mencionan buildTGPreview
//   se conservan sin editar — documentan una cadena ya eliminada (parsePasteStandalone y afines,
//   ver mod anterior en este mismo header), registro histórico, no banner vivo. `esc()` no se toca
//   — mantiene otros call sites reales en este archivo (bloque `_showIngestValidationError`/
//   `_validList`, sin citar línea exacta — desplazada por este mismo borrado, ver §9 line drift).
// [PP] mod:144 · autor:Rune · 2026-07-25 UTC-6
// INC-202607-027: _VALID_INCIDENT_STATUS aceptaba 'assigned'/'in_progress' como incident_status
//   válido para INC pese a que BR-Core §6 fusionó 'assigned' a 'detected' (infra_version 52) y
//   eliminó 'in_progress' para INC (infra_version 53). Ambos retirados del Set — un CHECKPOINT
//   que declare un INC con cualquiera de los dos ahora es rechazado con el mensaje ya corregido
//   en TKT-202607-107 (_INCIDENT_STATUS_LIST, mod:142). _VALID_PRB_STATUS no se toca — 'in_progress'
//   sigue siendo válido para PRB (BR-Core §6). Sin otro caller de 'assigned'/'in_progress' en este
//   archivo (verificado por grep) — sin impacto lateral adicional.
// [PP] mod:143 · autor:Rune · 2026-07-25 UTC-6
// INC-202607-028: _VALID_PRB_STATUS no incluía 'root_cause_confirmed' — un CHECKPOINT con PRB
//   en ese status era rechazado por _buildItilItem como "incident_status inválido" pese a ser
//   estado válido del ciclo PRB (BR-Core §6, fusión KE→PRB.root_cause_confirmed, infra_version
//   51). Agregado al Set. _PRB_STATUS_LIST (mensaje, mod:142) ya lo declaraba — el mismatch
//   mensaje/lógica registrado en TKT-202607-107 queda cerrado. Sin cambio de firma en
//   _itilStatusSet/_buildItilItem — mismo comportamiento para el resto de valores.
// [PP] mod:142 · autor:Rune · 2026-07-25 UTC-6
// TKT-202607-107: mensajes de error corregidos contra BR-Core §6 — _INCIDENT_STATUS_LIST
//   ya no lista 'assigned' (fusionado a 'detected', infra_version 52) ni 'in_progress'
//   (eliminado para INC, infra_version 53). _PRB_STATUS_LIST ahora incluye
//   'root_cause_confirmed' (faltaba por completo pese a ser estado válido de PRB) — mismo
//   criterio que las 3 correcciones de mensaje ya hechas para KE en mod:136. Comentario
//   adyacente a _VALID_PRB_STATUS actualizado — ya no menciona "KE tiene ciclo propio"
//   (fusionado a PRB.root_cause_confirmed). no_incluye: no modifica _VALID_INCIDENT_STATUS
//   ni _VALID_PRB_STATUS (las lógicas de aceptación, no solo el string) — ver Hallazgo fuera
//   de scope en el CHECKPOINT de este TKT, ambas quedan con mismatch mensaje/lógica
//   registrado como INC nuevo, no corregido aquí.
// INC-[pendiente-ID] (fix gate req-sin-tkt vs reparenting — ver locus-backlog-item.js mod:142
// para el detalle completo): patchItems (ya en scope desde _resolveCheckpointBatch) ahora se
// pasa a _applyCheckpointBatch() en _onApplyBatch — antes no se propagaba.
// INC-[pendiente-ID] (Variante ligera): char counter del modal de ingesta nunca se actualizaba —
//   buscaba 'cc-'+id (patrón por-Worker legacy, pre-CAEL-22), id que no existe en el DOM. El
//   elemento real es global: #ingest-char-counter (index.html L1572), mismo patrón que
//   #ingest-block-count. Fix: id fijo, sin sufijo por Worker — consistente con el resto de
//   elementos ya unificados del modal (#ingest-ta, #ingest-block-count).
// TKT1 (REQ CAEL-0724-02, DISC-202607-029): _renderIngestResultItems() — badge de tipo por fila,
// reusa _GEN2_TYPES ya importado (fuente única de tipos válidos, evita duplicar el array) para
// distinguir reconocido/no-reconocido. Sufijo de clase usa item.type verbatim — sin toLowerCase()/
// toUpperCase() — evita el mismatch de casing abierto en renderQIncStats()/zone-engine.js
// (tc-inc generado en JS vs selector .tc-INC en CSS, ver _Locus-css-ref mod:124).
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
// INC-202607-066: heurístico de "texto es un único objeto JSON sin fence ```" — extraído a
//   función pura y compartido entre _splitCheckpointBlocks() (más abajo) y parsePaste()
//   (isCheckpoint, línea ~1410, antes duplicado inline). Sin efectos laterales, no muta `text`.
//   Deliberadamente no cubre 2+ objetos concatenados sin fence — sin delimitador entre ellos, no
//   hay forma confiable de saber dónde termina uno y empieza el siguiente sin parsear por
//   profundidad de llaves (ver DISC-202607-050, fuera de scope de este fix).
function _looksLikeBareCheckpointJson(text) {
  const _t = text.trim();
  return _t.startsWith('{') && _t.endsWith('}');
}

// TKT1 (REQ ref_id CAEL-08061830-01, ref_id propio CAEL-08061830-02, triggered_by PRB-202608-002 vía founder —
//   síntoma real: paste desde el chat de Claude pierde los fences ``` y suele traer prosa
//   alrededor de los CHECKPOINTs, lo que hoy tumba a _splitCheckpointBlocks() a 0 bloques):
//   función pura que escanea el texto completo en busca de objetos JSON de nivel superior
//   ({...} balanceados, respetando strings y escapes) y los valida con JSON.parse real —
//   nunca por profundidad de llaves sola. Deliberadamente NO reintroduce el scanner heurístico
//   retirado en REQ-202608-101 (_extractBareJsonBlocks/_looksLikeJsonObjectStart, causa raíz de
//   INC-202607-066/068: una llave suelta en prosa, ej. mencionar {ref_id, title} al documentar
//   schema, producía un bloque fantasma). Aquí la barrera es doble: (1) JSON.parse real — una
//   llave suelta en prosa no-JSON (claves sin comillas, sin dos-puntos) nunca parsea, se descarta
//   sin generar candidato; (2) gate title+project — el candidato debe tener ambos campos como
//   string no vacío, mismo criterio que ya usa parseCheckpoint() en su rama bare-single (.title)
//   mas exigente (+.project) porque este scanner opera sobre texto libre, con mayor superficie
//   de falso positivo que el caso ya-anclado de un solo objeto. Sin efectos laterales — no toca
//   DOM, no llama _blogLog (el caller decide si registra el texto descartado). Contract_update:
//   sí — invariant: nunca devuelve un candidato que no pase JSON.parse + title + project.
function _extractBareCheckpointCandidates(text) {
  const _candidates = [];
  if (!text) return _candidates;
  const _n = text.length;
  let _i = 0;
  while (_i < _n) {
    if (text[_i] === '{') {
      let _depth = 0, _j = _i, _inStr = false, _esc = false;
      for (; _j < _n; _j++) {
        const _c = text[_j];
        if (_inStr) {
          if (_esc) { _esc = false; }
          else if (_c === '\\') { _esc = true; }
          else if (_c === '"') { _inStr = false; }
        } else {
          if (_c === '"') _inStr = true;
          else if (_c === '{') _depth++;
          else if (_c === '}') {
            _depth--;
            if (_depth === 0) { _j++; break; }
          }
        }
      }
      const _span = text.slice(_i, _j);
      try {
        const _parsed = JSON.parse(_span);
        if (
          _parsed && typeof _parsed === 'object' && !Array.isArray(_parsed) &&
          typeof _parsed.title === 'string' && _parsed.title.trim() &&
          typeof _parsed.project === 'string' && _parsed.project.trim()
        ) {
          _candidates.push('```\n' + _span + '\n```');
        }
      } catch (e) {
        // JSON inválido — no es candidato, se descarta silenciosamente. No produce bloque
        // fantasma (mismo criterio que cerró INC-202607-066/068, vía JSON.parse real en vez
        // de conteo de llaves).
      }
      _i = _j > _i ? _j : _i + 1;
    } else {
      _i++;
    }
  }
  return _candidates;
}

// TKT1 (REQ-202608-101, Opción A — pivote confirmado por el founder 2026-08-05 tras hallazgo de
// Finn en auditoría end-to-end del REQ): retira el scanner de profundidad de llaves para bloques
// bare (_extractBareJsonBlocks + _looksLikeJsonObjectStart, TKT-202607-162/REQ CAEL-0727-01) —
// causa raíz confirmada de INC-202607-066 e INC-202607-068 (una llave suelta en prosa, ej.
// mencionar el objeto {ref_id, title} al documentar schema, podía producir un bloque falso o
// desplazar el offset de bloques reales posteriores). _splitCheckpointBlocks() vuelve a ser
// split-por-fence puro: un batch de 2+ CHECKPOINTs exige que cada uno esté en su propio fence
// ``` — ya no soporta mezclar fence + bloques bare sueltos en el mismo texto (capacidad agregada
// en TKT4/REQ-202607-054, retirada aquí junto con su causa). El caso single-bare (texto completo
// es un único objeto JSON sin fence) se conserva sin cambio, vía _looksLikeBareCheckpointJson()
// — mismo mecanismo que ya usa parsePaste() (isCheckpoint) para decidir si el texto es un
// CHECKPOINT, sin heurística de llaves ni scanner de profundidad.
// no_incluye: no modifica parseCheckpoint()/_resolveCheckpointBatch()/_processIngestBatch() —
// solo el split. No modifica _looksLikeBareCheckpointJson().
// TKT-202608-261 (REQ-202608-103): cuando hay 1+ match de fence, cualquier texto no-whitespace
// que quede fuera de esos fences se estaba descartando en silencio — sin señal al founder
// (DISC-202608-104). Se agrega alerta DocLog con el conteo de caracteres descartados. No
// reintenta parsear ese texto ni lo agrega como bloque — el descarte en sí no cambia, solo deja
// de ser silencioso. Whitespace puro fuera de los fences no genera alerta (AC edge case).
// TKT-202608-265 (REQ-202608-106, triggered_by PRB-202608-002): el regex de fence no estaba
// anclado a línea real — un ``` embebido dentro de
// un campo de texto de un CHECKPOINT (ej. doc_updates[].content citando SQL/código) se trataba
// como delimitador real, cortando el batch en el punto equivocado y corrompiendo el JSON
// resultante (INC-202608-098). Fix de causa raíz: el fence de apertura y cierre debe ocupar su
// propia línea real (multiline ^/$) — un ``` que aparece a mitad de una línea (ej. dentro de un
// string JSON serializado, precedido por \n escapado en vez de salto de línea real) ya no cuenta
// como delimitador. Fence-priority se conserva sin cambio — no reintroduce el mecanismo de
// bare-blocks retirado en REQ-202608-101, no modifica _looksLikeBareCheckpointJson(). Cálculo de
// `_remainder` (TKT-202608-261, arriba) no cambia de lógica — solo opera sobre los matches ya
// corregidos.
export function _splitCheckpointBlocks(text) {
  if (!text) return [];
  const _re = /^\s*```(?:json)?\s*\n[\s\S]*?\n\s*```\s*$/gm;
  const _matches = text.match(_re);
  if (_matches) {
    const _remainder = text.replace(_re, '').trim();
    if (_remainder.length > 0) {
      _blogLog(
        'texto-bare-descartado-post-fence',
        '',
        `Texto fuera de bloques \`\`\` descartado tras ${_matches.length} bloque(s) fenced — ${_remainder.length} caracteres ignorados.`,
        'backlog'
      );
    }
    return _matches;
  }
  // Sin match de fence — segundo caso: el texto completo es un solo objeto JSON limpio.
  // _looksLikeBareCheckpointJson solo verifica límites estructurales ({...}) — 2+ objetos
  // concatenados sin separador también cumplen esa forma (empiezan '{', terminan '}'), así que
  // se verifica además que el texto completo parsee como UN único objeto antes de comprometerse
  // a esta rama — si falla (caso típico: 2+ CHECKPOINTs concatenados sin separador), cae a
  // tier-3 en vez de tratar todo el texto como un solo bloque inválido. Bug encontrado por
  // harness de TKT2 antes de declarar en-revision — ver CHECKPOINT del TKT.
  if (_looksLikeBareCheckpointJson(text)) {
    try { JSON.parse(text.trim()); return [text.trim()]; }
    catch (e) { /* no es un único objeto válido — probablemente 2+ concatenados, cae a tier-3 */ }
  }
  // TKT2 (REQ ref_id CAEL-08061830-01, ref_id propio CAEL-08061830-03): tier-3 — último recurso. Solo se alcanza
  // cuando no hubo match de fence NI el texto completo es un único objeto limpio — ej. 2+
  // CHECKPOINTs bare concatenados, o un CHECKPOINT bare con prosa alrededor (caso real: paste
  // desde el chat de Claude, que pierde los fences y suele traer comentarios antes/después).
  // Capacidad que existió en TKT4/REQ-202607-054 y se retiró en REQ-202608-101 por su causa raíz
  // (scanner heurístico de profundidad de llaves, sin validar JSON real) — no se reintroduce esa
  // implementación. _extractBareCheckpointCandidates() usa JSON.parse real + gate title+project,
  // ver TKT1 para el detalle de por qué no reproduce INC-202607-066/068.
  const _bareCandidates = _extractBareCheckpointCandidates(text);
  if (_bareCandidates.length > 0) {
    const _matchedSpans = _bareCandidates.map(c => c.replace(/^```\n/, '').replace(/\n```$/, ''));
    let _consumed = 0;
    for (const _span of _matchedSpans) _consumed += _span.length;
    const _discarded = text.length - _consumed;
    if (_discarded > 0) {
      _blogLog(
        'texto-bare-descartado-tier3',
        '',
        `Texto fuera de los ${_bareCandidates.length} CHECKPOINT(s) bare detectados (sin fence) descartado — ${_discarded} caracteres ignorados (prosa/separadores entre bloques).`,
        'backlog'
      );
    }
    return _bareCandidates;
  }
  return [];
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
//   statusLabel, STATUS_LABELS, TG_PARSER_CONFIG.
//   TKT4 (REQ CAEL-0716-01): parsePasteStandalone/saveStandaloneCheckpoint/
//   openStandaloneCheckpoint/closeStandaloneCheckpoint eliminadas — cadena standalone-ckpt
//   inalcanzable desde la unificación del split view (TKT1-3, mismo REQ).
// Dependencias: locus-storage.js · locus-toast.js · locus-session-hora.js

import { renderStats, getItems, normalizeStatus, itemKind, _GEN2_TYPES } from './locus-backlog-core.js'; // TKT0-gen2: itemKind agregado · TKT1: _GEN2_TYPES (REQ-[pendiente-ID])
import { _isPlaceholderCode, _isNonCanonicalPlaceholder, applyPatchesFromTG, _assignPendingIds } from './locus-backlog-item.js'; // T-202606-089 AC-3 · TKT3 (REQ CAEL-0716-01): mergeBacklogFromTG retirado del import — sin consumidores directos en este archivo (dry-run per-keystroke ya se había removido antes; dry-run de batch removido en este TKT, ver _processIngestBatch). La persistencia real sigue viva vía _applyCheckpointBatch (locus-session-save.js), que la invoca internamente · TKT (ref_id CAEL-0725-03): _isNonCanonicalPlaceholder agregado — gap paralelo al ya corregido en locus-backlog-item.js (CAEL-0725-01), ver uso en el panel de validación de ingesta más abajo
import { showMergeDiffPanel } from './locus-backlog-merge.js'; // TKT3 (REQ CAEL-0716-01): chipTonesFromDiff retirado — _processIngestBatch ya no renderiza resumen de chips, invoca showMergeDiffPanel real (mismo panel que el flujo single). Sigue vivo en locus-backlog-merge.js (uso interno propio, L726) — no se elimina de ese archivo
import { renderBacklogList } from './locus-backlog-render.js';
// Fix INC-202608-094: mismo gap que en _doApplyMergeAndFinish (locus-session-save.js) —
// _onApplyBatch (más abajo) renderizaba backlog/stats pero nunca el tab Sprint.
import { renderSprintTab } from './locus-sprint.js';
import { renderAnalytics } from './locus-analytics-render.js'; // INC-202608-097: guard de refresco post-CHECKPOINT para tab Analytics — mismo patrón ya usado para 'sprint'
import { renderQIncPanel } from './locus-incidents-render.js'; // INC-202608-097: idem para subtab Q-INC (tab 'incidentes')
import { renderProyectos } from './locus-projects.js'; // INC-202608-097: idem para tab Proyectos
import { _ctrMergeFromItem } from './locus-contracts.js';
import { extractContextSections, extractDocUpdates, extractHtmlMapSections, mergeContextSections, mergeHtmlMapSections, processDocUpdate } from './locus-docs.js';
import { showCheckpointPanel } from './locus-sesiones-viz.js';
import { _checkStorageQuota, _mergeBacklogWithProject, saveSession, _applyCheckpointBatch } from './locus-session-save.js'; // T-202606-032: saveSession para auto-trigger | TKT4: _applyCheckpointBatch — persistencia de batch, invocada solo en el callback de confirmación de showMergeDiffPanel (no en tiempo de evaluación del módulo, mismo patrón ya usado por _mergeBacklogWithProject en esta misma línea)
import { _blogLog, _offlineQueuePush, getAI, getActiveProject, getActiveSprints, getActiveTracker, getSupabaseContext, save, saveImmediate, _upsertSprint, LOCUS_KEYS, CANONICAL_PROJECTS, _PREFIX_MAP, getInfraVersionData } from './locus-storage.js';
// T-202606-029: INFRA_VERSION_ACTIVE (constante) reemplazada por getInfraVersionActive() / setInfraVersionActive() — AC-4 de T-202606-027
import { showToast, toast } from './locus-toast.js';



import { esc, getCurrentTab } from './locus-ui-shell.js'; // Fix INC-202608-094: getCurrentTab agregado — guard de refresco del tab Sprint en _onApplyBatch

// T-202606-012: _INFRA_VERSION_ACTIVE eliminada — importada como INFRA_VERSION_ACTIVE desde locus-storage.js
// T-202606-029: INFRA_VERSION_ACTIVE (constante) migrada a getInfraVersionActive() / setInfraVersionActive() — AC-4 de T-202606-027 cerrado

// T-202606-210: Set en memoria para detección de CHECKPOINTs duplicados en sesión activa.
// Scope: por carga de página (sesión activa del navegador). Se resetea con recarga.
const _processedCheckpointHashes = new Set();

// Fix inline (Opción A — sesión de análisis del falso positivo de duplicado, triggered_by:
// hallazgo sobre T-202606-210): antes, parsePaste() registraba el hash del CHECKPOINT en
// _processedCheckpointHashes ANTES de invocar saveSession(id) — es decir, en el momento de
// intentar guardar, no en el momento de guardar de verdad. Si saveSession/_doSaveSession
// abortaban (sin proyecto seleccionado, mismatch de proyecto cancelado, o el founder cerraba
// el panel de Merge Diff sin confirmar — los tres casos dejan la sesión sin persistir en
// activeProj.sessions[]), el hash ya quedaba marcado como "procesado". Si el founder resolvía
// el bloqueo y volvía a pegar el mismo texto, el guard de duplicado disparaba un falso
// positivo — "ya fue procesado" — pese a que nunca se había guardado nada.
// _markCheckpointProcessed() se expone para que locus-session-save.js registre el hash desde
// _doApplyMergeAndFinish(), en el único punto donde la persistencia real ya ocurrió (justo
// después del push a activeProj.sessions vía _mutateSessions) — sin depender de si el merge
// de backlog posterior tiene éxito, porque la sesión en sí ya existe en ese momento.
export function _markCheckpointProcessed(text) {
  if (text) _processedCheckpointHashes.add(text.trim());
}

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
  'detected', 'resolved', 'closed',
  'escalated_to_prb', 'escalated_to_chg', 'descartado'
]);
// INC-202607-027: 'assigned'/'in_progress' retirados del Set — mismatch mensaje/lógica cerrado
// (el mensaje, _INCIDENT_STATUS_LIST, ya no los listaba desde TKT-202607-107 mod:142).
export const _INCIDENT_STATUS_LIST = 'detected · resolved · closed · escalated_to_prb · escalated_to_chg';
// TKT-PARSER-2b (REQ-[pendiente-ID]): vocabulario propio por tipo ITIL — __BR-Ecosystem §5.
// PRB es subconjunto de INC con estados propios (in_progress, root_cause_confirmed) que INC no
// tiene. KE ya no tiene ciclo propio — fusionado a PRB.root_cause_confirmed (infra_version 51).
// CHG usa vocabulario Scrum (pendiente/en-revision/done/descartado) — no pasa por estas constantes,
// se valida con _canonicalStatus, igual que TKT.
export const _VALID_PRB_STATUS = new Set([
  'detected', 'in_progress', 'root_cause_confirmed', 'resolved', 'closed', 'descartado'
]);
// INC-202607-028: 'root_cause_confirmed' agregado al Set — antes solo estaba en el mensaje
// (_PRB_STATUS_LIST, TKT-202607-107 mod:142). Mismatch mensaje/lógica cerrado.
export const _PRB_STATUS_LIST = 'detected · in_progress · root_cause_confirmed · resolved · closed';

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
    // Serializar items de vuelta a texto para discItems/tktItems/reqItems/incItems del objeto
    // devuelto — no se usan como fuente de datos, solo para display
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
    // INC-202607-069 (triggered_by: TKT-202607-172 · causa raíz corregida, no solo el síntoma):
    //   proximoPaso leía _parsed.next_step a nivel raíz — ubicación eliminada del schema desde
    //   infra_version 62 (__BR-Ecosystem §8: "next_step ahora vive exclusivamente dentro" de
    //   pendientes_y_siguiente_paso). Ese root-level read resolvía siempre a '' para todo
    //   CHECKPOINT del schema vigente — path muerto desde que infra_version 62 se activó, sin
    //   corrección hasta esta auditoría. Fix de raíz (BR-Execution §2 — sin retrocompatibilidad
    //   con ubicaciones de schema anteriores): un único cálculo, reusado por proximoPaso y
    //   nextStepRaw — elimina la duplicación en vez de mantener dos lecturas del mismo dato.
    const _resolvedNextStep = (_parsed.pendientes_y_siguiente_paso && typeof _parsed.pendientes_y_siguiente_paso === 'object' && !Array.isArray(_parsed.pendientes_y_siguiente_paso))
      ? (_parsed.pendientes_y_siguiente_paso.next_step || '')
      : '';
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
      proximoPaso:  _resolvedNextStep,
      // TKT-202607-172 (REQ-202607-058 · AC2/AC3, kill_criteria aprobado — módulo crítico):
      //   nextStepRaw/nextRoleRaw expuestos como campos propios además de proximoPaso — mismo
      //   valor que proximoPaso para nextStepRaw (ver _resolvedNextStep arriba, fix de
      //   INC-202607-069), distinto para nextRoleRaw (next_role de raíz del CHECKPOINT, campo
      //   ya existente en el schema, nunca antes extraído hacia el objeto ckpt). Ambos '' si
      //   ausentes — nunca undefined, mismo criterio que el resto de este objeto.
      nextStepRaw:  _resolvedNextStep,
      nextRoleRaw:  _parsed.next_role     || '',
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
    // TKT1 (PRB-202608-002, ref_id CAEL-08061530-02 · AC corregido en sesión — ver gap de
    // especificación devuelto a Cael: la redacción original condicionaba este mensaje a "falla
    // _looksLikeBareCheckpointJson", predicado que ya es true por construcción para llegar a esta
    // rama — nunca puede "fallar" aquí. La condición real que distingue un batch de 2+ CHECKPOINTs
    // pegados sin fence de cualquier otro JSON malformado/sin título es la que sigue: JSON.parse
    // falló O el objeto parseó pero sin "title", Y el texto contiene 2+ ocurrencias de la
    // subcadena "title" (una por cada CHECKPOINT concatenado). mod:178.
    const _titleOccurrences = (_trimmed.match(/title/g) || []).length;
    if (_titleOccurrences >= 2) {
      return {
        titulo: '', proyecto: '', rol: '', resumen: '', archivos: '',
        discItems: '', tktItems: '', reqItems: '', incItems: '',
        estado: '', decision: '', proximoPaso: '',
        contexto: '', bloqueantes: '', aprendizaje: '',
        isCheckpoint: true,
        _jsonParseError: `Detecté ${_titleOccurrences} CHECKPOINTs pegados sin separar. Envuelve cada uno en \`\`\` (tres backticks) para que Locus los detecte por separado.`,
        rawCounts: { DISC: 0, TKT: 0, REQ: 0, INC: 0 }
      };
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
// TKT1 (REQ CAEL-0727-01, ref_id CAEL-0727-02 · origen DISC-202607-055): campo `inlineFixes`
//   agregado — mismo patrón que docUpdates/finnObservations/finnRelease, leyendo ckpt._inlineFixes
//   (ya poblado por parseCheckpoint() para todo bloque, single o batch — sin cambio en la
//   extracción previa a este TKT). Antes de este campo, _extractCkptMeta() era el único de los
//   cuatro campos narrativos con dato real en el schema JSON (BR-Ecosystem §8) que no llegaba a
//   `metas` en absoluto — no solo se perdía en el flujo batch al aplicar (ver _onApplyBatch más
//   abajo), no existía ningún punto donde se propagara para batch. contract_update: sí — ver
//   contract_detail del TKT en el CHECKPOINT de entrega.
function _extractCkptMeta(ckpt) {
  const _c = ckpt || {};
  return {
    resumen:          _c.resumen     || '',
    aprendizaje:      _c.aprendizaje || '',
    bloqueantes:      _c.bloqueantes || '',
    decision:         _c.decision    || '',
    proximoPaso:      _c.proximoPaso || '',
    // TKT-202607-172 (REQ-202607-058 · AC2/AC3): campos nuevos — 13avo/14avo del objeto (antes
    //   11, contract_detail declara 13). Consumidos por locus-backlog-merge.js con precedencia
    //   nextStep > nextRole > proximoPaso para la línea "Siguiente" (AC4-6, ese archivo).
    nextStep:         _c.nextStepRaw || '',
    nextRole:         _c.nextRoleRaw || '',
    docUpdates:       _c._isJsonFormat ? (_c._rawDocUpdates || [])        : [],
    finnObservations: _c._isJsonFormat ? (_c._rawFinnObservations || null) : null,
    finnRelease:      _c._isJsonFormat ? (_c._rawFinnRelease || null)      : null,
    inlineFixes:      _c._isJsonFormat ? (_c._inlineFixes || [])          : [], // TKT1 (REQ CAEL-0727-01 · ref_id CAEL-0727-02)
    // TKT-202607-185 (REQ-202607-069 · origen DISC-202607-060): campo `archivosNombres` agregado —
    //   deriva de ckpt.archivos (string de nivel-sesión, campo Archivos: del CHECKPOINT, formato
    //   "nombre · mod:N · autor:X | nombre2 · mod:N · autor:Y") — NO del campo `archivos`
    //   por-ítem de TKT/REQ individual (array, BR-Ecosystem §8), que vive en items[] y no en el
    //   ckpt de nivel raíz. Sin precedente de parseo de este string en el archivo antes de este
    //   TKT — ckpt.archivos se guardaba crudo (ver L2100) y nunca se descomponía en partes.
    //   Nombre `archivosNombres` (no `archivos`) — decisión de Cael tras detectar que el flujo
    //   batch (_resolveCheckpointBatch, spread directo de esta función) y el flujo single
    //   (ai._parsed, ya con un `archivos` crudo preexistente de T-202606-070) quedaban con dos
    //   nombres distintos para el mismo dato. Se unifica aquí, en la fuente compartida, en vez de
    //   en cada call site — evita que un tercer flujo futuro reintroduzca la inconsistencia.
    archivosNombres:  _ckptArchivosToNames(_c.archivos),
    draft:            _c.draft === true,
    draftRaw:         _c.draftRaw,
    rol:              _c.rol    || '',
    titulo:           _c.titulo || ''
  };
}

// TKT-202607-185 (REQ-202607-069): parsea el string ckpt.archivos ("x.js · mod:3 · autor:Rune |
//   y.css · mod:2 · autor:Nova") a un array de solo nombres de archivo, para el chip
//   .diff-chip--files de #mdiff-summary-chips. Separador de segmentos '|', separador de
//   metadata dentro de cada segmento '·' — se conserva solo lo previo al primer '·'.
//   Función pura, sin estado compartido — mismo criterio que _extractCkptMeta (AC1).
function _ckptArchivosToNames(rawArchivos) {
  if (!rawArchivos || typeof rawArchivos !== 'string') return [];
  return rawArchivos
    .split('|')
    .map(seg => seg.split('·')[0].trim())
    .filter(name => name.length > 0);
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
  if (!panel || !errEl || !errMsgEl) return;
  panel.classList.remove('is-hidden');
  errEl.classList.remove('is-hidden');
  errMsgEl.innerHTML = msgHtml;
  if (warnEl) warnEl.classList.add('is-hidden');
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
  if (!panel || !warnEl || !warnMsgEl || !forceBtn) return;
  panel.classList.remove('is-hidden');
  warnEl.classList.remove('is-hidden');
  warnMsgEl.innerHTML = msgHtml;
  if (errEl) errEl.classList.add('is-hidden');
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
  if (panel) panel.classList.add('is-hidden');
  if (errEl) errEl.classList.add('is-hidden');
  if (errMsgEl) errMsgEl.innerHTML = '';
  if (warnEl) warnEl.classList.add('is-hidden');
  if (warnMsgEl) warnMsgEl.innerHTML = ''; // CAEL-26
}

// TKT-202608-291 (REQ-202608-119, origen: TKT-202608-277): _showIngestValidationResult(),
// _renderIngestBlockers() y _renderIngestResultItems() (CAEL-29/30/31) retiradas — sin call
// sites activos fuera de sus propias definiciones desde TKT-202608-277 (REQ-202608-112), que
// ya había retirado el único caller real en parsePaste(). _INGEST_BLOCKER_CODE_RE (usado
// exclusivamente por _renderIngestBlockers) retirada en el mismo movimiento — fix inline,
// mismo archivo, sin scope nuevo.
//
// TKT-202608-292 (REQ-202608-119): markup #ingest-validation-result retirado de index.html
// (mismo REQ) — inalcanzable desde TKT-202608-277, nunca poblado ni mostrado. Los tres
// getElementById('ingest-validation-result') guardados con `if (resultEl)` en
// _showIngestValidationError(), _showIngestValidationWarning() y _resetIngestValidationPanel()
// retirados en el mismo movimiento — referenciaban un nodo que ya no existe en el DOM.

export function parsePaste(id) {
  const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
  const text = ta ? ta.value : '';
  const ai = getAI(id); // B-202606-017: declarado al inicio de parsePaste — disponible en todos los branches (incluido el else de texto vacío, línea ~729)
  if (!ai) return;
  // T-202606-005: detectar CHECKPOINT via fence (con o sin especificador json) o JSON puro sin fence
  // INC-202607-066: heurístico de JSON sin fence extraído a _looksLikeBareCheckpointJson —
  // mismo comportamiento, ahora compartido con _splitCheckpointBlocks. Sin cambio en este call site.
  const isCheckpoint = /^\s*```(?:json)?\s*\{/.test(text) || _looksLikeBareCheckpointJson(text);

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
      // TKT2 (REQ-202608-107): loop inline retirado — reemplazado por _buildTgItemsFromParsed(),
      // la misma función que ya consume el path batch. Preserva sin duplicar: gate de type/status,
      // ITIL, en-revision sin sprint, REQ+bloqueado (creación nueva), REQ sin AC (TKT3 de este
      // mismo REQ), patch/patch-intencion con sus propios gates. rol-no-autorizado-bloqueado para
      // type:'patch' sobre REQ existente NO se replica aquí — ya enforced incondicionalmente en
      // applyPatchesFromTG() (locus-backlog-item.js), capa de persistencia común a ambos paths;
      // ver CHECKPOINT de entrega para el detalle de equivalencia verificada.
      let _itemError = null;
      const _draftGateTypes = ['REQ', 'TKT'];
      const _hasDraftGatedItem = _rawItems.some(_di => _di && _di.type !== 'patch' && _di.type !== 'patch-intencion' && _draftGateTypes.includes(_di.type));
      if (_hasDraftGatedItem && ckpt.draftRaw === undefined) {
        _itemError = 'Campo "draft" ausente — CHECKPOINT no aplicado. Declarar draft: true o false.';
      }
      let _builtResult = { tgItems: [], patchItems: [], patchIntencionItems: [], itemError: null };
      if (!_itemError) {
        _builtResult = _buildTgItemsFromParsed(ckpt, _rawItems);
        _itemError = _builtResult.itemError;
      }
      // TKT-202607-014 (dep-placeholder-ambiguo): señal exclusiva del path single — evaluada
      // aquí sobre tgItems ya construidos, sin duplicar dentro de _buildTgItemsFromParsed
      // (esa señal no forma parte del contrato de esa función, ver module-contracts).
      if (!_itemError) {
        const _newItemCount = _rawItems.filter(_ni => _ni.type !== 'patch' && _ni.type !== 'patch-intencion' && _isPlaceholderCode(_ni.code || '')).length;
        _builtResult.tgItems.forEach(_tg => {
          if (Array.isArray(_tg.dependsOn) && _tg.dependsOn.some(_dv => _dv === '[pendiente-ID]' || _isNonCanonicalPlaceholder(_dv)) && _newItemCount >= 2) {
            _blogLog('dep-placeholder-ambiguo', _tg.code || '[pendiente-ID]', (_tg.code || '[pendiente-ID]') + ' depends_on contiene [pendiente-ID] no resoluble — usar ref_id + title para referencias cruzadas (ver __BR-Ecosystem §4).', 'backlog');
          }
        });
      }
      if (_itemError) {
        window[`_itemsJsonError_${id}`] = _itemError;
        tgItems = [];
        delete window[`_patchItems_${id}`];
        delete window[`_patchIntencionItems_${id}`];
      } else {
        tgItems = _builtResult.tgItems;
        window[`_patchItems_${id}`] = _builtResult.patchItems;
        window[`_patchIntencionItems_${id}`] = _builtResult.patchIntencionItems;
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
  // TKT2 (REQ-202607-061 · depends_on: TKT-202607-176 done): mismo patrón que _pendingPatches
  // arriba — leer y limpiar el canal propio de patch-intencion acumulado por TKT-176, exponerlo
  // en ai._parsed simétrico a patchItems. Impacto lateral declarado: el consumidor real de
  // ai._parsed.patchItems para el path single es _applyCheckpointBatch/saveSession
  // (locus-session-save.js) — ese archivo no está adjunto en esta sesión, por lo que la llamada
  // a applyPatchesFromTG con opts.patchIntencionItems para el path single queda sin wiring final.
  // El dato ya queda disponible aquí para cuando ese archivo se adjunte — no se infiere ni se
  // escribe contenido de locus-session-save.js. Ver CHECKPOINT de esta sesión.
  const _pendingPatchIntencionItems = window[`_patchIntencionItems_${id}`] || [];
  delete window[`_patchIntencionItems_${id}`];
  // TKT1 (REQ CAEL-0718-01 · no_incluye): docUpdates/finnObservations/finnRelease/draft/draftRaw/
  //   rol se leían antes vía ternarios inline repetidos aquí — ahora vienen de _extractCkptMeta,
  //   misma función que alimenta `metas` en el flujo batch (_resolveCheckpointBatch, más abajo).
  //   Valores producidos idénticos a los ternarios previos — ver equivalencia en el CHECKPOINT de
  //   entrega. sprintProposal queda fuera del contrato de _extractCkptMeta (AC3) — sigue
  //   construyéndose inline aquí sin cambio, retiro completo pendiente de TKT4.
  const _ckptMetaShared = _extractCkptMeta(ckpt);
  ai._parsed = { title, summary, files, tgItems, patchItems: _pendingPatches, patchIntencionItems: _pendingPatchIntencionItems, isCheckpoint, nextStep, ckptProyecto: ckpt ? (ckpt.proyecto || '') : '', inlineFixes: _inlineFixes,
    // TKT-202607-172 (REQ-202607-058 · gap AC4-6 cerrado en esta sesión, hallazgo de Finn):
    //   _ckptMetaShared.nextStep/.nextRole se calculaban en esta misma función pero nunca se
    //   propagaban a ai._parsed — quedaban muertos. nextStepMeta/nextRoleMeta son el único canal
    //   por el que _doSaveSession (locus-session-save.js) puede construir ckptMeta.nextStep/
    //   .nextRole para el flujo single de showMergeDiffPanel (locus-backlog-merge.js), completando
    //   la precedencia nextStep > nextRole > proximoPaso también fuera del flujo batch. No
    //   reemplaza el campo `nextStep` existente arriba — ese sigue siendo ckpt.proximoPaso, fuente
    //   del panel de validación de ingesta (no_incluye del TKT, sin cambio).
    nextStepMeta:     _ckptMetaShared.nextStep,
    nextRoleMeta:     _ckptMetaShared.nextRole,
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
    archivos: ckpt ? (ckpt.archivos || '') : '', // string crudo — consumidor no confirmado, se conserva sin cambio
    // TKT-202607-185 (REQ-202607-069): archivosNombres — array ya parseado (_ckptMetaShared.archivosNombres,
    //   ver _ckptArchivosToNames arriba), mismo nombre que expone _extractCkptMeta directamente
    //   al flujo batch vía spread (_resolveCheckpointBatch) — sin alias local, naming unificado
    //   por decisión de Cael. Campo nuevo, no reemplaza `archivos` (crudo, T-202606-070) — evita
    //   romper el consumidor existente de esa key mientras no se confirme si tiene otro uso (no
    //   auditado en este TKT, fuera de scope). Nota: consumidor final del chip pendiente de
    //   definición de Nova — ver Conflicto CSS declarado en el CHECKPOINT de TKT-202607-185.
    archivosNombres: _ckptMetaShared.archivosNombres,
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

  const cc = document.getElementById('ingest-char-counter');
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
    delete window[`_depPlaceholderWarnSeen_${id}`]; // TKT-202607-131
    delete window[`_dupCheckpointWarnSeen_${id}`]; // Fix inline (triggered_by: sesión de análisis
    // del guard de CHECKPOINT duplicado, T-202606-210) — este flag quedó fuera de la lista de
    // limpieza junto con los otros 6 warn-keys de la misma familia. Sin este delete, tras un solo
    // "Continuar de todas formas" el warning de duplicado nunca volvía a dispararse para este
    // worker en lo que durara la sesión de navegador, aunque se vaciara el textarea y se pegara
    // el mismo CHECKPOINT una tercera vez. _processedCheckpointHashes (Set global, línea ~797) no
    // se toca aquí — es compartido entre workers, no por id; evaluar por separado si necesita su
    // propio mecanismo de expiración.
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

    // TKT-202607-131 (REQ-202607-041, origen DISC-202607-043): el fix bajo ref_id CAEL-0725-03
    // (bloque dep-placeholder-ambiguo, más arriba en este archivo) solo escribe a DocLog —
    // el AC de este TKT exige señal visible en el panel de validación de ingesta antes de
    // aplicar el CHECKPOINT. Mismo criterio de detección (_isNonCanonicalPlaceholder + literal
    // exacto '[pendiente-ID]'), reutilizado aquí sobre tgItems ya construidos — sin duplicar el
    // _blogLog existente, que se conserva para el registro en DocLog.
    // AC1 (happy path): variante no canónica en depends_on → warning visible, bloqueante hasta
    // "Continuar de todas formas" (mismo patrón warn-key que _doneWarnKey/_dupWarnKey).
    // AC2 (edge case sin regresión): el literal exacto '[pendiente-ID]' sigue disparando igual —
    // misma condición del some(), sin cambio de comportamiento previo.
    const _depPlaceholderWarnKey = `_depPlaceholderWarnSeen_${id}`;
    if (isCheckpoint && !window[_depPlaceholderWarnKey]) {
      const _depPlaceholderItems = tgItems.filter(it =>
        Array.isArray(it.dependsOn) &&
        it.dependsOn.some(v => v === '[pendiente-ID]' || _isNonCanonicalPlaceholder(v))
      );
      if (_depPlaceholderItems.length > 0) {
        const _codes = _depPlaceholderItems.map(it => `<code>${esc(it.code || '[pendiente-ID]')}</code>`).join(', ');
        _showIngestValidationWarning(
          `⚠ ${_depPlaceholderItems.length} ítem${_depPlaceholderItems.length !== 1 ? 's' : ''} con <code>depends_on</code> apuntando a un placeholder sin resolver: ${_codes}.<br><span class="paste-hint">Usa <code>ref_id</code> + <code>title</code> para referencias cruzadas del mismo bloque (ver __BR-Ecosystem §4) — o continúa si el destino ya tiene código real.</span>`,
          () => { window[_depPlaceholderWarnKey] = true; parsePaste(id); }
        );
        return;
      }
    }
    if (window[_depPlaceholderWarnKey]) delete window[_depPlaceholderWarnKey];

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

    // TKT2 (REQ-202607-043 · depends_on TKT-202607-137): visibilidad en el panel de ingesta del
    // mismo rechazo que TKT1 aplica silenciosamente en storage (applyPatchesFromTG,
    // locus-backlog-item.js) — un patch REQ→done con TKT hijo no done/descartado debe verse
    // ANTES de confirmar, no solo descubrirse en DocLog después de aplicar. Mismo criterio de
    // pre-escaneo de batch que TKT1: el status proyectado de un TKT hijo dentro del mismo array
    // de items tiene precedencia sobre su status ya persistido en backlog. Bloqueante — mismo
    // patrón que el check de Proyecto no reconocido (arriba): _showIngestValidationError + return,
    // sin botón "Continuar de todas formas".
    {
      const _reqDonePatches = _pendingPatches.filter(p =>
        p && p.code && !_isPlaceholderCode(p.code) && _canonicalStatus(p.status, 'REQ') === 'done'
      ).filter(p => {
        const _target = (getItems() || []).find(x => x.code === p.code);
        return !!_target && itemKind(_target) === 'REQ';
      });
      if (_reqDonePatches.length > 0) {
        // Mapa de status proyectado del batch — mismo mecanismo que _projectedStatus en TKT1:
        // un TKT-patch o un TKT nuevo del mismo array tiene precedencia sobre el status persistido.
        const _projected = new Map();
        _pendingPatches.forEach(p => {
          if (!p || !p.code) return;
          const _c = _canonicalStatus(p.status, 'TKT');
          if (_c) _projected.set(p.code, _c);
        });
        tgItems.forEach(it => { if (it.code) _projected.set(it.code, it.status); });

        const _allExisting = getItems() || [];
        const _rows = [];
        _reqDonePatches.forEach(reqPatch => {
          const _childMap = new Map();
          _allExisting.forEach(x => { if (itemKind(x) === 'TKT' && x.parentId === reqPatch.code) _childMap.set(x.code, x); });
          tgItems.forEach(it => { if (itemKind(it) === 'TKT' && it.parentId === reqPatch.code) _childMap.set(it.code, it); });
          const _pendingChild = Array.from(_childMap.values()).find(c => {
            const _proj = _projected.has(c.code) ? _projected.get(c.code) : c.status;
            return !['done', 'descartado'].includes(_proj);
          });
          if (_pendingChild) {
            const _projStatus = _projected.has(_pendingChild.code) ? _projected.get(_pendingChild.code) : _pendingChild.status;
            // Una oración completa por REQ — separadas con <br>, nunca fusionadas en un mensaje
            // agregado (AC edge case TKT2). Mismo patrón visual que el resto de checks bloqueantes
            // de _showIngestValidationError: <code> para códigos, <strong> para el valor observado.
            _rows.push(`<code>${esc(reqPatch.code)}</code> no puede marcarse done — <code>${esc(_pendingChild.code)}</code> (hijo) está en <strong>${esc(_projStatus)}</strong>, no en done ni descartado.`);
          }
        });
        if (_rows.length > 0) {
          _showIngestValidationError(`⛔ ${_rows.length} REQ no puede${_rows.length !== 1 ? 'n' : ''} marcarse done — TKT hijo pendiente:<br>${_rows.join('<br>')}`);
          return;
        }
      }
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
    // Fix inline (Opción A): _processedCheckpointHashes.add() removido de aquí — el registro
    // del hash se movió a _markCheckpointProcessed(), invocado desde _doApplyMergeAndFinish()
    // (locus-session-save.js) en el momento real de persistencia. Ver comentario junto a
    // _markCheckpointProcessed() para el detalle completo del falso positivo que esto corrige.
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

  // TKT-202608-277 (REQ-202608-112, AC1): _showIngestValidationResult() retirada de este call
  // site. Con el gate de _routeParse() ampliado a >=1 bloque (TKT-202608-276), parsePaste() solo
  // se alcanza cuando _splitCheckpointBlocks(ta.value).length === 0 — y en ese caso title/summary
  // nunca quedan poblados (parseCheckpoint() solo produce titulo/resumen no vacíos por la misma
  // vía estructural que _splitCheckpointBlocks usa para contar bloques: fence completo o JSON
  // bare completo — ver isCheckpoint/_looksLikeBareCheckpointJson arriba). El bloque
  // `if (title || summary)` quedaba estructuralmente inalcanzable — TKT-202608-292 (REQ-202608-119)
  // retiró el reset de #ingest-validation-result en este call site junto con el nodo DOM, que
  // ya no existe.
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

// TKT-202608-235 (REQ-202608-089, sprint PP-S-26): extrae `title` (truncable en el render) y un
//   resumen de `files` ("archivo · mod:N", solo el primer segmento) de un bloque de texto crudo
//   ya separado por _splitCheckpointBlocks — sin invocar parseCheckpoint/_parseBatchBlock. Esta
//   función es deliberadamente más liviana que la validación real (sin gate de draft, sin
//   _jsonParseError, sin _extractCkptMeta) porque corre en cada keystroke/paste vía
//   _renderIngestBlockPreview() (AC "happy path") — el único propósito es un title truncado y un
//   subtítulo de archivo para el preview visual, no persistencia ni aval de founder.
//   Bloque que no parsea como JSON (fence sin cerrar, prosa suelta capturada por
//   _extractBareJsonBlocks, etc.) devuelve null — no es "bloque válido" a efectos de este AC y no
//   genera fila de preview (AC "estado vacío" se cumple por composición: 0 bloques válidos → []).
//   Función pura, sin efectos laterales — mismo criterio de pureza que _extractCkptMeta/
//   _ckptArchivosToNames. contract_update: no — función nueva, sin consumidores externos.
function _ingestPreviewMeta(blockText) {
  let parsed;
  try {
    // Fence-strip: bloques fenced de _splitCheckpointBlocks conservan ``` / ```json — JSON.parse
    // no tolera el fence. Mismo strip que ya aplica el path de parseCheckpoint sobre bloques
    // fenced antes de intentar el parse.
    const _stripped = blockText.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
    parsed = JSON.parse(_stripped);
  } catch (e) {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || typeof parsed.title !== 'string' || !parsed.title.trim()) {
    return null; // sin title no hay nada verificable como CHECKPOINT — mismo gate de BR-Ecosystem §8
  }
  // `files` es el campo de nivel-sesión del CHECKPOINT (BR-Ecosystem §8 — "nombre · mod:N ·
  // autor:Rol | ..."), no el `archivos` por-ítem de TKT/REQ individual dentro de items[]. Mismo
  // campo fuente que _ckptArchivosToNames ya consume (ahí vía ckpt.archivos post-parseCheckpoint,
  // acá directo del JSON crudo porque este helper no pasa por parseCheckpoint).
  let meta = '';
  if (typeof parsed.files === 'string' && parsed.files.trim()) {
    const _parts = parsed.files.split('|')[0].split('·').map(s => s.trim());
    if (_parts[0]) meta = _parts[1] ? `${_parts[0]} · ${_parts[1]}` : _parts[0];
  }
  return { title: parsed.title.trim(), meta };
}

// TKT-202608-235 (REQ-202608-089, sprint PP-S-26 · design_intent: ingest_block_preview_mockup,
//   aprobado por founder): renderiza .ingest-block-preview* — entregable visual de Nova
//   (locus-modals-base.css mod:25). Contenido 100% dinámico, sin shell estático (BR-Execution §5
//   — el contenedor entero se genera/destruye, no se togglea con classList.add/remove is-hidden,
//   por decisión explícita de Nova declarada en su entregable). Monta sobre
//   #ingest-block-preview-anchor — punto de anclaje estático que debe existir en el modal de
//   ingesta junto a #ingest-block-count (index.html no está adjunto en esta sesión — ver bloqueo
//   declarado en el CHECKPOINT de este TKT). Deriva los bloques de la misma fuente que
//   _updateIngestBlockCount() (_splitCheckpointBlocks(ta.value)) — no duplica la detección.
export function _renderIngestBlockPreview() {
  const _anchor = document.getElementById('ingest-block-preview-anchor');
  if (!_anchor) return; // anclaje no presente en este modal/vista — no-op, mismo criterio que _updateIngestBlockCount
  const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
  const _blocks = ta ? _splitCheckpointBlocks(ta.value) : [];
  const _metas = _blocks.map(_ingestPreviewMeta).filter(Boolean);

  if (!_metas.length) {
    // AC "estado vacío" — 0 bloques válidos → ninguna fila, ningún contenedor fantasma.
    _anchor.innerHTML = '';
    return;
  }

  _anchor.innerHTML = `
    <div class="ingest-block-preview">
      <div class="ingest-block-preview-label">preview de bloques detectados</div>
      <div class="ingest-block-preview-list">
        ${_metas.map(m => {
          const _short = m.title.length > 60 ? m.title.slice(0, 60) + '…' : m.title;
          return `
            <div class="ingest-block-preview-item">
              <i class="ti ti-file-text ingest-block-preview-icon"></i>
              <div class="ingest-block-preview-text">
                <div class="ingest-block-preview-title" title="${esc(m.title)}">${esc(_short)}</div>
                ${m.meta ? `<div class="ingest-block-preview-meta">${esc(m.meta)}</div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
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
// TKT-[pendiente-ID] (INC — duplicación de ítem tras batch + Quick Capture, causa raíz
// confirmada): guard de reentrancia. El navegador dispara 'paste' e 'input' para la misma
// acción de pegado sobre #ingest-ta — handleInput (inmediato) y handlePaste (diferido 150ms,
// ver más abajo) ambos llaman _routeParse(), que para 2+ bloques delegaba a
// _processIngestBatch() sin guard propio (riesgo ya documentado antes de este fix — comentario
// retirado, absorbido por este bloque). Sin este guard, el mismo contenido de #ingest-ta
// disparaba showMergeDiffPanel() dos veces sobre el shell compartido (#merge-diff-overlay) —
// un solo click en "Aplicar" ejecutaba _applyCheckpointBatch() dos veces con el mismo batch,
// asignando dos códigos reales distintos al mismo ítem. Fix complementario (defensa en
// profundidad, no sustituto): locus-backlog-merge.js — showMergeDiffPanel() ahora aborta su
// _mdiffPanelAC previo y scopea los listeners de los tres botones al mismo AbortController, así
// que aunque el panel se reabra por cualquier otro motivo, los listeners de la apertura anterior
// ya no sobreviven. _BATCH_ROUTE_DEBOUNCE_MS cubre ampliamente la ventana de ~150ms entre ambos
// eventos del navegador sin bloquear una reprocesión legítima del mismo texto minutos después.
let _lastBatchRouteText = null;
let _lastBatchRouteTs = 0;
const _BATCH_ROUTE_DEBOUNCE_MS = 1000;

function _routeParse(id, ta) {
  // TKT-202608-276 (REQ-202608-112, AC1): gate ampliado de >1 a >=1 — 1 solo bloque ahora
  // rutea al mismo camino que 2+ (_processIngestBatch → showMergeDiffPanel), en vez de caer
  // a parsePaste() en su modo de persistencia directa. Comportamiento de 2+ bloques sin
  // cambio (AC2) — el gate anterior ya cubría ese caso, este cambio solo extiende el límite
  // inferior de 2 a 1.
  if (ta && _splitCheckpointBlocks(ta.value).length >= 1) {
    const _now = Date.now();
    if (ta.value === _lastBatchRouteText && (_now - _lastBatchRouteTs) < _BATCH_ROUTE_DEBOUNCE_MS) {
      return true; // ya se ruteó a batch para este mismo contenido — evita doble _processIngestBatch()
    }
    _lastBatchRouteText = ta.value;
    _lastBatchRouteTs = _now;
    _processIngestBatch();
    _updateIngestBlockCount(); // TKT-202607-041 AC1
    _renderIngestBlockPreview(); // TKT-202608-235
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
        _renderIngestBlockPreview(); // TKT-202608-235
        // TKT-202607-211: lookup a 'hora-'+id retirado — DISC-202607-080, elemento sin card real desde migración
        // a Quick Capture (quick-hora) / blind exhaust (bexhaust-hora-{id}), ambos patrones distintos.
        // T-202606-155: _tryIngestSprintProposal removido del pre-DIFF — Step 0 en showMergeDiffPanel es el gate
      }, 150);
      return;
    }
    if (_routeParse(id, ta)) return; // TKT CAEL-0720-23: 2+ bloques → batch, corta el path single
    parsePaste(id);
    _updateIngestBlockCount(); // TKT2 (REQ CAEL-01) AC1
    _renderIngestBlockPreview(); // TKT-202608-235
    // TKT-202607-211: lookup a 'hora-'+id retirado — DISC-202607-080, elemento sin card real desde migración
    // a Quick Capture (quick-hora) / blind exhaust (bexhaust-hora-{id}), ambos patrones distintos.
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
  _renderIngestBlockPreview(); // TKT-202608-235
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
  // TKT2 (REQ-202607-061 · depends_on: TKT-202607-176 done): patchIntencionItems agregado a la
  // destructuración — _resolveCheckpointBatch ya lo retorna desde TKT1 (mismo criterio de
  // propagación que patchItems, ver comentario en _result más abajo en este archivo), pero no
  // se leía en este call site — mismo patrón de gap ya corregido para patchItems en TKT2
  // (REQ-[pendiente-ID] · CAEL-05, ver comentario en la línea de _result).
  const { tgItems, patchItems, patchIntencionItems, skipped, metas } = _resolveCheckpointBatch(rawBlocks, syntheticSessId);

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
  // TKT-202608-276 (REQ-202608-112, AC3): batch de un único bloque, ese bloque inválido
  // (JSON malformado o sin 'title') — mismo caso que antes de este REQ resolvía parsePaste()
  // directo con _showIngestValidationError(). Con el gate de _routeParse ampliado a >=1
  // (AC1), este batch de tamaño 1 ahora llega aquí en vez de a parsePaste() — sin este check,
  // caería al toast genérico 'Sin ítems para procesar en este batch' de la rama de abajo,
  // perdiendo el detalle accionable del error real (r.error, ya construido por
  // _parseBatchBlock/skipped). Exclusivo de batch de tamaño 1 — con 2+ bloques, un bloque
  // inválido entre válidos sigue cayendo al aviso ya existente (_blogLog +
  // 'checkpoint-batch-invalido'), sin cambio (AC2).
  const _singleInvalid = rawBlocks.length === 1 && skipped.length === 1 && skipped[0].type === 'invalid';
  if (_singleInvalid && !tgItems.length && !(patchItems && patchItems.length)) {
    _showIngestValidationError(`&#9940; ${esc(skipped[0].reason)}`);
    return;
  }
  if (!tgItems.length && !(patchItems && patchItems.length)) {
    // TKT-202608-234 (REQ-202608-089): distingue un batch de CHECKPOINTs válidos sin ítems
    // (items:[] en todos los bloques — solo trazabilidad de archivo, sin doc_updates ni
    // sprint_proposal que hayan sobrevivido hasta aquí) de un batch donde ningún bloque llegó
    // a ser válido. `metas` lleva exactamente una entrada por bloque válido (ver
    // _resolveCheckpointBatch, Paso 3) — metas.length>0 con skipped.length===0 es la única
    // combinación posible para llegar a esta rama sin que haya bloques rechazados/inválidos.
    // No cambia el mensaje de bloqueo existente (JSON malformado/sin title, o rechazo por
    // [tmp:slug] duplicado) — esos casos siguen cayendo al warning genérico de abajo, sin
    // alteración.
    // Fix INC-[pendiente-ID] (gap de especificación de TKT-202608-234, hallazgo de sesión de
    // soporte 2026-08-10): el comentario original de TKT-202608-234 asumía "sin doc_updates ni
    // sprint_proposal que hayan sobrevivido hasta aquí" para todo batch con items:[] en todos
    // los bloques, pero el código nunca verificaba esa condición — solo la infería. Un batch de
    // items:[] con doc_updates poblado (ej. "DOC-UPDATE aplicado — [doc].md" sin cambios de
    // backlog) tomaba esta rama, mostraba el toast de éxito y retornaba sin invocar
    // processDocUpdate() en ningún punto — el doc_update se perdía en silencio, nunca llegaba a
    // la cola de DOC-UPDATEs pendientes de Locus. _onApplyBatch (más abajo, dentro del callback
    // de showMergeDiffPanel) sí procesa m.docUpdates correctamente, pero solo se alcanza cuando
    // hay tgItems/patchItems — este guard temprano nunca llega ahí. Fix: antes de tomar la rama
    // de éxito silencioso, se recorren metas buscando docUpdates con contenido; si los hay, se
    // procesan aquí mismo vía processDocUpdate() (mismo mecanismo que _onApplyBatch, sin
    // duplicar lógica de merge/patch — no aplica a items del backlog, solo a docs) y el toast
    // final refleja el conteo real en vez del texto genérico "solo trazabilidad de archivo".
    const _docUpdatesInMetas = [];
    (metas || []).forEach(m => {
      if (m && Array.isArray(m.docUpdates) && m.docUpdates.length) _docUpdatesInMetas.push(...m.docUpdates.map(u => ({ update: u, title: m.titulo || '' })));
    });
    if (metas.length && !skipped.length) {
      if (_docUpdatesInMetas.length) {
        let _applied = 0;
        _docUpdatesInMetas.forEach(({ update, title }) => {
          const { conflicto, msg } = processDocUpdate(update, title);
          if (conflicto && msg) showToast('warn', msg);
          _applied++;
        });
        showToast('success', `${_applied} doc_update${_applied !== 1 ? 's' : ''} registrado${_applied !== 1 ? 's' : ''} · sin cambios de backlog`);
        ta.value = ''; // batch consumido — mismo criterio que la rama con ítems (línea ~2783)
        return;
      }
      showToast('success', `${metas.length} bloque${metas.length !== 1 ? 's' : ''} válido${metas.length !== 1 ? 's' : ''} — sin cambios de backlog, solo trazabilidad de archivo`);
      return;
    }
    showToast('warning', 'Sin ítems para procesar en este batch.');
    return;
  }

  const activeProj = getActiveProject();
  if (!activeProj) {
    showToast('warning', '⚠ Selecciona un proyecto antes de procesar el batch.');
    return;
  }

  // TKT3 (REQ-202607-046, depends_on TKT-202607-145): mecanismo de acoplamiento por CSS
  // retirado de este call site — showMergeDiffPanel (locus-backlog-merge.js, TKT2) abre
  // #modal-split-shell directamente, sin necesitar que este flujo batch coordine el overlay
  // de diff contra el de ingesta primero. La clase CSS que aplicaba ese acoplamiento ya no
  // existe (retirada por Nova en TKT1) ni tiene consumidores JS — mismo fix ya aplicado en
  // _doSaveSession (locus-session-save.js) y en locus-sesiones.js (TKT-202607-145 AC2). Guard
  // de proyecto activo (líneas ~2269-2273) sin cambio — este bloque solo eliminaba ese código
  // de coordinación, no la condición de gate.

  // AC2 — Aplicar del batch: mismo patrón que probaba _gatedDoApplyBatch (saveStandaloneCheckpoint,
  // eliminada por TKT4) — _applyCheckpointBatch persiste vía mergeBacklogFromTG(dryRun:false)
  // internamente; los patches del batch se encadenan después usando slugMap/refIdTitleMap del
  // mergeResult, mismo criterio que el flujo single.
  const _onApplyBatch = async () => {
    let _batchMergeResult;
    try {
      // FIX (sesión 2026-07-24, gate req-sin-tkt vs reparenting): patchItems propagado — ya
      // estaba en scope (destructurado de _resolveCheckpointBatch más arriba) pero no se pasaba.
      // Ver comentario completo en mergeBacklogFromTG (locus-backlog-item.js).
      _batchMergeResult = await _applyCheckpointBatch(tgItems, patchItems);
    } catch (err) {
      showToast('error', '✗ No se pudo aplicar el batch');
      return;
    }
    // TKT2 (REQ-202607-061): guard extendido — un batch puede traer solo instrucciones
    // patch-intencion sin ningún patch ordinario (ej. Cael corrigiendo intencion de un REQ tras
    // Pausa de Ciclo, sin otro trabajo en el mismo bloque). Sin este OR, ese batch nunca
    // invocaba applyPatchesFromTG y patchIntencionItems quedaba sin aplicar en silencio.
    if (((patchItems && patchItems.length) || (patchIntencionItems && patchIntencionItems.length)) && _batchMergeResult) {
      // INC-202607-031 (triggered_by REQ-202607-033): ckptHeaderRole:'' hardcodeado
      // reemplazado por roleByIdx (Map<idx, role>) — causa raíz confirmada: este call site
      // pasaba un único role vacío para todos los patches del batch, sin importar cuántos
      // bloques trajera ni qué role declarara cada uno. El guard rol-no-autorizado-done
      // (locus-backlog-item.js) rechazaba sistemáticamente cualquier patch status:done sobre
      // REQ en modo batch — incluso con el bloque de origen declarando role:'QA · Finn'
      // correctamente. metas ya lleva { rol, idx } por bloque válido (_extractCkptMeta +
      // idx: b.idx, ver _resolveCheckpointBatch) — se construye el Map directamente desde ahí,
      // sin re-parsear nada. Sin cambio de firma pública de applyPatchesFromTG.
      const _roleByIdx = new Map();
      (metas || []).forEach(m => { if (m && m.idx !== undefined) _roleByIdx.set(m.idx, m.rol || ''); });
      applyPatchesFromTG(patchItems, syntheticSessId, { slugMap: _batchMergeResult.slugMap, refIdTitleMap: _batchMergeResult.refIdTitleMap, roleByIdx: _roleByIdx, patchIntencionItems: patchIntencionItems || [] });
    }

    // TKT1 (REQ CAEL-0727-01, ref_id CAEL-0727-02 · origen DISC-202607-055): registrar
    // doc_updates/inline_fix/finn_release de cada bloque del batch al momento de aplicar —
    // antes de este TKT, `metas` (poblado por _resolveCheckpointBatch desde REQ CAEL-0718-01)
    // llegaba a showMergeDiffPanel (más abajo, para el preview del DIFF) pero ninguno de los
    // tres campos sobrevivía hasta este punto — se perdían en silencio al confirmar, mismo
    // síntoma que el flujo single (_doApplyMergeAndFinish, locus-session-save.js) no tiene.
    // doc_updates: registrado vía processDocUpdate() por entrada — mismo mecanismo que el flujo
    // single usa para su propio parsed.docUpdates. inline_fix: agregado a showCheckpointPanel()
    // para visibilidad al founder — mismo panel que usa el flujo single ("Locus lo indexa para
    // trazabilidad", __BR-Core §7); el batch no crea un newSess por bloque, así que este panel es
    // el único punto de indexación disponible aquí, no una sesión individual. finn_release: no
    // gana mecanismo de persistencia nuevo en este TKT — su tarjeta en el DIFF panel depende de
    // que showMergeDiffPanel (locus-backlog-merge.js) lea metas[i].finnRelease, wireado desde
    // REQ CAEL-0718-01/TKT-078 pero no verificado en esta sesión (archivo no adjunto, fuera de
    // `archivos` de este TKT) — se cuenta igual para el toast de conteo, independiente de si ese
    // archivo ya lo renderiza o no.
    let _docUpdatesApplied = 0;
    const _allInlineFixes = [];
    let _finnReleaseCount = 0;
    (metas || []).forEach(m => {
      if (!m) return;
      const _blockTitle = m.titulo || '';
      (m.docUpdates || []).forEach(update => {
        const { conflicto, msg } = processDocUpdate(update, _blockTitle);
        if (conflicto && msg) showToast('warn', msg);
        _docUpdatesApplied++;
      });
      if (Array.isArray(m.inlineFixes) && m.inlineFixes.length) _allInlineFixes.push(...m.inlineFixes);
      if (m.finnRelease) _finnReleaseCount++;
    });
    if (_allInlineFixes.length) {
      showCheckpointPanel({ ...(_batchMergeResult || {}), inlineFixes: _allInlineFixes });
    }
    const _narrativeTotal = _docUpdatesApplied + _allInlineFixes.length + _finnReleaseCount;
    if (_narrativeTotal) {
      const _parts = [];
      if (_docUpdatesApplied)     _parts.push(`${_docUpdatesApplied} doc_update${_docUpdatesApplied !== 1 ? 's' : ''}`);
      if (_allInlineFixes.length) _parts.push(`${_allInlineFixes.length} inline_fix${_allInlineFixes.length !== 1 ? 'es' : ''}`);
      if (_finnReleaseCount)      _parts.push(`${_finnReleaseCount} finn_release`);
      showToast('info', `${_parts.join(' · ')} registrado${_narrativeTotal !== 1 ? 's' : ''} del batch`);
    }

    renderBacklogList();
    renderStats();
    // Fix INC-202608-094: mismo gap que en _doApplyMergeAndFinish — el batch aplicaba
    // correctamente a ITEMS/Supabase pero el tab Sprint no se refrescaba hasta cambio
    // de tab o reload cuando era el tab activo al confirmar el batch.
    if (getCurrentTab() === 'sprint') { renderSprintTab(); }
    // Fix INC-202608-097: mismo gap que INC-202608-094 (tab Sprint) en el path batch —
    // Analytics, Q-INC (tab 'incidentes') y Proyectos no se refrescaban tras aplicar un batch
    // de CHECKPOINTs si estaban activos. Mismo criterio que el guard de _doApplyMergeAndFinish
    // (locus-session-save.js mod:88) — sin dirty-flag propio, se llama directo.
    if (getCurrentTab() === 'analytics') { renderAnalytics(); }
    if (getCurrentTab() === 'incidentes') { renderQIncPanel(); }
    if (getCurrentTab() === 'proyectos') { renderProyectos(); }
    window.dispatchEvent(new CustomEvent('shell:render-tracker'));
    const _totalApplied = tgItems.length + (patchItems ? patchItems.length : 0);
    // TKT-202608-234 (REQ-202608-089, AC edge case): cuando el batch mezcla bloques que
    // aportaron ítems con bloques válidos sin ítems propios (items:[] — trazabilidad de
    // archivo), el mensaje distingue ambos en vez de solo contar lo aplicado. `metas` lleva
    // idx por bloque válido (ver _resolveCheckpointBatch); un bloque "sin cambios" es aquel
    // cuyo idx no aparece en ningún ítem combinado de tgItems/patchItems.
    const _appliedIdxSet = new Set([...tgItems, ...(patchItems || [])].map(it => it.idx));
    const _blocksWithoutChanges = (metas || []).filter(m => m && !_appliedIdxSet.has(m.idx)).length;
    const _successMsg = _blocksWithoutChanges
      ? `${_totalApplied} aplicado${_totalApplied !== 1 ? 's' : ''} · ${_blocksWithoutChanges} sin cambios de backlog`
      : `✓ ${_totalApplied} ítem${_totalApplied !== 1 ? 's' : ''} aplicado${_totalApplied !== 1 ? 's' : ''} al backlog`;
    showToast('success', _successMsg);
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
// TKT-202608-278 (REQ-202608-113, origen_disc DISC-202608-115): _buildTgItemsFromParsed
// coaccionaba no_incluye a [] en silencio cuando el valor entrante no era ya un array JS —
// __BR-Ecosystem §8 muestra no_incluye como valor escalar de ejemplo en el schema, sin
// declarar que debe ser array, y module-contracts mod:104 ya fijaba array como forma canónica
// de storage. Normaliza: array pasa igual · string con comas se divide y se trimea · string
// sin comas se envuelve en array de 1 · cualquier otro tipo con contenido se coacciona a []
// pero deja rastro en DocLog · vacío/ausente/null/undefined/"" se coacciona a [] sin ruido.
function _normalizeNoIncluye(raw, itemCode) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const _trimmed = raw.trim();
    if (_trimmed === '') return [];
    return _trimmed.split(',').map(s => s.trim()).filter(s => s !== '');
  }
  if (raw !== null && raw !== undefined && raw !== '') {
    _blogLog(
      'no_incluye-formato-invalido',
      itemCode || '[pendiente-ID]',
      `no_incluye con formato inválido (no string, no array) — coaccionado a []. Valor crudo: ${JSON.stringify(raw)}`,
      'backlog'
    );
  }
  return [];
}

function _buildTgItemsFromParsed(ckpt, parsedJSON) {
  const _validTypes    = _GEN2_TYPES;
  const _validStatuses = _VALID_STATUSES_GATE;
  const tgItems = [];
  const patchItems = [];
  const patchIntencionItems = []; // TKT1 (REQ-202607-061): canal propio, separado de patchItems
  let itemError = null;
  // TKT3 (REQ-202608-107): gate de REQ sin AC — portado desde el loop inline de parsePaste
  // (_rsNoAc, retirado en TKT2 de este mismo REQ). BR-Ecosystem §5 + BR-Core §8 regla dura:
  // "R sin AC rechazado por Locus". Acumula todos los REQ sin AC del batch antes de emitir el
  // error consolidado — no interrumpe el loop en el primero, mismo criterio que _rsNoAc tenía.
  const _reqsNoAc = [];

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
    // TKT1 (REQ-202607-061): patch-intencion — mismo criterio que el path single (parseCheckpoint,
    // ver comentario ahí). Canal propio (patchIntencionItems), separado de patchItems.
    if (it.type === 'patch-intencion') {
      if (!it.code || _isPlaceholderCode(it.code)) {
        _blogLog('patch-ignorado', it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (it.code || '(vacío)'), 'backlog');
        showToast('warn', `Patch descartado: código placeholder no patcheable — ${it.code || '(vacío)'}. Usa el código real asignado por Locus.`);
      } else if (!it.founder_confirmado || typeof it.founder_confirmado !== 'string' || it.founder_confirmado.trim() === '') {
        _blogLog('patch-intencion-sin-confirmacion', it.code, 'patch-intencion sin founder_confirmado — no aplicado. Declarar confirmación explícita del founder.', 'backlog');
        showToast('warn', `patch-intencion descartado: falta founder_confirmado — ${it.code}.`);
      } else {
        patchIntencionItems.push(it);
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
          no_incluye:    _normalizeNoIncluye(it.no_incluye, it.code),
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
    // TKT3 (REQ-202608-107): REQ sin AC — mismo punto relativo que ocupaba en el loop inline
    // de parsePaste (después del bloque de REQ+bloqueado, antes de la construcción general del
    // ítem). Un REQ bloqueado con rol no autorizado ya salió por `continue` en el bloque de
    // arriba y nunca llega aquí — mismo orden que parsePaste tenía para ese caso combinado.
    if (itemKind(it) === 'REQ' && (!Array.isArray(it.ac) || it.ac.length === 0)) {
      _reqsNoAc.push(`R ${it.code || '[pendiente-ID]'} "${it.title || it.desc || ''}"`);
      continue;
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
      no_incluye:    _normalizeNoIncluye(it.no_incluye, it.code),
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
    // TKT1 (REQ-202608-107): alerta DocLog si T tiene contract_update: 'sí' y doc_updates
    // ausente o vacío — mismo check que ya existía solo en parsePaste (~L2224-2240, path
    // single). Consolida el gate para que el path batch dispare la misma alerta. AC-1..AC-5
    // idénticos al comentario original.
    if (itemKind(it) === 'TKT' && (it.contract_update || '').toLowerCase() === 'sí') {
      const _hasDocUpdates3 = Array.isArray(ckpt._rawDocUpdates) && ckpt._rawDocUpdates.length > 0;
      if (!_hasDocUpdates3) {
        _blogLog(
          'contract-update-sin-doc-update',
          it.code || '[pendiente-ID]',
          `contract_update declarado sí — DOC-UPDATE de module-contracts ausente en CHECKPOINT ${ckpt.titulo || ''}`,
          'backlog'
        );
      }
    }
    _normalizeSprint(tgItems[tgItems.length - 1], tgItems);
  }

  // TKT3 (REQ-202608-107): consolidar REQ sin AC — mismo criterio que el bloque equivalente
  // de parsePaste (T-202606-030 fix AC-2+AC-3). Solo se emite si ningún otro itemError ya
  // interrumpió el loop antes — un break-type error tiene precedencia.
  if (!itemError && _reqsNoAc.length > 0) {
    const _ckptOrigen3 = ckpt.titulo || '';
    itemError = `CHECKPOINT bloqueado: ${_reqsNoAc.join(' · ')} no tiene${_reqsNoAc.length !== 1 ? 'n' : ''} AC de coherencia de conjunto. Origen: ${_ckptOrigen3}. Adjuntar CHECKPOINT corregido antes de continuar.`;
    tgItems.length = 0;
  }

  return { tgItems, patchItems, patchIntencionItems, itemError };
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
  const { tgItems, patchItems, patchIntencionItems, itemError } = _buildTgItemsFromParsed(ckpt, parsedJSON);
  if (itemError) {
    return { ok: false, error: itemError };
  }
  return { ok: true, ckpt, tgItems, patchItems, patchIntencionItems };
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
  const _result = { tgItems: [], patchItems: [], patchIntencionItems: [], skipped: [], metas: [] }; // TKT2 (REQ-[pendiente-ID] · CAEL-05): patchItems agregado — antes se descartaba por completo, ningún patch se aplicaba jamás en el flujo batch // TKT1 (REQ-202607-061): patchIntencionItems agregado — mismo criterio de propagación que patchItems
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
    return { idx, valid: true, tgItems: r.tgItems, patchItems: r.patchItems || [], patchIntencionItems: r.patchIntencionItems || [], ckpt: r.ckpt }; // TKT2: patchItems capturado de _parseBatchBlock — ya lo retornaba (línea 1946), solo se descartaba aquí // TKT1 (REQ-202607-061): patchIntencionItems capturado, mismo criterio
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
    _result.patchIntencionItems = []; // TKT1 (REQ-202607-061): mismo criterio de rechazo atómico
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
      _result.patchIntencionItems.push(...(b.patchIntencionItems || []).map(it => ({ ...it, idx: b.idx }))); // TKT1 (REQ-202607-061): mismo criterio de orden
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


// TKT1 (REQ-202607-058): clasifica cada tarjeta de CHECKPOINT del batch en una de 7 categorías
//   para el Panel de Revisión — {borrador, avalado, entrega, cierre, incidente, liberación,
//   sin-clasificar}. Filtra tgItems.concat(patchItems) por idx === meta.idx (ambos ya llevan
//   idx: b.idx desde _resolveCheckpointBatch — sin cambio a esa función ni a
//   _buildTgItemsFromParsed, per no_incluye del TKT). Precedencia: liberación > incidente >
//   cierre > avalado > borrador > entrega > sin-clasificar. 'liberación' manda sobre cualquier
//   otra condición cuando meta.finnRelease está presente — precedencia explícita del AC del TKT.
//   No consumida todavía por render alguno — TKT2 (Nova, entregable visual) y TKT3 (Rune,
//   integración) son quienes la invocan; ambos bloqueados hasta este TKT1.
export function classifyCheckpointCategory(meta, tgItems, patchItems) {
  if (!meta) return 'sin-clasificar';
  if (meta.finnRelease) return 'liberación';

  const _blockItems = (tgItems || []).concat(patchItems || []).filter(it => it && it.idx === meta.idx);
  if (!_blockItems.length) return 'sin-clasificar';

  if (_blockItems.some(it => _ITIL_TYPES.has(it.type))) return 'incidente';
  if (_blockItems.some(it => it.status === 'done')) return 'cierre';

  const _patchAvalado = (patchItems || []).some(it => it && it.idx === meta.idx && it.draft === false && it.verified_by);
  if (_patchAvalado) return 'avalado';

  const _hasPatchDraftFalse = (patchItems || []).some(it => it && it.idx === meta.idx && it.draft === false);
  const _tgBorrador = (tgItems || []).some(it => it && it.idx === meta.idx && it.draft === true);
  if (_tgBorrador && !_hasPatchDraftFalse) return 'borrador';

  if (_blockItems.some(it => it.status === 'en-revision')) return 'entrega';

  return 'sin-clasificar';
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
