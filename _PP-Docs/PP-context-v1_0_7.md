# PP-CONTEXT_V1_0_7.md
<!-- Versión: 1.0.7 | Última actualización: 2026-05-31 | Locus — fuente de verdad del proyecto -->

---

## 1. Identidad

| Campo | Valor |
|---|---|
| Nombre | Locus |
| Alias | PEPE · AI Tracker |
| Tipo | Herramienta interna — gestión de backlog, contexto y sesiones del ecosistema |
| Holding | Obsidian Labs |
| Estado | Prototipo activo — Fases A + B + C del refactor JS completas |
| Archivo activo | `index.html` |
| Stack | Single-file HTML + JS modular + CSS modular + Supabase — conteo de módulos → ver MAP activo |

---

## 2. Estado actual

| Campo | Valor |
|---|---|
| Versión activa | v1.2.3 |
| Sprint activo | **Ver backlog exportado — fuente de verdad del sprint activo en sesión** |
| Sprint anterior | PP-S-08 · Refactor estructural CSS — locus-backlog.css |
| Fase de refactor JS | Fase A ✅ completa · Fase B ✅ completa · Fase C ✅ completa · Fase B(api) ✅ completa |

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

## 4. Modelo de persistencia

| Decisión | Valor |
|---|---|
| Storage primario | Supabase |
| localStorage | Caché / fallback — solo para continuidad de sesión activa |
| Auth | Requisito core — sin auth no hay modo válido de operación |
| Modelo de usuario | Un solo usuario (founder) — multi-dispositivo previsto |
| Multi-dispositivo | Mismo usuario, sincronización via Supabase |
| Offline mode | No requerido — degradación visible es suficiente |
| Historial versionado | No requerido — estado actual siempre sincronizado |

**Estado actual (Fase C completa):** Supabase es el storage primario. `save()` tiene paths separados — sin auth → localStorage, offline → localStorage + queue, online+auth → debounce a Supabase únicamente. localStorage es fallback real, no write-to-both.

**Implicaciones técnicas:**
- localStorage no es fuente de verdad — cualquier write debe confirmarse en Supabase
- Auth no es feature opcional — es prerequisito de cualquier operación de escritura
- Sync no es background task — es el flujo principal

---

## 5. Viewport y plataforma

| Decisión | Valor |
|---|---|
| Viewports soportados | 1920×1080 · 2560×1080 |
| Formato | Wide y Ultrawide — solo desktop |
| Mobile / tablet | No soportado |
| Breakpoints | Solo entre los dos viewports declarados |

**Implicación para Nova:** Todo diseño de Locus es desktop-only. `_Locus-css-ref` y `_Locus-ux-ref` se declaran con esta restricción como invariante.

---

## 6. Funcionalidades activas

- **Tab Sesiones:** Registro de sesiones con Workers (IAs). Textarea de ingesta de CHECKPOINT. Fase-bar por sesión. Log de historial.
- **Tab Documentos / Backlog:** Backlog con vistas Sprints / Árbol / Kanban / Focus / Planificar. Editor de ítems (IDP). Drag & Drop. Resumen semanal exportable.
- **Tab Analytics:** Heatmap de actividad (patrón GitHub). KPIs comparativos. Forecast de sprints. Distribución horaria.
- **Tab Proyectos:** Gestión de proyectos. Selector de proyecto activo con auto-selección del primero activo al init.
- **Tab Sprint:** Panel de control unificado del sprint activo — ítems, workers, scope added, burndown, acciones de sprint. Sub-tabs: Ítems / Planificar / Plan.
- **Tab Templates / Map Generator:** Generación de EXECUTION-PLAN y MAP desde archivos reales.
- **Command Palette:** Accesible via ⌘K / Ctrl+K. Búsqueda global de sesiones, workers, notas, backlog, proyectos.
- **Sidebar Workers (Radar / Centro de notificaciones):** Lista de Workers con estado de actividad, countdown de reset, notificaciones.
- **Toast system:** Stack de hasta 3 toasts simultáneos con queue, prioridad, stagger y progress bar.
- **Panel Pulso:** Estado del ecosistema — velocidad, proyectos activos, bloqueantes, sprints estancados, planes activos.
- **Modal system:** Generic confirm/prompt modal + focus management transversal.
- **HTML MAP viewer:** Render modular de MAP con filtro por archivo, búsqueda y toggle de módulos.
- **Supabase sync:** Primario (Fase C completa — storage limpio). Sin auth → localStorage como fallback.
- **Quick Capture:** Modal stepper 2 pasos — selector de Worker + formulario de sesión rápida.
- **Archivo histórico:** Vistas Por sprint y Lista plana — ítems con status `historico`.
- **Vista Icebox:** Ítems con `sprint: icebox` — separados del backlog activo. Alerta de antigüedad ≥14 días. Gate de revisión al abrir sprint. → ver PP-STRATEGY §8 para lógica de parseo.
- **Tema:** Light/Dark. Guardado en localStorage.

