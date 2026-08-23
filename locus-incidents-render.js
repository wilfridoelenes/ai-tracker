// [PP] mod:27 · autor:Rune · 2026-08-23 UTC-6
// Fix INC (hallazgo de Finn en QA del fix anterior, misma sesión): _qiKeydown() — mismo root
// cause que mod:26 pero en el listener de teclado. Enter/Espacio con foco en el botón nativo
// qi-copy-item disparaba trigger.click() sobre el header ancestro (data-qi-action=
// "qi-open-panel") en vez de dejar que el botón generara su propio click — early-return
// agregado antes del check de qi-open-panel. Un solo archivo tocado.

// [PP] mod:26 · autor:Rune · 2026-08-23 UTC-6
// Fix INC (hallazgo de Finn, sesión 2026-08-23): _attachQIncDelegation() reordena el bloque
// qi-copy-item ANTES de qi-open-panel — el botón "Copiar ítem completo" está anidado dentro
// de .qinc-item-header (data-qi-action="qi-open-panel"); con qi-open-panel evaluado primero,
// closest() del click sobre qi-copy-item matcheaba el header ancestro y abría el panel en vez
// de copiar — mismo patrón de conflicto ya resuelto para copy-code (ver comentario en esa
// rama). Sin cambio de lógica interna de ninguno de los dos bloques, solo orden de evaluación.
// Un solo archivo tocado — sin lógica de negocio nueva.

// [PP] mod:25 · autor:Rune · 2026-08-14 21:45 UTC-6
// Fast Track INC (triggered_by: hallazgo de Nova, misma sesión — locus-incidents.css mod:16
// ya entregado): reordena el markup de .qinc-section-header ("Activos"/"Terminados") al
// patrón canónico recién aplicado por Nova sobre .bl-active-header-meta/.bl-done-header-meta/
// .qdisc-status-header-meta (locus-backlog.css mod:156-158) — label solo a la izquierda
// (.qinc-section-title, antes iba dentro de .qinc-section-header-left junto al chevron),
// count+chevron agrupados a la derecha (.qinc-section-header-meta, antes el count vivía
// suelto como hermano directo del header, fuera de cualquier wrapper). Ambos headers
// ("Activos" en renderQIncPanel(), rama _listHtml, y "Terminados" inmediatamente después)
// reciben el mismo cambio — consistencia entre las dos secciones. Impacto lateral: ninguno —
// _toggleQIncSection() y _attachQIncDelegation() targetean .qinc-section-header (closest),
// nunca .qinc-section-header-left directamente, así que el retiro de ese wrapper no rompe
// el toggle de colapso ni la delegación de eventos. .qinc-section-header-left queda sin
// consumidores vivos en este archivo — la única mención restante es histórica (comentario
// de mod:18, sin código real que la use). Sin cambio de contrato exportado — renderQIncPanel()
// y _attachQIncDelegation() mantienen firma. contract_update: n/a (Effort 1, sin efectos
// laterales conocidos fuera de este módulo).

// [PP] mod:24 · autor:Rune · 2026-08-12 09:00 UTC-6
// TKT-202608-263 (parent: REQ-202608-104): listener shell:export-qinc-full agregado al final
// del archivo, mismo patrón que shell:export-qinc — descarga _${prefix}-incidents-full.md vía
// _generateIncidentsFullMd() (locus-incidents-generator.js mod:15). Import ampliado con
// _generateIncidentsFullMd. Sin cambio en renderQIncPanel()/_attachQIncDelegation() — el botón
// nuevo vive en el toolbar estático (#qinc-toolbar, index.html), no en el body generado por
// este módulo.
// [PP] mod:21 · autor:Nova · 2026-08-05 UTC-6
// TKT (Nova, análisis visual Q-INC): renderQIncStats() envuelve su contenido en
// .qinc-stats-bar-inner (CSS depende de esto — ver locus-incidents.css mod:9). Headers de
// sección "Activos"/"Terminados" agregan modificador de color (--activos/--terminados) y
// nodo .qinc-section-count con el conteo — antes el número solo vivía implícito en el
// contenido renderizado debajo, sin badge propio en el header. Sin cambio de lógica de
// filtrado, colapso ni delegación — solo markup de presentación.
// [PP] mod:20 · autor:Rune · 2026-07-27 UTC-6
// TKT-202607-164 (parent REQ-202607-053, depends_on TKT-202607-161): AC2 — el ícono
// .qinc-item-code-chip-icon (nodo agregado en locus-incidents-item.js mod:9) cambia de
// ti-copy a ti-check mientras is-copied está activo, revirtiendo al expirar el timeout —
// mismo ciclo de vida que ya gobernaba is-copied/is-copy-error, sin nodo nuevo que
// resolver aparte del ícono ya presente en el DOM. No-op silencioso si el ícono no está
// presente (defensivo — no debería ocurrir tras mod:9, pero evita null-deref si un chip
// llega sin el nodo por cualquier motivo no previsto).
// [PP] mod:19 · autor:Rune · 2026-07-27 UTC-6
// TKT-202607-161 (parent REQ-202607-053, depends_on TKT-202607-160): rama copy-code de
// _attachQIncDelegation() — antes agregaba is-copied de forma síncrona sin esperar la
// Promise de navigator.clipboard.writeText() y silenciaba cualquier fallo (.catch(() => {})
// vacío), sin AC de error separado del happy path (AC2/AC3 de este TKT). Corregido a
// .then()/.catch() explícito: is-copied solo si el copiado resolvió, is-copy-error si
// falló — mismo patrón ya usado por qi-copy-item en este mismo archivo (ver rama
// qi-copy-item más abajo). CSS de ambos modificadores ya entregado por Nova sobre
// .qinc-item-code-chip (locus-incidents.css, TKT-202607-160) — sin cambio de CSS en este
// TKT. Ver locus-incidents-item.js mod:7 para el otro extremo del fix (clase
// qinc-item-code-chip agregada al nodo). AC4 — impacto lateral: única instancia de
// data-action="copy-code" en el módulo es esta misma rama; sin otro caller que actualizar.

// [PP] mod:18 · autor:Rune · 2026-07-27 UTC-6
// TKT2 (TKT-202607-159, parent REQ-202607-052, depends_on TKT-202607-158): toggle de colapso
// para .qinc-section-header (Activos/Terminados) — click y teclado (Enter/Espacio). AC1: click
// alterna .qinc-section-header--collapsed en el header, .qinc-section-body--collapsed en su
// body (resuelto vía aria-controls), y aria-expanded "true"/"false". AC2/AC3: mismo efecto por
// Enter y Espacio con el header enfocado — Espacio con preventDefault (sin scroll de página).
// AC4: estado default por render — Activos nace aria-expanded="true" sin clase collapsed,
// Terminados nace aria-expanded="false" con la clase — sin persistencia entre renders/reloads,
// mismo criterio ya declarado para .sps-status-group. AC5: el header de Activos no depende del
// gate de _activeItems.length (retirado en mod:14) — sigue togglable con 0 ítems activos, las 3
// columnas vacías se renderizan igual dentro del body colapsable.
// Función nueva _toggleQIncSection(header) — único punto de mutación de estado, compartido
// entre el listener de click y el de keydown, evita duplicar la lógica de toggle. Markup:
// role="button" tabindex="0" + .qinc-section-header-left (wrapper de chevron+título) +
// .qinc-section-chevron (▸, mismo glifo de disclosure del sistema — CSS ya resuelve la rotación)
// — mismo patrón role/tabindex que .qinc-item-header (E-13, _Locus-ux-ref), pero elemento
// distinto: header de sección vs. header de card individual, sin conflicto de target (jerarquía
// plana, un header de sección nunca es ancestro de un trigger de card). CSS consumido sin
// cambio — .qinc-section-header/-chevron/-body ya entregados por Nova en TKT-202607-158
// (locus-incidents.css mod:6, token :focus-visible corregido a var(--accent) en mod:7).
// Impacto lateral: ninguno fuera de este módulo — _isQIncTerminal(), _qincColumnSort(),
// _buildQIncColumnsHtml() y el resto del pipeline de datos no se tocan, solo el markup/eventos
// de los dos headers de sección ya existentes.

