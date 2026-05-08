## - Informe funcional de Finn — Fase 2 (FULL)

## Sesión 2a — Backlog core (carga, merge, status, cierre de sprint)
Informe funcional — Auditoría funcional PP · Sesión 2a
Flujo
Subfunción
AC verificado
Gap de especificación
Bug detectado
Tipo
Pasos reproducibles
Carga de backlog
ITEMS IIFE — migración inline
No hay AC escrito para este comportamiento
AC ausente: migración duplicada (IIFE + loadBacklog) sin criterio de idempotencia
Sin feedback al usuario si proyecto activo no está en localStorage — ITEMS arranca vacío silenciosamente
Menor
1. Abrir PP con current-project-filter en localStorage apuntando a proyecto sin datos. 2. Observar: ITEMS = []. Sin toast, sin aviso.
Carga de backlog
loadBacklog() — saveBacklog incondicional
No hay AC escrito
AC ausente: no hay criterio sobre cuándo saveBacklog debe o no dispararse
saveBacklog() se llama al final de loadBacklog() aunque migrated = false y sanitized = 0 — escribe storage en cada carga sin cambio
Menor
1. Cargar PP con backlog limpio ya migrado. 2. Observar Network/Storage: saveBacklog() se dispara en cada carga.
Carga de backlog
loadBacklog() — dependencia _normalizeStatus
No hay AC escrito
AC ausente: comportamiento si _normalizeStatus no está disponible no está definido
Si _normalizeStatus es undefined, loadBacklog() lanza TypeError silenciado por el try/catch del ITEMS IIFE pero no por loadBacklog mismo — migración de status falla sin feedback
Mayor
1. Remover/renombrar _normalizeStatus del módulo que lo define. 2. Llamar loadBacklog(). 3. Observar: error no visible al usuario, ITEMS cargados sin normalización.
Carga de backlog
_sanitizePendingInClosedSprints() — segunda pasada doneAt
No hay AC escrito
AC ausente: el fix sintomático de doneAt mismatch no tiene criterio binario de cuándo aplica
Ítems cuyo status fue sobreescrito por merge reciben status = done forzado sin _undoSnapshot() — la corrección no es deshacible
Mayor
1. Crear ítem con doneAt populado pero status = 'pendiente' en localStorage (simular merge corrupto). 2. Llamar loadBacklog(). 3. Status corregido a done. 4. Intentar undo — la corrección no aparece en el stack.
Merge de CHECKPOINT
mergeBacklogFromTG() — cierre automático P padre
No hay AC escrito
AC ausente: comportamiento del cierre automático del P padre (cuándo aplica, qué pasa si ya tiene doneAt) no está especificado
Cierre automático del P padre (L4769–4778) aplica status = 'done' sin _undoSnapshot() previo a esa mutación específica — el cierre del padre no es deshacible
Mayor
1. Tener ítem P con status = pendiente y sin doneAt. 2. Pegar CHECKPOINT con ítem hijo que tiene origin = código del P. 3. Aplicar merge. 4. P queda cerrado. 5. Intentar undo — el cierre del padre no revierte.
Merge de CHECKPOINT
showMergeDiffPanel() — window.* leak
No hay AC escrito
AC ausente: no hay criterio de que las funciones del panel deben sobrevivir o no sobrevivir entre aperturas
window._mdiffToggleSection, _mdiffJumpTo, _mdiffSetItemSprint, _mdiffConfirmNewSprintForm, _mdiffCancelNewSprintForm se redefinen en cada apertura del panel — si el panel se abre mientras uno anterior está procesando, las closures del anterior quedan reemplazadas
Menor
1. Abrir merge diff panel. 2. Sin cerrarlo, abrir otro panel (forzar desde consola). 3. Observar: funciones window.* apuntan al segundo contexto — el primero queda huérfano.
Merge de CHECKPOINT
showMergeDiffPanel() — dryRun cambia project filter
No hay AC escrito
AC ausente: no hay criterio de que el filter debe restaurarse si la carga en dryRun falla mitad de camino
Si mergeBacklogFromTG lanza excepción dentro del try, el finally restaura el filter — pero loadBacklog() dentro del finally puede re-lanzar, dejando el filter en estado indeterminado
Mayor
1. Configurar _loadFromSupabase para lanzar error. 2. Pegar CHECKPOINT con projId distinto al activo. 3. Observar: project filter puede quedar modificado si loadBacklog en finally falla.
Cambio de status
setItemStatus() — orden log/snapshot
No hay AC escrito
AC ausente: no hay criterio de orden entre registro de log y snapshot de undo
_blogLog se llama en L1175 antes de _undoSnapshot() en L1176 — si el usuario hace undo inmediatamente, el log queda registrado pero el estado revirtió: log y estado desincronizados
Menor
1. Cambiar status de ítem (pendiente → done). 2. Inmediatamente ejecutar undoBacklog(). 3. Estado revierte a pendiente. 4. Log registra el cambio que no ocurrió efectivamente.
Cambio de status
_recalcAllScores() — O(n×m) en hot path
No hay AC escrito
AC ausente: no hay criterio de performance sobre recalculación de scores
_calcRelevanceScore llama getAllSessions() por cada ítem en cada evaluación. _recalcAllScores se llama desde setItemStatus() — cada cambio de status relanza el ciclo completo sobre todos los ITEMS pendientes
Mayor
1. Cargar backlog con 200+ ítems pendientes y 50+ sesiones. 2. Cambiar status de cualquier ítem. 3. Observar: UI se congela durante el recalculo — O(n×m) sin caché.
Cambio de status
_calcPriority() — effort 1 en sprint cerrado
Parcialmente
AC ausente: no se especifica que sprints cerrados deben excluirse del cálculo
Regla 3 de _calcPriority (L473): parseInt(item.effort) === 1 → high se evalúa si item.sprint tiene cualquier valor incluyendo sprint cerrado — ítems históricos en sprints cerrados reciben priority high en cada _applyAllPriorities()
Menor
1. Tener ítem done en sprint cerrado con effort = 1. 2. Llamar loadBacklog(). 3. Observar: _applyAllPriorities solo aplica a pendiente — este bug solo afecta ítems pendientes en sprints cerrados que no fueron saneados.
Cierre de sprint
_scmRender() — isLast siempre 3
No hay AC escrito
AC ausente: no hay criterio binario de que el último paso con skipStep2 = true debe ser 2, no 3
isLast = step === (skipStep2 ? 3 : 3) — ambas ramas son 3. Con skipStep2 = true, el modal tiene 2 pasos efectivos pero el botón "Cerrar sprint" solo aparece en step 3 — step 2 (el efectivo último) muestra "Siguiente →" en lugar de "Cerrar sprint"
Crítico
1. Iniciar cierre de sprint sin ítems pendientes (skipStep2 = true). 2. Llegar al paso 2 (último efectivo). 3. Observar: botón muestra "Siguiente →" — no hay forma de cerrar el sprint desde la UI sin llegar a step 3 que nunca renderiza contenido correcto.
Cierre de sprint
_scmStep1Html() — doble fuente de verdad _scmState
No hay AC escrito
AC ausente: no hay criterio de que _scmState debe accederse solo por parámetro o solo como global
_scmStep1Html accede _scmState directamente como global (L6466–6470) y también recibe sp (derivado de _scmState) como parámetro — si _scmState global y el sp derivado divergen, el render usa la global para métricas pero el parámetro para el label
Menor
1. Modificar _scmState externamente entre la llamada a _scmRender y el render del HTML. 2. Observar: métricas de effort usan _scmState global actualizado pero spLabel usa el valor anterior.


Lista de gaps de AC para Cael
Título del gap
Flujo afectado
Comportamiento observable sin AC
Idempotencia de migración de status en IIFE + loadBacklog
Carga de backlog
La migración de status legacy ocurre dos veces en secuencia (IIFE, luego loadBacklog). No hay criterio binario de que la segunda pasada debe ser no-operativa si la primera ya normalizó.
Condición de disparo de saveBacklog en loadBacklog
Carga de backlog
saveBacklog() se ejecuta en cada carga. No hay criterio de que saveBacklog solo debe dispararse si hubo cambio real (migrated = true o sanitized > 0).
Comportamiento cuando _normalizeStatus no está disponible en loadBacklog
Carga de backlog
Si la dependencia externa falta, la migración de status falla silenciosamente. No hay criterio de fallback ni de alerta al usuario.
Deshacibilidad de la corrección de doneAt mismatch en _sanitizePendingInClosedSprints
Carga de backlog
La segunda pasada fuerza status = done sin _undoSnapshot(). No hay criterio de que esta corrección debe o no ser deshacible.
Deshacibilidad del cierre automático del P padre en mergeBacklogFromTG
Merge de CHECKPOINT
El cierre automático del P padre muta status = done sin _undoSnapshot() previo. No hay criterio de que esta mutación debe registrarse en el stack de undo.
Aislamiento de closures de window.* entre aperturas de showMergeDiffPanel
Merge de CHECKPOINT
Las funciones window._mdiff* se redefinen en cada apertura. No hay criterio de que deben limpiarse o protegerse entre instancias del panel.
Restauración del project filter si loadBacklog falla en el finally de showMergeDiffPanel
Merge de CHECKPOINT
El finally restaura el filter pero puede fallar si loadBacklog lanza. No hay criterio de atomicidad de la operación de cambio temporal de filter.
Orden de _blogLog y _undoSnapshot en setItemStatus
Cambio de status
Log se registra antes del snapshot. No hay criterio de que el log debe ser coherente con el estado efectivamente persistido.
Exclusión de sprints cerrados en _calcPriority regla de effort 1
Cambio de status
Ítems pendientes con effort 1 en sprint cerrado reciben priority high. No hay criterio de que sprints cerrados deben excluirse del cálculo de prioridad automática.
Límite de carga en _calcRelevanceScore — getAllSessions por ítem
Cambio de status
getAllSessions() se llama por cada ítem en cada recalculo. No hay criterio de performance ni de caché para esta operación en backlogs grandes.
Valor correcto de isLast cuando skipStep2 = true en _scmRender
Cierre de sprint
Con skipStep2 = true, isLast nunca es true en step 2 — el botón "Cerrar sprint" no aparece. No hay criterio de que el último paso efectivo debe determinar isLast independientemente del número de paso.
Fuente canónica de _scmState en _scmStep1Html
Cierre de sprint
La función accede _scmState como global y como parámetro derivado. No hay criterio de cuál fuente es la autoritativa en caso de divergencia.


---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2a — flujos core ai-tracker-backlog.js
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 4 flujos core — carga de backlog, merge de CHECKPOINT, cambio de status, cierre de sprint. Cruzado contra deuda técnica de audit-backlog-1a.md. 12 hallazgos: 1 crítico, 4 mayores, 7 menores. 12 gaps de AC documentados para Cael.
Archivos: ai-tracker-backlog.js | audit-backlog-1a.md
Contexto: Fase 2 de auditoría PP — flujos core previo a auditoría de render e ítems (sesión 2b)
Bloqueantes: Bug crítico B-[pendiente-ID]-scmRender-isLast — _scmRender() con skipStep2=true hace inaccesible el botón "Cerrar sprint" desde la UI. Bloquea release.
Aprendizaje: El patrón dominante es mutación de ITEMS sin _undoSnapshot() previo (merge padre, sanitize doneAt). Todos los flujos que mutan ITEMS fuera de setItemStatus() son candidatos a este gap. Cael debe revisar si existe AC general de "toda mutación de ITEMS debe registrar snapshot" — actualmente no está declarado.
CONTEXT-SECTION: n/a
Decisión: Auditoría 2a completada. Bug crítico identificado — bloquea release. 4 bugs mayores requieren decisión de Cael sobre si bloquean release. 7 menores documentados para siguiente sprint.
Próximo paso: 1) Escalar bug crítico a Vera (isLast siempre 3 en _scmRender) — decisión de release. 2) Entregar lista de gaps de AC a Cael — 12 ítems. 3) Rune recibe bugs mayores con pasos reproducibles. 4) Sesión 2b: auditoría de render de ítems y editor.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_scmRender() isLast siempre 3 — botón Cerrar sprint inaccesible con skipStep2=true",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Cierre de sprint",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Con skipStep2=true, isLast es true cuando step === 2 (último paso efectivo)",
      "El botón 'Cerrar sprint' aparece en el último paso efectivo independientemente de si skipStep2 es true o false",
      "El paso 3 no renderiza cuando skipStep2=true"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_normalizeStatus — fallo silencioso en loadBacklog si función no disponible",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si _normalizeStatus no está disponible al ejecutar loadBacklog(), se emite error visible al usuario (toast o console.error explícito)",
      "La carga no continúa silenciosamente con status sin normalizar"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "mergeBacklogFromTG — cierre automático P padre sin _undoSnapshot()",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Merge de CHECKPOINT",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El cierre automático del P padre llama _undoSnapshot() antes de mutar status",
      "Después de aplicar merge con cierre de padre, undoBacklog() revierte el estado del padre correctamente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_sanitizePendingInClosedSprints segunda pasada — corrección doneAt mismatch sin _undoSnapshot()",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si la segunda pasada de sanitize modifica al menos un ítem, se registra _undoSnapshot() antes de las mutaciones",
      "El resultado de la corrección es deshacible via undoBacklog()"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_calcRelevanceScore — getAllSessions() sin caché, O(n×m) en hot path de render",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Cambio de status",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "getAllSessions() se llama una vez por ciclo de _recalcAllScores(), no una vez por ítem",
      "Con 200 ítems pendientes y 50 sesiones, setItemStatus() completa sin bloqueo visible de UI (< 16ms)"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showMergeDiffPanel — project filter puede quedar modificado si loadBacklog falla en finally",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Merge de CHECKPOINT",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si loadBacklog() lanza dentro del finally, el project filter se restaura al valor previo antes de propagar el error",
      "El usuario ve feedback de error si la restauración falla"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "loadBacklog — saveBacklog() incondicional en cada carga aunque no haya cambios",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "saveBacklog() se llama al final de loadBacklog() solo si migrated === true o sanitized > 0",
      "Una carga limpia (sin migraciones) no escribe al storage"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "setItemStatus — _blogLog llamado antes de _undoSnapshot(), log y estado desincronizados en undo",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Cambio de status",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_undoSnapshot() se llama antes de _blogLog() en setItemStatus()",
      "Si el usuario hace undo inmediatamente después de un cambio de status, el log no contiene el cambio revertido"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showMergeDiffPanel — window._mdiff* se redefinen en cada apertura, closures anteriores reemplazadas",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Merge de CHECKPOINT",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Las funciones window._mdiff* se limpian (delete window._mdiff*) al cerrar el panel",
      "Abrir el panel múltiples veces no acumula referencias huérfanas en window"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "ITEMS IIFE — inicio silencioso sin feedback si proyecto activo no tiene datos en localStorage",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si current-project-filter apunta a un proyecto sin datos en localStorage, se emite console.warn identificando el proyecto",
      "El comportamiento de ITEMS vacío es intencional y documentado como estado válido de primer uso"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_calcPriority — effort 1 en sprint cerrado eleva priority a high en ítems pendientes",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Cambio de status",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regla de effort 1 → high solo aplica si el sprint asignado está en status 'active' u 'open'",
      "Ítems en sprints cerrados no reciben prioridad automática alta por effort"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_scmStep1Html — doble fuente de verdad _scmState como global y como parámetro derivado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Cierre de sprint",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_scmStep1Html accede métricas de effort exclusivamente via los parámetros recibidos, no via _scmState global directamente",
      "No hay referencias directas a _scmState dentro de _scmStep1Html"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2a-auditoria-core
    rol: QA · Finn
    items: [pendiente-ID-scmRender, pendiente-ID-normalizeStatus, pendiente-ID-mergePadre]
    archivos: [ai-tracker-backlog.js]
    depende_de: []
---EXECUTION-PLAN-END---



---

## Sesión 2b — Render de ítems + editor
Informe funcional — Sesión 2b
Flujo
AC verificado
Gap de especificación
Bug detectado
Pasos reproducibles
buildBacklogItem — colapso/expansión
Parcial
Sin AC para comportamiento cuando openItemPanel() falla (ítem sin ID de panel en DOM)
Menor — item.desc renderizado en bitem-body pero desc no es campo canónico (schema_version 1 usa title); ítems legacy con desc muestran contenido fantasma sin advertencia
1. Ítem con campo desc pero sin title. 2. Expandir ítem. 3. Se renderiza <p class="bitem-desc"> con contenido de desc. 4. El mismo ítem en editor solo muestra title. Campo inconsistente entre render y schema.
buildBacklogItem — hijos y progreso (tipo R)
Parcial
Sin AC para progreso cuando los hijos de un R no pasan los filtros activos (pct calculado sobre children filtrados, no allChildren)
Mayor — porcentaje de progreso calculado sobre hijos que pasan filtros activos, no sobre total de hijos. Con filtro de status activo, el % puede mostrar 100% cuando hay hijos done/descartado ocultos.
1. R con 4 hijos: 2 done, 2 descartado. 2. Activar filtro status=done. 3. children = 2, doneCount = 2, pct = 100%. 4. Filtro status=pendiente: children vacío → bloque no renderiza. Feedback de progreso inconsistente con filtros.
_buildChildrenBlock — IDs de DOM desfasados
No (confirmado de Fase 1)
Sin AC para estabilidad de IDs de DOM tras mutación de ITEMS
Mayor — cIdx = ITEMS.indexOf(child) capturado al render. Si ITEMS muta (undo, merge) sin re-render, toggleItemExpand(cIdx) abre el cuerpo del ítem equivocado. ciarrow-${cIdx} e ibody-${cIdx} apuntan a posición obsoleta.
1. R con 2 hijos renderizados. 2. Aplicar undo que reordena ITEMS. 3. Sin re-render, clic en flecha de hijo. 4. toggleItemExpand(cIdx) opera sobre ítem con nuevo índice — expande ítem incorrecto.
_attachBacklogDnD — activación
No (confirmado de Fase 1)
Sin AC declarando que DnD es inactivo como estado intencionado, ni criterio de reactivación
Mayor — backlogSortMode se inicializa en 'priority' (L329) y fue deprecado el valor 'sprint' (T-202604-424, L1388). La condición backlogSortMode !== 'sprint' en L3625 es siempre true: _attachBacklogDnD() retorna inmediatamente en cada llamada. El drag handle ⠿ se renderiza visualmente para ítems con sprint (L4025) pero arrastrarlo no hace nada.
1. Ítem con sprint asignado. 2. Ver drag handle ⠿ en header. 3. Intentar arrastrar. 4. No hay efecto — DnD listeners nunca se adjuntan. Handle visible pero no funcional.
_attachBacklogDnD — persistencia
No aplica
Sin AC — DnD nunca alcanza persistencia
n/a — flujo inaccesible
—
Item editor — apertura
No verificable
Gap crítico — openItemEditor() se llama desde múltiples puntos (L3620, L3749, L4114, L4171, L7251) pero no está definida en ai-tracker-backlog.js. Función externa sin guardia de existencia. Si el módulo que la define no está cargado, todos los botones "✎ Editar" fallan silenciosamente.
Mayor — sin guardia typeof openItemEditor === 'function' en ninguna llamada inline de HTML. Error JS no manejado en producción si el módulo externo no carga.
1. Cargar PP sin el módulo que define openItemEditor. 2. Clic en cualquier botón "✎ Editar". 3. ReferenceError: openItemEditor is not defined — sin feedback al usuario.
Item editor — campos, validación, guardado, cancelación
No verificable
Gap de especificación — implementación en módulo externo no auditado en esta sesión
—
—
Focus mode — activación por shortcut (Backlog)
No
Sin AC que declare cuál de los dos focus modes activa el shortcut
Mayor — el shortcut Cmd+F / Ctrl+F (T-202605-441, L7843) llama toggleFocusMode() (L7124), que es el focus mode del item detail panel (modo pantalla completa de panel lateral). No llama toggleBacklogFocusMode() (L1652), que es el Focus Top-10 del backlog. El comentario en L7827 dice "→ toggleFocusMode" — el nombre podría ser intencional, pero el comportamiento esperado desde el contexto del tab Backlog es ambiguo. Con el panel cerrado, el shortcut activa _focusModeActive pero no hay panel visible — el toggle no produce cambio visual perceptible.
1. Tab Backlog activo, sin ítem expandido. 2. Cmd+F. 3. _focusModeActive = true pero idp-focus-btn no existe en DOM. 4. Sin cambio visual. El shortcut no activa el Focus Top-10.
Focus mode — filtro visual y desactivación
Parcial
Sin AC para comportamiento de Esc cuando ambos focus modes están activos simultáneamente
Menor — _backlogFocusMode y _focusModeActive son variables independientes sin sincronización. Activar backlog focus mode + expandir ítem + activar panel focus mode = dos estados de "focus" activos. Esc solo maneja _focusModeActive (L7181). _backlogFocusMode no tiene handler de Esc.
1. Activar Focus Top-10 (botón fbar). 2. Expandir ítem → panel abre. 3. Activar Focus mode del panel. 4. Presionar Esc. 5. Solo se desactiva _focusModeActive. _backlogFocusMode permanece activo.
_initFocusShortcut — cleanup
No (confirmado de Fase 1)
Sin AC para cleanup de listeners en hot reload
Menor — listener de keydown en document sin mecanismo de limpieza. Confirmado: no hay removeEventListener.
1. Hot reload del módulo en desarrollo. 2. Cada recarga acumula un listener adicional. 3. Cmd+F dispara N veces toggleFocusMode() — N = número de recargas.


