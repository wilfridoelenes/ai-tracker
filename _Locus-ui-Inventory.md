<!-- _Locus-ui-Inventory.md | mod:71 | Doc Ref — Locus | Dueña: Nova (UX) | infra_version: 107 -->

## ⚠️ Gap de reconstrucción — leer antes de usar este doc

Este documento se reconstruye en dos vías combinadas: (a) el fragmento parcial de changelog disponible (`## Cambios` mod:51 → mod:54), y (b) auditoría directa contra el repo real (`Archivo_2.zip`, 57 JS + 23 CSS + `index.html`, coincide con `_PP-map-v1.26.0.md`) — reconstrucción por categoría, verificada por grep, no por memoria del changelog.

**Estado por categoría:**

| Categoría | Método | Estado |
|---|---|---|
| Overlay/Modal | Auditoría completa contra `index.html` real (25 raíces confirmadas) + trigger JS verificado por función | ✅ Completa (esta sesión) |
| Badge/Status — Backlog + Q-INC (prioridad, status, tipo ITIL, SLA) | Auditoría completa contra código real (`locus-backlog-core.js`, `locus-incidents-item.js`, `locus-incidents.css`, `locus-cmdk.js`) | ✅ Completa (esta sesión) |
| Chip/Badge inline — Backlog list + children block | Auditoría completa contra código real (`locus-backlog-item.js`, `locus-backlog-item.css`, `locus-backlog.css`) | ✅ Completa (esta sesión) |
| Backlog item — subline | Auditoría completa contra código real — 5 chips verificados, 1 código muerto detectado (`.bitem-focus-rank`) | ✅ Completa (esta sesión) |
| Formularios y botones de acción — confirmación inline, char-counter, status popover, danger zone | Auditoría completa contra código real — 2 hallazgos de CSS muerto/duplicado | ✅ Completa (esta sesión) |
| Categorías no cubiertas — toasts/notificaciones, filtros/toolbar, empty states, cards de Radar/Sesiones/Analytics, drag & drop | No auditado | Pendiente — el repo es más grande que las 5 categorías cubiertas; estas quedan fuera de esta ronda |

Las familias `cp-*`, `notif-config-*`, `standalone-ckpt-*`, `status-confirm-*`, `proj-modal`/`proj-panel` — todas `retirado` — se re-verificaron contra el `index.html` real de esta sesión: **0 coincidencias, confirmado consistente con mod:51.**

**Criterio fundacional del doc (`§Cambios mod:39`, heredado):** marcar `retirado` con nota, no eliminar la fila — preserva trazabilidad.

**Acción sugerida:** `Propuesta de mejora` ya registrada con Cael — export puntual de historia completa. Hasta entonces, cada categoría se cierra por fase, con CHECKPOINT propio, contra código real.

---

## Inventario — Cat. Overlay/Modal (completa, auditada contra `index.html` real — mod:56)

25 overlays raíz confirmados por grep de `id="..."` + verificación de función open/close en el JS correspondiente. Ninguno retirado — los 25 están presentes y activos en `index.html`.

| ID | Trigger (abre) | Módulo | Cierre | Nota |
|---|---|---|---|---|
| `#add-modal` | `openAddAI()` | `locus-workers.js` | `closeModal('add-modal')` genérico (`locus-modals.js`) | — |
| `#auth-modal-overlay` | `openAuthModal()` | `locus-storage.js` | `closeAuthModal()` | `role="dialog" aria-modal="true"` |
| `#avatar-modal` | `openAvatarModal(aiId)` | `locus-workers.js` | `closeAvatarModal()` | — |
| `#changelog-overlay` | `openChangelog()` | `locus-session-save.js` | `closeModal` genérico | Renderiza `_buildChangelogHTML()` |
| `#clean-project-overlay` | `openCleanProjectModal()` | `locus-reports.js` | `closeCleanProjectModal()` | class compuesta `modal-overlay clean-project-overlay` |
| `#cmdk-overlay` | `openCmdk()` | `locus-cmdk.js` | `closeCmdk()` | Sin `class="modal-overlay"` — shell propio. `design_intent: cmdk_borrador_navegacion`. Trigger `⌘K` wireado (`_initCmdkListeners`) — **estado actualizado**: ya no es "shell parcial pendiente de trigger" como declaraba mod:52; `_pp-context §5` confirma Command Palette restaurado y operativo desde `PP-S-31` |
| `#doc-log-overlay` | `openDocLog(doc)` | `locus-doc-log.js` | `closeDocLog()` | Contenedor vacío en `index.html` (`<div id="doc-log-overlay"></div>`) — todo el markup es inyectado |
| `#gconfirm-overlay` | `_gconfirmOpen({...}, cb)` | `locus-modals.js` | `_gconfirmClose()` / `_gconfirmOk()` | Genérico — reutilizado por `openNotifConfig()` (confirmado en mod:51) y por guards de confirmación en otros módulos |
| `#import-diff-overlay` | `importData()` → `_showImportDiff()` (internal) | `locus-reports.js` | `closeImportDiff()` | — |
| `#infra-sync-overlay` | `openInfraSync()` | `locus-ui-shell.js` | `closeInfraSync()` | — |
| `#ingest-modal-overlay` | `_openIngestModal(aiId)` | `locus-sesiones.js` | `closeIngestModal()` | `locus-modals.js` | Es columna (`mss-col mss-col--ingest`) dentro de `#modal-split-shell` — no overlay independiente. Ver fila `#modal-split-shell` |
| `#item-editor-overlay` | `openItemEditor(itemId, itemCode)` | `locus-backlog-editor.js` | `closeItemEditor()` | — |
| `#item-viz-overlay` | `_showItemVizPanel(tgItems, sessId, projId, onConfirm)` | `locus-sesiones-viz.js` | `_itemVizClose()` | Default `is-hidden`. `role="region" aria-live="polite" aria-atomic="true"` — no es `dialog`, es región asistiva |
| `#log-overlay` | `scrollToLogCard()` (vía manipulación de `#log-card` interno) | `locus-session-popup.js` | `closeLogCard()` | El overlay es el shell fijo (`log-overlay`/`log-card` vacío en `index.html`); todo el contenido lo inyecta `_rebuildLogBody()`. Comentario propio en `index.html`: "mismo patrón que `#ingest-modal-overlay`/`#merge-diff-overlay`: `.modal-overlay`/`.open` vía JS" |
| `#merge-diff-overlay` | `showMergeDiffPanel(...)` | `locus-backlog-merge.js` | `teardownMergeDiffPanel()` | class `mdiff-overlay` — es columna de `#modal-split-shell` (Split View), no overlay independiente |
| `#mg-overlay` | `openMapGenerator()` | `locus-map-generator.js` | `closeMapGenerator()` (internal) | `role="dialog" aria-modal="true"` — Document Generator |
| `#modal-split-shell` | Contenedor raíz de Split View — orquestado por `showMergeDiffPanel()`/`openSplitViewRoute()` | `locus-backlog-merge.js` / `locus-ui-shell.js` | `teardownMergeDiffPanel()` / `closeSplitViewRoute()` | class `mss-shell modal-split-shell` — **candidato a nivel `panel` de Patrón A-09** (`_Locus-ux-ref`), no `diálogo`. Contiene `#ingest-modal-overlay` y `#merge-diff-overlay` como columnas (`mss-col`) |
| `#pend-overlay` | `openPendPanel()` | `locus-pend.js` | `closePendPanel()` | Panel de Pendientes |
| `#proj-mismatch-overlay` | `_showProjMismatchModal({msg, onContinue})` | `locus-session-save.js` | `closeModal` genérico | — |
| `#promote-modal-overlay` | `_promoteItem(code)` / `_promoteTktToReq(code)` | `locus-backlog-item.js` | `_promoteConfirm`/`_promoteTktToReqConfirm` cierran al confirmar (`locus-backlog-panel.js`) | Ver `_Locus-ux-ref Hallazgo F` — DISC abierta sobre guard de status faltante en `_promoteItem` |
| `#qc-modal-overlay` | `openQuickCapture(id)` | `locus-sesiones-capture.js` | `closeQuickCapture(e)` | class compuesta `quick-modal-overlay qc-overlay`. Ver `_Locus-ux-ref Patrón A-10` |
| `#shortcuts-overlay` | `openShortcuts()` | `locus-ui-shell.js` | `closeShortcuts(e)` | Default `is-hidden`. `openShortcutsRef()`/`closeShortcutsRef()` son alias — mismo overlay |
| `#sprint-close-overlay` | `confirmCloseSprint()` (abre) → orquestado por `_scmRender()` | `locus-backlog-sprints.js` | `closeCloseSprintModal()` | Wizard de 4 pasos — ver `_Locus-ux-ref Hallazgo E` (renderers `_scmStep*Html`, resuelto mod:45 de ux-ref) |
| `#sprint-retro-overlay` | `openSprintRetroView(id)` | `locus-backlog-sprints.js` | `closeSprintRetroOverlay()` (internal) | — |
| `#tag-modal` | `openTagModal(aiId, sessId)` | `locus-tags.js` | `closeModal` genérico (botón `#tag-modal-close`) | — |
| `#weekly-summary-modal` | `_maybeShowWeeklySummary()` (auto) | `locus-sesiones-utils.js` | `dismissWeeklySummary()` | Default `is-hidden`. No tiene trigger manual de apertura — se auto-invoca (lógica de "lunes" / `_isMonday()`) |

