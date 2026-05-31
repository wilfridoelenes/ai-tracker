# PP-BRIEF-Fundacional_V1_0.md
<!-- Versión: 1.0 | Última actualización: 2026-05-25 | Brief fundacional de Locus — diagnóstico + propuestas | Autor: Cael (PO+BA) -->

---

## 1. Propósito de este documento

Brief de referencia generado en sesión fundacional con Cael (PO+BA). Captura el diagnóstico completo de Locus post-PP-S-08, la radiografía de lo que existe, y las propuestas de mejora priorizadas.

Este documento es input para las siguientes sesiones de especificación. No es backlog — es la base desde la cual se emiten Rs.

---

## 2. Modelo operativo real de Locus

### El problema que Locus resuelve

El founder opera múltiples Workers (cuentas Claude gratuitas con cooldown de ~5h) en paralelo. Cada Worker monta un rol distinto por sesión. Sin Locus, el contexto se pierde entre sesiones, el trabajo se fragmenta, y el founder no sabe qué Worker está disponible, qué quedó pendiente, o qué sigue.

**Locus es el cerebro externo que el founder consulta antes, durante y después de cada sesión de Worker.**

### Glosario operativo

| Término | Definición |
|---|---|
| **Worker** | Cuenta Claude gratuita — tiene límite de uso y cooldown de ~5h |
| **Rol** | Función que el founder instruye al Worker en cada sesión (Cael, Rune, Nova, Finn, etc.) |
| **Sesión** | Una interacción con un Worker — tiene inicio, entregable y CHECKPOINT |
| **CHECKPOINT** | Output estructurado de la sesión — alimenta Locus con ítems y estado |

### Modelo de trabajo

- El trabajo es **paralelo** — múltiples Workers activos el mismo día siempre que el trabajo lo permita
- Un Worker puede montar distintos roles en distintas sesiones
- La disponibilidad de un Worker depende de su estado de cooldown — Radar la trackea

### La pregunta central que Locus debe responder en menos de 10 segundos

> "Tengo X Workers disponibles ahora. ¿Qué rol monto en cada uno y qué ítem le doy sin que se bloqueen entre sí?"

**Hoy, el founder construye esa respuesta mentalmente.**

---

## 3. Flujo del founder por momento

| Momento | Pregunta real | Locus hoy | Gap |
|---|---|---|---|
| **Antes de abrir sesión** | ¿Quién está disponible? | Radar sidebar — resuelto | — |
| **Al asignar trabajo** | ¿Qué rol + ítem le doy a este Worker? | No existe | Gap principal |
| **Al asignar en paralelo** | ¿Qué ítems puedo dar en paralelo sin conflicto? | Dependencias declarables, no accionables | Gap secundario |
| **Al preparar sesión** | ¿Qué documentos necesita este Worker? | Manual — el founder lo arma | Gap secundario |
| **Al cerrar sesión** | ¿Qué produjo este Worker? ¿Afecta a otro? | CHECKPOINT + Merge Diff — resuelto | — |
| **Entre sesiones** | ¿Cuál es el estado real del proyecto ahora? | Pulso + Arranque — parcial, redundante | Gap menor |
| **Al planificar siguiente ronda** | ¿A quién le doy qué, en qué orden? | Sprint Plan — no conecta con Workers | Gap secundario |

---

## 4. Radiografía por capa

### CAPA 1 — Control de Workers

**Estado: Funciona bien, no conecta hacia adelante**

| Elemento | Qué hace realmente | Veredicto |
|---|---|---|
| Radar sidebar | Estado, countdown, disponibilidad de Workers | ✅ Funciona — es terminal, no conecta |
| Sugerencia de Worker | Score basado en actividad reciente | ⚠️ Score no considera trabajo pendiente ni rol requerido |
| Worker chip en header | Muestra Worker en sesión activa + timer | ✅ Funciona — no conecta con ítem en ejecución |
| Quick Capture | Modal 2 pasos — ingesta rápida de sesión | ✅ Funciona — parche funcional |
| Tracker (tab Sesiones) | Historial por Worker / por día | ✅ Funciona — vinculación de ítems a sesión es manual |

**Gap de capa:** El Radar sabe quién está disponible. Nadie le pregunta qué darle.

---

### CAPA 2 — Gestión de trabajo

**Estado: Fragmentado — tres módulos que deberían hablar no hablan**

