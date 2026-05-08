# PP-BACKLOG-nuevo.md
<!-- Versión: 1.1 | Última actualización: 2026-05-08 | Backlog consolidado AI Tracker — Fase 4 Reset -->

## Meta

Backlog limpio de AI Tracker post-reset del ecosistema. Generado en Fase 4 por Cael sobre outputs directos de:
- Fase 2: Finn (auditoría funcional — sesiones 2a a 2g)
- Fase 3: Nova (sesión 3a — onboarding y navegación), Lena (sesiones 3c/3d — funnel y conversión), consolidación Nova + Lena (sesión 3e — 30 Rs priorizados)

**Nota sobre Fase 1:** El informe técnico de Rune (Fase 1) no estuvo accesible en esta sesión. Los bugs que Finn confirma como hallazgos de Fase 1 están incorporados donde corresponde — identificados explícitamente. El MAP de AI Tracker no se incluye en este backlog — se genera desde archivos reales al cierre de sprint.

**Criterio de inclusión:** Solo ítems con evidencia directa de las auditorías. Ningún ítem del historial acumulado de PP-S-24 fue heredado sin validación — el historial viejo se descarta en su totalidad en el reset.

---

## Estado al cierre

| Sprint | Estado |
|---|---|
| PP-S-01 a PP-S-24 | Historial — reseteado |
| PP-S-25 | Sprint de reset — cerrado al completar Fase 4 |
| Versión activa | v3.4.3 |

---

## Ítems pendientes — Backlog nuevo

### Cluster A — Bugs críticos (bloquean release)

```json
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_scmRender() — isLast siempre 3 con skipStep2=true: botón Cerrar sprint inaccesible desde la UI",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Cierre de sprint",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Con skipStep2=true, isLast es true cuando step === 2 (último paso efectivo)",
      "El botón 'Cerrar sprint' aparece en el último paso efectivo independientemente de si skipStep2 es true o false",
      "El paso 3 no renderiza contenido cuando skipStep2=true",
      "Verificable: iniciar cierre de sprint sin ítems pendientes — el botón 'Cerrar sprint' es visible en paso 2"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "#cmd-palette-overlay — dead DOM con closeCommandPalette() conflictivo con implementación activa #cp-overlay",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Command Palette · DOM duplicado",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "#cmd-palette-overlay removido del DOM — un único shell de command palette en index.html",
      "closeCommandPalette() referenciada en el overlay eliminado — ningún onclick huérfano en DOM",
      "openCommandPalette() y closeCommandPalette() operan exclusivamente sobre #cp-overlay",
      "Inline <style> block de .cmd-palette-overlay migrado a archivo .css o eliminado"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La opción value='I' eliminada del select #item-type",
      "Primera opción del select es value='P' — tipo canónico para Ideas según Base Rules §5",
      "Ningún ítem puede crearse con type='I' desde el editor",
      "Verificable: inspeccionar #item-type — 4 opciones: P, T, R, B — sin opción I"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "newSess push a sessions[] antes de showMergeDiffPanel — sesión persiste si usuario cancela el panel",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Guardado de sesión",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "newSess no se persiste en activeProj.sessions hasta que el usuario confirma el panel MergeDiff",
      "Si el usuario cancela MergeDiff, activeProj.sessions no contiene la sesión nueva",
      "El flujo de guardado es atómico: o persiste completamente (sesión + ítems mergeados) o no persiste nada",
      "Si showMergeDiffPanel no está disponible (fallback directo), el comportamiento actual se mantiene"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openQuickNote no definida en módulo — ReferenceError al click en resultado de búsqueda de nota y en panel de proyecto",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Búsqueda global · Notas",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Click en resultado de quickNote en panel de búsqueda abre la nota sin ReferenceError",
      "Click en proj-note-row en panel de proyecto activa nota sin ReferenceError",
      "openQuickNote está definida o importada en todos los módulos que la invocan",
      "Verificable: buscar término que matchee una nota, click en resultado — sin error en consola"
    ]
  }
]
```

