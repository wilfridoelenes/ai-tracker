// [PP] mod:18 · autor:Rune · 2026-07-01 UTC-6
// locus-backlog-archive.js
// TKT2 (REQ Histórico unificado con Vista Lista de Backlog): reescrito para consumir
// renderSprintGroup() de locus-backlog-render.js — vista única agrupada por sprint cerrado
// con progress bar + childMap R→hijos, reemplaza el sistema de 2 vistas (Por sprint / Lista
// plana) y sus tabs. Ver header de locus-backlog-render.js mod:57 para el contrato de la función.
// Responsabilidad: Archivo histórico — archivar ítems cerrados, render agrupado por sprint.

import { renderStats, getItems, purgeAllHistorico, itemKind } from './locus-backlog-core.js';
import { buildBacklogItem } from './locus-backlog-item.js';

import { renderBacklogList, renderSprintGroup } from './locus-backlog-render.js';

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
// TKT2 (REQ Histórico unificado con Vista Lista de Backlog): vista única — agrupación por
// sprint cerrado vía renderSprintGroup (mismo motor de Backlog Vista Lista), con jerarquía
// R→hijos vía childMap. Reemplaza el sistema de 2 vistas toggleables (Por sprint / Lista plana)
// — sin distinción de sprints legado (antes S<23): cada sprint cerrado se agrupa igual sin
// importar su antigüedad, mismo criterio que Backlog Vista Lista.
// Read-only treatment: CSS escopado a #arch-historico-body (Nova).
// ─────────────────────────────────────────────────────────────────────────────

const _ARCH_KEY       = 'ai-tracker-arch-open';
// B-[tmp:historico-expand]: mantener _HISTORICO_KEY en sync para compatibilidad
// con confirmCloseSprint que usa localStorage.setItem(_HISTORICO_KEY, '1')
const _HISTORICO_KEY  = _ARCH_KEY;

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
// TKT3 (REQ Histórico unificado): dedupe por code — mismo patrón que _getAllItemsWithHistorico()
// de locus-backlog-render.js. Sin esto, un ítem presente simultáneamente en getItems() y
// getHistoricoItemsSync() (condición de carrera ya identificada) aparecía duplicado en el panel.
function _mergeActiveAndHistorico() {
  const _active = getItems();
  const _historico = getHistoricoItemsSync();
  if (!_historico.length) return _active;
  const _seen = new Set(_active.map(i => i.code));
  const _merged = _active.slice();
  _historico.forEach(i => { if (!_seen.has(i.code)) { _merged.push(i); _seen.add(i.code); } });
  return _merged;
}

function _buildArchivoPartitions() {
  const allItems      = _mergeActiveAndHistorico();
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
  // _renderArchivoBody. Sin esto, el panel no se monta y el fallback genérico
  // ("No hay sprints cerrados aún") queda visible incluso cuando sí existe un
  // sprint cerrado, solo que sin ítems asignados.
  if (!total && !_legacyHistoricos.length && !closedSprints.length) return;

  const isOpen = (() => { try { return localStorage.getItem(_ARCH_KEY) === '1'; } catch { return false; } })();

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
    _renderArchivoBody();
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
    _renderArchivoBody();
  } else {
    body.classList.add('arch-historico-body--collapsed');
    body.innerHTML = '';
  }
}

// TKT2 (REQ Histórico unificado): reemplaza _renderArchivoViewSprint/_renderArchivoViewFlat —
// vista única, agrupación por sprint cerrado vía renderSprintGroup (mismo motor que Backlog
// Vista Lista). Sin distinción recentSprints/legacySprints (S-23): cada sprint cerrado se agrupa
// igual sin importar su antigüedad — Backlog Vista Lista tampoco distingue sprints legado, y este
// panel deja de tener una razón propia para hacerlo. isClosed:true siempre — Histórico solo
// contiene ítems de sprints con status:'closed' (ver _buildArchivoPartitions).
function _renderArchivoBody() {
  const body = document.getElementById('arch-historico-body');
  if (!body) return;

  const { archivoItems, closedSprints } = _buildArchivoPartitions();

  if (!archivoItems.length) {
    body.innerHTML = `<div class="arch-view"><div class="arch-empty">Sin ítems en sprints cerrados.</div></div>`;
    return;
  }

  const sortedClosed = [...closedSprints].sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0)); // más reciente primero

  let html = `<div class="arch-view" id="arch-view-sprint">`;
  sortedClosed.forEach(sp => {
    const spItems = archivoItems.filter(i => i.sprint === sp.id);
    if (!spItems.length) return;
    html += renderSprintGroup(spItems, true);
  });
  html += `</div>`;

  body.innerHTML = html;
  _attachArchChildToggleDelegation(body);
}

// TKT2: renderSprintGroup emite botones data-action="vl-toggle-r" para colapsar/expandir los
// hijos de un R — en Backlog Vista Lista esa delegación se adjunta sobre #backlog-list
// (locus-backlog-render.js, listener _vlToggleHandler junto a _attachBacklogListDelegation).
// #arch-historico-body es un árbol de DOM distinto — sin esta réplica el botón queda inerte.
// Mismo archivo, sin scope nuevo, necesario para que el childMap de AC2 sea funcional y no solo
// visual — ver inline_fix en CHECKPOINT. Guard idéntico al patrón ya usado en este archivo
// (_archDelegationAttached) para no acumular listeners en re-renders.
function _attachArchChildToggleDelegation(body) {
  if (body._archChildDelegationAttached) return;
  body._archChildDelegationAttached = true;
  body.addEventListener('click', function _archVlToggleHandler(e) {
    const btn = e.target.closest('[data-action="vl-toggle-r"]');
    if (!btn) return;
    const rCode = btn.dataset.rCode;
    if (!rCode) return;
    const childBody = document.getElementById('bl-vl-req-body-' + CSS.escape(rCode));
    if (!childBody) return;
    const isNowCollapsed = !childBody.classList.contains('collapsed');
    childBody.classList.toggle('collapsed', isNowCollapsed);
    btn.classList.toggle('collapsed', isNowCollapsed);
    const _collapseKey = 'locus-r-collapsed-' + rCode;
    if (isNowCollapsed) {
      localStorage.setItem(_collapseKey, '1');
    } else {
      localStorage.removeItem(_collapseKey);
    }
  });
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
