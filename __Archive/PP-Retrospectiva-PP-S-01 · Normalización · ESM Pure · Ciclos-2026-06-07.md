# PP-Retrospectiva-PP-S-01 · Normalización · ESM Pure · Ciclos-2026-06-07.md
<!-- Sprint: PP-S-01 · Normalización · ESM Pure · Ciclos | Cerrado: 2026-06-07 | Generado: 2026-06-07 04:55 UTC-6 -->

---

## Sprint

| Campo | Valor |
|---|---|
| ID | PP-S-01 · Normalización · ESM Pure · Ciclos |
| Nombre | PP-S-01 · Normalización · ESM Pure · Ciclos |



| Cerrado | 2026-06-07 |
| Duración | 3 días |

---

## Resumen de progreso

| Métrica | Valor |
|---|---|
| Ítems comprometidos | 145 |
| Ítems completados | 139 (96%) |
| Ítems no completados | 0 |
| Effort total estimado | 168 |
| Effort completado | 161 (96%) |
| Effort pendiente | 0 |
| Vs sprint anterior | Primer sprint con datos completos |

---

## ✅ Completados (139)

| Código | Título | Effort |
|--------|--------|--------|
| `R-202606-001` | Mejora panel DIFF — visibilidad de cambios de campos en ítems existentes | ●○○ (1) |
| `R-202606-002` | Unificar normalización de status — un solo punto canónico en toda la app | ●○○ (1) |
| `T-202606-001` | T1 · Extraer y exportar normalizeStatus() en locus-backlog-core.js | ●○○ (1) |
| `T-202606-002` | T2 · Importar normalizeStatus en locus-session-parse.js — reemplazar _canonicalStatus | ●○○ (1) |
| `R-202606-003` | ESM-1 · Eliminar window.ITEMS — migrar a getItems() exportado desde locus-backlog-core.js | ●○○ (1) |
| `T-202606-003` | T4 · Migrar locus-storage.js de window.ITEMS a getItems() inyectado via _initApp | ●○○ (1) |
| `R-202606-004` | ESM-2 · Eliminar typeof guards residuales — limpieza post-ESM | ●○○ (1) |
| `T-202606-005` | T2 · Eliminar guards clasificados como eliminables | ●○○ (1) |
| `R-202606-005` | ESM-3 · Eliminar bridge window.* en locus-api.js — mover inline script de index.html a módulo ESM | ●○○ (1) |
| `T-202606-006` | T2 · Migrar inline script de index.html a módulo ESM — locus-init.js o main.js | ●○○ (1) |
| `T-202606-007` | T3 · Eliminar asignaciones window.fn = fn de locus-api.js | ●○○ (1) |
| `R-202606-006` | Jerarquía visual R→T en backlog — conector de línea | ●○○ (1) |
| `T-202606-004` | T1 · Auditoría de guards — clasificar typeof en eliminables vs legítimos | ●○○ (1) |
| `T-202606-008` | T1 · CSS — conector visual R→T en .r-children-inner | ●○○ (1) |
| `B-202606-001` | Corrupción en .r-children-list — comentario JS incrustado invalida overflow:hidden | ●○○ (1) |
| `B-202606-002` | Corrupción en .r-children-list — comentario JS incrustado invalida overflow:hidden | ●○○ (1) |
| `T-202606-009` | T2 · JS — generar .r-children-inner y .t-item en _buildChildrenBlock | ●○○ (1) |
| `T-202606-010` | T3 · Agregar imports faltantes y eliminar 14 guards tipo B | ●○○ (1) |
| `T-202606-011` | T3 · Eliminar window.renderSprintTab = renderSprintTab de locus-sprint.js | ●○○ (1) |
| `R-202606-007` | Bloquear ejecución de ítems en icebox sin sprint asignado | ●○○ (1) |
| `T-202606-012` | T1 · Agregar validación de icebox en parser de CHECKPOINT | ●○○ (1) |
| `T-202606-013` | T1 · Extraer normalizeStatus() y migrar los 3 puntos inline en locus-backlog-core.js + _canonicalStatus en locus-session-parse.js | ●○○ (1) |
| `T-202606-014` | T1 · Exportar getItems() desde locus-backlog-core.js y eliminar window.ITEMS | ●○○ (1) |
| `T-202606-015` | T2 · Migrar todos los call sites de window.ITEMS a getItems() importado | ●○○ (1) |
| `T-202606-016` | T1 · Auditar call sites de window.* en index.html y módulos no migrados antes de eliminar bridge | ●○○ (1) |
| `T-202606-017` | T1 · Implementar conector visual L-shape R→T en backlog — CSS y estructura DOM | ●○○ (1) |
| `B-202606-003` | Dead imports sin uso en locus-backlog-render.js y locus-ui-shell.js | ●○○ (1) |
| `T-202606-018` | T1 · Refactorizar MergeDiff en locus-session-save.js — campo change a array {field, from, to}[] | ●○○ (1) |
| `T-202606-019` | T2 · Renderizar chips por campo en locus-backlog-merge.js consumiendo changes[] | ●○○ (1) |
| `T-202606-020` | T3 · Agregar validación de ciclo de vida canónico en MergeDiff — transiciones inválidas a sección propia | ●○○ (1) |
| `T-202606-021` | Eliminar locus-api.js y remover su import en main.js | ●○○ (1) |
| `R-202606-008` | Vista Sprint con subordinados — cards R+huérfanos al nivel sprint, Ts/Bs hijos con sangría y colapso | ●○○ (1) |
| `T-202606-022` | T1 · Lógica de agrupación — childMap por sprint con sort por depends_on | ●●○ (2) |
| `T-202606-023` | T2 · Render de subordinados — card con sangría bajo su R padre | ●●○ (2) |
| `T-202606-024` | T3 · Sort de nivel raíz — toolbar sort solo afecta Rs y huérfanos | ●○○ (1) |
| `T-202606-026` | T5 · CSS — .bl-children-wrap, .bl-child-row, .bl-r-toggle | ●○○ (1) |
| `R-202606-009` | Restructuración del tab Sprint — header compacto, spt-nav arriba, sub-tab Sprints | ●○○ (1) |
| `T-202606-029` | T2 · JS — _sptSwitch con caso sprints, render de metadatos editables, persistencia de scope | ●●○ (2) |
| `T-202606-030` | T3 · CSS — clases .spm-meta-* para panel de metadatos del sub-tab Sprints | ●○○ (1) |
| `R-202606-010` | Auto-trigger DIFF al completar parse válido de CHECKPOINT | ●○○ (1) |
| `T-202606-033` | T3 · Animación de entrada del DIFF — transition que cubre lag de 150ms | ●○○ (1) |
| `T-202606-034` | T4 · Agregar discrepancia raw vs parseado como aviso no bloqueante en parsePaste | ●○○ (1) |
| `B-202606-005` | Tema revierte a oscuro segundos después de cambiarlo a claro | ●○○ (1) |
| `T-202606-035` | T5 · Filtrar transiciones inválidas antes de clasificación en advanced[] y updated[] | ●○○ (1) |
| `B-202606-007` | CSS Purity: style.display = 'none' en _spmMetaOpenEdit — usar classList.add('is-hidden') | ●○○ (1) |
| `T-202606-036` | AC fallback — toggleCollapseAll sin .bl-children-wrap o con hijos vacíos | ●○○ (1) |
| `R-202606-011` | DIFF como gate universal de guardado — campos narrativos + rediseño visual | ●○○ (1) |
| `T-202606-037` | T1 · Pasar campos narrativos del CHECKPOINT a showMergeDiffPanel y eliminar early-return sin ítems | ●○○ (1) |
| `T-202606-038` | T2 · Rediseño visual del DIFF — sección de campos narrativos + Próximo paso al final | ●●○ (2) |
| `T-202606-039` | T3 · Garantizar que el save solo ocurre desde confirmación en el DIFF | ●○○ (1) |
| `B-202606-011` | bl-collapse-btn no refleja estado inicial de sprints colapsados por localStorage al cargar la página | ●○○ (1) |
| `R-202606-012` | Checkbox Mostrar hijos en toolbar de backlog | ●○○ (1) |
| `T-202606-040` | T1 · toggleShowChildren — lógica y persistencia localStorage | ●○○ (1) |
| `T-202606-041` | T2 · Checkbox Mostrar hijos — HTML toolbar + init + listener | ●○○ (1) |
| `R-202606-013` | Mover input duración de sesión al panel del diff | ●○○ (1) |
| `T-202606-042` | T1 · Nova — placement y restricciones UX del input duración en diff | ●○○ (1) |
| `B-202606-012` | Tema revierte a dark sin acción aparente al cambiar dark → light | ●○○ (1) |
| `T-202606-043` | Eliminar style= inline en mdiff-change-hint — locus-backlog-merge.js L261 | ●○○ (1) |
| `T-202606-044` | Limpiar comentario obsoleto en locus-session-save.js L34 — referencia a _doCompleteFinish eliminada | ●○○ (1) |
| `T-202606-045` | T4 · Integración end-to-end — verificar flujo completo DIFF con y sin ítems | ●○○ (1) |
| `T-202606-046` | T2 · Implementar input duración en panel del DIFF — lógica de lectura y persistencia | ●○○ (1) |
| `R-202606-014` | Resolver ciclos de importación ESM — 4 módulos hub bidireccionales | ●●● (3) |
| `T-202606-047` | T1 · Romper ciclos de locus-ui-shell.js — eliminar imports hacia módulos que lo importan | ●●○ (2) |
| `T-202606-048` | T2 · Romper ciclos de locus-storage.js — eliminar imports hacia módulos que lo importan | ●●○ (2) |
| `T-202606-049` | T3 · Romper ciclos de locus-backlog-core.js — eliminar imports hacia módulos que lo importan | ●●○ (2) |
| `T-202606-050` | T4 · Romper ciclos de locus-sesiones.js y locus-sprint-project.js — eliminar imports mutuos restantes | ●●○ (2) |
| `T-202606-051` | Eliminar style= inline en mdiff-change-hint — locus-backlog-merge.js L261 | ●○○ (1) |
| `T-202606-052` | Limpiar comentario obsoleto en locus-session-save.js L34 — referencia a _doCompleteFinish eliminada | ●○○ (1) |
| `T-202606-053` | T4 · Integración end-to-end — verificar flujo completo DIFF con y sin ítems | ●○○ (1) |
| `T-202606-054` | T2 · Implementar input duración en panel del DIFF — lógica de lectura y persistencia | ●○○ (1) |
| `R-202606-015` | Resolver ciclos de importación ESM — 4 módulos hub bidireccionales | ●●● (3) |
| `T-202606-055` | T1 · Romper ciclos de locus-ui-shell.js — eliminar imports hacia módulos que lo importan | ●●○ (2) |
| `T-202606-056` | T2 · Romper ciclos de locus-storage.js — eliminar imports hacia módulos que lo importan | ●●○ (2) |
| `T-202606-057` | T3 · Romper ciclos de locus-backlog-core.js — eliminar imports hacia módulos que lo importan | ●●○ (2) |
| `T-202606-058` | T4 · Romper ciclos de locus-sesiones.js y locus-sprint-project.js — eliminar imports mutuos restantes | ●●○ (2) |
| `B-202606-013` | _hasMetaContent declarada pero no consumida en locus-backlog-merge.js L48 | ●○○ (1) |
| `R-202606-016` | Reubicar input hora del card al DIFF — quitar redundancia visual | ●○○ (1) |
| `T-202606-059` | T1 · Eliminar sección sc-unlock del footerHTML en locus-sesiones.js | ●○○ (1) |
| `T-202606-060` | T2 · Marcar .sc-unlock* y .hora-input como deprecated en _Locus-css-ref | ●○○ (1) |
| `B-202606-014` | Contraste insuficiente — valor '9 sin asignar' en estadísticos del sprint (dark mode) | ●○○ (1) |
| `B-202606-015` | Contraste insuficiente — último campo tenue en fila de datos del sprint activo (dark mode) | ●○○ (1) |
| `B-202606-016` | Contador de tickets del parent no descuenta ítems con status descartado | ●○○ (1) |
| `B-202606-017` | T con status descartado no muestra estilo visual de descartado en vista árbol | ●○○ (1) |
| `R-202606-017` | Vista Lista — integración Sprint + C como vista por defecto del backlog | ●○○ (1) |
| `T-202606-061` | T1 · _renderVistaLista — nueva función integrando sprint groups + jerarquía R→T/B | ●●○ (2) |
| `T-202606-062` | T2 · Deprecar _backlogSprintGroupMode + migrar toggleShowChildren a bl-vl-r-body | ●○○ (1) |
| `T-202606-063` | T3 · index.html — actualizar aria-labelledby de #backlog-list | ●○○ (1) |
| `T-202606-064` | T4 · locus-backlog.css — renombre bl-vc-* → bl-vl-* + selectores sprint group + deprecar bl-r-with-children | ●●○ (2) |
| `B-202606-018` | Input hora modal diff acepta más de 4 dígitos — muestra 'hora inválida' sin feedback claro | ●○○ (1) |
| `B-202606-019` | Hora de bloqueo ingresada en modal diff no agota la IA | ●●○ (2) |
| `T-202606-065` | Advertencia no bloqueante si hora de bloqueo supera 5h desde hora de ingreso | ●○○ (1) |
| `B-202606-020` | AC-2 incumplido — _focusFirstInteractive · openAddAI · openNotifConfig sin patrón de desacoplamiento | ●○○ (1) |
| `B-202606-021` | Tab Sprint muestra empty state — shell:render-sprint-tab sin listener en locus-sprint.js | ●○○ (1) |
| `B-202606-022` | Sidebar acciones backlog en blanco — listener shell:update-subtab-buttons ausente en locus-docs.js | ●○○ (1) |
| `B-202606-023` | Setup Checklist Banner — paso Ítem siempre ○ aunque haya ítems en backlog | ●○○ (1) |
| `T-202606-066` | T · Verificación de integración — cancelación desde DIFF en path sin ítems | ●○○ (1) |
| `B-202606-024` | _buildNarrativeSection() no renderiza cuando solo proximoPaso tiene valor — condición `!_rows` evalúa string vacío como falsy | ●○○ (1) |
| `B-202606-025` | Ts hijos no heredan sprint automáticamente al mover R de icebox a sprint | ●○○ (1) |
| `T-202606-067` | T5 · Sprint stats — agregar label contextual al valor de porcentaje de completado | ●○○ (1) |
| `T-202606-068` | T6 · Sprint header — corregir contraste de barra burndown interna | ●○○ (1) |
| `T-202606-069` | Corregir chip 'POSIBILIDADES' — width desproporcionado vs otros chips de tipo en fbar | ●○○ (1) |
| `T-202606-070` | Agregar separadores visuales entre grupos de filtros en bottom bar | ●○○ (1) |
| `B-202606-026` | Posible clip de barra de progreso del sprint al llegar a 100% — verificar padding de cierre | ●○○ (1) |
| `T-202606-071` | Eliminar selector .item.is-discarded .item-title-inline — legacy sin uso activo | ●○○ (1) |
| `T-202606-072` | Registrar listeners shell:* en módulos de render y backlog — locus-backlog-render · locus-backlog-item · locus-docs · locus-backlog-sprints · locus-pulso · locus-radar · locus-sesiones-stats | ●●○ (2) |
| `T-202606-073` | Registrar listeners shell:* en módulos de sesión y shell — locus-sesiones · locus-toast · locus-ui-shell | ●○○ (1) |
| `T-202606-074` | T1 · Herencia de sprint en parser de CHECKPOINT — R a sprint activo propaga a Ts hijos | ●○○ (1) |
| `T-202606-075` | T2 · Herencia de sprint en IDP — campo sprint de T hijo no editable de forma independiente al parent | ●○○ (1) |
| `T-202606-076` | T3 · Herencia de sprint en drag & drop — mover T a sprint distinto al parent es bloqueado | ●○○ (1) |
| `B-202606-027` | navigateToCard ReferenceError — locus-ui-shell.js invoca función de locus-sesiones-stats.js sin estar en scope ESM | ●○○ (1) |
| `B-202606-028` | _getItems warn en _loadFromSupabase — timing: Supabase auth callback dispara antes de _initApp(opts) | ●○○ (1) |
| `B-202606-029` | Render inicial del backlog faltante en _renderAfterAuth tras migración a event dispatch | ●○○ (1) |
| `T-202606-077` | T5 · Registrar _registerCoreCallback en módulos consumidores de locus-backlog-core | ●●○ (2) |
| `B-202606-030` | updateBacklogFooter llamada antes de inicialización de _blFooterCollapsed — ReferenceError en arranque | ●○○ (1) |
| `T-202606-082` | DIFF — Enter en input de hora con botón bloqueado mueve foco al primer pendiente | ●○○ (1) |
| `T-202606-087` | Reemplazar checkbox 'mostrar hijos' por pill toggle bl-strip-btn en filter strip del backlog | ●○○ (1) |
| `B-202606-032` | DIFF muestra 'Sin Sprint' en ítems nuevos con sprint asignado desde CHECKPOINT | ●○○ (1) |
| `B-202606-033` | Botón guardar del DIFF visualmente cortado — se sobreimprime en el borde del contenedor | ●○○ (1) |
| `R-202606-020` | Refactor header — deduplicación, jerarquía y claridad de acciones | ●○○ (1) |
| `T-202606-088` | T1 · Eliminar cmd-k-pill del HTML y remover su listener | ●○○ (1) |
| `T-202606-089` | T2 · Eliminar breadcrumb-sprint y separadores condicionales del HTML | ●○○ (1) |
| `T-202606-090` | T3 · Mover ckpt-reopen-btn al menú ⋯ con label de texto | ●○○ (1) |
| `T-202606-091` | T4 · Fijar posiciones de acciones condicionales en header-actions | ●○○ (1) |
| `T-202606-092` | T5 · Clarificar responsabilidad de user-chip vs header-active-worker en HTML | ●○○ (1) |
| `R-202606-022` | Fusión toolbar + filter strip en una sola barra — Backlog | ●○○ (1) |
| `T-202606-097` | T1 · Fusionar toolbar y filter strip en una sola barra HTML | ●●○ (2) |
| `T-202606-098` | T2 · Eliminar filtro de roles del HTML y JS | ●○○ (1) |
| `T-202606-099` | T3 · Mover badge+toggle al footer gf-* | ●○○ (1) |
| `T-202606-100` | T4 · CSS — divisor y layout de la barra fusionada | ●○○ (1) |
| `B-202606-035` | toggleShowChildren — pill Hijos no oculta hijos cuando R no tiene toggle individual activo | ●○○ (1) |
| `R-202606-023` | Herencia de sprint — parser, IDP y drag & drop respetan parent R | ●○○ (1) |
| `T-202606-101` | Guard de salida para retries de _loadFromSupabase cuando _appReady nunca se activa | ●○○ (1) |
| `T-202606-102` | Limpiar selectores CSS huérfanos ftype-btn y tc-*-btn de locus-backlog.css | ●○○ (1) |
| `T-202606-103` | Migrar selectores .bl-children-wrap y .bl-r-toggle → .bl-vl-r-body y vl-toggle-r en toggleShowChildren y toggleCollapseAll | ●○○ (1) |
| `B-202606-037` | Campo hora en DIFF no dispara estado Agotado — worker queda disponible aunque se ingrese hora de desbloqueo | ●○○ (1) |
| `B-202606-038` | Reasignación de sprint desde backlog no actualiza render en live | ●○○ (1) |
| `T-202606-104` | Eliminar Modo R de toggleCollapseAll — Colapsar opera solo sobre headers de sección | ●○○ (1) |
| `B-202606-039` | Transiciones automáticas de R no se ejecutan al avanzar Ts hijos | ●○○ (1) |
| `B-202606-040` | R no retrocede de en-revision cuando un T hijo regresa de done | ●○○ (1) |

---

## ⏳ No completados

_Todos los ítems fueron completados. 🎉_

---

_Generado por Locus  · 2026-06-07 04:55 UTC-6_
