// [PP] mod:4 · autor:Rune · 2026-07-06 UTC-6
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
//
// TKT-202607-011 (TKT3 REQ-202607-006): renderQDiscPanel pasa showAreaChips:true a
//   _renderZonePanel — único caller que lo activa (qbacklog no lo declara, default false).
// TKT-202607-013 (TKT5 REQ-202607-006): _renderQDiscGroomingBanner — banner de grooming
//   pendiente, mismo patrón de shell estático que _renderQDiscLimitIndicator (rellena/vacía un
//   nodo que ya existe en index.html, nunca lo crea ni destruye).

import { _isQDiscActive, getItems, QDISC_ACTIVE_LIMIT } from './locus-backlog-core.js';
import { _renderZonePanel, _zoneStaleness } from './locus-backlog-zone-engine.js';

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

// TKT-202607-013 (TKT5 REQ-202607-006): rellena #qdisc-grooming-banner (shell estático, ver
// index.html) con el aviso de grooming pendiente. Universo idéntico a _isQDiscActive — mismo
// criterio que el indicador de límite, para que ambas señales cuenten sobre el mismo conjunto
// (AC de coherencia del REQ). _zoneStaleness ya excluye lo no aplicable (retorna null fuera de
// umbral) — el umbral de DISC es 30 días (zone-engine.js). Sin staleness → textContent = '' y
// .qdisc-grooming-banner:empty{display:none} (locus-backlog.css) → cero elementos DOM visibles,
// consistente con AC-2. No hay pluralización real en la plantilla — ambos números son sustitución
// directa (ver CHECKPOINT, AC "edge case singular" no cambia palabras, solo valores).
function _renderQDiscGroomingBanner() {
  const el = document.getElementById('qdisc-grooming-banner');
  if (!el) return;
  const activeItems = getItems().filter(_isQDiscActive);
  const staleCount = activeItems.filter(i => _zoneStaleness(i) !== null).length;
  if (staleCount === 0) { el.textContent = ''; return; }
  el.textContent = `${activeItems.length} discoveries requieren grooming antes de abrir sprint — ${staleCount} con más de 30 días sin movimiento`;
}

// B-202606-052 → TKT-C1: renderQDiscPanel — sub-tab Discoveries (Q-DISC: DISC).
export function renderQDiscPanel() {
  _renderZonePanel({
    bodyId: 'qdisc-panel-body',
    badgeId: 'tpl-badge-qdisc',
    nsKey: 'qdisc',
    isZone: _isQDiscActive,
    showTypeChips: false,
    // TKT-202607-011: único caller que activa showAreaChips — qbacklog no lo declara.
    showAreaChips: true,
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
  // TKT-202607-013: misma razón — señal independiente del universo filtrado por chips/búsqueda.
  _renderQDiscGroomingBanner();
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
