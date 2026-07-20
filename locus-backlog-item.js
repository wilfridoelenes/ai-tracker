// [PP] mod:121 · autor:Rune · 2026-07-20 16:42 UTC-6
// TKT1+TKT2 (REQ CAEL-0720-10): parent/parentId restaurado como exclusivo de TKT — cierre
// del widen indebido introducido en mod:79/87 de module-contracts. Ver _checkAndOrphanParentR
// y el bloque de normalización de mergeBacklogFromTG/_buildCommonItemFields.
// TKT-[pendiente-ID] (deuda técnica, gap detectado por Finn — tercera copia no anticipada
// en AC original): SLA_RIESGO_WINDOW_MS importada de locus-inc-fields.js, reemplaza literal
// 21600000 en buildQIncItem() (línea ~3329). Sin cambio de comportamiento en clasificación
// --sla-riesgo/--sla-vencido.
//
// [PP] mod:116 · autor:Rune · 2026-07-19 UTC-6
// TKT (REQ-CAEL-0718-01 · paridad IDP Q-INC): .qinc-item-header en buildQIncItem() gana
//   data-qi-action="qi-open-panel" · role="button" · tabindex="0" · aria-label — atributos
//   que _attachQIncDelegation() (locus-backlog-render.js mod:91) ya esperaba desde su propia
//   entrega, sin que este archivo los hubiera aplicado. Gap detectado por Finn en Momento 1
//   contra código real — la referencia "ver buildQIncItem() mod:115" en los comentarios de
//   render.js mod:91 anticipaba este mod antes de que existiera. Sin cambio de firma.
// contract_update: no.
// [PP] mod:114 · autor:Rune · 2026-07-18 UTC-6
// DISC cerrada (auditoría triggeredBy/origenDisc/dependsOn en patches — triggered_by INC-202607
// parentId): confirmado mismo gap en los tres campos dentro de applyPatchesFromTG — sin
// normalización de {ref_id,title} NI resolución de slugMap (parentId al menos tenía la segunda).
// Refactor: helper único _resolvePatchRefValue() reemplaza el bloque ad-hoc que solo cubría
// parentId — ahora parentId/triggeredBy/origenDisc (escalares) + dependsOn (array) resuelven
// ref_id y slugMap con el mismo criterio de guardrail de title. DocLog key
// 'patch-parent-slug-no-resuelto' renombrado a 'patch-ref-slug-no-resuelto' (genérico, sin otros
// consumidores verificado por grep) — sin regresión.
// [PP] mod:112 · autor:Rune · 2026-07-18 UTC-6
// INC-202607-XXX (triggered_by TKT-202607-029/030): applyPatchesFromTG() — parentId llegando
// como objeto {ref_id,title} ahora se normaliza a '[tmp:REF_ID]' antes de la resolución de
// slugMap existente, mismo guardrail ya usado en patch.code y promovida_a. Sin esto, un patch
// de reparenteo vía ref_id (ej. Cael reparentando un TKT a un REQ recién creado en el mismo
// bloque) dejaba parentId con el objeto crudo sin resolver — "Sin parent" o valor ilegible en
// IDP/DIFF pese a ref_id/title correctos. Ver __BR-Ecosystem §4.
// [PP] mod:111 · autor:Rune · 2026-07-18 08:15 UTC-6
// INC-[pendiente-ID] (triggered_by REQ-202607-003/004/005): _assignPendingIds no seedeaba
// slugMap con [tmp:REF_ID] al asignar código real a un ítem con refId — causa raíz de
// parent:{ref_id,title} sin resolver ("Sin parent" en DIFF pese a ref_id/title correctos).
// Fix en las dos ramas de Sub-paso 1a (código [tmp:slug] y código [pendiente-ID] genérico).
// [PP] mod:109 · autor:Rune · 2026-07-13 UTC-6
// CHG (triggered_by INC CAEL-03): applyPatchesFromTG() — bloque field==='promovida_a' ahora
// normaliza incoming cuando llega como {ref_id,title}, replicando el guardrail ya aplicado a
// patch.code (L2814-2839 en versión anterior): resuelve contra _refIdTitleMap a '[tmp:REF_ID]'
// si el title declarado coincide, o a null + _blogLog si no hay declarante o hay mismatch de
// title. Antes, el objeto crudo pasaba _isPlaceholderCode() sin matchear (regex sobre string)
// y se escribía tal cual en existing.promovida_a — visible sin resolver en el badge "↗ promovida".
// TKT1 (REQ CAEL-04): import de navigateToItem separado a locus-item-navigator.js — antes
// combinado con _getActiveSprint/openSprintRetroView/_inheritSprintToChildren en el mismo
// import de locus-backlog-sprints.js. Ese import se conserva sin los demás cambios. Sin cambio
// de comportamiento en ninguno de los 6 call sites de este archivo (L415,439,444,1377,1461 + import).
// [PP] mod:108 · autor:Rune · 2026-07-12 22:10 UTC-6
// TKT1 (REQ CAEL-01 · PP-S-02): validateIncidentTransitions ahora recibe itilType — antes
//   aplicaba siempre la tabla de transiciones de INC a cualquier tipo ITIL. PRB (detected→
//   in_progress→resolved→closed, sin 'assigned') y KE (active→resolved|descartado) tienen
//   ciclos propios (BR-Core §6) — se agregan _VALID_PRB_TRANSITIONS/_VALID_KE_TRANSITIONS +
//   vocabularios propios (_VALID_PRB_STATUS/_VALID_KE_STATUS, ya exportados desde
//   locus-session-parse.js). Los dos call sites (merge y patch) pasan itemKind(existing)
//   como tipo. TKT3 (REQ CAEL-01): gate de resolution_type obligatorio al patchear un INC a
//   incidentStatus:'resolved' — antes se aceptaba el patch sin ese campo.
// TKT1 (REQ-refactor-item-shape-itil-scrum · AC1/AC2/AC3): _newItemObj único con campos ITIL
//   spreadeados condicionalmente → reemplazado por _buildCommonItemFields() + buildScrumItem() +
//   buildIncidentItem(). Sin cambio de comportamiento — mismos campos, mismos defaults, mismo
//   orden de evaluación de zona-log y discard_reason (ambos helpers ahora factorizados y
//   compartidos por los dos builders, antes vivían inline en el objeto único). El call site que
//   decide destino de push (getItems() vs _pendingNewIncidents) no cambia — sigue leyendo
//   _isIncomingIncident. no_incluye: no toca isQIncItem() (TKT2 del REQ) ni el concat de
//   renderQIncPanel (TKT3 del REQ) — ver REQ-refactor-item-shape-itil-scrum.
// [PP] mod:104 · autor:Rune · 2026-07-11 22:20 UTC-6
// TKT-202607-012: fix DocLog ruidoso — el loop de advertencia de campos no patcheables
//   (AC-3b, agregado en TKT-202607-008) disparaba 'Campo no patcheable ignorado: code' en
//   TODO patch, porque `code` es el identificador de ruteo (usado en getAnyItem(code) más
//   arriba) y siempre está presente en el objeto patch por construcción — no es un intento
//   real de modificar un campo no patcheable. Fix: `code` se excluye explícitamente de este
//   loop de advertencia antes de chequear contra _PATCH_NON_PATCHEABLE. Sin cambio de
//   comportamiento en la aplicación real de campos — ese loop (línea ~2757) ya excluía
//   `code` de aplicarse como dato, solo cambia el ruido de DocLog. Sin cambio de firma.
//   No_incluye: no toca ningún otro campo de _PATCH_NON_PATCHEABLE (type, schema_version,
//   ref_id, intencion, kill_criteria) — esos siguen advirtiendo normalmente si aparecen en
//   un patch, como corresponde (AC edge case de este TKT).
// [PP] mod:103 · autor:Rune · 2026-07-11 UTC-6
// TKT-202607-008: applyPatchesFromTG() migrado de modelo lista blanca (_PATCH_ALLOWED_FIELDS,
//   Set fijo de campos habilitados) a modelo de lista negra invertido (__BR-Ecosystem §8,
//   infra_version 33) — todo campo del patch es patcheable por default salvo que esté en
//   _PATCH_NON_PATCHEABLE. _PATCH_NON_PATCHEABLE ganó ref_id, intencion y kill_criteria —
//   antes solo declaraba code/type/schema_version, dejando esos tres campos sin gate explícito
//   si alguien los hubiera agregado al whitelist anterior (nunca ejercitado en la práctica,
//   _PATCH_ALLOWED_FIELDS tampoco los declaraba). _PATCH_ALLOWED_FIELDS eliminada — sin otro
//   consumidor en el archivo (verificado por grep antes de eliminar). El loop de aplicación de
//   campos itera ahora sobre Object.keys(patch) en vez del Set fijo — las ramas por campo
//   (status/incidentStatus/ac/sprint/promovida_a/draft/discard_reason/priority-ITIL/genérico)
//   no cambian de lógica, solo de disparador: antes "¿está en la whitelist Y presente en el
//   patch?", ahora "¿está presente en el patch Y no está en la blacklist?". Efecto observable:
//   un campo nuevo del schema (ej. triggered_by, archivos, comportamiento_actual) ahora se
//   aplica sin requerir habilitación explícita en este archivo — antes quedaba silenciosamente
//   sin aplicar aunque no hubiera razón de negocio para excluirlo. no_incluye: no toca el loop
//   de advertencia de campos no patcheables (línea ~2712, ya iteraba Object.keys(patch) contra
//   _PATCH_NON_PATCHEABLE desde antes de este TKT) — solo la expansión del Set que consume.
//   Deuda detectada, no corregida en este TKT (fuera de las 3 AC declaradas): ese mismo loop de
//   advertencia genera un DocLog "Campo no patcheable ignorado: code" en TODO patch, porque
//   `code` es siempre una key presente en el objeto patch (es el identificador de ruteo, no un
//   campo de datos) y también está en la blacklist — ruido preexistente al modelo whitelist
//   anterior, no introducido por este cambio. Registrado como TKT de refactor, priority: low.
// [PP] mod:102 · autor:Rune · 2026-07-11 UTC-6
// INC-[pendiente-ID] (fix — patches múltiples en un CHECKPOINT: solo el primero se aplicaba):
//   applyPatchesFromTG() llamaba saveBacklog() dentro del forEach, una vez por patch — N
//   upserts completos de tracker_items concurrentes sin await entre sí, capturados en
//   instantes distintos del loop síncrono. Race condition: el upsert que completa al final
//   no necesariamente refleja el estado más reciente, revirtiendo silenciosamente patches
//   posteriores al primero. Fix: saveBacklog() se mueve fuera del forEach — una sola llamada
//   tras aplicar todas las mutaciones en memoria, condicionada a patched.length > 0.
//   no_incluye: no modifica saveBacklog() ni syncState.withSaveLock() (locus-storage.js) —
//   el fix elimina la causa (N llamadas) sin depender del mecanismo interno del lock.
// [PP] mod:101 · autor:Rune · 2026-07-11 UTC-6
// TKT-202607-005-bis (ignorar campo zona en REQ/TKT — sufijo -bis: colisiona con el código real
//   TKT-202607-005 de separación ITEMS/INCIDENTS, mod:89 — ver _Locus-module-contracts §4.
//   Founder confirma nomenclatura interina 2026-07-11, Cael reemplaza -bis al asignar Locus):
//   extiende el DocLog de TKT3 (REQ type-safety
//   DISC status, ver comentario más abajo) de DISC a REQ y TKT — mismo criterio: ninguno de los
//   tres tipos persiste `zona` (REQ/TKT nunca la declararon en su schema — usan `sprint` vacío/
//   ausente para Q-Backlog), y ahora los tres emiten `_blogLog` cuando el campo llega declarado
//   con cualquier valor (`PP-Q-Backlog`, `icebox`, `n/a`, `sin-sprint`, lo que sea) — señal de
//   spec desactualizada en quien emite, nunca bloqueo ni rechazo del ítem. El comentario de TKT3
//   decía explícitamente "No aplica a REQ/TKT" — ese texto queda obsoleto con este cambio, no se
//   edita para conservar el registro histórico de esa decisión previa.
//   contract_update: no — mergeBacklogFromTG no cambia de firma ni de shape de retorno, solo
//   gana una rama de logging sin side effect sobre el ítem persistido.
// TKT (REQ-[pendiente-ID] · ref_id CAEL-01/CAEL-02 · Resolución de ref_id+title, parte 2/2 —
//   normalización + guardrail): mergeBacklogFromTG gana un bloque nuevo, antes de la
//   normalización parent→parentId existente — construye un Map refId→title a partir de
//   tgItems ya combinado (sin necesidad de transportar nada desde _resolveCheckpointBatch,
//   decisión de arquitectura de Cael en Fase 2), luego normaliza los 5 campos de referencia
//   (parentId, dependsOn, triggeredBy, origenDisc, promovida_a) que pueden traer un objeto
//   {ref_id,title} en vez de string. Objeto con title coincidente → '[tmp:REF_ID]' sintético,
//   reutilizando 100% el motor _findTmpMatch/slugMap de _assignPendingIds sin duplicar lógica.
//   Objeto con title no coincidente → null + DocLog 'ref-id-title-mismatch' (mensaje BR-Ecosystem
//   §4). ref_id sin ítem declarante en tgItems → null + DocLog 'ref-id-sin-declarante'. Un valor
//   string (código real, [tmp:slug] legacy, [pendiente-ID]) nunca entra a la rama nueva —
//   _normalizeRefIdValue retorna el valor tal cual si no es un objeto con ref_id. no_incluye:
//   no elimina [tmp:slug] — sigue siendo el motor interno. No modifica _assignPendingIds,
//   _refFields ni _listFields — reciben el string ya normalizado sin saber que existió un objeto.
// [PP] mod:98 · autor:Rune · 2026-07-10 21:10 UTC-6
// TKT2 (REQ-202607-026 · depends_on: TKT1 done): applyPatchesFromTG() — _PATCH_ALLOWED_FIELDS
//   gana draft + verified_by. Fase 5 de Finn ahora puede avalar con type:patch estándar sobre
//   el código real ya asignado por Cael, sin reemitir el ítem completo. Ambos caen en el bloque
//   genérico de aplicación (sin normalización propia) — draft:false pasa el guard porque
//   `incoming !== undefined && incoming !== null` no excluye false. Fix acompañante: el registro
//   de history (`ch.to || null`) colapsaba false a null — inofensivo hasta ahora porque ningún
//   campo patcheable era boolean; corregido a comparación explícita contra undefined antes de
//   que draft lo expusiera como bug real. no_incluye: no valida verified_by === 'QA · Finn' —
//   acepta cualquier string. No agrega wiring de re-render forzado de Q-Backlog/sprint —
//   ambas vistas ya leen item.draft en vivo (TKT1), "siguiente lectura" no requiere push activo.
// [PP] mod:96 · autor:Rune · 2026-07-10 19:35 UTC-6
// TKT1 (REQ-202607-026 · AC1, blocked_at AC2/AC3 — asignación de código real + invisibilidad
//   en vistas activas al ingestar REQ/TKT con draft:true): _newItemObj en mergeBacklogFromTG()
//   gana campo draft — antes ausente por completo, la columna quedaba sin escribir sin
//   importar el valor del CHECKPOINT. Lee item.draft, ya propagado desde ckpt.draft por
//   locus-session-parse.js (ver ese header, mod:100). signature_change: false — mergeBacklogFromTG
//   conserva firma (tgItems, sessionId, opts). contract_update: sí — nuevo campo en el shape
//   persistido de REQ/TKT, ver CHECKPOINT de entrega para contract_detail. no_incluye: no toca
//   applyPatchesFromTG ni verified_by — TKT2. No toca filtrado de Q-Backlog/sprint — esas
//   funciones no viven en este archivo, blocked_at declarado en el CHECKPOINT. Reimplementado
//   sobre el árbol real de esta entrega (mod:95) — la entrega previa (mod:93→94 sobre copia
//   desactualizada, misma sesión) queda descartada sin efecto sobre este archivo.
// [PP] mod:95 · autor:Rune · 2026-07-10 UTC-6
// TKT2 (REQ-202607-025): _newBacklogItem() aplicado a los 2 call sites de este archivo —
//   _promoteConfirm() (~L1221) y _promoteTktToReqConfirm() (~L1305) — + import agregado.
//   Reimplementado sobre el árbol de código real de esta entrega (mod:94, founder señaló
//   que la base de la sesión anterior no era la vigente) — la entrega previa (mod:93→94
//   sobre copia desactualizada) queda descartada sin efecto sobre este archivo.
// [PP] mod:94 · autor:Rune · 2026-07-10 18:05 UTC-6
// TKT1 (parent: [pendiente-ID], REQ Countdown SLA — INC high en Q-INC): buildQIncItem() —
//   AC1/AC2: .qinc-sla-countdown recibe modificador --riesgo cuando slaClass es
//   qinc-item--sla-riesgo (mismo umbral 6h, ya gateado a slaPrio 'high'). AC3 (badges
//   huérfanos qinc-badge--sla-high/medium/low) ya estaba resuelto en JS — solo faltaba
//   CSS (Nova, locus-backlog.css mod:86). 2 fixes inline aplicados sobre buildQIncItem()
//   — ver CHECKPOINT. Base tomada de mod:92 real (TKT3 undo/redo, entrada siguiente) —
//   mi entrega anterior a esta sesión había quedado en "mod:92" sobre una copia
//   desactualizada del archivo; el founder corrigió con la versión real y esta entrega
//   parte de ahí, sin pisar el fix de TKT3.
// TKT3 (deuda detectada por Finn en QA de TKT1+TKT2, mismo INC-[pendiente-ID]): _undoSnapshotIncidents()
//   en applyPatchesFromTG() se disparaba incondicionalmente aunque el batch de patches no
//   trajera ningún ítem ITIL — limpiaba _redoStackIncidents como side-effect de un patch
//   puramente Scrum (REQ/TKT). Fix: pre-scan de patches.some(getAnyItem+itemKind ITIL) antes
//   del snapshot — mismo criterio de gating que mergeBacklogFromTG() ya usa vía
//   _pendingNewIncidents.length. signature_change: false — applyPatchesFromTG() conserva firma
//   y contrato público, solo cambia cuándo dispara el snapshot interno de Incidents.
// INC-[pendiente-ID] (triggered_by REQ-202607-022 · TKT1+TKT2): fix de undo/redo para ITIL —
//   mergeBacklogFromTG() y applyPatchesFromTG() solo llamaban _undoSnapshotItems(), nunca
//   _undoSnapshotIncidents() (agregada en TKT-202607-091/092, core.js mod:110) — la creación de
//   un INC/PRB/KE/CHG nuevo vía push directo sobre getIncidents() y el patch vía mutación
//   in-place de `existing` nunca pasaban por _setIncidents(), el único mutador que dispara el
//   snapshot de INCIDENTS. Resultado: un INC creado o patcheado por CHECKPOINT no quedaba en
//   ningún stack de undo — Ctrl+Z no lo revertía. TKT1 (creación): ITIL nuevos se acumulan en
//   _pendingNewIncidents durante el forEach y se aplican con un solo _setIncidents(array) al
//   cerrar el batch — un snapshot por CHECKPOINT, no uno por ítem. TKT2 (patch): la mutación
//   field-by-field de `existing` no puede diferirse sin reescribir cada rama de campo, así que
//   se agregó _undoSnapshotIncidents() explícito al inicio de applyPatchesFromTG(), antes de
//   cualquier mutación del batch — mismo criterio que _undoSnapshotItems() ya aplicaba ahí.
//   _setIncidents() exportada desde core.js (antes interna) — signature_change: false, mismo
//   contrato, solo se agregó `export`. Sin cambio en la rama ITEMS de ninguna de las dos
//   funciones.
// INC-[pendiente-ID] (triggered_by [tmp:req-separar-undo-inc]): fix de creación/lookup ITIL —
//   un INC/PRB/KE/CHG nuevo emitido en CHECKPOINT nacía vía getItems().push(), nunca llegaba a
//   INCIDENTS y por lo tanto nunca al upsert de tracker_incidents en saveBacklog() — se perdía
//   silenciosamente. Fix en 4 puntos: (1) creación en mergeBacklogFromTG() enrutada por
//   INCIDENT_TYPES a getIncidents() en vez de getItems() incondicional; (2) existing lookup en
//   mergeBacklogFromTG() → getAnyItem() en vez de getItems().find(); (3) _findTmpMatch recibe
//   getItems().concat(getIncidents()); (4) existing lookup en applyPatchesFromTG() → getAnyItem().
//   Sin (2)-(4) el fix de (1) rompía patches/merges futuros sobre ITIL — Finn señaló que hoy
//   funcionan solo porque el INC vive por error en ITEMS. signature_change: false en las 3
//   funciones tocadas — getIncidents/getAnyItem/INCIDENT_TYPES ya estaban exportadas desde
//   core.js (TKT-202607-005/045), solo faltaba consumirlas en estos 4 call sites.
// TKT2 (REQ type-safety DISC status): en la creación de ítem (bloque de campos ITIL/discard),
//   discard_reason ausente/undefined en un ítem con status descartado ahora emite
//   _blogLog('discard-reason-ausente', ...) — antes el gap pasaba en silencio (paridad con
//   comportamiento_actual en INC, que ya alertaba). No valida contenido, no toca status
//   distinto de descartado, no modifica _VALID_DISCARD_REASONS. Solo la rama de creación —
//   la rama de type:patch (línea ~2580) no aplica aquí porque un patch siempre trae el campo
//   explícito, no hay caso de "ausente" en ese flujo.
// TKT3 (REQ type-safety DISC status): item.zona en una DISC nueva nunca se persiste (comportamiento
//   sin cambio) — se agrega _blogLog('zona-declarada-en-disc', ...) cuando el campo llega
//   declarado con cualquier valor, señal de que quien emitió el CHECKPOINT sigue asumiendo que
//   zona se valida. Regla relajada — ver __BR-Ecosystem §8 y doc_update aplicado en _pp-strategy.
//   No aplica a REQ/TKT (no declaran zona en su schema).
// TKT-202607-INC-NAMING (INC-[pendiente-ID]): applyPatchesFromTG() aplicaba `priority` sobre
//   cualquier tipo de ítem, incluyendo INC/PRB/KE/CHG — __BR-Ecosystem §8 declara ese campo
//   no-op silencioso para tipos ITIL (usan sla_priority en su lugar). No-op explícito
//   agregado antes del fallback genérico de campos patcheables. Sin cambio de firma.
// TKT-202607-075 (REQ-202607-017 · TKT2): _getNextItemCode() ahora async (core.js) — todo
//   call site pasa a await. _promoteConfirm/_promoteTktToReqConfirm → async, listener delegado
//   _blListClick (línea ~166) → async para poder await ambas. _assignPendingIds → async,
//   sub-paso 1a (asignación de código, dos call sites de _getNextItemCode) convertido de
//   .map() síncrono a for...of secuencial con await — evita que 2+ [pendiente-ID] del mismo
//   tipo en el mismo batch resuelvan al mismo NNN (regresión que Promise.all hubiera introducido
//   por condición de carrera en el escaneo de colisión). Rechazo de _getNextItemCode() dentro
//   del sub-paso 1a se captura: el ítem conserva su placeholder sin asignar (_wasAssigned no se
//   marca), warning en consola, el resto del batch continúa. mergeBacklogFromTG → async, único
//   cambio interno es await en su llamada a _assignPendingIds — resto del cuerpo sin cambio.
// [PP] mod:82 · autor:Rune · 2026-07-07 UTC-6
// TKT-202607-057 (REQ-202607-015 · TKT4): applyPatchesFromTG (~línea 2513) — resolución de
//   destItem al escribir origenDisc usa getAnyItem(resolvedIncoming) en vez de
//   getItems().find(i => i.code === resolvedIncoming). Cierra el hallazgo fuera de scope
//   declarado en mod:81 (TKT-202607-045).
// TKT-202607-045 (REQ-202607-015): chip 'Generado desde' (item.origin, ~línea 571) y escritura
//   de origenDisc al resolver promovida_a en mergeBacklogFromTG (~línea 1923) usan getAnyItem()
//   en vez de getItems().find() — ambos campos pueden apuntar a un código ITIL (INC/PRB/KE/CHG).
//   Hallazgo fuera de scope: el mismo patrón getItems().find(i => i.code === resolvedIncoming)
//   existe también en applyPatchesFromTG (~línea 2504, resolución de promovida_a en patches) y
//   no fue tocado — no está en el AC de este TKT. Mismo bug latente, requiere TKT propio.
// TKT-202607-027 (REQ-202607-013 · Deprecar Vista Kanban): removidos _renderKanban()
//   (con COLS/_kanbanStatus()/_kanbanCard() anidadas) · _kbDrop() · _kbCardClick() ·
//   handler delegado de kb-card-click · 5 listeners de drag&drop de kb-card/kb-col en
//   _attachBacklogListDelegation() · import de _getBacklogKanbanMode (ya no exportada
//   desde core.js) · guard de _getBacklogKanbanMode() en _attachBacklogDnD(), simplificado
//   a solo _getBacklogNoAcMode(). _isActiveRecently() se conserva — sigue en uso en
//   buildBacklogItem() (línea ~984), solo se retiró su invocación dentro de _kanbanCard.
//   contract_update: sí — _renderKanban ya no se exporta; locus-backlog-render.js debe
//   dejar de importarla (pendiente, archivo no adjunto en esta entrega).
// [PP] mod:78 · autor:Rune · 2026-07-06 UTC-6
// TKT-202607-009: chip de trazabilidad origen_disc en subline de buildBacklogItem() —
//   reutiliza navigateToItem() (mismo mecanismo que navigate-discard-ref) para el click;
//   edge case huérfano verificado contra getItems() antes de decidir data-action.
// INC-202607-004 (triggered_by TKT-202607-001 — módulo crítico: transversal + persistencia
//   primaria): mergeBacklogFromTG normalizaba parent→parentId DESPUÉS de _assignPendingIds —
//   _assignPendingIds resuelve parentId vía slugMap en su Paso 2, pero el campo aún se llamaba
//   'parent' en ese momento, así que la resolución se saltaba silenciosamente y el placeholder
//   quedaba copiado sin resolver. Fix: normalización movida antes de _assignPendingIds —
//   mismo orden que ya usaba applyPatchesFromTG (sin bug). Ver detalle en el bloque de código.
// TKT2 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs con resolución de [tmp:slug]
//   cross-CHECKPOINT): _assignPendingIds(tgItems, seedSlugMap?) — parámetro nuevo, opcional,
//   sin cambio de comportamiento si ausente. Seed copiado al inicio del slugMap con precedencia
//   — guard nuevo en sub-paso 1a evita reasignar código a un [tmp:slug] ya resuelto en el seed.
//   mergeBacklogFromTG(tgItems, sessionId, opts?) — propaga opts.seedSlugMap a _assignPendingIds;
//   slugMap ya se retornaba desde B-202606-022, agregado también al early-return de tgItems
//   vacío para no romper la cadena del orquestador de batch. Ver contrato completo y la función
//   orquestadora nueva (_applyCheckpointBatch) en locus-session-save.js.
// [PP] mod:61 · autor:Rune · 2026-07-01 UTC-6
// INC-[pendiente-ID] (triggered_by TKT1 REQ1 S'02 — _getActiveRoleFilter eliminada de
//   locus-backlog-core.js sin actualizar este consumidor): import roto → SyntaxError en
//   carga de módulo, bloqueaba toda la app. Import retirado + roleOk eliminado de
//   _renderKanban (línea ~132). El filtro de rol en Kanban queda inactivo — mismo estado
//   que ya tenía el resto del backlog tras la eliminación intencional en core.js.
// TKT-202606-013 (REQ-202606-003 · AC1/AC2): mergeBacklogFromTG — gate duro REQ nuevo sin TKT
//   hijo. Reemplaza la degradación orphaned:true (T-202606-010) por bloqueo real: ignored con
//   reason 'req-sin-tkt', sin creación, toast en corrida real. __BR-Core §4 Gate de parser.
// TKT-PARSER-2b (REQ-[pendiente-ID] · fix chk_status_by_type para INC/PRB/KE/CHG nuevos):
//   Gate en bloque Scrum de merge (L2007 orig.): INC/PRB/KE excluidos vía _skipScrumGate —
//   ahora llegan con item.status poblado (mirror, ver locus-session-parse.js) y sin esta
//   exclusión validateLifecycleTransitions (vocabulario Scrum) rechazaría transiciones ITIL
//   válidas. CHG no se excluye — vocabulario Scrum-compatible. Rama de creación de ítem nuevo:
//   agregados los 7 campos ITIL (incidentStatus, slaPriority, slaDeadline, comportamientoActual,
//   originModule, derivedItems, resolutionType) + queue — antes solo la rama merge-sobre-existente
//   los persistía, dejando INC/PRB/KE/CHG nuevos sin estos campos desde su creación.
// TKT-PARSER-2a (REQ-[pendiente-ID] · validación de transición ITIL y merge de campos ITIL):
//   validateIncidentTransitions() nueva — valida pares origen→destino de incidentStatus contra
//   _VALID_INCIDENT_TRANSITIONS, independiente de validateLifecycleTransitions (Scrum, sin
//   cambio). mergeBacklogFromTG: rama paralela al bloque de status Scrum — invoca la validación
//   cuando existing es ITIL e incidentStatus entrante difiere del existente; transición inválida
//   → invalidTransition (mismo array que ya recibe gaps de Scrum), resto de campos sí mergea.
//   Bloque de campos no-status ampliado con los 7 campos ITIL (incidentStatus, slaPriority,
//   slaDeadline, resolutionType, comportamientoActual, originModule, derivedItems) — mismo
//   patrón entrante-gana-si-trae-valor ya usado para title/desc/effort/area.
// TKT-C2 (REQ-C): status 'promovida'→'promoted' en comparaciones de status (L99, L1022,
//   L1612, L1630, L1892). Selector sprint: option icebox→value='' label 'Q-Backlog (sin sprint)'.
//   Edge case: datos legacy con 'promovida' cubiertos por compatibilidad de lectura (ver L99).
// Responsabilidad: Renderizado de ítems individuales — Kanban, buildBacklogItem, promoción, merge desde TRACKER-GLOBAL.
//   showMergeDiffPanel + modales de confirmación migrados a locus-backlog-merge.js (R-202605-033)
// Dependencias: locus-backlog-core.js · locus-backlog-sprints.js · locus-backlog-editor.js · locus-toast.js
import { _applyDoneStatus, _getActiveEfforts, _getActiveStatuses, _getActiveTypes, _getBacklogNoAcMode, _getNextItemCode, _hasDepsBlocked, _hasRecentSession, _isBlocked, _isCountableItem, _isQDiscActive, QDISC_ACTIVE_LIMIT, _openItemEditorSafe, _setIncidents, _skelHide, _undoSnapshotItems, _undoSnapshotIncidents, buildItemRefs, effortDots, getItems, getIncidents, getAnyItem, INCIDENT_TYPES, itemKind, renderStats, setItemStatus, toggleSectionGroup, toggleVersionCollapse, updateBacklogBanner, toggleBacklogMikeMode, toggleTypeFilter, toggleStatusFilter, toggleEffortFilter, toggleItemExpand, clearAllFilters, _getBacklogSearchQuery, _getActiveSessionAiId, _GEN2_TYPES, badgeLabel, badgeClass, statusLabel, statusClass, _newBacklogItem, _syncParentRStatus, _computeRStatusFromChildren } from './locus-backlog-core.js'; // TKT1 (REQ CAEL-0720-01): _computeRStatusFromChildren agregada — reutilizada por _checkAndOrphanParentR // TKT2 (REQ-202607-025): _newBacklogItem agregado // TKT-202607-045: getAnyItem agregada — lookup item.origin/promovida_a puede resolver ITIL // T-202606-089 AC-1+AC-3: 8 funciones · T-202606-099: _getBacklogSearchQuery · B-202606-012: _getActiveSessionAiId · TKT0-gen2: itemType→itemKind · TKT1: _GEN2_TYPES (REQ-[pendiente-ID]) · INC-[pendiente-ID]: _getActiveRoleFilter retirado del import — no exportada desde TKT1 REQ1 S'02 (core.js:2142) · INC-[pendiente-ID]: badgeLabel/badgeClass/statusLabel/statusClass — consolidados en core.js · [tmp:tkt-card-readonly]: setItemRole, _quickAssignEffort, _ECOSYSTEM_ROLES retirados — sin caller tras remover selects/botón del card (setItemRole permanece exportada en core.js para reuso futuro del IDP) · TKT-202607-027: _getBacklogKanbanMode retirado del import — no exportada desde core.js (Kanban deprecado) · TKT-202607-010: _isQDiscActive + QDISC_ACTIVE_LIMIT agregados — gate de límite Q-DISC en mergeBacklogFromTG · TKT1 (REQ-202607-021): _syncParentRStatus agregada — reemplaza a _checkAndAdvanceParentR (función local eliminada, duplicaba la misma regla con criterio divergente)
import { _markBacklogListDirty, renderBacklogList, updateClearFilterBtn, toggleChildrenBlock, setItemParent, _updateSubtabBadges } from './locus-backlog-render.js'; // T-202606-089 AC-3 · T-202606-093: _updateSubtabBadges
import { _normalizeSprint, _VALID_INCIDENT_STATUS, _VALID_PRB_STATUS, _VALID_KE_STATUS } from './locus-session-parse.js'; // TKT-PARSER-2a: constantes ITIL exportadas · TKT1 (REQ CAEL-01): _VALID_PRB_STATUS/_VALID_KE_STATUS — vocabularios propios para transición por tipo
import { _blogLog, _tplKey, getAI, getActiveSprints, _sprintDisplay, getAllSessions, saveBacklog, getActivePlan, getState } from './locus-storage.js'; // T-202606-023: getState añadido — migración window.state → import explícito


