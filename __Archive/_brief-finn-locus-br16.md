# Brief Finn — Alineación Locus a BR infra_version 16
<!-- Emitido por: ST · Vera | Fecha: 2026-06-09 | Proyecto: Locus -->

---

## Contexto

Se completó auditoría de infraestructura BR (Core v2.2 · Ecosystem v3.14 · Execution v2.6 · OB-Strategy v4.7). Las reglas nuevas o modificadas tienen impacto directo en el comportamiento de Locus. Este brief lista las validaciones requeridas agrupadas por tipo de trabajo.

---

## 1. Validaciones de comportamiento — implementar o verificar en Locus

Estas 6 validaciones provienen de la auditoría (sección D). Para cada una: verificar si Locus ya lo implementa, y si no — emitir T con AC.

### D1 — Transición `en-revision → bloqueado` en R solo por Finn

**Comportamiento esperado:** Locus acepta esta transición solo si viene de CHECKPOINT con `Rol: QA · Finn`. Cualquier otro rol que intente mover un R a `bloqueado` genera advertencia en DocLog — no bloquea la ingesta pero registra el intento.

**Riesgo si no se valida:** Cualquier rol puede bloquear un R indefinidamente sin autorización.

---

### D2 — Bloqueo total de CHECKPOINT con T en `en-revision` + `sprint: icebox`

**Comportamiento esperado:** Locus rechaza el CHECKPOINT completo — no aplica ningún cambio parcial. El mensaje de error declara el código de cada ítem en conflicto. Si hay más de uno, los lista todos.

**Referencia BR:** BR-Ecosystem §5 "Regla de bloqueo por rol".

**Riesgo si no se valida:** Ítems en desarrollo sin sprint asignado — deuda de proceso invisible.

---

### D3 — R sin Ts válidos → conversión automática a P

**Comportamiento esperado:** Al perder todos sus Ts válidos (eliminados o todos en `descartado`):
- El R se convierte a P en el siguiente ciclo de render
- Conserva: `title`, `area`, `priority`
- Descarta: `ac` del R
- Cambia: `type` de R a P
- Genera nota en DocLog: `R [código] sin Ts válidos convertido a P — refinar antes de promover`
- Si el R tenía una P que lo referenciaba con `promovida_a` → esa P debe actualizar su `promovida_a` o quedar con advertencia de referencia huérfana en DocLog

**Riesgo si no se valida:** R convertido a P con trazabilidad rota.

---

### D4 — Alerta de `infra_version` desactualizada en doc de proyecto

**Comportamiento esperado:** Al parsear CHECKPOINT de doc de proyecto con `infra_version` menor al valor activo en OB-Strategy §5:
- Locus emite alerta: `infra_version desactualizada: [doc] declara infra_version:[X], valor activo es infra_version:[Y]. Verificar consistencia antes de continuar.`
- La alerta es informativa — no bloquea la sesión
- El doc puede seguir operando con la discrepancia declarada

**Referencia BR:** BR-Core §1.

**Riesgo si no se valida:** Docs de proyecto operando silenciosamente con infraestructura desactualizada.

---

### D5 — Herencia de sprint parent→hijo bloquea drag & drop cuando parent está en icebox

**Comportamiento esperado:**
- Mover un T a sprint distinto al de su parent por drag & drop → bloqueado con mensaje: `El sprint del T se hereda de su parent [código R].`
- Si el parent está en icebox → el T no puede moverse a ningún sprint real por drag & drop. Debe permanecer en icebox hasta que el parent salga.
- El bloqueo aplica también en edición manual del campo sprint en el IDP

**Referencia BR:** BR-Ecosystem §5 "Herencia de sprint parent→hijo — regla dura".

**Riesgo si no se valida:** T asignado a sprint sin que su R padre tenga sprint — estado inconsistente en Locus.

---

### D6 — Conflicto de DOC-UPDATEs sobre misma sección del mismo doc

**Comportamiento esperado:**
- Si en el mismo sprint hay dos DOC-UPDATEs sobre la misma sección del mismo doc con contenido contradictorio → Locus los agrupa y alerta al dueño con bandera de conflicto
- Mensaje: `Conflicto DOC-UPDATE: [sección] de [doc] tiene dos propuestas contradictorias — [título CHECKPOINT 1] vs [título CHECKPOINT 2]. Resolver antes de aplicar.`
- Ninguno de los dos se aplica hasta resolución explícita del dueño
- La alerta incluye los títulos de ambos CHECKPOINTs en conflicto

**Referencia BR:** BR-Ecosystem §12.

**Riesgo si no se valida:** DOC-UPDATE incorrecto aplicado silenciosamente.

---

## 2. Reglas nuevas que Locus debe implementar — infra_version 16

Reglas incorporadas en esta versión de BR que Locus aún no tenía. Para cada una: verificar estado actual e implementar si falta.

### 2a — Sprint S-HOTFIX persistente por proyecto

**Regla (BR-Core §6):**
- Locus crea `[Prefijo]-S-HOTFIX` automáticamente al inicializar un proyecto nuevo, o el founder lo crea con 1-tap en UI de sprints
- `version_target: n/a` — única excepción explícita a la regla dura
- Solo acepta Bs con `priority: high`
- No genera retro propia — los Bs resueltos aparecen en retro del siguiente sprint regular con nota `hotfix · [fecha]`
- No se cierra al final de un ciclo normal

