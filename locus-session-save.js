// locus-session-save.js
// Última actualización: B-202606-105 — CHANGELOG_KEY local eliminada, usa LOCUS_KEYS.CHANGELOG
// (locus-storage.js) como fuente única de verdad de la clave de changelog.
// Responsabilidad: changelog, buildBacklogMd, saveSession, _doSaveSession, _doApplyMergeAndFinish.
// Dependencias: locus-storage.js · locus-toast.js · locus-session-parse.js
import { loadBacklog, renderStats, getItems, itemKind } from './locus-backlog-core.js';
import { mergeBacklogFromTG, applyPatchesFromTG } from './locus-backlog-item.js'; // INC-[pendiente-ID]: applyPatchesFromTG restaurado — ver header mod:53
import { showMergeDiffPanel } from './locus-backlog-merge.js';
import { _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { updateTabNotifBadges } from './locus-notifications.js';
import { _markRadarDirty, renderGlobalRadarSidebar, toggleRadarSidebar } from './locus-radar.js';
import { stopSessionTimer } from './locus-sesiones-utils.js';
import { _getLocalStorageUsage } from './locus-sprint-project.js';
import { _generateBacklogContent, _generateBacklogMd } from './locus-backlog-generator.js';
import { LOCUS_KEYS, _docPrefix, _effectiveVersion, _findSession, _tplKey, getAI, getActiveProject, getActiveSprints, getActiveTracker, saveImmediate } from './locus-storage.js';


import { extractContextSections, extractDocUpdates, extractHtmlMapSections, mergeContextSections, mergeHtmlMapSections, processDocUpdate } from './locus-docs.js';

import { showCheckpointPanel } from './locus-sesiones-viz.js';

import { render } from './locus-sesiones.js';

import { _showProjRequiredInPanel, interpretHora } from './locus-session-hora.js';

import { _setPhase, _tryIngestPlan, _tryIngestPlanFromParsed, _tryIngestSprintProposal, _tryIngestSprintProposalFromParsed, _applySprintInheritanceToItems, parseSprintProposal, parsePaste, _buildTriggeredBySuggestion } from './locus-session-parse.js'; // T-202606-032: isParseInFlight eliminado — AC-5 | T-202606-020: _applySprintInheritanceToItems | T-202606-018: _tryIngestPlanFromParsed | T-202606-021: _buildTriggeredBySuggestion | B-202606-019: _tryIngestSprintProposalFromParsed

import { _getAllSessionsChron, _rebuildLogBody } from './locus-session-popup.js';

import { showToast } from './locus-toast.js';

import { esc, getCurrentTab } from './locus-ui-shell.js';

// [PP] mod:53 · autor:Rune · 2026-06-30 UTC-6
// INC-[pendiente-ID] (triggered_by TKT-202606-014): applyPatchesFromTG(parsed.patchItems, ...)
//   restaurado en _doApplyMergeAndFinish — se había eliminado por "redundante" con la llamada de
//   locus-backlog-merge.js (_mdiffDoApply), que en realidad nunca aplica patches sobre ítems
//   existentes (filtra tgItems por type==='patch', pero _buildPatchTgImes convierte esos patches
//   en representaciones sintéticas que pierden el type 'patch'). Root cause de "DIFF reconoce el
//   cambio pero el status queda en el original" tanto para el patch de TKT-202606-014 como para
//   CHECKPOINTs normales de avance de status. Rol propagado correctamente esta vez (parsed.rol) —
//   el bug que motivó la eliminación original (rol siempre '') no se reintroduce. Ver detalle en
//   el comentario junto a la llamada, más abajo.
// [PP] mod:52 · autor:Rune · 2026-06-30 UTC-6
// TKT-202606-011 (REQ-202606-003 · AC1/AC4): _ckptMeta.draftPending = parsed.draft === true —
//   showMergeDiffPanel (locus-backlog-merge.js) usa el flag para badge + botón deshabilitado en
//   vez de bloquear antes de abrir el panel. Con draftPending, sprint_proposal no se ofrece como
//   Step 0 — solo se activa cuando llega el CHECKPOINT final de Finn con draft:false.
//   Corrección de header: una sesión previa insertó un segundo header "mod:1" en primera línea,
//   sin detectar el header canónico ya existente aquí — eliminado, mod continúa desde 49.
// TKT-PARSER-2b (REQ-[pendiente-ID] · VALID_TRANSITIONS PRB/KE/CHG, counters, code.match,
//   eliminar isHotfix): PRB/KE/CHG agregados a VALID_TRANSITIONS con el mismo Set ITIL de INC
//   — antes caían en "tipo desconocido → ignorar silenciosamente". Counters del tracker y
//   pattern de code.match ampliados con PRB-/KE-/CHG-. Filtro isHotfix eliminado de
//   getActiveSprints — S-HOTFIX deprecado. Header migrado a formato canónico __BR-Execution §9
//   (era v0.8.0 · sprint:PP-S-10 · mod:48 — formato legacy) y reposicionado tras el bloque de
//   imports (estaba en primera línea, antes de los imports — inconsistente con §9 en ESM).

// T-202606-020 · AC-5 · TKT0c-gen2: tabla de transiciones válidas por tipo de ítem — BR-Core §4
// Clave: tipo de ítem Gen2 ('REQ' | 'TKT' | 'INC' | 'PRB' | 'KE' | 'CHG' | 'DISC'). Valor: Set de status permitidos.
// Sets exactos de __BR-Ecosystem §5 — no es 1:1 con los sets Gen1 que reemplaza:
// REQ amplía a en-proceso/orphaned (no existían en R). INC/PRB/KE/CHG usan ciclo ITIL completo (no el de B).
// Nota: tipo desconocido → no validar (AC-6, ignorar silenciosamente).
// TKT-PARSER-2b (REQ-[pendiente-ID]): PRB/KE/CHG agregados con el mismo Set ITIL que ya
// declaraba INC — antes caían en "tipo desconocido → ignorar silenciosamente" (AC-6 de arriba).
// Caso de error, no de uso normal: _buildItilItem (locus-session-parse.js) nunca deja pasar
// item.status en un ítem ITIL — esta detección solo se activa ante status Scrum residual.
const _ITIL_STATUS_SET = new Set(['detected', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated_to_prb', 'escalated_to_chg', 'descartado']);
export const VALID_TRANSITIONS = {
  REQ: new Set(['pendiente', 'en-proceso', 'en-revision', 'bloqueado', 'orphaned', 'descartado']),
  TKT: new Set(['pendiente', 'en-revision', 'done', 'descartado']),
  INC: _ITIL_STATUS_SET,
  PRB: _ITIL_STATUS_SET,
  KE: _ITIL_STATUS_SET,
  CHG: _ITIL_STATUS_SET,
  DISC: new Set(['discovery', 'promoted', 'descartado'])
};

// T-202606-020 · AC-2 · AC-5 · AC-6
// Recibe el array de tgItems ya procesado por mergeBacklogFromTG (post-clasificación).
// Devuelve array de { code, type, status, reason } para ítems con transición inválida.
// Solo evalúa ítems con type conocido y status declarado — el resto se ignora silenciosamente (AC-6).
export function validateLifecycleTransitions(tgItems) {
  if (!tgItems || !tgItems.length) return [];
  const invalid = [];
  tgItems.forEach(item => {
    const type   = itemKind(item);
    const status = item.status;
    // AC-6: tipo desconocido → ignorar silenciosamente
    if (!type || !VALID_TRANSITIONS[type]) return;
    // Sin status declarado → no hay transición que validar
    if (!status) return;
    if (!VALID_TRANSITIONS[type].has(status)) {
      // Construir motivo legible para el panel DIFF (AC-3)
      let reason = '';
      if (type === 'DISC' && status === 'done') {
        reason = 'DISC no puede tener status done — solo promoted o descartado';
      } else if (type === 'REQ' && status === 'done') {
        reason = 'REQ no puede marcarse done directamente — requiere sesión de cierre de Finn';
      } else if (type === 'TKT' && status === 'bloqueado') {
        reason = 'TKT no puede tener status bloqueado — solo pendiente, en-revision, done o descartado';
      } else {
        reason = `${type} no puede tener status '${status}' según BR-Core §4`;
      }
      invalid.push({ code: item.code, type, status, reason });
    }
  });
  return invalid;
}

const _confirmTimers = {};            // timers de confirmación por worker ID

// T-202604-061: Changelog interno
const CHANGELOG_MAX = 50;

function _addChangelogEntry(parsed) {
  // estado formato: "YYYY-MM-DD HH:MM UTC-6 — descripción"
  // archivos formato: "AI-Tracker-vX.X.X.X.html, ..."
  const estadoMatch = parsed.estado.match(/^(\d{4}-\d{2}-\d{2}[^\—–-]*?)\s*[—–-]+\s*(.+)$/);
  const fecha = estadoMatch ? estadoMatch[1].trim() : parsed.estado.slice(0, 16);
  const desc  = estadoMatch ? estadoMatch[2].trim() : parsed.estado;

  // extraer versión del campo archivos
  const versionMatch = (parsed.archivos || '').match(/AI-Tracker-(v[\d.]+)\.html/i);
  const version = versionMatch ? versionMatch[1] : APP_VERSION;

  const entry = { version, fecha, desc, titulo: parsed.titulo || '', ts: Date.now() };

  let log = [];
  try { log = JSON.parse(localStorage.getItem(LOCUS_KEYS.CHANGELOG) || '[]'); } catch { log = []; }
  log.unshift(entry);
  if (log.length > CHANGELOG_MAX) log = log.slice(0, CHANGELOG_MAX);
  localStorage.setItem(LOCUS_KEYS.CHANGELOG, JSON.stringify(log));
}

export function openChangelog() {
  // R-202604-047: shell estático en index.html
  const overlay = document.getElementById('changelog-overlay');
  if (!overlay) return;
  const body = document.getElementById('changelog-body');
  if (body) body.innerHTML = _buildChangelogInner();
  overlay.classList.add('open');
  const closeBtn = overlay.querySelector('[data-close-changelog]');
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'), { once: true });
}

function _buildChangelogInner() {
  let log = [];
  try { log = JSON.parse(localStorage.getItem(LOCUS_KEYS.CHANGELOG) || '[]'); } catch { log = []; }

  const rows = log.length ? log.map(e => `
    <div class="chlog-entry">
      <div class="changelog-row-date">
        <span class="chlog-version">${esc(e.version)}</span>
      </div>
      <div class="changelog-row-body">
        ${e.titulo ? `<div class="chlog-title">${esc(e.titulo)}</div>` : ''}
        <div class="chlog-body">${esc(e.desc)}</div>
        <div class="chlog-date">${esc(e.fecha)}</div>
      </div>
    </div>`).join('')
  : `<div class="chlog-empty">Sin entradas aún — se registran al guardar sesiones con bloque CHECKPOINT.</div>`;

  return `
    <div class="modal-title">📋 Changelog</div>
    <div class="changelog-scroll">${rows}</div>
    <div class="modal-actions changelog-actions">
      <button data-close-changelog>Cerrar</button>
    </div>`;
}

// Alias legacy — por si hay referencias directas
function _buildChangelogHTML() {
  return `<div class="modal modal--changelog">${_buildChangelogInner()}</div>`;
}


// B-202605-517: stub legacy reemplazado — delegación a _generateBacklogContent (ai-tracker-sprint-project.js)
// La función anterior leía tracker.items (schema legacy, solo sesiones) en lugar de getItems() (backlog global),
// produciendo exports truncados con backlogs de 24+ ítems.
export function buildBacklogMd(version) {
  {
    const { md } = _generateBacklogContent(version);
    return md;
  }
  // Fallback: _generateBacklogContent no disponible (carga parcial de módulos)
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC-6';
  return `# Backlog-v${version}.md\n<!-- Versión: v${version} | Última actualización: ${timestamp} -->\n\n⚠ buildBacklogMd: _generateBacklogContent no disponible — adjunta ai-tracker-sprint-project.js\n`;
}

// R-202604-022: muestra alerta de cuota de localStorage si supera umbrales
export function _checkStorageQuota() {

  const { usedKB, totalKB, pct } = _getLocalStorageUsage();
  if (pct >= 0.85) {
    showToast('error', `⚠ localStorage al ${Math.round(pct * 100)}% (${usedKB} KB / ${totalKB} KB) — limpia ítems o exporta datos`, null, 8000);
  } else if (pct >= 0.70) {
    showToast('warning', `⚠ localStorage al ${Math.round(pct * 100)}% (${usedKB} KB / ${totalKB} KB)`, null, 6000);
  }
}

export function saveSession(id) {
  // T-202606-032: guard isParseInFlight eliminado — AC-5.
  // saveSession solo se llama desde dentro de parsePaste (auto-trigger) o desde el botón manual
  // después de que parsePaste completó. El parámetro _retryCount ya no es necesario.
  // B-202605-054: getAI(id) puede devolver null si el worker fue eliminado entre el inicio
  // de la sesión y el guardado (ej: purge concurrente). Sin guard, ai._parsed explota.
  const ai = getAI(id);
  if (!ai) {
    showToast('error', '⚠ No se encontró el worker — recarga la página');
    return;
  }
  const parsed = ai._parsed || {};
  const ta = document.getElementById('ta-' + id);
  const raw = ta ? ta.value.trim() : '';
  // B-202604-NNN: evitar que marcas de bloque (---CHECKPOINT---, ```) queden como título
  const _rawFallbackLine = raw.split('\n').find(l => { const t = l.trim(); return t && !t.startsWith('---') && !t.startsWith('```'); }) || '';
  const title = parsed.title || _rawFallbackLine.slice(0, 80) || '';
  if (!title) {
    showToast('warning', '⚠ El textarea está vacío — pega el resumen de la sesión');
    const ta2 = document.getElementById('ta-' + id);
    if (ta2) { ta2.focus(); ta2.style.setProperty('--input-border-flash', 'var(--red)'); ta2.classList.add('input-border-error'); setTimeout(() => { ta2.classList.remove('input-border-error'); }, 2000); }
    return;
  }

  // B-202606-037: horaRaw se lee dentro del callback del DIFF — no aquí.
  // El input hora-[id] del card fue reemplazado por mdiff-duration-input en el DIFF.

  // Proyecto: leer del selector del card, con fallback al activo global
  const projSelectEl = document.getElementById('sess-proj-' + id);
  const selectedProjId = projSelectEl ? projSelectEl.value : '';
  const activeProj = (selectedProjId ? (state.projects || []).find(p => p.id === selectedProjId) : null)
    || getActiveProject();
  // R-202605-095: sin proyecto → no abortar con toast. El panel de ítems comunica el problema inline.
  // Si no hay ítems que mostrar en el panel, aún así abrir el panel con solo el banner.
  const _needsProject = !activeProj;
  if (_needsProject) {
    // Marcar el selector con error visual (sin toast)
    if (projSelectEl) { projSelectEl.classList.add('input-outline-error'); setTimeout(() => { projSelectEl.classList.remove('input-outline-error'); }, 2000); }
    // Abrir el panel con banner bloqueante — el usuario debe seleccionar proyecto desde el card
    // B-202606-037: horaResult aún no disponible en este gate — se resuelve en el DIFF
    _showProjRequiredInPanel(id, parsed, null);
    return;
  }

  // P-202604-115: validar campo Proyecto del CHECKPOINT vs proyecto del card
  // Solo aplica a CHECKPOINTs (no a sesiones manuales sin bloque)
  if (parsed.isCheckpoint) {
    const _ckptProj = (parsed.ckptProyecto || '').trim();
    const _cardProjName = (activeProj.name || '').trim();
    const _projMatch = _ckptProj && _cardProjName === _ckptProj;
    const _projMismatch = _ckptProj && !_projMatch;
    const _projMissing = !_ckptProj;

    if (_projMismatch || _projMissing) {
      // Aviso no ignorable — requiere acción explícita: Continuar o Cancelar
      const _msg = _projMissing
        ? `El CHECKPOINT no tiene campo <strong>Proyecto:</strong>.<br>Se guardará en <strong>${esc(_cardProjName)}</strong>.`
        : `El CHECKPOINT declara <strong>${esc(_ckptProj)}</strong> pero el card tiene seleccionado <strong>${esc(_cardProjName)}</strong>.`;
      _showProjMismatchModal({
        msg: _msg,
        // B-202606-037: horaResult aún no disponible — se resuelve en el DIFF
        onContinue: () => _doSaveSession(id, ai, parsed, activeProj, null)
      });
      return;
    }
  }

  // B-202606-037: horaResult ya no se pasa desde aquí — se resuelve dentro del DIFF
  _doSaveSession(id, ai, parsed, activeProj, null);
}

// P-202604-115: modal Continuar/Cancelar para discrepancia de proyecto
function _showProjMismatchModal({ msg, onContinue }) {
  // R-202604-047: shell estático en index.html
  const overlay = document.getElementById('proj-mismatch-overlay');
  if (!overlay) return;
  const msgEl = document.getElementById('proj-mismatch-msg');
  if (msgEl) msgEl.innerHTML = msg;
  overlay.classList.add('open');
  // Reemplazar botón para limpiar handlers acumulados
  const btn = document.getElementById('proj-mismatch-continue');
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      onContinue();
    });
  }
}

