# Brief · Tab Sesiones · Etapa 2 — Documentación
<!-- Proyecto: Locus · Rol: UX · Nova · Generado: 2026-06-08 -->
<!-- Contexto: resultado de sesiones de análisis estructural + auditoría de deuda del Tab Sesiones -->

---

## Objetivo de la etapa

Cerrar los gaps documentales identificados en las sesiones de análisis. Los gaps están distribuidos en tres documentos: `_Locus-ux-ref`, `_Locus-css-ref` y `_Locus-ui-Inventory`.

Archivos requeridos para esta sesión:
- `_Locus-ux-ref-v2.1.0.md` (mod:1 — versión actual)
- `_Locus-css-ref` (versión actual)
- `_Locus-ui-Inventory` (versión actual)
- `locus-sesiones-card.css` (referencia de implementación)

---

## Gaps confirmados — UX-ref

### Gap 1 · Estados de AI Card
Los 5 estados reales de la card no están documentados en UX-ref. El JS los implementa pero no hay contrato declarado.

**Estados a documentar:**

| Estado | Clase `.card` | Badge | Zona central | Footer |
|---|---|---|---|---|
| `available` | `available` | `.sc-badge.sc-badge--avail` | Textarea + stepper 3 pasos | `.sc-footer` + blind exhaust |
| `insession` | `available in-session-state` | `.sc-badge` + dot animado | Textarea + stepper activo | `.sc-footer` |
| `interrupted` | `available interrupted-state` | `.sc-badge` (avail) | Banner "⚡ Checkpoint en curso" + "Continuar →" | `.sc-footer` |
| `exhausted-con-hora` | `exhausted` | `.sc-badge.sc-badge--exhausted` | Countdown dramático + hora reset | `.sc-footer--exhausted` |
| `exhausted-sin-hora` | `exhausted` | `.sc-badge.sc-badge--exhausted` | "Sin hora de desbloqueo" + CTA asignar | `.sc-footer--exhausted` |

**Sección destino:** nueva sección en UX-ref — propuesta: `§I — AI Card · Estados`.

---

### Gap 2 · Grid tracker-3col — proporciones canónicas
El split de columnas no está documentado. Está implementado en CSS pero sin declaración en UX-ref.

**Proporciones a documentar:**

| Estado del tab | Columnas | grid-template-columns |
|---|---|---|
| Reposo (sin sesión seleccionada) | Col1 / Col2 / Col3 | `40fr 60fr 0fr` |
| Con sesión seleccionada (`.preview-open`) | Col1 / Col2 / Col3 | `30fr 40fr 30fr` |

- Col 1 (`.tracker-col--card`): historial de sesiones del Worker — scrolleable independiente
- Col 2 (`.tracker-col--hist`): card del Worker + ingesta de CHECKPOINT
- Col 3 (`.tracker-preview`): detalle de sesión seleccionada — nace en 0fr

Transición animada con `var(--transition-base)`.

**Sección destino:** nueva entrada en `§E — Layout y estructura` → `E-08`.

---

### Gap 3 · Patrón 0fr → Nfr (paneles expandibles)
Col 3 existe en el DOM con `0fr` y se expande al agregar clase en el padre. Este patrón no está documentado como canónico.

**Patrón a documentar:**
- El panel existe siempre en el DOM — no se genera dinámicamente
- Visibilidad controlada por `grid-template-columns` en el contenedor padre via clase (ej: `.preview-open`)
- La columna en `0fr` tiene `overflow: hidden` — su contenido no es visible ni interactuable
- La transición es en el contenedor padre — no en la columna

**Sección destino:** entrada en `§E — Layout y estructura` → `E-09`, o como sub-patrón de `E-08`.

---

### Gap 4 · Patrón #ckpt-panel — flujo post-parse
El panel slide-in que aparece después de parsear un CHECKPOINT no tiene entrada en UX-ref. Es el momento más importante del tab.

**Comportamiento a documentar:**
- Trigger: parseo exitoso de CHECKPOINT en la textarea
- Comportamiento: slide-in desde la derecha dentro de col 2
- Contenido: barra de progreso del DIFF + resultado por secciones
- Cierre: botón `#ckpt-reopen-btn` permite reabrirlo
- CSS: prefijo `ckpt-` en `locus-modals.css`

**Pendiente de confirmación:** adjuntar `locus-session-parse.js` y `locus-session-save.js` para verificar el flujo exacto antes de documentar.

**Sección destino:** nueva sección en UX-ref — propuesta: `§J — Flujos de ingesta`.

---

### Gap 5 · Regla de triggers automáticos
`#weekly-summary-modal` se activa automáticamente los lunes. Es el único caso de interrupción no solicitada en todo el producto. No hay regla en UX-ref que declare cuándo esto es válido.

**Regla a declarar:**
- Cuándo un trigger automático es válido (frecuencia, contexto, tab activo)
- Si debe tener opción de dismiss permanente
- Si persiste entre sesiones si el usuario no interactúa
- Cuántos triggers automáticos máximos puede tener el producto simultáneamente

**Sección destino:** nueva entrada en `§G — Feedback al usuario` → `G-05`.

---

## Gaps confirmados — CSS-ref

### Gap 6 · .sc-badge--avail y .sc-badge--exhausted sin declaración
Estas variantes se aplican desde JS en `buildCard()` pero no tienen declaración en `locus-sesiones-card.css` ni en CSS-ref.

**Tokens sugeridos (a validar en sesión):**
- `.sc-badge--avail`: usar tokens `var(--c-low-*)` o variante neutra — estado positivo sin urgencia
- `.sc-badge--exhausted`: usar tokens de severidad media — estado de bloqueo sin alarma

**Acción en sesión:**
1. Nova declara las dos variantes en `locus-sesiones-card.css`
2. Nova registra las variantes en CSS-ref `§AI Card rediseño — familia sc-*`
3. Rune no necesita cambios — JS ya aplica las clases

---

## Gaps confirmados — UI Inventory

### Gap 7 · #search-global marcado como presente
UX-ref F-01 declara explícitamente que `#search-global` fue eliminado del DOM y reemplazado por Command Palette. Sin embargo UI Inventory §5 lo lista como presente con estado `limpio`.

**Acción:** confirmar estado real en index.html y actualizar el doc incorrecto.
- Si fue eliminado → eliminar entrada del UI Inventory §5
- Si sigue presente → actualizar UX-ref F-01

**Nota:** ningún módulo JS de los adjuntos referencia `#search-global` — apunta a que UX-ref F-01 es correcto y el UI Inventory está desactualizado.

---

## Orden sugerido de trabajo en sesión

1. Resolver Gap 7 primero — corrección puntual, despeja ambigüedad documental
2. Gaps 2 + 3 juntos — son parte del mismo sistema de layout
3. Gap 1 — estados de AI Card (requiere `locus-sesiones-card.css` adjunto)
4. Gap 6 — CSS de variantes de badge (produce entregable de código)
5. Gaps 4 + 5 — flujo de ingesta y triggers (Gap 4 requiere archivos JS adicionales)