---

### 2b — Fix inline: bloque `inline_fix` en CHECKPOINT de Rune

**Regla (BR-Core §7 + BR-Ecosystem §8):**
- Locus indexa el bloque `inline_fix` para trazabilidad sin crear B ni T en el backlog
- Finn lo audita junto al T padre en la misma sesión de QA — no requiere sesión separada
- Schema del bloque:
```
inline_fix:
  descripcion: [qué se resolvió — una línea]
  archivo: [archivo tocado]
  triggered_by: [código del T activo]
```

---

### 2c — R sin AC rechazado al parsear

**Regla (BR-Ecosystem §5):**
- Locus rechaza el CHECKPOINT completo si contiene un R con campo `ac` vacío o ausente
- Mensaje: `CHECKPOINT bloqueado: R [código/título] no tiene AC de coherencia de conjunto. Origen: [título del CHECKPOINT]. Adjuntar CHECKPOINT corregido antes de continuar.`
- No aplica ningún cambio del CHECKPOINT hasta resolución

---

### 2d — Rune bloquea al iniciar sesión si R padre está en icebox

**Regla (BR-Ecosystem §5):**
- Cuando Rune inicia sesión con un T cuyo R padre está en icebox → bloqueo en el primer mensaje
- Mensaje: `Bloqueo: R padre [código] está en icebox. Acción sugerida: asignar R a sprint antes de continuar.`
- Rune no abre ningún archivo ni implementa nada hasta que el R padre salga de icebox
- Esto no lo implementa Locus directamente — es comportamiento del rol Rune. Pero Locus debe rechazar CHECKPOINT de Rune con T en `en-revision` si el R padre está en icebox (ya cubierto por D2)

---

### 2e — `infra_version` obligatorio en Docs vivos

**Regla (OB-Strategy §5):**
- Todo doc de categoría Docs (`context`, `backlog`, `strategy`) debe declarar `infra_version` en su encabezado
- Locus alerta si un doc vivo se adjunta sin `infra_version` declarado: `Doc [nombre] sin infra_version declarado — campo obligatorio en Docs vivos.`
- Doc Refs (`css-ref`, `ux-ref`, `module-contracts`) usan `mod` como señal de frescura — `infra_version` es opcional en ellos

---

### 2f — `sprint_proposal` se omite (no `null`) cuando no hay propuesta

**Regla (BR-Ecosystem §8):**
- El parser detecta ausencia del campo `sprint_proposal` — no valor `null` ni objeto vacío
- Si el parser recibe `sprint_proposal: null` → tratarlo como campo ausente (no activar Step 0)
- Si el parser recibe `sprint_proposal: {}` → advertencia en DocLog: `sprint_proposal vacío ignorado — omitir campo cuando no hay propuesta.`

---

### 2g — Regla transitoria: DOC-UPDATE siempre con MD editable

**Regla (BR-Core §8):**
- Vigente hasta que Vera declare los generadores de Locus confiables
- Todo DOC-UPDATE en CHECKPOINT va acompañado del MD completo actualizado
- El rol solicita el MD editable antes de operar — nunca reconstruye desde contexto
- Locus puede mostrar recordatorio en la vista de DOC-UPDATEs pendientes: `Regla transitoria activa — verificar que el MD actualizado está adjunto al CHECKPOINT de origen.`

---

## 3. Schema v2 — gaps en backlog PP-S-01 actual

El backlog PP-BACKLOG v0.2.0 tiene todos los ítems en `schema_version: 1`. Los campos faltantes de schema v2 que Finn debe verificar o Cael debe patchear antes de que Rune ejecute:

| Campo | Ítems afectados | Acción |
|---|---|---|
| `depends_on` ausente | Todos los Ts (23) | Cael declara en sesión de refinamiento o Rune declara `[]` al iniciar cada T |
| `no_incluye` ausente | Todos los Ts (23) | Cael agrega en próxima sesión de refinamiento |
| `contract_update` ausente | T-202606-005 · T-202606-011 · T-202606-023 (Effort 2) | Obligatorio — Cael emite patch antes de que Rune ejecute |
| `triggered_by` ausente en B | B-202606-002 | Cael emite patch — campo obligatorio en todo B |

---

## 4. Prioridad de ejecución sugerida

| Orden | Qué | Por qué |
|---|---|---|
| 1 | D2 — bloqueo T en-revision + icebox | Bloquea estado inválido hoy en el backlog activo |
| 2 | 2c — R sin AC rechazado | Gate de calidad en ingesta |
| 3 | D1 — transición bloqueado solo por Finn | Integridad del ciclo de vida de R |
| 4 | D5 — drag & drop con herencia de parent | Consistencia de sprint en UI |
| 5 | 2a — S-HOTFIX persistente | Protocolo de emergencia operativo |
| 6 | 2b — inline_fix indexado | Trazabilidad de fixes menores |
| 7 | D3 — R sin Ts → P | Integridad del backlog a largo plazo |
| 8 | D4 · D6 · 2d · 2e · 2f · 2g | Alertas y recordatorios — menor urgencia |

---

*Brief emitido por Vera (ST) — para sesión de Finn con backlog PP adjunto y BR-Core v2.2 · BR-Ecosystem v3.14 cargados.*