**Hallazgo fuera de scope, detectado en esta auditoría:** `#ingest-modal-overlay` y `#merge-diff-overlay` no son overlays raíz independientes — son columnas (`mss-col`) del contenedor `#modal-split-shell`. La fila de `mod:52` (`#cmdk-overlay`) y cualquier fila futura que trate a `#ingest-modal-overlay` como entidad propia debe leerse con esta corrección. Dónde: estructura de `index.html` L1879–1968. Acción sugerida: `Propuesta de mejora` a Nova (dueña) — la próxima vez que se documente el patrón `mss-shell`/`mss-col` (Split View, Patrón A-09 de `_Locus-ux-ref`), consolidar `#modal-split-shell` + sus dos columnas como una sola entrada jerárquica en vez de tres filas planas.

---

## Inventario — Cat. Badge/Status — Backlog + Q-INC (completa, auditada contra código real — mod:57)

Fuente única de `badgeClass`/`badgeLabel`/`statusClass`/`statusLabel` consolidada en `locus-backlog-core.js` — consumida por `locus-backlog-item.js`. Q-INC tiene familia propia (`qinc-*`), separada.

| Elemento | Módulo(s) | Clases | Estados | Nota |
|---|---|---|---|---|
| Badge de prioridad (child items anidados) | `locus-backlog-core.js` (`badgeClass`/`badgeLabel`) → `locus-backlog-item.js` L1143 | `badge badge-high/medium/low/area` | `high`/`medium`/`low` + fallback legado `critical`/`important`/`mejora`/`futura` → mapean a los 3 canónicos | Fallback legado sin uso confirmado en `getItems()` actual — `priority` de REQ/TKT/DISC solo emite `high\|medium\|low` (`__BR-Ecosystem §5`); las 4 claves legado son código muerto defensivo, no deuda activa (no hay caller que las produzca) |
| Badge de status (child items anidados) | `locus-backlog-core.js` (`statusClass`/`statusLabel`) → `locus-backlog-item.js` L1138 | `badge badge-status-backlog/en-revision/done/descartado/historico/orphaned` | 6 status Gen2 completos (incluye `orphaned`, TKT CAEL-0731-03) | — |
| `.bitem-prio-badge` | `locus-backlog-item.js` L1408 | `bitem-prio-badge prio-high/medium/low` | Card principal de Backlog list — mismo dato que el badge de arriba, presentación distinta (pill de card, no badge de fila anidada) | CSS: `locus-backlog-item.css` L635–663 |
| `.bitem-status-chip` | `locus-backlog-item.js` L1500 | `bitem-status-chip bitem-status-chip--pendiente/done/descartado/en-revision` | Botón interactivo (`data-action="open-status-popover"`) — abre `_openStatusPopover()` | CSS: `locus-backlog.css` L4250–4295. Nota: no cubre `historico`/`orphaned` como modificador propio — esos dos status no son editables inline vía este chip (coherente: son terminales/automáticos) |
| `.qinc-type-badge` | `locus-cmdk.js` L138 (`_cmdkTypeBadgeHtml`) | `qinc-type-badge qinc-type-badge--inc/prb/ke/chg` | Badge de tipo ITIL en resultados del Command Palette | **Retirado del header de `buildQIncItem()`** (Q-INC panel) desde `TKT-202607-161` — el código del ítem (`INC-XXXXXX`) ya lleva el prefijo como texto, el badge separado era redundante. Sigue vivo únicamente en `locus-cmdk.js` como fallback genérico para tipos no REQ/TKT/DISC |
| `.qinc-badge` (genérico) | `locus-incidents-item.js` L215-222 | `qinc-badge qinc-badge--status/--sla/--empty` | `incident_status` textual + SLA textual, con variante `--empty` (`—`) cuando el campo está ausente | Distinto de `.qinc-type-badge` — no es por tipo ITIL, es contenedor genérico de texto/valor |
| `.qinc-item--sla-vencido` / `--sla-riesgo` | `locus-incidents-item.js` L241-271, `locus-incidents-render.js` L539-540 | Clase de card + `.qinc-sla-countdown--vencido/--riesgo` | Mutuamente excluyentes — vencido si `slaDeadline < now`, riesgo si `< now + SLA_RIESGO_WINDOW_MS`. Estado no-terminal con reloj pausado (`derived_items` pendiente, `__BR-Core §6`) no aplica ninguna de las dos | — |

