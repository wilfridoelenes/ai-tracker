// [PP] mod:33 · autor:Rune · 2026-06-30 UTC-6
// INC-[pendiente-ID]: confirmEditSprint() no persistía label/goal/version_target/release_type
//   a tracker_sprints — save() excluye sprints del blob. Fix: _upsertSprint(sp, projId) tras
//   save(), mismo patrón que setSprintStatus.
// TKT-PARSER-sprints (REQ-[pendiente-ID] · retro Q-INC, gate cierre sin isHotfix):
//   _getActiveSprint sin !isHotfix — todos los sprints son expuestos por status:active únicamente.
//   Bloque retro S-HOTFIX reemplazado por INC/PRB/KE/CHG con incidentStatus:'closed'
//   cuyo closedAt >= sprint.startedAt — incluidos en sección "Incidentes cerrados".
//   setSprintStatus: guard isHotfix en newStatus==='closed' eliminada — todos los sprints son cerrables.
//   Gates de activación, formallyOpened y parent heredado: exenciones isHotfix eliminadas.
//   Scheduled queue en activación automática: isHotfix eliminado.
//   Cero referencias activas a isHotfix/S-HOTFIX/hotfix.
//   locus-session-parse.js: !sp.isHotfix eliminado en _tryIngestSprintProposal
//   y _tryIngestSprintProposalFromParsed — sp.status==='active' sin condición adicional.
//   Header migrado de legacy v0.7.0/sprint:PP-S-08 a formato canónico __BR-Execution §9.
// locus-backlog-sprints.js
// Responsabilidad: Catálogo de sprints — CRUD, asignación de ítems, retro,
//   modal de cierre de sprint (SCM), createSprintFromGroup.

import { _calcPriority, _getActiveSessionAiId, _isBlocked, _undoSnapshot, itemKind, renderStats, updateStatusFilterUI, getItems, _registerCoreCallback } from './locus-backlog-core.js';
import { _calcEstimatedVelocity, _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { _templateTrigger } from './locus-session-hora.js';
import { exportFullHistoryMd } from './locus-backlog-generator.js';
import { renderSprintTab } from './locus-sprint.js';
import { _blogLog, _docPrefix, _effectiveVersion, getAI, getActiveProject, getActiveSprints, getAllSessions, getProjectById, save, saveBacklog, saveImmediate, saveHistoricoItems, getHistoricoItems, _getDocUpdateIndex, _setDocUpdateIndex, _upsertSprint, _loadSprintsFromSupabase, _sprintDisplay } from './locus-storage.js'; // T-202606-107 · T-202606-005 · TKT2-[pendiente-ID]: _sprintDisplay para toasts
import { showToast, toast } from './locus-toast.js';
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';

import { _setBacklogModified } from './locus-docs.js';
import { openMapGenerator } from './locus-map-generator.js'; // T-202606-089 AC-3 — ciclo seguro: uso solo dentro de handler

import { render } from './locus-sesiones.js';

// ── T-sprints: Catálogo de sprints ──

// T-202606-072: helper compartido — filtra getActiveSprints() por projId.
// Si projId es null/undefined → retorna todos los sprints sin filtro de proyecto.
// Usado por _getActiveSprint y _getConflictingSprints.
function _sprintsForProject(projId) {
  if (!projId) return getActiveSprints();
  return getActiveSprints().filter(s => s.projId === projId || s.projectId === projId);
}

export function _getActiveSprint() {
  // T-202606-072: _sprintsForProject(null) — sin filtro de proyecto, comportamiento original preservado.
  // TKT-PARSER-sprints (REQ-[pendiente-ID]): isHotfix eliminado — S-HOTFIX deprecado Gen2.
  const all = _sprintsForProject(null).filter(s => s.status === 'active');
  return all.find(s => s.current === true) || all[0] || null;
}

export function _getSprintById(id) {
  return getActiveSprints().find(s => s.id === id) || null;
}

// T-202606-105: Retorna sprints activos en conflicto del proyecto activo.
// El primero por startedAt más reciente se considera el activo canonical — se excluye.
// Retorna el resto de sprints con status 'active' del mismo proyecto.
export function _getConflictingSprints() {
  const proj = getActiveProject();
  const projId = proj ? proj.id : null;
  // T-202606-072: usar helper compartido — equivalente al filtro inline anterior.
  const active = _sprintsForProject(projId).filter(s => s.status === 'active');
  if (active.length <= 1) return [];
  // Ordenar por startedAt desc — el más reciente es el canonical
  const sorted = [...active].sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
  return sorted.slice(1);
}

// T-202605-500: ID con prefijo de proyecto — [PREFIJO]-S[NN], consecutivo por proyecto
// B-202605-077: acepta projId opcional — si se pasa, opera exclusivamente sobre los sprints
//   de ese proyecto, resolviendo el ID incorrecto cuando el DIFF se abre con projId != filtro global
function _nextSprintId(projId) {
  const allSprints = getActiveSprints();

  let prefix;
  let sprintsForCalc;

  if (projId) {
    // B-202606-091: leer desde getActiveSprints() (_sprintsCache) en lugar de proj.sprints directamente
    const sprintsOfProj = getActiveSprints().filter(s => s.projId === projId || s.projectId === projId);
    if (sprintsOfProj.length) {
      const m = (sprintsOfProj[0].id || '').match(/^([A-Za-z]+)-S\d+$/i);
      prefix = m ? m[1].toUpperCase() : 'XX';
    } else {
      const proj = getProjectById(projId);
      if (proj && proj.prefix) {
        prefix = proj.prefix.toUpperCase();
      } else if (proj && proj.name) {
        prefix = proj.name.split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 3) || 'XX';
      } else {
        prefix = _docPrefix();
      }
    }
    sprintsForCalc = sprintsOfProj;
  } else {
    // Comportamiento original — prefijo del proyecto activo en filtro global
    prefix = _docPrefix();
    sprintsForCalc = allSprints;
  }

  const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-S(\\d+)$', 'i');
  const nums = sprintsForCalc
    .map(s => { const m = (s.id || '').match(re); return m ? parseInt(m[1], 10) : NaN; })
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return prefix + '-S' + String(max + 1).padStart(2, '0');
}

// B-202605-077: función compartida que encapsula el formulario de creación de sprint.
// Usada tanto por openNewSprintInline (backlog) como por _mdiffOpenNewSprintForm (DIFF panel).
// projId: ID del proyecto para el que se crea el sprint — determina el prefijo del ID auto-generado.
//   Si es null, usa el proyecto activo en el filtro global (comportamiento original).
// onConfirm(newSprintId): callback invocado con el ID del sprint creado.
// onCancel(): callback invocado si el usuario cancela.
// Devuelve: objeto { html, init(wrapEl) }
//   html: HTML del formulario listo para inyectar en el DOM
//   init(wrapEl): debe llamarse después de insertar html para enganchar eventos y hacer focus
export function _buildNewSprintForm(projId, onConfirm, onCancel) {
  const suggestedRt = _suggestReleaseType([]);
  const suggestedVt = _suggestVersionTarget(suggestedRt);
  const previewId   = _nextSprintId(projId || undefined);

  // Namespace único para IDs DOM — evita colisiones si hay varios formularios simultáneos
  const ns = 'bnsf-' + previewId.replace(/[^a-z0-9]/gi, '_');

  // Validar unicidad del ID propuesto
  function _idIsUnique(id) {
    return !(
             getActiveSprints().some(s => s.id === id));
  }

  // Comprobar si ya hay un sprint activo para el proyecto
  function _hasActiveSprint() {
    // B-202606-091: leer desde getActiveSprints() (_sprintsCache) en lugar de proj.sprints directamente
    if (projId) {
      return getActiveSprints().some(s => (s.projId === projId || s.projectId === projId) && s.status === 'active');
    }
    return getActiveSprints().some(s => s.status === 'active');
  }

  const rtRadios = ['Major', 'Minor', 'Patch'].map(v =>
    `<label class="sprint-inline-release-label">
      <input type="radio" name="${ns}-rt" value="${v}"
        ${suggestedRt === v ? 'checked' : ''}
        data-action="bnsf-rt" data-ns="${ns}">
      ${v}
    </label>`
  ).join('');

  const activeWarn = _hasActiveSprint()
    ? `<div id="${ns}-active-warn" class="sprint-inline-active-warn">
        Ya existe un sprint abierto para este proyecto.
        <button type="button" class="sprint-inline-active-warn-dismiss"
          data-action="bnsf-warn-dismiss" data-ns="${ns}">Continuar</button>
        <button type="button" class="sprint-inline-active-warn-cancel"
          data-action="bnsf-cancel" data-ns="${ns}">Cancelar</button>
       </div>`
    : '';

  const html = `<div class="sprint-inline-edit-wrap sprint-inline-edit-wrap--with-goal" data-bnsf="${ns}">
    ${activeWarn}
    <span class="sprint-inline-id-preview" id="${ns}-id-preview">${esc(previewId)} ·</span>
    <input id="${ns}-name" type="text" placeholder="Nombre descriptivo"
      class="sprint-inline-input"
      data-action="bnsf-keydown" data-ns="${ns}">
    <button type="button" id="${ns}-confirm" class="sprint-inline-confirm"
      data-action="bnsf-confirm" data-ns="${ns}">&#10003;</button>
    <button type="button" class="sprint-inline-cancel"
      data-action="bnsf-cancel" data-ns="${ns}">&#10005;</button>
    <input id="${ns}-goal" type="text" placeholder="Goal del sprint (opcional, max 120)"
      class="sprint-inline-goal-input" maxlength="120"
      data-action="bnsf-keydown" data-ns="${ns}">
    <div class="sprint-inline-release-row">
      <label class="sprint-inline-release-label">Versión:</label>
      <input id="${ns}-vt" type="text" value="${esc(suggestedVt)}"
        class="sprint-inline-vt-input" placeholder="ej: v1.1.0"
        data-action="bnsf-vt-input" data-ns="${ns}">
      <span id="${ns}-vt-err" class="sprint-field-err is-hidden"></span>
      <label class="sprint-inline-release-label">Tipo de release:</label>
      <div class="sprint-inline-release-radios">${rtRadios}</div>
      <span id="${ns}-rt-err" class="sprint-field-err is-hidden"></span>
    </div>
  </div>`;

  function init(wrapEl) {
    // Registrar handlers globales con namespace — se limpian solos al confirmar/cancelar
    window['_bnsf_syncBtn'] = window['_bnsf_syncBtn'] || function(ns2) {
      const btn  = document.getElementById(ns2 + '-confirm');
      const vtEl = document.getElementById(ns2 + '-vt');
      const rtEls = document.querySelectorAll(`input[name="${ns2}-rt"]`);
      if (!btn) return;
      const vtOk = vtEl && vtEl.value.trim().length > 0;
      const rtOk = Array.from(rtEls).some(r => r.checked);
      btn.disabled = !(vtOk && rtOk);
    };

    window['_bnsf_confirm'] = function(ns2) {
      const nameEl = document.getElementById(ns2 + '-name');
      const name   = nameEl ? nameEl.value.trim() : '';
      if (!name) { if (nameEl) nameEl.focus(); return; }

      const goalEl = document.getElementById(ns2 + '-goal');
      const goal   = goalEl ? goalEl.value.trim() : '';
      const vtEl   = document.getElementById(ns2 + '-vt');
      const vt     = vtEl ? vtEl.value.trim() : '';
      const rtEls  = document.querySelectorAll(`input[name="${ns2}-rt"]`);
      const rt     = (Array.from(rtEls).find(r => r.checked) || {}).value || '';

      let valid = true;
      if (!vt) {
        valid = false;
        const errEl = document.getElementById(ns2 + '-vt-err');
        if (vtEl) vtEl.classList.add('input-outline-error');
        if (errEl) { errEl.textContent = 'Ingresa una versión (ej: v1.0.0)'; errEl.classList.remove('is-hidden'); }
      }
      if (!rt) {
        valid = false;
        const errEl = document.getElementById(ns2 + '-rt-err');
        if (errEl) { errEl.textContent = 'Selecciona el tipo de release'; errEl.classList.remove('is-hidden'); }
      }
      if (!valid) return;

      // B-202605-077 AC: validar unicidad del ID antes de crear
      const proposedId = _nextSprintId(projId || undefined);
      if (!_idIsUnique(proposedId)) {
        const errEl = document.getElementById(ns2 + '-vt-err');
        if (errEl) {
          errEl.textContent = 'El ID ' + proposedId + ' ya existe. Cierra el sprint activo primero.';
          errEl.classList.remove('is-hidden');
        }
        return;
      }

      // T-202606-015 AC-1: si ya hay sprint activo para el proyecto, el nuevo nace como 'scheduled'
      const _initialStatus = _hasActiveSprint() ? 'scheduled' : undefined;
      const newId = createSprint(name, goal, vt, rt, projId || undefined, _initialStatus);
      if (!newId) {
        // createSprint falló (sin proyecto activo u otro error) — no asignar sprint
        onCancel();
        return;
      }
      // Limpiar handlers globales del namespace
      delete window['_bnsf_confirm'];
      delete window['_bnsf_cancel'];
      onConfirm(newId);
    };

    window['_bnsf_cancel'] = function(ns2) {
      delete window['_bnsf_confirm'];
      delete window['_bnsf_cancel'];
      onCancel();
    };

    // _bnsf_* guards externos deprecados 2026-06-21 — los guards en confirmNewSprint y listeners externos eliminados.
    // Las definiciones window['_bnsf_*'] aquí arriba son legítimas — mecanismo interno del formulario de nuevo sprint.
    // Listeners para ${ns}-vt — input y keydown
    setTimeout(() => {
      const vtEl = document.getElementById(ns + '-vt');
      if (vtEl) {
        vtEl.addEventListener('input', () => {
          if (typeof window['_bnsf_syncBtn'] === 'function') window['_bnsf_syncBtn'](ns);
          _clearSprintFieldErr(ns + '-vt-err');
        });
        vtEl.addEventListener('keydown', e => {
          if (e.key === 'Enter')  { e.preventDefault(); if (typeof window['_bnsf_confirm'] === 'function') window['_bnsf_confirm'](ns); }
          if (e.key === 'Escape') { e.preventDefault(); if (typeof window['_bnsf_cancel']  === 'function') window['_bnsf_cancel'](ns); }
        });
      }
    }, 0);

    // Sync inicial + focus
    setTimeout(() => {
      if (typeof window['_bnsf_syncBtn'] === 'function') window['_bnsf_syncBtn'](ns);
      const inp = document.getElementById(ns + '-name');
      if (inp) inp.focus();
    }, 30);
  }

  return { html, init };
}

