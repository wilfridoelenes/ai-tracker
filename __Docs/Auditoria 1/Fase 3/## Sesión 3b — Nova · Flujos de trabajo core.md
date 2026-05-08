## Sesión 3b — Nova · Flujos de trabajo core

Informe de experiencia — Sesión 3b · Uso sostenido PP
#Módulo / FlujoFricción detectadaPrincipio violadoSeveridadPropuesta de mejora (una línea)1Backlog — crear ítemNo hay CTA visible de "Nuevo ítem" en el Backlog salvo vía command palette (openItemEditor(null) desde CP) o via toolbar; el flujo de creación no es visible para uso repetido sin conocer el shortcutNielsen #6 — Reconocimiento sobre recuerdoAltaAgregar botón "+ Nuevo ítem" visible en la toolbar del Backlog sin depender de CP o shortcut2Backlog — cambiar statussetItemStatus es una función interna sin CTA directo en el listado; la única vía rápida de marcar done es el botón en el item detail panel (IDP) que aparece solo después de expandir el ítemFitts — la acción más frecuente en backlog vivo requiere el mayor recorrido de interacciónAltaAgregar inline status chip clickeable en la fila del ítem colapsado — sin requerir expansión del IDP3Backlog — asignar sprintopenItemEditor es la única vía para asignar sprint a un ítem; no hay control inline en la fila ni en el IDP para cambiar sprint sin abrir el editor completoNielsen #7 — Flexibilidad y eficiencia de usoAltaAgregar selector de sprint como acción contextual en el menú rápido del ítem o en el IDP4Sesiones — flujo de registroEl textarea de paste (ta-[id]) no tiene label visible que explique qué pegar — el placeholder del campo no está visible si el usuario no sabe qué es un CHECKPOINT; el flujo correcto depende de conocimiento previo del conceptoNielsen #6 — Reconocimiento · Nielsen #10 — Ayuda y documentaciónAltaAgregar hint colapsable bajo el textarea: "¿Qué pego aquí? → El bloque ---CHECKPOINT--- que genera tu IA al cerrar sesión"5Sesiones — feedback post-guardadoAl guardar un CHECKPOINT exitosamente (savePaste), el sistema muestra un toast y re-renderiza el card, pero la sesión recién guardada no se distingue visualmente de las anteriores — no hay highlight de "sesión nueva" en el historialNielsen #1 — Visibilidad del estado del sistemaMediaAplicar el mismo log-row--highlight (ya implementado en scrollToLogCard) automáticamente en la fila de la sesión recién guardada6Sesiones — apertura y registro de actividadLa fase-bar (Pegar → Confirmar → Guardar) no tiene etiquetas visibles en el estado active ni done; el usuario que está en fase 2 no sabe qué acción falta para llegar a fase 3Nielsen #1 — Visibilidad · Gestalt — Figura/fondo (puntos activos sin texto)MediaAgregar tooltip o micro-label en cada fase-bar-step que explique la acción requerida en esa fase7Sprints — coherencia con ciclo Base RulesEl modal de apertura de sprint no solicita version_target ni release_type — campos declarados como obligatorios en Base Rules §6; el usuario puede abrir un sprint sin estos datos y los exports quedan sin esa metadataNielsen #4 — Consistencia (Base Rules declara obligatorio, UI no exige)AltaAgregar campos version_target y release_type como obligatorios en el formulario de apertura de sprint8Sprints — cierre de sprintconfirmCloseSprint ejecuta el cierre sin mostrar un resumen pre-cierre de ítems pendientes que quedarán sin completar; el usuario no ve el impacto antes de confirmarNielsen #5 — Prevención de erroresMediaMostrar en el modal de confirmación de cierre: N ítems pendientes que migrarán, M ítems done en este sprint9Command palette — descubribilidadEl shortcut Cmd+K no está indicado en ningún lugar de la interfaz fuera del menú ⋯ (opción "Atajos") — un usuario de uso sostenido que no exploró el menú ⋯ en el primer uso no descubre el CPNielsen #6 — Reconocimiento sobre recuerdo · Fitts (superficie de acceso cero sin el shortcut)MediaAgregar el hint "⌘K" en el header o en el tooltip del botón del menú ⋯ como entry point visible10Command palette — comandos disponibles"Ir a Documentos" en el CP navega al tab tab-backlog pero el label interno del módulo es Documentos mientras la decisión 3a recomienda renombrarlo a Backlog; hay inconsistencia anticipada entre label del CP y label del tabNielsen #4 — ConsistenciaBajaCuando se ejecute R de renombrado del tab (3a), actualizar simultáneamente el label en _buildCommandRegistry11Command palette — "toggle Focus" en CPEl comando "Activar / desactivar Modo Focus" en CP llama toggleFocusMode() (panel focus), no toggleBacklogFocusMode() (Top-10); bug ya documentado en Finn 2b — duplicado técnico confirmado; desde experiencia, el label del comando no distingue cuál modo activaNielsen #2 — Coincidencia sistema/mundo (el label es ambiguo sobre qué focus activa)MediaActualizar el label del comando CP para distinguir: "Focus Panel" vs "Focus Top-10" según el contexto activo12Map generator — propósito del móduloAl abrir el Map Generator, el encabezado dice "Document Generator" sin explicar en ningún lugar visible qué produce exactamente (MAP + CONTEXT + BACKLOG + Sprint Review) ni cuándo usarlo en el flujo de trabajoNielsen #6 — Reconocimiento · Nielsen #10 — Ayuda y documentaciónMediaAgregar una línea de descripción bajo el encabezado del overlay: "Genera MAP, CONTEXT y BACKLOG actualizados al cierre de sprint"13Map generator — dropzone y estado de generaciónLa dropzone muestra solo el estado vacío ("Arrastra archivos JS/CSS/HTML") sin indicar cuántos archivos se requieren ni si el MAP ya existente en localStorage está cargado; el botón "Generar" se habilita en silencio cuando mg-out-map no está checked sin ningún feedback al usuarioNielsen #1 — Visibilidad del estado del sistemaMediaMostrar el nombre del MAP importado en localStorage como pre-condición visible al abrir el overlay, antes de que el usuario arrastre archivos14Map generator — columna "Trasciende" en Sprint ReviewLa columna Trasciende en las tablas de decisiones y aprendizajes no tiene tooltip ni descripción; el usuario no sabe qué significa marcar algo como "trasciende" ni qué efecto tiene sobre el output generadoNielsen #6 — Reconocimiento sobre recuerdoMediaAgregar tooltip en el header de columna: "Incluir en el CONTEXT del siguiente sprint"15AI Notes — integración en flujo de trabajoai-tracker-ai-notes.js contiene funciones de gestión de Workers (openAddAI, confirmClear, deleteAI, avatar), sesiones rápidas (toggleNotes) y otros helpers que no son "notes" — el módulo actúa como contenedor residual de funciones sin agruparse por concepto; no hay entry point visible de "Notes" como feature independienteGestalt — Proximidad (funciones conceptualmente distantes agrupadas en el mismo módulo sin señal visual que las relacione)BajaNo aplica a UX de usuario final directamente — observación de arquitectura para Cael: el nombre del módulo no refleja su contenido real16Checkpoints — feedback de error de proyecto no canónicoEl error de proyecto no canónico (⛔ Proyecto no reconocido) se muestra en el preview del card Y en un toast simultáneamente — dos canales de feedback para el mismo error; el toast desaparece pero el preview permanece, dejando el estado de error visible correctamente; la redundancia del toast puede generar ruido en uso sostenidoNielsen #8 — Estética y minimalismo (dos señales para un error que ya tiene feedback persistente en preview)BajaEliminar el toast de error de proyecto no canónico — el mensaje inline del preview es suficiente y persiste17Densidad — IDP (Item Detail Panel)El IDP carga simultáneamente: badges de tipo/status, progreso, AC vivo, historial de sesiones, notas, botón "Marcar done", botón "Copiar código", botón "Desvincular sesión" y edición inline de AC — 8+ zonas de interacción en un solo panel sin jerarquía visual clara de qué acción es primariaNielsen #8 — Estética y minimalismo · Gestalt — Figura/fondo (sin jerarquía de peso visual entre acciones primarias y secundarias)MediaSeparar acciones primarias (cambiar status, editar AC) de acciones secundarias (historial, notas) con divisor visual claro y pesos tipográficos diferenciados18Densidad — barra de filtros del BacklogLa barra de filtros del Backlog combina: tipo (P/T/R/B), status (pendiente/done/descartado), vistas (Árbol/Kanban/Focus/Planificar), sprints y "Mi vista" en una sola fila sin separación semántica; los filtros de datos y los modos de visualización tienen el mismo peso visual y el usuario no distingue cuáles cambian qué ven y cuáles cambian cómo lo venGestalt — Similitud (filtros de datos y controles de vista tienen el mismo tratamiento visual) · Nielsen #4 — ConsistenciaMediaSeparar con un divisor vertical los controles de dato (tipo, status, sprint) de los controles de vista (árbol, kanban, focus)

