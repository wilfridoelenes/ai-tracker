// [PP] v1.2.4 · sprint:PP-S-09 · mod:1 · autor:Rune · 2026-05-28 UTC-6
// locus-backlog-archive.js
// Responsabilidad: Archivo histórico — archivar ítems cerrados, vistas por sprint y plana.
// Dependencias: locus-backlog-core.js · locus-storage.js

// ─────────────────────────────────────────────────────────────────────────────
// B-[tmp:closed-version]: archivar ítems done/descartados al hacer bump de versión
// Llamada desde confirmMapGenerator() en ai-tracker-map-generator.js
// ─────────────────────────────────────────────────────────────────────────────
export function archiveClosedItems() {
  let changed = false;
  ITEMS.forEach(item => {
    if (item.status === 'done' || item.status === 'descartado') {
      item.status = 'historico';
      changed = true;
    }
  });
  if (changed) {
    saveBacklog();
    renderBacklogList();
    renderStats();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// R-202605-103: Archivo histórico unificado
// Reemplaza _renderHistoricoSection (B-202604-193) + closed-sprints-block.
// Vista Por sprint: accordion de sprints cerrados con ítems históricos.
// Vista Lista plana: todos los históricos sin agrupación.
// Read-only treatment: CSS escopado a #arch-historico-body (Nova).
// ─────────────────────────────────────────────────────────────────────────────

const _ARCH_KEY       = 'ai-tracker-arch-open';
const _ARCH_VIEW_KEY  = 'ai-tracker-arch-view';   // 'sprint' | 'flat'
// B-[tmp:historico-expand]: mantener _HISTORICO_KEY en sync para compatibilidad
// con confirmCloseSprint que usa localStorage.setItem(_HISTORICO_KEY, '1')
const _HISTORICO_KEY  = _ARCH_KEY;

export function renderArchivoHistorico(listEl) {
  const historicos = ITEMS.filter(i => i.status === 'historico');
  if (!historicos.length) return;

  const isOpen     = (() => { try { return localStorage.getItem(_ARCH_KEY) === '1'; } catch { return false; } })();
  const activeView = (() => { try { return localStorage.getItem(_ARCH_VIEW_KEY) || 'sprint'; } catch { return 'sprint'; } })();
  const total      = historicos.length;

  // Sprint más antiguo como referencia de "desde cuándo"
  const closedSprints = getActiveSprints()
    .filter(s => s.status === 'closed')
    .sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0));
  const oldestSprintId = closedSprints.length ? esc(closedSprints[0].label || closedSprints[0].id) : '';
  const sinceHtml = oldestSprintId
    ? `<span class="arch-historico-since">desde ${oldestSprintId}</span>`
    : '';

  const section = document.createElement('div');
  section.id        = 'arch-historico';
  section.className = 'arch-historico';

  section.innerHTML = `
    <div class="arch-historico-header" onclick="toggleArchivoHistorico()" tabindex="0"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleArchivoHistorico()}"
         aria-expanded="${isOpen}" aria-controls="arch-historico-body">
      <span class="arch-historico-arrow${isOpen ? ' arch-historico-arrow--open' : ''}" aria-hidden="true">▸</span>
      <span class="arch-historico-title">Archivo histórico</span>
      <div class="arch-historico-meta">
        <span class="arch-historico-count">${total} ítem${total !== 1 ? 's' : ''}</span>
        ${sinceHtml}
      </div>
      <div class="arch-historico-tabs" onclick="event.stopPropagation()">
        <button class="arch-tab${activeView === 'sprint' ? ' arch-tab--active' : ''}"
                onclick="setArchivoView('sprint',this)">Por sprint</button>
        <button class="arch-tab${activeView === 'flat' ? ' arch-tab--active' : ''}"
                onclick="setArchivoView('flat',this)">Lista plana</button>
      </div>
    </div>
    <div class="arch-historico-body${isOpen ? '' : ' arch-historico-body--collapsed'}"
         id="arch-historico-body" role="region" aria-label="Archivo histórico">
    </div>`;

  const zoneDivider = document.createElement('div');
  zoneDivider.className = 'arch-zone-divider';
  listEl.appendChild(zoneDivider);
  listEl.appendChild(section);

  if (isOpen) {
    _renderArchivoBody(activeView);
  }
}

export function toggleArchivoHistorico() {
  const body   = document.getElementById('arch-historico-body');
  const header = document.querySelector('#arch-historico .arch-historico-header');
  const arrow  = document.querySelector('#arch-historico .arch-historico-arrow');
  if (!body) return;

  const wasOpen  = !body.classList.contains('arch-historico-body--collapsed');
  const nowOpen  = !wasOpen;

  try { localStorage.setItem(_ARCH_KEY, nowOpen ? '1' : '0'); } catch {}
  if (header) header.setAttribute('aria-expanded', String(nowOpen));

  if (arrow) {
    arrow.classList.toggle('arch-historico-arrow--open', nowOpen);
  }

  if (nowOpen) {
    body.classList.remove('arch-historico-body--collapsed');
    const activeView = (() => { try { return localStorage.getItem(_ARCH_VIEW_KEY) || 'sprint'; } catch { return 'sprint'; } })();
    _renderArchivoBody(activeView);
  } else {
    body.classList.add('arch-historico-body--collapsed');
    body.innerHTML = '';
  }
}

