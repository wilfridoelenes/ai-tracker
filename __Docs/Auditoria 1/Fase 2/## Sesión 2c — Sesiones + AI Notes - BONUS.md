## Sesión 2c — Sesiones + AI Notes - BONUS

Informe funcional — Sesión 2c
Flujo auditado
AC verificado
Gap de especificación
Bug detectado
Pasos reproducibles
session.js — Apertura de sesión: nueva sesión
Parcial
Sin AC para comportamiento cuando getAI(id)devuelve null en saveSession() — la función llama ai._parsed sin guard
Mayor — saveSession(id) referencia ai._parsed en L1632 sin verificar que aino sea null. Si el card se renderiza con un idhuérfano, getAI(id) devuelve null → TypeError silencioso
1. Estado corrupto donde state.ais no contiene la IA del card. 2. Clic en Guardar. 3. const parsed = ai._parsed → TypeError: Cannot read properties of null
session.js — Apertura de sesión: selección de proyecto
Sí (R-202605-095)
Sin AC para el edge case: proyectos disponibles = 0 al abrir _showProjRequiredInPanel()
Menor — L1163 renderiza "No hay proyectos creados" pero el botón Guardar sigue presente (solo con aria-disabled). El usuario puede tabular hasta él y presionar Enter/Space — el handler tiene guard if (!_resolvedProj) return pero no hay feedback visual de por qué no ocurre nada
1. App sin proyectos creados. 2. Guardar sesión sin proyecto seleccionado. 3. Panel abre con mensaje correcto. 4. Tab hasta botón + Enter. 5. Sin feedback, sin toast, sin acción visible
session.js — Registro de actividad: timestamps
Parcial
Sin AC que declare comportamiento de interpretHora() cuando el usuario ingresa una hora pasada — epoch apunta al día siguiente (B-202604-009 documentado pero sin AC de comportamiento esperado)
Confirmado Fase 1 (baja) — no reauditar


session.js — Registro de actividad: ítems referenciados
Sí (happy path)
Sin AC para newSess guardado antes de showMergeDiffPanel — si el usuario cancela el panel, la sesión persiste sin ítems mergeados
Mayor — L1861 activeProj.sessions.push(newSess)se ejecuta antes de que showMergeDiffPanel confirme (L1887). Si el usuario cancela el modal de diff: sesión guardada en state sin trackerRefsresueltos, sin merge aplicado. Estado inconsistente permanente hasta siguiente guardado o reset
1. Sesión con ítems. 2. Guardar. 3. Panel showMergeDiffPanel abre. 4. Clic en Cancelar. 5. openDetail() muestra sesión con trackerRefs: []. 6. Ítems del backlog no actualizados. Estado inconsistente sin indicación al usuario
session.js — Cierre de sesión: guardado y draft cleanup
Sí (happy path)
Sin AC para error de red en _supabase.from('tracker_docs').delete()— solo console.warn, sin feedback al usuario si el draft no se elimina en Supabase
Menor — draft-delete Supabase falla silenciosamente (L1781, L1939). Solo console.warn. En la siguiente sesión, el draft obsoleto puede reaparecer desde Supabase si hay sincronización
1. Supabase activo. 2. Guardar sesión. 3. Simular error de red en delete. 4. console.warn pero cero feedback en UI. Draft puede persistir en Supabase
session.js — Cierre de sesión: persistencia en historial
Parcial
Sin AC para _rebuildLogBody() con listener de scroll acumulado — confirmado en Fase 1 como severidad alta. Verificación: el listener se registra en L3089 sin removeEventListener anterior en cada llamada a _rebuildLogBody(). _doApplyMergeAndFinish llama _rebuildLogBody() en L1953, más el rAF en L1958–1960 llama render() que via monkey-patch (L3185) llama _rebuildLogBody() de nuevo → 2 listeners de scroll acumulados por guardado de sesión
Mayor — acumulación de listeners de scroll en logBody en cada _rebuildLogBody(). _doApplyMergeAndFinish genera mínimo 2 acumulaciones por sesión guardada (líneas 1953 + 1960 vía render monkey-patch). Confirmación de hallazgo Fase 1 con ruta de acumulación concreta
1. Guardar sesión con ítems. 2. _rebuildLogBody() L1953: listener 1 registrado. 3. render()en rAF L1960 → monkey-patch → _rebuildLogBody() → listener 2. 4. Abrir log, scroll → scrollBtn.classList.toggledispara N veces. Con 10 guardados: 20+ listeners activos
session.js — Cierre de sesión: render en historial
Parcial
Sin AC para _buildLogHeader() — ${color}interpolado como atributo sin nombre en L2918 → HTML malformado confirmado Fase 1
Mayor (confirmado Fase 1, verificado con código real) — L2918: `<button class="log-ai-pill${active}" ${color} onclick=...>` — si ai.color = '#38bdf8', el output es <button class="log-ai-pill" #38bdf8 onclick=...>. Atributo sin nombre, parseado como #38bdf8="" o ignorado según browser. CSS de color de pill nunca aplica
1. IA con color asignado. 2. Abrir Log de sesiones. 3. Inspeccionar DOM del pill de IA. 4. Atributo #rrggbbsin nombre de atributo. 5. Color del pill no refleja color de la IA
session.js — Resumen semanal: trigger
Sí — exportWeeklySummary()invocada desde botón en Analytics (L4397 de ai-notes.js). No hay trigger automático
Sin AC que declare si el resumen es solo manual o si debe existir trigger automático (digest, notificación, etc.)
Observación — no bug


