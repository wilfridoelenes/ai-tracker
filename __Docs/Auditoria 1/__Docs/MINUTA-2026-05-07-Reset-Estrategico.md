# MINUTA-2026-05-07-Reset-Estrategico.md
<!-- Versión: 1.0 | Última actualización: 2026-05-07 | Minuta de sesión estratégica — Reset del ecosistema + Auditorías PP -->

---

## Datos de sesión

| Campo | Valor |
|---|---|
| Fecha | 2026-05-07 |
| Proyecto | Obsidiana Labs |
| Rol facilitador | ST · Vera |
| Participantes | Founder + Vera |
| Duración estimada | ~1 sesión completa |
| Documentos revisados | CM-CONTEXT_V0_5.md · CM-BACKLOG_v0_4.md |

---

## Contexto

PP (AI Tracker) acumula aproximadamente 2,000 sesiones de trabajo. El producto está funcional y visualmente terminado. El objetivo de esta sesión fue definir cómo hacer una lectura honesta del producto real — sin memoria acumulada — y preparar el ecosistema para un reset limpio.

---

## Decisiones tomadas

### 1. Tres auditorías independientes de PP

Se acordó ejecutar tres auditorías en secuencia, cada una con un lente distinto:

| # | Auditoría | Ejecuta | Pregunta central |
|---|---|---|---|
| 1 | Técnica | Rune | ¿Qué hace realmente el código? |
| 2 | Funcional | Finn | ¿Funciona lo que promete? |
| 3 | Primer uso | Nova + Lena | ¿Es usable para alguien nuevo? |

**Criterio de secuencia:** La auditoría técnica va primero porque sus hallazgos explican causas. Finn y Nova necesitan saber qué está realmente roto antes de reportar síntomas. La experiencia de primer uso va al final porque tiene sentido auditar la experiencia cuando ya se sabe qué está funcionando.

---

### 2. Reset completo del ecosistema después de las auditorías

Se acordó borrar el historial acumulado de PP una vez que las auditorías y extracciones estén completas.

**Qué se borra:**
- Historial de sesiones en PP
- Backlog acumulado
- Decisiones técnicas intermedias

**Qué se conserva:**
- El código (es el producto real)
- Los roles del ecosistema
- OB-CONTEXT
- Los outputs de las tres auditorías

---

### 3. Extracción quirúrgica antes del reset

Antes de borrar, se extrae lo valioso de los tres proyectos para reconstruir CONTEXT, backlog y MAP limpios.

| Proyecto | Qué extraer |
|---|---|
| ASVAB App | Estado real del producto — qué está construido, qué falta, decisiones de arquitectura vigentes |
| Content Manager | Estado del banco — secciones, volumen, pipeline funcional |
| AI Tracker | Lo que salga de las tres auditorías |

---

## Secuencia de ejecución acordada

| Fase | Qué | Quién | Estado |
|---|---|---|---|
| 0a | Extracción ASVAB App — CONTEXT limpio + backlog pendiente real | Cael | Pendiente |
| 0b | Extracción Content Manager — CONTEXT limpio + backlog pendiente real | Cael | En curso |
| 1 | Auditoría técnica PP | Rune | Pendiente |
| 2 | Auditoría funcional PP | Finn | Pendiente |
| 3 | Auditoría primer uso PP | Nova + Lena | Pendiente |
| 4 | Consolidación — backlog nuevo para los tres proyectos | Cael | Pendiente |
| 5 | Reset — borrar historial, sesiones, backlog viejo | — | Pendiente |
| 6 | Sprint 1 limpio | Rune | Pendiente |

---

## Revisión de Content Manager

Se revisó CM-CONTEXT_V0_5.md. Estado:

| Área | Estado |
|---|---|
| Producto | Funcional — single-file HTML, IndexedDB, export ZIP |
| Banco de preguntas | Completo para las 4 secciones AFQT (WK, AR, MK, PC) |
| Taxonomía | Definida y estable |
| Backlog declarado | 0 ítems pendientes al cierre de S-06 |
| Decisiones de arquitectura | Documentadas y vigentes |

**Alerta:** El backlog dice 0 pendientes pero no se ha cruzado con PP. Puede haber ítems flotando sin cierre formal.

---

## Pendientes para próxima sesión

1. **Exportar backlog completo de CM desde PP** — todos los ítems, sin filtro de status — para cruzar con CM-BACKLOG_v0_4.md y confirmar que realmente está en cero.
2. **Repetir el mismo ejercicio para ASVAB App** — CONTEXT + backlog export desde PP.
3. Con ambos proyectos extraídos, **arrancar Auditoría 1 de PP con Rune**.

---

## Notas adicionales

- El contexto acumulado de 2k sesiones es peso, no activo. El reset es la decisión correcta en este momento del ecosistema.
- El backlog nuevo del Sprint 1 no es un backlog de intenciones — es un backlog basado en lo que el producto realmente es, con evidencia de las tres auditorías.
- Las tres auditorías juntas producen algo que el ecosistema no tiene todavía: un diagnóstico honesto del producto real.