// [PP] mod:17 · autor:Rune · 2026-07-27 17:40 UTC-6
// TKT1 (REQ-202607-051, TKT-202607-157, origen DISC-202607-048): "Terminados" no declaraba
// criterio de orden — a diferencia de "Activos" (_qincColumnSort, SLA deadline ascendente por
// columna), _terminalItems se mapeaba directo desde el .filter() sin .sort() propio. Nueva
// función _qincTerminalSort(a,b) — descendente por statusChangedAt (más recientemente cerrado
// primero), declarada inmediatamente después de _qincColumnSort, mismo estilo. Aplicada con un
// único .sort() sobre _terminalItems en renderQIncPanel() — no toca _activeItems,
// _qincColumnSort, _buildQIncColumnsHtml() ni ninguna otra rama de "Activos".
// item.statusChangedAt se lee directo (sin accessor en locus-inc-fields.js) — mismo patrón ya
// vigente para item.slaDeadline en este módulo (_qincItemClasses, línea ~443). Columna agregada
// a tracker_incidents en TKT-202607-122 (bigint, epoch ms) — filas pre-ALTER o transiciones sin
// escritura hidratan statusChangedAt en null/undefined; fallback 0 las ordena al final de la
// lista sin excluirlas del render, mismo criterio "ningún ítem se pierde" ya usado en
// _slaColumnOf(). No se unificó con _qincColumnSort en una utilidad genérica parametrizable —
// _qincColumnSort ya establece el patrón de función dedicada por necesidad de orden; con un solo
// consumidor adicional, una segunda función del mismo tipo es consistente con ese patrón y no
// introduce abstracción sin caso de uso declarado (decisión registrada en el CHECKPOINT de Cael,
// REQ-202607-051).

// [PP] mod:16 · autor:Rune · 2026-07-27 16:20 UTC-6
// Limpieza (Patch, resolución directa — __BR-Core NO DEJAR DEUDA EN SILENCIO, Excepción de
// resolución directa: dueño Rune presente, sin cambio de comportamiento, sin bifurcación de
// founder): 2 comentarios (mod:13 y el listener shell:render-qinc, más abajo) citaban un
// placeholder de código de REQ sin resolver — founder confirmó que ninguno de los dos códigos
// reales existe ni se recuperará (ver Hallazgo fuera de scope, sesión de auditoría de
// referencias sin resolver, 2026-07-27). Placeholders retirados por instrucción directa del
// founder — __BR-Execution §9 prohíbe ese marcador persistido en archivo real; sin código que
// confirmar, la única salida es eliminar la referencia. Resto de cada comentario (contexto
// técnico, alcance, depends_on) se conserva sin cambio — solo pierde la cita de código.

// [PP] mod:15 · autor:Rune · 2026-07-27 15:10 UTC-6
// TKT2 (TKT-202607-156, parent REQ-202607-050, depends_on TKT-202607-155): renderQIncPanel()
// inserta .qinc-section-caption ("Agrupado por prioridad SLA de resolución") entre el header
// "Activos" y _buildQIncColumnsHtml() — incondicional, no depende de _activeItems.length. CSS ya
// entregado por Nova en locus-incidents.css mod:4. Cada .qinc-column-header generado en
// _buildQIncColumnsHtml() agrega aria-label="Prioridad SLA: alta|media|baja" (reusa
// _SLA_COLUMN_LABEL_LC, sin dato nuevo) — copy visible (_SLA_COLUMN_LABEL) sin cambio. "Terminados"
// no recibe caption — sin tocar esa rama. Impacto lateral: ninguno — _slaColumnOf(), _qincColumnSort()
// y el split Activos/Terminados no se tocan.

// [PP] mod:14 · autor:Rune · 2026-07-27 UTC-6
// Fast Track INC (ref_id CAEL-0727-01, triggered_by: auditoría visual del founder — captura de
// pantalla del render Q-INC, 2026-07-27): la sección "Activos" desaparecía por completo
// (header + columnas) cuando `_activeItems.length === 0` — a diferencia de "Terminados", que
// siempre se renderiza y muestra su propio empty-state (mod:8). El gate `if (_activeItems.length)`
// suprimía toda la sección en vez de dejar que cada columna mostrara su empty-state individual
// (`.qinc-column-empty`, ya resuelto en `_buildQIncColumnsHtml()` desde mod:11 — una columna sin
// ítems ya renderiza "Sin incidentes de prioridad alta/media/baja", el problema era que el
// contenedor completo nunca llegaba a montarse). Fix: se retira el gate — "Activos" se renderiza
// siempre, igual que "Terminados"; `_buildQIncColumnsHtml([])` ya produce las 3 columnas vacías
// con su empty-state propio sin necesitar markup nuevo. Un solo archivo, sin lógica nueva
// (reutiliza código ya existente), sla_priority: low — Fast Track (__BR-Core §6).

// [PP] mod:13 · autor:Rune · 2026-07-27 UTC-6
// TKT2 (código histórico no recuperable — founder confirmó no perseguirlo, 2026-07-27;
// depends_on TKT1 mismo REQ — .qinc-empty-success):
// reemplaza el markup del empty-state "sin incidentes activos" — antes emoji 🚨 genérico, ahora
// ícono circular de estado saludable (clase .qinc-empty-success, Nova/TKT1 mismo REQ) + copy
// alineado a mockup del founder ("Sin incidentes activos" / "Q-INC está en cero — no hay INC,
// PRB ni CHG esperando resolución."). Condición de disparo sin cambio — sigue siendo
// `!_displayable.length` (línea ~375, sin modificar). No toca el empty-state de "sin proyecto
// seleccionado" (línea ~350-358, ícono 📁) ni renderQIncStats() — ambos fuera de scope del TKT.

// [PP] mod:12 · autor:Rune · 2026-07-27 UTC-6
// Fast Track INC-202607-063 (triggered_by: auditoría de Finn — render Q-INC): umbral obsoleto
// en renderQIncStats() — `_qiTypes.size < 4` sobrevivió al retiro de KE (mod:10, infra_version
// 51). El array de tipos filtrables tiene 3 entradas (INC/PRB/CHG) desde entonces —
// _qiTypes.size nunca supera 3, la condición era siempre verdadera y el botón "✕ Mostrar todos
// los tipos" quedaba visible permanentemente aunque ningún filtro de tipo estuviera activo.
// Corregido a `_qiTypes.size < 3`. Un solo archivo, sin lógica nueva, sla_priority: low —
// Fast Track (__BR-Core §6).

