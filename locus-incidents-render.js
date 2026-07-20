// [PP] mod:1 · autor:Rune · 2026-07-20 23:40 UTC-6
// TKT1 (REQ CAEL-0720-03 · Separar render de rama Reactiva a módulo propio): módulo nuevo,
// exclusivo del render de Q-INC (INC/PRB/KE/CHG) — extraído íntegro de locus-backlog-render.js
// (líneas 1064-1327 de mod:93), sin cambio de comportamiento. Mismo criterio arquitectónico ya
// aplicado a generación de contenido (locus-incidents-generator.js, separado de
// locus-backlog-generator.js): la rama Reactiva vive en su propio módulo, no en uno cuyo nombre
// solo declara la rama Planeada.
//
// Contiene: _QINC_ACTIVE_STATUSES · renderQIncPanel() · _attachQIncDelegation() (privada) ·
// listener shell:render-qinc · listener shell:backlog-render-dirty (variante filtrada por
// getCurrentTab()==='incidentes').
//
// Preservado sin cambio — historial de incidentes previos sobre este bloque exacto:
// (1) orden de checks en _attachQIncDelegation: copy-code se evalúa ANTES que qi-open-panel
//     (copy-code vive anidado dentro de .qinc-item-header) — invertir el orden rompe el copiado.
// (2) import de openItemPanel es dinámico (import('./locus-backlog-panel.js')) — evita ciclo
//     ESM ya documentado en locus-ui-shell.js. Un import estático reintroduce el ciclo.
// (3) SLA_RIESGO_WINDOW_MS importada de locus-inc-fields.js (TKT previo, deuda de REQ
//     CAEL-0720-01) — no se reintroduce como const local.
//
// no_incluye (TKT1): no toca locus-inc-fields.js ni locus-incidents-generator.js · no cambia
// el orden interno de _attachQIncDelegation · no elimina el bloque original de
// locus-backlog-render.js (TKT2, mismo REQ).
//
// Dependencias: locus-backlog-core.js · locus-backlog-item.js · locus-backlog-panel.js (dinámico)
// · locus-incidents-generator.js · locus-inc-fields.js · locus-storage.js · locus-ui-shell.js

import {
  getIncidents, isQIncItem, itemKind,
  _nsGetTypes, _nsGetPriority, _nsGetQuery, _nsSetQuery, _nsToggleType, _nsTogglePriority, _nsReset
} from './locus-backlog-core.js';

import { buildQIncItem } from './locus-backlog-item.js';

import { incSlaPriority, SLA_RIESGO_WINDOW_MS } from './locus-inc-fields.js';

import { _generateIncidentsMd } from './locus-incidents-generator.js';

import { _getActiveProjectFilter, _docPrefix } from './locus-storage.js';

import { getCurrentTab } from './locus-ui-shell.js';

// Estados ITIL "activos" — orden de grupo primero. resolved/closed van al fondo.
const _QINC_ACTIVE_STATUSES = ['detected', 'assigned', 'in_progress', 'escalated_to_prb', 'escalated_to_chg'];

