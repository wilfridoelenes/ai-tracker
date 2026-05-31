# PP-BRIEF_ESModules_2026-05-25.md
<!-- Proyecto: Locus | Fecha: 2026-05-25 | Rol: PO · Cael | Tipo: Brief de sesión estratégica -->

---

## Contexto

Sesión de análisis técnico de Locus con objetivo de identificar cómo simplificar la arquitectura y reducir errores estructurales. Archivo analizado: `locus-storage.js` + `index.html`.

---

## Diagnóstico

### Problema raíz

Locus usa 41 módulos JS cargados como scripts globales en `index.html`. Sin sistema de módulos real (`import/export`), cada módulo que depende de otro no puede garantizar que ese módulo ya cargó al momento de ejecutarse.

El resultado acumulado es una arquitectura defensiva:

- **219 inline handlers** (`onclick`, `oninput`, `onkeydown`, etc.) en `index.html` — funciones llamadas directamente desde HTML
- **Guards `typeof fn === 'function'`** en ~40+ call sites — verifican si una función existe antes de llamarla
- **Parches sobre parches** — bugs corregidos localmente sin rediseño (T-525, B-202605-XXX, etc.)
- **Acoplamiento implícito** — `locus-storage.js` es llamado por prácticamente todos los módulos sin contrato formal

### Hallazgos específicos en locus-storage.js

| # | Problema | Riesgo |
|---|---|---|
| 1 | `_effectiveVersion()` llama `getActiveSprints()` sin guard — crash si carga antes | Silencioso en arranque |
| 2 | `_renderAfterAuth()` tiene 6 dependencias externas sin contrato | Crash si módulo no cargó |
| 3 | `_loadFromSupabase()` muta `ITEMS` directamente — sin rollback si falla a mitad | Backlog corrupto |
| 4 | Auth duplicada: `onAuthStateChange` + `getSession()` pueden disparar doble load | Race condition |
| 5 | `getAllSessions()` tiene `console.warn` en el happy path | Ruido en logs en cada render |

---

## Decisión estratégica

**Migrar Locus a ES Modules nativos** (`import/export` + `<script type="module">`).

### Por qué ahora

- 41 módulos actuales. A 60-70 la migración es proporcionalmente más costosa.
- El momento óptimo es antes de agregar features nuevas, no después.
- Resuelve permanentemente: guards, orden de carga frágil, acoplamiento implícito, dificultad de testing.

### Lo que resuelve

| Problema actual | Con ES Modules |
|---|---|
| Guards `typeof` en 40+ call sites | Desaparecen — import falla explícito |
| Orden de carga frágil en index.html | Browser lo resuelve por grafo de dependencias |
| Bugs de "función no disponible al arranque" | Imposibles con imports explícitos |
| Acoplamiento implícito entre módulos | Cada módulo declara exactamente qué necesita |

### Lo que NO resuelve por sí solo

- Módulos de 1800+ líneas → refactor de responsabilidades separado
- Race condition en auth → rediseño del flujo de init (Fase 3)
- Mutación directa de ITEMS → patrón de estado más robusto (Fase 3)

---

## Bloqueante descubierto

**Los inline handlers impiden la migración directa.**

ES Modules son scoped — las funciones no están en `window` automáticamente. Los 219 `onclick` inline en `index.html` dejarían de funcionar el día 1.

**Orden obligatorio:** eliminar handlers primero → convertir a modules después.

---

## Auditoría de inline handlers

**Total:** 219 handlers · 27 módulos destino

| Módulo | Handlers |
|---|---|
| locus-ui-shell | 23 |
| locus-reports | 21 |
| locus-backlog-core | 19 |
| locus-sprint-project | 19 |
| locus-item-editor | 14 |
| locus-misc-ui | 12 |
| locus-storage | 11 |
| locus-contracts | 9 |
| locus-backlog-sprints | 7 |
| locus-modals | 7 |
| locus-checkpoint-capture | 8 |
| locus-map-generator | 8 |
| locus-checkpoint-stats | 6 |
| locus-checkpoint-viz | 6 |
| locus-docs | 6 |
| Resto (12 módulos) | ≤5 c/u |

---

## Plan de migración — 6 Rs en backlog

