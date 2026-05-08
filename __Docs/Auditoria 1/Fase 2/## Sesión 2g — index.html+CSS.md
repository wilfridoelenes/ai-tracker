## Sesión 2g — index.html + CSS

Informe funcional — Sesión 2g · index.html + CSS
Flujo auditado
AC verificado
Gap de especificación
Bug detectado
Tipo
Pasos reproducibles
H-1. Carga inicial — flash of incorrect theme
No
Sin AC que declare que data-theme inicial debe leer localStorage antes del primer paint
Bug confirmado: <html data-theme="light"> hardcodeado en L2. patchApplyTheme corrige en DOMContentLoaded — paint inicial ocurre con light independientemente del tema guardado.
Mayor
1. Guardar tema dark en localStorage. 2. Recargar página. 3. Observar: flash de tema claro antes de que patchApplyTheme ejecute en DOMContentLoaded.
H-1b. Estrategia defer/async de dependencias
No
Sin AC que declare estrategia de carga por dependencia
Bug confirmado (de 1g): env.js y Supabase SDK sin defer/async — bloqueantes de renderizado. JSZip usa defer. Los 7 módulos de app en L1639-1645 tampoco tienen defer/async. Estrategia inconsistente.
Menor
1. Inspeccionar HEAD. 2. env.js L13 y Supabase L14 — sin defer/async. 3. DevTools Performance: bloqueo de parser en cada carga.
H-2. DOM duplicado — #cp-overlay vs #cmd-palette-overlay
No
Sin AC que declare cuál implementación es la activa
Determinación definitiva: #cp-overlay (L1320) es la implementación activa — contiene #cp-input, #cp-recent, #cp-results que son los IDs que ai-tracker-command-palette.js referencia (confirmado en sesión 2d). #cmd-palette-overlay (L1375) es dead DOM con sus propios estilos en inline <style> (L1748-1754). openCommandPalette() y closeCommandPalette() del botón de header (L110) y del onclick de #cmd-palette-overlay apuntan a funciones distintas — openCommandPalette() abre #cp-overlay vía el módulo JS; closeCommandPalette() en el onclick de #cmd-palette-overlay es la función del módulo legacy que opera sobre #cmd-palette-overlay. Dos funciones con mismo nombre en scope. Riesgo de shadowing.
Crítico
1. Cargar PP. 2. Ctrl+K o botón ⌘ → openCommandPalette() abre #cp-overlay. 3. Inspeccionar #cmd-palette-overlay — presente en DOM con hidden, nunca se activa. 4. Verificar si closeCommandPalette() en línea 1375 opera sobre overlay distinto al que openCommandPalette() abre.
H-3a. Inline script — toggleHeaderSearch
Parcial
—
#backup-badge y #version-pill no existen en DOM (confirmado: grep -n 'id="backup-badge"|id="version-pill"' → 0 resultados). _updateBackupBadge() tiene null guard para badge y vp — no lanza error. Sin efecto observable pero el badge nunca actualiza.
Menor
1. Abrir PP. 2. Agregar datos a localStorage. 3. Observar header — ningún badge visual de backup. #backup-badge no existe en DOM.
H-3b. Inline script — patchApplyTheme
No — (de 1g)
—
Parche en HTML corrige contrato roto en módulo externo. La corrección no debería vivir en HTML inline. Confirmado como deuda de especificación — no nuevo bug.
—
—
H-3c. Inline script — reset-backlog-modal
No
Sin AC que declare separación de lógica de validación del HTML
Bug confirmado: L827-836 — lógica multi-sentencia en oninput inline: comparación de string, toggle de disabled, toggle de clase, textContent — 5 operaciones de DOM en atributo HTML. Viola separación HTML/JS §17.
Mayor
1. Abrir reset modal. 2. Inspeccionar input #reset-backlog-input. 3. oninput contiene lógica JS no trivial — no llama función nombrada. No auditable ni testeable de forma aislada.
H-4. Inline styles — CSS Purity §15
No
—
Tres violaciones confirmadas con código real: (1) L353: #btn-import-backlog style="display:none" en elemento estático. (2) L451: #toolbar style="display:none" en elemento estático. (3) L1693: #gf-pulso style="cursor:pointer" en elemento estático. Las tres son propiedades de presentación en HTML que deben vivir en CSS.
Mayor
1. grep 'style=' index.html → tres coincidencias con propiedades de presentación. 2. Ninguna controlada por clase CSS — violación §15 confirmada.
H-5. Opción tipo 'I' en #item-type select — runtime
No
—
Confirmado en código real: L894-899 — <option value="I">I — Idea</option> (L895) antes de <option value="P">P — Idea</option> (L896). Cuando el usuario selecciona la primera opción "I — Idea" y guarda el ítem, item.type = 'I'. El sistema de numeración (Base Rules §5) no define tipo I. _assignPendingIds en ai-tracker-checkpoint.js marca _invalidType = true para codes con prefijo I-. La opción I es funcional en el editor — produce ítems con tipo inválido sin advertencia al usuario.
Crítico
1. Abrir editor de ítem. 2. Selector muestra I — Idea como primera opción (default). 3. Guardar sin cambiar tipo → item.type = 'I'. 4. _assignPendingIds rechaza el ítem (flag interno sin toast). 5. Downstream: buildBacklogMd, tracker legacy, regex [PTRB] — ítem ignorado o mal clasificado.
CSS-1. Tema — declaración --font-sans / --font-mono
Parcial
—
Hallazgo que corrige 1d: ai-tracker.css L3-6 SÍ declara --font-sans y --font-mono en :root global. El gap reportado en 1d es parcialmente incorrecto para el CSS base. Sin embargo, ai-tracker-extra.css L17214 re-declara --font-sans con !important en bloque macOS Fidelity (:root global, sin scope de plataforma) — sobreescribe globalmente el valor de ai-tracker.css para todos los usuarios, no solo macOS. La re-declaración aplica siempre.
Mayor
1. Cargar PP en Windows/Chrome. 2. Inspeccionar --font-sans en devtools. 3. Valor: -apple-system, BlinkMacSystemFont… (macOS stack) — no 'DM Sans' declarado en ai-tracker.css. El macOS block aplica globalmente.
CSS-1b. Flash de tema — aplicación de data-theme
No
Sin AC que declare orden de aplicación de tema entre HTML y CSS
data-theme="light" hardcodeado en <html> (L2 index.html). :root[data-theme="dark"] en ai-tracker-extra.css L11 y ai-tracker.css L62 definen las vars del tema. Mientras patchApplyTheme no ejecute, todas las vars del tema oscuro son indefinidas para un usuario dark. El CSS necesita el atributo correcto para aplicar las vars. Mismo bug que H-1 — origen confirmado en HTML.
Mayor
Ver H-1.
CSS-2. Responsive — breakpoints 900px/899px y 600px/601px
No
Sin AC para breakpoints canónicos del sistema
Confirmado: @media (max-width: 900px) L12031 y @media (max-width: 899px) L12760 en ai-tracker-extra.css — viewport exacto de 900px tiene un gap de 1px sin estilos de ninguna de las dos. @media (min-width: 601px) y @media (max-width: 600px) en ~28 instancias — viewport exacto de 600px cae en ambos si los navegadores redondean. Sin variables CSS para breakpoints — ~45 instancias hardcodeadas.
Menor
1. Viewport exacto 900px → ningún breakpoint aplica (gap). 2. Viewport exacto 600px → puede aplicar ambos bloques según redondeo del navegador.
CSS-3. color-mix() sin @supports
No
Sin AC que declare soporte mínimo de navegador
175 instancias de color-mix(in srgb, ...) en ambos archivos combinados (14 en ai-tracker.css, 161 en ai-tracker-extra.css). Ninguna wrapped en @supports. Sin fallback. No soportado en Safari < 16.2, Firefox < 113, Chrome < 111. Afecta badges de tipo, sprint headers, sprint-confirm panels, heatmap cells.
Mayor
1. Abrir PP en Safari < 16.2 o Firefox < 113. 2. Inspeccionar badges de tipo de ítem, sprint headers, heatmap — colores de fondo ausentes. Sin fallback visible.
CSS-4. backdrop-filter sin -webkit-backdrop-filter
No
—
3 instancias sin par webkit confirmadas: L662 (#ckpt-panel), L3717 (.quick-note-overlay), L9759 (overlay genérico). Los demás tienen par webkit. Safari < 15.4 no aplica blur en estos elementos.
Menor
1. Abrir PP en Safari < 15.4. 2. #ckpt-panel, modal de nota rápida y overlay genérico — sin efecto blur.
CSS-5. background-attachment: fixed sin override mobile
No
Sin AC que declare comportamiento en mobile
L133 — [data-theme="dark"] body tiene background-attachment: fixed. Sin @media (max-width: ...) que lo desactive. GPU no interpola background-attachment: fixed en iOS/Android — scroll jank garantizado en mobile con tema oscuro.
Mayor
1. Abrir PP en iOS (Safari) o Android con tema dark. 2. Scroll → jank visual pronunciado — background no se mueve con el scroll.


Lista de gaps de AC 2g para Cael
#
Título del gap
Flujo afectado
1
data-theme inicial debe leer localStorage antes del primer paint
H-1: carga inicial — tema
2
Estrategia canónica de carga de scripts (defer/async por tipo de dependencia)
H-1b: HEAD
3
#cmd-palette-overlay — declarar si es dead DOM a eliminar o implementación a activar
H-2: command palette DOM duplicado
4
closeCommandPalette() referenciada en #cmd-palette-overlay — declarar función canónica vs función del módulo activo
H-2: command palette handlers
5
#backup-badge y #version-pill — declarar si deben existir en DOM o si _updateBackupBadge() es dead code
H-3a: inline script
6
Lógica de validación del reset modal debe vivir en función nombrada, no en oninput inline
H-3c: reset modal
7
Opción value="I" en #item-type — declarar si debe eliminarse o si existe intención de soporte
H-5: item editor select
8
--font-sans re-declarado en macOS Fidelity block sin scope de plataforma — ¿apply global intencional?
CSS-1: tipografía
9
Breakpoints canónicos del sistema — declarar valores exactos y fuente única (CSS variables vs hardcode)
CSS-2: responsive
10
Soporte mínimo de navegador para color-mix() — ¿requiere @supports wrapper o se acepta degradación visual?
CSS-3: color
11
background-attachment: fixed en dark body — declarar si debe desactivarse en mobile
CSS-5: scroll mobile


Consolidado de Fase 2
Tabla resumen por sesión
Sesión
Módulo
Críticos
Mayores
Menores
Obs.
Gaps de AC
2a
ai-tracker-backlog.js
1
4
7
0
12
2b
ai-tracker-backlog.js (render/DnD/focus)
0
4
3
1
8
2c (1ª)
ai-tracker-session.js
1
5
4
2
10
2c (2ª)
ai-tracker-session.js + ai-tracker-ai-notes.js
0
5
3
2
8
2c-bis
ai-tracker-ai-notes.js
2
3
4
1
7
2d
ai-tracker-checkpoint.js
1
6
4
0
10
2e
ai-tracker-sprint-project.js
0
5
4
0
11
2f
CP + Map Generator
0
4
4
0
10
2g
index.html + CSS
2
8
4
0
11
TOTAL


7
44
37
6
87

Nota de deduplicación 2c: Los dos bugs críticos de openQuickNote reportados en 2c y 2c-bis fueron reclasificados en 2d — la función existe en ai-tracker-checkpoint.js L6630. Prioridad pendiente de reevaluación por Vera según orden de carga. Contados como críticos en tabla histórica de sus sesiones de origen.

Lista maestra de gaps de AC para Cael — Fase 2 completa (sin duplicados)
Módulo: ai-tracker-backlog.js (2a)
Idempotencia de migración de status en IIFE + loadBacklog
Condición de disparo de saveBacklog en loadBacklog — solo si migrated=true o sanitized>0
Comportamiento cuando _normalizeStatus no está disponible en loadBacklog
Deshacibilidad de corrección doneAt mismatch en _sanitizePendingInClosedSprints
Deshacibilidad del cierre automático del P padre en mergeBacklogFromTG
Aislamiento de closures window._mdiff* entre aperturas de showMergeDiffPanel
Restauración del project filter si loadBacklog falla en el finally de showMergeDiffPanel
Orden de _blogLog y _undoSnapshot en setItemStatus
Exclusión de sprints cerrados en _calcPriority regla effort 1
Límite de carga en _calcRelevanceScore — getAllSessions por ítem
Valor correcto de isLast cuando skipStep2=true en _scmRender
Fuente canónica de _scmState en _scmStep1Html
Módulo: ai-tracker-backlog.js (2b)
Progreso de R con filtros activos — denominador sobre allChildren, no hijos filtrados
desc como campo de render legacy — advertencia o migración a title
Estabilidad de IDs de DOM en _buildChildrenBlock tras mutación de ITEMS
DnD inactivo como estado declarado o criterio de reactivación
Guardia de existencia para openItemEditor
Shortcut Cmd+F — cuál focus mode activa con tab Backlog activo y sin panel
Comportamiento de Esc con ambos focus modes activos simultáneamente
Módulo: ai-tracker-session.js (2c 1ª)
Guard de null en saveSession() cuando getAI(id) devuelve null
Comportamiento del botón Guardar cuando no hay proyectos en _showProjRequiredInPanel
Estado de sesión cuando usuario cancela showMergeDiffPanel (sesión pre-persistida)
getAllSessions invocada sin guard de existencia en exportWeeklySummary
Formatos de fecha válidos en sess.date para _sessInRange
Guard de null en editNotes() cuando getAI(id) devuelve null
openQuickNote() invocada sin guard — dependencia de módulo externo no declarada (reclasificada en 2d — función existe en ai-tracker-checkpoint.js)
CANONICAL_PROJECTS contiene strings deprecados 'Obsidiana Labs' y 'Obsidiana'
Módulo: ai-tracker-session.js + ai-tracker-ai-notes.js (2c 2ª)
Guard de null en saveSession() cuando getAI(id) devuelve null (mismo que #20 — consolidado)
_doSaveSession — newSess guardado antes de confirmación de showMergeDiffPanel
_rebuildLogBody — listener scroll acumulado por render() monkey-patch
_buildLogHeader — ai.color interpolado como atributo sin nombre en pill de IA
exportWeeklySummary — getAllSessions() sin guard (mismo que #23 — consolidado)
deleteAI — verifica sesiones solo en state.projects, no en ai.sessions formato legacy
openQuickNote invocada sin guard (reclasificada — ver #26)
Módulo: ai-tracker-ai-notes.js (2c-bis)
_ieAutofillFromPaste — regex acepta tipo I inválido en ambas rutas (CHECKPOINT line y Markdown)
onSearch — quickNotes no respetan scope de proyecto activo
openItemEditor — campo #item-notes ausente del DOM sin warning
Status no expuesto en editor de ítems — declarar si es read-only intencional
Eliminación de ítems — declarar que vive en módulo externo (scope del editor incompleto)
Límites de resultados de búsqueda (20 notas, 30 sesiones) sin AC de criterio
Módulo: ai-tracker-checkpoint.js (2d)
downloadTemplates invocada sin guard typeof post-diff-confirm
handlePaste / handleInput sin guard en atributos HTML inline
getActiveSprints() — sin AC de qué estados de sprint incluye el retorno
_assignPendingIds — slug collision para ítems sin title/desc
Tipo inválido _invalidType — sin surface al usuario
_isBlocked — dep IDs inexistentes en allSessions
Warning message ---PLAN--- en lugar de ---EXECUTION-PLAN---
openQuickNote — acceso a elementos del modal sin null guard individual
loadPlan / ---PLAN--- legacy — garantía de read-only no verificable desde este módulo
Validación de scope en EXECUTION-PLAN — no verificable desde este módulo
Módulo: ai-tracker-sprint-project.js (2e)
_docPrefix — sin entrada 'Obsidian Labs'→'OL' en _PREFIX_MAP
i.code[0] sin guard — comportamiento con code:null/undefined en contadores export (L455) y estado actual (L46)
Fuente canónica de sprints — state.sprints vs getActiveSprints() por función
Criterio de sprint activo — 'active' vs 'active'||'open' dentro del mismo exportBacklogMd
confirmProjForm — sin AC para nombre duplicado de proyecto
confirmProjForm — sin AC para prefijo duplicado
proj-modal-overlay sin null guard — openProjModal/closeProjModal/openProjPanel/closeProjPanel
SPRINT_DATA_THRESHOLD=23 — sin AC que declare criterio del umbral
Sprint apertura/cierre — confirmOpenSprint, confirmCloseSprint no auditables (módulo no adjunto)
Ctrl+K — sin AC que declare módulo dueño canónico del shortcut
_renderProjList archived toggle — sin AC de separación de lógica JS del innerHTML
Módulo: Command Palette + Map Generator (2f)
action-search-context — sin AC que declare prefijo tab- requerido en switchTab
_buildDynamicCommands IAs — switchTab('tracker') sin prefijo
_buildDynamicCommands proyectos — fuente canónica window.state.projects vs getActiveProject()
Ctrl+K — responsabilidad de módulo sin AC (misma raíz que #60 — consolidado)
_mgBuildPlan — formato del bloque generado (debe ser ---EXECUTION-PLAN---)
_mgLoadFiles — comportamiento con archivo duplicado actualizado
_mgInferStatus — mecanismo canónico de detección del modal
confirmMapGenerator — instrucción al usuario post-warning de sprint cerrado
_mgExportAllZip — historial completo excluido sin AC de criterio
index.html + CSS (2g)
data-theme inicial debe leer localStorage antes del primer paint
Estrategia canónica de carga de scripts (defer/async por tipo)
#cmd-palette-overlay — declarar si es dead DOM a eliminar o implementación a activar
closeCommandPalette() en #cmd-palette-overlay — función canónica vs módulo activo
#backup-badge y #version-pill — declarar si deben existir en DOM
Lógica de validación del reset modal — función nombrada, no oninput inline
Opción value="I" en #item-type — eliminar o declarar soporte
--font-sans re-declarado en macOS Fidelity block sin scope de plataforma
Breakpoints canónicos del sistema — variables CSS vs hardcode
Soporte mínimo de navegador para color-mix() — @supports o degradación aceptada
background-attachment: fixed en dark body — override mobile requerido o no
Total gaps únicos Fase 2: 81 (87 reportados en sesiones — 6 consolidados por duplicación entre sesiones)

Rs sugeridos para Fase 4
Título sugerido
Prioridad
Justificación
Eliminar #cmd-palette-overlay del DOM y unificar en #cp-overlay
high
Dead DOM activo con estilos propios y closeCommandPalette() potencialmente en conflicto — riesgo de shadowing de función que puede romper la CP activa silenciosamente.
AC transversal obligatorio: guard typeof para todas las funciones externas invocadas desde HTML inline o módulos
high
Patrón sistémico confirmado en 6 puntos: openItemEditor, openQuickNote, getAllSessions, downloadTemplates, handlePaste, handleInput — cualquier carga fallida es ReferenceError sin feedback. Un AC general previene recurrencia.
Opción value="I" en #item-type select — eliminar o convertir en alias de P
high
El select muestra I como primera opción (default). Ítems creados con type='I' son rechazados downstream en _assignPendingIds, buildBacklogMd y tracker sin feedback al usuario. Genera corrupción silenciosa de backlog.
Unificar criterio de sprint activo en función canónica — getActiveSprints() como única fuente
high
Triple punto de acceso inconsistente en el mismo flujo de export: _buildCurrentStateMd ('active'), _generateBacklogMd (`'active'
Migración de --font-sans/--font-mono a ai-tracker.css como fuente única — eliminar re-declaración !important en macOS block
high
El macOS Fidelity block re-declara --font-sans con !important sobre :root global — aplica a todos los usuarios, no solo macOS. Rompe el stack tipográfico intencional de ai-tracker.css.
_mgBuildPlan — emitir ---EXECUTION-PLAN--- en lugar de ---PLAN---
high
El Plan generado desde el Generator no es ingerido por el parser activo de PP (_tryIngestPlan falla). El flujo UI de generación de plan está roto end-to-end.
Fix _scmRender — isLast con skipStep2=true
high
Bug crítico de 2a: botón "Cerrar sprint" inaccesible cuando no hay ítems pendientes. Bloquea el flujo de cierre de sprint desde la UI.
newSess push atómico — no persistir hasta confirmación de showMergeDiffPanel
high
Cancelar el panel de diff deja una sesión persistida sin ítems mergeados — estado inconsistente permanente sin señal al usuario.
Fix _docPrefix — agregar entrada 'Obsidian Labs': 'OL' en _PREFIX_MAP
high
Todos los exports del holding generan prefijo 'OB' (legacy). Naming de documentos vivos del holding incorrecto desde el cambio de nombre a Obsidian Labs.
Fix de tema en carga inicial — leer localStorage antes del primer paint para evitar flash
medium
Flash of incorrect theme en cada carga para usuarios con dark mode — degradación visual garantizada.
Migrar bloques <style> inline de index.html a archivos .css
medium
4 bloques <style> en HTML (CP, tracker views, cronómetro/weekly, user chip) — viola CSS Purity §15. Uno tiene comentario explícito de migración pendiente (T-202604-423).
Definir e implementar AC general: toda mutación de ITEMS fuera de setItemStatus() debe llamar _undoSnapshot()
medium
Patrón dominante de 2a: cierre de P padre y _sanitizePendingInClosedSprints mutan estado sin snapshot. Cualquier mutación directa posterior tendrá el mismo gap.
_calcRelevanceScore — cachear getAllSessions() fuera del loop en _recalcAllScores
medium
O(n×m) en hot path: cada cambio de status recalcula sobre todos los ítems × todas las sesiones. Con 200 ítems y 50 sesiones → congelamiento de UI.
Eliminar scripts bloqueantes del HEAD — agregar defer a env.js y Supabase SDK
medium
env.js y Supabase SDK sin defer/async bloquean el parser HTML en cada carga.
Agregar @supports (color-mix: ...) wrapper o fallbacks hardcoded
medium
175 instancias sin soporte en Safari < 16.2 y Firefox < 113 — colores de badges, sprint headers y heatmap desaparecen silenciosamente.
background-attachment: fixed en dark body — desactivar en mobile via @media
medium
Scroll jank garantizado en iOS/Android con tema dark — GPU no interpola background-attachment: fixed.
Breakpoints — declarar valores canónicos como CSS custom properties y resolver gaps 900px/600px
low
~45 instancias hardcodeadas de breakpoints con conflictos en viewports exactos. Mantenimiento por search-replace manual.
Añadir -webkit-backdrop-filter a #ckpt-panel, .quick-note-overlay y overlay genérico (L9759)
low
3 instancias sin par webkit — blur ausente en Safari < 15.4 para el panel de CHECKPOINT, notas rápidas y overlay genérico.


---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2g — index.html + CSS · Cierre de Fase 2
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Sesión 2g cubre 5 flujos de index.html y 5 flujos CSS. Hallazgos nuevos: 2 críticos (DOM duplicado #cp-overlay/#cmd-palette-overlay — #cp-overlay confirmado como activo, #cmd-palette-overlay como dead DOM con riesgo de shadowing de closeCommandPalette(); opción value="I" como primera opción del item-type select — produce ítems con tipo inválido por defecto sin advertencia), 8 mayores, 4 menores. Hallazgo correctivo de 1d: --font-sans y --font-mono SÍ están declarados en :root de ai-tracker.css — el gap real es la re-declaración con !important en el macOS Fidelity block de ai-tracker-extra.css, que aplica globalmente a todos los usuarios. Consolidado de Fase 2 emitido: 9 sesiones, 7 críticos, 44 mayores, 37 menores, 6 observaciones, 81 gaps de AC únicos, 18 Rs sugeridos para Fase 4.
Archivos: index.html | ai-tracker.css | ai-tracker-extra.css | audit-index_html-1g.md | audit-css-1e.md | audit-ai-tracker-extra_css-1d.md | CHECKPOINTs 2a→2f
Contexto: Cierre de Fase 2 — auditoría funcional completa de PP previo a sesión estratégica con Vera
Bloqueantes: 3 bugs críticos con decisión de Vera pendiente: (1) #cmd-palette-overlay — ¿eliminar dead DOM o reactivar? Mientras coexistan, riesgo de shadowing de closeCommandPalette(). (2) Opción value="I" como default en item-type select — produce corrupción silenciosa de backlog en cada ítem creado sin cambiar el selector. (3) _scmRender isLast=3 siempre con skipStep2=true (2a) — botón "Cerrar sprint" inaccesible. Adicionalmente: bug crítico de newSess pre-persistido (2c) y openQuickNote orden de carga (2d) pendientes de evaluación de Vera.
Aprendizaje: Tres patrones sistémicos confirmados en toda la Fase 2: (1) funciones externas sin guard typeof (6 puntos); (2) mutaciones de ITEMS fuera de setItemStatus() sin _undoSnapshot() (merge padre, sanitize, merge diff); (3) listener acumulación sin cleanup (keydown, scroll, ESC en 4 módulos distintos). Los tres requieren AC transversal, no fix caso por caso.
CONTEXT-SECTION: n/a
Decisión: Fase 2 cerrada. 81 gaps de AC documentados para Cael. Bugs a Rune según prioridad. Vera: sesión estratégica de release decision requerida antes de Fase 3.
Próximo paso: 1) Vera: sesión de release decision con consolidado completo — evaluar bugs críticos bloqueantes. 2) Cael: recibir 81 gaps de AC para priorización. 3) Rune: recibir lista de bugs por prioridad con pasos reproducibles. 4) Fase 3 no inicia hasta que Vera apruebe release o declare sprint de fixes.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "#cmd-palette-overlay — dead DOM con closeCommandPalette() potencialmente conflictivo con implementación activa #cp-overlay",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Command Palette · DOM duplicado",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "#cmd-palette-overlay removido del DOM — un único shell de command palette en index.html",
      "closeCommandPalette() referenciada en el overlay eliminado — ningún onclick huérfano en DOM",
      "openCommandPalette() y closeCommandPalette() operan exclusivamente sobre #cp-overlay",
      "Inline <style> block de .cmd-palette-overlay migrado a archivo .css o eliminado si el shell se remueve"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "item-type select — value='I' como primera opción (default): ítems creados sin cambiar selector tienen type='I' inválido",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Item editor · Select de tipo",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La opción value='I' eliminada del select #item-type",
      "Primera opción del select es value='P' — tipo canónico para Ideas según Base Rules §5",
      "Ningún ítem puede crearse con type='I' desde el editor",
      "Verificable: inspeccionar #item-type — 4 opciones: P, T, R, B"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "data-theme='light' hardcodeado en <html>: flash of incorrect theme en cada carga para usuarios con dark mode",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Tema · Carga inicial",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "data-theme en <html> se establece desde localStorage antes del primer paint — vía script inline en <head> antes de las hojas CSS",
      "Usuarios con dark mode guardado no ven flash de tema claro en ninguna carga",
      "patchApplyTheme en DOMContentLoaded puede eliminarse o convertirse en fallback"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "reset-backlog-modal oninput — lógica multi-sentencia de validación en atributo HTML inline, no en función nombrada",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Reset modal · Separación HTML/JS",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "oninput de #reset-backlog-input llama función nombrada (ej: _validateResetInput())",
      "La función vive en un archivo .js — auditable y testeable",
      "grep 'oninput.*getElementById' en index.html → 0 coincidencias"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Tres inline styles en elementos estáticos — violación CSS Purity §15: #btn-import-backlog, #toolbar, #gf-pulso",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CSS Purity · index.html",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L353: #btn-import-backlog sin style='display:none' — visibilidad controlada por clase .hidden o similar en CSS",
      "L451: #toolbar sin style='display:none' — misma regla",
      "L1693: #gf-pulso sin style='cursor:pointer' — cursor definido en .gf-pulso en CSS",
      "grep 'style=' index.html → 0 coincidencias con propiedades de presentación"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "--font-sans re-declarado con !important en macOS Fidelity block sin scope de plataforma — aplica globalmente a todos los usuarios",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CSS · Tipografía global",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La re-declaración de --font-sans en el macOS Fidelity block (L17213-17214 de ai-tracker-extra.css) está condicionada a un selector de plataforma (ej: @supports (-webkit-appearance: none) o @media (-webkit-min-device-pixel-ratio)) — no aplica a :root global",
      "O bien: la declaración se elimina del bloque macOS y --font-sans se gestiona exclusivamente en ai-tracker.css",
      "En Windows/Chrome: --font-sans resuelve a 'DM Sans' — verificable en devtools computed styles"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "color-mix() — 175 instancias sin @supports wrapper ni fallback: colores ausentes en Safari < 16.2 y Firefox < 113",
    "status": "pendiente",
    "priority": "medium",
    "effort": 3,
    "area": "CSS · Compatibilidad cross-browser",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cada uso de color-mix() tiene fallback estático (valor hex o rgba) como propiedad anterior en el mismo bloque",
      "O bien: @supports (color-mix: ()) wrapper en bloques críticos (badges de tipo, sprint headers, heatmap)",
      "En Safari 15: badges de tipo de ítem tienen color de fondo visible"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "background-attachment: fixed en dark body — sin override mobile: scroll jank garantizado en iOS/Android",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "CSS · Performance mobile",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "@media (max-width: 768px): [data-theme='dark'] body { background-attachment: scroll }",
      "En iOS Safari con tema dark: scroll sin jank visual"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "env.js y Supabase SDK en HEAD sin defer/async — bloqueantes de renderizado en cada carga",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Performance · Carga de scripts",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "env.js cargado con defer (o movido a pie de body si requiere disponibilidad inmediata)",
      "Supabase SDK cargado con defer o async según patrón de inicialización",
      "Estrategia de carga consistente entre todas las dependencias del HEAD"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "3 instancias de backdrop-filter sin -webkit-backdrop-filter: #ckpt-panel (L662), .quick-note-overlay (L3717), overlay genérico (L9759)",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CSS · Compatibilidad Safari",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L662 (#ckpt-panel): -webkit-backdrop-filter: blur(12px) agregado inmediatamente después del backdrop-filter",
      "L3717 (.quick-note-overlay): ídem",
      "L9759 (overlay genérico): ídem",
      "grep 'backdrop-filter' en ai-tracker-extra.css: cada instancia tiene par -webkit-backdrop-filter en la línea siguiente"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2g-html-css-cierre-fase2
    rol: QA · Finn
    items: [pendiente-ID-cmd-palette-dead-dom, pendiente-ID-item-type-I-default, pendiente-ID-flash-theme]
    archivos: [index.html, ai-tracker.css, ai-tracker-extra.css]
    depende_de: []
---EXECUTION-PLAN-END---