// TKT2 (REQ CAEL-0720-05): stats-bar de Q-INC extraído a función propia — mismo criterio que
// renderStats() (locus-backlog-core.js) para #stats-bar de Backlog. Llena #qinc-stats-bar
// (estático en index.html) de forma independiente del cuerpo (#qinc-panel-body). AC: chips
// muestran 0 sin ocultarse cuando no hay ítems activos — sin early-return por conteo, solo por
// ausencia de proyecto.
export function renderQIncStats() {
  const statsEl = document.getElementById('qinc-stats-bar');
  if (!statsEl) return;

  if (!_getActiveProjectFilter()) { statsEl.innerHTML = ''; return; }

  // Ítems ITIL del proyecto activo — misma fuente que renderQIncPanel().
  const allQInc = getIncidents().filter(isQIncItem);

  // Namespace propio 'qinc' — aislado del state global de Backlog
  const _qiTypes    = _nsGetTypes('qinc');
  const _qiPriority = _nsGetPriority('qinc');
  const _qiQuery     = (_nsGetQuery('qinc') || '').trim().toLowerCase();

  const _countByType = { INC: 0, PRB: 0, KE: 0, CHG: 0 };
  const _countByPri  = { high: 0, medium: 0, low: 0 };
  const _displayable = allQInc.filter(i => i.status !== 'descartado' && i.incidentStatus !== 'closed');
  _displayable.forEach(i => {
    const t = itemKind(i);
    if (t && _countByType[t] !== undefined) _countByType[t]++;
    // TKT1 (REQ-centralizar-accesores-itil): mismo motivo que el badge arriba.
    const p = incSlaPriority(i);
    if (p === 'high') _countByPri.high++;
    else if (p === 'low') _countByPri.low++;
    else _countByPri.medium++;
  });

  // TKT2 AC (Nova, REQ CAEL-0720-05): chips muestran 0 sin ocultarse — sin early-return por
  // conteo. _countByType/_countByPri ya quedan en 0 cuando _displayable está vacío.
  statsEl.innerHTML = `
    <div class="qinc-stats-types">
      ${_qiTypes.size < 4 ? `<button class="stat-type-chip stat-type-chip--all" data-qi-action="qi-clear-types" title="Mostrar todos los tipos">✕</button>` : ''}
      ${[['INC','INC'],['PRB','PRB'],['KE','KE'],['CHG','CHG']].map(([t, label]) =>
        `<button class="stat-type-chip tc-${t.toLowerCase()}${_qiTypes.has(t) ? ' active' : ''}" data-qi-action="qi-type" data-qi-type="${t}" title="Filtrar por tipo ${t}">\
<span class="tc-count">${_countByType[t]}</span><span class="tc-label">${label}</span></button>`
      ).join('')}
    </div>
    <div class="qinc-stats-priority">
      <button class="stat-pri-chip pri-high${_qiPriority.has('high') ? ' active' : ''}" data-qi-action="qi-priority" data-qi-priority="high" title="Filtrar SLA alta"><span class="spc-n">${_countByPri.high}</span> Alto</button>
      <button class="stat-pri-chip pri-medium${_qiPriority.has('medium') ? ' active' : ''}" data-qi-action="qi-priority" data-qi-priority="medium" title="Filtrar SLA media"><span class="spc-n">${_countByPri.medium}</span> Med</button>
      <button class="stat-pri-chip pri-low${_qiPriority.has('low') ? ' active' : ''}" data-qi-action="qi-priority" data-qi-priority="low" title="Filtrar SLA baja"><span class="spc-n">${_countByPri.low}</span> Bajo</button>
    </div>
    <input class="qinc-search-input" type="search" placeholder="Buscar en Q-INC…" value="${_qiQuery.replace(/"/g,'&quot;')}" data-qi-action="qi-search" aria-label="Buscar en Q-INC">
  `;

  // TKT2: delegación propia sobre #qinc-stats-bar — separada de _attachQIncDelegation (body),
  // porque el stats-bar ahora vive fuera de #qinc-panel-body. Flag previene acumulación entre
  // re-renders, mismo criterio que renderStats() de Backlog.
  if (!statsEl._qiStatsDelegationAttached) {
    statsEl._qiStatsDelegationAttached = true;
    statsEl.addEventListener('click', function _qiStatsClick(e) {
      const el = e.target.closest('[data-qi-action]');
      if (!el) return;
      const act = el.dataset.qiAction;
      if (act === 'qi-clear-types') {
        _nsReset('qinc');
        renderQIncPanel();
      } else if (act === 'qi-type') {
        _nsToggleType('qinc', el.dataset.qiType);
        renderQIncPanel();
      } else if (act === 'qi-priority') {
        _nsTogglePriority('qinc', el.dataset.qiPriority);
        renderQIncPanel();
      }
    });
    statsEl.addEventListener('input', function _qiStatsInput(e) {
      const input = e.target.closest('[data-qi-action="qi-search"]');
      if (!input) return;
      clearTimeout(statsEl._qiSearchTimer);
      statsEl._qiSearchTimer = setTimeout(() => {
        _nsSetQuery('qinc', input.value);
        renderQIncPanel();
      }, 200);
    });
  }
}