// T-202605-500: validar que el nombre descriptivo no esté vacío — el ID lo genera PP automáticamente
function _isValidSprintName(label) {
  return !!(label && label.trim());
}

// R-202605-134: sugerir release_type basado en el contenido del sprint
// Solo INC/TKT → Patch · REQs features/UX → Minor · REQs arquitectura/refactor → Major · mezcla REQs+INC → Minor
function _suggestReleaseType(sprintItems) {
  if (!sprintItems || !sprintItems.length) return 'Patch';
  const hasR = sprintItems.some(i => i.type === 'REQ');
  const hasB = sprintItems.some(i => i.type === 'INC');
  const hasT = sprintItems.some(i => i.type === 'TKT');
  if (!hasR) return 'Patch';
  // REQs arquitectura/refactor → Major (keywords heurísticos)
  const archKeywords = /migra|refactor|arquitectura|core|parser|schema|json/i;
  const hasArch = sprintItems.some(i => i.type === 'REQ' && archKeywords.test(i.title || ''));
  if (hasArch) return 'Major';
  // mezcla REQs+INC → Minor
  if (hasR && hasB) return 'Minor';
  // REQs features/UX → Minor
  return 'Minor';
}

// R-202605-134: sugerir version_target basado en última versión registrada
// Incrementa el segmento correcto según release_type
function _suggestVersionTarget(releaseType) {
  try {
    const vStr = _effectiveVersion() || '0.0.0';
    const clean = vStr.replace(/^v/i, '');
    const parts = clean.split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    if (releaseType === 'Major') return `v${major + 1}.0.0`;
    if (releaseType === 'Minor') return `v${major}.${minor + 1}.0`;
    return `v${major}.${minor}.${patch + 1}`;
  } catch { return 'futura'; }
}

// R-202605-123: createSprint acepta goal opcional (máx 120 chars)
// R-202605-134: acepta version_target y release_type — se calculan con sugerencia automática si no se pasan
// T-202605-500: ID generado internamente con prefijo de proyecto — founder solo pasa nombre descriptivo
export function createSprint(raw, goal, versionTarget, releaseType, projId, initialStatus) {
  // B-202605-077: si se pasa projId, operar sobre ese proyecto en lugar del filtro global
  const _activeProjForSprint = projId ? getProjectById(projId) : getActiveProject();
  if (!_activeProjForSprint) { showToast('warning', 'Selecciona un proyecto primero'); return; }
  if (!_activeProjForSprint.sprints) _activeProjForSprint.sprints = [];
  raw = (raw || '').trim();
  // T-202605-500: ID siempre auto-generado — el founder solo ingresa el nombre descriptivo
  const id = _nextSprintId(projId || undefined);
  const displayLabel = raw || id;
  if (!_isValidSprintName(displayLabel)) {
    showToast('warning', '⚠ Nombre de sprint no puede estar vacío');
    return;
  }
  if (_getSprintById(id)) { showToast('warning', 'Ya existe ' + id); return id; }
  // B-202605-XXX: guard — si el ID generado ya existe implícitamente en ítems del backlog
  // bloquear creación para evitar colisión. El founder debe usar "Registrar" en lugar de "Nuevo sprint".
  if (typeof getItems() !== 'undefined') {
    const _implicitSprintIds = new Set(getItems().map(i => i.sprint).filter(Boolean));
    if (_implicitSprintIds.has(id)) {
      showToast('warning', id + ' ya tiene ítems en el backlog. Usa "Registrar y activar ' + id + '" en lugar de crear uno nuevo.');
      return;
    }
  }
  const goalTrimmed = (goal || '').trim().slice(0, 120);
  // R-202605-134: version_target y release_type — usar sugerencia si no se pasan explícitamente
  const rt  = (releaseType   || '').trim() || null;
  const vt  = (versionTarget || '').trim() || null;
  // B-[pendiente-ID]: label NO concatena el ID — id y label son campos separados (BR-Ecosystem §5)
  const canonicalLabel = displayLabel || id;
  // B-202605-028: modelo multi-sprint — no cerrar sprints activos al crear uno nuevo.
  // El founder decide qué sprint es "en curso" via flag current:true.
  const hasCurrentSprint = _activeProjForSprint.sprints.some(s => s.status === 'active' && s.current === true);
  const _newSprint = {
    id, label: canonicalLabel, goal: goalTrimmed,
    version_target: vt, release_type: rt,
    // B-202605-057: status 'active' desde creación — _getActiveSprint() lo detecta inmediatamente
    // B-202605-028: marcar current:true si ningún sprint activo del proyecto lo tiene aún
    // T-202606-015 AC-1: initialStatus permite crear sprint en 'scheduled' si ya hay uno activo
    status: initialStatus || 'active',
    current: (!hasCurrentSprint && (initialStatus || 'active') === 'active') ? true : undefined,
    formallyOpened: false,
    startedAt: Date.now(), createdAt: Date.now()
  };
  // T-202606-005 AC-4: upsert a tracker_sprints — no mutación del blob.
  // _upsertSprint actualiza _sprintsCache y persiste en Supabase (o localStorage fallback).
  const _projIdForUpsert = _activeProjForSprint.id;
  _upsertSprint(_newSprint, _projIdForUpsert).catch(err => {
    console.error('[Locus] T-202606-005: createSprint upsert falló', err);
  });
  // B-202605-058: saveImmediate() persiste el resto del state (sin sprints en blob desde T-202606-005)
  saveImmediate();
  return id;
}

// T-202606-121: generar MD de retrospectiva con schema canónico del BR
// Secciones: ## Retro · [Prefijo]-S-XX → Done · Migrado · Descartado ·
//   Doc-Updates aplicados · Doc-Updates pendientes → ## Narrativa · [Prefijo]-S-XX
// AC-8: el string se asigna a sprint.retroDoc antes de save() en _scmExecuteClose.
// Accede a _scmState vía closure de módulo para leer docUpdates con resolución.
function _generateSprintRetroMd(id, notes) {

  // ── AC-2: Done — ítems que estaban done al cerrar el sprint.
  // _scmExecuteClose ya mutó done/descartado → historico antes de llamar esta función.
  // Incluir 'historico' para reflejar la realidad post-cierre.
  const sprintItems  = getItems().filter(i => _sprintIdOf(i) === id);
  const doneItems    = sprintItems.filter(i => i.status === 'done' || i.status === 'historico');

  // ── AC-3: Migrado — eliminado. Bajo Gate duro de cierre (__BR-Ecosystem §5),
  // ningún R/T/B activo puede salir de un sprint por reasignación — la única
  // salida de un ítem bloqueante es done o descartado. "Migrado" es siempre
  // "ninguno" para R/T/B. Fix de alineación BR — auditoría 2026-06-22.
  const migratedItems = [];

  // ── AC-4: Descartado — ítems descartados con justificación.
  // Incluye: ítems del sprint que tenían status=descartado + pendientes con dest=__discard__.
  const discardedItems = [];
  {
    // Ítems que ya eran descartado en el backlog (status descartado al cierre)
    sprintItems
      .filter(i => i.status === 'descartado')
      .forEach(i => discardedItems.push(i));
    // Pendientes que el founder eligió descartar en el stepper (dest=__discard__)
    if (_scmState && Array.isArray(_scmState.pendingItems)) {
      _scmState.pendingItems.forEach(pi => {
        const dest = _scmState.migrations[pi.code];
        if (dest !== '__discard__') return;
        const live = getItems().find(i => i.code === pi.code);
        if (live && !discardedItems.some(d => d.code === live.code)) {
          discardedItems.push(live);
        }
      });
    }
  }

  // ── AC-5/AC-6: Doc-Updates — leer desde _scmState.docUpdates con resolución aplicada en Paso 2.
  const docUpdates = (_scmState && Array.isArray(_scmState.docUpdates))
    ? _scmState.docUpdates
    : [];
  const duAplicados   = docUpdates.filter(d => d.resolucion === 'aplicado');
  const duDescartados = docUpdates.filter(d => d.resolucion === 'descartado');

  // TKT-PARSER-sprints (REQ-[pendiente-ID]): INC closed de Q-INC con closedAt >= sprint.openedAt
  // reemplaza bloque de S-HOTFIX — Gen2: Q-INC es la cola ITIL, S-HOTFIX deprecado.
  // INC closed antes de la apertura del sprint no se incluyen.
  const _sprintForRetro = _getSprintById(id);
  const _sprintOpenedAt = _sprintForRetro ? (_sprintForRetro.startedAt || 0) : 0;
  const _pad = n => String(n).padStart(2, '0');
  const _incDate = ts => {
    const d = new Date(ts || Date.now());
    return `${d.getFullYear()}-${_pad(d.getMonth()+1)}-${_pad(d.getDate())}`;
  };
  const incClosedItems = getItems().filter(i => {
    if (i.type !== 'INC' && i.type !== 'PRB' && i.type !== 'KE' && i.type !== 'CHG') return false;
    if (i.incidentStatus !== 'closed') return false;
    const _closedTs = i.closedAt || i.statusChangedAt || 0;
    return _closedTs >= _sprintOpenedAt;
  });
  const _incClosedList = incClosedItems.length
    ? incClosedItems.map(i => `- ${i.code}: incident \u00b7 ${_incDate(i.closedAt || i.statusChangedAt)}`).join('\n')
    : '';

  // ── Helpers de serialización ──

  // AC-2: lista de códigos de ítems Scrum done
  const _doneList = doneItems.length
    ? doneItems.map(i => `- ${i.code}`).join('\n')
    : 'ninguno';

  // AC-3: lista con destino '[código]: [sprint destino]'
  const _migratedList = migratedItems.length
    ? migratedItems.map(m => `- ${m.code}: ${m.dest}`).join('\n')
    : 'ninguno';

  // AC-4: lista con justificación — si no tiene discard_reason → 'sin justificación declarada'
  const _discardedList = discardedItems.length
    ? discardedItems.map(i => {
        const reason = i.discard_reason ? i.discard_reason : 'sin justificación declarada';
        return `- ${i.code}: ${reason}`;
      }).join('\n')
    : 'ninguno';

  // AC-5: Doc-Updates aplicados — 'doc: [nombre] · sección: [sección] · aplicado-por: [escalarA]'
  const _duAplicadosList = duAplicados.length
    ? duAplicados.map(d => `- doc: ${d.doc} · sección: ${d.seccion} · aplicado-por: ${d.escalarA || 'n/a'}`).join('\n')
    : 'ninguno';

  // AC-6: Doc-Updates pendientes (marcados como descartados en el stepper) —
  // 'doc: [nombre] · sección: [sección] · escalar-a: [escalarA] · descartado en cierre'
  const _duDescartadosList = duDescartados.length
    ? duDescartados.map(d => `- doc: ${d.doc} · sección: ${d.seccion} · escalar-a: ${d.escalarA || 'n/a'} · descartado en cierre`).join('\n')
    : 'ninguno';

  // AC-7: sección Narrativa — placeholder vacío
  const narrativaSection = `## Narrativa · ${id}\n\n[Agregar narrativa por rol]`;

  // ── Componer output ──
  // Orden exacto de AC-1: ## Retro · [id] → Done · Migrado · Descartado ·
  //   Doc-Updates aplicados · Doc-Updates pendientes → ## Narrativa · [id]
  // B-202606-029: headers usan [id] — [label] era incorrecto y fue corregido
  // TKT-PARSER-sprints: incluir sección de incidentes cerrados si existen
  const _incSection = _incClosedList
    ? `\nIncidentes cerrados:\n${_incClosedList}`
    : '';

  return `## Retro · ${id}

Done: ${_doneList}
Migrado: ${_migratedList}
Descartado: ${_discardedList}
Doc-Updates aplicados:
${_duAplicadosList}
Doc-Updates pendientes:
${_duDescartadosList}${_incSection}

${narrativaSection}
`;
}

