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