Lista de gaps de AC para Cael
Título del gap
Flujo afectado
Comportamiento observable sin AC
Progreso de R con filtros activos
buildBacklogItem — hijos tipo R
El % de progreso se calcula sobre hijos que pasan los filtros de status activos, no sobre el total de hijos del R. Con filtros activos el usuario ve un porcentaje que no refleja el estado real del R.
desc como campo de render legacy
buildBacklogItem — expansión
Ítems con campo desc renderizan su contenido en bitem-body aunque desc no sea campo canónico del schema. Sin advertencia al usuario de que el campo está fuera de schema.
Estabilidad de IDs de DOM en _buildChildrenBlock tras mutación de ITEMS
_buildChildrenBlock
cIdx = ITEMS.indexOf(child) capturado al render. Tras undo o merge sin re-render, los IDs ibody-cIdx y ciarrow-cIdx apuntan a índices obsoletos. toggleItemExpand(cIdx) opera sobre el ítem incorrecto.
DnD inactivo como estado declarado o criterio de reactivación
_attachBacklogDnD
El drag handle ⠿ se renderiza para ítems con sprint, pero DnD nunca se activa. No hay AC que declare si esto es intencional, deprecado permanentemente, o pendiente de reactivación bajo nueva condición.
Guardia de existencia para openItemEditor
Item editor — apertura
openItemEditor() se invoca desde HTML inline en múltiples funciones de render sin guardia typeof openItemEditor === 'function'. Si el módulo externo no carga, el error es silencioso para el usuario.
Shortcut Cmd+F — cuál focus mode activa
Focus mode — activación
El shortcut llama toggleFocusMode() (panel focus) no toggleBacklogFocusMode() (Top-10). Con panel cerrado, el shortcut no produce cambio visual. No está declarado si este comportamiento es el intencional.
Comportamiento de Esc con ambos focus modes activos
Focus mode — desactivación
_backlogFocusMode y _focusModeActive pueden estar activos simultáneamente. Esc solo desactiva _focusModeActive. No hay AC que defina el orden de desactivación ni si Esc debe desactivar ambos.
_purgeStaleBacklogCache — función definida pero sin caller
Carga de backlog (deuda)
La función purga el array global ITEMS sin saveBacklog() posterior, y no tiene ningún caller en el archivo. No está claro si es dead code, si debe ser invocada por loadBacklog(), o si fue reemplazada por lógica en Supabase.


---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2b — render, DnD, item editor, focus mode, _buildChildrenBlock
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 5 flujos de render e interacción. 8 hallazgos: 0 críticos, 4 mayores, 3 menores, 1 no verificable (item editor — módulo externo). 8 gaps de AC documentados para Cael. Confirmación de deuda de Fase 1: DnD silenciosamente inactivo confirmado. IDs de DOM desfasados en _buildChildrenBlock confirmado.
Archivos: ai-tracker-backlog.js | audit-backlog-1a.md
Contexto: Fase 2 de auditoría PP — flujos de render e ítem previo a cierre de auditoría completa
Bloqueantes: n/a — ningún bug de esta sesión bloquea release por sí solo. Bug mayor de item editor (openItemEditor sin guardia) requiere evaluación de Vera: si el módulo externo siempre carga, el riesgo es bajo; si puede fallar, es bloqueante.
Aprendizaje: Dos variables de focus mode independientes (_backlogFocusMode / _focusModeActive) sin sincronización ni AC compartidos generan comportamiento ambiguo acumulado. Patrón a declarar en AC general: estados de UI mutuamente excluyentes deben tener AC de desactivación coordinada. openItemEditor como función externa sin guardia es el patrón de riesgo más alto de esta sesión — cualquier dependencia externa sin guardia en HTML inline es potencialmente silenciosa en producción.
CONTEXT-SECTION: n/a
Decisión: Auditoría 2b completada. 4 bugs mayores pasan a Rune con pasos reproducibles. 8 gaps de AC pasan a Cael. Decisión de Vera requerida sobre openItemEditor sin guardia antes de release.
Próximo paso: 1) Entregar lista de gaps de AC a Cael — 8 ítems. 2) Rune recibe los 4 bugs mayores. 3) Vera evalúa si openItemEditor sin guardia bloquea release. 4) Si se requiere auditoría de módulo externo de item editor — adjuntar archivo correspondiente para sesión 2c.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildChildrenBlock — cIdx por ITEMS.indexOf capturado al render, IDs de DOM desfasados tras mutación sin re-render",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Render de ítems",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Los IDs de DOM de hijos (ibody-*, ciarrow-*, code-badge-*) se generan desde item.code, no desde ITEMS.indexOf(child)",
      "toggleItemExpand invocado desde un hijo apunta al ítem correcto independientemente de mutaciones previas de ITEMS"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openItemEditor invocada en HTML inline sin guardia typeof — falla silenciosa si módulo externo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Item editor",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Todas las llamadas inline a openItemEditor están precedidas de guardia typeof o equivalente",
      "Si openItemEditor no está disponible, el usuario recibe feedback visible (toast de error o botón deshabilitado) en lugar de error JS silencioso"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_attachBacklogDnD — drag handle visible para ítems con sprint pero DnD nunca se activa (backlogSortMode nunca es 'sprint')",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Drag & drop",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El drag handle ⠿ solo se renderiza si DnD está efectivamente activo para ese ítem",
      "O bien: DnD se reactiva bajo la condición correcta (no backlogSortMode==='sprint') y el handle refleja el estado real"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Shortcut Cmd+F llama toggleFocusMode (panel focus) no toggleBacklogFocusMode (Top-10) — sin efecto visual con panel cerrado",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Focus mode",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Con tab Backlog activo y sin panel abierto, Cmd+F activa el Focus Top-10 (_backlogFocusMode) con cambio visual inmediato en la lista",
      "Con panel abierto, Cmd+F activa el focus mode del panel (_focusModeActive) — comportamiento actual se mantiene"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogItem — porcentaje de progreso de R calculado sobre hijos filtrados, no sobre total de hijos",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Render de ítems",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El porcentaje de progreso del R se calcula siempre sobre allChildren (total de hijos sin filtrar)",
      "Los filtros de status activos afectan qué hijos se muestran en la lista pero no el denominador del porcentaje"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Focus mode — _backlogFocusMode y _focusModeActive activos simultáneamente, Esc desactiva solo _focusModeActive",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Focus mode",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Esc desactiva ambos focus modes si ambos están activos, en orden: _focusModeActive primero, _backlogFocusMode segundo",
      "O bien: los dos modos son mutuamente excluyentes — activar uno desactiva el otro"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_initFocusShortcut — listener keydown sin cleanup, acumula duplicados en hot reload",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Focus mode",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El listener de keydown de _initFocusShortcut se registra con referencia nombrada para permitir removeEventListener",
      "Recargar el módulo no acumula listeners adicionales — verificable con un único disparo de toggleFocusMode por Cmd+F"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogItem — item.desc renderizado en bitem-body aunque 'desc' no es campo canónico del schema",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Render de ítems",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Ítems con campo desc legacy muestran advertencia visual de campo fuera de schema",
      "O bien: desc se migra a title en loadBacklog() y no se renderiza como campo independiente"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2b-render-dnd-focus
    rol: QA · Finn
    items: [pendiente-ID-cIdx-dom, pendiente-ID-openItemEditor-guardia, pendiente-ID-dnd-handle, pendiente-ID-shortcut-focus]
    archivos: [ai-tracker-backlog.js]
    depende_de: []
---EXECUTION-PLAN-END---

---

## Sesión 2c — Sesiones + AI Notes - ## Sesión 2c-bis — AI Notes
Alcance del módulo — nota crítica: ai-tracker-ai-notes.js contiene el editor de ítems de backlog (con campo notes), el sistema de búsqueda global (onSearch), la visualización de quickNotes en proyectos y resultados de búsqueda, y funciones de avatares, reportes y utilidades de UI. openQuickNote (CRUD completo de quickNotes) no está definido en este archivo — es dependencia de otro módulo. Los flujos de la tarea se mapean así:
Creación/Edición de nota → openItemEditor + confirmItemEditor (notas en campo item.notes de ítems de backlog)
Búsqueda → onSearch con filtro de state.quickNotes
Eliminación → no implementada en este módulo (backlog item delete vive en otro archivo)

INFORME FUNCIONAL — Sesión 2c-bis
Flujo
AC verificable
Gap de especificación
Bug detectado
Tipo
Pasos reproducibles
Creación — apertura editor (openItemEditor nuevo)
No — sin AC formal
✓ No hay AC que defina estado inicial de item-notes cuando elemento DOM ausente
Bug menor
Menor
1. Abrir editor con openItemEditor() en entorno donde #item-notes no existe. 2. Guardar. Resultado: notes queda '' sin advertencia. No hay feedback de campo ausente.
Creación — código generado localmente (_getNextItemCode)
No
✓ Sin AC que cubra generación de código local vs asignación por PEPE (Base Rules §5)
Gap de especificación
—
—
Creación — autofill paste (_ieAutofillFromPaste) acepta tipo I
No
✓ [PTRBI] en regex acepta I que no es tipo válido (Base Rules §5); ítem tipo I se crea sin error
Bug mayor
Mayor
1. Abrir editor nuevo. 2. Pegar en campo desc: I: [pendiente-ID]: Mi idea | effort:1. 3. Autofill ocurre. 4. Guardar. Resultado: ítem creado con type.value = 'I' — tipo inválido en schema.
Creación — autofill Markdown acepta tipo I
No
Mismo patrón — regex /^###\s+(?:[PTRBI]-\d{6}-\d{3})/ en L1265
Bug mayor
Mayor
1. Abrir editor. 2. Pegar bloque ### I-202605-001 · Título. 3. Autofill popula type=I.
Edición — status no se expone ni actualiza en editor
No — comentado L1413-1414
✓ Sin AC que documente que status es read-only en editor de ítems; usuario puede esperar cambiarlo ahí
Gap de especificación
—
—
Edición — código colisión al editar detecta correctamente
Sí (AC-10 documentado L1404)
—
Sin bug
—
—
Edición — effort obligatorio para no-P
Sí (R-202605-122 AC1)
—
Sin bug
—
—
Eliminación — no implementada en este módulo
—
✓ Sin AC que documente que delete de ítem vive en módulo externo; openItemEditor no tiene botón de eliminar ni referencia cruzada documentada
Gap de especificación
—
—
Búsqueda — onSearch filtra quickNotes por texto/itemRef
Parcialmente
✓ quickNotes no respeta scope de proyecto activo (_activeProjId) — filtra global siempre aunque scope = "Proyecto activo"
Bug mayor
Mayor
1. Tener notas en proyecto A y proyecto B. 2. Seleccionar proyecto A como activo. 3. Buscar término que matchea nota de proyecto B. 4. Resultado: nota de proyecto B aparece aunque scope = "Proyecto activo". Esperado: solo notas del proyecto activo.
Búsqueda — click en resultado de quickNote (openQuickNote)
No — función no definida en módulo
Bug crítico
Crítico
1. Tener al menos una quickNote en state. 2. Buscar término que matchee texto de nota. 3. Click en resultado. 4. Resultado: ReferenceError: openQuickNote is not defined. Esperado: abrir la nota.


Búsqueda — click en nota en panel de proyecto (openQuickNote)
No
Mismo bug crítico
Crítico
1. Ir a tab Proyectos. 2. Ver sección "Notas" de un proyecto con quickNotes. 3. Click en cualquier nota. 4. ReferenceError: openQuickNote is not defined.


Búsqueda — highlight de término en resultados
Sí (B-202605-237 documentado)
—
Sin bug
—
—
Búsqueda — límite de 20 notas en resultados sin AC formal
No
✓ Límite hardcodeado de 20 notas (L2145) y 30 sesiones sin AC documentado
Gap de especificación
—
—
_toggleSearchScope — scope no re-renderiza sin query activo
No
✓ Si el campo está vacío y se cambia scope, onSearch llama render() en vez de actualizar el panel de scope
Observación
Observación
—
showInlineConfirm — interpolación directa de id/action sin _esc()
No
—
Bug mayor (heredado — confirmado en Fase 1)
Mayor
Ver audit-1c línea 19 — ya documentado
selectAvatarOption — usa event implícito global
No
—
Bug menor (confirmado Fase 1)
Menor
Ver audit-1c línea 5
Listener keydown en document.addEventListener (L271) — función anónima sin cleanup
No
—
Bug menor
Menor
Listener registrado con arrow function anónima — removeEventListener imposible en hot reload. Mismo patrón que sesión 2c.
state.ais.push en confirmAddAI — id: 'ai-'+Date.now() sin componente random
No
—
Bug menor (confirmado Fase 1)
Menor
Ver audit-1c línea 9 — ya documentado


GAPS DE AC PARA CAEL
Gap de especificación — openItemEditor / confirmItemEditor
Comportamiento sin AC: el campo item-notes del editor puede estar ausente del DOM sin que el formulario lo detecte ni lo notifique. En ese caso notes se guarda como '' silenciosamente.
Por qué importa: si Rune o Nova modifican el HTML del editor y omiten #item-notes, la pérdida de datos es silenciosa — sin warning, sin error, sin AC que valide presencia del campo.
Acción sugerida: pasar a Cael (PO+BA) — AC incompleto

Gap de especificación — confirmItemEditor / _ieAutofillFromPaste
Comportamiento sin AC: la regex de autofill acepta tipo 'I' como tipo válido en ambos formatos (CHECKPOINT line y Markdown). El ítem se crea con type='I' sin validación de tipo al guardar.
Por qué importa: Base Rules §5 define solo P/T/R/B como tipos válidos. Un ítem tipo I rompe parsers downstream (PEPE, buildBacklogMd). Sin AC que valide type al guardar, Rune no tiene criterio de rechazo.
Acción sugerida: pasar a Cael (PO+BA) — AC incompleto

Gap de especificación — openItemEditor (modo edición)
Comportamiento sin AC: el campo status no está expuesto en el editor de ítems. No hay AC que declare que status es read-only en este contexto. El usuario no puede ver ni modificar status desde el editor.
Por qué importa: si el equipo decide exponer status en el editor en el futuro, no hay línea de base documentada. Y si el founder espera poder cambiar status desde el editor, hay una expectativa no capturada.
Acción sugerida: pasar a Cael (PO+BA) — comportamiento de status en editor sin AC

Gap de especificación — openItemEditor (eliminación de ítems)
Comportamiento sin AC: el editor de ítems no tiene opción de eliminar. La eliminación de backlog items vive en un módulo externo sin referencia cruzada en este editor. No hay AC que documente esta separación intencionada.
Por qué importa: si Rune agrega un botón de eliminar al editor sin saber que existe otro mecanismo, genera duplicación de lógica con comportamientos inconsistentes.
Acción sugerida: pasar a Cael (PO+BA) — AC de scope del editor incompleto

Gap de especificación — onSearch / quickNotes
Comportamiento sin AC: el filtro de quickNotes en onSearch no aplica el proyecto activo (_activeProjId). Las notas se muestran globalmente independientemente del scope seleccionado.
Por qué importa: el founder puede esperar que "Proyecto activo" filtre también las notas. Sin AC que declare si quickNotes deben o no respetar scope de proyecto, Rune no tiene criterio de implementación.
Acción sugerida: pasar a Cael (PO+BA) — AC de scope de notas en búsqueda indefinido

Gap de especificación — onSearch / quickNotes / resultado de búsqueda
Comportamiento sin AC: el click en un resultado de quickNote llama openQuickNote() que no está definido en este módulo. No hay AC que documente que openQuickNote es dependencia externa ni en qué módulo vive.
Por qué importa: la función está ausente — cualquier búsqueda de nota crashea con ReferenceError. Sin AC que declare la dependencia, el bug no es atribuible a un AC incumplido sino a una dependencia no especificada.
Acción sugerida: pasar a Cael (PO+BA) — dependencia de openQuickNote sin AC ni documentación de módulo

Gap de especificación — onSearch / límites de resultados
Comportamiento sin AC: notas limitadas a 20 resultados (L2145), sesiones a 30 (L2017). Límites hardcodeados sin AC que los justifique ni que defina comportamiento de "ver más".
Por qué importa: sin AC de límite, Rune puede cambiar el valor en refactors futuros sin saber que hay una decisión de diseño detrás.
Acción sugerida: pasar a Cael (PO+BA) — AC de límites de resultados de búsqueda ausente

---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2c-bis — ai-tracker-ai-notes.js
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 4 flujos sobre ai-tracker-ai-notes.js. Flujos cubiertos: creación de nota/ítem (openItemEditor + confirmItemEditor), edición de ítem existente, eliminación (no implementada en módulo), búsqueda y filtrado (onSearch + quickNotes). 2 bugs críticos: openQuickNote no definida en módulo — ReferenceError al click en cualquier resultado de nota o nota de proyecto. 3 bugs mayores: autofill acepta tipo I inválido (2 rutas: CHECKPOINT line y Markdown), quickNotes ignora scope de proyecto activo en búsqueda. 4 bugs menores: item-notes ausente silencioso, listener keydown anónimo sin cleanup, + 2 confirmados de Fase 1. 7 gaps de AC documentados para Cael. Patrón cruzado con 2c: listener anónimo sin cleanup confirmado también en este módulo (L271). openQuickNote es dependencia externa no declarada — hallazgo nuevo, no cubierto en 1c.
Archivos: ai-tracker-ai-notes.js | audit-ai-tracker-ai-notes-1c.md
Contexto: Fase 2 de auditoría PP — módulo de notas y utilidades de UI, sesión 2c-bis
Bloqueantes: 2 bugs críticos — openQuickNote no definida bloquea flujo completo de notas desde búsqueda y desde panel de proyecto. Requiere evaluación de Vera: ¿bloquea release?
Aprendizaje: openQuickNote referenciada en 3 puntos del módulo (L2148, L5661) sin estar definida aquí ni documentada como dependencia externa. Patrón de scope-ignorance en quickNotes: el filtro de proyecto activo no se propaga al bloque de notas en onSearch — inconsistencia con el comportamiento de sesiones y proyectos que sí respetan _activeProjId. Autofill acepta tipo I en ambas rutas de parse — mismo tipo inválido que aparece en tracker legacy de sesión 2c, pero en un módulo distinto.
CONTEXT-SECTION: n/a
Decisión: Auditoría 2c-bis completada. 2 bugs críticos pasan a Rune. 3 bugs mayores pasan a Rune con pasos reproducibles. 7 gaps de AC pasan a Cael. Vera evalúa si openQuickNote ausente bloquea release.
Próximo paso: 1) 7 gaps de AC a Cael. 2) Rune recibe 2 críticos + 3 mayores con pasos reproducibles. 3) Vera evalúa bloqueo de release por openQuickNote. 4) Auditoría 2c-bis cerrada — Finn disponible para módulo siguiente si Vera lo indica.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openQuickNote no definida en módulo — ReferenceError al click en resultado de búsqueda de nota",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Búsqueda global · Notas",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Click en resultado de quickNote en panel de búsqueda abre la nota sin ReferenceError",
      "openQuickNote está definida o importada en el módulo que la llama",
      "Verificable: buscar término que matchee una nota, click en resultado — sin error en consola"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openQuickNote no definida en módulo — ReferenceError al click en nota en panel de proyecto",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Panel de proyecto · Notas",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Click en proj-note-row en panel de proyecto activa nota sin ReferenceError",
      "Verificable: ir a tab Proyectos, ver sección Notas de proyecto con quickNotes, click en cualquier nota — sin error en consola"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_ieAutofillFromPaste — regex [PTRBI] acepta tipo I inválido; ítem creado con type=I sin error",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Editor de ítems · Autofill",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regex de autofill en _ieAutofillFromPaste acepta solo tipos [PTRB] — sin I",
      "Paste de línea con prefijo I: no activa autofill o muestra toast de tipo inválido",
      "Ningún ítem se crea con type='I' desde el editor"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_ieAutofillFromPaste formato Markdown — regex acepta I-XXXXXX-NNN como código válido",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Editor de ítems · Autofill",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regex mdHeaderRe en _ieAutofillFromPaste acepta solo prefijos [PTRB] en códigos reales",
      "Paste de bloque ### I-202605-001 · Título no activa autofill o rechaza el tipo con mensaje",
      "Ningún ítem se crea con code iniciando en I- desde el editor"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "onSearch — quickNotes no respetan scope de proyecto activo; notas globales aparecen en scope 'Proyecto activo'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Búsqueda global · Scope",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cuando scope = 'Proyecto activo', noteMatches filtra state.quickNotes por proyecto activo si las notas tienen campo projectId o equivalente",
      "Cuando scope = 'Todos los proyectos', noteMatches muestra todas las notas sin filtro de proyecto",
      "Comportamiento de scope en notas es consistente con el de sesiones y proyectos en la misma función"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openItemEditor — campo item-notes ausente del DOM no genera warning; notes se pierde silenciosamente",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Editor de ítems",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si #item-notes no existe en el DOM al guardar, confirmItemEditor emite warning en consola con nombre del campo ausente",
      "El campo notes no se pierde silenciosamente — o existe en el DOM o se documenta explícitamente su ausencia"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Listener keydown en document.addEventListener (L271) registrado con función anónima — sin cleanup en hot reload",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Gestión de eventos globales",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El listener keydown de L271 se registra con referencia nombrada para permitir removeEventListener",
      "Recargar el módulo no acumula listeners adicionales — verificable con un único disparo de closeCkptPanel() por ESC"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2c-bis-ai-notes
    rol: QA · Finn
    items: [pendiente-ID-openquicknote-search, pendiente-ID-openquicknote-proj, pendiente-ID-autofill-type-i-line]
    archivos: [ai-tracker-ai-notes.js]
    depende_de: []