// T-202605-120: construye una versión enriquecida de tgItems para visualización en el panel diff.
// Para cada patchItem, busca el ítem real en getItems() global y genera un objeto con los campos
// del patch aplicados encima — permite que el panel muestre qué ítems serán actualizados
// sin aplicar los cambios reales (eso ocurre en el callback vía applyPatchesFromTG).
// Los patchItems que no tienen código real en getItems() se omiten silenciosamente.
function _buildPatchTgItems(patchItems, existingTgItems) {
  if (!patchItems || !patchItems.length) return existingTgItems || [];
  const base = (existingTgItems || []).slice();
  if (typeof getItems() === 'undefined' || !Array.isArray(getItems())) return base;
  const existingCodes = new Set(base.map(x => x.code));
  patchItems.forEach(patch => {
    if (!patch.code || /^\[/.test(patch.code)) return; // ignorar placeholders
    if (existingCodes.has(patch.code)) return; // ya está en tgItems — no duplicar
    const real = getItems().find(x => x.code === patch.code);
    if (!real) return;
    // Construir representación visual: ítem real con campos del patch aplicados
    const synthetic = Object.assign({}, real);
    Object.keys(patch).forEach(k => { if (k !== 'type' && k !== 'code') synthetic[k] = patch[k]; });
    base.push(synthetic);
  });
  return base;
}

// B-202604-116: merge de backlog apuntando al proyecto del card, no al filtro global activo.
// Sobrescribe temporalmente current-project-filter + recarga getItems() del proyecto destino,
// ejecuta el merge, y restaura el estado anterior (filtro + getItems() del proyecto original).
// _setActiveProjectFilter no se usa porque tiene side-effects de UI.
export function _mergeBacklogWithProject(tgItems, sessId, projId) {
  if (!tgItems || !tgItems.length) return { created:[], updated:[], ignored:[], advanced:[], retroceso:[], discarded:[] };
  const _prevFilter = localStorage.getItem('current-project-filter') || '';
  const _filterChanged = projId && projId !== _prevFilter;
  if (_filterChanged) {
    // Apuntar al proyecto del card y recargar getItems() correspondientes
    localStorage.setItem('current-project-filter', projId);
    loadBacklog();
  }
  let result;
  try {
    result = mergeBacklogFromTG(tgItems, sessId);
  } finally {
    if (_filterChanged) {
      // Restaurar filtro original y recargar getItems() del proyecto original
      if (_prevFilter) localStorage.setItem('current-project-filter', _prevFilter);
      else localStorage.removeItem('current-project-filter');
      loadBacklog();
    }
  }
  return result; // B-202606-022: result ya incluye slugMap desde mergeBacklogFromTG
}

// T-202606-070: parsea el campo archivos del CHECKPOINT al formato de array estructurado.
// Entrada: string con segmentos separados por ' | ', cada segmento con formato
//   "nombre · mod:N · autor:Nombre" o solo "nombre" (sin mod/autor).
// Segmentos sin mod: o sin autor: se omiten. Segmentos sin separadores → campo ausente → [].
// Retorna array de { nombre, mod, autor }.
function _parseFilesField(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const result = [];
  const segments = raw.split(/\s*\|\s*/);
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    const modM   = trimmed.match(/mod\s*:\s*(\d+)/i);
    const autorM = trimmed.match(/autor\s*:\s*([^·|]+)/i);
    // AC-7/AC-8: segmento sin mod: o sin autor: → omitir
    if (!modM || !autorM) continue;
    // Extraer nombre: todo antes del primer ' · '
    const nombreM = trimmed.match(/^([^·]+)/);
    const nombre = nombreM ? nombreM[1].trim() : trimmed;
    result.push({ nombre, mod: parseInt(modM[1]), autor: autorM[1].trim() });
  }
  return result;
}