**Hallazgo fuera de scope, verificado en esta auditoría — `.qinc-type-badge--ke` es CSS muerto:** `locus-incidents.css` L295-301 y L319-325 declaran `.qinc-type-badge--ke` (light + dark). El literal `'KE'` fue retirado por completo del código ejecutable en al menos 5 TKTs distintos (`TKT1 REQ CAEL-0724-10/11/12`, `TKT4 TKT-202607-068`, `TKT-202607-152`) tras la fusión `KE → PRB.root_cause_confirmed` (`infra_version 51`) — `itemKind()` nunca resuelve a `'KE'` desde `_GEN2_TYPES`, y ningún dato persistido nuevo puede tener `type: 'KE'`. El único lugar que aún podría emitir la clase (`_cmdkTypeBadgeHtml()`, fallback genérico para tipos no REQ/TKT/DISC) es inalcanzable en la práctica: `groups[r.type]` en `_cmdkGroupByType()` nunca contiene `'KE'` porque `buildCmdkIndex()` indexa sobre `getItems()`/`getIncidents()`, que ya no lo producen. Dónde: `locus-incidents.css`. Acción sugerida: `Propuesta de mejora` a Nova (dueña de `css-ref`) — retirar el bloque `--ke` (4 reglas) en el próximo TKT que toque este archivo; no bloquea nada mientras tanto, es CSS sin efecto visible, no un bug.

---

## Inventario — Cat. Q-INC — elemento informativo (parcial — alta puntual, mismo criterio que Cat. Toolbar / filtros)

No es parte de la auditoría completa de Badge/Status — Backlog + Q-INC (mod:57). Alta puntual disparada por `doc_relevance_confirmada.ui_inventory: sí` (`§Criterio de mantenimiento`).

| Elemento | Módulo(s) | Clases | Estados | Nota |
|---|---|---|---|---|
| `.qinc-readonly-banner` | `index.html` (estático, entre `#qinc-stats-bar` y `#qinc-panel-body`) | `qinc-readonly-banner` / `qinc-readonly-banner-icon` | Único — sin variantes, sin interacción | No interactivo: sin `data-action`, sin `:hover`/`:focus`. Ícono `ti-shield-check` con `aria-hidden="true"`. Cierra `_Locus-ux-ref` Patrón A-11 / Gap "copy de solo-lectura sin implementar". Origen: `TKT-202608-323`, parent `REQ-202608-128` |

---

## Inventario — Cat. Ingest preview — elemento informativo (parcial — alta puntual, mismo criterio que Cat. Toolbar / filtros)

No es parte de una auditoría completa de la categoría. Alta puntual disparada por `doc_relevance_confirmada.ui_inventory: sí` (`§Criterio de mantenimiento`).

| Elemento | Módulo(s) | Clases | Estados | Nota |
|---|---|---|---|---|
| Badge de trazabilidad | `#ingest-block-preview-anchor` (dinámico, `locus-session-parse.js` `_renderIngestBlockPreview()`) | `ingest-block-preview-icon--trace` / `ingest-block-preview-tag` / `ingest-block-preview-origin` | Único — sin variantes. `.ingest-block-preview-origin` (opcional, solo si el código de origen resuelve contra `getItems()`/`getIncidents()`) declara `:hover`/`:focus-visible` | Distingue el bloque de trazabilidad pura del preview genérico ícono+título. Cierra `_Locus-ux-ref` Patrón A-12. Origen: TKT1/TKT2, parent `CAEL-08111800-01` |
| Badge crea/modifica | `#ingest-block-preview-anchor` (dinámico, `locus-session-parse.js` `_renderIngestBlockPreview()`) | `ingest-block-preview-tag--crea` / `--modifica` | Dos — mutuamente excluyentes por bloque, un bloque no muestra ambos a la vez | Distingue si un bloque con `items` clasificables crea ítems nuevos o parchea uno existente. Extiende `.ingest-block-preview-tag` (misma clase base que el badge de trazabilidad) con tokens de `.mdiff-pill--created`/`--updated`. Cierra extensión de `_Locus-ux-ref` Patrón A-12. `design_intent: ingest_block_crea_modifica_wireframe`. Origen: `TKT-202608-333` |

---

## Inventario — Cat. Chip/Badge inline — Backlog list + children block (completa, auditada contra código real — mod:58)

**`.bitem-type-code`**
- Estado: **activo**, verificado contra `locus-backlog-item.js` L1571-1575 y `locus-backlog-item.css` L318-361. Chip de tipo+código fusionado en el header de cada ítem de Backlog list (`buildBacklogItem()`). Copiable — `data-action="copy-code"`.
- Estados: `is-copied` (verde, ícono `ti-check`, 1500ms) / `is-copy-error` (rojo, revierte sin check). Ícono (`.bitem-type-code-icon`) oculto por defecto, visible en `hover`/`focus-visible`/`is-copied`/`is-copy-error`. Variante DISC: `.item.bitem[data-type="DISC"] .bitem-type-code`/`-prefix` con tratamiento propio (L447-453).
- Origen: TKT CAEL-08101542-02, parent REQ CAEL-08101542-01.
- Nota de accesibilidad: sin `tabindex`/`role` — no alcanzable por teclado. `:focus-visible` declarado por paridad con el precedente, inalcanzable hasta TKT aparte.

**`.item-code-badge`**
- Estado: **activo**, verificado contra `locus-backlog-item.js` L1141 y `locus-backlog.css` L4693-4730. Badge de código en la fila de un hijo anidado bajo un R expandido (`_buildChildrenBlock()`). Copiable — `data-action="copy-code"`.
- Estados y CSS: mismo patrón que `.bitem-type-code` (`is-copied`/`is-copy-error`).
- Origen: mismo TKT que `.bitem-type-code`. `copyItemCode()` (L1937) resuelve el ícono de ambos con un único selector combinado `.bitem-type-code-icon, .item-code-badge-icon`.
- Misma nota de accesibilidad que `.bitem-type-code`.

## Inventario — Cat. Backlog item — subline (completa, auditada contra código real — mod:58)

Cinco chips construidos condicionalmente en `_sublineParts` dentro de `buildBacklogItem()` (`locus-backlog-item.js` L1545-1556), en orden de aparición:

| Chip | Condición | CSS | Estado |
|---|---|---|---|
| `.bitem-focus-rank` | `item._focusRank` | `locus-sesiones.css` L4809-4820 — badge numerado, T-202604-426 | **Código muerto verificado** — `item._focusRank` no se asigna en ningún módulo del repo (grep exhaustivo, 0 ocurrencias fuera del propio consumidor). La rama es sintácticamente correcta y tiene CSS completo, pero es inalcanzable: Focus mode no escribe este campo en el ítem |
| `.bitem-subline-role` | `item.role` | `locus-backlog.css` L4571-4575 | Activo — texto del rol responsable (`FS · Rune`, etc.) |
| `.bitem-subline-area` | `item.area` | `locus-backlog-item.css` L536-544 | Activo — mono, ellipsis, `max-width: 160px` |
| `.bitem-subline-sprint` | `item.sprint` | `locus-backlog-item.css` L551-561 | Activo — chip azul, vía `_sprintDisplay()` |
| `.bitem-subline-archivos` | `item.archivos.length` | `locus-backlog-item.css` L564+ (mod:96, vigente sin cambio en mod:97) | Activo. Aplica solo a `type: TKT` — REQ/DISC no lo renderizan porque `archivos` no existe en su schema (`__BR-Ecosystem §5`), no por guard de código explícito. Estados: 1 archivo (ícono `ti-file-code` + nombre completo) · 2+ (ícono + primer nombre + `+N`, `title` nativo con lista completa) · ausente (chip omitido, sin `span` vacío). `design_intent: archivos_en_subline_tkt`, aprobado por el founder. Origen: TKT-202608-302, parent REQ-202608-122. Registro retroactivo — cierre `INC-202608-105` |