---EXECUTION-PLAN-END---

---

## Sesión 2c — Sesiones + AI Notes - ## Sesión 2c — Sesiones

Informe funcional — Sesión 2c · ai-tracker-session.js
Flujo
AC verificado
Gap de especificación
Bug detectado
Tipo
Pasos reproducibles
1a. Apertura — parsePaste detect. CHECKPOINT
Parcial
CANONICAL_PROJECTS contiene 'Obsidiana Labs' y 'Obsidiana' — strings deprecados. Validación L473-479 acepta proyectos inválidos
—
—
Pegar CHECKPOINT con Proyecto: Obsidiana Labs → parsePaste valida como correcto
1b. Apertura — parsePaste detect. CHECKPOINT
No
No hay AC que defina qué pasa cuando Proyecto: del CHECKPOINT coincide con CANONICAL_PROJECTS pero no con el proyecto del card
Bug: comparación proyecto (L1669) es toLowerCase() pero CANONICAL_PROJECTS es case-sensitive (L4) — comportamiento inconsistente
Mayor
1. Card con proyecto "ASVAB App". 2. Pegar CHECKPOINT con Proyecto: asvab app (minúscula). 3. La pill de preview muestra validación ok (lowercase match en L510), pero la comparación de proyecto del card falla → modal Continuar/Cancelar inesperado
1c. Apertura — selección de IA y rol
No hay AC
No hay AC para el flujo de selección de IA antes de abrir card
—
—
—
2a. Registro actividad — timestamps
Parcial
newSess.id = Date.now().toString() (L1843) — colisión posible en guardados rápidos. Sin AC que defina unicidad de ID
Bug: sess.id generado con Date.now() sin componente random — si dos guardados ocurren en el mismo ms, la segunda sobreescribe silenciosamente en ordenación cronológica
Menor
1. Guardar dos sesiones en la misma IA en rápida sucesión programáticamente. 2. Ambas tendrán el mismo timestamp base. parseInt(sess.id) en sort (L2874) puede ordenarlas erróneamente
2b. Registro actividad — ítems referenciados
Parcial
tracker.items (L1869-1881) actualiza desc/status/sessionId con schema distinto al backlog principal. Sin AC que declare qué esquema es fuente de verdad
Bug: regex L1876 usa [PITRB] — tipo 'I' inexistente en el sistema. Ítems con código 'I-...' incrementarían contadores incorrectamente
Mayor
1. Crear ítem con code I-202605-001 en ---ITEMS---. 2. Guardar sesión. 3. tracker.counters[I] se incrementa aunque 'I' no es tipo válido en Base Rules §5
2c. Registro actividad — ítems referenciados
No
newSess push a activeProj.sessions (L1861) ocurre ANTES de showMergeDiffPanel (L1887-1892). Sin AC que cubra cancelación del panel
Bug: si el usuario cancela showMergeDiffPanel, la sesión ya quedó persistida en sessions[] sin tgItems mergeados — sesión huérfana con trackerRefs vacíos
Crítico
1. Pegar CHECKPOINT con ítems. 2. Presionar Guardar. 3. Panel MergeDiff aparece. 4. Presionar Cancelar. 5. Verificar activeProj.sessions: la sesión existe sin ítems mergeados
3a. Cierre — guardado y persistencia
Parcial
saveImmediate() en path completeQuickSession (L1803) — sin manejo de error. Sin AC que cubra fallo de persistencia
Bug: draft a Supabase (L353-365) no tiene manejo de error de red — solo QuotaExceededError cubierto. Confirmado en audit-1f
Menor
1. Con Supabase configurado y red cortada. 2. Pegar texto largo. 3. Esperar 3s de debounce. 4. Supabase upsert falla silenciosamente — sin feedback al usuario
3b. Cierre — render en historial
Parcial
Doble render() en rAF (L1960 y segundo en rAF L1812 del path completeFinish) — dos renders por guardado. Sin AC que defina comportamiento de render post-guardado
Bug: doble render() ejecuta _rebuildLogBody() dos veces por cada guardado (por el monkey-patch de window.render en L3185-3188). Potencial flash visual
Menor
1. Guardar sesión. 2. Observar: render se llama, luego rAF llama render de nuevo. _rebuildLogBody ejecuta dos veces. Card puede flashear dos veces
3c. Cierre — changelog
Sí
—
—
—
—
4a. Resumen semanal — trigger
No hay AC
Resumen semanal (buildBacklogMd/generateBacklogMd) no tiene trigger documentado. Sin AC que defina cuándo se genera
—
—
—
4b. Resumen semanal — generación
Parcial
buildBacklogMd (L1562-1617) itera sobre byType[item.code[0]] (L1599) — si item.code está vacío o es [pendiente-ID], item.code[0] es [ y cae en bucket inexistente. Sin AC que cubra ítems sin código real
Bug: ítems con code [pendiente-ID] se clasifican en byType['['] (undefined) y se pierden silenciosamente del reporte. Ninguna advertencia al usuario
Mayor
1. Tener ítems en tracker con code [pendiente-ID]. 2. Llamar buildBacklogMd(). 3. Los ítems no aparecen en ninguna sección del Markdown generado
4c. Resumen semanal — display
Parcial
buildBacklogMd (L1604) renderiza item.desc en lugar de item.title — campo desc es alias deprecado según Base Rules §6. Sin AC que especifique qué campo mostrar
Bug: backlog generado usa item.desc (L1604) — si ítems solo tienen title (schema v1), el reporte muestra vacío en lugar del título
Mayor
1. Tener ítems con schema_version 1 (campo title, sin desc). 2. Llamar buildBacklogMd(). 3. Las filas ### code · undefined aparecen en el reporte
Verificación _initFocusShortcut
No aplica
El módulo ai-tracker-session.js no contiene _initFocusShortcut. El listener acumulable de ESC en el window load hook (L3201-3208) es anónimo y no tiene cleanup — mismo patrón, distinta función
Bug: listener ESC en L3201 registrado sin referencia nombrada. Reload del módulo acumula listeners adicionales
Menor
1. Recargar la app sin hard reset. 2. Presionar ESC con log-card oculto. 3. closeLogCard() se dispara múltiples veces
_buildLogHeader color attr
No
Sin AC que valide HTML generado por pills de IA
Bug: L2918 — ${color} interpolado directamente como atributo sin nombre: <button class="..." #ff0000 ...>. HTML malformado — confirmado en audit-1f
Mayor
1. Tener IA con propiedad color. 2. Abrir log card. 3. Inspeccionar DOM de pills — atributo huérfano #ff0000 presente


Lista de gaps de AC para Cael
#
Título del gap
Flujo afectado
Comportamiento observable sin AC
1
CANONICAL_PROJECTS contiene strings deprecados
Apertura — validación de proyecto
Proyecto: Obsidiana Labs o Proyecto: Obsidiana en CHECKPOINT pasan la validación como correctos
2
Comparación de proyecto inconsistente — case-sensitive vs toLowerCase
Apertura — matching CHECKPOINT vs card
CHECKPOINT con proyecto en minúsculas puede disparar o no el modal Continuar/Cancelar dependiendo del path de comparación
3
Unicidad de sess.id no garantizada
Registro de actividad — timestamps
Dos sesiones guardadas en el mismo ms tienen el mismo ID; la ordenación cronológica es ambigua
4
Tipo 'I' aceptado en regex de contadores del tracker legacy
Registro — ítems referenciados
Ítems con code 'I-...' incrementan contador inexistente sin error
5
newSess push antes de confirmación del panel MergeDiff
Cierre — guardado y persistencia
Cancelar MergeDiff deja la sesión persistida sin ítems mergeados
6
buildBacklogMd — ítems [pendiente-ID] omitidos silenciosamente
Resumen semanal — generación
El reporte Markdown omite ítems sin código real sin advertencia
7
buildBacklogMd — usa item.desc en lugar de item.title
Resumen semanal — display
Ítems con schema_version 1 (solo title) aparecen como ### code · undefined en el reporte
8
Listener ESC anónimo en window load hook — sin cleanup
Log card — apertura/cierre
Hot reload acumula listeners; múltiples llamadas a closeLogCard() por un solo ESC
9
_buildLogHeader — color interpolado sin nombre de atributo
Log card — render header
HTML generado con atributo huérfano #rrggbb en botones de pill de IA
10
Trigger y AC de resumen semanal no definidos
Resumen semanal — trigger
No hay criterio verificable que defina cuándo y cómo se genera el resumen


---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2c — ai-tracker-session.js
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 4 flujos: apertura, registro de actividad, cierre, resumen semanal. 13 hallazgos: 1 crítico, 5 mayores, 4 menores, 3 gaps sin bug asignable. 10 gaps de AC documentados para Cael. Confirmación de patrón de audit-1f: comparación case-inconsistente de proyecto, tracker legacy con tipo 'I' inexistente, doble render post-guardado. Listener ESC anónimo sin cleanup confirmado — mismo patrón que _initFocusShortcut de sesión 2b pero en función distinta.
Archivos: ai-tracker-session.js | audit-ai-tracker-session_js-1f.md
Contexto: Fase 2 de auditoría PP — módulo de sesiones previo a cierre de auditoría completa
Bloqueantes: 1 bug crítico — newSess push a sessions[] antes de confirmación de MergeDiff. Sesión persiste aunque el usuario cancele el panel. Requiere evaluación de Vera: bloquea release o se acepta como riesgo conocido.
Aprendizaje: Patrón recurrente en el módulo: decisiones de timing de persistencia (newSess push antes de confirmación, draft Supabase sin error de red) sin AC que las respalde. El módulo asume que el usuario siempre completa el flujo positivo. buildBacklogMd es función de reporte con schema legacy (item.desc) sin migración — genera reportes silenciosamente incompletos con datos schema v1.
CONTEXT-SECTION: n/a
Decisión: Auditoría 2c completada. 1 bug crítico y 5 mayores pasan a Rune con pasos reproducibles. 10 gaps de AC pasan a Cael. Decisión de Vera requerida sobre bug crítico de newSess antes de release.
Próximo paso: 1) Entregar 10 gaps de AC a Cael. 2) Rune recibe 6 bugs (1 crítico + 5 mayores) con pasos reproducibles. 3) Vera evalúa si bug crítico de sesión huérfana bloquea release. 4) Sesión 2c-bis disponible para ai-tracker-ai-notes.js cuando se requiera.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "newSess push a sessions[] antes de showMergeDiffPanel — sesión persiste si usuario cancela el panel",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Guardado de sesión",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "newSess no se persiste en activeProj.sessions hasta que el usuario confirma el panel MergeDiff",
      "Si el usuario cancela MergeDiff, activeProj.sessions no contiene la sesión nueva",
      "El flujo de guardado es atómico: o persiste completamente (sesión + ítems mergeados) o no persiste nada"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "CANONICAL_PROJECTS contiene 'Obsidiana Labs' y 'Obsidiana' — strings deprecados aceptados como válidos en parsePaste",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Validación de CHECKPOINT",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL_PROJECTS contiene únicamente strings canónicos activos según OL-CONTEXT §3: 'Obsidian Labs', 'ASVAB App', 'Content Manager', 'AI Tracker'",
      "El comentario en L3 refleja el string canónico activo 'Obsidian Labs' sin 'a'",
      "CHECKPOINTs con 'Proyecto: Obsidiana Labs' o 'Proyecto: Obsidiana' son rechazados con mensaje de proyecto no reconocido"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Comparación de proyecto inconsistente — CANONICAL_PROJECTS case-sensitive vs pill de preview toLowerCase()",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Validación de CHECKPOINT",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La validación de proyecto en parsePaste y la comparación con el proyecto del card usan el mismo mecanismo (ambas case-insensitive o ambas case-sensitive)",
      "Un CHECKPOINT con 'Proyecto: asvab app' produce el mismo resultado de validación que 'Proyecto: ASVAB App'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "tracker legacy — regex [PITRB] incluye tipo 'I' inexistente; ítems con code I-... incrementan contadores incorrectamente",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Registro de actividad",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regex de extracción de tipo de código en _doSaveSession acepta solo [PTRB] — sin 'I'",
      "Ítems con code que no matchea [PTRB]-YYYYMM-NNN no incrementan ningún contador y se registran con type desconocido o se descartan con advertencia"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogMd — ítems con code [pendiente-ID] caen en byType['['] (undefined) y se omiten silenciosamente del reporte",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Resumen semanal",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "buildBacklogMd incluye todos los ítems del tracker independientemente del formato de su code",
      "Ítems con code '[pendiente-ID]' o similar aparecen en una sección 'Sin código asignado' del reporte, no se omiten"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogMd — usa item.desc en lugar de item.title; ítems schema_version 1 aparecen como '### code · undefined'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Resumen semanal",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "buildBacklogMd lee item.title como campo canónico (Base Rules §6), con fallback a item.desc para compatibilidad legacy",
      "Ningún ítem genera '### code · undefined' en el reporte generado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildLogHeader — color de IA interpolado como atributo sin nombre en HTML de pills; atributo huérfano en DOM",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Log de sesiones",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El color de la IA se aplica como CSS custom property en style attribute: style='--ai-pill-color: ${color}'",
      "El HTML generado para cada pill de IA no contiene atributos sin nombre",
      "Verificable con inspección del DOM de #log-ai-pills tras abrir el log card con IAs que tienen propiedad color"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Listener ESC en window load hook registrado sin referencia nombrada — acumula en hot reload",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Log de sesiones",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El listener keydown de ESC en window load hook se registra con referencia nombrada para permitir removeEventListener",
      "Recargar el módulo no acumula listeners adicionales — verificable con un único disparo de closeLogCard() por ESC"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "sess.id generado con Date.now() sin componente random — colisión posible en guardados concurrentes rápidos",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Registro de actividad",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "newSess.id se genera con Date.now() + componente aleatorio (ej: Date.now().toString(36) + Math.random().toString(36).slice(2))",
      "Dos sesiones guardadas en el mismo ms tienen IDs distintos"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Doble render() post-guardado — monkey-patch de window.render llama _rebuildLogBody() dos veces por guardado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Cierre de sesión",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Por cada guardado de sesión, _rebuildLogBody() se ejecuta exactamente una vez",
      "El rAF post-guardado no dispara render() si ya fue llamado en el flujo principal del mismo guardado"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN--- scope: sesion sesiones:
id: qa-2c-session-module rol: QA · Finn items: [pendiente-ID-newSess-critico, pendiente-ID-canonical-projects, pendiente-ID-proj-case, pendiente-ID-tipo-I] archivos: [ai-tracker-session.js] depende_de: [] ---EXECUTION-PLAN-END---


---
## Sesión 2c — Sesiones + AI Notes - BONUS

Informe funcional — Sesión 2c
Flujo auditado
AC verificado
Gap de especificación
Bug detectado
Pasos reproducibles
session.js — Apertura de sesión: nueva sesión
Parcial
Sin AC para comportamiento cuando getAI(id)devuelve null en saveSession() — la función llama ai._parsed sin guard
Mayor — saveSession(id) referencia ai._parsed en L1632 sin verificar que aino sea null. Si el card se renderiza con un idhuérfano, getAI(id) devuelve null → TypeError silencioso
1. Estado corrupto donde state.ais no contiene la IA del card. 2. Clic en Guardar. 3. const parsed = ai._parsed → TypeError: Cannot read properties of null
session.js — Apertura de sesión: selección de proyecto
Sí (R-202605-095)
Sin AC para el edge case: proyectos disponibles = 0 al abrir _showProjRequiredInPanel()
Menor — L1163 renderiza "No hay proyectos creados" pero el botón Guardar sigue presente (solo con aria-disabled). El usuario puede tabular hasta él y presionar Enter/Space — el handler tiene guard if (!_resolvedProj) return pero no hay feedback visual de por qué no ocurre nada
1. App sin proyectos creados. 2. Guardar sesión sin proyecto seleccionado. 3. Panel abre con mensaje correcto. 4. Tab hasta botón + Enter. 5. Sin feedback, sin toast, sin acción visible
session.js — Registro de actividad: timestamps
Parcial
Sin AC que declare comportamiento de interpretHora() cuando el usuario ingresa una hora pasada — epoch apunta al día siguiente (B-202604-009 documentado pero sin AC de comportamiento esperado)
Confirmado Fase 1 (baja) — no reauditar


session.js — Registro de actividad: ítems referenciados
Sí (happy path)
Sin AC para newSess guardado antes de showMergeDiffPanel — si el usuario cancela el panel, la sesión persiste sin ítems mergeados
Mayor — L1861 activeProj.sessions.push(newSess)se ejecuta antes de que showMergeDiffPanel confirme (L1887). Si el usuario cancela el modal de diff: sesión guardada en state sin trackerRefsresueltos, sin merge aplicado. Estado inconsistente permanente hasta siguiente guardado o reset
1. Sesión con ítems. 2. Guardar. 3. Panel showMergeDiffPanel abre. 4. Clic en Cancelar. 5. openDetail() muestra sesión con trackerRefs: []. 6. Ítems del backlog no actualizados. Estado inconsistente sin indicación al usuario
session.js — Cierre de sesión: guardado y draft cleanup
Sí (happy path)
Sin AC para error de red en _supabase.from('tracker_docs').delete()— solo console.warn, sin feedback al usuario si el draft no se elimina en Supabase
Menor — draft-delete Supabase falla silenciosamente (L1781, L1939). Solo console.warn. En la siguiente sesión, el draft obsoleto puede reaparecer desde Supabase si hay sincronización
1. Supabase activo. 2. Guardar sesión. 3. Simular error de red en delete. 4. console.warn pero cero feedback en UI. Draft puede persistir en Supabase
session.js — Cierre de sesión: persistencia en historial
Parcial
Sin AC para _rebuildLogBody() con listener de scroll acumulado — confirmado en Fase 1 como severidad alta. Verificación: el listener se registra en L3089 sin removeEventListener anterior en cada llamada a _rebuildLogBody(). _doApplyMergeAndFinish llama _rebuildLogBody() en L1953, más el rAF en L1958–1960 llama render() que via monkey-patch (L3185) llama _rebuildLogBody() de nuevo → 2 listeners de scroll acumulados por guardado de sesión
Mayor — acumulación de listeners de scroll en logBody en cada _rebuildLogBody(). _doApplyMergeAndFinish genera mínimo 2 acumulaciones por sesión guardada (líneas 1953 + 1960 vía render monkey-patch). Confirmación de hallazgo Fase 1 con ruta de acumulación concreta
1. Guardar sesión con ítems. 2. _rebuildLogBody() L1953: listener 1 registrado. 3. render()en rAF L1960 → monkey-patch → _rebuildLogBody() → listener 2. 4. Abrir log, scroll → scrollBtn.classList.toggledispara N veces. Con 10 guardados: 20+ listeners activos
session.js — Cierre de sesión: render en historial
Parcial
Sin AC para _buildLogHeader() — ${color}interpolado como atributo sin nombre en L2918 → HTML malformado confirmado Fase 1
Mayor (confirmado Fase 1, verificado con código real) — L2918: `<button class="log-ai-pill${active}" ${color} onclick=...>` — si ai.color = '#38bdf8', el output es <button class="log-ai-pill" #38bdf8 onclick=...>. Atributo sin nombre, parseado como #38bdf8="" o ignorado según browser. CSS de color de pill nunca aplica
1. IA con color asignado. 2. Abrir Log de sesiones. 3. Inspeccionar DOM del pill de IA. 4. Atributo #rrggbbsin nombre de atributo. 5. Color del pill no refleja color de la IA
session.js — Resumen semanal: trigger
Sí — exportWeeklySummary()invocada desde botón en Analytics (L4397 de ai-notes.js). No hay trigger automático
Sin AC que declare si el resumen es solo manual o si debe existir trigger automático (digest, notificación, etc.)
Observación — no bug


