// [PP] mod:27 · autor:Rune · 2026-08-18 22:30 UTC-6
// Fix (founder, post-liberación REQ CAEL-0720-01): byType simplificado a {REQ,TKT} — INC/DISC/
// PRB/KE/CHG removidos, universo real de Histórico no puede contenerlos (ver comentario en
// locus-backlog-render.js mod:101). Sin retrocompatibilidad con claves muertas.
// REQ histórico — sin CHECKPOINT confirmado Unificar vocabulario historico: archivo renombrado
// locus-backlog-archive.js → locus-backlog-historico.js. Rename mecánico de identificadores
// vivos: migrateClosedItemsToHistorico (ex archiveClosedItems), getHistoricoCount (ex
// getArchivoHistoricoCount), getHistoricoStats (ex getArchivoHistoricoStats),
// renderHistoricoSection (ex renderArchivoHistorico), _buildHistoricoPartitions,
// _renderHistoricoItems, _attachHistoricoChildToggleDelegation + ids/clases DOM
// (arch-* → historico-*, ver TKT1 de Nova en locus-historico.css) + localStorage key
// 'arch-collapsed-' → 'historico-collapsed-' (colapsos previos guardados bajo la key vieja
// se pierden — cosmético, el grupo vuelve a su default expandido, sin pérdida de datos de
// backlog). Sin cambio de comportamiento ni de firma externa salvo el nombre — mismos
// parámetros, mismo valor de retorno, mismos side effects. No incluye: no renombra
// `item.archivedAt` (campo de datos persistido, consumido también por
// locus-analytics-core.js y locus-backlog-sprints.js — fuera de scope, es cambio de schema
// no de vocabulario de módulo). No reescribe comentarios históricos de mods anteriores que
// mencionan identificadores ya removidos (_ARCH_KEY, toggleArchivoHistorico,
// _renderArchivoViewSprint/_renderArchivoViewFlat) — son registro histórico, no código vivo.
// [PP] mod:21 · autor:Rune · 2026-07-03 20:10 UTC-6
// locus-backlog-historico.js
// INC histórico — sin CHECKPOINT confirmado (mod:20): migrateClosedItemsToHistorico() reescrita para seguir el mismo contrato que
// _scmExecuteClose (locus-backlog-sprints.js) y setSprintStatus(closed) — persistir en
// storage dedicado vía saveHistoricoItems() y remover de ITEMS antes de saveBacklog().
// Antes: mutaba status in-place sin persistir en el storage dedicado ni sacar el ítem de
// ITEMS — saveBacklog() los excluía silenciosamente (solo-lectura), y el próximo _setITEMS()
// (undo, reload, etc) los descartaba por la barrera T-202606-106. Pérdida de datos real en
// todo cierre de sprint hecho vía el generador de paquete (confirmMapGenerator).
// TKT1+TKT2 (REQ histórico — sin CHECKPOINT confirmado Consolidar wiring de Histórico) — mod:21: eliminado el
// acordeón colapsable (_ARCH_KEY, toggleArchivoHistorico) y el listener duplicado de
// 'shell:render-historico' — el subtab dedicado (renderHistoricoPanel, locus-backlog-render.js)
// es ahora el único dueño de la activación y el render. renderHistoricoSection(listEl) pasa a
// ser función de puro render de contenido — sin wrapper de acordeón, sin estado de apertura.
// Impacto lateral resuelto en el mismo TKT: toggleArchivoHistorico se elimina del import de
// locus-backlog-render.js (dead import) y de locus-sprint-planificacion.js (dead alias
// toggleClosedSprintsBody, sin call sites reales — removida junto con su import).
// Nota: un intento de edición anterior sobre este mismo mod dejó el header describiendo
// TKT1+TKT2 como aplicado sin que el cuerpo del archivo reflejara el cambio — corregido ahora.
// Responsabilidad: Archivo histórico — archivar ítems cerrados, render agrupado por sprint.

import { renderStats, getItems, purgeAllHistorico, itemKind } from './locus-backlog-core.js';
import { buildBacklogItem } from './locus-backlog-item.js';

import { renderBacklogList, renderSprintGroup } from './locus-backlog-render.js';

import { getActiveSprints, saveBacklog, refreshHistoricoCache, getHistoricoItemsSync, getHistoricoItems, saveHistoricoItems, _invalidateHistoricoCache } from './locus-storage.js';

