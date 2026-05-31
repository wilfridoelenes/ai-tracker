# CM-CONTEXT_V0_5.md
<!-- Versión: 0.5 | Última actualización: 2026-05-06 | Contexto operativo del Content Manager -->

---

## 1. Identidad

| Campo | Valor |
|---|---|
| Nombre | Content Manager (CM) |
| Tipo | Herramienta interna — pipeline de contenido |
| Holding | Obsidian Labs |
| Estado | Prototipo funcional |
| Versión activa | V7.13.4.21 |
| Archivo activo | `content-manager_V7_13_4_21.html` |

---

## 2. Propósito

El CM es la herramienta interna que genera, organiza y exporta el banco de preguntas de la ASVAB App. No es un producto de cara al usuario — es la fábrica de contenido que alimenta el producto final.

---

## 3. Roles

| Rol | Nombre | Sigla | Función |
|---|---|---|---|
| PO + BA Transversal | Cael | PO | Extracción de intención, especificación completa, criterios de aceptación, backlog |
| FS Transversal | Rune | FS | Implementación técnica, entregables de código |
| Especialista Taxonomías | Eden | ET | Arquitectura pedagógica y clasificación de contenido |
| Generador de Contenido | Sage | GC | Producción de preguntas ASVAB según taxonomía |

> Orion (PO) y Kai (FS) son roles deprecados — reemplazados por Cael y Rune respectivamente.

---

## 4. Arquitectura

### Stack
- Single-file HTML app (sin dependencias de servidor)
- JavaScript vanilla — sin frameworks
- **IndexedDB** como persistencia principal (`CM_IDB` wrapper — clave: `asvab_cm_idb`)
- localStorage como fallback si IndexedDB no disponible
- JSZip para exportación ZIP
- Google Fonts (Space Mono + DM Sans)

### Persistencia IndexedDB (CM_IDB)

| Clave | Contenido |
|---|---|
| `asvab_cm_v7` | `{ data, lessonMeta, activeLesson, savedAt }` |
| `asvab_cm_v7_meta` | lessonMeta serializado por separado |
| `asvab_cm_v7_sb_width` | ancho del sidebar (preferencia UI) |
| `asvab_cm_v7_history` | snapshots de versiones (_versionHistory) |
| `asvab_cm_v7_audit` | audit log de acciones (_auditLog) |
| `asvab_cm_v7_export_history` | historial de exportaciones |
| `asvab_cm_v7_last_deploy_hash` | hash del último deploy conocido (sync indicator) |

> Migración automática desde localStorage al inicializar CM_IDB si existen claves legacy.

### Modelo de datos — Pregunta

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Formato canónico: `[SECTION]-[LESSON_KEY]-[NNN]` |
| `question` | string | Texto de la pregunta |
| `options` | array[4] | Opciones A-D |
| `correct_index` | number | Índice 0-3 (campo canónico — `correct` es legacy) |
| `explanation` | string | Explicación de la respuesta correcta |
| `difficulty` | number | `1`–`4` (N1=fácil … N4=difícil) |
| `section` | string | `wk` / `ar` / `mk` / `pc` |
| `lesson` | string | Clave canónica de lección (ej: `WK-1.1-L01`) |
| `topic` | string | Topic de la taxonomía |
| `subtopic` | string | Subtopic de la taxonomía |
| `_keyword` | string | Palabra clave de la pregunta (WK — y AR donde aplique) |
| `_translation` | string | Traducción de keyword al español (WK) |
| `_question_es` | string | Versión en español de la pregunta (WK) |
| `_isNew` | bool | Flag de pregunta nueva en sesión |

### Modelo de datos — lessonMeta

```js
lessonMeta[lessonKey] = {
  section: 'wk' | 'ar' | 'mk' | 'pc',
  topic: string,
  subtopic: string
}
```

---

## 5. Taxonomía activa (AFQT — Fase 1)

### WK — Word Knowledge (color: gold)

