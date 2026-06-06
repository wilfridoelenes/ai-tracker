# Brief · Fase 3 ESM — locus-sprint-project.js
<!-- Proyecto: Locus | Creado: 2026-06-06 | Autor: Cael | Consultar al cierre de R Fase 2 -->

---

## Prerequisito

Este brief se activa cuando el R de Fase 2 (locus-sesiones.js) está en status `done` y Finn ha cerrado la sesión de cierre del R.

**Motivo:** locus-sprint-project.js importa de locus-sesiones.js. Especificar Fase 3 antes deja la dirección de referencia sucia — el patrón de desacoplamiento puede cambiar una vez que sesiones esté limpio.

---

## Contexto del hub

| Campo | Valor |
|---|---|
| Módulo | locus-sprint-project.js |
| Ciclos activos | 16 pares bidireccionales |
| Posición en grafo | Segundo hub máximo — conectado con sesiones, render, docs, reports, popup, analytics, backlog |

---

## Módulos ciclados conocidos

| Módulo | Observación |
|---|---|
| locus-sesiones.js | Resuelto en Fase 2 — verificar que el ciclo desapareció antes de atacar sprint-project |
| locus-backlog-render.js | Hub secundario — 10 ciclos propios, Fase 4 |
| locus-docs.js | Ciclo con map-generator |
| locus-reports.js | Ciclo con sprint-project y sesiones |
| locus-session-popup.js | Ciclo con sprint-project |
| locus-analytics-render.js | Ciclo con sprint-project |
| locus-sprint-planificacion.js | Ciclo con sprint-project y backlog-render |
| locus-sesiones-capture.js | Ciclo con sprint-project |
| locus-sesiones-stats.js | Ciclo con sprint-project |

---

## Preguntas abiertas al especificar

1. ¿Cuántos de los 16 ciclos siguen activos tras Fase 2? — correr script de detección antes de descomponer en Ts.
2. ¿El patrón shell:render-tracker es suficiente o sprint-project requiere un evento distinto (ej: shell:render-sprint)?
3. ¿locus-sprint-planificacion.js se ataca en este R o en Fase 4 junto a backlog-render?

---

## Secuencia sugerida al especificar

1. Correr script de detección de ciclos sobre codebase post-Fase 2.
2. Identificar los pares que siguen activos con locus-sprint-project.js como nodo.
3. Agrupar por patrón de desacoplamiento — event dispatch vs mover función vs import directo seguro.
4. Descomponer en Ts con el mismo criterio que Fase 2: un T por cluster de módulos afectados.

---

## Sprint sugerido

`PP-S-02 · Ciclos ESM Fase 2 · Sprint-Project · Clusters` — el nombre ya incluye Sprint-Project.
Asignar al mismo sprint si la carga lo permite, o abrir PP-S-03 si el effort acumulado supera la velocidad histórica.
