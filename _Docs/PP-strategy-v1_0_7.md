# PP-STRATEGY_V1_0_7.md
<!-- Versión: 1.0.7 | Última actualización: 2026-05-31 | Estrategia del proyecto Locus — dueño: Noa (CPO) -->

---

## 1. Identidad

| Campo | Valor |
|---|---|
| Nombre | Locus |
| Alias | PEPE · AI Tracker |
| Tipo | Herramienta interna — gestión de backlog, contexto y sesiones del ecosistema |
| Holding | Obsidian Labs |
| Prefijo | PP |
| Archivo activo | `index.html` |
| Stack | Single-file HTML + JS modular + CSS modular + Supabase — conteo de módulos → ver MAP activo |

---

## 2. Visión

> El sistema nervioso central de Obsidian Labs — controla el conocimiento del ecosistema via CHECKPOINTs, monitorea el estado de los workers y elimina dependencia de herramientas externas de pago.

---

## 3. Misión

> Dar al founder visibilidad total sobre el estado del ecosistema — qué está hecho, qué está roto, qué worker está agotado — desde una sola herramienta que él mismo construye y controla.

---

## 4. Modelo de persistencia

| Decisión | Valor |
|---|---|
| Storage primario | Supabase |
| localStorage | Caché / fallback — solo para continuidad de sesión activa |
| Auth | Requisito core — sin auth no hay modo válido de operación |
| Modelo de usuario | Un solo usuario (founder) — multi-dispositivo previsto |
| Multi-dispositivo | Mismo usuario, sincronización via Supabase |
| Offline mode | No requerido — degradación visible es suficiente |
| Historial versionado | No requerido — estado actual siempre sincronizado |

**Estado actual (Fase C completa):** Supabase es el storage primario. `save()` tiene paths separados — sin auth → localStorage, offline → localStorage + queue, online+auth → debounce a Supabase únicamente. localStorage es fallback real, no write-to-both.

**Implicaciones técnicas:**
- localStorage no es fuente de verdad — cualquier write debe confirmarse en Supabase
- Auth no es feature opcional — es prerequisito de cualquier operación de escritura
- Sync no es background task — es el flujo principal

---

## 5. Viewport y plataforma

| Decisión | Valor |
|---|---|
| Viewports soportados | 1920×1080 · 2560×1080 |
| Formato | Wide y Ultrawide — solo desktop |
| Mobile / tablet | No soportado |
| Breakpoints | Solo entre los dos viewports declarados |

**Implicación para Nova:** Todo diseño de Locus es desktop-only. No hay restricciones de touch, viewport móvil ni responsive general. `_Locus-css-ref` y `_Locus-ux-ref` se declaran con esta restricción como invariante. Esta restricción override cualquier patrón mobile-first que Nova aplique por defecto en otros proyectos — Locus es la excepción explícita.

---

## 6. Arquitectura técnica

### Stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML + JS modular — `index.html` + módulos JS externos |
| Estilos | CSS modular — archivos `locus-*.css` |
| Persistencia | Supabase (primario) · localStorage (fallback — Fase C completa) |
| Tema | Light / Dark — guardado en localStorage |

Conteo de módulos, archivos y líneas → fuente de verdad: MAP activo.
Orden de carga CSS y JS → fuente de verdad: `index.html`.

**Nota — migración ESM en curso:** R aprobado en sesión 2026-05-30. Fases 1+2 en próximo sprint. `window.Locus` se mantiene en Fase 1. La nota crítica de guard obligatorio queda eliminada al completar Fase 1.

### Reglas de ejecución ESM — Locus

Estas reglas aplican únicamente a Locus durante y después de la migración ESM. No son reglas del ecosistema general — viven aquí porque son decisiones de stack de Locus.

**Header de identidad en archivos ESM:** El header va inmediatamente después del bloque de imports — no en la primera línea. Ver `__BR-Execution §9` para el formato del header.

```js
import { algo } from './modulo.js';
// [PP] v1.0 · sprint:PP-S-XX · mod:N · autor:Rune · YYYY-MM-DD HH:MM UTC-6
```

**Impacto lateral ESM — tipo adicional para Rune:** Además del impacto lateral lógico (ver `__BR-Execution §2`), Rune declara el impacto ESM cuando el T modifica un export nombrado:

