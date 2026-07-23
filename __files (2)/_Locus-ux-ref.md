# _Locus-ux-ref.md
<!-- mod:31 | Última actualización: 2026-07-23 | UX Reference — Locus — mantenido por Nova -->

## Cambios (mod:30) — Toolbar reducido para vistas de solo lectura/archivo (REQ CAEL-0720-01, Histórico)

- **Origen:** homologación visual de Histórico con el header estándar de Backlog (`.bl-header-unified`). Al portar el toolbar completo se identificó que no todo control de Backlog tiene universo de aplicación en una vista terminal/archivada.
- **Patrón nuevo — Toolbar reducido:** una vista de solo lectura sobre ítems ya cerrados (`done`/`descartado`/`historico`) hereda el wrapper visual completo de `.bl-header-unified` pero **no** los controles cuya función depende de estado activo:
  - Filtros de status → no aplica, todo ítem ya es terminal.
  - Deps 🔗 → no aplica, dependencias solo bloquean flujo en curso.
  - Toggle Hijos → no aplica si el motor de render ya agrupa parent→hijos siempre (no es opcional en la vista).
  - Sin AC → no aplica, ítem terminal ya pasó QA de Finn.
  - Sort por prioridad → no aplica, orden cronológico fijo es el criterio correcto para un archivo.
  - Se conservan: **Colapsar todo** y **buscador** — necesidad de navegación aumenta con el volumen acumulado, no disminuye.
- **Primer caso de aplicación:** Histórico (`#historico-toolbar`). Referencia para cualquier vista futura de archivo/solo-lectura que homologue con `.bl-header-unified`.
- **Filtrado de buscador en vistas jerárquicas (R→hijos no colapsable):** cuando el contenedor filtrado tiene jerarquía parent→hijos anidada en el DOM (no plana), el filtro opera a nivel de grupo completo, no de fila individual — ocultar filas sueltas orfanaría hijos visibles bajo un padre oculto. Un grupo con al menos un match se muestra completo sin filtrar internamente.

## Cambios (mod:29) — E-16 nuevo: shell persistente — contenedor nunca se oculta, solo el cuerpo alterna (TKT2/TKT3, REQ CAEL-0720-05)

- **Origen:** TKT2/TKT3 (REQ CAEL-0720-05) — `#qinc-toolbar`/`#qinc-stats-bar` pasaron de generación dinámica (ocultos con 0 ítems) a siblings estáticos de `#qinc-panel-body`. Ver detalle completo en `§E-16`.
- **Contenido:** cuándo una barra de acciones/resumen debe ser shell persistente vs alternar junto con el contenido — criterio y ejemplo aplicado en Q-INC, generalizable a cualquier panel con la misma forma.

## Cambios (mod:28) — E-15 nuevo: header de vista unificado — fusión de dos contenedores hermanos bajo un solo border envolvente

- **Origen:** REQ CAEL-0720-02 (TKT1) — founder señaló que toolbar y stats bar del Backlog list "seguían pareciendo dos elementos" tras E-09 (que resolvió agrupación de controles, no jerarquía de contenedor). Implementación: `_Locus-css-ref` mod:111, `.bl-header-unified` en `locus-backlog.css`.
- **E-15 nueva:** cuando dos contenedores hermanos con relación funcional fuerte (misma vista, uso simultáneo) tienen cada uno su propio `border`/`border-radius`/`sticky`, se leen como dos elementos aunque estén adyacentes sin gap. Patrón de fusión: envolver ambos en un wrapper que porta el `border`/`radius`/`sticky` completo; los hijos pierden su estilo de contenedor propio y pasan a ser regiones internas separadas por un divisor sutil (mismo peso que separadores de grupo ya existentes en el sistema, ej. `.bl-toolbar-sep`) — no un border completo entre ellas.
- **Reutiliza el mecanismo de fusión ya validado**, no introduce uno nuevo: mismo criterio de radios opuestos que ya conectaba `.active-filter-chips` con `.bl-toolbar` (ver histórico pre-mod:28) — ese tercer elemento sigue fusionándose contra el borde inferior del wrapper nuevo, sin cambio en su propia declaración.
- **Gap de proceso detectado y corregido en la misma sesión — no capturado en Fase 5 original:** el TKT1 solo declaró `contract_detail` sobre `_syncToolbarHeightVar()` como función, pero el archivo real tenía un segundo punto de acoplamiento al selector viejo (`ResizeObserver` observando `.bl-toolbar` directamente, fuera del cuerpo de esa función). Cuando un elemento se fusiona en un wrapper nuevo, la verificación de impacto lateral de contrato debe cubrir **todas las referencias al selector antiguo en el archivo** (`grep` completo), no solo las que aparecen dentro de la función que el AC nombró explícitamente — una función puede tener lógica correcta y aun así dejar un observer/listener externo desincronizado.
- **Criterio para aplicar E-15 a otro par de contenedores:** (a) ambos viven en la misma vista y se usan simultáneamente, (b) cada uno tiene estilo de contenedor propio (border/radius) que compite visualmente, (c) no hay razón funcional para que se vean como bloques separados (si la separación comunica algo — ej. "esto es un panel distinto que puedes cerrar" — E-15 no aplica, mantener contenedores separados).

## Cambios (mod:27) — E-14 nuevo: tarjetas atribuidas de batch, bloque `finn_release` y bloques informativos condicionales en panel DIFF

- **Origen:** DOC-UPDATE pendiente desde TKT3/TKT6/TKT7 (REQ CAEL-0718-01) — declarado en sesión, aplicación diferida hasta contar con el MD editable (regla transitoria `__BR-Core §8`).
- **Contenido:** ver `§E-14` — criterio de ausencia total (sin hueco visual) compartido por las tres secciones condicionales del panel DIFF: tarjeta atribuida, `finn_release`, `finn_observations`.
- **Sin decisión de diseño nueva:** documenta comportamiento ya implementado y auditado por Finn en los TKTs correspondientes — este mod es el registro, no la especificación original.

## Cambios (mod:26) — E-13 nuevo: header de card como trigger completo del IDP en Q-INC (paridad con E-08, sin chevron dedicado) · gap de proceso declarado — sin borrador visual previo de Nova, decisión tomada directo sobre el diff de código a pedido del founder

## Cambios (mod:25) — J-01 corregida: swap semántico insession↔interrupted — `--purple`↔`--amber` invertidos

- **Origen:** decisión de founder tomada directamente en sesión con Nova (sin Fase 1 de Cael previa — registrado retroactivamente en backlog vía REQ CAEL-0717-01/TKT CAEL-0717-02). Implementación completa en `_Locus-css-ref` mod:85.
- **J-01 corregida:** `insession` deja de renderizar en `--purple` y pasa a `--amber` (naranja); `interrupted` — confirmado estado real y ejecutable, no solo BR (`ai.interrupted = true` en `buildHoyCard()`, `locus-sesiones.js`) — hereda el `--purple` que `insession` libera. `available` (`--green`) y `exhausted` (`--red`) sin cambio. Semáforo resultante: available=verde, insession=naranja, interrupted=morado, exhausted=rojo.
- **Motivo del swap invertido en vez de introducir un tercer color:** cero tokens nuevos — `--amber` y `--purple` ya estaban validados en contraste (`--purple` texto ~8:1 dark / ~5.9:1 light; `--amber` ya usado como texto directo en el sistema). El swap reasigna qué estado consume cuál, sin reabrir verificación de accesibilidad.
- **Colisión con `--purple` de tipo REQ (backlog, `__BR-Ecosystem §4`) declarada sin resolución de fondo:** el token ya era compartido con `insession` antes de este swap — mover `--purple` a `interrupted` no lo empeora ni lo mejora, es la misma naturaleza de colisión, ahora en el estado de menor frecuencia de uso. No se topa el token global.
- **Sin cambio de pulso/animación:** el pulso (ring de avatar `::after`, header `::before`, dot de status-pill) sigue atado a la clase de estado (`available`/`insession`), no al color — se mueve junto con `insession` a ámbar automáticamente. `interrupted` sigue sin pulso, mismo criterio que ya regía.
- **Selectores tocados:** ver detalle completo en `_Locus-css-ref` mod:85 — `.sc-avatar--*`, `.sc-badge--*`, `.worker-header--*` (worker-header), `.hoy-mini-*`/`.card.*-state` (AI Card), `.rsb-*` (Radar Sidebar).
- **Gap cerrado en esta entrada:** esta corrección de J-01 quedó pendiente de aplicar tras la sesión original del swap — `_Locus-css-ref` mod:85 ya reflejaba el cambio, este doc no. Cerrado al reverificar contra el archivo real adjunto.

## Cambios (mod:24) — A-08 nuevo: 4 niveles canónicos de jerarquía de texto — cierra deriva detectada en auditoría cross-CSS

- **Origen:** auditoría propia sobre los 21 archivos CSS reales del proyecto (fuera de sesión de TKT — iniciativa de Nova tras hallazgo señalado por el founder). Locus no declara ningún selector `h1`-`h6` nativo — toda jerarquía de título vive en ~140 clases `*-title`/`*-header`/`*-heading`, sin un criterio documentado de qué nivel usa qué combinación de tamaño/peso/tracking. La escala de 15 tokens (A-05) ya existía y es correcta — lo que faltaba era el mapeo de **qué token corresponde a qué rol de jerarquía**.
- **A-08 nueva:** 4 niveles canónicos — Tab title / Modal-section title / Card title / Eyebrow label — cada uno con tamaño, peso y `letter-spacing` únicos. Ver tabla completa abajo.
- **Dos colisiones de selector-base cerradas en la misma sesión (ver `_Locus-css-ref` mod:82):** `.bitem-title` (`locus-backlog.css` vs `locus-backlog-item.css`) y `.mdiff-right-section-title` (`locus-backlog-item.css` vs `locus-modals-misc.css`) — mismo nombre de clase declarado dos veces con valores distintos, resuelto por orden de `<link>` en cascada sin que ningún AC lo capturara. Declaración perdedora eliminada en ambos casos.
- **`letter-spacing` del eyebrow uppercase unificado a `0.06em`** — antes en uso simultáneo: `0.04em`/`0.05em`/`0.06em`/`0.07em`/`0.08em` para el mismo rol funcional (label uppercase de header de sección). `0.06em` es la mediana de los valores ya en uso y el más frecuente después de `0.04em` — elegido para minimizar el volumen de selectores a tocar sobre los que ya usaban un valor cercano.
- **Deuda documentada, no migrada en esta sesión:** los selectores existentes que no coinciden con el nivel canónico asignado quedan registrados como deuda de consolidación visual — no se migran los ~140 selectores en este mod. Ver `_Locus-css-ref` mod:82 para el detalle de qué queda pendiente vs qué se corrigió (las 2 colisiones + el `letter-spacing`).
- **Resuelto en sesión** — condiciones de resolución directa cumplidas parcialmente: dueño presente (Nova) + founder presente. Las 2 colisiones y la unificación de `letter-spacing` son nivel Patch sin bifurcación — resueltas en sesión. La definición de los 4 niveles canónicos en sí (A-08) es una decisión de sistema de diseño, no un patch — se declara aquí como el criterio vigente a partir de este mod; TKTs futuros de UI la consumen como restricción de Fase 1.

