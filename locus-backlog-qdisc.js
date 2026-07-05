// [PP] mod:2 · autor:Rune · 2026-07-05 UTC-6
// locus-backlog-qdisc.js
// Responsabilidad: renderQDiscPanel — render del sub-tab Q-DISC (Discoveries: DISC, único tipo
//   aceptado — __BR-Ecosystem §5) — + su listener de sub-tab y su re-render reactivo sobre
//   shell:backlog-render-dirty. No conoce Q-Backlog ni Q-INC.
// Dependencias: locus-backlog-core.js · locus-backlog-zone-engine.js
//
// REQ refactor-zonas TKT4: extraído de locus-backlog-render.js (mod:72) sin cambio de
// comportamiento observable. Sin bloque "Terminados": DISC nunca alcanza status 'done'
// (ver REQ congruencia-qdisc previo — hasDoneState/hasChildren:false, sin _attachDoneGroupToggle
// ('qdisc') llamado nunca desde este módulo).
//
// TKT-202607-012 (TKT4 REQ-202607-006): #qdisc-done-group era shell HTML muerto en index.html
// (sin JS que lo poblara desde este módulo) — eliminado. _renderZonePanel (zone-engine.js) sigue
// resolviendo `${nsKey}-done-group` a null para 'qdisc' sin romperse — guard ya existente, sin
// cambio de firma ni de comportamiento en el motor compartido.

import { _isQDiscActive } from './locus-backlog-core.js';
import { _renderZonePanel } from './locus-backlog-zone-engine.js';

// B-202606-052 → TKT-C1: renderQDiscPanel — sub-tab Discoveries (Q-DISC: DISC).
export function renderQDiscPanel() {
  _renderZonePanel({
    bodyId: 'qdisc-panel-body',
    badgeId: 'tpl-badge-qdisc',
    nsKey: 'qdisc',
    isZone: _isQDiscActive,
    showTypeChips: false,
    emptyTitle: 'No hay discoveries pendientes',
    emptyIcon: '💡',
    // TKT1 REQ hide-done-qdisc: DISC nunca alcanza status 'done' (__BR-Ecosystem §5) — bloque
    // Terminados era código muerto. DISC no tiene depends_on ni jerarquía R→hijos.
    hasDoneState: false,
    hasChildren: false
  });
}

// B-202606-052 → TKT-C1: listener sub-tab Discoveries (Q-DISC) — reemplaza al listener único
// sstab-btn-icebox.
(function _initQDiscSubTab() {
  const btn = document.getElementById('sstab-btn-qdisc');
  if (!btn) return;
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tpl-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.session-subpanel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('sspanel-qdisc');
    if (panel) panel.classList.add('active');
    renderQDiscPanel();
  });
})();

// B-202606-052 → TKT-C1: re-render del panel Q-DISC cuando el backlog cambia y el panel
// está activo.
window.addEventListener('shell:backlog-render-dirty', () => {
  const panel = document.getElementById('sspanel-qdisc');
  if (panel && panel.classList.contains('active')) renderQDiscPanel();
});
