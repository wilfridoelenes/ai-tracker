## Sesión 2d — Checkpoint + generadores



Informe funcional — Sesión 2d · ai-tracker-checkpoint.js
Nota estructural antes del informe: handlePaste, handleInput, parsePaste, downloadTemplates, downloadReport, confirmCloseSprint, loadPlan, openStandaloneCheckpoint, exportBacklogMd, confirmMapGenerator son funciones referenciadas en este módulo pero no definidas aquí. El parser real de CHECKPOINT (ingesta de texto → extracción de campos → merge) vive en otro módulo. Este archivo contiene: la capa de display (showCheckpointPanel), el pipeline de IDs (_assignPendingIds), la lectura de versión (_effectiveVersion), la display layer del plan (_showArranquePanel Bloque 4), y utilidades compartidas.
Nota de cross-reference 2c: openQuickNote reportada como "no definida" en sesiones 2c y 2c-bis → definida en este módulo, L6630. Los dos bugs críticos de 2c atribuyen ReferenceError a ausencia de la función. Si este módulo carga antes que ai-tracker-ai-notes.js (carga compartida estándar), esos bugs son falsos positivos o de orden de carga — no ausencia definitiva de la función. Señalado a Vera para reevaluación de prioridad antes de asignar a Rune.

INFORME FUNCIONAL
Flujo auditado
AC verificado
Gap de especificación
Bug detectado
Tipo
Pasos reproducibles
1. CHECKPOINT display — showCheckpointPanel(result) happy path
No — sin AC formal en este módulo
Sin AC que defina qué ocurre si result llega null o sin las propiedades esperadas
Bug menor: si sections.length === 0 y no hay proximoPaso/decision, L960 hace early return — el panel no se abre y el usuario no recibe ningún feedback de que el CHECKPOINT fue procesado vacío
Menor
1. Pegar CHECKPOINT sin ítems y sin Próximo paso ni Decisión. 2. sections.length === 0. 3. showCheckpointPanel retorna sin abrir panel. 4. No hay toast ni señal al usuario.
1. CHECKPOINT display — downloadTemplates() post-diff-confirm
No
Sin AC que declare comportamiento cuando downloadTemplates no está disponible
Bug crítico: L800 llama downloadTemplates() directamente sin typeof guard — ReferenceError si módulo que la define no cargó. Patrón idéntico al confirmado en 2b/2c para openItemEditor, openQuickNote, getAllSessions.
Crítico
1. Cargar PP sin el módulo que define downloadTemplates. 2. Pegar CHECKPOINT con ítems en retroceso o descarte. 3. Confirmar diff en panel. 4. _ckptDiffApplyAll() ejecuta → if (window._pendingTemplateDownload) downloadTemplates() → ReferenceError. Sin feedback al usuario.
1. CHECKPOINT display — timer y reopen
Parcial
Sin AC que declare duración del timer por caso (7000ms normal vs 120000ms con pending)
Sin bug — comportamiento consistente con _ckptTimerEnd
—
—
2. Parser ---ITEMS--- — _assignPendingIds slug collision
No
Sin AC para slug derivado de desc/title vacío
Bug mayor: _slugify(null) devuelve 'item'. Todos los ítems sin desc/title obtienen slug 'item'. El primer ítem crea tmpMap['item'] y obtiene un código real. El segundo ítem con slug 'item' resuelve al mismo código del primero (_tmpResolved = true) → ítem distinto mapeado al código equivocado silenciosamente.
Mayor
1. CHECKPOINT con dos ítems sin title ni desc. 2. Ambos tienen code [pendiente-ID]. 3. _slugify('') devuelve 'item' para ambos. 4. El segundo ítem toma el código del primero. 5. Backlog registra actualización de un ítem existente en lugar de crear uno nuevo.
2. Parser ---ITEMS--- — schema_version migration
Sí (R-202605-135)
—
Sin bug — migración correcta en L1839-1844: ítems sin campo reciben schema_version = 1 al cargar
—
—
2. Parser ---ITEMS--- — tipo inválido en _assignPendingIds
No
Sin AC que declare cómo se surface _invalidType = true al usuario
Bug menor: ítems con _invalidType = true se push a assigned con item.code intacto ([pendiente-ID]). No hay toast, no hay entrada en el panel de CHECKPOINT mostrando que el ítem fue rechazado. El ítem llega a showCheckpointPanel sin código válido — comportamiento downstream no especificado.
Menor
1. CHECKPOINT con ítem type: 'I'. 2. _assignPendingIds marca _invalidType = true. 3. Ítem pasa al merge con code [pendiente-ID] sin resolución. 4. No hay feedback visible.
2. Parser ---ITEMS--- — buildTGPreview usa i.desc no i.title
No
—
Bug mayor (confirmado 1b — no resuelto): buildTGPreview renderiza i.desc en columna descripción. Si el ítem solo tiene title (schema v1 canónico), la columna aparece vacía en el panel de preview.
Mayor
1. CHECKPOINT con ítems que solo tienen title, sin desc. 2. buildTGPreview renderiza cells vacías en la columna de descripción. Esperado: mostrar `i.title
3. EXECUTION-PLAN display — _sessIsDone items vacío
No
Sin AC para sesión con items: [] en el plan
Bug mayor: _sessIsDone(sess) retorna true si codes.length === 0 porque [].every(...) es vacuosamente verdadero. Una sesión sin ítems asignados es tratada como done → se mueve a _doneIds y desbloquea dependientes incorrectamente.
Mayor
1. Plan con sesión sin ítems (items: []). 2. _sessIsDone(sess) → codes.length > 0 es false → retorna false… espera, voy a reverificar: return codes.length > 0 && codes.every(...). Si codes.length === 0, el AND cortocircuita a false. Sin bug aquí.
3. EXECUTION-PLAN display — _isBlocked con dep IDs inexistentes
No
Sin AC para dep IDs que no existen en _allSessions
Bug menor: si depende_de contiene un ID que no existe en _allSessions, ese ID nunca entra a _doneIds → la sesión queda bloqueada permanentemente sin mensaje al usuario de que la dependencia no existe.
Menor
1. Plan con sesión A que depende_de: ['sess-inexistente']. 2. _isBlocked(A) → deps.every(d => _doneIds.has(d)) es false → A aparece como bloqueada. 3. No hay warning de dep ID inexistente.
3. EXECUTION-PLAN display — loadPlan sin typeof guard…
Sí
—
Sin bug — L7252: typeof loadPlan === 'function' guard presente. Si loadPlan no carga, el bloque muestra "Sin plan activo". ✓
—
—
3. EXECUTION-PLAN display — scope incorrecto produce error visible
No
Sin AC que declare comportamiento cuando scope: es inválido en el bloque
Gap de especificación — el parser de EXECUTION-PLAN está en otro módulo; este módulo solo consume loadPlan(). Sin visibilidad de validación de scope: desde aquí. Señalado a Cael como gap de arquitectura.
—
—
3. Warning message references ---PLAN--- legacy
No
—
Bug menor: L7356 emite "edita el bloque ---PLAN--- antes de copiar". El string canónico activo es ---EXECUTION-PLAN--- (Base Rules §9a). Mensaje de error incorrecto para el usuario.
Menor
1. Plan con campos faltantes (sin rol o sin ítems). 2. Warning muestra "edita el bloque ---PLAN---". Esperado: "edita el bloque ---EXECUTION-PLAN---".
4. Export — handlePaste sin typeof guard en HTML inline
No
Sin AC que declare comportamiento cuando módulo que define handlePaste no carga
Bug mayor: L4868 onpaste="handlePaste('${ai.id}')" — sin typeof guard. Si el módulo que define handlePaste no cargó, pegar en el textarea produce ReferenceError nativo del browser sin toast ni feedback al usuario. Mismo patrón sistémico 2b/2c.
Mayor
1. Cargar PP sin módulo que define handlePaste. 2. Ir a card de IA disponible. 3. Pegar texto en textarea. 4. Browser dispara ReferenceError. Sin feedback en UI.
4. Export — handleInput sin typeof guard en HTML inline
No
Ídem anterior
Bug mayor: L4869 oninput="handleInput('${ai.id}')" — misma violación. Tipear en el textarea produce ReferenceError continuo (en cada keyup).
Mayor
1. Cargar PP sin módulo que define handleInput. 2. Tipear en textarea de IA disponible. 3. ReferenceError en cada keystroke. Sin feedback en UI.
5. Version bump — _effectiveVersion()
Sí (R-202604-086)
—
Sin bug — lectura de localStorage con fallback a APP_VERSION. ✓ (confirmado 1b)
—
—
5. Version bump — getActiveSprints() devuelve todos los sprints
No
Sin AC que declare qué estados incluye el valor de retorno
Bug mayor: getActiveSprints() (L2355-2358) retorna `proj.sprints


