// [PP] mod:12 · autor:Rune · 2026-07-03 UTC-6
// locus-backlog-panel.js
// Responsabilidad: Panel de detalle de ítem (IDP) — navegación, renderizado,
//   edición inline, timeline, notas, AC viewer, migración, template trigger.
// Dependencias: locus-backlog-core.js · locus-backlog-sprints.js · locus-toast.js

import { _getActiveSessionAiId, _openItemEditorSafe, _undoSnapshot, itemKind, renderStats, setItemStatus, undoBacklog, getItems, _registerCoreCallback } from './locus-backlog-core.js';
import { exportBacklogMd } from './locus-backlog-generator.js';
import { _getActiveProjectFilter, getAI, getActiveSprints, _sprintDisplay, getAllSessions, getProjectById, save, saveImmediate } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';

import { renderBacklogList } from './locus-backlog-render.js';

import { setItemSprint } from './locus-backlog-sprints.js';

import { _setBacklogModified } from './locus-docs.js';

import { openDetail, scrollToLogCard } from './locus-session-popup.js'; // T-202606-089 AC-3

import { esc, switchTab } from './locus-ui-shell.js';
import { toggleMoreMenu } from './locus-ui-shell.js'; // B-202606-021: movida desde locus-reports.js

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
  const item = getItems().find(i => i.code === code);
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

  // R-202604-047: shell estático en index.html — inject content + classList
  const overlay = document.getElementById('migrate-item-overlay');
  if (!overlay) return;
  const body = document.getElementById('migrate-modal-body');
  if (body) {
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
function _confirmMigrateItem(code) {
  const overlay = document.getElementById('migrate-item-overlay');
  const selected = overlay ? overlay.querySelector('input[name="migrate-dest"]:checked') : null;
  if (!selected) return;
  const targetProjId = selected.value;

  const item = getItems().find(i => i.code === code);
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
  _undoSnapshot();
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
  const item = getItems().find(i => i.code === code);
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

function _renderItemPanel(item) {
  const panel = document.getElementById('item-detail-panel');
  if (!panel) return;

  const type = itemKind(item) || '';
  const typeColors = { TKT: '#2ecc78', REQ: '#38bdf8', INC: '#e85555', DISC: '#7c6af7' };
  const typeColor = typeColors[type] || 'var(--text2)';
  const TYPE_NAMES = { TKT: 'Ticket', REQ: 'Requerimiento', INC: 'Incidente', DISC: 'Discovery' };

  // ── Header ──
  const doneBtn = item.status !== 'done' ? `<button class="idp-action-btn idp-action-done" data-action="idp-mark-done" data-code="${esc(item.code)}" title="Marcar done">✓ Done</button>` : '';
  const headerHtml = `
    <div class="idp-header">
      <div class="idp-type-chip idp-type-${type}" style="--tc:${typeColor}">${type}</div>
      <div class="idp-header-meta">
        <span class="idp-code">${esc(item.code)}</span>
        <span class="idp-type-name">${TYPE_NAMES[type] || type}</span>
      </div>
      <button class="idp-close-btn" data-action="idp-close" title="Cerrar panel (Esc)">✕</button>
    </div>
    <div class="idp-title-wrap">
      <span class="idp-title" id="idp-title-display"
        data-action="idp-start-edit-title" data-code="${esc(item.code)}"
        title="Click para editar título">${esc(item.title)}</span>
      <input class="idp-title-input is-hidden" id="idp-title-input"
        value="${esc(item.title)}"
        data-action="idp-title-input" data-code="${esc(item.code)}">
    </div>
    <div class="idp-actions-bar">
      <button class="idp-action-btn" data-action="idp-copy-code" data-code="${esc(item.code)}" title="Copiar código">⎘ ${esc(item.code)}</button>
      <button class="idp-action-btn" data-action="idp-edit" data-item-code="${esc(item.code)}" title="Abrir editor completo">✎ Editar</button>
      ${doneBtn}
    </div>`;

  // ══ Metadata grid — campos editables ══
  const sprintOptions = getActiveSprints().filter(s => s.status !== 'closed')
    .map(s => `<option value="${esc(s.id)}"${item.sprint === s.id ? ' selected' : ''}>${esc(_sprintDisplay(s.id))}${s.status === 'active' ? ' ★' : ''}</option>`).join('');
  const sprintOrphan = item.sprint && !getActiveSprints().find(s => s.id === item.sprint)
    ? `<option value="${esc(item.sprint)}" selected>${esc(item.sprint)}</option>` : '';
  // T-202606-036 AC4: T con parent — sprint heredado no editable
  const _isInheritedSprint = item.parentId && itemKind(item) === 'TKT';
  const _parentItem = _isInheritedSprint ? (getItems() || []).find(i => i.code === item.parentId) : null;
  // TKT4-[pendiente-ID]: _sprintDisplay aplica patrón id · label — antes solo .label || _parentItem.sprint
  const _inheritedLabel = _parentItem
    ? ((_parentItem.sprint && getActiveSprints().find(s => s.id === _parentItem.sprint))
        ? _sprintDisplay(_parentItem.sprint)
        : (_parentItem.sprint || '— Sin asignar'))
    : '— Sin asignar';
  const sprintCellHtml = _isInheritedSprint
    ? `<span class="idp-meta-value idp-meta-value--inherited" title="El sprint del T se hereda de su parent ${esc(item.parentId)}">${esc(_inheritedLabel)} <span class="idp-inherited-badge">heredado</span></span>`
    : `<select class="idp-meta-select" data-item-code="${esc(item.code)}" data-field="sprint">
          <option value="">— Sin asignar</option>
          ${sprintOptions}
          ${sprintOrphan}
        </select>`;

  const metaHtml = `
    <div class="idp-meta-grid">
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Status</span>
        <select class="idp-meta-select" data-item-code="${esc(item.code)}" data-field="status">
          <option value="pendiente"${item.status === 'pendiente' ? ' selected' : ''}>⏳ pendiente</option>
          <option value="done"${item.status === 'done' ? ' selected' : ''}>✓ done</option>
          <option value="descartado"${item.status === 'descartado' ? ' selected' : ''}>🗑 descartado</option>
        </select>
      </div>
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Priority</span>
        <select class="idp-meta-select" data-item-code="${esc(item.code)}" data-field="priority">
          <option value="high"${item.priority === 'high' ? ' selected' : ''}>🔴 high</option>
          <option value="medium"${item.priority === 'medium' ? ' selected' : ''}>🟡 medium</option>
          <option value="low"${item.priority === 'low' ? ' selected' : ''}>⚪ low</option>
        </select>
      </div>
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Sprint</span>
        ${sprintCellHtml}
      </div>
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Effort</span>
        <select class="idp-meta-select" data-item-code="${esc(item.code)}" data-field="effort">
          <option value=""${!item.effort ? ' selected' : ''}>—</option>
          <option value="1"${item.effort == 1 ? ' selected' : ''}>1 · simple</option>
          <option value="2"${item.effort == 2 ? ' selected' : ''}>2 · medio</option>
          <option value="3"${item.effort == 3 ? ' selected' : ''}>3 · complejo</option>
        </select>
      </div>
      <div class="idp-meta-cell idp-meta-cell--wide">
        <span class="idp-meta-label">Area</span>
        <input class="idp-meta-input" value="${esc(item.area || '')}" placeholder="—"
          data-item-code="${esc(item.code)}" data-field="area">
      </div>
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
    return `<div class="idp-session-chip" data-action="idp-goto-session" data-ai-id="${s.aiId}" data-sess-id="${s.id}">
      <span class="idp-sess-ai">${aiName}</span>
      <span class="idp-sess-date">${esc(dateLabel)}</span>
      ${s.title ? `<span class="idp-sess-title">${esc(s.title)}</span>` : ''}
      ${canUnlink ? `<button class="idp-sess-unlink" data-action="idp-unlink-session" data-item-code="${esc(item.code)}" data-sess-id="${s.id}" title="Desvincular sesión">✕</button>` : ''}
    </div>`;
  };

  const preCreationHtml = preCreationSessions.length ? `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" data-action="idp-toggle-section">
        <span>Mencionado antes de creación (${preCreationSessions.length})</span>
        <span class="idp-toggle-arrow">▸</span>
      </div>
      <div class="idp-sessions-list is-hidden">
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

  // ── AC colapsable ──
  const acHtml = item.ac && item.ac.length ? `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" data-action="idp-toggle-ac" role="button" tabindex="0" aria-expanded="true" aria-controls="idp-ac-list">
        <span>Criterios de aceptación</span>
        <span class="idp-toggle-arrow" id="idp-ac-arrow">▾</span>
      </div>
      <div class="idp-ac-list" id="idp-ac-list">
        ${item.ac.map(c => `<div class="idp-ac-item"><span class="idp-ac-dot" style="--tc:${typeColor}"></span>${esc(c)}</div>`).join('')}
      </div>
    </div>` : '';

  // ── Timeline ──
  const timelineHtml = _buildPanelTimeline(item);

  // T-202605-449: sección Dependencias — Bloqueado por / Bloquea a
  const allBlockedBy = (item.blockedBy || []);
  const blockedByPending = allBlockedBy.filter(c => { const dep = getItems().find(i => i.code === c); return !dep || dep.status !== 'done'; });
  const blockedByDone    = allBlockedBy.filter(c => { const dep = getItems().find(i => i.code === c); return dep && dep.status === 'done'; });
  const blockingOthers = getItems().filter(i => i.blockedBy && i.blockedBy.includes(item.code) && i.status !== 'done' && i.status !== 'descartado');

  const _depsChip = (code, isDone) => {
    const dep = getItems().find(i => i.code === code);
    const title = dep ? esc(dep.title) : '';
    const cls = isDone ? 'idp-dep-chip idp-dep-chip--done' : 'idp-dep-chip';
    const icon = isDone ? '✓' : '🔒';
    return `<span class="${cls}" data-action="idp-open-panel" data-item-code="${esc(code)}" title="${title}">${icon} ${esc(code)}</span>`;
  };

  const depsHtml = (allBlockedBy.length || blockingOthers.length) ? `
    <div class="idp-section idp-section--deps">
      <div class="idp-section-label">Dependencias</div>
      ${allBlockedBy.length ? `
        <div class="idp-deps-row">
          <span class="idp-deps-label">Bloqueado por</span>
          <div class="idp-deps-chips">
            ${blockedByPending.map(c => _depsChip(c, false)).join('')}
            ${blockedByDone.map(c => _depsChip(c, true)).join('')}
          </div>
        </div>` : ''}
      ${blockingOthers.length ? `
        <div class="idp-deps-row">
          <span class="idp-deps-label">Bloquea a</span>
          <div class="idp-deps-chips">
            ${blockingOthers.map(i => {
              return `<span class="idp-dep-chip idp-dep-chip--blocks" data-action="idp-open-panel" data-item-code="${esc(i.code)}" title="${esc(i.title)}">⚠ ${esc(i.code)}</span>`;
            }).join('')}
          </div>
        </div>` : ''}
    </div>` : '';

  // R-202605-004: chip "Generado desde [código]" — solo si item.origin tiene valor
  const originChipHtml = (() => {
    if (!item.origin) return '';
    const originItem = (typeof getItems() !== 'undefined') ? getItems().find(i => i.code === item.origin) : null;
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

  panel.innerHTML = `
    <div class="idp-inner">
      ${headerHtml}
      ${metaHtml}
      ${originChipHtml}
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
    entries.push({ ts: item.createdAt, type: 'created', icon: '✦', label: 'Creado', color: 'var(--hint)' });
  }

  // Historial de status desde history[]
  if (item.history && item.history.length) {
    item.history.forEach(h => {
      if (h.type === 'status') {
        const fromLabel = h.data.from ? `${h.data.from} → ` : '';
        const toLabel = h.data.to || '?';
        const statusIcons = { done: '✓', pendiente: '⏳', descartado: '🗑' };
        const statusColors2 = { done: '#2ecc78', pendiente: 'var(--text2)', descartado: 'var(--hint)' };
        entries.push({
          ts: h.ts,
          type: 'status',
          icon: statusIcons[toLabel] || '🔄',
          label: `${fromLabel}${toLabel}`,
          color: statusColors2[toLabel] || 'var(--text2)',
          sub: h.data.role || ''
        });
      } else if (h.type === 'sprint') {
        const from = h.data.from ? `${h.data.from} → ` : '';
        const to = h.data.to || '— sin asignar';
        // B-202605-241: origin 'checkpoint' (antes 'import') muestra 'CHECKPOINT · [sessionId]'
        const sub = (h.origin === 'checkpoint' || h.origin === 'import') ? `CHECKPOINT${h.sessionId ? ' · ' + h.sessionId : ''}` : '';
        entries.push({ ts: h.ts, type: 'sprint', icon: '🏃', label: `Sprint: ${from}${to}`, color: '#38bdf8', sub });
      } else if (h.type === 'field') {
        const fieldLabel = { effort: 'Effort', priority: 'Priority', area: 'Area', role: 'Role', desc: 'Descripción', ac: 'AC', notes: 'Notas', blockedBy: 'Bloqueado por' }[h.data.field] || h.data.field;
        const from = h.data.from ? `${h.data.from} → ` : '';
        // T-202604-423: ac puede ser array — mostrar conteo
        let toLabel = h.data.to || '—';
        if (h.data.field === 'ac' && Array.isArray(h.data.to)) toLabel = `${h.data.to.length} criterio${h.data.to.length !== 1 ? 's' : ''}`;
        // B-202605-241: mismo fix — backward compat con 'import' existente en datos
        const sub = (h.origin === 'checkpoint' || h.origin === 'import') ? `CHECKPOINT${h.sessionId ? ' · ' + h.sessionId : ''}` : '';
        entries.push({ ts: h.ts, type: 'field', icon: '✎', label: `${fieldLabel}: ${from}${toLabel}`, color: 'var(--text2)', sub });
      } else if (h.type === 'title') {
        // T-202604-423: cambio de título
        const from = h.data.from ? `"${h.data.from}" → ` : '';
        // B-202605-241: mismo fix
        const sub = (h.origin === 'checkpoint' || h.origin === 'import') ? `CHECKPOINT${h.sessionId ? ' · ' + h.sessionId : ''}` : '';
        entries.push({ ts: h.ts, type: 'title', icon: '✏', label: `Título: ${from}"${h.data.to || ''}"`, color: 'var(--text2)', sub });
      } else if (h.type === 'note') {
        entries.push({ ts: h.ts, type: 'note', icon: '✍', label: h.data.text || '', color: 'var(--accent)' });
      } else if (h.type === 'unblocked') {
        entries.push({ ts: h.ts, type: 'unblocked', icon: '🔓', label: `Desbloqueado por ${h.data.by || ''}`, color: '#2ecc78' });
      } else if (h.type === 'session-linked') {
        // B-246 + B-245: vinculación de sesión con nombre de IA
        const aiLinked = h.aiId && getAI(h.aiId);
        const aiName = aiLinked ? aiLinked.name : (h.aiId || '');
        entries.push({ ts: h.ts, type: 'session-linked', icon: '🔗', label: `Sesión vinculada${aiName ? ' · ' + aiName : ''}`, color: '#7c6af7', sub: h.data && h.data.sessId ? h.data.sessId : '' });
      } else if (h.type === 'session-unlinked') {
        // B-246 + B-245: desvinculación de sesión con nombre de IA
        const aiUnlinked = h.aiId && getAI(h.aiId);
        const aiNameU = aiUnlinked ? aiUnlinked.name : (h.aiId || '');
        entries.push({ ts: h.ts, type: 'session-unlinked', icon: '🔗', label: `Sesión desvinculada${aiNameU ? ' · ' + aiNameU : ''}`, color: 'var(--hint)', sub: h.data && h.data.sessId ? h.data.sessId : '' });
      }
    });
  } else if (item.statusChangedAt) {
    // Fallback para ítems sin history[]
    const statusIcons2 = { done: '✓', pendiente: '⏳', descartado: '🗑' };
    const statusColors3 = { done: '#2ecc78', pendiente: 'var(--text2)', descartado: 'var(--hint)' };
    entries.push({
      ts: item.statusChangedAt,
      type: 'status',
      icon: statusIcons2[item.status] || '🔄',
      label: `→ ${item.status}`,
      color: statusColors3[item.status] || 'var(--text2)'
    });
  }

  // Done
  if (item.doneAt && item.status === 'done') {
    const alreadyHasDone = entries.some(e => e.type === 'status' && e.ts === item.doneAt);
    if (!alreadyHasDone) {
      entries.push({ ts: item.doneAt, type: 'done', icon: '✓', label: 'Completado', color: '#2ecc78' });
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
          color: '#7c6af7',
          sub: s.title || ''
        });
      }
    }
  });

  if (!entries.length) return `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" data-action="idp-toggle-history" role="button" tabindex="0" aria-expanded="false" aria-controls="idp-hist-body">
        <span>Historial</span>
        <span class="idp-toggle-arrow" id="idp-hist-arrow">▸</span>
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
        <div class="idp-tl-dot" style="--tl-color:${e.color}"></div>
        <div class="idp-tl-line"></div>
      </div>
      <div class="idp-tl-content">
        <div class="idp-tl-main">
          <span class="idp-tl-icon">${e.icon}</span>
          <span class="idp-tl-label" style="--tl-color:${e.color}">${esc(e.label)}</span>
          <span class="idp-tl-ts" title="${_iso(e.ts)}">${_fmt(e.ts)}</span>
        </div>
        ${e.sub ? `<div class="idp-tl-sub">${esc(e.sub)}</div>` : ''}
      </div>
    </div>`).join('');

  return `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" data-action="idp-toggle-history" role="button" tabindex="0" aria-expanded="false" aria-controls="idp-hist-body">
        <span>Historial <span class="idp-hist-count">${entries.length}</span></span>
        <span class="idp-toggle-arrow" id="idp-hist-arrow">▸</span>
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
  const item = getItems().find(i => i.code === code);
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
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  const newTitle = input.value.trim();
  if (newTitle && newTitle !== item.title) {
    const prevTitle = item.title;
    item.title = newTitle;
    // T-202604-423: registrar cambio de título en history[]
    if (!item.history) item.history = [];
    item.history.push({ type: 'title', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevTitle || null, to: newTitle } });
    _undoSnapshot();
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
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  const prev = item[field];
  item[field] = value;
  if (prev === value) return;
  // T-202604-423: registrar cambios de campos en history[] (incluye role)
  if (['effort', 'priority', 'area', 'role'].includes(field)) {
    if (!item.history) item.history = [];
    item.history.push({ type: 'field', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { field, from: prev || null, to: value || null } });
  }
  _undoSnapshot();
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
    const item = getItems().find(i => i.code === _itemPanelCode);
    if (!item) return;
    item.notes = ta.value;
    saveBacklog();
    const s = document.getElementById('idp-notes-status');
    if (s) { s.textContent = '✓ guardado'; setTimeout(() => { if (s) s.textContent = ''; }, 1500); }
  }, 800);
}

function _idpToggleAc() {
  const list = document.getElementById('idp-ac-list');
  const arrow = document.getElementById('idp-ac-arrow');
  if (!list) return;
  const open = list.classList.toggle('open');
  if (arrow) arrow.textContent = open ? '▾' : '▸';
  const btn = document.querySelector('[data-action="idp-toggle-ac"]');
  if (btn) btn.setAttribute('aria-expanded', String(open));
}

// T-202604-423: toggle sección Historial en Item Detail Panel
function _idpToggleHistory() {
  const body = document.getElementById('idp-hist-body');
  const arrow = document.getElementById('idp-hist-arrow');
  if (!body) return;
  const nowHidden = body.classList.toggle('is-hidden');
  if (arrow) arrow.textContent = nowHidden ? '▸' : '▾';
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
  const item = getItems().find(i => i.code === code);
  setItemStatus(code, 'done');
  // Re-renderizar panel para ocultar el botón
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
  const item = getItems().find(i => i.code === code);
  if (!item || !text) return;
  if (!item.history) item.history = [];
  item.history.push({ type: 'note', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { text } });
  _undoSnapshot();
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
  const body  = wrap.querySelector('.acv-body');
  const arrow = wrap.querySelector('.acv-toggle-arrow');
  if (!body) return;
  const open = !body.classList.contains('acv-body--hidden');
  body.classList.toggle('acv-body--hidden', open);
  if (arrow) arrow.textContent = open ? '▸' : '▾';
}

export function _acvStartEdit(rowId, code, acIdx) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const item = getItems().find(i => i.code === code);
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
  const item = getItems().find(i => i.code === code);
  if (!item || !item.ac) return;
  item.ac[acIdx] = newText;
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  showToast('success', 'AC actualizado');
  renderBacklogList();
}

export function _acvConfirm(code, panelId) {
  const item = getItems().find(i => i.code === code);
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

// B-[pendiente-ID]: export-backlog-btn — handler adjuntado una sola vez al iniciar
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
(function _attachIdpDelegation() {
  function _onIdpClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const act = action.dataset.action;

    if (act === 'idp-mark-done') {
      _idpMarkDone(action.dataset.code);
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
    // idp-toggle-ac / idp-toggle-history: Enter/Space para accesibilidad
    const toggle = e.target.closest('[data-action="idp-toggle-ac"],[data-action="idp-toggle-history"]');
    if (toggle && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const act = toggle.dataset.action;
      if (act === 'idp-toggle-ac') _idpToggleAc();
      if (act === 'idp-toggle-history') _idpToggleHistory();
    }
    // T-202605-108: idp-meta-input area: Enter → blur (guarda via _onIdpBlur)
    const areaInp = e.target.closest('.idp-meta-input');
    if (areaInp && e.key === 'Enter') { areaInp.blur(); }
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

// ── T8: Delegation — #item-detail-panel + #migrate-item-overlay + toast-stack ──
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
      case 'idp-toggle-section': {
        const next = el.nextElementSibling;
        if (next) next.classList.toggle('is-hidden');
        const arrow = el.querySelector('.idp-toggle-arrow');
        if (arrow) arrow.textContent = next && next.classList.contains('is-hidden') ? '▸' : '▾';
        break;
      }
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

  // Migrate item overlay
  const migrateOverlay = document.getElementById('migrate-item-overlay');
  if (migrateOverlay) migrateOverlay.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'migrate-cancel') {
      migrateOverlay.classList.remove('open');
    } else if (btn.dataset.action === 'migrate-confirm') {
      _confirmMigrateItem(btn.dataset.itemCode);
    }
  });

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