### Cluster B — Bugs mayores (impacto en flujos core)

```json
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_normalizeStatus — fallo silencioso en loadBacklog si función no disponible",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si _normalizeStatus no está disponible al ejecutar loadBacklog(), se emite error visible al usuario (toast o console.error explícito)",
      "La carga no continúa silenciosamente con status sin normalizar"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "mergeBacklogFromTG — cierre automático P padre sin _undoSnapshot()",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Merge de CHECKPOINT",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El cierre automático del P padre llama _undoSnapshot() antes de mutar status",
      "Después de aplicar merge con cierre de padre, undoBacklog() revierte el estado del padre correctamente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_sanitizePendingInClosedSprints segunda pasada — corrección doneAt mismatch sin _undoSnapshot()",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si la segunda pasada de sanitize modifica al menos un ítem, se registra _undoSnapshot() antes de las mutaciones",
      "El resultado de la corrección es deshacible via undoBacklog()"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_calcRelevanceScore — getAllSessions() sin caché, O(n×m) en hot path de setItemStatus()",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Cambio de status · Performance",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "getAllSessions() se llama una vez por ciclo de _recalcAllScores(), no una vez por ítem",
      "Con 200 ítems pendientes y 50 sesiones, setItemStatus() completa sin bloqueo visible de UI (< 16ms)"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showMergeDiffPanel — project filter puede quedar modificado si loadBacklog falla en finally",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Merge de CHECKPOINT",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si loadBacklog() lanza dentro del finally, el project filter se restaura al valor previo antes de propagar el error",
      "El usuario ve feedback de error si la restauración falla"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildChildrenBlock — cIdx por ITEMS.indexOf capturado al render: IDs de DOM desfasados tras mutación sin re-render",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Render de ítems",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Los IDs de DOM de hijos (ibody-*, ciarrow-*, code-badge-*) se generan desde item.code, no desde ITEMS.indexOf(child)",
      "toggleItemExpand invocado desde un hijo apunta al ítem correcto independientemente de mutaciones previas de ITEMS"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openItemEditor invocada en HTML inline sin guardia typeof — falla silenciosa si módulo externo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Item editor",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Todas las llamadas inline a openItemEditor están precedidas de guardia typeof openItemEditor === 'function'",
      "Si la guardia falla (módulo no disponible): el botón 'Editar' muestra toast de error con texto 'No se pudo abrir el editor — recarga la página'",
      "Si la guardia pasa (módulo disponible): comportamiento actual sin cambio — openItemEditor se invoca normalmente",
      "El toast de error usa el sistema de toasts existente del producto — no introduce mecanismo nuevo",
      "Verificable: comentar la carga del módulo externo en index.html → click en 'Editar' → toast visible, sin error JS silencioso en consola"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_attachBacklogDnD — drag handle visible para ítems con sprint pero DnD nunca se activa",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Drag & drop",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El drag handle ⠿ solo se renderiza si DnD está efectivamente activo para ese ítem",
      "O bien: DnD se reactiva bajo la condición correcta y el handle refleja el estado real"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Shortcut Cmd+F llama toggleFocusMode (panel focus) no toggleBacklogFocusMode (Top-10) — sin efecto visual con panel cerrado",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Focus mode",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Con tab Backlog activo y sin panel abierto, Cmd+F activa el Focus Top-10 (_backlogFocusMode) con cambio visual inmediato en la lista",
      "Con panel abierto, Cmd+F activa el focus mode del panel (_focusModeActive) — comportamiento actual se mantiene"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL_PROJECTS contiene únicamente strings canónicos activos: 'Obsidian Labs', 'ASVAB App', 'Content Manager', 'AI Tracker'",
      "CHECKPOINTs con 'Proyecto: Obsidiana Labs' o 'Proyecto: Obsidiana' son rechazados con mensaje de proyecto no reconocido",
      "Decisión del founder sobre legacy compatibility documentada antes de implementar"
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
    "sprint": "PP-S-26",
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
    "title": "tracker legacy — regex [PITRB] incluye tipo 'I' inexistente en registro de actividad",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Registro de actividad",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regex de extracción de tipo de código acepta solo [PTRB] — sin 'I'",
      "Ítems con code que no matchea [PTRB]-YYYYMM-NNN no incrementan ningún contador válido"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "buildBacklogMd lee item.title como campo canónico, con fallback a item.desc para compatibilidad legacy",
      "Ningún ítem genera '### code · undefined' en el reporte generado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogMd — ítems con code [pendiente-ID] caen en byType['['] (undefined) y se omiten silenciosamente",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Resumen semanal",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "buildBacklogMd incluye todos los ítems independientemente del formato de su code",
      "Ítems con code '[pendiente-ID]' aparecen en sección 'Sin código asignado' del reporte"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildLogHeader — ai.color interpolado como atributo sin nombre en button de pill de IA",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Log de sesiones",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El color de IA se aplica al pill vía CSS custom property o atributo data-color, no interpolado directamente como atributo sin nombre",
      "Inspección del DOM: ningún button.log-ai-pill tiene atributos con formato #rrggbb sin nombre"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_ieAutofillFromPaste — regex [PTRBI] acepta tipo I inválido en autofill de editor",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Editor de ítems · Autofill",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regex de autofill en _ieAutofillFromPaste acepta solo tipos [PTRB] — sin I",
      "La regex mdHeaderRe acepta solo prefijos [PTRB] en códigos reales",
      "Ningún ítem se crea con type='I' desde el editor"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cuando scope = 'Proyecto activo', noteMatches filtra state.quickNotes por proyecto activo",
      "Cuando scope = 'Todos los proyectos', noteMatches muestra todas las notas sin filtro de proyecto",
      "Comportamiento de scope en notas es consistente con el de sesiones y proyectos en la misma función"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "deleteAI — verifica sesiones solo en state.projects; IAs con sesiones en ai.sessions formato legacy se eliminan sin confirmación",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Gestión de IAs",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "confirmClear(id) verifica sesiones tanto en state.projects como en ai.sessions (formato legacy v2)",
      "Si hay sesiones en cualquiera de las dos fuentes, el modal de confirmación se muestra antes de eliminar"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "downloadTemplates invocada sin typeof guard en _ckptDiffApplyAll — ReferenceError si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CHECKPOINT display · Descarga post-diff",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L800: downloadTemplates se invoca solo si typeof downloadTemplates === 'function'",
      "Si downloadTemplates no está disponible, se muestra toast de advertencia al usuario"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "handlePaste / handleInput en textarea sin typeof guard — ReferenceError nativo si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Ingesta de CHECKPOINT · Textarea",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "onpaste y oninput del textarea verifican typeof handlePaste/handleInput === 'function' antes de invocar",
      "Si las funciones no están disponibles, el usuario recibe toast de error en lugar de ReferenceError"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "getActiveSprints() retorna solo sprints con status === 'active'",
      "Command palette 'close-sprint' toma active[0] y ese sprint siempre tiene status === 'active'"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si title y desc están vacíos, _slugify retorna slug único basado en posición o timestamp — no 'item' genérico",
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
    "sprint": "PP-S-26",
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
    "title": "_docPrefix — 'Obsidian Labs' no en _PREFIX_MAP: fallback produce 'OB' en lugar de 'OL'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Export · Prefix de documentos vivos",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_PREFIX_MAP contiene entrada 'Obsidian Labs': 'OL'",
      "Entrada 'Obsidiana': 'OB' removida del mapa",
      "Proyecto con name='Obsidian Labs': _docPrefix() retorna 'OL'",
      "Verificable: crear proyecto 'Obsidian Labs', exportBacklogMd() → filename comienza con 'OL-BACKLOG_...'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "i.code[0] sin guard en _generateBacklogMd L455 y _buildCurrentStateMd L46 — TypeError si item.code es null",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Export · Contadores",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L455 y L46: i.code verificado antes de acceder a i.code[0]",
      "Si algún ítem tiene code:null, el forEach lo salta silenciosamente — sin TypeError, sin interrupción del export"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Criterio canónico de sprint activo unificado en una sola constante o función",
      "Misma exportación: Estado actual y filtro generacional reflejan el mismo sprint activo"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Un único listener de Ctrl+K en el documento — el módulo dueño lo registra; el otro elimina su listener",
      "Ctrl+K produce siempre el mismo resultado independiente del orden de carga de módulos"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "action-search-context y _cpSearchContext — switchTab('backlog') sin prefijo 'tab-': navegación puede fallar silenciosamente",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Command Palette · Navegación",
    "sprint": "PP-S-26",
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
    "title": "_mgBuildPlan — emite '---PLAN---' / '---PLAN-END---' (legacy): incompatible con parser activo de PP",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Map Generator · Generación de Plan",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L589: bloque emitido comienza con '---EXECUTION-PLAN---'",
      "L603: bloque cierra con '---EXECUTION-PLAN-END---'",
      "Campo 'scope: sprint' incluido en el bloque generado",
      "_tryIngestPlan recibe el bloque y lo ingesta sin toast de warning"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_mgInferStatus — tres checks inconsistentes para detectar modal activo: pueden contradecirse",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Map Generator · Inferencia de estado",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Un único mecanismo canónico para detectar visibilidad del modal #close-sprint-modal",
      "Si el modal está oculto visualmente, _mgInferStatus no devuelve 'closing'",
      "Verificable: modal con aria-hidden='true' y sin clase 'modal--open' → openMapGenerator() → botón Generar habilitado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "data-theme='light' hardcodeado en <html>: flash of incorrect theme en carga para usuarios con dark mode",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Tema · Carga inicial",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "data-theme en <html> se establece desde localStorage antes del primer paint — vía script inline en <head>",
      "Usuarios con dark mode guardado no ven flash de tema claro en ninguna carga"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "reset-backlog-modal oninput — lógica multi-sentencia de validación en atributo HTML inline",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Reset modal · Separación HTML/JS",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "oninput de #reset-backlog-input llama función nombrada",
      "La función vive en un archivo .js — auditable y testeable"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Tres inline styles en elementos estáticos — violación CSS Purity §15",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CSS Purity · index.html",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "#btn-import-backlog sin style='display:none' — visibilidad controlada por clase CSS",
      "#toolbar sin style='display:none' — misma regla",
      "#gf-pulso sin style='cursor:pointer' — cursor definido en CSS"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "--font-sans re-declarado con !important en macOS Fidelity block sin scope de plataforma — aplica globalmente",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CSS · Tipografía global",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La re-declaración de --font-sans en el macOS Fidelity block está condicionada a selector de plataforma",
      "O bien: la declaración se elimina del bloque macOS y --font-sans se gestiona exclusivamente en ai-tracker.css",
      "En Windows/Chrome: --font-sans resuelve a 'DM Sans'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "exportWeeklySummary — getAllSessions() invocada sin guard typeof; ReferenceError si módulo externo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Resumen semanal",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "exportWeeklySummary verifica typeof getAllSessions === 'function' antes de invocarla",
      "Si getAllSessions no está disponible, el usuario recibe toast de error"
    ]
  }
]
```

