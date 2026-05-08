## - Informe final nova, lena PP — Fase 3 (FULL)

---

## Sesión 3a — Nova · Onboarding y navegación principal

Informe de experiencia — Sesión 3a · Primer uso PP
#Pantalla / FlujoFricción detectadaPrincipio violadoSeveridadPropuesta de mejora (una línea)1Primera carga — splashEl splash muestra logo + progress bar + estados de carga técnicos ("↓ Cargando sesiones…") pero ninguna frase que comunique qué es el producto ni para qué sirve. El usuario que abre PP por primera vez ve una animación sin contexto. splash-name tiene clase --hidden y nunca se muestra.Nielsen #1 — Visibilidad del estado del sistema · Nielsen #10 — Ayuda y documentaciónAltaMostrar una tagline estática bajo el logo durante el splash (ej. "Gestiona tus Workers y backlog de proyecto").2Primera carga — transición splash → appAl cerrar el splash (~1.3s), el usuario que no tiene Workers ni proyectos aterriza en el tab Sesiones con el panel central mostrando "←" + "Selecciona un Worker" mientras la sidebar derecha (Workers) puede estar colapsada o vacía. No hay hilo que conecte el fin del splash con la acción esperada.Nielsen #6 — Reconocimiento sobre recuerdo · Gestalt — Proximidad (el empty state no señala el área correcta)AltaAsegurar que el onboarding dispare antes de que el usuario vea el empty state, o sincronizar el timing para que el modal aparezca en el mismo frame que la desaparición del splash.3Primera carga — onboarding modalEl modal de onboarding aparece con texto correcto ("Crea tu primer proyecto / Agrega tu primera IA / Registra tu primera sesión") pero el paso 3 no tiene botón de acción — el usuario no puede completar el flujo en el mismo modal. La instrucción "Pega el bloque CHECKPOINT en el card de la IA" supone que el usuario ya sabe qué es un CHECKPOINT.Nielsen #6 — Reconocimiento · Nielsen #4 — Consistencia (pasos 1 y 2 tienen botón, paso 3 no)MediaAgregar al paso 3 un link o tooltip que explique qué es un CHECKPOINT, o enlazar a un ejemplo visible.4Orientación — sidebar derecha como navegación primariaEl sidebar "Notificaciones" (label estático en HTML, corregido a "Centro de notificaciones" por JS) contiene Workers que son el punto de entrada a la funcionalidad principal. El nombre del sidebar no comunica que ahí están los Workers. Un usuario nuevo lee "notificaciones" y asume contenido secundario, no la navegación primaria del producto.Nielsen #2 — Coincidencia entre sistema y mundo realAltaRenombrar el sidebar a "Workers" o "Workers / Radar" para que el contenedor refleje su contenido principal.5Orientación — ícono ← en empty state de SesionesEl empty state de la columna central dice "Selecciona un Worker" con un ícono "←" que apunta a la izquierda. Los Workers están en el sidebar derecho. La flecha contradice la instrucción textual "panel derecho" en el hint.Nielsen #1 — Visibilidad · Gestalt — Continuidad (la dirección no guía al objetivo)MediaCambiar el ícono de "←" a "→" para alinear con la ubicación real del sidebar de Workers.6Orientación — tab "Documentos" contiene BacklogEl tab principal se llama "🗃 Documentos" pero al entrar, el sub-tab activo por defecto es "Backlog" y el sidebar interno también dice "Documentos". El usuario que busca el Backlog no tiene señal en el tab principal de que ahí vive. Hay dos capas de "Documentos" superpuestas que ocultan el contenido real.Nielsen #2 — Coincidencia sistema/mundo · Nielsen #8 — Estética y minimalismo (label genérico)MediaRenombrar el tab principal de "Documentos" a "Backlog" — el nombre del contenido más importante es el que orienta mejor.7Navegación — menú ⋯ como cajón de sastreEl menú "⋯" agrupa en un mismo desplegable: Backup, Importar backup, Reporte global, auto-descarga, Descargar templates, Command palette, Atajos, Changelog, Notificaciones, Tema, Sync, Migrar Firebase → Supabase, Purgar sesiones. 14 opciones sin separación semántica entre frecuentes y peligrosas (solo una <hr> antes de "Purgar").Fitts — el menú es el único punto de acceso para acciones críticas y utilidades dispares · Nielsen #8 — Estética y minimalismoMediaSeparar el menú en al menos dos agrupaciones visuales claras: acciones de sesión frecuentes (backup, reporte) vs configuración (tema, sync, atajos).8Navegación — botón ›/‹ del sidebar colapsadoEl HTML incluye <button class="radar-sidebar-expand-btn">›</button> pero no tiene reglas CSS propias (el comentario en CSS dice "eliminado — el strip cumple esta función"). El botón existe en el DOM sin estilos, potencialmente visible como texto plano "›" sin contexto. El strip de 14px es el mecanismo real pero carece de label visible.Nielsen #1 — Visibilidad · Nielsen #4 — Consistencia (dos mecanismos para la misma acción, uno sin estilo)MediaEliminar el radar-sidebar-expand-btn del HTML o añadir los estilos que le corresponden; mantener solo un mecanismo de expansión.9Affordances — botón "+" en sidebar = Nuevo Worker, sin labelEl botón "+" en el header del sidebar tiene title="Nuevo Worker" pero ningún label visible. En el contexto del sidebar "Centro de notificaciones", un "+" sin label es ambiguo — el usuario no sabe si agrega una notificación, un worker, o configura el sidebar.Nielsen #6 — Reconocimiento sobre recuerdo · Nielsen #2 — Coincidencia sistema/mundoMediaAñadir un label visible "Nuevo Worker" al botón o cambiar el ícono a uno que combine acción y entidad (ej. "＋ Worker").10Affordances — toolbar de Backlog: 6 botones de vista sin estado claroLa toolbar del Backlog tiene 6 botones de vista: Sprints, ⊞ Árbol, ⬛ Kanban, 🎯 Focus, Mi vista, 📅 Planificar. Los botones "Sprints" y "⊞ Árbol" aparecen con clase active por defecto simultáneamente. No hay señal visual clara de que son toggles independientes vs mutuamente excluyentes.Nielsen #1 — Visibilidad · Gestalt — Figura/Fondo (dos botones activos del mismo peso sin diferenciación de relación)MediaSeparar visualmente los modos de agrupación (Sprints) de los modos de vista (Árbol, Kanban, Kanban, Focus) con un divisor, dejando claro cuáles son ortogonales y cuáles son exclusivos.11Estados vacíos — Backlog sin proyecto activoCuando no hay proyecto activo, el Backlog muestra "Selecciona un proyecto" con botón "📁 Seleccionar proyecto". El botón llama openProjPanel() pero el panel de proyectos no es visible en este tab — el usuario hace click y el panel aparece sobre el Backlog como overlay sin contexto de dónde estaba ni cómo volver. Si no hay proyectos, el CTA "＋ Crear proyecto" abre openProjModal(false) — flujo correcto, pero los dos estados vacíos usan iconos distintos (📁 vs 🗂) sin razón visual aparente.Nielsen #3 — Control y libertad del usuario · Nielsen #4 — ConsistenciaBajaUsar el mismo ícono de proyecto en ambos empty states y asegurar que el panel de proyectos se abre con feedback de retorno al Backlog.12Estados vacíos — Backlog vacío (post-reset)Cuando ITEMS está vacío y hay datos en localStorage, el estado vacío dice "El Backlog se actualiza automáticamente vía CHECKPOINT" — instrucción correcta pero sin ningún CTA. El usuario no tiene acción disponible. Si el usuario no sabe qué es un CHECKPOINT, este estado es un callejón sin salida.Nielsen #9 — Ayuda a reconocer, diagnosticar y recuperarse de errores · Nielsen #10 — Ayuda y documentaciónBajaAgregar un link secundario "¿Cómo funciona el CHECKPOINT?" o un enlace al sub-tab Plan que explique el flujo.