// T-202604-262: mostrar modal de descarga opcional de retrospectiva
// T-202604-417: abre el overlay de retro en modo vista — muestra retro guardada del sprint cerrado
export function openSprintRetroView(id) {
  const sp = _getSprintById(id);
  if (!sp) return;
  const sprintLabel = sp.label ? `${sp.id} · ${sp.label}` : sp.id;
  const retroDoc = sp.retroDoc || '';
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const closedAt = sp.closedAt ? new Date(sp.closedAt) : now;
  const closedStr = `${closedAt.getFullYear()}-${pad(closedAt.getMonth()+1)}-${pad(closedAt.getDate())}`;
  const pfx = _docPrefix();
  const filename = `${pfx}-Retrospectiva-${id}-${closedStr}.md`;

  const overlay = document.getElementById('sprint-retro-overlay');
  if (!overlay) return;

  const titleEl   = document.getElementById('sprint-retro-title');
  const bodyEl    = document.getElementById('sprint-retro-body');
  const notesEl   = document.getElementById('sprint-retro-notes');
  const filenameEl = document.getElementById('sprint-retro-filename');

  if (titleEl)   titleEl.textContent = `📄 Retrospectiva — ${sprintLabel}`;
  if (filenameEl) filenameEl.textContent = filename;

  // Mostrar MD como texto pre-formateado en el body
  if (bodyEl) bodyEl.textContent = retroDoc || '(sin retrospectiva guardada)';

  // Campo de notas solo lectura en vista
  if (notesEl) {
    notesEl.value = sp.retroNotes || '';
    notesEl.readOnly = true;
    notesEl.placeholder = '';
  }

  overlay.classList.add('open', 'sprint-retro-overlay--view');

  // Botón descargar: usa el retroDoc guardado
  const dlBtn = document.getElementById('sprint-retro-dl-btn');
  if (dlBtn) {
    const newDlBtn = dlBtn.cloneNode(true);
    dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);
    newDlBtn.addEventListener('click', () => {
      const md = retroDoc || _generateSprintRetroMd(id, sp.retroNotes || '');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('download', 'Retrospectiva descargada', filename);
    });
  }
}

function closeSprintRetroOverlay() {
  const overlay = document.getElementById('sprint-retro-overlay');
  if (overlay) overlay.classList.remove('open', 'sprint-retro-overlay--view');
}

// T-202604-417: prompt de descarga post-cierre — distinto de la vista de retro guardada
function _openRetroDownloadPrompt(id) {
  const sp = _getSprintById(id);
  if (!sp) return;
  const sprintLabel = sp.label ? `${sp.id} · ${sp.label}` : sp.id;
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const closedAt = sp.closedAt ? new Date(sp.closedAt) : now;
  const closedStr = `${closedAt.getFullYear()}-${pad(closedAt.getMonth()+1)}-${pad(closedAt.getDate())}`;
  const pfx = _docPrefix();
  const filename = `${pfx}-Retrospectiva-${id}-${closedStr}.md`;

  const overlay = document.getElementById('sprint-retro-overlay');
  if (!overlay) return;
  overlay.classList.remove('sprint-retro-overlay--view');

  const titleEl    = document.getElementById('sprint-retro-title');
  const bodyEl     = document.getElementById('sprint-retro-body');
  const notesEl    = document.getElementById('sprint-retro-notes');
  const filenameEl = document.getElementById('sprint-retro-filename');

  if (titleEl)    titleEl.textContent = `✅ Sprint cerrado — ${sprintLabel}`;
  if (filenameEl) filenameEl.textContent = filename;
  if (bodyEl)     bodyEl.textContent = '';  // no mostrar MD completo en prompt de descarga
  if (notesEl) { notesEl.classList.add('is-hidden'); }

  overlay.classList.add('open');

  const dlBtn = document.getElementById('sprint-retro-dl-btn');
  if (dlBtn) {
    const newDlBtn = dlBtn.cloneNode(true);
    dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);
    newDlBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      const md = sp.retroDoc || _generateSprintRetroMd(id, sp.retroNotes || '');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('download', 'Retrospectiva descargada', filename);
    });
  }
}

export async function setSprintStatus(id, newStatus) {
  // T-202606-015 AC-2: valores válidos extendidos — 'active' | 'closed' | 'scheduled' | 'discarded'
  // TKT-PARSER-sprints: guard isHotfix eliminada — S-HOTFIX deprecado Gen2, todos los sprints son cerrables.
  // if (newStatus === 'closed') — bloque eliminado, sin guard activa.
  // T-202606-015 AC-3: 'discarded' solo opera sobre sprints con status 'scheduled'
  // sprints 'active' o 'closed' no pueden descartarse — toast de error + retorno temprano sin modificar
  if (newStatus === 'discarded') {
    const target = _getSprintById(id);
    if (!target) return;
    if (target.status !== 'scheduled') {
      showToast('error', 'Solo sprints programados pueden descartarse');
      return;
    }
  }
  if (newStatus === 'active') {
    // T-202606-106: gate — rechazar si ya existe sprint active para el proyecto distinto al id recibido
    const _targetForGate = _getSprintById(id);
    const _projIdForGate = _targetForGate ? (_targetForGate.projId || _targetForGate.projectId || null) : null;
    const _existingActive = getActiveSprints().find(s => {
      if (s.status !== 'active') return false;
      if (s.id === id) return false;          // el mismo sprint — no es conflicto
      if (!_projIdForGate) return false;      // sin projId no se puede filtrar — no bloquear
      return (s.projId === _projIdForGate || s.projectId === _projIdForGate);
    });
    if (_existingActive) {
      // TKT2-[pendiente-ID]: _sprintDisplay aplica patrón id · label en mensaje de conflicto
      showToast('error', `Ya hay un sprint activo: ${_sprintDisplay(_existingActive.id)}. Ciérralo antes de activar otro.`);
      return false; // B-202606-042: retorno explícito — permite que callers detecten el rechazo
    }
  }
  const sp = _getSprintById(id);
  if (!sp) return;
  sp.status = newStatus;
  if (newStatus === 'active')     sp.startedAt   = sp.startedAt   || Date.now();
  if (newStatus === 'closed')     sp.closedAt    = sp.closedAt    || Date.now();
  if (newStatus === 'closed')     sp.endsAt      = sp.endsAt      || Date.now();
  // T-202606-015 AC-2: timestamps para nuevos valores
  if (newStatus === 'scheduled')  sp.scheduledAt = sp.scheduledAt || Date.now();
  if (newStatus === 'discarded')  sp.discardedAt = sp.discardedAt || Date.now();
  if (newStatus !== 'closed') { delete sp.closedAt; delete sp.endsAt; }
  // B-202606-005: limpiar current:true al cerrar — state no debe tener sprints cerrados marcados como en curso
  if (newStatus === 'closed')    delete sp.current;
  // inline_fix: limpiar current:true al descartar — sprint descartado no puede estar en curso
  if (newStatus === 'discarded') delete sp.current;
  // B-202605-210 guard: al cerrar un sprint directamente (sin modal), desasignar
  // ítems pendientes que quedaron huérfanos para evitar data inconsistente.
  if (newStatus === 'closed') {
    let guardCount = 0;
    getItems().forEach(item => {
      if (item.status === 'pendiente' && item.sprint === id) {
        if (!item.history) item.history = [];
        item.history.push({
          type: 'sprint',
          ts: Date.now(),
          data: { from: id, to: null, reason: 'sprint-closed-guard' }
        });
        item.sprint = '';
        guardCount++;
      }
    });
    if (guardCount > 0) {
      console.log(`[AI Tracker] B-202605-210 guard: ${guardCount} ítem(s) pendiente(s) desasignados de ${id} al cerrar`);
    }
    // B-202605-232: migrar done/descartado → historico al cerrar sprint directamente (sin modal 3 pasos)
    // T-202606-108: conectar con storage dedicado (T-202606-105) — mismo patrón que _scmExecuteClose
    const closeTs = Date.now();
    const _historicoCodesDirectClose = new Set();
    getItems().forEach(i => {
      if (_sprintIdOf(i) === id && (i.status === 'done' || i.status === 'descartado')) {
        i.status = 'historico';
        i.archivedAt = closeTs;
        _historicoCodesDirectClose.add(i.code);
      }
    });
    // AC-4: 0 ítems califican → no invocar saveHistoricoItems ni getHistoricoItems, sin excepción.
    if (_historicoCodesDirectClose.size > 0) {
      const _itemsArr = getItems();
      const _newHistorico = _itemsArr.filter(i => _historicoCodesDirectClose.has(i.code));
      // Acumular sobre lo ya persistido — saveHistoricoItems() sobreescribe la clave completa.
      try {
        const _existingHistorico = await getHistoricoItems();
        await saveHistoricoItems([...(_existingHistorico || []), ..._newHistorico]);
      } catch (err) {
        // AC-3: fallo de escritura no revierte el cierre — fallback a localStorage cubierto
        // internamente por saveHistoricoItems. Registrar en DocLog con sprint_id afectado.
        console.error('[AI Tracker] setSprintStatus closed: fallo al persistir historico en storage dedicado', err);
        _blogLog('historico-write-error', id, `Fallo al persistir ${_historicoCodesDirectClose.size} ítem(s) historico en storage dedicado al cerrar ${id} (cierre directo): ${err.message || err}`, 'backlog');
      }
      // AC-2: remover de ITEMS — splice in-place sobre referencia mutable, fuera del try/catch
      // para garantizar que ocurre independientemente del resultado de saveHistoricoItems.
      for (let _idx = _itemsArr.length - 1; _idx >= 0; _idx--) {
        if (_historicoCodesDirectClose.has(_itemsArr[_idx].code)) _itemsArr.splice(_idx, 1);
      }
    }
    if (guardCount > 0 || _historicoCodesDirectClose.size > 0) {
      saveBacklog(); // una sola vez tras ambas operaciones
    }
  }
  // T-202606-005 AC-5: upsert del sprint actualizado a tracker_sprints — no depende del blob.
  // sp ya fue mutado arriba — _upsertSprint refleja el estado actualizado en Supabase y cache.
  const _projIdForStatusUpsert = sp.projId || sp.projectId || getActiveProject()?.id || '';
  _upsertSprint(sp, _projIdForStatusUpsert).catch(err => {
    console.error('[Locus] T-202606-005: setSprintStatus upsert falló', err);
  });

  // T-202606-003 AC-1/AC-2: closed usa saveImmediate() — evita pérdida del cierre si el
  // founder navega o recarga antes de que el debounce de save() dispare _saveFlush().
  // Otras transiciones (active/scheduled/discarded) mantienen save() con debounce normal.
  if (newStatus === 'closed') {
    try {
      await saveImmediate();
    } catch (err) {
      console.error('[AI Tracker] setSprintStatus closed: fallo al persistir de forma inmediata', err);
      _blogLog('persist-error', id, `Fallo al persistir cierre de sprint ${id} de forma inmediata: ${err.message || err}`, 'backlog');
      showToast('warning', `${id} marcado cerrado localmente — sincronización pendiente`);
    }
  } else {
    save();
  }
  _markBacklogListDirty(); renderBacklogList();
  showToast('info', id + ' → ' + newStatus);
}

// T-202605-026: setSprintCurrent vive en locus-sprint.js (T-202605-107)
// Implementación eliminada de este módulo — era duplicación con filtro roto (s.projectId siempre undefined).
// window.setSprintCurrent lo expone locus-sprint.js.

export function setItemSprint(code, sprintId) {
  if (sprintId === '__new__') { openNewSprintInline(code); return; }
  // T-202606-133: gate formallyOpened — bloquear asignación a sprint no aprobado
  // TKT-PARSER-sprints: exención isHotfix eliminada — S-HOTFIX deprecado Gen2.
  if (sprintId) {
    const targetSprint = _getSprintById(sprintId);
    if (targetSprint && targetSprint.formallyOpened === false) {
      showToast('warning', 'Sprint pendiente de aprobación — el founder debe aprobarlo antes de asignar ítems');
      return;
    }
  }
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  // T-202606-036 AC5: T con parent — bloquear asignación de sprint distinto al del parent
  // TKT-PARSER-sprints: exención isHotfix eliminada — S-HOTFIX deprecado Gen2.
  if (item.parentId && item.code && itemKind(item) === 'TKT') {
    // TKT-PARSER-sprints: exención isHotfix eliminada — gate aplica a todos los sprints.
    const targetSprintForParentGate = _getSprintById(sprintId);
    const parentItem = getItems().find(i => i.code === item.parentId);
    if (parentItem) {
      const parentSprint = parentItem.sprint || '';
      const incomingSprint = sprintId || '';
      if (incomingSprint !== parentSprint) {
        showToast('warning', 'El sprint del T se hereda de su parent ' + item.parentId);
        return;
      }
    }
  }
  const prevSprint = item.sprint || '';
  // TKT-B3 (BR-Ecosystem §5): sprint vacío o falsy = sin sprint asignado (Q-Backlog) — '' es el valor canónico.
  const normalizedId = sprintId || '';
  item.sprint = normalizedId;
  item.priority = _calcPriority(item); // T-202604-297
  // R-202605-131: marcar scope_added si el sprint destino está activo al momento de asignar
  // Solo sprints reales (con sprint asignado) califican para scope_added
  if (normalizedId) {
    const targetSprint = _getSprintById(normalizedId);
    if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
      item.scope_added = true;
    } else if (prevSprint === normalizedId) {
      // No marcar si se mueve al mismo sprint
    }
  } else {
    // Al desasignar de sprint (vuelve a Q-Backlog), limpiar el flag
    delete item.scope_added;
  }
  if (!item.history) item.history = [];
  item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevSprint || null, to: item.sprint || null } });

  // T-202606-036 AC1+AC2 · T-202606-161: mover TKTs hijos sin sprint asignado al nuevo sprint del REQ
  // T-202606-161 AC-2: TKTs con sprint ya asignado (distinto de vacío) no se sobreescriben
  if (item.code && itemKind(item) === 'REQ') {
    const _movedChildren = [];
    getItems().forEach(child => {
      if (child.parentId === item.code && child.code && itemKind(child) === 'TKT') {
        const prevChildSprint = child.sprint || '';
        if (prevChildSprint !== '') return; // T-202606-161 AC-2: conservar sprint ya asignado
        child.sprint = normalizedId;
        _movedChildren.push(child.code);
        if (!child.history) child.history = [];
        child.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevChildSprint, to: normalizedId, inherited_from: item.code } });
      }
    });
    // T-202606-161 AC-3: DocLog entry consolidada en el sprint destino
    if (_movedChildren.length > 0 && normalizedId) {
      const _targetSprint = _getSprintById(normalizedId);
      if (_targetSprint) {
        if (!Array.isArray(_targetSprint.docLog)) _targetSprint.docLog = [];
        _targetSprint.docLog.push(`${_movedChildren.length} Ts movidos a sprint ${normalizedId} por asignación de parent ${item.code}: ${_movedChildren.join(', ')}`);
      }
    }
  }

  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  _markBacklogListDirty(); renderBacklogList();
  renderStats();
}