### Cluster C — Rs de experiencia y conversión (Nova + Lena — sesión 3e)

```json
[
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sidebar derecho — renombrar a label que refleje Workers como contenido principal",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Navegación / Orientación",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El título del sidebar refleja Workers como contenido primario (ej. 'Workers' o 'Workers · Radar')",
      "El cambio aplica tanto al label estático en HTML como al string dinámico asignado por JS",
      "Las notificaciones mantienen su badge en el header sin requerir que el nombre del sidebar diga 'notificaciones'"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Splash — agregar tagline estática visible durante carga para comunicar propósito del producto",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Onboarding",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El splash muestra una línea de texto descriptiva del producto bajo el logo durante toda la duración de la carga",
      "La tagline es visible antes de que el progress bar inicie",
      "El texto no es un estado de carga técnico — es una descripción del producto en lenguaje del usuario"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Empty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referencia",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Onboarding / Activación",
    "sprint": "PP-S-26",
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
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sprint — agregar version_target y release_type como obligatorios en formulario de apertura",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Sprint lifecycle · UI",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El formulario de apertura de sprint requiere version_target antes de confirmar",
      "El formulario de apertura de sprint requiere release_type antes de confirmar",
      "Intentar confirmar sin estos campos muestra validación inline — el botón no cierra el modal"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sesiones — agregar hint contextual bajo textarea de CHECKPOINT explicando qué pegar",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Onboarding / Sesiones",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Bajo el textarea de ingesta de CHECKPOINT hay texto de ayuda que explica qué es un CHECKPOINT y cómo generarlo",
      "El hint es visible sin interacción — no requiere hover ni click",
      "El hint desaparece o se reduce cuando el textarea tiene contenido"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Backlog — agregar CTA visible '+ Nuevo ítem' en toolbar",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Backlog · Descubribilidad",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La toolbar del tab Backlog contiene botón visible '+ Nuevo ítem'",
      "El botón abre openItemEditor() para crear ítem nuevo",
      "El botón es visible sin scroll en la toolbar — no enterrado en menú secundario"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Backlog — status chip inline clickeable en fila colapsada para cambiar status sin abrir IDP",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Backlog · Interacción",
    "sprint": "PP-S-26",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El chip de status en la fila colapsada es clickeable y abre un selector inline de status",
      "Cambiar status desde el chip actualiza el ítem sin necesidad de abrir el IDP completo",
      "El selector inline cierra al seleccionar un status o al hacer click fuera"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Actualizar CANONICAL_PROJECTS en ai-tracker-session.js — 'Obsidiana' → 'Obsidian Labs'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Datos / Validación",
    "sprint": "PP-S-26",
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL['Obsidian Labs'] = 'OL'",
      "CANONICAL['ASVAB App'] = 'AS'",
      "CANONICAL['Content Manager'] = 'CM'",
      "CANONICAL['AI Tracker'] = 'AI'",
      "Header muestra prefijo canónico correcto para cada proyecto activo"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La función compara status del ítem contra 'pendiente' (schema canónico vigente)",
      "Sugerencia de worker dispara cuando hay ítems con status 'pendiente' y >3 días sin sesión registrada"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Corregir _offlineQueuePush() — deduplicación por type + projId en lugar de solo type",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Datos / Integridad",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La deduplicación en _offlineQueuePush usa type + projId como clave compuesta",
      "Dos proyectos distintos con writes pendientes del mismo tipo no se sobreescriben"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El tracker-detail-empty-icon muestra '→' en lugar de '←'",
      "El hint 'Elige un Worker del panel derecho' se mantiene sin cambio"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Tab principal — renombrar 'Documentos' a 'Backlog'",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Navegación",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El tab-btn con id tab-btn-backlog muestra 'Backlog' como label visible",
      "El tooltip del tab se actualiza para reflejar el nuevo nombre",
      "El sub-tab interno de Backlog mantiene su label 'Backlog' sin colisión visual con el tab padre"
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El checklist aparece como banner dismissable en el tab Sesiones cuando los 4 pasos de setup no están completos",
      "Los 4 pasos son: (1) Worker creado — state.ais.length > 0, (2) Proyecto creado — state.projects.length > 0, (3) Ítem en backlog — ITEMS.length > 0, (4) Primera sesión guardada — getAllSessions().length > 0",
      "Cada paso muestra ícono de completitud (✓ done / ○ pendiente) calculado en tiempo real contra el estado actual",
      "El banner tiene botón de dismiss — al hacer click, se guarda en localStorage clave 'setup-checklist-dismissed' y no reaparece",
      "Si el founder ya tiene datos que satisfacen los 4 pasos al cargar PP, el checklist no aparece",
      "El checklist no bloquea ninguna acción del producto — es informativo, no modal",
      "Verificable: estado vacío → checklist visible con 4 pasos pendientes. Crear worker → paso 1 marca ✓ en tiempo real sin recargar."
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
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El elemento #radar-sidebar-expand no existe en el DOM, o bien tiene estilos CSS definidos visualmente coherentes",
      "Existe un único mecanismo de expansión del sidebar colapsado"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Botón '+' sidebar Workers — agregar label visible o cambiar ícono para comunicar acción 'Nuevo Worker'",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Affordances",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El botón de agregar Worker en el sidebar muestra su acción sin depender solo del tooltip",
      "La acción es distinguible del pin btn y del collapse btn sin necesidad de hover"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Menú ⋯ — separar acciones frecuentes de configuración y acciones peligrosas",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Navegación",
    "sprint": "PP-S-26",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El menú ⋯ tiene al menos dos agrupaciones visuales claras con separadores semánticos",
      "Acciones de sesión frecuentes (backup, reporte) separadas visualmente de configuración (tema, sync, atajos)"
    ]
  }
]
```

