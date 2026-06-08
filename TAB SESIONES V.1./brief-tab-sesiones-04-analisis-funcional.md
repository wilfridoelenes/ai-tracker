# Brief · Tab Sesiones · Etapa 4 — Análisis Funcional
<!-- Proyecto: Locus · Rol: UX · Nova + PO · Cael · Generado: 2026-06-08 -->
<!-- Contexto: resultado de sesiones de análisis estructural + auditoría de deuda del Tab Sesiones -->

---

## Objetivo de la etapa

Mapear la lógica JS del Tab Sesiones módulo por módulo — qué hace cada uno, qué expone, de qué depende. El objetivo es tener un mapa funcional completo que sirva de base para el rediseño (Etapa 5) y para futuras sesiones de especificación de Cael.

Archivos requeridos para esta sesión:
- `locus-sesiones.js`
- `locus-sesiones-arranque.js`
- `locus-sesiones-utils.js`
- `locus-sesiones-capture.js`
- `locus-sesiones-registry.js`
- `locus-sesiones-viz.js`
- `locus-session-parse.js`
- `locus-session-save.js`
- `locus-session-hora.js`
- `locus-session-popup.js`
- `locus-sesiones-stats.js`

---

## Módulos identificados — estado de conocimiento

### Módulos con análisis base (adjuntos en sesiones anteriores)

| Módulo | Responsabilidad declarada | Conocimiento actual |
|---|---|---|
| `locus-sesiones.js` | Render del tab, buildCard, _renderTrackerSidebar, render() | Parcial — visto hasta L1090 |
| `locus-sesiones-capture.js` | Quick Capture modal (stepper 2 pasos) + sesión interrumpida | Completo — 353 líneas leídas |
| `locus-sesiones-registry.js` | Registry de callbacks para desacoplar locus-sesiones ↔ locus-sprint-project | Completo — 22 líneas |
| `locus-sesiones-arranque.js` | Inicialización del tab | No leído en detalle |
| `locus-sesiones-utils.js` | Utilidades del tab | No leído en detalle |

### Módulos sin análisis (no adjuntos)

| Módulo | Responsabilidad probable | Prioridad de análisis |
|---|---|---|
| `locus-session-parse.js` | Parser de bloques CHECKPOINT — extracción de ítems, ITEMS, EXECUTION-PLAN | Alta — ownership de #item-viz-overlay sin confirmar |
| `locus-session-save.js` | Guardado de sesión post-parse | Alta — relacionado con item-viz |
| `locus-sesiones-viz.js` | Renderizado visual de sesiones en historial | Media |
| `locus-session-hora.js` | Lógica de hora de reset — `interpretHora`, `_horaUpdate` | Media — ya importado en capture |
| `locus-session-popup.js` | Popup de detalle de sesión | Media |
| `locus-sesiones-stats.js` | Stats del tab — `updateStats`, métricas de Workers | Media |

---

## Preguntas funcionales abiertas

Las siguientes preguntas surgieron en las sesiones de análisis y requieren lectura de código para responder:

### Flujo de ingesta de CHECKPOINT
1. ¿Qué módulo escucha el evento de paste en la textarea?
2. ¿Dónde se parsea el bloque `---ITEMS---`?
3. ¿Cómo se comunican parse → save → render tras un CHECKPOINT exitoso?
4. ¿`#item-viz-overlay` se activa desde `locus-session-parse.js` o desde `locus-session-save.js`?
5. ¿El DIFF que muestra `#ckpt-panel` se genera en parse o en save?

### Selección de Worker
6. ¿Qué variable mantiene el Worker seleccionado actualmente (`_trackerSelectedId`)?
7. ¿Cuándo se actualiza `tracker-mini-hist-panel` — al seleccionar Worker o al guardar sesión?
8. ¿El mini-hist muestra sesiones del Worker en todos los proyectos o solo en el proyecto activo?

### Estados de card
9. ¿Qué evento dispara la transición `available → insession`?
10. ¿El estado `interrupted-state` persiste en storage o solo en memoria de sesión?
11. ¿Cómo se comunica el ticker de countdown de `_startSidebarTicker` con el countdown dramático de la card?

### Registro de sesión rápida vs sesión con CHECKPOINT
12. ¿`quickCapture: true` cambia el flujo de guardado en `locus-session-save.js`?
13. ¿Las sesiones rápidas generan `sessionGroupId` propio siempre — o solo cuando no hay grupo activo?

---

## Mapa de dependencias — conocido hasta ahora

```
locus-sesiones.js
  ├── imports: locus-storage, locus-toast, locus-ui-shell, locus-workers
  ├── imports: locus-sesiones-registry (_sesSPCallbacks)
  └── exports: render, _markTrackerDirty, _stopSidebarTicker

locus-sesiones-capture.js
  ├── imports: locus-sprint-project (openProjPanel)
  ├── imports: locus-toast
  ├── imports: locus-modals (_gconfirmOpen)
  ├── imports: locus-session-hora (_horaUpdate, interpretHora)
  ├── imports: locus-storage (getAI, getActiveProject, save, saveImmediate)
  ├── imports: locus-ui-shell (esc)
  ├── imports: locus-workers (closeCardMenu)
  └── exports: openQuickCapture, closeQuickCapture, confirmInterruptInline

locus-sesiones-registry.js
  ├── sin dependencias
  └── exports: _sesSPCallbacks, _registerSesSPCallback
```

**Pendiente de mapear:** locus-session-parse, locus-session-save, locus-sesiones-viz, locus-sesiones-stats, locus-session-hora, locus-session-popup.

---

## Output esperado de la sesión

Al terminar la etapa, debe existir:

1. **Mapa funcional completo** — tabla de módulos con: responsabilidad, exports, imports, líneas aproximadas
2. **Flujo de ingesta documentado** — secuencia exacta de eventos desde paste hasta guardado
3. **Respuestas a las 13 preguntas abiertas**
4. **Identificación de acoplamiento alto** — módulos que deberían desacoplarse (candidatos a refactor en Etapa 3 si no se ejecutó antes)

---

## Notas para Nova y Cael

- Este análisis es prerequisito natural para el rediseño (Etapa 5) — no se puede rediseñar un flujo que no se entiende completamente
- Si el análisis identifica comportamientos no documentados en UX-ref → agregar a la lista de gaps de Etapa 2
- El mapa de dependencias completo puede revelar candidatos adicionales para el módulo-contracts de Locus
