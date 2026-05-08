# PP-CONTEXT_V1_1.md
<!-- Versión: 1.1 | Última actualización: 2026-05-08 | AI Tracker — fuente de verdad del proyecto -->

---

## 1. Identidad

| Campo | Valor |
|---|---|
| Nombre | AI Tracker |
| Alias | PEPE |
| Tipo | Herramienta interna — gestión de backlog, contexto y sesiones del ecosistema |
| Holding | Obsidian Labs |
| Estado | Prototipo activo — post-reset |
| Archivo activo | `index.html` |
| Stack | Single-file HTML + JS vanilla + localStorage |

---

## 2. Estado actual

| Campo | Valor |
|---|---|
| Versión activa | v1.0.0 |
| Sprint activo | PP-S-01 — por abrir (post-reset) |
| Sprints históricos | PP-S-01 a PP-S-25 reseteados |
| Fase de ecosistema | Reset completado — Fases 1–4 ejecutadas |

---

## 3. Roles

| Rol | Nombre | Sigla | Función |
|---|---|---|---|
| PO + BA Transversal | Cael | PO | Especificación, backlog, criterios de aceptación |
| FS Transversal | Rune | FS | Implementación técnica, entregables de código |
| UX Transversal | Nova | UX | Auditoría de experiencia, restricciones de UI |
| CGO + UR | Lena | GW | Auditoría de conversión y activación |
| QA Transversal | Finn | QA | Testing funcional, gaps de AC |

---

## 4. Funcionalidades activas (estado al reset)

- **Tab Sesiones:** Registro de sesiones con Workers (IAs). Textarea de ingesta de CHECKPOINT. Fase-bar por sesión. Log de historial.
- **Tab Documentos / Backlog:** Backlog con vistas Sprints / Árbol / Kanban / Focus / Planificar. Editor de ítems (IDP). Drag & Drop. Resumen semanal exportable.
- **Tab Analytics:** Heatmap de actividad (patrón GitHub). KPIs comparativos. Forecast de sprints. Distribución horaria.
- **Tab Proyectos:** Gestión de proyectos. Selector de proyecto activo con auto-selección del primero activo al init.
- **Tab Templates / Map Generator:** Generación de EXECUTION-PLAN y MAP desde archivos reales.
- **Command Palette:** Accesible via ⌘K / Ctrl+K. Búsqueda global de sesiones, workers, notas, backlog, proyectos.
- **Sidebar Workers (Centro de notificaciones):** Lista de Workers con estado de actividad, countdown de reset, notificaciones.
- **Supabase sync:** Opcional. Sin auth → datos solo locales.
- **Tema:** Light/Dark. Guardado en localStorage.

---

## 5. Archivos del proyecto

| Archivo | Función | Módulos principales |
|---|---|---|
| `index.html` | Shell estático + estilos inline legacy | DOM principal, modales, sidebar |
| `ai-tracker.css` | Estilos principales | Tema, layout, componentes base |
| `ai-tracker-extra.css` | Estilos extendidos | Backlog, IDP, analytics, plan display |
| `ai-tracker-backlog.js` | Motor del backlog | loadBacklog, setItemStatus, buildBacklogItem, mergeBacklogFromTG |
| `ai-tracker-checkpoint.js` | Parser y display de CHECKPOINTs | parsePaste, showCheckpointPanel, buildTGPreview, CANONICAL mapa de prefijos |
| `ai-tracker-session.js` | Gestión de sesiones | saveSession, CANONICAL_PROJECTS, _offlineQueuePush |
| `ai-tracker-sprint-project.js` | Sprints y proyectos | openSprint, closeSprint, _scmRender, getActiveSprints |
| `ai-tracker-command-palette.js` | Command palette | openCommandPalette, _buildDynamicCommands, _cpSearchContext |

**Nota:** Los archivos JS son módulos externos cargados desde `index.html`. La disponibilidad de funciones en runtime depende de que los módulos carguen correctamente — varios bugs del backlog nuevo están relacionados con ausencia de guards para módulos externos.

---

## 6. Deuda técnica crítica — hallazgos del reset

