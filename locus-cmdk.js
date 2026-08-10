// [PP] mod:2 · autor:Rune · 2026-08-09 21:00 UTC-6
// locus-cmdk.js
// Responsabilidad: índice de búsqueda unificado + wiring del buscador global ⌘K (REQ-202608-118).
//
// TKT-202608-289 (TKT3) — el Backlog (_PP-backlog-v1.26.0.md) declaraba este TKT `done` con
// los 3 AC en [x], pero el código real de este archivo (mod:1) contenía únicamente
// buildCmdkIndex() — el wiring nunca se escribió. Mismo patrón de fondo que INC-202608-102
// (TKT-202608-287 declarado done sin código real) — corregido ahora con verificación directa
// contra los archivos reales del repo (no contra narrativa de sesión), antes de declarar nada
// como done. Ver __BR-Core §VERIFICACIÓN DE CIERRE DE EDICIÓN.
//
// AC2 — navegación exclusivamente vía navigateToItem() (locus-item-navigator.js, mod:3,
// confirmado exportado y con soporte ITIL/DISC) — navigateToBacklogItem no existe como export
// en locus-session-popup.js real, descartada.
//
// Clases/estados verificados contra locus-cmdk.css real (mod:2, Nova): data-state
// normal/results/empty/loading, resaltado por teclado = clase .active, cada grupo requiere
// .cmdk-group-label, badges REQ/TKT/DISC = .cmdk-type--req/tkt/disc. Badges ITIL (INC/PRB/CHG)
// verificados contra locus-incidents.css real: .qinc-type-badge + .qinc-type-badge--inc/--prb/
// --chg (existe también --ke, legado — no se genera con schema vigente, __BR-Core §6 fusionó
// KE en PRB.root_cause_confirmed; se mapea igual por si un ítem histórico lo trajera).
//
// TKT-202608-287 (TKT1) — buildCmdkIndex(), sin cambio funcional en este mod.
//
// Listener global bindeado una sola vez a nivel de módulo (_initCmdkListeners() se ejecuta al
// importar — mismo patrón que shell:* events ya usado en el ecosistema, __BR-Ecosystem §7).
// Re-entrancy guard: si el overlay ya tiene .is-open, el handler de ⌘K retorna sin reabrir ni
// volver a bindear nada.
//
// Módulo nuevo: el dato que buildCmdkIndex() consume (ITEMS/INCIDENTS) vive en
// locus-backlog-core.js, pero el índice de búsqueda en sí es un dominio propio del
// buscador ⌘K — mismo criterio que ya separó locus-cmdk.css de locus-backlog.css
// (__BR-Ecosystem §7: función sin módulo dueño claro → módulo nuevo, no forzarla en el
// módulo invocador ni en el módulo de datos).

import { getItems, getIncidents } from './locus-backlog-core.js';
import { navigateToItem } from './locus-item-navigator.js';

// buildCmdkIndex() → array de {code,title,type,area} por cada ítem activo del ecosistema.
// Fuente: getItems() (REQ/TKT/DISC) + getIncidents() (INC/PRB/CHG). Excluye status:historico
// de getItems() — getIncidents() no tiene equivalente historico (__BR-Core §6: Q-INC no migra
// a historico, incident_status es terminal por sí mismo), por eso no se filtra ahí.
// No pagina, no persiste el índice, no toca sesiones/workers — recalculado en cada apertura
// del modal (consumido por _renderCmdkResults, más abajo).
export function buildCmdkIndex() {
  const items = getItems().filter(function(i) { return i.status !== 'historico'; });
  const incidents = getIncidents();

  const fromItems = items.map(function(i) {
    return { code: i.code, title: i.title, type: i.type, area: i.area };
  });
  const fromIncidents = incidents.map(function(i) {
    return { code: i.code, title: i.title, type: i.type, area: i.area };
  });

  return fromItems.concat(fromIncidents);
}

// ── TKT-202608-289 · TKT3 — Wiring del atajo ⌘K + navegación al ítem ─────────────────────

const CMDK_STATE = { NORMAL: 'normal', RESULTS: 'results', EMPTY: 'empty', LOADING: 'loading' };

let _cmdkResults = [];
let _cmdkHighlighted = -1;

function _cmdkOverlay() { return document.getElementById('cmdk-overlay'); }
function _cmdkInput() { return document.getElementById('cmdk-input'); }
function _cmdkBody() { return document.getElementById('cmdk-body'); }

export function isCmdkOpen() {
  const overlay = _cmdkOverlay();
  return !!overlay && overlay.classList.contains('is-open');
}

// AC1 — abre el modal, enfoca #cmdk-input, resetea estado a normal.
export function openCmdk() {
  const overlay = _cmdkOverlay();
  if (!overlay || overlay.classList.contains('is-open')) return; // AC3 — re-entrancy guard
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  const input = _cmdkInput();
  if (input) {
    input.value = '';
    input.focus();
  }
  _cmdkResults = [];
  _cmdkHighlighted = -1;
  _clearCmdkRows();
  _setCmdkState(CMDK_STATE.NORMAL);
}

export function closeCmdk() {
  const overlay = _cmdkOverlay();
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  _cmdkResults = [];
  _cmdkHighlighted = -1;
}

