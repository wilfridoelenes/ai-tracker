// [PP] mod:133 · autor:Rune · 2026-08-23 23:10 UTC-6
// TKT-202608-454 (REQ-202608-187, TKT2, depends_on: TKT-202608-453 done): renderSprintTab()
// — rama sin sprint retira el badge de proyecto (antes proj.id en el chip, declarado como
// "supuesto declarado" sin AC real en mod:117) y aplica .sph-sprint-pill--unset + oculta
// #sph-burndown. Rama con sprint consolida chip+label en un solo textContent
// (`${sprint.id} · ${sprint.label}`), aplica --active solo si sprint.status === 'active'
// (no 'scheduled' — mismo criterio que .sprint-group-active), y destapa el burndown.
// identityLabelEl/#spt-identity-label retirados — el nodo ya no existe en index.html mod:218.
// contract_update: sí — ver contract_detail del CHECKPOINT (renderSprintTab pierde su
// dependencia de #spt-identity-label; sin call sites externos afectados, ambas funciones
// locales sin consumidores fuera de este archivo).
// [PP] mod:132 · autor:Rune · 2026-08-17 UTC-6
// TKT histórico — sin CHECKPOINT confirmado (ref_id CAEL-08172145-03, parent REQ
// CAEL-08172145-01, origen_disc DISC-202608-184): las 24 referencias restantes con marcador
// de código pendiente en comentarios de este archivo (TKT/REQ/INC citados sin código real
// recuperable) se reescriben con el patrón histórico — sin CHECKPOINT confirmado, ya vigente
// en el proyecto (ver locus-backlog-item.css). El comentario de mod:131 (más abajo) también se
// reescribe para no reproducir el marcador prohibido al citarse a sí mismo. Ningún ref_id ya
// resuelto (ref: CAEL-05, ref: CAEL-03) se toca — es trazabilidad histórica válida. Sin cambio
// de lógica ejecutable — diff limitado a texto dentro de comentarios //. Cierra DISC-202608-184.
// contract_update: n/a — cambio de comentarios únicamente, sin firma ni comportamiento afectados.
// [PP] mod:131 · autor:Rune · 2026-08-17 UTC-6
// TKT-202608-387 (REQ-202608-159, TKT1): AC ya satisfechos por la implementación existente
// de _SPS_GROUP_COLLAPSED (mod:111) — el Set ya nace con 'programados'/'pausados'/'cerrados'
// y excluye 'activo', que es exactamente el default pedido por este TKT. Único cambio de
// esta entrega: el comentario de mod:111 (más abajo) citaba una referencia sin resolver a sí
// mismo (marcador de código pendiente para TKT/REQ) — violación de __BR-Ecosystem §4 /
// __BR-Execution §9 (ese marcador nunca se persiste en un archivo real una vez que el
// ítem tiene código asignado). Reemplazado por el código real TKT-202608-387/REQ-202608-159.
// Sin cambio de comportamiento — solo trazabilidad.
// contract_update: n/a — _spsGroupHtml()/_spsGroupToggleHandler()/_spsAttachGroupToggle()
// sin cambio de firma ni de lógica.
// [PP] mod:130 · autor:Rune · 2026-08-17 UTC-6
// TKT-202608-374 (REQ-202608-150, TKT2): chip "Retro sin evaluar" en _renderSpsCerrados() —
// visible solo en la fila del sprint cerrado más reciente (_closedIdx === 0, closed[] ya
// ordenado descendente por closedAt/createdAt) cuando sprint.retroEvaluated !== true. Reusa
// la clase .sps-closed-retro-pending ya declarada por Nova para el chip "Retro pendiente"
// (sin retroDoc) — mismo tratamiento visual, texto propio vía variable local
// retroUnevaluatedHtml, sin CSS nuevo. Ambos chips son independientes: un sprint sin
// retroDoc y con retroEvaluated !== true en idx 0 puede mostrar los dos simultáneamente
// (comunican señales distintas — ausencia de documento vs. falta de evaluación de patrón —
// AC de este TKT no excluye ese caso). Navegación: la fila completa ya es clickeable/
// operable por teclado vía _spsCerradosRowClick()/_spsCerradosRowKeydown() →
// openSprintRetroView(sprintId) — sin wiring adicional, satisface "click navega a
// Narrativas sin pasos adicionales" (AC2 del REQ). Edge case sin sprints cerrados ya
// cubierto por el bloque closed.length === 0 existente — sin chip, sin error.
// contract_update: n/a — _renderSpsCerrados() sin cambio de firma, sin consumidores
// externos nuevos.
// [PP] mod:128 · autor:Rune · 2026-08-17 UTC-6
// TKT-202608-366 (REQ-202608-146, TKT2): wiring del toggle de detalle de la card
// #sps-activo — consume .sps-card-detail-toggle/.sps-card--collapsed/.sps-card-pct-mini
// entregadas por Nova en locus-sprint.css mod:74 (CSS dependencies block verificado antes
// de escribir este wiring). _renderSpsActivo() inserta el botón toggle (svg.chevron,
// Patrón A-13, mismo markup que .sph-collapse-btn) y el nodo .sps-card-pct-mini dentro de
// .sps-card-header, junto a .sps-menu-wrap — identidad de la card (header) nunca se oculta.
// Estado nuevo _SPS_ACTIVO_DETAIL_COLLAPSED (en memoria, mismo criterio que
// _SPS_GROUP_COLLAPSED — resetea a expandido en reload) — independiente del colapso de
// sección (.sps-status-group.is-collapsed, mod:111). _spsActivoHandleClick() gana una rama
// nueva para [data-sps-detail-toggle]; sin keydown propio porque el toggle es un <button>
// real (activación nativa de Enter/Space, mismo criterio ya vigente para .sps-btn-menu en
// este archivo — sin handler de teclado dedicado). Copy de #sps-content-empty: ver
// index.html mod correspondiente — cambio de texto solo en .spt-content-empty-hint (el
// único nodo que el CSS dependencies block de Nova autorizó a tocar en este TKT), no en
// .spt-content-empty-title. Supuesto declarado (inferible, no en el CHECKPOINT de Nova):
// el hint reemplaza la implicación de creación manual por referencia al flujo real de
// aprobación de sprint_proposal de Cael (__BR-Ecosystem §5 — "Solo Cael propone apertura
// de sprint") — mismo copy ya usado en el empty-state interno de _renderSpsActivo() de
// este mismo archivo ("La apertura de sprint se propone desde Cael (sprint_proposal) — no
// hay creación manual."), adaptado para referenciar el panel #spnp-panel que ya vive
// inmediatamente debajo en el DOM. contract_update: n/a — _renderSpsActivo()/
// _spsActivoHandleClick() sin cambio de firma, ambas sin consumidores externos.
// [PP] mod:125 · autor:Rune · 2026-08-14 21:45 UTC-6
// TKT-202607-142 (REQ-202607-045, retroactivo — reemplaza TKT-202607-141): retirado el
// listener 'shell:sprint-render' agregado en mod:120 — dead code, ver bloque en el cuerpo
// del archivo. TKT-202607-134 (mod:135 de locus-backlog-core.js) ya había renombrado los 3
// dispatchEvent que lo alimentaban a 'shell:render-sprint-tab'; el listener de ese evento
// (L2419 de este archivo, sin cambio) es ahora el único punto de refresco en vivo del tab
// Sprint. AC1 (grep 'shell:sprint-render(' fuera de comentarios → cero matches en los 4
// archivos del REQ) queda satisfecho. contract_update: sí — _renderSprintItems() pierde el
// segundo call site (el del listener retirado); su único invocador queda renderSprintTab()
// (L2104) y el llamado directo de _sptSwitch() (L374). Sin cambio de firma.
// [PP] mod:120 · autor:Rune · 2026-07-26 UTC-6
// TKT-202607-141 (REQ-202607-045, CHG-202607-001 · INC-202607-045/046): registra
// _renderSprintItems() como único listener de shell:sprint-render. TKT-202607-134 retiró
// renderSprintItems()/renderSprintBurndown() de locus-backlog-sprints.js junto con el
// único listener del evento — el tab Sprint dejó de refrescarse en vivo ante cambios de
// status originados fuera de este tab. Ver bloque nuevo junto a shell:render-sprint-tab.
// Fix AC2 de TKT-202607-126 (REQ-202607-039), reportado por Finn contra el AC real del
// backlog (_PP-backlog-v1.11.0.md, no adjunto cuando se escribió mod:117): identityChipEl
// usaba proj.id en vez de sprint.id — el AC pide el ID del sprint ('PP-S-13'), no un dato
// de proyecto. identityLabelEl dejó de duplicar `${sprint.id} · ${sprint.label}` (ese
// compuesto es de #sph-name, campo distinto) — ahora solo sprint.label. Sin cambio de
// firma, ambas funciones sin consumidores externos (contract_update: n/a).
// [PP] mod:118 · autor:Rune · 2026-07-26 09:40 UTC-6
// Corrección de trazabilidad — resuelta en sesión (Patch, dueño presente, sin bifurcación
// de founder): el header de mod:117 citaba 'TKT-202607-131 (REQ-202607-039)' — código
// incorrecto. TKT-202607-131 es un ticket real y no relacionado (Ingest validation panel,
// REQ-202607-041, done). El código correcto para el trabajo descrito abajo es
// TKT-202607-134 (TKT4, REQ-202607-039) — coincide exactamente con la intención del TKT en
// backlog (retiro de renderSprintItems()/renderSprintBurndown(), burndown effort-based).
// Gap de dependencia registrado (no resuelto por esta corrección): TKT-202607-134 declara
// DependsOn: TKT-202607-126, que está en-revision, no done — el trabajo se implementó antes
// de que la dependencia cerrara. Ver CHECKPOINT de esta entrega.
// [PP] mod:117 · autor:Rune · 2026-07-26 08:15 UTC-6
// TKT-202607-134 (REQ-202607-039): burndown de _renderSprintItems(sprint) pasa de
// item-count-based a effort-based — fórmula portada de renderSprintBurndown() (retirada de
// locus-backlog-sprints.js). Agrega wiring de #sph-bd-warn (ítems sin effort).
// TKT-202607-126 (REQ-202607-039): wiring de AC1 (spi-stat-*) y AC3 (spi-content-empty vs
// .spi-list) en _renderSprintItems() — reusa pendiente/enRevision/bloqueado/done ya computados.
// AC2 (spt-identity-chip/-label) poblado en renderSprintTab() junto al resto del header —
// spt-identity es instancia única compartida Ítems/Planificar (shell de Nova, index.html mod:158).
// Supuesto declarado: chip = proj.id (único campo de getActiveProject() ya usado en este módulo,
// L450/459 — sin locus-storage.js adjunto para confirmar si existe campo .prefix/.name más
// apropiado para .pill-project). Sin CSS aplicado — .sps-stat-cell--en-revision/--bloqueado,
// .spt-identity, .spt-content-empty* no existen aún en locus-sprint.css (mod:65, verificado por
// grep en esta sesión) — bloqueo CSS, Nova pendiente. contract_update: n/a — sin cambio de firma
// en _renderSprintItems()/renderSprintTab(), ambas funciones locales sin consumidores externos.
// [PP] mod:115 · autor:Rune · 2026-07-25 UTC-6
// Hallazgo fuera de scope — resuelto en sesión (Patch, dueño presente, sin bifurcación de
// founder): mod:114 no declaraba en este header el fix de TKT-202607-125 (null-deref en
// renderSprintTab() — sprint scheduled sin active dejaba `sprint` null y se dereferenciaba
// igual en sprint.label, L1965). El fix ya estaba escrito en el cuerpo del archivo (L1901-1910,
// comentario inline propio) pero sin entrada de header — gap de trazabilidad puro, sin cambio
// de comportamiento en este mod. Verificado contra los 3 AC del TKT (Paso 2, __BR-Execution §1):
// happy path, error corregido y edge case sin regresión — los tres ya cumplidos por el código
// existente, sin diff adicional.
// [PP] mod:114 · autor:Rune · 2026-07-25 UTC-6
// Cierra el bloqueo parcial declarado en mod:111 (index.html no adjunto en esa sesión):
// _renderSpsStatsBlock() puebla el shell estático #sps-stats-block (index.html mod:151,
// 4 celdas fijas Activo/Programados/Pausados/Cerrados) — solo actualiza textContent de
// los 4 contadores, sin generar estructura (BR-Execution §5). Fuente: getActiveSprints(),
// mismo dato que ya consumen _renderSpsActivo/_getProgramadosSprints/_renderSpsPausados/
// _renderSpsCerrados — sin filtro de proyecto nuevo. Invocada en _sptSwitch junto a las
// 4 status-groups, único entry point de render del subtab 'sprints' (verificado: todos
// los call sites de _sptSwitch pasan por esa rama).
// [PP] mod:111 · autor:Rune · 2026-07-22 UTC-6
// Rediseño sub-tab Sprints — ad-hoc, instrucción directa del founder (sin REQ/TKT,
// mismo tratamiento que CSS mod:64 de Nova, locus-sprint.css). design_intent:
// sprint_subtab_redesign. _renderSpsActivo/_renderSpsProgramados/_renderSpsPausados/
// _renderSpsCerrados migran del wrapper plano (<span class="sps-section-label"> +
// contenido) a .sps-status-group/.sps-status-header/.sps-status-body (CSS entregado
// por Nova). Q-INC excluido — tiene tab propio, por instrucción del founder.
// Helpers nuevos: _spsGroupHtml()/_spsGroupEmptyHtml() generan el wrapper + empty
// state; _spsAttachGroupToggle()/_spsGroupToggleHandler()/_spsGroupToggleKeydown()
// manejan colapso por sección (estado en memoria — _SPS_GROUP_COLLAPSED, se resetea
// a expandido en reload, mismo criterio que el resto de UI efímera del tab Sprint).
// Cerrados — cambio de comportamiento, no solo de clase: _spsCerradosExpanded/
// _spsCerradosToggle (expandir retro inline por fila) y el menú ··· (Ver retro
// completa / Exportar .md — ambas acciones invocaban openSprintRetroView, ya
// redundantes entre sí) se retiran. La fila completa (.sps-closed-row) es ahora
// el control — click o Enter/Space invoca openSprintRetroView() directamente.
// Consistente con el design_intent aprobado ("item-rows con acento lateral, mismo
// lenguaje que las cards de Promoted en Q-DISC") — Promoted no lleva menú propio.
// Bloqueo parcial: el bloque de métricas (.sps-stats-block/.sps-stat-cell, CSS ya
// entregado) requiere shell HTML estático nuevo (Regla de separación HTML/JS,
// BR-Execution §5 — elemento invariante, no debe generarse por JS) — index.html
// no está adjunto en esta sesión. Ver CHECKPOINT: bloqueo explícito, sin este
// archivo no se implementa esa parte (BR-Execution §2 — sin archivo, sin
// entregable). Los 4 status-groups no dependen de index.html — los contenedores
// #sps-activo/#sps-programados/#sps-pausados/#sps-cerrados ya existen y siguen
// siendo los anchors; cada función sigue generando su innerHTML completo, mismo
// patrón ya vigente en este archivo desde antes de este TKT.
// [PP] mod:110 · autor:Rune · 2026-07-21 23:05 UTC-6
// TKT CAEL-0721-06 (REQ CAEL-0721-05, parcial — JS completo, CSS pendiente de Nova):
// _sprintItemHtml() distingue REQ orphaned de pendiente real — nueva clase
// spi-item--orphaned (fila) + spi-item-status--orphaned (badge, propia, texto "Huérfano").
// Corrección post-QA Finn: statusCls caía en default 'pendiente' para orphaned pese a
// existir isOrphaned — badge mostraba color de pendiente con texto "Huérfano". Ver
// _Locus-css-ref.md — regla semántica --amber reservada a gaps de completitud.
// Chequeo vía item.status directo, independiente de _sprintItemBucket() (que sigue
// colapsando orphaned→'pendiente' por diseño, sin cambio — ver nota mod:94 abajo).
// [PP] mod:108 · autor:Rune · 2026-07-21 UTC-6
// TKT-fast: eliminado import huérfano { render } de locus-sesiones.js — sin call site,
// confirmado por grep antes de eliminar (hallazgo cerrado de TKT-202607-044).
// [PP] mod:107 · autor:Rune · 2026-07-21 UTC-6
// TKT-202607-044 (parcial — JS completo, CSS bloqueado): eliminado subsistema huérfano
//   "sprint en curso" (setSprintCurrent, _syncCurrentBadges, listener sobre
//   #sprint-manager-list — inexistente en index.html desde T-202606-036). Badge Activo/
//   Pausado unificado a sprint-badge-active/sprint-badge-paused (sin .sml-badge). Import
//   de _markStatusBarDirty eliminado (huérfano tras la limpieza). Bloqueo CSS: eliminar
//   .sml-badge/.sml-badge--active/--closed/--scheduled/--current de locus-sprint.css —
//   solo Nova escribe .css. Ver CHECKPOINT.
// TKT-202607-043: HTML sin escapar en 4 puntos — _sprintItemHtml (item.code/item.title,
//   texto + aria-label), _renderSprintWorkers (nombre de worker), _renderSprintScopeAdded
//   (i.code/i.title), _renderConflictBanner (s.id/s.label/s.name). Los 4 ahora usan
//   _escHtml() ya existente en el archivo — mismo patrón que el resto del módulo.
// TKT-202607-042: showToast('error', ...) en _sppReorder tenía argumentos invertidos
//   (mensaje como type, 'error' como title) — firma real es showToast(type, title).
//   _spsFieldEdit(): showToast('success', 'Sprint actualizado.') se disparaba
//   incondicional e inmediato sin esperar _upsertSprint() (async, no awaited) — en
//   fallo el founder veía éxito seguido de error. Movido a .then(), .catch() intacto.
// INC histórico — sin CHECKPOINT confirmado (fix — gate "mover ítems Q-Backlog" tras aprobar sprint_proposal):
// _spnpHandlePanelClick() leía `created.id` sobre el retorno de
// _tryIngestSprintProposalFromParsed() — esa función retorna un string (id corto del
// sprint), no un objeto, por contrato ya documentado en su propio comentario en
// locus-session-parse.js. `created.id` era undefined; el toast lo neutralizaba con
// `|| ''`, pero _spnpRenderGate(created.id, ...) lo pasaba sin guard — _escHtml(undefined)
// serializa a la string literal "undefined" en data-spnp-gate-sprint, y al click en
// "Mover seleccionados" cada ítem quedaba con item.sprint = "undefined" (string), sin
// coincidir con ningún sprint real. Fix: ambos call sites usan `created` directo — sin
// cambio de firma en _tryIngestSprintProposalFromParsed ni en _spnpRenderGate/
// _spnpHandleGateAction. contract_update: no.
// [PP] mod:103 · autor:Rune · 2026-07-13 20:38 UTC-6
// Hallazgo resuelto en sesión: _renderSpsCerrados() rama vacía sin
// .sps-section-label — agregado junto con .sps-section-count en '0'.
// Ver mod:102 abajo para el historial de CAEL-02 (rama con datos).
// TKT2 (REQ CAEL-05 — rediseño sub-tab Sprints, code real TKT-202607-099): .sph-panel deja
// de ser hermano de .sps-card en _renderSpsActivo() y pasa a ser su último hijo — fusión
// visual en un solo bloque bordeado (mockup aprobado por founder, "redesign_subtab_sprints").
// Solo cambia el punto de cierre/apertura del div — ningún atributo, clase ni AC de contenido
// interno de .sph-panel se modifica. CSS companion (Nova, mod:50) resuelve el borde/fondo
// duplicado — ver _Locus-css-ref.
// TKT1 (REQ CAEL-05 — rediseño sub-tab Sprints): _renderSpsActivo() deja de generar
// .sps-progress-wrap — CSS ya lo ocultaba con display:none (T-202606-033), 0 call sites
// de .sps-burndown-fill--complete/.sps-burndown-pct--complete verificado (BR-Execution §2
// Criterio de señal de refactor — código roto que bloqueaba el objetivo del TKT, no refactor
// silencioso). .sph-panel (Salud del sprint) pasa a ser la única barra de progreso — role
// progressbar migrado a .sph-bar-track. Ver _Locus-css-ref para el CSS Purity companion.
// TKT (badge sprint pausado 7+ días — Effort 1, sin módulo crítico): _renderSpsPausados()
// agrega staleness-pill.staleness--stale junto al título de la card cuando pauseRef
// (pausedAt || createdAt, mismo campo/fallback que ya alimentaba pausedDate) supera 7 días
// — implementa la alerta declarada en __BR-Ecosystem §5 ("Locus alerta si un sprint lleva
// más de 7 días en pausado") que el render existente no cubría. Umbral --stale (no --warn)
// decidido por Nova, consistente con la semántica ya establecida en _Locus-css-ref
// §Staleness pill (warn 4-7 días, stale >7 días) — sin excepción de color para este caso.
// Sin CSS nuevo — reutiliza staleness-pill/staleness--stale ya declarados (mod:51 css-ref).
// [PP] mod:94 · autor:Rune · 2026-07-12 UTC-6
// INC histórico — sin CHECKPOINT confirmado (Hallazgo de sesión de diagnóstico Cael — tab Sprint, sin TKT de
// origen): REQ en status "en-proceso" o "bloqueado" (__BR-Core §4) no caía en ninguna de
// las 4 secciones de _renderSprintItems ni se contaba en el badge de _updateSprintTabBadges
// — ambos sitios duplicaban la misma clasificación incompleta (solo pendiente/en-revision/
// done + heurística de _isBlocked para "pendiente sin movimiento"). Fix: _sprintItemBucket()
// nueva — función única que enumera explícitamente todos los status válidos de REQ y TKT y
// resuelve a un bucket, con fallback defensivo a 'pendiente' para status no contemplado (nunca
// invisible). en-proceso se mapea al bucket 'en-revision' existente (mismo pill/CSS class
// .spi-item-status--en-revision — sin cambio de HTML/CSS, sin entregable de Nova requerido).
// REQ bloqueado (gap de integración real) se distingue de la heurística _isBlocked, ambos
// caen en el bucket 'bloqueado' ya existente. orphaned se mapea a 'pendiente' — visibilidad,
// no bloquea (§4). _renderSprintItems y _updateSprintTabBadges consumen la misma función —
// elimina la duplicación que causó el bug original.
// [PP] mod:89 · autor:Rune · 2026-07-12 UTC-6
// TKT (REQ histórico — sin CHECKPOINT confirmado · ref: consolidación de punto de entrada único de sprint_proposal —
//   decisión del founder): el panel "+ Sprint nuevo" (#spnp-panel) deja de depender
//   exclusivamente de que otro archivo (card del worker o modal standalone) haya poblado
//   getPendingSprintProposal — gana su propio paste. _renderSpnpPanel, cuando no hay proposal
//   pendiente, muestra textarea (#spnp-paste-ta) + botón "Parsear" en vez del hint vacío.
//   _spnpHandlePanelClick gana rama 'parsear' → _spnpHandleParseClick(proj) (nueva): reusa
//   parseCheckpoint (import nuevo desde locus-session-parse.js) — mismo parser que
//   parsePaste/parsePasteStandalone, hereda el gate de exclusividad §12 (sprint_proposal +
//   items REQ/TKT → _jsonParseError) sin código adicional. Si el parseo es válido, persiste vía
//   setPendingSprintProposal (ya importado) y re-renderiza — reutiliza sin cambio el flujo de
//   fields + Aprobar/Rechazar existente. _spnpShowParseError (nueva) — helper de error inline,
//   mismo patrón visual que el error ya usado en la rama 'aprobar'. Ver mismo TKT en
//   locus-session-save.js (retiro de setPendingSprintProposal en el flujo de card del worker) y
//   locus-session-parse.js (retiro del Step 0 en el flujo standalone) — este archivo queda como
//   único punto de entrada de sprint_proposal en el ecosistema.
// [PP] mod:88 · autor:Rune · 2026-07-11 23:55 UTC-6
// TKT4 fix (gap de Finn, Momento 1): _spnpQBacklogItems() ya no filtra por
// projId/projectId de ítem — campo inexistente en el modelo de datos (ITEMS ya
// scopeado al proyecto activo vía sufijo de storage en locus-backlog-core.js, no
// vía campo de ítem; ver _Locus-module-contracts.md §ITEMS). Call site actualizado
// — ya no pasa proj.id como argumento.
// [PP] mod:87 · autor:Rune · 2026-07-11 23:45 UTC-6
// TKT4 (REQ histórico — sin CHECKPOINT confirmado · ref: CAEL-05): gate de ítems Q-Backlog tras aprobar sprint
// nuevo — _spnpQBacklogItems (REQ/TKT sin sprint del proyecto activo, sin filtro de
// relación por área/scope, decisión del founder) + _spnpRenderGate (markup Nova,
// design_intent: spnp-gate-inline-v1) + _spnpHandleGateAction (mover/omitir, mismo
// listener de #spnp-panel vía data-spnp-gate-action). Mutación de sprint reutiliza el
// patrón de _mdiffPersistSprint en locus-backlog-merge.js: item.sprint + item.priority
// vía _calcPriority (import nuevo desde locus-backlog-core.js) + item.history.push tipo
// 'sprint'. Branch 'aprobar' de _spnpHandlePanelClick ya no cierra el panel directo —
// cierra solo si no hay ítems en Q-Backlog; si hay, renderiza el gate y retorna.
// [PP] mod:86 · autor:Rune · 2026-07-11 23:20 UTC-6
// TKT2 (REQ histórico — sin CHECKPOINT confirmado · ref: CAEL-03) — corrección tras bug reportado por Finn:
// _spnpHandlePanelClick rama 'rechazar' no cerraba el panel ni reseteaba aria-expanded — AC
// de Rechazar violado. Corregido con el mismo patrón que el bloque de éxito de 'aprobar'
// (classList.add('is-hidden') + aria-expanded false).
// TKT2 (REQ histórico — sin CHECKPOINT confirmado · migración Step 0 DIFF → panel Sprint subtab): comportamiento del
// panel "+ Sprint nuevo" — _spnpAttachListeners/_spnpHandleTriggerClick/_renderSpnpPanel/
// _spnpHandlePanelClick. Toggle + foco al abrir (panel.focus() con tabindex=-1), estado vacío
// vía getPendingSprintProposal, Aprobar invoca _tryIngestSprintProposalFromParsed (misma función
// que Step 0 del DIFF — no se duplica la lógica de ingesta, no se llama _applySprintInheritanceToItems
// porque este panel no maneja items de un CHECKPOINT, solo creación de sprint), error inline con
// .spnp-error si retorna falsy, Rechazar/éxito llaman clearPendingSprintProposal. Hook en _sptSwitch
// al entrar a subtab 'sprints', idempotente (removeEventListener antes de addEventListener, mismo
// patrón que _sppHandleClick/_spsActivoHandleClick ya usado en este archivo).
// [PP] mod:84 · autor:Rune · 2026-07-10 17:15 UTC-6
// TKT-202607-042 (REQ-202607-014): eliminación real de 'plan' en _SPT_SUBTAB_VALID/_SPT_PANELS,
// del array literal de listeners de subtabs, de la referencia a panelPlan/sprint-panel-plan en
// la rama sin-sprint-activo, y de comentarios de visibilidad. El header mod:81 abajo declaraba
// esta limpieza como ya hecha — el código no reflejaba el comentario (verificado por Finn en
// auditoría de TKT-202607-041). Import de locus-sprint-plan.js nunca estuvo en este archivo —
// vivía en main.js (removido en este mismo TKT). getProjectById no es import de este módulo.
// [PP] mod:81 · autor:Rune · 2026-07-06 20:32 UTC-6
// REQ-execution-plan-deprecation: removido tab "Plan" — render (subtab 'plan' → renderPlanInto),
//   badge (btnPlan, AC-2 de _updateSprintTabBadges), import de locus-sprint-plan.js.
//   getProjectById también removido de import (sin otros consumidores tras este cambio).
//   No confundir con tab "Planificar" (_renderSprintPlanificar / locus-sprint-planificacion.js) —
//   feature distinto, no tocado.
// REQ-[tmp:req-vocab-historico]: comentario actualizado — referenciaba locus-backlog-archive.js
// (renombrado a locus-backlog-historico.js). Sin cambio de código, solo comentario.
// locus-sprint.js
// Módulo: Orquestador del tab Sprint — renderSprintTab, _renderSprintItems, _renderSprintWorkers, _renderSprintScopeAdded, _sptSwitch, _renderSprintPlanificar