---

## 7. Archivos del proyecto

Orden de carga CSS y JS → fuente de verdad: `index.html` (tags `<link>` y `<script>` en orden de aparición).
Conteo de módulos, líneas y funciones → fuente de verdad: MAP activo (ver §1 Identidad para referencia de versión).

**Invariantes de arquitectura — no cambian sin decisión explícita:**
- `locus-storage.js` carga primero entre todos los módulos JS — es la capa de persistencia y state compartida
- `locus-api.js` carga último — contrato público que referencia funciones de todos los demás módulos
- `locus-backlog-core.js` precede a todos los módulos `locus-backlog-*.js` — declara `ITEMS` global
- `locus-backlog-merge.js` carga entre `locus-backlog-item.js` y `locus-backlog-panel.js`
- `locus-sesiones-utils.js` carga inmediatamente después de `locus-sesiones.js`
- `locus-sprint.js` carga después de `locus-backlog-archive.js`
- `locus-modals.js` y `locus-toast.js` preceden a módulos de backlog y sesión
- `locus-workers.js` carga después de `locus-modals.js`, `locus-toast.js`, `locus-ui-shell.js`
- Todo acceso a función de módulo externo requiere guard `typeof fn === 'function'` en call sites JS (no aplica a inline handlers HTML) — **pendiente de eliminación al completar migración ESM Fase 1**

---

## 8. Estado del refactor JS (PP-REFACTOR-JS-BRIEF)

| Fase | Estado | Descripción |
|---|---|---|
| Fase B | ✅ Completa | `_updateHeaderProjectLabel` duplicada resuelta · `_debug.*` eliminados |
| Fase A | ✅ Completa | 8 módulos extraídos — todos QA aprobados por Finn |
| Fase C | ✅ Completa | Storage híbrido resuelto: paths save() separados · Supabase como source of truth · _offlineQueuePush deduplication por type+projId (T-525) · _migrateV2toV3 eliminada |
| Fase B(api) | ✅ Completa | `locus-api.js` — 79 líneas · contrato público `window.Locus` · carga como último script |

**Módulos extraídos en Fase A (todos QA aprobados):**

| Módulo | Extraído de |
|---|---|
| `locus-toast.js` | `ai-tracker-checkpoint.js` |
| `locus-ui-shell.js` | `ai-tracker-checkpoint.js` |
| `locus-modals.js` | `ai-tracker-ai-notes.js` + `ai-tracker-checkpoint.js` |
| `locus-workers.js` | `ai-tracker-ai-notes.js` |
| `locus-sesiones.js` | `ai-tracker-checkpoint.js` |
| `locus-pulso.js` | `ai-tracker-checkpoint.js` + `ai-tracker-ai-notes.js` |
| `locus-map-viewer.js` | `ai-tracker-backlog.js` + `ai-tracker-ai-notes.js` |
| `locus-radar.js` | `ai-tracker-checkpoint.js` |

---

## 9. Deuda técnica

_(sin deuda registrada al cierre de PP-S-08)_

---

## 10. Protocolo de parseo de CHECKPOINT

Protocolo general de CHECKPOINT → ver `BR-Ecosystem §8`.

**Implementación en Locus — módulos y comportamiento de código:**

| Campo | Módulo responsable |
|---|---|
| `Proyecto:` | Validado contra `CANONICAL_PROJECTS` en `locus-session-parse.js` |
| `---ITEMS---` | `mergeBacklogFromTG` en `locus-backlog-item.js` — JSON array. Acepta ítems (`type: R|T|P|B`) e instrucciones (`type: patch`) en el mismo bloque |
| `type: patch` | `applyPatchesFromTG` en `locus-backlog-item.js`. Solo requiere `code` real + campos a actualizar |
| `---EXECUTION-PLAN---` | `_tryIngestPlan` en `locus-session-parse.js` — scope `sprint` o `sesion` |
| `CONTEXT-SECTION:` | Ignorado por el parser — campo informativo |
| `MAP-SECTION:` | Eliminado del protocolo — no se parsea |