## Cambios (mod:23) — E-12 nuevo: nombre canónico "Split View de Sesión" + Panel de Ingesta / Panel de Revisión

- **Origen:** acuerdo directo con el founder — el conjunto `#ingest-modal-overlay`+`#merge-diff-overlay` (REQ-202607-003, ref_id histórico `CAEL-0716-01`) nunca recibió nombre conceptual para uso en CHECKPOINTs/AC/conversación, solo vocabulario de selectores CSS.
- **E-12 nueva:** tabla de nombres canónicos — "Split View de Sesión" (conjunto), "Panel de Ingesta" (`#ingest-modal-overlay`), "Panel de Revisión" (`#merge-diff-overlay`, reemplaza "Panel DIFF" en conversación). Sin cambio de selectores, sin fusión de DOM — la separación de nodos sigue siendo la decisión vigente documentada en `_Locus-css-ref` mod:79.
- **Resuelto en sesión** — condiciones de resolución directa cumplidas (dueño presente + nivel Patch — vocabulario nuevo sin cambio de comportamiento + sin bifurcación de founder).

## Cambios (mod:21) — patrón "Disponible en: hh:mm:ss" pasa a canónico — segundo uso en `#worker-header`

- **Reaplicado sobre versión más reciente:** este doc llegó a mod:20 (F-01 shortcuts vs búsqueda) por trabajo de otra sesión mientras la entrada original de esta nota (emitida como mod:19 contra una base desactualizada) quedó sin aplicar. Sin conflicto de contenido — temas distintos, ambos se conservan.
- **Patrón de countdown de agotado — un solo lenguaje visual, dos ubicaciones:** el bloque label+value grande ("Disponible en" / hh:mm:ss, JetBrains Mono 700) que ya existía en `.hoy-exh-countdown` (panel Hoy, `buildHoyCard()`) se reutiliza ahora en `#worker-header` vía `.worker-header-unlock` (REQ CAEL-01, ciclo 2026-07-14, `locus-sesiones.css` mod:27 / `locus-sesiones.js` mod:43 — ver CSS-ref `§Worker-header — modificadores de estado`). Con dos usos, el patrón deja de ser ad-hoc de un componente — cualquier tercer sitio que muestre countdown de agotado debe reutilizar este mismo lenguaje tipográfico, no crear uno nuevo.
- **Reemplaza el pill compacto de `#worker-header`:** antes del REQ, el estado `exhausted` mostraba `.worker-header-reset-icon` (pill pequeño con ícono + contador). Criterio de decisión: el pill compacto funciona en contextos de card densa (AI Card, panel Hoy con múltiples workers visibles); en `#worker-header` — un solo worker en foco, tab dedicado — el espacio permite priorizar legibilidad sobre densidad.
- **Resuelto en sesión** — condiciones de resolución directa cumplidas (dueño presente + nivel Patch — documentación de comportamiento ya implementado y avalado por QA, sin cambio de comportamiento + sin bifurcación de founder).

## Cambios (mod:20) — F-01: distinción explícita entre #search-global y panel de Atajos de teclado

- **Origen:** pregunta directa del founder tras el cierre de la tensión de mod:19 — confundía Command Palette (deprecado) con el panel de "Atajos de teclado" del `#more-menu`. Verificado contra código real: son dos componentes sin relación (`#shortcuts-overlay`/`#shortcuts-ref-overlay` vs `#search-unified-results`/`#search-global`).
- **F-01 ampliada:** tabla comparativa propósito/trigger/overlay/contenido — previene que un lector futuro repita la confusión que motivó la corrección de mod:19.
- **Resuelto en sesión** — condiciones de resolución directa cumplidas (dueño presente + nivel Patch — aclaración sin cambio de comportamiento + sin bifurcación de founder).

## Cambios (mod:19) — F-01 corregida: relación #search-global / Command Palette estaba invertida

- **Origen:** consulta retroactiva de Nova sobre REQ CAEL-búsqueda-tipos (Cael no consultó a Nova en Fase 1 — señalado por Finn en sesión de cierre). Nova detectó la tensión sin archivo real adjunto; corregida en cuanto `locus-ui-shell.js` estuvo disponible en sesión.
- **F-01 corregida:** el doc declaraba `#search-global` eliminado y reemplazado por Command Palette (`#cp-input`). Verificado contra código real: es al revés — Command Palette fue la deprecada (`locus-command-palette.js` eliminado del proyecto, mod:48 de `locus-ui-shell.js`). `#search-global` es el campo activo. Tabla de scope actualizada — 5 campos, no 6.
- **F-02 corregida:** conteo de campos con botón de clear ajustado de 6 a 5, en línea con F-01.
- **F-03 nueva:** jerarquía de grupos del panel de resultados (`.sur-group`) y tabla `_TYPE_ICONS` documentadas por primera vez — confirma sin rework las dos decisiones que Cael/Rune tomaron sin consulta de Fase 1 en REQ CAEL-búsqueda-tipos (orden "Ítems primero" y emoji ⚪ para CHG). Aplicado bajo Excepción de resolución directa de `__BR-Core` — dueño presente, corrección nivel Patch (alinea doc con realidad ya implementada, no cambia ningún flujo), sin bifurcación de founder.
- **Resuelto en sesión** — condiciones de resolución directa cumplidas.

## Cambios (mod:18) — REQ CAEL-01 cerrado: worker-header refleja estado — J-01 corregida, gap de documentación cerrado en sesión posterior al cierre del REQ

- **Hallazgo previo a documentar:** el REQ CAEL-01 (TKT1/CAEL-02 · TKT2/CAEL-03) cerró QA y liberó al founder sin que Nova declarara `doc_updates` en ninguno de los CHECKPOINTs del ciclo.
- **J-01 corregida:** la nota "Badges de estado (sc-badge)" describía `.sc-badge--avail` cubriendo `available`/`interrupted` — ya no es correcto. `interrupted` tiene su propio modificador `.sc-badge--interrupted` desde CAEL-01; `insession` usa `.sc-badge--insession`. Mapeo 1:1 con los 4 estados.
- **Estado visual unificado — avatar + acento de header:** además del badge, `available`/`insession`/`interrupted`/`exhausted` ahora también colorean el avatar (`.sc-avatar--*`, anillo pulsante en `available`/`insession`) y el borde/fondo de `#worker-header` (`.worker-header--*`) — mismo vocabulario cromático de A-04, misma lógica de estado que J-01 ya declaraba. Ver CSS-ref `§AI Card rediseño → Worker-header — modificadores de estado`.

## Cambios (mod:17) — Limpieza deuda tracker-col-tabs: E-03 corregida

- **Origen:** TKT2 (limpieza de deuda, sin REQ padre) — `.tracker-col-tabs`/`.tracker-col-tab` retirados de HTML/JS/CSS. Confirmado sin uso: `display:none` fijo sin `@media` que lo reactive, y el guard JS que lo invocaba (`window.innerWidth < 900` → `_trackerSwitchCol('items')`) llamaba a un `col` inexistente.
- **E-03 corregida:** la fila del breakpoint `mobile` ya no lista "col-tabs de tracker" como comportamiento — el patrón no existe en código. El breakpoint interno `≥900px` de `locus-sesiones.css`/`locus-backlog.css` (grid de historial) es un mecanismo distinto y no se ve afectado — se conserva sin cambio.

## Cambios (mod:16) — REQ CAEL-01 cerrado: E-11 nuevo — iconografía del header como SVG propio, sin emoji

- **Hallazgo previo a documentar:** el REQ CAEL-01 (TKT1/CAEL-02 · TKT2/CAEL-03 · TKT3/CAEL-04) cerró QA y liberó al founder sin que Nova declarara `doc_updates` — gap detectado por Cael en diagnóstico de sesión posterior al cierre, no en el cierre mismo.
- **Principio nuevo — E-11:** el header no usa emoji Unicode como ícono — todo ícono de tab, botón o ítem de menú es SVG propio, heredando color del texto que acompaña. Ver detalle abajo.
- **Cross-check con `_Locus-css-ref`:** tokens y convención de implementación viven ahí (`§Patrones de componentes flotantes · Header global`, mod:69). Este doc declara el criterio de experiencia y por qué se descarta emoji — no duplica la tabla de valores CSS.

## Cambios (mod:15) — P4 auditoría header: §E-04 corregida, offset real de --header-h documentado

## Cambios (mod:14) — TKT-202607-022: convención de familias cross-archivo documentada

- **Origen:** `REQ-202607-011` — el patrón de familia de naming que abarca JS + CSS + HTML del mismo componente (`sps-*`, `tvh-notif-*`, `blf-*`/`blt-*`, ya usados en este documento) nunca tuvo la convención de cuándo documentarlo declarada explícitamente. Cada familia se agregaba post-hoc sin regla escrita sobre el momento.
- **`Protocolo de uso` — punto 5 nuevo:** declara que toda familia cross-archivo se documenta en el mismo sprint donde se detecta o introduce — no se pospone. Ver detalle abajo.
- Sin cambio de contenido UX existente — las familias ya documentadas (E-10, I-04, etc.) no se modifican, solo se formaliza la regla que ya venían siguiendo de facto.

---

## Cambios (mod:13) — E-10 nuevo: flip-to-fit para dropdowns dentro de contenedor con overflow:hidden

- **Origen:** `INC-[pendiente-ID]` — menú `···` de sprint en `#sps-programados` se recortaba/ocultaba detrás de `#sps-cerrados` cuando la fila abierta era la última visible dentro de `.sps-card` (`overflow: hidden` del card, no z-index).
- **Nueva sección `### E-10 · Flip-to-fit — dropdown anclado dentro de contenedor con overflow: hidden`** — declara el patrón canónico y por qué se prefiere sobre quitar `overflow: hidden` del contenedor o portar a `position: fixed` en `document.body` (ese segundo enfoque ya vive en `.card-dot-dropdown`/`.bitem-status-popover` para overlays complejos — no es el default para popovers de card).
- **Implementación de referencia:** `.sps-dropdown--flip` en `locus-sprint.css` (mod:44) — ver `_Locus-css-ref §Patrones de componentes flotantes · Sprint activo — familia sps-*`. Medición de espacio (`getBoundingClientRect()`) pendiente de implementar por Rune en `locus-sprint.js` — no incluido en esta sesión, archivo no adjunto.
- **Adopción futura declarada, no ejecutada:** `.blf-wrap`/`.blf-trigger` comparten el mismo riesgo estructural si su contenedor ancestro (`.bl-toolbar`) alguna vez declara `overflow` distinto de `visible` — hoy `.bl-toolbar` declara `overflow: visible` explícito, sin bug activo ahí. Adoptar `--flip` en `.blf-popover`/`.blt-popover` queda declarado como patrón a usar cuando ese componente vuelva a tocarse, no retroactivo sin necesidad detectada.