// Dependencias: locus-backlog-core.js · locus-storage.js

// ─────────────────────────────────────────────────────────────────────────────
// B-[tmp:closed-version]: archivar ítems done/descartados al hacer bump de versión
// Llamada desde confirmMapGenerator() en locus-map-generator.js (ahora awaited — ver header)
// B-202606 histórico — sin CHECKPOINT confirmado: fix — solo archiva ítems cuyos sprints están cerrados formalmente.
// Antes archivaba todos los done/descartado sin filtrar por sprint, migrando a historico
// ítems de sprints activos o programados que aún no habían sido cerrados.
// INC histórico — sin CHECKPOINT confirmado: fix de pérdida de datos — ver header del archivo. Contrato idéntico a
// _scmExecuteClose (locus-backlog-sprints.js:1638-1665): marcar → persistir en storage
// dedicado (merge sobre lo ya existente, saveHistoricoItems sobreescribe la clave completa) →
// remover de ITEMS in-place → invalidar cache. El splice ocurre fuera del try/catch: debe
// pasar aunque falle la persistencia, porque ITEMS nunca puede contener status:historico
// (barrera T-202606-106, locus-backlog-core.js _setITEMS).
// ─────────────────────────────────────────────────────────────────────────────
export async function migrateClosedItemsToHistorico() {
  const closedSprintIds = new Set(
    getActiveSprints().filter(s => s.status === 'closed').map(s => s.id)
  );
  const historicoTs = Date.now();
  const historicoCodes = new Set();
  const itemsArr = getItems();

  itemsArr.forEach(item => {
    if (item.status !== 'done' && item.status !== 'descartado') return;
    // B-202606 histórico — sin CHECKPOINT confirmado: solo archivar si el ítem pertenece a un sprint formalmente cerrado
    if (!item.sprint || !closedSprintIds.has(item.sprint)) return;
    item.status = 'historico';
    item.archivedAt = historicoTs;
    historicoCodes.add(item.code);
  });

  if (!historicoCodes.size) return;

  const newHistorico = itemsArr.filter(i => historicoCodes.has(i.code));
  try {
    const existingHistorico = await getHistoricoItems();
    await saveHistoricoItems([...(existingHistorico || []), ...newHistorico]);
  } catch (err) {
    // AC-3 (mismo criterio que _scmExecuteClose): fallo de escritura no revierte el archivado —
    // saveHistoricoItems ya cubre fallback a localStorage internamente.
    console.error('[AI Tracker] migrateClosedItemsToHistorico: fallo al persistir historico en storage dedicado', err);
  }

  for (let idx = itemsArr.length - 1; idx >= 0; idx--) {
    if (historicoCodes.has(itemsArr[idx].code)) itemsArr.splice(idx, 1);
  }
  _invalidateHistoricoCache();

  saveBacklog();
  renderBacklogList();
  renderStats();
}

// ─────────────────────────────────────────────────────────────────────────────
// R-202605-103: Archivo histórico unificado
// Reemplaza _renderHistoricoSection (B-202604-193) + closed-sprints-block.
// TKT2 (REQ Histórico unificado con Vista Lista de Backlog): vista única — agrupación por
// sprint cerrado vía renderSprintGroup (mismo motor de Backlog Vista Lista), con jerarquía
// R→hijos vía childMap. Reemplaza el sistema de 2 vistas toggleables (Por sprint / Lista plana)
// — sin distinción de sprints legado (antes S<23): cada sprint cerrado se agrupa igual sin
// importar su antigüedad, mismo criterio que Backlog Vista Lista.
// Read-only treatment: CSS escopado a #historico-body (Nova).
// ─────────────────────────────────────────────────────────────────────────────

// T-202606-103: Derivar ítems del archivo histórico desde sprints cerrados, no desde status historico.
// closedSprintIds: Set de ids de sprints con status === 'closed'.
// historicoItems: ítems cuyo sprint está en closedSprintIds (cualquier status).
// _legacyHistoricos: ítems con status === 'historico' NO en closedSprintIds — huérfanos del criterio nuevo.
//   Disponible para T2 (sección legacy con botón Purgar).
export let _legacyHistoricos = [];

