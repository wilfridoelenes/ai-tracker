// [PP] mod:1 · autor:Rune · 2026-08-27 UTC-6
// TKT-202608-477 (REQ-202608-198, TKT4 de "Partir parsePaste()/_processIngestBatch() en
// unidades de responsabilidad única"): módulo nuevo — _BATCH_META_SIDE_EFFECTS/
// _applyBatchMetaSideEffects(m, ctx) migran aquí desde locus-session-parse.js (mod:219→220).
// Solo el mecanismo de registro/aplicación se mueve — ninguno de los 5 side effects
// individuales (retro_evaluated_sprint/learning_log_evaluated_through_ts/checkpoint_flow/
// sessionRegister/trackerLegacyItems) fue reescrito: mismo orden relativo, mismas
// precondiciones (`when`), mismos `run`. _onApplyBatch() permanece en locus-session-parse.js
// (closure interna de _processIngestBatch, sin moverse) e invoca _applyBatchMetaSideEffects(m,
// ctx) desde aquí vía import cross-módulo, con el mismo ctx explícito de siempre
// ({id, activeProj, batchMergeResult, tgItems, patchItems} — ver _sideEffectCtx en
// locus-session-parse.js). _applyRetroEvaluatedSprint()/_applyLearningLogEvaluated()/
// _resolveBatchFlowSprintId()/_batchParseFilesField() permanecen en locus-session-parse.js
// (side effects individuales, no el mecanismo — fuera del "no_incluye" del TKT) y se importan
// aquí. sessionRegister también consume metas[i] tal como lo construye _extractCkptMeta()
// (locus-ingest-meta.js, TKT-202608-475) — contexto/duration/docsVerified/tensionsResolved/
// ckptProyecto/pending/archivosRaw, verificados contra ese archivo real, no asumidos. Ciclo ESM
// de 2 nodos con locus-session-parse.js — seguro, ningún símbolo se evalúa en
// top-level de ninguno de los dos módulos, mismo patrón ya vigente entre
// locus-ingest-builder.js/locus-ingest-meta.js/locus-ingest-preview.js ↔
// locus-session-parse.js. El gate "No incluye block count" (_updateIngestBlockCount() nunca
// fue side effect de _onApplyBatch, vive en _routeParse()) y el gate de status/hora del worker
// (mod:179/180 de locus-session-parse.js, fuera del forEach, gateado por id) permanecen
// exactamente donde están documentados en _Locus-module-contracts mod:203 — este TKT no los
// reclasifica ni los mueve.
//
// sessionRegister/trackerLegacyItems reproducen los mismos algoritmos que
// _doApplyMergeAndFinish() (locus-session-save.js, flujo single) aplica a newSess/tracker.items
// — mismo shape de campos, mismo criterio de mutación, sin reinterpretación. Ver
// _Locus-module-contracts mod:204/mod:211 para el detalle de paridad single↔batch.

import { getAI, getActiveSprints, _mutateSessions, saveCheckpointFlow } from './locus-storage.js';
import {
  _applyRetroEvaluatedSprint,
  _applyLearningLogEvaluated,
  _resolveBatchFlowSprintId,
  _batchParseFilesField
} from './locus-session-parse.js';

