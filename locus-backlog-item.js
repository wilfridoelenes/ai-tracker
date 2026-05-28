// [PP] v1.2.3 · sprint:PP-S-09 · mod:2 · autor:Rune · 2026-05-28 UTC-6
// locus-backlog-item.js
// Última actualización: 2026-05-24 | Renderizado de ítems individuales del backlog
// Responsabilidad: Renderizado de ítems individuales — Kanban, buildBacklogItem, promoción, merge desde TRACKER-GLOBAL.
//   showMergeDiffPanel + modales de confirmación migrados a locus-backlog-merge.js (R-202605-033)
// Dependencias: locus-backlog-core.js · locus-backlog-sprints.js · locus-item-editor.js · locus-toast.js

function _renderKanban(listEl) {
  // R-202604-091: 3 columnas — 'en curso' eliminado, ítems activos decorados en 'pendiente'
  const COLS = [
    { id: 'pendiente',  label: 'Pendiente',  status: 'pendiente',  colorVar: 'var(--text2)',  accentColor: 'rgba(124,106,247,0.4)' },
    { id: 'done',       label: 'Hecho',        status: 'done',       colorVar: '#2ecc78',       accentColor: 'rgba(46,204,120,0.4)' },
    { id: 'descartado', label: 'Descartado',  status: 'descartado', colorVar: 'var(--hint)',   accentColor: 'rgba(120,120,120,0.3)' }
  ];

  // Mapeo de status normalizados para compatibilidad
  function _kanbanStatus(item) {
    // R-202604-091: 'en curso' → 'pendiente'
    const s = item.status;
    if (s === 'in-progress' || s === 'en progreso' || s === 'progreso' || s === 'en curso') return 'pendiente';
    return s; // pendiente | done | descartado
  }

  // Filtrar aplicando los mismos filtros activos del backlog
  const q = backlogSearchQuery;
  let allFiltered = ITEMS.filter(i => {
    const type = itemType(i.code);
    const typeOk = type ? activeTypes.has(type) : true;
    const _rawEffortK = parseInt(i.effort) || 1;
    const _normEffortK = _rawEffortK > 3 ? 3 : _rawEffortK < 1 ? 1 : _rawEffortK;
    const effortOk = activeEfforts.has(_normEffortK); // B-202605-233: effort >3 normalizado a 3
    let roleOk = true;
    if (activeRoleFilter === '__none__') roleOk = !i.role || !i.role.trim();
    else if (activeRoleFilter !== null) roleOk = (i.role || '').trim() === activeRoleFilter;
    return typeOk && effortOk && roleOk && i.status !== 'historico'; // B-202605-266
  });
  if (q) {
    allFiltered = allFiltered.filter(i =>
      i.code.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      (i.area || '').toLowerCase().includes(q)
    );
  }

  // Agrupar por columna
  const byCol = {};
  COLS.forEach(c => { byCol[c.id] = []; });
  allFiltered.forEach(item => {
    const cs = _kanbanStatus(item);
    if (byCol[cs]) byCol[cs].push(item);
    else byCol['pendiente'].push(item); // fallback
  });

  // Construir card Kanban (compacta: código + tipo + título + sprint + effort)
  function _kanbanCard(item) {
    const type = itemType(item.code) || '';
    const typeColors = { T:'#2ecc78', R:'#38bdf8', B:'#e85555', P:'#7c6af7' };
    const typeColor = typeColors[type] || 'var(--hint)';
    const effortN = parseInt(item.effort) || 0;
    const dots = Array.from({length:3}, (_,i) =>
      `<span class="kb-effort-dot${i < effortN ? ' on' : ''}"></span>`
    ).join('');
    const sprintBadge = item.sprint ? `<span class="kb-card-sprint">${esc(item.sprint)}</span>` : '';
    const prioBadge = (!item.status || item.status === 'pendiente') && item.priority && item.priority !== 'medium'
      ? `<span class="kb-card-prio kb-prio-${item.priority}">${badgeLabel(item.priority)}</span>` : '';
    const kbIsActive = _isActiveRecently(item);
    // T-202605-449: tratamiento visual Kanban para ítems bloqueados por dependencia
    const kbIsDepBlocked = _hasDepsBlocked(item);
    const kbDepBadge = kbIsDepBlocked ? '<span class="kb-dep-blocked-badge" title="Tiene dependencias pendientes">🔒</span>' : '';
    return `<div class="kb-card${kbIsActive ? ' kb-card--active' : ''}${kbIsDepBlocked ? ' kb-card--dep-blocked' : ''}" data-code="${esc(item.code)}" data-status="${esc(item.status)}"
        style="--kb-type-color:${typeColor}"
        draggable="true"
        ondragstart="event.dataTransfer.setData('text/plain','${esc(item.code)}');this.classList.add('kanban-card--dragging')"
        ondragend="this.classList.remove('kanban-card--dragging')"
        onclick="_kbCardClick(event,'${esc(item.code)}')">
      <div class="kb-card-header">
        <span class="kb-card-type">${type}</span>
        <span class="kb-card-code">${esc(item.code)}</span>
        <div class="kb-card-header-right">${kbDepBadge}${kbIsActive ? '<span class="kb-activity-dot" title="Actividad reciente"></span>' : ''}${prioBadge}</div>
      </div>
      <div class="kb-card-title">${esc(item.title)}</div>
      <div class="kb-card-footer">
        ${sprintBadge}
        <div class="kb-effort-dots">${dots}</div>
        ${item.area ? `<span class="kb-card-area">${esc(item.area)}</span>` : ''}
      </div>
    </div>`;
  }

  // Construir HTML de columnas
  let html = '<div class="kb-board">';
  COLS.forEach(col => {
    const colItems = byCol[col.id];
    html += `<div class="kb-col" id="kb-col-${col.id}"
        data-col-status="${col.id}"
        ondragover="event.preventDefault();this.classList.add('kb-col-dragover')"
        ondragleave="this.classList.remove('kb-col-dragover')"
        ondrop="_kbDrop(event,'${col.id}')">
      <div class="kb-col-header" style="--col-accent:${col.accentColor}">
        <span class="kb-col-title">${col.label}</span>
        <span class="kb-col-count">${colItems.length}</span>
      </div>
      <div class="kb-col-body" id="kb-body-${col.id}">
        ${colItems.length ? colItems.map(_kanbanCard).join('') : `<div class="kb-col-empty">Sin ítems</div>`}
      </div>
    </div>`;
  });
  html += '</div>';

  listEl.classList.add('kb-active');
  listEl.innerHTML = html;
  _skelHide(listEl);
}

// T-202604-287: handler drop Kanban — reutiliza setItemStatus con lógica de confirmación existente
function _kbDrop(event, toStatus) {
  event.preventDefault();
  const col = event.currentTarget;
  col.classList.remove('kb-col-dragover');
  const code = event.dataTransfer.getData('text/plain');
  if (!code) return;
  // Mapear columna 'progreso' al status real del sistema
  // R-202604-091: solo 3 columnas — 'en-curso' eliminado
  // Se almacena como 'in-progress' en item.status para conservar estado
  // R-202604-091: 'en-curso' eliminado del statusMap
  const statusMap = { pendiente: 'pendiente', done: 'done', descartado: 'descartado' };
  const newStatus = statusMap[toStatus] || toStatus;
  setItemStatus(code, newStatus);
}

// T-202604-287: click en card Kanban abre el editor del ítem
function _kbCardClick(event, code) {
  // No abrir si fue un drag (el drag pone clase antes del click)
  if (event.defaultPrevented) return;
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  _openItemEditorSafe(item.id || null, code); // B-202605-012
}

// T-202604-076: DnD para reordenar ítems dentro de grupo sprint (no aplica a done/descartado ni a modo plano)
function _attachBacklogDnD() {
  // B-202605-013: T-202604-424 eliminó 'sprint' como valor de backlogSortMode — guard era inalcanzable.
  // DnD activo cuando la agrupación por sprint está activa y no hay modo exclusivo que tome el rendering.
  if (!_backlogSprintGroupMode || _backlogKanbanMode || _backlogFocusMode || _backlogMikeMode || _backlogNoAcMode) return;
  // Solo grupos sprint: vbody-{groupId} — excluye sgbody-done, sgbody-discarded y vbody-flat
  const sprintBodies = document.querySelectorAll('[id^="vbody-"]:not(#vbody-flat)');
  sprintBodies.forEach(body => {
    const items = body.querySelectorAll('.item[data-code]');
    items.forEach(el => {
      const handle = el.querySelector('.item-drag-handle');
      if (!handle) return; // sin handle = sin sprint = no draggable
      el.draggable = true;
      handle.addEventListener('mousedown', () => { handle.classList.add('cursor-grabbing'); });
      handle.addEventListener('mouseup', () => { handle.classList.remove('cursor-grabbing'); });
      el.addEventListener('dragstart', e => {
        // B-202605-013: eliminado guard e.target === handle — dragstart dispara en el (.item), no en el handle
        // La activación ya está acotada: solo ítems con .item-drag-handle llegan aquí (guard L3650)
        e.dataTransfer.setData('text/plain', el.dataset.code);
        el.classList.add('item-dragging');
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('item-dragging');
        handle.classList.remove('cursor-grabbing');
      });
      el.addEventListener('dragover', e => {
        e.preventDefault();
        el.classList.add('item-drag-over');
      });
      el.addEventListener('dragleave', () => {
        el.classList.remove('item-drag-over');
      });
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('item-drag-over');
        const fromCode = e.dataTransfer.getData('text/plain');
        const toCode = el.dataset.code;
        if (!fromCode || fromCode === toCode) return;
        const fromIdx = ITEMS.findIndex(i => i.code === fromCode);
        const toIdx   = ITEMS.findIndex(i => i.code === toCode);
        if (fromIdx < 0 || toIdx < 0) return;
        if ((ITEMS[fromIdx].sprint || '') !== (ITEMS[toIdx].sprint || '')) return;
        const [moved] = ITEMS.splice(fromIdx, 1);
        ITEMS.splice(toIdx, 0, moved);
        _undoSnapshot();
        saveBacklog();
        if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList();
      });
    });
  });
}

// T-202604-074: edición inline de título con doble click
function _inlineEditTitle(code, e) {
  e.stopPropagation(); // evitar toggleItemExpand
  const span = e.currentTarget;
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  const originalTitle = item.title;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'item-title-edit-input';
  input.value = originalTitle;

  span.replaceWith(input);
  input.focus();
  input.select();

  function _commit() {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== originalTitle) {
      item.title = newTitle;
      _undoSnapshot();
      saveBacklog();
    }
    if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList();
  }

  function _cancel() {
    if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList();
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); _commit(); }
    if (e.key === 'Escape') { e.preventDefault(); _cancel(); }
    e.stopPropagation();
  });
  input.addEventListener('blur', _commit);
  input.addEventListener('click', e => e.stopPropagation());
}

