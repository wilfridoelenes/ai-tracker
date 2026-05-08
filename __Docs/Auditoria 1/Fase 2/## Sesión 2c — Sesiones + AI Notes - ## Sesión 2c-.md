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