// R-202605-009: sync estado de botón confirm — disabled hasta que vt y rt tengan valor
function _syncSprintConfirmBtn(code) {
  const btn  = document.getElementById('new-sprint-confirm-' + code);
  const vtEl = document.getElementById('new-sprint-vt-' + code);
  const rtEls = document.querySelectorAll(`input[name="new-sprint-rt-${CSS.escape(code)}"]`);
  if (!btn) return;
  const vtOk = vtEl && vtEl.value.trim().length > 0;
  const rtOk = Array.from(rtEls).some(r => r.checked);
  btn.disabled = !(vtOk && rtOk);
}

// B-202605-077: refactorizado para consumir _buildNewSprintForm — comportamiento externo idéntico
// T-202605-079: funciones top-level invocables desde fuera del módulo sin pasar por openNewSprintInline

function _sprintInlineOnConfirm(code, newId) {
  setItemSprint(code, newId);
}

function _sprintInlineInit(wrapEl, form, velocityData) {
  wrapEl.innerHTML = form.html;
  const hint = document.createElement('span');
  if (velocityData !== null) {
    hint.className = 'sprint-inline-hint';
    hint.innerHTML = `Velocidad real promedio: <strong>${velocityData.avg}</strong> effort`;
    wrapEl.querySelector('.sprint-inline-edit-wrap').insertAdjacentElement('beforeend', hint);
  }
  form.init(wrapEl);
}

export function openNewSprintInline(code) {
  const wrap = document.getElementById('sprint-select-wrap-' + CSS.escape(code));
  if (!wrap) return;

  // T-202605-450: sugerencia de effort máximo basada en velocidad histórica
  const velocityData = _calcEstimatedVelocity();

  const form = _buildNewSprintForm(
    null, // null = proyecto activo en filtro global (comportamiento original)
    function onConfirm(newId) { _sprintInlineOnConfirm(code, newId); },
    function onCancel() {
      _markBacklogListDirty(); renderBacklogList();
    }
  );

  _sprintInlineInit(wrap, form, velocityData);
}

// R-202605-009: limpiar mensaje de error de campo
function _clearSprintFieldErr(errId) {
  const el = document.getElementById(errId);
  if (!el) return;
  el.textContent = '';
  el.classList.add('is-hidden');
  // B-202605-506: quitar borde de error del input asociado (hermano anterior al span)
  const prev = el.previousElementSibling;
  if (prev && prev.tagName === 'INPUT') prev.classList.remove('input-outline-error');
}


// T-202604-246: edición inline del nombre de sprint desde el header del grupo
// R-202605-123: incluye campo goal editable
export function editSprintInline(sprintId) {
  const wrap = document.getElementById('sprint-label-wrap-' + CSS.escape(sprintId));
  if (!wrap) return;
  const sp = _getSprintById(sprintId);
  if (!sp) return;
  // T-202605-500: separar ID fijo del nombre descriptivo editable
  const currentDescriptive = (sp.label || sp.id).replace(/^[A-Z]+[-\s]S\d+\s*·?\s*/i, '').trim() || (sp.label || sp.id);
  const currentGoal = sp.goal || '';
  // R-202605-134: leer o sugerir version_target y release_type
  const spItems   = getItems().filter(i => i.sprint === sprintId);
  const suggestRt = sp.release_type  || _suggestReleaseType(spItems);
  const suggestVt = sp.version_target || _suggestVersionTarget(suggestRt);
  const inputId = 'edit-sprint-inp-' + sprintId;
  const goalId  = 'edit-sprint-goal-' + sprintId;
  const vtId    = 'edit-sprint-vt-'   + sprintId;
  const rtId    = 'edit-sprint-rt-'   + sprintId;
  wrap.innerHTML = `<div class="sprint-inline-edit-wrap sprint-inline-edit-wrap--with-goal" data-action="sprint-edit-stop-prop">
    <span class="sprint-inline-id-preview">${esc(sprintId)} ·</span>
    <input id="${esc(inputId)}" type="text" value="${esc(currentDescriptive)}"
      class="sprint-inline-input sprint-inline-input--wide"
      data-action="sprint-edit-keydown" data-sprint-id="${esc(sprintId)}">
    <button data-action="sprint-edit-confirm" data-sprint-id="${esc(sprintId)}" class="sprint-inline-confirm">&#10003;</button>
    <button data-action="sprint-edit-cancel" class="sprint-inline-cancel">&#10005;</button>
    <input id="${esc(goalId)}" type="text" value="${esc(currentGoal)}"
      placeholder="Goal del sprint (opcional, max 120)"
      class="sprint-inline-goal-input"
      maxlength="120"
      data-action="sprint-edit-keydown" data-sprint-id="${esc(sprintId)}">
    <div class="sprint-inline-release-row">
      <label class="sprint-inline-release-label">Versión:</label>
      <input id="${esc(vtId)}" type="text" value="${esc(suggestVt)}"
        class="sprint-inline-vt-input" placeholder="v3.5"
        data-action="sprint-edit-keydown" data-sprint-id="${esc(sprintId)}">
      <label class="sprint-inline-release-label">Tipo:</label>
      <select id="${esc(rtId)}" class="sprint-inline-rt-select">
        <option value="Patch"${suggestRt==='Patch'?' selected':''}>Patch</option>
        <option value="Minor"${suggestRt==='Minor'?' selected':''}>Minor</option>
        <option value="Major"${suggestRt==='Major'?' selected':''}>Major</option>
      </select>
    </div>
  </div>`;
  setTimeout(() => {
    const inp = document.getElementById(inputId);
    if (inp) { inp.focus(); inp.select(); }
  }, 30);
}

// AC-3: guardar persiste en state.sprints y re-renderiza
// R-202605-123: también persiste el goal editado
// R-202605-134: persiste version_target y release_type
function confirmEditSprint(sprintId) {
  const inputId = 'edit-sprint-inp-' + sprintId;
  const goalId  = 'edit-sprint-goal-' + sprintId;
  const vtId    = 'edit-sprint-vt-'   + sprintId;
  const rtId    = 'edit-sprint-rt-'   + sprintId;
  const inp = document.getElementById(inputId);
  const raw = inp ? inp.value.trim() : '';
  if (!raw) { _markBacklogListDirty(); renderBacklogList(); return; } // AC-4: cancelar si vacío — no modifica
  // T-202605-500: raw es el nombre descriptivo — el ID no cambia
  if (!_isValidSprintName(raw)) {
    if (inp) { inp.classList.add('sprint-inline-input--warn'); inp.title = 'El nombre descriptivo no puede estar vacío'; }
    showToast('warning', '⚠ El nombre descriptivo no puede estar vacío');
    return;
  }
  if (inp) inp.classList.remove('sprint-inline-input--warn');
  const sp = _getSprintById(sprintId);
  if (!sp) { _markBacklogListDirty(); renderBacklogList(); return; }
  // B-[pendiente-ID]: label NO concatena el ID — id y label son campos separados (BR-Ecosystem §5)
  sp.label = raw;
  // R-202605-123: persistir goal si el campo existe
  const goalInp = document.getElementById(goalId);
  if (goalInp !== null) {
    sp.goal = goalInp.value.trim().slice(0, 120);
  }
  // R-202605-134: persistir version_target y release_type
  const vtInp = document.getElementById(vtId);
  const rtSel = document.getElementById(rtId);
  if (vtInp !== null) sp.version_target = vtInp.value.trim();
  if (rtSel !== null) sp.release_type   = rtSel.value;
  save();
  // INC-[pendiente-ID]: confirmEditSprint mutaba sp.label/goal/version_target/release_type
  // solo en _sprintsCache sin persistir a tracker_sprints — save() excluye sprints del blob
  // (T-202606-005 AC-3). El edit se veía aplicado en la sesión activa por mutación de la
  // misma referencia, pero se perdía en el siguiente _loadSprintsFromSupabase(). Mismo
  // patrón que setSprintStatus (línea ~703): _upsertSprint persiste el sprint mutado.
  const _projIdForEditUpsert = sp.projId || sp.projectId || getActiveProject()?.id || '';
  _upsertSprint(sp, _projIdForEditUpsert).catch(err => {
    console.error('[Locus] INC-[pendiente-ID]: confirmEditSprint upsert falló', err);
  });
  _markBacklogListDirty(); renderBacklogList();
  // TKT2-[pendiente-ID]: _sprintDisplay aplica patrón id · label en confirmación
  showToast('success', '✓ Sprint actualizado: ' + _sprintDisplay(sp.id));
}

// R-202604-089: estado del modal de cierre de sprint
let _scmState = null; // { id, step, pendingItems, doneItems, migrations, docUpdates, retroNotes, ... }

// B-[pendiente-ID]: normaliza el campo sprint de un ítem al ID canónico (PP-S-XX).
// Ítems legacy pueden tener sprint: "PP-S-07 · label completo" — extraer solo el prefijo.
// Si el valor ya es un ID canónico o no matchea el patrón, devuelve el valor original.
function _sprintIdOf(item) {
  if (!item.sprint) return item.sprint;
  const m = item.sprint.match(/^([A-Za-z]+-S-\d+)/i);
  return m ? m[1] : item.sprint;
}

export function confirmCloseSprint(id) {
  // R-202604-089: abre modal de 4 pasos en lugar de confirm directo
  const sp = _getSprintById(id);
  if (!sp) return;
  const pendingItems = getItems().filter(i => _sprintIdOf(i) === id && i.status !== 'done' && i.status !== 'descartado' && itemKind(i) !== 'DISC');
  const doneItems    = getItems().filter(i => _sprintIdOf(i) === id && (i.status === 'done' || i.status === 'descartado'));
  const skipStep3    = pendingItems.length === 0; // antiguo skipStep2 — ahora es el Paso 3 (migración)

  // R-202605-125: snapshot de effort al abrir modal de cierre
  const allSprintItems     = getItems().filter(i => _sprintIdOf(i) === id && itemKind(i) !== 'DISC');
  const effortPlanned      = allSprintItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortDone         = doneItems.filter(i => i.status === 'done').reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortScopeAdded   = allSprintItems.filter(i => i.scope_added).reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortNotDone      = pendingItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const hasItemsWithoutEffort = allSprintItems.some(i => !i.effort || parseInt(i.effort) === 0);

  // T-202606-120 AC-6: leer DOC-UPDATEs desde sprint.docUpdates — array de { doc, seccion, escalarA }
  const rawDu = Array.isArray(sp.docUpdates) ? sp.docUpdates : [];
  const docUpdates = rawDu.map((du, idx) => ({
    id:         idx,
    doc:        du.doc        || '—',
    seccion:    du.seccion    || '—',
    escalarA:   du.escalarA   || du.escalar_a || '',
    resolucion: null, // 'aplicado' | 'descartado' | null
  }));

  _scmState = {
    id,
    step: 1,
    skipStep3,
    pendingItems,
    doneItems,
    migrations: {},
    docUpdates,   // T-202606-120 AC-3
    retroNotes: '',
    effortPlanned,
    effortDone,
    effortScopeAdded,
    effortNotDone,
    hasItemsWithoutEffort,
  };
  // Fix Gate duro de cierre (__BR-Ecosystem §5): la única salida válida de un ítem
  // activo es done o descartado — nunca reasignación a otro sprint/icebox.
  // Todo pendiente nace como candidato a descartar; requiere justificación antes de avanzar.
  pendingItems.forEach(i => { _scmState.migrations[i.code] = '__discard__'; });

  const overlay = document.getElementById('sprint-close-overlay');
  if (!overlay) return;
  overlay.classList.toggle('skip-step3', skipStep3); // renombrado de skip-step2
  const titleEl = document.getElementById('sprint-close-title');
  if (titleEl) titleEl.textContent = 'Cerrar sprint ' + id;

  _scmRender();
  overlay.classList.add('open');
}

function closeCloseSprintModal() {
  const overlay = document.getElementById('sprint-close-overlay');
  if (overlay) overlay.classList.remove('open');
  _scmState = null;
}

function _scmBack() {
  if (!_scmState) return;
  if (_scmState.step <= 1) return;
  _scmState.step--;
  // T-202606-120 AC-1: Paso 3 (migración) se salta si skipStep3 — Paso 2 (DOC-UPDATEs) nunca se salta
  if (_scmState.skipStep3 && _scmState.step === 3) _scmState.step--;
  _scmRender();
}

function _scmNext() {
  if (!_scmState) return;
  // T-202606-120 AC-1: 4 pasos base, 3 si skipStep3 (migración omitida)
  const totalSteps = _scmState.skipStep3 ? 3 : 4;
  if (_scmState.step >= totalSteps) {
    _scmExecuteClose();
    return;
  }
  _scmState.step++;
  // Paso 3 (migración) se salta si skipStep3 — Paso 2 (DOC-UPDATEs) nunca se salta
  if (_scmState.skipStep3 && _scmState.step === 3) _scmState.step++;
  _scmRender();
}