### Fase 1A — Módulos aislados (bajo riesgo)
`locus-item-editor` · `locus-modals` · locus-checkpoint-capture` · `locus-map-generator` · `locus-contracts` · `locus-docs`
- 6 módulos · ~58 handlers · sin dependencias globales críticas
- Effort 2

### Fase 1B — Navegación global (riesgo medio)
`locus-ui-shell` · `locus-radar` · `locus-pulso` · `locus-sprint` · `locus-tracker` · `locus-tracker-utils` · `locus-workers`
- 7 módulos · 43 handlers · afectan layout principal
- Effort 2

### Fase 1C — Backlog (riesgo medio-alto)
`locus-backlog-core` · `locus-backlog-item` · `locus-backlog-sprints` · `locus-sprint-project` · `locus-misc-ui`
- 5 módulos · 63 handlers · corazón del backlog
- Effort 3

### Fase 1D — Storage, auth y danger zones (riesgo alto)
`locus-storage` · `locus-checkpoint-viz` · `locus-checkpoint-stats` · `locus-reports` · `locus-session-save` · `locus-session-parse` · `locus-map-viewer` · `locus-checkpoint-hoy`
- 8 módulos · 55 handlers · auth + sync + danger zones
- Effort 3

### Fase 2 — Convertir a ES Modules
- Todos los `<script src=...>` → `<script type="module" src=...>`
- Cada módulo declara `export` e `import` explícitos
- Zero guards `typeof` — consecuencia natural de imports
- Effort 3

### Fase 3 — Blindar contrato de locus-storage.js
- `_loadFromSupabase` con rollback
- Guard anti-doble-load en auth
- Invariants documentados en contrato formal
- Effort 2

---

## Regla de proceso

**QA de Finn es obligatorio al cerrar cada fase antes de abrir la siguiente.** Sin excepción.

---

## Próximo paso

Abrir sprint en Locus con los 6 Rs. Adjuntar archivos de Fase 1A para que Rune especifique los Ts ejecutables:

- `locus-item-editor.js`
- `locus-modals.js`
- `locus-checkpoint-capture.js`
- `locus-map-generator.js`
- `locus-contracts.js`
- `locus-docs.js`

---

## Archivos analizados en sesión

- `locus-storage.js` — 1,432 líneas
- `index.html` — 1,834 líneas
- `PP-CONTEXT_V2_7.md`
- `PP-STRATEGY_V1_9.md`
- `PP-MAP_v1_2_3.md`

---
*Generado por Cael (PO+BA) · Obsidian Labs · 2026-05-25 UTC-6*


## Contexto del proyecto (carry forward)
Proyecto: Locus (AI Tracker) — herramienta interna del ecosistema Obsidian Labs.
Stack: Single-file HTML (index.html) + 41 módulos JS externos (locus-*.js) + 17 archivos CSS + Supabase.
Archivos de proyecto cargados: OB-STRATEGY, __BR-Core, __BR-Ecosystem, __BR-Execution, __Role-Cael, __Role-Rune, __Role-Finn, PP-CONTEXT, PP-STRATEGY.
## Intención declarada
Migrar la arquitectura JS de Locus de su estado actual a un modelo limpio con tres propiedades:
1. Zero onclick= / oninput= / onchange= inline en index.html — reemplazados por addEventListener en el módulo dueño.
2. Zero handlers inline en HTML dinámico generado por JS — reemplazados por event delegation en contenedor padre estático.
3. Zero typeof guards como sistema de dependencias implícitas — eliminados como consecuencia de convertir a ES Modules (type=module) con import/export explícitos.
## Tu tarea
Actúa como Cael (PO+BA) del ecosistema Obsidian Labs.
Antes de cualquier output, ejecuta una auditoría completa del código real adjunto:
**Paso 1 — Medir Capa A (handlers estáticos en index.html):**
Contar todos los onclick=, oninput=, onchange=, onkeydown=, ondragover=, ondrop=, ondragleave= en index.html. Agrupar por módulo JS destino (la función que invocan). Producir tabla: módulo · cantidad de handlers.
**Paso 2 — Medir Capa B (handlers en HTML dinámico):**
Contar los mismos atributos de evento embebidos en template literals / innerHTML dentro de cada módulo JS. Agrupar por módulo. Producir tabla: módulo · cantidad.
**Paso 3 — Medir Capa C (typeof guards):**
Contar ocurrencias de typeof  por módulo JS. Producir tabla: módulo · cantidad. Total global.
**Paso 4 — Identificar estado actual de addEventListener y DOMContentLoaded:**
Por módulo, contar addEventListener existentes y presencia de DOMContentLoaded. Esto muestra qué ya está parcialmente migrado.
**Paso 5 — Producir el plan:**
Con los números reales de la auditoría, definir los Rs necesarios para conseguir la intención declarada. Cada R debe tener: título, scope exacto (qué módulos toca, cuántos handlers), criterios de aceptación verificables, effort (1/2/3), dependencias entre Rs, y quién ejecuta (Rune / Finn QA). No inventar scope — derivarlo exclusivamente de los números de la auditoría.
**Paso 6 — Emitir CHECKPOINT:**
Emitir los Rs en formato canónico del ecosistema (bloque ---ITEMS--- con campo intencion completo) listos para pegar en Locus.
## Restricciones
- No emitir ningún Rs sin haber completado los 5 pasos de auditoría primero.
- No asumir que los números de una auditoría previa siguen siendo válidos — el código fue modificado. Medir contra los archivos adjuntos en esta sesión.
- Los Rs de Capa B (handlers dinámicos) y Capa A (handlers estáticos) son estrategias distintas — no colapsarlos en un solo R.
- Los typeof guards NO se migran directamente — desaparecen como consecuencia de ES Modules. No crear un R de "eliminar typeof guards".
- Effort máximo por R: 3. Si el scope es mayor, partir en sub-Rs con dependencia explícita.
- Todo R que toque UI requiere consulta a Nova antes de emitir AC — declararlo en el R si aplica.
## Archivos a adjuntar en esta sesión
Adjuntar todos los archivos del proyecto antes de responder:
index.html + los 41 módulos locus-*.js + PP-CONTEXT + PP-STRATEGY + archivos BR del ecosistema.