| Topic key | Nombre | Subtopics |
|---|---|---|
| synonyms | Synonyms | WK-1.1 Sinónimos directos / WK-1.2 Sinónimos por matiz |
| antonyms | Antonyms | WK-2.1 Opuestos complementarios / WK-2.2 Opuestos graduales / WK-2.3 Opuestos por prefijo negativo |
| context | Sentence Context | WK-3.1 Claves de definición / WK-3.2 Claves de contraste / WK-3.3 Claves de causa-efecto / WK-3.4 Claves de lista-ejemplo / WK-3.5 Palabras polisémicas |
| roots | Word Roots | WK-4.1 Raíces comunes / WK-4.2 Raíces menos frecuentes / WK-4.3 Combinación de dos raíces |
| affixes | Prefixes & Suffixes | WK-5.1 Prefijos negativos / WK-5.2 Prefijos cantidad-tamaño-posición / WK-5.3 Sufijos de categoría gramatical |
| register | Register | WK-6.1 Formal académico-legal-militar / WK-6.2 Coloquial / WK-6.3 Jerga o argot / WK-6.4 Eufemismos y disfemismos |
| homophones | Homophones & Homographs | WK-7.1 Homófonas / WK-7.2 Homógrafas |

> WK-1.3 eliminado desde v2.4 de la arquitectura curricular — no generar preguntas con ese código.

### AR — Arithmetic Reasoning (color: green) — Taxonomía v1.0

| Topic key | Nombre | Subtopics |
|---|---|---|
| foundations | Foundations | AR-0.1 Whole Numbers / AR-0.2 Units & Conversions / AR-0.3 Basic Word Setup |
| fractions | Fractions | AR-1.1 Basic Operations / AR-1.2 Mixed Numbers / AR-1.3 Ratios & Proportions |
| percentages | Percentages | AR-2.1 Basic Percentages / AR-2.2 Discounts & Interest / AR-2.3 Percent Word Problems |
| algebra | Basic Algebra | AR-3.1 Simple Equations / AR-3.2 Word Equations / AR-3.3 Number Relationships |
| geometry_applied | Geometry Applied | AR-4.1 Perimeter & Area / AR-4.2 Volume / AR-4.3 Geometry Word Problems |
| applied_reasoning | Applied Reasoning | AR-5.1 Distance, Rate & Time / AR-5.2 Work & Comparison Problems / AR-5.3 Multi-Step Word Problems |

### MK — Mathematics Knowledge (color: orange)

| Topic key | Nombre | Subtopics |
|---|---|---|
| foundations | Foundations | MK-0.1 Number Types & Properties / MK-0.2 Order of Operations / MK-0.3 Factors, Multiples & Roots |
| fractions_pct | Fractions & Percents | MK-1.1 Adding & Subtracting Fractions / MK-1.2 Multiplying & Dividing Fractions / MK-1.3 Mixed Numbers / MK-1.4 Percents |
| number_ops | Number Operations | MK-2.1 Integers & Absolute Value / MK-2.2 Exponents & Roots / MK-2.3 Multiplication & Division Properties |
| algebra | Algebra | MK-3.1 Linear Equations / MK-3.2 Inequalities / MK-3.3 Systems of Equations / MK-3.4 Functions & Patterns |
| polynomials | Polynomials | MK-4.1 Operations / MK-4.2 Factoring / MK-4.3 Quadratic Equations |
| geometry_adv | Geometry | MK-5.1 Lines & Angles / MK-5.2 Triangles & Pythagorean Theorem / MK-5.3 Circles / MK-5.4 Coordinate Geometry |
| probability | Probability & Statistics | MK-6.1 Probability / MK-6.2 Mean, Median & Mode |

### PC — Paragraph Comprehension (color: accent/cyan)

| Topic key | Nombre | Subtopics |
|---|---|---|
| main_idea | Main Idea | Stated Main Idea / Implied Main Idea / Title Selection |
| details | Supporting Details | Explicit Details / Sequence of Events / Comparison |
| inference | Inference | Drawing Conclusions / Making Predictions / Author's Implication |
| vocab_context | Vocabulary in Context | Word Meaning from Context / Figurative Language |
| purpose | Author's Purpose | Purpose / Tone & Mood / Bias & Point of View |

---

## 6. Módulos

| Tab | ID panel | Función | Estado |
|---|---|---|---|
| Taxonomía | `panel-taxonomy` | Define y edita la jerarquía section → topic → subtopic → lección | Activo |
| Editor | `panel-editor` | Organiza, edita y mueve preguntas. Vista de árbol + cards. Toggle modo lista compacta por lección. | Activo |
| Generador | `panel-generator` | Crea preguntas manual o en batch JSON. Cola de generación. Import directo sin cola cuando no hay conflictos. Batch tolerante a errores parciales. | Activo |
| Traducciones | `panel-translations` | Completa `_translation` y `_question_es` por keyword (WK). Tab oculto en nav (`display:none`) — funcionalidad accesible vía panel inline en Editor (`trInlinePanel`). | Oculto en nav |
| Exportar | `panel-export` | Exportación por sección (JSON) + category-config + ZIP vía `quickExportAll()`. Indicador de sync export vs deploy. Dirty flag pulse pasivo. | Activo |