function _setCmdkState(state) {
  const body = _cmdkBody();
  if (body) body.dataset.state = state;
}

function _clearCmdkRows() {
  const body = _cmdkBody();
  if (!body) return;
  body.querySelectorAll('.cmdk-group').forEach(function(el) { el.remove(); });
}

function _cmdkFilter(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return buildCmdkIndex().filter(function(i) {
    return (i.code || '').toLowerCase().includes(q) || (i.title || '').toLowerCase().includes(q);
  });
}

function _cmdkGroupByType(results) {
  const groups = {};
  const order = [];
  results.forEach(function(r) {
    if (!groups[r.type]) { groups[r.type] = []; order.push(r.type); }
    groups[r.type].push(r);
  });
  return order.map(function(type) { return { type: type, items: groups[type] }; });
}

// Badge de tipo — REQ/TKT/DISC: .cmdk-type--req/tkt/disc (locus-cmdk.css real, mod:2).
// INC/PRB/CHG (y KE legado): .qinc-type-badge + .qinc-type-badge--[tipo] (locus-incidents.css
// real — confirmado, no asumido).
function _cmdkTypeBadgeHtml(type) {
  const t = (type || '').toUpperCase();
  if (t === 'REQ' || t === 'TKT' || t === 'DISC') {
    return '<span class="cmdk-type--' + t.toLowerCase() + '">' + t + '</span>';
  }
  return '<span class="qinc-type-badge qinc-type-badge--' + t.toLowerCase() + '">' + t + '</span>';
}

function _renderCmdkResults(query) {
  const body = _cmdkBody();
  if (!body) return;
  _clearCmdkRows();

  if (!query.trim()) {
    _cmdkResults = [];
    _cmdkHighlighted = -1;
    _setCmdkState(CMDK_STATE.NORMAL);
    return;
  }

  const results = _cmdkFilter(query);
  _cmdkResults = results;
  _cmdkHighlighted = results.length ? 0 : -1;

  if (!results.length) {
    const emptyQuery = document.getElementById('cmdk-empty-query');
    if (emptyQuery) emptyQuery.textContent = query;
    _setCmdkState(CMDK_STATE.EMPTY);
    return;
  }

  _setCmdkState(CMDK_STATE.RESULTS);
  const groups = _cmdkGroupByType(results);
  let flatIndex = 0;
  groups.forEach(function(group) {
    const groupEl = document.createElement('div');
    groupEl.className = 'cmdk-group';
    groupEl.dataset.type = group.type;

    const labelEl = document.createElement('div');
    labelEl.className = 'cmdk-group-label';
    labelEl.textContent = group.type;
    groupEl.appendChild(labelEl);

    group.items.forEach(function(item) {
      const rowEl = document.createElement('div');
      rowEl.className = 'cmdk-row' + (flatIndex === _cmdkHighlighted ? ' active' : '');
      rowEl.dataset.code = item.code;
      rowEl.dataset.index = String(flatIndex);
      rowEl.innerHTML = _cmdkTypeBadgeHtml(item.type) +
        '<span class="cmdk-row-title">' + item.code + ' — ' + (item.title || '') + '</span>';
      groupEl.appendChild(rowEl);
      flatIndex++;
    });
    body.appendChild(groupEl);
  });
}

function _cmdkMoveHighlight(delta) {
  if (!_cmdkResults.length) return;
  _cmdkHighlighted = (_cmdkHighlighted + delta + _cmdkResults.length) % _cmdkResults.length;
  const body = _cmdkBody();
  if (!body) return;
  body.querySelectorAll('.cmdk-row').forEach(function(row) {
    row.classList.toggle('active', Number(row.dataset.index) === _cmdkHighlighted);
  });
  const activeRow = body.querySelector('.cmdk-row[data-index="' + _cmdkHighlighted + '"]');
  if (activeRow) activeRow.scrollIntoView({ block: 'nearest' });
}

function _cmdkNavigateTo(code) {
  if (!code) return;
  closeCmdk(); // AC2 — el modal se cierra antes de navegar
  navigateToItem(code);
}

function _initCmdkListeners() {
  window.addEventListener('keydown', function(e) {
    const isCmdK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
    if (isCmdK) {
      e.preventDefault();
      if (isCmdkOpen()) return; // AC3 — re-entrancy guard
      openCmdk();
      return;
    }
    if (!isCmdkOpen()) return;
    if (e.key === 'Escape') { closeCmdk(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); _cmdkMoveHighlight(1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); _cmdkMoveHighlight(-1); return; }
    if (e.key === 'Enter' && _cmdkHighlighted >= 0 && _cmdkResults[_cmdkHighlighted]) {
      e.preventDefault();
      _cmdkNavigateTo(_cmdkResults[_cmdkHighlighted].code);
    }
  });

  document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'cmdk-input') _renderCmdkResults(e.target.value);
  });

  document.addEventListener('click', function(e) {
    const row = e.target.closest && e.target.closest('.cmdk-row');
    if (row && row.dataset.code) { _cmdkNavigateTo(row.dataset.code); return; }
    const overlay = _cmdkOverlay();
    if (overlay && e.target === overlay) closeCmdk();
  });
}

_initCmdkListeners(); // se ejecuta una sola vez, al cargar el módulo
