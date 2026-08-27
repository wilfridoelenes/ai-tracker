// [PP] mod:121 · autor:Rune · 2026-08-27 09:15 UTC-6
// TKT-202608-472 (REQ-202608-196, TKT2): renderSprintGroup() — cómputo de conteo de TKT
// hijos activos no-done (excluye 'descartado') para el badge de alerta de buildBacklogItem()
// cuando el REQ está done. Pasado vía opts.doneInconsistencyCount — ver locus-backlog-item.js
// (mod:178).
// TKT1 (ref_id CAEL-08231620-02, REQ ref_id CAEL-08231620-01): renderSprintGroup() — default de
// isCollapsed en contexto Histórico ('hist') pasa a colapsado cuando no hay clave
// 'historico-collapsed-<groupId>' en localStorage (antes: sin clave = expandido). Distingue
// ausencia (sin preferencia) de '0' explícito (usuario expandió) — la escritura de '0' vive en
// locus-backlog-historico.js (_initHistoricoToolbar()/_attachHistoricoChildToggleDelegation()),
// no en este archivo. Sin cambio de firma de renderSprintGroup().
// [PP] mod:119 · autor:Rune · 2026-08-23 19:40 UTC-6
// TKT2 (ref_id CAEL-08231900-03, REQ ref_id CAEL-08231900-01): migración de .version-header-arrow
// a svg.chevron (Patrón A-13) en renderSprintGroup() y _emptySprintHeaderHtml(). La rotación ya no
// depende de swap de glifo ni de .collapsed sobre el ícono — la gobierna [aria-expanded] sobre
// .bl-vl-sprint-header, que ya lo declara desde su creación. Ver contract_update en
// toggleVersionCollapse()/toggleCollapseAll() (locus-backlog-core.js) — ambas dejan de tocar el
// ícono directamente.
// TKT3 CAEL-08231830-01 (REQ-202608-180): call site actualizado a la firma generalizada de
// _selfHealReqStatuses(candidateItems) → {changed,count} — pasa getItems() explícito, mismo
// universo que antes. Sin cambio de comportamiento observable en renderBacklogList().
// TKT-202608-440 (REQ-202608-180): self-heal de status de REQ extraído a
// _selfHealReqStatuses() (locus-backlog-core.js) — bloque inline L1009-1046 reemplazado
// por una sola línea que consume el boolean de retorno para decidir saveBacklog().
// inline_fix: imports huérfanos removidos — _computeRStatusFromChildren (core.js) y
// _blogLog (locus-storage.js), sin call site real tras la extracción.
// TKT-202608-434 (REQ-202608-176): terminalItems (renderBacklogList) excluye draft:true —
// ver comentario inline junto al filtro (~L1172) para el detalle completo.
// Fix (histórico — sin CHECKPOINT confirmado): renderSprintGroup() — buildBacklogItem(item) para el REQ padre ahora
// pasa { suppressChildren: true } (L579). Sin el flag, buildBacklogItem() renderizaba su
// propio bloque .req-children-block (mini-rows) además de los .bl-child-row que este mismo
// bloque ya dibuja para cada hijo — duplicación visual confirmada en Vista Lista. Fix de una
// línea, sin cambio de firma ni de contrato — solo activa una opción ya soportada por
// buildBacklogItem() (locus-backlog-item.js).
// TKT-202608-328 (REQ-202608-131, TKT2 · Migración Backlog): .bl-r-toggle migrado a
// svg.chevron (Patrón A-13, línea ~574). Fix aplicado en el handler real de la
// delegación `vl-toggle-r` (línea ~869) — no en el branch `act === 'bl-r-toggle'` de
// locus-backlog-item.js, que está muerto/inalcanzable (ver Hallazgo fuera de scope en
// CHECKPOINT de cierre). aria-expanded ahora coherente con el estado inicial de
// _isRCollapsed y se actualiza en cada toggle (línea ~878).
// TKT-202608-299 (REQ-202608-118): input y botón de búsqueda del toolbar de Histórico
// (#historico-search-input, #historico-search-clear, .fbar-search-wrap) retirados —
// reemplazado por ⌘K. .bl-toolbar-spacer retirado junto con ellos (sin nada que espaciar
// tras la remoción). Botón "Colapsar todo" (.bl-toolbar-group) intacto.
// TKT-202607-213 (REQ-202607-083): 2 botones es-open-proj-panel → es-switch-tab data-tab="proyectos"
// (proj-panel overlay retirado, reutiliza wiring ya existente en el mismo archivo).
// TKT-202607-186 (REQ-202607-064): stats-bar de Histórico — chip Total agrega
// .stat-compact-item--primary (contenedor) y .stat-compact-n--primary (número), homologando
// con el tratamiento ya vigente en Backlog list/Q-Backlog (zone-engine.js) y Q-DISC
// (index.html estático). Solo clases CSS ya existentes — sin cambio de lógica ni de datos.
// Fix directo (autorizado por founder — hallazgo de sesión Nova/Rune vía captura de pantalla,
// sin TKT/REQ de origen): renderSprintGroup() — un REQ con status 'done' en un sprint NO
// cerrado (isClosed:false) quedaba excluido de _rootPool (línea ~500 original), por lo tanto
// nunca entraba al loop que anida hijos vía _childMap (líneas ~507-533 original). Sus hijos
// done, a su vez, quedaban excluidos del bloque "Done items sueltos" (línea ~544 original)
// porque ese filtro asume que todo hijo con parentId apuntando a un REQ del sprint ya se
// renderizó anidado bajo ese REQ en el paso anterior — supuesto que no se cumple cuando el
// REQ padre también está done. Resultado observado: con el filtro "Done" activo, el REQ
// aparecía como fila plana suelta (tachado + check) y su TKT hijo desaparecía del DOM por
// completo, aunque seguía contando en stats (renderStats opera sobre getItems(), ajeno a
// este render). Con "Done" desactivado, el REQ correctamente no aparecía — esa ruta no se
// toca (el filtrado de status ocurre antes, en el caller _renderVistaLista, sobre
// sprintItems mismo).
//
// Fix (Opción A — extiende a isClosed:false el mismo criterio de anidado que isClosed:true
// ya usa, en vez de mantener dos comportamientos distintos según el status del sprint):
// (1) _rootPool (rama isClosed:false) ahora incluye todo REQ sin importar su status — solo
//     los no-REQ siguen excluidos si están done/historico. _buildChildMap ya incluía hijos
//     done en su Map sin cambio (solo excluye 'historico' cuando includeHistorico es false,
//     nunca 'done') — el fix no toca locus-backlog-hierarchy.js.
// (2) _doneFlat ("Done items sueltos") ahora excluye todo REQ explícitamente — un REQ done
//     siempre se renderiza en el bloque root (anidado con sus hijos si los tiene, o suelto
//     sin toggle si no los tiene), nunca en ambos lugares.
// Sin cambio de firma, sin cambio de comportamiento para TKT/INC done cuyo REQ padre NO está
// done (ya se anidaban antes) ni para sprints cerrados (isClosed:true, sin tocar). Impacto
// lateral: ninguno detectado — módulo consumido solo por _renderVistaLista/renderBacklogList
// (locus-backlog-historico.js vía contextPrefix:'hist' usa la misma función, mismo fix
// aplica ahí igual, sin necesidad de cambio adicional).
// contract_update: no — misma firma renderSprintGroup(sprintItems, isClosed, contextPrefix).
// [PP] mod:106 · autor:Rune · 2026-07-24 UTC-6
// TKT3 (TKT-202607-093, parent REQ CAEL-0724-01, opción B del gap devuelto por Rune — founder
// confirmó "y B"): _sprintVelocityLabel() y la const local _metaText (renderSprintGroup) dejan
// de retornar HTML/string — ahora retornan {label, valor} | null. _metaText NO se promovió a
// función (permanece inline, exclusiva de renderSprintGroup). Los 2 call sites de Fila 2
// (renderSprintGroup L~459, _emptySprintHeaderHtml L~561) consumen el objeto y renderizan
// <span class="bl-vl-sprint-header-meta-label">/-value"> — hooks nuevos para CSS de Nova
// (TKT1 AC4). .hsr-velocity queda huérfana en CSS — señalada a Nova. Sin cambio de contrato
// externo — ambas siguen privadas al módulo, sin exports.
// [PP] mod:105 · autor:Rune · 2026-07-24 UTC-6
// TKT2 (parent REQ CAEL-0724-01): renderSprintGroup — header de sprint Cerrado ya no renderiza
// .bl-vl-sprint-header-progress (barra + label). En su lugar renderiza un resumen estático
// .bl-vl-sprint-header-summary con formato "X/X ítems · vX.Y.Z" usando doneInGroup/totalInGroup/
// sprintObj.version_target ya calculados en esta función — sin cambio de contrato de la función
// (mismos parámetros, mismo sprintItems/isClosed/contextPrefix). Activo y Planificado no cambian —
// siguen usando progressBar. _emptySprintHeaderHtml no se toca — nunca cubre sprints cerrados
// (isActive/isPlanned únicamente, ver comentario de esa función).
// INC (ref_id QA-0724-01): _renderVistaLista — statusOk trata REQ status:'bloqueado' como
// siempre-visible, independiente de activeStatuses. Sin botón/chip nuevo — reutiliza clase
// .is-bloqueado ya existente en locus-backlog-item.js. Sin cambio de firma exportada.

