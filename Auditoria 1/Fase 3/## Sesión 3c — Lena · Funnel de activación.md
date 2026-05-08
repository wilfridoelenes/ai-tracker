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