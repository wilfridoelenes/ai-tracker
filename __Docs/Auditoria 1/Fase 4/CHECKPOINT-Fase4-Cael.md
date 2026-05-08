---CHECKPOINT---
Título: Fase 4 — Consolidación de backlog nuevo para los tres proyectos
Proyecto: Obsidian Labs
Rol: PO · Cael
Resumen: Backlog limpio de los tres proyectos entregado. ASVAB App: 10 ítems pendientes validados contra AS-CONTEXT_V0_4 (sin auditoría de Fases 1–3 disponible — declarado explícitamente). Content Manager: backlog en cero confirmado — sin ítems heredados del historial. AI Tracker: backlog nuevo construido desde cero sobre outputs directos de Fases 1–3 (Rune + Finn + Nova + Lena). Los tres CONTEXTs actualizados a estado real post-reset. Historial PP-S-01 a PP-S-25 reseteado sin herencia.
Archivos: AS-BACKLOG-nuevo.md | CM-BACKLOG-nuevo.md | PP-BACKLOG-nuevo.md | AS-CONTEXT_V0_5.md | CM-CONTEXT_V0_6.md | PP-CONTEXT_V3_5_3.md
Contexto: Fase 4 del Plan de Reset del Ecosistema. Los tres backlogs y CONTEXTs se generaron sobre los outputs de las auditorías previas (Fases 1–3), no sobre el historial acumulado de PP. ASVAB App y Content Manager no tuvieron auditoría técnica ni funcional en este ciclo — sus backlogs se validaron contra sus propios CONTEXTs directamente.
Bloqueantes: (1) ASVAB App requiere su propio ciclo de auditoría técnica + funcional antes del lanzamiento — T-202604-006 y T-202604-009 son el punto de entrada. (2) Rs de PP-S-26 que tocan UI (empty state, checklist de setup, status chip inline) requieren paso por Protocolo de Especificación de Cael + consulta a Nova antes de que Vera pueda abrir el sprint.
Aprendizaje: El informe técnico de Rune (Fase 1) no estuvo disponible como archivo adjunto en esta sesión — fue referenciado indirectamente desde los outputs de Finn y los bloques ---ITEMS--- de las sesiones 3c/3d/3e. Los bugs del Cluster A y B del backlog de PP están todos derivados de los CHECKPOINTs de Finn y Lena donde se cita explícitamente "Rune 1b" como origen. Esto es suficiente para validar su inclusión. Si el informe de Rune se adjunta en una sesión futura, verificar que no hay hallazgos no capturados.
CONTEXT-SECTION: emitida — tres CONTEXTs actualizados como archivos separados
Decisión: Backlog de AI Tracker para PP-S-26 contiene ~50+ ítems. Vera debe ejecutar auditoría pre-sprint antes de abrir — verificar que Rs de UI pasaron por Protocolo de Especificación. Rs sin AC (checklist de setup, R de openItemEditor guardia) deben pasar por Cael en Fase 1 del Protocolo antes de entrar al sprint.
Próximo paso: (1) Founder ejecuta Fase 5 — reset manual en PP (borrar historial, sesiones, backlog viejo). (2) Importar PP-BACKLOG-nuevo.md al backlog fresco. (3) Vera auditoría pre-sprint PP-S-26. (4) Abrir PP-S-26 con ítems validados.

---ITEMS---
[
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Auditoría técnica PP — informe + MAP",
    "status": "done",
    "priority": "high",
    "effort": 2,
    "area": "AI Tracker",
    "sprint": "PP-S-25",
    "role": "FS · Rune",
    "version": "v3.4.3",
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
    "status": "done",
    "priority": "high",
    "effort": 2,
    "area": "AI Tracker",
    "sprint": "PP-S-25",
    "role": "QA · Finn",
    "version": "v3.4.3",
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
    "status": "done",
    "priority": "high",
    "effort": 2,
    "area": "AI Tracker",
    "sprint": "PP-S-25",
    "role": "UX · Nova",
    "version": "v3.4.3",
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
    "status": "done",
    "priority": "high",
    "effort": 2,
    "area": "Obsidian Labs",
    "sprint": "PP-S-25",
    "role": "PO · Cael",
    "version": "v3.4.3",
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
scope: sesion
sesiones:
  - id: fase4-consolidacion-backlog
    rol: PO · Cael
    items: [pendiente-ID-consolidacion]
    archivos: [AS-BACKLOG-nuevo.md, CM-BACKLOG-nuevo.md, PP-BACKLOG-nuevo.md, AS-CONTEXT_V0_5.md, CM-CONTEXT_V0_6.md, PP-CONTEXT_V3_5_3.md]
    depende_de: []
---EXECUTION-PLAN-END---
