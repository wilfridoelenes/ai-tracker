// [PP] mod:21 · autor:Rune · 2026-08-23 UTC-6
// TKT-202608-441 (REQ-202608-180), patch tras TKT3 CAEL-08231830-01: self-heal pasa a consumir
// _selfHealReqStatuses(zoneItems) — scoped a la zona, no getItems() completo. Ver detalle inline
// junto al bloque. contract_update: n/a — no exporta función nueva ni cambia firma propia.
// TKT-202608-432 (REQ-202608-175, TKT1): _renderZonePanel gana opts.sortComparator opcional —
// permite a qdisc.js reemplazar el sort tipo/prioridad por defecto con un comparator propio
// (antigüedad) sin tocar el comportamiento de qbacklog, que nunca lo declara. Ver detalle inline
// junto al bloque de sort más abajo. contract_update: sí — opt nuevo, sin cambio de firma.
// [PP] mod:18 · autor:Rune · 2026-08-14 21:30 UTC-6
// TKT (ref_id CAEL-08142200-04, parent ref_id CAEL-08142200-01): _activeGroupWrap() corrige
// agrupación — label vuelve a ser hijo directo del header (izquierda), .bl-active-header-meta
// ahora envuelve count+chevron (derecha), igualando la estructura real de
// .qdisc-status-header-meta. Mayúscula del label es CSS puro (Nova, mod:158) — sin cambio aquí.
// [PP] mod:17 · autor:Rune · 2026-08-14 20:25 UTC-6
// TKT2 (ref_id CAEL-08142000-03, parent ref_id CAEL-08142000-01): _activeGroupWrap() — chevron
// ▾ legacy reemplazado por svg.chevron.bl-active-chevron (Patrón A-13), agrupado con label+count
// en .bl-active-header-meta para que .bl-active-header (justify-content:space-between, TKT1 de
// Nova) empuje el chevron al extremo derecho — mismo criterio que .qbacklog-draft-header.
// _attachActiveGroupToggle sin cambios — sigue togueando aria-expanded/.is-collapsed igual.
// [PP] mod:16 · autor:Rune · 2026-08-12 09:40 UTC-6
// TKT-202608-328 (REQ-202608-131, TKT2 · Migración Backlog): .qbacklog-draft-chevron
// migrado a svg.chevron (Patrón A-13, línea ~212). Color ámbar conservado sin cambio —
// no_incluye del TKT. Rotación retirada de aquí, gobernada por [aria-expanded] .chevron
// en locus-base.css (TKT-202608-327).
// TKT (founder, sesión directa): fila del grupo de drafts (Pendiente de validación Finn)
// rediseñada — el chip de tipo (.item-type-pill, solo "REQ"/"TKT") y el código quedaban
// separados, repitiendo visualmente el tipo (chip "TKT" + texto "TKT-202608-262 · ..."). Se
// fusiona en un solo chip clickeable .qbacklog-draft-code-chip que muestra el ID completo y
// copia al portapapeles al click — mismo patrón de estado (icono ti-copy→ti-check, color verde,
// reset a los 1.5s) ya usado en .qinc-item-code-chip (locus-incidents-item.js, no tocado por
// este TKT — mecanismo replicado, no importado, para no crear dependencia cross-módulo por un
// solo patrón visual). Colores por tipo reusan los tokens ya declarados en .item-type-pill.REQ/
// .item-type-pill.TKT (locus-backlog.css) — sin token nuevo. Listener de copia agregado a la
// misma delegación de click ya adjunta a `body` por _attachDraftGroupToggle — sin nuevo listener
// de body, un solo guard _zpDraftDelegationAttached cubre toggle + copy.
// [PP] mod:14 · autor:Rune · 2026-08-03 UTC-6
// TKT2 (REQ CAEL-0803-03, design_intent: qbacklog_activos_group_mockup): grupo colapsable
// .bl-active-* envuelve la lista de ítems activos (items-grid + sus dos empty-states internos)
// dentro de _renderZonePanel — gateado por opts.showActiveGroup, opcional, default false. Sin
// declararlo (Q-DISC — renderQDiscPanel no lo pasa), comportamiento anterior exacto preservado,
// sin wrapper. Solo locus-backlog-qbacklog.js lo declara true — fuera de scope de este TKT
// extenderlo a Q-DISC, que ya resuelve sus 3 grupos con .qdisc-status-group.
// Contador del header = activeZoneItems.length (universo sin filtrar, mismo criterio que el
// badge del sub-tab) — no filteredItems.length, para que el header no oculte cuántos ítems
// activos tiene la zona cuando hay un filtro parcial aplicado.
// Header siempre presente, incluso con activeZoneItems.length===0 — mismo criterio que
// .qdisc-status-header (contador "0" visible), a diferencia de .qbacklog-draft-group (se omite
// del DOM en 0 ítems). El grupo es dinámico (recreado en cada render vía body.innerHTML, a
// diferencia de .bl-done-group que es shell estático) — toggle delegado sobre `body`, mismo
// patrón que _attachDraftGroupToggle. contract_update: sí — _renderZonePanel gana un opt nuevo,
// opcional, sin cambio de firma para callers existentes (Q-DISC no impactado).
// [PP] mod:13 · autor:Rune · 2026-07-30 20:15 UTC-6
// TKT1 (REQ-202607-alineacion-qbacklog-qdisc, design_intent: alineacion-render-qbacklog-qdisc):
// _attachDoneGroupToggle migrado de dos clases sueltas (.collapsed en .bl-done-arrow y en
// .bl-done-body por separado, sin cascada CSS) a .is-collapsed en el wrapper .bl-done-group —
// mismo mecanismo que .qdisc-status-group y .qbacklog-draft-group (chevron + body cascadean
// desde una sola clase en el ancestro). Blast radius confirmado acotado a Q-Backlog: grep en
// todo el repo confirma un solo caller vivo de _attachDoneGroupToggle (locus-backlog-qbacklog.js
// _attachDoneGroupToggle('qbacklog')) — el bloque Terminados de Histórico ya no usa este
// mecanismo desde REQ refactor-zonas TKT5 (ver comentario en locus-backlog-render.js L155-168),
// por lo tanto no hay blast radius compartido que confirmar con Rune antes de tocar (bifurcación
// A del diagnóstico de Nova resuelta sin riesgo). Persistencia en localStorage conservada sin
// cambio (`backlog-${prefix}-done-open`). Rotación del chevron (▾→-90°) pasa a ser 100% CSS
// (`.bl-done-group.is-collapsed .bl-done-arrow`), sin swap de texto ▾/▸ — mismo criterio que
// .qdisc-status-chevron. aria-expanded agregado (antes ausente) para paridad de accesibilidad
// con .qdisc-status-header. contract_update: no — misma firma _attachDoneGroupToggle(prefix).
// [PP] mod:12 · autor:Rune · 2026-07-30 01:10 UTC-6
// TKT-202607-186 (REQ-202607-064): chip Total en _renderZonePanel — número agrega
// .stat-compact-n--primary (Backlog list, Q-Backlog). Contenedor ya tenía --primary desde
// antes; solo el número quedaba sin homologar. Sin cambio de firma ni de lógica.
// TKT-202607-072 (REQ-202607-019): grupo de drafts (draft:true) agregado a _renderZonePanel —
// gateado por opts.showDraftGroup + opts.isZoneBroad (opcionales, sin default). Sin ambos, cero
// cambio de comportamiento — qdisc no los declara. getItems() confirmado sin filtrar draft (
// locus-backlog-core.js); la exclusión de vistas activas vive en _isQBacklogActive (!i.draft) —
// draftItems se deriva filtrando getItems() con el predicado amplio (_isQBacklog, sin ese
// !i.draft) que qbacklog.js pasa como isZoneBroad. contract_update: sí — _renderZonePanel gana
// dos opts nuevos, opcionales, sin cambio de firma para callers existentes.
// [PP] mod:9 · autor:Rune · 2026-07-23 21:40 UTC-6
// TKT1 (REQ histórico — sin CHECKPOINT confirmado Empty state bloque Terminados): _renderDoneGroup no tenía rama
// visual para doneItems.length === 0 — bodyEl.innerHTML quedaba en '' (bloque en blanco al
// expandir "Terminados" con 0 ítems done). Agregado mismo patrón .empty-state/.empty-state-icon/
// .empty-state-title/.empty-state-hint ya usado 3 veces en este mismo archivo (_renderZonePanel,
// L174/338/398) — sin CSS nuevo, sin consulta a Nova (reuso de clases existentes, no hay
// selector nuevo ni componente nuevo). Sin empty-state-btn — bloque informativo, no onboarding.
// Conteo del header (${prefix}-done-count) y el toggle de colapso (_attachDoneGroupToggle) sin
// cambio. contract_update: no — misma firma _renderDoneGroup(prefix, doneItems).