---

## Cambios (mod:12) — E-09 nuevo: popovers de filtros secundarios en toolbar/stats

- **Nueva sección `### E-09 · Popover de filtros secundarios — patrón .sps-dropdown reutilizado`** — documenta la consolidación de TKT1/TKT2 ([tmp:req-clutter-backlog]) y cierra la observación de Finn en sesión de cierre del REQ sobre coexistencia de ambos popovers.
- **Decisión registrada:** sin exclusividad mutua entre `.blf-popover` y `.blt-popover` — resuelta por Cael en ausencia de Noa en este Project Setup, sin reabrir el REQ.
- **Cross-check con `_Locus-css-ref §Patrones de componentes flotantes`:** tokens y selectores viven ahí (mod:35). Este doc declara el criterio de interacción — no duplica selectores.

---

## Cambios (mod:11) — E-08 nuevo: orden de controles del header de ítem — disclosure triangle primero

- **Gap cerrado:** el patrón de orden de controles de `.bitem-header` (chevron/disclosure triangle + drag-handle + demás controles) no estaba documentado en ningún Doc Ref — ni aquí ni en `_Locus-css-ref` antes de esta sesión. Se detectó al agrandar y reposicionar `.bitem-collapse-arrow` como primer elemento del header (antes: último elemento, después de `.bitem-title-col`).
- **Nueva sección `### E-08 · Orden de controles del header de ítem — disclosure triangle primero` confirmado** — ver detalle abajo.
- **Cross-check con `_Locus-css-ref §Patrones de layout`:** tokens y selectores viven ahí (`§Header de ítem — orden de controles`, mod:34). Este doc declara el criterio de interacción — no duplica tokens.
- **`infra_version`:** sin cambio — Doc Ref, no versiona por infra_version (usa `mod` como señal de frescura).

---

## Cambios (mod:10) — I-04 nuevo: teaser de notificación reemplaza Setup Checklist Banner

- **Gap cerrado:** SCB eliminado (TKT1+TKT2) liberó el slot superior de `#tracker-view-header` en Tab Sesiones. TKT3a/TKT3b lo reemplazaron por un teaser de notificación — patrón no documentado hasta ahora.
- **Nueva sección `### I-04 · Teaser de notificación en tracker-view-header — familia tvh-notif-*` confirmado** — ver detalle abajo.
- **`infra_version`:** sin cambio — Doc Ref, no versiona por infra_version (usa `mod` como señal de frescura).

---

## Cambios v0.5.3 (mod:8) — token --c-severity-high-* implementado, TKT2 sesión 2026-06-30

- **A-04** — fila "high" actualizada: ya no es "sin implementación", declara token dedicado `--c-severity-high-bg/border/text` implementado en `locus-base.css` (ambos temas). Nota de colisión actualizada a estado resuelto — `--c-high-*` sigue siendo exclusivo de status `en-revision`, sin relación con esta severidad.
- DOC-UPDATE aplicado por Cael — origen: CHECKPOINT "Limpieza UI Locus — TKT1–TKT5 entregados" (Rune).
<!-- infra_version: 7 | BR-Core v1.3 · BR-Ecosystem v1.3 · BR-Execution v1.2 · OB-Strategy v1.6 -->

---

## Cambios v0.5.2 (mod:6) — coherencia con BR Gen 2 (infra_version: 5)

- **Encabezado actualizado:** `infra_version: 19` → `5` · versiones BR actualizadas a Gen 2. Nombre del archivo sin versión (patrón Doc Ref correcto per `__OB-Strategy §5`).
- **Selectores `hoy-mini-*`:** Documentados como selectores CSS reales vivos en `locus-sesiones.css` — son naming interno del componente, no terminología BR. Sin cambio de descripción.
- Sin cambios de contenido UX — las reglas y patrones documentados no tienen dependencia de nomenclatura Gen 1.

---

## Cambios v0.5.1 (mod:5) — tensión A-04 resuelta, sesión T-202606-033/034

- **A-04** — fila "high" renombrada de `Naranja` a `Naranja (sin token c-* asociado)`. Detectado por Rune durante implementación de T-202606-034: `_Locus-css-ref` ya usa la familia de tokens `c-high-*` para el status `en-revision` (azul) — colisión de nombre entre nivel de severidad UX y token de status. La severidad "high/naranja" descrita aquí no tiene tokens `c-*` propios — no se ha implementado bajo ese nombre en ningún componente real. Resuelto manteniendo `c-high-*` = `en-revision` (uso real con instancias activas) y aclarando que el nivel de severidad "high" de esta tabla queda sin token semántico dedicado hasta que se implemente un componente que lo requiera.
- Sin cambio de comportamiento visual — ningún componente vivo usaba la severidad "high" de A-04 con un token `c-high-*`. La fila T-202606-033 usó `--red` + `color-mix` (patrón de `context-conflict-banner`), no esta familia.

---

## Cambios v0.5.0 (mod:4) — auditoría contra index.html real + 50 módulos JS + 17 CSS reales, 2026-06-21

- **E-05** corregido — escala real de z-index es 31 tokens, no 30 (ver `_Locus-css-ref`, mismo gap presente ahí hasta esta auditoría).
- **D-06** degradado de `confirmado` a `tensión` — `#theme-toggle-btn` standalone no existe en el DOM real. El punto de entrada funcional hoy es vía `#more-menu` (`_Locus-ui-Inventory` §3 fila 08). Ver detalle en D-06.
- Verificación de tokens A/B/C/G contra los 17 CSS reales — sin discrepancia adicional encontrada.
- Secciones I/J (flujos Tab Sesiones, AI Card) verificadas contra módulos JS reales — sin discrepancia encontrada.

## Propósito

Documento de referencia de experiencia e interfaz del proyecto Locus. Se carga en toda sesión donde Nova interviene sobre Locus — junto al rol transversal `__Role-Nova_UX.md`.

No reemplaza el rol transversal — lo complementa con el conocimiento específico del sistema implementado.

**Audiencia:** Nova (sesión de diseño y especificación) · Rune (consulta cuando CSS-Reference no es suficiente)

---

## Protocolo de uso

Al iniciar sesión sobre Locus, Nova:

1. Carga este documento junto al rol base y `_Locus-css-ref-v*.md`.
2. Verifica que las reglas aquí declaradas no contradigan un R activo — si hay conflicto, señalarlo antes de actuar.
3. Referencia el código de regla (ej: `A-03`) en sus entregables cuando aplica una decisión de diseño.
4. Propone actualización de este documento al cerrar sprint donde intervino — nuevos patrones, reglas que cambian.
5. **Convención de familias cross-archivo:** toda familia de naming que abarca más de un archivo real del mismo componente (ej. `sps-*` en `locus-sprint.js` + `locus-sprint.css`, `tvh-notif-*`, `blf-*`/`blt-*`) se documenta aquí en el mismo sprint donde se detecta o introduce — nunca se pospone a un sprint posterior. La entrada declara: nombre de la familia, archivos que la componen, y el criterio de uso o interacción. No duplica selectores ni tokens — esos viven en `_Locus-css-ref`, referenciados desde aquí (ver A-01 y patrón ya usado en E-08, E-09, E-10, I-04).

---

## A — Tokens y tema

### A-01 · Toda variable de color vive en `:root[data-theme]` — nunca hardcodeada `confirmado`

Los dos temas (dark/light) están completamente declarados en `locus-base.css`. Ningún componente usa colores hex directos — siempre consume tokens semánticos.

**Regla:** Cualquier color nuevo que Nova introduzca debe declararse primero en `:root[data-theme="dark"]` y `:root[data-theme="light"]` antes de usarse en un componente.

---

### A-02 · Tema aplicado antes del primer paint — sin flash `confirmado`

Script inline en `<head>` lee `localStorage` y aplica `data-theme` en `<html>` antes de renderizar. El CSS usa `:root[data-theme]` — no `body` ni `.dark-mode`.

**Regla:** Nova no introduce selectores de tema que dependan de `body` o clases en `body`. Solo `:root[data-theme]`.

---

### A-03 · Acento único: verde lima como color de acción e identidad `confirmado`

El accent se usa para: foco visible, tab activo (underline), breadcrumb hover, bordes de acción primaria, indicadores de estado positivo.

| Tema | Valor | Hover |
|---|---|---|
| Dark | `#a6e22e` (`--accent`) | `#b8f03a` (`--accent-hover`) |
| Light | `#6db821` (`--accent`) | `#7ec828` (`--accent-hover`) |

**Regla:** No se introduce un segundo color de acción. El accent no se mezcla con colores de severidad para acciones primarias.

---

### A-04 · Severidad codificada en 7 niveles de tokens semánticos `confirmado`

| Nivel | Color | Uso | Token `c-*` dedicado |
|---|---|---|---|
| `critical` | Rojo | Errores bloqueantes, acciones destructivas | No — usar `--red` directo o `--c-critical-border` (`.sps-card--hotfix`) |
| `high` | Naranja | Warnings con impacto | **Sí** — `--c-severity-high-*` (sesión 2026-06-30, TKT2). Ver nota de colisión abajo |
| `medium` | Amber | Atención sin bloqueo | No — `--amber` directo (`--c-medium-*` no existe, ver `_Locus-css-ref`) |
| `pulido` | Azul | Información complementaria | No — `--blue` directo |
| `low` | Verde | Éxito, confirmación | No — `--green` directo |
| `won` | Gris medio | Estados inactivos | Sí — `--c-won-*` (mapeado a status `descartado`/agotado) |
| `done` | Gris oscuro | Estados completados | Sí — `--c-done-*` (mapeado a status `done`) |

**Nota de colisión (mod:8) — resuelta:** La familia de tokens `--c-high-bg/text/border` existe en `locus-base.css` pero está atada al **status de ítem** `en-revision` — no a este nivel de severidad UX "high/naranja". Son dos taxonomías distintas que comparten el nombre "high" por coincidencia. Para severidad "high/naranja" se implementó el token dedicado `--c-severity-high-bg/border/text` en `locus-base.css` (sesión 2026-06-30, TKT2) — declarado en ambos temas (`dark`/`light`), base `--orange`. No usar `--c-high-*` para este nivel de severidad.

Cada nivel de status (`won`, `done`, y los de la familia `c-*` documentada en `_Locus-css-ref §Tokens semánticos de status`) tiene tres tokens: `--c-[nivel]-bg` / `--c-[nivel]-border` / `--c-[nivel]-text`. Los niveles de severidad UX (`critical`, `high`, `medium`, `pulido`, `low`) consumen los tokens de color base (`--red`, `--orange`, `--amber`, `--blue`, `--green`) directamente — no tienen familia `c-*` propia salvo que se implemente un componente que la requiera.

Tokens `--purple` / `--purple-dim` / `--purple-border` — exclusivos de estado `insession`. No son nivel de severidad.

**Regla:** Nova no usa colores de severidad para otros fines. El purple es exclusivo de estado insession. Antes de introducir un token `c-[nivel]-*` nuevo, verificar contra `_Locus-css-ref §Tokens semánticos de status` que el nombre no colisiona con un status de ítem ya mapeado.