**Reglas de parseo específicas de Locus:**

| Regla | Comportamiento |
|---|---|
| `sprint: icebox` en ítems nuevos | Valor canónico para ítems sin sprint asignado. Valores `n/a` y `sin-sprint` son inválidos — Locus los normaliza a `icebox` + advertencia en DocLog |
| Ítems históricos con `sprint: n/a` | Migración automática a `icebox` al cargar — registrada en log de Locus con conteo de ítems migrados |
| Sprint cerrado prohibido | Si ítem llega con `sprint` apuntando a sprint cerrado → normalizar a `icebox` + error explícito al usuario |
| `version_target` independiente | Parser no lee CONTEXT para determinar versión — fuente de verdad es el sprint abierto en Locus |
| `intencion` en Rs | Opcional para el parser — no bloquea ingesta si ausente. Locus almacena y renderiza en IDP si presente |
| `type: patch` | No es tipo de ítem — es instrucción de operación. Patch sobre código placeholder → ignorado + advertencia DocLog. Patch sobre código inexistente → advertencia DocLog, sin crash |

---

## 11. Decisiones

| Fecha | Decisión | Contexto |
|---|---|---|
| 2026-04-26 | String canónico del proyecto: `Locus` | Alias operativos: PEPE · AI Tracker. Prefijo: PP |
| 2026-04-27 | MAP-SECTION eliminado del protocolo CHECKPOINT | MAP se genera desde archivos reales al cierre de sprint via Locus |
| 2026-05-06 | Holding actualizado a Obsidian Labs | String canónico: Obsidian Labs. Prefijo: OB |
| 2026-05-07 | Reset del ecosistema ejecutado — Fases 1–4 completadas | PP-S-01 a PP-S-25 reseteados. Backlog vacío y reseteado |
| 2026-05-07 | Versión app reseteada a v1.0.0 | Decisión Vera — Fase 5 del plan de reset |
| 2026-05-08 | PP-S-01 scope cerrado | Solo Cluster A + gaps críticos + T CANONICAL |
| 2026-05-10 | `version_target` independiente del CONTEXT — regla dura | Se declara al abrir sprint. CONTEXT se actualiza al cerrar. Fuente de verdad: sprint abierto en Locus |
| 2026-05-10 | Bloque `intencion` obligatorio en Rs de CHECKPOINT | Tres líneas escaneables para el founder |
| 2026-05-11 | CSS migrado a arquitectura modular inicial | ai-tracker.css y ai-tracker-extra.css reemplazados por archivos locus-*.css |
| 2026-05-12 | Nova designada dueña del sistema de diseño de Locus | Mantiene `_Locus-css-ref` y `_Locus-ux-ref` |
| 2026-05-12 | CSS-04 implementado — clase canónica .is-hidden declarada en locus-base.css | Clases legacy mantenidas DEPRECATED |
| 2026-05-13 | Supabase como storage primario — decisión de producto | localStorage pasa a caché/fallback |
| 2026-05-13 | Viewports soportados: 1920×1080 y 2560×1080 — solo desktop | Mobile/tablet no soportado |
| 2026-05-13 | Sprint = Release — modelo de versionado | Cada sprint produce exactamente una versión |
| 2026-05-13 | `locus-storage.js` extraído de `ai-tracker-checkpoint.js` | Módulo de persistencia independiente. Precede a todos los módulos JS |
| 2026-05-19 | `ai-tracker-backlog.js` refactorizado en 6 módulos `locus-backlog-*.js` | core · item · panel · render · sprints · archive |
| 2026-05-19 | Fases A + B + C + B(api) del refactor JS declaradas completas | Finn QA aprobó todos los módulos |
| 2026-05-20 | CONTEXT y STRATEGY no contienen conteos de líneas ni listas de funciones | Eso vive exclusivamente en el MAP |
| 2026-05-22 | `locus-overrides.css` eliminado — 101 selectores reubicados a módulos de scope | R-202605-018 done |
| 2026-05-22 | Riesgo `item.desc` cerrado — R-202605-007 done | `buildBacklogMd` y `buildTGPreview` migrados a `item.title` |
| 2026-05-23 | `locus-sprint.js` creado — orquestador del tab Sprint | expone renderSprintTab · carga después de locus-backlog-archive.js |
| 2026-05-23 | Backlog exportado es fuente de verdad del sprint activo en sesión | CONTEXT §2 referencia al backlog exportado |
| 2026-05-23 | R-202605-053 implementado — bloque ## Sprint activo en backlog exportado | _buildSprintActivoMd() en locus-sprint-project.js |
| 2026-05-25 | `type: patch` documentado en protocolo de parseo | R-202605-062 implementado en código |
| 2026-05-25 | Criterio de arquitectura CSS declarado formalmente | CSS vive en el archivo del feature que lo renderiza como experiencia principal |
| 2026-05-25 | PP-S-08 cerrado — v1.2.3 | Refactor estructural CSS locus-backlog.css completo. R-202605-059 y R-202605-060 done |
| 2026-05-25 | Stack actualizado: 41 módulos JS · 17 archivos CSS | Incorpora locus-tracker-utils.js, locus-backlog-merge.js, locus-tracker-card.css, locus-sprint.css, locus-sprint-close.css, locus-sprint-plan.css, locus-sprint-ui.css, locus-archive.css, locus-docs.css |
| 2026-05-27 | Status 'open' de sprints eliminado — modelo migrado a active/closed | R-202605-005 (PP-S-03). Migración automática en _applyStateData: open→active si no hay sprint active en el proyecto · open→closed si ya existe uno. Idempotente en cada carga. T-202605-013 confirmó cobertura |
| 2026-05-27 | Versionado de CONTEXT y STRATEGY alineado al MAP | CONTEXT y STRATEGY adoptan la versión del MAP activo — tríada legible de un vistazo. A partir de v1.0.5 |
| 2026-05-27 | Orden de carga CSS/JS delegado a `index.html` · conteo de módulos delegado al MAP | CONTEXT §7 deja de duplicar información — fuentes de verdad únicas eliminan desincronización |
| 2026-05-27 | `locus-tracker.js` renombrado a `locus-sesiones.js` · `locus-tracker-utils.js` a `locus-sesiones-utils.js` | Tab se llama 'sesiones' — nombres de módulo alineados. `switchTab('tracker')` deprecado — reemplazado por `switchTab('sesiones')` en todos los módulos |
| 2026-05-27 | CONTEXT §10 y STRATEGY §8 refactorizados — duplicación vs BR-Ecosystem eliminada | Protocolo general referencia BR-Ecosystem §8. Solo lógica de implementación de Locus permanece en documentos de proyecto |
| 2026-05-27 | `sprint: icebox` reemplaza `sprint: n/a` como valor canónico | BR-Ecosystem V1.6. Locus normaliza n/a → icebox al parsear. Migración automática de ítems históricos al cargar |
| 2026-05-30 | Migración ESM aprobada — R abierto para próximo sprint | ESM nativo en browser sin bundler. Fase 1+2 en PP-S-09: `export` en módulos + `import` en consumidores + `type="module"` en `index.html`. `window.Locus` se mantiene en Fase 1. Fase 3 (migrar a export nombrado) como P en backlog. Guard `typeof fn === 'function'` se elimina al completar Fase 1 |

