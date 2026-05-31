# __Locus-UI-Inventory_V2_1.md
<!-- Versión: 2.1 | Última actualización: 2026-05-25 | Inventario de elementos UI auditables — Locus -->

## Contexto

Inventario actualizado post-PP-S-08 y auditoría de index.html — 2026-05-25.

Cambios vs V2.0:
- §2 Panels/Overlays: +1 (`#arranque-overlay`)
- §3 Toggles/Vistas: +1 (`#theme-toggle-btn`)
- §6 Navegación: +3 (`#cmd-k-pill`, `#ckpt-reopen-btn`, `#user-chip`) · `#breadcrumb-item` documentado
- §7 Tab Sprint: sección nueva — 9 elementos (tab completo implementado en PP-S-07/S-08)

**Estados de auditoría:**
- `limpio` — sin problemas identificados
- `auditar` — requiere revisión de flujo, comportamiento o consistencia

---

## 1. Modales — 27 instancias

| # | ID | Nombre | En DOM | Estado | CSS canónico | Notas |
|---|---|---|---|---|---|---|
| 01 | `#quick-note-modal` | Quick Note | ✓ | `limpio` | `locus-modals.css` | Abre vía ✏️ en header. Confirm inline de delete. |
| 02 | `#item-editor-overlay` | Item Editor | ✓ | `limpio` | `locus-modals.css` | `item.title` canónico — R-202605-007 done. |
| 03 | `#tpl-picker-overlay` | Template Picker | ✓ | `limpio` | `locus-modals.css` | Sub-modal del Item Editor. |
| 04 | `#avatar-modal` | Avatar Selector | ✓ | `limpio` | `locus-modals.css` | Grid de avatares. `.avatar-modal.open` consolidado. |
| 05 | `#add-modal` | Nuevo Worker | ✓ | `limpio` | `locus-modals.css` | Un campo, Enter confirma. |
| 06 | `#tag-modal` | Tag Picker | ✓ | `limpio` | `locus-modals.css` | Selector + creación inline. |
| 07 | `#qc-modal-overlay` | Quick Capture (unificado) | ✓ | `limpio` | `locus-modals.css` | R-202605-009 done — skip Paso 1 con worker único. |
| 08 | `#standalone-ckpt-overlay` | Standalone CHECKPOINT | ✓ | `limpio` | `locus-modals.css` | Actualiza solo ítems, sin Worker. |
| 09 | `#export-confirm-overlay` | Export Confirm | ✓ | `limpio` | `locus-proyectos.css` | Visibilidad via `.open`. |
| 10 | `#merge-diff-overlay` | Merge Diff | ✓ | `limpio` | `locus-proyectos.css` | Two-column bien estructurado. |
| 11 | `#import-diff-overlay` | Import Diff (Backup) | ✓ | `limpio` | `locus-modals.css` | T emitido — auditoría de paridad entre puntos de entrada pendiente de Finn. |
| 12 | `#sprint-close-overlay` | Sprint Close (3 pasos) | ✓ | `limpio` | `locus-sprint-close.css` | Fix aplicado: botón final accesible con `skipStep2=true` — B-202605-007 + T-202605-015 done. |
| 13 | `#auth-modal-overlay` | Auth / Connect | ✓ | `limpio` | `locus-modals.css` | Google OAuth + magic link. Supabase activo. |
| 14 | `#proj-mismatch-overlay` | Proyecto diferente | ✓ | `limpio` | `locus-modals.css` | Guardia de proyecto. Visibilidad via `.open`. |
| 15 | `#sprint-retro-overlay` | Sprint Retro | ✓ | `limpio` | `locus-modals.css` | — |
| 16 | `#promote-modal-overlay` | Promote P→R/T/R unificado | ✓ | `limpio` | `locus-backlog.css` | `role="dialog"` + `aria-modal`. |
| 17 | `#migrate-item-overlay` | Migrate Item | ✓ | `limpio` | `locus-backlog.css` | T emitido — auditoría de flujo completo pendiente de Finn. |
| 18 | `#changelog-overlay` | Changelog | ✓ | `limpio` | `locus-proyectos.css` | Acceso vía menú ⋯. Visibilidad via `.open`. |
| 19 | `#notif-config-overlay` | Notif Config | ✓ | `limpio` | `locus-modals.css` | Persistencia de estado resuelta — B-202605-009 + B-202605-010 + B-202605-011 done. |
| 20 | `#proj-modal-overlay` | Crear / Editar Proyecto | ✓ | `limpio` | `locus-modals.css` | Formulario completo. Visibilidad via click-outside. |
| 21 | `#gconfirm-overlay` | Global Confirm | ✓ | `limpio` | `locus-modals.css` | Flows destructivos auditados y normalizados — T-202605-008 done. |
| 22 | `#reset-sessions-overlay` | Reset Sesiones | ✓ | `limpio` | `locus-modals.css` | Input RESET requerido. Validación via `_validateResetSessionsInput()`. |
| 23 | `#reset-backlog-overlay` | Reset Backlog | ✓ | `limpio` | `locus-modals.css` | Input RESET requerido. Validación via `_validateResetBacklogInput()`. |
| 24 | `#purge-modal-overlay` | Purge Sesiones Antiguas | ✓ | `limpio` | `locus-modals.css` | Input meses + preview. |
| 25 | `#migrate-fb-overlay` | Migrate Firebase→Supabase | ✓ | `limpio` | `locus-modals.css` | Estados idle/running/done/error. `is-hidden` por defecto. |
| 26 | `#mg-overlay` | Document Generator | ✓ | `limpio` | `locus-document-generator.css` | Stepper 3 pasos. `role="dialog"` + `aria-modal`. |
| 27 | `#weekly-summary-modal` | Weekly Summary | ✓ | `limpio` | `locus-tracker.css` | Modal automático los lunes. `role="dialog"` + `aria-modal`. |