---

### A-05 · Escala tipográfica de 15 pasos — sin valores libres `confirmado`

| Token | Valor | Uso |
|---|---|---|
| `--text-3xs` | 8px | Badge ultra-compacto |
| `--text-2xs` | 9px | Labels de metadatos compactos |
| `--text-2xs-plus` | 10px | Componentes compactos en modales |
| `--text-xs` | 11px | Labels secundarios, breadcrumb |
| `--text-sm` | 12px | Texto UI estándar compacto |
| `--text-base` | 13px | Tamaño base del documento |
| `--text-md` | 14px | Texto UI estándar |
| `--text-lg` | 16px | Títulos de sección compactos |
| `--text-xl` | 18px | Subtítulos |
| `--text-2xl` | 22px | Títulos principales |
| `--text-display-sm` | 17px | Heading de sección compacto |
| `--text-display-md` | 26px | Stat numbers |
| `--text-display-lg` | 28px | Stat values prominentes |
| `--text-display-xl` | 32px | Stat / ícono grande |
| `--text-display-2xl` | 40px | Empty state icons |

**Regla:** Nova usa exclusivamente los tokens de la escala. Si ninguno encaja — proponer nuevo token antes de hardcodear.

---

### A-06 · Tokens de texto sobre fondos de color — T-202605-033 `confirmado`

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--text-on-accent` | `#000` | `#000` | Texto sobre `var(--accent)` lime-green — contraste ~8:1 |
| `--text-on-danger` | `#fff` | `#fff` | Texto sobre `var(--red)` y fondos destructivos |

**Regla:** Nunca usar `#000` o `#fff` directamente sobre fondos de color. Usar estos tokens — si el valor del accent o del red cambia en el futuro, el contraste se corrige en un solo lugar.

---

### A-07 · Colores de tag extendidos — T-202605-033 `confirmado`

| Token | Dark | Light | Clase de tag |
|---|---|---|---|
| `--pink` | `#f472b6` | `#d6509e` | `.tc-5` |
| `--lime` | `#a3e635` | `#6a9e1a` | `.tc-6` |
| `--orange` | `#fb923c` | `#d4691a` | `.tc-7` |

**Excepción documentada — `tag-color-fixed`:** Los `border-color` de `.tc-0` a `.tc-7` en `locus-modals.css` son paleta fija de instancia de componente. No varían por tema. No se tokenizan. Identificados con comentario `/* tag-color-fixed */` inline. No replicar este patrón fuera del componente de tags sin aprobación de Nova.

---

### A-08 · 4 niveles canónicos de jerarquía de texto — sin `h1`-`h6`, jerarquía por clase `confirmado`

Locus no declara ningún selector `h1`-`h6` nativo — es una decisión de arquitectura válida para una SPA sin semántica de documento, pero exige que la jerarquía visual tenga un criterio único de asignación por clase. Antes de A-08 no existía ese criterio — la escala de 15 tokens (A-05) estaba completa, pero el mapeo "qué token usa cada rol de título" se decidía caso por caso, generando deriva (~140 selectores `*-title`/`*-header` sin regla común, ver auditoría de mod:24).

| Nivel | Rol | Tamaño | Peso | `letter-spacing` | `text-transform` | Ejemplo canónico |
|---|---|---|---|---|---|---|
| **1 — Tab title** | Título único del tab activo — máximo un elemento visible a la vez en toda la app | `--text-2xl` (22px) | 600 | `-0.01em` | ninguno | `.worker-header .sc-project` |
| **2 — Modal-section title** | Título de modal completo o de sección mayor dentro de un panel | `--text-lg` (16px) | 600 | ninguno | ninguno | `.sprint-close-title`, `.spt-context-header` |
| **3 — Card title** | Título de card individual, fila expandible o modal secundario/confirmación | `--text-md` (14px) | 600 | ninguno | ninguno | `.modal-title`, `.empty-state-title` |
| **4 — Eyebrow label** | Etiqueta uppercase que encabeza un bloque o sección — no compite con el dato que introduce | `--text-xs` (11px) | 600 | `0.06em` | `uppercase` | `.qdisc-status-title`, `.proj-view-title` |

**Regla de asignación — todo TKT nuevo que declare un título:**
1. ¿Es el único título del tab activo? → Nivel 1. En la práctica, esto no debería volver a ocurrir — el nivel 1 ya está resuelto por `.worker-header .sc-project` y no se espera un segundo caso.
2. ¿Encabeza un modal completo o una sección con peso propio dentro de un panel? → Nivel 2.
3. ¿Es el título de una card, fila o modal secundario? → Nivel 3.
4. ¿Es una etiqueta que antecede a un dato o agrupa una sección sin ser el foco visual? → Nivel 4.

Un TKT que introduce un "título" que no encaja limpiamente en ninguno de los 4 — señalar a Nova antes de asignar un tamaño por intuición. No crear un quinto nivel sin justificar por qué los 4 existentes no cubren el caso.

**Excepción documentada — jerarquía invertida deliberada (dato > etiqueta):** Cuando un bloque combina un Nivel 4 (eyebrow) con el dato que introduce, el dato puede exceder el tamaño del eyebrow — el dato es el foco visual, la etiqueta es contexto. Caso vigente: `.sph-title` (Nivel 4, 11px/600/uppercase, "Salud del sprint") junto a `.sph-pct` (`--text-lg` 16px/600, el porcentaje) — el dato lidera, la etiqueta lo enmarca. No es una violación de A-08, es el patrón correcto para label+valor destacado.

**Deuda de consolidación — no migrada en mod:24:** De los ~140 selectores `*-title`/`*-header` existentes, solo se corrigieron en esta sesión las 2 colisiones de selector-base y la unificación de `letter-spacing` del eyebrow (ver `_Locus-css-ref` mod:82 para el detalle completo por selector). El resto conserva su valor actual — no se migró a los 4 niveles retroactivamente. Regla de aplicación hacia adelante: todo TKT que **toque** un selector de título existente en el curso de otro trabajo lo alinea al nivel canónico correspondiente como parte de ese TKT — sin abrir un TKT de migración masiva dedicado. Consolidación oportunista, no proyecto propio.

**Regla:** Nova asigna nivel antes de asignar token — el nivel determina el token, nunca al revés. Un tamaño elegido por "se ve bien aquí" sin pasar por la tabla de A-08 es la misma deriva que esta sección corrige.

---

## B — Elevación y superficie

### B-01 · Jerarquía de 4 superficies `confirmado`

| Token | Rol |
|---|---|
| `--bg` | Fondo base de la aplicación |
| `--surface` | Cards principales, modales, panels |
| `--surface2` | Sub-elementos, toolbars, inputs, tabs container |
| `--surface3` | Dropdowns, hover states, estados activos elevados |

Aliases activos: `--bg2`, `--card-bg` → `--surface`, `--surface-2` → `--surface2`. Usar siempre el canónico en componentes nuevos.

---

### B-02 · Sombras solo en cards y modales — nunca decorativas `confirmado`

Dos estados: reposo (`--card-shadow`) y hover/elevado (`--card-shadow-hover`).

**Regla:** Nova no introduce sombras fuera de estos dos tokens. Si un componente necesita parecer elevado, sube en la escala de superficies (B-01) antes de agregar sombra.

---

### B-03 · Radios semánticos por nivel de componente `confirmado`

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | 4px | Badges, pills internas, indicadores |
| `--radius-xs` | 6px | Tooltips, variante intermedia |
| `--radius-md` | 8px | Botones, inputs, tooltips |
| `--radius-md-plus` | 10px | Cards secundarias, secciones |
| `--radius-lg` | 12px | Cards, panels secundarios |
| `--radius-lg-plus` | 14px | Popups, modales compactos |
| `--radius-xl` | 16px | Cards principales, modales |
| `--radius-2xl` | 20px | Modales y superficies grandes |
| `--radius-pill` | 999px | Chips de estado, tags |

**Excepciones documentadas:** `border-radius: 0` (indicadores de barra), `border-radius: 2px` (barras de progreso micro), `border-radius: 50%` (avatares circulares). No crear tokens para estos casos.

---

## C — Movimiento y transiciones

### C-01 · 6 curvas de easing declaradas `confirmado`

| Token | Curva | Uso |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Salidas naturales, la mayoría de transiciones |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Transiciones simétricas |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Acciones positivas, confirmaciones |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Material-style, fade panels |
| `--ease-decel` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entradas de contenido |
| `--ease-spring` | `cubic-bezier(0.34, 1.4, 0.64, 1)` | Modales, elementos con rebote sutil |

**Tensión activa:** Algunos componentes usan `ease` o `ease-out` literal — migrar a `var(--ease-out)` al tocar el componente.

**Regla:** Nova usa exclusivamente los 6 tokens. Si ninguno encaja — proponer nuevo token antes de hardcodear.

---

### C-02 · Escala de velocidades: 5 tokens `confirmado`

| Token | Duración | Uso |
|---|---|---|
| `--trans-fast` | `all 0.12s var(--ease-out)` | Micro-interacciones, hover, color |
| `--trans-medium` | `all 0.20s var(--ease-out)` | Transiciones de estado, expansión |
| `--trans-slow` | `all 0.32s var(--ease-out)` | Entradas de panel, reveals |
| `--trans-color` | `color/bg/border/opacity 0.15s var(--ease-out)` | Transición selectiva de color |
| `--transition-base` | `150ms ease` | Microinteracciones de componentes migrados |

Patrón de salida: la salida de un elemento es siempre más rápida que su entrada. Excepción documentada: 600ms solo para splash/pantalla completa.

---

### C-03 · `prefers-reduced-motion` — cobertura completa `confirmado`

Todo componente nuevo con animación incluye su bloque `@media (prefers-reduced-motion: reduce)` que la desactiva o reduce a `opacity` sin `transform`.

---

## D — Interactividad y estados

### D-01 · 4 estados obligatorios en elementos interactivos `confirmado`

| Estado | Implementación |
|---|---|
| Normal | Estilo base |
| Hover | `background` o `color` con `--trans-fast` |
| Active | `transform: scale(0.93–0.97)` |
| Focus-visible | `outline: 2px solid var(--accent); outline-offset: 2px` |

Focus-visible global declarado en `locus-layout.css`. Componentes que lo necesiten diferente lo sobreescriben.

**Tensión activa:** Componentes secundarios (ítems del menú ⋯, algunas labels clickeables) solo tienen hover.

---

### D-02 · Foco visible nunca suprimido `confirmado`

El sistema no usa `outline: none` global. Se usa `:focus-visible` — nunca `:focus` a secas.

---

### D-03 · Acciones destructivas: doble confirmación inline — no modal nuevo `confirmado`

Las acciones irreversibles usan confirmación inline dentro del mismo contenedor. La zona de peligro requiere un toggle previo para revelar los botones destructivos. Para acciones de mayor alcance (reset completo): overlay con campo de texto `RESET`.

