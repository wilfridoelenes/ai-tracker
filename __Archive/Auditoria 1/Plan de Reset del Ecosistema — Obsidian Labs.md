Plan de Reset del Ecosistema — Obsidian Labs

1. Plan de fases
| Fase | Nombre                        | Ejecuta       | Done cuando                                                                 | Archivos requeridos en sesión                                                      |
|------|-------------------------------|---------------|-----------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| 0a   | Extracción ASVAB App          | Cael          | CONTEXT limpio + backlog pendiente real entregados como archivos             | AS-CONTEXT actual · AS-BACKLOG export completo desde PP (sin filtro de status)     |
| 0b   | Extracción Content Manager    | Cael          | CONTEXT limpio + backlog pendiente real entregados como archivos             | CM-CONTEXT_V0_5.md · CM-BACKLOG_v0_4.md · CM-BACKLOG export completo desde PP     |
| 1    | Auditoría técnica PP          | Rune          | Informe técnico entregado en formato definido — sin preguntas abiertas       | Archivos reales de PP (HTML principal + JS + CSS) — todos adjuntos                 |
| 2    | Auditoría funcional PP        | Finn          | Informe funcional entregado — gaps de AC y bugs clasificados                 | Archivos reales de PP + output de Fase 1                                           |
| 3    | Auditoría primer uso PP       | Nova + Lena   | Informe de experiencia + hallazgos de conversión entregados                  | Archivos reales de PP + outputs de Fase 1 y Fase 2                                 |
| 4    | Consolidación backlog nuevo   | Cael          | Backlog limpio de los tres proyectos listo — sin ítems flotantes sin cierre  | Outputs de Fases 0a · 0b · 1 · 2 · 3                                              |
| 5    | Reset                         | Founder       | Historial PP borrado · sesiones eliminadas · backlog viejo eliminado         | N/A — acción manual del founder en PP                                              |
| 6    | Sprint 1 limpio               | Rune          | Primer sprint ejecutado contra backlog nuevo con base en evidencia real      | AS-CONTEXT nuevo · CM-CONTEXT nuevo · PP-CONTEXT nuevo · Backlogs de Fase 4       |

2. Dependencias
Dependencias explícitas — orden de bloqueo:

1. Fase 0a y 0b son paralelas — no se bloquean entre sí.
2. Fase 1 (Rune) requiere: Fase 0a ✓ y Fase 0b ✓ — Rune necesita contexto limpio de ambos proyectos para interpretar qué hace el código de PP en relación al ecosistema.
3. Fase 2 (Finn) requiere: Fase 1 ✓ — los hallazgos técnicos explican causas. Finn no audita síntomas sin saber qué está realmente roto.
4. Fase 3 (Nova + Lena) requiere: Fase 1 ✓ y Fase 2 ✓ — la experiencia de primer uso tiene sentido auditar cuando se sabe qué funciona y qué no.
5. Fase 4 (Cael) requiere: Fase 1 ✓ + Fase 2 ✓ + Fase 3 ✓ — el backlog nuevo se construye sobre evidencia de las tres auditorías, no sobre intención.
6. Fase 5 (Reset) requiere: Fase 4 ✓ — no se borra nada hasta que el backlog nuevo esté consolidado y los tres CONTEXTs limpios estén extraídos.
7. Fase 6 (Sprint 1) requiere: Fase 5 ✓ — el sprint limpio no arranca sobre el historial acumulado.

3. Outputs por auditoría
| Auditoría          | Ejecuta       | Entregable                                            | Formato                                                                                                                                         |
|--------------------|---------------|-------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 — Técnica        | Rune          | Informe técnico de PP                                 | Tabla: módulo · función · qué hace realmente · deuda técnica detectada · severidad (alta/media/baja). Un módulo por fila. Sin prose.            |
| 1 — Técnica        | Rune          | Lista de archivos reales con funciones mapeadas       | Formato MAP schema JSON (Base Rules §11) — listo para importar en PP                                                                           |
| 2 — Funcional      | Finn          | Informe funcional de PP                               | Tabla: flujo auditado · AC verificado (sí/no) · gap de especificación (si aplica) · bug detectado (tipo: crítico/mayor/menor) · pasos repro     |
| 2 — Funcional      | Finn          | Lista de gaps de AC para Cael                         | Formato Base Rules §9 sección gap de especificación — uno por comportamiento sin AC                                                             |
| 3 — Primer uso     | Nova          | Informe de experiencia PP                             | Tabla: pantalla/flujo · fricción detectada · principio violado (Nielsen/Gestalt/Fitts) · severidad · propuesta de mejora en una línea           |
| 3 — Primer uso     | Lena          | Informe de hallazgos de conversión PP                 | Tabla: momento del funnel · comportamiento observado · hipótesis de impacto en conversión · acción sugerida                                     |
| 3 — Primer uso     | Nova + Lena   | Lista de Rs de experiencia y conversión para Fase 4   | Lista: título del R · ejecuta · prioridad sugerida (high/medium/low) · justificación en una línea                                              |

4. CHECKPOINT de cierre
---CHECKPOINT---
Título: Plan de Reset del Ecosistema — Obsidian Labs
Proyecto: Obsidian Labs
Rol: ST · Vera
Resumen: Plan accionable completo del reset definido. Fases 0a–6 especificadas con dependencias, ejecutores, criterios de done y archivos requeridos. Rune puede arrancar Auditoría 1 en la siguiente sesión sin preguntas adicionales.
Archivos: MINUTA-2026-05-07-Reset-Estrategico.md
Contexto: PP acumula ~2,000 sesiones. Extracciones de ASVAB App y Content Manager completadas. El plan estructura el camino desde auditorías hasta Sprint 1 limpio con base en evidencia real del producto.
Bloqueantes: Fase 1 requiere archivos reales de PP adjuntos en sesión — HTML principal + JS + CSS. Sin esos archivos Rune no puede arrancar.
Aprendizaje: El reset no es pérdida — el código es el producto real. El historial acumulado es peso. Las tres auditorías producen el diagnóstico honesto que el ecosistema no tiene todavía.
CONTEXT-SECTION: n/a
Decisión: Secuencia de auditorías aprobada — Técnica → Funcional → Primer uso → Consolidación → Reset → Sprint 1. Filtro de monetización: este plan es prerequisito directo del Sprint 1 que desbloquea revenue. Sin reset limpio no hay Sprint 1 con base en evidencia.
Próximo paso: Arrancar Fase 1 — Auditoría técnica PP con Rune. Adjuntar archivos reales de PP al iniciar sesión.

---ITEMS---
[
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Auditoría técnica PP — informe + MAP",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "AI Tracker",
    "sprint": "PP-S-25",
    "role": "FS · Rune",
    "version": "futura",
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
    "title": "Auditoría funcional PP — informe + gaps de AC",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "AI Tracker",
    "sprint": "PP-S-25",
    "role": "QA · Finn",
    "version": "futura",
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
    "title": "Auditoría primer uso PP — experiencia + conversión",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "AI Tracker",
    "sprint": "PP-S-25",
    "role": "UX · Nova",
    "version": "futura",
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
      "Backlog limpio de ASVAB App entregado — sin ítems flotantes sin cierre formal",
      "Backlog limpio de Content Manager entregado — cruzado con export de PP",
      "Backlog limpio de AI Tracker entregado — basado en outputs de las tres auditorías",
      "Los tres CONTEXTs actualizados a estado real del producto"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
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