// TKT2 (REQ CAEL-0720-05): renderQIncPanel() ahora gestiona exclusivamente el cuerpo
// (#qinc-panel-body) — lista de ítems o empty-state, nunca ambos, nunca ninguno (AC Nova).
// El stats-bar (#qinc-stats-bar, estático) se renderiza siempre vía renderQIncStats(),
// independiente del conteo de ítems activos.
export function renderQIncPanel() {
  const body = document.getElementById('qinc-panel-body');
  if (!body) return;

  renderQIncStats();

  if (!_getActiveProjectFilter()) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Selecciona un proyecto</div>
        <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
      </div>`;
    return;
  }

  // Ítems ITIL del proyecto activo — excluir descartados del conteo y del render
  // [tmp:tkt-isqinc-unify]: _isQIncItem local eliminada — usa isQIncItem() importada desde locus-backlog-core.js.
  const allQInc = getIncidents().filter(isQIncItem);

  // Namespace propio 'qinc' — aislado del state global de Backlog
  const _qiTypes    = _nsGetTypes('qinc');
  const _qiPriority = _nsGetPriority('qinc');
  const _qiQuery     = (_nsGetQuery('qinc') || '').trim().toLowerCase();
  const _displayable = allQInc.filter(i => i.status !== 'descartado' && i.incidentStatus !== 'closed');

  // TKT2: único empty-state de "sin activos" — antes había dos ramas idénticas
  // (allQInc.length===0 y _displayable.length===0). _displayable ya cubre ambos casos: si
  // allQInc está vacío, _displayable también lo está.
  if (!_displayable.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚨</div>
        <div class="empty-state-title">No hay incidentes activos en Q-INC</div>
      </div>`;
    return;
  }

  const _matchesQiSearch = _qiQuery
    ? i => i.code.toLowerCase().includes(_qiQuery) || (i.title || '').toLowerCase().includes(_qiQuery) || (i.area || '').toLowerCase().includes(_qiQuery)
    : () => true;
  const filteredQInc = _displayable.filter(i => {
    const t = itemKind(i);
    const typeOk = t ? _qiTypes.has(t) : true;
    // TKT1 (REQ-centralizar-accesores-itil): mismo motivo que las otras 3 ocurrencias.
    const priOk  = _qiPriority.size === 0 || _qiPriority.has(incSlaPriority(i));
    return typeOk && priOk && _matchesQiSearch(i);
  });

  const _now = Date.now();
  function _qincItemClasses(item) {
    const classes = [];
    if (itemKind(item) === 'INC' && typeof item.slaDeadline === 'number') {
      if (item.slaDeadline < _now) classes.push('qinc-item--sla-vencido');
      else if (item.slaDeadline < _now + SLA_RIESGO_WINDOW_MS) classes.push('qinc-item--sla-riesgo');
    }
    return classes.join(' ');
  }

  function _buildQIncItemHtml(item) {
    // TKT-B2b: buildQIncItem reemplaza buildBacklogItem — modelo ITIL propio, sin item.status/sprint/parentId.
    // Clases SLA calculadas internamente por buildQIncItem — _qincItemClasses ya no aplica aquí.
    return buildQIncItem(item);
  }

  const _listHtml = filteredQInc.length === 0
    ? `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Sin resultados</div><div class="empty-state-hint">Ningún ítem coincide con el filtro activo.</div></div>`
    : (() => {
        const _activeItems   = filteredQInc.filter(i => _QINC_ACTIVE_STATUSES.includes(i.incidentStatus));
        const _resolvedItems = filteredQInc.filter(i => !_QINC_ACTIVE_STATUSES.includes(i.incidentStatus));
        let h = '';
        if (_activeItems.length) {
          h += '<div class="qinc-section"><div class="qinc-section-header">Activos</div><div class="items-grid">';
          _activeItems.forEach(item => { h += _buildQIncItemHtml(item); });
          h += '</div></div>';
        }
        if (_resolvedItems.length) {
          h += '<div class="qinc-section"><div class="qinc-section-header">Resueltos</div><div class="items-grid">';
          _resolvedItems.forEach(item => { h += _buildQIncItemHtml(item); });
          h += '</div></div>';
        }
        return h;
      })();

  body.innerHTML = _listHtml;

  // TKT-B2b: _attachQIncDelegation — único listener sobre #qinc-panel-body.
  // TKT3 (REQ CAEL-0720-05): ya no unifica stats-bar (qi-clear-types/qi-type/qi-priority/
  // qi-search) ni qi-export-incidents — ambos migraron fuera de #qinc-panel-body (stats-bar
  // propia arriba; export vía shell:export-qinc, ver final del archivo). Unifica solo:
  // copy-code de cards buildQIncItem y qi-toggle-comportamiento.
  // Registrado una sola vez sobre body via flag — persiste entre re-renders de innerHTML.
  _attachQIncDelegation(body);
}

