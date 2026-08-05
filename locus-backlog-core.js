// [PP] mod:141 · autor:Rune · 2026-08-05 14:20 UTC-6
// TKT-202608-247 (REQ-202608-097): renderStats() — envuelto en .bl-header-unified > .stats-bar,
// mismo patrón que Q-Backlog/Discoveries/Histórico. De los 2 early-returns que blanqueaban
// #stats-bar, solo queda 'sin proyecto activo' (_rsProjId ausente — fuera de scope del TKT,
// AC5). 'ITEMS.length===0' se retira — el resto de la función ya calcula ceros de forma
// natural sobre countableItems/visible vacíos, sin rama especial. Rama 'sin sprint activo'
// también envuelta en el wrapper nuevo — mensaje <span class="stats-bar-no-sprint"> sin
// cambio de contenido (Opción A). .stats-bar-body (clase previa) queda sin consumidor en esta
// función — retiro del CSS fuera de scope declarado en no_incluye del TKT. Sin cambio de
// cálculo de backlogCount/enRevisionCount/done/byType/byPriority/byEffort — contract_update: n/a.
// [PP] mod:140 · autor:Rune · 2026-07-31 UTC-6
// TKT-202607-142 (REQ-202607-045): segunda referencia a 'CAEL-0726-04' detectada en la
// tabla de shell:* events (línea ~317, comentario de shell:render-sprint-tab) — el fix de
// mod:136 solo cubrió el comentario de origen del bloque mod:135. Misma corrección de
// consistencia, mismo criterio (`__BR-Execution §9`) — sin cambio de comportamiento.
// [PP] mod:136 · autor:Rune · 2026-07-26 UTC-6
// TKT-202607-142 (REQ-202607-045, retroactivo — reemplaza TKT-202607-141): AC2 — el
// comentario de origen del bloque mod:135 (línea siguiente) citaba el ref_id de sesión
// 'CAEL-0726-04' en vez del código real ya asignado por Locus. Corregido a 'TKT-202607-142'
// — mismo criterio de `__BR-Execution §9` (código real disponible → se usa, nunca el
// ref_id efímero una vez resuelto). Sin cambio de comportamiento — solo trazabilidad.
// [PP] mod:135 · autor:Rune · 2026-07-26 UTC-6
// origen: TKT-202607-142 (triggered_by: TKT-202607-134): shell:sprint-render → shell:render-sprint-tab.
// TKT-202607-134 retiró renderSprintBurndown()/renderSprintItems() y su listener de
// locus-backlog-sprints.js sin actualizar el evento que este módulo dispara — shell:sprint-render
// quedó sin listener (dead event). locus-sprint.js escucha shell:render-sprint-tab (L2403) desde
// la consolidación de TKT-202607-134; este módulo ahora dispara ese evento en los mismos 3 puntos.
// INC-202607-XXX (triggered_by: reporte directo del founder — screenshot Backlog Vista Lista):
// renderStats() — backlogCount ahora suma 'en-proceso' y 'bloqueado' además de 'pendiente'.
// Antes, un REQ en cualquiera de esos dos estados era visible en la lista (statusOk ya los
// trata como siempre-contables desde QA-0724-01/03) pero no sumaba en ningún bucket del
// stats-bar — total quedaba por debajo del conteo real. Sin cambio de firma, sin nueva
// dependencia CSS, sin impacto en enRevisionCount/done.

// [PP] mod:133 · autor:Rune · 2026-07-24 UTC-6
// INC (ref_id QA-0724-01): renderStats() — statusOk trata 'bloqueado' como siempre-visible,
// consistente con el mismo fix en locus-backlog-render.js (_renderVistaLista). Sin cambio de
// firma, sin nueva dependencia CSS.

// [PP] mod:131 · autor:Rune · 2026-07-23 UTC-6
// TKT-202607-067 (REQ-202607-018, Effort 2, módulo crítico locus-backlog-core.js): retiro
// completo de 'KE' del universo de tipos y cardinalidad-6 (fusión KE→PRB.root_cause_confirmed,
// infra_version 51). Sitios corregidos: _GEN2_TYPES (línea ~331), _ITIL_SCRUM_INCOMPATIBLE
// (~1820) y _ITIL_SCRUM_INCOMPATIBLE_DONE (~2173) sin 'KE' — CHG sigue como excepción vigente
// en ambos guards. byType counter (~2439) sin clave KE. Cardinalidad: los 4 sitios reales de
// activeTypes.size/(N - activeTypes.size) comparados contra 7 (toggleTypeFilter ===7,
// updateTypeFilterUI clase s-types--all-active ===7, badge de conteo ×2, chip "mostrar todos"
// <7) pasan a comparar contra 6 — grep de 'activeTypes.size' y '7 - activeTypes' en el archivo
// completo tras el cambio no retorna ningún literal 7. Leyenda UI del popover de tipos (~2512)
// y filtro de tipos excluidos en chips activos (~2890/2893) sin entrada 'KE'/'Known Errors'.
// Comentario de _normalizeQincGate (~1355-1356) y comentarios adyacentes a los guards
// actualizados en la misma pasada — consistencia, no gate de AC. INCIDENT_TYPES (línea 339)
// ya no declaraba 'KE' desde antes de este TKT — sin cambio ahí. Ítem histórico con
// type:'KE' persistido en Supabase sigue excluyéndose silenciosamente de itemKind()/byType
// sin crash — comportamiento ya existente, verificado sin cambio de código adicional (AC de
// error del TKT).
// TKT6 (REQ-202607-018, ref_id CAEL-0723-07): mismo cambio de _GEN2_TYPES documentado arriba
// — contract_detail declara signature_change:true (universo de validación de schema_version 2
// pierde un elemento). sideEffect adicional declarado y verificado en esta pasada:
// _getNextItemCode('KE', reservedCodes) tras el cambio ya no pasa el guard
// !_GEN2_TYPES.includes(typeChar) (línea ~1683) — cae al console.warn de tipo no canónico
// existente, código no generado. Ninguna rama nueva — mismo comportamiento que cualquier
// typeChar inválido previo a este TKT, sin cambio de código en _getNextItemCode.
// Impacto lateral de contrato: _GEN2_TYPES es consumida por locus-session-parse.js y
// locus-backlog-item.js para validación de `type` en ingesta de CHECKPOINT — ninguno de los
// dos archivos está adjunto en esta sesión; call sites no verificados contra código real.
// Ver bloqueo declarado en el CHECKPOINT de cierre.
// DDL requerido: no — este TKT no toca `schema_version`, `type` ni `status` de ítems del
// backlog a nivel Supabase; `_GEN2_TYPES` es una constante de validación client-side, no una
// columna ni constraint físico. `tracker_items_type_check`/`chk_status_by_type` ya excluyen
// KE desde la auditoría de Supabase del 2026-07-22 (ver `_pp-strategy §5`) — sin acción
// adicional aquí.
// TKT1 (REQ CAEL-0723-01, ref_id CAEL-0723-01): isSlaClockPaused(item) agregada — determina
// si el reloj SLA de un INC/PRB/CHG está pausado por un ítem derivado (REQ/DISC/CHG) aún
// no-terminal (__BR-Core §6). Función pura, sin side effects — solo lectura vía getAnyItem().
// Import de incDerivedItems agregado desde locus-inc-fields.js.

// [PP] mod:129 · autor:Rune · 2026-07-22 UTC-6
// Fix (founder, análisis de construcción): toggleCollapseAll() apuntaba a .version-group-body/
// .version-collapse-arrow — clases previas a la unificación de renderSprintGroup() (REQ
// Histórico unificado con Vista Lista de Backlog), que ya produce .bl-vl-sprint-body/
// .version-header-arrow. querySelectorAll no lanzaba error, solo devolvía NodeList vacío para
// los grupos de sprint — botón silenciosamente inerte. Selectores corregidos + classList.
// toggle('collapsed') agregado en la rama de flecha no-section (.version-header-arrow.collapsed
// tiene tratamiento CSS propio, no solo el glifo de textContent).
// TKT2 (REQ CAEL-0720-10): _syncParentRStatus revierte el widen a INC de mod:79 —
// parent/parentId vuelve a ser exclusivo de TKT (__BR-Ecosystem §5).
// TKT1 (REQ CAEL-0720-02): reaplicado sobre base subida en mod:121 sin este fix — el mod:121
// original (con el fix de isSupabaseAuthed) no llevaba el cambio de _syncToolbarHeightVar.
// Gap adicional detectado en esta pasada, no capturado en la Fase 5 anterior: el
// ResizeObserver (línea ~2983) también observaba .bl-toolbar directamente — mismo fix aplicado
// ahí. Ambos selectores de .bl-toolbar en el archivo migrados a .bl-header-unified.
// [PP] mod:121 · autor:Rune · 2026-07-20 UTC-6
// INC histórico: isSupabaseAuthed() importada — typeof _supabase !== 'undefined' &&
// typeof _supabaseUser !== 'undefined' en loadBacklog() nunca era true (ambas privadas de
// locus-storage.js, sin export hasta este fix). La rama "Supabase-first" (refresh en
// background al cambiar de proyecto activo) nunca disparaba — loadBacklog() siempre caía
// al else (solo localStorage). Fix: isSupabaseAuthed() real, expone solo el booleano.
// [PP] mod:119 · autor:Rune · 2026-07-13 UTC-6
// INC histórico: getCurrentTab importado — typeof currentTab !== 'undefined' nunca era true.
// exportBtn en updateBacklogBanner() nunca se des-ocultaba vía este guard cuando tab activo era backlog.
// TKT2 (REQ-refactor-item-shape-itil-scrum, parent sin código confirmado (histórico, pre-convención ref_id) en
//   Locus): isQIncItem() simplificada — discriminador híbrido queue+itemKind reemplazado por
//   itemKind() únicamente. Ver comentario inline en la función (~línea 2160).
// [PP] mod:117 · autor:Rune · 2026-07-11 00:15 UTC-6
// TKT0 (REQ-202607-026): _normalizeSprintFields() — alias getter/setter item.sprint↔
//   sprint_id reaplicado incondicionalmente en cada pasada (antes solo se aplicaba si
//   sprint_id era undefined, dejando item.sprint desconectado tras el primer backfill).
//   El parseo/backfill de sprint_id/sprint_name sigue siendo idempotente. Sin cambio de
//   firma — signature_change: false.
// [PP] mod:114 · autor:Rune · 2026-07-10 20:05 UTC-6
// TKT1 (REQ-202607-026 · AC2 — cierre de blocked_at, archivos corregido por Cael vía patch):
//   _isQBacklogActive() gana condición !i.draft — ítems con draft:true (código real asignado,
//   pendiente de aval Finn) quedan fuera de la vista activa de Q-Backlog (renderQBacklogPanel,
//   badge tpl-badge-qbacklog). _isQBacklog (semántica amplia) no se toca — sigue siendo el
//   universo total usado por otros call sites (ej. mergeBacklogFromTG para decidir zona).
// [PP] mod:113 · autor:Rune · 2026-07-10 UTC-6
// TKT2 (REQ-202607-025): _newBacklogItem(fields) — factory exportado, insertado entre
//   _normalizeSprintFields() y _normalizeQincGate(). Reusa el mismo split ' · ' y el mismo
//   contrato de alias getter/setter sprint↔sprint_id que _normalizeSprintFields — función
//   pura, sin push ni I/O, sin cambio de comportamiento en las pasadas existentes. Reemplaza
//   los push() literales de creación de ítem en locus-backlog-editor.js, locus-backlog-item.js
//   (2 call sites) y locus-session-parse.js (2 ramas de CHECKPOINT ingestion) — ver esos
//   archivos en la misma entrega. Nota: esta es la reimplementación sobre el árbol de código
//   real (mod:112) — la entrega previa de este TKT (sesión anterior) se hizo sobre una copia
//   desactualizada del archivo que el founder señaló como no vigente; esa entrega queda
//   descartada, no se pisa aquí ningún trabajo intermedio de mod:93→112.
// [PP] mod:112 · autor:Rune · 2026-07-10 18:05 UTC-6
// INC histórico (triggered_by REQ-202607-022 · TKT1+TKT2, ver locus-backlog-item.js
//   mod:91): _setIncidents() ahora exportada — antes interna, item.js necesita consumirla
//   para enrutar creación de ITIL nueva por el mutador canónico en vez de push directo sobre
//   getIncidents(). signature_change: false, mismo contrato (acepta ítem individual o array).
//   Sin otro cambio en este archivo.
// TKT-202607-091/092 (REQ-202607-022): undo/redo separado en dos mecanismos independientes
// _undoSnapshotItems()/_undoSnapshotIncidents() con stacks propios (_undoStackItems/
// _redoStackItems, _undoStackIncidents/_redoStackIncidents). undoBacklog()/redoBacklog()
// eligen el par cronológicamente más reciente por `seq` monotónico (no `ts` — dos snapshots
// en el mismo tick podían empatar) y descartan en silencio entradas no-op (contenido idéntico
// al array vivo) antes de restaurar. _updateUndoUI() calcula sobre la unión de ambos pares.
// El puente de compatibilidad _undoSnapshot() fue eliminado en TKT-092 — los 27 call sites
// externos migraron a la función correspondiente según el array que mutan; único call site que
// muta INCIDENTS es _setIncidents() (línea ~366) → _undoSnapshotIncidents().
// TKT1 (REQ type-safety DISC status): normalizeStatus(raw, type) reescrita internamente sin
//   cambio de firma (signature_change: false) — para type==='DISC', cualquier valor que
//   resuelva a done/en-revision/historico/pendiente (incluye desconocido y 'bloqueado') se
//   ignora y se normaliza a 'discovery' + _blogLog('disc-status-invalido', ...). Antes esos
//   valores pasaban intactos para DISC (contradice __BR-Ecosystem §5 — estados prohibidos
//   done/en-revision/bloqueado/pendiente). Self-healing automático en el ciclo de carga
//   existente (líneas ~988-995 de este archivo, sin cambio) — un DISC ya persistido con
//   status corrupto se corrige en el siguiente normalizeStatus() sin migración manual.
//   Sin impacto en tipos distintos de DISC — mismos valores de retorno que antes. Sin cambio
//   de comportamiento para 'discovery'/'promoted'/'descartado' en DISC (ya eran válidos).
// TKT-202607-INC-NAMING (INC histórico): _normalizeIncidents() validaba sla_priority y
//   comportamiento_actual solo en snake_case — un INC recién parseado desde CHECKPOINT (que
//   trae slaPriority/comportamientoActual camelCase, ver locus-session-parse.js) se marcaba
//   itil_incomplete de forma falsa. Fallback bidireccional agregado — mismo patrón que ya
//   tenía incidentStatus en esta misma función. Sin cambio de firma, sin impacto en callers.
// TKT-202607-047: itemKind() leía de GEN2_TYPES local (const duplicada, línea 1248) en vez
//   de BACKLOG_TYPES/INCIDENT_TYPES (ya exportadas desde TKT-202607-005, sin usarlas ahí).
//   GEN2_TYPES local eliminada — itemKind() ahora usa _ITEM_KIND_TYPES = BACKLOG_TYPES.
//   concat(INCIDENT_TYPES), mismo orden exacto (REQ,TKT,DISC,INC,PRB,KE,CHG) — sin cambio de
//   comportamiento para los 7 tipos Gen2, verificado. _GEN2_TYPES (con guion bajo, línea 218,
//   universo de validación de locus-session-parse.js/locus-backlog-item.js) no se toca — es
//   una constante distinta, fuera de scope de este TKT. grep de "GEN2_TYPES" sin guion bajo
//   confirma cero declaraciones residuales tras el cambio.
// TKT-202607-062 (REQ-202607-016): _normalizeItems() dividida en _normalizeScrumItems()
//   (REQ/TKT/DISC) + _normalizeIncidents() (INC/PRB/KE/CHG) — pasadas comunes extraídas a
//   _normalizeCommonFields/_normalizeSprintFields/_normalizeQincGate/_normalizeOrphanedFlag,
//   compartidas por ambas. _normalizeIncidents() agrega validación de campos ITIL
//   obligatorios (sla_priority · incident_status · comportamiento_actual) — ítem incompleto
//   se conserva (sin descartarse) con item.itil_incomplete = [campos faltantes], recalculado
//   desde cero cada pasada. Reemplaza el warning aislado de solo sla_priority que
//   _normalizeItems() tenía antes. Call sites actualizados: loadBacklog() (2 sitios) y stub
//   _migrateItemTypes() → _normalizeScrumItems(ITEMS) (scope sin cambio — el call site en
//   locus-storage.js solo opera sobre ITEMS, nunca sobre INCIDENTS). _normalizeItems()
//   eliminada — sin retrocompatibilidad (__BR-Execution §2), sin otro call site en este
//   archivo ni en locus-storage.js (verificado por grep antes de eliminar).
// TKT1 (REQ-historico-async): _getNextItemCode(typeChar, reservedCodes) → async. Además del
//   escaneo existente de ITEMS/INCIDENTS (según INCIDENT_TYPES) + reservedCodes, ahora hace
//   await refreshHistoricoCache() y suma getHistoricoItemsSync() al cómputo de maxNum antes de
//   generar el código — un código archivado en historico ya no puede reasignarse a un ítem
//   nuevo del mismo tipo. Si refreshHistoricoCache() rechaza, se captura y se continúa solo con
//   ITEMS/INCIDENTS + reservedCodes (comportamiento idéntico al de antes de este TKT — sin
//   excepción no controlada, sin promesa colgada). Import nuevo: refreshHistoricoCache,
//   getHistoricoItemsSync (locus-storage.js). contract_update: sí — ver CHECKPOINT.
//   Todo call site debe usar await desde ahora — locus-backlog-item.js (TKT2) y
//   locus-backlog-editor.js (TKT3) actualizados por separado, mismo REQ.
// TKT-202607-046 (REQ-202607-015): _undoSnapshot() extendida a snapshot combinado
//   {items: ITEMS, incidents: INCIDENTS} — antes solo capturaba ITEMS, por lo que un undo tras
//   mutar un INC/PRB/KE/CHG (vía _setIncidents(), que ya invocaba _undoSnapshot() desde
//   TKT-202607-005) no revertía nada: el snapshot no incluía INCIDENTS y _setITEMS() no la toca.
//   _setIncidentsRaw(arr) agregada — restauración de INCIDENTS por reemplazo total (splice),
//   sin merge y sin _undoSnapshot() propio, usada exclusivamente por undoBacklog()/
//   redoBacklog(). No reemplaza a _setIncidents() (mutador público de flujo normal, merge
//   aditivo, se auto-snapshotea) — esa función no cambia. Firma de _undoSnapshot()/
//   undoBacklog()/redoBacklog() sin cambio — sin impacto en call sites existentes (listeners
//   #btn-undo-backlog/#btn-redo-backlog en este archivo; atajo de teclado no verificable, no
//   está en este archivo). AC-3 del TKT corregido en sesión — ver CHECKPOINT: el código no
//   emite nota en DocLog en el no-op de stack vacío hoy para TKT/REQ (return silencioso puro),
//   la corrección alinea el AC al comportamiento real en vez de asumir uno inexistente.
// TKT-202607-045 (REQ-202607-015): getAnyItem(code) agregada — lookup unificado ITEMS+INCIDENTS
//   por código, sin que el caller sepa de antemano si el código es Scrum o ITIL. Solo lectura.
// TKT-202607-011 (TKT3 REQ-202607-006): namespace de filtro por área agregado a _subtabNS —
//   solo qdisc lo consume (chips de área en stats-bar, ver locus-backlog-zone-engine.js).
//   Single-select (no Set, a diferencia de types/priority): _nsToggleArea(sub, area) — click en
//   la misma área la limpia, click en otra la reemplaza. _nsReset incluye area:null.
// TKT-202607-027 (REQ-202607-013 · Deprecar Vista Kanban): removidos _backlogViewModeRaw/
//   _backlogKanbanMode (state) · toggleBacklogKanbanMode() (export) · _getBacklogKanbanMode()
//   (getter export) · bloque de tablist Kanban/Vista Lista en _syncViewAriaStates() · fallback
//   de selector .kb-card en búsqueda de ítem · listener de #fbar-kanban-btn en DOMContentLoaded
//   (el botón y la función ya no existen tras esta entrega). Sin impacto en locus-storage.js,
//   locus-toast.js ni locus-ui-shell.js (imports sin cambio). contract_update: sí — ver
//   CHECKPOINT para detalle de funciones removidas del contrato de módulo.
// TKT-202607-005 (REQ-202607-003 · Separación completa del modelo en memoria): array INCIDENTS
//   separado de ITEMS. itemKind() resuelve tipos ITIL (INC/PRB/KE/CHG) contra INCIDENTS
//   y tipos backlog (REQ/TKT/DISC) contra ITEMS — antes ambos vivían en ITEMS. _GEN2_TYPES
//   se conserva sin cambios (7 tipos, usada por locus-backlog-item.js/locus-session-parse.js
//   para validar universo completo — no discrimina backlog vs incidente). Nuevas constantes
//   BACKLOG_TYPES (REQ/TKT/DISC) e INCIDENT_TYPES (INC/PRB/KE/CHG) exportadas — fuente de
//   discriminación real. _setIncidents(item) agregada — mismo contrato que _setITEMS (filtra
//   historico, ejecuta _undoSnapshot() antes de mutar). _getCountableBaseForSubtab('qinc')
//   actualizado para leer de INCIDENTS — 'historico' combina ambos arrays. _getNextItemCode()
//   busca colisión de código en el array correcto según tipo. byType (renderStats) y
//   _getMiViewRoles no requerían cambio — ya excluían/filtraban tipos ITIL o TKT explícitamente.
//   AC de undo/redo para INCIDENTS no cubierto por este TKT — señalado a Cael, ver CHECKPOINT.
//   Los 12 módulos consumidores de ITEMS (ver _Locus-module-contracts §1) solo importan
//   itemKind()/getItems()/_isQBacklog*/_isQDisc*/isQIncItem() — ninguno accede a ITEMS
//   directamente — firma pública sin cambios, sin impacto en esos módulos. contract_update: sí.
// TKT2 (REQ-clutter-backlog): chips de tipo inline en el toolbar de stats reemplazados
//   por trigger+popover (#bstats-types-btn / #blt-popover) — conteo por tipo calculado
//   una sola vez (sin IIFE duplicado). Reaplicado sobre base mod:86 tras discrepancia de
//   versión detectada al inicio de esta sesión (base real no traía el fix pese a que el
//   header previo lo declaraba). TKT1 (unificación de renderActiveFilterChips) ya estaba
//   presente en esa base — sin cambios adicionales sobre TKT1 en esta entrega.
// TKT histórico (nsreset) (origen_disc DISC promovida): _subtabNSDefaults agregado —
//   fuente única de types/statuses por namespace. _subtabNS y _nsReset() ya no duplican el
//   literal; _nsReset('qinc') dejó de restaurar tipos/estados de REQ-TKT sobre namespace ITIL.
// INC histórico (triggered_by análisis de subtab Discoveries): _subtabNS.qdisc.statuses
//   no incluía 'discovery' — único status activo no-terminal de DISC. Ninguna DISC activa
//   pasaba el filtro statusOk en _renderZonePanel (locus-backlog-render.js), aunque el badge
//   (que no pasa por _subtabNS) sí las contaba — panel vacío con badge > 0. Fix: 'discovery'
//   agregado al Set inicial de qdisc.statuses. _nsReset('qdisc') no se toca en este fix —
//   no tiene caller activo hoy (solo se invoca con 'qinc'), pero comparte el mismo defecto de
//   fondo (defaults hardcodeados no específicos por sub) — registrado como deuda, no corregido
//   aquí para no mezclar refactor con este fix puntual (__BR-Execution §2).
// TKT1 (limpieza post-rename): comentario en L699 actualizado — referenciaba locus-backlog-archive.js (renombrado a locus-backlog-historico.js). Sin cambio de código.
// Reaplicado sobre base mod:80 (sin divergencia de Nova en este archivo): eliminados
// toggle en renderActiveFilterChips() y listener en initFiltrosListeners de
// #filter-clear-btn (INC histórico — botón duplicado eliminado de index.html).
// TKT1 (REQ histórico — unificar renderer de #active-filter-chips): renderActiveFilterChips()
//   agrega toggle is-hidden de #filter-clear-btn vía chips.length===0 — criterio único que incluye
//   deps (bloqueados/libres), gap que el isDefault previo de updateClearFilterBtn no cubría.
// TKT histórico (REQ histórico — limpieza de código muerto): eliminadas _vcCollapseGet
//   y _vcCollapseSet — huérfanas tras remoción de _renderVistaC en locus-backlog-render.js
//   (impacto lateral de la misma eliminación, sin otro caller en el codebase). Sin cambio de
//   comportamiento visible.
// TKT1/TKT2 REQ2 S'02: _isQBacklogActive/_isQDiscActive agregadas (universo activo de
//   Q-Backlog/Q-DISC, excluye descartado/promoted/historico). _subtabNS: entrada muerta
//   'q-backlog' (con guion) reemplazada por 'qbacklog' + 'qdisc' agregada.
// INC histórico (triggered_by REQ-202606-003 / REQ-202606-001 — REQ no sincroniza
//   status al ingestar CHECKPOINT): _syncParentRStatus exportada — las rutas de status
//   manual en locus-backlog-merge.js (_confirmRetroceso, _confirmDiscard, _applyDiscardBatch,
//   _mdiffDoApply retroceso/discard) la necesitan para no quedar fuera de sync con el R padre.
//   Causa raíz completa de la ingesta normal de CHECKPOINT (mergeBacklogFromTG/
//   applyPatchesFromTG en locus-backlog-item.js) sigue pendiente — archivo no adjunto.
// INC histórico (triggered_by TKT-202606-013): showToast({title,body,type}) en
//   _openItemEditorSafe corregido a firma posicional showToast(type,title,body).
// INC histórico (normalizeStatus sin caso explícito para 'discovery' — fallback
//   silencioso a 'pendiente'): agregado caso explícito 'discovery' → 'discovery' para
//   type DISC, 'pendiente' para cualquier otro tipo — mismo patrón que 'promoted'/
//   'promovida' en la línea anterior. Ver locus-session-parse.js mod:82 para el fix
//   complementario en el gate de validación del parser.
// TKT1 (REQ-getactiveprojectfilter): comentario de propietario de getActiveProjectFilter
//   corregido — locus-sprint-project.js ya no posee la función desde T-202606-197.
// [tmp:tkt-isqinc-unify]: isQIncItem(i) exportada — consolida _isQInc (renderBacklogList)
//   y _isQIncItem (renderQIncPanel) en función única. _getCountableBaseForSubtab('qinc')
//   actualizada para consumirla. locus-backlog-render.js la importa.
// TKT (REQ histórico · UI: sub-tab Q-INC reemplaza Hotfix): empty state
//   label de tipo INC en chips de filtro corregido de 'Sin Bugs' a 'Sin Incidentes'.
//   typeScores (PRB:20/KE:15/CHG:10), namespace qinc y _nsGetTypes('qinc') ya
//   estaban implementados desde TKT-A2 (mod:58) — sin cambio adicional requerido.
// TKT-A2 (REQ histórico): Q-INC reemplaza S-HOTFIX como zona ITIL.
//   namespace _subtabNS.hotfix → qinc (types INC/PRB/KE/CHG); gate de sprint S-HOTFIX
//   reemplazado por gate de queue Q-INC con mensaje canónico BR-Core §6; universo
//   _getCountableBaseForSubtab('hotfix') → ('qinc') sobre campo item.queue; activeTypes
//   por defecto amplía de 4 a 7 tipos Gen2 (TKT/REQ/INC/DISC/PRB/KE/CHG) — clearTypeFilters,
//   toggleTypeFilter, clearAllFilters y reset de filter-panel actualizados consistentemente;
//   typeScores de _calcRelevanceScore incluye PRB:20/KE:15/CHG:10. __BR-Execution §2.
// TKT-C1b (REQ-C): wrapper transitorio _isIcebox eliminado — TKT-C1 (locus-backlog-render.js
//   mod:45) ya no la importa. Comentarios de INC histórico y referencia a renderIceboxPanel
//   retirados. __BR-Execution §2 Sin retrocompatibilidad.
// locus-backlog-core.js
// Responsabilidad: State global (ITEMS, undo/redo), carga, parse, importación,
//   filtros, vistas, sort, stats, footer, helpers de badge/status/effort.