import { _buildItemMentionedIn, _buildItemMigratedBlock, openItemPanel, _openMigrateItem, _confirmMigrateItem, _acvToggle, _acvStartEdit, _acvConfirm } from './locus-backlog-panel.js'; // T-202606-089 AC-3 · TKT1 REQ CAEL-0719-01

import { _getActiveSprint, openSprintRetroView, _inheritSprintToChildren } from './locus-backlog-sprints.js'; // T-202606-089 AC-3 · [tmp:tkt-unify-sprint-inherit]: _inheritSprintToChildren añadido · [tmp:tkt-card-readonly]: setItemSprint retirado — sin caller tras remover select de sprint del card
import { navigateToItem } from './locus-item-navigator.js'; // TKT1 (REQ CAEL-04): reubicado — antes en locus-backlog-sprints.js
import { openProjPanel } from './locus-sprint-project.js'; // T-202606-089 AC-1

import { _setBacklogModified } from './locus-docs.js';

import { _gconfirmOpen } from './locus-modals.js';

import { validateLifecycleTransitions } from './locus-session-save.js'; // T-202606-020
import { incSlaPriority, incComportamientoActual, incIncidentStatus, SLA_RIESGO_WINDOW_MS } from './locus-inc-fields.js'; // TKT1 REQ-centralizar-accesores-itil + TKT-[pendiente-ID] (SLA_RIESGO_WINDOW_MS centralizado, ex-literal en buildQIncItem)

import { render } from './locus-sesiones.js';

import { showToast } from './locus-toast.js';

import { esc, getCurrentTab, switchTab } from './locus-ui-shell.js';
import { openDetail } from './locus-session-popup.js';

// Constantes canónicas del ecosistema — roles disponibles para el select de ítem
// [tmp:tkt-roles-cleanup]: copia local eliminada — consolidada en locus-backlog-core.js (import), mismo patrón que _getActiveProjectFilter/getProjectById (mod:24)

// Días sin cambio de status para considerar un ítem bloqueado (alineado con _isBlocked en core)
const _BLOCKED_DAYS = 14;

// Estado de colapso de bloques de hijos (R → Ts) — compartido con locus-backlog-render.js via export
export const _collapsedChildren = new Set();

// Labels de tipo de ítem para display en UI
const TYPE_LABELS = { REQ: 'Requerimiento', TKT: 'Ticket', INC: 'Incidente', DISC: 'Discovery', PRB: 'Problem', KE: 'Known Error', CHG: 'Change' }; // TKT-B2a: PRB/KE/CHG — ningún ítem ITIL muestra undefined en badge de tipo

// INC-[pendiente-ID]: badgeLabel/badgeClass/statusLabel/statusClass consolidados en
// locus-backlog-core.js — importadas arriba. Las copias locales generaban clases CSS
// inexistentes (badge-prio-*, badge-status-pendiente) en el render de child items.

// B-202604-194: flag de sesión — ítems cuyo AC fue reemplazado via merge. Se vacía al recargar.
const _acReplacedSet = new Set();

// ── Estado del módulo ──────────────────────────────────────────────────────
// T-202606-099: backlogSearchQuery local eliminado — consumir _getBacklogSearchQuery() desde locus-backlog-core.js
// Filtro de tipo activo
let currentFilter = 'all';
// B-202606-023: guard de delegación como variable de módulo — evita que la propiedad DOM
// persista entre renders cuando renderBacklogList reemplaza innerHTML de #backlog-list.
// renderBacklogList llama _resetBacklogListDelegation() antes de llamar _attachBacklogListDelegation().
// INC-[pendiente-ID]: state por contenedor — antes un solo flag/AbortController module-level
// asumía #backlog-list como único caller posible. Un Map permite adjuntar la misma delegación
// a #qbacklog-panel-body y #qdisc-panel-body sin que el guard de uno bloquee a los otros.
const _blListDelegationState = new Map(); // containerId -> { attached: bool, abortCtrl: AbortController|null }
function _getBlListState(containerId) {
  let state = _blListDelegationState.get(containerId);
  if (!state) {
    state = { attached: false, abortCtrl: null };
    _blListDelegationState.set(containerId, state);
  }
  return state;
}
export function _resetBacklogListDelegation(containerId = 'backlog-list') {
  const state = _getBlListState(containerId);
  if (state.abortCtrl) { state.abortCtrl.abort(); }
  state.abortCtrl = new AbortController();
  state.attached = false;
}
// ──────────────────────────────────────────────────────────────────────────

// TKT-202607-027: _renderKanban() removida — Kanban deprecado (REQ-202607-013). Incluía
// COLS, _kanbanStatus() y _kanbanCard() anidadas — sin uso fuera de esta función.

// T-202605-054: delegación de eventos para #backlog-list — reemplaza handlers inline
// Cubre: copyItemCode · copyItemToClipboard · _inlineEditTitle · _confirmUnlinkChild
//        child-expand · drag-handle · _promoteSelectType
//        TKT-202607-027: kanban card (click + drag) · kb-col (drag) removidos — Kanban deprecado
export function _attachBacklogListDelegation(containerId = 'backlog-list') {
  const listEl = document.getElementById(containerId);
  const _state = _getBlListState(containerId);
  if (!listEl || _state.attached) return;
  if (!_state.abortCtrl) { _state.abortCtrl = new AbortController(); }
  _state.attached = true;
  const _blListAbortCtrl = _state.abortCtrl; // alias local — sin cambiar las 8 referencias de signal abajo

  // --- Keydown delegation: activación por teclado de .bitem-header (role=button) — [tmp:tkt-card-readonly] AC accesibilidad ---
  listEl.addEventListener('keydown', function _blListKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = e.target.closest('.bitem-header[data-action="item-expand"]');
    if (!header) return;
    e.preventDefault();
    toggleItemExpand(parseInt(header.dataset.idx, 10));
  }, { signal: _blListAbortCtrl.signal });

  // --- Click delegation ---
  listEl.addEventListener('click', async function _blListClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const act = action.dataset.action;

    if (act === 'copy-code') {
      e.stopPropagation();
      const code = action.dataset.code;
      const idx  = parseInt(action.dataset.idx, 10);
      copyItemCode(e, code, idx);
      return;
    }
    if (act === 'copy-item') {
      e.stopPropagation();
      copyItemToClipboard(e, action.dataset.code);
      return;
    }
    if (act === 'unlink-child') {
      e.stopPropagation();
      _confirmUnlinkChild(action.dataset.childCode, action.dataset.rCode);
      return;
    }
    if (act === 'child-expand') {
      e.stopPropagation();
      const code   = action.dataset.childCode;
      const safeId = action.dataset.safeId;
      const ci = getItems().findIndex(x => x.code === code);
      if (ci >= 0) toggleItemExpand(ci);
      const arrow = document.getElementById('ciarrow-' + safeId);
      const body  = document.getElementById('ibody-'  + safeId);
      if (arrow && body) arrow.textContent = body.classList.contains('open') ? '▾' : '▸';
      return;
    }
    if (act === 'drag-handle') {
      e.stopPropagation();
      return;
    }
    // TKT-202607-027: handler de kanban card click removido — Kanban deprecado
    if (act === 'ref-chip-session') {
      switchTab('sesiones');
      setTimeout(() => { openDetail(action.dataset.aiId, action.dataset.sessId); }, 120);
      return;
    }
    if (act === 'item-expand') {
      const idx = parseInt(action.dataset.idx, 10);
      toggleItemExpand(idx);
      return;
    }
    if (act === 'edit-child') {
      e.stopPropagation();
      _openItemEditorSafe(null, action.dataset.code);
      return;
    }
    if (act === 'toggle-children') {
      e.stopPropagation();
      toggleChildrenBlock(action.dataset.rCode);
      return;
    }
    if (act === 'navigate-origin') {
      e.stopPropagation();
      navigateToItem(action.dataset.origin);
      return;
    }
    if (act === 'open-blocker') {
      e.stopPropagation();
      openItemPanel(action.dataset.code);
      return;
    }
    if (act === 'promote-item') {
      e.stopPropagation();
      _promoteItem(action.dataset.code);
      return;
    }
    if (act === 'discard-idea') {
      e.stopPropagation();
      setItemStatus(action.dataset.code, 'descartado');
      return;
    }
    if (act === 'open-status-popover') {
      _openStatusPopover(e, action.dataset.code);
      return;
    }
    if (act === 'navigate-discard-ref') {
      e.stopPropagation();
      navigateToItem(action.dataset.ref);
      return;
    }
    if (act === 'navigate-origen-disc') {
      e.stopPropagation();
      navigateToItem(action.dataset.ref);
      return;
    }
    if (act === 'bitem-edit') {
      _openItemEditorSafe(null, action.dataset.code);
      return;
    }
    if (act === 'bitem-promote') {
      e.stopPropagation();
      _promoteItem(action.dataset.code);
      return;
    }
    if (act === 'bitem-promote-tkt-to-req') {
      e.stopPropagation();
      _promoteTktToReq(action.dataset.code);
      return;
    }
    if (act === 'bitem-migrate') {
      e.stopPropagation();
      _openMigrateItem(action.dataset.code);
      return;
    }
    // inline_fix (triggered_by TKT1 REQ CAEL-0719-01): promote-modal-cancel/promote-confirm/
    // promote-tkt-to-req-cancel/promote-tkt-to-req-confirm removidos de este listener —
    // #promote-modal-overlay nunca estuvo anidado dentro de #backlog-list, estos cases eran
    // inalcanzables por clic real. Su delegación real vive en _attachPromoteModalDelegation()
    // (listener atado directamente a #promote-modal-overlay), expandida más abajo.
    if (act === 'acv-toggle') {
      e.stopPropagation();
      _acvToggle(action.dataset.panelId);
      return;
    }
    if (act === 'acv-open-editor') {
      e.stopPropagation();
      _openItemEditorSafe(null, action.dataset.code);
      return;
    }
    if (act === 'acv-clarify') {
      e.stopPropagation();
      _acvStartEdit(action.dataset.rowId, action.dataset.code, parseInt(action.dataset.ci, 10));
      return;
    }
    if (act === 'acv-confirm') {
      e.stopPropagation();
      _acvConfirm(action.dataset.code, action.dataset.panelId);
      return;
    }
    if (act === 'bitem-meta-stop') {
      e.stopPropagation();
      return;
    }
    if (act === 'status-change') {
      e.stopPropagation();
      setItemStatus(action.dataset.code, action.value || action.dataset.value);
      return;
    }
    // Render-level actions (from locus-backlog-render.js)
    if (act === 'bl-sprint-retro') {
      e.stopPropagation();
      openSprintRetroView(action.dataset.sprintId);
      return;
    }
    if (act === 'bl-plan-close') {
      const cb = action.dataset.callback;
      if (cb && window[cb]) { window[cb](); }
      return;
    }
    if (act === 'es-switch-tab') {
      switchTab(action.dataset.tab);
      return;
    }
    if (act === 'es-open-proj-panel') {
      openProjPanel();
      return;
    }
    if (act === 'es-clear-search') {
      clearBacklogSearch();
      return;
    }
    if (act === 'es-toggle-mike') {
      toggleBacklogMikeMode();
      return;
    }
    if (act === 'es-filter-all') {
      setFilter('all');
      return;
    }
    if (act === 'es-clear-filters') {
      clearAllFilters(); // T-202606-107 fix-inline: llamada directa — elimina dependencia frágil de filter-clear-btn en DOM
      return;
    }
    if (act === 'es-import') {
      // T-202606-107: CTA de empty state vacío real — dispara click en el input de importar
      const fileInput = document.getElementById('backlog-file-input');
      if (fileInput) fileInput.click();
      return;
    }
    if (act === 'version-collapse') {
      toggleVersionCollapse(action.dataset.groupId);
      return;
    }
    if (act === 'section-group-toggle') {
      toggleSectionGroup(action.dataset.group);
      return;
    }
    // bl-r-toggle — colapsa/expande la lista de TKTs hijos de un REQ en la vista de backlog list
    // (locus-backlog-render.js ~L1173 emite el trigger + el contenedor #bl-children-[rCode])
    // Estado persistido en localStorage bajo locus-r-collapsed-[rCode]
    if (act === 'bl-r-toggle') {
      e.stopPropagation();
      const rCode = action.dataset.rCode;
      if (!rCode) return;
      const body = document.getElementById('bl-children-' + CSS.escape(rCode));
      if (!body) return;
      const isNowCollapsed = !body.classList.contains('collapsed');
      body.classList.toggle('collapsed', isNowCollapsed);
      action.classList.toggle('collapsed', isNowCollapsed);
      const _collapseKey = 'locus-r-collapsed-' + rCode;
      if (isNowCollapsed) {
        localStorage.setItem(_collapseKey, '1');
      } else {
        localStorage.removeItem(_collapseKey);
      }
      return;
    }
  }, { signal: _blListAbortCtrl.signal });

  // --- Change delegation: item-status-select removido en [tmp:tkt-card-readonly] — status/role/sprint/parent ya no son editables desde el card, se editan en el panel (locus-backlog-panel.js)

  // --- Dblclick delegation: inline-edit-title removido en [tmp:tkt-card-readonly] — título ya no editable desde el card

  // TKT-202607-027: listeners de drag&drop de kb-card/kb-col removidos — Kanban deprecado
}

// _attachBacklogListDelegation: llamado al final de renderBacklogList (ver locus-backlog-render.js)

// Promote modal delegation — #promote-modal-overlay es DOM estático, attachment único.
// TKT1 REQ CAEL-0719-01: único listener real de este overlay — expandido para cubrir los 7
// data-action de los tres flujos que comparten el shell (Promover idea, Promover T→R, Mover
// entre proyectos). inline_fix: antes solo cubría promote-select-type; promote-modal-cancel/
// promote-confirm/promote-tkt-to-req-cancel/promote-tkt-to-req-confirm vivían inalcanzables
// en el listener de #backlog-list (ver _blListClick).
(function _attachPromoteModalDelegation() {
  document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('promote-modal-overlay');
    if (!overlay) return;
    overlay.addEventListener('click', async function(e) {
      const action = e.target.closest('[data-action]');
      if (!action) return;
      const act = action.dataset.action;
      if (act === 'promote-select-type') {
        _promoteSelectType(action.dataset.type);
        return;
      }
      if (act === 'promote-modal-cancel' || act === 'promote-tkt-to-req-cancel') {
        overlay.classList.remove('open');
        return;
      }
      if (act === 'promote-confirm') {
        await _promoteConfirm(action.dataset.code);
        return;
      }
      if (act === 'promote-tkt-to-req-confirm') {
        await _promoteTktToReqConfirm(action.dataset.code);
        return;
      }
      if (act === 'migrate-cancel') {
        overlay.classList.remove('open');
        const body = document.getElementById('promote-modal-body');
        if (body) body.classList.remove('migrate-modal');
        return;
      }
      if (act === 'migrate-confirm') {
        _confirmMigrateItem(action.dataset.itemCode);
        return;
      }
    });
  });
})();

// T-202604-076: DnD para reordenar ítems dentro de grupo sprint (no aplica a done/descartado ni a modo plano)
export function _attachBacklogDnD() {
  // T-202606-062: _getBacklogSprintGroupMode eliminada — vista lista es el modo por defecto.
  // TKT-202607-027: chequeo de _getBacklogKanbanMode removido — Kanban deprecado, ya no existe modo exclusivo que compita con DnD de sprint
  if (_getBacklogNoAcMode()) return;
  // Solo grupos sprint: vbody-{groupId} — excluye sgbody-done, sgbody-discarded y vbody-flat
  const sprintBodies = document.querySelectorAll('[id^="vbody-"]:not(#vbody-flat)');
  sprintBodies.forEach(body => {
    const items = body.querySelectorAll('.item[data-code]');
    items.forEach(el => {
      const handle = el.querySelector('.item-drag-handle');
      if (!handle) return; // sin handle = sin sprint = no draggable
      el.draggable = true;
      handle.addEventListener('mousedown', () => { handle.classList.add('cursor-grabbing'); });
      handle.addEventListener('mouseup', () => { handle.classList.remove('cursor-grabbing'); });
      el.addEventListener('dragstart', e => {
        // B-202605-013: eliminado guard e.target === handle — dragstart dispara en el (.item), no en el handle
        // La activación ya está acotada: solo ítems con .item-drag-handle llegan aquí (guard L3650)
        e.dataTransfer.setData('text/plain', el.dataset.code);
        el.classList.add('item-dragging');
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('item-dragging');
        handle.classList.remove('cursor-grabbing');
      });
      el.addEventListener('dragover', e => {
        e.preventDefault();
        el.classList.add('item-drag-over');
      });
      el.addEventListener('dragleave', () => {
        el.classList.remove('item-drag-over');
      });
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('item-drag-over');
        const fromCode = e.dataTransfer.getData('text/plain');
        const toCode = el.dataset.code;
        if (!fromCode || fromCode === toCode) return;
        const fromIdx = getItems().findIndex(i => i.code === fromCode);
        const toIdx   = getItems().findIndex(i => i.code === toCode);
        if (fromIdx < 0 || toIdx < 0) return;
        const fromItem = getItems()[fromIdx];
        const toItem   = getItems()[toIdx];
        // T-202606-160: TKT con parent — bloquear drop a sprint distinto al del parent REQ con mensaje
        if (fromItem.parentId && fromItem.code && itemKind(fromItem) === 'TKT') {
          const _dndParent = getItems().find(i => i.code === fromItem.parentId);
          if (_dndParent && ((_dndParent.sprint || '') !== (toItem.sprint || ''))) {
            showToast('warning', 'El sprint del TKT se hereda de su parent ' + fromItem.parentId);
            return;
          }
        }
        // T sin parent — bloqueo genérico cross-sprint (reordenación dentro del mismo sprint)
        if ((fromItem.sprint || '') !== (toItem.sprint || '')) return;
        const [moved] = getItems().splice(fromIdx, 1);
        getItems().splice(toIdx, 0, moved);
        _undoSnapshotItems();
        saveBacklog();
        _markBacklogListDirty(); renderBacklogList();
      });
    });
  });
}

// [tmp:tkt-card-readonly]: _inlineEditTitle removida — título no editable desde el card, edición vía panel (locus-backlog-panel.js)

// T-202604-048: construir mini progress-bar de hijos para R
// T-202604-187/188: _buildChildrenBlock con colapsable y progreso
// [tmp:tkt1-children-block] (REQ · separación ITEM/INCIDENT): un ítem ITIL puede tener
// status 'done' inválido para su tipo — el cierre real vive en incident_status. Usar este
// helper en vez de comparar i.status directamente en cualquier lugar que cuente "hecho".
function _isChildDone(item) {
  if (item.status === 'done') return true;
  if (item.incident_status === 'closed') return true; // INC/PRB
  if (itemKind(item) === 'KE' && item.incident_status === 'resolved') return true;
  return false;
}

