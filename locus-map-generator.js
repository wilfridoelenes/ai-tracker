// [PP] mod:16 · autor:Rune · 2026-07-07 UTC-6
// TKT-202607-052: eliminado _mgBuildPlan(), planChecked, fileDefs.push de PLAN.md y entrada
// 'plan' del preview array. Reaplicado sobre esta base (mod:14) el fix de TKT-202607-041 —
// import roto de _tryIngestPlan (locus-session-parse.js ya no lo exporta) + bloque de ingesta
// automática con chip sprint-plan:auto-* — porque el mod:15 entregado en esa sesión no estaba
// disponible como archivo real al abrir esta sesión.
// [PP] mod:14 · autor:Rune · 2026-07-05 UTC-6
// TKT1 (limpieza post-rename): comentarios en L3 y L1741 actualizados — locus-backlog-archive.js → locus-backlog-historico.js. Sin cambio de código.
// INC-[pendiente-ID]: regresión detectada post-cierre de REQ-[tmp:req-vocab-historico] — este
// archivo importaba archiveClosedItems() de locus-backlog-historico.js (nombre previo al rename) y quedó fuera del scope
// de TKT2 (archivos declarados no incluían locus-map-generator.js). Import y 2 call sites
// actualizados a migrateClosedItemsToHistorico() / locus-backlog-historico.js — sin cambio
// de comportamiento, mismo contrato.
// [PP] mod:12 · autor:Rune · 2026-07-03 20:10 UTC-6
// INC-[pendiente-ID]: _doConfirmGenerate() ahora async — await migrateClosedItemsToHistorico() en ambos
// call sites (ZIP y fallback). Completa el fix de pérdida de datos de locus-backlog-historico.js:
// la persistencia en storage dedicado debe resolver antes de exponer la descarga al usuario.
/**
 * locus-map-generator.js
 * Versión: v1.3.4 | Última actualización: 2026-07-07 UTC-6 | TKT-202607-052: generador PLAN eliminado (feature cancelada, REQ-202607-014)
 * Módulo: Document Generator — MAP + CONTEXT + BACKLOG + Sprint Review + ZIP
 * Proyecto: Locus
 * Renombrado de ai-tracker-map-generator.js
 * R-202604-053 | R-202604-086 | R-202605-101
 */

import { migrateClosedItemsToHistorico } from './locus-backlog-historico.js';
import { getItems, itemKind } from './locus-backlog-core.js'; // TKT-D2: itemKind(item) — clasificación Gen2
import { editSprintInline } from './locus-backlog-sprints.js';
import { _getMapContent, _importContextMdFromText, exportHtmlMapMd, importHtmlMap } from './locus-docs.js';
import { buildBacklogMd } from './locus-session-save.js';
import { getProjContext } from './locus-proj-core.js';
import { _generateFullHistoryContent, exportBacklogMd, exportContextMd, exportFullHistoryMd } from './locus-backlog-generator.js';
import { _docPrefix, _effectiveVersion, _tplKey, getAISessions, getActiveProject, getActiveSprints, save } from './locus-storage.js';
import { showToast, showToastInline, toast } from './locus-toast.js';
import { render } from './locus-sesiones.js';

// ─── Utilidades de módulo ─────────────────────────────────────────────────────
export function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
export function normalize(v) { return String(v || '').replace(/^v/, '').trim(); }

// ─── Helper: sprint de referencia — activo o último cerrado ──────────────────
// B-[pendiente-ID]: el generador se usa post-cierre de sprint — si no hay sprint
// activo, tomar el último sprint cerrado (mayor closedAt) para el Sprint Review.
function _mgActiveSprint() {
  const all = getActiveSprints();
  // Sprint activo
  const active = all.find(s => s.status === 'active');
  if (active) return active;
  // Fallback: último sprint cerrado por closedAt desc
  const closed = all
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  return closed[0] || null;
}

// T-202606-148: con la zona sprint-especial eliminada del ecosistema (Q-INC reemplaza esa zona),
// _mgActiveSprintReal queda equivalente a _mgActiveSprint — se conserva como alias
// explícito para no romper los call sites existentes (openMapGenerator, _mgLoadSprintReview,
// _mgGetMapVersion) que ya distinguen semánticamente "sprint con version_target real".
function _mgActiveSprintReal() {
  const all = getActiveSprints();
  const active = all.find(s => s.status === 'active');
  if (active) return active;
  // Fallback: último sprint cerrado por closedAt desc
  const closed = all
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  return closed[0] || null;
}

// ─── Estado interno ──────────────────────────────────────────────────────────

const _mapGen = {
  files: [],          // [{ name, size, text }]
  previewMd: '',      // markdown del MAP generado
  generatedDocs: {},  // { map, context, backlog, review } — strings generados
  // Sprint Review — marcas de trasciende
  decisionTranscends: {},   // { decId: bool }
  learningTranscends: {},   // { sessId: bool }
};

// ─── Apertura / cierre ───────────────────────────────────────────────────────

export function openMapGenerator() {
  _mapGen.files = [];
  _mapGen.previewMd = '';
  _mapGen.generatedDocs = {};
  _mapGen.decisionTranscends = {};
  _mapGen.learningTranscends = {};

  _mgRenderFileList();
  _mgResetPreview();
  _mgUpdateBtn();

  // Inicializar versión
  const vInput = document.getElementById('mg-version-input');
  const fPreview = document.getElementById('mg-filename-preview');
  const prefix = _docPrefix();
  const ver = _effectiveVersion();
  if (vInput) vInput.value = ver;
  if (fPreview) fPreview.textContent = `${prefix}-MAP_${ver}.md`;

  // R-202605-147: inferir status al abrir — calculado una sola vez
  let _blItemsForStatus = [];
  try {
    const raw = localStorage.getItem(_tplKey('backlog-items'));
      _blItemsForStatus = raw ? JSON.parse(raw) : [];
  } catch(e) {}
  const _activeSp = _mgActiveSprintReal();
  const inferredStatus = _mgInferStatus(_activeSp, _blItemsForStatus);
  const _now2 = new Date();
  const _pad2 = n => String(n).padStart(2, '0');
  const tsLabel = `${_now2.getFullYear()}-${_pad2(_now2.getMonth()+1)}-${_pad2(_now2.getDate())} ${_pad2(_now2.getHours())}:${_pad2(_now2.getMinutes())}`;
  const spLabel = _activeSp ? _activeSp.id : ((() => {
    const allSp = getActiveSprints();
    const last = allSp.filter(s => s.status === 'closed').sort((a,b)=>(b.closedAt||0)-(a.closedAt||0))[0];
    return last ? last.id : '—';
  })());

  const previewStatusEl = document.getElementById('mg-status-preview');
  const generateBtn = document.getElementById('mg-generate-btn');
  if (previewStatusEl) {
    if (inferredStatus === 'closing') {
      previewStatusEl.textContent = 'Sprint en proceso de cierre. Confirma el cierre antes de generar el CONTEXT.';
      previewStatusEl.className = 'mg-status-preview mg-status-closing';
      if (generateBtn) generateBtn.disabled = true;
    } else {
      previewStatusEl.textContent = `Estado inferido: ${inferredStatus} · Sprint: ${spLabel} · Calculado: ${tsLabel}`;
      previewStatusEl.className = `mg-status-preview mg-status-${inferredStatus}`;
    }
  }

  // Cargar Sprint Review
  _mgLoadSprintReview();

  const el = document.getElementById('mg-overlay');
  if (!el) return;
  el.classList.add('mg-visible');
  document.body.classList.add('mg-body-lock');

  _mgInitDropzone();
}

function closeMapGenerator() {
  const el = document.getElementById('mg-overlay');
  if (el) el.classList.remove('mg-visible');
  document.body.classList.remove('mg-body-lock');
  _mgDropzoneInited = false; // B-202605-274: permitir re-inicialización en próxima apertura
  if (_mgDropzoneAC) { _mgDropzoneAC.abort(); _mgDropzoneAC = null; } // R2 — limpiar listeners
}

// ─── Sprint Review — carga de datos ─────────────────────────────────────────

function _mgLoadSprintReview() {
  const proj = getActiveProject();
  if (!proj) return;

  // Sprint activo real (version_target confiable)
  const activeSprint = _mgActiveSprintReal();

  const sprintLabel = document.getElementById('mg-review-sprint-label');
  if (sprintLabel) {
    sprintLabel.textContent = activeSprint ? activeSprint.id : '(sin sprint activo)';
  }

  // Decisiones del proyecto
  const decisions = Array.isArray(proj.decisions) ? proj.decisions : [];
  _mgRenderDecisions(decisions);

  // Aprendizajes: campo `learning` o `aprendizaje` de sessions del sprint activo
  const sessions = Array.isArray(proj.sessions) ? proj.sessions : [];
  const sprintSessions = activeSprint
    ? sessions.filter(s => {
        // Buscar sessions que referencian este sprint — via trackerRefs o campo sprint
        return (s.sprintId === activeSprint.id) || _mgSessionInSprint(s, activeSprint.id);
      })
    : sessions.slice(-20); // fallback: últimas 20 si no hay sprint

  // B-202605-226: log de diagnóstico cuando 0 sesiones matchean con sprint activo
  if (activeSprint && !sprintSessions.length && sessions.length) {
    console.warn(`[MapGen] 0 sesiones matchearon sprint ${activeSprint.id} — verificar sprintId en sesiones`);
  }

  _mgRenderLearnings(sprintSessions);
}

function _mgSessionInSprint(sess, sprintId) {
  // B-202605-226: guard — si getItems() no está en scope, omitir match por trackerRefs sin lanzar error
  if (!sprintId) return false;
  if (sess.sprintId === sprintId) return true;
  const refs = sess.trackerRefs || sess.backlogRefs || [];
  if (!refs.length) return false;
  if (typeof getItems() === 'undefined') return false;
  return refs.some(code => {
    const item = getItems().find(i => i.code === code);
    return item && item.sprint === sprintId;
  });
}