// INC histórico — sin CHECKPOINT confirmado: getItems() nunca contiene status:historico desde T-202606-106 (barrera
// dura en locus-backlog-core.js _setITEMS) — los ítems historico viven exclusivamente en el
// storage dedicado (T-202606-105) y se leen vía getHistoricoItemsSync(). _buildHistoricoPartitions
// debe mergear ambas fuentes; el caller es responsable de haber llamado refreshHistoricoCache()
// antes (ver renderHistoricoSection / renderHistoricoPanel) — esta función permanece sync.
// TKT3 (REQ Histórico unificado): dedupe por code — mismo patrón que _getAllItemsWithHistorico()
// de locus-backlog-render.js. Sin esto, un ítem presente simultáneamente en getItems() y
// getHistoricoItemsSync() (condición de carrera ya identificada) aparecía duplicado en el panel.
function _mergeActiveAndHistorico() {
  const _active = getItems();
  const _historico = getHistoricoItemsSync();
  if (!_historico.length) return _active;
  const _seen = new Set(_active.map(i => i.code));
  const _merged = _active.slice();
  _historico.forEach(i => { if (!_seen.has(i.code)) { _merged.push(i); _seen.add(i.code); } });
  return _merged;
}

function _buildHistoricoPartitions() {
  const allItems      = _mergeActiveAndHistorico();
  const closedSprints = getActiveSprints().filter(s => s.status === 'closed');
  const closedSprintIds = new Set(closedSprints.map(s => s.id));

  // AC-1: ítems de sprints cerrados — cualquier status válido
  const historicoItems = allItems.filter(i => i.sprint && closedSprintIds.has(i.sprint));

  // AC-3: ítems legacy — status historico pero sprint NO en cerrados
  _legacyHistoricos = allItems.filter(i => i.status === 'historico' && (!i.sprint || !closedSprintIds.has(i.sprint)));

  return { historicoItems, closedSprints, closedSprintIds };
}

// T-202606-092 AC-2: conteo para badge del sub-tab Histórico.
// status:'historico' (via _legacyHistoricos) O sprint en lista de sprints cerrados (via historicoItems) — sin solape:
// historicoItems excluye por construcción los ítems que _legacyHistoricos incluye (sprint no cerrado).
export function getHistoricoCount() {
  const { historicoItems } = _buildHistoricoPartitions();
  return historicoItems.length + _legacyHistoricos.length;
}

// T-202606-006: breakdown por tipo y prioridad para stats-bar informativa del panel Histórico.
// Mismo universo que getHistoricoCount() — historicoItems + _legacyHistoricos, sin solape.
// Chips resultantes son informativos — no filtran ni disparan re-render (ver render.js).
// [tmp:tkt5-archive-stats] migrado a Gen2: byType con claves canónicas Gen2, detección via itemKind().
// TKT2 (REQ CAEL-0720-01, ref_id CAEL-0720-03): byEffort agregado — mismo universo
// (historicoItems + _legacyHistoricos) que byType/byPriority. Adición no disruptiva: el
// shape base {total, byType, byPriority} no cambia, solo se agrega una key nueva —
// ningún call site existente que destructura campos específicos se rompe.
export function getHistoricoStats() {
  const { historicoItems } = _buildHistoricoPartitions();
  const all = historicoItems.concat(_legacyHistoricos);

  const byType = { REQ: 0, TKT: 0 };
  const byPriority = { high: 0, medium: 0, low: 0 };
  const byEffort = { 1: 0, 2: 0, 3: 0 };

  all.forEach(i => {
    const t = itemKind(i);
    if (t && byType[t] !== undefined) byType[t]++;
    if (i.priority === 'high') byPriority.high++;
    else if (i.priority === 'low') byPriority.low++;
    else byPriority.medium++;
    const e = parseInt(i.effort) || 1;
    if (byEffort[e] !== undefined) byEffort[e]++;
  });

  return { total: all.length, byType, byPriority, byEffort };
}

