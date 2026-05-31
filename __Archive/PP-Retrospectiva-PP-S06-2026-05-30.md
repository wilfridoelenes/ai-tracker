# PP-Retrospectiva-PP-S06-2026-05-30.md
<!-- Sprint: PP-S06 · ES MODULES | Cerrado: 2026-05-30 | Generado: 2026-05-30 05:00 UTC-6 -->

---

## Sprint

| Campo | Valor |
|---|---|
| ID | PP-S06 |
| Nombre | PP-S06 · ES MODULES |

| Versión | v1.0.7 |
| Release  | Patch |
| Cerrado | 2026-05-30 |
| Duración | 2 días |

---

## Resumen de progreso

| Métrica | Valor |
|---|---|
| Ítems comprometidos | 38 |
| Ítems completados | 30 (79%) |
| Ítems no completados | 8 |
| Effort total estimado | 56 |
| Effort completado | 46 (82%) |
| Effort pendiente | 10 |
| Vs sprint anterior | PP-S04 · TAB SEsiones: 6% effort → este sprint 82% (+76%) |

---

## ✅ Completados (30)

| Código | Título | Effort |
|--------|--------|--------|
| `R-202605-014` | Auditoría de colocación de módulos JS — locus-misc-ui.js | ●●○ (2) |
| `T-202605-019` | Mover funciones con módulo dueño claro; emitir Ts para casos con módulo faltante | ●●○ (2) |
| `R-202605-018` | Fase 1B — Eliminar handlers inline: navegación y layout global | ●●○ (2) |
| `R-202605-020` | Fase 1D — Eliminar handlers inline: storage, auth, sesiones y danger zones | ●●● (3) |
| `T-202605-063` | Migración inline handlers: locus-sesiones-arranque.js + locus-sprint-project.js + locus-notifications.js — QA end-to-end | ●●○ (2) |
| `R-202605-021` | Fase 2 — Convertir arquitectura JS a ES Modules | ●●● (3) |
| `T-202605-033` | Fase 1A Capa B — Migrar handlers dinámicos: locus-modals + locus-contracts + locus-sesiones-capture | ●○○ (1) |
| `T-202605-034` | Fase 1A Capa B — Migrar handlers dinámicos: locus-docs | ●○○ (1) |
| `B-202605-017` | cancelInterruptInline depende de onclick*='confirmInterruptInline' en botón generado por locus-sesiones.js | ●○○ (1) |
| `P-202605-018` | Ajustar redacción de AC-6 en futuros Ts de migración parcial — declarar scope explícito o listar handlers específicos | ●○○ (1) |
| `T-202605-047` | T1 · Migrar handlers inline — locus-backlog-core.js | ●●○ (2) |
| `T-202605-048` | T2 · Migrar handlers inline — locus-backlog-item.js + locus-backlog-render.js | ●●○ (2) |
| `T-202605-049` | T3 · Migrar handlers inline — locus-backlog-panel.js + locus-backlog-sprints.js | ●●○ (2) |
| `T-202605-050` | T4 · Migrar handlers inline — locus-misc-ui.js | ●○○ (1) |
| `T-202605-051` | T4 · Migrar onclick en _sprintItemHtml — event delegation en #sprint-items-list | ●○○ (1) |
| `T-202605-052` | T5 · Migrar onclick en _spmPickerOpen — event delegation en contenedor del picker | ●○○ (1) |
| `T-202605-055` | T3 · Migrar handlers inline — locus-backlog-panel.js + locus-backlog-sprints.js | ●●○ (2) |
| `B-202605-019` | R-202605-018 — on* de scope persisten en index.html (17 instancias) y en template literals de locus-ui-shell.js · locus-radar.js · locus-sesiones.js | ●●○ (2) |
| `T-202605-058` | Migrar handlers estáticos — locus-sprint.js | ●○○ (1) |
| `T-202605-059` | Verificar handlers estáticos — locus-backlog-core.js · locus-backlog-item.js · locus-backlog-render.js · locus-backlog-panel.js · locus-backlog-sprints.js | ●○○ (1) |
| `T-202605-062` | Migración inline handlers: locus-session-popup.js + locus-sesiones-viz.js + locus-sesiones-stats.js | ●●○ (2) |
| `T-202605-064` | Migración on* estáticos en index.html — secciones proj-panel, proj-modal y notif-config | ●●○ (2) |
| `B-202605-023` | { once: true } en delegation handler de _renderProjList elimina listener tras primer click — segunda operación CRUD no dispara | ●○○ (1) |
| `T-202605-065` | T1 · Auditoría de handlers inline en index.html | ●○○ (1) |
| `T-202605-066` | T2 · Migrar <script src> a type=module en index.html | ●○○ (1) |
| `T-202605-068` | T4 · Agregar imports entre módulos y eliminar typeof guards | ●●○ (2) |
| `T-202605-069` | T5 · Migrar locus-api.js: re-export + bridge window.Locus para handlers inline | ●○○ (1) |
| `T-202605-070` | T6 · Emitir P: migrar handlers inline a addEventListener | ●○○ (1) |
| `B-202605-024` | Dead code — modal migración Firebase→Supabase y handlers huérfanos en index.html | ●○○ (1) |
| `B-202605-025` | Colisión pad: contracts.pad(s,n)→padEnd vs sprint-project.pad(n)→padStart — renombrar antes de T4 | ●○○ (1) |

