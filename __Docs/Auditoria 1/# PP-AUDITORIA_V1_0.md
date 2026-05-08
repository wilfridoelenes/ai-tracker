# PP-AUDITORIA_V1_0.md
<!-- Versión: 1.0 | Última actualización: 2026-05-08 | Documento consolidado de auditorías — AI Tracker ciclo cool-down Fases 1–3 -->

---

## Tabla de contenidos

1. [Fase 1 · Rune — Auditoría técnica](#1-fase-1--rune--auditoría-técnica)
2. [Fase 2 · Finn — Auditoría funcional](#2-fase-2--finn--auditoría-funcional)
3. [Fase 3a · Nova — Onboarding y navegación principal](#3-fase-3a--nova--onboarding-y-navegación-principal)
4. [Fase 3b · Nova — Flujos de trabajo core](#4-fase-3b--nova--flujos-de-trabajo-core)
5. [Fase 3c · Lena — Funnel de activación](#5-fase-3c--lena--funnel-de-activación)
6. [Fase 3d · Lena — Hipótesis de conversión y Rs](#6-fase-3d--lena--hipótesis-de-conversión-y-rs)
7. [Fase 3e · Nova + Lena — Consolidación](#7-fase-3e--nova--lena--consolidación)
8. [Resumen ejecutivo](#8-resumen-ejecutivo)

---

## 1. Fase 1 · Rune — Auditoría técnica

### 1.1 ai-tracker-backlog.js

| Función / Bloque | Qué hace realmente | Deuda técnica detectada | Severidad |
|---|---|---|---|
| `ITEMS` (inicialización IIFE) | Lee backlog desde localStorage al cargar, con migración inline de status legacy | Migración de status duplicada (IIFE + `loadBacklog()`). Si el proyecto activo no está en localStorage, ITEMS arranca vacío silenciosamente sin alerta. | Media |
| `loadBacklog()` | Carga ITEMS desde localStorage o lanza `_loadFromSupabase()`, aplica migraciones, sanea pendientes en sprints cerrados, recalcula prioridades y scores, persiste | `saveBacklog()` se llama al final incondicionalmente, incluso si no hubo migración (`migrated = false`). Escribe al storage en cada carga aunque no haya cambio. | Media |
| `_getNextItemCode()` | Genera siguiente código disponible por tipo buscando el NNN máximo en ITEMS con el prefijo del mes actual | Busca solo ítems del mes actual. Si el primer ítem del mes nuevo se crea antes de que haya ítems ese mes, reinicia desde 001 aunque haya IDs previos con NNN alto. Duplicados posibles si dos tabs abren simultáneamente. | Alta |
| `parseBacklogMd()` | Parser Markdown de backlog: extrae cada bloque `###` y construye objetos de ítem | `impact` se extrae y se incluye en el objeto pero nunca se usa. Campo fantasma acumulando datos sin consumo. Regex de `descMatch` puede capturar ruido si hay campos entre `Version:` y `### Criterios`. | Baja |
| `importBacklog()` | Lee archivo .md, parsea, merge con ITEMS en memoria, guarda, re-renderiza | Auto-asignación de tipo usa `area` como heurística frágil. `typeChar = 'I'` para tipo desconocido se normaliza a `'P'` en `itemType()` — inconsistencia de intención. Múltiples `console.log` de desarrollo sin flag de debug. | Media |
| `_normalizeStatus()` (referenciada) | Normaliza valores legacy de status a canónicos | No definida en este archivo — dependencia implícita de módulo externo. Si no está disponible, `parseBacklogMd` y `loadBacklog` silencian el error (`try/catch` en ITEMS IIFE). | Media |
| `_calcPriority()` | Calcula prioridad automática desde tipo, sprint y effort | Regla 3 (effort 1 + cualquier sprint → high) se aplica a sprints cerrados, sobreescribiendo la prioridad de ítems históricos. | Baja |
| `_calcRelevanceScore()` | Score 0–100 para focus mode basado en tipo, sprint, effort, antigüedad, mención en sesión, AC | Llama `getAllSessions()` por cada ítem en cada evaluación. Sin caché. En backlogs grandes con muchas sesiones, O(n×m) en el hot path de render. | Alta |
| `_recalcAllScores()` | Estampa `_score` en todos los ITEMS pendientes | Se llama en `setItemStatus()`, `loadBacklog()`, y `toggleBacklogFocusMode()`. Al cambiar el status de un ítem, recalcula scores de TODO el backlog. | Media |
| `_sanitizePendingInClosedSprints()` | Sanea ítems pendientes en sprints cerrados y corrige doneAt/status inconsistentes | Segunda pasada (doneAt mismatch) silencia la deuda de por qué ocurre: un merge de CHECKPOINT puede sobreescribir status sin respetar `doneAt` existente. El fix es sintomático, no causal. | Media |
| `_purgeStaleBacklogCache()` | Filtra ITEMS en memoria eliminando done/descartado con >90 días | Muta el array global `ITEMS` directamente. No llama `saveBacklog()` ni `_undoSnapshot()` después — la purga no se persiste en el mismo ciclo de llamada ni tiene rollback. | Alta |
| `_buildOption()` | Construye HTML de opción de sprint para el selector | **Función duplicada verbatim**: definida dentro de `_buildSprintSelector()` y redefinida dentro de `_blSprintOpen()`. Cualquier cambio en una copia no se refleja en la otra. | Alta |
| `renderHtmlMap()` | Renderiza el Module Map con árbol de módulos, filtros y búsqueda | `loadHtmlMap()` se llama al inicio del render sin esperar resultado. Si `HTML_MAP_SECTIONS` aún está vacío, renderiza el empty state incorrectamente. | Media |
| `_attachBacklogDnD()` | Adjunta drag & drop para reordenar ítems dentro de grupos sprint | Solo activa si `backlogSortMode === 'sprint'` pero ese valor fue deprecado (T-202604-424). Condición de activación nunca es `true`. DnD silenciosamente inactivo. | Alta |
| `mergeBacklogFromTG()` | Merge de ítems del TRACKER-GLOBAL a ITEMS | Auto-cierre de P padre fuerza `status = 'done'` sin `_undoSnapshot()` previo. El P padre queda cerrado sin posibilidad de deshacer esa acción específica. | Media |
| `_resetStatusSelect()` | Resetea visualmente un select de status mientras un modal de confirmación está abierto | Usa `getAttribute('onchange').includes("'" + code + "'")` para identificar el select — frágil ante cambios de formato del atributo `onchange`. | Baja |
| `setItemStatus()` | Cambia status de ítem con validaciones, registro en history[], notificaciones de desbloqueo | `_blogLog` (L1175) llamado antes de `_undoSnapshot()` (L1176) — log y snapshot fuera de orden. | Baja |
| `_buildChildrenBlock()` | Construye bloque HTML de hijos de un R con progreso y colapsable | Usa `ITEMS.indexOf(child)` como `cIdx` para IDs de DOM. Si ITEMS muta entre renders (undo, merge), los índices de DOM quedan desfasados con los del array. | Alta |
| `buildBacklogItem()` | Construye HTML completo de un ítem del backlog (colapsado + expandido) | Función monolítica de >300 líneas. Mezcla lógica de datos, estado de UI y generación de HTML. Sin tests posibles de unidad. | Media |
| `showMergeDiffPanel()` | Muestra panel visual de diff antes de aplicar un merge de CHECKPOINT | `_mdiffToggleSection`, `_mdiffJumpTo`, `_mdiffSetItemSprint`, `_mdiffConfirmNewSprintForm` y `_mdiffCancelNewSprintForm` se asignan como `window.*` dentro de esta función. Se redefinen en cada apertura del panel — potential leak si el panel se abre múltiples veces. | Baja |
| `_scmRender()` | Renderiza el modal de cierre de sprint paso a paso | `isLast = step === (skipStep2 ? 3 : 3)` — condición siempre `3 === 3` independiente de `skipStep2`. La lógica de skipStep2 para el paso final está rota — el botón "Cerrar sprint" solo aparece en step 3 que es inalcanzable. | **Alta** |
| `_scmStep1Html()` | HTML del paso 1 del modal de cierre: resumen de ítems y métricas | Accede a `_scmState` directamente como global (L6466–6470). `_scmState` se pasa también como parámetro indirectamente. Doble fuente de verdad. | Baja |
| `_patchMoreMenuReset` (IIFE) | Monkey-patch de `toggleMoreMenu` para resetear sub-panel de templates | Usa polling con `setTimeout(_tryPatch, 100)` hasta que `toggleMoreMenu` esté definido. Sin límite de intentos — loop infinito silencioso si `toggleMoreMenu` nunca se define. | Media |
| `_initFocusShortcut` (IIFE) | Registra shortcut Cmd+F / Ctrl+F para activar Focus Mode | Sin mecanismo de cleanup. El listener de `keydown` queda vivo aunque el módulo se reinicialice. Acumula listeners duplicados en hot reload. | Baja |
| Inline CSS via `style=` en HTML generado (múltiples funciones) | Propiedades de presentación inyectadas como `style=` en strings de HTML | Viola CSS Purity (Base Rules §15). Incluye literales de presentación inline como `width:${pct}%`. | Media |
| `_blogLog()` (referenciada múltiples puntos) | Registra eventos de backlog en log interno | No definida en este archivo — dependencia implícita de módulo externo sin guardia. Si falla silenciosamente, los logs de auditoría se pierden sin feedback. | Baja |

### 1.2 ai-tracker-checkpoint.js

| Función / Bloque | Qué hace realmente | Deuda técnica detectada | Severidad |
|---|---|---|---|
| `_hasStaleSuggestion(ai)` | Detecta IAs con >3 días sin sesión + ítems en-progreso | Compara status `'en-progreso'` pero el schema canónico usa `'pendiente'`. El filtro nunca dispara con el schema actual. | **Alta** |
| `_updateHeaderProjectLabel()` | Renderiza prefijo + nombre canónico del proyecto activo en el header | El mapa CANONICAL (L55–57) está vacío — declarado pero nunca poblado. El prefijo se deriva con `.slice(0,2)` como fallback, ignorando los prefijos canónicos (OL, AS, CM, AI). | Media |
| `setSyncStatus(status, label)` | Actualiza dot + label de sync en múltiples elementos del DOM | Accede a `_supabaseUser` antes de que pueda estar inicializado si se llama muy temprano. No hay guard explícito de orden de inicialización. | Baja |
| `handleSyncPillClick()` | Toggle sign in / sign out | Llama `signInWithSupabase()` como fallback si `openAuthModal` no existe — dos flujos de auth inconsistentes en el mismo handler. | Media |
| Supabase init block (L124–184) | Inicializa cliente, configura auth, suscribe `onAuthStateChange` | `_supabaseReady` resuelve con el primer usuario del callback. Si `INITIAL_SESSION` dispara antes de `SIGNED_IN`, la promesa resuelve con null. | **Alta** |
| `getSession()` post-listener (L166–177) | Cubre caso donde `INITIAL_SESSION` disparó antes del listener | Si tanto el listener como `getSession` detectan sesión, `_loadFromSupabase()` y `render()` se llaman dos veces en paralelo. Race condition en carga inicial. | **Alta** |
| `_offlineQueuePush(entry)` | Encola writes pendientes con last-write-wins por type | Deduplicación solo por `entry.type` — entradas con `projId` diferente se sobreescriben entre sí. Dos proyectos con sessions pendientes: solo el último survives. | **Alta** |
| `_offlineQueueFlush()` | Procesa cola al reconectar | En caso de error parcial, los items fallidos se re-encolan pero el loop ya consumió el queue. Si falla ítem N, ítems N+1..M se procesan igual aunque dependan del N. | Media |
| `_refreshMigrationBtnVisibility()` | Oculta botón de migración Firebase → Supabase | Función vacía de propósito — el botón ya no existe. Llamadas desde `onAuthStateChange` y `getSession` son dead code ejecutado en cada login. | Baja |
| `signInWithSupabase()` | OAuth Google con bifurcación Safari/Chrome | La detección Safari por UA string es frágil. Edge, Opera y browsers embedidos pueden pasar el test y recibir redirect cuando necesitarían popup. | Media |
| `signOutSupabase()` | Guarda y cierra sesión | No limpia `_realtimeChannel` antes del signOut. Si la sesión expira y Supabase emite evento antes del cleanup, el canal puede quedar activo sin usuario. | Media |
| `signInWithMagicLink()` | Envía OTP por email | `shouldCreateUser: true` — crea usuarios nuevos sin restricción de dominio. En un sistema de founder único, cualquier email puede auto-registrarse. | **Alta** |
| `_scrollToCard(aiId)` | Navega al tracker enfocando una card | Función solo resetea scrollTop — ignora el `aiId` recibido. El parámetro no se usa. | Baja |
| `switchTab(tab)` | Cambia tab activo, persiste en localStorage, dispara renders | Contiene redirect `'hoy'` → `'tracker'` pero el tab `'hoy'` sigue referenciado en otros puntos. Si se elimina el redirect, el tab queda sin contenido sin error explícito. | Media |
| `esc(s)` | Escape HTML básico | No escapa `/` — XSS posible en atributos como href o src si el string escapado se usa en esos contextos. | Media |
| `_assignPendingIds(tgItems)` | Asigna IDs reales a ítems `[pendiente-ID]` y `[tmp:slug]` | Busca duplicados por `item.desc` (L596) pero el schema canónico usa `title` — si el ítem llega con `title` y sin `desc`, la detección de duplicados falla silenciosamente. | **Alta** |
| `showCheckpointPanel(result)` | Renderiza panel de resultado de CHECKPOINT con secciones dinámicas | `_ckptPendingConfirm` y sus handlers se asignan a `window.*`. Se limpian en `_ckptDiffCleanup`, pero si el panel expira por timeout sin que el usuario confirme, los handlers quedan en window sin cleanup. | Media |
| `showCheckpointPanel` — uso de `i.desc` | Renderiza descripción de ítems en panel | `.slice(0, 60)` sobre `i.desc` — si el ítem solo tiene `title`, la descripción aparece vacía en el panel. | Media |
| `_pauseCkptTimer()` / `_resumeCkptTimer()` | Pausa/reanuda el timer del panel CHECKPOINT | `_ckptTimerEnd` se reinterpreta como "ms restantes" (negativo) en pause y como "timestamp absoluto" en resume. El mismo campo cumple dos semánticas distintas. | Media |
| `showToast()` / `_toastRender()` | Sistema de toasts con queue, prioridad y progress bar | El regex de detección HTML en `titleHtml` es permisivo. Un string con `<3` puede fallar el `esc()` y renderizar HTML no escapado. | **Alta** |
| `showToastInline()` | Toast anclado al elemento que detona la acción | En modo acción, el `_outsideHandler` se registra en `document` con `capture:true` pero solo se limpia si el click es fuera del anchor. Si el toast expira por timer, el handler queda activo. | Media |
| `save()` | Escribe state en localStorage + encola Supabase con debounce | El cleanup de `ai-tracker-changelog` como fallback de quota no intenta liberar otras claves. Si el changelog no existe o no es suficiente, la segunda escritura también falla. | Baja |
| `_saveFlush()` | Escritura real en localStorage + Supabase | Duplica la lógica de QuotaExceededError de `save()` con mensajes de toast distintos para el mismo error. Inconsistencia en el mensaje al usuario. | Baja |
| `_saveSessions(proj)` | Upsert de sesiones en Supabase por lotes de 400 | Si falla un lote intermedio, hace break y encola el proyecto completo. El re-intento re-envía todos los lotes incluyendo los ya exitosos. Potencial de duplicados. | Media |
| `saveBacklog()` | Escribe ítems y meta del backlog en localStorage + Supabase | `_localStorageUsageRatio()` y `_purgeStaleBacklogCache()` se llaman con typeof guard pero nunca están definidas en este archivo. Si el archivo que las define no carga, la purga silenciosamente no ocurre. | Media |
| `saveContextDocs()` | Escribe context y html-map en Supabase | No escribe en localStorage antes de intentar Supabase. Si Supabase falla y el usuario recarga, los datos recientes de context pueden perderse. | **Alta** |
| `_migrateV2toV3(raw)` | Migración automática de state v2 a v3 | Usa `Math.random()` para generar el ID del proyecto de migración. Si la migración se ejecuta dos veces, puede crear proyectos duplicados con IDs distintos. | Media |
| `_isV2State(raw)` | Detecta si el state es formato v2 | Si hay un campo `tracker: {}` vacío, retorna true y dispara migración innecesaria. | Media |
| `updateStats()` | Actualiza badge del sub-tab Tracker con ítems activos | Cuenta ítems con `status !== 'done'` — incluye `'descartado'` en el conteo de activos. | Media |
| `_isInSession(ai)` | Detecta si una IA tiene sesión en curso | Usa `parseInt(b.id)` para ordenar sesiones por ID numérico. Si los IDs no son numéricos, el sort es incorrecto y puede retornar la sesión equivocada como "última". | Media |
| `renderStatusBar()` | Renderiza pill de sprint en tracker-view-header y estado en global footer | El bloque de sprint pill usa `style="--pct:${spPct}%"` directamente en HTML generado — violación de CSS Purity. | **Alta** |
| `_computeNotifications()` | Computa todas las notificaciones activas del ecosistema | `getActiveSprints()` se llama con typeof guard pero no está definida en este archivo. Si no carga su módulo, los tipos `sprintOrphans` y `sprintLow` no emiten notificaciones sin error visible. | Media |
| `normStatus(raw)` | Normaliza raw status a alias canónico | Aliases incluyen emojis como parte del valor canónico (`'📤 Pendiente'`). Si el schema de ITEMS usa `'pendiente'` sin emoji (canónico en Base Rules), la normalización produce valores inconsistentes. | **Alta** |
| `buildTGPreview(items, discrepancy)` | Construye HTML de preview de ítems parseados del CHECKPOINT | Renderiza `i.desc` (L6507–6508) en lugar de `i.title` — si el ítem solo tiene `title`, la columna descripción aparece vacía. | Media |
| `_showArranquePanel()` | Panel de contexto diario al abrir la app | Múltiples violaciones de CSS Purity: `style="--arr-type-color:..."` inyectado en innerHTML. | **Alta** |
| `openPulsoPanel()` | Renderiza panel de pulso del ecosistema | Violación CSS Purity: `style="--pls-vel-fill:...;--pls-vel-color:..."` inyectado en template string. | **Alta** |
| `_trackerRenderHist()` | Renderiza col 2 con lista de sesiones filtrable por proyecto | Inline `style` en L7683 (`font-size:10px;color:var(--hint)`) — violación de CSS Purity en HTML generado dinámicamente. | **Alta** |

### 1.3 ai-tracker-ai-notes.js

| Función / Bloque | Qué hace realmente | Deuda técnica detectada | Severidad |
|---|---|---|---|
| `openAvatarModal(aiId)` | Abre modal de selección de avatar; genera grid de opciones; pre-selecciona avatar actual | Genera innerHTML con onclick inline — viola CSS Purity. | Media |
| `selectAvatarOption(key)` | Marca opción seleccionada en grid de avatares | Usa `event` implícito (global) en lugar de recibir el evento como parámetro — frágil en entornos estrictos. | Media |
| `confirmAvatarModal()` | Persiste avatar seleccionado al AI | Acoplamiento implícito con variable global `popAIId` — dependencia no declarada en firma. | Baja |
| `confirmAddAI()` | Valida nombre no vacío, detecta duplicados, crea AI con `id: 'ai-${Date.now()}'` | ID generado con `Date.now()` — colisiones posibles en inserciones rápidas. El campo `id` debería venir de PEPE según Base Rules §5. | **Alta** |
| `deleteAI(id)` | Confirma eliminación si tiene sesiones; borra directo si no tiene | Verifica sesiones solo en `state.projects` — si hay sesiones legacy en `ai.sessions` (formato v2) la verificación da falso negativo y borra sin confirmar. | **Alta** |
| `showInlineConfirm(id, action, msg)` | Crea y adjunta div de confirmación inline a la card | El string tiene onclick inline con interpolación directa de `id` y `action` — potencial inyección si contienen comillas. No usa `_esc()`. | **Alta** |
| `document.addEventListener('click') #1` | Cierra todos los card-dot-dropdown al click global | Registrado con función anónima — no se puede remover. Tres listeners de click globales en el mismo archivo sin coordinación. | Media |
| `document.addEventListener('keydown')` | Escape cierra inline confirms, más-menu y ckpt-panel | Escape no cierra avatar-modal ni otros modales — comportamiento inconsistente entre modales. | Media |
| `resetHtmlMapData()` | Abre gconfirm y limpia HTML-MAP de localStorage | `HTML_MAP_SECTIONS = []` reasigna variable global — si hay módulos con referencia al array anterior, la referencia queda stale. | Media |
| `importData(e)` | Lee archivo JSON, valida `d.ais`, pasa a `_showImportDiff` | Validación mínima — solo verifica existencia de `d.ais`. Datos malformados pasan a `confirmImport` sin validación de estructura interna. | Media |
| `confirmImport()` | Merge de IAs, proyectos, sesiones, sprints, tracker items y docs de localStorage | Fallback v2 puede asignar sesiones a proyecto incorrecto silenciosamente. `state = {...state, ais, projects}` puede perder propiedades no conocidas del estado. | **Alta** |
| `_rebuildLogBody()` | Reconstruye el log card completo (header + filas) con filtros aplicados | Registra event listener de scroll en cada llamada sin remover el anterior — acumulación de listeners. innerHTML completo: scroll position se pierde en cada rebuild. | **Alta** |
| `_buildLogHeader()` | Construye HTML del header del log con pills de IA, tipo, proyecto y buscador | `${color}` interpolado directamente como atributo sin nombre de atributo — genera HTML malformado: `<button class="..." #ff0000 ...>`. | **Alta** |

### 1.4 ai-tracker-session.js

| Función / Bloque | Qué hace realmente | Deuda técnica detectada | Severidad |
|---|---|---|---|
| `saveSession()` | Orquesta guardado: valida título, hora, proyecto, delega a `_doSaveSession()` | Doble declaración de variable `ta`. La lógica de fallback de título puede capturar la primera línea del body del CHECKPOINT si el título parseado está vacío. | Media |
| `_mergeBacklogWithProject()` | Merge de ítems al proyecto del card | Sobrescritura temporal de localStorage con restauración en `finally` — si `loadBacklog()` dentro del `finally` tiene efectos secundarios, el estado puede quedar inconsistente. Patrón de "hack de contexto". | Media |
| `_doSaveSession()` | Segunda mitad del guardado: crea newSess, actualiza tracker legacy, delega merge | Tracker legacy actualiza `tracker.items` con schema distinto al backlog principal. Regex L1876 usa `[PITRB]` incluyendo `'I'` — tipo inexistente. `newSess` creado y push a sessions ANTES de `showMergeDiffPanel` — si el usuario cancela, la sesión queda guardada sin items mergeados. | **Alta** |
| `_doApplyMergeAndFinish()` | async — aplica merge, secciones CONTEXT/MAP, plan, limpia estado, renderiza | Declarada async pero no usa await excepto en `saveImmediate()`. Doble `render()` dentro de `requestAnimationFrame` — render ejecuta 2 veces por guardado, potencial de flash visual. | Media |
| `openDetail()` / `openPopup render` | Renderiza popup/preview panel de sesión | Doble atributo `class=` en elementos (L2135, L2249) — el segundo es ignorado. CSS de las clases afectadas nunca aplica. Genera HTML inline extenso — si `esc()` falla en un campo con valor null, genera "null" visible en UI. | Media |
| `_rebuildLogBody()` | Reconstruye el log card completo | Registra event listener de scroll en cada llamada sin remover el anterior — acumulación confirmada: mínimo 2 acumulaciones por guardado de sesión vía render monkey-patch. | **Alta** |
| `_buildLogHeader()` | Construye HTML del header del log con pills de IA | `${color}` interpolado directamente como atributo sin nombre — HTML malformado: `<button class="log-ai-pill" #38bdf8 onclick=...>`. Color de pill nunca aplica. | **Alta** |
| `parsePlanBlock()` | Parser YAML-like de `---PLAN---` / `---EXECUTION-PLAN---` | `_parseList` usa `split(/[,\s]+/)` — nombre de archivo con espacios se parte incorrectamente. No valida que el terminador esté presente. `isNew` detectado por presencia de string en texto completo, no solo en el bloque. | Media |
| `buildContextMd()` | Genera texto completo del CONTEXT.md para exportar | `stackSection`, `tabsSection` y `localStorageSection` son strings estáticos hardcodeados — no reflejan el estado real del sistema. Genera doble encabezado: dos H1 en el mismo documento. | Media |
| `buildBacklogMd()` | Genera Backlog.md para exportar desde items del tracker activo | Itera sobre `item.code[0]` para clasificar por tipo — si code está vacío, ítem se ignora silenciosamente. Usa `item.desc` en L1604 — campo deprecated según Base Rules §6. Tipo `'I'` incluido en `byType` pero no existe en el sistema. | Media |
| `handlePaste()` | Difiere `parsePaste()` 150ms tras onpaste para esperar inserción del clipboard | Timeout heurístico (150ms / 300ms) frágil en browsers lentos. No hay mecanismo de cancelación si el card se destruye antes del timeout. | Media |
| `_tryIngestPlan()` | Detecta y mergea bloques `---PLAN---` / `---EXECUTION-PLAN---` | Si `incomingHasSesion && incomingHasSprint` (ambos scopes), reemplaza completo sin confirmación al usuario — comportamiento destructivo silencioso. | Media |
| `parsePasteStandalone()` | Flujo CHECKPOINT sin IA | Duplica validación de ítems completa — tercera copia del mismo bloque de ~35 líneas. Doble atributo `class=` en el mismo div (L710). | Media |

### 1.5 ai-tracker-command-palette.js · ai-tracker-map-generator.js · ai-tracker-sprint-project.js · env.js

| Función / Bloque | Qué hace realmente | Deuda técnica detectada | Severidad |
|---|---|---|---|
| `_getAllBacklogItems` (CP) | Lee backlog de localStorage por proyecto activo | Si `getActiveProject()` devuelve null, usa clave genérica `'backlog-items'` — inconsistente con `_tplKey()` que usan otros módulos. Puede leer el backlog incorrecto. | **Alta** |
| `_cpSearchContext` (CP) | Busca texto en el raw del CONTEXT del proyecto activo | Usa `'context-raw'` como key en localStorage; el resto de la app usa `getProjContext()`. Dos fuentes de verdad distintas para el mismo dato. | **Alta** |
| `action-search-context` comando (CP) | Navega al sub-tab contexto | Llama `switchTab('backlog')` sin prefijo `'tab-'` — inconsistente con todos los demás comandos que usan `'tab-backlog'`. Si `switchTab` valida el ID exacto, el comando falla silenciosamente. | **Alta** |
| `_buildDynamicCommands — proyectos` (CP) | Genera comandos dinámicos por proyecto activo | Accede a `window.state.projects` directamente, y también comprueba `getActiveProject()`. Doble punto de acceso sin garantía de consistencia. | Media |
| `_cpOnListClick` (CP) | Ejecuta comando al hacer click en resultado | Usa `parseInt(item.dataset.idx)` para indexar `_cp.results`. Si los resultados cambian entre mouseover y click, el índice puede quedar desincronizado. | Media |
| `_buildCommandRegistry — action-new-item` (CP) | Abre editor de ítem nuevo | `setTimeout` de 150ms hardcodeado para esperar el cambio de tab antes de abrir el editor. Frágil ante cambios de velocidad de render. | Baja |
| `action-use-template` (CP) | Navega a backlog y abre template picker | Doble `setTimeout` anidado (150ms + 120ms). Race condition potencial si `switchTab` o `openItemEditor` son lentos. | Baja |
| `_mgBuildPlan — emisión de bloque` (MG) | Genera bloque `---PLAN---` (formato legacy) | Emite `---PLAN---` / `---PLAN-END---` en lugar de `---EXECUTION-PLAN---` / `---EXECUTION-PLAN-END---` que define Base Rules §9a. El bloque generado es incompatible con el parser activo de PP. | **Alta** |
| `_generateContext — stack rewrite` (MG) | Reescribe referencias a Firebase en el stack por Supabase | Regex en texto libre puede hacer match en nombres de variables o comentarios legítimos que contengan "Firebase Firestore". | Media |
| `_mgInferStatus` (MG) | Infiere estado operativo del proyecto | Detecta `'closing'` comprobando visibilidad del modal `#close-sprint-modal` por tres checks inconsistentes entre sí (classList, style.display, aria-hidden). Uno puede ser true cuando otro es false. | Media |
| `_mgLoadFiles — deduplicación` (MG) | Carga archivos al dropzone | Deduplica por nombre exacto únicamente. Si el usuario sube una versión actualizada del mismo archivo, la versión anterior persiste sin warning. | Media |
| `_mgApplyBumpedVersion` (MG) | Persiste versión bumpeada y actualiza DOM | Escribe la key de localStorage directamente con string literal en lugar de usar la constante — acoplamiento implícito entre módulos. | Media |
| `_docPrefix` (SP) | Retorna prefijo del proyecto activo | `_PREFIX_MAP` contiene `'Obsidiana': 'OB'` — nombre y prefijo legacy. `'Obsidian Labs': 'OL'` ausente. Todos los exports del holding usan prefijo legacy `'OB'`. | **Alta** |
| `_generateBacklogMd — contadores` (SP) | Calcula contadores máximos de IDs por tipo | `ITEMS[i].code[0]` asumido siempre válido — si `code` es null/undefined, `code[0]` lanza TypeError. No hay guard. | Media |
| `_buildCurrentStateMd` (SP) | Genera bloque `## Estado actual` para el backlog exportado | Accede a `state.sprints` directamente. `state.sprints` y `getActiveSprints()` pueden devolver datos distintos si hay transformación intermedia. | Media |
| `_generateSprintsExportMd — _itemRow` (SP) | Genera fila de ítem en tabla de sprint | `i.code[0]` sin guard — mismo riesgo de TypeError que `_generateBacklogMd`. | Media |
| `selectProjectFilter / clearProjectFilter` (SP) | Cambia filtro activo de proyecto y re-renderiza | Ambas funciones llaman la misma secuencia de 7 funciones de render. El bloque no está extraído en una función reutilizable. Duplicación de lógica de refresh. | Baja |
| `Keyboard shortcut Ctrl+K` (SP y CP) | Abre búsqueda global o command palette | Dos listeners de keydown para Ctrl+K en el mismo documento: uno en `ai-tracker-sprint-project.js` y otro en `ai-tracker-command-palette.js`. El listener de CP (fase capture) gana siempre por `e.preventDefault()`. | **Alta** |

### 1.6 index.html

| Función / Bloque | Qué hace realmente | Deuda técnica detectada | Severidad |
|---|---|---|---|
| `HEAD — carga de dependencias` | Carga env.js, Supabase SDK, JSZip y hojas CSS | `env.js` y Supabase SDK declarados sin `defer/async` — bloqueantes de renderizado. Estrategia de carga inconsistente entre dependencias. | Media |
| `<html lang="es" data-theme="light">` | Declara idioma y tema inicial | `data-theme="light"` hardcodeado. Si el usuario tiene dark guardado en localStorage, `patchApplyTheme` lo corrige tarde en `DOMContentLoaded` — flash of incorrect theme garantizado en cada carga. | Media |
| `Inline script block 1` | Controla búsqueda animada, badge de backup, init de CP y trigger de resumen semanal | Lógica de aplicación en bloque `<script>` inline dentro del HTML. Referencias a IDs inexistentes: `#backup-badge` y `#version-pill` no están en el DOM. | **Alta** |
| `Inline script block 2 (patchApplyTheme IIFE)` | Monkey-patch de `applyTheme` para forzar setAttribute en `<html>` | Parche inline que corrige un contrato roto en el .js externo. La corrección debería vivir en la fuente, no en el HTML. | **Alta** |
| `Tab Tracker — #tracker-sidebar (legacy)` | Preserva IDs para backward compat | DOM vacío mantenido por acoplamiento oculto con JS. Tres contenedores que nunca renderizan contenido visible. Deuda estructural de refactorización incompleta. | Media |
| `Tab Backlog — #toolbar (legacy)` | Declarada "mantenida por compatibilidad con JS que la referencia" | `style="display:none"` inline en elemento estático — viola CSS Purity §15. Dead DOM con coupling a JS no trazable desde HTML. | **Alta** |
| `Tab Backlog — #btn-import-backlog` | Botón de importación de backlog deshabilitado permanentemente | `style="display:none"` inline en elemento estático — viola CSS Purity §15. Feature declarado deprecado pero sigue en DOM activo. | **Alta** |
| `Tab Backlog — #item-type select` | Selector de tipo de ítem en formulario de creación | Opción duplicada para "Idea": `value="I"` (L895) antes de `value="P"`. Base Rules §5 define solo `"P"` como tipo Idea válido. El tipo `"I"` no existe en el sistema. | Media |
| `Reset backlog modal (#reset-backlog-overlay)` | Confirmación de reset total del backlog con verificación de texto | Lógica de validación (comparación de string, toggle de clase, texto de error) embebida en atributo `oninput` inline. Viola separación HTML/JS §17. | **Alta** |
| `#cp-overlay y #cmd-palette-overlay` | Dos implementaciones del command palette | Implementación completa duplicada coexiste en DOM. `#cmd-palette-overlay` es dead code estructural con `closeCommandPalette()` en conflicto con la implementación activa `#cp-overlay`. | **Alta** |
| `Inline <style> blocks (×4)` | Estilos para shortcuts/CP, tracker views, cronómetro/weekly modal, user chip | Cuatro bloques `<style>` embebidos en HTML en lugar de archivos .css. Viola CSS Purity §15. Uno tiene comentario explícito "migrar a ai-tracker-extra.css". | **Alta** |
| `#global-footer — gf-pulso span` | Indicador visual del Pulso del Ecosistema | `style="cursor:pointer"` inline en elemento estático — viola CSS Purity §15. | **Alta** |
| `Botones "⚙ Gestionar" y "+ Nuevo proyecto"` en panel de proyectos | Navegan al mismo handler | `closeProjPanel();openProjModal()` — labels diferentes, comportamiento indistinguible. | Baja |
| Comentarios de tickets done/deprecados | Referencias históricas a trabajo completado o removido | ≥5 comentarios sin valor activo: DEPRECATED T-202604-254, T-202605-491, T-202604-423, R-202604-086, T-202604-324. Ruido de lectura que oscurece el estado real del archivo. | Baja |

### 1.7 Resumen Fase 1

| Severidad | Total de hallazgos |
|---|---|
| Alta | ~35 |
| Media | ~55 |
| Baja | ~25 |
| **Total** | **~115** |

> Nota: Los hallazgos de severidad alta incluyen los 7 bugs críticos confirmados por Finn en Fase 2 (_scmRender, #cmd-palette-overlay, item-type I, openQuickNote, _doSaveSession pre-push, CANONICAL_PROJECTS, _hasStaleSuggestion).

---

## 2. Fase 2 · Finn — Auditoría funcional

### 2.1 Sesión 2a — ai-tracker-backlog.js (flujos core)

| Flujo | Subfunción | AC verificado | Gap de especificación | Bug detectado | Tipo | Pasos reproducibles |
|---|---|---|---|---|---|---|
| Carga de backlog | ITEMS IIFE — migración inline | No hay AC escrito | AC ausente: migración duplicada (IIFE + `loadBacklog`) sin criterio de idempotencia | Sin feedback al usuario si proyecto activo no está en localStorage — ITEMS arranca vacío silenciosamente | Menor | 1. Abrir PP con `current-project-filter` apuntando a proyecto sin datos. 2. Observar: ITEMS = []. Sin toast, sin aviso. |
| Carga de backlog | `loadBacklog()` — saveBacklog incondicional | No hay AC escrito | AC ausente: no hay criterio sobre cuándo `saveBacklog` debe o no dispararse | `saveBacklog()` se llama al final de `loadBacklog()` aunque `migrated = false` y `sanitized = 0` | Menor | 1. Cargar PP con backlog limpio ya migrado. 2. Observar Network/Storage: `saveBacklog()` se dispara en cada carga. |
| Carga de backlog | `loadBacklog()` — dependencia `_normalizeStatus` | No hay AC escrito | AC ausente: comportamiento si `_normalizeStatus` no está disponible no está definido | Si `_normalizeStatus` es undefined, la migración de status falla sin feedback | Mayor | 1. Remover/renombrar `_normalizeStatus`. 2. Llamar `loadBacklog()`. 3. Error no visible al usuario, ITEMS cargados sin normalización. |
| Carga de backlog | `_sanitizePendingInClosedSprints()` — segunda pasada doneAt | No hay AC escrito | AC ausente: el fix sintomático de doneAt mismatch no tiene criterio binario de cuándo aplica | Ítems cuyo status fue sobreescrito por merge reciben `status = done` forzado sin `_undoSnapshot()` | Mayor | 1. Crear ítem con `doneAt` populado pero `status = 'pendiente'` (simular merge corrupto). 2. Llamar `loadBacklog()`. 3. Status corregido a done. 4. Intentar undo — la corrección no aparece en el stack. |
| Merge de CHECKPOINT | `mergeBacklogFromTG()` — cierre automático P padre | No hay AC escrito | AC ausente: comportamiento del cierre automático del P padre no está especificado | Cierre automático del P padre aplica `status = 'done'` sin `_undoSnapshot()` previo — no deshacible | Mayor | 1. Tener ítem P con `status = pendiente`. 2. Pegar CHECKPOINT con ítem hijo que tiene `origin = código del P`. 3. Aplicar merge. 4. P queda cerrado. 5. Intentar undo — el cierre del padre no revierte. |
| Merge de CHECKPOINT | `showMergeDiffPanel()` — window.* leak | No hay AC escrito | AC ausente: no hay criterio de que las funciones del panel deben sobrevivir entre aperturas | `window._mdiff*` se redefinen en cada apertura del panel — closures del anterior quedan reemplazadas | Menor | 1. Abrir merge diff panel. 2. Sin cerrarlo, abrir otro panel (forzar desde consola). 3. Funciones `window.*` apuntan al segundo contexto. |
| Merge de CHECKPOINT | `showMergeDiffPanel()` — dryRun cambia project filter | No hay AC escrito | AC ausente: no hay criterio de que el filter debe restaurarse si la carga en dryRun falla | Si `mergeBacklogFromTG` lanza excepción dentro del try, el `finally` puede dejar el filter en estado indeterminado | Mayor | 1. Configurar `_loadFromSupabase` para lanzar error. 2. Pegar CHECKPOINT con `projId` distinto al activo. 3. Project filter puede quedar modificado. |
| Cambio de status | `setItemStatus()` — orden log/snapshot | No hay AC escrito | AC ausente: no hay criterio de orden entre registro de log y snapshot de undo | `_blogLog` se llama en L1175 antes de `_undoSnapshot()` en L1176 — log y estado desincronizados en undo | Menor | 1. Cambiar status de ítem. 2. Ejecutar `undoBacklog()`. 3. Estado revierte. 4. Log registra el cambio que no ocurrió efectivamente. |
| Cambio de status | `_recalcAllScores()` — O(n×m) en hot path | No hay AC escrito | AC ausente: no hay criterio de performance sobre recalculación de scores | `_calcRelevanceScore` llama `getAllSessions()` por cada ítem en cada evaluación. O(n×m) sin caché | Mayor | 1. Cargar backlog con 200+ ítems pendientes y 50+ sesiones. 2. Cambiar status de cualquier ítem. 3. UI se congela durante el recalculo. |
| Cambio de status | `_calcPriority()` — effort 1 en sprint cerrado | Parcialmente | AC ausente: no se especifica que sprints cerrados deben excluirse del cálculo | Regla 3 de `_calcPriority`: effort 1 → high se evalúa si `item.sprint` tiene cualquier valor incluyendo sprint cerrado | Menor | 1. Ítem pendiente en sprint cerrado con `effort = 1`. 2. Llamar `loadBacklog()`. 3. Ítem recibe `priority = high`. |
| Cierre de sprint | `_scmRender()` — isLast siempre 3 | No hay AC escrito | AC ausente: no hay criterio binario de que el último paso con `skipStep2 = true` debe ser 2, no 3 | `isLast = step === (skipStep2 ? 3 : 3)` — ambas ramas son 3. El botón "Cerrar sprint" solo aparece en step 3, que nunca renderiza contenido correcto con `skipStep2=true` | **Crítico** | 1. Iniciar cierre de sprint sin ítems pendientes (`skipStep2 = true`). 2. Llegar al paso 2 (último efectivo). 3. Botón muestra "Siguiente →" — no hay forma de cerrar el sprint desde la UI. |
| Cierre de sprint | `_scmStep1Html()` — doble fuente de verdad _scmState | No hay AC escrito | AC ausente: no hay criterio de que `_scmState` debe accederse solo por parámetro o solo como global | `_scmStep1Html` accede `_scmState` directamente como global y también recibe `sp` (derivado de `_scmState`) como parámetro | Menor | 1. Modificar `_scmState` externamente entre la llamada a `_scmRender` y el render del HTML. 2. Métricas usan `_scmState` global actualizado pero `spLabel` usa el valor anterior. |

### 2.2 Sesión 2b — ai-tracker-backlog.js (render, DnD, focus)

| Flujo | AC verificado | Gap de especificación | Bug detectado | Tipo | Pasos reproducibles |
|---|---|---|---|---|---|
| `buildBacklogItem` — colapso/expansión | Parcial | Sin AC para comportamiento cuando `openItemPanel()` falla | `item.desc` renderizado en `bitem-body` pero `desc` no es campo canónico (schema v1 usa `title`) — ítems legacy con `desc` muestran contenido fantasma | Menor | 1. Ítem con campo `desc` pero sin `title`. 2. Expandir ítem. 3. Se renderiza `bitem-desc` con contenido de `desc`. |
| `buildBacklogItem` — hijos y progreso (tipo R) | Parcial | Sin AC para progreso cuando los hijos no pasan los filtros activos | Porcentaje de progreso calculado sobre hijos que pasan filtros activos, no sobre total de hijos — puede mostrar 100% con hijos ocultos | Mayor | 1. R con 4 hijos: 2 done, 2 descartado. 2. Activar filtro `status=done`. 3. `pct = 100%`. 4. Filtro `status=pendiente`: `children` vacío — bloque no renderiza. |
| `_buildChildrenBlock` — IDs de DOM desfasados | No (confirmado de Fase 1) | Sin AC para estabilidad de IDs de DOM tras mutación de ITEMS | `cIdx = ITEMS.indexOf(child)` capturado al render. Si ITEMS muta sin re-render, `toggleItemExpand(cIdx)` abre el ítem incorrecto | Mayor | 1. R con 2 hijos renderizados. 2. Aplicar undo que reordena ITEMS. 3. Sin re-render, clic en flecha de hijo. 4. Se expande ítem incorrecto. |
| `_attachBacklogDnD` — activación | No (confirmado de Fase 1) | Sin AC declarando que DnD es inactivo como estado intencionado | `backlogSortMode` se inicializa en `'priority'` — el valor `'sprint'` fue deprecado. La condición de activación de DnD nunca es `true`. El drag handle ⠿ se renderiza pero arrastrarlo no hace nada | Mayor | 1. Ítem con sprint asignado. 2. Ver drag handle ⠿ en header. 3. Intentar arrastrar. 4. Sin efecto. |
| Item editor — apertura | No verificable | Gap crítico — `openItemEditor()` se llama desde múltiples puntos pero no está definida en `ai-tracker-backlog.js`. Sin guardia de existencia | Sin `typeof openItemEditor === 'function'` en ninguna llamada inline. Error JS no manejado en producción si el módulo externo no carga | Mayor | 1. Cargar PP sin el módulo que define `openItemEditor`. 2. Clic en cualquier botón "✎ Editar". 3. `ReferenceError: openItemEditor is not defined` — sin feedback al usuario. |
| Focus mode — activación por shortcut | No | Sin AC que declare cuál de los dos focus modes activa el shortcut | Cmd+F llama `toggleFocusMode()` (panel focus), no `toggleBacklogFocusMode()` (Top-10). Con panel cerrado, el shortcut no produce cambio visual perceptible | Mayor | 1. Tab Backlog activo, sin ítem expandido. 2. Cmd+F. 3. `_focusModeActive = true` pero sin panel visible. Sin cambio visual. |
| Focus mode — filtro visual y desactivación | Parcial | Sin AC para comportamiento de Esc cuando ambos focus modes están activos | `_backlogFocusMode` y `_focusModeActive` son independientes sin sincronización. Esc solo maneja `_focusModeActive` | Menor | 1. Activar Focus Top-10. 2. Expandir ítem → panel abre. 3. Activar Focus mode del panel. 4. Presionar Esc. 5. Solo se desactiva `_focusModeActive`. |
| `_initFocusShortcut` — cleanup | No (confirmado de Fase 1) | Sin AC para cleanup de listeners en hot reload | Listener de keydown en `document` sin mecanismo de limpieza. En hot reload, acumula listeners adicionales | Menor | 1. Hot reload del módulo. 2. Cmd+F dispara N veces `toggleFocusMode()` — N = número de recargas. |

### 2.3 Sesiones 2c, 2c-bis — ai-tracker-session.js + ai-tracker-ai-notes.js

| Flujo | Módulo | Bug detectado | Tipo | Pasos reproducibles |
|---|---|---|---|---|
| Apertura — parsePaste detect. CHECKPOINT | session.js | `CANONICAL_PROJECTS` contiene `'Obsidiana Labs'` y `'Obsidiana'` — strings deprecados. CHECKPOINTs con `Proyecto: Obsidiana Labs` pasan validación como correctos | Gap → Cael | Pegar CHECKPOINT con `Proyecto: Obsidiana Labs` → `parsePaste` valida como correcto. |
| Apertura — comparación proyecto inconsistente | session.js | Comparación proyecto en L1669 es `toLowerCase()` pero `CANONICAL_PROJECTS` es case-sensitive — comportamiento inconsistente | Mayor | 1. Card con proyecto "ASVAB App". 2. Pegar CHECKPOINT con `Proyecto: asvab app` (minúsculas). 3. Modal Continuar/Cancelar inesperado. |
| Registro actividad — tracker legacy tipo I | session.js | Regex L1876 usa `[PITRB]` — tipo `'I'` inexistente. Ítems con código `'I-...'` incrementan contadores incorrectamente | Mayor | 1. Crear ítem con `code I-202605-001` en `---ITEMS---`. 2. Guardar sesión. 3. `tracker.counters[I]` se incrementa. |
| Cierre — newSess pre-guardado | session.js | `newSess` push a `activeProj.sessions` ocurre ANTES de `showMergeDiffPanel`. Si el usuario cancela, sesión queda persistida sin `tgItems` mergeados | **Crítico** | 1. Pegar CHECKPOINT con ítems. 2. Guardar. 3. Panel MergeDiff aparece. 4. Clic en Cancelar. 5. `activeProj.sessions` contiene la sesión sin ítems mergeados. |
| Resumen semanal — buildBacklogMd | session.js | `buildBacklogMd` itera sobre `item.code[0]` — ítems con `code [pendiente-ID]` se clasifican en `byType['[']` y se pierden silenciosamente del reporte | Mayor | 1. Tener ítems con `code [pendiente-ID]`. 2. Llamar `buildBacklogMd()`. 3. Los ítems no aparecen en ninguna sección del Markdown generado. |
| Resumen semanal — display desc vs title | session.js | `buildBacklogMd` renderiza `item.desc` en lugar de `item.title`. Ítems con solo `title` (schema v1) aparecen como `### code · undefined` | Mayor | 1. Tener ítems con `schema_version 1` (campo `title`, sin `desc`). 2. Llamar `buildBacklogMd()`. 3. Las filas muestran `undefined`. |
| Render — _rebuildLogBody scroll listener acumulado | session.js | Listener de scroll se registra en cada llamada sin remover el anterior. `_doApplyMergeAndFinish` genera mínimo 2 acumulaciones por sesión guardada | Mayor | 1. Guardar sesión con ítems. 2. `_rebuildLogBody()` L1953: listener 1 registrado. 3. `render()` en rAF L1960 → monkey-patch → `_rebuildLogBody()` → listener 2. Con 10 guardados: 20+ listeners activos. |
| Render — _buildLogHeader color sin nombre de atributo | session.js | `${color}` interpolado directamente como atributo sin nombre — HTML malformado: `<button class="log-ai-pill" #38bdf8 onclick=...>`. Color del pill nunca aplica | Mayor | 1. IA con color asignado. 2. Abrir Log de sesiones. 3. Inspeccionar DOM del pill de IA. 4. Atributo `#rrggbb` sin nombre. |
| Búsqueda — click en resultado de quickNote | ai-notes.js | `openQuickNote()` no está definida en módulo — ReferenceError al click en cualquier resultado de nota *(reclasificada en 2d: función existe en ai-tracker-checkpoint.js — prioridad pendiente de reevaluación de orden de carga)* | Crítico (reclasificado) | 1. Tener al menos una quickNote. 2. Buscar término que matchee. 3. Click en resultado. 4. Posible `ReferenceError` si módulo no carga en orden correcto. |
| Búsqueda — click en nota en panel de proyecto | ai-notes.js | Misma dependencia de `openQuickNote()` | Crítico (reclasificado) | 1. Tab Proyectos. 2. Click en cualquier nota en sección "Notas". 4. Posible `ReferenceError`. |
| Editor — autofill acepta tipo I inválido (CHECKPOINT line) | ai-notes.js | Regex `[PTRBI]` acepta `'I'` como tipo válido. Ítem creado con `type='I'` sin error | Mayor | 1. Abrir editor nuevo. 2. Pegar en campo `desc`: `I: [pendiente-ID]: Mi idea`. 3. Autofill ocurre. 4. Guardar. Ítem con `type='I'`. |
| Editor — autofill acepta tipo I inválido (Markdown) | ai-notes.js | Mismo patrón — regex `/^###\s+(?:[PTRBI]-\d{6}-\d{3})/` acepta `I` | Mayor | 1. Abrir editor. 2. Pegar bloque `### I-202605-001 · Título`. 3. Autofill popula `type=I`. |
| Búsqueda — quickNotes no respetan scope de proyecto activo | ai-notes.js | `noteMatches` filtra `state.quickNotes` globalmente aunque scope = "Proyecto activo" | Mayor | 1. Notas en proyecto A y proyecto B. 2. Seleccionar proyecto A como activo. 3. Buscar término que matchea nota de proyecto B. 4. Nota de proyecto B aparece. |

### 2.4 Sesión 2d — ai-tracker-checkpoint.js

| Flujo | AC verificado | Bug detectado | Tipo | Pasos reproducibles |
|---|---|---|---|---|
| CHECKPOINT display — panel vacío sin feedback | No | Si `sections.length === 0` y no hay `proximoPaso/decision`, `showCheckpointPanel` retorna sin abrir panel. El usuario no recibe ningún feedback de que el CHECKPOINT fue procesado vacío | Menor | 1. Pegar CHECKPOINT sin ítems y sin Próximo paso ni Decisión. 2. Panel no se abre. 3. Sin toast ni señal. |
| CHECKPOINT display — downloadTemplates sin typeof guard | No | L800 llama `downloadTemplates()` directamente sin `typeof` guard — `ReferenceError` si módulo no cargó. Patrón idéntico al confirmado en 2b/2c | **Crítico** | 1. Cargar PP sin módulo que define `downloadTemplates`. 2. Pegar CHECKPOINT con ítems en retroceso. 3. Confirmar diff. 4. `_ckptDiffApplyAll()` → `downloadTemplates()` → `ReferenceError`. |
| Parser ---ITEMS--- — _assignPendingIds slug collision | No | `_slugify(null)` devuelve `'item'`. Todos los ítems sin `desc/title` obtienen slug `'item'`. El segundo ítem con slug `'item'` toma el código del primero — ítem distinto mapeado al código equivocado silenciosamente | Mayor | 1. CHECKPOINT con dos ítems sin `title` ni `desc`. 2. Ambos tienen `code [pendiente-ID]`. 3. El segundo ítem toma el código del primero. |
| Parser ---ITEMS--- — buildTGPreview usa i.desc no i.title | No | `buildTGPreview` renderiza `i.desc` en columna descripción. Si el ítem solo tiene `title` (schema v1 canónico), la columna aparece vacía en el panel de preview | Mayor | 1. CHECKPOINT con ítems que solo tienen `title`. 2. `buildTGPreview` renderiza celdas vacías en la columna de descripción. |
| EXECUTION-PLAN display — _isBlocked dep IDs inexistentes | No | Si `depende_de` contiene un ID que no existe en `_allSessions`, la sesión queda bloqueada permanentemente sin mensaje al usuario | Menor | 1. Plan con sesión A que `depende_de: ['sess-inexistente']`. 2. `_isBlocked(A)` → `deps.every(d => _doneIds.has(d))` es false → A aparece como bloqueada. Sin warning. |
| Warning message — referencia a ---PLAN--- legacy | No | L7356 emite `"edita el bloque ---PLAN--- antes de copiar"`. El string canónico activo es `---EXECUTION-PLAN---` (Base Rules §9a) | Menor | 1. Plan con campos faltantes. 2. Warning muestra `"edita el bloque ---PLAN---"`. Esperado: `"edita el bloque ---EXECUTION-PLAN---"`. |
| Export — handlePaste sin typeof guard en HTML inline | No | L4868 `onpaste="handlePaste('${ai.id}')"` — sin `typeof` guard. Si el módulo no cargó, pegar en el textarea produce `ReferenceError` sin toast | Mayor | 1. Cargar PP sin módulo que define `handlePaste`. 2. Pegar en textarea del card. 3. `ReferenceError` sin feedback. |

### 2.5 Sesión 2e — ai-tracker-sprint-project.js

| Flujo | Bug detectado | Tipo | Pasos reproducibles |
|---|---|---|---|
| `_docPrefix` — 'Obsidian Labs' no en _PREFIX_MAP | `_PREFIX_MAP` contiene `'Obsidiana': 'OB'` — sin entrada `'Obsidian Labs': 'OL'`. Todos los exports del holding usan prefijo legacy `'OB'` | Mayor | 1. Crear proyecto `'Obsidian Labs'`. 2. `exportBacklogMd()` → filename comienza con `OB-BACKLOG_...` en lugar de `OL-BACKLOG_...`. |
| `_generateBacklogMd` contadores — code[0] sin guard | `ITEMS[i].code[0]` sin guard — si `code` es `null/undefined`, lanza TypeError. Export falla sin toast ni fallback | Mayor | 1. Inyectar ítem con `code:null` en ITEMS. 2. `exportBacklogMd()`. 3. TypeError sin error en consola visible al usuario. |
| `_buildCurrentStateMd` — code[0] sin guard | Mismo riesgo de TypeError que `_generateBacklogMd` | Mayor | Mismo que anterior — en sección Estado actual del export. |
| Export activo — criterio de sprint activo inconsistente | `_buildCurrentStateMd` ignora `status='open'`. `_generateBacklogMd` lo incluye. El export puede tener header sin sprint activo pero ítems filtrados por ese sprint | Mayor | 1. Sprint con `status='open'`. 2. `exportBacklogMd()`. 3. Estado actual no muestra el sprint pero ítems done del sprint están incluidos en el filtro. |
| Ctrl+K doble listener | `ai-tracker-sprint-project.js` L630 registra `keydown Ctrl+K` en fase bubble. `ai-tracker-command-palette.js` registra listener en fase capture con `e.preventDefault()`. El listener de CP siempre gana — el de SP nunca ejecuta | Mayor | 1. Cargar PP con ambos módulos. 2. Ctrl+K → CP se abre. 3. `#search-global` nunca abre. Comportamiento no determinístico según orden de carga. |
| `openProjModal/closeProjModal/openProjPanel/closeProjPanel` — sin null guard | Acceso a `classList` directamente sin null guard en elementos del modal | Menor | Si `#proj-modal-overlay` o `#proj-panel-overlay` no existe en DOM → TypeError silencioso. |
| `_renderProjList` archived toggle — JS inline | Lógica JS multi-sentencia embebida como string en `onclick` de `innerHTML` | Menor | 1. Inspeccionar DOM. 2. Botón `.proj-archived-toggle` → `onclick` contiene `var k=...; var now=...; localStorage.setItem(...)` como string inline. |
| `cleanupLocalStorage / testLocalStorageQuota` en producción | Funciones de debug expuestas globalmente sin flag de entorno. `cleanupLocalStorage()` puede eliminar `current-project-filter` desde consola sin confirmación | Menor | 1. Abrir consola del browser en PP producción. 2. `cleanupLocalStorage()`. 3. Proyecto activo se pierde. |

### 2.6 Sesión 2f — ai-tracker-command-palette.js + ai-tracker-map-generator.js

| Flujo | Bug detectado | Tipo | Pasos reproducibles |
|---|---|---|---|
| CP-3: Comandos de navegación — switchTab sin prefijo | `action-search-context` (L158) y `_cpSearchContext` (L310) llaman `switchTab('backlog')` — sin prefijo `'tab-'`. Si `switchTab` valida el ID exacto, el tab no cambia | Mayor | 1. Ctrl+K → buscar "contexto". 2. Seleccionar "Buscar en contexto". 3. `switchTab('backlog')` ejecuta — tab puede no cambiar. 4. `switchSubTab('context')` puede ejecutar sobre tab incorrecto. |
| CP-4: _buildDynamicCommands IAs — switchTab sin prefijo | `switchTab('tracker')` sin prefijo en L210 — mismo patrón que action-search-context | Menor | 1. Buscar "nueva sesión" en CP. 2. Ejecutar comando. 3. `switchTab('tracker')` sin prefijo — tab puede no cambiar. |
| CP-5: Ctrl+K — capture vs bubble | `initCommandPalette()` registra listener en fase capture con `e.preventDefault()`. `ai-tracker-sprint-project.js` registra en fase bubble. CP siempre gana por precedencia de fase | Mayor | 1. Ctrl+K → CP abre siempre. 2. `#search-global` nunca abre — `e.preventDefault()` en capture fase evita que el listener de SP en bubble ejecute. |
| MG-2: _mgBuildPlan — formato legacy | `_mgBuildPlan` L589 emite `---PLAN---` / `---PLAN-END---`. Base Rules §9a define `---EXECUTION-PLAN---` como formato activo. El plan generado no es ingerido por el parser activo de PP | Mayor | 1. Map Generator → marcar "Plan" → Generar. 2. Documento comienza con `---PLAN---`. 3. PP no ingesta el bloque — toast de warning. |
| MG-5: _mgInferStatus — tres checks inconsistentes | Tres checks para detectar el modal activo: `classList.contains('modal--open')` OR `style.display === 'flex'` OR `getAttribute('aria-hidden') === 'false'`. Pueden tener valores contradictorios simultáneamente | Mayor | 1. `#close-sprint-modal` con `classList.contains('modal--open') = true` pero `aria-hidden='true'`. 2. `openMapGenerator()`. 3. `_mgInferStatus` → `'closing'`. 4. Botón Generar deshabilitado incorrectamente. |
| MG-1: _mgLoadFiles — deduplicación silenciosa | Si el usuario sube versión actualizada del mismo archivo, la versión anterior persiste sin warning. El MAP se genera con la versión antigua | Menor | 1. Arrastrar `archivo.js`. 2. Arrastrar versión actualizada del mismo archivo. 3. El MAP refleja la versión antigua. |
| MG-3: _mgExportAllZip — comentario contradictorio | `exportFullHistoryMd` excluida del ZIP sin warning. Comentario en L1407 sugiere que sería el comportamiento esperado pero contradice el código | Menor | 1. `_mgExportAllZip()`. 2. ZIP descargado. 3. `exportFullHistoryMd` ausente del ZIP — sin warning. |
| MG-4: confirmMapGenerator — sin instrucción post-warning | Si no hay sprint cerrado, showToast de warning se muestra y la función retorna. El modal permanece abierto sin instrucción de qué hacer | Menor | 1. Abrir PP sin sprints cerrados. 2. Generar documentos. 3. Toast: "Cierra un sprint antes de confirmar". 4. Modal permanece abierto sin acción disponible clara. |

### 2.7 Sesión 2g — index.html + CSS

| Flujo | Bug detectado | Tipo | Pasos reproducibles |
|---|---|---|---|
| H-1: Carga inicial — flash of incorrect theme | `<html data-theme="light">` hardcodeado. `patchApplyTheme` corrige en `DOMContentLoaded` — paint inicial ocurre con `light` independientemente del tema guardado | Mayor | 1. Guardar tema dark en localStorage. 2. Recargar página. 3. Flash de tema claro antes de que `patchApplyTheme` ejecute. |
| H-1b: defer/async inconsistente | `env.js` y Supabase SDK sin `defer/async` — bloqueantes de renderizado. Los 7 módulos de app tampoco tienen `defer/async`. Estrategia inconsistente | Menor | 1. Inspeccionar HEAD. 2. `env.js` L13 y Supabase L14 — sin `defer/async`. 3. DevTools Performance: bloqueo de parser en cada carga. |
| H-2: DOM duplicado — command palette | `#cp-overlay` (activo) coexiste con `#cmd-palette-overlay` (dead DOM). `closeCommandPalette()` en el overlay eliminado puede entrar en conflicto con la función del módulo activo. Riesgo de shadowing | **Crítico** | 1. Ctrl+K → `openCommandPalette()` abre `#cp-overlay`. 2. Inspeccionar `#cmd-palette-overlay` — presente en DOM pero nunca activado. 3. Verificar `closeCommandPalette()` — ¿opera sobre overlay distinto al que abre `openCommandPalette()`? |
| H-3c: reset-backlog-modal oninput | Lógica multi-sentencia en `oninput` inline — 5 operaciones de DOM en atributo HTML. Viola separación HTML/JS §17 | Mayor | 1. Abrir reset modal. 2. Inspeccionar input `#reset-backlog-input`. 3. `oninput` contiene lógica JS no trivial. |
| H-4: Inline styles — CSS Purity §15 | Tres violaciones: (1) `#btn-import-backlog style="display:none"`. (2) `#toolbar style="display:none"`. (3) `#gf-pulso style="cursor:pointer"`. | Mayor | `grep 'style=' index.html` → tres coincidencias con propiedades de presentación. |
| H-5: Opción tipo 'I' en #item-type select | `<option value="I">I — Idea</option>` es la primera opción (default). Ítems creados sin cambiar selector tienen `type='I'` inválido. `_assignPendingIds` rechaza el ítem sin toast | **Crítico** | 1. Abrir editor de ítem. 2. Guardar sin cambiar tipo → `item.type = 'I'`. 3. Downstream: `buildBacklogMd`, tracker legacy — ítem ignorado o mal clasificado. |
| CSS-1: --font-sans re-declarado globalmente | `ai-tracker-extra.css` L17214 re-declara `--font-sans` con `!important` en bloque macOS Fidelity como `:root` global (sin scope de plataforma). Aplica a todos los usuarios, no solo macOS | Mayor | 1. Cargar PP en Windows/Chrome. 2. Inspeccionar `--font-sans` — valor es `-apple-system, BlinkMacSystemFont…` (macOS stack), no `'DM Sans'`. |
| CSS-2: breakpoints 900px/899px y 600px/601px | `@media (max-width: 900px)` y `@media (max-width: 899px)` — gap de 1px en viewport exacto de 900px. `@media (min-width: 601px)` y `@media (max-width: 600px)` — viewport exacto de 600px puede caer en ambos. ~45 instancias hardcodeadas sin variables CSS | Menor | 1. Viewport exacto 900px → ningún breakpoint aplica. 2. Viewport exacto 600px → puede aplicar ambos bloques. |
| CSS-3: color-mix() sin @supports | 175 instancias de `color-mix(in srgb, ...)`. Ninguna wrapped en `@supports`. Sin fallback. No soportado en Safari < 16.2, Firefox < 113, Chrome < 111 | Mayor | 1. Abrir PP en Safari < 16.2. 2. Badges de tipo de ítem, sprint headers, heatmap — colores de fondo ausentes. |
| CSS-4: backdrop-filter sin -webkit-backdrop-filter | 3 instancias sin par webkit: `#ckpt-panel` (L662), `.quick-note-overlay` (L3717), overlay genérico (L9759). Safari < 15.4 no aplica blur en estos elementos | Menor | 1. Abrir PP en Safari < 15.4. 2. Paneles afectados — sin efecto blur. |
| CSS-5: background-attachment: fixed en dark body sin override mobile | `[data-theme="dark"] body` tiene `background-attachment: fixed`. Sin `@media` que lo desactive. Scroll jank garantizado en iOS/Android con tema oscuro | Mayor | 1. Abrir PP en iOS (Safari) o Android con tema dark. 2. Scroll → jank visual pronunciado. |

### 2.8 Resumen Fase 2 — Consolidado por sesión

| Sesión | Módulo | Críticos | Mayores | Menores | Obs. | Gaps de AC |
|---|---|---|---|---|---|---|
| 2a | ai-tracker-backlog.js | 1 | 4 | 7 | 0 | 12 |
| 2b | ai-tracker-backlog.js (render/DnD/focus) | 0 | 4 | 3 | 1 | 8 |
| 2c (1ª) | ai-tracker-session.js | 1 | 5 | 4 | 2 | 10 |
| 2c (2ª) | ai-tracker-session.js + ai-tracker-ai-notes.js | 0 | 5 | 3 | 2 | 8 |
| 2c-bis | ai-tracker-ai-notes.js | 2 | 3 | 4 | 1 | 7 |
| 2d | ai-tracker-checkpoint.js | 1 | 6 | 4 | 0 | 10 |
| 2e | ai-tracker-sprint-project.js | 0 | 5 | 4 | 0 | 11 |
| 2f | CP + Map Generator | 0 | 4 | 4 | 0 | 10 |
| 2g | index.html + CSS | 2 | 8 | 4 | 0 | 11 |
| **TOTAL** | | **7** | **44** | **37** | **6** | **87** |

> Nota de deduplicación: Los dos bugs críticos de `openQuickNote` reportados en 2c y 2c-bis fueron reclasificados en 2d — la función existe en `ai-tracker-checkpoint.js` L6630. Prioridad pendiente de reevaluación por Vera según orden de carga.
>
> Total gaps únicos Fase 2: 81 (87 reportados — 6 consolidados por duplicación entre sesiones).

---

## 3. Fase 3a · Nova — Onboarding y navegación principal

### 3.1 Tabla de fricciones

| # | Pantalla / Flujo | Fricción detectada | Principio violado | Severidad | Propuesta de mejora |
|---|---|---|---|---|---|
| 1 | Primera carga — splash | El splash muestra logo + barra de progreso + estados técnicos ("↓ Cargando sesiones…") pero ninguna frase que comunique qué es el producto. `splash-name` tiene clase `--hidden` y nunca se muestra | Nielsen #1 — Visibilidad del estado del sistema · Nielsen #10 — Ayuda y documentación | **Alta** | Mostrar una tagline estática bajo el logo durante el splash (ej. "Gestiona tus Workers y backlog de proyecto"). |
| 2 | Primera carga — transición splash → app | Al cerrar el splash (~1.3s), el usuario que no tiene Workers ni proyectos aterriza en el tab Sesiones con el panel central mostrando "←" + "Selecciona un Worker" mientras la sidebar derecha puede estar colapsada o vacía. No hay hilo que conecte el fin del splash con la acción esperada | Nielsen #6 — Reconocimiento sobre recuerdo · Gestalt — Proximidad | **Alta** | Asegurar que el onboarding dispare antes de que el usuario vea el empty state, o sincronizar el timing para que el modal aparezca en el mismo frame que la desaparición del splash. |
| 3 | Primera carga — onboarding modal | El modal de onboarding aparece con texto correcto pero el paso 3 no tiene botón de acción. La instrucción "Pega el bloque CHECKPOINT en el card de la IA" supone que el usuario ya sabe qué es un CHECKPOINT | Nielsen #6 — Reconocimiento · Nielsen #4 — Consistencia (pasos 1 y 2 tienen botón, paso 3 no) | Media | Agregar al paso 3 un link o tooltip que explique qué es un CHECKPOINT, o enlazar a un ejemplo visible. |
| 4 | Orientación — sidebar derecha como navegación primaria | El sidebar "Notificaciones" (label estático en HTML, corregido a "Centro de notificaciones" por JS) contiene Workers que son el punto de entrada a la funcionalidad principal. El nombre no comunica que ahí están los Workers | Nielsen #2 — Coincidencia entre sistema y mundo real | **Alta** | Renombrar el sidebar a "Workers" o "Workers / Radar" para que el contenedor refleje su contenido principal. |
| 5 | Orientación — ícono ← en empty state de Sesiones | El empty state dice "Selecciona un Worker" con ícono "←" que apunta a la izquierda. Los Workers están en el sidebar derecho. La flecha contradice la instrucción textual "panel derecho" | Nielsen #1 — Visibilidad · Gestalt — Continuidad | Media | Cambiar el ícono de "←" a "→" para alinear con la ubicación real del sidebar de Workers. |
| 6 | Orientación — tab "Documentos" contiene Backlog | El tab principal se llama "🗃 Documentos" pero al entrar, el sub-tab activo por defecto es "Backlog". Hay dos capas de "Documentos" superpuestas que ocultan el contenido real | Nielsen #2 — Coincidencia sistema/mundo · Nielsen #8 — Estética y minimalismo | Media | Renombrar el tab principal de "Documentos" a "Backlog". |
| 7 | Navegación — menú ⋯ como cajón de sastre | El menú "⋯" agrupa en un mismo desplegable 14 opciones sin separación semántica entre frecuentes y peligrosas (solo una `<hr>` antes de "Purgar") | Fitts · Nielsen #8 — Estética y minimalismo | Media | Separar el menú en al menos dos agrupaciones visuales claras: acciones de sesión frecuentes vs configuración. |
| 8 | Navegación — botón ›/‹ del sidebar colapsado | El HTML incluye `<button class="radar-sidebar-expand-btn">›</button>` pero no tiene reglas CSS propias (comentario en CSS dice "eliminado — el strip cumple esta función"). El botón existe sin estilos, potencialmente visible como texto plano "›" | Nielsen #1 — Visibilidad · Nielsen #4 — Consistencia | Media | Eliminar el `radar-sidebar-expand-btn` del HTML o añadir los estilos que le corresponden. |
| 9 | Affordances — botón "+" en sidebar = Nuevo Worker, sin label | El botón "+" en el header del sidebar tiene `title="Nuevo Worker"` pero ningún label visible. En el contexto del sidebar "Centro de notificaciones", un "+" sin label es ambiguo | Nielsen #6 — Reconocimiento sobre recuerdo · Nielsen #2 — Coincidencia sistema/mundo | Media | Añadir label visible "Nuevo Worker" al botón o cambiar el ícono. |
| 10 | Affordances — toolbar de Backlog: 6 botones de vista sin estado claro | Los botones "Sprints" y "⊞ Árbol" aparecen con clase `active` por defecto simultáneamente. No hay señal visual clara de que son toggles independientes vs mutuamente excluyentes | Nielsen #1 — Visibilidad · Gestalt — Figura/Fondo | Media | Separar visualmente los modos de agrupación (Sprints) de los modos de vista (Árbol, Kanban, Focus) con un divisor. |
| 11 | Estados vacíos — Backlog sin proyecto activo | Cuando no hay proyecto activo, el Backlog muestra "Selecciona un proyecto" con botón "📁 Seleccionar proyecto". Los dos estados vacíos usan iconos distintos (📁 vs 🗂) sin razón visual aparente | Nielsen #3 — Control y libertad · Nielsen #4 — Consistencia | Baja | Usar el mismo ícono de proyecto en ambos empty states. |
| 12 | Estados vacíos — Backlog vacío (post-reset) | Cuando ITEMS está vacío, el estado vacío dice "El Backlog se actualiza automáticamente vía CHECKPOINT" — instrucción correcta pero sin ningún CTA. Si el usuario no sabe qué es un CHECKPOINT, este estado es un callejón sin salida | Nielsen #9 — Ayuda a reconocer, diagnosticar y recuperarse de errores · Nielsen #10 | Baja | Agregar un link secundario "¿Cómo funciona el CHECKPOINT?" o un enlace al sub-tab Plan. |

### 3.2 Resumen Fase 3a

| Severidad | Total |
|---|---|
| Alta | 3 |
| Media | 7 |
| Baja | 2 |
| **Total** | **12** |

---

## 4. Fase 3b · Nova — Flujos de trabajo core

### 4.1 Tabla de fricciones

| # | Módulo / Flujo | Fricción detectada | Principio violado | Severidad | Propuesta de mejora |
|---|---|---|---|---|---|
| 1 | Backlog — crear ítem | No hay CTA visible de "Nuevo ítem" en el Backlog salvo vía command palette (`openItemEditor(null)` desde CP) o via toolbar; el flujo de creación no es visible para uso repetido sin conocer el shortcut | Nielsen #6 — Reconocimiento sobre recuerdo | **Alta** | Agregar botón "+ Nuevo ítem" visible en la toolbar del Backlog sin depender de CP o shortcut. |
| 2 | Backlog — cambiar status | `setItemStatus` es una función interna sin CTA directo en el listado; la única vía rápida de marcar done es el botón en el IDP que aparece solo después de expandir el ítem | Fitts — la acción más frecuente en backlog vivo requiere el mayor recorrido de interacción | **Alta** | Agregar inline status chip clickeable en la fila del ítem colapsado — sin requerir expansión del IDP. |
| 3 | Backlog — asignar sprint | `openItemEditor` es la única vía para asignar sprint a un ítem; no hay control inline en la fila ni en el IDP | Nielsen #7 — Flexibilidad y eficiencia de uso | **Alta** | Agregar selector de sprint como acción contextual en el menú rápido del ítem o en el IDP. |
| 4 | Sesiones — flujo de registro | El textarea de paste no tiene label visible que explique qué pegar — el flujo correcto depende de conocimiento previo del concepto CHECKPOINT | Nielsen #6 — Reconocimiento · Nielsen #10 — Ayuda y documentación | **Alta** | Agregar hint colapsable bajo el textarea: "¿Qué pego aquí? → El bloque ---CHECKPOINT--- que genera tu IA al cerrar sesión". |
| 5 | Sesiones — feedback post-guardado | Al guardar un CHECKPOINT exitosamente, la sesión recién guardada no se distingue visualmente de las anteriores — no hay highlight de "sesión nueva" en el historial | Nielsen #1 — Visibilidad del estado del sistema | Media | Aplicar el mismo `log-row--highlight` (ya implementado en `scrollToLogCard`) automáticamente en la fila de la sesión recién guardada. |
| 6 | Sesiones — apertura y registro de actividad | La fase-bar (Pegar → Confirmar → Guardar) no tiene etiquetas visibles en el estado `active` ni `done`; el usuario que está en fase 2 no sabe qué acción falta para llegar a fase 3 | Nielsen #1 — Visibilidad · Gestalt — Figura/fondo | Media | Agregar tooltip o micro-label en cada `fase-bar-step` que explique la acción requerida en esa fase. |
| 7 | Sprints — coherencia con ciclo Base Rules | El modal de apertura de sprint no solicita `version_target` ni `release_type` — campos declarados como obligatorios en Base Rules §6; el usuario puede abrir un sprint sin estos datos y los exports quedan sin esa metadata | Nielsen #4 — Consistencia (Base Rules declara obligatorio, UI no exige) | **Alta** | Agregar campos `version_target` y `release_type` como obligatorios en el formulario de apertura de sprint. |
| 8 | Sprints — cierre de sprint | `confirmCloseSprint` ejecuta el cierre sin mostrar un resumen pre-cierre de ítems pendientes que quedarán sin completar; el usuario no ve el impacto antes de confirmar | Nielsen #5 — Prevención de errores | Media | Mostrar en el modal de confirmación de cierre: N ítems pendientes que migrarán, M ítems done en este sprint. |
| 9 | Command palette — descubribilidad | El shortcut Cmd+K no está indicado en ningún lugar de la interfaz fuera del menú ⋯ (opción "Atajos") — un usuario de uso sostenido que no exploró el menú ⋯ no descubre el CP | Nielsen #6 — Reconocimiento sobre recuerdo · Fitts | Media | Agregar el hint "⌘K" en el header o en el tooltip del botón del menú ⋯. |
| 10 | Command palette — comandos disponibles | "Ir a Documentos" en el CP navega al tab `tab-backlog` pero si se implementa el renombrado a "Backlog" (3a), habrá inconsistencia entre label del CP y label del tab | Nielsen #4 — Consistencia | Baja | Cuando se ejecute R de renombrado del tab (3a), actualizar simultáneamente el label en `_buildCommandRegistry`. |
| 11 | Command palette — "toggle Focus" en CP | El comando "Activar / desactivar Modo Focus" en CP llama `toggleFocusMode()` (panel focus), no `toggleBacklogFocusMode()` (Top-10). El label no distingue cuál modo activa | Nielsen #2 — Coincidencia sistema/mundo | Media | Actualizar el label del comando CP para distinguir: "Focus Panel" vs "Focus Top-10" según el contexto activo. |
| 12 | Map generator — propósito del módulo | Al abrir el Map Generator, el encabezado dice "Document Generator" sin explicar en ningún lugar visible qué produce exactamente ni cuándo usarlo | Nielsen #6 — Reconocimiento · Nielsen #10 — Ayuda y documentación | Media | Agregar una línea de descripción bajo el encabezado del overlay: "Genera MAP, CONTEXT y BACKLOG actualizados al cierre de sprint". |
| 13 | Map generator — dropzone y estado de generación | La dropzone muestra solo el estado vacío sin indicar cuántos archivos se requieren ni si el MAP ya existente en localStorage está cargado; el botón "Generar" se habilita en silencio cuando `mg-out-map` no está checked | Nielsen #1 — Visibilidad del estado del sistema | Media | Mostrar el nombre del MAP importado en localStorage como pre-condición visible al abrir el overlay, antes de que el usuario arrastre archivos. |
| 14 | Map generator — columna "Trasciende" en Sprint Review | La columna "Trasciende" en las tablas de decisiones y aprendizajes no tiene tooltip ni descripción; el usuario no sabe qué significa marcar algo como "trasciende" ni qué efecto tiene sobre el output generado | Nielsen #6 — Reconocimiento sobre recuerdo | Media | Agregar tooltip en el header de columna: "Incluir en el CONTEXT del siguiente sprint". |
| 15 | AI Notes — integración en flujo de trabajo | `ai-tracker-ai-notes.js` contiene funciones de gestión de Workers, sesiones rápidas y helpers que no son "notes" — el módulo actúa como contenedor residual de funciones sin agruparse por concepto | Gestalt — Proximidad | Baja | No aplica a UX de usuario final directamente — observación de arquitectura para Cael. |
| 16 | Checkpoints — feedback de error de proyecto no canónico | El error de proyecto no canónico se muestra en el preview del card Y en un toast simultáneamente — dos canales de feedback para el mismo error. El toast desaparece pero el preview permanece correctamente | Nielsen #8 — Estética y minimalismo | Baja | Eliminar el toast de error de proyecto no canónico — el mensaje inline del preview es suficiente y persiste. |
| 17 | Densidad — IDP | El IDP carga simultáneamente 8+ zonas de interacción (badges, progreso, AC vivo, historial, notas, botón done, copiar código, desvincular sesión, edición inline de AC) sin jerarquía visual clara | Nielsen #8 — Estética y minimalismo · Gestalt — Figura/fondo | Media | Separar acciones primarias (cambiar status, editar AC) de acciones secundarias (historial, notas) con divisor visual y pesos tipográficos diferenciados. |
| 18 | Densidad — barra de filtros del Backlog | La barra de filtros combina tipo, status, vistas, sprints y "Mi vista" en una sola fila sin separación semántica; los filtros de datos y los modos de visualización tienen el mismo peso visual | Gestalt — Similitud · Nielsen #4 — Consistencia | Media | Separar con un divisor vertical los controles de dato (tipo, status, sprint) de los controles de vista (árbol, kanban, focus). |

### 4.2 Resumen Fase 3b

| Severidad | Total |
|---|---|
| Alta | 4 |
| Media | 11 |
| Baja | 3 |
| **Total** | **18** |

---

## 5. Fase 3c · Lena — Funnel de activación

### 5.1 Tabla de momentos del funnel

| Momento del funnel | Comportamiento observado en el producto real | Hipótesis de impacto en conversión/retención | Acción sugerida |
|---|---|---|---|
| 1. Primer contacto — primeros 2 min | La splash screen muestra "AI Tracker" con logo y barra de progreso. El tab activo de entrada es "🗂 Sesiones". Con estado vacío: grid de workers vacío sin onboarding visible. No hay pantalla de bienvenida, tooltip de inicio ni copy que explique qué hace PP. El sidebar derecho de "Notificaciones" aparece colapsado o sin contenido | El founder entiende que esto es un tracker de sesiones de IA — pero no sabe qué hacer primero ni en qué orden. Probabilidad alta de cierre en 60–90 seg si llega sin contexto previo. El nombre "AI Tracker" no comunica el valor diferencial del producto | Agregar empty state orientado a acción en el grid del tab Sesiones: tres pasos concretos (1. crear worker, 2. crear proyecto, 3. registrar sesión). |
| 2. Primera acción de valor — crear ítem en backlog | El flujo mínimo para registrar un ítem desde cero requiere: (1) abrir tab Documentos, (2) detectar backlog vacío, (3) ir al editor de ítems (`openItemEditor` — función en módulo externo sin guardia, bug 2b confirmado por Finn), (4) completar formulario, (5) guardar. El flujo CHECKPOINT requiere: tener sesión creada → pegar CHECKPOINT → aplicar. El flujo CHECKPOINT requiere que exista un proyecto activo | El flujo hasta el primer ítem de backlog requiere al menos 2 prerequisitos implícitos: worker creado + proyecto activo. El costo de setup no está comunicado al inicio. Bug de `openItemEditor` sin guardia añade riesgo de fallo silencioso | Exponer el prerequisito de worker + proyecto al inicio del onboarding empty state. No bloquear silenciosamente — si el founder intenta guardar una sesión sin proyecto, el flujo ya lo maneja (banner inline) pero no hay educación previa. |
| 2b. Primera acción de valor — abrir sesión | El flujo de apertura de sesión requiere: (1) seleccionar worker (debe existir), (2) ingresar hora de inicio (campo validado — acepta formato libre y normaliza), (3) escribir título, (4) guardar. Si no hay proyecto activo, el guardado bloquea con panel inline | La UX del campo hora es un momento de deleite potencial. Sin embargo, si el worker no existe, el founder llega a un grid vacío sin CTA claro de "crear worker" | Cuando el grid de workers está vacío, el CTA "Nuevo Worker" del sidebar debe ser el elemento más visible. |
| 2c. Primera acción de valor — búsqueda via command palette | Command palette accesible via ⌘K o botón en menú ⋯. Con estado vacío, la búsqueda no produce resultados pero tampoco orienta al usuario | La búsqueda es el atajo de poder — pero solo genera valor cuando hay datos. Con estado vacío es una no-acción | Sin acción prioritaria en este punto — la búsqueda escala naturalmente con uso. El empty state global es el momento de intervención correcto. |
| 3. Puntos de abandono | Punto A: Tab Documentos → Backlog vacío → sin CTA visible. Punto B: Tab Sesiones vacío → sin ruta clara de creación de worker. Punto C: Tab Proyectos vacío → empty state existe pero el formulario está en la misma vista. Punto D (bug 2b Finn): si `openItemEditor` falla silenciosamente, click sin respuesta — abandono por frustración. Punto E: Tab Analytics vacío → el empty state sí existe y es orientado (benchmark interno del producto) | Punto D es el riesgo más alto de abandono por fricción técnica no visible. Puntos A y B son abandono por desorientación. El empty state de Analytics es el único que educa activamente | (1) Extender el patrón de empty state de Analytics a los tabs Sesiones y Documentos. (2) El bug de `openItemEditor` sin guardia debe priorizarse como bloqueante de activación. |
| 4. Retención temprana | PP tiene elementos de retención robustos (heatmap, KPIs con comparativa, forecast de sprints, distribución horaria, resumen semanal) — pero todos son post-datos. En estado vacío o con 1–2 sesiones, ninguno de estos elementos está activo. El heatmap requiere sesiones con fecha. El forecast requiere 2 sprints cerrados | La retención temprana depende enteramente de si el founder completa el setup antes de que la fatiga lo haga cerrar | Activar un elemento de retención simbólico en el estado vacío — por ejemplo, una barra de progreso de onboarding (x de 3 pasos completados). |
| 5. Fricción de setup implícito | Setup mínimo requerido: (1) crear al menos un worker, (2) crear al menos un proyecto, (3) seleccionar proyecto activo como filtro (auto-selección del primer proyecto activo al init — existe, reduce fricción), (4) importar o crear primer ítem de backlog. CANONICAL_PROJECTS en `ai-tracker-session.js` L4 incluye `'Obsidiana'` (string deprecado) y no incluye `'Obsidian Labs'` — desalineado con OL-CONTEXT V1.3 | El setup de 4 pasos no está declarado en ningún lugar visible del producto. El tiempo hasta primer valor percibido es mínimo 5–7 minutos si el founder es eficiente. La desalineación de CANONICAL_PROJECTS puede causar validación incorrecta de proyectos | (1) Hacer visible el checklist de setup: 4 pasos con estado de completitud. (2) Actualizar CANONICAL_PROJECTS con `'Obsidian Labs'`. |

### 5.2 Puntos de abandono identificados

5 puntos de abandono detectados: Punto A (Backlog vacío sin CTA), Punto B (Sesiones vacío sin ruta de creación de worker), Punto C (Proyectos vacío — mitigado), Punto D (openItemEditor sin guardia — abandono por error silencioso, único causado por bug técnico), Punto E — mitigado (Analytics tiene empty state educativo).

---

## 6. Fase 3d · Lena — Hipótesis de conversión y Rs

### 6.1 Tabla de hipótesis if/then/because

| # | Hipótesis | Hallazgo de origen | Métrica de validación |
|---|---|---|---|
| H1 | Si el tab Sesiones con estado vacío muestra un empty state con CTA explícito hacia "Nuevo Worker" y "Nuevo Proyecto", entonces el founder completa el setup inicial sin abandonar el tab, porque el costo cognitivo de descubrir el prerequisito por error es el principal driver de cierre temprano | 3c · Punto B + Finn 2b (`openItemEditor` sin guardia) | % de founders que crean su primer worker dentro de los primeros 3 minutos de sesión |
| H2 | Si el bug de `openItemEditor` sin guardia de módulo externo es corregido con un fallback visible (error inline, no silencio), entonces el founder no abandona el flujo de creación de ítem por click sin respuesta, porque el error silencioso es el único punto de abandono causado por fallo técnico — no por desorientación — y no tiene señal observable para el usuario | Finn 2b · 3c Punto D | Reducción de eventos "click en Editar → sin apertura de modal" — detectable en analytics si hay instrumentación del evento |
| H3 | Si CANONICAL_PROJECTS en `ai-tracker-session.js` incluye `'Obsidian Labs'` como string válido, entonces los CHECKPOINTs futuros con `Proyecto: Obsidian Labs` pasan validación sin error de parse, porque el string canónico vigente del holding fue actualizado en OL-CONTEXT V1.3 y el validador usa el array anterior con `'Obsidiana'` | 3c · Punto 5 · Lena + `ai-tracker-session.js` L4 | Cero errores de validación en `parsePaste()` para CHECKPOINTs con `Proyecto: Obsidian Labs` |
| H4 | Si el mapa CANONICAL en `ai-tracker-checkpoint.js` L55–57 es poblado con los prefijos reales del ecosistema (OL, AS, CM, AI), entonces el header muestra el prefijo correcto por proyecto activo, porque actualmente el fallback `.slice(0,2)` produce prefijos arbitrarios | Rune 1b · `_updateHeaderProjectLabel()` | El header muestra `AI ·` para AI Tracker, `AS ·` para ASVAB App — verificable visualmente |
| H5 | Si se agrega un checklist de setup visible de 4 pasos con estado de completitud (worker creado / proyecto creado / primer ítem en backlog / primera sesión guardada), entonces el tiempo hasta primer valor percibido se reduce de 5–7 min a menos de 3 min, porque el founder sabe exactamente cuántos pasos faltan y cuál es el siguiente — eliminando la exploración sin guía | 3c · Punto 5 · fricción de setup implícito | Tiempo promedio entre primera apertura y primera sesión guardada con proyecto activo |
| H6 | Si `_hasStaleSuggestion()` en `ai-tracker-checkpoint.js` compara contra `'pendiente'` (schema canónico) en lugar de `'en-progreso'` (legacy), entonces las sugerencias de workers con ítems bloqueados disparan correctamente, porque con el schema actual el filtro nunca activa — los workers con trabajo real no generan alerta de seguimiento | Rune 1b · `_hasStaleSuggestion()` severidad alta | Sugerencias de worker aparecen en sidebar cuando hay ítems `pendiente` con >3 días sin sesión |
| H7 | Si `_offlineQueuePush()` deduplica por `type + projId` en lugar de solo `type`, entonces dos proyectos con writes pendientes simultáneos no se sobreescriben, porque la lógica actual last-write-wins por `entry.type` descarta el write del primer proyecto cuando el segundo encola — pérdida silenciosa de datos en contexto multi-proyecto | Rune 1b · `_offlineQueuePush()` severidad alta | Cero pérdidas de writes pendientes en escenario con 2+ proyectos activos y conexión intermitente |

### 6.2 Rs de conversión priorizados por impacto

| Título del R | Prioridad | Justificación |
|---|---|---|
| Corregir `openItemEditor` sin guardia — fallback visible cuando módulo externo no disponible | High | Único punto de abandono por error técnico silencioso. Click sin respuesta = pérdida de confianza irrecuperable en primer uso |
| Empty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referencia | High | Mayor driver de desorientación en primer uso. Ruta de creación de worker invisible con estado vacío |
| Actualizar CANONICAL_PROJECTS → `'Obsidian Labs'` en `ai-tracker-session.js` | High | Bug de validación en flujo canónico de trabajo (parsePaste). Effort 1 — corrección de una línea. Sin esta corrección, CHECKPOINTs producidos hoy fallan en producción |
| Poblar mapa CANONICAL en `ai-tracker-checkpoint.js` con prefijos reales del ecosistema | Medium | El header muestra prefijos incorrectos para todos los proyectos. Daña la legibilidad del contexto activo. Effort 1 |
| Corregir `_hasStaleSuggestion()` — comparar contra schema canónico `'pendiente'` | Medium | El sistema de sugerencias de seguimiento de workers nunca activa. Retención temprana comprometida |
| Checklist de setup visible — 4 pasos con estado de completitud | Medium | Reduce tiempo hasta primer valor percibido. Effort 2. Depende de empty state para coherencia visual |
| Corregir `_offlineQueuePush()` — deduplicación por `type + projId` | Medium | Pérdida silenciosa de writes en multi-proyecto. Riesgo de integridad de datos. No bloquea activación pero sí retención post-setup |

---

## 7. Fase 3e · Nova + Lena — Consolidación

### 7.1 Lista consolidada de 30 Rs deduplicados y priorizados

| # | Título | Ejecuta | Prioridad | Justificación | Origen |
|---|---|---|---|---|---|
| 1 | Corregir `openItemEditor` sin guardia — fallback visible cuando módulo externo no disponible | FS · Rune | **High** | Único punto de abandono por error técnico silencioso — click sin respuesta destruye confianza en primer uso | conversión (Finn 2b · Lena 3c/3d) |
| 2 | Actualizar CANONICAL_PROJECTS → `'Obsidian Labs'` en `ai-tracker-session.js` | FS · Rune | **High** | Bug de validación en flujo canónico activo hoy — CHECKPOINTs con naming vigente fallan en `parsePaste()` | conversión (Lena 3c/3d) |
| 3 | Sidebar derecho — renombrar a label que refleje Workers como contenido principal | FS · Rune | **High** | Workers es el punto de entrada principal al producto — nombre "Centro de notificaciones" lo presenta como secundario; fricción de orientación más alta del primer uso | experiencia (Nova 3a #4) |
| 4 | Splash — agregar tagline estática visible durante carga | FS · Rune | **High** | Sin contexto de qué es el producto, el founder que llega sin briefing cierra en <90s | experiencia (Nova 3a #1) |
| 5 | Empty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referencia | FS · Rune + UX · Nova | **High** | Fusión 3a #2 + 3b #1 + 3c Punto B/D + 3d H1 — mayor driver de desorientación en primer uso Y en activación; sin CTA explícito hacia Worker/Proyecto, el founder no completa el setup | ambos |
| 6 | Sprint — agregar `version_target` y `release_type` como obligatorios en formulario de apertura | FS · Rune | **High** | Base Rules §6 los declara obligatorios — UI no los exige; exports quedan sin metadata clave | experiencia (Nova 3b #7) |
| 7 | Sesiones — agregar hint contextual bajo textarea de CHECKPOINT explicando qué pegar | FS · Rune | **High** | Flujo de registro depende de conocimiento previo del concepto CHECKPOINT — invisible para primer uso sin onboarding | experiencia (Nova 3b #4) |
| 8 | Backlog — agregar CTA visible '+ Nuevo ítem' en toolbar | FS · Rune | **High** | Acción más frecuente en uso sostenido enterrada en CP/shortcut — sin descubribilidad en primer uso activa el mismo abandono que 3c Punto A | ambos |
| 9 | Backlog — status chip inline clickeable en fila colapsada para cambiar status sin abrir IDP | FS · Rune | **High** | Acción más frecuente de seguimiento requiere el mayor recorrido de interacción; crítico para uso sostenido | experiencia (Nova 3b #2) |
| 10 | Poblar mapa CANONICAL en `ai-tracker-checkpoint.js` con prefijos reales (OL, AS, CM, AI) | FS · Rune | Medium | Header muestra prefijos arbitrarios para todos los proyectos — daña legibilidad del contexto activo | conversión (Lena 3d H4) |
| 11 | Corregir `_hasStaleSuggestion()` — comparar contra `'pendiente'` en lugar de `'en-progreso'` | FS · Rune | Medium | Sistema de sugerencias de workers nunca activa con schema canónico — retención temprana comprometida | conversión (Lena 3d H6) |
| 12 | Checklist de setup visible — 4 pasos con estado de completitud | FS · Rune + UX · Nova | Medium | Fusión 3c Punto 5 + 3d H5 — cadena de 4 prerequisitos implícitos sin comunicación visible; reduce tiempo hasta primer valor percibido | ambos |
| 13 | Corregir `_offlineQueuePush()` — deduplicación por `type + projId` | FS · Rune | Medium | Pérdida silenciosa de writes en multi-proyecto — riesgo de integridad de datos post-setup | conversión (Lena 3d H7) |
| 14 | Backlog — selector de sprint como control contextual en IDP sin requerir editor completo | FS · Rune | Medium | Asignar sprint es acción frecuente de planificación — solo accesible vía editor completo | experiencia (Nova 3b #3) |
| 15 | Sprint — mostrar resumen pre-cierre con ítems pendientes y done antes de confirmar | FS · Rune | Medium | Cierre sin resumen impide evaluar impacto — riesgo de pérdida de ítems no visible | experiencia (Nova 3b #8) |
| 16 | Empty state Sesiones — corregir ícono ← a → para alinear con ubicación del sidebar | FS · Rune | Medium | Fusión 3a #5 — la flecha contradice la instrucción textual; amplifica la desorientación del sidebar mal nombrado | experiencia (Nova 3a #5) |
| 17 | Tab principal — renombrar 'Documentos' a 'Backlog' | FS · Rune | Medium | El contenido más relevante del tab no está en su nombre; el usuario que busca el Backlog no tiene señal | experiencia (Nova 3a #6) |
| 18 | IDP — separar acciones primarias de secundarias con jerarquía visual clara | UX · Nova + FS · Rune | Medium | 8+ zonas de interacción sin jerarquía genera carga cognitiva en uso repetido | experiencia (Nova 3b #17) |
| 19 | Filtros Backlog — separar controles de dato de controles de vista con divisor visual | FS · Rune | Medium | Filtros y modos de vista con mismo tratamiento visual — el usuario no distingue qué cambia cada control | experiencia (Nova 3b #18) |
| 20 | Map Generator — descripción de propósito y pre-condición al abrir overlay | FS · Rune | Medium | Módulo más complejo del producto — sin contexto de propósito ni cuándo usarlo en el flujo de sprint | experiencia (Nova 3b #12/#13) |
| 21 | Sesiones — highlight automático de sesión recién guardada en historial log | FS · Rune | Medium | Feedback post-guardado no distingue sesión nueva de sesiones anteriores | experiencia (Nova 3b #5) |
| 22 | Sesiones — micro-labels en fase-bar con acción requerida por fase | FS · Rune | Medium | Fase activa sin texto — el usuario no sabe qué acción falta para avanzar | experiencia (Nova 3b #6) |
| 23 | CP — agregar hint ⌘K visible en header | FS · Rune | Medium | CP no descubrible sin explorar menú ⋯ — herramienta de eficiencia central invisible | experiencia (Nova 3b #9) |
| 24 | CP — actualizar label 'Modo Focus' para distinguir panel focus vs Top-10 | FS · Rune | Medium | Label ambiguo amplifica bug de focus documentado por Finn 2b | experiencia (Nova 3b #11) |
| 25 | Botón '+' sidebar Workers — agregar label visible | FS · Rune | Medium | Acción de crear Worker ambigua en contexto de sidebar mal nombrado | experiencia (Nova 3a #9) |
| 26 | Menú ⋯ — separar acciones frecuentes de configuración y acciones peligrosas | FS · Rune | Medium | 14 opciones sin agrupación semántica — acciones críticas y utilitarias al mismo nivel visual | experiencia (Nova 3a #7) |
| 27 | Map Generator — tooltip en columna 'Trasciende' | FS · Rune | Medium | Label sin descripción — el usuario no sabe qué decide al marcar | experiencia (Nova 3b #14) |
| 28 | Eliminar `radar-sidebar-expand-btn` del HTML o restaurar sus estilos | FS · Rune | Medium | Elemento en DOM sin estilos — dos mecanismos de expansión del sidebar, uno sin tratamiento visual | experiencia (Nova 3a #8) |
| 29 | Onboarding modal paso 3 — agregar link/tooltip explicando qué es un CHECKPOINT | FS · Rune | Low | Paso 3 sin botón de acción y con concepto no explicado — parcialmente cubierto por #7 (hint textarea); impacto residual en onboarding modal | experiencia (Nova 3a #3) |
| 30 | Checkpoints — eliminar toast redundante de error de proyecto no canónico | FS · Rune | Low | Preview inline persiste — toast es ruido en uso sostenido | experiencia (Nova 3b #16) |

> **Nota:** R#2 y R#30 tienen dependencia directa — si CANONICAL_PROJECTS se actualiza correctamente (#2), el toast de error (#30) se verá menos. Implementar #2 primero.

### 7.2 Rs que requieren paso por Cael antes de Rune

| R | Por qué necesita AC antes de ejecutar |
|---|---|
| #5 — Empty state Sesiones + Documentos | Effort 2, toca UI en dos tabs distintos con comportamientos diferenciados; Nova debe aportar restricciones en Fase 1 antes de que Cael cierre AC |
| #12 — Checklist de setup visible | Effort 2, toca UI; los 4 pasos y su lógica de completitud (qué condición activa cada check) no están especificados — Cael define comportamiento, Nova aporta restricciones |
| #18 — IDP jerarquía visual | Toca UI con impacto en layout — Nova debe aportar restricciones de Fase 1 antes de que Cael cierre AC; hay riesgo de scope creep si se especifica sin criterio de experiencia |
| #1 — openItemEditor sin guardia | AC vacíos en 3d — Cael debe especificar qué muestra el fallback (mensaje, estado, acción disponible) antes de que Rune implemente |
| #6 — Sprint `version_target` + `release_type` obligatorios | Toca UI del modal de apertura de sprint — Nova debe confirmar restricciones de campos obligatorios en el formulario (validación inline, comportamiento de error) |

> Rs con AC completos en CHECKPOINTs de origen que pueden pasar directo a Rune sin re-especificación de Cael: #2, #3 (parcial — AC en 3a), #4 (AC en 3a), #8 (AC en 3b), #9 (AC en 3b), #11, #13, #16, #28, #30.

---

## 8. Resumen ejecutivo

### 8.1 Total de hallazgos por fase y tipo

| Fase | Rol | Tipo | Total |
|---|---|---|---|
| 1 | Rune (técnica) | Hallazgos técnicos (alta/media/baja) | ~115 |
| 2 | Finn (funcional) | Críticos: 7 · Mayores: 44 · Menores: 37 · Observaciones: 6 · **Total**: 94 |
| 2 | Finn (funcional) | Gaps de AC únicos para Cael | 81 |
| 3a | Nova (UX primer uso) | Fricciones Alta: 3 · Media: 7 · Baja: 2 · **Total**: 12 |
| 3b | Nova (UX uso sostenido) | Fricciones Alta: 4 · Media: 11 · Baja: 3 · **Total**: 18 |
| 3c | Lena (funnel activación) | Momentos de funnel auditados: 5 · Puntos de abandono: 5 |
| 3d | Lena (hipótesis conversión) | Hipótesis if/then/because: 7 · Rs conversión priorizados: 7 |
| 3e | Nova + Lena (consolidación) | Rs deduplicados: 30 (9 high · 19 medium · 2 low) |

### 8.2 Top 5 hallazgos de mayor impacto en producto

**1. `_scmRender()` — isLast siempre 3 con skipStep2=true (Bug crítico — Finn 2a)**
El botón "Cerrar sprint" es inaccesible cuando no hay ítems pendientes. Bloquea el flujo de cierre de sprint desde la UI. Sin workaround disponible. **Status en backlog:** incorporado al Cluster A de PP-BACKLOG-nuevo.md, sprint PP-S-26, prioridad high.

**2. #cmd-palette-overlay — dead DOM con closeCommandPalette() conflictivo (Bug crítico — Finn 2g)**
Dos shells del command palette coexisten en el DOM con funciones `closeCommandPalette()` en conflicto. Riesgo de shadowing que puede romper la CP activa silenciosamente. **Status en backlog:** incorporado al Cluster A de PP-BACKLOG-nuevo.md, sprint PP-S-26, prioridad high.

**3. item-type select — value='I' como primera opción default (Bug crítico — Finn 2g)**
El selector de tipo de ítem en el editor muestra `'I — Idea'` como primera opción (default). Ítems creados sin cambiar selector tienen `type='I'` inválido — rechazados downstream en `_assignPendingIds`, `buildBacklogMd` y tracker legacy sin feedback al usuario. Genera corrupción silenciosa de backlog. **Status en backlog:** incorporado al Cluster A de PP-BACKLOG-nuevo.md, sprint PP-S-26, prioridad high.

**4. `_doSaveSession()` — newSess push antes de confirmación de showMergeDiffPanel (Bug crítico — Finn 2c)**
Si el usuario cancela el panel de diff habitual, la sesión queda persistida en `sessions[]` sin `tgItems` mergeados — estado inconsistente permanente sin señal al usuario. **Status en backlog:** incorporado al Cluster A de PP-BACKLOG-nuevo.md, sprint PP-S-26, prioridad high.

**5. `_hasStaleSuggestion()` — comparación contra 'en-progreso' en lugar de 'pendiente' (Alta — Rune 1b)**
El sistema de sugerencias de seguimiento de workers nunca activa con el schema canónico actual. El founder no recibe señales de workers con trabajo bloqueado desde el lanzamiento del schema v1. **Status en backlog:** incorporado como bug en PP-BACKLOG-nuevo.md (Cluster A), prioridad high.

### 8.3 Top 5 hallazgos de mayor impacto en conversión

**1. `openItemEditor` sin guardia — ReferenceError silencioso al click en Editar (Rune 1 / Finn 2b / Lena 3c-3d)**
Único punto de abandono causado por error técnico invisible. Click sin respuesta en el primer flujo de creación de ítem genera pérdida de confianza irrecuperable. Identificado por Finn como bug mayor (2b), confirmado por Lena como Hipótesis H2 de mayor riesgo, priorizado como R#1 en la lista consolidada. **Status en backlog:** incorporado como R high en PP-BACKLOG-nuevo.md, requiere paso por Cael (AC vacíos).

**2. CANONICAL_PROJECTS desalineado — 'Obsidian Labs' no incluido (Rune 1b / Finn 2c / Lena 3c-3d)**
CHECKPOINTs producidos hoy con `Proyecto: Obsidian Labs` fallan en `parsePaste()` — el validador usa el array anterior con `'Obsidiana'`. Bloqueante operativo inmediato. Effort 1 — corrección de una línea. R#2 en la lista consolidada. **Status en backlog:** incorporado como T high en PP-BACKLOG-nuevo.md, AC completos, puede pasar directo a Rune.

**3. Ausencia de empty state orientado a acción (Nova 3a/3b / Lena 3c / 3d H1)**
El mayor driver de desorientación en primer uso Y en activación. Sin CTA explícito hacia Worker/Proyecto en tabs Sesiones y Documentos, el founder no completa el setup. Tab Analytics es el único con empty state educativo — es el benchmark interno del producto. El hallazgo con más evidencia cruzada del ciclo (4 fuentes independientes). R#5 en la lista consolidada, Effort 2. **Status en backlog:** incorporado como R high en PP-BACKLOG-nuevo.md, requiere paso por Cael + Nova.

**4. Setup implícito de 4 pasos no comunicado (Lena 3c / 3d H5)**
El founder descubre los prerequisitos (worker + proyecto + proyecto activo + primer ítem) por error, no por diseño. El tiempo hasta primer valor percibido es 5–7 minutos con un founder eficiente, más si explora sin guía. R#12 en la lista consolidada (checklist de setup visible). **Status en backlog:** incorporado como R medium en PP-BACKLOG-nuevo.md, requiere paso por Cael + Nova.

**5. `_offlineQueuePush()` — pérdida silenciosa de writes en multi-proyecto (Rune 1b / Lena 3d H7)**
La lógica de deduplicación last-write-wins por `entry.type` descarta writes del primer proyecto cuando el segundo encola con el mismo tipo. Pérdida silenciosa de datos en contexto multi-proyecto — afecta retención post-setup. R#13 en la lista consolidada, Effort 1. **Status en backlog:** incorporado como B medium en PP-BACKLOG-nuevo.md, AC completos, puede pasar directo a Rune.

### 8.4 Estado de hallazgos críticos y su incorporación al backlog

| Hallazgo | Fase | Tipo | Status en PP-BACKLOG-nuevo.md |
|---|---|---|---|
| `_scmRender()` isLast siempre 3 | Finn 2a | Bug crítico | Incorporado — Cluster A, PP-S-26, high |
| `#cmd-palette-overlay` dead DOM conflictivo | Finn 2g | Bug crítico | Incorporado — Cluster A, PP-S-26, high |
| `item-type select` value='I' default | Finn 2g | Bug crítico | Incorporado — Cluster A, PP-S-26, high |
| `_doSaveSession()` newSess pre-push | Finn 2c | Bug crítico | Incorporado — Cluster A, PP-S-26, high |
| `downloadTemplates()` sin typeof guard | Finn 2d | Bug crítico | Incorporado — Cluster A, PP-S-26, high |
| `CANONICAL_PROJECTS` desalineado | Finn 2c / Lena 3c | Bug mayor + conversión | Incorporado — T high, PP-S-26 |
| `_hasStaleSuggestion()` schema legacy | Rune 1b / Lena 3d | Bug alta + conversión | Incorporado — Cluster A, PP-S-26, high |
| `openItemEditor` sin guardia | Finn 2b / Lena 3d | Bug mayor + conversión | Incorporado — R high, requiere Cael (AC vacíos) |
| Empty state Sesiones + Documentos | Nova 3a/3b / Lena 3c-3d | Fricción alta + conversión | Incorporado — R high, requiere Cael + Nova |
| `_offlineQueuePush()` deduplicación | Rune 1b / Lena 3d | Bug alta + conversión | Incorporado — B medium, AC completos |
| `_scmRender()` + `_doSaveSession()` undoSnapshot gaps | Finn 2a | Bugs mayores | Incorporado — Cluster A/B |
| `_docPrefix` 'OB' en lugar de 'OL' | Finn 2e | Bug mayor | Incorporado — Cluster A, PP-S-26, high |
| `_mgBuildPlan` formato legacy `---PLAN---` | Finn 2f | Bug mayor | Incorporado — Cluster A, PP-S-26, high |
| `_buildChildrenBlock` IDs de DOM desfasados | Finn 2b | Bug mayor | Incorporado — Cluster A |
| `buildTGPreview` usa `i.desc` no `i.title` | Finn 2d | Bug mayor | Incorporado — Cluster A/B |
| Gaps de AC (81 únicos) | Finn 2a–2g | Gaps de especificación | Pendientes de revisión con Cael — no todos incorporados en sprint |
| Fricciones Nova 3a/3b de severidad media (28 fricciones) | Nova 3a/3b | Fricciones UX | Rs 3–30 de la lista consolidada — Clusters B/C de PP-BACKLOG-nuevo.md |

---
