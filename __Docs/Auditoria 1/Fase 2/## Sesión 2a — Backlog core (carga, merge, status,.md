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



