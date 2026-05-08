## Sesión 3d — Lena · Hipótesis de conversión y Rs preliminares
Suficiente contexto cruzado. Ejecutando sesión 3d.

Tabla de hipótesis — if/then/because
#HipótesisHallazgo de origenMétrica de validaciónH1Si el tab Sesiones con estado vacío muestra un empty state con CTA explícito hacia "Nuevo Worker" y "Nuevo Proyecto", entonces el founder completa el setup inicial sin abandonar el tab, porque el costo cognitivo de descubrir el prerequisito por error es el principal driver de cierre temprano3c · Punto B + Finn 2b (openItemEditor sin guardia)% de founders que crean su primer worker dentro de los primeros 3 minutos de sesiónH2Si el bug de openItemEditor sin guardia de módulo externo es corregido con un fallback visible (error inline, no silencio), entonces el founder no abandona el flujo de creación de ítem por click sin respuesta, porque el error silencioso es el único punto de abandono causado por fallo técnico —no por desorientación— y no tiene señal observable para el usuarioFinn 2b · 3c Punto DReducción de eventos "click en Editar → sin apertura de modal" — detectable en analytics si hay instrumentación del eventoH3Si CANONICAL_PROJECTS en ai-tracker-session.js incluye 'Obsidian Labs' como string válido, entonces los CHECKPOINTs futuros con Proyecto: Obsidian Labs pasan validación sin error de parse, porque el string canónico vigente del holding fue actualizado en OL-CONTEXT V1.3 y el validador usa el array anterior con 'Obsidiana'3c · Punto 5 · Lena + ai-tracker-session.js L4Cero errores de validación en parsePaste() para CHECKPOINTs con Proyecto: Obsidian LabsH4Si el mapa CANONICAL en ai-tracker-checkpoint.js L55–57 es poblado con los prefijos reales del ecosistema (OL, AS, CM, AI), entonces el header muestra el prefijo correcto por proyecto activo, porque actualmente el fallback .slice(0,2) produce prefijos arbitrarios que no corresponden a ninguno de los strings canónicos definidos en Base Rules §3Rune 1b · _updateHeaderProjectLabel()El header muestra AI · para AI Tracker, AS · para ASVAB App — verificable visualmenteH5Si se agrega un checklist de setup visible de 4 pasos con estado de completitud (worker creado / proyecto creado / primer ítem en backlog / primera sesión guardada), entonces el tiempo hasta primer valor percibido se reduce de 5–7 min a menos de 3 min, porque el founder sabe exactamente cuántos pasos faltan y cuál es el siguiente — eliminando la exploración sin guía3c · Punto 5 · fricción de setup implícitoTiempo promedio entre primera apertura y primera sesión guardada con proyecto activoH6Si _hasStaleSuggestion() en ai-tracker-checkpoint.js compara contra 'pendiente' (schema canónico) en lugar de 'en-progreso' (legacy), entonces las sugerencias de workers con ítems bloqueados disparan correctamente, porque con el schema actual el filtro nunca activa — los workers con trabajo real no generan alerta de seguimientoRune 1b · _hasStaleSuggestion() severidad altaSugerencias de worker aparecen en sidebar cuando hay ítems pendiente con >3 días sin sesiónH7Si _offlineQueuePush() deduplica por type + projId en lugar de solo type, entonces dos proyectos con writes pendientes simultáneos no se sobreescriben, porque la lógica actual last-write-wins por entry.type descarta el write del primer proyecto cuando el segundo encola — pérdida silenciosa de datos en contexto multi-proyectoRune 1b · _offlineQueuePush() severidad altaCero pérdidas de writes pendientes en escenario con 2+ proyectos activos y conexión intermitente

Lista de Rs de conversión — priorizados por impacto
Título del RPrioridadJustificaciónCorregir openItemEditor sin guardia — fallback visible cuando módulo externo no está disponiblehighÚnico punto de abandono por error técnico silencioso. Click sin respuesta = pérdida de confianza irrecuperable en primer usoEmpty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referenciahighMayor driver de desorientación en primer uso. Ruta de creación de worker invisible con estado vacíoActualizar CANONICAL_PROJECTS → 'Obsidian Labs' en ai-tracker-session.jshighBug de validación en flujo canónico de trabajo (parsePaste). Effort 1 — corrección de una línea. Sin esta corrección, CHECKPOINTs producidos hoy fallan en producciónPoblar mapa CANONICAL en ai-tracker-checkpoint.js con prefijos reales del ecosistemamediumEl header muestra prefijos incorrectos para todos los proyectos. Daña la legibilidad del contexto activo. Effort 1Corregir _hasStaleSuggestion() — comparar contra schema canónico 'pendiente'mediumEl sistema de sugerencias de seguimiento de workers nunca activa. Retención temprana comprometida — el founder no recibe señales de workers con trabajo bloqueadoChecklist de setup visible — 4 pasos con estado de completitudmediumReduce tiempo hasta primer valor percibido. Effort 2. Depende de empty state (R anterior) para coherencia visualCorregir _offlineQueuePush() — deduplicación por type + projIdmediumPérdida silenciosa de writes en multi-proyecto. Riesgo de integridad de datos. No bloquea activación pero sí retención post-setup