// _scmBulkApply eliminada — Gen2: _scmStep2Html no ofrece opciones de sprint.
// Todos los ítems activos solo pueden descartarse (Gate duro §5).

function _scmRender() {
  if (!_scmState) return;
  const { step, skipStep3, pendingItems, doneItems, migrations, id, docUpdates } = _scmState;
  // T-202606-120 AC-1: 4 pasos base, 3 si skipStep3 (migración omitida — Paso 2 DOC-UPDATEs nunca se salta)
  const totalSteps = skipStep3 ? 3 : 4;
  const sp = _getSprintById(id);
  // TKT2-[pendiente-ID]: _sprintDisplay aplica patrón id · label en título del modal de cierre
  const spLabel = sp ? _sprintDisplay(id) : id;

  // actualizar indicadores de paso (scs-step-1..4)
  [1, 2, 3, 4].forEach(n => {
    const el = document.getElementById('scs-step-' + n);
    if (!el) return;
    el.classList.remove('active', 'done', 'skipped');
    // Paso 3 se salta si skipStep3
    if (n === 3 && skipStep3) { el.classList.add('skipped'); return; }
    // Calcular n efectivo para comparar con step (cuando skipStep3, step salta de 2 a 4)
    if (step === n) el.classList.add('active');
    else if (step > n) el.classList.add('done');
  });

  // botones de navegación
  const backBtn = document.getElementById('sprint-close-back-btn');
  const nextBtn = document.getElementById('sprint-close-next-btn');
  const isFirst = step === 1;
  const isLast  = step >= totalSteps;

  if (backBtn) {
    backBtn.hidden = isFirst;
    backBtn.disabled = isFirst;
  }
  if (nextBtn) {
    if (isLast) {
      nextBtn.textContent = 'Cerrar sprint';
      nextBtn.classList.add('is-close');
    } else {
      nextBtn.textContent = 'Siguiente →';
      nextBtn.classList.remove('is-close');
    }
  }

  // renderizar cuerpo del paso activo
  const body = document.getElementById('sprint-close-body');
  if (!body) return;

  // B-202605-067: extraer métricas de _scmState antes de llamar a _scmStep1Html
  const _step1Metrics = {
    effortPlanned:         _scmState.effortPlanned          || 0,
    effortDone:            _scmState.effortDone             || 0,
    effortScopeAdded:      _scmState.effortScopeAdded       || 0,
    effortNotDone:         _scmState.effortNotDone          || 0,
    hasItemsWithoutEffort: _scmState.hasItemsWithoutEffort  || false,
  };

  if (step === 1) {
    body.innerHTML = _scmStep1Html(sp, spLabel, pendingItems, doneItems, _step1Metrics);
    // T-202606-118: gate de campos obligatorios
    const _gv = (v) => v && v !== 'n/a' && String(v).trim() !== '';
    const gateOk = sp && _gv(sp.version_target) && _gv(sp.release_type) && _gv(sp.scope);
    if (nextBtn) nextBtn.disabled = !gateOk;
  } else if (step === 2) {
    // T-202606-120 AC-2/AC-4/AC-5: Paso 2 siempre presente — DOC-UPDATEs
    body.innerHTML = _scmStepDuHtml(docUpdates || []);
    // T-202606-120 AC-4: gate — Siguiente habilitado solo si todos tienen resolución
    _scmUpdateDuNextBtn(nextBtn);
  } else if (step === 3 && !skipStep3) {
    // Paso 3: descarte obligatorio de ítems activos (Gate duro de cierre — sin opción de reasignar)
    body.innerHTML = _scmStep2Html(pendingItems, migrations);
    _scmUpdateMigrationNextBtn(nextBtn);
  } else if (step === 4 || (step === 3 && skipStep3)) {
    // Paso 4 (o 3 si skipStep3): retro
    body.innerHTML = _scmStep3Html(pendingItems, doneItems, migrations, skipStep3);
    const notesTA = document.getElementById('scm-retro-notes-ta');
    if (notesTA) notesTA.addEventListener('input', () => { if (_scmState) _scmState.retroNotes = notesTA.value; });
    if (nextBtn) nextBtn.disabled = false;
  }
}

// T-202606-120 AC-4: evalúa si todos los DOC-UPDATEs tienen resolución y actualiza el botón Siguiente
function _scmUpdateDuNextBtn(nextBtn) {
  if (!_scmState || !nextBtn) return;
  const du = _scmState.docUpdates || [];
  // Si no hay DOC-UPDATEs, el estado vacío (AC-5) permite avanzar libremente
  const allResolved = du.length === 0 || du.every(d => d.resolucion !== null);
  nextBtn.disabled = !allResolved;
}

// Gate duro Gen2: Siguiente habilitado solo cuando todos los ítems activos
// tienen migrations[code] === '__discard__' confirmado por el founder.
function _scmUpdateMigrationNextBtn(nextBtn) {
  if (!_scmState || !nextBtn) return;
  const pend = _scmState.pendingItems || [];
  const mig  = _scmState.migrations   || {};
  const allConfirmed = pend.every(i => mig[i.code] === '__discard__');
  nextBtn.disabled = !allConfirmed;
}

// B-202605-067: métricas de entrega recibidas como parámetro — sin acceso a _scmState global
function _scmStep1Html(sp, spLabel, pendingItems, doneItems, metrics) {
  const doneCount  = doneItems.filter(i => i.status === 'done').length;
  const pendCount  = pendingItems.length;

  // R-202605-125: métricas de entrega desde snapshot pasado por _scmRender
  const m = metrics || {};
  const effortPlanned    = m.effortPlanned          || 0;
  const effortDone       = m.effortDone             || 0;
  const effortScopeAdded = m.effortScopeAdded       || 0;
  const effortNotDone    = m.effortNotDone          || 0;
  const hasNoEffort      = m.hasItemsWithoutEffort  || false;
  // % entrega = done / planeado. effortPlanned ya incluye el effort de los ítems
  // scope_added (se computa sobre allSprintItems, que no excluye scope_added) —
  // sumarlo otra vez al denominador duplicaba ese effort. Fix B — auditoría 2026-06-22.
  const denominator = effortPlanned;
  const pct = denominator
    ? Math.round(effortDone / denominator * 100)
    : (doneCount ? 100 : 0);

  const doneRows = doneItems.filter(i => i.status === 'done').map(i =>
    `<div class="scm-item-row">
      <span class="scm-item-type scm-type-${i.type||'T'}">${esc(i.type||'TKT')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title">${esc(i.title || '—')}</span>
    </div>`
  ).join('');
  const pendRows = pendingItems.map(i =>
    `<div class="scm-item-row">
      <span class="scm-item-type scm-type-${i.type||'T'}">${esc(i.type||'TKT')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title">${esc(i.title || '—')}</span>
    </div>`
  ).join('');

  // R-202605-134: mostrar version_target y release_type en el resumen del paso 1
  const vt = sp && sp.version_target ? sp.version_target : null;
  const rt = sp && sp.release_type   ? sp.release_type   : null;
  const releaseRow = (vt || rt) ? `
    <div class="scm-release-meta">
      ${vt ? `<span class="scm-release-tag scm-release-version">${esc(vt)}</span>` : ''}
      ${rt ? `<span class="scm-release-tag scm-release-type scm-release-type--${(rt||'').toLowerCase()}">${esc(rt)}</span>` : ''}
    </div>` : '';

  // T-202606-118: gate de campos obligatorios antes de avanzar al Paso 2
  const _gateVal = (v) => v && v !== 'n/a' && String(v).trim() !== '';
  const gateVt    = _gateVal(sp && sp.version_target);
  const gateRt    = _gateVal(sp && sp.release_type);
  const gateSc    = _gateVal(sp && sp.scope);
  const gateAllOk = gateVt && gateRt && gateSc;

  const _gateRow = (label, ok, val) => `
    <tr>
      <td class="scm-effort-label">${label}</td>
      <td class="scm-effort-val">
        ${ok
          ? `<span>${esc(val)}</span>`
          : `<span class="scm-gate-val--missing">${val ? esc(val) : '—'}</span>
             <span class="scm-release-tag scm-release-tag--required">requerido</span>`
        }
      </td>
    </tr>`;

  const gateBlock = `
    <table class="scm-effort-table scm-gate-table">
      <tbody>
        ${_gateRow('version_target', gateVt, sp && sp.version_target)}
        ${_gateRow('release_type',   gateRt, sp && sp.release_type)}
        ${_gateRow('scope',          gateSc, sp && sp.scope)}
      </tbody>
    </table>
    ${!gateAllOk ? `<div class="scm-effort-warn scm-gate-hint">Editá estos campos en el panel del sprint antes de cerrar.</div>` : ''}
  `;

  // R-202605-125: advertencia si hay ítems sin effort
  const effortWarn = hasNoEffort
    ? `<div class="scm-effort-warn">⚠ Algunos ítems no tienen effort asignado — % de entrega puede ser inexacto.</div>`
    : '';

  return `
    ${gateBlock}
    ${releaseRow}
    <div class="scm-summary-grid">
      <div class="scm-kpi scm-kpi--good">
        <div class="scm-kpi-value">${doneCount}</div>
        <div class="scm-kpi-label">completados</div>
      </div>
      <div class="scm-kpi${pendCount ? ' scm-kpi--warn' : ''}">
        <div class="scm-kpi-value">${pendCount}</div>
        <div class="scm-kpi-label">pendientes</div>
      </div>
      <div class="scm-kpi">
        <div class="scm-kpi-value">${pct}%</div>
        <div class="scm-kpi-label">% entrega</div>
      </div>
    </div>
    <table class="scm-effort-table">
      <tbody>
        <tr>
          <td class="scm-effort-label">Effort planeado</td>
          <td class="scm-effort-val">${effortPlanned}</td>
        </tr>
        <tr>
          <td class="scm-effort-label">Effort completado (done)</td>
          <td class="scm-effort-val scm-effort-val--done">${effortDone}</td>
        </tr>
        <tr class="${effortScopeAdded ? '' : 'scm-effort-row--muted'}">
          <td class="scm-effort-label">Scope added durante sprint</td>
          <td class="scm-effort-val">${effortScopeAdded || '—'}</td>
        </tr>
        <tr class="${effortNotDone ? 'scm-effort-row--warn' : 'scm-effort-row--muted'}">
          <td class="scm-effort-label">No completados (migran o se descartan)</td>
          <td class="scm-effort-val">${effortNotDone || '—'}</td>
        </tr>
      </tbody>
    </table>
    ${effortWarn}
    ${doneRows ? `<div class="scm-section-title">Completados</div><div class="scm-items-list">${doneRows}</div>` : ''}
    ${pendRows ? `<div class="scm-section-title">Pendientes</div><div class="scm-items-list">${pendRows}</div>` : ''}
    ${!doneRows && !pendRows ? '<div class="scm-empty-hint">Sprint sin ítems registrados.</div>' : ''}
    <div class="scm-docgen-hint">
      📄 Antes de cerrar:
      <button class="scm-docgen-btn" data-action="scm-open-map-generator">Abrir Document Generator</button>
      para generar MAP + Sprint Review.
    </div>
  `;
}

// T-202606-120 AC-2: Paso 2 — lista de DOC-UPDATEs pendientes con resolución por fila
// AC-5: estado vacío si docUpdates es array vacío — muestra mensaje, Siguiente habilitado
// AC-7/AC-8/AC-9/AC-10: botones aplicado/descartado por fila con actualización visual sin recargar
function _scmStepDuHtml(docUpdates) {
  if (!docUpdates || docUpdates.length === 0) {
    // AC-5: estado vacío
    return `<div class="scm-du-empty">No hay DOC-UPDATEs pendientes en este sprint.</div>`;
  }

  const rows = docUpdates.map(du => {
    const res = du.resolucion; // 'aplicado' | 'descartado' | null
    const escAl = du.escalarA ? `<span class="scm-du-escalar">→ ${esc(du.escalarA)}</span>` : '';
    const badgeHtml = res
      ? `<span class="scm-du-badge scm-du-badge--${res}">${res === 'aplicado' ? '✓ Aplicado' : '✗ Descartado'}</span>`
      : '';
    return `
      <div class="scm-du-row${res ? ' scm-du-row--resolved' : ''}" data-du-id="${du.id}">
        <div class="scm-du-meta">
          <span class="scm-du-doc">${esc(du.doc)}</span>
          <span class="scm-du-seccion">${esc(du.seccion)}</span>
          ${escAl}
          ${badgeHtml}
        </div>
        <div class="scm-du-actions">
          <button class="scm-du-btn scm-du-btn--aplicado${res === 'aplicado' ? ' is-active' : ''}"
            data-action="scm-du-resolve" data-du-id="${du.id}" data-resolucion="aplicado"
            type="button">Aplicado</button>
          <button class="scm-du-btn scm-du-btn--descartado${res === 'descartado' ? ' is-active' : ''}"
            data-action="scm-du-resolve" data-du-id="${du.id}" data-resolucion="descartado"
            type="button">Descartado</button>
        </div>
      </div>`;
  }).join('');

  return `<div class="scm-du-list">${rows}</div>`;
}

