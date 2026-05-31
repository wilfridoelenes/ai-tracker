# PP-Retrospectiva-PP-S-13 · Deprecaciones-2026-05-31.md
<!-- Sprint: PP-S-13 · Deprecaciones | Cerrado: 2026-05-31 | Generado: 2026-05-31 09:57 UTC-6 -->

---

## Sprint

| Campo | Valor |
|---|---|
| ID | PP-S-13 · Deprecaciones |
| Nombre | PP-S-13 · Deprecaciones |



| Cerrado | 2026-05-31 |
| Duración | 0 días |

---

## Resumen de progreso

| Métrica | Valor |
|---|---|
| Ítems comprometidos | 24 |
| Ítems completados | 24 (100%) |
| Ítems no completados | 0 |
| Effort total estimado | 27 |
| Effort completado | 27 (100%) |
| Effort pendiente | 0 |
| Vs sprint anterior | PP-S-11 · Sprint model UI · Migración handlers: 100% effort → este sprint 100% (0%) |

---

## ✅ Completados (24)

| Código | Título | Effort |
|--------|--------|--------|
| `R-202605-027` | Extraer vista Planificación a módulo propio | ●●○ (2) |
| `T-202605-089` | T1 · Auditar y mapear toda la lógica de Planificación en locus-backlog-render.js | ●○○ (1) |
| `T-202605-090` | T2 · Crear locus-sprint-planificacion.js y migrar lógica | ●○○ (1) |
| `T-202605-091` | T3 · Extraer CSS de Planificación a archivo propio si hay selectores exclusivos | ●○○ (1) |
| `R-202605-028` | Eliminar flujo de creación manual de ítems del IDP — mantener edición | ●●○ (2) |
| `T-202605-092` | T1 · Auditar referencias a locus-backlog-panel.js en todo el proyecto | ●○○ (1) |
| `T-202605-093` | T2 · Eliminar call sites y referencias HTML del IDP | ●○○ (1) |
| `T-202605-094` | T3 · Eliminar locus-backlog-panel.js e index.html script tag | ●○○ (1) |
| `R-202605-029` | Renombrar locus-item-editor.js a locus-backlog-editor.js y eliminar flujo de creación manual | ●●○ (2) |
| `T-202605-095` | T1 · Auditar call sites de locus-item-editor.js — confirmar que ninguno pertenece al flujo de edición del IDP | ●○○ (1) |
| `T-202605-096` | T2 · Eliminar call sites, handlers de paste y elementos HTML del editor manual — reemplazado por Ts nuevos | ●○○ (1) |
| `T-202605-097` | T3 · Eliminar locus-item-editor.js e index.html script tag — reemplazado por Ts nuevos | ●○○ (1) |
| `B-202605-040` | Botón 'Cerrar planificación' en tab Sprint no responde al click | ●○○ (1) |
| `B-202605-041` | _inlineEditTitle usa e.currentTarget desde delegación — apunta a listEl en lugar del span del título | ●○○ (1) |
| `B-202605-042` | Botón 'Cerrar planificación' en tab Sprint no responde al click | ●○○ (1) |
| `B-202605-043` | Tab Sprint muestra empty state en refresh cuando el tab estaba activo | ●○○ (1) |
| `B-202605-044` | Botón 'Cerrar planificación' en tab Sprint no responde al click | ●○○ (1) |
| `B-202605-045` | Tab Sprint muestra empty state en refresh cuando el tab estaba activo | ●○○ (1) |
| `B-202605-046` | _statusPills y toggleClosedSprintsBody permanecen definidas en locus-backlog-render.js — duplicación con locus-sprint-planificacion.js | ●○○ (1) |
| `T-202605-120` | T2 · Eliminar entry points de creación manual en el IDP | ●○○ (1) |
| `B-202605-047` | Search del backlog no filtra ítems — input acepta texto pero la lista no responde | ●○○ (1) |
| `B-202605-048` | Referencias fantasma onBacklogSearch y clearBacklogSearch en comentario de exports de locus-backlog-core.js L1926-1927 | ●○○ (1) |
| `T-202605-121` | T2 · Renombrar locus-item-editor.js a locus-backlog-editor.js y actualizar todos los imports | ●○○ (1) |
| `T-202605-122` | T3 · Eliminar flujo de creación manual — btn-new-backlog-item, paste items y elementos HTML relacionados | ●○○ (1) |

---

## ⏳ No completados

_Todos los ítems fueron completados. 🎉_

---

_Generado por Locus v1.0.7 · 2026-05-31 09:57 UTC-6_
