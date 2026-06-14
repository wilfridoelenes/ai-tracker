// [PP] v0.1.0 · sprint:PP-S-01 · mod:54 · autor:Rune · 2026-06-13 UTC-6
// locus-session-parse.js
// Responsabilidad: parseCheckpoint, parsePaste, handlePaste/Input, parsePasteStandalone, saveStandaloneCheckpoint, parsePlanBlock, _tryIngestPlan, _tryIngestSprintProposal,
//   statusLabel, buildTGPreview, STATUS_LABELS, TG_PARSER_CONFIG.
// Dependencias: locus-storage.js · locus-toast.js · locus-session-hora.js

import { renderStats, getItems, normalizeStatus} from './locus-backlog-core.js';
import { _isPlaceholderCode, applyPatchesFromTG, _assignPendingIds } from './locus-backlog-item.js'; // T-202606-089 AC-3
import { showMergeDiffPanel } from './locus-backlog-merge.js';
import { renderBacklogList } from './locus-backlog-render.js';
import { _ctrMergeFromItem } from './locus-contracts.js';
import { extractContextSections, extractDocUpdates, extractHtmlMapSections, mergeContextSections, mergeHtmlMapSections, processDocUpdate } from './locus-docs.js';
import { showCheckpointPanel } from './locus-sesiones-viz.js';
import { _checkStorageQuota, _mergeBacklogWithProject, saveSession } from './locus-session-save.js'; // T-202606-032: saveSession para auto-trigger
import { loadPlan, renderPlan, savePlan } from './locus-sprint-plan.js';
import { _blogLog, _offlineQueuePush, getAI, getActiveProject, getActiveSprints, getActiveTracker, save, saveImmediate, LOCUS_KEYS, CANONICAL_PROJECTS, INFRA_VERSION_ACTIVE } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';



import { esc } from './locus-ui-shell.js';

// T-202606-012: _INFRA_VERSION_ACTIVE eliminada — importada como INFRA_VERSION_ACTIVE desde locus-storage.js

// T-202606-210: Set en memoria para detección de CHECKPOINTs duplicados en sesión activa.
// Scope: por carga de página (sesión activa del navegador). Se resetea con recarga.
const _processedCheckpointHashes = new Set();

// T-202604-215: Labels de status en español — fuente de verdad para UI
// Movido desde locus-checkpoint-hoy.js
export const STATUS_LABELS = {
  available:    'Disponible',
  exhausted:    'Agotada',
  insession:    'En curso',
  interrupted:  'Interrumpida'
};

const TG_PARSER_CONFIG = {
  TYPES: ['P', 'T', 'R', 'B'],
  TYPE_NAMES: { P: 'Ideas', T: 'Tickets', R: 'Requerimientos', B: 'Bugs' },
  STATUS_ALIASES: {
    'pendiente':'📤 Pendiente', '📤 pendiente':'📤 Pendiente',
    'backlog':'⏳ Backlog', '⏳ backlog':'⏳ Backlog',
    'done':'✅ DONE', '✅ done':'✅ DONE', 'listo':'✅ DONE',
    'en progreso':'🔄 En progreso', '🔄 en progreso':'🔄 En progreso',
    'in-progress':'🔄 En progreso', 'progreso':'🔄 En progreso',
    'descartado':'🗑 Descartado', '🗑 descartado':'🗑 Descartado',
    'en-revision':'🔍 En revisión', 'en_revision':'🔍 En revisión', 'en revisión':'🔍 En revisión',
    'promovida':'🔁 Promovida', '🔁 promovida':'🔁 Promovida'                // T-202606-023 AC1+AC2
  }
};

function statusLabel(raw) {
  if (!raw) return '📤 Pendiente';
  const key = raw.trim().toLowerCase();
  const resolved = TG_PARSER_CONFIG.STATUS_ALIASES[key];
  if (!resolved) {
    console.warn('[AI Tracker] statusLabel: status desconocido "' + raw.trim() + '" — usando "📤 Pendiente"');
    return '📤 Pendiente';
  }
  return resolved;
}

// T-202606-002: _canonicalStatus es ahora wrapper de normalizeStatus (locus-backlog-core.js).
// Preserva semántica de rechazo estricto: retorna null para valores desconocidos.
// normalizeStatus retorna 'pendiente' para desconocidos — wrapper detecta ese caso
// comparando el raw original contra la lista de entradas conocidas.
// T-202606-018: 'promovida' con type T/R/B → null (rechazo bloqueante en validación).
// Casos especiales no cubiertos por normalizeStatus:
//   'histórico' (con acento) → mapear a 'historico' antes de delegar
//   'listo' → alias de 'done' (usado en TG_PARSER_CONFIG)
//   'promovida' con type≠P → null (normalizeStatus devuelve 'pendiente' — override requerido)
const _KNOWN_STATUS_INPUTS = new Set([
  'done', 'en-revision', 'en_revision', 'en revisión', 'en-revisión',
  'descartado', 'historico', 'histórico', 'pendiente', 'promovida',
  'listo',
  'bloqueado', // T-202606-031: válido solo para R — validación de rol en parsePaste
  'orphaned', // T-202606-017: válido solo para R — sin Ts válidos
]);
function _canonicalStatus(raw, type) {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!_KNOWN_STATUS_INPUTS.has(s)) return null; // valor desconocido — rechazo estricto
  // Casos que normalizeStatus no cubre directamente
  if (s === 'listo') return 'done';
  if (s === 'histórico') return 'historico';
  if (s === 'promovida' && type !== 'P') return null; // T-202606-018
  if (s === 'bloqueado') return type === 'R' ? 'bloqueado' : null; // T-202606-031: solo válido para R
  if (s === 'orphaned') return type === 'R' ? 'orphaned' : null; // T-202606-017: solo válido para R
  return normalizeStatus(raw, type) || null;
}

function buildTGPreview(items, discrepancy) {
  if (!items.length && !discrepancy) return '';
  let html = `<div class="preview-tg">
    <div class="preview-tg-header">
      <div class="preview-tg-header-label">📋 Items detectados</div>
      <div class="preview-tg-header-count">${items.length} ítem${items.length !== 1 ? 's' : ''}</div>
    </div>`;
  if (discrepancy) {
    html += `<div class="preview-tg-discrepancy">
      ⚠ ${discrepancy.raw} línea${discrepancy.raw !== 1 ? 's' : ''} en el texto — solo ${discrepancy.parsed} parseada${discrepancy.parsed !== 1 ? 's' : ''}. Verifica el formato de las líneas no detectadas.
    </div>`;
  }
  html += `<div class="preview-tg-badges-row">`;
  TG_PARSER_CONFIG.TYPES.forEach(type => {
    const count = items.filter(x => x.type === type).length;
    if (count) html += `<span class="preview-tg-badge ${type}" title="${TG_PARSER_CONFIG.TYPE_NAMES[type]} (${count})">${type} ${count}</span>`;
  });
  html += `</div>`;
  items.forEach(item => {
    const existing = (getActiveTracker().items || []).find(x => x.code === item.code);
    const tag = existing
      ? `<span class="preview-tg-tag update">↑ actualizar</span>`
      : `<span class="preview-tg-tag new">+ nuevo</span>`;
    // T-202605-436 AC4: indicador visual para ítems nuevos sin AC
    const noAcTag = (!existing && (!item.ac || item.ac.length === 0))
      ? `<span class="preview-tg-tag preview-tg-tag--warn" title="Ítem nuevo sin criterios de aceptación">sin AC</span>`
      : '';
    // T-202606-106: badges --info para campos obligatorios ausentes en ítems nuevos
    const noNoIncluyeTag = (!existing && item.type === 'T' && (!item.no_incluye || item.no_incluye.length === 0))
      ? `<span class="preview-tg-tag preview-tg-tag--info" title="T nuevo sin campo no_incluye">sin no_incluye</span>`
      : '';
    const noIntencionTag = (!existing && item.type === 'R' && !item.intencion)
      ? `<span class="preview-tg-tag preview-tg-tag--info" title="R nuevo sin campo intencion">sin intencion</span>`
      : '';
    const noTriggeredByTag = (!existing && item.type === 'B' && !item.triggeredBy)
      ? `<span class="preview-tg-tag preview-tg-tag--info" title="B nuevo sin campo triggered_by">sin triggered_by</span>`
      : '';
    html += `<div class="preview-tg-row">
      <span class="preview-tg-badge ${item.type}">${item.type}</span>
      <span class="preview-tg-code">${esc(item.code)}</span>
      <span class="preview-tg-desc">${esc(item.title)}${tag}${noAcTag}${noNoIncluyeTag}${noIntencionTag}${noTriggeredByTag}</span>
      <span class="preview-tg-status">${esc(item.status)}</span>
    </div>`;
  });
  html += `</div>`;
  return html;
}

// R-202604-037: tabla canónica de proyectos del ecosistema — declarada en locus-storage.js
// La validación en parsePaste() es case-sensitive: 'Locus' es válido, 'locus' no.
// OL-CONTEXT §7: strings canónicos — 'Obsidiana'/'Obsidiana Labs' deprecados · 'ASVAB App' deprecado (→ 'Alisto') · 'AI Tracker' deprecado (→ 'Locus')
// R-202605-002: CANONICAL_PROJECTS consumida desde locus-storage.js — sin declaración local

// R-202605-063: Levenshtein simple para sugerencia de string canónico
function _levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function _suggestCanonical(raw) {
  let best = null, bestDist = Infinity;
  CANONICAL_PROJECTS.forEach(p => {
    const d = _levenshtein(raw.toLowerCase(), p.toLowerCase());
    if (d < bestDist) { bestDist = d; best = p; }
  });
  return { suggestion: best, distance: bestDist };
}

// T-202606-039: extrae bloques inline_fix del texto crudo del CHECKPOINT (formato Markdown legacy).
// Retorna array de { descripcion, archivo, triggered_by } — vacío si no hay bloques.
// Un CHECKPOINT puede tener múltiples bloques inline_fix consecutivos — todos se indexan como array.
// Formato esperado (por bloque):
//   inline_fix:
//     descripcion: [texto]
//     archivo: [nombre]
//     triggered_by: [código]
function _parseInlineFixes(text) {
  if (!text || !text.includes('inline_fix:')) return [];
  const fixes = [];
  // Detectar cada bloque inline_fix: con sus campos anidados (indentados con espacios o tabs)
  // Captura desde "inline_fix:" hasta la siguiente línea no indentada o fin de texto
  const blockRe = /^inline_fix:\s*\n((?:[ \t]+.+\n?)+)/gm;
  let match;
  while ((match = blockRe.exec(text)) !== null) {
    const body = match[1];
    const descM      = body.match(/^\s+descripcion\s*:\s*(.+)$/m);
    const archivoM   = body.match(/^\s+archivo\s*:\s*(.+)$/m);
    const triggeredM = body.match(/^\s+triggered_by\s*:\s*(.+)$/m);
    // Solo indexar si tiene al menos descripcion y triggered_by (campos mínimos útiles para trazabilidad)
    if (descM && triggeredM) {
      fixes.push({
        descripcion:  descM[1].trim(),
        archivo:      archivoM ? archivoM[1].trim() : '',
        triggered_by: triggeredM[1].trim()
      });
    }
  }
  return fixes;
}

