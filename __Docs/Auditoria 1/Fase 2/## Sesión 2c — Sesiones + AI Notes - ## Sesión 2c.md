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