// TKT-B2b: delegación unificada para #qinc-panel-body.
// Parámetro container: el elemento sobre el que se registra el listener (siempre #qinc-panel-body).
// TKT3 (REQ CAEL-0720-05): maneja únicamente copy-code de cards ITIL y expand de
// comportamientoActual — filtros de stats-bar y export salieron de aquí (ver renderQIncStats()
// y listener shell:export-qinc al final del archivo).
// AC: exactamente un listener activo — flag _qiDelegationAttached previene acumulación en re-renders.
function _attachQIncDelegation(container) {
  if (!container || container._qiDelegationAttached) return;
  container._qiDelegationAttached = true;

  container.addEventListener('click', function _qiClick(e) {
    // --- copy-code: patrón idéntico al Backlog principal ---
    // Orden crítico: debe evaluarse ANTES que qi-open-panel — el botón copy-code vive anidado
    // dentro de .qinc-item-header, que ahora también lleva data-qi-action="qi-open-panel"
    // (ver buildQIncItem() mod:115). Si qi-open-panel se evaluara primero, closest() del click
    // en copy-code también matchearía el header ancestro y el copiado nunca se ejecutaría.
    const copyBtn = e.target.closest('[data-action="copy-code"]');
    if (copyBtn) {
      e.stopPropagation();
      const code = copyBtn.dataset.code;
      if (code) {
        navigator.clipboard.writeText(code).catch(() => {});
        copyBtn.classList.add('is-copied');
        setTimeout(() => copyBtn.classList.remove('is-copied'), 1500);
      }
      return;
    }

    // --- qi-open-panel: paridad con .bitem-header — abre el IDP (Item Detail Panel) ---
    // TKT (paridad IDP Q-INC, 2026-07-18): import dinámico — locus-backlog-panel.js ya importa
    // renderBacklogList de este archivo; un import estático de openItemPanel aquí crearía un
    // ciclo ESM. Mismo patrón ya documentado en locus-ui-shell.js (navigateToItem dinámico).
    const openPanelTrigger = e.target.closest('[data-qi-action="qi-open-panel"]');
    if (openPanelTrigger) {
      const card = openPanelTrigger.closest('.qinc-item[data-code]');
      const code = card ? card.dataset.code : null;
      if (code) import('./locus-backlog-panel.js').then(m => m.openItemPanel(code));
      return;
    }

    // --- qi-toggle-comportamiento: expandir/colapsar comportamientoActual ---
    // Fix INC (Q-INC render audit, 2026-07-18): comportEl ahora es el <button> trigger
    // (data-qi-action vive en el botón, no en el contenido — ver buildQIncItem() mod:114
    // de locus-backlog-item.js). El contenido real se resuelve vía aria-controls.
    const comportEl = e.target.closest('[data-qi-action="qi-toggle-comportamiento"]');
    if (comportEl) {
      const targetId = comportEl.getAttribute('aria-controls');
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;
      const nowExpanded = target.classList.toggle('expanded');
      comportEl.setAttribute('aria-expanded', String(nowExpanded));
      return;
    }

  });

  // Enter/Espacio sobre .qinc-item-header (role="button" tabindex="0", div no nativo) — mismo
  // criterio que _blListKeydown para .bitem-header (locus-backlog-item.js L378-386). El botón
  // qi-toggle-comportamiento no necesita esto: es un <button> nativo, activación por teclado ya
  // viene del navegador.
  container.addEventListener('keydown', function _qiKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('[data-qi-action="qi-open-panel"]');
    if (!trigger) return;
    e.preventDefault();
    trigger.click();
  });
}

// TKT (REQ-[pendiente-ID]): listener shell:render-qinc — despachado por switchSubTab en locus-ui-shell.js
// Proyecto cambiado con sub-tab Q-INC activo → re-render automático vía este evento.
window.addEventListener('shell:render-qinc', () => { renderQIncPanel(); });

// Re-render del panel Q-INC cuando el backlog cambia y el tab Incidentes está activo.
// TKT2 (REQ CAEL-01): antes checkeaba #sspanel-qinc.active (sub-tab eliminado, el ID ya no existe
// en el DOM) — corregido a getCurrentTab() === 'incidentes', mismo criterio que el resto del shell
// usa para saber qué tab de primer nivel está activo (ver locus-ui-shell.js currentTab).
window.addEventListener('shell:backlog-render-dirty', () => {
  if (getCurrentTab() === 'incidentes') renderQIncPanel();
});

// TKT3 (REQ CAEL-0720-05): descarga directa de _${prefix}-incidents.md — misma lógica que antes
// vivía en el bloque qi-export-incidents de _attachQIncDelegation (dentro de #qinc-panel-body).
// Ahora disparada por #btn-export-qinc (toolbar estático, #qinc-toolbar en index.html) vía el
// evento shell:export-qinc despachado desde locus-ui-shell.js — mismo patrón que
// shell:export-backlog en locus-backlog-generator.js. Mismo generador (_generateIncidentsMd) y
// helper de prefijo (_docPrefix) que ya usaba TKT3 (REQ CAEL-0720-01) — sin cambio de lógica,
// solo de disparador.
window.addEventListener('shell:export-qinc', () => {
  const content = _generateIncidentsMd();
  const filename = `_${_docPrefix()}-incidents.md`;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
});
