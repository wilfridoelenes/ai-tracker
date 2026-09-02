// [PP] mod:42 · autor:Rune · 2026-09-02 UTC-6
// TKT (TKT-202609-544, REQ-202609-225): botón 'Descartar' para REQ en el mismo idp-meta-cell
// de Status — visible cuando status no es terminal (≠done, ≠descartado). setItemStatus(code,
// 'descartado') ya existente, mismo mecanismo que idp-mark-done. .btn-danger-ghost (canónico,
// locus-layout.css) — sin CSS nuevo, restricción de Nova (refs_consultados: css_ref/ux_ref/
// ui_inventory: sí).
// [PP] mod:41 · autor:Rune · 2026-09-01 16:20 UTC-6
// TKT2 (TKT-202609-531, REQ-202609-226): _buildIdpDoneRequirements(item, type) — checklist
// derivado de solo lectura, visible únicamente en REQ en-revision. Espeja los gates ya
// vigentes en applyPatchesFromTG (hijo activo no-done, o done sin verified_by:'QA · Finn')
// sin escribir ningún campo — depends_on TKT-202609-530 (familia .idp-done-req-*/
// .idp-section--done-reqs en locus-backlog-item.css) resuelto. Filas sin data-action —
// no_incluye del TKT excluye botón de acción, a diferencia de childrenChipsHtml.
// [PP] mod:40 · autor:Rune · 2026-09-01 15:05 UTC-6
// TKT5 (TKT-202608-376, REQ-202608-149): render de archivos[] (TKT/INC/PRB/CHG, grupo
// Relaciones, dentro de depsHtml), queue (INC/PRB/CHG) y zona (DISC) (ambos grupo
// Ubicación, dentro de metaHtml) — cierra el gap de integración detectado por Finn en
// la sesión de cierre de REQ-202608-149 contra _Locus-ckpt-render-ref.
// TKT4 (TKT-202608-372, REQ-202608-149): dependsOn/blockedBy consolidados en un solo
// bloque de relaciones (depsHtml) con sub-etiqueta de origen 'schema'/'legacy' vía
// .idp-dep-origin-tag (Nova, locus-sesiones.css mod:55). dependsOnHtml retirado de
// _buildIdpSlotPlaneada — ya no duplica intención en N1.
// TKT2 (ref_id CAEL-08161420-03, REQ CAEL-08161420-01): triggered_by ahora visible en el
// IDP (bloque triggeredByHtml, junto a originChipHtml) — ver comentario inline junto a la
// función. Cierra DISC-202608-171.
// INC-CAEL-0718-01: agregado window.addEventListener('shell:close-item-panel', closeItemPanel)
// — el evento que switchTab()/switchSubTab() (locus-ui-shell.js) despachan desde mod:44 nunca
// tuvo consumidor real. Ver detalle completo junto a closeItemPanel(). Sin cambio de firma,
// sin impacto lateral — closeItemPanel() ya existía y ya se invocaba desde otros call sites
// de este mismo módulo (ESC handler, delegación de click). Único cambio: el ítem ahora también
// se cierra cuando la señal llega desde afuera del módulo.
// [PP] mod:28 · autor:Rune · 2026-07-13 08:40 UTC-6
// Fix directo en sesión (Auditoría Nova IDP, Hallazgo #2): discard_reason ahora se
//   renderiza también en el slot Reactiva (INC/PRB/KE/CHG descartado) — antes solo
//   existía en _buildIdpDiscSlot (exclusivo DISC), pese a ser campo obligatorio en
//   schema para los 4 tipos ITIL con status/incident_status descartado (__BR-Ecosystem
//   §5/§8). _discardReasonOf() centraliza el fallback dual discard_reason/discardReason
//   (mismo patrón ya usado en locus-storage.js:1526). Excepción de resolución directa
//   (BR-Core NO DEJAR DEUDA EN SILENCIO) — dueño presente, Nivel Patch (alineación de
//   schema, sin bifurcación), founder autorizó resolución en sesión.
// Fix directo en sesión (Auditoría Nova IDP, Hallazgo #3/#4): tabindex="0" role="button"
//   agregado a título editable, session-chip y todas las variantes de idp-dep-chip
//   (parent, depends_on, bloqueado-por, bloquea-a, derived_items) — antes solo
//   alcanzables por clic. _onIdpKeydown extiende Enter/Espacio reutilizando .click(),
//   mismo patrón ya usado para idp-toggle-*. CSS de foco visible entregado por Nova
//   (locus-backlog-item.css mod:54, locus-sesiones.css mod:+1). Misma excepción de
//   resolución directa — sin bifurcación, patrón ya vigente en el mismo archivo.
// TKT1 (ref_id CAEL-02, REQ IDP core+slots — PP-S-03): _buildIdpCore() extrae header
//   (título editable), notas, sesiones vinculadas y timeline a función compartida.
//   _renderItemPanel() delega en ella — markup idéntico, sin cambio de comportamiento.
// TKT2 (ref_id CAEL-03): _buildIdpDiscSlot() — discard_reason/promovida_a para DISC.
//   Reutiliza idp-meta-value--readonly / idp-dep-chip — sin CSS nuevo. AC corregido en
//   sesión: gap entre no_incluye del REQ y AC del TKT cerrado reutilizando clases existentes.
// TKT3 (ref_id CAEL-04): _buildIdpSlotPlaneada() — intencion/kill_criteria (REQ),
//   parent/depends_on/no_incluye (TKT). AC corregido en sesión: depends_on ≠ blockedBy
//   (campos distintos, ver locus-backlog-item.js L1024/1037) — reutiliza badge-missing--
//   dep-blocked ya existente en locus-backlog.css para referencias rotas.
// TKT4 (ref_id CAEL-05): _buildIdpSlotReactiva() — sla_priority/comportamiento_actual/
//   origin_module/derived_items/incident_status/resolution_type para INC·PRB·KE·CHG,
//   leídos exclusivamente vía los 6 getters de locus-inc-fields.js (incSlaPriority,
//   incComportamientoActual, incOriginModule, incDerivedItems, incIncidentStatus,
//   incResolutionType) — sin acceso directo a los campos crudos del ítem. CHG omite
//   la fila incident_status naturalmente (el getter retorna null — CHG usa status).
// Fix directo en sesión (Hallazgo Finn Momento 1): statusCellHtml alineado a
//   incIncidentStatus() — ya no lee item.incident_status crudo. Excepción de resolución
//   directa (BR-Core NO DEJAR DEUDA EN SILENCIO) — dueño presente, Nivel Patch, sin
//   bifurcación de founder.
// Fix directo en sesión: select genérico de status (REQ/TKT/CHG) agrega opción
//   en-revision — faltaba pese a ser estado válido para los 3 tipos (__BR-Ecosystem §5).
//   Ícono 🔄 reutilizado del fallback ya usado en statusIcons/statusIcons2 de este mismo
//   archivo — sin CSS nuevo. Misma excepción de resolución directa.
// Fix directo en sesión: _IDP_TYPE_NAMES completado con PRB/KE/CHG — antes caían al
//   fallback de string crudo del tipo en el header del panel. Misma excepción de
//   resolución directa.
// Fix directo en sesión: metaHtml oculta Priority/Effort/Sprint para INCIDENT_TYPES
//   (INC/PRB/KE/CHG) — no declaran esos campos en su schema (usan sla_priority, no
//   declaran effort, viven en Q-INC no en sprint). Extiende el patrón ya existente
//   para DISC (INC histórico — sin CHECKPOINT confirmado AC2) vía INCIDENT_TYPES, ya importado. Sin CSS nuevo.
// TKT-202607-045 (REQ-202607-015): chip 'Generado desde' (item.origin) usa
//   getAnyItem() en vez de getItems().find() — item.origin puede apuntar a un código ITIL.
// locus-backlog-panel.js
// Responsabilidad: Panel de detalle de ítem (IDP) — navegación, renderizado,
//   edición inline, timeline, notas, AC viewer, migración, template trigger.
// Dependencias: locus-backlog-core.js · locus-backlog-sprints.js · locus-toast.js

import { _getActiveSessionAiId, _openItemEditorSafe, _undoSnapshotItems, itemKind, renderStats, setItemStatus, undoBacklog, getItems, getAnyItem, INCIDENT_TYPES, _registerCoreCallback, _ECOSYSTEM_ROLES, statusLabel } from './locus-backlog-core.js'; // TKT-202607-045: getAnyItem agregada — chip 'Generado desde' puede resolver ITIL · [tmp:tkt4-status-guard]: INCIDENT_TYPES agregada — status cell readonly para ITIL · TKT (REQ-202609-225, gap de integración): statusLabel agregada — chip readonly de status para REQ
import { exportBacklogMd } from './locus-backlog-generator.js';
import { _getActiveProjectFilter, getAI, getActiveSprints, _sprintDisplay, getAllSessions, getProjectById, save, saveImmediate } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';

import { renderBacklogList } from './locus-backlog-render.js';

import { setItemSprint } from './locus-backlog-sprints.js';

import { _setBacklogModified } from './locus-docs.js';

import { openDetail, scrollToLogCard } from './locus-session-popup.js'; // T-202606-089 AC-3

import { esc, switchTab } from './locus-ui-shell.js';
import { toggleMoreMenu } from './locus-ui-shell.js'; // B-202606-021: movida desde locus-reports.js
import { incSlaPriority, incComportamientoActual, incOriginModule, incDerivedItems, incIncidentStatus, incResolutionType } from './locus-inc-fields.js'; // TKT4 (ref_id CAEL-05): slot Reactiva — punto único de lectura ITIL, sin acceso directo a campos crudos

// ── T-098: Exportar Backlog.md ──


// T-202604-286: sección "Mencionado en" — sesiones que referencian este ítem
export function _buildItemMentionedIn(item) {
  if (false) return '';
  const allSessions = getAllSessions();
  const mentions = allSessions.filter(s =>
    (s.backlogRefs || s.trackerRefs || []).includes(item.code)
  );
  if (!mentions.length) return '';

  const _fmtRel = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    const diffMs = Date.now() - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays}d`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)}sem`;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  const rows = mentions.map(s => {
    const ai = getAI(s.aiId);
    const aiName = ai ? esc(ai.name) : 'IA';
    const ts = s.savedAt || s.createdAt || 0;
    const dateLabel = _fmtRel(ts) || s.dateShort || s.date || '';
    const title = s.title ? esc(s.title) : '';
    return `<div class="bitem-mention-row" data-action="mention-goto-log" data-sess-id="${esc(s.id)}" title="Ver en Log View">
      <span class="bitem-mention-ai">${aiName}</span>
      <span class="bitem-mention-date">${dateLabel}</span>
      ${title ? `<span class="bitem-mention-title">${title}</span>` : ''}
    </div>`;
  }).join('');

  return `<div class="bitem-mentioned-in">
    <span class="bitem-mentioned-label">Mencionado en</span>
    ${rows}
  </div>`;
}

// T-202604-242: bloque visual "migrado de [proyecto]" en item-body
export function _buildItemMigratedBlock(item) {
  if (!item.migratedFrom) return '';
  const fromProj = item.migratedFromProject ? esc(item.migratedFromProject) : '(proyecto anterior)';
  return `<div class="bitem-migrated-block">
    <span class="bitem-migrated-label">&#x21C4; Migrado de</span>
    <span class="bitem-migrated-value">${fromProj}</span>
    <span class="bitem-migrated-code" title="Código original">(${esc(item.migratedFrom)})</span>
  </div>`;
}