// T-202606-057: imports hacia módulos que importan a locus-backlog-core eliminados.
// Funciones desacopladas via _coreCallbacks (getters/acciones controladas)
// y shell:* events (notificaciones de render — window per B-202606-021).
import { _blogLog, _effectiveVersion, _isInSession, _loadFromSupabase, _sprintDisplay, _tplKey, getAI, getActiveSprints, getAllSessions, getState, isSupabaseAuthed, saveBacklog, refreshHistoricoCache, getHistoricoItemsSync } from './locus-storage.js'; // TKT1 (REQ-historico-async): refreshHistoricoCache/getHistoricoItemsSync — _getNextItemCode() incluye historico en el escaneo de colisión · INC histórico: isSupabaseAuthed agregado — guard typeof _supabase/_supabaseUser muerto
import { showToast, toast } from './locus-toast.js';
import { esc, getCurrentSubTab, getCurrentTab } from './locus-ui-shell.js';
import { incSlaPriority, incComportamientoActual, incIncidentStatus, incDerivedItems } from './locus-inc-fields.js'; // TKT1 REQ-centralizar-accesores-itil: reemplaza fallback || inline en _normalizeIncidents() · incDerivedItems agregado en TKT1 (REQ CAEL-0723-01) para isSlaClockPaused()

// ── Callback registry — T-202606-057 ─────────────────────────────────────────
// Módulos consumidores registran sus funciones aquí al inicializarse.
// locus-backlog-core no las importa directamente — elimina ciclos.
//
// Registro de callbacks obligatorios por módulo registrante:
//   locus-backlog-editor.js  → openItemEditor
//   locus-backlog-merge.js   → confirmDiscard, confirmRetroceso
//   locus-backlog-panel.js   → backlogSetSelected, openItemPanel, closeItemPanel
//   locus-modals.js          → gconfirmOpen
//   locus-notifications.js   → hasRecentSession
//   locus-backlog-sprints.js → getActiveSprint, getSprintById
//   locus-proj-core.js       → getActiveProjectFilter
var _coreCallbacks; // ESM-B: var + lazy init — evita TDZ en ciclo locus-ui-shell ↔ locus-docs ↔ locus-backlog-core

export function _registerCoreCallback(name, fn) {
  if (!_coreCallbacks) _coreCallbacks = {}; // lazy init — var hoist como undefined en ciclo ESM
  if (typeof fn !== 'function') {
    console.warn('[locus-backlog-core] _registerCoreCallback: "' + name + '" no es función — ignorado');
    return;
  }
  _coreCallbacks[name] = fn;
}

// shell:* events despachados por este módulo (todos en window per B-202606-021):
//   shell:backlog-render-dirty  → listener: _markBacklogListDirty() + renderBacklogList()
//   shell:backlog-filter-changed → listener: updateClearFilterBtn()
//   shell:backlog-modified       → listener: _setBacklogModified()
//   shell:backlog-subtab-update  → listener: _updateSubTabButtons(detail.tab)
//   shell:render-sprint-tab      → listener: locus-sprint.js — renderSprintTab() (origen: TKT-202607-142, TKT-202607-134)

// T-202604-216: Skeleton helpers
const _SKEL_HTML_4 = Array(4).fill('<div class="skel-row"></div>').join('');
const _SKEL_HTML_5 = Array(5).fill('<div class="skel-row"></div>').join('');
const _SKEL_TBL    = Array(4).fill('<div class="skel-row skel-row--tbl"></div>').join('');
export function _skelShow(el, variant) {
  if (!el) return;
  const h = variant === 'tbl' ? _SKEL_TBL : variant === 5 ? _SKEL_HTML_5 : _SKEL_HTML_4;
  el.innerHTML = h;
}
export function _skelHide(el) {}

// _generateContextContent + exportContextMd — migradas a locus-sprint-project.js


// ── TAB-BACKLOG — State, parser, importación, render, filtros, búsqueda ──
// HTML MAP viewer extraído a locus-map-viewer.js

// T-202604-187: CSS para children colapsables y toggle árbol/plano


// T-202604-323: HTML-MAP — barras proporcionales por módulo con color por tipo


let currentFilter = 'all';
// T-202606-047: normalizeStatus — punto canónico único de validación y normalización de status
// Firma: normalizeStatus(raw: string, type?: string) → string
// Consumidores: ITEMS IIFE · _normalizeCommonFields (TKT-202607-062) · locus-session-parse.js (T-202606-048)
// Hallazgo fuera de scope resuelto en sesión (2026-07-22): aliases 'en_revision'/'en revisión'/
//   'en-revisión' y 'promovida' retirados — BR-Execution §2 "Sin retrocompatibilidad" prohíbe
//   conservar aliases de status de schema anterior una vez el nuevo está activo (Gen2, completo
//   desde 2026-06-28; chk_status_by_type en Supabase ya rechaza estos valores desde 2026-07-22,
//   ver _pp-strategy §5). Sin call site de escritura para ninguno de los dos — solo lectura/
//   tolerancia muerta. Condiciones de resolución directa cumplidas: dueño presente (Rune) ·
//   nivel Patch (sin cambio de comportamiento — nunca hubo escritura de estos valores) · sin
//   bifurcación de founder.
export function normalizeStatus(raw, type) {
  const s = (raw || '').trim().toLowerCase();
  let canonical;
  // Valores canónicos directos
  if (s === 'done')        canonical = 'done';
  else if (s === 'en-revision') canonical = 'en-revision';
  else if (s === 'descartado')  canonical = 'descartado';
  else if (s === 'historico')   canonical = 'historico';
  else if (s === 'promoted') canonical = (type === 'DISC') ? 'promoted' : 'pendiente';
  else if (s === 'discovery') canonical = (type === 'DISC') ? 'discovery' : 'pendiente'; // INC histórico: discovery solo válido para DISC — __BR-Ecosystem §5
  // TKT-202606-006: legado 'pendiente' (o status ausente/vacío) en DISC migra a 'discovery' — REQ-202606-002
  else if (s === 'pendiente' || s === '') canonical = (type === 'DISC') ? 'discovery' : 'pendiente';
  // Valor desconocido → pendiente
  else canonical = 'pendiente';

  // TKT1 (REQ type-safety DISC status): __BR-Ecosystem §5 prohíbe done/en-revision/bloqueado/
  // pendiente/historico como estado persistido de una DISC — solo discovery/promoted/descartado
  // son válidos. Cualquier valor de entrada que resuelva a otro canónico para type==='DISC' se
  // ignora y se normaliza a 'discovery', con registro en DocLog. No se pasa item.code — la firma
  // de esta función no cambia (signature_change: false), se usa '(sin código)' como en el resto
  // de warnings sin contexto de ítem en este módulo.
  if (type === 'DISC' && canonical !== 'discovery' && canonical !== 'promoted' && canonical !== 'descartado') {
    _blogLog('disc-status-invalido', '(sin código)', `Status "${raw}" inválido para tipo DISC. Campo ignorado — normalizado a discovery.`, 'backlog');
    return 'discovery';
  }
  return canonical;
}

// TKT1 (REQ histórico · Integridad de generación y persistencia de código de ítems):
//   _GEN2_TYPES movida desde locus-session-parse.js — fuente única consumida por
//   locus-session-parse.js y locus-backlog-item.js. Ambos módulos ya importaban de
//   locus-backlog-core.js — sin ciclo nuevo. locus-backlog-core.js no importa de
//   ninguno de los dos.
export const _GEN2_TYPES = ['REQ', 'TKT', 'DISC', 'INC', 'PRB', 'CHG'];

// TKT-202607-005 (REQ-202607-003): discriminador real de destino en memoria.
// BACKLOG_TYPES → viven en ITEMS. INCIDENT_TYPES → viven en INCIDENTS.
// _GEN2_TYPES arriba se conserva intacto — sigue siendo el universo completo de
// 7 tipos consumido por locus-backlog-item.js/locus-session-parse.js para validación,
// no para discriminar array de destino.
export const BACKLOG_TYPES = ['REQ', 'TKT', 'DISC'];
export const INCIDENT_TYPES = ['INC', 'PRB', 'CHG'];

var ITEMS = (() => { // ESM-B: var para evitar TDZ en grafo circular — migrar a módulo de estado en PP-S-10
  // T-202604-006: leer clave por proyecto activo sin depender de _tplKey (aún no definida)
  const _initProjId = localStorage.getItem('current-project-filter') || '';
  const _initKey = _initProjId ? 'backlog-items-' + _initProjId : null;
  const stored = _initKey ? localStorage.getItem(_initKey) : null;
  if (!stored && _initProjId) {
    // B-202605-062: proyecto activo sin datos — feedback explícito
    console.warn('[AI Tracker] ITEMS IIFE: proyecto activo "' + _initProjId + '" no tiene datos en localStorage.');
    // El empty window.state visual se muestra en renderBacklogList cuando ITEMS queda vacío
  }
  if (stored) {
    try {
      const items = JSON.parse(stored);
      // Migración inline: normalizar status legacy antes de que cualquier código use ITEMS
      // T-202606-047: consume normalizeStatus() — punto canónico único
      let migrated = false;
      items.forEach(item => {
        const norm = normalizeStatus(item.status, item.type);
        if (item.status !== norm) { item.status = norm; migrated = true; }
      });
      if (migrated) {
        try { localStorage.setItem(_initKey, JSON.stringify(items)); } catch {}
        console.log('[AI Tracker] ITEMS migration: legacy status values normalized');
      }
      // T-202606-106: carga local — excluir status:historico del valor inicial de ITEMS.
      // historico es de solo lectura, asignado únicamente por Locus al cerrar sprint, y vive
      // en su storage dedicado (T-202606-105) — nunca debe poblar ITEMS, ni siquiera al iniciar.
      // TKT-202607-005: excluir también tipos ITIL (INCIDENT_TYPES) — viven en INCIDENTS,
      // poblado por su propia IIFE inmediatamente abajo desde la misma clave de storage.
      return items.filter(i => i.status !== 'historico' && !INCIDENT_TYPES.includes(itemKind(i)));
    } catch {
      return [];
    }
  }
  return [];
})();

// TKT-202607-005 (REQ-202607-003): array ITIL independiente de ITEMS.
// TKT-202607-044 (REQ-202607-015) — INC-fix, hallazgo de Finn en QA: INCIDENTS ya no
// comparte clave con ITEMS. saveBacklog() (locus-storage.js) persiste INCIDENTS en
// 'backlog-incidents-{projId}' desde TKT-202607-044 — este IIFE leía la clave vieja
// 'backlog-items-{projId}', correcta bajo TKT-202607-005 cuando INCIDENTS vivía mezclado
// con ITEMS en la misma clave. Sin este fix, INCIDENTS siempre iniciaba vacío en cold boot:
// backlog-items ya no contiene incidentes (se filtran antes de guardar) y el respaldo real
// en backlog-incidents nunca se leía. Filtro sin cambio — no verificado si i.status es el
// campo correcto para incidentes (ver `incidentStatus` en _mapRowToIncident, locus-storage.js);
// fuera de scope de este fix puntual, señalado en CHECKPOINT.
var INCIDENTS = (() => {
  const _initProjId = localStorage.getItem('current-project-filter') || '';
  const _initKey = _initProjId ? 'backlog-incidents-' + _initProjId : null;
  const stored = _initKey ? localStorage.getItem(_initKey) : null;
  if (!stored) return [];
  try {
    const items = JSON.parse(stored);
    return items.filter(i => i.status !== 'historico' && INCIDENT_TYPES.includes(itemKind(i)));
  } catch {
    return [];
  }
})();

// getItems(): acceso canónico al array ITEMS — reemplaza window.ITEMS (ESM-1 · T-202606-037)
export function getItems() { return ITEMS; }
// TKT-202607-005: acceso canónico al array INCIDENTS — mismo patrón que getItems().
export function getIncidents() { return INCIDENTS; }
// TKT-202607-045 (REQ-202607-015): lookup por código sin asumir tipo Scrum vs ITIL — busca
// primero en ITEMS, luego en INCIDENTS. Solo lectura, nunca muta ninguno de los dos arrays.
// Reemplaza getItems().find(i => i.code === X) en call sites donde X puede ser un código
// ITIL (INC/PRB/KE/CHG) — esos códigos viven en INCIDENTS desde REQ-202607-003 y
// getItems().find() nunca los encuentra.
export function getAnyItem(code) {
  return ITEMS.find(i => i.code === code) || INCIDENTS.find(i => i.code === code);
}

// TKT1 (REQ CAEL-0723-01): isSlaClockPaused(item) — determina si el reloj SLA de un INC/PRB/CHG
// está pausado por un ítem derivado (REQ/DISC/CHG) aún no-terminal. __BR-Core §6: "el reloj se
// pausa... en el momento en que el ítem declara derived_items apuntando a un REQ, DISC o CHG
// pendiente" — la extensión a CHG con cadena transitiva a REQ (infra_version 56) queda cubierta
// sin recursión adicional: un CHG estructural permanece en status 'pendiente' hasta que su
// propio REQ derivado llega a 'done' (__BR-Core §6, ciclo de vida CHG) — basta leer el status
// directo del ítem derivado, sin abrir su propio derived_items.
// Terminal por tipo: REQ → done/descartado · DISC → promoted/descartado · CHG → done/descartado.
// Códigos que resuelven a TKT/INC/PRB, o que getAnyItem() no encuentra, se ignoran — no son
// destinos de pausa válidos según __BR-Core §6.
// Función pura — nunca muta item, ITEMS ni INCIDENTS, solo lectura vía getAnyItem()/itemKind().
const _SLA_PAUSE_TERMINAL_BY_TYPE = {
  REQ: ['done', 'descartado'],
  DISC: ['promoted', 'descartado'],
  CHG: ['done', 'descartado'],
};
export function isSlaClockPaused(item) {
  const derived = incDerivedItems(item);
  if (!Array.isArray(derived) || !derived.length) return false;
  return derived.some(code => {
    const target = getAnyItem(code);
    if (!target) return false;
    const kind = itemKind(target);
    const terminal = _SLA_PAUSE_TERMINAL_BY_TYPE[kind];
    if (!terminal) return false;
    return !terminal.includes(target.status);
  });
}
// T-202606-106: barrera común — ITEMS nunca contiene ítems status:historico, sin importar
// el call site (_loadFromSupabase, undo/redo, purge, normalize, etc). status:historico es
// de solo lectura, asignado únicamente por Locus al cerrar sprint — vive en su storage
// dedicado (T-202606-105), nunca en ITEMS.
// TKT-202607-005: ítem ITIL en _setITEMS() se excluye con console.warn y se enruta a
// _setIncidents(item) — nunca doble-agregado ni descartado.
function _setITEMS(arr) {
  const _incoming = Array.isArray(arr) ? arr : [];
  const _itilMisrouted = _incoming.filter(i => INCIDENT_TYPES.includes(itemKind(i)));
  if (_itilMisrouted.length) {
    console.warn('[locus-backlog-core] _setITEMS: ' + _itilMisrouted.length + ' ítem(s) ITIL recibido(s) — enrutado(s) a INCIDENTS, no ITEMS.', _itilMisrouted.map(i => i.code));
    _itilMisrouted.forEach(i => _setIncidents(i));
  }
  const _safe = _incoming.filter(i => i.status !== 'historico' && !INCIDENT_TYPES.includes(itemKind(i)));
  ITEMS.splice(0, ITEMS.length, ..._safe);
}

// TKT-202607-005: mutador canónico de INCIDENTS — mismo contrato que _setITEMS (filtra
// historico, nunca doble-agregado). Acepta un ítem individual o un array. Ejecuta
// _undoSnapshotIncidents() antes de mutar — único call site interno que muta INCIDENTS
// (invariant __BR-Execution §2 anti-pattern "llamado después de la mutación").
export function _setIncidents(itemOrArr) {
  _undoSnapshotIncidents();
  const _incoming = Array.isArray(itemOrArr) ? itemOrArr : [itemOrArr];
  const _existing = INCIDENTS.filter(i => !_incoming.some(n => n.code && n.code === i.code));
  const _merged = [..._existing, ..._incoming].filter(i => i.status !== 'historico');
  INCIDENTS.splice(0, INCIDENTS.length, ..._merged);
}

// B-202604-002: undo/redo stack para ITEMS (20 niveles)
// TKT-202607-091 (REQ-202607-022 · TKT1): stacks separados por rama de gobernanza
// (__BR-Ecosystem §4b) — antes un solo par {items,incidents} combinado (TKT-202607-046)
// capturaba ambos arrays en cada snapshot, acoplando el undo de Planeada (ITEMS) con el de
// Reactiva (INCIDENTS). Ahora cada rama tiene su propio par de stacks; cada entrada lleva su
// propio `ts` para que undoBacklog()/redoBacklog() puedan elegir el stack cronológicamente
// más reciente entre ambos pares. Mismo UNDO_MAX para cada par.
const UNDO_MAX = 20;
let _undoStackItems = [];
let _redoStackItems = [];
let _undoStackIncidents = [];
let _redoStackIncidents = [];
// TKT-202607-091 (fix quirúrgico post Fase-5): contador monotónico compartido entre ambos
// pares de stacks. Reemplaza la comparación por `ts` — dos snapshots creados en el mismo tick
// (ms) podían empatar en timestamp, y el empate siempre favorecía a Incidents por el `>=`.
// `seq` es estrictamente creciente entre llamadas — sin ambigüedad de orden posible.
let _undoSeq = 0;

// B-202604-194: Set de ids de ítems cuyos AC fueron reemplazados en la sesión activa.
// Vive solo en memoria — nunca se persiste a localStorage ni se serializa con ITEMS.
// Se limpia automáticamente al recargar la página (nueva sesión).
const _acReplacedSet = new Set();

// B-202605-012: wrapper para llamadas inline a openItemEditor
export function _openItemEditorSafe(id, code) {
  const _openItemEditorCb = (_coreCallbacks || {}).openItemEditor;
  if (_openItemEditorCb) {
    _openItemEditorCb(id, code);
  } else {
    // Fix INC histórico (triggered_by TKT-202606-013): showToast firma posicional.
    showToast('error', 'No se pudo abrir el editor', 'Recarga la página.');
    console.error('[AI Tracker] openItemEditor no disponible — módulo externo no cargado');
  }
}

// TKT-202607-046/091: _setIncidentsRaw(arr) — restauración desde el stack de undo/redo de
// Incidents. Reemplazo total del array INCIDENTS (splice), sin merge y sin snapshot propio —
// mismo invariant que _setITEMS() (que tampoco se auto-snapshotea): el caller (undoBacklog()/
// redoBacklog()) ya tomó el snapshot antes de mutar. No confundir con _setIncidents()
// (mutador público de flujo normal de negocio, merge aditivo, se auto-snapshotea vía
// _undoSnapshotIncidents()).
function _setIncidentsRaw(arr) {
  const _safe = (Array.isArray(arr) ? arr : []).filter(i => i.status !== 'historico');
  INCIDENTS.splice(0, INCIDENTS.length, ..._safe);
}