// INC histórico — sin CHECKPOINT confirmado: async — refresca el cache de historico antes de construir las particiones.
// TKT1+TKT2: único caller ahora es renderHistoricoPanel() (locus-backlog-render.js) — el listener
// propio de 'shell:render-historico' que vivía en este archivo se eliminó (ver header del
// archivo). renderHistoricoSection deja de ser dueña de su propia activación y de su estado de
// apertura — es función de puro render de contenido sobre el listEl que el caller entrega.
export async function renderHistoricoSection(listEl) {
  await refreshHistoricoCache();
  const { historicoItems, closedSprints } = _buildHistoricoPartitions();

  const total = historicoItems.length;
  // B-202606-066: si hay al menos un sprint cerrado, renderizar la sección aunque
  // total y _legacyHistoricos sean 0 — el empty state correcto vive en
  // _renderHistoricoItems. Sin esto, el panel no se monta y el fallback genérico
  // ("No hay sprints cerrados aún") queda visible incluso cuando sí existe un
  // sprint cerrado, solo que sin ítems asignados.
  if (!total && !_legacyHistoricos.length && !closedSprints.length) return;

  // TKT2: guard de idempotencia — si el caller invoca esta función dos veces en vuelo antes de
  // que la primera resuelva (mismo riesgo ya identificado con el listener anterior), se remueve
  // cualquier instancia previa justo antes de crear la nueva — cualquiera que sea la última en
  // resolver deja exactamente una sección en el DOM.
  const _prevSection = listEl.querySelector('#historico-section');
  if (_prevSection) {
    const _prevDivider = _prevSection.previousElementSibling;
    if (_prevDivider && _prevDivider.classList.contains('historico-zone-divider')) _prevDivider.remove();
    _prevSection.remove();
  }

  // TKT2: acordeón colapsable (header, flecha, contador propio, estado de apertura) eliminado —
  // el panel ya es de pantalla completa (renderHistoricoPanel), no compite por espacio con
  // otros ítems, y el conteo lo muestra la stats-bar del panel. La sección se monta siempre
  // visible, sin wrapper de toggle.
  const section = document.createElement('div');
  section.id        = 'historico-section';
  section.className = 'historico-section';
  section.innerHTML = `
    <div class="historico-body" id="historico-body" role="region" aria-label="Archivo histórico"></div>`;

  const zoneDivider = document.createElement('div');
  zoneDivider.className = 'historico-zone-divider';
  listEl.appendChild(zoneDivider);
  listEl.appendChild(section);

  // T-202606-104: sección legacy — ítems con status historico sin sprint cerrado
  _renderLegacySection(listEl);

  _renderHistoricoItems();
}

// TKT2 (REQ Histórico unificado): reemplaza _renderArchivoViewSprint/_renderArchivoViewFlat —
// vista única, agrupación por sprint cerrado vía renderSprintGroup (mismo motor que Backlog
// Vista Lista). Sin distinción recentSprints/legacySprints (S-23): cada sprint cerrado se agrupa
// igual sin importar su antigüedad — Backlog Vista Lista tampoco distingue sprints legado, y este
// panel deja de tener una razón propia para hacerlo. isClosed:true siempre — Histórico solo
// contiene ítems de sprints con status:'closed' (ver _buildHistoricoPartitions).
function _renderHistoricoItems() {
  const body = document.getElementById('historico-body');
  if (!body) return;

  const { historicoItems, closedSprints } = _buildHistoricoPartitions();

  if (!historicoItems.length) {
    body.innerHTML = `<div class="historico-view"><div class="historico-empty">Sin ítems en sprints cerrados.</div></div>`;
    return;
  }

  const sortedClosed = [...closedSprints].sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0)); // más reciente primero

  let html = `<div class="historico-view" id="historico-view-sprint">`;
  sortedClosed.forEach(sp => {
    const spItems = historicoItems.filter(i => i.sprint === sp.id);
    if (!spItems.length) return;
    // TKT (fix groupId): contextPrefix 'hist' namespacea el groupId frente a Backlog Vista
    // Lista — ambos paneles persisten montados tras cambio de sub-tab (switchSubTab solo
    // alterna clase .active), y Vista Lista puede mostrar un sprint recién cerrado con ítems
    // done aún no archivados (ventana previa a migrateClosedItemsToHistorico()). Sin el prefijo, ambos
    // renderSprintGroup generaban el mismo groupId 'vl-<sprintId>' — dos ids duplicados en DOM.
    html += renderSprintGroup(spItems, true, 'hist');
  });
  html += `</div>`;

  body.innerHTML = html;
  _attachHistoricoChildToggleDelegation(body);
}