// TKT-202608-439 (REQ-202608-179): array declarativo — un side effect nuevo se agrega como
// entrada nueva aquí, no como línea suelta en el forEach de _onApplyBatch
// (locus-session-parse.js). Orden relativo original: retro_evaluated_sprint (mod:185) →
// learning_log_evaluated_through_ts (mod:199/201) → checkpoint_flow (mod:196) →
// sessionRegister (CHG-202608-003, mod:204) → trackerLegacyItems (CHG-202608-005, mod:211).
export const _BATCH_META_SIDE_EFFECTS = [
  {
    name: 'retro_evaluated_sprint',
    when: m => !!m.retroEvaluatedSprint,
    run:  (m) => { _applyRetroEvaluatedSprint(m.retroEvaluatedSprint); }
  },
  {
    name: 'learning_log_evaluated_through_ts',
    when: m => !!m.learningLogEvaluatedThroughTs,
    run:  (m, ctx) => { _applyLearningLogEvaluated(ctx.activeProj && ctx.activeProj.id, m.learningLogEvaluatedThroughTs); }
  },
  {
    name: 'checkpoint_flow',
    when: m => !!m.resumen,
    // Mismo shape de argumentos que saveCheckpointFlow() en _doApplyMergeAndFinish()
    // (locus-session-save.js) — projectId/sprintId/title/role/summary/blockers/learning/decision.
    // sprintId resuelto por bloque vía _resolveBatchFlowSprintId(m.idx, ctx.batchMergeResult) —
    // el flujo single resuelve sobre mergeResult completo (un solo CHECKPOINT); el batch
    // necesita el filtro por idx porque batchMergeResult mezcla ítems de todos los bloques.
    run: (m, ctx) => {
      saveCheckpointFlow({
        projectId: ctx.activeProj && ctx.activeProj.id,
        sprintId:  _resolveBatchFlowSprintId(m.idx, ctx.batchMergeResult),
        title:     m.titulo   || '',
        role:      m.rol      || '',
        summary:   m.resumen  || '',
        blockers:  m.bloqueantes || 'n/a',
        learning:  m.aprendizaje || 'n/a',
        decision:  m.decision    || 'n/a'
      });
    }
  },
  {
    // CHG-202608-003 (parent/triggered_by INC-202608-138): construye y persiste una sesión por
    // bloque calificado del batch — mismo shape de campos que newSess() (locus-session-save.js
    // L708-746). Atribución simplificada a ctx.id (Worker que abrió el modal) — sin mecanismo
    // de resolución de Worker por `role` de bloque (getAI() solo resuelve por id). durationMs
    // siempre 0 — sin timer interactivo dentro de un paste múltiple. ctx.lastSessionId se
    // resetea a null por meta al inicio de este run — trackerLegacyItems (abajo) lo usa para no
    // heredar el sessionId del bloque anterior cuando este side effect no calificó.
    name: 'sessionRegister',
    when: m => !!m.resumen,
    run: (m, ctx) => {
      ctx.lastSessionId = null;
      const _ai = getAI(ctx.id);
      if (!_ai || !ctx.activeProj) return;
      const _now = new Date();
      const _dateShort = _now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      const _dateFull = _now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
                         _now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const _trackerRefs = (ctx.tgItems || [])
        .filter(it => it && it.idx === m.idx && it.code)
        .map(it => it.code);
      const _sprintId = _resolveBatchFlowSprintId(m.idx, ctx.batchMergeResult) ||
        ((getActiveSprints() || []).find(sp => sp.status === 'active') || {}).id || '';
      // Campos de m verificados contra _extractCkptMeta() (locus-ingest-meta.js real, mod:1) —
      // el objeto metas[i] sí expone contexto/duration/docsVerified/tensionsResolved/
      // ckptProyecto/pending/archivosRaw, no solo titulo/resumen/rol/docUpdates/inlineFixes/
      // finnRelease como se había asumido antes de ver ese archivo. files = m.archivosRaw
      // (string crudo, mismo mapeo que newSess() en locus-session-save.js — AC1 de
      // locus-ingest-meta.js). archivos (array estructurado) = _batchParseFilesField(m.archivosRaw)
      // — mismo helper que locus-ingest-meta.js documenta como el consumidor previsto de
      // archivosRaw para este propósito. pending siempre '' — mismo estado inerte que el path
      // single (gap documentado en locus-ingest-meta.js, no introducido aquí). nextStep usa
      // m.proximoPaso — mismo campo que locus-backlog-merge.js usa como fallback final de la
      // línea "Siguiente" (precedencia nextStep > nextRole > proximoPaso, AC4-6 de ese archivo);
      // m.nextStep/m.nextRole son los campos de precedencia superior, no equivalentes a
      // newSess.nextStep del flujo single — se usa proximoPaso por ser el campo con semántica
      // más cercana al `nextStep` plano que newSess() espera.
      const _newSessBatch = {
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
        aiId: ctx.id,
        title: m.titulo || '', summary: m.resumen || '', files: m.archivosRaw || '',
        pending: m.pending || '', tags: [],
        nextStep: m.proximoPaso || '',
        trackerRefs: _trackerRefs,
        ckptProyecto: m.ckptProyecto || '',
        decision:    m.decision    || '',
        contexto:    m.contexto    || '',
        bloqueantes: m.bloqueantes || '',
        aprendizaje: m.aprendizaje || '',
        duration:         m.duration         || '',
        docsVerified:     m.docsVerified      || '',
        tensionsResolved: m.tensionsResolved  || '',
        finnObservations: m.finnObservations  || null,
        rol:      m.rol      || '',
        archivos: _batchParseFilesField(m.archivosRaw || ''),
        sprintId: _sprintId,
        hasDocUpdates: Array.isArray(m.docUpdates) && m.docUpdates.length > 0,
        resetAt: '',
        sessionGroupId: 'sg-' + Date.now(),
        durationMs: 0,
        dateShort: _dateShort, date: _dateFull
      };
      _mutateSessions(ctx.activeProj, 'add', _newSessBatch);
      ctx.lastSessionId = _newSessBatch.id;
      ctx.sessionsRegistered = (ctx.sessionsRegistered || 0) + 1;
    }
  },
  {
    // CHG-202608-005 (triggered_by INC-202608-140): réplica del algoritmo de mutación de
    // activeProj.tracker.items en _doApplyMergeAndFinish() (locus-session-save.js L903-926) —
    // mismo push de ítem nuevo / update de desc·status·sessionId sobre ítem existente por code,
    // mismo avance de tracker.counters[TYPE], mismo regex de 6 tipos. Filtra ctx.tgItems por
    // it.idx === m.idx — el batch mezcla ítems de todos los bloques en el mismo array, a
    // diferencia del single (un solo CHECKPOINT). sessionId toma ctx.lastSessionId (escrito por
    // sessionRegister arriba, reseteado a null por meta) — nunca ctx.id, que es el Worker, no la
    // sesión. No requiere que sessionRegister haya calificado en el mismo bloque: un bloque sin
    // m.resumen no registra sesión pero puede seguir calificando aquí con sessionId ''.
    name: 'trackerLegacyItems',
    // Sin gate propio en m — a diferencia de sessionRegister (m.resumen), este side effect
    // corre para cualquier bloque con ítems calificados en ctx.tgItems (filtro por idx dentro
    // de run). Un bloque sin m.resumen no registra sesión pero puede seguir calificando aquí
    // con sessionId '' — mismo criterio documentado en _Locus-module-contracts mod:211.
    when: () => true,
    run: (m, ctx) => {
      if (!ctx.activeProj) return;
      if (!ctx.activeProj.tracker) {
        ctx.activeProj.tracker = { items: [], counters: { DISC: 0, TKT: 0, REQ: 0, INC: 0, PRB: 0, CHG: 0 } };
      }
      const tracker = ctx.activeProj.tracker;
      const _sessId = ctx.lastSessionId || '';
      const _blockItems = (ctx.tgItems || []).filter(it => it && it.idx === m.idx && it.code);
      if (!_blockItems.length) return;
      _blockItems.forEach(item => {
        const existing = tracker.items.find(x => x.code === item.code);
        if (existing) {
          existing.desc = item.desc; existing.status = item.status; existing.sessionId = _sessId;
        } else {
          const c = tracker.counters;
          const numMatch = item.code.match(/^(DISC|TKT|REQ|INC|PRB|CHG)-\d{6}-(\d{3})/);
          if (numMatch) { const num = parseInt(numMatch[2]); const key = numMatch[1]; if (num >= (c[key] || 0)) c[key] = num; }
          tracker.items.push({ id: 'tgi-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), code: item.code, desc: item.desc, status: item.status, sessionId: _sessId });
        }
      });
      ctx.trackerLegacyTouched = true;
    }
  }
];

export function _applyBatchMetaSideEffects(m, ctx) {
  if (!m || !ctx) return;
  _BATCH_META_SIDE_EFFECTS.forEach(effect => {
    if (effect.when(m)) effect.run(m, ctx);
  });
}
