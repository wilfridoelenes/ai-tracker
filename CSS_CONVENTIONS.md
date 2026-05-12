# CSS_CONVENTIONS.md
<!-- Última actualización: 2026-05-11 | Arquitectura CSS del proyecto Locus -->

---

## Arquitectura de archivos

El CSS de Locus está dividido en módulos por responsabilidad. Cada archivo tiene un scope exclusivo — no duplicar selectores entre archivos.

| Archivo | Contenido | Scope |
|---|---|---|
| `locus-base.css` | Variables CSS (tokens), reset, temas `data-theme="dark/light"`, tipografía global | Global — se carga primero |
| `locus-layout.css` | Header, tab bar, botones compartidos, toast, search, layout de página | Estructura global |
| `locus-modals.css` | Modales, overlays, drawers, toasts individuales | Componentes flotantes |
| `locus-tracker.css` | Tab Tracker — cards de IA, sesiones, popup de detalle, sidebar Radar | Tab Tracker |
| `locus-backlog.css` | Tab Backlog — lista de ítems, filtros, kanban, sprint selector, árbol | Tab Backlog |
| `locus-analytics.css` | Tab Analytics — heatmap, KPIs, charts, patrones de productividad | Tab Analytics |
| `locus-proyectos.css` | Tab Proyectos — cards de proyecto, contexto, decisiones, notas | Tab Proyectos |
| `locus-overrides.css` | Cascade overrides cross-módulo — ajustes de especificidad entre archivos | Capa final — se carga al último |

**Regla:** si un selector necesita estar en más de un archivo, pertenece a `locus-layout.css` o `locus-overrides.css`. Nunca duplicar.

---

## Naming de clases

### Convención general: BEM con modificador `--`

```
[componente]-[elemento]--[modificador]
```

Ejemplos válidos:
- `.stat-card` → `.stat-card.s-critical`
- `.filter-btn` → `.filter-btn.active.f-high`
- `.sh-bar-fill--blue` — modificador semántico de color
- `.mdiff-btn--primary` — variante de botón

`stylelint-config-standard` v40 usa un patrón kebab-case que rechaza `--`. La regla `selector-class-pattern` está desactivada en `.stylelintrc.json` para permitir esta convención. **No reactivarla** sin agregar un patrón explícito que admita `--`.

### Prefijos de módulo

| Prefijo | Módulo |
|---|---|
| `bl-` | Backlog |
| `stat-` | Analytics — estadísticas |
| `tracker-` | Tracker |
| `popup-` | Popup de detalle de sesión |
| `preview-` | Preview de checkpoint |
| `filter-` | Filtros de backlog |
| `sprint-` | Sprint selector y header |
| `scm-` | Sprint close modal |
| `rsb-` | Radar Sidebar |
| `sh-` | Sprint Health panel |
| `rm-` | Roadmap chips |
| `mg-` | Map/Document Generator |
| `mdiff-` | Merge diff panel |
| `akpi-` | Analytics KPI |
| `gf-` | Global footer |

### Clases de un carácter — `.P` `.T` `.R` `.B` `.I`

Estas clases son **intencionales** y están exentas del patrón de naming estándar.

Representan los tipos de ítem del backlog de Locus:

| Clase | Tipo de ítem |
|---|---|
| `.P` | Idea (Posibilidad) |
| `.T` | Ticket |
| `.R` | Requerimiento |
| `.B` | Bug |
| `.I` | Item genérico (legacy) |

Se usan **siempre como modificadores compuestos**, nunca solos:

```css
/* ✓ Correcto — selector compuesto */
.item-type-pill.P { background: ...; }
.preview-tg-badge.R { color: ...; }
.tracker-item-type-pill.B { border-color: ...; }

/* ✗ Incorrecto — clase sola sin contexto */
.P { color: red; }
```

Archivos donde aparecen: `locus-backlog.css`, `locus-tracker.css`, `locus-proyectos.css`.

### Variables privadas `--_name`

Las variables custom con prefijo `--_` (e.g. `--_type-color`, `--_type-bg`) son variables de scope local, intencionales. La regla `custom-property-pattern` está desactivada porque el patrón default rechaza el underscore. **No convertirlas a nombres públicos** — son internas al bloque donde se definen.

### Keyframes camelCase

El codebase usa nombres camelCase para keyframes (`tipIn`, `heatReveal`, `cardFlash`, etc.). La regla `keyframes-name-pattern` está desactivada. Los nombres son intencionales y renombrarlos requeriría actualizar referencias en JS. **Nuevos keyframes pueden usar kebab-case** — ambas convenciones coexisten.

---

## Reglas desactivadas y razones

Documentado aquí porque `.stylelintrc.json` es JSON puro y no admite comentarios.