function _mgRenderDecisions(decisions) {
  const tbody = document.getElementById('mg-decisions-tbody');
  if (!tbody) return;

  if (!decisions.length) {
    tbody.innerHTML = '<tr class="mg-review-empty"><td colspan="4">Sin decisiones registradas.</td></tr>';
    return;
  }

  const sorted = [...decisions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  tbody.innerHTML = sorted.map(d => {
    const checked = _mapGen.decisionTranscends[d.id] ? 'checked' : '';
    return `<tr class="mg-review-row${checked ? ' mg-review-row--transcends' : ''}" data-id="${d.id}">
      <td class="mg-review-text">${esc(d.text)}</td>
      <td class="mg-review-meta">${esc(d.author || '—')}</td>
      <td class="mg-review-meta">${esc(d.date || '—')}</td>
      <td class="mg-col-trasciende"><label class="mg-trasciende-toggle"><input type="checkbox" ${checked} data-decision-id="${d.id}"><span>Sí</span></label></td>
    </tr>`;
  }).join('');
}

function _mgRenderLearnings(sessions) {
  const tbody = document.getElementById('mg-learnings-tbody');
  if (!tbody) return;

  // Filtrar sessions con campo learning/aprendizaje no vacío
  const withLearning = sessions.filter(s => {
    const txt = s.learning || s.aprendizaje || s.nextStep || '';
    return txt.trim().length > 0;
  });

  if (!withLearning.length) {
    tbody.innerHTML = '<tr class="mg-review-empty"><td colspan="4">Sin aprendizajes registrados en sesiones de este sprint.</td></tr>';
    return;
  }

  tbody.innerHTML = withLearning.map(s => {
    const txt = s.learning || s.aprendizaje || s.nextStep || '';
    const checked = _mapGen.learningTranscends[s.id] ? 'checked' : '';
    const dateStr = s.dateShort || (s.date ? s.date.slice(0, 10) : '—');
    return `<tr class="mg-review-row${checked ? ' mg-review-row--transcends' : ''}" data-id="${s.id}">
      <td class="mg-review-text">${esc(txt)}</td>
      <td class="mg-review-meta">${esc(s.title ? s.title.slice(0, 40) : '—')}</td>
      <td class="mg-review-meta">${esc(dateStr)}</td>
      <td class="mg-col-trasciende"><label class="mg-trasciende-toggle"><input type="checkbox" ${checked} data-learning-id="${s.id}"><span>Sí</span></label></td>
    </tr>`;
  }).join('');
}

function _mgToggleDecisionTranscends(id, val) {
  _mapGen.decisionTranscends[id] = val;
  // Re-render fila para reflejo visual
  const row = document.querySelector(`#mg-decisions-tbody tr[data-id="${id}"]`);
  if (row) row.classList.toggle('mg-review-row--transcends', val);
}

function _mgToggleLearningTranscends(id, val) {
  _mapGen.learningTranscends[id] = val;
  const row = document.querySelector(`#mg-learnings-tbody tr[data-id="${id}"]`);
  if (row) row.classList.toggle('mg-review-row--transcends', val);
}

function _mgSwitchReviewTab(tab, btn) {
  document.querySelectorAll('.mg-review-tab').forEach(b => b.classList.remove('mg-review-tab--active'));
  if (btn) btn.classList.add('mg-review-tab--active');
  const decisionsPanel = document.getElementById('mg-review-decisions');
  const learningsPanel = document.getElementById('mg-review-learnings');
  if (decisionsPanel) decisionsPanel.classList.toggle('mg-review-panel--hidden', tab !== 'decisions');
  if (learningsPanel) learningsPanel.classList.toggle('mg-review-panel--hidden', tab !== 'learnings');
}

// ─── Dropzone ────────────────────────────────────────────────────────────────

let _mgDropzoneInited = false;
let _mgDropzoneAC = null; // AbortController — limpia listeners al cerrar

function _mgInitDropzone() {
  if (_mgDropzoneInited) return;

  const zone = document.getElementById('mg-dropzone');
  const input = document.getElementById('mg-file-input');
  if (!zone || !input) return;
  _mgDropzoneInited = true;

  // R2 — AbortController: garantiza listeners limpios en reaperturas sucesivas
  if (_mgDropzoneAC) _mgDropzoneAC.abort();
  _mgDropzoneAC = new AbortController();
  const sig = { signal: _mgDropzoneAC.signal };

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('mg-drag-over');
  }, sig);
  zone.addEventListener('dragleave', () => zone.classList.remove('mg-drag-over'), sig);
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('mg-drag-over');
    _mgLoadFiles([...e.dataTransfer.files]);
  }, sig);
  zone.addEventListener('click', () => input.click(), sig);

  input.addEventListener('change', () => {
    _mgLoadFiles([...input.files]);
    input.value = '';
  }, sig);
}

function _mgLoadFiles(fileList) {
  const allowed = ['.js', '.css', '.html'];
  const excluded = /^(env|\.env)(\.local|\.dev|\.prod|\.test)?\.js$/i;
  const rejected = fileList.filter(f => excluded.test(f.name));
  rejected.forEach(f => {
    showToast('warning', `${f.name} excluido — archivos de entorno no se importan al MAP`);
  });

  // T-202606-031: si se arrastra un .md con patrón vX.Y.Z en el nombre, extraer versión y popular el input
  // El .md no se agrega a _mapGen.files — solo sirve para poblar el campo versión del header interno
  const mdFiles = fileList.filter(f => f.name.toLowerCase().endsWith('.md'));
  mdFiles.forEach(f => {
    const verMatch = f.name.match(/v(\d+\.\d+(?:\.\d+)*)/i);
    if (verMatch) {
      const vInput = document.getElementById('mg-version-input');
      const fPreview = document.getElementById('mg-filename-preview');
      const prefix = _docPrefix();
      if (vInput) vInput.value = `v${verMatch[1]}`;
      if (fPreview) fPreview.textContent = `${prefix}-MAP_v${verMatch[1]}.md`;
    }
    // .md sin patrón vX.Y.Z: ignorar silenciosamente — comportamiento actual conservado como fallback (AC edge case)
  });

  const valid = fileList.filter(f => !excluded.test(f.name) && allowed.some(ext => f.name.toLowerCase().endsWith(ext)));
  if (!valid.length) return;

  let pending = valid.length;

  valid.forEach(file => {
    const existingIdx = _mapGen.files.findIndex(f => f.name === file.name);
    const reader = new FileReader();
    reader.onload = e => {
      if (existingIdx !== -1) {
        _mapGen.files[existingIdx] = { name: file.name, size: file.size, text: e.target.result };
        showToast('info', `${file.name} reemplazado — versión anterior descartada`);
      } else {
        _mapGen.files.push({ name: file.name, size: file.size, text: e.target.result });
      }
      pending--;
      if (pending === 0) { _mgRenderFileList(); _mgUpdateBtn(); }
    };
    reader.readAsText(file);
  });
}

// ─── Lista de archivos ───────────────────────────────────────────────────────

function _mgRenderFileList() {
  const list = document.getElementById('mg-file-list');
  if (!list) return;

  if (!_mapGen.files.length) {
    list.innerHTML = '<p class="mg-empty-files">Sin archivos adjuntados</p>';
    return;
  }

  list.innerHTML = _mapGen.files.map((f, i) => {
    const kb = (f.size / 1024).toFixed(1);
    const ext = f.name.split('.').pop().toUpperCase();
    const typeClass = { JS: 'mg-tag-js', CSS: 'mg-tag-css', HTML: 'mg-tag-html' }[ext] || '';
    return `
      <div class="mg-file-row">
        <span class="mg-file-tag ${typeClass}">${ext}</span>
        <span class="mg-file-name">${f.name}</span>
        <span class="mg-file-size">${kb} KB</span>
        <button class="mg-file-remove" data-remove-idx="${i}" title="Eliminar">✕</button>
      </div>`;
  }).join('');
}

function _mgRemoveFile(idx) {
  _mapGen.files.splice(idx, 1);
  _mgRenderFileList();
  _mgUpdateBtn();
  _mgResetPreview();
}

// ─── Botón Generar ───────────────────────────────────────────────────────────