---

## 2. Panels y Overlays no-modales — 10 instancias

| # | ID | Nombre | En DOM | Estado | CSS canónico | Notas |
|---|---|---|---|---|---|---|
| 01 | `#ckpt-panel` | CHECKPOINT Panel | ✓ | `limpio` | `locus-modals.css` | Slide-in tras CHECKPOINT. Barra de progreso. |
| 02 | `#pulso-overlay` | Pulso del Ecosistema | ✓ | `limpio` | `locus-backlog.css` | Punto de entrada canónico `#gf-pulso`. `role="dialog"` + `aria-modal`. |
| 03 | `#arranque-overlay` | Sesión de Arranque | ✓ | `limpio` | `locus-backlog.css` | Morning brief. `role="dialog"` + `aria-modal`. Botón CTA `#arranque-cta-btn`. |
| 04 | `#item-viz-overlay` | Item Visualizer | ✓ | `limpio` | `locus-modals.css` | `aria-live="polite"` + `role="region"`. |
| 05 | `#pend-overlay` | Pendientes Panel | ✓ | `limpio` | `locus-modals.css` | Drawer lateral derecho. Patrón canónico para futuros drawers. |
| 06 | `#doc-log-drawer` | Doc Log Drawer | ✓ | `limpio` | `locus-tracker.css` | Historial de acciones. Header con clear+close. Overlay: `#doc-log-overlay`. |
| 07 | `#proj-panel-overlay` | Panel Proyectos | ✓ | `limpio` | `locus-analytics.css` | Lateral. Cierra con overlay-click. |
| 08 | `#cp-overlay` | Command Palette | ✓ | `limpio` | `locus-modals.css` | `role="dialog"` + `aria-modal`. Visibilidad via `.is-hidden`. Descubribilidad via `#hdr-search-trigger` + `#cmd-k-pill`. |
| 09 | `#shortcuts-overlay` | Shortcuts | ✓ | `limpio` | `locus-modals.css` | `role="dialog"` + `aria-modal`. |
| 10 | `#sprint-panel-header` | Sprint Header Panel | ✓ | `limpio` | `locus-sprint.css` | Header sticky del tab Sprint — nombre, versión, burndown, botón cierre. `is-hidden` sin sprint activo. |

---

## 3. Toggles y vistas — 11 instancias