```
Impacto lateral ESM: [función] es importada por [módulo-A], [módulo-B]. 
Cambio de firma: [sí/no]. Call sites verificados: [sí/no].
```

**Criterio de done ESM — Rune:** Antes de declarar un T como `en-revision`, Rune verifica que las importaciones del módulo modificado resuelven correctamente contra el MAP activo. Si hay import que apunta a export no declarado → no declarar `en-revision`.

**Checklist de auditoría ESM — Finn:** Al auditar Ts de la migración ESM, Finn verifica:

| Pregunta | Si la respuesta es no → |
|---|---|
| ¿Los exports nombrados del módulo están cubiertos en los AC? | Gap de contrato — devolver a Cael |
| ¿Los call sites que invocan esos exports tienen AC verificables? | Gap de especificación — devolver a Cael |

**Coherencia de exports en cierre de R ESM — Finn:** En la sesión de cierre del R de migración ESM, Finn verifica que los exports nombrados declarados en los Ts son coherentes entre sí — ningún módulo importa un nombre que otro módulo dejó de exportar.

**Criterio de alcance de regresiones ESM — Finn:** Al aprobar un T de migración ESM, Finn extiende el criterio de alcance de regresiones siguiendo el grafo de imports: todo módulo que importa del módulo modificado es candidato a regresión, aunque no haya sido tocado en el sprint.

**CSS Reference ESM — Nova:** Cuando un módulo CSS migra a ESM, Nova revisa los patrones del CSS Reference para verificar que los selectores no dependen de orden de carga que ESM puede alterar. Si hay dependencia de orden → señalar antes de continuar.

---

## 7. Protocolo de sprints y versionado

**Sprint = Release.** Cada sprint produce exactamente una versión de la app. No hay sprints internos sin release. Si el trabajo no justifica una versión nueva — no justifica un sprint.

Convenciones de ciclo de vida, naming canónico, `version_target` y `release_type` → ver `BR-Ecosystem §5`.

**Específico de Locus:**
- Prefijo canónico de sprint: `PP-S-XX`
- Sprint tiene exactamente dos estados válidos: `active` y `closed`. El valor `open` fue eliminado en R-202605-005 — migración automática en `_applyStateData` al cargar la app.
- Ítems nuevos emitidos en CHECKPOINT llegan siempre con `sprint: icebox`. Ningún rol asigna sprint al emitir. Un ítem nunca se asigna a un sprint cerrado — Locus normaliza a `icebox` y muestra error.

---

## 8. Protocolo de parseo de CHECKPOINT

Protocolo general de CHECKPOINT → ver `BR-Ecosystem §8`.

**Implementación en Locus — módulos y comportamiento de código:**

| Campo | Módulo responsable |
|---|---|
| `Proyecto:` | Validado contra `CANONICAL_PROJECTS` en `locus-session-parse.js` |
| `---ITEMS---` | `mergeBacklogFromTG` en `locus-backlog-item.js` — JSON array. Acepta ítems (`type: R|T|P|B`) e instrucciones (`type: patch`) en el mismo bloque |
| `type: patch` | `applyPatchesFromTG` en `locus-backlog-item.js`. Solo requiere `code` real + campos a actualizar |
| `---EXECUTION-PLAN---` | `_tryIngestPlan` en `locus-session-parse.js` — scope `sprint` o `sesion` |
| `CONTEXT-SECTION:` | Ignorado por el parser — campo informativo |
| `MAP-SECTION:` | Eliminado del protocolo — no se parsea |

**Reglas de parseo específicas de Locus:**

| Regla | Comportamiento |
|---|---|
| `sprint: icebox` en ítems nuevos | Valor canónico para ítems sin sprint asignado. Valores `n/a` y `sin-sprint` son inválidos — Locus los normaliza a `icebox` + advertencia en DocLog |
| Ítems históricos con `sprint: n/a` | Migración automática a `icebox` al cargar — registrada en log de Locus con conteo de ítems migrados |
| Sprint cerrado prohibido | Si ítem llega con `sprint` apuntando a sprint cerrado → normalizar a `icebox` + error explícito al usuario |
| `version_target` independiente | Parser no lee CONTEXT para determinar versión — fuente de verdad es el sprint abierto en Locus |
| `intencion` en Rs | Opcional para el parser — no bloquea ingesta si ausente. Locus almacena y renderiza en IDP si presente |
| `type: patch` | No es tipo de ítem — es instrucción de operación. Patch sobre código placeholder → ignorado + advertencia DocLog. Patch sobre código inexistente → advertencia DocLog, sin crash |

