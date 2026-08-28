// [PP] mod:1 · autor:Rune · 2026-08-27 UTC-6
// TKT-202608-475 (REQ-202608-198, TKT2 de "Partir parsePaste()/_processIngestBatch() en
// unidades de responsabilidad única"): construcción de meta de CHECKPOINT extraída de
// locus-session-parse.js — _extractCkptMeta() y su helper interno _ckptArchivosToNames().
// Ambas funciones puras, sin estado compartido, sin export previo en el archivo de origen.
// Consumidas por locus-session-parse.js vía import (flujo single, ai._parsed L2509 pre-refactor;
// flujo batch, _resolveCheckpointBatch L3996 pre-refactor). Ninguna otra dependencia — este
// módulo no importa nada de locus-session-parse.js, sin riesgo de ciclo ESM.

// TKT-202607-172 (REQ-202607-058 · AC2/AC3): campos nuevos — 13avo/14avo del objeto (antes
//   11, contract_detail declara 13). Consumidos por locus-backlog-merge.js con precedencia
//   nextStep > nextRole > proximoPaso para la línea "Siguiente" (AC4-6, ese archivo).
export function _extractCkptMeta(ckpt) {
  const _c = ckpt || {};
  return {
    resumen:          _c.resumen     || '',
    aprendizaje:      _c.aprendizaje || '',
    bloqueantes:      _c.bloqueantes || '',
    decision:         _c.decision    || '',
    proximoPaso:      _c.proximoPaso || '',
    nextStep:         _c.nextStepRaw || '',
    nextRole:         _c.nextRoleRaw || '',
    docUpdates:       _c._isJsonFormat ? (_c._rawDocUpdates || [])        : [],
    finnObservations: _c._isJsonFormat ? (_c._rawFinnObservations || null) : null,
    finnRelease:      _c._isJsonFormat ? (_c._rawFinnRelease || null)      : null,
    retroEvaluatedSprint: _c._isJsonFormat ? (_c._rawRetroEvaluatedSprint || null) : null, // TKT-202608-377
    learningLogEvaluatedThroughTs: _c._isJsonFormat ? (_c._rawLearningLogEvaluatedThroughTs || null) : null, // TKT-202608-424
    inlineFixes:      _c._isJsonFormat ? (_c._inlineFixes || [])          : [], // TKT1 (REQ CAEL-0727-01 · ref_id CAEL-0727-02)
    // TKT-202607-185 (REQ-202607-069 · origen DISC-202607-060): campo `archivosNombres` agregado —
    //   deriva de ckpt.archivos (string de nivel-sesión, campo Archivos: del CHECKPOINT, formato
    //   "nombre · mod:N · autor:X | nombre2 · mod:N · autor:Y") — NO del campo `archivos`
    //   por-ítem de TKT/REQ individual (array, BR-Ecosystem §8), que vive en items[] y no en el
    //   ckpt de nivel raíz. Sin precedente de parseo de este string en el archivo antes de este
    //   TKT — ckpt.archivos se guardaba crudo y nunca se descomponía en partes.
    //   Nombre `archivosNombres` (no `archivos`) — decisión de Cael tras detectar que el flujo
    //   batch (_resolveCheckpointBatch, spread directo de esta función) y el flujo single
    //   (ai._parsed, ya con un `archivos` crudo preexistente de T-202606-070) quedaban con dos
    //   nombres distintos para el mismo dato. Se unifica aquí, en la fuente compartida, en vez de
    //   en cada call site — evita que un tercer flujo futuro reintroduzca la inconsistencia.
    archivosNombres:  _ckptArchivosToNames(_c.archivos),
    draft:            _c.draft === true,
    draftRaw:         _c.draftRaw,
    rol:              _c.rol    || '',
    titulo:           _c.titulo || '',
    // CHG-202608-003 (parent INC-202608-138, AC2): 6 campos que _doSaveSession() lee de
    // `parsed` (locus-session-save.js L717-724) y que este objeto nunca exponía — contexto,
    // duration, docsVerified, tensionsResolved, ckptProyecto vienen de campos reales del ckpt
    // JSON (_c.context→contexto, _c.duration, _c.docsVerified, _c.tensionsResolved,
    // _c.proyecto→ckptProyecto — mismo mapeo ya usado en ai._parsed).
    // `pending` es la excepción: no existe ningún campo `pending`/`ckpt.pending` en todo el
    // archivo de origen — ai._parsed.pending tampoco se popula en el flujo single (grep
    // confirmado, sin AC de ese CHG que lo cubra) — se agrega en '' para igualar el mismo
    // estado inerte del path single, sin fingir una fuente que no existe. Gap pre-existente,
    // fuera de scope.
    contexto:         _c.contexto || '',
    duration:         _c.duration || '',
    docsVerified:     _c.docsVerified || '',
    tensionsResolved: _c.tensionsResolved || '',
    ckptProyecto:     _c.proyecto || '',
    pending:          '',
    // AC1: newSess.files = parsed.files, y parsed.files === ckpt.archivos (string crudo) —
    // distinto de archivosNombres (ya parseado a solo nombres, arriba). Se expone crudo aquí
    // para que sessionRegister pueda reproducir tanto `files` (string) como `archivos` (array
    // estructurado, vía _batchParseFilesField en locus-session-parse.js) igual que newSess().
    archivosRaw:      _c.archivos || ''
  };
}

// TKT-202607-185 (REQ-202607-069): parsea el string ckpt.archivos ("x.js · mod:3 · autor:Rune |
//   y.css · mod:2 · autor:Nova") a un array de solo nombres de archivo, para el chip
//   .diff-chip--files de #mdiff-summary-chips. Separador de segmentos '|', separador de
//   metadata dentro de cada segmento '·' — se conserva solo lo previo al primer '·'.
//   Función pura, sin estado compartido — mismo criterio que _extractCkptMeta (AC1).
function _ckptArchivosToNames(rawArchivos) {
  if (!rawArchivos || typeof rawArchivos !== 'string') return [];
  return rawArchivos
    .split('|')
    .map(seg => seg.split('·')[0].trim())
    .filter(name => name.length > 0);
}
