# OL-CONTEXT_V1_4.md
<!-- Versión: 1.4 | Última actualización: 2026-05-07 | Contexto estratégico del holding Obsidian Labs -->

---

## 1. Identidad

| Campo | Valor |
|---|---|
| Nombre | Obsidian Labs |
| Tipo | Holding / Ecosistema de productos digitales |
| Founder | [nombre o alias] |
| Estado | Prototipo |
| Fecha de inicio | 2026-04 |

---

## 2. Visión

> Ser la plataforma de referencia en preparación para el ASVAB para hispanohablantes en Estados Unidos.

---

## 3. Misión

> Eliminar la barrera del idioma en el acceso al US Army, ofreciendo preparación efectiva y accesible en español — no como traducción, sino como diagnóstico real de gaps y dirección clara para cerrarlos.

---

## 4. Objetivo de negocio — 6 meses

> Lanzar ASVAB App como producto maduro y funcional, y generar los primeros ingresos reales.

---

## 5. Propuesta de valor

> "Lo que tu hermano mayor te explicaría — si supiera todo lo del ASVAB."

El usuario hispanohablante no necesita más preguntas. Necesita saber exactamente en qué falla, por qué, y cómo cerrarlo. Las apps existentes son bancos de preguntas con respuestas — el usuario memoriza pero no aprende. Obsidian Labs es un sistema de diagnóstico de gaps en español nativo.

| Diferenciador | Por qué importa |
|---|---|
| Diagnóstico de gaps | Nadie más lo da — ni apps ni reclutadores |
| Español nativo | No traducido — pensado desde cómo el usuario hispanohablante aprendió |
| Dirección clara | No más material sin rumbo — el usuario sabe qué sigue en todo momento |

---

## 6. Proyectos activos

| Proyecto | Función | Estado | PO | FS |
|---|---|---|---|---|
| ASVAB App | Producto final monetizable — app de estudio militar | Prototipo | Cael | Rune |
| Content Manager | Pipeline de contenido — alimenta banco de preguntas de ASVAB | Prototipo | Cael | Rune |
| AI Tracker | Gestor de backlog, contexto y module map del ecosistema | Prototipo | Cael | Rune |

---

## 7. Nombres canónicos de proyecto

Strings exactos para usar en CHECKPOINTs, declaraciones de scope y handoffs. Ninguna variante es válida.

| Proyecto | String canónico | Prefijo | Alias |
|---|---|---|---|
| Holding | `Obsidian Labs` | `OL` | — |
| App de estudio | `ASVAB App` | `AS` | — |
| Content Manager | `Content Manager` | `CM` | CM |
| AI Tracker | `AI Tracker` | `AI` | PEPE |

**Reglas:**
- El string canónico es el único valor válido en el campo `Proyecto:` de cualquier CHECKPOINT, declaración de scope o handoff.
- El prefijo se usa en nombres de archivos de documentos vivos: `[Prefijo]-[TIPO]_V[X]_[Y].md` (ej: `CM-CONTEXT_V0_1.md`, `AS-BACKLOG_V1_0.md`).
- Los alias son coloquiales — válidos en conversación, nunca en campos estructurados.
- AI Tracker puede referenciarse como "PEPE" en conversación — el string canónico en CHECKPOINTs es siempre `AI Tracker`.

---

## 8. Roles Obsidian Labs

### C-level

| Rol | Nombre | Sigla | Función | Status |
|---|---|---|---|---|
| CEO + COO | Vera | ST | Estrategia, operación, coordinación ejecutiva, competitive intelligence, gestión de riesgos, cultura | Activo |
| CGO + UR | Lena | GW | Growth, monetización, user research, diseño de experimentos, voz del usuario | Activo |
| CPO | Noa | CPO | Visión de producto transversal, diagnóstico como feature, experiencia de conversión | Activo |
| CMO | Maya | CMO | Narrativa de marca, canales de comunidad, adquisición, voz consistente | Activo |

### Ejecución core

| Rol | Nombre | Sigla | Función | Reporta a | Status |
|---|---|---|---|---|---|
| PO Transversal | Cael | PO | Refinamiento, criterios de aceptación, backlog, voz del usuario | C-level directo | Activo |
| FS Transversal | Rune | FS | Implementación técnica, instrumentación, calidad de entrega | Cael + C-level | Activo |
| UX Transversal | Nova | UX | Diseño de experiencia e interfaces para todo el ecosistema | Noa (dirección) · Cael (criterios) | Activo |

