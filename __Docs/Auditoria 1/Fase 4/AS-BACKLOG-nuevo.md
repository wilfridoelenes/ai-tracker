# AS-BACKLOG-nuevo.md
<!-- Versión: 1.0 | Última actualización: 2026-05-07 | Backlog consolidado ASVAB App — Fase 4 Reset -->

## Meta

Backlog limpio de ASVAB App post-reset del ecosistema. Generado en Fase 4 por Cael sobre evidencia real de auditorías Fases 1-3. No hereda ítems del historial acumulado sin validación explícita contra outputs de auditoría.

**Nota de validación:** El informe técnico de Rune (Fase 1) no estuvo disponible para ASVAB App en esta sesión. Los ítems del backlog anterior (AS-CONTEXT_V0_4.md §12) fueron cruzados contra el AS-CONTEXT_V0_4.md directamente. Las auditorías de Finn y Nova cubrieron exclusivamente AI Tracker — no hay evidencia de auditoría funcional de ASVAB App en los outputs de Fases 1-3. Se conservan solo los ítems pendientes declarados en AS-CONTEXT_V0_4 con evidencia de estar activos al cierre de S-04.

---

## Estado al cierre

| Sprint | Estado |
|---|---|
| AS-S-01 a AS-S-03 | Cerrados — done |
| AS-S-04 | En curso |
| Versión activa | v3.2.0.0 |

---

## Ítems pendientes activos

```json
[
  {
    "type": "T",
    "code": "T-202604-006",
    "title": "QA end-to-end pre-lanzamiento ASVAB App",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "QA",
    "sprint": "AS-S-04",
    "role": "QA · Finn",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Todos los flujos de usuario críticos verificados: onboarding, diagnóstico, simulado, paywall, pago manual",
      "Auth Google funciona en producción",
      "Gate freemium funciona correctamente — ≤30% en free, 100% en premium",
      "isPremium no es modificable desde cliente — verificado con Firebase Security Rules",
      "No hay errores de consola en flujo happy path de usuario nuevo"
    ]
  },
  {
    "type": "T",
    "code": "T-202604-007",
    "title": "Refactor CSS — extraer estilos de index.html a archivo separado",
    "status": "pendiente",
    "priority": "medium",
    "effort": 2,
    "area": "CSS · Arquitectura",
    "sprint": "AS-S-04",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Todo estilo de presentación extraído de index.html a archivo .css dedicado",
      "index.html no contiene bloques <style> con estilos de presentación",
      "Aplicación visualmente idéntica antes y después del refactor",
      "Cumple CSS Purity §15 — sin style= inline en HTML estático"
    ]
  },
  {
    "type": "T",
    "code": "T-202604-009",
    "title": "QA end-to-end pre-lanzamiento (Finn) — sesión formal de auditoría ASVAB App",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "QA",
    "sprint": "AS-S-04",
    "role": "QA · Finn",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Informe funcional entregado con AC verificados por flujo",
      "Bugs clasificados por tipo: crítico / mayor / menor con pasos reproducibles",
      "Lista de gaps de AC documentados para Cael",
      "Decisión de release aprobada o bloqueada con justificación"
    ]
  },
  {
    "type": "R",
    "code": "R-202604-011",
    "title": "Landing page externa ASVAB App",
    "status": "pendiente",
    "priority": "high",
    "effort": 3,
    "area": "Marketing · Infraestructura",
    "sprint": "AS-S-04",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Landing page publicada en dominio propio",
      "Propuesta de valor central visible en primer viewport: diagnóstico de gaps + español nativo",
      "CTA primario hacia registro / descarga",
      "Compatible con mobile — diseño responsive",
      "Sin errores de carga en Vercel"
    ]
  },
  {
    "type": "R",
    "code": "R-202604-012",
    "title": "Dashboard de métricas internas",
    "status": "pendiente",
    "priority": "medium",
    "effort": 2,
    "area": "Analytics",
    "sprint": "AS-S-04",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Dashboard muestra: usuarios registrados, sesiones activas, paywall_shown, conversiones",
      "Datos provienen de Firebase Analytics",
      "Accesible solo para el operador — no expuesto a usuarios"
    ]
  },
  {
    "type": "R",
    "code": "R-202604-013",
    "title": "Notificaciones de racha",
    "status": "pendiente",
    "priority": "low",
    "effort": 2,
    "area": "Gamificación",
    "sprint": "AS-S-04",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Usuario recibe notificación cuando su racha está en riesgo de romperse",
      "Notificación aparece en la app — no requiere push nativo en esta versión",
      "El mensaje usa tono motivacional consistente con la propuesta de valor del producto"
    ]
  },
  {
    "type": "R",
    "code": "R-202604-014",
    "title": "Expansión de contenido — 9 áreas completas ASVAB",
    "status": "pendiente",
    "priority": "low",
    "effort": 3,
    "area": "Contenido",
    "sprint": "futura",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Las 5 áreas adicionales del ASVAB (más allá de las 4 AFQT) disponibles en el producto",
      "Banco de preguntas generado por CM con taxonomía validada por Eden y Sage",
      "Activación condicionada a datos de uso de Fase 3 — no se activa sin señal de Lena"
    ]
  },
  {
    "type": "P",
    "code": "P-202604-003",
    "title": "Preguntas detrás de auth — migrar a Firestore/Storage",
    "status": "pendiente",
    "priority": "low",
    "effort": 3,
    "area": "Seguridad · Arquitectura",
    "sprint": "futura",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": []
  },
  {
    "type": "P",
    "code": "P-202604-004",
    "title": "paywall.js — violación CSS Purity §15 — corregir",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "CSS Purity",
    "sprint": "AS-S-04",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "paywall.js no contiene propiedades de presentación directas en JS",
      "Ningún style.color, style.backgroundColor, style.display directo en paywall.js",
      "Pasa verificación grep de CSS Purity §15"
    ]
  },
  {
    "type": "R",
    "code": "R-202604-025",
    "title": "Integración Stripe real — reemplaza canal externo manual",
    "status": "pendiente",
    "priority": "medium",
    "effort": 3,
    "area": "Monetización",
    "sprint": "futura",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Pago directo desde la app via Stripe sin intermediario manual",
      "isPremium activado automáticamente tras pago exitoso via webhook",
      "Activación condicionada a datos reales de conversión en Fase 3 — trigger de Lena"
    ]
  }
]
```