**Hallazgo fuera de scope, verificado en esta auditoría — `.bitem-focus-rank` inalcanzable:** El comentario de `locus-sesiones.css` L4805 declara "El badge solo se inyecta en DOM cuando `_focusRank` existe (focus mode activo)" — pero ningún módulo del repo escribe `item._focusRank`. O bien Focus mode nunca llegó a implementar esa asignación (deuda de integración entre T-202604-416/426), o el mecanismo que la escribía fue removido sin retirar el consumidor — no distinguible sin el historial pre-mod:1 de este mismo Inventory. Dónde: `locus-backlog-item.js` L1545 + `locus-sesiones.css` L4804-4822. Acción sugerida: `Propuesta de mejora` a Cael — confirmar con el founder si Focus mode con ranking visible sigue siendo intención vigente; si sí, falta el TKT que asigna `_focusRank` sobre los ítems antes de renderizar; si no, retirar el branch muerto y su bloque CSS en el mismo TKT.

---

## Inventario — Cat. Formularios y botones de acción (completa, auditada contra código real — mod:59)

### Confirmación inline — patrón "delete confirm"

Dos implementaciones paralelas, no unificadas, con estados de vida distintos:

| Componente | Consumidor | CSS | Estado |
|---|---|---|---|
| `.pop-delete-confirm` (+ `.confirm-text`/`.confirm-yes`/`.confirm-no`) | `locus-session-popup.js` L269-398 (`openDeleteConfirm()`/`closeDeleteConfirm()`) | `locus-sesiones.css` L3234-3260 | **Activo** — confirmación inline al eliminar una sesión desde el popup de detalle |
| `.qn-delete-confirm` (+ `.qn-delete-btn`/`.qn-close`/`.qn-delete-msg`) | ninguno | `locus-proyectos.css` L1119-1145+ | **Código muerto verificado** — 0 ocurrencias en cualquier `.js` del repo. Pertenece a "Quick Note" (`T-202604-270`, comentario propio en el CSS: "inline delete confirm"), feature de nota rápida en Tab Proyectos. El botón que lo dispararía (`.qn-delete-btn--visible`) tampoco tiene consumidor JS |

**Hallazgo fuera de scope, verificado en esta auditoría — familia `.qn-delete-*` es CSS muerto:** Todo el sub-bloque de confirmación de borrado de Quick Note (`T-202604-270`) en `locus-proyectos.css` no tiene ningún caller — ni el botón que lo mostraría (`.qn-delete-btn`) ni el texto/botones internos (`.qn-delete-msg`, `.confirm-text`/`.confirm-yes`/`.confirm-no` en este contexto — nota: estos dos últimos nombres genéricos coinciden con los de `.pop-delete-confirm`, pero ese archivo no los declara en este bloque, son namespaces CSS independientes que comparten nombre de clase por convención, no por reuso). No confirmable si Quick Note perdió su función de borrado en una refactorización posterior sin limpiar el CSS, o si nunca se conectó. Dónde: `locus-proyectos.css` §"T-202604-270" (bloque `.qn-*`). Acción sugerida: `Propuesta de mejora` a Nova — confirmar con el founder si Quick Note debía tener borrado inline; si no es prioridad, retirar el bloque completo en el próximo TKT sobre este archivo.

### Contador de caracteres

**`.char-counter`**
- Único consumidor real: `#ingest-char-counter` (`index.html` L1924, modal de ingesta) — clase toggleada dinámicamente por `locus-session-parse.js` L2040 (`'char-counter warn'` sobre 2000 caracteres). `#ingest-block-count` (L1925) reutiliza la clase base solo para estilo, sin lógica de conteo ni `.warn`.
- **Hallazgo fuera de scope, verificado en esta auditoría — regla base duplicada en dos archivos CSS:** `.char-counter` se declara como selector base completo tanto en `locus-backlog.css` L3593 (con `font-family`/`text-align`/`margin-top`/`transition`) como en `locus-modals-base.css` L654 (subconjunto: solo `font-size`/`color`/`white-space`). Ambas declaran `font-size`/`color` con el mismo valor — sin conflicto funcional hoy, pero es una regla con dos fuentes de verdad para el mismo selector, violación del criterio de arquitectura CSS de Nova (`_[Producto]-css-ref` — "qué vive en qué archivo"). El único consumidor real vive dentro de `#modal-split-shell` (territorio de `locus-backlog-item.css`/modal), no en la lista principal de Backlog — la copia en `locus-backlog.css` es la candidata a retirar. El estado `.warn` vive en un tercer archivo (`locus-sesiones.css` L1065), separado de ambas bases. Dónde: `locus-backlog.css` + `locus-modals-base.css` + `locus-sesiones.css`. Acción sugerida: `Propuesta de mejora` a Nova — consolidar `.char-counter` + `.char-counter.warn` en un solo archivo (candidato: `locus-modals-misc.css`, dueño temático de la ingesta) y retirar la copia de `locus-backlog.css`.

### Status popover (cambio de status inline)

**`.bitem-status-popover` / `.bitem-status-popover-btn`**
- Estado: **activo**, verificado — `_openStatusPopover(code)` (`locus-backlog-item.js` L1275-1305) construye el popover con opciones filtradas por tipo de ítem (`DISC` no ofrece `en-revision`/`done`, coherente con `__BR-Ecosystem §5`), inyecta `role="menu"`, marca `.is-current` sobre la opción activa. Dispara `setItemStatus(code, val)` al click.
- CSS: `locus-backlog.css` L4296-4333.
- No confundir con `.bitem-status-chip` (Cat. Badge/Status, mod:57) — el chip es el trigger visible en la card, el popover es el menú que abre.

### Danger zone — confirmación por texto

**`#reset-backlog-input` / `#reset-backlog-confirm-btn`**
- Estado: **activo**, verificado — `locus-reports.js` L239-298 (`openResetBacklogModal()`/`confirmResetBacklog()`). Input de texto que exige coincidencia exacta antes de habilitar el botón de confirmación — mismo patrón declarado como AC obligatorio de danger zones en `_Locus-ux-ref` (label + input + botón deshabilitado hasta match).
- Mismo patrón replicado en `openResetSessionsModal()`/`confirmResetSessions()` (`locus-contracts.js`) y `openCleanProjectModal()`/`_cleanProjectValidate()` (`locus-reports.js`) — tres implementaciones independientes del mismo patrón de validación, no una función compartida. No es deuda por sí solo (cada uno valida contra un string distinto), pero es candidato a extraer un helper único si aparece un cuarto caso.

