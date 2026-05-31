# Locus-CSS-Reference_V2_6.md
<!-- Versión: 2.7 | Última actualización: 2026-05-28 | Convenciones CSS del proyecto Locus — mantenido por Nova, consumido por Rune -->

---

## Propósito y dueño

**Dueño:** Nova — lo mantiene actualizado al cerrar cada sprint donde interviene.
**Audiencia:** Rune — lo consume como referencia de implementación. Si Rune detecta un conflicto entre este documento y un R activo, devuelve a Nova antes de resolver por su cuenta.

---

## Arquitectura de módulos CSS

17 archivos en orden de carga en `index.html`:

| # | Archivo | Scope |
|---|---|---|
| 1 | `locus-base.css` | Variables globales, reset, tokens `:root` |
| 2 | `locus-layout.css` | Shell, header, tabs, botones base, search |
| 3 | `locus-backlog.css` | Tab Backlog — lista, filtros, sprint selector, kanban |
| 4 | `locus-backlog-item.css` | `buildBacklogItem()` — item expandido, IDP, merge diff |
| 5 | `locus-sprint.css` | Tab Sprint — header, burndown, lista Rs, scope added, workers |
| 6 | `locus-sprint-close.css` | Modal cierre de sprint — `sprint-close-*` · `scm-*` |
| 7 | `locus-sprint-plan.css` | Sub-tab Plan · Pulso · Contratos — `plan-*` · `pulso-*` · `acv-*` · `ctr-*` · `pls-*` |
| 8 | `locus-sprint-ui.css` | Vista Planificación drag & drop · EXECUTION-PLAN UI — `bl-plan-*` |
| 9 | `locus-archive.css` | Histórico unificado — `arch-*` |
| 10 | `locus-tracker.css` | Tab Tracker — grid, cards IA, sesiones, historial |
| 11 | `locus-tracker-card.css` | Rediseño AI Card — `sc-*` · `card-dot-*` |
| 12 | `locus-radar.css` | Radar Sidebar global — `rsb-*` |
| 13 | `locus-analytics.css` | Tab Analytics — KPIs, charts, heatmap |
| 14 | `locus-modals.css` | Sistema modal genérico, toasts, tags, auth, drawers |
| 15 | `locus-docs.css` | HTML-MAP viewer y Context vivo — `htmlmap-*` · `mm-*` · `context-*` |
| 16 | `locus-document-generator.css` | Map Generator overlay — `mg-*` |
| 17 | `locus-proyectos.css` | Tab Proyectos — dashboard, contexto, notas, tmpl-trigger |

**Regla de orden:** El orden de carga es invariante. No reordenar sin aprobación de Nova. Rune verifica que `index.html` cargue los 17 archivos en este orden exacto al inicio de cada sesión que toque CSS.

**Cambio V2.6:** Se añaden `locus-tracker-card.css` (pos. 11, después de `locus-tracker.css`) y `locus-docs.css` (pos. 15, después de `locus-modals.css`). La tabla anterior de V2.5 tenía 15 archivos — ahora son 17.

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
| `tracker-` | Tracker | `locus-tracker.css` |
| `sc-` | AI Card rediseño — header, stats, stepper, footer | `locus-tracker-card.css` |
| `card-dot-` | Dropdown menú de card IA | `locus-tracker-card.css` |
| `popup-` | Popup de detalle de sesión | `locus-tracker.css` |
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
| `sh-` | Sprint Health panel | `locus-analytics.css` |
| `rm-` | Roadmap chips | `locus-analytics.css` |
| `mg-` | Map/Document Generator | `locus-document-generator.css` |
| `mdiff-` | Merge diff panel | `locus-backlog-item.css` |
| `akpi-` | Analytics KPI | `locus-analytics.css` |
| `gf-` | Global footer | `locus-layout.css` |
| `pend-` | Panel de pendientes | `locus-modals.css` |
| `bitem-` | Backlog item — elementos internos expandidos | `locus-backlog-item.css` |
| `viz-` | Checkpoint viz | `locus-modals.css` |
| `ckpt-` | Checkpoint viz — secciones del panel | `locus-modals.css` |
| `sprint-inline-` | Sprint inline — formulario en merge diff | `locus-backlog-item.css` |
| `promote-` | Promote modal | `locus-modals.css` |
| `item-` | Backlog item pills y badges | `locus-backlog.css` |
| `scb-` | Setup checklist banner | `locus-backlog.css` |
| `qc-` | Quick Capture modal | `locus-modals.css` |
| `hsr-` | Header sprint row | `locus-backlog.css` |
| `tci-` | Tracker col input | `locus-tracker.css` |
| `tvh-` | Tracker view header | `locus-tracker.css` |
| `htmlmap-` | HTML-MAP viewer — tabla y filtros | `locus-docs.css` |
| `mm-` | Module Map árbol modular — módulos y funciones | `locus-docs.css` |
| `hmfilter-` | Filtros pill del HTML-MAP viewer | `locus-docs.css` |
| `context-` | Context vivo — placeholder, raw block, conflicto | `locus-docs.css` |

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

