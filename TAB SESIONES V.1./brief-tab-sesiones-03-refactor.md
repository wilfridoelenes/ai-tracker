# Brief · Tab Sesiones · Etapa 3 — Refactor
<!-- Proyecto: Locus · Rol: UX · Nova + FS · Rune · Generado: 2026-06-08 -->
<!-- Contexto: resultado de sesiones de análisis estructural + auditoría de deuda del Tab Sesiones -->

---

## Objetivo de la etapa

Identificar y ejecutar refactors de estructura, naming y separación de responsabilidades en el Tab Sesiones. El análisis base ya existe — esta etapa convierte los hallazgos en Ts ejecutables.

Archivos requeridos para esta sesión:
- `locus-sesiones.js` (mod actual)
- `locus-sesiones-arranque.js`
- `locus-sesiones-utils.js`
- `locus-sesiones-card.css`
- `locus-sesiones.css`
- `index.html`
- `_Locus-css-ref` (versión actual)
- `_Locus-module-contracts` (si existe)

---

## Hallazgos base — candidatos a refactor

### Refactor 1 · _renderTrackerSidebar() — función activa en contenedor invisible
**Severidad: Alta**

`_renderTrackerSidebar()` se invoca en cada ciclo de `render()` (línea 484 de `locus-sesiones.js`). Renderiza HTML en `#tsb-insession`, `#tsb-available` y `#tsb-exhausted` — tres contenedores dentro de `#tracker-sidebar` que tiene `.is-hidden` permanente.

Adicionalmente corre un ticker (`_startSidebarTicker` / `_stopSidebarTicker`) que actualiza countdowns en `.tsb-ai-cd` cada minuto sobre el DOM oculto.

**Pregunta de diseño a responder antes de ejecutar:**
¿`tracker-mini-hist-panel` (col 1 del grid) reemplaza completamente la funcionalidad del legacy sidebar?

| Funcionalidad del sidebar | ¿Cubierta por mini-hist? |
|---|---|
| Lista Workers en sesión / disponibles / agotados | Por confirmar |
| Countdown de resetTime en Workers agotados | Por confirmar |
| Toggle de Workers archivadas | Por confirmar |
| Selección de Worker activo (`_trackerSelectedId`) | Por confirmar |

**Si la respuesta es sí en todos:** el refactor es eliminación completa:
- `_renderTrackerSidebar()` y su lógica interna
- `_startSidebarTicker()` + `_stopSidebarTicker()`
- Handler de `.tsb-archived-toggle` (línea 1356)
- Markup de `#tracker-sidebar` en index.html (L214–218)
- Clases CSS `tsb-*` en `locus-sesiones.css`

**Si la respuesta es no:** el sidebar debe hacerse visible o la funcionalidad debe migrarse al mini-hist antes de eliminar.

---

### Refactor 2 · buildCard() — función monolítica de ~250 líneas
**Severidad: Media**

`buildCard()` en `locus-sesiones.js` (L829–~1090) construye toda la AI Card en una sola función. Contiene:

- Lógica de estado (`available` / `exhausted` / `interrupted` / `insession`)
- Construcción de HTML de historial de sesiones (`_buildSessRow`)
- Construcción de zona central condicional por estado
- Construcción de footer condicional por estado
- Construcción de stats bar
- Lógica de proyecto activo (`_sesSPCallbacks`)
- Lógica de sprint activo de la card
- Lógica de stale suggestion

**Propuesta de partición:**

| Sub-función | Responsabilidad |
|---|---|
| `_buildCardHeader(ai)` | Avatar + badge de estado + sprint ID + menú |
| `_buildCardStats(ai)` | Stats bar — 3 columnas |
| `_buildCardStepper(ai)` | Stepper de 3 pasos |
| `_buildCardCentral(ai)` | Zona central condicional por estado |
| `_buildCardFooter(ai)` | Footer condicional por estado |
| `_buildCardHistory(ai)` | Historial de sesiones |
| `buildCard(ai)` | Orquestador — ensambla las sub-funciones |

**Criterio de partición:** cada sub-función cubre un bloque visual independiente de la card. `buildCard` queda como orquestador puro sin lógica propia.

---

### Refactor 3 · Naming — prefijos mixtos en el tab
**Severidad: Baja**

El tab mezcla varios sistemas de naming sin una regla clara de cuándo usar cada uno:

| Prefijo | Uso actual | ¿Coherente? |
|---|---|---|
| `sc-*` | AI Card rediseñada (header, stats, stepper, footer) | Sí — familia definida |
| `tracker-*` | Grid, columnas, preview, view-header | Sí — familia definida |
| `tsb-*` | Legacy sidebar (rows, dots, countdown) | Legacy — candidato a eliminar |
| `card-*` | Menú dropdown de la card, countdown | Mixto — `card-dot-*` coexiste con `sc-*` |
| `sess-*` | Filas de sesión dentro de la card | Sí — familia definida |
| `paste-*` | Zona de ingesta (textarea, wrap, label) | Sí — familia definida |
| `log-card-*` | Log de acciones del Worker | Sí — familia definida |
| `blind-exhaust-*` | Agotamiento ciego desde footer | Sí — familia definida |

**Candidatos a unificación:**
- `card-dot-*` → migrar a `sc-menu-*` para coherencia con `sc-*`
- `tsb-*` → eliminar junto con el sidebar legacy

**Nota:** el refactor de naming es el último en ejecutarse — después de eliminar legacy y partir `buildCard`. Renombrar antes de eliminar duplica el trabajo.

---

### Refactor 4 · CSS — clases en locus-sesiones.css sin relación con el tab
**Severidad: Baja — pendiente de auditoría**

`locus-sesiones.css` tiene 7,577 líneas. No se auditó el archivo completo en las sesiones anteriores. Es probable que contenga clases de componentes que ya no existen o que migraron a otros módulos CSS.

**Acción en sesión:** auditar secciones del archivo para identificar bloques sin uso activo. Herramienta: `grep` contra todos los JS del tab para verificar qué clases se referencian.

---

## Dependencias entre refactors

```
Refactor 1 (sidebar) ──────► debe completarse antes de Refactor 3 (naming tsb-*)
Refactor 2 (buildCard) ─────► independiente — puede ejecutarse en paralelo con Refactor 1
Refactor 3 (naming) ────────► depende de Refactor 1 completo
Refactor 4 (CSS audit) ─────► independiente — puede ejecutarse en cualquier momento
```

---

## Orden sugerido de trabajo en sesión

1. Responder pregunta de diseño de Refactor 1 (mini-hist vs sidebar) — decisión del founder
2. Si respuesta es sí → ejecutar Refactor 1 completo (eliminar sidebar + ticker + markup + CSS)
3. Ejecutar Refactor 2 (partir buildCard) — sesión de Rune con Cael especificando los Ts
4. Ejecutar Refactor 3 (naming) — después de Refactor 1
5. Auditoría de CSS (Refactor 4) — sesión independiente

---

## Notas para Cael al especificar

- Refactor 1 y 2 son Effort 2 cada uno — requieren sesión dedicada de Rune
- Refactor 3 es Effort 1 si Refactor 1 ya está done — solo renaming de `card-dot-*`
- Refactor 4 requiere auditoría antes de estimar effort
- Los tres refactors de código tocan `locus-sesiones.js` — no pueden ejecutarse en paralelo (mismo archivo)
