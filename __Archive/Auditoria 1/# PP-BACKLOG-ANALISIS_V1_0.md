# PP-BACKLOG-ANALISIS_V1_0.md
<!-- Versión: 1.0 | Última actualización: 2026-05-08 | Análisis de backlog AI Tracker — Cael PO+BA -->

---

## Protocolo de Análisis de Backlog — 6 pasos

### Paso 01 — Orientación rápida

| Campo | Valor |
|---|---|
| Versión del backlog | 1.1 |
| Versión del CONTEXT | 1.0 |
| Consistencia de versiones | ✅ Sin discrepancia |
| Sprint activo declarado en CONTEXT | PP-S-01 (por abrir) |
| Sprint en ítems del backlog | PP-S-26 (incorrecto — corrección aplicada en Paso A) |
| Total de ítems en backlog | 72 ítems (Cluster A: 33 · Cluster B: 17 · Cluster C: 18 + 2 T + 2 B = 22 total · Cluster D: 22 + deuda futura) |
| Ítems con sprint asignado (PP-S-26) | 52 ítems (todos candidatos a PP-S-01 post-corrección) |
| Ítems diferidos ("futura") | 30 ítems (Cluster D completo + algunos Rs medium de Cluster C) |

**Alerta:** Sprint PP-S-26 referenciado en ítems no coincide con sprint activo PP-S-01 del CONTEXT. Corrección obligatoria (Paso A).

---

### Paso 02 — Distribución por sprint

**Nota:** Sin velocidad histórica disponible (reset completo). Detección de sobrecarga marcada como **estimada**.

| Sprint | Rs | Bs | Ts | Effort total | Nota |
|---|---|---|---|---|---|
| PP-S-26 (→ PP-S-01 post-corrección) | 7 Rs | 34 Bs | 2 Ts | ~57 | Ver nota de sobrecarga abajo |
| futura | 10 Rs | 20 Bs | 1 T | ~34 | Deuda técnica y mejoras diferibles |

**🔴 Señal de sobrecarga — estimada (sin velocidad histórica):** El Cluster A tiene 33 bugs + Cluster B 17 bugs + Cluster C Rs = ~57 effort en un único sprint. Para un founder único con ~6h/día, un sprint de una semana tiene capacidad de ~18–24 effort. **Recomendación:** redistribuir PP-S-01 a solo bugs críticos + mayores de mayor impacto + Rs de conversión con AC cerrados (ver Paso D).

---

### Paso 03 — Clusters temáticos

| Cluster | Rs incluidos | Foundation R (bloqueante) |
|---|---|---|
| A — Bugs críticos (bloquean release) | 33 Bs: cierre sprint, command palette, item-type, guardado sesión, quickNote, módulos sin guard (4), CANONICAL_PROJECTS (2), tracker regex, buildBacklogMd (2+1), log header, _ieAutofillFromPaste, scope notas, deleteAI, getActiveSprints, _assignPendingIds, buildTGPreview, _docPrefix, code[0] guard (2), export consistencia, Ctrl+K listener, switchTab sin prefijo, _mgBuildPlan, _mgInferStatus, data-theme, reset-modal, CSS inline (3), font-sans | CANONICAL_PROJECTS + item-type select (ambos bloquean parsePaste y creación de ítems desde el editor) |
| B — Bugs mayores (impacto flujos core) | 17 Bs: _normalizeStatus, mergeBacklogFromTG undo, _sanitizePendingInClosedSprints undo, _calcRelevanceScore perf, showMergeDiffPanel filter, _buildChildrenBlock DOM, openItemEditor guard, DnD handle, Cmd+F shortcut, CANONICAL case, _hasStaleSuggestion, _offlineQueuePush, exportWeeklySummary guard | openItemEditor sin guardia (bloquea flujo de creación) |
| C — Rs experiencia/conversión | 7 Rs high + 9 Rs medium + 2 Ts + 2 Bs en Cluster C | Empty state Sesiones+Documentos (bloquea activación) |
| D — Deuda técnica diferida | 22 Bs "futura": performance, compatibilidad CSS, cleanup, listeners, debug en producción | — |

---

### Paso 04 — Dependencias

**Explícitas declaradas en AC:**
- B `buildBacklogMd item.desc` + B `buildTGPreview i.desc` → ambos dependen de la misma corrección de campo `title` vs `desc`. Pueden ejecutarse en la misma sesión de Rune.
- T `CANONICAL_PROJECTS en session.js` + B `CANONICAL case-sensitive` → el T corrige el array; el B corrige la comparación. Mismo módulo, sesión secuencial.
- B `tracker regex [PITRB]` + B `_ieAutofillFromPaste regex [PTRBI]` + B `item-type select value='I'` → tres bugs del tipo I inválido. Cluster natural para una sola sesión.

**Implícitas detectadas:**
- B `openItemEditor sin guardia` y R `Empty state Sesiones+Documentos`: el empty state lleva CTA hacia openItemEditor — si el B no está corregido primero, el CTA del empty state puede producir el mismo error silencioso. **Dependencia implícita: B debe cerrar antes de implementar el R.**
- R `Sprint version_target + release_type` y R `Sprint — agregar checklist`: ambos tocan el modal de sprint. Riesgo de conflicto de scope si se ejecutan en paralelo. Secuencial recomendado.
- B `Ctrl+K doble listener` (SP) + B `switchTab sin prefijo` (CP): mismos módulos. Una sola sesión de Rune cubre ambos.

**Gaps implícitos detectados:**
- R `Empty state Sesiones+Documentos` y R `Checklist de setup visible`: AC del backlog actual tienen contenido pero fueron marcados por Vera como bloqueados (ver Paso C). Nova debe revisar antes de cerrar.
- R `openItemEditor sin guardia`: AC presentes en el backlog, marcados como bloqueados en tarea per auditoría §8.3. Paso C ejecuta especificación completa.
- B `_buildChildrenBlock IDs de DOM desfasados` no tiene dependencia explícita pero afecta el render de Rs con hijos — debe preceder cualquier trabajo en el IDP.

---

### Paso 05 — Secuencia de implementación PP-S-01

