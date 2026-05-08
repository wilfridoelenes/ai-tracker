# Plan_de_Reset_del_Ecosistema_V1_1.md
<!-- Versión: 1.1 | Última actualización: 2026-05-08 | Plan de reset del ecosistema Obsidian Labs — alineado a OL-CONTEXT V1.4 -->

---

## 1. Plan de fases

| Fase | Nombre | Ejecuta | Done cuando | Archivos requeridos en sesión |
|---|---|---|---|---|
| 0a | Extracción ASVAB App | Cael | CONTEXT limpio + backlog pendiente real entregados como archivos | AS-CONTEXT actual · AS-BACKLOG export completo desde PP (sin filtro de status) |
| 0b | Extracción Content Manager | Cael | CONTEXT limpio + backlog pendiente real entregados como archivos | CM-CONTEXT_V0_5.md · CM-BACKLOG_v0_4.md · CM-BACKLOG export completo desde PP |
| 1 | Auditoría técnica PP | Rune | Informe técnico entregado en formato definido — sin preguntas abiertas | Archivos reales de PP (HTML principal + JS + CSS) — todos adjuntos |
| 2 | Auditoría funcional PP | Finn | Informe funcional entregado — gaps de AC y bugs clasificados | Archivos reales de PP + output de Fase 1 |
| 3 | Auditoría primer uso PP | Nova + Lena | Informe de experiencia + hallazgos de conversión entregados | Archivos reales de PP + outputs de Fase 1 y Fase 2 |
| 4 | Consolidación backlog nuevo | Cael | Backlog limpio de los tres proyectos listo — sin ítems flotantes sin cierre | Outputs de Fases 0a · 0b · 1 · 2 · 3 |
| 5 | Reset | Founder | Historial PP borrado · sesiones eliminadas · backlog viejo eliminado | N/A — acción manual del founder en PP |
| 6 | Sprint 1 limpio | Rune | Primer sprint ejecutado contra backlog nuevo con base en evidencia real | AS-CONTEXT nuevo · CM-CONTEXT nuevo · PP-CONTEXT nuevo · Backlogs de Fase 4 |

---

## 2. Dependencias

Dependencias explícitas — orden de bloqueo:

1. Fase 0a y 0b son paralelas — no se bloquean entre sí.
2. Fase 1 (Rune) requiere: Fase 0a ✓ y Fase 0b ✓ — Rune necesita contexto limpio de ambos proyectos para interpretar qué hace el código de PP en relación al ecosistema.
3. Fase 2 (Finn) requiere: Fase 1 ✓ — los hallazgos técnicos explican causas. Finn no audita síntomas sin saber qué está realmente roto.
4. Fase 3 (Nova + Lena) requiere: Fase 1 ✓ y Fase 2 ✓ — la experiencia de primer uso tiene sentido auditar cuando se sabe qué funciona y qué no.
5. Fase 4 (Cael) requiere: Fase 1 ✓ + Fase 2 ✓ + Fase 3 ✓ — el backlog nuevo se construye sobre evidencia de las tres auditorías, no sobre intención.
6. Fase 5 (Reset) requiere: Fase 4 ✓ — no se borra nada hasta que el backlog nuevo esté consolidado y los tres CONTEXTs limpios estén extraídos.
7. Fase 6 (Sprint 1) requiere: Fase 5 ✓ — el sprint limpio no arranca sobre el historial acumulado.

---

## 3. Outputs por auditoría

| Auditoría | Ejecuta | Entregable | Formato |
|---|---|---|---|
| 1 — Técnica | Rune | Informe técnico de Obsidian Tracker | Tabla: módulo · función · qué hace realmente · deuda técnica detectada · severidad (alta/media/baja). Un módulo por fila. Sin prose. |
| 1 — Técnica | Rune | Lista de archivos reales con funciones mapeadas | Formato MAP schema JSON (Base Rules §11) — listo para importar en PP |
| 2 — Funcional | Finn | Informe funcional de Obsidian Tracker | Tabla: flujo auditado · AC verificado (sí/no) · gap de especificación (si aplica) · bug detectado (tipo: crítico/mayor/menor) · pasos repro |
| 2 — Funcional | Finn | Lista de gaps de AC para Cael | Formato Base Rules §9 sección gap de especificación — uno por comportamiento sin AC |
| 3 — Primer uso | Nova | Informe de experiencia Obsidian Tracker | Tabla: pantalla/flujo · fricción detectada · principio violado (Nielsen/Gestalt/Fitts) · severidad · propuesta de mejora en una línea |
| 3 — Primer uso | Lena | Informe de hallazgos de conversión Obsidian Tracker | Tabla: momento del funnel · comportamiento observado · hipótesis de impacto en conversión · acción sugerida |
| 3 — Primer uso | Nova + Lena | Lista de Rs de experiencia y conversión para Fase 4 | Lista: título del R · ejecuta · prioridad sugerida (high/medium/low) · justificación en una línea |

---

## 4. Estado actual — post Fases 0a–3

Las fases 0a–3 están completadas. El backlog consolidado de Obsidian Tracker está entregado en `PP-BACKLOG-nuevo.md V1.1`.

**Correcciones aplicadas en esta versión del plan (V1.1):**

| Campo | Valor anterior | Valor corregido | Fuente |
|---|---|---|---|
| Sprint post-reset | `PP-S-26` | `PP-S-01` | OL-CONTEXT V1.4 §19 — decisión 2026-05-07 |
| Version target sprint post-reset | no declarado | `v1.0.0` | OL-CONTEXT V1.4 §19 — versionado reseteado |
| `area` en ítems del CHECKPOINT | `AI Tracker` | `Obsidian Tracker` | OL-CONTEXT V1.4 §7 — string canónico |
| Nombre del producto auditado | `AI Tracker` / `PP` (conversación) | `Obsidian Tracker` en campos estructurados | OL-CONTEXT V1.4 §7 |

