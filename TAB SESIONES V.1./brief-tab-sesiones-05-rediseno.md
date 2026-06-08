# Brief · Tab Sesiones · Etapa 5 — Rediseño
<!-- Proyecto: Locus · Rol: UX · Nova · Generado: 2026-06-08 -->
<!-- Contexto: resultado de sesiones de análisis estructural + auditoría de deuda del Tab Sesiones -->
<!-- Prerequisitos: Etapas 1–4 completas o al menos Etapas 1 y 4 -->

---

## Prerequisitos antes de iniciar esta etapa

| Etapa | Condición mínima |
|---|---|
| Etapa 1 — Limpieza | Legacy sidebar eliminado o decisión documentada — sin deuda activa en el tab |
| Etapa 2 — Documentación | UX-ref con estados de AI Card y grid documentados — Nova opera con referencia actualizada |
| Etapa 4 — Análisis funcional | Flujo de ingesta y selección de Worker entendidos — no se rediseña lo que no se entiende |
| Etapa 3 — Refactor | Deseable pero no bloqueante — buildCard puede rediseñarse antes de partir |

---

## Contexto del diseño actual

### Grid y layout
- 3 columnas: historial Worker (40fr) / card + ingesta (60fr) / detalle sesión (0fr→30fr)
- Desktop-only: 1920×1080 · 2560×1080
- Col 3 nace en 0fr y se expande al seleccionar sesión — patrón animado con `var(--transition-base)`
- Col tabs (`.tracker-col-tabs`) solo visible en mobile (<900px) — `display: none` en desktop

### AI Card — estructura actual
Cada card tiene 5 zonas verticales:
1. Header: avatar + nombre + badge de estado + sprint ID + menú
2. Stats: 3 columnas (checkpoints / sesiones / promedio desde apertura)
3. Stepper: 3 pasos (pegar / confirmar / guardar) — solo en estado `available`
4. Zona central: textarea de ingesta (available) o countdown dramático (exhausted)
5. Footer: acciones primarias + blind exhaust (available) o "Corregir hora" (exhausted)

### Flujo de ingesta actual
1. Usuario pega CHECKPOINT en textarea
2. Stepper avanza a paso 2 (confirmar)
3. Preview del CHECKPOINT aparece
4. Usuario guarda → paso 3 → feedback de éxito
5. Card se actualiza con nueva sesión en historial

---

## Áreas de rediseño propuestas

### Área 1 · Densidad del grid — col 1 vs col 2
La col 1 (mini-hist) existe para mostrar el historial del Worker seleccionado, pero el historial de sesiones también existe dentro de la card en col 2.

**Pregunta de diseño:** ¿hay duplicación de información entre col 1 (mini-hist) y la sección "Historial" de la card en col 2?

Opciones a evaluar en sesión:
- a) Col 1 muestra lista de Workers (selector) — col 2 muestra el historial del Worker seleccionado
- b) Col 1 muestra historial del Worker seleccionado — col 2 es solo ingesta
- c) Modelo actual — col 1 mini-hist + col 2 con card completa (historial + ingesta)

La respuesta cambia la arquitectura del tab. Requiere análisis funcional (Etapa 4) antes de decidir.

---

### Área 2 · AI Card — complejidad visual por estado
La card actualmente tiene 5 estados visualmente distintos. El usuario con un solo Worker ve un solo estado la mayor parte del tiempo. El usuario con múltiples Workers ve el grid completo.

**Tensiones actuales identificadas:**
- El stepper de 3 pasos ocupa espacio permanente aunque el usuario solo pegue CHECKPOINT ocasionalmente
- La zona central cambia radicalmente entre estados (textarea vs countdown) — la card "salta" visualmente
- El footer de `available` tiene blind exhaust colapsado — funcionalidad de baja frecuencia que ocupa espacio en el estado más común

**Preguntas de rediseño a responder:**
1. ¿El stepper debe ser visible siempre o solo cuando hay contenido en la textarea?
2. ¿El blind exhaust merece espacio en el footer o debería vivir solo en el menú dropdown?
3. ¿La transición entre estados de zona central debería ser animada para reducir el "salto" visual?

---

### Área 3 · Col 3 — panel de detalle de sesión
La col 3 existe pero no fue analizada en detalle en las sesiones anteriores. Su estructura es:
- Header: metadata de la sesión
- Body: contenido scrolleable
- Footer: acciones

**Pendiente de analizar antes de rediseñar:**
- ¿Qué información muestra el header? ¿título + fecha + Worker + proyecto?
- ¿Qué acciones tiene el footer? ¿editar, borrar, destacar?
- ¿La col 3 es solo lectura o permite edición inline?

---

### Área 4 · Empty states — coherencia y jerarquía
El tab tiene múltiples empty states con distintos niveles de orientación:

| Empty state | Mensaje actual | Nivel de orientación |
|---|---|---|
| Sin Workers | "Agrega tu primer Worker" + CTA | Alto — guía al usuario |
| Sin sesiones en card | "Sin checkpoints registrados" + hint | Medio |
| Sin Worker seleccionado | "Selecciona un Worker" (copy incorrecto) | Bajo — solo instrucción |
| Mini-hist vacío | "Sin sesiones registradas" | Bajo — solo estado |

**Propuesta:** unificar el tono y nivel de orientación de los empty states. Los de estado inicial (sin Workers) justifican más orientación. Los de estado vacío temporal (sin sesiones del Worker) justifican menos.

---

### Área 5 · Setup checklist banner
El banner de onboarding (`#setup-checklist-banner`) tiene 4 pasos: Worker / Proyecto / Ítem / Sesión. Está oculto por defecto (`.is-hidden`).

**Pendiente:** no se analizó cuándo aparece ni cuándo desaparece. Requiere lectura de `renderSetupChecklist` en `locus-ui-shell.js`.

---

## Archivos requeridos para la sesión de rediseño

- `_Locus-ux-ref` (versión post-Etapa 2 — con estados de card documentados)
- `_Locus-css-ref` (versión post-Etapa 2 — con variantes de badge declaradas)
- `index.html` (markup actualizado post-Etapa 1 si se eliminó el sidebar)
- `locus-sesiones.js` (para referencia de estados)
- `locus-sesiones-card.css` (sistema de diseño de la card)
- Outputs de Etapa 4 (mapa funcional + flujo de ingesta)

---

## Output esperado de la sesión

1. **Decisión documentada sobre Área 1** — arquitectura de columnas (requiere founder)
2. **Propuestas de rediseño de AI Card** — wireframe o especificación de estados con cambios concretos
3. **Restricciones UX actualizadas** — nuevas entradas en UX-ref si el rediseño cambia patrones existentes
4. **Ts de implementación para Rune** — especificados por Cael con AC cerrados
5. **CSS dependencies block** — entregable de Nova listo para Rune si hay cambios visuales

---

## Notas

- El rediseño no reemplaza funcionalidad — la reorganiza. Cualquier comportamiento eliminado requiere decisión explícita del founder.
- Las decisiones de Área 1 son arquitecturales — escalar a Noa (CPO) antes de ejecutar si afectan el modelo de información del producto.
- El rediseño de la card (Área 2) puede ejecutarse sin cambiar el layout del tab (Área 1) — son independientes.
