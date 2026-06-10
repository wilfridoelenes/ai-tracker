# Brief Finn — Auditoría Total Locus · Alineación BR infra_version 16
<!-- Emitido por: ST · Vera | Fecha: 2026-06-09 | Proyecto: Locus -->
<!-- Docs de referencia: BR-Core v2.2 · BR-Ecosystem v3.14 · BR-Execution v2.6 · OB-Strategy v4.7 -->

---

## Contexto

Este brief cubre una auditoría total del proyecto Locus — docs de proyecto, Doc Refs y repo completo — contra las BR en infra_version 16. El objetivo es producir un plan de alineación ejecutable: Rs y Ts con AC, priorizados y listos para entrar al backlog.

**Documentos que Finn debe tener adjuntos en sesión:**
- `__BR-Core v2.2` · `__BR-Ecosystem v3.14` · `__BR-Execution v2.6`
- `_pp-context-v1.0.12.md`
- `_pp-strategy-v1.0.12.md`
- `PP-BACKLOG v0.2.0`
- Archivos reales del repo (ZIP o archivos individuales)

---

## Pre-diagnóstico de Vera — hallazgos ya confirmados

Vera auditó el repo antes de emitir este brief. Lo siguiente es ground truth — Finn no necesita re-verificarlo, solo usarlo como base para los ACs de los ítems que emita.

### Docs de proyecto

| Doc | infra_version declarada | infra_version activa | Gap |
|---|---|---|---|
| `_pp-context-v1.0.12` | 9 | 16 | 7 versiones |
| `_pp-strategy-v1.0.12` | 9 | 16 | 7 versiones |
| `PP-BACKLOG v0.2.0` | 8 | 16 | 8 versiones |

Los tres docs de proyecto necesitan actualización de `infra_version` a 16 con versiones correctas: `BR-Core v2.2 · BR-Ecosystem v3.14 · BR-Execution v2.6 · OB-Strategy v4.7`.

### Headers de identidad — repo

**JS sin header:**
- `env.js` — sin header
- `locus-analytics-charts.js` — sin header
- `locus-map-viewer.js` — sin header

**CSS sin header (10 archivos):**
- `locus-analytics.css`
- `locus-archive.css`
- `locus-base.css`
- `locus-docs.css`
- `locus-document-generator.css`
- `locus-modals.css`
- `locus-proyectos.css`
- `locus-radar.css`
- `locus-sprint-close.css`
- `locus-sprint-plan.css`

### Estado de migración ESM

| Métrica | Valor |
|---|---|
| `window.X` assignments activos (excluyendo `window.state`, `window.Locus`, browser APIs) | ~182 líneas en 35 módulos |
| `typeof window.` guards | 22 en 11 módulos |
| Inline handlers en templates JS (`onclick=`, `onchange=`, `oninput=`) | ~16 en 11 módulos |
| `window.state` consumido vía `window.` sin import | `locus-backlog-core.js` (2 refs) · `locus-backlog-item.js` (1 ref) |

Los módulos con mayor carga de `window.X`: `locus-reports.js` (20) · `locus-sprint-project.js` (20) · `locus-ui-shell.js` (17) · `locus-docs.js` (18) · `locus-workers.js` (15).

### CSS Purity

| Violación | Archivo | Detalle |
|---|---|---|
| `style.*=` assignments | `locus-sesiones-viz.js` | 5 — CSS vars dinámicas + transiciones de barra de progreso |
| `style.*=` assignments | `locus-analytics-core.js` | 2 — posicionamiento de tooltip |

Las de `locus-sesiones-viz.js` incluyen `style.transition` y `style.width` para animación de barra (progreso de CHECKPOINT) — evaluar si son candidatas a clase CSS + CSS animation, o si la excepción es justificable.

### Valores hardcodeados desactualizados en código