// TKT-202607-091 (REQ-202607-022 · TKT1): snapshot exclusivo de ITEMS — stack independiente
// de INCIDENTS. Cada entrada lleva su propio timestamp para resolución cronológica en
// undoBacklog()/redoBacklog().
export function _undoSnapshotItems() {
  _undoStackItems.push({ seq: ++_undoSeq, ts: Date.now(), data: JSON.stringify({ items: ITEMS }) });
  if (_undoStackItems.length > UNDO_MAX) _undoStackItems.shift();
  _redoStackItems = [];
  _updateUndoUI();
}

// TKT-202607-091 (REQ-202607-022 · TKT1): snapshot exclusivo de INCIDENTS — stack
// independiente de ITEMS. Mismo patrón que _undoSnapshotItems().
export function _undoSnapshotIncidents() {
  _undoStackIncidents.push({ seq: ++_undoSeq, ts: Date.now(), data: JSON.stringify({ incidents: INCIDENTS }) });
  if (_undoStackIncidents.length > UNDO_MAX) _undoStackIncidents.shift();
  _redoStackIncidents = [];
  _updateUndoUI();
}

// TKT-202607-092: puente _undoSnapshot() eliminado — los 27 call sites externos fueron
// migrados a _undoSnapshotItems()/_undoSnapshotIncidents() según el array que mutan.
// TKT-202607-091: undoBacklog() elige el par de stacks (Items o Incidents) cuyo tope tiene el
// timestamp más reciente, y restaura solo ese array — el otro queda intacto. Si un par está
// vacío, opera sobre el que tiene contenido sin comparar. Firma sin cambio (sin parámetros,
// void) — call sites existentes (listeners #btn-undo-backlog/#btn-redo-backlog en
// DOMContentLoaded de este archivo, atajo de teclado Ctrl+Z en locus-reports.js) no requieren
// cambio.
export function undoBacklog() {
  // TKT-202607-091 (fix quirúrgico): descarta en silencio cualquier entrada de tope cuyo
  // contenido snapshoteado es idéntico al array vivo actual — el puente _undoSnapshot()
  // empuja una entrada a AMBOS stacks aunque solo uno haya mutado realmente; sin este skip,
  // esa entrada "no-op" siempre gana el primer Ctrl+Z por tener seq más alto, forzando una
  // segunda pulsación para revertir la mutación real. Máx. 2 iteraciones (una por rama).
  const _guardMax = _undoStackItems.length + _undoStackIncidents.length;
  for (let _guard = 0; _guard <= _guardMax; _guard++) {
    if (!_undoStackItems.length && !_undoStackIncidents.length) return;

    const _topItems = _undoStackItems.length ? _undoStackItems[_undoStackItems.length - 1] : null;
    const _topIncidents = _undoStackIncidents.length ? _undoStackIncidents[_undoStackIncidents.length - 1] : null;
    const _useIncidents = _topIncidents && (!_topItems || _topIncidents.seq > _topItems.seq);

    if (_useIncidents) {
      if (JSON.stringify({ incidents: INCIDENTS }) === _topIncidents.data) { _undoStackIncidents.pop(); continue; }
      _redoStackIncidents.push({ seq: ++_undoSeq, ts: Date.now(), data: JSON.stringify({ incidents: INCIDENTS }) });
      const _snap = JSON.parse(_undoStackIncidents.pop().data);
      _setIncidentsRaw(_snap.incidents);
    } else {
      if (JSON.stringify({ items: ITEMS }) === _topItems.data) { _undoStackItems.pop(); continue; }
      _redoStackItems.push({ seq: ++_undoSeq, ts: Date.now(), data: JSON.stringify({ items: ITEMS }) });
      const _snap = JSON.parse(_undoStackItems.pop().data);
      _setITEMS(_snap.items);
    }

    saveBacklog();
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
    renderStats();
    _updateUndoUI();
    showToast('info', '↩ Deshacer aplicado');
    return;
  }
  // Ambos topes eran no-op y se descartaron — sin cambio real que restaurar.
  _updateUndoUI();
}

// TKT-202607-091: misma lógica de comparación cronológica que undoBacklog(), sobre los pares
// de stacks de redo.
export function redoBacklog() {
  // TKT-202607-091 (fix quirúrgico): mismo criterio de skip de no-op que undoBacklog().
  const _guardMax = _redoStackItems.length + _redoStackIncidents.length;
  for (let _guard = 0; _guard <= _guardMax; _guard++) {
    if (!_redoStackItems.length && !_redoStackIncidents.length) return;

    const _topItems = _redoStackItems.length ? _redoStackItems[_redoStackItems.length - 1] : null;
    const _topIncidents = _redoStackIncidents.length ? _redoStackIncidents[_redoStackIncidents.length - 1] : null;
    const _useIncidents = _topIncidents && (!_topItems || _topIncidents.seq > _topItems.seq);

    if (_useIncidents) {
      if (JSON.stringify({ incidents: INCIDENTS }) === _topIncidents.data) { _redoStackIncidents.pop(); continue; }
      _undoStackIncidents.push({ seq: ++_undoSeq, ts: Date.now(), data: JSON.stringify({ incidents: INCIDENTS }) });
      const _snap = JSON.parse(_redoStackIncidents.pop().data);
      _setIncidentsRaw(_snap.incidents);
    } else {
      if (JSON.stringify({ items: ITEMS }) === _topItems.data) { _redoStackItems.pop(); continue; }
      _undoStackItems.push({ seq: ++_undoSeq, ts: Date.now(), data: JSON.stringify({ items: ITEMS }) });
      const _snap = JSON.parse(_redoStackItems.pop().data);
      _setITEMS(_snap.items);
    }

    saveBacklog();
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
    renderStats();
    _updateUndoUI();
    showToast('info', '↪ Rehacer aplicado');
    return;
  }
  _updateUndoUI();
}

// TKT-202607-091: calcula disabled/title sobre la UNIÓN de ambos pares de stacks — botón
// deshabilitado solo cuando los cuatro stacks están vacíos, contador refleja el total
// combinado disponible para deshacer/rehacer.
export function _updateUndoUI() {
  const btnU = document.getElementById('btn-undo-backlog');
  const btnR = document.getElementById('btn-redo-backlog');
  const _undoTotal = _undoStackItems.length + _undoStackIncidents.length;
  const _redoTotal = _redoStackItems.length + _redoStackIncidents.length;
  if (btnU) { btnU.disabled = !_undoTotal; btnU.title = _undoTotal ? `Deshacer (${_undoTotal})  Ctrl+Z` : 'Sin acciones para deshacer'; }
  if (btnR) { btnR.disabled = !_redoTotal; btnR.title = _redoTotal ? `Rehacer (${_redoTotal})  Ctrl+Shift+Z` : 'Sin acciones para rehacer'; }
}

let backlogSearchQuery = '';

// T-202606-005 (T2): namespaces de filtro aislados por subtab — q-backlog y qinc tienen su
// propio state independiente del state global de Backlog (activeTypes/activeStatuses/etc).
// Cold start: todos los tipos/statuses habilitados, searchQuery vacío — sin herencia del global.
// TKT-A2: namespace de cola ITIL legacy reemplazado por 'qinc' — zona acepta INC/PRB/KE/CHG.
// TKT histórico (nsreset): _subtabNSDefaults — única fuente de verdad de types/statuses
// por namespace. _subtabNS (estado runtime) y _nsReset() consumen de aquí — antes cada uno
// tenía su propio literal duplicado, lo que permitió que qdisc.statuses quedara sin 'discovery'
// en un lado sin que el otro lo reflejara (INC histórico, mod:85). _nsReset('qinc') estaba
// además directamente roto: restauraba tipos/estados de REQ-TKT sobre un namespace ITIL.
const _subtabNSDefaults = {
  qbacklog: {
    types:    ['REQ','TKT'],
    // INC histórico: 'en-proceso'/'bloqueado'/'orphaned' agregados — estados válidos de
    // REQ (__BR-Ecosystem §5) ausentes del default original. Un REQ en Q-Backlog que transiciona
    // a 'en-proceso' (automático — primer TKT hijo sale de 'pendiente', ver __BR-Core §4) queda
    // sin statusOk en _renderZonePanel y desaparece de la lista, aunque zoneItems/badge/chips de
    // tipo sí lo cuentan (ninguno de los tres pasa por _activeStatusesZ). 'promoted' retirado —
    // status exclusivo de DISC (__BR-Ecosystem §5), nunca alcanzable por REQ/TKT; era cruft sin
    // efecto funcional, no parte del fix, pero incorrecto como declaración de estados válidos.
    statuses: ['pendiente','en-proceso','en-revision','bloqueado','orphaned','done','descartado']
  },
  qdisc: {
    types:    ['DISC'],
    // 'discovery': único status activo no-terminal de DISC — sin él, ninguna DISC activa
    // pasa statusOk en _renderZonePanel (locus-backlog-render.js).
    statuses: ['discovery','pendiente','en-revision','done','descartado','promoted']
  },
  qinc: {
    types:    ['INC','PRB','CHG'],
    statuses: ['detected','assigned','in_progress','resolved','closed','escalated_to_prb','escalated_to_chg','descartado']
  }
};

function _nsBuildFromDefaults(sub) {
  const def = _subtabNSDefaults[sub];
  return {
    types:    new Set(def.types),
    statuses: new Set(def.statuses),
    priority: new Set(),
    query:    '',
    // TKT-202607-011: single-select — string de área activa o null. Solo qdisc lo consume;
    // el campo existe en los tres namespaces por simetría de _nsBuildFromDefaults, sin uso
    // en qbacklog/qinc (no tienen chips de área).
    area:     null
  };
}

const _subtabNS = {
  qbacklog: _nsBuildFromDefaults('qbacklog'),
  qdisc:    _nsBuildFromDefaults('qdisc'),
  qinc:     _nsBuildFromDefaults('qinc')
};

// Getters de namespace por subtab
export function _nsGetTypes(sub)    { return _subtabNS[sub] ? _subtabNS[sub].types    : new Set(['TKT','REQ','INC','DISC']); }
export function _nsGetStatuses(sub) { return _subtabNS[sub] ? _subtabNS[sub].statuses : new Set(['pendiente','en-revision','discovery']); } // TKT-202606-006: fallback incluye 'discovery' — gobierna default visible de Q-DISC
export function _nsGetPriority(sub) { return _subtabNS[sub] ? _subtabNS[sub].priority : new Set(); }
export function _nsGetQuery(sub)    { return _subtabNS[sub] ? _subtabNS[sub].query    : ''; }
// TKT-202607-011: getter de área activa — null cuando no hay filtro de área aplicado.
export function _nsGetArea(sub)     { return _subtabNS[sub] ? _subtabNS[sub].area     : null; }

// Setters de namespace por subtab
export function _nsSetQuery(sub, q) {
  if (!_subtabNS[sub]) return;
  _subtabNS[sub].query = q;
}

// Toggle de tipo en namespace
export function _nsToggleType(sub, type) {
  if (!_subtabNS[sub]) return;
  const s = _subtabNS[sub].types;
  if (s.has(type)) { s.delete(type); } else { s.add(type); }
}

// Toggle de prioridad en namespace
export function _nsTogglePriority(sub, pri) {
  if (!_subtabNS[sub]) return;
  const s = _subtabNS[sub].priority;
  if (s.has(pri)) { s.delete(pri); } else { s.add(pri); }
}

// TKT-202607-011: toggle de área — single-select, no Set. `area` es el valor exacto del chip
// (string real de i.area, o el sentinel '__sin_area__' para el chip "Sin área" — ver
// locus-backlog-zone-engine.js). Click en la misma área activa limpia el filtro (null); click
// en otra área reemplaza el valor — nunca acumula, a diferencia de _nsToggleType/_nsTogglePriority.
export function _nsToggleArea(sub, area) {
  if (!_subtabNS[sub]) return;
  _subtabNS[sub].area = (_subtabNS[sub].area === area) ? null : area;
}

// Reset de namespace (todos los filtros al estado inicial) — restaura desde _subtabNSDefaults[sub],
// no un literal fijo: antes _nsReset('qinc') (único caller real, locus-backlog-render.js L1502)
// sobrescribía tipos/estados ITIL con los de REQ/TKT — bug corregido junto con el de qdisc.
export function _nsReset(sub) {
  if (!_subtabNS[sub] || !_subtabNSDefaults[sub]) return;
  const def = _subtabNSDefaults[sub];
  _subtabNS[sub].types    = new Set(def.types);
  _subtabNS[sub].statuses = new Set(def.statuses);
  _subtabNS[sub].priority = new Set();
  _subtabNS[sub].query    = '';
  _subtabNS[sub].area     = null; // TKT-202607-011
}
let _backlogSelectedCode = null; // T-202604-253: ítem seleccionado para Space → done
// T-202604-424: sprint eliminado como opción de sort — la agrupación por sprint es el modo de vista por defecto
// Opciones válidas: priority | effort | type | code | completedAt | createdAt
let backlogSortMode = 'priority';
let backlogSortDir = 'desc'; // T-072: asc | desc — default desc (nuevo → viejo)
let activeEfforts = new Set([1, 2, 3]); // T-071: todos activos por defecto
// T-202604-245: filtro por rol responsable — null = todos (sin filtro activo)
// activeRoleFilter eliminado — TKT1 REQ1 S'02 (feature desconectada, ver DISC/hallazgo previo)
// T-202604-357: filtro por prioridad — Set vacío = todos activos
let activePriorityFilter = new Set(); // vacío = sin filtro activo (todos visibles)
// T-202604-363: filtro Sin AC — pendientes sin criterios de aceptación
let _backlogNoAcMode = false;
// T-202604-339: vista Mike — filtro puntual T's pendientes del sprint activo (no persiste)
// T-202604-366: renombrado a Mi vista — filtro rotativo por rol con T's pendientes en sprint activo
let _backlogMikeMode = false;
let _miViewRoleIndex = 0; // índice del rol activo en la rotación

// T-202606-062: _backlogSprintGroupMode eliminado — _renderVistaLista es la vista por defecto
// T-202606-012: vistas árbol y plana eliminadas — vista C colapsable es la vista por defecto
// T-202607-027: _backlogViewModeRaw/_backlogKanbanMode removidos — Kanban deprecado
// T-202604-187: set de rCodes con bloque hijos colapsado
const _collapsedChildren = new Set();

// T-049: window.state de filtros mixtos
// TKT-A2: activeTypes por defecto incluye los 6 tipos Gen2 — PRB/CHG no quedan
// filtrados fuera por default aunque normalmente vivan en Q-INC, no en el Backlog regular.
let activeTypes = new Set(['TKT','REQ','INC','DISC','PRB','CHG']);
// T-202606-021: clave canónica para persistencia de activeStatuses
const _ACTIVE_STATUSES_KEY = 'locus-active-statuses';
function _loadActiveStatuses() {
  try {
    const raw = localStorage.getItem(_ACTIVE_STATUSES_KEY);
    if (!raw) return new Set(['pendiente', 'en-revision']);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return new Set(['pendiente', 'en-revision']);
    return new Set(parsed);
  } catch { return new Set(['pendiente', 'en-revision']); }
}
function _saveActiveStatuses() {
  try { localStorage.setItem(_ACTIVE_STATUSES_KEY, JSON.stringify([...activeStatuses])); } catch {}
}
let activeStatuses = _loadActiveStatuses(); // done oculto por defecto si no hay valor guardado

const VERSIONS_ORDER = ['v2.0.0','futura'];
const VERSION_LABELS = {
  'v2.0.0':'Sprint activo',
  'futura':'Versión futura — sin fecha'
};

// T-049: colapso por versión — persiste en localStorage
const _CV_KEY = 'backlog-collapsed-versions';
function _cvLoad() {
  try { return new Set(JSON.parse(localStorage.getItem(_CV_KEY) || '[]')); } catch { return new Set(); }
}
function _cvSave() {
  try { localStorage.setItem(_CV_KEY, JSON.stringify([...collapsedVersions])); } catch {}
}
const collapsedVersions = _cvLoad();

// T-202606-104: Modo R eliminado — Colapsar opera solo sobre headers de sección
export function toggleCollapseAll() {
  // Fix (founder, análisis de construcción — botón Colapsar de Backlog no hacía nada):
  // .version-group-body/.version-collapse-arrow eran los nombres previos a la unificación de
  // renderSprintGroup() (REQ Histórico unificado con Vista Lista de Backlog) — el motor de
  // render pasó a .bl-vl-sprint-body/.version-header-arrow pero esta función quedó apuntando
  // a las clases viejas, querySelectorAll devolvía NodeList vacío para los grupos de sprint sin
  // lanzar error. .section-group-body/.section-group-arrow (icebox/pendientes) siguen vigentes,
  // sin cambio.
  const bodies = document.querySelectorAll('.bl-vl-sprint-body, .section-group-body');
  const arrows = document.querySelectorAll('.version-header-arrow, .section-group-arrow');
  const btn = document.getElementById('bl-collapse-all-btn');
  const label = btn ? btn.querySelector('.bl-collapse-btn-label') : null;
  const icon = btn ? btn.querySelector('.bl-collapse-btn-icon') : null;

  const anySprintExpanded = Array.from(bodies).some(b => !b.classList.contains('collapsed'));

  if (anySprintExpanded) {
    // Colapsar todos los sprints/secciones
    bodies.forEach(b => {
      const id = b.id ? b.id.replace('vbody-', '') : null;
      b.classList.add('collapsed');
      if (id) collapsedVersions.add(id);
    });
    _cvSave();
    arrows.forEach(a => {
      if (a.classList.contains('section-group-arrow')) {
        a.classList.add('collapsed');
      } else {
        a.classList.add('collapsed');
        a.textContent = '▸';
      }
    });
    if (btn) btn.classList.add('is-collapsed');
    if (label) label.textContent = 'Expandir';
    if (icon) icon.textContent = '⊞';
  } else {
    // Expandir todos los sprints/secciones
    bodies.forEach(b => {
      const id = b.id ? b.id.replace('vbody-', '') : null;
      b.classList.remove('collapsed');
      if (id) collapsedVersions.delete(id);
    });
    _cvSave();
    arrows.forEach(a => {
      if (a.classList.contains('section-group-arrow')) {
        a.classList.remove('collapsed');
      } else {
        a.classList.remove('collapsed');
        a.textContent = '▾';
      }
    });
    if (btn) btn.classList.remove('is-collapsed');
    if (label) label.textContent = 'Colapsar';
    if (icon) icon.textContent = '⊟';
  }
}

// T-202606-087: toggleShowChildren — mostrar/ocultar hijos de Rs en vista árbol
// Persiste en localStorage bajo 'backlog-show-children' ('1' = activo, '0' = inactivo)
// T-202606-103: migrado de .bl-children-wrap → .bl-vl-req-body
export function toggleShowChildren(checked) {
  const childWraps = document.querySelectorAll('.bl-vl-req-body');
  if (checked) {
    childWraps.forEach(w => {
      if (w.children.length > 0) {
        w.classList.remove('collapsed');
      }
    });
  } else {
    childWraps.forEach(w => {
      w.classList.add('collapsed');
    });
  }
  try { localStorage.setItem('backlog-show-children', checked ? '1' : '0'); } catch {}
}