Las auditorías de reset (Fases 1–3) identificaron deuda técnica significativa. Los hallazgos completos viven en PP-BACKLOG-nuevo.md. Resumen por cluster y sprint asignado:

| Cluster | Descripción | PP-S-01 | PP-S-02 | Diferidos |
|---|---|---|---|---|
| A — Bugs críticos | Bloquean flujos core o corrupción de datos | ✅ Todos (~33 ítems) | — | 0 |
| B — Bugs mayores | Impacto en flujos secundarios y performance | — | ✅ Todos (~17 ítems) | 0 |
| C — Rs experiencia/conversión | UX, onboarding, activación | — | ✅ Con AC cerrados por Nova | Rs con UI sin AC → PP-S-02 pre-Nova |
| D — Bugs menores y deuda técnica | Performance, compatibilidad, cleanup | — | — | ~30 ítems en `futura` → PP-S-03+ |

**Bugs de mayor severidad identificados:**
- `_scmRender` — botón Cerrar sprint inaccesible con skipStep2=true
- `openItemEditor` sin guardia — falla silenciosa si módulo externo no carga
- `CANONICAL_PROJECTS` con strings deprecados ('Obsidiana', 'Obsidiana Labs')
- `buildBacklogMd` y `buildTGPreview` usan `item.desc` en lugar de `item.title` (schema v1)
- `_hasStaleSuggestion` — sistema de sugerencias nunca activa (compara contra schema legacy)
- `_offlineQueuePush` — deduplicación solo por type → pérdida silenciosa de writes en multi-proyecto
- DOM duplicado de command palette (#cmd-palette-overlay vs #cp-overlay activo)

---

## 7. Sprints — estructura post-reset

### PP-S-01 · Bugs críticos — foundation y flujos core

| Campo | Valor |
|---|---|
| Estado | Por abrir — pendiente auditoría pre-sprint de Vera |
| version_target | `v1.0.0` |
| release_type | `Major` |
| Scope | Cluster A completo (33 bugs críticos) + gaps de seguridad/integridad + T CANONICAL |
| Excluido | Cluster B · Rs con Nova · Cluster D |

**Requisito antes de abrir:** Vera ejecuta auditoría pre-sprint — verificar que todos los Rs de PP-S-01 pasaron por Protocolo de Especificación de Cael.

### PP-S-02 · Bugs mayores y Rs de experiencia

| Campo | Valor |
|---|---|
| Estado | No abierto — depende de cierre de PP-S-01 |
| Scope | Cluster B (17 bugs mayores) + Rs de conversión/experiencia de Cluster C |
| Requisito pre-apertura | Nova cierra AC de 4 Rs con bloqueo UI antes de que Vera abra este sprint |

**4 Rs pendientes de Nova antes de PP-S-02:**
- Empty state Sesiones+Documentos
- Checklist de setup visible
- Sprint version_target + release_type
- Backlog status chip inline

### PP-S-03+

Cluster D (~30 ítems en `futura`) — se distribuye con velocity histórica real post PP-S-01.

---

## 8. Protocolo de parseo de CHECKPOINT

| Campo | Regla activa |
|---|---|
| `Proyecto:` | Validado contra CANONICAL_PROJECTS en ai-tracker-session.js — ver B de CANONICAL_PROJECTS en backlog |
| `---ITEMS---` | Parseado por mergeBacklogFromTG — JSON array |
| `---EXECUTION-PLAN---` | Parseado por _tryIngestPlan — scope sprint o sesion |
| `CONTEXT-SECTION:` | Ignorado por el parser — campo informativo |
| `MAP-SECTION:` | Eliminado del protocolo — no se parsea |

---

## 9. Decisiones

| Fecha | Decisión | Contexto |
|---|---|---|
| 2026-04-26 | PP (PEPE) renombrado — AI Tracker es el string canónico | OL-CONTEXT §7 |
| 2026-04-27 | MAP-SECTION eliminado del protocolo CHECKPOINT | MAP se genera desde archivos reales al cierre de sprint |
| 2026-05-06 | Holding actualizado a Obsidian Labs | String canónico: Obsidian Labs. Prefijo: OL |
| 2026-05-07 | Reset del ecosistema ejecutado — Fases 1–4 completadas | PP-S-01 a PP-S-25 reseteados. Backlog nuevo en PP-BACKLOG-nuevo.md |
| 2026-05-07 | Versión app reseteada a v1.0.0 | Decisión Vera — Fase 5 del plan de reset |
| 2026-05-07 | CONTEXT reseteado a V1.0 | Decisión Vera — todos los CONTEXTs de producto arrancan en V1.0 post-reset |
| 2026-05-08 | PP-S-01 scope cerrado — solo Cluster A + gaps críticos + T CANONICAL | Decisión Vera — Cluster B y Rs con Nova a PP-S-02 |
| 2026-05-08 | PP-S-01 nombre canónico definido | `PP-S-01 · Bugs críticos — foundation y flujos core` |
| 2026-05-08 | PP-S-02 scope definido — Cluster B + Rs conversión post-Nova | Nova debe cerrar AC de 4 Rs antes de apertura de PP-S-02 |

---

## 10. Notas de sesión

**2026-05-07 — Fase 4 Reset del ecosistema — Cael**
- Backlog nuevo consolidado en PP-BACKLOG-nuevo.md desde outputs de:
  - Fase 1 (Rune): informe técnico con bugs y deuda técnica mapeados
  - Fase 2 (Finn): auditoría funcional con gaps de AC y bugs clasificados
  - Fase 3 (Nova sesiones 3a/3b): fricciones de experiencia en primer uso y uso sostenido
  - Fase 3 (Lena sesiones 3c/3d/3e): hallazgos de conversión e hipótesis if/then/because
- Historial PP-S-01 a PP-S-25 reseteado — no heredado al backlog nuevo
- Próximo paso: Vera auditoría pre-sprint → abrir PP-S-01

**2026-05-07 — Fase 5 Reset del ecosistema — Cael**
- CONTEXT reseteado a V1.0 — versión app v1.0.0, sprint activo PP-S-01
- Decisión de versionado aplicada per Vera: CONTEXTs de producto arrancan en V1.0 post-reset

**2026-05-08 — Cierre de scope pre-reset — Vera**
- Scope de PP-S-01 y PP-S-02 cerrado y registrado
- PP-CONTEXT actualizado a V1.1 con estructura de sprints corregida
- Próximo paso: founder ejecuta Fase 5 (reset manual en PP) → Vera auditoría pre-sprint → abrir PP-S-01

---

## 11. Commands (rol → documentos de sesión)

| Rol | Documentos de sesión |
|---|---|
| ST · Vera | Base Rules + Role-Vera + OL-CONTEXT |
| GW · Lena | Base Rules + Role-Lena + OL-CONTEXT |
| CPO · Noa | Base Rules + Role-Noa + OL-CONTEXT |
| CMO · Maya | Base Rules + Role-Maya + OL-CONTEXT |
| PO · Cael | Base Rules + Role-Cael + OL-CONTEXT + CONTEXT-[proyecto] + Backlog-[proyecto] |
| FS · Rune | Base Rules + Role-Rune + OL-CONTEXT + CONTEXT-[proyecto] + Backlog-[proyecto] + MAP-[proyecto] |
| UX · Nova | Base Rules + Role-Nova + OL-CONTEXT + CONTEXT-[proyecto] + Brief-Noa (si existe) |
| CC · Flux | Base Rules + Role-Flux + OL-CONTEXT + Brief-Maya (si existe) |
| ET · Eden | Base Rules + Role-Eden + CONTEXT-CM + Arquitectura-Curricular-[sección activa] |
| GC · Sage | Base Rules + Role-Sage + CONTEXT-CM + Arquitectura-Curricular-[sección activa] |
| QA · Finn | Base Rules + Role-Finn + OL-CONTEXT + CONTEXT-[proyecto] + Backlog-[proyecto] |
| DA · Iris | Base Rules + Role-Iris + OL-CONTEXT + Dashboard-métricas (si existe) |