---

## 9. Roadmap

### Estado del refactor JS

| Fase | Estado | Próxima acción |
|---|---|---|
| Fase B | ✅ Completa | — |
| Fase A | ✅ Completa | — |
| Fase C — Storage | ✅ Completa | — |
| Fase B(api) — locus-api.js | ✅ Completa | — |

### Estado de sprints cerrados

| Sprint | Versión | Scope |
|---|---|---|
| PP-S-01 | v1.0.0 | Bugs críticos — foundation y flujos core |
| PP-S-02 a PP-S-07 | v1.0.x – v1.1.x | Features, refactor JS, CSS modular inicial |
| PP-S-08 | v1.2.3 | Refactor estructural CSS — locus-backlog.css |

### Sprint siguiente

**Scope parcialmente definido — pendiente apertura formal**

| Campo | Valor |
|---|---|
| Estado | No abierto — pendiente apertura formal con Cael |
| Bloqueante conocido | Ninguno |
| Prerequisito | Cael define scope completo · Founder aprueba sprint |
| R aprobado | Migración ESM (Fase 1+2) — aprobado en sesión Vera 2026-05-30 |

---

## 10. Riesgos

| Riesgo | Nivel | Mitigación |
|---|---|---|
| `CANONICAL_PROJECTS` con strings deprecados | Alto | T pendiente en backlog — fix antes de cualquier ingesta de CHECKPOINT |
| Clases CSS legacy deprecated activas | Bajo | `.hidden` y variantes conviven con `.is-hidden` — migración JS pendiente |

---

## 11. Decisiones registradas