// R-202604-017 + P-202604-115: lógica central de guardado extraída para reutilización
export function _doSaveSession(id, ai, parsed, activeProj, horaResult) {
  const ta = document.getElementById('ta-' + id);
  const raw = ta ? ta.value.trim() : '';
  // B-202604-NNN: evitar que marcas de bloque (---CHECKPOINT---, ```) queden como título
  const _rawFallbackLine = raw.split('\n').find(l => { const t = l.trim(); return t && !t.startsWith('---') && !t.startsWith('```'); }) || '';
  const title = parsed.title || _rawFallbackLine.slice(0, 80) || '';
  const tgRefsRaw = parsed.tgItems || [];
  const trackerRefs = tgRefsRaw.map(x => x.code).filter(Boolean);
  const now = new Date();
  const dateShort = now.toLocaleDateString('es-MX', {day:'2-digit', month:'short'});
  const dateFull = now.toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'}) + ' ' +
                   now.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

  const tgItems = parsed.tgItems || [];

  // R-202605-049: sessionGroupId — hereda del checkpoint activo del worker o genera nuevo
  const _allSessForGroup = (activeProj.sessions || []).filter(s => s.aiId === ai.id && !s.resetAt);
  const _lastSessForGroup = _allSessForGroup.length ? _allSessForGroup[_allSessForGroup.length - 1] : null;
  const _sessionGroupId = (_lastSessForGroup && _lastSessForGroup.sessionGroupId)
    ? _lastSessForGroup.sessionGroupId
    : 'sg-' + Date.now();

  // v3.0.0: sesión va al proyecto activo con aiId
  // R-202604-017 AC-3: ckptProyecto registrado en sesión para trazabilidad en log
  const newSess = {
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
    aiId: ai.id,
    title, summary: parsed.summary || '', files: parsed.files || '',
    pending: parsed.pending || '', tags: [],
    nextStep: parsed.nextStep || '',
    trackerRefs,
    ckptProyecto: parsed.ckptProyecto || '',
    // R-202604-039: campos de memoria narrativa
    decision:    parsed.decision    || '',
    contexto:    parsed.contexto    || '',
    bloqueantes: parsed.bloqueantes || '',
    aprendizaje: parsed.aprendizaje || '',
    // T-202606-016: campos informativos adicionales del CHECKPOINT
    duration:         parsed.duration         || '',
    docsVerified:     parsed.docsVerified      || '',
    tensionsResolved: parsed.tensionsResolved  || '',
    // T-202606-018: finn_observations — almacenadas en sesión como campo informativo
    finnObservations: parsed.finnObservations  || null,
    // T-202606-070: rol y archivos del CHECKPOINT persistidos en sesión
    rol:      parsed.rol      || '',
    archivos: _parseFilesField(parsed.archivos || ''),
    // T-202606-030: sprint activo del proyecto al momento de guardar — único sprint con status
    // 'active' por invariante T-202606-023 AC-4 (sprints.filter(active).length ≤ 1)
    // TKT-PARSER-2b (REQ-[pendiente-ID]): filtro isHotfix eliminado — S-HOTFIX deprecado.
    sprintId: (getActiveSprints().find(sp => sp.status === 'active') || {}).id || '',
    // T-202606-013: señal de doc_updates para badge en mini-historial (_renderRow)
    hasDocUpdates: Array.isArray(parsed.docUpdates) && parsed.docUpdates.length > 0,
    // T-202606-072: señal de devolución Finn→Cael — presente solo cuando parsed.devolucion_cael está definido
    ...(parsed.devolucion_cael !== undefined ? { devolucion_cael: parsed.devolucion_cael } : {}),
    resetAt: '',  // B-202606-037: se completa en el callback del DIFF tras leer mdiff-duration-input
    // R-202605-049: sessionGroupId — agrupa checkpoints bajo sesión como contenedor
    sessionGroupId: _sessionGroupId,
    // T-202605-446: tiempo cronometrado de la sesión en ms
    // B-202606-037: stopSessionTimer se llama aquí para capturar elapsed antes de que el usuario
    // interactúe con el DIFF. durationMs se recalcula en el callback si hay horaResult.
    durationMs: stopSessionTimer(id),
    dateShort, date: dateFull
  };
  // B-202605-004: newSess NO se persiste aquí. El push de sessions[] y el populate de
  // tracker.items ocurren en _doApplyMergeAndFinish, después de confirmación del panel.
  // Si el usuario cancela, ni sessions[] ni tracker.items quedan con entradas huérfanas.
  const sessId = newSess.id;

  // T-098: merge del TRACKER-GLOBAL al Backlog en memoria (acumulable)
  // T-202604-121: recoger resultado detallado para super toast
  // B-202604-116: usar proyecto del card, no filtro global activo
  // T-202604-201: panel de confirmación diff antes de aplicar el merge
  // T-202606-037 AC-3: extraer campos narrativos del CHECKPOINT parseado para pasarlos como ckptMeta.
  // B-202606-037: el callback recibe horaRaw desde mdiff-duration-input, interpreta horaResult,
  // completa newSess.resetAt y recalcula durationMs como horaResult.epoch - (Date.now() - newSess.durationMs).
  const _ckptMeta = {
    resumen:     parsed.summary    || '',
    // TKT-[pendiente-ID] (REQ-[pendiente-ID] · AC-1): rol del CHECKPOINT — antes ausente de este
    // objeto. newSess.rol (línea ~403) sí lo capturaba, pero _ckptMeta (el objeto que llega a
    // showMergeDiffPanel → mergeBacklogFromTG/applyPatchesFromTG) nunca lo incluía, por lo que
    // _ckptMeta.rol||'' resolvía siempre a '' downstream — los guards de rol para
    // REQ→bloqueado (locus-backlog-item.js) y REQ→done (locus-backlog-item.js, applyPatchesFromTG)
    // rechazaban toda transición sin importar el rol real declarado. T-202606-028 ya había
    // propagado el campo en el call site (locus-backlog-merge.js) asumiendo que existía aquí —
    // fix incompleto, corregido en la fuente.
    rol:         parsed.rol        || '',
    aprendizaje: parsed.aprendizaje || '',
    bloqueantes: parsed.bloqueantes || '',
    decision:    parsed.decision    || '',
    proximoPaso: parsed.nextStep    || '',
    // TKT-202606-011 AC1: pendiente de aval Finn — el DIFF renderiza el badge y deshabilita
    // el botón de confirmar (ver locus-backlog-merge.js) en vez de bloquear antes de llegar aquí.
    draftPending: parsed.draft === true,
    // TKT-202606-014: valor crudo de draft (undefined/true/false) — gate de "draft ausente"
    // en showMergeDiffPanel necesita distinguir undefined de false, draftPending ya colapsa eso.
    draftRaw: parsed.draftRaw,
    // B-202606-037 AC-3: resetTime del worker para pre-llenar mdiff-duration-input en el DIFF.
    // Formato "HH:MM" — el DIFF stripea el separador antes de asignarlo al input.
    // Widget card: si el founder escribió hora en bexhaust-hora-{id} antes de pegar el CHECKPOINT,
    // preferirla sobre ai.resetTime — interpretHora valida antes de usar.
    resetTime: (() => {
      const _cardHoraEl = document.getElementById('bexhaust-hora-' + id);
      const _cardRaw = _cardHoraEl ? _cardHoraEl.value.replace(/\D/g, '') : '';
      const _cardResult = _cardRaw ? interpretHora(_cardRaw) : null;
      return _cardResult ? _cardResult.hhmm : (ai.resetTime || '');
    })(),
  };
  const _patchItemsN = parsed.patchItems || [];
  const _tgItemsForPanel = _buildPatchTgItems(_patchItemsN, tgItems);
  // T-202606-155: si el CHECKPOINT tiene ---SPRINT-PROPOSAL--- válido, pasarlo a showMergeDiffPanel
  // como ckptMeta.sprintProposal para que Step 0 sea el gate de creación del sprint.
  // El sprint NO se crea aquí — se crea solo al aprobar Step 0 en el DIFF.
  // T-202606-017 AC-2: path JSON puro — leer sprint_proposal del objeto parsed (fuente primaria).
  // En el path JSON, raw no contiene '---SPRINT-PROPOSAL---' — la detección por raw falla silenciosamente.
  // Fallback al path Markdown legacy: parseSprintProposal(raw) cuando parsed.sprintProposal no existe.
  const _spProposal = parsed.sprintProposal  // path JSON puro (T-202606-017)
    || ((raw && raw.includes('---SPRINT-PROPOSAL---')) ? parseSprintProposal(raw) : null);
  const _validSpProposal = (_spProposal && !_spProposal.error) ? _spProposal : null;
  // TKT-202606-011 AC4: con draftPending, sprint_proposal tampoco se aplica — no se ofrece
  // Step 0 de aprobación. El CHECKPOINT final emitido por Finn (draft:false) sí lo activa.
  if (_validSpProposal && !_ckptMeta.draftPending) {
    _ckptMeta.sprintProposal = _validSpProposal;
    _ckptMeta.onApproveProposal = function(proposal) {
      // T-202606-020 AC-1/AC-2/AC-3/AC-4: herencia automática de sprint a ítems del CHECKPOINT.
      // B-202606-019: usar _tryIngestSprintProposalFromParsed en lugar de _tryIngestSprintProposal(raw).
      // En path JSON puro, raw no contiene '---SPRINT-PROPOSAL---' — la variante de texto retorna
      // false silenciosamente. La variante FromParsed opera sobre el objeto ya extraído por parseCheckpoint.
      // Mutar _tgItemsForPanel in-place → el DIFF refleja el sprint asignado antes de que el founder confirme.
      const _spCreated = _tryIngestSprintProposalFromParsed(_validSpProposal);
      if (_spCreated) _applySprintInheritanceToItems(_tgItemsForPanel, _spCreated);
    };
  }
  // T-202606-021: Trigger 3 — sugerencia 1-tap de sprint para INC con triggered_by en sprint activo.
  // No-bloqueante: si el founder ignora, el INC se ingesta sin sprint (Q-Backlog, default).
  const _tgSuggestion = _buildTriggeredBySuggestion(_tgItemsForPanel);
  if (_tgSuggestion) {
    _ckptMeta.triggeredBySuggestion = {
      ..._tgSuggestion,
      onAccept: function() {
        _tgSuggestion.b.sprint = _tgSuggestion.suggestedSprint;
      },
    };
  }
  // Todo CHECKPOINT válido pasa por el DIFF — sin excepción.
  // B-202605-NNN: cancelar timer Supabase de draft antes de abrir el panel diff.
  // Si el usuario tarda >3s en confirmar, el timer se dispara y hace upsert del draft.
  // Ese upsert puede llegar por realtime DESPUÉS del delete post-confirm → restoreDrafts restaura el textarea.
  clearTimeout(window['_draftSbTimer_' + id]);
  showMergeDiffPanel(_tgItemsForPanel, sessId, activeProj.id, (horaRaw) => {
    // B-202606-037: leer horaRaw desde el input del DIFF (mdiff-duration-input).
    // interpretHora convierte HHMM → { label, hhmm, epoch }. Si vacío → null → worker disponible.
    const horaResult = interpretHora((horaRaw || '').replace(/\D/g, ''));
    if (horaResult) {
      newSess.resetAt = horaResult.label;
      // Recalcular durationMs: desde inicio de sesión (epoch estimado) hasta hora de desbloqueo.
      // startEpoch estimado = Date.now() - elapsed acumulado (stopSessionTimer ya lo detuvo).
      const _estimatedStartEpoch = Date.now() - (newSess.durationMs || 0);
      const _calcDuration = horaResult.epoch - _estimatedStartEpoch;
      if (_calcDuration > 0) newSess.durationMs = _calcDuration;
    }
    _doApplyMergeAndFinish(id, ai, parsed, activeProj, horaResult, sessId, tgItems, newSess);
  }, _ckptMeta);
}