// Gate duro de cierre (__BR-Ecosystem §5 Gen2): la única salida válida de un ítem activo
// es done o descartado — reasignar a otro sprint no destraba el cierre.
// _scmStep2Html ya no ofrece opciones de sprint. Todos los ítems pendientes se descartan
// y el founder confirma ítem por ítem con un checkbox antes de avanzar.
function _scmStep2Html(pendingItems, migrations) {
  if (!pendingItems.length) {
    return '<div class="scm-migration-intro">Sin ítems activos — continúa al siguiente paso.</div>';
  }

  const rows = pendingItems.map(i => {
    const confirmed = migrations[i.code] === '__discard__';
    return `<div class="scm-migration-item">
      <div class="scm-migration-item-info">
        <span class="scm-migration-item-title">${esc(i.title || '—')}</span>
        <span class="scm-migration-item-meta">${esc(i.code)} · ${esc(i.type || 'TKT')}</span>
      </div>
      <label class="scm-discard-confirm">
        <input type="checkbox" class="scm-migration-select" data-code="${esc(i.code)}"
          value="__discard__"${confirmed ? ' checked' : ''}/>
        Confirmar descarte
      </label>
    </div>`;
  }).join('');

  return `
    <div class="scm-migration-intro">${pendingItems.length} ítem${pendingItems.length !== 1 ? 's' : ''} activo${pendingItems.length !== 1 ? 's' : ''} — confirma el descarte de cada uno para continuar:</div>
    ${rows}
  `;
}

// R-202605-129: Retro automática enriquecida al cerrar sprint — Paso 3 del modal
// B-202605-270: función nombrada para descarga de retro desde paso 3 del SCM
// Extrae la lógica del IIFE inline para evitar problemas de parsing de atributos HTML
// y adjunta el anchor al body antes del click para garantizar descarga en todos los browsers
function _scmDownloadRetro() {
  if (!_scmState) return;
  const ta = document.getElementById('scm-retro-notes-ta');
  const notes = ta ? ta.value : '';
  _scmState.retroNotes = notes;
  const md = _generateSprintRetroMd(_scmState.id || '', notes);
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ds = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const pfx = _docPrefix();
  const fname = pfx + '-Retrospectiva-' + (_scmState.id || '') + '-' + ds + '.md';
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('download', 'Retro descargada', fname);
}

function _scmStep3Html(pendingItems, doneItems, migrations, skipStep3) {
  const doneCount      = doneItems.filter(i => i.status === 'done').length;
  const discardedCount = doneItems.filter(i => i.status === 'descartado').length;

  // agrupar pendientes por destino
  const toSprint   = pendingItems.filter(i => migrations[i.code] && migrations[i.code] !== '__discard__');
  const toUnassign = pendingItems.filter(i => !migrations[i.code]);
  const toDiscard  = pendingItems.filter(i => migrations[i.code] === '__discard__');

  const itemRow = (i, destLabel, cls) =>
    `<div class="scm-confirm-row">
      <span class="scm-item-type scm-type-${i.type||'T'} scm-flex-shrink-0">${esc(i.type||'TKT')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title scm-item-title-cell">${esc(i.title || '—')}</span>
      <span class="scm-confirm-dest ${cls}">${esc(destLabel)}</span>
    </div>`;

  const spLabel = id => { const s = _getSprintById(id); return s ? (s.label ? `${s.id} · ${s.label}` : s.id) : id; };

  // ── R-202605-129: datos para retro enriquecida ──
  const st    = _scmState || {};
  const spObj = _getSprintById(st.id || '');

  const goal          = spObj && spObj.goal          ? spObj.goal          : '';
  const versionTarget = spObj && spObj.version_target ? spObj.version_target : '';
  const releaseType   = spObj && spObj.release_type   ? spObj.release_type   : '';

  const effortPl  = st.effortPlanned    || 0;
  const effortDn  = st.effortDone       || 0;
  const effortSA  = st.effortScopeAdded || 0;
  const effortND  = st.effortNotDone    || 0;
  const denomPct  = effortPl + effortSA;
  const pctDel    = denomPct > 0 ? Math.round(effortDn / denomPct * 100) : 0;
  const pctCls    = pctDel >= 70 ? 'scm-retro3-pct--good' : pctDel >= 40 ? 'scm-retro3-pct--warn' : 'scm-retro3-pct--bad';

  // Comparativa sprint anterior — último cerrado con deliveryMetrics
  const _prevSp = (() => {
    const closed = getActiveSprints()
      .filter(s => s.status === 'closed' && s.deliveryMetrics && s.id !== (st.id || ''))
      .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
    return closed[0] || null;
  })();

  let deltaHtml;
  if (_prevSp) {
    const dm       = _prevSp.deliveryMetrics;
    const prevDn   = dm.effortDone       || 0;
    const prevDnom = (dm.effortPlanned   || 0) + (dm.effortScopeAdded || 0);
    const prevPct  = prevDnom > 0 ? Math.round(prevDn / prevDnom * 100) : 0;
    const delta    = pctDel - prevPct;
    const sign     = delta > 0 ? '+' : '';
    const dCls     = delta > 0 ? 'scm-retro3-delta--up' : delta < 0 ? 'scm-retro3-delta--down' : 'scm-retro3-delta--flat';
    const dIcon    = delta > 0 ? '▲' : delta < 0 ? '▼' : '→';
    deltaHtml = `<div class="scm-retro3-delta-row">
      <span class="scm-retro3-delta-label">vs ${esc(_prevSp.label ? `${_prevSp.id} · ${_prevSp.label}` : _prevSp.id)}</span>
      <span class="scm-retro3-delta ${dCls}">${dIcon} ${sign}${delta}% · prev ${prevPct}% (${prevDn} effort)</span>
    </div>`;
  } else {
    deltaHtml = `<div class="scm-retro3-delta-row">
      <span class="scm-retro3-delta-label">Comparativa</span>
      <span class="scm-retro3-delta scm-retro3-delta--none">Primer sprint con datos completos</span>
    </div>`;
  }

  // Listas compactas de ítems para la retro preview
  const _miniRow = i =>
    `<div class="scm-retro3-mini-row">
       <span class="scm-item-code">${esc(i.code)}</span>
       <span class="scm-retro3-mini-title">${esc(i.title || '—')}</span>
     </div>`;

  const completadosMini  = doneItems.filter(i => i.status === 'done').map(_miniRow).join('');
  const migradosMini     = [...toSprint, ...toUnassign].map(_miniRow).join('');
  const descartadosMini  = [...doneItems.filter(i => i.status === 'descartado'), ...toDiscard].map(_miniRow).join('');

  // release type badge
  const rtBadge = releaseType
    ? `<span class="scm-release-tag scm-release-type scm-release-type--${releaseType.toLowerCase()}">${esc(releaseType)}</span>`
    : '';
  const vtHtml = versionTarget
    ? `<span class="scm-release-tag scm-release-version">${esc(versionTarget)}</span> ${rtBadge}`
    : rtBadge;

  // Bloque retro preview (visible antes de confirmar)
  const retroPreview = `
    <div class="scm-retro3-panel">
      <div class="scm-retro3-header">
        <span class="scm-retro3-title">📄 Retrospectiva del sprint</span>
        <button class="scm-retro3-dl-btn" type="button"
          data-action="scm-download-retro">⬇ Descargar MD</button>
      </div>
      <div class="scm-retro3-body">
        ${goal ? `<div class="scm-retro3-row"><span class="scm-retro3-key">Goal</span><span class="scm-retro3-val">${esc(goal)}</span></div>` : ''}
        ${(versionTarget || releaseType) ? `<div class="scm-retro3-row"><span class="scm-retro3-key">Release</span><span class="scm-retro3-val">${vtHtml}</span></div>` : ''}
        <div class="scm-retro3-row">
          <span class="scm-retro3-key">Effort</span>
          <span class="scm-retro3-val">
            <span class="scm-retro3-effort-done">${effortDn}</span>
            <span class="scm-retro3-effort-sep"> / ${effortPl} plan.</span>
            ${effortSA > 0 ? `<span class="scm-retro3-effort-sa"> +${effortSA} scope added</span>` : ''}
            <span class="scm-retro3-pct ${pctCls}"> ${pctDel}%</span>
            ${effortND > 0 ? `<span class="scm-retro3-effort-nd"> · ${effortND} no ent.</span>` : ''}
          </span>
        </div>
        ${deltaHtml}
        ${completadosMini  ? `<div class="scm-retro3-list-wrap"><span class="scm-retro3-list-label">✅ Completados (${doneCount})</span><div class="scm-retro3-mini-list">${completadosMini}</div></div>` : ''}
        ${migradosMini     ? `<div class="scm-retro3-list-wrap"><span class="scm-retro3-list-label">⏭ Migrados (${toSprint.length + toUnassign.length})</span><div class="scm-retro3-mini-list">${migradosMini}</div></div>` : ''}
        ${descartadosMini  ? `<div class="scm-retro3-list-wrap scm-retro3-list-wrap--disc"><span class="scm-retro3-list-label">🗑 Descartados (${discardedCount + toDiscard.length})</span><div class="scm-retro3-mini-list">${descartadosMini}</div></div>` : ''}
      </div>
      <div class="scm-retro3-notes">
        <div class="scm-retro-notes-label">📝 Notas <span class="scm-retro-notes-hint">(opcional — se guardan con el sprint)</span></div>
        <textarea
          class="scm-retro-notes-ta"
          id="scm-retro-notes-ta"
          rows="3"
          placeholder="¿Qué salió bien? ¿Qué mejorar? ¿Algún aprendizaje para el próximo sprint?"
        >${esc(st.retroNotes || '')}</textarea>
      </div>
    </div>`;

  // ── Confirmación de movimientos ──
  let html = `<div class="scm-confirm-intro">Revisa la retro y los movimientos. <strong>Esta acción no se puede deshacer.</strong></div>`;
  html += retroPreview;
  html += `<div class="scm-confirm-movements-title">Movimientos de ítems</div>`;

  if (doneCount) html += `
    <div class="scm-confirm-group">
      <div class="scm-confirm-group-title">Completados (${doneCount}) → histórico</div>
      ${doneItems.filter(i => i.status === 'done').map(i => itemRow(i, 'histórico', '')).join('')}
    </div>`;

  if (discardedCount) html += `
    <div class="scm-confirm-group">
      <div class="scm-confirm-group-title">Descartados (${discardedCount}) → histórico</div>
      ${doneItems.filter(i => i.status === 'descartado').map(i => itemRow(i, 'histórico', '')).join('')}
    </div>`;

  if (!skipStep3) {
    const byDest = {};
    toSprint.forEach(i => {
      const d = migrations[i.code];
      if (!byDest[d]) byDest[d] = [];
      byDest[d].push(i);
    });
    Object.entries(byDest).forEach(([dest, items]) => {
      html += `<div class="scm-confirm-group">
        <div class="scm-confirm-group-title">→ ${esc(spLabel(dest))} (${items.length})</div>
        ${items.map(i => itemRow(i, spLabel(dest), '')).join('')}
      </div>`;
    });

    if (toUnassign.length) html += `
      <div class="scm-confirm-group">
        <div class="scm-confirm-group-title">Sin asignar (${toUnassign.length})</div>
        ${toUnassign.map(i => itemRow(i, 'sin asignar', 'scm-confirm-dest--unassign')).join('')}
      </div>`;

    if (toDiscard.length) html += `
      <div class="scm-confirm-group">
        <div class="scm-confirm-group-title">Descartar (${toDiscard.length})</div>
        ${toDiscard.map(i => itemRow(i, 'descartar', 'scm-confirm-dest--discard')).join('')}
      </div>`;
  }

  if (!doneCount && !discardedCount && pendingItems.length === 0) {
    html += '<div class="scm-empty-hint">Sprint sin ítems — se cerrará como vacío.</div>';
  }

  html += `
    <div class="scm-backup-hint">
      💾 Backup opcional:
      <button class="scm-docgen-btn" data-action="scm-export-history" type="button">Descargar historial completo</button>
    </div>`;

  return html;
}