import { _isBlocked, getItems, itemKind, _calcPriority, _getActiveSessionAiId } from './locus-backlog-core.js'; // TKT4 (REQ histórico — sin CHECKPOINT confirmado · ref: CAEL-05): _calcPriority/_getActiveSessionAiId — mismo patrón de mutación sprint que _mdiffPersistSprint en locus-backlog-merge.js
import { openItemPanel } from './locus-backlog-panel.js';
import { _renderPlanningView, _attachPlanCloseHandler, _attachPlanViewDelegation } from './locus-sprint-planificacion.js';
import { _getActiveSprint, confirmCloseSprint, createSprintFromGroup, openSprintRetroView, setSprintStatus, _getConflictingSprints } from './locus-backlog-sprints.js'; // T-202606-089 AC-3 · T-202606-105
import { _gconfirmOpen } from './locus-modals.js';
import { getAI, getActiveSprints, getAllSessions, save, _upsertSprint, getHistoricoItemsSync, refreshHistoricoCache, getActiveProject, getPendingSprintProposal, setPendingSprintProposal, clearPendingSprintProposal } from './locus-storage.js'; // INC-fix: contador de sprint cerrado no veía ítems migrados a historico — getHistoricoItemsSync/refreshHistoricoCache viven en locus-storage.js, no en locus-backlog-historico.js | TKT2 (REQ histórico — sin CHECKPOINT confirmado): getActiveProject/getPendingSprintProposal/clearPendingSprintProposal — panel "+ Sprint nuevo" | TKT (REQ histórico — sin CHECKPOINT confirmado · consolidación sprint_proposal): setPendingSprintProposal agregado — el panel persiste su propio paste ya parseado
import { _tryIngestSprintProposalFromParsed, parseCheckpoint } from './locus-session-parse.js'; // TKT2 (REQ histórico — sin CHECKPOINT confirmado): misma función que usa Step 0 del DIFF al aprobar (ver locus-session-save.js _ckptMeta.onApproveProposal) — sin duplicar lógica de ingesta | TKT (REQ histórico — sin CHECKPOINT confirmado · consolidación de punto de entrada único de sprint_proposal): parseCheckpoint agregado — el panel parsea su propio paste, ya no depende de setPendingSprintProposal poblado desde otro archivo
import { _getActiveProjectFilter } from './locus-proj-core.js';
import { showToast, toast } from './locus-toast.js';

// TKT-202607-044: import de _markStatusBarDirty eliminado — único call site vivía en
// setSprintCurrent(), eliminada en este mismo TKT (sin call site externo, ver comentario
// en la sección de exposición pública, más abajo en este archivo).

// ── Estado interno ──────────────────────────────────────────────────────────
let _sprintTabActiveSprint = null;
const _SPT_SUBTAB_KEY   = 'locus-sprint-subtab';
const _SPT_SUBTAB_VALID = ['items', 'planificar', 'sprints'];
let _sptActiveSubtab = _SPT_SUBTAB_VALID.includes(localStorage.getItem(_SPT_SUBTAB_KEY))
  ? localStorage.getItem(_SPT_SUBTAB_KEY)
  : 'items'; // B-202606-066: persiste entre recargas de página

// ── Helpers internos ────────────────────────────────────────────────────────

function _spEl(id) { return document.getElementById(id); }

function _sprintDaysLabel(sprint) {
  if (!sprint || !sprint.startedAt) return '';
  const opened = new Date(sprint.startedAt);
  const now    = new Date();
  const days   = Math.floor((now - opened) / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Hace 1 día';
  return `Hace ${days} días`;
}

function _sprintReleaseClass(type) {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t === 'major') return 'is-major';
  if (t === 'patch') return 'is-patch';
  return '';
}

function _sprintIsBlocked(item) {
  return _isBlocked(item);
}

// B-202606-008: normaliza sprint.id extrayendo solo el prefijo base (antes del ' · ')
// Necesario porque sprint.id puede contener el label completo ("PP-S-01 · Nombre")
// mientras que i.sprint almacena solo el prefijo base ("PP-S-01").
function _spIdBase(sprintId) {
  return (sprintId || '').split(' · ')[0].trim();
}

// B-202606-XXX: tras deserialización desde JSON el getter item.sprint definido en
// _normalizeItems (T-202606-084) se pierde — solo sprint_id persiste como campo real.
// _iSprint() lee sprint_id con fallback a sprint para cubrir ambos casos.
function _iSprint(i) { return i.sprint_id !== undefined ? i.sprint_id : (i.sprint || ''); }

// INC histórico — sin CHECKPOINT confirmado: bucket único para clasificar ítems del sprint board — enumera
// explícitamente todos los status válidos de REQ y TKT (__BR-Core §4), evitando que un
// status no contemplado (REQ en-proceso/bloqueado/orphaned) desaparezca silenciosamente
// de las 4 secciones del sprint board. Consumida por _renderSprintItems y
// _updateSprintTabBadges — antes duplicaban la misma lógica incompleta en 2 sitios
// independientes (Hallazgo de auditoría — sesión de diagnóstico Cael, sin TKT de origen).
function _sprintItemBucket(item) {
  if (item.status === 'done') return 'done';
  if (item.status === 'bloqueado') return 'bloqueado';      // REQ — gap de integración (Finn)
  if (_sprintIsBlocked(item)) return 'bloqueado';            // pendiente sin movimiento >N días
  if (item.status === 'en-revision') return 'en-revision';   // TKT
  if (item.status === 'en-proceso') return 'en-revision';    // REQ — mismo bucket visual, en curso
  if (item.status === 'pendiente') return 'pendiente';
  if (item.status === 'orphaned') return 'pendiente';        // REQ — visibilidad, no bloquea (§4)
  return 'pendiente'; // fallback defensivo — status no contemplado, nunca invisible
}

function _sprintItemHtml(item) {
  // TKT (2026-07): usa _sprintItemBucket() como única fuente de verdad — antes
  // isBlocked/isEnRevision se derivaban ad-hoc y no cubrían REQ en-proceso ni
  // REQ bloqueado (status explícito, gap de integración), aunque el ítem ya
  // caía en la sección correcta del board vía _sprintItemBucket en _renderSprintItems.
  const bucket    = _sprintItemBucket(item);
  const isDone    = bucket === 'done';
  const isBlocked = bucket === 'bloqueado';
  // TKT CAEL-0721-06: orphaned se lee de item.status directamente — el bucket
  // ya colapsa orphaned→'pendiente' por diseño (§4, visibilidad sin bloquear release),
  // así que no es distinguible desde bucket. Chequeo independiente, sin tocar _sprintItemBucket().
  const isOrphaned = item.status === 'orphaned';
  let cls = 'spi-item';
  if (isBlocked)  cls += ' spi-item--blocked';
  if (isDone)     cls += ' spi-item--done';
  if (isOrphaned) cls += ' spi-item--orphaned';

  const isEnRevision = bucket === 'en-revision';
  const statusLabel = isDone ? 'Done' : isBlocked ? 'Bloqueado' : isEnRevision ? 'En revisión' : isOrphaned ? 'Huérfano' : 'Pendiente';
  const statusCls   = isDone ? 'spi-item-status--done' : isBlocked ? 'spi-item-status--blocked' : isEnRevision ? 'spi-item-status--en-revision' : isOrphaned ? 'spi-item-status--orphaned' : 'spi-item-status--pendiente';
  const blockedIcon = isBlocked ? `<span class="spi-item-blocked-icon" aria-hidden="true">⚠</span>` : '';

  // Progreso de hijos (Ts)
  let childrenHtml = '';
  if (Array.isArray(getItems())) {
    const children = getItems().filter(i => i.parentCode === item.code && itemKind(i) === 'TKT');
    if (children.length > 0) {
      const done = children.filter(c => c.status === 'done').length;
      childrenHtml = `<span class="spi-item-children">${done}/${children.length} T</span>`;
    }
  }

  // TKT-202607-043: item.code/item.title sin escapar — texto y aria-label. Único
  // renderer de ítem del board (todas las secciones) sin _escHtml(), pese a ser la
  // convención ya usada por el resto del archivo (_renderSpsActivo, _renderSpsProgramados, etc).
  return `<div class="${cls}" tabindex="0" role="button" aria-label="${_escHtml(item.code)}: ${_escHtml(item.title || '')}" data-item-code="${_escHtml(item.code)}">
  ${blockedIcon}
  <span class="spi-item-code">${_escHtml(item.code)}</span>
  <span class="spi-item-title">${_escHtml(item.title || '')}</span>
  ${childrenHtml}
  <span class="spi-item-status ${statusCls}">${statusLabel}</span>
</div>`;
}

// ── Sub-tab del sprint — R-202605-052 ───────────────────────────────────────
// Paneles del tab Sprint tienen IDs propios (sprint-panel-*).
// switchSubTab opera sobre sspanel-*/sstab-btn-* del tab Docs — contextos distintos.
// _sptSwitch gestiona exclusivamente los paneles del tab Sprint.

const _SPT_PANELS   = ['items', 'planificar', 'sprints']; // T-202606-029: tercer sub-tab tras cancelación de Plan (TKT-202607-042)

