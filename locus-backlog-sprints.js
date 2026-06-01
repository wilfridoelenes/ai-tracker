// [PP] v1.2.4 · sprint:PP-S-14 · mod:24 · autor:Rune · 2026-06-01 UTC-6
// locus-backlog-sprints.js
// Responsabilidad: Catálogo de sprints — CRUD, asignación de ítems, retro,
//   modal de cierre de sprint (SCM), createSprintFromGroup.

import { _calcPriority, _getActiveSessionAiId, _isBlocked, _undoSnapshot, itemType, renderStats, updateStatusFilterUI } from './locus-backlog-core.js';
import { _calcEstimatedVelocity, _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { _templateTrigger } from './locus-session-hora.js';
import { _docPrefix, exportFullHistoryMd, getProjectById } from './locus-sprint-project.js';
import { renderSprintTab } from './locus-sprint.js';
import { _effectiveVersion, getAI, getActiveProject, getActiveSprints, getAllSessions, save, saveBacklog, saveImmediate } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';

import { _setBacklogModified } from './locus-docs.js';

import { render } from './locus-sesiones.js';

import { downloadTemplates } from './locus-session-save.js';

// ── T-sprints: Catálogo de sprints ──

export function _getActiveSprint() {
  const all = getActiveSprints().filter(s => s.status === 'active');
  return all.find(s => s.current === true) || all[0] || null;
}

export function _getSprintById(id) {
  return getActiveSprints().find(s => s.id === id) || null;
}

// T-202605-500: ID con prefijo de proyecto — [PREFIJO]-S[NN], consecutivo por proyecto
// B-202605-077: acepta projId opcional — si se pasa, opera exclusivamente sobre los sprints
//   de ese proyecto, resolviendo el ID incorrecto cuando el DIFF se abre con projId != filtro global
function _nextSprintId(projId) {
  const allSprints = getActiveSprints();

  let prefix;
  let sprintsForCalc;

  if (projId) {
    // Determinar prefijo desde sprints existentes del proyecto o desde el objeto proyecto
    // T-202605-126: sprints no tienen campo projectId propio — obtener directo desde proj.sprints
    const _projForId = getProjectById(projId);
    const sprintsOfProj = (_projForId && _projForId.sprints) ? _projForId.sprints : [];
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
    if (typeof getActiveSprints !== 'function') return false;
    // T-202605-126: sprints no tienen campo projectId propio — si hay projId, leer desde proj.sprints
    if (projId) {
      const _projForCheck = getProjectById(projId);
      const _sprints = (_projForCheck && _projForCheck.sprints) ? _projForCheck.sprints : [];
      return _sprints.some(s => s.status === 'active');
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

      const newId = createSprint(name, goal, vt, rt, projId || undefined);
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

    // Listeners para ${ns}-vt — input y keydown (reemplaza on* inline)
    setTimeout(() => {
      const vtEl = document.getElementById(ns + '-vt');
      if (vtEl) {
        vtEl.addEventListener('input', () => {
          if (typeof window['_bnsf_syncBtn'] === 'function') window['_bnsf_syncBtn'](ns);
          if (typeof _clearSprintFieldErr === 'function') _clearSprintFieldErr(ns + '-vt-err');
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
// Solo Bs/Ts → Patch · Rs features/UX → Minor · Rs arquitectura/refactor → Major · mezcla Rs+Bs → Minor
function _suggestReleaseType(sprintItems) {
  if (!sprintItems || !sprintItems.length) return 'Patch';
  const hasR = sprintItems.some(i => i.type === 'R');
  const hasB = sprintItems.some(i => i.type === 'B');
  const hasT = sprintItems.some(i => i.type === 'T');
  if (!hasR) return 'Patch';
  // Rs arquitectura/refactor → Major (keywords heurísticos)
  const archKeywords = /migra|refactor|arquitectura|core|parser|schema|json/i;
  const hasArch = sprintItems.some(i => i.type === 'R' && archKeywords.test(i.title || ''));
  if (hasArch) return 'Major';
  // mezcla Rs+Bs → Minor
  if (hasR && hasB) return 'Minor';
  // Rs features/UX → Minor
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
export function createSprint(raw, goal, versionTarget, releaseType, projId) {
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
  if (typeof ITEMS !== 'undefined') {
    const _implicitSprintIds = new Set(ITEMS.map(i => i.sprint).filter(Boolean));
    if (_implicitSprintIds.has(id)) {
      showToast('warning', id + ' ya tiene ítems en el backlog. Usa "Registrar y activar ' + id + '" en lugar de crear uno nuevo.');
      return;
    }
  }
  const goalTrimmed = (goal || '').trim().slice(0, 120);
  // R-202605-134: version_target y release_type — usar sugerencia si no se pasan explícitamente
  const rt  = (releaseType   || '').trim() || null;
  const vt  = (versionTarget || '').trim() || null;
  // T-202605-500: label canónico = '[ID] · [Nombre descriptivo]'
  const canonicalLabel = displayLabel ? id + ' · ' + displayLabel : id;
  // B-202605-028: modelo multi-sprint — no cerrar sprints activos al crear uno nuevo.
  // El founder decide qué sprint es "en curso" via flag current:true.
  const hasCurrentSprint = _activeProjForSprint.sprints.some(s => s.status === 'active' && s.current === true);
  _activeProjForSprint.sprints.push({
    id, label: canonicalLabel, goal: goalTrimmed,
    version_target: vt, release_type: rt,
    // B-202605-057: status 'active' desde creación — _getActiveSprint() lo detecta inmediatamente
    // B-202605-028: marcar current:true si ningún sprint activo del proyecto lo tiene aún
    status: 'active', current: !hasCurrentSprint ? true : undefined,
    startedAt: Date.now(), createdAt: Date.now()
  });
  // B-202605-058: saveImmediate() evita perder el sprint si el usuario recarga antes del debounce
  saveImmediate();
  return id;
}

// T-202604-262: generar MD de retrospectiva del sprint cerrado
// T-202604-417: acepta parámetro notes (string) para notas manuales editadas antes de confirmar
// R-202605-129: generar MD de retrospectiva enriquecida del sprint
// T-202604-417: acepta parámetro notes (string) para notas manuales editadas antes de confirmar
function _generateSprintRetroMd(id, notes) {
  const sp = _getSprintById(id);
  const sprintLabel = sp ? (sp.label || sp.id) : id;
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;

  // B-[tmp:retro-snapshot]: al momento de generar el MD, _scmExecuteClose ya mutó
  // los ítems done/descartado a 'historico'. Incluir 'historico' en doneItems para
  // reflejar la realidad post-cierre. pendItems son los reasignados (sprint vacío o nuevo).
  const sprintItems = ITEMS.filter(i => i.sprint === id);
  const doneItems    = sprintItems.filter(i => i.status === 'done' || i.status === 'historico');
  const pendItems    = sprintItems.filter(i => i.status === 'pendiente');

  const totalEffort  = sprintItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const doneEffort   = doneItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const pendEffort   = pendItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const pctItems     = sprintItems.length > 0 ? Math.round((doneItems.length / sprintItems.length) * 100) : 0;
  const pctEffort    = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;

  const closedAt = sp && sp.closedAt ? new Date(sp.closedAt) : now;
  const closedStr = `${closedAt.getFullYear()}-${pad(closedAt.getMonth()+1)}-${pad(closedAt.getDate())}`;
  const createdAt = sp && sp.createdAt ? new Date(sp.createdAt) : null;
  const daysElapsed = createdAt ? Math.floor((closedAt - createdAt) / 86400000) : null;

  const _itemRow = i => {
    const effortN = parseInt(i.effort) || 1;
    const effortDots = '●'.repeat(effortN) + '○'.repeat(3 - effortN);
    return `| \`${i.code}\` | ${i.title || '—'} | ${effortDots} (${effortN}) |`;
  };

  const doneSection = doneItems.length
    ? `## ✅ Completados (${doneItems.length})\n\n| Código | Título | Effort |\n|--------|--------|--------|\n${doneItems.map(_itemRow).join('\n')}\n`
    : `## ✅ Completados\n\n_Sin ítems completados en este sprint._\n`;

  const pendSection = pendItems.length
    ? `## ⏳ No completados (${pendItems.length})\n\n| Código | Título | Effort |\n|--------|--------|--------|\n${pendItems.map(_itemRow).join('\n')}\n`
    : `## ⏳ No completados\n\n_Todos los ítems fueron completados. 🎉_\n`;

  // T-202604-417: sesiones del período del sprint
  let sessionsSection = '';
  {
    const allSessions = getAllSessions();
    const spStart = sp && sp.createdAt ? sp.createdAt : 0;
    const spEnd   = sp && sp.closedAt  ? sp.closedAt  : Date.now();
    const spSessions = allSessions.filter(s => {
      const ts = s.hora ? new Date(s.hora).getTime() : (s.timestamp || 0);
      return ts >= spStart && ts <= spEnd;
    });
    if (spSessions.length) {
      const sessRows = spSessions.map(s => {
        const dateLabel = s.hora ? s.hora.slice(0, 10) : '—';
        const title = s.title || s.titulo || '—';
        const ai = s.aiName || s.ai || '—';
        return `| ${dateLabel} | ${ai} | ${title} |`;
      }).join('\n');
      sessionsSection = `## 🗂 Sesiones del sprint (${spSessions.length})\n\n| Fecha | IA / Rol | Título |\n|-------|----------|--------|\n${sessRows}\n`;
    }
  }

  // T-202604-417: aprendizajes registrados en CHECKPOINTs del sprint
  let learningsSection = '';
  {
    const allSessions = getAllSessions();
    const spStart = sp && sp.createdAt ? sp.createdAt : 0;
    const spEnd   = sp && sp.closedAt  ? sp.closedAt  : Date.now();
    const learnings = allSessions
      .filter(s => {
        const ts = s.hora ? new Date(s.hora).getTime() : (s.timestamp || 0);
        return ts >= spStart && ts <= spEnd && s.learning && s.learning.trim();
      })
      .map(s => `- ${s.learning.trim()}`);
    if (learnings.length) {
      learningsSection = `## 💡 Aprendizajes del sprint\n\n${learnings.join('\n')}\n`;
    }
  }

  // T-202604-417: notas manuales editadas por el founder
  const notesSection = notes && notes.trim()
    ? `## 📝 Notas\n\n${notes.trim()}\n`
    : '';

  // R-202605-131: sección de scope added en retro
  const scopeAddedRetroItems = sprintItems.filter(i => i.scope_added);
  const scopeAddedRetroSection = scopeAddedRetroItems.length
    ? `## ➕ Scope añadido durante el sprint (${scopeAddedRetroItems.length})\n\n| Código | Título | Effort |\n|--------|--------|--------|\n${scopeAddedRetroItems.map(_itemRow).join('\n')}\n`
    : '';

  const pfx = _docPrefix();

  // R-202605-129: comparativa sprint anterior para el MD
  const prevMd = (() => {
    if (typeof getActiveSprints !== 'function') return null;
    const closed = getActiveSprints()
      .filter(s => s.status === 'closed' && s.deliveryMetrics && s.id !== id)
      .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
    const prev = closed[0];
    if (!prev) return null;
    const dm = prev.deliveryMetrics;
    const prevDn   = dm.effortDone    || 0;
    const prevDnom = (dm.effortPlanned || 0) + (dm.effortScopeAdded || 0);
    const prevPct  = prevDnom > 0 ? Math.round(prevDn / prevDnom * 100) : 0;
    const delta    = pctEffort - prevPct;
    return { label: prev.label || prev.id, prevPct, pctDel: pctEffort, delta, sign: delta > 0 ? '+' : '' };
  })();

  // R-202605-129: sección de descartados en el MD
  const discardedMdItems = sprintItems.filter(i => i.status === 'descartado');
  const discardedMdSection = discardedMdItems.length
    ? `## 🗑 Descartados (${discardedMdItems.length})\n\n| Código | Título | Effort |\n|--------|--------|--------|\n${discardedMdItems.map(_itemRow).join('\n')}\n`
    : '';

  return `# ${pfx}-Retrospectiva-${id}-${closedStr}.md
<!-- Sprint: ${sprintLabel} | Cerrado: ${closedStr} | Generado: ${dateStr} -->

---

## Sprint

| Campo | Valor |
|---|---|
| ID | ${id} |
| Nombre | ${sprintLabel} |
${sp && sp.goal ? `| Goal | ${sp.goal} |` : ''}
${sp && sp.version_target ? `| Versión | ${sp.version_target} |` : ''}
${sp && sp.release_type   ? `| Release  | ${sp.release_type} |` : ''}
| Cerrado | ${closedStr} |
${daysElapsed !== null ? `| Duración | ${daysElapsed} día${daysElapsed !== 1 ? 's' : ''} |` : ''}

---

## Resumen de progreso

| Métrica | Valor |
|---|---|
| Ítems comprometidos | ${sprintItems.length} |
| Ítems completados | ${doneItems.length} (${pctItems}%) |
| Ítems no completados | ${pendItems.length} |
| Effort total estimado | ${totalEffort} |
| Effort completado | ${doneEffort} (${pctEffort}%) |
| Effort pendiente | ${pendEffort} |
${prevMd ? `| Vs sprint anterior | ${prevMd.label}: ${prevMd.prevPct}% effort → este sprint ${prevMd.pctDel}% (${prevMd.sign}${prevMd.delta}%) |` : '| Vs sprint anterior | Primer sprint con datos completos |'}

---

${doneSection}
---

${pendSection}
---

${discardedMdSection ? discardedMdSection + '\n---\n\n' : ''}${scopeAddedRetroSection ? scopeAddedRetroSection + '\n---\n\n' : ''}${sessionsSection ? sessionsSection + '\n---\n\n' : ''}${learningsSection ? learningsSection + '\n---\n\n' : ''}${notesSection ? notesSection + '\n---\n\n' : ''}_Generado por Locus ${_effectiveVersion()} · ${dateStr}_
`;
}

// T-202604-262: mostrar modal de descarga opcional de retrospectiva
// T-202604-417: abre el overlay de retro en modo vista — muestra retro guardada del sprint cerrado
export function openSprintRetroView(id) {
  const sp = _getSprintById(id);
  if (!sp) return;
  const sprintLabel = sp.label || sp.id;
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
  const sprintLabel = sp.label || sp.id;
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

export function setSprintStatus(id, newStatus) {
  // newStatus: 'active' | 'closed'
  if (newStatus === 'active') {
    // Solo un sprint activo a la vez — el anterior pasa a 'closed', no a 'open'
    getActiveSprints().forEach(s => { if (s.status === 'active') s.status = 'closed'; });
  }
  const sp = _getSprintById(id);
  if (!sp) return;
  sp.status = newStatus;
  if (newStatus === 'active')  sp.startedAt = sp.startedAt || Date.now();
  if (newStatus === 'closed')  sp.closedAt  = sp.closedAt  || Date.now();
  if (newStatus === 'closed')  sp.endsAt    = sp.endsAt    || Date.now();
  if (newStatus !== 'closed') { delete sp.closedAt; delete sp.endsAt; }
  // B-202606-005: limpiar current:true al cerrar — state no debe tener sprints cerrados marcados como en curso
  if (newStatus === 'closed')  delete sp.current;
  // B-202605-210 guard: al cerrar un sprint directamente (sin modal), desasignar
  // ítems pendientes que quedaron huérfanos para evitar data inconsistente.
  if (newStatus === 'closed') {
    let guardCount = 0;
    ITEMS.forEach(item => {
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
    const closeTs = Date.now();
    let migratedCount = 0;
    ITEMS.forEach(i => {
      if (i.sprint === id && (i.status === 'done' || i.status === 'descartado')) {
        i.status = 'historico';
        i.archivedAt = closeTs;
        migratedCount++;
      }
    });
    if (guardCount > 0 || migratedCount > 0) {
      saveBacklog(); // una sola vez tras ambas operaciones
    }
  }
  save();
  _markBacklogListDirty(); renderBacklogList();
  showToast('info', id + ' → ' + newStatus);
}

// T-202605-026: setSprintCurrent vive en locus-sprint.js (T-202605-107)
// Implementación eliminada de este módulo — era duplicación con filtro roto (s.projectId siempre undefined).
// window.setSprintCurrent lo expone locus-sprint.js.

export function setItemSprint(code, sprintId) {
  if (sprintId === '__new__') { openNewSprintInline(code); return; }
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  const prevSprint = item.sprint || 'icebox';
  // Normalizar: sprint vacío o falsy → 'icebox' (valor canónico BR-Ecosystem V1.6)
  const normalizedId = sprintId || 'icebox';
  item.sprint = normalizedId;
  item.priority = _calcPriority(item); // T-202604-297
  // R-202605-131: marcar scope_added si el sprint destino está activo al momento de asignar
  // Solo sprints reales (no icebox) califican para scope_added
  if (normalizedId && normalizedId !== 'icebox') {
    const targetSprint = _getSprintById(normalizedId);
    if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
      item.scope_added = true;
    } else if (prevSprint === normalizedId) {
      // No marcar si se mueve al mismo sprint
    }
  } else {
    // Al desasignar de sprint (icebox), limpiar el flag
    delete item.scope_added;
  }
  if (!item.history) item.history = [];
  item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevSprint || null, to: item.sprint || null } });
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

function openNewSprintInline(code) {
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

// B-202605-077: confirmNewSprint ya no es el handler principal — openNewSprintInline usa _buildNewSprintForm.
// Se conserva como stub por si hay referencias residuales en HTML generado por versiones anteriores.
function confirmNewSprint(code) {
  if (typeof _bnsf_confirm === 'function') {
    // _buildNewSprintForm registra _bnsf_confirm en window con el ns correcto.
    // Buscar el formulario activo en el wrap y disparar confirm.
    const wrap = document.getElementById('sprint-select-wrap-' + CSS.escape(code));
    if (wrap) {
      const bnsf = wrap.querySelector('[data-bnsf]');
      if (bnsf) { _bnsf_confirm(bnsf.dataset.bnsf); return; }
    }
  }
  _markBacklogListDirty(); renderBacklogList();
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
  const spItems   = ITEMS.filter(i => i.sprint === sprintId);
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
  // T-202605-500: reconstruir label canónico = 'ID · Nombre descriptivo'
  sp.label = sprintId + ' · ' + raw;
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
  _markBacklogListDirty(); renderBacklogList();
  showToast('success', '✓ Sprint actualizado: ' + sp.label);
}

// R-202604-089: estado del modal de cierre de sprint
let _scmState = null; // { id, step, pendingItems, doneItems, migrations: { [code]: '' | sprintId | '__discard__' } }

export function confirmCloseSprint(id) {
  // R-202604-089: abre modal de 3 pasos en lugar de confirm directo
  const sp = _getSprintById(id);
  if (!sp) return;
  const pendingItems = ITEMS.filter(i => i.sprint === id && i.status !== 'done' && i.status !== 'descartado' && itemType(i.code) !== 'P');
  const doneItems    = ITEMS.filter(i => i.sprint === id && (i.status === 'done' || i.status === 'descartado'));
  const skipStep2    = pendingItems.length === 0;

  // R-202605-125: snapshot de effort al abrir modal de cierre
  const allSprintItems     = ITEMS.filter(i => i.sprint === id && itemType(i.code) !== 'P');
  const effortPlanned      = allSprintItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortDone         = doneItems.filter(i => i.status === 'done').reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortScopeAdded   = allSprintItems.filter(i => i.scope_added).reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortNotDone      = pendingItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const hasItemsWithoutEffort = allSprintItems.some(i => !i.effort || parseInt(i.effort) === 0);

  _scmState = {
    id,
    step: 1,
    skipStep2,
    pendingItems,
    doneItems,
    migrations: {},
    retroNotes: '',
    effortPlanned,
    effortDone,
    effortScopeAdded,
    effortNotDone,
    hasItemsWithoutEffort,
  };
  // default: todos los pendientes van a sin asignar
  pendingItems.forEach(i => { _scmState.migrations[i.code] = ''; });

  const overlay = document.getElementById('sprint-close-overlay');
  if (!overlay) return;
  overlay.classList.toggle('skip-step2', skipStep2);
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
  if (_scmState.skipStep2 && _scmState.step === 2) _scmState.step--;
  _scmRender();
}

function _scmNext() {
  if (!_scmState) return;
  const totalSteps = _scmState.skipStep2 ? 2 : 3;
  if (_scmState.step >= totalSteps) {
    _scmExecuteClose();
    return;
  }
  _scmState.step++;
  if (_scmState.skipStep2 && _scmState.step === 2) _scmState.step++;
  _scmRender();
}

function _scmBulkApply() {
  const sel = document.getElementById('scm-bulk-select');
  if (!sel || !_scmState) return;
  const val = sel.value;
  const selects = document.querySelectorAll('.scm-migration-select');
  selects.forEach(s => {
    s.value = val;
    const code = s.dataset.code;
    if (code) _scmState.migrations[code] = val;
  });
}

function _scmRender() {
  if (!_scmState) return;
  const { step, skipStep2, pendingItems, doneItems, migrations, id } = _scmState;
  const totalSteps = skipStep2 ? 2 : 3;
  const sp = _getSprintById(id);
  const spLabel = sp ? (sp.label || sp.id) : id;

  // actualizar indicadores de paso
  const steps = [1, 2, 3];
  steps.forEach(n => {
    const el = document.getElementById('scs-step-' + n);
    if (!el) return;
    el.classList.remove('active', 'done');
    const mappedStep = (skipStep2 && n === 2) ? null : n; // step 2 skipped
    if (mappedStep === null) return;
    const effectiveN = skipStep2 && n === 3 ? 2 : n;
    if (step === n) el.classList.add('active');
    else if (step > n) el.classList.add('done');
  });

  // botones de navegación
  const backBtn = document.getElementById('sprint-close-back-btn');
  const nextBtn = document.getElementById('sprint-close-next-btn');
  const isFirst = step === 1;
  const isLast  = step >= totalSteps; // B-202605-007: usar totalSteps en lugar de magic number 3 — con skipStep2=true totalSteps=2 y step salta a 3 (≥2), isLast=true en ambos flujos

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
  // para eliminar la referencia directa al global dentro de la función
  const _step1Metrics = {
    effortPlanned:         _scmState.effortPlanned          || 0,
    effortDone:            _scmState.effortDone             || 0,
    effortScopeAdded:      _scmState.effortScopeAdded       || 0,
    effortNotDone:         _scmState.effortNotDone          || 0,
    hasItemsWithoutEffort: _scmState.hasItemsWithoutEffort  || false,
  };
  if (step === 1) body.innerHTML = _scmStep1Html(sp, spLabel, pendingItems, doneItems, _step1Metrics);
  else if (step === 2 && !skipStep2) body.innerHTML = _scmStep2Html(pendingItems, migrations, id);
  else if (step === 3) {
    body.innerHTML = _scmStep3Html(pendingItems, doneItems, migrations, skipStep2); // T-A1: cubre step===3 en ambos casos (skipStep2=true y false)
    // Listener directo para #scm-retro-notes-ta (reemplaza oninput inline)
    const notesTA = document.getElementById('scm-retro-notes-ta');
    if (notesTA) notesTA.addEventListener('input', () => { if (_scmState) _scmState.retroNotes = notesTA.value; });
  }
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
  // % entrega = done / (planeado + scope added). Si todo es 0, usar conteo de ítems.
  const denominator = effortPlanned + effortScopeAdded;
  const pct = denominator
    ? Math.round(effortDone / denominator * 100)
    : (doneCount ? 100 : 0);

  const doneRows = doneItems.filter(i => i.status === 'done').map(i =>
    `<div class="scm-item-row">
      <span class="scm-item-type scm-type-${i.type||'T'}">${esc(i.type||'T')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title">${esc(i.title || '—')}</span>
    </div>`
  ).join('');
  const pendRows = pendingItems.map(i =>
    `<div class="scm-item-row">
      <span class="scm-item-type scm-type-${i.type||'T'}">${esc(i.type||'T')}</span>
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

  // R-202605-125: advertencia si hay ítems sin effort
  const effortWarn = hasNoEffort
    ? `<div class="scm-effort-warn">⚠ Algunos ítems no tienen effort asignado — % de entrega puede ser inexacto.</div>`
    : '';

  return `
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

function _scmStep2Html(pendingItems, migrations, currentId) {
  const otherSprints = getActiveSprints().filter(s => s.id !== currentId && s.status !== 'closed');
  const activeSp     = otherSprints.find(s => s.status === 'active');

  const sprintOptions = `
    <option value="">— sin asignar —</option>
    ${otherSprints.map(s => `<option value="${esc(s.id)}">${esc(s.label || s.id)}${s.status === 'active' ? ' ★' : ''}</option>`).join('')}
    <option value="__discard__">🗑 Descartar</option>
  `;

  const bulkDefaultVal = activeSp ? activeSp.id : '';
  const bulkSprintOpts = `
    <option value="">— sin asignar —</option>
    ${otherSprints.map(s => `<option value="${esc(s.id)}"${s.id === bulkDefaultVal ? ' selected' : ''}>${esc(s.label || s.id)}${s.status === 'active' ? ' ★' : ''}</option>`).join('')}
    <option value="__discard__">🗑 Descartar</option>
  `;

  const rows = pendingItems.map(i => {
    const cur = migrations[i.code] !== undefined ? migrations[i.code] : '';
    return `<div class="scm-migration-item">
      <div class="scm-migration-item-info">
        <span class="scm-migration-item-title">${esc(i.title || '—')}</span>
        <span class="scm-migration-item-meta">${esc(i.code)} · ${esc(i.type||'T')}</span>
      </div>
      <select class="scm-migration-select" data-code="${esc(i.code)}">
        ${sprintOptions.replace(`value="${esc(cur)}"`, `value="${esc(cur)}" selected`)}
      </select>
    </div>`;
  }).join('');

  return `
    <div class="scm-bulk-row">
      <span class="scm-nowrap">Aplicar a todos:</span>
      <select class="scm-bulk-select" id="scm-bulk-select">${bulkSprintOpts}</select>
      <button class="scm-bulk-apply" data-action="scm-bulk-apply">Aplicar</button>
    </div>
    <div class="scm-migration-intro">${pendingItems.length} ítem${pendingItems.length !== 1 ? 's' : ''} pendiente${pendingItems.length !== 1 ? 's' : ''} — elige el destino de cada uno:</div>
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

function _scmStep3Html(pendingItems, doneItems, migrations, skipStep2) {
  const doneCount      = doneItems.filter(i => i.status === 'done').length;
  const discardedCount = doneItems.filter(i => i.status === 'descartado').length;

  // agrupar pendientes por destino
  const toSprint   = pendingItems.filter(i => migrations[i.code] && migrations[i.code] !== '__discard__');
  const toUnassign = pendingItems.filter(i => !migrations[i.code]);
  const toDiscard  = pendingItems.filter(i => migrations[i.code] === '__discard__');

  const itemRow = (i, destLabel, cls) =>
    `<div class="scm-confirm-row">
      <span class="scm-item-type scm-type-${i.type||'T'} scm-flex-shrink-0">${esc(i.type||'T')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title scm-item-title-cell">${esc(i.title || '—')}</span>
      <span class="scm-confirm-dest ${cls}">${esc(destLabel)}</span>
    </div>`;

  const spLabel = id => { const s = _getSprintById(id); return s ? (s.label || s.id) : id; };

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
      <span class="scm-retro3-delta-label">vs ${esc(_prevSp.label || _prevSp.id)}</span>
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

  if (!skipStep2) {
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

function _scmExecuteClose() {
  if (!_scmState) return;
  const { id, pendingItems, migrations, retroNotes,
          effortPlanned, effortDone, effortScopeAdded, effortNotDone } = _scmState;

  // aplicar migraciones de pendientes
  const closeTs = Date.now();
  pendingItems.forEach(i => {
    const dest = migrations[i.code];
    if (dest === '__discard__') {
      // B-202605-231: migrar a historico — no dejar como descartado en backlog vivo
      i.status = 'historico';
      i.archivedAt = closeTs;
      i.sprint = id; // mantiene referencia al sprint cerrado
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
  ITEMS.forEach(i => {
    if (i.sprint === id && !processedCodes.has(i.code) && (i.status === 'done' || i.status === 'descartado')) {
      const wasDone = i.status === 'done';
      i.status = 'historico';
      i.archivedAt = closeTs;
      // R-202605-134: aplicar version_target como version en ítems que estaban done
      if (wasDone && versionTarget) i.version = versionTarget;
    }
  });

  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  // B-[tmp:historico-expand]: forzar expansión del histórico post-cierre
  // sin esto la lista principal queda vacía y el histórico aparece colapsado
  try { localStorage.setItem(_HISTORICO_KEY, '1'); } catch {}
  closeCloseSprintModal();
  setSprintStatus(id, 'closed');
  renderStats(); // B-202605-269: refrescar contadores del backlog inmediatamente post-cierre

  // T-202604-417: guardar retro como documento en el sprint — accesible desde vista de sprints cerrados
  // R-202605-125: persistir métricas de entrega con el sprint cerrado
  const sp = _getSprintById(id);
  if (sp) {
    sp.retroNotes = retroNotes || '';
    sp.retroDoc   = _generateSprintRetroMd(id, retroNotes || '');
    // R-202605-125: métricas de entrega para Analytics (Nivel 2)
    const denominator = (effortPlanned || 0) + (effortScopeAdded || 0);
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

  // T-202604-295: descargar templates al cerrar sprint si trigger lo indica
  if (_templateTrigger() === 'sprint') {
    downloadTemplates();
  }

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
  proj.sprints.push({ id, label: name || id, status: 'active', current: !hasCurrentSprint ? true : undefined, createdAt: Date.now() });
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
  const item = ITEMS.find(i => i.code === code);
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

  const spItems = (typeof ITEMS !== 'undefined' ? ITEMS : [])
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
  const spRs = (typeof ITEMS !== 'undefined' ? ITEMS : [])
    .filter(i => i.sprint === sp.id && i.type === 'R' && i.status !== 'descartado');

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

  const allItems = typeof ITEMS !== 'undefined' ? ITEMS : [];

  // Solo Rs del sprint activo (excluir descartados)
  const spRs = allItems.filter(i =>
    i.sprint === sp.id &&
    i.type === 'R' &&
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
  const children     = allItems.filter(c => c.parentId === item.code && c.type === 'T');
  const childrenDone = children.filter(c => c.status === 'done');
  const childrenHtml = children.length > 0
    ? `<span class="spi-item-children">${childrenDone.length}/${children.length} T</span>`
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

  const typePill = item.type === 'R'
    ? '<span class="sca-item-type sca-item-type--r">R</span>'
    : '<span class="sca-item-type sca-item-type--t">T</span>';

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
// Delega a esc() de locus-ui-shell.js si está disponible — fallback inline si no cargó.
const _escSpr = typeof esc === 'function'
  ? esc
  : (s => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;'));

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
      if (typeof confirmEditSprint === 'function') confirmEditSprint(action.dataset.sprintId);
      return;
    }
    if (act === 'sprint-edit-cancel') {
      _markBacklogListDirty();
      renderBacklogList();
      return;
    }
    if (act === 'scm-download-retro') {
      if (typeof _scmDownloadRetro === 'function') _scmDownloadRetro();
      return;
    }
  });

  document.addEventListener('keydown', function _sprintDelegateKeydown(e) {
    const inp = e.target.closest('[data-action="sprint-edit-keydown"]');
    if (!inp) return;
    const sprintId = inp.dataset.sprintId;
    if (e.key === 'Enter') {
      if (typeof confirmEditSprint === 'function') confirmEditSprint(sprintId);
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
        if (typeof closeCloseSprintModal === 'function') closeCloseSprintModal();
      });
    }
    if (backBtn) {
      backBtn.removeAttribute('onclick');
      backBtn.addEventListener('click', function() {
        if (typeof _scmBack === 'function') _scmBack();
      });
    }
    if (nextBtn) {
      nextBtn.removeAttribute('onclick');
      nextBtn.addEventListener('click', function() {
        if (typeof _scmNext === 'function') _scmNext();
      });
    }
    // Botón Cerrar del overlay retro — id="sprint-retro-close-btn" (migrado desde onclick en index.html)
    const retroCloseBtn = document.getElementById('sprint-retro-close-btn');
    if (retroCloseBtn) {
      retroCloseBtn.addEventListener('click', function() {
        if (typeof closeSprintRetroOverlay === 'function') closeSprintRetroOverlay();
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
        if (typeof openMapGenerator === 'function') openMapGenerator();
        break;
      case 'scm-bulk-apply':
        _scmBulkApply();
        break;
      case 'scm-export-history':
        if (typeof exportFullHistoryMd === 'function') exportFullHistoryMd();
        break;
    }
  });

  // Delegación change — .scm-migration-select (reemplaza onchange inline)
  if (scmBody) scmBody.addEventListener('change', e => {
    const sel = e.target.closest('.scm-migration-select');
    if (!sel || !_scmState) return;
    const code = sel.dataset.code;
    if (code) _scmState.migrations[code] = sel.value;
  });

  // Sprint panel items — spi-navigate (click + keydown Enter)
  const sprintPanelItems = document.getElementById('sprint-panel-items');
  if (sprintPanelItems) {
    sprintPanelItems.addEventListener('click', e => {
      const row = e.target.closest('[data-action="spi-navigate"]');
      if (row && typeof navigateToItem === 'function') navigateToItem(row.dataset.itemCode);
    });
    sprintPanelItems.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const row = e.target.closest('[data-action="spi-navigate"]');
      if (row && typeof navigateToItem === 'function') navigateToItem(row.dataset.itemCode);
    });
  }

  // Sprint inline edit wrap — stopPropagation (reemplaza onclick="event.stopPropagation()")
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="sprint-edit-stop-prop"]')) e.stopPropagation();
  }, true); // capture phase para interceptar antes de burbujeo
});
// ─────────────────────────────────────────────────────────────────────────
window.setItemSprint      = setItemSprint;
window.navigateToItem     = navigateToItem;