// T-202604-048: construir mini progress-bar de hijos para R
// T-202604-187/188: _buildChildrenBlock con colapsable y progreso
function _buildChildrenBlock(rCode) {
  // B-202604-158: respetar filtros activos — solo mostrar hijos que pasan tipo y status
  const allChildren = ITEMS.filter(i => i.parentId === rCode);
  if (!allChildren.length) return '';
  const children = allChildren.filter(i => {
    const t = itemType(i.code);
    const typeOk = t ? activeTypes.has(t) : true;
    const statusOk = activeStatuses.has(i.status);
    return typeOk && statusOk;
  });
  if (!children.length) return '';
  const doneCount = children.filter(i => i.status === 'done').length;
  const pct = Math.round((doneCount / children.length) * 100);
  const isCollapsed = _collapsedChildren.has(rCode);

  const childRows = children.map(child => {
    // B-202605-011: IDs de DOM desde item.code — estables ante mutaciones de ITEMS
    const cSafeId = child.code.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cType = itemType(child.code) || '';
    const isDoneC = child.status === 'done';
    return `<div class="child-item${isDoneC ? ' is-done' : ''}">
      <span class="child-collapse-arrow" id="ciarrow-${cSafeId}" onclick="(function(){var _ci=ITEMS.findIndex(function(x){return x.code==='${esc(child.code)}'});if(_ci>=0)toggleItemExpand(_ci);var a=document.getElementById('ciarrow-${cSafeId}');var b=document.getElementById('ibody-${cSafeId}');if(a&&b)a.textContent=b.classList.contains('open')?'▾':'▸';event.stopPropagation();})()">&#x25B8;</span>
      <span class="item-type-pill ${cType} item-type-pill--sm">${cType}</span>
      <span class="child-title" onclick="(function(){var _ci=ITEMS.findIndex(function(x){return x.code==='${esc(child.code)}'});if(_ci>=0)toggleItemExpand(_ci);var a=document.getElementById('ciarrow-${cSafeId}');var b=document.getElementById('ibody-${cSafeId}');if(a&&b)a.textContent=b.classList.contains('open')?'▾':'▸';})()}">${esc(child.title)}</span>
      <span class="badge ${statusClass(child.status)} badge--sm">${statusLabel(child.status)}</span>
    </div>
    <div class="item-body item-body--child" id="ibody-${cSafeId}">
      <div id="code-badge-${cSafeId}" onclick="copyItemCode(event,'${esc(child.code)}',-1)" title="Click para copiar ID" class="item-code-badge">${esc(child.code)}</div>
      <div class="child-meta-row">
        <span class="badge ${badgeClass(child.priority)} badge--sm">${badgeLabel(child.priority)}</span>
        ${child.area ? `<span class="badge badge-area badge--sm">${esc(child.area)}</span>` : ''}
        ${child.effort ? `<div class="effort-dots effort-dots--inline">${effortDots(child.effort)}</div>` : ''}
      </div>
      ${child.ac && child.ac.length ? `<ul class="ac-list open ac-list--child">${child.ac.map(c => `<li class="ac-list-item--sm">${esc(c)}</li>`).join('')}</ul>` : ''}
      <div class="child-actions">
        <button onclick="event.stopPropagation();_openItemEditorSafe(null,'${esc(child.code)}')" class="btn-ghost btn-ghost--sm" title="Editar ítem">✎ Editar</button>
        <button onclick="event.stopPropagation();_confirmUnlinkChild('${esc(child.code)}','${esc(rCode)}')" class="btn-ghost btn-ghost--sm btn-ghost--muted" title="Desvincular del R padre">⊠ Desvincular</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="r-children-block">
    <div class="r-children-header" onclick="event.stopPropagation();toggleChildrenBlock('${esc(rCode)}')">
      <span class="r-children-tickets-label">Tickets</span>
      <div class="r-children-bar-wrap"><div class="r-children-bar" style="--rch-bar-w:${pct}%"></div></div>
      <span class="r-children-label">${doneCount}/${children.length} · ${pct}%</span>
      <span id="rchildren-arrow-${esc(rCode)}" class="r-children-arrow">${isCollapsed ? '▸' : '▾'}</span>
    </div>
    <div class="r-children-list${isCollapsed ? ' collapsed' : ''}" id="rchildren-body-${esc(rCode)}">${childRows}</div>
  </div>`;
}

// T-202604-004: desvincular child de R padre con confirmación
function _confirmUnlinkChild(childCode, rCode) {
  _gconfirmOpen({
    title: 'Desvincular ítem',
    msg: `¿Desvincular ${childCode} de ${rCode}? El ítem quedará sin padre.`,
    okLabel: 'Desvincular',
    danger: true
  }, () => {
    const item = ITEMS.find(i => i.code === childCode);
    if (item) { item.parentId = null; saveBacklog(); if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList(); renderStats(); showToast('success', `${childCode} desvinculado`); }
  });
}

// T-202604-028: timestamps legibles para item-body
function _buildItemTimestamps(item) {
  const _fmt = ts => {
    if (!ts) return null;
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays/7)} sem.`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays/30)} mes${Math.floor(diffDays/30)>1?'es':''}`;
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  };
  const _iso = ts => ts ? new Date(ts).toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' }) : '';
  const rows = [];
  if (item.createdAt) rows.push(`<span title="${_iso(item.createdAt)}">📅 Creado: <strong>${_fmt(item.createdAt)}</strong></span>`);
  if (item.statusChangedAt) rows.push(`<span title="${_iso(item.statusChangedAt)}">🔄 Último cambio: <strong>${_fmt(item.statusChangedAt)}</strong></span>`);
  if (item.doneAt) rows.push(`<span title="${_iso(item.doneAt)}">✅ Completado: <strong>${_fmt(item.doneAt)}</strong></span>`);
  if (!rows.length) return '';
  return `<div class="bitem-timestamps">${rows.join('')}</div>`;
}

// R-[pendiente-ID]: bloque de origen P padre — muestra enlace al P que originó este ítem
function _buildItemPOriginBlock(item) {
  if (!item.origin) return '';
  const pItem = ITEMS.find(i => i.code === item.origin);
  const pTitle = pItem ? esc(pItem.title) : '';
  return `<div class="bitem-origin-p-block">
    <span class="bitem-origin-p-label">Origen</span>
    <button class="bitem-origin-p-link" onclick="event.stopPropagation();navigateToItem('${esc(item.origin)}')" title="${pTitle}">${esc(item.origin)}</button>
    ${pTitle ? `<span class="bitem-origin-p-name" title="${pTitle}">${pTitle}</span>` : ''}
  </div>`;
}

// T-202604-NNN: bloque de origen — IA, sesión y archivos relacionados del ítem
function _buildItemOriginBlock(item) {
  if (!item.sessionId) return '';

  // getAllSessions() retorna sesiones planas con s.aiId — no {sess,ai} pairs
  const allSessions = typeof getAllSessions === 'function' ? getAllSessions() : [];
  const foundSess = allSessions.find(s => s && s.id === item.sessionId);
  if (!foundSess) return '';

  const foundAi = typeof getAI === 'function' ? getAI(foundSess.aiId) : null;

  const aiName = foundAi ? esc(foundAi.name || foundAi.id) : '—';
  const aiAvatar = (foundAi && foundAi.avatar) ? `<span class="bitem-origin-avatar">${foundAi.avatar}</span>` : '';

  // Fecha de sesión
  const _fmtSessDate = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  };
  const sessDate = foundSess.date ? esc(foundSess.date) : _fmtSessDate(foundSess.savedAt || foundSess.createdAt);
  const sessTitle = foundSess.title ? esc(foundSess.title) : '';
  const sessLabel = sessTitle ? `${sessTitle}${sessDate ? ' · ' + sessDate : ''}` : (sessDate || foundSess.id);

  // Archivos relacionados — sess.files es string (texto libre del paste), convertir a array
  const _filesRaw = foundSess.files || foundSess.archivos || '';
  const files = Array.isArray(_filesRaw)
    ? _filesRaw.filter(Boolean)
    : _filesRaw.split(/[\n,]+/).map(f => f.trim()).filter(Boolean);
  const filesHtml = files.length
    ? `<div class="bitem-origin-row bitem-origin-row--files">
        <span class="bitem-origin-label">Archivos</span>
        <div class="bitem-origin-files">
          ${files.map(f => `<span class="bitem-origin-file-pill" title="${esc(f)}">${esc(f)}</span>`).join('')}
        </div>
       </div>`
    : '';

  return `<div class="bitem-origin-block">
    <div class="bitem-origin-row">
      <span class="bitem-origin-label">IA</span>
      <span class="bitem-origin-value">${aiAvatar}${aiName}</span>
    </div>
    <div class="bitem-origin-row bitem-origin-row--mt">
      <span class="bitem-origin-label">Sesión</span>
      <span class="bitem-origin-value" title="${esc(foundSess.id || '')}">${sessLabel}</span>
    </div>
    ${filesHtml}
  </div>`;
}

// R-202605-010: status chip popover — un solo popover activo a la vez
let _statusPopoverCode = null;
function _openStatusPopover(e, code) {
  e.stopPropagation();
  // Cerrar popover previo
  const prev = document.getElementById('status-popover');
  if (prev) prev.remove();
  if (_statusPopoverCode === code) { _statusPopoverCode = null; return; }
  _statusPopoverCode = code;

  const item = ITEMS.find(i => i.code === code);
  if (!item) { _statusPopoverCode = null; return; }

  const isIdea = (itemType(code) || '') === 'P';
  const options = [
    { val: 'pendiente', label: 'Pendiente' },
    ...(!isIdea ? [{ val: 'en-revision', label: 'En revisión' }] : []),
    ...(!isIdea ? [{ val: 'done', label: 'Hecho' }] : []),
    { val: 'descartado', label: 'Descartado' }
  ];

  const pop = document.createElement('div');
  pop.id = 'status-popover';
  pop.className = 'bitem-status-popover';
  pop.setAttribute('role', 'menu');
  pop.onclick = e2 => e2.stopPropagation();

  pop.innerHTML = options.map(o =>
    `<button class="bitem-status-popover-btn${item.status === o.val ? ' is-current' : ''}" data-val="${o.val}">${o.label}</button>`
  ).join('');

  pop.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const newVal = btn.dataset.val;
      pop.remove();
      _statusPopoverCode = null;
      if (newVal !== item.status) {
        try {
          setItemStatus(code, newVal);
        } catch(err) {
          showToast('error', 'Error al cambiar status', null, 3000);
          // chip revierte automáticamente tras el re-render de renderBacklogList
        }
      }
    });
  });

  document.body.appendChild(pop);

  // Posicionar bajo el chip trigger
  const trigger = e.currentTarget;
  const rect = trigger.getBoundingClientRect();
  const popW = 120;
  let left = rect.left + window.scrollX;
  if (left + popW > window.innerWidth) left = window.innerWidth - popW - 8;
  pop.style.setProperty('--sp-top', (rect.bottom + window.scrollY + 4) + 'px');
  pop.style.setProperty('--sp-left', left + 'px');

  // Cerrar con Escape
  const _escHandler = ev => {
    if (ev.key === 'Escape') { pop.remove(); _statusPopoverCode = null; document.removeEventListener('keydown', _escHandler); }
  };
  document.addEventListener('keydown', _escHandler);

  // Cerrar al click fuera
  const _outsideHandler = ev => {
    if (!pop.contains(ev.target) && ev.target !== trigger) {
      pop.remove();
      _statusPopoverCode = null;
      document.removeEventListener('click', _outsideHandler, true);
    }
  };
  setTimeout(() => document.addEventListener('click', _outsideHandler, true), 0);
}

