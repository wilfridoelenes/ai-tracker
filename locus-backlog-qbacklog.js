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

import { _isQBacklogActive } from './locus-backlog-core.js';
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
    emptyTitle: 'No hay ítems pendientes'
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

// B-202606-052 → TKT-C1: re-render del panel Q-Backlog cuando el backlog cambia y el panel
// está activo.
window.addEventListener('shell:backlog-render-dirty', () => {
  const panel = document.getElementById('sspanel-qbacklog');
  if (panel && panel.classList.contains('active')) renderQBacklogPanel();
});