**Distinción de alcance — agregado 2026-07-15, tras confusión de referencia en REQ CAEL-01/TKT2:** D-03 aplica exclusivamente a acciones destructivas irreversibles con flujo de dos pasos (toggle previo + confirmar). Para confirmación simple de un paso sobre acciones reversibles o no destructivas — ej. "Restaurar defaults" de un panel de configuración — usar el patrón `.item-inline-confirm` (`_Locus-css-ref`, contenedor + `__accept`/`__cancel`, visibilidad vía `.is-visible`). No citar D-03 para ese caso — son patrones distintos con distinto nivel de fricción intencional.

---

### D-04 · Estado deshabilitado: 3 propiedades obligatorias `confirmado`

```css
opacity: 0.35;
cursor: not-allowed;
pointer-events: none;
```

El atributo HTML `disabled` es complementario — no reemplaza la clase CSS.

---

### D-05 · Feedback de copia: el objeto copiado cambia de estado — no toast `confirmado`

El elemento copiado cambia visualmente con `.code-badge--copied` (fondo verde, texto invertido). El toast se reserva para operaciones de mayor peso.

---

### D-06 · Theme toggle — `#theme-toggle-btn` `tensión`

**Estado revisado v0.5.0:** Degradado de `confirmado` a `tensión`. `#theme-toggle-btn` no existe en `index.html` real. `main.js` / `locus-ui-shell.js` referencian el ID citando T-202606-006 como `done` — el botón standalone quedó inerte (guard `if(el)` evita crash, no restaura la feature). El patrón descrito abajo es el diseño original, no el estado implementado hoy.

**Punto de entrada funcional real:** Toggle de tema dentro de `#more-menu` (`more-menu + applyTheme()`) — ver `_Locus-ui-Inventory` §3 fila 08. Sin entrada duplicada — T-202605-021 resolvió esa duplicación dentro del menú ⋯.

Diseño original (no implementado en el DOM actual):

| Selector | Rol |
|---|---|
| `.theme-toggle-btn` | Botón contenedor — 4 estados: normal, hover, active, focus-visible |
| `.theme-icon-dark` | Ícono SVG inline — visible en tema light |
| `.theme-icon-light` | Ícono SVG inline — visible en tema dark |

**Patrón de visibilidad (diseño original):** Los dos íconos coexisten en el DOM. `applyTheme()` alterna su visibilidad via `aria-label` dinámico y clases. No se genera ni destruye el botón — siempre presente en header.

**Decisión pendiente del founder/Cael:** (a) restaurar `#theme-toggle-btn` en el header y mantener dos puntos de entrada, o (b) deprecar formalmente el patrón standalone y declarar `#more-menu` como único punto de entrada canónico. Hasta esa decisión, Nova no diseña nuevas referencias a `#theme-toggle-btn` como vía funcional.

**Regla (vigente hasta resolución):** Nova no introduce un tercer control de tema. Los dos candidatos a único punto de entrada canónico son `#theme-toggle-btn` (no operativo hoy) y `#more-menu` (operativo).

---

## E — Layout y estructura

### E-01 · Estructura estática en HTML — contenido dinámico en JS `confirmado`

Todos los modales, sidebars y panels viven en el DOM como shells vacíos. JS inyecta solo el contenido variable. La visibilidad se controla con clases — nunca con `display` inline.

---

### E-02 · Un punto de verdad por estructura `confirmado`

Gap DUP-06 cerrado — `item.desc` migrado a `item.title` (R-202605-007 done).

**Regla:** Nova no agrega nuevas instancias duplicadas. Al intervenir en estructuras existentes, verificar que no haya shells huérfanos.

---

### E-03 · Breakpoints del sistema `confirmado`

| Breakpoint | Valor | Comportamiento |
|---|---|---|
| mobile | ≤600px | Breadcrumb reducido, sprint-row oculta |
| tablet | 601–1024px | Radar sidebar colapsado por defecto |
| desktop | ≥1025px | Layout completo |
| ultrawide | ≥2560px | Contenedores con max-width (`var(--bp-ultrawide)`) |

**Breakpoint interno — `≥900px`:** Usado en `locus-sesiones.css` y `locus-backlog.css` para historial en grid cuando el viewport lo permite. No es un breakpoint de layout general — es un ajuste de densidad de contenido en tabs específicos.

Locus es desktop-only (1920×1080 · 2560×1080). Los breakpoints menores existen pero no son viewport objetivo.

---

### E-04 · Header height como token — nunca hardcodeada `confirmado`

`--header-h` (`locus-base.css`) mide exclusivamente `.header-inner` — **no** el offset total del `<header>`. El `<header>` agrega `padding: 1.1rem 1.25rem 0.85rem` + `border-bottom: 1px` por fuera de `.header-inner` (`locus-layout.css` L553-558).

**Offset real para `calc(100vh - ...)`:** `var(--header-h) + 1.95rem + 1px` (1.1rem + 0.85rem de padding vertical del `<header>` + 1px de border). Root font-size del proyecto es `13px` (`--text-base`, ver `_Locus-css-ref §Escala tipográfica`) — a ese tamaño, 1.95rem equivale a ~25.35px, no a los ~31px que asumía la auditoría original (calculados sobre un root de 16px incorrecto).

Fuente única del offset: `.tab-panel.active:not(#tab-tracker)` y `#tab-tracker.active` (`locus-layout.css`, ver `E-07` abajo). No duplicar este cálculo en otros selectores — consumir la misma fórmula si un tab nuevo necesita el offset.

---

### E-05 · Z-index en escala declarada de 31 tokens `confirmado`

**Regla:** Nova usa exclusivamente los tokens. Si hay conflicto de z-index — reportarlo como B antes de introducir un valor nuevo. Valores canónicos en `_Locus-css-ref`.

---

### E-06 · Drawer lateral de consulta rápida — patrón `.pend-overlay` `confirmado`

Patrón canónico para drawers laterales. No bloquea el flujo principal.

| Selector | Rol |
|---|---|
| `.pend-overlay` | Overlay base — visibilidad controlada por `.open` |
| `.pend-panel` | Contenedor del drawer — `max-width: 360px` |
| `.pend-panel-header` | Cabecera fija |
| `.pend-panel-body` | Cuerpo scrolleable |

Convenciones: visibilidad via `.open`. `z-index: var(--z-panel)` (1100). Overlay: `rgb(0 0 0 / 40%)`. Sin animación de entrada.

---

### E-07 · Tab scroll containment — cada tab en su propio contexto `confirmado`

```css
.tab-panel.active:not(#tab-tracker) {
  height: calc(100vh - var(--header-h) - 1.95rem - 1px);
  overflow: hidden auto;
}
```

`#tab-tracker` tiene su propio scroll management. Evita que el scroll de un tab persista al cambiar.

---

### E-08 · Orden de controles del header de ítem — disclosure triangle primero `confirmado`

El disclosure triangle (`.bitem-collapse-arrow`) es siempre el primer control visual de `.bitem-header`, antes del drag-handle y de cualquier otro control de acción rápida.

**Criterio:** el chevron anticipa el contenido — se lee antes de decidir si expandir, no después. Va primero por convención de disclosure triangle, independiente de qué otros controles condicionales existan para ese tipo de ítem.

**No hay conflicto de target entre chevron y drag-handle:** `.item-drag-handle` solo existe cuando `item.sprint` está declarado — nunca aparece en DISC (zona fija `Q-DISC`, sin sprint en el schema). En REQ/TKT/INC con sprint asignado, ambos controles conviven porque cada uno resuelve su acción con `stopPropagation()` propio en el handler — la posición relativa en el DOM no crea ambigüedad de intención de click.

**Tokens y selectores:** ver `_Locus-css-ref §Patrones de layout · Header de ítem — orden de controles`. Este doc no duplica los valores — declara el criterio de UX que los justifica.

---

### E-09 · Popover de filtros secundarios — patrón `.sps-dropdown` reutilizado `confirmado`

Los controles secundarios de la toolbar del Backlog (Deps/Hijos/Sin AC/Orden/Colapsar) y los chips de tipo de la stats bar viven detrás de dos triggers independientes — "Filtros ▾" y "Tipos ▾" — cada uno con badge de conteo. Adaptación directa del patrón ya validado de menú de acciones del sprint activo (`.sps-menu-wrap`/`.sps-btn-menu`/`.sps-dropdown`) — no se introdujo un mecanismo de popover nuevo.

**Criterio:** ningún filtro existente se elimina — solo se reubica detrás de un trigger cuando su uso es secundario frente a los filtros de status/prioridad que permanecen inline. El badge comunica cuántos filtros secundarios están activos sin necesidad de abrir el popover.

**Decisión — sin exclusividad mutua entre popovers:** "Filtros ▾" y "Tipos ▾" pueden estar abiertos simultáneamente. El criterio de coherencia es que abrir uno no cierre ni resetee el estado del otro — no que sean mutuamente excluyentes. Ambos ocupan regiones separadas de la toolbar y la stats bar respectivamente, sin superposición visual, así que forzar cierre mutuo no resuelve un problema real de UX. Decisión tomada por Cael al cierre de `[tmp:req-clutter-backlog]`, en ausencia de Noa en este Project Setup — no reabre el REQ.

**Cierre automático:** cada popover se cierra por Escape (cascada, prioridad más superficial que overlays de modal), click fuera, y cambio de sub-tab. El foco vuelve al trigger correspondiente al cerrar — nunca se pierde en el documento.

**Tokens y selectores:** ver `_Locus-css-ref §Patrones de componentes flotantes · Popovers de toolbar/stats — familia .blf-* / .blt-*` (mod:35). Este doc no duplica selectores — declara el criterio de interacción y la decisión de producto que los justifica.

---

### E-10 · Flip-to-fit — dropdown anclado dentro de contenedor con `overflow: hidden` `confirmado`

Todo dropdown/popover del patrón `.sps-menu-wrap`/`.sps-dropdown` (y sus adaptaciones `.blf-*`/`.blt-*`) vive dentro de un contenedor que puede declarar `overflow: hidden` por razón ajena al menú — típicamente el `border-radius` de una card. Un dropdown anclado con `top` fijo se recorta o queda visualmente detrás del contenedor siguiente cuando la fila que lo abre está cerca del borde inferior del contenedor — **no es un problema de `z-index`**; ningún ajuste de capa resuelve un clipping por `overflow`.

**Origen:** `INC-[pendiente-ID]` — menú `···` de sprint en `#sps-programados` quedaba detrás de `#sps-cerrados` cuando la fila abierta era la última visible dentro de `.sps-card`.

**Criterio — flip-to-fit sobre las otras dos alternativas evaluadas:**