| Regla | Estado | Razón |
|---|---|---|
| `selector-class-pattern` | Desactivada | El codebase usa BEM con `--` como modificador y clases de un carácter (`.P .T .R .B`). El patrón default de config-standard v40 rechaza ambos. |
| `keyframes-name-pattern` | Desactivada | Nombres camelCase existentes (`tipIn`, `heatReveal`, `avatarPulse`, etc.) son intencionales. Renombrar requeriría actualizar referencias en JS. |
| `custom-property-pattern` | Desactivada | Variables `--_private` con underscore son convención de scope local válida en CSS. |
| `no-descending-specificity` | Desactivada | `locus-overrides.css` existe para sobreescribir especificidad de módulos anteriores. La cascada descendente es intencional. |
| `alpha-value-notation` | Desactivada | El codebase mezcla `rgb(r g b / a%)` y `rgba(r,g,b,a)` por legibilidad según contexto. Forzar una notación requeriría refactor masivo. |
| `color-function-notation` | Desactivada | Ídem anterior — notación moderna y legacy coexisten en el sistema de tokens. |
| `import-notation` | Desactivada | No se usan `@import` en el proyecto. Regla irrelevante. |
| `declaration-property-value-keyword-no-deprecated` | Desactivada | `word-break: break-word` aparece en múltiples archivos y funciona en todos los targets actuales. Migrar a `overflow-wrap: break-word` es deuda técnica registrada. |

### Reglas activas relevantes

| Regla | Estado | Razón |
|---|---|---|
| `color-no-invalid-hex` | Activa | Protege contra hex malformados en la paleta de tokens. |
| `block-no-empty` | Activa | Bloques `{}` vacíos son código muerto — error real. |
| `declaration-block-no-shorthand-property-overrides` | Activa | Sobreescribir una propiedad larga con shorthand es un bug silencioso (e.g. `padding-top` seguido de `padding`). |
| `declaration-block-no-duplicate-properties` | Activa (con excepción) | Duplicados permitidos cuando tienen sintaxis diferente (fallback intencional). |
| `custom-property-no-missing-var-function` | Activa | Previene uso accidental de `--token` sin `var()`. |

---

## Bugs conocidos — bloques sin cerrar

Al ejecutar el lint por primera vez se detectaron 3 `CssSyntaxError` (bloques `{` sin `}` correspondiente). Son bugs que impiden que stylelint audite esos archivos completamente:

| Archivo | Línea | Descripción |
|---|---|---|
| `locus-backlog.css` | 4230 | `@keyframes bitem-nav-pulse` con `}` del 0% mal indentado fuera del bloque |
| `locus-modals.css` | 223 | `.toast-item:hover` sin `{` — selector suelto antes del `@keyframes` |
| `locus-tracker.css` | 9272 | `@media (width <= 400px)` con `}` de cierre en posición incorrecta |

Registrados como Bs en el backlog. Deben corregirse antes de que el lint dé un baseline limpio.

---

## Reglas CSS Purity

Todo estilo de presentación vive en archivos `.css`. Prohibido en JS y HTML:

```js
// ✗ Prohibido
element.style.color = '#f00';
element.style.display = 'block';
element.style.fontSize = '14px';
element.style.cssText = '...';

// ✓ Permitido — solo CSS custom properties con valor calculado en runtime
element.style.setProperty('--sprint-progress', '42%');
```

Para mostrar/ocultar elementos: `classList.add/remove/toggle` con clases definidas en CSS, no `style.display` directo.

---

## Tokens y variables

Todas las variables viven en `locus-base.css` bajo `:root` y los overrides de tema bajo `:root[data-theme="dark"]` / `:root[data-theme="light"]`.

No declarar variables en módulos individuales. Si un valor se repite en más de un módulo → extraerlo a `locus-base.css`.

---

## Lint

```bash
# Verificar todos los archivos Locus
npm run lint:css

# Fix automático (solo errores autofixables — ~776 de formateo)
npm run lint:css:fix
```

El comando falla el build si introduce errores nuevos.

**Nota:** `npm run lint:css:fix` resuelve automáticamente los ~776 errores de formateo (`rule-empty-line-before`, `comment-whitespace-inside`, `declaration-empty-line-before`). Los 3 `CssSyntaxError` deben corregirse manualmente.

---

## Checklist antes de hacer merge

- [ ] `npm run lint:css` pasa sin errores nuevos
- [ ] No introduce `style=` inline en HTML estático
- [ ] No introduce propiedades de presentación directas en JS
- [ ] Si agrega clases nuevas de un carácter → documentarlas en la tabla de esta sección
- [ ] Variables nuevas declaradas en `locus-base.css`, no en el módulo individual
- [ ] Selector nuevo en el módulo correcto según tabla de arquitectura
- [ ] Keyframes nuevos pueden usar kebab-case — documentar si usa camelCase