// [PP] mod:11 · autor:Rune · 2026-07-24 UTC-6
// TKT1 (REQ CAEL-0724-14/TKT-202607-088, ref_id CAEL-0724-15): sección "Activos" de
// renderQIncPanel() reemplaza el grid único por 3 columnas de prioridad SLA (alta/media/baja).
// Funciones nuevas a nivel de módulo: _SLA_COLUMNS/_SLA_COLUMN_LABEL/_SLA_COLUMN_LABEL_LC
// (constantes de orden y copy) · _slaColumnOf(item) (agrupa por incSlaPriority, fallback
// 'medium' si null o valor no reconocido — ningún ítem se pierde) · _qincColumnSort(a,b)
// (orden ascendente por slaDeadline, Infinity como sentinel para ítems sin deadline — quedan al
// final de su columna) · _buildQIncColumnsHtml(activeItems) (arma el markup: 3 divs
// data-qi-column="high|medium|low", header "[Label] · [conteo]", empty-state propio por
// columna vacía sin colapsarla). _buildQIncColumnsHtml vive a nivel de módulo — usa
// buildQIncItem() (import directo) en vez de _buildQIncItemHtml (wrapper local a
// renderQIncPanel(), fuera de su alcance). Sección "Terminados" sin cambio — sigue en grid
// único. _isQIncTerminal() y el split _activeItems/_terminalItems sin cambio de firma — la
// agrupación es una capa de presentación posterior sobre _activeItems ya resuelto. Sin caller
// externo de renderQIncPanel()/_isQIncTerminal() verificado por grep contra el repo completo —
// ambas funciones consumidas únicamente dentro de este módulo.

// [PP] mod:10 · autor:Rune · 2026-07-24 UTC-6
// TKT1 (REQ CAEL-0724-11, ref_id CAEL-0724-12): retiro final de 'KE' — inalcanzable desde
// _GEN2_TYPES (locus-backlog-core.js mod:131, fusión KE→PRB.root_cause_confirmed, infra_version
// 51). _isQIncTerminal() pierde la rama `k === 'KE'` — todo lo que no es CHG cae directo al
// criterio INC/PRB (`s === 'closed'`), sin evaluar un tipo que itemKind() nunca produce.
// _countByType y el array de chips de renderQIncStats() pierden la clave/entrada KE — el chip de
// filtro por tipo KE deja de renderizarse (nunca tenía ítems que contar). Copy del empty-state de
// "Terminados" corregido: "Los INC/PRB en closed, KE en resolved y CHG en done aparecerán aquí."
// mencionaba un tipo inexistente al usuario — ahora "Los INC/PRB en closed y CHG en done
// aparecerán aquí." Sin cambio de comportamiento para INC/PRB/CHG reales — la rama KE era código
// muerto, nunca alcanzado.

// [PP] mod:9 · autor:Rune · 2026-07-23 UTC-6
// TKT2 (REQ CAEL-0723-05, ref_id CAEL-0723-06): cierra el Hallazgo fuera de scope declarado en
// mod:8 — _activeForCount (renderQIncStats) migra de _QINC_ACTIVE_STATUSES a _isQIncTerminal,
// mismo criterio que ya usa el body (renderQIncPanel, TKT1/mod:8). Antes un INC/PRB 'resolved'
// aparecía bajo "Activos" en el body pero no sumaba en los chips de tipo/prioridad del
// stats-bar — desfase entre lo mostrado y lo contado. _QINC_ACTIVE_STATUSES retirada — sin
// consumidores tras este patch (__BR-Execution §2, sin retrocompatibilidad). _displayable de
// renderQIncStats sin cambio — sigue excluyendo closed/descartado antes de llegar a
// _activeForCount; redundante con _isQIncTerminal para 'closed' pero inofensivo, no se toca para
// minimizar superficie del TKT.

// [PP] mod:8 · autor:Rune · 2026-07-23 UTC-6
// TKT1 (REQ CAEL-0723-03, ref_id CAEL-0723-04): "Terminados" reemplaza "Resueltos" — antes
// mezclaba dos conceptos: 'closed' (INC/PRB) nunca llegaba a renderizarse (excluido en
// _displayable, línea de _qincEffectiveStatus !== 'closed'), y "Resueltos" en realidad agrupaba
// todo lo que no fuera _QINC_ACTIVE_STATUSES — incluyendo 'resolved' de INC/PRB, que NO es
// terminal (BR-Core §6: closed lo es, resolved no). Nueva función _isQIncTerminal(item) clasifica
// por tipo: closed (INC/PRB) · resolved (KE, su único terminal — no tiene status closed propio) ·
// done (CHG, vocabulario Scrum). 'resolved' de INC/PRB ahora cae en "Activos" — sigue pendiente
// de verificación de Finn, igual criterio que ya separa Activos/Terminados en Q-Backlog
// (_pp-context §5): "Activos" = requiere acción de algún rol. _displayable ya no excluye
// 'closed' — ahora fluye hasta el split y aterriza en "Terminados". "Terminados" se renderiza
// siempre (header + body), a diferencia de "Activos" que sigue omitiéndose si vacío — con empty
// state propio cuando _terminalItems.length===0 (mismo patrón .empty-state ya usado en este
// archivo, líneas 205-210/228-232/264). renderQIncStats()/_activeForCount sin cambio — sigue
// contando solo _QINC_ACTIVE_STATUSES.
//
// Hallazgo fuera de scope (detectado en esta sesión, no resuelto — fuera de los AC aprobados):
// tras este TKT, un INC 'resolved' aparece en el body bajo "Activos" pero NO suma en los chips
// de tipo/prioridad del stats-bar (_activeForCount solo cuenta _QINC_ACTIVE_STATUSES, que no
// incluye 'resolved') — inconsistencia visual entre lo que el body muestra como activo y lo que
// el stats-bar cuenta como activo. Acción sugerida: pasar a Cael (PO+BA) — evaluar si
// _activeForCount debe adoptar el mismo criterio _isQIncTerminal en un REQ separado.

// [PP] mod:7 · autor:Rune · 2026-07-23 UTC-6
// TKT2 (REQ CAEL-0722-01, ref_id CAEL-0722-03): clasificación activo/resuelto de Q-INC
// corregida vía _qincEffectiveStatus() — dispatch por tipo (item.status para CHG,
// incIncidentStatus() para INC/PRB/KE), reemplaza el uso directo de i.status/i.incidentStatus
// en _displayable y en el split _activeItems/_resolvedItems. _QINC_ACTIVE_STATUSES amplía
// vocabulario CHG (pendiente/en-revision) y KE (active) — antes solo cubría vocabulario INC.

// [PP] mod:6 · autor:Rune · 2026-07-23 UTC-6
// Hallazgo fuera de scope (Nova, auditoría _Locus-css-ref mod:109): renderQIncStats() emitía
// tc-${t.toLowerCase()} (tc-inc/tc-prb/tc-ke/tc-chg) — CSS solo define el compuesto en
// mayúsculas (.stat-type-chip.tc-INC/.tc-PRB/.tc-KE/.tc-CHG, locus-backlog.css ~L610-690).
// Selector de clase CSS es case-sensitive — nunca matcheaba. Corregido a tc-${t} (t ya llega
// en mayúsculas desde el array literal ['INC','PRB','KE','CHG']). Sin cambio de firma, sin
// cambio de markup salvo el casing de esta clase — data-qi-type y el resto de atributos no se
// tocan. Resuelto en sesión (Patch, sin bifurcación de founder, dueño Rune ya presente en el
// ciclo auto-orquestado) — ver criterio de resolución directa, __BR-Core.

// [PP] mod:5 · autor:Rune · 2026-07-23 UTC-6
// TKT3 (REQ split-itil-item, ref_id CAEL-0723-02 · consumidor externo): import de
// buildQIncItem actualizado de locus-backlog-item.js a locus-incidents-item.js — cierra el
// consumidor externo que TKT2 dejó pendiente vía puente de re-export temporal (ver
// locus-backlog-item.js mod:133). Sin cambio de comportamiento — misma función, misma firma,
// solo cambia el módulo de origen. Los comentarios históricos de mods anteriores (2026-07-18 y
// anteriores) que referencian "locus-backlog-item.js" para buildQIncItem se preservan sin
// editar — describen el estado real del archivo en la fecha en que se escribieron, mismo
// criterio de preservación histórica ya aplicado en el ecosistema (ver _pp-context §6, nota de
// locus-backlog-historico.js).

