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