---CHECKPOINT---
Título: Auditoría UX primer uso PP — flujos 1-5 · onboarding, orientación, navegación, affordances, estados vacíos
Proyecto: AI Tracker
Rol: UX · Nova
Resumen: Auditoría completa de los 5 flujos de primer uso. 12 fricciones identificadas: 2 alta, 8 media, 2 baja. Cruzado con Rune Fase 1 y Finn Fase 2 (2a-2d) — sin duplicados. 0 overlaps con bugs técnicos ya documentados.
Archivos: index.html | ai-tracker.css | ai-tracker-extra.css | ai-tracker-backlog.js | ai-tracker-checkpoint.js | ai-tracker-sprint-project.js
Contexto: Sesión 3a — auditoría de primer uso. Fase 3 del ciclo QA/UX de PP.
Bloqueantes: n/a
Aprendizaje: El sidebar "Centro de notificaciones" es el punto de entrada principal al producto (Workers) pero su nombre y comportamiento collapsed lo presentan como contenido secundario. Esta disonancia es el riesgo de orientación más alto del primer uso — un usuario que no encuentra los Workers no puede usar el producto. El ícono ← en el empty state amplifica el problema.
CONTEXT-SECTION: n/a
Decisión: 12 fricciones pasan a Cael (PO) para evaluación de prioridad y apertura de Rs. Fricciones de alta severidad (1, 2, 4) sugieren decisión de Vera: ¿se abren Rs antes del lanzamiento o post-lanzamiento como deuda de UX?
Próximo paso: Entregar informe a Cael — 12 fricciones para conversión en Rs con AC. Vera evalúa si las 2 altas (sidebar naming + splash) bloquean release.

