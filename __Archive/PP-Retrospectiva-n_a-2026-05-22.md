# PP-Retrospectiva-n/a-2026-05-22.md
<!-- Sprint: n/a | Cerrado: 2026-05-22 | Generado: 2026-05-23 00:26 UTC-6 -->

---

## Sprint

| Campo | Valor |
|---|---|
| ID | n/a |
| Nombre | n/a |



| Cerrado | 2026-05-22 |


---

## Resumen de progreso

| Métrica | Valor |
|---|---|
| Ítems comprometidos | 129 |
| Ítems completados | 129 (100%) |
| Ítems no completados | 0 |
| Effort total estimado | 171 |
| Effort completado | 171 (100%) |
| Effort pendiente | 0 |
| Vs sprint anterior | Primer sprint con datos completos |

---

## ✅ Completados (129)

| Código | Título | Effort |
|--------|--------|--------|
| `R-202605-001` | Auditoría CSS automatizada — Locus (8 checks, bash) | ●○○ (1) |
| `R-202605-002` | Fase B · Resolver conflictos de superficie — duplicado + debug en producción | ●○○ (1) |
| `R-202605-003` | Fase A · Extraer locus-toast.js desde ai-tracker-checkpoint.js | ●●○ (2) |
| `R-202605-004` | Limpieza previa Fase A · Eliminar quick-note y notas de sesión | ●○○ (1) |
| `B-202605-001` | A3 — Tokens CSS faltantes de alto uso: --text-primary (×12), --card-bg (×5), --spacing-sm (×4), --hover-bg (×3), --accent-hover (×3) | ●●○ (2) |
| `T-202605-002` | A6 — Mapear 97 conflictos de selectores overrides: identificar cuáles son sobreescritura intencional vs redundancia eliminable | ●○○ (1) |
| `P-202605-001` | A5 — Auditoría de dead CSS: 2,882 clases definidas sin referencia detectada en index.html — evaluar si justifica limpieza | ●●● (3) |
| `R-202605-005` | A4-a — Clasificar 66 clases CSS referenciadas sin definición | ●●○ (2) |
| `B-202605-002` | locus-proyectos.css L648 — bloque vacío .proj-ctx-edit {} viola block-no-empty (stylelint activo) | ●○○ (1) |
| `B-202605-003` | .hidden sin definición en locus-*.css — 78 elementos con visibilidad rota | ●○○ (1) |
| `T-202605-003` | Revisar setInterval sin cleanup — locus-backlog-core.js:818 y locus-misc-ui.js:45 | ●○○ (1) |
| `T-202605-004` | A3 — Declarar 39 tokens semánticos en locus-base.css (dark + light theme) | ●○○ (1) |
| `B-202605-004` | A2 — Eliminar style.width/transition directos en locus-checkpoint-viz.js barra de progreso | ●●○ (2) |
| `P-202605-002` | A5 — Auditoría de clases CSS no referenciadas con herramienta dinámica o análisis por módulo | ●●○ (2) |
| `T-202605-005` | prefers-reduced-motion — cubrir animaciones infinite en locus-analytics.css | ●○○ (1) |
| `T-202605-006` | Migrar JS de #setup-checklist-banner de .scb-hidden a .is-hidden | ●●○ (2) |
| `T-202605-007` | Migrar JS de #setup-checklist-banner de .scb-hidden a .is-hidden | ●●○ (2) |
| `T-202605-008` | Auditar flows destructivos y aplicar gconfirm consistente | ●●○ (2) |
| `T-202605-009` | Definir patrón de confirmación no-bloqueante para cambio de status | ●○○ (1) |
| `T-202605-010` | Implementar confirmación no-bloqueante para cambio de status | ●●○ (2) |
| `T-202605-011` | Descartar T-A4 original — reemplazado por T-A4a y T-A4b | ●●○ (2) |
| `T-202605-012` | Implementar confirmación no-bloqueante para cambio de status | ●●○ (2) |
| `B-202605-005` | Fix inline confirm — salida usa --trans-medium en lugar de --trans-fast | ●○○ (1) |
| `T-202605-013` | Inline confirm done — extender a vista Kanban | ●○○ (1) |
| `T-202605-014` | Fix #sprint-close-overlay — botón final inaccesible con skipStep2=true | ●○○ (1) |
| `T-202605-015` | T-A1 AC adicionales — rama render step===3+skipStep2=true | ●○○ (1) |
| `B-202605-006` | _dismissInlineConfirm sin fallback si transitionend no dispara | ●○○ (1) |
| `B-202605-007` | Sprint close — botón 'Cerrar sprint' inaccesible con skipStep2=true | ●○○ (1) |
| `T-202605-016` | setup-checklist-banner — migrar .scb-hidden a .is-hidden | ●○○ (1) |
| `B-202605-008` | Panel config notifs inaccesible cuando unseen = 0 — openNotifConfig falla silenciosamente | ●○○ (1) |
| `B-202605-009` | Panel config colapsa en cada re-render al cambiar configuración de notificación | ●○○ (1) |
| `P-202605-003` | aria-expanded en rsb-cfg-toggle-btn no refleja estado real post re-render | ●○○ (1) |
| `B-202605-010` | Panel config notifs inaccesible cuando unseen = 0 — extraer _renderCfgPanel() independiente | ●○○ (1) |
| `B-202605-011` | Panel config colapsa en re-render al cambiar configuración — preservar estado con _rsbCfgExpanded | ●○○ (1) |
| `T-202605-017` | T-202605-017 | ●○○ (1) |
| `T-202605-018` | T-202605-018 | ●○○ (1) |
| `B-202605-012` | B-202605-012 | ●○○ (1) |
| `R-202605-006` | R-202605-006 | ●○○ (1) |
| `B-202605-013` | B-202605-013 | ●○○ (1) |
| `R-202605-007` | Item Editor — leer y escribir item.title en lugar de item.desc | ●●○ (2) |
| `R-202605-008` | Quick Capture — skip Paso 1 cuando hay un solo worker | ●○○ (1) |
| `T-202605-019` | tmpl-trigger-wrap — documentar patrón de colapso animado en CSS-Reference | ●○○ (1) |
| `T-202605-020` | breadcrumb-sprint — migrar .breadcrumb-seg--hidden a .is-hidden | ●○○ (1) |
| `P-202605-004` | Tema light/dark — evaluar eliminar entrada duplicada en menú ⋯ | ●○○ (1) |
| `P-202605-005` | search-global — evaluar ampliar scope más allá de tab Tracker | ●●○ (2) |
| `R-202605-009` | Quick Capture — skip Paso 1 cuando hay un solo worker | ●○○ (1) |
| `R-202605-010` | Auditoría de dead CSS con herramienta dinámica — identificar clases realmente sin uso y proponer eliminación | ●●○ (2) |
| `B-202605-014` | aria-expanded en rsb-cfg-toggle-btn no refleja estado real post re-render | ●○○ (1) |
| `T-202605-021` | Tema light/dark — eliminar entrada duplicada en menú ⋯ | ●○○ (1) |
| `T-202605-022` | Dead CSS — eliminar clusters confirmados: ckpt-diff-* · srp-* · tracker-items-* · chrono-* · hoy-int-* · cd-banner · blog-* · tracker-item-row* · ranking-* | ●●○ (2) |
| `T-202605-023` | Dead CSS — decisión founder sobre ranking-* y tracker-item-row* → eliminar | ●○○ (1) |
| `P-202605-006` | Auditar Import Diff — verificar comportamiento de ambos puntos de entrada (menú ⋯ vs input #imp) e identificar inconsistencia o bug | ●○○ (1) |
| `P-202605-007` | Auditar Migrate Item (#migrate-item-overlay) — verificar flujo completo e identificar inconsistencia o bug | ●○○ (1) |
| `P-202605-008` | Auditar #status-confirm-overlay — verificar si el overlay tiene uso activo post T-202605-012/013 o es elemento muerto en DOM | ●○○ (1) |
| `P-202605-009` | Auditar #more-menu posicionamiento via JS — identificar si hay problema concreto en algún viewport o es deuda técnica preventiva | ●○○ (1) |
| `P-202605-010` | Auditar Command Palette (#cp-input) — documentar gap de descubribilidad y evaluar si justifica acción de producto | ●○○ (1) |
| `B-202605-015` | Promote — ítem hijo hereda sprint: 'n/a' del padre, queda en grupo colapsado no reconocible post-acción | ●○○ (1) |
| `B-202605-016` | Promote — ítem hijo hereda sprint: 'n/a' del padre, queda en grupo colapsado no reconocible post-acción | ●○○ (1) |
| `R-202605-011` | Auditar Import Diff — verificar comportamiento de ambos puntos de entrada (menú ⋯ vs input #imp) e identificar inconsistencia o bug | ●○○ (1) |
| `R-202605-012` | Auditar Migrate Item (#migrate-item-overlay) — verificar flujo completo e identificar inconsistencia o bug | ●○○ (1) |
| `T-202605-024` | Auditar #status-confirm-overlay — verificar si el overlay tiene uso activo post T-202605-012/013 o es elemento muerto en DOM | ●○○ (1) |
| `R-202605-013` | Auditar #more-menu posicionamiento via JS — identificar si hay problema concreto en algún viewport o es deuda técnica preventiva | ●○○ (1) |
| `T-202605-025` | Auditar Command Palette (#cp-input) — documentar gap de descubribilidad y evaluar si justifica acción de producto | ●○○ (1) |
| `R-202605-014` | Reemplazar #search-toggle-btn por hdr-search-trigger — trigger permanente de Command Palette | ●○○ (1) |
| `T-202605-026` | Verificar corrección de borde en #more-menu — 1920×1080 y 2560×1080 | ●○○ (1) |
| `B-202605-017` | Promote — ítem hijo hereda sprint: 'n/a' del padre, queda en grupo colapsado no reconocible post-acción | ●○○ (1) |
| `T-202605-027` | Promote navigate — callback post-render en lugar de setTimeout fijo | ●●○ (2) |
| `B-202605-018` | Migrate item — ítem se elimina del proyecto origen pero no llega al proyecto destino | ●○○ (1) |
| `B-202605-019` | #more-menu — queda debajo de otros elementos del DOM, no es accesible | ●○○ (1) |
| `T-202605-028` | search-global — evaluar ampliar scope más allá de tab Tracker | ●○○ (1) |
| `T-202605-029` | Deprecar getProjBacklog y setProjBacklog — operan sobre proj.backlog (campo v2 eliminado en _applyStateData) | ●○○ (1) |
| `B-202605-020` | more-menu no aparece correctamente en AI cards del tab Tracker | ●●○ (2) |
| `T-202605-030` | CSS-CRÍTICO-01: Auditar y reubicar los 101 selectores primarios en locus-overrides.css | ●●● (3) |
| `T-202605-031` | CSS-CRÍTICO-02: Selectores duplicados consolidados | ●●○ (2) |
| `T-202605-032` | CSS-ALTO-01: Reemplazar transiciones hardcoded por tokens --trans-* | ●●● (3) |
| `T-202605-033` | CSS-ALTO-02: Reemplazar colores hex hardcoded por tokens semánticos | ●●○ (2) |
| `T-202605-034` | CSS-MEDIO-01: Completar migración de clases legacy de visibilidad a .is-hidden | ●●○ (2) |
| `B-202605-021` | CSS-BAJO-01: z-index hardcoded en locus-tracker.css L7547 → var(--z-toast) | ●○○ (1) |
| `B-202605-022` | CSS-BAJO-02: 3 font-size hardcoded en locus-layout.css → tokens | ●○○ (1) |
| `B-202605-023` | CSS-BAJO-03: border-radius hardcoded en locus-proyectos.css → token | ●○○ (1) |
| `R-202605-015` | Eliminar locus-overrides.css — reubicar 101 selectores primarios a sus archivos de scope | ●●● (3) |
| `R-202605-016` | Eliminar locus-overrides.css — reubicar 101 selectores primarios a sus archivos de scope | ●●● (3) |
| `R-202605-017` | Eliminar locus-overrides.css — reubicar 101 selectores primarios a sus archivos de scope | ●●● (3) |
| `R-202605-018` | Disolver locus-overrides.css — cada módulo dueño completo de su base | ●●● (3) |
| `B-202605-024` | Sidebar ticker dispara render() completo al expirar IA — causa latido visual en AI Card | ●○○ (1) |
| `B-202605-025` | rsbFilterAIs — migrar .rsb-hidden a .is-hidden (CSS-04) | ●○○ (1) |
| `B-202605-026` | locus-radar.css — clases faltantes del historial de notificaciones | ●○○ (1) |
| `B-202605-027` | locus-radar.css — .rsb-card.in-session-state sin selector directo | ●○○ (1) |
| `B-202605-028` | locus-radar.js — CSS Purity: --rsb-proj-color vía style= inline | ●○○ (1) |
| `B-202605-029` | rsbFilterAIs — migrar .rsb-hidden a .is-hidden (CSS-04) | ●○○ (1) |
| `B-202605-030` | locus-radar.css — clases faltantes del historial de notificaciones | ●○○ (1) |
| `B-202605-031` | locus-radar.css — .rsb-card.in-session-state sin selector directo | ●○○ (1) |
| `B-202605-032` | locus-radar.js — CSS Purity: --rsb-proj-color vía style= inline | ●○○ (1) |
| `B-202605-033` | locus-radar.css — clases faltantes del historial de notificaciones | ●○○ (1) |
| `B-202605-034` | locus-radar.css — .rsb-card.in-session-state sin selector directo | ●○○ (1) |
| `B-202605-035` | rsbFilterAIs — migrar .rsb-hidden a .is-hidden (CSS-04) | ●○○ (1) |
| `B-202605-036` | locus-radar.css — clases faltantes del historial de notificaciones | ●○○ (1) |
| `B-202605-037` | locus-radar.css — .rsb-card.in-session-state sin selector directo | ●○○ (1) |
| `B-202605-038` | locus-radar.js — CSS Purity: --rsb-proj-color vía style= inline | ●○○ (1) |
| `T-202605-035` | R-202605-018 Fase 1 — Inventario: tabla de 101 selectores con módulo destino y justificación | ●○○ (1) |
| `T-202605-036` | R-202605-018 Fase 2 — Migración: mover selectores al módulo destino | ●●○ (2) |
| `T-202605-037` | R-202605-018 Fase 3 — Limpieza: eliminar bases redundantes en módulos destino | ●○○ (1) |
| `T-202605-038` | R-202605-018 Fase 4 — Cierre técnico: eliminar locus-overrides.css y actualizar index.html | ●○○ (1) |
| `T-202605-039` | R-202605-018 Fase 5 — QA: sin regresión visual + CSS Purity audit | ●○○ (1) |
| `P-202605-015` | Soportar parentId en schema de CHECKPOINT (duplicado de P-202605-014) | ●●○ (2) |
| `B-202605-039` | .popup-header falta display: flex en locus-modals.css | ●○○ (1) |
| `R-202605-019` | Tab Sprint — panel de control unificado del sprint activo | ●●● (3) |
| `T-202605-040` | T-01 — Registrar tab Sprint en nav — entrada en HTML + switchTab | ●○○ (1) |
| `T-202605-041` | T-02 — Empty state del tab Sprint — sin sprint activo | ●○○ (1) |
| `T-202605-042` | T-03 — Header sticky — nombre, version_target, release_type, días transcurridos | ●○○ (1) |
| `T-202605-043` | T-04 — Burndown — barra de progreso effort done vs total (ACs stale) | ●○○ (1) |
| `T-202605-045` | T-06 — Sección scope added (ACs stale) | ●○○ (1) |
| `T-202605-046` | T-07 — Sección workers vinculados al sprint | ●○○ (1) |
| `T-202605-047` | T-08 — Trigger de cierre — botón + indicador listo para cerrar | ●○○ (1) |
| `T-202605-048` | T-09 — Renombrar locus-plan.js → locus-sprint-plan.js | ●○○ (1) |
| `T-202605-049` | T-10 — Refactor — deprecar toggleBacklogSprintGroupMode + toggleSprintHealthPanel | ●●○ (2) |
| `T-202605-050` | T-11 — CSS completo del tab Sprint — locus-sprint.css | ●●○ (2) |
| `T-202605-051` | T-12 — Extraer locus-sprint.js (ACs stale) | ●●○ (2) |
| `T-202605-052` | T-13 — Command Palette — actualizar comandos de Plan → Sprint | ●○○ (1) |
| `T-202605-053` | T-14 — Migración de keys de storage (ACs stale) | ●○○ (1) |
| `T-202605-054` | T-15 — Map Generator — actualizar referencias a locus-plan.js | ●○○ (1) |
| `T-202605-059` | T-05 — Lista de ítems del sprint por estado (ACs stale) | ●●○ (2) |
| `B-202605-040` | Tab Sesiones — grid visible al cambiar a otros tabs | ●○○ (1) |
| `T-202605-070` | Limpiar display: flex redundante en #tab-tracker.active — locus-layout.css | ●○○ (1) |
| `B-202605-041` | Pill 'sin sesión' — threshold calculado desde creación en lugar de última sesión vinculada | ●○○ (1) |
| `B-202605-042` | card-dot-dropdown: flash de posición en primer frame | ●○○ (1) |
| `B-202605-043` | more-menu header: fondo transparente — sin background, border ni box-shadow | ●○○ (1) |
| `B-202605-044` | card-dot-dropdown no cierra al presionar Escape | ●○○ (1) |
| `B-202605-045` | card-dot-dropdown no cierra al presionar Escape | ●○○ (1) |

---

## ⏳ No completados

_Todos los ítems fueron completados. 🎉_

---

## 🗂 Sesiones del sprint (696)

| Fecha | IA / Rol | Título |
|-------|----------|--------|
| — | — | Remoción de campo version del schema de ítems |
| — | — | Remoción de campo version del schema de ítems |
| — | — | Cierre R-202605-001 — bloque de intención en Rs |
| — | — | Formalización de reglas de sprint, version_target e intención en Rs |
| — | — | Formalización de reglas de sprint, version_target e intención en Rs |
| — | — | Mejoras al proceso Founder-Finn — tres cambios aprobados |
| — | — | CSS |
| — | — | B-202605-060 · B-202605-064 — listeners sin cleanup + doble render |
| — | — | Migración de selectores CSS a módulos destino |
| — | — | Especificación R — Fase B · Resolver conflictos de superficie |
| — | — | BL |
| — | — | CSS |
| — | — | CSS |
| — | — | CSS |
| — | — | A4-b — Verificación T dependiente — 65 clases CSS confirmadas |
| — | — | T-202605-517 — AC: _generateFullHistoryContent — retorno vacío |
| — | — | CSS |
| — | — | CSS |
| — | — | B-202605-072 — dep IDs inexistentes en EXECUTION-PLAN display |
| — | — | Rs UX Locus — AC cerrados post-gaps Finn |
| — | — | CSS |
| — | — | CSS R-202605-007 + R-202605-008 — empty state cta-row + setup checklist banner |
| — | — | 08 CSS-05 — prefers-reduced-motion extendido |
| — | — | B-202605-519 — breadcrumb-sprint oculto en mobile |
| — | — | Apertura formal PP-S-01 · Bugs críticos — foundation y flujos core |
| — | — | Copy naming Locus — ai-tracker-ai-notes.js · ai-tracker-map-generator.js |
| — | — | css |
| — | — | ID real asignado — P-202605-240 |
| — | — | QA — R-202605-166 — cierre definitivo |
| — | — | css |
| — | — | T-202605-507 — loadBacklog: delete item.desc tras migración desc→title |
| — | — | B-202605-018 — fix migrate item modelo v3 |
| — | — | QA T-202605-507 — loadBacklog: delete item.desc |
| — | — | css |
| — | — | Block |
| — | — | B-202605-041 — pill sin sesión aparece en ítems con sprint n/a |
| — | — | Fix B — _mgInitDropzone guard prematuro |
| — | — | CSS |
| — | — | B-202605-077 — debug functions movidas a namespace _debug |
| — | — | T-202605-508 — entrega completa |
| — | — | Auditoría Export Strip + Document Generator — especificación de bugs ZIP |
| — | — | QA — B-202605-026 · B-202605-034 aprobados |
| — | — | Purge permanente de ítems históricos pre-reset |
| — | — | Especificación cerrada — B-202605-071 confirmMapGenerator warning sprint sin cerrar |
| — | — | Execution Plan PP-S-03 |
| — | — | s01-sprint-proyectosFS — B-202605-026 entregado |
| — | — | QA B-202605-513 — aprobado |
| — | — | s01-foundation-coreFS · fix B-046 |
| — | — | CSS |
| — | — | Auditoría pre-sprint PP-S-01 |
| — | — | T-202605-029 — Deprecar getProjBacklog y setProjBacklog |
| — | — | T-202605-510 — Timestamp de última actualización del plan |
| — | — | JS Audit |
| — | — | css_debt_audit_locus.html |
| — | — | T-A1 — Fix render body step===3 + eliminación dead code L779 |
| — | — | B-202605-019 — diagnóstico corregido, fix anterior incorrecto |
| — | — | QA — T-202605-513 plan-file-pill--broken |
| — | — | QA T-202605-508 — plan-item-code clickeable |
| — | — | T4 — Expandir declaraciones single-line a multi-line |
| — | — | B-202605-056 Etapa A — fallbacks color-mix() en ai-tracker.css |
| — | — | B-202605-501 — fix regex [PITRB] en _piParseAC / piParse |
| — | — | B-202605-010 — análisis de cobertura vs fixes anteriores |
| — | — | T-202605-515 — estandarizar patrón _generateX() puro · backlog.js |
| — | — | Retomando sesión anterior |
| — | — | index.html — scb-hidden como estado inicial del banner |
| — | — | QA — R-202605-166 Empty state Tab Backlog |
| — | — | Auditoría R-202605-012 — Migrate Item bug detectado |
| — | — | QA — B Copy empty states primer uso |
| — | — | R Migración CSS modular — AC cerrados post-Nova |
| — | — | Re-QA bugs AC-2 — fix Rune verificado |
| — | — | QA R-202605-170 — aprobación final post-fix B-202605-523 |
| — | — | T-202605-001 — Fix CANONICAL_PROJECTS aplicado |
| — | — | Sesión 1s01-fixes-exportFS — B-202605-513 done · B-202605-516 bloqueado |
| — | — | QA — B-202605-518 |
| — | — | PP-S-01 · Sesión 2s01-modulos-dom · B-202605-503 + B-202605-027 + B-202605-012 (parcial) |
| — | — | Auditoría AC — B mayor bloqueado, B menor aprobado |
| — | — | B-202605-002 — Bloque vacío .proj-ctx-edit eliminado |
| — | — | T Lint CSS — config corregida post-baseline real |
| — | — | Módulo gestor de sprints |
| — | — | PP-REFACTOR-JS-BRIEF_V1_0.md |
| — | — | T-202605-516 — AC: _getMapContent() — JSON inválido documentado en código |
| — | — | Fase A · R limpieza previa — eliminar quick-note y notas de sesión |
| — | — | T-202605-006 — QA aprobado |
| — | — | B-202605-006 — _dismissInlineConfirm fallback timeout |
| — | — | B-02 + B-03 — locus-radar.css |
| — | — | css |
| — | — | Botón de menú bloqueado por elemento superpuesto |
| — | — | QA — B-202605-018 Migrate item |
| — | — | R Descubribilidad búsqueda + CP — especificación completa |
| — | — | QA — B-202605-517 y B-202605-520 |
| — | — | QA · B-202605-068 · openItemEditor — notes ausente |
| — | — | Análisis de backlog PP-S-01 — pre-apertura |
| — | — | QA B-202605-516 — buildBacklogMd item.desc fallback |
| — | — | B-202605-017 — fix regex [PITRB] → [PTRB] en registro de actividad |
| — | — | T-202605-015 — status done post QA aprobado |
| — | — | impl-rune spec-gaps — T-521 · T-525 · T-526 done |
| — | — | B promote — fix condición de carrera render/navigate |
| — | — | Fase A · Especificación R locus-tracker.js — AC cerrados post-Finn |
| — | — | QA T-A4b — gap AC 4 + bug menor transición salida |
| — | — | CSS |
| — | — | Limpieza de conteos técnicos en CONTEXT y STRATEGY |
| — | — | Auditoría QA — R-202605-005 CSS consolidación Cat B + Cat C + header Cat A |
| — | — | Verificación T-202605-016 — scb-hidden → is-hidden |
| — | — | JS audit |
| — | — | Auditoría panel config notificaciones — ex #notif-config-overlay |
| — | — | B-202605-078 — diagnóstico bloqueado por archivo faltante |
| — | — | Observación post-QA — R-202605-009 |
| — | — | css |
| — | — | CSS |
| — | — | s01-foundation-coreFS · fixes B-001 B-002 B-006 B-042 |
| — | — | Especificación R — Timestamp y secciones en mini historial + card sesión en curso |
| — | — | R-202605-005 — Nova: decisiones de valor canónico Categoría B |
| — | — | [pendiente-ID] — Backlog Focus Mode visual · Top-10 · .backlog-focus-mode |
| — | — | B-202605-508 · AC3 — _doCompleteFinish llama updateTabNotifBadges |
| — | — | s02-backlog-b · fixes B-009 B-010 B-011 B-018 B-019 B-030 B-045 B-050 |
| — | — | QA T-A4b — aprobado |
| — | — | QA — T-202605-534 |
| — | — | QA PP-S-03 — B-048 · B-049 · B-051 · B-052 · B-058 |
| — | — | R-202605-003 Fase A · Extraer locus-toast.js |
| — | — | Deuda técnica — contrato de retorno inconsistente en exports |
| — | — | Procesamiento QA B-202605-068 · estado del sprint PP-S-04 |
| — | — | B-202605-020 — fix more-menu no visible en AI cards |
| — | — | T-202605-009 — verificación de implementación existente |
| — | — | Fix .more-menu — posicionamiento y z-index |
| — | — | Auditoría T-202605-025 — Command Palette gap de descubribilidad confirmado |
| — | — | [pendiente-ID] — Backlog Focus Mode visual · ajuste post-index.html |
| — | — | B-202605-070 — deduplicación silenciosa en _mgLoadFiles corregida |
| — | — | ZIP: MAP ausente + Backlog archivado ausente |
| — | — | Sesión 1s02-affordancesFS — R-010 · R-011 · R-012 (completo con CSS) |
| — | — | Auditoría B-202605-508 — updateTabNotifBadges no se llama al cargar |
| — | — | CSS |
| — | — | QA — R-202605-178 Empty state orientado a acción |
| — | — | T-202605-534 — fix bloques multi-selector |
| — | — | css |
| — | — | Auditoría migrate-to-locus-tracker.css — T-202605-035 |
| — | — | B-202605-517 — buildBacklogMd truncado corregido |
| — | — | B-534 · B-535 · B-536 — CssSyntaxError bloques sin cerrar |
| — | — | Cierre de gap — R-202605-010 AC toast de error |
| — | — | R-202605-167 · R-202605-168 — Breadcrumb + Sprint row |
| — | — | T-202605-534-A — verificación de AC |
| — | — | T-202605-020 — breadcrumb-seg--hidden → is-hidden |
| — | — | Fix B × 2 — selectores truncados locus-backlog.css + locus-tracker.css |
| — | — | Inventory V1.8 — actualización post PP-S-01 |
| — | — | T-202605-017 — limpiar app-version-override en reset (completo) |
| — | — | QA T-202605-534 — locus-overrides.css consolidación CSS cross-module |
| — | — | Fix B-202605-506 — borde input-outline-error no se quitaba al corregir vt |
| — | — | QA — B-202605-056 color-mix() — ambos archivos |
| — | — | Fix B-202605-521 — estado neutral header-pulso-dot |
| — | — | QA B-202605-014 — aria-expanded rsb-cfg-toggle-btn |
| — | — | Fix B-202605-522 — renderPulsoDot early return |
| — | — | CSS |
| — | — | AC cerrados Rs header Locus 01–04 — restricciones Nova incorporadas |
| — | — | Fase A · Extraer locus-ui-shell.js |
| — | — | B-202605-022 — 3 font-size hardcoded → tokens |
| — | — | T-01 — prefers-reduced-motion en locus-analytics.css |
| — | — | Auditoría QA — Toasts y Toggles PP-S-01 |
| — | — | B-202605-031 — criterios de sprint activo corregidos |
| — | — | B-202605-056 — color-mix() fallbacks — análisis completado, ejecución bloqueada |
| — | — | T-202605-537 — overrides: cascade fix .tg-add-row input |
| — | — | Copy naming Locus — ai-tracker-checkpoint.js · ai-tracker-session.js |
| — | — | Cierre de gap de especificación — draft-dot sin AC |
| — | — | B-202605-518 — breadcrumb-seg--proj color sin proyecto activo |
| — | — | B-202605-029 — _PREFIX_MAP alineado a OL-CONTEXT §7 |
| — | — | T-202605-506 — Eliminar botones Paste y X, vaciar textarea, resizable |
| — | — | B-202605-016 — Comparación de proyecto unificada a case-sensitive |
| — | — | Fix nombre del worker en header del preview panel |
| — | — | QA aprobado — B-202605-001 + fix .hidden |
| — | — | CSS |
| — | — | Sesión 1s01-guardado-mergeFS — B-004 · B-054 · verificación B-007 · B-008 |
| — | — | B-202605-002 — bloque vacío .proj-ctx-edit verificado como ya resuelto |
| — | — | resize vertical en card-notes-ta |
| — | — | Fix — textarea repoblado con CKPT anterior al guardar sesión |
| — | — | 5 Ps de auditoría — UI Inventory gaps sin ítem |
| — | — | Bug B-202605-031 — Export activo criterio de sprint activo unificado |
| — | — | R-202605-002 Fase B · Resolver conflictos de superficie |
| — | — | B-202605-073 — warning message legacy ---PLAN--- corregido |
| — | — | T-202605-006 — eliminar fallbacks item.desc en construcción de título |
| — | — | R-202605-167 · R-202605-168 — Breadcrumb + Sprint row |
| — | — | CSS |
| — | — | T-202605-512 — Micro-barra de progreso X/N por sesión en plan-session |
| — | — | PP-S-03 · s03-checkpoint-css — B-202605-053, B-202605-055, B-202605-057 |
| — | — | T-202605-534-B — verificación final + apertura T duplicados internos |
| — | — | PP-S-03 · B-202605-053 · fix corregido |
| — | — | QA B-202605-022 — font-size tokens |
| — | — | Fix A — eliminar referencias a exitFocusMode en locus-session-save.js |
| — | — | Conversión de auditoría CSS a ítems accionables |
| — | — | QA B-202605-042 — flash de posición card-dot-dropdown |
| — | — | T-202605-534 — locus-overrides.css · limpieza de módulos base |
| — | — | R-202605-179 — Normalización de microinteracciones · Sesión 1 |
| — | — | PP-S-01 · Reconstrucción EXECUTION-PLAN |
| — | — | B-202605-009 — Panel config colapsa en cada re-render al cambiar configuración |
| — | — | QA T-A1 — aprobado |
| — | — | CSS Split — ai-tracker.css + ai-tracker-extra.css → 8 módulos locus-* |
| — | — | Fix — _effectiveVersion prioriza sprint activo sobre localStorage |
| — | — | P — Parser acepta EXECUTION-PLAN standalone |
| — | — | Especificación inventory auditar — batch parcial |
| — | — | css |
| — | — | s01-sprint-proyectosFS — B-202605-034 AC-4 verificado |
| — | — | QA R-202605-170 — Worker activo chip en header |
| — | — | [pendiente-ID] — Backlog Focus Mode visual · ajuste post-index.html |
| — | — | BL |
| — | — | Cierre de gap AC — B-202605-078 |
| — | — | Auditoría AC — Bs panel config notificaciones |
| — | — | Apertura formal PP-S-01 · Foundation técnica |
| — | — | T-202605-016 — verificación migración .scb-hidden → .is-hidden |
| — | — | CSS |
| — | — | Diagnóstico B — promote no muestra ítem visualmente post-acción |
| — | — | T-202605-004 — A3: 39 tokens semánticos declarados en locus-base.css |
| — | — | Refinamiento AC — 11 ítems backlog Locus |
| — | — | T-202605-002 A7 — Terminador /* END T-202605-476 */ agregado en locus-analytics.css |
| — | — | T-202605-004 — A3: 39 tokens semánticos declarados en locus-base.css |
| — | — | B promote — fix sprint herencia 'n/a' en ítem hijo |
| — | — | R-202605-005 — Implementación Cat B + Cat C + header Cat A en overrides |
| — | — | Auditoría T-202605-024 — #status-confirm-overlay activo |
| — | — | B — Copy empty states primer uso |
| — | — | QA R-202605-009 — version_target y release_type obligatorios en apertura de sprint |
| — | — | R-202605-176 — Migración CSS modular Locus (Fase B+C) |
| — | — | B more-menu — diferido a backlog |
| — | — | B-202605-508 · updateTabNotifBadges al cargar y tras render |
| — | — | B-202605-056 Etapa B2 — fallbacks color-mix() L8384–8470 |
| — | — | Auditoría de CSS en proyecto PP |
| — | — | Cierre de AC — observaciones QA B-202605-514 y B-202605-515 |
| — | — | QA — B-202605-519 |
| — | — | CSS |
| — | — | QA aprobado — B-202605-003 |
| — | — | R-202605-170 Worker activo chip — nombre y cronómetro en header |
| — | — | Sesión 2s01-rs-uiFS · Rune — R-202605-003 CSS |
| — | — | R especificado — Eliminar locus-overrides.css |
| — | — | Refinamiento B-202605-014 — aria-expanded rsb-cfg-toggle-btn |
| — | — | B-202605-003 — auditoría item-type select |
| — | — | Fix B-202605-516 — buildBacklogMd usa item.title || item.desc |
| — | — | T-202605-509 — Toggle colapso/expansión zona done en Plan |
| — | — | R-202605-001 — Auditoría CSS automatizada completa (8/8 checks) |
| — | — | QA — B-202605-066 · backdrop-filter cascade |
| — | — | B-202605-020 — more-menu CSS ausente en AI cards |
| — | — | T-202605-003 — Auditoría setInterval sin cleanup |
| — | — | CSS Optimization — severidad Alta + Media completa |
| — | — | Fix gap B mayor — _renderCfgPanel sobrevive a empty state |
| — | — | CSS |
| — | — | T-202605-003 — CANONICAL alineado a OL-CONTEXT §7 |
| — | — | B-202605-056 Etapa B — fallbacks color-mix() en ai-tracker-extra.css L1–L8383 |
| — | — | Re-especificación T-A3 y partición T-A4 — gaps Finn |
| — | — | T-202605-008 — Finn aprueba tabla de auditoría (Fase 1) |
| — | — | CSS |
| — | — | T-202605-036 — R-202605-018 Fase 2: Migración CSS a módulos canónicos |
| — | — | Bug dropzone + renaming Document Generator |
| — | — | QA T-202605-515 — re-test patrón _generateX() puro |
| — | — | Especificación T de limpieza desc — B-202605-061 follow-up |
| — | — | T-202605-513 — plan-file-pill--broken |
| — | — | T-202605-008 — QA aprobado |
| — | — | Refinamiento P-202605-241 → T — cascade fix .tg-add-row input |
| — | — | T-202605-018 — _mgGetVersion delega a _effectiveVersion |
| — | — | T-202605-022 — Dead CSS eliminado (100 clases, 9 clusters) |
| — | — | CSS |
| — | — | QA — R-202605-014 hdr-search-trigger |
| — | — | Fix IDs duplicados en _assignPendingIds |
| — | — | card |
| — | — | QA — Auditoría de AC T-202605-532 |
| — | — | Re-auditoría B mayor — QA aprobado |
| — | — | QA — B error sprint CONTEXT + B dropzone listeners |
| — | — | B-202605-508 · done |
| — | — | R-202605-169 — Pulso dot en header |
| — | — | Cierre B-202605-527 — gap ya cubierto por T-526 AC-5 |
| — | — | R-202605-003 · QA aprobado con verificación de founder |
| — | — | B-[pendiente-ID] — fix especificidad plan-file-pill--broken |
| — | — | B-202605-528 — Copy B-202605-062 |
| — | — | T-202605-012 — verificación de implementación existente + acumulado |
| — | — | Bugs B-202605-013 · B-202605-035 — DnD guard + InferStatus checks |
| — | — | CSS |
| — | — | EXECUTION-PLAN PP-S-01 — Bugs críticos · foundation y flujos core |
| — | — | AC cerrados — T-04 · T-05 · T-06 · T-12 · T-14 |
| — | — | Cierre T-202605-535 — locus-*.css duplicate selectors |
| — | — | B-202605-056 Etapa C — fallbacks color-mix() completa |
| — | — | Refinamiento PP-S-04 — AC cerrados y secuencia de implementación |
| — | — | T-202605-037. |
| — | — | css |
| — | — | CSS |
| — | — | Auditoría UI Inventory — 4 elementos auditar |
| — | — | Análisis de backlog PP-S-02 — duplicados descartados, B-024 done |
| — | — | B-202605-059 · B-202605-061 · B-202605-062 — Locus PP-S-04 |
| — | — | Diagnóstico de bloqueo B-202605-078 |
| — | — | Fix B — textarea CKPT se repopula post-save |
| — | — | QA — B-202605-073 aprobado |
| — | — | QA R-202605-011 — Import Diff |
| — | — | font-size sprint en breadcrumb — declarado text-md |
| — | — | CSS |
| — | — | QA B-202605-043 — fondo transparente more-menu header |
| — | — | QA R-202605-176 — Migración CSS modular Locus |
| — | — | PP-S-01 · B-202605-012 — verificación final con ai-tracker-backlog.js |
| — | — | Fix gap Quick Capture — AC worker archivado |
| — | — | Validación de archivos migrate fase 2 |
| — | — | R-202605-010 — Auditoría de dead CSS completada |
| — | — | R [pendiente-ID] — logo-img sizing header |
| — | — | Fix R-202605-011 — Import Diff bugs |
| — | — | R-202605-005 A4-a — Clasificación de 78 conflictos de selectores CSS |
| — | — | Execution plan PP-S-01 — 9 ítems futura |
| — | — | Fix draft restore — condición permisiva en _loadFromSupabase sección 6d |
| — | — | Css |
| — | — | CSS |
| — | — | B-202605-011 — análisis de cobertura vs B-202605-009 |
| — | — | QA T-202605-026 — more-menu corrección de borde |
| — | — | B-202605-066 · 3 instancias backdrop-filter sin -webkit par |
| — | — | Fix B-202605-078 — toast redundante proyecto no canónico |
| — | — | Validación R-202605-009 — version_target y release_type obligatorios en apertura de sprint |
| — | — | delete |
| — | — | B-202605-021 — fix regex [PTRBI] → [PTRB] en _ieAutofillFromPaste |
| — | — | css |
| — | — | CSS |
| — | — | CSS |
| — | — | spec T-526 — AC-5 y AC-6 cerrados |
| — | — | QA — R-202605-166 — cierre definitivo |
| — | — | Refinamiento PP-S-04 — AC cerrados y secuencia de implementación |
| — | — | Fix — botones de descarga de Backlog ausentes |
| — | — | QA T-A1 — bloqueado por gap de especificación en render |
| — | — | Migración de selectores CSS a módulos destino |
| — | — | css |
| — | — | Fix — botones Backlog visibles (hidden → is-hidden) |
| — | — | QA B-202605-078 — aprobado |
| — | — | Apertura formal PP-S-01 · Foundation técnica |
| — | — | Especificación Rs header Locus — 01 a 04 + B badges tabs |
| — | — | B-202605-019 — diagnóstico completo, comentario corregido |
| — | — | T-202605-022 — AC cerrados post-gaps de Finn |
| — | — | Fix export backlog full — noSprintItems con sprint: "n/a" |
| — | — | QA — T-202605-512 Micro-barra de progreso X/N por sesión |
| — | — | Restricciones UX — R-202605-007 y R-202605-008 |
| — | — | Especificación T CANONICAL_PROJECTS — Locus |
| — | — | css |
| — | — | QA T-202605-511 — Chip 'activo' en plan-sprint-header |
| — | — | JS Audit |
| — | — | Auditoría QA — R-010 · R-011 · R-012 |
| — | — | QA B-202605-516 — buildBacklogMd item.title || item.desc |
| — | — | Refinamiento T-202605-519 — Tooltip botón importar MAP |
| — | — | QA R-202605-006 — Pill ⌘K + label Buscar |
| — | — | T-202605-034 CSS-MEDIO-01 — auditoría CSS completada, JS adjuntos listos |
| — | — | B-202605-056 Etapa C — fallbacks color-mix() L8471+ (parcial) |
| — | — | Auditoría T1 — locus-overrides.css |
| — | — | Sesión 1s01-rs-uiFS — Rs UI PP-S-01 — auditoría + R-202605-165 parcial |
| — | — | Css |
| — | — | R-202605-006 — Pill ⌘K + label Buscar en header |
| — | — | B-202605-020 — fix iteración 2: position:fixed + coords JS |
| — | — | resize vertical en paste-ta |
| — | — | CSS |
| — | — | Partición B-202605-001 — A4 clases fantasma en dos Rs secuenciales |
| — | — | Re-especificación T-A4b — AC concretos post-Nova |
| — | — | Fix B — título de ítem no visible en diff panel al parsear CHECKPOINT |
| — | — | CSS |
| — | — | Copy de inicio de sesión — naming Locus |
| — | — | QA T-202605-515 — patrón _generateX() puro |
| — | — | Fix — EXECUTION-PLAN se borraba al guardar sesión |
| — | — | QA R-202605-170 — verificación AC-9 post-resolución Cael |
| — | — | T-202605-029 — QA aprobado |
| — | — | Especificación R — Fase A · Extraer locus-toast.js (AC actualizados post-auditoría Finn) |
| — | — | s01-sprint-proyectosFS — B-202605-034 entregado · B-202605-026 bloqueado por gap de especificación |
| — | — | AC-12 |
| — | — | 2s05-checkpointFS — Fixes en ai-tracker-checkpoint.js |
| — | — | cass |
| — | — | B-202605-019 — bloqueado por rate limit de container |
| — | — | QA — B-202605-069 aprobado · B-202605-070 bloqueado |
| — | — | Refinamiento — setItemRole orden _blogLog/_undoSnapshot |
| — | — | R-A AC-5 — eliminar toasts confirmCorrectHora y unlockNowFromCard |
| — | — | Análisis de backlog PP-S-04 — secuencia de implementación |
| — | — | T-202605-534 — partición en fases A y B |
| — | — | QA — T-202605-517 |
| — | — | Sesión 1s01-css-html — B-036 · B-037 · B-038 · B-039 |
| — | — | css |
| — | — | Cierre de gaps R-1 y R-3 — Toasts y Toggles PP-S-01 |
| — | — | CSS |
| — | — | T-202605-023 — Decisión founder ranking-* y tracker-item-row* |
| — | — | CARD |
| — | — | T-202605-031 CSS-CRÍTICO-02: Selectores duplicados consolidados |
| — | — | B-202605-505 — Clipboard sobreescrito post-guardado |
| — | — | Auditoría y ajuste de PLAN — PP-S-05 |
| — | — | R-202605-005 A4-b — Implementación CSS de 117 clases fantasma en 5 archivos |
| — | — | B-202605-006 — QA aprobado |
| — | — | T-202605-019 — Documentar patrón tmpl-trigger-wrap en CSS-Reference |
| — | — | CSS |
| — | — | S3s09-proyectosFS + S4s11-onboardingFS — B-075, B-076, R-013 |
| — | — | css |
| — | — | Cael — AC adicionales T-A1 por gap de render |
| — | — | Refinamiento T-202605-532 |
| — | — | B-202605-039 — .popup-header display:flex faltante |
| — | — | R-202605-003 · Fix AC3 — locus-toast.js en index.html |
| — | — | A4-b — Documentación CSS de 117 clases fantasma en CSS Reference V1.6 |
| — | — | B-202605-043 — fix fondo transparente en more-menu header |
| — | — | QA B-202605-005 — aprobado |
| — | — | T-202605-036 — Bloqueo: locus-overrides.css no adjunto |
| — | — | T-202605-532 — Limpiar bloque draft en _offlineQueueFlush |
| — | — | Close |
| — | — | B — Map Generator — Aplicar y descargar no genera ningún documento |
| — | — | s01-sprint-proyectosFS — B-202605-026 cerrado · B-202605-034 cerrado |
| — | — | CSS |
| — | — | R-202605-166 — Empty state Tab Backlog vacío |
| — | — | QA T-202605-532 — Limpiar bloque draft en _offlineQueueFlush |
| — | — | QA — B promote sprint normalization |
| — | — | css |
| — | — | QA — Eliminar lógica de borrador del textarea en card de workers |
| — | — | CSS |
| — | — | B-202605-044 — Escape cierra card-dot-dropdown y devuelve foco al trigger |
| — | — | impl-rune spec-gaps — T-523 · T-524 done · 4 ítems bloqueados por archivos faltantes |
| — | — | T-527 · T-529 — backlog.js + extra.css |
| — | — | T-202605-070 — Limpiar display: flex redundante en locus-layout.css |
| — | — | CSS |
| — | — | Fix enterFocusMode — referencias huérfanas eliminadas en locus-tracker.js |
| — | — | QA — B-202605-072 aprobado · B-202605-073 gap localizado |
| — | — | Css |
| — | — | QA — B-01 · B-02 · B-03 · B-04 |
| — | — | Auditoría migrate-to-locus-tracker.css completa |
| — | — | font-size nombre de proyecto en header — text-md → text-lg |
| — | — | Fix B-202605-523 — max-width #header-active-worker |
| — | — | B-202605-015 — CANONICAL_PROJECTS alineado a OL-CONTEXT §7 |
| — | — | Cierre de sesión — R-202605-006 entregado |
| — | — | QA T-A4b — con observaciones |
| — | — | T-202605-001 — Actualizar CANONICAL_PROJECTS |
| — | — | Fix B-202605-063 — sess.id con componente random |
| — | — | T-202605-037 — R-202605-018 Fase 3: Limpieza de bases redundantes |
| — | — | QA — B-202605-514 · B-202605-515 |
| — | — | Fixes estáticos PP-S-01 — index.html |
| — | — | B-202605-004 — A4: 13 clases fantasma definidas en CSS canónico |
| — | — | R + 15T — Tab Sprint: panel de control unificado del sprint activo |
| — | — | Auditoría automatizada de CSS en arquitectura modular |
| — | — | __Locus-UI-Inventory_V1_9 — 7 ítems actualizados a limpio |
| — | — | Fix B-202605-065 — env.js y Supabase SDK movidos de HEAD a body |
| — | — | Auditoría AC — spec-gaps-cael (7 ítems) |
| — | — | Auditoría T-202605-028 — search-global scope documentado |
| — | — | QA T-202605-534-B — verificación final |
| — | — | Header — alineación logo · tabs · actions |
| — | — | R actualizado — gaps de Finn resueltos |
| — | — | CSS |
| — | — | Análisis de dependencias y EXECUTION-PLAN — PP-S-05 |
| — | — | css |
| — | — | Fix zona horaria _todayKey/_yesterKey — mini historial |
| — | — | QA B-202605-066 · backdrop-filter webkit pairs |
| — | — | Entregable visual C1 — hdr-search-trigger + decisión C2 |
| — | — | QA — B-202605-060 · B-202605-064 |
| — | — | P — Motivo de descarte en ítems |
| — | — | T-202605-012 — QA aprobado |
| — | — | QA B-[pendiente-ID] — setItemRole orden _undoSnapshot/_blogLog |
| — | — | Css |
| — | — | QA — R-202605-169 — Pulso dot header |
| — | — | T2 — Consolidar duplicados en locus-analytics.css y locus-backlog.css |
| — | — | QA B fix — tab Sesiones visible en otros tabs |
| — | — | css |
| — | — | Refinamiento AC — 11 ítems backlog Locus |
| — | — | Fix ReferenceError _getActiveProjectFilter en _loadFromSupabase |
| — | — | QA — more-menu fondo transparente (B visual header) |
| — | — | B — Radar sidebar ancho completo: selector huérfano en locus-radar.css |
| — | — | B-202605-018 — Migrate item: ítem no llega al proyecto destino |
| — | — | CSS |
| — | — | Auditoría B-202605-516 — buildBacklogMd item.desc sin fallback |
| — | — | QA R-202605-007 DUP-06 + R-202605-009 Quick Capture skip |
| — | — | T-202605-019 — tmpl-trigger-wrap documentado en CSS-Reference |
| — | — | T-202605-031 CSS-CRÍTICO-02: Auditoría locus-modals.css completada — T CERRADO |
| — | — | B-004 fix de atomicidad — tracker forEach movido a _doApplyMergeAndFinish |
| — | — | T-202605-009 — QA aprobado |
| — | — | Apertura formal PP-S-02 |
| — | — | Auditoría migrate-to-locus-radar.css — T-202605-035 |
| — | — | T-202605-511 — Chip 'activo' en plan-sprint-header — DONE |
| — | — | R-202605-001 — Auditoría CSS automatizada (checks A1 A3 A6 A7 A8 completos · A2 A4 A5 pendientes por JS ausente) |
| — | — | CSS Reference V2.2 + locus-base.css v1.5 — documentación post T-202605-033 |
| — | — | QA R-202605-176 — re-verificación post-fix |
| — | — | css |
| — | — | B-202605-066 · 3 instancias de backdrop-filter en overlays |
| — | — | CSS |
| — | — | AC cerrados — R-202605-007 y R-202605-008 con restricciones Nova |
| — | — | QA T-528 |
| — | — | R-202605-018 — Disolver locus-overrides.css: cierre de R |
| — | — | Especificación R-202605-166 — Empty state Tab Backlog |
| — | — | Migración de selectores CSS a módulos destino |
| — | — | Botón de menú bloqueado por elemento superpuesto |
| — | — | QA — B-202605-056 color-mix() fallbacks cross-browser |
| — | — | T-528 — ai-tracker-ai-notes.js |
| — | — | B-202605-021 — z-index hardcoded → var(--z-toast) |
| — | — | QA B-202605-071 — confirmMapGenerator warning sprint sin cerrar |
| — | — | Especificación B — clipboard sobreescrito post-guardado |
| — | — | T-202605-008 — auditoría flows destructivos (Fase 1) |
| — | — | T-202605-034 CSS-MEDIO-01 — migración .hidden → .is-hidden completada |
| — | — | Diagnóstico y especificación — sidebar ticker dispara render() completo |
| — | — | R-202605-014 — hdr-search-trigger: trigger permanente de Command Palette |
| — | — | QA B-202605-001 — auditoría clases A4 |
| — | — | B-202605-031 — criterios de sprint activo corregidos |
| — | — | R-202605-170 — Worker activo chip en header |
| — | — | CSS |
| — | — | Refinamiento P — EXECUTION-PLAN multi-sprint |
| — | — | Auditoría AC + correcciones B-03 y B-04 |
| — | — | CSS |
| — | — | impl-rune spec-gaps — T-522 done · 4 ítems bloqueados por archivos faltantes |
| — | — | PP-S-05 listo — 5 Ts módulo Plan aprobados por Finn |
| — | — | CSS |
| — | — | T-202605-534 — locus-overrides.css generado |
| — | — | Auditoría AC + correcciones B-03 y B-04 |
| — | — | R-A · R-B — Eliminación de toasts redundantes post-acción |
| — | — | Validación de archivos migrate fase 2 |
| — | — | R Supabase sync — reset cross-browser + CANONICAL_PROJECTS fix |
| — | — | Fix transición salida inline confirm — B menor T-A4b |
| — | — | CSS |
| — | — | Auditoría Fase 2 — migrate-to-locus CSS files |
| — | — | css |
| — | — | QA · T-202605-026 · Verificación borde #more-menu |
| — | — | UI Inventory |
| — | — | B-202605-007 — Sprint close botón Cerrar sprint inaccesible con skipStep2=true |
| — | — | Auditoría AC — batch inventory Cael |
| — | — | Fix desbordamiento mini-hist en card del tracker |
| — | — | R-202605-177 — chip de ítem activo en card de worker |
| — | — | Css |
| — | — | QA — B-202605-070 aprobado |
| — | — | B-202605-071 — confirmMapGenerator warning sprint sin cerrar |
| — | — | T-202605-013 — inline confirm done extendido a vista Kanban |
| — | — | Refinamiento PP-S-01 — AC cerrados, restricciones Nova incorporadas |
| — | — | Sesión 1s01-guardado-mergeFS — B-004 · B-054 · verificación B-007 · B-008 |
| — | — | Gaps cerrados — Bs panel config notificaciones |
| — | — | R-202605-178 — Empty state orientado a acción |
| — | — | Fix — B Tab Sesiones persistencia — locus-layout.css |
| — | — | Título: Fix — B Tab Sesiones persistencia — locus-layout.css |
| — | — | CSS |
| — | — | Fix bugs AC-2 — residuos CSS post-consolidación T-202605-534 |
| — | — | Partición R-202605-018 en Ts ejecutables por fase |
| — | — | B-202605-520 — #header-sprint-row movido dentro de <header> |
| — | — | Especificación — pill "sin sesión" threshold correcto |
| — | — | Fix — sidebar ticker dispara render() completo al expirar IA |
| — | — | css |
| — | — | Auditoría pre-implementación R-A · R-B — Toasts redundantes |
| — | — | Restricciones UX — B-202605-071 confirmMapGenerator warning sprint sin cerrar |
| — | — | Diagnóstico bug — textarea CKPT se repopula post-save |
| — | — | s2s01-seguridad-miscFS · sesión 2 |
| — | — | T-202605-008 — Fase 2 · confirm() nativo → _gconfirmOpen |
| — | — | Brief actualizado — PP-REFACTOR-JS-BRIEF_V1_1 |
| — | — | QA B-202605-041 — pill sin sesión con sprint n/a |
| — | — | 2s05-checkpointFS — Sesión completa · 9 bugs cerrados |
| — | — | QA B-202605-020 — card-dot-dropdown AI cards |
| — | — | T-A4b — inline confirm para cambio de status done |
| — | — | Refinamiento post-QA R-202605-007 y R-202605-008 |
| — | — | T-202605-535 — locus-*.css cleanup: syntax + duplicate selectors |
| — | — | T-202605-032 — CSS ALTO-01: Tokens --trans-* en 4 archivos CSS |
| — | — | Refinamiento — Toasts y Toggles PP-S-01 |
| — | — | Fix _pauseCkptTimer / _resumeCkptTimer — referencias rotas |
| — | — | B-534 · B-535 · B-536 — CssSyntaxError bloques sin cerrar |
| — | — | B-202605-067 — _scmStep1Html doble fuente de verdad _scmState |
| — | — | QA B-202605-042 — flash de posición card-dot-dropdown |
| — | — | Extracción del sistema toast a locus-toast.js |
| — | — | Análisis y promoción de ítems P — Locus |
| — | — | Limpieza de documentos de referencia — UX-Reference · CSS-Reference · UI-Inventory |
| — | — | R-202605-003 · Extracción locus-tracker.js desde ai-tracker-checkpoint.js |
| — | — | T-202605-029 — Call site setProjBacklog en locus-backlog-panel.js resuelto |
| — | — | Locus-CSS-Reference V2.0 — patrón inline confirm |
| — | — | Fix — jerarquía de versión alineada en _effectiveVersion y _mgGetVersion |
| — | — | Fix B-202605-020 — card-dot-menu dropdown |
| — | — | QA R-202605-170 — Worker activo chip en header |
| — | — | breadcrumb-seg breadcrumb-seg--proj |
| — | — | R + 15T — Tab Sprint: panel de control unificado del sprint activo |
| — | — | QA aprobado — B-202605-017 promote render/navigate |
| — | — | Cierre de especificación B-202605-020 — gap AC-3 Escape |
| — | — | B-202605-042 — fix flash de posición en card-dot-dropdown |
| — | — | [pendiente-ID] — Backlog Focus Mode visual · ajuste post-index.html |
| — | — | R-007 + R-008 — conexión de renderSetupChecklist al flujo de render |
| — | — | QA — B-202605-059 · B-202605-061 · B-202605-062 |
| — | — | T1 — Eliminar selectores duplicados en locus-overrides.css |
| — | — | B sprint-close skipStep2 — especificación |
| — | — | impl-rune — T-202605-519 · T-202605-530 |
| — | — | QA T-202605-526 — DOM duplicado command palette |
| — | — | QA — B-202605-522 — aprobado |
| — | — | B-202605-018 — fix migrate item orden de operaciones |
| — | — | Fix — ID renombrado quick-modal-overlay → qc-modal-overlay en locus-sprint-project.js |
| — | — | Sesión 1s01-rs-uiFS — Rs UI PP-S-01 — completado |
| — | — | CSS |
| — | — | T-202605-511 — Chip 'activo' en plan-sprint-header |
| — | — | Migración de reglas de accesibilidad a locus-base.css |
| — | — | Especificación actualizada — Paste + X eliminados + textarea resizable |
| — | — | T-202605-033 CSS-ALTO-02: Colores hex hardcodeados reemplazados por tokens semánticos |
| — | — | B-202605-068 · openItemEditor — #item-notes ausente no genera warning |
| — | — | CSS |
| — | — | Auditoría CSS — mapeo a backlog |
| — | — | T-202605-034 CSS-MEDIO-01 — QA aprobado |
| — | — | QA B-202605-020 — more-menu AI cards |
| — | — | A4-b — QA aprobado — 65 clases CSS verificadas |
| — | — | Css |
| — | — | Fix — draft repobla textarea tras guardar sesión |
| — | — | PP-S-03 · QA · s03-checkpoint-css |
| — | — | Copy naming Locus — ai-tracker-backlog.js · ai-tracker-sprint-project.js |
| — | — | js |
| — | — | CSS |
| — | — | Fix B mayor + B menor — panel config notificaciones |
| — | — | CSS |
| — | — | Apertura formal PP-S-01 · Foundation técnica |
| — | — | Fix .card-name — regla base faltante post-migración CSS |
| — | — | impl-rune T-526 — AC-5 y AC-6 aplicados |
| — | — | T-202605-534 — locus-overrides.css · limpieza de módulos base |
| — | — | Análisis PP-S-02 — cierre de gaps |
| — | — | css |
| — | — | Ítem de prueba — migrate item B-202605-018 |
| — | — | T-202605-004 — Eliminar radar-sidebar-expand-btn / activar strip |
| — | — | Eliminar lógica de borrador del textarea en cards de workers |
| — | — | QA B-202605-077 — debug functions namespace |
| — | — | R-A AC-5 — corrección clase error en confirmCorrectHora |
| — | — | R-202605-001 — Auditoría CSS automatizada (9 archivos) |
| — | — | T-202605-038 Fase 4b — Migrar bases huérfanas de locus-overrides.css a módulos canónicos |
| — | — | QA — B promote render/navigate · ciclo 2 |
| — | — | QA B-202605-017 · B-202605-021 · B-202605-501 |
| — | — | QA — B textarea CKPT repopula post-save |
| — | — | Sesión 1s01-fixes-exportFS — B-202605-513 AC2 fix |
| — | — | Verificación T-202605-021 — entrada duplicada tema light/dark |
| — | — | R Item Editor DUP-06 + R Quick Capture skip |
| — | — | Auditoría de CSS en proyecto PP |
| — | — | card |
| — | — | Backlog PP completo refinado — AC definitivos + reclasificación PP-S-01/02/03/04 |
| — | — | css |
| — | — | CSS |
| — | — | css |
| — | — | Actualización de Execution Plan — backlog post-s05 |
| — | — | T-A1 — Fix #sprint-close-overlay botón final con skipStep2=true |
| — | — | B-202605-008 — openNotifConfig falla silenciosamente con unseen = 0 |
| — | — | css |
| — | — | CSS |
| — | — | QA — B-202605-074 |
| — | — | Limpieza de duplicados + asignación PP-S-02 · Tab Sprint |
| — | — | QA S3s09 + S4s11 — B-075, B-076, R-013 |
| — | — | QA T-202605-509 — Toggle zona done Plan |
| — | — | Css |
| — | — | css |
| — | — | QA — Fix sidebar ticker render() completo |
| — | — | CSS |
| — | — | T-202605-508 — plan-item-code clickeable → navigateToItem |
| — | — | CSS |
| — | — | Fix B — showCheckpointPanel implementada en locus-checkpoint-viz.js |
| — | — | Especificación R — Auditoría CSS automatizada Locus |
| — | — | B-[pendiente-ID] — setItemRole orden _undoSnapshot/_blogLog |
| — | — | Fix 3 errores de arranque — duplicate var + ReferenceErrors bloqueantes |
| — | — | Diagnóstico errores consola + Fix A exitFocusMode |
| — | — | QA — T-202605-510 Timestamp de última actualización del plan |
| — | — | CSS |
| — | — | R1 error sprint + R2 dropzone listeners acumulados — Document Generator |
| — | — | AC update — B-202605-073 línea corregida |
| — | — | Migración de selectores CSS al módulo destino |
| — | — | CSS |
| — | — | PP-S-03 — B-048 · B-049 · B-051 · B-052 · B-058 |
| — | — | QA — B-202605-008 + B-202605-009 |
| — | — | s01-sprint-proyectosFS — B-202605-034 AC-4 verificado |
| — | — | T-202605-039 — QA CSS Purity + regresión visual R-202605-018 |
| — | — | CSS Over |
| — | — | AC cerrados — B promote render post-promote |
| — | — | QA R-202605-167 · R-202605-168 |
| — | — | QA — B dropzone + T renaming Document Generator |
| — | — | R reescrito — Disolver locus-overrides.css (scope correcto) |
| — | — | CSs CARD |
| — | — | Refinamiento de auditoría CSS ejecutable |
| — | — | CSS |
| — | — | Sesión 2s01 — B-202605-014 · B-202605-032 · B-202605-033 |
| — | — | Revisión del rsb-search |
| — | — | T-202605-534 — AC-3 fix index.html |
| — | — | CSS |
| — | — | P — parentId en schema de ítems de CHECKPOINT |
| — | — | T3 — Consolidar duplicados en locus-layout.css, locus-modals.css, locus-tracker.css, locus-proyectos.css |
| — | — | Fix .hidden alias — locus-base.css |
| — | — | Fix — EXECUTION-PLAN se borraba al guardar sesión |
| — | — | Especificación R — Backlog Focus Mode visual · .backlog-focus-mode |
| — | — | Especificación patrón inline confirm — T-A4a |
| — | — | CSS |
| — | — | CSS |
| — | — | R-202605-004 · QA aprobado — limpieza previa Fase A completa |
| — | — | Eliminar bases redundantes en módulos CSS |
| — | — | T-202605-035 — Inventario locus-overrides.css (Fase 1 R-202605-018) |
| — | — | QA auditoría AC — T-521/T-522 aprobados · T-526 bloqueado |
| — | — | CSS |
| — | — | R-172 · R-173 · R-174 · R-175 — checkpoint.js |
| — | — | Corrección de tipo — observación Finn sobre _offlineQueueFlush |
| — | — | R-202605-179 · Normalización de microinteracciones — Sesión 2 |
| — | — | AI Card latiendo y violaciones de setInterval |
| — | — | B-202605-018 — fix migrate item saveImmediate |
| — | — | Cierre de gap de especificación — R-202605-009 |
| — | — | Migración de selectores CSS a módulos destino |
| — | — | Resolución gap AC 4 — T-A4b + deuda Kanban |
| — | — | B-202605-074 — showCheckpointPanel early return silencioso |
| — | — | CSS |
| — | — | B fix — tab Sesiones visible en otros tabs |
| — | — | Z-index del menú más: diagnóstico de stacking context |
| — | — | OBS-01 resuelta — nota Cat A en overrides L64 grupo animación .pend-panel |
| — | — | css |
| — | — | Fix B-202605-019 — #more-menu z-index insuficiente |
| — | — | QA B-202605-023 — border-radius tokens |
| — | — | QA B-202605-021 — z-index token |
| — | — | CSS |
| — | — | T-202605-534 — cierre de AC-5 |
| — | — | T-202605-027 · Promote navigate — callback post-render |
| — | — | Auditoría item.desc — bug puntual en buildBacklogMd |
| — | — | QA — T-202605-506 |
| — | — | Brief de proyecto |
| — | — | Refinamiento C1 y C2 — hdr-search-trigger + more-menu verificación |
| — | — | Auditoría R-202605-013 — #more-menu z-index bug |
| — | — | css |
| — | — | QA · T-202605-027 · Promote navigate — callback post-render |
| — | — | css |
| — | — | CSS |
| — | — | Search |
| — | — | card |
| — | — | CSS |
| — | — | CSS |
| — | — | CSS |

---

_Generado por Locus v1.2 · 2026-05-23 00:26 UTC-6_