// TKT2: renderSprintGroup emite botones data-action="vl-toggle-r" para colapsar/expandir los
// hijos de un R — en Backlog Vista Lista esa delegación se adjunta sobre #backlog-list
// (locus-backlog-render.js, listener _vlToggleHandler junto a _attachBacklogListDelegation).
// #historico-body es un árbol de DOM distinto — sin esta réplica el botón queda inerte.
// Mismo archivo, sin scope nuevo, necesario para que el childMap de AC2 sea funcional y no solo
// visual — ver inline_fix en CHECKPOINT. Guard idéntico al patrón ya usado en este archivo
// (_historicoChildDelegationAttached) para no acumular listeners en re-renders.
//
// INC histórico — sin CHECKPOINT confirmado: renderSprintGroup también emite data-action="version-collapse" en el
// header de cada grupo — en Backlog esa acción la resuelve toggleVersionCollapse() (core.js)
// contra el Set compartido de _getCollapsedVersions(). Ese Set usa groupId = 'vl-' + sprintId
// sin distinguir contexto (Backlog vs Histórico) — coactuar sobre el mismo Set acoplaría el
// colapso de un sprint cerrado entre ambos paneles de forma no evaluada. Se implementa estado
// local, namespaced (historico-collapsed-<groupId>), independiente del de Backlog — decisión
// deliberada de desacoplar, no un atajo. El riesgo de colisión de id en el DOM si ambos paneles
// llegaran a montar el mismo groupId simultáneamente queda registrado como DISC — requiere que
// renderSprintGroup acepte un prefijo de contexto (cambio de firma, Effort 2+).
function _attachHistoricoChildToggleDelegation(body) {
  if (body._historicoChildDelegationAttached) return;
  body._historicoChildDelegationAttached = true;
  body.addEventListener('click', function _historicoVlToggleHandler(e) {
    const vcBtn = e.target.closest('[data-action="version-collapse"]');
    if (vcBtn) {
      const groupId = vcBtn.dataset.groupId;
      if (!groupId) return;
      const vbody = document.getElementById('vbody-' + groupId);
      const arrow = document.getElementById('varrow-' + groupId);
      if (!vbody) return;
      const isNowCollapsed = !vbody.classList.contains('collapsed');
      vbody.classList.toggle('collapsed', isNowCollapsed);
      if (arrow) arrow.classList.toggle('collapsed', isNowCollapsed);
      vcBtn.setAttribute('aria-expanded', String(!isNowCollapsed));
      const _key = 'historico-collapsed-' + groupId;
      try {
        if (isNowCollapsed) localStorage.setItem(_key, '1');
        else localStorage.removeItem(_key);
      } catch {}
      return;
    }
    const btn = e.target.closest('[data-action="vl-toggle-r"]');
    if (!btn) return;
    const rCode = btn.dataset.rCode;
    if (!rCode) return;
    const childBody = document.getElementById('bl-vl-req-body-' + CSS.escape(rCode));
    if (!childBody) return;
    const isNowCollapsed = !childBody.classList.contains('collapsed');
    childBody.classList.toggle('collapsed', isNowCollapsed);
    btn.classList.toggle('collapsed', isNowCollapsed);
    const _collapseKey = 'locus-r-collapsed-' + rCode;
    if (isNowCollapsed) {
      localStorage.setItem(_collapseKey, '1');
    } else {
      localStorage.removeItem(_collapseKey);
    }
  });
}