// TKT1 (REQ CAEL-0804-01) — fix bug mayor (Finn, auditoría TKT1): #sph-collapsed-pct
// tiene dos call sites que recomputan el burndown (#sph-bd-pct) — renderSprintTab()
// y _sptSwitch() al volver al sub-tab Ítems. Extraído a función compartida para que
// ambos sincronicen el resumen colapsado, no solo el primero.
function _sphSyncCollapsedPct() {
  const collapsedPctEl = _spEl('sph-collapsed-pct');
  if (!collapsedPctEl) return;
  const bdPctEl = _spEl('sph-bd-pct');
  collapsedPctEl.textContent = bdPctEl ? bdPctEl.textContent : '0%';
}

function _sptSwitch(subtab, triggerBtn, skipItemsRender = false) {
  _sptActiveSubtab = subtab; // B-202606-065/066: persiste entre renders y recargas de página
  localStorage.setItem(_SPT_SUBTAB_KEY, subtab);
  // TKT2 (REQ CAEL-0814-01, ref_id CAEL-08141400-03) AC1: el header (.spt-shell) ya no se
  // oculta al entrar a la sub-tab Sprints — mismo shell visible en las 3 sub-tabs sin
  // excepción (design_intent: spt_shell_unified_mockup). Reemplaza el toggle de T-202606-042.
  _SPT_PANELS.forEach(s => {
    const panel = document.getElementById('sprint-panel-' + s);
    const btn   = document.getElementById('spt-tab-' + s);
    const active = (s === subtab);
    if (panel) panel.classList.toggle('is-hidden', !active);
    if (btn) {
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    }
  });
  // Render bajo demanda
  if (subtab === 'items' && !skipItemsRender) { // B-202606-008: re-render al volver al subtab Ítems — skip si viene desde renderSprintTab (evita doble render)
    const sprint = _getActiveSprint();
    if (sprint) {
      const itemsList = document.getElementById('sprint-items-list');
      if (itemsList) itemsList.classList.remove('is-hidden');
      _renderSprintItems(sprint);
      _sphSyncCollapsedPct(); // TKT1 (REQ CAEL-0804-01) — fix bug mayor, ver Finn
      _renderSprintWorkers(sprint);
      _renderSprintScopeAdded(sprint);
    }
  }
  if (subtab === 'planificar') _renderSprintPlanificar();
  if (subtab === 'sprints') {
    _renderSpsStatsBlock(); // cierra bloqueo parcial mod:111 — shell en index.html mod:151
    _renderSpsActivo(); // T-202606-036
    _renderSpsProgramados(); // T-202606-037
    _renderSpsPausados(); // T-202606-041
    // TKT-B1: _renderSpsHotfix eliminada — Q-INC reemplaza S-HOTFIX
    _renderSpsCerrados(); // T-202606-039
    _spnpAttachListeners(); // TKT2 (REQ histórico — sin CHECKPOINT confirmado): panel "+ Sprint nuevo" — idempotente, mismo patrón remove/add que el resto del subtab
  }
}

// ── Panel "+ Sprint nuevo" — TKT2 (REQ histórico — sin CHECKPOINT confirmado · migración Step 0 DIFF → panel Sprint subtab) ──
// design_intent: sprint-nuevo-panel-v1

function _spnpAttachListeners() {
  const triggerBtn = document.getElementById('spnp-trigger-btn');
  const panel = document.getElementById('spnp-panel');
  if (!triggerBtn || !panel) return;
  triggerBtn.removeEventListener('click', _spnpHandleTriggerClick);
  triggerBtn.addEventListener('click', _spnpHandleTriggerClick);
  panel.removeEventListener('click', _spnpHandlePanelClick);
  panel.addEventListener('click', _spnpHandlePanelClick);
}

function _spnpHandleTriggerClick() {
  const triggerBtn = document.getElementById('spnp-trigger-btn');
  const panel = document.getElementById('spnp-panel');
  if (!triggerBtn || !panel) return;
  const isOpen = !panel.classList.contains('is-hidden');
  if (isOpen) {
    panel.classList.add('is-hidden');
    triggerBtn.setAttribute('aria-expanded', 'false');
    return;
  }
  _renderSpnpPanel();
  panel.classList.remove('is-hidden');
  triggerBtn.setAttribute('aria-expanded', 'true');
  // AC — foco se mueve al primer campo real del panel al abrir (D-02, __Role-Nova §Reglas de conversación 6)
  // TKT (CAEL-0803-02): antes enfocaba el contenedor #spnp-panel — nunca el campo real
  // (textarea o botón). _spnpFocusFirstField() resuelve el primer elemento focosable
  // real de cualquiera de los 3 estados de render (vacío/propuesta/gate), con fallback
  // al panel si no hay ninguno (caso defensivo, no debería ocurrir en ningún estado real).
  _spnpFocusFirstField(panel);
}

// TKT (CAEL-0803-02): enfoca el primer campo focosable real dentro de panel — textarea,
// input o botón. Fallback a panel.focus() (tabindex=-1) si no hay ninguno.
function _spnpFocusFirstField(panel) {
  const first = panel.querySelector('textarea, input:not([disabled]), button:not([disabled])');
  if (first) { first.focus(); return; }
  panel.setAttribute('tabindex', '-1');
  panel.focus();
}

function _renderSpnpPanel() {
  const panel = document.getElementById('spnp-panel');
  if (!panel) return;
  const proj = getActiveProject();
  const proposal = proj ? getPendingSprintProposal(proj.id) : null;

  if (!proposal) {
    // TKT (REQ histórico — sin CHECKPOINT confirmado · consolidación de punto de entrada único de sprint_proposal —
    // decisión del founder): este panel deja de depender de que otro archivo (card del worker
    // o modal standalone) haya poblado la propuesta en storage — parsea su propio paste.
    // design_intent: sprint-nuevo-panel-v1 (extensión — paste propio, sin borrador nuevo de Nova
    // por tratarse de un textarea + botón, mismo patrón visual ya usado en modal standalone).
    panel.innerHTML =
      '<div class="spnp-empty-hint">Pegá acá el CHECKPOINT con <code>sprint_proposal</code> — debe ir en un bloque independiente, sin ítems REQ/TKT.</div>' +
      '<textarea id="spnp-paste-ta" class="spnp-paste-ta" rows="6" placeholder="Pegar CHECKPOINT aquí..."></textarea>' +
      '<div class="spnp-actions">' +
        '<button class="btn-primary" type="button" data-spnp-action="parsear">Parsear</button>' +
      '</div>';
    return;
  }

  const id = proposal.id || '';
  const outOfScope = (proposal.out_of_scope && proposal.out_of_scope.length)
    ? '<div class="spnp-row"><span class="spnp-label">Out of scope</span><span class="spnp-value">' + proposal.out_of_scope.map(_escHtml).join(' · ') + '</span></div>'
    : '';

  panel.innerHTML =
    '<div class="spnp-header">' +
      '<span class="spnp-badge">Propuesta pendiente</span>' +
      '<span class="spnp-title">' + _escHtml(id) + '</span>' +
    '</div>' +
    '<div class="spnp-fields">' +
      '<div class="spnp-row"><span class="spnp-label">Sprint</span><span class="spnp-value">' + _escHtml(id) + '</span></div>' +
      '<div class="spnp-row"><span class="spnp-label">Versión</span><span class="spnp-value">' + _escHtml(proposal.version_target) + '</span></div>' +
      '<div class="spnp-row"><span class="spnp-label">Tipo</span><span class="spnp-value">' + _escHtml(proposal.release_type) + '</span></div>' +
      '<div class="spnp-row"><span class="spnp-label">Scope</span><span class="spnp-value">' + _escHtml(proposal.scope) + '</span></div>' +
      '<div class="spnp-row"><span class="spnp-label">Goal</span><span class="spnp-value">' + _escHtml(proposal.goal) + '</span></div>' +
      outOfScope +
    '</div>' +
    '<div class="spnp-actions">' +
      '<button class="btn-primary" type="button" data-spnp-action="aprobar">Aprobar apertura</button>' +
      '<button class="sps-btn" type="button" data-spnp-action="rechazar">Rechazar</button>' +
    '</div>';
}

function _spnpHandlePanelClick(e) {
  // TKT (CAEL-0803-03): checkbox maestro 'Seleccionar todos' — marca/desmarca todos los
  // ítems del gate. Se resuelve antes que el resto de la delegación porque no tiene
  // data-spnp-*-action propio.
  const selectAllCb = e.target.closest('.spnp-gate-select-all');
  if (selectAllCb) {
    const checked = selectAllCb.checked;
    selectAllCb.indeterminate = false;
    document.querySelectorAll('#spnp-panel .spnp-gate-cb:not(.spnp-gate-select-all)').forEach(cb => { cb.checked = checked; });
    return;
  }
  // TKT (CAEL-0803-03): checkbox individual del gate — sincroniza el estado visual del
  // checkbox maestro (checked/indeterminate) tras cada cambio manual.
  const itemCb = e.target.closest('.spnp-gate-cb:not(.spnp-gate-select-all)');
  if (itemCb) {
    _spnpSyncGateSelectAll();
    return;
  }
  // TKT4 (REQ histórico — sin CHECKPOINT confirmado · ref: CAEL-05): acciones del gate — mismo listener, distinto data-attribute
  const gateBtn = e.target.closest('[data-spnp-gate-action]');
  if (gateBtn) {
    _spnpHandleGateAction(gateBtn);
    return;
  }
  const actionBtn = e.target.closest('[data-spnp-action]');
  if (!actionBtn) return;
  const action = actionBtn.dataset.spnpAction;
  const proj = getActiveProject();
  if (!proj) return;

  if (action === 'parsear') {
    _spnpHandleParseClick(proj);
    return;
  }

  if (action === 'rechazar') {
    clearPendingSprintProposal(proj.id);
    const panel = document.getElementById('spnp-panel');
    const triggerBtn = document.getElementById('spnp-trigger-btn');
    if (panel) panel.classList.add('is-hidden');
    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
    return;
  }

  if (action === 'aprobar') {
    const proposal = getPendingSprintProposal(proj.id);
    if (!proposal) { _renderSpnpPanel(); return; }
    const existingErr = document.querySelector('#spnp-panel .spnp-error');
    if (existingErr) existingErr.remove();

    const created = _tryIngestSprintProposalFromParsed(proposal);
    if (!created) {
      const actions = document.querySelector('#spnp-panel .spnp-actions');
      const errEl = document.createElement('div');
      errEl.className = 'spnp-error';
      errEl.textContent = 'No se pudo crear el sprint — revisa el ID o inténtalo de nuevo.';
      if (actions) actions.insertAdjacentElement('afterend', errEl);
      else document.getElementById('spnp-panel').appendChild(errEl);
      return;
    }

    clearPendingSprintProposal(proj.id);
    // INC histórico — sin CHECKPOINT confirmado: `created` es un string (contrato documentado de
    // _tryIngestSprintProposalFromParsed — "Retorna el id del sprint creado (string) o false"),
    // no un objeto. `created.id` leía undefined, filtrado a '' solo en el toast por el
    // `|| ''` — pero pasado sin ese guard a _spnpRenderGate(), que lo serializaba a la
    // string literal "undefined" vía _escHtml(String(undefined)) en el atributo
    // data-spnp-gate-sprint. Al mover ítems, item.sprint quedaba escrito como "undefined".
    showToast('success', 'Sprint ' + created + ' creado.');
    _renderSpsActivo();
    _renderSpsProgramados();

    // TKT4 (REQ histórico — sin CHECKPOINT confirmado · ref: CAEL-05): gate de ítems Q-Backlog tras aprobar —
    // sin filtro de relación por área/scope, decisión del founder (código original ex
    // T-202606-164 no recuperable). proj.id ya validado no-null arriba en este handler.
    const _spnpQItems = _spnpQBacklogItems();
    if (_spnpQItems.length > 0) {
      _spnpRenderGate(created, _spnpQItems);
      return; // panel permanece visible mostrando el gate — se cierra al Mover/Omitir
    }

    const panel = document.getElementById('spnp-panel');
    const triggerBtn = document.getElementById('spnp-trigger-btn');
    if (panel) panel.classList.add('is-hidden');
    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
  }
}

// TKT (REQ histórico — sin CHECKPOINT confirmado · ref: consolidación de punto de entrada único de sprint_proposal —
// decisión del founder): parsea el CHECKPOINT pegado directamente en el paste propio del panel
// "+ Sprint nuevo" — única ruta de ingesta de sprint_proposal en todo el ecosistema. Reutiliza
// parseCheckpoint (locus-session-parse.js) — mismo parser que parsePaste/parsePasteStandalone,
// sin duplicar lógica de parseo ni el gate de exclusividad §12 (sprint_proposal + items REQ/TKT
// → _jsonParseError, ya enforced dentro de parseCheckpoint). Si el parseo es válido, persiste
// vía setPendingSprintProposal y re-renderiza el panel — reutiliza el flujo de fields +
// Aprobar/Rechazar ya existente en _renderSpnpPanel, sin cambio en esa parte.
// no_incluye: no valida rol emisor del CHECKPOINT (mismo criterio que _tryIngestSprintProposalFromParsed,
// que tampoco lo valida — fuera de scope de este TKT). No maneja batch de múltiples CHECKPOINTs
// en un solo paste — un paste = un sprint_proposal, mismo alcance que el panel ya tenía.
function _spnpHandleParseClick(proj) {
  const panel = document.getElementById('spnp-panel');
  const ta = document.getElementById('spnp-paste-ta');
  if (!panel || !ta) return;

  const existingErr = panel.querySelector('.spnp-error');
  if (existingErr) existingErr.remove();

  const text = ta.value.trim();
  if (!text) {
    _spnpShowParseError(panel, 'Pegá el texto del CHECKPOINT antes de parsear.');
    return;
  }

  const ckpt = parseCheckpoint(text);

  if (!ckpt || !ckpt.isCheckpoint || !ckpt.titulo) {
    _spnpShowParseError(panel, 'Formato inválido — se esperaba bloque JSON sin especificador de lenguaje.');
    return;
  }

  if (ckpt._jsonParseError) {
    _spnpShowParseError(panel, ckpt._jsonParseError);
    return;
  }

  if (!ckpt._rawSprintProposal) {
    _spnpShowParseError(panel, 'CHECKPOINT válido pero sin sprint_proposal detectado.');
    return;
  }

  setPendingSprintProposal(proj.id, ckpt._rawSprintProposal);
  _renderSpnpPanel();
}

// Helper: muestra el error inline del panel "+ Sprint nuevo" — mismo patrón visual que el
// error de 'aprobar' en _spnpHandlePanelClick (clase .spnp-error).
function _spnpShowParseError(panel, msg) {
  const actions = panel.querySelector('.spnp-actions');
  const errEl = document.createElement('div');
  errEl.className = 'spnp-error';
  errEl.textContent = msg;
  if (actions) actions.insertAdjacentElement('afterend', errEl);
  else panel.appendChild(errEl);
}


// asignado, sin descartar. Sin filtro de proyecto: getItems() ya retorna únicamente
// el array ITEMS del proyecto activo (hidratado por sufijo de storage en
// locus-backlog-core.js — no existe campo projId/projectId en ítems individuales,
// gap detectado por Finn en Momento 1, corregido aquí). Sin filtro de relación con
// el sprint recién creado (decisión del founder).
function _spnpQBacklogItems() {
  if (!Array.isArray(getItems())) return [];
  return getItems().filter(i => {
    const kind = itemKind(i);
    if (kind !== 'REQ' && kind !== 'TKT') return false;
    if (_iSprint(i)) return false;
    if (i.status === 'descartado') return false;
    return true;
  });
}

// TKT4: renderiza el gate dentro de #spnp-panel — markup de Nova (design_intent: spnp-gate-inline-v1)
function _spnpRenderGate(createdSprintId, items) {
  const panel = document.getElementById('spnp-panel');
  if (!panel) return;
  const rows = items.map(i =>
    '<label class="spnp-gate-item"><input type="checkbox" class="spnp-gate-cb" value="' + _escHtml(i.code) + '">' +
    '<span class="spnp-gate-item-label">' + _escHtml(i.code) + ' · ' + _escHtml(i.title || '') + '</span></label>'
  ).join('');
  panel.innerHTML =
    '<div class="spnp-gate">' +
      '<div class="spnp-gate-header"><span class="spnp-badge">Ítems sin sprint</span></div>' +
      '<p class="spnp-gate-desc">' + items.length + ' ítem' + (items.length === 1 ? '' : 's') + ' en Q-Backlog — ¿mover al sprint recién creado?</p>' +
      '<label class="spnp-gate-item spnp-gate-select-all-row">' +
        '<input type="checkbox" class="spnp-gate-cb spnp-gate-select-all" id="spnp-gate-select-all">' +
        '<span class="spnp-gate-item-label spnp-gate-select-all-label">Seleccionar todos</span>' +
      '</label>' +
      '<div class="spnp-gate-list">' + rows + '</div>' +
      '<div class="spnp-gate-actions">' +
        '<button class="btn-primary" type="button" data-spnp-gate-action="mover" data-spnp-gate-sprint="' + _escHtml(createdSprintId) + '">Mover seleccionados</button>' +
        '<button class="sps-btn" type="button" data-spnp-gate-action="omitir">Omitir</button>' +
      '</div>' +
    '</div>';
}

// TKT (CAEL-0803-03): sincroniza el estado visual de 'Seleccionar todos' contra los
// checkboxes individuales — checked si todos están marcados, indeterminate si es mixto.
function _spnpSyncGateSelectAll() {
  const selectAllCb = document.querySelector('#spnp-panel .spnp-gate-select-all');
  if (!selectAllCb) return;
  const items = Array.from(document.querySelectorAll('#spnp-panel .spnp-gate-cb:not(.spnp-gate-select-all)'));
  if (!items.length) { selectAllCb.checked = false; selectAllCb.indeterminate = false; return; }
  const checkedCount = items.filter(cb => cb.checked).length;
  selectAllCb.checked = checkedCount === items.length;
  selectAllCb.indeterminate = checkedCount > 0 && checkedCount < items.length;
}

// TKT4: acciones del gate — Mover seleccionados / Omitir
function _spnpHandleGateAction(gateBtn) {
  const action = gateBtn.dataset.spnpGateAction;
  const panel = document.getElementById('spnp-panel');
  const triggerBtn = document.getElementById('spnp-trigger-btn');

  if (action === 'omitir') {
    if (panel) panel.classList.add('is-hidden');
    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
    return;
  }

  if (action === 'mover') {
    const sprintId = gateBtn.dataset.spnpGateSprint || '';
    const checked = Array.from(document.querySelectorAll('#spnp-panel .spnp-gate-cb:checked'));
    if (!checked.length) return; // Mover sin selección — no-op, gate permanece abierto

    checked.forEach(cb => {
      const item = getItems().find(i => i.code === cb.value);
      if (!item) return;
      item.sprint = sprintId;
      item.priority = _calcPriority(item);
      if (!item.history) item.history = [];
      item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: '', to: sprintId } });
    });
    save();

    if (panel) panel.classList.add('is-hidden');
    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
    showToast('success', checked.length + ' ítem' + (checked.length === 1 ? '' : 's') + ' movido' + (checked.length === 1 ? '' : 's') + ' a ' + sprintId + '.');
  }
}