---

## Inventario — Cat. Toolbar / filtros (parcial — solo alta puntual, categoría general aún Pendiente)

Esta categoría sigue marcada `Pendiente` en la tabla de `§Gap de reconstrucción` — no fue auditada como conjunto. La fila siguiente es un alta puntual disparada por `doc_relevance_confirmada.ui_inventory: sí` en un TKT (mismo criterio que `§Criterio de mantenimiento`), no una auditoría completa de la categoría.

| ID | Trigger (abre) | Módulo | Cierre | Nota |
|---|---|---|---|---|
| `#btn-export-sprints` | click → `dispatchEvent('shell:export-sprints')` | `locus-ui-shell.js` (wiring) | n/a — botón de acción, no modal | Clase `tpl-action-btn is-hidden`, hijo directo de `#tpl-toolbar`, sibling exacto de `#btn-export-backlog-full` (misma clase, mismo patrón de wiring). Consumidor del evento: `locus-backlog-generator.js` (`exportSprintsMd()`). Sin estado único adicional — hereda `is-hidden`/visible del mismo mecanismo que su sibling. `TKT-202608-317`, parent `REQ-202608-126` |

---

## Inventario — Cat. Panel DOC-UPDATEs pendientes — elemento informativo (parcial — alta puntual, mismo criterio que Cat. Toolbar / filtros)

No es parte de una auditoría completa de la categoría. Alta puntual disparada por `doc_relevance_confirmada.ui_inventory: sí` (`§Criterio de mantenimiento`).

| Elemento | Módulo(s) | Clases | Estados | Nota |
|---|---|---|---|---|
| Grupo por doc | `#doc-updates-list` (dinámico, `locus-docs.js` `renderDocUpdatesPending()`) | `du-group` / `du-group-header` / `du-group-title` / `du-group-count` | Único — sin variantes, sin interacción propia (contenedor) | Agrupa las entradas `.du-entry` existentes por doc, conservando el sort vencido-first ya vigente — no reemplaza ni modifica `.du-entry`/`.du-btn-apply`/`.du-btn-discard`/`.du-btn-resolve`. Origen: `TKT-202608-325`, parent `REQ-202608-129` |
| Botón "Copiar pendientes" | `#doc-updates-list` (dinámico), delegado en `_initDocUpdatesListeners()` | `du-btn-copy-group` | `.is-copied` (1500ms) / `.is-copy-error` (1500ms) — mismo patrón de feedback ya vigente en `.bitem-type-code`/`.item-code-badge` (Cat. Chip/Badge inline, mod:58) | Copia al portapapeles el texto plano de las entradas pendientes del doc del grupo. Origen: `TKT-202608-325`, parent `REQ-202608-129` |

---

## Inventario — Cat. Iconografía — elemento informativo (parcial — alta puntual, mismo criterio que Cat. Toolbar / filtros)

No es parte de una auditoría completa de la categoría. Alta puntual disparada por `doc_relevance_confirmada.ui_inventory: sí` (`§Criterio de mantenimiento`).

| Elemento | Módulo(s) | Clases | Estados | Nota |
|---|---|---|---|---|
| Chevron de disclosure | `index.html` (símbolo sprite) / `locus-base.css` (primitivo) | `.chevron` (+ `.chevron--btn`) | Reposo — colapsado, 0° / Expandido — 90°, vía `[aria-expanded="true"]` o `.is-expanded` | Ícono: sprite `#ti-chevron-right`, agregado en posición alfabética. Variante `--btn`: 20×20px, target clickeable propio. Soporta `prefers-reduced-motion`. Fundación — ningún consumidor migrado todavía (migración de consumidores es TKT2/TKT3/TKT4 del mismo REQ). Origen: `TKT-202608-327`, parent `REQ-202608-131` (Patrón A-13, `_Locus-css-ref`) |
| Ícono de carpeta — breadcrumb proyecto | `locus-layout.css` | `.breadcrumb-seg--proj::before` | Único — sin variante de estado | Migrado de glifo emoji 📁 a mask-token `--icon-folder`, `background-color: currentColor` — hereda color del segmento. Origen: TKT CAEL-08150730-02, parent REQ CAEL-08150730-01 |
| Ícono de theme toggle — sol/luna | `locus-backlog-item.css` (regla) / `locus-layout.css` (botón) | `.theme-toggle-btn::before` | `[data-theme="dark"]` → `--icon-sun` / `[data-theme="light"]` → `--icon-moon` / fallback sin `data-theme` → `--icon-sun` | Migrado de glifos emoji ☀/🌙 a mask-tokens `--icon-sun`/`--icon-moon`. Origen: TKT CAEL-08150730-02, parent REQ CAEL-08150730-01 |
| Bullet de criterio de aceptación (AC list) | `locus-backlog.css` | `.ac-list li::before` | Único — sin variante de estado | Migrado de glifo ◻ a mask-token `--icon-square`, `color: var(--text3)` preservado vía `currentColor`. Origen: TKT CAEL-08150730-02, parent REQ CAEL-08150730-01 |
| Ícono de badge "pendiente" (sprint health) | `locus-backlog.css` | `.sph-pending-badge::before` | Único — sin variante de estado | Migrado de glifo ⏳ a mask-token `--icon-hourglass`, hereda color amber del badge vía `currentColor`. Origen: TKT CAEL-08150730-02, parent REQ CAEL-08150730-01 |
| Ícono de dependencia rota (EXECUTION-PLAN display) | `locus-sesiones.css` | `.plan-file-pill--broken::before` | Único — sin variante de estado | Migrado de glifo emoji ⚠️ a mask-token `--icon-alert-triangle`, hereda `var(--c-high-text)` vía `currentColor`. Origen: TKT CAEL-08150730-02, parent REQ CAEL-08150730-01 |
| Indicador de modo Focus | `locus-sesiones.css` | `body.body--focus-mode::before` (ícono) + `::after` (texto "Focus") | Único — sin variante de estado | Migrado: `::after` retiene el glifo ⛶ inicial retirado de su `content:` (ahora solo texto "Focus"); `::before` nuevo, independiente, renderiza `--icon-maximize`. `background-color: var(--hint, #aaa)` — mismo color que ya usaba `::after`. Origen: TKT CAEL-08150730-02, parent REQ CAEL-08150730-01 |

---

## Inventario — Cat. Tab Sprint — elemento auditable (parcial — alta puntual, mismo criterio que Cat. Toolbar / filtros)

No es parte de una auditoría completa de la categoría. Alta puntual disparada por `doc_relevance_confirmada.ui_inventory: sí` (`§Criterio de mantenimiento`).

