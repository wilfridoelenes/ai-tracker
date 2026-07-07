# _Locus-css-ref.md
<!-- mod:36 | Última actualización: 2026-07-06 | CSS Reference — Locus — mantenida por Nova, consumido por Rune -->

## Cambios (mod:36) — familia `.ct-pill-*` extendida a 7 tipos Gen2 + Cluster B contraste ITIL — TKT-202607-003

- **Gap cerrado — contraste de texto ITIL bajo 4.5:1:** `--orange`/`--yellow` (light) y `--slate` (dark) fallaban como color de texto de pill (2.93–3.46:1 / 3.31–4.02:1) — no habían sido verificados para ese uso, solo documentados como color de tag/severity. Tokens `--orange-text`/`--yellow-text`/`--slate-text` agregados en `locus-base.css` mod:7 — ver `§Colores declarados — .ct-pill-*`.
- **Migración `.ct-pill-r/t/b` → `.ct-pill-req/tkt/inc`** (`locus-analytics.css` mod:7) + agregadas `.ct-pill-disc`/`.ct-pill-prb`/`.ct-pill-ke`/`.ct-pill-chg` — Cycle Time por tipo ahora cubre los 7 tipos Gen2. Ver `§Selectores Gen 1` y `§Colores declarados — .ct-pill-*`.
- **Hallazgo sin resolver — fuera de scope:** `--blue`/`--red` como texto de pill (`.item-type-pill`/`.ct-pill-req`/`.ct-pill-inc`) caen bajo 4.5:1 en light theme contra `--surface3`/`--bg2` (~3.31–4.11:1) — mismo patrón que el gap de ITIL recién cerrado, pero no corregido en este TKT. Registrado como DISC.

## Cambios (mod:35) — familias `.blf-*` (popover Filtros) y `.blt-*` (popover Tipos) documentadas — TKT1/TKT2 [tmp:req-clutter-backlog]

- **Gap cerrado:** `#bl-filter-badge` (§1249, T-202606-057) documentaba un selector sin instancia activa en el codebase desde el REQ de consolidación de toolbar anterior — deuda de documentación señalada por Rune y confirmada por Nova al iniciar TKT1. Reemplazado por la familia real introducida en este REQ.
- **Nueva sección `### Popovers de toolbar/stats — familia .blf-* / .blt-* (TKT1/TKT2)` en `§Patrones de componentes flotantes`** — documenta ambos popovers como adaptación del patrón ya validado `.sps-menu-wrap` / `.sps-btn-menu` / `.sps-dropdown` (visibilidad via atributo `hidden` nativo, no `.is-hidden`).
- **Principio de diseño:** se reutilizó el patrón `.sps-dropdown` en vez de crear un componente de popover nuevo — mismo lenguaje visual ya conocido por el sistema, menor superficie de mantenimiento. Trigger visual basado en `.bl-strip-btn` para consistencia con la fila de toolbar existente.
- **Accesibilidad verificada:** `:focus-visible` con `outline: 2px solid var(--accent)` heredado del mismo patrón que `.sps-btn-menu`. Contraste de badge (`--accent` + `--text-on-accent`) — mismo par ya validado en el sistema.
- **Sin tokens nuevos** — reuso exclusivo de `--text-xs` · `--text-sm` · `--text-2xs` · `--radius-xs/sm/md/pill` · `--surface/2/3` · `--border/2` · `--accent` · `--accent-dim` · `--text-on-accent` · `--z-popover` · `--trans-fast/color`.
- **Archivo:** `locus-backlog.css` (mod:75).
- **Origen:** Propuesta de mejora emitida por Nova al cierre del REQ, aplicada en esta sesión de doc por instrucción del founder.
- **`infra_version`:** sin cambio — Doc Ref, usa `mod` como señal de frescura.

---

## Cambios (mod:34) — `.bitem-collapse-arrow` agrandado + reposicionado como primer control del header; cleanup de selector huérfano