// [PP] mod:102 · autor:Rune · 2026-07-21 16:10 UTC-6
// Fix (founder, post-liberación REQ CAEL-0720-01): chips tc-INC/tc-DISC removidos de la
// stats-bar de Histórico — universo real es solo REQ/TKT (INC/PRB/KE/CHG viven permanentemente
// en Q-INC, DISC nunca tiene sprint — ninguno de los dos puede cumplir el criterio de
// historicoItems). Chips eran muertos por diseño (siempre 0) salvo residuales legacy Gen1,
// ya cubiertos por la sección dedicada con botón Purgar (_legacyHistoricos).
// [PP] mod:100 · autor:Rune · 2026-07-21 10:05 UTC-6
// INC-CAEL-0721-01 (triggered_by TKT-CAEL-0720-05): _initHistoricoToolbar se invocaba
// (líneas 1207/1216) sin estar en el import de locus-backlog-historico.js — ReferenceError
// en runtime, rompía todo renderHistoricoPanel. Import corregido, sin cambio de lógica.
// TKT (REQ CAEL-0720-24 · Eliminar setItemParent()): función y comentario @deprecated
// removidos (antes líneas 253-290) — ver nota inline reemplazante. Sin cambio de firma en
// ninguna otra función exportada. contract_update: no.
// TKT2 (REQ CAEL-0720-10): self-heal en _renderVistaLista revierte a solo TKT como hijo de
// REQ — ya no concatena getIncidents(). Ver locus-backlog-core.js/locus-backlog-item.js.
// TKT2 (REQ CAEL-0720-03 · Separar render de rama Reactiva a módulo propio): eliminados
// _QINC_ACTIVE_STATUSES, renderQIncPanel(), _attachQIncDelegation() y los 2 listeners Q-INC
// (shell:render-qinc, shell:backlog-render-dirty filtrado por getCurrentTab()==='incidentes')
// — extraídos íntegros a locus-incidents-render.js (TKT1) sin cambio de comportamiento.
// Imports huérfanos removidos: incSlaPriority/SLA_RIESGO_WINDOW_MS (locus-inc-fields.js),
// getIncidents/_nsGetTypes/_nsGetPriority/_nsGetQuery/_nsSetQuery/_nsToggleType/
// _nsTogglePriority/_nsReset (locus-backlog-core.js), buildQIncItem (locus-backlog-item.js),
// _generateIncidentsMd (locus-incidents-generator.js), _docPrefix (locus-storage.js),
// getCurrentTab (locus-ui-shell.js — esc se conserva del mismo import). Imports verificados
// con uso restante: itemKind, isQIncItem, _getActiveProjectFilter — se quedan, se importan
// también desde locus-incidents-render.js.
//
// [PP] mod:93 · autor:Rune · 2026-07-20 23:10 UTC-6
// Deuda técnica (código real no identificable — DISC promovida en cierre de REQ CAEL-0720-01):
// SLA_RIESGO_WINDOW_MS ya no es const local — importada de locus-inc-fields.js, mismo valor
// (6h), _qincItemClasses() sin cambio de comportamiento.
//
// [PP] mod:92 · autor:Rune · 2026-07-20 22:35 UTC-6
// TKT (Paridad IDP Q-INC — Opción A, REQ sin código real identificable, founder confirmó "vamos con opcion A
//   pure" sobre hallazgo #2 de la auditoría de render): _attachQIncDelegation gana wiring
//   completo para abrir el IDP desde .qinc-item-header — mismo patrón que .bitem-header
//   (locus-backlog-item.js). Import dinámico de openItemPanel (locus-backlog-panel.js) evita
//   ciclo ESM ya documentado en locus-ui-shell.js. Orden de checks corregido: copy-code se
//   evalúa antes que qi-open-panel (copy-code vive anidado dentro de .qinc-item-header — un
//   orden inverso habría capturado el click de copiado con el header ancestro). Keydown
//   Enter/Espacio agregado para qi-open-panel (header es role="button" div, no <button>
//   nativo) — mismo criterio que _blListKeydown para .bitem-header. qi-toggle-comportamiento
//   no requiere keydown propio — ya es <button> nativo tras el fix del hallazgo #1. Sin
//   cambio de firma exportada. contract_update: no.
// [PP] mod:90 · autor:Rune · 2026-07-18 UTC-6
// TKT1 (Import huérfano _renderPlanningView, ref CAEL-0717-03, REQ sin código real identificable): import de
// _renderPlanningView retirado (línea 184) — sin call site en este archivo, confirmado con
// grep contra el repo completo (52 archivos). Call site real intacto en locus-sprint.js
// líneas 105/533. _attachPlanViewDelegation conservado — call site propio en línea 731.
// contract_update: no.
// [PP] mod:87 · autor:Rune · 2026-07-17 UTC-6
// TKT1 (Consolidar wiring de Histórico, REQ sin código real identificable): AC2 — import de _statusPills
// retirado (línea 178, sin call sites reales en este archivo — solo import + comentario
// histórico L247). _renderPlanningView y _attachPlanViewDelegation conservados, ambos con
// call site confirmado. Hallazgo fuera de scope registrado: _renderPlanningView sin call
// site visible en este archivo — ver CHECKPOINT. Sin cambio de firma. contract_update: no.
// [PP] mod:86 · autor:Rune · 2026-07-11 23:30 UTC-6
// Fix inline (triggered_by TKT2-CAEL01): eliminada lógica muerta que escribía en #tpl-badge-qinc
// (3 call sites: 2 en renderQIncPanel(), 1 en _updateSubtabBadges()) — elemento inexistente en
// el DOM desde la migración a tab top-level. Sin cambio de comportamiento observable.
// TKT2 (REQ CAEL-01): _initQIncSubTab eliminado (target inexistente tras migración a tab
// top-level) · shell:backlog-render-dirty corregido a getCurrentTab()==='incidentes' · 3
// comentarios actualizados (#sspanel-qinc → #tab-incidentes). Sin cambio en renderQIncPanel() interno.
// TKT3 (REQ-refactor-item-shape-itil-scrum, parent sin código real confirmado en
//   Locus): concat(getItems()) eliminado en renderQIncPanel() y _updateSubtabBadges() — ambos
//   leen exclusivamente getIncidents(), alineados con _getCountableBaseForSubtab('qinc')
//   (locus-backlog-core.js). Ver comentarios inline en cada call site.
// [PP] mod:83 · autor:Rune · 2026-07-10 20:05 UTC-6
// TKT1 (REQ-202607-026 · AC3 — cierre de blocked_at, archivos corregido por Cael vía patch):
//   _isBacklogScope (inline en _updateSubtabBadges) gana condición !i.draft — el badge del
//   subtab Backlog (sprint activo/programado) deja de contar ítems con draft:true, consistente
//   con renderSprintItems (locus-backlog-sprints.js) sobre la misma condición.
// [PP] mod:82 · autor:Rune · 2026-07-09 UTC-6
// TKT-202607-INC-NAMING (INC sin código real identificable): 4 lecturas de i.slaPriority en renderQIncPanel
//   y el badge Q-INC (líneas ~1045/1077/1117/1412) sin fallback a sla_priority (snake) —
//   rompía la clasificación visual SLA (colores vencido/riesgo, filtro por prioridad, badge
//   urgente) para todo incidente hidratado desde Supabase. Fallback bidireccional agregado
//   en los 4 puntos — mismo patrón que ya usa itemKind()/incidentStatus en este archivo.
// TKT-202607-056 (REQ-202607-015 · TKT3): renderQIncPanel() construye allQInc con
//   getItems().concat(getIncidents()) en vez de solo getItems() — badge y alerta SLA
//   heredan el universo corregido sin cambio adicional (ya derivan de allQInc).
// INC sin código real identificable (triggered_by: TKT-202607-056): _updateSubtabBadges() tenía el
//   mismo gap de universo en el badge Q-INC — corregido con el mismo patrón concat(getIncidents()).
// TKT-202607-027 (REQ-202607-013 · Deprecar Vista Kanban) — completa el archivo que la entrega
//   mod:79 de locus-backlog-item.js dejó pendiente ("locus-backlog-render.js debe dejar de
//   importarla, archivo no adjunto en esa entrega"): removidos import de _renderKanban
//   (locus-backlog-item.js) e import de _getBacklogKanbanMode (locus-backlog-core.js) — ninguna
//   de las dos se exporta ya. Sin este fix el módulo fallaba al cargar (import de nombre
//   inexistente = SyntaxError en ESM, no undefined silencioso). Removido bloque kanbanBtn en
//   _updateViewBtns() y el desvío condicional a _renderKanban() en renderBacklogList(). Comentario
//   stale en L953 (referenciaba línea de un bloque ya eliminado) actualizado para reflejar que
//   Vista Lista es ahora el único modo — sin cambio de comportamiento, solo precisión de comentario.
//   Verificación previa (equivalente al AC de TKT-202607-026, nunca ejecutado como sesión propia):
//   grep sobre locus-analytics-*.js y locus-reports.js sin match a Kanban/kb-card/kb-col —
//   kill_criteria de REQ-202607-013 no se activa. locus-backlog-historico.js solo tiene un
//   comentario histórico (T-202604-287), sin dependencia de código — no requiere tocarse.
//   Gap de proceso registrado, no resuelto por este fix: TKT-202607-026 (auditoría) nunca corrió
//   como sesión — TKT-202607-027 se ejecutó fuera de esta conversación sin depends_on satisfecho.
// [PP] mod:75 · autor:Rune · 2026-07-05 UTC-6
// REQ refactor-zonas TKT5: _renderDoneGroup/_attachDoneGroupToggle/_renderZonePanel/
// renderQBacklogPanel/renderQDiscPanel/_initQBacklogSubTab/_initQDiscSubTab + listener
// shell:backlog-render-dirty compartido, removidos — ahora en locus-backlog-zone-engine.js
// (motor) y locus-backlog-qbacklog.js/locus-backlog-qdisc.js (cada zona). _zoneStaleness local
// removida — import desde zone-engine.js (único uso restante: _updateSubtabBadges).
// _nsGetStatuses removido del import de core.js — huérfano tras la extracción.
// TKT1 (REQ congruencia-qdisc): _attachDoneGroupToggle('qdisc') eliminado + #qdisc-done-group
// eliminado de index.html (mod:101) — el bloque quedaba permanentemente oculto vía .is-hidden
// desde TKT1 REQ hide-done-qdisc (mod:70): DISC nunca alcanza status 'done' (__BR-Ecosystem §5),
// hasDoneState:false en renderQDiscPanel ya garantizaba que _renderDoneGroup('qdisc', ...) nunca
// se invocara. El listener de toggle era código vivo sobre un elemento inalcanzable — sin efecto
// observable, pero incongruente con la intención declarada (bloque "Terminados" que nunca puede
// mostrar contenido). _renderZonePanel no cambia: doneGroupEl ya usa guard `if (doneGroupEl)` —
// getElementById('qdisc-done-group') retorna null sin romper el flujo. _attachDoneGroupToggle
// se conserva para 'qbacklog' — REQ/TKT sí alcanzan status 'done'.
// TKT (limpieza de comentario — hallazgo fuera de scope de [tmp:req-clutter-backlog] TKT1):
// nota de mod:66 (línea ~38) queda como registro histórico sin cambio — describía correctamente
// el estado del archivo en ese momento. Se aclara aquí, en un comentario nuevo, que ese estado
// cambió: TKT1 de REQ-clutter-backlog reintrodujo #fbar-filter-btn como trigger del popover
// "Filtros ▾" (familia .blf-*, ver locus-ui-shell.js) — propósito distinto al badge suelto que
// el REQ de consolidación de toolbar había eliminado. #bl-filter-badge sigue sin instancia activa
// (reemplazado por .blf-badge, no por ID). No se reescribe la nota de mod:66 — sigue siendo
// verdadera para el momento en que se escribió.
// [PP] mod:70 · autor:Rune · 2026-07-04 17:01 UTC-6
// TKT1 (Ocultar bloque Terminados en Discoveries, REQ sin código real identificable): _renderZonePanel acepta
// opts.hasDoneState / opts.hasChildren (default true — sin cambio de comportamiento para
// qbacklog). Con false: el bloque estático #[nsKey]-done-group se oculta vía .is-hidden (Nova,
// design_intent "Ocultar bloque Terminados en Discoveries"), se omite el split done/active y
// _buildChildMap. renderQDiscPanel declara ambos en false — DISC nunca alcanza status 'done'
// (__BR-Ecosystem §5) ni tiene jerarquía R→hijos.
// [PP] mod:68 · autor:Rune · 2026-07-05 UTC-6
// TKT1 (limpieza post-rename): comentario en L48 actualizado — describía capacidad vigente referenciando locus-backlog-archive.js; corregido a locus-backlog-historico.js. Notas históricas de L3/L25 (documentan el rename en sí) se conservan sin cambio.
// REQ Unificar vocabulario historico (código real sin identificar) — TKT2 (continuación): call sites
// actualizados hacia locus-backlog-historico.js (ex locus-backlog-archive.js, ver TKT2 en
// ese archivo, mod:22): import renombrado (renderArchivoHistorico→renderHistoricoSection,
// getArchivoHistoricoCount→getHistoricoCount, getArchivoHistoricoStats→getHistoricoStats) +
// los 3 call sites correspondientes + comentarios que documentan arquitectura actual (no
// changelog histórico) actualizados al nombre nuevo de archivo/función. Sin cambio de
// comportamiento — mismo contrato, mismos parámetros, mismo valor de retorno. No incluye:
// no toca comentarios de mods anteriores que narran "Antes: [nombre viejo]" (registro
// histórico, ver header de locus-backlog-historico.js §criterio) ni el import huérfano ya
// documentado como removido (toggleArchivoHistorico, línea de mod:66 arriba).
// [PP] mod:66 · autor:Rune · 2026-07-04 UTC-6
// Fix (INC sin código real identificable): renderSprintGroup() no renderizaba ítems con status:'historico' en
// grupos de sprint cerrado (isClosed:true). _rootPool y el bloque "Done items sueltos" excluían
// 'historico' sin excepción — _buildChildMap ya tenía includeHistorico para los hijos (línea 96)
// pero nunca se propagó a los filtros de root ni al bloque de done-sueltos. Efecto: el header del
// grupo pinta bien (doneInGroup cuenta 'historico') pero #vbody-[groupId] queda vacío al expandir.
// Fix: cuando isClosed:true, _rootPool ya no excluye 'done'/'historico' — se renderiza todo salvo
// 'descartado', igual que antes para el caso no-cerrado. El bloque "Done items sueltos" se omite
// por completo cuando isClosed:true — queda cubierto por el _rootPool ampliado, evita duplicado.
// Afecta ambos consumidores de renderSprintGroup: panel Histórico (locus-backlog-historico.js) y
// Backlog Vista Lista al mostrar un sprint closed.
// TKT1 (Consolidar wiring de Histórico, REQ sin código real identificable): _initHistoricoSubTab eliminado —
// renderHistoricoPanel pasa a ser el único listener de 'shell:render-historico'. Imports
// huérfanos removidos: toggleArchivoHistorico (locus-backlog-archive.js, export eliminado) y
// toggleClosedSprintsBody (locus-sprint-planificacion.js, dead code eliminado en ese archivo).
// TKT1 (unificar renderer de #active-filter-chips, REQ sin código real identificable): updateClearFilterBtn()
//   reducida a delegar en renderActiveFilterChips() (core.js) — ya no construye innerHTML de
//   #active-filter-chips ni referencia #bl-filter-badge/#fbar-filter-btn (elementos inexistentes
//   desde el REQ de consolidación de toolbar). Listener shell:backlog-filter-changed duplicado
//   eliminado — queda solo el de core.js. inline_fix: imports huérfanos removidos.
// TKT (fix groupId): renderSprintGroup acepta contextPrefix — ver comentario en la función.
//   Reaplicado sobre mod:60 (simplificación _useVistaLista, TKT paralelo sin código real identificable) —
//   sin conflicto, cuerpos no se solapan.
// Fix (TKT sin código real identificable): eliminada la condición tautológica _useVistaLista (kanban ya desvía
//   incondicionalmente en L926, anterior en el flujo) — llamada directa a _renderVistaLista().
//   Variable html huérfana eliminada — sin otro uso en la función tras la simplificación.
// mod:59 · autor:Rune · fix (unificar render Sin AC — REQ/TKT/INC de origen sin código real identificable):
//   _useVistaLista ya no excluye noAc — pendienteItems (ya filtrado por _getBacklogNoAcMode() en
//   L957) se enruta por _renderVistaLista() en vez de un path standalone que nunca los renderizaba
//   (bug: filtro 'Sin AC' dejaba el backlog list en blanco). Bloque Cerradas/empty-state/tail
//   duplicado del path noAc eliminado — inalcanzable tras el cambio de condición.
// mod:58 · autor:Rune: eliminados _renderVistaC, _vcDoToggle y la variable huérfana
//   _useSprintGroups — sin caller desde R-202606-017. Import de _vcCollapseGet/_vcCollapseSet
//   removido — sin otro consumidor en el módulo. Sin cambio de comportamiento visible.
// TKT1 (REQ Histórico unificado con Vista Lista de Backlog): extraído renderSprintGroup(sprintItems, isClosed)
//   de _renderVistaLista — bloque de header+progress bar+jerarquía R→hijos+done items de un grupo-por-sprint,
//   ahora reusable e invocable desde locus-backlog-historico.js. Función pura respecto a filtros/búsqueda del
//   módulo (no usa _matchesQuery/_getActiveStatuses/_sortGroup internamente) — el caller decide qué items son
//   visibles y los pasa ya filtrados/ordenados en sprintItems. _warmHistoricoCacheIfNeeded() se movió fuera de
//   la función extraída (era un side effect no declarado en el contrato — contract_detail declara sideEffects:
//   ninguno) — ahora vive en el caller, antes de invocar renderSprintGroup.
//   Deuda declarada (ver CHECKPOINT de esta sesión): antes childMap se construía siempre desde el universo
//   completo del sprint (getItems()/_getAllItemsWithHistorico() sin filtrar), por lo que los hijos anidados
//   bajo un R ignoraban los filtros activos de búsqueda/status/tipo. Con la extracción, childMap se construye
//   desde sprintItems (ya filtrado por el caller) — los hijos anidados ahora respetan los mismos filtros que
//   los ítems raíz. Cambio de comportamiento menor y consistente (no bloqueante) — registrado como DISC.
// TKT1 REQ2 S'02: isZone de renderQBacklogPanel/renderQDiscPanel y _updateSubtabBadges
//   migrados a _isQBacklogActive/_isQDiscActive (excluye descartado/promoted).
// TKT3 REQ2 S'02: stats-bar interactiva (_renderZonePanel) — chips de tipo/prioridad,
//   delegación de click propia por bodyId, reuso 100% de clases .qinc-stats-bar de Q-INC.
// inline_fix TKT3: _statsBarHtml se calculaba pero nunca se inyectaba en body.innerHTML —
//   corregido en las dos ramas de salida (filtro vacío y grid con ítems).
// [tmp:tkt-isqinc-unify]: _isQInc local (renderBacklogList) y _isQIncItem local (renderQIncPanel,
//   _updateSubtabBadges) eliminadas. Todos los call sites usan isQIncItem() importada desde
//   locus-backlog-core.js.
// TKT-C7 fix: bl-icebox-item-alert→bl-done-item-alert (L1300-1302) — consume mod:54 de Nova,
//   resuelve conflicto entre clase CSS eliminada y código JS activo que la generaba.
// TKT-C1 (REQ-C): _updateSubtabBadges migrada — badgeIcebox (Gen1, tpl-badge-icebox eliminado
//   en TKT-C6) reemplazado por badgeQBacklog (tpl-badge-qbacklog) + badgeQDisc (tpl-badge-qdisc),
//   usando _isQBacklog/_isQDisc/_zoneStaleness. _isBacklogScope: sId==='icebox'→_isQBacklog/_isQDisc.
//   Bloque if(false) de sprint-grupos con _isIcebox/_iceboxStaleness eliminado (287 líneas de
//   código muerto desde R-202606-017, __BR-Execution §2 Sin retrocompatibilidad).
// T-202606-093: AC-2/AC-4 corregidos — _updateSubtabBadges() desacoplada de renderBacklogList(),
//   ahora llamada hermana en sus call sites reales (shell:backlog-render-dirty · shell:render-backlog-list)
// inline_fix: restaurado bloque if/else de placeholder de búsqueda y separación de comentario/función
//   que se corrompieron en mod:27 (T-202606-093, primera implementación)
// T-202606-093: _updateSubtabBadges — actualización reactiva de badges icebox/qinc/histórico
// B-202606-052: renderIceboxPanel implementada + listener sstab-btn-icebox + re-render en shell:backlog-render-dirty
// T-202606-166: _getActiveProjectFilter importada desde locus-storage.js
// TKT-202607-213: es-open-proj-panel retirado — botones migrados a es-switch-tab data-tab="proyectos"
// (proj-panel overlay eliminado, ya no aplica el desacople de T-202606-167)
// T-202606-163: _iceboxStaleness — alertas diferenciadas por tipo en vista icebox
import { renderHistoricoSection, getHistoricoCount, getHistoricoStats, _initHistoricoToolbar } from './locus-backlog-historico.js';
// REQ refactor-zonas TKT1: _buildChildMap extraído a locus-backlog-hierarchy.js — sin cambio
// de contrato, ver header de ese módulo.
import { _buildChildMap } from './locus-backlog-hierarchy.js';
// REQ refactor-zonas TKT5: _zoneStaleness extraído a locus-backlog-zone-engine.js — único uso
// restante en este archivo es _updateSubtabBadges() (badges qbacklog/qdisc).
import { _zoneStaleness } from './locus-backlog-zone-engine.js';
import { _hasDepsBlocked, _isBlocked, _isCountableItem, _isQBacklog, _isQBacklogActive, _isQDisc, _isQDiscActive, isQIncItem, _skelHide, _skelShow, _undoSnapshotItems, itemKind, renderStats, renderActiveFilterChips, updateStatusFilterUI, _getBacklogNoAcMode, _getActiveTypes, _getActiveStatuses, _getActiveEfforts, _getActivePriorityFilter, _getDepsFilter, _getBacklogSortMode, _getBacklogSortDir, _getCollapsedVersions, toggleVersionCollapse, toggleSectionGroup, getDoneItems, getItems, getIncidents, _selfHealReqStatuses } from './locus-backlog-core.js'; // TKT1 (REQ-202608-180): _computeRStatusFromChildren removida (inline_fix) — sin call site real en este archivo desde que el self-heal se extrajo a _selfHealReqStatuses(), único consumidor de esa función ahora vive en locus-backlog-core.js · TKT2 (REQ CAEL-0720-01): getIncidents reintroducida — self-heal de status de REQ en _renderVistaLista, universo completo ITEMS+INCIDENTS · TKT1 REQ unificar chips: renderActiveFilterChips agregada · toggleTypeFilter/toggleStatusFilter/toggleEffortFilter/toggleBacklogNoAcMode huérfanos removidos (inline_fix) · REQ refactor-zonas TKT5: _nsGetStatuses removido — único uso vivía en _renderZonePanel (extraído a zone-engine.js) · TKT-202607-027: _getBacklogKanbanMode removida — ya no exportada desde core.js · TKT2 (REQ CAEL-0720-03): getIncidents (reintroducida arriba por TKT2 CAEL-0720-01) , _nsGetTypes/_nsGetPriority/_nsGetQuery/_nsSetQuery/_nsToggleType/_nsTogglePriority/_nsReset removidos — sin uso tras extraer renderQIncPanel a locus-incidents-render.js