// ── Render panel Planificar — R-202605-052 ──────────────────────────────────

function _renderSprintPlanificar() {
  const container = document.getElementById('sprint-planificar-container');
  if (!container) return;
  _renderPlanningView(container);
  // B-202606-034: adjuntar delegación de drag & drop al container correcto —
  // antes se adjuntaba a #backlog-list (que no existe en el tab Sprint)
  _attachPlanViewDelegation(container);
  _attachPlanCloseHandler();
}

// Helper: escapar HTML para valores en innerHTML
function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── T-202606-XXX: _spsFieldEdit — edit inline click-directo en sub-tab Sprints ──
//
// Convierte un elemento de texto (.sps-meta-value, .sps-scheduled-name) en un
// <input> inline. blur/Enter → commit. Escape → cancelar. Muta sprint en getActiveSprints()
// para persistir. Renderiza la sección correspondiente al confirmar.
//
// @param {Element}  el         — elemento de texto a convertir
// @param {string}   sprintId   — ID del sprint a editar
// @param {string}   field      — clave del campo ('label' | 'version_target' | 'release_type' | 'goal')
// @param {Function} onDone     — callback post-commit/cancel → re-render del contenedor
// @param {Object}   [opts]     — { inputType: 'text'|'select', options: [{v,t}] }

function _spsFieldEdit(el, sprintId, field, onDone, opts) {
  if (el.dataset.spsEditing === '1') return;
  el.dataset.spsEditing = '1';

  // B-202606-030: initialValue calculado internamente desde el modelo — el caller
  // no pasa initialValue. Fuente única de verdad: getActiveSprints()[sprintId][field].
  // original queda como fallback de display para guard de no-cambio.
  const _sp          = getActiveSprints().find(function(s) { return s.id === sprintId; });
  const initialValue = _sp ? (_sp[field] !== undefined ? String(_sp[field]) : '') : el.textContent;
  const original     = el.textContent;
  const isSelect     = opts && opts.inputType === 'select';
  let input;

  if (isSelect) {
    input = document.createElement('select');
    input.className = 'sps-field-input sps-field-select';
    (opts.options || []).forEach(function(o) {
      const opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.t;
      if (o.v === initialValue || o.t === initialValue) opt.selected = true;
      input.appendChild(opt);
    });
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'sps-field-input';
    input.value = initialValue === '—' ? '' : initialValue;
  }

  el.classList.add('is-hidden');
  el.parentNode.insertBefore(input, el.nextSibling);
  input.focus();
  if (!isSelect) input.select();

  let committed = false;

  function _commit() {
    if (committed) return;
    committed = true;
    const newVal = isSelect ? input.value : input.value.trim();
    input.remove();
    el.classList.remove('is-hidden');
    delete el.dataset.spsEditing;
    // B-202606-030: initialValue siempre viene del modelo — _noChangeRef usa initialValue directamente
    const _noChangeRef = initialValue;
    if (newVal && newVal !== _noChangeRef && newVal !== '—') {
      const sp = getActiveSprints().find(function(s) { return s.id === sprintId; });
      if (sp) {
        // B-202606-029: label NO concatena el ID — id y label son campos separados (BR-Ecosystem §5)
        if (field === 'label') {
          sp.label = newVal;
        } else {
          sp[field] = newVal;
        }
        // TKT-202607-042: showToast('success', ...) se disparaba de forma incondicional
        // e inmediata, sin esperar la resolución de _upsertSprint() (async, no awaited) —
        // en fallo el founder veía "Sprint actualizado" seguido del toast de error.
        // save() persiste `state` — los sprints viven en tracker_sprints desde T-202606-005
        // y no se sincronizan vía save(). Usar _upsertSprint().
        // QA: _getActiveProjectFilter() puede ser '' en vista "todos" — usar el proyecto
        // dueño del sprint primero, mismo patrón que setSprintStatus en locus-backlog-sprints.js.
        const _projId = sp.projId || sp.projectId || _getActiveProjectFilter();
        _upsertSprint(sp, _projId).then(function() {
          showToast('success', 'Sprint actualizado.');
        }).catch(function(err) {
          showToast('error', 'Error al guardar. Intenta de nuevo.');
        });
      }
    }
    onDone();
  }

  function _cancel() {
    if (committed) return;
    committed = true;
    input.remove();
    el.classList.remove('is-hidden');
    delete el.dataset.spsEditing;
    // sin save — solo re-render para limpiar estado visual
    onDone();
  }

  input.addEventListener('blur', _commit);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); input.removeEventListener('blur', _commit); _cancel(); }
  });
}

// ── END T-202606-XXX ─────────────────────────────────────────────────────────

// ── INC histórico — sin CHECKPOINT confirmado: flip-to-fit — .sps-dropdown vs overflow:hidden de .sps-card ──
// .sps-card (contenedor compartido de filas en #sps-programados y #sps-cerrados)
// declara overflow:hidden por su border-radius. Un .sps-dropdown anclado con top:32px
// en una fila cercana al borde inferior del card se recorta/oculta — no es problema de
// z-index. Medir SIEMPRE contra el borde inferior de .sps-card (no el viewport): el
// clipping es del card, no de la pantalla. Función compartida por los 3 usos de
// .sps-menu-wrap/.sps-dropdown en este archivo (activo/programados/cerrados) — no
// duplicada por handler. Ver _Locus-css-ref §Sprint activo — familia sps-* y
// _Locus-ux-ref §E-10 para el criterio completo.
function _spsApplyDropdownFlip(menuBtn, dropdown) {
  dropdown.classList.remove('sps-dropdown--flip');
  const card = menuBtn.closest('.sps-card');
  if (!card) return;
  const btnRect  = menuBtn.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const spaceBelow    = cardRect.bottom - btnRect.bottom;
  const dropdownHeight = dropdown.offsetHeight;
  if (spaceBelow < dropdownHeight) {
    dropdown.classList.add('sps-dropdown--flip');
  }
}

// TKT5 (REQ-202607-100, histórico): wiring de apertura/cierre del menú ⋯ — antes
// triplicado byte-a-byte en _renderSpsActivo (inline handler), _sppHandleClick
// (Programados) y _spsCerradosHandleClick (Cerrados, retirado en mod:111 — el
// rediseño de item-rows elimina el menú ··· de esa sección, ver _renderSpsCerrados).
// Sigue vigente para Activo/Programados. Encapsula: toggle de dropdown.hidden +
// aria-expanded + _spsApplyDropdownFlip() al abrir + listener de click-fuera
// con auto-remove. No decide el atributo data-*-menu ni hace stopPropagation
// — eso sigue siendo responsabilidad del caller (ver Cerrados, que necesita
// stopPropagation antes de invocar esto para no disparar el expand de fila).
function _spsWireDropdownToggle(menuBtn) {
  const dropdown = menuBtn.nextElementSibling;
  if (!dropdown) return;
  const isOpen = !dropdown.hidden;
  dropdown.hidden = isOpen;
  menuBtn.setAttribute('aria-expanded', String(!isOpen));
  if (isOpen) return;
  _spsApplyDropdownFlip(menuBtn, dropdown);
  function _closeOnOutside(ev) {
    if (!menuBtn.closest('.sps-menu-wrap').contains(ev.target)) {
      dropdown.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', _closeOnOutside, true);
    }
  }
  setTimeout(function() {
    document.addEventListener('click', _closeOnOutside, true);
  }, 0);
}

// ── Rediseño sub-tab Sprints — status-group wrapper (mod:111, design_intent:
// sprint_subtab_redesign) ────────────────────────────────────────────────────
// Reemplaza el <span class="sps-section-label"> plano de las 4 secciones por
// .sps-status-group/.sps-status-header/.sps-status-body (CSS Nova, locus-sprint.css
// mod:64). Un solo helper por las 4 funciones — evita duplicar el wrapper byte-a-byte
// (mismo criterio que _spsWireDropdownToggle ya usado en este archivo).

// Colapso por sección — estado en memoria, no persistido. Resetea al default declarado
// abajo en cada reload, consistente con el resto de UI efímera del tab Sprint (menús,
// edición inline). Claves: 'activo' | 'programados' | 'pausados' | 'cerrados'.
// TKT-202608-387 (REQ-202608-159): default cambia de "todo expandido" a solo
// 'activo' expandido — 'programados'/'pausados'/'cerrados' nacen colapsados. El founder
// puede expandir cualquiera durante la sesión (_spsGroupToggleHandler ya lo soporta sin
// cambio) — el reset ocurre solo en reload, mismo criterio que _SPS_ACTIVO_DETAIL_COLLAPSED.
const _SPS_GROUP_COLLAPSED = new Set(['programados', 'pausados', 'cerrados']);

// TKT-202608-366 (REQ-202608-146, TKT2): colapso de detalle de la card #sps-activo —
// independiente de _SPS_GROUP_COLLAPSED (ese Set colapsa la SECCIÓN "Activo" completa;
// esto colapsa el detalle interno de la card ya visible dentro de la sección). Mismo
// criterio de estado en memoria — resetea a colapsado (default del AC) en reload.
// Fix FINN-08161900-01: nacía en false — AC exige colapsado por default, no expandido.
let _SPS_ACTIVO_DETAIL_COLLAPSED = true;

function _spsGroupHtml(key, title, count, headerModifier, bodyHtml) {
  const collapsed = _SPS_GROUP_COLLAPSED.has(key);
  return (
    '<div class="sps-status-group' + (collapsed ? ' is-collapsed' : '') + '" data-sps-group="' + key + '">' +
      '<div class="sps-status-header sps-status-header--' + headerModifier + '" role="button" tabindex="0" ' +
        'aria-expanded="' + (!collapsed) + '" aria-controls="sps-status-body-' + key + '" data-sps-group-toggle="' + key + '">' +
        '<div class="sps-status-header-meta">' +
          '<span class="sps-status-title">' + _escHtml(title) + '</span>' +
          '<span class="sps-status-count">' + count + '</span>' +
        '</div>' +
        '<span class="sps-status-chevron" aria-hidden="true">▼</span>' +
      '</div>' +
      '<div class="sps-status-body" id="sps-status-body-' + key + '">' + bodyHtml + '</div>' +
    '</div>'
  );
}

// Empty state — mismo patrón textual que .sps-empty/.qc-empty (título + hint
// opcional), sin ícono — ninguna de las dos referencias declara clase de ícono.
function _spsGroupEmptyHtml(title, hint) {
  return (
    '<div class="sps-status-empty">' +
      '<p class="sps-status-empty-title">' + _escHtml(title) + '</p>' +
      (hint ? '<p class="sps-status-empty-hint">' + _escHtml(hint) + '</p>' : '') +
    '</div>'
  );
}

// Toggle de colapso — clase is-collapsed vive en .sps-status-group; CSS ya
// resuelve la rotación del chevron y el display:none del body (mod:64). JS solo
// mueve la clase + aria-expanded + persiste la clave en _SPS_GROUP_COLLAPSED.
function _spsGroupToggleHandler(e) {
  const header = e.target.closest('[data-sps-group-toggle]');
  if (!header) return;
  const key = header.dataset.spsGroupToggle;
  const group = header.closest('.sps-status-group');
  if (!group) return;
  const willCollapse = !group.classList.contains('is-collapsed');
  group.classList.toggle('is-collapsed', willCollapse);
  header.setAttribute('aria-expanded', String(!willCollapse));
  if (willCollapse) _SPS_GROUP_COLLAPSED.add(key);
  else _SPS_GROUP_COLLAPSED.delete(key);
}

function _spsGroupToggleKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const header = e.target.closest('[data-sps-group-toggle]');
  if (!header) return;
  e.preventDefault();
  header.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

// Idempotente — mismo patrón remove/add ya usado en todo el archivo. Se llama al
// final de cada una de las 4 funciones de render, sobre el mismo container que ya
// tiene sus propios listeners de sección (menú, edición inline, etc.) — ambos
// coexisten porque cada handler filtra por su propio selector antes de actuar.
function _spsAttachGroupToggle(container) {
  if (!container) return;
  container.removeEventListener('click', _spsGroupToggleHandler);
  container.addEventListener('click', _spsGroupToggleHandler);
  container.removeEventListener('keydown', _spsGroupToggleKeydown);
  container.addEventListener('keydown', _spsGroupToggleKeydown);
}
// ── END status-group wrapper ─────────────────────────────────────────────────

// ── Bloque de métricas #sps-stats-block — cierra bloqueo parcial declarado en
// mod:111 (index.html no estaba adjunto en esa sesión). Shell estático ya vive
// en index.html (BR-Execution §5 — elemento invariante, nunca se genera por JS);
// esta función solo actualiza el textContent de los 4 contadores, mismo criterio
// que #qdisc-stats-block. Fuente: getActiveSprints() — mismo dato ya consumido
// por _renderSpsActivo/_getProgramadosSprints/_renderSpsPausados/_renderSpsCerrados,
// sin recorrido ni filtro de proyecto nuevo (getActiveSprints() ya viene acotado
// al proyecto activo, mismo supuesto que el resto de este archivo). ──
function _renderSpsStatsBlock() {
  const allSprints = getActiveSprints() || [];
  const nActivo      = allSprints.filter(function(s) { return s.status === 'active'; }).length;
  const nProgramados = allSprints.filter(function(s) { return s.status === 'scheduled'; }).length;
  const nPausados     = allSprints.filter(function(s) { return s.status === 'paused'; }).length;
  const nCerrados     = allSprints.filter(function(s) { return s.status === 'closed'; }).length;

  const elActivo      = document.getElementById('sps-stat-activo');
  const elProgramados = document.getElementById('sps-stat-programados');
  const elPausados     = document.getElementById('sps-stat-pausados');
  const elCerrados     = document.getElementById('sps-stat-cerrados');
  if (elActivo)      elActivo.textContent      = String(nActivo);
  if (elProgramados) elProgramados.textContent = String(nProgramados);
  if (elPausados)     elPausados.textContent     = String(nPausados);
  if (elCerrados)     elCerrados.textContent     = String(nCerrados);
}
// ── END #sps-stats-block ─────────────────────────────────────────────────────

// ── T-202606-036 / T-202606-043: _renderSpsActivo — card del sprint activo ──
//
// T-202606-043: rediseño — card-header con menú ··· (Pausar · sep · Cerrar rojo),
// meta-grid (versión · release · goal), barra done/total.
// Sin botones inline. Sin edición inline de campos.
// Empty state con CTA si no hay sprint activo.

function _renderSpsActivo() {
  const container = document.getElementById('sps-activo');
  if (!container) return;

  const sprint = _getActiveSprint();

  if (!sprint) {
    container.innerHTML = _spsGroupHtml('activo', 'Activo', 0, 'activo',
      _spsGroupEmptyHtml(
        'No hay sprint activo.',
        'La apertura de sprint se propone desde Cael (sprint_proposal) — no hay creación manual.'
      )
    );
    _spsAttachGroupToggle(container);
    return;
  }

  const id    = sprint.id || '';
  // INC histórico — sin CHECKPOINT confirmado: 'label' se renderiza en sps-card-title, junto a sps-card-id
  // (span separado, ver container.innerHTML abajo) — no debe re-incluir el id como prefijo
  // o duplica visualmente el ID. Mismo bug ya corregido en Programados/Cerrados/Pausados —
  // esta era la instancia visible en la captura del founder (sub-tab Sprints → Activo).
  const label = sprint.label || sprint.name || id;
  const vt    = sprint.version_target || '—';
  const rt    = sprint.release_type || sprint.releaseType || '—';
  const goal  = sprint.goal || '—';

  // Burndown — ítems done/total (R/B/T, sin descartados)
  let total = 0;
  let done  = 0;
  let spItems = [];
  if (Array.isArray(getItems())) {
    const _sid = _spIdBase(id);
    spItems = getItems().filter(i => {
      const t = i.type || (i.code ? i.code.charAt(0) : '');
      return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
        (['REQ','TKT'].includes(itemKind({type:t}))) &&
        i.status !== 'descartado';
    });
    total = spItems.length;
    done  = spItems.filter(i => i.status === 'done').length;
  }
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // T-202606-034: conteo de bloqueados — reutiliza _sprintIsBlocked() ya
  // existente (L48), misma fuente que _sprintItemHtml() usa para el listado.
  // Un solo recorrido sobre spItems ya filtrado — no se recalcula el universo.
  const bloqueadosCount = spItems.filter(i => i.status !== 'done' && _sprintIsBlocked(i)).length;

  // T-202606-003: modificador visual para sprint pausado
  const pausadoCls = sprint.status === 'paused' ? ' sps-card--pausado' : '';
  // TKT-202608-366 (REQ-202608-146, TKT2): sps-card--collapsed alterna .sps-meta/.sph-panel
  // vs .sps-card-pct-mini (locus-sprint.css mod:74) — la identidad del header nunca se oculta.
  const collapsedCls = _SPS_ACTIVO_DETAIL_COLLAPSED ? ' sps-card--collapsed' : '';

  const _spsActivoCardHtml =
    '<div class="sps-card' + pausadoCls + collapsedCls + '" data-sprint-id="' + _escHtml(id) + '">' +
      '<div class="sps-card-header">' +
        '<span class="sps-card-id font-mono">' + _escHtml(id) + '</span>' +
        '<span class="sps-card-title sps-meta-editable" tabindex="0" title="Click para editar título">' + _escHtml(label) + '</span>' +
        '<span class="sprint-badge-active">Activo</span>' +
        '<span class="sps-card-pct-mini">' + pct + '%</span>' +
        '<div class="sps-menu-wrap">' +
          '<button class="sps-btn-menu" type="button" aria-label="Acciones del sprint activo" aria-expanded="false" aria-haspopup="true" data-sps-activo-menu>···</button>' +
          '<div class="sps-dropdown" role="menu" aria-label="Acciones sprint activo" hidden>' +
            '<button class="sps-dropdown-item" role="menuitem" type="button" data-sps-action="pausar">Pausar sprint</button>' +
            '<div class="sps-dropdown-sep" role="separator"></div>' +
            '<button class="sps-dropdown-item sps-dropdown-item--danger" role="menuitem" type="button" data-sps-action="cerrar">Cerrar sprint</button>' +
          '</div>' +
        '</div>' +
        '<button class="sps-card-detail-toggle" type="button" data-sps-detail-toggle ' +
          'aria-expanded="' + (!_SPS_ACTIVO_DETAIL_COLLAPSED) + '" ' +
          'aria-label="' + (_SPS_ACTIVO_DETAIL_COLLAPSED ? 'Expandir detalle del sprint' : 'Contraer detalle del sprint') + '">' +
          '<svg class="ti-svg chevron" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>' +
        '</button>' +
      '</div>' +
      '<div class="sps-meta">' +
        '<div class="sps-meta-item"><span class="sps-meta-label">Versión</span><span class="sps-meta-value sps-meta-editable" tabindex="0" title="Click para editar">' + _escHtml(vt) + '</span></div>' +
        '<div class="sps-meta-item"><span class="sps-meta-label">Release</span><span class="sps-meta-value sps-meta-editable" tabindex="0" title="Click para editar">' + _escHtml(rt) + '</span></div>' +
        '<div class="sps-meta-item sps-meta-item--goal"><span class="sps-meta-label">Goal</span><span class="sps-meta-value sps-meta-editable" tabindex="0" title="Click para editar">' + _escHtml(goal) + '</span></div>' +
      '</div>' +
      '<div class="sph-panel">' +
        '<span class="sph-title">Salud del sprint</span>' +
        '<div class="sph-row">' +
          '<div class="sph-bar-track" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso del sprint: ' + done + ' de ' + total + ' ítems done">' +
            '<div class="sph-bar-fill"></div>' +
          '</div>' +
          '<span class="sph-pct">' + pct + '%</span>' +
        '</div>' +
        '<span class="sph-count">' + done + ' / ' + total + ' ítems</span>' +
        '<div class="sph-alert">' +
          '<span class="sph-alert-icon">⚠</span>' +
          '<span class="sph-alert-text">' + bloqueadosCount + ' ítems bloqueados</span>' +
        '</div>' +
      '</div>' +
    '</div>';

  container.innerHTML = _spsGroupHtml('activo', 'Activo', 1, 'activo', _spsActivoCardHtml);

  // CSS Purity: variable de progreso via setProperty — único cálculo (pct),
  // único consumidor tras eliminación de .sps-progress-wrap muerto (TKT1 REQ CAEL-05,
  // 0 call sites de .sps-burndown-fill--complete/.sps-burndown-pct--complete verificado).
  const sphFillEl = container.querySelector('.sph-bar-fill');
  if (sphFillEl) sphFillEl.style.setProperty('--sps-burndown-pct', pct + '%');

  // T-202606-034: fila de alerta — visibilidad por classList, nunca por
  // ausencia/presencia en el DOM (CSS Purity / no innerHTML condicional).
  const sphAlertEl = container.querySelector('.sph-alert');
  if (sphAlertEl) sphAlertEl.classList.toggle('is-visible', bloqueadosCount > 0);

  // Menú ···
  container.removeEventListener('click', _spsActivoHandleClick);
  container.addEventListener('click', _spsActivoHandleClick);
  container.removeEventListener('keydown', _spsActivoHandleKeydown);
  container.addEventListener('keydown', _spsActivoHandleKeydown);
  _spsAttachGroupToggle(container);
}

