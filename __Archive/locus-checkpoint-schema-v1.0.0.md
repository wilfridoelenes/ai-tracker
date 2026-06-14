# _Locus-checkpoint-schema-v1.0.0.md
<!-- mod:1 · autor:Cael · 2026-06-13 -->
<!-- Doc Ref — referencia técnica para el parser de CHECKPOINT de Locus -->
<!-- Fuente de verdad: __BR-Ecosystem §8 · Dueño: Cael -->

---

## 1. Propósito

Este documento es la referencia técnica canónica del schema JSON de CHECKPOINT para el parser de Locus. Define todos los campos, tipos, valores válidos, comportamiento ante ausencia, y reglas de validación.

Audiencia: Rune (implementación del parser) · Cael (emisión de CHECKPOINTs) · Finn (auditoría de CHECKPOINTs emitidos).

Fuente normativa: `__BR-Ecosystem §8`. Este doc no reemplaza el BR — lo hace operacional para el parser.

---

## 2. Formato de bloque

Todo CHECKPOINT es un único objeto JSON dentro de un bloque de código con triple backtick **sin especificador de lenguaje**.

```
{
  ...campos...
}
```

**Regla dura:** No usar ` ```json ` como especificador. El especificador `json` activa el path primario del parser y puede generar falsos positivos si `doc_updates.content` contiene bloques de código embebidos.

CHECKPOINTs históricos en formato Markdown (`---CHECKPOINT---`) se parsean en modo legado read-only. Ningún rol emite CHECKPOINTs nuevos en ese formato.

---

## 3. Schema completo — campos raíz

| Campo | Tipo | Obligatorio | Default | Descripción |
|---|---|---|---|---|
| `title` | string | ✅ Siempre | — | Título descriptivo de la sesión. Gate de parseo — sin este campo el CHECKPOINT no se aplica. |
| `project` | string | ✅ Siempre | — | String canónico exacto del proyecto. Ver `__OB-Strategy §5`. Valores válidos: `Locus` · `Alisto` · `Content Manager` · `Obsidian Labs`. |
| `role` | string | ✅ Siempre | — | Formato `Sigla · Nombre`. Ej: `FS · Rune`, `PO · Cael`, `UX · Nova`, `QA · Finn`. |
| `summary` | string | ✅ Siempre | — | Resumen de lo realizado en la sesión — una o dos líneas. |
| `files` | string | ⚪ Opcional | omitir | Archivos entregados. Para archivos reales de módulo: `nombre.js · mod:N · autor:Rol \| otro.css · mod:N · autor:Rol`. Para roles sin archivos reales: lista de nombres simple. Omitir si la sesión no produjo archivos. |
| `duration` | string | ⚪ Opcional | omitir | Tiempo real de la sesión. Formato: `HH:MM`. Omitir si no se registró. |
| `context` | string | ⚪ Opcional | omitir | Estado relevante del proyecto o sesión. `n/a` si no aplica. |
| `blockers` | string | ⚪ Opcional | omitir | Bloqueantes activos al cerrar. `n/a` si no hay. |
| `learning` | string | ⚪ Opcional | omitir | Aprendizaje o decisión de proceso relevante. `n/a` si no hay. |
| `docs_verified` | string | ⚪ Opcional | omitir | Solo en sesiones que modifican docs. Omitir si la sesión no modifica docs. |
| `tensions_resolved` | string | ⚪ Opcional | omitir | Solo cuando hay tensiones detectadas y resueltas. Omitir si sin tensiones. |
| `decision` | string | ⚪ Opcional | omitir | Decisión de producto o proceso tomada en la sesión. |
| `next_step` | string | ✅ Siempre | — | Ancla exacta de continuación. Formato: `continuar en [función o sección exacta] desde [AC o condición específica]`. Nivel de función obligatorio — no "continuar con T-XXX". |
| `draft` | boolean | ⚠️ Condicional | sin default | **Obligatorio sin default** cuando `items` incluye R/T/B nuevos o con cambio de status. Se omite cuando `items` está vacío o solo contiene P. Ver §4. |
| `items` | array | ✅ Siempre | `[]` | Ítems nuevos o con cambio de estado. Array vacío si no hay. Nunca omitir el campo. |
| `inline_fix` | array | ⚪ Condicional | omitir | **Siempre array** — nunca objeto singular. Omitir si no hay fixes inline (no reemplazar con `[]`). Ver §7. |
| `execution_plan` | object | ✅ Siempre | — | Obligatorio en todo cierre de sesión. Ver §8. |
| `doc_updates` | array | ⚪ Condicional | omitir | Omitir completamente si no hay cambios — no reemplazar con `[]` ni `null`. Ver §9. |
| `sprint_proposal` | object | ⚪ Condicional | omitir | Solo Cael. Omitir completamente si no se propone sprint — no `null` ni objeto vacío. Ver §10. |
| `finn_observations` | array | ⚪ Condicional | omitir | Solo Finn. Omitir si no aplica. Ver §11. |

---

## 4. Campo `draft`

### Propósito

Distingue un borrador de especificación de Cael (pendiente de aval de Finn en Fase 5) de un CHECKPOINT final listo para aplicar al backlog.

### Valores válidos

| Valor | Significado |
|---|---|
| `true` | Borrador — Locus no aplica `items`, `doc_updates` ni `sprint_proposal`. Solo muestra en DIFF como "pendiente de aval Finn". |
| `false` | CHECKPOINT final — Locus aplica todos los bloques normalmente. |

### Cuándo incluir

| Situación | Comportamiento |
|---|---|
| `items` incluye R/T/B nuevos o con cambio de status | **Obligatorio** — declarar `true` o `false` |
| `items` vacío o solo contiene P | Omitir el campo |
| Borrador de Cael pendiente de Finn (Fase 5) | `"draft": true` |
| CHECKPOINT emitido por Finn tras auditar borrador de Cael | `"draft": false` |
| CHECKPOINT de Rune, Nova, Finn (no especificación) | `"draft": false` |

### Comportamiento del parser ante ausencia

Si `items` contiene R/T/B y `draft` está ausente:

```
Campo "draft" ausente — CHECKPOINT no aplicado. Declarar draft: true o false.
```

Locus no aplica `items`, `doc_updates` ni `sprint_proposal`. Aplica el resto si es válido.

### Flujo Cael → Finn

1. Cael emite CHECKPOINT con `"draft": true` al completar Fases 1–4.
2. Finn audita. Aprueba → re-emite el mismo CHECKPOINT con `"draft": false`. Locus aplica normalmente.
3. Gap detectado → Finn devuelve a Cael con AC faltante redactado. Cael corrige y re-emite con `"draft": true`. Máximo 2 ciclos antes de escalar al founder.
4. Cael **nunca** emite `"draft": false` con ítems de especificación sin aval de Finn.

---

## 5. Schema de ítems

### 5.1 Instrucción `type: patch`

Para actualizar campos de un ítem existente sin re-emitirlo completo.

**Usar cuando:** ítem con código real, cambio de campos específicos.
**No usar cuando:** código es `[pendiente-ID]` o `[tmp:slug]` — el parser lo ignora con advertencia DocLog.

```
{
  "type": "patch",
  "code": "T-202606-009",
  "status": "done"
}
```

**Campos patcheables:** `title` · `status` · `priority` · `effort` · `area` · `sprint` · `role` · `ac` (reemplaza array completo) · `parentId` · `promovida_a` · `origenP` · `discard_reason`

**Campos NO patcheables:** `code` · `type` · `schema_version` — ignorados con advertencia DocLog, sin crash.

**Regla:** Cuando el cambio es sobre un ítem existente con código real y solo modifica campos específicos, usar `type: patch`. Emitir el ítem completo sin AC sobre un ítem existente genera flag de parser por AC ausente.

---

### 5.2 Schema de R

```
{
  "type": "R",
  "code": "[pendiente-ID]",
  "title": "descripción del requerimiento",
  "intencion": {
    "problema": "qué problema resuelve — una línea",
    "done_cuando": "qué vería o haría el founder cuando esté done — una línea",
    "no_incluye": "qué no hace este R aunque parezca obvio — una línea"
  },
  "status": "pendiente",
  "priority": "high | medium | low",
  "effort": 2,
  "area": "área funcional",
  "sprint": "PP-S-XX",
  "role": "PO · Cael",
  "schema_version": 2,
  "kill_criteria": "condición de cancelación — obligatorio si effort: 3 o módulo crítico",
  "blocked_by_external": "dependencia externa — opcional",
  "origen_p": "código de P origen — opcional",
  "ac": [
    "criterio de coherencia de conjunto 1 — verifica Finn al cerrar el R",
    "criterio de coherencia de conjunto 2"
  ]
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `type` | ✅ | Valor fijo `"R"` |
| `code` | ✅ | `[pendiente-ID]` en nuevos. Para refs cruzadas: `[tmp:slug]`. |
| `title` | ✅ | Campo canónico para descripción. `desc` no es válido. |
| `intencion` | ✅ | Tres sub-campos obligatorios. El founder lo lee antes de pegar en Locus. |
| `status` | ✅ | Válidos: `pendiente · en-proceso · en-revision · bloqueado · orphaned · descartado`. |
| `priority` | ✅ | `high · medium · low` |
| `effort` | ✅ | `1 · 2 · 3` |
| `area` | ✅ | Texto libre |
| `sprint` | ✅ | ID limpio de sprint real. Nunca `icebox` para R. Nunca concatenado con nombre. |
| `role` | ✅ | Formato `Sigla · Nombre` |
| `schema_version` | ✅ | Valor `2` en ítems nuevos |
| `ac` | ✅ | **No puede estar vacío.** Al menos un criterio de coherencia de conjunto. |
| `kill_criteria` | ⚠️ Condicional | Obligatorio si `effort: 3` o módulo crítico |
| `blocked_by_external` | ⚪ Opcional | |
| `origen_p` | ⚪ Opcional | Solo si el R resultó de promover una P |

**Estados prohibidos en R:** `done` sin sesión de cierre de Finn · `promovida`.

**Gate — R sin Ts:**
```
CHECKPOINT bloqueado: R [título] emitido sin Ts hijos. Adjuntar CHECKPOINT corregido.
```

**Gate — R sin AC:**
```
CHECKPOINT bloqueado: R [título] no tiene AC de coherencia de conjunto. Adjuntar CHECKPOINT corregido.
```

---

### 5.3 Schema de T

```
{
  "type": "T",
  "code": "[pendiente-ID]",
  "title": "descripción del ticket",
  "parent": "código del R padre",
  "depends_on": ["código-T1"],
  "triggered_by": "código del ítem origen — opcional",
  "no_incluye": "qué no hace este T — máx 3 ítems, inferible del contexto",
  "contract_update": "sí | no | n/a",
  "status": "pendiente | en-revision | done | descartado",
  "priority": "high | medium | low",
  "effort": 1,
  "area": "área funcional",
  "sprint": "PP-S-XX",
  "role": "FS · Rune",
  "schema_version": 2,
  "origen_p": "código de P origen — opcional",
  "ac": [
    "criterio atómico verificable con sí/no — happy path — entrada: [X], salida esperada: [Y]",
    "criterio atómico verificable con sí/no — estado de error — entrada: [X], salida esperada: [Y]"
  ]
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `parent` | ✅ | Código del R padre. Sin `parent` → T autónomo, requiere justificación explícita. |
| `depends_on` | ✅ | Array de códigos. `[]` si sin dependencia. Para refs cruzadas: `[tmp:slug]`. |
| `triggered_by` | ⚪ Opcional | Trazabilidad de contexto — no implica dependencia técnica. |
| `no_incluye` | ✅ | Máx 3 ítems. Inferible del contexto. No lista genérica. |
| `contract_update` | ⚠️ Condicional | Obligatorio en Effort 2+. Valores: `sí · no · n/a`. |
| `ac` | ✅ | Al menos un criterio binario con ejemplo de entrada y salida. |

**Estados prohibidos en T:** `bloqueado · promovida`.

**Herencia de sprint:** Sprint del T se hereda del R padre. Si declara sprint distinto → parser ajusta con nota informativa: `[código T] sprint ajustado al de su parent [código R].`

**Alerta `contract_update: sí` sin DOC-UPDATE:**
```
contract_update declarado sí — DOC-UPDATE de module-contracts ausente en CHECKPOINT.
```

---

### 5.4 Schema de B

```
{
  "type": "B",
  "code": "[pendiente-ID]",
  "title": "descripción del bug",
  "parent": "código del R o T relacionado — si aplica",
  "triggered_by": "código del ítem origen — OBLIGATORIO",
  "comportamiento_actual": "síntoma observable exacto. Si sin acceso directo: 'no observado directamente — síntoma reportado por founder'",
  "origin_module": "módulo donde se manifestó el fallo — opcional",
  "promovida_a": "código del R resultante — solo si status = descartado por promoción a R",
  "status": "pendiente | en-revision | done | descartado",
  "priority": "high | medium | low",
  "effort": 1,
  "area": "área funcional",
  "sprint": "PP-S-XX | PP-S-HOTFIX",
  "role": "QA · Finn",
  "schema_version": 2,
  "ac": [
    "comportamiento esperado según AC original"
  ]
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `triggered_by` | ✅ | Sin él el contexto del bug se pierde — Rune reconstruye contexto que ya existía. |
| `comportamiento_actual` | ✅ | Síntoma observable exacto. Locus alerta si ausente. |
| `origin_module` | ⚪ Opcional | Finn lo declara cuando el módulo es identificable. Rune lo usa como punto de entrada. |

**Variante hotfix — cuatro campos simultáneos obligatorios:**

Un B de variante ligera requiere exactamente estos cuatro campos juntos:

| Campo | Valor |
|---|---|
| `sprint` | `"PP-S-HOTFIX"` |
| `status` | `"done"` |
| `verificado_por` | `"founder"` |
| `priority` | `"high"` |

Sin los cuatro → B normal que nace con `status: pendiente` en sprint real.

---

### 5.5 Schema de P

```
{
  "type": "P",
  "code": "[pendiente-ID]",
  "title": "descripción de la idea",
  "triggered_by": "código del ítem origen — opcional",
  "status": "pendiente | descartado",
  "discard_reason": "duplicado | fuera de alcance | reemplazado | obsoleto — obligatorio si status = descartado",
  "promovida_a": "código del ítem resultante — obligatorio si status = promovida",
  "priority": "low",
  "effort": 1,
  "area": "área funcional",
  "sprint": "icebox",
  "role": "Sigla · Nombre",
  "schema_version": 2,
  "ac": []
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `sprint` | ✅ | Siempre `"icebox"`. Locus rechaza cualquier P con sprint real. |
| `status` | ✅ | Válidos: `pendiente · promovida · descartado`. Nunca `done · en-revision · bloqueado`. |
| `discard_reason` | ⚠️ Condicional | Obligatorio cuando `status: descartado`. |
| `promovida_a` | ⚠️ Condicional | Obligatorio cuando `status: promovida`. Acepta `[pendiente-ID]` como temporal si el ítem resultante se crea en el mismo CHECKPOINT. |
| `ac` | ✅ | Siempre `[]`. |

---

## 6. Referencias cruzadas entre ítems nuevos

Cuando un CHECKPOINT emite 2 o más ítems nuevos con referencias cruzadas, usar `[tmp:slug]` — no `[pendiente-ID]` — en los campos de referencia.

| Situación | Correcto | Incorrecto |
|---|---|---|
| Un solo ítem nuevo | `[pendiente-ID]` en `depends_on` | — |
| Dos o más ítems nuevos con refs cruzadas | `[tmp:r-base]`, `[tmp:t-foundation]` | `[pendiente-ID]` en `depends_on` |

**Formato de slug:** `[tmp:` + kebab-case + `]`. Ejemplos: `[tmp:r-parser]`, `[tmp:t-schema]`.

**Resolución:** Locus resuelve slugs al código real por orden de emisión dentro del CHECKPOINT. Slug sin ítem coincidente → DocLog: `slug [tmp:X] no resuelto — ítem coincidente no encontrado.`

---

## 7. Campo `inline_fix`

Registra fixes menores resueltos en la misma sesión que el T activo. No genera ítem en backlog.

```
"inline_fix": [
  {
    "descripcion": "qué se resolvió — una línea",
    "archivo": "archivo tocado",
    "triggered_by": "código del T activo"
  }
]
```

### Reglas

| Regla | Descripción |
|---|---|
| **Siempre array** | Nunca objeto singular. Múltiples fixes → un objeto por fix dentro del mismo array. |
| **Omitir si no hay** | No reemplazar con `[]`. Campo ausente = sin fixes inline en la sesión. |
| **No genera ítem** | Locus indexa para trazabilidad. Sin B ni T en backlog. |
| **Finn audita junto al T padre** | No requiere sesión separada de QA. |

### Criterio de elegibilidad — los tres simultáneamente

1. Toca el mismo archivo que el T activo.
2. Corrige comportamiento roto que bloquea el T — no introduce funcionalidad nueva.
3. Finn puede auditarlo como parte de la auditoría del T padre sin sesión separada.

Si algún criterio falla → emitir B normal con `triggered_by` apuntando al T activo.

---

## 8. Campo `execution_plan`

Obligatorio en todo cierre de sesión. Si no hay ítems activos → emitir con `sessions: []`.

### Scope `sesion`

```
"execution_plan": {
  "scope": "sesion",
  "sessions": [
    {
      "id": "slug-unico",
      "role": "FS · Rune",
      "items": ["CODIGO-1"],
      "files": ["archivo.js"],
      "depends_on": []
    }
  ]
}
```

### Scope `sprint` — solo Cael, al abrir sprint

```
"execution_plan": {
  "scope": "sprint",
  "sprint": "S-XX",
  "sessions": [
    {
      "id": "sesion-1",
      "role": "FS · Rune",
      "items": ["CODIGO-1"],
      "files": ["archivo.js"],
      "depends_on": []
    },
    {
      "id": "sesion-2",
      "role": "UX · Nova",
      "items": ["CODIGO-2"],
      "files": ["styles.css"],
      "depends_on": ["sesion-1"]
    }
  ]
}
```

### Campos de sessions

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | string | ✅ | Slug único sin espacios dentro de `sessions` |
| `role` | string | ✅ | Formato `Sigla · Nombre` |
| `items` | array | ✅ | Códigos de ítems |
| `files` | array | ✅ | Nombres de archivos. `[]` si ninguno. |
| `depends_on` | array | ✅ | IDs de sesiones previas. `[]` si sin dependencia. |

**Lock de paralelismo:** Dos sesiones que tocan el mismo archivo sin `depends_on` → conflicto. Locus señala al parsear:
```
Conflicto de paralelismo: [archivo] aparece en [sesión-A] y [sesión-B] sin depends_on entre ellas. Acción sugerida: declarar depends_on en [sesión-B].
```

**Sesión bloqueada mid-T:** Agregar campo `blocked_at` en la sesión bloqueada:
```
"blocked_at": "AC-2 — lógica de validación no especificada"
```

---

## 9. Campo `doc_updates`

**Omitir completamente si no hay cambios** — no reemplazar con `[]` ni `null`.

```
"doc_updates": [
  {
    "doc": "pp-context",
    "section": "§5 Funcionalidades activas",
    "action": "agregar | reemplazar | eliminar",
    "escalate_to": "Cael | Vera",
    "content": "texto exacto listo para aplicar"
  }
]
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `doc` | ✅ | Nombre del doc. Ej: `pp-context · pp-strategy · ob-strategy · br-ecosystem`. |
| `section` | ✅ | Sección específica. |
| `action` | ✅ | `agregar · reemplazar · eliminar`. Para `reemplazar`: `content` incluye texto original y nuevo. |
| `escalate_to` | ⚠️ Condicional | Presente cuando quien emite no es el dueño. Docs infraestructura → `"Vera"`. Docs proyecto → `"Cael"`. Omitir si el dueño emite sobre su propio doc. |
| `content` | ✅ | Texto exacto — no descripción de qué cambiar. |

Un objeto por sección. Múltiples secciones o docs → un objeto por cada combinación.

**Vencimiento:** DOC-UPDATE sin resolución por más de 2 sprints → descartado con nota en DocLog.

---

## 10. Campo `sprint_proposal`

Solo Cael. **Omitir completamente si no se propone sprint** — no `null` ni objeto vacío.

```
"sprint_proposal": {
  "id": "PP-S-XX",
  "label": "Nombre descriptivo del sprint",
  "version_target": "v1.X.0",
  "release_type": "Major | Minor | Patch",
  "scope": "descripción narrativa de los Rs que contiene",
  "goal": "qué debe ser verdad al cerrar este sprint — una línea",
  "out_of_scope": []
}
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `id` | ✅ | ID limpio inferido del backlog exportado. Locus valida que no colisione. |
| `label` | ✅ | Descriptivo — Rs que contiene. No aspiracional. |
| `version_target` | ✅ | Formato `vX.Y.Z`. Nunca `n/a` en sprint formalmente abierto. |
| `release_type` | ✅ | `Major · Minor · Patch` |
| `scope` | ✅ | Narrativa de Rs del sprint. |
| `goal` | ✅ | Una línea. |
| `out_of_scope` | ⚪ Opcional | Rs considerados y excluidos explícitamente con justificación. |

**Comportamiento de Locus al parsear:**

| Condición | Comportamiento |
|---|---|
| Campos completos · sin sprint abierto | Modal 1-tap → sprint creado en `abierto` |
| Campos completos · hay sprint abierto | Modal 1-tap → sprint creado en `programado` |
| Campo obligatorio ausente | Toast de error · no crea sprint · lista campos faltantes |
| `id` colisiona | Alerta al founder · bloquea creación |

**Step 0 en DIFF:** `sprint_proposal` se presenta como Step 0 antes de cualquier otro cambio. Si el founder rechaza → CHECKPOINT completo no se aplica.

---

## 11. Campo `finn_observations`

Solo Finn. Omitir si no aplica.

### Schema de regresión

```
{
  "type": "regresion",
  "t_origen": "código del T que introduce el cambio",
  "r_afectado": "código del R que contiene el comportamiento roto",
  "t_afectado": "código del T cuyo comportamiento se rompió",
  "modulo": "módulo donde se manifiesta la regresión",
  "comportamiento_esperado": "AC del T afectado que ya no se cumple",
  "comportamiento_actual": "qué pasa ahora",
  "accion": "escalar al founder — bloquear release"
}
```

### Schema de observación

```
{
  "type": "observacion",
  "t_auditado": "código del T auditado",
  "modulo": "módulo relevante — opcional",
  "hallazgo": "descripción — una línea",
  "impacto": "experiencia | paywall/conversión",
  "accion": "escalar a [Noa | Noa + Lena]"
}
```

### Schema de gap de contrato

```
{
  "type": "gap_contrato",
  "t_auditado": "código del T auditado",
  "funcion_afectada": "función exportada cuyo contrato cambió",
  "modulo_origen": "módulo que exporta la función",
  "modulos_afectados": ["módulos que importan la función"],
  "comportamiento_esperado": "firma o comportamiento original",
  "comportamiento_actual": "cómo cambió",
  "accion": "devolver a Cael — emitir AC de contrato faltante"
}
```

### Cuándo emitir

| Situación | Acción |
|---|---|
| Regresión detectada | `finn_observations` tipo `regresion` + B en `items` |
| Observación que afecta experiencia | `finn_observations` tipo `observacion` + escalar a Noa |
| Observación que afecta paywall/conversión | `finn_observations` tipo `observacion` + escalar a Noa + Lena |
| Mejora puntual sin impacto en AC | P en `items` — sin `finn_observations` |

---

## 12. Validación del parser

### Gates de parseo — bloqueos totales

| Condición | Comportamiento |
|---|---|
| JSON malformado | No parsea. Alerta: `CHECKPOINT inválido — JSON malformado. Adjuntar versión corregida.` No aplica ningún cambio parcial. |
| Campo `title` ausente | No parsea. Alerta: `CHECKPOINT inválido — "title" ausente.` |
| `project` no reconocido | No parsea. Alerta: `Proyecto "[X]" no reconocido. Ver __OB-Strategy §5.` |
| `items` con JSON malformado | Alerta con línea exacta. No aplica ítems del bloque. Aplica resto si es válido. |

### Alertas de ítems — no bloquean el CHECKPOINT completo

| Condición | Alerta |
|---|---|
| Status inválido para tipo | Status ignorado. DocLog: `Status "[X]" inválido para tipo [T/R/B/P]. Campo ignorado.` |
| P con sprint real | Ítem aplicado con `sprint: icebox`. DocLog: `Sprint asignado en ítem P ignorado — icebox aplicado.` |
| `draft` ausente con R/T/B | No aplica `items`, `doc_updates` ni `sprint_proposal`. Alerta: `Campo "draft" ausente — CHECKPOINT no aplicado.` |
| R sin Ts hijos | CHECKPOINT bloqueado: `R [título] emitido sin Ts hijos. Adjuntar CHECKPOINT corregido.` |
| R sin AC | CHECKPOINT bloqueado: `R [título] no tiene AC de coherencia de conjunto. Adjuntar CHECKPOINT corregido.` |
| B sin `triggered_by` | DocLog: `B [código] sin triggered_by — trazabilidad incompleta.` |
| B sin `comportamiento_actual` | Alerta: `B [código] sin comportamiento_actual — campo obligatorio. Adjuntar CHECKPOINT corregido.` |
| T Effort 2+ sin `contract_update` | Alerta: `T [código] Effort 2+ sin contract_update declarado.` |
| `contract_update: sí` sin DOC-UPDATE | Alerta: `contract_update declarado sí — DOC-UPDATE de module-contracts ausente en CHECKPOINT.` |
| Status `historico` en CHECKPOINT | Rechazado. DocLog: `Status "historico" no es emitible — asignado exclusivamente por Locus al cerrar sprint.` |
| `inline_fix` como objeto singular | Rechazado. Alerta: `inline_fix debe ser array — objeto singular no válido.` |
| T hereda sprint de parent | Nota informativa: `[código T] sprint ajustado al de su parent [código R].` |
| `[tmp:slug]` no resuelto | DocLog: `slug [tmp:X] no resuelto — ítem coincidente no encontrado.` |
| Conflicto de paralelismo en execution_plan | Alerta: `Conflicto de paralelismo: [archivo] en [sesión-A] y [sesión-B] sin depends_on entre ellas.` |

---

## 13. Ejemplos

### Ejemplo mínimo válido

```
{
  "title": "Sesión de diagnóstico — Locus",
  "project": "Locus",
  "role": "PO · Cael",
  "summary": "Revisión de backlog al inicio de sprint.",
  "next_step": "Adjuntar backlog exportado para continuar análisis.",
  "items": [],
  "execution_plan": {
    "scope": "sesion",
    "sessions": []
  }
}
```

### Ejemplo completo — Rune entregando T con inline_fix

```
{
  "title": "T-202606-004 · Schema doc entregado",
  "project": "Locus",
  "role": "FS · Rune",
  "summary": "Documento de schema generado. Fix inline en validación de draft.",
  "files": "locus-checkpoint-schema-v1.0.0.md",
  "duration": "01:20",
  "context": "T1 del R de parser.",
  "blockers": "n/a",
  "learning": "El campo inline_fix requiere validación de tipo array antes de indexar.",
  "next_step": "continuar en locus-parser.js desde validación del campo draft.",
  "draft": false,
  "items": [
    {
      "type": "patch",
      "code": "T-202606-004",
      "status": "en-revision"
    }
  ],
  "inline_fix": [
    {
      "descripcion": "Validación de tipo array en inline_fix — rechazaba objetos singulares sin alerta",
      "archivo": "locus-parser.js",
      "triggered_by": "T-202606-004"
    }
  ],
  "execution_plan": {
    "scope": "sesion",
    "sessions": [
      {
        "id": "finn-qa-t004",
        "role": "QA · Finn",
        "items": ["T-202606-004"],
        "files": ["locus-checkpoint-schema-v1.0.0.md"],
        "depends_on": []
      }
    ]
  }
}
```

### Ejemplo — R con T1 (borrador Cael, draft: true)

```
{
  "title": "R-parser · Especificación — borrador Cael",
  "project": "Locus",
  "role": "PO · Cael",
  "summary": "Especificación del R de parser JSON. Pendiente de aval Finn.",
  "next_step": "Finn audita este borrador — devuelve con gap o re-emite con draft: false.",
  "draft": true,
  "items": [
    {
      "type": "R",
      "code": "[tmp:r-parser]",
      "title": "Parser JSON de CHECKPOINT — implementación completa",
      "intencion": {
        "problema": "Locus no puede ingestar CHECKPOINTs en formato JSON — el parser actual solo soporta Markdown legado",
        "done_cuando": "El founder pega un CHECKPOINT JSON en Locus y ve el DIFF aplicado correctamente sin errores",
        "no_incluye": "Parseo de CHECKPOINTs históricos en Markdown — esos siguen en modo legado read-only"
      },
      "status": "pendiente",
      "priority": "high",
      "effort": 2,
      "area": "Parser · Core",
      "sprint": "PP-S-01",
      "role": "PO · Cael",
      "schema_version": 2,
      "ac": [
        "Un CHECKPOINT JSON válido se parsea sin errores y los cambios se reflejan en el DIFF",
        "Un CHECKPOINT con JSON malformado produce alerta explícita y no aplica ningún cambio parcial",
        "Un CHECKPOINT con draft: true no aplica items ni doc_updates — solo muestra en DIFF como pendiente"
      ]
    },
    {
      "type": "T",
      "code": "[tmp:t1-schema]",
      "title": "T1 · Definir schema JSON — documento formal del formato unificado",
      "parent": "[tmp:r-parser]",
      "depends_on": [],
      "no_incluye": "Implementación del parser · Validaciones en runtime · Tests automatizados",
      "contract_update": "n/a",
      "status": "pendiente",
      "priority": "high",
      "effort": 1,
      "area": "Parser · Schema",
      "sprint": "PP-S-01",
      "role": "PO · Cael",
      "schema_version": 2,
      "ac": [
        "El documento declara todos los campos obligatorios y opcionales con tipo, descripción y comportamiento ante ausencia",
        "El campo draft está declarado con valores válidos true/false y comportamiento del parser al detectar cada valor",
        "El campo inline_fix está declarado como array siempre — objeto singular no es válido",
        "El schema declara explícitamente qué campos se omiten cuando están vacíos vs cuáles van siempre presentes",
        "El documento incluye ejemplo mínimo válido y ejemplo completo con todos los campos"
      ]
    }
  ],
  "execution_plan": {
    "scope": "sesion",
    "sessions": []
  }
}
```