### Contenido

| Rol | Nombre | Sigla | Función | Reporta a | Status |
|---|---|---|---|---|---|
| Especialista Taxonomías | Eden | ET | Arquitectura pedagógica y clasificación de contenido | Noa | Activo |
| Generador de Contenido | Sage | GC | Generación de preguntas ASVAB según taxonomía | Noa | Activo |

### Canales

| Rol | Nombre | Sigla | Función | Reporta a | Status |
|---|---|---|---|---|---|
| Community Content | Flux | CC | Contenido externo, comunidades, canales de adquisición | Maya | Activo |

### En espera

| Rol | Nombre | Sigla | Función | Reporta a | Trigger |
|---|---|---|---|---|---|
| QA Transversal | Finn | QA | Testing transversal, estándares de calidad | Vera | Activo |
| Data Analytics | Iris | DA | Analytics, comportamiento, métricas de conversión | Lena | Fase 3 — 50 usuarios |

### Deprecados

| Nombre | Reemplazado por |
|---|---|
| Axis · Orion · Alex | Cael |
| Rex · Kai · Mike | Rune |

---

## 9. Modelo de negocio

Freemium con opción de pago único.

| Nivel | Qué obtiene | Por qué funciona |
|---|---|---|
| Free | Diagnóstico básico — el usuario sabe en qué área falla | Da valor real, no valor recortado |
| Pago único | Diagnóstico completo + plan de cierre + simulaciones ilimitadas | Paga por certeza, no por contenido |

Suscripción mensual descartada — no hay retención natural post-examen dado el ciclo de uso corto.

> Abierto a revisión con Lena cuando haya datos reales de conversión.

---

## 10. Mercado objetivo

Hispanohablantes en Estados Unidos en proceso de enlistarse al US Army.

**Momento de intención:** El usuario ya tomó la decisión de enlistarse — el ASVAB es el obstáculo concreto que enfrenta. No está explorando opciones, está buscando pasar.

**Dolor real:** No sabe en qué falla ni cómo cerrarlo. Estudia, memoriza, presenta el examen — y no entiende por qué su score no mejora. Los reclutadores dan scores, no diagnósticos.

**Canales donde vive:**
- Foros militares hispanohablantes (Reddit, Facebook Groups, Discord)
- YouTube (Grammar Hero y contenido educativo similar)
- Reclutadores del Army — multiplicadores B2B naturales

---

## 11. Métricas de éxito — 6 meses

| Métrica | Objetivo |
|---|---|
| Usuarios registrados | 500 |
| Conversión freemium → pago | 5% (25 usuarios) |
| Ingreso mensual recurrente | $250–$500 USD |
| Producto | Lanzado, estable, con las 4 áreas AFQT cubiertas |

---

## 12. Roadmap estratégico

| Fase | Período | Foco |
|---|---|---|
| 1 — Build | Mes 1–2 | CM funcional, banco AFQT base (4 áreas), ASVAB App MVP |
| 2 — Launch | Mes 3 | Infraestructura, pivote de producto, lanzamiento bien hecho |
| 3 — Validate | Mes 4–5 | Datos de uso, conversión, feedback, AB tests |
| 4 — Monetize | Mes 6 | Activar modelo de pago, primeros ingresos |

> Decisión 2026-04-26: no apresurar el lanzamiento. Construir bien antes de lanzar — infraestructura, pivote de producto y equipo ejecutivo primero.

---

## 13. Alcance de contenido — Fase 1

El MVP cubre exclusivamente las **4 áreas del AFQT** — el subconjunto del ASVAB que determina elegibilidad para ingresar al US Army:

| Sigla | Área |
|---|---|
| AR | Arithmetic Reasoning |
| WK | Word Knowledge |
| PC | Paragraph Comprehension |
| MK | Mathematics Knowledge |

Las 9 áreas completas del ASVAB son objetivo post-MVP. La expansión se activa en Fase 3 (Validate) guiada por datos de uso.

---

## 14. Secuencia de ejecución — Fase 1

CM va primero. ASVAB App arranca cuando el banco mínimo AFQT esté listo.