| Alternativa | Por qué se descarta como default |
|---|---|
| Quitar `overflow: hidden` del contenedor | Ese `overflow` sostiene el `border-radius` del card — quitarlo regresiona la estética de todos los cards del sistema para resolver un caso de un solo componente hijo |
| Portal a `document.body` con `position: fixed` calculado por JS | Resuelve el clipping de raíz pero introduce una clase de problema permanente (reposicionar en scroll/resize mientras está abierto). Es el patrón correcto para popovers en overlays complejos — ya adoptado en `.card-dot-dropdown` (AI Card, `locus-sesiones-card.css`) y en `.bitem-status-popover` — no para un popover simple de card. Adoptarlo aquí por default es sobre-ingeniería para el tamaño del problema, y se aleja de "sin frameworks, sin build step" |

**Mecanismo:** al abrir el dropdown, medir con `getBoundingClientRect()` el espacio disponible entre el botón trigger y el borde inferior del contenedor con `overflow: hidden` (no el viewport — el clipping es del contenedor, no de la pantalla). Si el espacio es menor que la altura del dropdown, aplicar el modificador `--flip` en vez de recalcular estilos inline — el modificador solo invierte el anclaje vertical (`top` → `bottom`), nunca introduce `style=` inline (ver `§H — CSS purity`).

**Implementación de referencia:** `.sps-dropdown--flip` (`locus-sprint.css`) — ver `_Locus-css-ref §Patrones de componentes flotantes · Sprint activo — familia sps-*`. La lógica de medición vive en `locus-sprint.js` como función compartida, no duplicada por módulo — declarada como pendiente de adopción por `.blf-wrap`/`.blf-trigger` cuando ese componente vuelva a tocarse (no retroactivo sin necesidad detectada).

**Regla para todo dropdown nuevo del patrón `.sps-dropdown`:** si el contenedor ancestro declara o puede llegar a declarar `overflow: hidden`, el componente nace con su modificador `--flip` disponible — no se descubre como bug después de reportado por el founder.

---

### E-11 · Iconografía del header — SVG propio, nunca emoji `confirmado`

El header (tabs, `#header-pend-btn`, ítems de `#more-menu`) no usa emoji Unicode como ícono. Todo ícono es SVG propio de 18×18, `stroke="currentColor"` — hereda el color del texto que acompaña (tab activo/inactivo, ítem de menú) en vez de portar su propia paleta.

**Por qué:** un emoji renderiza distinto entre plataformas/fuentes del sistema operativo — rompe la consistencia visual dark/light que el resto del sistema ya garantiza vía tokens. Un SVG con `currentColor` hereda el mismo token de texto ya validado WCAG AA, sin introducir una superficie de inconsistencia nueva.

**Excepción:** `#mm-btn-sync` conserva su `.sync-status-dot` — es un indicador de estado (activo/inactivo), no un ícono de identidad de acción, y no se beneficia del mismo criterio.

**Origen:** REQ CAEL-01 — reemplazo de 18 emojis del bloque header (6 tabs + `#header-pend-btn` + 11 ítems de `#more-menu`).

**Tokens y selectores:** ver `_Locus-css-ref §Patrones de componentes flotantes · Header global — familia .header-zone-*` (mod:69). Este doc no duplica la tabla de valores — declara el criterio de experiencia.

---

### E-12 · Split View de Sesión — nombre canónico del conjunto ingest+revisión `confirmado`

Nombre conceptual para uso en CHECKPOINTs, AC y conversación con el founder — no reemplaza selectores de código, que siguen siendo `.modal-split*`/`.mdiff-overlay*` (ver `_Locus-css-ref` mod:79). Sin fusión de DOM: dos nodos coordinados por CSS contra las mismas custom properties (`--split-total-w/-h/-gap/-header-h`), decisión de diseño vigente para no acoplar el DOM de `#merge-diff-overlay` a `#ingest-modal-overlay` — preserva su reutilización fuera del split si algún flujo futuro lo requiere.

| Elemento | Nombre canónico | Selector real |
|---|---|---|
| Conjunto | **Split View de Sesión** | — (coordinación CSS, sin nodo propio) |
| Columna izquierda | **Panel de Ingesta** | `#ingest-modal-overlay` (`.modal-split`) |
| Columna derecha | **Panel de Revisión** | `#merge-diff-overlay` (`.mdiff-overlay--docked`) |

**Por qué "Panel de Revisión" y no "Panel DIFF":** "DIFF" es vocabulario de implementación — el founder no compara diffs, revisa qué se va a aplicar antes de confirmar. El nombre describe la función, no el mecanismo interno.

**Origen:** REQ-202607-003 (ref_id histórico `CAEL-0716-01`) construyó el conjunto; el nombre se formaliza después, a pedido del founder, sin cambio de implementación.

---

### E-13 · Header de card como trigger completo de apertura del IDP en Q-INC `confirmado`

`.qinc-item-header` abre el IDP al completo (`openItemPanel(code)`) igual que `.bitem-header` en Scrum — a diferencia de E-08, no hay un chevron dedicado: el header entero es el trigger. Click en cualquier punto del header, salvo los dos controles que ya vivían anidados ahí (`copy-code` y el toggle de `comportamiento_actual`), abre el panel. Ambos controles evalúan y hacen `return` antes que `qi-open-panel` — mismo orden de precedencia que ya usa `.bitem-header` entre sus propios controles internos.

**Criterio:** Q-INC no tiene chevron de disclosure porque la card no se expande in-place — el IDP es la única superficie de detalle para INC/PRB/KE/CHG (sin drawer de sub-tareas ni jerarquía visual que un chevron tendría que anticipar). El header completo como target es la superficie más grande sin invadir los dos controles de acción rápida ya existentes — no una desviación del criterio de E-08, sino su equivalente cuando no hay chevron que priorizar.

**Accesibilidad:** `role="button" tabindex="0"` sobre `.qinc-item-header` (mismo patrón que `.bitem-header` y los 6 `idp-dep-chip`, ver `_Locus-module-contracts` hallazgo de la auditoría de render) + `:focus-visible` con `var(--accent)`, mismo token que el resto del archivo. Enter/Espacio con foco disparan el mismo `click()` delegado — sin handler de teclado separado del de mouse.

**Gap de proceso declarado:** esta decisión se tomó directamente sobre el diff de código (founder: "vamos con opcion A pure"), sin borrador visual previo de Nova ni consulta de Fase 1 — `design_intent: n/a` en el REQ/TKT que la origina. Registrado explícitamente para no repetirse en silencio — no es el flujo estándar de introducción de un patrón nuevo de E.

**Tokens y selectores:** ver `_Locus-css-ref` — mismo archivo/sección que documenta `.qinc-item-header` y `:focus-visible` de Q-INC. Este doc no duplica selectores — declara el criterio de UX.

---

### E-14 · Panel DIFF — tarjetas atribuidas de batch, bloque `finn_release` y bloques informativos condicionales `confirmado`

**Tarjetas atribuidas (TKT3, REQ CAEL-0718-01):** Cuando el panel DIFF resuelve un batch de 2+ CHECKPOINTs pegados juntos, cada bloque de narrativa se presenta como tarjeta atribuida — rol/título del CHECKPOINT de origen visible como primera fila, truncado a 1 línea. Con 0-1 CHECKPOINT en el batch, ninguna atribución se muestra — el bloque de narrativa se ve idéntico al flujo de sesión única (E-12), sin caja adicional ni cambio de ancho. La atribución solo existe para distinguir entre sesiones cuando hay más de una en el mismo pegado; con una sola, distinguir no aporta nada y el patrón por defecto (sin atribución) es el correcto.

**Badge "liberado":** Cuando el CHECKPOINT de origen de una tarjeta atribuida incluye `finn_release`, la tarjeta muestra el mismo badge visual que el bloque `finn_release` de sesión única (ver abajo) — reuso, no un badge nuevo por contexto de batch.

**Bloque `finn_release` (TKT2, TKT7):** Se inserta antes del bloque de narrativa de la sesión, no después — el resultado liberado precede a la crónica de cómo se llegó a él, mismo criterio jerárquico que ya separa "qué se entrega" de "cómo fue la sesión" en el resto del panel. Ausencia total sin hueco visual cuando el CHECKPOINT no declara `finn_release` — no hay placeholder ni caja vacía, el layout se contrae exactamente como si la sección no existiera en el DOM.

**Docs pendientes (dentro de `finn_release`):** Mismo criterio de ausencia total — sin `docs_pendientes` declarado o con array vacío, la sub-sección completa (etiqueta + lista) no se renderiza, no queda etiqueta huérfana sobre una lista vacía.

**Observaciones de Finn (TKT6/TKT7):** Bloque separado del de `finn_release` — aparece solo cuando el CHECKPOINT trae `finn_observations` no vacío. Severidad por fila individual, no por el wrapper completo: una regresión se marca en rojo, una observación/gap de contrato en ámbar, dentro del mismo wrapper neutral — evita que un bloque mixto (una fila de regresión + una de observación) se lea como "todo crítico" cuando solo una fila lo es. Mismo criterio de ausencia total que `finn_release`: sin `finn_observations`, el bloque no existe en el DOM, no hay contenedor vacío.

**Criterio general de esta entrada:** los tres bloques (tarjeta atribuida, `finn_release`, `finn_observations`) comparten la misma regla de renderizado condicional — la ausencia de dato no genera hueco visual, caja vacía, ni etiqueta sin contenido. Un panel DIFF de una sesión simple sin liberación ni observaciones se ve exactamente como el patrón ya confirmado en E-12, sin rastro de las secciones que no aplicaron.

**Tokens y selectores:** ver `_Locus-css-ref §Cambios (mod:63/64/94)` — este doc no duplica selectores, declara el criterio de cuándo aparece cada bloque y por qué.

---

### E-16 · Shell persistente — el contenedor nunca se oculta, solo el cuerpo alterna `confirmado`

**Origen:** TKT2/TKT3 (REQ CAEL-0720-05) — `#qinc-toolbar` y `#qinc-stats-bar` se movieron de generación dinámica (ocultos/ausentes con 0 ítems) a siblings estáticos de `#qinc-panel-body` en `index.html`. Antes: con 0 incidentes activos, la barra de acciones y los chips de stats desaparecían junto con la lista — el usuario perdía acceso a "Exportar incidents.md" justo cuando más podía necesitarlo (proyecto recién limpio de incidentes).

**Criterio:** Cuando un panel tiene una zona de acciones/resumen (toolbar, stats-bar) y una zona de contenido variable (lista de ítems), solo la zona de contenido alterna entre sus estados — lista poblada o empty-state, nunca ambos, nunca ninguno. La zona de acciones/resumen es shell: existe siempre, independiente de si hay 0 o N ítems. Los chips de conteo muestran `0` en vez de ocultarse — un chip en 0 sigue siendo información (confirma que el filtro funciona, no que la UI está rota).

**Cuándo aplica:** (a) el panel tiene una barra de acciones/resumen separable del contenido variable, (b) esa barra ofrece una acción con valor incluso sin ítems (exportar, crear, filtrar) o un dato que sigue siendo informativo en 0 (conteos). Si la barra no tiene valor sin ítems (ej. acciones bulk que requieren selección previa) — E-16 no aplica, ocultarla con el resto es correcto.