// T-202605-449: filtro por ítems con dependencias bloqueantes activas
// 0 = sin filtro | 1 = solo bloqueados | 2 = solo desbloqueados
let _depsFilter = 0;
export function toggleDepsFilter() {
  _depsFilter = (_depsFilter + 1) % 3;
  const btn = document.getElementById('fbar-deps-btn');
  const labels = ['🔗 Deps', '🔒 Bloqueados', '🔓 Libres'];
  if (btn) {
    btn.textContent = labels[_depsFilter];
    btn.classList.toggle('active', _depsFilter > 0);
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-202605-449: helper — ítems con blockedBy[] que aún no están done
export function _hasDepsBlocked(item) {
  if (!item.blockedBy || !item.blockedBy.length) return false;
  return item.blockedBy.some(c => {
    const dep = ITEMS.find(i => i.code === c);
    return !dep || dep.status !== 'done';
  });
}

// T-202604-261: ítem bloqueado — pendiente con sprint asignado y sin cambio de status en >14 días
const _BLOCKED_DAYS = 14;
export function _isBlocked(item) {
  if (!item || item.status !== 'pendiente') return false;
  if (!item.sprint) return false;
  if (!item.statusChangedAt) return false;
  const daysSince = (Date.now() - item.statusChangedAt) / 86400000;
  return daysSince > _BLOCKED_DAYS;
}

// T-202604-259: sin mención en sesión en últimos 14 días — solo pendiente con sprint asignado
const _NO_SESSION_DAYS = 14;
// Wrapper — delega a hasRecentSession() canónica (checkpoint.js)
// B-202604-200: ítems recientes sin mención retornan true via fallback createdAt en hasRecentSession
export function _hasRecentSession(item) {
  if (!item || item.status !== 'pendiente') return true; // no aplica
  if (!item.sprint) return true; // no aplica sin sprint — R-202605-046: campo ausente es canónico, guard 'n/a' eliminado
// guardia — función canónica no disponible
  // R-202605-041: excluir sesiones anteriores al createdAt del ítem al evaluar actividad reciente
  // Ítems legacy sin createdAt → comportamiento anterior sin cambio
  if (item.createdAt) {
    const allSessions = getAllSessions();
    const hasPostCreation = allSessions.some(s =>
      ((s.trackerRefs || []).includes(item.code) || (s.backlogRefs || []).includes(item.code)) &&
      (s.savedAt || 0) >= item.createdAt &&
      (Date.now() - (s.savedAt || 0)) / 86400000 <= _NO_SESSION_DAYS
    );
    return hasPostCreation;
  }
  const _hasRecentSessionCb = (_coreCallbacks || {}).hasRecentSession;
  return _hasRecentSessionCb ? _hasRecentSessionCb(item, _NO_SESSION_DAYS) : false;
}

// T-202604-297: prioridad automática desde señales del ítem — retorna 'high' | 'medium' | 'low'
// Reglas en orden de precedencia:
//   1. Tipo B → high
//   2. Sprint activo asignado → high
//   3. Effort 1 + cualquier sprint asignado → high
//   4. Sin sprint + effort 3 → low
//   5. Todo lo demás → medium
export function _calcPriority(item) {
  if (!item) return 'medium';
  if (itemKind(item) === 'INC') return 'high';
  if (item.sprint) {
    const sp = (_coreCallbacks.getSprintById || (() => null))(item.sprint);
    // T-202605-529: guard explícita — si el sprint asignado no tiene registro en getSprintById,
    // tratar el ítem como sin sprint asignado y continuar con lógica estándar por effort.
    // No retornar 'high' automáticamente por este caso (comportamiento implícito previo eliminado).
    if (sp === null || sp === undefined) {
      // Sprint asignado pero sin registro → calcular por effort sin elevación por sprint
      if (!item.sprint && parseInt(item.effort) === 3) return 'low';
      return 'medium';
    }
    const sprintIsOpen = sp.status === 'active';
    // B-202605-059: effort 1 → high solo si el sprint está activo — nunca en sprints cerrados
    if (sprintIsOpen) return 'high';
  }
  if (!item.sprint && parseInt(item.effort) === 3) return 'low';
  return 'medium';
}

// T-202604-297: aplicar prioridad calculada a todos los ítems pendientes
function _applyAllPriorities() {
  ITEMS.forEach(item => {
    if (item.status === 'pendiente') {
      item.priority = _calcPriority(item);
    }
  });
}

// T-202604-257: score de relevancia por ítem — retorna 0–100
// Señales: antigüedad, tipo, effort, sprint asignado, última mención en sesión, AC definidos
export function _calcRelevanceScore(item, allSessionsCache) { // B-202605-009: allSessionsCache evita O(n×m)
  if (!item || item.status !== 'pendiente') return 0;

  let score = 0;

  // 1. TIPO — urgencia intrínseca (0–25)
  // TKT-A2: PRB/KE/CHG agregados — viven en Q-INC, score relativo entre INC(25) y DISC(6)
  const typeScores = { INC: 25, TKT: 18, REQ: 12, PRB: 20, CHG: 10, DISC: 6 };
  const type = itemKind(item) || 'TKT';
  score += typeScores[type] ?? 10;

  // 2. SPRINT ASIGNADO (0–20)
  if (item.sprint) {
    const sp = (_coreCallbacks.getSprintById || (() => null))(item.sprint);
    if (sp && sp.status === 'active') score += 20;   // sprint activo
    else if (item.sprint)                 score += 6;  // sprint no registrado — heredado de import
  }

  // 3. EFFORT — favorece los fáciles de cerrar (0–15)
  const effortN = parseInt(item.effort) || 2;
  if (effortN === 1) score += 15;
  else if (effortN === 2) score += 8;
  // effort 3 = 0 puntos extra

  // 4. ANTIGÜEDAD — más viejo sube relevancia (0–20)
  if (item.createdAt) {
    const daysSinceCreation = Math.floor((Date.now() - item.createdAt) / 86400000);
    // Escala logarítmica: 0 días=0, 7 días=8, 30 días=14, 90+ días=20
    const ageScore = Math.min(20, Math.round(Math.log1p(daysSinceCreation / 7) * 9));
    score += ageScore;
  }

  // 5. ÚLTIMA MENCIÓN EN SESIÓN — reciente baja relevancia (evita doble trabajo), antigua sube (olvidado)
  // Rango: -10 a +10
  // B-202605-009: allSessionsCache ya calculado en _recalcAllScores — una llamada por ciclo, no una por ítem
  if (allSessionsCache && allSessionsCache.length) {
    let lastMentionTs = 0;
    allSessionsCache.forEach(s => {
      if ((s.backlogRefs || s.trackerRefs || []).includes(item.code)) {
        const ts = s.savedAt || s.createdAt || 0;
        if (ts > lastMentionTs) lastMentionTs = ts;
      }
    });
    if (lastMentionTs) {
      const daysSinceMention = Math.floor((Date.now() - lastMentionTs) / 86400000);
      if (daysSinceMention <= 2)  score -= 10; // trabajado reciente — baja prioridad
      else if (daysSinceMention <= 7)  score += 0;  // neutro
      else if (daysSinceMention <= 14) score += 5;  // algo olvidado
      else                             score += 10; // olvidado — sube
    }
    // Sin mención histórica: +5 (nunca referenciado = posiblemente olvidado desde import)
    else if (item.createdAt) score += 5;
  }

  // 6. AC DEFINIDOS — sin AC baja score (0 o +10)
  if (item.ac && item.ac.length > 0) score += 10;
  else score -= 5; // sin AC no es accionable

  return Math.max(0, Math.min(100, score));
}

// T-202604-257: recalcular score en todos los ITEMS pendientes y estamparlo en item._score
function _recalcAllScores() {
  // B-202605-009: una sola llamada a getAllSessions() por ciclo — no O(n×m)
  const _sessCache = getAllSessions();
  ITEMS.forEach(item => {
    item._score = (item.status === 'pendiente') ? _calcRelevanceScore(item, _sessCache) : 0;
  });
}

// B-202605-210: sanear ítems con status 'pendiente' en sprints cerrados.
// Un ítem pendiente en un sprint cerrado es data inconsistente — el sprint ya no
// puede trabajarse. Se desasigna el sprint (sprint → '') para que vuelva al
// backlog general sin asignar, conservando el status 'pendiente' y el history.
// Retorna la cantidad de ítems saneados para el log.
function _sanitizePendingInClosedSprints() {
  const closedSprintIds = new Set(
    getActiveSprints()
      .filter(s => s.status === 'closed')
      .map(s => s.id)
  );
  if (!closedSprintIds.size) return 0;
  let count = 0;
  ITEMS.forEach(item => {
    if (
      item.status === 'pendiente' &&
      item.sprint &&
      closedSprintIds.has(item.sprint)
    ) {
      if (!item.history) item.history = [];
      item.history.push({
        type: 'sprint',
        ts: Date.now(),
        data: { from: item.sprint, to: null, reason: 'sanitize-closed-sprint' }
      });
      delete item.sprint; // R-202605-046: campo ausente = canónico para "sin sprint"
      count++;
    }
  });
  // Segunda pasada: ítems con doneAt populado pero status distinto de done/descartado/historico
  // Causa: merge desde CHECKPOINT sobrescribió status sin respetar doneAt existente
  // B-202606-085: _mdiffDoApply no limpiaba doneAt al retroceder — produce en-revision + doneAt
  // B-202604 histórico: si el ítem tiene discardReason, el status correcto es 'descartado', no 'done'
  // B-202605-008: snapshot antes de mutar — resultado deshacible via undoBacklog()
  // B-202606-086: filtro ampliado — antes solo capturaba status 'pendiente', ahora captura cualquier
  //   status activo (pendiente, en-revision, bloqueado, etc.) con doneAt populado
  const pendingWithDoneAt = ITEMS.filter(item =>
    item.doneAt &&
    item.status !== 'done' &&
    item.status !== 'descartado' &&
    item.status !== 'historico'
  );
  if (pendingWithDoneAt.length > 0) _undoSnapshotItems();
  let revived = 0;
  pendingWithDoneAt.forEach(item => {
      const targetStatus = item.discardReason ? 'descartado' : 'done';
      item.status = targetStatus;
      if (!item.history) item.history = [];
      item.history.push({
        type: 'status',
        ts: Date.now(),
        data: { from: item.status, to: targetStatus, reason: 'sanitize-doneat-mismatch' }
      });
      revived++;
    });
  if (revived > 0) console.log(`[AI Tracker] sanitize-doneat-mismatch: ${revived} ítem(s) con doneAt populado restaurados a status correcto`);
  return count;
}

// T histórico: Purga inteligente de localStorage — ítems done/descartado >90 días
// Retorna el número de ítems purgados del caché local (no se eliminan de Supabase).
export function _localStorageUsageRatio() {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      total += (localStorage.getItem(k) || '').length;
    }
    // Límite conservador: 4.5MB (localStorage típico es 5MB por origen)
    return total / (4.5 * 1024 * 1024);
  } catch (_) { return 0; }
}

export function _purgeStaleBacklogCache() {
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - NINETY_DAYS_MS;
  const purgeable = ['done', 'descartado'];
  const before = ITEMS.length;

  // B-202605-045: snapshot antes de mutar para que la purga sea deshacible
  _undoSnapshotItems();

  // Filtrar del array en memoria — Supabase conserva el registro completo
  _setITEMS(ITEMS.filter(item => {
    if (!purgeable.includes(item.status)) return true; // nunca purgar pendientes/en-curso
    const ts = item.statusChangedAt || item.doneAt || 0;
    return ts > cutoff; // conservar si fue cerrado hace menos de 90 días
  }));

  const purged = before - ITEMS.length;
  if (purged > 0) {
    console.log(`[AI Tracker] _purgeStaleBacklogCache: ${purged} ítem(s) purgado(s) del caché local (>90 días done/descartado)`);
    // B-202605-045: persistir tras mutación para que el estado sea consistente
    saveBacklog();
  }
  return purged;
}

// T-202606-104: Purge permanente de ítems legacy (status historico sin sprint cerrado).
// Exportada para que locus-backlog-historico.js pueda invocarla desde el botón Purgar de la sección legacy.
// Elimina del array en memoria todos los ítems con status 'historico'.
// Acción irreversible (salvo undo inmediato) — requiere confirmación explícita.
export function purgeAllHistorico() {
  const historicos = ITEMS.filter(i => i.status === 'historico');
  if (!historicos.length) {
    showToast('info', 'No hay ítems históricos para purgar.');
    return;
  }
  (_coreCallbacks.gconfirmOpen || (() => {}))({
    title: 'Purgar archivo histórico',
    msg: `¿Eliminar permanentemente los ${historicos.length} ítem${historicos.length !== 1 ? 's' : ''} históricos? Esta acción no se puede deshacer después de guardar.`,
    okLabel: 'Purgar',
    danger: true
  }, () => {
    _undoSnapshotItems();
    const before = ITEMS.length;
    _setITEMS(ITEMS.filter(i => i.status !== 'historico'));
    const purged = before - ITEMS.length;
    saveBacklog();
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
    renderStats();
    console.log(`[AI Tracker] purgeAllHistorico: ${purged} ítem(s) histórico(s) eliminados permanentemente.`);
    showToast('success', `🗑 ${purged} ítem${purged !== 1 ? 's' : ''} histórico${purged !== 1 ? 's' : ''} eliminado${purged !== 1 ? 's' : ''}.`);
  });
}

// TKT-202607-062 (REQ-202607-016): _normalizeCommonFields — campos comunes a todo ítem
// (REQ/TKT/DISC/INC/PRB/KE/CHG): schema_version, code (solo warn), type, status, title/desc,
// id, history. Extraído del bloque compartido de la antigua _normalizeItems() — mismo
// comportamiento, sin regresión. Efecto lateral solo sobre el ítem recibido + DocLog.
function _normalizeCommonFields(item) {
  // ── schema_version ────────────────────────────────────────────────────────
  // Ítems sin campo → versión 0. Migrar a 1 (schema actual).
  if (item.schema_version === undefined) {
    item.schema_version = 1;
    _blogLog('normalize', item.code || '(sin código)', 'schema_version ausente → 1', 'backlog');
  }

  // ── code ──────────────────────────────────────────────────────────────────
  // code vacío o ausente: conservar ítem, registrar warning. No asignar código aquí
  // (los IDs los asigna Locus). Ítems con código temporal sin asignar — y su alias histórico tmp:slug — son válidos.
  if (!item.code) {
    _blogLog('normalize-warn', '(sin código)', 'code ausente — ítem conservado sin modificar', 'backlog');
  }

  // ── type ──────────────────────────────────────────────────────────────────
  // Ausente: inferir con itemKind() — usa prefijo de code contra GEN2_TYPES.
  // Sin default forzado: si itemKind retorna null, item.type queda undefined.
  if (!item.type) {
    const inferred = itemKind(item);
    if (inferred) {
      item.type = inferred;
      _blogLog('normalize', item.code || '(sin código)', `type inferido desde prefijo → ${item.type}`, 'backlog');
    } else {
      _blogLog('normalize-warn', item.code || '(sin código)', 'type ausente y no inferible — item.type queda undefined', 'backlog');
    }
  }

  // ── status ────────────────────────────────────────────────────────────────
  // ── T-202606-024: migración explícita de status "en curso" ─────────────────
  // "en curso" no es status válido según BR-Ecosystem §5. Migrar a "pendiente"
  // con entrada nominada en DocLog antes de la normalización genérica.
  if (item.status === 'en curso') {
    _blogLog('migrate', item.code || '(sin código)', 'status "en curso" → "pendiente" — no válido según BR-Ecosystem §5', 'backlog');
    item.status = 'pendiente';
  }

  // T-202606-047: normalizeStatus() es el punto canónico — VALID_STATUSES eliminado
  const rawStatus = item.status;
  const normalizedStatus = normalizeStatus(rawStatus, item.type);
  if (item.status !== normalizedStatus) {
    item.status = normalizedStatus;
    _blogLog('normalize', item.code || '(sin código)', `status "${rawStatus}" → "${normalizedStatus}"`, 'backlog');
  }

  // ── title ─────────────────────────────────────────────────────────────────
  // Ausente → '[sin título]'. Migración desc→title si title está vacío.
  if (item.desc !== undefined) {
    if (!item.title || item.title.trim() === '') {
      item.title = item.desc;
      _blogLog('normalize', item.code || '(sin código)', 'desc migrado a title', 'backlog');
    }
    delete item.desc;
  }
  if (!item.title || item.title.trim() === '') {
    item.title = '[sin título]';
    _blogLog('normalize-warn', item.code || '(sin código)', 'title ausente → "[sin título]"', 'backlog');
  }

  // ── discard_reason ────────────────────────────────────────────────────────
  // INC histórico: item.discardReason (camelCase) es el campo que escribe la
  // lógica de negocio in-memory (ver sanitize-doneat-mismatch más abajo en este
  // archivo) — la persistencia a Supabase lee discard_reason (snake_case, DDL
  // tracker_items / __BR-Ecosystem §5). Sin este puente, un ítem con
  // status:'descartado' llegaba a saveBacklog() con discard_reason:null y violaba
  // tracker_items_discard_reason_check (mod:114, locus-storage.js). Mismo patrón ya
  // resuelto para comportamiento_actual/origin_module en INC (TKT-202607-INC-NAMING)
  // — este puente cubre el caso análogo para la rama Planeada (DISC/REQ/TKT).
  if (item.discardReason && !item.discard_reason) {
    item.discard_reason = item.discardReason;
    _blogLog('normalize', item.code || '(sin código)', 'discardReason → discard_reason sincronizado', 'backlog');
  }

  // ── id ────────────────────────────────────────────────────────────────────
  // Ítems importados sin id: asignar id interno (no confundir con code).
  if (!item.id) {
    item.id = 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  }

  // ── history ───────────────────────────────────────────────────────────────
  if (!item.history) {
    item.history = [];
    if (item.statusChangedAt) {
      item.history.push({ type: 'status', ts: item.statusChangedAt, data: { to: item.status } });
    }
  }
}

// TKT-202607-062: pasada — migración sprint → sprint_id + sprint_name. Idempotente.
// Extraída sin cambio de comportamiento — se ejecuta igual sobre ITEMS e INCIDENTS
// (AC de contrato: el split no condiciona esta pasada por tipo de ítem).
// TKT0 (REQ-202607-026): el alias getter/setter de item.sprint ahora se reaplica en
// CADA pasada, incondicionalmente — ya no depende de que sprint_id sea undefined.
// Antes, una vez que sprint_id quedaba poblado (ej. tras el backfill de TKT1 en
// Supabase), el gate de idempotencia impedía volver a ejecutar Object.defineProperty:
// item.sprint quedaba como propiedad plana desconectada de sprint_id para siempre, y
// cualquier call site que hiciera item.sprint = X (locus-backlog-editor.js,
// locus-backlog-render.js, locus-backlog-sprints.js, locus-backlog-merge.js) dejaba de
// persistirse — regresión silenciosa en el flujo de asignación de sprint. El parseo y
// backfill de sprint_id/sprint_name sigue siendo idempotente (corre solo si sprint_id
// === undefined); solo el paso de defineProperty se volvió incondicional.
function _normalizeSprintFields(items) {
  // T-202606-084: migración sprint → sprint_id + sprint_name
  // Separa el campo sprint compuesto ('PP-S-01 · Nombre') en dos campos atómicos.
  // Idempotente: ítems ya migrados (sprint_id presente) no repiten el parseo/backfill.
  // item.sprint se conserva como alias de solo lectura = sprint_id (AC-4).
  items.forEach(item => {
    const alreadyMigrated = item.sprint_id !== undefined;

    if (!alreadyMigrated) {
      const raw = item.sprint; // puede ser string, undefined, null
      if (raw && typeof raw === 'string' && raw.trim() !== '') {
        const idx = raw.indexOf(' · ');
        if (idx !== -1) {
          item.sprint_id   = raw.slice(0, idx);
          item.sprint_name = raw.slice(idx + 3); // ' · ' es 3 chars
        } else {
          item.sprint_id   = raw;
          item.sprint_name = '';
        }
      } else {
        // Sin sprint (icebox canónico = campo ausente o vacío)
        item.sprint_id   = '';
        item.sprint_name = '';
      }

      _blogLog('migrate', item.code || '(sin código)',
        `sprint → sprint_id:"${item.sprint_id}" sprint_name:"${item.sprint_name}"`,
        'backlog');
    }

    // AC-4 + TKT0: item.sprint es alias getter/setter de sprint_id — reaplicado en
    // cada pasada, ya migrado el ítem o no, para que cualquier escritura posterior
    // vía item.sprint = X (aunque venga de un call site que no conoce sprint_id/
    // sprint_name) siga sincronizando sprint_id correctamente.
    Object.defineProperty(item, 'sprint', {
      get() { return this.sprint_id; },
      set(v) { this.sprint_id = v; },
      configurable: true,
      enumerable: true,
    });
  });
}

// TKT2 (REQ-202607-025): factory único de creación de ítem de backlog — garantiza
// sprint_id/sprint_name poblados desde el nacimiento del ítem, sin depender de que
// _normalizeScrumItems corra después (solo corre en carga inicial — TKT-202607-062).
// Reusa el mismo split ' · ' y el mismo contrato de alias que _normalizeSprintFields():
// item.sprint queda como getter/setter de sprint_id, nunca un campo plano paralelo.
// Función pura — no hace push ni I/O. El caller sigue siendo responsable de
// getItems().push(_newBacklogItem(fields)) / tgItems.push(_newBacklogItem(fields)).
export function _newBacklogItem(fields) {
  const item = { ...fields };

  // Resolver sprint_id/sprint_name — mismo criterio que _normalizeSprintFields:
  // (1) fields.sprint explícito tiene precedencia, (2) si no, heredar del parent
  // vía parentId, (3) si tampoco hay parent, Q-Backlog (sprint_id/sprint_name '').
  let raw = fields.sprint;
  if ((raw === undefined || raw === null || raw === '') && fields.parentId) {
    const _parent = getAnyItem(fields.parentId);
    if (_parent) raw = _parent.sprint_id !== undefined ? _parent.sprint_id : _parent.sprint;
  }

  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    const idx = raw.indexOf(' · ');
    if (idx !== -1) {
      item.sprint_id   = raw.slice(0, idx);
      item.sprint_name = raw.slice(idx + 3);
    } else {
      item.sprint_id   = raw;
      item.sprint_name = '';
    }
  } else {
    item.sprint_id   = '';
    item.sprint_name = '';
  }

  // AC de contrato — mismo mecanismo que _normalizeSprintFields(): item.sprint es
  // alias getter/setter de sprint_id, nunca un campo plano duplicado.
  delete item.sprint;
  Object.defineProperty(item, 'sprint', {
    get() { return this.sprint_id; },
    set(v) { this.sprint_id = v; },
    configurable: true,
    enumerable: true,
  });

  return item;
}

// TKT-202607-062: pasada — gate de asignación a Q-INC. Extraída sin cambio de
// comportamiento (misma AC de contrato que _normalizeSprintFields).
function _normalizeQincGate(items) {
  // TKT-A2: gate de asignación a Q-INC — solo INC/PRB/CHG pueden vivir en queue [Prefijo]-Q-INC.
  // BR-Core §6: Q-INC solo acepta INC/PRB/CHG — ningún REQ, TKT ni DISC puede asignarse a Q-INC.
  items.forEach(item => {
    if (!item.queue || !item.queue.endsWith('-Q-INC')) return;
    const _qincTypes = ['INC', 'PRB', 'CHG'];
    const _type = itemKind(item);
    if (!_qincTypes.includes(_type)) {
      _blogLog(
        'qinc-rejected',
        item.code || '(sin código)',
        `Q-INC solo acepta INC/PRB/CHG — ${_type || item.type} ${item.code || '(sin código)'} no puede asignarse a esta zona`,
        'backlog'
      );
      delete item.queue; // tipo no válido para Q-INC — queue limpiado
    }
  });
}

// TKT-202607-062: pasada — flag orphaned para REQ sin TKT hijo válido. No-op para
// tipos distintos de REQ (por diseño — sin condicionar por array de origen).
function _normalizeOrphanedFlag(items) {
  // T-202606-011: SUSPENDIDO — P pendiente de Vera (ciclo de vida de R sin Ts).
  // Degradación silenciosa R→P desactivada hasta que BR-Core §4 y BR-Ecosystem §5
  // definan el nuevo modelo: gate en parser + flag orphaned + P como único origen de R.
  // R existente sin Ts → flag orphaned:true, sin degradación de type.
  items.forEach(item => {
    if (item.type !== 'REQ') return;
    if (item.status === 'descartado') return;
    const _hasValidChild = items.some(i =>
      i.type === 'TKT' && i.parentId === item.code && i.status !== 'descartado'
    );
    if (!_hasValidChild) {
      item.orphaned = true;
      _blogLog('r-sin-ts', item.code || '(sin código)',
        (item.code || '(sin código)') + ' sin Ts válidos — marcado orphaned:true (degradación suspendida)',
        'backlog');
    } else {
      // Limpiar flag si el R recuperó hijos válidos
      if (item.orphaned) delete item.orphaned;
    }
  });
}

// R-202607-016 · TKT-202607-062: _normalizeScrumItems — normalización de la rama Planeada
// (REQ/TKT/DISC, __BR-Ecosystem §4b). Reemplaza a _normalizeItems() para este universo —
// mismas pasadas, mismo resultado, sin regresión. Función pura: no escribe en Supabase ni
// localStorage. Toda corrección se registra en DocLog via _blogLog.
export function _normalizeScrumItems(items) {
  if (!Array.isArray(items)) return [];
  items.forEach(_normalizeCommonFields);
  _normalizeSprintFields(items);
  _normalizeQincGate(items);
  _normalizeOrphanedFlag(items);
  return items;
}

// R-202607-016 · TKT-202607-062: _normalizeIncidents — normalización de la rama Reactiva
// (INC/PRB/KE/CHG, __BR-Ecosystem §4b). Ejecuta las mismas pasadas comunes + sprint +
// Q-INC + orphaned que _normalizeItems() ejecutaba hoy sobre INCIDENTS (sin condicionar
// por tipo de ítem — mismo comportamiento), y agrega validación de campos ITIL
// obligatorios (sla_priority · incident_status · comportamiento_actual — __BR-Ecosystem §5).
// Reemplaza el warning aislado de sla_priority de la antigua _normalizeItems(): un ítem
// con algún campo ausente se conserva sin descartarse y recibe item.itil_incomplete con
// los nombres de los campos faltantes — recalculado desde cero en cada pasada (no
// acumulativo), mismo patrón que el flag orphaned.
export function _normalizeIncidents(items) {
  if (!Array.isArray(items)) return [];
  items.forEach(_normalizeCommonFields);
  _normalizeSprintFields(items);
  _normalizeQincGate(items);
  _normalizeOrphanedFlag(items);

  // ── validación de campos ITIL obligatorios ──────────────────────────────────
  // INC histórico / TKT-202607-062: sla_priority, incident_status y
  // comportamiento_actual son obligatorios en todo INC/PRB/KE/CHG (__BR-Ecosystem §5).
  // No se asigna default de negocio — solo se deja el gap visible en DocLog + flag
  // legible por el editor (item.itil_incomplete), consistente con saveBacklog() (que
  // sigue excluyendo del upsert las filas sin sla_priority — gate independiente, no
  // duplicado aquí).
  items.forEach(item => {
    const missing = [];
    // TKT1 (REQ-centralizar-accesores-itil): fallback bidireccional centralizado en
    // locus-inc-fields.js — reemplaza el patrón `campo || campo_snake` inline que
    // introdujo el gap resuelto en TKT-202607-INC-NAMING (INC histórico).
    if (!incSlaPriority(item)) missing.push('sla_priority');
    if (!incIncidentStatus(item)) missing.push('incident_status');
    if (!incComportamientoActual(item)) missing.push('comportamiento_actual');

    if (missing.length) {
      item.itil_incomplete = missing;
      _blogLog('normalize-warn', item.code || '(sin código)',
        `INC sin ${missing.join(', ')} — itil_incomplete flag agregado`, 'backlog');
    } else if (item.itil_incomplete) {
      delete item.itil_incomplete;
    }
  });

  return items;
}