// T-202606-005: parseCheckpoint — path único JSON puro (fence sin especificador de lenguaje)
// Path único: bloque ``` { ... } ``` sin especificador de lenguaje con schema completo
export function parseCheckpoint(text) {
  // ── Path único: JSON puro ─────────────────────────────────────────────────────
  // Detectar bloque ``` { ... } ``` sin especificador de lenguaje
  // T-202606-055: anclar detección al inicio del texto — evita falso positivo con bloques
  // embebidos en campos de texto (doc_updates, ejemplos en ---ITEMS---).
  // Solo activa el path JSON cuando el bloque ``` es el primer contenido del texto.
  // T-202606-019: anclar match al inicio — evita captura prematura por ``` en doc_updates.content
  const _jsonFenceMatch = /^\s*```(?:json)?\s*\{/.test(text) ? text.match(/^\s*```(?:json)?\s*(\{[\s\S]*?\})\s*```/) : null;
  if (_jsonFenceMatch) {
    let _parsed = null;
    let _jsonErr = null;
    try {
      _parsed = JSON.parse(_jsonFenceMatch[1].trim());
    } catch (e) {
      _jsonErr = e.message || 'JSON inválido';
    }
    if (_jsonErr || !_parsed || typeof _parsed !== 'object' || Array.isArray(_parsed)) {
      // JSON detectado pero inválido — devolver resultado con error marcado
      return {
        titulo: '', proyecto: '', rol: '', resumen: '', archivos: '',
        pItems: '', tItems: '', rItems: '', bItems: '',
        estado: '', decision: '', proximoPaso: '',
        contexto: '', bloqueantes: '', aprendizaje: '',
        isCheckpoint: true,
        _jsonParseError: _jsonErr || 'El bloque ```json no contiene un objeto válido',
        rawCounts: { P: 0, T: 0, R: 0, B: 0 }
      };
    }
    // JSON válido — extraer campos del schema R-202605-133
    const items = Array.isArray(_parsed.items) ? _parsed.items : [];
    // Clasificar ítems por tipo para rawCounts (compatibilidad con preview)
    const _countByType = (t) => items.filter(i => i.type === t).length;
    // Serializar items de vuelta a texto para compatibilidad con buildTGPreview
    // pItems/tItems/rItems/bItems no se usan como fuente de datos — solo para display
    const _typedLines = (t) => items
      .filter(i => i.type === t)
      .map(i => `${i.code}: ${i.title || i.desc || ''}`)
      .join('\n');
    // T-202606-039: extraer inline_fix(es) del schema JSON — debe ser array
    // T1-parser-validaciones: objeto singular rechazado con DocLog canónico — no normalizar
    const _inlineFixRaw = _parsed.inline_fix || _parsed.inline_fixes || null;
    let _inlineFixes = [];
    if (_inlineFixRaw !== null && _inlineFixRaw !== undefined) {
      if (Array.isArray(_inlineFixRaw)) {
        _inlineFixes = _inlineFixRaw;
      } else {
        // objeto singular — rechazar, no normalizar
        _blogLog('inline-fix-objeto-singular', '', 'inline_fix debe ser array — objeto singular no válido', 'backlog');
        // _inlineFixes queda [] — no se indexa
      }
    }
    // T-202606-017: extraer doc_updates — array de objetos DOC-UPDATE del schema JSON
    const _rawDocUpdates = Array.isArray(_parsed.doc_updates) ? _parsed.doc_updates : [];
    // T-202606-017: extraer sprint_proposal — objeto del schema JSON (null si ausente)
    // T-202606-034-2f: sprint_proposal: null → tratar como ausente (falsy — ya cubierto por &&)
    // T-202606-079: sprint_proposal: {} (objeto vacío) → tratar como ausente, sin advertencia DocLog
    //   Entrada: sprint_proposal: {}; Salida: _rawSprintProposal = null, sin Step 0, sin advertencia
    const _rawSprintProposalCandidate = (_parsed.sprint_proposal !== null && _parsed.sprint_proposal !== undefined && typeof _parsed.sprint_proposal === 'object' && !Array.isArray(_parsed.sprint_proposal))
      ? _parsed.sprint_proposal
      : null;
    const _rawSprintProposal = (_rawSprintProposalCandidate && Object.keys(_rawSprintProposalCandidate).length > 0)
      ? _rawSprintProposalCandidate
      : null;
    // T-202606-018: extraer finn_observations — array de objetos tipados (null si ausente o vacío)
    const _rawFinnObservations = Array.isArray(_parsed.finn_observations) && _parsed.finn_observations.length
      ? _parsed.finn_observations
      : null;
    // T-202606-018: extraer execution_plan — objeto {scope, sessions} (null si ausente)
    const _rawExecutionPlan = (_parsed.execution_plan && typeof _parsed.execution_plan === 'object' && !Array.isArray(_parsed.execution_plan))
      ? _parsed.execution_plan
      : null;
    return {
      titulo:       _parsed.title        || '',
      proyecto:     _parsed.project      || '',
      rol:          _parsed.role         || '',
      resumen:      _parsed.summary      || '',
      archivos:     _parsed.files        || '',
      pItems:       _typedLines('P'),
      tItems:       _typedLines('T'),
      rItems:       _typedLines('R'),
      bItems:       _typedLines('B'),
      estado:       '',
      decision:     _parsed.decision     || '',
      proximoPaso:  _parsed.next_step    || '',
      contexto:     _parsed.context      || '',
      bloqueantes:  _parsed.blockers     || '',
      aprendizaje:  _parsed.learning      || '',
      // T-202606-016: campos informativos adicionales del schema JSON
      duration:      _parsed.duration       || '',
      docsVerified:  _parsed.docs_verified  || '',
      tensionsResolved: _parsed.tensions_resolved || '',
      isCheckpoint: true,
      _isJsonFormat: true,
      _rawItems:        items,          // ítems ya parseados — parsePaste los usa directamente
      _inlineFixes,                     // T-202606-039: array de inline_fix extraídos del schema JSON
      _rawDocUpdates,                   // T-202606-017: array de doc_updates del schema JSON
      _rawSprintProposal,               // T-202606-017: objeto sprint_proposal del schema JSON (null si ausente)
      _rawFinnObservations,             // T-202606-018: array de finn_observations del schema JSON (null si ausente)
      _rawExecutionPlan,                // T-202606-018: objeto execution_plan del schema JSON (null si ausente)
      draft: _parsed.draft === true,    // T-202606-006: exponer draft para guard en parsePaste
      rawCounts: {
        P: _countByType('P'),
        T: _countByType('T'),
        R: _countByType('R'),
        B: _countByType('B'),
      }
    };
  }

  // Path alternativo: JSON puro sin fence — texto pegado desde botón copiar de Claude.ai
  // El botón copiar entrega el contenido del bloque sin los backticks del fence.
  const _trimmed = text.trim();
  if (_trimmed.startsWith('{') && _trimmed.endsWith('}')) {
    let _parsedRaw = null;
    let _jsonErrRaw = null;
    try { _parsedRaw = JSON.parse(_trimmed); } catch (e) { _jsonErrRaw = e.message; }
    if (!_jsonErrRaw && _parsedRaw && typeof _parsedRaw === 'object' && !Array.isArray(_parsedRaw) && _parsedRaw.title) {
      // Reusar path fence — reconstruir fence mínimo y re-invocar para evitar duplicación de lógica
      return parseCheckpoint('```\n' + _trimmed + '\n```');
    }
  }

  // T-202606-005: texto sin fence ``` → devolver null (no es CHECKPOINT)
  return null;
}

// T-202604-200: actualiza la mini barra de progreso 3 fases del card
// phase: 1=Pegar (inicial), 2=Confirmar (CHECKPOINT válido), 3=Guardar (sesión persistida)
export function _setPhase(id, phase) {
  const p1 = document.getElementById('phase-paste-'   + id);
  const p2 = document.getElementById('phase-confirm-' + id);
  const p3 = document.getElementById('phase-save-'    + id);
  if (!p1 || !p2 || !p3) return;
  p1.className = 'sc-step' + (phase === 1 ? ' active' : phase > 1 ? ' done' : '');
  p2.className = 'sc-step' + (phase === 2 ? ' active' : phase > 2 ? ' done' : '');
  p3.className = 'sc-step' + (phase === 3 ? ' done' : '');
  // aria-current
  [p1,p2,p3].forEach((p,i) => {
    if (phase === i+1) p.setAttribute('aria-current','step');
    else p.removeAttribute('aria-current');
  });
}

// R-202605-046: normalizar campo sprint al ingestar ítems
// Valores centinela -> delete item.sprint (campo ausente = canónico para "sin sprint")
// Sprint cerrado -> delete item.sprint + advertencia DocLog
// T-202606-036 AC3: T con parentId cuyo sprint difiere del parent -> usar sprint del parent + señal informativa
// T-202606-158: pendingItems — ítems del CHECKPOINT actual aún no persistidos.
// Permite heredar sprint del parent R cuando R y T vienen en el mismo CHECKPOINT.
export function _normalizeSprint(item, pendingItems) {
  const raw = item.sprint;
  // AC-1: centinelas → campo ausente
  if (!raw || raw === 'n/a' || raw === 'N/A' || String(raw).trim() === '') {
    delete item.sprint;
    return;
  }
  // AC-6: sprint cerrado → campo ausente + advertencia DocLog
  {
    const allSprints = getActiveSprints(); // B-202605-065: devuelve proj.sprints completo — abiertos y cerrados
    const sprintObj  = allSprints.find(s => s.id === raw);
    if (sprintObj && sprintObj.status === 'closed') {
      _blogLog('sprint-normalizado', item.code || '', `Sprint cerrado normalizado a campo ausente: ${raw}`, 'backlog');
      delete item.sprint;
      return;
    }
  }
  // T-202606-036 AC3 / T-202606-158: T con parentId — heredar sprint del parent si difiere.
  // Busca el parent primero en pendingItems (ítems del CHECKPOINT actual aún no persistidos)
  // y luego en getItems() (backlog persistido), para cubrir el caso en que R y T vienen en el mismo CHECKPOINT.
  // T-202606-015: guards AC4 (placeholder parentId), AC5 (parent inexistente + advertencia),
  //   y verificación de status active/programado antes de heredar (AC1).
  if (item.parentId && item.code && item.code[0] === 'T') {
    // AC-4: parentId placeholder → sin herencia automática
    if (_isPlaceholderCode(item.parentId)) return;
    const _allItems = getItems();
    const parent = (pendingItems && pendingItems.find(i => i.code === item.parentId)) ||
                   _allItems.find(i => i.code === item.parentId);
    if (parent) {
      const parentSprint = parent.sprint || '';
      if (raw !== parentSprint) {
        // AC-1: solo heredar si el sprint del parent está en estado active o programado.
        // Si parentSprint está vacío (icebox), la herencia aplica sin verificación de status (AC-2).
        // Si parentSprint apunta a un sprint cerrado, ya fue normalizado a campo ausente antes
        // de llegar aquí (bloque AC-6 líneas 409-416), por lo que parentSprint vacío = icebox (AC-3).
        if (parentSprint) {
          const _allSprints = getActiveSprints();
          const _parentSprintObj = _allSprints.find(s => s.id === parentSprint);
          if (_parentSprintObj && _parentSprintObj.status !== 'active' && _parentSprintObj.status !== 'programado') {
            // Sprint del parent no está en active ni programado — no heredar, dejar sprint del T sin modificar
            return;
          }
        }
        _blogLog('sprint-heredado', item.code, `${item.code} sprint ajustado al de su parent ${item.parentId}: ${parentSprint || '(sin sprint)'}`, 'backlog');
        if (parentSprint) {
          item.sprint = parentSprint;
        } else {
          delete item.sprint;
        }
        return;
      }
    } else {
      // AC-5: parent no encontrado en backlog ni en pendingItems — advertencia informativa en DocLog
      _blogLog('parent-no-encontrado', item.code, `${item.code} parent ${item.parentId} no encontrado en backlog — herencia no aplicada`, 'backlog');
    }
  }
  // AC-5: sprint válido — conservar sin modificar
  // T-202606-085 AC-4: sprint_id no coincidente con ningún sprint registrado → advertencia DocLog, ítem se aplica igual
  {
    const _allSprints = getActiveSprints();
    const _found = _allSprints.find(s => s.id === raw);
    if (!_found) {
      _blogLog('sprint-id-no-registrado', item.code || '', `sprint_id "${raw}" no coincide con ningún sprint registrado — ítem aplicado igual`, 'backlog');
    }
  }
}

// T-202606-085: resolver campos sprint_id y sprint_name desde un ítem raw del CHECKPOINT.
// Acepta tres formatos de entrada:
//   (a) sprint_id + sprint_name separados (formato nuevo)
//   (b) sprint como string compuesto legacy 'PP-S-01 · Nombre' → descompone en sprint_id + sprint_name
//   (c) sprint: 'icebox' → sprint_id: 'icebox', sprint_name: ''
// Devuelve { sprintAlias, sprint_id, sprint_name } donde sprintAlias es el valor para item.sprint
// (compatibilidad con _normalizeSprint que sigue operando sobre item.sprint).
function _resolveSprintFields(it) {
  // Formato (a): campos separados presentes — tienen precedencia
  if (it.sprint_id !== undefined) {
    const _id   = String(it.sprint_id  || '').trim();
    const _name = String(it.sprint_name || '').trim();
    return { sprintAlias: _id || undefined, sprint_id: _id, sprint_name: _name };
  }
  // Formato (b)/(c): solo campo sprint
  const raw = it.sprint;
  if (!raw || String(raw).trim() === '' || raw === 'n/a' || raw === 'N/A') {
    return { sprintAlias: undefined, sprint_id: '', sprint_name: '' };
  }
  const _rawStr = String(raw).trim();
  const _idx = _rawStr.indexOf(' · ');
  if (_idx !== -1) {
    // Formato compuesto legacy: 'PP-S-01 · Nombre'
    const _id   = _rawStr.slice(0, _idx).trim();
    const _name = _rawStr.slice(_idx + 3).trim();
    return { sprintAlias: _id, sprint_id: _id, sprint_name: _name };
  }
  // Valor simple: 'icebox' u otro sprint_id sin nombre
  return { sprintAlias: _rawStr, sprint_id: _rawStr, sprint_name: '' };
}