session.js — Resumen semanal: generación
Parcial
Sin AC para comportamiento cuando getAllSessions() no está disponible — llamada en L3176 de ai-notes.js sin guard typeof
Mayor — exportWeeklySummary() llama getAllSessions() en L3176 sin typeof getAllSessions === 'function'guard. Si el módulo que define getAllSessions no cargó, ReferenceError no manejado. Mismo patrón que openItemEditor sin guard (2b)
1. Cargar PP sin módulo que define getAllSessions. 2. Clic en "⬇ Resumen semanal". 3. ReferenceError sin feedback al usuario
session.js — Resumen semanal: display
Parcial
Sin AC para el caso donde s.date usa formato español (ej: "07 may. 2026") — _sessInRangeintenta new Date(s.date) y hace fallback a _parseSpanishDate. Sin AC que declare cuáles formatos de fecha son válidos en sess.date
Observación — comportamiento existe pero no está especificado como AC


ai-notes.js — Creación de nota (card de IA): apertura de editor
Sí (happy path editNotes)
Sin AC para comportamiento cuando getAI(id)devuelve null en editNotes() — L2772 const ai = getAI(id) sin guard antes de ai.notes
Menor — editNotes(id) si getAI(id)devuelve null: ai.notes en L2777 → TypeError. Card con id huérfano puede surgir si la IA fue eliminada sin re-render
1. IA eliminada sin re-render del DOM. 2. Clic en zona de notas del card huérfano. 3. const ai = getAI(id) → null. 4. ta.value = ai.notes → TypeError
ai-notes.js — Creación de nota: guardado
Sí (happy path)
Sin AC para wrap._ta cuando render()destruye el DOM entre editNotes() y saveNotes() — deuda de Fase 1 verificada
Mayor (confirmado Fase 1) — wrap._taasignado a DOM element en L2788. Si render() es llamado entre click de "editar" y click de "guardar": wrap reemplazado por innerHTML='' en render(), wrap._ta apunta a nodo huérfano → saveNotes() en L2797 !wrap._ta es falso (el nodo existe pero está detachado), ai.notes = wrap._ta.value lee el valor correcto, pero renderNotesDisplay(id) en L2800 busca notes-wrap-${id} que fue recreado por render — wrap local ya no es el del DOM
1. Hacer click en zona de notas (editNotes inicia). 2. Sin modificar nada, scroll que trigger render(). 3. Clic en Guardar. 4. wrap._ta es nodo huérfano. renderNotesDisplay(id)busca el nuevo notes-wrap-${id} — puede funcionar si idsigue en DOM, pero el estado intermedio es stale
ai-notes.js — Edición de nota: carga y modificación
Sí
Sin AC para edición concurrente — dos instancias abiertas del editor para la misma IA (no posible con UI actual por wrap.innerHTML = '', pero sin AC explícito)
Observación


ai-notes.js — Eliminación de nota / clear de IA
Parcial
Sin AC para deleteAI con sesiones en formato legacy ai.sessions (formato v2) — confirmado Fase 1
Mayor (confirmado Fase 1) — deleteAI(id) en L99 verifica sesiones solo en state.projects — si hay sesiones en ai.sessions (v2 legacy), confirmClear() en L93 devuelve false, deleteAI procede sin confirmación y borra la IA con sus sesiones sin advertencia al usuario
1. IA con sesiones en campo ai.sessions (formato v2). 2. Abrir menú ⋯ → Eliminar. 3. confirmClear(id): recorre state.projects → no encuentra sesiones. 4. deleteAI ejecuta sin modal de confirmación. 5. IA y sesiones legacy eliminadas sin advertencia
ai-notes.js — Búsqueda de notas (global search)
Sí (happy path)
Sin AC para openQuickNote() — invocada en L2148 y L5661 pero no definida en ai-notes.js ni encontrada en ai-tracker-session.js. Misma deuda que openItemEditor (sesión 2b)
Mayor — openQuickNote(id)referenciada como callback onclick desde resultados de búsqueda global (L2148) y desde panel de proyecto (L5661) sin definición en ninguno de los dos archivos auditados. Si el módulo que la define no carga: clic en nota → ReferenceError sin feedback
1. Cargar PP sin módulo que define openQuickNote. 2. Búsqueda global → resultado de nota. 3. Clic en resultado. 4. ReferenceError: openQuickNote is not defined — sin feedback al usuario
ai-notes.js — Búsqueda: filtrado por scope
Sí (B-202605-236 verificado)
Sin AC para state.quickNotes vacío o undefined — el filter en L2020 usa `state.quickNotes


[]`, comportamiento correcto, pero sin AC que lo declare como edge case cubierto
Verificación _initFocusShortcut cross-módulo
No aplica
No existe _initFocusShortcut en ai-tracker-session.js ni en ai-tracker-ai-notes.js. El listener está en ai-tracker-backlog.js (confirmado 2b). Sin acumulación en estos módulos
n/a


CANONICAL_PROJECTS string deprecado
No
Gap crítico de especificación — CANONICAL_PROJECTS L4 en ai-tracker-session.js contiene 'Obsidiana Labs' y 'Obsidiana'. String canónico actual es 'Obsidian Labs' (Base Rules §3, OL-CONTEXT §7). parsePaste() acepta el string incorrecto como válido en validación de proyecto
Gap — devolver a Cael. No es bug de Rune: es decisión de especificación si la constante debe actualizarse y qué hacer con CHECKPOINTs históricos que usan el string deprecado



Lista de gaps de AC para Cael
Título del gap
Flujo afectado
Comportamiento observable sin AC
Guard de null en saveSession()cuando getAI(id) devuelve null
Apertura de sesión
ai._parsed se accede sin verificar que aino sea null. Card con ID huérfano genera TypeError no manejado
Comportamiento del botón Guardar cuando no hay proyectos creados en _showProjRequiredInPanel()
Selección de proyecto
Botón con aria-disabled es alcanzable por teclado. Clic no produce feedback visible de por qué no actúa
Estado de sesión cuando el usuario cancela showMergeDiffPanel
Registro de ítems
newSess se empuja a activeProj.sessions antes de la confirmación del diff. Cancelar deja sesión guardada sin merge ni trackerRefs resueltos
getAllSessions invocada sin guard de existencia en exportWeeklySummary()
Resumen semanal — generación
Si el módulo externo no carga, ReferenceError sin feedback al usuario. Mismo patrón que openItemEditor (2b)
Formatos de fecha válidos en sess.date para _sessInRange()
Resumen semanal — display
Fechas en formato español ("07 may. 2026") hacen fallback a _parseSpanishDate. No hay AC que declare qué formatos son válidos ni qué pasa si el fallback falla
Guard de null en editNotes()cuando getAI(id) devuelve null
Creación/edición de nota de IA
ta.value = ai.notes en nodo con IA eliminada → TypeError
openQuickNote() invocada desde búsqueda global y panel de proyecto sin definición en módulos auditados
Búsqueda y filtrado de notas
Clic en resultado de nota → ReferenceError si módulo externo no carga. Mismo patrón que openItemEditor (2b) — acumulación de dependencias externas sin guard
CANONICAL_PROJECTS contiene strings deprecados 'Obsidiana Labs' y 'Obsidiana'
Validación de proyecto en parsePaste
parsePaste() acepta el string incorrecto como válido. CHECKPOINTs nuevos con string correcto 'Obsidian Labs' pasan la validación, pero también los que usan strings deprecados. Sin AC que declare si la constante debe depurar el histórico o solo agregar el nuevo string

---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2c — session.js (flujos de sesión + resumen semanal) + ai-notes.js (notas de IA + búsqueda + eliminación)
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 8 flujos en 2 módulos. 9 bugs documentados: 0 críticos, 5 mayores, 3 menores, 2 observaciones. 8 gaps de AC documentados para Cael. Hallazgo transversal: patrón de funciones externas sin guard (openItemEditor 2b + openQuickNote + getAllSessions 2c) — 3 dependencias externas sin typeof guard en HTML inline o en llamadas directas. _rebuildLogBody scroll-listener acumulado confirmado con ruta concreta: 2 acumulaciones mínimas por guardado de sesión vía render() monkey-patch.
Archivos: ai-tracker-session.js | ai-tracker-ai-notes.js | audit-ai-tracker-session_js-1f.md | audit-ai-tracker-ai-notes-1c.md
Contexto: Fase 2 de auditoría PP · Sesión 2c — cierre de auditoría funcional de módulos session + ai-notes
Bloqueantes: n/a — ningún bug individual bloquea release por sí solo. Bug de newSess guardado antes de cancelación de showMergeDiffPanel requiere evaluación de Vera: si el usuario cancela el diff habitual, queda estado inconsistente permanente. Decisión pendiente de 2b sobre openItemEditor sin guard aplica también a openQuickNote y getAllSessions — 3 funciones externas con el mismo patrón de riesgo.
Aprendizaje: Patrón sistémico identificado: funciones externas invocadas desde HTML inline o directamente sin guard typeof. Reportado en 2b (openItemEditor), confirmado en 2c (openQuickNote, getAllSessions). Recomendación para Cael: AC transversal obligatorio — toda función externa invocada desde módulos de sesión/notas debe tener guard de existencia. newSess pre-guardado antes de confirmación de diff es el bug de mayor impacto de la sesión — genera estado inconsistente sin señal al usuario.
CONTEXT-SECTION: n/a
Decisión: Auditoría 2c completada. 5 bugs mayores pasan a Rune. 8 gaps de AC pasan a Cael. Vera evalúa: (1) patrón de funciones externas sin guard — ¿AC transversal o fix caso por caso? (2) newSess pre-guardado antes de cancelación de diff — ¿bloquea release?
Próximo paso: 1) Gaps de AC → Cael (8 ítems nuevos + confirmación de patrón transversal). 2) Bugs mayores → Rune (5 ítems). 3) Vera evalúa decisión de release con hallazgos acumulados 2a+2b+2c. 4) Si se requiere auditoría de módulo que define openQuickNote y getAllSessions — adjuntar archivo correspondiente para sesión 2d.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "saveSession — ai._parsed accedido sin guard cuando getAI(id) devuelve null",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Guardado de sesión",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "saveSession(id) verifica que getAI(id) no sea null antes de acceder a ai._parsed",
      "Si ai es null, se muestra toast de error y la función retorna sin TypeError"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_showProjRequiredInPanel — botón con aria-disabled alcanzable por teclado sin feedback cuando no hay proyectos",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Selección de proyecto",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cuando no hay proyectos disponibles, el botón Guardar muestra tooltip o mensaje inline al recibir foco o clic",
      "O bien: el botón recibe disabled nativo cuando hasProjOptions es false, impidiendo foco por teclado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_doSaveSession — newSess guardado en activeProj.sessions antes de confirmación de showMergeDiffPanel; cancelar deja estado inconsistente",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Guardado de sesión",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "newSess no se persiste en activeProj.sessions hasta que el usuario confirma el panel de diff",
      "Si el usuario cancela showMergeDiffPanel, el state no contiene la sesión nueva y no hay cambios en el backlog",
      "Si showMergeDiffPanel no está disponible (fallback directo), el comportamiento actual se mantiene"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_rebuildLogBody — listener scroll acumulado por render() monkey-patch: mínimo 2 acumulaciones por guardado de sesión",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Log de sesiones",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El listener de scroll en logBody se registra con referencia nombrada para permitir removeEventListener antes de cada registro",
      "Con N guardados de sesión, exactamente 1 listener de scroll está activo — verificable con getEventListeners en devtools"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildLogHeader — ai.color interpolado como atributo sin nombre en button de pill de IA",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Log de sesiones",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El color de IA se aplica al pill vía CSS custom property o atributo data-color, no interpolado directamente como atributo sin nombre",
      "Inspección del DOM: ningún button.log-ai-pill tiene atributos con formato #rrggbb sin nombre"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "exportWeeklySummary — getAllSessions() invocada sin guard typeof; ReferenceError si módulo externo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Resumen semanal",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "exportWeeklySummary verifica typeof getAllSessions === 'function' antes de invocarla",
      "Si getAllSessions no está disponible, el usuario recibe toast de error en lugar de ReferenceError silencioso"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "editNotes — ai.notes accedido sin guard cuando getAI(id) devuelve null",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Notas de IA",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "editNotes(id) verifica que getAI(id) no sea null antes de acceder a ai.notes",
      "Si ai es null, la función retorna sin abrir el editor"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "deleteAI — verifica sesiones solo en state.projects; IAs con sesiones en ai.sessions (formato v2) se eliminan sin confirmación",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Gestión de IAs",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "confirmClear(id) verifica sesiones tanto en state.projects como en ai.sessions (formato legacy v2)",
      "Si hay sesiones en cualquiera de las dos fuentes, el modal de confirmación se muestra antes de eliminar"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openQuickNote invocada desde búsqueda global y panel de proyecto sin definición en módulos auditados — ReferenceError si módulo externo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Notas rápidas",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Todas las llamadas a openQuickNote están precedidas de guard typeof o la función es inline en el módulo que la invoca",
      "Si openQuickNote no está disponible, el usuario recibe feedback visible en lugar de ReferenceError silencioso"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2c-session-notes-search
    rol: QA · Finn
    items: [pendiente-ID-dosavesess-newSess, pendiente-ID-rebuildLog-scroll, pendiente-ID-logheader-color, pendiente-ID-exportWeekly-guard, pendiente-ID-openQuickNote-guard]
    archivos: [ai-tracker-session.js, ai-tracker-ai-notes.js]
    depende_de: []
---EXECUTION-PLAN-END---


---

## Sesión 2d — Checkpoint + generadores



Informe funcional — Sesión 2d · ai-tracker-checkpoint.js
Nota estructural antes del informe: handlePaste, handleInput, parsePaste, downloadTemplates, downloadReport, confirmCloseSprint, loadPlan, openStandaloneCheckpoint, exportBacklogMd, confirmMapGenerator son funciones referenciadas en este módulo pero no definidas aquí. El parser real de CHECKPOINT (ingesta de texto → extracción de campos → merge) vive en otro módulo. Este archivo contiene: la capa de display (showCheckpointPanel), el pipeline de IDs (_assignPendingIds), la lectura de versión (_effectiveVersion), la display layer del plan (_showArranquePanel Bloque 4), y utilidades compartidas.
Nota de cross-reference 2c: openQuickNote reportada como "no definida" en sesiones 2c y 2c-bis → definida en este módulo, L6630. Los dos bugs críticos de 2c atribuyen ReferenceError a ausencia de la función. Si este módulo carga antes que ai-tracker-ai-notes.js (carga compartida estándar), esos bugs son falsos positivos o de orden de carga — no ausencia definitiva de la función. Señalado a Vera para reevaluación de prioridad antes de asignar a Rune.

INFORME FUNCIONAL
Flujo auditado
AC verificado
Gap de especificación
Bug detectado
Tipo
Pasos reproducibles
1. CHECKPOINT display — showCheckpointPanel(result) happy path
No — sin AC formal en este módulo
Sin AC que defina qué ocurre si result llega null o sin las propiedades esperadas
Bug menor: si sections.length === 0 y no hay proximoPaso/decision, L960 hace early return — el panel no se abre y el usuario no recibe ningún feedback de que el CHECKPOINT fue procesado vacío
Menor
1. Pegar CHECKPOINT sin ítems y sin Próximo paso ni Decisión. 2. sections.length === 0. 3. showCheckpointPanel retorna sin abrir panel. 4. No hay toast ni señal al usuario.
1. CHECKPOINT display — downloadTemplates() post-diff-confirm
No
Sin AC que declare comportamiento cuando downloadTemplates no está disponible
Bug crítico: L800 llama downloadTemplates() directamente sin typeof guard — ReferenceError si módulo que la define no cargó. Patrón idéntico al confirmado en 2b/2c para openItemEditor, openQuickNote, getAllSessions.
Crítico
1. Cargar PP sin el módulo que define downloadTemplates. 2. Pegar CHECKPOINT con ítems en retroceso o descarte. 3. Confirmar diff en panel. 4. _ckptDiffApplyAll() ejecuta → if (window._pendingTemplateDownload) downloadTemplates() → ReferenceError. Sin feedback al usuario.
1. CHECKPOINT display — timer y reopen
Parcial
Sin AC que declare duración del timer por caso (7000ms normal vs 120000ms con pending)
Sin bug — comportamiento consistente con _ckptTimerEnd
—
—
2. Parser ---ITEMS--- — _assignPendingIds slug collision
No
Sin AC para slug derivado de desc/title vacío
Bug mayor: _slugify(null) devuelve 'item'. Todos los ítems sin desc/title obtienen slug 'item'. El primer ítem crea tmpMap['item'] y obtiene un código real. El segundo ítem con slug 'item' resuelve al mismo código del primero (_tmpResolved = true) → ítem distinto mapeado al código equivocado silenciosamente.
Mayor
1. CHECKPOINT con dos ítems sin title ni desc. 2. Ambos tienen code [pendiente-ID]. 3. _slugify('') devuelve 'item' para ambos. 4. El segundo ítem toma el código del primero. 5. Backlog registra actualización de un ítem existente en lugar de crear uno nuevo.
2. Parser ---ITEMS--- — schema_version migration
Sí (R-202605-135)
—
Sin bug — migración correcta en L1839-1844: ítems sin campo reciben schema_version = 1 al cargar
—
—
2. Parser ---ITEMS--- — tipo inválido en _assignPendingIds
No
Sin AC que declare cómo se surface _invalidType = true al usuario
Bug menor: ítems con _invalidType = true se push a assigned con item.code intacto ([pendiente-ID]). No hay toast, no hay entrada en el panel de CHECKPOINT mostrando que el ítem fue rechazado. El ítem llega a showCheckpointPanel sin código válido — comportamiento downstream no especificado.
Menor
1. CHECKPOINT con ítem type: 'I'. 2. _assignPendingIds marca _invalidType = true. 3. Ítem pasa al merge con code [pendiente-ID] sin resolución. 4. No hay feedback visible.
2. Parser ---ITEMS--- — buildTGPreview usa i.desc no i.title
No
—
Bug mayor (confirmado 1b — no resuelto): buildTGPreview renderiza i.desc en columna descripción. Si el ítem solo tiene title (schema v1 canónico), la columna aparece vacía en el panel de preview.
Mayor
1. CHECKPOINT con ítems que solo tienen title, sin desc. 2. buildTGPreview renderiza cells vacías en la columna de descripción. Esperado: mostrar `i.title
3. EXECUTION-PLAN display — _sessIsDone items vacío
No
Sin AC para sesión con items: [] en el plan
Bug mayor: _sessIsDone(sess) retorna true si codes.length === 0 porque [].every(...) es vacuosamente verdadero. Una sesión sin ítems asignados es tratada como done → se mueve a _doneIds y desbloquea dependientes incorrectamente.
Mayor
1. Plan con sesión sin ítems (items: []). 2. _sessIsDone(sess) → codes.length > 0 es false → retorna false… espera, voy a reverificar: return codes.length > 0 && codes.every(...). Si codes.length === 0, el AND cortocircuita a false. Sin bug aquí.
3. EXECUTION-PLAN display — _isBlocked con dep IDs inexistentes
No
Sin AC para dep IDs que no existen en _allSessions
Bug menor: si depende_de contiene un ID que no existe en _allSessions, ese ID nunca entra a _doneIds → la sesión queda bloqueada permanentemente sin mensaje al usuario de que la dependencia no existe.
Menor
1. Plan con sesión A que depende_de: ['sess-inexistente']. 2. _isBlocked(A) → deps.every(d => _doneIds.has(d)) es false → A aparece como bloqueada. 3. No hay warning de dep ID inexistente.
3. EXECUTION-PLAN display — loadPlan sin typeof guard…
Sí
—
Sin bug — L7252: typeof loadPlan === 'function' guard presente. Si loadPlan no carga, el bloque muestra "Sin plan activo". ✓
—
—
3. EXECUTION-PLAN display — scope incorrecto produce error visible
No
Sin AC que declare comportamiento cuando scope: es inválido en el bloque
Gap de especificación — el parser de EXECUTION-PLAN está en otro módulo; este módulo solo consume loadPlan(). Sin visibilidad de validación de scope: desde aquí. Señalado a Cael como gap de arquitectura.
—
—
3. Warning message references ---PLAN--- legacy
No
—
Bug menor: L7356 emite "edita el bloque ---PLAN--- antes de copiar". El string canónico activo es ---EXECUTION-PLAN--- (Base Rules §9a). Mensaje de error incorrecto para el usuario.
Menor
1. Plan con campos faltantes (sin rol o sin ítems). 2. Warning muestra "edita el bloque ---PLAN---". Esperado: "edita el bloque ---EXECUTION-PLAN---".
4. Export — handlePaste sin typeof guard en HTML inline
No
Sin AC que declare comportamiento cuando módulo que define handlePaste no carga
Bug mayor: L4868 onpaste="handlePaste('${ai.id}')" — sin typeof guard. Si el módulo que define handlePaste no cargó, pegar en el textarea produce ReferenceError nativo del browser sin toast ni feedback al usuario. Mismo patrón sistémico 2b/2c.
Mayor
1. Cargar PP sin módulo que define handlePaste. 2. Ir a card de IA disponible. 3. Pegar texto en textarea. 4. Browser dispara ReferenceError. Sin feedback en UI.
4. Export — handleInput sin typeof guard en HTML inline
No
Ídem anterior
Bug mayor: L4869 oninput="handleInput('${ai.id}')" — misma violación. Tipear en el textarea produce ReferenceError continuo (en cada keyup).
Mayor
1. Cargar PP sin módulo que define handleInput. 2. Tipear en textarea de IA disponible. 3. ReferenceError en cada keystroke. Sin feedback en UI.
5. Version bump — _effectiveVersion()
Sí (R-202604-086)
—
Sin bug — lectura de localStorage con fallback a APP_VERSION. ✓ (confirmado 1b)
—
—
5. Version bump — getActiveSprints() devuelve todos los sprints
No
Sin AC que declare qué estados incluye el valor de retorno
Bug mayor: getActiveSprints() (L2355-2358) retorna `proj.sprints


