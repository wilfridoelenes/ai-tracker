// locus-backlog-sprints.js
// Responsabilidad: Catálogo de sprints — CRUD, asignación de ítems, retro,
//   modal de cierre de sprint (SCM), createSprintFromGroup.
// Dependencias: locus-backlog-core.js · locus-storage.js · locus-toast.js

// ── T-sprints: Catálogo de sprints ──

function _getActiveSprint() {
  return getActiveSprints().find(s => s.status === 'active') || null;
}

function _getSprintById(id) {
  return getActiveSprints().find(s => s.id === id) || null;
}

// T-202605-500: ID con prefijo de proyecto — [PREFIJO]-S[NN], consecutivo por proyecto
function _nextSprintId() {
  const prefix = (typeof _docPrefix === 'function') ? _docPrefix() : 'XX';
  const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-S(\\d+)$', 'i');
  const nums = getActiveSprints()
    .map(s => { const m = (s.id || '').match(re); return m ? parseInt(m[1], 10) : NaN; })
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return prefix + '-S' + String(max + 1).padStart(2, '0');
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
    const vStr = (typeof _effectiveVersion === 'function' ? _effectiveVersion() : _effectiveVersion) || '0.0.0';
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
function createSprint(raw, goal, versionTarget, releaseType) {
  const _activeProjForSprint = getActiveProject();
  if (!_activeProjForSprint) { showToast('warning', 'Selecciona un proyecto primero'); return; }
  if (!_activeProjForSprint.sprints) _activeProjForSprint.sprints = [];
  raw = (raw || '').trim();
  // T-202605-500: ID siempre auto-generado — el founder solo ingresa el nombre descriptivo
  const id = _nextSprintId();
  const displayLabel = raw || id;
  if (!_isValidSprintName(displayLabel)) {
    showToast('warning', '⚠ Nombre de sprint no puede estar vacío');
    return;
  }
  if (_getSprintById(id)) { showToast('warning', 'Ya existe ' + id); return id; }
  const goalTrimmed = (goal || '').trim().slice(0, 120);
  // R-202605-134: version_target y release_type — usar sugerencia si no se pasan explícitamente
  const rt  = (releaseType   || '').trim() || null;
  const vt  = (versionTarget || '').trim() || null;
  // T-202605-500: label canónico = '[ID] · [Nombre descriptivo]'
  const canonicalLabel = displayLabel ? id + ' · ' + displayLabel : id;
  _activeProjForSprint.sprints.push({
    id, label: canonicalLabel, goal: goalTrimmed,
    version_target: vt, release_type: rt,
    status: 'open', createdAt: Date.now()
  });
  save();
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
  if (typeof getAllSessions === 'function') {
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
  if (typeof getAllSessions === 'function') {
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

  const pfx = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';

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

${discardedMdSection ? discardedMdSection + '\n---\n\n' : ''}${scopeAddedRetroSection ? scopeAddedRetroSection + '\n---\n\n' : ''}${sessionsSection ? sessionsSection + '\n---\n\n' : ''}${learningsSection ? learningsSection + '\n---\n\n' : ''}${notesSection ? notesSection + '\n---\n\n' : ''}_Generado por Locus ${(typeof _effectiveVersion === 'function') ? _effectiveVersion() : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '')} · ${dateStr}_
`;
}

// T-202604-262: mostrar modal de descarga opcional de retrospectiva
// T-202604-417: abre el overlay de retro en modo vista — muestra retro guardada del sprint cerrado
function openSprintRetroView(id) {
  const sp = _getSprintById(id);
  if (!sp) return;
  const sprintLabel = sp.label || sp.id;
  const retroDoc = sp.retroDoc || '';
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const closedAt = sp.closedAt ? new Date(sp.closedAt) : now;
  const closedStr = `${closedAt.getFullYear()}-${pad(closedAt.getMonth()+1)}-${pad(closedAt.getDate())}`;
  const pfx = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';
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
  const pfx = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';
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

function setSprintStatus(id, newStatus) {
  // newStatus: 'active' | 'open' | 'closed'
  if (newStatus === 'active') {
    // Solo un sprint activo a la vez
    getActiveSprints().forEach(s => { if (s.status === 'active') s.status = 'open'; });
  }
  const sp = _getSprintById(id);
  if (!sp) return;
  sp.status = newStatus;
  if (newStatus === 'active')  sp.startedAt = sp.startedAt || Date.now();
  if (newStatus === 'closed')  sp.closedAt  = sp.closedAt  || Date.now();
  if (newStatus === 'closed')  sp.endsAt    = sp.endsAt    || Date.now();
  if (newStatus !== 'closed') { delete sp.closedAt; delete sp.endsAt; }
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
  renderBacklogList();
  showToast('info', id + ' → ' + newStatus);
}

function setItemSprint(code, sprintId) {
  if (sprintId === '__new__') { openNewSprintInline(code); return; }
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  const prevSprint = item.sprint || '';
  item.sprint = sprintId || '';
  item.priority = _calcPriority(item); // T-202604-297
  // R-202605-131: marcar scope_added si el sprint destino está activo al momento de asignar
  if (sprintId) {
    const targetSprint = _getSprintById(sprintId);
    if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
      item.scope_added = true;
    } else if (!sprintId || prevSprint === sprintId) {
      // No marcar si se desasigna o se mueve al mismo sprint
    }
  } else {
    // Al desasignar de sprint, limpiar el flag
    delete item.scope_added;
  }
  if (!item.history) item.history = [];
  item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevSprint || null, to: item.sprint || null } });
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  renderBacklogList();
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

function openNewSprintInline(code) {
  // Muestra input inline en el select de sprint del ítem
  const wrap = document.getElementById('sprint-select-wrap-' + CSS.escape(code));
  if (!wrap) return;
  // T-202605-450: sugerencia de effort máximo basada en velocidad histórica
  const velocityData = _calcEstimatedVelocity();
  const suggestHtml = velocityData !== null
    ? `<span class="sprint-inline-hint">Velocidad real promedio: <strong>${velocityData.avg}</strong> effort</span>`
    : '';
  // R-202605-134: sugerencia automática de release_type y version_target
  const suggestedRt  = _suggestReleaseType(ITEMS.filter(i => i.sprint === code));
  const suggestedVt  = _suggestVersionTarget(suggestedRt);
  // T-202605-500: mostrar ID auto-generado como prefijo no editable
  const previewId = _nextSprintId();
  // R-202605-009: radio buttons para release_type — Major / Minor / Patch con label visible
  const rtRadios = ['Major', 'Minor', 'Patch'].map(v =>
    `<label class="sprint-inline-release-label">
      <input type="radio" name="new-sprint-rt-${esc(code)}" value="${v}"
        ${suggestedRt === v ? 'checked' : ''}
        onchange="_syncSprintConfirmBtn('${esc(code)}');_clearSprintFieldErr('new-sprint-rt-err-${esc(code)}')">
      ${v}
    </label>`
  ).join('');
  // R-202605-123: campo goal opcional bajo el nombre del sprint
  wrap.innerHTML = `<div class="sprint-inline-edit-wrap sprint-inline-edit-wrap--with-goal">
    <span class="sprint-inline-id-preview">${esc(previewId)} ·</span>
    <input id="new-sprint-inp-${esc(code)}" type="text" placeholder="Nombre descriptivo"
      class="sprint-inline-input"
      onkeydown="if(event.key==='Enter')confirmNewSprint('${esc(code)}');if(event.key==='Escape')renderBacklogList();">
    <button id="new-sprint-confirm-${esc(code)}" onclick="confirmNewSprint('${esc(code)}')" class="sprint-inline-confirm">&#10003;</button>
    <button onclick="renderBacklogList()" class="sprint-inline-cancel">&#10005;</button>
    ${suggestHtml}
    <input id="new-sprint-goal-${esc(code)}" type="text" placeholder="Goal del sprint (opcional, max 120)"
      class="sprint-inline-goal-input"
      maxlength="120"
      onkeydown="if(event.key==='Enter')confirmNewSprint('${esc(code)}');if(event.key==='Escape')renderBacklogList();">
    <div class="sprint-inline-release-row">
      <label class="sprint-inline-release-label">Versión:</label>
      <input id="new-sprint-vt-${esc(code)}" type="text" value="${esc(suggestedVt)}"
        class="sprint-inline-vt-input" placeholder="ej: v1.1.0"
        oninput="_syncSprintConfirmBtn('${esc(code)}');_clearSprintFieldErr('new-sprint-vt-err-${esc(code)}')"
        onkeydown="if(event.key==='Enter')confirmNewSprint('${esc(code)}');if(event.key==='Escape')renderBacklogList();">
      <span id="new-sprint-vt-err-${esc(code)}" class="sprint-field-err hidden"></span>
      <label class="sprint-inline-release-label">Tipo de release:</label>
      <div class="sprint-inline-release-radios">${rtRadios}</div>
      <span id="new-sprint-rt-err-${esc(code)}" class="sprint-field-err hidden"></span>
    </div>
  </div>`;
  // R-202605-009: sync inicial — con sugerencias pre-pobladas el botón puede arrancar habilitado
  setTimeout(() => {
    _syncSprintConfirmBtn(code);
    const inp = document.getElementById('new-sprint-inp-' + code);
    if (inp) inp.focus();
  }, 30);
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

function confirmNewSprint(code) {
  const inp = document.getElementById('new-sprint-inp-' + code);
  const raw = inp ? inp.value.trim() : '';
  if (!raw) { renderBacklogList(); return; }
  // R-202605-123: leer goal si está presente
  const goalInp = document.getElementById('new-sprint-goal-' + code);
  const goal = goalInp ? goalInp.value.trim() : '';
  // R-202605-134: leer version_target y release_type
  const vtInp = document.getElementById('new-sprint-vt-' + code);
  const rtEls = document.querySelectorAll(`input[name="new-sprint-rt-${CSS.escape(code)}"]`);
  const rtSel = document.getElementById('new-sprint-rt-' + code); // select fallback (mdiff)
  const vt = vtInp ? vtInp.value.trim() : '';
  const rt = rtEls.length > 0
    ? (Array.from(rtEls).find(r => r.checked) || {}).value || ''
    : (rtSel ? rtSel.value : '');
  // R-202605-009: validación obligatoria de vt y rt — modal no cierra hasta que sean válidos
  let valid = true;
  if (!vt) {
    valid = false;
    const errEl = document.getElementById('new-sprint-vt-err-' + code);
    if (vtInp) vtInp.classList.add('input-outline-error');
    if (errEl) { errEl.textContent = 'Ingresa una versión (ej: v1.0.0)'; errEl.classList.remove('is-hidden'); }
  }
  if (!rt) {
    valid = false;
    const errEl = document.getElementById('new-sprint-rt-err-' + code);
    if (errEl) { errEl.textContent = 'Selecciona el tipo de release'; errEl.classList.remove('is-hidden'); }
  }
  if (!valid) return;
  const id = createSprint(raw, goal, vt, rt);
  if (!id) { renderBacklogList(); return; } // sin proyecto activo — createSprint ya mostró toast
  setItemSprint(code, id);
}

// T-202604-246: edición inline del nombre de sprint desde el header del grupo
// R-202605-123: incluye campo goal editable
function editSprintInline(sprintId) {
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
  wrap.innerHTML = `<div class="sprint-inline-edit-wrap sprint-inline-edit-wrap--with-goal" onclick="event.stopPropagation()">
    <span class="sprint-inline-id-preview">${esc(sprintId)} ·</span>
    <input id="${esc(inputId)}" type="text" value="${esc(currentDescriptive)}"
      class="sprint-inline-input sprint-inline-input--wide"
      onkeydown="if(event.key==='Enter')confirmEditSprint('${esc(sprintId)}');if(event.key==='Escape')renderBacklogList();">
    <button onclick="confirmEditSprint('${esc(sprintId)}')" class="sprint-inline-confirm">&#10003;</button>
    <button onclick="renderBacklogList()" class="sprint-inline-cancel">&#10005;</button>
    <input id="${esc(goalId)}" type="text" value="${esc(currentGoal)}"
      placeholder="Goal del sprint (opcional, max 120)"
      class="sprint-inline-goal-input"
      maxlength="120"
      onkeydown="if(event.key==='Enter')confirmEditSprint('${esc(sprintId)}');if(event.key==='Escape')renderBacklogList();">
    <div class="sprint-inline-release-row">
      <label class="sprint-inline-release-label">Versión:</label>
      <input id="${esc(vtId)}" type="text" value="${esc(suggestVt)}"
        class="sprint-inline-vt-input" placeholder="v3.5"
        onkeydown="if(event.key==='Enter')confirmEditSprint('${esc(sprintId)}');if(event.key==='Escape')renderBacklogList();">
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
  if (!raw) { renderBacklogList(); return; } // AC-4: cancelar si vacío — no modifica
  // T-202605-500: raw es el nombre descriptivo — el ID no cambia
  if (!_isValidSprintName(raw)) {
    if (inp) { inp.classList.add('sprint-inline-input--warn'); inp.title = 'El nombre descriptivo no puede estar vacío'; }
    showToast('warning', '⚠ El nombre descriptivo no puede estar vacío');
    return;
  }
  if (inp) inp.classList.remove('sprint-inline-input--warn');
  const sp = _getSprintById(sprintId);
  if (!sp) { renderBacklogList(); return; }
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
  renderBacklogList();
  showToast('success', '✓ Sprint actualizado: ' + sp.label);
}

// R-202604-089: estado del modal de cierre de sprint
let _scmState = null; // { id, step, pendingItems, doneItems, migrations: { [code]: '' | sprintId | '__discard__' } }

function confirmCloseSprint(id) {
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
  const isLast  = step === 3; // T-A1: con skipStep2=true el wizard salta a step 3 (_scmNext L708) — isLast siempre en step 3

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
  else if (step === 3) body.innerHTML = _scmStep3Html(pendingItems, doneItems, migrations, skipStep2); // T-A1: cubre step===3 en ambos casos (skipStep2=true y false)
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
      <button class="scm-docgen-btn" onclick="openMapGenerator()">Abrir Document Generator</button>
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
      <select class="scm-migration-select" data-code="${esc(i.code)}"
        onchange="_scmState && (_scmState.migrations['${esc(i.code)}'] = this.value)">
        ${sprintOptions.replace(`value="${esc(cur)}"`, `value="${esc(cur)}" selected`)}
      </select>
    </div>`;
  }).join('');

  return `
    <div class="scm-bulk-row">
      <span class="scm-nowrap">Aplicar a todos:</span>
      <select class="scm-bulk-select" id="scm-bulk-select">${bulkSprintOpts}</select>
      <button class="scm-bulk-apply" onclick="_scmBulkApply()">Aplicar</button>
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
  const pfx = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';
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
  if (typeof showToast === 'function') showToast('download', 'Retro descargada', fname);
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
          onclick="_scmDownloadRetro()">⬇ Descargar MD</button>
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
          oninput="if (_scmState) _scmState.retroNotes = this.value"
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
      <button class="scm-docgen-btn" onclick="exportFullHistoryMd()" type="button">Descargar historial completo</button>
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
  if (typeof _templateTrigger === 'function' && _templateTrigger() === 'sprint') {
    downloadTemplates();
  }

  // T-202604-417: ofrecer descarga de retro integrada al flujo
  if (sp && sp.retroDoc) {
    _openRetroDownloadPrompt(id);
  }
}

function createSprintFromGroup(id) {
  // Registra en catálogo un sprint que ya tiene ítems pero no estaba en proj.sprints
  if (_getSprintById(id)) return;
  const proj = getActiveProject();
  if (!proj) return;
  if (!proj.sprints) proj.sprints = [];
  proj.sprints.push({ id, label: id, status: 'open' });
  save();
  renderBacklogList();
  showToast('success', id + ' registrado en catálogo');
}

// R-[pendiente-ID]: navegar a un ítem del backlog por código — cambia a tab backlog, sub-tab backlog, hace scroll y pulsa highlight
function navigateToItem(code) {
  if (!code) return;
  // Asegurar que el filtro de status incluye el status del ítem
  const item = ITEMS.find(i => i.code === code);
  if (item && !activeStatuses.has(item.status)) {
    activeStatuses.add(item.status);
    updateStatusFilterUI();
  }
  if (typeof switchTab === 'function') switchTab('backlog');
  if (typeof switchSubTab === 'function') switchSubTab('backlog');
  // Esperar render y hacer scroll
  setTimeout(() => {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('bitem--nav-highlight');
    setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1400);
  }, 120);
}