---ITEMS---
[
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Splash — agregar tagline estática visible durante carga para comunicar propósito del producto",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Onboarding",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El splash muestra una línea de texto descriptiva del producto bajo el logo durante toda la duración de la carga",
      "La tagline es visible antes de que el progress bar inicie — no aparece solo al final",
      "El texto no es un estado de carga técnico — es una descripción del producto en lenguaje del usuario"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sidebar derecho — renombrar 'Centro de notificaciones' a label que refleje Workers como contenido principal",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Navegación / Orientación",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El título del sidebar refleja Workers como contenido primario (ej. 'Workers' o 'Workers · Radar')",
      "El cambio aplica tanto al label estático en HTML como al string dinámico asignado por JS en _buildRadarSidebarHTML",
      "Las notificaciones mantienen su badge en el header sin requerir que el nombre del sidebar diga 'notificaciones'"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Empty state Sesiones — corregir ícono ← a → para alinear con ubicación real del sidebar derecho",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Orientación",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El tracker-detail-empty-icon muestra '→' en lugar de '←'",
      "El hint 'Elige un Worker del panel derecho' se mantiene sin cambio — la dirección del ícono y el texto quedan alineados"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Tab principal — renombrar 'Documentos' a 'Backlog' para reflejar el contenido de mayor relevancia",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Navegación",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El tab-btn con id tab-btn-backlog muestra 'Backlog' como label visible — no 'Documentos'",
      "El tooltip del tab (title=) se actualiza para reflejar el nuevo nombre y el contenido completo del tab",
      "El sub-tab interno de Backlog mantiene su label 'Backlog' sin colisión visual con el tab padre"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Eliminar radar-sidebar-expand-btn del HTML o restaurar sus estilos CSS",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Navegación / Affordances",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El elemento #radar-sidebar-expand no existe en el DOM, o bien tiene estilos CSS definidos que lo hacen visualmente coherente con el resto del sistema",
      "Existe un único mecanismo de expansión del sidebar colapsado — no dos elementos con la misma función"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Botón '+' del sidebar de Workers — agregar label visible o cambiar ícono para comunicar acción 'Nuevo Worker'",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Affordances",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El botón de agregar Worker en el sidebar muestra su acción sin depender solo del tooltip (title=)",
      "La acción es distinguible del pin btn y del collapse btn en el mismo header sin necesidad de hover"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: ux-3a-primer-uso
    rol: UX · Nova
    items: [pendiente-ID-splash-tagline, pendiente-ID-sidebar-rename, pendiente-ID-empty-state-arrow, pendiente-ID-tab-rename, pendiente-ID-expand-btn, pendiente-ID-plus-btn-label]
    archivos: [index.html, ai-tracker.css, ai-tracker-extra.css, ai-tracker-sprint-project.js, ai-tracker-checkpoint.js]
    depende_de: []
---EXECUTION-PLAN-END---

---

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

---

## Sesión 3c — Lena · Funnel de activación

nforme de hallazgos de conversión — Auditoría de activación PP · Sesión 3c
Momento del funnelComportamiento observado en el producto realHipótesis de impacto en conversión/retenciónAcción sugerida1. Primer contacto — primeros 2 minLa splash screen muestra "AI Tracker" con logo y barra de progreso. El header dice "AI Tracker v3.2.6". El tab activo de entrada es "🗂 Sesiones". Con estado vacío: grid de workers vacío sin onboarding visible. No hay pantalla de bienvenida, tooltip de inicio ni copy que explique qué hace PP. El sidebar derecho de "Notificaciones" aparece colapsado o sin contenido.El founder entiende que esto es un tracker de sesiones de IA — pero no sabe qué hacer primero ni en qué orden. Probabilidad alta de cierre en 60–90 seg si llega sin contexto previo. El nombre "AI Tracker" no comunica el valor diferencial del producto.Agregar empty state orientado a acción en el grid del tab Sesiones: tres pasos concretos (1. crear worker, 2. crear proyecto, 3. registrar sesión). Sin este estado, el founder ve un lienzo en blanco sin fricción hacia la primera acción.2. Primera acción de valor — crear ítem en backlogEl flujo mínimo para registrar un ítem en el backlog desde cero: (1) abrir tab Documentos, (2) detectar que el backlog está vacío, (3) ir al editor de ítems (openItemEditor — función en módulo externo sin guardia, bug 2b confirmado por Finn), (4) completar formulario con título + tipo + effort obligatorio, (5) guardar. Adicionalmente, crear el ítem via CHECKPOINT (flujo canónico) requiere: tener sesión creada → pegar CHECKPOINT en textarea → aplicar → item aparece en backlog. El flujo CHECKPOINT requiere que exista un proyecto activo (si no hay proyecto, el panel de guardado se bloquea con banner de error — código confirmado en ai-tracker-session.js L1138).El flujo hasta el primer ítem de backlog requiere al menos 2 prerequisitos implícitos: worker creado + proyecto activo. Sin estos, el flujo de guardado de sesión falla o bloquea. El costo de setup no está comunicado al inicio — el founder lo descubre cuando ya está en medio del flujo. Bug de openItemEditor sin guardia (Finn 2b) añade riesgo de fallo silencioso en el camino alternativo.Exponer el prerequisito de worker + proyecto al inicio del onboarding empty state. No bloquear silenciosamente — si el founder intenta guardar una sesión sin proyecto, el flujo ya lo maneja (banner inline) pero no hay educación previa.2b. Primera acción de valor — abrir sesiónEl flujo de apertura de sesión en ai-tracker-session.js requiere: (1) seleccionar worker de la lista (que debe existir), (2) ingresar hora de inicio (campo validado — acepta formato libre y normaliza), (3) escribir título, (4) guardar. El campo hora tiene interpretación inteligente (1234 → 12:34) con display de feedback inline. Si no hay proyecto activo, el guardado bloquea con panel inline de selección de proyecto.La UX del campo hora es un momento de deleite potencial — la interpretación inteligente reduce fricción real. Sin embargo, si el worker no existe, el founder llega a un grid vacío sin CTA claro de "crear worker". La cadena no es autoexplicativa.Cuando el grid de workers está vacío, el CTA "Nuevo Worker" del sidebar debe ser el elemento más visible. Actualmente el botón "+" existe en el sidebar header pero no hay un empty state que lo apunte.2c. Primera acción de valor — búsqueda via command paletteCommand palette accesible via ⌘K (ai-tracker-sprint-project.js L630) o botón en menú ⋯. Funciona desde cualquier tab. La búsqueda global en header (expandida por defecto) tiene scope de sesiones + workers + notas + backlog + proyectos + contexto. Con estado vacío, la búsqueda no produce resultados pero tampoco orienta al usuario.La búsqueda es el atajo de poder — pero solo genera valor cuando hay datos. Con estado vacío es una no-acción. No penaliza la activación directamente, pero tampoco la acelera.Sin acción prioritaria en este punto — la búsqueda escala naturalmente con uso. El empty state global es el momento de intervención correcto.3. Puntos de abandonoPunto A: Tab Documentos → subtab Backlog vacío → sin CTA de importación visible al primer vistazo. El botón de importar backlog existe (#backlog-file-input) pero está en área de acción secundaria. Punto B: Tab Sesiones vacío → sin ruta clara de creación de worker. Punto C: Tab Proyectos vacío → empty state en renderProjPanel() dice "Sin proyectos — crea uno abajo" pero el formulario de creación está en la misma vista. Punto D (bug 2b Finn): si openItemEditor falla silenciosamente (módulo externo no cargado), el founder hace click en "Editar" y nada ocurre — sin feedback, abandono por frustración. Punto E: Tab Analytics vacío → el empty state sí existe y es orientado (muestra pasos concretos: crear IA, proyecto, registrar sesión).Punto D es el riesgo más alto de abandono por fricción técnica no visible. Puntos A y B son abandono por desorientación. El empty state de Analytics es el único que educa activamente — es el benchmark interno del producto para los demás tabs.(1) Extender el patrón de empty state de Analytics a los tabs Sesiones y Documentos. (2) El bug de openItemEditor sin guardia (Finn 2b) debe priorizarse como bloqueante de activación — es el único punto de abandono causado por error silencioso.4. Retención tempranaEl tab Analytics tiene heatmap de actividad (patrón GitHub), KPIs con comparativa de período anterior, forecast de sprints, distribución horaria con insight de hora pico. El header muestra proyecto activo y prefijo. La sugerencia de proyecto ("Sugerencia: [nombre] — sin actividad esta semana") aparece en el tab Proyectos cuando hay datos. El sidebar de notificaciones muestra estado de workers con countdown de reset. La sesión de resumen semanal (T-202605-448) existe como modal exportable.PP tiene elementos de retención robustos — pero todos son post-datos. En estado vacío o con 1–2 sesiones, ninguno de estos elementos está activo. El forecast requiere 2 sprints cerrados con effort. El heatmap requiere sesiones con fecha. El founder que llega por primera vez no ve ninguno de estos elementos en sus primeros 2 minutos. La retención temprana depende enteramente de si el founder completa el setup antes de que la fatiga lo haga cerrar.Activar un elemento de retención simbólico en el estado vacío — por ejemplo, mostrar el heatmap vacío con un "Tu primer sprint empieza aquí" o una barra de progreso de onboarding (x de 3 pasos completados). El producto tiene retención sólida en estado maduro pero el puente desde cero hasta "ver valor" no está construido.5. Fricción de setup implícitoSetup mínimo requerido antes de que PP funcione bien: (1) crear al menos un worker (sin worker no hay sesiones), (2) crear al menos un proyecto (sin proyecto el guardado de sesión bloquea), (3) seleccionar proyecto activo como filtro (ai-tracker-sprint-project.js L648: auto-selección del primer proyecto activo al init — existe, reduce fricción), (4) importar o crear primer ítem de backlog para que el tab Documentos tenga contenido. Adicionalmente: Supabase auth es opcional pero sin ella los datos son solo locales — el chip de usuario #user-chip está hidden por defecto. El CANONICAL_PROJECTS en ai-tracker-session.js L4 incluye 'Obsidiana' (string deprecado) y 'Obsidiana Labs' no aparece — desalineado con OL-CONTEXT V1.3 que define 'Obsidian Labs'.El setup de 4 pasos no está declarado en ningún lugar visible del producto. El founder que llega sin documentación adecuada no sabe cuántos pasos hay ni qué le falta para desbloquear las features principales. El tiempo hasta primer valor percibido es mínimo 5–7 minutos si el founder es eficiente, más si explora sin guía. La desalineación de CANONICAL_PROJECTS ('Obsidiana' vs 'Obsidian Labs') puede causar validación incorrecta de proyectos pegados en CHECKPOINTs futuros.(1) Hacer visible el checklist de setup: 4 pasos con estado de completitud. Puede ser un banner dismissable o una sección del tab Proyectos. (2) Actualizar CANONICAL_PROJECTS en ai-tracker-session.js para reflejar el naming canónico de OL-CONTEXT V1.3: 'Obsidian Labs' reemplaza 'Obsidiana' / 'Obsidiana Labs'. Emitir como B o T para Rune.

---CHECKPOINT---
Título: Auditoría de activación PP · Sesión 3c — funnel de primer uso
Proyecto: AI Tracker
Rol: GW · Lena
Resumen: Auditoría de conversión y retención temprana sobre producto real. 5 momentos del funnel cubiertos. Hallazgos principales: ausencia de empty state orientado a acción en tabs críticos (Sesiones, Documentos), cadena de setup implícita de 4 pasos sin comunicación visible, un punto de abandono causado por bug técnico ya documentado por Finn (openItemEditor sin guardia — 2b), y desalineación de CANONICAL_PROJECTS con naming canónico actual. Tab Analytics es el único con empty state educativo — es el benchmark interno.
Archivos: n/a — auditoría de producto, sin archivos generados
Contexto: Fase 3 de auditoría PP. Lena audita funnel de activación desde perspectiva de conversión y retención. Fase 1 (Rune) y Fase 2 (Finn) completadas y cruzadas en los puntos de abandono.
Bloqueantes: n/a
Aprendizaje: El producto tiene retención sólida en estado maduro (heatmap, forecast, KPIs comparativos, sugerencia de proyecto) pero el puente desde estado vacío hasta "ver valor" no está construido. El patrón de empty state de Analytics es reutilizable como template para los demás tabs. Bug de openItemEditor sin guardia (Finn 2b) es el único punto de abandono causado por error silencioso — debe priorizarse como bloqueante de activación antes del primer uso externo.
CONTEXT-SECTION: n/a
Decisión: Tres acciones con impacto directo en activación identificadas: (1) empty state orientado a acción en tabs Sesiones y Documentos, (2) checklist de setup visible de 4 pasos, (3) corrección de CANONICAL_PROJECTS. Bug de openItemEditor sin guardia referenciado desde Finn 2b — no duplicado, solo priorizado como bloqueante de activación.
Próximo paso: Pasar hallazgos a Cael para especificación de Rs de onboarding. CANONICAL_PROJECTS desalineado pasa como T a Rune — es corrección de 1 línea sin ambigüedad de AC.

---ITEMS---
[
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Empty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referencia",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Onboarding / Activación",
    "sprint": "n/a",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Tab Sesiones con estado vacío muestra CTA explícito hacia 'Nuevo Worker' y 'Nuevo Proyecto'",
      "Tab Documentos / Backlog vacío muestra CTA de importación y creación de ítem",
      "El empty state de ambos tabs comunica el prerequisito de setup (worker + proyecto) antes de que el founder lo descubra por error",
      "Patrón visual consistente con el empty state existente en tab Analytics"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Actualizar CANONICAL_PROJECTS en ai-tracker-session.js — 'Obsidiana' → 'Obsidian Labs' según OL-CONTEXT V1.3",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Datos / Validación",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL_PROJECTS en ai-tracker-session.js L4 contiene 'Obsidian Labs' como string canónico válido",
      "'Obsidiana' puede mantenerse como legacy o eliminarse — decisión del founder antes de implementar",
      "La validación de proyecto en parsePaste() acepta 'Obsidian Labs' sin error"
    ]
  },
  {
    "type": "P",
    "code": "[pendiente-ID]",
    "title": "Checklist de setup visible — 4 pasos con estado de completitud para activación de primer uso",
    "status": "pendiente",
    "priority": "medium",
    "effort": 2,
    "area": "Onboarding / Activación",
    "sprint": "n/a",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": []
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: lena-3c-funnel-activacion
    rol: GW · Lena
    items: [pendiente-ID-empty-state, pendiente-ID-canonical-projects, pendiente-ID-checklist-setup]
    archivos: []
    depende_de: []
---EXECUTION-PLAN-END---


---

## Sesión 3d — Lena · Hipótesis de conversión y Rs preliminares
Suficiente contexto cruzado. Ejecutando sesión 3d.

Tabla de hipótesis — if/then/because
#HipótesisHallazgo de origenMétrica de validaciónH1Si el tab Sesiones con estado vacío muestra un empty state con CTA explícito hacia "Nuevo Worker" y "Nuevo Proyecto", entonces el founder completa el setup inicial sin abandonar el tab, porque el costo cognitivo de descubrir el prerequisito por error es el principal driver de cierre temprano3c · Punto B + Finn 2b (openItemEditor sin guardia)% de founders que crean su primer worker dentro de los primeros 3 minutos de sesiónH2Si el bug de openItemEditor sin guardia de módulo externo es corregido con un fallback visible (error inline, no silencio), entonces el founder no abandona el flujo de creación de ítem por click sin respuesta, porque el error silencioso es el único punto de abandono causado por fallo técnico —no por desorientación— y no tiene señal observable para el usuarioFinn 2b · 3c Punto DReducción de eventos "click en Editar → sin apertura de modal" — detectable en analytics si hay instrumentación del eventoH3Si CANONICAL_PROJECTS en ai-tracker-session.js incluye 'Obsidian Labs' como string válido, entonces los CHECKPOINTs futuros con Proyecto: Obsidian Labs pasan validación sin error de parse, porque el string canónico vigente del holding fue actualizado en OL-CONTEXT V1.3 y el validador usa el array anterior con 'Obsidiana'3c · Punto 5 · Lena + ai-tracker-session.js L4Cero errores de validación en parsePaste() para CHECKPOINTs con Proyecto: Obsidian LabsH4Si el mapa CANONICAL en ai-tracker-checkpoint.js L55–57 es poblado con los prefijos reales del ecosistema (OL, AS, CM, AI), entonces el header muestra el prefijo correcto por proyecto activo, porque actualmente el fallback .slice(0,2) produce prefijos arbitrarios que no corresponden a ninguno de los strings canónicos definidos en Base Rules §3Rune 1b · _updateHeaderProjectLabel()El header muestra AI · para AI Tracker, AS · para ASVAB App — verificable visualmenteH5Si se agrega un checklist de setup visible de 4 pasos con estado de completitud (worker creado / proyecto creado / primer ítem en backlog / primera sesión guardada), entonces el tiempo hasta primer valor percibido se reduce de 5–7 min a menos de 3 min, porque el founder sabe exactamente cuántos pasos faltan y cuál es el siguiente — eliminando la exploración sin guía3c · Punto 5 · fricción de setup implícitoTiempo promedio entre primera apertura y primera sesión guardada con proyecto activoH6Si _hasStaleSuggestion() en ai-tracker-checkpoint.js compara contra 'pendiente' (schema canónico) en lugar de 'en-progreso' (legacy), entonces las sugerencias de workers con ítems bloqueados disparan correctamente, porque con el schema actual el filtro nunca activa — los workers con trabajo real no generan alerta de seguimientoRune 1b · _hasStaleSuggestion() severidad altaSugerencias de worker aparecen en sidebar cuando hay ítems pendiente con >3 días sin sesiónH7Si _offlineQueuePush() deduplica por type + projId en lugar de solo type, entonces dos proyectos con writes pendientes simultáneos no se sobreescriben, porque la lógica actual last-write-wins por entry.type descarta el write del primer proyecto cuando el segundo encola — pérdida silenciosa de datos en contexto multi-proyectoRune 1b · _offlineQueuePush() severidad altaCero pérdidas de writes pendientes en escenario con 2+ proyectos activos y conexión intermitente

Lista de Rs de conversión — priorizados por impacto
Título del RPrioridadJustificaciónCorregir openItemEditor sin guardia — fallback visible cuando módulo externo no está disponiblehighÚnico punto de abandono por error técnico silencioso. Click sin respuesta = pérdida de confianza irrecuperable en primer usoEmpty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referenciahighMayor driver de desorientación en primer uso. Ruta de creación de worker invisible con estado vacíoActualizar CANONICAL_PROJECTS → 'Obsidian Labs' en ai-tracker-session.jshighBug de validación en flujo canónico de trabajo (parsePaste). Effort 1 — corrección de una línea. Sin esta corrección, CHECKPOINTs producidos hoy fallan en producciónPoblar mapa CANONICAL en ai-tracker-checkpoint.js con prefijos reales del ecosistemamediumEl header muestra prefijos incorrectos para todos los proyectos. Daña la legibilidad del contexto activo. Effort 1Corregir _hasStaleSuggestion() — comparar contra schema canónico 'pendiente'mediumEl sistema de sugerencias de seguimiento de workers nunca activa. Retención temprana comprometida — el founder no recibe señales de workers con trabajo bloqueadoChecklist de setup visible — 4 pasos con estado de completitudmediumReduce tiempo hasta primer valor percibido. Effort 2. Depende de empty state (R anterior) para coherencia visualCorregir _offlineQueuePush() — deduplicación por type + projIdmediumPérdida silenciosa de writes en multi-proyecto. Riesgo de integridad de datos. No bloquea activación pero sí retención post-setup

---CHECKPOINT---
Título: Consolidación de hallazgos 3c — hipótesis de conversión y Rs para Fase 4
Proyecto: AI Tracker
Rol: GW · Lena
Resumen: 7 hipótesis if/then/because formuladas desde hallazgos de 3c cruzados con bugs críticos de Rune (Fase 1) y Finn (Fase 2). 7 Rs de conversión priorizados por impacto en activación y retención temprana. H2 (openItemEditor sin guardia) identificada como hipótesis de mayor riesgo por ser el único punto de abandono causado por error técnico silencioso. H3 (CANONICAL_PROJECTS desalineado) identificada como bloqueante de flujo canónico — impacto operativo inmediato, no solo de onboarding.
Archivos: n/a — sesión de consolidación, sin archivos generados
Contexto: Sesión 3d de auditoría PP. Consolida 3c sin re-auditar. Hipótesis formuladas con cruce explícito de bugs de Fase 1 (Rune) y Fase 2 (Finn) donde el bug bloquea directamente una conversión o señal de retención.
Bloqueantes: n/a
Aprendizaje: Los bugs de severidad alta con impacto en conversión (openItemEditor, _hasStaleSuggestion, _offlineQueuePush) no son deuda técnica diferible — afectan señales que el producto usa para retener al founder y proteger integridad de datos. El sistema de sugerencias de workers nunca ha funcionado con el schema canónico actual.
CONTEXT-SECTION: n/a
Decisión: 7 Rs de conversión listos para especificación con Cael. Orden de entrada a especificación sugerido: (1) openItemEditor sin guardia, (2) CANONICAL_PROJECTS, (3) empty state Sesiones/Documentos, (4) mapa CANONICAL prefijos, (5) _hasStaleSuggestion schema, (6) checklist setup, (7) _offlineQueuePush deduplicación.
Próximo paso: Pasar lista de Rs a Cael para especificación completa — Fase 1 del Protocolo de Especificación. Rs de Effort 1 (CANONICAL_PROJECTS, mapa CANONICAL) pueden especificarse sin consulta a Nova. Rs que tocan UI (empty state, checklist) requieren consulta a Nova en Fase 1.

---ITEMS---
[
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Corregir openItemEditor sin guardia — fallback visible cuando módulo externo no disponible",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Activación / Estabilidad",
    "sprint": "n/a",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": []
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Empty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referencia",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Onboarding / Activación",
    "sprint": "n/a",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": []
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Actualizar CANONICAL_PROJECTS en ai-tracker-session.js — 'Obsidiana' → 'Obsidian Labs'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Datos / Validación",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL_PROJECTS contiene 'Obsidian Labs' como string válido",
      "parsePaste() acepta 'Obsidian Labs' sin error de validación",
      "Decisión del founder sobre mantener o eliminar 'Obsidiana' como legacy documentada antes de implementar"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Poblar mapa CANONICAL en ai-tracker-checkpoint.js con prefijos reales del ecosistema (OL, AS, CM, AI)",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "UI / Header",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL['Obsidian Labs'] = 'OL'",
      "CANONICAL['ASVAB App'] = 'AS'",
      "CANONICAL['Content Manager'] = 'CM'",
      "CANONICAL['AI Tracker'] = 'AI'",
      "Header muestra prefijo canónico correcto para cada proyecto activo — sin fallback .slice(0,2)"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Corregir _hasStaleSuggestion() — comparar contra 'pendiente' en lugar de 'en-progreso' (schema legacy)",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Retención / Workers",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La función compara status del ítem contra 'pendiente' (schema canónico vigente)",
      "Sugerencia de worker dispara cuando hay ítems con status 'pendiente' y >3 días sin sesión registrada",
      "Verificar que no hay otras comparaciones contra 'en-progreso' en el mismo módulo"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Checklist de setup visible — 4 pasos con estado de completitud para activación de primer uso",
    "status": "pendiente",
    "priority": "medium",
    "effort": 2,
    "area": "Onboarding / Activación",
    "sprint": "n/a",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": []
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Corregir _offlineQueuePush() — deduplicación por type + projId en lugar de solo type",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Datos / Integridad",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La deduplicación en _offlineQueuePush usa type + projId como clave compuesta",
      "Dos proyectos distintos con writes pendientes del mismo tipo no se sobreescriben",
      "Comportamiento verificable con 2+ proyectos activos y conexión deshabilitada"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: lena-3d-consolidacion-hipotesis
    rol: GW · Lena
    items: [pendiente-ID-openitemeditor, pendiente-ID-empty-state-sesiones-docs, pendiente-ID-canonical-projects]
    archivos: []
    depende_de: []
---EXECUTION-PLAN-END---


---

## Sesión 3e — Nova + Lena · Consolidación y lista de Rs para Fase 4

1. Lista consolidada de Rs — deduplicados y priorizados
#TítuloEjecutaPrioridadJustificaciónOrigen1Corregir openItemEditor sin guardia — fallback visible cuando módulo externo no disponibleFS · RunehighÚnico punto de abandono por error técnico silencioso — click sin respuesta destruye confianza en primer usoconversión (Finn 2b · Lena 3c/3d)2Actualizar CANONICAL_PROJECTS → 'Obsidian Labs' en ai-tracker-session.jsFS · RunehighBug de validación en flujo canónico activo hoy — CHECKPOINTs con naming vigente fallan en parsePaste()conversión (Lena 3c/3d)3Sidebar derecho — renombrar a label que refleje Workers como contenido principalFS · RunehighWorkers es el punto de entrada principal al producto — nombre "Centro de notificaciones" lo presenta como secundario; fricción de orientación más alta del primer usoexperiencia (Nova 3a #4)4Splash — agregar tagline estática visible durante cargaFS · RunehighSin contexto de qué es el producto, el founder que llega sin briefing cierra en <90sexperiencia (Nova 3a #1)5Empty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referenciaFS · Rune + UX · NovahighFusión 3a #2 + 3b #1 + 3c punto B/D + 3d H1 — mayor driver de desorientación en primer uso Y en activación; sin CTA explícito hacia Worker/Proyecto, el founder no completa el setupambos6Sprint — agregar version_target y release_type como obligatorios en formulario de aperturaFS · RunehighBase Rules §6 los declara obligatorios — UI no los exige; exports quedan sin metadata claveexperiencia (Nova 3b #7)7Sesiones — agregar hint contextual bajo textarea de CHECKPOINT explicando qué pegarFS · RunehighFlujo de registro depende de conocimiento previo del concepto CHECKPOINT — invisible para primer uso sin onboardingexperiencia (Nova 3b #4)8Backlog — agregar CTA visible '+ Nuevo ítem' en toolbarFS · RunehighAcción más frecuente en uso sostenido enterrada en CP/shortcut — sin descubribilidad en primer uso activa el mismo abandono que 3c punto Aambos9Backlog — status chip inline clickeable en fila colapsada para cambiar status sin abrir IDPFS · RunehighAcción más frecuente de seguimiento requiere el mayor recorrido de interacción; crítico para uso sostenidoexperiencia (Nova 3b #2)10Poblar mapa CANONICAL en ai-tracker-checkpoint.js con prefijos reales (OL, AS, CM, AI)FS · RunemediumHeader muestra prefijos arbitrarios para todos los proyectos — daña legibilidad del contexto activoconversión (Lena 3d H4)11Corregir _hasStaleSuggestion() — comparar contra 'pendiente' en lugar de 'en-progreso'FS · RunemediumSistema de sugerencias de workers nunca activa con schema canónico — retención temprana comprometidaconversión (Lena 3d H6)12Checklist de setup visible — 4 pasos con estado de completitudFS · Rune + UX · NovamediumFusión 3c punto 5 + 3d H5 — cadena de 4 prerequisitos implícitos sin comunicación visible; reduce tiempo hasta primer valor percibidoambos13Corregir _offlineQueuePush() — deduplicación por type + projIdFS · RunemediumPérdida silenciosa de writes en multi-proyecto — riesgo de integridad de datos post-setupconversión (Lena 3d H7)14Backlog — selector de sprint como control contextual en IDP sin requerir editor completoFS · RunemediumAsignar sprint es acción frecuente de planificación — solo accesible vía editor completoexperiencia (Nova 3b #3)15Sprint — mostrar resumen pre-cierre con ítems pendientes y done antes de confirmarFS · RunemediumCierre sin resumen impide evaluar impacto — riesgo de pérdida de ítems no visibleexperiencia (Nova 3b #8)16Empty state Sesiones — corregir ícono ← a → para alinear con ubicación del sidebarFS · RunemediumFusión 3a #5 — la flecha contradice la instrucción textual; amplifica la desorientación del sidebar mal nombradoexperiencia (Nova 3a #5)17Tab principal — renombrar 'Documentos' a 'Backlog'FS · RunemediumEl contenido más relevante del tab no está en su nombre; el usuario que busca el Backlog no tiene señalexperiencia (Nova 3a #6)18IDP — separar acciones primarias de secundarias con jerarquía visual claraUX · Nova + FS · Runemedium8+ zonas de interacción sin jerarquía genera carga cognitiva en uso repetidoexperiencia (Nova 3b #17)19Filtros Backlog — separar controles de dato de controles de vista con divisor visualFS · RunemediumFiltros y modos de vista con mismo tratamiento visual — el usuario no distingue qué cambia cada controlexperiencia (Nova 3b #18)20Map Generator — descripción de propósito y pre-condición al abrir overlayFS · RunemediumMódulo más complejo del producto — sin contexto de propósito ni cuándo usarlo en el flujo de sprintexperiencia (Nova 3b #12/#13)21Sesiones — highlight automático de sesión recién guardada en historialFS · RunemediumFeedback post-guardado no distingue sesión nueva de sesiones anterioresexperiencia (Nova 3b #5)22Sesiones — micro-labels en fase-bar con acción requerida por faseFS · RunemediumFase activa sin texto — el usuario no sabe qué acción falta para avanzarexperiencia (Nova 3b #6)23CP — agregar hint ⌘K visible en headerFS · RunemediumCP no descubrible sin explorar menú ⋯ — herramienta de eficiencia central invisibleexperiencia (Nova 3b #9)24CP — actualizar label 'Modo Focus' para distinguir panel focus vs Top-10FS · RunemediumLabel ambiguo amplifica bug de focus documentado por Finn 2bexperiencia (Nova 3b #11)25Botón '+' sidebar Workers — agregar label visibleFS · RunemediumAcción de crear Worker ambigua en contexto de sidebar mal nombrado — fusión con #3 en impacto, independiente en soluciónexperiencia (Nova 3a #9)26Menú ⋯ — separar acciones frecuentes de configuración y acciones peligrosasFS · Runemedium14 opciones sin agrupación semántica — acciones críticas y utilitarias al mismo nivel visualexperiencia (Nova 3a #7)27Map Generator — tooltip en columna 'Trasciende'FS · RunemediumLabel sin descripción — el usuario no sabe qué decide al marcarexperiencia (Nova 3b #14)28Eliminar radar-sidebar-expand-btn del HTML o restaurar sus estilosFS · RunemediumElemento en DOM sin estilos — dos mecanismos de expansión del sidebar, uno sin tratamiento visualexperiencia (Nova 3a #8)29Onboarding modal paso 3 — agregar link/tooltip explicando qué es un CHECKPOINTFS · RunelowPaso 3 sin botón de acción y con concepto no explicado — parcialmente cubierto por #7 (hint textarea); impacto residual en onboarding modalexperiencia (Nova 3a #3)30Checkpoints — eliminar toast redundante de error de proyecto no canónicoFS · RunelowPreview inline persiste — toast es ruido en uso sostenidoexperiencia (Nova 3b #16)
Nota: R#2 y R#30 tienen dependencia directa — si CANONICAL_PROJECTS se actualiza correctamente (#2), el toast de error (#30) se verá menos. Implementar #2 primero.

2. Rs que requieren paso por Cael antes de Rune
RPor qué necesita AC antes de ejecutar#5 — Empty state Sesiones + DocumentosEffort 2, toca UI en dos tabs distintos con comportamientos diferenciados; Nova debe aportar restricciones en Fase 1 antes de que Cael cierre AC#12 — Checklist de setup visibleEffort 2, toca UI; los 4 pasos y su lógica de completitud (qué condición activa cada check) no están especificados — Cael define comportamiento, Nova aporta restricciones#18 — IDP jerarquía visualToca UI con impacto en layout — Nova debe aportar restricciones de Fase 1 antes de que Cael cierre AC; hay riesgo de scope creep si se especifica sin criterio de experiencia#1 — openItemEditor sin guardiaAC vacíos en 3d — Cael debe especificar qué muestra el fallback (mensaje, estado, acción disponible) antes de que Rune implemente#6 — Sprint version_target + release_type obligatoriosToca UI del modal de apertura de sprint — Nova debe confirmar restricciones de campos obligatorios en el formulario (validación inline, comportamiento de error)
Rs con AC completos en CHECKPOINTs de origen que pueden pasar directo a Rune sin re-especificación: #2, #3 (parcial — AC en 3a), #4 (AC en 3a), #8 (AC en 3b), #9 (AC en 3b), #11, #13, #16, #28, #30.

---CHECKPOINT---
Título: Consolidación 3e — lista única de Rs para Fase 4 · Nova + Lena
Proyecto: AI Tracker
Rol: UX · Nova
Resumen: 30 Rs consolidados desde sesiones 3a (12 fricciones), 3b (18 fricciones), 3c (5 momentos de funnel) y 3d (7 hipótesis). Deduplicación aplicada: R#5 fusiona 3a #2 + 3b #1 + 3c B/D + 3d H1 (mismo problema de empty state orientado a acción). Sin flotantes. 9 Rs high, 19 medium, 2 low. Ejecutor declarado por R. 5 Rs requieren paso por Cael antes de Rune.
Archivos: n/a — sesión de consolidación, sin archivos generados
Contexto: Sesión 3e de auditoría PP — consolidación final de Fase 3 antes de apertura de Fase 4 (especificación con Cael + implementación con Rune).
Bloqueantes: n/a
Aprendizaje: El mayor punto de fusión entre experiencia y conversión es el empty state — Nova lo detectó como fricción de orientación alta, Lena lo confirmó como driver primario de abandono en activación. Es el R con más evidencia cruzada del ciclo. Los Rs de conversión de Lena que tocan bugs técnicos (openItemEditor, _hasStaleSuggestion, _offlineQueuePush) no son deuda diferible — afectan señales de retención y protección de datos activos hoy.
CONTEXT-SECTION: n/a
Decisión: 30 Rs listos para Fase 4. Orden de entrada a especificación sugerido por prioridad: (1) openItemEditor guardia, (2) CANONICAL_PROJECTS, (3) sidebar rename + splash tagline, (4) empty state Sesiones/Documentos, (5) sprint campos obligatorios, (6) hint textarea CHECKPOINT, (7) CTA Backlog + status chip inline. Rs Effort 1 con AC completos pueden pasar directo a Rune sin re-especificación de Cael.
Próximo paso: Pasar lista a Vera para auditoría pre-sprint de Fase 4. Vera evalúa qué Rs entran al próximo sprint vs deuda de UX diferible.

---ITEMS---
[]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: consolidacion-3e-nova-lena
    rol: UX · Nova
    items: []
    archivos: []
    depende_de: [ux-3a-primer-uso, ux-3b-uso-sostenido, lena-3c-funnel-activacion, lena-3d-consolidacion-hipotesis]
---EXECUTION-PLAN-END---


---