async function _scmExecuteClose() {
  if (!_scmState) return;
  const { id, pendingItems, migrations, retroNotes,
          effortPlanned, effortDone, effortScopeAdded, effortNotDone } = _scmState;

  // aplicar migraciones de pendientes
  const closeTs = Date.now();
  // T-202606-107: codes marcados historico en este ciclo de cierre — recolectados para
  // remover de ITEMS y persistir en storage dedicado (T-202606-105) en la misma operación.
  const _historicoCodesThisClose = new Set();
  pendingItems.forEach(i => {
    const dest = migrations[i.code];
    if (dest === '__discard__') {
      // B-202605-231: migrar a historico — no dejar como descartado en backlog vivo
      i.status = 'historico';
      i.archivedAt = closeTs;
      i.sprint = id; // mantiene referencia al sprint cerrado
      _historicoCodesThisClose.add(i.code);
    } else {
      i.sprint = dest || ''; // sprint destino o sin asignar
    }
  });

  // B-202604-193: archivar done/descartado → histórico
  // B-[tmp:sprint-revive]: excluir ítems ya procesados por el loop de migraciones
  // (pendientes con __discard__ ya quedan como historico arriba — processedCodes los excluye)
  const processedCodes = new Set(pendingItems.map(i => i.code));
  // R-202605-134: resolver version_target del sprint antes de iterar
  const spForClose = _getSprintById(id);
  const versionTarget = spForClose && spForClose.version_target ? spForClose.version_target : null;
  // T-202606-119 AC-3: version_target inválido — no asignar version, registrar en consola. Cierre continúa.
  if (!versionTarget) console.log('version_target no válido — campo version no aplicado a ítems done');
  getItems().forEach(i => {
    if (_sprintIdOf(i) === id && !processedCodes.has(i.code) && (i.status === 'done' || i.status === 'descartado')) {
      const wasDone = i.status === 'done';
      i.status = 'historico';
      i.archivedAt = closeTs;
      // R-202605-134: aplicar version_target como version en ítems que estaban done
      if (wasDone && versionTarget) i.version = versionTarget;
      _historicoCodesThisClose.add(i.code);
    }
  });

  // T-202606-122 — bloque eliminado (TKT-B3, BR-Execution §2 Sin retrocompatibilidad).
  // Migraba ítems pendiente/en-revision a 'icebox' al cerrar sprint. Código muerto:
  // el Gate duro de cierre (__BR-Ecosystem §5) bloquea el cierre del sprint mientras existan
  // ítems en pendiente/en-proceso/en-revision — para cuando este punto del flujo se ejecuta,
  // pendingItems.forEach (arriba) ya resolvió cada ítem a historico o a sprint real.
  // Sin dato que migrar, sin valor de seguridad (BR-Execution §2).

  // T-202606-107 AC-1 + AC-2: ítems historico nunca residen en ITEMS — se escriben al
  // storage dedicado (T-202606-105) y se remueven de ITEMS en la misma operación de cierre.
  // AC-4: 0 ítems califican → no invocar saveHistoricoItems ni getHistoricoItems, sin excepción.
  if (_historicoCodesThisClose.size > 0) {
    const _itemsArr = getItems();
    const _newHistorico = _itemsArr.filter(i => _historicoCodesThisClose.has(i.code));
    // Acumular sobre lo ya persistido — saveHistoricoItems() sobreescribe la clave completa,
    // no hace merge. Sin esta lectura previa, cada cierre de sprint borraría el histórico anterior.
    try {
      const _existingHistorico = await getHistoricoItems();
      await saveHistoricoItems([...(_existingHistorico || []), ..._newHistorico]);
    } catch (err) {
      // AC-3: fallo de escritura no revierte el cierre — los ítems ya marcados historico
      // quedan en localStorage como fallback (saveHistoricoItems ya cubre ese fallback
      // internamente). Registrar el fallo en DocLog con el sprint_id afectado.
      console.error('[AI Tracker] _scmExecuteClose: fallo al persistir historico en storage dedicado', err);
      _blogLog('historico-write-error', id, `Fallo al persistir ${_historicoCodesThisClose.size} ítem(s) historico en storage dedicado al cerrar ${id}: ${err.message || err}`, 'backlog');
    }
    // Remover de ITEMS — sin pasar por _setITEMS (no exportada desde locus-backlog-core.js).
    // Misma referencia mutable que getItems() retorna — splice in-place equivalente al
    // filtro interno de _setITEMS, aplicado aquí porque la mutación de status ocurrió
    // directamente sobre los objetos, no vía _setITEMS.
    for (let _idx = _itemsArr.length - 1; _idx >= 0; _idx--) {
      if (_historicoCodesThisClose.has(_itemsArr[_idx].code)) _itemsArr.splice(_idx, 1);
    }
  }

  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  // B-[tmp:historico-expand]: forzar expansión del histórico post-cierre
  // sin esto la lista principal queda vacía y el histórico aparece colapsado
  try { localStorage.setItem(_HISTORICO_KEY, '1'); } catch {}
  closeCloseSprintModal();
  setSprintStatus(id, 'closed');

  // T-202606-071: activar el sprint scheduled de scheduledAt menor del mismo proyecto.
  // Sin esto, _getActiveSprint() (post T-202606-070) puede retornar null aunque haya
  // sprints programados esperando — la cola scheduled→active no avanzaba sola.
  {
    const _closedSprint = _getSprintById(id);
    const _projIdForNext = _closedSprint ? (_closedSprint.projId || _closedSprint.projectId || null) : null;
    const _scheduledCandidates = getActiveSprints().filter(s => {
      if (s.status !== 'scheduled') return false;
      // TKT-PARSER-sprints: isHotfix eliminado — S-HOTFIX deprecado Gen2.
      if (!_projIdForNext) return true; // sin projId no se puede filtrar — no excluir
      return (s.projId === _projIdForNext || s.projectId === _projIdForNext);
    });
    if (_scheduledCandidates.length > 0) {
      const _nextSprint = _scheduledCandidates.reduce((min, s) =>
        (s.scheduledAt || 0) < (min.scheduledAt || 0) ? s : min
      );
      // B-202606-042 AC-1: capturar rechazo de setSprintStatus — fallo silencioso resuelto
      // T-202606-108: await requerido — setSprintStatus es async desde este T
      const _activated = await setSprintStatus(_nextSprint.id, 'active');
      if (_activated === false) {
        showToast('error', 'Error al activar sprint ' + _nextSprint.id);
      }
    }
  }

  renderStats(); // B-202605-269: refrescar contadores del backlog inmediatamente post-cierre

  // T-202604-417: guardar retro como documento en el sprint — accesible desde vista de sprints cerrados
  // R-202605-125: persistir métricas de entrega con el sprint cerrado
  const sp = _getSprintById(id);
  if (sp) {
    sp.retroNotes = retroNotes || '';
    sp.retroDoc   = _generateSprintRetroMd(id, retroNotes || '');
    // T-202606-010 AC-8 / AC-8b: limpiar índice de doc_updates después de _generateSprintRetroMd
    // y antes del save() final — nota en DocLog por cada entrada pendiente antes de vaciar.
    // AC-8b: este bloque se ejecuta aquí — después de retroDoc y antes de deliveryMetrics + save().
    {
      const _duIndex = _getDocUpdateIndex();
      const _duKeys  = Object.keys(_duIndex);
      if (_duKeys.length > 0) {
        _duKeys.forEach(k => {
          const entries = _duIndex[k] || [];
          entries.forEach(e => {
            _blogLog(
              'descartado · sprint cerrado',
              k,
              `DOC-UPDATE pendiente descartado al cerrar ${id}: ${e.titulo || '(sin título)'}`,
              'backlog'
            );
          });
        });
        _setDocUpdateIndex({});
      }
    }
    // R-202605-125: métricas de entrega para Analytics (Nivel 2)
    // Fix denominador % entrega — effortPlanned ya incluye scope_added (allSprintItems no lo excluye),
    // no sumar effortScopeAdded otra vez. Mismo fix aplicado en _scmStep1Html — ver L1159.
    const denominator = effortPlanned || 0;
    sp.deliveryMetrics = {
      effortPlanned:    effortPlanned    || 0,
      effortDone:       effortDone       || 0,
      effortScopeAdded: effortScopeAdded || 0,
      effortNotDone:    effortNotDone    || 0,
      pctDelivery:      denominator ? Math.round((effortDone || 0) / denominator * 100) : 0,
      recordedAt:       Date.now(),
    };
    save();
  }

  // T-202604-295: downloadTemplates deprecado

  // T-202604-417: ofrecer descarga de retro integrada al flujo
  if (sp && sp.retroDoc) {
    _openRetroDownloadPrompt(id);
  }

  // T-202605-147: import nombrado — circular ESM seguro (llamada en runtime, no top-level)
  renderSprintTab();
}

export function createSprintFromGroup(id, name) {
  // Registra en catálogo un sprint que ya tiene ítems pero no estaba en proj.sprints
  // B-202605-054: name opcional — si se pasa, se usa como label; si no, fallback a id
  if (_getSprintById(id)) return;
  const proj = getActiveProject();
  if (!proj) return;
  if (!proj.sprints) proj.sprints = [];
  // B-202605-036: current:true si ningún sprint activo lo tiene — mismo patrón que createSprint
  const hasCurrentSprint = proj.sprints.some(s => s.status === 'active' && s.current === true);
  proj.sprints.push({ id, label: name || id, status: 'active', current: !hasCurrentSprint ? true : undefined, formallyOpened: false, createdAt: Date.now() });
  save();
  _markBacklogListDirty(); renderBacklogList();
  // T-202605-147: import nombrado — circular ESM seguro (llamada en runtime, no top-level)
  renderSprintTab();
  showToast('success', id + ' registrado en catálogo');
}

// R-[pendiente-ID]: navegar a un ítem del backlog por código — cambia a tab backlog, sub-tab backlog, hace scroll y pulsa highlight
export function navigateToItem(code) {
  if (!code) return;
  // Asegurar que el filtro de status incluye el status del ítem
  const item = getItems().find(i => i.code === code);
  if (item && !activeStatuses.has(item.status)) {
    activeStatuses.add(item.status);
    updateStatusFilterUI();
  }
  switchTab('backlog');
  switchSubTab('backlog');
  // Esperar render y hacer scroll
  setTimeout(() => {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('bitem--nav-highlight');
    setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1400);
  }, 120);
}


// T-202605-058: Burndown — barra de progreso effort done vs total del sprint activo
// T-202605-027: usa sprint con current:true — sin fallback a all[0]
export function renderSprintBurndown() {
  const trackEl  = document.getElementById('sph-bd-track');
  const fillEl   = document.getElementById('sph-bd-fill');
  const labelEl  = document.getElementById('sph-bd-label');
  const pctEl    = document.getElementById('sph-bd-pct');
  const warnEl   = document.getElementById('sph-bd-warn');
  if (!trackEl || !fillEl || !labelEl || !pctEl || !warnEl) return;

  // T-202605-027: solo sprint con current:true — sprints abiertos sin flag no cuentan
  const all = getActiveSprints().filter(s => s.status === 'active');
  const sp = all.find(s => s.current === true) || null;

  if (!sp) {
    labelEl.textContent = 'Sin sprint en curso';
    pctEl.textContent   = '';
    fillEl.style.removeProperty('--sph-bd-width');
    fillEl.classList.remove('is-complete');
    fillEl.classList.remove('is-ready');
    trackEl.setAttribute('aria-valuenow', '0');
    warnEl.classList.add('is-hidden');
    warnEl.textContent = '';
    const btnEl = document.getElementById('btn-close-sprint');
    if (btnEl) btnEl.classList.add('is-hidden');
    return;
  }

  const spItems = (typeof getItems() !== 'undefined' ? getItems() : [])
    .filter(i => i.sprint === sp.id && i.status !== 'descartado');

  // Solo ítems con effort declarado contribuyen al cálculo
  const withEffort    = spItems.filter(i => i.effort && parseInt(i.effort) > 0);
  const withoutEffort = spItems.filter(i => !i.effort || parseInt(i.effort) === 0);

  const totalEffort = withEffort.reduce((acc, i) => acc + parseInt(i.effort), 0);
  const doneEffort  = withEffort
    .filter(i => i.status === 'done')
    .reduce((acc, i) => acc + parseInt(i.effort), 0);

  const pct = totalEffort > 0 ? Math.round(doneEffort / totalEffort * 100) : 0;

  labelEl.textContent = `Effort: ${doneEffort} / ${totalEffort}`;
  pctEl.textContent   = `${pct}%`;
  trackEl.setAttribute('aria-valuenow', pct);

  // width vía CSS custom property — CSS Purity
  fillEl.style.setProperty('--sph-bd-width', pct + '%');
  fillEl.classList.toggle('is-complete', pct >= 100);

  // Indicador de ítems sin effort
  if (withoutEffort.length > 0) {
    warnEl.textContent = `${withoutEffort.length} ítem${withoutEffort.length > 1 ? 's' : ''} sin effort — no incluidos en el cálculo`;
    warnEl.classList.remove('is-hidden');
  } else {
    warnEl.classList.add('is-hidden');
    warnEl.textContent = '';
  }

  // T-202605-062: indicador y botón de cierre — debe ejecutarse después del write de labelEl
  _updateCloseReadyState(sp, labelEl);
}

// T-202605-062: evalúa condición de cierre y actualiza indicador + botón
function _updateCloseReadyState(sp, labelEl) {
  const fillEl  = document.getElementById('sph-bd-fill');
  const btnEl   = document.getElementById('btn-close-sprint');
  if (!fillEl || !btnEl) return;

  if (!sp) {
    fillEl.classList.remove('is-ready');
    btnEl.classList.add('is-hidden');
    return;
  }

  // AC-6: solo Rs no descartados del sprint. Ts hijos excluidos. Sin Rs → no listo.
  const spRs = (typeof getItems() !== 'undefined' ? getItems() : [])
    .filter(i => i.sprint === sp.id && i.type === 'REQ' && i.status !== 'descartado');

  const isReady = spRs.length > 0 && spRs.every(i => i.status === 'done');

  // AC-4/AC-5: fill verde + label "listo" — o estado normal
  fillEl.classList.toggle('is-ready', isReady);
  if (labelEl) {
    labelEl.textContent = isReady ? '✓ Listo para cerrar' : labelEl.textContent;
  }

  // AC-1: botón visible solo cuando listo
  btnEl.classList.toggle('is-hidden', !isReady);
}

// T-202605-044: Lista de Rs del sprint activo agrupados por estado
export function renderSprintItems() {
  const listEl    = document.getElementById('sprint-items-list');
  const emptyEl   = document.getElementById('tab-sprint-empty');
  const headerEl  = document.getElementById('sprint-panel-header');
  if (!listEl || !emptyEl) return;

  const sp = _getActiveSprint();

  // Sin sprint activo — mostrar empty state
  if (!sp) {
    listEl.classList.add('is-hidden');
    emptyEl.classList.remove('is-hidden');
    return;
  }

  // Con sprint activo — ocultar empty, mostrar header + lista
  emptyEl.classList.add('is-hidden');
  if (headerEl) headerEl.classList.remove('is-hidden');
  listEl.classList.remove('is-hidden');

  const allItems = typeof getItems() !== 'undefined' ? getItems() : [];

  // Solo Rs del sprint activo (excluir descartados)
  const spRs = allItems.filter(i =>
    i.sprint === sp.id &&
    i.type === 'REQ' &&
    i.status !== 'descartado'
  );

  // Clasificar: bloqueado > done > pendiente
  const _blocked  = _isBlocked;
  const blocked   = spRs.filter(i => _blocked(i) && i.status !== 'done');
  const done      = spRs.filter(i => i.status === 'done');
  const pendiente = spRs.filter(i => i.status !== 'done' && !_blocked(i));

  _renderSprintSection('pendiente', pendiente, allItems);
  _renderSprintSection('bloqueado', blocked,   allItems);
  _renderSprintSection('done',      done,       allItems);

  renderScopeAdded(sp, allItems);    // T-202605-060
  renderSprintWorkers(sp, allItems); // T-202605-061
}