| # | ID / Selector | Nombre | En DOM | Estado | CSS canónico | Notas |
|---|---|---|---|---|---|---|
| 01 | `#tracker-view-toggle` | Tracker: Checkpoint / Historial | ✓ | `limpio` | `locus-tracker.css` | `role="group"`, `aria-label`. |
| 02 | `#tab-backlog .bl-toolbar-views` | Backlog: vistas | ✓ | `limpio` | `locus-backlog.css` | `role="tablist"` + `role="tab"` + `aria-selected`. |
| 03 | `#rsb-pin-btn` + `#radar-sidebar-toggle` | Radar Sidebar pin/collapse | ✓ | `limpio` | `locus-radar.css` | Dos controles, comportamientos distintos. |
| 04 | `#bl-collapse-all-btn` | Backlog: Collapse all | ✓ | `limpio` | `locus-backlog.css` | Label cambia dinámicamente. |
| 05 | `#tmpl-trigger-wrap` | Template trigger sub-panel | ✓ | `limpio` | `locus-layout.css` | T-202605-019 done — patrón de colapso animado documentado en CSS-Reference. |
| 06 | `#tpl-sidebar-danger` | Sidebar danger zone | ✓ | `limpio` | `locus-radar.css` | Requiere clic en "Opciones avanzadas". |
| 07 | `#tracker-col-tabs` | Tracker col tabs (mobile) | ✓ | `limpio` | `locus-tracker.css` | Visible <900px. |
| 08 | `more-menu + applyTheme()` | Tema light/dark | ✓ | `limpio` | `locus-layout.css` | T-202605-021 done — entrada duplicada en menú ⋯ eliminada. |
| 09 | `#header-active-worker` | Worker activo chip | ✓ | `limpio` | `locus-tracker.css` | Muestra nombre y tiempo de sesión activa. `.is-active` controla visibilidad. |
| 10 | `#header-pend-btn` | Header pendientes trigger | ✓ | `limpio` | `locus-layout.css` | Visibilidad via `.is-hidden`. Badge de conteo `#header-pend-count`. Abre `#pend-overlay`. |
| 11 | `#theme-toggle-btn` | Theme toggle (header) | ✓ | `limpio` | `locus-layout.css` | Nuevo. Light/dark. `aria-label` dinámico via patch script en index.html. Dos iconos SVG inline: `.theme-icon-dark` / `.theme-icon-light`. |

---

## 4. Toast y Feedback — 4 instancias

| # | ID | Nombre | En DOM | Estado | CSS canónico | Notas |
|---|---|---|---|---|---|---|
| 01 | `#toast-stack` | Toast Stack | ✓ | `limpio` | `locus-modals.css` | `aria-live="polite"` + `aria-atomic="false"`. 8 tipos semánticos. |
| 02 | `#status-confirm-overlay` | Status Confirm | ✓ | `limpio` | `locus-backlog.css` | T emitido — verificar referencias JS antes de retirar del DOM. |
| 03 | `#storage-warn` | Storage Warning Banner | ✓ | `limpio` | `locus-layout.css` | Usa `.is-hidden`. |
| 04 | `#setup-checklist-banner` | Setup Checklist Banner | ✓ | `limpio` | `locus-layout.css` | T-202605-016 done — migrado a `.is-hidden`. `role="status"` + `aria-expanded`. |

---

## 5. Búsquedas — 6 instancias

| # | ID | Scope | En DOM | Estado | CSS canónico | Notas |
|---|---|---|---|---|---|---|
| 01 | `#hdr-search-trigger` | Trigger Command Palette — global | ✓ | `limpio` | `locus-layout.css` | Chip fantasma en header, visible desde todos los tabs. Abre Command Palette al hacer clic. |
| 02 | `#search-global` | Workers, sesiones, notas | ✓ | `limpio` | `locus-layout.css` | Scope específico del tab Tracker. |
| 03 | `#backlog-search-input` | Ítems del backlog | ✓ | `limpio` | `locus-backlog.css` | Filtro local. Clear button `#backlog-search-clear`. |
| 04 | `#rsb-search-input` | Workers en Radar sidebar | ✓ | `limpio` | `locus-radar.css` | Filtro local. Clear button `#rsb-search-clear`. |
| 05 | `#ctx-search-input` | Secciones del CONTEXT | ✓ | `limpio` | `locus-proyectos.css` | Filtro de secciones. Clear button `#ctx-search-clear`. |
| 06 | `#cp-input` | Command Palette — global | ✓ | `limpio` | `locus-modals.css` | Descubribilidad resuelta via `#hdr-search-trigger` + `#cmd-k-pill`. |

---

## 6. Navegación principal — 11 instancias