---

## 12. Notas de sesión

**2026-05-07 — Fase 4 Reset del ecosistema — Cael**
- Backlog nuevo consolidado. Historial PP-S-01 a PP-S-25 reseteado.

**2026-05-07 — Fase 5 Reset del ecosistema — Cael**
- CONTEXT reseteado a V1.0. Versión app v1.0.0.

**2026-05-19 — Refactor JS Fases A + B + C + B(api) — Cael · Rune · Finn**
- 8 módulos extraídos en Fase A, todos QA aprobados. locus-api.js implementado.

**2026-05-22 — Post-retro PP-S-06 — Cael**
- locus-overrides.css eliminado. R-202605-007 done.

**2026-05-23 — T-202605-066 · T-202605-071 · B-202605-046 · R-202605-020 — Rune · Finn · Cael**
- locus-sprint.js creado. _esc() unificada. aria-labelledby corregido.

**2026-05-25 — PP-S-08 cierre — Rune · Cael**
- R-202605-059 y R-202605-060 done. CSS architecture formal declarada.
- Stack real verificado contra archivos: 41 módulos JS · 17 archivos CSS.
- CONTEXT V2.6 → V2.7: orden de carga CSS y JS corregido contra index.html real.

**2026-05-27 — Alineación fuentes de verdad — Cael**
- CONTEXT §7 refactorizado: orden de carga → `index.html`, conteo de módulos → MAP. Invariantes de arquitectura se mantienen en CONTEXT.
- STRATEGY §6 alineado: conteo de módulos y líneas removidos — delegados al MAP.
- Versión bumpeada a V3.0 (cambio estructural de §7).