// [PP] mod:4 · autor:Rune · 2026-07-22 UTC-6
// TKT-A/TKT-B (REQ CAEL-0722-01, ref_id CAEL-0722-05/06): _attachQIncDelegation() gana
// handler qi-copy-item (botón "Copiar ítem" de buildQIncItem(), locus-backlog-item.js) —
// copia el bloque completo del ítem vía copyIncidentItemMd() (locus-incidents-generator.js),
// con feedback is-copied/is-copy-error. qi-open-panel sin cambio de código — ahora también
// recibido desde .qinc-item-meta-secondary (nueva), mismo selector data-qi-action.

// [PP] mod:3 · autor:Rune · 2026-07-22 UTC-6
// TKT (REQ CAEL-0722-01): renderQIncStats() ahora cuenta solo ítems activos
// (_QINC_ACTIVE_STATUSES) en _countByType/_countByPri — un ítem resolved deja de sumar en los
// chips de tipo/prioridad. renderQIncPanel() y filteredQInc sin cambio — el filtro por chip
// sigue mostrando/filtrando ambas secciones (Activos+Resueltos) igual que antes.
// [PP] mod:2 · autor:Rune · 2026-07-21 UTC-6
// TKT3 (parent: REQ CAEL-0721-07): shell:export-qinc ahora marca el snapshot de export vía
// markIncidentsExported(_countClosedIncidents()) — único call site que lo hace en todo el
// ecosistema. generateDocuments() de locus-map-generator.js (cierre de sprint) sigue llamando
// solo _generateIncidentsMd() sin tocar este listener — snapshot no se altera al cerrar sprint.

// [PP] mod:1 · autor:Rune · 2026-07-20 23:40 UTC-6
// TKT1 (REQ CAEL-0720-03 · Separar render de rama Reactiva a módulo propio): módulo nuevo,
// exclusivo del render de Q-INC (INC/PRB/KE/CHG) — extraído íntegro de locus-backlog-render.js
// (líneas 1064-1327 de mod:93), sin cambio de comportamiento. Mismo criterio arquitectónico ya
// aplicado a generación de contenido (locus-incidents-generator.js, separado de
// locus-backlog-generator.js): la rama Reactiva vive en su propio módulo, no en uno cuyo nombre
// solo declara la rama Planeada.
//
// Contiene: _QINC_ACTIVE_STATUSES · renderQIncPanel() · _attachQIncDelegation() (privada) ·
// listener shell:render-qinc · listener shell:backlog-render-dirty (variante filtrada por
// getCurrentTab()==='incidentes').
//
// Preservado sin cambio — historial de incidentes previos sobre este bloque exacto:
// (1) orden de checks en _attachQIncDelegation: copy-code se evalúa ANTES que qi-open-panel
//     (copy-code vive anidado dentro de .qinc-item-header) — invertir el orden rompe el copiado.
// (2) import de openItemPanel es dinámico (import('./locus-backlog-panel.js')) — evita ciclo
//     ESM ya documentado en locus-ui-shell.js. Un import estático reintroduce el ciclo.
// (3) SLA_RIESGO_WINDOW_MS importada de locus-inc-fields.js (TKT previo, deuda de REQ
//     CAEL-0720-01) — no se reintroduce como const local.
//
// no_incluye (TKT1): no toca locus-inc-fields.js ni locus-incidents-generator.js · no cambia
// el orden interno de _attachQIncDelegation · no elimina el bloque original de
// locus-backlog-render.js (TKT2, mismo REQ).
//
// Dependencias: locus-backlog-core.js · locus-backlog-item.js · locus-backlog-panel.js (dinámico)
// · locus-incidents-generator.js · locus-inc-fields.js · locus-storage.js · locus-ui-shell.js

import {
  getIncidents, isQIncItem, itemKind,
  _nsGetTypes, _nsGetPriority, _nsGetQuery, _nsSetQuery, _nsToggleType, _nsTogglePriority, _nsReset
} from './locus-backlog-core.js';

import { buildQIncItem } from './locus-incidents-item.js';

import { incSlaPriority, incIncidentStatus, SLA_RIESGO_WINDOW_MS } from './locus-inc-fields.js';

import { _generateIncidentsMd, _generateIncidentsFullMd, _countClosedIncidents, copyIncidentItemMd } from './locus-incidents-generator.js'; // TKT-B (REQ CAEL-0722-01, ref_id CAEL-0722-06): copyIncidentItemMd — botón "Copiar ítem" en _attachQIncDelegation. TKT-202608-263 (REQ-202608-104): _generateIncidentsFullMd — listener shell:export-qinc-full

import { _getActiveProjectFilter, _docPrefix, markIncidentsExported } from './locus-storage.js';

import { getCurrentTab } from './locus-ui-shell.js';

// TKT2 (REQ CAEL-0722-01, ref_id CAEL-0722-03): status efectivo por tipo — CHG usa item.status
// (vocabulario Scrum, __BR-Ecosystem §4b; incidentStatus queda null por diseño en _buildItilItem
// para CHG, incluso recién parseado sin round-trip por Supabase). INC/PRB/KE usan
// incIncidentStatus(item) (camelCase en memoria o snake_case hidratado). Mismo dispatch que
// _isActiveIncident() (locus-incidents-generator.js) — no se reutiliza esa función directamente
// porque su criterio de "activo" difiere del corte activo/resuelto de este panel (ej. PRB/INC en
// 'resolved' cuentan como "activo" en _isActiveIncident, pero este panel los separa a "Resueltos" —
// dos necesidades de clasificación distintas sobre el mismo dato, no un desacuerdo de bug).
function _qincEffectiveStatus(item) {
  return itemKind(item) === 'CHG' ? (item.status || null) : incIncidentStatus(item);
}

// Estados ITIL "activos" — orden de grupo primero. resolved/closed van al fondo.
// TKT2: agrega vocabulario CHG (pendiente/en-revision) y KE (active) — antes solo cubría
// vocabulario INC, dejando todo CHG y KE siempre clasificado como "Resueltos" sin importar
// su status real.
// TKT2 (REQ CAEL-0723-05): _QINC_ACTIVE_STATUSES retirada — sin consumidores desde que
// _activeForCount migró a _isQIncTerminal (mismo mod:9). Su único otro uso, el split
// Activos/Terminados de renderQIncPanel(), ya había migrado a _isQIncTerminal en TKT1 (mod:8).
// Vocabulario ITIL activo por tipo — si se necesita de nuevo, vive implícito en _isQIncTerminal
// (todo lo que no es terminal) en vez de una lista enumerada aparte.

// TKT1 (REQ CAEL-0723-03): terminal real por tipo — a diferencia de una lista enumerada de
// estados "activos", este criterio distingue vocabulario porque "terminal" no es el mismo status
// para los cuatro tipos: closed (INC/PRB, __BR-Core §6) · resolved (KE — único terminal, KE no
// tiene status closed propio) · done (CHG — vocabulario Scrum, __BR-Ecosystem §4b). 'resolved'
// de INC/PRB NO es terminal — pendiente de verificación de Finn.
function _isQIncTerminal(item) {
  const k = itemKind(item);
  const s = _qincEffectiveStatus(item);
  if (k === 'CHG') return s === 'done';
  return s === 'closed'; // INC / PRB
}