---

## 5. CHECKPOINT de cierre

```
---CHECKPOINT---
Título: Plan de Reset del Ecosistema — Obsidian Labs V1.1
Proyecto: Obsidian Labs
Rol: ST · Vera
Resumen: Plan de reset re-emitido alineado a OL-CONTEXT V1.4. Correcciones aplicadas: sprint post-reset PP-S-26 → PP-S-01, version_target v1.0.0, string canónico Obsidian Tracker en campos estructurados. Fases 0a–3 completadas. Fase 4 en curso — Cael debe consolidar backlog con sprint PP-S-01 correcto antes de Fase 5.
Archivos: Plan_de_Reset_del_Ecosistema_V1_1.md | PP-BACKLOG-nuevo.md | PP-AUDITORIA_V1_0.md
Contexto: OL-CONTEXT V1.4 establece reset de versionado a v1.0.0 y sprint post-reset PP-S-01. El plan original usaba PP-S-26 y referencias legacy de AI Tracker. Corrección necesaria antes de que Cael consolide el backlog final.
Bloqueantes: Fase 4 requiere sesión con Cael para: (1) actualizar sprint PP-S-26 → PP-S-01 en PP-BACKLOG-nuevo.md, (2) completar Protocolo de Especificación de los 5 Rs que requieren AC, (3) coordinar con Nova los Rs que tocan UI. Sin estos pasos PP-S-01 no puede abrirse.
Aprendizaje: El reset de versionado y numeración de sprints debe declararse en el plan desde el inicio — evita que el backlog consolidado llegue con sprint incorrecto a PP.
CONTEXT-SECTION: n/a
Decisión: Plan V1.1 aprobado como versión canónica del reset. PP-BACKLOG-nuevo.md requiere actualización de sprint antes de Fase 5.
Próximo paso: Sesión con Cael — Fase 4 completa: actualizar sprint PP-S-01 + completar AC de 5 Rs bloqueados + coordinar Nova donde corresponde.

---ITEMS---
[
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Auditoría técnica Obsidian Tracker — informe + MAP",
    "status": "done",
    "priority": "high",
    "effort": 2,
    "area": "Obsidian Tracker",
    "sprint": "PP-S-25",
    "role": "FS · Rune",
    "version": "v1.0.0",
    "schema_version": 1,
    "ac": [
      "Tabla de módulos con función real, deuda técnica y severidad entregada",
      "MAP schema JSON emitido listo para importar en PP",
      "Sin preguntas abiertas al cierre — el informe es autosuficiente"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Auditoría funcional Obsidian Tracker — informe + gaps de AC",
    "status": "done",
    "priority": "high",
    "effort": 2,
    "area": "Obsidian Tracker",
    "sprint": "PP-S-25",
    "role": "QA · Finn",
    "version": "v1.0.0",
    "schema_version": 1,
    "ac": [
      "Tabla de flujos auditados con AC verificados entregada",
      "Lista de gaps de especificación en formato Base Rules §9 entregada para Cael",
      "Bugs clasificados por tipo con pasos reproducibles"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Auditoría primer uso Obsidian Tracker — experiencia + conversión",
    "status": "done",
    "priority": "high",
    "effort": 2,
    "area": "Obsidian Tracker",
    "sprint": "PP-S-25",
    "role": "UX · Nova",
    "version": "v1.0.0",
    "schema_version": 1,
    "ac": [
      "Tabla de fricciones de experiencia con principio violado y propuesta entregada por Nova",
      "Tabla de hallazgos de conversión con hipótesis e impacto entregada por Lena",
      "Lista de Rs de experiencia y conversión para Fase 4 entregada"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Consolidación backlog nuevo — tres proyectos",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Obsidian Labs",
    "sprint": "PP-S-25",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Backlog limpio de Alisto entregado — sin ítems flotantes sin cierre formal",
      "Backlog limpio de Content Manager entregado — cruzado con export de PP",
      "Backlog limpio de Obsidian Tracker entregado — sprint PP-S-01 declarado, version_target v1.0.0",
      "5 Rs bloqueados tienen AC completos post Protocolo de Especificación",
      "Rs que tocan UI coordinados con Nova antes de cierre",
      "Los tres CONTEXTs actualizados a estado real del producto"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
```

---

```
---EXECUTION-PLAN---
scope: sprint
sprint: PP-S-25
sesiones:
  - id: auditoria-tecnica-pp
    rol: FS · Rune
    items: [[pendiente-ID]-auditoria-tecnica]
    archivos: [pp-main.html, pp-main.js, pp-main.css]
    depende_de: []
  - id: auditoria-funcional-pp
    rol: QA · Finn
    items: [[pendiente-ID]-auditoria-funcional]
    archivos: [pp-main.html, pp-main.js, pp-main.css]
    depende_de: [auditoria-tecnica-pp]
  - id: auditoria-primer-uso-pp
    rol: UX · Nova
    items: [[pendiente-ID]-auditoria-primer-uso]
    archivos: [pp-main.html, pp-main.js, pp-main.css]
    depende_de: [auditoria-tecnica-pp, auditoria-funcional-pp]
  - id: consolidacion-backlog-nuevo
    rol: PO · Cael
    items: [[pendiente-ID]-consolidacion]
    archivos: [AS-CONTEXT-nuevo.md, CM-CONTEXT-nuevo.md, outputs-auditorias]
    depende_de: [auditoria-tecnica-pp, auditoria-funcional-pp, auditoria-primer-uso-pp]
---EXECUTION-PLAN-END---
```