---CHECKPOINT---
Título: Consolidación de hallazgos 3c — hipótesis de conversión y Rs para Fase 4
Proyecto: AI Tracker
Rol: GW · Lena
Resumen: 7 hipótesis if/then/because formuladas desde hallazgos de 3c cruzados con bugs críticos de Rune (Fase 1) y Finn (Fase 2). 7 Rs de conversión priorizados por impacto en activación y retención temprana. H2 (openItemEditor sin guardia) identificada como hipótesis de mayor riesgo por ser el único punto de abandono causado por error técnico silencioso. H3 (CANONICAL_PROJECTS desalineado) identificada como bloqueante de flujo canónico — impacto operativo inmediato, no solo de onboarding.
Archivos: n/a — sesión de consolidación, sin archivos generados
Contexto: Sesión 3d de auditoría PP. Consolida 3c sin re-auditar. Hipótesis formuladas con cruce explícito de bugs de Fase 1 (Rune) y Fase 2 (Finn) donde el bug bloquea directamente una conversión o señal de retención.
Bloqueantes: n/a
Aprendizaje: Los bugs de severidad alta con impacto en conversión (openItemEditor, _hasStaleSuggestion, _offlineQueuePush) no son deuda técnica diferible — afectan señales que el producto usa para retener al founder y proteger integridad de datos. El sistema de sugerencias de workers nunca ha funcionado con el schema canónico actual.
CONTEXT-SECTION: n/a
Decisión: 7 Rs de conversión listos para especificación con Cael. Orden de entrada a especificación sugerido: (1) openItemEditor sin guardia, (2) CANONICAL_PROJECTS, (3) empty state Sesiones/Documentos, (4) mapa CANONICAL prefijos, (5) _hasStaleSuggestion schema, (6) checklist setup, (7) _offlineQueuePush deduplicación.
Próximo paso: Pasar lista de Rs a Cael para especificación completa — Fase 1 del Protocolo de Especificación. Rs de Effort 1 (CANONICAL_PROJECTS, mapa CANONICAL) pueden especificarse sin consulta a Nova. Rs que tocan UI (empty state, checklist) requieren consulta a Nova en Fase 1.

---ITEMS---
[
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Corregir openItemEditor sin guardia — fallback visible cuando módulo externo no disponible",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Activación / Estabilidad",
    "sprint": "n/a",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": []
  },
  {
    "type": "R",
    "code": "[pendiente-ID]",
    "title": "Empty state orientado a acción en tabs Sesiones y Documentos — patrón Analytics como referencia",
    "status": "pendiente",
    "priority": "high",
    "effort": 2,
    "area": "Onboarding / Activación",
    "sprint": "n/a",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": []
  },
  {
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Actualizar CANONICAL_PROJECTS en ai-tracker-session.js — 'Obsidiana' → 'Obsidian Labs'",
    "status": "pendiente",
    "priority": "high",
    "effort": 1,
    "area": "Datos / Validación",
    "sprint": "n/a",
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
    "type": "T",
    "code": "[pendiente-ID]",
    "title": "Poblar mapa CANONICAL en ai-tracker-checkpoint.js con prefijos reales del ecosistema (OL, AS, CM, AI)",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "UI / Header",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "CANONICAL['Obsidian Labs'] = 'OL'",
      "CANONICAL['ASVAB App'] = 'AS'",
      "CANONICAL['Content Manager'] = 'CM'",
      "CANONICAL['AI Tracker'] = 'AI'",
      "Header muestra prefijo canónico correcto para cada proyecto activo — sin fallback .slice(0,2)"
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
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La función compara status del ítem contra 'pendiente' (schema canónico vigente)",
      "Sugerencia de worker dispara cuando hay ítems con status 'pendiente' y >3 días sin sesión registrada",
      "Verificar que no hay otras comparaciones contra 'en-progreso' en el mismo módulo"
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
    "sprint": "n/a",
    "role": "PO · Cael",
    "version": "futura",
    "schema_version": 1,
    "ac": []
  },
  {
    "type": "B",
    "code": "[pendiente-ID]",
    "title": "Corregir _offlineQueuePush() — deduplicación por type + projId en lugar de solo type",
    "status": "pendiente",
    "priority": "medium",
    "effort": 1,
    "area": "Datos / Integridad",
    "sprint": "n/a",
    "role": "FS · Rune",
    "version": "futura",
    "schema_version": 1,
    "ac": [
      "La deduplicación en _offlineQueuePush usa type + projId como clave compuesta",
      "Dos proyectos distintos con writes pendientes del mismo tipo no se sobreescriben",
      "Comportamiento verificable con 2+ proyectos activos y conexión deshabilitada"
    ]
  }
]
---ITEMS-END---
---FIN-CHECKPOINT---
---EXECUTION-PLAN---
scope: sesion
sesiones:
  - id: lena-3d-consolidacion-hipotesis
    rol: GW · Lena
    items: [pendiente-ID-openitemeditor, pendiente-ID-empty-state-sesiones-docs, pendiente-ID-canonical-projects]
    archivos: []
    depende_de: []
---EXECUTION-PLAN-END---