| Módulo | Variable | Valor actual | Valor correcto |
|---|---|---|---|
| `locus-session-parse.js` | `_INFRA_VERSION_ACTIVE` | `14` | `16` |
| `locus-backlog-generator.js` | `INFRA_VERSIONS.infraVersion` | `8` | `16` |
| `locus-backlog-generator.js` | `INFRA_VERSIONS.brCore` | `2.1` | `2.2` |
| `locus-backlog-generator.js` | `INFRA_VERSIONS.brEcosystem` | `3.8` | `3.14` |
| `locus-backlog-generator.js` | `INFRA_VERSIONS.brExecution` | `2.4` | `2.6` |
| `locus-backlog-generator.js` | `INFRA_VERSIONS.obStrategy` | `4.3` | `4.7` |

### Estado de implementación de reglas BR16 — verificado en código

| Regla BR | Estado en código |
|---|---|
| D2 — bloqueo T `en-revision` + `sprint: icebox` | ✅ Implementado — `locus-session-parse.js` L436-440 |
| D3 — R sin Ts válidos → conversión a P | ✅ Implementado — `locus-backlog-core.js` L694-709 |
| D4 — alerta `infra_version` desactualizada | ✅ Implementado — `locus-session-parse.js` L793-804 · pero valor `_INFRA_VERSION_ACTIVE = 14` (desactualizado) |
| D5 — herencia sprint parent→hijo | ✅ Implementado — `locus-backlog-sprints.js` L626-678 |
| D1 — transición `bloqueado` solo por Finn | ❌ No detectado en código |
| D6 — conflicto DOC-UPDATEs misma sección | ❌ No detectado — `locus-docs.js` tiene detección de conflicto dentro de sesión pero no entre CHECKPOINTs distintos del mismo sprint |
| 2a — S-HOTFIX sprint persistente | ❌ No implementado |
| 2b — `inline_fix` indexado por Locus | ❌ No implementado |
| 2c — R sin AC rechazado al parsear | ⚠️ Implementado como warning visual (tag "sin AC") pero no como bloqueo total del CHECKPOINT |
| 2f — `sprint_proposal` omitido vs `null` | ⚠️ Verificar comportamiento del parser ante `sprint_proposal: null` |
| 2g — regla transitoria DOC-UPDATE con MD | ❌ No implementada como recordatorio en UI |

---

## Trabajo de Finn en esta sesión

### Parte 1 — Auditoría de gaps no cubiertos por el pre-diagnóstico

Vera auditó los datos cuantitativos. Finn audita lo que requiere lectura de código y criterio de QA:

**1a. CSS Purity — `locus-sesiones-viz.js`**
Leer las 5 asignaciones `style.*=` y determinar:
- ¿Cuáles son candidatas a clase CSS + CSS animation? → emitir T con AC
- ¿Cuáles son excepciones justificadas (valor calculado dinámicamente que CSS no puede representar)? → documentar en CONTEXT como excepción declarada con criterio

**1b. CSS Purity — `locus-analytics-core.js`**
Leer las 2 asignaciones de posicionamiento de tooltip (`style.left`, `style.top`):
- Si son valores calculados desde JS (posición del cursor) → excepción justificada, documentar
- Si son valores fijos → candidatas a clase CSS, emitir T

**1c. D6 — Detección de conflicto DOC-UPDATEs**
`locus-docs.js` detecta conflicto de secciones dentro de la misma sesión (mismo CHECKPOINT). La regla BR-Ecosystem §12 requiere detección entre CHECKPOINTs distintos del mismo sprint. Finn verifica el gap exacto y emite T o R según el effort.

**1d. `window.state` — R-202606-003 en PP-S-02**
Verificar que los 3 call sites de `window.state` en `locus-backlog-core.js` y `locus-backlog-item.js` están cubiertos por los ACs de R-202606-003 y T-202606-023. Si hay call sites no cubiertos → emitir B o T hijo.

**1e. Inline handlers restantes**
Los módulos en PP-S-01 (T-202606-007 a T-202606-011) cubren `locus-analytics-core`, `locus-analytics-render`, `locus-backlog-merge`, `locus-backlog-panel`, `locus-projects`, `locus-sesiones`. Verificar los módulos con handlers que NO están en el sprint activo:
- `locus-backlog-archive.js` (1 handler)
- `locus-backlog-core.js` (1 handler)
- `locus-backlog-editor.js` (1 handler)
- `locus-backlog-sprints.js` (1 handler)
- `locus-session-hora.js` (1 handler)
- `locus-sprint-plan.js` (1 handler)