session.js — Resumen semanal: generación
Parcial
Sin AC para comportamiento cuando getAllSessions() no está disponible — llamada en L3176 de ai-notes.js sin guard typeof
Mayor — exportWeeklySummary() llama getAllSessions() en L3176 sin typeof getAllSessions === 'function'guard. Si el módulo que define getAllSessions no cargó, ReferenceError no manejado. Mismo patrón que openItemEditor sin guard (2b)
1. Cargar PP sin módulo que define getAllSessions. 2. Clic en "⬇ Resumen semanal". 3. ReferenceError sin feedback al usuario
session.js — Resumen semanal: display
Parcial
Sin AC para el caso donde s.date usa formato español (ej: "07 may. 2026") — _sessInRangeintenta new Date(s.date) y hace fallback a _parseSpanishDate. Sin AC que declare cuáles formatos de fecha son válidos en sess.date
Observación — comportamiento existe pero no está especificado como AC


ai-notes.js — Creación de nota (card de IA): apertura de editor
Sí (happy path editNotes)
Sin AC para comportamiento cuando getAI(id)devuelve null en editNotes() — L2772 const ai = getAI(id) sin guard antes de ai.notes
Menor — editNotes(id) si getAI(id)devuelve null: ai.notes en L2777 → TypeError. Card con id huérfano puede surgir si la IA fue eliminada sin re-render
1. IA eliminada sin re-render del DOM. 2. Clic en zona de notas del card huérfano. 3. const ai = getAI(id) → null. 4. ta.value = ai.notes → TypeError
ai-notes.js — Creación de nota: guardado
Sí (happy path)
Sin AC para wrap._ta cuando render()destruye el DOM entre editNotes() y saveNotes() — deuda de Fase 1 verificada
Mayor (confirmado Fase 1) — wrap._taasignado a DOM element en L2788. Si render() es llamado entre click de "editar" y click de "guardar": wrap reemplazado por innerHTML='' en render(), wrap._ta apunta a nodo huérfano → saveNotes() en L2797 !wrap._ta es falso (el nodo existe pero está detachado), ai.notes = wrap._ta.value lee el valor correcto, pero renderNotesDisplay(id) en L2800 busca notes-wrap-${id} que fue recreado por render — wrap local ya no es el del DOM
1. Hacer click en zona de notas (editNotes inicia). 2. Sin modificar nada, scroll que trigger render(). 3. Clic en Guardar. 4. wrap._ta es nodo huérfano. renderNotesDisplay(id)busca el nuevo notes-wrap-${id} — puede funcionar si idsigue en DOM, pero el estado intermedio es stale
ai-notes.js — Edición de nota: carga y modificación
Sí
Sin AC para edición concurrente — dos instancias abiertas del editor para la misma IA (no posible con UI actual por wrap.innerHTML = '', pero sin AC explícito)
Observación


ai-notes.js — Eliminación de nota / clear de IA
Parcial
Sin AC para deleteAI con sesiones en formato legacy ai.sessions (formato v2) — confirmado Fase 1
Mayor (confirmado Fase 1) — deleteAI(id) en L99 verifica sesiones solo en state.projects — si hay sesiones en ai.sessions (v2 legacy), confirmClear() en L93 devuelve false, deleteAI procede sin confirmación y borra la IA con sus sesiones sin advertencia al usuario
1. IA con sesiones en campo ai.sessions (formato v2). 2. Abrir menú ⋯ → Eliminar. 3. confirmClear(id): recorre state.projects → no encuentra sesiones. 4. deleteAI ejecuta sin modal de confirmación. 5. IA y sesiones legacy eliminadas sin advertencia
ai-notes.js — Búsqueda de notas (global search)
Sí (happy path)
Sin AC para openQuickNote() — invocada en L2148 y L5661 pero no definida en ai-notes.js ni encontrada en ai-tracker-session.js. Misma deuda que openItemEditor (sesión 2b)
Mayor — openQuickNote(id)referenciada como callback onclick desde resultados de búsqueda global (L2148) y desde panel de proyecto (L5661) sin definición en ninguno de los dos archivos auditados. Si el módulo que la define no carga: clic en nota → ReferenceError sin feedback
1. Cargar PP sin módulo que define openQuickNote. 2. Búsqueda global → resultado de nota. 3. Clic en resultado. 4. ReferenceError: openQuickNote is not defined — sin feedback al usuario
ai-notes.js — Búsqueda: filtrado por scope
Sí (B-202605-236 verificado)
Sin AC para state.quickNotes vacío o undefined — el filter en L2020 usa `state.quickNotes


[]`, comportamiento correcto, pero sin AC que lo declare como edge case cubierto
Verificación _initFocusShortcut cross-módulo
No aplica
No existe _initFocusShortcut en ai-tracker-session.js ni en ai-tracker-ai-notes.js. El listener está en ai-tracker-backlog.js (confirmado 2b). Sin acumulación en estos módulos
n/a