**Implementación:** shell estático en HTML (ver `E-01`) — el JS de render se divide en una función para el shell (siempre corre, nunca hace early-return por conteo) y una función para el cuerpo (la única que alterna lista/empty-state). Mismo principio ya aplicado en `#stats-bar`/Backlog — este REQ lo confirma como patrón reutilizable, no una excepción de Q-INC.

**Tokens y selectores:** ver `_Locus-css-ref` — `.tpl-action-btn`, `.stat-type-chip`, `.stat-pri-chip` y su `:focus-visible` (mod:102). Este doc no duplica selectores.

---

## F — Búsqueda y navegación

### F-01 · Búsquedas: scope local por contexto `confirmado`

| Campo | Scope |
|---|---|
| `#search-global` | Global — Ítems (REQ/TKT/DISC/INC/PRB/KE/CHG vía `getItems()`+`getIncidents()`), IAs, Sesiones, Contratos, Proyectos, secciones de Contexto. Único campo de búsqueda transversal del sistema. |
| `#backlog-search-input` | Ítems del backlog (scope local — Tab Backlog) |
| `#rsb-search-input` | Workers en Radar sidebar |
| `#ctx-search-input` | Secciones del CONTEXT importado |
| `#ctr-search-input` | Módulos y funciones en panel Contratos (`locus-sprint-plan.css`) |

**Corrección (mod:19) — la nota anterior tenía la relación invertida:** este documento declaraba `#search-global` eliminado y reemplazado por Command Palette. Verificado contra código real (`locus-ui-shell.js` mod:48): ocurrió lo contrario — **Command Palette fue la deprecada y eliminada** (`#cp-input` · `#cp-overlay` · `#hdr-search-trigger` · `locus-command-palette.js` retirados del proyecto). `#search-global` es el campo vivo, reconectado con listener propio en REQ CAEL-búsqueda-tipos (mod:50) y es hoy el único punto de búsqueda global del sistema. Gap detectado en consulta retroactiva de Nova sobre ese REQ — sin archivo real adjunto en la sesión donde se emitió el REQ, corregido en cuanto el código estuvo disponible.

**No confundir con "Atajos de teclado" (mod:20):** el panel de shortcuts no es parte de este eje de navegación — es un componente aparte, con trigger y propósito distintos:

| | `#search-global` (F-01/F-03) | Atajos de teclado |
|---|---|---|
| Propósito | Buscar y saltar a Ítems/IAs/Sesiones/Contratos/Proyectos/Contexto | Ver y reasignar los *chords* de teclado del sistema |
| Trigger | Campo de texto en header | Botón "Shortcuts" en `#more-menu` (`data-action="open-shortcuts"`) · `Cmd+?`/`Cmd+Shift+/` para la referencia de solo lectura |
| Overlay(s) | `#search-unified-results` | `#shortcuts-overlay` (panel editable — `_shortcutsRender()`, `_shortcutsStartEdit()`) · `#shortcuts-ref-overlay` (referencia rápida de solo lectura) |
| Contenido | Resultados de coincidencia de texto | `_SHORTCUT_DEFS` — definiciones de chord por acción, con override persistido |

Ninguno depende del otro — la deprecación de Command Palette no afectó al panel de shortcuts.

**Regla:** Nova no agrega nuevos campos de búsqueda aislados sin evaluar conexión a los existentes.

---

### F-02 · Todo campo de búsqueda tiene botón de clear explícito `confirmado`

Los 5 campos tienen su botón ✕/×, visible solo cuando hay contenido (`#search-global-clear` · `#backlog-search-clear` · `#rsb-search-clear` · `#ctx-search-clear` · `#ctr-search-clear`).

---

### F-03 · Panel de resultados de `#search-global` — jerarquía de grupos e iconografía `confirmado`

Renderizado por `onSearch()` (`locus-ui-shell.js`) en bloques `.sur-group` (`.sur-group-label` + `.sur-rows` de `.sur-row`).

**Orden de grupos — fijo, no por frecuencia de uso:**

1. 🗃 Ítems (REQ/TKT/DISC/INC/PRB/KE/CHG)
2. 🤖 IAs
3. 📋 Sesiones
4. 📐 Contratos
5. 📁 Proyectos
6. 📄 Contexto

Grupos sin coincidencias no renderizan — anteponer Ítems no oculta coincidencias de otro grupo cuando la búsqueda es específica (ej. nombre de Worker). Orden estático ya vigente antes de REQ CAEL-búsqueda-tipos — ese REQ solo antepuso Ítems al principio de un mecanismo que ya era fijo. Principio: reconocimiento sobre recall (Nielsen) — posición predecible por tipo de resultado, no reordenamiento dinámico sin evidencia de uso que lo justifique.

**Iconografía de `.sur-row-icon` para el grupo Ítems — `_TYPE_ICONS`:**

| Tipo | Icono | Color canónico (`__BR-Ecosystem §4`) |
|---|---|---|
| REQ | 🔵 | Azul `#38bdf8` |
| TKT | 🟢 | Verde `#2ecc78` |
| DISC | 🟣 | Púrpura `#7c6af7` |
| INC | 🔴 | Rojo `#e85555` |
| PRB | 🟠 | Naranja `#f59e0b` |
| KE | 🟡 | Amarillo `#eab308` |
| CHG | ⚪ | Gris azulado `#64748b` — sin emoji de círculo gris en el set Unicode estándar; ⚪ es el proxy de mayor contraste disponible frente a los otros seis, no una omisión |

**Por qué emoji aquí y no SVG (a diferencia de E-11):** E-11 aplica exclusivamente al header (tabs · `#header-pend-btn` · `#more-menu`) — este panel no es header. Fuera de esa zona, la fidelidad de color no vive en el glifo sino en la asignación 1:1 tipo→emoji, ya usada como precedente en otros indicadores de tipo del sistema (badges de sesión, stats bar de backlog). `_TYPE_ICONS` reemplazó a `code.charAt(0)` (anti-pattern Gen1 documentado en `_Locus-module-contracts §4`) — usa `itemKind(item)`, no el prefijo del código.

---

## G — Feedback al usuario

### G-01 · Toast system: 8 tipos semánticos `confirmado`

| Tipo | Uso |
|---|---|
| `t-success` | Operación completada con éxito — solo cuando el resultado no es visible en pantalla |
| `t-download` | Descarga iniciada |
| `t-error` | Error — requiere acción del usuario |
| `t-warning` | Advertencia — no bloquea |
| `t-info` | Información neutral |
| `t-confirm` | Confirmación de acción de alto peso que cierra o abandona el contexto activo |
| `t-copy` | Copia al portapapeles |
| `t-neutral` | Mensajes sin semántica de estado |

**Regla de uso:** El toast es para acciones cuyo resultado no es visible en pantalla, o acciones que cierran el contexto activo. Si el resultado es visible en el mismo contexto donde ocurrió la acción → usar feedback inline o silencio. Ver G-04.

---

### G-02 · `aria-live` en contenedores de feedback dinámico `confirmado`

Todo componente nuevo que inyecte contenido dinámico incluye `aria-live="polite"`.

---

### G-03 · Estados de carga internos — patrón definido `confirmado`

- Operaciones < 300ms: sin indicador
- Operaciones 300ms–2s: spinner inline en el botón que la disparó
- Operaciones > 2s: barra de progreso indeterminada en el área afectada (patrón `#pepe-progress-bar`)

---

### G-04 · Jerarquía de feedback: silencio → inline → toast `confirmado`

Tres niveles en orden de preferencia. Usar el nivel más bajo que comunique el resultado con claridad.

| Nivel | Cuándo aplica | Ejemplos |
|---|---|---|
| **Silencio** | El estado del sistema ya comunica el resultado — el cambio es visible sin feedback adicional | Panel DIFF renderizado tras parse exitoso · Status de ítem cambiado con micro-flash |
| **Inline** | La acción ocurre dentro de un panel o contexto abierto y el resultado es visible en ese mismo espacio | Confirmación de merge en panel DIFF · `.item-inline-confirm` en backlog · micro-flash `.item-status-confirmed` |
| **Toast** | La acción cierra el contexto activo, es irreversible sin feedback visible, o el resultado ocurre fuera de pantalla | Guardar sesión completa · Exportar archivo · Error de parse (panel no abre) |

**Reglas duras:**
- No apilar toast sobre inline — si ya hay confirmación inline, el toast es ruido.
- No usar toast para comunicar que un panel se abrió — el panel es la confirmación.
- `t-error` es la excepción: siempre va como toast, incluso si hay contexto abierto. El error requiere atención activa del usuario.

**Aplicación al flujo de CHECKPOINT:**

| Acción | Mecanismo correcto |
|---|---|
| Parse exitoso | Silencio — el panel DIFF es la confirmación |
| Parse fallido | Toast `t-error` — el panel no abre, el error no es visible |
| Apply DIFF (ítems mergeados) | Inline — micro-flash en header del panel antes de cerrar |
| Guardar sesión completa | Toast `t-confirm` — contexto se cierra |
| Standalone CHECKPOINT guardado | Toast `t-confirm` — ídem |
| Status de ítem sin impacto sprint | Micro-flash `.item-status-confirmed` — sin toast |
| Status de ítem con impacto sprint | `.item-inline-confirm` — sin toast posterior |

---

## H — CSS purity

### H-01 · Todo estilo de presentación vive en CSS `confirmado`

Nova entrega clases CSS para cualquier estado visual — no instrucciones de `style.color` o `style.display`. Regla completa en `__BR-Execution §3`.

---

### H-02 · Clase canónica de ocultamiento: `.is-hidden` `confirmado`

**Regla canónica:** `.is-hidden { display: none !important; }` — declarada en `locus-base.css`.

**Alias legacy activos en `locus-base.css`:**
- `.hidden` — alias directo, misma declaración que `.is-hidden`

**Alias de scope en módulos específicos (no migrar sin T explícito):**
- `.gf-hidden` — footer elements (`locus-backlog-item.css`)
- `.breadcrumb-seg--hidden` — segmentos del breadcrumb (`locus-layout.css`)
- `.force-hidden` — override de máxima especificidad (varios módulos)

**Excepción documentada:** `.tmpl-trigger-body.is-hidden` usa `.is-hidden` para colapso animado (max-height/opacity) — no es `display:none`. Intencional.

**Regla:** Nova usa exclusivamente `.is-hidden` en componentes nuevos.

---

### H-03 · Visibilidad condicional por estado de sesión (auth) `confirmado`

**Patrón:** Elementos del menú ⋯ cuyo comportamiento depende de `_supabaseUser` (sesión activa) se ocultan con `.is-hidden` cuando hay sesión, y se muestran como trigger de login cuando no la hay — nunca ambos estados visibles simultáneamente con el mismo control.

**Precedente:** `#mm-btn-user` (`_updateUserMenuItem()`, `locus-storage.js`) — oculto sin sesión, visible con nombre del usuario cuando hay sesión.