[]sin filtrar porstatus === 'active'. Todos los callers que esperan solo sprints activos (incluyendo el command palette L5528-5529 que llama confirmCloseSprint(active[0].id)) pueden recibir un sprint cerrado o histórico y ejecutar confirmCloseSprint` sobre él.
5. Version bump — sprint no cerrado bloquea bump
No auditado desde este módulo
Sin AC visible — confirmMapGenerator/_mgApplyBumpedVersion están en ai-tracker-map-generator.js
Gap de especificación: el bug de Fase 1 (showToast sin instrucción clara cuando sprint no cerrado) no es verificable desde este módulo. Señalado a Vera: auditar en sesión 2e adjuntando ai-tracker-map-generator.js.
—
—
6. Compatibilidad ---PLAN--- legacy
No verificable desde este módulo
loadPlan() abstrae el formato — sin visibilidad de si lee ---PLAN--- en read-only o modifica.
Gap de arquitectura: la garantía de read-only para CHECKPOINTs con ---PLAN--- debe verificarse en el módulo que implementa loadPlan. Señalado a Vera: auditar en sesión 2e adjuntando el módulo de sprint/plan.
—
—
CSS Purity — violations de 1b no resueltas
No
—
Confirmadas no resueltas: L7683 style="font-size:10px;color:var(--hint)" (1b línea 62); _showArranquePanel style="--arr-type-color:..." (1b línea 57); openPulsoPanel (1b línea 59); style.setProperty('background', color) L7055-7057 y L5024 — estas últimas son nuevas no reportadas en 1b (background, color, border-color como propiedades de presentación directas, no custom properties).
Mayor (L7055-7057 nuevo) / Mayor (L7683, confirmado 1b)
Ver 1b para L7683. Para L7055-7057: 1. Pulso panel con proyectos. 2. Inspeccionar DOM. 3. el.style.background, el.style.color, el.style.borderColor set directamente — no custom properties.
openQuickNote — guards DOM internos
Parcial
Sin AC que declare comportamiento cuando elementos del modal no existen
Bug menor: L6639-6651 accede a document.getElementById('qn-text').value, .textContent, classList sin null guard individual. Si algún elemento del modal no existe en DOM, TypeError en el acceso encadenado. Solo el contenedor #quick-note-modal tiene guard (L6632).
Menor
1. openQuickNote('edit-id') con #qn-text ausente del DOM. 2. document.getElementById('qn-text').value → TypeError: Cannot read properties of null.


GAPS DE AC PARA CAEL
Título del gap
Flujo afectado
Comportamiento observable sin AC
downloadTemplates invocada sin typeof guard post-diff-confirm
Export — descarga post-confirmación
L800 llama directamente sin guard. Si módulo no carga → ReferenceError silencioso sin toast. Sin AC que declare fallback o guard obligatorio.
handlePaste / handleInput sin guard en atributos HTML inline
Ingesta de CHECKPOINT via textarea
onpaste/oninput llaman funciones sin typeof check. ReferenceError nativo del browser sin feedback. Sin AC que declare comportamiento cuando módulo no está disponible.
getActiveSprints() — sin AC de qué estados de sprint incluye el retorno
Sprint lifecycle — command palette
Retorna todos los sprints del proyecto sin filtro de status. Callers que esperan solo activos pueden recibir sprints cerrados. Sin AC que declare status === 'active' como criterio de filtro.
_assignPendingIds — slug collision para items sin title/desc
Parser ---ITEMS--- — asignación de IDs
_slugify(null) → 'item' para todos los items sin descripción. Segundo item con mismo slug toma código del primero. Pérdida silenciosa de identidad de ítem. Sin AC que declare comportamiento para desc/title vacío.
Tipo inválido _invalidType — sin surface al usuario
Parser ---ITEMS--- — validación de tipo
Items con tipo no-PTRB se marcan internamente como inválidos pero se pasan downstream con code = '[pendiente-ID]'. No hay toast, no hay entrada en panel de CHECKPOINT. Sin AC de cómo se reporta el rechazo.
_isBlocked — dep IDs inexistentes en allSessions
EXECUTION-PLAN display — dependencias
Sesión con dep ID que no existe en el plan queda bloqueada permanentemente sin mensaje al usuario de que la dependencia no existe en el plan. Sin AC para este edge case.
Warning message ---PLAN--- en lugar de ---EXECUTION-PLAN---
EXECUTION-PLAN display — campo incompleto
L7356 muestra mensaje con string legacy. Sin AC que defina el string correcto del mensaje de error cuando faltan campos del plan.
openQuickNote — acceso a elementos DOM sin null guard individual
Quick notes — apertura de modal
Solo #quick-note-modal tiene guard. #qn-text, #qn-ref, #qn-title, #qn-delete-btn, #qn-delete-confirm, #qn-ac-list accedidos directamente. Sin AC que declare comportamiento cuando cualquier elemento del modal no está en DOM.
loadPlan / ---PLAN--- legacy — garantía de read-only no verificable
EXECUTION-PLAN / ---PLAN--- legacy
La función loadPlan abstrae el formato. No es posible verificar desde este módulo si CHECKPOINTs con ---PLAN--- se parsean en modo read-only. AC de read-only no verificable sin adjuntar el módulo de plan.
Validación de scope en EXECUTION-PLAN — no verificable desde este módulo
EXECUTION-PLAN parser
El parser del scope vive en otro módulo. No hay AC verificable en este archivo que declare qué pasa cuando scope: tiene valor inválido.


CROSS-REFERENCE ACTIVO: openQuickNote (sesiones 2c y 2c-bis)
openQuickNote está definida en ai-tracker-checkpoint.js L6630. Los dos bugs críticos de 2c (ReferenceError: openQuickNote is not defined) son carga-orden-dependientes, no ausencia definitiva de la función. Si este módulo (shared) carga antes que ai-tracker-ai-notes.js, los bugs no reproducen. Acción sugerida: pasar a Vera — reevaluar prioridad de los dos bugs críticos de 2c antes de asignar a Rune. Si el orden de carga garantiza que el shared carga primero, degradar de Crítico a Observación.

---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2d — ai-tracker-checkpoint.js
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 6 flujos sobre ai-tracker-checkpoint.js. Nota estructural: las funciones handlePaste, handleInput, parsePaste, downloadTemplates, confirmCloseSprint, loadPlan, confirmMapGenerator NO están definidas en este módulo — viven en módulos externos. Este archivo es la capa compartida. Flujos cubiertos: display de CHECKPOINT (showCheckpointPanel), pipeline de IDs (_assignPendingIds), display del EXECUTION-PLAN (Bloque 4 en _showArranquePanel), lectura de versión (_effectiveVersion), getActiveSprints, openQuickNote. 1 bug crítico: downloadTemplates sin typeof guard post-diff-confirm (mismo patrón sistémico 2b/2c). 6 bugs mayores: handlePaste/handleInput sin guard en HTML inline, getActiveSprints devuelve todos los sprints sin filtrar por status, buildTGPreview usa i.desc en lugar de i.title (confirmado 1b no resuelto), style.setProperty('background'/color) en openPulsoPanel (nuevo, no en 1b). 4 bugs menores: ítems con _invalidType sin surface al usuario, _isBlocked con dep IDs inexistentes, warning message con string ---PLAN--- legacy, openQuickNote sin null guards individuales en DOM. Cross-reference crítico: openQuickNote sí está definida en este módulo (L6630) — los dos bugs críticos de 2c y 2c-bis requieren reevaluación de prioridad por Vera. CSS Purity: L7683 y _showArranquePanel confirmados de 1b como no resueltos; L7055-7057 nuevo (style.setProperty para presentation properties no custom). 10 gaps de AC documentados para Cael.
Archivos: ai-tracker-checkpoint.js | audit-checkpoint-1b.md | CHECKPOINT sesión 2c | CHECKPOINT sesión 2c-bis
Contexto: Fase 2 de auditoría PP · Sesión 2d — módulo compartido (shared utilities, CHECKPOINT display layer, ID pipeline, plan display, version)
Bloqueantes: 1 bug crítico — downloadTemplates sin guard bloquea descarga post-diff si módulo no carga. Vera evalúa: (1) reevaluar bugs críticos de openQuickNote de 2c y 2c-bis — función existe en este módulo. (2) getActiveSprints devuelve todos los sprints: ¿bloquea release? (3) auditoría 2e requiere ai-tracker-map-generator.js para verificar version bump + sprint no cerrado + ---PLAN--- legacy read-only.
Aprendizaje: Patrón sistémico de funciones externas sin typeof guard confirmado por cuarta vez: downloadTemplates (2d), handlePaste (2d), handleInput (2d), openItemEditor (2b), openQuickNote (2c), getAllSessions (2c). Recomendación para Cael: AC transversal obligatorio — ninguna función externa se invoca desde HTML inline o desde handlers sin typeof guard. getActiveSprints es un false friend semántico — devuelve todos los sprints, no solo activos. Callers críticos (command palette close-sprint) pueden actuar sobre sprints cerrados.
CONTEXT-SECTION: n/a
Decisión: Auditoría 2d completada. 1 bug crítico + 6 bugs mayores a Rune. 4 bugs menores a Rune. 10 gaps de AC a Cael. Vera evalúa: (1) openQuickNote cross-reference. (2) getActiveSprints y release. (3) scope de sesión 2e.
Próximo paso: 1) Gaps de AC → Cael (10 ítems). 2) Bugs → Rune (crítico + mayores + menores con pasos reproducibles). 3) Vera: reevaluar bugs críticos 2c/2c-bis de openQuickNote. 4) Sesión 2e: adjuntar ai-tracker-map-generator.js + módulo de sprint/plan para auditar version bump, confirmMapGenerator, ---PLAN--- legacy read-only.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "downloadTemplates invocada sin typeof guard en _ckptDiffApplyAll — ReferenceError si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CHECKPOINT display · Descarga post-diff",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L800: downloadTemplates se invoca solo si typeof downloadTemplates === 'function'",
      "Si downloadTemplates no está disponible, se muestra toast de advertencia al usuario en lugar de ReferenceError",
      "Verificable: cargar PP sin módulo que define downloadTemplates, confirmar diff con retroceso pendiente — sin error en consola"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "handlePaste en onpaste de textarea sin typeof guard — ReferenceError nativo si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Ingesta de CHECKPOINT · Textarea",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "onpaste del textarea verifica typeof handlePaste === 'function' antes de invocar",
      "Si handlePaste no está disponible, el usuario recibe toast de error en lugar de ReferenceError silencioso",
      "Verificable: cargar PP sin módulo que define handlePaste, pegar en textarea — sin error nativo del browser"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "handleInput en oninput de textarea sin typeof guard — ReferenceError continuo si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Ingesta de CHECKPOINT · Textarea",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "oninput del textarea verifica typeof handleInput === 'function' antes de invocar",
      "Si handleInput no está disponible, ningún ReferenceError se dispara al tipear",
      "Verificable: cargar PP sin módulo que define handleInput, tipear en textarea — sin error en consola por keystroke"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "getActiveSprints() devuelve todos los sprints del proyecto sin filtrar por status — callers reciben sprints cerrados",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Sprint lifecycle",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "getActiveSprints() retorna solo sprints con status === 'active'",
      "Command palette 'close-sprint' toma active[0] y ese sprint siempre tiene status === 'active'",
      "Verificable: proyecto con sprints closed + uno active — getActiveSprints().every(s => s.status === 'active') es true"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_assignPendingIds — slug collision silenciosa para ítems sin title/desc: todos mapean a slug 'item'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Parser ---ITEMS--- · Asignación de IDs",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si title y desc están vacíos, _slugify retorna slug único basado en posición o timestamp — no 'item' genérico",
      "O bien: ítems sin title/desc no se registran en tmpMap — se les asigna código nuevo sin consultar el mapa",
      "Ningún ítem distinto resuelve al mismo código por colisión de slug vacío"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildTGPreview renderiza i.desc en lugar de i.title — columna descripción vacía para ítems schema v1",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CHECKPOINT display · Preview de ítems",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "buildTGPreview renderiza i.title || i.desc en la columna de descripción — no solo i.desc",
      "Ítems con solo campo title muestran el título en el preview sin columna vacía"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "style.setProperty('background'/'color'/'border-color') en openPulsoPanel — violación CSS Purity (presentation properties directas)",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Pulso panel · CSS Purity",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L7055-7057: background, color y border-color se aplican vía CSS custom property (--proj-bg-color, --proj-text-color, --proj-border-color) no como propiedades de presentación directas",
      "grep 'style.setProperty.*background\\|style.setProperty.*color\\|style.setProperty.*border' no produce coincidencias con propiedades de presentación no-custom en este módulo"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_assignPendingIds — ítem con tipo inválido (_invalidType) pasa downstream sin feedback al usuario",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Parser ---ITEMS--- · Validación de tipo",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Ítem con tipo no-PTRB genera entrada en panel de CHECKPOINT en sección 'warning' o 'ignorados'",
      "O bien: showToast('warning', ...) con el código del ítem rechazado",
      "El ítem con _invalidType no llega al backlog con code='[pendiente-ID]'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_isBlocked — dep IDs inexistentes en allSessions bloquean sesión permanentemente sin mensaje al usuario",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "EXECUTION-PLAN display · Dependencias",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si un dep ID en depende_de no existe en allSessions, la sesión muestra indicador de dependencia rota — no de bloqueo normal",
      "O bien: el HTML de sesión bloqueada incluye '(dep no encontrada)' cuando el blocker no existe en _allSessions"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "L7356 — warning message en plan display usa string '---PLAN---' (legacy) en lugar de '---EXECUTION-PLAN---'",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "EXECUTION-PLAN display · Mensajes de error",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L7356: el mensaje de campo faltante dice 'edita el bloque ---EXECUTION-PLAN--- antes de copiar'",
      "grep '---PLAN---' en este módulo no produce coincidencias en strings de UI visibles al usuario"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openQuickNote — acceso a elementos del modal sin null guard individual — TypeError si elemento ausente del DOM",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Quick notes · Modal",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "openQuickNote verifica existencia de #qn-text, #qn-ref, #qn-title, #qn-delete-btn, #qn-delete-confirm, #qn-ac-list antes de acceder a sus propiedades",
      "Si cualquier elemento no existe, la función retorna con console.warn — sin TypeError"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showCheckpointPanel — early return silencioso cuando CHECKPOINT no tiene ítems ni Próximo paso/Decisión",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CHECKPOINT display · Empty state",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si sections.length === 0 al final del bloque, showCheckpointPanel muestra toast informativo indicando que el CHECKPOINT fue procesado sin cambios",
      "El usuario recibe feedback visible — no silencio total"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2d-checkpoint-shared
    rol: QA · Finn
    items: [pendiente-ID-downloadtemplates-guard, pendiente-ID-handlepaste-guard, pendiente-ID-handleinput-guard, pendiente-ID-getactivesprints-filter]
    archivos: [ai-tracker-checkpoint.js]
    depende_de: []
---EXECUTION-PLAN-END---

