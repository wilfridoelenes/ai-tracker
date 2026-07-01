// [PP] mod:15 · autor:Rune · 2026-06-30 UTC-6
// locus-backlog-archive.js
// Responsabilidad: Archivo histórico — archivar ítems cerrados, vistas por sprint y plana.

import { renderStats, getItems, purgeAllHistorico, itemKind } from './locus-backlog-core.js';
import { buildBacklogItem } from './locus-backlog-item.js';

import { renderBacklogList } from './locus-backlog-render.js';

import { _sprintDisplay, getActiveSprints, saveBacklog, refreshHistoricoCache, getHistoricoItemsSync } from './locus-storage.js';

import { esc } from './locus-ui-shell.js';

// Dependencias: locus-backlog-core.js · locus-storage.js

// ─────────────────────────────────────────────────────────────────────────────
// B-[tmp:closed-version]: archivar ítems done/descartados al hacer bump de versión
// Llamada desde confirmMapGenerator() en ai-tracker-map-generator.js
// B-202606-[pendiente-ID]: fix — solo archiva ítems cuyos sprints están cerrados formalmente.
// Antes archivaba todos los done/descartado sin filtrar por sprint, migrando a historico
// ítems de sprints activos o programados que aún no habían sido cerrados.
// ─────────────────────────────────────────────────────────────────────────────
export function archiveClosedItems() {
  const closedSprintIds = new Set(
    getActiveSprints().filter(s => s.status === 'closed').map(s => s.id)
  );
  const archiveTs = Date.now();
  let changed = false;
  getItems().forEach(item => {
    if (item.status !== 'done' && item.status !== 'descartado') return;
    // B-202606-[pendiente-ID]: solo archivar si el ítem pertenece a un sprint formalmente cerrado
    if (!item.sprint || !closedSprintIds.has(item.sprint)) return;
    item.status = 'historico';
    item.archivedAt = archiveTs;
    changed = true;
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

// R-202605-124 / T-202605-086: frontera de sprints con datos completos vs. legado
// Cambiar este valor si el proyecto PP resetea el catálogo de sprints en el futuro.
const LEGACY_BOUNDARY = 23;

// T-202606-103: Derivar ítems del archivo histórico desde sprints cerrados, no desde status historico.
// closedSprintIds: Set de ids de sprints con status === 'closed'.
// archivoItems: ítems cuyo sprint está en closedSprintIds (cualquier status).
// _legacyHistoricos: ítems con status === 'historico' NO en closedSprintIds — huérfanos del criterio nuevo.
//   Disponible para T2 (sección legacy con botón Purgar).
export let _legacyHistoricos = [];

// INC-[pendiente-ID]: getItems() nunca contiene status:historico desde T-202606-106 (barrera
// dura en locus-backlog-core.js _setITEMS) — los ítems historico viven exclusivamente en el
// storage dedicado (T-202606-105) y se leen vía getHistoricoItemsSync(). _buildArchivoPartitions
// debe mergear ambas fuentes; el caller es responsable de haber llamado refreshHistoricoCache()
// antes (ver renderArchivoHistorico / renderHistoricoPanel) — esta función permanece sync.
function _buildArchivoPartitions() {
  const allItems      = getItems().concat(getHistoricoItemsSync());
  const closedSprints = getActiveSprints().filter(s => s.status === 'closed');
  const closedSprintIds = new Set(closedSprints.map(s => s.id));

  // AC-1: ítems de sprints cerrados — cualquier status válido
  const archivoItems = allItems.filter(i => i.sprint && closedSprintIds.has(i.sprint));

  // AC-3: ítems legacy — status historico pero sprint NO en cerrados
  _legacyHistoricos = allItems.filter(i => i.status === 'historico' && (!i.sprint || !closedSprintIds.has(i.sprint)));

  return { archivoItems, closedSprints, closedSprintIds };
}

// T-202606-092 AC-2: conteo para badge del sub-tab Histórico.
// status:'historico' (via _legacyHistoricos) O sprint en lista de sprints cerrados (via archivoItems) — sin solape:
// archivoItems excluye por construcción los ítems que _legacyHistoricos incluye (sprint no cerrado).
export function getArchivoHistoricoCount() {
  const { archivoItems } = _buildArchivoPartitions();
  return archivoItems.length + _legacyHistoricos.length;
}

// T-202606-006: breakdown por tipo y prioridad para stats-bar informativa del panel Histórico.
// Mismo universo que getArchivoHistoricoCount() — archivoItems + _legacyHistoricos, sin solape.
// Chips resultantes son informativos — no filtran ni disparan re-render (ver render.js).
// [tmp:tkt5-archive-stats] migrado a Gen2: byType con claves canónicas Gen2, detección via itemKind().
export function getArchivoHistoricoStats() {
  const { archivoItems } = _buildArchivoPartitions();
  const all = archivoItems.concat(_legacyHistoricos);

  const byType = { REQ: 0, TKT: 0, INC: 0, DISC: 0, PRB: 0, KE: 0, CHG: 0 };
  const byPriority = { high: 0, medium: 0, low: 0 };

  all.forEach(i => {
    const t = itemKind(i);
    if (t && byType[t] !== undefined) byType[t]++;
    if (i.priority === 'high') byPriority.high++;
    else if (i.priority === 'low') byPriority.low++;
    else byPriority.medium++;
  });

  return { total: all.length, byType, byPriority };
}

// INC-[pendiente-ID]: async — refresca el cache de historico antes de construir las particiones.
// Todos los callers (renderHistoricoPanel, listener shell:render-historico) deben await esta función.
export async function renderArchivoHistorico(listEl) {
  await refreshHistoricoCache();
  const { archivoItems, closedSprints } = _buildArchivoPartitions();

  // AC-2: contador refleja solo ítems de sprints cerrados
  const total = archivoItems.length;
  // B-202606-066: si hay al menos un sprint cerrado, renderizar la sección aunque
  // total y _legacyHistoricos sean 0 — el empty state correcto vive en
  // _renderArchivoViewSprint/_renderArchivoViewFlat. Sin esto, el panel no se
  // monta y el fallback genérico ("No hay sprints cerrados aún") queda visible
  // incluso cuando sí existe un sprint cerrado, solo que sin ítems asignados.
  if (!total && !_legacyHistoricos.length && !closedSprints.length) return;

  const isOpen     = (() => { try { return localStorage.getItem(_ARCH_KEY) === '1'; } catch { return false; } })();
  const activeView = (() => { try { return localStorage.getItem(_ARCH_VIEW_KEY) || 'sprint'; } catch { return 'sprint'; } })();

  // Sprint más antiguo como referencia de "desde cuándo"
  const sortedClosed = [...closedSprints].sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0));
  const oldestSprintId = sortedClosed.length ? esc(_sprintDisplay(sortedClosed[0].id)) : '';
  const sinceHtml = oldestSprintId
    ? `<span class="arch-historico-since">desde ${oldestSprintId}</span>`
    : '';

  const section = document.createElement('div');
  section.id        = 'arch-historico';
  section.className = 'arch-historico';

  section.innerHTML = `
    <div class="arch-historico-header" data-action="arch-toggle" tabindex="0"
         aria-expanded="${isOpen}" aria-controls="arch-historico-body">
      <span class="arch-historico-arrow${isOpen ? ' arch-historico-arrow--open' : ''}" aria-hidden="true">▸</span>
      <span class="arch-historico-title">Archivo histórico</span>
      <div class="arch-historico-meta">
        <span class="arch-historico-count">${total} ítem${total !== 1 ? 's' : ''}</span>
        ${sinceHtml}
      </div>
      <div class="arch-historico-tabs" data-action="arch-tabs-stop">
        <button class="arch-tab${activeView === 'sprint' ? ' arch-tab--active' : ''}"
                data-action="arch-set-view" data-view="sprint">Por sprint</button>
        <button class="arch-tab${activeView === 'flat' ? ' arch-tab--active' : ''}"
                data-action="arch-set-view" data-view="flat">Lista plana</button>
      </div>
    </div>
    <div class="arch-historico-body${isOpen ? '' : ' arch-historico-body--collapsed'}"
         id="arch-historico-body" role="region" aria-label="Archivo histórico">
    </div>`;

  const zoneDivider = document.createElement('div');
  zoneDivider.className = 'arch-zone-divider';
  listEl.appendChild(zoneDivider);
  listEl.appendChild(section);

  // T-202606-104: sección legacy — ítems con status historico sin sprint cerrado
  _renderLegacySection(listEl);

  // Delegation — listener en listEl (#backlog-list), ancestro estático que existe en el DOM inicial
  // Evita onclick= y onkeydown= en HTML generado; funciones locales accesibles en scope
  function _archHandleAction(e, action) {
    const act = action.dataset.action;
    if (act === 'arch-toggle') { toggleArchivoHistorico(); return; }
    if (act === 'arch-tabs-stop') { e.stopPropagation(); return; }
    if (act === 'arch-set-view') { e.stopPropagation(); setArchivoView(action.dataset.view, action); return; }
    if (act === 'arch-sprint-entry') { _toggleArchSprintEntry(action.dataset.bodyId, action.dataset.storageKey); return; }
  }
  // Solo adjuntar una vez — evitar acumulación de listeners en renders sucesivos
  if (!listEl._archDelegationAttached) {
    listEl._archDelegationAttached = true;
    listEl.addEventListener('click', function _archListClick(e) {
      const action = e.target.closest('[data-action]');
      if (!action || !listEl.contains(action)) return;
      _archHandleAction(e, action);
    });
    listEl.addEventListener('keydown', function _archListKeydown(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const action = e.target.closest('[data-action]');
      if (!action || !listEl.contains(action)) return;
      e.preventDefault();
      _archHandleAction(e, action);
    });
  }

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
  const type   = esc(itemKind(i) || i.type || '—');
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
    <div class="arch-sprint-entry-header" data-action="arch-sprint-entry" data-body-id="${esc(entryId)}" data-storage-key="${esc(entryKey)}" tabindex="0">
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
// T-202606-103: filtra por sprint_id en closedSprintIds — no por status historico
// R-202605-124: sprints ≥ S-23 con datos completos · pre-S-23 agrupados como bloque único
function _renderArchivoViewSprint(body) {
  const { archivoItems, closedSprints } = _buildArchivoPartitions();
  const sortedClosed = [...closedSprints].sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0)); // más reciente primero

  // R-202605-124: frontera de sprints con datos completos vs. legado — usa LEGACY_BOUNDARY del módulo
  const recentSprints = sortedClosed.filter(s => _sprintNum(s.id) >= LEGACY_BOUNDARY);
  const legacySprints = sortedClosed.filter(s => _sprintNum(s.id) > 0 && _sprintNum(s.id) < LEGACY_BOUNDARY);

  // Ítems de sprints cerrados sin sprint registrado (no debería ocurrir, pero es defensivo)
  const registeredIds = new Set(closedSprints.map(s => s.id));
  const noSprint = archivoItems.filter(i => !i.sprint || !registeredIds.has(i.sprint));

  // Ítems de sprints legado (sprint id < S-23 que sí está en catálogo)
  const legacySprintIds = new Set(legacySprints.map(s => s.id));
  const legacyItems = archivoItems.filter(i => legacySprintIds.has(i.sprint));

  // Total de ítems sin agrupación moderna
  const preLegacyItems = [...legacyItems, ...noSprint];

  const hasData = recentSprints.some(s => archivoItems.filter(i => i.sprint === s.id).length > 0)
               || preLegacyItems.length > 0;

  if (!hasData) {
    body.innerHTML = `<div class="arch-view"><div class="arch-empty">Sin sprints cerrados con ítems.</div></div>`;
    return;
  }

  let html = `<div class="arch-view" id="arch-view-sprint">`;

  // ── Sprints ≥ S-23 con datos completos ──────────────────────────────
  recentSprints.forEach(sp => {
    const spItems = archivoItems.filter(i => i.sprint === sp.id);
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
      <div class="arch-sprint-entry-header" data-action="arch-sprint-entry" data-body-id="${legId}" data-storage-key="${legKey}" tabindex="0">
        <span class="arch-se-arrow${legOpen ? ' arch-se-arrow--open' : ''}" aria-hidden="true">&#9658;</span>
        <span class="arch-se-id arch-se-id--legacy">pre-S-${LEGACY_BOUNDARY}</span>
        <span class="arch-se-name">Histórico pre-S-${LEGACY_BOUNDARY} (sin datos de sprint)</span>
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

// Vista Lista plana — todos los ítems de sprints cerrados sin agrupación
// T-202606-103: fuente de datos son archivoItems (sprint en closedSprintIds), no status historico
function _renderArchivoViewFlat(body) {
  const { archivoItems } = _buildArchivoPartitions();
  const sorted = [...archivoItems].sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));

  if (!sorted.length) {
    body.innerHTML = `<div class="arch-view"><div class="arch-empty">Sin ítems en sprints cerrados.</div></div>`;
    return;
  }

  body.innerHTML = `<div class="arch-view" id="arch-view-flat">
    ${sorted.map(i => buildBacklogItem(i)).join('')}
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
        // Bloque legado: ítems de sprints cerrados con id < LEGACY_BOUNDARY + huérfanos sin sprint registrado
        const { archivoItems, closedSprints } = _buildArchivoPartitions();
        const registeredIds = new Set(closedSprints.map(s => s.id));
        const legacyIds     = new Set(closedSprints.filter(s => _sprintNum(s.id) > 0 && _sprintNum(s.id) < LEGACY_BOUNDARY).map(s => s.id));
        spItems = archivoItems.filter(i => !i.sprint || !registeredIds.has(i.sprint) || legacyIds.has(i.sprint));
      } else {
        const spId = storageKey.replace(/^arch-se-/, '');
        const { closedSprintIds } = _buildArchivoPartitions();
        // AC-4: mostrar todos los ítems del sprint cerrado independientemente de su status
        spItems = getItems().filter(i => i.sprint === spId && closedSprintIds.has(i.sprint));
      }
      el.innerHTML = `<div class="arch-items-list">${spItems.map(_archItemRow).join('')}</div>`;
    }
    el.classList.remove('arch-sprint-items--collapsed');
  } else {
    el.classList.add('arch-sprint-items--collapsed');
  }
}

// ─── fin R-202605-103 ──────────────────────────────────────────────────────

// T-202606-104: Sección legacy — ítems con status === 'historico' sin sprint cerrado.
// AC-1: si _legacyHistoricos.length > 0 → renderiza sección con conteo y botón Purgar.
// AC-3: si _legacyHistoricos.length === 0 → no renderiza nada (sin contenedor vacío).
// AC-4: el contador del encabezado principal (#arch-historico-count) no incluye legacy —
//       solo archivoItems. Legacy se cuenta en su propio encabezado.
function _renderLegacySection(listEl) {
  // Eliminar sección legacy anterior si existe — evita duplicados en re-renders
  const existing = listEl.querySelector('#arch-legacy-section');
  if (existing) existing.remove();

  // AC-3: sin ítems legacy → no renderizar contenedor
  if (!_legacyHistoricos.length) return;

  const count = _legacyHistoricos.length;

  const legacy = document.createElement('div');
  legacy.id        = 'arch-legacy-section';
  legacy.className = 'arch-legacy-section';

  legacy.innerHTML = `
    <div class="arch-legacy-header">
      <span class="arch-legacy-title">Ítems legacy (sin sprint cerrado)</span>
      <span class="arch-legacy-count">${count} ítem${count !== 1 ? 's' : ''}</span>
      <button class="arch-legacy-purge-btn" data-action="arch-legacy-purge"
              title="Eliminar permanentemente estos ítems del backlog">Purgar</button>
    </div>`;

  listEl.appendChild(legacy);

  // AC-2: click en Purgar → purgeAllHistorico() con confirmación via modal (gconfirmOpen en core)
  // Delegación en el propio nodo legacy — no en listEl para no interferir con _archDelegationAttached
  legacy.addEventListener('click', function _legacyClick(e) {
    const btn = e.target.closest('[data-action="arch-legacy-purge"]');
    if (!btn) return;
    purgeAllHistorico();
  });
}

// T-202604-287: Vista Kanban — 4 columnas: pendiente · progreso · done · descartado

// T-202606-008: listener shell:render-historico — patrón switchSubTab
// AC-3: despacha renderArchivoHistorico(sspanel-historico) al activar el sub-tab
// AC-4: si sspanel-historico no existe en el DOM, retorna silenciosamente sin error
window.addEventListener('shell:render-historico', async () => {
  const panel = document.getElementById('sspanel-historico');
  if (!panel) return;
  panel.innerHTML = '';
  await renderArchivoHistorico(panel);
});