import { _attachBacklogDnD, _attachBacklogListDelegation, _resetBacklogListDelegation, _collapsedChildren, buildBacklogItem } from './locus-backlog-item.js'; // B-202606-023: _resetBacklogListDelegation · TKT-202607-027: _renderKanban removida — ya no exportada · TKT2 (REQ CAEL-0720-03): buildQIncItem removida — usada solo en renderQIncPanel, ahora en locus-incidents-render.js

import { _getActiveSprint, _getSprintById, openSprintRetroView, setItemSprint } from './locus-backlog-sprints.js';

import { _setBacklogModified } from './locus-docs.js';

import { _getActiveProjectFilter, getActiveSprints, saveBacklog, refreshHistoricoCache, getHistoricoItemsSync, state } from './locus-storage.js'; // TKT1 (REQ-202608-180): _blogLog removida (inline_fix) — sin call site real en este archivo tras extraer el self-heal a _selfHealReqStatuses() (locus-backlog-core.js, que ya importa _blogLog por su cuenta) · INC-fix: 'state' faltaba en este import — renderBacklogList() lo usa (state.projects) desde antes de mod:82/83 sin que nunca se importara, ReferenceError en runtime · TKT2 (REQ CAEL-0720-03): _docPrefix removido — solo usado en renderQIncPanel (qi-export-incidents), ahora en locus-incidents-render.js

// TKT2 (REQ CAEL-0720-03): import de _generateIncidentsMd removido — solo usado en renderQIncPanel (qi-export-incidents), ahora en locus-incidents-render.js

import { showToast } from './locus-toast.js';

import { esc } from './locus-ui-shell.js'; // TKT2 (REQ CAEL-0720-03): getCurrentTab removido — sin uso tras extraer el listener shell:backlog-render-dirty de Q-INC a locus-incidents-render.js
// TKT2 (REQ CAEL-0720-03): import de locus-inc-fields.js (incSlaPriority, SLA_RIESGO_WINDOW_MS) removido — sin uso tras extraer renderQIncPanel/_qincItemClasses a locus-incidents-render.js
import { _attachPlanViewDelegation } from './locus-sprint-planificacion.js';
import { _updateDocLogCount } from './locus-doc-log.js';

// Responsabilidad: Renderizado del backlog — vista Lista (sprint groups + jerarquía R→T/B),
//   sprint health panel, roadmap, planning (drag & drop), renderBacklogList, sprint selector inline.
// Dependencias: locus-backlog-core.js · locus-backlog-historico.js · locus-backlog-item.js · locus-backlog-sprints.js

// T-202606-022: _buildChildMap — hoisted originalmente aquí, extraído a
// locus-backlog-hierarchy.js (REQ refactor-zonas TKT1) — motivo: consumido tanto por
// renderSprintGroup (este archivo) como por _renderZonePanel (locus-backlog-zone-engine.js),
// colocarlo en cualquiera de los dos habría creado import circular entre ambos.
function _extractSprintId(s) {
  return (s || '').split(' · ')[0].trim();
}


// T-202604-187: colapsar/expandir bloque de hijos de un R
export function toggleChildrenBlock(rCode) {
  if (_collapsedChildren.has(rCode)) {
    _collapsedChildren.delete(rCode);
  } else {
    _collapsedChildren.add(rCode);
  }
  const body = document.getElementById('req-children-body-' + CSS.escape(rCode));
  const arrow = document.getElementById('req-children-arrow-' + CSS.escape(rCode));
  if (body) body.classList.toggle('collapsed', _collapsedChildren.has(rCode));
  if (arrow) arrow.textContent = _collapsedChildren.has(rCode) ? '▸' : '▾';
}

// TKT (REQ CAEL-0720-24 · Eliminar setItemParent() — código muerto confirmado): función
// setItemParent() removida — DISC-202607-015 cerrada. Verificado sin callers contra el repo
// completo (grep exhaustivo, 60+ archivos): solo existían la definición aquí y el import en
// locus-backlog-item.js (línea 309), ambos eliminados en este TKT. Estructuralmente inerte
// desde antes (operaba solo sobre getItems(), que nunca contiene ITIL desde mod:89 de
// module-contracts) — ver nota histórica en module-contracts mod:89 (INC FINN-0720-01).

// TKT1 (REQ unificar renderer de #active-filter-chips): reducida a su función real —
// visibilidad de #filter-clear-btn. El chip-render de #active-filter-chips (con cobertura
// completa de 7 tipos y ambos estados de deps) queda delegado en renderActiveFilterChips()
// de locus-backlog-core.js, que ahora también deriva el toggle is-hidden de este botón desde
// chips.length===0 — criterio que ya incluye deps, gap que este isDefault local no cubría.
export function updateClearFilterBtn() {
  renderActiveFilterChips();
}

// T-202604-213: _statusPills — migrada a locus-sprint-planificacion.js (B-202605-046)
// R-202605-103: toggleClosedSprintsBody — migrada a locus-sprint-planificacion.js (B-202605-046)

// Fix (INC sin código real identificable) TKT1: universo completo de ítems (activos + historico) con dedupe por code.
// getItems() (locus-backlog-core.js) nunca incluye status:historico desde T-202606-106 (_setITEMS) —
// consumidores que necesitan contar/anidar ítems de un sprint closed deben mergear con
// getHistoricoItemsSync(), ver invariant en _Locus-module-contracts.md.
// No dispara refreshHistoricoCache() por su cuenta — ver _warmHistoricoCacheIfNeeded() más abajo,
// que la garantiza tibia de forma no-bloqueante sin propagar async a renderBacklogList() y sus
// ~30 call sites (__BR-Execution §2 — mínimo impacto lateral).
function _getAllItemsWithHistorico() {
  const _active = getItems();
  const _historico = getHistoricoItemsSync();
  if (!_historico.length) return _active;
  const _seen = new Set(_active.map(i => i.code));
  const _merged = _active.slice();
  _historico.forEach(i => { if (!_seen.has(i.code)) { _merged.push(i); _seen.add(i.code); } });
  return _merged;
}