// TKT3 (REQ CAEL-0720-01, ref_id CAEL-0720-04): wiring del toolbar homologado con Backlog —
// Colapsar todo. Idempotente vía guard _historicoWired en el propio nodo, mismo patrón que
// _historicoChildDelegationAttached. Llamado por renderHistoricoPanel() (locus-backlog-render.js)
// después de inyectar #historico-header-unified — el toolbar es estático (vive en el mismo
// nodo que se recrea en cada render de renderHistoricoPanel), así que los listeners se
// re-adjuntan sobre los nodos frescos en cada llamada — el guard evita duplicar el listener
// si el caller invoca esta función más de una vez sobre el mismo montaje, no evita el
// re-wiring entre renders (el nodo #historico-toolbar es reemplazado por completo en cada
// render, por eso el guard se resetea al inicio de cada llamada, a diferencia de
// _historicoChildDelegationAttached que vive sobre #historico-body, nodo persistente entre
// renders del mismo montaje del panel).
// TKT-202608-299 (REQ-202608-118): buscador local (_applyHistoricoSearch, #historico-search-input,
// #historico-search-clear) retirado — reemplazado por ⌘K. Markup vivía en locus-backlog-render.js
// (dentro de _statsBarHtml), no en index.html como declaraba el AC — corregido en implementación,
// mismo criterio ya documentado abajo para AC3 ("declarado, no silenciado").
export function _initHistoricoToolbar() {
  const toolbar = document.getElementById('historico-toolbar');
  if (!toolbar) return;

  const collapseBtn = document.getElementById('historico-collapse-all-btn');
  if (collapseBtn && !collapseBtn._historicoWired) {
    collapseBtn._historicoWired = true;
    collapseBtn.addEventListener('click', () => {
      const bodies = document.querySelectorAll('#historico-body .bl-vl-sprint-body');
      if (!bodies.length) return;
      const anyExpanded = Array.from(bodies).some(b => !b.classList.contains('collapsed'));
      bodies.forEach(body => {
        const groupId = body.id.replace(/^vbody-/, '');
        const arrow = document.getElementById('varrow-' + groupId);
        body.classList.toggle('collapsed', anyExpanded);
        if (arrow) arrow.classList.toggle('collapsed', anyExpanded);
        const trigger = body.previousElementSibling;
        if (trigger && trigger.classList.contains('version-collapse-trigger')) {
          trigger.setAttribute('aria-expanded', String(!anyExpanded));
        }
        const key = 'historico-collapsed-' + groupId;
        try {
          if (anyExpanded) localStorage.setItem(key, '1');
          else localStorage.removeItem(key);
        } catch {}
      });
      collapseBtn.setAttribute('aria-pressed', String(anyExpanded));
      const label = collapseBtn.querySelector('.bl-collapse-btn-label');
      if (label) label.textContent = anyExpanded ? 'Expandir todo' : 'Colapsar todo';
    });
  }
}

// ─── fin R-202605-103 ──────────────────────────────────────────────────────

// T-202606-104: Sección legacy — ítems con status === 'historico' sin sprint cerrado.
// AC-1: si _legacyHistoricos.length > 0 → renderiza sección con conteo y botón Purgar.
// AC-3: si _legacyHistoricos.length === 0 → no renderiza nada (sin contenedor vacío).
// AC-4: el contador del encabezado principal (#historico-section-count) no incluye legacy —
//       solo historicoItems. Legacy se cuenta en su propio encabezado.
function _renderLegacySection(listEl) {
  // Eliminar sección legacy anterior si existe — evita duplicados en re-renders
  const existing = listEl.querySelector('#historico-legacy-section');
  if (existing) existing.remove();

  // AC-3: sin ítems legacy → no renderizar contenedor
  if (!_legacyHistoricos.length) return;

  const count = _legacyHistoricos.length;

  const legacy = document.createElement('div');
  legacy.id        = 'historico-legacy-section';
  legacy.className = 'historico-legacy-section';

  legacy.innerHTML = `
    <div class="historico-legacy-header">
      <span class="historico-legacy-title">Ítems legacy (sin sprint cerrado)</span>
      <span class="historico-legacy-count">${count} ítem${count !== 1 ? 's' : ''}</span>
      <button class="historico-legacy-purge-btn" data-action="historico-legacy-purge"
              title="Eliminar permanentemente estos ítems del backlog">Purgar</button>
    </div>`;

  listEl.appendChild(legacy);

  // AC-2: click en Purgar → purgeAllHistorico() con confirmación via modal (gconfirmOpen en core)
  // Delegación en el propio nodo legacy — no en listEl para no interferir con _historicoChildDelegationAttached
  legacy.addEventListener('click', function _legacyClick(e) {
    const btn = e.target.closest('[data-action="historico-legacy-purge"]');
    if (!btn) return;
    purgeAllHistorico();
  });
}

// T-202604-287: Vista Kanban — 4 columnas: pendiente · progreso · done · descartado

// TKT1 (REQ histórico — sin CHECKPOINT confirmado Consolidar wiring de Histórico): listener propio de
// 'shell:render-historico' eliminado — dos caminos de wiring corrían en paralelo sobre el
// mismo botón de sub-tab (este listener + _initHistoricoSubTab en locus-backlog-render.js),
// ambos async y sin orden garantizado entre sí. renderHistoricoPanel() (locus-backlog-render.js)
// es ahora el único listener de este evento — mismo patrón que qinc/qbacklog/qdisc.