// B-202606-022: resolver [tmp:slug] en campo parent/parentId de un patch contra tgItems del mismo CHECKPOINT.
// Llama antes de acumular el patch en _patchItems_${id}.
export function parsePaste(id) {
  const ta = document.getElementById('ta-' + id);
  const text = ta ? ta.value : '';
  const ai = getAI(id); // B-202606-017: declarado al inicio de parsePaste — disponible en todos los branches (incluido el else de texto vacío, línea ~729)
  if (!ai) return;
  // T-202606-005: detectar CHECKPOINT via fence (con o sin especificador json) o JSON puro sin fence
  const isCheckpoint = /^\s*```(?:json)?\s*\{/.test(text) || (text.trim().startsWith('{') && text.trim().endsWith('}'));

  let title = '', summary = '', files = '', nextStep = '', bloqueantesRaw = '', tgItems = [], ckpt = null;
  if (isCheckpoint) {
    ckpt = parseCheckpoint(text);
    title = ckpt.titulo;
    summary = ckpt.resumen;
    files = ckpt.archivos;
    nextStep = ckpt.proximoPaso;
    bloqueantesRaw = ckpt.bloqueantes || '';

    // T-202606-006: guard draft:true — bloquear ingesta antes de cualquier validación de ítems
    // AC-4: evaluado antes de _jsonParseError y _isJsonFormat — entrada: JSON con draft:true → bloqueo inmediato
    // AC-1: parsePaste no ejecuta ningún path de ingesta — tgItems queda vacío
    // AC-2: error visible al founder con mensaje canónico
    // AC-3: draft ausente o false → sin efecto
    if (ckpt.draft === true) {
      window[`_itemsJsonError_${id}`] = 'Borrador detectado — pegar CHECKPOINT final emitido por Finn';
      // AC-3: toast visible al founder con texto canónico
      showToast('warn', 'Borrador detectado — pegar CHECKPOINT final emitido por Finn');
      // tgItems ya es [] — no se modifica
      // No continuar con ningún path de ingesta
    }
    // R-202605-133: si parseCheckpoint detectó error en el bloque ```json, marcar error bloqueante
    else if (ckpt._jsonParseError) {
      window[`_itemsJsonError_${id}`] = ckpt._jsonParseError;
    }
    // R-202605-133: si el CHECKPOINT es JSON puro, los ítems ya están en ckpt._rawItems — no buscar ---getItems()---
    else if (ckpt._isJsonFormat) {
      delete window[`_itemsJsonError_${id}`];
      const _rawItems = Array.isArray(ckpt._rawItems) ? ckpt._rawItems : [];
      const _validTypes    = ['P', 'T', 'R', 'B'];
      const _validStatuses = ['done', 'pendiente', 'descartado', 'en-revision'];
      const ckptHeaderRole = ckpt.rol || '';
      let _itemError = null;
      const _rsNoAc = []; // T-202606-030 fix AC-3: acumular Rs sin AC — no hacer break en el primero
      for (let _i = 0; _i < _rawItems.length; _i++) {
        const _it = _rawItems[_i];
        // R-202605-062: patch — instrucción de operación, no tipo de ítem
        if (_it.type === 'patch') {
          if (!_it.code || _isPlaceholderCode(_it.code)) {
            // AC-7: patch sobre código placeholder → ignorar + advertencia DocLog
            _blogLog('patch-ignorado', _it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (_it.code || '(vacío)'), 'backlog');
            // T-202606-055 AC-1: toast visible al founder — el _blogLog solo no es suficiente
            showToast('warn', `Patch descartado: código placeholder no patcheable — ${_it.code || '(vacío)'}. Usa el código real asignado por Locus.`);
          } else {
            // T-202606-080: validación de rol para patch con status: bloqueado sobre R
            // AC-1: si status normalizado es 'bloqueado' y el ítem target en backlog es type R,
            //       verificar que ckptHeaderRole === 'QA · Finn' antes de acumular
            // AC-2: al fallar → _blogLog con mensaje canónico + patch descartado
            // AC-3: patch autorizado ('QA · Finn') → acumular normalmente sin advertencia
            // AC-4: patches con status distinto a bloqueado → flujo normal sin modificar
            const _patchNormSt = _it.status ? _canonicalStatus(_it.status, 'R') : null;
            if (_patchNormSt === 'bloqueado') {
              const _patchTarget = (getItems() || []).find(x => x.code === _it.code);
              if (_patchTarget && _patchTarget.type === 'R') {
                const _patchAuthorizedRole = 'QA · Finn';
                if (ckptHeaderRole !== _patchAuthorizedRole) {
                  _blogLog(
                    'rol-no-autorizado-bloqueado',
                    _it.code,
                    `Transición bloqueado en R ${_it.code} rechazada: solo Finn puede mover un R a bloqueado. Origen: ${ckpt ? (ckpt.titulo || '') : ''}`,
                    'backlog'
                  );
                  continue; // AC-2: patch descartado — no acumular en _patchItems
                }
              }
            }
            window[`_patchItems_${id}`] = window[`_patchItems_${id}`] || [];
            window[`_patchItems_${id}`].push(_it);
          }
          continue;
        }
        if (!_it.type || !_it.code || !_it.status) {
          _itemError = `Ítem [${_i}]: faltan campos obligatorios (type, code, status). Recibido: ${JSON.stringify(_it)}`;
          break;
        }
        if (!_validTypes.includes(_it.type)) {
          _itemError = `Ítem [${_i}]: type inválido "${_it.type}". Valores válidos: P · T · R · B`;
          break;
        }
        // T2-parser-validaciones: status 'historico' no es emitible en CHECKPOINT — asignado exclusivamente por Locus al cerrar sprint
        // Aplica a todos los tipos (R, T, B, P) — campo status ignorado, ítem omitido, resto del CHECKPOINT continúa
        if (_it.status && (_it.status.trim().toLowerCase() === 'historico' || _it.status.trim().toLowerCase() === 'histórico')) {
          _blogLog(
            'status-historico-emitido',
            _it.code || '[pendiente-ID]',
            `Status "historico" no es emitible — asignado exclusivamente por Locus al cerrar sprint`,
            'backlog'
          );
          continue; // ítem omitido — resto del CHECKPOINT continúa
        }
        // R-202605-023: normalizar antes de validar — acepta variantes de en-revision y otros
        const _normSt = _canonicalStatus(_it.status, _it.type);
        if (!_normSt || (!_validStatuses.includes(_normSt) && _normSt !== 'promovida' && _normSt !== 'bloqueado')) {
          _itemError = `Ítem [${_i}]: status inválido "${_it.status}". Valores válidos: done · pendiente · descartado · en-revision${_it.type === 'P' ? ' · promovida' : ''}${_it.type === 'R' ? ' · bloqueado' : ''}`;
          break;
        }
        // T-202606-035: bloqueo icebox + en-revision — BR-Ecosystem §5
        // T-202606-012 AC-3: sprint ausente se trata como icebox
        // T-202606-085: leer sprint_id como fallback cuando sprint no está presente (formato nuevo)
        const _sprintRaw = (_it.sprint || _it.sprint_id || '').trim().toLowerCase();
        if (_normSt === 'en-revision' && (_sprintRaw === 'icebox' || _sprintRaw === '')) {
          _itemError = `CHECKPOINT bloqueado: ${_it.code || '[pendiente-ID]'} tiene status en-revision con sprint: icebox. Asignar sprint antes de continuar.`;
          break;
        }
        // T-202606-031: validación de rol autorizado para transición R → bloqueado
        // AC-1: solo 'QA · Finn' puede emitir R con status bloqueado
        // AC-2: al fallar → advertencia en DocLog con mensaje canónico + omitir cambio de status
        // AC-3: otros cambios del CHECKPOINT continúan aplicándose (continue, no break)
        // AC-4: misma validación aplica a ítem R completo (no solo patch) con status: bloqueado
        if (_it.type === 'R' && _normSt === 'bloqueado') {
          const _authorizedRole = 'QA · Finn';
          if (ckptHeaderRole !== _authorizedRole) {
            _blogLog(
              'rol-no-autorizado-bloqueado',
              _it.code || '[pendiente-ID]',
              `Transición bloqueado en R ${_it.code || '[pendiente-ID]'} rechazada: solo Finn puede mover un R a bloqueado. Origen: ${ckpt ? (ckpt.titulo || '') : ''}`,
              'backlog'
            );
            continue; // AC-2+AC-3: omitir este ítem — resto del CHECKPOINT continúa
          }
        }
        // T-202606-030: bloqueo R sin AC — BR-Ecosystem §5 + BR-Core §8 regla dura
        // AC-1: R con ac ausente o vacío → acumular en _rsNoAc (AC-3: no break — seguir loop)
        // AC-2: mensaje canónico con título del R + Origen: [título del CHECKPOINT]
        // AC-3: acumular todos los Rs sin AC — emitir mensaje consolidado al final del loop
        if (_it.type === 'R' && (!Array.isArray(_it.ac) || _it.ac.length === 0)) {
          _rsNoAc.push(`R ${_it.code || '[pendiente-ID]'} "${_it.title || _it.desc || ''}"`);
          continue;
        }
        // T3-parser-validaciones: bloqueo B sin comportamiento_actual — BR-Ecosystem §5 schema de B
        // AC-1: B sin campo comportamiento_actual o con string vacío → _itemError bloqueante, no aplica ítem
        // AC-2: valor literal de excepción aceptado sin alerta
        // AC-3: aplica a Bs nuevos ([pendiente-ID]/[tmp:slug]) y a patches con status sobre Bs existentes
        //   — pero los patches ya se manejan en el branch 'patch' arriba; aquí solo Bs completos
        if (_it.type === 'B') {
          const _comportamiento = (_it.comportamiento_actual || '').trim();
          const _EXCEPCION = 'no observado directamente — síntoma reportado por founder';
          if (!_comportamiento || (_comportamiento.toLowerCase() !== _EXCEPCION)) {
            if (!_comportamiento) {
              _itemError = `B ${_it.code || '[pendiente-ID]'} sin comportamiento_actual — campo obligatorio. Adjuntar CHECKPOINT corregido.`;
              break;
            }
          }
        }
        // T-202606-085: resolver sprint_id y sprint_name antes de construir el ítem
        const _sprintF = _resolveSprintFields(_it);
        tgItems.push({
          type:          _it.type,
          code:          _it.code,
          title:         _it.title  || _it.desc  || '',
          desc:          _it.title  || _it.desc  || '',
          priority:      _it.priority || 'medium',                             // T-202606-031
          status:        _normSt,
          _noStatus:     false,
          effort:        _it.effort != null ? (parseInt(_it.effort) || null) : null,
          area:          _it.area   || '',
          sprint:        _sprintF.sprintAlias,                                 // T-202606-085: alias → _normalizeSprint opera sobre este campo
          sprint_id:     _sprintF.sprint_id,                                   // T-202606-085
          sprint_name:   _sprintF.sprint_name,                                 // T-202606-085
          ac:            Array.isArray(_it.ac) ? _it.ac : [],
          role:          _it.role   || ckptHeaderRole,
          discardReason: _it.discard_reason || _it.reason || '',
          discardRef:    _it.ref    || '',
          blockedBy:     Array.isArray(_it.blockedBy) ? _it.blockedBy : [],
          parentId:      _it.parentId || _it.parent || null,  // B-202605-055: schema usa "parent", campo interno es "parentId"
          origin:        _it.origin   || null,  // R-202605-004: trazabilidad de ítems derivados
          dependsOn:     Array.isArray(_it.depends_on) ? _it.depends_on : [],  // T-202605-139
          triggeredBy:   _it.triggered_by  || null,                            // T-202605-139
          origenP:       _it.origen_p      || null,                            // T-202605-139
          promovida_a:   _it.promovida_a   || null,                            // T-202605-139
          intencion:     _it.intencion     || null,                            // T-202606-105
          no_incluye:    Array.isArray(_it.no_incluye) ? _it.no_incluye : [], // T-202606-105
          schema_version: _it.schema_version || null                          // T-202606-105
        });
        // R-202605-046: normalizar sprint a campo ausente si es centinela o sprint cerrado
        // T-202606-158: pasar tgItems para heredar sprint de parent R en mismo CHECKPOINT
        _normalizeSprint(tgItems[tgItems.length - 1], tgItems);
        // T-202606-008: alerta DocLog si T tiene contract_update: 'sí' y doc_updates ausente o vacío
        // AC-1: extraer campo contract_update del ítem T
        // AC-2: si valor es 'sí' y _rawDocUpdates está vacío → entrada en DocLog
        // AC-3: si doc_updates tiene al menos una entrada → sin alerta
        // AC-4: valores 'no' y 'n/a' no activan verificación
        // AC-5: ingesta continúa en ambos casos — no es bloqueo
        if (_it.type === 'T' && (_it.contract_update || '').toLowerCase() === 'sí') {
          const _hasDocUpdates = Array.isArray(ckpt._rawDocUpdates) && ckpt._rawDocUpdates.length > 0;
          if (!_hasDocUpdates) {
            _blogLog(
              'contract-update-sin-doc-update',
              _it.code || '[pendiente-ID]',
              `contract_update declarado sí — DOC-UPDATE de module-contracts ausente en CHECKPOINT ${ckpt.titulo || ''}`,
              'backlog'
            );
          }
        }

        // T-202606-018: advertencia si P tiene status promovida sin promovida_a
        if (_it.type === 'P' && _normSt === 'promovida' && !_it.promovida_a) {
          _blogLog('promovida-sin-ref', _it.code || '[pendiente-ID]', 'P ' + (_it.code || '[pendiente-ID]') + ' con status promovida sin campo promovida_a — trazabilidad incompleta', 'backlog');
        }
        // T-202606-014: advertencia si depends_on contiene [pendiente-ID] literal con 2+ ítems nuevos en el CHECKPOINT
        if (Array.isArray(_it.depends_on) && _it.depends_on.includes('[pendiente-ID]')) {
          const _newItemCount = _rawItems.filter(i => i.type !== 'patch' && _isPlaceholderCode(i.code || '')).length;
          if (_newItemCount >= 2) {
            _blogLog('dep-placeholder-ambiguo', _it.code || '[pendiente-ID]', (_it.code || '[pendiente-ID]') + ' depends_on contiene [pendiente-ID] no resoluble — usar [tmp:slug] para referencias cruzadas.', 'backlog');
          }
        }
      }
      // T-202606-030 fix AC-2+AC-3: emitir _itemError consolidado si hay Rs sin AC
      // Origen: título del CHECKPOINT — disponible en ckpt.titulo
      if (!_itemError && _rsNoAc.length > 0) {
        const _ckptOrigen = ckpt.titulo || '';
        _itemError = `CHECKPOINT bloqueado: ${_rsNoAc.join(' · ')} no tiene${_rsNoAc.length !== 1 ? 'n' : ''} AC de coherencia de conjunto. Origen: ${_ckptOrigen}. Adjuntar CHECKPOINT corregido antes de continuar.`;
      }
      if (_itemError) {
        window[`_itemsJsonError_${id}`] = _itemError;
        tgItems = [];
        delete window[`_patchItems_${id}`];
      } else {
        _rawItems.forEach(it => { if (it.contract) _ctrMergeFromItem(it.code || '[pendiente-ID]', it.contract); });
        // T-202606-010 AC-7: llamar processDocUpdate por cada entrada de doc_updates antes de finalizar ingesta.
        // AC-7b: si retorna conflicto:true → toast visible pero ingesta continúa normalmente (no bloquea).
        if (Array.isArray(ckpt._rawDocUpdates) && ckpt._rawDocUpdates.length > 0) {
          const _ckptTitleForDu = ckpt.titulo || '';
          ckpt._rawDocUpdates.forEach(du => {
            const { conflicto, msg } = processDocUpdate(du, _ckptTitleForDu);
            if (conflicto && msg) showToast('warn', msg);
          });
        }
      }
    }
  }

  // T-202606-039: extraer inline_fix del CHECKPOINT — path JSON usa ckpt._inlineFixes,
  // path legacy usa _parseInlineFixes sobre el texto crudo.
  const _inlineFixes = (ckpt && ckpt._isJsonFormat)
    ? (ckpt._inlineFixes || [])
    : (isCheckpoint ? _parseInlineFixes(text) : []);

  const _pendingPatches = window[`_patchItems_${id}`] || [];
  delete window[`_patchItems_${id}`];
  ai._parsed = { title, summary, files, tgItems, patchItems: _pendingPatches, isCheckpoint, nextStep, ckptProyecto: ckpt ? (ckpt.proyecto || '') : '', inlineFixes: _inlineFixes,
    // T-202606-016: campos informativos adicionales
    duration:         ckpt ? (ckpt.duration         || '') : '',
    docsVerified:     ckpt ? (ckpt.docsVerified      || '') : '',
    tensionsResolved: ckpt ? (ckpt.tensionsResolved  || '') : '',
    // T-202606-017: doc_updates y sprint_proposal — path JSON puro
    docUpdates:       (ckpt && ckpt._isJsonFormat) ? (ckpt._rawDocUpdates   || []) : [],
    sprintProposal:   (ckpt && ckpt._isJsonFormat) ? (ckpt._rawSprintProposal || null) : null,
    // T-202606-018: finn_observations y execution_plan — path JSON puro
    finnObservations: (ckpt && ckpt._isJsonFormat) ? (ckpt._rawFinnObservations || null) : null,
    executionPlan:    (ckpt && ckpt._isJsonFormat) ? (ckpt._rawExecutionPlan    || null) : null,
    // T-202606-070: persistir rol y archivos del CHECKPOINT — ambos paths JSON y legacy
    rol:      ckpt ? (ckpt.rol      || '') : '',
    archivos: ckpt ? (ckpt.archivos || '') : '',
    // T-202606-013: propagar draft a ai._parsed — necesario para guard secundario en _doApplyMergeAndFinish
    draft: ckpt ? (ckpt.draft === true) : false,
    // T-202606-072: detectar devolución Finn→Cael — presente solo cuando rol comienza con 'QA' y texto contiene patrón
    ...(() => {
      const _rol = ckpt ? (ckpt.rol || '') : '';
      if (!_rol.startsWith('QA')) return {};
      const _hasDev = /pasar a cael|devolver a cael/i.test(text);
      return { devolucion_cael: _hasDev };
    })(),
  };

  // Calcular discrepancia raw vs parseado
  let rawTotal = 0, parsedTotal = tgItems.length;
  if (isCheckpoint && ckpt && ckpt.rawCounts) {
    rawTotal = Object.values(ckpt.rawCounts).reduce((a, b) => a + b, 0);
  }
  const _discrepancy = rawTotal > 0 && rawTotal !== parsedTotal ? { raw: rawTotal, parsed: parsedTotal } : null;

  const cc = document.getElementById('cc-' + id);
  if (cc) {
    const len = text.length;
    cc.textContent = len > 0 ? `${len} caracteres` : '';
    cc.className = len > 2000 ? 'char-counter warn' : 'char-counter';
  }

  // T-088: feedback visual paste-wrap según validez del checkpoint
  const wrap = ta ? ta.closest('.paste-wrap') : null;
  if (wrap) {
    if (isCheckpoint && title) {
      wrap.classList.add('paste-wrap--valid');
    } else {
      wrap.classList.remove('paste-wrap--valid');
    }
  }
  // T-202604-200: fase 2 si CHECKPOINT válido con título, fase 1 si no
  _setPhase(id, (isCheckpoint && title) ? 2 : 1);

  const draftKey = LOCUS_KEYS.DRAFT_KEY_PREFIX + id;
  if (text.trim()) {
    try {
      localStorage.setItem(draftKey, text);
    } catch (e) {
      // B-202605-NNN: QuotaExceededError — storage lleno. El draft no se guarda
      // pero el render del preview continúa sin interrupciones.
      _checkStorageQuota();
    }
    // R-3: persistir borrador en Supabase con debounce para no saturar en cada keystroke
    clearTimeout(window['_draftSbTimer_' + id]);
    window['_draftSbTimer_' + id] = setTimeout(() => {
      if (typeof _supabase !== 'undefined' && _supabase && typeof _supabaseUser !== 'undefined' && _supabaseUser) {
        const savedText = localStorage.getItem(draftKey);
        if (savedText) {
          _supabase.from('tracker_docs').upsert(
            [{ user_id: _supabaseUser.id, key: draftKey, value: { text: savedText, savedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }],
            { onConflict: 'user_id,key' }
          ).then(({ error }) => {
            if (error) _offlineQueuePush({ type: 'draft', aiId: id });
          });
        }
      }
    }, 3000); // 3s debounce — no escribe en cada keystroke
    const dot = document.getElementById('draft-' + id);
    if (dot) dot.className = 'draft-dot visible';
  } else {
    localStorage.removeItem(draftKey);
    const dot = document.getElementById('draft-' + id);
    if (dot) dot.className = 'draft-dot';
    if (wrap) wrap.classList.remove('paste-wrap--valid');
    // B-202604-195: reset completo al vaciar el textarea
    // Limpiar errores JSON, flags de warning no bloqueante y toast activo
    delete window[`_itemsJsonError_${id}`];
    delete window[`_noItemsWarnSeen_${id}`];
    delete window[`_rolFieldWarnSeen_${id}`];
    delete window[`_doneNoAcWarnSeen_${id}`];
    delete window[`_discrepancyWarnSeen_${id}`];
    if (typeof dismissToast === 'function') dismissToast();
    // Resetear preview, botón y ta-has-items al estado inicial
    const _prevEl = document.getElementById('prev-' + id);
    if (_prevEl) { _prevEl.className = 'preview'; _prevEl.innerHTML = ''; }
    const _btnEl = document.getElementById('sbtn-' + id);
    if (_btnEl) { _btnEl.disabled = true; _btnEl.className = 'sc-save'; }
    const _taEl = document.getElementById('ta-' + id);
    if (_taEl) _taEl.classList.remove('ta-has-items');
    ai._parsed = { title: '', summary: '', files: '', tgItems: [], isCheckpoint: false, nextStep: '', ckptProyecto: '' };
    return;
  }

  const btn = document.getElementById('sbtn-' + id);
  const prev = document.getElementById('prev-' + id);
  if (text.trim()) {
    // T-202606-005: gate de validación — presencia de field 'title' + JSON válido
    // ---FIN-CHECKPOINT--- no requerido · path legacy eliminado
    const _isJsonFmt = !!(ckpt && ckpt._isJsonFormat);
    // T-202605-435: CHECKPOINT de transición — si campo WIP: presente y Resumen: ausente,
    // inferir summary como 'WIP' para no bloquear la validación.
    const hasWip = /^\s*WIP\s*:/mi.test(text);
    const effectiveSummary = summary || (hasWip ? 'WIP' : '');
    const checks = [
      { test: !isCheckpoint,      msg: 'Formato inv\xE1lido \u2014 se esperaba bloque JSON sin especificador de lenguaje.' },
      { test: !title,             msg: 'Falta el campo <code>title</code> dentro del bloque JSON.' },
      { test: !effectiveSummary,  msg: 'Falta el campo <code>summary</code> dentro del bloque JSON.' },
    ];
    const failed = checks.find(c => c.test);
    if (failed) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error">\u26A0 Formato inv\xE1lido \u2014 ${failed.msg}</div>`;
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      return;
    }

    // R-202604-038 / R-202605-133: validar resultado del parser JSON de ---getItems()--- o ```json
    // AC-2: JSON inválido → error bloqueante antes de procesar cualquier otra cosa
    const _itemsJsonErr = window[`_itemsJsonError_${id}`];
    if (_itemsJsonErr) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error">&#9940; Bloque de ítems inválido — ${esc(_itemsJsonErr)}.<br><span class="paste-hint">Corrige el JSON antes de procesar. El bloque debe ser un array de objetos con al menos <code>type</code>, <code>code</code> y <code>status</code>.</span></div>`;
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      return;
    }
    // T-202606-005: path único JSON — ítems van dentro del bloque JSON (campo items: [])
    // Si items está ausente o vacío el CHECKPOINT se guarda sin ítems — comportamiento esperado.

    // T-202604-350: CONTEXT-SECTION eliminado del modelo — parser no lo busca ni procesa.
    // T-202604-351: CHECKPOINTs históricos con CONTEXT-SECTION pasan en silencio — degradación silenciosa.

    // Base Rules V2.0.1 §11: campo Rol: obligatorio — aviso no bloqueante si ausente
    // No retroactivo: CHECKPOINTs históricos sin Rol: pasan con aviso
    const _hasRolField = /^\s*Rol\s*:/m.test(text) || !!(ckpt && ckpt._isJsonFormat && ckpt.rol);
    const _rolWarnKey  = `_rolFieldWarnSeen_${id}`;
    if (isCheckpoint && !_hasRolField && !window[_rolWarnKey]) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error paste-warn">⚠ Falta el campo <code>Rol:</code> en el CHECKPOINT.<br><span class="paste-hint">Formato esperado: <code>Rol: FS · Mike</code>. El paste funcionará igual sin este campo.</span><br><button class="btn-ghost paste-inline-btn">Procesar de todas formas</button></div>`;
      const _rolBtn = prev.querySelector('.paste-inline-btn');
      if (_rolBtn) _rolBtn.addEventListener('click', () => { window[_rolWarnKey] = true; parsePaste(id); }, { once: true });
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      return;
    }
    if (window[_rolWarnKey]) delete window[_rolWarnKey];

    // T-202605-436: ítems done sin AC — aviso no bloqueante
    // AC-1: solo ítems con status done y ac vacío o ausente
    // AC-2: aviso lista los códigos afectados — no genérico
    // AC-3: ítems pendiente o descartado sin AC no generan aviso
    const _doneWarnKey = `_doneNoAcWarnSeen_${id}`;
    if (isCheckpoint && !window[_doneWarnKey]) {
      const _doneNoAc = tgItems.filter(it => it.status === 'done' && (!it.ac || it.ac.length === 0));
      if (_doneNoAc.length > 0) {
        const _codes = _doneNoAc.map(it => `<code>${esc(it.code)}</code>`).join(', ');
        prev.className = 'preview show';
        prev.innerHTML = `<div class="paste-error paste-warn">⚠ ${_doneNoAc.length} ítem${_doneNoAc.length !== 1 ? 's' : ''} marcado${_doneNoAc.length !== 1 ? 's' : ''} como done sin criterios de aceptación: ${_codes}.<br><span class="paste-hint">Un ítem done sin AC no es verificable. Agrega AC antes de marcar como done, o continúa si es intencional.</span><br><button class="btn-ghost paste-inline-btn">Continuar de todas formas</button></div>`;
        const _doneBtn = prev.querySelector('.paste-inline-btn');
        if (_doneBtn) _doneBtn.addEventListener('click', () => { window[_doneWarnKey] = true; parsePaste(id); }, { once: true });
        if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
        return;
      }
    }
    if (window[_doneWarnKey]) delete window[_doneWarnKey];

    // R-202604-037: validar Proyecto: contra tabla de strings canónicos
    // AC-1: tabla canónica CANONICAL_PROJECTS declarada en locus-storage.js
    // AC-2: valor no canónico → error bloqueante — muestra valor recibido + lista de válidos
    // AC-4: vacío → aviso no bloqueante (comportamiento actual preservado)
    // AC-5: validación case-sensitive
    const _proyectoRaw = isCheckpoint ? (ckpt ? (ckpt.proyecto || '').trim() : '') : '';
    if (isCheckpoint && _proyectoRaw && !CANONICAL_PROJECTS.includes(_proyectoRaw)) {
      const _validList = CANONICAL_PROJECTS.map(p => `<code>${esc(p)}</code>`).join(' · ');
      // B-202605-078: suprimir toast si el preview inline ya muestra este mismo error
      const _previewAlreadyShowing = prev.classList.contains('show') && prev.innerHTML.includes('paste-error');
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error">⛔ CHECKPOINT inválido — <code>Proyecto:</code> contiene un valor no reconocido: <strong>${esc(_proyectoRaw)}</strong>.<br><span class="paste-hint">Valores válidos (case-sensitive): ${_validList}. Corrige el campo <code>Proyecto:</code> antes de procesar.</span></div>`;
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      if (!_previewAlreadyShowing) showToast('error', `⛔ Proyecto no reconocido: "${esc(_proyectoRaw)}" — corrige el campo`);
      // R-202605-063: sugerencia de string canónico por distancia de edición
      {
        const { suggestion, distance } = _suggestCanonical(_proyectoRaw);
        if (distance <= 3) {
          _blogLog('proyecto-no-reconocido', '', `Proyecto no reconocido: "${_proyectoRaw}". ¿Quisiste decir "${suggestion}"?`, 'parser');
        } else {
          _blogLog('proyecto-no-reconocido', '', `Proyecto no reconocido: "${_proyectoRaw}". Verificar string canónico.`, 'parser');
        }
      }
      return;
    }

    // T-202606-203: detección de desfase de infra_version — aviso informativo no bloqueante
    // AC-1: extraer infra_version del header del texto pegado — formato: <!-- **infra_version: N** | ... -->
    // AC-2: si el valor difiere del activo → mostrar alerta con formato exacto de BR-Core §1
    // T-202606-083: la validación aplica solo a Docs vivos (context, strategy, backlog) — no a CHECKPOINTs.
    //   Rama else-if (isCheckpoint) eliminada: los CHECKPOINTs no declaran infra_version y no deben
    //   disparar ninguna alerta por su ausencia. Sin regresión en la validación de Docs vivos.
    // AC-4: la ingesta continúa normalmente — no bloquea
    {
      const _infraMatch = text.match(/<!--\s*\*\*infra_version:\s*(\d+)\*\*/);
      if (_infraMatch) {
        const _infraDoc = parseInt(_infraMatch[1], 10);
        if (_infraDoc !== INFRA_VERSION_ACTIVE) {
          const _docName = (ckpt && ckpt.titulo) ? ckpt.titulo : (ckpt && ckpt.proyecto) ? ckpt.proyecto : 'doc';
          showToast('warn', `infra_version desactualizada: ${_docName} declara infra_version:${_infraDoc}, valor activo es infra_version:${INFRA_VERSION_ACTIVE}. Verificar consistencia antes de continuar.`);
        }
      }
    }

    // G-04: parse exitoso → silencio. El preview renderizado es la confirmación.
    // Toast solo en error (ver bloque de validaciones previo).
  }

  if (btn) { btn.disabled = false; btn.className = title ? 'sc-save ready' : 'sc-save'; }

  // T-202606-034: aviso no bloqueante de discrepancia raw vs parseado
  // AC-1: si no hay discrepancia o rawTotal === 0, silencio — auto-trigger corre normalmente.
  // AC-2: si rawTotal !== parsedTotal y rawTotal > 0, mostrar aviso con botón "Continuar de todas formas".
  // AC-3: al hacer click en "Continuar de todas formas", marcar flag visto y re-invocar parsePaste (auto-trigger corre en esa segunda pasada).
  // AC-4: aviso usa clase CSS paste-warn — sin clase nueva.
  // AC-5: reutiliza _discrepancy ya calculado — sin duplicar lógica.
  const _discrepancyWarnKey = `_discrepancyWarnSeen_${id}`;
  if (_discrepancy && !window[_discrepancyWarnKey]) {
    prev.className = 'preview show';
    prev.innerHTML = `<div class="paste-error paste-warn">⚠ ${_discrepancy.raw} línea${_discrepancy.raw !== 1 ? 's' : ''} detectada${_discrepancy.raw !== 1 ? 's' : ''} en el texto — solo ${_discrepancy.parsed} parseada${_discrepancy.parsed !== 1 ? 's' : ''} correctamente. Verifica el formato de los ítems no detectados.<br><button class="btn-ghost paste-inline-btn">Continuar de todas formas</button></div>`;
    const _discBtn = prev.querySelector('.paste-inline-btn');
    if (_discBtn) _discBtn.addEventListener('click', () => { window[_discrepancyWarnKey] = true; parsePaste(id); }, { once: true });
    if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
    return;
  }
  if (window[_discrepancyWarnKey]) delete window[_discrepancyWarnKey];

  // T-202606-210: detección de CHECKPOINT duplicado — AC-1/AC-2/AC-3
  // Hash = texto completo trimmed (coincidencia exacta según AC-1).
  // Guard usa patrón warn-key idéntico al de _discrepancyWarnKey.
  const _dupWarnKey = `_dupCheckpointWarnSeen_${id}`;
  if (isCheckpoint && title) {
    const _ckptHash = text.trim();
    if (_processedCheckpointHashes.has(_ckptHash) && !window[_dupWarnKey]) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error paste-warn">⚠ Este CHECKPOINT ya fue procesado. ¿Continuar de todas formas?<br><button class="btn-ghost paste-inline-btn">Continuar de todas formas</button></div>`;
      const _dupBtn = prev.querySelector('.paste-inline-btn');
      if (_dupBtn) _dupBtn.addEventListener('click', () => { window[_dupWarnKey] = true; parsePaste(id); }, { once: true });
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      return;
    }
    if (window[_dupWarnKey]) delete window[_dupWarnKey];
  }

  // T-202606-032: auto-trigger — AC-1/AC-2/AC-3/AC-6/AC-7
  // Parse completó sin avisos ni errores bloqueantes → lanzar saveSession directamente.
  // horaRaw: saveSession lee document.getElementById('hora-' + id).value internamente (AC-2).
  // Los gates de proyecto-no-seleccionado (AC-6) y mismatch de proyecto (AC-7) viven en saveSession.
  // B-202606-068 AC1+AC2: guard _saveSessionInFlight — evita doble invocación de saveSession
  // cuando handleInput y handlePaste disparan parsePaste concurrentemente en el mismo paste.
  // El flag se limpia con queueMicrotask para permitir re-saves legítimos en parsePastes
  // subsecuentes (ej: el usuario edita el textarea después del paste).
  const _saveGuardKey = `_saveSessionInFlight_${id}`;
  if (isCheckpoint && title && !window[_saveGuardKey]) {
    window[_saveGuardKey] = true;
    queueMicrotask(() => { delete window[_saveGuardKey]; });
    _processedCheckpointHashes.add(text.trim()); // T-202606-210: registrar hash al procesar
    saveSession(id);
  }

  // T-409: atenuar textarea cuando hay ítems detectados en fase CONFIRMAR
  const _ta409 = document.getElementById('ta-' + id);
  if (_ta409) {
    if (tgItems.length > 0) {
      _ta409.classList.add('ta-has-items');
    } else {
      _ta409.classList.remove('ta-has-items');
    }
  }

  if (title || summary) {
    // P-202604-115: pill de proyecto del CHECKPOINT con indicador de coincidencia
    const _ckptProj = ckpt ? (ckpt.proyecto || '') : '';
    const _cardProjEl = document.getElementById('sess-proj-' + id);
    const _cardProjId = _cardProjEl ? _cardProjEl.value : '';
    const _cardProj = _cardProjId ? (state.projects || []).find(p => p.id === _cardProjId) : null;
    const _cardProjName = _cardProj ? _cardProj.name : '';
    let _projPillHTML = '';
    if (isCheckpoint) {
      if (_ckptProj) {
        const _match = _cardProjName && _cardProjName.trim() === _ckptProj.trim();
        const _pillColor = _match ? 'var(--green)' : 'var(--accent)';
        const _pillBg = _match ? 'rgba(46,204,120,0.12)' : 'rgba(248,113,50,0.12)';
        const _pillBorder = _match ? 'rgba(46,204,120,0.3)' : 'rgba(248,113,50,0.3)';
        const _icon = _match ? '✓' : '⚠';
        _projPillHTML = `<div class="ckpt-proj-pill" style="--pill-bg:${_pillBg};--pill-color:${_pillColor};--pill-border:${_pillBorder};">${_icon} Proyecto: ${esc(_ckptProj)}</div>`;
      } else {
        _projPillHTML = `<div class="ckpt-pill ckpt-pill--warn">⚠ Sin campo Proyecto</div>`;
      }
    }
    prev.className = 'preview show';
    prev.innerHTML = `
      <div class="ckpt-badges-row">
        <div class="ckpt-pill ckpt-pill--ok">\u2713 CHECKPOINT</div>
        ${_projPillHTML}
      </div>
      ${title ? `<div class="preview-title">${esc(title)}</div><hr class="preview-divider">` : ''}
      ${summary ? `<div class="preview-summary">${esc(summary)}</div>` : ''}
      ${files ? `<div class="preview-files">\U0001F4C4 ${esc(files)}</div>` : ''}
      ${nextStep ? `<div class="preview-next-step"><span class="preview-next-label">Próximo paso</span> ${esc(nextStep)}</div>` : ''}
      ${(() => {
        if (!bloqueantesRaw) return '';
        const _bVal = bloqueantesRaw.trim();
        if (_bVal.toLowerCase() === 'n/a') {
          return `<div class="preview-bloqueantes preview-bloqueantes--ok"><span class="preview-next-label">Bloqueantes</span> <span class="preview-bloqueantes-val">n/a</span></div>`;
        }
        // Detectar referencia a ítem: ID real (P/T/R/B-YYYYMM-NNN) o [tmp:slug] o [pendiente-ID]
        const _itemRefRe = /([PTRB]-\d{6}-\d{3}(?:-[A-Z]+)?|\[tmp:[a-z0-9_-]+\]|\[pendiente-ID\])/gi;
        const _refs = _bVal.match(_itemRefRe);
        if (_refs) {
          const _linked = _bVal.replace(_itemRefRe, m => `<span class="preview-bloqueantes-ref">${esc(m)}</span>`);
          return `<div class="preview-bloqueantes preview-bloqueantes--ref"><span class="preview-next-label">Bloqueantes</span> <span class="preview-bloqueantes-val">${_linked}</span></div>`;
        }
        // Texto libre — aviso de formato esperado
        return `<div class="preview-bloqueantes preview-bloqueantes--warn"><span class="preview-next-label">Bloqueantes</span> <span class="preview-bloqueantes-val">${esc(_bVal)}</span><span class="preview-bloqueantes-hint"> · esperado: ID de ítem o n/a</span></div>`;
      })()}
      ${buildTGPreview(tgItems, _discrepancy)}`;
    // T-409: scroll preview-tg into view when items detected
    if (tgItems.length > 0) {
      requestAnimationFrame(() => {
        const _tgEl = prev.querySelector('.preview-tg');
        if (_tgEl) _tgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  } else {
    prev.className = 'preview';
  }
}
// T-202606-032: _pasteInFlight (módulo) e isParseInFlight eliminados — AC-4/AC-5.
// El guard de saveSession se eliminó. handlePaste usa su propia variable local _pasteRetry
// para el mecanismo de retry del browser (esperar inserción del clipboard) — propósito distinto.

// T-202606-032: _pasteRetry reemplaza _pasteInFlight en handlePaste — variable local al módulo.
// Solo controla el mecanismo de retry del browser (clipboard insert delay) — no es el guard de saveSession.
const _pasteRetry = {};

export function handlePaste(id) {
  // Llamado desde onpaste — diferir para que el browser inserte el texto del clipboard.
  // B-202605-NNN: 150ms en lugar de 60ms — algunos browsers (Chrome) insertan
  // el texto del clipboard después de los 60ms originales, dejando ta.value vacío
  // cuando parsePaste corre y provocando reset completo (preview en blanco).
  // Si ta.value todavía está vacío al ejecutar, se reintenta una vez a 300ms.
  _pasteRetry[id] = true;
  const _doParse = () => {
    delete _pasteRetry[id];
    const ta = document.getElementById('ta-' + id);
    if (ta && !ta.value.trim()) {
      // Texto aún no insertado — reintentar una vez más
      _pasteRetry[id] = true;
      setTimeout(() => {
        delete _pasteRetry[id];
        parsePaste(id);
        const ai = getAI(id);
        if (ai && ai._parsed && ai._parsed.title) {
          const horaEl = document.getElementById('hora-' + id);
          if (horaEl) horaEl.focus();
        }
        if (ta && (ta.value.includes('---PLAN---') || ta.value.includes('---EXECUTION-PLAN---'))) _tryIngestPlan(ta.value);
        // T-202606-155: _tryIngestSprintProposal removido del pre-DIFF — Step 0 en showMergeDiffPanel es el gate
      }, 150);
      return;
    }
    parsePaste(id);
    const ai = getAI(id);
    if (ai && ai._parsed && ai._parsed.title) {
      const horaEl = document.getElementById('hora-' + id);
      if (horaEl) horaEl.focus();
    }
    // R-202604-085 + R-B: detectar ---PLAN--- o ---EXECUTION-PLAN--- embebido en el CHECKPOINT pegado
    if (ta && (ta.value.includes('---PLAN---') || ta.value.includes('---EXECUTION-PLAN---'))) _tryIngestPlan(ta.value);
    // T-202606-155: _tryIngestSprintProposal removido del pre-DIFF — Step 0 en showMergeDiffPanel es el gate
  };
  setTimeout(_doParse, 150);
}

export function handleInput(id) {
  // T-202606-032: guard _pasteInFlight eliminado — AC-4/AC-9.
  // _pasteRetry no bloquea handleInput — handlePaste y handleInput son eventos distintos.
  // parsePaste corre en cada keystroke; el auto-trigger solo se lanza cuando el parse es completo y válido.
  parsePaste(id);
}

// R-202604-085 + R-B: ingesta de ---PLAN--- o ---EXECUTION-PLAN--- desde cualquier texto
export function _tryIngestPlan(text) {
  const hasLegacy = text && text.includes('---PLAN---');
  const hasNew    = text && text.includes('---EXECUTION-PLAN---');
  if (!hasLegacy && !hasNew) return false;
  const incoming = parsePlanBlock(text);
  if (!incoming || !incoming.length) return false;
  const proj = getActiveProject();
  if (!proj) return false;

  // R-202605-153: merge por scope — preservar sprints del otro scope en localStorage
  // Si el CHECKPOINT trae solo scope:sesion → conservar los scope:sprint existentes, y viceversa.
  // Planes legacy (---PLAN--- sin scope) se tratan como scope:sprint.
  const incomingHasSesion = incoming.some(sp => sp.scope === 'sesion');
  const incomingHasSprint = incoming.some(sp => sp.scope !== 'sesion');

  let merged = incoming;
  {
    const existing = loadPlan(proj.id) || [];
    if (incomingHasSesion && !incomingHasSprint) {
      // Solo scope:sesion entrante — conservar scope:sprint existente
      const keepSprint = existing.filter(sp => sp.scope !== 'sesion');
      merged = [...incoming, ...keepSprint];
    } else if (incomingHasSprint && !incomingHasSesion) {
      // Solo scope:sprint entrante — conservar scope:sesion existente
      const keepSesion = existing.filter(sp => sp.scope === 'sesion');
      merged = [...keepSesion, ...incoming];
    }
    // Si trae ambos scopes → reemplazar completo (el CHECKPOINT es fuente de verdad total)
  }

  savePlan(proj.id, merged);
  const hasSesion = merged.some(sp => sp.scope === 'sesion');
  const label = hasNew
    ? (incomingHasSesion && !incomingHasSprint
        ? '✓ Execution Plan importado — sesión activa actualizada'
        : incomingHasSprint && !incomingHasSesion
          ? '✓ Execution Plan importado — plan de sprint actualizado'
          : '✓ Execution Plan importado — plan completo actualizado')
    : '✓ Plan importado — ' + incoming.length + ' sprint(s)';
  showToast('success', label);
  renderPlan();
  return true;
}

// T-202606-018: ingesta de execution_plan desde objeto ya parseado (path JSON puro).
// Equivalente a _tryIngestPlan pero acepta el objeto {scope, sessions} directamente
// — en path JSON el raw no contiene ---EXECUTION-PLAN--- por lo que _tryIngestPlan(raw) falla silenciosamente.
// Retorna true si el plan se guardó, false si no hay proyecto activo o el objeto es inválido.
export function _tryIngestPlanFromParsed(planObj) {
  if (!planObj || typeof planObj !== 'object' || Array.isArray(planObj)) return false;
  const proj = getActiveProject();
  if (!proj) return false;

  // Normalizar al mismo formato que parsePlanBlock produce: array de sprints con scope + sessions
  const scope    = (planObj.scope    || 'sesion').toLowerCase();
  const sessions = Array.isArray(planObj.sessions) ? planObj.sessions : [];
  const incoming = [{ id: null, scope, sessions }];

  const incomingHasSesion = scope === 'sesion';
  const incomingHasSprint = scope !== 'sesion';

  let merged = incoming;
  {
    const existing = loadPlan(proj.id) || [];
    if (incomingHasSesion && !incomingHasSprint) {
      const keepSprint = existing.filter(sp => sp.scope !== 'sesion');
      merged = [...incoming, ...keepSprint];
    } else if (incomingHasSprint && !incomingHasSesion) {
      const keepSesion = existing.filter(sp => sp.scope === 'sesion');
      merged = [...keepSesion, ...incoming];
    }
  }
  savePlan(proj.id, merged);
  renderPlan();
  return true;
}
// ── END T-202606-018 ──
// Flujo: parseSprintProposal(text) → validar rol emisor → validar campos → guard duplicado → push a proj.sprints → save()
export function _tryIngestSprintProposal(text) {
  if (!text || !text.includes('---SPRINT-PROPOSAL---')) return false;

  // T-202606-154 AC-4: validar rol emisor — solo Cael (PO) puede proponer apertura de sprint
  // Extraer campo Rol: del CHECKPOINT envolvente (si existe)
  const _rolMatch = text.match(/^\s*Rol\s*:\s*(.+)$/m);
  if (_rolMatch) {
    const _rolRaw = _rolMatch[1].trim();
    // Cael usa sigla PO — aceptar "PO · Cael", "PO", "Cael" como emisores válidos
    const _esCael = /\bPO\b/i.test(_rolRaw) || /\bCael\b/i.test(_rolRaw);
    if (!_esCael) {
      _blogLog(
        'sprint-proposal-ignorado',
        '',
        `---SPRINT-PROPOSAL--- ignorado: solo Cael puede proponer apertura de sprint. Rol detectado: "${_rolRaw}"`,
        'parser'
      );
      return false;
    }
  }
  // Si no hay campo Rol: en el texto (CHECKPOINT sin header de rol o texto plano)
  // → dejar pasar sin bloquear (comportamiento conservador — no rompe flujos existentes)

  const result = parseSprintProposal(text);

  // AC-3: campos faltantes → toast con lista y retorno temprano sin persistir
  if (!result) return false; // bloque ausente o sin terminador (parseSprintProposal retorna null)
  if (result.error) {
    const list = result.missing.join(', ');
    showToast('error', `Campos obligatorios faltantes: ${list}`);
    return false;
  }

  const proj = getActiveProject();
  if (!proj) return false;

  if (!proj.sprints) proj.sprints = [];

  // AC-2: guard de duplicado — comparar contra prefijo corto (id) y string completo (label/name)
  // B-202606-063: id es ahora el prefijo corto — el guard debe cubrir ambas formas
  const _dupIdShort = result.sprint.split(/\s*·\s*/)[0].trim();
  const exists = proj.sprints.some(sp =>
    sp.id === _dupIdShort || sp.id === result.sprint ||
    sp.name === result.sprint || sp.label === result.sprint
  );
  if (exists) {
    showToast('error', 'Ya existe un sprint con este ID');
    return false;
  }

  // T-202606-023 AC-1/AC-2: determinar status del nuevo sprint según existencia de sprint activo.
  // Si existe sprint con status:'active' → nuevo sprint nace como 'scheduled' (AC-1).
  // Si no existe sprint activo → nuevo sprint nace como 'active' (AC-2 — comportamiento anterior).
  // AC-4: esta lógica garantiza que sprints.filter(s => s.status === 'active').length ≤ 1.
  const _hasActiveSprint = proj.sprints.some(sp => sp.status === 'active' && !sp.isHotfix);
  const _newSprintStatus = _hasActiveSprint ? 'scheduled' : 'active';

  // B-202606-063: extraer prefijo corto como id — el string completo va en label y name.
  // "PP-S-06 · IDP fixes" → id: "PP-S-06", label: "PP-S-06 · IDP fixes"
  // El gate en locus-backlog-merge.js busca por id y label — sin este split,
  // ítems con sprint: "PP-S-06" (prefijo corto) nunca coinciden con id completo → bloqueo falso.
  const _sprintIdFull  = result.sprint;
  const _sprintIdShort = _sprintIdFull.split(/\s*·\s*/)[0].trim();
  const newSprint = {
    id:             _sprintIdShort,
    label:          _sprintIdFull,
    name:           _sprintIdFull,
    version_target: result.version_target,
    release_type:   result.release_type,
    scope:          result.scope,
    goal:           result.goal,
    out_of_scope:   result.out_of_scope || [],
    status:         _newSprintStatus,  // T-202606-023: 'scheduled' si hay activo, 'active' si no
    current:        false,
    formallyOpened: true,  // B-202606-063: aprobado via Step 0 — sprint existe formalmente
  };

  proj.sprints.push(newSprint);
  // B-202606-063: saveImmediate() — los sprints son eventos críticos.
  // save() tiene debounce de 5s — si el founder pega el siguiente CHECKPOINT antes de que
  // el debounce se dispare, el sprint no está en Supabase y getActiveSprints() no lo ve → bloqueo falso.
  saveImmediate();

  // T-202606-023 AC-3: toast refleja el estado resultante.
  // 'scheduled': indica activación al cerrar sprint activo.
  // 'active': mensaje original sin cambio.
  const _toastMsg = _newSprintStatus === 'scheduled'
    ? `✓ Sprint "${result.sprint}" creado como programado — se activará al cerrar el sprint activo`
    : `✓ Sprint "${result.sprint}" creado — pendiente de aprobación`;
  showToast('success', _toastMsg);
  // T-202606-020: retornar el id del sprint creado (prefijo corto) en lugar de true.
  // Los callers existentes hacen `if (_spCreated)` — un string no-vacío sigue siendo truthy.
  // El id retornado permite que el caller aplique la herencia de sprint a los ítems del CHECKPOINT.
  return _sprintIdShort;
}

// T-202606-020: herencia automática de sprint al confirmar Step 0 de sprint proposal — Trigger 1.
// Recibe el array de ítems del CHECKPOINT y el id del sprint recién creado.
// Muta in-place los ítems R/T/B cuyo sprint sea 'icebox' o ausente → asigna el sprint nuevo.
// Ps no se tocan — permanecen en icebox según BR-Ecosystem §5 y §13.
// AC-1: R/T/B con sprint: icebox → sprint asignado al id del sprint recién creado.
// AC-2: P con sprint: icebox → no se mueve, permanece en icebox.
// AC-3: ítem con sprint explícito distinto de icebox → no se toca.
// AC-4: el movimiento ocurre sobre tgItems en memoria — visible en el DIFF antes de confirmar.
export function _applySprintInheritanceToItems(tgItems, sprintId) {
  if (!Array.isArray(tgItems) || !sprintId) return;
  tgItems.forEach(item => {
    if (item.type === 'P') return; // AC-2: Ps permanecen en icebox sin excepción
    const _sprintRaw = item.sprint ? String(item.sprint).trim().toLowerCase() : '';
    if (_sprintRaw === 'icebox' || _sprintRaw === '') {
      // AC-1: asignar sprint del proposal — ítem movido automáticamente
      item.sprint = sprintId;
      _blogLog(
        'sprint-heredado-trigger1',
        item.code || '[pendiente-ID]',
        `${item.type} ${item.code || '[pendiente-ID]'} sprint asignado via Trigger 1: ${sprintId}`,
        'backlog'
      );
    }
    // AC-3: sprint explícito distinto de icebox → conservar sin modificar
  });
}

// T-202605-019: Migrado desde locus-misc-ui.js — modal standalone de CHECKPOINT
// B-202604-138: modal standalone de CHECKPOINT — merge de ítems sin crear sesión de IA
export function openStandaloneCheckpoint() {
  // R-202604-047: shell estático en index.html — solo inject content + classList
  const overlay = document.getElementById('standalone-ckpt-overlay');
  if (!overlay) return;
  overlay.classList.remove('force-hidden');
  overlay.classList.add('open');
  setTimeout(() => {
    const ta = document.getElementById('standalone-ckpt-ta');
    if (ta) ta.focus();
  }, 80);
}

export function closeStandaloneCheckpoint() {
  const overlay = document.getElementById('standalone-ckpt-overlay');
  // B-new: forzar display:none además de quitar clase open
  // El overlay tiene z-index:9200 > item-viz-overlay(8500) — si solo se quita .open
  // puede seguir bloqueando visualmente el panel diff que se abre inmediatamente después.
  if (overlay) { overlay.classList.remove('open'); overlay.classList.add('force-hidden'); }
}
// ── END T-202605-019 ─────────────────────────────────────────────────────────

// B-202604-138: flujo de CHECKPOINT standalone — merge de ítems sin sesión de IA
// AC-1: pasa por showMergeDiffPanel igual que el flujo de sesión
// AC-2: avances de status muestran el panel antes de aplicarse
// AC-3: retrocesos y descartes siguen requiriendo confirmación en showCheckpointPanel
// AC-4: si no hay tgItems el panel no aparece

let _standaloneLastParsed = null;

function parsePasteStandalone() {
  const ta  = document.getElementById('standalone-ckpt-ta');
  const prev = document.getElementById('standalone-ckpt-prev');
  const btn  = document.getElementById('standalone-ckpt-btn');
  if (!ta || !prev || !btn) return;

  const text = ta.value.trim();
  _standaloneLastParsed = null;

  if (!text) {
    prev.innerHTML = '';
    btn.disabled = true;
    return;
  }

  // Reutilizar parseCheckpoint para extraer campos y validar estructura
  // T-202605-524: EXECUTION-PLAN standalone — sin CHECKPOINT envolvente
  // T-202606-005: parseCheckpoint opera en path único JSON — no detecta Markdown legacy
  // Si el texto contiene solo un bloque ---EXECUTION-PLAN--- sin CHECKPOINT, procesarlo directamente
  const _hasEP  = text.includes('---EXECUTION-PLAN---');
  // T-202606-005: detectar CHECKPOINT via fence (con o sin especificador json) o JSON puro sin fence
  const _hasCKP = /^\s*```(?:json)?\s*\{/.test(text) || (text.trim().startsWith('{') && text.trim().endsWith('}'));
  if (_hasEP && !_hasCKP) {
    const _epResult = _tryIngestPlan(text);
    if (_epResult) {
      prev.innerHTML = '<div class="ckpt-pill ckpt-pill--ok ckpt-pill--mb">✓ Execution Plan aplicado</div>';
      btn.disabled = true; // sin ítems de backlog — nada más que confirmar
    } else {
      // _tryIngestPlan falló — proyecto no activo o bloque inválido
      const _activeProj = getActiveProject();
      if (!_activeProj) {
        prev.innerHTML = '<div class="paste-error">⚠ Selecciona un proyecto activo antes de aplicar el Execution Plan.</div>';
      } else {
        prev.innerHTML = '<div class="paste-error">⚠ Bloque <code>---EXECUTION-PLAN---</code> inválido o sin sprint activo.<br><span class="paste-hint">Verifica que el bloque incluya <code>sprint:</code> o que haya un sprint activo en el proyecto.</span></div>';
      }
      btn.disabled = true;
    }
    return;
  }

  const ckpt = parseCheckpoint(text);

  // Validación: bloque de apertura — gate es fence JSON sin especificador + campo title
  // T-202606-005: path único JSON — ---CHECKPOINT--- y ---FIN-CHECKPOINT--- no requeridos
  if (!ckpt || !ckpt.isCheckpoint || !ckpt.titulo) {
    prev.innerHTML = '<div class="paste-error">⚠ Formato inválido — se esperaba bloque JSON sin especificador de lenguaje.</div>';
    btn.disabled = true;
    return;
  }

  // R-202605-133: error de parseo JSON — bloqueante
  if (ckpt._jsonParseError) {
    prev.innerHTML = `<div class="paste-error">&#9940; Bloque <code>\`\`\`</code> inválido — ${esc(ckpt._jsonParseError)}.<br><span class="paste-hint">Corrige el JSON antes de aplicar.</span></div>`;
    btn.disabled = true;
    return;
  }

  // T-202606-013: guard draft:true — bloquear ingesta en path standalone antes de parsear ítems
  // AC-1: _mergeBacklogWithProject nunca se llama si draft:true — tgItems/patchItems nunca se llenan
  // AC-2: feedback visible en prev.innerHTML + btn deshabilitado
  // AC-3: toast con mensaje canónico idéntico al path de sesión
  // AC-4: ckpt.draft es true solo si _parsed.draft === true — undefined→false, legacy sin campo→false
  if (ckpt.draft === true) {
    prev.innerHTML = '<div class="paste-error">📋 Borrador detectado — pegar CHECKPOINT final emitido por Finn</div>';
    btn.disabled = true;
    showToast('warning', 'Borrador detectado — pegar CHECKPOINT final emitido por Finn');
    return;
  }

  // T-202606-005: path único JSON — ítems ya están en ckpt._rawItems, no hay path legacy
  const parsedJSON = Array.isArray(ckpt._rawItems) ? ckpt._rawItems : [];

  const _validTypes    = ['P', 'T', 'R', 'B'];
  const _validStatuses = ['done', 'pendiente', 'descartado', 'en-revision'];
  const tgItems = [];
  const patchItems = []; // R-202605-062: patches separados de ítems normales
  let itemError = null;

  for (let i = 0; i < parsedJSON.length; i++) {
    const it = parsedJSON[i];
    // R-202605-062: patch — instrucción de operación, no tipo de ítem
    if (it.type === 'patch') {
      if (!it.code || _isPlaceholderCode(it.code)) {
        _blogLog('patch-ignorado', it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (it.code || '(vacío)'), 'backlog');
        // T-202606-055 AC-1+AC-3: toast visible — consistente con path JSON primario y legacy
        showToast('warn', `Patch descartado: código placeholder no patcheable — ${it.code || '(vacío)'}. Usa el código real asignado por Locus.`);
      } else {
        patchItems.push(it);
      }
      continue;
    }
    if (!it.type || !it.code || !it.status) {
      itemError = `Ítem [${i}]: faltan campos obligatorios (type, code, status).`;
      break;
    }
    if (!_validTypes.includes(it.type)) {
      itemError = `Ítem [${i}]: type inválido "${it.type}". Válidos: P · T · R · B`;
      break;
    }
    // T2-parser-validaciones (standalone): guard simétrico a parsePaste() — mismo mensaje canónico
    if (it.status && (it.status.trim().toLowerCase() === 'historico' || it.status.trim().toLowerCase() === 'histórico')) {
      _blogLog(
        'status-historico-emitido',
        it.code || '[pendiente-ID]',
        `Status "historico" no es emitible — asignado exclusivamente por Locus al cerrar sprint`,
        'backlog'
      );
      continue; // ítem omitido — resto del CHECKPOINT continúa
    }
    // R-202605-023: normalizar antes de validar — acepta variantes de en-revision y otros
    const _normSt3 = _canonicalStatus(it.status, it.type);
    // T-202606-022 AC-1: excepción bloqueado para R — simétrico a parsePaste
    if (!_normSt3 || (!_validStatuses.includes(_normSt3) && _normSt3 !== 'promovida' && _normSt3 !== 'bloqueado')) {
      itemError = `Ítem [${i}]: status inválido "${it.status}". Válidos: done · pendiente · descartado · en-revision${it.type === 'P' ? ' · promovida' : ''}`;
      break;
    }
    // T-202606-035: bloqueo icebox + en-revision — BR-Ecosystem §5
    // T-202606-012 AC-3: sprint ausente se trata como icebox
    const _sprintRaw3 = it.sprint ? it.sprint.trim().toLowerCase() : '';
    if (_normSt3 === 'en-revision' && (_sprintRaw3 === 'icebox' || _sprintRaw3 === '')) {
      itemError = `CHECKPOINT bloqueado: ${it.code || '[pendiente-ID]'} tiene status en-revision con sprint: icebox. Asignar sprint antes de continuar.`;
      break;
    }
    // T-202606-022: guard de rol para R con status bloqueado — simétrico a parsePaste()
    // AC-1/AC-2: precedencia de rol: (1) it.role si no vacío, (2) ckpt.rol (raíz del CHECKPOINT)
    // AC-1: role resuelto !== 'QA · Finn' → _blogLog + forzar status a 'pendiente'
    // AC-3: role resuelto === 'QA · Finn' → status 'bloqueado' preservado sin modificación
    // AC-4: aplica solo a R con status bloqueado — T, B, P no afectados
    if (it.type === 'R' && _normSt3 === 'bloqueado') {
      const _resolvedRole = (it.role && it.role.trim()) ? it.role.trim() : (ckpt.rol || '');
      const _authorizedRole = 'QA · Finn';
      if (_resolvedRole !== _authorizedRole) {
        _blogLog(
          'rol-no-autorizado-bloqueado',
          it.code || '[pendiente-ID]',
          `Transición bloqueado en R ${it.code || '[pendiente-ID]'} rechazada: solo Finn puede mover un R a bloqueado. Rol resuelto: "${_resolvedRole}". Origen: ${ckpt.titulo || ''}`,
          'backlog'
        );
        // Forzar status a 'pendiente' — el ítem se ingesta pero no como bloqueado
        tgItems.push({
          type:          it.type,
          code:          it.code,
          title:         it.title  || it.desc   || '',
          desc:          it.title  || it.desc   || '',
          status:        'pendiente',
          _noStatus:     false,
          effort:        it.effort != null ? (parseInt(it.effort) || null) : null,
          area:          it.area   || '',
          sprint:        it.sprint,
          ac:            Array.isArray(it.ac) ? it.ac : [],
          role:          _resolvedRole,
          discardReason: it.reason || '',
          discardRef:    it.ref    || '',
          blockedBy:     Array.isArray(it.blockedBy) ? it.blockedBy : [],
          promovida_a:   it.promovida_a || null,
          parentId:      it.parent      || null,               // T-202606-024 AC-1
          dependsOn:     Array.isArray(it.depends_on) ? it.depends_on : [],  // T-202606-024 AC-2
          triggeredBy:   it.triggered_by  || null,             // T-202606-024 AC-3
          origenP:       it.origen_p      || null,             // T-202606-024 AC-4
          intencion:     it.intencion     || null,             // T-202606-024 AC-5
          no_incluye:    Array.isArray(it.no_incluye) ? it.no_incluye : [],  // T-202606-024 AC-6
          schema_version: it.schema_version != null ? Number(it.schema_version) : 0  // T-202606-024 AC-7
        });
        _normalizeSprint(tgItems[tgItems.length - 1], tgItems);
        continue;
      }
    }
    tgItems.push({
      type:          it.type,
      code:          it.code,
      title:         it.title  || it.desc   || '',
      desc:          it.title  || it.desc   || '',
      status:        _normSt3,
      _noStatus:     false,
      effort:        it.effort != null ? (parseInt(it.effort) || null) : null,
      area:          it.area   || '',
      sprint:        it.sprint,
      ac:            Array.isArray(it.ac) ? it.ac : [],
      role:          it.role   || (ckpt.rol || ''),
      discardReason: it.reason || '',
      discardRef:    it.ref    || '',
      blockedBy:     Array.isArray(it.blockedBy) ? it.blockedBy : [],
      promovida_a:   it.promovida_a || null,                   // T-202606-018 AC8
      parentId:      it.parent      || null,                   // T-202606-024 AC-1
      dependsOn:     Array.isArray(it.depends_on) ? it.depends_on : [],  // T-202606-024 AC-2
      triggeredBy:   it.triggered_by  || null,                 // T-202606-024 AC-3
      origenP:       it.origen_p      || null,                 // T-202606-024 AC-4
      intencion:     it.intencion     || null,                 // T-202606-024 AC-5
      no_incluye:    Array.isArray(it.no_incluye) ? it.no_incluye : [],  // T-202606-024 AC-6
      schema_version: it.schema_version != null ? Number(it.schema_version) : 0  // T-202606-024 AC-7
    });
    // T-202606-018 AC9: advertencia si P tiene status promovida sin promovida_a en standalone parser
    if (it.type === 'P' && _normSt3 === 'promovida' && !it.promovida_a) {
      _blogLog('promovida-sin-ref', it.code || '[pendiente-ID]', 'P ' + (it.code || '[pendiente-ID]') + ' con status promovida sin campo promovida_a — trazabilidad incompleta', 'backlog');
    }
    // R-202605-046: normalizar sprint a campo ausente si es centinela o sprint cerrado
    // T-202606-158: pasar tgItems para heredar sprint de parent R en mismo CHECKPOINT
    _normalizeSprint(tgItems[tgItems.length - 1], tgItems);
  }

  if (itemError) {
    prev.innerHTML = `<div class="paste-error">⛔ ${esc(itemError)}</div>`;
    btn.disabled = true;
    return;
  }

  // R-202604-075: extraer campo contract de cada ítem y aplicar a Contratos de Módulo
  parsedJSON.forEach(it => {
    if (it.contract) _ctrMergeFromItem(it.code || '[pendiente-ID]', it.contract);
  });

  // R-202604-085 + R-B: detectar ---PLAN--- o ---EXECUTION-PLAN--- embebido en el CHECKPOINT standalone
  if (text.includes('---PLAN---') || text.includes('---EXECUTION-PLAN---')) _tryIngestPlan(text);
  // T-202606-156: _tryIngestSprintProposal removido de parsePasteStandalone —
  // Step 0 en showMergeDiffPanel es el gate. El sprint se crea solo al aprobar en el DIFF.

  // Éxito — guardar parsed y habilitar botón
  // T-202606-005: path único JSON — ckpt._isJsonFormat siempre true aquí (parseCheckpoint solo retorna JSON válido)
  const _isJsonFmtSa = !!(ckpt && ckpt._isJsonFormat);
  _standaloneLastParsed = { ckpt, tgItems, patchItems, raw: text,
    // T-202606-017: doc_updates y sprint_proposal del path JSON — disponibles en saveStandaloneCheckpoint
    docUpdates:       (_isJsonFmtSa && ckpt._rawDocUpdates)     ? ckpt._rawDocUpdates     : [],
    sprintProposal:   (_isJsonFmtSa && ckpt._rawSprintProposal) ? ckpt._rawSprintProposal : null,
    // T-202606-018: finn_observations y execution_plan del path JSON — disponibles en saveStandaloneCheckpoint
    finnObservations: (_isJsonFmtSa && ckpt._rawFinnObservations) ? ckpt._rawFinnObservations : null,
    executionPlan:    (_isJsonFmtSa && ckpt._rawExecutionPlan)    ? ckpt._rawExecutionPlan    : null,
  };

  const _assignedIds = _assignPendingIds(tgItems);
  const previewHtml = buildTGPreview(tgItems, null);
  prev.innerHTML = `
    <div class="ckpt-pill ckpt-pill--ok ckpt-pill--mb">✓ CHECKPOINT · ${tgItems.length} ítem${tgItems.length !== 1 ? 's' : ''}</div>
    <div class="sa-ckpt-desc">${esc(ckpt.titulo)}</div>
    ${previewHtml}`;
  btn.disabled = tgItems.length === 0 && !text.includes('---PLAN---') && !text.includes('---EXECUTION-PLAN---');
}

function saveStandaloneCheckpoint() {
  if (!_standaloneLastParsed) return;
  const { tgItems, patchItems, ckpt, raw } = _standaloneLastParsed;

  // AC-4: si no hay ítems ni patches, no hacer nada
  if (!tgItems.length && !(patchItems && patchItems.length)) {
    showToast('warning', '⚠ Sin ítems para aplicar');
    return;
  }

  // Proyecto activo
  const activeProj = getActiveProject();
  if (!activeProj) {
    showToast('warning', '⚠ Selecciona un proyecto antes de aplicar');
    return;
  }

  // sessId sintético — no crea sesión real, solo referencia para mergeBacklogFromTG
  const syntheticSessId = 'standalone-' + Date.now();

  const _doApply = () => {    const mergeResult = _mergeBacklogWithProject(tgItems, syntheticSessId, activeProj.id);

    // R-202605-062: aplicar patches después del merge de ítems normales
    // B-202606-022: pasar slugMap para resolver [tmp:slug] en parentId de patches
    if (patchItems && patchItems.length) {
      const patchResult = applyPatchesFromTG(patchItems, syntheticSessId, { slugMap: mergeResult.slugMap });
      // Incorporar patches al mergeResult para que el panel diff los muestre (AC-10)
      if (patchResult.patched && patchResult.patched.length) {
        mergeResult.updated = [...(mergeResult.updated || []), ...patchResult.patched];
      }
    }

    // Merge CONTEXT-SECTION / MAP-SECTION si hay
    {
      const ctxSections = extractContextSections(raw);
      if (ctxSections.length) {
        mergeContextSections(ctxSections, activeProj.id);
      }
    }
    {
      const mapSections = extractHtmlMapSections(raw);
      if (mapSections.length) {
        mergeHtmlMapSections(mapSections, activeProj.id);
      }
    }
    // R-202604-076 + R-B: plan block — PLAN legacy y EXECUTION-PLAN nuevo
    // B-202605-XXX: usar _tryIngestPlan en lugar de savePlan directo — preserva scope:sprint al guardar scope:sesion
    if (raw.includes('---PLAN---') || raw.includes('---EXECUTION-PLAN---')) _tryIngestPlan(raw);

    // T-202606-032: registrar DOC-UPDATEs en el índice por proyecto — detectar conflictos.
    // Path JSON puro: usar docUpdates ya extraídos en _standaloneLastParsed.
    // Path legacy Markdown: extraer desde el texto crudo via extractDocUpdates.
    {
      const _ckptTitle = ckpt.titulo || '';
      const _isJsonFmtDoApply = !!(ckpt._isJsonFormat);
      const _docUpdates = _isJsonFmtDoApply
        ? (_standaloneLastParsed.docUpdates || [])
        : extractDocUpdates(raw);
      _docUpdates.forEach(update => {
        const { conflicto, msg } = processDocUpdate(update, _ckptTitle);
        if (conflicto && msg) showToast('warn', msg);
      });
    }
    // ── END T-202606-032 ──
    // T-202606-156: _tryIngestSprintProposal removido de _doApply standalone —
    // ya se ejecutó al aprobar Step 0. Llamarlo aquí crearía un sprint duplicado.

    closeStandaloneCheckpoint();

    renderBacklogList();
    renderStats();
    window.dispatchEvent(new CustomEvent('shell:render-tracker')); // B-202605-051: actualizar estado insession del radar tras CHECKPOINT standalone

    // Mostrar resultado en panel CHECKPOINT igual que el flujo sesión
    const hasMergeData = mergeResult.created.length || mergeResult.advanced.length ||
      mergeResult.retroceso.length || mergeResult.discarded.length ||
      mergeResult.updated.length || mergeResult.ignored.length;
    // B-202604-164: el panel diff (showCheckpointPanel) ya comunica el resultado —
    // el toast adicional causaba duplicado. Si no hay merge data → toast como fallback.
    if (hasMergeData) {
      showCheckpointPanel(mergeResult);
    } else {
      const _total = tgItems.length + (patchItems ? patchItems.length : 0);
      showToast('success', `✓ ${_total} ítem${_total !== 1 ? 's' : ''} aplicado${_total !== 1 ? 's' : ''} al backlog`);
    }
    _standaloneLastParsed = null;
  };

  // AC-1+2: pasar por showMergeDiffPanel — muestra panel de confirmación antes de aplicar
  // Construir ckptMeta desde campos narrativos del CHECKPOINT parseado
  const _ckptMetaStandalone = {
    resumen:     ckpt.resumen      || '',
    aprendizaje: ckpt.aprendizaje  || '',
    bloqueantes: ckpt.bloqueantes  || '',
    decision:    ckpt.decision     || '',
    proximoPaso: ckpt.proximoPaso  || '',
  };
  // T-202606-181: gate Step 0 — detectar ---SPRINT-PROPOSAL--- y presentarlo como Step 0
  // antes de cualquier otro cambio del DIFF. El sprint se crea solo al aprobar Step 0.
  // Si el founder rechaza Step 0: sprint no creado y ningún ítem aplicado (AC-3).
  // T-202606-017 AC-2: path JSON puro — leer sprint_proposal del objeto ya extraído en _standaloneLastParsed.
  // Fallback al path Markdown legacy: buscar ---SPRINT-PROPOSAL--- en raw.
  const _spProposalSa = _standaloneLastParsed.sprintProposal  // path JSON puro (T-202606-017)
    || ((raw && raw.includes('---SPRINT-PROPOSAL---')) ? parseSprintProposal(raw) : null);
  const _validSpProposalSa = (_spProposalSa && !_spProposalSa.error) ? _spProposalSa : null;

  // Gate: auto-abierto si no hay proposal — bloqueado hasta aprobación si la hay (AC-2 · AC-3)
  let _spStep0Approved = !_validSpProposalSa;

  // Wrapper: _doApply solo corre si el gate está abierto
  const _gatedDoApply = () => {
    if (!_spStep0Approved) return;
    _doApply();
  };

  if (_validSpProposalSa) {
    _ckptMetaStandalone.sprintProposal    = _validSpProposalSa;
    _ckptMetaStandalone.onApproveProposal = function() {
      // T-202606-206: atomicidad sprint + ítems — gate solo se abre si el sprint se crea con éxito.
      // Si _tryIngestSprintProposal retorna false (duplicado, campos faltantes u otro error),
      // _spStep0Approved permanece false y _doApply no corre (AC-1).
      const _spCreated = _tryIngestSprintProposal(raw); // crea el sprint — retorna id string o false
      if (_spCreated) {
        // T-202606-020 AC-1/AC-2/AC-3/AC-4: herencia automática de sprint a ítems del CHECKPOINT.
        // _spCreated es el id del sprint (prefijo corto, ej. "PP-S-03") — truthy siempre que el sprint se creó.
        // Mutar tgItems in-place antes de que _doApply aplique → el DIFF refleja el sprint asignado.
        _applySprintInheritanceToItems(tgItems, _spCreated);
        _spStep0Approved = true; // abre el gate solo si el sprint se creó (AC-2)
      }
    };
    _ckptMetaStandalone.onRejectProposal = function() {
      _spStep0Approved = false;         // gate queda cerrado — panel cierra sin aplicar nada
    };
  }

  // T-202606-021: Trigger 3 — sugerencia 1-tap de sprint para B con triggered_by en sprint activo.
  // No-bloqueante: si el founder ignora, el B se ingesta con sprint: icebox (comportamiento default).
  const _tgSuggestionSa = _buildTriggeredBySuggestion(tgItems);
  if (_tgSuggestionSa) {
    _ckptMetaStandalone.triggeredBySuggestion = {
      ..._tgSuggestionSa,
      onAccept: function() {
        _tgSuggestionSa.b.sprint = _tgSuggestionSa.suggestedSprint;
      },
      // onIgnore: no-op — el B conserva sprint: icebox (default ya presente en el ítem)
    };
  }

  closeStandaloneCheckpoint();
  showMergeDiffPanel(tgItems, syntheticSessId, activeProj.id, _gatedDoApply, _ckptMetaStandalone);
}




// T-202606-021: Trigger 3 — sugerencia 1-tap de sprint para B nuevo con triggered_by
// apuntando a un ítem en sprint activo. No es automático (a diferencia de Trigger 1/2):
// retorna { b, suggestedSprint } para que el DIFF muestre la sugerencia, o null si no aplica.
// Reglas (AC T-202606-021):
//  - Solo Bs nuevos ([pendiente-ID] o [tmp:slug]) sin sprint explícito distinto de icebox.
//  - triggered_by debe apuntar a un ítem cuyo sprint esté en estado 'active'.
//  - Si triggered_by apunta a icebox o sprint cerrado/programado → no se sugiere.
//  - Si el B ya declara sprint explícito ≠ icebox → no se sugiere (respetar lo declarado).
export function _buildTriggeredBySuggestion(tgItems) {
  if (!Array.isArray(tgItems) || !tgItems.length) return null;

  const activeSprints = getActiveSprints().filter(sp => sp.status === 'active');
  if (!activeSprints.length) return null;
  const activeSprintIds = new Set(activeSprints.map(sp => sp.id));

  // Mapa code -> sprint, para resolver triggered_by tanto contra ítems existentes
  // como contra otros ítems nuevos del mismo CHECKPOINT (referencias [tmp:slug]).
  const codeToSprint = new Map();
  (getActiveTracker().items || []).forEach(it => {
    if (it.code) codeToSprint.set(it.code, it.sprint);
  });
  tgItems.forEach(it => {
    if (it.code) codeToSprint.set(it.code, it.sprint || 'icebox');
  });

  for (const item of tgItems) {
    if (item.type !== 'B') continue;
    if (!_isPlaceholderCode(item.code)) continue; // solo B nuevo
    if (!item.triggeredBy && !item.triggered_by) continue;

    const sprintDeclared = item.sprint || 'icebox';
    if (sprintDeclared !== 'icebox') continue; // B ya declara sprint explícito — respetar

    const tgCode = item.triggeredBy || item.triggered_by;
    const targetSprint = codeToSprint.get(tgCode);
    if (!targetSprint || !activeSprintIds.has(targetSprint)) continue; // icebox / cerrado / no resuelto

    return { b: item, suggestedSprint: targetSprint };
  }

  return null;
}

// T-202606-128: parser de bloque ---SPRINT-PROPOSAL--- / ---SPRINT-PROPOSAL-END---
// Solo extrae y retorna el objeto — no modifica storage ni UI.
// Retorna { sprint, version_target, release_type, scope, goal, out_of_scope }
// o       { error: true, missing: [...campos] } si falta algún campo obligatorio.
// Retorna null si el bloque está ausente o malformado (sin terminador).
export function parseSprintProposal(text) {
  // AC-4: bloque ausente o sin terminador → null
  const match = text.match(/---SPRINT-PROPOSAL---\s*([\s\S]*?)\s*---SPRINT-PROPOSAL-END---/);
  if (!match) return null;

  const body  = match[1];
  const lines = body.split('\n');

  let sprint         = '';
  let version_target = '';
  let release_type   = '';
  let scope          = '';
  let goal           = '';
  const out_of_scope = [];

  let inOutOfScope = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // out_of_scope: bloque multi-línea (ítems con guión)
    if (/^out_of_scope\s*:/i.test(trimmed)) {
      inOutOfScope = true;
      // inline value after colon — ignorar, los ítems van en líneas con guión
      continue;
    }
    if (inOutOfScope) {
      // AC-3: cada ítem es "  - código: justificación"
      const itemM = trimmed.match(/^-\s+(.+)$/);
      if (itemM) { out_of_scope.push(itemM[1].trim()); continue; }
      // Línea sin guión dentro de out_of_scope → fin del bloque
      inOutOfScope = false;
    }

    const sprintM         = trimmed.match(/^sprint\s*:\s*(.+)$/i);
    const versionM        = trimmed.match(/^version_target\s*:\s*(.+)$/i);
    const releaseM        = trimmed.match(/^release_type\s*:\s*(.+)$/i);
    const scopeM          = trimmed.match(/^scope\s*:\s*(.+)$/i);
    const goalM           = trimmed.match(/^goal\s*:\s*(.+)$/i);

    if (sprintM)  { sprint         = sprintM[1].trim();  continue; }
    if (versionM) { version_target = versionM[1].trim(); continue; }
    if (releaseM) { release_type   = releaseM[1].trim(); continue; }
    if (scopeM)   { scope          = scopeM[1].trim();   continue; }
    if (goalM)    { goal           = goalM[1].trim();     continue; }
  }

  // AC-3: campos obligatorios — retornar error con lista de faltantes
  const REQUIRED = { sprint, version_target, release_type, scope, goal };
  const missing  = Object.entries(REQUIRED).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return { error: true, missing };

  // AC-1 + AC-2: objeto completo
  return { sprint, version_target, release_type, scope, goal, out_of_scope };
}