| Sprint | Proyecto | Foco | Estado |
|---|---|---|---|
| CM-S-01 | CM | Taxonomía AFQT + generador de preguntas + PEPE operativo | Done |
| CM-S-02 | CM | Banco inicial mínimo viable (4 áreas AFQT) | Done |
| AS-S-03 | ASVAB App | MVP: gate freemium, simulado, Stripe, onboarding, analytics | Done |
| AS-S-04+ | ASVAB App / AI Tracker | Sprints activos — ver CONTEXT de proyecto activo | En curso (PP-S-25) |

---

## 15. Estimaciones de tiempo — referencia

El ecosistema opera con un founder único apoyado por roles de IA. Las estimaciones son en **tiempo real del founder** frente al ordenador.

| Hito | Tiempo founder estimado | Días calendario* |
|---|---|---|
| Banco AFQT listo (CM-S-01 + CM-S-02) | 3–5 horas | 1 día |
| MVP ASVAB App (AS-S-03) | 4–6 horas | 1 día |
| Integración CM → ASVAB App | 1–2 horas | mismo día |
| Lanzamiento público | 2–3 horas | 1 día |
| Primeros 50 usuarios | — | ~2 semanas post-lanzamiento |
| Primeros ingresos | — | ~4–6 semanas post-lanzamiento |
| **Total hasta lanzamiento** | **10–16 horas** | **3–5 días calendario** |

*Asumiendo 6–8 horas efectivas diarias frente al ordenador.

> El limitante no es el tiempo de ejecución — es la calidad de las decisiones entre sesiones.

---

## 16. Protocolo de revisión ejecutiva

**Sesión de pulso — al cerrar cada hito**
Duración: 15–20 min. Documentos requeridos: OL-CONTEXT actualizado + Backlog.
Agenda: ¿lo entregado mueve las métricas? ¿el siguiente hito sigue siendo la prioridad correcta?

**Sesión estratégica — al entrar a fase nueva**
Duración: 30–45 min. Revisión profunda antes de pasar de fase.
Agenda: condiciones del mercado, producto y métricas justifican avanzar o ajustar roadmap.

**Filtro de monetización — obligatorio en toda sesión**
Antes de ejecutar cualquier trabajo: ¿esto nos acerca al primer peso? Si la respuesta no es clara — parar y alinear con Vera antes de continuar.

| Hito | Trigger sesión |
|---|---|
| QA end-to-end aprobado | Pulso Vera — ¿arrancamos infraestructura + pivote? |
| Infraestructura + pivote definidos | Estratégica Vera + Noa + Maya — ¿listos para lanzar? |
| Primeros 50 usuarios | Pulso Lena — ¿el producto retiene? |
| Primeros ingresos | Estratégica Lena — ¿el modelo freemium funciona? |
| Entrada a Fase 3 (Validate) | Estratégica — activar AB tests con Lena + activar Iris (DA) |
| Entrada a Fase 4 (Monetize) | Estratégica completa — revisión de modelo con datos reales |

---

## 17. Flujo de documentos por rol

Todo rol lee el OL-CONTEXT al iniciar sesión. Es la fuente de verdad estratégica del holding.

| Rol | Documentos de sesión |
|---|---|
| Vera (CEO+COO) | Base Rules + Role-Vera + OL-CONTEXT |
| Lena (CGO+UR) | Base Rules + Role-Lena + OL-CONTEXT |
| Noa (CPO) | Base Rules + Role-Noa + OL-CONTEXT |
| Maya (CMO) | Base Rules + Role-Maya + OL-CONTEXT |
| Cael (PO) | Base Rules + Role-Cael + OL-CONTEXT + CONTEXT-[proyecto activo] + Backlog-[proyecto activo] |
| Rune (FS) | Base Rules + Role-Rune + OL-CONTEXT + CONTEXT-[proyecto activo] + Backlog-[proyecto activo] + MAP-[proyecto activo] |
| Nova (UX) | Base Rules + Role-Nova + OL-CONTEXT + CONTEXT-[proyecto activo] + Brief-Noa (si existe) |
| Flux (CC) | Base Rules + Role-Flux + OL-CONTEXT + Brief-Maya (si existe) |
| Eden (ET) | Base Rules + Role-Eden + CONTEXT-CM + Arquitectura-Curricular-[sección activa] |
| Sage (GC) | Base Rules + Role-Sage + CONTEXT-CM + Arquitectura-Curricular-[sección activa] |
| Finn (QA) | Base Rules + Role-Finn + OL-CONTEXT + CONTEXT-[proyecto activo] + Backlog-[proyecto activo] |
| Iris (DA) | Base Rules + Role-Iris + OL-CONTEXT + Dashboard-métricas (si existe) |