### Cluster D — Bugs menores y deuda técnica

```json
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "loadBacklog — saveBacklog() incondicional en cada carga aunque no haya cambios",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "saveBacklog() se llama al final de loadBacklog() solo si migrated === true o sanitized > 0",
      "Una carga limpia no escribe al storage"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "setItemStatus — _blogLog llamado antes de _undoSnapshot(), log y estado desincronizados en undo",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Cambio de status",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_undoSnapshot() se llama antes de _blogLog() en setItemStatus()",
      "Si el usuario hace undo inmediatamente después de un cambio de status, el log no contiene el cambio revertido"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showMergeDiffPanel — window._mdiff* se redefinen en cada apertura, closures anteriores reemplazadas",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Merge de CHECKPOINT",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Las funciones window._mdiff* se limpian (delete window._mdiff*) al cerrar el panel",
      "Abrir el panel múltiples veces no acumula referencias huérfanas en window"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Focus mode — _backlogFocusMode y _focusModeActive activos simultáneamente, Esc desactiva solo _focusModeActive",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Focus mode",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Esc desactiva ambos focus modes si ambos están activos, en orden: _focusModeActive primero, _backlogFocusMode segundo",
      "O bien: los dos modos son mutuamente excluyentes"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogItem — porcentaje de progreso de R calculado sobre hijos filtrados, no sobre total de hijos",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Render de ítems",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El porcentaje de progreso del R se calcula siempre sobre allChildren (total de hijos sin filtrar)",
      "Los filtros de status activos afectan qué hijos se muestran pero no el denominador del porcentaje"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_rebuildLogBody — listener scroll acumulado por render() monkey-patch: mínimo 2 acumulaciones por guardado",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Log de sesiones",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El listener de scroll en logBody se registra con referencia nombrada para permitir removeEventListener",
      "Con N guardados de sesión, exactamente 1 listener de scroll está activo"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "saveSession — ai._parsed accedido sin guard cuando getAI(id) devuelve null",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Guardado de sesión",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "saveSession(id) verifica que getAI(id) no sea null antes de acceder a ai._parsed",
      "Si ai es null, se muestra toast de error y la función retorna sin TypeError"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "style.setProperty('background'/'color'/'border-color') en openPulsoPanel — violación CSS Purity",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Pulso panel · CSS Purity",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L7055-7057: background, color y border-color se aplican vía CSS custom property",
      "grep 'style.setProperty.*background' no produce coincidencias con propiedades de presentación no-custom"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "color-mix() — 175 instancias sin @supports wrapper ni fallback: colores ausentes en Safari < 16.2",
    "status": "pendiente",
    "priority": "medium",
    "effort": 3,
    "area": "CSS · Compatibilidad cross-browser",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cada uso de color-mix() tiene fallback estático (valor hex o rgba) como propiedad anterior en el mismo bloque",
      "O bien: @supports wrapper en bloques críticos (badges de tipo, sprint headers, heatmap)",
      "En Safari 15: badges de tipo de ítem tienen color de fondo visible"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "background-attachment: fixed en dark body — sin override mobile: scroll jank en iOS/Android",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "CSS · Performance mobile",
    "sprint": "futura",
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
    "title": "_calcPriority — effort 1 en sprint cerrado eleva priority a high en ítems pendientes",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Cambio de status",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regla de effort 1 → high solo aplica si el sprint asignado está en status 'active' u 'open'",
      "Ítems en sprints cerrados no reciben prioridad automática alta por effort"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_initFocusShortcut — listener keydown sin cleanup, acumula duplicados en hot reload",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Focus mode",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El listener de keydown de _initFocusShortcut se registra con referencia nombrada",
      "Recargar el módulo no acumula listeners adicionales"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogItem — item.desc renderizado en bitem-body aunque 'desc' no es campo canónico del schema",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Render de ítems",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Ítems con campo desc legacy muestran advertencia visual de campo fuera de schema",
      "O bien: desc se migra a title en loadBacklog() y no se renderiza como campo independiente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "ITEMS IIFE — inicio silencioso sin feedback si proyecto activo no tiene datos en localStorage",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si current-project-filter apunta a un proyecto sin datos en localStorage, se emite console.warn",
      "El comportamiento de ITEMS vacío es documentado como estado válido de primer uso"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "sess.id generado con Date.now() sin componente random — colisión posible en guardados concurrentes",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Registro de actividad",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "newSess.id se genera con Date.now() + componente aleatorio",
      "Dos sesiones guardadas en el mismo ms tienen IDs distintos"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Doble render() post-guardado — monkey-patch llama _rebuildLogBody() dos veces por guardado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Cierre de sesión",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Por cada guardado de sesión, _rebuildLogBody() se ejecuta exactamente una vez"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "env.js y Supabase SDK en HEAD sin defer/async — bloqueantes de renderizado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Performance · Carga de scripts",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "env.js cargado con defer",
      "Supabase SDK cargado con defer o async según patrón de inicialización"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "3 instancias de backdrop-filter sin -webkit-backdrop-filter: #ckpt-panel, .quick-note-overlay, overlay genérico",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CSS · Compatibilidad Safari",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Las 3 instancias tienen par -webkit-backdrop-filter inmediatamente después del backdrop-filter",
      "grep 'backdrop-filter' en ai-tracker-extra.css: cada instancia tiene par webkit"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_scmStep1Html — doble fuente de verdad _scmState como global y como parámetro derivado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Cierre de sprint",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_scmStep1Html accede métricas de effort exclusivamente via parámetros recibidos, no via _scmState global",
      "No hay referencias directas a _scmState dentro de _scmStep1Html"
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
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si #item-notes no existe en el DOM al guardar, confirmItemEditor emite warning en consola",
      "El campo notes no se pierde silenciosamente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildDynamicCommands IAs — switchTab('tracker') sin prefijo 'tab-'",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Command Palette · Comandos dinámicos",
    "sprint": "futura",
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
    "title": "_mgLoadFiles — deduplicación silenciosa: archivo actualizado con mismo nombre descarta versión nueva",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Map Generator · Dropzone",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si el usuario sube un archivo con nombre idéntico: reemplazar la versión anterior con la nueva",
      "Toast informativo: '[nombre] reemplazado — versión anterior descartada'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "confirmMapGenerator — sin instrucción al usuario tras warning de sprint sin cerrar: modal en estado indeterminado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Map Generator · Version bump",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Tras el toast de warning, el modal muestra instrucción visible: 'Cierra el sprint activo antes de continuar'",
      "O bien: el modal se cierra automáticamente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_isBlocked — dep IDs inexistentes en allSessions bloquean sesión permanentemente sin mensaje",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "EXECUTION-PLAN display · Dependencias",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si un dep ID en depende_de no existe en allSessions, la sesión muestra indicador de dependencia rota",
      "O bien: el HTML de sesión bloqueada incluye '(dep no encontrada)' cuando el blocker no existe"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "L7356 — warning message en plan display usa string '---PLAN---' (legacy) en lugar de '---EXECUTION-PLAN---'",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "EXECUTION-PLAN display",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L7356: el mensaje de campo faltante dice 'edita el bloque ---EXECUTION-PLAN--- antes de copiar'",
      "grep '---PLAN---' en este módulo → 0 coincidencias en strings de UI visibles al usuario"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showCheckpointPanel — early return silencioso cuando CHECKPOINT no tiene ítems ni Próximo paso/Decisión",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CHECKPOINT display",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si sections.length === 0, showCheckpointPanel muestra toast informativo indicando que el CHECKPOINT fue procesado sin cambios"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openProjModal/closeProjModal — acceso a classList sin null guard en elementos del modal",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Gestión de proyectos · Modal",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L817, L822, L713, L720: elemento verificado con null guard antes de acceder a classList",
      "Si #proj-modal-overlay no existe en DOM, función retorna silenciosamente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_renderProjList archived toggle — lógica JS multi-sentencia embebida como string en onclick",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Gestión de proyectos",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "onclick del botón archived-toggle llama una función nombrada",
      "grep 'onclick.*localStorage' en este módulo → 0 coincidencias"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "cleanupLocalStorage / testLocalStorageQuota — funciones de debug expuestas globalmente en producción",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Debug · Producción",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "cleanupLocalStorage y testLocalStorageQuota no accesibles desde window en producción",
      "En producción: window.cleanupLocalStorage === undefined"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Onboarding modal paso 3 — agregar link/tooltip explicando qué es un CHECKPOINT",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Onboarding",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El paso 3 del onboarding modal tiene link o tooltip que explica qué es un CHECKPOINT",
      "O bien: el paso 3 tiene botón de acción hacia el textarea de ingesta"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Checkpoints — toast redundante de error de proyecto no canónico cuando preview inline persiste",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CHECKPOINT display",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si el preview inline ya muestra el error de proyecto no reconocido, no se emite toast adicional",
      "El usuario recibe un único feedback de error por validación de proyecto"
    ]
  }
]
```