// [PP] mod:7 · autor:Rune · 2026-07-23 UTC-6
// Hallazgo fuera de scope (Nova, auditoría _Locus-css-ref mod:109): mismo bug que
// locus-incidents-render.js mod:6 — tc-${t.toLowerCase()} (tc-req/tc-tkt) nunca matcheaba
// .stat-type-chip.tc-REQ/.tc-TKT (case-sensitive). Corregido a tc-${t}. Solo afecta el panel
// Q-Backlog (_typeChipDefs.qbacklog) — Q-DISC no declara chips de tipo (_typeChipDefs.qdisc
// vacío), no impactado. Resuelto en sesión (Patch, sin bifurcación de founder).

// [PP] mod:6 · autor:Rune · 2026-07-21 UTC-6
// TKT3 (REQ-202607-010, design_intent: QBacklog-header-unified-homologacion): opts.statsBarId
// opcional — separa el stats-bar de bodyId en un nodo propio. Sin statsBarId (qdisc),
// comportamiento anterior exacto preservado. Ver detalle inline en el cuerpo de la función.
// TKT2 (REQ CAEL-0721-01): early-return de activeZoneItems vacío reubicado después de
// _statsBarHtml — el stats-bar ya no desaparece cuando Q-Backlog/Q-DISC no tiene ítems activos.
// Ver detalle inline en el cuerpo de _renderZonePanel.
// TKT-202607-011 (TKT3 REQ-202607-006): chips de área en stats-bar — exclusivo de qdisc vía
//   opts.showAreaChips. Conteo sobre activeZoneItems (mismo universo que chips de tipo/prioridad
//   ya existentes). Top 6 por conteo descendente + chip estático "+N más" cuando hay más de 6
//   áreas distintas — el chip "+N más" no cuenta ni filtra, es puramente informativo (AC-3).
//   "Sin área" (DISC sin campo area o vacío) es un chip propio, siempre al final, fuera del
//   límite de 6 — no compite por el top-6 con las áreas nombradas (supuesto: la Fase 1 no
//   distingue si "Sin área" cuenta contra el límite; se declara aquí como comportamiento
//   asumido, ver CHECKPOINT). Filtro single-select vía _nsToggleArea/_nsGetArea (core.js) —
//   distinto de los chips de tipo/prioridad, que son multi-toggle.
// locus-backlog-zone-engine.js
// Responsabilidad: _renderZonePanel — motor genérico de renderizado para paneles de zona
//   persistente (Q-Backlog, Q-DISC — no Q-INC, que tiene su propio render en
//   locus-backlog-render.js por schema/agrupación distintos). Incluye el bloque estático
//   "Terminados" (_renderDoneGroup/_attachDoneGroupToggle) y el umbral de staleness por tipo
//   (_zoneStaleness). No conoce 'qbacklog' ni 'qdisc' como conceptos propios — opera 100% sobre
//   los parámetros de `opts` que cada zona concreta le pasa (ver locus-backlog-qbacklog.js /
//   locus-backlog-qdisc.js).
// Dependencias: locus-backlog-core.js · locus-backlog-hierarchy.js · locus-backlog-item.js ·
//   locus-storage.js
//
// REQ refactor-zonas TKT2: extraído de locus-backlog-render.js (mod:72) sin cambio de contrato
// público — _renderZonePanel recibe los mismos `opts`, misma firma. Dos cambios de detalle:
// (1) la delegación de click de la stats-bar (zp-type/zp-priority) ya no detecta la zona activa
//     inspeccionando el id del DOM ni importa renderQBacklogPanel/renderQDiscPanel para
//     re-renderizar (habría creado import circular con los módulos de zona, que ahora importan
//     _renderZonePanel desde aquí) — usa nsKey/opts ya disponibles por closure y se re-invoca a
//     sí misma. Mismo resultado observable.
// (2) inline_fix (triggered_by: TKT2 de este REQ): _renderDoneGroup llamaba a _sortGroup(), una
//     función anidada dentro de renderBacklogList() en locus-backlog-render.js — fuera de scope
//     para cualquier caller top-level. _renderDoneGroup vivía a nivel de módulo, no dentro de
//     renderBacklogList — la referencia era un ReferenceError en tiempo de ejecución, no un typo
//     de import. No se manifestó todavía porque Q-Backlog no tiene ningún ítem en status 'done'
//     en el backlog actual (v1.0.1: Done=0) — el bloque Terminados de qbacklog nunca ejecutó esa
//     línea con doneItems.length > 0. Fix: sort local equivalente (priority asc → effort asc,
//     respeta _getBacklogSortDir()) — misma lógica que _sortGroup, sin depender de su closure.
//
// TKT self-heal-qbacklog (autónomo — sin REQ padre; Hallazgo fuera de scope de sesión previa): self-heal
// de status de REQ extendido a este motor — antes exclusivo de _renderVistaLista
// (locus-backlog-render.js), un REQ en Q-Backlog con TKT hijo fuera de 'pendiente' no recalculaba
// a 'en-proceso'/'en-revision'/'orphaned' hasta que ese REQ apareciera también en Vista Lista
// (requiere sprint asignado). Mismo mecanismo, misma fuente de hijos (solo TKT, incluye
// descartados) y mismo batching de 1 saveBacklog() por pase — gateado por `hasChildren` (DISC no
// tiene jerarquía R→hijos, nunca entra al loop). Guard adicional de saveBacklog() en los dos
// early-return de empty-state (activeZoneItems/filteredItems vacíos) — un REQ self-healed puede
// no llegar al final de la función si el filtro activo lo excluye.