Lista preliminar de Rs de experiencia
Título del RPrioridad sugeridaJustificaciónBacklog — agregar CTA visible "+ Nuevo ítem" en toolbar sin depender de CP ni shortcuthighAcción más frecuente en uso sostenido — actualmente requiere conocer CP o shortcutBacklog — status chip inline clickeable en fila colapsada para marcar done sin abrir IDPhighAcción crítica de seguimiento de backlog requiere el mayor recorrido de interacción actualSprint — agregar campos version_target y release_type como obligatorios en formulario de aperturahighBase Rules §6 declara obligatoriedad; UI no los exige — los exports quedan sin metadata claveSesiones — agregar hint contextual bajo textarea de CHECKPOINT explicando qué pegarhighFlujo de registro depende de conocimiento previo del concepto CHECKPOINT — invisible para uso sin onboardingBacklog — agregar selector de sprint como control contextual en IDP sin requerir editor completomediumAsignar sprint a un ítem es acción frecuente en planificación — solo accesible vía editor completoSesiones — highlight automático de sesión recién guardada en historial logmediumFeedback post-guardado no distingue sesión nueva de sesiones existentesSprint — mostrar resumen pre-cierre con ítems pendientes y done antes de confirmar cierremediumCierre sin resumen impide que el usuario evalúe el impacto antes de confirmarIDP — separar acciones primarias de secundarias con jerarquía visual claramedium8+ zonas de interacción sin jerarquía genera carga cognitiva en uso repetidoFiltros Backlog — separar controles de dato de controles de vista con divisor visualmediumMismo tratamiento visual para filtros y modos de vista genera confusión en uso sostenidoMap Generator — agregar descripción de propósito y pre-condición de MAP existente al abrir overlaymediumMódulo más complejo del producto — sin descripción ni contexto de cuándo usarloMap Generator — agregar tooltip en columna "Trasciende" explicando efecto sobre outputmediumLabel sin descripción — el usuario no sabe qué decide al marcar esta columnaCP — agregar hint ⌘K visible en header o menú para descubrir command palettemediumCP es la herramienta de eficiencia central — no descubrible sin explorar menú ⋯CP — actualizar label "Activar / desactivar Modo Focus" para distinguir panel focus vs Top-10mediumLabel ambiguo sobre qué modo activa — amplifica el bug de focus ya documentado en Finn 2bSesiones — agregar micro-labels en fase-bar explicando acción requerida en cada fasemediumFase activa sin texto deja al usuario sin saber qué acción faltaCheckpoints — eliminar toast redundante de error de proyecto no canónicolowPreview inline es suficiente y persiste — toast es ruido en uso sostenido