CANONICAL_PROJECTS string deprecado
No
Gap crítico de especificación — CANONICAL_PROJECTS L4 en ai-tracker-session.js contiene 'Obsidiana Labs' y 'Obsidiana'. String canónico actual es 'Obsidian Labs' (Base Rules §3, OL-CONTEXT §7). parsePaste() acepta el string incorrecto como válido en validación de proyecto
Gap — devolver a Cael. No es bug de Rune: es decisión de especificación si la constante debe actualizarse y qué hacer con CHECKPOINTs históricos que usan el string deprecado



Lista de gaps de AC para Cael
Título del gap
Flujo afectado
Comportamiento observable sin AC
Guard de null en saveSession()cuando getAI(id) devuelve null
Apertura de sesión
ai._parsed se accede sin verificar que aino sea null. Card con ID huérfano genera TypeError no manejado
Comportamiento del botón Guardar cuando no hay proyectos creados en _showProjRequiredInPanel()
Selección de proyecto
Botón con aria-disabled es alcanzable por teclado. Clic no produce feedback visible de por qué no actúa
Estado de sesión cuando el usuario cancela showMergeDiffPanel
Registro de ítems
newSess se empuja a activeProj.sessions antes de la confirmación del diff. Cancelar deja sesión guardada sin merge ni trackerRefs resueltos
getAllSessions invocada sin guard de existencia en exportWeeklySummary()
Resumen semanal — generación
Si el módulo externo no carga, ReferenceError sin feedback al usuario. Mismo patrón que openItemEditor (2b)
Formatos de fecha válidos en sess.date para _sessInRange()
Resumen semanal — display
Fechas en formato español ("07 may. 2026") hacen fallback a _parseSpanishDate. No hay AC que declare qué formatos son válidos ni qué pasa si el fallback falla
Guard de null en editNotes()cuando getAI(id) devuelve null
Creación/edición de nota de IA
ta.value = ai.notes en nodo con IA eliminada → TypeError
openQuickNote() invocada desde búsqueda global y panel de proyecto sin definición en módulos auditados
Búsqueda y filtrado de notas
Clic en resultado de nota → ReferenceError si módulo externo no carga. Mismo patrón que openItemEditor (2b) — acumulación de dependencias externas sin guard
CANONICAL_PROJECTS contiene strings deprecados 'Obsidiana Labs' y 'Obsidiana'
Validación de proyecto en parsePaste
parsePaste() acepta el string incorrecto como válido. CHECKPOINTs nuevos con string correcto 'Obsidian Labs' pasan la validación, pero también los que usan strings deprecados. Sin AC que declare si la constante debe depurar el histórico o solo agregar el nuevo string