// Guard de re-entrada — evita recursión infinita entre renderStats() y loadBacklog()
// cuando ITEMS está vacío durante init y getItems aún no está registrado.
let _loadBacklogInFlight = false;

export function loadBacklog() {
  if (_loadBacklogInFlight) return;
  _loadBacklogInFlight = true;
  try {
  // R histórico: Supabase-first — si el usuario está autenticado, delegar a
  // _loadFromSupabase() que implementa lógica timestamp-first en su paso 5.
  // Migración one-shot (founder only): si localStorage tiene datos y Supabase está
  // vacío, _loadFromSupabase detecta ITEMS.length === 0 post-carga y no sobreescribe;
  // saveBacklog() al final del flujo empuja los datos locales a Supabase.
  if (isSupabaseAuthed()) {
    // Cargar localStorage como base inmediata (evita flash de backlog vacío)
    const s = localStorage.getItem(_tplKey('backlog-items'));
    if (s) { try { _setITEMS(JSON.parse(s)); } catch { _setITEMS([]); } } else { _setITEMS([]); }
    // Lanzar carga remota en background — _loadFromSupabase re-renderiza al terminar
    _loadFromSupabase();
    // Ejecutar migraciones locales sobre los datos inmediatos mientras Supabase responde
  } else {
    const s = localStorage.getItem(_tplKey('backlog-items'));
    if (s) { try { _setITEMS(JSON.parse(s)); } catch { _setITEMS([]); } } else { _setITEMS([]); }
  }
  // R-202605-070 / TKT-202607-062: normalizar contrato de datos antes de cualquier uso
  // downstream. _normalizeScrumItems absorbe: type, status, title/desc, id, history,
  // schema_version — mismo comportamiento que la antigua _normalizeItems() para ITEMS.
  _setITEMS(_normalizeScrumItems(ITEMS));
  // TKT-202607-005 / TKT-202607-062: INCIDENTS requiere la misma normalización de campos
  // comunes más la validación ITIL — _setITEMS() enruta ítems ITIL recibidos vía
  // _setIncidents() en el paso anterior (carga desde localStorage mezcla ambos tipos),
  // pero _setIncidents() no ejecuta normalización. Sin este paso, ítems ITIL cargados sin
  // schema_version/status normalizado ni itil_incomplete evaluado quedarían sin corregir.
  if (INCIDENTS.length) _setIncidents(_normalizeIncidents(INCIDENTS));

  // B-202606-016: sanear ítems con status:'historico' cuyo sprint no está cerrado.
  // Origen: normalizeStatus acepta 'historico' como canónico — si el dato llegó con
  // ese valor sin tener sprint cerrado, _normalizeItems lo pasa sin mutar.
  // Fix: detectar post-normalización, resetear a 'pendiente' y registrar en DocLog.
  {
    const closedIds = new Set(
      getActiveSprints().filter(s => s.status === 'closed').map(s => s.id)
    );
    let sanitizedHistorico = 0;
    ITEMS.forEach(i => {
      if (i.status === 'historico' && !closedIds.has(i.sprint)) {
        i.status = 'pendiente';
        sanitizedHistorico++;
        _blogLog('fix', i.code || '(sin código)',
          `B-202606-016: status:historico sin sprint cerrado → pendiente (sprint: ${i.sprint || '(sin sprint)'})`,
          'backlog');
      }
    });
    if (sanitizedHistorico > 0) {
      console.log(`[AI Tracker] B-202606-016: ${sanitizedHistorico} ítem(s) con status:historico inválido → pendiente`);
    }
  }

  // B-202605-210: sanear pendientes en sprints cerrados (migración retroactiva)
  const sanitized = _sanitizePendingInClosedSprints();
  if (sanitized > 0) {
    console.log(`[AI Tracker] B-202605-210: ${sanitized} ítem(s) pendiente(s) en sprints cerrados → desasignados`);
  }
  _applyAllPriorities(); // T-202604-297: recalcular prioridad automática al cargar
  _recalcAllScores();    // T-202604-257: estampar score en memoria tras cargar
  // Guardar siempre tras normalización — _normalizeScrumItems/_normalizeIncidents pueden
  // haber corregido campos
  saveBacklog();
  // AC aria tablist: sincronizar estado inicial de atributos aria desde variables de estado
  _syncViewAriaStates();
  // inline_fix: badges del sidebar no se poblaban al init — _updateSubtabBadges() solo
  // se llamaba reactivamente. shell:render-backlog-list dispara renderBacklogList() +
  // renderStats() + _updateSubtabBadges() sin introducir dependencia circular.
  // Path Supabase: _loadFromSupabase() ya despacha este evento al terminar (locus-storage.js:1461)
  // — este dispatch cubre el path localStorage y el snapshot inmediato del path Supabase.
  window.dispatchEvent(new CustomEvent('shell:render-backlog-list'));
  } finally {
    _loadBacklogInFlight = false;
  }
}

// TKT0-gen2: deriva el tipo del ítem — campo type explícito si existe,
// si no, prefijo multi-char Gen2 del code (REQ-/TKT-/DISC-/INC-/PRB-/KE-/CHG-).
// Reemplaza a itemType(code) — Gen1 derivaba por un solo carácter (T-049).
// Sin alias I→P: un code que empieza con 'I-' no resuelve a tipo válido.
// TKT-202607-005: agnóstica al array de residencia del ítem (ITEMS o INCIDENTS) — sin
// cambio de firma ni de lógica. Los 12 módulos consumidores (ver _Locus-module-contracts §1)
// siguen resolviendo tipo sin saber en qué array vive el ítem.
// TKT-202607-047: GEN2_TYPES local (duplicado de BACKLOG_TYPES+INCIDENT_TYPES, ambas ya
// exportadas más arriba en este archivo desde TKT-202607-005) eliminado — itemKind() ahora
// lee _ITEM_KIND_TYPES, derivada de BACKLOG_TYPES.concat(INCIDENT_TYPES), mismo orden exacto
// que el GEN2_TYPES local que reemplaza (REQ,TKT,DISC,INC,PRB,KE,CHG) — sin cambio de
// comportamiento. No se reutiliza _GEN2_TYPES (línea 218, con guion bajo) — esa constante es
// el universo de validación de locus-session-parse.js/locus-backlog-item.js y se conserva
// intacta, sin tocar, por instrucción explícita del TKT que la introdujo (TKT-202607-005).
const _ITEM_KIND_TYPES = BACKLOG_TYPES.concat(INCIDENT_TYPES);
export function itemKind(item) {
  if (!item) return null;
  if (item.type && _ITEM_KIND_TYPES.includes(item.type)) return item.type;
  const code = item.code || '';
  for (const t of _ITEM_KIND_TYPES) {
    if (code.startsWith(t + '-')) return t;
  }
  return null;
}

// TKT0-gen2: toggle filtros tipo — claves Gen2 (REQ/TKT/DISC/INC)
// T-049 (histórico): versión original operaba sobre T/R/B/P
// B-202604-146: reset explícito de filtros de tipo
function clearTypeFilters() {
  activeTypes = new Set(['TKT','REQ','INC','DISC','PRB','CHG']);
  updateTypeFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

export function toggleTypeFilter(type) {
  const allActive = activeTypes.size === 6; // TKT/REQ/DISC/INC/PRB/CHG
  if (allActive) {
    // primer click: desactiva todos, activa solo el clickeado
    activeTypes = new Set([type]);
  } else if (activeTypes.has(type)) {
    // click en activo: si es el único, restaura todos
    if (activeTypes.size === 1) {
      activeTypes = new Set(['TKT','REQ','INC','DISC','PRB','CHG']);
    } else {
      activeTypes.delete(type);
    }
  } else {
    // click en inactivo con otros ya activos: acumula
    activeTypes.add(type);
  }
  updateTypeFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  // T-202604-364: filter-pulse feedback
  requestAnimationFrame(() => {
    document.querySelectorAll('.bl-fc-type-' + type).forEach(el => {
      el.classList.remove('filter-pulse');
      void el.offsetWidth;
      el.classList.add('filter-pulse');
      el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true });
    });
  });
}
function updateTypeFilterUI() {
  // [tmp:tkt-typefilter-gen2]: iteración sobre 7 códigos Gen2 — Gen1 (T/R/B/P) eliminados
  ['REQ','TKT','INC','DISC','PRB','CHG'].forEach(t => {
    const btn = document.getElementById('ftype-' + t);
    if (btn) btn.classList.toggle('active', activeTypes.has(t));
    // chips accionables en stats bar
    const chip = document.querySelector(`.stat-type-chip.tc-${t}`);
    if (chip) chip.classList.toggle('active', activeTypes.has(t));
  });
  // B-UX: indicar visualmente cuando todos los tipos están activos = estado neutro "sin filtro"
  const sTypesEl = document.querySelector('.stat-card.s-types');
  if (sTypesEl) sTypesEl.classList.toggle('s-types--all-active', activeTypes.size === 6);
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
}

// T-049: toggle filtros status
// Histórico: descartado sincroniza promoted — bloque Cerradas unificado
export function toggleStatusFilter(status) {
  if (status === 'done' || status === 'descartado') {
    if (activeStatuses.has(status)) {
      activeStatuses.delete(status);
      if (status === 'descartado') activeStatuses.delete('promoted');
    } else {
      activeStatuses.add(status);
      if (status === 'descartado') activeStatuses.add('promoted');
    }
  } else {
    // pendiente y en-revision: no toggleable a off si es el único activo
    if (activeStatuses.has(status)) {
      if (activeStatuses.size > 1) activeStatuses.delete(status);
    } else {
      activeStatuses.add(status);
    }
  }
  _saveActiveStatuses();
  updateStatusFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  // T-202604-364: filter-pulse feedback
  requestAnimationFrame(() => {
    const btnId = status === 'done' ? 'fstatus-done' : status === 'descartado' ? 'fstatus-descartado' : status === 'en-revision' ? 'fstatus-en-revision' : 'fstatus-pendiente';
    const el = document.getElementById(btnId);
    if (el) { el.classList.remove('filter-pulse'); void el.offsetWidth; el.classList.add('filter-pulse'); el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true }); }
  });
}
export function updateStatusFilterUI() {
  const pendBtn = document.getElementById('fstatus-pendiente');
  if (pendBtn) pendBtn.classList.toggle('active', activeStatuses.has('pendiente'));
  const enRevBtn = document.getElementById('fstatus-en-revision');
  if (enRevBtn) enRevBtn.classList.toggle('active', activeStatuses.has('en-revision'));
  const doneBtn = document.getElementById('fstatus-done');
  if (doneBtn) doneBtn.classList.toggle('active', activeStatuses.has('done'));
  const discBtn = document.getElementById('fstatus-descartado');
  if (discBtn) discBtn.classList.toggle('active', activeStatuses.has('descartado'));
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
}

// T-051: colapso por versión
export function toggleVersionCollapse(v) {
  if (collapsedVersions.has(v)) collapsedVersions.delete(v);
  else collapsedVersions.add(v);
  _cvSave();
  const body = document.getElementById('vbody-' + v);
  const arrow = document.getElementById('varrow-' + v);
  if (body) body.classList.toggle('collapsed', collapsedVersions.has(v));
  if (arrow) arrow.textContent = collapsedVersions.has(v) ? '▸' : '▾';
}

