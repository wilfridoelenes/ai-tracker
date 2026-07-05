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
export function renderQBacklogPanel() {
  _renderZonePanel({
    bodyId: 'qbacklog-panel-body',
    badgeId: 'tpl-badge-qbacklog',
    nsKey: 'qbacklog',
    isZone: _isQBacklogActive,
    showTypeChips: true,
    emptyTitle: 'No hay ítems pendientes'
  });
}

// B-202606-052 → TKT-C1: listener sub-tab Backlog (Q-Backlog) — reemplaza al listener único
// sstab-btn-icebox.
(function _initQBacklogSubTab() {
  const btn = document.getElementById('sstab-btn-qbacklog');
  if (!btn) return;
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tpl-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.session-subpanel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('sspanel-qbacklog');
    if (panel) panel.classList.add('active');
    renderQBacklogPanel();
  });
})();

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