import { itemKind, getItems, _nsGetTypes, _nsGetStatuses, _nsGetPriority, _nsGetQuery, _nsToggleType, _nsTogglePriority, _nsGetArea, _nsToggleArea, _getBacklogSortDir, _selfHealReqStatuses } from './locus-backlog-core.js'; // TKT-202607-011: _nsGetArea/_nsToggleArea agregados · TKT-202608-441 (REQ-202608-180): _computeRStatusFromChildren removida (inline_fix) — self-heal de status de REQ delegado a _selfHealReqStatuses(), único consumidor de _computeRStatusFromChildren ahora vive en locus-backlog-core.js
import { _attachBacklogListDelegation, _resetBacklogListDelegation, buildBacklogItem } from './locus-backlog-item.js';
import { _getActiveProjectFilter, saveBacklog } from './locus-storage.js'; // TKT-202608-441 (REQ-202608-180): _blogLog removida (inline_fix) — sin call site real tras delegar el self-heal a _selfHealReqStatuses() (locus-backlog-core.js, que ya importa _blogLog por su cuenta). saveBacklog se conserva — sigue disparándose sobre _reqSelfHealDirty
import { _buildChildMap } from './locus-backlog-hierarchy.js';

// T-202606-163 / TKT-C1: _zoneStaleness (antes _iceboxStaleness) — umbral de alerta por tipo de
// ítem en vista Q-Backlog/Q-DISC. Umbrales: REQ/TKT → 14d · DISC → 30d · INC priority:high → 7d ·
// resto → sin alerta. Referencia: statusChangedAt || createdAt. Retorna { days, label } o null.
export function _zoneStaleness(item) {
  if (!item) return null;
  const type = itemKind(item);
  const priority = (item.priority || '').toLowerCase();
  let threshold;
  if (type === 'REQ' || type === 'TKT') threshold = 14;
  else if (type === 'DISC') threshold = 30;
  else if (type === 'INC' && priority === 'high') threshold = 7;
  else return null;
  const refTs = item.statusChangedAt || item.createdAt;
  if (!refTs) return null;
  const days = Math.floor((Date.now() - refTs) / 86400000);
  if (days < threshold) return null;
  const label = days === 1 ? '1d' : days + 'd';
  return { days, label };
}

// inline_fix (triggered_by TKT2 REQ refactor-zonas): sort local — mismo criterio que _sortGroup
// (locus-backlog-render.js, priority asc → effort asc, respeta _getBacklogSortDir()) sin
// depender de su closure. Ver header del módulo para el detalle del bug corregido.
function _sortDoneItems(arr) {
  const _priOrder = { high: 0, important: 0, critical: 0, importante: 0, medium: 1, low: 2, futura: 2, baja: 2 };
  const _dir = _getBacklogSortDir() === 'desc' ? -1 : 1;
  return [...arr].sort((a, b) => {
    const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
    if (pa !== pb) return (pa - pb) * _dir;
    const ea = parseInt(a.effort) || 1, eb = parseInt(b.effort) || 1;
    return (ea - eb) * _dir;
  });
}

// Helper compartido — rellena el bloque estático "Terminados" (.bl-done-*, ver index.html) con
// los ítems done del zone correspondiente. El contenedor existe siempre en el DOM (HTML
// estático) — esta función solo escribe conteo y filas, nunca crea ni destruye el shell.
function _renderDoneGroup(prefix, doneItems) {
  const countEl = document.getElementById(`${prefix}-done-count`);
  const bodyEl  = document.getElementById(`${prefix}-done-body`);
  if (countEl) countEl.textContent = String(doneItems.length);
  if (!bodyEl) return;
  bodyEl.innerHTML = doneItems.length
    ? _sortDoneItems(doneItems).map(item => buildBacklogItem(item)).join('')
    : `<div class="empty-state">
        <div class="empty-state-icon">✔</div>
        <div class="empty-state-title">Sin ítems terminados aún</div>
        <div class="empty-state-hint">Los ítems que lleguen a done en este sprint aparecerán aquí.</div>
      </div>`;
}

// TKT-202607-072 (REQ-202607-019): construye el grupo colapsable de ítems draft:true —
// dinámico, sin shell estático en index.html (a diferencia de .bl-done-group). Agrupa REQ→hijos
// igual que el resto del panel: un TKT hijo cuyo REQ padre NO está en `items` (padre no-draft,
// solo el hijo lo es) se muestra como raíz dentro de este grupo — AC edge case del TKT, no se
// inventa nesting bajo un REQ que no pertenece al set draft. Retorna '' con items vacío — AC-1,
// el grupo completo se omite del DOM, sin placeholder de estado vacío (a propósito, distinto de
// .qdisc-status-body que sí lo tiene).
function _draftGroupHtml(items) {
  if (!items.length) return '';
  const childMap = _buildChildMap(items);
  const rCodes = new Set(items.filter(i => itemKind(i) === 'REQ').map(i => i.code));
  const rootItems = items.filter(i => !i.parentId || !rCodes.has(i.parentId));
  let rows = '';
  const _row = (item, isChild) => `<div class="qbacklog-draft-row${isChild ? ' qbacklog-draft-row--child' : ''}">
      <button type="button" class="qbacklog-draft-code-chip ${itemKind(item)}" data-copy-code="${item.code}" title="Copiar ${item.code}" aria-label="Copiar código ${item.code}">
        <span class="qbacklog-draft-code-chip-text">${item.code}</span>
        <svg class="ti-svg qbacklog-draft-code-chip-icon" aria-hidden="true"><use href="#ti-copy"></use></svg>
      </button>
      <span class="qbacklog-draft-title-text">${(item.title || '').replace(/</g, '&lt;')}</span>
    </div>`;
  rootItems.forEach(item => {
    rows += _row(item, false);
    (childMap.get(item.code) || []).forEach(child => { rows += _row(child, true); });
  });
  return `
    <div class="qbacklog-draft-group">
      <div class="qbacklog-draft-header" data-action="toggle-draft-group" tabindex="0" role="button" aria-expanded="true">
        <div class="qbacklog-draft-header-meta">
          <span class="qbacklog-draft-title">Pendiente de validación Finn</span>
          <span class="qbacklog-draft-count">${items.length}</span>
        </div>
        <svg class="ti-svg chevron qbacklog-draft-chevron" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>
      </div>
      <div class="qbacklog-draft-body">${rows}</div>
    </div>`;
}