// T-202604-201: segunda mitad de _doSaveSession — ejecutada tras confirmación del panel de diff
async function _doApplyMergeAndFinish(id, ai, parsed, activeProj, horaResult, sessId, tgItems, newSess) {
  // B-202605-004: push atómico — la sesión entra en activeProj.sessions solo aquí,
  // después de que el usuario confirmó el panel MergeDiff (o en el fallback directo).
  // Garantiza que cancelar el panel no deja sesiones huérfanas en el array.
  if (!activeProj.sessions) activeProj.sessions = [];
  if (newSess && !activeProj.sessions.find(s => s.id === newSess.id)) {
    activeProj.sessions.push(newSess);
  }

  // v3.0.0: tracker del proyecto activo — también aquí para atomicidad con sessions[].
  // Sin esto, tracker.items quedaría con sessionId huérfano si el usuario cancela el panel.
  // TKT-PARSER-2b (REQ-[pendiente-ID]): PRB/KE/CHG agregados a counters — antes solo DISC/TKT/REQ/INC.
  if (!activeProj.tracker) activeProj.tracker = { items: [], counters: { DISC: 0, TKT: 0, REQ: 0, INC: 0, PRB: 0, KE: 0, CHG: 0 } };
  const tracker = activeProj.tracker;
  let newCount = 0, updCount = 0;
  tgItems.forEach(item => {
    const existing = tracker.items.find(x => x.code === item.code);
    if (existing) {
      existing.desc = item.desc; existing.status = item.status; existing.sessionId = sessId;
      updCount++;
    } else {
      const c = tracker.counters;
      // TKT-PARSER-2b: pattern ampliado con PRB-/KE-/CHG- — antes solo DISC/TKT/REQ/INC.
      const numMatch = item.code.match(/^(DISC|TKT|REQ|INC|PRB|KE|CHG)-\d{6}-(\d{3})/);
      if (numMatch) { const num = parseInt(numMatch[2]); const key = numMatch[1]; if (num >= (c[key] || 0)) c[key] = num; }
      tracker.items.push({id:'tgi-'+Date.now()+'-'+Math.random().toString(36).slice(2,6), code:item.code, desc:item.desc, status:item.status, sessionId:sessId});
      newCount++;
    }
  });

  const raw = (document.getElementById('ta-' + id) || {}).value || '';
  // T-202606-013 AC-1: guard draft:true — defensa secundaria antes de mergeBacklogFromTG.
  // La primera línea de defensa está en parsePaste (bloquea el botón Guardar).
  // Este guard cubre el caso en que _doApplyMergeAndFinish se llama con un parsed que tiene draft:true.
  // AC-1: retorna sin ejecutar merge · AC-3: toast visible con texto canónico
  if (parsed.draft === true) {
    showToast('warn', 'Borrador detectado — pegar CHECKPOINT final emitido por Finn');
    return;
  }
  const mergeResult = _mergeBacklogWithProject(tgItems, sessId, activeProj.id);
  // INC-[pendiente-ID] (triggered_by TKT-202606-014 · fix): applyPatchesFromTG(parsed.patchItems, ...)
  // restaurado. Se había eliminado como "redundante" con la llamada de locus-backlog-merge.js
  // (_mdiffDoApply, post-onApply) — pero esa llamada nunca fue equivalente: opera sobre
  // tgItems.filter(i => i.type === 'patch'), y tgItems ahí es _tgItemsForPanel, construido por
  // _buildPatchTgItems (línea ~289 de este archivo). Esa función convierte cada patch sobre un
  // ítem EXISTENTE en una representación sintética que preserva el `type` real del ítem (ej. 'TKT')
  // — no 'patch' — para que el DIFF calcule el diff de campos vía mergeBacklogFromTG en dry-run.
  // Efecto: el filtro por type==='patch' en locus-backlog-merge.js siempre da array vacío para
  // patches sobre ítems existentes → applyPatchesFromTG nunca se invocaba ahí. El DIFF mostraba
  // el cambio correctamente (dry-run sobre la representación sintética) pero nada se persistía —
  // exactamente el síntoma reportado: "DIFF lo reconoce, status queda en el original".
  // Esta llamada SÍ usa parsed.patchItems (items crudos, type:'patch' intacto) — mismo patrón ya
  // correcto en el path standalone (locus-session-parse.js:1999, _doApply). El bug original que
  // motivó la eliminación (rol nunca propagado, siempre '') se corrige aquí pasando parsed.rol.
  if (parsed.patchItems && parsed.patchItems.length) {
    applyPatchesFromTG(parsed.patchItems, sessId, { ckptHeaderRole: parsed.rol || '', slugMap: mergeResult.slugMap });
  }

  // B-202604-XXX: actualizar trackerRefs con códigos reales post-_assignPendingIds
  // _mergeBacklogWithProject resuelve [pendiente-ID] → código real en tgItems
  // newSess.trackerRefs fue construido antes de esa resolución — se sincroniza aquí
  if (newSess && tgItems.length) {
    newSess.trackerRefs = tgItems.map(x => x.code).filter(c => c && /^[PTRB]-\d{6}-\d{3}/.test(c));
  }

  // T-202604-108: merge de secciones CONTEXT-SECTION si las hay en el paste
  const contextSections = extractContextSections(raw);
  const mergedCtxNames = [];
  if (contextSections.length) {
    contextSections.forEach(s => mergedCtxNames.push(s.header.replace(/^##\s*/, '')));
    mergeContextSections(contextSections, activeProj.id);
  }

  // merge de secciones MAP-SECTION si las hay en el paste
  const mapSections = extractHtmlMapSections(raw);
  if (mapSections.length) mergeHtmlMapSections(mapSections, activeProj.id);

  // R-202604-076 + R-B: parsear y guardar bloque ---PLAN--- / ---EXECUTION-PLAN--- si existe
  // B-202605-XXX: usar _tryIngestPlan en lugar de savePlan directo — preserva scope:sprint al guardar scope:sesion
  if (raw.includes('---PLAN---') || raw.includes('---EXECUTION-PLAN---')) _tryIngestPlan(raw);
  // T-202606-018 AC-2: path JSON puro — execution_plan no produce ---EXECUTION-PLAN--- en raw.
  // Si parsed.executionPlan existe y raw no tiene el bloque texto → ingestar desde objeto parseado.
  if (parsed.executionPlan && !raw.includes('---EXECUTION-PLAN---') && !raw.includes('---PLAN---')) {
    _tryIngestPlanFromParsed(parsed.executionPlan);
  }
  // ── END T-202606-018 ──

  // T-202606-017 AC-1: path Markdown — extraer y registrar DOC-UPDATEs del texto crudo.
  // Complementa el path JSON (AC-2). Se ejecuta solo si raw contiene el bloque.
  // No bloquea el resto del flujo (AC-5).
  // T-202606-073 AC-1: integración de ingesta de DOC-UPDATEs en flujo de save.
  {
    const _ckptTitleMd = (parsed && parsed.title) ? parsed.title : '';
    if (raw && raw.includes('---DOC-UPDATE---')) {
      const _mdDocUpdates = extractDocUpdates(raw);
      _mdDocUpdates.forEach(update => {
        const { conflicto, msg } = processDocUpdate(update, _ckptTitleMd);
        if (conflicto && msg) showToast('warn', msg);
      });
    }
  }
  // ── END T-202606-073 AC-1 ──

  // T-202606-017 AC-1: registrar doc_updates en el índice de DOC-UPDATEs del proyecto.
  // Path JSON puro: usar parsed.docUpdates (array ya extraído en parsePaste).
  // Espeja el patrón de saveStandaloneCheckpoint (locus-session-parse.js).
  // T-202606-073 AC-2: path JSON — cubre parsed.docUpdates.
  {
    const _ckptTitle = (parsed && parsed.title) ? parsed.title : '';
    const _docUpdates = (parsed && Array.isArray(parsed.docUpdates)) ? parsed.docUpdates : [];
    _docUpdates.forEach(update => {
      const { conflicto, msg } = processDocUpdate(update, _ckptTitle);
      if (conflicto && msg) showToast('warn', msg);
    });
  }
  // ── END T-202606-017 / T-202606-073 AC-2 ──

  if (horaResult) { ai.status = 'exhausted'; ai.resetTime = horaResult.hhmm; ai.resetEpoch = horaResult.epoch; }
  ai._parsed = {};
  // T-202604-103: limpiar timer de confirmación si quedó activo
  if (_confirmTimers[id]) { clearTimeout(_confirmTimers[id]); delete _confirmTimers[id]; }
  // B-202605-NNN: clearTimeout antes de removeItem — evita que un timer completado justo antes
  // del save haga upsert en Supabase después de que el draft ya fue eliminado de localStorage.
  // El orden incorrecto (removeItem → clearTimeout) dejaba una ventana donde el timer podía
  // leer el draft de localStorage si se disparaba entre ambas líneas.
  clearTimeout(window['_draftSbTimer_' + id]);
  localStorage.removeItem('draft-' + id);
  localStorage.removeItem('draft-' + id + '-ts');
  // R-3: eliminar borrador de Supabase al guardar sesión
  if (typeof _supabase !== 'undefined' && _supabase && typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    _supabase.from('tracker_docs').delete().eq('user_id', _supabaseUser.id).eq('key', 'draft-' + id)
      .then(({ error }) => { if (error) console.warn('[AI Tracker] draft delete Supabase error:', error); });
  }
  const _taClear = document.getElementById('ta-' + id);
  // B-202605-NNN: no llamar parsePaste(id) aquí — parsePaste con ta.value='' puede re-disparar
  // el debounce path y reescribir el draft si hay un oninput pendiente en la cola del browser.
  // El rAF post-render ya limpia el textarea y valida el estado final.
  if (_taClear) { _taClear.value = ''; _taClear.classList.remove('ta-has-items'); }
  await saveImmediate(); render();
  // R-202604-022: alerta de cuota tras guardar
  _checkStorageQuota();
  // B-007: actualizar stat bar y lista backlog siempre al guardar sesión
  renderStats();
  // B-202604-XXX: actualizar tab Hoy tras guardar CKPT con hora de cierre — sin esto el card no refleja estado exhausted sin refresh manual
  if (getCurrentTab() === 'sesiones') render();
  if (getCurrentTab() === 'backlog') { _markBacklogListDirty(); renderBacklogList(); }
  // R-202604-016: actualizar log card
  _rebuildLogBody();
  // R-003: animar la primera sess-row del card recién guardado
  // B-202605-265: _setPhase(id,3) movido dentro de rAF — render() reconstruye el DOM con
  // grid.innerHTML='', los elementos phase-* no existen hasta el siguiente frame.
  // Segundo render() + renderGlobalRadarSidebar() garantizan sidebar y card actualizados.
  requestAnimationFrame(() => {
    _setPhase(id, 3);
    render();
    _markRadarDirty(); renderGlobalRadarSidebar();
    // B-202605-XXX: re-limpiar draft después del segundo render() — restoreDrafts() corre
    // al final de render() y puede repoblar el textarea si el draft sobrevivió en localStorage
    // (race entre parsePaste con ta.value='' y un oninput/debounce timer previo).
    localStorage.removeItem('draft-' + id);
    localStorage.removeItem('draft-' + id + '-ts');
    const _dotRaf = document.getElementById('draft-' + id);
    if (_dotRaf) _dotRaf.className = 'draft-dot';
    const _taRaf = document.getElementById('ta-' + id);
    if (_taRaf && _taRaf.value.trim()) { _taRaf.value = ''; parsePaste(id); }
    const card = document.getElementById('card-' + id);
    if (card) {
      const firstRow = card.querySelector('.sess-row');
      if (firstRow) {
        firstRow.classList.remove('fade-slide-in');
        void firstRow.offsetWidth; // forzar reflow para reiniciar animación
        firstRow.classList.add('fade-slide-in');
      }
      // T-085: destello verde en el card al guardar sesión
      card.classList.remove('card-flash');
      void card.offsetWidth;
      card.classList.add('card-flash');
      setTimeout(() => card.classList.remove('card-flash'), 650);
      // R-202604-061 AC-1: feedback en botón guardar
      const _sbtn = document.getElementById('sbtn-' + id);
      if (_sbtn) {
        _sbtn.classList.add('btn--saved');
        setTimeout(() => _sbtn.classList.remove('btn--saved'), 1800);
      }
      // T-202604-410: estado transitorio post-merge en card
      const _hasMergeItems = mergeResult && (
        mergeResult.created.length || mergeResult.advanced.length ||
        mergeResult.updated.length || mergeResult.retroceso.length ||
        mergeResult.discarded.length
      );
      if (_hasMergeItems) {
        const _successBadge = document.createElement('div');
        _successBadge.className = 'card-merge-success-badge';
        const _counts = [];
        if (mergeResult.created.length)  _counts.push(`+${mergeResult.created.length} creado${mergeResult.created.length > 1 ? 's' : ''}`);
        if (mergeResult.advanced.length) _counts.push(`${mergeResult.advanced.length} avanzado${mergeResult.advanced.length > 1 ? 's' : ''}`);
        if (mergeResult.updated.length)  _counts.push(`${mergeResult.updated.length} actualizado${mergeResult.updated.length > 1 ? 's' : ''}`);
        if (mergeResult.retroceso.length) _counts.push(`${mergeResult.retroceso.length} retroceso${mergeResult.retroceso.length > 1 ? 's' : ''}`);
        if (mergeResult.discarded.length) _counts.push(`${mergeResult.discarded.length} descartado${mergeResult.discarded.length > 1 ? 's' : ''}`);
        _successBadge.textContent = '✓ Merge aplicado · ' + _counts.join(' · ');
        card.appendChild(_successBadge);
        requestAnimationFrame(() => _successBadge.classList.add('visible'));
        setTimeout(() => {
          _successBadge.classList.remove('visible');
          setTimeout(() => _successBadge.remove(), 400);
        }, 2600);
      }
    }
  });

  // T-202604-061: registrar entrada en changelog si es CHECKPOINT
  if (parsed.isCheckpoint && parsed.estado) _addChangelogEntry(parsed);

  // T-202604-121: super toast con detalle del merge
  // R-202605-140: proximoPaso y decision abren el panel aunque no haya ítems
  const _ckptProximoPaso = parsed.nextStep  || '';
  const _ckptDecision    = parsed.decision  || '';
  // T-202606-039 AC nuevo 1: inlineFixes del CHECKPOINT → panel para visibilidad al founder
  const _ckptInlineFixes = Array.isArray(parsed.inlineFixes) && parsed.inlineFixes.length ? parsed.inlineFixes : null;
  const _isInfoOnly = (v) => !v || v.trim().toLowerCase() === 'n/a';
  const _hasInfoFields = !_isInfoOnly(_ckptProximoPaso) || !_isInfoOnly(_ckptDecision);
  const hasMergeData = mergeResult.created.length || mergeResult.advanced.length || mergeResult.retroceso.length || mergeResult.discarded.length || mergeResult.updated.length || mergeResult.ignored.length || mergedCtxNames.length || _hasInfoFields || !!_ckptInlineFixes;
  if (hasMergeData) {
    showCheckpointPanel({ ...mergeResult, contextSections: mergedCtxNames, proximoPaso: _ckptProximoPaso, decision: _ckptDecision, inlineFixes: _ckptInlineFixes });
  }
  const _baseMsg = horaResult ? `Sesión guardada · desbloquea a las ${horaResult.label}` : 'Sesión guardada';
  showToast('success', _baseMsg);
}