---CHECKPOINT---
Título: Auditoría UX uso sostenido PP — flujos 1-8 · backlog, sesiones, sprints, CP, map generator, AI notes, checkpoints, densidad
Proyecto: AI Tracker
Rol: UX · Nova
Resumen: Auditoría completa de 8 flujos de uso sostenido. 18 fricciones identificadas: 4 alta, 11 media, 3 baja. Cruzado con Rune Fase 1, Finn Fase 2 (2a-2d) y sesión 3a — 0 duplicados. Fricción #11 (CP focus) confirma impacto UX del bug B documentado por Finn en 2b — no duplicado, perspectiva complementaria.
Archivos: ai-tracker-backlog.js | ai-tracker-session.js | ai-tracker-sprint-project.js | ai-tracker-command-palette.js | ai-tracker-map-generator.js | ai-tracker-ai-notes.js | ai-tracker-checkpoint.js
Contexto: Sesión 3b — auditoría de uso sostenido. Continuación de sesión 3a (primer uso). Fase 3 del ciclo QA/UX de PP.
Bloqueantes: n/a
Aprendizaje: El flujo de backlog tiene su acción más crítica (crear ítem) enterrada en command palette o shortcut, y su acción más frecuente (cambiar status) requiere expansión del IDP. Estos dos patrones son la fricción de mayor impacto en uso repetido — el producto está optimizado para quien ya lo conoce, no para quien lo está adoptando. El Map Generator es el módulo con mayor riesgo de confusión por ausencia de contexto explicativo — es complejo, tiene múltiples outputs y no dice para qué sirve al abrirlo.
CONTEXT-SECTION: n/a
Decisión: 18 fricciones pasan a Cael para conversión en Rs con AC. Fricciones de alta severidad (1, 2, 3, 4) sugieren decisión de Vera: ¿se abren Rs antes del lanzamiento de ASVAB App o se acumulan como deuda de UX de PP?
Próximo paso: Entregar lista a Cael — 15 Rs para priorización. Vera evalúa si las 4 altas bloquean el uso del tracker como herramienta interna antes del lanzamiento de ASVAB App.