function _buildChildrenBlock(rCode) {
  // B-202604-158: respetar filtros activos — solo mostrar hijos que pasan tipo y status
  // TKT3 (REQ CAEL-0720-1x, fix inline): la concatenación de getIncidents() para capturar un
  // INC/PRB/KE/CHG con parentId propio queda retirada — parentId es exclusivo de TKT desde el
  // gate cerrado en mergeBacklogFromTG/applyPatchesFromTG. Ese widen (agregado originalmente en
  // mod:79, revertido en REQ CAEL-0720-10) ya no puede ocurrir por ninguna vía — ITEMS es el
  // único universo que puede tener hijos de un REQ.
  const allChildren = getItems().filter(i => i.parentId === rCode && itemKind(i) === 'TKT');
  if (!allChildren.length) return '';
  const children = allChildren.filter(i => {
    const t = itemKind(i);
    const typeOk = t ? _getActiveTypes().has(t) : true;
    // [tmp:tkt1-children-block]: activeStatuses solo tiene vocabulario Scrum
    // (pendiente/en-revision por defecto) — un ítem ITIL nunca calza ahí aunque
    // su .status mirror sea válido (detected/in_progress/closed/...). El toggle
    // de status del filtro no aplica a ITIL — solo el toggle de tipo lo gatea.
    const statusOk = (t && INCIDENT_TYPES.includes(t)) ? true : _getActiveStatuses().has(i.status);
    return typeOk && statusOk;
  });
  if (!children.length) return '';
  const doneCount = children.filter(_isChildDone).length;
  const pct = Math.round((doneCount / children.length) * 100);
  const isCollapsed = _collapsedChildren.has(rCode);

  const childRows = children.map(child => {
    // B-202605-011: IDs de DOM desde item.code — estables ante mutaciones de getItems()
    const cSafeId = child.code.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cType = itemKind(child) || '';
    const isDoneC = child.status === 'done';
    return `<div class="child-item t-item${isDoneC ? ' is-done' : ''}">
      <span class="child-collapse-arrow" id="ciarrow-${cSafeId}" data-action="child-expand" data-child-code="${esc(child.code)}" data-safe-id="${cSafeId}">&#x25B8;</span>
      <span class="item-type-pill ${cType} item-type-pill--sm">${cType}</span>
      <span class="child-title" data-action="child-expand" data-child-code="${esc(child.code)}" data-safe-id="${cSafeId}">${esc(child.title)}</span>
      <span class="badge ${statusClass(child.status)} badge--sm">${statusLabel(child.status)}</span>
    </div>
    <div class="item-body item-body--child" id="ibody-${cSafeId}">
      <div id="code-badge-${cSafeId}" data-action="copy-code" data-code="${esc(child.code)}" data-idx="-1" title="Click para copiar ID" class="item-code-badge">${esc(child.code)}</div>
      <div class="child-meta-row">
        <span class="badge ${badgeClass(child.priority)} badge--sm">${badgeLabel(child.priority)}</span>
        ${child.area ? `<span class="badge badge-area badge--sm">${esc(child.area)}</span>` : ''}
        ${child.effort ? `<div class="effort-dots effort-dots--inline">${effortDots(child.effort)}</div>` : ''}
      </div>
      ${child.ac && child.ac.length ? `<ul class="ac-list open ac-list--child">${child.ac.map(c => `<li class="ac-list-item--sm">${esc(c)}</li>`).join('')}</ul>` : ''}
      <div class="child-actions">
        <button data-action="edit-child" data-code="${esc(child.code)}" class="btn-ghost btn-ghost--sm" title="Editar ítem">✎ Editar</button>
        <button data-action="unlink-child" data-child-code="${esc(child.code)}" data-r-code="${esc(rCode)}" class="btn-ghost btn-ghost--sm btn-ghost--muted" title="Desvincular del R padre">⊠ Desvincular</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="req-children-block">
    <div class="req-children-header" data-action="toggle-children" data-r-code="${esc(rCode)}">>
      <span class="req-children-tickets-label">Ítems</span>
      <div class="req-children-bar-wrap"><div class="req-children-bar" style="--rch-bar-w:${pct}%"></div></div>
      <span class="req-children-label">${doneCount}/${children.length} · ${pct}%</span>
      <span id="req-children-arrow-${esc(rCode)}" class="req-children-arrow">${isCollapsed ? '▸' : '▾'}</span>
    </div>
    <div class="req-children-list${isCollapsed ? ' collapsed' : ''}" id="req-children-body-${esc(rCode)}"><div class="req-children-inner">${childRows}</div></div>
  </div>`;
}

// T-202604-004: desvincular child de R padre con confirmación
function _confirmUnlinkChild(childCode, rCode) {
  _gconfirmOpen({
    title: 'Desvincular ítem',
    msg: `¿Desvincular ${childCode} de ${rCode}? El ítem quedará sin padre.`,
    okLabel: 'Desvincular',
    danger: true
  }, () => {
    const item = getItems().find(i => i.code === childCode);
    if (item) { item.parentId = null; saveBacklog(); _markBacklogListDirty(); renderBacklogList(); renderStats(); showToast('success', `${childCode} desvinculado`); }
  });
}

// T-202604-028: timestamps legibles para item-body
function _buildItemTimestamps(item) {
  const _fmt = ts => {
    if (!ts) return null;
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays/7)} sem.`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays/30)} mes${Math.floor(diffDays/30)>1?'es':''}`;
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  };
  const _iso = ts => ts ? new Date(ts).toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' }) : '';
  const rows = [];
  if (item.createdAt) rows.push(`<span title="${_iso(item.createdAt)}">📅 Creado: <strong>${_fmt(item.createdAt)}</strong></span>`);
  if (item.statusChangedAt) rows.push(`<span title="${_iso(item.statusChangedAt)}">🔄 Último cambio: <strong>${_fmt(item.statusChangedAt)}</strong></span>`);
  if (item.doneAt) rows.push(`<span title="${_iso(item.doneAt)}">✅ Completado: <strong>${_fmt(item.doneAt)}</strong></span>`);
  if (!rows.length) return '';
  return `<div class="bitem-timestamps">${rows.join('')}</div>`;
}

// R-[pendiente-ID]: bloque de origen P padre — muestra enlace al P que originó este ítem
function _buildItemPOriginBlock(item) {
  if (!item.origin) return '';
  // TKT-202607-045: getAnyItem() — item.origin puede apuntar a un código ITIL (INC/PRB/KE/CHG),
  // que vive en INCIDENTS, no en ITEMS.
  const pItem = getAnyItem(item.origin);
  const pTitle = pItem ? esc(pItem.title) : '';
  return `<div class="bitem-origin-p-block">
    <span class="bitem-origin-p-label">Origen</span>
    <button class="bitem-origin-p-link" data-action="navigate-origin" data-origin="${esc(item.origin)}" title="${pTitle}">${esc(item.origin)}</button>
    ${pTitle ? `<span class="bitem-origin-p-name" title="${pTitle}">${pTitle}</span>` : ''}
  </div>`;
}

// T-202604-NNN: bloque de origen — IA, sesión y archivos relacionados del ítem
function _buildItemOriginBlock(item) {
  if (!item.sessionId) return '';

  // getAllSessions() retorna sesiones planas con s.aiId — no {sess,ai} pairs
  const allSessions = getAllSessions();
  const foundSess = allSessions.find(s => s && s.id === item.sessionId);
  if (!foundSess) return '';

  const foundAi = getAI(foundSess.aiId);

  const aiName = foundAi ? esc(foundAi.name || foundAi.id) : '—';
  const aiAvatar = (foundAi && foundAi.avatar) ? `<span class="bitem-origin-avatar">${foundAi.avatar}</span>` : '';

  // Fecha de sesión
  const _fmtSessDate = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  };
  const sessDate = foundSess.date ? esc(foundSess.date) : _fmtSessDate(foundSess.savedAt || foundSess.createdAt);
  const sessTitle = foundSess.title ? esc(foundSess.title) : '';
  const sessLabel = sessTitle ? `${sessTitle}${sessDate ? ' · ' + sessDate : ''}` : (sessDate || foundSess.id);

  // Archivos relacionados — sess.files es string (texto libre del paste), convertir a array
  const _filesRaw = foundSess.files || foundSess.archivos || '';
  const files = Array.isArray(_filesRaw)
    ? _filesRaw.filter(Boolean)
    : _filesRaw.split(/[\n,]+/).map(f => f.trim()).filter(Boolean);
  const filesHtml = files.length
    ? `<div class="bitem-origin-row bitem-origin-row--files">
        <span class="bitem-origin-label">Archivos</span>
        <div class="bitem-origin-files">
          ${files.map(f => `<span class="bitem-origin-file-pill" title="${esc(f)}">${esc(f)}</span>`).join('')}
        </div>
       </div>`
    : '';

  return `<div class="bitem-origin-block">
    <div class="bitem-origin-row">
      <span class="bitem-origin-label">IA</span>
      <span class="bitem-origin-value">${aiAvatar}${aiName}</span>
    </div>
    <div class="bitem-origin-row bitem-origin-row--mt">
      <span class="bitem-origin-label">Sesión</span>
      <span class="bitem-origin-value" title="${esc(foundSess.id || '')}">${sessLabel}</span>
    </div>
    ${filesHtml}
  </div>`;
}

// R-202605-010: status chip popover — un solo popover activo a la vez
let _statusPopoverCode = null;
function _openStatusPopover(e, code) {
  e.stopPropagation();
  // Cerrar popover previo
  const prev = document.getElementById('status-popover');
  if (prev) prev.remove();
  if (_statusPopoverCode === code) { _statusPopoverCode = null; return; }
  _statusPopoverCode = code;

  const item = getItems().find(i => i.code === code);
  if (!item) { _statusPopoverCode = null; return; }

  const isIdea = itemKind(item) === 'DISC';
  const options = [
    { val: 'pendiente', label: 'Pendiente' },
    ...(!isIdea ? [{ val: 'en-revision', label: 'En revisión' }] : []),
    ...(!isIdea ? [{ val: 'done', label: 'Hecho' }] : []),
    { val: 'descartado', label: 'Descartado' }
  ];

  const pop = document.createElement('div');
  pop.id = 'status-popover';
  pop.className = 'bitem-status-popover';
  pop.setAttribute('role', 'menu');
  pop.onclick = e2 => e2.stopPropagation();

  pop.innerHTML = options.map(o =>
    `<button class="bitem-status-popover-btn${item.status === o.val ? ' is-current' : ''}" data-val="${o.val}">${o.label}</button>`
  ).join('');

  pop.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const newVal = btn.dataset.val;
      pop.remove();
      _statusPopoverCode = null;
      if (newVal !== item.status) {
        try {
          setItemStatus(code, newVal);
        } catch(err) {
          showToast('error', 'Error al cambiar status', null, 3000);
          // chip revierte automáticamente tras el re-render de renderBacklogList
        }
      }
    });
  });

  document.body.appendChild(pop);

  // Posicionar bajo el chip trigger
  const trigger = e.currentTarget;
  const rect = trigger.getBoundingClientRect();
  const popW = 120;
  let left = rect.left + window.scrollX;
  if (left + popW > window.innerWidth) left = window.innerWidth - popW - 8;
  pop.style.setProperty('--sp-top', (rect.bottom + window.scrollY + 4) + 'px');
  pop.style.setProperty('--sp-left', left + 'px');

  // Cerrar con Escape
  const _escHandler = ev => {
    if (ev.key === 'Escape') { pop.remove(); _statusPopoverCode = null; document.removeEventListener('keydown', _escHandler); }
  };
  document.addEventListener('keydown', _escHandler);

  // Cerrar al click fuera
  const _outsideHandler = ev => {
    if (!pop.contains(ev.target) && ev.target !== trigger) {
      pop.remove();
      _statusPopoverCode = null;
      document.removeEventListener('click', _outsideHandler, true);
    }
  };
  setTimeout(() => document.addEventListener('click', _outsideHandler, true), 0);
}