| Elemento | Módulo(s) | Clases | Estados | Nota |
|---|---|---|---|---|
| Card de sprint activo con detalle colapsable | `#sps-activo .sps-card` | `.sps-card-detail-toggle` (control) | Expandido (default) / Colapsado (identidad + % mini) | Control con foco visible y `aria-expanded`. Disclosure de dos niveles — independiente del colapso de sección (Patrón A-13, `_Locus-ux-ref`). Origen: `TKT-202608-365` |

---

## Inventario — Cat. Learning Log — sub-tab (completa, auditada contra código real — mod:69)

4 elementos confirmados por lectura directa de `locus-docs.js`, `locus-docs.css` e `index.html`. Sin CSS nuevo — categoría entera reutiliza lenguaje visual `.du-*`/`.btn-ghost`/`.tpl-action-btn`/`.spt-tab`/`.session-subpanel` ya existente.

| Elemento | Módulo(s) | Clases / IDs | Estados | Nota |
|---|---|---|---|---|
| Shell del sub-tab | `index.html` (estático) | Tab button: `.spt-tab` (genérica, `#sstab-btn-learning-log`, sin badge) — Panel: `.session-subpanel`/`.du-panel-header`/`.du-panel-title`/`.du-list` (`#sspanel-learning-log`, `#llog-list` con `aria-live="polite"`) — sin clase propia nueva | Único — sin variante de estado propia (hereda de `.spt-tab`/`.session-subpanel`) | Sibling de DOC-UPDATEs/Contratos en `.spt-nav`, mismo mecanismo `.spt-tab`. HTML estático con contenido inicial (`.du-empty-state`), poblado dinámicamente por `renderLearningLog()`. Origen: `TKT-202608-427` (REQ-202608-171) |
| Lista de candidatos | `#llog-list` (dinámico, `locus-docs.js` `renderLearningLog()`) | Fila: `.du-entry` (reutilizada, sin clase propia — cero CSS nuevo, confirmado contra `locus-docs.css`) — attr `data-llog-ts`. Vacío/error/sin proyecto: `.du-empty-state` (mismo mensaje, sin diferenciar, confirmado por lectura de código) | Con candidatos / vacío (`.du-empty-state`) | Fila por CHECKPOINT sin sprint asignado con `learning`/`blockers`/`decision` no vacíos (`getCheckpointFlowsWithoutSprint`). Snippet: primer campo no vacío entre esos tres en ese orden, truncado a 140 caracteres + `…`. Meta: `.du-meta-doc` = `role`, `.du-meta-section` = timestamp relativo (`_relTs`). Poblada al activar cualquier sub de la familia Proyectos (`dashboard`/`htmlmap`/`context`/`docupdates`/`contratos`/`learning-log`) — no solo al activar el sub-tab propio, mismo fix de recálculo ya aplicado a `docupdates`. Origen: `TKT-202608-428`, parent `REQ-202608-171`, PP-S-41 |
| Botón "Marcar evaluado" | `#llog-list` (dinámico), delegado en `_initLearningLogListeners()` (`locus-docs.js`) | `.btn-ghost` (genérica, reutilizada) + `data-action="mark-learning-log-evaluated"` + `data-ts` — sin clase propia nueva, confirmado contra `locus-docs.css` (0 coincidencias `llog`/`learning`) | Click → invoca `markLearningLogEvaluated(project.id, throughTs)`; la fila (`.closest('.du-entry')`) se remueve del DOM solo tras resolver la promesa, sin `.catch` — si falla silenciosamente, la fila permanece | Si `#llog-list` queda vacío tras la remoción, repone `.du-empty-state`. Sub-tab sin danger zone — mismo criterio que `docupdates`. Origen: `TKT-202608-428`, parent `REQ-202608-171`, PP-S-41 |
| Botón de export | `#btn-export-learning-log` (`index.html`, confirmado) | `.tpl-action-btn` (genérica, `is-hidden` por default — mismo patrón que `#btn-export-backlog-full`/`#btn-export-sprints`, siblings en `#tpl-toolbar`) — sin clase propia nueva | Único — sin variantes | Dispara `exportLearningLogMd()` vía `shell:export-learning-log` (`locus-backlog-generator.js`) — mismo mecanismo que el resto de exports puntuales. Descarga `_[Prefijo]-learning-log-candidatos.md`. Origen: `TKT-202608-426` (REQ-202608-171, TKT5), PP-S-41 |

**Categoría cerrada — verificación completa (esta sesión):** Las 3 filas confirmadas contra código real (`locus-docs.js`, `locus-docs.css`, `index.html`). Cero CSS nuevo en toda la categoría — el sub-tab completo reutiliza `.du-*`/`.btn-ghost`/`.tpl-action-btn` ya existentes.

---

## Inventario — Cat. Panel DIFF — elemento informativo (parcial — alta puntual, mismo criterio que Cat. Toolbar / filtros)

No es parte de una auditoría completa de la categoría. Alta puntual disparada por `doc_relevance_confirmada.ui_inventory: sí` (`§Criterio de mantenimiento`).

| Elemento | Módulo(s) | Clases | Estados | Nota |
|---|---|---|---|---|
| Chip de discard_reason en card de patch DISC→descartado | `#merge-diff-body` (dinámico, `locus-backlog-merge.js` `_buildPatchCard()`/`_card()`) | `mdiff-discard-reason-chip` | Condicional — solo se renderiza si el patch declara `discard_reason`; sin ese campo, el chip no se inyecta (no hay estado vacío) | Chip subordinado a `.mdiff-pill--discarded` — mismo tono (`--red-dim`/`--red`/`--red-border`), sin ícono, `--text-2xs` (piso de la escala) para jerarquía visual menor. Parte de la card completa (badge `.item-type-pill.DISC` + transición discovery→descartado + este chip + footer) que reemplaza `.diff-chip--descarte` para este caso. `design_intent: disc_status_transition_patch_card`. Origen: TKT1 (ref_id `CAEL-08201600-02`, parent `CAEL-08201600-01`) |

---

## Criterio de mantenimiento (vigente, heredado del fragmento)

- Marcar `retirado` con nota, no eliminar la fila — preserva trazabilidad (`§Cambios mod:39` original).
- Verificar contra código real (grep, header de identidad, `mod` del CSS) antes de declarar estado — nunca inferir desde el nombre de la clase.
- `doc_relevance_confirmada.ui_inventory: sí` en un TKT es el trigger de alta — Rune/Nova declaran la fila en el mismo CHECKPOINT de entrega o generan gap de sesión (ver nota de arriba sobre `INC-202608-105`).

---

## Changelog (fragmento disponible + auditoría directa)

**mod:71** — Nova, DOC-UPDATE en sesión Execution: alta `.mdiff-discard-reason-chip` — nueva sección parcial "Cat. Panel DIFF — elemento informativo", mismo criterio que "Cat. Toolbar / filtros" (mod:60). Trigger: `doc_relevance_confirmada.ui_inventory: sí` declarado por Nova en el CHECKPOINT de entrega de TKT1 (ref_id `CAEL-08201600-02`, parent `CAEL-08201600-01`). CSS verificado contra `locus-backlog-item.css` real (mod:113) — consumidor JS (`locus-backlog-merge.js`, TKT2) todavía pendiente en esta sesión. Excepción de dueño co-presente (`__BR-Core §OWNERSHIP DE DOCUMENTOS`) — nivel Patch, sin bifurcación de founder, dueña (Nova) presente en sesión Execution.

