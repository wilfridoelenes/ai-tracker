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