function _spsActivoHandleKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const editable = e.target.closest('.sps-meta-editable');
  if (editable) { e.preventDefault(); editable.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
}

function _spsActivoHandleClick(e) {
  // Edit inline — click en .sps-meta-value
  // Campos editables: Versión (version_target), Release (release_type), Goal (goal)
  // El campo Título (label) se edita haciendo click en .sps-card-title
  const metaVal = e.target.closest('.sps-meta-value, .sps-card-title');
  if (metaVal && !e.target.closest('[data-sps-activo-menu]') && !e.target.closest('.sps-dropdown')) {
    const sprint = _getActiveSprint();
    if (!sprint) return;

    const metaItem = metaVal.closest('.sps-meta-item');
    const isTitle  = metaVal.classList.contains('sps-card-title');
    let field, opts;

    if (isTitle) {
      field = 'label';
      // B-202606-030: initialValue calculado internamente — caller no pasa initialValue
      opts = {};
    } else if (metaItem) {
      const label = metaItem.querySelector('.sps-meta-label');
      const labelTxt = label ? label.textContent.trim() : '';
      if (labelTxt === 'Versión')  { field = 'version_target'; }
      else if (labelTxt === 'Release') {
        field = 'release_type';
        opts = { inputType: 'select', options: [
          { v: 'Major', t: 'Major' },
          { v: 'Minor', t: 'Minor' },
          { v: 'Patch', t: 'Patch' },
        ]};
      } else if (labelTxt === 'Goal') { field = 'goal'; }
    }

    if (field) {
      _spsFieldEdit(metaVal, sprint.id, field, function() { _renderSpsActivo(); }, opts);
      return;
    }
  }

  // TKT-202608-366: toggle de detalle — independiente del menú ··· y del colapso de sección
  const detailToggle = e.target.closest('[data-sps-detail-toggle]');
  if (detailToggle) {
    _SPS_ACTIVO_DETAIL_COLLAPSED = !_SPS_ACTIVO_DETAIL_COLLAPSED;
    const card = detailToggle.closest('.sps-card');
    if (card) card.classList.toggle('sps-card--collapsed', _SPS_ACTIVO_DETAIL_COLLAPSED);
    detailToggle.setAttribute('aria-expanded', String(!_SPS_ACTIVO_DETAIL_COLLAPSED));
    detailToggle.setAttribute('aria-label', _SPS_ACTIVO_DETAIL_COLLAPSED ? 'Expandir detalle del sprint' : 'Contraer detalle del sprint');
    return;
  }

  // Toggle menú
  const menuBtn = e.target.closest('[data-sps-activo-menu]');
  if (menuBtn) {
    _spsWireDropdownToggle(menuBtn);
    return;
  }

  // Acciones del menú
  const action = e.target.closest('[data-sps-action]');
  if (action) {
    // Cerrar menú
    const dropdown = action.closest('.sps-dropdown');
    if (dropdown) { dropdown.hidden = true; }
    const menuWrap = action.closest('.sps-menu-wrap');
    if (menuWrap) {
      const btn = menuWrap.querySelector('[data-sps-activo-menu]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    const act    = action.getAttribute('data-sps-action');
    const sprint = _getActiveSprint();
    if (!sprint) return;
    if (act === 'pausar') {
      const newStatus = sprint.status === 'paused' ? 'active' : 'paused';
      setSprintStatus(sprint.id, newStatus);
      _renderSpsActivo();
    } else if (act === 'cerrar') {
      confirmCloseSprint(sprint.id);
    }
  }
}

// ── END T-202606-036 / T-202606-043 ──────────────────────────────────────────

// ── T-202606-037 / T-202606-043: _renderSpsProgramados ──────────────────────
//
// T-202606-043: rediseño — section-label, una card contenedora, una fila por
// sprint programado con: drag-handle · ID · título · .pill-prog · badge
// adelantados (.pill-adv / .pill-adv-zero) · menú ··· · .sps-bd-mini ·
// conteo done/total. Sin botón inline de descartar.
// Empty state 'Sin sprints programados' si no hay programados.

function _getProgramadosSprints() {
  const all = getActiveSprints().filter(function(s) { return s.status === 'scheduled'; });

  const withOrder    = all.filter(function(s) { return typeof s.activationOrder === 'number'; });
  const withoutOrder = all.filter(function(s) { return typeof s.activationOrder !== 'number'; });

  withOrder.sort(function(a, b) { return a.activationOrder - b.activationOrder; });

  if (withoutOrder.length > 0) {
    const startIdx = withOrder.length;
    withoutOrder.forEach(function(s, i) { s.activationOrder = startIdx + i; });
    try {
      save();
    } catch (err) {
      // activationOrder queda asignado en memoria — próxima lectura reintenta la normalización
    }
  }

  return withOrder.concat(withoutOrder);
}

function _renderSpsProgramados() {
  const container = document.getElementById('sps-programados');
  if (!container) return;

  const sprints = _getProgramadosSprints();

  // TKT4 (REQ-202607-100): sin programados → línea muda visible, la sección
  // no desaparece. Reemplaza el is-hidden anterior (AC-4 de T-202606-001,
  // superseded — el comportamiento de "ocupar cero espacio" quedaba
  // inconsistente con Activo, que sí muestra mensaje).
  if (sprints.length === 0) {
    container.innerHTML = _spsGroupHtml('programados', 'Programados', 0, 'programados',
      _spsGroupEmptyHtml('Sin sprints programados')
    );
    container.classList.remove('is-hidden');
    container.removeEventListener('click', _sppHandleClick);
    _spsAttachGroupToggle(container);
    return;
  }

  // Hay programados — restaurar visibilidad si estaba oculto
  container.classList.remove('is-hidden');

  const rows = sprints.map(function(s) {
    const id    = s.id || '';
    // INC histórico — sin CHECKPOINT confirmado: 'label' se renderiza junto a un span de id separado (sps-scheduled-id,
    // línea siguiente) — no debe re-incluir el id como prefijo o duplica visualmente el ID.
    // Mismo criterio ya correcto en _renderSprintSummaryTable (ssm-row-name): label crudo, sin id.
    const label = s.label || s.name || id;

    // Conteo done/total de ítems del sprint programado
    let total = 0;
    let done  = 0;
    let advDone = 0; // ítems ya done en un sprint programado = adelantados
    let spItems = []; // INC histórico — sin CHECKPOINT confirmado: sacado del if-block — TKT3 (L1175) lo consume fuera del scope original
    if (Array.isArray(getItems())) {
      const _sid = _spIdBase(id);
      spItems = getItems().filter(function(i) {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
          (['REQ','TKT'].includes(itemKind({type:t}))) &&
          i.status !== 'descartado';
      });
      total   = spItems.length;
      done    = spItems.filter(function(i) { return i.status === 'done'; }).length;
      advDone = done; // en sprint programado, todo done es trabajo adelantado
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const advClass = advDone > 0 ? 'pill-adv' : 'pill-adv-zero';
    const advText  = advDone + ' adelantados';

    // TKT3 (REQ-202607-100): bloqueadosCount reutiliza _sprintIsBlocked() —
    // mismo criterio ya usado en _renderSpsActivo (L725). Badge ausente del
    // DOM cuando count=0 — no oculto por CSS.
    const bloqueadosCount = spItems.filter(function(i) {
      return i.status !== 'done' && _sprintIsBlocked(i);
    }).length;
    const blockedBadgeHtml = bloqueadosCount > 0
      ? '<span class="sps-blocked-badge"><span class="sph-alert-icon">⚠</span>' +
          bloqueadosCount + (bloqueadosCount === 1 ? ' bloqueado' : ' bloqueados') +
        '</span>'
      : '';

    return '<div class="sps-scheduled-row" draggable="false" data-sprint-id="' + _escHtml(id) + '">' +
        '<span class="drag-handle" tabindex="0" role="button" aria-label="Reordenar sprint ' + _escHtml(id) + '"></span>' +
        '<span class="sps-scheduled-id font-mono">' + _escHtml(id) + '</span>' +
        '<span class="sps-scheduled-name sps-meta-editable" tabindex="0" title="Click para editar título">' + _escHtml(label) + '</span>' +
        '<span class="pill-prog">Programado</span>' +
        '<span class="' + advClass + '">' + advText + '</span>' +
        blockedBadgeHtml +
        '<div class="sps-menu-wrap">' +
          '<button class="sps-btn-menu" type="button" aria-label="Acciones sprint ' + _escHtml(id) + '" aria-expanded="false" aria-haspopup="true" data-spp-menu>···</button>' +
          '<div class="sps-dropdown" role="menu" aria-label="Acciones ' + _escHtml(id) + '" hidden>' +
            '<button class="sps-dropdown-item sps-dropdown-item--danger" role="menuitem" type="button" data-spp-action="descartar">Descartar sprint</button>' +
          '</div>' +
        '</div>' +
        '<div class="sps-bd-mini" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + _escHtml(id) + ': ' + done + ' de ' + total + ' done">' +
          '<div class="sps-bd-mini-fill" data-sps-bd-pct="' + pct + '"></div>' +
        '</div>' +
        '<span class="sps-scheduled-count">' + done + ' / ' + total + '</span>' +
      '</div>';
  }).join('');

  // CAEL-02 (REQ CAEL-05, TKT5, histórico): .sps-section-count — pill de conteo
  // hijo del label. Superseded por mod:111 — el conteo vive ahora en
  // .sps-status-count dentro de .sps-status-header (_spsGroupHtml), no en
  // .sps-section-count. El criterio de fondo (no ocultar el conteo en 0,
  // AC3 de CAEL-02) se conserva — _spsGroupHtml no oculta el count en 0.
  container.innerHTML = _spsGroupHtml('programados', 'Programados', sprints.length, 'programados',
    '<div class="sps-card">' + rows + '</div>'
  );

  container.querySelectorAll('.sps-bd-mini-fill[data-sps-bd-pct]').forEach(function(fillEl) {
    fillEl.style.setProperty('--sbm-fill-width', fillEl.dataset.spsBdPct + '%');
  });

  container.removeEventListener('click', _sppHandleClick);
  container.addEventListener('click', _sppHandleClick);
  container.removeEventListener('keydown', _sppHandleKeydown);
  container.addEventListener('keydown', _sppHandleKeydown);

  _sppAttachDrag(container);
  _spsAttachGroupToggle(container);
}

function _sppHandleKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const editable = e.target.closest('.sps-meta-editable');
  if (editable) { e.preventDefault(); editable.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
}

function _sppHandleClick(e) {
  // Edit inline — click en .sps-scheduled-name (título del sprint programado)
  const nameEl = e.target.closest('.sps-scheduled-name');
  if (nameEl && !e.target.closest('.sps-menu-wrap')) {
    const row = nameEl.closest('.sps-scheduled-row');
    const sprintId = row ? row.getAttribute('data-sprint-id') : null;
    if (!sprintId) return;
    // B-202606-030: initialValue calculado internamente — caller no pasa initialValue ni descriptive2
    _spsFieldEdit(nameEl, sprintId, 'label', function() { _renderSpsProgramados(); }, {});
    return;
  }

  // Toggle menú ···
  const menuBtn = e.target.closest('[data-spp-menu]');
  if (menuBtn) {
    _spsWireDropdownToggle(menuBtn);
    return;
  }

  // Acción descartar desde menú
  const discardBtn = e.target.closest('[data-spp-action="descartar"]');
  if (discardBtn) {
    // Cerrar menú
    const dropdown = discardBtn.closest('.sps-dropdown');
    if (dropdown) { dropdown.hidden = true; }
    const menuWrap = discardBtn.closest('.sps-menu-wrap');
    if (menuWrap) {
      const btn = menuWrap.querySelector('[data-spp-menu]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    const row = discardBtn.closest('.sps-scheduled-row');
    const id  = row ? row.getAttribute('data-sprint-id') : null;
    const sprint = getActiveSprints().find(function(s) { return s.id === id; });
    if (!sprint) return;

    const labelText = sprint.label ? `${sprint.id} · ${sprint.label}` : (sprint.name || sprint.id);
    _gconfirmOpen({
      title: 'Descartar sprint',
      msg: 'Se descartará el sprint "' + labelText + '". Esta acción no se puede deshacer.',
      okLabel: 'Descartar',
      danger: true
    }, function() {
      sprint.status = 'discarded';
      try {
        save();
      } catch (err) {
        showToast('error', 'Error al guardar. Intenta de nuevo.');
        sprint.status = 'scheduled';
      }
      _renderSpsProgramados();
    });
    return;
  }
}

// ── END T-202606-037 / T-202606-043 ──────────────────────────────────────────

/**
 * _sppAttachDrag — habilita reordenamiento drag & drop sobre las filas de
 * #sps-programados. El drag solo inicia desde .drag-handle: mousedown sobre
 * el handle habilita draggable en la fila; dragend lo deshabilita. Arrastrar
 * el resto de la fila no activa drag (AC-3).
 */
function _sppAttachDrag(container) {
  const rows = container.querySelectorAll('.sps-scheduled-row');
  rows.forEach(function(row) {
    const handle = row.querySelector('.drag-handle');
    if (!handle) return;

    var _dragStarted = false;

    handle.addEventListener('mousedown', function() {
      _dragStarted = false;
      row.setAttribute('draggable', 'true');
    });

    handle.addEventListener('mouseup', function() {
      if (!_dragStarted) row.setAttribute('draggable', 'false');
    });

    handle.addEventListener('mouseleave', function() {
      if (!_dragStarted) row.setAttribute('draggable', 'false');
    });

    row.addEventListener('dragstart', function(e) {
      if (row.getAttribute('draggable') !== 'true') { e.preventDefault(); return; }
      _dragStarted = true;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', row.getAttribute('data-sprint-id') || '');
      row.classList.add('is-dragging');
    });

    row.addEventListener('dragend', function() {
      _dragStarted = false;
      row.classList.remove('is-dragging');
      row.setAttribute('draggable', 'false');
    });

    row.addEventListener('dragover', function(e) {
      e.preventDefault();
    });

    row.addEventListener('drop', function(e) {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId  = row.getAttribute('data-sprint-id');
      if (!draggedId || draggedId === targetId) return;
      _sppReorder(draggedId, targetId);
    });
  });
}

/**
 * _sppReorder — mueve el sprint draggedId a la posición de targetId dentro
 * de los sprints programados, reasigna activationOrder secuencial (0-based)
 * a todos según el nuevo orden, persiste via save() y re-renderiza (AC-3).
 */
function _sppReorder(draggedId, targetId) {
  const sprints = _getProgramadosSprints();
  const fromIdx = sprints.findIndex(function(s) { return s.id === draggedId; });
  const toIdx   = sprints.findIndex(function(s) { return s.id === targetId; });
  if (fromIdx === -1 || toIdx === -1) return;

  const reordered = sprints.slice();
  const moved = reordered.splice(fromIdx, 1)[0];
  reordered.splice(toIdx, 0, moved);

  reordered.forEach(function(s, i) { s.activationOrder = i; });

  try {
    save();
  } catch (err) {
    showToast('error', 'Error al guardar el orden. Intenta de nuevo.');
  }

  _renderSpsProgramados();
}

// ── END T-202606-037 ─────────────────────────────────────────────────────────

// ── B-202606-064: T-202606-131/132 eliminados — aprobación de sprint ocurre via Step 0 del DIFF ──

// ── B-202606-006: helper — HTML del contenedor R con Ts hijos ────────────────

function _sprintRGroupHtml(rItem, childTs) {
  const code  = rItem.code  || '';
  const title = rItem.title || '';
  // B-202606-013: indicador de progreso X/N Ts done — solo cuando hay Ts en el sprint
  const tDone  = childTs.filter(t => t.status === 'done').length;
  const tTotal = childTs.length;
  const progressHtml = tTotal > 0
    ? `<span class="spi-r-header-progress">${tDone}/${tTotal} T</span>`
    : '';
  return `<div class="spi-r-group" data-r-group="${code}">
  <div class="spi-r-header" role="button" tabindex="0"
       aria-expanded="true" aria-controls="spi-r-children-${code}"
       data-r-toggle="${code}">
    <span class="spi-r-header-code">${code}</span>
    <span class="spi-r-header-title">${title}</span>
    ${progressHtml}
    <span class="spi-r-header-toggle" aria-hidden="true">▾</span>
  </div>
  <div class="spi-r-children" id="spi-r-children-${code}">
    ${childTs.map(_sprintItemHtml).join('')}
  </div>
</div>`;
}

function _renderSprintItems(sprint) {
  // B-202606-006: guard corregido — getItems() siempre retorna array, nunca undefined
  if (!Array.isArray(getItems())) return;

  // B-202606-008: normalizar sprint.id — puede contener el label completo ("PP-S-01 · Nombre")
  // mientras que i.sprint almacena solo el prefijo base ("PP-S-01"). Sin normalización el
  // startsWith falla y spItems queda vacío aunque haya ítems en el sprint.
  const _sid = _spIdBase(sprint.id);

  const spItems = getItems().filter(i => {
    const t = i.type || (i.code ? i.code.charAt(0) : '');
    return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
      (['REQ','TKT'].includes(itemKind({type:t}))) &&
      i.status !== 'descartado';
  });

  const pendiente   = spItems.filter(i => _sprintItemBucket(i) === 'pendiente');
  const enRevision  = spItems.filter(i => _sprintItemBucket(i) === 'en-revision');
  const bloqueado   = spItems.filter(i => _sprintItemBucket(i) === 'bloqueado');
  const done        = spItems.filter(i => _sprintItemBucket(i) === 'done');

  // B-202606-006 AC-1: helper — renderiza una sección agrupando Rs con sus Ts hijos.
  // Un R se renderiza como contenedor (_sprintRGroupHtml) solo si tiene al menos un T
  // hijo en la misma sección. R sin Ts en la sección → ítem plano, no contenedor vacío (AC-3).
  // Ts huérfanos (sin R padre en spItems) y Bs siempre se renderizan como ítems planos (AC-2).
  function _renderSection(sectionItems) {
    if (!sectionItems.length) return null; // null = señal de empty state al llamador

    const rItems = sectionItems.filter(i => itemKind(i) === 'REQ');
    const tItems = sectionItems.filter(i => itemKind(i) === 'TKT');
    const bItems = sectionItems.filter(i => itemKind(i) === 'INC');

    const rCodesInSection = new Set(rItems.map(r => r.code));

    // Ts con R padre presente en esta sección → agrupados bajo el R
    // Ts sin R padre en esta sección (huérfanos) → ítem plano (AC-2)
    const tByParent = {};
    const tOrphans  = [];
    tItems.forEach(t => {
      const parentCode = t.parentCode || t.parent || null;
      if (parentCode && rCodesInSection.has(parentCode)) {
        if (!tByParent[parentCode]) tByParent[parentCode] = [];
        tByParent[parentCode].push(t);
      } else {
        tOrphans.push(t);
      }
    });

    const parts = [];

    // Rs con Ts hijos → grupo contenedor; Rs sin Ts en esta sección → ítem plano (AC-3)
    rItems.forEach(r => {
      const childTs = tByParent[r.code] || [];
      parts.push(childTs.length ? _sprintRGroupHtml(r, childTs) : _sprintItemHtml(r));
    });

    // Ts huérfanos y Bs siempre planos (AC-2)
    tOrphans.forEach(t => parts.push(_sprintItemHtml(t)));
    bItems.forEach(b  => parts.push(_sprintItemHtml(b)));

    return parts.join('');
  }

  // Sección pendiente
  const bodyPend = _spEl('spi-body-pendiente');
  const cntPend  = _spEl('spi-count-pendiente');
  if (bodyPend) {
    const html = _renderSection(pendiente);
    bodyPend.innerHTML = html !== null ? html : '<div class="spi-section-empty">Sin ítems pendientes</div>';
  }
  if (cntPend) cntPend.textContent = pendiente.length;

  // Sección en-revision — B-202606-031
  const bodyRev = _spEl('spi-body-en-revision');
  const cntRev  = _spEl('spi-count-en-revision');
  if (bodyRev) {
    const html = _renderSection(enRevision);
    bodyRev.innerHTML = html !== null ? html : '<div class="spi-section-empty">Sin ítems en revisión</div>';
  }
  if (cntRev) cntRev.textContent = enRevision.length;

  // Sección bloqueado
  const bodyBlk = _spEl('spi-body-bloqueado');
  const cntBlk  = _spEl('spi-count-bloqueado');
  if (bodyBlk) {
    const html = _renderSection(bloqueado);
    bodyBlk.innerHTML = html !== null ? html : '<div class="spi-section-empty">Sin ítems bloqueados</div>';
  }
  if (cntBlk) cntBlk.textContent = bloqueado.length;

  // Sección done
  const bodyDone = _spEl('spi-body-done');
  const cntDone  = _spEl('spi-count-done');
  if (bodyDone) {
    const html = _renderSection(done);
    bodyDone.innerHTML = html !== null ? html : '<div class="spi-section-empty">Sin ítems completados</div>';
  }
  if (cntDone) cntDone.textContent = done.length;

  // TKT-202607-126 (REQ-202607-039) AC1: spi-stats-block — reusa los 4 conteos ya computados
  // arriba (pendiente/enRevision/bloqueado/done) para las secciones spi-body-* — sin recomputar.
  const statPend = _spEl('spi-stat-pendiente');
  const statRev  = _spEl('spi-stat-en-revision');
  const statBlk  = _spEl('spi-stat-bloqueado');
  const statDone = _spEl('spi-stat-done');
  if (statPend) statPend.textContent = pendiente.length;
  if (statRev)  statRev.textContent  = enRevision.length;
  if (statBlk)  statBlk.textContent  = bloqueado.length;
  if (statDone) statDone.textContent = done.length;

  // TKT-202607-126 AC3: spi-content-empty alterna con .spi-list — nunca ambos, nunca ninguno
  // (index.html mod:158, comentario Nova). .sca-section se auto-gestiona en
  // _renderSprintScopeAdded() según scopeItems.length — no se toca aquí.
  const contentEmptyEl = _spEl('spi-content-empty');
  const itemsListEl    = _spEl('sprint-items-list');
  const isEmpty = spItems.length === 0;
  if (contentEmptyEl) contentEmptyEl.classList.toggle('is-hidden', !isEmpty);
  if (itemsListEl)    itemsListEl.classList.toggle('is-hidden', isEmpty);

  // Burndown — TKT-202607-134 (REQ-202607-039, INC-202607-045): effort-based, antes
  // item-count-based (done.length/total). Fórmula portada de renderSprintBurndown()
  // (locus-backlog-sprints.js, retirada en el mismo TKT) — el shell estático de Nova en
  // index.html ya asume effort-based (#sph-bd-label nace 'Effort: 0 / 0'). Solo ítems con
  // effort declarado contribuyen al cálculo; el resto se señala en #sph-bd-warn sin bloquearlo.
  const withEffort    = spItems.filter(i => i.effort && parseInt(i.effort) > 0);
  const withoutEffort = spItems.filter(i => !i.effort || parseInt(i.effort) === 0);

  const totalEffort = withEffort.reduce((acc, i) => acc + parseInt(i.effort), 0);
  const doneEffort  = withEffort
    .filter(i => i.status === 'done')
    .reduce((acc, i) => acc + parseInt(i.effort), 0);

  const pct = totalEffort > 0 ? Math.round(doneEffort / totalEffort * 100) : 0;

  const bdFill  = _spEl('sph-bd-fill');
  const bdPct   = _spEl('sph-bd-pct');
  const bdLabel = _spEl('sph-bd-label');
  const bdTrack = _spEl('sph-bd-track');
  const bdWarn  = _spEl('sph-bd-warn');

  if (bdFill) {
    bdFill.style.setProperty('--sph-bd-width', `${pct}%`);
    bdFill.classList.toggle('is-complete', pct === 100);
    bdFill.classList.toggle('is-ready',    pct === 100);
  }
  if (bdPct)   bdPct.textContent   = `${pct}%`;
  if (bdLabel) bdLabel.textContent = `Effort: ${doneEffort} / ${totalEffort}`;
  if (bdTrack) {
    bdTrack.setAttribute('aria-valuenow', pct);
    bdTrack.setAttribute('aria-valuetext', `${pct}% completado`);
  }

  // Ítems sin effort — señal visible, no bloquean el cálculo (ya excluidos de totalEffort/doneEffort arriba)
  if (bdWarn) {
    if (withoutEffort.length > 0) {
      bdWarn.textContent = `${withoutEffort.length} ítem${withoutEffort.length > 1 ? 's' : ''} sin effort — no incluido${withoutEffort.length > 1 ? 's' : ''} en el cálculo`;
      bdWarn.classList.remove('is-hidden');
    } else {
      bdWarn.classList.add('is-hidden');
      bdWarn.textContent = '';
    }
  }

  // T-202606-042: bloque btnClose eliminado — #btn-close-sprint removido del HTML. Acción vive en .sps-actions (sub-tab Sprints)
}

function _renderSprintWorkers(sprint) {
  const body   = _spEl('spw-body');
  const section = _spEl('sprint-workers');
  if (!body || !section) return;

  // Workers: IAs que tienen sesiones vinculadas a ítems del sprint
  let workers = [];

  {
    const sessions = getAllSessions();
    const _sid = _spIdBase(sprint.id); // B-202606-008
    const sprintItemCodes = Array.isArray(getItems())
      ? new Set(getItems().filter(i => _iSprint(i) && _iSprint(i).startsWith(_sid)).map(i => i.code))
      : new Set();

    const aiIds = new Set();
    sessions.forEach(sess => {
      if (!sess.tgItems || !Array.isArray(sess.tgItems)) return;
      if (sess.tgItems.some(code => sprintItemCodes.has(code))) {
        if (sess.aiId) aiIds.add(sess.aiId);
      }
    });

    aiIds.forEach(id => {
      const ai = getAI(id);
      if (ai) workers.push(ai.name || id);
    });
  }

  if (workers.length === 0) {
    body.innerHTML = '<span class="spw-empty">Sin workers vinculados</span>';
  } else {
    // TKT-202607-043: nombre del worker sin escapar antes de este fix.
    body.innerHTML = workers.map(w => `<span class="spw-pill">${_escHtml(w)}</span>`).join('');
  }

  section.classList.remove('is-hidden');
}

function _renderSprintScopeAdded(sprint) {
  const section = _spEl('sprint-scope-added');
  const body    = _spEl('sca-body');
  const count   = _spEl('sca-count');
  if (!section || !body) return;

  if (!Array.isArray(getItems())) return;

  const _sid = _spIdBase(sprint.id); // B-202606-008
  const scopeItems = getItems().filter(i =>
    _iSprint(i) && _iSprint(i).startsWith(_sid) &&
    i.scopeAdded === true &&
    i.status !== 'descartado'
  );

  if (count) count.textContent = scopeItems.length;

  if (scopeItems.length === 0) {
    body.innerHTML = '<div class="sca-empty">Sin ítems añadidos al scope</div>';
    section.classList.add('is-hidden');
    return;
  }

  // TKT-202607-043: i.code/i.title sin escapar antes de este fix. i.type no se toca
  // (alimenta una clase CSS, enum controlado REQ/TKT/INC/DISC — fuera del AC declarado).
  body.innerHTML = scopeItems.map(i => {
    const typeKey = (i.type || 'T').toLowerCase();
    const dateStr = i.scopeAddedAt
      ? new Date(i.scopeAddedAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
      : '';
    return `<div class="sca-item">
  <span class="sca-item-type sca-item-type--${typeKey}">${i.type || 'T'}</span>
  <span class="sca-item-code">${_escHtml(i.code)}</span>
  <span class="sca-item-title">${_escHtml(i.title || '')}</span>
  ${dateStr ? `<span class="sca-item-date">${dateStr}</span>` : ''}
</div>`;
  }).join('');

  section.classList.remove('is-hidden');
}

// ── T-202606-040: _renderPlannedSprints — sección Sprints planificados ──────
//
// Muestra en #sprint-planned-list los sprints que tienen ítems asignados
// y cuyo status es distinto a 'active' o 'closed' (sprints no registrados
// en getActiveSprints() o registrados con otro status).
//
// AC1: sprint con ítems aparece con conteo R=N · T=N · B=N y effort total.
// AC2: ítems en sprint activo (active) no aparecen aquí — solo sprints planificados.
// AC3: sprint sin ítems asignados no aparece.
// AC4: al abrir formalmente un sprint planificado, desaparece de esta sección.
// AC5: sprint activo excluido de esta sección.

function _renderPlannedSprints() {
  const container = document.getElementById('sprint-planned-list');
  if (!container) return;

  if (!Array.isArray(getItems())) {
    container.innerHTML = '';
    return;
  }

  const allSprints    = getActiveSprints();
  const activeIds     = new Set(allSprints.filter(s => s.status === 'active').map(s => s.id));
  const closedIds     = new Set(allSprints.filter(s => s.status === 'closed').map(s => s.id));
  const _extractId    = s => (s || '').split(' · ')[0].trim();

  // Agrupar ítems no descartados por sprint, excluyendo active, closed e ítems sin sprint (Q-Backlog/Q-DISC)
  const plannedMap = {};
  getItems().forEach(i => {
    const raw = _iSprint(i).trim();
    if (!raw) return; // TKT-B6: eliminado raw==='icebox' (Gen1) — !raw cubre Q-Backlog/Q-DISC en Gen2
    const id = _extractId(raw);
    if (!id) return;
    if (activeIds.has(id) || closedIds.has(id)) return;
    if (i.status === 'descartado') return;
    if (!plannedMap[id]) plannedMap[id] = [];
    plannedMap[id].push(i);
  });

  const keys = Object.keys(plannedMap);
  if (!keys.length) {
    container.innerHTML = '';
    return;
  }

  // Ordenar por número de sprint ascendente (próximos primero)
  keys.sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, '')) || 0;
    const nb = parseInt(b.replace(/\D/g, '')) || 0;
    return na - nb;
  });

  let html = `<div class="spl-section">
    <div class="spl-header">
      <span class="spl-title">Sprints planificados</span>
      <span class="spl-count">${keys.length}</span>
    </div>
    <div class="spl-list">`;

  keys.forEach(sprintId => {
    const items  = plannedMap[sprintId];
    const spObj  = allSprints.find(s => s.id === sprintId);
    const label  = spObj ? (spObj.label ? `${spObj.id} · ${spObj.label}` : spObj.id) : sprintId;
    const countR = items.filter(i => itemKind(i) === 'REQ').length;
    const countT = items.filter(i => itemKind(i) === 'TKT').length;
    const countB = items.filter(i => itemKind(i) === 'INC').length;
    const effort = items.reduce((acc, i) => acc + (parseInt(i.effort) || 0), 0);

    const countParts = [];
    if (countR) countParts.push(`<span class="spl-type spl-type--req">REQ=${countR}</span>`);
    if (countT) countParts.push(`<span class="spl-type spl-type--tkt">TKT=${countT}</span>`);
    if (countB) countParts.push(`<span class="spl-type spl-type--inc">INC=${countB}</span>`);

    html += `<div class="spl-row" data-sprint-id="${_escHtml(sprintId)}">
      <span class="spl-row-id">${_escHtml(sprintId)}</span>
      ${label !== sprintId ? `<span class="spl-row-name">${_escHtml(label.replace(/^[A-Za-z]+-S-\d+\s*·?\s*/i, ''))}</span>` : ''}
      <span class="spl-row-counts">${countParts.join('')}</span>
      <span class="spl-row-effort">effort ${effort}</span>
    </div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

// ── END T-202606-040 ──────────────────────────────────────────────────────────

// TKT-B1: _renderHotfixSection eliminada — usaba isHotfix:true y sprint-hotfix-list (Gen1)

// ── T-202606-002: Resumen agregado de sprints normales ──────────────────────
//
// Lista todos los sprints normales (isHotfix falsy) con id, nombre, status badge,
// conteo R/T/B, effort total. Escribe en #sprint-summary-list. Solo lectura —
// edición de campos de sprint vive en sub-tab Sprints (_renderSpsActivo /
// _renderSpsProgramados).

function _renderSprintSummaryTable(allSprints) {
  const container = document.getElementById('sprint-summary-list');
  if (!container) return;

  // TKT-B1: isHotfix eliminado — Gen2 no tiene sprints con isHotfix:true
  const normalSprints = allSprints ? [...allSprints] : [];

  // sin sprints → empty state
  if (!normalSprints.length) {
    container.innerHTML = '<div class="ssm-empty">Sin sprints creados</div>';
    return;
  }

  // Ordenar: activos primero, luego por fecha desc
  const ordered = [
    ...normalSprints.filter(s => s.status === 'active'),
    ...normalSprints
      .filter(s => s.status !== 'active')
      .sort((a, b) => (b.closedAt || b.createdAt || 0) - (a.closedAt || a.createdAt || 0)),
  ];

  const rows = ordered.map(sprint => {
    // AC-2b T-202606-002: badge multi-status — programado y pausado tienen clases propias
    const statusBadgeCls = sprint.status === 'active'     ? 'sprint-badge-active'
                         : sprint.status === 'scheduled'  ? 'sprint-badge-programado'
                         : sprint.status === 'paused'     ? 'sprint-badge-paused'
                         :                                  'sprint-badge-closed';
    const statusTxt      = sprint.status === 'active'     ? 'Activo'
                         : sprint.status === 'scheduled'  ? 'Programado'
                         : sprint.status === 'paused'     ? 'Pausado'
                         : sprint.status === 'discarded'  ? 'Descartado' // TKT: antes caía en el fallthrough 'Cerrado'
                         :                                  'Cerrado';

    // Conteo R/T/B y effort — AC-2 T2
    let countR = 0, countT = 0, countB = 0, effort = 0;
    if (Array.isArray(getItems())) {
      const _sid = _spIdBase(sprint.id); // B-202606-008
      const spItems = getItems().filter(i => {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
          (['REQ','TKT'].includes(itemKind({type:t}))) &&
          i.status !== 'descartado';
      });
      countR = spItems.filter(i => itemKind(i) === 'REQ').length;
      countT = spItems.filter(i => itemKind(i) === 'TKT').length;
      countB = spItems.filter(i => itemKind(i) === 'INC').length;
      effort = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 0), 0);
    }

    const countParts = [];
    if (countR) countParts.push(`<span class="ssm-type ssm-type--req">${countR} REQ</span>`);
    if (countT) countParts.push(`<span class="ssm-type ssm-type--tkt">${countT} TKT</span>`);
    if (countB) countParts.push(`<span class="ssm-type ssm-type--inc">${countB} INC</span>`);
    const countsHtml = countParts.length ? countParts.join('') : '<span class="ssm-type ssm-type--empty">0 ítems</span>';

    return `<div class="ssm-row" data-sprint-id="${_escHtml(sprint.id)}">
  <div class="ssm-row-top">
    <span class="ssm-row-id">${_escHtml(sprint.id)}</span>
    <span class="ssm-row-name">${_escHtml(sprint.label || sprint.name || '')}</span>
    <span class="ssm-badge ${statusBadgeCls}">${statusTxt}</span>
    <span class="ssm-counts">${countsHtml}</span>
    <span class="ssm-effort">effort ${effort}</span>
  </div>
</div>`;
  }).join('');

  container.innerHTML = rows;

}
// ── END T-202606-002 ─────────────────────────────────────────────────────────

// ── T-202606-105: Banner de sprints activos en conflicto ─────────────────────

// Inyecta o elimina #sprint-conflict-banner antes del contenido principal del tab.
// AC: si _getConflictingSprints() retorna > 0 ítems → banner visible con lista de códigos.
//     si retorna 0 → banner ausente del DOM.
function _renderConflictBanner() {
  const BANNER_ID   = 'sprint-conflict-banner';
  const ANCHOR_ID   = 'sprint-panel-header'; // se inserta antes de este elemento
  const conflicts   = _getConflictingSprints();
  let banner        = document.getElementById(BANNER_ID);

  if (!conflicts.length) {
    // AC: 0 conflictos → banner ausente del DOM
    if (banner) banner.remove();
    return;
  }

  // Construir o reusar el banner
  if (!banner) {
    banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.className = 'sprint-conflict-banner';
  }

  // AC: formato '[nombre] · abierto [DD/MM/YYYY]' — startedAt nulo → 'fecha desconocida'
  function _fmtDate(ts) {
    if (!ts) return 'fecha desconocida';
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  // TKT-202607-043: s.label/s.name/s.id sin escapar antes de este fix — mismos campos
  // que _renderSpsActivo/_renderSpsProgramados/_renderSpsCerrados sí escapan. '<br>' es
  // separador estructural entre conflictos, no se escapa.
  const items = conflicts.map(s => {
    const label = s.label ? `${_escHtml(s.id)} · ${_escHtml(s.label)}` : _escHtml(s.name || s.id);
    return `${label} · abierto ${_fmtDate(s.startedAt)}`;
  }).join('<br>');
  const count = conflicts.length;
  banner.innerHTML = `
    <span class="sprint-conflict-icon">⚠</span>
    <span class="sprint-conflict-text">${count} sprint${count > 1 ? 's' : ''} activo${count > 1 ? 's' : ''} simultáneamente — solo puede haber uno<br>
      <span class="sprint-conflict-list">${items}</span>
    </span>
    <button class="sprint-conflict-btn" type="button" data-sprint-conflict-resolve>Resolver en sub-tab Sprints</button>
  `;

  // Insertar antes del anchor si no está ya en el DOM
  const anchor = document.getElementById(ANCHOR_ID);
  if (anchor && anchor.parentNode && !document.getElementById(BANNER_ID)) {
    anchor.parentNode.insertBefore(banner, anchor);
  } else if (!anchor && !document.getElementById(BANNER_ID)) {
    // Fallback: primer hijo del contenedor del tab Sprint
    const tabContainer = document.getElementById('sprint-tab-container') || document.getElementById('tab-sprint');
    if (tabContainer) tabContainer.prepend(banner);
  }

  // AC: delegación en el banner — listener único persistente, funciona en rerenders sucesivos.
  // innerHTML se actualiza en cada render → se re-asigna el delegador cada vez para
  // garantizar que el botón recién creado responde. El handler previo no acumula
  // porque se asigna a la propiedad onclick del banner (no addEventListener).
  banner.onclick = (e) => {
    if (e.target.closest('[data-sprint-conflict-resolve]')) _sptSwitch('sprints');
  };
}

// ── Función principal ───────────────────────────────────────────────────────

// T-202606-098: badges de conteo en sub-tab nav
// AC-1: badge Ítems = ítems activos (pendiente + en-revision + bloqueado) del sprint activo
// AC-3/AC-4: tabs Planificar y Sprints no tienen badge
// AC-7: sin sprint activo → sin badges
function _updateSprintTabBadges() {
  const sprint = _getActiveSprint();
  const btnItems = document.getElementById('spt-tab-items');

  // AC-7: sin sprint activo → limpiar badges y salir
  if (!sprint) {
    if (btnItems) { const b = btnItems.querySelector('.spt-tab-badge'); if (b) b.textContent = ''; }
    return;
  }

  // AC-1: conteo de ítems activos
  if (btnItems) {
    let badge = btnItems.querySelector('.spt-tab-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'spt-tab-badge';
      badge.setAttribute('aria-hidden', 'true');
      btnItems.appendChild(badge);
    }
    const _sid = _spIdBase(sprint.id);
    const spItems = getItems().filter(i => {
      const t = i.type || (i.code ? i.code.charAt(0) : '');
      return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
        (['REQ','TKT'].includes(itemKind({type:t}))) &&
        i.status !== 'descartado';
    });
    const activeCount = spItems.filter(i => _sprintItemBucket(i) !== 'done').length;
    badge.textContent = activeCount > 0 ? String(activeCount) : '';
  }
}

export function renderSprintTab() {
  // B-202605-053: actualizar estado interno siempre — independiente del tab visible.
  // El render visual se guarda cuando el tab Sprint no está activo,
  // pero _sprintTabActiveSprint debe reflejar el estado real para que al
  // volver al tab el render sea correcto.
  const _sprintNow = _getActiveSprint();
  _sprintTabActiveSprint = _sprintNow;

  // T-202605-117: Guard de tab activo — skip render visual si el tab Sprint no es el visible.
  // AC-4/AC-5 (excepción Command Palette) removidas — módulo deprecado, ver locus-command-palette.js.
  if (typeof currentTab !== 'undefined' && currentTab !== 'sprint') return;

  const header    = _spEl('sprint-panel-header');
  const itemsList = _spEl('sprint-items-list');
  const sptNav    = _spEl('spt-nav'); // R-202605-043

  // T-202606-105: banner de conflicto — sprints activos simultáneos
  _renderConflictBanner();

  let sprint = _sprintNow;

  if (!sprint) {
    // T-202606-001 AC-3: segunda evaluación — sprint programado (scheduled) sin sprint activo.
    // _getActiveSprint() solo retorna status:'active'. Si hay scheduled → rama con-sprint.
    const _activeProjId  = _getActiveProjectFilter();
    // TKT-202607-125: capturar el sprint scheduled real (no solo su existencia) — antes
    // se usaba .some() y `sprint` quedaba null al caer en la rama "hay sprint activo",
    // provocando TypeError en sprint.label más abajo (L1965).
    const _scheduledSprint = getActiveSprints().find(function(s) {
      return s.status === 'scheduled' && s.projectId === _activeProjId; // TKT-B1: isHotfix eliminado
    });
    if (_scheduledSprint) {
      // Hay sprint programado — usarlo como sprint activo de la vista y caer en rama con-sprint
      sprint = _scheduledSprint;
      // Continúa fuera del bloque if (!sprint)
    } else {
      // T-202606-001 AC-1/AC-2: sin sprint activo ni programado — sptNav visible, default 'sprints'.
      // Reemplaza la arquitectura de empty state dedicado (R-202605-006, deprecada).
      // TKT2 (REQ CAEL-0814-01) AC5: el header (.spt-shell) ya no se oculta en este caso —
      // queda visible con identity reducida ("Locus › sin sprint"), mismo shell que con
      // sprint activo. Antes: header.classList.add('is-hidden').
      if (header) {
        header.classList.remove('is-hidden');
        // TKT-202608-454 (REQ-202608-187, TKT2): retira el badge de proyecto (proj.id) del
        // chip — mod:117 lo dejó ahí como supuesto declarado sin AC real disponible en esa
        // sesión; el AC de este TKT pide que "sin sprint" no muestre un dato de proyecto en
        // su lugar. .sph-sprint-pill--unset (Nova, locus-sprint.css mod:77) reemplaza el
        // estado neutro del chip — mismo criterio visual que .effort-dots--unset.
        const identityChipEl = _spEl('spt-identity-chip');
        if (identityChipEl) {
          identityChipEl.textContent = 'Sin sprint';
          identityChipEl.classList.add('sph-sprint-pill--unset');
          identityChipEl.classList.remove('sph-sprint-pill--active');
        }
        const nameEl = _spEl('sph-name');
        if (nameEl) nameEl.textContent = '';
        const goalEl = _spEl('sph-goal');
        if (goalEl) goalEl.classList.add('is-hidden');
        const scopeChipEl = _spEl('sph-scope-chip');
        if (scopeChipEl) scopeChipEl.classList.add('is-hidden');
        const pendingBadge = _spEl('sph-pending-badge');
        if (pendingBadge) pendingBadge.classList.add('is-hidden');
        // TKT-202608-454 (REQ-202608-187, TKT2): sin sprint no hay effort que graficar —
        // burndown oculto. Antes quedaba visible mostrando "Effort: 0 / 0 · 0%" heredado
        // del último render con sprint real.
        const burndownEl = _spEl('sph-burndown');
        if (burndownEl) burndownEl.classList.add('is-hidden');
      }
      if (itemsList) itemsList.classList.add('is-hidden');
      if (sptNav)    sptNav.classList.remove('is-hidden');
      const workers    = _spEl('sprint-workers');
      const scopeAdded = _spEl('sprint-scope-added');
      if (workers)   workers.classList.add('is-hidden');
      if (scopeAdded) scopeAdded.classList.add('is-hidden');
      // Ocultar paneles que requieren sprint activo — R-202605-043 + R-202605-052
      const panelItems      = _spEl('sprint-panel-items');
      const panelPlanificar = _spEl('sprint-panel-planificar');
      if (panelItems)      panelItems.classList.add('is-hidden');
      if (panelPlanificar) panelPlanificar.classList.add('is-hidden');
      // T-202606-001 AC-1: sub-tab 'sprints' es el default — visible y activo
      _sptActiveSubtab = 'sprints';
      localStorage.setItem(_SPT_SUBTAB_KEY, 'sprints');
      // T-202606-002: modo vista-principal — header de contexto visible, ancho completo
      const panelSprints = _spEl('sprint-panel-sprints');
      if (panelSprints) panelSprints.classList.add('spt-main-view');
      // T-202606-002: empty-state total — ningún sprint de ningún tipo (activo/programado/
      // pausado/cerrado) para el proyecto activo.
      const _hasAnySprint = getActiveSprints().some(function(s) {
        return s.projectId === _activeProjId; // TKT-B1: isHotfix eliminado
      });
      // TKT2 (REQ CAEL-0814-01) AC4/AC5: #sps-content-empty (familia .spt-content-empty)
      // reemplaza el antiguo .spt-context-header retirado de index.html — visible solo
      // cuando no hay ningún sprint de ningún tipo. _hasAnySprint estaba declarada sin
      // consumidor antes de este TKT (gap señalado por Nova en sesión de diagnóstico).
      const contentEmptyEl = _spEl('sps-content-empty');
      if (contentEmptyEl) contentEmptyEl.classList.toggle('is-hidden', _hasAnySprint);
      _sptSwitch('sprints', _spEl('spt-tab-sprints'), true);
      return;
    }
  }

  // Hay sprint activo

  // T-202606-001 AC-3: default a sub-tab 'items' cuando hay sprint activo o programado —
  // sin cambio respecto al comportamiento previo, salvo que el estado persistido sea inválido.
  if (_sptActiveSubtab === 'sprints' && !_SPT_SUBTAB_VALID.includes(localStorage.getItem(_SPT_SUBTAB_KEY))) {
    _sptActiveSubtab = 'items';
  }

  // Mostrar subtab nav y resetear a "Ítems" — R-202605-043
  if (sptNav) {
    sptNav.classList.remove('is-hidden');
  }

  // T-202606-002: hay sprint activo o programado — salir de modo vista-principal si estaba activo
  const _panelSprintsRestore = _spEl('sprint-panel-sprints');
  if (_panelSprintsRestore) {
    _panelSprintsRestore.classList.remove('spt-main-view', 'spt-no-sprints-at-all');
  }
  // TKT2 (REQ CAEL-0814-01) AC5: hay al menos un sprint (activo o programado) — el
  // empty-state total de la sub-tab Sprints nunca debe quedar visible en esta rama.
  const _spsContentEmptyGuard = _spEl('sps-content-empty');
  if (_spsContentEmptyGuard) _spsContentEmptyGuard.classList.add('is-hidden');

  // Header — T-202606-042: remove is-hidden base antes de _sptSwitch para que el toggle por subtab tenga la última palabra
  if (header) {
    header.classList.remove('is-hidden');
    const nameEl    = _spEl('sph-name');
    const versionEl = _spEl('sph-version');
    const pillEl    = _spEl('sph-release-pill');
    const daysEl    = _spEl('sph-days');

    if (nameEl)    nameEl.textContent    = sprint.label ? `${sprint.id} · ${sprint.label}` : (sprint.name || sprint.id || '');
    if (versionEl) versionEl.textContent = sprint.version_target ? `v${sprint.version_target}` : '';
    // TKT-202608-454 (REQ-202608-187, TKT2): hay sprint real (activo o programado) —
    // el burndown vuelve a ser visible, invirtiendo el is-hidden aplicado en la rama sin sprint.
    const burndownEl = _spEl('sph-burndown');
    if (burndownEl) burndownEl.classList.remove('is-hidden');
    if (pillEl) {
      // TKT: antes 'Minor' por defecto silencioso — no distinguía "declarado Minor"
      // de "campo ausente". Fallback '—' consistente con el ya usado en L681 para
      // el mismo campo (release_type/releaseType) en otro render.
      const rt = sprint.release_type || sprint.releaseType || '—';
      pillEl.textContent = rt;
      pillEl.className   = `sph-release-pill ${_sprintReleaseClass(rt)}`;
    }
    if (daysEl) daysEl.textContent = _sprintDaysLabel(sprint);

    // TKT-202607-126 (REQ-202607-039): spt-identity — instancia única en .sph-inner, poblada
    // aquí porque este bloque ya es el punto donde header.classList.remove('is-hidden') corre.
    // Corrección mod:119 (QA — Finn, contra AC real del backlog, no adjunto en la sesión
    // donde se escribió mod:117/118): el AC declara literalmente "chip 'PP-S-13' + texto
    // del label junto al chip" — el ejemplo de entrada es el sprint, no el proyecto. El
    // supuesto de mod:117 (chip = proj.id, tratado como si fuera un prefijo de proyecto
    // tipo 'PP') no correspondía a ningún dato de este AC. Fix: chip = sprint.id
    // ('PP-S-13' literal), label = sprint.label solo — sin duplicar el id que el chip ya
    // muestra (el compuesto `${sprint.id} · ${sprint.label}` es el de #sph-name, un
    // campo distinto con su propia regla, no el de este identity strip).
    // TKT-202608-454 (REQ-202608-187, TKT2): chip + label consolidados en un único nodo
    // .sph-sprint-pill (Nova, locus-sprint.css mod:77) — el par pill-project/spt-identity-label
    // se retira de index.html en el mismo TKT. Composición idéntica a la que ya usaba
    // #sph-name (`${id} · ${label}`) para el caso con label; sin label, solo el id.
    const identityChipEl = _spEl('spt-identity-chip');
    if (identityChipEl) {
      const _label = sprint.label || sprint.name || '';
      identityChipEl.textContent = _label ? `${sprint.id} · ${_label}` : (sprint.id || '');
      identityChipEl.classList.remove('sph-sprint-pill--unset');
      // --active reusa el mismo criterio de "en movimiento" ya vigente en .sprint-group-active
      // (_Locus-css-ref, decisión 2026-08-23) — solo sprint.status === 'active', no scheduled.
      identityChipEl.classList.toggle('sph-sprint-pill--active', sprint.status === 'active');
    }

    // T-202606-130: badge 'Pendiente aprobación' — visible solo cuando formallyOpened === false
    const pendingBadge = _spEl('sph-pending-badge');
    if (pendingBadge) {
      const isPending = sprint.formallyOpened === false;
      pendingBadge.classList.toggle('is-hidden', !isPending);
    }

    // B-202606-064: botón 'Aprobar apertura' eliminado — aprobación ocurre via Step 0 del DIFF

    // TKT1 (REQ CAEL-0804-01): goal + scope — sin fallback CSS, el nodo se oculta
    // vía is-hidden cuando el sprint no declara el campo (comentario en locus-sprint.css).
    const goalEl  = _spEl('sph-goal');
    if (goalEl) {
      const hasGoal = !!(sprint.goal && String(sprint.goal).trim());
      goalEl.textContent = hasGoal ? sprint.goal : '';
      goalEl.classList.toggle('is-hidden', !hasGoal);
    }
    const scopeChipEl = _spEl('sph-scope-chip');
    if (scopeChipEl) {
      const hasScope = !!(sprint.scope && String(sprint.scope).trim());
      scopeChipEl.textContent = hasScope ? sprint.scope : '';
      scopeChipEl.classList.toggle('is-hidden', !hasScope);
    }

    // TKT1 (REQ CAEL-0804-01): resumen colapsado — hermano de .sph-inner (ver index.html),
    // poblado siempre (visibilidad la resuelve el CSS .sph-header.is-collapsed).
    const collapsedGoalEl    = _spEl('sph-collapsed-goal');
    const collapsedVersionEl = _spEl('sph-collapsed-version');
    if (collapsedGoalEl)    collapsedGoalEl.textContent    = sprint.goal || '';
    if (collapsedVersionEl) collapsedVersionEl.textContent = sprint.version_target ? `v${sprint.version_target}` : '';
    // #sph-collapsed-pct se puebla después de _renderSprintItems(sprint) más abajo —
    // el burndown (#sph-bd-pct) todavía no está computado en este punto del render.
  }

  // T-202606-100: aplicar estado de colapso persistido al header
  _sphApplyCollapsed();

  // T-202606-042: _sptSwitch después de header.classList.remove — el toggle de subtab tiene la última palabra sobre visibilidad del header
  _sptSwitch(_sptActiveSubtab, _spEl('spt-tab-' + _sptActiveSubtab), true); // B-202606-065: usa estado persistido — no lee DOM. true = skip items render (renderSprintTab lo hace directamente)

  // Ítems
  if (itemsList) itemsList.classList.remove('is-hidden');
  _renderSprintItems(sprint);

  // TKT1 (REQ CAEL-0804-01): #sph-collapsed-pct — resincronizado recién aquí, después de
  // _renderSprintItems(sprint), que es quien computa #sph-bd-pct (ver L1637). Función
  // compartida con _sptSwitch() (fix bug mayor, auditoría Finn) — ambos call sites que
  // recomputan el burndown deben resincronizar el resumen colapsado.
  _sphSyncCollapsedPct();

  // Workers
  _renderSprintWorkers(sprint);

  // Scope added
  _renderSprintScopeAdded(sprint);

  // T-202606-098: badges de conteo en sub-tab nav — AC-5
  _updateSprintTabBadges();
}

// ── T-202606-100: Header sprint colapsable ────────────────────────────────

const _SPH_COLLAPSED_KEY = 'locus-sprint-header-collapsed';

function _sphIsCollapsed() {
  try { return localStorage.getItem(_SPH_COLLAPSED_KEY) === 'true'; } catch (e) { return false; }
}

function _sphSetCollapsed(collapsed) {
  try { localStorage.setItem(_SPH_COLLAPSED_KEY, String(collapsed)); } catch (e) {}
}

function _sphApplyCollapsed() {
  const header = document.getElementById('sprint-panel-header');
  const inner  = header && header.querySelector('.sph-inner');
  const btn    = document.getElementById('sph-collapse-btn');
  if (!header || !inner || !btn) return;
  const collapsed = _sphIsCollapsed();
  header.classList.toggle('is-collapsed', collapsed);
  inner.classList.toggle('is-hidden', collapsed);
  btn.setAttribute('aria-expanded', String(!collapsed));
  btn.setAttribute('aria-label', collapsed ? 'Expandir header' : 'Colapsar header');
}

function _sphToggle() {
  const collapsed = !_sphIsCollapsed();
  _sphSetCollapsed(collapsed);
  _sphApplyCollapsed();
}

// ── T-202606-038: Sprint HOTFIX persistente ───────────────────────────────
//
// TKT-B1: ensureHotfixSprint eliminada — S-HOTFIX no existe en Gen2

// ── T-202606-041: _renderSpsPausados — sección sprints pausados ──────────────
//
// Renderiza en #sps-pausados una card por sprint con status 'pausado' e isHotfix falsy.
// Si no hay pausados: innerHTML vacío + display:none — no ocupa espacio visual.
// Si hay pausados tras haber estado oculto: display:'' restaura visibilidad.
// Excluye isHotfix:true aunque tengan status 'paused'.
// B-202606-090 (histórico): filtro usaba 'paused' mientras el resto del módulo
// escribía/leía 'pausado' (español) — la sección nunca mostraba nada.
// TKT normalización (2026-07): todo el módulo migrado a 'paused'/'discarded' —
// consistente con scheduled/active/closed, ya en inglés. Sin path legacy.

function _renderSpsPausados() {
  const container = document.getElementById('sps-pausados');
  if (!container) return;

  const allSprints = getActiveSprints();
  const paused = allSprints
    ? allSprints.filter(s => s.status === 'paused') // TKT-B1: isHotfix eliminado
    : [];

  // Section-label consistente con Activo/Programados/Cerrados (gap cerrado —
  // founder detectó ausencia vía captura, ver locus-sprint.css mod:53 INC).
  // Empty state — línea muda, mismo patrón que Programados/Cerrados.
  if (paused.length === 0) {
    container.innerHTML = _spsGroupHtml('pausados', 'Pausados', 0, 'pausados',
      _spsGroupEmptyHtml('Sin sprints pausados')
    );
    container.classList.remove('is-hidden');
    _spsAttachGroupToggle(container);
    return;
  }

  // AC-3/AC-5: hay pausados → restaurar visibilidad
  container.classList.remove('is-hidden');

  const cards = paused.map(function(s) {
    // INC histórico — sin CHECKPOINT confirmado: composite construido una sola vez aquí (mismo patrón que
    // _renderSpsActivo) — evita "id · id" cuando no hay label ni name propios.
    const title = s.label ? `${s.id} · ${s.label}` : (s.name ? `${s.id} · ${s.name}` : s.id);
    const pauseRef = s.pausedAt || s.createdAt;
    const pausedDate = pauseRef
      ? new Date(pauseRef).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

    // TKT (badge sprint pausado 7+ días): mismo campo/fallback que pausedDate arriba —
    // sin cálculo de fecha paralelo. __BR-Ecosystem §5 "más de 7 días" = staleness--stale
    // (umbral ya establecido en _Locus-css-ref §Staleness pill: warn 4-7, stale >7 — Nova).
    let stalenessHtml = '';
    if (pauseRef) {
      const daysPaused = Math.floor((Date.now() - new Date(pauseRef).getTime()) / 86400000);
      if (daysPaused > 7) {
        stalenessHtml = ' <span class="staleness-pill staleness--stale">' + daysPaused + 'd pausado</span>';
      }
    }

    // TKT3 (REQ-202607-100): bloqueadosCount — Pausados no lo exponía (hallazgo
    // #3 de la auditoría). Mismo cómputo que _renderSpsProgramados: spItems del
    // sprint vía _iSprint()/_spIdBase(), reutiliza _sprintIsBlocked().
    let bloqueadosCount = 0;
    if (Array.isArray(getItems())) {
      const _sid = _spIdBase(s.id || '');
      const spItems = getItems().filter(function(i) {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
          (['REQ','TKT'].includes(itemKind({type:t}))) &&
          i.status !== 'descartado';
      });
      bloqueadosCount = spItems.filter(function(i) {
        return i.status !== 'done' && _sprintIsBlocked(i);
      }).length;
    }
    const blockedBadgeHtml = bloqueadosCount > 0
      ? ' <span class="sps-blocked-badge"><span class="sph-alert-icon">⚠</span>' +
          bloqueadosCount + (bloqueadosCount === 1 ? ' bloqueado' : ' bloqueados') +
        '</span>'
      : '';

    return (
      '<div class="sps-card sps-card--paused" data-sprint-id="' + _escHtml(s.id || '') + '">' +
        '<div class="sps-header">' +
          '<span class="sps-title">' + _escHtml(title) + '</span>' +
          '<span class="sprint-badge-paused">PAUSADO</span>' +
          blockedBadgeHtml +
          stalenessHtml +
        '</div>' +
        '<div class="sps-pausados-meta">' +
          '<span class="sps-pausados-date">Pausado: ' + pausedDate + '</span>' +
          '<button class="sps-btn-reactivar" aria-label="Reactivar ' + _escHtml(s.id || '') + '">Reactivar</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML = _spsGroupHtml('pausados', 'Pausados', paused.length, 'pausados', cards);

  // T-202606-008: listeners de botones Reactivar — AC-1/AC-2/AC-3
  container.querySelectorAll('.sps-btn-reactivar').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const card = btn.closest('[data-sprint-id]');
      if (!card) return;
      const sprintId = card.dataset.sprintId;
      const result = setSprintStatus(sprintId, 'active');
      // AC-2: re-render solo si setSprintStatus retornó éxito (no false)
      // AC-3: si retorna false, setSprintStatus ya disparó toast — no agregar más
      if (result !== false) {
        _renderSpsPausados();
      }
    });
  });
  _spsAttachGroupToggle(container);
}
// ── END T-202606-041 / T-202606-008 ──────────────────────────────────────────

// TKT-B1: _renderSpsHotfix, _spsHotfixHandleClick, _spsHotfixHandleKeydown eliminadas — Gen2 usa Q-INC

// ── _renderSpsCerrados — item-rows de sprints cerrados con acento lateral (mod:111) ──
//
// Rediseño mod:111 (design_intent: sprint_subtab_redesign): reemplaza la fila
// colapsable con retro inline (.sps-cerrados-row/-header/-retro, expand 0fr→1fr,
// menú ··· con "Ver retro completa"/"Exportar .md") por .sps-closed-row — fila
// plana con acento lateral, mismo lenguaje que las cards PROMOTED de Q-DISC.
// La fila entera es el control: click o Enter/Space invoca openSprintRetroView()
// directamente — colapsa las dos acciones del menú viejo, que ya invocaban la
// misma función (ver histórico abajo). Sin retroDoc → chip .sps-closed-retro-pending
// en vez del texto suelto "Retro no disponible" que tenía la fila plana anterior.
// Renderiza en #sps-cerrados todos los sprints cerrados ordenados por closedAt desc.
// Sin ítems: empty state dentro de .sps-status-body (_spsGroupEmptyHtml) — la
// sección no desaparece (TKT4 REQ-202607-100, comportamiento conservado).

async function _renderSpsCerrados() {
  const container = document.getElementById('sps-cerrados');
  if (!container) return;

  // INC-fix: getHistoricoItemsSync() lee de un cache que arranca vacío por proyecto —
  // el caller es responsable de haberlo refrescado antes (locus-storage.js:1465-1466).
  // Sin este await, el contador vuelve a mostrar 0 en la primera visita al sub-tab Sprints.
  await refreshHistoricoCache();

  const allSprints = getActiveSprints();
  const closed = allSprints
    ? allSprints
        .filter(s => s.status === 'closed') // TKT-B1: isHotfix eliminado
        .sort((a, b) => {
          const ta = b.closedAt || b.createdAt || 0;
          const tb = a.closedAt || a.createdAt || 0;
          if (ta !== tb) return ta - tb;
          // AC-1 (T-202606-001): tiebreaker por ID descendente cuando ambos timestamps son null/0
          return (b.id || '').localeCompare(a.id || '');
        })
    : [];

  if (closed.length === 0) {
    container.innerHTML = _spsGroupHtml('cerrados', 'Cerrados', 0, 'cerrados',
      _spsGroupEmptyHtml('Sin sprints cerrados')
    );
    container.classList.remove('is-hidden');
    container.removeEventListener('click', _spsCerradosRowClick);
    container.removeEventListener('keydown', _spsCerradosRowKeydown);
    _spsAttachGroupToggle(container);
    return;
  }

  // Hay cerrados — restaurar visibilidad si estaba oculto
  container.classList.remove('is-hidden');

  // Calcular conteos done/descartado desde getItems()
  // Fix de alineación BR (__BR-Ecosystem §5): "migrado" eliminado — bajo el Gate duro
  // de cierre, un sprint no cierra con ítems en pendiente/en-revision, por lo que ese
  // conteo era siempre 0 en la práctica. Ver __BR-Ecosystem §5 y locus-backlog-sprints.js AC-3.
  const rows = closed.map((sprint, _closedIdx) => {
    const _sid = _spIdBase(sprint.id);
    let doneCnt = 0, descartadoCnt = 0;
    {
      // INC-fix: getItems() ya no contiene status:historico (T-202606-106) — los ítems
      // done de un sprint cerrado migran a getHistoricoItemsSync(). Combinar ambas fuentes
      // para que el contador cuente contra el universo real, no solo el activo.
      const live = Array.isArray(getItems()) ? getItems() : [];
      const hist = Array.isArray(getHistoricoItemsSync()) ? getHistoricoItemsSync() : [];
      const seen = new Set();
      const allItems = [];
      for (const i of [...live, ...hist]) {
        if (!i || !i.code || seen.has(i.code)) continue;
        seen.add(i.code);
        allItems.push(i);
      }
      const spItems = allItems.filter(i => {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
          (['REQ','TKT'].includes(itemKind({type:t})));
      });
      doneCnt       = spItems.filter(i => i.status === 'done' || i.status === 'historico').length;
      descartadoCnt = spItems.filter(i => i.status === 'descartado').length;
    }

    const label = sprint.label || sprint.name || sprint.id;
    const closedDate = sprint.closedAt
      ? new Date(sprint.closedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

    // Chip de atención — reemplaza el texto suelto "Retro no disponible".
    // Vacío (no el chip) cuando sí hay retroDoc — sin variante "tiene retro",
    // Nova no declaró clase para ese caso (solo el estado de atención importa acá).
    const retroPendingHtml = sprint.retroDoc
      ? ''
      : '<span class="sps-closed-retro-pending">Retro pendiente</span>';

    // TKT-202608-374 (REQ-202608-150): solo el sprint cerrado más reciente (idx 0) puede
    // mostrar este chip — AC no pide señalar retros sin evaluar de sprints anteriores.
    // sprint.retroEvaluated !== true cubre tanto false explícito (setSprintStatus, TKT-373)
    // como ausente (sprint histórico pre-feature) con el mismo criterio de default.
    const retroUnevaluatedHtml = (_closedIdx === 0 && sprint.retroEvaluated !== true)
      ? '<span class="sps-closed-retro-pending">Retro sin evaluar</span>'
      : '';

    return (
      '<div class="sps-closed-row" data-sprint-id="' + _escHtml(sprint.id) + '" role="button" tabindex="0" ' +
        'aria-label="Ver retro de ' + _escHtml(sprint.id) + '">' +
        '<span class="sps-closed-row-id">' + _escHtml(sprint.id) + '</span>' +
        '<span class="pill-closed">Cerrado</span>' +
        '<span class="sps-closed-row-label">' + _escHtml(label) + '</span>' +
        '<span class="sps-closed-row-date">' + closedDate + '</span>' +
        '<span class="sps-closed-row-done">' + doneCnt + ' done</span>' +
        '<span class="sps-count-descartado">' + descartadoCnt + ' desc.</span>' +
        retroPendingHtml +
        retroUnevaluatedHtml +
      '</div>'
    );
  }).join('');

  container.innerHTML = _spsGroupHtml('cerrados', 'Cerrados', closed.length, 'cerrados', rows);

  // Event delegation — clic y teclado en filas. Sin menú ··· — la fila es el control único.
  container.removeEventListener('click', _spsCerradosRowClick);
  container.addEventListener('click', _spsCerradosRowClick);
  container.removeEventListener('keydown', _spsCerradosRowKeydown);
  container.addEventListener('keydown', _spsCerradosRowKeydown);
  _spsAttachGroupToggle(container);
}

function _spsCerradosRowClick(e) {
  const row = e.target.closest('.sps-closed-row');
  if (!row) return;
  const sprintId = row.dataset.sprintId;
  if (sprintId) openSprintRetroView(sprintId);
}

function _spsCerradosRowKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const row = e.target.closest('.sps-closed-row');
  if (!row) return;
  e.preventDefault();
  const sprintId = row.dataset.sprintId;
  if (sprintId) openSprintRetroView(sprintId);
}
// ── END _renderSpsCerrados (mod:111) ─────────────────────────────────────────

// ── T-202605-046: Listeners — spt-tab buttons ─────────────────────────────
// Migrado desde index.html — reemplaza onclick inline en .spt-tab. Listener de
// #btn-close-sprint eliminado (B-202606-024) — el elemento fue removido del HTML en T-202606-042
// TKT-202607-044: bloque de #sprint-manager-list (Ver retro / Marcar en curso, T-202605-050/
// T-202605-134) eliminado — el contenedor no existe en index.html desde el rediseño
// T-202606-036, que lo reemplazó por #sps-activo/#sps-programados/#sps-pausados/#sps-cerrados
// sin migrar ni retirar este listener. Ver retro sigue disponible — mod:111 la mueve
// de _spsCerradosHandleClick (menú ···, retirado) a _spsCerradosRowClick (click de fila).

document.addEventListener('DOMContentLoaded', function() {
  // Sub-tabs sprint: Ítems / Planificar / Sprints — T-202606-029
  ['items', 'planificar', 'sprints'].forEach(function(subtab) {
    const btn = document.getElementById('spt-tab-' + subtab);
    if (btn) {
      btn.addEventListener('click', function() {
        _sptSwitch(subtab, btn);
      });
    }
  });

  // B-202606-021: listener shell:render-sprint-tab — sincroniza el tab Sprint ante cambios
  // emitidos por otros módulos (locus-backlog-core, locus-storage, etc.) sin acoplamiento directo.
  window.addEventListener('shell:render-sprint-tab', function() {
    renderSprintTab();
    _updateSprintTabBadges(); // T-202606-098 AC-6
  });

  // TKT-202607-142 (REQ-202607-045, retroactivo — reemplaza TKT-202607-141): listener
  // shell:sprint-render RETIRADO. Dead code desde que TKT-202607-134 renombró los 3
  // dispatchEvent de locus-backlog-core.js a shell:render-sprint-tab (ver header, mod:135
  // de ese archivo) — nada disparaba ya este evento, así que este listener nunca ejecutaba
  // en producción. El refresco en vivo de ítems + burndown ante cambios de status externos ya
  // ocurre vía el listener shell:render-sprint-tab de arriba: renderSprintTab() resuelve
  // sprint (con fallback a scheduled cuando no hay activo — comportamiento correcto para un
  // render completo de tab, distinto del listener retirado que deliberadamente no lo aplicaba)
  // y llama _renderSprintItems(sprint) en L2104 — mismo destino, un solo listener.

  // T-202606-006 T3: listener para sprint:switch-subtab — reemplaza window._sptSwitch en planificacion
  window.addEventListener('sprint:switch-subtab', function(e) {
    const { subtab, triggerBtn } = (e.detail || {});
    if (subtab) _sptSwitch(subtab, triggerBtn || null);
  });

  // T-202605-051: Event delegation en #sprint-items-list para ítems generados dinámicamente
  const itemsList = document.getElementById('sprint-items-list');
  if (itemsList) {
    // B-202606-006 AC-4: toggle colapso/expansión de grupo R — debe evaluarse antes de data-item-code
    itemsList.addEventListener('click', function(e) {
      const toggle = e.target.closest('[data-r-toggle]');
      if (!toggle) return;
      const code     = toggle.dataset.rToggle;
      const children = document.getElementById('spi-r-children-' + code);
      if (!children) return;
      const expanded = toggle.getAttribute('aria-expanded') !== 'false';
      children.classList.toggle('is-hidden', expanded);
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    itemsList.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const toggle = e.target.closest('[data-r-toggle]');
      if (!toggle) return;
      e.preventDefault();
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    itemsList.addEventListener('click', function(e) {
      const item = e.target.closest('[data-item-code]');
      if (item) openItemPanel(item.dataset.itemCode);
    });
    itemsList.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('[data-item-code]');
      if (item) {
        e.preventDefault();
        openItemPanel(item.dataset.itemCode);
      }
    });
  }

  // B-202606-064: listeners de botón 'Aprobar apertura' y modal eliminados
});

// TKT-202607-044: setSprintCurrent()/_syncCurrentBadges() (T-202605-107) eliminadas —
// dependían de #sprint-manager-list (T-202605-050), inexistente en index.html desde el
// rediseño T-202606-036. Sin call site externo a este archivo (confirmado por grep contra
// los 52 módulos JS del proyecto — locus-backlog-sprints.js solo las menciona en comentario,
// no las invoca). El import de _markStatusBarDirty pierde su único call site y se elimina.

// ── Exposición pública ──────────────────────────────────────────────────────

// ── B-202605-019: Listeners — sprint management panel (_spm*) ───────────────
document.addEventListener('DOMContentLoaded', function () {

  // T-202606-100: sph-collapse-btn → _sphToggle()
  const sphCollapseBtn = document.getElementById('sph-collapse-btn');
  if (sphCollapseBtn) sphCollapseBtn.addEventListener('click', _sphToggle);

});
// ── END B-202605-019 ─────────────────────────────────────────────────────────
