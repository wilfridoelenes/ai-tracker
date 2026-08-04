// [PP] mod:8 · autor:Rune · 2026-08-03 UTC-6
// Hallazgo fuera de scope (detectado en la misma sesión que TKT3, resuelto en sesión —
// Excepción de resolución directa: dueño presente, nivel Patch, sin bifurcación de founder):
// _initQBacklogToolbar → botón "Colapsar todo" no incluía .bl-active-group en su
// querySelectorAll ni .bl-active-header en la búsqueda de header para aria-expanded — el grupo
// "Activos" (TKT3, este mismo mod) quedaba fuera del colapso masivo. Agregado a ambos
// selectores, mismo patrón que .bl-done-group/.qbacklog-draft-group.
// TKT3 (REQ CAEL-0803-03, design_intent: qbacklog_activos_group_mockup): showActiveGroup:true
// agregado a la llamada de _renderZonePanel — habilita el grupo colapsable .bl-active-group
// para los ítems activos de este panel (tercer contenedor junto a Borradores/Terminados).
// Q-DISC no lo declara — sin cambio de comportamiento ahí, fuera de scope de este TKT.
// [PP] mod:6 · autor:Rune · 2026-07-30 20:15 UTC-6
// TKT1 (REQ-202607-alineacion-qbacklog-qdisc, design_intent: alineacion-render-qbacklog-qdisc):
// _initQBacklogToolbar agregado — Q-Backlog era el único panel de Backlog sin botón de colapsar
// ni búsqueda propia (mismo criterio ya vigente en Q-DISC/Backlog list/Histórico). Colapsa/
// expande .bl-done-group + .qbacklog-draft-group en conjunto — ambos ya comparten el mecanismo
// .is-collapsed (ver locus-backlog-zone-engine.js mod:13), consultados en vivo por
// querySelectorAll en el momento del click, mismo patrón que _initQDiscToolbar
// (locus-backlog-qdisc.js). Búsqueda reusa _nsSetQuery/renderQBacklogPanel — mismo mecanismo
// de namespace ya usado por Q-DISC.
// [PP] mod:5 · autor:Rune · 2026-07-23 22:15 UTC-6
// TKT-202607-072 (REQ-202607-019): showDraftGroup:true + isZoneBroad:_isQBacklog agregados a la
// llamada de _renderZonePanel — habilita el grupo de ítems draft:true en este panel. Sin cambio
// de comportamiento fuera de eso.
// [PP] mod:4 · autor:Rune · 2026-07-21 UTC-6
// TKT3 (REQ-202607-010): renderQBacklogPanel declara statsBarId:'qbacklog-stats-bar' —
// habilita la separación de nodos en _renderZonePanel (locus-backlog-zone-engine.js mod:6).
// Housekeeping (Excepción de resolución directa — dueño presente, nivel Patch, sin
// bifurcación): eliminada línea muerta querySelectorAll('.tpl-nav-btn') — clase sin
// referencias en el DOM desde la limpieza de locus-proyectos.css (REQ CAEL-01). No-op sin
// cambio de comportamiento — el toggle de .active real de este botón lo hace switchSubTab()
// (locus-ui-shell.js), que dispara en el mismo click vía listener delegado independiente.
// [PP] mod:1 · autor:Rune · 2026-07-05 UTC-6
// locus-backlog-qbacklog.js
// Responsabilidad: renderQBacklogPanel — render del sub-tab Q-Backlog (REQ/TKT sin sprint
//   asignado) — + su listener de sub-tab, su toggle de "Terminados" y su re-render reactivo
//   sobre shell:backlog-render-dirty. No conoce Q-DISC ni Q-INC.
// Dependencias: locus-backlog-core.js · locus-backlog-zone-engine.js
//
// REQ refactor-zonas TKT3: extraído de locus-backlog-render.js (mod:72) sin cambio de
// comportamiento observable. Import side-effect requerido en main.js — este módulo no exporta
// nada que otro módulo necesite importar (renderQBacklogPanel no tiene consumidor externo, ver
// auditoría del REQ), pero su IIFE de listener y su llamada a _attachDoneGroupToggle deben
// ejecutar al cargar la app.

import { _isQBacklogActive, _isQBacklog, _nsSetQuery } from './locus-backlog-core.js';
import { _renderZonePanel, _attachDoneGroupToggle } from './locus-backlog-zone-engine.js';

