// [PP] mod:2 · autor:Rune · 2026-07-13 UTC-6
// locus-item-navigator.js
// Responsabilidad: navigateToItem() — router transversal de navegación por código de ítem.
// Usado por 5+ módulos (locus-analytics-render.js, locus-backlog-item.js,
// locus-backlog-sprints.js, locus-command-palette.js, locus-notifications.js, locus-ui-shell.js).
// TKT1 (REQ CAEL-04 · Hallazgo fuera de scope, sesión previa): extraído de
// locus-backlog-sprints.js — la función no gestionaba ningún dato de sprints
// (__BR-Ecosystem §7 — "una función va en el módulo que gestiona el dato que toca").
// Movida verbatim, sin cambio de lógica interna ni de firma: navigateToItem(code) → void.
//
// TKT1 (REQ CAEL-05): resuelta la deuda heredada de TKT1/REQ CAEL-04 — activeStatuses ya no es
// identificador libre. _getActiveStatuses() (locus-backlog-core.js L2667) retorna la referencia
// real del Set interno del módulo — .add()/.has() sobre el valor retornado muta el mismo estado
// que antes, sin cambio de comportamiento.
//
// locus-ui-shell.js consume esta función vía import() dinámico (no import estático) — evita ciclo
// ESM, ya que este módulo importa switchTab/switchSubTab de locus-ui-shell.js. Mismo patrón (b)
// ya documentado en el header de locus-ui-shell.js para este tipo de caso.

import { itemKind, getItems, getIncidents, updateStatusFilterUI, _getActiveStatuses } from './locus-backlog-core.js'; // TKT1 (REQ CAEL-05): _getActiveStatuses agregada — reemplaza identificador libre activeStatuses
import { switchTab, switchSubTab } from './locus-ui-shell.js';

// R-[pendiente-ID]: navegar a un ítem del backlog por código — cambia a tab backlog, sub-tab backlog, hace scroll y pulsa highlight
export function navigateToItem(code) {
  if (!code) return;
  // TKT3 (REQ CAEL-01): distinguir ítems ITIL (INC/PRB/KE/CHG, viven en getIncidents()) de
  // REQ/TKT/DISC (getItems()) — antes navigateToItem asumía siempre getItems()+'backlog', un
  // código ITIL nunca se encontraba ahí y el deep-link fallaba en silencio (item undefined,
  // early return implícito en el bloque de activeStatuses, pero switchTab('backlog') igual
  // se ejecutaba y el setTimeout de scroll no encontraba .item[data-code] porque el card real
  // usa la clase .qinc-item, no .item — ver _Locus-css-ref buildQIncItem()).
  const incItem = getIncidents().find(i => i.code === code);
  if (incItem) {
    switchTab('incidentes');
    setTimeout(() => {
      const el = document.querySelector(`.qinc-item[data-code="${CSS.escape(code)}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bitem--nav-highlight');
      setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1400);
    }, 120);
    return;
  }
  // Asegurar que el filtro de status incluye el status del ítem
  const item = getItems().find(i => i.code === code);
  if (item && !_getActiveStatuses().has(item.status)) {
    _getActiveStatuses().add(item.status);
    updateStatusFilterUI();
  }
  // INC-[pendiente-ID] (triggered_by análisis de subtab Discoveries): DISC vive en
  // #sspanel-qdisc, no en #sspanel-backlog — buildBacklogItem() (locus-backlog-qdisc.js)
  // reutiliza el mismo shell .item que TKT/REQ, así que el selector de scroll no cambia,
  // solo el sub-tab activo antes de buscarlo. Sin esta rama, un DISC caía en el
  // switchSubTab('backlog') genérico y el elemento quedaba en un panel inactivo.
  switchTab('backlog');
  switchSubTab(itemKind(item) === 'DISC' ? 'qdisc' : 'backlog');
  // Esperar render y hacer scroll
  setTimeout(() => {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('bitem--nav-highlight');
    setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1400);
  }, 120);
}