---

## ⏳ No completados (8)

| Código | Título | Effort |
|--------|--------|--------|
| `P-202605-015` | AC condicionales en Ts de refactor — reescribir como condiciones binarias separadas | ●○○ (1) |
| `P-202605-019` | Consolidar handlers data-action openAddAI/openProjModal en delegación global de locus-ui-shell.js | ●○○ (1) |
| `P-202605-021` | AC de Ts con botones de advertencia — cubrir explícitamente el comportamiento de cada botón migrado | ●○○ (1) |
| `P-202605-022` | Migrar handlers inline de index.html a addEventListener | ●●○ (2) |
| `P-202605-023` | Refactorizar init y onConfirm en locus-backlog-sprints.js como funciones top-level exportables | ●○○ (1) |
| `P-202605-024` | Limpiar window.* redundantes en locus-misc-ui.js — openStandaloneCheckpoint, closeStandaloneCheckpoint, getCD, _resetExpired, getNextOccurrence ya expuestos desde módulos dueños | ●○○ (1) |
| `P-202605-026` | Refactor: extraer lógica de detección de sesión activa a locus-storage.js — _isInSession y _getCurrentSession tienen lógica duplicada con riesgo de divergencia | ●●○ (2) |
| `P-202605-027` | Auditar fmt12 y _hoyMsUntilReset en locus-radar.js — también usan window.* fallback y tampoco están expuestas en window, posibles bugs silenciosos | ●○○ (1) |

---

## ➕ Scope añadido durante el sprint (38)