### Escala de z-index (30 tokens)

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
| `--green` | `#39e87c` | `#1aab5a` | Éxito, confirmación, dot Pulso verde, badges de contrato activo |
| `--green-dim` | `#071a10` | `#e6f9ef` | Fondo sutil de contextos de éxito |
| `--red-dim` | `#1a0810` | *(verificar light)* | Fondo sutil destructivo — alias `--bg-danger-subtle` |
| `--blue` | `#4fc3f7` | `#0288d1` | Color informativo — `--blue-dim` y `--blue-border` disponibles |
| `--hint` | `#3a3d5c` | `#a0a4c8` | Bordes sutiles de elementos secundarios |
| `--accent-dim` | `rgb(166 226 46 / 8%)` | `rgb(109 184 33 / 7%)` | Fondo sutil de acción primaria |
| `--accent-border` | `rgb(166 226 46 / 25%)` | *(light derivado)* | Borde sutil de acción primaria |

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
| `.scb-hidden` | Clase de backlog banner | `#setup-checklist-banner` — migración pendiente (backlog) |

**Regla:** usar `.is-hidden` en componentes nuevos. No crear nuevas clases de visibilidad sin aprobación de Nova.

**Excepción documentada — `tmpl-trigger-wrap`:** `.tmpl-trigger-body.is-hidden` no produce `display: none` en este componente. El patrón usa `max-height` y `opacity` para colapso animado. Ver § Patrones de componentes flotantes → `tmpl-trigger-wrap`.

---

## Patrones de componentes flotantes

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
| `.arch-row-type--r/t/b/p` | Tipo de ítem con color semántico |
| `.arch-se-effort` | Effort entregado — badge accent |

Read-only treatment: ítems en `#arch-historico-body` tienen `opacity: 0.65`, controles deshabilitados y botones de acción ocultos.

### AI Card rediseño — familia `sc-*` + `card-dot-*`

Canónico en `locus-tracker-card.css`. Extracción de `locus-tracker.css`. Aplica a `buildCard()` y `_buildCurrentSessionCard()`.

#### Estructura de la card

| Selector | Rol |
|---|---|
| `.sc-header` | Header principal — flex, `border-bottom: 0.5px solid var(--border)` |
| `.sc-header-left` | Grupo izquierdo — avatar + nombre de proyecto |
| `.sc-header-right` | Grupo derecho — badge + sprint-id + menú |
| `.sc-avatar` | Avatar 28px circular — `background: var(--accent-dim)` |
| `.sc-project` | Nombre del proyecto — truncado con ellipsis |
| `.sc-badge` | Badge de estado activo — inline-flex, dot animado |
| `.sc-badge-dot` | Dot dentro del badge — animación `sc-pulse-dot` 2s |
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
| `.sc-unlock` / `.sc-unlock-label` / `.sc-unlock-icon` | Hora de desbloqueo |
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

**Nota de extracción:** `locus-tracker-card.css` extrae únicamente selectores `sc-*` y `card-dot-*` de `locus-tracker.css`. Los demás selectores de Tracker siguen en `locus-tracker.css`.

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

### tmpl-trigger-wrap — colapso animado

Canónico en `locus-proyectos.css`. Controla visibilidad del cuerpo del template trigger mediante animación de colapso — **no** `display: none`.

**Nota de anidamiento intencional:** `.tmpl-trigger-body.is-hidden` sobreescribe el comportamiento canónico de `.is-hidden`. No produce `display: none` — produce colapso por `max-height` y `opacity`. Única excepción al comportamiento canónico de `.is-hidden` en el proyecto.

| Selector | Rol |
|---|---|
| `.tmpl-trigger-wrap` | Contenedor raíz |
| `.tmpl-trigger-body` | Cuerpo colapsable — visible por defecto |
| `.tmpl-trigger-body.is-hidden` | Estado colapsado — `max-height: 0`, `opacity: 0` |

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
CSSREF