[]sin filtrar porstatus === 'active'. Todos los callers que esperan solo sprints activos (incluyendo el command palette L5528-5529 que llama confirmCloseSprint(active[0].id)) pueden recibir un sprint cerrado o histórico y ejecutar confirmCloseSprint` sobre él.
5. Version bump — sprint no cerrado bloquea bump
No auditado desde este módulo
Sin AC visible — confirmMapGenerator/_mgApplyBumpedVersion están en ai-tracker-map-generator.js
Gap de especificación: el bug de Fase 1 (showToast sin instrucción clara cuando sprint no cerrado) no es verificable desde este módulo. Señalado a Vera: auditar en sesión 2e adjuntando ai-tracker-map-generator.js.
—
—
6. Compatibilidad ---PLAN--- legacy
No verificable desde este módulo
loadPlan() abstrae el formato — sin visibilidad de si lee ---PLAN--- en read-only o modifica.
Gap de arquitectura: la garantía de read-only para CHECKPOINTs con ---PLAN--- debe verificarse en el módulo que implementa loadPlan. Señalado a Vera: auditar en sesión 2e adjuntando el módulo de sprint/plan.
—
—
CSS Purity — violations de 1b no resueltas
No
—
Confirmadas no resueltas: L7683 style="font-size:10px;color:var(--hint)" (1b línea 62); _showArranquePanel style="--arr-type-color:..." (1b línea 57); openPulsoPanel (1b línea 59); style.setProperty('background', color) L7055-7057 y L5024 — estas últimas son nuevas no reportadas en 1b (background, color, border-color como propiedades de presentación directas, no custom properties).
Mayor (L7055-7057 nuevo) / Mayor (L7683, confirmado 1b)
Ver 1b para L7683. Para L7055-7057: 1. Pulso panel con proyectos. 2. Inspeccionar DOM. 3. el.style.background, el.style.color, el.style.borderColor set directamente — no custom properties.
openQuickNote — guards DOM internos
Parcial
Sin AC que declare comportamiento cuando elementos del modal no existen
Bug menor: L6639-6651 accede a document.getElementById('qn-text').value, .textContent, classList sin null guard individual. Si algún elemento del modal no existe en DOM, TypeError en el acceso encadenado. Solo el contenedor #quick-note-modal tiene guard (L6632).
Menor
1. openQuickNote('edit-id') con #qn-text ausente del DOM. 2. document.getElementById('qn-text').value → TypeError: Cannot read properties of null.


GAPS DE AC PARA CAEL
Título del gap
Flujo afectado
Comportamiento observable sin AC
downloadTemplates invocada sin typeof guard post-diff-confirm
Export — descarga post-confirmación
L800 llama directamente sin guard. Si módulo no carga → ReferenceError silencioso sin toast. Sin AC que declare fallback o guard obligatorio.
handlePaste / handleInput sin guard en atributos HTML inline
Ingesta de CHECKPOINT via textarea
onpaste/oninput llaman funciones sin typeof check. ReferenceError nativo del browser sin feedback. Sin AC que declare comportamiento cuando módulo no está disponible.
getActiveSprints() — sin AC de qué estados de sprint incluye el retorno
Sprint lifecycle — command palette
Retorna todos los sprints del proyecto sin filtro de status. Callers que esperan solo activos pueden recibir sprints cerrados. Sin AC que declare status === 'active' como criterio de filtro.
_assignPendingIds — slug collision para items sin title/desc
Parser ---ITEMS--- — asignación de IDs
_slugify(null) → 'item' para todos los items sin descripción. Segundo item con mismo slug toma código del primero. Pérdida silenciosa de identidad de ítem. Sin AC que declare comportamiento para desc/title vacío.
Tipo inválido _invalidType — sin surface al usuario
Parser ---ITEMS--- — validación de tipo
Items con tipo no-PTRB se marcan internamente como inválidos pero se pasan downstream con code = '[pendiente-ID]'. No hay toast, no hay entrada en panel de CHECKPOINT. Sin AC de cómo se reporta el rechazo.
_isBlocked — dep IDs inexistentes en allSessions
EXECUTION-PLAN display — dependencias
Sesión con dep ID que no existe en el plan queda bloqueada permanentemente sin mensaje al usuario de que la dependencia no existe en el plan. Sin AC para este edge case.
Warning message ---PLAN--- en lugar de ---EXECUTION-PLAN---
EXECUTION-PLAN display — campo incompleto
L7356 muestra mensaje con string legacy. Sin AC que defina el string correcto del mensaje de error cuando faltan campos del plan.
openQuickNote — acceso a elementos DOM sin null guard individual
Quick notes — apertura de modal
Solo #quick-note-modal tiene guard. #qn-text, #qn-ref, #qn-title, #qn-delete-btn, #qn-delete-confirm, #qn-ac-list accedidos directamente. Sin AC que declare comportamiento cuando cualquier elemento del modal no está en DOM.
loadPlan / ---PLAN--- legacy — garantía de read-only no verificable
EXECUTION-PLAN / ---PLAN--- legacy
La función loadPlan abstrae el formato. No es posible verificar desde este módulo si CHECKPOINTs con ---PLAN--- se parsean en modo read-only. AC de read-only no verificable sin adjuntar el módulo de plan.
Validación de scope en EXECUTION-PLAN — no verificable desde este módulo
EXECUTION-PLAN parser
El parser del scope vive en otro módulo. No hay AC verificable en este archivo que declare qué pasa cuando scope: tiene valor inválido.


CROSS-REFERENCE ACTIVO: openQuickNote (sesiones 2c y 2c-bis)
openQuickNote está definida en ai-tracker-checkpoint.js L6630. Los dos bugs críticos de 2c (ReferenceError: openQuickNote is not defined) son carga-orden-dependientes, no ausencia definitiva de la función. Si este módulo (shared) carga antes que ai-tracker-ai-notes.js, los bugs no reproducen. Acción sugerida: pasar a Vera — reevaluar prioridad de los dos bugs críticos de 2c antes de asignar a Rune. Si el orden de carga garantiza que el shared carga primero, degradar de Crítico a Observación.

---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2d — ai-tracker-checkpoint.js
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 6 flujos sobre ai-tracker-checkpoint.js. Nota estructural: las funciones handlePaste, handleInput, parsePaste, downloadTemplates, confirmCloseSprint, loadPlan, confirmMapGenerator NO están definidas en este módulo — viven en módulos externos. Este archivo es la capa compartida. Flujos cubiertos: display de CHECKPOINT (showCheckpointPanel), pipeline de IDs (_assignPendingIds), display del EXECUTION-PLAN (Bloque 4 en _showArranquePanel), lectura de versión (_effectiveVersion), getActiveSprints, openQuickNote. 1 bug crítico: downloadTemplates sin typeof guard post-diff-confirm (mismo patrón sistémico 2b/2c). 6 bugs mayores: handlePaste/handleInput sin guard en HTML inline, getActiveSprints devuelve todos los sprints sin filtrar por status, buildTGPreview usa i.desc en lugar de i.title (confirmado 1b no resuelto), style.setProperty('background'/color) en openPulsoPanel (nuevo, no en 1b). 4 bugs menores: ítems con _invalidType sin surface al usuario, _isBlocked con dep IDs inexistentes, warning message con string ---PLAN--- legacy, openQuickNote sin null guards individuales en DOM. Cross-reference crítico: openQuickNote sí está definida en este módulo (L6630) — los dos bugs críticos de 2c y 2c-bis requieren reevaluación de prioridad por Vera. CSS Purity: L7683 y _showArranquePanel confirmados de 1b como no resueltos; L7055-7057 nuevo (style.setProperty para presentation properties no custom). 10 gaps de AC documentados para Cael.
Archivos: ai-tracker-checkpoint.js | audit-checkpoint-1b.md | CHECKPOINT sesión 2c | CHECKPOINT sesión 2c-bis
Contexto: Fase 2 de auditoría PP · Sesión 2d — módulo compartido (shared utilities, CHECKPOINT display layer, ID pipeline, plan display, version)
Bloqueantes: 1 bug crítico — downloadTemplates sin guard bloquea descarga post-diff si módulo no carga. Vera evalúa: (1) reevaluar bugs críticos de openQuickNote de 2c y 2c-bis — función existe en este módulo. (2) getActiveSprints devuelve todos los sprints: ¿bloquea release? (3) auditoría 2e requiere ai-tracker-map-generator.js para verificar version bump + sprint no cerrado + ---PLAN--- legacy read-only.
Aprendizaje: Patrón sistémico de funciones externas sin typeof guard confirmado por cuarta vez: downloadTemplates (2d), handlePaste (2d), handleInput (2d), openItemEditor (2b), openQuickNote (2c), getAllSessions (2c). Recomendación para Cael: AC transversal obligatorio — ninguna función externa se invoca desde HTML inline o desde handlers sin typeof guard. getActiveSprints es un false friend semántico — devuelve todos los sprints, no solo activos. Callers críticos (command palette close-sprint) pueden actuar sobre sprints cerrados.
CONTEXT-SECTION: n/a
Decisión: Auditoría 2d completada. 1 bug crítico + 6 bugs mayores a Rune. 4 bugs menores a Rune. 10 gaps de AC a Cael. Vera evalúa: (1) openQuickNote cross-reference. (2) getActiveSprints y release. (3) scope de sesión 2e.
Próximo paso: 1) Gaps de AC → Cael (10 ítems). 2) Bugs → Rune (crítico + mayores + menores con pasos reproducibles). 3) Vera: reevaluar bugs críticos 2c/2c-bis de openQuickNote. 4) Sesión 2e: adjuntar ai-tracker-map-generator.js + módulo de sprint/plan para auditar version bump, confirmMapGenerator, ---PLAN--- legacy read-only.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "downloadTemplates invocada sin typeof guard en _ckptDiffApplyAll — ReferenceError si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CHECKPOINT display · Descarga post-diff",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L800: downloadTemplates se invoca solo si typeof downloadTemplates === 'function'",
      "Si downloadTemplates no está disponible, se muestra toast de advertencia al usuario en lugar de ReferenceError",
      "Verificable: cargar PP sin módulo que define downloadTemplates, confirmar diff con retroceso pendiente — sin error en consola"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "handlePaste en onpaste de textarea sin typeof guard — ReferenceError nativo si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Ingesta de CHECKPOINT · Textarea",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "onpaste del textarea verifica typeof handlePaste === 'function' antes de invocar",
      "Si handlePaste no está disponible, el usuario recibe toast de error en lugar de ReferenceError silencioso",
      "Verificable: cargar PP sin módulo que define handlePaste, pegar en textarea — sin error nativo del browser"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "handleInput en oninput de textarea sin typeof guard — ReferenceError continuo si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Ingesta de CHECKPOINT · Textarea",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "oninput del textarea verifica typeof handleInput === 'function' antes de invocar",
      "Si handleInput no está disponible, ningún ReferenceError se dispara al tipear",
      "Verificable: cargar PP sin módulo que define handleInput, tipear en textarea — sin error en consola por keystroke"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "getActiveSprints() devuelve todos los sprints del proyecto sin filtrar por status — callers reciben sprints cerrados",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Sprint lifecycle",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "getActiveSprints() retorna solo sprints con status === 'active'",
      "Command palette 'close-sprint' toma active[0] y ese sprint siempre tiene status === 'active'",
      "Verificable: proyecto con sprints closed + uno active — getActiveSprints().every(s => s.status === 'active') es true"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_assignPendingIds — slug collision silenciosa para ítems sin title/desc: todos mapean a slug 'item'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Parser ---ITEMS--- · Asignación de IDs",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si title y desc están vacíos, _slugify retorna slug único basado en posición o timestamp — no 'item' genérico",
      "O bien: ítems sin title/desc no se registran en tmpMap — se les asigna código nuevo sin consultar el mapa",
      "Ningún ítem distinto resuelve al mismo código por colisión de slug vacío"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildTGPreview renderiza i.desc en lugar de i.title — columna descripción vacía para ítems schema v1",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CHECKPOINT display · Preview de ítems",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "buildTGPreview renderiza i.title || i.desc en la columna de descripción — no solo i.desc",
      "Ítems con solo campo title muestran el título en el preview sin columna vacía"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "style.setProperty('background'/'color'/'border-color') en openPulsoPanel — violación CSS Purity (presentation properties directas)",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Pulso panel · CSS Purity",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L7055-7057: background, color y border-color se aplican vía CSS custom property (--proj-bg-color, --proj-text-color, --proj-border-color) no como propiedades de presentación directas",
      "grep 'style.setProperty.*background\\|style.setProperty.*color\\|style.setProperty.*border' no produce coincidencias con propiedades de presentación no-custom en este módulo"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_assignPendingIds — ítem con tipo inválido (_invalidType) pasa downstream sin feedback al usuario",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Parser ---ITEMS--- · Validación de tipo",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Ítem con tipo no-PTRB genera entrada en panel de CHECKPOINT en sección 'warning' o 'ignorados'",
      "O bien: showToast('warning', ...) con el código del ítem rechazado",
      "El ítem con _invalidType no llega al backlog con code='[pendiente-ID]'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_isBlocked — dep IDs inexistentes en allSessions bloquean sesión permanentemente sin mensaje al usuario",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "EXECUTION-PLAN display · Dependencias",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si un dep ID en depende_de no existe en allSessions, la sesión muestra indicador de dependencia rota — no de bloqueo normal",
      "O bien: el HTML de sesión bloqueada incluye '(dep no encontrada)' cuando el blocker no existe en _allSessions"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "L7356 — warning message en plan display usa string '---PLAN---' (legacy) en lugar de '---EXECUTION-PLAN---'",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "EXECUTION-PLAN display · Mensajes de error",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L7356: el mensaje de campo faltante dice 'edita el bloque ---EXECUTION-PLAN--- antes de copiar'",
      "grep '---PLAN---' en este módulo no produce coincidencias en strings de UI visibles al usuario"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openQuickNote — acceso a elementos del modal sin null guard individual — TypeError si elemento ausente del DOM",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Quick notes · Modal",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "openQuickNote verifica existencia de #qn-text, #qn-ref, #qn-title, #qn-delete-btn, #qn-delete-confirm, #qn-ac-list antes de acceder a sus propiedades",
      "Si cualquier elemento no existe, la función retorna con console.warn — sin TypeError"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showCheckpointPanel — early return silencioso cuando CHECKPOINT no tiene ítems ni Próximo paso/Decisión",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CHECKPOINT display · Empty state",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si sections.length === 0 al final del bloque, showCheckpointPanel muestra toast informativo indicando que el CHECKPOINT fue procesado sin cambios",
      "El usuario recibe feedback visible — no silencio total"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2d-checkpoint-shared
    rol: QA · Finn
    items: [pendiente-ID-downloadtemplates-guard, pendiente-ID-handlepaste-guard, pendiente-ID-handleinput-guard, pendiente-ID-getactivesprints-filter]
    archivos: [ai-tracker-checkpoint.js]
    depende_de: []
---EXECUTION-PLAN-END---

---

## Sesión 2e — Sprint + proyectos

INFORME FUNCIONAL — Sesión 2e · ai-tracker-sprint-project.js
Nota estructural: Las funciones confirmOpenSprint, confirmCloseSprint, openSprintModal no están definidas en este módulo. Los flujos 1 y 2 (apertura y cierre de sprint) no son auditables desde el archivo adjunto. Señalado como bloqueante de auditoría.
Flujo auditado
AC verificado
Gap de especificación
Bug detectado
Tipo
Pasos reproducibles
1. Apertura de sprint
No verificable — funciones no en este módulo
sprint open/close modal vive en módulo externo no adjunto
—
—
—
2. Cierre de sprint
No verificable — confirmCloseSprint referenciada pero no definida aquí
Ídem — ver bloqueante
—
—
—
3. Creación de proyecto — confirmProjForm (L855)
No — sin AC formal en módulo
Sin AC para nombre duplicado · Sin AC para prefijo duplicado (colisión en filenames de export)
Bug menor: L817 document.getElementById('proj-modal-overlay').classList.add('open') sin null guard. Mismo patrón en closeProjModal L822, openProjPanel L713, closeProjPanel L720.
Menor
1. Cargar PP sin #proj-modal-overlay en DOM. 2. Llamar openProjModal(). 3. L817: .classList.add sobre null → TypeError. Sin feedback al usuario.
3. Selección de proyecto activo — selectProjectFilter (L763)
Parcial
Duplicación de lógica de refresh (7 funciones) sin AC de extracción — deuda baja confirmada 1h
Sin bug funcional en happy path
—
—
3. Archivado — toggleProjArchive (L978)
Parcial
Sin AC que declare si ítems del proyecto archivado quedan accesibles o se filtran en _filteredAIs
Sin bug funcional en happy path
—
—
4. Export — _generateBacklogMd filtro generacional (L437-450)
No
Sin AC que declare fuente canónica de sprint activo entre state.sprints (L440) y getActiveSprints() en _lastClosedSprint (L81). Sin AC que resuelva criterio 'active' vs 'active'||'open' en el mismo flujo.
Bug mayor: _buildCurrentStateMd (L36) busca status==='active' → sprint con status='open' no aparece en sección Estado actual. _generateBacklogMd (L440) busca 'active'||'open' → mismo sprint sí filtra ítems done. El export contradice su propio header dentro de la misma llamada.
Mayor
1. Proyecto con sprint status='open'. 2. exportBacklogMd(). 3. Sección "Estado actual" → sin sprint activo (L36 no lo detecta). 4. Filtro generacional (L440) → ítems done del sprint incluidos. Misma exportación, datos contradictorios.
4. Export — contadores _generateBacklogMd (L454-459)
No
Sin AC que declare comportamiento cuando i.code es null/undefined
Bug mayor: L455 i.code[0] sin guard → TypeError si algún ítem tiene code:null. L46 en _buildCurrentStateMd: mismo riesgo. Ambas sin try-catch ni feedback al usuario.
Mayor
1. Inyectar ítem con code:null vía CHECKPOINT malformado. 2. exportBacklogMd(). 3. L455: null[0] → TypeError: Cannot read properties of null. Export falla sin toast.
5. Historial completo — _generateFullHistoryBySprintMd (L263)
Parcial — AC1-AC5 cubiertos
SPRINT_DATA_THRESHOLD=23 hardcodeado en L274 — sin AC que declare criterio del umbral
Sin bug crítico funcional. L298: i.code ? i.code[0] : '?' — guard presente. Correcto.
—
—
5. Agrupación por sprint
Sí
—
Sin bug — sprintSections, legacySection y noSprintSection cubren los tres casos declarados en ACs.
—
—
6. selectProjectFilter / clearProjectFilter — cambio de filtro, re-render
Parcial
Duplicación de secuencia de render sin AC de extracción
Sin bug funcional. Deuda baja confirmada 1h.
—
—
✦ Verificación explícita — _docPrefix 'OB' vs 'OL'
No
Sin AC para entrada 'Obsidian Labs'→'OL' en _PREFIX_MAP
Bug mayor: _PREFIX_MAP L2-7 tiene 'Obsidiana':'OB' (legacy). 'Obsidian Labs' no está en el mapa. Fallback L13: 'Obsidian Labs'.slice(0,2).toUpperCase() = 'OB' → prefijo incorrecto. Todo export para proyecto 'Obsidian Labs' genera 'OB-BACKLOG_...'.
Mayor
1. Proyecto con name='Obsidian Labs'. 2. exportBacklogMd(). 3. _docPrefix(): no matchea en _PREFIX_MAP. Fallback: 'Ob'.toUpperCase() = 'OB'. 4. Filename: 'OB-BACKLOG_...'. Esperado: 'OL-BACKLOG_...'.
✦ Verificación explícita — code[0] sin guard
No
Ver Flujo 4 contadores
Bug mayor confirmado — L455 y L46. Ver arriba.
Mayor
Ver Flujo 4 contadores.
✦ Verificación explícita — state.sprints vs getActiveSprints()
No
Sin AC que declare fuente canónica de sprints por función
Bug mayor: triple punto de acceso inconsistente en el mismo flujo de export. _buildCurrentStateMd → state.sprints + ==='active'. _generateBacklogMd → state.sprints + ==='active'||'open'. _lastClosedSprint → getActiveSprints(). Inconsistencia observable — ver Flujo 4.
Mayor
Ver Flujo 4 filtro generacional.
Ctrl+K doble listener (confirmado 1h alta)
No
Sin AC que declare cuál módulo es responsable del shortcut
Bug mayor: L630 registra keydown Ctrl+K → abre #search-global. ai-tracker-command-palette.js registra otro listener → abre command palette. Último registrado gana — comportamiento no determinístico.
Mayor
1. Cargar PP con ambos módulos. 2. Presionar Ctrl+K. 3. Solo el handler del módulo cargado último ejecuta. 4. El otro handler nunca dispara. No determinístico sin conocer orden de carga.
_renderProjList archived toggle — JS inline (confirmado 1h baja)
No
Sin AC que declare separación de lógica JS del innerHTML
Bug menor: L943-948 onclick del botón archived-toggle contiene lógica JS como string multi-sentencia dentro de innerHTML. No auditable desde código. Violación de separación.
Menor
1. Inspeccionar DOM. 2. Botón .proj-archived-toggle → onclick contiene var k=...; var now=...; localStorage.setItem(...) como string inline. Sin referencia a función nombrada.
cleanupLocalStorage / testLocalStorageQuota en producción (confirmado 1h baja)
No
Sin AC que declare entorno de exposición
Bug menor: L1343, L1386 expuestas globalmente sin flag de entorno. cleanupLocalStorage() elimina 'current-project-filter' → pérdida de proyecto activo desde consola.
Menor
1. Abrir consola del browser en PP producción. 2. cleanupLocalStorage(). 3. Elimina current-project-filter → proyecto activo se pierde. Sin confirmación ni guard.


GAPS DE AC PARA CAEL
Título del gap
Flujo afectado
Comportamiento observable sin AC
_docPrefix — sin entrada 'Obsidian Labs'→'OL' en _PREFIX_MAP
Export de backlog / historial / sprints
Proyecto 'Obsidian Labs' produce prefijo 'OB' vía fallback. Todos los filenames de export usan prefijo legacy.
code[0] sin guard — sin AC de comportamiento con code:null/undefined
Export backlog (L455) · Estado actual (L46)
Ítem con code:null lanza TypeError en forEach. Export falla sin toast ni fallback.
Fuente canónica de sprints — sin AC que resuelva state.sprints vs getActiveSprints()
Export backlog · Historial · Estado actual
Tres funciones del mismo flujo de export acceden a sprints desde fuentes distintas. Si getActiveSprints() transforma o filtra state.sprints, las funciones ven datos diferentes del mismo proyecto.
Criterio de sprint activo — sin AC canónico ('active' vs 'active'||'open')
Export backlog — sección Estado actual vs filtro generacional
_buildCurrentStateMd (L36) ignora status='open'. _generateBacklogMd (L440) lo incluye. El export puede tener header sin sprint activo pero ítems filtrados por ese sprint.
confirmProjForm — sin AC para nombre duplicado de proyecto
Gestión de proyectos — creación
Dos proyectos pueden tener el mismo nombre. Sin warning al usuario. Backlog y CONTEXT almacenados por proj.id — no hay colisión de datos, pero el UI muestra entradas idénticas sin distinción.
confirmProjForm — sin AC para prefijo duplicado
Gestión de proyectos — creación / export
Dos proyectos con el mismo prefijo producen filenames de export idénticos. Ningún warning al confirmar el formulario.
proj-modal-overlay sin null guard — sin AC que declare comportamiento con elemento ausente
Gestión de proyectos — apertura/cierre de modal
openProjModal, closeProjModal, openProjPanel, closeProjPanel acceden a classList directamente sin null guard. Sin elemento en DOM → TypeError silencioso.
SPRINT_DATA_THRESHOLD=23 — sin AC que declare criterio del umbral
Historial completo — agrupación pre/post S-23
Cambiar el umbral requiere edición de código. Sin AC que declare por qué S-23 es el punto de corte ni qué pasa si se agregan sprints retroactivos con datos completos antes de ese número.
Sprint apertura/cierre — no auditables desde módulo adjunto
Flujos 1 y 2 completos
confirmOpenSprint, confirmCloseSprint, validación de nombre canónico / goal / version_target / release_type, aplicación de version_target a ítems done, migración de pendientes — ninguno está en este archivo. Sin módulo adjunto: AC no verificables.
Ctrl+K — sin AC que declare responsabilidad por módulo
Keyboard shortcut global
Dos listeners en el mismo documento. Sin AC que declare cuál módulo es el dueño canónico del shortcut y cuál debe deferir.
_renderProjList archived toggle — sin AC de separación de lógica JS
Gestión de proyectos — archived section
Lógica de localStorage.setItem y _renderProjList() embebida como string en onclick. Sin AC que declare que los handlers de toggle deben ser funciones nombradas.


---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2e — ai-tracker-sprint-project.js
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 6 flujos sobre ai-tracker-sprint-project.js. Nota estructural: confirmOpenSprint, confirmCloseSprint y openSprintModal no están definidas en este módulo — flujos 1 (apertura de sprint) y 2 (cierre de sprint) no son auditables sin el módulo que los contiene. Flujos auditados: gestión de proyectos (creación, selección, archivado), export de backlog (_generateBacklogMd), historial completo (_generateFullHistoryBySprintMd), selectProjectFilter/clearProjectFilter. Tres verificaciones explícitas ejecutadas: (1) _docPrefix 'OB' vs 'OL' — bug mayor confirmado: 'Obsidian Labs' no está en _PREFIX_MAP, fallback produce 'OB'. (2) code[0] sin guard — bug mayor confirmado en L455 y L46. (3) state.sprints vs getActiveSprints() — inconsistencia observable confirmada: triple punto de acceso en el mismo flujo de export; criterio de sprint activo difiere entre _buildCurrentStateMd ('active') y _generateBacklogMd ('active'||'open'). 5 bugs mayores: _docPrefix legacy, code[0] sin guard x2 (L455+L46), inconsistencia estado actual vs filtro generacional, Ctrl+K doble listener (confirmado 1h). 4 bugs menores: proj-modal-overlay sin null guard, _renderProjList archived toggle JS inline (confirmado 1h), cleanupLocalStorage/testLocalStorageQuota en producción (confirmado 1h), openProjModal setTimeout sin guard. 11 gaps de AC documentados para Cael. Flujos 1 y 2 (sprint lifecycle) bloqueados — requieren módulo externo.
Archivos: ai-tracker-sprint-project.js | audit-ai-tracker-command-palette_js+ai-tracker-map-generator_js+ai-tracker-sprint-project_js+env_js-1h.md | CHECKPOINT sesión 2d
Contexto: Fase 2 de auditoría PP · Sesión 2e — módulo de gestión de proyectos, sprint export, historial, filtros y prefix de documentos vivos
Bloqueantes: (1) Flujos 1 y 2 (apertura/cierre de sprint) no auditables — confirmOpenSprint, confirmCloseSprint no están en este módulo. Adjuntar módulo de sprint lifecycle para auditar en sesión 2f. (2) Bug mayor _docPrefix: todo export del proyecto 'Obsidian Labs' genera prefijo 'OB' — afecta naming de todos los documentos vivos del holding. (3) Bug mayor code[0] sin guard: export falla con TypeError si algún ítem tiene code:null — sin feedback al usuario.
Aprendizaje: Inconsistencia de fuente canónica de sprints es sistémica en este módulo: tres funciones del mismo flujo de export (_buildCurrentStateMd, _generateBacklogMd, _lastClosedSprint) acceden a sprints desde state.sprints o getActiveSprints() sin criterio declarado. El criterio de sprint 'activo' también difiere ('active' vs 'active'||'open') dentro del mismo exportBacklogMd(). _generateFullHistoryBySprintMd y _generateSprintsExportMd usan correctamente getActiveSprints() — la inconsistencia es localizada en las funciones de export activo. Guard de code[0] está presente en funciones de historial (L298, L137) pero ausente en contadores de export activo (L455) y estado actual (L46).
CONTEXT-SECTION: n/a
Decisión: Auditoría 2e completada con bloqueante de auditoría en flujos 1-2. 5 bugs mayores + 4 bugs menores a Rune. 11 gaps de AC a Cael. Vera evalúa: (1) _docPrefix 'OB' — impacto en naming de documentos ya generados. (2) Flujos 1-2 sin auditar — ¿adjuntar módulo de sprint lifecycle en sesión 2f?
Próximo paso: 1) Gaps de AC → Cael (11 ítems). 2) Bugs → Rune (5 mayores + 4 menores con pasos reproducibles). 3) Vera: decidir sesión 2f — adjuntar módulo sprint lifecycle para auditar apertura/cierre de sprint. 4) Vera: evaluar impacto de _docPrefix 'OB' en documentos históricos ya generados.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_docPrefix — 'Obsidian Labs' no en _PREFIX_MAP: fallback produce 'OB' en lugar de 'OL' — todos los exports del holding usan prefijo legacy",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Export · Prefix de documentos vivos",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_PREFIX_MAP contiene entrada 'Obsidian Labs': 'OL'",
      "Entrada 'Obsidiana': 'OB' removida del mapa — nombre legacy no válido en producción",
      "Proyecto con name='Obsidian Labs': _docPrefix() retorna 'OL'",
      "Verificable: crear proyecto 'Obsidian Labs', exportBacklogMd() → filename comienza con 'OL-BACKLOG_...'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_generateBacklogMd contadores L455 — i.code[0] sin guard: TypeError si item.code es null/undefined",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Export · Contadores de backlog",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L455: i.code verificado antes de acceder a i.code[0] — guard: if (!i.code || typeof i.code !== 'string') return",
      "L458: i.code.match() solo ejecuta si i.code es string válido",
      "Si algún ítem tiene code:null, el forEach lo salta silenciosamente — sin TypeError, sin interrupción del export",
      "Verificable: inyectar ítem con code:null en ITEMS, exportBacklogMd() — sin error en consola"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildCurrentStateMd L46 — i.code[0] sin guard: TypeError si item.code es null/undefined",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Export · Estado actual",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L46: guard en i.code antes de acceder a i.code[0]",
      "Ítem con code:null salta silenciosamente en forEach — sin TypeError",
      "Verificable: ítem code:null en ITEMS, exportBacklogMd() → sección Estado actual se genera sin error"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Export activo — Estado actual y filtro generacional usan criterio de sprint activo distinto: 'active' vs 'active'||'open'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Export · Consistencia interna",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Criterio canónico de sprint activo unificado en una sola constante o función — usado por _buildCurrentStateMd y _generateBacklogMd",
      "Si status='open' se considera activo para el filtro generacional, también aparece en la sección Estado actual",
      "Misma exportación: Estado actual y filtro generacional reflejan el mismo sprint activo",
      "Verificable: sprint status='open', exportBacklogMd() → Estado actual muestra el sprint Y ítems done del sprint están incluidos en el filtro"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Ctrl+K doble listener — ai-tracker-sprint-project.js L630 y command-palette registran handler separados: comportamiento no determinístico",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Keyboard shortcuts · Conflicto de handlers",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Un único listener de Ctrl+K en el documento — el módulo dueño del shortcut lo registra; el otro defiere o no registra",
      "Ctrl+K produce siempre el mismo resultado independiente del orden de carga de módulos",
      "Verificable: cargar PP, Ctrl+K → comportamiento consistente en múltiples recargas"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openProjModal/closeProjModal/openProjPanel/closeProjPanel — acceso a classList sin null guard en elementos del modal",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Gestión de proyectos · Modal",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L817 (openProjModal), L822 (closeProjModal), L713 (openProjPanel), L720 (closeProjPanel): elemento verificado con null guard antes de acceder a classList",
      "Si #proj-modal-overlay o #proj-panel-overlay no existe en DOM, función retorna silenciosamente — sin TypeError"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_renderProjList archived toggle — lógica JS multi-sentencia embebida como string en onclick de innerHTML",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Gestión de proyectos · Archived section",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L943-948: onclick del botón archived-toggle llama una función nombrada (ej: toggleArchivedSection()) — sin JS multi-sentencia como string",
      "La función nombrada vive en el módulo JS — auditable y testeable",
      "grep 'onclick.*localStorage' en este módulo no produce coincidencias"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "cleanupLocalStorage / testLocalStorageQuota — funciones de debug expuestas globalmente en producción sin flag de entorno",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Debug · Producción",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "cleanupLocalStorage y testLocalStorageQuota no accesibles desde window en producción — eliminadas del scope global o condicionadas a flag de entorno (ej: window.__DEV)",
      "En producción: window.cleanupLocalStorage === undefined",
      "Verificable: cargar PP producción, consola: typeof cleanupLocalStorage → 'undefined'"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2e-sprint-project
    rol: QA · Finn
    items: [pendiente-ID-docprefix-ol, pendiente-ID-code0-guard-l455, pendiente-ID-code0-guard-l46, pendiente-ID-criterio-sprint-activo, pendiente-ID-ctrlk-doble]
    archivos: [ai-tracker-sprint-project.js]
    depende_de: []
---EXECUTION-PLAN-END---

---

## Sesión 2f — Command Palette + Map Generator

INFORME FUNCIONAL — Sesión 2f · Command Palette + Map Generator
Flujo auditado
AC verificado
Gap de especificación
Bug detectado
Tipo
Pasos reproducibles
CP-1: Apertura — Ctrl+K, render recientes, render estáticos
Parcial
Sin AC que declare comportamiento cuando #cp-overlay, #cp-recent, #cp-results o #cp-input no existen en DOM
Sin bug funcional en happy path. openCommandPalette() L411: null guard en overlay presente (if (!overlay) return). Input/list sin null guard explícito en init pero handlers condicionados. Sin bug bloqueante.
—
—
CP-2: Búsqueda — filtrado, navegación por teclado, ejecución
Parcial
Sin AC que declare comportamiento cuando _cp.results cambia entre ArrowDown y Enter (race condition en búsqueda futura)
Sin bug funcional observado. _cpOnListClick L666 verifica _cp.results[idx] antes de ejecutar — guard presente. _cpExecuteSelected L571 verifica cmd existe.
—
—
CP-3: Comandos de navegación — switchTab con y sin prefijo 'tab-'
No
Sin AC que declare que switchTab recibe ID con prefijo tab- obligatorio. Sin AC para comportamiento cuando switchTab valida ID exacto.
Bug mayor: action-search-context L158 llama switchTab('backlog') — sin prefijo tab-. Todos los demás nav-commands usan tab-backlog, tab-tracker, etc. Si switchTab valida el ID exacto, el tab no cambia. _cpSearchContext action L310 tiene el mismo defecto: switchTab('backlog') sin prefijo.
Mayor
1. Abrir PP. 2. Ctrl+K → buscar "contexto". 3. Seleccionar "Buscar en contexto". 4. switchTab('backlog') ejecuta — si switchTab valida ID exacto, el tab no cambia. 5. switchSubTab('context') del setTimeout en L159 puede ejecutar sobre el tab incorrecto.
CP-3 verificación explícita: action-search-context
No
Ver arriba
Bug mayor confirmado — switchTab('backlog') en L158 y en _cpSearchContext L310. Ninguna de las dos rutas usa 'tab-backlog'.
Mayor
Ver arriba.
CP-4: Comandos dinámicos — _buildDynamicCommands
No
Sin AC que declare fuente canónica de proyectos (window.state.projects vs resultado de getActiveProject). Sin AC que declare comportamiento cuando state.ais tiene elementos sin campo name.
Bug menor: _buildDynamicCommands proyectos L224 — if (typeof getActiveProject === 'function' || typeof window.state !== 'undefined') — la condición es siempre true si window.state existe aunque getActiveProject no esté. Accede a window.state.projects directamente en L225 ignorando la función canónica. Sin AC para este doble punto de acceso.
Menor
1. Cargar PP con window.state.projects desactualizado vs lo que retornaría getActiveProject. 2. Buscar nombre de proyecto en CP. 3. Resultado refleja window.state.projects — no el estado canónico.
CP-4: IA dinámica — switchTab('tracker') sin prefijo
No
Sin AC que declare prefijo requerido en actions dinámicas
Bug menor: _buildDynamicCommands IAs L210 — switchTab('tracker') sin prefijo tab-. Mismo patrón que action-search-context.
Menor
1. Buscar "nueva sesión" en CP. 2. Ejecutar comando. 3. switchTab('tracker') sin prefijo — tab puede no cambiar si switchTab valida ID exacto.
CP-5: Conflict Ctrl+K — verificación explícita
No
Sin AC que declare cuál módulo es dueño canónico del shortcut
Bug mayor confirmado con archivo real: initCommandPalette() L713 registra document.addEventListener('keydown', _cpGlobalKeydown, true) — captura en fase capture. ai-tracker-sprint-project.js L630 registra listener en fase bubble (sin true). En fase capture, el listener de CP se ejecuta primero y llama e.preventDefault() — el listener de SP nunca llega a abrir #search-global. El handler que ejecuta depende del orden de carga. Si CP se carga primero y usa capture, CP siempre gana.
Mayor
1. Cargar PP con ambos módulos. 2. Ctrl+K → CP se abre (listener capture de CP-palette gana). 3. #search-global nunca abre — listener de SP en fase bubble no ejecuta porque e.preventDefault() fue llamado. 4. Revertir orden de carga: mismo resultado si ambos usan fases distintas.
MG-1: Carga de archivos — dropzone, deduplicación
Parcial
Sin AC que declare comportamiento cuando usuario sube versión actualizada del mismo archivo (nombre idéntico)
Bug menor: _mgLoadFiles L268 — deduplicación por f.name exacto. Si el usuario arrastra ai-tracker-map-generator.js v2 sobre uno ya cargado, la versión anterior persiste sin warning. El archivo nuevo es silenciosamente descartado.
Menor
1. Abrir Map Generator. 2. Arrastrar archivo.js → se carga. 3. Arrastrar versión actualizada del mismo archivo.js. 4. L268: _mapGen.files.find(f => f.name === file.name) — match por nombre → skip silencioso. El MAP se genera con la versión antigua.
MG-2: Generación MAP — _mgBuildPlan, formato emitido
No
Sin AC que declare que el bloque generado debe usar ---EXECUTION-PLAN--- y no ---PLAN---
Bug mayor confirmado con archivo real: _mgBuildPlan L589 emite ---PLAN---\n y L603 cierra con ---PLAN-END---. Base Rules §9a activo define ---EXECUTION-PLAN--- / ---EXECUTION-PLAN-END--- como formato activo. ---PLAN--- es formato legacy — PP lo parsea en modo read-only únicamente. El PLAN generado por el Generator no puede ser ingerido por el parser activo de PP.
Mayor
1. Abrir PP con sprint siguiente con ítems asignados. 2. Map Generator → marcar "Plan" → Generar. 3. Doc generado comienza con ---PLAN---. 4. Si PP intenta parsear el bloque como EXECUTION-PLAN, falla — no matchea terminador activo. 5. Toast en L1309: "Plan generado pero no pudo ingresarse automáticamente".
MG-3: Export ZIP — _mgExportAllZip, fallback
Parcial
Sin AC que declare que exportFullHistoryMd excluida del ZIP es comportamiento esperado y no un bug
Bug menor — comentario contradictorio confirmado: L1407 // exportFullHistoryMd descarga directamente — la llamamos en fallback pero el if-block la excluye del ZIP sin llamarla. El fallback L1436 sí la llama. El ZIP nunca incluye el historial completo, pero el comentario sugiere que sería el comportamiento esperado en alguna versión. Sin AC que declare criterio.
Menor
1. JSZip disponible. 2. _mgExportAllZip(). 3. ZIP descargado. 4. exportFullHistoryMd ausente del ZIP — historial completo no incluido. 5. Sin warning al usuario.
MG-4: Version bump — confirmMapGenerator, guard sprint cerrado
Parcial
Sin AC que declare qué debe hacer el usuario tras el warning de sprint sin cerrar (el modal permanece abierto sin instrucción)
Bug menor: confirmMapGenerator L1234-1239 — si !hasClosedSprint, muestra toast de warning y retorna. El modal permanece abierto. El usuario no recibe instrucción de qué acción tomar para continuar. Toast es dismissable; el modal queda en estado indeterminado.
Menor
1. Abrir PP sin sprints cerrados. 2. Generar documentos. 3. Confirmar. 4. Toast: "Cierra un sprint antes de confirmar". 5. Modal permanece abierto. 6. Sin botón o instrucción de siguiente paso visible.
MG-5: Inferencia de estado — _mgInferStatus, detección modal activo
No
Sin AC que declare cuál mecanismo de detección del modal es el canónico (classList.contains, style.display, o aria-hidden)
Bug mayor: _mgInferStatus L771 — tres checks inconsistentes para el mismo modal: classList.contains('modal--open') OR style.display === 'flex' OR getAttribute('aria-hidden') === 'false'. Los tres pueden tener valores contradictorios simultáneamente. Si el modal usa aria-hidden='true' pero tiene classList.contains('modal--open'), _mgInferStatus devuelve 'closing' — estado incorrecto que desactiva el botón Generar y bloquea al usuario.
Mayor
1. Abrir PP. 2. #close-sprint-modal con classList.contains('modal--open') = true pero aria-hidden='true' (modal oculto visualmente). 3. openMapGenerator(). 4. _mgInferStatus → 'closing'. 5. Botón Generar deshabilitado. 6. previewStatusEl: "Sprint en proceso de cierre" — incorrecto.


GAPS DE AC PARA CAEL
Título del gap
Flujo afectado
Comportamiento observable sin AC
action-search-context — sin AC que declare prefijo tab- requerido en switchTab
CP — navegación a sub-tab Contexto
switchTab('backlog') en L158 (acción) y L310 (_cpSearchContext). Si switchTab valida ID exacto, el tab no cambia — switchSubTab('context') ejecuta sobre tab incorrecto o inactivo.
_buildDynamicCommands IAs — switchTab('tracker') sin prefijo
CP — comando dinámico "Nueva sesión con [IA]"
Mismo patrón que action-search-context. Comportamiento depende de si switchTab acepta IDs sin prefijo. Sin AC que declare cuál formato es válido.
_buildDynamicCommands proyectos — fuente canónica sin AC
CP — comandos dinámicos de proyectos
window.state.projects directo vs getActiveProject(). Sin AC que declare qué fuente es canónica y cuándo pueden diferir.
Ctrl+K — responsabilidad de módulo sin AC
CP — shortcut global
Dos listeners; fases capture vs bubble. Sin AC que declare cuál módulo es dueño canónico y cuál debe eliminar su listener.
_mgBuildPlan — formato del bloque generado sin AC
MG — generación del Plan
---PLAN--- emitido. Base Rules §9a define ---EXECUTION-PLAN--- como activo. Sin AC que declare cuál formato debe emitir el Generator.
_mgLoadFiles — comportamiento con archivo duplicado actualizado sin AC
MG — dropzone, deduplicación
Usuario sube versión actualizada del mismo archivo. La versión anterior persiste silenciosamente. Sin AC que declare si debe reemplazarse, ignorarse con warning, o rechazarse.
_mgInferStatus — mecanismo canónico de detección del modal sin AC
MG — inferencia de estado al abrir Generator
Tres checks inconsistentes para el mismo modal. Sin AC que declare cuál mecanismo es la fuente de verdad para 'closing'.
confirmMapGenerator — instrucción al usuario post-warning de sprint cerrado sin AC
MG — version bump, guard
Modal permanece abierto tras warning. Sin AC que declare si el modal debe cerrarse, mostrar instrucción, o permanecer abierto.
_mgExportAllZip — historial completo excluido del ZIP sin AC
MG — export ZIP
exportFullHistoryMd excluida del ZIP sin warning. Sin AC que declare si su exclusión es intencional y si el usuario debe ser notificado.
openCommandPalette — comportamiento cuando elementos del DOM están ausentes sin AC
CP — apertura
#cp-results, #cp-recent, #cp-input sin null guard en todos los puntos de acceso. Sin AC que declare si la palette debe abrirse parcialmente o fallar silenciosamente con toast.


---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2f — ai-tracker-command-palette.js + ai-tracker-map-generator.js
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 5 flujos CP + 5 flujos MG. Tres verificaciones explícitas ejecutadas con archivos reales: (1) Ctrl+K conflict — bug mayor confirmado: initCommandPalette() L713 registra listener en fase capture con e.preventDefault(); listener de SP en fase bubble nunca ejecuta cuando CP está cargado. (2) _mgBuildPlan formato — bug mayor confirmado: L589 emite '---PLAN---' / '---PLAN-END---'. Base Rules §9a define '---EXECUTION-PLAN---' como formato activo; el bloque generado no es ingerido por el parser activo de PP — _tryIngestPlan falla, toast de warning. (3) action-search-context — bug mayor confirmado: switchTab('backlog') en L158 y L310 sin prefijo 'tab-'; todos los demás nav-commands usan 'tab-backlog'. Si switchTab valida ID exacto, tab no cambia y switchSubTab ejecuta sobre tab incorrecto. Total sesión 2f: 3 bugs mayores (action-search-context/switchTab sin prefijo, _mgBuildPlan formato legacy, Ctrl+K capture vs bubble), 4 bugs menores (_buildDynamicCommands IAs sin prefijo, _mgLoadFiles deduplicación silenciosa, _mgExportAllZip comentario contradictorio sin historial en ZIP, confirmMapGenerator sin instrucción post-warning), 1 bug mayor adicional (_mgInferStatus tres checks inconsistentes). 10 gaps de AC documentados para Cael. Bugs de sesiones 2a-2e no re-auditados.
Archivos: ai-tracker-command-palette.js | ai-tracker-map-generator.js | audit-ai-tracker-command-palette_js+ai-tracker-map-generator_js+ai-tracker-sprint-project_js+env_js-1h.md | CHECKPOINT sesión 2e
Contexto: Fase 2 de auditoría PP · Sesión 2f — módulos command palette y map generator
Bloqueantes: (1) Bug mayor _mgBuildPlan: todo Plan generado desde el Generator usa formato legacy ---PLAN--- — no ingerido por parser activo de PP. Bloquea flujo de generación de EXECUTION-PLAN desde UI. (2) Bug mayor action-search-context: navegación a sub-tab Contexto puede fallar silenciosamente si switchTab valida ID exacto. (3) Bug mayor _mgInferStatus: estado 'closing' puede inferirse incorrectamente — deshabilita botón Generar y bloquea al usuario.
Aprendizaje: El patrón de switchTab sin prefijo 'tab-' es sistémico en CP — aparece en action-search-context (L158, L310) y en _buildDynamicCommands IAs (L210). Los comandos de nav estáticos sí usan el prefijo correcto. El defecto fue introducido en acciones más recientes (B-243, B-242) sin revisión de consistencia. _mgInferStatus usa tres mecanismos de detección de modal que pueden contradecirse — el check de aria-hidden es semánticamente inverso al de classList: aria-hidden='true' significa oculto, pero el código comprueba aria-hidden==='false' para detectar visible. Los tres checks pueden devolver valores distintos para el mismo estado visual del modal.
CONTEXT-SECTION: n/a
Decisión: Auditoría 2f completada. 4 bugs mayores + 4 bugs menores a Rune. 10 gaps de AC a Cael. Vera evalúa: (1) _mgBuildPlan 'OL' — ¿el Generator debe emitir EXECUTION-PLAN o sigue emitiendo PLAN como legacy? Requiere decisión antes de fix de Rune. (2) ¿Sesión 2g para auditar módulos de sprint lifecycle (confirmOpenSprint, confirmCloseSprint) pendientes de sesión 2e?
Próximo paso: 1) Gaps de AC → Cael (10 ítems). 2) Bugs → Rune (4 mayores + 4 menores con pasos reproducibles). 3) Vera: decidir formato canónico de Plan para Rune. 4) Vera: ¿autorizar sesión 2g — sprint lifecycle?

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "action-search-context y _cpSearchContext — switchTab('backlog') sin prefijo 'tab-': navegación a sub-tab Contexto puede fallar silenciosamente",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Command Palette · Navegación",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L158 (action-search-context): switchTab('tab-backlog') — con prefijo",
      "L310 (_cpSearchContext action): switchTab('tab-backlog') — con prefijo",
      "Verificable: grep \"switchTab('backlog')\" en ai-tracker-command-palette.js → 0 coincidencias"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildDynamicCommands IAs — switchTab('tracker') sin prefijo 'tab-': tab puede no cambiar si switchTab valida ID exacto",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Command Palette · Comandos dinámicos",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L210: switchTab('tab-tracker') — con prefijo",
      "Verificable: grep \"switchTab('tracker')\" en ai-tracker-command-palette.js → 0 coincidencias"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Ctrl+K doble listener — CP registra en fase capture con e.preventDefault(): listener de SP en fase bubble nunca ejecuta",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Keyboard shortcuts · Conflicto de handlers",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Un único listener de Ctrl+K en el documento — el módulo dueño lo registra; el otro elimina su listener o no lo registra",
      "Ctrl+K produce siempre el mismo resultado independiente del orden de carga de módulos",
      "Verificable: cargar PP, Ctrl+K múltiples veces → comportamiento consistente; grep 'keydown' en ambos módulos → un único punto de registro para Ctrl+K"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_mgBuildPlan — emite '---PLAN---' / '---PLAN-END---' (legacy): incompatible con parser activo de PP que espera '---EXECUTION-PLAN---'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Map Generator · Generación de Plan",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L589: bloque emitido comienza con '---EXECUTION-PLAN---'",
      "L603: bloque cierra con '---EXECUTION-PLAN-END---'",
      "Campo 'scope: sprint' incluido en el bloque generado",
      "_tryIngestPlan recibe el bloque y lo ingesta sin toast de warning",
      "Verificable: marcar 'Plan' en Generator, generar → documento inicia con '---EXECUTION-PLAN---'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_mgInferStatus — tres checks inconsistentes para detectar modal activo: classList, style.display y aria-hidden pueden contradecirse",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Map Generator · Inferencia de estado",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L771: un único mecanismo canónico para detectar visibilidad del modal #close-sprint-modal — declarado en AC de Cael",
      "Si el modal está oculto visualmente, _mgInferStatus no devuelve 'closing'",
      "Verificable: modal con aria-hidden='true' y sin clase 'modal--open' → openMapGenerator() → botón Generar habilitado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_mgLoadFiles — deduplicación silenciosa: archivo actualizado con mismo nombre reemplaza sin warning al anterior; versión antigua persiste",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Map Generator · Dropzone",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si el usuario sube un archivo con nombre idéntico al ya cargado: reemplazar la versión anterior con la nueva",
      "Toast informativo: '[nombre] reemplazado — versión anterior descartada'",
      "Verificable: cargar archivo.js v1, arrastrar archivo.js v2 → lista muestra v2; MAP generado refleja contenido de v2"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_mgExportAllZip — exportFullHistoryMd excluida del ZIP sin warning al usuario; comentario contradice el código",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Map Generator · Export ZIP",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si exportFullHistoryMd es excluida del ZIP intencionalmente: comentario L1407 actualizado para declarar la exclusión como intencional — sin referencia a 'fallback'",
      "Si debe incluirse: exportFullHistoryMd incluida en fileDefs antes de zip.generateAsync()",
      "En cualquier caso: sin contradicción entre comentario y código"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "confirmMapGenerator — sin instrucción al usuario tras warning de sprint sin cerrar: modal permanece abierto en estado indeterminado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Map Generator · Version bump",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Tras el toast de warning en L1236, el modal muestra instrucción visible: 'Cierra el sprint activo antes de continuar'",
      "O bien: el modal se cierra automáticamente para que el usuario ejecute el cierre de sprint",
      "El usuario no queda en estado donde el modal está abierto sin acción disponible clara"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2f-cp-mg
    rol: QA · Finn
    items: [pendiente-ID-switchtab-prefix, pendiente-ID-ctrlk-capture, pendiente-ID-mgbuildplan-format, pendiente-ID-mginfer-status]
    archivos: [ai-tracker-command-palette.js, ai-tracker-map-generator.js]
    depende_de: []
---EXECUTION-PLAN-END---

---

## Sesión 2g — index.html + CSS

Informe funcional — Sesión 2g · index.html + CSS
Flujo auditado
AC verificado
Gap de especificación
Bug detectado
Tipo
Pasos reproducibles
H-1. Carga inicial — flash of incorrect theme
No
Sin AC que declare que data-theme inicial debe leer localStorage antes del primer paint
Bug confirmado: <html data-theme="light"> hardcodeado en L2. patchApplyTheme corrige en DOMContentLoaded — paint inicial ocurre con light independientemente del tema guardado.
Mayor
1. Guardar tema dark en localStorage. 2. Recargar página. 3. Observar: flash de tema claro antes de que patchApplyTheme ejecute en DOMContentLoaded.
H-1b. Estrategia defer/async de dependencias
No
Sin AC que declare estrategia de carga por dependencia
Bug confirmado (de 1g): env.js y Supabase SDK sin defer/async — bloqueantes de renderizado. JSZip usa defer. Los 7 módulos de app en L1639-1645 tampoco tienen defer/async. Estrategia inconsistente.
Menor
1. Inspeccionar HEAD. 2. env.js L13 y Supabase L14 — sin defer/async. 3. DevTools Performance: bloqueo de parser en cada carga.
H-2. DOM duplicado — #cp-overlay vs #cmd-palette-overlay
No
Sin AC que declare cuál implementación es la activa
Determinación definitiva: #cp-overlay (L1320) es la implementación activa — contiene #cp-input, #cp-recent, #cp-results que son los IDs que ai-tracker-command-palette.js referencia (confirmado en sesión 2d). #cmd-palette-overlay (L1375) es dead DOM con sus propios estilos en inline <style> (L1748-1754). openCommandPalette() y closeCommandPalette() del botón de header (L110) y del onclick de #cmd-palette-overlay apuntan a funciones distintas — openCommandPalette() abre #cp-overlay vía el módulo JS; closeCommandPalette() en el onclick de #cmd-palette-overlay es la función del módulo legacy que opera sobre #cmd-palette-overlay. Dos funciones con mismo nombre en scope. Riesgo de shadowing.
Crítico
1. Cargar PP. 2. Ctrl+K o botón ⌘ → openCommandPalette() abre #cp-overlay. 3. Inspeccionar #cmd-palette-overlay — presente en DOM con hidden, nunca se activa. 4. Verificar si closeCommandPalette() en línea 1375 opera sobre overlay distinto al que openCommandPalette() abre.
H-3a. Inline script — toggleHeaderSearch
Parcial
—
#backup-badge y #version-pill no existen en DOM (confirmado: grep -n 'id="backup-badge"|id="version-pill"' → 0 resultados). _updateBackupBadge() tiene null guard para badge y vp — no lanza error. Sin efecto observable pero el badge nunca actualiza.
Menor
1. Abrir PP. 2. Agregar datos a localStorage. 3. Observar header — ningún badge visual de backup. #backup-badge no existe en DOM.
H-3b. Inline script — patchApplyTheme
No — (de 1g)
—
Parche en HTML corrige contrato roto en módulo externo. La corrección no debería vivir en HTML inline. Confirmado como deuda de especificación — no nuevo bug.
—
—
H-3c. Inline script — reset-backlog-modal
No
Sin AC que declare separación de lógica de validación del HTML
Bug confirmado: L827-836 — lógica multi-sentencia en oninput inline: comparación de string, toggle de disabled, toggle de clase, textContent — 5 operaciones de DOM en atributo HTML. Viola separación HTML/JS §17.
Mayor
1. Abrir reset modal. 2. Inspeccionar input #reset-backlog-input. 3. oninput contiene lógica JS no trivial — no llama función nombrada. No auditable ni testeable de forma aislada.
H-4. Inline styles — CSS Purity §15
No
—
Tres violaciones confirmadas con código real: (1) L353: #btn-import-backlog style="display:none" en elemento estático. (2) L451: #toolbar style="display:none" en elemento estático. (3) L1693: #gf-pulso style="cursor:pointer" en elemento estático. Las tres son propiedades de presentación en HTML que deben vivir en CSS.
Mayor
1. grep 'style=' index.html → tres coincidencias con propiedades de presentación. 2. Ninguna controlada por clase CSS — violación §15 confirmada.
H-5. Opción tipo 'I' en #item-type select — runtime
No
—
Confirmado en código real: L894-899 — <option value="I">I — Idea</option> (L895) antes de <option value="P">P — Idea</option> (L896). Cuando el usuario selecciona la primera opción "I — Idea" y guarda el ítem, item.type = 'I'. El sistema de numeración (Base Rules §5) no define tipo I. _assignPendingIds en ai-tracker-checkpoint.js marca _invalidType = true para codes con prefijo I-. La opción I es funcional en el editor — produce ítems con tipo inválido sin advertencia al usuario.
Crítico
1. Abrir editor de ítem. 2. Selector muestra I — Idea como primera opción (default). 3. Guardar sin cambiar tipo → item.type = 'I'. 4. _assignPendingIds rechaza el ítem (flag interno sin toast). 5. Downstream: buildBacklogMd, tracker legacy, regex [PTRB] — ítem ignorado o mal clasificado.
CSS-1. Tema — declaración --font-sans / --font-mono
Parcial
—
Hallazgo que corrige 1d: ai-tracker.css L3-6 SÍ declara --font-sans y --font-mono en :root global. El gap reportado en 1d es parcialmente incorrecto para el CSS base. Sin embargo, ai-tracker-extra.css L17214 re-declara --font-sans con !important en bloque macOS Fidelity (:root global, sin scope de plataforma) — sobreescribe globalmente el valor de ai-tracker.css para todos los usuarios, no solo macOS. La re-declaración aplica siempre.
Mayor
1. Cargar PP en Windows/Chrome. 2. Inspeccionar --font-sans en devtools. 3. Valor: -apple-system, BlinkMacSystemFont… (macOS stack) — no 'DM Sans' declarado en ai-tracker.css. El macOS block aplica globalmente.
CSS-1b. Flash de tema — aplicación de data-theme
No
Sin AC que declare orden de aplicación de tema entre HTML y CSS
data-theme="light" hardcodeado en <html> (L2 index.html). :root[data-theme="dark"] en ai-tracker-extra.css L11 y ai-tracker.css L62 definen las vars del tema. Mientras patchApplyTheme no ejecute, todas las vars del tema oscuro son indefinidas para un usuario dark. El CSS necesita el atributo correcto para aplicar las vars. Mismo bug que H-1 — origen confirmado en HTML.
Mayor
Ver H-1.
CSS-2. Responsive — breakpoints 900px/899px y 600px/601px
No
Sin AC para breakpoints canónicos del sistema
Confirmado: @media (max-width: 900px) L12031 y @media (max-width: 899px) L12760 en ai-tracker-extra.css — viewport exacto de 900px tiene un gap de 1px sin estilos de ninguna de las dos. @media (min-width: 601px) y @media (max-width: 600px) en ~28 instancias — viewport exacto de 600px cae en ambos si los navegadores redondean. Sin variables CSS para breakpoints — ~45 instancias hardcodeadas.
Menor
1. Viewport exacto 900px → ningún breakpoint aplica (gap). 2. Viewport exacto 600px → puede aplicar ambos bloques según redondeo del navegador.
CSS-3. color-mix() sin @supports
No
Sin AC que declare soporte mínimo de navegador
175 instancias de color-mix(in srgb, ...) en ambos archivos combinados (14 en ai-tracker.css, 161 en ai-tracker-extra.css). Ninguna wrapped en @supports. Sin fallback. No soportado en Safari < 16.2, Firefox < 113, Chrome < 111. Afecta badges de tipo, sprint headers, sprint-confirm panels, heatmap cells.
Mayor
1. Abrir PP en Safari < 16.2 o Firefox < 113. 2. Inspeccionar badges de tipo de ítem, sprint headers, heatmap — colores de fondo ausentes. Sin fallback visible.
CSS-4. backdrop-filter sin -webkit-backdrop-filter
No
—
3 instancias sin par webkit confirmadas: L662 (#ckpt-panel), L3717 (.quick-note-overlay), L9759 (overlay genérico). Los demás tienen par webkit. Safari < 15.4 no aplica blur en estos elementos.
Menor
1. Abrir PP en Safari < 15.4. 2. #ckpt-panel, modal de nota rápida y overlay genérico — sin efecto blur.
CSS-5. background-attachment: fixed sin override mobile
No
Sin AC que declare comportamiento en mobile
L133 — [data-theme="dark"] body tiene background-attachment: fixed. Sin @media (max-width: ...) que lo desactive. GPU no interpola background-attachment: fixed en iOS/Android — scroll jank garantizado en mobile con tema oscuro.
Mayor
1. Abrir PP en iOS (Safari) o Android con tema dark. 2. Scroll → jank visual pronunciado — background no se mueve con el scroll.


Lista de gaps de AC 2g para Cael
#
Título del gap
Flujo afectado
1
data-theme inicial debe leer localStorage antes del primer paint
H-1: carga inicial — tema
2
Estrategia canónica de carga de scripts (defer/async por tipo de dependencia)
H-1b: HEAD
3
#cmd-palette-overlay — declarar si es dead DOM a eliminar o implementación a activar
H-2: command palette DOM duplicado
4
closeCommandPalette() referenciada en #cmd-palette-overlay — declarar función canónica vs función del módulo activo
H-2: command palette handlers
5
#backup-badge y #version-pill — declarar si deben existir en DOM o si _updateBackupBadge() es dead code
H-3a: inline script
6
Lógica de validación del reset modal debe vivir en función nombrada, no en oninput inline
H-3c: reset modal
7
Opción value="I" en #item-type — declarar si debe eliminarse o si existe intención de soporte
H-5: item editor select
8
--font-sans re-declarado en macOS Fidelity block sin scope de plataforma — ¿apply global intencional?
CSS-1: tipografía
9
Breakpoints canónicos del sistema — declarar valores exactos y fuente única (CSS variables vs hardcode)
CSS-2: responsive
10
Soporte mínimo de navegador para color-mix() — ¿requiere @supports wrapper o se acepta degradación visual?
CSS-3: color
11
background-attachment: fixed en dark body — declarar si debe desactivarse en mobile
CSS-5: scroll mobile


Consolidado de Fase 2
Tabla resumen por sesión
Sesión
Módulo
Críticos
Mayores
Menores
Obs.
Gaps de AC
2a
ai-tracker-backlog.js
1
4
7
0
12
2b
ai-tracker-backlog.js (render/DnD/focus)
0
4
3
1
8
2c (1ª)
ai-tracker-session.js
1
5
4
2
10
2c (2ª)
ai-tracker-session.js + ai-tracker-ai-notes.js
0
5
3
2
8
2c-bis
ai-tracker-ai-notes.js
2
3
4
1
7
2d
ai-tracker-checkpoint.js
1
6
4
0
10
2e
ai-tracker-sprint-project.js
0
5
4
0
11
2f
CP + Map Generator
0
4
4
0
10
2g
index.html + CSS
2
8
4
0
11
TOTAL


7
44
37
6
87

Nota de deduplicación 2c: Los dos bugs críticos de openQuickNote reportados en 2c y 2c-bis fueron reclasificados en 2d — la función existe en ai-tracker-checkpoint.js L6630. Prioridad pendiente de reevaluación por Vera según orden de carga. Contados como críticos en tabla histórica de sus sesiones de origen.

Lista maestra de gaps de AC para Cael — Fase 2 completa (sin duplicados)
Módulo: ai-tracker-backlog.js (2a)
Idempotencia de migración de status en IIFE + loadBacklog
Condición de disparo de saveBacklog en loadBacklog — solo si migrated=true o sanitized>0
Comportamiento cuando _normalizeStatus no está disponible en loadBacklog
Deshacibilidad de corrección doneAt mismatch en _sanitizePendingInClosedSprints
Deshacibilidad del cierre automático del P padre en mergeBacklogFromTG
Aislamiento de closures window._mdiff* entre aperturas de showMergeDiffPanel
Restauración del project filter si loadBacklog falla en el finally de showMergeDiffPanel
Orden de _blogLog y _undoSnapshot en setItemStatus
Exclusión de sprints cerrados en _calcPriority regla effort 1
Límite de carga en _calcRelevanceScore — getAllSessions por ítem
Valor correcto de isLast cuando skipStep2=true en _scmRender
Fuente canónica de _scmState en _scmStep1Html
Módulo: ai-tracker-backlog.js (2b)
Progreso de R con filtros activos — denominador sobre allChildren, no hijos filtrados
desc como campo de render legacy — advertencia o migración a title
Estabilidad de IDs de DOM en _buildChildrenBlock tras mutación de ITEMS
DnD inactivo como estado declarado o criterio de reactivación
Guardia de existencia para openItemEditor
Shortcut Cmd+F — cuál focus mode activa con tab Backlog activo y sin panel
Comportamiento de Esc con ambos focus modes activos simultáneamente
Módulo: ai-tracker-session.js (2c 1ª)
Guard de null en saveSession() cuando getAI(id) devuelve null
Comportamiento del botón Guardar cuando no hay proyectos en _showProjRequiredInPanel
Estado de sesión cuando usuario cancela showMergeDiffPanel (sesión pre-persistida)
getAllSessions invocada sin guard de existencia en exportWeeklySummary
Formatos de fecha válidos en sess.date para _sessInRange
Guard de null en editNotes() cuando getAI(id) devuelve null
openQuickNote() invocada sin guard — dependencia de módulo externo no declarada (reclasificada en 2d — función existe en ai-tracker-checkpoint.js)
CANONICAL_PROJECTS contiene strings deprecados 'Obsidiana Labs' y 'Obsidiana'
Módulo: ai-tracker-session.js + ai-tracker-ai-notes.js (2c 2ª)
Guard de null en saveSession() cuando getAI(id) devuelve null (mismo que #20 — consolidado)
_doSaveSession — newSess guardado antes de confirmación de showMergeDiffPanel
_rebuildLogBody — listener scroll acumulado por render() monkey-patch
_buildLogHeader — ai.color interpolado como atributo sin nombre en pill de IA
exportWeeklySummary — getAllSessions() sin guard (mismo que #23 — consolidado)
deleteAI — verifica sesiones solo en state.projects, no en ai.sessions formato legacy
openQuickNote invocada sin guard (reclasificada — ver #26)
Módulo: ai-tracker-ai-notes.js (2c-bis)
_ieAutofillFromPaste — regex acepta tipo I inválido en ambas rutas (CHECKPOINT line y Markdown)
onSearch — quickNotes no respetan scope de proyecto activo
openItemEditor — campo #item-notes ausente del DOM sin warning
Status no expuesto en editor de ítems — declarar si es read-only intencional
Eliminación de ítems — declarar que vive en módulo externo (scope del editor incompleto)
Límites de resultados de búsqueda (20 notas, 30 sesiones) sin AC de criterio
Módulo: ai-tracker-checkpoint.js (2d)
downloadTemplates invocada sin guard typeof post-diff-confirm
handlePaste / handleInput sin guard en atributos HTML inline
getActiveSprints() — sin AC de qué estados de sprint incluye el retorno
_assignPendingIds — slug collision para ítems sin title/desc
Tipo inválido _invalidType — sin surface al usuario
_isBlocked — dep IDs inexistentes en allSessions
Warning message ---PLAN--- en lugar de ---EXECUTION-PLAN---
openQuickNote — acceso a elementos del modal sin null guard individual
loadPlan / ---PLAN--- legacy — garantía de read-only no verificable desde este módulo
Validación de scope en EXECUTION-PLAN — no verificable desde este módulo
Módulo: ai-tracker-sprint-project.js (2e)
_docPrefix — sin entrada 'Obsidian Labs'→'OL' en _PREFIX_MAP
i.code[0] sin guard — comportamiento con code:null/undefined en contadores export (L455) y estado actual (L46)
Fuente canónica de sprints — state.sprints vs getActiveSprints() por función
Criterio de sprint activo — 'active' vs 'active'||'open' dentro del mismo exportBacklogMd
confirmProjForm — sin AC para nombre duplicado de proyecto
confirmProjForm — sin AC para prefijo duplicado
proj-modal-overlay sin null guard — openProjModal/closeProjModal/openProjPanel/closeProjPanel
SPRINT_DATA_THRESHOLD=23 — sin AC que declare criterio del umbral
Sprint apertura/cierre — confirmOpenSprint, confirmCloseSprint no auditables (módulo no adjunto)
Ctrl+K — sin AC que declare módulo dueño canónico del shortcut
_renderProjList archived toggle — sin AC de separación de lógica JS del innerHTML
Módulo: Command Palette + Map Generator (2f)
action-search-context — sin AC que declare prefijo tab- requerido en switchTab
_buildDynamicCommands IAs — switchTab('tracker') sin prefijo
_buildDynamicCommands proyectos — fuente canónica window.state.projects vs getActiveProject()
Ctrl+K — responsabilidad de módulo sin AC (misma raíz que #60 — consolidado)
_mgBuildPlan — formato del bloque generado (debe ser ---EXECUTION-PLAN---)
_mgLoadFiles — comportamiento con archivo duplicado actualizado
_mgInferStatus — mecanismo canónico de detección del modal
confirmMapGenerator — instrucción al usuario post-warning de sprint cerrado
_mgExportAllZip — historial completo excluido sin AC de criterio
index.html + CSS (2g)
data-theme inicial debe leer localStorage antes del primer paint
Estrategia canónica de carga de scripts (defer/async por tipo)
#cmd-palette-overlay — declarar si es dead DOM a eliminar o implementación a activar
closeCommandPalette() en #cmd-palette-overlay — función canónica vs módulo activo
#backup-badge y #version-pill — declarar si deben existir en DOM
Lógica de validación del reset modal — función nombrada, no oninput inline
Opción value="I" en #item-type — eliminar o declarar soporte
--font-sans re-declarado en macOS Fidelity block sin scope de plataforma
Breakpoints canónicos del sistema — variables CSS vs hardcode
Soporte mínimo de navegador para color-mix() — @supports o degradación aceptada
background-attachment: fixed en dark body — override mobile requerido o no
Total gaps únicos Fase 2: 81 (87 reportados en sesiones — 6 consolidados por duplicación entre sesiones)

Rs sugeridos para Fase 4
Título sugerido
Prioridad
Justificación
Eliminar #cmd-palette-overlay del DOM y unificar en #cp-overlay
high
Dead DOM activo con estilos propios y closeCommandPalette() potencialmente en conflicto — riesgo de shadowing de función que puede romper la CP activa silenciosamente.
AC transversal obligatorio: guard typeof para todas las funciones externas invocadas desde HTML inline o módulos
high
Patrón sistémico confirmado en 6 puntos: openItemEditor, openQuickNote, getAllSessions, downloadTemplates, handlePaste, handleInput — cualquier carga fallida es ReferenceError sin feedback. Un AC general previene recurrencia.
Opción value="I" en #item-type select — eliminar o convertir en alias de P
high
El select muestra I como primera opción (default). Ítems creados con type='I' son rechazados downstream en _assignPendingIds, buildBacklogMd y tracker sin feedback al usuario. Genera corrupción silenciosa de backlog.
Unificar criterio de sprint activo en función canónica — getActiveSprints() como única fuente
high
Triple punto de acceso inconsistente en el mismo flujo de export: _buildCurrentStateMd ('active'), _generateBacklogMd (`'active'
Migración de --font-sans/--font-mono a ai-tracker.css como fuente única — eliminar re-declaración !important en macOS block
high
El macOS Fidelity block re-declara --font-sans con !important sobre :root global — aplica a todos los usuarios, no solo macOS. Rompe el stack tipográfico intencional de ai-tracker.css.
_mgBuildPlan — emitir ---EXECUTION-PLAN--- en lugar de ---PLAN---
high
El Plan generado desde el Generator no es ingerido por el parser activo de PP (_tryIngestPlan falla). El flujo UI de generación de plan está roto end-to-end.
Fix _scmRender — isLast con skipStep2=true
high
Bug crítico de 2a: botón "Cerrar sprint" inaccesible cuando no hay ítems pendientes. Bloquea el flujo de cierre de sprint desde la UI.
newSess push atómico — no persistir hasta confirmación de showMergeDiffPanel
high
Cancelar el panel de diff deja una sesión persistida sin ítems mergeados — estado inconsistente permanente sin señal al usuario.
Fix _docPrefix — agregar entrada 'Obsidian Labs': 'OL' en _PREFIX_MAP
high
Todos los exports del holding generan prefijo 'OB' (legacy). Naming de documentos vivos del holding incorrecto desde el cambio de nombre a Obsidian Labs.
Fix de tema en carga inicial — leer localStorage antes del primer paint para evitar flash
medium
Flash of incorrect theme en cada carga para usuarios con dark mode — degradación visual garantizada.
Migrar bloques <style> inline de index.html a archivos .css
medium
4 bloques <style> en HTML (CP, tracker views, cronómetro/weekly, user chip) — viola CSS Purity §15. Uno tiene comentario explícito de migración pendiente (T-202604-423).
Definir e implementar AC general: toda mutación de ITEMS fuera de setItemStatus() debe llamar _undoSnapshot()
medium
Patrón dominante de 2a: cierre de P padre y _sanitizePendingInClosedSprints mutan estado sin snapshot. Cualquier mutación directa posterior tendrá el mismo gap.
_calcRelevanceScore — cachear getAllSessions() fuera del loop en _recalcAllScores
medium
O(n×m) en hot path: cada cambio de status recalcula sobre todos los ítems × todas las sesiones. Con 200 ítems y 50 sesiones → congelamiento de UI.
Eliminar scripts bloqueantes del HEAD — agregar defer a env.js y Supabase SDK
medium
env.js y Supabase SDK sin defer/async bloquean el parser HTML en cada carga.
Agregar @supports (color-mix: ...) wrapper o fallbacks hardcoded
medium
175 instancias sin soporte en Safari < 16.2 y Firefox < 113 — colores de badges, sprint headers y heatmap desaparecen silenciosamente.
background-attachment: fixed en dark body — desactivar en mobile via @media
medium
Scroll jank garantizado en iOS/Android con tema dark — GPU no interpola background-attachment: fixed.
Breakpoints — declarar valores canónicos como CSS custom properties y resolver gaps 900px/600px
low
~45 instancias hardcodeadas de breakpoints con conflictos en viewports exactos. Mantenimiento por search-replace manual.
Añadir -webkit-backdrop-filter a #ckpt-panel, .quick-note-overlay y overlay genérico (L9759)
low
3 instancias sin par webkit — blur ausente en Safari < 15.4 para el panel de CHECKPOINT, notas rápidas y overlay genérico.