// TKT2 (REQ CAEL-0720-05): stats-bar de Q-INC extraído a función propia — mismo criterio que
// renderStats() (locus-backlog-core.js) para #stats-bar de Backlog. Llena #qinc-stats-bar
// (estático en index.html) de forma independiente del cuerpo (#qinc-panel-body). AC: chips
// muestran 0 sin ocultarse cuando no hay ítems activos — sin early-return por conteo, solo por
// ausencia de proyecto.
export function renderQIncStats() {
  const statsEl = document.getElementById('qinc-stats-bar');
  if (!statsEl) return;

  if (!_getActiveProjectFilter()) { statsEl.innerHTML = ''; return; }

  // Ítems ITIL del proyecto activo — misma fuente que renderQIncPanel().
  const allQInc = getIncidents().filter(isQIncItem);

  // Namespace propio 'qinc' — aislado del state global de Backlog
  const _qiTypes    = _nsGetTypes('qinc');
  const _qiPriority = _nsGetPriority('qinc');
  const _qiQuery     = (_nsGetQuery('qinc') || '').trim().toLowerCase();

  const _countByType = { INC: 0, PRB: 0, CHG: 0 };
  const _countByPri  = { high: 0, medium: 0, low: 0 };
  const _displayable = allQInc.filter(i => _qincEffectiveStatus(i) !== 'descartado' && _qincEffectiveStatus(i) !== 'closed');
  // TKT2 (REQ CAEL-0723-05): _activeForCount ahora usa _isQIncTerminal — mismo criterio que
  // separa Activos/Terminados en renderQIncPanel() (TKT1, mod:8). Antes usaba
  // _QINC_ACTIVE_STATUSES, que no incluía 'resolved' (INC/PRB) — un INC resolved aparecía bajo
  // "Activos" en el body pero no sumaba en los chips de tipo/prioridad. _QINC_ACTIVE_STATUSES
  // queda sin consumidores tras este cambio — retirada (sin retrocompatibilidad, __BR-Execution §2).
  const _activeForCount = _displayable.filter(i => !_isQIncTerminal(i));
  _activeForCount.forEach(i => {
    const t = itemKind(i);
    if (t && _countByType[t] !== undefined) _countByType[t]++;
    // TKT1 (REQ-centralizar-accesores-itil): mismo motivo que el badge arriba.
    const p = incSlaPriority(i);
    if (p === 'high') _countByPri.high++;
    else if (p === 'low') _countByPri.low++;
    else _countByPri.medium++;
  });

  // TKT2 AC (Nova, REQ CAEL-0720-05): chips muestran 0 sin ocultarse — sin early-return por
  // conteo. _countByType/_countByPri ya quedan en 0 cuando _displayable está vacío.
  // TKT (Nova, análisis visual Q-INC): contenido envuelto en .qinc-stats-bar-inner — el
  // shell externo (#qinc-stats-bar) pasa a tener identidad de header propia vía CSS, sin
  // tocar el layout flex original de esta fila.
  statsEl.innerHTML = `
    <div class="qinc-stats-bar-inner">
      <div class="qinc-stats-types">
        ${_qiTypes.size < 3 ? `<button class="stat-type-chip stat-type-chip--all" data-qi-action="qi-clear-types" title="Mostrar todos los tipos">✕</button>` : ''}
        ${[['INC','INC'],['PRB','PRB'],['CHG','CHG']].map(([t, label]) =>
          `<button class="stat-type-chip tc-${t}${_qiTypes.has(t) ? ' active' : ''}" data-qi-action="qi-type" data-qi-type="${t}" title="Filtrar por tipo ${t}">\
<span class="tc-count">${_countByType[t]}</span><span class="tc-label">${label}</span></button>`
        ).join('')}
      </div>
      <div class="qinc-stats-priority">
        <button class="stat-pri-chip pri-high${_qiPriority.has('high') ? ' active' : ''}" data-qi-action="qi-priority" data-qi-priority="high" title="Filtrar SLA alta"><span class="spc-n">${_countByPri.high}</span> Alto</button>
        <button class="stat-pri-chip pri-medium${_qiPriority.has('medium') ? ' active' : ''}" data-qi-action="qi-priority" data-qi-priority="medium" title="Filtrar SLA media"><span class="spc-n">${_countByPri.medium}</span> Med</button>
        <button class="stat-pri-chip pri-low${_qiPriority.has('low') ? ' active' : ''}" data-qi-action="qi-priority" data-qi-priority="low" title="Filtrar SLA baja"><span class="spc-n">${_countByPri.low}</span> Bajo</button>
      </div>
      <input class="qinc-search-input" type="search" placeholder="Buscar en Q-INC…" value="${_qiQuery.replace(/"/g,'&quot;')}" data-qi-action="qi-search" aria-label="Buscar en Q-INC">
    </div>
  `;

  // TKT2: delegación propia sobre #qinc-stats-bar — separada de _attachQIncDelegation (body),
  // porque el stats-bar ahora vive fuera de #qinc-panel-body. Flag previene acumulación entre
  // re-renders, mismo criterio que renderStats() de Backlog.
  if (!statsEl._qiStatsDelegationAttached) {
    statsEl._qiStatsDelegationAttached = true;
    statsEl.addEventListener('click', function _qiStatsClick(e) {
      const el = e.target.closest('[data-qi-action]');
      if (!el) return;
      const act = el.dataset.qiAction;
      if (act === 'qi-clear-types') {
        _nsReset('qinc');
        renderQIncPanel();
      } else if (act === 'qi-type') {
        _nsToggleType('qinc', el.dataset.qiType);
        renderQIncPanel();
      } else if (act === 'qi-priority') {
        _nsTogglePriority('qinc', el.dataset.qiPriority);
        renderQIncPanel();
      }
    });
    statsEl.addEventListener('input', function _qiStatsInput(e) {
      const input = e.target.closest('[data-qi-action="qi-search"]');
      if (!input) return;
      clearTimeout(statsEl._qiSearchTimer);
      statsEl._qiSearchTimer = setTimeout(() => {
        _nsSetQuery('qinc', input.value);
        renderQIncPanel();
      }, 200);
    });
  }
}

// TKT1 (REQ CAEL-0724-14, ref_id CAEL-0724-15): columnas de "Activos" por prioridad SLA —
// reemplaza el grid único anterior. _SLA_COLUMNS fija el orden de render (alta→media→baja),
// _SLA_COLUMN_LABEL es el texto de header (capitalizado) y _SLA_COLUMN_LABEL_LC el texto de
// empty-state (minúscula, concordancia gramatical "de prioridad alta/media/baja"). No toca
// _isQIncTerminal ni el split Activos/Terminados — opera solo sobre el array _activeItems ya
// resuelto por ese criterio, agregando una capa de presentación posterior.
const _SLA_COLUMNS = ['high', 'medium', 'low'];
const _SLA_COLUMN_LABEL = { high: 'Alta', medium: 'Media', low: 'Baja' };
const _SLA_COLUMN_LABEL_LC = { high: 'alta', medium: 'media', low: 'baja' };

// incSlaPriority(item) puede devolver null (sin campo) o un valor no reconocido — ambos casos
// caen en 'medium' por defecto, AC explícito del TKT: ningún ítem se pierde silenciosamente.
function _slaColumnOf(item) {
  const p = incSlaPriority(item);
  return _SLA_COLUMNS.includes(p) ? p : 'medium';
}

// Orden ascendente por slaDeadline dentro de cada columna — más urgente primero. Ítems sin
// slaDeadline numérico (PRB/CHG sin countdown) se ordenan al final de su columna via Infinity,
// sin necesitar rama condicional aparte para el caso "ninguno de los dos tiene deadline".
function _qincColumnSort(a, b) {
  const da = typeof a.slaDeadline === 'number' ? a.slaDeadline : Infinity;
  const db = typeof b.slaDeadline === 'number' ? b.slaDeadline : Infinity;
  return da - db;
}