// R-202604-076 + R-B: parser de bloque ---PLAN--- / ---EXECUTION-PLAN---
// Backward compatible: ---PLAN--- se trata como scope 'sprint' implícito
// Nuevo: ---EXECUTION-PLAN--- agrega campo scope por sección (sprint | sesion)
//
// Formato ---EXECUTION-PLAN--- (nuevo):
// ---EXECUTION-PLAN---
// scope: sprint
// sprint: S-24
// sesiones:
//   - id: slug-unico
//     rol: FS · Rune
//     items: [R-202605-XXX]
//     archivos: [ai-tracker-session.js]
//     depende_de: []
// scope: sesion
// sesiones:
//   - id: sesion-activa
//     rol: FS · Rune
//     items: [R-202605-XXX]
//     archivos: []
//     depende_de: []
// ---EXECUTION-PLAN-END---
//
// Formato ---PLAN--- legacy (backward compat — scope 'sprint' implícito):
// ---PLAN---
// sprint: S-XX · Nombre
// sesiones:
//   - id: slug
//     rol: FS · Rune
//     items: [R-202604-054]
//     archivos: []
//     depende_de: []
// ---PLAN-END---
function parsePlanBlock(text) {
  // Detectar formato nuevo o legacy
  const isNew    = /---EXECUTION-PLAN---/.test(text);
  const startTag = isNew ? '---EXECUTION-PLAN---' : '---PLAN---';
  const endTag   = isNew ? '---EXECUTION-PLAN-END---' : '---PLAN-END---';

  const reBody = new RegExp(
    startTag.replace(/[-]/g, '\\-') + '\\s*([\\s\\S]*?)\\s*' + endTag.replace(/[-]/g, '\\-')
  );
  const match = text.match(reBody);
  if (!match) return null;

  const body  = match[1];
  const lines = body.split('\n');

  const sprints     = [];
  let currentSprint = null;
  let currentSess   = null;
  let inSesiones    = false;
  let pendingScope  = 'sprint'; // scope del próximo sprint — default backward compat

  const _flushSess = () => {
    if (currentSess && currentSprint) currentSprint.sessions.push(currentSess);
    currentSess = null;
  };
  const _flushSprint = () => {
    _flushSess();
    if (currentSprint) sprints.push(currentSprint);
    currentSprint = null;
    inSesiones    = false;
  };

  const _parseList = str => {
    const s = str.trim();
    if (!s || s === '[]') return [];
    return s.replace(/^\[|\]$/g, '').split(/[,\s]+/).map(t => t.trim()).filter(Boolean);
  };

  for (const rawLine of lines) {
    const line    = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) continue;

    // scope: sprint | sesion — solo en formato nuevo
    if (isNew) {
      const scopeM = trimmed.match(/^scope\s*:\s*(sprint|sesion)$/i);
      if (scopeM) {
        if (currentSprint) _flushSprint();
        pendingScope = scopeM[1].toLowerCase();
        continue;
      }
    }

    // sprint: S-XX  o  sin-sprint:
    const sprintM    = trimmed.match(/^sprint\s*:\s*(.+)$/i);
    const sinSprintM = trimmed.match(/^sin-sprint\s*:$/i);
    if (sprintM || sinSprintM) {
      _flushSprint();
      currentSprint = {
        id:       sprintM ? sprintM[1].trim() : null,
        scope:    isNew ? pendingScope : 'sprint',
        sessions: []
      };
      inSesiones = false;
      continue;
    }

    // sesiones: — puede aparecer sin sprint declarado (scope sesion directo)
    if (/^sesiones\s*:$/i.test(trimmed)) {
      if (!currentSprint) {
        _flushSprint();
        currentSprint = { id: null, scope: isNew ? pendingScope : 'sprint', sessions: [] };
      }
      inSesiones = true;
      continue;
    }

    if (!inSesiones || !currentSprint) continue;

    // Nueva sesión
    if (/^-\s+id\s*:/.test(trimmed)) {
      _flushSess();
      const idM = trimmed.match(/^-\s+id\s*:\s*(.+)$/i);
      currentSess = { id: idM ? idM[1].trim() : '', rol: '', items: [], archivos: [], depende_de: [] };
      continue;
    }

    if (!currentSess) continue;

    const rolM      = trimmed.match(/^rol\s*:\s*(.+)$/i);
    const itemsM    = trimmed.match(/^items?\s*:\s*(.*)$/i);
    const archivosM = trimmed.match(/^archivos?\s*:\s*(.*)$/i);
    const dependeM  = trimmed.match(/^depende_de\s*:\s*(.*)$/i);

    if (rolM)      { currentSess.rol        = rolM[1].trim();           continue; }
    if (itemsM)    { currentSess.items      = _parseList(itemsM[1]);    continue; }
    if (archivosM) { currentSess.archivos   = _parseList(archivosM[1]); continue; }
    if (dependeM)  { currentSess.depende_de = _parseList(dependeM[1]);  continue; }
  }
  _flushSprint();

  return sprints.length ? sprints : null;
}

// T-202605-430: componente reutilizable de hora — aplica en guardar sesión, sesiones rápidas y correctHora
// T-202605-019: exponer funciones migradas desde misc-ui para compatibilidad con locus-api.js