---

## 7. Flujo de trabajo estándar

```
1. Cargar banco base ({sec}.json) → Cargar LESSON_META (category-config.js)
2. Definir/editar taxonomía en Tab Taxonomía
3. Generar preguntas en Tab Generador (manual o batch)
   - Sin conflictos → import directo (saltea cola)
   - Con cola → agregar a bandeja → editor
   - IDs existentes → update integrado con semáforo de cambio
4. Revisar y editar en Tab Editor
   - Traducciones WK → panel inline trInlinePanel (banner en Editor)
5. Exportar vía ⚡ Export rápido (quickExportAll) → ZIP completo
```

---

## 8. Sistema de IDs de preguntas

| Formato | Descripción |
|---|---|
| `[SEC]-X.Y-LXX-QNNN` | Canónico v1.1 — función `genCanonicalId(lessonKey)` |
| `[SECTION]-[LESSON_KEY]-[NNN]` | Canónico legacy — misma función |
| `[SECTION]-[NNN]` | Legacy — función `genId_legacy(section)` |

Validaciones: sin duplicados, formato correcto, pertenencia a lección correcta.

---

## 9. Exportación — archivos generados

| Archivo | Contenido | Función | Flujo |
|---|---|---|---|
| `{sec}.json` | Array plano de preguntas por sección | `exportQuestionsBySection()` | **Principal** |
| `questions.manifest.json` | Hash SHA-256 + version + url por sección | `exportQuestionsBySection()` | **Principal** |
| `{sec}.js` | category-config por sección | `exportCategoryConfigBySection()` | Principal |
| `index.js` | Re-export de compatibilidad | `exportCategoryConfigBySection()` | Principal |
| `category-config.js` | LESSON_META + TAXONOMY monolítico | `exportCategoryConfig()` | Legacy |
| `questions.json` | Array plano monolítico | `exportQuestionsJS()` | Legacy |
| ZIP | Estructura htdocs completa | `quickExportAll()` | **Punto de entrada único** |

> `exportZIP()` es alias de `quickExportAll()` — un único punto de entrada público para generar ZIP.
> Gate pre-export (`runPreExportGate`): valida IDs duplicados, preguntas inválidas, y emite reporte crítico/warnings antes de permitir descarga.

---

## 10. Backlog

| Tipo | Contadores |
|---|---|
| P | 30 |
| T | 251 |
| R | 29 |
| B | 16 |

**Ítems pendientes activos: 0** — backlog en cero al cierre de S-06.

---

## 11. Sprints

| Sprint | Estado | Foco |
|---|---|---|
| S-01 | Cerrado | Taxonomía AFQT + generador + export por sección + banco WK y AR (Foundations + Fractions) |
| S-02 | Cerrado | Banco AR completo (AR-2 a AR-5) + banco MK completo |
| S-03 | Cerrado | Banco MK completo (MK-0 a MK-6) |
| Banco-de-PC | Cerrado | Banco PC completo (PC-0 a PC-5) — 2325+ preguntas |
| S-04 | Cerrado | ExportTaxRefactor — refactor tab Export + tab Taxonomía + nav |
| S-05 | Cerrado | UX Polish I — microinteracciones effort 1 |
| S-06 | Cerrado | UX Polish II — features effort 2-3 con dependencias |

---

## 12. Decisiones