---ITEMS---
[
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Backlog — agregar CTA visible '+ Nuevo ítem' en toolbar sin depender de command palette ni shortcut",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Backlog / Affordances",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La toolbar del Backlog incluye un botón '+ Nuevo ítem' visible sin requerir hover ni shortcut",
      "El botón llama openItemEditor(null) directamente — mismo comportamiento que el comando CP",
      "El botón es visible tanto en vista Árbol como en vista Kanban"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Backlog — status chip inline clickeable en fila colapsada para cambiar status sin expandir IDP",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Backlog / Interacción",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El chip de status en la fila colapsada del ítem es clickeable y muestra un dropdown con los valores válidos: pendiente, done, descartado",
      "Al seleccionar un status desde el chip, se llama setItemStatus con el nuevo valor sin abrir el IDP",
      "El chip se actualiza visualmente de inmediato tras el cambio — sin re-render completo del backlog"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sprint — agregar campos version_target y release_type como obligatorios en formulario de apertura",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Sprints",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El formulario de apertura de sprint incluye campos version_target (texto) y release_type (select: Major / Minor / Patch)",
      "El botón de confirmar apertura está deshabilitado hasta que version_target tenga valor",
      "Al cerrar el sprint, los exports incluyen version_target y release_type en los metadatos del sprint"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sesiones — agregar hint contextual bajo textarea de CHECKPOINT explicando qué pegar y por qué",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Sesiones / Onboarding",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Bajo el textarea de cada card de IA hay un hint colapsable con el texto: '¿Qué pego aquí? → El bloque ---CHECKPOINT--- que genera tu IA al cerrar una sesión de trabajo'",
      "El hint está visible por defecto y se colapsa manualmente — no desaparece al hacer focus en el textarea",
      "El hint no interfiere con el área de paste ni con el preview del CHECKPOINT"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Backlog — selector de sprint contextual en IDP sin requerir apertura del editor completo",
    "status": "pendiente",
    "priority": "medium",
    "effort": 2,
    "area": "Backlog / IDP",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El IDP incluye un control de sprint (dropdown o inline editable) que permite asignar o cambiar el sprint del ítem sin abrir openItemEditor",
      "El cambio persiste inmediatamente via saveBacklog() y el IDP se actualiza sin cerrar el panel",
      "El control muestra solo sprints activos y abiertos del proyecto activo"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sesiones — highlight automático de sesión recién guardada en historial log del card",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Sesiones / Feedback",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Al completar savePaste() exitosamente, la sesión recién guardada recibe log-row--highlight automáticamente en _rebuildLogBody",
      "El highlight dura 1800ms — mismo comportamiento que el highlight manual de scrollToLogCard",
      "El highlight solo aplica a la sesión del guardado actual — no a sesiones previas"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sprint — mostrar resumen pre-cierre con ítems pendientes y done antes de confirmar cierre",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Sprints / Feedback",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El modal de confirmación de cierre de sprint muestra: N ítems done, M ítems pendientes que migrarán, effort total completado",
      "Si hay ítems pendientes, el modal los lista con código y título — no solo el conteo",
      "El botón de confirmar cierre está disponible independientemente de si hay pendientes — el resumen es informativo, no bloqueante"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "IDP — separar acciones primarias de secundarias con jerarquía visual y divisor",
    "status": "pendiente",
    "priority": "medium",
    "effort": 2,
    "area": "Backlog / IDP / UX",
    "sprint": "n/a",
    "role": "UX · Nova",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Las acciones primarias del IDP (cambiar status, editar AC) están separadas visualmente de las secundarias (historial, notas, desvincular sesión) mediante un divisor",
      "Las acciones primarias tienen mayor peso visual que las secundarias — no igual tratamiento tipográfico",
      "La sección de historial y notas está colapsada por defecto y se expande manualmente"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Backlog — separar controles de dato (filtros) de controles de vista (modos) con divisor visual en toolbar",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Backlog / Navegación",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La toolbar del Backlog tiene un divisor visual (border o espacio) que separa los controles de dato (tipo P/T/R/B, status, sprint) de los controles de vista (Árbol, Kanban, Focus, Planificar)",
      "Los controles de dato y los de vista no tienen el mismo tratamiento visual — los de vista tienen estilo más neutro o secundario",
      "La separación es visible sin hover — no depende de tooltips"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Map Generator — agregar descripción de propósito y estado del MAP en localStorage al abrir overlay",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Map Generator / Onboarding",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El overlay del Map Generator muestra bajo el encabezado: 'Genera MAP, CONTEXT y BACKLOG actualizados al cierre de sprint'",
      "Si hay un MAP importado en localStorage, el overlay muestra su nombre y versión como estado pre-carga visible antes de la dropzone",
      "El estado del MAP en localStorage se muestra aunque el usuario no haya arrastrado archivos en esta sesión"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Map Generator — agregar tooltip en header de columna 'Trasciende' explicando efecto sobre output",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Map Generator / Affordances",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El header de columna 'Trasciende' tiene title='Incluir esta decisión/aprendizaje en el CONTEXT del siguiente sprint'",
      "El tooltip es visible con hover en desktop — no requiere click"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Command palette — agregar hint ⌘K visible en el header o menú ⋯ para descubrir el CP",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Command Palette / Descubribilidad",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El header de la app incluye un elemento visual (badge, botón o icono) que muestra '⌘K' y abre el command palette al hacer click",
      "El elemento está visible sin requerir hover ni scroll — en el header principal siempre visible",
      "En mobile (si aplica), el elemento abre el CP directamente sin shortcut"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Sesiones — agregar micro-labels en fase-bar explicando acción requerida en cada fase activa",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Sesiones / Feedback",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cada phase-bar-step con clase 'active' muestra un micro-label debajo del punto: 'Pegar' → 'Confirmar' → 'Guardar'",
      "El micro-label no aparece en steps con clase 'done' — solo en el step activo actual",
      "El micro-label cabe en el espacio disponible de la fase-bar sin desbordarse en mobile"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Checkpoints — eliminar toast redundante de error de proyecto no canónico",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Sesiones / Feedback",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El error de proyecto no canónico en parsePaste elimina la llamada a showToast('error', ...) en la validación de CANONICAL_PROJECTS",
      "El mensaje de error en el preview inline se mantiene sin cambio — es el único canal de feedback para este error",
      "El comportamiento bloqueante (botón deshabilitado) no cambia"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: ux-3b-uso-sostenido
    rol: UX · Nova
    items: [pendiente-ID-cta-nuevo-item, pendiente-ID-status-chip-inline, pendiente-ID-sprint-campos-obligatorios, pendiente-ID-hint-textarea-checkpoint]
    archivos: [ai-tracker-backlog.js, ai-tracker-session.js, ai-tracker-sprint-project.js, index.html]
    depende_de: []
---EXECUTION-PLAN-END---