// B-202606-052 → TKT-C1: renderQBacklogPanel — sub-tab Backlog (Q-Backlog: REQ/TKT).
// TKT3 (REQ-202607-010, design_intent: QBacklog-header-unified-homologacion): statsBarId
// declarado — el stats-bar se renderiza en #qbacklog-stats-bar (sticky, dentro de
// .bl-header-unified, index.html) en vez de dentro de bodyId. bodyId queda con solo la
// lista/empty-state, en su propio contenedor visual fuera del sticky.
export function renderQBacklogPanel() {
  _renderZonePanel({
    bodyId: 'qbacklog-panel-body',
    statsBarId: 'qbacklog-stats-bar',
    badgeId: 'tpl-badge-qbacklog',
    nsKey: 'qbacklog',
    isZone: _isQBacklogActive,
    showTypeChips: true,
    emptyTitle: 'No hay ítems pendientes',
    // TKT-202607-072 (REQ-202607-019): showDraftGroup habilita el grupo colapsable de
    // draft:true. isZoneBroad es _isQBacklog (sin la condición !i.draft de _isQBacklogActive) —
    // exclusivo de Q-Backlog, Q-DISC no declara ninguno de los dos.
    showDraftGroup: true,
    isZoneBroad: _isQBacklog,
    // TKT3 (REQ CAEL-0803-03): grupo colapsable "Activos" — tercer contenedor junto a
    // Borradores/Terminados, mismo patrón visual (header + chevron + contador).
    showActiveGroup: true
  });
}

// B-202606-052 → TKT-C1: listener sub-tab Backlog (Q-Backlog) — reemplaza al listener único
// sstab-btn-icebox.
// TKT (REQ CAEL-04): listener local eliminado — duplicaba el toggle de clases que
// switchSubTab() (locus-ui-shell.js) ya hace vía su array fijo de sub-tabs, y llamaba
// renderQBacklogPanel() directamente en vez de escuchar el evento que switchSubTab() ya
// despacha para este sub-tab. Consolidado a un solo camino de render.
window.addEventListener('shell:render-qbacklog', renderQBacklogPanel);

// Toggle del bloque "Terminados" — adjuntado una sola vez al cargar el módulo (shell estático).
// Único caller vivo de _attachDoneGroupToggle: qdisc no tiene #qdisc-done-group en el DOM desde
// REQ congruencia-qdisc (index.html mod:101) — ver locus-backlog-qdisc.js.
_attachDoneGroupToggle('qbacklog');

// TKT1 (REQ-202607-alineacion-qbacklog-qdisc): toolbar de colapsar-todo + búsqueda —
// #qbacklog-toolbar es shell estático en index.html, dentro de #qbacklog-header-unified, nunca
// se recrea — wiring una sola vez al cargar el módulo, mismo criterio que _initQDiscToolbar
// (locus-backlog-qdisc.js), sin guard _wired por render. Colapsa/expande .bl-done-group +
// .qbacklog-draft-group juntos — ambos comparten el mecanismo .is-collapsed (ver
// locus-backlog-zone-engine.js) desde este mismo REQ; consultados en vivo por querySelectorAll
// en el momento del click porque .qbacklog-draft-group se recrea en cada render (no es shell
// estático como .bl-done-group).
function _initQBacklogToolbar() {
  const collapseBtn = document.getElementById('qbacklog-collapse-all-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      const groups = document.querySelectorAll('#sspanel-qbacklog .bl-done-group, #sspanel-qbacklog .qbacklog-draft-group, #sspanel-qbacklog .bl-active-group');
      if (!groups.length) return;
      const anyExpanded = Array.from(groups).some(g => !g.classList.contains('is-collapsed'));
      groups.forEach(group => {
        group.classList.toggle('is-collapsed', anyExpanded);
        const header = group.querySelector('.bl-done-header, .qbacklog-draft-header, .bl-active-header');
        if (header) header.setAttribute('aria-expanded', String(!anyExpanded));
      });
      collapseBtn.setAttribute('aria-pressed', String(anyExpanded));
      const label = collapseBtn.querySelector('.bl-collapse-btn-label');
      if (label) label.textContent = anyExpanded ? 'Expandir todo' : 'Colapsar todo';
    });
  }

  const searchInput = document.getElementById('qbacklog-search-input');
  const searchClear = document.getElementById('qbacklog-search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      _nsSetQuery('qbacklog', searchInput.value);
      renderQBacklogPanel();
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (!searchInput) return;
      searchInput.value = '';
      _nsSetQuery('qbacklog', '');
      renderQBacklogPanel();
      searchInput.focus();
    });
  }
}
_initQBacklogToolbar();

// B-202606-052 → TKT-C1: re-render del panel Q-Backlog cuando el backlog cambia y el panel
// está activo.
window.addEventListener('shell:backlog-render-dirty', () => {
  const panel = document.getElementById('sspanel-qbacklog');
  if (panel && panel.classList.contains('active')) renderQBacklogPanel();
});