function setArchivoView(view, btn) {
  try { localStorage.setItem(_ARCH_VIEW_KEY, view); } catch {}

  // Update tab active state
  const tabs = document.querySelectorAll('#arch-historico .arch-tab');
  tabs.forEach(t => t.classList.toggle('arch-tab--active', t === btn));

  _renderArchivoBody(view);
}

function _renderArchivoBody(view) {
  const body = document.getElementById('arch-historico-body');
  if (!body) return;

  if (view === 'sprint') {
    _renderArchivoViewSprint(body);
  } else {
    _renderArchivoViewFlat(body);
  }
}

// R-202605-124: número de sprint como entero para comparar con la frontera S-23
export function _sprintNum(id) {
  const m = (id || '').match(/^S-(\d+)$/i);
  return m ? parseInt(m[1], 10) : 0;
}

// R-202605-124: fila compacta de ítem para el Archivo Histórico
// muestra: tipo · código · título · effort · status final
function _archItemRow(i) {
  const type   = esc(i.type || 'T');
  const code   = esc(i.code || '—');
  const title  = esc(i.title || '—');
  const effort = parseInt(i.effort) || 0;
  const effortHtml = effort
    ? `<span class="arch-row-effort" title="Effort ${effort}">${'●'.repeat(effort)}</span>`
    : '';
  const statusLabel = i.status === 'historico'
    ? (i.doneAt ? 'done' : i.discardReason ? 'descartado' : 'historico')
    : esc(i.status || '');
  return `<div class="arch-item-row">
    <span class="arch-row-type arch-row-type--${type.toLowerCase()}">${type}</span>
    <span class="arch-row-code">${code}</span>
    <span class="arch-row-title">${title}</span>
    ${effortHtml}
    <span class="arch-row-status">${statusLabel}</span>
  </div>`;
}

// R-202605-124: header HTML de una entrada de sprint con datos completos
function _archSprintEntryHtml(sp, spItems, entryId, entryKey, entryOpen) {
  const dateStr = sp.closedAt
    ? new Date(sp.closedAt).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'})
    : '—';
  const effortDone = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 0), 0);
  const effortHtml = effortDone
    ? `<span class="arch-se-effort" title="Effort entregado">${effortDone} effort</span>`
    : '';
  const goalHtml = sp.goal
    ? `<span class="arch-se-goal" title="${esc(sp.goal)}">${esc(sp.goal)}</span>`
    : '';
  const nameDisplay = sp.label
    ? esc(sp.label.replace(/^[A-Za-z]+[-\s]S\d+\s*·?\s*/i, ''))
    : esc(sp.id || 'Sprint sin nombre');

  return `<div class="arch-sprint-entry">
    <div class="arch-sprint-entry-header" tabindex="0"
         onclick="_toggleArchSprintEntry('${esc(entryId)}','${esc(entryKey)}')"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();_toggleArchSprintEntry('${esc(entryId)}','${esc(entryKey)}')}">
      <span class="arch-se-arrow${entryOpen ? ' arch-se-arrow--open' : ''}" aria-hidden="true">&#9658;</span>
      <span class="arch-se-id">${esc(sp.id)}</span>
      <span class="arch-se-name">${nameDisplay}</span>
      ${goalHtml}
      <span class="arch-se-date">${esc(dateStr)}</span>
      ${effortHtml}
      <span class="arch-se-count">${spItems.length} ítem${spItems.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="arch-sprint-items${entryOpen ? '' : ' arch-sprint-items--collapsed'}" id="${esc(entryId)}">
      ${entryOpen ? `<div class="arch-items-list">${spItems.map(_archItemRow).join('')}</div>` : ''}
    </div>
  </div>`;
}