// TKT-202607-072: toggle del grupo de drafts — delegado sobre `body`, adjuntado una sola vez por
// nodo (el nodo #[bodyId] persiste entre renders, solo su innerHTML se reemplaza — mismo criterio
// que el guard _zpDelegationAttached de la stats-bar, más abajo en esta función). Enter/Space
// además de click — header es role="button" tabindex="0" (AC accesibilidad del TKT1/Nova).
function _attachDraftGroupToggle(body) {
  if (body._zpDraftDelegationAttached) return;
  body._zpDraftDelegationAttached = true;
  const _toggle = header => {
    const group = header.closest('.qbacklog-draft-group');
    if (!group) return;
    const collapsed = group.classList.toggle('is-collapsed');
    header.setAttribute('aria-expanded', String(!collapsed));
  };
  // Copia el código completo del chip — mismo patrón de estado que .qinc-item-code-chip:
  // icono ti-copy → ti-check + .is-copied en éxito, .is-copy-error si el clipboard falla,
  // reset a los 1.5s. Timer por-botón (btn._copyResetTimer) para no pisar el reset de otro
  // chip si se copian varios códigos seguidos.
  const _copyCode = async btn => {
    const code = btn.dataset.copyCode;
    if (!code) return;
    const icon = btn.querySelector('.qbacklog-draft-code-chip-icon');
    // TKT-202608-286: icon es ahora <svg class="ti-svg qbacklog-draft-code-chip-icon">
    // con un <use href="#ti-X"> anidado — el swap de símbolo se hace sobre ese atributo,
    // no sobre className (className fijo, solo cambian las clases de estado del botón).
    const useEl = icon ? icon.querySelector('use') : null;
    try {
      await navigator.clipboard.writeText(code);
      btn.classList.remove('is-copy-error');
      btn.classList.add('is-copied');
      if (useEl) useEl.setAttribute('href', '#ti-check');
    } catch {
      btn.classList.remove('is-copied');
      btn.classList.add('is-copy-error');
    }
    clearTimeout(btn._copyResetTimer);
    btn._copyResetTimer = setTimeout(() => {
      btn.classList.remove('is-copied', 'is-copy-error');
      if (useEl) useEl.setAttribute('href', '#ti-copy');
    }, 1500);
  };
  body.addEventListener('click', e => {
    const copyBtn = e.target.closest('.qbacklog-draft-code-chip');
    if (copyBtn) { _copyCode(copyBtn); return; }
    const header = e.target.closest('.qbacklog-draft-header');
    if (header) _toggle(header);
  });
  body.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = e.target.closest('.qbacklog-draft-header');
    if (!header) return;
    e.preventDefault();
    _toggle(header);
  });
}

// TKT2 (REQ CAEL-0803-03): toggle del grupo "Activos" — delegado sobre el body contenedor, mismo
// mecanismo que _attachDraftGroupToggle (el nodo bl-active-group se recrea en cada render, no
// puede adjuntarse listener fijo al header como en Terminados). Persistencia en localStorage bajo
// backlog-${nsKey}-active-open, default abierto — mismo criterio que _attachDoneGroupToggle.
function _attachActiveGroupToggle(body, nsKey) {
  if (body._zpActiveDelegationAttached) return;
  body._zpActiveDelegationAttached = true;
  const _key = `backlog-${nsKey}-active-open`;
  const _toggle = header => {
    const group = header.closest('.bl-active-group');
    if (!group) return;
    const collapsed = group.classList.toggle('is-collapsed');
    header.setAttribute('aria-expanded', String(!collapsed));
    localStorage.setItem(_key, collapsed ? '0' : '1');
  };
  body.addEventListener('click', e => {
    const header = e.target.closest('.bl-active-header');
    if (header) _toggle(header);
  });
  body.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = e.target.closest('.bl-active-header');
    if (!header) return;
    e.preventDefault();
    _toggle(header);
  });
}

// TKT2 (REQ CAEL-0803-03): envuelve el HTML de la lista/empty-state de ítems activos en el grupo
// colapsable .bl-active-group cuando opts.showActiveGroup está activo. `count` es
// activeZoneItems.length (universo sin filtrar) — no el largo del bloque filtrado, para que el
// header siga comunicando el total real de la zona bajo filtro parcial. Estado de colapso leído
// de localStorage al construir el HTML (mismo momento que _attachDoneGroupToggle lo hace vía
// clase en el DOM) — evita flash de expandido→colapsado en el primer paint tras reload.
function _activeGroupWrap(innerHtml, count, nsKey) {
  const _key = `backlog-${nsKey}-active-open`;
  const _isOpen = localStorage.getItem(_key) !== '0';
  return `
    <div class="bl-active-group${_isOpen ? '' : ' is-collapsed'}" id="${nsKey}-active-group">
      <div class="bl-active-header" id="${nsKey}-active-header" tabindex="0" role="button" aria-expanded="${_isOpen}">
        <span class="bl-active-label">Activos</span>
        <div class="bl-active-header-meta">
          <span class="bl-active-count" id="${nsKey}-active-count">${count}</span>
          <svg class="ti-svg chevron bl-active-chevron" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>
        </div>
      </div>
      <div class="bl-active-body" id="${nsKey}-active-body">${innerHtml}</div>
    </div>`;
}

// Toggle de colapso del bloque "Terminados" — header y body son estáticos (index.html), el
// listener se adjunta una sola vez al cargar el módulo, no en cada render. Solo lo usa la zona
// que declara hasDoneState:true (hoy: qbacklog — ver locus-backlog-qbacklog.js). Sin
// #[prefix]-done-header/body en el DOM, retorna en el guard temprano sin operar.
export function _attachDoneGroupToggle(prefix) {
  const group  = document.getElementById(`${prefix}-done-group`);
  const header = document.getElementById(`${prefix}-done-header`);
  const body   = document.getElementById(`${prefix}-done-body`);
  if (!group || !header || !body) return;
  const key = `backlog-${prefix}-done-open`;
  const isOpen = localStorage.getItem(key) !== '0';
  group.classList.toggle('is-collapsed', !isOpen);
  header.setAttribute('aria-expanded', String(isOpen));
  const _toggle = () => {
    const collapsed = group.classList.toggle('is-collapsed');
    header.setAttribute('aria-expanded', String(!collapsed));
    localStorage.setItem(key, collapsed ? '0' : '1');
  };
  header.addEventListener('click', _toggle);
  header.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    _toggle();
  });
}