---

## 18. Riesgos identificados

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Competencia en inglés | Medio | Diferenciador es diagnóstico de gaps en español — no volumen de contenido |
| Ciclo de uso corto | Alto | Modelo freemium + pago único mitiga dependencia de retención; adquisición por foros y reclutadores |
| Calidad del contenido | Medio | Banco PC 2325Q + MK 2750Q con IDs saneados; validación pedagógica en Fase 3 con usuarios reales |
| Lanzamiento sin infraestructura | Alto | Decisión 2026-04-26: no lanzar sin dominio, presentación y propuesta de valor clara |

---

## 19. Decisiones registradas

`kill_criteria` es opcional. Se usa cuando la decisión implica inversión de tiempo significativa, cambio de modelo, o riesgo de bloqueo de otra fase.

| Fecha | Decisión | Contexto | Kill criteria |
|---|---|---|---|
| 2026-04-17 | Vera creada como rol estratégico | Primera sesión de diseño del ecosistema | — |
| 2026-04-17 | Finn (QA) y Lena (Growth) registrados en espera | Trigger: primer release público / usuarios reales | — |
| 2026-04-17 | Holding modelado sobre tres proyectos | ASVAB App, CM, PEPE | — |
| 2026-04-18 | Visión y Misión definidas | Primera sesión estratégica con Vera | — |
| 2026-04-18 | Modelo de negocio: Freemium + pago único | Suscripción descartada por ciclo de uso corto | Revisar si conversión < 2% en 60 días post-lanzamiento |
| 2026-04-18 | Métricas de éxito a 6 meses establecidas | Base conservadora para primer ciclo de validación | — |
| 2026-04-18 | Roadmap estratégico en 4 fases definido | Build → Launch → Validate → Monetize | — |
| 2026-04-18 | Alcance Fase 1 reducido a 4 áreas AFQT | MVP cubre solo el subconjunto que determina elegibilidad | — |
| 2026-04-18 | CM va primero — ASVAB App desbloqueada cuando banco AFQT esté listo | Elimina riesgo de MVP vacío | — |
| 2026-04-18 | OL-CONTEXT es documento base que todos los roles leen | Fuente de verdad estratégica del holding | — |
| 2026-04-18 | Estimaciones en tiempo real del founder | 6–8 hrs/día efectivas; lanzamiento estimado en 3–5 días calendario | — |
| 2026-04-18 | Protocolo de revisión estratégica con Vera definido | Pulso en cada hito, estratégica en cada cambio de fase | — |
| 2026-04-20 | Nombres canónicos de proyecto definidos con prefijos y aliases | Strings: Obsidian Labs/OL · ASVAB App/AS · CM/CM · AI Tracker/AI (alias PEPE) | — |
| 2026-04-20 | Convención de naming de documentos vivos actualizada | Patrón: [Prefijo]-[TIPO]_V[X]_[Y].md | — |
| 2026-04-24 | Lena (GW) activada con scope expandido | Consultoría pre-lanzamiento, paywalls, AC de conversión | — |
| 2026-04-26 | Vera expandida a CEO+COO | Agrega coordinación operativa, competitive intelligence, gestión de riesgos activa y filtro de monetización | — |
| 2026-04-26 | Lena expandida a CGO+UR | User research integrado a growth — elimina handoff entre discovery y conversión | — |
| 2026-04-26 | Noa (CPO) creada | Visión de producto transversal — custodio de diagnóstico como feature y experiencia de conversión | — |
| 2026-04-26 | Maya (CMO) creada | Narrativa de marca, canales de comunidad, reclutadores como multiplicador B2B | — |
| 2026-04-26 | Propuesta de valor definida desde dolor real del usuario | Diagnóstico de gaps + dirección clara + español nativo | — |
| 2026-04-26 | Canal primario identificado | Foros hispanohablantes + reclutadores del Army como multiplicadores | — |
| 2026-04-26 | Funnel preliminar establecido | Free = diagnóstico básico · Pago = diagnóstico completo + plan de cierre + simulaciones ilimitadas | — |
| 2026-04-26 | Decisión de no apresurar lanzamiento | Construir bien — infraestructura, pivote de producto y equipo ejecutivo primero | — |
| 2026-04-26 | Equipo rediseñado — roles legacy deprecados | PO/FS unificados: Cael + Rune transversales. Axis·Orion·Alex·Rex·Kai·Mike deprecados | — |
| 2026-04-26 | Nova expandida a UX transversal | Scope anterior: ASVAB App únicamente. Scope nuevo: todo el ecosistema | — |
| 2026-04-26 | Flux (CC) creado | Ejecución de contenido externo bajo Maya — canales, comunidades, reclutadores | — |
| 2026-04-26 | Iris (DA) creada | Analytics y métricas de conversión bajo Lena — activa en Fase 3 con 50 usuarios | — |
| 2026-04-26 | Eden y Sage reportan a Noa (CPO) | Contenido de producto — sin intermediario técnico | — |
| 2026-04-26 | Finn (QA) activado | QA del MVP en cierre — trigger adelantado por necesidad de release | — |
| 2026-04-26 | Base Rules actualizada a V2.2.0 | Tabla de roles completa con nuevo equipo y cadenas de reporte | — |
| 2026-04-27 | AI-MAP eliminado del protocolo CHECKPOINT | El MAP se genera desde archivos reales al cierre de sprint via PP | — |
| 2026-04-27 | Base Rules actualizada a V2.6.0 | MAP-SECTION eliminado de CHECKPOINT | — |
| 2026-04-27 | Role-Rune actualizado a V1.1 | Protocolo de inicio: MAP ya no es obligatorio | — |
| 2026-05-06 | Council framework descartado — kill_criteria adoptado | Council redundante con estructura de roles existente | — |
| 2026-05-06 | Nombre del holding actualizado a Obsidian Labs | String canónico: Obsidian Labs. Prefijo: OL. Archivos OB- son histórico | — |