**2026-05-27 — Rename tracker → sesiones — Rune · Cael**
- `locus-tracker.js` → `locus-sesiones.js` · `locus-tracker-utils.js` → `locus-sesiones-utils.js`
- `switchTab('tracker')` reemplazado por `switchTab('sesiones')` en `locus-checkpoint-stats.js`
- `locus-sesiones-utils.js` registrado en orden de carga JS del CONTEXT

**2026-05-27 — Refactor documental + alineación icebox — Vera · Cael**
- CONTEXT §10 y STRATEGY §8 refactorizados: duplicación vs BR-Ecosystem eliminada. Solo lógica de implementación de Locus permanece.
- `sprint: icebox` reemplaza `sprint: n/a` como valor canónico — alineado a BR-Ecosystem V1.6.
- Vista Icebox declarada en §6 Funcionalidades activas.

**2026-05-30 — Migración ESM aprobada — Vera**
- R de migración ESM aprobado en sesión dominical. Scope: Fase 1+2 en próximo sprint.
- Guard `typeof fn === 'function'` marcado como pendiente de eliminación en §7 Invariantes.
- CONTEXT bumpeado a V1.0.6.

**2026-05-31 — Alineación documental — Vera**
- Bump de versión a v1.0.7 para alinear con PP-strategy v1.0.7 y OB-STRATEGY v2.9.

---

## 13. Commands (rol → documentos de sesión)

| Rol | Documentos de sesión |
|---|---|
| ST · Vera | `__BR-Core` · `__BR-Ecosystem` · `__Role-Vera` · `OB-STRATEGY` |
| GW · Lena | `__BR-Core` · `__BR-Ecosystem` · `__Role-Lena` · `OB-STRATEGY` |
| CPO · Noa | `__BR-Core` · `__BR-Ecosystem` · `__Role-Noa` · `OB-STRATEGY` · `_as-strategy-v[X].[Y].md` |
| CMO · Maya | `__BR-Core` · `__BR-Ecosystem` · `__Role-Maya` · `OB-STRATEGY` |
| PO · Cael | `__BR-Core` · `__BR-Ecosystem` · `__BR-Execution` · `__Role-Cael` · `OB-STRATEGY` · `_pp-context-v[X].[Y].md` · `_pp-backlog-v[X].[Y].md` |
| FS · Rune | `__BR-Core` · `__BR-Ecosystem` · `__BR-Execution` · `__Role-Rune` · `OB-STRATEGY` · `_pp-context-v[X].[Y].md` · `_Locus-css-ref-v[X].[Y].md` ⚠️ · `_Locus-ux-ref-v[X].[Y].md` ⚠️ · archivos del módulo activo |
| UX · Nova | `__BR-Core` · `__BR-Ecosystem` · `__BR-Execution` · `__Role-Nova` · `OB-STRATEGY` · `_pp-context-v[X].[Y].md` · `_Locus-ux-ref-v[X].[Y].md` ⚠️ · `_Locus-css-ref-v[X].[Y].md` ⚠️ · `_Locus-ui-Inventory-v[X].[Y].md` (sesiones de auditoría) |
| QA · Finn | `__BR-Core` · `__BR-Ecosystem` · `__BR-Execution` · `__Role-Finn` · `OB-STRATEGY` · `_pp-context-v[X].[Y].md` · `_pp-backlog-v[X].[Y].md` · `_Locus-ui-Inventory-v[X].[Y].md` (sesiones de auditoría) |
| CC · Flux | `__BR-Core` · `__BR-Ecosystem` · `__Role-Flux` · `OB-STRATEGY` · `_ob-brief-maya-v[X].[Y].md` (si existe) |
| ET · Eden | `__BR-Core` · `__BR-Ecosystem` · `__Role-Eden` · `_cm-context-v[X].[Y].md` · `_cm-curr-[sección]-v[X].[Y].md` |
| GC · Sage | `__BR-Core` · `__BR-Ecosystem` · `__Role-Sage` · `_cm-context-v[X].[Y].md` · `_cm-curr-[sección]-v[X].[Y].md` |
| DA · Iris | `__BR-Core` · `__BR-Ecosystem` · `__Role-Iris` · `OB-STRATEGY` · `_as-strategy-v[X].[Y].md` · `_ob-dash-v[X].[Y].md` (si existe) |

⚠️ — bloqueante cuando el T toca CSS o UI. Ver `__BR-Execution §6`.