**mod:70** — Nova, DOC-UPDATE en sesión Execution: retiro solicitado de `#ingest-process-batch-btn` ("Procesar batch", Col 1 del modal de ingesta) — **corrección de la solicitud, no eliminación de fila:** verificado por grep contra este doc que el botón nunca tuvo entrada propia en el inventario — ni en la tabla de Overlay/Modal (`#ingest-modal-overlay`, fila ya presente, es la columna contenedora, no el botón), ni en "Cat. Toolbar / filtros" ni en "Cat. Formularios y botones de acción". No hay fila que retirar. Hallazgo fuera de scope registrado en su lugar: `.ingest-modal-actions` (`locus-modals-base.css` línea 556) queda huérfana tras el retiro del botón en `TKT1` (ref_id `CAEL-08201430-02`, `_Locus-module-contracts` mod:200) — sin nodo que la use. `Propuesta de mejora` a Nova — evaluar retiro de la clase en próxima sesión sobre `locus-modals-base.css` (Rune no escribe `.css`, no lo resolvió en el TKT de origen). Excepción de dueño co-presente (`__BR-Core §OWNERSHIP DE DOCUMENTOS`) — nivel Patch, sin bifurcación de founder, dueña (Nova) presente en sesión Execution.

**mod:69** — Nova, DOC-UPDATE en sesión Execution: categoría "Cat. Learning Log — sub-tab" (mod:68) verificada completa contra código real — `locus-docs.js`, `locus-docs.css` e `index.html`, los tres adjuntos en esta sesión (en dos entregas). Confirmado: cero CSS nuevo en toda la categoría — shell estático reutiliza `.spt-tab`/`.session-subpanel`/`.du-panel-header`/`.du-list` (fila nueva agregada), lista/fila dinámica reutiliza `.du-entry`/`.du-empty-state` (grep `llog`/`learning` en `locus-docs.css`: 0 coincidencias), botón "Marcar evaluado" es `.btn-ghost` genérico + `data-action`/`data-ts`, botón de export es `.tpl-action-btn` genérico (sibling de `#btn-export-backlog-full`/`#btn-export-sprints` en `#tpl-toolbar`). Categoría promovida de "parcial — alta puntual" a "completa, auditada contra código real" — mismo criterio de encabezado que las 5 categorías ya completas del doc. Nota de meta agregada (`.du-meta-doc` = role, `.du-meta-section` = timestamp relativo) y precisión sobre el trigger de render (cualquier sub de la familia Proyectos, no solo `learning-log`). Excepción de dueño co-presente — nivel Patch, sin bifurcación de founder, dueña (Nova) presente en sesión Execution.

**mod:68** — Nova, DOC-UPDATE en sesión Execution: categoría nueva "Cat. Learning Log — sub-tab" — alta 3 filas: lista de candidatos (`#llog-list`, `renderLearningLog()`), botón "Marcar evaluado" (delegado en `_initLearningLogListeners()`, invoca `markLearningLogEvaluated()`), botón de export (`#btn-export-learning-log`, dispara `exportLearningLogMd()` vía `shell:export-learning-log`). Origen: `TKT-202608-426`/`TKT-202608-428`, parent `REQ-202608-171`, PP-S-41. Trigger: gap detectado por Cael al verificar `_pp-context §5` contra los tres Doc Refs pendientes del cierre de PP-S-41 — `_Locus-module-contracts` (mod:195) ya señalaba el elemento como "nuevo elemento auditable" pendiente de este doc. Fuente: contrato de `_Locus-module-contracts`, sin archivo real (`locus-docs.js`/`locus-docs.css`) adjunto en esta sesión — clases exactas de botón/fila quedan como nota de verificación pendiente, no inventadas. Excepción de dueño co-presente (`__BR-Core §OWNERSHIP DE DOCUMENTOS`) — nivel Patch, sin bifurcación de founder, dueña (Nova) presente en sesión Execution (auto-orquestación, Project Setup Execution).

**mod:67** — Nova, DOC-UPDATE en sesión Execution: categoría nueva "Cat. Tab Sprint — elemento auditable" — alta 1 fila: card de sprint activo con detalle colapsable (`#sps-activo .sps-card`, control `.sps-card-detail-toggle`, estados expandido/colapsado, foco visible + `aria-expanded`). Origen: `TKT-202608-365`, parent `REQ-202608-146`. Trigger: `doc_relevance_confirmada.ui_inventory: sí`. Espejo de Patrón A-13 en `_Locus-ux-ref` (mod:54) y fila nueva en `_Locus-css-ref §Patrones` (mod:206), mismo movimiento. Excepción de dueño co-presente (`__BR-Core §OWNERSHIP DE DOCUMENTOS`) — nivel Patch, sin bifurcación de founder, dueña (Nova) presente en sesión Execution.

**mod:66** — Nova, DOC-UPDATE en sesión Execution: alta 7 filas en "Cat. Iconografía — elemento informativo" — íconos migrados de glifo emoji/Unicode a mask-token `--icon-*` (`.breadcrumb-seg--proj::before`, `.theme-toggle-btn::before`, `.ac-list li::before`, `.sph-pending-badge::before`, `.plan-file-pill--broken::before`, `body.body--focus-mode::before`/`::after`), origen TKT CAEL-08150730-02 (parent REQ CAEL-08150730-01). Trigger: `doc_relevance_confirmada.ui_inventory: sí` declarado por Nova en el CHECKPOINT de entrega del TKT. Cierra Patrón nuevo de `_Locus-css-ref §Patrones` (mod:203, mismo movimiento). Excepción de dueño co-presente (`__BR-Core §OWNERSHIP DE DOCUMENTOS`) — nivel Patch, sin bifurcación de founder, dueña (Nova) presente en sesión Execution.

**mod:65** — Nova, DOC-UPDATE en sesión Execution: alta `.ingest-block-preview-tag--crea`/`--modifica` (`TKT-202608-333`) — fila nueva en "Cat. Ingest preview — elemento informativo" (mod:62), mismo criterio de alta puntual. Trigger: `doc_relevance_confirmada.ui_inventory: sí` declarado por Nova en el CHECKPOINT de entrega del TKT. Cierra extensión de Patrón A-12 de `_Locus-ux-ref` (mod:51, mismo movimiento).

**mod:64** — Nova, DOC-UPDATE en sesión Execution: alta `.chevron`/`.chevron--btn` (`TKT-202608-327`, parent `REQ-202608-131`) — nueva sección parcial "Cat. Iconografía — elemento informativo", mismo criterio que "Cat. Toolbar / filtros" (mod:60). Trigger: `doc_relevance_confirmada.ui_inventory: sí` declarado por Rune vía patch de corrección sobre el TKT ya cerrado — el CHECKPOINT original de entrega no lo declaró (gap de proceso, corregido en la misma sesión antes de continuar). Excepción de dueño co-presente (`__BR-Core §OWNERSHIP DE DOCUMENTOS`) — nivel Patch, sin bifurcación de founder, dueña (Nova) presente en sesión Execution.