| Fecha | Decisión | Contexto |
|---|---|---|
| 2026-04-18 | CM es single-file HTML app | Arquitectura existente confirmada en V7.13.4.1 |
| 2026-04-18 | Taxonomía AFQT completa definida en código (4 secciones) | WK, AR, MK, PC con topics y subtopics documentados |
| 2026-04-18 | IDs de preguntas siguen formato canónico `[SEC]-X.Y-LXX-QNNN` | `genCanonicalId()` es la función oficial |
| 2026-04-21 | Persistencia migrada de localStorage a IndexedDB | `CM_IDB` wrapper con fallback a localStorage |
| 2026-04-21 | Export por sección (JSON) es el flujo principal | Monolito `questions.js` degradado a legacy |
| 2026-04-21 | Batch JSON detecta IDs existentes y ofrece update integrado | Semáforo 🟢🟡🔴 por score Levenshtein |
| 2026-04-21 | WK-1.3 eliminado de la taxonomía activa | Desde arquitectura curricular v2.4 |
| 2026-04-21 | `correct_index` es el campo canónico (no `correct`) | `correct` es alias legacy |
| 2026-04-21 | AR Taxonomía actualizada a v1.0 | 6 topics: Foundations / Fractions / Percentages / Basic Algebra / Geometry Applied / Applied Reasoning |
| 2026-04-23 | Banco MK completo — S-03 cerrado | 16 subtemas MK generados e importados al CM |
| 2026-04-23 | Banco PC completo — sprint Banco-de-PC cerrado | PC-0 a PC-5 completos, 2325+ preguntas |
| 2026-04-23 | exportZIP() absorbida en quickExportAll() | Un único punto de entrada público para generar ZIP |
| 2026-04-23 | Tab Traducciones oculto en nav | Funcionalidad movida a panel inline en Editor (trInlinePanel) |
| 2026-04-23 | Modo lista compacta en Editor | Toggle por lección — `_compactLessons[lessonKey]` |
| 2026-04-23 | Import directo en Generador batch | Saltea cola cuando no hay conflictos ni IDs existentes |
| 2026-04-23 | Batch tolerante a errores parciales | Válidas a cola, inválidas listadas con error — no bloquea |
| 2026-04-23 | Indicador sync export vs deploy | Compara hash export vs `asvab_cm_v7_last_deploy_hash` en localStorage |
| 2026-04-23 | Dirty flag pulse pasivo en Export | Pulsa cada 30s si lleva 5+ min sin exportar |
| 2026-04-23 | Log de acciones recientes en footer | Últimas 5 acciones significativas, desaparece al cerrar CM |
| 2026-04-23 | S-04, S-05 y S-06 cerrados — backlog en cero | Estado al 2026-04-24 |

---

## 13. Notas de sesión

**2026-04-18 — Sesión fundacional con Orion**
- CONTEXT-CM creado desde lectura directa del código `content-manager_V7_13_4_1.html`
- Taxonomía AFQT completa extraída del objeto `TAXONOMY` en el código
- Module Map creado en paralelo

**2026-04-21 — Actualización a V7.13.4.12 con Kai**
- Persistencia migrada a IndexedDB
- Export por sección como flujo principal
- Banco AR-0 + AR-1 completo
- Banco WK-1.1 y WK-1.2 con IDs migrados a v2.7
- Batch update integrado en Generador completado

**2026-04-23 — Sesión de planificación con Orion**
- Banco MK y PC completos cerrados
- Sprint S-04 ExportTaxRefactor definido y ejecutado
- S-05 y S-06 UX Polish ejecutados
- Backlog limpiado a cero

**2026-04-24 — Actualización de CONTEXT con Orion**
- CONTEXT actualizado a V0.4 desde lectura directa de `content-manager_V7_13_4_21.html` + backlog v3.1.0.0
- Versión activa confirmada: V7.13.4.21
- MK taxonomy expandida a taxonomía completa (7 topics, consistente con Sage V1.3)
- Próximo paso: definir trabajo nuevo o handoff a ASVAB App

**2026-05-06 — Estandarización de headers con Rune**
- Headers de sección estandarizados (T-202605-497)
- Holding actualizado de `Obsidiana` a `Obsidian Labs`
- Roles actualizados: Orion/Kai reemplazados por Cael/Rune en tabla de roles
- Sección `## 14. Commands` agregada

---

## 14. Commands

El CM es una single-file HTML app — no tiene build step ni servidor de desarrollo. Los comandos relevantes son los del sistema de archivos y la exportación interna.

| Comando | Descripción |
|---|---|
| Abrir `content-manager_V7_13_4_21.html` en browser | Inicia el CM — no requiere servidor |
| `quickExportAll()` en consola | Genera y descarga el ZIP completo con todos los archivos de exportación |
| `exportQuestionsBySection()` en consola | Exporta `{sec}.json` + `questions.manifest.json` por sección |
| `exportCategoryConfigBySection()` en consola | Exporta los slices JS por sección (`{sec}.js` + `index.js`) |

> No hay `npm`, `vite`, ni comandos de terminal para el CM. La interfaz gráfica es el punto de entrada primario. Las funciones de consola son acceso directo para debugging o exportación forzada.