| Fecha | Decisión | Contexto |
|---|---|---|
| 2026-04-26 | Locus (PEPE) — string canónico | AI Tracker como nombre operativo. Locus como string canónico en CHECKPOINTs |
| 2026-04-27 | MAP-SECTION eliminado del protocolo CHECKPOINT | MAP se genera desde archivos reales al cierre de sprint via Locus |
| 2026-05-07 | Reset del ecosistema ejecutado — Fases 1–4 completadas | PP-S-01 a PP-S-25 reseteados. Backlog nuevo en PP-BACKLOG-nuevo.md |
| 2026-05-07 | Versión app reseteada a v1.0.0 | Decisión Vera — Fase 5 del plan de reset |
| 2026-05-08 | PP-S-01 scope cerrado | Solo Cluster A + gaps críticos + T CANONICAL. Cluster B y Rs con Nova a PP-S-02 |
| 2026-05-10 | `version_target` independiente del CONTEXT — regla dura | Se declara al abrir sprint. CONTEXT se actualiza al cerrar. Fuente de verdad: sprint abierto en Locus |
| 2026-05-10 | Bloque `intencion` obligatorio en Rs de CHECKPOINT | Tres líneas escaneables para el founder |
| 2026-05-11 | CSS migrado a arquitectura modular | ai-tracker.css y ai-tracker-extra.css reemplazados por archivos locus-*.css |
| 2026-05-12 | Nova designada dueña del sistema de diseño de Locus | Mantiene `_Locus-css-ref` y `_Locus-ux-ref`. Rune consume — no modifica |
| 2026-05-12 | CSS-04 implementado — clase canónica `.is-hidden` | Clases legacy mantenidas DEPRECATED por usos activos. Migración JS = T separado |
| 2026-05-13 | Supabase como storage primario — decisión de producto | localStorage pasa a caché/fallback. Auth es requisito core |
| 2026-05-13 | Modelo de usuario: un founder — multi-dispositivo previsto | Mismo usuario, sincronización via Supabase. Offline mode no requerido |
| 2026-05-13 | Viewports soportados: 1920×1080 y 2560×1080 — solo desktop | Mobile/tablet no soportado |
| 2026-05-13 | Sprint = Release — modelo de versionado | Cada sprint produce exactamente una versión |
| 2026-05-13 | `locus-storage.js` extraído de `ai-tracker-checkpoint.js` | Módulo de persistencia independiente. Precede a todos los módulos JS |
| 2026-05-19 | Fases A + B + C + B(api) del refactor JS completadas | QA aprobado por Finn. 41 módulos activos |
| 2026-05-19 | `ai-tracker-backlog.js` refactorizado en 6 módulos `locus-backlog-*.js` | core · item · panel · render · sprints · archive |
| 2026-05-20 | CONTEXT y STRATEGY no contienen conteos de líneas ni listas de funciones | Eso vive exclusivamente en el MAP |
| 2026-05-22 | `locus-overrides.css` eliminado — 101 selectores reubicados | R-202605-018 done. CSS modular actualizado |
| 2026-05-22 | Riesgo `item.desc` cerrado — R-202605-007 done | `buildBacklogMd` y `buildTGPreview` migrados a `item.title` |
| 2026-05-23 | `locus-sprint.js` creado — orquestador del tab Sprint | Expone renderSprintTab. Módulos JS: 40 → 41 |
| 2026-05-23 | R-202605-053 implementado — bloque ## Sprint activo en backlog exportado | _buildSprintActivoMd() en locus-sprint-project.js |
| 2026-05-25 | `type: patch` documentado en protocolo de parseo | R-202605-062 implementado en código |
| 2026-05-25 | Criterio de arquitectura CSS declarado formalmente | CSS vive en el archivo del feature que lo renderiza como experiencia principal |
| 2026-05-25 | PP-S-08 cerrado — v1.2.3 | Refactor estructural locus-backlog.css completo. Stack real: 41 módulos JS · 17 archivos CSS |
| 2026-05-25 | Stack verificado contra archivos reales | locus-tracker-utils.js · locus-backlog-merge.js confirmados. CSS: 17 archivos incluyendo locus-tracker-card.css · locus-sprint.css · locus-sprint-close.css · locus-sprint-plan.css · locus-sprint-ui.css · locus-archive.css · locus-docs.css · locus-backlog-item.css |
| 2026-05-27 | Status 'open' de sprints eliminado — modelo active/closed | R-202605-005. Sprint tiene exactamente dos estados válidos: active y closed. Migración automática en _applyStateData al cargar la app |
| 2026-05-27 | Versionado de CONTEXT y STRATEGY alineado al MAP | CONTEXT y STRATEGY adoptan la versión del MAP activo — tríada legible de un vistazo. A partir de v1.0.5 |
| 2026-05-27 | Orden de carga CSS/JS delegado a `index.html` · conteo de módulos delegado al MAP | STRATEGY §6 y CONTEXT §7 dejan de duplicar información — fuentes de verdad únicas |
| 2026-05-27 | `locus-tracker.js` → `locus-sesiones.js` · `locus-tracker-utils.js` → `locus-sesiones-utils.js` | Tab se llama 'sesiones'. `switchTab('tracker')` deprecado — `switchTab('sesiones')` es el valor canónico |
| 2026-05-27 | STRATEGY §7 y §8 refactorizados — duplicación vs BR-Ecosystem eliminada | Ciclo de vida, naming, version_target, release_type y reglas de CHECKPOINT referencian BR-Ecosystem. Solo lógica específica de Locus permanece en STRATEGY |
| 2026-05-27 | `sprint: icebox` reemplaza `sprint: n/a` como valor canónico | BR-Ecosystem V1.6. Locus normaliza n/a → icebox al parsear. Migración automática de ítems históricos al cargar |
| 2026-05-30 | Migración ESM aprobada — R en próximo sprint | Fases 1+2: `export` en módulos + `import` en consumidores + `type="module"` en `index.html`. Sin bundler. `window.Locus` se mantiene en Fase 1. Fase 3 como P en backlog. Guard `typeof fn === 'function'` se elimina al completar Fase 1. Aprobado por Vera en sesión dominical |
| 2026-05-31 | Reglas ESM de Locus movidas a PP-strategy §6 | No son reglas del ecosistema — son decisiones de stack de Locus. BR-Execution permanece limpio de referencias ESM. Reglas: header post-imports · impacto lateral ESM · criterio de done ESM · checklist Finn · alcance de regresiones ESM · CSS Reference ESM |
| 2026-05-31 | Implicación desktop-only de §5 extendida para Nova | Override explícito de mobile-first — Locus es la excepción declarada en PP-strategy §5 |