// T-108: construir un ítem colapsado
// opts.suppressChildren: true — omite _buildChildrenBlock() cuando el caller ya inyecta
// hijos en un wrapper externo (ej. bl-vl-req en _renderVistaLista). Sin este flag, los hijos
// aparecen duplicados: una vez en el wrapper externo y otra en el body expandido del R.
// Contextos sin wrapper externo (Kanban, Icebox, Hotfix) NO deben pasar este flag.
export function buildBacklogItem(item, opts = {}) {
  const globalIdx = getItems().indexOf(item);
  const isDone = item.status === 'done';
  const isDiscarded = item.status === 'descartado';
  const isHistorico = item.status === 'historico'; // B-202604-193: read-only
  const type = itemKind(item) || '';
  const typeLabel = TYPE_LABELS[type] || type;
  // R-202605-098: gate único para toda lógica diferenciada de tipo DISC
  const isIdea = type === 'DISC';

  // T-202604-050: detectar campos obligatorios faltantes (no aplica a descartados ni a P)
  // R-202605-098: P no tiene effort ni AC obligatorios — son conceptos que emergen al promoverse
  const missingFields = [];
  if (!isDiscarded) {
    if (!isIdea && !item.effort) missingFields.push('effort');
    if (!item.area)   missingFields.push('area');
    if (!isIdea && (!item.ac || !item.ac.length)) missingFields.push('ac');
  }
  // R-202605-122 AC2/AC3 (revisado [tmp:tkt-card-readonly]): badge 'sin effort' — informativo, sin quick-assign; asignar effort es acción del panel
  const _missingEffort = !isDiscarded && !isIdea && !item.effort;
  const _effortQuickBadge = _missingEffort
    ? `<span class="badge-missing badge-missing--effort" title="Esfuerzo no declarado — requerido para burndown. Asignar desde el panel del ítem.">⚠ sin effort</span>`
    : '';
  const _otherMissing = missingFields.filter(f => f !== 'effort');
  const missingAlert = (_missingEffort || _otherMissing.length)
    ? `<div class="bitem-missing-row">${_effortQuickBadge}${_otherMissing.map(f => `<span class="badge-missing">⚠ falta ${f}</span>`).join(' ')}</div>`
    : '';

  // AC list
  const acHtml = item.ac && item.ac.length
    ? `<div class="bitem-ac-block">
        <div class="bitem-ac-header">
          <span class="bitem-ac-check">✓</span>
          <span class="bitem-ac-count">${item.ac.length} criterio${item.ac.length !== 1 ? 's' : ''}</span>
        </div>
        <ul class="bitem-ac-list open">
          ${item.ac.map(c => `<li><span class="bitem-ac-dot"></span><span>${esc(c)}</span></li>`).join('')}
        </ul>
       </div>`
    : `<div class="bitem-ac-block"><div class="bitem-ac-header bitem-ac-header--empty">Sin criterios de aceptación</div></div>`;

  // Effort dots — large version for header, styled
  const effortN = parseInt(item.effort) || 0;
  const effortDotsHtml = (() => {
    let d = '';
    for (let i = 0; i < 3; i++) d += `<span class="bitem-effort-dot${i < effortN ? ' on' : ''}"></span>`;
    return `<div class="bitem-effort-dots" title="Esfuerzo ${effortN}/3">${d}</div>`;
  })();

  // Priority color
  const prioColors = { high:'#e85555', medium:'#f59e0b', low:'var(--hint)' };
  const prioColor = prioColors[item.priority] || 'var(--hint)';
  const prioBadgeHtml = (!isDone && !isDiscarded && item.priority)
    ? `<span class="bitem-prio-badge prio-${item.priority}">${badgeLabel(item.priority)}</span>`
    : '';
  // T-202604-199: badge "Sin AC" — solo en pendiente sin criterios
  const noAcBadge = (!isDone && !isDiscarded && item.status === 'pendiente' && (!item.ac || !item.ac.length))
    ? '<span class="badge-missing badge-missing--warning">Sin AC</span>'
    : '';
  // T-202604-261: badge "bloqueado" — pendiente con sprint >14 días sin cambio de status
  const blockedBadge = _isBlocked(item)
    ? '<span class="badge-missing badge-missing--blocked" title="Sin cambio de status en más de 14 días">⛔ bloqueado</span>'
    : '';
  // R-202605-045 · T-202605-083: staleness-pill — punto único de cálculo via _staleness()
  // B-202605-048: omitir pill si item.createdAt es inválido (legacy sin timestamp) — manejado en _staleness()
  const _stalenessData = (!isDone && !isDiscarded) ? _staleness(item) : null;
  const noSessionBadge = _stalenessData
    ? `<span class="staleness-pill staleness--${_stalenessData.modifier}" title="Sin sesión vinculada — ${_stalenessData.days}d desde último cambio de status">${_stalenessData.label}</span>`
    : '';

  // B-202606-015: badge "Sin Ts" — R con orphaned:true (sin Ts válidos)
  const orphanedBadge = (!isDone && !isDiscarded && type === 'REQ' && item.orphaned)
    ? '<span class="staleness-pill staleness--orphaned" title="R sin Ts válidos — especificar T1 antes de ejecutar">Sin Ts</span>'
    : '';

  // TKT-202607-063 (REQ-202607-016): badge "Campos ITIL incompletos" — item.itil_incomplete
  // no vacío (ver _normalizeIncidents(), TKT-202607-062). Mismo patrón que orphanedBadge —
  // staleness-pill con modificador semántico propio. Bloqueo CSS: .staleness--itil-incompleto
  // no está definida aún en locus-backlog-item.css — coordinar con Nova antes de estilizar.
  const itilIncompleteBadge = (!isDone && !isDiscarded && Array.isArray(item.itil_incomplete) && item.itil_incomplete.length)
    ? `<span class="staleness-pill staleness--itil-incompleto" title="Falta: ${esc(item.itil_incomplete.join(', '))}">Campos ITIL incompletos</span>`
    : '';

  // Children count + progreso para R type (T-188)
  // B-202605-052: usar getItems() sin filtrar como denominador — los filtros activos no afectan el porcentaje
  // B-202606-016: denominador = todos los hijos sin filtro · numerador = done + descartado (ambos cuentan como cerrados)
  // B-202606-019: denominador excluye hijos descartados — solo Ts no descartados forman el total
  const childCount = type === 'REQ' ? getItems().filter(i => i.parentId === item.code && i.status !== 'descartado').length : 0;
  const childDoneCount = type === 'REQ' ? getItems().filter(i => i.parentId === item.code && i.status === 'done').length : 0;
  const childBadge = (type === 'REQ' && childCount > 0 && !isDone && !isDiscarded)
    ? `<span class="bitem-child-badge" title="${childDoneCount}/${childCount} ítems done">${childDoneCount}/${childCount} <span class="bitem-child-badge-label">ítems</span></span>`
    : '';

  // T-202604-288: badge "Bloqueado por [código]" — blockedBy explícito pendiente
  const blockedByItems = (!isDone && !isDiscarded && item.blockedBy && item.blockedBy.length)
    ? item.blockedBy.filter(c => { const dep = getItems().find(i => i.code === c); return !dep || dep.status !== 'done'; })
    : [];
  const blockedByBadge = blockedByItems.length
    ? blockedByItems.map(c =>
        `<span class="badge-missing badge-missing--blocked badge-blocked-by" data-action="open-blocker" data-code="${esc(c)}" title="Ir al ítem bloqueante">🔒 ${esc(c)}</span>`
      ).join('')
    : '';

  // T-202606-142: badge "bloqueado por T-XXX" — depends_on con T bloqueante no done
  // Solo aplica a Ts no done ni descartados con dependencias activas no resueltas.
  // T-202606-013: filtrar valores placeholder ([pendiente-ID], [tmp:slug]) antes de evaluar existencia en backlog
  const _depPlaceholderRe = /^\[pendiente-ID\]$|^\[tmp:.+\]$/;
  const _depBlockedCodes = (!isDone && !isDiscarded && type === 'TKT' && Array.isArray(item.dependsOn) && item.dependsOn.length)
    ? item.dependsOn.filter(c => !_depPlaceholderRe.test(c)).filter(c => { const dep = getItems().find(i => i.code === c); return !dep || dep.status !== 'done'; })
    : [];
  const depBlockedBadge = _depBlockedCodes.length
    ? _depBlockedCodes.map(c =>
        `<span class="badge-missing badge-missing--dep-blocked" title="Depende de ${esc(c)} — no completado">⛔ bloqueado por ${esc(c)}</span>`
      ).join('')
    : '';
  const _isDepBlocked = _depBlockedCodes.length > 0;

  // R-202604-051: badge blocking:true — ítem bloqueante activo
  const blockingBadge = (!isDone && !isDiscarded && item.blocking)
    ? `<span class="badge-blocking" title="Este ítem bloquea a otros — debe resolverse primero">⚠ bloqueante</span>`
    : '';

  // B-202604-194: badge "AC actualizados" — flag de sesión en _acReplacedSet, desaparece al recargar
  const acReplacedBadge = (!isDone && !isDiscarded && _acReplacedSet.has(item.id))
    ? '<span class="badge-ac-replaced" title="Los criterios de aceptación fueron reemplazados en esta sesión via merge">↺ AC</span>'
    : '';

  // R-202604-091: decorador de actividad reciente — sesión vinculada en los últimos 7 días
  const isActive = (!isDone && !isDiscarded) ? _isActiveRecently(item) : false;

  // R-202605-131: badge scope added — ítem añadido durante el sprint activo
  const scopeAddedBadge = (!isDone && !isDiscarded && item.scope_added)
    ? '<span class="badge-scope-added" title="Añadido al sprint después de su apertura">＋ scope</span>'
    : '';

  // Header right slot
  // R-202605-098: para P pendiente — acciones inline en header sin necesidad de expandir
  const _ideaQuickActions = (isIdea && !isDiscarded && !isDone)
    ? `<div class="item-quick-actions">
        <button class="btn-promote" data-action="promote-item" data-code="${esc(item.code)}" title="Promover a Ticket o Requerimiento">⬆ Promover</button>
        <button class="btn-discard-idea" data-action="discard-idea" data-code="${esc(item.code)}" title="Descartar esta idea">✕ Descartar</button>
       </div>`
    : '';
  // R-202605-010: status chip inline clickeable — solo para ítems pendientes (no P, no done, no descartado)
  const _statusChipHtml = (!isDone && !isDiscarded && !isIdea)
    ? `<button class="bitem-status-chip bitem-status-chip--${esc(item.status || 'pendiente')}" data-action="open-status-popover" data-code="${esc(item.code)}" title="Cambiar status" type="button">${statusLabel(item.status || 'pendiente')}</button>`
    : '';
  // Cerradas: DISC promovida muestra badge en lugar de quick actions o ícono descartado
  // TKT-C2: 'promoted' (Gen2). Edge case: datos legacy 'promovida' también matchean.
  const _isPPromovida = isIdea && (item.status === 'promoted' || item.status === 'promovida');
  const _pPromovidaRef = _isPPromovida && item.promovida_a ? item.promovida_a : null;
  const _pPromovidaBadge = _isPPromovida
    ? `<span class="item-p-badge item-p-badge--promovida" title="Idea promovida${_pPromovidaRef ? ' a ' + _pPromovidaRef : ''}">↗ promovida${_pPromovidaRef ? '<span class="item-p-badge-ref"> ' + esc(_pPromovidaRef) + '</span>' : ''}</span>`
    : '';

  const headerRight = _isPPromovida
    ? `<div class="bitem-header-right">${_pPromovidaBadge}</div>`
    : isDiscarded
    ? `<span class="bitem-discarded-icon">🗑</span>`
    : isDone
      ? `<span class="bitem-done-check">✓</span>`
      : isIdea
        ? `<div class="bitem-header-right">${prioBadgeHtml}${_ideaQuickActions}</div>`
        : `<div class="bitem-header-right">${scopeAddedBadge}${noAcBadge}${acReplacedBadge}${blockingBadge}${blockedBadge}${blockedByBadge}${depBlockedBadge}${orphanedBadge}${itilIncompleteBadge}${noSessionBadge}${childBadge}${prioBadgeHtml}${effortDotsHtml}${_statusChipHtml}</div>`;

  // R-202605-098: subline discard reason diferenciado para P
  // P descartado por promoción → chip con ref; P descartado manual → razón libre
  const _discardReasonHtml = (isDiscarded && item.discardReason)
    ? isIdea && item.discardRef
      ? `<span class="idea-promoted-chip" data-action="navigate-discard-ref" data-ref="${esc(item.discardRef)}" title="Ir al ítem promovido">${esc(item.discardRef)}</span>`
      : `<span class="idea-discard-reason">${esc(item.discardReason)}</span>`
    : isDiscarded && !isIdea && item.discardReason
      ? `<span class="bitem-discard-reason">🗑 ${esc(item.discardReason)}${item.discardRef ? ' · ' + esc(item.discardRef) : ''}</span>`
      : '';

  // TKT-202607-009: chip de trazabilidad origen_disc — dado un ítem promovido con origenDisc
  // poblado, renderiza referencia clickeable a la DISC de origen. AC edge case: si el código no
  // existe en ITEMS, se renderiza sin data-action (no navegable) y sin error de runtime.
  const _origenDiscTarget = item.origenDisc ? getItems().find(i => i.code === item.origenDisc) : null;
  const _origenDiscHtml = item.origenDisc
    ? _origenDiscTarget
      ? `<span class="bitem-origen-disc-chip" data-action="navigate-origen-disc" data-ref="${esc(item.origenDisc)}" title="Ir a la DISC de origen">origen: ${esc(item.origenDisc)}</span>`
      : `<span class="bitem-origen-disc-chip bitem-origen-disc-chip--orphan" title="DISC de origen no encontrada en el backlog">origen: ${esc(item.origenDisc)}</span>`
    : '';

  // Subline (area, sprint, role, discard reason, origen_disc, missing warning)
  // CAEL-0720-11 (REQ CAEL-0720-10): item.code retirado de subline — el badge de tipo
  // pasa a ser la única fuente visible del código (ver typeBlock abajo). focus-rank
  // se conserva standalone, ya no anidado dentro del span de código.
  const _sublineParts = [];
  if (item._focusRank) _sublineParts.push(`<span class="bitem-focus-rank" title="Posición en Focus">#${item._focusRank}</span>`);
  if (item.role) _sublineParts.push(`<span class="bitem-subline-role" title="Rol responsable">${esc(item.role)}</span>`);
  if (item.area) _sublineParts.push(`<span class="bitem-subline-area" title="${esc(item.area)}">${esc(item.area)}</span>`);
  if (item.sprint) _sublineParts.push(`<span class="bitem-subline-sprint">${esc(_sprintDisplay(item.sprint))}</span>`);
  const subline = `<div class="bitem-subline">
    ${_sublineParts.join('<span class="bitem-subline-sep">·</span>')}
    ${_discardReasonHtml}
    ${_origenDiscHtml}
    ${missingFields.length ? `<span class="bitem-missing-warn" title="Faltan: ${missingFields.join(', ')}">⚠</span>` : ''}
  </div>`;

  // Type block — the dominant visual element. CAEL-0720-11: badge fusionado con el código
  // real del ítem — reemplaza el par letra/label ("REQ"/"Requerimiento") por una sola línea
  // "REQ" (negrita) + resto del código. Interacción de copiar-ID (antes en bitem-subline-code)
  // se traslada aquí — mismo data-action="copy-code", delegado por atributo (locus-backlog-item.js:407/1536).
  const _codeMatch = /^([A-Z]+)(-.*)$/.exec(item.code || '');
  const _codeDisplay = _codeMatch
    ? `<span class="bitem-type-code-prefix">${esc(_codeMatch[1])}</span>${esc(_codeMatch[2])}`
    : esc(item.code || type);
  const typeBlock = type
    ? `<div class="bitem-type-block bitem-type-${type}">
        <span class="bitem-type-code" data-action="copy-code" data-code="${esc(item.code)}" data-idx="${globalIdx}" title="Click para copiar ID">${_codeDisplay}</span>
       </div>`
    : '';

  // R-202605-098: isPromoted — P descartado por promoción (tiene discardRef)
  const isPromoted = isIdea && isDiscarded && !!item.discardRef;
  // Cerradas: P en estado terminal (promovida o descartado)
  const _isPTerminal = isIdea && (_isPPromovida || isDiscarded);
  const isBloqueado = item.status === 'bloqueado';
  // R-202605-165: .blf-hidden colapsa ítems fuera del Top-10 con transición 150ms ease-out
  const _blfHiddenClass = item._blfHidden ? ' blf-hidden' : '';
  const _blfAriaHidden  = item._blfHidden ? ' aria-hidden="true"' : '';
  return `<div class="item bitem${isDone ? ' is-done' : ''}${isDiscarded ? ' is-discarded' : ''}${isBloqueado ? ' is-bloqueado' : ''}${isActive ? ' bitem--active' : ''}${isIdea ? ' bitem--idea' : ''}${isPromoted ? ' bitem--promoted' : ''}${_isPTerminal ? ' bl-p-terminal' : ''}${_isDepBlocked ? ' bitem--dep-blocked' : ''}${_blfHiddenClass}" data-type="${type}" data-code="${esc(item.code)}"${_blfAriaHidden}>
    <div class="item-header bitem-header" data-action="item-expand" data-idx="${globalIdx}" role="button" tabindex="0" aria-label="Abrir detalle de ${esc(item.code)}">
      <span class="bitem-collapse-arrow" id="iarrow-${globalIdx}">▸</span>
      ${(!isDone && !isDiscarded && item.sprint) ? `<span class="item-drag-handle" data-action="drag-handle" title="Arrastrar para reordenar en sprint">⠿</span>` : ''}
      ${isActive ? '<span class="bitem-activity-dot" title="Actividad reciente — sesión vinculada en los últimos 7 días"></span>' : ''}
      <button id="copy-item-btn-${esc(item.code)}" class="copy-item-btn" data-action="copy-item" data-code="${esc(item.code)}" aria-label="Copiar ítem" title="Copiar ítem para sesión FS"><svg class="copy-btn-icon copy-btn-icon--clipboard" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="5" y="2" width="9" height="12" rx="1.5"/><path d="M5 4H4a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 4 15h7a1.5 1.5 0 0 0 1.5-1.5V13"/></svg><svg class="copy-btn-icon copy-btn-icon--check is-hidden" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 8l4 4 6-6"/></svg></button>
      ${typeBlock}
      <div class="bitem-title-col">
        <span class="bitem-title">${esc(item.title)}</span>${isDiscarded && (!item.title || item.title.trim() === item.code) ? '<span class="bitem-ghost-note" title="Ítem sin título — posiblemente generado por un CHECKPOINT malformado">⚠ ítem fantasma — generado por CHECKPOINT malformado</span>' : ''}
        ${subline}
      </div>
      ${headerRight}
    </div>
    <div class="item-body bitem-body" id="ibody-${globalIdx}">
      ${item.notes ? `<div class="bitem-notes-block"><span class="bitem-notes-label">Notas</span><span class="bitem-notes-text">${esc(item.notes)}</span></div>` : ''}
      ${_isBlocked(item) ? `<div class="bitem-missing-row"><span class="badge-missing badge-missing--blocked">⛔ bloqueado — sin cambio de status en más de ${_BLOCKED_DAYS} días</span></div>` : ''}
      ${_stalenessData ? `<div class="bitem-missing-row"><span class="staleness-pill staleness--${_stalenessData.modifier}" title="Sin sesión vinculada — ${_stalenessData.days}d desde último cambio de status">${_stalenessData.label} sin sesión</span></div>` : ''}
      ${missingAlert}
      <div class="bitem-meta-grid bitem-meta-grid--readonly" data-action="bitem-meta-stop">
        <div class="bitem-meta-cell">
          <span class="bitem-meta-label">Status</span>
          <span class="idp-meta-value idp-meta-value--readonly">${esc(item.status || '—')}</span>
        </div>
        ${item.status === 'done' ? `<div class="bitem-meta-cell"><span class="bitem-meta-label">Versión</span><span class="bitem-meta-value mono">${esc(item.version || 'futura')}</span></div>` : ''}
        ${!isIdea ? `<div class="bitem-meta-cell">
          <span class="bitem-meta-label">Esfuerzo</span>
          <div class="bitem-effort-display">
            ${(() => { let d=''; for(let i=0;i<3;i++) d+=`<span class="bitem-effort-dot-sm${i<effortN?' on':''}"></span>`; return d; })()}
            <span class="bitem-effort-num">${item.effort ? item.effort+'/3' : '<span class="effort-missing">—</span>'}</span>
          </div>
        </div>` : ''}
        <div class="bitem-meta-cell">
          <span class="bitem-meta-label">Tipo</span>
          <span class="bitem-meta-value">${typeLabel || '—'}</span>
        </div>
        <div class="bitem-meta-cell">
          <span class="bitem-meta-label">Rol</span>
          <span class="idp-meta-value idp-meta-value--readonly">${item.role ? esc(item.role) : '— Sin rol —'}</span>
        </div>
        ${!isIdea ? `<div class="bitem-meta-cell">
          <span class="bitem-meta-label">Sprint</span>
          <span class="idp-meta-value idp-meta-value--readonly">${item.sprint ? esc(_sprintDisplay(item.sprint)) : 'Q-Backlog (sin sprint)'}</span>
        </div>` : ''}
        ${(type === 'TKT' || type === 'INC') ? (() => {
          const currentParent = item.parentId ? getItems().find(i => i.code === item.parentId) : null;
          const _rLabel = r => { const t = r.title || ''; return r.code + ' · ' + (t.length > 60 ? t.slice(0, 57) + '…' : t); };
          return `<div class="bitem-meta-cell">
            <span class="bitem-meta-label">R padre</span>
            <span class="idp-meta-value idp-meta-value--readonly">${currentParent ? esc(_rLabel(currentParent)) : '— Sin padre'}</span>
          </div>`;
        })() : ''}
      </div>
      ${isIdea ? '' : acHtml}
      ${(() => {
        // R-202604-074: AC Vivo — solo en pendientes con sprint; R-202605-098: nunca en P
        if (isIdea || isDone || isDiscarded || !item.sprint) return '';
        // Sin AC definidos — mensaje + CTA
        if (!item.ac || !item.ac.length) {
          const _emptyId = `acv-panel-empty-${globalIdx}`;
          return `<div class="acv-wrap acv-wrap--empty" id="${_emptyId}">
            <button class="acv-toggle" data-action="acv-toggle" data-panel-id="${_emptyId}" title="Revisión de AC">
              <span class="acv-toggle-arrow">▸</span> Revisión de AC
            </button>
            <div class="acv-body acv-body--hidden">
              <p class="acv-empty-msg">Este ítem no tiene AC — agrega criterios antes de implementar.</p>
              <button class="acv-confirm-btn" data-action="acv-open-editor" data-code="${esc(item.code)}" title="Abrir editor de ítem">✎ Ir a Item Editor</button>
            </div>
          </div>`;
        }
        // Revisar si ya fue confirmado recientemente (< 48h)
        const _acRev = item.acReviewed;
        const _reviewed = _acRev && (Date.now() - _acRev) < 48 * 60 * 60 * 1000;
        // Parser heurístico de ambigüedad
        const _ambigTerms = [
          { re: /tiempo real/i,        desc: '"tiempo real" — define frecuencia o evento exacto' },
          { re: /correctamente/i,      desc: '"correctamente" — sin criterio explícito de corrección' },
          { re: /adecuadamente/i,      desc: '"adecuadamente" — ambiguo sin referencia' },
          { re: /\bfunciona\b/i,       desc: '"funciona" — define qué resultado es válido' },
          { re: /visible\b(?!.*\bcon\b.*\bcontraste\b)/i, desc: '"visible" — sin criterio explícito (contraste, posición, tamaño)' },
          { re: /sin regresi[oó]n(?!\s+en\s+\S)/i, desc: '"sin regresión" — scope no definido' },
        ];
        const _classify = (ac) => {
          if (/click|button|tab|badge|color|layout|css|px|rem|visible|muestra|aparece|oculta/i.test(ac)) return { cls: 'visual', label: 'visual' };
          if (/guarda|persiste|localStorage|storage|calcula|retorna|devuelve|valor/i.test(ac)) return { cls: 'datos', label: 'datos' };
          return { cls: 'funcional', label: 'funcional' };
        };
        const _acRows = item.ac.map((c, ci) => {
          const ambig = _ambigTerms.find(t => t.re.test(c));
          const cat   = _classify(c);
          const rowId = `acv-row-${globalIdx}-${ci}`;
          if (ambig) {
            return `<li class="acv-row acv-row--warn" id="${rowId}">
              <span class="acv-badge acv-badge--warn" title="${esc(ambig.desc)}">⚠</span>
              <span class="acv-text">${esc(c)}</span>
              <button class="acv-clarify-btn" data-action="acv-clarify" data-row-id="${rowId}" data-code="${esc(item.code)}" data-ci="${ci}" title="Aclarar este AC">Aclarar</button>
            </li>`;
          }
          return `<li class="acv-row acv-row--ok" id="${rowId}">
            <span class="acv-badge acv-badge--ok acv-badge--${cat.cls}" title="${cat.label}">✓</span>
            <span class="acv-text">${esc(c)}</span>
          </li>`;
        }).join('');
        const _panelId  = `acv-panel-${globalIdx}`;
        const _revClass = _reviewed ? ' acv-reviewed' : '';
        return `<div class="acv-wrap${_revClass}" id="${_panelId}">
          <button class="acv-toggle" data-action="acv-toggle" data-panel-id="${_panelId}" title="Revisión de AC">
            <span class="acv-toggle-arrow">▸</span> Revisión de AC
          </button>
          <div class="acv-body acv-body--hidden">
            <ul class="acv-list">${_acRows}</ul>
            <button class="acv-confirm-btn" data-action="acv-confirm" data-code="${esc(item.code)}" data-panel-id="${_panelId}" title="Marcar revisión como completada">✓ Confirmar y proceder</button>
          </div>
        </div>`;
      })()}
      ${buildItemRefs(item.code)}
      ${(type === 'REQ' && !opts.suppressChildren) ? _buildChildrenBlock(item.code) : ''}
      ${_buildItemTimestamps(item)}
      ${_buildItemOriginBlock(item)}
      ${item.origin ? _buildItemPOriginBlock(item) : ''}
      ${item.triggeredBy ? `<div class="bitem-origin-p-block">
        <span class="bitem-origin-p-label">Originado durante</span>
        <button class="bitem-origin-p-link" data-action="navigate-origin" data-origin="${esc(item.triggeredBy)}" title="Ir al ítem que originó este ítem">${esc(item.triggeredBy)}</button>
      </div>` : ''}
      ${item.migratedFrom ? _buildItemMigratedBlock(item) : ''}
      ${_buildItemMentionedIn(item)}
      <div class="bitem-footer">
        ${isHistorico ? '' : `<button data-action="bitem-edit" data-code="${esc(item.code)}" class="bitem-edit-btn" title="Editar ítem">✎ Editar</button>`}
        ${(!isHistorico && isIdea && !isDone && !isDiscarded && !_isPPromovida) ? `<button data-action="bitem-promote" data-code="${esc(item.code)}" class="bitem-promote-btn" title="Promover esta posibilidad a Ticket o Requerimiento">⬆ Promover</button>` : ''}
        ${(!isHistorico && type === 'TKT' && !isDone && !isDiscarded) ? `<button data-action="bitem-promote-tkt-to-req" data-code="${esc(item.code)}" class="bitem-promote-btn" title="Promover Ticket a Requerimiento">⬆ → R</button>` : ''}
        ${(!isHistorico && !isDone && !isDiscarded) ? `<button data-action="bitem-migrate" data-code="${esc(item.code)}" class="bitem-promote-btn" title="Mover item a otro proyecto">&#x21C4; Mover</button>` : ''}
      </div>
    </div>
  </div>`;
}

// R-[pendiente-ID]: Promover ítem P → T o R con trazabilidad de origen
function _promoteItem(code) {
  const item = getItems().find(i => i.code === code);
  if (!item) return;

  // R-202604-047: shell estático en index.html — inject content + classList
  const overlay = document.getElementById('promote-modal-overlay');
  if (!overlay) return;
  const body = document.getElementById('promote-modal-body');
  if (body) {
    body.classList.remove('migrate-modal'); // TKT1 REQ CAEL-0719-01: shell compartido con migrate
    body.innerHTML = `
      <div class="promote-modal-title" id="promote-modal-title-el">⬆ Promover idea</div>
      <div class="promote-modal-sub">${esc(code)} · ${esc(item.title)}</div>
      <div class="promote-modal-desc">¿A qué tipo quieres promover esta idea?</div>
      <div class="promote-type-btns">
        <button class="promote-type-btn" id="promote-btn-TKT" data-action="promote-select-type" data-type="TKT">
          <div class="promote-type-letter">TKT</div>
          <div class="promote-type-name">Ticket</div>
          <div class="promote-type-hint">Tarea técnica concreta</div>
        </button>
        <button class="promote-type-btn" id="promote-btn-REQ" data-action="promote-select-type" data-type="REQ">
          <div class="promote-type-letter">REQ</div>
          <div class="promote-type-name">Requerimiento</div>
          <div class="promote-type-hint">Feature o épica con tickets</div>
        </button>
      </div>
      <div class="promote-modal-actions">
        <button data-action="promote-modal-cancel" class="btn-cancel">Cancelar</button>
        <button id="promote-confirm-btn" data-action="promote-confirm" data-code="${esc(code)}" class="btn-primary" disabled>Promover</button>
      </div>`;
  }
  _promoteTargetType = null;
  overlay.classList.add('open');
  // AC: foco inicial en primer botón de tipo (flujo P)
  requestAnimationFrame(() => {
    const first = overlay.querySelector('.promote-type-btn');
    if (first) first.focus();
  });
}

let _promoteTargetType = null;

function _promoteSelectType(type) {
  _promoteTargetType = type;
  ['TKT', 'REQ'].forEach(t => {
    const btn = document.getElementById('promote-btn-' + t);
    if (btn) btn.classList.toggle('selected', t === type);
  });
  const confirmBtn = document.getElementById('promote-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = false;
}

async function _promoteConfirm(originCode) {
  if (!_promoteTargetType || !_GEN2_TYPES.includes(_promoteTargetType)) return;
  const originItem = getItems().find(i => i.code === originCode);
  if (!originItem) return;

  const newCode = await _getNextItemCode(_promoteTargetType);
  const nowTs = Date.now();

  // Crear ítem hijo con campos heredados + origin
  // R-202605-098: ítem hijo nace sin esfuerzo — el campo no se hereda del P original
  // TKT2 (REQ-202607-025): _newBacklogItem() reemplaza el push literal.
  getItems().push(_newBacklogItem({
    id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2, 6),
    code: newCode,
    title: originItem.title,
    desc: originItem.desc || '',
    priority: originItem.priority || 'medium',
    area: originItem.area || '',
    effort: null,
    impact: originItem.impact || 'Medio',
    status: 'pendiente',
    version: 'futura',
    sprint: (originItem.sprint && originItem.sprint.trim() !== 'n/a') ? originItem.sprint : '',
    ac: originItem.ac ? [...originItem.ac] : [],
    origin: originCode,
    sessionId: null,
    createdAt: nowTs,
    statusChangedAt: nowTs,
    doneAt: null
  }));

  // R-202605-098: P padre → descartado automático con discardReason trazable
  // No requiere acción manual del founder
  originItem.status = 'descartado';
  originItem.statusChangedAt = nowTs;
  originItem.discardReason = 'promovido a ' + _promoteTargetType + ' ' + newCode;
  originItem.discardRef = newCode; // ref al ítem hijo — habilita bitem--promoted chip

  _blogLog('promovido', originCode, originCode + ' → ' + newCode, 'backlog');
  _undoSnapshotItems();
  saveBacklog();
  _setBacklogModified();

  const _pmo = document.getElementById('promote-modal-overlay');
  if (_pmo) _pmo.classList.remove('open');
  _promoteTargetType = null;

  _markBacklogListDirty(); renderBacklogList(() => navigateToItem(newCode));
  renderStats();
  showToast('success', `⬆ ${originCode} promovido → ${newCode}`);
}

// T-202604-236: Promover Ticket a Requerimiento desde Backlog UI
function _promoteTktToReq(code) {
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  // AC-5: solo en T pendiente o progreso
  if (item.status === 'done' || item.status === 'descartado') return;

  // R-202604-047: shell estático en index.html — inject content + classList
  // DUP-02: usa shell unificado #promote-modal-overlay
  const overlay = document.getElementById('promote-modal-overlay');
  if (!overlay) return;
  const body = document.getElementById('promote-modal-body');
  if (body) {
    body.classList.remove('migrate-modal'); // TKT1 REQ CAEL-0719-01: shell compartido con migrate
    body.innerHTML = `
      <div class="promote-modal-title" id="promote-modal-title-el">⬆ Promover Ticket a Requerimiento</div>
      <div class="promote-modal-sub">${esc(code)} · ${esc(item.title)}</div>
      <div class="promote-modal-info">
        Se creará un <strong>R</strong> heredando los campos del T.<br>
        El T origen quedará <strong>descartado</strong> con referencia al R nuevo.
      </div>
      <div class="promote-modal-actions">
        <button data-action="promote-tkt-to-req-cancel"
          class="btn-ghost">Cancelar</button>
        <button data-action="promote-tkt-to-req-confirm" data-code="${esc(code)}" class="btn-primary" id="promote-tkt-to-req-confirm-btn">⬆ Promover</button>
      </div>`;
  }
  overlay.classList.add('open');
  // AC: foco inicial en botón confirmar (flujo T — sin selector de tipo)
  requestAnimationFrame(() => {
    const confirmBtn = overlay.querySelector('#promote-tkt-to-req-confirm-btn');
    if (confirmBtn) confirmBtn.focus();
  });
}

async function _promoteTktToReqConfirm(originCode) {
  const originItem = getItems().find(i => i.code === originCode);
  if (!originItem) return;

  const newCode = await _getNextItemCode('REQ');
  const nowTs = Date.now();

  // AC-2: R hereda desc · area · sprint · tags del T origen
  // AC-4: origin del R apunta al T
  // TKT2 (REQ-202607-025): _newBacklogItem() reemplaza el push literal — 2do de 2 call sites.
  getItems().push(_newBacklogItem({
    id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2, 6),
    code: newCode,
    title: originItem.title,
    desc: originItem.desc || '',
    priority: originItem.priority || 'medium',
    area: originItem.area || '',
    effort: originItem.effort || 1,
    impact: originItem.impact || 'Medio',
    status: 'pendiente',
    version: 'futura',
    sprint: (originItem.sprint && originItem.sprint.trim() !== 'n/a') ? originItem.sprint : '',
    tags: originItem.tags ? [...originItem.tags] : [],
    ac: [],
    origin: originCode,
    sessionId: null,
    createdAt: nowTs,
    statusChangedAt: nowTs,
    doneAt: null
  }));

  // AC-3: T origen → descartado con reason:reemplazado + ref al R nuevo
  originItem.status = 'descartado';
  originItem.statusChangedAt = nowTs;
  originItem.discardReason = 'reemplazado';
  originItem.discardRef = newCode;

  _blogLog('promovido-a-req', originCode, originCode + ' → ' + newCode, 'backlog');
  _undoSnapshotItems();
  saveBacklog();
  _setBacklogModified();

  const overlay = document.getElementById('promote-modal-overlay'); // DUP-02: shell unificado
  if (overlay) overlay.classList.remove('open');

  _markBacklogListDirty(); renderBacklogList(() => navigateToItem(newCode));
  renderStats();
  showToast('success', `⬆ ${originCode} promovido → ${newCode}`);
}

function copyItemCode(e, code, idx) {
  e.stopPropagation();
  // e.currentTarget es el listEl cuando se llama desde delegación — usar closest para obtener el badge real
  const btn = e.target.closest('[data-action="copy-code"]');
  const iconClipboard = btn ? btn.querySelector('.copy-btn-icon--clipboard') : null;
  const iconCheck     = btn ? btn.querySelector('.copy-btn-icon--check') : null;

  const _applyFeedback = () => {
    if (btn) btn.classList.add('is-copied');
    if (iconClipboard) iconClipboard.classList.add('is-hidden');
    if (iconCheck)     iconCheck.classList.remove('is-hidden');
    setTimeout(() => {
      if (btn) btn.classList.remove('is-copied');
      if (iconClipboard) iconClipboard.classList.remove('is-hidden');
      if (iconCheck)     iconCheck.classList.add('is-hidden');
    }, 1500);
  };

  navigator.clipboard.writeText(code).then(() => {
    _applyFeedback();
  }).catch(() => {
    // fallback execCommand
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.className = 'clipboard-ghost';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    _applyFeedback();
  });
}

// T-202604-178: copia ítem formateado para sesión FS
function copyItemToClipboard(e, code) {
  e.stopPropagation();
  const item = getItems().find(i => i.code === code);
  if (!item) return;

  const lines = [];

  // Línea 1: código + título
  lines.push(`[${item.code}] ${item.title || ''}`);

  // Línea 2: campos de contexto
  const meta = [`Status: ${item.status || 'pendiente'}`];
  if (item.effort) meta.push(`Effort: ${item.effort}`);
  if (item.area)   meta.push(`Area: ${item.area}`);
  if (item.sprint) meta.push(`Sprint: ${item.sprint}`);
  lines.push(meta.join(' | '));

  // AC
  if (item.ac && item.ac.length) {
    lines.push('');
    lines.push('AC:');
    item.ac.forEach(c => lines.push(`- ${c}`));
  }

  // Notas (desc)
  if (item.desc && item.desc.trim()) {
    lines.push('');
    lines.push(`Notas: ${item.desc.trim()}`);
  }

  // Tags (si el ítem los tiene)
  if (item.tags && item.tags.length) {
    const tagNames = item.tags.map(tid => {
      const t = (getState().tags || []).find(t => t.id === tid); // T-202606-023: window.state → getState()
      return t ? t.name : tid;
    });
    lines.push(`Tags: ${tagNames.join(', ')}`);
  }

  // T-202606-200: sección EXECUTION-PLAN — busca la sesión del ítem en el plan activo
  const _plan = getActivePlan();
  if (_plan) {
    const _sesiones = Array.isArray(_plan.sesiones) ? _plan.sesiones : [];
    const _sesion = _sesiones.find(s => Array.isArray(s.items) && s.items.includes(item.code));
    if (_sesion) {
      lines.push('');
      lines.push('---EXECUTION-PLAN---');
      lines.push('scope: sesion');
      lines.push('sesiones:');
      lines.push('  - id: ' + (_sesion.id || ''));
      lines.push('    rol: ' + (_sesion.rol || ''));
      const _items = Array.isArray(_sesion.items) ? _sesion.items.join(', ') : '';
      lines.push('    items: [' + _items + ']');
      const _archivos = Array.isArray(_sesion.archivos) && _sesion.archivos.length
        ? _sesion.archivos.join(' · ')
        : '';
      lines.push('    archivos: ' + (_archivos ? _archivos : '[]'));
      const _depende = Array.isArray(_sesion.depende_de) && _sesion.depende_de.length
        ? _sesion.depende_de.join(', ')
        : '';
      lines.push('    depende_de: [' + _depende + ']');
      lines.push('---EXECUTION-PLAN-END---');
    }
  }

  const text = lines.join('\n');
  const btnId = `copy-item-btn-${code}`;

  const _feedback = () => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const iconClipboard = btn.querySelector('.copy-btn-icon--clipboard');
    const iconCheck     = btn.querySelector('.copy-btn-icon--check');
    btn.classList.add('is-copied');
    if (iconClipboard) iconClipboard.classList.add('is-hidden');
    if (iconCheck)     iconCheck.classList.remove('is-hidden');
    setTimeout(() => {
      btn.classList.remove('is-copied');
      if (iconClipboard) iconClipboard.classList.remove('is-hidden');
      if (iconCheck)     iconCheck.classList.add('is-hidden');
    }, 1500);
  };

  navigator.clipboard.writeText(text).then(_feedback).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.className = 'clipboard-ghost';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    _feedback();
  });
}

function toggleAc(idx) {
  const list = document.getElementById(`ac-list-${idx}`);
  const arrow = document.getElementById(`ac-arrow-${idx}`);
  if (!list) return;
  list.classList.toggle('open');
  arrow.textContent = list.classList.contains('open') ? '▾' : '▸';
}

export function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('.f-' + f);
  if (btn) btn.classList.add('active');
  _markBacklogListDirty(); renderBacklogList();
}

function onBacklogSearch() {
  const input = document.getElementById('backlog-search-input');
  // T-202606-099: valor de búsqueda vive en core — el listener de core actualiza backlogSearchQuery
  const clearBtn = document.getElementById('backlog-search-clear');
  if (clearBtn) clearBtn.classList.toggle('visible', !!_getBacklogSearchQuery());
  updateClearFilterBtn();
  _markBacklogListDirty(); renderBacklogList();
  renderStats(); // B-202605-205: actualizar contadores de tipo con búsqueda activa
}

export function clearBacklogSearch() {
  const input = document.getElementById('backlog-search-input');
  if (input) input.value = '';
  const clearBtn = document.getElementById('backlog-search-clear');
  if (clearBtn) clearBtn.classList.remove('visible');
  updateClearFilterBtn();
  _markBacklogListDirty(); renderBacklogList();
  renderStats(); // B-202605-205: restaurar contadores al limpiar búsqueda
}

// B-202604-198: Helper — detecta si un code es placeholder (nunca matchear contra backlog)
export function _isPlaceholderCode(code) {
  if (!code) return true;
  if (code === '[pendiente-ID]') return true;
  if (/^\[tmp:[a-z0-9_-]+\]$/i.test(code)) return true;
  return false;
}

// B-202604-198: Helper — busca ítem existente cuyo title es similar a un [tmp:slug]
// Retorna { item, score } o null. Solo sugiere — nunca aplica automáticamente.
// T-202605-136: incomingType restringe la búsqueda al mismo type — evita que un T nuevo
// con [tmp:slug] matchee contra una P existente con título similar.
function _findTmpMatch(tmpCode, desc, existingItems, incomingType) {
  if (!desc) return null;
  const needle = desc.trim().toLowerCase();
  let best = null, bestScore = 0;
  existingItems.forEach(item => {
    // T-202605-136: solo matchear contra ítems del mismo type que el entrante
    if (incomingType && item.type && item.type !== incomingType) return;
    const haystack = (item.title || '').trim().toLowerCase();
    if (!haystack) return;
    // Similitud: palabras en común / total palabras
    const needleWords = needle.split(/\s+/);
    const haystackWords = haystack.split(/\s+/);
    const common = needleWords.filter(w => w.length > 3 && haystackWords.includes(w)).length;
    const score = common / Math.max(needleWords.length, haystackWords.length);
    if (score > 0.5 && score > bestScore) { best = item; bestScore = score; }
  });
  return best ? { item: best, score: bestScore } : null;
}

// B-202605-guardar-sesion: _assignPendingIds — convierte [pendiente-ID] en código real.
// Llamado por mergeBacklogFromTG antes de procesar ítems.
// AC-3: ítems sin type válido se dejan con [pendiente-ID] sin modificar.
// AC-4: ítems con código real pasan sin modificación.
// AC-5: [tmp:slug] pasan sin modificación — tienen su propio flujo (_findTmpMatch).
// B-202605-ids: reservedCodes acumula los códigos asignados en esta pasada para que
// _getNextItemCode no repita el mismo número cuando hay múltiples [pendiente-ID] del
// mismo tipo — los ítems nuevos aún no están en getItems() en el momento de la asignación.
// T-202605-140 T2: Paso 1 — asignar IDs reales y construir slugMap.
//   slugMap mapea [tmp:slug] y [pendiente-ID] asignado → código real.
//   Ítems con código real existente se registran como identidad: code → code.
// T-202605-140 T2: Paso 2 — resolver referencias cruzadas (dependsOn, parentId,
//   triggeredBy, origenDisc, promovida_a) usando slugMap. Referencia no resuelta → null/[].
export async function _assignPendingIds(tgItems, seedSlugMap) {
  // TKT1 (REQ-[pendiente-ID] · Integridad de generación y persistencia de código de ítems):
  //   validTypes Gen1 (P/T/R/B) reemplazado por _GEN2_TYPES — los 7 tipos canónicos
  //   (REQ/TKT/DISC/INC/PRB/KE/CHG). Causa raíz confirmada: con el set Gen1, todo ítem
  //   Gen2 entrante con [pendiente-ID] o [tmp:slug] quedaba sin asignar silenciosamente.
  const validTypes = new Set(_GEN2_TYPES);
  const reservedCodes = new Set();

  // T-202605-140 T2 · Paso 1: construir slugMap mientras se asignan IDs
  const slugMap = new Map();

  // TKT2 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs): seedSlugMap ausente/undefined →
  //   comportamiento idéntico al actual, slugMap se construye desde cero. Si está presente
  //   (slugMap acumulado de un bloque previo del mismo batch), sus entradas se copian primero
  //   y tienen precedencia como identidad ya resuelta — ver guard en sub-paso 1a, que evita
  //   reasignar código nuevo a un [tmp:slug] ya resuelto en el seed.
  if (seedSlugMap instanceof Map) {
    seedSlugMap.forEach((v, k) => slugMap.set(k, v));
  }

  // Pre-poblar slugMap con códigos reales ya existentes (identidad: code → code)
  tgItems.forEach(item => {
    if (item.code && !_isPlaceholderCode(item.code)) {
      slugMap.set(item.code, item.code);
    }
  });

  // T-202605-137: Paso 1 separado en dos sub-pasos para garantizar que slugMap esté completo
  // antes de resolver referencias. Esto cubre el caso donde un patch con promovida_a:[pendiente-ID]
  // aparece antes del ítem nuevo en el array — el orden en el CHECKPOINT no debe importar.

  // Sub-paso 1a: asignar IDs reales a todos los [pendiente-ID] y [tmp:slug] con type válido,
  // y construir slugMap completo ANTES de resolver cualquier referencia cruzada.
  // TKT2 (REQ-202607-017): .map() síncrono → for...of secuencial con await. _getNextItemCode()
  // ahora async — Promise.all() hubiera disparado N llamadas en paralelo, cada una escaneando
  // colisión contra el mismo reservedCodes aún vacío en ese instante → mismo NNN para 2+
  // [pendiente-ID] del mismo tipo en el mismo batch (regresión). for...of con await garantiza
  // que reservedCodes.add(newCode) de la iteración N esté aplicado antes del escaneo de la N+1.
  const paso1 = [];
  for (const item of tgItems) {
    // T-202606-005: [tmp:slug] con type válido — asignar código real y registrar en slugMap
    // para que las referencias cruzadas (parent, depends_on, triggered_by, origen_disc, promovida_a)
    // dentro del mismo bloque resuelvan correctamente.
    // [tmp:slug] sin type válido: conservar literal — siguen flujo _findTmpMatch existente.
    if (item.code && /^\[tmp:[a-z0-9_-]+\]$/i.test(item.code)) {
      if (!item.type || !validTypes.has(item.type)) { paso1.push(item); continue; } // sin type — conservar literal
      // TKT2: slug ya resuelto en el seed (bloque previo del mismo batch) — identidad ya
      // resuelta tiene precedencia, no reasignar código nuevo.
      if (slugMap.has(item.code)) {
        paso1.push({ ...item, code: slugMap.get(item.code), _wasAssigned: true });
        continue;
      }
      let newCode;
      try {
        newCode = await _getNextItemCode(item.type, reservedCodes);
      } catch (err) {
        // TKT2 AC error: rechazo de _getNextItemCode() dentro de _assignPendingIds — el ítem
        // conserva su [tmp:slug] sin asignar (mismo comportamiento que newCode ausente), warning
        // en consola, no rompe el resto del batch.
        console.warn('_assignPendingIds: _getNextItemCode() rechazó para', item.code, err);
        paso1.push(item);
        continue;
      }
      reservedCodes.add(newCode);
      slugMap.set(item.code, newCode); // tmp:slug → código real asignado
      slugMap.set(newCode, newCode);   // identidad del código asignado
      // INC-[pendiente-ID] (triggered_by REQ-202607-003/004/005 — parent:{ref_id,title} no
      // resolvía): un ítem con refId nunca quedaba seedeado en slugMap bajo su clave
      // [tmp:REF_ID] — mergeBacklogFromTG normaliza parent/depends_on/triggered_by/
      // origen_disc/promovida_a de OTROS ítems a exactamente ese string ([tmp:${ref_id}])
      // antes de llamar aquí, pero sin esta línea el lookup en Paso 2 siempre fallaba.
      if (item.refId) slugMap.set(`[tmp:${item.refId}]`, newCode);
      paso1.push({ ...item, code: newCode, _wasAssigned: true });
      continue;
    }
    if (item.code !== '[pendiente-ID]') { paso1.push(item); continue; } // AC-4: código real — sin modificación
    if (!item.type || !validTypes.has(item.type)) { paso1.push(item); continue; } // AC-3: type inválido — no asignar
    let newCode;
    try {
      newCode = await _getNextItemCode(item.type, reservedCodes);
    } catch (err) {
      // TKT2 AC error: mismo criterio — placeholder [pendiente-ID] queda sin asignar, warning,
      // resto del batch continúa.
      console.warn('_assignPendingIds: _getNextItemCode() rechazó para [pendiente-ID]', err);
      paso1.push(item);
      continue;
    }
    reservedCodes.add(newCode);
    // T-202605-137: registrar con clave única por item (usando índice implícito en el código asignado)
    // para que múltiples [pendiente-ID] no se sobreescriban. El slugMap usa el código asignado
    // como clave de identidad; la clave '[pendiente-ID]' es solo el último asignado (compat legacy).
    slugMap.set('[pendiente-ID]', newCode); // identidad de la última asignación — compat legacy bloques de un ítem
    slugMap.set(newCode, newCode);          // identidad del código asignado — para resolución directa
    // INC-[pendiente-ID] (triggered_by REQ-202607-003/004/005 — parent:{ref_id,title} no
    // resolvía): causa raíz. Todo ítem nuevo declarado con ref_id llega aquí con
    // code:'[pendiente-ID]' — nunca con code:'[tmp:REF_ID]' (ese formato no es parte del
    // schema de emisión, ver __BR-Ecosystem §4). Sin este seed, slugMap nunca tenía entrada
    // para [tmp:${refId}] y el Paso 2 de este mismo método fallaba el lookup para todo campo
    // de referencia normalizado por mergeBacklogFromTG contra este ítem — el síntoma exacto
    // del INC: TKTs con parent:{ref_id,title} mostrando "Sin parent" en el DIFF pese a que
    // ref_id y title coincidían con el REQ declarante.
    if (item.refId) slugMap.set(`[tmp:${item.refId}]`, newCode);
    paso1.push({ ...item, code: newCode, _wasAssigned: true });
  }

  // Sub-paso 1b: construir índice invertido de códigos asignados para resolver referencias
  // cross-item. Para cada item que fue asignado, su código real ya está en slugMap.
  // Si hay exactamente un [pendiente-ID] en el batch original, slugMap['[pendiente-ID]'] lo resuelve.
  // Si hay múltiples, la resolución es ambigua — conservar literal (comportamiento previo).
  const assignedCount = paso1.filter(i => i._wasAssigned).length;
  // Si hay más de un [pendiente-ID] asignado, la clave '[pendiente-ID]' apunta solo al último.
  // En ese caso, references que usen [pendiente-ID] como valor quedan sin resolver (conservar literal).
  if (assignedCount > 1) {
    // Eliminar la clave genérica para forzar conservar-literal en Paso 2
    slugMap.delete('[pendiente-ID]');
  }

  // T-202605-140 T2 · Paso 2: resolver referencias cruzadas usando slugMap
  // Campos de referencia: dependsOn, parentId, triggeredBy, origenDisc, promovida_a
  // Referencia presente en slugMap → reemplazar con código real.
  // [pendiente-ID] no resuelta → conservar literal — puede resolverse en pasada posterior.
  // [tmp:slug] no resuelta → null/[] + _blogLog('tmp-slug-no-resoluble') — slug sin type
  //   que no aparece como ítem en el bloque: no tiene sentido conservar la referencia.
  // Referencia con formato de código real (no placeholder) no existente en backlog →
  //   null/[] + _blogLog('ref-no-resuelta') — el código debería existir y no existe.
  const _refFields = ['parentId', 'triggeredBy', 'origenDisc', 'promovida_a'];
  const _listFields = ['dependsOn'];

  const resolvedItems = paso1.map(item => {
    let changed = false;
    const patch = {};

    // Campos escalares de referencia
    _refFields.forEach(field => {
      const val = item[field];
      if (!val) return;
      if (_isPlaceholderCode(val)) {
        // Placeholder: intentar resolver via slugMap
        const resolved = slugMap.get(val);
        if (resolved) {
          patch[field] = resolved;
          changed = true;
        } else if (field === 'promovida_a') {
          // T-202605-137: AC error — promovida_a con pendiente-ID sin ítem nuevo correspondiente
          // Conservar literal para pasadas posteriores, pero registrar advertencia en DocLog
          _blogLog('promovida-a-no-resuelta', item.code || '[sin-código]',
            'promovida_a: ' + val + ' no pudo resolverse — no hay ítem nuevo con ese pendiente-ID en este CHECKPOINT',
            'backlog');
        } else if (/^\[tmp:[a-z0-9_-]+\]$/i.test(val)) {
          // T-202606-005: [tmp:slug] sin type valido no resoluble — null + log
          // No tiene sentido conservar la referencia: el slug no tiene item correspondiente en el bloque.
          _blogLog('tmp-slug-no-resoluble', item.code || '[sin-codigo]',
            field + ': ' + val + ' no pudo resolverse — [tmp:slug] sin type valido en este bloque',
            'backlog');
          patch[field] = null;
          changed = true;
        }
        // [pendiente-ID] sin resolucion — conservar literal para pasadas posteriores
      } else {
        // Código con formato real: si no existe en backlog → null + log
        const existsInBacklog = getItems() && getItems().find(i => i.code === val);
        if (!existsInBacklog) {
          _blogLog('ref-no-resuelta', item.code || '[sin-código]', field + ': ' + val + ' no existe en el backlog', 'backlog');
          patch[field] = null;
          changed = true;
        }
      }
    });

    // Campos de lista de referencias (dependsOn)
    _listFields.forEach(field => {
      const arr = item[field];
      if (!Array.isArray(arr) || !arr.length) return;
      let listChanged = false;
      const resolved = arr.map(val => {
        if (!val) return val;
        if (_isPlaceholderCode(val)) {
          // Placeholder: intentar resolver via slugMap
          const mapped = slugMap.get(val);
          if (mapped) { listChanged = true; return mapped; }
          // T-202606-005: [tmp:slug] sin resolucion — null + log (se filtra del array)
          if (/^\[tmp:[a-z0-9_-]+\]$/i.test(val)) {
            _blogLog('tmp-slug-no-resoluble', item.code || '[sin-codigo]',
              field + '[]: ' + val + ' no pudo resolverse — [tmp:slug] sin type valido en este bloque',
              'backlog');
            listChanged = true;
            return null;
          }
          // [pendiente-ID] sin resolucion — conservar literal para pasadas posteriores
          return val;
        } else {
          // Código con formato real: si no existe en backlog → null + log
          const existsInBacklog = getItems() && getItems().find(i => i.code === val);
          if (!existsInBacklog) {
            _blogLog('ref-no-resuelta', item.code || '[sin-código]', field + '[]: ' + val + ' no existe en el backlog', 'backlog');
            listChanged = true;
            return null;
          }
          return val;
        }
      }).filter(v => v !== null);
      if (listChanged) { patch[field] = resolved; changed = true; }
    });

    return changed ? { ...item, ...patch } : item;
  });
  // B-202606-022: exponer slugMap para que mergeBacklogFromTG lo propague hasta applyPatchesFromTG
  return { items: resolvedItems, slugMap };
}

// TKT-PARSER-2a (REQ-[pendiente-ID]): tabla de pares válidos de transición ITIL.
// Clave: incidentStatus origen. Valor: Set de incidentStatus destino permitidos desde ese origen.
// Distinto de _VALID_INCIDENT_STATUS (locus-session-parse.js) — ese set valida pertenencia
// del valor al vocabulario ITIL; esta tabla valida que el PAR origen→destino sea una
// transición real del ciclo de vida (BR-Core §6), no solo que ambos valores existan.
const _VALID_INCIDENT_TRANSITIONS = {
  detected:    new Set(['assigned']),
  assigned:    new Set(['in_progress']),
  in_progress: new Set(['resolved', 'escalated_to_prb', 'escalated_to_chg']),
  resolved:    new Set(['closed'])
  // closed, escalated_to_prb, escalated_to_chg, descartado: sin transiciones salientes declaradas —
  // estados terminales del ciclo dentro de este merge. Reabrir un INC closed no es un caso cubierto
  // por este AC — fuera de scope de TKT-PARSER-2a.
};

// TKT1 (REQ CAEL-01): tabla de transiciones propia de PRB — BR-Core §6.
// PRB no tiene status 'assigned' (a diferencia de INC) — nace directamente en 'detected'.
const _VALID_PRB_TRANSITIONS = {
  detected:    new Set(['in_progress']),
  in_progress: new Set(['resolved']),
  resolved:    new Set(['closed'])
  // closed, descartado: estados terminales — sin transiciones salientes declaradas, mismo criterio
  // que _VALID_INCIDENT_TRANSITIONS para closed. Fuera de scope de TKT1.
};

// TKT1 (REQ CAEL-01): tabla de transiciones propia de KE — BR-Core §6.
// KE nace en 'active' — único estado no terminal del ciclo.
const _VALID_KE_TRANSITIONS = {
  active: new Set(['resolved', 'descartado'])
  // resolved, descartado: estados terminales — sin transiciones salientes declaradas.
};

// TKT-PARSER-2a (REQ-[pendiente-ID]): valida un par (oldIncidentStatus, newIncidentStatus).
// No usa VALID_TRANSITIONS (locus-session-save.js) — esa tabla es de status Scrum por tipo,
// no de transiciones ITIL por par origen→destino. Devuelve {valid:true} o {valid:false, reason}.
// TKT1 (REQ CAEL-01): parámetro `itilType` agregado — antes esta función validaba todo par
// contra el vocabulario y la tabla de transiciones de INC, sin distinguir tipo. PRB y KE
// comparten mecanismo pero tienen vocabulario y tabla de transiciones propios (BR-Core §6) —
// aplicar la tabla de INC a un PRB rechazaba transiciones válidas de su propio ciclo
// (ej. detected→in_progress). `itilType` es opcional y por defecto 'INC' — preserva el
// comportamiento exacto de todo caller que no fue actualizado a pasar el tipo.
function validateIncidentTransitions(oldIncidentStatus, newIncidentStatus, itilType = 'INC') {
  const _statusSet = itilType === 'PRB' ? _VALID_PRB_STATUS
    : itilType === 'KE' ? _VALID_KE_STATUS
    : _VALID_INCIDENT_STATUS;
  const _transitions = itilType === 'PRB' ? _VALID_PRB_TRANSITIONS
    : itilType === 'KE' ? _VALID_KE_TRANSITIONS
    : _VALID_INCIDENT_TRANSITIONS;
  if (!_statusSet.has(oldIncidentStatus) || !_statusSet.has(newIncidentStatus)) {
    // Valor fuera del vocabulario ITIL del tipo — ya debió rechazarse en _buildItilItem (locus-session-parse.js).
    // Defensivo: no es una transición ITIL inválida en sí, es un valor inválido — no bloquear aquí.
    return { valid: true };
  }
  const _allowed = _transitions[oldIncidentStatus];
  if (!_allowed || !_allowed.has(newIncidentStatus)) {
    return { valid: false, reason: `transición ITIL inválida: ${oldIncidentStatus} → ${newIncidentStatus}` };
  }
  return { valid: true };
}

// TKT1 (REQ-refactor-item-shape-itil-scrum): campos comunes a Scrum (REQ/TKT/DISC) e ITIL
// (INC/PRB/KE/CHG) — factorizado desde el _newItemObj único que existía antes de este TKT.
// Extraído tal cual, sin cambio de valor ni de orden de evaluación.
function _buildCommonItemFields(item, ctx) {
  const { _incomingType, initialStatus, _resolvedParentId, _parentSprint, nowTs, sessionId } = ctx;
  return {
    id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2,6),
    code: item.code,
    type: _incomingType,
    title: item.title || item.code,
    desc: '',
    priority: item.priority || 'medium',  // T-202606-032 / B-202606-015: tomar priority del ítem entrante — no hardcodear 'medium'
    area: item.area || '',
    effort: item.effort != null ? item.effort : 1, // B-202606-023: preservar effort declarado — null || 1 pisaba el valor con default
    impact: 'Medio',
    status: initialStatus,
    version: 'futura',
    sprint: item.sprint || _parentSprint,
    ac: item.ac || [],
    role: item.role || '',
    origin: item.origin || null,
    // TKT1 (REQ CAEL-0720-10): segundo gate — aunque el bloque de normalización previo a
    // _assignPendingIds ya descarta `parent` en ítems no-TKT, este campo común (compartido
    // por Scrum e ITIL, ver comentario de _buildCommonItemFields) no confiaba solo en eso.
    // Mismo criterio defensivo que el guard explícito de _syncParentRStatus — no depender
    // únicamente de que un punto anterior del pipeline haya limpiado el dato.
    parentId: _incomingType === 'TKT' ? _resolvedParentId : null,
    dependsOn: item.dependsOn || [],
    triggeredBy: item.triggeredBy || null,
    origenDisc: item.origenDisc || null,
    promovida_a: item.promovida_a || null,
    ..._zonaDeclaradaLogFields(item, _incomingType),
    ..._discardReasonFields(item, initialStatus),
    blockedBy: item.blockedBy || [],
    blocking: item.blocking || false,
    sessionId: sessionId || null,
    draft: item.draft === true,
    createdAt: nowTs,
    statusChangedAt: nowTs,
    doneAt: initialStatus === 'done' ? nowTs : null
  };
}

// TKT3 (REQ type-safety DISC status) + TKT-202607-005-bis (ignorar campo zona en REQ/TKT):
// regla relajada — __BR-Ecosystem §8. Ningún tipo persiste el campo zona: DISC porque
// el invariante Q-DISC se garantiza por arquitectura (_isQDiscActive/ausencia de sprint
// en DISC), REQ/TKT porque nunca la declararon en su schema (usan sprint vacío/ausente
// para Q-Backlog — __BR-Ecosystem §5). Si llega declarada con cualquier valor —
// 'PP-Q-Backlog', 'icebox', 'n/a', 'sin-sprint', lo que sea — se ignora igual en los
// tres tipos, nunca se valida ni se rechaza el ítem por su contenido. El log es la
// única adición: señal de que quien emitió el CHECKPOINT sigue asumiendo que zona
// importa para ese tipo. Sin efecto sobre ITIL — ningún incidencia matchea DISC/REQ/TKT
// aquí, mismo comportamiento no-op que tenía inline en el objeto único (preservado tal cual,
// no ampliado, por TKT1 REQ-refactor-item-shape-itil-scrum).
function _zonaDeclaradaLogFields(item, _incomingType) {
  if (item.zona === undefined) return {};
  if (_incomingType === 'DISC') {
    _blogLog('zona-declarada-en-disc', item.code, 'zona declarada en DISC ' + item.code + ' — campo ignorado, Q-DISC se aplica siempre por arquitectura.', 'backlog');
  } else if (_incomingType === 'REQ' || _incomingType === 'TKT') {
    _blogLog('zona-declarada-en-req-tkt', item.code, 'zona declarada en ' + _incomingType + ' ' + item.code + ' — campo ignorado, ' + _incomingType + ' no declara zona en su schema (usa sprint vacío/ausente para Q-Backlog).', 'backlog');
  }
  return {};
}

// T-202606-025 + TKT2 (REQ type-safety DISC status): discard_reason — obligatorio en cualquier
// tipo con status descartado (__BR-Ecosystem §5). Type-agnóstico: aplica igual a Scrum e ITIL,
// factorizado sin cambio de comportamiento respecto al bloque inline que reemplaza.
function _discardReasonFields(item, initialStatus) {
  if (initialStatus !== 'descartado') return {};
  if (item.discard_reason === undefined) {
    _blogLog('discard-reason-ausente', item.code, 'discard_reason ausente en ' + item.code + ' con status descartado — campo obligatorio según __BR-Ecosystem §5.', 'backlog');
    return {};
  }
  const _VALID_DISCARD_REASONS = new Set(['duplicado', 'fuera de alcance', 'reemplazado', 'obsoleto']);
  if (!_VALID_DISCARD_REASONS.has(item.discard_reason)) {
    _blogLog('discard-reason-no-canonico', item.code, 'discard_reason con valor no canónico: ' + item.discard_reason, 'backlog');
  }
  return { discard_reason: item.discard_reason };
}

// TKT1 (REQ-refactor-item-shape-itil-scrum · AC1): constructor exclusivo de Scrum (REQ/TKT/DISC).
// Nunca incluye campos ITIL-only (queue/incidentStatus/slaPriority/slaDeadline/
// comportamientoActual/originModule/derivedItems/resolutionType) — a diferencia del objeto único
// anterior, donde su ausencia dependía de un spread condicional evaluado en cada llamada.
function buildScrumItem(item, ctx) {
  return _buildCommonItemFields(item, ctx);
}

// TKT1 (REQ-refactor-item-shape-itil-scrum · AC2): constructor exclusivo de ITIL (INC/PRB/KE/CHG).
// Siempre incluye queue/slaPriority/slaDeadline/comportamientoActual/originModule/derivedItems/
// resolutionType. incidentStatus solo si el tipo es INC/PRB/KE — CHG usa vocabulario Scrum
// (`status`), no declara incidentStatus (__BR-Ecosystem §4b). Mismos defaults que el objeto
// único anterior — sin cambio de comportamiento.
function buildIncidentItem(item, ctx) {
  const { _incomingType, initialStatus } = ctx;
  return {
    ..._buildCommonItemFields(item, ctx),
    queue: item.queue || null,
    ...(['INC', 'PRB', 'KE'].includes(_incomingType) ? { incidentStatus: item.incidentStatus || initialStatus } : {}),
    slaPriority: item.slaPriority || null,
    slaDeadline: item.slaDeadline || null,
    comportamientoActual: item.comportamientoActual || '',
    originModule: item.originModule || null,
    derivedItems: item.derivedItems || [],
    resolutionType: item.resolutionType || null,
  };
}

// ── T-098: Merge TRACKER-GLOBAL → getItems() en memoria ──
// Llamado desde saveSession(). Acumula múltiples sesiones sin exportar.
// T-202604-121: retorna {created, updated, ignored} para super toast
export async function mergeBacklogFromTG(tgItems, sessionId, opts) {
  // TKT2 (REQ-[pendiente-ID] · Ingesta batch de CHECKPOINTs): slugMap: new Map() agregado al
  // resultado de items vacíos — sin esto, el orquestador de batch (_applyCheckpointBatch,
  // locus-session-save.js) pierde la cadena de seedSlugMap si un bloque del batch no trae ítems.
  if (!tgItems || !tgItems.length) return { created:[], advanced:[], retroceso:[], discarded:[], updated:[], ignored:[], createdAndClosed:[], tmpSuggestions:[], invalidTransition:[], slugMap: (opts && opts.seedSlugMap instanceof Map) ? opts.seedSlugMap : new Map(), refIdTitleMap: new Map() }; // TKT1 (REQ-[pendiente-ID] · CAEL-04): refIdTitleMap vacío en el guard temprano — sin tgItems no hay refId que declarar, pero el campo debe existir siempre en el objeto de retorno para que los callers no necesiten un guard adicional de undefined
  const _dryRun   = !!(opts && opts.dryRun);
  const _ckptRol  = (opts && opts.ckptRol) || '';

  // TKT (REQ-[pendiente-ID] · ref_id+title en 2 archivos — BR-Ecosystem §4/§8): un campo de
  // referencia (parent/depends_on/triggered_by/promovida_a/origen_disc) puede llegar como
  // objeto {ref_id, title} en vez de string — el rol emisor lo declaró así porque el ítem
  // referenciado nació en el mismo CHECKPOINT o en uno anterior de la misma tanda sin código
  // real aún. _isPlaceholderCode y _refFields/_listFields de _assignPendingIds solo reconocen
  // strings — nunca objetos. Se normaliza el objeto a un string sintético '[tmp:REF_ID]' AQUÍ,
  // antes de la normalización parent→parentId existente, para reutilizar 100% el motor
  // _findTmpMatch/slugMap ya existente sin duplicar lógica de resolución (decisión de Cael,
  // Fase 2 — ver CHECKPOINT de especificación).
  //
  // Paso A: mapa refId → title declarante, construido desde tgItems ya combinado (no requiere
  // transportar nada desde _resolveCheckpointBatch — el dato ya está completo aquí).
  const _refIdTitleMap = new Map();
  tgItems.forEach(it => {
    if (it && it.refId) _refIdTitleMap.set(it.refId, it.title || '');
  });

  const _REF_OBJ_FIELDS  = ['parentId', 'triggeredBy', 'origenDisc', 'promovida_a'];
  const _REF_OBJ_LISTS   = ['dependsOn'];

  // Paso B: normalizar cada campo de referencia — un objeto {ref_id, title} se convierte en
  // '[tmp:REF_ID]' solo si el title coincide exactamente con el declarante; si no coincide,
  // se bloquea con null + DocLog. Si el ref_id no tiene declarante en este tgItems, también
  // null + DocLog — mismo criterio que un [tmp:slug] sin item correspondiente.
  function _normalizeRefIdValue(val, item, field) {
    if (!val || typeof val !== 'object' || Array.isArray(val) || !val.ref_id) return val; // no es {ref_id,title} — dejar pasar tal cual
    const _declaredTitle = _refIdTitleMap.get(val.ref_id);
    if (_declaredTitle === undefined) {
      _blogLog('ref-id-sin-declarante', item.code || '[sin-código]',
        `ref_id ${val.ref_id} referenciado sin ítem declarante en este bloque — pegar el bloque completo.`,
        'backlog');
      return null;
    }
    if (_declaredTitle !== (val.title || '')) {
      _blogLog('ref-id-title-mismatch', item.code || '[sin-código]',
        `ref_id ${val.ref_id} no coincide con title declarado — resolución bloqueada.`,
        'backlog');
      return null;
    }
    return `[tmp:${val.ref_id}]`;
  }

  tgItems = tgItems.map(item => {
    _REF_OBJ_FIELDS.forEach(field => {
      if (item[field] !== undefined) item[field] = _normalizeRefIdValue(item[field], item, field);
    });
    _REF_OBJ_LISTS.forEach(field => {
      if (Array.isArray(item[field])) {
        item[field] = item[field].map(v => _normalizeRefIdValue(v, item, field));
      }
    });
    return item;
  });

  // INC-202607-004 (triggered_by TKT-202607-001): la normalización parent→parentId /
  // depends_on→dependsOn debe correr ANTES de _assignPendingIds — no después. _assignPendingIds
  // resuelve parentId contra slugMap en su Paso 2 (_refFields incluye 'parentId'); si el campo
  // todavía se llama 'parent' en ese momento, el guard `if (!val) return` lo salta sin resolver
  // y el placeholder ([tmp:slug] o [pendiente-ID]) queda copiado sin resolver a parentId por la
  // normalización tardía. Mismo patrón que ya usa applyPatchesFromTG (normaliza en L2633 antes
  // de resolver slugMap en L2636) — este fix alinea mergeBacklogFromTG al mismo orden correcto.
  // B-202605-016: normalizar campo parent (schema CHECKPOINT) → parentId (campo interno).
  // T-202606-009: normalizar depends_on (schema) → dependsOn (campo interno) — mismo patrón.
  // Sin esta normalización los slugs en depends_on nunca llegan a _listFields de _assignPendingIds
  // y se pierden silenciosamente: el campo queda undefined en lugar de [] con slugs resueltos.
  // T-[pendiente-ID] (REQ-unify-parent TKT2): tras normalizar a parentId, eliminar item.parent del
  // objeto en memoria — parentId es el único campo canónico en JS desde aquí en adelante. Sin esto,
  // ítems recién ingresados arrastraban .parent como campo legacy durante toda su vida en memoria.
  // TKT1 (REQ CAEL-0720-10): parent/parentId es exclusivo de TKT (__BR-Ecosystem §5) — un
  // ítem de otro tipo (INC/PRB/KE/CHG/DISC/REQ) que declara `parent` por error en el
  // CHECKPOINT lo descarta sin transferirlo a parentId. Cierra el gap que permitía a un INC
  // recibir parentId en memoria a través de este mismo bloque (widen indebido introducido en
  // mod:79/87 de module-contracts, revertido por este REQ). itemKind(item) usa item.type
  // directo del CHECKPOINT — todavía no pasó por _buildCommonItemFields en este punto.
  tgItems = tgItems.map(item => {
    if (item.parent) {
      if (itemKind(item) === 'TKT') { if (!item.parentId) item.parentId = item.parent; }
      delete item.parent;
    }
    if (Array.isArray(item.depends_on) && !item.dependsOn) { item.dependsOn = item.depends_on; }
    return item;
  });

  // B-202604-198: Separar placeholders ANTES de _assignPendingIds para preservar su naturaleza.
  // Los placeholders siempre son ítems nuevos — nunca matchean contra el backlog.
  // _assignPendingIds se aplica solo a los que tienen type char válido (P/T/R/B) y código real.
  // B-202606-022: _assignPendingIds retorna { items, slugMap } — slugMap se propaga hasta applyPatchesFromTG
  // TKT2: opts.seedSlugMap propagado — encadena la identidad de [tmp:slug] resuelta en bloques
  // previos del mismo batch (ver _applyCheckpointBatch, locus-session-save.js).
  const { items: _assignedItems, slugMap: _slugMap } = await _assignPendingIds(tgItems, opts && opts.seedSlugMap);
  tgItems = _assignedItems;

  let changed = false;
  const created = [], advanced = [], retroceso = [], discarded = [], updated = [], ignored = [], invalidTransition = []; // invalidTransition: T-[pendiente-ID]
  // B-202604-198: grupo propio para ítems que nacen y cierran en el mismo CHECKPOINT
  const createdAndClosed = [];
  // B-202604-198: sugerencias de match [tmp:slug] → ID real existente (para confirmación del usuario)
  const tmpSuggestions = [];

  // Orden de avance: pendiente < done < descartado (descartado solo vía confirmación)
  const _statusRank = { pendiente: 0, discovery: 0, 'en-revision': 0.5, promoted: 0.8, promovida: 0.8, done: 1, descartado: 2 }; // T-202606-032 / B-202606-016: rank 0.8 · TKT-C2: 'promoted' Gen2 + 'promovida' legacy · TKT-202606-008: 'discovery' mismo rank que 'pendiente' — ítem activo sin avance de ciclo

  // B-202606-047: ordenar batch — REQ primero, luego TKT/INC, luego el resto.
  // Sin este orden, cuando REQ y sus TKT llegan en el mismo CHECKPOINT el find de parentId
  // no encuentra al REQ padre (aún no pusheado a getItems()) → parentId: null en todos los TKT.
  const _typeOrder = { REQ: 0, TKT: 1, INC: 1, DISC: 2 };
  tgItems.sort((a, b) => {
    const tA = itemKind(a) || 'DISC';
    const tB = itemKind(b) || 'DISC';
    return (_typeOrder[tA] ?? 3) - (_typeOrder[tB] ?? 3);
  });

  // B-202605-007: snapshot antes de cualquier mutación — incluye cierre automático de P padre
  if (!_dryRun) _undoSnapshotItems();

  // INC-[pendiente-ID] (fix undo/redo ITIL, TKT1 · triggered_by REQ-202607-022): ítems ITIL
  // nuevos del batch se acumulan aquí en vez de getIncidents().push() directo — un solo
  // _setIncidents(array) al cerrar el forEach dispara un único _undoSnapshotIncidents() para
  // todo el batch, mismo criterio que _undoSnapshotItems() ya aplica a ITEMS. Push directo
  // sobre la referencia de getIncidents() nunca pasaba por el mutador canónico — el INC nuevo
  // no quedaba en ningún stack de undo.
  const _pendingNewIncidents = [];

  tgItems.forEach(item => {
    if (!item.code) return;
    if (item._invalidType) { ignored.push({ code: item.code || '[sin-código]', reason: 'tipo-invalido', desc: item.title }); return; }
    if (item._duplicate) {
      // B-202605-XXX: ítem duplicado (título matchea existente via _assignPendingIds) —
      // aunque se ignore para status/creación, si trae AC se mergean sobre el existente.
      if (item.ac && item.ac.length && item._existingCode && !_dryRun) {
        const dupExisting = getItems().find(i => i.code === item._existingCode);
        if (dupExisting) {
          dupExisting.ac = item.ac;
          _acReplacedSet.add(dupExisting.id);
          if (sessionId && dupExisting.sessionId !== sessionId) dupExisting.sessionId = sessionId;
          if (!dupExisting.history) dupExisting.history = [];
          dupExisting.history.push({ type: 'field', ts: Date.now(), origin: 'checkpoint', sessionId: sessionId || null, data: { field: 'ac', from: null, to: item.ac } });
          changed = true;
        }
      }
      ignored.push({ code: '[pendiente-ID]', reason: 'duplicado', desc: item.title, existingCode: item._existingCode || '' });
      return;
    }

    // B-202604-198: REGLA DE PLACEHOLDER — forzar rama "nuevo" sin intentar match
    // Un [tmp:slug] o [pendiente-ID] NUNCA matchea contra getItems() existentes.
    // Nota: _assignPendingIds ya habrá convertido [pendiente-ID] con type char real si tiene
    // suficiente info; si no pudo (sin type), sigue siendo placeholder.
    const isPlaceholder = _isPlaceholderCode(item.code);

    // B-202604-198: REGLA DE TMP — detectar si [tmp:slug] corresponde a un ID real existente
    // por similitud de título. Si hay match potencial, registrar sugerencia y NO crear duplicado.
    if (isPlaceholder && /^\[tmp:[a-z0-9_-]+\]$/i.test(item.code)) {
      // INC-[pendiente-ID] (fix creación/lookup ITIL): concatenar getIncidents() — un [tmp:slug]
      // de tipo INC/PRB/KE/CHG vive en INCIDENTS, no en ITEMS. _findTmpMatch ya filtra por
      // incomingType === item.type, así que concatenar no afecta el resultado para BACKLOG_TYPES.
      const tmpMatch = _findTmpMatch(item.code, item.title, getItems().concat(getIncidents()), item.type);
      if (tmpMatch) {
        tmpSuggestions.push({
          tmpCode: item.code,
          desc: item.title,
          suggestedCode: tmpMatch.item.code,
          suggestedTitle: tmpMatch.item.title,
          score: tmpMatch.score
        });
        // No crear duplicado — el usuario confirma el match en el panel
        return;
      }
    }

    // B-202604-198: si es placeholder, saltar directamente a rama "nuevo"
    // INC-[pendiente-ID] (fix creación/lookup ITIL): getAnyItem() en vez de getItems().find() —
    // un ítem ITIL con código real vive en INCIDENTS desde el fix de creación de este mismo INC;
    // getItems().find() nunca lo encontraba y el merge lo trataba como ítem nuevo (duplicado).
    const existing = isPlaceholder ? null : getAnyItem(item.code);
    if (existing) {
      const newStatus = item.status; // T-202606-034: item.status ya canónico desde T1 — _tgStatusToBacklog eliminada
      const oldStatus = existing.status || 'pendiente';
      const changes = [];

      // T-[pendiente-ID] · AC-1: filtro pre-clasificación — transición inválida interceptada antes de _statusRank
      // AC-2: type desconocido → no interceptar. AC-3: sin status → no interceptar.
      // TKT0c-gen2: itemKind(existing) reemplaza la inferencia local por prefijo (eliminada) y la tabla inline.
      // TKT-PARSER-2b (REQ-[pendiente-ID]): INC/PRB/KE ahora llegan con item.status poblado
      // (mirror de incidentStatus, ver locus-session-parse.js _buildItilItem) — sin esta
      // exclusión, validateLifecycleTransitions (Scrum, vocabulario TKT/REQ/DISC) interceptaría
      // transiciones ITIL válidas (ej. detected→assigned) como inválidas por desconocer ese
      // vocabulario. La validación real de estos 3 tipos vive en el bloque ITIL dedicado de abajo
      // (validateIncidentTransitions). CHG no se excluye — su vocabulario es Scrum-compatible
      // (pendiente/en-revision/done/descartado) y este bloque lo valida correctamente.
      const _skipScrumGate = ['INC', 'PRB', 'KE'].includes(itemKind(existing));
      if (!_skipScrumGate && newStatus && newStatus !== oldStatus && !item._noStatus) {
        const _existingKind = itemKind(existing);
        if (_existingKind !== null) {
          // Importar VALID_TRANSITIONS directamente para verificación inline (evita llamada costosa al array completo)
          const _vtResult = validateLifecycleTransitions([{ code: item.code, type: _existingKind, status: newStatus }]);
          if (_vtResult.length > 0) {
            // Transición inválida — registrar y saltar toda la lógica de status para este ítem
            invalidTransition.push(_vtResult[0]);
            // Continuar con campos no-status (title, effort, area, etc.) — solo status queda excluido
            // Marcar item._noStatus para que el bloque de lógica de status no lo procese
            item._noStatus = true;
          }

          // T-202606-031 · TKT0c-gen2: validación de rol autorizado para REQ → bloqueado
          // AC-1/AC-4: solo 'QA · Finn' puede mover un REQ a status 'bloqueado'.
          // Si el rol no es el autorizado — registrar en invalidTransition y excluir el cambio de status.
          // AC-3: si no hay status entrante o no es 'bloqueado' — no interceptar.
          if (!item._noStatus && _existingKind === 'REQ' && newStatus === 'bloqueado' && _ckptRol !== 'QA · Finn') {
            invalidTransition.push({
              code: item.code,
              type: 'REQ',
              status: 'bloqueado',
              reason: `rol no autorizado: solo QA · Finn puede mover un REQ a bloqueado (recibido: ${_ckptRol || '(sin rol)'})`
            });
            item._noStatus = true;
          }
        }
      }

      // TKT-PARSER-2a (REQ-[pendiente-ID]): validación de transición ITIL — paralela al bloque
      // Scrum de arriba. TKT-PARSER-2b: INC/PRB/KE quedan excluidos del bloque Scrum vía
      // _skipScrumGate — su único camino de validación de status es esta rama
      // (validateIncidentTransitions). CHG sí pasa por el bloque Scrum (vocabulario compatible)
      // y no entra a esta rama de incidentStatus porque no lo declara.
      const _existingKindItil = itemKind(existing);
      const _isItilExisting = ['INC', 'PRB', 'KE', 'CHG'].includes(_existingKindItil);
      let _noIncidentStatus = false;
      if (_isItilExisting && item.incidentStatus && item.incidentStatus !== existing.incidentStatus) {
        // TKT1 (REQ CAEL-01): _existingKindItil pasado como itilType — antes siempre validaba
        // contra la tabla de INC, sin distinguir PRB/KE.
        const _itResult = validateIncidentTransitions(existing.incidentStatus, item.incidentStatus, _existingKindItil);
        if (!_itResult.valid) {
          invalidTransition.push({ code: item.code, type: _existingKindItil, reason: _itResult.reason });
          _noIncidentStatus = true; // excluye solo incidentStatus — el resto de campos ITIL sí mergea
        }
      }

      // --- Lógica de status ---
      if (!item._noStatus && newStatus && newStatus !== oldStatus) {
        const oldRank = _statusRank[oldStatus] ?? 0;
        const newRank = _statusRank[newStatus] ?? 0;

        if (newStatus === 'descartado') {
          // Descarte: encolar para confirmación — no persistir todavía
          discarded.push({ code: item.code, desc: existing.title, from: oldStatus, reason: item.discardReason || existing.discardReason || '', ref: item.discardRef || existing.discardRef || '' });
          // No tocar existing todavía — se aplica en _confirmDiscard()
        } else if (newRank > oldRank) {
          // Avance: aplicar directo (no en dryRun)
          changes.push({ field: 'status', from: oldStatus, to: newStatus }); // T-202604-414
          if (!_dryRun) {
            existing.status = newStatus;
            existing.statusChangedAt = Date.now();
            if (newStatus === 'done' && !existing.doneAt) existing.doneAt = Date.now();
            if (!existing.history) existing.history = [];
            existing.history.push({ type: 'status', ts: Date.now(), origin: 'checkpoint', aiId: _getActiveSessionAiId() || null, data: { from: oldStatus, to: newStatus } }); // B-202606-012
            _blogLog('ckpt-avance', item.code, oldStatus + ' → ' + newStatus, 'backlog');
            changed = true;
            // B-202606-017 AC-1+AC-2: transición automática del R padre tras avance de T/B via CHECKPOINT
            // TKT1 (REQ-202607-021): _syncParentRStatus reemplaza a _checkAndAdvanceParentR — fuente única
            _syncParentRStatus(item.code, newStatus);
          }
          advanced.push({ code: item.code, desc: existing.title, from: oldStatus, to: newStatus });
        } else if (newRank < oldRank) {
          // Retroceso: encolar para confirmación — no persistir todavía
          retroceso.push({ code: item.code, desc: existing.title, from: oldStatus, to: newStatus });
          // No tocar existing todavía — se aplica en _confirmRetroceso()
        }
        // newRank === oldRank: status idéntico al existente — ignorar silenciosamente (B-202605-086)
      }

      // --- Resto de campos: entrante gana si trae valor (vacíos no degradan) ---
      // T-202604-414: changes es array de {field, from, to} para diff inline en panel
      if (item.title && item.title !== existing.title) { changes.push({ field: 'title', from: existing.title || '—', to: item.title }); if (!_dryRun) { existing.title = item.title; changed = true; } }
      if (item.desc && item.desc !== existing.desc) { changes.push({ field: 'desc', from: existing.desc || '—', to: item.desc }); if (!_dryRun) { existing.desc = item.desc; changed = true; } }
      if (item.effort && item.effort !== existing.effort) { changes.push({ field: 'effort', from: existing.effort || '—', to: item.effort }); if (!_dryRun) { existing.effort = item.effort; changed = true; } }
      if (item.area && item.area !== existing.area) { changes.push({ field: 'area', from: existing.area || '—', to: item.area }); if (!_dryRun) { existing.area = item.area; changed = true; } }
      // TKT-PARSER-2a (REQ-[pendiente-ID]): campos ITIL — mismo patrón entrante-gana-si-trae-valor.
      // incidentStatus respeta _noIncidentStatus (transición rechazada arriba) — el resto de campos
      // ITIL del mismo CHECKPOINT sí mergea aunque la transición de estado se haya excluido (AC-5).
      if (_isItilExisting) {
        if (!_noIncidentStatus && item.incidentStatus && item.incidentStatus !== existing.incidentStatus) {
          changes.push({ field: 'incidentStatus', from: existing.incidentStatus || '—', to: item.incidentStatus });
          // INC-[pendiente-ID] (sin camino de reparación para status corrupto en ítems ITIL):
          // _skipScrumGate (arriba) excluye a INC/PRB/KE del bloque de avance/retroceso Scrum —
          // ese bloque era el único que escribía existing.status. Sin este mirror, existing.status
          // queda congelado en el valor con el que el ítem nació (ej. 'pendiente' pre-TKT-PARSER-2b)
          // para siempre — ni merge ni patch lo corrigen, y chk_status_by_type de Supabase rechaza
          // el upsert indefinidamente. existing.status espeja existing.incidentStatus para tipos ITIL.
          if (!_dryRun) { existing.incidentStatus = item.incidentStatus; existing.status = item.incidentStatus; changed = true; }
        }
        // TKT1 (REQ-inc-historico): al cerrar un incidente vía patch/merge, se fija archivedInSprint
        // al sprint 'active' actual — primer valor gana, nunca se recalcula si ya existía (AC fuera
        // de scope). Sin sprint 'active' → queda sin asignar, no bloquea el resto del merge.
        if (!_noIncidentStatus && item.incidentStatus === 'closed' && !existing.archivedInSprint) {
          const _openSprint = getActiveSprints().find(s => s.status === 'active');
          if (_openSprint) {
            changes.push({ field: 'archivedInSprint', from: existing.archivedInSprint || '—', to: _openSprint.id });
            if (!_dryRun) { existing.archivedInSprint = _openSprint.id; changed = true; }
          }
        }
        if (item.slaPriority && item.slaPriority !== existing.slaPriority) { changes.push({ field: 'slaPriority', from: existing.slaPriority || '—', to: item.slaPriority }); if (!_dryRun) { existing.slaPriority = item.slaPriority; changed = true; } }
        if (item.slaDeadline != null && item.slaDeadline !== existing.slaDeadline) { changes.push({ field: 'slaDeadline', from: existing.slaDeadline || '—', to: item.slaDeadline }); if (!_dryRun) { existing.slaDeadline = item.slaDeadline; changed = true; } }
        if (item.resolutionType && item.resolutionType !== existing.resolutionType) { changes.push({ field: 'resolutionType', from: existing.resolutionType || '—', to: item.resolutionType }); if (!_dryRun) { existing.resolutionType = item.resolutionType; changed = true; } }
        if (item.comportamientoActual && item.comportamientoActual !== existing.comportamientoActual) { changes.push({ field: 'comportamientoActual', from: existing.comportamientoActual || '—', to: item.comportamientoActual }); if (!_dryRun) { existing.comportamientoActual = item.comportamientoActual; changed = true; } }
        if (item.originModule && item.originModule !== existing.originModule) { changes.push({ field: 'originModule', from: existing.originModule || '—', to: item.originModule }); if (!_dryRun) { existing.originModule = item.originModule; changed = true; } }
        if (item.derivedItems && item.derivedItems.length) { changes.push({ field: 'derivedItems', from: existing.derivedItems || [], to: item.derivedItems }); if (!_dryRun) { existing.derivedItems = item.derivedItems; changed = true; } }
      }
      // B-202605-233: sprint vacío explícito ('' ) mueve ítem a Ideas — antes se ignoraba por falsy
      if (item.sprint !== undefined && item.sprint !== existing.sprint) { changes.push({ field: 'sprint', from: existing.sprint || '—', to: item.sprint }); if (!_dryRun) { existing.sprint = item.sprint; changed = true; } }
      // B-202604-179: ac: reemplaza si entrante trae contenido — no acumula entre CHECKPOINTs
      if (item.ac && item.ac.length) {
        changes.push({ field: 'ac', from: existing.ac || [], to: item.ac });
        if (!_dryRun) { existing.ac = item.ac; _acReplacedSet.add(existing.id); changed = true; }
      }
      // AC-4: role entrante gana si trae valor; si vacío no degrada el existente
      if (item.role && item.role !== existing.role) { changes.push({ field: 'role', from: existing.role || '—', to: item.role }); if (!_dryRun) { existing.role = item.role; changed = true; } }
      // parentId: entrante gana si trae valor; si vacío no degrada el existente
      // TKT3 (REQ CAEL-0720-1x): parentId exclusivo de TKT (__BR-Ecosystem §5) — gate aplicado
      // también aquí, en la rama de "ítem existente" de mergeBacklogFromTG. TKT1/TKT2
      // (REQ CAEL-0720-10) solo gatearon la rama de creación de ítems nuevos
      // (_buildCommonItemFields); esta rama reemite un CHECKPOINT con código ya existente y
      // quedó fuera de ese fix — permitía reintroducir el widen de mod:79 sobre un INC/PRB/KE/
      // CHG/DISC ya persistido, sin pasar por creación.
      if (item.parentId && item.parentId !== existing.parentId) {
        if (itemKind(existing) === 'TKT') {
          changes.push({ field: 'parentId', from: existing.parentId || '—', to: item.parentId });
          if (!_dryRun) { existing.parentId = item.parentId; changed = true; }
        } else if (!_dryRun) {
          _blogLog('parentId-ignorado', existing.code, 'parentId ignorado en merge: ' + (itemKind(existing) || 'tipo desconocido') + ' no puede tener parent — solo TKT (__BR-Ecosystem §5). parentId recibido: ' + item.parentId, 'backlog');
        }
      }
      // B-202606-004 AC-2: advertencia cuando T existente con parentId recibe merge sin parent declarado
      // TKT3: acotado a TKT — INC nunca debería llegar aquí con parentId propio tras el gate de arriba,
      // pero se mantiene el filtro de tipo explícito en vez de asumirlo por construcción.
      if (!item.parentId && existing.parentId && itemKind(existing) === 'TKT' && !_dryRun) {
        _blogLog('parent-ausente-en-merge', existing.code, existing.code + ' tiene parentId ' + existing.parentId + ' — merge entrante no declara parent. parentId conservado.', 'backlog');
      }
      // origin: entrante gana si trae valor; si vacío no degrada el existente
      if (item.origin && item.origin !== existing.origin) { changes.push({ field: 'origin', from: existing.origin || '—', to: item.origin }); if (!_dryRun) { existing.origin = item.origin; changed = true; } }
      // notes: entrante gana si trae valor; si vacío no degrada el existente
      if (item.notes && item.notes !== existing.notes) { changes.push({ field: 'notes', from: existing.notes || '—', to: item.notes }); if (!_dryRun) { existing.notes = item.notes; changed = true; } }
      // discardReason / discardRef
      if (item.discardReason && item.discardReason !== existing.discardReason) { changes.push({ field: 'discardReason', from: existing.discardReason || '—', to: item.discardReason }); if (!_dryRun) { existing.discardReason = item.discardReason; changed = true; } }
      if (item.discardRef    && item.discardRef    !== existing.discardRef)    { changes.push({ field: 'discardRef',    from: existing.discardRef    || '—', to: item.discardRef    }); if (!_dryRun) { existing.discardRef    = item.discardRef;    changed = true; } }
      // T-202604-288: blockedBy — append con dedup
      if (item.blockedBy && item.blockedBy.length) {
        const existingBB = existing.blockedBy || [];
        const newBB = item.blockedBy.filter(c => !existingBB.includes(c));
        if (newBB.length) { changes.push({ field: 'blockedBy', from: existingBB.join(', ') || '—', to: [...existingBB, ...newBB].join(', ') }); if (!_dryRun) { existing.blockedBy = [...existingBB, ...newBB]; changed = true; } }
      }
      // R-202604-051: blocking
      if (item.blocking === true && !existing.blocking) { changes.push({ field: 'blocking', from: '—', to: 'true' }); if (!_dryRun) { existing.blocking = true; changed = true; } }
      // T-202605-137: promovida_a — actualizar en la P y escribir origenDisc en el ítem destino
      if (item.promovida_a && item.promovida_a !== existing.promovida_a) {
        changes.push({ field: 'promovida_a', from: existing.promovida_a || '—', to: item.promovida_a });
        if (!_dryRun) {
          existing.promovida_a = item.promovida_a;
          changed = true;
          // AC edge case: si promovida_a apunta a código real existente, escribir origenDisc en el destino
          if (!_isPlaceholderCode(item.promovida_a)) {
            // TKT-202607-045: getAnyItem() — promovida_a de una DISC puede apuntar a un INC.
            const destItem = getAnyItem(item.promovida_a);
            if (destItem && !destItem.origenDisc) {
              destItem.origenDisc = existing.code;
              _blogLog('origen-disc-escrito', existing.code, existing.code + ' → origenDisc en ' + item.promovida_a, 'backlog');
            }
          }
        }
      }
      // origenDisc: entrante gana si trae valor; si vacío no degrada el existente
      if (item.origenDisc && item.origenDisc !== existing.origenDisc) { changes.push({ field: 'origenDisc', from: existing.origenDisc || '—', to: item.origenDisc }); if (!_dryRun) { existing.origenDisc = item.origenDisc; changed = true; } }
      // Estampar sessionId siempre que venga uno (CHECKPOINT más reciente gana)
      if (!_dryRun && sessionId && existing.sessionId !== sessionId) { existing.sessionId = sessionId; changed = true; }

      // T-202604-423: registrar cambios de merge en history[] con origin 'checkpoint'
      // B-202605-241: origin era 'import' — corregido a 'checkpoint' para display correcto en timeline
      if (!_dryRun && changes.length) {
        if (!existing.history) existing.history = [];
        const importTs = Date.now();
        changes.forEach(ch => {
          // status ya se registra en setItemStatus — aquí solo los demás campos
          if (ch.field === 'status') return;
          existing.history.push({
            type: 'field',
            ts: importTs,
            origin: 'checkpoint',
            sessionId: sessionId || null,
            data: { field: ch.field, from: ch.from !== '—' ? ch.from : null, to: ch.to || null }
          });
        });
      }

      if (changes.length) {
        if (!advanced.find(a => a.code === item.code)) {
          // T-202604-414: emitir changes array estructurado + change string para backward compat
          // T-202606-018: changes[] en el objeto updated contiene solo campos auditados por AC-2:
          //   status · priority · effort · sprint · title · area · role
          //   from: null cuando el campo no existía en el backlog (era undefined o '—' placeholder)
          //   El array interno `changes` sin filtrar se conserva para history[] (ya aplicado arriba)
          const _AUDITED_FIELDS = new Set(['status', 'priority', 'effort', 'sprint', 'title', 'area', 'role']);
          const changesForPanel = changes
            .filter(c => _AUDITED_FIELDS.has(c.field))
            .map(c => ({
              field: c.field,
              from: (c.from === '—' || c.from === undefined || c.from === null) ? null : c.from,
              to: c.to
            }));
          updated.push({ code: item.code, desc: existing.title, changes: changesForPanel, change: changes.map(c => c.field).join(' · '), parent: item.parentId || null });
        }
      } else if (!advanced.find(a => a.code === item.code) && !retroceso.find(r => r.code === item.code) && !discarded.find(d => d.code === item.code)) {
        // Distinguir: ya tenía ese status (ok) vs no hubo cambio de status porque no llegó uno válido
        const noStatusIncoming = !item.status || item.status === 'pendiente'; // T-202606-034: item.status ya canónico — comparación directa
        const alreadyInStatus = newStatus === oldStatus;
        if (alreadyInStatus && !noStatusIncoming) {
          ignored.push({ code: item.code, reason: 'ya-en-status', desc: existing.title, status: oldStatus });
        } else if (noStatusIncoming) {
          ignored.push({ code: item.code, reason: 'sin-status', desc: existing.title });
        } else {
          ignored.push({ code: item.code, reason: 'sin-cambios', desc: existing.title });
        }
      }
    } else {
      // AC-9: ítem nuevo — marcar si no tenía código real
      const isNew = item._wasAssigned;
      const nowTs = Date.now();
      const initialStatus = item.status || 'pendiente'; // T-202606-034: item.status ya canónico desde T1

      // TKT-202606-013 (REQ-202606-003 · AC1/AC2): gate de parser — REQ nuevo sin TKT hijo no se
      // crea en el backlog. Reemplaza la degradación suspendida orphaned:true (T-202606-010) —
      // implementa el bloqueo que ese comentario dejaba pendiente. __BR-Core §4 Gate de parser.
      const _incomingTypePreCheck = itemKind(item) || '';
      if (_incomingTypePreCheck === 'REQ') {
        const _rCode = item.code;
        const _hasChildInBatch = tgItems.some(i => {
          const iType = itemKind(i) || '';
          const iParent = i.parentId || null;
          return iType === 'TKT' && iParent === _rCode && i.status !== 'descartado' && i.status !== 'discarded';
        });
        const _hasChildInBacklog = getItems() && getItems().some(i =>
          i.parentId === _rCode && itemKind(i) === 'TKT' && i.status !== 'descartado'
        );
        if (!_hasChildInBatch && !_hasChildInBacklog) {
          // AC2 edge: aplica solo a REQ nuevos — este bloque ya vive dentro de la rama "!existing".
          const _reqIdentifier = item.title || _rCode;
          const _msg = `CHECKPOINT bloqueado: REQ ${_reqIdentifier} emitido sin TKTs hijos. Un REQ debe nacer con al menos TKT1 declarado. Adjuntar CHECKPOINT corregido.`;
          ignored.push({ code: _rCode, reason: 'req-sin-tkt', desc: item.title || '' });
          // AC4: bloqueo es por ítem — no return de todo mergeBacklogFromTG, solo de este forEach.
          // Toast solo en la corrida real — la corrida dry-run (preview del DIFF) ya refleja
          // la exclusión vía diff.ignored, sin duplicar el aviso.
          if (!_dryRun) showToast('error', 'CHECKPOINT bloqueado', _msg);
          _blogLog('req-sin-tkt', _rCode, _msg, 'backlog');
          return; // AC2: no se crea en el backlog
        }
      }

      // TKT-202607-010 (TKT2 REQ-202607-006): gate de parser — Q-DISC al límite de 15
      // activos no acepta un DISC nuevo. Mismo patrón que el gate REQ-sin-TKT de arriba:
      // bloqueo por ítem — no de todo el batch. Cuenta contra getItems() ya persistidos
      // (universo real de la zona vía _isQDiscActive, que ya excluye descartado/promoted/
      // historico) — no contra el batch entrante, que si trae un DISC con código real
      // matcheando uno existente cae en la rama "existing" (arriba), no aquí.
      if (_incomingTypePreCheck === 'DISC') {
        const _activeDiscCount = getItems().filter(_isQDiscActive).length;
        if (_activeDiscCount >= QDISC_ACTIVE_LIMIT) {
          const _qdMsg = `Q-DISC al límite (${QDISC_ACTIVE_LIMIT}/${QDISC_ACTIVE_LIMIT}) — descarta o promueve antes de agregar`;
          ignored.push({ code: item.code, reason: 'qdisc-limite', desc: item.title || '' });
          if (!_dryRun) showToast('error', 'Q-DISC al límite', _qdMsg);
          _blogLog('qdisc-limite', item.code || '', _qdMsg, 'backlog');
          return; // no se crea en el backlog
        }
      }

      // R-202605-021: resolver parentId para ítems nuevos
      // TKT3 (REQ CAEL-0720-1x): parentId exclusivo de TKT (__BR-Ecosystem §5) — AC corregido,
      // antes solo excluía REQ y dejaba pasar cualquier otro tipo (incluido INC) hasta
      // _buildCommonItemFields, que lo descartaba en silencio sin DocLog. Ahora el gate vive
      // aquí también, con log explícito para cualquier tipo no-TKT.
      // AC: solo TKT puede tener parentId — cualquier otro tipo con parentId → ignorar + DocLog
      // AC: si parentId apunta a un TKT o REQ inexistente/no-REQ → ignorar + DocLog
      let _resolvedParentId = null;
      const _incomingType = itemKind(item) || 'TKT';
      if (item.parentId) {
        if (_incomingType !== 'TKT') {
                      _blogLog('parentId-ignorado', item.code || '', 'parentId ignorado: ítems tipo ' + _incomingType + ' no pueden tener padre — solo TKT (__BR-Ecosystem §5). parentId recibido: ' + item.parentId, 'backlog');
        } else {
          const _parentCandidate = getItems().find(p => p.code === item.parentId);
          if (!_parentCandidate) {
                          _blogLog('parentId-ignorado', item.code || '', 'parentId ignorado: código ' + item.parentId + ' no existe en el backlog', 'backlog');
          } else if (itemKind(_parentCandidate) !== 'REQ') {
                          _blogLog('parentId-ignorado', item.code || '', 'parentId ignorado: ' + item.parentId + ' es de tipo ' + (itemKind(_parentCandidate) || 'desconocido') + ' — solo REQ puede ser padre', 'backlog');
          } else {
            _resolvedParentId = item.parentId;
          }
        }
      }

      // B-202604-015: heredar sprint del padre si el ítem no trae sprint propio
      const _parentSprint = (!item.sprint && _resolvedParentId)
        ? (getItems().find(p => p.code === _resolvedParentId) || {}).sprint || ''
        : '';
      if (!_dryRun) {
        // INC-[pendiente-ID] (fix creación/lookup ITIL): destino según tipo — INCIDENT_TYPES
        // (INC/PRB/KE/CHG) vive en INCIDENTS, no en ITEMS. Antes este push era incondicional a
        // getItems() para los 7 tipos — un ITIL nuevo nunca llegaba a INCIDENTS y saveBacklog()
        // lo excluía de ambos upserts (tracker_items por ser ITIL, tracker_incidents por no
        // estar en INCIDENTS) — se perdía silenciosamente. Mismo criterio de destino que
        // _setITEMS() ya aplica en core.js (BACKLOG_TYPES → ITEMS, INCIDENT_TYPES → INCIDENTS).
        // INC-[pendiente-ID] (fix undo/redo ITIL, TKT1): ITIL ya no hace push directo sobre
        // getIncidents() — se acumula en _pendingNewIncidents y se aplica en un solo
        // _setIncidents(array) al cerrar el forEach (ver flush post-loop). ITEMS conserva push
        // directo — su snapshot único ya está cubierto por _undoSnapshotItems() de arriba.
        const _isIncomingIncident = INCIDENT_TYPES.includes(_incomingType);
        const _newItemObj = _isIncomingIncident
          ? buildIncidentItem(item, { _incomingType, initialStatus, _resolvedParentId, _parentSprint, nowTs, sessionId })
          : buildScrumItem(item, { _incomingType, initialStatus, _resolvedParentId, _parentSprint, nowTs, sessionId });
        if (_isIncomingIncident) {
          _pendingNewIncidents.push(_newItemObj);
        } else {
          getItems().push(_newItemObj);
        }
        _blogLog('ckpt-creado', item.code, item.title || '', 'backlog');
        changed = true;

        // B-202606-017 AC-1+AC-2: transición automática del R padre si el nuevo T/B nace con status != pendiente
        // TKT1 (REQ-202607-021): _syncParentRStatus reemplaza a _checkAndAdvanceParentR — fuente única
        if (initialStatus !== 'pendiente') {
          _syncParentRStatus(item.code, initialStatus);
        }

        // R-[pendiente-ID]: si el nuevo ítem tiene origin → cerrar automáticamente el P padre
        if (item.origin) {
          const pParent = getItems().find(p => p.code === item.origin);
          if (pParent && pParent.status !== 'done') {
            pParent.status = 'done';
            pParent.doneAt = pParent.doneAt || nowTs;
            pParent.statusChangedAt = nowTs;
            pParent.discardRef = item.code;
            _blogLog('ckpt-promovido', item.origin, item.origin + ' → ' + item.code, 'backlog');
          }
        }
      }
      // B-202604-198: si el ítem nace con status done en el mismo CHECKPOINT → grupo propio
      const initialStatusForGroup = item.status || 'pendiente'; // T-202606-034: item.status ya canónico desde T1
      // INC-[pendiente-ID] (triggered_by INC-202607-004 — mismo módulo, gap distinto): el
      // objeto pusheado a created/createdAndClosed solo llevaba code/desc/_wasAssigned. El
      // panel de diff (locus-backlog-merge.js, _card/_parentHtml) lee i.parent/i.sprint/
      // i.type/i.dependsOn sobre estos objetos — todos undefined, "Parent: Sin parent" para
      // todo ítem nuevo sin importar si parentId se resolvió bien vía slugMap (ya lo hace,
      // INC-202607-004). Fix: propagar parentId/sprint/type/dependsOn ya normalizados en
      // item — sin volver a resolver nada, solo dejar de perder el dato entre el merge y el render.
      if (initialStatusForGroup === 'done') {
        createdAndClosed.push({ code: item.code, desc: item.title, _wasAssigned: isNew, parent: item.parentId || null, sprint: item.sprint || '', type: itemKind(item), dependsOn: Array.isArray(item.dependsOn) ? item.dependsOn : [] });
      } else {
        created.push({ code: item.code, desc: item.title, _wasAssigned: isNew, parent: item.parentId || null, sprint: item.sprint || '', type: itemKind(item), dependsOn: Array.isArray(item.dependsOn) ? item.dependsOn : [] });
      }
    }
    // Actualizar contadores en backlog-meta (no en dryRun)
    if (!_dryRun) {
      const typeKey = itemKind(item);
      if (typeKey && ['REQ','TKT','DISC','INC'].includes(typeKey)) {
        const numMatch = item.code.match(/(?:REQ|TKT|DISC|INC)-\d{6}-(\d{3})/);
        if (numMatch) {
          const num = parseInt(numMatch[1]);
          const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
          if (!meta.counters) meta.counters = { DISC:0, TKT:0, REQ:0, INC:0 };
          if (num > (meta.counters[typeKey] || 0)) {
            meta.counters[typeKey] = num;
            localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
          }
        }
      }
    }
  });

  // INC-[pendiente-ID] (fix undo/redo ITIL, TKT1): flush único de ITIL nuevos del batch —
  // _setIncidents() dispara _undoSnapshotIncidents() una sola vez aquí, no una vez por ítem.
  if (!_dryRun && _pendingNewIncidents.length) _setIncidents(_pendingNewIncidents);

  if (!_dryRun && changed) {
    saveBacklog(); // B-202605-007: _undoSnapshotItems() movido antes del forEach
    _setBacklogModified();
    renderStats(); // siempre actualizar stat bar aunque no estemos en tab Backlog
    // T-202606-093 AC-3: badges de Icebox/Hotfix/Histórico se actualizan sin importar
    // el tab activo — independiente del guard getCurrentTab() === 'backlog' de abajo
    _updateSubtabBadges();
    if (getCurrentTab() === 'backlog') { _markBacklogListDirty(); renderBacklogList(); updateBacklogBanner(); }
  }
  return { created, advanced, retroceso, discarded, updated, ignored, createdAndClosed, tmpSuggestions, invalidTransition, slugMap: _slugMap, refIdTitleMap: _refIdTitleMap }; // T-[pendiente-ID]: invalidTransition poblado pre-clasificación · B-202606-022: slugMap para resolución de [tmp:slug] en applyPatchesFromTG · TKT1 (REQ-[pendiente-ID] · CAEL-04): refIdTitleMap expuesto — ya se construía internamente (L2056) para normalizar parentId/triggeredBy/origenDisc/promovida_a/dependsOn, pero nunca salía de esta función. applyPatchesFromTG lo necesita para resolver patch.code cuando llega como {ref_id,title} o [tmp:REF_ID]
}




// T-202606-034: _tgStatusToBacklog y _normalizeStatus eliminadas — item.status llega canónico desde locus-session-parse.js (_canonicalStatus)

// T-202605-083: _staleness — punto único de cálculo de días de estancamiento para staleness-pill
// Retorna objeto { days, modifier, label } si el pill debe renderizar, null si no aplica.
// Gate: _hasRecentSession debe retornar false (ítem sin sesión reciente).
// Modificadores: fresh (≤3d) · warn (4–7d) · stale (>7d).
// Si statusChangedAt y createdAt son ambos null/undefined → retorna null (sin crash, sin valor inventado).
function _staleness(item) {
  if (!item || item.status !== 'pendiente') return null;
  if (!item.sprint || item.sprint === 'n/a') return null;
  if (!item.createdAt) return null;
  if (_hasRecentSession(item)) return null;
  const _refTs = item.statusChangedAt || item.createdAt;
  if (!_refTs) return null;
  const days = Math.floor((Date.now() - _refTs) / 86400000);
  const modifier = days <= 3 ? 'fresh' : days <= 7 ? 'warn' : 'stale';
  const label = days === 0 ? 'hoy' : days === 1 ? '1d' : days + 'd';
  return { days, modifier, label };
}

// R-202604-091: decorador de actividad — pendiente con sesión vinculada en los últimos 7 días
const _ACTIVE_RECENT_DAYS = 7;
function _isActiveRecently(item) {
  if (!item || item.status !== 'pendiente') return false;

  const allSessions = getAllSessions();
  let lastTs = 0;
  allSessions.forEach(s => {
    if ((s.backlogRefs || s.trackerRefs || []).includes(item.code)) {
      const ts = s.savedAt || s.createdAt || 0;
      // R-202605-041: excluir sesiones anteriores al createdAt del ítem
      // Ítems legacy sin createdAt → comportamiento anterior sin cambio
      if (item.createdAt && ts < item.createdAt) return;
      if (ts > lastTs) lastTs = ts;
    }
  });
  if (!lastTs) return false;
  return (Date.now() - lastTs) / 86400000 <= _ACTIVE_RECENT_DAYS;
}


// B-202606-014: helper de transición automática del R padre tras cambio de status en T/B.
// Implementa las transiciones declaradas en BR-Ecosystem §5 (gestionadas por Locus):
//   - primer T hijo != pendiente  → R: pendiente → en-proceso
//   - último T hijo done          → R: en-proceso → en-revision
//   - T hijo retrocede desde done → R: en-revision → en-proceso (AC-2 simétrico)
// Solo aplica cuando el ítem modificado tiene parentId y su parent es tipo R.
// AC-3: ítems sin parentId → no-op.
// nowTs: timestamp para statusChangedAt del R.
// TKT1 (REQ-202607-021): _checkAndAdvanceParentR eliminada — duplicaba _syncParentRStatus
// (locus-backlog-core.js) con criterio divergente. Toda transición automática de R padre
// vía CHECKPOINT ahora pasa por _syncParentRStatus, importada de core.js. Ver invariant
// de consolidación declarado junto a esa función.

// T-202606-017: helper de transición a orphaned del R padre cuando todos sus Ts hijos quedan descartados.
// AC-1: invocado tras marcar un T/B hijo como 'descartado' — si todos los hijos (T/B) del R
//   están en 'descartado', el R pasa a status:'orphaned'.
// AC-3: si al menos un T/B hijo no está descartado → no-op, el R conserva su status actual.
// AC-4: al transicionar, registra en _blogLog el mensaje canónico.
// Solo aplica cuando el ítem modificado tiene parentId y su parent es tipo R.
// nowTs: timestamp para statusChangedAt del R.
// TKT1 (REQ CAEL-0720-01): delega la decisión a _computeRStatusFromChildren (locus-backlog-core.js)
// — misma función que _syncParentRStatus. Refinamiento declarado sobre el comportamiento
// anterior: antes no había guard de done/bloqueado/descartado en este helper (solo lo tenía
// _syncParentRStatus); _computeRStatusFromChildren lo aplica de forma uniforme — un REQ ya
// terminal nunca se orphanea por este mecanismo, consistente con BR-Core §4 ("done y bloqueado
// nunca se derivan de los hijos"). AC-3 (al menos un hijo no descartado → sin cambio) y el
// guard "ya orphaned → no duplicar" siguen cubiertos por la función pura (retorna null en
// ambos casos).
export function _checkAndOrphanParentR(childCode, nowTs) {
  const allItems = typeof getItems() !== 'undefined' ? getItems() : [];
  const child = allItems.find(i => i.code === childCode);
  if (!child || !child.parentId) return; // sin parent → no-op

  const parent = allItems.find(i => i.code === child.parentId);
  if (!parent || itemKind(parent) !== 'REQ') return; // parent debe ser REQ

  // TKT2 (REQ CAEL-0720-10): Hijos del REQ — solo TKT (__BR-Ecosystem §5). El filtro previo
  // incluía INC pese a que `allItems` (= getItems()) nunca contiene INCIDENTS — ese branch
  // ya era inalcanzable, pero se limpia igual: si un futuro fix iguala este call site a
  // `_syncParentRStatus`/self-heal de render concatenando getIncidents(), el widen revivía
  // sin que nadie lo decidiera de nuevo. Incluye descartados, _computeRStatusFromChildren los filtra.
  const children = allItems.filter(i =>
    i.parentId === parent.code &&
    itemKind(i) === 'TKT'
  );
  if (!children.length) return; // sin hijos declarados → no-op (gate de parser cubre REQ sin TKT al ingestar)

  const nextStatus = _computeRStatusFromChildren(parent.status, children.map(i => i.status));
  if (nextStatus !== 'orphaned') return; // no todos descartados, o ya orphaned, o REQ terminal

  parent.status = 'orphaned';
  parent.orphaned = true;
  parent.statusChangedAt = nowTs;
  _blogLog('r-orphaned', parent.code,
    'R ' + parent.code + ' en orphaned — todos los Ts descartados. Cael puede re-especificar o descartar', 'backlog');
}

// R-202605-062: applyPatchesFromTG — aplica patches de campo individual sobre ítems existentes
// AC-1: type: "patch" es instrucción de operación — no tipo de ítem
// AC-2: solo requiere code + campos a patchear
// AC-3 (TKT-202607-008 · modelo lista negra, __BR-Ecosystem §8 infra_version 33): todo campo
//   del patch es patcheable por default — salvo los declarados en _PATCH_NON_PATCHEABLE. Un
//   campo nuevo del schema (REQ/TKT) es patcheable automáticamente sin requerir habilitación
//   explícita en este Set. Reemplaza el modelo whitelist anterior (_PATCH_ALLOWED_FIELDS,
//   eliminada en este TKT).
// AC-3b: campos no patcheables (code, type, schema_version, ref_id, intencion, kill_criteria)
//   → advertencia DocLog, sin crash. Los tres últimos agregados en TKT-202607-008 — antes solo
//   code/type/schema_version estaban en la lista.
// AC-4: ac presente → reemplaza array completo
// AC-5: código no existe en backlog → advertencia DocLog, sin crash
// AC-6: código placeholder → ignorado (manejado en parsePaste antes de llegar aquí)
// AC-7: status done → mismas reglas de confirmación que done manual (vía setItemStatus)
// AC-8: mezcla ítems + patches en mismo ---getItems()--- → parser separa por type
// AC-9: panel diff muestra solo campos del patch (changes array)
// AC-11: sin regresión en mergeBacklogFromTG
const _PATCH_NON_PATCHEABLE = new Set(['code', 'type', 'schema_version', 'ref_id', 'intencion', 'kill_criteria']); // TKT-202607-008: ref_id/intencion/kill_criteria agregados — modelo lista negra, __BR-Ecosystem §8 infra_version 33. code/type/schema_version son identidad del ítem — no cambian sin re-emisión. ref_id es exclusivo del CHECKPOINT de creación — sin función posterior. intencion/kill_criteria requieren Pausa de Ciclo o sesión explícita con el founder, nunca patch silencioso.

export function applyPatchesFromTG(patches, sessionId, opts) {
  if (!patches || !patches.length) return { patched: [], ignored: [] };

  // B-202606-022: slugMap pasado desde mergeBacklogFromTG via llamador — resuelve [tmp:slug] en parentId
  const _slugMap = (opts && opts.slugMap instanceof Map) ? opts.slugMap : null;

  // TKT1 (REQ-[pendiente-ID] · CAEL-04): refIdTitleMap pasado desde mergeBacklogFromTG — mismo
  // mapa refId→title que _normalizeRefIdValue usa internamente en esa función. Ausente en
  // callers que no lo propaguen todavía (opts.refIdTitleMap === undefined) → comportamiento
  // idéntico al actual: patch.code con ref_id/tmp:slug no se resuelve, cae en 'no-existe'.
  const _refIdTitleMap = (opts && opts.refIdTitleMap instanceof Map) ? opts.refIdTitleMap : null;

  // B-202606-100: role del header del CHECKPOINT — único contexto que autoriza
  // la transición R → done dentro de un patch. Simétrico al guard ya existente
  // para R → bloqueado en locus-session-parse.js (T-202606-080/022).
  const _ckptHeaderRole = (opts && typeof opts.ckptHeaderRole === 'string') ? opts.ckptHeaderRole : '';

  const patched = [];
  const ignoredPatches = [];

  _undoSnapshotItems();
  // INC-[pendiente-ID] TKT2 (triggered_by REQ-202607-022): existing (getAnyItem) se muta
  // field-by-field in-place más abajo — para INC/PRB/KE/CHG eso es mutación directa sobre
  // INCIDENTS que nunca pasa por _setIncidents(). Enrutar por el setter después de mutar
  // snapshotearía el estado ya mutado, no el previo — inútil para undo. El snapshot explícito
  // aquí, antes de cualquier mutación del batch, es la única forma correcta dado que la lógica
  // de aplicación de campos no puede diferirse sin reescribir cada rama de field.
  // TKT3 (deuda detectada por Finn en QA de TKT2): el snapshot se disparaba incondicionalmente
  // aunque el batch no trajera ningún patch ITIL — limpiaba _redoStackIncidents como side-effect
  // de un patch puramente Scrum (REQ/TKT), sin relación con INCIDENTS. Pre-scan sobre
  // getAnyItem(patch.code) antes de mutar nada — mismo momento que el snapshot de arriba, solo
  // condicionado a que exista al menos un patch cuyo ítem existente sea ITIL. Mismo criterio de
  // gating que mergeBacklogFromTG() ya aplica vía _pendingNewIncidents.length en el flush.
  const _hasItilPatch = patches.some(p => {
    const _existingForScan = getAnyItem(p.code);
    return _existingForScan && INCIDENT_TYPES.includes(itemKind(_existingForScan));
  });
  if (_hasItilPatch) _undoSnapshotIncidents();

  // DISC cerrada (auditoría de triggeredBy/origenDisc/dependsOn en patches, triggered_by
  // INC-202607 parentId): confirmado el mismo gap en los tres campos — ninguno tenía
  // normalización de {ref_id,title} NI resolución de slugMap dentro de applyPatchesFromTG (a
  // diferencia de parentId, que sí tenía resolución de slugMap para strings, solo le faltaba el
  // guardrail de objeto). Helper único — reemplaza el bloque ad-hoc que solo cubría parentId,
  // mismo criterio de guardrail que _normalizeRefIdValue en mergeBacklogFromTG (L2100): title
  // debe coincidir exactamente con el declarante o se bloquea con null + DocLog. Retorna
  // `undefined` cuando el valor debe descartarse (sin declarante, title-mismatch, o placeholder
  // sin entrada en slugMap) — el caller decide si eso implica `delete` del campo en el patch.
  function _resolvePatchRefValue(val, fieldLabel, patchCode) {
    if (val && typeof val === 'object' && !Array.isArray(val) && val.ref_id) {
      const _refId = val.ref_id;
      const _declaredTitle = _refIdTitleMap ? _refIdTitleMap.get(_refId) : undefined;
      if (_declaredTitle === undefined) {
        _blogLog('ref-id-sin-declarante', patchCode || '[sin-código]',
          `ref_id ${_refId} referenciado en ${fieldLabel} de patch sin ítem declarante en este bloque — pegar el bloque completo.`,
          'backlog');
        return undefined;
      }
      if (_declaredTitle !== (val.title || '')) {
        _blogLog('ref-id-title-mismatch', patchCode || '[sin-código]',
          `ref_id ${_refId} en ${fieldLabel} de patch no coincide con title declarado — resolución bloqueada.`,
          'backlog');
        return undefined;
      }
      val = `[tmp:${_refId}]`;
    }
    if (_slugMap && val && _isPlaceholderCode(val)) {
      const resolved = _slugMap.get(val);
      if (resolved && !_isPlaceholderCode(resolved)) return resolved;
      if (!resolved) {
        _blogLog('patch-ref-slug-no-resuelto', patchCode || '[sin-código]',
          fieldLabel + ': ' + val + ' no encontrado en slugMap — campo ignorado', 'backlog');
        return undefined;
      }
    }
    return val;
  }

  patches.forEach(patch => {
    // B-202605-016: normalizar campo parent (schema CHECKPOINT) → parentId (campo interno)
    // T-[pendiente-ID] (REQ-unify-parent TKT2): eliminar patch.parent tras normalizar — el campo
    // interno es parentId, no parent. TKT-202607-008 (modelo lista negra): sin este delete,
    // patch.parent sobreviviría al Object.keys(patch) del loop de aplicación y se escribiría
    // como existing.parent — campo que ningún consumidor del ítem lee. El delete sigue siendo
    // obligatorio bajo el modelo nuevo, no solo higiene de campo legacy.
    if (patch.parent) { if (!patch.parentId) patch.parentId = patch.parent; delete patch.parent; }

    // INC-202607-XXX (triggered_by TKT-202607-029/030) + DISC de auditoría cerrada: parentId,
    // triggeredBy, origenDisc y dependsOn (array) resueltos con el mismo helper — antes solo
    // parentId tenía resolución parcial (slugMap para strings, sin guardrail de objeto); los
    // otros tres no tenían ninguna de las dos. Un patch de reparenteo o de trazabilidad
    // (triggered_by/origen_disc) usando ref_id ahora resuelve igual que parentId/code/promovida_a.
    ['parentId', 'triggeredBy', 'origenDisc'].forEach(_f => {
      if (patch[_f] !== undefined) {
        const _resolved = _resolvePatchRefValue(patch[_f], _f, patch.code);
        if (_resolved === undefined) delete patch[_f]; else patch[_f] = _resolved;
      }
    });
    if (Array.isArray(patch.dependsOn)) {
      patch.dependsOn = patch.dependsOn
        .map(v => _resolvePatchRefValue(v, 'dependsOn', patch.code))
        .filter(v => v !== undefined);
    }

    // TKT1 (REQ-[pendiente-ID] · CAEL-04): resolver patch.code cuando llega como {ref_id,title}
    // (objeto) o ya normalizado a '[tmp:REF_ID]' (string) — mismo criterio de guardrail que
    // _normalizeRefIdValue en mergeBacklogFromTG (title debe coincidir exactamente con el
    // declarante), seguido de la misma resolución de slugMap que ya usa parentId (L2796-2806).
    // Antes de este fix, un code objeto nunca matcheaba _isPlaceholderCode (regex sobre string)
    // y un code '[tmp:REF_ID]' sin esta resolución nunca llegaba a slugMap — ambos caían
    // silenciosamente en 'código no existe en el backlog' más abajo.
    if (patch.code && typeof patch.code === 'object' && !Array.isArray(patch.code) && patch.code.ref_id) {
      const _refId = patch.code.ref_id;
      const _declaredTitle = _refIdTitleMap ? _refIdTitleMap.get(_refId) : undefined;
      if (_declaredTitle === undefined) {
        _blogLog('ref-id-sin-declarante', '[sin-código]',
          `ref_id ${_refId} referenciado en code de patch sin ítem declarante en este bloque — pegar el bloque completo.`,
          'backlog');
        ignoredPatches.push({ code: patch.code, reason: 'ref-id-sin-declarante' });
        return;
      }
      if (_declaredTitle !== (patch.code.title || '')) {
        _blogLog('ref-id-title-mismatch', '[sin-código]',
          `ref_id ${_refId} en code de patch no coincide con title declarado — resolución bloqueada.`,
          'backlog');
        ignoredPatches.push({ code: patch.code, reason: 'ref-id-title-mismatch' });
        return;
      }
      patch.code = `[tmp:${_refId}]`;
    }
    if (_slugMap && patch.code && _isPlaceholderCode(patch.code)) {
      const _resolvedCode = _slugMap.get(patch.code);
      if (_resolvedCode && !_isPlaceholderCode(_resolvedCode)) {
        patch.code = _resolvedCode;
      }
      // si no resuelve, patch.code queda como placeholder — cae en la rama 'no-existe' de abajo,
      // mismo comportamiento que ya tenía cualquier placeholder sin slugMap disponible.
    }

    const code = patch.code;

    // AC-5: código no existe en backlog → advertencia DocLog
    // INC-[pendiente-ID] (fix creación/lookup ITIL): getAnyItem() en vez de getItems().find() —
    // un patch sobre un INC/PRB/KE/CHG (código real, vive en INCIDENTS desde el fix de creación
    // de este mismo INC) se ignoraba antes como "código no existe en el backlog".
    const existing = getAnyItem(code) || null;
    if (!existing) {
              _blogLog('patch-ignorado', code, 'Patch ignorado: código no existe en el backlog. code: ' + code, 'backlog');
      ignoredPatches.push({ code, reason: 'no-existe' });
      return;
    }

    // AC-3b: advertir sobre campos no patcheables presentes en el objeto patch
    // TKT-202607-012: 'code' se excluye de esta advertencia — es el identificador de ruteo
    // usado para el lookup de getAnyItem(code) más arriba, siempre presente en todo objeto
    // patch por construcción, no un intento de modificar un campo no patcheable. Sigue en
    // _PATCH_NON_PATCHEABLE (no se aplica como campo de datos, ver loop de aplicación abajo)
    // pero deja de generar el ruido 'Campo no patcheable ignorado: code' en cada patch.
    Object.keys(patch).forEach(k => {
      if (k === 'code') return;
      if (_PATCH_NON_PATCHEABLE.has(k)) {
        _blogLog('patch-campo-ignorado', code, 'Campo no patcheable ignorado: ' + k, 'backlog');
      }
    });

    const changes = [];
    const nowTs = Date.now();

    // TKT-202607-008: modelo lista negra — iterar sobre las keys del patch entrante en vez del
    // Set fijo _PATCH_ALLOWED_FIELDS (eliminado). Un campo en _PATCH_NON_PATCHEABLE ya generó su
    // advertencia DocLog arriba — aquí simplemente no se aplica. Cualquier otro campo presente en
    // el patch es patcheable por default, incluidos campos nuevos del schema no listados abajo —
    // caen en el bloque genérico al final de este forEach.
    Object.keys(patch).forEach(field => {
      if (_PATCH_NON_PATCHEABLE.has(field)) return; // ya advertido — no aplicar
      const incoming = patch[field];
      const current  = existing[field];

      if (field === 'status') {
        const normalized = incoming; // T-202606-034: incoming ya canónico desde parser — _normalizeStatus eliminada
        if (normalized !== existing.status) {
          const _prevStatus = existing.status;
          if (normalized === 'done') {
            // B-202606-100: un REQ nunca puede ir a done excepto vía patch dentro de
            // un CHECKPOINT con role: 'QA · Finn' — la fila en Postgres lo permite
            // (chk_status_by_type actualizado) pero el origen del cambio debe ser
            // siempre una sesión de cierre de Finn, nunca UI manual ni otro rol.
            // Simétrico al guard de REQ → bloqueado (T-202606-080/022).
            if (itemKind(existing) === 'REQ') {
              const _authorizedRole = 'QA · Finn';
              if (_ckptHeaderRole !== _authorizedRole) {
                _blogLog(
                  'rol-no-autorizado-done',
                  code,
                  `Transición done en REQ ${code} rechazada: solo Finn puede cerrar un REQ, vía sesión de cierre. Rol resuelto: "${_ckptHeaderRole}".`,
                  'backlog'
                );
                ignoredPatches.push({ code, reason: 'rol-no-autorizado-done' });
                return;
              }
            }
            // B-202605-XXX: patch programático → _applyDoneStatus directo, sin modal inline
            // setItemStatus dispara _showInlineConfirmDone para ítems en sprint activo,
            // lo que requiere interacción del usuario y cancela el patch silenciosamente.
            // B-202606-100: authorized=true solo aquí — el guard de rol ya corrió arriba
            // para type REQ. Para TKT/INC no aplica restricción de rol, authorized es irrelevante.
            // TKT1 (REQ-202607-021): llamada externa a _checkAndAdvanceParentR eliminada —
            // _applyDoneStatus ahora sincroniza el R padre internamente (ver core.js). Repetirla
            // aquí sería redundante (aunque inocuo por idempotencia) — se elimina para que la
            // responsabilidad de sincronizar viva en un solo lugar, no en el caller.
            _applyDoneStatus(existing.code, true);
            changes.push({ field: 'status', from: _prevStatus, to: normalized });
          } else if (normalized && normalized !== existing.status) {
            changes.push({ field: 'status', from: existing.status, to: normalized });
            existing.status = normalized;
            existing.statusChangedAt = nowTs;
            // B-202606-014 AC-2: transición automática del REQ padre tras cambio de status no-done
            // cubre retroceso desde done (en-revision → en-proceso) y avance a en-revision
            // TKT1 (REQ-202607-021): _syncParentRStatus reemplaza a _checkAndAdvanceParentR
            _syncParentRStatus(existing.code, normalized);
          }
        } else if (normalized === 'done' && existing.parentId) {
          // INC-[pendiente-ID] (fix idempotencia): un patch status:done sobre un ítem que YA
          // estaba done no entraba nunca al bloque de arriba — la sincronización del R padre
          // nunca se re-evaluaba para ese ingest. Si este era el último hijo pendiente de
          // considerar (ej. re-envío del mismo patch en un CHECKPOINT posterior, o dos
          // CHECKPOINTs distintos tocando el mismo TKT), el REQ padre se quedaba sin la
          // transición automática pese a que todos sus hijos ya estaban done. Re-evaluar
          // siempre que el ítem tenga parent, sin mutar nada más — mismo criterio idempotente.
          // No delega a _applyDoneStatus porque esa función early-return si el ítem ya está
          // done — necesita la llamada directa a _syncParentRStatus (no-op si el REQ ya está
          // en-revision/done/bloqueado).
          // TKT1 (REQ-202607-021): _syncParentRStatus reemplaza a _checkAndAdvanceParentR
          _syncParentRStatus(existing.code, 'done');
        }
        return;
      }

      if (field === 'incidentStatus') {
        // INC-[pendiente-ID]: incidentStatus solo aplica a tipos ITIL — no-op silencioso en el resto
        const _patchItilKind = itemKind(existing);
        if (!['INC', 'PRB', 'KE'].includes(_patchItilKind)) return;
        if (incoming && incoming !== existing.incidentStatus) {
          // TKT1 (REQ CAEL-01): _patchItilKind pasado como itilType — antes siempre validaba
          // contra la tabla de INC, sin distinguir PRB/KE.
          const _itResult = validateIncidentTransitions(existing.incidentStatus, incoming, _patchItilKind);
          if (!_itResult.valid) {
            _blogLog('patch-incidentstatus-invalido', code, 'Transición incidentStatus rechazada vía patch: ' + _itResult.reason, 'backlog');
            return;
          }
          // TKT3 (REQ CAEL-01): resolution_type obligatorio en INC al pasar a resolved — BR-Ecosystem §5.
          // Se lee del objeto `patch` completo (no de `incoming`/`current` de este field) porque el
          // orden de Object.keys(patch) no garantiza que resolutionType ya se haya procesado antes
          // que incidentStatus. Solo aplica a INC — PRB/KE no declaran resolutionType.
          if (_patchItilKind === 'INC' && incoming === 'resolved') {
            const _resolutionType = patch.resolutionType || existing.resolutionType;
            if (!_resolutionType) {
              _blogLog('patch-incidentstatus-invalido', code, 'resolution_type obligatorio al pasar a resolved (BR-Ecosystem §5)', 'backlog');
              // `invalidTransition` no está en scope de esta función (exclusivo de mergeBacklogFromTG,
              // ver L2120) — se usa `ignoredPatches`, mismo patrón ya usado en esta función para
              // el guard de rol-no-autorizado-done (L2858).
              ignoredPatches.push({ code, reason: 'resolution-type-obligatorio' });
              return;
            }
          }
          changes.push({ field: 'incidentStatus', from: existing.incidentStatus || '—', to: incoming });
          // Mirror a status — mismo motivo que en mergeBacklogFromTG: sin este espejo, existing.status
          // queda congelado en el valor con el que el ítem nació y chk_status_by_type sigue rechazando
          // el upsert indefinidamente, incluso tras patchear incidentStatus correctamente.
          existing.incidentStatus = incoming;
          existing.status = incoming;
          existing.statusChangedAt = nowTs;
          // TKT3: si el patch trae resolutionType junto con incidentStatus:resolved, aplicarlo aquí —
          // el bloque genérico de campos patcheables (abajo) también lo procesaría, pero fijarlo ya
          // evita que un lector intermedio del mismo forEach vea el ítem resuelto sin resolutionType.
          if (patch.resolutionType && patch.resolutionType !== existing.resolutionType) {
            existing.resolutionType = patch.resolutionType;
          }
        }
        return;
      }

      if (field === 'ac') {
        // AC-4: ac reemplaza array completo
        if (Array.isArray(incoming)) {
          changes.push({ field: 'ac', from: existing.ac || [], to: incoming });
          existing.ac = incoming;
        }
        return;
      }

      if (field === 'sprint') {
        // Sprint: aplicar _normalizeSprint sobre objeto temporal para normalizar centinelas
        const tempItem = { sprint: incoming };
        _normalizeSprint(tempItem);
        const normalizedSprint = tempItem.sprint; // undefined si centinela, valor si válido
        if (normalizedSprint !== current) {
          changes.push({ field: 'sprint', from: current || '—', to: normalizedSprint });
          if (normalizedSprint === undefined) delete existing.sprint;
          else existing.sprint = normalizedSprint;
          // B-202606-025 AC-1: si el ítem patcheado es un REQ, propagar sprint a todos sus hijos TKT e INC
          // [tmp:tkt-unify-sprint-inherit]: propagación delegada a _inheritSprintToChildren —
          // misma función que usa setItemSprint() (locus-backlog-sprints.js). Sin duplicación.
          if (itemKind(existing) === 'REQ' && normalizedSprint !== undefined) {
            _inheritSprintToChildren(existing, normalizedSprint || '');
          }
        }
        return;
      }

      // Resto de campos patcheables: title, priority, effort, area, role, origenDisc, draft,
      // verified_by (TKT2 REQ-202607-026 — ninguno de los dos requiere normalización propia;
      // incoming:false para draft pasa el guard porque solo excluye undefined/null, no false)
      // T-202605-137: promovida_a — campo especial: al patchear en una P, escribir origenDisc en el destino
      // T-202606-019: si promovida_a es placeholder → intentar resolver contra getItems() (ítems recién ingresados)
      if (field === 'promovida_a') {
        // CHG (triggered_by INC CAEL-03): normalizar incoming cuando llega como {ref_id,title} —
        // mismo criterio de guardrail que la resolución de patch.code (L2814-2839). Sin esto, un
        // objeto {ref_id,title} nunca matcheaba _isPlaceholderCode (regex sobre string) y quedaba
        // crudo en existing.promovida_a — visible tal cual en el badge "↗ promovida" de la UI.
        let _promovidaIncoming = incoming;
        if (_promovidaIncoming && typeof _promovidaIncoming === 'object' && !Array.isArray(_promovidaIncoming) && _promovidaIncoming.ref_id) {
          const _refId = _promovidaIncoming.ref_id;
          const _declaredTitle = _refIdTitleMap ? _refIdTitleMap.get(_refId) : undefined;
          if (_declaredTitle === undefined) {
            _blogLog('ref-id-sin-declarante', existing.code,
              `ref_id ${_refId} referenciado en promovida_a de patch sin ítem declarante en este bloque — pegar el bloque completo.`,
              'backlog');
            _promovidaIncoming = null;
          } else if (_declaredTitle !== (_promovidaIncoming.title || '')) {
            _blogLog('ref-id-title-mismatch', existing.code,
              `ref_id ${_refId} en promovida_a de patch no coincide con title declarado — resolución bloqueada.`,
              'backlog');
            _promovidaIncoming = null;
          } else {
            _promovidaIncoming = `[tmp:${_refId}]`;
          }
        }
        if (_promovidaIncoming !== undefined && _promovidaIncoming !== null && _promovidaIncoming !== current) {
          let resolvedIncoming = _promovidaIncoming;
          // T-202606-019 AC1: resolver placeholder contra ítems ya en getItems()
          // mergeBacklogFromTG corre antes de applyPatchesFromTG — los ítems nuevos ya tienen código real
          if (_isPlaceholderCode(_promovidaIncoming) && typeof getItems() !== 'undefined') {
            // Buscar ítem recién creado cuyo origenDisc apunta a esta P, o cuyo código es real y fue
            // creado en este CHECKPOINT (no tiene origenDisc aún pero puede inferirse si solo hay un candidato)
            const candidates = getItems().filter(i =>
              !_isPlaceholderCode(i.code) &&
              (i.origenDisc === existing.code || (!i.origenDisc && i.code !== existing.code))
            );
            // Preferir candidato con origenDisc ya escrito (resolución determinista)
            const withOrigenDisc = candidates.find(i => i.origenDisc === existing.code);
            if (withOrigenDisc) {
              resolvedIncoming = withOrigenDisc.code;
            } else {
              // No resoluble con certeza — conservar placeholder + advertencia
              _blogLog('promovida-a-placeholder-en-patch', existing.code,
                'promovida_a en patch contiene placeholder ' + _promovidaIncoming + ' — no resoluble en applyPatchesFromTG. Usar código real en el patch.',
                'backlog');
            }
          }
          changes.push({ field, from: current !== undefined ? current : '—', to: resolvedIncoming });
          existing[field] = resolvedIncoming;
          // AC edge case: si promovida_a apunta a código real existente, escribir origenDisc en el destino
          // TKT-202607-057 (REQ-202607-015 · TKT4): getAnyItem() — resolvedIncoming puede ser un código
          // ITIL (INC/PRB/KE/CHG), que vive en INCIDENTS y getItems().find() nunca lo encuentra.
          if (!_isPlaceholderCode(resolvedIncoming)) {
            const destItem = getAnyItem(resolvedIncoming);
            if (destItem && !destItem.origenDisc) {
              destItem.origenDisc = existing.code;
              _blogLog('origen-disc-escrito', existing.code, existing.code + ' → origenDisc en ' + resolvedIncoming, 'backlog');
            }
          }
        }
        return;
      }
      // TKT-202607-100 (REQ-202607-027 · TKT4 · AC1): draft — al transicionar de true a false,
      // marcar statusChangedAt. Sin esto, _zoneStaleness (locus-backlog-zone-engine.js) sigue
      // usando createdAt como referencia — un ítem que pasó 20 días en draft:true dispararía
      // alerta de estancamiento inmediata al volverse visible, en vez de arrancar su reloj en
      // el momento del aval. Transición false→true (no ocurre en el flujo actual, Fase 5 solo
      // avanza en un sentido) no toca statusChangedAt — fuera de scope de este AC.
      if (field === 'draft') {
        if (incoming !== undefined && incoming !== null && incoming !== current) {
          changes.push({ field, from: current !== undefined ? current : '—', to: incoming });
          existing.draft = incoming;
          if (current === true && incoming === false) {
            existing.statusChangedAt = nowTs;
          }
        }
        return;
      }
      // T-202606-025: discard_reason — persiste en cualquier tipo con status descartado
      if (field === 'discard_reason') {
        const _targetStatus = existing.status;
        // AC-3: si el ítem no tiene status descartado → ignorar silenciosamente
        if (_targetStatus !== 'descartado') return;
        if (incoming !== undefined && incoming !== null && incoming !== current) {
          const _VALID_DISCARD_REASONS = new Set(['duplicado', 'fuera de alcance', 'reemplazado', 'obsoleto']);
          if (!_VALID_DISCARD_REASONS.has(incoming)) {
            _blogLog('discard-reason-no-canonico', code, 'discard_reason con valor no canónico: ' + incoming, 'backlog');
          }
          changes.push({ field, from: current !== undefined ? current : '—', to: incoming });
          existing[field] = incoming;
        }
        return;
      }
      // TKT-202607-INC-NAMING: __BR-Ecosystem §8 — "priority es no-op silencioso en ítems
      // INC/PRB/KE/CHG — esos tipos no declaran ese campo. Para repriorizar un INC usar
      // sla_priority." El bloque genérico de abajo no distinguía tipo — un patch con
      // priority sobre un INC lo aplicaba igual. No-op explícito agregado, sin log (silencioso
      // por spec — el patch no es un error, solo no aplica a este tipo de ítem).
      if (field === 'priority' && ['INC', 'PRB', 'KE', 'CHG'].includes(itemKind(existing))) {
        return;
      }
      // TKT3 (REQ CAEL-0720-1x): parentId exclusivo de TKT (__BR-Ecosystem §5) — mismo gate que
      // la rama de merge de ítems existentes en mergeBacklogFromTG. Sin este caso especial, un
      // type:patch con parentId sobre un INC/PRB/KE/CHG/DISC caía en el catch-all genérico de
      // abajo y lo aplicaba sin restricción de tipo — reabría el widen de mod:79 vía el
      // mecanismo oficial de actualización de ítems existentes.
      if (field === 'parentId' && itemKind(existing) !== 'TKT') {
        if (incoming !== undefined && incoming !== null) {
          _blogLog('parentId-ignorado', code, 'parentId ignorado en patch: ' + (itemKind(existing) || 'tipo desconocido') + ' no puede tener parent — solo TKT (__BR-Ecosystem §5). parentId recibido: ' + incoming, 'backlog');
        }
        return;
      }
      if (incoming !== undefined && incoming !== null && incoming !== current) {
        changes.push({ field, from: current !== undefined ? current : '—', to: incoming });
        existing[field] = incoming;
      }
    });

    if (changes.length) {
      // Registrar en history del ítem
      if (!existing.history) existing.history = [];
      changes.forEach(ch => {
        if (ch.field === 'status') return; // status lo registra setItemStatus
        existing.history.push({
          type: 'field',
          ts: nowTs,
          origin: 'patch',
          sessionId: sessionId || null,
          // TKT2 (REQ-202607-026): `ch.to || null` colapsaba false a null — inofensivo mientras
          // ningún campo patcheable era boolean, pero draft (agregado en este TKT) sí lo es.
          // Un patch draft:false habría quedado registrado en history como to:null, indistinguible
          // de "campo vaciado". Corregido a comparación explícita contra undefined.
          data: { field: ch.field, from: ch.from !== '—' ? ch.from : null, to: ch.to !== undefined ? ch.to : null }
        });
      });
      if (sessionId && existing.sessionId !== sessionId) existing.sessionId = sessionId;

      patched.push({
        code,
        desc: existing.title,
        changes,
        change: changes.map(c => c.field).join(' · ')
      });
    } else {
      ignoredPatches.push({ code, reason: 'sin-cambios' });
    }
  });

  // INC-[pendiente-ID] (fix — múltiples patches en un mismo CHECKPOINT: solo el primero
  // se aplicaba): saveBacklog() se llamaba dentro de este forEach, una vez por patch con
  // cambios — cada llamada disparaba un upsert completo de tracker_items (items.map(_toItemRow),
  // locus-storage.js) capturado en un instante distinto del loop síncrono, sin await entre
  // llamadas. N upserts concurrentes de la tabla completa, sin garantía de que el que complete
  // al final refleje el estado más reciente — race condition que revertía silenciosamente los
  // patches posteriores al primero. Fix: una sola llamada después de que el forEach completa
  // todas las mutaciones en memoria — el snapshot que se persiste ya incluye todos los patches
  // del batch, sin depender del orden de resolución de red.
  if (patched.length) saveBacklog();

  _markBacklogListDirty(); renderBacklogList();
  renderStats();

  return { patched, ignored: ignoredPatches };
}



// ---------------------------------------------------------------------------
// TKT-B2a: buildQIncItem() — builder de card propio para Q-INC
// No reutiliza buildBacklogItem: modelo de datos ITIL es distinto (incidentStatus,
// slaPriority, slaDeadline, comportamientoActual vs status/sprint/parentId).
// Exportada para consumo en locus-backlog-render.js (renderQIncPanel).
// AC: sin referencias a item.status, item.sprint, item.parentId dentro de la función.
// ---------------------------------------------------------------------------

export function buildQIncItem(item) {
  const type      = itemKind(item) || '';
  const typeLabel = TYPE_LABELS[type] || type || '—';
  const code      = item.code || item.id || '';

  // Badge incidentStatus — '—' si ausente, sin crash
  const incStatus    = incIncidentStatus(item) || '';
  const incStatusBadge = incStatus
    ? `<span class="qinc-badge qinc-badge--status">${esc(incStatus)}</span>`
    : `<span class="qinc-badge qinc-badge--status qinc-badge--empty">—</span>`;

  // Badge slaPriority — '—' si ausente, sin crash
  const slaPrio      = incSlaPriority(item) || '';
  const slaPrioBadge = slaPrio
    ? `<span class="qinc-badge qinc-badge--sla qinc-badge--sla-${slaPrio}">${esc(slaPrio)}</span>`
    : `<span class="qinc-badge qinc-badge--sla qinc-badge--empty">—</span>`;

  const slaDeadline  = item.slaDeadline || item.sla_deadline || null;

  // Clases SLA — mutuamente excluyentes (AC TKT-B2a AC4)
  // Fix inline (TKT1, triggered_by [tmp:tkt-countdown-sla]): la rama --sla-riesgo no
  // exigía slaPrio === 'high' — cualquier prioridad dentro de la ventana de 6h recibía
  // la clase a nivel de card. Corregido para exigir 'high', igual que ya exigía la rama
  // vencido. Calculado antes del countdown porque TKT1 lo consume abajo.
  let slaClass = '';
  if (slaDeadline) {
    if (slaPrio === 'high' && slaDeadline < Date.now()) {
      slaClass = 'qinc-item--sla-vencido';
    } else if (slaPrio === 'high' && slaDeadline >= Date.now() && slaDeadline < Date.now() + SLA_RIESGO_WINDOW_MS) {
      slaClass = 'qinc-item--sla-riesgo';
    }
  }

  // Countdown slaDeadline — solo si presente
  let slaCountdownHtml = '';
  if (slaDeadline) {
    const remaining = slaDeadline - Date.now();
    if (remaining < 0) {
      // Fix inline (TKT1): el modificador --vencido se aplicaba al span del countdown para
      // CUALQUIER prioridad con deadline pasado, sin gate de slaPrio — contradice AC4 (medium/low
      // sin --riesgo ni --vencido en el countdown). El texto "VENCIDO" se sigue mostrando para
      // medium/low (no_incluye de TKT1 no pide removerlo), pero sin el modificador visual --vencido.
      const vencidoClass = slaPrio === 'high' ? ' qinc-sla-countdown--vencido' : '';
      slaCountdownHtml = `<span class="qinc-sla-countdown${vencidoClass}">VENCIDO</span>`;
    } else {
      const hrs = Math.floor(remaining / 3600000);
      const min = Math.floor((remaining % 3600000) / 60000);
      // TKT1 AC1/AC2: --riesgo espeja exactamente slaClass — mismo umbral, ya gateado a 'high' arriba.
      const riesgoClass = slaClass === 'qinc-item--sla-riesgo' ? ' qinc-sla-countdown--riesgo' : '';
      slaCountdownHtml = `<span class="qinc-sla-countdown${riesgoClass}">${hrs}h ${min}m</span>`;
    }
  }

  // comportamientoActual expandible — togglable vía data-qi-action (AC TKT-B2a AC5)
  // Fix INC (Q-INC render audit, 2026-07-18): antes el contenido era su propio trigger,
  // pero CSS le aplicaba display:none por defecto — un elemento no renderizado no puede
  // recibir click ni foco, comportamiento_actual nunca era alcanzable. Ahora el trigger es
  // un <button> real y separado (activación por teclado nativa, sin keydown propio) que
  // controla el contenido vía aria-expanded/aria-controls — mismo patrón semántico que
  // .idp-section-toggle (locus-backlog-panel.js), CSS entregado por Nova (mod:102 de
  // locus-backlog.css).
  const comportamiento = incComportamientoActual(item) || '';
  const comportId = `qinc-comport-${esc(code)}`;
  const comportamientoHtml = comportamiento
    ? `<button type="button" class="qinc-item-comportamiento-toggle" data-qi-action="qi-toggle-comportamiento" aria-expanded="false" aria-controls="${comportId}">
    <span class="qinc-toggle-arrow">▸</span> Comportamiento actual
  </button>
  <div class="qinc-item-comportamiento" id="${comportId}">${esc(comportamiento)}</div>`
    : '';

  // Copy-code badge — patrón idéntico al Backlog principal (AC TKT-B2a AC2)
  const copyCodeHtml = `<span class="bitem-subline-code" data-action="copy-code" data-code="${esc(code)}" data-idx="-1" title="Click para copiar ID">${esc(code)}</span>`;

  return `
<div class="qinc-item ${slaClass}" data-code="${esc(code)}" data-type="${esc(type)}">
  <div class="qinc-item-header" data-qi-action="qi-open-panel" role="button" tabindex="0" aria-label="Abrir detalle de ${esc(code)}">
    <span class="qinc-type-badge qinc-type-badge--${type.toLowerCase()}" title="${esc(typeLabel)}">${esc(type)}</span>
    ${copyCodeHtml}
    <span class="qinc-item-title">${esc(item.title || '(sin título)')}</span>
  </div>
  <div class="qinc-item-meta">
    ${incStatusBadge}
    ${slaPrioBadge}
    ${slaCountdownHtml}
  </div>
  ${comportamientoHtml}
</div>`.trim();
}

// T-202606-072: listeners shell:* — desacoplamiento de módulos consumidores