**mod:63** — Nova, DOC-UPDATE en sesión Execution: alta `.du-group`/`.du-group-header`/`.du-group-title`/`.du-group-count`/`.du-btn-copy-group` (`TKT-202608-325`, parent `REQ-202608-129`) — nueva sección parcial "Cat. Panel DOC-UPDATEs pendientes — elemento informativo", mismo criterio que "Cat. Toolbar / filtros" (mod:60) y "Cat. Q-INC" (mod:61). Trigger: `doc_relevance_confirmada.ui_inventory: sí` declarado por Rune en su CHECKPOINT de entrega. Excepción de dueño co-presente (`__BR-Core §OWNERSHIP DE DOCUMENTOS`) — nivel Patch, sin bifurcación de founder, dueña (Nova) presente en sesión Execution.

**mod:62** — Nova, DOC-UPDATE en sesión Execution: alta `.ingest-block-preview-icon--trace`/`.ingest-block-preview-tag`/`.ingest-block-preview-origin` (TKT1/TKT2, parent `CAEL-08111800-01`) — nueva sección parcial "Cat. Ingest preview — elemento informativo", mismo criterio que "Cat. Toolbar / filtros" (mod:60) y "Cat. Q-INC" (mod:61). Trigger: `doc_relevance_confirmada.ui_inventory: sí` declarado por Nova (TKT1) y Rune (TKT2) en sus CHECKPOINTs de entrega. Cierra Patrón A-12 de `_Locus-ux-ref` (mod:50, mismo movimiento).

**mod:61** — Nova, DOC-UPDATE en sesión Execution: alta `.qinc-readonly-banner` (`TKT-202608-323`, parent `REQ-202608-128`) — nueva sección parcial "Cat. Q-INC — elemento informativo", mismo criterio que "Cat. Toolbar / filtros" (mod:60). Trigger: `doc_relevance_confirmada.ui_inventory: sí` declarado por Rune en el mismo CHECKPOINT de entrega. Cierra Gap A-11 de `_Locus-ux-ref` (mod:49, mismo movimiento).

**mod:60** — Nova, DOC-UPDATE en sesión Execution: alta `#btn-export-sprints` (`TKT-202608-317`, parent `REQ-202608-126`) — nueva sección parcial "Cat. Toolbar / filtros", categoría general sigue `Pendiente`. Trigger: `doc_relevance_confirmada.ui_inventory: sí` declarado por Rune en el mismo CHECKPOINT de entrega.

**mod:59** — Nova, auditoría directa contra repo real: Cat. Formularios y botones de acción reconstruida completa — confirmación inline (`.pop-delete-confirm` activo / `.qn-delete-confirm` muerto), `.char-counter`, status popover, danger zone por texto (3 implementaciones paralelas del mismo patrón, sin helper compartido). Dos hallazgos fuera de scope: familia `.qn-delete-*` (Quick Note) es CSS muerto sin consumidor JS; `.char-counter` tiene regla base duplicada en `locus-backlog.css` + `locus-modals-base.css`, estado `.warn` en un tercer archivo. Ambos registrados como `Propuesta de mejora` a Nova.

**mod:58** — Nova, auditoría directa contra repo real: Cat. Chip/Badge inline (Backlog list + children block) y Cat. Backlog item — subline reconstruidas completas. Confirmadas activas las 3 filas ya conocidas del fragmento (`.bitem-type-code`, `.item-code-badge`, `.bitem-subline-archivos`) + 4 chips de subline no documentados (`.bitem-subline-role`, `.bitem-subline-area`, `.bitem-subline-sprint`, `.bitem-focus-rank`). Hallazgo fuera de scope: `.bitem-focus-rank` es código muerto — `item._focusRank` no se asigna en ningún módulo del repo, la rama de render es inalcanzable pese a tener CSS completo. `Propuesta de mejora` registrada a Cael — confirmar con founder si Focus mode con ranking sigue vigente.

**mod:57** — Nova, auditoría directa contra repo real: Cat. Badge/Status — Backlog + Q-INC reconstruida completa (prioridad, status Gen2, `.bitem-prio-badge`, `.bitem-status-chip`, `.qinc-type-badge`, `.qinc-badge` genérico, señales SLA). Hallazgo fuera de scope: `.qinc-type-badge--ke` es CSS muerto — literal `'KE'` inalcanzable en todo el código ejecutable desde la fusión a `PRB.root_cause_confirmed` (infra_version 51); `Propuesta de mejora` registrada para retiro en próximo TKT sobre `locus-incidents.css`.

**mod:56** — Nova, auditoría directa contra repo real (`Archivo_2.zip`): Cat. Overlay/Modal reconstruida completa — 25 raíces confirmadas por grep de `index.html` + función open/close verificada en JS. Re-confirmada ausencia de familias `cp-*`/`notif-config-*`/`standalone-ckpt-*`/`status-confirm-*`/`proj-modal`/`proj-panel` (0 coincidencias, consistente con mod:51). Hallazgo fuera de scope: `#ingest-modal-overlay` y `#merge-diff-overlay` no son overlays raíz — son columnas de `#modal-split-shell` (candidato a nivel `panel` de Patrón A-09, `_Locus-ux-ref`). Nota de `#cmdk-overlay` (mod:52) actualizada: trigger `⌘K` ya wireado, no queda "shell parcial" — moved a la tabla completa de Overlay/Modal.

**mod:54** — Nova, DOC-UPDATE en sesión Execution: alta `.bitem-subline-archivos` (TKT-202608-302), registro retroactivo, cierre `INC-202608-105`.

**mod:53** — Nova, DOC-UPDATE en sesión Execution: alta `.bitem-type-code` + `.item-code-badge` (TKT CAEL-08101542-02, parent REQ CAEL-08101542-01).

**mod:52** — Nova: alta `#cmdk-overlay` (TKT-202608-288, parent REQ-202608-118, PP-S-31).

**mod:51** — Auditoría de flujos (Claude, sin REQ/TKT): `DISC-202608-092` cerrada — grep contra `index.html` real confirma 0 coincidencias de `proj-modal-overlay`/`proj-panel-overlay`/`proj-panel-body`/`proj-panel-close-btn`. Fila 23 corregida (nota de verificación pendiente → confirmada). Corrección de hallazgo previo de la misma auditoría (`_Locus-css-ref §mod:175`): "~25 elementos retirados aún inventariados" era lectura incorrecta — están correctamente marcados `retirado`, no es deuda. Verificación adicional sin hallazgo: cadena `#notif-config-*` funcional vía `_gconfirmOpen()` tras reescritura en `TKT2, REQ CAEL-0722-01`.

**mod:1–50** — no disponibles en esta sesión. Ver nota de gap al inicio del documento.