- **Gap cerrado — target de click insuficiente:** `.bitem-collapse-arrow` usaba `var(--text-2xs-plus)` (10px) sobre un `width: 12px` — carácter de disclosure triangle apenas clickeable (Fitts's Law). Nunca estuvo documentado en este ref pese a tener familia activa en `locus-backlog-item.css` — gap de cobertura, no solo de tamaño.
- **Fix aplicado:** `font-size: var(--text-lg)` (16px) + `width: 20px` + `color` en hover heredado de `.bitem-header:hover` (antes sin feedback de hover propio). Ver nueva sección `### Header de ítem — orden de controles` en `§Patrones de layout`.
- **Reposición HTML (Rune):** el chevron pasó a ser el primer elemento del `.bitem-header`, antes de `.item-drag-handle` — convención de disclosure triangle (anticipa contenido, se lee antes). Selección por `id`/`class` en JS — sin dependencia de orden DOM, reposición sin riesgo de romper toggle.
- **Cleanup — selector huérfano detectado por el reorder:** `.bitem-type-TKT ~ .bitem-title-col ~ .bitem-collapse-arrow ~ .bitem-header-right .bitem-effort-dot.on` dependía del orden DOM anterior (chevron después de `.bitem-title-col`). Tras el reorder dejó de matchear — sin efecto visible porque la misma regla ya tenía `.item.bitem[data-type="TKT"] .bitem-effort-dot.on` como selector duplicado por atributo. Eliminado — cero selectores combinador-hermano dependientes de orden de header restantes, verificado con grep antes de entregar.
- **Origen:** hallazgo fuera de scope registrado por Rune durante TKT de fix del chip de sprint en DISC.
- **`infra_version`:** sin cambio — Doc Ref, usa `mod` como señal de frescura.

---

## Cambios (mod:33) — familia `--idea-*` (card DISC) desconectada de `--purple`: INC de color naranja resuelto

- **Gap cerrado:** `.bitem--idea` (card completa de DISC en `locus-backlog.css`) declaraba una paleta HSL propia y paralela — `--idea-hue: 42` (naranja) — que nunca estuvo atada a `var(--purple)`, el token semántico de DISC ya correcto en `.item-type-pill.DISC` / `.bitem-type-DISC`. La card se renderizaba naranja pese a que el pill de tipo sí mostraba púrpura.
- **Fix aplicado:** `--idea-color` / `--idea-color-dim` / `--idea-bg` / `--idea-bg-hover` / `--idea-border` / `--idea-badge-bg` / `--idea-badge-text` ahora se derivan de `var(--purple)` vía `color-mix`, en el bloque light y en `[data-theme="dark"]`. `--idea-hue` fue eliminado — cero declaraciones ni consumidores residuales, verificado antes de entregar.
- **Contraste verificado:** texto del badge en negro sobre `var(--purple)` → 5.26:1, cumple AA 4.5:1.
- **Anti-pattern registrado:** una familia de variables de card completa (`--idea-*`) puede declararse en hue crudo (`--idea-hue`) sin referenciar el token semántico del tipo correspondiente, sin que ninguna auditoría de este doc lo capture si esa familia no está inventariada junto a `.item-type-pill`/`.bitem-type-*`. Ver tabla `§Colores declarados — item-type-pill Gen2` — la familia `.bitem--idea` ahora referenciada explícitamente ahí.
- **Origen:** INC reportado por el founder — DISC visualmente naranja. Investigado por Rune (causa raíz), fix implementado por Nova.
- **`infra_version`:** sin cambio — Doc Ref, usa `mod` como señal de frescura.

---

## Cambios (mod:32) — bug visual real en bloque "Intención del R": `.ie-intencion-group`/`.ie-intencion-field` sin layout

- **Gap cerrado:** `#item-editor-overlay .ie-intencion-group` (gap:10px) y `#item-editor-overlay .ie-intencion-field` (gap:5px) agregados en `locus-sesiones.css` (mod:19→20). Sin estas reglas, los 3 sub-campos del bloque Intención (Problema/Done cuando/No incluye) se apilaban sin espaciado.
- **Detectado durante:** verificación manual del árbol HTML del Item Editor al resolver el `Hallazgo — clases CSS referenciadas sin definición` — no capturado por el cruce automático del inventario porque los wrappers no tienen ID propio.
- **Falsos positivos confirmados en el mismo hallazgo (sin cambio de CSS):** `ie-input` (3 inputs del bloque intención) y `ie-select` (`#item-sprint`) — ya cubiertos por los selectores de tipo `#item-editor-overlay .ie-field input/select`, mismo mecanismo que Cat.1 del inventario.
- **Fila `ie-` en `§Prefijos de módulo` actualizada** con la sub-familia `ie-intencion-*`.
- **`infra_version`:** sin cambio.

---

## Cambios (mod:31) — cierre de 2 gaps de nomenclatura del inventario UI (auditoría Finn, mod:14): prefijo `ie-` y familia `.status-confirm-*` documentados

- **Gap cerrado 1 — `#item-sprint-inherited-val` sin CSS:** nueva regla `#item-editor-overlay .ie-field .ie-sprint-inherited` en `locus-sesiones.css` (mod:19) — mismo box que input/select del Item Editor, color `--text2` para señalar valor no editable.
- **Gap cerrado 2 — `#status-confirm-title` sin CSS:** nueva regla `.status-confirm-title` en `locus-backlog.css` (mod:73) — mismo patrón que `.tag-modal-title` (box de 340px).
- **Prefijo `ie-` agregado a `§Prefijos de módulo`** — no estaba documentado pese a tener familia activa en `locus-sesiones.css` y `locus-modals.css`.
- **Nueva sección `### Confirmación de status — familia .status-confirm-*` en `§Patrones de componentes flotantes`** — documenta la arquitectura: base visual en `locus-backlog.css`, animación/estados compartidos con otras familias de modal en `locus-modals.css`.
- **Hallazgo sin resolver en este mod:** comentario en `locus-modals.css:2925` declara que los compuestos `#item-editor-overlay .ie-*` viven en `locus-tracker.css` — archivo inexistente en el proyecto, en realidad viven en `locus-sesiones.css`. Fuera de scope de este cierre — requiere sesión propia de limpieza de comentarios.
- **`infra_version`:** sin cambio — Doc Ref, usa `mod` como señal de frescura.

---

## Cambios (mod:30) — TKT3 REQ Fixes subtab Backlog Histórico: `.arch-zone-divider` documentado

- **Gap cerrado:** `.arch-zone-divider` se inserta en el DOM por `renderArchivoHistorico()` (`locus-backlog-archive.js`) desde antes de este sprint, sin definición CSS — divisor invisible entre zonas de sprint consecutivas en el panel Histórico. Detectado en auditoría de Finn.
- **Nueva sección `### Divisor de zona — .arch-zone-divider` en `§Patrones de componentes flotantes`.**
- **Sin tokens nuevos:** reuso exclusivo de `--border`, mismo token que `.arch-historico-body` y `.arch-item-row` en el mismo archivo.
- **`infra_version`:** sin cambio — Doc Ref, no versiona por infra_version (usa `mod` como señal de frescura).

---

## Cambios (mod:29) — TKT1 REQ gutter subtabs + patrón barra sticky de contenedor (INC-202607-001)

- **Gap cerrado 1 — gutter unificado de subtabs:** Token `--subtab-gutter: 12px` declarado en `locus-base.css` (mod:6). Consumido como `padding-left` en `.tpl-detail` (`locus-proyectos.css` mod:6), `#tab-proyectos` (`locus-backlog.css` mod:72) y `#tab-sesiones` (`locus-sesiones.css` mod:18). `#tab-analytics` y el contenedor externo de `#tab-backlog` quedan fuera — ya declaran `padding: 2rem` propio, mayor al gutter objetivo; aplicar el token ahí habría apilado el valor en vez de unificarlo. Nueva sección `### Gutter unificado de subtabs — token --subtab-gutter` en `§Patrones de layout`.
- **Gap cerrado 2 — barra sticky de contenedor:** Patrón documentado para `.bl-toolbar`, `.active-filter-chips` y equivalentes futuros — ver detalle en nueva sección `### Barras sticky de contenedor (toolbar/stats)` en `§Patrones de layout`. Origen: INC-202607-001.
- **Nueva sección de nivel superior `## Patrones de layout`** — agrupa ambos patrones; antes no existía un lugar natural para reglas de layout estructural (distintas de `§Patrones de componentes flotantes`, que cubre overlays/popups).
- **`infra_version`:** sin cambio — Doc Ref, no versiona por infra_version (usa `mod` como señal de frescura).

---

## Cambios (mod:28) — familia `tvh-notif-*` documentada, TKT3a (teaser de notificación en tracker-view-header)

- **Gap cerrado:** TKT3a introdujo `.tvh-notif-teaser`, `.tvh-notif-icon`, `.tvh-notif-title`, `.tvh-notif-body`, `.tvh-notif-viewall` en `locus-sesiones.css` sin sección propia — el prefijo `tvh-` ya estaba listado en la tabla de prefijos pero sin patrón documentado.
- **Nueva sección `### Teaser de notificación — familia tvh-notif-*` en `§Patrones de componentes flotantes`** — ver detalle abajo.
- **Tokens reusados, sin tokens nuevos:** `--card-bg-hover`, `--text`, `--color-primary` — mismos que `.rsb-notif-item--unseen`/`.rsb-notif-title` en `locus-radar.css`, contraste ya validado en ese componente.
- **`infra_version`:** sin cambio — Doc Ref, no versiona por infra_version (usa `mod` como señal de frescura).

---

## Cambios (mod:26) — gap de contraste --green (light) como elemento gráfico no-texto, detectado en fix de acento por tipo del modal DIFF

- **Gap cerrado:** `--green` (light, `#1aab5a`) sobre `--surface1`/`--surface2` da 2.99:1/2.82:1 — falla el mínimo 3:1 para elementos gráficos no-texto (bordes, acentos), estándar WCAG 2.1 AA distinto del 4.5:1 de texto que este doc ya verificaba para otros tokens (ej. `--purple`). Como color de texto no fue verificado en este análisis — puede seguir siendo válido para ese uso.
- **Tabla de tokens de color utilitarios:** fila `--green` actualizada con la nota de contraste y referencia al override aplicado.
- **Override acotado, sin tocar el token global:** `locus-backlog-item.css` usa `#16914c` en `[data-theme="light"] .mdiff-card.mdiff-type--tkt` — corrige solo el uso de acento de card (2px border-top), no afecta otros consumidores de `--green`.
- **Origen:** detectado durante auditoría de Finn del fix de acento por tipo (7 tipos) del modal DIFF — `--yellow`/`--slate` (KE/CHG) inicialmente señalados no requerían ajuste al re-evaluar contra el estándar correcto (3:1); único caso real fue `--green` en TKT/light.
- **`infra_version`:** sin cambio — Doc Ref, no versiona por infra_version (usa `mod` como señal de frescura).

---

## Cambios (mod:25) — REQ header en 3 zonas + limpieza CSS muerta

- **Gap cerrado:** `.header-zone` (familia `--brand` / `--nav` / `--utils`) introducida en `locus-layout.css` mod:8 no tenía sección propia pese a reorganizar `.header-inner` completo — auditoría de header requería grep manual. Nueva sección `### Header global — familia .header-zone-*` en `§Patrones de componentes flotantes`.
- **`.cmd-k-pill` eliminada** de `locus-layout.css` (mod:9) — sin instancias activas en `index.html` ni en ningún otro archivo real del proyecto. Confirmado por grep completo antes de eliminar. No pasa por `§Deprecated` porque no había call sites que migrar — eliminación directa, no candidata a sprint siguiente.
- **`.tabs` pierde `margin-inline: auto`** — el centrado de la navegación ahora vive en `.header-zone--nav`. Único call site de `.tabs` es el header (`index.html` L72) — sin impacto lateral fuera de este módulo.
- **`infra_version`:** sin cambio — `10` sigue vigente, coincide con BR-Execution v1.4 y OB-Strategy v1.9.

## Cambios (mod:24) — TKT-202607-001: documentado patrón mdiff-queue-badge, gap detectado por Finn

- **Gap cerrado:** `.mdiff-queue-badge` / `.mdiff-queue-badge--qinc` nunca estuvieron documentados en este doc pese a tener call sites activos desde INC-[pendiente-ID] — detectado durante el fix de `--qdisc` (DIFF mostraba selector de sprint incorrecto para DISC).
- **Nueva sección** en `§Patrones de componentes flotantes`: `mdiff-queue-badge` — badge de cola fija en modal DIFF. Documenta las tres variantes (`base` / `--qinc` / `--qdisc`) y la lógica de selección en JS (`_QINC_TYPES` / `_QDISC_TYPES`).
- **`--qdisc` agregado** — color `var(--purple)`, mismo token que `.item-type-pill.DISC` (consistencia con `§Colores declarados — item-type-pill Gen2`, ya existente).
- **Anti-pattern registrado:** declarar clase modificadora en JS no garantiza CSS existente — `--qinc` estuvo sin color propio sin que se detectara, por seguir siendo visualmente aceptable en el tono neutro heredado de la clase base.
- **`infra_version`:** `8` → `10`, sincronizado con BR-Execution v1.4 y OB-Strategy v1.9 vigentes.

## Cambios (mod:23) — TKT2/TKT3 REQ-tmp-qa-cleanup S'02: limpieza de CSS huérfano detectada en auditoría QA

- **Eliminadas de `locus-backlog.css`:** `.stat-progress-pct` · `.stat-mini-track` · `.stat-mini-fill` (+ override `[data-theme="light"] .stat-mini-fill`) — sin call sites en JS ni HTML, huérfanas desde un rediseño previo de la barra de progreso de stats-bar. Detectado por Finn durante auditoría QA de stats-bars (hallazgo #3b).
- **Eliminado de `locus-base.css`:** token `--green-dark` — huérfano tras la eliminación de `.stat-mini-fill`, su único consumidor en todo el codebase. Verificado: 0 referencias tras el cambio.
- **Tabla de tokens de color utilitarios:** fila `--green-dark` removida.
- **Regla `--green-dark`:** removida — ya no aplica, componente eliminado.

---

## Cambios (mod:22) — corrección de color --c-high-* y anti-pattern de naming vs --c-severity-high-*

Discrepancia detectada por Finn en cierre de REQ-limpieza-ui-locus: este doc declaraba `--c-high-bg/text/border` como Azul, pero `locus-base.css` (mod:3) los implementa en naranja desde origen — error preexistente del doc, no del código. Corregido el color declarado. Agregada nota de anti-pattern para no confundir con el token `--c-severity-high-*` (familia distinta, introducida en TKT2 del mismo sprint) — ambos comparten naranja por coincidencia.

---

## Cambios (mod:21) — TKT-D3 / TKT-D5: Q-INC reemplaza S-HOTFIX

- **Prefijo `qinc-` agregado** a tabla de prefijos de módulo — `locus-backlog.css`. Cubre panel Q-INC, cards ITIL, badges SLA, secciones y stats bar del panel.
- **`#sps-hotfix` → `#sps-qinc`** — renombrado en `index.html` (TKT-D1). Tabla de secciones del sub-tab Sprints actualizada.
- **`sprint-group-hotfix` / `sprint-badge-hotfix`** — eliminadas de `locus-backlog.css` y `locus-sprint.css` (TKT-D3). Filas marcadas como eliminadas en tabla de sprint groups.
- **Nota de detección de hotfix** (`isHotfix`) — eliminada. `S-HOTFIX` no existe en Gen 2; la detección ya no aplica.
- **Clases `qinc-item--sla-vencido` / `qinc-item--sla-riesgo`** documentadas en §Sprint groups (referencia a sección qinc-* en §Patrones de componentes).

---

## Cambios v0.6.4 (mod:19) — coherencia con BR Gen 2 (infra_version: 5)

- **Encabezado actualizado:** `infra_version: 20` → `5` · versiones BR actualizadas a Gen 2 (BR-Core v1.3 · BR-Ecosystem v1.2 · BR-Execution v1.1 · OB-Strategy v1.4). El archivo ya no declara versión en el nombre (patrón Doc Ref correcto per `__OB-Strategy §5`).
- **Terminología de tipos de ítem:** Referencias a letras cortas Gen 1 en texto descriptivo actualizadas a nombres canónicos Gen 2. Selectores CSS reales (`--r/--t/--b/--p`) documentados como estado actual del codebase — pendientes de migración por Rune (ver nota de migración al final de cada sección afectada).
  - `bl-vl-`: "Rs y Ts" → "REQs y TKTs"
  - `spl-row-counts`: "pills R/T/B" → "pills REQ/TKT/INC"
  - `spl-type--r/t/b`: documentado con nota de migración a `--req/--tkt/--inc`
  - `arch-row-type--r/t/b/p`: documentado con nota de migración a `--req/--tkt/--inc/--disc`
  - Sección Cerradas: "P terminales" → "DISC terminales"

---

## Cambios v0.6.3 (mod:18) — unificación naming Col 3 popup

- **Selectores canónicos definitivos para T-202606-016/017:** `du-doc` · `du-section` · `du-badge` · `du-badge--agregar/--reemplazar/--eliminar` · `du-escalacion` · `docupdate-rows` · `file-rows` · `file-row-mod-pill`.
- **Eliminados de `locus-sesiones.css`:** `docupdate-doc` · `docupdate-section` · `docupdate-action` · `docupdate-escalate`. Sin call sites JS — eliminación limpia confirmada por grep.
- **css-ref actualizado:** sección popup de T-202606-016/017 refleja naming canónico final. Mención de aliases y coexistencia eliminada.

---

## Cambios v0.6.2 (mod:17) — T-202606-016 · selectores popup Col 3 (Archivos tocados + Doc-updates)

- **`.sps-actions` confirmado inexistente** — sin instancia en CSS ni JS. El componente real de acciones del sprint activo es `.sps-menu-wrap` (contenedor) → `.sps-btn-menu` (botón trigger, atributo `data-sps-activo-menu`) → `.sps-dropdown` (panel de opciones, visibilidad via atributo HTML `hidden` nativo — **no** clase `.is-hidden` como el resto del sistema). Ítems del dropdown: `.sps-dropdown-item` / `.sps-dropdown-item--danger` / separador `.sps-dropdown-sep`.
- El mismo patrón (`.sps-menu-wrap` + `.sps-dropdown`) se reutiliza en la sección `#sps-programados` para la acción "Descartar sprint" — confirmado en `_renderSpsProgramados()`, `locus-sprint.js` L545-548.
- Eliminado el ⚠️ "no confirmado" sobre `.sps-actions` — gap cerrado.

---

## Cambios v0.6.0 (mod:15) — DOC-UPDATE T-202606-002, verificado contra locus-sprint.css mod:36 + index.html mod:73

- **Sección "Sprint activo — familia `sps-*`" reconciliada contra código real:**
  - `.sps-header` no es el nombre real del header de card — el selector real es `.sps-card-header` (ver `locus-sprint.css` L2016/L2566). `.sps-header` sí existe como bloque propio pero es el contenedor de meta-grid (versión/release/goal/scope), no el header de ID+título.
  - `.sps-burndown-wrap` no existe — el selector real es `.sps-progress-wrap`.
  - `.sps-actions` no tiene instancia de markup activa confirmada en `index.html` — solo mencionado en comentario (T-202606-042). Comentario en `locus-sprint.css` indica superseded por `.sps-menu-wrap`/`.sps-dropdown`, generados dinámicamente por `_renderSpsActivo()` — no confirmado en CSS ni HTML estático, pendiente de verificación con `locus-sprint.js`.
  - `.sps-card--pausado` confirmado vigente (no `.sps-card--paused`, deprecada — 0 uso en JS, ver `locus-sprint.css` L1991).
  - `#sprint-panel-sprints` es selector por **ID**, no clase `.sprint-panel-sprints` — corregido en toda referencia de este doc.
  - No existen `.sps-layout` ni `.sps-sidebar` en ningún punto del codebase — `#sprint-panel-sprints` es `flex; flex-direction: column` de una sola sección, sin layout de dos columnas que anular.
  - **Estructura real confirmada (`index.html` L728-736):** `#sprint-panel-sprints` contiene 5 hijos directos sin wrapper intermedio — `#sps-activo` · `#sps-programados` · `#sps-pausados` · `#sps-hotfix` (renombrado a `#sps-qinc` en TKT-D1) · `#sps-cerrados`. La tabla previa solo documentaba 3 de los 5. `#sps-programados` y `#sps-hotfix` agregados a la tabla de naming.
- **Nueva entrada:** familia `.spt-context-header` — encabezado de contexto "Sin sprint activo" para modo vista-principal del sub-tab Sprints (T-202606-002). Ver sección dedicada abajo.
- **Nota de arquitectura:** `.sph-header` (`#sprint-panel-header`) es hermano de los 4 paneles del Tab Sprint, no hijo de `#sprint-panel-sprints`. Su visibilidad (`is-hidden`) la controla JS — no es responsabilidad CSS de este T.

---

## Cambios v0.5.0 (mod:14) — gap detectado en consulta UX de Fase 1, R sidebar Backlog (sin código asignado aún)

- Agregada fila `tpl-` a la tabla de Prefijos de módulo — familia activa en producción (`tpl-sidebar-nav`, `tpl-nav-btn`, `tpl-sidebar-label`, `tpl-sidebar-section`, `tpl-nav-badge`, usados en `index.html` dentro de `tab-backlog`) que no tenía entrada en esta tabla.
- **Archivo fuente no confirmado.** Verificado contra los CSS adjuntos en esta sesión (`locus-backlog.css`, `locus-backlog-item.css`, `locus-layout.css`): solo `.tpl-nav-badge` y sus modificadores aparecen definidos (en `locus-layout.css`, junto a `.doc-subtab-btn`/`.sspanel-btn`, posible alias o resto de naming previo — no confirmado). Las clases base `.tpl-sidebar-label`, `.tpl-sidebar-nav`, `.tpl-sidebar-section`, `.tpl-nav-btn` no aparecen en ningún archivo adjunto a esta sesión. La columna `Archivo fuente` queda con el valor `no confirmado — ver nota` hasta que se audite con el `.css` real correcto adjunto.
- No reconciliado en esta versión: confirmar si `.doc-subtab-btn` / `.sspanel-btn` (ambos en `locus-layout.css`, sin call site en el `index.html` adjunto a esta sesión) son naming previo de este mismo componente o código muerto — pendiente de sesión con Rune para grep contra los 50 módulos JS reales.

---

## Cambios v0.5.0 (mod:13) — T-202606-028

- Prefijo `sh-` (Sprint Health panel, `locus-analytics.css`) eliminado de la tabla de naming. Bloque CSS correspondiente (~620 líneas) removido por Rune — verificado contra los 50 módulos JS reales: cero call sites. Las funciones de atribución original (`renderSprintBurndown` · `_scmStep1Html` · `createSprint`) generan hoy `sph-*` y `scm-*`, no `sh-*`.
- El componente "Sprint Health" vivo hoy usa namespace `sprint-health-*` en `locus-projects.js` / `locus-backlog-panel.js` — su CSS no vive en `locus-analytics.css`. No se agrega entrada de naming para `sprint-health-*` en esta versión — pendiente de auditoría propia si se confirma que necesita doc formal (no es prefijo BEM compacto, es namespace literal sin abreviar; evaluar si conviene normalizar).
- `.sprint-inline-hint` y `.badge-scope-added` — preservadas en `locus-analytics.css`, estaban intercaladas en el rango eliminado. Sin cambio de comportamiento.

---

## Cambios v0.5.0 (mod:12) — auditoría contra 17 CSS reales, 2026-06-21

- Escala de z-index: heading corregido de "30 tokens" a "31 tokens" — la tabla ya listaba 31 filas, el heading estaba desfasado.
- Auditoría completa de los 17 archivos reales: tabla de arquitectura (líneas) detectada desactualizada en 11 de 17 filas. **No reconciliada en esta versión** — los CSS reales usados para esa parte de la auditoría no están adjuntos en esta sesión de cierre. Pendiente: re-adjuntar los 17 archivos para actualizar la columna `Líneas` con valores exactos.
- Gap de L.813 (`preview-tg-tag--warn`/`--info` sin archivo canónico confirmado) — auditoría encontró indicios de resolución parcial. **No reconciliado en esta versión** por el mismo motivo — requiere los archivos reales adjuntos para confirmar archivo canónico exacto.
- 2 defectos detectados en archivos reales durante la auditoría — no son contenido de este doc, registrados como hallazgos en el CHECKPOINT de cierre para Cael/Rune: header de identidad duplicado en `locus-sesiones.css` (mod:3 y mod:9 apilados) · `sprint:PP-S-housekeeping` inválido en `locus-backlog-item.css` (no es un ID `[Prefijo]-S-XX`).

---

## Propósito y dueño

**Dueño:** Nova — lo mantiene actualizado al cerrar cada sprint donde interviene.
**Audiencia:** Rune — lo consume como referencia de implementación. Si Rune detecta un conflicto entre este documento y un R activo, devuelve a Nova antes de resolver por su cuenta.

---

## Arquitectura de módulos CSS

17 archivos en orden de carga en `index.html`:

| # | Archivo | Líneas | Scope |
|---|---|---|---|
| 1 | `locus-base.css` | 485 | Variables globales, reset, tokens `:root` |
| 2 | `locus-layout.css` | 2390 | Shell, header, tabs, botones base, search |
| 3 | `locus-backlog.css` | 6308 | Tab Backlog — lista, filtros, sprint selector, kanban, arranque overlay, tree view |
| 4 | `locus-backlog-item.css` | 4102 | `buildBacklogItem()` — item expandido, IDP, merge diff |
| 5 | `locus-sprint.css` | 1759 | Tab Sprint — header, burndown, lista Rs, scope added, workers, sprint picker, subtab nav |
| 6 | `locus-sprint-close.css` | 1283 | Modal cierre de sprint — `sprint-close-*` · `scm-*` · `scm-retro3-*` |
| 7 | `locus-sprint-plan.css` | 1332 | Sub-tab Plan · Pulso · Contratos — `plan-*` · `pulso-*` · `acv-*` · `ctr-*` · `pls-*` |
| 8 | `locus-sprint-ui.css` | 545 | Vista Planificación drag & drop · EXECUTION-PLAN UI — `bl-plan-*` |
| 9 | `locus-archive.css` | 435 | Histórico unificado — `arch-*` |
| 10 | `locus-sesiones.css` | 7576 | Tab Tracker — grid, cards IA, sesiones, historial |
| 11 | `locus-sesiones-card.css` | 490 | Rediseño AI Card — `sc-*` · `card-dot-*` |
| 12 | `locus-radar.css` | 1649 | Radar Sidebar global — `rsb-*` |
| 13 | `locus-analytics.css` | 3748 | Tab Analytics — KPIs, charts, heatmap |
| 14 | `locus-modals.css` | 4264 | Sistema modal genérico, toasts, tags, auth, drawers |
| 15 | `locus-docs.css` | 656 | HTML-MAP viewer y Context vivo — `htmlmap-*` · `mm-*` · `context-*` |
| 16 | `locus-document-generator.css` | 872 | Map Generator overlay — `mg-*` |
| 17 | `locus-proyectos.css` | 4045 | Tab Proyectos — dashboard, contexto, notas, tmpl-trigger |

**Regla de orden:** El orden de carga es invariante. No reordenar sin aprobación de Nova. Rune verifica que `index.html` cargue los 17 archivos en este orden exacto al inicio de cada sesión que toque CSS.

**⚠️ Gap pendiente v0.5.0:** La auditoría de 2026-06-21 contra los 17 archivos CSS reales detectó la columna `Líneas` desactualizada en 11 de las 17 filas. No se reconcilia en esta versión — los archivos reales no están adjuntos en la sesión de cierre. Próxima sesión de Nova con los 17 CSS reales adjuntos: actualizar valores exactos antes de confiar en esta columna para estimación de effort.

**Cambio V2.6:** Se añaden `locus-sesiones-card.css` (pos. 11, después de `locus-sesiones.css`) y `locus-docs.css` (pos. 15, después de `locus-modals.css`). La tabla anterior de V2.5 tenía 15 archivos — ahora son 17.

**Cambio V2.15:** Tabla de líneas actualizada con valores reales post-auditoría. 9 prefijos nuevos documentados: `spm-` · `sml-` · `spt-` · `arranque-` · `arr-` · `idp-` · `bl-vl-` · `scm-retro3-`. Scope de `locus-backlog.css` y `locus-sprint-close.css` actualizado para reflejar componentes añadidos en sprints recientes.

**Cambio V2.8:** `locus-tracker.css` renombrado a `locus-sesiones.css` (pos. 10). `locus-tracker-card.css` renombrado a `locus-sesiones-card.css` (pos. 11). Columna Líneas añadida a la tabla de arquitectura — valores extraídos de archivos reales.

---

## Naming de clases

### Convención general: BEM con modificador `--`

```
[componente]-[elemento]--[modificador]
```

La regla `selector-class-pattern` está desactivada en `.stylelintrc.json` para permitir `--` y clases de un carácter.

### Prefijos de módulo

| Prefijo | Módulo | Archivo fuente |
|---|---|---|
| `bl-` | Backlog | `locus-backlog.css` |
| `bl-plan-` | Vista Planificación drag & drop | `locus-sprint-ui.css` |
| `stat-` | Analytics — estadísticas | `locus-analytics.css` |
| `tracker-` | Tracker | `locus-sesiones.css` |
| `sc-` | AI Card rediseño — header, stats, stepper, footer | `locus-sesiones-card.css` |
| `card-dot-` | Dropdown menú de card IA | `locus-sesiones-card.css` |
| `popup-` | Popup de detalle de sesión | `locus-sesiones.css` |
| `filter-` | Filtros de backlog | `locus-backlog.css` |
| `sprint-` | Sprint selector y header | `locus-backlog.css` / `locus-sprint.css` |
| `sph-` | Sprint panel header (sticky) | `locus-sprint.css` |
| `spi-` | Sprint items list | `locus-sprint.css` |
| `sca-` | Sprint scope added | `locus-sprint.css` |
| `spw-` | Sprint workers vinculados | `locus-sprint.css` |
| `scm-` | Sprint close modal | `locus-sprint-close.css` |
| `plan-` | Execution Plan — sesiones y sprints | `locus-sprint-plan.css` |
| `pls-` | Pulso sections (panel interno) | `locus-sprint-plan.css` |
| `pulso-` | Pulso dot y panel flotante | `locus-sprint-plan.css` |
| `acv-` | AC viewer en sub-tab Plan | `locus-sprint-plan.css` |
| `ctr-` | Contratos de módulo — panel y detalle | `locus-sprint-plan.css` |
| `arch-` | Archivo Histórico de sprints | `locus-archive.css` |
| `rsb-` | Radar Sidebar | `locus-radar.css` |
| `tpl-` | Templates sidebar — nav de subtabs de tab-backlog (`tpl-sidebar-nav`, `tpl-nav-btn`, `tpl-sidebar-label`, `tpl-sidebar-section`) y su badge (`tpl-nav-badge`, confirmado en `locus-layout.css`) | `tpl-nav-badge`: `locus-layout.css` confirmado · resto de la familia: no confirmado — ver `Cambios v0.5.0 (mod:14)` |
| `rm-` | Roadmap chips | `locus-analytics.css` |
| `mg-` | Map/Document Generator | `locus-document-generator.css` |
| `mdiff-` | Merge diff panel | `locus-backlog-item.css` |
| `akpi-` | Analytics KPI | `locus-analytics.css` |
| `gf-` | Global footer | `locus-layout.css` |
| `pend-` | Panel de pendientes | `locus-modals.css` |
| `bitem-` | Backlog item — elementos internos expandidos | `locus-backlog-item.css` |
| `staleness-pill` | Pill de antigüedad de status — inline en subline del ítem | `locus-backlog-item.css` |
| `viz-` | Checkpoint viz | `locus-modals.css` |
| `ckpt-` | Checkpoint viz — secciones del panel | `locus-modals.css` |
| `sprint-inline-` | Sprint inline — formulario en merge diff | `locus-backlog-item.css` |
| `promote-` | Promote modal | `locus-modals.css` |
| `item-` | Backlog item pills y badges | `locus-backlog.css` |
| `qc-` | Quick Capture modal | `locus-modals.css` |
| `hsr-` | Header sprint row | `locus-backlog.css` |
| `tci-` | Tracker col input | `locus-sesiones.css` |
| `tvh-` | Tracker view header | `locus-sesiones.css` |
| `htmlmap-` | HTML-MAP viewer — tabla y filtros | `locus-docs.css` |
| `mm-` | Module Map árbol modular — módulos y funciones | `locus-docs.css` |
| `hmfilter-` | Filtros pill del HTML-MAP viewer | `locus-docs.css` |
| `context-` | Context vivo — placeholder, raw block, conflicto | `locus-docs.css` |
| `spm-` | Sprint picker modal — selector de sprints y meta edición | `locus-sprint.css` |
| `sml-` | Sprint meta list — lista de sprints en picker | `locus-sprint.css` |
| `ssm-` | Sprint summary — resumen agregado de sprints normales + edición inline de goal/scope/version_target | `locus-sprint.css` |
| `spt-` | Sprint tab nav (`spt-nav`/`spt-tab`) + encabezado de contexto vista-principal (`spt-context-header`, T-202606-002) | `locus-sprint.css` |
| `sps-` | Sub-tab Sprints — 5 secciones reales: `#sps-activo` · `#sps-programados` · `#sps-pausados` · `#sps-qinc` · `#sps-cerrados` (`index.html` — renombrado de `#sps-hotfix` en TKT-D1) | `locus-sprint.css` |
| `sps-` | Sprint activo — card en sub-tab Sprints | `locus-sprint.css` |
| `arranque-` | Arranque overlay — morning brief, sesión de arranque | `locus-backlog.css` |
| `arr-` | Arranque rows — plan, ítems, files, badges dentro del overlay | `locus-backlog.css` |
| `idp-` | Item Detail Panel — panel lateral de detalle de ítem | `locus-backlog-item.css` |
| `bl-vl-` | Backlog vista lineal — árbol de REQs y TKTs en vista tree | `locus-backlog.css` |
| `scm-retro3-` | Sprint close retro paso 3 — métricas, deltas, notas | `locus-sprint-close.css` |
| `hdr-menu-` | Subpanel inline (textarea + botón + error) dentro de #more-menu — no es dropdown propio | `locus-layout.css` |
| `qinc-` | Panel Q-INC — cards ITIL, badges SLA, secciones, stats bar · `qinc-item--sla-vencido` · `qinc-item--sla-riesgo` · `qinc-type-badge` | `locus-backlog.css` |
| `ie-` | Item Editor overlay — filas, campos, labels, footer, sub-grupo de intención (`ie-intencion-group`, `ie-intencion-field`). Compuestos `#item-editor-overlay .ie-*` en `locus-sesiones.css`; clases sueltas (`ie-label`, `ie-label-opt`, `ie-field-mt`, `ie-body`, `ie-footer`, `ie-textarea`, `ie-input-mono`, `ie-btn-tpl-save`) en `locus-modals.css` | `locus-sesiones.css` + `locus-modals.css` |

### Clases de un carácter — `.P` `.T` `.R` `.B` `.I`

Representan tipos de ítem del backlog. **Siempre como modificadores compuestos**, nunca solos:

```css
/* ✓ Correcto */
.item-type-pill.P { background: ...; }

/* ✗ Incorrecto */
.P { color: red; }
```

### Variables privadas `--_name`

Variables con prefijo `--_` son de scope local intencional. La regla `custom-property-pattern` está desactivada.

### Keyframes

Codebase existente usa camelCase. Nuevos pueden usar kebab-case — ambas convenciones coexisten.

---

## Reglas lint desactivadas

| Regla | Razón |
|---|---|
| `selector-class-pattern` | BEM con `--` y clases `.P .T .R .B` |
| `keyframes-name-pattern` | Nombres camelCase existentes intencionales |
| `custom-property-pattern` | Variables `--_private` válidas |
| `no-descending-specificity` | Módulos CSS de scope sobreescriben selectores base intencionalmente — `locus-overrides.css` eliminado en PP-S-01 (R-202605-018) |
| `alpha-value-notation` | Notación moderna y legacy coexisten |
| `color-function-notation` | Ídem anterior |
| `import-notation` | Sin `@import` en el proyecto |
| `declaration-property-value-keyword-no-deprecated` | `word-break: break-word` en múltiples archivos |

### Reglas activas relevantes

| Regla | Estado |
|---|---|
| `color-no-invalid-hex` | Activa |
| `block-no-empty` | Activa |
| `declaration-block-no-shorthand-property-overrides` | Activa |
| `declaration-block-no-duplicate-properties` | Activa (con excepción) |
| `custom-property-no-missing-var-function` | Activa |

---

## Tokens

### Escala tipográfica (15 pasos)

| Token | Valor | Uso |
|---|---|---|
| `--text-3xs` | 8px | Badge ultra-compacto |
| `--text-2xs` | 9px | Labels de metadatos compactos |
| `--text-2xs-plus` | 10px | Componentes compactos en modales |
| `--text-xs` | 11px | Labels secundarios |
| `--text-sm` | 12px | Texto UI estándar compacto |
| `--text-base` | 13px | Tamaño base (`html { font-size }`) |
| `--text-md` | 14px | Texto UI estándar |
| `--text-lg` | 16px | Títulos compactos |
| `--text-xl` | 18px | Subtítulos |
| `--text-2xl` | 22px | Títulos principales |
| `--text-display-sm` | 17px | Heading de sección |
| `--text-display-md` | 26px | Stat numbers |
| `--text-display-lg` | 28px | Stat values prominentes |
| `--text-display-xl` | 32px | Stat / ícono grande |
| `--text-display-2xl` | 40px | Empty state icons |

**Excepciones documentadas:** `font-size: 0` (cuando `::before` reemplaza texto), `font-size: 1-2px` (micro-layout).

### Escala de border-radius (11 tokens)

| Token | Valor | Uso |
|---|---|---|
| `--radius-3xs` | 1px | Suavizado mínimo — separadores, líneas |
| `--radius-2xs` | 2px | Detalle fino — barras de progreso, focus outlines, dots |
| `--radius-sm` | 4px | Elementos compactos |
| `--radius-xs` | 6px | Tooltips, variante intermedia |
| `--radius-md` | 8px | Componentes estándar |
| `--radius-md-plus` | 10px | Cards secundarias |
| `--radius-lg` | 12px | Cards y paneles |
| `--radius-lg-plus` | 14px | Popups, modales compactos |
| `--radius-xl` | 16px | Componentes prominentes |
| `--radius-2xl` | 20px | Modales y superficies grandes |
| `--radius-pill` | 999px | Badges y chips |

Aliases: `--radius` (→ `--radius-md`), `--border-radius-sm/md/lg/xl`.

**Excepciones documentadas:** `border-radius: 0` (reset), `border-radius: 50%` (solo cuando difiere visualmente de `999px`).

**Nota:** `--radius-3xs` y `--radius-2xs` fueron añadidos en CSS-02. Reemplazan los hardcodes `1px` y `2px`. Usar los tokens — no los valores literales.

### Escala de z-index (31 tokens)

| Token | Valor | Semántica |
|---|---|---|
| `--z-deep` | 1 | Fondos decorativos |
| `--z-raised` | 2 | Elevación leve inline |
| `--z-base` | 10 | Base de stacking |
| `--z-float-sm` | 30 | Flotantes baja prioridad |
| `--z-float-md` | 40 | Flotantes media prioridad |
| `--z-float` | 50 | Flotantes estándar |
| `--z-sticky` | 100 | Headers pegados |
| `--z-popover` | 120 | Popovers · dropdowns compactos |
| `--z-sidebar` | 200 | Sidebars |
| `--z-sidebar-plus` | 210 | Elementos sobre sidebar |
| `--z-layer` | 250 | Capa intermedia |
| `--z-layer-2` | 300 | Segunda capa |
| `--z-dropdown` | 400 | Dropdowns principales |
| `--z-modal` | 500 | Modales base |
| `--z-modal-plus` | 600 | Sobre modal base |
| `--z-overlay-sub` | 800 | Sub-overlay |
| `--z-overlay` | 900 | Overlays pantalla completa |
| `--z-toast` | 1000 | Toast system |
| `--z-toast-plus` | 1001 | Sobre toast |
| `--z-panel` | 1100 | Paneles sobre modal |
| `--z-panel-2` | 1200 | Paneles secundarios |
| `--z-panel-3` | 1300 | Tercer nivel de panel |
| `--z-panel-top` | 3100 | Panel máxima prioridad |
| `--z-supreme-sub` | 8000 | Sub-nivel supreme |
| `--z-supreme-mid` | 8500 | Nivel medio supreme |
| `--z-supreme` | 9000 | Sobre overlay general |
| `--z-supreme-2` | 9200 | Segundo nivel supreme |
| `--z-critical` | 9500 | Entre supreme-2 y top |
| `--z-critical-2` | 9900 | Segundo nivel crítico |
| `--z-top` | 9999 | Techo general |
| `--z-absolute` | 10000 | Máximo absoluto |

### Tokens de color adicionales — T-202605-033

#### Texto sobre fondos de color

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--text-on-accent` | `#000` | `#000` | Texto sobre `var(--accent)` lime-green — contraste ~8:1 |
| `--text-on-danger` | `#fff` | `#fff` | Texto sobre `var(--red)` y fondos destructivos |

**Regla:** Nunca usar `#000` o `#fff` directamente sobre fondos de color. Usar estos tokens para que el valor sea correcto en ambos temas si alguno cambia.

#### Colores de tag extendidos

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--pink` | `#f472b6` | `#d6509e` | Texto de tag `.tc-5` |
| `--lime` | `#a3e635` | `#6a9e1a` | Texto de tag `.tc-6` |
| `--orange` | `#fb923c` | `#d4691a` | Texto de tag `.tc-7` |

**Excepción documentada — `tag-color-fixed`:** Los `border-color` de `.tc-0` a `.tc-7` en `locus-modals.css` son paleta fija de instancia de componente. No varían por tema. No se tokenizan. Identificados con comentario `/* tag-color-fixed */` inline. No replicar fuera del componente de tags sin aprobación de Nova.

---

### Tokens de color utilitarios — verificados en locus-base.css

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--green` | `#39e87c` | `#1aab5a` | Éxito, confirmación, dot Pulso verde, badges de contrato activo. Contraste como elemento gráfico no-texto (borde/acento 2px) sobre `--surface1`/`--surface2`: light ⚠️ 2.99:1/2.82:1 — falla el mínimo 3:1 (WCAG "graphical objects and UI components"). Como color de texto no fue verificado en este análisis — puede seguir siendo válido para ese uso. Override acotado en uso de acento de card: `locus-backlog-item.css` usa `#16914c` en `[data-theme="light"] .mdiff-card.mdiff-type--tkt` — no se tocó el token `--green` global. |
| `--green-dim` | `#071a10` | `#e6f9ef` | Fondo sutil de contextos de éxito |
| `--red-dim` | `#1a0810` | *(verificar light)* | Fondo sutil destructivo — alias `--bg-danger-subtle` |
| `--blue` | `#4fc3f7` | `#0288d1` | Color informativo — `--blue-dim` y `--blue-border` disponibles |
| `--purple` | `#c084fc` | `#7c3aed` | Discovery — tipo DISC en backlog, archive y sprint. Contraste: dark ~8:1 ✅ · light ~5.9:1 ✅ |
| `--hint` | `#3a3d5c` | `#a0a4c8` | Bordes sutiles de elementos secundarios |
| `--accent-dim` | `rgb(166 226 46 / 8%)` | `rgb(109 184 33 / 7%)` | Fondo sutil de acción primaria |
| `--accent-border` | `rgb(166 226 46 / 25%)` | *(light derivado)* | Borde sutil de acción primaria |

**Regla `--green-dark`:** Eliminada — TKT3 REQ-tmp-qa-cleanup S'02. Su único consumidor (`.stat-mini-fill`) fue eliminado por código muerto (sin call sites en JS/HTML). Si un futuro componente necesita un fill de barra de progreso en light mode con contraste 4.5:1+, declarar un token nuevo — no reintroducir `--green-dark` sin verificar necesidad real.

#### Aliases de texto (legado — no usar en código nuevo)

| Alias | Canónico | Usos activos |
|---|---|---|
| `--text-muted` | `--text2` | 69 usos en codebase |
| `--text1` | `--text` | 21 usos |
| `--text3` | `--hint` | 38 usos |
| `--text-secondary` | `--text2` | múltiples |

**Regla:** En código nuevo usar siempre el canónico (`--text`, `--text2`, `--hint`). Los aliases son legado y no se introducen en Rs nuevos.

#### Aliases de fondo (legado — no usar en código nuevo)

| Alias | Canónico |
|---|---|
| `--bg-hover` | Fondo de hover sutil — `rgb(255 255 255 / 5%)` en dark |
| `--bg-subtle` | Fondo sutil — `rgb(255 255 255 / 4%)` en dark |
| `--hover` / `--hover-bg` | → `--bg-hover` |

**Regla:** En código nuevo usar `var(--surface2)` para hover states o `var(--surface3)` para estados activos. `--bg-hover` y `--bg-subtle` no se introducen en Rs nuevos.

**Nota sobre `--warn`:** El token `--warn` **no existe** en `locus-base.css`. El codebase lo usa con fallback `#e8a832`. El token correcto es `--amber`. Migración pendiente en backlog. No usar `--warn` en código nuevo.

---

### Transiciones

#### Curvas de easing

| Token | Curva |
|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--ease-decel` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--ease-spring` | `cubic-bezier(0.34, 1.4, 0.64, 1)` |

#### Velocidades

| Token | Valor |
|---|---|
| `--trans-fast` | `all 0.12s var(--ease-out)` |
| `--trans-medium` | `all 0.20s var(--ease-out)` |
| `--trans-slow` | `all 0.32s var(--ease-out)` |
| `--trans-color` | `color/bg/border/opacity 0.15s var(--ease-out)` |
| `--transition-base` | `150ms ease` |

---

## Clases de visibilidad

| Clase | Definición | Uso |
|---|---|---|
| `.is-hidden` | `display: none !important` — **canónica** | Todos los componentes nuevos |
| `.hidden` | `display: none !important` — alias legacy | `.tab-notif-badge`, `.header-worker-chip` y otros |
| `.gf-hidden` | `display: none` | Footer elements (`#gf-*`) |
| `.breadcrumb-seg--hidden` | `display: none !important` | Segmentos del breadcrumb |
| `.force-hidden` | `display: none !important` | Override de máxima especificidad |

**Regla:** usar `.is-hidden` en componentes nuevos. No crear nuevas clases de visibilidad sin aprobación de Nova.

**Excepción documentada — `tmpl-trigger-wrap`:** `.tmpl-trigger-body.is-hidden` no produce `display: none` en este componente. El patrón usa `max-height` y `opacity` para colapso animado. Ver § Patrones de componentes flotantes → `tmpl-trigger-wrap`.

**Excepción documentada — `header-actions position lock`:** `.header-pend-btn.is-hidden` y `.header-active-worker.is-hidden` sobreescriben el `display: none !important` de `.is-hidden` con `display: block !important; visibility: hidden` — reservan el espacio del elemento en el layout para evitar desplazamiento horizontal de `theme-toggle-btn`. Patrón idéntico a `.tmpl-trigger-body.is-hidden`. T-202606-091.

---

## Patrones de layout

### Gutter unificado de subtabs — token `--subtab-gutter`

Token: `--subtab-gutter: 12px` (declarado en `:root`, `locus-base.css`).

Consumido como `padding-left` en los contenedores de subtab que carecían de gutter propio:

| Selector | Archivo | Nota |
|---|---|---|
| `.tpl-detail` (scope `#tab-backlog`) | `locus-proyectos.css` | Contenedor interno de Sprint/Backlog — sin gutter propio antes del fix |
| `#tab-proyectos` | `locus-backlog.css` | Sin padding declarado antes del fix |
| `#tab-sesiones` | `locus-sesiones.css` | `padding: 0` explícito — el token se aplica después en la misma regla para no perder el reset del resto de lados |

**No aplicar a:** `#tab-analytics` ni al contenedor externo de `#tab-backlog` — ambos declaran `padding: 2rem` (32px) propio, superior al gutter objetivo. Aplicar el token ahí apila el valor en vez de unificarlo.

**Criterio:** el objetivo es paridad de resultado visual final (12px de gutter mínimo), no aplicación uniforme del token en todos los selectores por igual. Un contenedor con padding propio ≥ al gutter objetivo no lo necesita.

### Barras sticky de contenedor (toolbar/stats)

Toda barra de contenedor (`.bl-toolbar`, `.active-filter-chips` y equivalentes futuros en otros subtabs) que combine `display: flex` + `position: sticky` debe declarar `width` explícito — nunca depender de `margin: auto` con `width: auto`.

**Patrón:**
```css
max-width: [N]px;
width: calc(100% - [gutter]px);
margin-left: [gutter]px;
```

**Anti-pattern registrado:** `margin-inline: auto` o `margin-right: auto` en un contenedor `flex` + `sticky` colapsa a shrink-to-fit en al menos un navegador de referencia — el bug es invisible si el contenido de la barra es ancho por sí mismo y solo se manifiesta con contenido angosto. Ver `INC-202607-001`.

### Header de ítem — orden de controles

`.bitem-header` (`.item-header` en el DOM) declara sus controles en este orden fijo — el primer elemento siempre es el disclosure triangle:

```
.bitem-collapse-arrow → .item-drag-handle (condicional, solo si item.sprint) → .bitem-activity-dot (condicional) → copy-item-btn → typeBlock → .bitem-title-col → .bitem-header-right
```

**Criterio:** el chevron anticipa el contenido — se lee antes, no después — y va primero por convención de disclosure triangle. `.item-drag-handle` nunca aparece en DISC (sin sprint asignado), por lo que ambos controles no compiten por espacio en ese tipo; en REQ/TKT/INC conviven sin conflicto porque cada uno tiene su propio target de click con `stopPropagation()` en el handler JS — la posición DOM no afecta esa separación.

**Tokens:** `.bitem-collapse-arrow` usa `var(--text-lg)` + `width: 20px` (target de click ampliado, Fitts's Law). `.item-drag-handle` usa `var(--text-base)` + `padding: 0 4px 0 0` (`locus-backlog.css`) — visible solo en `:hover` del ítem, a diferencia del chevron que es siempre visible por ser el control primario de expansión.

**Anti-pattern registrado:** no declarar selectores CSS con combinador general-hermano (`~`) que dependan del orden relativo de estos controles en el DOM (ej. `.bitem-type-X ~ .bitem-title-col ~ .bitem-collapse-arrow ~ .bitem-header-right ...`) — un reorder futuro de estos elementos los deja huérfanos en silencio, sin fallar el lint ni romper visualmente si existe un selector de respaldo por atributo (`[data-type="X"]`). Preferir siempre el selector por atributo sobre el ancestro (`.item.bitem[data-type="X"] .selector-hijo`) para reglas que dependen del tipo de ítem.

---

## Patrones de componentes flotantes

### Header global — familia `.header-zone-*`

Canónico en `locus-layout.css` (introducida mod:8, ver `Cambios mod:25`). `.header-inner` ya no es un flex row plano de 5 elementos — agrupa 3 zonas por proximidad.

| Selector | Rol |
|---|---|
| `.header-zone` | Wrapper genérico — `display:flex`, `gap:8px`. Aplicado con modificador, nunca solo |
| `.header-zone--brand` | Zona 1 — envuelve `.logo` |
| `.header-zone--nav` | Zona 2 — envuelve `.tabs`. Dueña de `margin-inline:auto` (centrado) — `.tabs` ya no lo declara |
| `.header-zone--utils` | Zona 3 — envuelve `.header-search` + `.header-actions` |
| `.header-zone + .header-zone` | Separador — `border-left: 1px solid var(--border)`, `padding-left: 12px` |

**Anti-pattern:** no reintroducir `margin-inline:auto` en `.tabs` — el centrado se rompe si se declara en ambos niveles (zona + hijo) por acumulación de espacio libre.

### Confirmación de status — familia `.status-confirm-*`

Modal de confirmación para retroceso/descarte de status de ítem (`T-202604-055`). Arquitectura en dos archivos — no es duplicación:

| Archivo | Rol |
|---|---|
| `locus-backlog.css` | Base visual — `.status-confirm-overlay` (posición/fondo), `.status-confirm-box`, `.status-confirm-title`, `.status-confirm-body`, `.status-confirm-actions`, `.status-confirm-cancel`, `.status-confirm-ok.danger` |
| `locus-modals.css` | Comportamiento compartido con otras familias de modal — apertura/cierre (`.open`, `.closing`, animación `overlay-out`/`modal-out`), agrupación en selectores múltiples de `.modal-actions` y variantes |

| Selector | Rol |
|---|---|
| `.status-confirm-title` | Título — `--text-base` / 600 / `--text`, margin-bottom 10px. Mismo patrón que `.tag-modal-title` (box de 340px) |
| `.status-confirm-body` | Cuerpo — `--text-sm` / `--text2` |
| `.status-confirm-actions` | Footer de botones — flex, gap 8px, justify-end |

### Subpanel inline en #more-menu — familia `hdr-menu-*`

Canónico en `locus-layout.css`. NO es un dropdown independiente — `#more-menu-btn` ya controla `#more-menu` (R-202605-012). El subpanel se inserta como bloque inline dentro de `#more-menu`, debajo del botón que lo activa.

| Selector | Rol |
|---|---|
| `.hdr-menu-subpanel` | Contenedor inline — oculto por defecto, `.open` revela |
| `.hdr-menu-textarea` | Textarea de entrada — `min-height: 80px`, `resize: none` |
| `.hdr-menu-textarea--error` | Error state — `border-color: var(--red)` |
| `.hdr-menu-error-msg` | Mensaje de error inline — `var(--red)`, `aria-live='polite'` en HTML |
| `.hdr-menu-apply-btn` | Botón de acción — D-04 via `:disabled` |

Botones nuevos dentro de `#more-menu` (ej. `#mm-btn-sync-infra`) heredan estilo de `.more-menu button` (línea ~802) — sin clase adicional.

### Sprint groups y badges — familia `.sprint-group-*` / `.sprint-badge-*`

Modificadores aplicados a `.bl-vl-sprint-group` según el estado del sprint. A partir de V2.20, el header usa layout de 3 filas en lugar de una sola fila flat. Ver estructura de clases internas más abajo.

| Estado | Clase grupo | Clase badge | Color | Fondo header |
|---|---|---|---|---|
| Activo | `.sprint-group-active` | `.sprint-badge-active` | `--amber` | `rgb(245 158 11 / 8%)` |
| ~~Hotfix~~ | ~~`.sprint-group-hotfix`~~ | ~~`.sprint-badge-hotfix`~~ | ~~rojo `rgb(163 45 45)`~~ | ~~`rgb(226 75 74 / 6%)`~~ — **eliminadas en TKT-D3** · `S-HOTFIX` no existe en Gen 2 |
| Cerrado | `.sprint-group-closed` | `.sprint-badge-closed` | `--hint` | ninguno · `opacity: 0.8` |
| Planificado (T-202606-040) | `.sprint-group-planned` | `.sprint-badge-planned` | `--blue` | ninguno |
| Programado (ssm) | — | `.sprint-badge-programado` | `--blue` | — |
| Pausado (ssm) | — | `.sprint-badge-paused` | `--hint` | — |

**Detección de hotfix:** ~~`isHotfix` se evalúa como `sprintId.toUpperCase().includes('HOTFIX')` — no depende de `sprintObj.status`. Tiene precedencia sobre `isActive` e `isPlanned` en la construcción de la clase del grupo.~~ **Eliminado en Gen 2 (TKT-D1/D3)** — `S-HOTFIX` no existe, `isHotfix` eliminado de todos los módulos.

#### Estructura interna de `.bl-vl-sprint-header` — 3 filas (V2.20)

El header pasó de una sola fila `display: flex` a un bloque con 3 filas semánticas. `border-left: 3px` codifica el estado periféricamente.

| Clase | Rol | Contenido |
|---|---|---|
| `.bl-vl-sprint-header-row1` | Fila 1 — identidad | arrow + `.version-tag` (ID monospace) + `.sprint-name-label` (nombre) + badge de estado |
| `.bl-vl-sprint-header-meta` | Fila 2 — contexto secundario | Velocity (`hsr-velocity`) para activo · fecha de cierre para cerrado · effort estimado para planificado |
| `.bl-vl-sprint-header-progress` | Fila 3 — progress bar full-width | `.bl-vl-progress-track` + `.bl-vl-progress-fill` + `.bl-vl-progress-label` |

#### Progress bar — clases nuevas V2.20

Las clases `version-progress-inline`, `version-progress-bar-wrap`, `version-progress-bar` y `version-progress-label` siguen existiendo en otros bloques de render (árbol/kanban). **No eliminar.** Las clases nuevas son exclusivas de `_renderVistaLista`:

| Clase | Rol |
|---|---|
| `.bl-vl-progress-track` | Track de la barra — `height: 3px`, `background: var(--border)`, `border-radius: 99px` |
| `.bl-vl-progress-fill` | Fill — `width: var(--ver-bar-w, 0%)`, color heredado del estado del grupo |
| `.bl-vl-progress-label` | Etiqueta `done/total · pct%` — `var(--mono)`, `var(--text-xs)` |

**Variable CSS:** `--ver-bar-w` — porcentaje de progreso inyectado via `style` inline en el elemento `.bl-vl-progress-fill`. Valor: `0%`–`100%`. Excepción CSS Purity permitida.

**Color de `.bl-vl-progress-fill` por estado:**

| Estado grupo | Color fill |
|---|---|
| `.sprint-group-active` | `var(--amber)` |
| ~~`.sprint-group-hotfix`~~ | ~~`rgb(163 45 45)`~~ — **eliminado en TKT-D3** |
| `.sprint-group-planned` | `var(--blue)` |
| `.sprint-group-closed` | `var(--border-secondary)` |

#### Dark mode

Solo activo tiene override de dark mode en `locus-backlog.css` bajo `[data-theme="dark"]`. El fondo se intensifica ligeramente y el texto usa stops más claros del mismo ramp. Cerrado y planificado no requieren override.

Definiciones en `locus-backlog.css` (~L5592+). `.sprint-group-active/closed` existían previamente — rediseñados en V2.20. ~~`sprint-group-hotfix` y `sprint-badge-hotfix` son nuevos en V2.20~~ — **eliminadas en TKT-D3**.

**Cambio V2.20:** Rediseño completo del header de sprint en Vista Lista (`_renderVistaLista`). Layout de 3 filas, fondo ámbar 50 para activo, border-left de 3px por estado. Los otros bloques de render (árbol/kanban, L1053 y L1100 de `locus-backlog-render.js`) mantienen las clases `version-progress-*` — fuera del scope de V2.20.

### Sprints planificados — familia `spl-*` (T-202606-040)

Sección "Sprints planificados" en Tab Sprints (`#sprint-planned-list`), generada por `_renderPlannedSprints()` en `locus-sprint.js`.

| Selector | Rol |
|---|---|
| `.spl-section` | Wrapper de la sección — column, gap 6px |
| `.spl-header` | Fila título + contador |
| `.spl-title` | "Sprints planificados" — `--text2` |
| `.spl-count` | Pill de conteo total — `--blue` |
| `.spl-list` | Contenedor de filas — column, gap 6px |
| `.spl-row` | Fila por sprint — fondo/borde `--blue` sutil |
| `.spl-row-id` | ID del sprint — mono, `--blue` |
| `.spl-row-name` | Nombre descriptivo — ellipsis |
| `.spl-row-counts` | Wrapper de pills REQ/TKT/INC |
| `.spl-type` + `.spl-type--r/t/b` | Pills de conteo por tipo — colores replican `.item-type-pill.[R/T/B]` (`--blue`/`--green`/`--red`). **⚠️ Migración pendiente (Rune):** selectores CSS a renombrar a `--req/--tkt/--inc` junto con call sites JS — ver nota de migración §Selectores Gen 1. |
| `.spl-row-effort` | Effort total — `--text2` |

Definiciones en `locus-sprint.css` (~L1038-1140), junto a `.sml-*`.

### Sprint activo — familia `sps-*` (T-202606-036)

Card del sprint activo en sub-tab Sprints (`#sps-activo`), generada por `_renderSpsActivo()` en `locus-sprint.js`.

**Estructura real del sub-tab Sprints (`index.html` L728-736) — 5 secciones, sin wrapper intermedio:**

| ID | Contenido |
|---|---|
| `#sps-activo` | Card del sprint activo |
| `#sps-programados` | Sprints en estado `programado` |
| `#sps-pausados` | Sprints en estado `pausado` |
| `#sps-qinc` | Cola Q-INC — renombrado desde `#sps-hotfix` en TKT-D1 |
| `#sps-cerrados` | Lista colapsable de sprints cerrados — filas `.sps-cerrados-row` |

| Selector | Rol |
|---|---|
| `.sps-card` | Contenedor card — `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)` |
| `.sps-card--pausado` | Estado pausado — `background: var(--surface2)`, `border-color: var(--hint)` |
| ~~`.sps-card--hotfix`~~ | ~~Estado hotfix — `border-color: var(--c-critical-border)`~~ — **eliminado en TKT-D3** · `S-HOTFIX` no existe en Gen 2 |
| `.sps-card-header` | Fila superior dentro de la card — ID + label editable + badge de estado (selector real; `.sps-header` es un bloque distinto, ver fila siguiente) |
| `.sps-header` | Bloque de meta-grid — versión/release/goal/scope en 2 columnas (no confundir con `.sps-card-header`) |
| `.sps-title` | Label del sprint — clickeable para edición inline |
| `.sps-inline-input` | Input inline compartido por label / goal / scope |
| `.sps-inline-input--goal` | Modificador goal — `font-weight: 400` |
| `.sps-inline-input--scope` | Modificador scope — `font-weight: 400` |
| `.sps-meta` | Bloque de metadatos — grid `1fr 1fr` |
| `.sps-meta-item` | Fila de metadato — label + valor editable |
| `.sps-meta-item--full` | Modificador — ocupa las 2 columnas del grid |
| `.sps-meta-label` | Etiqueta uppercase — `var(--hint)`, `var(--text-xs)` |
| `.sps-meta-value` | Valor clickeable para edición inline |
| `.sps-progress-wrap` | Contenedor de la barra de progreso (selector real; `.sps-burndown-wrap` no existe en el codebase) |
| `.sps-burndown-bar` | Track de la barra — `background: var(--surface3)` |
| `.sps-burndown-fill` | Fill animado — `width: var(--sps-burndown-pct, 0%)`, `background: var(--accent)` |
| `.sps-card--pausado .sps-burndown-fill` | Fill en estado pausado — `background: var(--hint)` |
| `.sps-burndown-label` | Porcentaje textual — `var(--hint)`, right-aligned |
| `.sps-btn` | Botón base neutral |
| `.sps-btn--close` | Modificador destructivo — `color: var(--red)` |
| `.sps-btn-menu` | Botón trigger del menú de acciones — `aria-haspopup="true"`, atributo `data-sps-activo-menu` |
| `.sps-empty` | Empty state cuando no hay sprint activo |
| `.sps-empty-cta` | CTA del empty state — invoca `openNewSprintInline()` |

**Menú de acciones del sprint activo — familia `.sps-menu-wrap` (T-202606-036/T-202606-037):**

`.sps-actions` no existe en ningún archivo real — confirmado contra `locus-sprint.css` (mod:36) y `locus-sprint.js` (mod:57). El componente real es este:

| Selector | Rol |
|---|---|
| `.sps-menu-wrap` | Contenedor del menú — wrapper de botón + dropdown |
| `.sps-btn-menu` | Botón trigger — `aria-haspopup="true"`, `aria-expanded` dinámico, atributo `data-sps-activo-menu` |
| `.sps-dropdown` | Panel de opciones — `role="menu"`. **Visibilidad via atributo HTML `hidden` nativo, no clase `.is-hidden`** — excepción a la convención general del sistema |
| `.sps-dropdown-item` | Ítem de menú — `role="menuitem"` |
| `.sps-dropdown-item--danger` | Modificador para acción destructiva (ej. "Cerrar sprint", "Descartar sprint") |
| `.sps-dropdown-sep` | Separador — `role="separator"` |

Reutilizado tal cual en `#sps-programados` (`_renderSpsProgramados()`) para la acción "Descartar sprint".

**Variable CSS:** `--sps-burndown-pct` — porcentaje de burndown inyectado desde JS via `style.setProperty('--sps-burndown-pct', pct + '%')`. Valor: `0%`–`100%`.

**Nota tokens:** `--c-medium-*` referenciado en AC del T no existe en `locus-base.css`. Estado pausado mapeado a `--surface2` / `--hint` — mismo tratamiento que `.sprint-badge-paused`.

**Nota de arquitectura — `#sprint-panel-sprints`:** Selector por **ID** (no clase `.sprint-panel-sprints`). `display: flex; flex-direction: column` — una sola sección vertical, sin grid de dos columnas. No existen `.sps-layout` ni `.sps-sidebar` en el codebase — cualquier T que asuma anular un layout de dos columnas en este panel parte de una premisa incorrecta.

**Nota de arquitectura — `.sph-header` (`#sprint-panel-header`):** Hermano de los 4 paneles del Tab Sprint (`#sprint-panel-items` / `-planificar` / `-plan` / `-sprints`), no hijo de ninguno. Visibilidad (`is-hidden`) controlada por JS según haya o no sprint activo — fuera de scope CSS.

### Popovers de toolbar/stats — familia `.blf-*` / `.blt-*` (TKT1/TKT2, [tmp:req-clutter-backlog])

Canónico en `locus-backlog.css` (mod:75). Consolidan controles secundarios de la toolbar del Backlog (Deps/Hijos/Sin AC/Orden/Colapsar) y los chips de tipo de la stats bar detrás de un trigger con badge — reduce clutter visual sin eliminar ningún filtro existente.

**Principio de diseño:** adaptación directa del patrón ya validado `.sps-menu-wrap` / `.sps-btn-menu` / `.sps-dropdown` (ver sección anterior) — mismo mecanismo de visibilidad (`hidden` nativo, no `.is-hidden`), mismo `role="menu"`. No se introdujo un componente de popover nuevo.

**Popover Filtros — familia `.blf-*` (TKT1, trigger `#fbar-filter-btn`):**

| Selector | Rol |
|---|---|
| `.blf-wrap` | Contenedor del trigger + popover |
| `.blf-trigger` | Botón trigger — visualmente basado en `.bl-strip-btn` para consistencia con la fila de toolbar. `aria-haspopup="true"`, `aria-expanded` dinámico |
| `.blf-badge` | Badge de conteo sobre el trigger — cantidad de filtros secundarios activos (Deps/Hijos/Sin AC activos o sort ≠ default). `classList.toggle('is-hidden', n === 0)` — usa la clase global, sin regla propia de ocultamiento |
| `.blf-popover` | Panel — `role="menu"`, visibilidad via atributo `hidden` nativo |
| `.blf-popover-item` | Envoltorio de cada control reubicado (Deps/Hijos/Sin AC/Colapsar) — conserva el control original con su ID intacto |
| `.blf-popover-sep` | Separador — `role="separator"`, mismo tratamiento que `.sps-dropdown-sep` |
| `.blf-popover-sort` | Fila del control de orden — envuelve `#fbar-sort-select` + `#fbar-sort-dir-btn` |

**Popover Tipos — familia `.blt-*` (TKT2, trigger `#bstats-types-btn`):**

| Selector | Rol |
|---|---|
| `.blt-wrap` | Contenedor del trigger + popover — vive dentro del template literal de `_renderStatsBar()`, recreado en cada render |
| `.blt-trigger` | Botón trigger — mismo tratamiento visual que `.blf-trigger` |
| `.blt-badge` | Badge de conteo — cantidad de tipos con `count > 0` |
| `.blt-popover` | Panel — `role="menu"`, contiene los `.stat-type-chip` existentes sin cambio de clase, solo reubicados |

**Accesibilidad:** `:focus-visible` con `outline: 2px solid var(--accent)` heredado del mismo patrón que `.sps-btn-menu` — sin regla propia. Contraste badge (`--accent` / `--text-on-accent`) ya validado en el sistema, mismo par usado en otros badges de acento.

**Sin tokens nuevos** — reuso exclusivo de `--text-xs` · `--text-sm` · `--text-2xs` · `--radius-xs/sm/md/pill` · `--surface/2/3` · `--border/2` · `--accent` · `--accent-dim` · `--text-on-accent` · `--z-popover` · `--trans-fast/color`.

**Nota de arquitectura — recreación en render:** `.blt-wrap` se destruye y recrea en cada `_renderStatsBar()` (innerHTML completo) — su trigger usa delegación de eventos (`data-action="stats-toggle-types"`), no un listener directo. `.blf-wrap` vive en HTML estático (`index.html`) — su trigger usa listener directo, no delegación. No asumir el mismo mecanismo de binding entre ambas familias pese a compartir patrón visual.

### Encabezado de contexto vista-principal — familia `.spt-context-header` (T-202606-002)

Canónico en `locus-sprint.css`. Visible solo cuando `#sprint-panel-sprints` actúa como default en estado sin-sprint-activo (R-202606-001) — clase `.spt-main-view` aplicada por Rune (T-202606-001) según su lógica de detección.

| Selector | Rol |
|---|---|
| `.spt-context-header` | Header de contexto — `display: none` por defecto |
| `#sprint-panel-sprints.spt-main-view .spt-context-header` | Override — `display: flex` cuando el panel está en modo vista-principal |
| `.spt-context-header__icon` | Ícono decorativo del header — `var(--hint)`, `var(--text-xl)` |

**Comportamiento:** El panel ya es de columna única — el modo `.spt-main-view` no requiere anular ningún grid, solo mostrar el header de contexto. AC de empty-state total (ningún sprint de ningún tipo) pendiente — depende de que las 5 secciones (`#sps-activo`, `#sps-programados`, `#sps-pausados`, `#sps-qinc`, `#sps-cerrados`) queden vacías simultáneamente; lógica de JS, no resuelta por este CSS.



### Drawer lateral — patrón `.pend-overlay`

Canónico en `locus-modals.css`. Reutilizar para futuros drawers de consulta rápida.

| Selector | Rol |
|---|---|
| `.pend-overlay` | Overlay base — `display: none` por defecto, `position: fixed`, `inset: 0` |
| `.pend-overlay.open` | Estado visible — `display: flex`, alinea panel al borde derecho |
| `.pend-panel` | Contenedor — `max-width: 360px`, `height: 100%`, scroll interno |
| `.pend-panel-header` | Cabecera fija |
| `.pend-panel-body` | Cuerpo scrolleable |

Convenciones: visibilidad via `.open`. `z-index: var(--z-panel)` (1100). Overlay: `rgb(0 0 0 / 40%)`.

### Sprint close modal — familia `.sprint-close-*` + `scm-*`

Canónico en `locus-sprint-close.css`. Wizard de 3 pasos con stepper + paso de retro integrado.

Selectores principales: `.sprint-close-overlay`, `.sprint-close-dialog`, `.sprint-close-header`, `.sprint-close-steps`, `.sprint-close-body`, `.sprint-close-footer`, `.scs-step`.

Estado de visibilidad: `.sprint-close-overlay.open`.

Selectores auxiliares `scm-*` (CSS Purity, layout): `.scm-nowrap`, `.scm-flex-shrink-0`, `.scm-item-title-cell`, `.scm-retro-header`, `.scm-retro-badge`, `.scm-release-*`, `.scm-kpi`, `.scm-effort-*`, `.scm-migration-*`.

#### DOC-UPDATEs list — familia `scm-du-*` (T-202606-120)

| Selector | Rol |
|---|---|
| `.scm-du-list` | Contenedor lista — flex column, gap 6px, sin viñetas |
| `.scm-du-row` | Fila grid `1fr auto` — surface2, border, radius-md |
| `.scm-du-row.is-aplicado` | Estado aplicado — c-low-bg/border |
| `.scm-du-row.is-descartado` | Estado descartado — surface, opacity 0.55 |
| `.scm-du-row.is-pending-indicator` | Sin resolución — border c-medium-border |
| `.scm-du-meta` | Metadatos — flex column, gap 2px, min-width 0 |
| `.scm-du-doc` | Nombre del doc — text-sm, 500, ellipsis |
| `.scm-du-seccion` | Sección — text-xs, text2, ellipsis |
| `.scm-du-escalar` | Rol escalar_a — text-2xs, hint |
| `.scm-du-actions` | Botones — flex, gap 6px, flex-shrink 0 |
| `.scm-du-btn` | Botón base — padding 4px 10px, text-xs, surface3 |
| `.scm-du-btn:hover` | Hover — color text, border hint |
| `.scm-du-btn.aplicado.active` | Activo aplicado — c-low-bg/border/text |
| `.scm-du-btn.descartado.active` | Activo descartado — surface/hint |
| `.scm-du-badge` | Badge — oculto por defecto (`display: none`) |
| `.scm-du-row.is-aplicado .scm-du-badge` | Badge visible — c-low-bg/text/border |
| `.scm-du-row.is-descartado .scm-du-badge` | Badge visible — surface/hint/border |
| `.scm-du-empty` | Estado vacío — dashed border, hint, padding 28px 16px |

### Inline confirm — patrón `.item-inline-confirm`

Canónico en `locus-backlog.css`. Confirmación no-bloqueante para cambio de status de ítem.

**Variante A — sin impacto en sprint activo:** micro-flash en el chip de status (`.item-status-confirmed`).
**Variante B — con impacto en sprint activo:** par de botones inline con auto-cancelación a 6s.

| Selector | Rol |
|---|---|
| `.item-status-confirmed` | Micro-flash — animación `statusConfirmFlash` 600ms |
| `.item-inline-confirm` | Contenedor — oculto por defecto |
| `.item-inline-confirm.is-visible` | Estado activo |
| `.item-inline-confirm__accept` | Botón confirmar — colores `--c-low-*` |
| `.item-inline-confirm__cancel` | Botón cancelar — colores neutros |

Convenciones: visibilidad via `.is-visible`. `prefers-reduced-motion`: sin animación en `.item-status-confirmed`, sin `transform` en `.item-inline-confirm`.

### Pulso dot y panel — familia `pulso-*`

Canónico en `locus-sprint-plan.css`. Dot semántico en header + panel flotante de estado del ecosistema.

| Selector | Rol |
|---|---|
| `.pulso-dot-btn` | Botón contenedor del dot en header |
| `.pulso-dot` | Dot semántico — 10px, `border-radius: var(--radius-pill)` |
| `.pulso-dot--green / --yellow / --red` | Modificadores de estado |
| `.pulso-overlay` | Overlay oscuro — `z-index: var(--z-overlay)` |
| `.pulso-panel` | Panel flotante — `z-index: var(--z-panel-2)` |
| `.pulso-visible` | Estado de panel abierto |
| `.pulso-header` / `.pulso-body` / `.pulso-title` / `.pulso-close-btn` | Estructura interna |
| `.pls-section` / `.pls-proj-row` / `.pls-plan-row` | Secciones internas del panel |

Estado de visibilidad: `.pulso-visible` sobre `.pulso-panel`.

### Vista Planificación — familia `bl-plan-*`

Canónico en `locus-sprint-ui.css`. Layout de drag & drop backlog → sprint (dos columnas).

| Selector | Rol |
|---|---|
| `.bl-planning-view` | Contenedor principal — animación `blPlanFadeIn` |
| `.bl-plan-columns` | Grid `1fr 28px 1fr` (col izq · separador · col der) |
| `.bl-plan-col` | Columna base — `border-radius: var(--radius-lg)` |
| `.bl-plan-col--over` | Estado drop-target activo — borde accent |
| `.bl-plan-col--right` | Columna sprint destino — tinted header |
| `.bl-plan-meter` | Medidor de effort en columna derecha |
| `.bl-plan-card` | Card de ítem arrastrable |
| `.bl-plan-card--dragging` | Estado de arrastre activo |

`--plan-meter-pct` se setea via `style.setProperty` en JS — excepción CSS Purity permitida.

### Execution Plan sessions — familia `plan-*`

Canónico en `locus-sprint-plan.css`. Visualización de sesiones por scope (sesion/sprint).

| Selector | Rol |
|---|---|
| `.plan-scope-section` | Contenedor por scope |
| `.plan-scope-section--sesion` | Scope sesión activa — borde-left accent |
| `.plan-scope-section--sprint` | Scope sprint — neutro |
| `.plan-sessions-row` | Fila de sesiones — toggle colapso via `.is-hidden` |
| `.plan-zone` / `.plan-zone--done` / `.plan-zone--available` / `.plan-zone--sequential` | Zonas de estado de sesión |
| `.plan-session-*` | Elementos de card de sesión |

Visibilidad de `.plan-sessions-row`: via `.is-hidden` (CSS Purity — no `style.display`).

### Sección Icebox — familia `bl-icebox-*`

Canónico en `locus-backlog.css`. Agrupa ítems sin sprint asignado.

| Selector | Rol |
|---|---|
| `.bl-icebox-group` | Contenedor raíz — `margin-bottom: 2rem` |
| `.bl-icebox-header` | Header colapsable — `border-left: 2px solid var(--hint)`, cursor pointer |
| `.bl-icebox-arrow` | Flecha de colapso — `.collapsed` aplica `rotate(-90deg)` |
| `.bl-icebox-count` | Conteo de ítems — monospace, `margin-left: auto` |
| `.bl-icebox-body` | Cuerpo de ítems — `.collapsed` aplica `display: none` |
| `.bl-icebox-item-alert` | `<div>` contenedor de alerta por ítem — precede al `buildBacklogItem()` del ítem afectado. Contiene una `staleness-pill.staleness--stale` con el label de días. Solo se renderiza cuando `_iceboxStaleness(item)` retorna valor no nulo. Archivo canónico: `locus-backlog.css` — pendiente de definición CSS. |
| `.bl-icebox-alert-count` | Clase adicional aplicada sobre `.staleness-pill.staleness--stale` en el **header del grupo icebox** — muestra el conteo total de ítems con alerta (`⚠ N`). No es un elemento independiente: es `staleness-pill staleness--stale bl-icebox-alert-count` como clase compuesta. Archivo canónico: `locus-backlog.css` — pendiente de definición CSS. |

**Estructura de renderizado (extraída de `locus-backlog-render.js` T-202606-163):**

```html
<!-- Header del grupo icebox — badge de conteo total -->
<span class="staleness-pill staleness--stale bl-icebox-alert-count">⚠ N</span>

<!-- Por cada ítem en icebox con alerta -->
<div class="bl-icebox-item-alert">
  <span class="staleness-pill staleness--stale">Xd en icebox</span>
</div>
<!-- seguido de buildBacklogItem(item) -->
```

**Umbrales de alerta icebox (calculados por `_iceboxStaleness()` en `locus-backlog-render.js`):**

| Tipo | Umbral |
|---|---|
| R · T | 14 días |
| P | 30 días |
| B `priority: high` | 7 días |
| B priority no-high | Sin alerta |

**CSS pendiente:** `.bl-icebox-item-alert` y `.bl-icebox-alert-count` sin definición CSS actual. Patrón de referencia:
```css
.bl-icebox-item-alert {
  padding: 2px 14px 0;
}

/* bl-icebox-alert-count usa los estilos de staleness--stale — no requiere reglas propias */
```

**Regla semántica:** `.bl-icebox-alert-count` no agrega estilos propios — es un selector adicional para identificar el badge de conteo en el header vs. los badges por ítem (`.bl-icebox-item-alert > .staleness-pill`). Ambos usan `staleness--stale` como fuente de color.

---

### Archivo Histórico — familia `arch-*`

Canónico en `locus-archive.css`. Vista Por sprint y Lista plana de sprints cerrados.

| Selector | Rol |
|---|---|
| `.arch-historico-header` | Header colapsable del bloque histórico |
| `.arch-historico-body--collapsed` | Estado colapsado — `display: none` |
| `.arch-historico-tabs` | View tabs (Por sprint / Lista plana) |
| `.arch-tab` / `.arch-tab--active` | Tabs de vista |
| `.arch-sprint-entry` / `.arch-sprint-entry-header` | Acordeón por sprint |
| `.arch-sprint-items--collapsed` | Items de sprint colapsados — `display: none` |
| `.arch-item-row` | Fila compacta de ítem en vista lista |
| `.arch-row-type--req/tkt/inc/disc` | Tipo de ítem con color semántico. **⚠️ Migración pendiente (Rune):** en el codebase actual los selectores son `--r/--t/--b/--p` — renombrar a `--req/--tkt/--inc/--disc` junto con call sites JS — ver nota de migración §Selectores Gen 1. |
| `.arch-se-effort` | Effort entregado — badge accent |

Read-only treatment: ítems en `#arch-historico-body` tienen `opacity: 0.65`, controles deshabilitados y botones de acción ocultos.

### AI Card rediseño — familia `sc-*` + `card-dot-*`

Canónico en `locus-sesiones-card.css`. Extracción de `locus-sesiones.css`. Aplica a `buildCard()` y `_buildCurrentSessionCard()`.

#### Estructura de la card

| Selector | Rol |
|---|---|
| `.sc-header` | Header principal — flex, `border-bottom: 0.5px solid var(--border)` |
| `.sc-header-left` | Grupo izquierdo — avatar + nombre de proyecto |
| `.sc-header-right` | Grupo derecho — badge + sprint-id + menú |
| `.sc-avatar` | Avatar 28px circular — `background: var(--accent-dim)` |
| `.sc-project` | Nombre del proyecto — truncado con ellipsis |
| `.sc-badge` | Badge de estado activo — inline-flex, dot animado. Base para los modificadores de estado |
| `.sc-badge-dot` | Dot dentro del badge — animación `sc-pulse-dot` 2s. Oculto en variantes `--avail` y `--exhausted` |
| `.sc-badge--avail` | Modificador estado disponible — `var(--c-pulido-bg/text/border)`. Sin dot. B-202606-047 |
| `.sc-badge--exhausted` | Modificador estado agotado — `var(--c-won-bg/text/border)`. Sin dot. B-202606-047 |
| `.sc-sprint-id` | ID de sprint — monospace, `var(--hint)` |
| `.sc-menu-btn` | Botón menú 26×26px — `background: transparent` |

#### Stats grid

| Selector | Rol |
|---|---|
| `.sc-stats` | Grid 3 columnas — `border-bottom: 0.5px solid var(--border)` |
| `.sc-stat` | Celda stat — `padding: 0.75rem 1.125rem` |
| `.sc-stat-val` | Valor numérico — `var(--text-display-sm)`, `font-weight: 500` |
| `.sc-stat-lbl` | Label stat — `var(--text-2xs-plus)`, uppercase, hint |

#### Stepper de 3 estados

| Selector | Rol |
|---|---|
| `.sc-stepper` | Contenedor flex row |
| `.sc-step` | Paso — `flex: 1`, borde compartido |
| `.sc-step.active` | Estado activo — `box-shadow: inset 0 -2px 0 var(--accent)` |
| `.sc-step.done` | Estado completado — colores `--c-low-*` |
| `.sc-step-num` | Número circular 15px |

#### Footer y elementos auxiliares

| Selector | Rol |
|---|---|
| `.sc-footer` | Footer — flex, `background: var(--surface2)` |
| ~~`.sc-unlock` / `.sc-unlock-label` / `.sc-unlock-icon`~~ | **deprecated** — ver sección Deprecated |
| ~~`.hora-input`~~ (instancia card footer) | **deprecated** — ver sección Deprecated |
| `.sc-save` | Botón guardar — deshabilitado por defecto, `.ready` activa acento |
| `.sc-preview-block` | Preview CHECKPOINT — monospace, `max-height: 160px`, scroll |
| `.sc-success-state` | Feedback éxito — `background: var(--c-low-bg)` |
| `.sc-notes-toggle` | Toggle notas — ancho completo, `.open` rota el ícono |

#### Dropdown menú de card

| Selector | Rol |
|---|---|
| `.card-dot-menu` | Contenedor relativo |
| `.card-dot-dropdown` | Dropdown — `position: fixed`, `z-index: var(--z-toast)`, `display: none` por defecto |
| `.card-dot-dropdown.open` | Estado visible — `display: flex` |
| `.card-dot-item` | Ítem de menú — hover `var(--surface3)` |
| `.card-dot-item.danger` | Ítem destructivo — `var(--red)` |
| `.card-dot-divider` | Separador horizontal |
| `.danger-zone` | Zona destructiva — `display: flex; flex-direction: column` |

**Nota de extracción:** `locus-sesiones-card.css` extrae únicamente selectores `sc-*` y `card-dot-*` de `locus-sesiones.css`. Los demás selectores de Tracker siguen en `locus-sesiones.css`.

### HTML-MAP viewer — familia `htmlmap-*` + `mm-*` + `hmfilter-*`

Canónico en `locus-docs.css`. Extracción de `locus-backlog.css` (T-202605-112).

#### Tabla clásica (vista legacy)

| Selector | Rol |
|---|---|
| `.htmlmap-meta-banner` | Banner de metadatos — oculto por defecto, `.visible` lo activa |
| `.htmlmap-filter-bar` | Barra de filtros por tipo |
| `.htmlmap-filter-btn` | Botón filtro — `.active` usa `var(--accent)` |
| `.htmlmap-table` | Tabla de archivos — `border-collapse: collapse` |
| `.htmlmap-type-badge` | Badge de tipo — `.htmlmap-type-css/html/js` con colores semánticos |

#### Árbol modular (Module Map)

| Selector | Rol |
|---|---|
| `.mm-toolbar` | Toolbar — flex, pills + search |
| `.hmfilter-pill` | Pill de filtro — border sutil por tipo, `opacity: 0.75` idle |
| `.hmfilter-pill.active` | Estado activo — fondo color-mix del tipo, subrayado |
| `.hmfilter-pill--all.active` | "Todos" activo — quita énfasis a pills individuales |
| `.hmfilter-pill.mm-fc-js/css/html` | Variantes por tipo — color de borde semántico |
| `.mm-module` | Módulo individual — `border: 1px solid var(--border)`, overflow hidden |
| `.mm-module-header` | Header clicable — `cursor: pointer` |
| `.mm-module-body` / `.mm-module-body.mm-open` | Cuerpo — `display: none` / `display: block` |
| `.mm-file-badge` | Badge tipo archivo — `.mm-fc-js/css/html` |
| `.mm-arrow` / `.mm-arrow.mm-arrow-open` | Flecha colapsado/expandido — `rotate(90deg)` |
| `.mm-bar-wrap` / `.mm-bar-fill` | Barra de tamaño de módulo — `transition: width 0.4s var(--ease-bounce)` |
| `.mm-fn-row` | Fila de función |
| `.mm-area-group` / `.mm-area-label` | Agrupación por área funcional |

#### Context vivo

| Selector | Rol |
|---|---|
| `.context-placeholder` | Empty state centrado del sub-tab Context |
| `.context-raw-block` | Bloque raw de texto de contexto — monospace, `white-space: pre-wrap` |
| `.context-nav` | Navegador de secciones — flex column |
| `.context-conflict-banner` | Alerta de conflicto — fondo `rgb(232 85 85 / 10%)`, color `var(--red)` |
| `.sstab-modified-dot` | Dot pulsante en sub-tab modificado — animación `pulse-dot` 2s |

**Regla de extracción:** Todo selector de HTML-MAP y Context nuevo va en `locus-docs.css`. No agregar a `locus-backlog.css` ni a ningún otro módulo.

### Teaser de notificación — familia `tvh-notif-*`

Canónico en `locus-sesiones.css`. Slot único dentro de `#tracker-view-header` — reemplaza al Setup Checklist Banner eliminado. Muestra la notificación no leída de mayor severidad, con link para expandir el Radar Sidebar (`.rsb-*`, `locus-radar.css`).

| Selector | Rol |
|---|---|
| `.tvh-notif-teaser` | Contenedor raíz — shell HTML estático, siempre presente en el DOM |
| `.tvh-notif-icon` | Ícono de tipo — emoji Unicode vía `textContent`, reusa el campo `icon` de `_computeNotifications()` |
| `.tvh-notif-title` | Título de la notificación — truncado a una línea |
| `.tvh-notif-body` | Body truncado a una línea — oculto en viewport `<480px` |
| `.tvh-notif-viewall` | Botón "Ver todas (N)" — invoca `toggleRadarSidebar()` solo si el sidebar está colapsado |

**Estado vacío:** `.tvh-notif-teaser.is-hidden` — mismo comportamiento de colapso a 0 altura que tenía el SCB, clase canónica `.is-hidden` sin excepción (a diferencia de `.tmpl-trigger-body`, ver arriba).

**Tokens:** `--card-bg-hover` (fondo), `--text` (texto), `--color-primary` (acento del ícono/hover del link) — mismos tokens que `.rsb-notif-item--unseen`/`.rsb-notif-title` en `locus-radar.css`. Sin tokens nuevos — contraste heredado del componente ya validado.

**Regla:** El teaser no reimplementa `_computeNotifications`/`_notifReadSet`/`_notifGoto` — solo los consume. Cualquier estilo nuevo de severidad o ícono va en `locus-radar.css` (fuente del dato), no en `tvh-notif-*`.

### tmpl-trigger-wrap — colapso animado

Canónico en `locus-proyectos.css`. Controla visibilidad del cuerpo del template trigger mediante animación de colapso — **no** `display: none`.

**Nota de anidamiento intencional:** `.tmpl-trigger-body.is-hidden` sobreescribe el comportamiento canónico de `.is-hidden`. No produce `display: none` — produce colapso por `max-height` y `opacity`. Única excepción al comportamiento canónico de `.is-hidden` en el proyecto.

| Selector | Rol |
|---|---|
| `.tmpl-trigger-wrap` | Contenedor raíz |
| `.tmpl-trigger-body` | Cuerpo colapsable — visible por defecto |
| `.tmpl-trigger-body.is-hidden` | Estado colapsado — `max-height: 0`, `opacity: 0` |

### Preview de ítems parseados — familia `preview-tg-*`

Canónico en `locus-backlog-item.css`. Componente `buildTGPreview()` en `locus-session-parse.js`.

**Estructura del componente:**

| Selector | Rol |
|---|---|
| `.preview-tg-header` | Fila superior del preview — flex row, space-between. Contiene label + count |
| `.preview-tg-header-label` | Etiqueta de sección — uppercase, `var(--hint)`, `text-2xs`, `font-weight: 600` |
| `.preview-tg-header-count` | Conteo de ítems en el preview — `var(--hint)`, `text-2xs` |
| `.preview-tg-discrepancy` | Bloque de alerta de discrepancia — fondo `var(--red)` dim, borde `var(--red)` dim, texto `var(--red)`. Se muestra cuando hay conflicto entre estado declarado y estado en backlog |
| `.preview-tg-badges-row` | Fila de badges — flex row, `gap: 5px`, `flex-wrap: wrap`. Contiene los `preview-tg-tag--*` |

**Badges semánticos:**

| Selector | Rol |
|---|---|
| `.preview-tg-tag--warn` | Badge de advertencia — fondo amber dim, texto amber. Uso: ítem nuevo sin AC |
| `.preview-tg-tag--info` | Badge informativo — fondo `var(--blue-dim)`, borde `var(--blue-border)`, texto `var(--blue)`. Uso: ítem nuevo con campo obligatorio ausente (`no_incluye` en T, `intencion` en R, `triggered_by` en B) |

**Regla semántica:** `--warn` = falta que bloquea verificabilidad (sin AC). `--info` = falta que reduce trazabilidad pero no bloquea QA. No intercambiar.

**CSS de `.preview-tg-tag--info`:**
```css
.preview-tg-tag--info {
  background: rgb(from var(--blue) r g b / 0.12);
  border: 1px solid var(--blue-border);
  color: var(--blue);
}
```

**Contraste:** `var(--blue)` pasa 4.5:1 en ambos temas (declarado en tokens §1). ✅

**Estados del componente:** Sin estados adicionales — visibilidad controlada por presencia/ausencia del elemento en el DOM, no por clases CSS.

**⚠️ Gap pendiente:** Los badges `preview-tg-tag--warn` y `preview-tg-tag--info` no se encontraron en `locus-backlog.css` ni en `locus-backlog-item.css` al cerrar T-202606-143. Archivo canónico de los badges pendiente de confirmación. **Auditoría v0.5.0 (2026-06-21):** indicios de resolución parcial detectados contra los 17 CSS reales — no reconciliado en esta versión, requiere re-adjuntar los archivos reales para confirmar archivo canónico exacto antes de cerrar el gap.

---

### Staleness pill — `.staleness-pill` + modificadores `staleness--*`

Canónico en `locus-backlog-item.css`. Implementado en `locus-backlog-item.js` (`buildBacklogItem()`) y reutilizado en `locus-backlog-render.js` para ítems icebox. Pill inline que indica antigüedad del último cambio de status — calculado por `_staleness()` y `_iceboxStaleness()`.

**⚠️ CSS pendiente:** `.staleness-pill` y sus modificadores son clases referenciadas en JS sin definición CSS actual en ningún archivo del proyecto. Rune debe definirlas en `locus-backlog-item.css` (sección R-202605-045). Patrón de referencia acorde al sistema de diseño:

```css
.staleness-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--text-2xs);
  font-weight: 600;
  border-radius: var(--radius-pill);
  padding: 1px 6px;
  white-space: nowrap;
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
  border: 1px solid;
}

.staleness-pill.staleness--fresh {
  color: var(--green);
  background: color-mix(in srgb, var(--green) 10%, transparent);
  border-color: color-mix(in srgb, var(--green) 28%, transparent);
}

.staleness-pill.staleness--warn {
  color: var(--amber);
  background: color-mix(in srgb, var(--amber) 10%, transparent);
  border-color: color-mix(in srgb, var(--amber) 28%, transparent);
}

.staleness-pill.staleness--stale {
  color: var(--red);
  background: color-mix(in srgb, var(--red) 10%, transparent);
  border-color: color-mix(in srgb, var(--red) 28%, transparent);
}
```

**Modificadores y umbrales (calculados por `_staleness()` en `locus-backlog-item.js`):**

| Modificador | Condición | Color semántico |
|---|---|---|
| `staleness--fresh` | ≤ 3 días desde último cambio de status | `--green` |
| `staleness--warn` | 4–7 días | `--amber` |
| `staleness--stale` | > 7 días | `--red` |

**Contexto de uso:** Renderizado dentro de `.bitem-subline`. Solo aplica a ítems con `status: pendiente`, con sprint asignado (no icebox), sin sesión reciente vinculada. No aplica a ítems `done` ni `descartado`. En ítems icebox se usa siempre `staleness--stale` (umbral superado por definición al activarse la alerta).

---

### Tokens semánticos de status — familia `c-*-bg / c-*-text / c-*-border`

Variables CSS declaradas en `locus-base.css`. Usadas por `bl-strip-btn`, `sc-badge` y cualquier componente que coloree por estado de ítem o estado de sprint.

| Familia | Status asociado | Color de referencia |
|---|---|---|
| `--c-done-bg` · `--c-done-text` · `--c-done-border` | `done` / hecho | Verde — `--green` dim |
| `--c-high-bg` · `--c-high-text` · `--c-high-border` | `en-revision` / en revisión — naming heredado de severidad, reutilizado para status (ver nota abajo) | Naranja — `#e8742e` dark / `#b05020` light |
| `--c-pulido-bg` · `--c-pulido-text` · `--c-pulido-border` | `en-curso` / disponible | Cian-verde — derivado de `--accent` dim |
| `--c-won-bg` · `--c-won-text` · `--c-won-border` | `descartado` / agotado | Ámbar apagado — derivado de `--amber` dim |

**Regla de uso:** No usar valores hardcoded cuando existe token `c-*`. Cualquier componente nuevo que coloree por estado de ítem o worker consume esta familia — no redefine colores propios.

**Anti-pattern de naming — no confundir con `--c-severity-high-*`:** `--c-high-*` es status (`en-revision`), no severidad — el nombre es heredado y engañoso. La familia de severidad (`high`/`medium`/`low` de items y INC) usa el token separado `--c-severity-high-*` declarado en `_Locus-ux-ref §A-04`. Ambos comparten color naranja por coincidencia, no por relación semántica — no asumir que son el mismo token.

**⚠️ Token `--c-medium-*` no existe** — ver nota en §Tokens de sprint (L.474). Estado pausado usa `--surface2` / `--hint`.

---

### Filter strip de status — familia `bl-strip-btn` + `s-*`

Canónico en `locus-backlog.css`. Barra de filtros de status del tab Backlog (`#filter-bar-status`).

| Selector | Rol |
|---|---|
| `.bl-strip-btn` | Botón base del filter strip — inactivo por defecto |
| `.bl-strip-btn.active` | Estado activo — accent dim con border |
| `.bl-strip-btn.active.s-done` | Activo — variables `c-done-*` |
| `.bl-strip-btn.active.s-en-revision` | Activo — variables `c-high-*` |
| `.bl-strip-btn.active.s-en-curso` | Activo — variables `c-pulido-*` |
| `.bl-strip-btn.active.s-descartado` | Activo — variables `c-won-*` |
| `.bl-strip-btn.active.s-bloqueado` | Activo — variables amber |

**Regla de naming:** Todo botón del filter strip de status usa `bl-strip-btn` como clase base + modificador `s-[status]` para el color de estado activo. El id sigue el patrón `fstatus-[status]`.

**⚠️ No confundir con `bl-fs-btn`:** La familia `bl-fs-btn` + `fs-*` existe en CSS pero no tiene instancias activas en `index.html` — es legacy. Para nuevos botones de filtro de status: usar siempre `bl-strip-btn`.

---

### Chips de filtros activos — familia `afc-*`

Canónico en `locus-backlog.css`. Fila de chips debajo de la toolbar que muestra los filtros activos al usuario sin requerir abrir el panel de filtros. Introducido en T-202606-058 (R-202606-006).

| Selector | Rol |
|---|---|
| `#active-filter-chips` | Contenedor de la fila — `display: none` por defecto, visible solo cuando hay filtros activos |
| `.afc-chip` | Chip individual — pill con label del filtro activo + botón de cierre `×` |
| `.afc-chip:hover` | Hover — brightness sutil sobre el fondo del chip |
| `.afc-chip .afc-close` | Botón `×` dentro del chip — elimina ese filtro al hacer click |

**Comportamiento:** El contenedor `#active-filter-chips` es visible solo cuando `activeTypes` o `activeStatuses` tienen al menos un valor seleccionado. Sin filtros activos el contenedor no ocupa espacio en el layout (`display: none`).

**Badge de conteo:** reemplazado por `.blf-badge` sobre el trigger `#fbar-filter-btn` — ver `### Popovers de toolbar/stats — familia .blf-* / .blt-* (TKT1/TKT2)` en `§Patrones de componentes flotantes`. `#bl-filter-badge` (T-202606-057) no tiene instancia activa en el codebase desde el REQ de consolidación de toolbar anterior — entrada obsoleta, corregida en mod:35.

---

### Sección Cerradas — DISC terminales (promoted + descartado)

Canónico en `locus-backlog.css`. Agrupa Ps en status terminal bajo un único `.section-group.sg-cerradas`. Reemplaza el grupo `.sg-discarded` que solo aceptaba descartadas.

| Selector | Rol |
|---|---|
| `.section-group.sg-cerradas` | Contenedor de la sección Cerradas — scope de todos los overrides siguientes |
| `.section-group.sg-cerradas .section-group-header` | Header con `opacity: 0.72` — levemente más visible que `.sg-discarded` (0.70) |
| `.section-group.sg-cerradas .bitem--idea.bitem--promoted .idea-promoted-chip` | Badge verde positivo — `--green` con `color-mix` al 10%/28% para bg/border |
| `.section-group.sg-cerradas .bitem--idea.bitem--promoted .idea-promoted-chip:hover` | Hover del chip verde — brightness(1.08) |
| `.section-group.sg-cerradas .bitem--idea.bitem--promoted .bitem-title` | Sin `text-decoration: line-through` — promovida no es cancelada |
| `.section-group.sg-cerradas .bitem--idea.bitem--promoted .item-quick-actions` | `pointer-events: none; visibility: hidden` — row terminal, sin acciones |

**Tokens consumidos:** `--green` · `color-mix(in srgb, var(--green) 10%/18%/28%, transparent)`

**Comportamiento por status dentro de Cerradas:**

| Status | Clase en row | Chip / badge | Título |
|---|---|---|---|
| `promovida` | `bitem--promoted` | Verde — `--green` — texto `↗` + código de ítem si `promovida_a` existe | Normal, sin line-through |
| `descartado` | `bitem--discarded` / `is-discarded` | `.idea-discard-reason` — muted, italic | Line-through en `--hint` (estilos existentes sin cambio) |

**Nota JS para Rune:** El header de la sección debe renderizar el label "Cerradas" y aplicar clase `.sg-cerradas` al `.section-group` contenedor. El label anterior "Descartadas" y la clase `.sg-discarded` pueden coexistir si hay otra sección que solo muestre descartados en otra vista — evaluar en sesión de Rune.

---

### `mdiff-queue-badge` — badge de cola fija en modal DIFF

Reemplaza `.mdiff-sprint-select` cuando el ítem no acepta sprint/Q-Backlog — ítems de cola fija ITIL (INC/PRB/KE/CHG → Q-INC) y DISC (→ Q-DISC). No interactivo.

| Selector | Uso | Color |
|---|---|---|
| `.mdiff-queue-badge` | Clase base — estructura compartida (altura, padding, tipografía, radius) | Neutro — `var(--hint)` / `var(--surface2)` |
| `.mdiff-queue-badge--qinc` | Modificador para INC/PRB/KE/CHG | Sin color propio — hereda el neutro de la clase base. No confundir con `qinc-type-badge` (`§Tabla de prefijos`), que sí tiene color rojo propio en otro contexto |
| `.mdiff-queue-badge--qdisc` | Modificador para DISC (TKT-202607-001) | `var(--purple)` — mismo token que `.item-type-pill.DISC` (`§Colores declarados — item-type-pill Gen2`). Fondo `color-mix(in srgb, var(--purple) 15%, transparent)`, borde `color-mix(in srgb, var(--purple) 30%, transparent)` |

**Selección de tipo — lógica en JS:** `_sprintSelect(code, sprintOverride, itemType)` en `locus-backlog-merge.js` decide la rama vía `_QINC_TYPES` / `_QDISC_TYPES` (arrays de tipo). Cualquier tipo nuevo que se agregue a una cola fija futura debe declarar su propio array y su propia rama — no reutilizar `_QINC_TYPES` para tipos no-ITIL.

**Anti-pattern:** No asumir que declarar una clase modificadora en JS (`mdiff-queue-badge--X`) implica que el CSS ya existe — `--qinc` estuvo sin color propio desde su introducción original hasta esta auditoría, sin que nadie lo notara porque el badge seguía siendo visualmente aceptable en su tono neutro.

---

### Divisor de zona — `.arch-zone-divider` (`locus-archive.css`)

Separador visual entre zonas de sprint cerrado consecutivas en el panel Histórico de pantalla completa. Se inserta en el DOM por `renderArchivoHistorico()` (`locus-backlog-archive.js`) — no interactivo, sin texto.

| Selector | Rol |
|---|---|
| `.arch-zone-divider` | Línea de 1px entre dos zonas de sprint consecutivas — `height: 1px; background: var(--border); margin: 12px 0` |

**Tokens consumidos:** `--border` — mismo token que `.arch-historico-body` (border-top) y `.arch-item-row` (border-bottom) en el mismo archivo, sin token nuevo.

**Accesibilidad:** Sin texto ni ícono — el mínimo de contraste 4.5:1 no aplica (regla es para elementos con contenido textual).

**Gap cerrado:** La clase se insertaba en el DOM desde antes de este sprint sin definición CSS — divisor invisible. Detectado en auditoría de Finn, cerrado en TKT3 del REQ Fixes subtab Backlog Histórico.

---

## CSS Purity — Locus

Regla completa en `__BR-Execution §3`. Excepciones específicas de Locus:

```js
// ✓ Permitido — CSS custom properties con valor calculado en runtime
element.style.setProperty('--sprint-progress', '42%');
element.style.setProperty('--hsr-pct', pct + '%');
element.style.setProperty('--plan-meter-pct', pct + '%');
element.style.setProperty('--sph-bd-width', pct + '%');
```

Todo lo demás (`style.color`, `style.display`, `cssText`) — prohibido.

---

## Selectores compartidos — fuente canónica

Selectores usados en múltiples módulos CSS. La definición base vive en un único archivo. Los demás solo pueden agregar **modificadores calificados** — nunca redefinir propiedades base.

| Selector | Fuente canónica | Scope de uso | Estados en fuente canónica |
|---|---|---|---|
| `.card` | `locus-layout.css` | backlog · layout · proyectos · tracker | `.card` base únicamente |
| `.btn-primary` | `locus-layout.css` | backlog · layout | `:hover` `:active` `:focus-visible` |
| `.tab-btn` | `locus-layout.css` | analytics · backlog · layout · modals | `:hover` `.active` `::after` `.active::after` `:focus-visible` |
| `.item` | `locus-backlog.css` | backlog · proyectos | Base únicamente — modificadores en módulo destino |

**Regla:** Si un módulo necesita agregar un estado de estos selectores — el estado va en la fuente canónica, no en el módulo. Si hay ambigüedad, devolver a Nova.

---

## Checklist antes de hacer merge

- [ ] `npm run lint:css` pasa sin errores nuevos
- [ ] No introduce `style=` inline en HTML estático
- [ ] No introduce propiedades de presentación directas en JS
- [ ] No introduce `font-size` hardcodeado — usar tokens de escala
- [ ] No introduce `border-radius` hardcodeado (excepto `0`, `50%` documentados — `1px` y `2px` ahora tienen tokens `--radius-3xs` y `--radius-2xs`)
- [ ] No introduce `z-index` hardcodeado — usar tokens
- [ ] Variables globales nuevas declaradas en `locus-base.css`, no en el módulo
- [ ] Variables de instancia de componente declaradas dentro del selector que las usa
- [ ] Selector nuevo en el módulo correcto — consultar prefijo en tabla de naming
- [ ] Si agrega animación → incluye bloque `prefers-reduced-motion`
- [ ] Si agrega clase de visibilidad → usa `.is-hidden`, no crea nueva
- [ ] Si falta una clase CSS necesaria → devolver a Nova antes de implementar
- [ ] Si usa alias de texto legacy (`--text-muted`, `--text1`, `--text3`) → migrar a canónico

---

## Selectores Gen 1 — nota de migración para Rune

Los selectores listados abajo usan nomenclatura de letras cortas heredada de Generación 1 del ecosistema. El codebase los tiene implementados tal cual — los Doc Refs los documentan en su estado actual hasta que Rune ejecute la migración.

**Scope de la migración:** renombrar selectores en los archivos CSS correspondientes + actualizar todos los call sites JS que los generan o consumen.

| Selector actual (Gen 1) | Selector objetivo (Gen 2) | Archivo CSS | Notas |
|---|---|---|---|
| `.spl-type--r` | `.spl-type--req` | `locus-sprint.css` | Generado por `_renderPlannedSprints()` en `locus-sprint.js` |
| `.spl-type--t` | `.spl-type--tkt` | `locus-sprint.css` | Ídem |
| `.spl-type--b` | `.spl-type--inc` | `locus-sprint.css` | Ídem — en Gen 2 `B` (bug) → `INC` |
| `.arch-row-type--r` | `.arch-row-type--req` | `locus-archive.css` | Generado por función de renderizado de histórico |
| `.arch-row-type--t` | `.arch-row-type--tkt` | `locus-archive.css` | Ídem |
| `.arch-row-type--b` | `.arch-row-type--inc` | `locus-archive.css` | Ídem |
| `.arch-row-type--p` | `.arch-row-type--disc` | `locus-archive.css` | En Gen 2 `P` (DISC original) → `DISC` |
| `.item-type-pill.R` | `.item-type-pill.REQ` | `locus-backlog.css` / `locus-backlog-item.css` | Clase de un carácter — verificar todas las instancias en JS antes de migrar |
| `.item-type-pill.T` | `.item-type-pill.TKT` | Ídem | Ídem |
| `.item-type-pill.B` | `.item-type-pill.INC` | Ídem | Ídem |
| `.item-type-pill.P` | `.item-type-pill.DISC` | Ídem | Ídem |
| `.item-type-pill.I` | Confirmar con Cael — sin equivalente Gen 2 declarado | Ídem | Verificar si `I` sigue siendo tipo activo |
| `.ct-pill-r` | `.ct-pill-req` | `locus-analytics.css` | Cycle Time por tipo — generado en `_cycleTimeData()` / render 'Por tipo', `locus-analytics-digest.js` — migrado en TKT-202607-003 |
| `.ct-pill-t` | `.ct-pill-tkt` | `locus-analytics.css` | Ídem |
| `.ct-pill-b` | `.ct-pill-inc` | `locus-analytics.css` | Ídem — en Gen 2 `B` (bug) → `INC` |

**Colores declarados — item-type-pill Gen2:**

| Selector | Token color | Fondo (color-mix 10%) | Borde (color-mix 28%) |
|---|---|---|---|
| `.item-type-pill.REQ` | `--blue` | `color-mix(in srgb, var(--blue) 10%, transparent)` | `color-mix(in srgb, var(--blue) 28%, transparent)` |
| `.item-type-pill.TKT` | `--green` | `color-mix(in srgb, var(--green) 10%, transparent)` | `color-mix(in srgb, var(--green) 28%, transparent)` |
| `.item-type-pill.INC` | `--red` | `color-mix(in srgb, var(--red) 10%, transparent)` | `color-mix(in srgb, var(--red) 28%, transparent)` |
| `.item-type-pill.DISC` | `--purple` | `color-mix(in srgb, var(--purple) 10%, transparent)` | `color-mix(in srgb, var(--purple) 28%, transparent)` |

`.item-type-pill.DISC` absorbe `.P` (promovida) y `.I` (idea) — un único selector, color purple semántico. `text` usa `var(--purple)` directamente. Token `--purple` declarado en `locus-base.css` — ver §1 Tokens de color utilitarios.

**Colores declarados — `.ct-pill-*` (`locus-analytics.css`, Tab Analytics · Cycle Time por tipo):**

Familia propia — no reusa selectores de `.item-type-pill`. Patrón visual distinto: sin borde, fondo `color-mix` 18% (vs 10%/28% bg/border de `.item-type-pill`). Extendida a los 7 tipos Gen2 en TKT-202607-003.

| Selector | Texto | Fondo (color-mix 18%) |
|---|---|---|
| `.ct-pill-req` | `var(--blue)` | `color-mix(in srgb, var(--blue) 18%, transparent)` |
| `.ct-pill-tkt` | `var(--green)` | `color-mix(in srgb, var(--green) 18%, transparent)` |
| `.ct-pill-disc` | `var(--purple)` | `color-mix(in srgb, var(--purple) 18%, transparent)` |
| `.ct-pill-inc` | `var(--red)` | `color-mix(in srgb, var(--red) 18%, transparent)` |
| `.ct-pill-prb` | `var(--orange-text)` | `color-mix(in srgb, var(--orange) 18%, transparent)` |
| `.ct-pill-ke` | `var(--yellow-text)` | `color-mix(in srgb, var(--yellow) 18%, transparent)` |
| `.ct-pill-chg` | `var(--slate-text)` | `color-mix(in srgb, var(--slate) 18%, transparent)` |

`.ct-pill-prb/ke/chg` usan los tokens `--orange-text` / `--yellow-text` / `--slate-text` (Cluster B, `locus-base.css` mod:7) — `--orange`/`--yellow`/`--slate` crudos caen bajo 4.5:1 como color de texto (dark: `--slate` 3.31–4.02:1 · light: `--orange` 2.93–3.42:1, `--yellow` 2.96–3.46:1). El fondo sigue usando el token base sin cambio — solo el texto necesitaba corrección de contraste.

`.ct-pill-req/tkt/disc/inc` reusan el token directo, igual que `.item-type-pill` — mismo gap de contraste pre-existente en `--blue`/`--red` sobre light theme (`--surface3`/`--bg2`, ~3.31–4.11:1) que `.item-type-pill.REQ`/`.INC`. Registrado como DISC por Nova — no se corrige en este TKT, fuera de scope.

**Card completa de DISC — familia `--idea-*` (`locus-backlog.css`, `.bitem--idea`):** `--idea-color` / `--idea-color-dim` / `--idea-bg` / `--idea-bg-hover` / `--idea-border` / `--idea-badge-bg` / `--idea-badge-text` — todos derivados de `var(--purple)` vía `color-mix`, light y `[data-theme="dark"]` (ver `Cambios mod:33`). No declarar hue crudo para esta familia — cualquier cambio de acento de DISC pasa por `--purple`, nunca por un valor HSL independiente.

**Criterio de migración:** Las clases de un carácter (`.R .T .B .P .I`) son aplicadas desde JS al construir ítems del backlog. La migración requiere grep completo contra los 50 módulos JS para asegurar que no queda ningún call site sin actualizar. Rune no migra en silencio — emite TKT con AC que incluya verificación de cero instancias Gen 1 tras la migración.

---

## Deprecated

Clases sin instancias activas en el codebase — candidatas a eliminación en sprint siguiente. Rune no las usa en código nuevo.

| Clase | Reemplazo canónico | Eliminada de | Sprint |
|---|---|---|---|
| `.sc-unlock` | n/a — funcionalidad movida al DIFF | `locus-sesiones.js` footer available | PP-S-01 |
| `.sc-unlock-label` | n/a | `locus-sesiones.js` footer available | PP-S-01 |
| `.sc-unlock-icon` | n/a | `locus-sesiones.js` footer available | PP-S-01 |
| `.hora-input` (instancia card footer) | `mdiff-duration-input` | `locus-sesiones.js` footer available | PP-S-01 |

**Nota:** sin instancias activas tras R-202606-016 — candidatas a eliminación de `locus-sesiones-card.css` en sprint siguiente. Las declaraciones CSS pueden conservarse hasta confirmar que no hay otras instancias en el codebase.