---

## 20. Notas de sesión

**2026-04-18 — Primera sesión estratégica con Vera**
- CONTEXT completado desde cero: visión, misión, objetivo, modelo de negocio, mercado, métricas y roadmap.
- Diferenciador central identificado: barrera del idioma en el ASVAB.

**2026-04-18 — Segunda sesión estratégica con Vera**
- Roadmap traducido a backlog inicial con secuencia de sprints.
- Alcance Fase 1 corregido: 4 áreas AFQT, no 9 áreas ASVAB.
- Flujo de documentos por rol definido. Estimaciones de tiempo real del founder establecidas.

**2026-04-20 — Sesión de mantenimiento con Vera**
- Nombres canónicos de proyecto definidos. Base Rules actualizada a V1_9_3.

**2026-04-26 — Sesión ejecutiva con Vera + Lena**
- Decisión de no apresurar el lanzamiento — construir bien primero.
- Propuesta de valor definida desde historia real del usuario (hermano del founder).
- Dolor real identificado: memorización sin diagnóstico.
- Equipo ejecutivo rediseñado: Vera CEO+COO, Lena CGO+UR, Noa CPO (nuevo), Maya CMO (nuevo).
- Funnel preliminar establecido. Canal primario identificado: foros + reclutadores.

**2026-04-26 — Sesión C-level completo — rediseño de equipo**
- Base Rules y CONTEXT revisados — gaps identificados en secciones 8 y 17.
- Equipo de ejecución rediseñado desde cero: PO/FS unificados en Cael y Rune transversales.
- Roles legacy deprecados: Axis, Orion, Alex, Rex, Kai, Mike.
- Roles nuevos creados: Cael (PO) · Rune (FS) · Flux (CC) · Iris (DA).
- Nova expandida a UX transversal. Eden y Sage migrados a reporte directo con Noa.
- Finn activado para QA de ASVAB App AS-S-03.
- Base Rules actualizada a V2.2.0 con roster completo y cadenas de reporte.

**2026-04-27 — Sesión Vera — AI Tracker infraestructura**
- Decisión de eliminar MAP-SECTION del protocolo CHECKPOINT.
- AI-MAP pasa a generarse desde archivos reales al cierre de sprint via PP.
- Base Rules actualizada a V2.6.0. Role-Rune actualizado a V1.1.

**2026-05-06 — Sesión Vera — evaluación Council framework**
- Council framework evaluado — descartado por redundancia con estructura de roles existente.
- kill_criteria adoptado como campo opcional en decisiones de alto riesgo de sección 19.

**2026-05-06 — Sesión Vera — normalización de naming**
- Nombre del holding actualizado a Obsidian Labs. Prefijo OB → OL.
- Base Rules §2 y §3 actualizados. desc eliminado como alias de title en Base Rules §6.
- Role files pendientes de actualización — T abierto en PP-S-25.