// Fix (INC sin código real identificable) TKT1: cache de historico tibio para sprints closed en Vista Lista.
// Mismo patrón que renderHistoricoPanel() (L1696) pero no-bloqueante — _renderVistaLista es
// llamada sync desde renderBacklogList(), con ~30 call sites en 12 archivos que no pueden
// volverse async sin impacto lateral fuera de scope de este TKT. Si el cache está frío
// (getHistoricoItemsSync() vacío) y hay al menos un sprint closed en pantalla, se refresca
// en background y se dispara un re-render cuando esté listo — mismo patrón fire-and-forget
// ya usado en el ecosistema para no bloquear el primer paint.
let _historicoCacheWarmupInFlight = false;
function _warmHistoricoCacheIfNeeded(hasClosedSprintInView) {
  if (!hasClosedSprintInView) return;
  if (getHistoricoItemsSync().length) return; // ya tibio
  if (_historicoCacheWarmupInFlight) return;
  _historicoCacheWarmupInFlight = true;
  refreshHistoricoCache().then(() => {
    _historicoCacheWarmupInFlight = false;
    _markBacklogListDirty();
    renderBacklogList();
  }).catch(() => { _historicoCacheWarmupInFlight = false; });
}

// T-202604-290 · T-202605-450: velocidad por sprint — retorna { avg, sprints: [{id, label, planned, real}] }
// planned = suma effort asignado (excluye descartados)
// real    = suma effort done
export function _calcEstimatedVelocity() {
  const closedSprints = getActiveSprints()
    .filter(s => s.status === 'closed')
    .slice(-5); // R-202605-126: últimos 5 cerrados (antes: 3)
  if (closedSprints.length < 2) return null;
  const sprintData = closedSprints.map(sp => {
    const spItems = getItems().filter(i => i.sprint === sp.id && i.status !== 'descartado');
    const planned = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const real    = spItems.filter(i => i.status === 'done' || i.status === 'historico')
                           .reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    // R-202605-126: días activos del sprint para velocidad/día
    const tsStart  = sp.startedAt || sp.createdAt || null;
    const tsEnd    = sp.closedAt  || null;
    const daysActive = (tsStart && tsEnd)
      ? Math.max(1, Math.floor((tsEnd - tsStart) / 86400000))
      : null;
    const velPerDay = (daysActive !== null && real > 0)
      ? Math.round((real / daysActive) * 10) / 10
      : (daysActive !== null ? 0 : null);
    return { id: sp.id, label: sp.label || sp.id, planned, real, daysActive, velPerDay };
  });
  const reals = sprintData.map(d => d.real);
  const avg = Math.round((reals.reduce((a, b) => a + b, 0) / reals.length) * 10) / 10;
  return { avg, sprints: sprintData };
}

// R-202605-066: label inline de effort vs velocidad para header del sprint activo
// TKT3 (REQ CAEL-0724-01, contract_update: sí — signature_change): retorna {label, valor} en vez
// de HTML — permite que el caller aplique el split tipográfico Nivel 4/Nivel de TKT1 AC4. Antes
// retornaba '<span class="hsr-velocity">...</span>' o ''; ahora retorna {label, valor} o null.
// .hsr-velocity queda huérfana en CSS — señalada a Nova (doc_updates de este CHECKPOINT).
function _sprintVelocityLabel(sprintId) {
  if (!sprintId) return null;
  // B-202606-018: normalizar campo sprint del ítem para incluir ítems con label completo
  const _extId = s => s.split(' · ')[0].trim();
  const spItems = getItems().filter(i => _extId((i.sprint || '').trim()) === sprintId && i.status === 'pendiente');
  const effortTotal = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const vel = _calcEstimatedVelocity();
  const velLabel = (vel && typeof vel.avg === 'number') ? vel.avg : null;
  const velStr = velLabel !== null ? velLabel : '—';
  return { label: 'EFFORT', valor: `${effortTotal} / vel. ${velStr}` };
}

// T-202604-284: Sprint Roadmap — filtro activo (sprintId | null)
// T-202605-118: dirty flag — render quirúrgico
let _backlogListDirty = false;
export function _markBacklogListDirty() { _backlogListDirty = true; }

// R-202606-017 · T-202606-061: Vista Lista — sprint groups + jerarquía R→T/B por defecto
// Reemplaza la lógica combinada de _renderVistaC + bloque _useSprintGroups.
// Parámetros: listEl, pendienteItems, doneItems, terminalItems ya filtrados por renderBacklogList;
//   terminalItems: R/T/B descartado + P descartado + P promovida — bloque Cerradas unificado
//   _matchesQuery y _sortGroup vienen de renderBacklogList para reutilizar la lógica existente.
// TKT1 (REQ Histórico unificado con Vista Lista de Backlog): render de un grupo-por-sprint
// (header + progress bar + jerarquía R→hijos + done items). Extraída de _renderVistaLista.
//
// Contrato (contract_detail, TKT1): recibe sprintItems e isClosed como únicos parámetros.
// sprintItems = todos los ítems visibles de UN sprint, ya filtrados y ordenados por el caller
// (root primero, luego done/historico) — la función no aplica búsqueda ni filtros de status/tipo,
// no depende de _matchesQuery/_getActiveStatuses/_sortGroup ni de ningún estado privado de UI.
// sin sideEffects — no dispara warmup de cache ni cualquier otra mutación; eso es responsabilidad
// del caller (ver _warmHistoricoCacheIfNeeded en _renderVistaLista, antes de invocar esta función).
//
// sprintId se deriva de sprintItems[0].sprint — la función retorna '' si sprintItems está vacío
// (el caso de header vacío para sprint activo/programado sin ítems se maneja fuera, en el caller
// de Backlog Vista Lista — ver _emptySprintHeaderHtml — porque no hay item del cual derivar sprintId).
// TKT (fix groupId): contextPrefix namespacing — omitido/'' preserva el groupId y la fuente
// de colapso actuales de Backlog Vista Lista (_getCollapsedVersions(), Set global en core.js).
// contextPrefix:'hist' (único otro caller: locus-backlog-historico.js) namespacea el groupId
// para que nunca colisione con el de Vista Lista, y lee el estado de colapso desde
// localStorage['arch-collapsed-'+groupId] — mismo key que ya escribe
// _attachArchChildToggleDelegation() al togglear, antes desalineado con el Set global que
// esta función leía sin distinguir contexto.
export function renderSprintGroup(sprintItems, isClosed, contextPrefix) {
  if (!sprintItems || !sprintItems.length) return '';

  const sprintId = _extractSprintId((sprintItems[0].sprint || '').trim());
  const sprintObj  = _getSprintById(sprintId);
  const isActive   = sprintObj?.status === 'active';
  const isPlanned  = !isActive && !isClosed;
  const label      = sprintObj ? (sprintObj.label || sprintId) : sprintId;
  const _prefix    = contextPrefix ? contextPrefix + '-' : '';
  const groupId    = _prefix + 'vl-' + sprintId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  // TKT1 (REQ CAEL-08231620-01, ref_id CAEL-08231620-02): sin clave guardada (null) el default
  // pasa a colapsado — antes el default era expandido (=== '1' evaluaba false ante ausencia).
  // '0' explícito (escrito por _initHistoricoToolbar()/_attachHistoricoChildToggleDelegation()
  // en locus-backlog-historico.js al expandir) distingue "el usuario expandió este grupo" de
  // "sin preferencia" — antes ambos casos removían la clave y eran indistinguibles entre sí.
  const isCollapsed = contextPrefix
    ? (() => { try { const v = localStorage.getItem('historico-collapsed-' + groupId); return v === null ? true : v === '1'; } catch { return true; } })()
    : _getCollapsedVersions().has(groupId);

  // Progress — sobre sprintItems (ver nota de fidelidad en header del archivo: en el caso
  // por defecto, sin filtros/búsqueda activos, sprintItems == universo completo del sprint,
  // resultado idéntico al comportamiento anterior).
  const doneInGroup  = sprintItems.filter(i => i.status === 'done' || i.status === 'historico').length;
  const totalInGroup = sprintItems.filter(i => i.status !== 'descartado').length;
  const pct = totalInGroup > 0 ? Math.round((doneInGroup / totalInGroup) * 100) : 0;

  const sprintStatusLabel = isActive
      ? `<span class="sprint-badge-active">activo</span>`
      : isClosed
        ? `<span class="sprint-badge-closed">cerrado</span>`
        : isPlanned
          ? `<span class="sprint-badge-planned">planificado</span>`
          : '';

  // Meta secundaria: velocity para activo, fecha de cierre para cerrado, effort estimado para planificado
  // TKT3 (REQ CAEL-0724-01): _metaText permanece const local inline — no se promueve a función
  // (decisión del founder, opción B ante el gap de especificación) — pero su forma de retorno
  // pasa de string a {label, valor} | null, misma forma que _sprintVelocityLabel().
  const _velMeta = isActive ? _sprintVelocityLabel(sprintId) : null;
  const _metaText = isClosed
    ? ((sprintObj?.version_target || sprintObj?.closedAt)
        ? { label: 'CERRADO', valor: `${sprintObj?.version_target || ''}${sprintObj?.version_target && sprintObj?.closedAt ? ' · ' : ''}${sprintObj?.closedAt || ''}` }
        : null)
    : isPlanned
      ? (() => {
          const ef = sprintItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
          return ef ? { label: 'EFFORT ESTIMADO', valor: String(ef) } : null;
        })()
      : null;
  const _meta = _velMeta || _metaText;

  const progressBar = isClosed
    ? `<div class="bl-vl-sprint-header-summary">
    <span class="bl-vl-progress-label">${doneInGroup}/${totalInGroup} ítems${sprintObj?.version_target ? ` · ${esc(sprintObj.version_target)}` : ''}</span>
  </div>`
    : `<div class="bl-vl-sprint-header-progress">
    <div class="bl-vl-progress-track"><div class="bl-vl-progress-fill" style="--ver-bar-w:${pct}%"></div></div>
    <span class="bl-vl-progress-label">${doneInGroup}/${totalInGroup} · ${pct}%</span>
  </div>`;

  let html = `<div class="bl-vl-sprint-group${isActive ? ' sprint-group-active' : ''}${isClosed ? ' sprint-group-closed' : ''}${isPlanned ? ' sprint-group-planned' : ''}" data-sprint-id="${esc(sprintId)}">`;
  html += `<div class="bl-vl-sprint-header version-collapse-trigger" data-action="version-collapse" data-group-id="${groupId}" tabindex="0" role="button" aria-expanded="${isCollapsed ? 'false' : 'true'}">`;
  html += `<div class="bl-vl-sprint-header-row1">`;
  html += `<svg class="ti-svg chevron" id="varrow-${groupId}" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>`;
  html += `<span id="sprint-label-wrap-${esc(sprintId)}"><span class="version-tag">${esc(sprintId)}</span>${(label && label !== sprintId) ? `<span class="sprint-name-label">${esc(label)}</span>` : ''}</span>`;
  html += sprintStatusLabel;
  html += `</div>`; // bl-vl-sprint-header-row1
  if (_meta) {
    html += `<div class="bl-vl-sprint-header-meta"><span class="bl-vl-sprint-header-meta-label">${esc(_meta.label)}</span><span class="bl-vl-sprint-header-meta-value">${esc(_meta.valor)}</span></div>`;
  }
  html += progressBar;
  html += `</div>`; // bl-vl-sprint-header

  html += `<div class="bl-vl-sprint-body${isCollapsed ? ' collapsed' : ''}" id="vbody-${groupId}">`;

  // Root: Rs con hijos anidados (incluye Rs done/historico desde fix mod:107 — ver header) +
  // T/B/P sueltos que no son done/historico/descartado
  {
    // childMap ahora se construye desde sprintItems (visible/filtrado por el caller) — antes se
    // construía desde el universo completo sin filtrar. Ver deuda declarada en header del archivo.
    const _childMap = _buildChildMap(sprintItems, isClosed);
    const _rCodesInGroup = new Set(sprintItems.filter(i => itemKind(i) === 'REQ').map(i => i.code));
    // Fix (INC sin código real identificable): en grupo cerrado (isClosed:true) todos los ítems terminan en
    // 'done'/'historico' — excluirlos de _rootPool dejaba el body sin nada que renderizar.
    // isClosed:true → solo se excluye 'descartado'.
    // Fix mod:107 (autorizado por founder, ver header del archivo): isClosed:false ya no
    // excluye REQs done/historico de forma incondicional — un REQ done necesita entrar al
    // root pool para que su forEach (más abajo) lo anide con sus hijos vía _childMap. Los
    // ítems no-REQ (TKT/INC) done/historico siguen excluidos de root — se muestran vía el
    // bloque "Done items sueltos" solo cuando no tienen REQ padre en este sprint (ver filtro
    // de _doneFlat más abajo), o anidados bajo su REQ si sí lo tienen.
    const _rootPool = isClosed
      ? sprintItems.filter(i => i.status !== 'descartado')
      : sprintItems.filter(i => {
          if (i.status === 'descartado') return false;
          if (itemKind(i) === 'REQ') return true;
          return i.status !== 'done' && i.status !== 'historico';
        });

    const _rootItems = _rootPool.filter(i => {
      if (itemKind(i) === 'REQ') return true;
      return !i.parentId || !_rCodesInGroup.has(i.parentId);
    });

    _rootItems.forEach(item => {
      const t = itemKind(item);

      if (t !== 'REQ') {
        html += buildBacklogItem(item);
        return;
      }

      const _children = _childMap.get(item.code) || [];
      // TKT-202608-472 (REQ-202608-196, TKT2): conteo de TKT hijos activos no-done, para el
      // badge de alerta de buildBacklogItem() cuando el REQ padre está done. 'descartado' no
      // cuenta (edge del AC). _childMap incluye hijos en cualquier status salvo 'historico'
      // filtrado — no aplica filtro adicional aquí más que done/descartado, ver AC de TKT.
      // Solo relevante cuando el REQ está done; en cualquier otro status el badge no se
      // muestra de todas formas (gate redundante también dentro de buildBacklogItem()).
      const _doneInconsistencyCount = (item.status === 'done')
        ? _children.filter(c => c.status !== 'done' && c.status !== 'descartado').length
        : 0;

      if (_children.length > 0) {
        const _collapseKey = 'locus-r-collapsed-' + item.code;
        const _isRCollapsed = localStorage.getItem(_collapseKey) === '1';

        html += `<div class="bl-vl-req" data-r-code="${esc(item.code)}">`;
        // Fix (histórico — sin CHECKPOINT confirmado): suppressChildren:true — evita que buildBacklogItem() renderice
        // su bloque interno .req-children-block (mini-rows) cuando este bloque ya va a
        // renderizar los hijos completos como .bl-child-row unas líneas más abajo. Sin este
        // flag, cada TKT hijo se dibujaba dos veces.
        html += buildBacklogItem(item, { suppressChildren: true, doneInconsistencyCount: _doneInconsistencyCount });
        html += `<button class="bl-r-toggle${_isRCollapsed ? ' collapsed' : ''}" data-action="vl-toggle-r" data-r-code="${esc(item.code)}" aria-label="Colapsar/expandir hijos" title="Colapsar/expandir hijos" type="button" aria-expanded="${_isRCollapsed ? 'false' : 'true'}"><svg class="ti-svg chevron" aria-hidden="true"><use href="#ti-chevron-right"></use></svg></button>`;
        html += `<div class="bl-vl-req-body${_isRCollapsed ? ' collapsed' : ''}" id="bl-vl-req-body-${esc(item.code)}">`;
        _children.forEach(child => {
          html += `<div class="bl-child-row">${buildBacklogItem(child)}</div>`;
        });
        html += `</div>`; // bl-vl-req-body
        html += `</div>`; // bl-vl-req
      } else {
        html += buildBacklogItem(item);
      }
    });
  }

  // Done items sueltos — no anidados bajo un R ya renderizado en el bloque root.
  // Fix (INC sin código real identificable): en grupo cerrado (isClosed:true) el _rootPool ampliado ya cubrió done Y
  // historico — repetir este bloque duplicaría el render. Solo corre para grupos no cerrados.
  if (!isClosed) {
    const _rCodesInGroupForDone = new Set(sprintItems.filter(i => itemKind(i) === 'REQ').map(i => i.code));
    const _doneFlat = sprintItems.filter(i => {
      if (i.status !== 'done') return false;
      const t = itemKind(i);
      // Fix mod:107: un REQ done ya se resolvió en el bloque root de arriba (ver _rootPool) —
      // anidado con sus hijos si los tiene, o suelto sin toggle si no los tiene. Excluirlo aquí
      // evita que se duplique (root + done sueltos).
      if (t === 'REQ') return false;
      if ((t === 'TKT' || t === 'INC') && i.parentId && _rCodesInGroupForDone.has(i.parentId)) return false;
      return true;
    });
    if (_doneFlat.length) html += _doneFlat.map(item => buildBacklogItem(item)).join('');
  }

  html += `</div>`; // bl-vl-sprint-body
  html += `</div>`; // bl-vl-sprint-group
  return html;
}