---

## Ítems descartados del historial

Todo el historial acumulado de PP-S-01 a PP-S-24 fue reseteado. No hay ítems heredados individuales del historial viejo — el backlog nuevo se construye exclusivamente sobre evidencia de las auditorías de Fases 1-3. Los ítems del historial que no aparecen en este backlog se consideran: done (ya implementados), no evidenciados como pendientes en las auditorías, o descartados por el reset.

**Criterio de descarte explícito:** Cualquier ítem del historial no confirmado por hallazgo directo de Rune (Fase 1), Finn (Fase 2) o Nova/Lena (Fase 3) no entra al backlog nuevo.

---

## Decisión de sprint para PP-S-26

Los ítems marcados con `"sprint": "PP-S-26"` son candidatos para el primer sprint post-reset. Son todos de effort 1 o 2 y tienen AC verificables. Los ítems marcados con `"sprint": "futura"` son deuda técnica y mejoras diferibles — entran en sprints subsiguientes según priorización con Vera.

**Nota:** Vera debe ejecutar auditoría pre-sprint antes de abrir PP-S-26 — verificar que todos los Rs incluidos pasaron por el Protocolo de Especificación de Cael para los ítems que requieren Nova en Fase 1 (R de empty state, R de checklist de setup, R de status chip inline).
