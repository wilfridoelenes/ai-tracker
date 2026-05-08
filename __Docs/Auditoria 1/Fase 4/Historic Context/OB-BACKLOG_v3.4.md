# OB-BACKLOG_v3.4.md
<!-- Versión: v3.4 | Última actualización: 2026-05-08 02:09 UTC-6 | App: AI-Tracker-v3.4 -->

---

## Meta

| Campo | Valor |
|---|---|
| Proyecto | Obsidian Labs |
| Versión del backlog | v3.4 |
| Última actualización | 2026-05-08 02:09 UTC-6 |
| Generado por | TL — exportado desde app |

---

## Estado actual

**Pendientes:** P=4 (4 total)

---
## Índice de estado

```
P: P-202605-009 pendiente [n/a] | P-202605-010 pendiente [n/a] | P-202605-011 pendiente [n/a] | P-202605-012 pendiente [n/a]
Contadores: P=012 | T=006 | R=138 | B=000
App: v3.4 — exportado desde tracker
```

---

## Ítems

---

### P-202605-009 · Bucle de aprendizaje explícito — sección Aprendizajes operativos en CONTEXT + revisión dominical
**Priority:** high
**Area:** Proceso · Protocolo
**Effort:** 1
**Impact:** Medio
**Status:** pendiente
**SprintId:** n/a
**Sprint:** n/a
**Role:** PO · Cael
**Version:** futura

### Criterios de aceptación
- [ ] Base Rules incluye sección Aprendizajes operativos con formato tabla fecha/rol/aprendizaje/impacto
- [ ] Cada CONTEXT de proyecto activo incluye la sección vacía lista para recibir entradas
- [ ] Criterio de elevación definido en protocolo: un aprendizaje sube a CONTEXT si cambia el comportamiento esperado de al menos un rol en sesiones futuras
- [ ] Cada rol evalúa su campo Aprendizaje: del CHECKPOINT contra ese criterio antes de cerrar sesión
- [ ] Vera revisa y aprueba incorporaciones en sesión dominical
**CreatedAt:** 1778062538872
**StatusChangedAt:** 1778062538872

---

### P-202605-010 · Librería de Templates y Playbooks — OB-PLAYBOOKS_V1_0.md con AC base reutilizables
**Priority:** medium
**Area:** Proceso · Especificación
**Effort:** 2
**Impact:** Medio
**Status:** pendiente
**SprintId:** n/a
**Sprint:** n/a
**Role:** PO · Cael
**Version:** futura

Librería de Templates y Playbooks — OB-PLAYBOOKS_V1_0.md con AC base reutilizables

### Criterios de aceptación
- [ ] Documento OB-PLAYBOOKS_V1_0.md creado con mínimo 5 templates de R con AC base
- [ ] Templates incluyen: integrar proveedor de pagos · diseñar gate freemium · crear endpoint · validar idea de feature · onboarding de rol nuevo
- [ ] Playbook inicial cubre secuencia completa lanzar feature con Stripe — elegido por ser el flujo más crítico de ASVAB App con contexto acumulado
- [ ] Aprobación por template — cada template se incorpora independientemente · rechazo parcial de Vera no bloquea el resto
- [ ] Protocolo de Cael en Base Rules referencia la librería como paso previo a Fase 1 para Rs recurrentes
- [ ] Dependencia: P-202605-009 implementado antes — los aprendizajes del proceso de templates se consolidan en la sección Aprendizajes operativos
**CreatedAt:** 1778062538873
**StatusChangedAt:** 1778062538873

---

### P-202605-011 · Campo Retrabajo en CHECKPOINT — registro manual de iteraciones por rol
**Priority:** high
**Area:** Proceso · Protocolo
**Effort:** 1
**Impact:** Medio
**Status:** pendiente
**SprintId:** n/a
**Sprint:** n/a
**Role:** PO · Cael
**Version:** futura

Campo Retrabajo en CHECKPOINT — registro manual de iteraciones por rol

### Criterios de aceptación
- [ ] Base Rules incluye campo Retrabajo en formato CHECKPOINT — opcional · valores: sí/no + motivo
- [ ] Todos los roles lo registran cuando aplica — no solo Rune
- [ ] El consolidado de entradas vive en la sección Aprendizajes operativos del CONTEXT del proyecto correspondiente
- [ ] Cael consolida entradas en sesión dominical con Vera
- [ ] Dependencia: P-202605-009 implementado antes — comparten la misma sección destino en CONTEXT
**CreatedAt:** 1778062538873
**StatusChangedAt:** 1778062538873

---

### P-202605-012 · Dashboard de métricas de proceso interno en PP
**Priority:** medium
**Area:** AI Tracker · Analytics de proceso
**Effort:** 2
**Impact:** Medio
**Status:** pendiente
**SprintId:** n/a
**Sprint:** n/a
**Role:** FS · Rune
**Version:** futura

### Criterios de aceptación
- [ ] PP incluye vista de métricas de proceso con: % Rs aprobados a la primera · retrabajo por tipo · cuello de botella por rol · tiempo promedio por effort
- [ ] Los datos provienen del campo Retrabajo acumulado en CHECKPOINTs
- [ ] La vista no se activa hasta mínimo 4 semanas de uso del campo Retrabajo — garantiza datos de al menos un ciclo de sprints
- [ ] Dependencia dura: P Campo Retrabajo en CHECKPOINT debe estar implementado y en uso antes de desarrollar esta vista
**CreatedAt:** 1778062538873
**StatusChangedAt:** 1778062538873


---

## Estadísticas finales

| Métrica | Valor |
|---------|-------|
| Ítems totales | 4 |
| Done | 0 |
| Backlog | 0 |
| App version actual | v3.4 |
| Próxima versión | v3.4 |