function _renderSprintSection(sectionId, items, allItems) {
  const bodyEl  = document.getElementById('spi-body-' + sectionId);
  const countEl = document.getElementById('spi-count-' + sectionId);
  const sectionEl = document.getElementById('spi-section-' + sectionId);
  if (!bodyEl || !countEl || !sectionEl) return;

  countEl.textContent = items.length;

  // Ocultar sección si no hay ítems
  sectionEl.classList.toggle('is-hidden', items.length === 0);

  if (items.length === 0) {
    bodyEl.innerHTML = '';
    return;
  }

  bodyEl.innerHTML = items.map(item => _buildSprintItemRow(item, sectionId, allItems)).join('');
}

function _buildSprintItemRow(item, sectionId, allItems) {
  const isBlocked = sectionId === 'bloqueado';
  const isDone    = sectionId === 'done';

  // Ts hijos del R — para mostrar progreso
  const children     = allItems.filter(c => c.parentId === item.code && c.type === 'TKT');
  const childrenDone = children.filter(c => c.status === 'done');
  const childrenHtml = children.length > 0
    ? `<span class="spi-item-children">${childrenDone.length}/${children.length} TKT</span>`
    : '';

  // Indicador de bloqueante
  const blockedIconHtml = isBlocked
    ? `<span class="spi-item-blocked-icon" title="Bloqueado por ítem pendiente">🔒</span>`
    : '';

  // Pill de estado
  const statusClass = isDone ? 'done' : isBlocked ? 'blocked' : 'pendiente';
  const statusLabel = isDone ? 'Done' : isBlocked ? 'Bloqueado' : 'Pendiente';
  const statusHtml  = `<span class="spi-item-status spi-item-status--${statusClass}">${statusLabel}</span>`;

  // Clases del ítem
  const itemClass = [
    'spi-item',
    isDone    ? 'spi-item--done'    : '',
    isBlocked ? 'spi-item--blocked' : ''
  ].filter(Boolean).join(' ');

  const code  = _escSpr(item.code  || '');
  const title = _escSpr(item.title || '');

  return `<div class="${itemClass}" role="button" tabindex="0"
    data-action="spi-navigate" data-item-code="${code}"
    title="Ir a ${code} en Tab Backlog">
    <span class="spi-item-code">${code}</span>
    <span class="spi-item-title">${title}</span>
    ${childrenHtml}
    ${blockedIconHtml}
    ${statusHtml}
  </div>`;
}

// T-202605-060: Sección scope added — ítems añadidos al sprint después de su apertura
function renderScopeAdded(sp, allItems) {
  const sectionEl = document.getElementById('sprint-scope-added');
  const bodyEl    = document.getElementById('sca-body');
  const countEl   = document.getElementById('sca-count');
  if (!sectionEl || !bodyEl || !countEl) return;

  // Sin sprint activo — ocultar sección
  if (!sp) {
    sectionEl.classList.add('is-hidden');
    return;
  }

  // Ítems del sprint activo con flag scope_added (R o T, excluir descartados)
  const added = allItems.filter(i =>
    i.sprint === sp.id &&
    i.scope_added === true &&
    i.status !== 'descartado'
  );

  // Sección siempre visible cuando hay sprint activo — AC-3
  sectionEl.classList.remove('is-hidden');
  countEl.textContent = added.length;

  if (added.length === 0) {
    bodyEl.innerHTML = '<div class="sca-empty">Sin adiciones al scope del sprint.</div>';
    return;
  }

  bodyEl.innerHTML = added.map(_buildScopeAddedRow).join('');
}

function _buildScopeAddedRow(item) {
  // Fecha de adición: última entrada history type:'sprint' con data.to === item.sprint
  const pad2 = n => String(n).padStart(2, '0');
  let dateStr = '—';
  if (Array.isArray(item.history)) {
    const entry = [...item.history]
      .reverse()
      .find(h => h.type === 'sprint' && h.data && h.data.to === item.sprint);
    if (entry && entry.ts) {
      const d = new Date(entry.ts);
      dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }
  }

  const typePill = item.type === 'REQ'
    ? '<span class="sca-item-type sca-item-type--req">REQ</span>'
    : '<span class="sca-item-type sca-item-type--tkt">TKT</span>';

  const code  = _escSpr(item.code  || '');
  const title = _escSpr(item.title || '');

  return `<div class="sca-item">
    ${typePill}
    <span class="sca-item-code">${code}</span>
    <span class="sca-item-title">${title}</span>
    <span class="sca-item-date">${_escSpr(dateStr)}</span>
  </div>`;
}

// T-202605-071: _escSpr — helper local de escape HTML para locus-backlog-sprints.js
// Nombre local (_escSpr) para evitar colisión con _esc declarada en locus-contracts.js.
// T-202606-088: guard typeof eliminado — esc importada explícitamente vía ESM.
const _escSpr = esc;

// T-202605-061: Sección workers vinculados al sprint activo
function renderSprintWorkers(sp, allItems) {
  const sectionEl = document.getElementById('sprint-workers');
  const bodyEl    = document.getElementById('spw-body');
  if (!sectionEl || !bodyEl) return;

  // Sin sprint activo — ocultar sección (AC-3)
  if (!sp) {
    sectionEl.classList.add('is-hidden');
    return;
  }

  // Recopilar aiIds únicos desde history de ítems del sprint activo (AC-5)
  const sprintItems = allItems.filter(i =>
    i.sprint === sp.id &&
    i.status !== 'descartado'
  );

  const seenIds = new Set();
  sprintItems.forEach(item => {
    if (!Array.isArray(item.history)) return;
    item.history.forEach(h => {
      if (h.aiId) seenIds.add(h.aiId);
    });
  });

  // Sección siempre visible con sprint activo (AC-2 y AC-3)
  sectionEl.classList.remove('is-hidden');

  if (seenIds.size === 0) {
    bodyEl.innerHTML = '<span class="spw-empty">Sin workers vinculados.</span>';
    return;
  }

  // Resolver nombres via getAI() (AC-5)
  const pills = [];
  seenIds.forEach(aiId => {
    const ai = getAI(aiId);
    const name = (ai && ai.name) ? ai.name : aiId;
    pills.push(_buildWorkerPill(name));
  });

  bodyEl.innerHTML = pills.join('');
}

function _buildWorkerPill(name) {
  return `<span class="spw-pill">${_escSpr(name)}</span>`;
}

// T-202605-055: delegación de eventos para locus-backlog-sprints.js
// Cubre: confirmEditSprint (inputs keydown + button) · sprint-edit-cancel · _scmDownloadRetro
// Los handlers de index.html (closeCloseSprintModal · _scmBack · _scmNext · closeSprintRetroOverlay)
// se migran a listeners en DOMContentLoaded en este módulo — ver función _attachSprintStaticHandlers
(function _attachSprintDelegation() {
  // Delegación en document para form inline de edición de sprint (se re-inyecta via innerHTML)
  document.addEventListener('click', function _sprintDelegateClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const act = action.dataset.action;

    if (act === 'sprint-edit-confirm') {
      confirmEditSprint(action.dataset.sprintId);
      return;
    }
    if (act === 'sprint-edit-cancel') {
      _markBacklogListDirty();
      renderBacklogList();
      return;
    }
    if (act === 'scm-download-retro') {
      _scmDownloadRetro();
      return;
    }
  });

  document.addEventListener('keydown', function _sprintDelegateKeydown(e) {
    const inp = e.target.closest('[data-action="sprint-edit-keydown"]');
    if (!inp) return;
    const sprintId = inp.dataset.sprintId;
    if (e.key === 'Enter') {
      confirmEditSprint(sprintId);
    }
    if (e.key === 'Escape') {
      _markBacklogListDirty();
      renderBacklogList();
    }
  });
})();

// Migración de handlers del scope en index.html (DOM estático de modales de sprint)
// closeSprintRetroOverlay · closeCloseSprintModal · _scmBack · _scmNext
(function _attachSprintStaticHandlers() {
  function _attach() {
    // Usar IDs de botones declarados en index.html
    const cancelBtn = document.getElementById('sprint-close-cancel-btn');
    const backBtn   = document.getElementById('sprint-close-back-btn');
    const nextBtn   = document.getElementById('sprint-close-next-btn');

    if (cancelBtn) {
      cancelBtn.removeAttribute('onclick');
      cancelBtn.addEventListener('click', function() {
        closeCloseSprintModal();
      });
    }
    if (backBtn) {
      backBtn.removeAttribute('onclick');
      backBtn.addEventListener('click', function() {
        _scmBack();
      });
    }
    if (nextBtn) {
      nextBtn.removeAttribute('onclick');
      nextBtn.addEventListener('click', function() {
        _scmNext();
      });
    }
    // Botón Cerrar del overlay retro — id="sprint-retro-close-btn" (migrado desde onclick en index.html)
    const retroCloseBtn = document.getElementById('sprint-retro-close-btn');
    if (retroCloseBtn) {
      retroCloseBtn.addEventListener('click', function() {
        closeSprintRetroOverlay();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _attach);
  } else {
    _attach();
  }
})();

// ── T8: Delegation — #sprint-close-body + #sprint-panel-items + sprint-inline-edit-wrap ──
document.addEventListener('DOMContentLoaded', () => {
  // Sprint close modal — scm buttons
  const scmBody = document.getElementById('sprint-close-body');
  if (scmBody) scmBody.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'scm-open-map-generator':
        openMapGenerator();
        break;
      case 'scm-du-resolve': {
        // T-202606-120 AC-7/AC-8/AC-9/AC-10: resolución de DOC-UPDATE por fila sin recargar stepper
        if (!_scmState) break;
        const duId  = parseInt(btn.dataset.duId, 10);
        const resol = btn.dataset.resolucion; // 'aplicado' | 'descartado'
        const du = (_scmState.docUpdates || []).find(d => d.id === duId);
        if (!du) break;
        // AC-9: toggle — si ya tenía la misma resolución, limpiar (vuelve a null)
        du.resolucion = du.resolucion === resol ? null : resol;
        // AC-7: actualizar visual de la fila sin rerender completo
        const row = btn.closest('[data-du-id]');
        if (row) {
          row.classList.toggle('scm-du-row--resolved', du.resolucion !== null);
          // actualizar badge
          const meta = row.querySelector('.scm-du-meta');
          if (meta) {
            const existing = meta.querySelector('.scm-du-badge');
            if (existing) existing.remove();
            if (du.resolucion) {
              const badge = document.createElement('span');
              badge.className = `scm-du-badge scm-du-badge--${du.resolucion}`;
              badge.textContent = du.resolucion === 'aplicado' ? '✓ Aplicado' : '✗ Descartado';
              meta.appendChild(badge);
            }
          }
          // actualizar estado is-active de botones de la fila
          row.querySelectorAll('[data-action="scm-du-resolve"]').forEach(b => {
            b.classList.toggle('is-active', b.dataset.resolucion === du.resolucion);
          });
        }
        // AC-4: re-evaluar gate del botón Siguiente
        const nBtn = document.getElementById('sprint-close-next-btn');
        _scmUpdateDuNextBtn(nBtn);
        break;
      }
      case 'scm-export-history':
        exportFullHistoryMd();
        break;
    }
  });

  // Delegación change — .scm-migration-select (checkbox de confirmación de descarte, Gen2)
  // Gate duro §5: la única salida es __discard__ — el checkbox lo confirma o desmarca.
  if (scmBody) scmBody.addEventListener('change', e => {
    const cb = e.target.closest('.scm-migration-select');
    if (!cb || !_scmState) return;
    const code = cb.dataset.code;
    if (code) _scmState.migrations[code] = cb.checked ? '__discard__' : '';
    const nBtn = document.getElementById('sprint-close-next-btn');
    _scmUpdateMigrationNextBtn(nBtn);
  });

  // Sprint panel items — spi-navigate (click + keydown Enter)
  const sprintPanelItems = document.getElementById('sprint-panel-items');
  if (sprintPanelItems) {
    sprintPanelItems.addEventListener('click', e => {
      const row = e.target.closest('[data-action="spi-navigate"]');
      if (row) navigateToItem(row.dataset.itemCode);
    });
    sprintPanelItems.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const row = e.target.closest('[data-action="spi-navigate"]');
      if (row) navigateToItem(row.dataset.itemCode);
    });
  }

  // Sprint inline edit wrap — stopPropagation (reemplaza onclick="event.stopPropagation()")
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="sprint-edit-stop-prop"]')) e.stopPropagation();
  }, true); // capture phase para interceptar antes de burbujeo
});
// ─────────────────────────────────────────────────────────────────────────

// T-202606-077: registrar getActiveSprint y getSprintById en _coreCallbacks
// locus-backlog-core los consume para asignación de sprint a ítems y render de badges.
document.addEventListener('DOMContentLoaded', () => {
  _registerCoreCallback('getActiveSprint', _getActiveSprint);
  _registerCoreCallback('getSprintById',   _getSprintById);
}, { once: true });
// ── END T-202606-077 ─────────────────────────────────────────────────────────

// T-202606-072: listeners shell:* — desacoplamiento de módulos consumidores
// locus-backlog-core.js despacha shell:sprint-render en lugar de llamar directamente
window.addEventListener('shell:sprint-render', () => { renderSprintBurndown(); renderSprintItems(); });
