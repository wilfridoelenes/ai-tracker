// locus-item-editor.js
// Última actualización: 2026-05-19 UTC-6
// Módulo: Item Editor, Paste Items, Templates de ítems
// Extraído de ai-tracker-ai-notes.js

// ── T-202604-109: Editor de ítems del Backlog ──
let _editorItemId = null; // null = nuevo, o id existente para editar

// T-202604-048: paste items modal
let _piItems = []; // array de ítems parseados { type, title, priority, effort, area, status, desc, ac, selected }

function openPasteItems() {
  // Fusionado en item editor — redirigir
  openItemEditor();
}

function closePasteItems() {
  // Fusionado en item editor — redirigir
  closeItemEditor();
}

function piDragOver(e) {
  e.preventDefault();
  document.getElementById('pi-textarea').classList.add('drag-over');
}
function piDragLeave(e) {
  document.getElementById('pi-textarea').classList.remove('drag-over');
}
function piDrop(e) {
  e.preventDefault();
  document.getElementById('pi-textarea').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('pi-textarea').value = ev.target.result;
    piParse();
  };
  reader.readAsText(file);
}

function _piDetectType(line) {
  // Detecta tipo desde título "### [pendiente-ID] · ..." o "### T-202604-xxx · ..."
  const m = line.match(/^###\s+(?:\[pendiente-ID\]|([PTRB])-\d{6}-\d{3})\s+·\s+(.+)$/i);
  if (!m) return null;
  // Si tiene código real, extraer tipo y código completo
  if (m[1]) {
    const codeMatch = line.match(/([PTRB]-\d{6}-\d{3})/i);
    return { type: m[1].toUpperCase(), title: m[2].trim(), code: codeMatch ? codeMatch[1].toUpperCase() : null };
  }
  return { type: 'T', title: m[2].trim(), code: null };
}

function _piParseField(lines, field) {
  for (const l of lines) {
    const m = l.match(new RegExp(`^\\*\\*${field}:\\*\\*\\s*(.+)$`, 'i'));
    if (m) return m[1].trim();
  }
  return '';
}

function _piParseAC(lines) {
  const ac = [];
  let inAC = false;
  for (const l of lines) {
    if (/^###\s+criterios/i.test(l)) { inAC = true; continue; }
    if (inAC && /^###/.test(l)) break;
    if (inAC && /^-\s+/.test(l)) ac.push(l.replace(/^-\s+\[.\]\s*/, '').replace(/^-\s+/, '').trim());
  }
  return ac;
}

function piParse() {
  const raw = document.getElementById('pi-textarea').value;
  const errEl = document.getElementById('pi-error');
  errEl.classList.remove('visible');
  // T-202604-060: deshabilitar botón al inicio de cada parse — evita estado activo intermedio
  document.getElementById('pi-confirm-btn').disabled = true;
  document.getElementById('pi-preview').classList.remove('visible');

  // Dividir en bloques por "### "
  const blocks = raw.split(/(?=^###\s)/m).filter(b => b.trim());
  _piItems = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    const header = lines[0];
    const parsed = _piDetectType(header);
    if (!parsed) continue;

    const priority = _piParseField(lines, 'Priority') || 'medium';
    const effortRaw = _piParseField(lines, 'Effort');
    const effort = parseInt(effortRaw) || 1;
    // R-202605-122 AC4: marcar para revisión si effort no estaba en el bloque pegado
    const _needsEffortReview = !effortRaw || effortRaw.trim() === '';
    const area = _piParseField(lines, 'Area') || '';
    const statusRaw = _piParseField(lines, 'Status') || 'pendiente';
    const ac = _piParseAC(lines);

    // Descripción: líneas entre campos y criterios que no sean **campo:**
    const descLines = lines.slice(1).filter(l =>
      l.trim() && !/^\*\*\w/.test(l) && !/^###/.test(l) && !/^-\s/.test(l)
    );
    const desc = descLines.join('\n').trim();

    // Normalizar status al valor canónico
    const status = _normalizeStatus(statusRaw);

    // T-202604-066: si es [pendiente-ID], buscar match por título en ITEMS
    let matchedCode = parsed.code || null; // parsed.code solo existe si el header tenía código real
    let _titleMatchWarning = false;
    if (!matchedCode) {
      const normTitle = parsed.title.toLowerCase().trim();
      const titleMatch = (typeof ITEMS !== 'undefined') && ITEMS.find(i => i.title.toLowerCase().trim() === normTitle);
      if (titleMatch) { matchedCode = titleMatch.code; _titleMatchWarning = true; }
    }
    _piItems.push({ type: parsed.type, title: parsed.title, priority, effort, area, status, desc, ac, selected: true, code: matchedCode, _titleMatchWarning, _needsEffortReview });
  }

  if (!_piItems.length && raw.trim()) {
    errEl.textContent = '⚠ No se detectaron ítems válidos — verifica el formato Markdown.';
    errEl.classList.add('visible');
    document.getElementById('pi-preview').classList.remove('visible');
    document.getElementById('pi-confirm-btn').disabled = true;
    return;
  }

  piRenderPreview();
}

function piRenderPreview() {
  const preview = document.getElementById('pi-preview');
  const list = document.getElementById('pi-list');
  const countEl = document.getElementById('pi-count');
  const confirmBtn = document.getElementById('pi-confirm-btn');

  if (!_piItems.length) {
    preview.classList.remove('visible');
    confirmBtn.disabled = true;
    return;
  }

  const selected = _piItems.filter(i => i.selected).length;
  countEl.textContent = `${selected} de ${_piItems.length} seleccionado${_piItems.length !== 1 ? 's' : ''}`;
  confirmBtn.disabled = selected === 0;

  // Contadores para header summary
  const nNew    = _piItems.filter(i => !i.code || i._titleMatchWarning).length;
  const nUpdate = _piItems.filter(i => i.code && !i._titleMatchWarning).length;
  const nWarn   = _piItems.filter(i => !i.effort || !i.area || !i.ac || !i.ac.length).length;

  const statsHtml = `<div class="pi-summary-stats">
    ${nNew    > 0 ? `<span class="pi-stat-new">+ ${nNew} nuevo${nNew !== 1 ? 's' : ''}</span>` : ''}
    ${nUpdate > 0 ? `<span class="pi-stat-update">↑ ${nUpdate} actualizar</span>` : ''}
    ${nWarn   > 0 ? `<span class="pi-stat-warn">⚠ ${nWarn} campo${nWarn !== 1 ? 's' : ''} faltante${nWarn !== 1 ? 's' : ''}</span>` : ''}
  </div>`;

  list.innerHTML = statsHtml + _piItems.map((item, i) => {
    const isUpdate = item.code && !item._titleMatchWarning;
    const isTitleMatch = !!item._titleMatchWarning;
    const missingFields = [];
    if (!item.effort) missingFields.push('effort');
    if (!item.area)   missingFields.push('area');
    if (!item.ac || !item.ac.length) missingFields.push('ac');
    const hasWarning = missingFields.length > 0;
    const autoExpand = hasWarning;

    const statusPill = isUpdate
      ? `<span class="pi-status-update">↑ ${esc(item.code)}</span>`
      : isTitleMatch
        ? `<span class="pi-status-title-match">↑ actualizar: ${esc(item.code)}</span>`
        : `<span class="pi-status-new">+ nuevo</span>`;

    const typePill = item.type ? `<span class="pi-type-pill">${esc(item.type)}</span>` : '';
    const warnBadge = hasWarning ? `<span class="pi-item-warning">⚠ falta: ${missingFields.join(', ')}</span>` : '';

    const acHtml = item.ac && item.ac.length
      ? `<div class="pi-ac-mt"><div class="pi-ac-header">${item.ac.length} criterio${item.ac.length !== 1 ? 's' : ''}</div><ul class="pi-item-ac-list">${item.ac.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>`
      : `<div class="pi-no-ac">Sin criterios de aceptación</div>`;

    return `
    <div class="pi-item${item.selected ? '' : ' deselected'}${hasWarning ? ' has-warning' : ''}" id="pi-item-${i}">
      <div class="pi-item-header" onclick="piToggleCard(${i}, event)">
        <input type="checkbox" class="pi-item-check" ${item.selected ? 'checked' : ''} onchange="piToggle(${i},this.checked)" onclick="event.stopPropagation()">
        <span class="pi-item-collapse${autoExpand ? ' open' : ''}">▶</span>
        <div class="pi-item-summary">
          ${typePill}
          <span class="pi-item-summary-title">${esc(item.title)}</span>
          ${statusPill}
          ${warnBadge}
        </div>
        <button class="pi-item-del" onclick="piDeleteItem(${i});event.stopPropagation();" title="Quitar del preview">✕</button>
      </div>
      <div class="pi-item-body${autoExpand ? ' open' : ''}" id="pi-body-${i}">
        <div class="pi-item-fields">
          <div class="pi-item-field"><span class="pi-item-field-label">Status</span><span>${esc(item.status || '—')}</span></div>
          <div class="pi-item-field"><span class="pi-item-field-label">Priority</span><span>${esc(item.priority || '—')}</span></div>
          <div class="pi-item-field"><span class="pi-item-field-label">Effort</span><span>${item.effort ? item.effort + '/3' : '<span class="pi-missing-val">—</span>'}</span></div>
          <div class="pi-item-field"><span class="pi-item-field-label">Area</span><span>${item.area ? esc(item.area) : '<span class="pi-missing-val">—</span>'}</span></div>
          ${item.sprint ? `<div class="pi-item-field"><span class="pi-item-field-label">Sprint</span><span>${esc(item.sprint)}</span></div>` : ''}
        </div>
        ${item.desc ? `<div class="pi-item-desc">${esc(item.desc)}</div>` : ''}
        ${acHtml}
      </div>
    </div>`;
  }).join('');

  preview.classList.add('visible');
}

function piToggleCard(i, e) {
  const body = document.getElementById('pi-body-' + i);
  const arrow = document.querySelector(`#pi-item-${i} .pi-item-collapse`);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open', isOpen);
}

function piToggle(i, checked) {
  _piItems[i].selected = checked;
  document.getElementById(`pi-item-${i}`).classList.toggle('deselected', !checked);
  const selected = _piItems.filter(x => x.selected).length;
  document.getElementById('pi-count').textContent = `${selected} de ${_piItems.length} seleccionado${_piItems.length !== 1 ? 's' : ''}`;
  document.getElementById('pi-confirm-btn').disabled = selected === 0;
}

function piEditTitle(i, val) { _piItems[i].title = val; }
function piEditType(i, val) { _piItems[i].type = val; }
function piEditStatus(i, val) { _piItems[i].status = val; }

function piDeleteItem(i) {
  _piItems.splice(i, 1);
  piRenderPreview();
  if (!_piItems.length) {
    document.getElementById('pi-preview').classList.remove('visible');
    document.getElementById('pi-confirm-btn').disabled = true;
  }
}

function piConfirm() {
  const toAdd = _piItems.filter(i => i.selected);
  if (!toAdd.length) return;

  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  if (!meta.counters) meta.counters = { P:0, T:0, R:0, B:0 };
  const yyyymm = new Date().toISOString().slice(0,7).replace('-','');
  const updated = [];
  const priorityMap = {
    'high': 'high', 'importante': 'high', 'important': 'high', 'crítico': 'high',
    'critical': 'high', 'alta': 'high', 'alto': 'high',
    'medium': 'medium', 'mejora': 'medium', 'media': 'medium', 'medio': 'medium',
    'proceso': 'medium', 'pulido': 'medium',
    'low': 'low', 'baja': 'low', 'bajo': 'low', 'futura': 'low'
  };
  for (const item of toAdd) {
    const normPriority = priorityMap[(item.priority||'').toLowerCase()] || 'medium';
    const existingIdx = item.code ? ITEMS.findIndex(i => i.code === item.code) : -1;
    if (existingIdx >= 0) {
      const existing = ITEMS[existingIdx];
      ITEMS[existingIdx] = {
        ...existing,
        title: item.title,
        priority: normPriority,
        effort: item.effort,
        area: item.area,
        desc: item.desc,
        ac: item.ac,
        status: item.status || existing.status,
        version: item.version || existing.version,
        sprint: item.sprint || existing.sprint || '',
        parentId: item.parentId || existing.parentId || null,
      };
      updated.push(item.code);
    } else {
      const type = item.type;
      meta.counters[type] = (meta.counters[type] || 0) + 1;
      const num = String(meta.counters[type]).padStart(3,'0');
      const code = item.code || `${type}-${yyyymm}-${num}`;
      const id = 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
      ITEMS.push({
        id, code,
        title: item.title,
        priority: normPriority,
        effort: item.effort,
        area: item.area,
        desc: item.desc,
        ac: item.ac,
        status: item.status || 'backlog',
        version: item.version || 'futura',
        sprint: item.sprint || _activeSprint(),
        parentId: item.parentId || null,
        _needsEffortReview: item._needsEffortReview || false,
        schema_version: 1,
      });
      added.push(code);
    }
  }

  localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
  _undoSnapshot();
  saveBacklog();
  renderBacklogList();
  renderStats();
  updateBacklogBanner();
  closeItemEditor();

  const parts = [];
  if (added.length) parts.push(`${added.length} agregado${added.length > 1 ? 's' : ''}: ${added.slice(0,3).join(', ')}${added.length > 3 ? '…' : ''}`);
  if (updated.length) parts.push(`${updated.length} actualizado${updated.length > 1 ? 's' : ''}: ${updated.slice(0,3).join(', ')}${updated.length > 3 ? '…' : ''}`);
  showToast('success', '✓ ' + parts.join(' · '));
}

function _refreshParentIdDropdown(selectedType, selectedParentId) {
  const field = document.getElementById('field-parentid');
  const sel = document.getElementById('item-parentid');
  if (!field || !sel) return;
  // Solo T y B pueden tener R padre
  const show = selectedType === 'T' || selectedType === 'B';
  field.classList.toggle('is-hidden', !show);
  if (!show) { sel.value = ''; return; }
  // Poblar con R disponibles
  const rItems = ITEMS.filter(i => i.code && i.code[0] === 'R');
  sel.innerHTML = '<option value="">— Sin R padre —</option>' +
    rItems.map(r => `<option value="${esc(r.code)}"${r.code === selectedParentId ? ' selected' : ''}>${esc(r.code)} · ${esc(r.title || r.desc || '')}</option>`).join('');
}

// T-202604-294: helper — retorna id del sprint activo si existe, '' si no
function _activeSprint() {
  if (typeof _getActiveSprint !== 'function') return '';
  const s = _getActiveSprint();
  return s ? s.id : '';
}

function openItemEditor(itemId = null, itemCode = null) {
  if (typeof _saveModalTrigger === 'function') _saveModalTrigger('item-editor-overlay');
  const overlay = document.getElementById('item-editor-overlay');
  // T-522: guard — si el overlay no existe el módulo externo no cargó correctamente
  if (!overlay) {
    console.warn('[openItemEditor] item-editor-overlay no encontrado — módulo externo no cargado');
    return;
  }
  const title = document.getElementById('item-editor-title');
  const typeSelect = document.getElementById('item-type');
  // T-202605-451: reset save-as panel on open
  const savePanel = document.getElementById('tpl-save-panel');
  if (savePanel) savePanel.classList.remove('open');


  if (itemId || itemCode) {
    // Editar ítem existente — buscar por id primero, luego por code como fallback
    const item = itemId
      ? (ITEMS.find(i => i.id === itemId) || ITEMS.find(i => i.code === itemId))
      : ITEMS.find(i => i.code === itemCode);
    if (!item) return;
    _editorItemId = item.id || item.code; // guardar lo que tengamos
    title.textContent = '✎ Editar ítem';
    // AC-7: indicar visualmente que es actualización
    title.className = (title.className || '').replace(/item-editor-title--\S+/g, '').trim() + ' item-editor-title--edit';
    
    typeSelect.value = item.code[0];
    document.getElementById('item-code').value = item.code;
    document.getElementById('item-title').value = item.title || '';
    document.getElementById('item-priority').value = item.priority || 'medium';
    document.getElementById('item-effort').value = item.effort || 1;
    document.getElementById('item-area').value = item.area || '';
    document.getElementById('item-desc').value = item.desc || '';
    document.getElementById('item-ac').value = (item.ac || []).join('\n');
    const notesEl = document.getElementById('item-notes');
    if (notesEl) notesEl.value = item.notes || '';
    const bbEl = document.getElementById('item-blocked-by');
    if (bbEl) bbEl.value = (item.blockedBy || []).join(', ');
    const archivosEl = document.getElementById('item-archivos');
    if (archivosEl) archivosEl.value = (item.archivos || []).join(', ');
    _refreshParentIdDropdown(item.code[0], item.parentId || '');
  } else {
    // Nuevo ítem
    _editorItemId = null;
    title.textContent = '➕ Nuevo ítem';
    title.className = (title.className || '').replace(/item-editor-title--\S+/g, '').trim();
    typeSelect.value = 'T';
    document.getElementById('item-code').value = '';
    document.getElementById('item-title').value = '';
    document.getElementById('item-priority').value = 'medium';
    document.getElementById('item-effort').value = 1;
    document.getElementById('item-area').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-ac').value = '';
    const notesElNew = document.getElementById('item-notes');
    if (notesElNew) notesElNew.value = '';
    const bbElNew = document.getElementById('item-blocked-by');
    if (bbElNew) bbElNew.value = '';
    const archivosElNew = document.getElementById('item-archivos');
    if (archivosElNew) archivosElNew.value = '';
    _refreshParentIdDropdown('T', '');
  }

  // Resetear bloque pegar siempre al abrir
  _piItems = [];
  const piTa = document.getElementById('pi-textarea');
  if (piTa) piTa.value = '';
  const piErr = document.getElementById('pi-error');
  if (piErr) piErr.classList.remove('visible');
  const piPrev = document.getElementById('pi-preview');
  if (piPrev) piPrev.classList.remove('visible');
  const piList = document.getElementById('pi-list');
  if (piList) piList.innerHTML = '';
  const piCnt = document.getElementById('pi-count');
  if (piCnt) piCnt.textContent = '';
  const piBtn = document.getElementById('pi-confirm-btn');
  if (piBtn) piBtn.disabled = true;

  // Actualizar dropdown al cambiar tipo
  typeSelect.onchange = () => _refreshParentIdDropdown(typeSelect.value, document.getElementById('item-parentid').value);

  // Paste-to-autofill en campo Prompt/Descripción
  const descTA = document.getElementById('item-desc');
  descTA.onpaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    if (!pasted) return;
    const filled = _ieAutofillFromPaste(pasted);
    if (filled) {
      e.preventDefault();
      _refreshParentIdDropdown(document.getElementById('item-type').value, document.getElementById('item-parentid').value);
    }
  };
  
  overlay.classList.add('open');
  document.getElementById('item-title').focus();
}

// Parser paste-to-autofill para el item editor.
// Soporta dos formatos:
//   1) Línea CHECKPOINT: T: [pendiente-ID]: Título | effort:2 | area:X | ac: c1 / c2
//   2) Bloque Markdown:  ### T-202604-001 · Título\n**Priority:** ...\n**Area:** ...\n
// Retorna true si se detectó y pobló algún campo.
function _ieAutofillFromPaste(text) {
  const t = text.trim();

  // ── Formato 1: línea CHECKPOINT ───────────────────────────────────────────
  // [PTRBI]: ([código]|[pendiente-ID]|[tmp:slug]): desc | effort:N | area:X | ac: c1 / c2
  const cpRe = /^([PTRB])\s*:\s*(?:\[pendiente-ID\]|\[tmp:[^\]]+\]|[PTRB]-\d{6}-\d{3}(?:-[A-Z]+)?)\s*:\s*(.+?)(?:\s*\|(.+))?$/i;
  const cpMatch = t.match(cpRe);
  if (cpMatch) {
    const typeChar = cpMatch[1].toUpperCase() === 'I' ? 'I' : cpMatch[1].toUpperCase();
    const descRaw  = cpMatch[2].trim();
    const rest     = cpMatch[3] || '';

    // Extraer pipes
    const pipes = {};
    rest.split('|').forEach(seg => {
      const kv = seg.match(/^\s*([a-z]+)\s*:\s*(.+)/i);
      if (kv) pipes[kv[1].toLowerCase().trim()] = kv[2].trim();
    });

    // AC: separado por " / "
    const acRaw = pipes['ac'] || '';
    const acList = acRaw ? acRaw.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean) : [];

    // Poblar formulario
    document.getElementById('item-type').value      = typeChar;
    document.getElementById('item-title').value     = descRaw;
    document.getElementById('item-area').value      = pipes['area'] || '';
    document.getElementById('item-effort').value    = parseInt(pipes['effort']) || 1;
    document.getElementById('item-ac').value        = acList.join('\n');
    document.getElementById('item-desc').value      = '';
    // T-202604-288: blockedBy desde pipe
    const bbAutofillEl = document.getElementById('item-blocked-by');
    if (bbAutofillEl) bbAutofillEl.value = pipes['blockedby'] || pipes['blockedBy'] || '';
    const archivosAutofillEl = document.getElementById('item-archivos');
    if (archivosAutofillEl) archivosAutofillEl.value = pipes['archivos'] || pipes['files'] || '';

    // Sprint / priority si viene
    if (pipes['priority']) document.getElementById('item-priority').value = pipes['priority'].toLowerCase();

    _ieHighlightAutofilled();
    showToast('success', '✓ Formulario autocompletado desde CHECKPOINT — verifica y guarda', null, 3000);
    return true;
  }

  // ── Formato 2: bloque Markdown ────────────────────────────────────────────
  // ### [CODE|pendiente-ID] · Título
  const mdHeaderRe = /^###\s+(?:(\[pendiente-ID\]|\[tmp:[^\]]+\]|([PTRB])-\d{6}-\d{3}(?:-[A-Za-z]+)?))\s+·\s+(.+)/im;
  // También acepta header sin código: ### Título (menos preciso — solo si hay campos **field:**)
  const mdHeaderSimple = /^###\s+(.+)/im;
  let mdMatch = t.match(mdHeaderRe);
  let mdSimple = false;
  if (!mdMatch) {
    // Intentar si hay al menos un campo **Field:** en el texto
    if (/\*\*(?:Priority|Area|Effort|Status)\*\*/.test(t)) {
      mdMatch = t.match(mdHeaderSimple);
      mdSimple = true;
    }
  }

  if (mdMatch) {
    const typeChar = mdSimple ? null : (mdMatch[2] ? mdMatch[2].toUpperCase() : null);
    const codeRaw  = mdSimple ? '' : (mdMatch[1] || '');
    const titleRaw = mdSimple ? mdMatch[1].trim() : mdMatch[3].trim();

    const get = (field) => {
      const m = t.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`, 'i'));
      return m ? m[1].trim() : '';
    };

    const priority = get('Priority') || 'medium';
    const area     = get('Area') || '';
    const effort   = parseInt(get('Effort')) || 1;

    // Descripción: bloque entre **Version:** y ### Criterios (o fin)
    const descMatch = t.match(/\*\*Version:\*\*[^\n]*\n+([\s\S]*?)(?=###\s*Criterios|$)/i);
    const desc = descMatch ? descMatch[1].trim() : '';

    // AC
    const acMatch = t.match(/###\s*Criterios de aceptación\s*\n([\s\S]*?)(?=\n---|$)/i);
    const ac = [];
    if (acMatch) {
      acMatch[1].split('\n').forEach(l => {
        const m = l.match(/^-\s+\[[ x]\]\s+(.+)/i);
        if (m) ac.push(m[1].trim());
        else {
          const m2 = l.match(/^-\s+(.+)/);
          if (m2) ac.push(m2[1].trim());
        }
      });
    }

    // Código real si viene
    const isRealCode = !mdSimple && codeRaw && /[PTRB]-\d{6}-\d{3}/i.test(codeRaw);

    // Poblar
    if (typeChar) document.getElementById('item-type').value  = typeChar;
    if (isRealCode) document.getElementById('item-code').value = codeRaw;
    document.getElementById('item-title').value    = titleRaw;
    document.getElementById('item-priority').value = priority.toLowerCase();
    document.getElementById('item-effort').value   = effort;
    document.getElementById('item-area').value     = area;
    document.getElementById('item-desc').value     = desc;
    document.getElementById('item-ac').value       = ac.join('\n');
    // T-202604-288: blockedBy desde MD
    const bbMdEl = document.getElementById('item-blocked-by');
    if (bbMdEl) bbMdEl.value = get('BlockedBy') || '';
    const archivosEl = document.getElementById('item-archivos');
    if (archivosEl) archivosEl.value = get('Archivos') || get('Files') || '';

    _ieHighlightAutofilled();
    showToast('success', '✓ Formulario autocompletado desde Markdown — verifica y guarda', null, 3000);
    return true;
  }

  return false; // no se detectó ningún formato — comportamiento normal
}

// Flash visual en campos rellenados automáticamente
function _ieHighlightAutofilled() {
  const ids = ['item-type','item-code','item-title','item-priority','item-effort','item-area','item-desc','item-ac','item-archivos'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('ie-autofilled');
    void el.offsetWidth; // reflow para reiniciar animación
    el.classList.add('ie-autofilled');
    setTimeout(() => el.classList.remove('ie-autofilled'), 1200);
  });
}

function closeItemEditor() {
  document.getElementById('item-editor-overlay').classList.remove('open');
  if (typeof _restoreModalFocus === 'function') _restoreModalFocus('item-editor-overlay');
  _editorItemId = null;
}

function confirmItemEditor() {
  const type = document.getElementById('item-type').value;
  const code = document.getElementById('item-code').value.trim();
  const title = document.getElementById('item-title').value.trim();
  
  if (!title) { showToast('warning', '⚠ Título es obligatorio'); return; }

  // R-202605-122 AC1: effort obligatorio para ítems no tipo P
  const effortRaw = document.getElementById('item-effort').value;
  if (type !== 'P' && (!effortRaw || effortRaw === '0' || effortRaw === '')) {
    const effortEl = document.getElementById('item-effort');
    if (effortEl) {
      effortEl.classList.add('field-error');
      effortEl.focus();
      setTimeout(() => effortEl.classList.remove('field-error'), 2000);
    }
    showToast('warning', '⚠ Effort es obligatorio — selecciona 1, 2 o 3');
    return;
  }

  const priority = document.getElementById('item-priority').value;
  const effort = parseInt(effortRaw) || 1;
  const area = document.getElementById('item-area').value.trim();
  const desc = document.getElementById('item-desc').value.trim();
  const acText = document.getElementById('item-ac').value.trim();
  const ac = acText ? acText.split('\n').map(l => l.replace(/^[-*]\s*(\[[ x]\]\s*)?/, '').trim()).filter(Boolean) : [];
  const parentId = (document.getElementById('item-parentid').value || '').trim() || null;
  const notesEl2 = document.getElementById('item-notes');
  // B-202605-068: si #item-notes no existe, emitir warning y preservar notes existentes
  if (!notesEl2) {
    console.warn('[AI Tracker] confirmItemEditor: #item-notes no encontrado en el DOM — notes no se actualizará');
  }
  const notes = notesEl2 ? notesEl2.value.trim() : null;
  const bbEl2 = document.getElementById('item-blocked-by');
  const blockedBy = bbEl2
    ? bbEl2.value.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const archivosEl2 = document.getElementById('item-archivos');
  const archivos = archivosEl2
    ? archivosEl2.value.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  
  // Generar código si está vacío — usa _getNextItemCode() para consistencia con el sistema
  let finalCode = code;
  if (!finalCode) {
    finalCode = _getNextItemCode(type);
  }

  if (_editorItemId) {
    // Editar existente
    const item = ITEMS.find(i => i.id === _editorItemId) || ITEMS.find(i => i.code === _editorItemId);
    if (!item) return;

    // AC-10: detectar colisión de código (código cambiado a uno que ya existe en otro ítem)
    if (finalCode !== item.code) {
      const collision = ITEMS.find(i => i.code === finalCode && i.code !== item.code);
      if (collision) {
        showToast('warning', '⚠ El código ' + finalCode + ' ya existe en otro ítem');
        return;
      }
    }

    // AC-6: lógica de status desde el editor (si hubiera selector de status en el editor en el futuro)
    // Por ahora el editor no expone selector de status — se gestiona desde inline/CHECKPOINT
    item.code = finalCode;
    item.title = title;
    item.priority = priority;
    item.effort = effort;
    item.area = area;
    item.desc = desc;
    item.ac = ac;
    // B-202605-068: si notes es null (#item-notes ausente del DOM), preservar valor existente
    // T-528: normalizar notes null→'' — ítems cargados desde CHECKPOINT sin campo notes
    if (notes !== null) item.notes = notes;
    if (item.notes == null) item.notes = '';
    item.blockedBy = blockedBy;
    item.archivos = archivos;
    item.parentId = parentId || null;
    _blogLog('editado', finalCode, title, 'backlog');
    _undoSnapshot();
    saveBacklog();
    showToast('success', '✓ ' + finalCode + ' actualizado');
  } else {
    // AC-9: crear nuevo — código generado o ingresado manualmente
    // Verificar colisión también en creación
    const collision = ITEMS.find(i => i.code === finalCode);
    if (collision) {
      showToast('warning', '⚠ El código ' + finalCode + ' ya existe — edita el ítem existente');
      return;
    }
    const id = 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
    // B-202604-015: heredar sprint del padre si existe; T-202604-294: fallback a sprint activo
    const _newItemSprint = parentId
      ? ((ITEMS.find(p => p.code === parentId) || {}).sprint || _activeSprint())
      : _activeSprint();
    ITEMS.push({
      id, code: finalCode, title, priority, effort, area, desc, ac,
      notes: notes || '',
      blockedBy: blockedBy,
      archivos: archivos,
      parentId: parentId || null,
      sprint: _newItemSprint,
      status: 'pendiente', version: 'futura',
      schema_version: 1,
    });
    _blogLog('creado', finalCode, title, 'backlog');
    _undoSnapshot();
    saveBacklog();
    showToast('success', '✓ ' + finalCode + ' creado');
  }

  closeItemEditor();
  renderBacklogList();
  updateBacklogBanner();
}


// ══════════════════════════════════════════════════════════════════════════════
// T-202605-451 · TEMPLATES DE ÍTEMS — predefinidos y personalizados
// ══════════════════════════════════════════════════════════════════════════════

const _ITEM_TEMPLATES_KEY = 'ai-tracker-item-templates';

const _PREDEFINED_TEMPLATES = [
  {
    id: 'tpl-r-feature',
    name: 'R — Feature',
    builtin: true,
    type: 'R',
    priority: 'medium',
    effort: 2,
    area: 'UI · Feature',
    desc: '',
    ac: [
      'Visible en UI en el estado esperado',
      'Persiste correctamente en localStorage',
      'CSS Purity — sin style= inline',
      'Sin romper layout mobile (<600px)',
    ],
    notes: '',
  },
  {
    id: 'tpl-r-refactor',
    name: 'R — Refactor',
    builtin: true,
    type: 'R',
    priority: 'low',
    effort: 2,
    area: 'Refactor',
    desc: '',
    ac: [
      'Comportamiento externo idéntico al anterior',
      'Sin regresiones en módulos adyacentes',
      'CSS Purity — sin style= inline',
      'Deuda técnica documentada en CHECKPOINT',
    ],
    notes: '',
  },
  {
    id: 'tpl-b-bug',
    name: 'B — Bug',
    builtin: true,
    type: 'B',
    priority: 'high',
    effort: 1,
    area: '',
    desc: '',
    ac: [
      'Reproducir con pasos exactos',
      'Fix verificable: [descripción del estado esperado]',
      'Sin regresión en flujo afectado',
    ],
    notes: '',
  },
  {
    id: 'tpl-t-impl',
    name: 'T — Implementación',
    builtin: true,
    type: 'T',
    priority: 'medium',
    effort: 1,
    area: '',
    desc: '',
    ac: [
      'Implementado según AC del R padre',
      'CSS Purity — sin style= inline',
      'Verificado en happy path y edge case',
    ],
    notes: '',
  },
];

function _loadCustomTemplates() {
  try {
    const raw = localStorage.getItem(_ITEM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function _saveCustomTemplates(list) {
  try {
    localStorage.setItem(_ITEM_TEMPLATES_KEY, JSON.stringify(list));
  } catch (e) {
    showToast('error', '❌ Error al guardar template — almacenamiento lleno');
  }
}

function _getAllTemplates() {
  return [..._PREDEFINED_TEMPLATES, ..._loadCustomTemplates()];
}

// Abre el picker de templates
function openTemplatePicker() {
  const overlay = document.getElementById('tpl-picker-overlay');
  if (!overlay) return;
  _renderTemplatePicker();
  overlay.classList.add('open');
}

function closeTemplatePicker() {
  const overlay = document.getElementById('tpl-picker-overlay');
  if (overlay) overlay.classList.remove('open');
}

function _renderTemplatePicker() {
  const list = document.getElementById('tpl-picker-list');
  if (!list) return;
  const all = _getAllTemplates();

  const predefined = all.filter(t => t.builtin);
  const custom = all.filter(t => !t.builtin);

  const renderGroup = (items, label) => {
    if (!items.length) return '';
    const header = label ? `<div class="tpl-section-label">${label}</div>` : '';
    return header + items.map(tpl => {
      const typeClass = 'tag-' + tpl.type.toLowerCase();
      const acCount = (tpl.ac || []).length;
      const deleteBtn = tpl.builtin ? '' :
        `<button class="tpl-delete-btn" onclick="event.stopPropagation();_deleteCustomTemplate('${tpl.id}')" title="Eliminar template">✕</button>`;
      return `
        <div class="tpl-picker-item" onclick="_applyTemplate('${tpl.id}')">
          <div class="tpl-item-info">
            <div class="tpl-item-name">${tpl.name}</div>
            <div class="tpl-item-meta">
              <span class="tpl-item-tag ${typeClass}">${tpl.type}</span>
              <span>Effort ${tpl.effort}</span>
              ${tpl.area ? `<span>${tpl.area}</span>` : ''}
              ${acCount ? `<span>${acCount} AC</span>` : ''}
              ${!tpl.builtin ? '<span class="tpl-item-custom-badge">personalizado</span>' : ''}
            </div>
          </div>
          ${deleteBtn}
        </div>`;
    }).join('');
  };

  const html = renderGroup(predefined, '') + renderGroup(custom, custom.length ? 'Personalizados' : '');
  list.innerHTML = html || '<div class="tpl-empty">No hay templates. Crea uno desde un ítem existente.</div>';
}

function _applyTemplate(tplId) {
  const tpl = _getAllTemplates().find(t => t.id === tplId);
  if (!tpl) return;

  const typeSelect = document.getElementById('item-type');
  if (typeSelect) typeSelect.value = tpl.type;

  document.getElementById('item-title').value = '';
  document.getElementById('item-priority').value = tpl.priority || 'medium';
  document.getElementById('item-effort').value = tpl.effort || 1;
  document.getElementById('item-area').value = tpl.area || '';
  document.getElementById('item-desc').value = tpl.desc || '';
  document.getElementById('item-ac').value = (tpl.ac || []).join('\n');
  const notesEl = document.getElementById('item-notes');
  if (notesEl) notesEl.value = tpl.notes || '';

  if (typeof _refreshParentIdDropdown === 'function') {
    _refreshParentIdDropdown(tpl.type, '');
  }

  closeTemplatePicker();
  _ieHighlightAutofilled();
  document.getElementById('item-title').focus();
  showToast('success', '✓ Template aplicado — completa el título y guarda', null, 2500);
}

function _deleteCustomTemplate(tplId) {
  const customs = _loadCustomTemplates().filter(t => t.id !== tplId);
  _saveCustomTemplates(customs);
  _renderTemplatePicker();
  showToast('success', '✓ Template eliminado');
}

// Guarda el ítem actual (en editor abierto) como template personalizado
function saveCurrentItemAsTemplate() {
  const title = document.getElementById('item-title').value.trim();
  const type = document.getElementById('item-type').value;
  const priority = document.getElementById('item-priority').value;
  const effort = parseInt(document.getElementById('item-effort').value) || 1;
  const area = document.getElementById('item-area').value.trim();
  const desc = document.getElementById('item-desc').value.trim();
  const acText = document.getElementById('item-ac').value.trim();
  const ac = acText ? acText.split('\n').map(l => l.replace(/^[-*]\s*(\[[ x]\]\s*)?/, '').trim()).filter(Boolean) : [];
  const notesEl = document.getElementById('item-notes');
  const notes = notesEl ? notesEl.value.trim() : '';

  const tplNameInput = document.getElementById('tpl-save-name-input');
  const tplName = tplNameInput ? tplNameInput.value.trim() : (title || (type + ' — template'));
  if (!tplName) { showToast('warning', '⚠ Asigna un nombre al template'); return; }

  const customs = _loadCustomTemplates();
  const newTpl = {
    id: 'tpl-custom-' + Date.now(),
    name: tplName,
    builtin: false,
    type, priority, effort, area, desc, ac, notes,
  };
  customs.push(newTpl);
  _saveCustomTemplates(customs);

  // Ocultar el save-as panel
  const savePanel = document.getElementById('tpl-save-panel');
  if (savePanel) savePanel.classList.remove('open');

  showToast('success', '✓ Template "' + tplName + '" guardado');
}

function toggleTplSavePanel() {
  const panel = document.getElementById('tpl-save-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    const title = document.getElementById('item-title').value.trim();
    const type = document.getElementById('item-type').value;
    const nameInput = document.getElementById('tpl-save-name-input');
    if (nameInput) nameInput.value = title || type + ' — template';
    nameInput && nameInput.focus();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FIN T-202605-451
// ══════════════════════════════════════════════════════════════════════════════

// T-082: Helper centralizado — retorna el próximo Date en que resetTime ocurre
// Siempre retorna un Date futuro: si la hora ya pasó hoy, proyecta a mañana (+24h)