| Elemento | Qué hace realmente | Veredicto |
|---|---|---|
| Backlog — vista Sprints | Ítems agrupados por sprint, filtrables, colapsables | ✅ Funciona |
| Backlog — vista Árbol | Jerarquía R→T | ✅ Funciona |
| Backlog — vista Kanban | Columnas por estado | ✅ Funciona |
| Backlog — vista Focus | Filtro priority:high | ✅ Funciona |
| Backlog — vista Planificar | Drag & drop backlog → sprint | ✅ Mecánicamente funciona — no lee `role` ni dependencias |
| Dependencias entre ítems | `_isBlocked()` calcula bloqueos reales | ⚠️ Badge en ítem — no hay vista de cadena ni grafo |
| Campo `role` en ítems | Existe en schema, se guarda | ❌ Muerto en UI — no conecta con Workers ni filtra vistas |
| Sprint tab — Panel Ítems | Tres secciones: pendiente / bloqueado / done | ✅ Funciona aislado |
| Sprint tab — Workers vinculados | Lista Workers asignados al sprint | ⚠️ Asignación manual — no conecta con disponibilidad del Radar |
| Sprint tab — Burndown | Progreso de effort | ✅ Funciona |
| Sprint tab — Panel Planificar | Drag & drop para asignar ítems a sprint | ✅ Mecánicamente funciona — no lee `role` ni dependencias |
| Sprint Plan | Renderiza EXECUTION-PLAN ingresado via CHECKPOINT | ⚠️ Muestra lo que el founder construyó — no ayuda a construirlo |

**Gap de capa:** Backlog, Sprint y Radar existen en silos. El campo `role` es la pieza que conectaría los tres — y está muerto.

---

### CAPA 3 — Estado del ecosistema

**Estado: Redundante — dos respuestas a la misma pregunta**

| Elemento | Qué hace realmente | Veredicto |
|---|---|---|
| Pulso | Velocidad semanal, bloqueantes, sprints estancados, planes activos | ✅ Cálculos reales — responde "¿cómo va?" no "¿qué hago?" |
| Arranque overlay | Workers disponibles + sesiones recientes del sprint | ⚠️ Subset de Radar + Pulso — no añade decisión |

**Solapamiento:**

| Pulso | Arranque | Solapan en |
|---|---|---|
| Velocidad del ecosistema | Workers disponibles ahora | Estado de Workers |
| Bloqueantes activos | Sesiones recientes del sprint | Sesiones recientes |
| Sprints estancados | — | — |
| Planes activos | — | — |

**Gap de capa:** El founder consulta dos lugares para respuestas que deberían estar en uno. Ninguno le dice qué hacer — solo qué está pasando.

---

### CAPA 4 — Ingesta de resultados

**Estado: Sólida — la mejor capa del sistema**

| Elemento | Qué hace realmente | Veredicto |
|---|---|---|
| Parser de CHECKPOINT | Parsea sesión + ítems + plan en un bloque — valida proyecto canónico, normaliza sprints | ✅ Robusto |
| `type: patch` | Actualiza campos individuales de ítems sin reemplazar | ✅ Robusto |
| Merge Diff | Two-column: estado actual vs entrante — founder aprueba ítem por ítem | ✅ Robusto |
| Standalone CHECKPOINT | Actualiza solo ítems, sin Worker | ✅ Funciona |

**Gap de capa:** La ingesta es sólida pero unidireccional — no hay feedback de "esto que ingresaste afecta estos Workers o estos ítems paralelos".

---

### CAPA 5 — Administración

**Estado: Overhead acumulado — residuos y elementos prematuros**

| Elemento | Veredicto |
|---|---|
| Reset Sesiones / Backlog | ✅ Necesario, bien protegido |
| Purge Sesiones Antiguas | ✅ Necesario, bajo uso |
| Migrate Firebase→Supabase | ❌ Residual — ya migrado, modal candidato a eliminar |
| Analytics tab | ⚠️ Prematuro — datos existen, volumen no justifica el tab todavía |
| Document Generator | ✅ Crítico — pero enterrado en sub-tab de Templates |
| Tags | ⚠️ Bajo uso — valor no demostrado |
| Weekly Summary | ✅ Útil — automático |

---

## 5. Diagnóstico consolidado

### Lo que funciona bien
- Disponibilidad de Workers → Radar sidebar
- Ingesta de resultados → CHECKPOINT + Merge Diff
- Gestión de ítems → Backlog (vistas múltiples)
- Sprint tracking → burndown, scope added, estado de ítems

### El gap central
**La pregunta "¿qué le doy a quién ahora?" no tiene respuesta en Locus.**

Tres módulos deberían resolverlo juntos y no se comunican:
1. Radar — sabe quién está disponible
2. Backlog — sabe qué hay que hacer y quién lo ejecuta (campo `role`)
3. Sprint Plan — sabe el orden previsto

### Gaps secundarios
- Dependencias declarables pero no accionables visualmente
- Pulso y Arranque redundantes sin coordinación
- Document Generator enterrado — crítico pero inaccesible
- Analytics prematuro para el volumen actual