// Vista Por sprint — accordion de sprints cerrados
// R-202605-124: sprints ≥ S-23 con datos completos · pre-S-23 agrupados como bloque único
function _renderArchivoViewSprint(body) {
  const historicos    = ITEMS.filter(i => i.status === 'historico');
  const closedSprints = getActiveSprints()
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0)); // más reciente primero

  // R-202605-124: frontera S-23 — sprints con datos completos vs. legado
  const BOUNDARY = 23;
  const recentSprints = closedSprints.filter(s => _sprintNum(s.id) >= BOUNDARY);
  const legacySprints = closedSprints.filter(s => _sprintNum(s.id) > 0 && _sprintNum(s.id) < BOUNDARY);

  // Ítems huérfanos (sin sprint registrado o sprint que ya no existe en catálogo)
  const registeredIds = new Set(closedSprints.map(s => s.id));
  const noSprint = historicos.filter(i => !i.sprint || !registeredIds.has(i.sprint));

  // Ítems de sprints legado (sprint id < S-23 que sí está en catálogo)
  const legacySprintIds = new Set(legacySprints.map(s => s.id));
  const legacyItems = historicos.filter(i => legacySprintIds.has(i.sprint));

  // Total de ítems sin agrupación moderna
  const preLegacyItems = [...legacyItems, ...noSprint];

  const hasData = recentSprints.some(s => historicos.filter(i => i.sprint === s.id).length > 0)
               || preLegacyItems.length > 0;

  if (!hasData) {
    body.innerHTML = `<div class="arch-view"><div class="arch-empty">Sin sprints cerrados con ítems históricos.</div></div>`;
    return;
  }

  let html = `<div class="arch-view" id="arch-view-sprint">`;

  // ── Sprints ≥ S-23 con datos completos ──────────────────────────────
  recentSprints.forEach(sp => {
    const spItems = historicos.filter(i => i.sprint === sp.id);
    if (!spItems.length) return;

    const entryKey  = 'arch-se-' + sp.id;
    const entryOpen = (() => { try { return localStorage.getItem(entryKey) === '1'; } catch { return false; } })();
    const entryId   = 'arch-se-body-' + sp.id.toLowerCase().replace(/[^a-z0-9]/g, '-');

    html += _archSprintEntryHtml(sp, spItems, entryId, entryKey, entryOpen);
  });

  // ── Histórico pre-S-23 — bloque único colapsable ─────────────────────
  if (preLegacyItems.length) {
    const legKey  = 'arch-se-legacy';
    const legOpen = (() => { try { return localStorage.getItem(legKey) === '1'; } catch { return false; } })();
    const legId   = 'arch-se-body-legacy';
    html += `<div class="arch-sprint-entry arch-sprint-entry--legacy">
      <div class="arch-sprint-entry-header" tabindex="0"
           onclick="_toggleArchSprintEntry('${legId}','${legKey}')"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();_toggleArchSprintEntry('${legId}','${legKey}')}">
        <span class="arch-se-arrow${legOpen ? ' arch-se-arrow--open' : ''}" aria-hidden="true">&#9658;</span>
        <span class="arch-se-id arch-se-id--legacy">pre-S-23</span>
        <span class="arch-se-name">Histórico pre-S-23 (sin datos de sprint)</span>
        <span class="arch-se-count">${preLegacyItems.length} ítem${preLegacyItems.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="arch-sprint-items${legOpen ? '' : ' arch-sprint-items--collapsed'}" id="${legId}">
        ${legOpen ? `<div class="arch-items-list">${preLegacyItems.map(_archItemRow).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  html += `</div>`;
  body.innerHTML = html;
}

// Vista Lista plana — todos los históricos sin agrupación
function _renderArchivoViewFlat(body) {
  const historicos = ITEMS.filter(i => i.status === 'historico')
    .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));

  if (!historicos.length) {
    body.innerHTML = `<div class="arch-view"><div class="arch-empty">Sin ítems históricos.</div></div>`;
    return;
  }

  body.innerHTML = `<div class="arch-view" id="arch-view-flat">
    ${historicos.map(i => buildBacklogItem(i)).join('')}
  </div>`;
}

// Toggle individual sprint entry dentro del archivo histórico
// R-202605-124: lazy render con _archItemRow (filas compactas) en lugar de buildBacklogItem
function _toggleArchSprintEntry(bodyId, storageKey) {
  const el = document.getElementById(bodyId);
  if (!el) return;

  const wasCollapsed = el.classList.contains('arch-sprint-items--collapsed');
  const nowOpen      = wasCollapsed;

  try { localStorage.setItem(storageKey, nowOpen ? '1' : '0'); } catch {}

  const header = el.previousElementSibling;
  const arrow  = header ? header.querySelector('.arch-se-arrow') : null;
  if (arrow) arrow.classList.toggle('arch-se-arrow--open', nowOpen);

  if (nowOpen) {
    // R-202605-124: lazy render de filas compactas al abrir
    if (!el.querySelector('.arch-items-list')) {
      let spItems;
      if (bodyId === 'arch-se-body-legacy') {
        // Bloque legado: históricos sin sprint en catálogo o sprint < S-23
        const BOUNDARY = 23;
        const closedSprints = getActiveSprints().filter(s => s.status === 'closed');
        const registeredIds = new Set(closedSprints.map(s => s.id));
        const legacyIds     = new Set(closedSprints.filter(s => _sprintNum(s.id) > 0 && _sprintNum(s.id) < BOUNDARY).map(s => s.id));
        spItems = ITEMS.filter(i => i.status === 'historico' && (!i.sprint || !registeredIds.has(i.sprint) || legacyIds.has(i.sprint)));
      } else {
        const spId = storageKey.replace(/^arch-se-/, '');
        spItems = ITEMS.filter(i => i.status === 'historico' && i.sprint === spId);
      }
      el.innerHTML = `<div class="arch-items-list">${spItems.map(_archItemRow).join('')}</div>`;
    }
    el.classList.remove('arch-sprint-items--collapsed');
  } else {
    el.classList.add('arch-sprint-items--collapsed');
  }
}

// ─── fin R-202605-103 ──────────────────────────────────────────────────────

// T-202604-287: Vista Kanban — 4 columnas: pendiente · progreso · done · descartado
