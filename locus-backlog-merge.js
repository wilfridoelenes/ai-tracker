// [PP] mod:76 · autor:Rune · 2026-07-29 03:35 UTC-6
// INC-[pendiente-ID] (fix complementario a locus-session-parse.js mod:163 — duplicación de
// ítem tras CHECKPOINT batch + Quick Capture): showMergeDiffPanel() abortaba
// _mdiffPanelAC solo al cerrar el panel (_mdiffDoApply/teardownMergeDiffPanel), nunca al
// ABRIRLO — si el panel se reabría sobre el shell estático #merge-diff-overlay sin haber
// cerrado la apertura anterior (causa raíz real: doble invocación de _processIngestBatch por
// paste+input, corregida en su origen en locus-session-parse.js), el AbortController viejo
// quedaba huérfano. Además, los listeners de click de #mdiff-cancel-btn/#mdiff-backlog-btn/
// #mdiff-apply-btn nunca estuvieron scoped a _mdiffPanelAC.signal — a diferencia de keydown y
// storage:item-excluded, que sí. Resultado: dos aperturas del panel apilaban dos listeners en
// el mismo botón físico; un solo click disparaba ambos. Fix: (1) abort()+recreación de
// _mdiffPanelAC al inicio de showMergeDiffPanel(), antes de wirear nada; (2) los tres
// listeners de botón ahora declaran { signal: _mdiffPanelAC.signal }. No cambia el
// comportamiento de una reapertura legítima del panel (nuevo CHECKPOINT tras cerrar el
// anterior) — solo previene el stacking de listeners. contract_update: no — sin cambio de
// firma pública de showMergeDiffPanel/teardownMergeDiffPanel.
// [PP] mod:74 · autor:Rune · 2026-07-28 UTC-6
// TKT-202607-172 (REQ-202607-058, AC-9a): chip de docs pendientes por tarjeta atribuida —
// _buildAttributedDocsChip(meta), scoped a meta.docUpdates del bloque, distinto de
// _buildDocUpdatesBlock (TKT6, agregado de batch completo). Reusa .mdiff-docupdate-* ya
// entregado por Nova en TKT6 — sin CSS nuevo, Archivos: del TKT no declara .css. Gate de
// ausencia total de _buildAttributedCardsBlock extendido con !_docsChip — un bloque cuyo único
// contenido es un doc_update ya no queda huérfano sin tarjeta. AC-9 original (fusionaba docs +
// archivos, asumía meta.archivos inexistente en _extractCkptMeta) devuelto por Rune y dividido
// por Cael — la mitad de archivos queda fuera de scope, ver DISC-[pendiente-ID] (triggered_by
// este TKT). contract_update: no — _buildAttributedCardsBlock no es export, sin cambio de firma.
// [PP] mod:73 · autor:Rune · 2026-07-27 23:54 UTC-6
// TKT-202607-170 (REQ-202607-058, AC corregido en Fase 5 v2 por Cael tras hallazgo de Finn en
// Momento 1): taxonomía de 7 categorías renombrada para coincidir exactamente con los sufijos
// reales de locus-backlog-item.css mod:79 (Nova, TKT-202607-171) — 'liberacion'→'liberado',
// 'sinclasificar'→'lite' (mismo valor para bloque vacío de ítems Scrum/ITIL y para el estado
// sin resolver, sin octava categoría por no_incluye del AC). Sin cambio de precedencia ni de
// las 5 ramas restantes (incidente/avalado/cierre/entrega/borrador). contract_update: sí —
// mismo export showMergeDiffPanel, sin cambio de firma; contrato actualizado solo en el string
// enum de valores internos de categoría, no observable desde fuera del módulo.
// Fix de esta sesión (auditoría E2E del modal de ingesta, hallazgo #1 · triggered_by TKT
// TKT-202607-145): _mdiffKeyHandler y el listener window 'storage:item-excluded' vivían
// atados a un const local (_itemExcludedAC) y un removeEventListener manual repetido en 3
// puntos (_mdiffDoApply, Cancelar, Escape) — ningún cierre externo al closure (× del shell,
// locus-modals.js) podía limpiarlos. Fix (Opción B, founder): AbortController promovido a
// módulo (_mdiffPanelAC) + onClose capturado en _mdiffOnClose (módulo) + nueva función
// exportada teardownMergeDiffPanel() — idempotente, no conoce _mdiffKeyHandler por nombre,
// solo aborta el controller compartido. Cancelar y Escape ahora llaman teardownMergeDiffPanel()
// en vez de duplicar la limpieza — _mdiffDoApply mantiene su propia rama (no invoca onClose,
// es un cierre confirmado, no "cierre sin confirmar"). contract_update: sí — export nuevo,
// consumido por locus-modals.js (mod:7, mismo TKT) — import circular ya preexistente en
// sentido inverso (_gconfirmOpen), declarado como impacto lateral ESM en el CHECKPOINT.
// [PP] mod:69 · autor:Rune · 2026-07-26 UTC-6
// TKT2 (TKT-202607-145 · REQ-202607-046): comentarios de esta sesión actualizados de placeholder
// "REQ-202607-XXX" a código real, confirmado por el founder tras ingesta en Locus — mismo criterio
// de __BR-Execution §9 (referencias a ítems embebidas en código: código real cuando ya está
// asignado). Sin cambio funcional — solo trazabilidad de comentarios en los 5 puntos ya tocados
// en esta sesión (apertura del shell, cierre por aplicar, cierre por cancelar, cierre por Escape).
// [PP] mod:68 · autor:Rune · 2026-07-24 UTC-6
// TKT2 (REQ CAEL-0724-11, ref_id CAEL-0724-11): retorno de applyPatchesFromTG() (L~1793) capturado
// en _patchResult — antes se descartaba sin ningún consumo. Si _patchResult.ignored trae 1+
// elementos, dispara showToast('info', ...) con el conteo — mismo mecanismo ya usado para el toast
// de éxito de appliedCount (L1781-1783), sin sección nueva en el panel DIFF (ya cerrado en este
// punto del flujo, _card/_pill/_section fuera de scope). contract_update: sí.
// [PP] mod:67 · autor:Rune · 2026-07-24 UTC-6
// INC-[pendiente-ID] (fix gate req-sin-tkt vs reparenting — ver locus-backlog-item.js mod:142
// para el detalle completo): _patchItems (ya filtrado, línea ~307) propagado como opts.patchItems
// al dry-run de mergeBacklogFromTG — antes se descartaba sin llegar nunca al gate.
// TKT-202607-086: _buildAttributedCardsBlock — cada tarjeta atribuida gana expand/collapse
// independiente. _attrRow envuelto en <button class="mdiff-section-header"
// data-action="mdiff-toggle-section"> (sin accent modifier, ver CSS dependencies de Nova); el
// resto del contenido de la tarjeta (_releaseInfo/_narrativeHtml/_itemsBlockHtml) envuelto en
// <div class="mdiff-section-body"> hermano inmediato — mismo mecanismo que _section(), toggle
// vía el delegador de data-action ya existente (_mdiffToggleSection, línea ~1255). Sin JS nuevo
// más allá del markup — reusa el handler ya cableado. Bloqueo CSS previo (selector
// .mdiff-narrative-section:not(:only-of-type) > .mdiff-narrative-row:first-child dejaba de
// matchear con el nuevo nivel de anidación) resuelto por Nova — ver _Locus-css-ref mod:120 /
// locus-backlog-item.css mod:75. contract_update: no — función interna, no exportada, sin
// cambio de firma.
// [PP] mod:65 · autor:Rune · 2026-07-24 UTC-6
// TKT-202607-078 — fix devuelto por Finn: _blockBadge usaba label estático 'atención' para el
// estado 'con flags'; AC3 real de TKT-202607-077 exige conteo dinámico ("2 flags"). Corregido
// a flagCount = retroceso.filter(idx) + discarded.filter(idx), singular/plural 'flag'/'flags'.
// Label 'ok' renombrado a 'sin flags' — alineado al nombre del AC1 de TKT-077.
// [PP] mod:64 · autor:Rune · 2026-07-24 UTC-6
// TKT-202607-078 — fix de 2 bugs devueltos por Finn (Momento 1) sobre AC corregido por Cael:
// (1) _buildAttributedCardsBlock ahora filtra por meta.idx explícito en vez del índice de
// posición de .map() — metas excluye bloques inválidos (solo van a skipped en
// _resolveCheckpointBatch), por lo que la posición diverge de meta.idx en batches mixtos.
// (2) diff.ignored agregado a _itemsForBlockIdx — categoría real que el AC anterior llamaba
// "skipped" por error (los bloques inválidos nunca tienen entrada en metas). Label del pill
// usa i.reason real en vez del literal fijo 'sin cambios'.
// [PP] mod:63 · autor:Rune · 2026-07-24 UTC-6
// TKT-202607-078 (AC corregido — Opción C): _buildAttributedCardsBlock filtra
// created/advanced/updated/createdAndClosed/retroceso/discarded por idx===bloque y renderiza
// el detalle completo de cada ítem (reusando _card/_retrocedoRow/_discardRow existentes) en
// vez de solo listar flags como texto. Badge por bloque (.mdiff-block-badge--ok/--flag/--skipped,
// TKT-077/Nova) según haya ítems con retroceso/descarte, ítems sin flag, o ningún ítem filtrado.
// GAP registrado: el criterio 'skipped' se infiere de ausencia de ítems filtrados — el campo
// real que locus-session-parse.js usa para marcar bloque inválido no está verificado en esta
// sesión (archivo no adjunto). Ver CHECKPOINT.
// Fix de regresión (hallazgo de Finn, Momento 1 de TKT-202607-076): _resolveCheckpointBatch
// (locus-session-parse.js, TKT1/REQ CAEL-0724-02) ahora agrega idx a cada objeto de tgItems
// Y patchItems para permitir agrupar por bloque en el panel DIFF. _buildPatchCard enumera
// TODAS las claves propias de patchItem vía Object.keys() para construir la lista de "campos
// que cambian" — sin este fix, idx aparecía como cambio falso ("idx: (código no encontrado) →
// N") en la tarjeta de preview de cualquier patch dentro de un batch de 2+ CHECKPOINTs. 'idx'
// agregado a _PATCH_BLACKLIST — mismo criterio que 'type'/'code'/'schema_version'/'ref_id'/
// 'intencion'/'kill_criteria': es marcador de infraestructura del batch, no un campo del ítem
// que el founder deba ver como "cambiado". contract_update: sí — ver CHECKPOINT de TKT-076.
// [PP] mod:61 · autor:Rune · 2026-07-20 21:40 UTC-6
// TKT2 (REQ CAEL-0720-02 · fix sobre mod:60): bug reportado por Finn en auditoría —
// _mdiffUnresolvedRemove no revertía target[field] cuando field es array (dependsOn), porque
// buscaba la posición por entry.selectedCode, campo que _mdiffUnresolvedSelect nunca escribía
// (quedaba undefined, findIndex nunca matcheaba el valor real recién insertado). Fix:
// _mdiffUnresolvedSelect ahora guarda entry.selectedCode = selectedCode al mutar target[field]
// (mismo objeto entry que diff.unresolvedRefs[uIdx] ya expone — sin campo nuevo en schema de
// ítem, solo estado de trabajo del panel). _mdiffUnresolvedRemove limpia entry.selectedCode a
// undefined tras revertir, para que un segundo ciclo select→remove no arrastre estado stale.
// AC7 verificado de nuevo contra el caso array tras el fix. Sin cambio en el caso escalar
// (ya funcionaba correctamente antes del fix). contract_update: no.
// [PP] mod:60 · autor:Rune · 2026-07-20 21:15 UTC-6
// TKT2 (REQ CAEL-0720-02 · AC1-7): resolver de búsqueda para diff.unresolvedRefs — sección
// 'unresolved' insertada tras 'patches', markup literal de Nova (mod:71 de locus-backlog-item.css).
// _mdiffUnresolvedFilter: filtro código-prefijo + título-substring, case-insensitive, unión sin
// duplicados, orden exacto→prefijo→título, máx 8 resultados, flip-to-fit via getBoundingClientRect
// (mismo mecanismo que .sps-dropdown--flip). _mdiffUnresolvedSelect: muta tgItems[code][field] en
// memoria — si field es array, reemplaza la entrada no-resuelta in-place (no push nuevo); reemplaza
// el shell de búsqueda por el chip. _mdiffUnresolvedRemove: revierte a rawValue/ref_id original,
// restaura el shell vacío. Ninguna de las tres persiste por separado — viajan con tgItems hacia el
// mismo flujo de 'Inyectar en shell' ya existente (AC6). Sin cierre-al-click-afuera — no está en AC,
// no agregado. Tres variables de módulo (_mdiffUnresolvedFilter/Select/Remove) siguiendo el patrón
// ya establecido de _mdiffToggleSection/_mdiffJumpTo — limpiadas a null en los tres puntos de cierre
// del panel (antes solo dos tenían _mdiffJumpTo/_mdiffSetItemSprint, el tercero — cancelar sin
// aplicar — también corregido). contract_update: no — ninguna función exportada cambia de firma;
// las tres nuevas son internas, no exportadas.
// [PP] mod:59 · autor:Rune · 2026-07-20 15:55 UTC-6
// TKT1 (REQ CAEL-0720-01) — corrección sobre mod:58: Finn devolvió bug menor en auditoría —
//   mdiff-card--patch violaba no_incluye ("no introduce CSS nuevo") al ser una clase no
//   declarada en css-ref. Retirada — mdiff-card--accent (ya existente) cubre el acento visual.
//   Sin cambio de lógica de _buildPatchCard ni de la sección 'patches' — solo el className del
//   contenedor.
// [PP] mod:58 · autor:Rune · 2026-07-20 15:40 UTC-6
// TKT1 (REQ CAEL-0720-01 · AC1-5): agregada _buildPatchCard(patchItem, existingItem) — tarjeta
//   de preview para ítems type:patch en showMergeDiffPanel, sección nueva 'patches' insertada
//   tras el bloque 'ignored' (antes de "Inyectar en shell"). Reusa .mdiff-card/.mdiff-card-top/
//   .mdiff-code/.mdiff-type-badge/_fieldChips() existentes — sin CSS nuevo (no_incluye). Campos
//   de la lista negra de __BR-Ecosystem §8 (code, type, schema_version, ref_id, intencion,
//   kill_criteria) filtrados antes de generar chips vía _PATCH_BLACKLIST — el 'type' del propio
//   objeto patch ('patch') también cae en esa lista, no es el tipo del ítem. Lookup de
//   existingItem resuelto exclusivamente vía getAnyItem(p.code) (import agregado desde
//   locus-backlog-core.js, línea ~129) en el call site del map sobre _patchItems — nunca
//   getItems().find() suelto, cierra el gap de Fase 5 (Finn, iteración 1: getItems().find() no
//   resuelve ítems ITIL). Ítem no encontrado → from renderiza literal '(código no encontrado)'
//   en el chip correspondiente (AC2), sin excepción. Badge de conteo total no se toca — ya sumaba
//   _patchItems.length desde mod:46/mod:48.
// [PP] mod:57 · autor:Rune · 2026-07-20 UTC-6
// TKT3 (REQ CAEL-0720-01 · AC1-6, AC8): _showStatusConfirmModal retirada — _confirmRetroceso y
//   _confirmDiscard ahora llaman _openStatusConfirm (wrapper delgado sobre _gconfirmOpen con
//   bodyHtml, mismo patrón que TKT2). Corrección sobre el intento anterior en esta misma sesión:
//   el primer edit dejó código huérfano (cola de la función retirada — 5 líneas con `overlay`
//   fuera de scope y una llave/paréntesis sin apertura correspondiente) que rompía la sintaxis del
//   módulo — node --check fallaba con "Unexpected token '}'" en la línea del bloque huérfano; los
//   2 call sites tampoco habían sido retargeteados, seguían invocando la función ya inexistente.
//   Verificado con node --check (modo ESM real) tras el fix — 0 errores. AC7 (nodo HTML
//   #status-confirm-overlay eliminado de index.html) sigue sin verificar — index.html no está
//   adjunto en esta sesión, ver bloqueo en el CHECKPOINT de entrega.
// [PP] mod:56 · autor:Rune · 2026-07-18 UTC-6
// TKT6 (REQ CAEL-0718-01): docUpdates/finnObservations ahora se renderizan — agregados de todos
//   los meta de _allMetasForAggregation (batch N o single 1), en orden. Cierra gap detectado por
//   Finn en cierre de REQ: ambos campos se extraían desde TKT1 pero ningún consumidor los leía,
//   en ninguno de los dos flujos. finnObservations mapea severidad por type (regresion→danger,
//   observacion/gap_contrato→warning) y texto por el campo más descriptivo de cada schema
//   (comportamiento_actual/hallazgo/funcion_afectada). no_incluye: solo lectura, sin acción de
//   aplicar/descartar. Clases nuevas (.mdiff-docupdate-*, .mdiff-finnobs-*) pendientes de CSS —
//   TKT7 (Nova).
// [PP] mod:55 · autor:Rune · 2026-07-18 UTC-6
// TKT3 (REQ CAEL-0718-01 · AC1-3): showMergeDiffPanel soporta ckptMeta.metas (array) — batch de
//   N CHECKPOINTs con tarjeta atribuida por bloque (rol izq. / título der., reusa 100%
//   .mdiff-narrative-row/-label/-value y .mdiff-finnrelease-* — cero CSS nuevo, eso es TKT5).
//   _singleMeta deriva de metas[0] cuando metas.length===1 — el flujo existente (_metaResumen,
//   _buildNarrativeSection, _buildFinnReleaseSection) queda intacto y sin regresión (AC2/AC3).
//   Header step-label condicional: "Guardar sesión" (0-1 entrada) vs "Revisión de batch · N
//   CHECKPOINTs" (2+, AC3). no_incluye: NO retira el gate de exclusividad sprint_proposal (línea
//   ~185, __BR-Ecosystem §12) pese a que el contract_detail de este TKT lo declara — ver
//   impacto lateral en el CHECKPOINT de entrega: TKT3 y TKT4 no declaran depends_on entre sí, y
//   retirar el gate aquí antes de que TKT4 retire la lectura de sprintProposal en
//   locus-session-parse.js abriría una ventana real de regresión contra una HARD RULE. Devuelto
//   a Cael para depends_on explícito antes de tocar esa parte del contrato.
// [PP] mod:54 · autor:Rune · 2026-07-17 11:20 UTC-6
// TKT2 (REQ CAEL-0717-01 · AC1-4): agregada _buildFinnReleaseSection() — tarjeta de liberación
//   de Finn (schema finn_release, BR-Ecosystem §8), leída directo de _ckptMeta.finnRelease sin
//   const de normalización propia (a diferencia de _metaResumen/etc.) porque AC3 exige ausencia
//   total de hueco visual cuando el CHECKPOINT no declara finn_release — la función retorna ''
//   y el concat no inserta nada, sin rama condicional adicional en el punto de uso. Insertada
//   ANTES de _buildNarrativeSection() en el concat de body.innerHTML (línea ~799): el resultado
//   liberado precede a la narrativa de cómo se produjo. Orden interno fijo por AC1: liberado →
//   que_hace → que_no_hace → probado (AC4, cada check con texto accesible "Verificado: [AC]") →
//   listo_para → docs_pendientes (AC2, fila condicional solo si el array tiene elementos).
//   Clases .mdiff-finnrelease-* consumidas desde _Locus-css-ref (Nova, locus-backlog-item.css
//   mod:57) — reusa .mdiff-narrative-row/-label/-value para las filas simples, sin tokens nuevos.
//   no_incluye: no toca _buildNarrativeSection() ni el mapeo de _ckptMeta.finnRelease en el
//   parser — eso vive en locus-session-parse.js, fuera de este archivo (ver CHECKPOINT de TKT2).
// [PP] mod:52 · autor:Rune · 2026-07-13 08:30 UTC-6
// TKT3 (REQ-[pendiente-ID] · migración Step 0 DIFF → panel Sprint subtab): retirado el bloque
// `if (_sprintProposal && body) {...}` completo — Step 0 HTML, listeners #mdiff-step0-approve/
// #mdiff-step0-reject, y el gate de ítems sin sprint (ex T-202606-164, relocalizado en TKT4 al
// panel del subtab Sprints). El gate de exclusividad §12 (antes del early-return, arriba en esta
// función) NO se toca — sigue leyendo _ckptMeta.sprintProposal directo. Condición del bloque de
// narrativa+secciones simplificada de `body && !_sprintProposal` a solo `body` — ya no hay Step 0
// que la gatee. Consts locales _sprintProposal/_onApproveProposal retiradas.
// [PP] mod:49 · autor:Rune · 2026-07-10 UTC-6
// TKT-202607-103 (REQ-202607-026 · AC1-4): _draftPending retirado del cálculo de `blocked` en
//   _mdiffUpdateConfirmBtn — Guardar ya no se deshabilita solo por draft:true. Banner de aval
//   pendiente (_renderDraftPendingBanner) conservado sin cambio de condición de render, solo
//   copy corregida (fix inline, mismo archivo): describía "Guardar deshabilitado", ya no es cierto
//   tras este TKT — habría quedado como placeholder incorrecto en producción.
// [PP] mod:48 · autor:Rune · 2026-07-09 UTC-6
// TKT-[pendiente-ID] (origen_disc, triggered_by TKT-202607-048): totalApply (botón "Guardar
//   sesión") tenía el mismo gap que el badge del header ya corregido en mod:46 — no sumaba
//   _patchItems.length. Fix: totalApply += _patchItems.length. blocked/disabled no se toca —
//   siguen gobernados por la condición `blocked` existente, sin relación con el contador.
// [PP] mod:46 · autor:Rune · 2026-07-09 01:00 UTC-6
// TKT-202607-048: badge "X ítems" del header de showMergeDiffPanel no contaba objetos
//   type:patch — _patchItems se filtra de tgItems antes del dry-run (línea ~105) y nunca
//   se sumaba a `total`, que solo agrega las categorías de diff.*. Un CHECKPOINT con solo
//   patches mostraba "0 ítems" pese a tener ítems reales. Fix: total += _patchItems.length.
// [PP] mod:45 · autor:Rune · 2026-07-09 00:15 UTC-6
// INC-[pendiente-ID] (triggered_by INC-202607-004 — mismo módulo): _parentHtml leía item.parent
//   (campo eliminado por mergeBacklogFromTG tras normalizar a parentId) — "Parent: Sin parent"
//   para todo TKT, nuevo o existente. Fix: lee item.parentId. Detectado en la misma auditoría,
//   segundo gap: todo _card(i.code, i.title, ...) en este archivo leía i.title, pero los objetos
//   de diff.created/advanced/updated/retroceso/discarded/ignored/tmpSuggestions (locus-backlog-item.js)
//   solo exponen .desc — la descripción de cada card del panel de diff estaba vacía en las 9
//   secciones del panel, no solo en created. Fix: i.title → i.desc en todo el archivo (9 sitios).
//   no_incluye: no cambia el nombre del campo en locus-backlog-item.js (desc ya es el contrato
//   correcto entre merge y render) — solo alinea el lado que lo leía mal.
// TKT-[tmp:tkt-shortcopy] (parent: n/a — standalone, promovido de DISC triggered_by
//   INC-202607-002): _shortCopy en el listener storage:item-excluded usaba texto fijo
//   "no puede quedar sin sprint asignado" sin importar la causa real. Corregido — usa
//   `reason` del evento. Ver detalle en el bloque de código.
// [PP] mod:42 · autor:Rune · 2026-07-05 UTC-6
// INC-202607-002 (triggered_by hallazgo de sesión — DIFF bloqueaba guardado de REQ/TKT en
//   Q-Backlog): sprintPendingItems ya no participa en `blocked` — Q-Backlog es destino válido
//   (BR-Ecosystem §5), no requiere sprint real para guardar. Sección derecha renombrada de
//   "Sprint requerido" a nota informativa "Q-Backlog — sin sprint". Ver _mdiffUpdateConfirmBtn.
// [PP] mod:41 · autor:Rune · 2026-07-03 UTC-6
// TKT2-diff-visual: created/advanced/updated migrados a _buildSummaryChipsBlock() —
// header de sección con toggle eliminado para esas 3 categorías, cards se listan directo.
// [PP] mod:39 · autor:Rune · 2026-07-03 20:22 UTC-6
// TKT1-diff-visual: _typeClass completado con PRB/KE/CHG — antes caían a mdiff-type--unknown sin razón.
// [PP] mod:38 · autor:Rune · 2026-07-02 06:00 UTC-6
// TKT-202607-001 (triggered_by hallazgo de sesión — DIFF de DISC mostraba selector "Sin sprint
//   (Q-Backlog)" seleccionado): agregada rama _QDISC_TYPES en _sprintSelect — DISC ahora
//   renderiza badge fijo "Q-DISC", mismo patrón ya existente para _QINC_TYPES. Sin cambio de
//   comportamiento en backend — _applySprintInheritanceToItems ya excluía DISC correctamente.
//   Clase .mdiff-queue-badge--qdisc requiere CSS — ver doc_updates, bloqueado sin _Locus-css-ref.
// [PP] mod:36 · autor:Rune · 2026-06-30 19:15 UTC-6
// INC-[pendiente-ID] (triggered_by REQ-202606-003 / REQ-202606-001): las 4 rutas de status
//   manual de este archivo (_mdiffDoApply retroceso/discard, _confirmRetroceso, _confirmDiscard,
//   _applyDiscardBatch) seteaban item.status directo sin invocar _syncParentRStatus (ahora
//   exportada desde locus-backlog-core.js mod:70) — el R padre quedaba desincronizado tras
//   retroceso/descarte manual. Corregido en las 4. La ruta de ingest normal de CHECKPOINT
//   (mergeBacklogFromTG/applyPatchesFromTG en locus-backlog-item.js) tiene el mismo bug y
//   sigue sin corregir — archivo no adjunto en esta sesión.
// [PP] mod:34 · autor:Rune · 2026-06-30 UTC-6
// INC-[pendiente-ID] (triggered_by TKT-202606-013): corregidos los 2 call sites restantes de
//   showToast({title,body,type}) → showToast(type,title,body) — firma posicional real.
// Fix inline (TKT-202606-013): corregido call de showToast en gate TKT-202606-012 — firma
//   posicional (type,title,body), no objeto. Bug descubierto al implementar TKT-013.
// TKT-202606-012 (REQ-202606-003 · AC2): gate de exclusividad sprint_proposal + items REQ/TKT
//   bloquea showMergeDiffPanel completo con toast error cuando ambos llegan en el mismo CHECKPOINT —
//   __BR-Ecosystem §12. DISC/INC/PRB/KE/CHG/patch no activan el gate.
// TKT-202606-011 (REQ-202606-003 · AC3): showMergeDiffPanel renderiza banner con badge
//   "Pendiente de aval Finn" (.mdiff-step0-badge, mismo patrón visual que Step 0/Sugerencia)
//   y deshabilita mdiff-apply-btn/mdiff-backlog-btn cuando ckptMeta.draftPending === true —
//   vía el mismo mecanismo de bloqueo que retroPendingItems/discardPendingItems/sprintPendingItems
//   en _mdiffUpdateConfirmBtn. Sin clases CSS nuevas — solo reutiliza .mdiff-step0-* existentes.
// locus-backlog-merge.js
// Última actualización: REQ-MERGE-GEN2: migrar detección de tipo Gen2 en badges, sort, title y parentHtml
// Responsabilidad: showMergeDiffPanel + modales de confirmación de status (retroceso, descarte)
// Dependencias: locus-backlog-core.js · locus-backlog-item.js · locus-backlog-sprints.js · locus-storage.js · locus-toast.js
// Carga: después de locus-backlog-item.js