---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2g — index.html + CSS · Cierre de Fase 2
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Sesión 2g cubre 5 flujos de index.html y 5 flujos CSS. Hallazgos nuevos: 2 críticos (DOM duplicado #cp-overlay/#cmd-palette-overlay — #cp-overlay confirmado como activo, #cmd-palette-overlay como dead DOM con riesgo de shadowing de closeCommandPalette(); opción value="I" como primera opción del item-type select — produce ítems con tipo inválido por defecto sin advertencia), 8 mayores, 4 menores. Hallazgo correctivo de 1d: --font-sans y --font-mono SÍ están declarados en :root de ai-tracker.css — el gap real es la re-declaración con !important en el macOS Fidelity block de ai-tracker-extra.css, que aplica globalmente a todos los usuarios. Consolidado de Fase 2 emitido: 9 sesiones, 7 críticos, 44 mayores, 37 menores, 6 observaciones, 81 gaps de AC únicos, 18 Rs sugeridos para Fase 4.
Archivos: index.html | ai-tracker.css | ai-tracker-extra.css | audit-index_html-1g.md | audit-css-1e.md | audit-ai-tracker-extra_css-1d.md | CHECKPOINTs 2a→2f
Contexto: Cierre de Fase 2 — auditoría funcional completa de PP previo a sesión estratégica con Vera
Bloqueantes: 3 bugs críticos con decisión de Vera pendiente: (1) #cmd-palette-overlay — ¿eliminar dead DOM o reactivar? Mientras coexistan, riesgo de shadowing de closeCommandPalette(). (2) Opción value="I" como default en item-type select — produce corrupción silenciosa de backlog en cada ítem creado sin cambiar el selector. (3) _scmRender isLast=3 siempre con skipStep2=true (2a) — botón "Cerrar sprint" inaccesible. Adicionalmente: bug crítico de newSess pre-persistido (2c) y openQuickNote orden de carga (2d) pendientes de evaluación de Vera.
Aprendizaje: Tres patrones sistémicos confirmados en toda la Fase 2: (1) funciones externas sin guard typeof (6 puntos); (2) mutaciones de ITEMS fuera de setItemStatus() sin _undoSnapshot() (merge padre, sanitize, merge diff); (3) listener acumulación sin cleanup (keydown, scroll, ESC en 4 módulos distintos). Los tres requieren AC transversal, no fix caso por caso.
CONTEXT-SECTION: n/a
Decisión: Fase 2 cerrada. 81 gaps de AC documentados para Cael. Bugs a Rune según prioridad. Vera: sesión estratégica de release decision requerida antes de Fase 3.
Próximo paso: 1) Vera: sesión de release decision con consolidado completo — evaluar bugs críticos bloqueantes. 2) Cael: recibir 81 gaps de AC para priorización. 3) Rune: recibir lista de bugs por prioridad con pasos reproducibles. 4) Fase 3 no inicia hasta que Vera apruebe release o declare sprint de fixes.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "#cmd-palette-overlay — dead DOM con closeCommandPalette() potencialmente conflictivo con implementación activa #cp-overlay",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Command Palette · DOM duplicado",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "#cmd-palette-overlay removido del DOM — un único shell de command palette en index.html",
      "closeCommandPalette() referenciada en el overlay eliminado — ningún onclick huérfano en DOM",
      "openCommandPalette() y closeCommandPalette() operan exclusivamente sobre #cp-overlay",
      "Inline <style> block de .cmd-palette-overlay migrado a archivo .css o eliminado si el shell se remueve"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "item-type select — value='I' como primera opción (default): ítems creados sin cambiar selector tienen type='I' inválido",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Item editor · Select de tipo",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La opción value='I' eliminada del select #item-type",
      "Primera opción del select es value='P' — tipo canónico para Ideas según Base Rules §5",
      "Ningún ítem puede crearse con type='I' desde el editor",
      "Verificable: inspeccionar #item-type — 4 opciones: P, T, R, B"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "data-theme='light' hardcodeado en <html>: flash of incorrect theme en cada carga para usuarios con dark mode",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Tema · Carga inicial",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "data-theme en <html> se establece desde localStorage antes del primer paint — vía script inline en <head> antes de las hojas CSS",
      "Usuarios con dark mode guardado no ven flash de tema claro en ninguna carga",
      "patchApplyTheme en DOMContentLoaded puede eliminarse o convertirse en fallback"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "reset-backlog-modal oninput — lógica multi-sentencia de validación en atributo HTML inline, no en función nombrada",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Reset modal · Separación HTML/JS",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "oninput de #reset-backlog-input llama función nombrada (ej: _validateResetInput())",
      "La función vive en un archivo .js — auditable y testeable",
      "grep 'oninput.*getElementById' en index.html → 0 coincidencias"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Tres inline styles en elementos estáticos — violación CSS Purity §15: #btn-import-backlog, #toolbar, #gf-pulso",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CSS Purity · index.html",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L353: #btn-import-backlog sin style='display:none' — visibilidad controlada por clase .hidden o similar en CSS",
      "L451: #toolbar sin style='display:none' — misma regla",
      "L1693: #gf-pulso sin style='cursor:pointer' — cursor definido en .gf-pulso en CSS",
      "grep 'style=' index.html → 0 coincidencias con propiedades de presentación"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "--font-sans re-declarado con !important en macOS Fidelity block sin scope de plataforma — aplica globalmente a todos los usuarios",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CSS · Tipografía global",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La re-declaración de --font-sans en el macOS Fidelity block (L17213-17214 de ai-tracker-extra.css) está condicionada a un selector de plataforma (ej: @supports (-webkit-appearance: none) o @media (-webkit-min-device-pixel-ratio)) — no aplica a :root global",
      "O bien: la declaración se elimina del bloque macOS y --font-sans se gestiona exclusivamente en ai-tracker.css",
      "En Windows/Chrome: --font-sans resuelve a 'DM Sans' — verificable en devtools computed styles"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "color-mix() — 175 instancias sin @supports wrapper ni fallback: colores ausentes en Safari < 16.2 y Firefox < 113",
    "status": "pendiente",
    "priority": "medium",
    "effort": 3,
    "area": "CSS · Compatibilidad cross-browser",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cada uso de color-mix() tiene fallback estático (valor hex o rgba) como propiedad anterior en el mismo bloque",
      "O bien: @supports (color-mix: ()) wrapper en bloques críticos (badges de tipo, sprint headers, heatmap)",
      "En Safari 15: badges de tipo de ítem tienen color de fondo visible"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "background-attachment: fixed en dark body — sin override mobile: scroll jank garantizado en iOS/Android",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "CSS · Performance mobile",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "@media (max-width: 768px): [data-theme='dark'] body { background-attachment: scroll }",
      "En iOS Safari con tema dark: scroll sin jank visual"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "env.js y Supabase SDK en HEAD sin defer/async — bloqueantes de renderizado en cada carga",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Performance · Carga de scripts",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "env.js cargado con defer (o movido a pie de body si requiere disponibilidad inmediata)",
      "Supabase SDK cargado con defer o async según patrón de inicialización",
      "Estrategia de carga consistente entre todas las dependencias del HEAD"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "3 instancias de backdrop-filter sin -webkit-backdrop-filter: #ckpt-panel (L662), .quick-note-overlay (L3717), overlay genérico (L9759)",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CSS · Compatibilidad Safari",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L662 (#ckpt-panel): -webkit-backdrop-filter: blur(12px) agregado inmediatamente después del backdrop-filter",
      "L3717 (.quick-note-overlay): ídem",
      "L9759 (overlay genérico): ídem",
      "grep 'backdrop-filter' en ai-tracker-extra.css: cada instancia tiene par -webkit-backdrop-filter en la línea siguiente"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2g-html-css-cierre-fase2
    rol: QA · Finn
    items: [pendiente-ID-cmd-palette-dead-dom, pendiente-ID-item-type-I-default, pendiente-ID-flash-theme]
    archivos: [index.html, ai-tracker.css, ai-tracker-extra.css]
    depende_de: []
---EXECUTION-PLAN-END---