function _mgUpdateBtn() {
  const btn = document.getElementById('mg-generate-btn');
  if (!btn) return;
  // Habilitar si hay archivos O si algún output no requiere archivos (CONTEXT, BACKLOG, Review)
  const mapChecked = document.getElementById('mg-out-map')?.checked;
  const needsFiles = mapChecked;
  btn.disabled = needsFiles && _mapGen.files.length === 0;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

// AC-17: _mgParseFile realiza Pasada 1 — construye lista de funciones con área heredada de sección.
// Pasada 2 (exports + calls) se ejecuta en _generateMap() sobre el índice global de todas las funciones.
// T-202606-145 F-02: lee campo mod del header de identidad (primera línea no-import del archivo).
function _mgParseFile(name, text) {
  const ext = name.split('.').pop().toLowerCase();
  const lines = text.split('\n');
  const total = lines.length;
  const entries = [];

  // T-202606-145 F-02: extraer mod del header de identidad
  // El header tiene formato: // [XX] vN.N · sprint:XX-S-NN · mod:N · autor:Rol · timestamp
  // Para ESM el header puede estar después de los imports — buscar en las primeras 10 líneas
  let modValue = null;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const modMatch = lines[i].match(/\bmod:(\d+)\b/);
    if (modMatch) { modValue = parseInt(modMatch[1], 10); break; }
  }

  if (ext === 'js') {
    // T-202606-021: currentSection eliminado como fallback de Área — causa raíz del Gate de
    // Área inválida en OBDS §8. area = guessed || 'Internal' en los tres paths, sin excepción.
    lines.forEach((line, i) => {
      const lineNum = i + 1;

      const fnMatch = line.match(/^\s*(?:async\s+)?function\s+(\w+)\s*\(/);
      if (fnMatch) {
        // AC-01: área = guessArea → si vacío, 'Internal' — nunca currentSection
        const guessed = _mgGuessArea(fnMatch[1], line);
        const area = guessed || 'Internal';
        entries.push({ line: `L${lineNum}`, fn: fnMatch[1], area, bodyStart: lineNum });
        return;
      }
      const arrowMatch = line.match(/^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(?[^)]*\)?\s*=>/);
      if (arrowMatch) {
        const guessed = _mgGuessArea(arrowMatch[1], line);
        const area = guessed || 'Internal';
        entries.push({ line: `L${lineNum}`, fn: arrowMatch[1], area, bodyStart: lineNum });
        return;
      }
      const exprMatch = line.match(/^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/);
      if (exprMatch) {
        const guessed = _mgGuessArea(exprMatch[1], line);
        const area = guessed || 'Internal';
        entries.push({ line: `L${lineNum}`, fn: exprMatch[1], area, bodyStart: lineNum });
      }
    });
  } else if (ext === 'css') {
    // T-202606-144: extraer secciones CSS via comentarios de sección
    // Detecta: /* ── Nombre ── */ · /* === Nombre === */ · /* --- Nombre --- */
    lines.forEach((line, i) => {
      const secMatch = line.match(/\/\*\s*[─\-═=]{2,}\s*(.+?)\s*[─\-═=]{2,}\s*\*\//);
      if (secMatch) entries.push({ line: `L${i + 1}`, fn: secMatch[1].trim() });
    });
    // Fallback: sin secciones declaradas → fila única
    if (!entries.length) entries.push({ line: 'L1', fn: '(sin secciones declaradas)' });
  } else if (ext === 'html') {
    lines.forEach((line, i) => {
      const secMatch = line.match(/<!--\s*[═=]{2,}\s*(.+?)\s*[═=]{2,}\s*-->/);
      if (secMatch) entries.push({ line: `L${i + 1}`, fn: secMatch[1].trim(), area: 'Sección' });
    });
  }

  return { name, ext, total, entries, lines, mod: modValue };
}

function _mgGuessArea(fnName, _line) {
  const n = fnName.toLowerCase();
  if (n.startsWith('render')) return 'Render';
  if (n.startsWith('open') || n.startsWith('close')) return 'UI';
  if (n.startsWith('save') || n.startsWith('load')) return 'Save / Load';
  if (n.startsWith('parse')) return 'Parser';
  if (n.startsWith('export') || n.startsWith('import') || n.startsWith('download')) return 'Export / Import';
  if (n.startsWith('show') || n.startsWith('hide') || n.startsWith('toggle')) return 'UI';
  if (n.startsWith('build') || n.startsWith('create') || n.startsWith('make')) return 'Builder';
  if (n.startsWith('get') || n.startsWith('set')) return 'Utils';
  if (n.startsWith('on') || n.startsWith('handle')) return 'Events';
  if (n.startsWith('_')) return 'Internal';
  return '';
}

// ─── Versioning — bump MINOR ─────────────────────────────────────────────────

function _mgBumpMinor(version) {
  // B-202605-228: guard — nunca recibir undefined o string "undefined"
  if (!version || version === 'undefined') version = _mgGetVersion();
  // Soporta: v3.1.0.0, v3.1.0, 3.1.0
  const clean = version.replace(/^v/, '');
  const parts = clean.split('.');
  if (parts.length < 2) return version;
  // MINOR es el segundo segmento
  parts[1] = String(parseInt(parts[1], 10) + 1);
  // Reset de segmentos posteriores a 0
  for (let i = 2; i < parts.length; i++) parts[i] = '0';
  return (version.startsWith('v') ? 'v' : '') + parts.join('.');
}


export function _mgGetVersion() {
  // B-202605-228: rechazar string literal "undefined" — ocurre si la versión no estaba lista al abrir el overlay
  // T-202605-018: input manual del overlay tiene prioridad — resto delega a _effectiveVersion
  const input = document.getElementById('mg-version-input');
  const raw = input ? input.value.trim() : '';
  if (raw && raw !== 'undefined') return raw;
  // R-202605-002: delegar a _effectiveVersion — fuente de verdad canónica de versión
  return _effectiveVersion();
}

// T-202606-148: versión canónica para el MAP — version_target del sprint activo
// T-202606-148 + B-202606-088: version_target del sprint activo — fallback a sprint cerrado más
// reciente (vía _mgActiveSprint), luego a input + toast. El MAP nunca declara n/a.
// B-202606-088: la condición previa exigía status === 'active', lo que descartaba el
// version_target real cuando _mgActiveSprint() ya había caído a su fallback de sprint cerrado —
// el sprint cerrado nunca podía pasar ese chequeo, y el flujo caía al input/_effectiveVersion()
// produciendo n/a. _mgActiveSprintReal() cae al fallback de sprint cerrado cuando no hay
// sprint regular activo.
function _mgGetMapVersion() {
  const activeSp = _mgActiveSprintReal();
  if (activeSp && activeSp.version_target && activeSp.version_target.trim() && activeSp.version_target.trim() !== 'undefined') {
    return activeSp.version_target.trim();
  }
  // Sin sprint activo ni cerrado con version_target real — fallback a input configurable + toast
  const input = document.getElementById('mg-version-input');
  const raw = input ? input.value.trim() : '';
  const fallback = (raw && raw !== 'undefined') ? raw : _effectiveVersion();
  showToast('warning', 'Sin sprint activo ni cerrado con versión real — versión del MAP tomada del campo de versión. Verifica antes de descargar.');
  return fallback || '—';
}

// ─── Generación principal ────────────────────────────────────────────────────

function generateDocuments() {
  const mapChecked     = document.getElementById('mg-out-map')?.checked;
  const contextChecked = document.getElementById('mg-out-context')?.checked;
  const backlogChecked = document.getElementById('mg-out-backlog')?.checked;
  const reviewChecked  = document.getElementById('mg-out-review')?.checked;

  if (!mapChecked && !contextChecked && !backlogChecked && !reviewChecked) {
    showToast('warning', 'Selecciona al menos un documento a generar.');
    return;
  }
  if (mapChecked && !_mapGen.files.length) {
    showToast('warning', 'Adjunta archivos para generar el MAP.');
    return;
  }

  // T-202605-504: validar campos obligatorios del CONTEXT antes de generar
  // R1 — desmarca CONTEXT + avisa con link a editar sprint si faltan name/goal
  // B-[pendiente-ID]: validación fallida descarta solo CONTEXT — no aborta los demás documentos
  let contextCheckedFinal = contextChecked;
  if (contextChecked) {
    const _valSp = _mgActiveSprintReal();
    if (_valSp) {
      const _missingName = !_valSp.name || !_valSp.name.trim();
      const _missingGoal = !_valSp.goal || !String(_valSp.goal).trim();
      if (_missingName || _missingGoal) {
        // Desmarcar CONTEXT automáticamente
        const _ctxChk = document.getElementById('mg-out-context');
        if (_ctxChk) _ctxChk.checked = false;
        contextCheckedFinal = false;
        // Toast warning con acción de editar sprint
        const _campo = _missingName ? 'nombre' : 'goal';
        showToastInline('warning', `El sprint no tiene ${_campo}. CONTEXT desmarcado. <button class="mg-toast-edit-sprint" data-mg-action="edit-sprint" data-sprint-id="${_valSp.id}">Editar sprint →</button>`);
        // B-[pendiente-ID]: no hacer return — continuar con los demás documentos seleccionados
      }
      // AC3: status active + backlog.pending = 0 con backlog.total > 0 — advertencia con opción continuar
      const _valStatus = _mgInferStatus(_valSp, (() => {
        try {
          const raw = localStorage.getItem(_tplKey('backlog-items'));
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
      })());
      if (_valStatus === 'active') {
        const _valItems = (() => {
          try {
            const raw = localStorage.getItem(_tplKey('backlog-items'));
              return raw ? JSON.parse(raw) : [];
          } catch(e) { return []; }
        })();
        const _valTotal   = _valItems.length;
        const _valPending = _valItems.filter(i => i.status === 'pendiente').length;
        if (_valTotal > 0 && _valPending === 0) {
          // eslint-disable-next-line no-alert
          const ok = window.confirm('⚠ El backlog no tiene ítems pendientes pero el sprint está activo.\n¿Continuar con la exportación del CONTEXT?');
          if (!ok) return;
        }
      }
    }
  }

  const btn = document.getElementById('mg-generate-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }

  // B-202605-XXX: calcular versión bumpeada una sola vez antes de generar
  // — los generadores reciben bumpedVer para que preview y archivos sean consistentes
  const currentVer = _mgGetVersion();
  const input = document.getElementById('mg-version-input');
  const userDeclared = input && input.value.trim() && input.value.trim() !== 'undefined';
  const bumpedVer = userDeclared ? currentVer : _mgBumpMinor(currentVer);

  _mapGen.generatedDocs = {};
  _mapGen.generatedDocs._bumpedVer = bumpedVer; // B-202605-496: fuente de verdad para confirmMapGenerator()

  if (mapChecked)     _mapGen.generatedDocs.map     = _generateMap(bumpedVer);
  if (contextCheckedFinal) _mapGen.generatedDocs.context  = _generateContext(bumpedVer);
  if (backlogChecked) _mapGen.generatedDocs.backlog   = _generateBacklog(bumpedVer);
  if (reviewChecked)  _mapGen.generatedDocs.review    = _generateSprintReview(bumpedVer);

  // Compatibilidad: _mapGen.previewMd = MAP si se generó
  if (_mapGen.generatedDocs.map) _mapGen.previewMd = _mapGen.generatedDocs.map;

  if (btn) { btn.disabled = false; btn.textContent = 'Generar'; }

  _mgShowPreview(_mapGen.generatedDocs);
}

// Alias para compatibilidad con código que llame generateMap() directamente
function generateMap() { generateDocuments(); }

// ─── Generador MAP ───────────────────────────────────────────────────────────

function _generateMap(ver) {
  // R-202605-137: produce JSON puro — parseable con JSON.parse sin regex
  // T-202605-491: incluye campo status en objeto raíz — coherencia con CONTEXT
  // B-202605-494: acepta ver como parámetro; fallback a _mgGetVersion() si no se pasa
  // [pendiente-ID]: AC-17/18/19 — dos pasadas para exports + calls cruzados
  const order = { js: 0, css: 1, html: 2 };
  const sorted = [..._mapGen.files].sort((a, b) => {
    const ea = a.name.split('.').pop().toLowerCase();
    const eb = b.name.split('.').pop().toLowerCase();
    return (order[ea] ?? 9) - (order[eb] ?? 9);
  });

  const version = _mgGetMapVersion(); // T-202606-148: version_target del sprint activo — fallback a input + toast
  const now = _mgNow();
  const project = _docPrefix();

  // Pasada 1 — parsear todos los archivos y construir índice global de funciones
  // AC-17: índice global { fnName → [fileName, ...] } (un nombre puede existir en múltiples archivos)
  const parsed = sorted.map(f => _mgParseFile(f.name, f.text));
  const fnIndex = {}; // { fnName → Set<fileName> }
  parsed.forEach(p => {
    if (p.ext !== 'js') return;
    p.entries.forEach(e => {
      if (!fnIndex[e.fn]) fnIndex[e.fn] = new Set();
      fnIndex[e.fn].add(p.name);
    });
  });

  // T-202605-491: inferir status — reutiliza _mgInferStatus() de R-202605-147
  let _blItemsForMap = [];
  try {
    const raw = localStorage.getItem(_tplKey('backlog-items'));
      _blItemsForMap = raw ? JSON.parse(raw) : [];
  } catch(e) {}
  const _activeSpForMap = _mgActiveSprintReal();
  const mapStatus = _mgInferStatus(_activeSpForMap, _blItemsForMap);

  // Nombres de archivos en el MAP para validar calls (AC-12: solo archivos presentes en el MAP)
  const mapFileNames = new Set(parsed.map(p => p.name));

  // Pasada 2 — detectar referencias cruzadas para poblar exports y calls simultáneamente
  // AC-17: índice global ya construido en Pasada 1
  // AC-18: exports y calls se derivan del mismo recorrido en Pasada 2
  // AC-05: detección en dos capas — cuerpo de función + 3 líneas previas
  // AC-11: exports granular — solo funciones referenciadas en el cuerpo del caller (sin comentarios/strings)
  // AC-19: si el mismo nombre existe en múltiples archivos, calls incluye todos

  // exportsMap: { fileName → Set<fnName> } — funciones de este archivo referenciadas desde otros
  // callsMap:   { fileName → Map<fnName, Set<calledFileName>> } — por función, archivos a los que llama
  const exportsMap = {};
  const callsMap   = {}; // { callerFileName → Map<fnName, Set<targetFileName>> }

  parsed.forEach(p => {
    if (!exportsMap[p.name]) exportsMap[p.name] = new Set();
    if (!callsMap[p.name])   callsMap[p.name]   = new Map();
  });

  // Pre-calcular texto limpio (sin comentarios ni strings) de cada archivo para AC-11
  const cleanTextCache = {};
  parsed.forEach(p => {
    if (p.ext === 'js') {
      cleanTextCache[p.name] = _mgStripCommentsAndStrings(p.lines.join('\n'));
    }
  });

  // Para cada función de cada archivo caller, determinar calls y contribuir a exports
  parsed.forEach(callerFile => {
    if (callerFile.ext !== 'js') return;
    const callerName = callerFile.name;
    const callerLines = callerFile.lines;
    const callerEntries = callerFile.entries;

    callerEntries.forEach((entry, idx) => {
      // AC-05: cuerpo = desde 3 líneas antes de la declaración hasta inicio de siguiente función
      const nextEntry = callerEntries[idx + 1];
      const nextBodyStart = nextEntry ? nextEntry.bodyStart : null;
      const fnBodyRaw = _mgGetFunctionBody(callerLines, entry.bodyStart, nextBodyStart, 3);
      // AC-11: texto limpio para exports (sin comentarios ni strings)
      const fnBodyClean = _mgStripCommentsAndStrings(fnBodyRaw);

      const callsForFn = new Set();

      parsed.forEach(targetFile => {
        if (targetFile.name === callerName) return; // no auto-referencia
        if (targetFile.ext !== 'js') return;
        const targetName = targetFile.name;
        if (!mapFileNames.has(targetName)) return; // AC-12

        let referencesTarget = false;

        // Capa 1: referencia explícita al nombre de archivo en el cuerpo (raw, incluyendo comentarios/imports)
        // AC-05 Capa 1: nombre de archivo en el cuerpo completo de la función + 3 líneas previas
        const baseName = targetName.replace(/\.js$/i, '');
        const explicitRef = new RegExp(
          '(?:import|require|from|//|/\\*).*?' + _mgEscapeRegExp(baseName),
          'i'
        );
        if (explicitRef.test(fnBodyRaw)) {
          referencesTarget = true;
        }

        // Capa 2: fallback — nombres de funciones del target en el cuerpo limpio del caller
        // AC-05 Capa 2: nombres de funciones conocidas del MAP como fallback
        if (!referencesTarget) {
          for (const tEntry of targetFile.entries) {
            if (tEntry.fn && tEntry.fn.length > 2) {
              const fnCallRegex = new RegExp('\\b' + _mgEscapeRegExp(tEntry.fn) + '\\s*\\(', '');
              if (fnCallRegex.test(fnBodyClean)) {
                referencesTarget = true;
                break;
              }
            }
          }
        }

        if (referencesTarget) {
          callsForFn.add(targetName);

          // AC-11: exports granular — solo las funciones de targetFile referenciadas
          // en el cuerpo limpio de esta función caller (no todas las funciones del target)
          targetFile.entries.forEach(tEntry => {
            if (!tEntry.fn || tEntry.fn.length <= 2) return;
            const fnCallRegex = new RegExp('\\b' + _mgEscapeRegExp(tEntry.fn) + '\\s*\\(', '');
            if (fnCallRegex.test(fnBodyClean)) {
              exportsMap[targetName].add(tEntry.fn);
            }
          });

          // AC-19: si el mismo nombre de función existe en múltiples archivos,
          // calls incluye todos los archivos donde ese nombre existe.
          // Capa 2 pudo matchear por nombre de función que existe en varios archivos —
          // garantizar que callsForFn incluye todos los archivos con ese nombre.
          for (const tEntry of targetFile.entries) {
            if (tEntry.fn && tEntry.fn.length > 2) {
              const fnCallRegex = new RegExp('\\b' + _mgEscapeRegExp(tEntry.fn) + '\\s*\\(', '');
              if (fnCallRegex.test(fnBodyClean) && fnIndex[tEntry.fn]) {
                fnIndex[tEntry.fn].forEach(ambigFile => {
                  if (ambigFile !== callerName && mapFileNames.has(ambigFile)) {
                    callsForFn.add(ambigFile);
                  }
                });
              }
            }
          }
        }
      });

      // AC-09: siempre emitir calls por función (vacío [] si ninguno)
      callsMap[callerName].set(entry.fn, callsForFn);
    });
  });

  // AC-07: changed_in — ID del sprint más reciente en comentarios (R/T/B-YYYYMM-NNN), null si ninguno
  // AC-10: si no hay IDs → changed_in: null, campo siempre presente
  const sprintIdPattern = /[RTB]-\d{6}-\d{3}/g;

  // AC-06: Construir changed_in por archivo
  function _mgChangedIn(fileLines) {
    const text = fileLines.join('\n');
    const matches = text.match(sprintIdPattern);
    if (!matches || !matches.length) return null;
    // Ordenar descendente (YYYYMM-NNN lexicográfico) y tomar el más reciente
    const sorted = [...new Set(matches)].sort((a, b) => b.localeCompare(a));
    return sorted[0];
  }

  // AC-07: size_signal — low < 500, medium 500–2000, high > 2000
  function _mgSizeSignal(lines) {
    if (lines < 500) return 'low';
    if (lines <= 2000) return 'medium';
    return 'high';
  }

  // Construir array files con todos los campos nuevos
  const files = parsed.map(p => {
    // AC-11: exports sin duplicados — solo funciones realmente referenciadas desde otros archivos
    const exportsArr = p.ext === 'js'
      ? [...(exportsMap[p.name] || new Set())]
      : [];

    // AC-04 + AC-09 + AC-12: calls a nivel archivo — unión de todos los archivos llamados por cualquier función
    // (para mantener el campo calls de nivel archivo como antes, compatibilidad de schema)
    const fileLevelCalls = new Set();
    if (p.ext === 'js' && callsMap[p.name]) {
      callsMap[p.name].forEach(fileSet => fileSet.forEach(f => fileLevelCalls.add(f)));
    }
    const callsArr = [...fileLevelCalls];

    // AC-06 + AC-10
    const changedIn = _mgChangedIn(p.lines);

    // AC-07
    const sizeSignal = _mgSizeSignal(p.total);

    return {
      name: p.name,
      type: p.ext,
      lines: p.total,
      mod: p.mod !== null ? p.mod : null,   // T-202606-145 F-02: del header de identidad; null si ausente
      exports: exportsArr,          // AC-03
      calls: callsArr,              // AC-04 nivel archivo
      changed_in: changedIn,        // AC-06
      size_signal: sizeSignal,      // AC-07
      functions: p.entries.map(e => {
        // AC-04/AC-05: calls a nivel función — archivos a los que esta función llama
        let fnCalls = [];
        if (p.ext === 'js' && callsMap[p.name] && callsMap[p.name].has(e.fn)) {
          fnCalls = [...callsMap[p.name].get(e.fn)];
        }
        // R3-T2: isPublic — true si la función es referenciada desde otros módulos (exportsMap)
        const isPublic = p.ext === 'js'
          ? (exportsMap[p.name] || new Set()).has(e.fn)
          : false;
        return {
          line: e.line,
          name: e.fn,
          area: e.area,               // AC-01: nunca vacío — 'Internal' como default
          calls: fnCalls,             // AC-04/AC-05: archivos llamados por esta función
          isPublic                    // R3: true = API pública, false = internal
        };
      })
    };
  });

  // R-202605-137 (rev): output Markdown — una sección ## por archivo, tabla de funciones por sección
  // AC-1: un archivo .md — bloque ```json eliminado
  // AC-2: sección ## nombre-archivo.ext por cada archivo
  // AC-3: cada sección incluye líneas totales · size_signal · changed_in
  // AC-4: tabla | Función | Área | Calls | por archivo JS
  // AC-5: exports como línea **Exports:** fn1, fn2 si existen
  // AC-6: CSS con solo metadata, HTML con tabla de secciones sin columna Calls
  // AC-7: campos version/updated/project/status en cabecera del archivo
  // R3: JS separado en subsecciones ### Exports y ### Internal
  // R2: funciones públicas incluyen columna Used by

  // R2-T1: construir índice inverso { fnName → Set<callerFileName> }
  // Para cada función pública de cada módulo, determinar qué módulos la invocan
  const usedByIndex = {}; // { fnName → Set<callerFileName> }
  files.forEach(callerFile => {
    if (callerFile.type !== 'js') return;
    callerFile.functions.forEach(fn => {
      if (!fn.calls || !fn.calls.length) return;
      fn.calls.forEach(targetFileName => {
        const targetFile = files.find(f => f.name === targetFileName);
        if (!targetFile) return;
        targetFile.functions.forEach(tFn => {
          if (!tFn.isPublic) return;
          if (!usedByIndex[tFn.name]) usedByIndex[tFn.name] = new Set();
          usedByIndex[tFn.name].add(callerFile.name);
        });
      });
    });
  });

  let md = `# ${project}-MAP_${version}.md\n`;
  md += `<!-- Versión: ${version} | Actualizado: ${now} UTC-6 | Proyecto: ${project} | Status: ${mapStatus} -->\n`;
  // T-202606-147: segunda línea de header — infra_version leído automáticamente desde proj.infraVersion
  // T4 ([pendiente-ID]): si infraVersion está ausente, undefined, null o vacía tras trim — emitir
  // literal de ausencia en vez de omitir la línea. La línea es siempre la 3ª del header, sin excepción.
  // Formato canónico OB-Strategy §5b: <!-- **infra_version: [N]** | BR-Core vX.X · ... -->
  const _ivProj = getActiveProject();
  const _ivRaw = (_ivProj && _ivProj.infraVersion) ? String(_ivProj.infraVersion).trim() : '';
  if (_ivRaw) {
    md += `<!-- **infra_version: ${_ivRaw}** -->\n`;
  } else {
    md += `<!-- infra_version: no declarada en proyecto -->\n`;
  }
  md += '\n';

  files.forEach(f => {
    const changedStr = f.changed_in ? f.changed_in : '—';
    const modStr = f.mod !== null && f.mod !== undefined ? String(f.mod) : '1'; // T-202606-145 F-02 · gap G1: CSS sin header emite mod:1 como inicial
    md += `## ${f.name}\n`;
    md += `**Líneas:** ${f.lines} · **mod:** ${modStr} · **Size:** ${f.size_signal} · **Changed in:** ${changedStr}\n\n`;

    if (f.type === 'js') {
      // R3-T3: separar en públicas e internas
      const publicFns   = f.functions.filter(fn => fn.isPublic);
      const internalFns = f.functions.filter(fn => !fn.isPublic);

      // ### Exports — solo si hay funciones públicas
      if (publicFns.length) {
        md += `### Exports\n\n`;
        md += `| Función | Área | Calls | Used by |\n`;
        md += `|---------|------|-------|---------|\n`;
        publicFns.forEach(fn => {
          const callsStr  = fn.calls && fn.calls.length ? fn.calls.join(', ') : '—';
          const usedBySet = usedByIndex[fn.name];
          const usedByStr = usedBySet && usedBySet.size ? [...usedBySet].sort().join(', ') : '—';
          md += `| ${fn.line} · ${fn.name} | ${fn.area} | ${callsStr} | ${usedByStr} |\n`;
        });
        md += '\n';
      }

      // ### Internal
      if (internalFns.length) {
        md += `### Internal\n\n`;
        md += `| Función | Área | Calls |\n`;
        md += `|---------|------|-------|\n`;
        internalFns.forEach(fn => {
          const callsStr = fn.calls && fn.calls.length ? fn.calls.join(', ') : '—';
          md += `| ${fn.line} · ${fn.name} | ${fn.area} | ${callsStr} |\n`;
        });
        md += '\n';
      }

    } else if (f.type === 'html') {
      // HTML — tabla de secciones sin columna Calls
      if (f.functions && f.functions.length) {
        md += `| Línea | Sección / Selector |\n`;
        md += `|-------|--------------------|\n`;
        f.functions.forEach(fn => {
          md += `| ${fn.line} | ${fn.name} |\n`;
        });
        md += '\n';
      }
    } else if (f.type === 'css') {
      // T-202606-144: tabla Línea|Sección para entradas CSS
      md += `| Línea | Sección |\n`;
      md += `|-------|----------|\n`;
      f.functions.forEach(fn => {
        md += `| ${fn.line} | ${fn.name} |\n`;
      });
      md += '\n';
    }
    // CSS: tabla Línea|Sección — HTML: tabla Línea|Sección/Selector (R1)
  });

  return md.trimEnd() + '\n';
}

// Helper: escapar caracteres especiales de RegExp
function _mgEscapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// AC-11: eliminar comentarios de línea (//), bloque (/* */), y strings literales (' " `) del texto
// para que exports no cuente menciones en comentarios ni dentro de strings.
function _mgStripCommentsAndStrings(text) {
  // Orden: strings primero (para no confundir // dentro de un string), luego comentarios
  let out = '';
  let i = 0;
  const len = text.length;
  while (i < len) {
    // String comilla doble
    if (text[i] === '"') {
      i++;
      while (i < len && text[i] !== '"') {
        if (text[i] === '\\') i++; // escape
        i++;
      }
      i++; // cierre
      continue;
    }
    // String comilla simple
    if (text[i] === "'") {
      i++;
      while (i < len && text[i] !== "'") {
        if (text[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    // Template literal
    if (text[i] === '`') {
      i++;
      while (i < len && text[i] !== '`') {
        if (text[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    // Comentario de bloque /* */
    if (text[i] === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < len && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // Comentario de línea //
    if (text[i] === '/' && text[i + 1] === '/') {
      while (i < len && text[i] !== '\n') i++;
      continue;
    }
    out += text[i];
    i++;
  }
  return out;
}

// AC-04/AC-05: extraer texto de cuerpo de función + N líneas previas a la declaración.
// bodyStartLine: número de línea 1-based de la declaración.
// allLines: array de strings (las líneas del archivo).
// nextBodyStart: número de línea 1-based de la siguiente función (o fin de archivo).
// prevLines: cuántas líneas previas incluir (AC-05 especifica 3).
function _mgGetFunctionBody(allLines, bodyStartLine, nextBodyStart, prevLines) {
  const start = Math.max(0, bodyStartLine - 1 - prevLines); // índice 0-based, incluyendo N previas
  const end   = nextBodyStart ? nextBodyStart - 1 : allLines.length; // índice 0-based exclusivo
  return allLines.slice(start, end).join('\n');
}
// ─── Generador CONTEXT ───────────────────────────────────────────────────────

// R-202605-147: inferir status operativo del proyecto
// Tabla: SCM modal activo → closing · sprint abierto (con o sin ítems) → active
//        sin sprint + ítems sin asignar → planning · sin sprint + backlog vacío → idle
// TKT-D2: 'icebox' eliminado — no tiene equivalente en BR-Core §6 Gen2; 'idle' no colisiona con Q-Backlog/Q-DISC
function _mgInferStatus(activeSp, blItems) {
  // closing: SCM modal visible
  const scmModal = document.getElementById('close-sprint-modal');
  // B-202605-035: criterio canónico de visibilidad — clase modal--open. Eliminados: style.display y aria-hidden.
  if (scmModal && scmModal.classList.contains('modal--open')) {
    return 'closing';
  }
  if (activeSp && activeSp.status === 'active') return 'active';
  // Sin sprint activo — decidir por backlog
  const unassigned = (blItems || []).filter(i =>
    i.status === 'pendiente' && (!i.sprint || i.sprint === '' || i.sprint === 'n/a' || i.sprint === 'futura')
  );
  if (unassigned.length > 0) return 'planning';
  return 'idle'; // TKT-D2: era 'icebox' — sin sprint activo y backlog sin ítems pendientes sin asignar
}

function _generateContext(ver) {
  // R-202605-136: produce JSON puro — parseable sin regex
  // R-202605-147: enriquecido con status, sprint completo, velocity, backlog snapshot, tech_debt
  // B-202605-XXX: acepta ver como parámetro (bumpedVer desde generateDocuments) — prioridad sobre version_target del sprint
  const _activeSp   = _mgActiveSprintReal();
  const _ctxVersion = (ver && ver !== 'undefined')
    ? ver
    : (_activeSp && _activeSp.version_target && _activeSp.version_target !== 'undefined')
      ? _activeSp.version_target
      : _mgGetVersion();
  const proj = getActiveProject();

  // Timestamp
  const _now = new Date();
  const _pad = n => String(n).padStart(2, '0');
  const updated = `${_now.getFullYear()}-${_pad(_now.getMonth()+1)}-${_pad(_now.getDate())} ` +
                  `${_pad(_now.getHours())}:${_pad(_now.getMinutes())} UTC-6`;
  const generated_at = updated;

  // Stack — leer del contexto almacenado si existe; priorizar JSON > Markdown > default
  let stack = [];
  const storedRaw = proj ? getProjContext(proj.id) : null;
  if (storedRaw && storedRaw.trim()) {
    let isJson = false;
    try { const o = JSON.parse(storedRaw.trim()); isJson = typeof o === 'object' && o !== null && 'version' in o; } catch(e) {}
    if (isJson) {
      try { stack = JSON.parse(storedRaw.trim()).stack || []; } catch(e) { stack = []; }
    } else {
      const stackMatch = storedRaw.match(/## Stack[\s\S]*?\n([\s\S]*?)(?=\n## |\n---\s*$|$)/m);
      if (stackMatch) {
        stack = stackMatch[1].split('\n')
          .filter(l => l.startsWith('|') && !/^\|\s*-/.test(l) && !/Capa/.test(l))
          .map(l => {
            const cells = l.split('|').map(c => c.trim()).filter(Boolean);
            return cells.length >= 2 ? { layer: cells[0], tech: cells[1] } : null;
          }).filter(Boolean);
      }
    }
  }
  stack = stack.map(s => ({
    ...s,
    tech: (s.tech || '')
      .replace(/Firebase Firestore\s*\(opcional\)[^\n]*/g, 'Supabase (activo)')
      .replace(/Firebase Firestore[^\n]*/g, 'Supabase (activo)')
  }));

  // Backlog items
  let _blItems = [];
  try {
    const raw = localStorage.getItem(_tplKey('backlog-items'));
      _blItems = raw ? JSON.parse(raw) : [];
  } catch(e) { _blItems = []; }

  // R-202605-147: status inferido — calculado una sola vez al abrir
  const status = _mgInferStatus(_activeSp, _blItems);

  // Contadores Gen2 — itemKind() clasifica, item sin tipo resoluble no incrementa ningún contador
  const counters = { REQ: 0, TKT: 0, DISC: 0, INC: 0, PRB: 0, KE: 0, CHG: 0 };
  _blItems.forEach(i => {
    const kind = itemKind(i);
    if (kind && kind in counters) counters[kind]++;
  });

  // R-202605-147: sprint enriquecido
  const allSprints = getActiveSprints();
  const closedSprints = allSprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  const lastClosed = closedSprints[0] || null;

  const sprintActiveItems = _activeSp
    ? _blItems.filter(i => i.sprint === _activeSp.id)
    : [];
  const sprintDoneItems = sprintActiveItems.filter(i => i.status === 'done');
  const effortTotal = sprintActiveItems.reduce((s, i) => s + (parseInt(i.effort, 10) || 0), 0);
  const effortDone  = sprintDoneItems.reduce((s, i) => s + (parseInt(i.effort, 10) || 0), 0);
  const scopeAdded  = sprintActiveItems.filter(i => i.scope_added).length;

  const sprintInfo = {
    active: _activeSp ? _activeSp.id : null,
    name: _activeSp ? (_activeSp.name || '') : null,
    goal: _activeSp ? (_activeSp.goal || null) : null,
    version_target: _activeSp ? (_activeSp.version_target || null) : null,
    release_type: _activeSp ? (_activeSp.release_type || null) : null,
    opened_date: _activeSp ? (_activeSp.openedAt ? new Date(_activeSp.openedAt).toISOString().slice(0,10) : null) : null,
    items_total: _activeSp ? sprintActiveItems.length : 0,
    items_done: _activeSp ? sprintDoneItems.length : 0,
    effort_total: _activeSp ? effortTotal : 0,
    effort_done: _activeSp ? effortDone : 0,
    scope_added: _activeSp ? scopeAdded : 0,
    last_closed: lastClosed ? {
      id: lastClosed.id || null,
      closed_date: lastClosed.closedAt ? new Date(lastClosed.closedAt).toISOString().slice(0,10) : null,
      items_done: lastClosed.itemsDone ?? null,
      effort_done: lastClosed.effortDone ?? null,
      version_delivered: lastClosed.version_target || null
    } : {
      id: null, closed_date: null, items_done: null, effort_done: null, version_delivered: null
    }
  };

  // R-202605-147: velocity — últimos 3 sprints cerrados con effort_done > 0
  const validClosed = closedSprints
    .filter(s => (s.effortDone || 0) > 0)
    .slice(0, 3);
  const last3 = validClosed.map(s => ({
    sprint: s.id,
    effort_done: s.effortDone || 0,
    items_done: s.itemsDone || 0
  }));
  let avgEffort = null;
  let trend = null;
  if (last3.length > 0) {
    avgEffort = Math.round((last3.reduce((s, x) => s + x.effort_done, 0) / last3.length) * 100) / 100;
  }
  if (last3.length >= 2) {
    const latest = last3[0].effort_done;
    const prevAvg = last3.slice(1).reduce((s, x) => s + x.effort_done, 0) / (last3.length - 1);
    if (latest > prevAvg * 1.1) trend = 'acelerando';
    else if (latest < prevAvg * 0.9) trend = 'desacelerando';
    else trend = 'estable';
  }
  const velocity = { last_3_sprints: last3, avg_effort: avgEffort, trend };

  // R-202605-147: backlog snapshot
  const pendingItems = _blItems.filter(i => i.status === 'pendiente');
  const backlogSnapshot = {
    total: _blItems.length,
    pending: pendingItems.length,
    high_priority: pendingItems.filter(i => i.priority === 'high').length
  };

  // tech_debt — INC y TKT de priority high sin sprint asignado, vía itemKind() (excluye DISC implícitamente)
  const noSprintValues = [null, undefined, '', 'n/a', 'futura'];
  const tech_debt = _blItems
    .filter(i => ['INC', 'TKT'].includes(itemKind(i)) && i.priority === 'high' && noSprintValues.includes(i.sprint))
    .map(i => ({ code: i.code || '—', title: i.title || i.desc || '', type: itemKind(i) }));

  // Decisiones — [] en este R, acumulación futura desde CHECKPOINTs
  const decisions = [];

  // Gaps — [] en este R, semántica de no vaciarse es scope futuro
  const gaps = [];

  // Notas / Memoria operativa
  const sessions = proj && Array.isArray(proj.sessions) ? proj.sessions : [];
  const spLabel   = _activeSp ? _activeSp.id : 'S-??';
  const sprintSessions = _activeSp
    ? sessions.filter(s => _mgSessionInSprint(s, _activeSp.id))
    : sessions.slice(-20);

  if (_activeSp && !sprintSessions.length && sessions.length) {
    console.warn(`[MapGen] _generateContext: 0 sesiones matchearon sprint ${_activeSp.id}`);
  }

  let existingNoteLines = [];
  if (storedRaw && storedRaw.trim()) {
    let isJson = false;
    try { const o = JSON.parse(storedRaw.trim()); isJson = typeof o === 'object' && o !== null && 'version' in o; } catch(e) {}
    if (isJson) {
      try {
        const prev = JSON.parse(storedRaw.trim());
        existingNoteLines = (prev.notes || '').split('\n').map(l => l.trim()).filter(l => l.startsWith('['));
      } catch(e) {}
    } else {
      const memMatch = storedRaw.match(/^## Memoria operativa\n([\s\S]*?)(?=\n## |\n---\s*$|$)/m);
      if (memMatch) {
        existingNoteLines = memMatch[1].split('\n').map(l => l.trim()).filter(l => l.startsWith('['));
      }
    }
  }

  const seenNotes = new Set(existingNoteLines.map(l => l.toLowerCase()));
  const newNoteEntries = [];
  for (const s of sprintSessions) {
    if (s.decision && s.decision.trim()) {
      const entry = `[${spLabel}] Decisión: ${s.decision.trim()}`;
      if (!seenNotes.has(entry.toLowerCase())) { newNoteEntries.push(entry); seenNotes.add(entry.toLowerCase()); }
    }
    const learning = (s.aprendizaje || s.learning || '').trim();
    if (learning) {
      const entry = `[${spLabel}] Aprendizaje: ${learning}`;
      if (!seenNotes.has(entry.toLowerCase())) { newNoteEntries.push(entry); seenNotes.add(entry.toLowerCase()); }
    }
  }
  const allNotes = [...existingNoteLines, ...newNoteEntries].join('\n');

  // T-202605-498: commands — instrucciones de arranque por rol, construidas desde OL-CONTEXT §17
  // Mapa canónico: sigla · nombre → archivos requeridos en sesión
  // Fuente de verdad: Base Rules §2 + OL-CONTEXT §17
  const _commandsMap = {
    'ST · Vera':   'Base Rules + Role-Vera + OL-CONTEXT',
    'GW · Lena':   'Base Rules + Role-Lena + OL-CONTEXT',
    'CPO · Noa':   'Base Rules + Role-Noa + OL-CONTEXT',
    'CMO · Maya':  'Base Rules + Role-Maya + OL-CONTEXT',
    'PO · Cael':   'Base Rules + Role-Cael + OL-CONTEXT + CONTEXT-[proyecto] + Backlog-[proyecto]',
    'FS · Rune':   'Base Rules + Role-Rune + OL-CONTEXT + CONTEXT-[proyecto] + Backlog-[proyecto] + MAP-[proyecto]',
    'UX · Nova':   'Base Rules + Role-Nova + OL-CONTEXT + CONTEXT-[proyecto] + Brief-Noa (si existe)',
    'CC · Flux':   'Base Rules + Role-Flux + OL-CONTEXT + Brief-Maya (si existe)',
    'ET · Eden':   'Base Rules + Role-Eden + CONTEXT-CM + Arquitectura-Curricular-[sección activa]',
    'GC · Sage':   'Base Rules + Role-Sage + CONTEXT-CM + Arquitectura-Curricular-[sección activa]',
    'QA · Finn':   'Base Rules + Role-Finn + OL-CONTEXT + CONTEXT-[proyecto] + Backlog-[proyecto]',
    'DA · Iris':   'Base Rules + Role-Iris + OL-CONTEXT + Dashboard-métricas (si existe)'
  };

  // T-202605-498: commands — filtrar por roles asignados al proyecto activo
  // Fallback 1: sin roles mapeados → tabla completa del ecosistema
  // Fallback 2: error en getAISessions → placeholder explícito (no objeto vacío silencioso)
  let commands = {};
  try {
    const projAIs = proj
      ? (getAISessions() || []).filter(ai => !ai.archived)
      : [];
    const activeRoles = projAIs
      .map(ai => ai.name || '')
      .filter(name => name && _commandsMap[name]);
    if (activeRoles.length > 0) {
      activeRoles.forEach(role => { commands[role] = _commandsMap[role]; });
    } else {
      // Sin roles mapeados al proyecto activo: emitir tabla completa del ecosistema
      commands = { ..._commandsMap };
    }
  } catch(e) {
    // Error al leer roles — placeholder explícito para que el CONTEXT no quede silenciosamente vacío
    commands = {
      '_placeholder': 'No se pudieron leer los roles del proyecto. Adjuntar Base Rules + Role-[Rol] + OL-CONTEXT + CONTEXT-[proyecto] + Backlog-[proyecto]'
    };
  }

  // Construir objeto JSON
  const ctx = {
    version: _ctxVersion,
    updated,
    generated_at,
    project: proj ? (proj.name || 'Locus') : 'Locus',
    main_file: 'index.html',
    status,
    stack,
    sprint: sprintInfo,
    velocity,
    backlog: backlogSnapshot,
    tech_debt,
    counters,
    decisions,
    gaps,
    notes: allNotes,
    commands
  };

  return JSON.stringify(ctx, null, 2);
}

// ─── Generador BACKLOG ───────────────────────────────────────────────────────

// B-202605-224: pasar _mgGetVersion() como argumento — sin esto version es undefined en el MD exportado
// T-202605-489: acepta version como parámetro; fallback a _mgGetVersion() si no se pasa
function _generateBacklog(version) {
  const ver = (version && version !== 'undefined') ? version : _mgGetVersion();
  return buildBacklogMd(ver);
}

// ─── Generador SPRINT-REVIEW ─────────────────────────────────────────────────

function _generateSprintReview(ver) {
  // B-202605-495: acepta ver como parámetro; fallback a _mgGetVersion() si no se pasa
  const proj = getActiveProject();
  const activeSprint = _mgActiveSprintReal();

  const sprintId   = activeSprint ? activeSprint.id : 'sin-sprint';
  const sprintName = activeSprint ? (activeSprint.label || activeSprint.id) : '—';
  const version    = (ver && ver !== 'undefined') ? ver : _mgGetVersion();
  const now        = _mgNow();
  const prefix     = _docPrefix();

  let md = `# ${prefix}-SPRINT-REVIEW_${sprintId}.md\n`;
  md += `<!-- Versión: ${version} | Sprint: ${sprintId} | Generado: ${now} UTC-6 -->\n\n`;
  md += `# Sprint Review — ${sprintName}\n\n`;
  md += `Generado: ${now} UTC-6\n\n---\n\n`;

  // Sesiones del sprint — declaradas aquí para uso en Sección 1 (Decisiones) y Sección 2 (Aprendizajes)
  const sessions = proj && Array.isArray(proj.sessions) ? proj.sessions : [];
  const sprintSessions = activeSprint
    ? sessions.filter(s => _mgSessionInSprint(s, activeSprint.id))
    : sessions.slice(-20);

  // B-202605-226: log de diagnóstico cuando 0 sesiones matchean con sprint activo
  if (activeSprint && !sprintSessions.length && sessions.length) {
    console.warn(`[MapGen] 0 sesiones matchearon sprint ${activeSprint.id} — verificar sprintId en sesiones`);
  }

  // Sección 1: Decisiones
  // B-[pendiente-ID]: incluir Decisión: extraída de sesiones del sprint + proj.decisions manuales
  md += `## Decisiones\n\n`;
  const decisions = proj && Array.isArray(proj.decisions) ? proj.decisions : [];
  const sorted = [...decisions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Extraer s.decision de sesiones del sprint — deduplicar por texto
  const seenDecisions = new Set(sorted.map(d => (d.text || '').trim().toLowerCase()));
  const sessionDecisions = sprintSessions
    .filter(s => s.decision && s.decision.trim())
    .filter(s => {
      const key = s.decision.trim().toLowerCase();
      if (seenDecisions.has(key)) return false;
      seenDecisions.add(key);
      return true;
    })
    .map(s => ({ text: s.decision.trim(), author: s.aiName || '—', date: s.dateShort || (s.date ? s.date.slice(0, 10) : '—'), fromSession: true }));

  const allDecisions = [...sorted.map(d => ({ text: d.text || '', author: d.author || '—', date: d.date || '—', id: d.id })), ...sessionDecisions];

  if (!allDecisions.length) {
    md += `_Sin decisiones registradas._\n\n`;
  } else {
    md += `| Decisión | Autor | Fecha | ¿Trasciende? |\n`;
    md += `|----------|-------|-------|-------------|\n`;
    allDecisions.forEach(d => {
      const t = d.id && _mapGen.decisionTranscends[d.id] ? '✓' : '';
      md += `| ${d.text} | ${d.author} | ${d.date} | ${t} |\n`;
    });
    md += `\n`;
  }

  // Sección 2: Aprendizajes
  md += `## Aprendizajes\n\n`;
  const withLearning = sprintSessions.filter(s => (s.learning || s.aprendizaje || s.nextStep || '').trim());

  if (!withLearning.length) {
    md += `_Sin aprendizajes registrados en sesiones de este sprint._\n\n`;
  } else {
    md += `| Aprendizaje | Sesión | Fecha | ¿Trasciende? |\n`;
    md += `|-------------|--------|-------|-------------|\n`;
    withLearning.forEach(s => {
      const txt = s.learning || s.aprendizaje || s.nextStep || '';
      const t = _mapGen.learningTranscends[s.id] ? '✓' : '';
      const dateStr = s.dateShort || (s.date ? s.date.slice(0, 10) : '—');
      md += `| ${txt} | ${(s.title || '').slice(0, 50)} | ${dateStr} | ${t} |\n`;
    });
    md += `\n`;
  }

  // Sección 3: Arranque del siguiente sprint — Próximo paso: del CHECKPOINT más reciente
  // E-[pendiente-ID]: reemplaza "Próximos pasos" genérico con el nextStep del último CHECKPOINT del sprint
  md += `## Arranque del siguiente sprint\n\n`;
  const lastWithNextStep = [...sprintSessions]
    .reverse()
    .find(s => s.nextStep && s.nextStep.trim());
  if (lastWithNextStep) {
    md += `${lastWithNextStep.nextStep.trim()}\n\n`;
  } else {
    md += `_Sin próximo paso registrado en el sprint._\n\n`;
  }

  // Sección 4: Histórico de sesiones — tabla completa al final
  // E-[pendiente-ID]: tabla con todas las sesiones del sprint
  md += `## Histórico de sesiones\n\n`;
  if (!sprintSessions.length) {
    md += `_Sin sesiones registradas en este sprint._\n\n`;
  } else {
    md += `| Sesión | AI | Fecha | Decisión | Próximo paso |\n`;
    md += `|--------|-----|-------|----------|--------------|\n`;
    [...sprintSessions].sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(s => {
      const fecha = s.dateShort || (s.date ? s.date.slice(0, 10) : '—');
      const decision = (s.decision || '').slice(0, 60).replace(/\|/g, '\\|');
      const next = (s.nextStep || '').slice(0, 60).replace(/\|/g, '\\|');
      md += `| ${(s.title || '').slice(0, 50)} | ${s.aiName || '—'} | ${fecha} | ${decision} | ${next} |\n`;
    });
    md += `\n`;
  }

  md += `---\n\n_Documento generado desde Document Generator — Locus._\n`;
  return md;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _mgNow() {
  return new Date().toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── Preview ─────────────────────────────────────────────────────────────────

function _mgResetPreview() {
  const area = document.getElementById('mg-preview-area');
  if (area) area.innerHTML = '<p class="mg-preview-placeholder">Los documentos generados aparecerán aquí.</p>';
  const confirmBtn = document.getElementById('mg-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = true;
}

function _mgShowPreview(docs) {
  const area = document.getElementById('mg-preview-area');
  if (!area) return;

  const version = _mgGetVersion();
  const prefix = _docPrefix();

  const items = [
    { key: 'map',     label: 'MAP',          filename: `${prefix}-MAP_${version}.md` },
    { key: 'context', label: 'CONTEXT',       filename: `${prefix}-CONTEXT_${version}.md` },
    { key: 'backlog', label: 'BACKLOG',        filename: `${prefix}-BACKLOG_${version}.md` },
    { key: 'review',  label: 'Sprint Review', filename: `${prefix}-SPRINT-REVIEW_${version}.md` },
  ].filter(i => docs[i.key]);

  let html = `<div class="mg-preview-header"><span class="mg-preview-badge">✓ ${items.length} documento${items.length !== 1 ? 's' : ''} generado${items.length !== 1 ? 's' : ''}</span><span class="mg-preview-version">Versión: ${version}</span></div>`;
  html += `<div class="mg-preview-doc-list">`;
  items.forEach(i => {
    const lines = docs[i.key].split('\n').length;
    html += `<div class="mg-preview-doc-item"><span class="mg-preview-doc-icon">📄</span><span class="mg-preview-doc-name">${i.filename}</span><span class="mg-preview-doc-meta">${lines.toLocaleString()} líneas</span></div>`;
  });
  html += `</div>`;

  // R-202605-137 (rev): Si hay MAP en Markdown, mostrar tabla de archivos parseando secciones ##
  if (docs.map) {
    try {
      const mapLines = docs.map.split('\n');
      const mapFiles = [];
      let currentFile = null;
      let fnCount = 0;
      mapLines.forEach(line => {
        const h2 = line.match(/^## (\S+\.(js|css|html))\s*$/i);
        if (h2) {
          if (currentFile) { currentFile.entries = fnCount; mapFiles.push(currentFile); }
          currentFile = { name: h2[1], type: h2[2].toLowerCase(), lines: 0, size: '' };
          fnCount = 0;
          return;
        }
        if (currentFile) {
          const meta = line.match(/\*\*Líneas:\*\*\s*(\d+)\s*·\s*\*\*Size:\*\*\s*(\S+)/);
          if (meta) { currentFile.lines = parseInt(meta[1], 10); currentFile.size = meta[2]; }
          // contar filas de tabla (excluir cabecera y separador)
          if (line.startsWith('|') && !line.match(/^\|\s*[-:]+/) && !line.match(/^\|\s*(Función|Línea|Área|Sección)/i)) {
            fnCount++;
          }
        }
      });
      if (currentFile) { currentFile.entries = fnCount; mapFiles.push(currentFile); }

      if (mapFiles.length) {
        html += `<table class="mg-preview-table"><thead><tr><th>Archivo</th><th>Tipo</th><th>Líneas</th><th>Size</th><th>Entradas</th></tr></thead><tbody>`;
        mapFiles.forEach(f => {
          html += `<tr><td>${f.name}</td><td>${f.type.toUpperCase()}</td><td>${(f.lines||0).toLocaleString()}</td><td>${f.size}</td><td>${f.entries}</td></tr>`;
        });
        html += `</tbody></table>`;
      }
    } catch(e) {
      html += `<div class="mg-preview-error">⚠ Error al parsear MAP Markdown: ${e.message}</div>`;
    }
  }

  area.innerHTML = html;
  const confirmBtn = document.getElementById('mg-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = false;
}

function confirmMapGenerator() {
  const docs = _mapGen.generatedDocs;
  if (!Object.keys(docs).length) return;

  // R-202605-117: guard — no bumpear versión si no hay sprint cerrado previo
  const allSprints = getActiveSprints();
  const hasClosedSprint = allSprints.some(s => s.status === 'closed');
if (!hasClosedSprint) {
  // B-[pendiente-ID]: warning no bloqueante — MAP y demás documentos se descargan
  // sin sprint cerrado. Solo el bump de versión requiere sprint cerrado.
  // Si no hay sprint cerrado → usar versión actual sin bumpear.
  showToast('warning', 'Sin sprint cerrado — archivos descargados con versión actual sin bumpear');
  docs._bumpedVer = _mgGetVersion(); // sobreescribir: no bumpear sin sprint cerrado
  // No hacer return — continuar con _doConfirmGenerate()
}

  // B-202605-071: warning no bloqueante si hay sprints sin cerrar
  // El MAP puede generarse con sprint abierto (snapshot del estado actual), pero el usuario
  // debe confirmar explícitamente que entiende que el sprint no está cerrado.
  const openSprints = allSprints.filter(s => s.status === 'active');
  if (openSprints.length > 0) {
    const area = document.getElementById('mg-preview-area');
    if (area) {
      const sprintList = openSprints.map(s => `<span class="mg-warn-sprint-id">${s.id}</span>`).join(', ');
      const sprintLabel = openSprints.length === 1
        ? `El sprint ${sprintList} no está cerrado.`
        : `Los sprints ${sprintList} no están cerrados.`;
      area.innerHTML = `
        <div class="mg-open-sprint-warning">
          <p class="mg-warn-title">⚠ Sprint sin cerrar</p>
          <p class="mg-warn-body">${sprintLabel} El MAP reflejará el estado actual, no el estado final del sprint.</p>
          <div class="mg-warn-actions">
            <button class="mg-warn-btn mg-warn-btn--confirm" data-mg-action="confirm-generate">Generar de todos modos</button>
            <button class="mg-warn-btn mg-warn-btn--cancel" data-mg-action="reset-preview">Cancelar</button>
          </div>
        </div>`;
      return;
    }
    // Sin área de preview disponible — continuar igualmente (fallback silencioso mejor que bloqueo)
  }

  _doConfirmGenerate();
}

// INC-[pendiente-ID]: async — permite await migrateClosedItemsToHistorico() en ambos call sites internos
// (ZIP y fallback de descarga individual). Antes disparaba la promesa sin esperarla ("ahora
// awaited" declarado en el header de locus-backlog-historico.js pero nunca aplicado aquí —
// corregido en esta entrega). Dos callers, ambos fire-and-forget sobre el resultado
// (confirmMapGenerator línea ~1735, botón data-mg-action="confirm-generate" línea ~1990) —
// ninguno depende del valor de retorno, una función async en ambos casos es válida.
async function _doConfirmGenerate() {
  const docs = _mapGen.generatedDocs;
  if (!Object.keys(docs).length) return;

  const prefix    = _docPrefix();
  // B-202605-496: usar bumpedVer de generateDocuments() — evita recálculo independiente
  // Si no está disponible (flujo inesperado) — fallback al comportamiento anterior
  const bumpedVer = (docs._bumpedVer && docs._bumpedVer !== 'undefined')
    ? docs._bumpedVer
    : _mgBumpMinor(_mgGetVersion());

  // T-202605-504 AC4: versión en nombre de archivo debe coincidir con version interno del CONTEXT
  if (docs.context) {
    try {
      const ctxObj = JSON.parse(docs.context);
      const ctxVer = ctxObj.version || '';
      // Normalizar: quitar 'v' inicial para comparación insensible al prefijo — normalize() definida a nivel de módulo
      if (normalize(ctxVer) !== normalize(bumpedVer)) {
        showToast('error', `Versión interna del CONTEXT (${ctxVer}) no coincide con el nombre del archivo (${bumpedVer}) — regenera los documentos antes de confirmar.`);
        return;
      }
    } catch(e) {
      // CONTEXT no parseable como JSON — no bloquear; el error de parsing es otro problema
    }
  }

  // Construir tabla de archivos: { filename, content, applyFn? }
  const activeSprint = _mgActiveSprintReal();
  const sprintId     = activeSprint ? activeSprint.id : 'sin-sprint';

  const fileDefs = [];
  if (docs.map) {
    const mapVer = _mgGetMapVersion(); // T-202606-148: nombre del archivo MAP coincide con header interno
    const name = `${prefix}-MAP_${mapVer}.md`;
    fileDefs.push({
      filename: name,
      content:  docs.map,
      apply: () => {
        const f = new File([docs.map], name, { type: 'text/markdown' });
          importHtmlMap({ target: { files: [f], value: '' } });
      },
    });
  }
  if (docs.context) {
    const name = `${prefix}-CONTEXT_${bumpedVer}.md`;
    fileDefs.push({
      filename: name,
      content:  docs.context,
      apply: () => {
        _importContextMdFromText(docs.context);
      },
    });
  }
  if (docs.backlog) {
    // BACKLOG: solo ZIP — no re-importar (round-trip MD→parse puede corromper merge)
    fileDefs.push({ filename: `${prefix}-BACKLOG_${bumpedVer}.md`, content: docs.backlog });
  }
  if (docs.review) {
    fileDefs.push({ filename: `${prefix}-SPRINT-REVIEW_${sprintId}_${bumpedVer}.md`, content: docs.review });
  }
  // B-202605-275: efectos DOM (importContextMd, importHtmlMap) se aplican DESPUÉS de confirmar generación exitosa
  // B-202605-493: _mgApplyBumpedVersion y migrateClosedItemsToHistorico también se difieren — sin mutación de estado si ZIP falla
  const zipName = `${prefix}-SPRINT-PACKAGE_${sprintId}_${bumpedVer}.zip`;

  if (typeof JSZip !== 'undefined') {
    const zip = new JSZip();
    fileDefs.forEach(d => zip.file(d.filename, d.content));
    zip.generateAsync({ type: 'blob' }).then(async blob => {
      // ZIP generado exitosamente — aplicar efectos en orden: DOM → versión → archivo
      fileDefs.forEach(d => { if (d.apply) d.apply(); });
      _mgApplyBumpedVersion(bumpedVer); // B-202605-493: diferido post-confirmación
      await migrateClosedItemsToHistorico(); // INC-[pendiente-ID]: awaited — persistencia debe completarse antes de exponer la descarga

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(url);

      closeMapGenerator();
      showToast('success', `Paquete generado — ${fileDefs.length} documento${fileDefs.length !== 1 ? 's' : ''} · v${bumpedVer}`);
    }).catch(() => {
      // ZIP falló — no aplicar ningún efecto de estado
      showToast('error', 'Error al generar el ZIP — no se aplicaron cambios');
    });
  } else {
    // Fallback: descargas individuales — aplicar efectos después de iniciar descargas
    fileDefs.forEach(d => _mgDownload(d.content, d.filename));
    fileDefs.forEach(d => { if (d.apply) d.apply(); });
    _mgApplyBumpedVersion(bumpedVer); // B-202605-493: diferido post-descarga
    await migrateClosedItemsToHistorico(); // INC-[pendiente-ID]: awaited — persistencia debe completarse antes del toast de éxito
    showToast('warning', 'JSZip no disponible — descargando archivos por separado');

    closeMapGenerator();
    showToast('success', `Paquete generado — ${fileDefs.length} documento${fileDefs.length !== 1 ? 's' : ''} · v${bumpedVer}`);
  }
}
// R-202605-002: _mgApplyBumpedVersion — solo actualiza DOM, no persiste en localStorage
function _mgApplyBumpedVersion(ver) {

  // 1. DOM — title del documento
  document.title = `Locus ${ver}`;

  // 2. DOM — pill de versión en el header global (textContent + tooltip)
  const vpEl = document.getElementById('version-pill');
  if (vpEl) {
    vpEl.textContent = ver;
    vpEl.title = `${ver} · Ver changelog`;
  }

  // 3. DOM — banner de versión en sub-tab Backlog
  const bmetaEl = document.getElementById('bmeta-version');
  if (bmetaEl) bmetaEl.textContent = ver;
}

function _mgDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// R-202605-146: Descargar todos los documentos exportables en un ZIP
// Usa JSZip si está disponible; fallback a descargas individuales
export function _mgExportAllZip() {
  const prefix = _docPrefix();

  const fileDefs = [];

  fileDefs.push({ filename: `${prefix}-BACKLOG.md`, fn: () => buildBacklogMd(_mgGetVersion()) }); // B-202605-513: pasar versión para que el export no quede con header undefined
  // B-202605-515: historial completo via _generateFullHistoryContent (función pura, sin blob/toast)
  const ver = _mgGetVersion();
  fileDefs.push({ filename: `${prefix}-BACKLOG-FULL_${ver}.md`, fn: () => _generateFullHistoryContent(ver) });
  {
    const version = _mgGetVersion();
    const prefix2 = _docPrefix();
    fileDefs.push({ filename: `${prefix2}-CONTEXT_${version}.md`, fn: () => _generateContext() }); // B-202605-276
  }
  // B-202605-514: MAP via _getMapContent() — función pura, sin overlay ni blob
  {
    const ver = _mgGetVersion();
    const mapContent = _getMapContent(ver);
    if (mapContent !== null) {
      // R-202605-137 (rev): output siempre .md — bloque JSON eliminado
      fileDefs.push({ filename: `${prefix}-MAP_${ver}.md`, fn: () => mapContent });
    }
  }

  // Si podemos construir contenido — intentar ZIP
  if (fileDefs.length > 0 && typeof JSZip !== 'undefined') {
    const zip = new JSZip();
    fileDefs.forEach(d => {
      try { zip.file(d.filename, d.fn()); } catch(e) { /* silenciar error de contenido individual */ }
    });
    zip.generateAsync({ type: 'blob' }).then(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${prefix}-DOCUMENTOS.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'ZIP descargado — todos los documentos');
    });
  } else {
    // Fallback: descargas individuales usando las funciones de exportación existentes
    exportBacklogMd();
    exportFullHistoryMd();
    exportHtmlMapMd();
    exportContextMd();
    showToast('info', 'Documentos descargados individualmente');
  }
}

// T-202605-032: addEventListener — migración desde onclick inline en index.html
document.addEventListener('DOMContentLoaded', function () {
  const btnOpen     = document.getElementById('btn-generate-map');
  const btnClose    = document.getElementById('mg-close-btn');
  const btnGenerate = document.getElementById('mg-generate-btn');
  const btnCancel   = document.getElementById('mg-cancel-btn');
  const btnConfirm  = document.getElementById('mg-confirm-btn');
  const tabDecisions  = document.getElementById('mg-tab-decisions');
  const tabLearnings  = document.getElementById('mg-tab-learnings');

  if (btnOpen)     btnOpen.addEventListener('click', openMapGenerator);
  if (btnClose)    btnClose.addEventListener('click', closeMapGenerator);
  if (btnGenerate) btnGenerate.addEventListener('click', generateDocuments);
  if (btnCancel)   btnCancel.addEventListener('click', closeMapGenerator);
  if (btnConfirm)  btnConfirm.addEventListener('click', confirmMapGenerator);
  if (tabDecisions)  tabDecisions.addEventListener('click', function () { _mgSwitchReviewTab('decisions', this); });
  if (tabLearnings)  tabLearnings.addEventListener('click', function () { _mgSwitchReviewTab('learnings', this); });

  // T-202605-036: event delegation — migración de handlers on* en templates dinámicos

  // AC1 — decisions tbody: onchange checkbox → _mgToggleDecisionTranscends
  const decisionsTbody = document.getElementById('mg-decisions-tbody');
  if (decisionsTbody) {
    decisionsTbody.addEventListener('change', function (e) {
      const input = e.target.closest('input[data-decision-id]');
      if (input) _mgToggleDecisionTranscends(input.dataset.decisionId, input.checked);
    });
  }

  // AC2 — learnings tbody: onchange checkbox → _mgToggleLearningTranscends
  const learningsTbody = document.getElementById('mg-learnings-tbody');
  if (learningsTbody) {
    learningsTbody.addEventListener('change', function (e) {
      const input = e.target.closest('input[data-learning-id]');
      if (input) _mgToggleLearningTranscends(input.dataset.learningId, input.checked);
    });
  }

  // AC3 — file list: onclick remove button → _mgRemoveFile
  const fileList = document.getElementById('mg-file-list');
  if (fileList) {
    fileList.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-remove-idx]');
      if (btn) _mgRemoveFile(parseInt(btn.dataset.removeIdx, 10));
    });
  }

  // AC4 — preview area: onclick confirm/cancel en warning de sprint sin cerrar
  // Contenedor padre estable (existe desde carga inicial, no se destruye entre aperturas)
  const mgOverlay = document.getElementById('mg-overlay');
  if (mgOverlay) {
    mgOverlay.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-mg-action]');
      if (!btn) return;
      if (btn.dataset.mgAction === 'confirm-generate') _doConfirmGenerate();
      if (btn.dataset.mgAction === 'reset-preview') _mgResetPreview();
      if (btn.dataset.mgAction === 'edit-sprint') {
        closeMapGenerator();
        const spId = btn.dataset.sprintId;
        setTimeout(() => { editSprintInline(spId); }, 100);
      }
    });
  }
});

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