// TKT1: header-only para sprint activo/programado sin ningún ítem visible — caso que
// renderSprintGroup no puede cubrir (sin ítems no hay de dónde derivar sprintId). Exclusivo
// de Backlog Vista Lista. Progress 0/0 · 0% — sin body de ítems.
function _emptySprintHeaderHtml(sprintId, sprintObj) {
  const isActive  = sprintObj?.status === 'active';
  const isPlanned = !isActive;
  const label     = sprintObj ? (sprintObj.label || sprintId) : sprintId;
  const groupId   = 'vl-' + sprintId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const isCollapsed = _getCollapsedVersions().has(groupId);
  const sprintStatusLabel = isActive
    ? `<span class="sprint-badge-active">activo</span>`
    : `<span class="sprint-badge-planned">planificado</span>`;
  // TKT3 (REQ CAEL-0724-01): _sprintVelocityLabel() retorna {label, valor} | null — sin equivalente
  // de _metaText en este caller (confirmado contra código real: nunca lo tuvo, caso Cerrado/
  // Planificado con ítems no aplica a header vacío sin ítems).
  const _velMeta = isActive ? _sprintVelocityLabel(sprintId) : null;

  let html = `<div class="bl-vl-sprint-group${isActive ? ' sprint-group-active' : ''}${isPlanned ? ' sprint-group-planned' : ''}" data-sprint-id="${esc(sprintId)}">`;
  html += `<div class="bl-vl-sprint-header version-collapse-trigger" data-action="version-collapse" data-group-id="${groupId}" tabindex="0" role="button" aria-expanded="${isCollapsed ? 'false' : 'true'}">`;
  html += `<div class="bl-vl-sprint-header-row1">`;
  html += `<svg class="ti-svg chevron" id="varrow-${groupId}" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>`;
  html += `<span id="sprint-label-wrap-${esc(sprintId)}"><span class="version-tag">${esc(sprintId)}</span>${(label && label !== sprintId) ? `<span class="sprint-name-label">${esc(label)}</span>` : ''}</span>`;
  html += sprintStatusLabel;
  html += `</div>`;
  if (_velMeta) html += `<div class="bl-vl-sprint-header-meta"><span class="bl-vl-sprint-header-meta-label">${esc(_velMeta.label)}</span><span class="bl-vl-sprint-header-meta-value">${esc(_velMeta.valor)}</span></div>`;
  html += `<div class="bl-vl-sprint-header-progress">
    <div class="bl-vl-progress-track"><div class="bl-vl-progress-fill" style="--ver-bar-w:0%"></div></div>
    <span class="bl-vl-progress-label">0/0 · 0%</span>
  </div>`;
  html += `</div>`; // bl-vl-sprint-header
  html += `<div class="bl-vl-sprint-body${isCollapsed ? ' collapsed' : ''}" id="vbody-${groupId}"></div>`;
  html += `</div>`; // bl-vl-sprint-group
  return html;
}