### Lo que sobra o es parche
- Modal Migrate Firebase→Supabase — residual
- Quick Capture — parche de fricción del flujo principal
- Arranque overlay — subset redundante de Radar + Pulso
- Analytics tab — prematuro

---

## 6. Propuestas

### Propuesta 1 — Activar el campo `role` en ítems
**Prioridad: Alta — es la pieza que conecta todo**

El campo `role` existe en el schema de cada ítem pero está muerto en UI. Activarlo significa:

1. **Poblar:** flujo en Locus para asignar `role` a ítems del sprint activo — batch o inline desde el IDP
2. **Filtrar:** vista en Backlog filtrada por `role` — "muéstrame solo los ítems de Rune"
3. **Conectar al Radar:** cuando el founder selecciona un Worker disponible, Locus muestra los ítems cuyo `role` corresponde a lo que ese Worker puede montar

**Resultado esperado:** El founder ve Worker disponible → selecciona → Locus sugiere ítems ejecutables por ese rol sin conflicto.

---

### Propuesta 2 — Vista de asignación paralela
**Prioridad: Alta — responde la pregunta central**

Vista nueva o extensión del Sprint tab que responde:
> "Tengo estos Workers disponibles — ¿qué ítems puedo asignarles en paralelo sin que se bloqueen?"

Requiere:
- Campo `role` activo (Propuesta 1)
- Dependencias leídas para excluir ítems bloqueados
- Workers disponibles del Radar como input

**Formato propuesto:** Dos columnas — Workers disponibles | Ítems asignables sin conflicto por rol.

---

### Propuesta 3 — Dependencias accionables
**Prioridad: Media**

Hoy las dependencias son un badge en el ítem. Propuesta:

1. **Vista de cadena:** en el IDP de un ítem, mostrar cadena completa — qué bloquea a este ítem y qué bloquea este ítem a otros
2. **Vista en Sprint:** sección "bloqueados" ya existe — añadir "qué desbloquea cada uno" como acción directa
3. **En vista Planificar:** highlight visual de ítems bloqueados al hacer drag — el founder ve antes de soltar si el ítem es asignable

---

### Propuesta 4 — Unificar Pulso + Arranque en una vista de "Estado ahora"
**Prioridad: Media**

Eliminar redundancia. Una sola vista que responda las dos preguntas actuales:
- ¿Cómo va el proyecto? (hoy: Pulso)
- ¿Quién está disponible y qué sesiones recientes hubo? (hoy: Arranque)

**Propuesta:** Expandir Pulso para incluir la información del Arranque — o convertir el Arranque en el punto de entrada canónico que consume Pulso. Eliminar el overlay redundante.

---

### Propuesta 5 — Elevar el Document Generator
**Prioridad: Media**

El Document Generator es crítico — genera MAP, CONTEXT y Backlog desde archivos reales. Hoy está enterrado en Templates > sub-tab.

**Propuesta:** Acceso desde el header o desde el footer global — mismo nivel de acceso que el CHECKPOINT.

---

### Propuesta 6 — Eliminar residuos
**Prioridad: Baja — limpieza**

| Elemento | Acción |
|---|---|
| Modal Migrate Firebase→Supabase | Eliminar — migración ya completada |
| Tags | Evaluar uso real antes del siguiente sprint — si no hay evidencia de uso, deprecar |
| Analytics tab | No eliminar — sí reducir a widget en otra vista hasta que el volumen lo justifique |

---

## 7. Orden de ejecución propuesto

```
Fase 1 — Conectar lo que existe
  └── Propuesta 1: Activar campo role en ítems
  └── Propuesta 3: Dependencias accionables (versión mínima — cadena en IDP)

Fase 2 — Responder la pregunta central
  └── Propuesta 2: Vista de asignación paralela
      (requiere Fase 1 completa)

Fase 3 — Simplificar
  └── Propuesta 4: Unificar Pulso + Arranque
  └── Propuesta 5: Elevar Document Generator
  └── Propuesta 6: Eliminar residuos
```

---

## 8. Lo que no cambia

- La arquitectura de CHECKPOINT — es la capa más sólida, no tocar
- El Radar sidebar — funciona bien, solo necesita output hacia la vista de asignación
- El Backlog como fuente de verdad de ítems — sólido
- El modelo de sprints — funciona, no rediseñar

---

## 9. Notas de sesión

**2026-05-25 — Sesión fundacional con Cael**
- Diagnóstico completo generado desde cero en sesión con el founder
- Modelo operativo real documentado por primera vez
- Radiografía por capa completada
- Seis propuestas priorizadas en tres fases
- Próximo paso: especificación de Rs de Fase 1 con Cael