---

## Ítems descartados

| Código | Título | Motivo de descarte |
|---|---|---|
| R-202604-007 | (desconocido — descartado en historial original) | Descartado en sprint AS-S-03 — sin evidencia de pendiente |
| R-202604-009 | (desconocido — descartado en historial original) | Descartado en sprint AS-S-03 — sin evidencia de pendiente |
| R-202604-016 | (desconocido — descartado en historial original) | Descartado en sprint AS-S-03 — sin evidencia de pendiente |
| R-202604-020 | (desconocido — descartado en historial original) | Descartado en sprint AS-S-03 — sin evidencia de pendiente |
| R-202604-001 a R-202604-006 | Done en sprints anteriores | Cerrados formalmente |
| R-202604-008 | Done | Cerrado formalmente |
| R-202604-010 | Done | Cerrado formalmente |
| R-202604-015 | Done | Cerrado formalmente |
| R-202604-017 a R-202604-019 | Done | Cerrados formalmente |
| R-202604-021 a R-202604-024 | Done | Cerrados formalmente |
| T-202604-001 a T-202604-005 | Done | Cerrados formalmente |
| T-202604-008 | Done | Cerrado formalmente |
| B-202604-001 a B-202604-005 | Done | Cerrados formalmente |
| P-202604-002 | Done | Cerrado formalmente |

---

## Nota de auditoría

El informe técnico de Rune (Fase 1) cubrió AI Tracker, no ASVAB App. El informe funcional de Finn (Fase 2) cubrió AI Tracker, no ASVAB App. Las auditorías de Nova y Lena cubrieron AI Tracker (primer uso, funnel de activación). ASVAB App requiere su propio ciclo de auditoría técnica + funcional antes del lanzamiento — los ítems T-202604-006 y T-202604-009 (QA end-to-end) son el punto de entrada correcto para ese ciclo.