// TKT1 (REQ-202607-051, TKT-202607-157, origen DISC-202607-048): orden de "Terminados" —
// descendente por statusChangedAt, el ítem más recientemente cerrado primero. Ítems sin
// statusChangedAt numérico (filas pre-ALTER de tracker_incidents, columna agregada en
// TKT-202607-122, o transiciones sin escritura del campo) caen al final via fallback 0 — mismo
// criterio "ningún ítem se pierde" que ya usa _slaColumnOf(). No toca _qincColumnSort ni el
// orden de "Activos".
function _qincTerminalSort(a, b) {
  const ta = typeof a.statusChangedAt === 'number' ? a.statusChangedAt : 0;
  const tb = typeof b.statusChangedAt === 'number' ? b.statusChangedAt : 0;
  return tb - ta;
}

// Construye el markup de las 3 columnas de prioridad para la sección "Activos". Cada columna
// declara data-qi-column="high|medium|low" para que el CSS de Nova (TKT2, mismo REQ) la
// seleccione. Header con conteo ("Alta · 2") y empty-state propio por columna cuando no tiene
// ítems — sin colapsar ni ocultar la columna vacía (AC de coherencia del REQ).
function _buildQIncColumnsHtml(activeItems) {
  const groups = { high: [], medium: [], low: [] };
  activeItems.forEach(item => { groups[_slaColumnOf(item)].push(item); });
  _SLA_COLUMNS.forEach(col => groups[col].sort(_qincColumnSort));

  let h = '<div class="qinc-columns">';
  _SLA_COLUMNS.forEach(col => {
    const items = groups[col];
    h += `<div class="qinc-column" data-qi-column="${col}">`;
    h += `<div class="qinc-column-header" aria-label="Prioridad SLA: ${_SLA_COLUMN_LABEL_LC[col]}">${_SLA_COLUMN_LABEL[col]} · ${items.length}</div>`;
    if (items.length) {
      h += '<div class="qinc-column-body">';
      // buildQIncItem() directo — _buildQIncItemHtml es un wrapper local a renderQIncPanel(),
      // fuera de alcance para esta función de nivel de módulo. Mismo import ya usado arriba.
      items.forEach(item => { h += buildQIncItem(item); });
      h += '</div>';
    } else {
      h += `<div class="empty-state qinc-column-empty">
              <div class="empty-state-title">Sin incidentes de prioridad ${_SLA_COLUMN_LABEL_LC[col]}</div>
            </div>`;
    }
    h += '</div>';
  });
  h += '</div>';
  return h;
}

