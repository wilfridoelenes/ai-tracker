# Locus-UX-Reference_V2_0.md
<!-- Versión: 2.0 | Última actualización: 2026-05-25 | Referencia de sistema UX/UI — Locus -->

---

## Propósito

Documento de referencia de experiencia e interfaz del proyecto Locus. Se carga en toda sesión donde Nova interviene sobre Locus — junto al rol transversal `__Role-Nova_UX.md`.

No reemplaza el rol transversal — lo complementa con el conocimiento específico del sistema implementado.

**Audiencia:** Nova (sesión de diseño y especificación) · Rune (consulta cuando CSS-Reference no es suficiente)

---

## Protocolo de uso

Al iniciar sesión sobre Locus, Nova:

1. Carga este documento junto al rol base y `Locus-CSS-Reference_V*.md`.
2. Verifica que las reglas aquí declaradas no contradigan un R activo — si hay conflicto, señalarlo antes de actuar.
3. Referencia el código de regla (ej: `A-03`) en sus entregables cuando aplica una decisión de diseño.
4. Propone actualización de este documento al cerrar sprint donde intervino — nuevos patrones, reglas que cambian.

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

| Nivel | Color | Uso |
|---|---|---|
| `critical` | Rojo | Errores bloqueantes, acciones destructivas |
| `high` | Naranja | Warnings con impacto |
| `medium` | Amber | Atención sin bloqueo |
| `pulido` | Azul | Información complementaria |
| `low` | Verde | Éxito, confirmación |
| `won` | Gris medio | Estados inactivos |
| `done` | Gris oscuro | Estados completados |

Cada nivel tiene tres tokens: `--c-[nivel]-bg` / `--c-[nivel]-border` / `--c-[nivel]-text`.

Tokens `--purple` / `--purple-dim` / `--purple-border` — exclusivos de estado `insession`. No son nivel de severidad.

**Regla:** Nova no usa colores de severidad para otros fines. El purple es exclusivo de estado insession.

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
| mobile | ≤600px | Breadcrumb reducido, sprint-row oculta, col-tabs de tracker |
| tablet | 601–1024px | Radar sidebar colapsado por defecto |
| desktop | ≥1025px | Layout completo |
| ultrawide | ≥2560px | Contenedores con max-width (`var(--bp-ultrawide)`) |

Locus es desktop-only (1920×1080 · 2560×1080). Los breakpoints menores existen pero no son viewport objetivo.

---

### E-04 · Header height como token — nunca hardcodeada `confirmado`

`--header-h: 53px` (header-inner 52px + border-bottom 1px). Usada para calcular `height: calc(100vh - var(--header-h))` en múltiples tabs.

---

### E-05 · Z-index en escala declarada de 30 tokens `confirmado`

**Regla:** Nova usa exclusivamente los tokens. Si hay conflicto de z-index — reportarlo como B antes de introducir un valor nuevo. Valores canónicos en `Locus-CSS-Reference`.

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
  height: calc(100vh - var(--header-h, 54px));
  overflow: hidden auto;
}
```

`#tab-tracker` tiene su propio scroll management. Evita que el scroll de un tab persista al cambiar.

---

## F — Búsqueda y navegación

### F-01 · Búsquedas: scope local por contexto `confirmado`

| Campo | Scope |
|---|---|
| `#search-global` | Workers, sesiones, notas (solo tab Tracker) |
| `#backlog-search-input` | Ítems del backlog |
| `#rsb-search-input` | Workers en Radar sidebar |
| `#ctx-search-input` | Secciones del CONTEXT importado |
| `#cp-input` | Comandos, ítems, Workers, sesiones (global) — acceso via ⌘K |

**Regla:** Nova no agrega nuevos campos de búsqueda aislados sin evaluar conexión a los existentes.

---

### F-02 · Todo campo de búsqueda tiene botón de clear explícito `confirmado`

Los 5 campos tienen su botón ✕, visible solo cuando hay contenido.

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

**Alias legacy activos (no migrar sin T explícito):**
- `.hidden` — alias en `locus-base.css`
- `.gf-hidden` — footer elements
- `.breadcrumb-seg--hidden` — segmentos del breadcrumb
- `.force-hidden` — override de máxima especificidad
- `.scb-hidden` — `#setup-checklist-banner` (migración pendiente en backlog)

**Excepción documentada:** `.tmpl-trigger-body.is-hidden` usa `.is-hidden` para colapso animado (max-height/opacity) — no es `display:none`. Intencional.

**Regla:** Nova usa exclusivamente `.is-hidden` en componentes nuevos.

---

## Notas operativas

- Este documento se actualiza al cerrar cada sprint donde Nova interviene sobre Locus.
- `Locus-CSS-Reference` es la interfaz formal entre Nova y Rune — tiene precedencia sobre este documento en convenciones de implementación.
- El inventario completo de componentes vivos → `__Locus-UI-Inventory`.