// T-202604-242: modal de selección de proyecto destino
export function _openMigrateItem(code) {
  // [inline_fix triggered_by tkt3-panel-lookup]: mismo patrón, getAnyItem.
  const item = getAnyItem(code);
  if (!item) return;

  const currentProjId = _getActiveProjectFilter();
  const currentProj = currentProjId ? getProjectById(currentProjId) : null;
  const currentProjName = currentProj ? currentProj.name : '(sin proyecto)';

  const destProjects = (state.projects || []).filter(p => p.status !== 'paused' && p.id !== currentProjId);
  if (!destProjects.length) {
    showToast('warning', 'No hay otros proyectos disponibles como destino');
    return;
  }

  const projOptions = destProjects.map(p =>
    `<label class="migrate-modal-option"><input type="radio" name="migrate-dest" value="${esc(p.id)}"> ${esc(p.name)}</label>`
  ).join('');

  // TKT1 REQ CAEL-0719-01: shell unificado con promote (DUP-02 completado) —
  // #migrate-item-overlay eliminado, reutiliza #promote-modal-overlay/#promote-modal-body.
  // .migrate-modal es modificador de ancho — se agrega aquí y se remueve en _promoteItem/
  // _promoteTktToReq para que no persista sobre los otros dos flujos que comparten el shell.
  const overlay = document.getElementById('promote-modal-overlay');
  if (!overlay) return;
  const body = document.getElementById('promote-modal-body');
  if (body) {
    body.classList.add('migrate-modal');
    body.innerHTML = `
      <div class="promote-modal-title">&#x21C4; Mover item a otro proyecto</div>
      <div class="migrate-modal-item">Item: <strong>${esc(item.code)}</strong> &mdash; ${esc(item.title || '')}</div>
      <div class="migrate-modal-origin">Origen: ${esc(currentProjName)}</div>
      <div class="migrate-modal-dest-label">Proyecto destino</div>
      <div class="migrate-modal-options">
        ${projOptions}
      </div>
      <div class="migrate-modal-hint">El item desaparecera del proyecto actual y aparecera en el destino con una referencia de origen.</div>
      <div class="migrate-modal-actions">
        <button data-action="migrate-cancel" class="btn-cancel">Cancelar</button>
        <button id="migrate-confirm-btn" data-action="migrate-confirm" data-item-code="${esc(code)}" class="btn-primary" disabled>&#x21C4; Mover</button>
      </div>`;
  }
  overlay.classList.add('open');
  overlay.querySelectorAll('input[name="migrate-dest"]').forEach(r => {
    r.addEventListener('change', () => {
      const btn = document.getElementById('migrate-confirm-btn');
      if (btn) btn.disabled = false;
    });
  });
}