// T-108: construir un ítem colapsado
function buildBacklogItem(item) {
  const globalIdx = ITEMS.indexOf(item);
  const isDone = item.status === 'done';
  const isDiscarded = item.status === 'descartado';
  const isHistorico = item.status === 'historico'; // B-202604-193: read-only
  const type = itemType(item.code) || '';
  const typeLabel = TYPE_LABELS[type] || type;
  // R-202605-098: gate único para toda lógica diferenciada de tipo P
  const isIdea = type === 'P';

  // T-202604-050: detectar campos obligatorios faltantes (no aplica a descartados ni a P)
  // R-202605-098: P no tiene effort ni AC obligatorios — son conceptos que emergen al promoverse
  const missingFields = [];
  if (!isDiscarded) {
    if (!isIdea && !item.effort) missingFields.push('effort');
    if (!item.area)   missingFields.push('area');
    if (!isIdea && (!item.ac || !item.ac.length)) missingFields.push('ac');
  }
  // R-202605-122 AC2/AC3: badge 'sin effort' con acción rápida de asignación
  const _missingEffort = !isDiscarded && !isIdea && !item.effort;
  const _effortQuickBadge = _missingEffort
    ? `<span class="badge-missing badge-missing--effort" title="Esfuerzo no declarado — requerido para burndown">⚠ sin effort <button class="badge-effort-quick" onclick="event.stopPropagation();_quickAssignEffort('${esc(item.code || item.id)}')" title="Asignar effort rápidamente">Asignar</button></span>`
    : '';
  const _otherMissing = missingFields.filter(f => f !== 'effort');
  const missingAlert = (_missingEffort || _otherMissing.length)
    ? `<div class="bitem-missing-row">${_effortQuickBadge}${_otherMissing.map(f => `<span class="badge-missing">⚠ falta ${f}</span>`).join(' ')}</div>`
    : '';

  // AC list
  const acHtml = item.ac && item.ac.length
    ? `<div class="bitem-ac-block">
        <div class="bitem-ac-header">
          <span class="bitem-ac-check">✓</span>
          <span class="bitem-ac-count">${item.ac.length} criterio${item.ac.length !== 1 ? 's' : ''}</span>
        </div>
        <ul class="bitem-ac-list open">
          ${item.ac.map(c => `<li><span class="bitem-ac-dot"></span><span>${esc(c)}</span></li>`).join('')}
        </ul>
       </div>`
    : `<div class="bitem-ac-block"><div class="bitem-ac-header bitem-ac-header--empty">Sin criterios de aceptación</div></div>`;

  // Effort dots — large version for header, styled
  const effortN = parseInt(item.effort) || 0;
  const effortDotsHtml = (() => {
    let d = '';
    for (let i = 0; i < 3; i++) d += `<span class="bitem-effort-dot${i < effortN ? ' on' : ''}"></span>`;
    return `<div class="bitem-effort-dots" title="Esfuerzo ${effortN}/3">${d}</div>`;
  })();

  // Priority color
  const prioColors = { high:'#e85555', medium:'#f59e0b', low:'var(--hint)' };
  const prioColor = prioColors[item.priority] || 'var(--hint)';
  const prioBadgeHtml = (!isDone && !isDiscarded && item.priority)
    ? `<span class="bitem-prio-badge prio-${item.priority}">${badgeLabel(item.priority)}</span>`
    : '';
  // T-202604-199: badge "Sin AC" — solo en pendiente sin criterios
  const noAcBadge = (!isDone && !isDiscarded && item.status === 'pendiente' && (!item.ac || !item.ac.length))
    ? '<span class="badge-missing badge-missing--warning">Sin AC</span>'
    : '';
  // T-202604-261: badge "bloqueado" — pendiente con sprint >14 días sin cambio de status
  const blockedBadge = _isBlocked(item)
    ? '<span class="badge-missing badge-missing--blocked" title="Sin cambio de status en más de 14 días">⛔ bloqueado</span>'
    : '';
  // R-202605-045 · T-202605-083: staleness-pill — punto único de cálculo via _staleness()
  // B-202605-048: omitir pill si item.createdAt es inválido (legacy sin timestamp) — manejado en _staleness()
  const _stalenessData = (!isDone && !isDiscarded) ? _staleness(item) : null;
  const noSessionBadge = _stalenessData
    ? `<span class="staleness-pill staleness--${_stalenessData.modifier}" title="Sin sesión vinculada — ${_stalenessData.days}d desde último cambio de status">${_stalenessData.label}</span>`
    : '';

  // Children count + progreso para R type (T-188)
  // B-202605-052: usar ITEMS sin filtrar como denominador — los filtros activos no afectan el porcentaje
  const childCount = type === 'R' ? ITEMS.filter(i => i.parentId === item.code).length : 0;
  const childDoneCount = type === 'R' ? ITEMS.filter(i => i.parentId === item.code && i.status === 'done').length : 0;
  const childBadge = (type === 'R' && childCount > 0 && !isDone && !isDiscarded)
    ? `<span class="bitem-child-badge" title="${childDoneCount}/${childCount} tickets done">${childDoneCount}/${childCount} <span class="bitem-child-badge-label">tickets</span></span>`
    : '';

  // T-202604-288: badge "Bloqueado por [código]" — blockedBy explícito pendiente
  const blockedByItems = (!isDone && !isDiscarded && item.blockedBy && item.blockedBy.length)
    ? item.blockedBy.filter(c => { const dep = ITEMS.find(i => i.code === c); return !dep || dep.status !== 'done'; })
    : [];
  const blockedByBadge = blockedByItems.length
    ? blockedByItems.map(c =>
        `<span class="badge-missing badge-missing--blocked badge-blocked-by" onclick="event.stopPropagation();openItemPanel('${esc(c)}')" title="Ir al ítem bloqueante">🔒 ${esc(c)}</span>`
      ).join('')
    : '';

  // R-202604-051: badge blocking:true — ítem bloqueante activo
  const blockingBadge = (!isDone && !isDiscarded && item.blocking)
    ? `<span class="badge-blocking" title="Este ítem bloquea a otros — debe resolverse primero">⚠ bloqueante</span>`
    : '';

  // B-202604-194: badge "AC actualizados" — flag de sesión en _acReplacedSet, desaparece al recargar
  const acReplacedBadge = (!isDone && !isDiscarded && _acReplacedSet.has(item.id))
    ? '<span class="badge-ac-replaced" title="Los criterios de aceptación fueron reemplazados en esta sesión via merge">↺ AC</span>'
    : '';

  // R-202604-091: decorador de actividad reciente — sesión vinculada en los últimos 7 días
  const isActive = (!isDone && !isDiscarded) ? _isActiveRecently(item) : false;

  // R-202605-131: badge scope added — ítem añadido durante el sprint activo
  const scopeAddedBadge = (!isDone && !isDiscarded && item.scope_added)
    ? '<span class="badge-scope-added" title="Añadido al sprint después de su apertura">＋ scope</span>'
    : '';

  // Header right slot
  // R-202605-098: para P pendiente — acciones inline en header sin necesidad de expandir
  const _ideaQuickActions = (isIdea && !isDiscarded && !isDone)
    ? `<div class="item-quick-actions">
        <button class="btn-promote" onclick="event.stopPropagation();_promoteItem('${esc(item.code)}')" title="Promover a Ticket o Requerimiento">⬆ Promover</button>
        <button class="btn-discard-idea" onclick="event.stopPropagation();setItemStatus('${esc(item.code)}','descartado')" title="Descartar esta idea">✕ Descartar</button>
       </div>`
    : '';
  // R-202605-010: status chip inline clickeable — solo para ítems pendientes (no P, no done, no descartado)
  const _statusChipHtml = (!isDone && !isDiscarded && !isIdea)
    ? `<button class="bitem-status-chip bitem-status-chip--${esc(item.status || 'pendiente')}" onclick="_openStatusPopover(event,'${esc(item.code)}')" title="Cambiar status" type="button">${statusLabel(item.status || 'pendiente')}</button>`
    : '';
  const headerRight = isDiscarded
    ? `<span class="bitem-discarded-icon">🗑</span>`
    : isDone
      ? `<span class="bitem-done-check">✓</span>`
      : isIdea
        ? `<div class="bitem-header-right">${_ideaQuickActions}</div>`
        : `<div class="bitem-header-right">${_statusChipHtml}${scopeAddedBadge}${noAcBadge}${acReplacedBadge}${blockingBadge}${blockedBadge}${blockedByBadge}${noSessionBadge}${childBadge}${prioBadgeHtml}${effortDotsHtml}</div>`;

  // R-202605-098: subline discard reason diferenciado para P
  // P descartado por promoción → chip con ref; P descartado manual → razón libre
  const _discardReasonHtml = (isDiscarded && item.discardReason)
    ? isIdea && item.discardRef
      ? `<span class="idea-promoted-chip" onclick="event.stopPropagation();navigateToItem('${esc(item.discardRef)}')" title="Ir al ítem promovido">${esc(item.discardRef)}</span>`
      : `<span class="idea-discard-reason">${esc(item.discardReason)}</span>`
    : isDiscarded && !isIdea && item.discardReason
      ? `<span class="bitem-discard-reason">🗑 ${esc(item.discardReason)}${item.discardRef ? ' · ' + esc(item.discardRef) : ''}</span>`
      : '';

  // Subline (area, sprint, discard reason, missing warning)
  const subline = `<div class="bitem-subline">
    ${item.role ? `<span class="bitem-subline-role" title="Rol responsable">${esc(item.role)}</span>` : ''}
    ${item.role && item.area ? `<span class="bitem-subline-sep">·</span>` : ''}
    ${item.area ? `<span class="bitem-subline-area" title="${esc(item.area)}">${esc(item.area)}</span>` : ''}
    ${item.area && (item.sprint || isIdea) ? `<span class="bitem-subline-sep">·</span>` : ''}
    ${item.sprint ? `<span class="bitem-subline-sprint" title="${esc((() => { const _s = getActiveSprints().find(s => s.id === item.sprint); return _s ? (_s.label || item.sprint) : item.sprint; })())}">${esc((() => { const _s = getActiveSprints().find(s => s.id === item.sprint); return _s ? _s.id : item.sprint; })())}</span>` : (isIdea && !isDone && !isDiscarded ? '<span class="bitem-no-sprint" title="Sin sprint asignado">sin sprint</span>' : '')}
    ${_discardReasonHtml}
    ${missingFields.length ? `<span class="bitem-missing-warn" title="Faltan: ${missingFields.join(', ')}">⚠</span>` : ''}
  </div>`;

  // Type block — the dominant visual element
  const typeBlock = type
    ? `<div class="bitem-type-block bitem-type-${type}">
        <span class="bitem-type-letter">${type}</span>
        <span class="bitem-type-label">${typeLabel}</span>
       </div>`
    : '';

  // R-202605-098: isPromoted — P descartado por promoción (tiene discardRef)
  const isPromoted = isIdea && isDiscarded && !!item.discardRef;
  // R-202605-165: .blf-hidden colapsa ítems fuera del Top-10 con transición 150ms ease-out
  const _blfHiddenClass = item._blfHidden ? ' blf-hidden' : '';
  const _blfAriaHidden  = item._blfHidden ? ' aria-hidden="true"' : '';
  return `<div class="item bitem${isDone ? ' is-done' : ''}${isDiscarded ? ' is-discarded' : ''}${isActive ? ' bitem--active' : ''}${isIdea ? ' bitem--idea' : ''}${isPromoted ? ' bitem--promoted' : ''}${_blfHiddenClass}" data-type="${type}" data-code="${esc(item.code)}"${_blfAriaHidden}>
    <div class="item-header bitem-header" onclick="toggleItemExpand(${globalIdx})">
      ${(!isDone && !isDiscarded && item.sprint) ? `<span class="item-drag-handle" title="Arrastrar para reordenar en sprint" ondragstart="event.stopPropagation()" onclick="event.stopPropagation()">⠿</span>` : ''}
      ${isActive ? '<span class="bitem-activity-dot" title="Actividad reciente — sesión vinculada en los últimos 7 días"></span>' : ''}
      ${typeBlock}
      <div class="bitem-title-col">
        <span class="bitem-code" id="code-badge-${globalIdx}" onclick="copyItemCode(event,'${esc(item.code)}',${globalIdx})" title="Click para copiar ID">${item._focusRank ? `<span class="bitem-focus-rank" title="Posición en Focus">#${item._focusRank}</span> ` : ''}${esc(item.code)}</span>
        <span class="bitem-title"${(!isDone && !isDiscarded) ? ` ondblclick="_inlineEditTitle('${esc(item.code)}',event)" title="Doble click para editar título"` : ''}>${esc(item.title)}</span>${isDiscarded && (!item.title || item.title.trim() === item.code) ? '<span class="bitem-ghost-note" title="Ítem sin título — posiblemente generado por un CHECKPOINT malformado">⚠ ítem fantasma — generado por CHECKPOINT malformado</span>' : ''}
        ${subline}
      </div>
      <button id="copy-item-btn-${esc(item.code)}" class="copy-item-btn" onclick="copyItemToClipboard(event,'${esc(item.code)}')" title="Copiar ítem para sesión FS">⎘</button>
      <span class="bitem-collapse-arrow" id="iarrow-${globalIdx}">▸</span>
      ${headerRight}
    </div>
    <div class="item-body bitem-body" id="ibody-${globalIdx}">
      ${item.notes ? `<div class="bitem-notes-block"><span class="bitem-notes-label">Notas</span><span class="bitem-notes-text">${esc(item.notes)}</span></div>` : ''}
      ${_isBlocked(item) ? `<div class="bitem-missing-row"><span class="badge-missing badge-missing--blocked">⛔ bloqueado — sin cambio de status en más de ${_BLOCKED_DAYS} días</span></div>` : ''}
      ${_stalenessData ? `<div class="bitem-missing-row"><span class="staleness-pill staleness--${_stalenessData.modifier}" title="Sin sesión vinculada — ${_stalenessData.days}d desde último cambio de status">${_stalenessData.label} sin sesión</span></div>` : ''}
      ${missingAlert}
      <div class="bitem-meta-grid" onclick="event.stopPropagation()">
        <div class="bitem-meta-cell">
          <span class="bitem-meta-label">Status</span>
          <select class="item-status-select bitem-select" onchange="setItemStatus('${esc(item.code)}',this.value)" onclick="event.stopPropagation()">
            <option value="pendiente"${item.status==='pendiente'?' selected':''}>Pendiente</option>
            ${!isIdea ? `<option value="done"${item.status==='done'?' selected':''}>Hecho</option>` : ''}
            <option value="descartado"${item.status==='descartado'?' selected':''}>Descartado</option>
          </select>
        </div>
        ${item.status === 'done' ? `<div class="bitem-meta-cell"><span class="bitem-meta-label">Versión</span><span class="bitem-meta-value mono">${esc(item.version || 'futura')}</span></div>` : ''}
        ${!isIdea ? `<div class="bitem-meta-cell">
          <span class="bitem-meta-label">Esfuerzo</span>
          <div class="bitem-effort-display">
            ${(() => { let d=''; for(let i=0;i<3;i++) d+=`<span class="bitem-effort-dot-sm${i<effortN?' on':''}"></span>`; return d; })()}
            <span class="bitem-effort-num">${item.effort ? item.effort+'/3' : '<span class="effort-missing">—</span>'}</span>
          </div>
        </div>` : ''}
        <div class="bitem-meta-cell">
          <span class="bitem-meta-label">Tipo</span>
          <span class="bitem-meta-value">${typeLabel || '—'}</span>
        </div>
        <div class="bitem-meta-cell" onclick="event.stopPropagation()">
          <span class="bitem-meta-label">Rol</span>
          <select class="item-status-select bitem-select" onchange="setItemRole('${esc(item.code)}',this.value)" class="bitem-select-role">
            <option value="">— Sin rol —</option>
            ${_ECOSYSTEM_ROLES.map(r => `<option value="${esc(r)}"${(item.role||'')=== r?' selected':''}>${esc(r)}</option>`).join('')}
          </select>
        </div>
        <div class="bitem-meta-cell" onclick="event.stopPropagation()">
          <span class="bitem-meta-label">Sprint</span>
          <div id="sprint-select-wrap-${esc(item.code)}">
            <select class="item-status-select bitem-select" onchange="setItemSprint('${esc(item.code)}',this.value)">
              <option value="">— Sin asignar</option>
              ${getActiveSprints().filter(s=>s.status!=='closed').map(s=>`<option value="${esc(s.id)}"${item.sprint===s.id?' selected':''}>${esc(s.label||s.id)}${s.status==='active'?' ★':''}</option>`).join('')}
              ${item.sprint && !getActiveSprints().find(s=>s.id===item.sprint) ? `<option value="${esc(item.sprint)}" selected>${esc(item.sprint)}</option>` : ''}
              <option value="__new__">＋ Nuevo sprint...</option>
            </select>
          </div>
        </div>
        ${(type === 'T' || type === 'B') ? (() => {
          // T-202604-354: solo R pendientes, orden descendente por código, label ID · Título truncado 60 chars
          const rItems = ITEMS
            .filter(i => itemType(i.code) === 'R' && i.status === 'pendiente')
            .sort((a, b) => b.code.localeCompare(a.code));
          const _rLabel = r => { const t = r.title || ''; return r.code + ' · ' + (t.length > 60 ? t.slice(0, 57) + '…' : t); };
          const currentParent = item.parentId ? ITEMS.find(i => i.code === item.parentId) : null;
          const ghostOption = (currentParent && !rItems.find(r => r.code === item.parentId))
            ? '<option value="' + esc(currentParent.code) + '" selected>' + esc(_rLabel(currentParent)) + ' [' + esc(currentParent.status) + ']</option>'
            : '';
          return '<div class="bitem-meta-cell" onclick="event.stopPropagation()">'
            + '<span class="bitem-meta-label">R padre</span>'
            + '<select class="item-status-select bitem-select" onchange="setItemParent(\'' + esc(item.code) + '\',this.value)">'
            + '<option value="">— Sin padre</option>'
            + ghostOption
            + rItems.map(r => '<option value="' + esc(r.code) + '"' + (item.parentId === r.code ? ' selected' : '') + '>' + esc(_rLabel(r)) + '</option>').join('')
            + '</select></div>';
        })() : ''}
      </div>
      ${isIdea ? '' : acHtml}
      ${(() => {
        // R-202604-074: AC Vivo — solo en pendientes con sprint; R-202605-098: nunca en P
        if (isIdea || isDone || isDiscarded || !item.sprint) return '';
        // Sin AC definidos — mensaje + CTA
        if (!item.ac || !item.ac.length) {
          const _emptyId = `acv-panel-empty-${globalIdx}`;
          return `<div class="acv-wrap acv-wrap--empty" id="${_emptyId}">
            <button class="acv-toggle" onclick="event.stopPropagation();_acvToggle('${_emptyId}')" title="Revisión de AC">
              <span class="acv-toggle-arrow">▸</span> Revisión de AC
            </button>
            <div class="acv-body acv-body--hidden">
              <p class="acv-empty-msg">Este ítem no tiene AC — agrega criterios antes de implementar.</p>
              <button class="acv-confirm-btn" onclick="event.stopPropagation();_openItemEditorSafe(null,'${esc(item.code)}')" title="Abrir editor de ítem">✎ Ir a Item Editor</button>
            </div>
          </div>`;
        }
        // Revisar si ya fue confirmado recientemente (< 48h)
        const _acRev = item.acReviewed;
        const _reviewed = _acRev && (Date.now() - _acRev) < 48 * 60 * 60 * 1000;
        // Parser heurístico de ambigüedad
        const _ambigTerms = [
          { re: /tiempo real/i,        desc: '"tiempo real" — define frecuencia o evento exacto' },
          { re: /correctamente/i,      desc: '"correctamente" — sin criterio explícito de corrección' },
          { re: /adecuadamente/i,      desc: '"adecuadamente" — ambiguo sin referencia' },
          { re: /\bfunciona\b/i,       desc: '"funciona" — define qué resultado es válido' },
          { re: /visible\b(?!.*\bcon\b.*\bcontraste\b)/i, desc: '"visible" — sin criterio explícito (contraste, posición, tamaño)' },
          { re: /sin regresi[oó]n(?!\s+en\s+\S)/i, desc: '"sin regresión" — scope no definido' },
        ];
        const _classify = (ac) => {
          if (/click|button|tab|badge|color|layout|css|px|rem|visible|muestra|aparece|oculta/i.test(ac)) return { cls: 'visual', label: 'visual' };
          if (/guarda|persiste|localStorage|storage|calcula|retorna|devuelve|valor/i.test(ac)) return { cls: 'datos', label: 'datos' };
          return { cls: 'funcional', label: 'funcional' };
        };
        const _acRows = item.ac.map((c, ci) => {
          const ambig = _ambigTerms.find(t => t.re.test(c));
          const cat   = _classify(c);
          const rowId = `acv-row-${globalIdx}-${ci}`;
          if (ambig) {
            return `<li class="acv-row acv-row--warn" id="${rowId}">
              <span class="acv-badge acv-badge--warn" title="${esc(ambig.desc)}">⚠</span>
              <span class="acv-text">${esc(c)}</span>
              <button class="acv-clarify-btn" onclick="event.stopPropagation();_acvStartEdit('${rowId}','${esc(item.code)}',${ci})" title="Aclarar este AC">Aclarar</button>
            </li>`;
          }
          return `<li class="acv-row acv-row--ok" id="${rowId}">
            <span class="acv-badge acv-badge--ok acv-badge--${cat.cls}" title="${cat.label}">✓</span>
            <span class="acv-text">${esc(c)}</span>
          </li>`;
        }).join('');
        const _panelId  = `acv-panel-${globalIdx}`;
        const _revClass = _reviewed ? ' acv-reviewed' : '';
        return `<div class="acv-wrap${_revClass}" id="${_panelId}">
          <button class="acv-toggle" onclick="event.stopPropagation();_acvToggle('${_panelId}')" title="Revisión de AC">
            <span class="acv-toggle-arrow">▸</span> Revisión de AC
          </button>
          <div class="acv-body acv-body--hidden">
            <ul class="acv-list">${_acRows}</ul>
            <button class="acv-confirm-btn" onclick="event.stopPropagation();_acvConfirm('${esc(item.code)}','${_panelId}')" title="Marcar revisión como completada">✓ Confirmar y proceder</button>
          </div>
        </div>`;
      })()}
      ${buildItemRefs(item.code)}
      ${type === 'R' ? _buildChildrenBlock(item.code) : ''}
      ${_buildItemTimestamps(item)}
      ${_buildItemOriginBlock(item)}
      ${item.origin ? _buildItemPOriginBlock(item) : ''}
      ${item.migratedFrom ? _buildItemMigratedBlock(item) : ''}
      ${_buildItemMentionedIn(item)}
      <div class="bitem-footer">
        ${isHistorico ? '' : `<button onclick="_openItemEditorSafe(null,'${esc(item.code)}')" class="bitem-edit-btn" title="Editar ítem">✎ Editar</button>`}
        ${(!isHistorico && isIdea && !isDone && !isDiscarded) ? `<button onclick="event.stopPropagation();_promoteItem('${esc(item.code)}')" class="bitem-promote-btn" title="Promover esta posibilidad a Ticket o Requerimiento">⬆ Promover</button>` : ''}
        ${(!isHistorico && type === 'T' && !isDone && !isDiscarded) ? `<button onclick="event.stopPropagation();_promoteTtoR('${esc(item.code)}')" class="bitem-promote-btn" title="Promover Ticket a Requerimiento">⬆ → R</button>` : ''}
        ${(!isHistorico && !isDone && !isDiscarded) ? `<button onclick="event.stopPropagation();_openMigrateItem('${esc(item.code)}')" class="bitem-promote-btn" title="Mover item a otro proyecto">&#x21C4; Mover</button>` : ''}
      </div>
    </div>
  </div>`;
}

// R-[pendiente-ID]: Promover ítem P → T o R con trazabilidad de origen
function _promoteItem(code) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  // R-202604-047: shell estático en index.html — inject content + classList
  const overlay = document.getElementById('promote-modal-overlay');
  if (!overlay) return;
  const body = document.getElementById('promote-modal-body');
  if (body) {
    body.innerHTML = `
      <div class="promote-modal-title" id="promote-modal-title-el">⬆ Promover idea</div>
      <div class="promote-modal-sub">${esc(code)} · ${esc(item.title)}</div>
      <div class="promote-modal-desc">¿A qué tipo quieres promover esta idea?</div>
      <div class="promote-type-btns">
        <button class="promote-type-btn" id="promote-btn-T" onclick="_promoteSelectType('T')">
          <div class="promote-type-letter">T</div>
          <div class="promote-type-name">Ticket</div>
          <div class="promote-type-hint">Tarea técnica concreta</div>
        </button>
        <button class="promote-type-btn" id="promote-btn-R" onclick="_promoteSelectType('R')">
          <div class="promote-type-letter">R</div>
          <div class="promote-type-name">Requerimiento</div>
          <div class="promote-type-hint">Feature o épica con tickets</div>
        </button>
      </div>
      <div class="promote-modal-actions">
        <button onclick="document.getElementById('promote-modal-overlay').classList.remove('open')" class="btn-cancel">Cancelar</button>
        <button id="promote-confirm-btn" onclick="_promoteConfirm('${esc(code)}')" class="btn-primary" disabled>Promover</button>
      </div>`;
  }
  _promoteTargetType = null;
  overlay.classList.add('open');
  // AC: foco inicial en primer botón de tipo (flujo P)
  requestAnimationFrame(() => {
    const first = overlay.querySelector('.promote-type-btn');
    if (first) first.focus();
  });
}

let _promoteTargetType = null;

function _promoteSelectType(type) {
  _promoteTargetType = type;
  ['T', 'R'].forEach(t => {
    const btn = document.getElementById('promote-btn-' + t);
    if (btn) btn.classList.toggle('selected', t === type);
  });
  const confirmBtn = document.getElementById('promote-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = false;
}

function _promoteConfirm(originCode) {
  if (!_promoteTargetType) return;
  const originItem = ITEMS.find(i => i.code === originCode);
  if (!originItem) return;

  const newCode = _getNextItemCode(_promoteTargetType);
  const nowTs = Date.now();

  // Crear ítem hijo con campos heredados + origin
  // R-202605-098: ítem hijo nace sin esfuerzo — el campo no se hereda del P original
  ITEMS.push({
    id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2, 6),
    code: newCode,
    title: originItem.title,
    desc: originItem.desc || '',
    priority: originItem.priority || 'medium',
    area: originItem.area || '',
    effort: null,
    impact: originItem.impact || 'Medio',
    status: 'pendiente',
    version: 'futura',
    sprint: (originItem.sprint && originItem.sprint.trim() !== 'n/a') ? originItem.sprint : '',
    ac: originItem.ac ? [...originItem.ac] : [],
    origin: originCode,
    sessionId: null,
    createdAt: nowTs,
    statusChangedAt: nowTs,
    doneAt: null
  });

  // R-202605-098: P padre → descartado automático con discardReason trazable
  // No requiere acción manual del founder
  originItem.status = 'descartado';
  originItem.statusChangedAt = nowTs;
  originItem.discardReason = 'promovido a ' + _promoteTargetType + ' ' + newCode;
  originItem.discardRef = newCode; // ref al ítem hijo — habilita bitem--promoted chip

  _blogLog('promovido', originCode, originCode + ' → ' + newCode, 'backlog');
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();

  const _pmo = document.getElementById('promote-modal-overlay');
  if (_pmo) _pmo.classList.remove('open');
  _promoteTargetType = null;

  if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList(() => navigateToItem(newCode));
  renderStats();
  showToast('success', `⬆ ${originCode} promovido → ${newCode}`);
}

// T-202604-236: Promover T → R desde Backlog UI
function _promoteTtoR(code) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  // AC-5: solo en T pendiente o progreso
  if (item.status === 'done' || item.status === 'descartado') return;

  // R-202604-047: shell estático en index.html — inject content + classList
  // DUP-02: usa shell unificado #promote-modal-overlay
  const overlay = document.getElementById('promote-modal-overlay');
  if (!overlay) return;
  const body = document.getElementById('promote-modal-body');
  if (body) {
    body.innerHTML = `
      <div class="promote-modal-title" id="promote-modal-title-el">⬆ Promover Ticket a Requerimiento</div>
      <div class="promote-modal-sub">${esc(code)} · ${esc(item.title)}</div>
      <div class="promote-modal-info">
        Se creará un <strong>R</strong> heredando los campos del T.<br>
        El T origen quedará <strong>descartado</strong> con referencia al R nuevo.
      </div>
      <div class="promote-modal-actions">
        <button onclick="document.getElementById('promote-modal-overlay').classList.remove('open')"
          class="btn-ghost">Cancelar</button>
        <button onclick="_promoteTtoRConfirm('${esc(code)}')" class="btn-primary" id="promote-ttor-confirm-btn">⬆ Promover</button>
      </div>`;
  }
  overlay.classList.add('open');
  // AC: foco inicial en botón confirmar (flujo T — sin selector de tipo)
  requestAnimationFrame(() => {
    const confirmBtn = overlay.querySelector('#promote-ttor-confirm-btn');
    if (confirmBtn) confirmBtn.focus();
  });
}

function _promoteTtoRConfirm(originCode) {
  const originItem = ITEMS.find(i => i.code === originCode);
  if (!originItem) return;

  const newCode = _getNextItemCode('R');
  const nowTs = Date.now();

  // AC-2: R hereda desc · area · sprint · tags del T origen
  // AC-4: origin del R apunta al T
  ITEMS.push({
    id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2, 6),
    code: newCode,
    title: originItem.title,
    desc: originItem.desc || '',
    priority: originItem.priority || 'medium',
    area: originItem.area || '',
    effort: originItem.effort || 1,
    impact: originItem.impact || 'Medio',
    status: 'pendiente',
    version: 'futura',
    sprint: (originItem.sprint && originItem.sprint.trim() !== 'n/a') ? originItem.sprint : '',
    tags: originItem.tags ? [...originItem.tags] : [],
    ac: [],
    origin: originCode,
    sessionId: null,
    createdAt: nowTs,
    statusChangedAt: nowTs,
    doneAt: null
  });

  // AC-3: T origen → descartado con reason:reemplazado + ref al R nuevo
  originItem.status = 'descartado';
  originItem.statusChangedAt = nowTs;
  originItem.discardReason = 'reemplazado';
  originItem.discardRef = newCode;

  _blogLog('promovido-a-r', originCode, originCode + ' → ' + newCode, 'backlog');
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();

  const overlay = document.getElementById('promote-modal-overlay'); // DUP-02: shell unificado
  if (overlay) overlay.classList.remove('open');

  if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList(() => navigateToItem(newCode));
  renderStats();
  showToast('success', `⬆ ${originCode} promovido → ${newCode}`);
}

function copyItemCode(e, code, idx) {
  e.stopPropagation();
  navigator.clipboard.writeText(code).then(() => {
    const el = document.getElementById('code-badge-' + idx);
    if (!el) return;
    const prevText = el.textContent;
    el.classList.add('code-badge--copied');
    el.textContent = '✓ copiado';
    setTimeout(() => {
      el.classList.remove('code-badge--copied');
      el.textContent = prevText;
    }, 1500);
  }).catch(() => {
    // fallback silencioso
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.className = 'clipboard-ghost';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// T-202604-178: copia ítem formateado para sesión FS
function copyItemToClipboard(e, code) {
  e.stopPropagation();
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  const lines = [];

  // Línea 1: código + título
  lines.push(`[${item.code}] ${item.title || ''}`);

  // Línea 2: campos de contexto
  const meta = [`Status: ${item.status || 'pendiente'}`];
  if (item.effort) meta.push(`Effort: ${item.effort}`);
  if (item.area)   meta.push(`Area: ${item.area}`);
  if (item.sprint) meta.push(`Sprint: ${item.sprint}`);
  lines.push(meta.join(' | '));

  // AC
  if (item.ac && item.ac.length) {
    lines.push('');
    lines.push('AC:');
    item.ac.forEach(c => lines.push(`- ${c}`));
  }

  // Notas (desc)
  if (item.desc && item.desc.trim()) {
    lines.push('');
    lines.push(`Notas: ${item.desc.trim()}`);
  }

  // Tags (si el ítem los tiene)
  if (item.tags && item.tags.length) {
    const tagNames = item.tags.map(tid => {
      const t = (state.tags || []).find(t => t.id === tid);
      return t ? t.name : tid;
    });
    lines.push(`Tags: ${tagNames.join(', ')}`);
  }

  const text = lines.join('\n');
  const btnId = `copy-item-btn-${code}`;

  const _feedback = () => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.textContent = '✓';
    btn.classList.add('copy-item-btn--done');
    setTimeout(() => {
      btn.textContent = '⎘';
      btn.classList.remove('copy-item-btn--done');
    }, 1500);
  };

  navigator.clipboard.writeText(text).then(_feedback).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.className = 'clipboard-ghost';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    _feedback();
  });
}

function toggleAc(idx) {
  const list = document.getElementById(`ac-list-${idx}`);
  const arrow = document.getElementById(`ac-arrow-${idx}`);
  if (!list) return;
  list.classList.toggle('open');
  arrow.textContent = list.classList.contains('open') ? '▾' : '▸';
}

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('.f-' + f);
  if (btn) btn.classList.add('active');
  if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList();
}

function onBacklogSearch() {
  const input = document.getElementById('backlog-search-input');
  backlogSearchQuery = (input ? input.value : '').toLowerCase().trim();
  const clearBtn = document.getElementById('backlog-search-clear');
  if (clearBtn) clearBtn.classList.toggle('visible', !!backlogSearchQuery);
  updateClearFilterBtn();
  if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList();
  renderStats(); // B-202605-205: actualizar contadores de tipo con búsqueda activa
}

function clearBacklogSearch() {
  const input = document.getElementById('backlog-search-input');
  if (input) input.value = '';
  backlogSearchQuery = '';
  const clearBtn = document.getElementById('backlog-search-clear');
  if (clearBtn) clearBtn.classList.remove('visible');
  updateClearFilterBtn();
  if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList();
  renderStats(); // B-202605-205: restaurar contadores al limpiar búsqueda
}

function updateBacklogFooter() {
  // T-202604-360: footer fijo colapsable — dos filas: info + filtros accionables
  const footer = document.getElementById('backlog-footer');
  if (!footer) return;

  const d = new Date().toISOString().split('T')[0];
  const closedSprintIds = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  const countable = ITEMS.filter(i => _isCountableItem(i) && !i.sprint || !closedSprintIds.has(i.sprint));
  const total    = ITEMS.filter(i => _isCountableItem(i)).length;
  const pend     = ITEMS.filter(i => _isCountableItem(i) && i.status === 'pendiente').length;
  const done     = ITEMS.filter(i => _isCountableItem(i) && i.status === 'done').length;
  const pIdeas   = ITEMS.filter(i => itemType(i.code) === 'P' && i.status !== 'descartado').length;
  const byType   = { B: 0, T: 0, R: 0, P: 0 };
  ITEMS.forEach(i => { const t = itemType(i.code); if (t && byType[t] !== undefined) byType[t]++; });
  const activeSp = _getActiveSprint();

  footer.innerHTML = `
    <div class="bl-footer-row bl-footer-row--filters" id="bl-footer-filters">
      <div class="bl-footer-filter-group">
        <span class="bl-filter-label">Tipo</span>
        ${[['B','Bug'],['T','Ticket'],['R','Req'],['P','Pos.']].map(([t,l]) =>
          `<button class="bl-filter-chip bl-fc-type-${t}${activeTypes.has(t) ? ' active' : ''}" onclick="toggleTypeFilter('${t}')" title="${l}">${t} <span>${byType[t]}</span></button>`
        ).join('')}
      </div>
      <div class="bl-footer-filter-group">
        <span class="bl-filter-label">Status</span>
        <button class="bl-filter-chip${activeStatuses.has('pendiente') ? ' active' : ''}" onclick="toggleStatusFilter('pendiente')">Pendiente <span>${pend}</span></button>
        <button class="bl-filter-chip${activeStatuses.has('done') ? ' active' : ''}" onclick="toggleStatusFilter('done')">Done <span>${done}</span></button>
      </div>
      <div class="bl-footer-filter-group">
        <span class="bl-filter-label">Esfuerzo</span>
        ${[1,2,3].map(e => {
          const cnt = ITEMS.filter(i => (parseInt(i.effort)||1) === e).length;
          return `<button class="bl-filter-chip${activeEfforts.has(e) ? ' active' : ''}" onclick="toggleEffortFilter(${e})" title="Effort ${e}">E${e} <span>${cnt}</span></button>`;
        }).join('')}
      </div>
      <button class="bl-footer-clear" onclick="clearAllFilters()" title="Limpiar todos los filtros">✕ Limpiar</button>
    </div>
  `;

  // restaurar estado colapsado si aplica
  if (_blFooterCollapsed) {
    const filtersRow = document.getElementById('bl-footer-filters');
    const toggleBtn  = document.getElementById('bl-footer-toggle');
    if (filtersRow) filtersRow.classList.add('bl-footer-row--hidden');
    if (toggleBtn)  toggleBtn.textContent = '▼';
  }
}

// B-202604-198: Helper — detecta si un code es placeholder (nunca matchear contra backlog)
function _isPlaceholderCode(code) {
  if (!code) return true;
  if (code === '[pendiente-ID]') return true;
  if (/^\[tmp:[a-z0-9_-]+\]$/i.test(code)) return true;
  return false;
}

// B-202604-198: Helper — busca ítem existente cuyo title es similar a un [tmp:slug]
// Retorna { item, score } o null. Solo sugiere — nunca aplica automáticamente.
function _findTmpMatch(tmpCode, desc, existingItems) {
  if (!desc) return null;
  const needle = desc.trim().toLowerCase();
  let best = null, bestScore = 0;
  existingItems.forEach(item => {
    const haystack = (item.title || '').trim().toLowerCase();
    if (!haystack) return;
    // Similitud: palabras en común / total palabras
    const needleWords = needle.split(/\s+/);
    const haystackWords = haystack.split(/\s+/);
    const common = needleWords.filter(w => w.length > 3 && haystackWords.includes(w)).length;
    const score = common / Math.max(needleWords.length, haystackWords.length);
    if (score > 0.5 && score > bestScore) { best = item; bestScore = score; }
  });
  return best ? { item: best, score: bestScore } : null;
}

// B-202605-guardar-sesion: _assignPendingIds — convierte [pendiente-ID] en código real.
// Llamado por mergeBacklogFromTG antes de procesar ítems.
// AC-3: ítems sin type válido se dejan con [pendiente-ID] sin modificar.
// AC-4: ítems con código real pasan sin modificación.
// AC-5: [tmp:slug] pasan sin modificación — tienen su propio flujo (_findTmpMatch).
// B-202605-ids: reservedCodes acumula los códigos asignados en esta pasada para que
// _getNextItemCode no repita el mismo número cuando hay múltiples [pendiente-ID] del
// mismo tipo — los ítems nuevos aún no están en ITEMS en el momento de la asignación.
function _assignPendingIds(tgItems) {
  const validTypes = new Set(['P', 'T', 'R', 'B']);
  const reservedCodes = new Set();
  return tgItems.map(item => {
    if (item.code !== '[pendiente-ID]') return item; // AC-4/5: no es placeholder estándar
    if (!item.type || !validTypes.has(item.type)) return item; // AC-3: type inválido — no asignar
    const newCode = _getNextItemCode(item.type, reservedCodes);
    reservedCodes.add(newCode);
    return { ...item, code: newCode };
  });
}

// ── T-098: Merge TRACKER-GLOBAL → ITEMS en memoria ──
// Llamado desde saveSession(). Acumula múltiples sesiones sin exportar.
// T-202604-121: retorna {created, updated, ignored} para super toast
function mergeBacklogFromTG(tgItems, sessionId, opts) {
  if (!tgItems || !tgItems.length) return { created:[], advanced:[], retroceso:[], discarded:[], updated:[], ignored:[], createdAndClosed:[], tmpSuggestions:[] };
  const _dryRun = !!(opts && opts.dryRun);

  // B-202604-198: Separar placeholders ANTES de _assignPendingIds para preservar su naturaleza.
  // Los placeholders siempre son ítems nuevos — nunca matchean contra el backlog.
  // _assignPendingIds se aplica solo a los que tienen type char válido (P/T/R/B) y código real.
  tgItems = _assignPendingIds(tgItems);

  let changed = false;
  const created = [], advanced = [], retroceso = [], discarded = [], updated = [], ignored = [];
  // B-202604-198: grupo propio para ítems que nacen y cierran en el mismo CHECKPOINT
  const createdAndClosed = [];
  // B-202604-198: sugerencias de match [tmp:slug] → ID real existente (para confirmación del usuario)
  const tmpSuggestions = [];

  // Orden de avance: pendiente < done < descartado (descartado solo vía confirmación)
  const _statusRank = { pendiente: 0, 'en-revision': 0.5, done: 1, descartado: 2 };

  // B-202605-007: snapshot antes de cualquier mutación — incluye cierre automático de P padre
  if (!_dryRun) _undoSnapshot();

  tgItems.forEach(item => {
    if (!item.code) return;
    if (item._invalidType) { ignored.push({ code: item.code || '[sin-código]', reason: 'tipo-invalido', desc: item.title }); return; }
    if (item._duplicate) {
      // B-202605-XXX: ítem duplicado (título matchea existente via _assignPendingIds) —
      // aunque se ignore para status/creación, si trae AC se mergean sobre el existente.
      if (item.ac && item.ac.length && item._existingCode && !_dryRun) {
        const dupExisting = ITEMS.find(i => i.code === item._existingCode);
        if (dupExisting) {
          dupExisting.ac = item.ac;
          _acReplacedSet.add(dupExisting.id);
          if (sessionId && dupExisting.sessionId !== sessionId) dupExisting.sessionId = sessionId;
          if (!dupExisting.history) dupExisting.history = [];
          dupExisting.history.push({ type: 'field', ts: Date.now(), origin: 'checkpoint', sessionId: sessionId || null, data: { field: 'ac', from: null, to: item.ac } });
          changed = true;
        }
      }
      ignored.push({ code: '[pendiente-ID]', reason: 'duplicado', desc: item.title, existingCode: item._existingCode || '' });
      return;
    }

    // B-202604-198: REGLA DE PLACEHOLDER — forzar rama "nuevo" sin intentar match
    // Un [tmp:slug] o [pendiente-ID] NUNCA matchea contra ITEMS existentes.
    // Nota: _assignPendingIds ya habrá convertido [pendiente-ID] con type char real si tiene
    // suficiente info; si no pudo (sin type), sigue siendo placeholder.
    const isPlaceholder = _isPlaceholderCode(item.code);

    // B-202604-198: REGLA DE TMP — detectar si [tmp:slug] corresponde a un ID real existente
    // por similitud de título. Si hay match potencial, registrar sugerencia y NO crear duplicado.
    if (isPlaceholder && /^\[tmp:[a-z0-9_-]+\]$/i.test(item.code)) {
      const tmpMatch = _findTmpMatch(item.code, item.title, ITEMS);
      if (tmpMatch) {
        tmpSuggestions.push({
          tmpCode: item.code,
          desc: item.title,
          suggestedCode: tmpMatch.item.code,
          suggestedTitle: tmpMatch.item.title,
          score: tmpMatch.score
        });
        // No crear duplicado — el usuario confirma el match en el panel
        return;
      }
    }

    // B-202604-198: si es placeholder, saltar directamente a rama "nuevo"
    const existing = isPlaceholder ? null : ITEMS.find(i => i.code === item.code);
    if (existing) {
      // B-202605-XXX: normalizar type si falta — inferir desde prefijo del código
      if (!existing.type && existing.code) {
        const inferredType = existing.code.charAt(0);
        if ('PTRB'.includes(inferredType)) existing.type = inferredType;
      }
      const newStatus = _tgStatusToBacklog(item.status);
      const oldStatus = existing.status || 'pendiente';
      const changes = [];

      // --- Lógica de status ---
      if (!item._noStatus && newStatus && newStatus !== oldStatus) {
        const oldRank = _statusRank[oldStatus] ?? 0;
        const newRank = _statusRank[newStatus] ?? 0;

        if (newStatus === 'descartado') {
          // Descarte: encolar para confirmación — no persistir todavía
          discarded.push({ code: item.code, desc: existing.title, from: oldStatus, reason: item.discardReason || existing.discardReason || '', ref: item.discardRef || existing.discardRef || '' });
          // No tocar existing todavía — se aplica en _confirmDiscard()
        } else if (newRank > oldRank) {
          // Avance: aplicar directo (no en dryRun)
          changes.push({ field: 'status', from: oldStatus, to: newStatus }); // T-202604-414
          if (!_dryRun) {
            existing.status = newStatus;
            existing.statusChangedAt = Date.now();
            if (newStatus === 'done' && !existing.doneAt) existing.doneAt = Date.now();
            _blogLog('ckpt-avance', item.code, oldStatus + ' → ' + newStatus, 'backlog');
            changed = true;
          }
          advanced.push({ code: item.code, desc: existing.title, from: oldStatus, to: newStatus });
        } else if (newRank < oldRank) {
          // Retroceso: encolar para confirmación — no persistir todavía
          retroceso.push({ code: item.code, desc: existing.title, from: oldStatus, to: newStatus });
          // No tocar existing todavía — se aplica en _confirmRetroceso()
        }
        // newRank === oldRank: status idéntico al existente — ignorar silenciosamente (B-202605-086)
      }

      // --- Resto de campos: entrante gana si trae valor (vacíos no degradan) ---
      // T-202604-414: changes es array de {field, from, to} para diff inline en panel
      if (item.title && item.title !== existing.title) { changes.push({ field: 'title', from: existing.title || '—', to: item.title }); if (!_dryRun) { existing.title = item.title; changed = true; } }
      if (item.desc && item.desc !== existing.desc) { changes.push({ field: 'desc', from: existing.desc || '—', to: item.desc }); if (!_dryRun) { existing.desc = item.desc; changed = true; } }
      if (item.effort && item.effort !== existing.effort) { changes.push({ field: 'effort', from: existing.effort || '—', to: item.effort }); if (!_dryRun) { existing.effort = item.effort; changed = true; } }
      if (item.area && item.area !== existing.area) { changes.push({ field: 'area', from: existing.area || '—', to: item.area }); if (!_dryRun) { existing.area = item.area; changed = true; } }
      // B-202605-233: sprint vacío explícito ('' ) mueve ítem a Ideas — antes se ignoraba por falsy
      if (item.sprint !== undefined && item.sprint !== existing.sprint) { changes.push({ field: 'sprint', from: existing.sprint || '—', to: item.sprint }); if (!_dryRun) { existing.sprint = item.sprint; changed = true; } }
      // B-202604-179: ac: reemplaza si entrante trae contenido — no acumula entre CHECKPOINTs
      if (item.ac && item.ac.length) {
        changes.push({ field: 'ac', from: existing.ac || [], to: item.ac });
        if (!_dryRun) { existing.ac = item.ac; _acReplacedSet.add(existing.id); changed = true; }
      }
      // AC-4: role entrante gana si trae valor; si vacío no degrada el existente
      if (item.role && item.role !== existing.role) { changes.push({ field: 'role', from: existing.role || '—', to: item.role }); if (!_dryRun) { existing.role = item.role; changed = true; } }
      // parentId: entrante gana si trae valor; si vacío no degrada el existente
      if (item.parentId && item.parentId !== existing.parentId) { changes.push({ field: 'parentId', from: existing.parentId || '—', to: item.parentId }); if (!_dryRun) { existing.parentId = item.parentId; changed = true; } }
      // origin: entrante gana si trae valor; si vacío no degrada el existente
      if (item.origin && item.origin !== existing.origin) { changes.push({ field: 'origin', from: existing.origin || '—', to: item.origin }); if (!_dryRun) { existing.origin = item.origin; changed = true; } }
      // notes: entrante gana si trae valor; si vacío no degrada el existente
      if (item.notes && item.notes !== existing.notes) { changes.push({ field: 'notes', from: existing.notes || '—', to: item.notes }); if (!_dryRun) { existing.notes = item.notes; changed = true; } }
      // discardReason / discardRef
      if (item.discardReason && item.discardReason !== existing.discardReason) { changes.push({ field: 'discardReason', from: existing.discardReason || '—', to: item.discardReason }); if (!_dryRun) { existing.discardReason = item.discardReason; changed = true; } }
      if (item.discardRef    && item.discardRef    !== existing.discardRef)    { changes.push({ field: 'discardRef',    from: existing.discardRef    || '—', to: item.discardRef    }); if (!_dryRun) { existing.discardRef    = item.discardRef;    changed = true; } }
      // T-202604-288: blockedBy — append con dedup
      if (item.blockedBy && item.blockedBy.length) {
        const existingBB = existing.blockedBy || [];
        const newBB = item.blockedBy.filter(c => !existingBB.includes(c));
        if (newBB.length) { changes.push({ field: 'blockedBy', from: existingBB.join(', ') || '—', to: [...existingBB, ...newBB].join(', ') }); if (!_dryRun) { existing.blockedBy = [...existingBB, ...newBB]; changed = true; } }
      }
      // R-202604-051: blocking
      if (item.blocking === true && !existing.blocking) { changes.push({ field: 'blocking', from: '—', to: 'true' }); if (!_dryRun) { existing.blocking = true; changed = true; } }
      // Estampar sessionId siempre que venga uno (CHECKPOINT más reciente gana)
      if (!_dryRun && sessionId && existing.sessionId !== sessionId) { existing.sessionId = sessionId; changed = true; }

      // T-202604-423: registrar cambios de merge en history[] con origin 'checkpoint'
      // B-202605-241: origin era 'import' — corregido a 'checkpoint' para display correcto en timeline
      if (!_dryRun && changes.length) {
        if (!existing.history) existing.history = [];
        const importTs = Date.now();
        changes.forEach(ch => {
          // status ya se registra en setItemStatus — aquí solo los demás campos
          if (ch.field === 'status') return;
          existing.history.push({
            type: 'field',
            ts: importTs,
            origin: 'checkpoint',
            sessionId: sessionId || null,
            data: { field: ch.field, from: ch.from !== '—' ? ch.from : null, to: ch.to || null }
          });
        });
      }

      if (changes.length) {
        if (!advanced.find(a => a.code === item.code)) {
          // T-202604-414: emitir changes array estructurado + change string para backward compat
          updated.push({ code: item.code, desc: existing.title, changes, change: changes.map(c => c.field).join(' · ') });
        }
      } else if (!advanced.find(a => a.code === item.code) && !retroceso.find(r => r.code === item.code) && !discarded.find(d => d.code === item.code)) {
        // Distinguir: ya tenía ese status (ok) vs no hubo cambio de status porque no llegó uno válido
        const noStatusIncoming = !item.status || _normalizeStatus(item.status) === 'pendiente'; // B-202605-042: comparación canónica — normStatus() retorna 'pendiente', no '📤 Pendiente'
        const alreadyInStatus = newStatus === oldStatus;
        if (alreadyInStatus && !noStatusIncoming) {
          ignored.push({ code: item.code, reason: 'ya-en-status', desc: existing.title, status: oldStatus });
        } else if (noStatusIncoming) {
          ignored.push({ code: item.code, reason: 'sin-status', desc: existing.title });
        } else {
          ignored.push({ code: item.code, reason: 'sin-cambios', desc: existing.title });
        }
      }
    } else {
      // AC-9: ítem nuevo — marcar si no tenía código real
      const isNew = item._wasAssigned;
      const nowTs = Date.now();
      const initialStatus = _tgStatusToBacklog(item.status) || 'pendiente';

      // R-202605-021: resolver parentId para ítems nuevos
      // AC: solo T o B pueden tener parentId — R con parentId → ignorar + DocLog
      // AC: si parentId apunta a T o B existente → ignorar + DocLog
      // AC: si parentId no existe en backlog → ignorar + DocLog
      let _resolvedParentId = null;
      const _incomingType = item.type || (item.code ? item.code.charAt(0) : 'T');
      if (item.parentId) {
        if (_incomingType === 'R') {
          if (typeof _blogLog === 'function') {
            _blogLog('parentId-ignorado', item.code || '', 'parentId ignorado: ítems tipo R no pueden tener padre. parentId recibido: ' + item.parentId, 'backlog');
          }
        } else {
          const _parentCandidate = ITEMS.find(p => p.code === item.parentId);
          if (!_parentCandidate) {
            if (typeof _blogLog === 'function') {
              _blogLog('parentId-ignorado', item.code || '', 'parentId ignorado: código ' + item.parentId + ' no existe en el backlog', 'backlog');
            }
          } else if (_parentCandidate.type !== 'R') {
            if (typeof _blogLog === 'function') {
              _blogLog('parentId-ignorado', item.code || '', 'parentId ignorado: ' + item.parentId + ' es de tipo ' + _parentCandidate.type + ' — solo R puede ser padre', 'backlog');
            }
          } else {
            _resolvedParentId = item.parentId;
          }
        }
      }

      // B-202604-015: heredar sprint del padre si el ítem no trae sprint propio
      const _parentSprint = (!item.sprint && _resolvedParentId)
        ? (ITEMS.find(p => p.code === _resolvedParentId) || {}).sprint || ''
        : '';
      if (!_dryRun) {
        ITEMS.push({
          id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2,6),
          code: item.code,
          type: _incomingType,
          title: item.title || item.code,
          desc: '',
          priority: 'medium',
          area: item.area || '',
          effort: item.effort || 1,
          impact: 'Medio',
          status: initialStatus,
          version: 'futura',
          sprint: item.sprint || _parentSprint,
          ac: item.ac || [],
          role: item.role || '',
          origin: item.origin || null,
          parentId: _resolvedParentId,
          blockedBy: item.blockedBy || [],
          blocking: item.blocking || false,
          sessionId: sessionId || null,
          createdAt: nowTs,
          statusChangedAt: nowTs,
          doneAt: initialStatus === 'done' ? nowTs : null
        });
        _blogLog('ckpt-creado', item.code, item.title || '', 'backlog');
        changed = true;

        // R-[pendiente-ID]: si el nuevo ítem tiene origin → cerrar automáticamente el P padre
        if (item.origin) {
          const pParent = ITEMS.find(p => p.code === item.origin);
          if (pParent && pParent.status !== 'done') {
            pParent.status = 'done';
            pParent.doneAt = pParent.doneAt || nowTs;
            pParent.statusChangedAt = nowTs;
            pParent.discardRef = item.code;
            _blogLog('ckpt-promovido', item.origin, item.origin + ' → ' + item.code, 'backlog');
          }
        }
      }
      // B-202604-198: si el ítem nace con status done en el mismo CHECKPOINT → grupo propio
      const initialStatusForGroup = _tgStatusToBacklog(item.status) || 'pendiente';
      if (initialStatusForGroup === 'done') {
        createdAndClosed.push({ code: item.code, desc: item.title, _wasAssigned: isNew });
      } else {
        created.push({ code: item.code, desc: item.title, _wasAssigned: isNew });
      }
    }
    // Actualizar contadores en backlog-meta (no en dryRun)
    if (!_dryRun) {
      const typeChar = item.code[0];
      if ('PTRB'.includes(typeChar)) {
        const numMatch = item.code.match(/[PTRB]-\d{6}-(\d{3})/);
        if (numMatch) {
          const num = parseInt(numMatch[1]);
          const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
          if (!meta.counters) meta.counters = { P:0, T:0, R:0, B:0 };
          if (num > (meta.counters[typeChar] || 0)) {
            meta.counters[typeChar] = num;
            localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
          }
        }
      }
    }
  });

  if (!_dryRun && changed) {
    saveBacklog(); // B-202605-007: _undoSnapshot() movido antes del forEach
    _setBacklogModified();
    renderStats(); // siempre actualizar stat bar aunque no estemos en tab Backlog
    if (currentTab === 'backlog') { if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList(); updateBacklogBanner(); }
  }
  return { created, advanced, retroceso, discarded, updated, ignored, createdAndClosed, tmpSuggestions };
}




// Convierte estado del TRACKER-GLOBAL al formato del Backlog
function _tgStatusToBacklog(raw) {
  return _normalizeStatus(raw);
}

// Normaliza cualquier variante de status a los valores canónicos: 'pendiente' | 'done' | 'descartado' | 'historico'
function _normalizeStatus(raw) {
  if (!raw) return 'pendiente';
  const s = raw.toLowerCase().trim();
  // B-202604-193: 'historico' es valor canónico — NO normalizar a pendiente
  if (s === 'historico') return 'historico';
  if (s === 'done' || s.includes('done') || s.includes('listo')) return 'done';
  if (s === 'descartado' || s.includes('descart') || s.includes('discard')) return 'descartado';
  // R-202604-091: 'en curso' fusionado con 'pendiente' — decorador visual reemplaza al status
  if (s === 'en curso' || s === 'en-curso' || s === 'progreso' || s === 'in-progress' || s === 'en progreso') return 'pendiente';
  // T-202605-039: en-revision — valor canónico, no degradar a pendiente
  if (s === 'en-revision' || s === 'en_revision') return 'en-revision';
  return 'pendiente';
}

// T-202605-083: _staleness — punto único de cálculo de días de estancamiento para staleness-pill
// Retorna objeto { days, modifier, label } si el pill debe renderizar, null si no aplica.
// Gate: _hasRecentSession debe retornar false (ítem sin sesión reciente).
// Modificadores: fresh (≤3d) · warn (4–7d) · stale (>7d).
// Si statusChangedAt y createdAt son ambos null/undefined → retorna null (sin crash, sin valor inventado).
function _staleness(item) {
  if (!item || item.status !== 'pendiente') return null;
  if (!item.sprint || item.sprint === 'n/a') return null;
  if (!item.createdAt) return null;
  if (typeof _hasRecentSession === 'function' && _hasRecentSession(item)) return null;
  const _refTs = item.statusChangedAt || item.createdAt;
  if (!_refTs) return null;
  const days = Math.floor((Date.now() - _refTs) / 86400000);
  const modifier = days <= 3 ? 'fresh' : days <= 7 ? 'warn' : 'stale';
  const label = days === 0 ? 'hoy' : days === 1 ? '1d' : days + 'd';
  return { days, modifier, label };
}

// R-202604-091: decorador de actividad — pendiente con sesión vinculada en los últimos 7 días
const _ACTIVE_RECENT_DAYS = 7;
function _isActiveRecently(item) {
  if (!item || item.status !== 'pendiente') return false;
  if (typeof getAllSessions !== 'function') return false;
  const allSessions = getAllSessions();
  let lastTs = 0;
  allSessions.forEach(s => {
    if ((s.backlogRefs || s.trackerRefs || []).includes(item.code)) {
      const ts = s.savedAt || s.createdAt || 0;
      // R-202605-041: excluir sesiones anteriores al createdAt del ítem
      // Ítems legacy sin createdAt → comportamiento anterior sin cambio
      if (item.createdAt && ts < item.createdAt) return;
      if (ts > lastTs) lastTs = ts;
    }
  });
  if (!lastTs) return false;
  return (Date.now() - lastTs) / 86400000 <= _ACTIVE_RECENT_DAYS;
}


// R-202605-062: applyPatchesFromTG — aplica patches de campo individual sobre ítems existentes
// AC-1: type: "patch" es instrucción de operación — no tipo de ítem
// AC-2: solo requiere code + campos a patchear
// AC-3: campos patcheables: title, status, priority, effort, area, sprint, role, ac, origin
// AC-3b: campos no patcheables (code, type, schema_version) → advertencia DocLog, sin crash
// AC-4: ac presente → reemplaza array completo
// AC-5: código no existe en backlog → advertencia DocLog, sin crash
// AC-6: código placeholder → ignorado (manejado en parsePaste antes de llegar aquí)
// AC-7: status done → mismas reglas de confirmación que done manual (vía setItemStatus)
// AC-8: mezcla ítems + patches en mismo ---ITEMS--- → parser separa por type
// AC-9: panel diff muestra solo campos del patch (changes array)
// AC-11: sin regresión en mergeBacklogFromTG
const _PATCH_ALLOWED_FIELDS = new Set(['title', 'status', 'priority', 'effort', 'area', 'sprint', 'role', 'ac', 'origin']); // R-202605-004: origin patcheable
const _PATCH_NON_PATCHEABLE = new Set(['code', 'type', 'schema_version']);

function applyPatchesFromTG(patches, sessionId) {
  if (!patches || !patches.length) return { patched: [], ignored: [] };

  const patched = [];
  const ignoredPatches = [];

  if (typeof _undoSnapshot === 'function') _undoSnapshot();

  patches.forEach(patch => {
    const code = patch.code;

    // AC-5: código no existe en backlog → advertencia DocLog
    const existing = (typeof ITEMS !== 'undefined') ? ITEMS.find(i => i.code === code) : null;
    if (!existing) {
      if (typeof _blogLog === 'function') {
        _blogLog('patch-ignorado', code, 'Patch ignorado: código no existe en el backlog. code: ' + code, 'backlog');
      }
      ignoredPatches.push({ code, reason: 'no-existe' });
      return;
    }

    // AC-3b: advertir sobre campos no patcheables presentes en el objeto patch
    Object.keys(patch).forEach(k => {
      if (_PATCH_NON_PATCHEABLE.has(k)) {
        if (typeof _blogLog === 'function') {
          _blogLog('patch-campo-ignorado', code, 'Campo no patcheable ignorado: ' + k, 'backlog');
        }
      }
    });

    const changes = [];
    const nowTs = Date.now();

    // Iterar solo sobre campos patcheables presentes en el objeto patch
    _PATCH_ALLOWED_FIELDS.forEach(field => {
      if (!(field in patch)) return; // campo no incluido en este patch → no tocar
      const incoming = patch[field];
      const current  = existing[field];

      if (field === 'status') {
        const normalized = (typeof _normalizeStatus === 'function') ? _normalizeStatus(incoming) : incoming;
        if (normalized !== existing.status) {
          const _prevStatus = existing.status;
          if (normalized === 'done' && typeof _applyDoneStatus === 'function') {
            // B-202605-XXX: patch programático → _applyDoneStatus directo, sin modal inline
            // setItemStatus dispara _showInlineConfirmDone para ítems en sprint activo,
            // lo que requiere interacción del usuario y cancela el patch silenciosamente.
            _applyDoneStatus(existing.code);
            changes.push({ field: 'status', from: _prevStatus, to: normalized });
          } else if (normalized && normalized !== existing.status) {
            changes.push({ field: 'status', from: existing.status, to: normalized });
            existing.status = normalized;
            existing.statusChangedAt = nowTs;
          }
        }
        return;
      }

      if (field === 'ac') {
        // AC-4: ac reemplaza array completo
        if (Array.isArray(incoming)) {
          changes.push({ field: 'ac', from: existing.ac || [], to: incoming });
          existing.ac = incoming;
        }
        return;
      }

      if (field === 'sprint') {
        // Sprint: aplicar _normalizeSprint sobre objeto temporal para normalizar centinelas
        const tempItem = { sprint: incoming };
        if (typeof _normalizeSprint === 'function') _normalizeSprint(tempItem);
        const normalizedSprint = tempItem.sprint; // undefined si centinela, valor si válido
        if (normalizedSprint !== current) {
          changes.push({ field: 'sprint', from: current || '—', to: normalizedSprint });
          if (normalizedSprint === undefined) delete existing.sprint;
          else existing.sprint = normalizedSprint;
        }
        return;
      }

      // Resto de campos patcheables: title, priority, effort, area, role
      if (incoming !== undefined && incoming !== null && incoming !== current) {
        changes.push({ field, from: current !== undefined ? current : '—', to: incoming });
        existing[field] = incoming;
      }
    });

    if (changes.length) {
      // Registrar en history del ítem
      if (!existing.history) existing.history = [];
      changes.forEach(ch => {
        if (ch.field === 'status') return; // status lo registra setItemStatus
        existing.history.push({
          type: 'field',
          ts: nowTs,
          origin: 'patch',
          sessionId: sessionId || null,
          data: { field: ch.field, from: ch.from !== '—' ? ch.from : null, to: ch.to || null }
        });
      });
      if (sessionId && existing.sessionId !== sessionId) existing.sessionId = sessionId;

      patched.push({
        code,
        desc: existing.title,
        changes,
        change: changes.map(c => c.field).join(' · ')
      });

      if (typeof saveBacklog === 'function') saveBacklog();
    } else {
      ignoredPatches.push({ code, reason: 'sin-cambios' });
    }
  });

  if (typeof renderBacklogList === 'function') if (typeof _markBacklogListDirty === 'function') _markBacklogListDirty(); renderBacklogList();
  if (typeof renderStats === 'function') renderStats();

  return { patched, ignored: ignoredPatches };
}