function _renderVistaLista(listEl, pendienteItems, doneItems, terminalItems, _matchesQuery, _sortGroup, onRendered) {
  // B-202606-076 / TKT-C1: _isQBacklog/_isQDisc importadas desde locus-backlog-core.js — fuente única.
  // TKT (REQ sin código real identificable): ítems ITIL (INC/PRB/KE/CHG con queue Q-INC) excluidos de #backlog-list —
  // panel dedicado vive en #tab-incidentes (TKT2 REQ CAEL-01: migrado de sub-tab a tab top-level). Filtro legacy por sprint string-match eliminado.
  // [tmp:tkt-isqinc-unify]: _isQInc local eliminada — usa isQIncItem() importada desde locus-backlog-core.js.

  // T-202606-090 AC-6 / TKT-C1: ítems sin sprint (Q-Backlog/Q-DISC) excluidos de #backlog-list —
  // viven en renderQBacklogPanel()/renderQDiscPanel() (sub-tabs dedicados).
  // TKT (REQ sin código real identificable): ítems ITIL excluidos del mismo modo — ver isQIncItem importada.
  const sprintableItems = pendienteItems.filter(i => !_isQBacklog(i) && !_isQDisc(i) && !isQIncItem(i));

  // Agrupar por sprint
  // B-202606-018: normalizar la clave a solo el ID del sprint — algunos ítems almacenan
  // el campo sprint con el label completo ("PP-S-01 · Nombre del sprint") mientras otros
  // solo almacenan el ID ("PP-S-01"). Sin normalización, Object.keys produce dos entradas
  // distintas para el mismo sprint → dos headers en la vista Lista.
  const sprintMap = {};
  sprintableItems.forEach(i => {
    const key = _extractSprintId((i.sprint || '').trim());
    if (!sprintMap[key]) sprintMap[key] = [];
    sprintMap[key].push(i);
  });

  // B-202606-002: sprints que solo tienen done items visibles no aparecen en sprintMap
  // (construido solo desde sprintableItems = pendientes). Registrarlos con array vacío
  // para que el loop de sprint groups los incluya y emita _doneInGroup.
  // TKT (REQ sin código real identificable): done items ITIL excluidos del mismo modo que icebox —
  // sin esto, un sprint con solo done items ITIL generaría un group header vacío en #backlog-list.
  if (_getActiveStatuses().has('done')) {
    doneItems.forEach(i => {
      if (_isQBacklog(i) || _isQDisc(i) || isQIncItem(i)) return;
      const key = _extractSprintId((i.sprint || '').trim());
      if (!sprintMap[key]) sprintMap[key] = [];
    });
  }

  // B-068: sprints 'active' o 'scheduled' (programado) sin ningún ítem visible (ni pendiente
  // ni done) no entran a sprintMap por los dos bloques anteriores — su header desaparecía de
  // la Vista Lista. Se registran aquí con array vacío para que el forEach de sprint groups los
  // incluya siempre. Q-INC queda excluido — vive en su propio tab top-level (#tab-incidentes), no en
  // #backlog-list. Sprints 'closed' quedan excluidos — su visibilidad sin ítems no es parte de
  // este AC y se rige por el comportamiento ya existente.
  getActiveSprints().forEach(s => {
    if (s.status !== 'active' && s.status !== 'scheduled') return;
    if (!sprintMap[s.id]) sprintMap[s.id] = [];
  });

  // TKT (REQ Sort de headers de sprint): orden ascendente de sprint ID — reemplaza el criterio
  // descendente de AC2 anterior. Activo siempre primero, luego el resto por número ascendente.
  // Sprints sin objeto en getActiveSprints() (solo ítems con sprint string) también se ordenan por número
  const sprintKeys = Object.keys(sprintMap).sort((a, b) => {
    const sa = _getSprintById(a), sb = _getSprintById(b);
    // Activo siempre primero, luego ascendente por número de sprint
    const rankA = sa?.status === 'active' ? 0 : 1;
    const rankB = sb?.status === 'active' ? 0 : 1;
    if (rankA !== rankB) return rankA - rankB;
    const na = parseInt(a.replace(/\D/g, '')) || 0;
    const nb = parseInt(b.replace(/\D/g, '')) || 0;
    return na - nb; // ascendente
  });

  let html = '';

  // Fix (INC sin código real identificable): self-heal de status de REQ removido de este loop — corre una
  // sola vez, sobre el universo completo de ITEMS, en renderBacklogList() antes de calcular
  // `filtered`/pendienteItems (ver bloque al inicio de esa función). Este loop ya solo lee
  // item.status, corregido de antemano — evita que un REQ pase el filtro de status con su
  // valor viejo y mute a un status fuera del filtro activo dentro de la misma pasada.

  // ── Sprint groups ─────────────────────────────────────────────────────────
  // TKT1 (REQ Histórico unificado): el bloque de render por grupo se movió a renderSprintGroup()
  // (función pura, exportada, ver definición más arriba). Este loop solo arma sprintItems
  // (unión ya filtrada/ordenada de root+done+historico) y delega.
  sprintKeys.forEach(sprintId => {
    const group = sprintMap[sprintId];
    // B-202606-002: no descartar el grupo si tiene done items visibles aunque no tenga pendientes
    const _hasDoneInGroup = _getActiveStatuses().has('done') && doneItems.some(i => _extractSprintId((i.sprint || '').trim()) === sprintId);
    // B-068: no descartar el grupo si el sprint está active/scheduled — su header se muestra
    // siempre, con o sin ítems visibles. Ver bloque getActiveSprints().forEach() más arriba.
    const _sprintObjForGate = _getSprintById(sprintId);
    const _alwaysShowHeader = _sprintObjForGate && (_sprintObjForGate.status === 'active' || _sprintObjForGate.status === 'scheduled');
    if ((!group || !group.length) && !_hasDoneInGroup && !_alwaysShowHeader) return;

    const sprintObj = _getSprintById(sprintId);
    const isClosed  = sprintObj?.status === 'closed';

    // Side effect fuera de renderSprintGroup — ver nota de header del archivo (contract_detail
    // declara sideEffects: ninguno para la función extraída).
    _warmHistoricoCacheIfNeeded(isClosed);

    // Done items visibles del grupo (respeta filtro de status 'done' + búsqueda activa)
    // B-202606-048: excluir Ts/Bs done cuyo parentId apunta a un R visible en el grupo —
    // renderSprintGroup los anida bajo su R vía childMap, evita duplicado.
    const _rCodesInGroupForDone = new Set((group || []).filter(i => itemKind(i) === 'REQ').map(i => i.code));
    const _doneVisible = _getActiveStatuses().has('done')
      ? getItems().filter(i => {
          if (_extractSprintId((i.sprint || '').trim()) !== sprintId) return false;
          if (i.status !== 'done') return false;
          if (!_isCountableItem(i)) return false;
          if (!_matchesQuery(i)) return false;
          return true;
        })
      : [];

    // Historico visible cuando el sprint está cerrado — mismo universo con historico que antes.
    const _historicoVisible = isClosed
      ? _getAllItemsWithHistorico().filter(i => i.status === 'historico' && _extractSprintId((i.sprint || '').trim()) === sprintId)
      : [];

    // Orden: root (sorted) primero, done+historico (sorted) después — mismo orden que la
    // implementación anterior (root block seguido de done block, sin merge-then-sort).
    const _groupItems = [
      ..._sortGroup(group || []),
      ..._sortGroup([..._doneVisible, ..._historicoVisible])
    ];

    if (!_groupItems.length) {
      // Sprint activo/programado sin ningún ítem visible — caso fuera de alcance de
      // renderSprintGroup (requiere al menos 1 item para derivar sprintId internamente).
      // Exclusivo de Backlog Vista Lista — Histórico nunca lo enfrenta (TKT2 AC3 cubre
      // Histórico vacío con empty-state global, no headers de sprint por sprint).
      html += _emptySprintHeaderHtml(sprintId, sprintObj);
      return;
    }

    html += renderSprintGroup(_groupItems, isClosed);
  });

  // Fix (INC sin código real identificable): saveBacklog() de self-heal ya no vive aquí — se dispara una sola
  // vez en renderBacklogList() (ver bloque previo a `filtered`), donde ahora corre el self-heal
  // sobre el universo completo. Guard anti-cascada realtime sigue cubierto genéricamente por
  // syncState.withSaveLock() dentro de saveBacklog() (locus-storage.js:1773).

  // T-202606-090 AC-6 / TKT-C1: bloque "Icebox al final" eliminado de #backlog-list — los ítems
  // sin sprint (Q-Backlog/Q-DISC) se muestran en renderQBacklogPanel()/renderQDiscPanel() (sub-tabs).
  // TKT (REQ sin código real identificable): ítems ITIL excluidos del mismo modo — ver #tab-incidentes.

  // Cerradas — R/T/B descartado + P descartado + P promovida — bloque unificado
  // Solo visible cuando fstatus-descartado está activo (activeStatuses incluye 'descartado' y 'promovida')
  if (terminalItems.length && _getActiveStatuses().has('descartado')) {
    const cerradasOpen = localStorage.getItem('backlog-cerradas-open') === '1';
    const _promCount   = terminalItems.filter(i => i.status === 'promoted').length; // TKT-202606-009: Gen2 canónico — era 'promovida' legacy
    const _descPCount  = terminalItems.filter(i => i.status === 'descartado' && itemKind(i) === 'DISC').length;
    const _descRTBCount = terminalItems.filter(i => i.status === 'descartado' && itemKind(i) !== 'DISC').length;
    const _cerradasTitle = [
      _promCount    ? `${_promCount} promovida${_promCount !== 1 ? 's' : ''}`        : '',
      _descPCount   ? `${_descPCount} P descartada${_descPCount !== 1 ? 's' : ''}`  : '',
      _descRTBCount ? `${_descRTBCount} descartado${_descRTBCount !== 1 ? 's' : ''}` : ''
    ].filter(Boolean).join(' · ');
    html += `<div class="section-group sg-cerradas" id="sg-cerradas">
      <div class="section-group-header" data-action="section-group-toggle" data-group="cerradas">
        <span class="section-group-arrow" id="sgarrow-cerradas">${cerradasOpen ? '▾' : '▸'}</span>
        <span>Cerradas</span>
        <span class="section-group-count" title="${_cerradasTitle}">${terminalItems.length} ítem${terminalItems.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="section-group-body items-grid${cerradasOpen ? '' : ' collapsed'}" id="sgbody-cerradas">`;
    terminalItems.forEach(item => { html += buildBacklogItem(item); });
    html += `</div></div>`;
  }

  // T-202606-107: empty state diferenciado — backlog vacío real vs filtros ocultan todo
  const _hasVisible = pendienteItems.length || doneItems.length || (terminalItems.length && _getActiveStatuses().has('descartado'));
  if (!_hasVisible) {
    // hasItems: hay ítems contables antes de aplicar cualquier filtro
    const hasItems = getItems().length > 0;
    // hasFiltersActive: al menos un filtro no-default está activo (criterio exacto del AC)
    const _as = _getActiveStatuses();
    const hasFiltersActive = _getActiveTypes().size < 4
      || !_as.has('pendiente')
      || !_as.has('en-revision')
      || _getActiveEfforts().size < 3; // TKT-202608-290: búsqueda local retirada — reemplazada por ⌘K

    let emptyIcon = '🔍', emptyTitle = '', emptyHint = '', emptyCTA = '';
    if (!hasItems) {
      // Backlog vacío real — ningún ítem en ITEMS
      emptyIcon  = '📋';
      emptyTitle = 'El backlog está vacío';
      emptyHint  = 'Importa un backlog para comenzar.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-import">Importar backlog</button>`;
    } else if (hasFiltersActive) {
      // Hay ítems pero los filtros ocultan todo
      emptyTitle = 'Sin resultados con los filtros activos';
      emptyHint  = 'Prueba ajustando o limpiando los filtros.';
      emptyCTA   = `<button class="empty-state-btn" data-action="es-clear-filters">✕ Limpiar filtros</button>`;
    } else {
      emptyIcon  = '📋';
      emptyTitle = 'Sin ítems pendientes';
      emptyHint  = 'Todos los ítems están completados o no hay trabajo asignado a este sprint.';
    }
    html = `<div class="empty-state">
      <div class="empty-state-icon">${emptyIcon}</div>
      <div class="empty-state-title">${emptyTitle}</div>
      <div class="empty-state-hint">${emptyHint}</div>
      ${emptyCTA}
    </div>`;
  }


  listEl.classList.remove('kb-active');
  listEl.innerHTML = html;
  _skelHide(listEl);

  // T-202606-092 AC-5: renderArchivoHistorico() ya no se invoca desde aquí — vive en
  // renderHistoricoPanel(), sub-tab dedicado. Antes: renderArchivoHistorico(listEl).

  // TKT-202608-290: bloque de conteo de resultados de búsqueda local retirado — #search-count
  // ahora es dominio exclusivo del buscador global (locus-ui-shell.js), ver TKT hermano.

  _attachBacklogDnD();
  _resetBacklogListDelegation(); // B-202606-023: reset guard antes de re-registrar
  _attachBacklogListDelegation();
  _attachPlanViewDelegation();
  _updateDocLogCount('backlog');

  // AC9: delegación vl-toggle-r — toggle de colapso de hijos de R en Vista Lista
  // AC5: persiste en localStorage bajo clave 'locus-r-collapsed-[rCode]'
  // INC-202607-001 (fix): listEl persiste entre renders — solo su innerHTML cambia (línea ~658).
  // Sin guard, este addEventListener se acumulaba una vez por cada renderBacklogList(), generando
  // N listeners tras N re-renders y toggles intermitentes (cada listener recalculaba isNowCollapsed
  // sobre el estado ya mutado por el anterior). _vlToggleBound asegura una sola suscripción por
  // ciclo de vida del nodo — no depende del AbortController interno de locus-backlog-item.js.
  if (!listEl._vlToggleBound) {
    listEl._vlToggleBound = true;
    listEl.addEventListener('click', function _vlToggleHandler(e) {
      const btn = e.target.closest('[data-action="vl-toggle-r"]');
      if (!btn) return;
      const rCode = btn.dataset.rCode;
      if (!rCode) return;
      const body = document.getElementById('bl-vl-req-body-' + CSS.escape(rCode));
      if (!body) return;
      const isNowCollapsed = !body.classList.contains('collapsed');
      body.classList.toggle('collapsed', isNowCollapsed);
      btn.classList.toggle('collapsed', isNowCollapsed);
      btn.setAttribute('aria-expanded', String(!isNowCollapsed));
      const _collapseKey = 'locus-r-collapsed-' + rCode;
      if (isNowCollapsed) {
        localStorage.setItem(_collapseKey, '1');
      } else {
        localStorage.removeItem(_collapseKey);
      }
    });
  }

  // TKT-202608-290: placeholder dinámico de #backlog-search-input retirado junto con el input.

  if (typeof onRendered === 'function') onRendered();
}