**Fase 1 — Foundation (desbloquea todo lo demás):**
1. B `CANONICAL_PROJECTS strings deprecados` → parsePaste funcional con naming vigente
2. B `CANONICAL case-sensitive` → consistencia de validación (misma sesión que #1)
3. T `Actualizar CANONICAL_PROJECTS en session.js` → misma sesión que #1 y #2
4. B `item-type select value='I'` → elimina corrupción silenciosa de backlog desde el editor
5. B `tracker regex [PITRB]` + B `_ieAutofillFromPaste` → mismo cluster tipo I (misma sesión que #4)

**Fase 2 — Bugs críticos de flujos core:**
6. B `_scmRender() isLast siempre 3` → cierre de sprint recuperable
7. B `#cmd-palette-overlay dead DOM` → CP sin riesgo de shadowing
8. B `newSess pre-push` → guardado de sesión atómico
9. B `openQuickNote sin definir` → búsqueda funcional
10. B `downloadTemplates sin typeof guard` + B `handlePaste/handleInput sin guard` → mismos guards de módulo (sesión conjunta)
11. B `openItemEditor sin guardia` (con AC del Paso C)

**Fase 3 — Bugs mayores de impacto en flujos core:**
12. B `_buildChildrenBlock IDs de DOM` → render estable antes de trabajar en IDP
13. B `_calcRelevanceScore O(n×m)` → performance de setItemStatus
14. B `showMergeDiffPanel filter` → merge sin estado indeterminado
15. B `mergeBacklogFromTG undoSnapshot` + B `_sanitizePendingInClosedSprints undoSnapshot` → misma área undo
16. B `_docPrefix OL` + B `code[0] guard` (3 instancias) → export funcional (misma sesión)
17. B `_mgBuildPlan formato legacy` → Map Generator compatible con parser activo
18. B `getActiveSprints sin filtro` → sprint lifecycle correcto
19. B `data-theme hardcodeado` → flash eliminado
20. B `_hasStaleSuggestion schema` + B `_offlineQueuePush deduplicación` → retención (sesión conjunta)
21. B `buildBacklogMd desc→title` + B `buildTGPreview desc→title` + B `buildBacklogMd [pendiente-ID]` → resumen semanal funcional (sesión conjunta)
22. B `_buildLogHeader color sin nombre` + B `_attachBacklogDnD handle` + B `Cmd+F shortcut` → UI fixes (sesión conjunta)
23. B `reset-modal oninput` + B `CSS inline (3)` + B `font-sans global` + B `CSS Purity` → separación estructura/estilos
24. B `Ctrl+K doble listener` + B `switchTab sin prefijo (SP/CP)` + B `_mgInferStatus` → command palette sin conflicto

**Fase 4 — Rs de conversión (PP-S-01, después de bugs críticos):**
25. R `Sidebar renombrar a Workers`
26. R `Splash tagline`
27. R `Sesiones hint bajo textarea`
28. R `Backlog CTA + Nuevo ítem`
29. R `Sprint version_target + release_type` (con AC del Paso C)
30. R `Empty state Sesiones+Documentos` (con AC del Paso C — después de B openItemEditor)
31. R `Backlog status chip inline` (con AC del Paso C)
32. R `Empty state ícono ← → →`
33. R `Tab renombrar Documentos → Backlog`

---

### Paso 06 — Gaps y preguntas abiertas

| Gap | Clasificación | Propuesta |
|---|---|---|
| 3 Rs bloqueados requieren Nova antes de cerrar AC (empty state, checklist setup, status chip) | Bloqueante para esos Rs | Consultar Nova antes de Rune — Paso C emite AC parciales con bloqueo UI declarado |
| R `openItemEditor` tiene AC en el backlog pero auditoría §8.3 los marca como vacíos — inconsistencia | Bloqueante para ese R | Paso C ejecuta especificación completa desde auditoría |
| R `Sprint version_target` tiene AC en backlog pero Vera lo marcó bloqueado | Bloqueante para ese R | Paso C ejecuta especificación completa |
| Velocidad histórica = 0 (reset) — sobrecarga de PP-S-01 no verificable con datos | Informativo — estimada | Paso D distribuye con criterio conservador |
| Ítems de Cluster D (30) sin sprint asignado — priorización pendiente | Informativo | Distribuir en PP-S-02+ por cluster temático (Paso D) |
| B `_normalizeStatus` fallo silencioso: el backlog lo tiene en Cluster B (PP-S-26/PP-S-01). La Fase 1 de la secuencia no lo incluye explícitamente — se recomienda moverlo a Fase 2 junto con loadBacklog | Informativo | Agregar a Fase 2 de la secuencia |

---

## Paso A — Corrección de sprint

**Operación:** Reemplazar `"sprint": "PP-S-26"` → `"sprint": "PP-S-01"` en todos los ítems del backlog.

**Conteo de correcciones aplicadas: 52 ítems corregidos** (todos los ítems de Clusters A, B, y la porción de Cluster C asignada al primer sprint).

Los ítems de Cluster D con `"sprint": "futura"` no se modifican — no contienen `PP-S-26`.

---

## Paso B — Gap analysis contra §8.3 y §8.4 de la auditoría

Cruzando tablas 8.3 (Top 5 conversión) y 8.4 (Estado de hallazgos críticos) contra PP-BACKLOG-nuevo.md:

| Hallazgo en auditoría | ¿En backlog? | Gap |
|---|---|---|
| `_scmRender()` isLast siempre 3 | ✅ Cluster A | Sin gap |
| `#cmd-palette-overlay` dead DOM | ✅ Cluster A | Sin gap |
| `item-type select` value='I' | ✅ Cluster A | Sin gap |
| `_doSaveSession()` newSess pre-push | ✅ Cluster A | Sin gap |
| `downloadTemplates()` sin typeof guard | ✅ Cluster A | Sin gap |
| `CANONICAL_PROJECTS` desalineado (session.js array) | ✅ T en Cluster C | Sin gap |
| `_hasStaleSuggestion()` schema legacy | ✅ Cluster C | Sin gap |
| `openItemEditor` sin guardia | ✅ Cluster C como R | Sin gap (AC revisados en Paso C) |
| Empty state Sesiones + Documentos | ✅ Cluster C como R | Sin gap (AC revisados en Paso C) |
| `_offlineQueuePush()` deduplicación | ✅ Cluster C como B | Sin gap |
| `_docPrefix` 'OB' en lugar de 'OL' | ✅ Cluster A | Sin gap |
| `_mgBuildPlan` formato `---PLAN---` | ✅ Cluster A | Sin gap |
| `_buildChildrenBlock` IDs desfasados | ✅ Cluster B | Sin gap |
| `buildTGPreview` usa `i.desc` no `i.title` | ✅ Cluster A | Sin gap |
| **`saveContextDocs()` — no escribe localStorage antes de Supabase** | ❌ **AUSENTE** | **GAP CRÍTICO** — hallazgo de severidad Alta en §1.2: si Supabase falla y el usuario recarga, datos de context pueden perderse. No incorporado en ningún cluster |
| **`normStatus(raw)` — aliases con emojis inconsistentes con schema canónico** | ❌ **AUSENTE** | **GAP ALTO** — §1.2: `normStatus` retorna `'📤 Pendiente'` cuando el schema usa `'pendiente'`. Produce inconsistencias en comparaciones downstream |
| **`showToast() / _toastRender()` — regex HTML permisivo, XSS posible** | ❌ **AUSENTE** | **GAP ALTO** — §1.2: string con `<3` puede fallar `esc()` y renderizar HTML no escapado. Seguridad básica |
| **`signInWithMagicLink()` — `shouldCreateUser: true` sin restricción de dominio** | ❌ **AUSENTE** | **GAP ALTO** — §1.2: cualquier email puede auto-registrarse en sistema de founder único. Bloqueante para sincronización con Supabase |
| **`confirmAddAI()` — ID con `Date.now()` sin componente random** | ❌ **AUSENTE** | **GAP MEDIO** — §1.3: colisiones posibles en inserciones rápidas. Riesgo de integridad de datos |
| **`_purgeStaleBacklogCache()` — muta ITEMS sin saveBacklog() ni _undoSnapshot()** | ❌ **AUSENTE** | **GAP ALTO** — §1.1: la purga no se persiste en el mismo ciclo ni tiene rollback. Pérdida silenciosa de ítems en backlog |
| **`_buildOption()` función duplicada verbatim** | ❌ **AUSENTE** | **GAP MEDIO** — §1.1: definida dentro de `_buildSprintSelector()` y `_blSprintOpen()`. Cambio en una no aplica a la otra. Deuda técnica alta |
| Gaps de AC (81 únicos según §2.8) | Parcialmente incorporados | Los gaps confirmados como bugs están en el backlog. Los 81 gaps de especificación son para Cael — no todos se convierten en ítems independientes |

### Ítems nuevos por gaps detectados (Paso B):

**Gap B-1: `saveContextDocs()` — pérdida de context si Supabase falla sin escritura previa en localStorage**

```json
{
  "type": "B",
  "code": "[pendiente-ID]",
  "title": "saveContextDocs — no escribe en localStorage antes de intentar Supabase: pérdida de datos si Supabase falla y usuario recarga",
  "status": "pendiente",
  "priority": "high",
  "effort": 1,
  "area": "Persistencia · Context docs",
  "sprint": "PP-S-01",
  "role": "FS · Rune",
  "version": "futura",
  "schema_version": 1,
  "ac": [
    "saveContextDocs() escribe context y html-map en localStorage antes de intentar la escritura en Supabase",
    "Si Supabase falla, el usuario puede recargar y los datos de context del localStorage están disponibles",
    "Verificable: configurar Supabase para fallo → llamar saveContextDocs() → recargar → los datos de context persisten en localStorage"
  ]
}
```

**Gap B-2: `normStatus()` — aliases con emojis inconsistentes con schema canónico**

```json
{
  "type": "B",
  "code": "[pendiente-ID]",
  "title": "normStatus() — aliases incluyen emojis ('📤 Pendiente') inconsistentes con schema canónico 'pendiente' sin emoji",
  "status": "pendiente",
  "priority": "high",
  "effort": 1,
  "area": "Normalización de status",
  "sprint": "PP-S-01",
  "role": "FS · Rune",
  "version": "futura",
  "schema_version": 1,
  "ac": [
    "normStatus() retorna valores canónicos sin emoji: 'pendiente', 'done', 'descartado'",
    "Todas las comparaciones de status downstream (setItemStatus, _hasStaleSuggestion, _calcPriority) trabajan contra valores sin emoji",
    "Verificable: normStatus('📤 Pendiente') retorna 'pendiente'"
  ]
}
```

**Gap B-3: `showToast()` — regex HTML permisivo, posible renderizado de HTML no escapado**

```json
{
  "type": "B",
  "code": "[pendiente-ID]",
  "title": "showToast() / _toastRender() — regex de detección HTML en titleHtml permisivo: string con '<3' puede renderizar HTML no escapado",
  "status": "pendiente",
  "priority": "high",
  "effort": 1,
  "area": "Sistema de toasts · Seguridad",
  "sprint": "PP-S-01",
  "role": "FS · Rune",
  "version": "futura",
  "schema_version": 1,
  "ac": [
    "El detector de HTML en titleHtml usa regex estricto que no produce falsos positivos con expresiones como '<3'",
    "Strings que no contienen HTML real se pasan por esc() antes de renderizarse en el toast",
    "Verificable: showToast({title: 'Tengo <3 items'}) → el toast muestra el string literal sin interpretar '<3' como tag HTML"
  ]
}
```

**Gap B-4: `signInWithMagicLink()` — `shouldCreateUser: true` sin restricción de dominio**

```json
{
  "type": "B",
  "code": "[pendiente-ID]",
  "title": "signInWithMagicLink() — shouldCreateUser: true permite auto-registro de cualquier email en sistema de founder único",
  "status": "pendiente",
  "priority": "high",
  "effort": 1,
  "area": "Auth · Supabase",
  "sprint": "PP-S-01",
  "role": "FS · Rune",
  "version": "futura",
  "schema_version": 1,
  "ac": [
    "signInWithMagicLink() usa shouldCreateUser: false",
    "Solo emails pre-registrados en Supabase pueden autenticarse vía magic link",
    "Verificable: enviar magic link a email no registrado → Supabase devuelve error de usuario no encontrado"
  ]
}
```

**Gap B-5: `_purgeStaleBacklogCache()` — muta ITEMS sin saveBacklog() ni _undoSnapshot()**

```json
{
  "type": "B",
  "code": "[pendiente-ID]",
  "title": "_purgeStaleBacklogCache() — muta array ITEMS directamente sin saveBacklog() ni _undoSnapshot(): purga no persiste y no tiene rollback",
  "status": "pendiente",
  "priority": "high",
  "effort": 1,
  "area": "Carga de backlog · Purga",
  "sprint": "PP-S-01",
  "role": "FS · Rune",
  "version": "futura",
  "schema_version": 1,
  "ac": [
    "_purgeStaleBacklogCache() llama _undoSnapshot() antes de mutar ITEMS",
    "_purgeStaleBacklogCache() llama saveBacklog() después de la mutación",
    "La purga es deshacible via undoBacklog()",
    "Verificable: ítem con doneAt > 90 días → llamar _purgeStaleBacklogCache() → undoBacklog() → ítem restaurado"
  ]
}
```

**Gap B-6: `_buildOption()` función duplicada verbatim**

```json
{
  "type": "B",
  "code": "[pendiente-ID]",
  "title": "_buildOption() — función duplicada verbatim en _buildSprintSelector() y _blSprintOpen(): cambio en una copia no aplica a la otra",
  "status": "pendiente",
  "priority": "medium",
  "effort": 1,
  "area": "Sprint lifecycle · Refactor",
  "sprint": "futura",
  "role": "FS · Rune",
  "version": "futura",
  "schema_version": 1,
  "ac": [
    "_buildOption() definida una única vez como función de módulo — no duplicada dentro de otras funciones",
    "Ambos sitios de uso referencian la misma función",
    "Verificable: grep '_buildOption' en ai-tracker-backlog.js → una sola definición"
  ]
}
```

**Gap B-7: `confirmAddAI()` — ID con `Date.now()` sin componente aleatorio**

```json
{
  "type": "B",
  "code": "[pendiente-ID]",
  "title": "confirmAddAI() — ID de worker generado con Date.now() sin componente random: colisión posible en inserciones rápidas",
  "status": "pendiente",
  "priority": "medium",
  "effort": 1,
  "area": "Gestión de Workers",
  "sprint": "futura",
  "role": "FS · Rune",
  "version": "futura",
  "schema_version": 1,
  "ac": [
    "El ID del worker nuevo se genera con Date.now() + componente aleatorio (Math.random().toString(36).slice(2))",
    "Dos workers creados en el mismo ms tienen IDs distintos",
    "Verificable: crear dos workers en el mismo tick → IDs distintos"
  ]
}
```

---

## Paso C — Especificación de Rs bloqueados

### R1 — Empty state orientado a acción — tabs Sesiones y Documentos

**Bloqueo UI:** Este R toca interfaz de usuario en dos tabs distintos con comportamientos diferenciados. Los AC del backlog existente tienen contenido pero requieren validación de Nova antes de cerrarse definitivamente.

**Estado:** El backlog ya tiene AC para este R. La auditoría §7.2 indica que Nova debe revisar restricciones. Los AC actuales son funcionalmente correctos pero no incorporan restricciones de experiencia.

**Bloqueo UI: Empty state orientado a acción (tabs Sesiones y Documentos) — requiere consulta a Nova antes de cerrar AC. Los AC funcionales están definidos abajo. Nova debe confirmar: (1) patrón visual específico vs Analytics, (2) jerarquía de CTAs en el empty state de Sesiones (Workers vs Proyecto), (3) comportamiento cuando solo falta un prerequisito de los dos.**

AC funcionales disponibles (completos para Fase 1 del protocolo):

**Fase 1 — Intención:**
- Problema: el founder llega a tabs vacíos sin saber qué hacer primero. Puntos de abandono A y B confirmados por Lena (3c).
- Done cuando: tab Sesiones vacío muestra CTA explícito hacia crear Worker y Proyecto. Tab Backlog vacío muestra CTA de importación y creación de ítem.
- Fuera de scope: no modifica el tab Analytics (ya tiene empty state). No agrega wizard modal.
- Edge case clave: founder con Workers creados pero sin Proyecto — el empty state de Sesiones debe orientar solo hacia la parte faltante.

**AC propuestos (pendientes de restricciones Nova):**
```
- Tab Sesiones con estado vacío (sin workers registrados) muestra CTA explícito con acciones 'Nuevo Worker' y 'Nuevo Proyecto'
- Tab Sesiones con workers pero sin proyecto muestra solo CTA 'Nuevo Proyecto'
- Tab Documentos / Backlog vacío muestra CTA de 'Importar backlog' y '+ Nuevo ítem'
- Los CTAs de ambos tabs comunican el prerequisito de setup antes de que el founder lo descubra por error
- Patrón visual consistente con el empty state existente en tab Analytics — mismo sistema de iconos y tipografía
- El empty state no bloquea navegación al resto del tab — es un overlay informativo, no un bloqueador
- openItemEditor en el CTA del Backlog vacío está protegido con guardia typeof (dependencia: B openItemEditor sin guardia debe estar resuelto primero)
```

---

### R2 — Checklist de setup visible — 4 pasos con estado de completitud

**Bloqueo UI: Checklist de setup visible — requiere consulta a Nova antes de cerrar AC. Los AC funcionales están definidos abajo. Nova debe confirmar: (1) posición del banner (header vs sidebar vs inline en tab Sesiones), (2) comportamiento de dismiss (¿reaparece si el founder no completa los 4 pasos?), (3) si el checklist coexiste o reemplaza al empty state de Sesiones en primer uso.**

AC propuestos (pendientes de restricciones Nova):

**Fase 1 — Intención:**
- Problema: el founder no sabe cuántos prerequisitos de setup faltan ni cuál es el siguiente. Tiempo hasta primer valor: 5–7 min. (Lena 3c, H5).
- Done cuando: el founder ve exactamente qué pasos completó y cuál falta.
- Fuera de scope: no sustituye el onboarding modal. No agrega pasos adicionales a los 4 definidos por Lena.
- Edge case: founder que ya completó los 4 pasos no ve el checklist.

**AC propuestos:**
```
- El checklist aparece como banner en el tab Sesiones cuando al menos uno de los 4 pasos no está completo
- Los 4 pasos son verificados en tiempo real: (1) Worker creado: state.ais.length > 0, (2) Proyecto creado: state.projects.length > 0, (3) Ítem en backlog: ITEMS.length > 0, (4) Primera sesión guardada: getAllSessions().length > 0
- Cada paso muestra ícono binario de completitud (✓ done / ○ pendiente) calculado contra estado real al renderizar
- El banner tiene botón de dismiss — click guarda 'setup-checklist-dismissed' en localStorage y el banner no reaparece aunque los pasos no estén completos
- Si todos los 4 pasos están completos al cargar, el banner no aparece aunque 'setup-checklist-dismissed' no esté en localStorage
- El checklist no bloquea ninguna acción del producto — no es un modal bloqueador
- Completar un paso en tiempo real actualiza el check correspondiente sin recargar la página
- Verificable: estado vacío → 4 pasos pendientes visibles. Crear worker → paso 1 marca ✓ sin recargar.
```

---

### R3 — `openItemEditor` sin guardia — fallback visible cuando módulo externo no disponible

**Fase 1 — Extracción de intención:**
- Problema: el botón "Editar" en el backlog falla silenciosamente si el módulo externo que define `openItemEditor` no cargó. Click sin respuesta = pérdida de confianza irrecuperable en primer uso (Lena 3c, Finn 2b).
- Done cuando: click en "Editar" siempre produce feedback visible — o abre el editor, o muestra error explicativo.
- Fuera de scope: no cambia el comportamiento cuando el módulo sí está disponible.
- Edge case: módulo parcialmente disponible (función definida pero con error interno) — el guard solo protege el ReferenceError, no los errores dentro del editor.

**Detección de UI:** Sí toca interfaz (toast de error). Sin embargo, el R no modifica estructura visual existente — solo agrega una condición antes de una llamada. El toast usa el sistema existente. No requiere consulta a Nova para los AC funcionales.

**Fase 2 — Especificación completa:**

```
Happy path:
- Guardia typeof openItemEditor === 'function' pasa → openItemEditor se invoca con los parámetros actuales sin cambio

Estados de error:
- Guardia typeof openItemEditor === 'function' falla → el botón 'Editar' muestra toast de error con texto exacto: 'No se pudo abrir el editor — recarga la página'
- El toast usa el sistema de toasts existente (showToast) — no introduce mecanismo nuevo

Edge cases:
- Si openItemEditor está definida pero como no-función (reasignada): typeof === 'function' falla → mismo fallback de toast
- La guardia cubre TODAS las llamadas inline a openItemEditor en el HTML generado — no solo una instancia

Fuera de scope:
- No corrige errores dentro de openItemEditor una vez invocada — solo protege el ReferenceError de invocación

Impacto lateral:
- Afecta todos los archivos con llamadas inline a openItemEditor (ai-tracker-backlog.js, index.html, y cualquier archivo que genere botones con onclick openItemEditor)
- El T de actualizar CANONICAL_PROJECTS no tiene dependencia con este R
```

**Fase 3 — Verificación de ejecutabilidad:** ✅ Rune puede implementar sin preguntar. Criterio de done: comentar la carga del módulo externo en index.html → click en 'Editar' → toast visible, sin ReferenceError en consola.

---

### R4 — Sprint — agregar `version_target` y `release_type` como obligatorios en formulario de apertura

**Fase 1 — Extracción de intención:**
- Problema: el usuario puede abrir un sprint sin `version_target` ni `release_type`, que Base Rules §6 declara obligatorios. Los exports quedan sin esta metadata (Finn/Nova 3b #7).
- Done cuando: el formulario de apertura de sprint no puede confirmarse sin estos dos campos.
- Fuera de scope: no modifica el flujo de cierre de sprint. No cambia los sprints ya abiertos.
- Edge case: usuario que ya tiene un sprint abierto sin estos campos — no retroactivo.

**Detección de UI:** Sí toca interfaz (formulario de apertura de sprint). 

**Bloqueo UI: Sprint — agregar version_target y release_type — requiere consulta a Nova antes de cerrar AC para los detalles de UX del formulario (tipo de input, mensajes de validación inline, disposición de campos). Los AC funcionales están definidos abajo.**

**AC funcionales disponibles:**
```
Happy path:
- El formulario de apertura de sprint tiene campo de texto version_target (ej: 'v1.1.0') — obligatorio
- El formulario de apertura de sprint tiene selector release_type con opciones: Major / Minor / Patch — obligatorio
- Ambos campos tienen label visible que los identifica
- El botón de confirmar apertura está deshabilitado hasta que ambos campos tienen valor

Estados de error:
- Intentar confirmar con version_target vacío: validación inline visible bajo el campo — el modal no cierra
- Intentar confirmar con release_type sin seleccionar: validación inline visible — el modal no cierra
- Los mensajes de validación desaparecen cuando el campo recibe un valor válido

Edge cases:
- version_target acepta cualquier string no vacío — no valida formato semver (no es objetivo de este R)
- release_type con valor por defecto vacío o placeholder — no pre-seleccionar ningún valor

Fuera de scope:
- No modifica la lógica de cierre de sprint
- No agrega sugerencia automática de release_type (esa lógica de sugerencia existe en Base Rules §6 como referencia, no como AC de este R)

Impacto lateral:
- Afecta ai-tracker-sprint-project.js — función de apertura de sprint y renderizado del modal
- Los exports de backlog que usan version_target ya esperan el campo — no hay cambio downstream
```

---

### R5 — Backlog — status chip inline clickeable en fila colapsada

**Fase 1 — Extracción de intención:**
- Problema: cambiar status de un ítem requiere abrir el IDP completo — máximo recorrido de interacción para la acción más frecuente (Nova 3b #2, Finn 2b).
- Done cuando: el founder puede cambiar el status de un ítem directamente desde la fila colapsada sin abrir el IDP.
- Fuera de scope: no reemplaza el IDP para edición completa. No cambia el comportamiento al hacer click en el resto de la fila (que sigue abriendo el IDP).
- Edge case: ítem con status 'done' — el chip debe permitir reverter a 'pendiente'. Ítem 'descartado' — visible pero quizás con acción diferente.

**Detección de UI:** Sí toca interfaz (fila del backlog — elemento interactivo inline).

**Bloqueo UI: Backlog — status chip inline clickeable — requiere consulta a Nova antes de cerrar AC. Nova debe confirmar: (1) diseño del selector inline (dropdown, popover, o ciclo directo), (2) posición relativa del chip en la fila colapsada, (3) comportamiento visual del selector al abrirse (¿desplaza otros elementos o flota encima?).**

**AC funcionales disponibles:**
```
Happy path:
- El chip de status en la fila colapsada es un elemento clickeable (cursor pointer)
- Click en el chip abre un selector inline de status con opciones: pendiente / done / descartado
- Seleccionar una opción actualiza el status del ítem via setItemStatus() sin abrir el IDP
- El chip se actualiza visualmente inmediatamente tras el cambio de status

Estados de error:
- Si setItemStatus() falla internamente, el chip revierte al status anterior y muestra toast de error

Edge cases:
- Click fuera del selector inline (cuando está abierto) cierra el selector sin cambiar el status
- Presionar Escape cierra el selector sin cambiar el status
- El selector no interfiere con el event listener de la fila que abre el IDP

Fuera de scope:
- No agrega inline editing de otros campos (effort, sprint, priority) — solo status en este R
- No modifica el IDP existente

Impacto lateral:
- Afecta ai-tracker-backlog.js — buildBacklogItem() y el event handling de la fila
- Requiere que _buildChildrenBlock IDs de DOM estén corregidos primero (dependencia de Fase 3)
```

---

## Paso D — Distribución de sprints

### PP-S-01 — Bugs críticos + bugs mayores de impacto directo en flujos core + Rs de conversión con AC cerrados o especificados en Paso C

**Criterio de inclusión:**
- Todos los Bs de Cluster A (bloquean release o corrupción de datos)
- Bs de Cluster B que bloquean flujos directos de usuario
- Rs de Cluster C con prioridad high cuyo fallback es claro (Sidebar renombrar, Splash tagline, Sesiones hint, Backlog CTA)
- Bs de conversión high (normStatus, saveContextDocs, showToast, signInWithMagicLink, _purgeStaleBacklogCache)
- Rs bloqueados del Paso C que tienen AC funcionales cerrados (openItemEditor — AC cerrado en Paso C sin bloqueo Nova)

**Rs bloqueados con bloqueo UI que NO entran a PP-S-01:**
- Empty state Sesiones+Documentos → PP-S-02 (requiere Nova)
- Checklist de setup visible → PP-S-02 (requiere Nova)
- Sprint version_target+release_type → PP-S-02 (requiere Nova para validación inline)
- Backlog status chip inline → PP-S-02 (requiere Nova para diseño del selector)

| Sprint | Cluster | Ítems | Effort total |
|---|---|---|---|
| PP-S-01 | A (bugs críticos) | 33 Bs | 33 |
| PP-S-01 | B (bugs mayores core) | 9 Bs seleccionados: _normalizeStatus, mergeBacklogFromTG undo, _sanitizePendingInClosedSprints undo, _calcRelevanceScore perf, showMergeDiffPanel filter, _buildChildrenBlock DOM, openItemEditor guard, DnD handle, Cmd+F shortcut + 8 Bs seleccionados: CANONICAL case, _hasStaleSuggestion, _offlineQueuePush, exportWeeklySummary guard | 17 |
| PP-S-01 | C (Rs conversión high — sin bloqueo Nova) | R Sidebar renombrar, R Splash tagline, R Sesiones hint, R Backlog CTA '+Nuevo ítem', T CANONICAL session.js, T CANONICAL checkpoint.js, B ícono ←→, R Tab Documentos→Backlog | 8 |
| PP-S-01 | B-gaps (Paso B) | B saveContextDocs, B normStatus, B showToast, B signInWithMagicLink, B _purgeStaleBacklogCache | 5 |
| **PP-S-01 TOTAL** | | **~72 ítems** | **~63 effort** |

**🔴 Alerta de sobrecarga — estimada:** 63 effort sin velocidad histórica. Con founder único y ~6h/día, una semana tiene capacidad ~18–24 effort. **Recomendación fuerte: partir PP-S-01 en sub-fases o reducir scope.** Propuesta:

**PP-S-01 — scope reducido (Fases 1+2 de la secuencia del Paso 05):**

| Grupo | Ítems | Effort | Justificación |
|---|---|---|---|
| Cluster A críticos puros | 33 Bs | 33 | Todos bloqueantes de release — no se pueden diferir |
| B-gaps críticos (Paso B) | saveContextDocs, normStatus, showToast, signInWithMagicLink, _purgeStaleBacklogCache | 5 | Severidad alta — impacto en integridad y seguridad |
| T CANONICAL + B CANONICAL case | T session.js + T checkpoint.js + B case | 3 | Effort 1 cada uno — desbloquean parsePaste hoy |
| **PP-S-01 scope reducido** | **~41 ítems** | **~41 effort** | Manejable en 2–3 semanas |

**PP-S-02 — bugs mayores + Rs con Nova:**

| Grupo | Ítems | Effort |
|---|---|---|
| Cluster B completo | 17 Bs | 17 |
| Rs bloqueados con Nova (Paso C) | Empty state, Checklist setup, Sprint version_target, Status chip inline | 6 |
| Rs conversión high sin Nova | Sidebar renombrar, Splash tagline, Sesiones hint, Backlog CTA, Tab renombrar, Ícono ← | 6 |
| B-gaps medios (Paso B) | _buildOption duplicada | 1 |
| **PP-S-02 total** | **~30 ítems** | **~30 effort** |

**PP-S-03+ — Cluster D + Rs medium + deuda técnica:**

| Grupo | Ítems | Sprint sugerido |
|---|---|---|
| Deuda técnica diferida (Cluster D) | 22 Bs "futura" | PP-S-03 |
| Rs medium de Cluster C | 9 Rs medium (IDP jerarquía, filtros backlog, Map Generator, etc.) | PP-S-03 |
| B-gaps medios (Paso B) | confirmAddAI ID random | PP-S-03 |
| Rs low | Onboarding modal paso 3, toast redundante | PP-S-04 |

---

## Paso E — Bloque ---ITEMS--- completo

```json
[
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_scmRender() — isLast siempre 3 con skipStep2=true: botón Cerrar sprint inaccesible desde la UI",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Cierre de sprint",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Con skipStep2=true, isLast es true cuando step === 2 (último paso efectivo)",
      "El botón 'Cerrar sprint' aparece en el último paso efectivo independientemente de si skipStep2 es true o false",
      "El paso 3 no renderiza contenido cuando skipStep2=true",
      "Verificable: iniciar cierre de sprint sin ítems pendientes — el botón 'Cerrar sprint' es visible en paso 2"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "#cmd-palette-overlay — dead DOM con closeCommandPalette() conflictivo con implementación activa #cp-overlay",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Command Palette · DOM duplicado",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "#cmd-palette-overlay removido del DOM — un único shell de command palette en index.html",
      "closeCommandPalette() referenciada en el overlay eliminado — ningún onclick huérfano en DOM",
      "openCommandPalette() y closeCommandPalette() operan exclusivamente sobre #cp-overlay",
      "Inline  block de .cmd-palette-overlay migrado a archivo .css o eliminado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "item-type select — value='I' como primera opción (default): ítems creados sin cambiar selector tienen type='I' inválido",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Item editor · Select de tipo",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La opción value='I' eliminada del select #item-type",
      "Primera opción del select es value='P' — tipo canónico para Ideas según Base Rules §5",
      "Ningún ítem puede crearse con type='I' desde el editor",
      "Verificable: inspeccionar #item-type — 4 opciones: P, T, R, B — sin opción I"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "newSess push a sessions[] antes de showMergeDiffPanel — sesión persiste si usuario cancela el panel",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Guardado de sesión",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "newSess no se persiste en activeProj.sessions hasta que el usuario confirma el panel MergeDiff",
      "Si el usuario cancela MergeDiff, activeProj.sessions no contiene la sesión nueva",
      "El flujo de guardado es atómico: o persiste completamente (sesión + ítems mergeados) o no persiste nada",
      "Si showMergeDiffPanel no está disponible (fallback directo), el comportamiento actual se mantiene"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openQuickNote no definida en módulo — ReferenceError al click en resultado de búsqueda de nota y en panel de proyecto",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Búsqueda global · Notas",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Click en resultado de quickNote en panel de búsqueda abre la nota sin ReferenceError",
      "Click en proj-note-row en panel de proyecto activa nota sin ReferenceError",
      "openQuickNote está definida o importada en todos los módulos que la invocan",
      "Verificable: buscar término que matchee una nota, click en resultado — sin error en consola"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_normalizeStatus — fallo silencioso en loadBacklog si función no disponible",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si _normalizeStatus no está disponible al ejecutar loadBacklog(), se emite error visible al usuario (toast o console.error explícito)",
      "La carga no continúa silenciosamente con status sin normalizar"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "mergeBacklogFromTG — cierre automático P padre sin _undoSnapshot()",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Merge de CHECKPOINT",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El cierre automático del P padre llama _undoSnapshot() antes de mutar status",
      "Después de aplicar merge con cierre de padre, undoBacklog() revierte el estado del padre correctamente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_sanitizePendingInClosedSprints segunda pasada — corrección doneAt mismatch sin _undoSnapshot()",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si la segunda pasada de sanitize modifica al menos un ítem, se registra _undoSnapshot() antes de las mutaciones",
      "El resultado de la corrección es deshacible via undoBacklog()"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_calcRelevanceScore — getAllSessions() sin caché, O(n×m) en hot path de setItemStatus()",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Cambio de status · Performance",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "getAllSessions() se llama una vez por ciclo de _recalcAllScores(), no una vez por ítem",
      "Con 200 ítems pendientes y 50 sesiones, setItemStatus() completa sin bloqueo visible de UI (< 16ms)"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showMergeDiffPanel — project filter puede quedar modificado si loadBacklog falla en finally",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Merge de CHECKPOINT",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si loadBacklog() lanza dentro del finally, el project filter se restaura al valor previo antes de propagar el error",
      "El usuario ve feedback de error si la restauración falla"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildChildrenBlock — cIdx por ITEMS.indexOf capturado al render: IDs de DOM desfasados tras mutación sin re-render",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Render de ítems",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Los IDs de DOM de hijos (ibody-*, ciarrow-*, code-badge-*) se generan desde item.code, no desde ITEMS.indexOf(child)",
      "toggleItemExpand invocado desde un hijo apunta al ítem correcto independientemente de mutaciones previas de ITEMS"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openItemEditor invocada en HTML inline sin guardia typeof — falla silenciosa si módulo externo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Item editor",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Todas las llamadas inline a openItemEditor están precedidas de guardia typeof openItemEditor === 'function'",
      "Si la guardia falla (módulo no disponible): el botón 'Editar' muestra toast de error con texto 'No se pudo abrir el editor — recarga la página'",
      "Si la guardia pasa (módulo disponible): comportamiento actual sin cambio — openItemEditor se invoca normalmente",
      "El toast de error usa el sistema de toasts existente del producto — no introduce mecanismo nuevo",
      "Verificable: comentar la carga del módulo externo en index.html → click en 'Editar' → toast visible, sin error JS silencioso en consola"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_attachBacklogDnD — drag handle visible para ítems con sprint pero DnD nunca se activa",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Drag & drop",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El drag handle ⠿ solo se renderiza si DnD está efectivamente activo para ese ítem",
      "O bien: DnD se reactiva bajo la condición correcta y el handle refleja el estado real"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Shortcut Cmd+F llama toggleFocusMode (panel focus) no toggleBacklogFocusMode (Top-10) — sin efecto visual con panel cerrado",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Focus mode",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Con tab Backlog activo y sin panel abierto, Cmd+F activa el Focus Top-10 (_backlogFocusMode) con cambio visual inmediato en la lista",
      "Con panel abierto, Cmd+F activa el focus mode del panel (_focusModeActive) — comportamiento actual se mantiene"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "CANONICAL_PROJECTS contiene 'Obsidiana Labs' y 'Obsidiana' — strings deprecados aceptados como válidos en parsePaste",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Validación de CHECKPOINT",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL_PROJECTS contiene únicamente strings canónicos activos: 'Obsidian Labs', 'ASVAB App', 'Content Manager', 'AI Tracker'",
      "CHECKPOINTs con 'Proyecto: Obsidiana Labs' o 'Proyecto: Obsidiana' son rechazados con mensaje de proyecto no reconocido",
      "Decisión del founder sobre legacy compatibility documentada antes de implementar"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Comparación de proyecto inconsistente — CANONICAL_PROJECTS case-sensitive vs pill de preview toLowerCase()",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Validación de CHECKPOINT",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La validación de proyecto en parsePaste y la comparación con el proyecto del card usan el mismo mecanismo (ambas case-insensitive o ambas case-sensitive)",
      "Un CHECKPOINT con 'Proyecto: asvab app' produce el mismo resultado de validación que 'Proyecto: ASVAB App'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "tracker legacy — regex [PITRB] incluye tipo 'I' inexistente en registro de actividad",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Registro de actividad",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regex de extracción de tipo de código acepta solo [PTRB] — sin 'I'",
      "Ítems con code que no matchea [PTRB]-YYYYMM-NNN no incrementan ningún contador válido"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogMd — usa item.desc en lugar de item.title; ítems schema_version 1 aparecen como '### code · undefined'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Resumen semanal",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "buildBacklogMd lee item.title como campo canónico, con fallback a item.desc para compatibilidad legacy",
      "Ningún ítem genera '### code · undefined' en el reporte generado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogMd — ítems con code [pendiente-ID] caen en byType['['] (undefined) y se omiten silenciosamente",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Resumen semanal",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "buildBacklogMd incluye todos los ítems independientemente del formato de su code",
      "Ítems con code '[pendiente-ID]' aparecen en sección 'Sin código asignado' del reporte"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildLogHeader — ai.color interpolado como atributo sin nombre en button de pill de IA",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Log de sesiones",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El color de IA se aplica al pill vía CSS custom property o atributo data-color, no interpolado directamente como atributo sin nombre",
      "Inspección del DOM: ningún button.log-ai-pill tiene atributos con formato #rrggbb sin nombre"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_ieAutofillFromPaste — regex [PTRBI] acepta tipo I inválido en autofill de editor",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Editor de ítems · Autofill",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regex de autofill en _ieAutofillFromPaste acepta solo tipos [PTRB] — sin I",
      "La regex mdHeaderRe acepta solo prefijos [PTRB] en códigos reales",
      "Ningún ítem se crea con type='I' desde el editor"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "onSearch — quickNotes no respetan scope de proyecto activo; notas globales aparecen en scope 'Proyecto activo'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Búsqueda global · Scope",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cuando scope = 'Proyecto activo', noteMatches filtra state.quickNotes por proyecto activo",
      "Cuando scope = 'Todos los proyectos', noteMatches muestra todas las notas sin filtro de proyecto",
      "Comportamiento de scope en notas es consistente con el de sesiones y proyectos en la misma función"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "deleteAI — verifica sesiones solo en state.projects; IAs con sesiones en ai.sessions formato legacy se eliminan sin confirmación",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Gestión de IAs",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "confirmClear(id) verifica sesiones tanto en state.projects como en ai.sessions (formato legacy v2)",
      "Si hay sesiones en cualquiera de las dos fuentes, el modal de confirmación se muestra antes de eliminar"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "downloadTemplates invocada sin typeof guard en _ckptDiffApplyAll — ReferenceError si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CHECKPOINT display · Descarga post-diff",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L800: downloadTemplates se invoca solo si typeof downloadTemplates === 'function'",
      "Si downloadTemplates no está disponible, se muestra toast de advertencia al usuario"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "handlePaste / handleInput en textarea sin typeof guard — ReferenceError nativo si módulo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Ingesta de CHECKPOINT · Textarea",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "onpaste y oninput del textarea verifican typeof handlePaste/handleInput === 'function' antes de invocar",
      "Si las funciones no están disponibles, el usuario recibe toast de error en lugar de ReferenceError"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "getActiveSprints() devuelve todos los sprints del proyecto sin filtrar por status — callers reciben sprints cerrados",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Sprint lifecycle",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "getActiveSprints() retorna solo sprints con status === 'active'",
      "Command palette 'close-sprint' toma active[0] y ese sprint siempre tiene status === 'active'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_assignPendingIds — slug collision silenciosa para ítems sin title/desc: todos mapean a slug 'item'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Parser ---ITEMS--- · Asignación de IDs",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si title y desc están vacíos, _slugify retorna slug único basado en posición o timestamp — no 'item' genérico",
      "Ningún ítem distinto resuelve al mismo código por colisión de slug vacío"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildTGPreview renderiza i.desc en lugar de i.title — columna descripción vacía para ítems schema v1",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CHECKPOINT display · Preview de ítems",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "buildTGPreview renderiza i.title || i.desc en la columna de descripción — no solo i.desc",
      "Ítems con solo campo title muestran el título en el preview sin columna vacía"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_docPrefix — 'Obsidian Labs' no en _PREFIX_MAP: fallback produce 'OB' en lugar de 'OL'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Export · Prefix de documentos vivos",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_PREFIX_MAP contiene entrada 'Obsidian Labs': 'OL'",
      "Entrada 'Obsidiana': 'OB' removida del mapa",
      "Proyecto con name='Obsidian Labs': _docPrefix() retorna 'OL'",
      "Verificable: crear proyecto 'Obsidian Labs', exportBacklogMd() → filename comienza con 'OL-BACKLOG_...'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "i.code[0] sin guard en _generateBacklogMd L455 y _buildCurrentStateMd L46 — TypeError si item.code es null",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Export · Contadores",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L455 y L46: i.code verificado antes de acceder a i.code[0]",
      "Si algún ítem tiene code:null, el forEach lo salta silenciosamente — sin TypeError, sin interrupción del export"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Export activo — Estado actual y filtro generacional usan criterio de sprint activo distinto: 'active' vs 'active'||'open'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Export · Consistencia interna",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Criterio canónico de sprint activo unificado en una sola constante o función",
      "Misma exportación: Estado actual y filtro generacional reflejan el mismo sprint activo"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Ctrl+K doble listener — CP registra en fase capture con e.preventDefault(): listener de SP en fase bubble nunca ejecuta",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Keyboard shortcuts · Conflicto de handlers",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Un único listener de Ctrl+K en el documento — el módulo dueño lo registra; el otro elimina su listener",
      "Ctrl+K produce siempre el mismo resultado independiente del orden de carga de módulos"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "action-search-context y _cpSearchContext — switchTab('backlog') sin prefijo 'tab-': navegación puede fallar silenciosamente",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Command Palette · Navegación",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L158 (action-search-context): switchTab('tab-backlog') — con prefijo",
      "L310 (_cpSearchContext action): switchTab('tab-backlog') — con prefijo",
      "Verificable: grep \"switchTab('backlog')\" en ai-tracker-command-palette.js → 0 coincidencias"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_mgBuildPlan — emite '---PLAN---' / '---PLAN-END---' (legacy): incompatible con parser activo de PP",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Map Generator · Generación de Plan",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L589: bloque emitido comienza con '---EXECUTION-PLAN---'",
      "L603: bloque cierra con '---EXECUTION-PLAN-END---'",
      "Campo 'scope: sprint' incluido en el bloque generado",
      "_tryIngestPlan recibe el bloque y lo ingesta sin toast de warning"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_mgInferStatus — tres checks inconsistentes para detectar modal activo: pueden contradecirse",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Map Generator · Inferencia de estado",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Un único mecanismo canónico para detectar visibilidad del modal #close-sprint-modal",
      "Si el modal está oculto visualmente, _mgInferStatus no devuelve 'closing'",
      "Verificable: modal con aria-hidden='true' y sin clase 'modal--open' → openMapGenerator() → botón Generar habilitado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "data-theme='light' hardcodeado en : flash of incorrect theme en carga para usuarios con dark mode",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Tema · Carga inicial",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "data-theme en  se establece desde localStorage antes del primer paint — vía script inline en ",
      "Usuarios con dark mode guardado no ven flash de tema claro en ninguna carga"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "reset-backlog-modal oninput — lógica multi-sentencia de validación en atributo HTML inline",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Reset modal · Separación HTML/JS",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "oninput de #reset-backlog-input llama función nombrada",
      "La función vive en un archivo .js — auditable y testeable"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Tres inline styles en elementos estáticos — violación CSS Purity §15",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CSS Purity · index.html",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "#btn-import-backlog sin style='display:none' — visibilidad controlada por clase CSS",
      "#toolbar sin style='display:none' — misma regla",
      "#gf-pulso sin style='cursor:pointer' — cursor definido en CSS"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "--font-sans re-declarado con !important en macOS Fidelity block sin scope de plataforma — aplica globalmente",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "CSS · Tipografía global",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La re-declaración de --font-sans en el macOS Fidelity block está condicionada a selector de plataforma",
      "O bien: la declaración se elimina del bloque macOS y --font-sans se gestiona exclusivamente en ai-tracker.css",
      "En Windows/Chrome: --font-sans resuelve a 'DM Sans'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "exportWeeklySummary — getAllSessions() invocada sin guard typeof; ReferenceError si módulo externo no carga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Resumen semanal",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "exportWeeklySummary verifica typeof getAllSessions === 'function' antes de invocarla",
      "Si getAllSessions no está disponible, el usuario recibe toast de error"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "saveContextDocs — no escribe en localStorage antes de intentar Supabase: pérdida de datos si Supabase falla y usuario recarga",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Persistencia · Context docs",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "saveContextDocs() escribe context y html-map en localStorage antes de intentar la escritura en Supabase",
      "Si Supabase falla, el usuario puede recargar y los datos de context del localStorage están disponibles",
      "Verificable: configurar Supabase para fallo → llamar saveContextDocs() → recargar → los datos de context persisten en localStorage"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "normStatus() — aliases incluyen emojis ('📤 Pendiente') inconsistentes con schema canónico 'pendiente' sin emoji",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Normalización de status",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "normStatus() retorna valores canónicos sin emoji: 'pendiente', 'done', 'descartado'",
      "Todas las comparaciones de status downstream (setItemStatus, _hasStaleSuggestion, _calcPriority) trabajan contra valores sin emoji",
      "Verificable: normStatus('📤 Pendiente') retorna 'pendiente'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showToast() / _toastRender() — regex de detección HTML en titleHtml permisivo: string con '<3' puede renderizar HTML no escapado",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Sistema de toasts · Seguridad",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El detector de HTML en titleHtml usa regex estricto que no produce falsos positivos con expresiones como '<3'",
      "Strings que no contienen HTML real se pasan por esc() antes de renderizarse en el toast",
      "Verificable: showToast({title: 'Tengo <3 items'}) → el toast muestra el string literal sin interpretar '<3' como tag HTML"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "signInWithMagicLink() — shouldCreateUser: true permite auto-registro de cualquier email en sistema de founder único",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Auth · Supabase",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "signInWithMagicLink() usa shouldCreateUser: false",
      "Solo emails pre-registrados en Supabase pueden autenticarse vía magic link",
      "Verificable: enviar magic link a email no registrado → Supabase devuelve error de usuario no encontrado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_purgeStaleBacklogCache() — muta array ITEMS directamente sin saveBacklog() ni _undoSnapshot(): purga no persiste y no tiene rollback",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Carga de backlog · Purga",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_purgeStaleBacklogCache() llama _undoSnapshot() antes de mutar ITEMS",
      "_purgeStaleBacklogCache() llama saveBacklog() después de la mutación",
      "La purga es deshacible via undoBacklog()",
      "Verificable: ítem con doneAt > 90 días → llamar _purgeStaleBacklogCache() → undoBacklog() → ítem restaurado"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Actualizar CANONICAL_PROJECTS en ai-tracker-session.js — 'Obsidiana' → 'Obsidian Labs'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Datos / Validación",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL_PROJECTS contiene 'Obsidian Labs' como string válido",
      "parsePaste() acepta 'Obsidian Labs' sin error de validación",
      "Decisión del founder sobre mantener o eliminar 'Obsidiana' como legacy documentada antes de implementar"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sidebar derecho — renombrar a label que refleje Workers como contenido principal",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Navegación / Orientación",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El título del sidebar refleja Workers como contenido primario (ej. 'Workers' o 'Workers · Radar')",
      "El cambio aplica tanto al label estático en HTML como al string dinámico asignado por JS",
      "Las notificaciones mantienen su badge en el header sin requerir que el nombre del sidebar diga 'notificaciones'"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Splash — agregar tagline estática visible durante carga para comunicar propósito del producto",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Onboarding",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El splash muestra una línea de texto descriptiva del producto bajo el logo durante toda la duración de la carga",
      "La tagline es visible antes de que el progress bar inicie",
      "El texto no es un estado de carga técnico — es una descripción del producto en lenguaje del usuario"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sesiones — agregar hint contextual bajo textarea de CHECKPOINT explicando qué pegar",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Onboarding / Sesiones",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Bajo el textarea de ingesta de CHECKPOINT hay texto de ayuda que explica qué es un CHECKPOINT y cómo generarlo",
      "El hint es visible sin interacción — no requiere hover ni click",
      "El hint desaparece o se reduce cuando el textarea tiene contenido"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Backlog — agregar CTA visible '+ Nuevo ítem' en toolbar",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Backlog · Descubribilidad",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La toolbar del tab Backlog contiene botón visible '+ Nuevo ítem'",
      "El botón abre openItemEditor() para crear ítem nuevo",
      "El botón es visible sin scroll en la toolbar — no enterrado en menú secundario"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Poblar mapa CANONICAL en ai-tracker-checkpoint.js con prefijos reales del ecosistema (OL, AS, CM, AI)",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "UI / Header",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL['Obsidian Labs'] = 'OL'",
      "CANONICAL['ASVAB App'] = 'AS'",
      "CANONICAL['Content Manager'] = 'CM'",
      "CANONICAL['AI Tracker'] = 'AI'",
      "Header muestra prefijo canónico correcto para cada proyecto activo"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Corregir _hasStaleSuggestion() — comparar contra 'pendiente' en lugar de 'en-progreso' (schema legacy)",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Retención / Workers",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La función compara status del ítem contra 'pendiente' (schema canónico vigente)",
      "Sugerencia de worker dispara cuando hay ítems con status 'pendiente' y >3 días sin sesión registrada"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Corregir _offlineQueuePush() — deduplicación por type + projId en lugar de solo type",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Datos / Integridad",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La deduplicación en _offlineQueuePush usa type + projId como clave compuesta",
      "Dos proyectos distintos con writes pendientes del mismo tipo no se sobreescriben"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Empty state Sesiones — corregir ícono ← a → para alinear con ubicación real del sidebar derecho",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Orientación",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El tracker-detail-empty-icon muestra '→' en lugar de '←'",
      "El hint 'Elige un Worker del panel derecho' se mantiene sin cambio"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Tab principal — renombrar 'Documentos' a 'Backlog'",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Navegación",
    "sprint": "PP-S-01",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El tab-btn con id tab-btn-backlog muestra 'Backlog' como label visible",
      "El tooltip del tab se actualiza para reflejar el nuevo nombre",
      "El sub-tab interno de Backlog mantiene su label 'Backlog' sin colisión visual con el tab padre"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Empty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referencia",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Onboarding / Activación",
    "sprint": "PP-S-02",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Tab Sesiones con estado vacío (sin workers) muestra CTA explícito con acciones 'Nuevo Worker' y 'Nuevo Proyecto'",
      "Tab Sesiones con workers pero sin proyecto muestra solo CTA 'Nuevo Proyecto'",
      "Tab Documentos / Backlog vacío muestra CTA de importación y creación de ítem",
      "El empty state de ambos tabs comunica el prerequisito de setup antes de que el founder lo descubra por error",
      "Patrón visual consistente con el empty state existente en tab Analytics",
      "El empty state no bloquea ninguna acción del producto — no es modal bloqueador",
      "El CTA de openItemEditor está protegido con guardia typeof (dependencia: B openItemEditor sin guardia debe estar resuelto primero)",
      "BLOQUEO UI PARCIAL: restricciones de Nova pendientes para jerarquía de CTAs y comportamiento con prerequisitos parciales"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Sprint — agregar version_target y release_type como obligatorios en formulario de apertura",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Sprint lifecycle · UI",
    "sprint": "PP-S-02",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El formulario de apertura de sprint tiene campo version_target obligatorio (texto libre no vacío)",
      "El formulario de apertura de sprint tiene selector release_type obligatorio con opciones: Major / Minor / Patch",
      "Ambos campos tienen label visible",
      "El botón de confirmar apertura está deshabilitado hasta que ambos campos tienen valor",
      "Intentar confirmar con cualquiera de los campos vacíos muestra validación inline — el modal no cierra",
      "Los mensajes de validación desaparecen cuando el campo recibe un valor",
      "BLOQUEO UI PARCIAL: restricciones de Nova pendientes para disposición de campos y mensajes de error inline"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Checklist de setup visible — 4 pasos con estado de completitud para activación de primer uso",
    "status": "pendiente",
    "priority": "medium",
    "effort": 2,
    "area": "Onboarding / Activación",
    "sprint": "PP-S-02",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El checklist aparece como banner en el tab Sesiones cuando al menos uno de los 4 pasos no está completo",
      "Los 4 pasos: (1) Worker creado: state.ais.length > 0, (2) Proyecto creado: state.projects.length > 0, (3) Ítem en backlog: ITEMS.length > 0, (4) Primera sesión guardada: getAllSessions().length > 0",
      "Cada paso muestra ícono binario de completitud (✓ done / ○ pendiente) calculado en tiempo real",
      "El banner tiene botón de dismiss — click guarda 'setup-checklist-dismissed' en localStorage y no reaparece",
      "Si todos los 4 pasos están completos al cargar, el banner no aparece",
      "El checklist no bloquea ninguna acción del producto",
      "Completar un paso actualiza el check correspondiente en tiempo real sin recargar",
      "BLOQUEO UI PARCIAL: restricciones de Nova pendientes para posición del banner y comportamiento de coexistencia con empty state"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Backlog — status chip inline clickeable en fila colapsada para cambiar status sin abrir IDP",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Backlog · Interacción",
    "sprint": "PP-S-02",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El chip de status en la fila colapsada es un elemento clickeable (cursor pointer)",
      "Click en el chip abre un selector inline de status con opciones: pendiente / done / descartado",
      "Seleccionar una opción actualiza el status del ítem via setItemStatus() sin abrir el IDP",
      "El chip se actualiza visualmente inmediatamente tras el cambio",
      "Si setItemStatus() falla, el chip revierte al status anterior y muestra toast de error",
      "Click fuera del selector (cuando está abierto) cierra sin cambiar status",
      "Escape cierra el selector sin cambiar status",
      "El selector no interfiere con el event listener de la fila que abre el IDP",
      "Dependencia: _buildChildrenBlock IDs de DOM debe estar corregido primero",
      "BLOQUEO UI PARCIAL: restricciones de Nova pendientes para diseño del selector inline y posición en la fila"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Botón '+' sidebar Workers — agregar label visible o cambiar ícono para comunicar acción 'Nuevo Worker'",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Affordances",
    "sprint": "PP-S-02",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El botón de agregar Worker en el sidebar muestra su acción sin depender solo del tooltip",
      "La acción es distinguible del pin btn y del collapse btn sin necesidad de hover"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Menú ⋯ — separar acciones frecuentes de configuración y acciones peligrosas",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Navegación",
    "sprint": "PP-S-02",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El menú ⋯ tiene al menos dos agrupaciones visuales claras con separadores semánticos",
      "Acciones de sesión frecuentes (backup, reporte) separadas visualmente de configuración (tema, sync, atajos)"
    ]
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Eliminar radar-sidebar-expand-btn del HTML o restaurar sus estilos CSS",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Navegación / Affordances",
    "sprint": "PP-S-02",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El elemento #radar-sidebar-expand no existe en el DOM, o bien tiene estilos CSS definidos visualmente coherentes",
      "Existe un único mecanismo de expansión del sidebar colapsado"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "loadBacklog — saveBacklog() incondicional en cada carga aunque no haya cambios",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "saveBacklog() se llama al final de loadBacklog() solo si migrated === true o sanitized > 0",
      "Una carga limpia no escribe al storage"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "setItemStatus — _blogLog llamado antes de _undoSnapshot(), log y estado desincronizados en undo",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Cambio de status",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_undoSnapshot() se llama antes de _blogLog() en setItemStatus()",
      "Si el usuario hace undo inmediatamente después de un cambio de status, el log no contiene el cambio revertido"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showMergeDiffPanel — window._mdiff* se redefinen en cada apertura, closures anteriores reemplazadas",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Merge de CHECKPOINT",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Las funciones window._mdiff* se limpian (delete window._mdiff*) al cerrar el panel",
      "Abrir el panel múltiples veces no acumula referencias huérfanas en window"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Focus mode — _backlogFocusMode y _focusModeActive activos simultáneamente, Esc desactiva solo _focusModeActive",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Focus mode",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Esc desactiva ambos focus modes si ambos están activos, en orden: _focusModeActive primero, _backlogFocusMode segundo",
      "O bien: los dos modos son mutuamente excluyentes"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogItem — porcentaje de progreso de R calculado sobre hijos filtrados, no sobre total de hijos",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Render de ítems",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El porcentaje de progreso del R se calcula siempre sobre allChildren (total de hijos sin filtrar)",
      "Los filtros de status activos afectan qué hijos se muestran pero no el denominador del porcentaje"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_rebuildLogBody — listener scroll acumulado por render() monkey-patch: mínimo 2 acumulaciones por guardado",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Log de sesiones",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El listener de scroll en logBody se registra con referencia nombrada para permitir removeEventListener",
      "Con N guardados de sesión, exactamente 1 listener de scroll está activo"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "saveSession — ai._parsed accedido sin guard cuando getAI(id) devuelve null",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Guardado de sesión",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "saveSession(id) verifica que getAI(id) no sea null antes de acceder a ai._parsed",
      "Si ai es null, se muestra toast de error y la función retorna sin TypeError"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "style.setProperty('background'/'color'/'border-color') en openPulsoPanel — violación CSS Purity",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Pulso panel · CSS Purity",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L7055-7057: background, color y border-color se aplican vía CSS custom property",
      "grep 'style.setProperty.*background' no produce coincidencias con propiedades de presentación no-custom"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "color-mix() — 175 instancias sin @supports wrapper ni fallback: colores ausentes en Safari < 16.2",
    "status": "pendiente",
    "priority": "medium",
    "effort": 3,
    "area": "CSS · Compatibilidad cross-browser",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Cada uso de color-mix() tiene fallback estático (valor hex o rgba) como propiedad anterior en el mismo bloque",
      "O bien: @supports wrapper en bloques críticos (badges de tipo, sprint headers, heatmap)",
      "En Safari 15: badges de tipo de ítem tienen color de fondo visible"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "background-attachment: fixed en dark body — sin override mobile: scroll jank en iOS/Android",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "CSS · Performance mobile",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "@media (max-width: 768px): [data-theme='dark'] body { background-attachment: scroll }",
      "En iOS Safari con tema dark: scroll sin jank visual"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_calcPriority — effort 1 en sprint cerrado eleva priority a high en ítems pendientes",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Cambio de status",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La regla de effort 1 → high solo aplica si el sprint asignado está en status 'active' u 'open'",
      "Ítems en sprints cerrados no reciben prioridad automática alta por effort"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_initFocusShortcut — listener keydown sin cleanup, acumula duplicados en hot reload",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Focus mode",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El listener de keydown de _initFocusShortcut se registra con referencia nombrada",
      "Recargar el módulo no acumula listeners adicionales"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "buildBacklogItem — item.desc renderizado en bitem-body aunque 'desc' no es campo canónico del schema",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Render de ítems",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Ítems con campo desc legacy muestran advertencia visual de campo fuera de schema",
      "O bien: desc se migra a title en loadBacklog() y no se renderiza como campo independiente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "ITEMS IIFE — inicio silencioso sin feedback si proyecto activo no tiene datos en localStorage",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Carga de backlog",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si current-project-filter apunta a un proyecto sin datos en localStorage, se emite console.warn",
      "El comportamiento de ITEMS vacío es documentado como estado válido de primer uso"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "sess.id generado con Date.now() sin componente random — colisión posible en guardados concurrentes",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Registro de actividad",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "newSess.id se genera con Date.now() + componente aleatorio",
      "Dos sesiones guardadas en el mismo ms tienen IDs distintos"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Doble render() post-guardado — monkey-patch llama _rebuildLogBody() dos veces por guardado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Cierre de sesión",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Por cada guardado de sesión, _rebuildLogBody() se ejecuta exactamente una vez"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "env.js y Supabase SDK en HEAD sin defer/async — bloqueantes de renderizado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Performance · Carga de scripts",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "env.js cargado con defer",
      "Supabase SDK cargado con defer o async según patrón de inicialización"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "3 instancias de backdrop-filter sin -webkit-backdrop-filter: #ckpt-panel, .quick-note-overlay, overlay genérico",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CSS · Compatibilidad Safari",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Las 3 instancias tienen par -webkit-backdrop-filter inmediatamente después del backdrop-filter",
      "grep 'backdrop-filter' en ai-tracker-extra.css: cada instancia tiene par webkit"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_scmStep1Html — doble fuente de verdad _scmState como global y como parámetro derivado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Cierre de sprint",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_scmStep1Html accede métricas de effort exclusivamente via parámetros recibidos, no via _scmState global",
      "No hay referencias directas a _scmState dentro de _scmStep1Html"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openItemEditor — campo item-notes ausente del DOM no genera warning; notes se pierde silenciosamente",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Editor de ítems",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si #item-notes no existe en el DOM al guardar, confirmItemEditor emite warning en consola",
      "El campo notes no se pierde silenciosamente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildDynamicCommands IAs — switchTab('tracker') sin prefijo 'tab-'",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Command Palette · Comandos dinámicos",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L210: switchTab('tab-tracker') — con prefijo",
      "Verificable: grep \"switchTab('tracker')\" en ai-tracker-command-palette.js → 0 coincidencias"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_mgLoadFiles — deduplicación silenciosa: archivo actualizado con mismo nombre descarta versión nueva",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Map Generator · Dropzone",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si el usuario sube un archivo con nombre idéntico: reemplazar la versión anterior con la nueva",
      "Toast informativo: '[nombre] reemplazado — versión anterior descartada'"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "confirmMapGenerator — sin instrucción al usuario tras warning de sprint sin cerrar: modal en estado indeterminado",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Map Generator · Version bump",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Tras el toast de warning, el modal muestra instrucción visible: 'Cierra el sprint activo antes de continuar'",
      "O bien: el modal se cierra automáticamente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_isBlocked — dep IDs inexistentes en allSessions bloquean sesión permanentemente sin mensaje",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "EXECUTION-PLAN display · Dependencias",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si un dep ID en depende_de no existe en allSessions, la sesión muestra indicador de dependencia rota",
      "O bien: el HTML de sesión bloqueada incluye '(dep no encontrada)' cuando el blocker no existe"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "L7356 — warning message en plan display usa string '---PLAN---' (legacy) en lugar de '---EXECUTION-PLAN---'",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "EXECUTION-PLAN display",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L7356: el mensaje de campo faltante dice 'edita el bloque ---EXECUTION-PLAN--- antes de copiar'",
      "grep '---PLAN---' en este módulo → 0 coincidencias en strings de UI visibles al usuario"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "showCheckpointPanel — early return silencioso cuando CHECKPOINT no tiene ítems ni Próximo paso/Decisión",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CHECKPOINT display",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si sections.length === 0, showCheckpointPanel muestra toast informativo indicando que el CHECKPOINT fue procesado sin cambios"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "openProjModal/closeProjModal — acceso a classList sin null guard en elementos del modal",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Gestión de proyectos · Modal",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "L817, L822, L713, L720: elemento verificado con null guard antes de acceder a classList",
      "Si #proj-modal-overlay no existe en DOM, función retorna silenciosamente"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_renderProjList archived toggle — lógica JS multi-sentencia embebida como string en onclick",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Gestión de proyectos",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "onclick del botón archived-toggle llama una función nombrada",
      "grep 'onclick.*localStorage' en este módulo → 0 coincidencias"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "cleanupLocalStorage / testLocalStorageQuota — funciones de debug expuestas globalmente en producción",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Debug · Producción",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "cleanupLocalStorage y testLocalStorageQuota no accesibles desde window en producción",
      "En producción: window.cleanupLocalStorage === undefined"
    ]
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Onboarding modal paso 3 — agregar link/tooltip explicando qué es un CHECKPOINT",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "Onboarding",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El paso 3 del onboarding modal tiene link o tooltip que explica qué es un CHECKPOINT",
      "O bien: el paso 3 tiene botón de acción hacia el textarea de ingesta"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Checkpoints — toast redundante de error de proyecto no canónico cuando preview inline persiste",
    "status": "pendiente",
    "priority": "low",
    "effort": 1,
    "area": "CHECKPOINT display",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "Si el preview inline ya muestra el error de proyecto no reconocido, no se emite toast adicional",
      "El usuario recibe un único feedback de error por validación de proyecto"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "_buildOption() — función duplicada verbatim en _buildSprintSelector() y _blSprintOpen(): cambio en una copia no aplica a la otra",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Sprint lifecycle · Refactor",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "_buildOption() definida una única vez como función de módulo — no duplicada dentro de otras funciones",
      "Ambos sitios de uso referencian la misma función",
      "Verificable: grep '_buildOption' en ai-tracker-backlog.js → una sola definición"
    ]
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "confirmAddAI() — ID de worker generado con Date.now() sin componente random: colisión posible en inserciones rápidas",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Gestión de Workers",
    "sprint": "futura",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "El ID del worker nuevo se genera con Date.now() + componente aleatorio (Math.random().toString(36).slice(2))",
      "Dos workers creados en el mismo ms tienen IDs distintos",
      "Verificable: crear dos workers en el mismo tick → IDs distintos"
    ]
  }
]
```

---

---CHECKPOINT---
Título: Protocolo de Análisis de Backlog — AI Tracker PP-BACKLOG-nuevo
Proyecto: Obsidian Tracker
Rol: PO · Cael
Resumen: Ejecutado protocolo completo de 6 pasos sobre PP-BACKLOG-nuevo.md. Corrección de 52 ítems PP-S-26→PP-S-01 (Paso A). Gap analysis detectó 7 hallazgos ausentes del backlog vs auditoría §1.2/§8.3-8.4 (Paso B). Especificación de 5 Rs bloqueados — 2 con bloqueo UI parcial diferidos a PP-S-02, 3 con AC funcionales completos para PP-S-01 (Paso C). Distribución de sprints PP-S-01/PP-S-02/PP-S-03+ con alerta de sobrecarga estimada y scope reducido sugerido para PP-S-01 (Paso D). Backlog completo emitido en bloque ITEMS (Paso E).
Archivos: PP-BACKLOG-ANALISIS_V1_0.md
Contexto: Reset del ecosistema completado (Fases 1–5). Primer sprint post-reset PP-S-01 pendiente de apertura formal por Vera tras auditoría pre-sprint.
Bloqueantes: 4 Rs con bloqueo UI parcial requieren consulta a Nova antes de cerrar AC definitivos: Empty state Sesiones+Documentos, Checklist de setup, Sprint version_target+release_type, Backlog status chip inline. Diferidos a PP-S-02.
Aprendizaje: PP-S-01 con scope completo (Cluster A + B + gaps) supera 63 effort — inviable en una semana para founder único. Scope reducido sugerido: solo Cluster A + gaps críticos + T CANONICAL = ~41 ítems. Vera debe decidir scope antes de abrir el sprint.
CONTEXT-SECTION: n/a
Decisión: PP-S-01 entra con scope reducido (bugs críticos + gaps de seguridad/integridad) — bugs mayores y Rs con Nova se mueven a PP-S-02.
Próximo paso: (1) Vera revisa distribución de PP-S-01 y aprueba scope reducido o ajusta. (2) Nova consulta para cerrar AC de 4 Rs diferidos. (3) Vera ejecuta auditoría pre-sprint con Rs especificados en Paso C antes de abrir PP-S-01.

---ITEMS---
[]
---ITEMS-END---
---FIN-CHECKPOINT---