// TKT-C1 (REQ-C): motor común de renderIceboxPanel/renderQBacklogPanel/renderQDiscPanel —
// filtros por namespace propio ('qbacklog'/'qdisc' hoy, cualquier zona futura mañana), jerarquía
// R→hijos vía _buildChildMap, bloque Terminados estático.
export function _renderZonePanel(opts) {
  const { bodyId, badgeId, nsKey, isZone, emptyTitle, emptyIcon } = opts;
  // TKT3 (REQ-202607-010, design_intent: QBacklog-header-unified-homologacion): statsBarId
  // opcional — cuando se declara, _statsBarHtml se escribe en ese nodo separado (sticky, dentro
  // de .bl-header-unified) y bodyId recibe solo el contenido de lista/empty-state (scrolleable
  // normal, fuera del sticky). Sin statsBarId (caso de qdisc, que no pasa por
  // .bl-header-unified — tiene su propio shell #qdisc-stats-block externo), preserva el
  // comportamiento exacto anterior: todo concatenado en un solo nodo bodyId.
  const statsBarEl = opts.statsBarId ? document.getElementById(opts.statsBarId) : null;
  // TKT1 REQ hide-done-qdisc: hasDoneState/hasChildren — default true preserva comportamiento
  // exacto de qbacklog (único caller previo a ese TKT). qdisc los declara en false: DISC nunca
  // alcanza status 'done' (__BR-Ecosystem §5) ni tiene jerarquía R→hijos (no aplica
  // _buildChildMap).
  const hasDoneState = opts.hasDoneState !== false;
  const hasChildren  = opts.hasChildren !== false;
  const _emptyIcon = emptyIcon || '📦';
  const body = document.getElementById(bodyId);
  if (!body) return;

  // INC histórico — sin CHECKPOINT confirmado: sin esta línea, el header de la card (data-action="item-expand") y el
  // resto de acciones delegadas (copiar código/ítem, doble-click editar título, quick-assign
  // effort, cambiar status/rol/sprint/parent, abrir bloqueante, promover) no tienen listener en
  // qbacklog-panel-body/qdisc-panel-body — buildBacklogItem() genera el mismo markup que Vista
  // Lista pero solo #backlog-list tenía la delegación adjunta. Mismo patrón que
  // renderBacklogList() (locus-backlog-render.js) — reset antes de re-adjuntar en cada render.
  _resetBacklogListDelegation(bodyId);
  _attachBacklogListDelegation(bodyId);

  // Bloque Terminados estático (.bl-done-group, ver index.html) — oculto vía .is-hidden cuando
  // hasDoneState:false, sin dejar espacio ni borde residual. qbacklog remueve is-hidden
  // explícitamente — no depende de que el DOM nazca sin la clase. Zonas sin bloque en el DOM
  // (ej. qdisc, ver REQ congruencia-qdisc) resuelven doneGroupEl:null — no-op vía el guard.
  const doneGroupEl = document.getElementById(`${nsKey}-done-group`);
  if (doneGroupEl) doneGroupEl.classList.toggle('is-hidden', !hasDoneState);

  if (!_getActiveProjectFilter()) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Selecciona un proyecto</div>
        <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
      </div>`;
    const badge = document.getElementById(badgeId);
    if (badge) badge.textContent = '';
    if (hasDoneState) _renderDoneGroup(nsKey, []);
    return;
  }

  const zoneItems = getItems().filter(isZone);

  // TKT-202608-441 (REQ-202608-180), corregido vía TKT3 CAEL-08231830-01: self-heal consolidado
  // en _selfHealReqStatuses(candidateItems) — a diferencia del intento anterior (que corría sobre
  // getItems() completo), aquí se pasa zoneItems explícito: solo corrige REQs que ya viven en esta
  // zona, mismo universo que el panel renderiza — evita que un panel de zona (ej. Q-Backlog)
  // dispare self-heal/saveBacklog sobre REQs con sprint asignado que renderBacklogList() ya
  // gestiona por su cuenta. Gateado por hasChildren — DISC (hasChildren:false) no tiene jerarquía
  // R→hijos, se preserva el guard para no correr el scan en un panel que nunca los muestra (qdisc).
  const _reqSelfHeal = hasChildren ? _selfHealReqStatuses(zoneItems) : { changed: false, count: 0 };
  const _reqSelfHealDirty = _reqSelfHeal.changed;

  // Badge — universo SIN filtrar (conteo real de la zona), igual que B-202606-075.
  const badge = document.getElementById(badgeId);
  if (badge) {
    if (!zoneItems.length) {
      badge.textContent = '';
    } else {
      const _alertCount = zoneItems.filter(i => _zoneStaleness(i) !== null).length;
      badge.textContent = (_alertCount > 0 ? '⚠ ' : '') + zoneItems.length;
    }
  }

  // TKT1 (REQ CAEL-0723-01): aria-label dinámico con conteo hablado — opt-in vía
  // opts.tabButtonId/opts.tabLabel. Ausente en el caller de qbacklog (sin cambio de
  // comportamiento ahí, no_incluye del TKT) — solo qdisc lo declara. El badge visual
  // (arriba) es aria-hidden en HTML estático; este es el texto real para lectores de
  // pantalla, expuesto en el botón contenedor, no en el badge.
  if (opts.tabButtonId) {
    const tabBtn = document.getElementById(opts.tabButtonId);
    if (tabBtn) {
      tabBtn.setAttribute('aria-label', zoneItems.length
        ? `${opts.tabLabel}, ${zoneItems.length} activos`
        : opts.tabLabel);
    }
  }

  // AC-4 REQ-C: bloque Terminados siempre actualizado, incluso sin ítems activos.
  // TKT1 REQ hide-done-qdisc: con hasDoneState:false no hay split — todo zoneItems es activo
  // (DISC nunca tiene status 'done') y _renderDoneGroup no se invoca — el bloque ya quedó oculto
  // vía .is-hidden más arriba (o ni existe en el DOM, ver REQ congruencia-qdisc).
  const doneZoneItems   = hasDoneState ? zoneItems.filter(i => i.status === 'done') : [];
  const activeZoneItems = hasDoneState ? zoneItems.filter(i => i.status !== 'done') : zoneItems;
  if (hasDoneState) _renderDoneGroup(nsKey, doneZoneItems);

  // TKT-202607-072 (REQ-202607-019): draftItems — universo aparte de zoneItems (isZone ya excluye
  // draft:true por diseño, ver _isQBacklogActive). Requiere opts.isZoneBroad (predicado amplio,
  // sin la condición !i.draft) además de opts.showDraftGroup — sin ambos, [] y sin cambio de
  // comportamiento (qdisc no los declara).
  const draftItems = (opts.showDraftGroup && opts.isZoneBroad)
    ? getItems().filter(i => opts.isZoneBroad(i) && i.draft === true && i.status !== 'descartado' && i.status !== 'historico')
    : [];
  if (opts.showDraftGroup) _attachDraftGroupToggle(body);
  const _draftGroupHtmlStr = _draftGroupHtml(draftItems);

  // TKT2 (REQ CAEL-0721-01): cálculo de _statsBarHtml movido antes del early-return por
  // activeZoneItems vacío (antes solo corría con ítems activos > 0 — el stats-bar desaparecía
  // por completo con Q-Backlog/Q-DISC sin ítems, único camino de _renderZonePanel sin
  // _statsBarHtml de los tres). Con activeZoneItems.length === 0, todos los conteos caen a 0 de
  // forma natural (los .forEach de abajo no iteran nada) — sin condicional nuevo, mismo cálculo
  // para los tres caminos de salida (vacío por cero ítems, vacío por filtro, grid con ítems).
  // TKT3 REQ2 S'02 — stats-bar interactiva: conteo sobre activeZoneItems (universo sin filtrar
  // por tipo/prioridad/búsqueda), mismo criterio que renderQIncPanel (_displayable) — evita que
  // un chip desactivado muestre conteo 0 en vez del total real de la zona.
  const _activeTypesZ0    = _nsGetTypes(nsKey);
  const _activePriorityZ0 = _nsGetPriority(nsKey);
  const _countByTypeZ = {};
  const _countByPriZ  = { high: 0, medium: 0, low: 0 };
  activeZoneItems.forEach(i => {
    const t = itemKind(i);
    if (t) _countByTypeZ[t] = (_countByTypeZ[t] || 0) + 1;
    const p = i.priority;
    if (p === 'high' || p === 'important' || p === 'critical' || p === 'importante') _countByPriZ.high++;
    else if (p === 'low' || p === 'futura' || p === 'baja') _countByPriZ.low++;
    else _countByPriZ.medium++;
  });
  const _typeChipDefs = { qbacklog: [['REQ','REQ'],['TKT','TKT']], qdisc: [] }[nsKey] || [];

  // TKT-202607-011 (TKT3 REQ-202607-006): chips de área — exclusivo de qdisc (opts.showAreaChips).
  // "Sin área" es un bucket propio (sentinel '__sin_area__'), no compite por el top-6 con áreas
  // nombradas — siempre al final del listado (AC-4). Top 6 por conteo desc + "+N más" estático
  // cuando hay más de 6 áreas nombradas distintas (AC-3) — "+N más" no cuenta hacia "Sin área".
  const _SIN_AREA = '__sin_area__';
  let _areaChipsHtml = '';
  if (opts.showAreaChips) {
    const _activeAreaZ0 = _nsGetArea(nsKey);
    const _countByAreaZ = {};
    let _sinAreaCount = 0;
    activeZoneItems.forEach(i => {
      const a = (i.area || '').trim();
      if (!a) { _sinAreaCount++; return; }
      _countByAreaZ[a] = (_countByAreaZ[a] || 0) + 1;
    });
    const _namedAreasSorted = Object.entries(_countByAreaZ).sort((a, b) => b[1] - a[1]);
    const _AREA_CHIP_LIMIT = 6;
    const _visibleAreas = _namedAreasSorted.slice(0, _AREA_CHIP_LIMIT);
    const _overflowCount = _namedAreasSorted.length - _visibleAreas.length;
    const _areaChipBtns = _visibleAreas.map(([area, count]) =>
      `<button class="stat-area-chip${_activeAreaZ0 === area ? ' active' : ''}" data-zp-action="zp-area" data-zp-area="${area.replace(/"/g, '&quot;')}" title="Filtrar por área ${area.replace(/"/g, '&quot;')}"><span class="sac-n">${count}</span><span class="sac-label">${area}</span></button>`
    ).join('');
    const _overflowChip = _overflowCount > 0
      ? `<span class="stat-area-chip stat-area-chip--static" title="${_overflowCount} área${_overflowCount === 1 ? '' : 's'} adicional${_overflowCount === 1 ? '' : 'es'} sin chip propio">+${_overflowCount} más</span>`
      : '';
    const _sinAreaChip = _sinAreaCount > 0
      ? `<button class="stat-area-chip stat-area-chip--none${_activeAreaZ0 === _SIN_AREA ? ' active' : ''}" data-zp-action="zp-area" data-zp-area="${_SIN_AREA}" title="Filtrar ítems sin área declarada"><span class="sac-n">${_sinAreaCount}</span><span class="sac-label">Sin área</span></button>`
      : '';
    _areaChipsHtml = (_areaChipBtns || _overflowChip || _sinAreaChip)
      ? `<div class="qdisc-area-chips">${_areaChipBtns}${_overflowChip}${_sinAreaChip}</div>`
      : '';
  }

  // Homologación de identidad visual (REQ Locus — estándar .stats-row--compact, ver
  // .bl-header-unified > .stats-bar en locus-backlog.css y precedente de Histórico mod:33):
  // con statsBarId (caso qbacklog — nodo propio dentro de .bl-header-unified sticky, ver
  // index.html #qbacklog-stats-bar), el stats-bar adopta la misma fila compacta que Backlog
  // Vista Lista/Histórico — chip "Total" en .stat-compact-item--primary + separadores
  // .stat-compact-sep, con los MISMOS chips interactivos de antes (.stat-type-chip/
  // .stat-pri-chip, data-zp-action sin cambio — la delegación no depende de la clase del
  // wrapper). Sin statsBarId (qdisc — embebido inline dentro de #qdisc-panel-body, sin pasar
  // por .bl-header-unified, ver comentario de statsBarEl más arriba), preserva el markup
  // .qinc-stats-bar exacto de siempre — ese mini-bar de prioridad+área es un filtro interno
  // del bloque Discovery, no el header del panel (ese es #qdisc-stats-block, fuera de este
  // archivo) — sin cambio de scope aquí, decisión pendiente por separado.
  const _statsBarHtml = statsBarEl ? `
    <div class="stats-row stats-row--compact">
      <div class="stat-compact-counts">
        <div class="stat-compact-item stat-compact-item--primary">
          <span class="stat-compact-n stat-compact-n--primary">${activeZoneItems.length}</span>
          <span class="stat-compact-l">total</span>
        </div>
      </div>
      ${_typeChipDefs.length ? `<div class="stat-compact-sep"></div>
      <div class="stat-compact-types">
        ${_typeChipDefs.map(([t, label]) =>
          `<button class="stat-type-chip tc-${t}${_activeTypesZ0.has(t) ? ' active' : ''}" data-zp-action="zp-type" data-zp-type="${t}" title="Filtrar por tipo ${t}"><span class="tc-count">${_countByTypeZ[t] || 0}</span><span class="tc-label">${label}</span></button>`
        ).join('')}
      </div>` : ''}
      <div class="stat-compact-sep"></div>
      <div class="stat-compact-priority">
        <button class="stat-pri-chip pri-high${_activePriorityZ0.has('high') ? ' active' : ''}" data-zp-action="zp-priority" data-zp-priority="high" title="Filtrar prioridad alta"><span class="spc-n">${_countByPriZ.high}</span> Alto</button>
        <button class="stat-pri-chip pri-medium${_activePriorityZ0.has('medium') ? ' active' : ''}" data-zp-action="zp-priority" data-zp-priority="medium" title="Filtrar prioridad media"><span class="spc-n">${_countByPriZ.medium}</span> Med</button>
        <button class="stat-pri-chip pri-low${_activePriorityZ0.has('low') ? ' active' : ''}" data-zp-action="zp-priority" data-zp-priority="low" title="Filtrar prioridad baja"><span class="spc-n">${_countByPriZ.low}</span> Bajo</button>
      </div>
      ${_areaChipsHtml}
    </div>` : `
    <div class="qinc-stats-bar" id="${bodyId}-stats-bar">
      ${opts.showTypeChips !== false && _typeChipDefs.length ? `<div class="qinc-stats-types">
        ${_typeChipDefs.map(([t, label]) =>
          `<button class="stat-type-chip tc-${t}${_activeTypesZ0.has(t) ? ' active' : ''}" data-zp-action="zp-type" data-zp-type="${t}" title="Filtrar por tipo ${t}"><span class="tc-count">${_countByTypeZ[t] || 0}</span><span class="tc-label">${label}</span></button>`
        ).join('')}
      </div>` : ''}
      <div class="qinc-stats-priority">
        <button class="stat-pri-chip pri-high${_activePriorityZ0.has('high') ? ' active' : ''}" data-zp-action="zp-priority" data-zp-priority="high" title="Filtrar prioridad alta"><span class="spc-n">${_countByPriZ.high}</span> Alto</button>
        <button class="stat-pri-chip pri-medium${_activePriorityZ0.has('medium') ? ' active' : ''}" data-zp-action="zp-priority" data-zp-priority="medium" title="Filtrar prioridad media"><span class="spc-n">${_countByPriZ.medium}</span> Med</button>
        <button class="stat-pri-chip pri-low${_activePriorityZ0.has('low') ? ' active' : ''}" data-zp-action="zp-priority" data-zp-priority="low" title="Filtrar prioridad baja"><span class="spc-n">${_countByPriZ.low}</span> Bajo</button>
      </div>
      ${_areaChipsHtml}
    </div>`;

  // TKT3 (REQ-202607-010): con statsBarId, el stats-bar se escribe en su propio nodo (sticky,
  // dentro de .bl-header-unified) — body queda libre para solo lista/empty-state, scrolleable
  // normal. Sin statsBarId (qdisc), _bodyPrefixHtml preserva el comportamiento anterior exacto:
  // stats-bar concatenado al inicio del mismo nodo bodyId.
  if (statsBarEl) {
    statsBarEl.innerHTML = _statsBarHtml;
  }
  const _bodyPrefixHtml = statsBarEl ? '' : _statsBarHtml;

  // TKT2 (REQ CAEL-0721-01): early-return por activeZoneItems vacío, reubicado aquí (después de
  // _statsBarHtml) para que el stats-bar se incluya con conteos en 0 — antes retornaba antes de
  // este cálculo y el bloque desaparecía por completo. Mismo criterio que el early-return de
  // filteredItems vacío (más abajo), que ya incluía _statsBarHtml correctamente.
  if (!activeZoneItems.length) {
    // Mejora visual DISC (aprobada por founder): opts.emptyHint es opcional, sin default —
    // qbacklog no lo declara (ver locus-backlog-qbacklog.js), su empty-state no cambia.
    const _emptyHintHtml = opts.emptyHint
      ? `<div class="empty-state-hint">${opts.emptyHint}</div>`
      : '';
    // TKT2 (REQ CAEL-0803-03): empty-state envuelto en .bl-active-group cuando showActiveGroup —
    // header con contador "0" sigue visible, mismo criterio que .qdisc-status-header.
    const _emptyStateHtml = `
      <div class="empty-state">
        <div class="empty-state-icon">${_emptyIcon}</div>
        <div class="empty-state-title">${emptyTitle}</div>
        ${_emptyHintHtml}
      </div>`;
    body.innerHTML = _bodyPrefixHtml
      + (opts.showActiveGroup ? _activeGroupWrap(_emptyStateHtml, 0, nsKey) : _emptyStateHtml)
      + _draftGroupHtmlStr;
    if (opts.showActiveGroup) _attachActiveGroupToggle(body, nsKey);
    return;
  }

  // TKT3 (REQ-202607-010): delegación de click de los chips (zp-type/zp-priority/zp-area) se
  // adjunta a statsBarEl cuando existe — el stats-bar ya no vive dentro de body en ese caso.
  // Sin statsBarId (qdisc), preserva el listener en body, comportamiento anterior exacto.
  const _delegationTarget = statsBarEl || body;
  if (!_delegationTarget._zpDelegationAttached) {
    _delegationTarget._zpDelegationAttached = true;
    // REQ refactor-zonas TKT2: nsKey/opts ya identifican la zona por closure — sin necesidad de
    // inspeccionar el id del DOM ni de importar renderQBacklogPanel/renderQDiscPanel (habría
    // creado import circular con los módulos de zona concretos, que son quienes importan
    // _renderZonePanel desde aquí). Re-render = re-invocar _renderZonePanel con el mismo opts.
    _delegationTarget.addEventListener('click', function _zpStatsClick(e) {
      const btn = e.target.closest('[data-zp-action]');
      if (!btn) return;
      if (btn.dataset.zpAction === 'zp-type') {
        _nsToggleType(nsKey, btn.dataset.zpType);
      } else if (btn.dataset.zpAction === 'zp-priority') {
        _nsTogglePriority(nsKey, btn.dataset.zpPriority);
      } else if (btn.dataset.zpAction === 'zp-area') {
        // TKT-202607-011: el chip "+N más" no lleva data-zp-action (es <span>, no <button>,
        // sin data-zp-area) — closest('[data-zp-action]') nunca lo matchea, AC-3 cumplido sin
        // guard adicional.
        _nsToggleArea(nsKey, btn.dataset.zpArea);
      } else {
        return;
      }
      _renderZonePanel(opts);
    });
  }

  // Filtros leídos desde namespace propio — aislado del state global de Backlog y del otro panel.
  const _activeTypesZ    = _nsGetTypes(nsKey);
  const _activeStatusesZ = _nsGetStatuses(nsKey);
  const _activePriorityZ = _nsGetPriority(nsKey);
  const _qZ = (_nsGetQuery(nsKey) || '').trim().toLowerCase();
  const _matchesSearchZ = _qZ
    ? i => i.code.toLowerCase().includes(_qZ) || (i.title || '').toLowerCase().includes(_qZ) || (i.area || '').toLowerCase().includes(_qZ)
    : () => true;
  // TKT-202607-011: filtro de área — solo activo cuando opts.showAreaChips (hoy: qdisc). Sin
  // filtro de área activo (_activeAreaZ === null), areaOk siempre true — sin regresión en
  // qbacklog/qinc, que nunca activan _nsToggleArea.
  const _activeAreaZ = opts.showAreaChips ? _nsGetArea(nsKey) : null;
  const filteredItems = activeZoneItems.filter(i => {
    const type = itemKind(i);
    const typeOk = type ? _activeTypesZ.has(type) : true;
    const statusOk = _activeStatusesZ.has(i.status);
    const priorityOk = _activePriorityZ.size === 0 || _activePriorityZ.has(i.priority);
    const areaOk = !_activeAreaZ ? true : (_activeAreaZ === _SIN_AREA ? !(i.area || '').trim() : (i.area || '').trim() === _activeAreaZ);
    return typeOk && statusOk && priorityOk && areaOk && _matchesSearchZ(i);
  });

  if (!filteredItems.length) {
    // TKT2 (REQ CAEL-0803-03): contador del header = activeZoneItems.length (universo sin
    // filtrar) — el header comunica el total real de la zona aunque el filtro no matchee nada,
    // mismo criterio ya aplicado en el early-return de arriba y en el bloque con ítems abajo.
    const _emptyFilteredHtml = `
      <div class="empty-state">
        <div class="empty-state-icon">${_emptyIcon}</div>
        <div class="empty-state-title">${emptyTitle}</div>
        <div class="empty-state-hint">Ningún ítem coincide con el filtro activo.</div>
      </div>`;
    body.innerHTML = _bodyPrefixHtml
      + (opts.showActiveGroup ? _activeGroupWrap(_emptyFilteredHtml, activeZoneItems.length, nsKey) : _emptyFilteredHtml)
      + _draftGroupHtmlStr;
    if (opts.showActiveGroup) _attachActiveGroupToggle(body, nsKey);
    // TKT self-heal-qbacklog: un REQ self-healed (ej. pendiente → en-proceso) puede quedar fuera
    // del filtro activo (ej. filtro de status por 'pendiente') y este early-return se alcanza
    // antes del trigger de saveBacklog al final de la función — sin este disparo, la corrección
    // quedaría solo in-memory hasta el próximo save de otro origen.
    if (_reqSelfHealDirty) saveBacklog();
    return;
  }

  // Ordenar: tipo (REQ→TKT→INC→DISC) y dentro de cada tipo por prioridad (high→medium→low) —
  // comportamiento por defecto, sin cambio para callers existentes (qbacklog).
  // TKT-202608-432 (REQ-202608-175, TKT1): opts.sortComparator opcional — cuando se declara,
  // reemplaza el sort tipo/prioridad de arriba. Solo qdisc lo pasa, y solo cuando el founder activó
  // "Antigüedad" en el control propio (ver locus-backlog-qdisc.js) — sin selección explícita, qdisc
  // no declara el opt y este bloque preserva el comportamiento exacto anterior (AC-3, "orden de
  // aparición"). contract_update: sí — opt nuevo, opcional, sin cambio de firma para callers
  // existentes.
  const _typeOrder = { REQ: 0, TKT: 1, INC: 2, DISC: 3 };
  const _priOrder  = { high: 0, important: 0, critical: 0, importante: 0, medium: 1, low: 2, futura: 2, baja: 2 };
  const sorted = opts.sortComparator
    ? [...filteredItems].sort(opts.sortComparator)
    : [...filteredItems].sort((a, b) => {
        const ta = _typeOrder[itemKind(a)] ?? 9, tb = _typeOrder[itemKind(b)] ?? 9;
        if (ta !== tb) return ta - tb;
        const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
        return pa - pb;
      });

  // TKT1 REQ hide-done-qdisc: con hasChildren:false se omite _buildChildMap — DISC no tiene
  // depends_on ni jerarquía R→hijos, todo ítem filtrado es raíz.
  const _childMap  = hasChildren ? _buildChildMap(filteredItems) : new Map();
  const _rCodes    = hasChildren ? new Set(filteredItems.filter(i => itemKind(i) === 'REQ').map(i => i.code)) : new Set();
  const _rootItems = hasChildren ? sorted.filter(i => !i.parentId || !_rCodes.has(i.parentId)) : sorted;

  let html = '<div class="items-grid">';
  _rootItems.forEach(item => {
    const _stale = _zoneStaleness(item);
    const _stalePill = _stale
      ? `<div class="bl-done-item-alert"><span class="staleness-pill staleness--stale" title="Sin movimiento — ${_stale.days}d">${_stale.label}</span></div>`
      : '';
    html += _stalePill + buildBacklogItem(item);
    const _children = _childMap.get(item.code) || [];
    if (_children.length) {
      // TKT-C1: wrapper renombrado .bl-vl-req-children→.bl-vl-req-body
      html += '<div class="bl-vl-req-body">';
      _children.forEach(child => { html += buildBacklogItem(child); });
      html += '</div>';
    }
  });
  html += '</div>';

  // TKT2 (REQ CAEL-0803-03): contador del header = activeZoneItems.length (universo sin filtrar,
  // mismo criterio que el badge del sub-tab) — no filteredItems.length/_rootItems.length, para
  // que el header no oculte cuántos ítems activos tiene la zona bajo un filtro parcial.
  body.innerHTML = _bodyPrefixHtml
    + (opts.showActiveGroup ? _activeGroupWrap(html, activeZoneItems.length, nsKey) : html)
    + _draftGroupHtmlStr;
  if (opts.showActiveGroup) _attachActiveGroupToggle(body, nsKey);

  // TKT self-heal-qbacklog: 1 sola escritura por pase de render, sin importar cuántos REQs se
  // corrigieron arriba — mismo criterio de batching que _renderVistaLista. No await — el DOM ya
  // terminó de pintarse con los status corregidos in-memory; la escritura corre en paralelo sin
  // bloquear. No dispara un segundo render de este panel.
  if (_reqSelfHealDirty) saveBacklog();
}