// T-202604-242: ejecutar migración — AC-1 conservar ref, AC-2 flag destino, AC-3 sin duplicado en origen
// TKT1 REQ CAEL-0719-01: exportada — su delegación (migrate-confirm) ahora vive en el
// listener unificado de #promote-modal-overlay en locus-backlog-item.js, no en este módulo.
export function _confirmMigrateItem(code) {
  const overlay = document.getElementById('promote-modal-overlay');
  const selected = overlay ? overlay.querySelector('input[name="migrate-dest"]:checked') : null;
  if (!selected) return;
  const targetProjId = selected.value;

  const item = getAnyItem(code);
  if (!item) return;

  const currentProjId = _getActiveProjectFilter();
  const currentProj = currentProjId ? getProjectById(currentProjId) : null;
  const currentProjName = currentProj ? currentProj.name : '(sin proyecto)';
  const targetProj = getProjectById(targetProjId);
  if (!targetProj) return;

  // AC-1: item destino conserva codigo origen como ref
  // AC-2: flag migratedFrom + migratedFromProject para bloque visual
  const migratedItem = Object.assign({}, item, {
    migratedFrom: code,
    migratedFromProject: currentProjName,
    migratedAt: Date.now()
  });

  // AC-3: eliminar del origen primero — snapshot + splice + persist antes de tocar destino
  const idx = getItems().indexOf(item);
  if (idx === -1) return;
  _undoSnapshotItems();
  getItems().splice(idx, 1);
  saveBacklog();
  _setBacklogModified();

  // AC-1: agregar al destino en proj.tracker.items (modelo v3)
  // proj.backlog es campo v2 — eliminado por _applyStateData en cada carga (locus-storage.js L1158)
  if (!targetProj.tracker) targetProj.tracker = { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
  if (!Array.isArray(targetProj.tracker.items)) targetProj.tracker.items = [];
  targetProj.tracker.items.push(migratedItem);
  // B-202605-018: persistir backlog del proyecto destino por el canal correcto (Supabase).
  // setProjBacklog deprecado (operaba sobre proj.backlog — campo v2 eliminado).
  // tracker.items ya actualizado arriba — saveBacklog() es suficiente.
  saveBacklog();
  // saveImmediate() — migrate es operación crítica de datos, no puede esperar el debounce de 5s
  saveImmediate();

  if (overlay) overlay.classList.remove('open');
  const _mgBody = document.getElementById('promote-modal-body');
  if (_mgBody) _mgBody.classList.remove('migrate-modal');
  renderBacklogList();
  renderStats();
  showToast('success', '&#x21C4; ' + code + ' movido a "' + targetProj.name + '"');
}

// ═══ T-202604-253: Space → done para ítem seleccionado ═══

// AC-1 + helper visual: marcar ítem como seleccionado (resaltar)
export function _backlogSetSelected(el) {
  // Quitar selección previa
  document.querySelectorAll('.item.bitem--selected').forEach(e => e.classList.remove('bitem--selected'));
  if (!el) { _backlogSelectedCode = null; return; }
  el.classList.add('bitem--selected');
  _backlogSelectedCode = el.getAttribute('data-code') || null;
}

// AC-1: keydown handler — Space cambia status a done si hay ítem seleccionado
// AC-2: sin conflicto con textarea, input, select, contenteditable
// B-202605-060: cleanup antes de registrar — evita acumulación en hot reload
(function _initBacklogSpaceKey() {
  if (document._backlogSpaceHandler) {
    document.removeEventListener('keydown', document._backlogSpaceHandler);
  }
  function _backlogSpaceHandler(e) {
    if (e.key !== ' ' && e.code !== 'Space') return;
    // AC-2: ignorar si el foco está en un campo de texto
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (document.activeElement && document.activeElement.isContentEditable) return;

    if (!_backlogSelectedCode) return;

    const item = typeof getItems() !== 'undefined' ? getItems().find(i => i.code === _backlogSelectedCode) : null;
    if (!item || item.status === 'done' || item.status === 'descartado') return;

    e.preventDefault();
    const code = _backlogSelectedCode;

    // Cambiar status a done vía setItemStatus existente
    setItemStatus(code, 'done');

    // Toast con acción Undo inline
    {
      showToast('success',
        `<span class="toast-undo-wrap">` +
        `<span>✓ <strong>${code}</strong> → done</span>` +
        `<button data-action="backlog-undo" ` +
        `class="toast-undo-btn">↩ Undo</button>` +
        `</span>`,
        null, 4000
      );
    }
  }
  document._backlogSpaceHandler = _backlogSpaceHandler;
  document.addEventListener('keydown', _backlogSpaceHandler);
})();

// Deseleccionar al hacer clic fuera de ítems del backlog
document.addEventListener('click', function(e) {
  if (!_backlogSelectedCode) return;
  const item = e.target.closest('.item[data-code]');
  if (!item) {
    document.querySelectorAll('.item.bitem--selected').forEach(el => el.classList.remove('bitem--selected'));
    _backlogSelectedCode = null;
  }
});

// ═══════════════════════════════════════════════════════════════
// R-202604-015: Item Detail Panel — ficha viva del ítem
// ═══════════════════════════════════════════════════════════════

let _itemPanelCode = null;

// T-202604-253: estado de ítem seleccionado en lista (Space → done)
let _backlogSelectedCode = null;

let _itemPanelNotesTimer = null;

export function openItemPanel(code) {
  // [tmp:tkt3-panel-lookup]: getAnyItem — un INC/PRB/KE/CHG vive en INCIDENTS, no en ITEMS.
  const item = getAnyItem(code);
  if (!item) return;
  _itemPanelCode = code;

  // R-202604-047: panel y wrapper estáticos en index.html — solo classList
  const panel = document.getElementById('item-detail-panel');
  const wrap = document.getElementById('backlog-two-col-wrap');
  if (!panel) return;

  if (wrap) wrap.classList.add('backlog-two-col');

  // B-161: ocultar roadmap y sprint health para liberar espacio en layout two-col
  const roadmap = document.getElementById('sprint-roadmap');
  if (roadmap) roadmap.classList.add('is-hidden');
  const spHealth = document.getElementById('sprint-health-panel');
  if (spHealth) spHealth.classList.add('is-hidden');

  // Registrar Esc handler (sin duplicar)
  document.removeEventListener('keydown', _itemPanelEscHandler);
  document.addEventListener('keydown', _itemPanelEscHandler);

  _renderItemPanel(item);
  panel.classList.add('open');
}

export function closeItemPanel() {
  const panel = document.getElementById('item-detail-panel');
  if (panel) {
    panel.classList.remove('open');
    // Colapsar layout two-col al cerrar
    setTimeout(() => {
      const wrap = document.getElementById('backlog-two-col-wrap');
      if (wrap) wrap.classList.remove('backlog-two-col');
      // B-161: restaurar roadmap y sprint health al cerrar panel
      const roadmap = document.getElementById('sprint-roadmap');
      if (roadmap) roadmap.classList.remove('is-hidden');
      const spHealth = document.getElementById('sprint-health-panel');
      if (spHealth) spHealth.classList.remove('is-hidden');
    }, 280);
  }
  _itemPanelCode = null;
  document.removeEventListener('keydown', _itemPanelEscHandler);
}

// INC-CAEL-0718-01: switchTab()/switchSubTab() (locus-ui-shell.js, mod:44/B-202605-207)
// despachan 'shell:close-item-panel' desde mod:44 — sin este listener el evento no tenía
// consumidor real pese a que el comentario fuente en locus-ui-shell.js ya declaraba
// "locus-backlog-panel.js escucha 'shell:close-item-panel'". El panel quedaba abierto y
// montado al cambiar de sub-tab (ej. Discoveries → Backlog), mostrando el ítem del subtab
// de origen. Mismo patrón que el resto de listeners `shell:*` de este módulo del ecosistema
// (ver locus-backlog-qbacklog.js) — registrado una sola vez al cargar el módulo.
window.addEventListener('shell:close-item-panel', closeItemPanel);

// TKT1 (REQ CAEL-0718-02): refrescar el contenido del IDP cuando el backlog cambia y el
// panel está abierto — mismo patrón de guard que shell:backlog-render-dirty en
// locus-backlog-qbacklog.js/locus-backlog-qdisc.js/locus-backlog-render.js. No cierra el
// panel — solo re-renderiza con los datos post-merge del mismo code, evitando que un sync
// remoto en segundo plano deje el IDP abierto mostrando datos obsoletos o inexistentes.
window.addEventListener('shell:backlog-render-dirty', () => {
  if (!_itemPanelCode) return;
  const item = getAnyItem(_itemPanelCode);
  if (item) _renderItemPanel(item);
});

function _itemPanelEscHandler(e) {
  if (e.key === 'Escape') {
    // Colapsar el ítem expandido también
    if (_itemPanelCode) {
      const itemEl = document.querySelector(`.item[data-code="${CSS.escape(_itemPanelCode)}"]`);
      if (itemEl) {
        const body = itemEl.querySelector('.bitem-body');
        const arrow = itemEl.querySelector('.bitem-collapse-arrow');
        if (body && body.classList.contains('open')) {
          body.classList.remove('open');
          if (arrow) arrow.textContent = '▸';
        }
      }
    }
    closeItemPanel();
  }
}

// TKT1 (REQ IDP — core compartido + slots por familia): _buildIdpCore() extrae
// título editable (header), notas, sesiones vinculadas y timeline — lo genuinamente
// común entre los 7 tipos de ítem. _renderItemPanel() delega en esta función y
// conserva el resto (meta grid, AC, dependencias, origen) hasta que TKT2-4
// introduzcan los slots por familia. Markup idéntico al previo a este TKT —
// sin cambio de comportamiento observable.
const _IDP_TYPE_NAMES = { TKT: 'Ticket', REQ: 'Requerimiento', INC: 'Incidente', DISC: 'Discovery', PRB: 'Problema', CHG: 'Cambio' };

function _buildIdpCore(item, type) {
  // AC error: item ausente → mismo estado vacío que hoy (openItemPanel ya filtra
  // antes de invocar _renderItemPanel; este guard cubre invocación directa del core).
  if (!item) {
    return { headerHtml: '', notesHtml: '', sessionsHtml: '', preCreationHtml: '', timelineHtml: '' };
  }

  // ── Header (título editable) ──
  const doneBtn = item.status !== 'done' ? `<button class="idp-action-btn idp-action-done" data-action="idp-mark-done" data-code="${esc(item.code)}" title="Marcar done">✓ Done</button>` : '';
  const headerHtml = `
    <div class="idp-header">
      <div class="idp-type-chip idp-type-${type}">${type}</div>
      <div class="idp-header-meta">
        <span class="idp-code">${esc(item.code)}</span>
        <span class="idp-type-name">${_IDP_TYPE_NAMES[type] || type}</span>
      </div>
      <button class="idp-close-btn" data-action="idp-close" title="Cerrar panel (Esc)">✕</button>
    </div>
    <div class="idp-title-wrap">
      <span class="idp-title" id="idp-title-display"
        data-action="idp-start-edit-title" data-code="${esc(item.code)}"
        tabindex="0" role="button"
        title="Click o Enter para editar título">${esc(item.title)}</span>
      <input class="idp-title-input is-hidden" id="idp-title-input"
        value="${esc(item.title)}"
        data-action="idp-title-input" data-code="${esc(item.code)}">
    </div>
    <div class="idp-actions-bar">
      <button class="idp-action-btn" data-action="idp-copy-code" data-code="${esc(item.code)}" title="Copiar código">⎘ ${esc(item.code)}</button>
      <button class="idp-action-btn" data-action="idp-edit" data-item-code="${esc(item.code)}" title="Abrir editor completo">✎ Editar</button>
      ${doneBtn}
    </div>`;

  // ── Notes ──
  const notesHtml = `
    <div class="idp-section">
      <div class="idp-section-label">Notas</div>
      <textarea class="idp-notes-ta" id="idp-notes-ta" placeholder="Añade notas sobre este ítem...">${esc(item.notes || '')}</textarea>
      <div class="idp-notes-status" id="idp-notes-status"></div>
    </div>`;

  // ── Sessions vinculadas ──
  const allSessions = getAllSessions();
  const allLinkedSessions = allSessions.filter(s => (s.trackerRefs || []).includes(item.code) || (s.backlogRefs || []).includes(item.code)); // R-202605-042: incluir backlogRefs — alineado con _hasRecentSession e _isActiveRecently

  // R-202605-041: separar sesiones pre-creación (session.savedAt < item.createdAt)
  // Ítems legacy sin createdAt → todas las sesiones van al bloque principal (comportamiento anterior)
  const _sessTs = s => s.savedAt || 0;
  const linkedSessions = item.createdAt
    ? allLinkedSessions.filter(s => _sessTs(s) >= item.createdAt)
    : allLinkedSessions;
  const preCreationSessions = item.createdAt
    ? allLinkedSessions.filter(s => _sessTs(s) < item.createdAt)
    : [];

  const _sessChip = (s, canUnlink) => {
    const ai = getAI(s.aiId);
    const aiName = ai ? esc(ai.name) : 'IA';
    const dateLabel = s.dateShort || s.date || '';
    return `<div class="idp-session-chip" data-action="idp-goto-session" data-ai-id="${s.aiId}" data-sess-id="${s.id}" tabindex="0" role="button">
      <span class="idp-sess-ai">${aiName}</span>
      <span class="idp-sess-date">${esc(dateLabel)}</span>
      ${s.title ? `<span class="idp-sess-title">${esc(s.title)}</span>` : ''}
      ${canUnlink ? `<button class="idp-sess-unlink" data-action="idp-unlink-session" data-item-code="${esc(item.code)}" data-sess-id="${s.id}" title="Desvincular sesión">✕</button>` : ''}
    </div>`;
  };

  const preCreationHtml = preCreationSessions.length ? `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" data-action="idp-toggle-section" role="button" tabindex="0" aria-expanded="false" aria-controls="idp-pre-creation-list">
        <span>Mencionado antes de creación (${preCreationSessions.length})</span>
        <svg class="ti-svg chevron" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>
      </div>
      <div class="idp-sessions-list is-hidden" id="idp-pre-creation-list">
        ${preCreationSessions.map(s => _sessChip(s, false)).join('')}
      </div>
    </div>` : '';

  const sessionsHtml = linkedSessions.length ? `
    <div class="idp-section">
      <div class="idp-section-label">Sesiones vinculadas</div>
      <div class="idp-sessions-list">
        ${linkedSessions.map(s => _sessChip(s, true)).join('')}
      </div>
    </div>` : '';

  // ── Timeline ──
  const timelineHtml = _buildPanelTimeline(item);

  return { headerHtml, notesHtml, sessionsHtml, preCreationHtml, timelineHtml };
}

// TKT1 (ref_id CAEL-08161420-02, REQ CAEL-08161420-01 · origen_disc DISC-202608-170):
// motor de render de los grupos visuales del catálogo _Locus-ckpt-render-ref que
// TKT-202608-333 ya asignó render_hint pero que no tenían representación en el IDP —
// "Contrato condicional" (inline-detail), "Aval/borrador" (status-strip) y "UI
// condicional" (conditional-badge). No reemplaza discSlotHtml/planeadaSlotHtml/
// reactivaSlotHtml — los complementa. Reutiliza clases ya existentes en este archivo
// (idp-meta-value--readonly, idp-section, idp-pill) — nuevos modificadores declarados
// en locus-backlog-item.css, sin componente nuevo.

function _buildIdpContractSlot(item) {
  // Grupo "Contrato condicional" — visible solo si contract_update:"sí" con
  // contract_detail presente (obligatorio en TKT Effort 2+ con contrato, __BR-Execution §2).
  if (item.contract_update !== 'sí' || !item.contract_detail) return '';
  const cd = item.contract_detail;
  const fns = Array.isArray(cd.functions) ? cd.functions : [];
  return `
    <div class="idp-section idp-section--contract">
      <div class="idp-section-label">Contrato de módulo</div>
      <div class="idp-meta-value idp-meta-value--readonly">Archivo: ${esc(cd.file || '—')}</div>
      ${fns.map(fn => `
        <div class="idp-contract-fn">
          <div class="idp-meta-value idp-meta-value--readonly idp-contract-fn-name">${esc(fn.name || '—')}${fn.signature_change ? ' <span class="idp-pill idp-pill--warn">firma cambiada</span>' : ''}</div>
          <div class="idp-meta-value idp-meta-value--readonly">${esc(fn.signature || '—')}</div>
          ${(Array.isArray(fn.invariants) ? fn.invariants : []).map(inv => `<div class="idp-meta-value idp-meta-value--readonly idp-contract-detail-row">invariant: ${esc(inv)}</div>`).join('')}
          ${(Array.isArray(fn.sideEffects) ? fn.sideEffects : []).map(se => `<div class="idp-meta-value idp-meta-value--readonly idp-contract-detail-row">sideEffect: ${esc(se)}</div>`).join('')}
        </div>`).join('')}
    </div>`;
}

function _buildIdpDraftStrip(item) {
  // Grupo "Aval/borrador" — franja en la Zona Identidad, mismo componente que el
  // Estado de aval ya entregado en TKT-202607-204 (draft → avalado). Exclusivo de
  // la rama Planeada (REQ/TKT) — INC/PRB/CHG/DISC nunca declaran draft (__BR-Ecosystem §8).
  const hasDraftField = typeof item.draft !== 'undefined' && item.draft !== null;
  const drc = item.doc_relevance_confirmada || {};
  const drcKeys = Object.keys(drc);
  if (!hasDraftField && !drcKeys.length) return '';
  const draftLabel = item.draft === true
    ? '◌ pendiente de aval Finn'
    : item.draft === false
    ? `✓ avalado${item.verified_by ? ' — ' + esc(item.verified_by) : ''}`
    : '';
  const drcRows = drcKeys.map(k => `<span class="idp-meta-value idp-meta-value--readonly idp-draft-strip-row">doc_relevance_confirmada.${esc(k)}: ${esc(drc[k])}</span>`).join('');
  return `
    <div class="idp-draft-strip">
      ${draftLabel ? `<span class="idp-pill idp-pill--draft">${draftLabel}</span>` : ''}
      ${drcRows}
    </div>`;
}

function _buildIdpUiConditionalBadges(item) {
  // Grupo "UI condicional" — visible solo si el ítem toca UI: design_intent presente
  // o algún doc_relevance en "sí". Mismo criterio que el bloqueo UI de Rune (__BR-Execution §2).
  const dr = item.doc_relevance || {};
  const touchesUi = !!item.design_intent || Object.keys(dr).some(k => dr[k] === 'sí');
  if (!touchesUi) return '';
  const drBadges = Object.keys(dr).filter(k => dr[k] === 'sí')
    .map(k => `<span class="idp-pill idp-pill--ui-cond">${esc(k)}: sí</span>`).join('');
  const designIntentBadge = item.design_intent
    ? `<span class="idp-pill idp-pill--ui-cond" title="Borrador visual aprobado por el founder">design_intent: ${esc(item.design_intent)}</span>` : '';
  return `
    <div class="idp-section idp-section--ui-conditional">
      <div class="idp-section-label">UI condicional</div>
      <div class="idp-ui-cond-badges">${designIntentBadge}${drBadges}</div>
    </div>`;
}

function _renderItemPanel(item) {
  const panel = document.getElementById('item-detail-panel');
  if (!panel) return;

  const type = itemKind(item) || '';
  const _core = _buildIdpCore(item, type);
  const { headerHtml, notesHtml, sessionsHtml, preCreationHtml, timelineHtml } = _core;

  // ══ Metadata grid — campos editables ══
  const sprintOptions = getActiveSprints().filter(s => s.status !== 'closed')
    .map(s => `<option value="${esc(s.id)}"${item.sprint === s.id ? ' selected' : ''}>${esc(_sprintDisplay(s.id))}${s.status === 'active' ? ' ★' : ''}</option>`).join('');
  const sprintOrphan = item.sprint && !getActiveSprints().find(s => s.id === item.sprint)
    ? `<option value="${esc(item.sprint)}" selected>${esc(item.sprint)}</option>` : '';
  // T-202606-036 AC4: T con parent — sprint heredado no editable
  const _isInheritedSprint = item.parentId && itemKind(item) === 'TKT';
  const _parentItem = _isInheritedSprint ? (getItems() || []).find(i => i.code === item.parentId) : null;
  // TKT4 histórico — sin CHECKPOINT confirmado: _sprintDisplay aplica patrón id · label — antes solo .label || _parentItem.sprint
  const _inheritedLabel = _parentItem
    ? ((_parentItem.sprint && getActiveSprints().find(s => s.id === _parentItem.sprint))
        ? _sprintDisplay(_parentItem.sprint)
        : (_parentItem.sprint || '— Sin asignar'))
    : '— Sin asignar';
  // [tmp:tkt-panel-readonly-mode]: ítems done/descartado — selects e input del panel pasan a disabled/readonly. Declarada una sola vez, antes de su primer consumo (sprintCellHtml) — antes se repetía inline en 3 puntos del mismo scope.
  const _isReadonlyItem = item.status === 'done' || item.status === 'descartado';
  const _roDisabled = _isReadonlyItem ? ' disabled' : '';
  const _roReadonly = _isReadonlyItem ? ' readonly' : '';

  const sprintCellHtml = _isInheritedSprint
    ? `<span class="idp-meta-value idp-meta-value--inherited" title="El sprint del T se hereda de su parent ${esc(item.parentId)}">${esc(_inheritedLabel)} <span class="idp-inherited-badge">heredado</span></span>`
    : `<select class="idp-meta-select" data-item-code="${esc(item.code)}" data-field="sprint"${_roDisabled}>
          <option value="">— Sin asignar</option>
          ${sprintOptions}
          ${sprintOrphan}
        </select>`;

  // INC histórico — sin CHECKPOINT confirmado AC1: DISC — Status es badge de solo lectura (discovery|promoted|descartado, nunca pendiente/done)
  // [tmp:tkt-panel-readonly-mode]: item.status done/descartado → status select también disabled (AC literal)
  const _discStatusLabels = { discovery: '◆ discovery', promoted: '➜ promoted', descartado: '🗑 descartado' };
  // [tmp:tkt4-status-guard]: solo INC/PRB/KE — badge de solo lectura, mismo patrón que DISC.
  // CHG es la excepción dentro de INCIDENT_TYPES: usa vocabulario Scrum real
  // (pendiente/en-revision/done/descartado, __BR-Ecosystem §5) — sigue con el <select> normal.
  const _ITIL_SCRUM_INCOMPATIBLE = ['INC', 'PRB'];
  const _incidentStatusLabels = {
    detected: '● detected', assigned: '● assigned', in_progress: '● in_progress',
    resolved: '✓ resolved', closed: '✓ closed',
    escalated_to_prb: '➜ escalated_to_prb', escalated_to_chg: '➜ escalated_to_chg',
    active: '● active', descartado: '🗑 descartado'
  };
  // TKT2 (ref_id CAEL-03, REQ IDP core+slots): slot DISC — discard_reason y promovida_a.
  // AC corregido en sesión (gap de especificación cerrado por Cael): reutiliza clases ya
  // existentes en este mismo archivo (idp-meta-value--readonly, idp-dep-chip) — no introduce
  // CSS ni componente nuevo, consistente con el no_incluye del REQ.
  const _discardReasonOf = (it) => it.discard_reason || it.discardReason || null;
  const _buildIdpDiscSlot = (it) => {
    if (it.status === 'descartado') {
      return `<div class="idp-meta-row">
        <span class="idp-meta-value idp-meta-value--readonly">discard_reason: ${esc(_discardReasonOf(it) || 'sin registrar')}</span>
      </div>`;
    }
    if (it.status === 'promoted' && it.promovida_a) {
      return `<div class="idp-meta-row">
        <span class="idp-dep-chip" data-action="idp-open-panel" data-item-code="${esc(it.promovida_a)}" title="Ítem resultante de la promoción">➜ promovida_a ${esc(it.promovida_a)}</span>
      </div>`;
    }
    return '';
  };
  const discSlotHtml = type === 'DISC' ? _buildIdpDiscSlot(item) : '';

  // TKT3 (ref_id CAEL-04, REQ IDP core+slots): slot Planeada — REQ muestra intencion +
  // kill_criteria (si existe); TKT muestra parent + depends_on + no_incluye. AC corregido
  // en sesión: depends_on no es blockedBy (campos distintos, ver locus-backlog-item.js
  // L1024/1037) — reutiliza el patrón de badge ya existente para dependsOn roto
  // (badge-missing--dep-blocked, ya cargado en index.html vía locus-backlog.css).
  const _depPlaceholderRe = /^\[pendiente-ID\]$|^\[tmp:.+\]$|^\{"ref_id"/;
  const _buildIdpSlotPlaneada = (it, t) => {
    if (t === 'REQ') {
      const _int = it.intencion || {};
      const hasIntencion = _int.problema || _int.done_cuando || _int.no_incluye;
      const intencionHtml = hasIntencion ? `
        <div class="idp-section">
          <div class="idp-section-label">Intención</div>
          <div class="idp-meta-value idp-meta-value--readonly">Problema: ${esc(_int.problema || '—')}</div>
          <div class="idp-meta-value idp-meta-value--readonly">Done cuando: ${esc(_int.done_cuando || '—')}</div>
          <div class="idp-meta-value idp-meta-value--readonly">No incluye: ${esc(_int.no_incluye || '—')}</div>
        </div>` : '';
      // AC edge case: REQ sin kill_criteria no muestra el campo — sin bloque vacío roto
      const killHtml = it.kill_criteria ? `
        <div class="idp-section">
          <div class="idp-section-label">Kill criteria</div>
          <div class="idp-meta-value idp-meta-value--readonly">${esc(it.kill_criteria)}</div>
        </div>` : '';
      return `${intencionHtml}${killHtml}`;
    }
    if (t === 'TKT') {
      const parentChip = it.parentId
        ? `<span class="idp-dep-chip" data-action="idp-open-panel" data-item-code="${esc(it.parentId)}" tabindex="0" role="button" title="Ir al REQ padre">↑ parent ${esc(it.parentId)}</span>`
        : '';
      const parentHtml = parentChip ? `
        <div class="idp-section">
          <div class="idp-section-label">Parent</div>
          ${parentChip}
        </div>` : '';

      // TKT4: dependsOn ya no se renderiza aquí — consolidado en depsHtml
      // (_renderItemPanel) junto a blockedBy, con sub-etiqueta de origen.

      const noIncluyeList = Array.isArray(it.no_incluye) ? it.no_incluye : (it.no_incluye ? [it.no_incluye] : []);
      const noIncluyeHtml = noIncluyeList.length ? `
        <div class="idp-section">
          <div class="idp-section-label">No incluye</div>
          ${noIncluyeList.map(n => `<div class="idp-meta-value idp-meta-value--readonly">– ${esc(n)}</div>`).join('')}
        </div>` : '';

      return `${parentHtml}${noIncluyeHtml}`;
    }
    return '';
  };
  const planeadaSlotHtml = (type === 'REQ' || type === 'TKT') ? _buildIdpSlotPlaneada(item, type) : '';

  // TKT1 (ref_id CAEL-08161420-02): grupos del catálogo antes sin render — ver
  // funciones declaradas arriba de _renderItemPanel.
  const contractSlotHtml = type === 'TKT' ? _buildIdpContractSlot(item) : '';
  const draftStripHtml = (type === 'REQ' || type === 'TKT') ? _buildIdpDraftStrip(item) : '';
  const uiConditionalHtml = (type === 'REQ' || type === 'TKT') ? _buildIdpUiConditionalBadges(item) : '';

  // TKT4 (ref_id CAEL-05, REQ IDP core+slots): slot Reactiva — INC/PRB/KE/CHG.
  // Punto único de lectura ITIL vía los 6 getters de locus-inc-fields.js — sin acceso
  // directo a item.sla_priority ni equivalentes camelCase/snake_case. incIncidentStatus()
  // retorna null para CHG (no declara incident_status en su schema, usa status — ya
  // renderizado por statusCellHtml) por lo que la fila se omite naturalmente sin
  // caso especial por tipo — AC edge case CHG cubierto por el propio contrato del getter.
  const _buildIdpSlotReactiva = (it) => {
    const slaPriority = incSlaPriority(it);
    const comportamientoActual = incComportamientoActual(it);
    const originModule = incOriginModule(it);
    const derivedItems = incDerivedItems(it);
    const incidentStatus = incIncidentStatus(it);
    const resolutionType = incResolutionType(it);

    const slaRow = `<div class="idp-meta-value idp-meta-value--readonly">sla_priority: ${esc(slaPriority || 'sin registrar')}</div>`;

    // AC error: KE sin comportamiento_actual (obligatorio en KE/INC, opcional en PRB) →
    // placeholder 'sin registrar' — nunca fila vacía o rota.
    const comportamientoRow = `<div class="idp-meta-value idp-meta-value--readonly">comportamiento_actual: ${esc(comportamientoActual || 'sin registrar')}</div>`;

    const originModuleRow = originModule
      ? `<div class="idp-meta-value idp-meta-value--readonly">origin_module: ${esc(originModule)}</div>`
      : '';

    // AC edge case — CHG: incIncidentStatus() retorna null (CHG usa status, no
    // incident_status) → fila omitida, sin mezclar vocabulario ITIL.
    const incidentStatusRow = incidentStatus
      ? `<div class="idp-meta-value idp-meta-value--readonly">incident_status: ${esc(incidentStatus)}</div>`
      : '';

    const resolutionTypeRow = resolutionType
      ? `<div class="idp-meta-value idp-meta-value--readonly">resolution_type: ${esc(resolutionType)}</div>`
      : '';

    // Fix directo en sesión (Hallazgo #2 — gap de especificación cerrado en esta sesión):
    // discard_reason es obligatorio en schema para INC/PRB/KE/CHG con status descartado
    // (__BR-Ecosystem §5/§8), pero solo se renderizaba en _buildIdpDiscSlot (exclusivo DISC).
    // CHG usa `status` (no incident_status, __BR-Ecosystem §4b) — is_descartado cubre ambas
    // convenciones sin caso especial por tipo, mismo criterio ya aplicado a incidentStatusRow.
    const _isDescartado = incidentStatus === 'descartado' || it.status === 'descartado';
    const discardReasonRow = _isDescartado
      ? `<div class="idp-meta-value idp-meta-value--readonly">discard_reason: ${esc(_discardReasonOf(it) || 'sin registrar')}</div>`
      : '';

    const derivedItemsHtml = (Array.isArray(derivedItems) && derivedItems.length) ? `
      <div class="idp-section">
        <div class="idp-section-label">Derived items</div>
        <div class="idp-deps-chips">
          ${derivedItems.map(c => `<span class="idp-dep-chip" data-action="idp-open-panel" data-item-code="${esc(c)}" tabindex="0" role="button" title="Ítem derivado">➜ ${esc(c)}</span>`).join('')}
        </div>
      </div>` : '';

    return `
      <div class="idp-section">
        <div class="idp-section-label">ITIL</div>
        ${slaRow}
        ${comportamientoRow}
        ${originModuleRow}
        ${incidentStatusRow}
        ${resolutionTypeRow}
        ${discardReasonRow}
      </div>${derivedItemsHtml}`;
  };
  const reactivaSlotHtml = INCIDENT_TYPES.includes(type) ? _buildIdpSlotReactiva(item) : '';

  // Fix directo en sesión (NO DEJAR DEUDA EN SILENCIO — excepción de resolución directa:
  // dueño presente + Nivel Patch + sin bifurcación de founder): statusCellHtml leía
  // item.incident_status || item.status directo — único acceso ITIL crudo restante fuera
  // de _buildIdpSlotReactiva. Alineado a incIncidentStatus(), con fallback a item.status
  // preservado (el getter retorna null para CHG, que usa status — mismo comportamiento
  // observable, sin regresión).
  // TKT (REQ-202609-225, gap de integración — Momento 2 de Finn): REQ agregado a la rama
  // readonly, mismo patrón que DISC/INCIDENT_TYPES — el ciclo de vida de REQ (__BR-Core §4:
  // pendiente/en-proceso/en-revision/bloqueado/orphaned/descartado) no es editable por el
  // founder vía IDP, las transiciones son automáticas o exclusivas del juicio de Finn.
  // statusLabel() cubre el label correcto para cualquier status real de REQ — el <select>
  // genérico anterior solo declaraba 4 de los 6 valores válidos.
  const statusCellHtml = type === 'DISC'
    ? `<span class="idp-meta-value idp-meta-value--readonly">${_discStatusLabels[item.status] || esc(item.status || '—')}</span>`
    : type === 'REQ'
    ? `<span class="idp-meta-value idp-meta-value--readonly">${esc(statusLabel(item.status) || item.status || '—')}</span>`
    : _ITIL_SCRUM_INCOMPATIBLE.includes(type)
    ? `<span class="idp-meta-value idp-meta-value--readonly">${_incidentStatusLabels[incIncidentStatus(item) || item.status] || esc(incIncidentStatus(item) || item.status || '—')}</span>`
    : `<select class="idp-meta-select" data-item-code="${esc(item.code)}" data-field="status"${_roDisabled}>
          <option value="pendiente"${item.status === 'pendiente' ? ' selected' : ''}>⏳ pendiente</option>
          <option value="en-revision"${item.status === 'en-revision' ? ' selected' : ''}>🔄 en-revision</option>
          <option value="done"${item.status === 'done' ? ' selected' : ''}>✓ done</option>
          <option value="descartado"${item.status === 'descartado' ? ' selected' : ''}>🗑 descartado</option>
        </select>`;

  // TKT (REQ-202609-225, TKT-202609-544, gap de integración detectado por Finn — AC2 del
  // REQ pendiente de implementación): botón 'Descartar' — visible cuando el status de REQ
  // no es terminal (≠done, ≠descartado). AC4: cualquier status no-terminal lo muestra,
  // incluidos bloqueado/orphaned — sin lista cerrada. Mismo mecanismo que idp-mark-done
  // (setItemStatus ya cubre los gates de validación existentes, sin reimplementar la llamada).
  const discardReqBtnHtml = (type === 'REQ' && item.status !== 'done' && item.status !== 'descartado')
    ? `<button class="btn-danger-ghost idp-discard-req-btn" data-action="idp-discard-req" data-code="${esc(item.code)}" title="Descartar REQ">Descartar</button>`
    : '';

  // Fix directo en sesión: Sprint/Priority/Effort no aplican a INC/PRB/KE/CHG (usan
  // sla_priority, no declaran effort, y viven en Q-INC — no en sprint). Extiende el
  // patrón ya usado para DISC (INC histórico — sin CHECKPOINT confirmado AC2) vía INCIDENT_TYPES, ya importado.
  const _idpHideScrumFields = type === 'DISC' || INCIDENT_TYPES.includes(type);
  const sprintMetaCellHtml = _idpHideScrumFields ? '' : `
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Sprint</span>
        ${sprintCellHtml}
      </div>`;

  const priorityMetaCellHtml = INCIDENT_TYPES.includes(type) ? '' : `
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Priority</span>
        <select class="idp-meta-select" data-item-code="${esc(item.code)}" data-field="priority"${_roDisabled}>
          <option value="high"${item.priority === 'high' ? ' selected' : ''}>🔴 high</option>
          <option value="medium"${item.priority === 'medium' ? ' selected' : ''}>🟡 medium</option>
          <option value="low"${item.priority === 'low' ? ' selected' : ''}>⚪ low</option>
        </select>
      </div>`;

  const effortMetaCellHtml = INCIDENT_TYPES.includes(type) ? '' : `
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Effort</span>
        <select class="idp-meta-select" data-item-code="${esc(item.code)}" data-field="effort"${_roDisabled}>
          <option value=""${!item.effort ? ' selected' : ''}>—</option>
          <option value="1"${item.effort == 1 ? ' selected' : ''}>1 · simple</option>
          <option value="2"${item.effort == 2 ? ' selected' : ''}>2 · medio</option>
          <option value="3"${item.effort == 3 ? ' selected' : ''}>3 · complejo</option>
        </select>
      </div>`;

  // TKT5 (REQ-202608-149, gap de integración de Fase 5 — cierre de REQ): queue (INC/PRB/CHG)
  // y zona (DISC) no tenían representación visual en el IDP pese a estar declarados en
  // _Locus-ckpt-render-ref con grupo visual "Ubicación". Reutiliza idp-dep-chip como
  // display readonly dentro de idp-meta-cell — mismo slot que sprintMetaCellHtml, que
  // queda vacío para estos tipos (_idpHideScrumFields). Mutuamente excluyentes por tipo
  // — nunca ambos presentes en el mismo render.
  const queueMetaCellHtml = (INCIDENT_TYPES.includes(type) && item.queue) ? `
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Queue</span>
        <span class="idp-dep-chip idp-dep-chip--queue">${esc(item.queue)}</span>
      </div>` : '';

  const zonaMetaCellHtml = (type === 'DISC' && item.zona) ? `
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Zona</span>
        <span class="idp-dep-chip idp-dep-chip--zona">${esc(item.zona)}</span>
      </div>` : '';

  const metaHtml = `
    <div class="idp-meta-grid">
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Status</span>
        ${statusCellHtml}${discardReqBtnHtml}
      </div>${priorityMetaCellHtml}${sprintMetaCellHtml}${effortMetaCellHtml}${queueMetaCellHtml}${zonaMetaCellHtml}
      <div class="idp-meta-cell idp-meta-cell--wide">
        <span class="idp-meta-label">Area</span>
        <input class="idp-meta-input" value="${esc(item.area || '')}" placeholder="—"
          data-item-code="${esc(item.code)}" data-field="area"${_roReadonly}>
      </div>
      <div class="idp-meta-cell idp-meta-cell--wide">
        <span class="idp-meta-label">Rol</span>
        <select class="idp-meta-select" data-item-code="${esc(item.code)}" data-field="role"${_roDisabled}>
          <option value="">— Sin rol —</option>
          ${_ECOSYSTEM_ROLES.map(r => `<option value="${esc(r)}"${(item.role||'')=== r?' selected':''}>${esc(r)}</option>`).join('')}
        </select>
      </div>
    </div>`;

  // ── AC colapsable ──
  const acHtml = item.ac && item.ac.length ? `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" data-action="idp-toggle-ac" role="button" tabindex="0" aria-expanded="true" aria-controls="idp-ac-list">
        <span>Criterios de aceptación</span>
        <svg class="ti-svg chevron" id="idp-ac-arrow" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>
      </div>
      <div class="idp-ac-list" id="idp-ac-list">
        ${item.ac.map(c => `<div class="idp-ac-item"><span class="idp-ac-dot idp-type-${type}"></span>${esc(c)}</div>`).join('')}
      </div>
    </div>` : '';

  // TKT4 (TKT-202608-372, REQ-202608-149): bloque único de relaciones — consolida
  // item.dependsOn (schema) e item.blockedBy (legacy) en la misma sección
  // idp-section--deps, con sub-etiqueta de origen por chip ('schema'/'legacy').
  // Antes vivían en dos bloques separados: dependsOnHtml (dentro de
  // _buildIdpSlotPlaneada, sección "Depends on") y depsHtml/"Bloqueado por"
  // (blockedBy legacy) — duplicaban intención en N1 sin distinguir mecanismo.
  // No elimina blockedBy del schema — solo consolida el render (no_incluye del TKT).
  const allBlockedBy = (item.blockedBy || []);
  const dependsOnCodes = Array.isArray(item.dependsOn) ? item.dependsOn : [];

  const blockedByPending = allBlockedBy.filter(c => { const dep = getItems().find(i => i.code === c); return !dep || dep.status !== 'done'; });
  const blockedByDone    = allBlockedBy.filter(c => { const dep = getItems().find(i => i.code === c); return dep && dep.status === 'done'; });
  const blockingOthers = getItems().filter(i => i.blockedBy && i.blockedBy.includes(item.code) && i.status !== 'done' && i.status !== 'descartado');

  const _depsChip = (code, isDone, originLabel) => {
    const dep = getItems().find(i => i.code === code);
    const title = dep ? esc(dep.title) : '';
    const cls = isDone ? 'idp-dep-chip idp-dep-chip--done' : 'idp-dep-chip';
    const icon = isDone ? '✓' : '🔒';
    return `<span class="${cls}" data-action="idp-open-panel" data-item-code="${esc(code)}" tabindex="0" role="button" title="${title}">${icon} ${esc(code)} <span class="idp-dep-origin-tag">${originLabel}</span></span>`;
  };

  // AC error de dependsOn (heredado de dependsOnHtml original): código inexistente
  // o placeholder sin resolver → chip roto visible, sub-etiqueta 'schema' igual.
  const _dependsOnChip = (c) => {
    if (_depPlaceholderRe.test(c)) {
      return `<span class="badge-missing badge-missing--dep-blocked" title="Referencia sin resolver — pendiente de ID real">🔗 ${esc(c)} (pendiente de ID) <span class="idp-dep-origin-tag">schema</span></span>`;
    }
    const dep = getItems().find(i => i.code === c);
    if (!dep) {
      return `<span class="badge-missing badge-missing--dep-blocked" title="Código no encontrado en el backlog">🔗 ${esc(c)} (no encontrado) <span class="idp-dep-origin-tag">schema</span></span>`;
    }
    return _depsChip(c, dep.status === 'done', 'schema');
  };

  // TKT5 (REQ-202608-149, gap de integración de Fase 5 — cierre de REQ): archivos[]
  // (TKT/INC/PRB/CHG) sin representación visual pese a estar declarado en
  // _Locus-ckpt-render-ref con grupo visual "Relaciones" — mismo grupo que
  // depsHtml. No son ítems del backlog (sin código propio) → sin data-action de
  // navegación, a diferencia de los chips de dependsOn/blockedBy.
  const archivosCodes = ['TKT', 'INC', 'PRB', 'CHG'].includes(type) ? (item.archivos || []) : [];
  const archivosChipsHtml = archivosCodes.length ? `
        <div class="idp-deps-row">
          <span class="idp-deps-label">Archivos</span>
          <div class="idp-deps-chips">
            ${archivosCodes.map(f => `<span class="idp-dep-chip idp-dep-chip--archivos" title="${esc(f)}">📄 ${esc(f)}</span>`).join('')}
          </div>
        </div>` : '';

  const depsHtml = (dependsOnCodes.length || allBlockedBy.length || blockingOthers.length || archivosCodes.length) ? `
    <div class="idp-section idp-section--deps">
      <div class="idp-section-label">Relaciones</div>
      ${dependsOnCodes.length ? `
        <div class="idp-deps-row">
          <span class="idp-deps-label">Depends on</span>
          <div class="idp-deps-chips">
            ${dependsOnCodes.map(_dependsOnChip).join('')}
          </div>
        </div>` : ''}
      ${allBlockedBy.length ? `
        <div class="idp-deps-row">
          <span class="idp-deps-label">Bloqueado por</span>
          <div class="idp-deps-chips">
            ${blockedByPending.map(c => _depsChip(c, false, 'legacy')).join('')}
            ${blockedByDone.map(c => _depsChip(c, true, 'legacy')).join('')}
          </div>
        </div>` : ''}
      ${blockingOthers.length ? `
        <div class="idp-deps-row">
          <span class="idp-deps-label">Bloquea a</span>
          <div class="idp-deps-chips">
            ${blockingOthers.map(i => {
              return `<span class="idp-dep-chip idp-dep-chip--blocks" data-action="idp-open-panel" data-item-code="${esc(i.code)}" tabindex="0" role="button" title="${esc(i.title)}">⚠ ${esc(i.code)} <span class="idp-dep-origin-tag">legacy</span></span>`;
            }).join('')}
          </div>
        </div>` : ''}
      ${archivosChipsHtml}
    </div>` : '';

  // R-202605-004: chip "Generado desde [código]" — solo si item.origin tiene valor
  const originChipHtml = (() => {
    if (!item.origin) return '';
    // TKT-202607-045: getAnyItem() — item.origin puede apuntar a un código ITIL (INC/PRB/KE/CHG).
    const originItem = (typeof getAnyItem !== 'undefined') ? getAnyItem(item.origin) : null;
    if (originItem) {
      // AC-4: código existe en backlog — chip navegable con foco visible y aria-label
      return `<div class="idp-meta-row idp-origin-row">
        <button class="idp-dep-chip idp-dep-chip--origin" data-action="idp-open-panel" data-item-code="${esc(item.origin)}" aria-label="Generado desde ${esc(item.origin)}" title="${esc(originItem.title || item.origin)}">↩ Generado desde ${esc(item.origin)}</button>
      </div>`;
    }
    // AC-5: código no existe (archivado o proyecto distinto) — texto plano sin link
    return `<div class="idp-meta-row idp-origin-row">
      <span class="idp-pill idp-pill--origin">↩ Generado desde ${esc(item.origin)}</span>
    </div>`;
  })();

  // TKT2 (ref_id CAEL-08161420-03, REQ CAEL-08161420-01): triggered_by ahora visible en el
  // IDP — antes solo se renderizaba en N2 (bitem-origin-p-block, locus-backlog-item.js
  // L1711-1714). Reutiliza el idioma nativo del panel (idp-open-panel/idp-dep-chip, mismo
  // patrón que originChipHtml arriba) en vez del markup literal de N2 — data-action
  // "navigate-origin" no está delegado dentro de #item-detail-panel (ver _onIdpClick,
  // L1496, y el switch de idpPanel.addEventListener, L1528-1551), solo en la delegación
  // global de la lista de backlog (locus-backlog-item.js L838). Mismo criterio de
  // degradación de originChipHtml: código existente → chip navegable, código no
  // encontrado (archivado o de otro proyecto) → texto plano sin link.
  const triggeredByHtml = (() => {
    if (!item.triggeredBy) return '';
    const originItem = (typeof getAnyItem !== 'undefined') ? getAnyItem(item.triggeredBy) : null;
    if (originItem) {
      return `<div class="idp-meta-row idp-origin-row">
        <button class="idp-dep-chip idp-dep-chip--origin" data-action="idp-open-panel" data-item-code="${esc(item.triggeredBy)}" aria-label="Originado durante ${esc(item.triggeredBy)}" title="${esc(originItem.title || item.triggeredBy)}">⚡ Originado durante ${esc(item.triggeredBy)}</button>
      </div>`;
    }
    return `<div class="idp-meta-row idp-origin-row">
      <span class="idp-pill idp-pill--origin">⚡ Originado durante ${esc(item.triggeredBy)}</span>
    </div>`;
  })();

  // TKT3 (TKT-202608-371, REQ-202608-149): lista de TKTs hijos navegables — solo para
  // REQs (itemKind(item) === 'REQ'), busca en getItems() por parentId === item.code.
  // Reutiliza el idioma nativo del panel (idp-open-panel/idp-dep-chip), misma variante
  // de degradación que originChipHtml/triggeredByHtml no aplica aquí: un hijo real
  // siempre tiene código real en backlog por definición de parentId — sin rama de
  // "código no encontrado". AC2: sin hijos → bloque omitido, sin mensaje de vacío.
  const childrenChipsHtml = (() => {
    if (itemKind(item) !== 'REQ') return '';
    const children = (getItems() || []).filter(i => i.parentId === item.code);
    if (!children.length) return '';
    const chips = children.map(c =>
      `<button class="idp-dep-chip idp-dep-chip--children" data-action="idp-open-panel" data-item-code="${esc(c.code)}" aria-label="Ir a ${esc(c.code)}" title="${esc(c.title || c.code)}">${esc(c.code)}</button>`
    ).join('');
    return `<div class="idp-meta-row idp-children-row">${chips}</div>`;
  })();

  // TKT2 (TKT-202609-531, REQ-202609-226): checklist derivado "Requisitos para done" —
  // solo lectura, sin ningún control que fuerce status. Visible únicamente en REQ
  // en-revision, para hacer visible por qué el gate de applyPatchesFromTG rechaza (o
  // aceptaría) un patch de done, sin introducir mecanismo de mutación nuevo.
  const _buildIdpDoneRequirements = (it, t) => {
    if (t !== 'REQ' || it.status !== 'en-revision') return '';

    const activeChildren = (getItems() || []).filter(i => i.parentId === it.code && i.status !== 'descartado');

    if (!activeChildren.length) {
      return `<div class="idp-section idp-section--done-reqs">
        <div class="idp-done-reqs-label">Requisitos para done</div>
        <div class="idp-done-reqs-rows">
          <div class="idp-done-req-row idp-done-req-row--warn">
            <span class="idp-done-req-row-icon">!</span>
            <span class="idp-done-req-row-status">Sin hijos activos — REQ huérfano</span>
          </div>
        </div>
      </div>`;
    }

    const doneChildren = activeChildren.filter(c => c.status === 'done');
    const pendingChildren = activeChildren.filter(c => c.status !== 'done');
    const doneWithoutVerified = doneChildren.filter(c => c.verified_by !== 'QA · Finn');
    const allResolved = !pendingChildren.length && !doneWithoutVerified.length;

    if (allResolved) {
      return `<div class="idp-section idp-section--done-reqs">
        <div class="idp-done-reqs-label">Requisitos para done</div>
        <div class="idp-done-reqs-rows">
          <div class="idp-done-req-row idp-done-req-row--ok">
            <span class="idp-done-req-row-icon">✓</span>
            <span class="idp-done-req-row-status">Todos los hijos done y avalados</span>
          </div>
        </div>
      </div>`;
    }

    const pendingRowsHtml = pendingChildren.map(c =>
      `<div class="idp-done-req-row idp-done-req-row--pending">
        <span class="idp-done-req-row-code">${esc(c.code)}</span>
        <span class="idp-done-req-row-status">${esc(c.status)}</span>
      </div>`
    ).join('');

    const warnRowHtml = doneWithoutVerified.length
      ? `<div class="idp-done-req-row idp-done-req-row--warn">
          <span class="idp-done-req-row-icon">!</span>
          <span class="idp-done-req-row-status">verified_by ausente en ${doneWithoutVerified.length} de ${doneChildren.length} hijos done</span>
        </div>`
      : '';

    return `<div class="idp-section idp-section--done-reqs">
      <div class="idp-done-reqs-label">Requisitos para done</div>
      <div class="idp-done-reqs-rows">
        ${pendingRowsHtml}
        ${warnRowHtml}
      </div>
    </div>`;
  };
  const doneRequirementsHtml = _buildIdpDoneRequirements(item, type);

  panel.innerHTML = `
    <div class="idp-inner">
      ${headerHtml}
      ${draftStripHtml}
      ${metaHtml}
      ${childrenChipsHtml}
      ${doneRequirementsHtml}
      ${discSlotHtml}
      ${planeadaSlotHtml}
      ${contractSlotHtml}
      ${uiConditionalHtml}
      ${reactivaSlotHtml}
      ${originChipHtml}
      ${triggeredByHtml}
      <div class="idp-divider"></div>
      ${depsHtml}
      ${notesHtml}
      ${sessionsHtml ? sessionsHtml : ''}
      ${preCreationHtml ? preCreationHtml : ''}
      ${acHtml}
      ${timelineHtml}
    </div>`;

  // T-202606-009: adjuntar listener de notas via addEventListener — sin oninput inline
  const _notesTa = panel.querySelector('#idp-notes-ta');
  if (_notesTa) _notesTa.addEventListener('input', _itemPanelNotesDirty);
}

function _buildPanelTimeline(item) {
  const _fmt = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays}d`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays/7)}sem`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays/30)}mes`;
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short' });
  };
  const _iso = ts => ts ? new Date(ts).toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' }) : '';

  const entries = [];

  // Creación
  if (item.createdAt) {
    entries.push({ ts: item.createdAt, type: 'created', icon: '✦', label: 'Creado', color: 'hint' });
  }

  // Historial de status desde history[]
  if (item.history && item.history.length) {
    item.history.forEach(h => {
      if (h.type === 'status') {
        const fromLabel = h.data.from ? `${h.data.from} → ` : '';
        const toLabel = h.data.to || '?';
        const statusIcons = { done: '✓', pendiente: '⏳', descartado: '🗑' };
        const statusColors2 = { done: 'success', pendiente: 'muted', descartado: 'hint' };
        entries.push({
          ts: h.ts,
          type: 'status',
          icon: statusIcons[toLabel] || '🔄',
          label: `${fromLabel}${toLabel}`,
          color: statusColors2[toLabel] || 'muted',
          sub: h.data.role || ''
        });
      } else if (h.type === 'sprint') {
        const from = h.data.from ? `${h.data.from} → ` : '';
        const to = h.data.to || '— sin asignar';
        // B-202605-241: origin 'checkpoint' (antes 'import') muestra 'CHECKPOINT · [sessionId]'
        const sub = (h.origin === 'checkpoint' || h.origin === 'import') ? `CHECKPOINT${h.sessionId ? ' · ' + h.sessionId : ''}` : '';
        entries.push({ ts: h.ts, type: 'sprint', icon: '🏃', label: `Sprint: ${from}${to}`, color: 'info', sub });
      } else if (h.type === 'field') {
        const fieldLabel = { effort: 'Effort', priority: 'Priority', area: 'Area', role: 'Role', desc: 'Descripción', ac: 'AC', notes: 'Notas', blockedBy: 'Bloqueado por' }[h.data.field] || h.data.field;
        const from = h.data.from ? `${h.data.from} → ` : '';
        // T-202604-423: ac puede ser array — mostrar conteo
        let toLabel = h.data.to || '—';
        if (h.data.field === 'ac' && Array.isArray(h.data.to)) toLabel = `${h.data.to.length} criterio${h.data.to.length !== 1 ? 's' : ''}`;
        // B-202605-241: mismo fix — backward compat con 'import' existente en datos
        const sub = (h.origin === 'checkpoint' || h.origin === 'import') ? `CHECKPOINT${h.sessionId ? ' · ' + h.sessionId : ''}` : '';
        entries.push({ ts: h.ts, type: 'field', icon: '✎', label: `${fieldLabel}: ${from}${toLabel}`, color: 'muted', sub });
      } else if (h.type === 'title') {
        // T-202604-423: cambio de título
        const from = h.data.from ? `"${h.data.from}" → ` : '';
        // B-202605-241: mismo fix
        const sub = (h.origin === 'checkpoint' || h.origin === 'import') ? `CHECKPOINT${h.sessionId ? ' · ' + h.sessionId : ''}` : '';
        entries.push({ ts: h.ts, type: 'title', icon: '✏', label: `Título: ${from}"${h.data.to || ''}"`, color: 'muted', sub });
      } else if (h.type === 'note') {
        entries.push({ ts: h.ts, type: 'note', icon: '✍', label: h.data.text || '', color: 'accent' });
      } else if (h.type === 'unblocked') {
        entries.push({ ts: h.ts, type: 'unblocked', icon: '🔓', label: `Desbloqueado por ${h.data.by || ''}`, color: 'success' });
      } else if (h.type === 'session-linked') {
        // B-246 + B-245: vinculación de sesión con nombre de IA
        const aiLinked = h.aiId && getAI(h.aiId);
        const aiName = aiLinked ? aiLinked.name : (h.aiId || '');
        entries.push({ ts: h.ts, type: 'session-linked', icon: '🔗', label: `Sesión vinculada${aiName ? ' · ' + aiName : ''}`, color: 'purple', sub: h.data && h.data.sessId ? h.data.sessId : '' });
      } else if (h.type === 'session-unlinked') {
        // B-246 + B-245: desvinculación de sesión con nombre de IA
        const aiUnlinked = h.aiId && getAI(h.aiId);
        const aiNameU = aiUnlinked ? aiUnlinked.name : (h.aiId || '');
        entries.push({ ts: h.ts, type: 'session-unlinked', icon: '🔗', label: `Sesión desvinculada${aiNameU ? ' · ' + aiNameU : ''}`, color: 'hint', sub: h.data && h.data.sessId ? h.data.sessId : '' });
      }
    });
  } else if (item.statusChangedAt) {
    // Fallback para ítems sin history[]
    const statusIcons2 = { done: '✓', pendiente: '⏳', descartado: '🗑' };
    const statusColors3 = { done: 'success', pendiente: 'muted', descartado: 'hint' };
    entries.push({
      ts: item.statusChangedAt,
      type: 'status',
      icon: statusIcons2[item.status] || '🔄',
      label: `→ ${item.status}`,
      color: statusColors3[item.status] || 'muted'
    });
  }

  // Done
  if (item.doneAt && item.status === 'done') {
    const alreadyHasDone = entries.some(e => e.type === 'status' && e.ts === item.doneAt);
    if (!alreadyHasDone) {
      entries.push({ ts: item.doneAt, type: 'done', icon: '✓', label: 'Completado', color: 'success' });
    }
  }

  // Sesiones vinculadas en timeline
  const allSessions = getAllSessions();
  allSessions.forEach(s => {
    if ((s.trackerRefs || []).includes(item.code)) {
      const ai = getAI(s.aiId);
      const ts = s.savedAt || s.createdAt || 0;
      if (ts) {
        entries.push({
          ts,
          type: 'session',
          icon: '⚡',
          label: (ai ? ai.name + ' · ' : '') + (s.dateShort || s.date || ''),
          color: 'purple',
          sub: s.title || ''
        });
      }
    }
  });

  if (!entries.length) return `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" data-action="idp-toggle-history" role="button" tabindex="0" aria-expanded="false" aria-controls="idp-hist-body">
        <span>Historial</span>
        <svg class="ti-svg chevron" id="idp-hist-arrow" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>
      </div>
      <div class="idp-hist-body is-hidden" id="idp-hist-body">
        <div class="idp-tl-note-row">
          <input class="idp-tl-note-input" id="idp-tl-note-input" placeholder="Añadir nota al historial…"
            data-action="idp-note-input" data-code="${esc(item.code)}">
          <button class="idp-tl-note-btn" data-action="idp-add-note-btn" data-code="${esc(item.code)}">＋</button>
        </div>
      </div>
    </div>`;

  // Ordenar cronológico
  entries.sort((a, b) => a.ts - b.ts);

  const rows = entries.map(e => `
    <div class="idp-tl-entry">
      <div class="idp-tl-dot-col">
        <div class="idp-tl-dot idp-tl-dot--${e.color}"></div>
        <div class="idp-tl-line"></div>
      </div>
      <div class="idp-tl-content">
        <div class="idp-tl-main">
          <span class="idp-tl-icon">${e.icon}</span>
          <span class="idp-tl-label idp-tl-label--${e.color}">${esc(e.label)}</span>
          <span class="idp-tl-ts" title="${_iso(e.ts)}">${_fmt(e.ts)}</span>
        </div>
        ${e.sub ? `<div class="idp-tl-sub">${esc(e.sub)}</div>` : ''}
      </div>
    </div>`).join('');

  return `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" data-action="idp-toggle-history" role="button" tabindex="0" aria-expanded="false" aria-controls="idp-hist-body">
        <span>Historial <span class="idp-hist-count">${entries.length}</span></span>
        <svg class="ti-svg chevron" id="idp-hist-arrow" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>
      </div>
      <div class="idp-hist-body is-hidden" id="idp-hist-body">
        <div class="idp-timeline">${rows}</div>
        <div class="idp-tl-note-row">
          <input class="idp-tl-note-input" id="idp-tl-note-input" placeholder="Añadir nota al historial…"
            data-action="idp-note-input" data-code="${esc(item.code)}">
          <button class="idp-tl-note-btn" data-action="idp-add-note-btn" data-code="${esc(item.code)}">＋</button>
        </div>
      </div>
    </div>`;
}

// R-202604-015: título editable inline en el panel
function _idpStartEditTitle(code) {
  const display = document.getElementById('idp-title-display');
  const input = document.getElementById('idp-title-input');
  if (!display || !input) return;
  const item = getAnyItem(code);
  if (!item) return;
  input.value = item.title;
  display.classList.add("is-hidden");
  input.classList.remove("is-hidden")
  input.focus();
  input.select();
}

function _idpSaveTitle(code) {
  const display = document.getElementById('idp-title-display');
  const input = document.getElementById('idp-title-input');
  if (!display || !input) return;
  const item = getAnyItem(code);
  if (!item) return;
  const newTitle = input.value.trim();
  if (newTitle && newTitle !== item.title) {
    const prevTitle = item.title;
    item.title = newTitle;
    // T-202604-423: registrar cambio de título en history[]
    if (!item.history) item.history = [];
    item.history.push({ type: 'title', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevTitle || null, to: newTitle } });
    _undoSnapshotItems();
    saveBacklog();
    _setBacklogModified();
    // Actualizar la lista sin cerrar el panel
    renderBacklogList();
    renderStats();
    showToast('success', `${code} — título actualizado`);
  }
  display.textContent = item.title;
  display.classList.remove("is-hidden")
  input.classList.add("is-hidden");
}

function _idpCancelTitle() {
  const display = document.getElementById('idp-title-display');
  const input = document.getElementById('idp-title-input');
  if (display) display.classList.remove("is-hidden")
  if (input) input.classList.add("is-hidden");
}

// R-202604-015: actualizar campo genérico del ítem desde el panel
function _idpSetField(code, field, value) {
  const item = getAnyItem(code);
  if (!item) return;
  const prev = item[field];
  item[field] = value;
  if (prev === value) return;
  // T-202604-423: registrar cambios de campos en history[] (incluye role)
  if (['effort', 'priority', 'area', 'role'].includes(field)) {
    if (!item.history) item.history = [];
    item.history.push({ type: 'field', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { field, from: prev || null, to: value || null } });
  }
  _undoSnapshotItems();
  saveBacklog();
  _setBacklogModified();
  renderBacklogList();
  renderStats();
  showToast('success', `${code} · ${field} → ${value || '—'}`);
}

function _itemPanelNotesDirty() {
  const statusEl = document.getElementById('idp-notes-status');
  if (statusEl) statusEl.textContent = '✎ sin guardar';
  clearTimeout(_itemPanelNotesTimer);
  _itemPanelNotesTimer = setTimeout(() => {
    const ta = document.getElementById('idp-notes-ta');
    if (!ta || !_itemPanelCode) return;
    // [tmp:tkt3-panel-lookup]: getAnyItem — antes se omitía silenciosamente para ITIL.
    const item = getAnyItem(_itemPanelCode);
    if (!item) return;
    item.notes = ta.value;
    saveBacklog();
    const s = document.getElementById('idp-notes-status');
    if (s) { s.textContent = '✓ guardado'; setTimeout(() => { if (s) s.textContent = ''; }, 1500); }
  }, 800);
}

function _idpToggleAc() {
  const list = document.getElementById('idp-ac-list');
  if (!list) return;
  const open = list.classList.toggle('open');
  const btn = document.querySelector('[data-action="idp-toggle-ac"]');
  if (btn) btn.setAttribute('aria-expanded', String(open));
}

// T-202604-423: toggle sección Historial en Item Detail Panel
function _idpToggleHistory() {
  const body = document.getElementById('idp-hist-body');
  if (!body) return;
  const nowHidden = body.classList.toggle('is-hidden');
  const btn = document.querySelector('[data-action="idp-toggle-history"]');
  if (btn) btn.setAttribute('aria-expanded', String(!nowHidden));
}

// T-202604-307: copiar código al portapapeles desde panel
function _idpCopyCode(code) {
  navigator.clipboard.writeText(code).then(() => showToast('success', `${code} copiado`));
}

// T-202604-307: marcar done desde botón rápido en panel
function _idpMarkDone(code) {
  // T-202605-449: advertencia de bloqueadores delegada a setItemStatus — cubre todas las vías
  // [tmp:tkt3-panel-lookup]: getAnyItem — antes el re-render post-click no ocurría para ITIL.
  const item = getAnyItem(code);
  setItemStatus(code, 'done');
  // Re-renderizar panel para ocultar el botón
  if (item && _itemPanelCode === code) _renderItemPanel(item);
}

// TKT (REQ-202609-225, TKT-202609-544): descartar REQ desde botón rápido en panel — mismo
// patrón que _idpMarkDone; setItemStatus() ya cubre los gates de validación existentes,
// sin reimplementar la llamada.
function _idpDiscardReq(code) {
  const item = getAnyItem(code);
  setItemStatus(code, 'descartado');
  // Re-renderizar panel para ocultar el botón (mismo criterio que _idpMarkDone)
  if (item && _itemPanelCode === code) _renderItemPanel(item);
}

// T-202604-307: desvincular sesión desde chip en panel
function _idpUnlinkSession(itemCode, sessId) {
  const allSessions = getAllSessions();
  const sess = allSessions.find(s => s.id === sessId);
  if (!sess) return;
  sess.trackerRefs = (sess.trackerRefs || []).filter(c => c !== itemCode);
  save();
  // Re-renderizar panel
  const item = getItems().find(i => i.code === itemCode);
  if (item) _renderItemPanel(item);
  showToast('success', 'Sesión desvinculada');
}

// T-202604-307: añadir nota manual al historial desde input
function _idpAddNote(code, text) {
  const item = getAnyItem(code);
  if (!item || !text) return;
  if (!item.history) item.history = [];
  item.history.push({ type: 'note', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { text } });
  _undoSnapshotItems();
  saveBacklog();
  _setBacklogModified();
  _renderItemPanel(item);
  showToast('success', 'Nota añadida');
}

function _idpAddNote_fromBtn(code) {
  const inp = document.getElementById('idp-tl-note-input');
  if (!inp || !inp.value.trim()) return;
  _idpAddNote(code, inp.value.trim());
  inp.value = '';
}

// ════════════════════════════════════════════════════════════════════
// R-202604-074 · AC Vivo — helpers de interacción
// ════════════════════════════════════════════════════════════════════

export function _acvToggle(panelId) {
  const wrap = document.getElementById(panelId);
  if (!wrap) return;
  const body = wrap.querySelector('.acv-body');
  const btn  = wrap.querySelector('.acv-toggle');
  if (!body) return;
  const open = !body.classList.contains('acv-body--hidden');
  body.classList.toggle('acv-body--hidden', open);
  if (btn) btn.setAttribute('aria-expanded', String(!open));
}

export function _acvStartEdit(rowId, code, acIdx) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const item = getAnyItem(code);
  if (!item || !item.ac) return;
  const current = item.ac[acIdx] || '';
  row.innerHTML = `
    <div class="acv-inline-edit">
      <textarea class="acv-edit-ta" id="${rowId}-ta" rows="2">${esc(current)}</textarea>
      <div class="acv-edit-actions">
        <button class="acv-save-btn" data-action="acv-save" data-row-id="${rowId}" data-code="${esc(code)}" data-ac-idx="${acIdx}">Guardar</button>
        <button class="acv-cancel-btn" data-action="acv-cancel">Cancelar</button>
      </div>
    </div>`;
  const ta = document.getElementById(rowId + '-ta');
  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}

function _acvSaveEdit(rowId, code, acIdx) {
  const ta = document.getElementById(rowId + '-ta');
  if (!ta) return;
  const newText = ta.value.trim();
  if (!newText) return;
  const item = getAnyItem(code);
  if (!item || !item.ac) return;
  item.ac[acIdx] = newText;
  _undoSnapshotItems();
  saveBacklog();
  _setBacklogModified();
  showToast('success', 'AC actualizado');
  renderBacklogList();
}

export function _acvConfirm(code, panelId) {
  const item = getAnyItem(code);
  if (!item) return;
  item.acReviewed = Date.now();
  saveBacklog();
  const wrap = document.getElementById(panelId);
  if (wrap) wrap.classList.add('acv-reviewed');
  showToast('success', 'Revisión de AC confirmada');
}

// ════════════════════════════════════════════════════════════════════
// T-202605-443 · Sub-panel Descargar templates — comportamiento de colapso
// ════════════════════════════════════════════════════════════════════

// Toggle del sub-panel. Estado volátil — sin persistencia en localStorage.
function toggleTmplTriggerPanel(btn) {
  const body = document.getElementById('tmpl-trigger-body');
  if (!body) return;
  const collapsed = btn.classList.toggle('is-collapsed');
  body.classList.toggle('is-hidden', collapsed);
  const arrow = btn.querySelector('.tmpl-trigger-arrow');
  if (arrow) arrow.textContent = collapsed ? '▸' : '▾';
}

// Reset: el sub-panel siempre abre colapsado al abrir el menú ···.
// T-202606-042: toggleMoreMenu importada desde locus-reports.js — gestión interna sin window
(function _patchMoreMenuReset() {
  function _resetTmplTriggerPanel() {
    const btn  = document.querySelector('.tmpl-trigger-toggle');
    const body = document.getElementById('tmpl-trigger-body');
    if (!btn || !body) return;
    btn.classList.add('is-collapsed');
    body.classList.add('is-hidden');
    const arrow = btn.querySelector('.tmpl-trigger-arrow');
    if (arrow) arrow.textContent = '▸';
  }

  function _wrappedToggleMoreMenu() {
    toggleMoreMenu();
    _resetTmplTriggerPanel();
  }

  // Reemplazar los call sites del more-menu-btn y los mm-btn-* que invocan toggleMoreMenu
  // usando delegación sobre #more-menu-btn — se registra una sola vez
  function _attach() {
    const btn = document.getElementById('more-menu-btn');
    if (!btn) return;
    // Remover listener previo si existía (hot reload guard)
    btn.removeEventListener('click', _wrappedToggleMoreMenu);
    btn.addEventListener('click', _wrappedToggleMoreMenu);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _attach);
  } else {
    _attach();
  }
})();

// B histórico — sin CHECKPOINT confirmado: export-backlog-btn — handler adjuntado una sola vez al iniciar
(function _initExportBacklogBtn() {
  function _attach() {
    const btn = document.getElementById('export-backlog-btn');
    if (btn && !btn._exportHandlerAttached) {
      btn.addEventListener('click', function() {
        exportBacklogMd();
      });
      btn._exportHandlerAttached = true;
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _attach);
  } else {
    _attach();
  }
})();

// T-202605-055: delegación de eventos para el Item Detail Panel (#item-detail-panel)
// Cubre: _idpMarkDone · _idpStartEditTitle · _idpSaveTitle · _idpCancelTitle
//        _idpCopyCode · _idpToggleAc · _idpToggleHistory
//        _idpAddNote · _idpAddNote_fromBtn · _acvSaveEdit
// T-202605-108: extiende cobertura a .idp-meta-select (change) e .idp-meta-input (blur/keydown)
// Delegación en document para cubrir panel dinámico que se re-renderiza con cada ítem
// INC3: toggle accesible — usado por click (idp-toggle-section) y por _onIdpKeydown
function _toggleIdpSection(el) {
  const next = el.nextElementSibling;
  if (next) next.classList.toggle('is-hidden');
  const isHidden = next && next.classList.contains('is-hidden');
  el.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
}

(function _attachIdpDelegation() {
  function _onIdpClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const act = action.dataset.action;

    if (act === 'idp-mark-done') {
      _idpMarkDone(action.dataset.code);
      return;
    }
    if (act === 'idp-discard-req') {
      _idpDiscardReq(action.dataset.code);
      return;
    }
    if (act === 'idp-start-edit-title') {
      _idpStartEditTitle(action.dataset.code);
      return;
    }
    if (act === 'idp-copy-code') {
      _idpCopyCode(action.dataset.code);
      return;
    }
    if (act === 'idp-toggle-ac') {
      _idpToggleAc();
      return;
    }
    if (act === 'idp-toggle-history') {
      _idpToggleHistory();
      return;
    }
    if (act === 'idp-add-note-btn') {
      _idpAddNote_fromBtn(action.dataset.code);
      return;
    }
    if (act === 'acv-save') {
      e.stopPropagation();
      _acvSaveEdit(action.dataset.rowId, action.dataset.code, parseInt(action.dataset.acIdx, 10));
      return;
    }
    if (act === 'tmpl-trigger-toggle') {
      toggleTmplTriggerPanel(action);
      return;
    }
  }

  // T-202605-108: change en .idp-meta-select — status usa setItemStatus, sprint usa setItemSprint, resto _idpSetField
  function _onIdpChange(e) {
    const sel = e.target.closest('.idp-meta-select');
    if (!sel) return;
    const code  = sel.dataset.itemCode;
    const field = sel.dataset.field;
    const value = sel.value;
    if (!code || !field) return;
    if (field === 'status') {
      setItemStatus(code, value);
    } else if (field === 'sprint') {
      // T-202606-036 AC4: bloquear edición directa de sprint en T con parent
      const _chItem = (getItems() || []).find(i => i.code === code);
      if (_chItem && _chItem.parentId && itemKind(_chItem) === 'TKT') {
        showToast('warning', 'El sprint del TKT se hereda de su parent ' + _chItem.parentId);
        // Restaurar valor visual al sprint heredado del parent
        const _pItem = (getItems() || []).find(i => i.code === _chItem.parentId);
        sel.value = (_pItem && _pItem.sprint) || '';
        return;
      }
      setItemSprint(code, value);
    } else {
      _idpSetField(code, field, value);
    }
  }

  function _onIdpKeydown(e) {
    // idp-title-input: Enter → save, Escape → cancel
    const inp = e.target.closest('[data-action="idp-title-input"]');
    if (inp) {
      if (e.key === 'Enter') { e.preventDefault(); _idpSaveTitle(inp.dataset.code); }
      if (e.key === 'Escape') { _idpCancelTitle(); }
      return;
    }
    // idp-note-input: Enter → addNote
    const noteInp = e.target.closest('[data-action="idp-note-input"]');
    if (noteInp && e.key === 'Enter' && noteInp.value.trim()) {
      _idpAddNote(noteInp.dataset.code, noteInp.value.trim());
      noteInp.value = '';
      return;
    }
    // idp-toggle-ac / idp-toggle-history / idp-toggle-section: Enter/Space para accesibilidad
    const toggle = e.target.closest('[data-action="idp-toggle-ac"],[data-action="idp-toggle-history"],[data-action="idp-toggle-section"]');
    if (toggle && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const act = toggle.dataset.action;
      if (act === 'idp-toggle-ac') _idpToggleAc();
      if (act === 'idp-toggle-history') _idpToggleHistory();
      if (act === 'idp-toggle-section') _toggleIdpSection(toggle);
    }
    // T-202605-108: idp-meta-input area: Enter → blur (guarda via _onIdpBlur)
    const areaInp = e.target.closest('.idp-meta-input');
    if (areaInp && e.key === 'Enter') { areaInp.blur(); }

    // Fix directo en sesión (Hallazgo #3/#4 — accesibilidad): chips navegables y título
    // editable ahora tienen tabindex+role="button" en el markup — Enter/Espacio reutiliza
    // .click() en vez de duplicar la lógica de _onIdpClick, mismo criterio ya aplicado a
    // idp-toggle-ac/idp-toggle-history/idp-toggle-section arriba en esta misma función.
    const navEl = e.target.closest('[data-action="idp-open-panel"],[data-action="idp-goto-session"],[data-action="idp-start-edit-title"]');
    if (navEl && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      navEl.click();
    }
  }

  function _onIdpBlur(e) {
    // idp-title-input: blur → save
    const inp = e.target.closest('[data-action="idp-title-input"]');
    if (inp) _idpSaveTitle(inp.dataset.code);
    // T-202605-108: idp-meta-input: blur → _idpSetField para campo area
    const areaInp = e.target.closest('.idp-meta-input');
    if (areaInp) {
      const code  = areaInp.dataset.itemCode;
      const field = areaInp.dataset.field;
      if (code && field) _idpSetField(code, field, areaInp.value);
    }
  }

  document.addEventListener('click', _onIdpClick);
  document.addEventListener('change', _onIdpChange);
  document.addEventListener('keydown', _onIdpKeydown);
  document.addEventListener('blur', _onIdpBlur, true); // capture para blur
})();

// Exposición global — funciones llamadas desde inline handlers HTML generados dinámicamente

// ── T8: Delegation — #item-detail-panel + toast-stack ──
document.addEventListener('DOMContentLoaded', () => {
  // Item Detail Panel (IDP)
  const idpPanel = document.getElementById('item-detail-panel');
  if (idpPanel) idpPanel.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    switch (el.dataset.action) {
      case 'idp-close':
        closeItemPanel();
        break;
      case 'idp-edit':
        _openItemEditorSafe(null, el.dataset.itemCode);
        break;
      case 'idp-goto-session':
        switchTab('tracker');
        setTimeout(() => { openDetail(el.dataset.aiId, el.dataset.sessId); }, 120);
        break;
      case 'idp-unlink-session':
        e.stopPropagation();
        _idpUnlinkSession(el.dataset.itemCode, el.dataset.sessId);
        break;
      case 'idp-toggle-section':
        _toggleIdpSection(el);
        break;
      case 'idp-open-panel':
        openItemPanel(el.dataset.itemCode);
        break;
      case 'acv-cancel':
        e.stopPropagation();
        renderBacklogList();
        break;
      case 'mention-goto-log':
        e.stopPropagation();
        switchTab('tracker');
        setTimeout(() => { scrollToLogCard(el.dataset.sessId); }, 150);
        break;
    }
  });

  // TKT1 REQ CAEL-0719-01: delegación de migrate-cancel/migrate-confirm movida al listener
  // unificado de #promote-modal-overlay en locus-backlog-item.js (_attachPromoteModalDelegation)
  // — el nodo #migrate-item-overlay ya no existe.

  // Toast stack — undo backlog
  const toastStack = document.getElementById('toast-stack');
  if (toastStack) toastStack.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="backlog-undo"]');
    if (btn) {
      undoBacklog();
      btn.closest('.toast-item, [class*=toast]')?.remove?.();
    }
  });

  // buildItemRefs spans — openItemPanel (pueden estar fuera del IDP)
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action="idp-open-panel"]');
    if (el && !e.defaultPrevented) openItemPanel(el.dataset.itemCode);
  });
});
// ─────────────────────────────────────────────────────────────────────────

// T-202606-077: registrar callbacks en locus-backlog-core
document.addEventListener('DOMContentLoaded', () => {
  _registerCoreCallback('backlogSetSelected', _backlogSetSelected);
  _registerCoreCallback('openItemPanel',      openItemPanel);
  _registerCoreCallback('closeItemPanel',     closeItemPanel);
});