// TKT2 (REQ CAEL-0720-05): renderQIncPanel() ahora gestiona exclusivamente el cuerpo
// (#qinc-panel-body) — lista de ítems o empty-state, nunca ambos, nunca ninguno (AC Nova).
// El stats-bar (#qinc-stats-bar, estático) se renderiza siempre vía renderQIncStats(),
// independiente del conteo de ítems activos.
export function renderQIncPanel() {
  const body = document.getElementById('qinc-panel-body');
  if (!body) return;

  renderQIncStats();

  if (!_getActiveProjectFilter()) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Selecciona un proyecto</div>
        <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
      </div>`;
    return;
  }

  // Ítems ITIL del proyecto activo — excluir descartados del conteo y del render
  // [tmp:tkt-isqinc-unify]: _isQIncItem local eliminada — usa isQIncItem() importada desde locus-backlog-core.js.
  const allQInc = getIncidents().filter(isQIncItem);

  // Namespace propio 'qinc' — aislado del state global de Backlog
  const _qiTypes    = _nsGetTypes('qinc');
  const _qiPriority = _nsGetPriority('qinc');
  const _qiQuery     = (_nsGetQuery('qinc') || '').trim().toLowerCase();
  // TKT1 (REQ CAEL-0723-03): ya no excluye 'closed' — antes moría aquí sin llegar nunca al
  // render (ver mod:8, header del archivo). Sigue excluyendo 'descartado'.
  const _displayable = allQInc.filter(i => _qincEffectiveStatus(i) !== 'descartado');

  // TKT2 (mod:1, preexistente): único empty-state de "sin activos" — antes había dos ramas
  // idénticas (allQInc.length===0 y _displayable.length===0). _displayable ya cubre ambos casos: si
  // allQInc está vacío, _displayable también lo está.
  if (!_displayable.length) {
    body.innerHTML = `
      <div class="empty-state qinc-empty-success">
        <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" stroke-width="2"/></svg></div>
        <div class="empty-state-title">Sin incidentes activos</div>
        <div class="empty-state-hint">Q-INC está en cero — no hay INC, PRB ni CHG esperando resolución.</div>
      </div>`;
    return;
  }

  const _matchesQiSearch = _qiQuery
    ? i => i.code.toLowerCase().includes(_qiQuery) || (i.title || '').toLowerCase().includes(_qiQuery) || (i.area || '').toLowerCase().includes(_qiQuery)
    : () => true;
  const filteredQInc = _displayable.filter(i => {
    const t = itemKind(i);
    const typeOk = t ? _qiTypes.has(t) : true;
    // TKT1 (REQ-centralizar-accesores-itil): mismo motivo que las otras 3 ocurrencias.
    const priOk  = _qiPriority.size === 0 || _qiPriority.has(incSlaPriority(i));
    return typeOk && priOk && _matchesQiSearch(i);
  });

  const _now = Date.now();
  function _qincItemClasses(item) {
    const classes = [];
    if (itemKind(item) === 'INC' && typeof item.slaDeadline === 'number') {
      if (item.slaDeadline < _now) classes.push('qinc-item--sla-vencido');
      else if (item.slaDeadline < _now + SLA_RIESGO_WINDOW_MS) classes.push('qinc-item--sla-riesgo');
    }
    return classes.join(' ');
  }

  function _buildQIncItemHtml(item) {
    // TKT-B2b: buildQIncItem reemplaza buildBacklogItem — modelo ITIL propio, sin item.status/sprint/parentId.
    // Clases SLA calculadas internamente por buildQIncItem — _qincItemClasses ya no aplica aquí.
    return buildQIncItem(item);
  }

  const _listHtml = filteredQInc.length === 0
    ? `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Sin resultados</div><div class="empty-state-hint">Ningún ítem coincide con el filtro activo.</div></div>`
    : (() => {
        const _activeItems   = filteredQInc.filter(i => !_isQIncTerminal(i));
        // TKT1 (REQ-202607-051, TKT-202607-157): .sort(_qincTerminalSort) agregado — antes
        // _terminalItems se mapeaba en el orden de filteredQInc sin criterio propio (DISC-202607-048).
        const _terminalItems = filteredQInc.filter(i => _isQIncTerminal(i)).sort(_qincTerminalSort);
        let h = '';
        // Fix INC (ref_id CAEL-0727-01, mod:14): "Activos" ahora se renderiza siempre — mismo
        // criterio de simetría que "Terminados" ya aplicaba desde mod:8. Antes el gate
        // `if (_activeItems.length)` ocultaba header + columnas completos cuando no había
        // ítems activos; ahora _buildQIncColumnsHtml([]) resuelve el caso vacío mostrando las
        // 3 columnas con su empty-state propio (.qinc-column-empty, sin markup nuevo).
        // TKT2 (TKT-202607-159, parent REQ-202607-052, depends_on TKT-202607-158): headers de
        // sección ahora son triggers de toggle — role="button" tabindex="0" (mismo patrón que
        // .qinc-item-header, E-13 de _Locus-ux-ref), aria-expanded/aria-controls para lectores
        // de pantalla, chevron .qinc-section-chevron (▸, mismo glifo que el resto del sistema
        // usa para disclosure — CSS ya resuelve la rotación vía .qinc-section-header--collapsed).
        // Estado default por render (AC4): "Activos" nace expandido, "Terminados" nace colapsado
        // — sin persistencia entre renders ni recargas, mismo criterio ya declarado para
        // .sps-status-group (_Locus-css-ref, "estado en memoria, resetea a expandido en reload").
        h += `<div class="qinc-section"><div class="qinc-section-header qinc-section-header--activos" role="button" tabindex="0" aria-expanded="true" aria-controls="qinc-active-body" id="qinc-active-header"><span class="qinc-section-title">Activos</span><div class="qinc-section-header-meta"><span class="qinc-section-count">${_activeItems.length}</span><svg class="ti-svg chevron" aria-hidden="true"><use href="#ti-chevron-right"></use></svg></div></div>`;
        // TKT2 (TKT-202607-156, parent REQ-202607-050, depends_on TKT-202607-155): caption fijo,
        // sin condicionar al conteo de _activeItems — AC de coherencia del REQ exige que se
        // renderice igual con las 3 columnas vacías. No se agrega a "Terminados" (más abajo).
        h += '<div id="qinc-active-body">';
        h += '<div class="qinc-section-caption">Agrupado por prioridad SLA de resolución</div>';
        h += _buildQIncColumnsHtml(_activeItems);
        h += '</div>';
        h += '</div>';
        // filteredQInc.length>0 está garantizado en este punto (branch de "Sin resultados" ya
        // se resolvió arriba), así que _activeItems y _terminalItems nunca están vacíos los dos
        // a la vez — pero cada uno individualmente sí, y ambas secciones ya lo cubren.
        h += `<div class="qinc-section"><div class="qinc-section-header qinc-section-header--terminados qinc-section-header--collapsed" role="button" tabindex="0" aria-expanded="false" aria-controls="qinc-terminal-body" id="qinc-terminal-header"><span class="qinc-section-title">Terminados</span><div class="qinc-section-header-meta"><span class="qinc-section-count">${_terminalItems.length}</span><svg class="ti-svg chevron" aria-hidden="true"><use href="#ti-chevron-right"></use></svg></div></div>`;
        h += '<div id="qinc-terminal-body" class="qinc-section-body--collapsed">';
        h += _terminalItems.length
          ? `<div class="items-grid">${_terminalItems.map(item => _buildQIncItemHtml(item)).join('')}</div>`
          : `<div class="empty-state">
              <div class="empty-state-icon">✔</div>
              <div class="empty-state-title">Sin ítems terminados aún</div>
              <div class="empty-state-hint">Los INC/PRB en closed y CHG en done aparecerán aquí.</div>
            </div>`;
        h += '</div>';
        h += '</div>';
        return h;
      })();

  body.innerHTML = _listHtml;

  // TKT-B2b: _attachQIncDelegation — único listener sobre #qinc-panel-body.
  // TKT3 (REQ CAEL-0720-05): ya no unifica stats-bar (qi-clear-types/qi-type/qi-priority/
  // qi-search) ni qi-export-incidents — ambos migraron fuera de #qinc-panel-body (stats-bar
  // propia arriba; export vía shell:export-qinc, ver final del archivo). Unifica solo:
  // copy-code de cards buildQIncItem y qi-toggle-comportamiento.
  // Registrado una sola vez sobre body via flag — persiste entre re-renders de innerHTML.
  _attachQIncDelegation(body);
}

// TKT-B2b: delegación unificada para #qinc-panel-body.
// Parámetro container: el elemento sobre el que se registra el listener (siempre #qinc-panel-body).
// TKT3 (REQ CAEL-0720-05): maneja únicamente copy-code de cards ITIL y expand de
// comportamientoActual — filtros de stats-bar y export salieron de aquí (ver renderQIncStats()
// y listener shell:export-qinc al final del archivo).
// TKT2 (TKT-202607-159, parent REQ-202607-052): toggle compartido entre click y teclado —
// alterna .qinc-section-header--collapsed en el header, .qinc-section-body--collapsed en el
// nodo referenciado por aria-controls, y espeja el estado en aria-expanded. Único punto de
// mutación de estado de colapso — evita duplicar la lógica entre los dos event listeners.
function _toggleQIncSection(header) {
  const collapsed = header.classList.toggle('qinc-section-header--collapsed');
  header.setAttribute('aria-expanded', String(!collapsed));
  const bodyId = header.getAttribute('aria-controls');
  const bodyEl = bodyId ? document.getElementById(bodyId) : null;
  if (bodyEl) bodyEl.classList.toggle('qinc-section-body--collapsed', collapsed);
}

// AC: exactamente un listener activo — flag _qiDelegationAttached previene acumulación en re-renders.
function _attachQIncDelegation(container) {
  if (!container || container._qiDelegationAttached) return;
  container._qiDelegationAttached = true;

  container.addEventListener('click', function _qiClick(e) {
    // --- qinc-section-header: toggle de colapso de sección (Activos/Terminados) ---
    // TKT2 (TKT-202607-159, parent REQ-202607-052, depends_on TKT-202607-158): AC1 — click
    // alterna .qinc-section-header--collapsed en el header, .qinc-section-body--collapsed en
    // aria-controls, y aria-expanded entre "true"/"false". Evaluado antes que qi-open-panel:
    // .qinc-section-header no anida ningún trigger de card (no comparte ancestro con
    // .qinc-item-header, a diferencia de copy-code/qi-toggle-comportamiento) — sin riesgo de
    // que closest() del header de sección matchee algo de una card individual, pero se coloca
    // primero por el mismo criterio de "controles más específicos primero" ya usado en el resto
    // del delegador.
    const sectionHeader = e.target.closest('.qinc-section-header');
    if (sectionHeader) {
      _toggleQIncSection(sectionHeader);
      return;
    }

    // --- copy-code: patrón idéntico al Backlog principal ---
    // Orden crítico: debe evaluarse ANTES que qi-open-panel — el botón copy-code vive anidado
    // dentro de .qinc-item-header, que ahora también lleva data-qi-action="qi-open-panel"
    // (ver buildQIncItem() mod:115). Si qi-open-panel se evaluara primero, closest() del click
    // en copy-code también matchearía el header ancestro y el copiado nunca se ejecutaría.
    const copyBtn = e.target.closest('[data-action="copy-code"]');
    if (copyBtn) {
      e.stopPropagation();
      const code = copyBtn.dataset.code;
      if (code) {
        // TKT-202608-286 (Finn, gap detectado en QA — no cubierto por AC original de ese TKT):
        // icon es ahora <svg class="ti-svg qinc-item-code-chip-icon"><use href="#ti-X">
        // (sprite local, retiró el webfont) — classList.replace('ti-copy','ti-check') ya no
        // tenía esas clases que reemplazar sobre el <svg> y quedaba como no-op silencioso.
        // El swap de símbolo se hace sobre el atributo href del <use> anidado. Mismo fix
        // aplicado en locus-backlog-zone-engine.js _copyCode() — mismo patrón, mismo gap.
        const icon = copyBtn.querySelector('.qinc-item-code-chip-icon');
        const useEl = icon ? icon.querySelector('use') : null;
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.classList.add('is-copied');
          if (useEl) useEl.setAttribute('href', '#ti-check');
          setTimeout(() => {
            copyBtn.classList.remove('is-copied');
            if (useEl) useEl.setAttribute('href', '#ti-copy');
          }, 1500);
        }).catch(() => {
          copyBtn.classList.add('is-copy-error');
          setTimeout(() => copyBtn.classList.remove('is-copy-error'), 1500);
        });
      }
      return;
    }

    // --- qi-copy-item: copia el bloque completo del ítem al portapapeles ---
    // TKT-B (REQ CAEL-0722-01, ref_id CAEL-0722-06): mismo patrón de feedback que copy-code
    // (is-copied + timeout), con estado de error explícito si el clipboard falla (AC de
    // error separado del happy path — permiso denegado o contexto no seguro).
    // Fix INC (hallazgo Finn, sesión 2026-08-23): movido ANTES de qi-open-panel — mismo
    // motivo ya documentado para copy-code (ver comentario en esa rama, arriba): el botón
    // vive anidado dentro de .qinc-item-header, que lleva data-qi-action="qi-open-panel".
    // Con qi-open-panel evaluado primero, closest() del click en qi-copy-item también
    // matcheaba el header ancestro y el copiado nunca se ejecutaba — el botón abría el panel
    // en su lugar. Sin cambio de lógica interna, solo de orden de evaluación.
    const copyItemBtn = e.target.closest('[data-qi-action="qi-copy-item"]');
    if (copyItemBtn) {
      e.stopPropagation();
      const code = copyItemBtn.dataset.code;
      const content = code ? copyIncidentItemMd(code) : null;
      if (!content) return;
      navigator.clipboard.writeText(content).then(() => {
        copyItemBtn.classList.add('is-copied');
        setTimeout(() => copyItemBtn.classList.remove('is-copied'), 1500);
      }).catch(() => {
        copyItemBtn.classList.add('is-copy-error');
        setTimeout(() => copyItemBtn.classList.remove('is-copy-error'), 1500);
      });
      return;
    }

    // --- qi-open-panel: paridad con .bitem-header — abre el IDP (Item Detail Panel) ---
    // TKT (paridad IDP Q-INC, 2026-07-18): import dinámico — locus-backlog-panel.js ya importa
    // renderBacklogList de este archivo; un import estático de openItemPanel aquí crearía un
    // ciclo ESM. Mismo patrón ya documentado en locus-ui-shell.js (navigateToItem dinámico).
    // TKT-A (REQ CAEL-0722-01, ref_id CAEL-0722-05): mismo trigger ahora también aplica a
    // .qinc-item-meta-secondary — data-qi-action idéntico, sin lógica adicional necesaria.
    const openPanelTrigger = e.target.closest('[data-qi-action="qi-open-panel"]');
    if (openPanelTrigger) {
      const card = openPanelTrigger.closest('.qinc-item[data-code]');
      const code = card ? card.dataset.code : null;
      if (code) import('./locus-backlog-panel.js').then(m => m.openItemPanel(code));
      return;
    }

    // --- qi-toggle-comportamiento: expandir/colapsar comportamientoActual ---
    // Fix INC (Q-INC render audit, 2026-07-18): comportEl ahora es el <button> trigger
    // (data-qi-action vive en el botón, no en el contenido — ver buildQIncItem() mod:114
    // de locus-backlog-item.js). El contenido real se resuelve vía aria-controls.
    const comportEl = e.target.closest('[data-qi-action="qi-toggle-comportamiento"]');
    if (comportEl) {
      const targetId = comportEl.getAttribute('aria-controls');
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;
      const nowExpanded = target.classList.toggle('expanded');
      comportEl.setAttribute('aria-expanded', String(nowExpanded));
      return;
    }

  });

  // Enter/Espacio sobre .qinc-item-header (role="button" tabindex="0", div no nativo) — mismo
  // criterio que _blListKeydown para .bitem-header (locus-backlog-item.js L378-386). El botón
  // qi-toggle-comportamiento no necesita esto: es un <button> nativo, activación por teclado ya
  // viene del navegador.
  container.addEventListener('keydown', function _qiKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    // TKT2 (TKT-202607-159, parent REQ-202607-052): AC2/AC3 — .qinc-section-header es el mismo
    // patrón role="button" tabindex="0" que .qinc-item-header, mismo criterio de activación por
    // teclado. Evaluado primero: un header de sección nunca es ancestro de un trigger de card
    // (jerarquía plana, sin anidamiento entre ambos), así que el orden no genera ambigüedad con
    // la rama de abajo. preventDefault() en ambas teclas — Espacio nunca debe hacer scroll de
    // página cuando el foco está en un trigger de toggle (AC3 explícito).
    const sectionHeader = e.target.closest('.qinc-section-header');
    if (sectionHeader) {
      e.preventDefault();
      _toggleQIncSection(sectionHeader);
      return;
    }
    // Fix INC (hallazgo Finn, misma sesión — mismo root cause del fix de click de arriba):
    // qi-copy-item es <button> nativo anidado dentro de .qinc-item-header — sin este
    // early-return, closest() de la línea de abajo matcheaba el header ancestro
    // (data-qi-action="qi-open-panel") y trigger.click() se disparaba sobre el header en vez
    // de dejar que el botón nativo genere su propio evento click (que ya llega correctamente
    // ordenado al listener de click de arriba). Sin este guard, Enter/Espacio sobre el botón
    // abría el panel en vez de copiar — mismo síntoma que el bug de mouse, vía teclado.
    if (e.target.closest('[data-qi-action="qi-copy-item"]')) return;
    const trigger = e.target.closest('[data-qi-action="qi-open-panel"]');
    if (!trigger) return;
    e.preventDefault();
    trigger.click();
  });
}

// TKT (código histórico no recuperable — founder confirmó no perseguirlo, 2026-07-27): listener
// shell:render-qinc — despachado por switchSubTab en locus-ui-shell.js
// Proyecto cambiado con sub-tab Q-INC activo → re-render automático vía este evento.
window.addEventListener('shell:render-qinc', () => { renderQIncPanel(); });

// Re-render del panel Q-INC cuando el backlog cambia y el tab Incidentes está activo.
// TKT2 (REQ CAEL-01): antes checkeaba #sspanel-qinc.active (sub-tab eliminado, el ID ya no existe
// en el DOM) — corregido a getCurrentTab() === 'incidentes', mismo criterio que el resto del shell
// usa para saber qué tab de primer nivel está activo (ver locus-ui-shell.js currentTab).
window.addEventListener('shell:backlog-render-dirty', () => {
  if (getCurrentTab() === 'incidentes') renderQIncPanel();
});

// TKT3 (REQ CAEL-0720-05): descarga directa de _${prefix}-incidents.md — misma lógica que antes
// vivía en el bloque qi-export-incidents de _attachQIncDelegation (dentro de #qinc-panel-body).
// Ahora disparada por #btn-export-qinc (toolbar estático, #qinc-toolbar en index.html) vía el
// evento shell:export-qinc despachado desde locus-ui-shell.js — mismo patrón que
// shell:export-backlog en locus-backlog-generator.js. Mismo generador (_generateIncidentsMd) y
// helper de prefijo (_docPrefix) que ya usaba TKT3 (REQ CAEL-0720-01) — sin cambio de lógica,
// solo de disparador.
window.addEventListener('shell:export-qinc', () => {
  const content = _generateIncidentsMd();
  const filename = `_${_docPrefix()}-incidents.md`;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  // TKT3 (REQ CAEL-0721-07): marca snapshot DESPUÉS de generar contenido — el delta del export
  // que el founder acaba de descargar refleja el snapshot ANTERIOR, no el que se marca ahora.
  markIncidentsExported(_countClosedIncidents());
});

// TKT-202608-263 (parent: REQ-202608-104, depends_on: TKT-202608-262): descarga de
// _${prefix}-incidents-full.md — mismo mecanismo de Blob/URL.createObjectURL que
// shell:export-qinc (arriba), disparado por #btn-export-qinc-full (mismo #qinc-toolbar) vía el
// evento shell:export-qinc-full despachado desde locus-ui-shell.js. Generador propio
// (_generateIncidentsFullMd) — sin filtro de activos, histórico completo. Sin llamada a
// markIncidentsExported(): ese snapshot/delta es exclusivo del export activo — este export
// puntual no participa de ese cálculo, mismo criterio ya declarado en locus-incidents-generator.js
// mod:15.
window.addEventListener('shell:export-qinc-full', () => {
  const content = _generateIncidentsFullMd();
  const filename = `_${_docPrefix()}-incidents-full.md`;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
});