**Segunda instancia (REQ CAEL-0723-01):** `#mm-btn-sync` (`_updateSyncMenuItem()`, `locus-storage.js`) — inverso de `#mm-btn-user`: visible con label `Iniciar sesión` sin sesión (dispara `handleSyncPillClick()` → `openAuthModal()`), oculto con sesión activa. Resuelve duplicación con `#gf-sync` (footer, siempre visible, mismo origen `setSyncStatus()`) — el ítem del menú solo aportaba valor real en el estado deslogueado.

**Regla:** Un ítem del menú ⋯ gateado por `_supabaseUser` sigue este patrón — toggle vía `.is-hidden` invocado desde el mismo call site que ya actualiza estado de auth (`setSyncStatus()`), no un listener separado. No introducir un tercer mecanismo de visibilidad condicional para el mismo tipo de gate.

---

## I — Tab Sesiones · Patrones de layout y panel

### I-01 · Proporción canónica del split de columnas del Tab Sesiones `confirmado`

El Tab Sesiones usa un layout de dos columnas horizontales.

| Estado | Proporción | Descripción |
|---|---|---|
| Reposo | `40 / 60` | Columna izquierda (lista de sesiones) · columna derecha (área de trabajo) |

Sin variantes declaradas — no existe estado de columna única ni colapso horizontal en desktop.

**Regla:** Nova usa `40/60` como proporción canónica en reposo. Si una sesión de trabajo requiere ajuste de densidad, proponer nuevo estado con proporción declarada — no asumir libre.

---

### I-02 · Patrón `#ckpt-panel` — flujo canónico post-parse del Tab Sesiones `confirmado`

`#ckpt-panel` es el panel de resultado de parseo de CHECKPOINT. Slide-in lateral — no modal. Definido en `locus-modals.css`.

**Estados y transiciones:**

| Estado | Condición de activación | Comportamiento |
|---|---|---|
| Oculto | Sin CHECKPOINT parseado en sesión activa | `.is-hidden` — fuera del flujo visual |
| Visible — en proceso | Parse en curso | Slide-in visible con barra de progreso activa |
| Visible — resultado | Parse completo (éxito o error parcial) | Muestra DIFF generado — founder puede revisar antes de confirmar |
| Visible — post-apply | Founder confirmó apply | Panel cierra con transición de salida — toast `t-confirm` si la sesión se guarda completa |
| Reabierto | Founder usa `#ckpt-reopen-btn` | Panel vuelve al estado `resultado` con el último DIFF en memoria |

**Criterio de visibilidad:** La apertura del panel es la confirmación de parse exitoso — no se acompaña de toast. El cierre puede ir con toast si el contexto cambia (sesión guardada). Ver G-04.

**Regla:** Nova no introduce un segundo panel de resultado de parse. `#ckpt-panel` es el único punto de llegada del flujo de CHECKPOINT.

---

### I-03 · Triggers automáticos — criterio de interrupción no solicitada `confirmado`

Un trigger automático interrumpe al usuario cuando se activa sin acción directa de su parte (timers, eventos del sistema, llegada de datos).

**Criterio de interrupción válida:**

| Condición | Permitido | Ejemplo válido |
|---|---|---|
| El evento es irreversible o tiene ventana corta de acción | Sí | Alerta de sprint próximo a vencer · notificación de sync fallido |
| El evento afecta el trabajo activo del usuario en ese momento | Sí | Conflicto de CHECKPOINT en sesión en curso |
| El evento es informativo sin urgencia | No | Estadísticas de uso · actualizaciones de fondo resueltas |
| El evento ocurre en flujo que el usuario ya está ejecutando | No | Toast de "guardado" cuando el usuario ya ve el resultado en pantalla |

**Mecanismo preferido por urgencia:**

| Urgencia | Mecanismo |
|---|---|
| Alta — requiere acción inmediata | Modal o panel bloqueante |
| Media — requiere atención pero no bloquea | Toast `t-warning` o `t-info` |
| Baja — informativa, descartable | Banner no bloqueante o silencio |

**Regla:** Un trigger automático que no cumple la condición de interrupción válida no se implementa como toast ni modal. Se registra en estado del sistema y se expone solo si el usuario lo consulta.

---

### I-04 · Teaser de notificación en tracker-view-header — familia `tvh-notif-*` `confirmado`

Slot único arriba de la columna derecha del Tab Sesiones — reemplaza al Setup Checklist Banner (eliminado). Muestra ambientalmente la notificación de sistema no leída de mayor severidad sin requerir que el usuario expanda el Radar Sidebar.

| Estado | Condición de activación | Comportamiento |
|---|---|---|
| Oculto | `_computeNotifications()` sin resultados fuera de `_notifReadSet()` | `.is-hidden` — slot colapsa a 0 altura, sin reserva de espacio |
| Visible | Al menos una notificación no leída | Card compacta: ícono + título + body (oculto en `<480px`) + link "Ver todas (N)" |
| Refresco | Evento `shell:update-notif-badges` en `window` | Re-evalúa `_computeNotifications()`/`_notifReadSet()` y re-renderiza sin recarga — mismo gancho que ya usan los badges de tab |

**Criterio de selección:** severidad más alta primero (`warn` > `info`, mismo `severityMap` que `_computeNotifications()`); empate por severidad → notificación más reciente por `ts`.

**Interacción:** click en el cuerpo de la card invoca `_notifGoto(id)` — misma acción que la fila equivalente en el Radar Sidebar. Click en "Ver todas" invoca `toggleRadarSidebar()` solo si el sidebar está colapsado; si ya está expandido, no hace nada (evita doble toggle).

**Regla:** El teaser es una superficie de lectura — no duplica el motor de notificaciones (`_computeNotifications`/`_notifReadSet`/`_notifGoto` viven en `locus-notifications.js`) ni el panel completo del Radar Sidebar. Un patrón nuevo de notificación ambiental fuera de este slot debe justificarse contra I-03 antes de implementarse.

---

## J — AI Card · Estados

### J-01 · 5 estados reales de AI Card `confirmado`

La AI Card es el componente central del Tab Tracker. Implementada en `buildHoyCard()` — `locus-sesiones.js`.

| Estado | Clases en el elemento card | Condición de activación | Comportamiento visual |
|---|---|---|---|
| `available` | `hoy-mini-card available` | Worker sin sesión activa, sin restricción, sin interrupción | Estado neutro — sin indicador especial |
| `insession` | `hoy-mini-card available in-session-state` | Worker con sesión en curso (`_isInSession` = true) | Badge `hoy-mini-badge--insession` + dot activo |
| `interrupted` | `hoy-mini-card available interrupted-state` | Sesión interrumpida sin cierre formal (`ai.interrupted = true`) | Banner "⚡ Checkpoint en curso" + CTA "Continuar →" |
| `exhausted-con-hora` | `hoy-mini-card exhausted` | `ai.status === 'exhausted'` con `ai.resetTime` declarado | Countdown dramático + hora reset. Badge `sc-badge--exhausted` |
| `exhausted-sin-hora` | `hoy-mini-card exhausted` | `ai.status === 'exhausted'` sin `ai.resetTime` | "Sin hora de desbloqueo" + CTA asignar. Badge `sc-badge--exhausted` |

**Nota de implementación:** `interrupted-state` e `in-session-state` son clases adicionales sobre `available` — no reemplazan la clase base. Un worker puede ser `available in-session-state` simultáneamente.

**Tokens de color para `in-session-state`:** `--purple`, `--purple-dim`, `--purple-border` — exclusivos de este estado (ver A-04).

**Badges de estado (sc-badge):** El badge en el header de la card usa modificadores de `locus-sesiones-card.css` — mapeo 1:1 con los 4 estados: `.sc-badge--avail` (`available`), `.sc-badge--insession` (`insession`), `.sc-badge--interrupted` (`interrupted`), `.sc-badge--exhausted` (`exhausted`/`exhausted-con-hora`/`exhausted-sin-hora`). CAEL-01 cerró el gap que dejaba `interrupted` sin badge propio. El mismo estado colorea también avatar (`.sc-avatar--*`) y acento de `#worker-header` (`.worker-header--*`) — ver CSS-ref `§AI Card rediseño → Worker-header — modificadores de estado`.

**Regla:** Nova no introduce estados intermedios entre los 5 declarados. Si un caso de uso no encaja en ninguno → proponer nuevo estado con nombre, condición y clases antes de implementar.

---

## K — Tracker · Proporciones de grid

### K-01 · Proporciones canónicas del grid `tracker-3col` `confirmado`

El layout principal del Tab Tracker usa un grid de 3 columnas.

| Estado | Proporción | Condición |
|---|---|---|
| Reposo | `40 / 60` (2 columnas efectivas) | Sin preview activo — la tercera columna colapsada a `0fr` |
| Con preview activo | `30 / 40 / 30` | Panel de preview expandido — tracker-preview visible |

**Nota:** En reposo el grid es técnicamente de 3 columnas pero opera como 2 — la columna de preview está en `0fr`. Ver K-02 para el patrón de expansión.

**Regla:** Nova declara proporciones explícitas cuando propone variantes de layout del tracker. No asumir que `auto` o `1fr` equivale a las proporciones canónicas.

---

### K-02 · Patrón `0fr → Nfr` — paneles expandibles `confirmado`

Patrón canónico para paneles que aparecen y desaparecen sin reflow brusco. Implementación de referencia: `tracker-preview` en el Tab Tracker.

**Mecanismo:**

```css
/* Estado colapsado */
.tracker-preview {
  width: 0fr; /* o grid-template-columns equivalente */
  overflow: hidden;
  transition: width var(--trans-medium);
}

/* Estado expandido — clase aplicada por JS */
.tracker-preview.is-expanded {
  width: Nfr; /* valor canónico del estado expandido */
}
```

**Comportamiento:**
- Colapsado: el panel no ocupa espacio visual — `0fr` en el grid-template
- Expansión: transición suave con `var(--trans-medium)` — sin salto de layout
- Contenido interno: visible solo en estado expandido (`overflow: hidden` en colapsado)

**Criterio de uso:**

| Condición | Usar este patrón | Alternativa |
|---|---|---|
| El panel aparece/desaparece en respuesta a acción del usuario | Sí | — |
| El panel necesita preservar estado interno al colapsar | Sí — el DOM no se destruye | `display: none` / `.is-hidden` si el estado no importa |
| El panel es modal o requiere overlay | No | Shell en HTML + `.open` / `.is-hidden` |

**Regla:** Nova usa este patrón para todo panel expandible inline que requiera transición sin reflow. Si el panel es modal → patrón de shell estático (E-01).

---

## Notas operativas

- Este documento se actualiza al cerrar cada sprint donde Nova interviene sobre Locus.
- `_Locus-css-ref` es la interfaz formal entre Nova y Rune — tiene precedencia sobre este documento en convenciones de implementación.
- El inventario completo de componentes vivos → `_Locus-ui-Inventory`.
- **Tensión activa (v0.5.1):** D-06 — pendiente decisión del founder/Cael sobre punto de entrada canónico del theme toggle. No cerrar como `confirmado` hasta esa decisión. (A-04 resuelta en mod:5 — ver Cambios v0.5.1.)