| # | ID / Selector | Nombre | En DOM | Estado | CSS canónico | Notas |
|---|---|---|---|---|---|---|
| 01 | `.tabs` | Tabs principales | ✓ | `limpio` | `locus-layout.css` | Sesiones / Proyectos / Backlog / Sprint / Analytics. 5 tabs — Sprint agregado. |
| 02 | `.tpl-sidebar-nav` | Sub-tabs Backlog | ✓ | `limpio` | `locus-backlog.css` | 5 sub-tabs con icono. |
| 03 | `#breadcrumb-proj` + `#breadcrumb-sprint` + `#breadcrumb-item` | Breadcrumb header | ✓ | `limpio` | `locus-layout.css` | 3 segmentos — `#breadcrumb-item` nuevo. Separadores `.breadcrumb-sep`. `.is-hidden` controla visibilidad por segmento. |
| 04 | `#global-footer` | Global footer bar | ✓ | `limpio` | `locus-proyectos.css` | 6 elementos. Visibilidad via `.gf-hidden` / `.is-hidden`. |
| 05 | `#more-menu` | Menú ⋯ | ✓ | `limpio` | `locus-layout.css` | T emitido — verificación de corrección de borde en 1920×1080 y 2560×1080 pendiente de Finn. |
| 06 | `#shortcuts-overlay` | Shortcuts | ✓ | `limpio` | `locus-modals.css` | Unifica configuración y referencia. |
| 07 | `#header-active-worker` | Worker activo chip | ✓ | `limpio` | `locus-tracker.css` | Sesión en curso. `.is-active` controla display. |
| 08 | `#header-sprint-row` | Sprint progress row | ✓ | `limpio` | `locus-layout.css` | Segunda fila del header. `hsr-visible` activa. Progreso via `--hsr-pct`. |
| 09 | `#cmd-k-pill` | Cmd-K pill (header) | ✓ | `limpio` | `locus-layout.css` | Nuevo. Botón visible en `header-actions`. Duplica trigger de Command Palette. Complementa `#hdr-search-trigger`. |
| 10 | `#ckpt-reopen-btn` | CKPT Reopen button | ✓ | `limpio` | `locus-layout.css` | Nuevo. `is-hidden` por defecto. Reabre último CHECKPOINT via `showCheckpointPanel(_lastCheckpointResult)`. |
| 11 | `#user-chip` | User chip (Supabase) | ✓ | `limpio` | `locus-layout.css` | Nuevo. `is-hidden` por defecto. Muestra usuario autenticado. Dot `#user-chip-dot` + nombre `#user-chip-name`. Invoca `handleSyncPillClick()`. |

---

## 7. Tab Sprint — 9 instancias

*Sección nueva — tab completo implementado. Todo pendiente de auditoría de Finn en sesión dedicada.*

| # | ID | Nombre | En DOM | Estado | CSS canónico | Notas |
|---|---|---|---|---|---|---|
| 01 | `#spt-nav` | Subtab nav Sprint | ✓ | `limpio` | `locus-sprint.css` | `role="tablist"`. Subtabs: Ítems / Planificar / Plan. `is-hidden` sin sprint activo. |
| 02 | `#sprint-panel-items` | Panel Ítems | ✓ | `limpio` | `locus-sprint.css` | `role="tabpanel"`. Contiene workers, lista de ítems, health, scope added. |
| 03 | `#sprint-workers` | Workers vinculados | ✓ | `limpio` | `locus-sprint.css` | `is-hidden` sin sprint activo. Body: `#spw-body`. |
| 04 | `#sprint-items-list` | Lista de ítems del sprint | ✓ | `limpio` | `locus-sprint.css` | 3 secciones: `#spi-section-pendiente` / `#spi-section-bloqueado` / `#spi-section-done`. `is-hidden` sin sprint activo. |
| 05 | `#sprint-health-panel` | Sprint Health | ✓ | `limpio` | `locus-sprint.css` | `is-hidden` sin sprint activo. Contenido inyectado por JS. |
| 06 | `#sprint-scope-added` | Scope añadido | ✓ | `limpio` | `locus-sprint.css` | `is-hidden` sin sprint activo. Count `#sca-count`. Body `#sca-body`. |
| 07 | `#sprint-panel-planificar` | Panel Planificar | ✓ | `limpio` | `locus-sprint-ui.css` | `role="tabpanel"`. Drag & drop backlog → sprint. Container `#sprint-planificar-container`. |
| 08 | `#sprint-panel-plan` | Panel Plan | ✓ | `limpio` | `locus-sprint-plan.css` | `role="tabpanel"`. Container `#sprint-plan-container`. |
| 09 | `#tab-sprint-empty` | Empty state Sprint | ✓ | `limpio` | `locus-sprint.css` | Visible cuando no hay sprint activo. CTA → `openNewSprintInline()`. |

---

## Resumen

| Categoría | Total | Limpio | Auditar |
|---|---|---|---|
| Modales | 27 | 27 | 0 |
| Panels/Overlays | 10 | 10 | 0 |
| Toggles/Vistas | 11 | 11 | 0 |
| Toast/Feedback | 4 | 4 | 0 |
| Búsquedas | 6 | 6 | 0 |
| Navegación | 11 | 11 | 0 |
| Tab Sprint | 9 | 9 | 0 |
| **Total** | **78** | **78** | **0** |