// T-202604-118: generar siguiente código disponible por tipo
// B-202605-ids: acepta reservedCodes (Set) para evitar colisiones dentro de una misma
// pasada de _assignPendingIds — los ítems nuevos aún no están en ITEMS cuando se llama
// en batch, por lo que sin este parámetro todos obtienen el mismo número.
// INC histórico fix (triggered_by INC-202607-001): el escaneo de maxNum filtraba por
// prefix `${typeChar}-${yyyymm}-` del MES EN CURSO — al cambiar de mes, maxNum arrancaba en 0
// sin considerar el NNN más alto de meses anteriores del mismo tipo. __BR-Ecosystem §4 exige
// contador acumulativo por tipo, independiente del mes. Ahora se escanea por tipo únicamente
// (regex sin yyyymm fijo) y el yyyymm del código nuevo sigue siendo el del momento de emisión.
// TKT1 (REQ-historico-async): pasa a async — un código archivado en historico podía
// reasignarse a un ítem nuevo del mismo tipo porque el escaneo solo cubría ITEMS/INCIDENTS
// (activos) + reservedCodes. Ahora, tras el escaneo activo, se hace await refreshHistoricoCache()
// y se suma getHistoricoItemsSync() al cómputo de maxNum antes de generar el código — mismo
// projId implícito (activo) que ya usan ITEMS/INCIDENTS en este módulo. Si refreshHistoricoCache()
// rechaza, se captura el error y se continúa solo con lo ya escaneado (ITEMS/INCIDENTS +
// reservedCodes) — comportamiento idéntico al de antes de este TKT, sin excepción no controlada
// ni promesa colgada. Todo call site pasa a requerir await — ver TKT2/TKT3 (contract_update).
export async function _getNextItemCode(typeChar, reservedCodes) {
  if (!typeChar || !_GEN2_TYPES.includes(typeChar)) {
    console.warn(`_getNextItemCode: typeChar "${typeChar}" no es un tipo canónico (${_GEN2_TYPES.join('/')}). Código no generado.`);
    return null;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yyyymm = `${year}${month}`;
  // INC histórico fix: regex de tipo sin mes fijo — acumulativo por tipo, todos los meses.
  // Sufijo de letra opcional (ej. REQ-202606-007-A) ignorado — se toma solo el bloque de 3 dígitos.
  const typeRe = new RegExp(`^${typeChar}-\\d{6}-(\\d{3})(?:-[A-Za-z]+)?$`);
  let maxNum = 0;
  const _scanForCollision = (arr) => {
    arr.forEach(item => {
      if (!item.code) return;
      const numMatch = item.code.match(typeRe);
      if (numMatch) {
        const num = parseInt(numMatch[1]);
        if (num > maxNum) maxNum = num;
      }
    });
  };
  // TKT-202607-005: buscar colisión de código en el array donde el tipo realmente reside —
  // ITIL (INCIDENT_TYPES) vive en INCIDENTS, backlog (BACKLOG_TYPES) vive en ITEMS. Antes de
  // la separación ambos vivían en ITEMS y una sola iteración bastaba.
  const _sourceArr = INCIDENT_TYPES.includes(typeChar) ? INCIDENTS : ITEMS;
  _scanForCollision(_sourceArr);
  // TKT1 (REQ-historico-async): historico combina ambos universos (backlog + ITIL) — mismo
  // criterio ya documentado para _getCountableBaseForSubtab('qinc') en el header de este módulo.
  try {
    await refreshHistoricoCache();
  } catch (err) {
    console.warn('_getNextItemCode: refreshHistoricoCache() falló — generando código solo contra ITEMS/INCIDENTS activos + reservedCodes', err);
  }
  _scanForCollision(getHistoricoItemsSync());
  // B-202605-ids: también considerar códigos ya reservados en esta pasada (no están en ITEMS aún)
  if (reservedCodes && reservedCodes.size) {
    reservedCodes.forEach(rc => {
      if (!rc) return;
      const numMatch = rc.match(typeRe);
      if (numMatch) {
        const num = parseInt(numMatch[1]);
        if (num > maxNum) maxNum = num;
      }
    });
  }
  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${typeChar}-${yyyymm}-${nextNum}`;
}

// B-202606-032: helper compartido — consume _getCountableBase() (T-202606-100)
// Misma fuente canónica que renderStats() — garantiza universo idéntico entre banner y stats.
function _getCountableForBanner() {
  return _getCountableBase();
}

// T-048: actualizar banner
export function updateBacklogBanner() {
  const banner    = document.getElementById('backlog-meta-banner');
  const exportBtn = document.getElementById('export-backlog-btn');
  const gfItems   = document.getElementById('gf-items');
  const _bannProjId = _coreCallbacks.getActiveProjectFilter?.() || localStorage.getItem('current-project-filter') || '';
  if (!_bannProjId || !ITEMS.length) {
    if (!_bannProjId || !ITEMS.length) {
      if (banner)    banner.classList.remove('visible');
      if (exportBtn) exportBtn.classList.add("is-hidden");
      if (gfItems)   gfItems.classList.add('is-hidden');
      return;
    }
  }
  if (banner) banner.classList.add('visible');
  // Mostrar botón exportar solo si estamos en tab backlog
  if (exportBtn && getCurrentTab() === 'backlog') exportBtn.classList.remove("is-hidden")

  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('bmeta-version', meta.version || '—');
  // T-202606-099: badge de conteo en gf-* — misma lógica que bmeta-total
  // B-202606-032: usar _getCountableForBanner() — excluye históricos, descartados y sprints cerrados
  // T-[tmp:tkt-contador-unificado]: contador unificado en #gf-items — mismo criterio de universo que bmeta-total/renderStats()
  const _bannerBase = _getCountableForBanner();
  const _countForBanner = _bannerBase.length;
  const _doneForBanner = _bannerBase.filter(i => i.status === 'done').length;
  const label = _countForBanner + ' ítem' + (_countForBanner !== 1 ? 's' : '') + ' · ' + _doneForBanner + ' done';
  if (gfItems)  { gfItems.textContent = label; gfItems.classList.remove('is-hidden'); }
}

// Actualizar el indicador de importado cada minuto
// T-[tmp:tkt-contador-unificado]: gate currentTab==='backlog' removido — #gf-items vive en el footer global, visible en todos los tabs
setInterval(() => {
  updateBacklogBanner();
}, 60000);

// INC histórico (triggered_by: auditoría de código — n/a ejecución): consolidado como fuente
// única del ecosistema para badgeClass/badgeLabel/statusClass/statusLabel — locus-backlog-item.js
// tenía copias locales divergentes que generaban clases CSS inexistentes (badge-prio-*,
// badge-status-pendiente) en el render de child items. Exportadas para que item.js las consuma.
export function badgeClass(p) {
  return {high:'badge-high', medium:'badge-medium', low:'badge-low',
          critical:'badge-high', important:'badge-high', mejora:'badge-medium',
          futura:'badge-low'}[p] || 'badge-area';
}
export function badgeLabel(p) {
  return {high:'Alto', medium:'Medio', low:'Bajo',
          critical:'Alto', important:'Alto', mejora:'Medio', futura:'Bajo'}[p] || p;
}
export function statusClass(s) {
  // B-202605-229: historico agregado como status canónico
  // T-202605-040: en-revision agregado como status canónico
  // TKT CAEL-0731-03: orphaned agregado como status canónico
  return {'pendiente':'badge-status-backlog','en-revision':'badge-status-en-revision','done':'badge-status-done','descartado':'badge-status-descartado','historico':'badge-status-historico','orphaned':'badge-status-orphaned'}[s] || 'badge-status-backlog';
}
export function statusLabel(s) {
  // B-202605-229: historico agregado como status canónico
  // T-202605-040: en-revision agregado como status canónico
  // TKT CAEL-0731-03: orphaned agregado como status canónico
  return {'pendiente':'Pendiente','en-revision':'En revisión','done':'Hecho','descartado':'Descartado','historico':'Histórico','orphaned':'Huérfano'}[s] || s;
}

// B-245: helper para obtener el aiId de la sesión activa al momento de registrar en history[]
export function _getActiveSessionAiId() {
  const _st = getState();
  if (!_st) return null;
  const ai = (_st.ais || []).find(a => !a.archived && _isInSession(a));
  return ai ? ai.id : null;
}

// T-202604-066: cambio de status inline
export function setItemStatus(code, newStatus) {
  // [tmp:tkt4-status-guard]: getAnyItem — antes ITEMS.find() excluía INC/PRB/KE/CHG,
  // no-op silencioso sin feedback en los 6 call sites de UI que dependen de esta función.
  const item = getAnyItem(code);
  if (!item || item.status === newStatus) return;

  // [tmp:tkt4-status-guard]: solo INC/PRB — su ciclo de vida (detected/assigned/
  // in_progress/resolved/closed/active) vive en incident_status, incompatible con el
  // vocabulario Scrum que el resto de esta función asume. CHG es la excepción dentro de
  // INCIDENT_TYPES: usa exactamente pendiente/en-revision/done/descartado per
  // __BR-Ecosystem §5 — debe seguir fluyendo por esta vía sin bloqueo.
  const _ITIL_SCRUM_INCOMPATIBLE = ['INC', 'PRB'];
  if (_ITIL_SCRUM_INCOMPATIBLE.includes(itemKind(item))) {
    showToast('info', 'Status ITIL se cambia desde Q-INC', 'No disponible en este panel.');
    _resetStatusSelect(code, item.status);
    return;
  }

  // Descarte: siempre requiere confirmación
  if (newStatus === 'descartado') {
    // Resetear el select visualmente antes de que el modal confirme
    _resetStatusSelect(code, item.status);
    (_coreCallbacks.confirmDiscard || (() => {}))(code, '', '');
    return;
  }

  // Retroceso done → pendiente/backlog: requiere confirmación
  if (item.status === 'done' && (newStatus === 'pendiente' || newStatus === 'backlog' || newStatus === 'in-progress')) {
    _resetStatusSelect(code, item.status);
    (_coreCallbacks.confirmRetroceso || (() => {}))(code, newStatus);
    return;
  }

  // T-202605-449: advertir si se marca done con bloqueadores pendientes — no bloquea la acción
  if (newStatus === 'done' && _hasDepsBlocked(item)) {
    const pendingBlockers = (item.blockedBy || []).filter(c => {
      const dep = ITEMS.find(i => i.code === c);
      return !dep || dep.status !== 'done';
    });
    const msg = pendingBlockers.length === 1
      ? `⚠ ${pendingBlockers[0]} aún pendiente — ¿marcar done igual?`
      : `⚠ ${pendingBlockers.length} bloqueadores pendientes — ¿marcar done igual?`;
    // T-202605-008: reemplazar confirm() nativo por _gconfirmOpen
    const prevStatus = item.status;
    _resetStatusSelect(code, prevStatus);
    (_coreCallbacks.gconfirmOpen || (() => {}))({
      msg,
      danger: false,
      okLabel: 'Marcar done',
      onConfirm: () => _applyStatusChange(code, newStatus, prevStatus),
      onCancel: () => {}
    });
    return;
  }

  // T-A4b: marcar done en sprint activo — inline confirm no-bloqueante (Variante B)
  if (newStatus === 'done') {
    const activeSprint = (_coreCallbacks.getActiveSprint || (() => null))();
    const itemInActiveSprint = activeSprint && item.sprint && item.sprint === activeSprint.id;
    if (itemInActiveSprint) {
      _showInlineConfirmDone(code);
      return;
    }
  }

  const _prevStatus = item.status;
  _applyStatusChange(code, newStatus, _prevStatus);
}

// T-202606-027: C8 — animación de salida extraída para evitar duplicación entre _applyStatusChange y _applyDoneStatus
function _applyExitAnimOrRender(code, rCode) {
  if (!activeStatuses.has('done')) {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.classList.add('item-exit-anim');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
        if (rCode) window.dispatchEvent(new CustomEvent('shell:backlog-r-auto-advanced', { detail: { rCode } }));
        renderStats();
        window.dispatchEvent(new CustomEvent('shell:render-sprint-tab'));
      }, 360); // T-202605-058 T-202605-044
      return;
    }
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  if (rCode) window.dispatchEvent(new CustomEvent('shell:backlog-r-auto-advanced', { detail: { rCode } }));
  renderStats();
  window.dispatchEvent(new CustomEvent('shell:render-sprint-tab')); // T-202605-058 T-202605-044
}

// B-202606-039: transiciones automáticas de status en R padre al avanzar T hijo
// B-202606-040: retroceso en-revision → en-proceso cuando T hijo sale de done
// TKT1 (REQ-202607-021 · consolidación de sync REQ↔hijos, aprobado por founder — opción B
// del criterio de resolución de raíz): única implementación de la regla — reemplaza a
// _checkAndAdvanceParentR (ex locus-backlog-item.js), que duplicaba esta misma lógica con
// criterio divergente (esa versión sí incluía INC como hijo válido de REQ; esta no lo hacía
// hasta este TKT). Unificado: hijos válidos = TKT + INC, vía getAnyItem() en vez de
// ITEMS.find() — antes esta función nunca disparaba si el ítem que cambió era un INC con
// parentId a un REQ (patrón legacy, ver __BR-Ecosystem §6 nota de compatibilidad).
// Reglas (BR-Core §4 · BR-Ecosystem §5):
//   pendiente → en-proceso: cuando cualquier T/INC hijo cambia desde pendiente a cualquier status ≠ descartado
//   en-proceso → en-revision: cuando todos los T/INC hijos no-descartados están done
//   en-revision → en-proceso: cuando un T/INC hijo retrocede de done — ya no todos los hijos están done
// Idempotente: no modifica R en done/descartado. Hijo descartado ignorado en todas las transiciones.
// Batch-safe: evalúa el estado completo de hijos en el momento de la llamada — no acumula.
// Invariant de consolidación: esta es la ÚNICA función que puede mutar parent.status por
// transición automática — cualquier función que mute el status de un TKT/INC (incluyendo
// _applyDoneStatus, que antes NO la invocaba — ese gap era la causa raíz del REQ que se
// quedaba en 'pendiente' pese a tener sus hijos done, ver INC de referencia) debe llamarla.
// TKT1 (REQ CAEL-0720-01): función pura — decide el status que le corresponde a un REQ
// según su status actual y el snapshot de status de sus hijos declarados (TKT/INC, incluye
// descartados). Sin side effects — no muta, no loguea, no toca history[]. Única fuente de
// la regla de transición automática (BR-Core §4 · BR-Ecosystem §5) — reemplaza la lógica
// antes duplicada entre _syncParentRStatus (este archivo) y _checkAndOrphanParentR
// (locus-backlog-item.js), que la reutiliza importándola de aquí.
// Reglas:
//   done / bloqueado / descartado → null siempre (BR-Core §4: nunca se derivan de los hijos)
//   sin hijos declarados → null (nada que evaluar)
//   todos los hijos declarados en 'descartado' → 'orphaned' (salvo que ya lo esté → null)
//   todos los hijos activos (no descartados) en 'done' → 'en-revision' (salvo que ya lo esté → null)
//   reqStatus 'en-revision' y no todos los activos done → 'en-proceso' (retroceso)
//   reqStatus 'pendiente' y algún hijo activo != 'pendiente' → 'en-proceso'
//   reqStatus 'en-proceso' y todos los hijos activos en 'pendiente' → 'pendiente' (reversión,
//   TKT1 REQ-054-fix/DISC-202607-054, infra_version 70 — simétrica a pendiente→en-proceso)
//   cualquier otro caso → null (sin cambio)
// Refinamiento declarado sobre el comportamiento anterior de _syncParentRStatus (TKT1,
// ver CHECKPOINT de la sesión): la transición pendiente→en-proceso pasaba por `newTStatus
// !== 'descartado'` (dato del evento que disparó la llamada) — permitía que un hijo recién
// creado todavía en 'pendiente' igual disparara el avance del padre. Esta función deriva la
// misma transición solo del snapshot ('algún hijo activo distinto de pendiente'), que es la
// lectura literal de BR-Core §4 ("primer TKT hijo cambia status DESDE pendiente") y es la
// única variante evaluable sin datos de evento — condición necesaria para que TKT2 (recálculo
// en render, sin evento disponible) reutilice esta misma función sin necesitar `newTStatus`.
export function _computeRStatusFromChildren(reqStatus, childrenStatuses) {
  if (reqStatus === 'done' || reqStatus === 'bloqueado' || reqStatus === 'descartado') return null;
  if (!Array.isArray(childrenStatuses) || childrenStatuses.length === 0) return null;

  const activeChildren = childrenStatuses.filter(s => s !== 'descartado');

  if (activeChildren.length === 0) {
    return reqStatus === 'orphaned' ? null : 'orphaned';
  }

  const allDone = activeChildren.every(s => s === 'done');
  if (allDone) {
    return reqStatus === 'en-revision' ? null : 'en-revision';
  }

  if (reqStatus === 'en-revision') return 'en-proceso';

  if (reqStatus === 'pendiente' && activeChildren.some(s => s !== 'pendiente')) return 'en-proceso';

  // TKT1 (REQ-054-fix/DISC-202607-054): reversión simétrica a pendiente→en-proceso — cierra
  // el gap donde un REQ en-proceso quedaba huérfano indefinidamente si todos sus hijos activos
  // regresaban a pendiente (ej. reapertura de un 'done' erróneo). __BR-Core §4, infra_version 70.
  if (reqStatus === 'en-proceso' && activeChildren.every(s => s === 'pendiente')) return 'pendiente';

  return null;
}

export function _syncParentRStatus(changedItemCode, newTStatus) {
  // TKT2 (REQ CAEL-0720-10): parent/parentId es exclusivo de TKT (__BR-Ecosystem §5) — revierte
  // el widen a INC introducido en mod:79 de module-contracts (motivado por un bug real de
  // sync ausente en _applyDoneStatus, no por una decisión de ampliar qué cuenta como hijo de
  // REQ). getAnyItem() se conserva porque sigue siendo el lookup correcto — solo se filtra el
  // tipo del ítem resuelto, no la función de resolución.
  const changedItem = getAnyItem(changedItemCode);
  if (!changedItem || itemKind(changedItem) !== 'TKT' || !changedItem.parentId) return;

  const parent = ITEMS.find(i => i.code === changedItem.parentId && itemKind(i) === 'REQ');
  if (!parent) return;

  // AC-5 (B-039): REQ ya en done o descartado — no modificar (_computeRStatusFromChildren
  // también lo cubre, pero el guard explícito evita el filter/concat de siblings si no hace falta)
  if (parent.status === 'done' || parent.status === 'descartado') return;

  // TKT2 (REQ CAEL-0720-10): solo TKT — ya no concatena INCIDENTS, ningún INC cuenta como
  // sibling activo del REQ padre.
  const activeSiblings = ITEMS.filter(i =>
    itemKind(i) === 'TKT' && i.parentId === parent.code && i.status !== 'descartado'
  );

  // AC-4 (B-039): R sin Ts activos — no ejecutar ninguna transición. Nota: al filtrar por
  // activeSiblings antes de llamar a la función pura, esta ruta nunca puede producir
  // 'orphaned' (childrenStatuses siempre llega sin descartados) — igual que antes del TKT1,
  // orphaned sigue siendo responsabilidad exclusiva de _checkAndOrphanParentR.
  if (activeSiblings.length === 0) return;

  const prevParentStatus = parent.status;
  const nextStatus = _computeRStatusFromChildren(prevParentStatus, activeSiblings.map(i => i.status));
  if (!nextStatus) return null;

  let reason, label;
  if (nextStatus === 'en-revision') {
    reason = 'auto-all-children-done';
    label = 'todos los Ts hijos done';
  } else if (prevParentStatus === 'en-revision') {
    reason = 'auto-child-retroceded';
    label = 'T hijo retrocedió de done';
  } else {
    reason = 'auto-child-advanced';
    label = 'T hijo avanzó';
  }

  parent.status = nextStatus;
  parent.statusChangedAt = Date.now();
  if (!parent.history) parent.history = [];
  parent.history.push({ type: 'status', ts: parent.statusChangedAt, data: { from: prevParentStatus, to: nextStatus, reason } });
  _blogLog('status-auto →', parent.code, prevParentStatus + ' → ' + nextStatus + ' (' + label + ')', 'backlog');
  return parent.code; // B-202606-009: señal para micro-flash en pill del R
}

// T-202605-008: lógica de mutación extraída para ser llamada desde _gconfirmOpen y flujo directo
function _applyStatusChange(code, newStatus, prevStatus) {
  // [tmp:tkt4-status-guard]: getAnyItem — defensa en profundidad. setItemStatus() ya
  // rechaza ítems ITIL antes de llegar aquí; este cambio evita que una llamada directa
  // futura a _applyStatusChange (sin pasar por el guard) corrompa un INC/PRB/KE/CHG.
  const item = getAnyItem(code);
  if (!item) return;
  item.status = newStatus;
  item.statusChangedAt = Date.now();
  if (newStatus === 'done' && !item.doneAt) item.doneAt = Date.now();
  // B-[tmp:closed-version]: persistir versión activa al cerrar ítem
  if (newStatus === 'done' || newStatus === 'descartado') {
    item.closedInVersion = _effectiveVersion();
  }
  // Capa 2 — done sin sprint (Q-Backlog): alerta informativa per BR-Ecosystem §5 (suave — no bloquea)
  if (newStatus === 'done' && (!item.sprint || item.sprint === '')) {
    setTimeout(() => showToast('warning', `${code} marcado done sin sprint asignado — asignar a sprint para trazabilidad correcta.`, null, 6000), 400);
  }
  // R-202604-015: registrar cambio en history[]
  if (!item.history) item.history = [];
  item.history.push({ type: 'status', ts: item.statusChangedAt, aiId: _getActiveSessionAiId() || undefined, data: { from: prevStatus, to: newStatus, role: item.role || '' } });
  if (newStatus === 'pendiente') item.priority = _calcPriority(item); // T-202604-297
  _recalcAllScores(); // T-202604-257: recalcular scores tras cambio de status
  // B-202606-039: sincronizar status del R padre si el ítem cambiado es un T hijo
  // B-202606-009: capturar rCode si hubo transición automática para micro-flash post-render
  const _autoAdvancedRCode = _syncParentRStatus(code, newStatus);
  // R-202604-051 + T-202605-449: al marcar done, notificar ítems que quedaron desbloqueados
  if (newStatus === 'done') {
    const nowUnblocked = [];
    ITEMS.forEach(dep => {
      if (dep.status === 'pendiente' && dep.blockedBy && dep.blockedBy.includes(code)) {
        if (!dep.history) dep.history = [];
        dep.history.push({ type: 'unblocked', ts: Date.now(), data: { by: code } });
        // Verificar si con este done el ítem queda completamente desbloqueado
        const stillBlocked = dep.blockedBy.filter(c => {
          if (c === code) return false; // este acaba de hacerse done
          const blocker = ITEMS.find(i => i.code === c);
          return !blocker || blocker.status !== 'done';
        });
        if (stillBlocked.length === 0) nowUnblocked.push(dep.code);
      }
    });
    if (nowUnblocked.length) {
      const label = nowUnblocked.length === 1
        ? `🔓 ${nowUnblocked[0]} desbloqueado`
        : `🔓 ${nowUnblocked.length} ítems desbloqueados: ${nowUnblocked.join(', ')}`;
      setTimeout(() => showToast('success', label, null, 4000), 400);
    }
  }
  _undoSnapshotItems();
  _blogLog('status →', code, prevStatus + ' → ' + newStatus, 'backlog');
  saveBacklog();
  // C8: animación salida delegada — T-202606-027
  // B-202606-009: emitir shell:backlog-r-auto-advanced si el R padre avanzó automáticamente
  if (newStatus === 'done') _applyExitAnimOrRender(code, _autoAdvancedRCode);
  else {
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
    if (_autoAdvancedRCode) window.dispatchEvent(new CustomEvent('shell:backlog-r-auto-advanced', { detail: { rCode: _autoAdvancedRCode } }));
    renderStats();
    window.dispatchEvent(new CustomEvent('shell:render-sprint-tab'));
  }
}

function _resetStatusSelect(code, currentStatus) {
  // Resetea el select al valor actual mientras el modal está abierto
  const selects = document.querySelectorAll('.item-status-select');
  selects.forEach(sel => {
    if (sel.getAttribute('onchange') && sel.getAttribute('onchange').includes("'" + code + "'")) {
      sel.value = currentStatus;
    }
  });
}

// T-A4b: inline confirm no-bloqueante para marcar done un ítem en sprint activo
function _showInlineConfirmDone(code) {
  // [inline_fix triggered_by tkt4-status-guard]: mismo patrón — segundo mecanismo de
  // "marcar done" independiente del panel (fila de lista / sprint view).
  const item = getAnyItem(code);
  if (!item) return;

  // Resetear select visualmente mientras el confirm está visible
  _resetStatusSelect(code, item.status);

  // T-202607-027: fallback .kb-card removido — Kanban deprecado, Vista Lista es la única vista
  const itemEl = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
  if (!itemEl) {
    // Fallback: si no hay elemento en DOM, aplicar directamente
    _applyDoneStatus(code);
    return;
  }

  // Limpiar confirm previo si existe en este elemento
  const existing = itemEl.querySelector('.item-inline-confirm');
  if (existing) existing.remove();

  // Construir los botones inline
  const confirmEl = document.createElement('div');
  confirmEl.className = 'item-inline-confirm';
  confirmEl.innerHTML =
    `<button class="item-inline-confirm__accept" data-code="${code}">Marcar done</button>` +
    `<button class="item-inline-confirm__cancel" data-code="${code}">Cancelar</button>`;

  itemEl.appendChild(confirmEl);

  // Trigger de entrada con requestAnimationFrame para que la transición CSS aplique
  requestAnimationFrame(() => {
    requestAnimationFrame(() => confirmEl.classList.add('is-visible'));
  });

  // Auto-cancelación a 6s
  const autoCancel = setTimeout(() => _dismissInlineConfirm(itemEl, code), 6000);

  confirmEl.querySelector('.item-inline-confirm__accept').addEventListener('click', () => {
    clearTimeout(autoCancel);
    _dismissInlineConfirm(itemEl, code);
    _applyDoneStatus(code);
  });

  confirmEl.querySelector('.item-inline-confirm__cancel').addEventListener('click', () => {
    clearTimeout(autoCancel);
    _dismissInlineConfirm(itemEl, code);
  });
}

function _dismissInlineConfirm(itemEl, code) {
  const confirmEl = itemEl && itemEl.querySelector('.item-inline-confirm');
  if (!confirmEl) return;
  confirmEl.classList.remove('is-visible');
  // Remover del DOM tras la transición de salida — fallback si transitionend no dispara (B-202605-006)
  const fallback = setTimeout(() => confirmEl.remove(), 400);
  confirmEl.addEventListener('transitionend', () => { clearTimeout(fallback); confirmEl.remove(); }, { once: true });
}

// T-A4b: micro-flash Variante A — cambio inmediato sin confirmación
function _flashStatusConfirmed(code) {
  const itemEl = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
  if (!itemEl) return;
  itemEl.classList.remove('item-status-confirmed');
  // Forzar reflow para reiniciar la animación si ya estaba activa
  void itemEl.offsetWidth;
  itemEl.classList.add('item-status-confirmed');
  itemEl.addEventListener('animationend', () => itemEl.classList.remove('item-status-confirmed'), { once: true });
}

// T-A4b: aplica el cambio de status a done — ejecutado tras confirmación inline o directo en Variante A
// B-202606-097 fix: Rs no pueden ir a done desde la UI — requieren sesión de cierre de Finn
// (BR-Core §4 · ciclo de vida de R). El CHECK constraint chk_status_by_type de Postgres
// fue actualizado (B-202606-100) para permitir 'done' en type:R — el upsert ya no falla
// con error 23514 para este caso. El gate de origen sigue siendo JS: solo un patch dentro
// de un CHECKPOINT con role 'QA · Finn' puede pasar authorized=true. Cualquier llamada desde
// UI (_showInlineConfirmDone, fallback sin DOM) nunca pasa authorized — sigue bloqueada.
export function _applyDoneStatus(code, authorized) {
  // [inline_fix triggered_by tkt4-status-guard]: getAnyItem — mismo patrón que setItemStatus.
  const item = getAnyItem(code);
  if (!item || item.status === 'done') return;

  // [inline_fix triggered_by tkt4-status-guard]: mismo guard que setItemStatus — INC/PRB
  // nunca llegan a 'done' por esta vía (vocabulario incompatible, __BR-Ecosystem §5). CHG sí
  // puede — usa done como estado Scrum válido.
  const _ITIL_SCRUM_INCOMPATIBLE_DONE = ['INC', 'PRB'];
  if (_ITIL_SCRUM_INCOMPATIBLE_DONE.includes(itemKind(item))) {
    setTimeout(() => showToast('info', `${code} — status ITIL se cambia desde Q-INC`, 'No disponible desde esta acción.'), 0);
    return;
  }

  // Gate de tipo REQ — done solo es válido si llega autorizado (patch de Finn vía CHECKPOINT).
  // Cualquier otro origen (UI manual, drag&drop, IDP) sigue bloqueado sin excepción.
  if (itemKind(item) === 'REQ' && authorized !== true) {
    setTimeout(() => showToast('warning', `${code} es un REQ — no puede marcarse done desde la UI. Requiere sesión de cierre de Finn (BR-Core §4).`, null, 7000), 0);
    return;
  }

  const _prevStatus = item.status;
  item.status = 'done';
  item.statusChangedAt = Date.now();
  if (!item.doneAt) item.doneAt = Date.now();
  item.closedInVersion = _effectiveVersion();
  // Capa 2 — done sin sprint (Q-Backlog): alerta informativa per BR-Ecosystem §5 (suave — no bloquea)
  if (!item.sprint || item.sprint === '') {
    setTimeout(() => showToast('warning', `${code} marcado done sin sprint asignado — asignar a sprint para trazabilidad correcta.`, null, 6000), 400);
  }
  if (!item.history) item.history = [];
  item.history.push({ type: 'status', ts: item.statusChangedAt, aiId: _getActiveSessionAiId() || undefined, data: { from: _prevStatus, to: 'done', role: item.role || '' } });
  _recalcAllScores();

  // TKT1 (REQ-202607-021): sincronizar el R padre — ausente hasta este TKT. _applyStatusChange
  // ya lo hacía (línea ~1919), pero _applyDoneStatus (usada por el flujo real de "marcar done"
  // desde UI — _showInlineConfirmDone — y por el patch de CHECKPOINT con authorized:true) nunca
  // la invocaba. Consecuencia: un TKT marcado done desde el botón inline nunca propagaba el
  // avance automático al REQ padre (BR-Core §4), aunque el mismo flujo vía CHECKPOINT sí lo
  // hacía porque el caller externo (applyPatchesFromTG) llamaba _checkAndAdvanceParentR aparte.
  // Con la sincronización dentro de la mutación misma, ningún caller puede volver a omitirla.
  _syncParentRStatus(code, 'done');

  // Notificar ítems desbloqueados
  const nowUnblocked = [];
  ITEMS.forEach(dep => {
    if (dep.status === 'pendiente' && dep.blockedBy && dep.blockedBy.includes(code)) {
      if (!dep.history) dep.history = [];
      dep.history.push({ type: 'unblocked', ts: Date.now(), data: { by: code } });
      const stillBlocked = dep.blockedBy.filter(c => {
        if (c === code) return false;
        const blocker = ITEMS.find(i => i.code === c);
        return !blocker || blocker.status !== 'done';
      });
      if (stillBlocked.length === 0) nowUnblocked.push(dep.code);
    }
  });
  if (nowUnblocked.length) {
    const label = nowUnblocked.length === 1
      ? `🔓 ${nowUnblocked[0]} desbloqueado`
      : `🔓 ${nowUnblocked.length} ítems desbloqueados: ${nowUnblocked.join(', ')}`;
    setTimeout(() => showToast('success', label, null, 4000), 400);
  }

  _undoSnapshotItems();
  _blogLog('status →', code, _prevStatus + ' → done', 'backlog');
  saveBacklog();

  // Micro-flash Variante A/B antes de que el render remueva el elemento
  _flashStatusConfirmed(code);

  // C8: animación salida delegada — T-202606-027
  _applyExitAnimOrRender(code);
}
export function effortDots(n) {
  let h = '';
  for (let i = 0; i < 3; i++) h += `<div class="effort-dot${i < n ? ' filled' : ''}"></div>`;
  return h;
}

// R-202606-033: Rs con hijos cuentan como ítems vivos — tienen AC de coherencia propios.
// Solo P queda excluida de contadores de trabajo activo.
export function _isCountableItem(i) {
  if (itemKind(i) === 'DISC') return false; // DISC (discoveries) no contaminan contadores de trabajo activo
  return true;
}

// Gen2 — zonas Q-Backlog y Q-DISC. Consumidas por _getCountableBaseForSubtab() (este archivo)
// y por los paneles Q-Backlog / Q-DISC en locus-backlog-render.js (Cluster C).
export function _isQBacklog(i) {
  return (itemKind(i) === 'REQ' || itemKind(i) === 'TKT') && (!i.sprint || i.sprint === '');
}
export function _isQDisc(i) {
  return itemKind(i) === 'DISC' && (!i.sprint || i.sprint === '');
}

// TKT1 REQ2 S'02 — universo activo de Q-Backlog/Q-DISC: excluye ítems ya resueltos
// (descartado/promoted) que _isQBacklog/_isQDisc no filtran. Usadas exclusivamente
// por _renderZonePanel (isZone) y _updateSubtabBadges en locus-backlog-render.js —
// _isQBacklog/_isQDisc originales no se tocan, sus demás call sites (vista Lista)
// mantienen su semántica amplia actual.
// TKT1 (REQ-202607-026 · AC2): items con draft:true excluidos de la vista activa de
// Q-Backlog — reciben código real y persisten (locus-backlog-item.js mergeBacklogFromTG),
// pero no deben aparecer en renderQBacklogPanel ni en el badge tpl-badge-qbacklog hasta
// que Finn los avale (draft:false). _isQBacklog (semántica amplia, sin tocar) sigue
// incluyéndolos — solo la vista "activa" los excluye, por diseño de este AC.
export function _isQBacklogActive(i) {
  return _isQBacklog(i) && !i.draft && i.status !== 'descartado' && i.status !== 'historico';
}
export function _isQDiscActive(i) {
  return _isQDisc(i) && i.status !== 'descartado' && i.status !== 'promoted' && i.status !== 'historico';
}

// TKT-202607-010 (TKT2 REQ-202607-006): límite duro de Q-DISC — __BR-Ecosystem §5 ("Límite:
// 15 DISCs activos simultáneos"). Fuente única — consumida por locus-backlog-qdisc.js
// (indicador de header) y locus-backlog-item.js (mergeBacklogFromTG, enforcement de
// creación). Vive aquí, no en qdisc.js, para que item.js pueda importarla sin crear un
// ciclo (item.js → qdisc.js → locus-backlog-zone-engine.js → item.js ya existe hoy).
export const QDISC_ACTIVE_LIMIT = 15;

// TKT-C1b: _isIcebox wrapper transitorio eliminado — locus-backlog-render.js mod:45 (TKT-C1)
// ya no la importa. __BR-Execution §2 Sin retrocompatibilidad.

// [tmp:tkt-isqinc-unify]: función exportada única para detectar ítems ITIL de Q-INC.
// Consolida _isQInc (locus-backlog-render.js renderBacklogList) y _isQIncItem
// (locus-backlog-render.js renderQIncPanel) — locus-backlog-render.js importa esta.
// Patrón análogo a _isQBacklog / _isQDisc.
// TKT2 (REQ-refactor-item-shape-itil-scrum, parent sin código confirmado (histórico, pre-convención ref_id)
// en Locus): discriminador híbrido queue+itemKind eliminado. _setITEMS()/_setIncidents()
// (líneas ~380-401) garantizan por invariant de escritura que ningún ítem ITIL persiste en
// ITEMS — cualquier ítem con itemKind() en INCIDENT_TYPES se enruta a INCIDENTS al mutar,
// nunca coexiste en ambos arrays. itemKind() ya es el discriminador canónico de tipo en todo
// el módulo (ver _setITEMS, _getCountableBaseForSubtab) — el chequeo sobre `queue` era
// redundante cuando itemKind() coincide, y una fuente de falso positivo cuando no (ítem con
// campo `queue` residual de un tipo Scrum con dato legacy/corrupto). Ver __BR-Ecosystem §4b —
// queue es campo exclusivo de INC/PRB/KE/CHG por schema; itemKind() ya lo respeta sin
// necesitar leer el campo directamente.
export function isQIncItem(i) {
  return INCIDENT_TYPES.includes(itemKind(i));
}

// T-202606-100: _getCountableBase() — función canónica compartida entre renderStats() y _getCountableForBanner()
// Retorna ITEMS filtrado por: _isCountableItem === true · status !== descartado · status !== historico
//   · sprint no en closedSprintIds · NOT (status === done AND sin sprint o sprint === icebox)
// renderStats() y updateBacklogBanner()/_getCountableForBanner() consumen este array base
// antes de aplicar sus propios filtros internos — garantiza universo idéntico entre ambas funciones.
// T-202606-008 AC2 — único consumidor del universo "backlog": no se modifica ni se extiende a otros subtabs.
export function _getCountableBase() {
  const closedSprintIds = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  return ITEMS.filter(i =>
    _isCountableItem(i) &&
    i.status !== 'descartado' &&
    i.status !== 'historico' &&
    !(i.sprint && closedSprintIds.has(i.sprint)) &&
    !(i.status === 'done' && (!i.sprint || i.sprint === ''))
  );
}

// T-202606-008 — universo de stats-bar por subtab activo. AC1/AC2/AC6/edge-historico.
// no_incluye T-202606-008: no extiende _getCountableBase() — cada subtab usa su propio
// filtro directo sobre ITEMS, declarado explícitamente por AC en lugar de heredar
// exclusiones diseñadas para el universo del backlog regular (T-202606-100).
// Gen2: subtabs q-backlog y q-disc reemplazan a icebox.
export function _getCountableBaseForSubtab(sub) {
  if (sub === 'q-backlog') {
    // universo Q-Backlog: REQ/TKT sin sprint asignado
    return ITEMS.filter(i => _isQBacklog(i) && i.status !== 'descartado' && i.status !== 'historico');
  }
  if (sub === 'q-disc') {
    // universo Q-DISC: DISC sin sprint asignado
    return ITEMS.filter(i => _isQDisc(i) && i.status !== 'descartado' && i.status !== 'historico');
  }
  if (sub === 'qinc') {
    // TKT-202607-005: universo Q-INC vive en INCIDENTS, no en ITEMS, desde la separación.
    // isQIncItem() se conserva — sigue siendo válida como discriminador de tipo/queue,
    // ahora evaluada sobre el array donde estos ítems realmente residen.
    return INCIDENTS.filter(i => isQIncItem(i) && i.status !== 'descartado' && i.status !== 'historico');
  }
  if (sub === 'historico') {
    // Edge case AC — universo Histórico: status historico, excluido explícitamente de _getCountableBase().
    // TKT-202607-005: histórico puede originarse en cualquiera de los dos arrays — combinar.
    return ITEMS.filter(i => i.status === 'historico').concat(INCIDENTS.filter(i => i.status === 'historico'));
  }
  // AC2 — Backlog (default): comportamiento preservado sin cambios
  return _getCountableBase();
}

export function renderStats() {
  // T-202606-098 (T1): renderStats() es exclusiva del subtab Backlog.
  // Icebox/Qinc/Histórico tienen sus propias funciones de stats-bar (renderIceboxStats,
  // renderQincStats, renderHistoricoStats) — invocadas desde sus propios call sites.
  // Early-return para cualquier subtab distinto de 'backlog'.
  const _activeSub = getCurrentSubTab ? getCurrentSubTab() : 'backlog';
  if (_activeSub !== 'backlog') return;

  const _rsProjId = _coreCallbacks.getActiveProjectFilter?.() || localStorage.getItem('current-project-filter') || '';
  if (!_rsProjId) { document.getElementById('stats-bar').innerHTML = ''; return; }
  // TKT-202608-247 (REQ-202608-097): early-return por ITEMS.length===0 retirado — antes
  // blanqueaba #stats-bar cuando el proyecto no tenía ítems, violando el patrón "siempre
  // visible, ceros si vacío" ya vigente en Q-Backlog/Discoveries/Histórico. El resto de la
  // función ya calcula ceros de forma natural sobre countableItems/visible vacíos — sin
  // rama especial necesaria.

  // Delegation para stats-bar — se registra una sola vez
  const statsBarEl = document.getElementById('stats-bar');
  if (statsBarEl && !statsBarEl._delegationAttached) {
    statsBarEl._delegationAttached = true;
    statsBarEl.addEventListener('click', function _statsBarClick(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const act = btn.dataset.action;
      if (act === 'stats-clear-types') {
        clearTypeFilters();
      } else if (act === 'stats-type-filter') {
        toggleTypeFilter(btn.dataset.type);
      } else if (act === 'stats-priority-filter') {
        window.dispatchEvent(new CustomEvent('shell:togglePriorityFilter', { detail: { val: btn.dataset.priority } }));
      } else if (act === 'stats-effort-filter') {
        toggleEffortFilter(parseInt(btn.dataset.effort, 10));
      } else if (act === 'stats-effort-missing') {
        toggleEffortFilter(0);
      } else if (act === 'stats-toggle-types') {
        // TKT2 (popover Tipos): el botón vive dentro del innerHTML re-renderizado — delegación
        // obligatoria, un addEventListener directo se perdería en cada renderStats().
        const pop = document.getElementById('blt-popover');
        const trigger = document.getElementById('bstats-types-btn');
        if (pop && trigger) {
          const willOpen = pop.hasAttribute('hidden');
          if (willOpen) { pop.removeAttribute('hidden'); trigger.setAttribute('aria-expanded', 'true'); }
          else { pop.setAttribute('hidden', ''); trigger.setAttribute('aria-expanded', 'false'); }
        }
      }
    });
    // TKT2: click-fuera para blt-popover — mismo patrón capture-phase usado en locus-ui-shell.js
    // para search-unified-results. Registrado junto con la delegación — una sola vez.
    document.addEventListener('click', function _bltOutsideClick(e) {
      const pop = document.getElementById('blt-popover');
      const trigger = document.getElementById('bstats-types-btn');
      if (!pop || pop.hasAttribute('hidden')) return;
      if (e.target.closest('.blt-wrap')) return;
      pop.setAttribute('hidden', '');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }, true);
  }

  // T-202606-048: leer estado de colapso persistido


  // T-202606-048 AC 6/7: obtener sprint activo — metadata se calcula sobre ítems del sprint activo.
  const _activeSprint = (_coreCallbacks && _coreCallbacks.getActiveSprint) ? _coreCallbacks.getActiveSprint() : null;

  // Universo countable de Backlog
  const countableItems = _getCountableBaseForSubtab('backlog');

  // B-202606-008: incluir búsqueda activa — los contadores deben reflejar
  // los mismos ítems que aparecen en la lista, incluyendo el filtro de búsqueda.
  const _q = (backlogSearchQuery || '').trim().toLowerCase();
  const _matchesSearch = _q
    ? i => i.code.toLowerCase().includes(_q) || (i.title || '').toLowerCase().includes(_q) || (i.area || '').toLowerCase().includes(_q)
    : () => true;

  const visible = countableItems.filter(i => {
    const type = itemKind(i);
    const typeOk = type ? activeTypes.has(type) : true;
    // INC-[ref_id:QA-0724-01]: mismo criterio que locus-backlog-render.js (_renderVistaLista) —
    // este universo debe reflejar los mismos ítems que la lista (ver comentario B-202606-008
    // arriba en esta misma función). 'bloqueado' siempre cuenta, sin depender del filtro activo.
    // INC-[ref_id:QA-0724-03]: 'en-proceso' agregado al mismo tratamiento siempre-visible que
    // 'bloqueado' (QA-0724-01) — self-heal (_computeRStatusFromChildren) puede dejar un REQ en
    // 'en-proceso' sin camino de reversión a 'pendiente' si el hijo que disparó la transición
    // vuelve después a 'pendiente'; activeStatuses global nunca tuvo chip para 'en-proceso' (a
    // diferencia del namespace qbacklog, que ya lo corrigió agregándolo a sus statuses default —
    // ver _subtabNSDefaults, ~L672-680). Founder confirmó el caso real (REQ-202607-022, hijo
    // TKT-202607-086 en pendiente, REQ invisible en Backlog Vista Lista con filtro Pendiente activo).
    const statusOk = i.status === 'bloqueado' || i.status === 'en-proceso' || activeStatuses.has(i.status);
    return typeOk && statusOk && _matchesSearch(i);
  });

  // Por prioridad (sobre visibles)
  const c = {high:0, medium:0, low:0};
  visible.forEach(i => {
    const p = i.priority;
    if (p === 'high' || p === 'important' || p === 'critical' || p === 'importante') c.high++;
    else if (p === 'low' || p === 'futura' || p === 'baja') c.low++;
    else c.medium++;
  });

  // Por tipo (sobre visibles)
  const byType = {INC:0, TKT:0, REQ:0, DISC:0, PRB:0, CHG:0};
  visible.forEach(i => { const t = itemKind(i); if (t && byType[t] !== undefined) byType[t]++; });

  // Por effort (sobre visibles)
  const byEffort = {1:0, 2:0, 3:0};
  visible.forEach(i => { const e = parseInt(i.effort)||1; if (byEffort[e] !== undefined) byEffort[e]++; });
  // R-202605-122 AC5 (histórico): contador de ítems sin effort (excluye DISC e históricos)
  const noEffortCount = countableItems.filter(i => !i.effort && itemKind(i) !== 'DISC' && i.status !== 'historico').length;

  // T-202606-048 AC 7: Backlog sin sprint activo — render simplificado
  if (!_activeSprint) {
    // TKT-202608-247 (REQ-202608-097): wrapper .bl-header-unified > .stats-bar agregado —
    // mismo patrón que el happy path de abajo (Opción A: contenido del mensaje sin cambio).
    document.getElementById('stats-bar').innerHTML = `
      <div class="bl-header-unified"><div class="stats-bar"><span class="stats-bar-no-sprint">Sin sprint activo</span></div></div>
    `;
    updateTypeFilterUI();
    return;
  }

  // T-202606-048 AC 6: métricas sobre ítems del sprint activo


  // T-202606-096: universo canónico — activos = countableItems (pendiente + en-revision + done)
  // INC-202607-XXX: 'en-proceso' y 'bloqueado' sumados al bucket "pendientes" — mismo criterio
  // que 'visible' (statusOk, arriba en esta función) ya trata a ambos como siempre-contables.
  // Antes de este fix, un REQ en 'en-proceso' (transición automática al iniciar el primer TKT
  // hijo, __BR-Core §4) o 'bloqueado' aparecía en la lista renderizada pero no sumaba en ningún
  // bucket del stats-bar (ni pendientes, ni en revisión, ni hechos) — total quedaba por debajo
  // del conteo real de ítems visibles. Caso real: REQ-202607-022 en 'en-proceso' con hijo
  // TKT-202607-086 'pendiente' — founder reportó "1 pendientes 3 hechos" sin reflejar el REQ.
  const backlogCount    = countableItems.filter(i => i.status === 'pendiente' || i.status === 'en-proceso' || i.status === 'bloqueado').length;
  const enRevisionCount = countableItems.filter(i => i.status === 'en-revision').length;
  const done            = countableItems.filter(i => i.status === 'done').length;
  // T-202606-048 AC 6: done/total sobre sprint activo

  const total = backlogCount + enRevisionCount + done;
  // pct eliminada — TKT2 REQ1 S'02 (calculada, nunca leída en el render)
  // Contador separado de P (ideas) — visible pero fuera del flujo de trabajo activo
  // T-202606-100: closedSprintIds disponible via _getCountableBase() — recalcular inline para Ps (no pasan _isCountableItem)
  const _closedIdsForP = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  // T-202606-102: excluir promoted — pIdeasCount solo cuenta DISC con status pendiente
  // TKT-202606-006: 'pendiente' → 'discovery' — vocabulario DISC alineado a __BR-Ecosystem §5
  const pIdeasCount = ITEMS.filter(i => itemKind(i) === 'DISC' && !(_closedIdsForP.size && _closedIdsForP.has(i.sprint)) && i.status === 'discovery').length;
  // _emitidos, _descartadosTotal, _promovidasTotal, _cerradosSinTrabajo, _doneTotal,
  // _activosTotal eliminadas — TKT2 REQ1 S'02 (calculadas, nunca leídas en el render)

  // UX-redesign: stats bar en una sola fila compacta — pendientes primero (foco en trabajo activo)
  const _hasPending = (backlogCount + enRevisionCount) > 0;

  // T-202606-048 AC 6 · TKT1-sprint-display-2: label metadata de sprint activo vía _sprintDisplay()
  document.getElementById('stats-bar').innerHTML = `
    <div class="bl-header-unified">
    <div class="stats-bar">
    <div class="stats-row stats-row--compact">
      <!-- Bloque de conteos: pendientes primero -->
      <div class="stat-compact-counts">
        <div class="stat-compact-item stat-compact-item--primary">
          <span class="stat-compact-n${backlogCount > 0 ? ' stat-compact-n--primary' : ' stat-compact-n--muted'}">${backlogCount}</span>
          <span class="stat-compact-l">pendientes</span>
        </div>
        ${enRevisionCount > 0 ? `<div class="stat-compact-item stat-compact-item--revision">
          <span class="stat-compact-n stat-compact-n--revision">${enRevisionCount}</span>
          <span class="stat-compact-l">en revisión</span>
        </div>` : ''}
        <div class="stat-compact-item stat-compact-item--done">
          <span class="stat-compact-n${_hasPending ? ' stat-compact-n--muted stat-compact-n--sm' : ''}">${done}</span>
          <span class="stat-compact-l">hechos</span>
        </div>
      </div>
      <!-- Separador -->
      <div class="stat-compact-sep"></div>
      <!-- Popover Tipos — TKT2 (REQ-clutter-backlog): consolida chips de tipo -->
      <!-- INC-[tmp:inc-activetypechipcount]: _activeTypeChipCount = tipos EXCLUIDOS del filtro (6 - activeTypes.size).
           Asunción declarada por Rune (sin AC del founder disponible): 0 cuando no hay filtro activo (los 6 tipos
           seleccionados) — coincide con la condición ya usada en la línea del "✕ mostrar todos" (activeTypes.size < 6)
           y con is-hidden aplicado cuando el valor es 0. Ver CHECKPOINT de cierre para detalle. -->
      <div class="blt-wrap">
        <button class="blt-trigger bl-toolbar-view-btn" id="bstats-types-btn" data-action="stats-toggle-types" aria-haspopup="true" aria-expanded="false" aria-controls="blt-popover" title="Filtrar por tipo">
          Tipos ▾<span class="blt-badge${(6 - activeTypes.size) === 0 ? ' is-hidden' : ''}">${6 - activeTypes.size}</span>
        </button>
        <div class="blt-popover" id="blt-popover" role="menu" hidden>
          ${activeTypes.size < 6 ? `<span class="stat-type-chip stat-type-chip--all" data-action="stats-clear-types" title="Mostrar todos los tipos">✕ mostrar todos</span>` : ''}
          ${[['INC','INC','Incidentes'],['TKT','TKT','Tickets técnicos'],['REQ','REQ','Requerimientos / epics'],['PRB','PRB','Problems — causa raíz'],['CHG','CHG','Changes estructurales']].map(([t,label,hint]) =>
            byType[t] > 0 ? `<span class="stat-type-chip tc-${t}${activeTypes.has(t) ? ' active' : ''}" data-action="stats-type-filter" data-type="${t}" title="${hint} — click para filtrar">
              <span class="tc-count">${byType[t]}</span><span class="tc-label">${label}</span>
            </span>` : ''
          ).join('')}
          ${pIdeasCount > 0 ? `<span class="stat-type-chip tc-DISC stat-type-chip--ideas${activeTypes.has('DISC') ? ' active' : ''}" data-action="stats-type-filter" data-type="DISC" title="Posibilidades — no afectan contadores de trabajo activo">
            <span class="tc-count">${pIdeasCount}</span><span class="tc-label">💡 Ideas</span>
          </span>` : ''}
        </div>
      </div>
      <!-- Separador -->
      <div class="stat-compact-sep"></div>
      <!-- Prioridad -->
      <div class="stat-compact-priority">
        <span class="stat-pri-chip pri-high${activePriorityFilter.has('high') ? ' active' : ''}" data-action="stats-priority-filter" data-priority="high" title="Filtrar prioridad alta"><span class="spc-n">${c.high}</span> Alto</span>
        <span class="stat-pri-chip pri-medium${activePriorityFilter.has('medium') ? ' active' : ''}" data-action="stats-priority-filter" data-priority="medium" title="Filtrar prioridad media"><span class="spc-n">${c.medium}</span> Med</span>
        <span class="stat-pri-chip pri-low${activePriorityFilter.has('low') ? ' active' : ''}" data-action="stats-priority-filter" data-priority="low" title="Filtrar prioridad baja"><span class="spc-n">${c.low}</span> Bajo</span>
      </div>
      <!-- Separador -->
      <div class="stat-compact-sep"></div>
      <!-- Esfuerzo -->
      <div class="stat-compact-effort">
        ${noEffortCount > 0 ? `<span class="stat-effort-missing" title="Ítems sin effort" data-action="stats-effort-missing">${noEffortCount} sin effort</span>` : ''}
        <span class="stat-effort-card${activeEfforts.has(1) ? ' active' : ''}" id="feff-1" data-action="stats-effort-filter" data-effort="1" title="Filtrar effort 1"><span class="sec-count">${byEffort[1]}</span><span class="eff-label">● simple</span></span>
        <span class="stat-effort-card${activeEfforts.has(2) ? ' active' : ''}" id="feff-2" data-action="stats-effort-filter" data-effort="2" title="Filtrar effort 2"><span class="sec-count">${byEffort[2]}</span><span class="eff-label">●● medio</span></span>
        <span class="stat-effort-card${activeEfforts.has(3) ? ' active' : ''}" id="feff-3" data-action="stats-effort-filter" data-effort="3" title="Filtrar effort 3"><span class="sec-count">${byEffort[3]}</span><span class="eff-label">●●● complejo</span></span>
      </div>
    </div>
    </div>
    </div>
  `;
  // B-UX: reaplicar clases de estado de filtro tras recrear el DOM del stats-bar
  updateTypeFilterUI();
}
// T-053: construye el bloque de sesiones que referencian un ítem del backlog
export function buildItemRefs(code) {
  const matches = [];
  getAllSessions().forEach(s => {
    if ((s.trackerRefs || []).includes(code)) {
      const ai = getAI(s.aiId);
      if (ai) matches.push({ ai, s });
    }
  });
  if (!matches.length) return '';
  const chips = matches.map(({ ai, s }) =>
    `<span class="item-ref-chip" title="${esc(s.title)}" data-action="ref-chip-session" data-ai-id="${ai.id}" data-sess-id="${s.id}">${esc(ai.name)} · ${s.dateShort || s.date || ''}</span>`
  ).join('');
  return `<div class="item-refs"><span class="item-ref-label">Sesiones</span>${chips}</div>`;
}

// T-108: toggle colapso de ítem individual
export function toggleItemExpand(idx) {
  const body = document.getElementById('ibody-' + idx);
  const arrow = document.getElementById('iarrow-' + idx);
  if (!body) return;
  const open = body.classList.toggle('open');
  if (arrow) arrow.textContent = open ? '▾' : '▸';
  // T-202604-253: marcar ítem como seleccionado al expandir/colapsar
  (_coreCallbacks.backlogSetSelected || (() => {}))(body.closest ? body.closest('.item[data-code]') : null);
  // R-202604-015: abrir/cerrar panel lateral al expandir ítem
  const itemEl = body.closest ? body.closest('.item[data-code]') : null;
  const code = itemEl ? itemEl.dataset.code : null;
  if (open && code) {
    (_coreCallbacks.openItemPanel || (() => {}))(code);
  } else if (!open) {
    (_coreCallbacks.closeItemPanel || (() => {}))();
  }
}

// T-104/106: toggle secciones done/futura
export function toggleSectionGroup(key) {
  const body = document.getElementById('sgbody-' + key);
  const arrow = document.getElementById('sgarrow-' + key);
  if (!body) return;
  const collapsed = body.classList.toggle('collapsed');
  if (arrow) arrow.classList.toggle('collapsed', collapsed);
  try { localStorage.setItem('backlog-' + key + '-open', collapsed ? '0' : '1'); } catch {}
}

// T-109: limpiar todos los filtros
export function clearAllFilters() {
  activeTypes = new Set(['TKT','REQ','INC','DISC','PRB','CHG']);
  activeStatuses = new Set(['pendiente', 'en-revision']);
  try { localStorage.removeItem(_ACTIVE_STATUSES_KEY); } catch {} // T-202606-021: reset persiste
  activeEfforts = new Set([1, 2, 3]); // T-071
  activePriorityFilter = new Set(); // T-202604-357
  _backlogNoAcMode = false; // T-202604-363
  backlogSearchQuery = '';
  backlogSortMode = 'priority'; // T-202604-424: sprint eliminado como opción de sort
  backlogSortDir = 'desc'; // T-072 — default desc
  const sortDirBtn = document.getElementById('fbar-sort-dir-btn');
  if (sortDirBtn) sortDirBtn.textContent = '↓';
  const searchEl = document.getElementById('search-global');
  if (searchEl) searchEl.value = '';
  const bsInput = document.getElementById('backlog-search-input');
  if (bsInput) bsInput.value = '';
  const bsClear = document.getElementById('backlog-search-clear');
  if (bsClear) bsClear.classList.remove('visible');
  const sortSel = document.getElementById('fbar-sort-select');
  if (sortSel && sortSel.value === 'sprint') sortSel.value = 'priority';
  updateTypeFilterUI();
  updateStatusFilterUI();
  updateEffortFilterUI(); // T-071
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// R-202605-122 AC3: asignación rápida de effort desde badge sin abrir editor completo
export function _quickAssignEffort(codeOrId) {
  const item = ITEMS.find(i => i.code === codeOrId || i.id === codeOrId);
  if (!item) return;
  const val = prompt('Asignar effort a ' + (item.code || item.id) + ' (1 = simple · 2 = medio · 3 = complejo):', '1');
  const n = parseInt(val);
  if (!val || isNaN(n) || n < 1 || n > 3) { showToast('warning', '⚠ Valor no válido — ingresa 1, 2 o 3'); return; }
  item.effort = n;
  if (item._needsEffortReview) delete item._needsEffortReview;
  _undoSnapshotItems();
  saveBacklog();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  renderStats();
  showToast('success', '✓ Effort ' + n + ' asignado a ' + (item.code || item.id));
}

// T-071: toggle filtro por esfuerzo
export function toggleEffortFilter(e) {
  const n = parseInt(e);
  const allActive = activeEfforts.size === 3;
  if (allActive) {
    // primer click: desactiva todos, activa solo el clickeado
    activeEfforts = new Set([n]);
  } else if (activeEfforts.has(n)) {
    // click en activo: si es el único, restaura todos
    if (activeEfforts.size === 1) {
      activeEfforts = new Set([1, 2, 3]);
    } else {
      activeEfforts.delete(n);
    }
  } else {
    // click en inactivo con otros activos: acumula
    activeEfforts.add(n);
  }
  updateEffortFilterUI();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  // T-202604-364: filter-pulse feedback
  requestAnimationFrame(() => {
    const el = document.getElementById('feff-' + n);
    if (el) { el.classList.remove('filter-pulse'); void el.offsetWidth; el.classList.add('filter-pulse'); el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true }); }
  });
}

function updateEffortFilterUI() {
  [1, 2, 3].forEach(n => {
    const el = document.getElementById('feff-' + n);
    if (el) el.classList.toggle('active', activeEfforts.has(n));
  });
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed')); // B-202606-006
}

// T-202604-065: sort handler
// T-202604-245: roles canónicos del ecosistema — fuente: __OB-Strategy §6
// [tmp:tkt-roles-cleanup]: removidos deprecados (Alex/Axis/Orion → Cael · Mike/Rex/Kai → Rune) — alineado con la copia ya vigente en locus-backlog-item.js §75-81
export const _ECOSYSTEM_ROLES = [
  'ST · Vera', 'GW · Lena', 'CPO · Noa', 'CMO · Maya',
  'PO · Cael', 'FS · Rune', 'UX · Nova', 'QA · Finn',
  'CC · Flux', 'ET · Eden', 'GC · Sage', 'DA · Iris'
];

// T-202604-357: toggle filtro por prioridad — acumulable, combina con otros filtros
function togglePriorityFilter(p) {
  if (activePriorityFilter.has(p)) {
    activePriorityFilter.delete(p);
  } else {
    activePriorityFilter.add(p);
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  renderStats();
}

function updatePriorityFilterUI() {
  ['high', 'medium', 'low'].forEach(p => {
    const el = document.querySelector('.stat-pri-chip.pri-' + p);
    if (el) el.classList.toggle('active', activePriorityFilter.has(p));
  });
}

// T-202604-245: toggleRoleFilter, updateRoleFilterUI, _getActiveRoles, _buildRoleChips
// eliminados — TKT1 REQ1 S'02. Feature nunca conectada al render (_buildRoleChips
// no se invocaba desde ningún archivo del proyecto). Ver DISC de arquitectura relacionada.

export function onBacklogSortChange(val) {
  // T-202604-424: ignorar 'sprint' si llega de localStorage legacy o select antiguo
  if (val === 'sprint') val = 'priority';
  backlogSortMode = val;
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-072: toggle dirección de sort
export function toggleSortDir() {
  backlogSortDir = backlogSortDir === 'asc' ? 'desc' : 'asc';
  const btn = document.getElementById('fbar-sort-dir-btn');
  if (btn) btn.textContent = backlogSortDir === 'asc' ? '↑' : '↓';
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-202604-187: toggle árbol vs vista plana
// B-202604-122: persistir estado en localStorage
// T-202607-027: toggle vista Kanban removido — Vista Lista es el único modo
// T-202604-313/366: Mi vista — T's pendientes del rol activo en sprint activo, rotativo
export function _getMiViewRoles() {
  const activeSprint = (_coreCallbacks.getActiveSprint || (() => null))();
  if (!activeSprint) return [];
  const roles = new Set();
  ITEMS.forEach(i => {
    if (itemKind(i) === 'TKT' && i.status === 'pendiente' && i.sprint === activeSprint.id && i.role && i.role.trim())
      roles.add(i.role.trim());
  });
  return [...roles].sort();
}

export function _getMiViewLabel() {
  const roles = _getMiViewRoles();
  if (!roles.length) return 'Mi vista';
  const role = roles[_miViewRoleIndex % roles.length] || roles[0];
  return 'Mi vista: ' + role;
}

// AC: aria tablist — sincroniza aria-checked de modificadores (vista de agrupación única: Vista Lista)
// T-202607-027: bloque de tablist Kanban/Vista Lista removido — Vista Lista es el único modo, sin tabs
// Modificadores combinables: Focus · Mi vista
// T-202606-062: sprintBtn y _backlogSprintGroupMode eliminados — _renderVistaLista es la vista por defecto
function _syncViewAriaStates() {
  // Modificadores — aria-checked refleja estado
  const mikeBtn  = document.getElementById('fbar-mike-btn');
  if (mikeBtn)  mikeBtn.setAttribute('aria-checked',  String(_backlogMikeMode));
}

export function toggleBacklogMikeMode() {
  const roles = _getMiViewRoles();
  if (!roles.length) return;
  if (!_backlogMikeMode) {
    _backlogMikeMode = true;
    _miViewRoleIndex = 0;
  } else if (roles.length === 1) {
    // Solo un rol — segundo click desactiva
    _backlogMikeMode = false;
    _miViewRoleIndex = 0;
  } else {
    // Rotar al siguiente rol
    _miViewRoleIndex = (_miViewRoleIndex + 1) % roles.length;
  }
  const btn = document.getElementById('fbar-mike-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogMikeMode);
    btn.textContent = _backlogMikeMode ? _getMiViewLabel() : 'Mi vista';
    btn.title = _backlogMikeMode
      ? 'Mi vista activa · click para rotar al siguiente rol'
      : 'Mi vista — T\'s pendientes por rol en sprint activo';
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
  _syncViewAriaStates();
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
}

// T-202607-027: toggleBacklogKanbanMode() removida — Kanban deprecado (REQ-202607-013)

// T-202604-363: toggle filtro Sin AC — pendientes sin criterios de aceptación
export function toggleBacklogNoAcMode() {
  _backlogNoAcMode = !_backlogNoAcMode;
  const btn = document.getElementById('fbar-no-ac-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogNoAcMode);
    btn.title = _backlogNoAcMode ? 'Sin AC activo — click para desactivar' : 'Filtrar ítems sin criterios de aceptación';
  }
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  // T-202606-066 AC-2: filter-pulse en fbar-no-ac-btn (toolbar)
  requestAnimationFrame(() => {
    const el = document.getElementById('fbar-no-ac-btn');
    if (el) { el.classList.remove('filter-pulse'); void el.offsetWidth; el.classList.add('filter-pulse'); el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true }); }
  });
}

// R-202605-130: vista Planificación — drag & drop de ítems sin sprint al sprint siguiente

// Getters exportados para variables de estado — consumidos por locus-backlog-render.js.
// Las variables son let/const privados (mutables), por lo que se exponen via getter en lugar de export let.
// T-202607-027: _getBacklogKanbanMode() removida — Kanban deprecado (REQ-202607-013)
export function _getBacklogMikeMode()        { return _backlogMikeMode; }
// T-202606-062: _getBacklogSprintGroupMode() eliminada — R-202606-017
export function _getBacklogNoAcMode()        { return _backlogNoAcMode; }
export function _getActiveTypes()            { return activeTypes; }
export function _getActiveStatuses()         { return activeStatuses; }
export function _getActiveEfforts()          { return activeEfforts; }
// _getActiveRoleFilter eliminado — TKT1 REQ1 S'02
export function _getActivePriorityFilter()   { return activePriorityFilter; }
export function _getDepsFilter()             { return _depsFilter; }
export function getDoneItems(matchesQuery)   { // T-202606-028: computed global — evita ITEMS.filter() duplicado en renderBacklogList
  const fn = typeof matchesQuery === 'function' ? matchesQuery : () => true;
  // T-202606-060: typeOk aplicado — el chip de tipo de stats bar debe combinarse en AND con status done
  return ITEMS.filter(i => {
    const type = itemKind(i);
    const typeOk = type ? activeTypes.has(type) : true;
    return typeOk && i.status === 'done' && fn(i);
  });
}
export function _getBacklogSortMode()        { return backlogSortMode; }
export function _getBacklogSortDir()         { return backlogSortDir; }
export function _getMiViewRoleIndex()        { return _miViewRoleIndex; }
export function _getBacklogSearchQuery()     { return backlogSearchQuery; }
export function _getCollapsedVersions()      { return collapsedVersions; }

// B-202605-XXX: _migrateItemTypes — stub de compatibilidad para call site en locus-storage.js
// R-202605-070 / TKT-202607-062: la lógica real fue absorbida por _normalizeScrumItems().
// Este stub redirige la llamada post-carga remota de _loadFromSupabase (bloque de merge de
// ITEMS únicamente — ver _itemsRef en locus-storage.js) a _normalizeScrumItems para mantener
// el contrato de datos sin duplicar lógica. Scope sin cambio respecto al stub anterior: solo
// ITEMS — el call site que invoca esta función nunca operó sobre INCIDENTS.
// INC histórico fix (causa raíz): saveBacklog() se disparaba sin await — el único
// call site real (_mergeItemsFromRemote en locus-storage.js) no podía esperar a que el
// lock de syncState.withSaveLock() se soltara antes de que _loadFromSupabase() continuara
// a _mergeIncidentsFromRemote(), que revisa ese mismo lock global. `return` expone la
// promesa de saveBacklog() sin cambiar el contrato para el único caller — antes ignoraba
// el valor de retorno (undefined), ahora puede optar por esperarlo.
export function _migrateItemTypes() {
  if (typeof ITEMS === 'undefined') return;
  _setITEMS(_normalizeScrumItems(ITEMS));
  return saveBacklog();
}
// B-202606-024: window.getItems eliminado — consumidores migrados a import o _getItemsFn()

// T-202606-058 mejora: extraer lógica de reset de _depsFilter — evita duplicación en chips de Bloqueados/Libres
function _resetDepsFilter() {
  _depsFilter = 0;
  const _db = document.getElementById('fbar-deps-btn');
  if (_db) { _db.textContent = '🔗 Deps'; _db.classList.remove('active'); }
  window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
}

// T-202606-058: fila de chips activos — colección de filtros fuera del estado default
// Retorna array de { label, removeFn } para cada filtro activo.
// Estado default: activeStatuses={'pendiente','en-revision'} · activeTypes={TKT,REQ,INC,DISC} ·
//   activeEfforts={1,2,3} · activePriorityFilter=vacío ·
//   _backlogNoAcMode=false · _depsFilter=0 · backlogSearchQuery=''
function _getActiveFilterChips() {
  const chips = [];

  // Status fuera del default
  if (activeStatuses.has('done'))
    chips.push({ label: 'Done',            key: 'status:done',         removeFn: () => toggleStatusFilter('done') });
  if (activeStatuses.has('descartado'))
    chips.push({ label: 'Descartado',      key: 'status:descartado',   removeFn: () => toggleStatusFilter('descartado') });
  if (!activeStatuses.has('pendiente'))
    chips.push({ label: 'Sin Pendiente',   key: 'status:!pendiente',   removeFn: () => toggleStatusFilter('pendiente') });
  if (!activeStatuses.has('en-revision'))
    chips.push({ label: 'Sin En revisión', key: 'status:!en-revision', removeFn: () => toggleStatusFilter('en-revision') });

  // Sin AC
  if (_backlogNoAcMode)
    chips.push({ label: 'Sin AC', key: 'noac', removeFn: () => toggleBacklogNoAcMode() });

  // Deps
  if (_depsFilter === 1)
    chips.push({ label: '🔒 Bloqueados', key: 'deps:1', removeFn: _resetDepsFilter });
  if (_depsFilter === 2)
    chips.push({ label: '🔓 Libres',     key: 'deps:2', removeFn: _resetDepsFilter });

  // Prioridad — un chip por prioridad activa
  activePriorityFilter.forEach(function (p) {
    const _pLabel = p === 'high' ? 'Alto' : p === 'medium' ? 'Medio' : 'Bajo';
    chips.push({ label: 'Prioridad: ' + _pLabel, key: 'priority:' + p, removeFn: () => {
      window.dispatchEvent(new CustomEvent('shell:togglePriorityFilter', { detail: { val: p } }));
    }});
  });

  // Rol eliminado — TKT1 REQ1 S'02 (activeRoleFilter ya no existe)

  // Tipos excluidos (cuando activeTypes no tiene los 6) — TKT3 REQ1 S'02: PRB/CHG agregados
  ['TKT', 'REQ', 'INC', 'DISC', 'PRB', 'CHG'].forEach(function (t) {
    if (!activeTypes.has(t)) {
      const _tLabel = t === 'TKT' ? 'Sin Tickets' : t === 'REQ' ? 'Sin Reqs' : t === 'INC' ? 'Sin Incidentes'
        : t === 'DISC' ? 'Sin Ideas' : t === 'PRB' ? 'Sin Problems' : 'Sin Changes';
      chips.push({ label: _tLabel, key: 'type:!' + t, removeFn: (function (_t) {
        return () => toggleTypeFilter(_t);
      }(t)) });
    }
  });

  // Effort excluido
  [1, 2, 3].forEach(function (e) {
    if (!activeEfforts.has(e)) {
      chips.push({ label: 'Effort ' + e + ' oculto', key: 'effort:!' + e, removeFn: (function (_e) {
        return () => toggleEffortFilter(_e);
      }(e)) });
    }
  });

  // Búsqueda activa
  if (backlogSearchQuery.length > 0)
    chips.push({ label: '🔍 "' + backlogSearchQuery + '"', key: 'search', removeFn: () => {
      backlogSearchQuery = '';
      const _si = document.getElementById('backlog-search-input');
      if (_si) _si.value = '';
      const _sc = document.getElementById('backlog-search-clear');
      if (_sc) _sc.classList.remove('visible');
      window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
      window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));
    }});

  return chips;
}

// T-202606-058: render de la fila #active-filter-chips
// AC-1: con filtros activos → label 'Activos:' + chips con X + 'Limpiar todo'
// AC-2: clic en X desactiva ese filtro (clearFn) — el re-render ocurre vía shell:backlog-filter-changed
// AC-3: sin filtros activos → contenedor vacío (oculto vía CSS cuando está vacío)
export function renderActiveFilterChips() {
  const _container = document.getElementById('active-filter-chips');
  if (!_container) return;

  const chips = _getActiveFilterChips();

  // AC-3: sin filtros → vaciar y ocultar contenedor
  if (!chips.length) {
    _container.innerHTML = '';
    _container.classList.add('is-hidden');
    return;
  }
  _container.classList.remove('is-hidden');

  // AC-1: construir HTML de la fila — data-filter-key identifica el chip por tipo+valor, no por posición
  _container.innerHTML =
    '<span class="afc-label">Activos:</span>' +
    chips.map(function (chip) {
      return '<button class="afc-chip" type="button" data-filter-key="' + esc(chip.key) + '">' +
        esc(chip.label) +
        '<span class="afc-chip-x" aria-hidden="true">×</span>' +
      '</button>';
    }).join('') +
    '<button class="afc-clear-all" type="button">Limpiar todo</button>';

  // Delegación de eventos — se registra una sola vez por contenedor via flag
  if (!_container._afcListenerAttached) {
    _container._afcListenerAttached = true;
    _container.addEventListener('click', function (e) {
      // AC-2: clic en chip — buscar removeFn por key (resistente a reordenamiento entre renders)
      const _chip = e.target.closest('.afc-chip');
      if (_chip) {
        const _key = _chip.dataset.filterKey;
        const _current = _getActiveFilterChips();
        const _match = _current.find(function (c) { return c.key === _key; });
        if (_match) _match.removeFn();
        return;
      }
      // Limpiar todo
      if (e.target.closest('.afc-clear-all')) {
        clearAllFilters();
      }
    });
  }
}

// INC-202607-001: .active-filter-chips necesita position:sticky con un top que respete
// la altura real de .bl-toolbar — el toolbar hace flex-wrap y su altura cambia según
// cuántos filtros están activos. --bl-toolbar-h se mide en runtime y se consume en
// locus-backlog.css (.active-filter-chips { top: calc(var(--header-h) + var(--bl-toolbar-h)) }).
// TKT1 (REQ CAEL-0720-02): --bl-toolbar-h ahora mide #bl-header-unified completo (stats-bar +
// separador + bl-toolbar), no solo .bl-toolbar — .active-filter-chips se fusiona contra el
// borde inferior del wrapper tras la fusión visual (locus-backlog.css mod:111), su sticky top
// debe reflejar la altura real de todo el bloque superior, no solo la porción de toolbar.
// Nombre de la variable sin cambio — solo el selector medido. Cubre flex-wrap de la fila de
// acciones en viewport angosto: offsetHeight ya refleja la altura post-wrap del wrapper completo.
function _syncToolbarHeightVar() {
  const _toolbar = document.querySelector('.bl-header-unified');
  if (!_toolbar) return;
  document.documentElement.style.setProperty('--bl-toolbar-h', _toolbar.offsetHeight + 'px');
}

// Inline handlers dinámicos — no tienen ID fijo, no pueden migrar a addEventListener
// Se exponen en window para que onclick="fn()" en HTML generado en runtime funcione

// T-202605-053: Migrar handlers inline de index.html → addEventListener
// Funciones cubiertas: undoBacklog · redoBacklog
// toggleBacklogMikeMode · toggleCollapseAll
// T-202607-027: listener de toggleBacklogKanbanMode removido — función ya no existe (Kanban deprecado)
// toggleStatusFilter (×5)
// toggleBacklogNoAcMode · clearAllFilters
document.addEventListener('DOMContentLoaded', function () {
  // Undo / Redo
  const _btnUndo = document.getElementById('btn-undo-backlog');
  if (_btnUndo) _btnUndo.addEventListener('click', function () { undoBacklog(); });

  const _btnRedo = document.getElementById('btn-redo-backlog');
  if (_btnRedo) _btnRedo.addEventListener('click', function () { redoBacklog(); });

  // Vista — Focus / Mi vista
  // T-202607-027: listener de #fbar-kanban-btn removido — Kanban deprecado, Vista Lista es el único modo

  const _btnMike = document.getElementById('fbar-mike-btn');
  if (_btnMike) _btnMike.addEventListener('click', function () { toggleBacklogMikeMode(); });

  // Colapsar / expandir todos
  const _btnCollapse = document.getElementById('bl-collapse-all-btn');
  if (_btnCollapse) _btnCollapse.addEventListener('click', function () { toggleCollapseAll(); });

  // B-202606-011: sincronizar estado visual del botón con collapsedVersions al cargar
  // collapsedVersions ya está cargado desde localStorage — si tiene entradas, hay sprints colapsados
  if (_btnCollapse && collapsedVersions.size > 0) {
    const _colLabel = _btnCollapse.querySelector('.bl-collapse-btn-label');
    const _colIcon  = _btnCollapse.querySelector('.bl-collapse-btn-icon');
    _btnCollapse.classList.add('is-collapsed');
    if (_colLabel) _colLabel.textContent = 'Expandir';
    if (_colIcon)  _colIcon.textContent  = '⊞';
  }

  // Búsqueda — B-202605-047: handler inline, no depende de onBacklogSearch global
  const _inputSearch = document.getElementById('backlog-search-input');
  if (_inputSearch) _inputSearch.addEventListener('input', function () {
    backlogSearchQuery = _inputSearch.value.trim().toLowerCase();
    const _bsClear = document.getElementById('backlog-search-clear');
    if (_bsClear) _bsClear.classList.toggle('visible', backlogSearchQuery.length > 0);
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  });

  const _btnSearchClear = document.getElementById('backlog-search-clear');
  if (_btnSearchClear) _btnSearchClear.addEventListener('click', function () {
    backlogSearchQuery = '';
    if (_inputSearch) _inputSearch.value = '';
    _btnSearchClear.classList.remove('visible');
    window.dispatchEvent(new CustomEvent('shell:backlog-render-dirty'));
  });

  // Filtros de status
  const _statusMap = {
    'fstatus-pendiente':  'pendiente',
    'fstatus-en-revision': 'en-revision',
    'fstatus-done':       'done',
    'fstatus-descartado': 'descartado'
  };
  Object.keys(_statusMap).forEach(function (id) {
    const _btn = document.getElementById(id);
    if (_btn) _btn.addEventListener('click', (function (val) {
      return function () { toggleStatusFilter(val); };
    }(_statusMap[id])));
  });

  // Filtro Bloqueados
  // T-202606-047: fbar-blocker-btn eliminado

  // Filtro Sin AC
  const _btnNoAc = document.getElementById('fbar-no-ac-btn');
  if (_btnNoAc) _btnNoAc.addEventListener('click', function () { toggleBacklogNoAcMode(); });

  // T-202606-087: Pill 'Hijos' — init + listener (reemplaza checkbox bl-show-children-toggle)
  const _btnShowChildren = document.getElementById('fbar-show-children-btn');
  if (_btnShowChildren) {
    // AC-6: si la clave no existe, estado inicial es inactivo (hijos ocultos)
    const _scStored = localStorage.getItem('backlog-show-children');
    const _scActive = _scStored === '1';
    _btnShowChildren.classList.toggle('active', _scActive);
    _btnShowChildren.textContent = _scActive ? 'Hijos ✓' : 'Hijos';
    if (_scActive) toggleShowChildren(true);

    _btnShowChildren.addEventListener('click', function () {
      const nowActive = !_btnShowChildren.classList.contains('active');
      _btnShowChildren.classList.toggle('active', nowActive);
      _btnShowChildren.textContent = nowActive ? 'Hijos ✓' : 'Hijos';
      toggleShowChildren(nowActive);
    });
  }

  // B-202606-008: sincronizar visibilidad del botón Limpiar filtros con el estado
  // real de los filtros en la carga inicial — antes de cualquier interacción del usuario
  window.dispatchEvent(new CustomEvent('shell:backlog-filter-changed'));

  // T-202606-058: actualizar fila de chips activos en cada cambio de filtro
  window.addEventListener('shell:backlog-filter-changed', function () { renderActiveFilterChips(); });
  renderActiveFilterChips(); // render inicial

  // INC-202607-001: sincronizar --bl-toolbar-h con la altura real del toolbar —
  // cambia cuando el flex-wrap agrega o quita líneas al activar/desactivar filtros
  // TKT1 (REQ CAEL-0720-02): observa .bl-header-unified — mismo selector que
  // _syncToolbarHeightVar() ahora mide. Observar solo .bl-toolbar aquí dejaría el resize
  // ciego a cambios de altura de #stats-bar (ej. wrap de chips de tipo/prioridad).
  _syncToolbarHeightVar();
  const _toolbarEl = document.querySelector('.bl-header-unified');
  if (_toolbarEl && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () { _syncToolbarHeightVar(); }).observe(_toolbarEl);
  } else {
    window.addEventListener('resize', function () { _syncToolbarHeightVar(); });
  }

  // T-202606-218: listener shell:togglePriorityFilter — invocación cross-módulo sin export
  window.addEventListener('shell:togglePriorityFilter', function (e) {
    togglePriorityFilter(e.detail && e.detail.val);
  });

});