---CHECKPOINT---
Título: Auditoría funcional PP · Sesión 2c — session.js (flujos de sesión + resumen semanal) + ai-notes.js (notas de IA + búsqueda + eliminación)
Proyecto: AI Tracker
Rol: QA · Finn
Resumen: Auditoría de 8 flujos en 2 módulos. 9 bugs documentados: 0 críticos, 5 mayores, 3 menores, 2 observaciones. 8 gaps de AC documentados para Cael. Hallazgo transversal: patrón de funciones externas sin guard (openItemEditor 2b + openQuickNote + getAllSessions 2c) — 3 dependencias externas sin typeof guard en HTML inline o en llamadas directas. _rebuildLogBody scroll-listener acumulado confirmado con ruta concreta: 2 acumulaciones mínimas por guardado de sesión vía render() monkey-patch.
Archivos: ai-tracker-session.js | ai-tracker-ai-notes.js | audit-ai-tracker-session_js-1f.md | audit-ai-tracker-ai-notes-1c.md
Contexto: Fase 2 de auditoría PP · Sesión 2c — cierre de auditoría funcional de módulos session + ai-notes
Bloqueantes: n/a — ningún bug individual bloquea release por sí solo. Bug de newSess guardado antes de cancelación de showMergeDiffPanel requiere evaluación de Vera: si el usuario cancela el diff habitual, queda estado inconsistente permanente. Decisión pendiente de 2b sobre openItemEditor sin guard aplica también a openQuickNote y getAllSessions — 3 funciones externas con el mismo patrón de riesgo.
Aprendizaje: Patrón sistémico identificado: funciones externas invocadas desde HTML inline o directamente sin guard typeof. Reportado en 2b (openItemEditor), confirmado en 2c (openQuickNote, getAllSessions). Recomendación para Cael: AC transversal obligatorio — toda función externa invocada desde módulos de sesión/notas debe tener guard de existencia. newSess pre-guardado antes de confirmación de diff es el bug de mayor impacto de la sesión — genera estado inconsistente sin señal al usuario.
CONTEXT-SECTION: n/a
Decisión: Auditoría 2c completada. 5 bugs mayores pasan a Rune. 8 gaps de AC pasan a Cael. Vera evalúa: (1) patrón de funciones externas sin guard — ¿AC transversal o fix caso por caso? (2) newSess pre-guardado antes de cancelación de diff — ¿bloquea release?
Próximo paso: 1) Gaps de AC → Cael (8 ítems nuevos + confirmación de patrón transversal). 2) Bugs mayores → Rune (5 ítems). 3) Vera evalúa decisión de release con hallazgos acumulados 2a+2b+2c. 4) Si se requiere auditoría de módulo que define openQuickNote y getAllSessions — adjuntar archivo correspondiente para sesión 2d.

---ITEMS---
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "saveSession — ai._parsed accedido sin guard cuando getAI(id) devuelve null",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Guardado de sesión",
    "sprint": "n/a",
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
    "title": "_showProjRequiredInPanel — botón con aria-disabled alcanzable por teclado sin feedback cuando no hay proyectos",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Selección de proyecto",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cuando no hay proyectos disponibles, el botón Guardar muestra tooltip o mensaje inline al recibir foco o clic",
      "O bien: el botón recibe disabled nativo cuando hasProjOptions es false, impidiendo foco por teclado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_doSaveSession — newSess guardado en activeProj.sessions antes de confirmación de showMergeDiffPanel; cancelar deja estado inconsistente",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Guardado de sesión",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "newSess no se persiste en activeProj.sessions hasta que el usuario confirma el panel de diff",
      "Si el usuario cancela showMergeDiffPanel, el state no contiene la sesión nueva y no hay cambios en el backlog",
      "Si showMergeDiffPanel no está disponible (fallback directo), el comportamiento actual se mantiene"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_rebuildLogBody — listener scroll acumulado por render() monkey-patch: mínimo 2 acumulaciones por guardado de sesión",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Log de sesiones",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El listener de scroll en logBody se registra con referencia nombrada para permitir removeEventListener antes de cada registro",
      "Con N guardados de sesión, exactamente 1 listener de scroll está activo — verificable con getEventListeners en devtools"
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
    "sprint": "n/a",
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
    "title": "exportWeeklySummary — getAllSessions() invocada sin guard typeof; ReferenceError si módulo externo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Resumen semanal",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "exportWeeklySummary verifica typeof getAllSessions === 'function' antes de invocarla",
      "Si getAllSessions no está disponible, el usuario recibe toast de error en lugar de ReferenceError silencioso"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "editNotes — ai.notes accedido sin guard cuando getAI(id) devuelve null",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Notas de IA",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "editNotes(id) verifica que getAI(id) no sea null antes de acceder a ai.notes",
      "Si ai es null, la función retorna sin abrir el editor"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "deleteAI — verifica sesiones solo en state.projects; IAs con sesiones en ai.sessions (formato v2) se eliminan sin confirmación",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Gestión de IAs",
    "sprint": "n/a",
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
    "title": "openQuickNote invocada desde búsqueda global y panel de proyecto sin definición en módulos auditados — ReferenceError si módulo externo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Notas rápidas",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Todas las llamadas a openQuickNote están precedidas de guard typeof o la función es inline en el módulo que la invoca",
      "Si openQuickNote no está disponible, el usuario recibe feedback visible en lugar de ReferenceError silencioso"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: qa-2c-session-notes-search
    rol: QA · Finn
    items: [pendiente-ID-dosavesess-newSess, pendiente-ID-rebuildLog-scroll, pendiente-ID-logheader-color, pendiente-ID-exportWeekly-guard, pendiente-ID-openQuickNote-guard]
    archivos: [ai-tracker-session.js, ai-tracker-ai-notes.js]
    depende_de: []
---EXECUTION-PLAN-END---