| Código | Título | Effort |
|--------|--------|--------|
| `R-202605-014` | Auditoría de colocación de módulos JS — locus-misc-ui.js | ●●○ (2) |
| `T-202605-019` | Mover funciones con módulo dueño claro; emitir Ts para casos con módulo faltante | ●●○ (2) |
| `R-202605-018` | Fase 1B — Eliminar handlers inline: navegación y layout global | ●●○ (2) |
| `R-202605-020` | Fase 1D — Eliminar handlers inline: storage, auth, sesiones y danger zones | ●●● (3) |
| `T-202605-063` | Migración inline handlers: locus-sesiones-arranque.js + locus-sprint-project.js + locus-notifications.js — QA end-to-end | ●●○ (2) |
| `R-202605-021` | Fase 2 — Convertir arquitectura JS a ES Modules | ●●● (3) |
| `T-202605-033` | Fase 1A Capa B — Migrar handlers dinámicos: locus-modals + locus-contracts + locus-sesiones-capture | ●○○ (1) |
| `T-202605-034` | Fase 1A Capa B — Migrar handlers dinámicos: locus-docs | ●○○ (1) |
| `B-202605-017` | cancelInterruptInline depende de onclick*='confirmInterruptInline' en botón generado por locus-sesiones.js | ●○○ (1) |
| `P-202605-015` | AC condicionales en Ts de refactor — reescribir como condiciones binarias separadas | ●○○ (1) |
| `P-202605-018` | Ajustar redacción de AC-6 en futuros Ts de migración parcial — declarar scope explícito o listar handlers específicos | ●○○ (1) |
| `T-202605-047` | T1 · Migrar handlers inline — locus-backlog-core.js | ●●○ (2) |
| `T-202605-048` | T2 · Migrar handlers inline — locus-backlog-item.js + locus-backlog-render.js | ●●○ (2) |
| `T-202605-049` | T3 · Migrar handlers inline — locus-backlog-panel.js + locus-backlog-sprints.js | ●●○ (2) |
| `T-202605-050` | T4 · Migrar handlers inline — locus-misc-ui.js | ●○○ (1) |
| `T-202605-051` | T4 · Migrar onclick en _sprintItemHtml — event delegation en #sprint-items-list | ●○○ (1) |
| `T-202605-052` | T5 · Migrar onclick en _spmPickerOpen — event delegation en contenedor del picker | ●○○ (1) |
| `T-202605-055` | T3 · Migrar handlers inline — locus-backlog-panel.js + locus-backlog-sprints.js | ●●○ (2) |
| `B-202605-019` | R-202605-018 — on* de scope persisten en index.html (17 instancias) y en template literals de locus-ui-shell.js · locus-radar.js · locus-sesiones.js | ●●○ (2) |
| `P-202605-019` | Consolidar handlers data-action openAddAI/openProjModal en delegación global de locus-ui-shell.js | ●○○ (1) |
| `T-202605-058` | Migrar handlers estáticos — locus-sprint.js | ●○○ (1) |
| `T-202605-059` | Verificar handlers estáticos — locus-backlog-core.js · locus-backlog-item.js · locus-backlog-render.js · locus-backlog-panel.js · locus-backlog-sprints.js | ●○○ (1) |
| `T-202605-062` | Migración inline handlers: locus-session-popup.js + locus-sesiones-viz.js + locus-sesiones-stats.js | ●●○ (2) |
| `P-202605-021` | AC de Ts con botones de advertencia — cubrir explícitamente el comportamiento de cada botón migrado | ●○○ (1) |
| `T-202605-064` | Migración on* estáticos en index.html — secciones proj-panel, proj-modal y notif-config | ●●○ (2) |
| `B-202605-023` | { once: true } en delegation handler de _renderProjList elimina listener tras primer click — segunda operación CRUD no dispara | ●○○ (1) |
| `T-202605-065` | T1 · Auditoría de handlers inline en index.html | ●○○ (1) |
| `T-202605-066` | T2 · Migrar <script src> a type=module en index.html | ●○○ (1) |
| `T-202605-068` | T4 · Agregar imports entre módulos y eliminar typeof guards | ●●○ (2) |
| `T-202605-069` | T5 · Migrar locus-api.js: re-export + bridge window.Locus para handlers inline | ●○○ (1) |
| `T-202605-070` | T6 · Emitir P: migrar handlers inline a addEventListener | ●○○ (1) |
| `P-202605-022` | Migrar handlers inline de index.html a addEventListener | ●●○ (2) |
| `B-202605-024` | Dead code — modal migración Firebase→Supabase y handlers huérfanos en index.html | ●○○ (1) |
| `P-202605-023` | Refactorizar init y onConfirm en locus-backlog-sprints.js como funciones top-level exportables | ●○○ (1) |
| `B-202605-025` | Colisión pad: contracts.pad(s,n)→padEnd vs sprint-project.pad(n)→padStart — renombrar antes de T4 | ●○○ (1) |
| `P-202605-024` | Limpiar window.* redundantes en locus-misc-ui.js — openStandaloneCheckpoint, closeStandaloneCheckpoint, getCD, _resetExpired, getNextOccurrence ya expuestos desde módulos dueños | ●○○ (1) |
| `P-202605-026` | Refactor: extraer lógica de detección de sesión activa a locus-storage.js — _isInSession y _getCurrentSession tienen lógica duplicada con riesgo de divergencia | ●●○ (2) |
| `P-202605-027` | Auditar fmt12 y _hoyMsUntilReset en locus-radar.js — también usan window.* fallback y tampoco están expuestas en window, posibles bugs silenciosos | ●○○ (1) |

---

_Generado por Locus v1.0.3 · 2026-05-30 05:00 UTC-6_
