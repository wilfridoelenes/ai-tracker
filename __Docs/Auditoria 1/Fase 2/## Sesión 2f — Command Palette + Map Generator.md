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