Para cada uno: ¿está cubierto por un T existente en el backlog, o falta un T?

---

### Parte 2 — Plan de alineación ejecutable

Con base en el pre-diagnóstico y la auditoría de Parte 1, Finn emite el plan de alineación como Rs y Ts con AC listos para backlog. Usar `[pendiente-ID]` para códigos. Agrupar por R cuando el trabajo es coherente — T directo solo si es atómico sin R padre existente.

**Rs sugeridos para el plan (Finn confirma o ajusta tras auditoría):**

| R sugerido | Contenido | Effort estimado |
|---|---|---|
| R-infra-version-sync | Actualizar `_INFRA_VERSION_ACTIVE` en `locus-session-parse.js` + `INFRA_VERSIONS` en `locus-backlog-generator.js` a valores infra_version 16 | 1 |
| R-headers-faltantes | Agregar headers de identidad a 3 JS + 10 CSS sin header — formato `__BR-Execution §9` | 1 |
| R-docs-infra-version | Actualizar `infra_version` en `_pp-context`, `_pp-strategy` y `PP-BACKLOG` a 16 con versiones correctas | 1 |
| R-hotfix-sprint | Implementar sprint S-HOTFIX persistente por proyecto — BR-Core §6 | 2 |
| R-inline-fix-parser | Implementar indexado de bloque `inline_fix` en parser — BR-Core §7 + BR-Ecosystem §8 | 1 |
| R-checkpoint-r-sin-ac | Elevar warning de R sin AC a bloqueo total de CHECKPOINT — BR-Ecosystem §5 | 1 |
| R-d1-bloqueado-finn | Validar que transición `bloqueado` en R solo aplica desde CHECKPOINT de Finn — D1 | 1 |
| R-d6-docupdate-conflict | Detectar conflicto de DOC-UPDATEs entre CHECKPOINTs distintos del mismo sprint — D6 | 2 |
| R-css-purity | Resolver violaciones CSS Purity en `locus-sesiones-viz.js` y `locus-analytics-core.js` — o documentar excepciones | 1 |
| R-inline-handlers-restantes | Migrar inline handlers en módulos no cubiertos por PP-S-01 | 1 |

---

### Parte 3 — Schema v2 en backlog PP-S-01

Finn verifica los gaps de schema v2 identificados por Vera y emite patches donde corresponde:

| Gap | Ítems | Acción de Finn |
|---|---|---|
| `triggered_by` ausente | B-202606-002 | Emitir patch — campo obligatorio en B |
| `contract_update` ausente | T-202606-005 · T-202606-011 · T-202606-023 (Effort 2) | Emitir patch — obligatorio en Effort 2+ |
| `depends_on` ausente | Todos los Ts (23) | Cael es responsable — Finn señala en CHECKPOINT si detecta dependencias implícitas no declaradas |
| `no_incluye` ausente | Todos los Ts (23) | Cael es responsable — Finn señala |

---

## Output esperado de la sesión de Finn

Un CHECKPOINT con:

1. **`---ITEMS---`** con Rs y Ts del plan de alineación — códigos `[pendiente-ID]`, ACs cerrados, `parent` declarado, `depends_on` declarado, `sprint: icebox`
2. **Patches** para `triggered_by` de B-202606-002 y `contract_update` de los 3 Ts de Effort 2
3. **Observaciones** en `---OBSERVACIONES-FINN---` para gaps que no tienen AC definibles sin decisión del founder (ej: excepciones CSS Purity)
4. **`---EXECUTION-PLAN---`** con secuencia de sesiones de Rune ordenada por dependencias

El CHECKPOINT de Finn es el input directo para Cael — quien abre sprint y asigna ítems sin necesidad de refinamiento adicional.

---

*Brief emitido por Vera (ST) — sesión de auditoría total Locus · infra_version 16.*
