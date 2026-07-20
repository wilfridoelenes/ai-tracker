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

export function renderQIncPanel() {
  const body = document.getElementById('qinc-panel-body');
  if (!body) return;

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
  // TKT-202607-056 (histórico): concat(getItems()) se agregó porque el universo estaba
  // incompleto en ese momento — ITIL vivía parcialmente en ambos arrays.
  // TKT3 (REQ-refactor-item-shape-itil-scrum, parent [pendiente-ID] — confirmar código real en
  // Locus): concat eliminado. _setITEMS()/_setIncidents() (locus-backlog-core.js) garantizan
  // desde TKT2 de este mismo REQ que ningún ítem ITIL persiste en ITEMS — el universo Q-INC
  // vive exclusivamente en INCIDENTS. Este cambio alinea renderQIncPanel() con
  // _getCountableBaseForSubtab('qinc'), que ya leía solo INCIDENTS (TKT-202607-005) — antes de
  // este TKT ambos módulos computaban el universo Q-INC de forma distinta.
  const allQInc = getIncidents().filter(isQIncItem);

  if (!allQInc.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚨</div>
        <div class="empty-state-title">No hay incidentes activos en Q-INC</div>
      </div>`;
    return;
  }

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

  // Empty state cuando no hay ítems o todos closed/descartado se cubre arriba (allQInc.length).
  // Si _displayable queda vacío (todos closed/descartado) pero allQInc tiene ítems, mostrar mismo empty state.
  if (!_displayable.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚨</div>
        <div class="empty-state-title">No hay incidentes activos en Q-INC</div>
      </div>`;
    return;
  }

  const _statsBarHtml = `
    <div class="qinc-stats-bar" id="qinc-stats-bar">
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
      <button class="qinc-export-btn" data-qi-action="qi-export-incidents" aria-label="Exportar incidents.md" title="Exportar incidents.md">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span class="qinc-export-btn-label">Exportar incidents.md</span>
      </button>
    </div>`;

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

  body.innerHTML = _statsBarHtml + _listHtml;

  // TKT-B2b: _attachQIncDelegation — único listener sobre #qinc-panel-body.
  // Unifica: stats-bar (qi-*), copy-code de cards buildQIncItem, y qi-toggle-comportamiento.
  // Registrado una sola vez sobre body via flag — persiste entre re-renders de innerHTML.
  // _attachBacklogListDelegation no se modifica: sigue escuchando sobre #backlog-list sin cambios.
  _attachQIncDelegation(body);
}

// TKT-B2b: delegación unificada para #qinc-panel-body.
// Parámetro container: el elemento sobre el que se registra el listener (siempre #qinc-panel-body).
// Un único listener maneja: filtros de stats-bar, copy-code de cards ITIL, expand de comportamientoActual.
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

    // --- qi-export-incidents: descarga directa de _${prefix}-incidents.md, sin overlay ---
    // TKT3 (REQ CAEL-0720-01) AC2: mismo generador (_generateIncidentsMd, TKT1) y mismo helper
    // de prefijo (_docPrefix) que usa locus-map-generator.js — evaluado antes que el bloque
    // genérico de stats-bar porque no comparte su lógica de re-render.
    const exportBtn = e.target.closest('[data-qi-action="qi-export-incidents"]');
    if (exportBtn) {
      const content = _generateIncidentsMd();
      const filename = `_${_docPrefix()}-incidents.md`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // --- stats-bar: filtros de tipo, prioridad, clear ---
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

  // Search input — input event (no click)
  container.addEventListener('input', function _qiInput(e) {
    const input = e.target.closest('[data-qi-action="qi-search"]');
    if (!input) return;
    clearTimeout(container._qiSearchTimer);
    container._qiSearchTimer = setTimeout(() => {
      _nsSetQuery('qinc', input.value);
      renderQIncPanel();
    }, 200);
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