import { _calcPriority, _getActiveSessionAiId, _undoSnapshotItems, loadBacklog, renderStats, updateBacklogBanner, getItems, getAnyItem, _registerCoreCallback, itemKind as _itemKindFn, _syncParentRStatus } from './locus-backlog-core.js'; // CAEL-0720-01 TKT1: getAnyItem — lookup de existingItem en _buildPatchCard, resuelve backlog + incidents
import { _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { _getSprintById } from './locus-backlog-sprints.js';
import { _blogLog, getActiveProject, getActiveSprints, saveBacklog, _sprintDisplay } from './locus-storage.js'; // TKT5-[pendiente-ID]: _sprintDisplay para opción de sprint nuevo en DIFF
import { showToast, toast } from './locus-toast.js';
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';
import { _gconfirmOpen } from './locus-modals.js'; // CAEL-0720-01 TKT3

import { applyPatchesFromTG, mergeBacklogFromTG, _checkAndOrphanParentR } from './locus-backlog-item.js';

import { _setBacklogModified } from './locus-docs.js';

import { render } from './locus-sesiones.js';

import { interpretHora, _horaUpdate } from './locus-session-hora.js';



// R-202605-033: Extraído de locus-backlog-item.js

// R-202606-002: _mdiff* convertidas de window.* a variables let de módulo
// El closure showMergeDiffPanel las asigna al abrir y null al cerrar — mismo ciclo de vida
let _mdiffToggleSection = null;
let _mdiffJumpTo = null;
let _mdiffSetItemSprint = null;
let _mdiffUpdateConfirmBtn = null;
// TKT2 (REQ CAEL-0720-02): resolver de búsqueda para diff.unresolvedRefs — mismo patrón
// de closure asignado/limpiado que el resto de _mdiff*.
let _mdiffUnresolvedFilter = null;
let _mdiffUnresolvedSelect = null;
let _mdiffUnresolvedRemove = null;
// Fix de esta sesión: AbortController compartido para el listener de keydown del panel y el
// listener de window 'storage:item-excluded' — antes _itemExcludedAC vivía como const local al
// closure de showMergeDiffPanel(); un cierre externo (× del shell, locus-modals.js) no tenía
// forma de invocarlo. Módulo-level para que teardownMergeDiffPanel() (más abajo) pueda abortarlo
// sin conocer _mdiffKeyHandler, que sigue siendo local al closure — nunca se exporta.
let _mdiffPanelAC = null;
// onClose capturado del caller activo — Cancelar/Escape ya lo invocaban ("cierre sin confirmar,
// revertir fase 2→1"); teardownMergeDiffPanel() lo replica para que cerrar con × tenga el mismo
// efecto sobre el caller que cerrar con Cancelar/Escape.
let _mdiffOnClose = null;

// T-202606-006: true mientras el DIFF está abierto — consultable por otros módulos vía getter.
// Se pone true al abrir el panel (TKT-202607-145: ahora shell.classList.add('open') sobre
// #modal-split-shell, antes overlay.classList.add('open') sobre #merge-diff-overlay) y false
// en todos los cierres del DIFF.
export let _mdiffStepZeroActive = false;
export function getMdiffStepZeroActive() { return _mdiffStepZeroActive; }

// Fix de esta sesión (auditoría E2E modal de ingesta, hallazgo #1): expuesto para que
// closeModal() (locus-modals.js) pueda limpiar el estado del panel DIFF al cerrar el shell
// con × — antes solo Cancelar/Escape corrían esta limpieza, dejando _mdiffKeyHandler vivo en
// document tras un cierre por ×. Idempotente — no-op si el panel no está abierto
// (_mdiffStepZeroActive === false), seguro de llamar aunque el shell nunca haya tenido el
// panel DIFF cargado (ej. columna de ingesta sola, sin batch procesado). Mismo camino de
// limpieza que Cancelar/Escape: aborta _mdiffPanelAC (retira keydown + storage:item-excluded
// en un solo gesto — _mdiffKeyHandler nunca se exporta, este teardown no necesita conocerlo),
// resetea shell/overlay a --empty, invoca _mdiffOnClose (mismo criterio ya documentado en
// Cancelar/Escape: "el DIFF se cerró sin confirmar, revertir fase 2→1") y limpia las
// referencias _mdiff* de módulo. Cancelar y Escape llaman esta misma función en vez de
// duplicar la limpieza tres veces — _mdiffDoApply (confirmar) NO la usa: aplicar no invoca
// onClose, es una rama de cierre distinta.
export function teardownMergeDiffPanel() {
  if (!_mdiffStepZeroActive) return;
  const shell = document.getElementById('modal-split-shell');
  const overlay = document.getElementById('merge-diff-overlay');
  if (shell) shell.classList.remove('open');
  if (overlay) {
    overlay.classList.remove('mdiff-overlay--filled');
    overlay.classList.add('mdiff-overlay--empty');
  }
  if (_mdiffPanelAC) { _mdiffPanelAC.abort(); _mdiffPanelAC = null; }
  if (typeof _mdiffOnClose === 'function') _mdiffOnClose();
  _mdiffUpdateConfirmBtn = null;
  _mdiffToggleSection = null;
  _mdiffJumpTo = null;
  _mdiffSetItemSprint = null;
  _mdiffUnresolvedFilter = null;
  _mdiffUnresolvedSelect = null;
  _mdiffUnresolvedRemove = null;
  _mdiffOnClose = null;
  _mdiffStepZeroActive = false; // T-202606-006
}

// TKT1/TKT3 (REQ CAEL-01): helper compartido — resuelve la bifurcación de arquitectura
// detectada al implementar (Rune, grounding pre-código): _chipDefs (más abajo en este
// archivo) es local, no exportado, y su taxonomía de 9 categorías con tone 'green'/'blue'/
// 'accent'/'warn'/'red'/'muted' no coincide con las 5 clases .diff-chip--* que Nova definió
// (_Locus-css-ref mod:58). En vez de forzar _chipDefs a servir dos propósitos distintos
// (navegación interna del DIFF vs resumen compacto), se extrae este helper nuevo, chico,
// exportado, con el único shape que ambos consumidores (header del DIFF y preview del card)
// necesitan. _chipDefs no se toca — sigue sirviendo exclusivamente la navegación por sección
// dentro del panel, sin cambio de comportamiento.
export function chipTonesFromDiff(diff) {
  if (!diff) return [];
  const defs = [
    { tone: 'creado',       label: 'creados',       count: (diff.created?.length || 0) + (diff.createdAndClosed?.length || 0) },
    { tone: 'avance',       label: 'avances',       count: diff.advanced?.length || 0 },
    { tone: 'actualizado',  label: 'actualizados',  count: diff.updated?.length || 0 },
    { tone: 'retroceso',    label: 'retrocesos',    count: diff.retroceso?.length || 0 },
    { tone: 'descarte',     label: 'descartes',     count: diff.discarded?.length || 0 },
  ];
  return defs.filter(d => d.count > 0);
}

function _renderChipTones(tones) {
  return tones.map(t =>
    `<span class="diff-chip diff-chip--${t.tone}">${t.count} ${t.label}</span>`
  ).join('');
}

// T-202606-037: ckptMeta — campos narrativos del CHECKPOINT para sección superior del panel.
// Objeto con campos: { resumen, aprendizaje, bloqueantes, decision, proximoPaso } — todos string, todos opcionales.
// Si es null/undefined, todos los campos se tratan como cadena vacía (AC-5).
export async function showMergeDiffPanel(tgItems, sessId, projId, onApply, ckptMeta, onClose) {
  // T-202606-037 AC-1: early-return sin ítems eliminado — el panel siempre abre cuando hay CHECKPOINT válido.
  // AC-5: ckptMeta null/undefined normalizado a objeto vacío.
  const _ckptMeta = (ckptMeta && typeof ckptMeta === 'object') ? ckptMeta : {};

  // TKT3 (REQ CAEL-0718-01 · AC1-3): ckptMeta.metas (array, flujo batch) vs ckptMeta plano
  // (flujo single/A) — mutuamente excluyentes (contract_detail invariant). Con 1 sola entrada de
  // batch, _singleMeta apunta a metas[0] y el resto del panel se comporta exactamente igual que
  // el flujo single (AC3 — sin atribución, header "Guardar sesión"). Sin campo metas, _singleMeta
  // es _ckptMeta mismo — cero regresión sobre el flujo A existente (AC2).
  const _ckptMetas  = Array.isArray(_ckptMeta.metas) ? _ckptMeta.metas : null;
  const _singleMeta = (_ckptMetas && _ckptMetas.length === 1) ? _ckptMetas[0] : _ckptMeta;

  const _metaResumen     = _singleMeta.resumen      || '';
  const _metaAprendizaje = _singleMeta.aprendizaje  || '';
  const _metaBloqueantes = _singleMeta.bloqueantes  || '';
  const _metaDecision    = _singleMeta.decision     || '';
  const _metaProxPaso    = _singleMeta.proximoPaso  || '';
  // TKT-202607-172 (REQ-202607-058 · AC4-6): precedencia de la línea "Siguiente" —
  //   nextStep (pendientes_y_siguiente_paso.next_step, __BR-Ecosystem §8 infra_version 62) >
  //   nextRole (next_role de raíz del CHECKPOINT) > _metaProxPaso (fallback final, sin cambio —
  //   no_incluye del TKT). _singleMeta.nextStep/.nextRole solo llegan poblados cuando el
  //   ckptMeta pasado a showMergeDiffPanel los incluye — el flujo batch (metas, vía
  //   _extractCkptMeta) ya los trae; el flujo single depende de locus-session-save.js
  //   (no adjunto en este TKT, ver Hallazgo fuera de scope en el CHECKPOINT de entrega) — si
  //   ese archivo aún no los propaga, esta const cae a _metaProxPaso sin romper nada (AC6).
  const _metaSiguiente   = _singleMeta.nextStep || _singleMeta.nextRole || _metaProxPaso || '';

  // B-202606-001: separar type:patch antes del dry-run — no deben pasar por mergeBacklogFromTG.
  // Los patches actualizan campos de ítems existentes via applyPatchesFromTG y no generan diff visual.
  // Se aplican en _mdiffDoApply después de onApply() para que ítems nuevos ya existan en getItems().
  const _patchItems = tgItems.filter(i => i.type === 'patch');
  tgItems = tgItems.filter(i => i.type !== 'patch');

  // TKT-202606-012 (REQ-202606-003 · AC2): gate de exclusividad sprint_proposal + items.
  // __BR-Ecosystem §12 — sprint_proposal debe ir en CHECKPOINT independiente, nunca junto a
  // ítems REQ/TKT. type:patch ya fue excluido arriba — no cuenta para este gate. DISC/INC/PRB/
  // KE/CHG no activan el gate — solo REQ y TKT. Corre antes de cualquier mutación o dry-run.
  if (_ckptMeta.sprintProposal && tgItems.some(i => i.type === 'REQ' || i.type === 'TKT')) {
    const _msg = 'sprint_proposal debe ir en CHECKPOINT independiente antes de los ítems. Separar y reemitir.';
    // Fix inline (triggered_by TKT-202606-013): showToast usa firma posicional (type, title, body) —
    // ver locus-toast.js:145. {title,body,type} como objeto único no renderiza texto — bug descubierto
    // al implementar TKT-202606-013, mismo patrón roto en otros call sites preexistentes (ver INC).
    showToast('error', 'CHECKPOINT bloqueado', _msg);
    console.warn('[Locus] showMergeDiffPanel:', _msg);
    return; // ningún ítem se aplica — early-return antes de mergeBacklogFromTG y cualquier mutación
  }

  // T-202606-165: validar sprints no registrados antes del dry-run.
  // Ítems no-patch con sprint distinto de icebox/'' que no exista en getActiveSprints()
  // bloquean el CHECKPOINT completo sin aplicar nada.
  // B-202606-048: patches (type:patch) excluidos de esta validación — operan sobre ítems existentes.
  // Se valida contra la lista completa — sprints cerrados incluidos — para no bloquear
  // CHECKPOINTs históricos con sprint ya cerrado que lleguen por retomada.
  // B-202606-044 compat: buscar por id primero, luego por label (mismo criterio que _sprintSelect).
  // B-202606-063: excluir sprints declarados en la ---SPRINT-PROPOSAL--- del mismo CHECKPOINT —
  // el gate corre antes del Step 0, cuando el sprint aún no existe en getActiveSprints().
  // Si el CHECKPOINT crea el sprint via proposal, los ítems que lo referencian son válidos.
  {
    const _allSprints = getActiveSprints(); // incluye closed

    // Extraer prefijos cortos de sprints declarados en la proposal del mismo CHECKPOINT
    const _proposal = _ckptMeta.sprintProposal || null;
    const _proposalSprintIds = [];
    if (_proposal) {
      // Schema JSON usa campo "id" — schema legado usa "sprint"
      const _pId = _proposal.id || _proposal.sprint || null;
      if (_pId) {
        // Prefijo corto: "PP-S-06 · nombre" → "PP-S-06"
        _proposalSprintIds.push(_pId.split(/\s*·\s*/)[0].trim());
        // String completo también — por si el ítem usa el label completo
        _proposalSprintIds.push(_pId);
      }
    }

    // B-202606-048: excluir _patchItems de la validación de sprints desconocidos.
    // Un type:patch opera sobre ítems existentes — su campo sprint (si lo declara) es
    // un campo a actualizar, no una asignación de contenedor nueva. Incluirlos en _allItems
    // bloqueaba CHECKPOINTs de solo patches cuando el sprint declarado aún no estaba registrado,
    // aunque los ítems patcheados ya existieran en el backlog con ese sprint.
    const _allItems   = [...tgItems];
    const _unknownSprints = [];
    for (const it of _allItems) {
      const s = it.sprint;
      if (!s) continue; // TKT-B-inline: eliminado s==='icebox' (Gen1) — !s cubre sprint vacío/ausente en Gen2
      // Gen2: zonas persistentes no son sprints — reconocidas por patrón de nombre, sin registro en tracker_sprints
      if (/^[A-Z]+-Q-(Backlog|DISC|INC)$/i.test(s)) continue;
      // B-202606-063: sprint declarado en la proposal del mismo CHECKPOINT — no es desconocido
      if (_proposalSprintIds.includes(s)) continue;
      const _byId     = _allSprints.find(sp => sp.id    === s);
      const _byLabel  = !_byId ? _allSprints.find(sp => sp.label === s) : null;
      // B-202606-063: sprint guardado con id largo antes del fix de mod:43 — buscar por prefijo también.
      // "PP-S-06" coincide con id "PP-S-06 · IDP fixes..." via startsWith del id guardado.
      const _byPrefix = (!_byId && !_byLabel)
        ? _allSprints.find(sp => (sp.id || '').startsWith(s + ' ') || (sp.id || '') === s || (sp.name || '').startsWith(s + ' '))
        : null;
      if (!_byId && !_byLabel && !_byPrefix && !_unknownSprints.includes(s)) {
        _unknownSprints.push(s);
      }
    }
    if (_unknownSprints.length > 0) {
      const _sprintList = _unknownSprints.map(s => `"${s}"`).join(', ');
      const _msg = _unknownSprints.length === 1
        ? `CHECKPOINT bloqueado: sprint ${_sprintList} no registrado. Registrar el sprint antes de continuar.`
        : `CHECKPOINT bloqueado: sprints ${_sprintList} no registrados. Registrar los sprints antes de continuar.`;
      // Fix INC-[pendiente-ID] (triggered_by TKT-202606-013): showToast firma posicional.
      showToast('error', 'CHECKPOINT bloqueado', _msg);
      console.warn('[Locus] showMergeDiffPanel:', _msg);
      return; // AC-2: ningún ítem aplicado — early-return antes de cualquier mutación
    }
  }

  // Todo CHECKPOINT válido pasa por el DIFF — sin excepción por contenido.
  // Patches se aplican en _mdiffDoApply tras onApply() — comportamiento preservado.
  // Dry-run: obtener diff sin mutar getItems()
  const _prevFilter = localStorage.getItem('current-project-filter') || '';
  const _filterChanged = projId && projId !== _prevFilter;
  if (_filterChanged) {
    localStorage.setItem('current-project-filter', projId);
    loadBacklog();
  }
  // INC-202607-[pendiente-ID] (triggered_by: TKT-202607-078 — detectado al testear el
  // flujo de paste-session, causa raíz ajena al TKT que lo expuso): mergeBacklogFromTG
  // pasó a async en TKT-202607-076/077 (REQ-[pendiente-ID] · cadena de merge async).
  // Ese REQ declaró como "único caller conocido" a _mergeBacklogWithProject — este dry-run
  // es un tercer call site independiente, no cubierto por TKT-202607-077. Sin await, `diff`
  // era la Promise en sí — diff.created lanzaba TypeError sobre `undefined` en línea 213.
  // _dryRunError separa el rechazo del try/finally existente para no duplicar la lógica de
  // restauración de filtro (debe correr siempre, éxito o rechazo — comportamiento preexistente
  // sin cambio) y para abortar antes de leer diff.created si el dry-run falló.
  let diff, _dryRunError = null;
  try {
    // FIX (sesión 2026-07-24, gate req-sin-tkt vs reparenting): _patchItems (línea ~307, ya
    // filtrado fuera de tgItems) se propaga aquí para que mergeBacklogFromTG pueda reconocer la
    // excepción de __BR-Core §4 — un REQ nuevo sin TKT nuevo en el batch pero con un type:patch
    // reparentando un TKT existente hacia él no debe caer en 'req-sin-tkt'.
    diff = await mergeBacklogFromTG(tgItems, sessId, { dryRun: true, ckptRol: _ckptMeta.rol || '', patchItems: _patchItems });
  } catch (err) {
    _dryRunError = err;
  } finally {
    if (_filterChanged) {
      // B-202605-010: restaurar filter antes de loadBacklog — si loadBacklog lanza, el filter ya está restaurado
      if (_prevFilter) localStorage.setItem('current-project-filter', _prevFilter);
      else localStorage.removeItem('current-project-filter');
      try {
        loadBacklog();
      } catch (e) {
        console.error('[AI Tracker] showMergeDiffPanel: loadBacklog falló en finally — filter restaurado, backlog puede estar desactualizado.', e);
        // Fix INC-[pendiente-ID] (triggered_by TKT-202606-013): showToast firma posicional.
        showToast('error', 'Error al restaurar backlog', 'Recarga la página.');
      }
    }
  }
  if (_dryRunError) {
    console.error('[AI Tracker] showMergeDiffPanel: mergeBacklogFromTG (dry-run) rechazó — panel no abierto.', _dryRunError);
    showToast('error', 'No se pudo generar el diff del CHECKPOINT', 'Reintenta o recarga la página.');
    return; // ningún panel se abre, ninguna mutación posterior — mismo criterio que el resto de la cadena async
  }

  const total = diff.created.length + diff.advanced.length + diff.updated.length +
                diff.retroceso.length + diff.discarded.length + diff.ignored.length +
                diff.createdAndClosed.length + diff.tmpSuggestions.length +
                (diff.invalidTransition || []).length + // T-202606-020
                _patchItems.length; // TKT-202607-048: patches no generan diff visual pero son ítems del CHECKPOINT — badge debe contarlos

  const _criticalReasons = ['duplicado', 'sin-status', 'tipo-invalido'];
  const _hasCriticalIgnored = (diff.ignored || []).some(i => _criticalReasons.includes(i.reason));

  // B-202605-500: sprints asignados desde el DIFF a ítems nuevos (aún no existen en getItems() durante dryRun)
  const _mdiffPendingSprints = {}; // { [code]: sprintId }

  // Todo CHECKPOINT válido abre el DIFF — sin excepción por total=0 ni por ausencia de narrativa.

  // ── Helpers de renderizado ──
  // R-202605-148: pill corto B/T/R/P — letra única con color semántico en .mdiff-type-badge
  const _typeName  = { INC: 'INC', TKT: 'TKT', REQ: 'REQ', DISC: 'DISC' };
  // R-202605-148: clase CSS por tipo — hex fijos de identidad del backlog
  const _typeClass = { INC: 'mdiff-type--inc', TKT: 'mdiff-type--tkt', REQ: 'mdiff-type--req', DISC: 'mdiff-type--disc', PRB: 'mdiff-type--prb', KE: 'mdiff-type--ke', CHG: 'mdiff-type--chg' };
  // R-202605-148: orden canónico INC → REQ → TKT → DISC para sort dentro de sección
  const _typeOrder = { INC: 0, REQ: 1, TKT: 2, DISC: 3 };

  const _pill = (cls, label) =>
    `<span class="mdiff-pill mdiff-pill--${cls}">${label}</span>`;

  // T-202606-019: chips individuales por campo en sección 'Campos actualizados'
  // Consume changes[] — array de { field, from, to } del objeto diff.
  // AC-7: from/to null → muestra '—' en lugar de crash.
  // AC-2: campo status usa clase por valor canónico via lookup table.
  const _STATUS_CHIP_CLS = {
    'pendiente':   'pendiente',
    'discovery':   'pendiente', // TKT-202606-010: mismo chip que 'pendiente' — sin clase indefinida en DIFF
    'en-revision': 'en-revision',
    'done':        'done',
    'descartado':  'descartado',
    'promoted':    'promoted',
    'bloqueado':   'bloqueado',
  };

  const _fieldChips = (changes) => {
    if (!changes || !changes.length) return '';
    const chips = changes.map(({ field, from, to }) => {
      const fromStr = from != null ? esc(String(from)) : '—';
      const toStr   = to   != null ? esc(String(to))   : '—';
      let extraCls = '';
      if (field === 'status') {
        const key = to != null ? String(to).toLowerCase() : '';
        const variant = _STATUS_CHIP_CLS[key] || 'unknown';
        extraCls = ` mdiff-field-chip--status-${variant}`;
      }
      return `<span class="mdiff-field-chip${extraCls}">${esc(field)}: ${fromStr} → ${toStr}</span>`;
    }).join('');
    return `<div class="mdiff-field-chips">${chips}</div>`;
  };

  // R-202605-148: select de sprint inline — persiste via _mdiffSetItemSprint sin re-render del DIFF
  // B-202606-032: sprintOverride — sprint del objeto diff para ítems nuevos que aún no existen en getItems()
  // INC-[pendiente-ID]: itemType (pos 3) — INC/PRB/KE/CHG viven exclusivamente en Q-INC (__BR-Ecosystem §5).
  //   Estos tipos no aceptan sprint ni Q-Backlog — el selector no se renderiza, se muestra badge de cola fija.
  // TKT-202607-152: 'KE' retirado — itemKind() nunca produce ese tipo desde la fusión
  // KE→PRB.root_cause_confirmed (infra_version 51). Mismo criterio de residuo ya limpiado en
  // _isQIncTerminal() (locus-incidents-render.js mod:10) — la entrada aquí quedaba muerta desde
  // entonces, sin afectar el selector porque itemType nunca llegaba como 'KE'.
  const _QINC_TYPES = ['INC', 'PRB', 'CHG'];
  // TKT-202607-001 (INC-[pendiente-ID], triggered_by hallazgo de sesión — DIFF mostraba
  //   "Sin sprint (Q-Backlog)" seleccionado para DISC): DISC vive exclusivamente en Q-DISC
  //   (__BR-Ecosystem §5) y nunca acepta sprint — mismo patrón ya aplicado a _QINC_TYPES.
  //   _applySprintInheritanceToItems (línea ~1672) ya excluía DISC en el backend; esta rama
  //   alinea el render visual del selector con esa exclusión ya existente.
  const _QDISC_TYPES = ['DISC'];
  const _sprintSelect = (code, sprintOverride, itemType) => {
    if (_QINC_TYPES.includes(itemType)) {
      return `<span class="mdiff-queue-badge mdiff-queue-badge--qinc" title="Cola fija — no editable">Q-INC</span>`;
    }
    if (_QDISC_TYPES.includes(itemType)) {
      return `<span class="mdiff-queue-badge mdiff-queue-badge--qdisc" title="Cola fija — no editable">Q-DISC</span>`;
    }
    const openSprints = getActiveSprints().filter(s => s.status !== 'closed');
    const item = getItems().find(i => i.code === code);
    // B-202606-032: para ítems nuevos (item === null), usar sprintOverride del objeto diff como fuente
    const rawSprint = item ? (item.sprint || '') : (sprintOverride || '');
    // B-202606-0XX (TKT-B2): sin sprint asignado = valor vacío — Q-Backlog, no icebox (Gen1 deprecado).
    // B-202606-044: el CHECKPOINT puede declarar sprint como label completo ('PP-S-04 · Nombre')
    //   o como id corto ('PP-S-04'). Buscar por id primero, luego por label como fallback.
    const isUnassigned = !rawSprint;
    const _matchById    = rawSprint ? openSprints.find(s => s.id    === rawSprint) : null;
    const _matchByLabel = !_matchById && rawSprint ? openSprints.find(s => s.label === rawSprint) : null;
    const _matched      = _matchById || _matchByLabel || null;
    const sprintExists  = !!_matched;
    const currentSprint = sprintExists ? _matched.id : '';
    // TKT5-[pendiente-ID]: _sprintDisplay aplica patrón id · label — antes s.label||s.id
    const options = openSprints.map(s =>
      `<option value="${esc(s.id)}" ${currentSprint === s.id ? 'selected' : ''}>${esc(_sprintDisplay(s.id))}</option>`
    ).join('');
    // B-202606-0XX (TKT-B2): 'Sin sprint (Q-Backlog)' (value='') reemplaza icebox como opción especial.
    return `<select class="mdiff-sprint-select" data-item-code="${esc(code)}"
      data-action="mdiff-set-sprint"
      data-stop-propagation="true">
      <option value="" ${isUnassigned || !currentSprint ? 'selected' : ''}>Sin sprint (Q-Backlog)</option>
      ${options}
    </select>`;
  };

  // T-202605-037: para ítems tipo T, muestra el campo parent debajo del título
  // parentOverride: valor de parent del objeto diff cuando el ítem aún no existe en getItems() (recién creado)
  // REQ-MERGE-GEN2 TKT3: migrado a _itemKindFn para detectar TKT via tipo Gen2
  // INC-[pendiente-ID] (triggered_by INC-202607-004): leía item.parent — campo eliminado por
  // mergeBacklogFromTG tras normalizar a parentId (locus-backlog-item.js, "parentId es el único
  // campo canónico en JS desde aquí en adelante"). Para ítems ya persistidos item.parent siempre
  // era undefined; para ítems nuevos, parentOverride ahora sí llega resuelto (ver fix en
  // created.push, locus-backlog-item.js).
  const _parentHtml = (code, parentOverride) => {
    if (_itemKindFn({ code }) !== 'TKT') return '';
    const item = getItems().find(i => i.code === code);
    const parentVal = item
      ? (item.parentId || null)
      : (parentOverride || null);
    const label = parentVal ? esc(parentVal) : 'Sin parent';
    return `<div class="mdiff-parent-hint">Parent: ${label}</div>`;
  };

  // T-202606-141: capa visual de depends_on — pills inline bajo el título, alerta cuando hay dep bloqueado.
  // dependsOn: array de códigos. Status resuelto contra getItems() en memoria — sin llamada a Supabase.
  // Ítems aún no persistidos (recién creados en el mismo CHECKPOINT) no existen en getItems() → tratados como bloqueados.
  const _depsHtml = (dependsOn) => {
    if (!Array.isArray(dependsOn) || dependsOn.length === 0) return '';
    const allItems = getItems();
    let hasBlocked = false;
    const pills = dependsOn.map(depCode => {
      const depItem = allItems.find(i => i.code === depCode);
      const depStatus = depItem ? (depItem.status || 'pendiente') : 'pendiente';
      const isDone = depStatus === 'done';
      if (!isDone) hasBlocked = true;
      const cls = isDone ? 'mdiff-dep-pill--done' : 'mdiff-dep-pill--blocked';
      const statusLabel = isDone ? '✓ done' : depStatus;
      return `<span class="mdiff-dep-pill ${cls}">${esc(depCode)} · ${statusLabel}</span>`;
    }).join('');
    const rowCls = hasBlocked ? 'mdiff-deps-row mdiff-deps-row--blocked' : 'mdiff-deps-row';
    return `<div class="${rowCls}">${pills}</div>`;
  };

  // REQ-MERGE-GEN2 TKT1: parámetro itemType (pos 3) — callers pasan i.type || _itemKindFn({code: i.code})
  const _card = (code, desc, accentClass, pillsHtml, extraHtml = '', parentOverride = undefined, sprintOverride = undefined, itemType = undefined) => {
    const typeCls   = _typeClass[itemType] || 'mdiff-type--unknown';
    // R-202605-148: ítem sin tipo declarado muestra '?' — no rompe el render
    const typeName  = _typeName[itemType]  || '?';
    return `
    <div class="mdiff-card mdiff-card--${accentClass} ${typeCls}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(code)}</span>
          ${pillsHtml}
          ${_sprintSelect(code, sprintOverride, itemType)}
        </div>
        ${_parentHtml(code, parentOverride)}
        <div class="mdiff-desc">${esc(desc || '')}</div>
        ${extraHtml}
      </div>
    </div>`;
  };

  // ── Fila de retroceso ──
  // REQ-MERGE-GEN2 TKT1: migrado a i.type || _itemKindFn para tipo Gen2
  const _retrocedoRow = (i, idx) => {
    const itemType  = i.type || _itemKindFn({ code: i.code });
    const typeCls  = _typeClass[itemType] || 'mdiff-type--unknown';
    // R-202605-148: ítem sin tipo declarado muestra '?'
    const typeName = _typeName[itemType]  || '?';
    return `
    <div class="mdiff-card mdiff-card--warn mdiff-card--retroceso ${typeCls}" data-retroceso-idx="${idx}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(i.code)}</span>
          ${_pill('retroceso', `${esc(i.from)} → ${esc(i.to)}`)}
          ${_sprintSelect(i.code, i.sprint, itemType)}
        </div>
        <div class="mdiff-desc">${esc(i.desc || '')}</div>
      </div>
    </div>`;
  };

  // ── Fila de descarte ──
  const _DISCARD_REASONS = ['duplicado', 'fuera de alcance', 'reemplazado', 'obsoleto'];
  // REQ-MERGE-GEN2 TKT1: migrado a i.type || _itemKindFn para tipo Gen2
  const _discardRow = (i, idx) => {
    const itemType  = i.type || _itemKindFn({ code: i.code });
    const typeCls   = _typeClass[itemType] || 'mdiff-type--unknown';
    // R-202605-148: ítem sin tipo declarado muestra '?'
    const typeName  = _typeName[itemType]  || '?';
    // B-202606-053: i.reason viene del diff (CHECKPOINT); si está ausente,
    // consultar discardReason del ítem en getItems() — ítem ya descartado en el backlog.
    const _existingItem = !i.reason ? getItems().find(it => it.code === i.code) : null;
    const _resolvedReason = i.reason || (_existingItem && _existingItem.discardReason) || null;
    const hasReason = !!_resolvedReason;
    const reasonHtml = hasReason
      ? `<span class="mdiff-discard-reason-pill">${esc(_resolvedReason)}${i.ref ? ' · ' + esc(i.ref) : ''}</span>`
      : '';
    return `
    <div class="mdiff-card mdiff-card--red mdiff-card--discard ${typeCls}" data-discard-idx="${idx}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(i.code)}</span>
          ${_pill('discarded', 'descartado')}
          ${reasonHtml}
          ${_sprintSelect(i.code, i.sprint, itemType)}
        </div>
        <div class="mdiff-desc">${esc(i.desc || '')}</div>
      </div>
    </div>`;
  };

  // ── Tarjeta de preview para ítems type:patch ──
  // CAEL-0720-01 TKT1: campos no patcheables de __BR-Ecosystem §8 — nunca generan chip. 'type'
  // incluido porque en el objeto patch su valor es siempre 'patch' (marcador de instrucción del
  // parser), no el tipo del ítem — mostrarlo como campo que "cambia" sería ruido, no información.
  const _PATCH_BLACKLIST = ['type', 'code', 'schema_version', 'ref_id', 'intencion', 'kill_criteria', 'idx'];
  // Función pura — no invoca mergeBacklogFromTG ni applyPatchesFromTG, solo lee patchItem y
  // existingItem para construir el string HTML. El lookup de existingItem lo resuelve el caller
  // (map sobre _patchItems, ver bloque de sección 'patches' más abajo) vía getAnyItem(code) —
  // nunca getItems().find() suelto, que no resuelve ítems ITIL (INC/PRB/KE/CHG).
  const _buildPatchCard = (patchItem, existingItem) => {
    const itemType  = _itemKindFn({ code: patchItem.code });
    const typeCls   = _typeClass[itemType] || 'mdiff-type--unknown';
    const typeName  = _typeName[itemType]  || '?';
    const changes = Object.keys(patchItem)
      .filter(field => !_PATCH_BLACKLIST.includes(field))
      .map(field => ({
        field,
        from: existingItem ? (existingItem[field] != null ? existingItem[field] : null) : '(código no encontrado)',
        to: patchItem[field],
      }));
    return `
    <div class="mdiff-card mdiff-card--accent ${typeCls}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(patchItem.code)} · patch</span>
        </div>
        ${_fieldChips(changes)}
      </div>
    </div>`;
  };

  // R-202605-148: sort INC→REQ→TKT→DISC dentro de un array de ítems del DIFF
  // REQ-MERGE-GEN2 TKT1: migrado a .type || _itemKindFn para tipo Gen2
  const _sortByType = arr => [...arr].sort((a, b) => {
    const ca = a.type || _itemKindFn({ code: a.code });
    const cb = b.type || _itemKindFn({ code: b.code });
    return (_typeOrder[ca] ?? 99) - (_typeOrder[cb] ?? 99);
  });

  // ── Construir secciones con IDs para jump ──
  const _section = (id, accentClass, titleHtml, rows, collapsed = false) => `
    <div class="mdiff-section" id="mdiff-sec-${id}">
      <button class="mdiff-section-header mdiff-section-header--${accentClass}${collapsed ? ' is-collapsed' : ''}"
              data-action="mdiff-toggle-section" type="button">
        <span class="mdiff-section-chevron">▾</span>
        <span>${titleHtml}</span>
      </button>
      <div class="mdiff-section-body${collapsed ? ' is-hidden' : ''}">${rows}</div>
    </div>`;

  let sectionsHtml = '';
  let summaryChipsHtml = '';
  let quickRowsHtml = '';

  // TKT2-diff-visual: created/advanced/updated se resumen como chips arriba —
  // sin header de sección propio, ya que son estados rutinarios sin acción pendiente.
  if (diff.created.length) {
    const rows = _sortByType(diff.created).map(i => _card(i.code, i.desc, 'green', _pill('created', '＋ creado'), _depsHtml(i.dependsOn), i.parent, i.sprint, i.type || _itemKindFn({ code: i.code }))).join('');
    summaryChipsHtml += `<span class="mdiff-summary-chip mdiff-summary-chip--success">Creados <span class="mdiff-sec-count">${diff.created.length}</span></span>`;
    quickRowsHtml += `<div class="mdiff-section-body">${rows}</div>`;
  }
  if (diff.advanced.length) {
    const rows = _sortByType(diff.advanced).map(i => _card(i.code, i.desc, 'blue', _pill('advanced', `${esc(i.from)} → ${esc(i.to)}`), _depsHtml(i.dependsOn), undefined, i.sprint, i.type || _itemKindFn({ code: i.code }))).join('');
    summaryChipsHtml += `<span class="mdiff-summary-chip mdiff-summary-chip--neutral">Avances <span class="mdiff-sec-count">${diff.advanced.length}</span></span>`;
    quickRowsHtml += `<div class="mdiff-section-body">${rows}</div>`;
  }
  if (diff.updated.length) {
    const rows = _sortByType(diff.updated).map(i => _card(i.code, i.desc, 'accent',
      _pill('updated', '✎ actualizado'),
      _fieldChips(i.changes) + _depsHtml(i.dependsOn),
      i.parent, i.sprint, i.type || _itemKindFn({ code: i.code })
    )).join('');
    summaryChipsHtml += `<span class="mdiff-summary-chip mdiff-summary-chip--neutral">Actualizados <span class="mdiff-sec-count">${diff.updated.length}</span></span>`;
    quickRowsHtml += `<div class="mdiff-section-body">${rows}</div>`;
  }

  // TKT-202607-185 (REQ-202607-069 · origen DISC-202607-060): chip de archivos tocados —
  //   _singleMeta.archivosNombres viene de _extractCkptMeta() (locus-session-parse.js,
  //   ver TKT-202607-172/185) — array ya parseado desde ckpt.archivos (string de sesión), no del
  //   campo `archivos` por-ítem de TKT/REQ. Reutiliza .mdiff-summary-chip--neutral (Nova,
  //   Conflicto CSS resuelto en el CHECKPOINT de Nova) — sin clase nueva, mismo tono informativo
  //   que "Actualizados". 1-2 archivos: nombres inline. 3+: conteo. 0/ausente: chip no se renderiza.
  if (Array.isArray(_singleMeta.archivosNombres) && _singleMeta.archivosNombres.length) {
    const _files = _singleMeta.archivosNombres;
    const _filesLabel = _files.length <= 2 ? _files.map(esc).join(', ') : `${_files.length} archivos`;
    summaryChipsHtml += `<span class="mdiff-summary-chip mdiff-summary-chip--neutral">${_filesLabel}</span>`;
  }

  // B-202604-198: ítems que nacen y cierran en el mismo CHECKPOINT — grupo diferenciado
  if (diff.createdAndClosed.length) {
    const rows = _sortByType(diff.createdAndClosed).map(i => _card(
      i.code, i.desc, 'green',
      _pill('created', '＋ creado') + _pill('advanced', 'pendiente → done'),
      `<div class="mdiff-change-hint">Creado y cerrado en esta sesión</div>` + _depsHtml(i.dependsOn),
      i.parent, i.sprint, i.type || _itemKindFn({ code: i.code })
    )).join('');
    sectionsHtml += _section('created-and-closed', 'green', `Creados y cerrados <span class="mdiff-sec-count">${diff.createdAndClosed.length}</span>`, rows);
  }
  // B-202604-198: sugerencias de match [tmp:slug] → ID real existente
  // REQ-MERGE-GEN2 TKT1 AC-2: tmpSuggestions usa tmpCode sin .type — fallback a _itemKindFn({code: i.tmpCode}) || 'UNKNOWN'
  if (diff.tmpSuggestions.length) {
    const rows = _sortByType(diff.tmpSuggestions).map(i => _card(
      i.tmpCode, i.desc, 'warn',
      _pill('warn', '⚠ tmp sin match aplicado'),
      `<div class="mdiff-change-hint">Posible coincidencia: <strong>${esc(i.suggestedCode)}</strong> — ${esc(i.suggestedTitle)}</div>
       <div class="mdiff-change-hint mdiff-change-hint--secondary">Confirma manualmente en el backlog si corresponde al mismo ítem.</div>`,
      undefined, undefined, _itemKindFn({ code: i.tmpCode }) || 'UNKNOWN'
    )).join('');
    sectionsHtml += _section('tmp-suggestions', 'warn', `⚠ TMP sin match confirmado <span class="mdiff-sec-count">${diff.tmpSuggestions.length}</span>`, rows);
  }
  // T-202606-020 · AC-3: sección Transiciones inválidas — advertencia, no bloquea aplicación (AC-4)
  if ((diff.invalidTransition || []).length) {
    const rows = (diff.invalidTransition).map(i =>
      _card(i.code, i.reason, 'warn',
        _pill('warn', `⚠ ${esc(i.type)} → ${esc(i.status)}`),
        undefined, undefined, undefined, i.type || _itemKindFn({ code: i.code })
      )
    ).join('');
    sectionsHtml += _section('invalid-transition', 'warn',
      `⚠ Transiciones inválidas <span class="mdiff-pill mdiff-pill--warn mdiff-sec-count">${diff.invalidTransition.length}</span>`,
      rows
    );
  }
  if (diff.retroceso.length) {
    const rows = _sortByType(diff.retroceso).map((i, idx) => _retrocedoRow(i, idx)).join('');
    sectionsHtml += _section('retroceso', 'warn', `⚠ Retrocesos <span class="mdiff-sec-count">${diff.retroceso.length}</span>`, rows);
  }
  if (diff.discarded.length) {
    const rows = _sortByType(diff.discarded).map((i, idx) => _discardRow(i, idx)).join('');
    sectionsHtml += _section('discarded', 'red', `🗑 Descartes <span class="mdiff-sec-count">${diff.discarded.length}</span>`, rows);
  }
  if (diff.ignored.length) {
    const ignoredCritical = diff.ignored.filter(i => _criticalReasons.includes(i.reason));
    const ignoredOk       = diff.ignored.filter(i => !_criticalReasons.includes(i.reason));
    if (ignoredCritical.length) {
      const rows = _sortByType(ignoredCritical).map(i => {
        let pill, hint = '';
        if (i.reason === 'duplicado')     { pill = _pill('warn', '⚠ duplicado'); hint = i.existingCode ? `<div class="mdiff-change-hint">existe como ${esc(i.existingCode)}</div>` : ''; }
        else if (i.reason === 'sin-status')    { pill = _pill('warn', '⚠ sin status'); }
        else if (i.reason === 'tipo-invalido') { pill = _pill('warn', '⚠ tipo inválido'); }
        return _card(i.code, i.desc, 'warn', pill, hint, undefined, undefined, i.type || _itemKindFn({ code: i.code }));
      }).join('');
      sectionsHtml += _section('attention', 'warn', `⚠ Requieren atención <span class="mdiff-sec-count">${ignoredCritical.length}</span>`, rows);
    }
    if (ignoredOk.length) {
      const rows = _sortByType(ignoredOk).map(i => _card(i.code, i.desc, 'muted', _pill('ignored', 'sin cambios'), undefined, undefined, undefined, i.type || _itemKindFn({ code: i.code }))).join('');
      // Sin cambios colapsado por defecto
      sectionsHtml += _section('unchanged', 'muted', `Sin cambios <span class="mdiff-sec-count">${ignoredOk.length}</span>`, rows, true);
    }
  }

  // CAEL-0720-01 TKT1: preview de ítems type:patch — no participan del dry-run de
  // mergeBacklogFromTG (se filtran de tgItems antes del diff, línea ~213), así que no aparecen en
  // ninguna categoría de diff.*. Cada patch se compara contra su ítem existente vía getAnyItem —
  // resuelve tanto backlog (getItems) como incidents (getIncidents), a diferencia de un
  // getItems().find() suelto. Badge de conteo total ya sumaba _patchItems.length desde mod:46 —
  // sin cambio aquí (AC4).
  if (_patchItems.length) {
    const rows = _patchItems.map(p => _buildPatchCard(p, getAnyItem(p.code))).join('');
    sectionsHtml += _section('patches', 'accent', `✎ Cambios directos (patch) <span class="mdiff-sec-count">${_patchItems.length}</span>`, rows);
  }

  // TKT2 (REQ CAEL-0720-02, AC de coherencia): resolver de búsqueda para diff.unresolvedRefs —
  // consumido desde el único punto de entrada expuesto por mergeBacklogFromTG (locus-backlog-item.js
  // L2801). Cubre las tres fuentes que unresolvedRefs puede contener: ref-id-sin-declarante
  // ({code, field, ref_id, title} — _normalizeRefIdValue), tmp-slug-no-resoluble y ref-no-resuelta
  // ({code, field, rawValue, source} — _assignPendingIds, escalar y dependsOn). Markup literal
  // entregado por Nova (turno anterior) — sin modificar estructura. Filtrado/selección se resuelve
  // en runtime (ver _mdiffUnresolvedFilter/_mdiffUnresolvedSelect más abajo) — este bloque solo
  // construye el shell inicial por entrada.
  if (Array.isArray(diff.unresolvedRefs) && diff.unresolvedRefs.length) {
    const rows = diff.unresolvedRefs.map((u, uIdx) => {
      const _label = u.field;
      const _prefill = u.title || '';
      return `<div class="mdiff-unresolved-row" data-unresolved-idx="${uIdx}">
        <span class="mdiff-unresolved-label">${esc(_label)}</span>
        <div class="mdiff-unresolved-search-wrap">
          <input type="text" class="bl-search-input" data-action="mdiff-unresolved-search"
            data-code="${esc(u.code)}" data-field="${esc(u.field)}" data-unresolved-idx="${uIdx}"
            aria-label="Buscar ítem para ${esc(_label)}"
            placeholder="Buscar por código o título…" value="${esc(_prefill)}">
          <div class="sps-dropdown mdiff-unresolved-dropdown" role="menu" hidden></div>
        </div>
      </div>`;
    }).join('');
    sectionsHtml += _section('unresolved', 'warn', `🔍 Referencias sin resolver <span class="mdiff-sec-count">${diff.unresolvedRefs.length}</span>`, rows);
  }

  // ── Inyectar en shell ──
  const overlay = document.getElementById('merge-diff-overlay');
  if (!overlay) return;
  // TKT2 (TKT-202607-145, Rune): #modal-split-shell es ahora el único .modal-overlay real
  // (Opción A, merge completo — ver design_intent: split_view_merged_shell). #merge-diff-overlay
  // ya no abre/cierra su propio backdrop — solo alterna --empty/--filled dentro del shell.
  const shell = document.getElementById('modal-split-shell');
  const header      = document.getElementById('merge-diff-header');
  const body        = document.getElementById('merge-diff-body');
  const footer      = document.getElementById('merge-diff-footer');
  const summaryChips = document.getElementById('mdiff-summary-chips');
  const pendingList  = document.getElementById('mdiff-pending-list');

  // TKT3 (REQ-[pendiente-ID] · migración Step 0 DIFF → panel Sprint subtab): _sprintProposal /
  // _onApproveProposal locales retiradas — Step 0 ya no existe en este archivo. El gate de
  // exclusividad §12 (arriba, antes del early-return) sigue leyendo _ckptMeta.sprintProposal
  // directo — no dependía de esta const local. onApproveProposal se retira también de
  // locus-session-save.js en este mismo TKT (sin consumidores).

  // T-202606-038: sección de campos narrativos — aparece antes de las secciones de backlog.
  // AC-4: campos vacíos no renderizan fila. AC-3: Próximo paso al final con separador visual.
  // AC-7: encabezado visualmente distinguible del encabezado de secciones de backlog.
  // B-202606-062: movida antes del bloque de renderizado del body — const no hace hoisting, ReferenceError garantizado si se invoca antes de declaración
  const _buildNarrativeSection = () => {
    const _rows = [
      { label: 'Resumen',     value: _metaResumen     },
      { label: 'Aprendizaje', value: _metaAprendizaje },
      { label: 'Bloqueantes', value: _metaBloqueantes },
      { label: 'Decisión',    value: _metaDecision    },
    ].filter(r => r.value).map(r =>
      `<div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">${esc(r.label)}</span>
        <span class="mdiff-narrative-value">${esc(r.value)}</span>
      </div>`
    ).join('');

    const _proxPasoHtml = _metaSiguiente
      ? `<div class="mdiff-narrative-proxpaso">
          <span class="mdiff-narrative-label">Siguiente</span>
          <span class="mdiff-narrative-value">${esc(_metaSiguiente)}</span>
        </div>`
      : '';

    // B-202606-024: condición corregida — _rows es string, !_rows evalúa '' como falsy
    // aunque _proxPasoHtml tenga valor. Evaluación explícita de ambos.
    if (!_rows.length && !_proxPasoHtml) return '';

    return `<div class="mdiff-narrative-section">
      <div class="mdiff-narrative-header">Contexto de sesión</div>
      ${_rows}
      ${_proxPasoHtml ? `<div class="mdiff-narrative-proxpaso-wrap">${_proxPasoHtml}</div>` : ''}
    </div>`;
  };

  // TKT2 (REQ CAEL-0717-01): tarjeta de liberación de Finn — mismo patrón funcional que
  // _buildNarrativeSection() (misma familia visual .mdiff-narrative-row/-label/-value para
  // que_hace/que_no_hace/listo_para), insertada ANTES de ella en el concat de body.innerHTML:
  // el resultado liberado precede a la narrativa de la sesión que lo produjo.
  // Fuente: _ckptMeta.finnRelease (schema finn_release, BR-Ecosystem §8) — null si el
  // CHECKPOINT no lo declara (AC3 del TKT: sin finn_release, sin tarjeta, sin hueco visual).
  const _buildFinnReleaseSection = () => {
    const _fr = _singleMeta.finnRelease; // TKT3 (CAEL-0718-01): antes _ckptMeta.finnRelease directo — ver _singleMeta arriba
    if (!_fr || typeof _fr !== 'object') return '';

    // AC4: cada check lleva texto accesible "Verificado: [AC]" junto al símbolo — no solo color/ícono.
    // Entrada de schema: "AC1 — sí" → se extrae el segmento antes de " — " como label del AC.
    const _probadoHtml = (Array.isArray(_fr.probado) && _fr.probado.length)
      ? `<div class="mdiff-finnrelease-probado">${
          _fr.probado.map(p => {
            const _label = String(p).split(' — ')[0].trim();
            return `<span class="mdiff-finnrelease-check"><span class="mdiff-finnrelease-check-icon" aria-hidden="true">✓</span>Verificado: ${esc(_label)}</span>`;
          }).join('')
        }</div>`
      : '';

    // AC2: fila 6 condicional — solo si docs_pendientes tiene al menos un elemento.
    const _docsHtml = (Array.isArray(_fr.docs_pendientes) && _fr.docs_pendientes.length)
      ? `<div class="mdiff-finnrelease-docs-wrap">
          <div class="mdiff-finnrelease-docs-label">Docs pendientes</div>
          <div class="mdiff-finnrelease-docs-list">${
            _fr.docs_pendientes.map(d => `<div class="mdiff-pending-item">${esc(d)}</div>`).join('')
          }</div>
        </div>`
      : '';

    // AC1: orden fijo — liberado → que_hace → que_no_hace → probado → listo_para → (docs, condicional)
    return `<div class="mdiff-finnrelease-section">
      <div class="mdiff-finnrelease-header">Liberado: ${esc(_fr.liberado || '')}</div>
      <div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">Qué hace</span>
        <span class="mdiff-narrative-value">${esc(_fr.que_hace || '')}</span>
      </div>
      <div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">Qué no hace</span>
        <span class="mdiff-narrative-value">${esc(_fr.que_no_hace || '')}</span>
      </div>
      ${_probadoHtml}
      <div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">Listo para</span>
        <span class="mdiff-narrative-value">${esc(_fr.listo_para || '')}</span>
      </div>
      ${_docsHtml}
    </div>`;
  };

  // TKT3 (REQ CAEL-0718-01 · AC1): tarjetas atribuidas por bloque cuando ckptMeta.metas trae 2+
  // entradas — una tarjeta por bloque, orden de aparición del batch (garantizado por TKT1:
  // metas[i] corresponde al bloque i-ésimo válido). Reusa 100% clases existentes — cero CSS
  // nuevo (no_incluye de este TKT; layout fino es TKT5). Header del atributo: fila
  // .mdiff-narrative-row con rol como label (izquierda) y título como value (derecha) — mismo
  // patrón label/value que el resto del panel, sin clase nueva. Badge "liberado": se logra
  // incluyendo el bloque .mdiff-finnrelease-header ("Liberado: ...") ya existente — su token de
  // color success ya comunica el estado, sin necesidad de una clase de badge dedicada.
  const _buildAttributedNarrativeRows = (meta) => {
    const _rows = [
      { label: 'Resumen',     value: meta.resumen      || '' },
      { label: 'Aprendizaje', value: meta.aprendizaje  || '' },
      { label: 'Bloqueantes', value: meta.bloqueantes  || '' },
      { label: 'Decisión',    value: meta.decision     || '' },
    ].filter(r => r.value).map(r =>
      `<div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">${esc(r.label)}</span>
        <span class="mdiff-narrative-value">${esc(r.value)}</span>
      </div>`
    ).join('');

    // TKT-202607-172 (REQ-202607-058 · AC1/AC4-6): misma precedencia que el flujo single
    // (const _metaSiguiente, más arriba en este archivo) — nextStep > nextRole > proximoPaso.
    // meta.nextStep/meta.nextRole llegan poblados desde _extractCkptMeta (locus-session-parse.js,
    // AC2/AC3) vía metas[i], siempre presentes en el flujo batch — sin dependencia de
    // locus-session-save.js, a diferencia del flujo single (ver Hallazgo fuera de scope).
    const _metaSiguienteAttr = meta.nextStep || meta.nextRole || meta.proximoPaso || '';
    const _proxPasoHtml = _metaSiguienteAttr
      ? `<div class="mdiff-narrative-proxpaso-wrap">
          <div class="mdiff-narrative-proxpaso">
            <span class="mdiff-narrative-label">Siguiente</span>
            <span class="mdiff-narrative-value">${esc(_metaSiguienteAttr)}</span>
          </div>
        </div>`
      : '';

    return _rows + _proxPasoHtml;
  };

  // Mismo orden fijo AC1 del TKT2 (liberado → que_hace → que_no_hace → probado → listo_para →
  // docs) parametrizado sobre un meta puntual del batch en vez del _singleMeta del closure.
  const _buildAttributedFinnReleaseHtml = (meta) => {
    const _fr = meta.finnRelease;
    if (!_fr || typeof _fr !== 'object') return { html: '', hasRelease: false };
    const _probadoHtml = (Array.isArray(_fr.probado) && _fr.probado.length)
      ? `<div class="mdiff-finnrelease-probado">${
          _fr.probado.map(p => {
            const _label = String(p).split(' — ')[0].trim();
            return `<span class="mdiff-finnrelease-check"><span class="mdiff-finnrelease-check-icon" aria-hidden="true">✓</span>Verificado: ${esc(_label)}</span>`;
          }).join('')
        }</div>`
      : '';
    const _docsHtml = (Array.isArray(_fr.docs_pendientes) && _fr.docs_pendientes.length)
      ? `<div class="mdiff-finnrelease-docs-wrap">
          <div class="mdiff-finnrelease-docs-label">Docs pendientes</div>
          <div class="mdiff-finnrelease-docs-list">${
            _fr.docs_pendientes.map(d => `<div class="mdiff-pending-item">${esc(d)}</div>`).join('')
          }</div>
        </div>`
      : '';
    const html = `<div class="mdiff-finnrelease-header">Liberado: ${esc(_fr.liberado || '')}</div>
      <div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">Qué hace</span>
        <span class="mdiff-narrative-value">${esc(_fr.que_hace || '')}</span>
      </div>
      <div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">Qué no hace</span>
        <span class="mdiff-narrative-value">${esc(_fr.que_no_hace || '')}</span>
      </div>
      ${_probadoHtml}
      <div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">Listo para</span>
        <span class="mdiff-narrative-value">${esc(_fr.listo_para || '')}</span>
      </div>
      ${_docsHtml}`;
    return { html, hasRelease: true };
  };

  // TKT-078 (AC corregido — Opción C, 2026-07-24): detalle completo de ítems por bloque,
  // filtrando las listas ya clasificadas por idx (propagado en TKT2/mergeBacklogFromTG y
  // TKT1/_resolveCheckpointBatch) contra el índice del bloque — sin tocar la clasificación
  // de diff ni reestructurar sectionsHtml combinado. Función pura de presentación: no muta
  // los arrays del diff, no invoca mergeBacklogFromTG ni applyPatchesFromTG.
  // no_incluye (TKT-078): sin botón de aprobación granular por bloque · sin deshabilitar
  // interacción con tarjetas fuera de orden · sin clase CSS nueva fuera de lo declarado por
  // Nova en TKT-077 (.mdiff-block-badge--ok/--flag/--skipped).
  const _itemsForBlockIdx = metaIdx => {
    const _pick = (arr, builder) => (Array.isArray(arr) ? arr : [])
      .filter(i => i && i.idx === metaIdx)
      .map(builder);
    return [
      ..._pick(diff.created, i => _card(i.code, i.desc, 'green', _pill('created', '＋ creado'), _depsHtml(i.dependsOn), i.parent, i.sprint, i.type || _itemKindFn({ code: i.code }))),
      ..._pick(diff.advanced, i => _card(i.code, i.desc, 'blue', _pill('advanced', `${esc(i.from)} → ${esc(i.to)}`), _depsHtml(i.dependsOn), undefined, i.sprint, i.type || _itemKindFn({ code: i.code }))),
      ..._pick(diff.updated, i => _card(i.code, i.desc, 'accent', _pill('updated', '✎ actualizado'), _fieldChips(i.changes) + _depsHtml(i.dependsOn), i.parent, i.sprint, i.type || _itemKindFn({ code: i.code }))),
      ..._pick(diff.createdAndClosed, i => _card(i.code, i.desc, 'green', _pill('created', '＋ creado') + _pill('advanced', 'pendiente → done'), `<div class="mdiff-change-hint">Creado y cerrado en esta sesión</div>` + _depsHtml(i.dependsOn), i.parent, i.sprint, i.type || _itemKindFn({ code: i.code }))),
      ..._pick(diff.retroceso, (i) => _retrocedoRow(i, i.idx)),
      ..._pick(diff.discarded, (i) => _discardRow(i, i.idx)),
      // Bug 2 (Finn, Momento 1): diff.ignored también lleva idx (locus-backlog-item.js
      // L2440-2776) y es el escenario real que el AC de error state describía como "skipped" —
      // los bloques inválidos no llegan a tener entrada en metas, por lo que nunca aparecen
      // aquí. Reusa el accent 'muted' de ignoredOk en sectionsHtml, con el i.reason real como
      // label del pill en vez del literal fijo 'sin cambios' (los 5 reasons de ignored no son
      // todos "sin cambios" — ver _criticalReasons).
      ..._pick(diff.ignored, i => _card(i.code, i.desc, 'muted', _pill('ignored', esc(i.reason || 'sin cambios')), undefined, undefined, undefined, i.type || _itemKindFn({ code: i.code }))),
    ];
  };

  // Clasificación del badge (Nova, TKT-077 — .mdiff-block-badge--ok/--flag/--skipped):
  // 'flag' si el bloque aportó algún retroceso/descarte (requiere atención), 'skipped' si el
  // filtro por meta.idx no produjo ningún ítem en NINGUNA de las 7 categorías (incluyendo
  // ignored) — ese es el único caso real de "bloque sin detalle" dentro de metas, dado que los
  // bloques inválidos (skipped en _resolveCheckpointBatch) nunca llegan a tener entrada de
  // meta. 'ok' en cualquier otro caso con ítems.
  const _blockBadge = (metaIdx, itemsHtmlArr) => {
    if (!itemsHtmlArr.length) return { cls: 'skipped', label: 'no leído' };
    // AC3 de TKT-202607-077 (verificado por Finn contra AC literal, no solo contra la
    // interpretación previa): el badge 'con flags' muestra el conteo real, ej. "2 flags" — no
    // un texto fijo. flagCount = retroceso + discarded de este bloque específico.
    const _flagCount = (Array.isArray(diff.retroceso) ? diff.retroceso.filter(i => i && i.idx === metaIdx).length : 0)
      + (Array.isArray(diff.discarded) ? diff.discarded.filter(i => i && i.idx === metaIdx).length : 0);
    if (!_flagCount) return { cls: 'ok', label: 'sin flags' };
    return { cls: 'flag', label: `${_flagCount} flag${_flagCount === 1 ? '' : 's'}` };
  };

  // TKT-202607-170 (REQ-202607-058 · AC corregido en Fase 5 v2, grounding contra
  // locus-session-parse.js L2731-2738 y L3027): categoría semántica del bloque —
  // distinta de _blockBadge (arriba), que mide resultado del diff (ok/flag/skipped), no
  // qué tipo de acción de ecosistema es el CHECKPOINT. Clasifica sobre tgItems/_patchItems
  // ya combinados y filtrados por meta.idx — no recibe el objeto CHECKPOINT crudo, esa
  // forma de entrada no existe en este archivo (confirmado: _ckptMetas solo trae el
  // resumen narrativo vía _extractCkptMeta, nunca items/draft/status por bloque).
  // Precedencia fija (AC7): liberación > incidente > avalado > cierre > entrega >
  // borrador > sin-clasificar. INC/PRB/CHG llegan a tgItems vía _buildItilItem con
  // type/idx intactos (mismo spread {...it, idx:b.idx} que REQ/TKT/DISC en
  // _resolveCheckpointBatch) — sin necesidad de parámetro adicional.
  // TKT-202607-170 (AC corregido en Fase 5 v2, sobre patch de Cael tras hallazgo de Finn en
  // Momento 1): claves renombradas para coincidir exactamente con los 7 sufijos ya
  // implementados en locus-backlog-item.css mod:79 (Nova, TKT-202607-171) —
  // .mdiff-ckpt-category--{borrador|avalado|entrega|cierre|liberado|incidente|lite}.
  // 'liberacion' → 'liberado'. 'sinclasificar' → 'lite' — mismo valor para el caso vacío
  // (bloque sin ningún ítem REQ/TKT/INC/PRB/CHG) y el estado sin resolver (ítem presente que
  // no matchea ninguna de las 6 ramas restantes); AC corregido exige un solo valor de retorno
  // para ambos, sin octava categoría (no_incluye).
  const _CKPT_CATEGORY_LABELS = {
    liberado:  'Liberación',
    incidente: 'Incidente',
    avalado:   'Avalado',
    cierre:    'Cierre',
    entrega:   'Entrega',
    borrador:  'Borrador',
    lite:      'Lite'
  };
  const _ckptCategoryFor = meta => {
    if (meta && meta.finnRelease) return 'liberado';
    const _blockTg    = tgItems.filter(i => i && i.idx === meta.idx);
    const _blockPatch = _patchItems.filter(i => i && i.idx === meta.idx);
    if (_blockTg.some(i => i.type === 'INC' || i.type === 'PRB' || i.type === 'CHG')) return 'incidente';
    if (_blockPatch.some(p => p.draft === false && p.verified_by)) return 'avalado';
    if (_blockTg.some(i => i.status === 'done') || _blockPatch.some(p => p.status === 'done')) return 'cierre';
    if (_blockTg.some(i => i.status === 'en-revision')) return 'entrega';
    if (_blockTg.some(i => i.draft === true)) return 'borrador';
    return 'lite';
  };

  // TKT-202607-172 (AC-9a, REQ-202607-058 — redactado por Cael tras gap de Rune sobre el AC-9
  // original, que fusionaba 'docs pendientes' + 'archivos tocados' en un solo criterio y asumía
  // un campo `meta.archivos` inexistente en el contrato de _extractCkptMeta, __BR-Ecosystem §2/
  // _Locus-module-contracts §2). Chip de docs pendientes por tarjeta — scoped a meta.docUpdates
  // del bloque activo, a diferencia de _buildDocUpdatesBlock (TKT6, más abajo en este archivo),
  // que agrega TODOS los bloques del batch en una sola sección al pie del panel. Reusa las
  // mismas clases .mdiff-docupdate-* ya entregadas por Nova en TKT6 — Archivos: de TKT-172 no
  // declara ningún .css, sin CSS nuevo. Ausencia total si meta.docUpdates está vacío/ausente —
  // mismo criterio de _Locus-ux-ref §E-14 ya aplicado al resto de secciones condicionales de la
  // tarjeta atribuida (_releaseInfo/_narrativeHtml/_itemsBlockHtml).
  const _buildAttributedDocsChip = (meta) => {
    const _docs = Array.isArray(meta.docUpdates) ? meta.docUpdates : [];
    if (!_docs.length) return '';
    const _rows = _docs
      .filter(d => d && typeof d === 'object')
      .map(d => `<div class="mdiff-docupdate-row">
        <span class="mdiff-docupdate-doc">${esc(d.doc || '')}</span>
        <span class="mdiff-docupdate-section">${esc(d.section || '')}</span>
        <span class="mdiff-docupdate-action">${esc(d.action || '')}</span>
      </div>`)
      .join('');
    if (!_rows) return '';
    return `<div class="mdiff-docupdate-section-wrap">
      <div class="mdiff-docupdate-header">Docs pendientes</div>
      ${_rows}
    </div>`;
  };

  const _buildAttributedCardsBlock = () => {
    if (!_ckptMetas || _ckptMetas.length < 2) return '';

    // Bug 1 (Finn, Momento 1): filtrar por el índice de posición de .map() rompía en cuanto el
    // batch mezclaba bloques válidos e inválidos — metas excluye los inválidos (solo van a
    // skipped en _resolveCheckpointBatch, locus-session-parse.js L2539-2612), desalineando
    // posición vs meta.idx real (b.idx). Cada meta ya declara su propio idx explícito
    // (TKT1/_resolveCheckpointBatch) — usarlo directamente en vez del índice de iteración.
    return _ckptMetas.map(meta => {
      const _narrativeHtml = _buildAttributedNarrativeRows(meta);
      const _releaseInfo   = _buildAttributedFinnReleaseHtml(meta);
      const _itemCards     = _itemsForBlockIdx(meta.idx);
      const _badge         = _blockBadge(meta.idx, _itemCards);
      // TKT-202607-170: categoría calculada una vez por bloque, reusada en el badge y en el
      // modificador de sección (liberado). Sufijos verificados contra locus-backlog-item.css
      // mod:79 (Nova, TKT-202607-171) en Fase 5 v2 — ya no es assumption: las 7 claves de
      // _CKPT_CATEGORY_LABELS coinciden exactamente con .mdiff-ckpt-category--[key] entregado.
      const _category      = _ckptCategoryFor(meta);
      // TKT-202607-172 (AC-9a): calculado una vez por bloque, mismo patrón que _category/_badge.
      const _docsChip      = _buildAttributedDocsChip(meta);

      // Bloque sin ningún campo narrativo, sin finn_release, sin ítems filtrados y sin docs
      // pendientes propios → no genera tarjeta (mismo criterio que hoy: ausencia total, sin
      // hueco visual — extendido en AC-9a para no dejar huérfano un bloque cuyo único contenido
      // es un doc_update).
      if (!_narrativeHtml && !_releaseInfo.hasRelease && !_itemCards.length && !_docsChip) return '';

      const _attrRow = `<div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">${esc(meta.rol || '')}</span>
        <span class="mdiff-narrative-value">${esc(meta.titulo || '')}</span>
        <span class="mdiff-ckpt-category mdiff-ckpt-category--${_category}">${esc(_CKPT_CATEGORY_LABELS[_category])}</span>
        <span class="mdiff-block-badge mdiff-block-badge--${_badge.cls}">${esc(_badge.label)}</span>
      </div>`;

      // Estado de error (AC corregido): bloque válido cuyo filtro por meta.idx no produce
      // ningún ítem en ninguna de las 7 categorías (incluyendo ignored) → solo el badge
      // 'no leído', sin sección de detalle vacía.
      const _itemsBlockHtml = _itemCards.length
        ? `<div class="mdiff-section-body">${_itemCards.join('')}</div>`
        : '';

      // TKT-202607-086: cada tarjeta atribuida es ahora expand/collapse independiente — mismo
      // mecanismo que _section() (button.mdiff-section-header + div.mdiff-section-body
      // hermanos, toggle vía data-action="mdiff-toggle-section" → _mdiffToggleSection, que
      // localiza el body con btn.nextElementSibling). Sin accent modifier — no hay semántica de
      // color de tipo-de-diff para una tarjeta atribuida (ver CSS dependencies, Nova). Inicia
      // expandida por default (sin is-collapsed), igual que _section() sin el parámetro
      // collapsed. Independiente por construcción: cada botón solo controla su propio
      // nextElementSibling, sin estado compartido entre tarjetas del mismo batch.
      const _sectionCls = _category === 'liberado'
        ? 'mdiff-narrative-section mdiff-narrative-section--liberado'
        : 'mdiff-narrative-section';

      return `<div class="${_sectionCls}">
        <button class="mdiff-section-header" data-action="mdiff-toggle-section" type="button">${_attrRow}</button>
        <div class="mdiff-section-body">
          ${_releaseInfo.html}
          ${_narrativeHtml}
          ${_docsChip}
          ${_itemsBlockHtml}
        </div>
      </div>`;
    }).join('');
  };

  // TKT6 (REQ CAEL-0718-01): Docs pendientes y Observaciones de Finn — agregados de TODOS los
  // bloques del batch (o el único meta del flujo single), en orden de aparición. Cierra el gap
  // detectado en la sesión de cierre del REQ: docUpdates/finnObservations se extraían desde TKT1
  // pero ningún consumidor los leía en este archivo — código muerto en ambos flujos (A y B) por
  // igual, no una regresión introducida por el trabajo de batch. no_incluye: solo lectura, sin
  // acción de aplicar/descartar — eso sigue siendo de Cael/Vera (BR-Ecosystem §11).
  const _allMetasForAggregation = (_ckptMetas && _ckptMetas.length) ? _ckptMetas : [_singleMeta];

  const _buildDocUpdatesBlock = () => {
    const _rows = [];
    _allMetasForAggregation.forEach(m => {
      (Array.isArray(m.docUpdates) ? m.docUpdates : []).forEach(d => {
        if (!d || typeof d !== 'object') return;
        _rows.push(`<div class="mdiff-docupdate-row">
          <span class="mdiff-docupdate-doc">${esc(d.doc || '')}</span>
          <span class="mdiff-docupdate-section">${esc(d.section || '')}</span>
          <span class="mdiff-docupdate-action">${esc(d.action || '')}</span>
        </div>`);
      });
    });
    if (!_rows.length) return ''; // AC error: sin docUpdates en ningún meta → sin hueco visual
    return `<div class="mdiff-docupdate-section-wrap">
      <div class="mdiff-docupdate-header">Docs pendientes</div>
      ${_rows.join('')}
    </div>`;
  };

  const _buildFinnObservationsBlock = () => {
    const _rows = [];
    _allMetasForAggregation.forEach(m => {
      (Array.isArray(m.finnObservations) ? m.finnObservations : []).forEach(o => {
        if (!o || typeof o !== 'object') return;
        const _severity = o.type === 'regresion' ? 'danger' : 'warning';
        const _texto = o.type === 'regresion' ? (o.comportamiento_actual || '')
          : o.type === 'gap_contrato' ? (o.funcion_afectada || '')
          : (o.hallazgo || '');
        _rows.push(`<div class="mdiff-finnobs-row mdiff-finnobs-row--${_severity}">
          <span class="mdiff-finnobs-type">${esc(o.type || '')}</span>
          <span class="mdiff-finnobs-texto">${esc(_texto)}</span>
        </div>`);
      });
    });
    if (!_rows.length) return '';
    return `<div class="mdiff-finnobs-section-wrap">
      <div class="mdiff-finnobs-header">Observaciones de Finn</div>
      ${_rows.join('')}
    </div>`;
  };

  // TKT2-diff-visual: created/advanced/updated se muestran como chips de resumen —
  // sin header de sección propio, colapsable-toggle ni botón de sección independiente.
  // Las cards individuales (quickRowsHtml) se listan directo debajo de los chips.
  const _buildSummaryChipsBlock = () => {
    if (!summaryChipsHtml) return '';
    return `<div class="mdiff-summary-chips">${summaryChipsHtml}</div>${quickRowsHtml}`;
  };



  // TKT-202606-011 AC3: banner persistente cuando el CHECKPOINT es borrador (draft:true en origen,
  // ai._parsed.draft → _ckptMeta.draftPending). No es una sugerencia descartable como
  // _renderTriggeredBySuggestion — es el estado del panel mientras espera aval de Finn.
  // Sin botones de acción: el founder revisa los ítems propuestos, no decide nada aquí.
  const _draftPending = _ckptMeta.draftPending === true;
  const _renderDraftPendingBanner = () => {
    if (!_draftPending || !body) return;
    const _bannerHtml = `
      <div class="mdiff-step0" id="mdiff-draft-banner">
        <div class="mdiff-step0-header">
          <span class="mdiff-step0-badge">Pendiente de aval Finn</span>
          <span class="mdiff-step0-title">Borrador de especificación</span>
        </div>
        <p class="mdiff-icebox-gate-desc">Este CHECKPOINT tiene draft:true — Finn aún no avaló los AC. Puedes guardar de todas formas: el ítem persiste con código real y queda invisible en Q-Backlog, sprint y Kanban hasta que Finn emita el aval (draft:false).</p>
      </div>`;
    body.insertAdjacentHTML('afterbegin', _bannerHtml);
  };

  // T-202606-021: Trigger 3 — sugerencia 1-tap de sprint para B con triggered_by en sprint activo.
  // Llega via ckptMeta.triggeredBySuggestion: { b, suggestedSprint, onAccept }. No-bloqueante:
  // ignorar deja el B en icebox (default). Inserta el prompt al inicio del body.
  const _tgSuggestion = _ckptMeta.triggeredBySuggestion || null;
  const _renderTriggeredBySuggestion = () => {
    if (!_tgSuggestion || !body) return;
    const { b, suggestedSprint, onAccept } = _tgSuggestion;
    const _promptHtml = `
      <div class="mdiff-tgsugg-gate" id="mdiff-tgsugg-gate">
        <div class="mdiff-icebox-gate-header">
          <span class="mdiff-step0-badge">Sugerencia</span>
          <span class="mdiff-step0-title">Mover B a sprint activo</span>
        </div>
        <p class="mdiff-icebox-gate-desc">${esc(b.code || '[pendiente-ID]')} — ${esc(b.title || '')} fue disparado por un ítem en ${esc(suggestedSprint)}. ¿Asignar este B al mismo sprint?</p>
        <div class="mdiff-step0-actions">
          <button class="mdiff-btn mdiff-btn--primary" id="mdiff-tgsugg-accept">✓ Mover a ${esc(suggestedSprint)}</button>
          <button class="mdiff-btn mdiff-btn--cancel" id="mdiff-tgsugg-dismiss">Ignorar</button>
        </div>
      </div>`;
    body.insertAdjacentHTML('afterbegin', _promptHtml);

    const _acceptBtn  = document.getElementById('mdiff-tgsugg-accept');
    const _dismissBtn = document.getElementById('mdiff-tgsugg-dismiss');
    if (_acceptBtn) {
      _acceptBtn.addEventListener('click', () => {
        if (typeof onAccept === 'function') onAccept();
        const _gateEl = document.getElementById('mdiff-tgsugg-gate');
        if (_gateEl) _gateEl.remove();
      }, { once: true });
    }
    if (_dismissBtn) {
      _dismissBtn.addEventListener('click', () => {
        const _gateEl = document.getElementById('mdiff-tgsugg-gate');
        if (_gateEl) _gateEl.remove();
      }, { once: true });
    }
  };


  // Header: título + contexto de paso
  if (header) {
    const projName = getActiveProject()
      ? getActiveProject().name : '';
    // T-202606-038 AC-2: cuando no hay ítems, el header muestra '0 ítems' sin contador distorsionado
    const totalLabel = total > 0 ? `${total} ítem${total !== 1 ? 's' : ''}` : '0 ítems';
    // TKT3 (REQ CAEL-01): el header hereda el mismo chip que el founder ya vio en el card
    // antes de abrir el panel — mismo dato (chipTonesFromDiff), mismo componente (.diff-chip*).
    const _headerChipTones = chipTonesFromDiff(diff);
    const _headerChipsHtml = _headerChipTones.length
      ? `<div class="mdiff-header-chips">${_renderChipTones(_headerChipTones)}</div>` : '';
    // TKT3 (REQ CAEL-0718-01 · AC3): con 2+ entradas en ckptMeta.metas, el step-label pasa de
    // "Guardar sesión" a "Revisión de batch · N CHECKPOINTs". Con 1 entrada o sin metas —
    // comportamiento idéntico al actual (AC2/AC3 edge case).
    const _stepLabel = (_ckptMetas && _ckptMetas.length >= 2)
      ? `Revisión de batch · ${_ckptMetas.length} CHECKPOINTs`
      : 'Guardar sesión';
    header.innerHTML = `
      <div class="mdiff-header-inner">
        <div class="mdiff-header-left">
          <div class="mdiff-step-label">${esc(_stepLabel)}</div>
          <div class="mdiff-header-title">Revisión de cambios${projName ? ` · <span class="mdiff-proj-name">${esc(projName)}</span>` : ''}</div>
          ${_headerChipsHtml}
        </div>
        <div class="mdiff-header-total">${totalLabel}</div>
      </div>`;
  }

  // Body: sección narrativa + secciones de backlog
  // T-202606-155: si hay Step 0, body.innerHTML ya fue asignado arriba — no sobreescribir
  // TKT3 (REQ-[pendiente-ID]): antes de este TKT, Step 0 asignaba body.innerHTML directamente y
  // este bloque se saltaba (`!_sprintProposal`). Sin Step 0, body siempre renderiza narrativa +
  // secciones — condición reducida a solo `body`.
  if (body) {
    // TKT2 (REQ CAEL-0717-01): finn_release precede a la narrativa de sesión — es el resultado
    // liberado, no el contexto de cómo se produjo. Orden: finnRelease → narrative → chips → secciones.
    // TKT3 (REQ CAEL-0718-01 · AC1/AC2): 2+ bloques → tarjetas atribuidas por bloque. 1 bloque
    // o sin metas → mismo orden de siempre (finnRelease → narrative), cero regresión sobre A.
    const _narrativeBlockHtml = (_ckptMetas && _ckptMetas.length >= 2)
      ? _buildAttributedCardsBlock()
      : _buildFinnReleaseSection() + _buildNarrativeSection();
    body.innerHTML = _narrativeBlockHtml + _buildDocUpdatesBlock() + _buildFinnObservationsBlock() + _buildSummaryChipsBlock() + sectionsHtml;
    _renderTriggeredBySuggestion();
    _renderDraftPendingBanner();
  }

  // Summary chips: clickeables con jump a sección
  const _chipDefs = [
    { key: 'created',           id: 'created',           label: 'creados',            cls: 'green',  count: diff.created.length },
    { key: 'createdAndClosed',  id: 'created-and-closed', label: 'creados y cerrados', cls: 'green', count: diff.createdAndClosed.length },
    { key: 'advanced',          id: 'advanced',          label: 'avances',            cls: 'blue',   count: diff.advanced.length },
    { key: 'updated',           id: 'updated',           label: 'actualizados',       cls: 'accent', count: diff.updated.length },
    { key: 'retroceso',         id: 'retroceso',         label: 'retrocesos',         cls: 'warn',   count: diff.retroceso.length },
    { key: 'discarded',         id: 'discarded',         label: 'descartes',          cls: 'red',    count: diff.discarded.length },
    { key: 'tmpSuggestions',    id: 'tmp-suggestions',   label: 'tmp sin match',      cls: 'warn',   count: diff.tmpSuggestions.length },
    { key: 'invalidTransition', id: 'invalid-transition', label: 'transiciones inv.', cls: 'warn',   count: (diff.invalidTransition || []).length }, // T-202606-020
    { key: 'unchanged',         id: 'unchanged',         label: 'sin cambios',        cls: 'muted',  count: diff.ignored.filter(i => !_criticalReasons.includes(i.reason)).length },
  ];

  if (summaryChips) {
    summaryChips.innerHTML = _chipDefs
      .filter(c => c.count > 0)
      .map(c => `<button class="mdiff-sum-chip mdiff-sum-chip--${c.cls}"
          data-action="mdiff-jump-to" data-sec-id="${c.id}" type="button">
          <span class="mdiff-sum-count">${c.count}</span>
          <span class="mdiff-sum-label">${c.label}</span>
        </button>`).join('');
  }

  // Helper: toggle sección
  _mdiffToggleSection = function(btn) {
    const body = btn.nextElementSibling;
    const collapsed = btn.classList.toggle('is-collapsed');
    body.classList.toggle('is-hidden', collapsed);
  };

  // Helper: jump a sección
  _mdiffJumpTo = function(secId) {
    const el = document.getElementById('mdiff-sec-' + secId);
    if (!el) return;
    // Si está colapsada, expandir
    const headerBtn = el.querySelector('.mdiff-section-header');
    const secBody   = el.querySelector('.mdiff-section-body');
    if (headerBtn && headerBtn.classList.contains('is-collapsed')) {
      headerBtn.classList.remove('is-collapsed');
      secBody.classList.remove('is-hidden');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // TKT2 (REQ CAEL-0720-02, AC1-2): filtro del resolver — código con prefijo case-insensitive
  // o substring de título case-insensitive, unión sin duplicados. Orden: código exacto, luego
  // prefijo de código, luego substring de título. Máximo 8 resultados (AC2).
  _mdiffUnresolvedFilter = function(inputEl) {
    const q = (inputEl.value || '').trim().toLowerCase();
    const wrap = inputEl.closest('.mdiff-unresolved-search-wrap');
    const dropdown = wrap ? wrap.querySelector('.mdiff-unresolved-dropdown') : null;
    if (!dropdown) return;
    if (!q) { dropdown.setAttribute('hidden', ''); dropdown.innerHTML = ''; return; }

    const all = getItems();
    const exact = [], prefixMatch = [], titleMatch = [];
    const seen = new Set();
    for (const it of all) {
      const codeL = String(it.code || '').toLowerCase();
      const titleL = String(it.title || '').toLowerCase();
      if (seen.has(it.code)) continue;
      if (codeL === q) { exact.push(it); seen.add(it.code); }
      else if (codeL.startsWith(q)) { prefixMatch.push(it); seen.add(it.code); }
      else if (titleL.includes(q)) { titleMatch.push(it); seen.add(it.code); }
    }
    const results = [...exact, ...prefixMatch, ...titleMatch].slice(0, 8);

    const code = inputEl.dataset.code;
    const field = inputEl.dataset.field;
    const uIdx = inputEl.dataset.unresolvedIdx;

    if (!results.length) {
      dropdown.innerHTML = `<div class="mdiff-unresolved-empty">Sin coincidencias — pega el código exacto</div>`;
    } else {
      dropdown.innerHTML = results.map(r => `<button type="button" class="sps-dropdown-item" role="menuitem"
        data-action="mdiff-unresolved-select" data-code="${esc(code)}" data-field="${esc(field)}"
        data-unresolved-idx="${esc(uIdx)}" data-selected-code="${esc(r.code)}">${esc(r.code)} · ${esc(r.title || '')}</button>`).join('');
    }
    dropdown.removeAttribute('hidden');

    // Flip-to-fit — mismo mecanismo que .sps-dropdown--flip (ux-ref §E-10): medir espacio
    // disponible antes de decidir orientación.
    const rect = wrap.getBoundingClientRect();
    const dropdownHeight = dropdown.scrollHeight || 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    dropdown.classList.toggle('mdiff-unresolved-dropdown--flip', spaceBelow < dropdownHeight && rect.top > dropdownHeight);
  };

  // TKT2 (REQ CAEL-0720-02, AC4-6): selección — muta tgItems en memoria, reemplaza el shell
  // de búsqueda por el chip. Si field es array (dependsOn), reemplaza la entrada no-resuelta
  // dentro del array por el código seleccionado — no agrega entrada nueva (AC4).
  _mdiffUnresolvedSelect = function(btn) {
    const code = btn.dataset.code;
    const field = btn.dataset.field;
    const selectedCode = btn.dataset.selectedCode;
    const uIdx = btn.dataset.unresolvedIdx;

    const target = tgItems.find(i => i.code === code);
    const entry = Array.isArray(diff.unresolvedRefs) ? diff.unresolvedRefs[uIdx] : null;
    if (target) {
      if (Array.isArray(target[field])) {
        const rawOld = entry ? (entry.rawValue || entry.ref_id) : undefined;
        const pos = target[field].findIndex(v => v === rawOld || (v && v.ref_id === rawOld));
        if (pos >= 0) target[field][pos] = selectedCode;
        else target[field].push(selectedCode);
      } else {
        target[field] = selectedCode;
      }
    }
    // Bug fix (Finn, auditoría TKT2): entry.selectedCode nunca se guardaba — _mdiffUnresolvedRemove
    // no podía localizar la entrada mutada en target[field] cuando field es array, porque buscaba
    // por entry.selectedCode (siempre undefined) en vez de por el valor recién escrito. Se guarda
    // aquí, en la misma entry que unresolvedRefs ya expone — sin campo nuevo en el schema del ítem,
    // solo en el objeto de trabajo en memoria del panel.
    if (entry) entry.selectedCode = selectedCode;

    const row = btn.closest('.mdiff-unresolved-row');
    const wrap = row ? row.querySelector('.mdiff-unresolved-search-wrap') : null;
    if (wrap) {
      wrap.outerHTML = `<span class="mdiff-dep-pill mdiff-unresolved-chip">${esc(selectedCode)}
        <button type="button" class="mdiff-unresolved-chip-remove" data-action="mdiff-unresolved-remove"
          data-code="${esc(code)}" data-field="${esc(field)}" data-unresolved-idx="${esc(uIdx)}"
          aria-label="Quitar selección">×</button>
      </span>`;
    }
  };

  // TKT2 (REQ CAEL-0720-02, AC7): remove — revierte tgItems al rawValue/ref_id original,
  // restaura el shell de búsqueda vacío.
  _mdiffUnresolvedRemove = function(btn) {
    const code = btn.dataset.code;
    const field = btn.dataset.field;
    const uIdx = btn.dataset.unresolvedIdx;
    const entry = Array.isArray(diff.unresolvedRefs) ? diff.unresolvedRefs[uIdx] : null;
    const original = entry ? (entry.rawValue !== undefined ? entry.rawValue : (entry.ref_id || '')) : '';

    const target = tgItems.find(i => i.code === code);
    if (target) {
      if (Array.isArray(target[field])) {
        const pos = target[field].findIndex(v => v === (entry && entry.selectedCode));
        if (pos >= 0) target[field][pos] = original;
      } else {
        target[field] = original;
      }
    }
    if (entry) entry.selectedCode = undefined;

    const chip = btn.closest('.mdiff-unresolved-chip');
    if (chip) {
      chip.outerHTML = `<div class="mdiff-unresolved-search-wrap">
        <input type="text" class="bl-search-input" data-action="mdiff-unresolved-search"
          data-code="${esc(code)}" data-field="${esc(field)}" data-unresolved-idx="${esc(uIdx)}"
          aria-label="Buscar ítem para ${esc(field)}"
          placeholder="Buscar por código o título…" value="">
        <div class="sps-dropdown mdiff-unresolved-dropdown" role="menu" hidden></div>
      </div>`;
    }
  };

  // R-202605-148: persistir sprint desde select inline del DIFF sin re-render del panel
  _mdiffSetItemSprint = function(sel) {
    const code = sel.dataset.itemCode;
    if (!code) return;
    const val = sel.value;
    // T-202606-035 (TKT-B2): bloqueo sin-sprint + en-revision — BR-Ecosystem §5
    if (val === '') {
      const _itemForBlock = getItems().find(i => i.code === code);
      if (_itemForBlock && _itemForBlock.status === 'en-revision') {
        showToast(`CHECKPOINT bloqueado: ${code} tiene status en-revision sin sprint asignado. Asignar sprint antes de continuar.`, 'error');
        sel.value = _itemForBlock.sprint || '';
        return;
      }
    }
    _mdiffPersistSprint(code, val);
  };

  // R-202605-148: mini-formulario inline — reemplaza el select en la card
  // R-202605-148: persistir sprint en getItems() + saveBacklog sin re-render del backlog ni del DIFF
  function _mdiffPersistSprint(code, sprintId) {
    const item = getItems().find(i => i.code === code);
    if (!item) {
      // B-202605-500: ítem nuevo aún no existe en getItems() durante dryRun — guardar para aplicar en _mdiffDoApply
      _mdiffPendingSprints[code] = sprintId || '';
      return;
    }
    const prevSprint = item.sprint || '';
    item.sprint = sprintId || '';
    item.priority = _calcPriority(item);
    if (sprintId) {
      const targetSprint = _getSprintById(sprintId);
      if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
        item.scope_added = true;
      }
    } else {
      delete item.scope_added;
    }
    if (!item.history) item.history = [];
    item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevSprint || null, to: item.sprint || null } });
    saveBacklog();
    _setBacklogModified();
    // No llama renderBacklogList() — el DIFF permanece intacto
  }

  // Helper: validar pendientes y actualizar panel derecho
  _mdiffUpdateConfirmBtn = function() {
    const applyBtn   = document.getElementById('mdiff-apply-btn');
    const backlogBtn = document.getElementById('mdiff-backlog-btn');
    if (!applyBtn) return;

    // Recoger estado de controles en columna derecha
    const retroPendingItems = [];
    diff.retroceso.forEach((item, idx) => {
      const cb = document.getElementById(`mdiff-right-retro-cb-${idx}`);
      if (!cb || !cb.checked) retroPendingItems.push({ item, idx });
    });

    const discardPendingItems = [];
    diff.discarded.forEach((item, idx) => {
      if (item.reason) return; // ya tiene razón preestablecida
      const sel = document.getElementById(`mdiff-right-discard-${idx}`);
      if (!sel || !sel.value) discardPendingItems.push({ item, idx });
    });

    // T-202606-001 (TKT-B2) — CORREGIDO por INC-202607-002: esta rama originalmente bloqueaba
    // el guardado de todo REQ/TKT nuevo sin sprint, contradiciendo BR-Ecosystem §5 — Q-Backlog
    // es zona persistente válida y NO bloquea el CHECKPOINT. sprintPendingItems se conserva
    // solo para la nota informativa de la columna derecha — ya no participa en `blocked`.
    // DISC e INC nunca entran aquí — filtrados explícitamente por tipo (DISC vive siempre en
    // Q-DISC, INC vive siempre en Q-INC vía campo `queue` — ninguno de los dos usa `sprint`).
    const sprintPendingItems = [];
    [...diff.created, ...diff.createdAndClosed].forEach((item) => {
      // item.type es el string completo del schema (REQ/TKT/INC/DISC) — fuente canónica.
      // Fallback al prefijo de code solo si type no vino declarado (no debería ocurrir en items no-patch).
      const _codePrefix = (item.code || '?')[0].toUpperCase();
      const _prefixToKind = { R: 'REQ', T: 'TKT', I: 'INC', D: 'DISC' };
      const itemKind = item.type || _prefixToKind[_codePrefix] || _codePrefix;
      if (itemKind !== 'REQ' && itemKind !== 'TKT') return;
      const effectiveSprint = Object.prototype.hasOwnProperty.call(_mdiffPendingSprints, item.code)
        ? _mdiffPendingSprints[item.code]
        : item.sprint;
      if (!effectiveSprint || effectiveSprint === '') {
        sprintPendingItems.push(item);
      }
    });

    // TKT-202607-103 (REQ-202607-026 · AC1): _draftPending retirado de `blocked` — persistencia
    // de código real en draft:true (mergeBacklogFromTG, TKT-202607-097) ya no depende de que
    // Finn emita patch para que el founder pueda guardar. El banner de aval pendiente
    // (_renderDraftPendingBanner) se conserva como indicador informativo — ver AC2.
    // INC-202607-002: sprintPendingItems excluido de `blocked` — Q-Backlog es destino válido
    // (BR-Ecosystem §5), no requiere confirmación para guardar.
    const blocked = retroPendingItems.length > 0 || discardPendingItems.length > 0;
    applyBtn.disabled = blocked;
    applyBtn.classList.toggle('mdiff-apply-blocked', blocked);
    if (backlogBtn) {
      backlogBtn.disabled = blocked;
      backlogBtn.classList.toggle('mdiff-apply-blocked', blocked);
    }

    // Construir contenido de columna derecha
    if (pendingList) {
      const hasRetrocesos  = diff.retroceso.length > 0;
      const hasDescartes   = diff.discarded.filter(i => !i.reason).length > 0;
      const hasDescartesConRazon = diff.discarded.filter(i => !!i.reason).length > 0;
      const hasSprintPending = sprintPendingItems.length > 0;

      if (!hasRetrocesos && !hasDescartes && !hasDescartesConRazon && !hasSprintPending) {
        // Sin pendientes — listo
        pendingList.innerHTML = `<div class="mdiff-pending-ok">✓ Listo para guardar</div>`;
        return;
      }

      let html = '';

      // Banner de advertencia si hay pendientes bloqueantes — sprintPendingItems ya no cuenta (INC-202607-002)
      if (blocked) {
        const pendingCount = retroPendingItems.length + discardPendingItems.length;
        html += `
          <div class="mdiff-right-banner mdiff-right-banner--warn">
            <span class="mdiff-right-banner-icon">⚠</span>
            <span class="mdiff-right-banner-text">
              ${pendingCount} acción${pendingCount > 1 ? 'es requieren' : ' requiere'} confirmación antes de guardar
            </span>
          </div>`;
      } else {
        html += `<div class="mdiff-pending-ok">✓ Listo para guardar</div>`;
      }

      // Sección informativa Q-Backlog — INC-202607-002: visibilidad, no bloquea (BR-Ecosystem §5)
      if (hasSprintPending) {
        html += `<div class="mdiff-right-section-title">Q-Backlog — sin sprint</div>`;
        sprintPendingItems.forEach((item) => {
          html += `
            <div class="mdiff-right-sprint-pending-row">
              <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
              <span class="mdiff-right-sprint-pending-desc">${esc(item.title || '')}</span>
              <span class="mdiff-right-sprint-pending-hint">válido — queda en Q-Backlog en espera de sprint</span>
            </div>`;
        });
      }

      // Sección retrocesos
      if (hasRetrocesos) {
        html += `<div class="mdiff-right-section-title">Retrocesos</div>`;
        diff.retroceso.forEach((item, idx) => {
          const cbId = `mdiff-right-retro-cb-${idx}`;
          const existingCb = document.getElementById(cbId);
          const isChecked  = existingCb ? existingCb.checked : false;
          html += `
            <label class="mdiff-right-retro-row ${isChecked ? 'is-confirmed' : ''}">
              <input type="checkbox" id="${cbId}" class="mdiff-right-retro-cb"
                     data-retroceso-idx="${idx}"
                     ${isChecked ? 'checked' : ''}>
              <span class="mdiff-right-retro-info">
                <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
                <span class="mdiff-retro-status">${esc(item.from)} → ${esc(item.to)}</span>
              </span>
            </label>`;
        });
      }

      // Sección descartes que necesitan razón
      if (hasDescartes) {
        html += `<div class="mdiff-right-section-title">Razón de descarte</div>`;
        diff.discarded.forEach((item, idx) => {
          if (item.reason) return; // ya tiene razón
          const selId = `mdiff-right-discard-${idx}`;
          const existingSel = document.getElementById(selId);
          const currentVal  = existingSel ? existingSel.value : '';
          html += `
            <div class="mdiff-right-discard-row">
              <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
              <span class="mdiff-right-discard-desc">${esc(item.title || '')}</span>
              <select id="${selId}" class="mdiff-right-discard-select"
                      data-discard-idx="${idx}">
                <option value="">— razón —</option>
                ${_DISCARD_REASONS.map(r => `<option value="${esc(r)}" ${currentVal === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}
              </select>
            </div>`;
        });
      }

      // Descartes con razón preestablecida — solo confirmar visualmente
      if (hasDescartesConRazon) {
        diff.discarded.forEach((item) => {
          if (!item.reason) return;
          html += `
            <div class="mdiff-right-discard-row mdiff-right-discard-row--preset">
              <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
              <span class="mdiff-discard-reason-pill">${esc(item.reason)}</span>
            </div>`;
        });
      }

      pendingList.innerHTML = html;
    }

    // Actualizar texto del botón apply
    // TKT-[pendiente-ID] (origen_disc, triggered_by TKT-202607-048): mismo gap que el badge del
    // header — totalApply no sumaba _patchItems.length, botón mostraba "(0)" con CHECKPOINTs de solo patches.
    const totalApply = diff.created.length + diff.advanced.length + diff.updated.length
                     + diff.retroceso.length + diff.discarded.length + diff.createdAndClosed.length
                     + _patchItems.length;
    applyBtn.textContent = blocked ? '✓ Guardar sesión' : `✓ Guardar sesión (${totalApply})`;
     };

  // Footer: input duración + botones de acción
  // T-202606-046: input HH:MM declarado por Nova en T-202606-042 — HTML conforme a spec de Nova.
  if (footer) {
    footer.innerHTML = `
      <div class="mdiff-duration-row">
        <label class="mdiff-duration-label" for="mdiff-duration-input">Hora de reset</label>
        <input
          class="mdiff-duration-input"
          id="mdiff-duration-input"
          type="text"
          inputmode="numeric"
          placeholder="ej: 2130"
          maxlength="4"
          autocomplete="off"
          aria-label="Hora de reset del worker en formato HHMM (ej: 2130)"
        >
        <div class="mdiff-duration-hint" id="mdiff-duration-disp">—</div>
      </div>
      <div class="mdiff-footer-actions">
        <button id="mdiff-cancel-btn" class="mdiff-btn mdiff-btn--cancel">✕ Cancelar</button>
        <button id="mdiff-backlog-btn" class="mdiff-btn mdiff-btn--secondary">Ver Backlog</button>
        <button class="mdiff-btn mdiff-btn--primary" id="mdiff-apply-btn">✓ Guardar sesión</button>
      </div>`;
  }

  // TKT2 (TKT-202607-145, Rune): abre el shell compartido — #merge-diff-overlay ya no tiene
  // backdrop/open propio, solo pasa de socket vacío a panel con contenido dentro del shell.
  if (shell) shell.classList.add('open');
  overlay.classList.remove('mdiff-overlay--empty');
  overlay.classList.add('mdiff-overlay--filled');
  _mdiffStepZeroActive = true; // T-202606-006

  // Fix de esta sesión: onClose capturado en la referencia de módulo — teardownMergeDiffPanel()
  // lo necesita para replicar "cierre sin confirmar, revertir fase 2→1" cuando el cierre viene
  // de fuera del closure (× del shell).
  _mdiffOnClose = onClose;

  // T-202606-006: listener storage:item-excluded — agrega fila en Step 0 del DIFF.
  // Se registra con { once: false } y se limpia al cerrar el panel vía AbortController.
  // Fix de esta sesión: _mdiffPanelAC (módulo) reemplaza el const local _itemExcludedAC —
  // mismo controller ahora también cubre el listener de keydown (más abajo), un solo abort()
  // retira ambos.
  // TKT-[pendiente-ID] (INC — duplicación de ítem, fix complementario a locus-session-parse.js):
  // abortar cualquier _mdiffPanelAC previo antes de crear uno nuevo. showMergeDiffPanel() opera
  // sobre el shell compartido y estático #merge-diff-overlay — si el panel se reabre mientras el
  // anterior seguía "activo" (ej. doble invocación por paste+input, ya corregida en su origen),
  // el AbortController viejo quedaba huérfano sin abortar y sus listeners (keydown,
  // storage:item-excluded) sobrevivían junto a los nuevos.
  if (_mdiffPanelAC) { _mdiffPanelAC.abort(); _mdiffPanelAC = null; }
  _mdiffPanelAC = new AbortController();
  window.addEventListener('storage:item-excluded', (e) => {
    if (!_mdiffStepZeroActive) return;
    const { code, type, reason } = e.detail || {};
    const _body = document.getElementById('merge-diff-body');
    if (!_body) return;
    // Buscar o crear contenedor de exclusiones en Step 0
    let _excContainer = document.getElementById('mdiff-excluded-items');
    if (!_excContainer) {
      _excContainer = document.createElement('div');
      _excContainer.id = 'mdiff-excluded-items';
      _excContainer.className = 'mdiff-step0 mdiff-excluded-section';
      _excContainer.innerHTML = `
        <div class="mdiff-step0-header">
          <span class="mdiff-step0-badge">Excluido</span>
          <span class="mdiff-step0-title">Ítems no guardados</span>
        </div>
        <div class="mdiff-excluded-rows" id="mdiff-excluded-rows"></div>`;
      _body.insertAdjacentElement('afterbegin', _excContainer);
    }
    const _rows = document.getElementById('mdiff-excluded-rows');
    if (!_rows) return;
    // Copy corto legible — type llega como string completo del schema (confirmado: locus-storage.js
    // emite it.type directamente en storage:item-excluded, sin letra única).
    const _typeLabel = { REQ: 'un Requerimiento', TKT: 'un Ticket', INC: 'un Incidente', DISC: 'una Idea' }[type] || type;
    // DISC-[tmp:disc-shortcopy] promovida a TKT-[tmp:tkt-shortcopy]: _shortCopy asumía siempre
    // "sin sprint asignado" como causa — pero storage:item-excluded solo se dispara por
    // status:historico read-only, type no canónico, o type/status incompatible (ver
    // locus-storage.js _dispatch('storage:item-excluded', ...)) — nunca por sprint ausente.
    // Corregido: el summary usa el `reason` real del evento en vez de un texto fijo adivinado.
    const _shortCopy = `${code || '[pendiente-ID]'} no se guardó — ${reason || `${_typeLabel} excluido por el backlog`}.`;
    const _row = document.createElement('details');
    _row.className = 'mdiff-excluded-row';
    _row.innerHTML = `<summary class="mdiff-excluded-summary">${_shortCopy}</summary>` +
      `<div class="mdiff-excluded-detail">${reason || ''}</div>`;
    _rows.appendChild(_row);
  }, { signal: _mdiffPanelAC.signal });

  // T-202606-173 AC-1: foco inicial en input de hora al abrir el modal
  requestAnimationFrame(() => {
    const _focusInput = overlay.querySelector('#mdiff-duration-input');
    if (_focusInput) _focusInput.focus();
  });

  // Evaluar estado inicial del botón
  _mdiffUpdateConfirmBtn();

  // ── Handler de aplicar: aplica retrocesos y descartes ──
  function _mdiffDoApply(andThenGoBacklog) {
    // Retrocesos confirmados — leer checkboxes de columna derecha
    if (diff.retroceso.length) {
      diff.retroceso.forEach((retroItem, idx) => {
        const cb = document.getElementById(`mdiff-right-retro-cb-${idx}`);
        if (cb && cb.checked) {
          const item = getItems().find(i => i.code === retroItem.code);
          if (item) {
            const from = item.status;
            item.status = retroItem.to;
            item.statusChangedAt = Date.now();
            // B-202606-085: limpiar doneAt al retroceder desde done — mismo patrón que _confirmRetroceso
            if (from === 'done') item.doneAt = null;
            _syncParentRStatus(item.code, item.status); // INC-[pendiente-ID]: sync R padre tras retroceso vía CHECKPOINT
            _blogLog('retroceso', retroItem.code, from + ' → ' + retroItem.to, 'backlog');
          }
        }
      });
    }

    // Descartes: aplicar con reason del selector de columna derecha o preestablecida
    if (diff.discarded.length) {
      diff.discarded.forEach((discItem, idx) => {
        const item = getItems().find(i => i.code === discItem.code);
        if (!item) return;
        const sel = document.getElementById(`mdiff-right-discard-${idx}`);
        const finalReason = sel ? (sel.value || discItem.reason || '') : (discItem.reason || '');
        const finalRef    = discItem.ref || '';
        item.status        = 'descartado';
        item.discardReason = finalReason;
        item.discardRef    = finalRef;
        item.statusChangedAt = Date.now();
        _syncParentRStatus(item.code, item.status); // INC-[pendiente-ID]: sync R padre tras descarte vía CHECKPOINT
        _checkAndOrphanParentR(item.code, Date.now()); // INC-[pendiente-ID]: mismo patrón que _confirmDiscard/_applyDiscardBatch
        _blogLog('ckpt-descarte', discItem.code, finalReason, 'backlog');
      });
    }

    // Si hubo retrocesos o descartes → persistir y re-renderizar
    const hadPending = diff.retroceso.length || diff.discarded.length;
    if (hadPending) {
      _undoSnapshotItems();
      saveBacklog();
      _setBacklogModified();
    }

    // Contar ítems aplicados para toast
    const appliedCount = diff.created.length + diff.advanced.length + diff.updated.length
                       + diff.retroceso.filter((_, idx) => {
                           const cb = document.getElementById(`mdiff-right-retro-cb-${idx}`);
                           return cb && cb.checked;
                         }).length
                       + diff.discarded.length
                       + diff.createdAndClosed.length;

    // B-202606-037: leer valor raw del input de hora de desbloqueo antes de cerrar el panel.
    // Se pasa sin procesar a onApply — el caller (saveSession) llama a interpretHora internamente.
    // Si está vacío → string vacío → horaResult null → worker permanece disponible.
    const _durationInput = document.getElementById('mdiff-duration-input');
    const _horaRaw = _durationInput ? (_durationInput.value.trim() || '') : '';

    // TKT2 (TKT-202607-145, Rune): cierra el shell compartido — no-op seguro si ya estaba
    // cerrado (caller no-ingesta). mdiff-overlay--docked eliminado — el panel revierte a
    // --empty en vez de perder un backdrop propio que ya no tiene.
    if (shell) shell.classList.remove('open');
    overlay.classList.remove('mdiff-overlay--filled');
    overlay.classList.add('mdiff-overlay--empty');
    // Fix de esta sesión: keydown + storage:item-excluded comparten _mdiffPanelAC — un solo
    // abort() reemplaza el removeEventListener + _itemExcludedAC.abort() separados de antes.
    if (_mdiffPanelAC) { _mdiffPanelAC.abort(); _mdiffPanelAC = null; }
    // B-202605-050: limpiar todas las referencias _mdiff* al cerrar el panel
    _mdiffUpdateConfirmBtn = null;
    _mdiffToggleSection = null;
    _mdiffJumpTo = null;
    _mdiffSetItemSprint = null;
    _mdiffUnresolvedFilter = null;
    _mdiffUnresolvedSelect = null;
    _mdiffUnresolvedRemove = null;
    _mdiffOnClose = null; // aplicar no invoca onClose — solo se limpia la referencia
    _mdiffStepZeroActive = false; // T-202606-006

    if (appliedCount > 0) {
      showToast('success', `Sesión guardada — ${appliedCount} ítem${appliedCount !== 1 ? 's' : ''} aplicado${appliedCount !== 1 ? 's' : ''}`);
    }

    // B-202606-037: pasar horaRaw como argumento de onApply — saveSession resuelve horaResult.
    // T-202606-039: guard — onApply puede ser undefined si el caller no lo provee.
    if (typeof onApply === 'function') onApply(_horaRaw);

    // B-202606-001: aplicar patches después de onApply() — ítems nuevos ya existen en getItems()
    // T-202606-028: propagar ckptHeaderRole — antes el guard de done en R nunca recibía
    // el rol del header y rechazaba siempre, incluso con QA · Finn. Mismo dato fuente
    // que ckptRol en mergeBacklogFromTG (línea ~130).
    // TKT2 (REQ CAEL-0724-11, ref_id CAEL-0724-11): retorno capturado — antes se descartaba por completo.
    // El panel DIFF ya está cerrado en este punto (overlay.classList.remove('open') corrió arriba,
    // L1765) — _card/_pill/_section (closures de showMergeDiffPanel) fuera de scope aquí, confirmado
    // contra código real antes de especificar. Único mecanismo disponible: showToast, mismo patrón
    // que el toast de éxito de appliedCount (L1781-1783). 'info' — único tipo neutral ya en uso en
    // este archivo junto a 'error'/'success' (grep confirmado, sin 'warning').
    const _patchResult = _patchItems.length ? applyPatchesFromTG(_patchItems, null, { ckptHeaderRole: _ckptMeta.rol || '', slugMap: diff.slugMap, refIdTitleMap: diff.refIdTitleMap }) : null; // TKT1 (REQ-[pendiente-ID] · CAEL-04): slugMap/refIdTitleMap propagados desde el dry-run — este call site no los pasaba antes (gap preexistente sobre parentId también, no solo code; corregido aquí como consistencia directa con los otros dos call sites, sin ampliar el TKT)
    if (_patchResult && _patchResult.ignored && _patchResult.ignored.length) {
      const _ignoredCount = _patchResult.ignored.length;
      showToast('info', `${_ignoredCount} patch${_ignoredCount !== 1 ? 'es' : ''} no se aplicó${_ignoredCount !== 1 ? 'ron' : ''}`, 'Ver DocLog para el detalle');
    }

    // B-202605-500: aplicar sprints pendientes sobre ítems nuevos (ya existen en getItems() tras onApply)
    const pendingEntries = Object.entries(_mdiffPendingSprints);
    if (pendingEntries.length) {
      let changed = false;
      pendingEntries.forEach(([code, sprintId]) => {
        const item = getItems().find(i => i.code === code);
        if (!item) return;
        item.sprint = sprintId || '';
        item.priority = _calcPriority(item);
        if (sprintId) {
          const targetSprint = _getSprintById(sprintId);
          if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
            item.scope_added = true;
          }
        } else {
          delete item.scope_added;
        }
        if (!item.history) item.history = [];
        item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: null, to: sprintId || null } });
        changed = true;
      });
      if (changed) {
        saveBacklog();
        _setBacklogModified();
      }
    }

    if (andThenGoBacklog) {
      switchTab('backlog');
      switchSubTab('backlog');
    }
  }

  // Delegation — evita onclick= en HTML dinámico; _mdiff* accesibles via window
  overlay.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
      // data-stop-propagation en selects
      if (e.target.closest('[data-stop-propagation]')) { e.stopPropagation(); }
      return;
    }
    const action = btn.dataset.action;
    if (action === 'mdiff-toggle-section') {
      if (_mdiffToggleSection) _mdiffToggleSection(btn);
    } else if (action === 'mdiff-jump-to') {
      if (_mdiffJumpTo) _mdiffJumpTo(btn.dataset.secId);
    } else if (action === 'mdiff-unresolved-select') {
      if (_mdiffUnresolvedSelect) _mdiffUnresolvedSelect(btn);
    } else if (action === 'mdiff-unresolved-remove') {
      if (_mdiffUnresolvedRemove) _mdiffUnresolvedRemove(btn);
    }
  });

  // T-202606-008: delegation change — reemplaza onchange= inline en templates de pendingList y _sprintSelect
  // TKT2 (REQ CAEL-0720-02, AC1): filtrado en vivo del resolver — evento input, no change,
  // para reaccionar tecla por tecla.
  overlay.addEventListener('input', function(e) {
    if (e.target.dataset && e.target.dataset.action === 'mdiff-unresolved-search') {
      if (_mdiffUnresolvedFilter) _mdiffUnresolvedFilter(e.target);
    }
  });

  overlay.addEventListener('change', function(e) {
    // Sprint select — data-action="mdiff-set-sprint" (generado por _sprintSelect)
    if (e.target.classList.contains('mdiff-sprint-select') && e.target.dataset.action === 'mdiff-set-sprint') {
      if (_mdiffSetItemSprint) _mdiffSetItemSprint(e.target);
      // T-202606-001: re-evaluar gate — el cambio puede destrabar un pendiente de sprint icebox
      if (_mdiffUpdateConfirmBtn) _mdiffUpdateConfirmBtn();
      return;
    }
    // Retroceso checkbox — data-retroceso-idx (generado en _mdiffUpdateConfirmBtn)
    if (e.target.classList.contains('mdiff-right-retro-cb')) {
      if (_mdiffUpdateConfirmBtn) _mdiffUpdateConfirmBtn();
      return;
    }
    // Discard select — data-discard-idx (generado en _mdiffUpdateConfirmBtn)
    if (e.target.classList.contains('mdiff-right-discard-select')) {
      if (_mdiffUpdateConfirmBtn) _mdiffUpdateConfirmBtn();
      return;
    }
  });

  // TKT-[pendiente-ID] (INC — duplicación de ítem): los tres listeners de botón de este panel
  // (cancel/backlog/apply) no estaban scoped a _mdiffPanelAC.signal — a diferencia de keydown y
  // storage:item-excluded, que sí lo estaban. Sobre el shell estático #merge-diff-overlay, una
  // reapertura del panel sin haber cerrado la anterior apilaba un listener nuevo encima del
  // viejo en el mismo botón físico — un solo click disparaba ambos. teardownMergeDiffPanel() no
  // los cubría porque solo aborta _mdiffPanelAC, que hasta este fix no los incluía.
  overlay.querySelector('#mdiff-cancel-btn').addEventListener('click', () => {
    // Fix de esta sesión: cleanup consolidado en teardownMergeDiffPanel() — mismo camino que
    // usa closeModal() (locus-modals.js) al cerrar con ×. Sin toast — el usuario canceló
    // deliberadamente.
    teardownMergeDiffPanel();
  }, { signal: _mdiffPanelAC.signal });

  // AC-7: parseo de hora de desbloqueo — feedback visual inline con interpretHora
  const _durationInputEl = overlay.querySelector('#mdiff-duration-input');
  const _durationDispEl  = overlay.querySelector('#mdiff-duration-disp');
  if (_durationInputEl && _durationDispEl) {
    // B-202606-037 AC-3: pre-llenar con ai.resetTime si el worker ya tenía hora declarada.
    // ckptMeta.resetTime viene en formato "HH:MM" — se stripea el separador para HHMM.
    const _existingReset = (_ckptMeta.resetTime || '').replace(/\D/g, '');
    if (_existingReset) {
      _durationInputEl.value = _existingReset;
      _horaUpdate(_durationInputEl, _durationDispEl);
    }
    _durationInputEl.addEventListener('input', () => {
      _horaUpdate(_durationInputEl, _durationDispEl);
    });
    // B-202606-NNN: Enter en input de hora mueve foco al botón Guardar.
    // stopPropagation evita que _mdiffKeyHandler lo reciba y dispare _mdiffDoApply prematuramente.
    // T-202606-082: si el botón está disabled, mover foco al primer pendiente bloqueante en lugar de focus() silencioso.
    _durationInputEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      e.stopPropagation();
      const applyBtn = document.getElementById('mdiff-apply-btn');
      if (applyBtn && !applyBtn.disabled) {
        applyBtn.focus();
        return;
      }
      // AC-2: retroceso pendiente — primer checkbox sin marcar
      const firstUncheckedRetro = overlay.querySelector('.mdiff-right-retro-cb:not(:checked)');
      if (firstUncheckedRetro) { firstUncheckedRetro.focus(); return; }
      // AC-3: descarte pendiente sin razón — primer select vacío
      const allDiscardSelects = overlay.querySelectorAll('.mdiff-right-discard-select');
      for (const sel of allDiscardSelects) {
        if (!sel.value) { sel.focus(); return; }
      }
      // AC-4: sin pendiente identificable — no hacer nada (silencioso)
    });
  }

  overlay.querySelector('#mdiff-backlog-btn').addEventListener('click', () => {
    if (overlay.querySelector('#mdiff-backlog-btn').disabled) return;
    _mdiffDoApply(true);
  }, { signal: _mdiffPanelAC.signal });

  overlay.querySelector('#mdiff-apply-btn').addEventListener('click', () => {
    if (overlay.querySelector('#mdiff-apply-btn').disabled) return;
    _mdiffDoApply(false);
  }, { signal: _mdiffPanelAC.signal });

  // Enter → Aplicar (solo si no bloqueado)
  let _mdiffReady = false;
  setTimeout(() => { _mdiffReady = true; }, 300);
  function _mdiffKeyHandler(e) {
    if (e.key === 'Enter' && _mdiffReady) {
      // Guard: Enter en input de hora lo maneja su propio keydown — no apply aquí
      if (e.target && e.target.id === 'mdiff-duration-input') return;
      const btn = document.getElementById('mdiff-apply-btn');
      if (btn && !btn.disabled) {
        e.preventDefault();
        e.stopPropagation(); // B-[pendiente-ID]: Enter propagado a otros listeners del documento cuando el diff está activo
        _mdiffDoApply(false);
      }
    } else if (e.key === 'Escape') {
      // Fix de esta sesión: cleanup consolidado en teardownMergeDiffPanel() — el propio
      // teardown aborta _mdiffPanelAC, que es lo que retira este mismo listener de keydown
      // (seguro invocarlo desde dentro del handler que está corriendo).
      teardownMergeDiffPanel();
    }
  }
  // Fix de esta sesión: registrado con { signal } sobre _mdiffPanelAC — el mismo controller
  // que ya cubre 'storage:item-excluded'. teardownMergeDiffPanel() lo aborta desde fuera del
  // closure sin necesitar una referencia a _mdiffKeyHandler.
  document.addEventListener('keydown', _mdiffKeyHandler, { signal: _mdiffPanelAC.signal });
}

// CAEL-0720-01 TKT3: shell legacy de confirmación de status retirado — reemplazado
// por _gconfirmOpen con bodyHtml. El shell dedicado ya no existe en index.html.
// _openStatusConfirm conserva la misma interfaz de llamada que la función retirada
// para minimizar el diff en _confirmRetroceso/_confirmDiscard.
function _openStatusConfirm({ title, body, okLabel, okClass, onConfirm }) {
  _gconfirmOpen({
    title,
    msg: '',
    okLabel,
    danger: okClass === 'danger',
    bodyHtml: `<div>${body}</div>`
  }, () => { onConfirm(); });
}

export function _confirmRetroceso(code, toStatus) {
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  const from = item.status;
  _openStatusConfirm({
    title: '⚠ Retroceso de status',
    body: `<strong>${esc(code)}</strong> pasará de <strong>${from}</strong> → <strong>${toStatus}</strong>.<br><br>¿Confirmas el retroceso?`,
    okLabel: 'Sí, retroceder',
    okClass: '',
    onConfirm: () => {
      item.status = toStatus;
      item.statusChangedAt = Date.now();
      // B-202606-007: limpiar doneAt al retroceder desde done — AC-1
      if (from === 'done') item.doneAt = null;
      _syncParentRStatus(code, toStatus); // INC-[pendiente-ID]: sync R padre tras retroceso manual
      _blogLog('retroceso', code, from + ' → ' + toStatus, 'backlog');
      _undoSnapshotItems();
      saveBacklog();
      _setBacklogModified();
      showToast('info', '↓ ' + code + ' → ' + toStatus);
      // Animación de salida — mismo patrón que _confirmDiscard
      const _retEl = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
      if (_retEl) {
        _retEl.classList.add('item-exit-anim');
        setTimeout(() => {
          _markBacklogListDirty();
          renderBacklogList(); updateBacklogBanner(); renderStats();
        }, 230);
      } else {
        _markBacklogListDirty();
        renderBacklogList(); updateBacklogBanner(); renderStats();
      }

    }
  });
}

export function _confirmDiscard(code, reason, ref) {
  const item = getItems().find(i => i.code === code);
  if (!item) return;

  // Si no viene razón preestablecida, mostrar selector inline
  const reasonInputId = 'discard-reason-select';
  const refInputId    = 'discard-ref-input';
  const manualInput   = !reason;

  const bodyHtml = manualInput
    ? `<strong>${esc(code)}</strong> será marcado como <strong>descartado</strong>.<br><br>
       <div class="discard-modal-fields">
         <div>
           <label class="discard-field-label">Razón</label><br>
           <select id="${reasonInputId}" class="discard-field-select">
             <option value="">— seleccionar —</option>
             <option value="duplicado">duplicado</option>
             <option value="fuera de alcance">fuera de alcance</option>
             <option value="reemplazado">reemplazado</option>
             <option value="obsoleto">obsoleto</option>
           </select>
         </div>
         <div>
           <label class="discard-field-label">Referencia (opcional)</label><br>
           <input id="${refInputId}" type="text" placeholder="ej: T-202604-066" class="discard-field-input">
         </div>
       </div>
       <div class="discard-modal-hint">El ítem se conserva para trazabilidad pero no contará en métricas.</div>`
    : `<strong>${esc(code)}</strong> será marcado como <strong>descartado</strong>.<br>Razón: <strong>${esc(reason)}</strong>${ref ? '<br>Reemplazado por: <strong>' + esc(ref) + '</strong>' : ''}<br><br>El ítem se conserva para trazabilidad pero no contará en métricas.`;

  _openStatusConfirm({
    title: '🗑 Descartar ítem',
    body: bodyHtml,
    okLabel: 'Descartar',
    okClass: 'danger',
    onConfirm: () => {
      const finalReason = manualInput
        ? (document.getElementById(reasonInputId)?.value || '')
        : reason;
      const finalRef = manualInput
        ? (document.getElementById(refInputId)?.value.trim() || '')
        : ref;
      item.status = 'descartado';
      item.discardReason = finalReason;
      item.discardRef = finalRef;
      _syncParentRStatus(code, 'descartado'); // INC-[pendiente-ID]: sync R padre tras descarte manual
      _blogLog('descartado', code, finalReason || '', 'backlog');
      _checkAndOrphanParentR(code, Date.now()); // T-202606-017 AC-1
      _undoSnapshotItems();
      saveBacklog();
      _setBacklogModified();
      showToast('info', '🗑 ' + code + ' descartado');
      // Animación de salida — agrega clase al nodo DOM, espera que complete (220ms) y luego re-renderiza
      const _exitEl = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
      if (_exitEl) {
        _exitEl.classList.add('item-exit-anim');
        setTimeout(() => {
          _markBacklogListDirty();
          renderBacklogList(); updateBacklogBanner(); renderStats();
        }, 230);
      } else {
        _markBacklogListDirty();
        renderBacklogList(); updateBacklogBanner(); renderStats();
      }
    }
  });
}

// B-202604-NNN: confirmar lote de descartes desde panel CHECKPOINT (todos con reason definida)
function _applyDiscardBatch(items) {
  if (!items || !items.length) return;
  let applied = 0;
  items.forEach(({ code, reason, ref }) => {
    const item = getItems().find(i => i.code === code);
    if (!item) return;
    item.status = 'descartado';
    item.discardReason = reason || '';
    item.discardRef = ref || '';
    item.statusChangedAt = Date.now();
    _syncParentRStatus(code, 'descartado'); // INC-[pendiente-ID]: sync R padre tras descarte batch
    _blogLog('ckpt-descarte', code, reason || '', 'backlog');
    _checkAndOrphanParentR(code, Date.now()); // T-202606-017 AC-1
    applied++;
  });
  if (!applied) return;
  _undoSnapshotItems();
  saveBacklog();
  _setBacklogModified();
  // item-exit-anim no aplica en batch — múltiples nodos simultáneos generan race condition con setTimeout
  // _markBacklogListDirty antes de re-render para consistencia con _confirmDiscard
  _markBacklogListDirty();
  renderBacklogList(); updateBacklogBanner(); renderStats();
  showToast('info', '🗑 ' + applied + ' ítem' + (applied > 1 ? 's descartados' : ' descartado'));
  // Quitar sección de descartes del panel si ya no hay pendientes
  const panel = document.getElementById('ckpt-panel-body');
  if (panel) {
    const sec = panel.querySelector('.ckpt-section.discarded');
    if (sec) sec.remove();
  }

}

// T-202606-077: registrar callbacks en locus-backlog-core
document.addEventListener('DOMContentLoaded', () => {
  _registerCoreCallback('confirmDiscard',   _confirmDiscard);
  _registerCoreCallback('confirmRetroceso', _confirmRetroceso);
});