export function renderBacklogList(onRendered) {
  if (!_backlogListDirty) return;
  // AC-3 T-202605-118: skip si el item editor está abierto
  const _ieOverlay = document.getElementById('item-editor-overlay');
  if (_ieOverlay && _ieOverlay.offsetParent !== null) { return; }
  // B-202605-083: defer si hay input/textarea activo dentro de backlog-list
  const listEl = document.getElementById('backlog-list');
  const _ae = document.activeElement;
  if (listEl && _ae && listEl.contains(_ae) && (_ae.tagName === 'INPUT' || _ae.tagName === 'TEXTAREA')) {
    _ae.addEventListener('blur', function _deferRender() {
      _markBacklogListDirty();
      renderBacklogList(onRendered);
    }, { once: true });
    return;
  }
  _backlogListDirty = false;
  _skelShow(listEl, 5); // TKT-202608-290: lectura de backlogSearchQuery retirada — búsqueda local eliminada

  // R-[tmp:toolbar-backlog-redesign]: botones de vista ya son estáticos en HTML — solo actualizar estado
  (function _updateViewBtns() {
    // TKT-202607-027: bloque kanbanBtn eliminado — control de toggle Lista/Kanban ya no existe en la UI
    // Sin AC y bloqueados
    const noAcBtn = document.getElementById('fbar-no-ac-btn');
    if (noAcBtn) noAcBtn.classList.toggle('active', _getBacklogNoAcMode());
    // T-202606-062: bloque fbar-sprint-btn eliminado — _backlogSprintGroupMode ya no existe
  })();

  // Guard: backlog requiere proyecto activo
  if (!_getActiveProjectFilter()) {
    const hasProjects = (state.projects || []).length > 0;
    if (!hasProjects) {
      // R-202605-178: global empty — ningún proyecto creado → secuencia de primeros pasos
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🗂</div>
          <div class="empty-state-title">Crea tu primer proyecto para empezar</div>
          <div class="empty-state-hint">Sigue estos pasos para tener tu primer ítem en el backlog:</div>
          <ol class="empty-state-steps">
            <li><strong>Crea un proyecto</strong> en el tab Proyectos</li>
            <li><strong>Abre un sprint</strong> desde el Backlog</li>
            <li><strong>Registra tu primera sesión</strong> en el Tracker</li>
          </ol>
          <button class="empty-state-btn" data-action="es-switch-tab" data-tab="proyectos">Ir a Proyectos</button>
        </div>`;
    } else {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">Selecciona un proyecto</div>
          <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
          <button class="empty-state-btn" data-action="es-switch-tab" data-tab="proyectos">📁 Seleccionar proyecto</button>
        </div>`;
    }
    _skelHide(listEl);
    return;
  }

  if (!getItems().length) {
    // B-202605-062: diferenciar backlog vacío real vs proyecto sin datos en localStorage
    const _activeFilter = _getActiveProjectFilter();
    const _projKey = _activeFilter ? 'backlog-items-' + _activeFilter : null;
    const _hasStoredData = _projKey ? !!localStorage.getItem(_projKey) : false;
    if (_activeFilter && !_hasStoredData) {
      // Proyecto seleccionado pero sin datos en localStorage
      listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <div class="empty-state-title">Este proyecto no tiene ítems aún</div>
        <div class="empty-state-hint">Selecciona otro proyecto o empieza a registrar sesiones para ver ítems aquí.</div>
        <button class="empty-state-btn" data-action="es-switch-tab" data-tab="proyectos">Cambiar proyecto</button>
      </div>`;
      _skelHide(listEl);
      return;
    }
    // R-202605-178: backlog vacío — diferenciar sprint activo vs sin sprint
    const _activeSprint178 = _getActiveSprint();
    if (_activeSprint178) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">Registra tu primera sesión para ver ítems aquí</div>
          <div class="empty-state-hint">Tienes un sprint activo. Ve al Tracker, abre una sesión con tu IA y guarda el resultado.</div>
          <button class="empty-state-btn" data-action="es-switch-tab" data-tab="tracker">Ir al Tracker</button>
        </div>`;
    } else {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">Abre un sprint para empezar</div>
          <div class="empty-state-hint">El backlog necesita un sprint activo. La apertura de sprint se propone desde Cael (sprint_proposal) — no hay creación manual desde aquí.</div>
        </div>`;
    }
    _skelHide(listEl);
    return;
  }

  // TKT-202607-027: bloque de desvío a vista Kanban eliminado (T-202604-287 deprecado) — Vista Lista es el único modo

  // TKT1 (REQ-202608-180): self-heal de status de REQ extraído a _selfHealReqStatuses()
  // (locus-backlog-core.js) — antes vivía inline aquí. Se ejecuta sobre el universo COMPLETO
  // de ITEMS y ANTES de construir `filtered`/pendienteItems más abajo (mismo orden que ya
  // usaba _renderZonePanel, locus-backlog-zone-engine.js — causa raíz del INC de flicker era
  // que este bloque corría solo sobre `group`, subconjunto ya filtrado). La construcción de
  // HTML por sprint group más abajo ya no recalcula self-heal — solo lee item.status ya
  // corregido. saveBacklog() se decide aquí según el resultado, no dentro de la función extraída.
  // TKT3 CAEL-08231830-01 (REQ-202608-180): firma generalizada — pasa getItems() explícito
  // (mismo universo COMPLETO que ya usaba, sin cambio de comportamiento observable aquí).
  if (_selfHealReqStatuses(getItems()).changed) saveBacklog();

  // Filtrado por tipo + status + effort (T-071)
  // B-202604-193: excluir ítems históricos del plano activo — van a sección colapsada al fondo
  // T-202606-102: Ps promovidas excluidas de pendienteItems — van a sección Cerradas
  let filtered = getItems().filter(i => {
    if (i.status === 'historico') return false;
    const type = itemKind(i);
    // TKT2 (REQ CAEL-0718-02): DISC nunca vive en Backlog list, sin importar el chip de
    // filtro de tipo activo — invariante de arquitectura (__BR-Ecosystem §4b), DISC vive
    // exclusivamente en Q-DISC. Confirmado por founder: exclusión total, no solo en Cerradas.
    if (type === 'DISC') return false;
    const typeOk = type ? _getActiveTypes().has(type) : true;
    // INC-[ref_id:QA-0724-01]: 'bloqueado' quedó sin mecanismo de inclusión en activeStatuses
    // desde que fbar-blocker-btn fue eliminado (T-202606-047) — un REQ bloqueado (status
    // asignable solo por Finn, __BR-Ecosystem §5) nunca pasaba este filtro bajo el default
    // {pendiente, en-revision} y no existía botón para agregarlo. Tratado como siempre-visible,
    // igual que el status ya excluye 'historico' explícitamente unas líneas arriba — no requiere
    // chip ni botón nuevo, sin cambio de CSS.
    // INC-[ref_id:QA-0724-03]: 'en-proceso' agregado al mismo tratamiento siempre-visible que
    // 'bloqueado' (QA-0724-01) — ver comentario completo en el mismo fix de renderStats()
    // (locus-backlog-core.js). Sin este tratamiento, un REQ auto-transicionado a 'en-proceso'
    // sin camino de reversión (_computeRStatusFromChildren) queda invisible en Vista Lista con
    // el filtro default {pendiente, en-revision} — su TKT hijo se renderiza suelto, fuera del
    // wrapper .bl-vl-req, porque _rCodesInGroup nunca incluye el código del REQ excluido.
    const statusOk = i.status === 'bloqueado' || i.status === 'en-proceso' || _getActiveStatuses().has(i.status);
    const _rawEffort = parseInt(i.effort) || 1;
    const _normEffort = _rawEffort > 3 ? 3 : _rawEffort < 1 ? 1 : _rawEffort;
    const effortOk = _getActiveEfforts().has(_normEffort); // T-071 · B-202605-233: effort >3 normalizado a 3
    // T-202604-357: filtro por prioridad — vacío = todos
    let priorityOk = true;
    if (_getActivePriorityFilter().size > 0) {
      const p = i.priority || 'medium';
      const isHigh = p === 'high' || p === 'important' || p === 'critical' || p === 'importante';
      const isLow  = p === 'low' || p === 'futura' || p === 'baja';
      if (_getActivePriorityFilter().has('high') && isHigh) priorityOk = true;
      else if (_getActivePriorityFilter().has('low') && isLow) priorityOk = true;
      else if (_getActivePriorityFilter().has('medium') && !isHigh && !isLow) priorityOk = true;
      else priorityOk = false;
    }
    return typeOk && statusOk && effortOk && priorityOk; // T-202606-098: roleOk eliminado
  });

  // T-202604-363: Sin AC — solo pendientes sin criterios de aceptación
  if (_getBacklogNoAcMode()) {
    filtered = filtered.filter(i => i.status === 'pendiente' && (!i.ac || !i.ac.length));
  }

  // T-202605-449: filtro por dependencias explícitas bloqueantes
  if (_getDepsFilter() === 1) {
    filtered = filtered.filter(i => _hasDepsBlocked(i));
  } else if (_getDepsFilter() === 2) {
    filtered = filtered.filter(i => !_hasDepsBlocked(i) && i.status === 'pendiente');
  }

  // TKT-202608-290: filtro por texto (q) retirado — búsqueda local eliminada, reemplazada por ⌘K

  updateClearFilterBtn();

  // T-202604-065: sort dentro de cada grupo — T-072: respeta _getBacklogSortDir()
  const _priOrder = { high: 0, important: 0, critical: 0, importante: 0, medium: 1, low: 2, futura: 2, baja: 2 };
  const _typeOrder = { INC: 0, TKT: 1, REQ: 2, DISC: 3 };
  const _dir = _getBacklogSortDir() === 'desc' ? -1 : 1;

  // T-202604-424: sort interno dentro de cada grupo de sprint — priority desc → effort asc
  // Fix histórico (código real no identificable, notación Gen1 'B-'): aplicar _dir para respetar _getBacklogSortDir() — el botón ↑↓ ahora funciona en modo sprint group
  function _sortGroup(arr) {
    return [...arr].sort((a, b) => {
      const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
      if (pa !== pb) return (pa - pb) * _dir;
      const ea = parseInt(a.effort) || 1, eb = parseInt(b.effort) || 1;
      if (ea !== eb) return (ea - eb) * _dir;
      return a.code.localeCompare(b.code) * _dir;
    });
  }

  function _sortItems(arr) {
    return [...arr].sort((a, b) => {
      let cmp = 0;
      if (_getBacklogSortMode() === 'priority') {
        const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
        cmp = pa !== pb ? pa - pb : a.code.localeCompare(b.code);
      } else if (_getBacklogSortMode() === 'effort') {
        const ea = parseInt(a.effort) || 1, eb = parseInt(b.effort) || 1;
        cmp = ea !== eb ? eb - ea : a.code.localeCompare(b.code);
      } else if (_getBacklogSortMode() === 'type') {
        const ta = _typeOrder[itemKind(a)] ?? 9, tb = _typeOrder[itemKind(b)] ?? 9;
        cmp = ta !== tb ? ta - tb : a.code.localeCompare(b.code);
      } else if (_getBacklogSortMode() === 'completedAt') {
        // Ítems sin doneAt van al final (independiente de dir)
        const ha = a.doneAt != null, hb = b.doneAt != null;
        if (ha !== hb) return ha ? -1 : 1; // los que tienen fecha primero
        cmp = ha && hb ? (a.doneAt - b.doneAt) : a.code.localeCompare(b.code);
      } else if (_getBacklogSortMode() === 'createdAt') {
        // Ítems sin createdAt van al final (independiente de dir)
        const ha = a.createdAt != null, hb = b.createdAt != null;
        if (ha !== hb) return ha ? -1 : 1;
        cmp = ha && hb ? (a.createdAt - b.createdAt) : a.code.localeCompare(b.code);
      } else {
        cmp = a.code.localeCompare(b.code);
      }
      return cmp * _dir;
    });
  }

  // T-202604-061: separar done/descartado del resto
  // T-202604-082: modo sprint = agrupado por sprint; otros modos = lista plana
  // R-202604-091: 'en curso' fusionado — todos los pendiente van juntos, decorador visual separa activos
  // T-202605-135: Ps integradas en pendienteItems — sin sección separada
  // Nota (ítem de origen sin código real identificable): promovida excluida de pendienteItems — va a terminalItems
  const pendienteItems = filtered.filter(i => i.status !== 'done' && i.status !== 'descartado' && !(itemKind(i) === 'DISC' && i.status === 'promoted')); // TKT-202606-009: Gen2 canónico
  // TKT-202608-290: _matchesQuery siempre true — búsqueda local retirada. Se conserva como
  // parámetro/predicado (en vez de eliminar su hilo por getDoneItems/_renderVistaLista) porque
  // ambos ya aceptan una función de predicado como contrato estable — cambiar su valor a un
  // no-op es más seguro que remover la firma en cascada por dos archivos.
  const _matchesQuery = () => true;
  const doneItems      = _getActiveStatuses().has('done')
    ? getDoneItems(_matchesQuery)  // T-202606-028: reutiliza getDoneItems global — evita getItems().filter() duplicado
    : [];
  // Nota (ítem de origen sin código real identificable): terminalItems — bloque Cerradas unificado
  // Incluye: R/T/B descartado + P descartado + P promovida
  // Solo visible cuando fstatus-descartado está activo (activeStatuses incluye 'descartado')
  // T-202606-060: typeOk aplicado sobre R/T/B — Ps siempre incluidas cuando el bloque es visible
  // TKT2 (REQ CAEL-0718-02): DISC excluida de Backlog list sin excepción de status —
  // invariante de arquitectura, DISC vive exclusivamente en Q-DISC (__BR-Ecosystem §4b).
  // El caso especial anterior (TKT-202606-009) mostraba DISC descartada/promoted en Cerradas
  // — decisión de código sin registro en _ob-history-log como decisión de founder. Sobreescrita
  // con confirmación explícita del founder en sesión REQ CAEL-0718-02.
  // TKT-202608-434 (REQ-202608-176): excluye draft:true — __BR-Ecosystem §8 exige que un ítem
  // en draft quede fuera de toda vista activa del backlog (Q-Backlog, sprint, Kanban); Vista
  // Lista quedaba fuera del alcance real de REQ-202607-026/AC2, que solo cubrió el sub-tab
  // Q-Backlog (_isQBacklogActive/_isQDiscActive). Sin cambio para ítems draft:false o sin
  // campo draft (legado) — mismo comportamiento que antes del fix.
  const terminalItems = _getActiveStatuses().has('descartado')
    ? getItems().filter(i => {
        if (i.draft) return false;
        const type = itemKind(i);
        if (type === 'DISC') return false;
        const typeOk = type ? _getActiveTypes().has(type) : true;
        return i.status === 'descartado' && typeOk && _matchesQuery(i);
      })
    : [];

  // R-202606-017 / fix (INC sin código real identificable): Vista Lista es la única vía de render para pendienteItems —
  // el path noAc standalone nunca los renderizaba (bug: lista en blanco con filtro Sin AC activo).
  // pendienteItems ya viene filtrado por _getBacklogNoAcMode() más arriba (L957) — _renderVistaLista
  // no requiere cambio, solo recibe el conjunto ya acotado. TKT-202607-027: Vista Lista es ahora el
  // único modo de render — sin guard de Kanban que evaluar, la llamada es directa e incondicional.
  _renderVistaLista(listEl, pendienteItems, doneItems, terminalItems, _matchesQuery, _sortGroup, onRendered);

}

// REQ refactor-zonas TKT3/TKT4/TKT5: _renderDoneGroup, _attachDoneGroupToggle, _renderZonePanel,
// renderQBacklogPanel, renderQDiscPanel, _initQBacklogSubTab, _initQDiscSubTab y el listener
// shell:backlog-render-dirty de ambos paneles se extrajeron a locus-backlog-zone-engine.js
// (motor compartido) y a locus-backlog-qbacklog.js / locus-backlog-qdisc.js (cada zona con su
// propio módulo — side-effect import requerido en main.js, ver CHECKPOINT).

// T-202606-092: renderHistoricoPanel — render del panel Histórico en #sspanel-historico.
// AC-4: renderHistoricoSection() recibe el propio #sspanel-historico como listEl — el bloque
// #historico-section se inyecta directo ahí (no en #backlog-list). TKT2 (REQ Histórico unificado)
// eliminó la distinción Por sprint / Lista plana — vista única, ver locus-backlog-historico.js.
// Panel se limpia antes de cada llamada: renderHistoricoSection ya deduplica #historico-section
// internamente (remueve instancia previa antes de crear la nueva) — el reset previo aquí es
// redundante pero inofensivo, evita acumulación en re-renders si el guard interno cambiara.
// (mismo contrato que _renderVistaLista/renderBacklogList, que resetean listEl.innerHTML antes
// de llamarla). AC-2, AC-6, AC-7, AC-8, AC-9.
// Fix (INC sin código real identificable): async — refresca el cache de historico antes de leer getHistoricoCount()/
// getHistoricoStats() (que dependen del mismo cache que _buildHistoricoPartitions en
// locus-backlog-historico.js). Ambos call sites del handler (click sub-tab, shell:backlog-render-dirty)
// se ajustan a async/await.
export async function renderHistoricoPanel() {
  const panel = document.getElementById('sspanel-historico');
  if (!panel) return;

  const badge = document.getElementById('tpl-badge-historico');

  // AC-8: sin proyecto activo — mismo empty state que #backlog-list
  if (!_getActiveProjectFilter()) {
    panel.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Selecciona un proyecto</div>
        <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
      </div>`;
    if (badge) badge.textContent = '';
    return;
  }

  await refreshHistoricoCache();

  // AC-2: count interno del panel — se sigue calculando para el empty state y renderHistoricoSection.
  // B-202606-087: badge de subtab NUNCA muestra conteo en Histórico (AC T-202606-035, done) —
  // el conteo es responsabilidad de _updateSubtabBadges(); este call site solo limpia el badge.
  const count = getHistoricoCount();
  if (badge) badge.textContent = '';

  // TKT2 (REQ CAEL-0720-01, ref_id CAEL-0720-03): stats-bar de Histórico homologada con
  // .bl-header-unified de Backlog — wrapper con borde/radius/sticky/background (locus-backlog.css
  // mod:100+), fila de conteos en .stats-row--compact (chip Total migrado de .stat-card a
  // .stat-compact-item), fila de esfuerzo agregada (byEffort, ver getHistoricoStats mod:23).
  // Chips de tipo/prioridad/esfuerzo siguen siendo informativos — <span>, sin data-action, sin
  // role/tabindex, sin listener de delegación (mismo criterio T-202606-006 ya vigente).
  // Clases: .stat-type-chip--static / .stat-pri-chip--static ya existentes (mod:48) —
  // ninguna clase CSS nueva requerida (TKT1 de Nova, CSS dependencies block: reuso puro).
  const _stats = getHistoricoStats();
  const _statsBarHtml = `
    <div class="bl-header-unified" id="historico-header-unified">
      <div class="stats-bar" id="historico-stats-bar">
        <div class="stats-row stats-row--compact">
          <div class="stat-compact-counts">
            <div class="stat-compact-item stat-compact-item--primary">
              <span class="stat-compact-n stat-compact-n--primary">${_stats.total}</span>
              <span class="stat-compact-l">total</span>
            </div>
          </div>
          <div class="stat-compact-sep"></div>
          <span class="stat-type-chip stat-type-chip--static tc-REQ"><span class="tc-count">${_stats.byType.REQ || 0}</span><span class="tc-label">Req</span></span>
          <span class="stat-type-chip stat-type-chip--static tc-TKT"><span class="tc-count">${_stats.byType.TKT || 0}</span><span class="tc-label">Ticket</span></span>
          <div class="stat-compact-sep"></div>
          <span class="stat-pri-chip stat-pri-chip--static pri-high"><span class="spc-n">${_stats.byPriority.high}</span> Alto</span>
          <span class="stat-pri-chip stat-pri-chip--static pri-medium"><span class="spc-n">${_stats.byPriority.medium}</span> Med</span>
          <span class="stat-pri-chip stat-pri-chip--static pri-low"><span class="spc-n">${_stats.byPriority.low}</span> Bajo</span>
          <div class="stat-compact-sep"></div>
          <span class="stat-effort-card stat-effort-card--static"><span class="sec-count">${_stats.byEffort[1] || 0}</span><span class="eff-label">● simple</span></span>
          <span class="stat-effort-card stat-effort-card--static"><span class="sec-count">${_stats.byEffort[2] || 0}</span><span class="eff-label">●● medio</span></span>
          <span class="stat-effort-card stat-effort-card--static"><span class="sec-count">${_stats.byEffort[3] || 0}</span><span class="eff-label">●●● complejo</span></span>
        </div>
      </div>
      <div class="bl-header-sep"></div>
      <div class="bl-toolbar" id="historico-toolbar">
        <div class="bl-toolbar-group">
          <button class="bl-collapse-btn" id="historico-collapse-all-btn" title="Colapsar / expandir todos los sprints" aria-pressed="false">
            <span class="bl-collapse-btn-icon">⊟</span>
            <span class="bl-collapse-btn-label">Colapsar todo</span>
          </button>
        </div>
      </div>
    </div>`;

  // TKT1 (REQ Fixes subtab Backlog Histórico): getHistoricoCount() no contempla
  // sprints cerrados sin ítems asignados — un sprint recién cerrado con 0 ítems archivados
  // producía count:0 y el empty-state genérico se mostraba en lugar de la zona vacía del
  // sprint (que renderHistoricoSection ya sabe renderizar, ver B-202606-066 en
  // locus-backlog-historico.js). hasClosedSprints amplía el gate sin tocar el contrato de
  // getHistoricoCount() ni de renderHistoricoSection.
  const hasClosedSprints = getActiveSprints().some(s => s.status === 'closed');

  // AC-7: sin sprints cerrados y sin ítems historico — renderHistoricoSection no inyecta nada
  // en ese caso (early return interno). AC-4 (T-202606-006): la stats-bar se muestra igual,
  // con conteos en cero — no se oculta cuando Histórico está vacío.
  if (!count && !hasClosedSprints) {
    panel.innerHTML = _statsBarHtml + `
      <div class="empty-state">
        <div class="empty-state-icon">🗄</div>
        <div class="empty-state-title">No hay sprints cerrados aún</div>
      </div>`;
    _initHistoricoToolbar();
    return;
  }

  panel.innerHTML = _statsBarHtml;
  const _listContainer = document.createElement('div');
  panel.appendChild(_listContainer);
  // Cache ya refrescado arriba — el await interno de renderHistoricoSection es no-op (Map ya poblado).
  await renderHistoricoSection(_listContainer);
  _initHistoricoToolbar();
}

// TKT1 (Consolidar wiring de Histórico, REQ sin código real identificable): _initHistoricoSubTab eliminado —
// era wiring manual duplicado (toggle de .tpl-nav-btn/.session-subpanel) sobre el mismo botón
// que switchSubTab() (locus-ui-shell.js) ya activa para los otros 7 sub-tabs. Dos listeners
// async e independientes sobre el mismo click, sin orden garantizado entre sí, eran la causa
// del render no determinístico del panel. renderHistoricoPanel se registra abajo como único
// listener de 'shell:render-historico' — mismo patrón que shell:render-qinc (línea 1494).
window.addEventListener('shell:render-historico', () => { renderHistoricoPanel(); });

// T-202606-092: re-render del panel histórico cuando el backlog cambia y el panel está activo (AC-9)
window.addEventListener('shell:backlog-render-dirty', async () => {
  const panel = document.getElementById('sspanel-historico');
  if (panel && panel.classList.contains('active')) await renderHistoricoPanel();
});

// T-202606-093: T4 · _updateSubtabBadges — actualización reactiva de los cuatro badges
// (backlog, q-backlog, q-disc, histórico) independiente de cuál sub-tab/panel esté activo.
// TKT-C1: badgeIcebox (tpl-badge-icebox, Gen1) → badgeQBacklog (tpl-badge-qbacklog) +
//   badgeQDisc (tpl-badge-qdisc) — reutiliza _isQBacklog/_isQDisc/_zoneStaleness.
// TKT2 (REQ CAEL-01): badgeQinc (tpl-badge-qinc) eliminado — el badge de Q-INC/Incidentes
//   ahora vive en el tab top-level (tab-notif-badge-incidentes, ver locus-notifications.js),
//   no en un sub-tab de Backlog. tpl-badge-qinc ya no existe en el DOM (index.html mod:112).
// Reutiliza exactamente la lógica de conteo de cada render*Panel — no reimplementa
// criterios de staleness/urgencia/archivo, solo el cálculo de badge en aislado.
// AC-1, AC-5, AC-6.
export function _updateSubtabBadges() {
  const badgeBacklog   = document.getElementById('tpl-badge-backlog');
  const badgeQBacklog  = document.getElementById('tpl-badge-qbacklog');
  const badgeQDisc     = document.getElementById('tpl-badge-qdisc');
  const badgeHistorico = document.getElementById('tpl-badge-historico');

  // AC-6: getItems() vacío → todos los badges quedan vacíos, nunca '0'
  const items = getItems();

  // T-202606-004: badge del subtab Backlog — cuenta Rs/Ts activos (pendiente/en-revision)
  // en sprint real (no Q-Backlog/Q-DISC) con status active o scheduled (programado).
  // Sin prefijo de urgencia, '' en vez de '0'.
  if (badgeBacklog) {
    const _isBacklogScope = i => {
      if (i.status !== 'pendiente' && i.status !== 'en-revision') return false;
      // TKT1 (REQ-202607-026 · AC3): items con draft:true excluidos del badge de sprint —
      // consistente con renderSprintItems (locus-backlog-sprints.js), que aplica el mismo
      // filtro sobre la lista real. Sin esto el badge y la lista mostrarían conteos distintos.
      if (i.draft) return false;
      const t = itemKind(i);
      if (t !== 'REQ' && t !== 'TKT') return false;
      const sId = _extractSprintId(i.sprint);
      if (!sId || _isQBacklog(i) || _isQDisc(i)) return false;
      const sprint = getActiveSprints().find(s => s.id === sId);
      if (!sprint) return false;
      return sprint.status === 'active' || sprint.status === 'scheduled';
    };
    const backlogItems = items.filter(_isBacklogScope);
    badgeBacklog.textContent = backlogItems.length ? String(backlogItems.length) : '';
  }

  // TKT-C1: badge Q-Backlog — REQ/TKT sin sprint (pendiente/en-revision), con alerta de staleness.
  // TKT1 REQ2 S'02: _isQBacklogActive reemplaza filtro manual — ya excluye descartado/historico.
  if (badgeQBacklog) {
    const qbItems = items.filter(_isQBacklogActive);
    if (!qbItems.length) {
      badgeQBacklog.textContent = '';
    } else {
      const _alertCount = qbItems.filter(i => _zoneStaleness(i) !== null).length;
      badgeQBacklog.textContent = (_alertCount > 0 ? '⚠ ' : '') + qbItems.length;
    }
  }

  // TKT-C1: badge Q-DISC — DISC activas (discovery), con alerta de staleness.
  // TKT1 REQ2 S'02: _isQDiscActive reemplaza filtro manual — corrige bug: el filtro
  // manual anterior no excluía 'promoted', badge contaba DISCs ya promovidas.
  if (badgeQDisc) {
    const qdItems = items.filter(_isQDiscActive);
    if (!qdItems.length) {
      badgeQDisc.textContent = '';
    } else {
      const _alertCount = qdItems.filter(i => _zoneStaleness(i) !== null).length;
      badgeQDisc.textContent = (_alertCount > 0 ? '⚠ ' : '') + qdItems.length;
    }
  }

  // B-202606-087: AC T-202606-035 (done) — badge de subtab Histórico nunca muestra conteo.
  // getHistoricoCount() se conserva como fuente del panel (renderHistoricoSection) —
  // este call site solo deja de escribirlo en el badge.
  if (badgeHistorico) {
    badgeHistorico.textContent = '';
  }
}

// T-202606-072: listeners shell:* — desacoplamiento de módulos consumidores
// locus-storage.js despacha estos eventos en lugar de llamar directamente a las funciones
// T-202606-093 AC-2: _updateSubtabBadges() como llamada hermana — no depende del guard
// interno de renderBacklogList() (_backlogListDirty, item-editor abierto, defer de blur)
window.addEventListener('shell:backlog-render-dirty', () => { _markBacklogListDirty(); renderBacklogList(); _updateSubtabBadges(); });
window.addEventListener('shell:mark-backlog-dirty',   () => { _markBacklogListDirty(); });
window.addEventListener('shell:render-backlog-list',  () => { _markBacklogListDirty(); renderBacklogList(); renderStats(); _updateSubtabBadges(); }); // B-202606-008: _markBacklogListDirty ausente — guard cortaba render cuando dirty=false
// TKT1 (REQ unificar renderer de #active-filter-chips): listener shell:backlog-filter-changed
// duplicado eliminado — queda solo el de locus-backlog-core.js, que ya invoca
// renderActiveFilterChips() (equivalente funcional de updateClearFilterBtn tras esta consolidación).
// B-202606-009: micro-flash en pill del R padre cuando su status avanza automáticamente
// requestAnimationFrame garantiza que el DOM post-render ya está pintado antes de aplicar la clase
window.addEventListener('shell:backlog-r-auto-advanced', e => {
  const rCode = e.detail && e.detail.rCode;
  if (!rCode) return;
  requestAnimationFrame(() => {
    const pill = document.querySelector(`.bitem-status-chip[data-code="${CSS.escape(rCode)}"]`);
    if (!pill) return;
    pill.classList.remove('item-status-confirmed');
    void pill.offsetWidth; // forzar reflow para reiniciar animación si ya estaba activa
    pill.classList.add('item-status-confirmed');
    pill.addEventListener('animationend', () => pill.classList.remove('item-status-confirmed'), { once: true });
  });
});
