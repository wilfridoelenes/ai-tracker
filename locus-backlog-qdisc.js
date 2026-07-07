// [PP] mod:3 · autor:Rune · 2026-07-06 UTC-6
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

import { _isQDiscActive, getItems, QDISC_ACTIVE_LIMIT } from './locus-backlog-core.js';
import { _renderZonePanel } from './locus-backlog-zone-engine.js';

// TKT-202607-010: rellena #qdisc-limit-indicator (shell estático, ver index.html) con el
// conteo de DISCs activos sobre el límite — mismo universo que _isQDiscActive (excluye
// descartado/promoted/historico). Color neutro bajo el límite, advertencia al llegar a él.
function _renderQDiscLimitIndicator() {
  const el = document.getElementById('qdisc-limit-indicator');
  if (!el) return;
  const count = getItems().filter(_isQDiscActive).length;
  el.textContent = `${count} / ${QDISC_ACTIVE_LIMIT}`;
  el.classList.toggle('qdisc-limit--warn', count >= QDISC_ACTIVE_LIMIT);
}

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
  // TKT-202607-010: indicador independiente del universo filtrado de _renderZonePanel —
  // siempre refleja el conteo real de activos, incluso sin proyecto seleccionado (getItems()
  // ya resuelve vacío en ese caso, indicador cae a "0 / 15" sin error).
  _renderQDiscLimitIndicator();
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
