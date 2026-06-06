// [PP] v1.2.4 · sprint:PP-S-01 · mod:34 · autor:Rune · 2026-06-05 UTC-6
// locus-sprint.js
// Módulo: Orquestador del tab Sprint — renderSprintTab, _renderSprintItems, _renderSprintWorkers, _renderSprintScopeAdded, _sptSwitch, _renderSprintPlanificar

import { _isBlocked, getItems} from './locus-backlog-core.js';
import { openItemPanel } from './locus-backlog-panel.js';
import { _renderPlanningView, _attachPlanCloseHandler } from './locus-sprint-planificacion.js';
import { _getActiveSprint, confirmCloseSprint, createSprint, createSprintFromGroup, editSprintInline, openSprintRetroView, setSprintStatus } from './locus-backlog-sprints.js';
import { _gconfirmOpen } from './locus-modals.js';
import { renderPlanInto } from './locus-sprint-plan.js';
import { getAI, getActiveSprints, getAllSessions, save } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';

import { render } from './locus-sesiones.js';
import { _markStatusBarDirty } from './locus-sesiones-stats.js';

// ── Estado interno ──────────────────────────────────────────────────────────
let _sprintTabActiveSprint = null;

// ── Helpers internos ────────────────────────────────────────────────────────

function _spEl(id) { return document.getElementById(id); }

function _sprintDaysLabel(sprint) {
  if (!sprint || !sprint.startedAt) return '';
  const opened = new Date(sprint.startedAt);
  const now    = new Date();
  const days   = Math.floor((now - opened) / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Hace 1 día';
  return `Hace ${days} días`;
}

function _sprintReleaseClass(type) {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t === 'major') return 'is-major';
  if (t === 'patch') return 'is-patch';
  return '';
}

function _sprintIsBlocked(item) {
  return _isBlocked(item);
}

function _sprintItemHtml(item) {
  const isBlocked = _sprintIsBlocked(item);
  const isDone    = item.status === 'done';
  let cls = 'spi-item';
  if (isBlocked) cls += ' spi-item--blocked';
  if (isDone)    cls += ' spi-item--done';

  const statusLabel = isDone ? 'Done' : isBlocked ? 'Bloqueado' : 'Pendiente';
  const statusCls   = isDone ? 'spi-item-status--done' : isBlocked ? 'spi-item-status--blocked' : 'spi-item-status--pendiente';
  const blockedIcon = isBlocked ? `<span class="spi-item-blocked-icon" aria-hidden="true">⚠</span>` : '';

  // Progreso de hijos (Ts)
  let childrenHtml = '';
  if (typeof getItems() !== 'undefined') {
    const children = getItems().filter(i => i.parentCode === item.code && i.type === 'T');
    if (children.length > 0) {
      const done = children.filter(c => c.status === 'done').length;
      childrenHtml = `<span class="spi-item-children">${done}/${children.length} T</span>`;
    }
  }

  return `<div class="${cls}" tabindex="0" role="button" aria-label="${item.code}: ${item.title}" data-item-code="${item.code}">
  ${blockedIcon}
  <span class="spi-item-code">${item.code}</span>
  <span class="spi-item-title">${item.title || ''}</span>
  ${childrenHtml}
  <span class="spi-item-status ${statusCls}">${statusLabel}</span>
</div>`;
}

// ── Sub-tab del sprint — R-202605-052 ───────────────────────────────────────
// Paneles del tab Sprint tienen IDs propios (sprint-panel-*).
// switchSubTab opera sobre sspanel-*/sstab-btn-* del tab Docs — contextos distintos.
// _sptSwitch gestiona exclusivamente los paneles del tab Sprint.

const _SPT_PANELS   = ['items', 'planificar', 'plan', 'sprints']; // T-202606-029: cuarto sub-tab

function _sptSwitch(subtab, triggerBtn) {
  _SPT_PANELS.forEach(s => {
    const panel = document.getElementById('sprint-panel-' + s);
    const btn   = document.getElementById('spt-tab-' + s);
    const active = (s === subtab);
    if (panel) panel.classList.toggle('is-hidden', !active);
    if (btn) {
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    }
  });
  // Render bajo demanda
  if (subtab === 'planificar') _renderSprintPlanificar();
  if (subtab === 'plan') renderPlanInto('sprint-plan-container');
  if (subtab === 'sprints') _renderSprintMeta(_getActiveSprint()); // T-202606-029
}

// ── Render panel Planificar — R-202605-052 ──────────────────────────────────

function _renderSprintPlanificar() {
  const container = document.getElementById('sprint-planificar-container');
  if (!container) return;
  if (typeof _renderPlanningView === 'function') {
    _renderPlanningView(container);
    _attachPlanCloseHandler();
  } else {
    container.innerHTML = '<div class="spi-section-empty">Vista Planificar no disponible.</div>';
  }
}

// ── T-202606-029: _renderSprintMeta — metadatos editables del sprint activo ──

/**
 * Renderiza en #spm-meta-section los campos editables del sprint:
 * versión, release type, días abierto y scope.
 */
function _renderSprintMeta(sprint) {
  const section = document.getElementById('spm-meta-section');
  if (!section) return;
  if (!sprint) { section.innerHTML = ''; return; }

  const vt    = sprint.version_target || '';
  const rt    = sprint.release_type   || sprint.releaseType || '';
  const scope = sprint.scope          || '';
  const days  = _sprintDaysLabel(sprint);

  function _fieldRow(key, label, value) {
    const isEmpty  = !value;
    const valClass = isEmpty ? 'spm-meta-value spm-meta-value--empty' : 'spm-meta-value';
    const valText  = isEmpty ? 'Sin declarar' : _escHtml(value);
    const btnTitle = isEmpty ? 'Agregar ' + label : 'Editar ' + label;
    return '<div class="spm-meta-row" data-spm-field="' + key + '">' +
      '<span class="spm-meta-label">' + label + '</span>' +
      '<span class="' + valClass + '">' + valText + '</span>' +
      '<button class="spm-meta-btn" data-spm-edit="' + key + '" aria-label="' + btnTitle + '" title="' + btnTitle + '" type="button">' + (isEmpty ? '+' : '✎') + '</button>' +
      '</div>';
  }

  section.innerHTML = [
    _fieldRow('version_target', 'Versión',      vt),
    _fieldRow('release_type',   'Release type', rt),
    _fieldRow('days',           'Días abierto', days),
    _fieldRow('scope',          'Scope',        scope),
  ].join('');

  // Días abierto — solo lectura, marcar botón como inactivo (AC-4 CSS Purity)
  const daysRow = section.querySelector('[data-spm-field="days"]');
  if (daysRow) {
    const daysBtn = daysRow.querySelector('.spm-meta-btn');
    if (daysBtn) daysBtn.classList.add('spm-meta-btn--readonly');
  }

  // Delegation de edición inline
  section.removeEventListener('click', _spmMetaHandleEdit);
  section.addEventListener('click', _spmMetaHandleEdit);
}

function _spmMetaHandleEdit(e) {
  const btn = e.target.closest('[data-spm-edit]');
  if (!btn) return;
  const field = btn.getAttribute('data-spm-edit');
  if (field === 'days') return;
  const row = btn.closest('.spm-meta-row');
  if (!row) return;
  const sprint = _getActiveSprint();
  if (!sprint) return;

  const currentVal = field === 'version_target' ? (sprint.version_target || '')
                   : field === 'release_type'   ? (sprint.release_type || sprint.releaseType || '')
                   : field === 'scope'           ? (sprint.scope || '')
                   : '';

  _spmMetaOpenEdit(row, field, currentVal, sprint);
}

function _spmMetaOpenEdit(row, field, current, sprint) {
  const valEl = row.querySelector('.spm-meta-value, .spm-meta-value--empty');
  const editBtn = row.querySelector('.spm-meta-btn');
  if (valEl)    valEl.classList.add('is-hidden');    // B-202606-007
  if (editBtn)  editBtn.classList.add('is-hidden');  // B-202606-007

  let editWrap;

  if (field === 'version_target') {
    // AC-4: input text inline
    editWrap = document.createElement('div');
    editWrap.className = 'spm-meta-edit-wrap';
    editWrap.innerHTML =
      '<div class="spm-meta-edit-row">' +
        '<input class="spm-meta-input" type="text" value="' + _escHtml(current) + '" aria-label="Editar versión" />' +
        '<button class="spm-meta-confirm" aria-label="Confirmar" title="Confirmar" type="button">✓</button>' +
        '<button class="spm-meta-cancel"  aria-label="Cancelar"  title="Cancelar"  type="button">✗</button>' +
      '</div>';
    row.appendChild(editWrap);
    const input = editWrap.querySelector('.spm-meta-input');
    input.focus();
    input.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter')  _spmMetaConfirm(row, field, input.value.trim(), sprint, current);
      if (ev.key === 'Escape') _spmMetaCancel();
    });
    editWrap.querySelector('.spm-meta-confirm').addEventListener('click', function() {
      _spmMetaConfirm(row, field, input.value.trim(), sprint, current);
    });
    editWrap.querySelector('.spm-meta-cancel').addEventListener('click', function() {
      _spmMetaCancel();
    });

  } else if (field === 'release_type') {
    // AC-5: pills seleccionables con role=radio
    const types = ['Major', 'Minor', 'Patch'];
    const pillsHtml = types.map(function(t) {
      const sel = (t === current) ? ' is-selected' : '';
      return '<button class="spm-meta-pill' + sel + '" role="radio" aria-checked="' + (t === current) + '" data-rt="' + t + '" type="button">' + t + '</button>';
    }).join('');
    editWrap = document.createElement('div');
    editWrap.className = 'spm-meta-edit-wrap';
    editWrap.innerHTML =
      '<div class="spm-meta-edit-row">' +
        '<div class="spm-meta-pills" role="radiogroup" aria-label="Release type">' + pillsHtml + '</div>' +
        '<button class="spm-meta-confirm" aria-label="Confirmar" title="Confirmar" type="button">✓</button>' +
        '<button class="spm-meta-cancel"  aria-label="Cancelar"  title="Cancelar"  type="button">✗</button>' +
      '</div>';
    row.appendChild(editWrap);
    let selected = current;
    editWrap.querySelectorAll('.spm-meta-pill').forEach(function(pill) {
      pill.addEventListener('click', function() {
        selected = pill.getAttribute('data-rt');
        editWrap.querySelectorAll('.spm-meta-pill').forEach(function(p) {
          p.classList.toggle('is-selected', p.getAttribute('data-rt') === selected);
          p.setAttribute('aria-checked', String(p.getAttribute('data-rt') === selected));
        });
      });
    });
    editWrap.querySelector('.spm-meta-confirm').addEventListener('click', function() {
      _spmMetaConfirm(row, field, selected, sprint, current);
    });
    editWrap.querySelector('.spm-meta-cancel').addEventListener('click', function() {
      _spmMetaCancel();
    });

  } else if (field === 'scope') {
    // AC-6: textarea — Enter no confirma
    editWrap = document.createElement('div');
    editWrap.className = 'spm-meta-edit-wrap';
    editWrap.innerHTML =
      '<textarea class="spm-meta-textarea" aria-label="Editar scope">' + _escHtml(current) + '</textarea>' +
      '<div class="spm-meta-action-row">' +
        '<button class="spm-meta-confirm" aria-label="Confirmar" title="Confirmar" type="button">✓</button>' +
        '<button class="spm-meta-cancel"  aria-label="Cancelar"  title="Cancelar"  type="button">✗</button>' +
      '</div>';
    row.appendChild(editWrap);
    const ta = editWrap.querySelector('.spm-meta-textarea');
    ta.focus();
    ta.addEventListener('keydown', function(ev) {
      if (ev.key === 'Escape') _spmMetaCancel();
      // Enter no confirma — solo ✓ confirma (AC-6)
    });
    editWrap.querySelector('.spm-meta-confirm').addEventListener('click', function() {
      _spmMetaConfirm(row, field, ta.value.trim(), sprint, current);
    });
    editWrap.querySelector('.spm-meta-cancel').addEventListener('click', function() {
      _spmMetaCancel();
    });
  }
}

// AC-7, AC-8, AC-9, AC-11
function _spmMetaConfirm(row, field, newVal, sprint, oldVal) {
  const sprintId   = sprint.id;
  const allSprints = getActiveSprints();
  const target     = allSprints.find(function(s) { return s.id === sprintId; });
  if (!target) { _spmMetaCancel(); return; }

  if (field === 'version_target') target.version_target = newVal;
  if (field === 'release_type')   { target.release_type = newVal; target.releaseType = newVal; }
  if (field === 'scope')          target.scope = newVal;

  try {
    save();
  } catch (err) {
    // AC-11: save() falla → toast de error, revertir
    if (typeof showToast === 'function') showToast('Error al guardar. Intenta de nuevo.', 'error');
    if (field === 'version_target') target.version_target = oldVal;
    if (field === 'release_type')   { target.release_type = oldVal; target.releaseType = oldVal; }
    if (field === 'scope')          target.scope = oldVal;
    _spmMetaCancel();
    return;
  }

  _renderSprintMeta(_getActiveSprint());
}

function _spmMetaCancel() {
  _renderSprintMeta(_getActiveSprint());
}

// Helper: escapar HTML para valores en innerHTML
function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── END T-202606-029 ─────────────────────────────────────────────────────────


function _renderSprintItems(sprint) {
  if (typeof getItems() === 'undefined') return;

  const spItems = getItems().filter(i => {
    const t = i.type || (i.code ? i.code.charAt(0) : '');
    return i.sprint && i.sprint.startsWith(sprint.id) &&
      (t === 'R' || t === 'B') &&
      i.status !== 'descartado';
  });

  const pendiente = spItems.filter(i => i.status !== 'done' && !_sprintIsBlocked(i));
  const bloqueado = spItems.filter(i => i.status !== 'done' &&  _sprintIsBlocked(i));
  const done      = spItems.filter(i => i.status === 'done');

  // Sección pendiente
  const bodyPend = _spEl('spi-body-pendiente');
  const cntPend  = _spEl('spi-count-pendiente');
  if (bodyPend) bodyPend.innerHTML = pendiente.length
    ? pendiente.map(_sprintItemHtml).join('')
    : '<div class="spi-section-empty">Sin ítems pendientes</div>';
  if (cntPend) cntPend.textContent = pendiente.length;

  // Sección bloqueado
  const bodyBlk = _spEl('spi-body-bloqueado');
  const cntBlk  = _spEl('spi-count-bloqueado');
  if (bodyBlk) bodyBlk.innerHTML = bloqueado.length
    ? bloqueado.map(_sprintItemHtml).join('')
    : '<div class="spi-section-empty">Sin ítems bloqueados</div>';
  if (cntBlk) cntBlk.textContent = bloqueado.length;

  // Sección done
  const bodyDone = _spEl('spi-body-done');
  const cntDone  = _spEl('spi-count-done');
  if (bodyDone) bodyDone.innerHTML = done.length
    ? done.map(_sprintItemHtml).join('')
    : '<div class="spi-section-empty">Sin ítems completados</div>';
  if (cntDone) cntDone.textContent = done.length;

  // Burndown
  const total  = spItems.length;
  const pct    = total > 0 ? Math.round((done.length / total) * 100) : 0;
  const effort = spItems.reduce((acc, i) => acc + (i.effort || 0), 0);
  const effortDone = done.reduce((acc, i) => acc + (i.effort || 0), 0);

  const bdFill  = _spEl('sph-bd-fill');
  const bdPct   = _spEl('sph-bd-pct');
  const bdLabel = _spEl('sph-bd-label');
  const bdTrack = _spEl('sph-bd-track');

  if (bdFill) {
    bdFill.style.setProperty('--sph-bd-width', `${pct}%`);
    bdFill.classList.toggle('is-complete', pct === 100);
    bdFill.classList.toggle('is-ready',    pct === 100);
  }
  if (bdPct)   bdPct.textContent   = `${pct}%`;
  if (bdLabel) bdLabel.textContent = `Effort: ${effortDone} / ${effort}`;
  if (bdTrack) {
    bdTrack.setAttribute('aria-valuenow', pct);
    bdTrack.setAttribute('aria-valuetext', `${pct}% completado`);
  }

  // Botón cierre: visible si hay sprint activo con ítems
  const btnClose = _spEl('btn-close-sprint');
  if (btnClose) {
    const allDone = spItems.length > 0 && bloqueado.length === 0 && pendiente.length === 0;
    btnClose.classList.toggle('is-hidden', false);
    btnClose.classList.toggle('is-ready', allDone);
  }
}

function _renderSprintWorkers(sprint) {
  const body   = _spEl('spw-body');
  const section = _spEl('sprint-workers');
  if (!body || !section) return;

  // Workers: IAs que tienen sesiones vinculadas a ítems del sprint
  let workers = [];

  {
    const sessions = getAllSessions();
    const sprintItemCodes = (typeof getItems() !== 'undefined')
      ? new Set(getItems().filter(i => i.sprint && i.sprint.startsWith(sprint.id)).map(i => i.code))
      : new Set();

    const aiIds = new Set();
    sessions.forEach(sess => {
      if (!sess.tgItems || !Array.isArray(sess.tgItems)) return;
      if (sess.tgItems.some(code => sprintItemCodes.has(code))) {
        if (sess.aiId) aiIds.add(sess.aiId);
      }
    });

    aiIds.forEach(id => {
      const ai = getAI(id);
      if (ai) workers.push(ai.name || id);
    });
  }

  if (workers.length === 0) {
    body.innerHTML = '<span class="spw-empty">Sin workers vinculados</span>';
  } else {
    body.innerHTML = workers.map(w => `<span class="spw-pill">${w}</span>`).join('');
  }

  section.classList.remove('is-hidden');
}

function _renderSprintScopeAdded(sprint) {
  const section = _spEl('sprint-scope-added');
  const body    = _spEl('sca-body');
  const count   = _spEl('sca-count');
  if (!section || !body) return;

  if (typeof getItems() === 'undefined') return;

  const scopeItems = getItems().filter(i =>
    i.sprint && i.sprint.startsWith(sprint.id) &&
    i.scopeAdded === true &&
    i.status !== 'descartado'
  );

  if (count) count.textContent = scopeItems.length;

  if (scopeItems.length === 0) {
    body.innerHTML = '<div class="sca-empty">Sin ítems añadidos al scope</div>';
    section.classList.add('is-hidden');
    return;
  }

  body.innerHTML = scopeItems.map(i => {
    const typeKey = (i.type || 'T').toLowerCase();
    const dateStr = i.scopeAddedAt
      ? new Date(i.scopeAddedAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
      : '';
    return `<div class="sca-item">
  <span class="sca-item-type sca-item-type--${typeKey}">${i.type || 'T'}</span>
  <span class="sca-item-code">${i.code}</span>
  <span class="sca-item-title">${i.title || ''}</span>
  ${dateStr ? `<span class="sca-item-date">${dateStr}</span>` : ''}
</div>`;
  }).join('');

  section.classList.remove('is-hidden');
}

// ── T-202605-123: Gestor de sprints — lista completa con progreso y acceso a retro ──

function _renderSprintManager() {
  const container = document.getElementById('sprint-manager-list');
  if (!container) return;

  const allSprints = getActiveSprints();
  if (!allSprints || allSprints.length === 0) {
    container.innerHTML = '<div class="sml-empty">No hay sprints registrados</div>';
    return;
  }

  // Separar activo de cerrados — cerrados ordenados por fecha descendente
  const active  = allSprints.filter(s => s.status === 'active');
  const closed  = allSprints
    .filter(s => s.status !== 'active')
    .sort((a, b) => (b.closedAt || b.createdAt || 0) - (a.closedAt || a.createdAt || 0));

  const ordered = [...active, ...closed];

  const rows = ordered.map(sprint => {
    const isActive  = sprint.status === 'active';
    const isClosed  = !isActive;
    const hasRetro  = !!sprint.retroDoc;

    // Calcular progreso desde getItems()
    let total = 0;
    let done  = 0;
    if (typeof getItems() !== 'undefined') {
      const spItems = getItems().filter(i => {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return i.sprint && i.sprint.startsWith(sprint.id) &&
          (t === 'R' || t === 'B') &&
          i.status !== 'descartado';
      });
      total = spItems.length;
      done  = spItems.filter(i => i.status === 'done').length;
    }

    const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
    const isFullDone = isClosed && pct === 100;

    const label     = sprint.label || sprint.name || sprint.id || '';
    const statusCls = isActive ? 'sml-badge--active' : 'sml-badge--closed';
    const statusTxt = isActive ? 'Activo' : 'Cerrado';
    const rowCls    = isActive ? 'sml-row sml-row--active' : 'sml-row';
    const barCls    = isFullDone ? 'sml-bar-fill sml-bar-fill--done' : 'sml-bar-fill';

    const retroBtn  = (isClosed && hasRetro)
      ? `<button class="sml-retro-btn" data-sprint-id="${sprint.id}" type="button">Ver retro</button>`
      : '';

    // T-202605-134: badge "En curso" (current:true) y botón "Marcar en curso" (active + current:false)
    const isCurrent    = isActive && !!sprint.current;
    const canMarkCurrent = isActive && !sprint.current;
    const currentBadge = isCurrent
      ? `<span class="sml-badge sml-badge--current" data-sprint-current-badge="${sprint.id}">En curso</span>`
      : `<span class="sml-badge sml-badge--current is-hidden" data-sprint-current-badge="${sprint.id}">En curso</span>`;
    const currentBtn   = canMarkCurrent
      ? `<button class="sml-current-btn" data-sprint-set-current="${sprint.id}" type="button" aria-pressed="false" title="Marcar como sprint en curso">Marcar en curso</button>`
      : `<button class="sml-current-btn is-hidden" data-sprint-set-current="${sprint.id}" type="button" aria-pressed="${isCurrent}" title="${isCurrent ? 'Desmarcar sprint en curso' : 'Marcar como sprint en curso'}">Marcar en curso</button>`;

    return `<div class="${rowCls}">
  <div class="sml-row-top">
    <span class="sml-row-name">${label}</span>
    <span class="sml-badge ${statusCls}">${statusTxt}</span>
    ${currentBadge}
    ${currentBtn}
    ${retroBtn}
  </div>
  <div class="sml-row-bottom">
    <div class="sml-bar-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${label}: ${pct}% completado">
      <div class="${barCls}" style="--sml-bar-width:${pct}%"></div>
    </div>
    <span class="sml-row-count">${done} done / ${total} total</span>
  </div>
</div>`;
  }).join('');

  container.innerHTML = rows;
}

// ── END T-202605-123 ─────────────────────────────────────────────────────────

// ── Función principal ───────────────────────────────────────────────────────

export function renderSprintTab() {
  // B-202605-053: actualizar estado interno siempre — independiente del tab visible.
  // El render visual se guarda cuando el tab Sprint no está activo,
  // pero _sprintTabActiveSprint debe reflejar el estado real para que al
  // volver al tab el render sea correcto.
  const _sprintNow = _getActiveSprint();
  _sprintTabActiveSprint = _sprintNow;

  // T-202605-117: Guard de tab activo — skip render visual si el tab Sprint no es el visible.
  // AC-4: Command Palette abierto no cuenta como cambio de tab — evaluar tab subyacente.
  // AC-5: si currentTab no es detectable → fail-safe, ejecutar sin guard.
  const _cpOpen = (() => {
    const el = document.getElementById('cp-overlay');
    return el && !el.classList.contains('is-hidden');
  })();
  if (!_cpOpen && typeof currentTab !== 'undefined' && currentTab !== 'sprint') return;

  const header    = _spEl('sprint-panel-header');
  const itemsList = _spEl('sprint-items-list');
  const emptyEl   = _spEl('tab-sprint-empty');
  const sptNav    = _spEl('spt-nav'); // R-202605-043

  const sprint = _sprintNow;

  if (!sprint) {
    // Sin sprint activo — mostrar empty state, ocultar nav
    if (header)    header.classList.add('is-hidden');
    if (itemsList) itemsList.classList.add('is-hidden');
    if (emptyEl)   emptyEl.classList.remove('is-hidden');
    if (sptNav)    sptNav.classList.add('is-hidden');
    _spmUpdateButtons(null); // AC-6: actualizar botones del empty state
    // T-202605-123: gestor siempre renderiza aunque no haya sprint activo (empty state propio)
    _renderSprintManager();
    const workers    = _spEl('sprint-workers');
    const scopeAdded = _spEl('sprint-scope-added');
    if (workers)   workers.classList.add('is-hidden');
    if (scopeAdded) scopeAdded.classList.add('is-hidden');
    // Ocultar paneles — R-202605-043 + R-202605-052
    const panelItems      = _spEl('sprint-panel-items');
    const panelPlan       = _spEl('sprint-panel-plan');
    const panelPlanificar = _spEl('sprint-panel-planificar');
    if (panelItems)      panelItems.classList.add('is-hidden');
    if (panelPlan)       panelPlan.classList.add('is-hidden');
    if (panelPlanificar) panelPlanificar.classList.add('is-hidden');
    const panelSprints = _spEl('sprint-panel-sprints'); // T-202606-029
    if (panelSprints)    panelSprints.classList.add('is-hidden');
    return;
  }

  // Hay sprint activo
  if (emptyEl) emptyEl.classList.add('is-hidden');

  // Mostrar subtab nav y resetear a "Ítems" — R-202605-043
  if (sptNav) {
    sptNav.classList.remove('is-hidden');
    // Reset al subtab Ítems por defecto — R-202605-052: usa _sptSwitch
    _sptSwitch('items', _spEl('spt-tab-items'));
  }

  // Header
  if (header) {
    header.classList.remove('is-hidden');
    const nameEl    = _spEl('sph-name');
    const versionEl = _spEl('sph-version');
    const pillEl    = _spEl('sph-release-pill');
    const daysEl    = _spEl('sph-days');

    if (nameEl)    nameEl.textContent    = sprint.label || sprint.name || sprint.id || '';
    if (versionEl) versionEl.textContent = sprint.version_target ? `v${sprint.version_target}` : '';
    if (pillEl) {
      const rt = sprint.release_type || sprint.releaseType || 'Minor';
      pillEl.textContent = rt;
      pillEl.className   = `sph-release-pill ${_sprintReleaseClass(rt)}`;
    }
    if (daysEl) daysEl.textContent = _sprintDaysLabel(sprint);
  }

  // Gestor de sprints — T-202605-123
  _renderSprintManager();

  // Metadatos editables del sprint — T-202606-029
  _renderSprintMeta(sprint);

  // Ítems
  if (itemsList) itemsList.classList.remove('is-hidden');
  _renderSprintItems(sprint);

  // Sprint Health panel (vive en locus-backlog-render.js)
  if (typeof _buildSprintHealthPanel === 'function') {
    const healthEl = _spEl('sprint-health-panel');
    if (healthEl) {
      healthEl.innerHTML = _buildSprintHealthPanel(sprint.id);
      healthEl.classList.remove('is-hidden');
    }
  }

  // Gestión del sprint — R-202605-006
  _spmUpdateButtons(sprint);

  // Workers
  _renderSprintWorkers(sprint);

  // Scope added
  _renderSprintScopeAdded(sprint);
}

// ── R-202605-006: Sección Gestión del sprint ───────────────────────────────

// AC-1: estado de colapso persistido en localStorage
const _SPM_COLLAPSED_KEY = 'locus-sprint-mgmt-collapsed';

function _spmIsCollapsed() {
  return localStorage.getItem(_SPM_COLLAPSED_KEY) === 'true';
}

function _spmSetCollapsed(val) {
  localStorage.setItem(_SPM_COLLAPSED_KEY, String(val));
}

// Toggle colapso — AC-1
function _spmToggle() {
  const body    = document.getElementById('sprint-mgmt-body');
  const arrow   = document.getElementById('spm-toggle-arrow');
  const toggleBtn = document.getElementById('sprint-mgmt-toggle');
  if (!body) return;
  const collapsed = !body.classList.contains('is-hidden');
  body.classList.toggle('is-hidden', collapsed);
  if (arrow)     arrow.textContent = collapsed ? '▸' : '▾';
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(!collapsed));
  _spmSetCollapsed(collapsed);
}

// Determina el sprint ID más frecuente en ítems no registrados — AC-2c
function _spmGetUnregisteredSprintId() {
  if (typeof getItems() === 'undefined') return null;
  const allSprints = getActiveSprints();
  const registeredIds = new Set(allSprints.map(s => s.id));
  const freq = {};
  const order = [];
  getItems().forEach(i => {
    if (!i.sprint || registeredIds.has(i.sprint)) return;
    if (!freq[i.sprint]) { freq[i.sprint] = 0; order.push(i.sprint); }
    freq[i.sprint]++;
  });
  if (!order.length) return null;
  // Mayor frecuencia; empate → primero en orden de aparición
  return order.reduce((best, id) => freq[id] > freq[best] ? id : best, order[0]);
}

// AC-2: Registrar y activar
function _spmRegistrar() {
  const sprintId = _spmGetUnregisteredSprintId();
  if (!sprintId) return;

  const activeSprint = _getActiveSprint();

  const doRegister = () => {
    // B-202605-XXX: usar createSprintFromGroup en lugar de createSprint
    // createSprint genera un ID nuevo con _nextSprintId — ignora el ítems.
    // createSprintFromGroup registra el ID existente tal cual, sin regenerarlo.
    // B-202605-054: extraer nombre descriptivo del ID si contiene ' · '
    // Ej: 'PP-S-09 · Migración ESM' → sprintName = 'PP-S-09 · Migración ESM'
    // Ej: 'PP-S-09' → sprintName = undefined → createSprintFromGroup usa id como fallback
    const sprintName = sprintId.includes(' · ') ? sprintId : undefined;
    try {
      createSprintFromGroup(sprintId, sprintName);
      renderSprintTab();
    } catch (err) {
      showToast('error', 'Error al registrar el sprint: ' + (err.message || err));
    }
  };

  if (activeSprint) {
    // AC-2: hay sprint activo — mostrar modal de confirmación
    {
      _gconfirmOpen({
        title: 'Cerrar sprint actual',
        msg: `Se cerrará "${activeSprint.label || activeSprint.id}" y se activará "${sprintId}". ¿Confirmar?`,
        okLabel: 'Cerrar sprint actual y activar el nuevo',
        danger: true
      }, () => {
        try {
          setSprintStatus(activeSprint.id, 'closed');
          doRegister();
        } catch (err) {
          showToast('error', 'Error al cerrar sprint actual: ' + (err.message || err));
        }
      });
    }
  } else {
    doRegister();
  }
}

// AC-3: Reactivar sprint cerrado
function _spmReactivar() {
  const sprint = _sprintTabActiveSprint;
  if (!sprint || sprint.status !== 'closed') return;
  setSprintStatus(sprint.id, 'active');
  renderSprintTab();
}

// AC-4: Ver retrospectiva
function _spmRetro() {
  const sprint = _sprintTabActiveSprint;
  if (!sprint || !sprint.retroDoc) return;
  openSprintRetroView(sprint.id);
}

// AC-5: Editar nombre — abre editSprintInline en el área spm-edit-area
function _spmEditar() {
  const sprint = _sprintTabActiveSprint;
  if (!sprint || sprint.status !== 'active') return;
  {
    // editSprintInline espera un elemento con id sprint-label-wrap-[id]
    // En el tab Sprint no existe ese elemento — creamos uno temporal en spm-edit-area
    const area = document.getElementById('spm-edit-area');
    if (!area) return;
    area.classList.remove('is-hidden');
    const wrapId = 'sprint-label-wrap-' + sprint.id;
    if (!document.getElementById(wrapId)) {
      const wrap = document.createElement('div');
      wrap.id = wrapId;
      area.innerHTML = '';
      area.appendChild(wrap);
    }
    editSprintInline(sprint.id);
    // B-202605-008: editSprintInline inyecta onkeydown con renderBacklogList() como cancelación.
    // En el tab Sprint el comportamiento correcto al cancelar es cerrar spm-edit-area y
    // recuperar visibilidad del botón — sin re-renderizar el backlog.
    // Reemplazamos el handler de Escape en los inputs inyectados por editSprintInline.
    setTimeout(() => {
      const wrap = document.getElementById(wrapId);
      if (!wrap) return;
      wrap.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            e.stopImmediatePropagation();
            _spmCancelEdit();
          }
        }, true); // capture: true — intercepta antes del handler inline
      });
    }, 40); // después de que editSprintInline inyecta el HTML (usa setTimeout 30ms internamente)
  }
}

// B-202605-008: cerrar área de edición limpiamente sin re-renderizar el tab
function _spmCancelEdit() {
  const area = document.getElementById('spm-edit-area');
  if (area) {
    area.innerHTML = '';
    area.classList.add('is-hidden');
  }
  // Recuperar visibilidad del botón Editar si el sprint sigue activo
  const sprint = _sprintTabActiveSprint;
  const btnEditar = document.getElementById('spm-btn-editar');
  if (btnEditar) btnEditar.classList.toggle('is-hidden', !(sprint && sprint.status === 'active'));
}

// AC-6 / R-202605-008: Activar sprint existente (desde empty state)
// AC-1: un solo sprint cerrado → activar directamente (comportamiento original)
// AC-2+: múltiples sprints cerrados → picker inline
function _spmActivarExistente() {
  const sprints = getActiveSprints();
  const closed  = sprints
    .filter(s => s.status !== 'active')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!closed.length) return;

  // AC-1: exactamente uno — activar sin picker
  if (closed.length === 1) {
    setSprintStatus(closed[0].id, 'active');
    renderSprintTab();
    return;
  }

  // AC-2: más de uno — mostrar picker inline
  _spmPickerOpen(closed);
}

// ── R-202605-008: Picker inline de sprint ──────────────────────────────────

let _spmPickerOutsideHandler = null;

function _spmPickerOpen(closedSprints) {
  const btn = document.getElementById('spm-empty-btn-activar');
  if (!btn) return;

  // Evitar duplicado
  _spmPickerClose();

  // AC-2: botón en estado activo
  btn.classList.add('is-active');

  // Construir picker
  const picker = document.createElement('div');
  picker.id = 'spm-sprint-picker';
  picker.className = 'spm-sprint-picker';
  // AC-5: accesibilidad
  picker.setAttribute('role', 'listbox');
  picker.setAttribute('aria-label', 'Seleccionar sprint a activar');

  picker.innerHTML = closedSprints.map((sp, idx) =>
    `<div class="spm-picker-item"
          role="option"
          tabindex="0"
          data-sprint-id="${sp.id}"
          data-sprint-idx="${idx}"
          aria-selected="false">
      <span class="spm-picker-item-label">${sp.label || sp.id}</span>
    </div>`
  ).join('');

  // Insertar después del botón
  btn.insertAdjacentElement('afterend', picker);

  // AC-5: foco al primer ítem
  const first = picker.querySelector('.spm-picker-item');
  if (first) setTimeout(() => first.focus(), 30);

  // T-202605-052: Event delegation — click y keydown en picker
  picker.addEventListener('click', function(e) {
    const opt = e.target.closest('[data-sprint-id]');
    if (opt && typeof _spmPickerSelect === 'function') _spmPickerSelect(opt.dataset.sprintId);
  });
  picker.addEventListener('keydown', function(e) {
    const opt = e.target.closest('[data-sprint-id]');
    if (opt && typeof _spmPickerKey === 'function') _spmPickerKey(e, opt.dataset.sprintId, Number(opt.dataset.sprintIdx));
  });

  // AC-4: click fuera cierra el picker
  _spmPickerOutsideHandler = (e) => {
    if (!picker.contains(e.target) && e.target !== btn) {
      _spmPickerClose();
    }
  };
  document.addEventListener('click', _spmPickerOutsideHandler, true);
}

// AC-3: seleccionar un sprint del picker
function _spmPickerSelect(sprintId) {
  setSprintStatus(sprintId, 'active');
  _spmPickerClose();
  renderSprintTab();
}

// AC-4: teclado — Escape cierra, Enter confirma, flechas navegan
function _spmPickerKey(e, sprintId, idx) {
  if (e.key === 'Enter') {
    e.preventDefault();
    _spmPickerSelect(sprintId);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    _spmPickerClose();
    const btn = document.getElementById('spm-empty-btn-activar');
    if (btn) btn.focus();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const picker = document.getElementById('spm-sprint-picker');
    if (!picker) return;
    const items = Array.from(picker.querySelectorAll('.spm-picker-item'));
    const next = e.key === 'ArrowDown'
      ? items[Math.min(idx + 1, items.length - 1)]
      : items[Math.max(idx - 1, 0)];
    if (next) next.focus();
  }
}

// Cierra y limpia el picker
function _spmPickerClose() {
  const picker = document.getElementById('spm-sprint-picker');
  if (picker) picker.remove();
  const btn = document.getElementById('spm-empty-btn-activar');
  if (btn) btn.classList.remove('is-active');
  if (_spmPickerOutsideHandler) {
    document.removeEventListener('click', _spmPickerOutsideHandler, true);
    _spmPickerOutsideHandler = null;
  }
}

// ── END R-202605-008 ──────────────────────────────────────────────────────

// Actualiza visibilidad de botones según estado — llamado desde renderSprintTab
function _spmUpdateButtons(sprint) {
  const section       = document.getElementById('sprint-mgmt-section');
  const btnRegistrar  = document.getElementById('spm-btn-registrar');
  const btnReactivar  = document.getElementById('spm-btn-reactivar');
  const btnRetro      = document.getElementById('spm-btn-retro');
  const btnEditar     = document.getElementById('spm-btn-editar');

  // Botones del empty state
  const emptyRegistrar = document.getElementById('spm-empty-btn-registrar');
  const emptyActivar   = document.getElementById('spm-empty-btn-activar');

  const allSprints      = getActiveSprints();
  const registeredIds   = new Set(allSprints.map(s => s.id));
  const unregisteredId  = _spmGetUnregisteredSprintId();
  const hasClosed       = allSprints.some(s => s.status !== 'active');

  // Empty state buttons — AC-6
  // B-202605-XXX: cuando hay sprint no registrado, "Registrar" tiene prioridad sobre "Nuevo sprint".
  // Mostrar solo uno a la vez para evitar que el founder cree un sprint con ID colisionado.
  if (emptyRegistrar) {
    emptyRegistrar.classList.toggle('is-hidden', !unregisteredId);
    if (unregisteredId) emptyRegistrar.textContent = 'Registrar y activar ' + unregisteredId;
  }
  if (emptyActivar) emptyActivar.classList.toggle('is-hidden', !hasClosed);

  // T-202605-085: CTA crear sprint — oculto si hay sprint activo O si hay sprint no registrado
  const emptyNuevo = document.getElementById('spm-new-sprint-btn');
  if (emptyNuevo) emptyNuevo.classList.toggle('is-hidden', !!sprint || !!unregisteredId);

  if (!section) return;

  if (!sprint) {
    section.classList.add('is-hidden');
    return;
  }

  section.classList.remove('is-hidden');

  // Restaurar estado de colapso — AC-1
  const body    = document.getElementById('sprint-mgmt-body');
  const arrow   = document.getElementById('spm-toggle-arrow');
  const toggleBtn = document.getElementById('sprint-mgmt-toggle');
  const collapsed = _spmIsCollapsed();
  if (body)      body.classList.toggle('is-hidden', collapsed);
  if (arrow)     arrow.textContent = collapsed ? '▸' : '▾';
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(!collapsed));

  const isRegistered = sprint ? registeredIds.has(sprint.id) : false;
  const isClosed     = sprint ? sprint.status === 'closed' : false;
  const isActive     = sprint ? sprint.status === 'active' : false;
  const hasRetro     = sprint ? !!sprint.retroDoc : false;

  // AC-2: Registrar y activar — solo si el sprint no está registrado en el catálogo
  if (btnRegistrar) {
    const show = !isRegistered && !!unregisteredId;
    btnRegistrar.classList.toggle('is-hidden', !show);
    if (show && unregisteredId) btnRegistrar.textContent = `Registrar y activar ${unregisteredId}`;
  }

  // AC-3: Reactivar — solo cuando sprint cerrado
  if (btnReactivar) btnReactivar.classList.toggle('is-hidden', !isClosed);

  // AC-4: Retro — solo cuando sprint cerrado con retroDoc
  if (btnRetro) btnRetro.classList.toggle('is-hidden', !(isClosed && hasRetro));

  // AC-5: Editar nombre — solo cuando sprint activo
  if (btnEditar) btnEditar.classList.toggle('is-hidden', !isActive);
}

// ── END R-202605-006 ──────────────────────────────────────────────────────

// ── T-202605-046: Listeners — btn-close-sprint y spt-tab buttons ─────────────
// Migrado desde index.html — reemplaza onclick inline en #btn-close-sprint y .spt-tab

document.addEventListener('DOMContentLoaded', function() {
  // B-202605-050: listener único para botones Ver retro en #sprint-manager-list
  // Registrado una sola vez aquí — no dentro de _renderSprintManager() que se llama en cada render
  const smlContainer = document.getElementById('sprint-manager-list');
  if (smlContainer) {
    smlContainer.addEventListener('click', function(e) {
      // B-202605-050: Ver retro
      const retroBtn = e.target.closest('.sml-retro-btn');
      if (retroBtn) {
        const sprintId = retroBtn.dataset.sprintId;
        if (sprintId) {
          openSprintRetroView(sprintId);
        }
        return;
      }

      // T-202605-134: Marcar / desmarcar sprint en curso
      const currentBtn = e.target.closest('.sml-current-btn');
      if (currentBtn) {
        const sprintId = currentBtn.dataset.sprintSetCurrent;
        if (sprintId) setSprintCurrent(sprintId);
        return;
      }
    });
  }

  // Botón cierre sprint
  const btnClose = document.getElementById('btn-close-sprint');
  if (btnClose) {
    btnClose.addEventListener('click', function() {
      const sp = _getActiveSprint();
      if (sp) confirmCloseSprint(sp.id);
    });
  }

  // Sub-tabs sprint: Ítems / Planificar / Plan / Sprints — T-202606-029
  ['items', 'planificar', 'plan', 'sprints'].forEach(function(subtab) {
    const btn = document.getElementById('spt-tab-' + subtab);
    if (btn) {
      btn.addEventListener('click', function() {
        if (typeof _sptSwitch === 'function') _sptSwitch(subtab, btn);
      });
    }
  });

  // B-202606-021: listener shell:render-sprint-tab — sincroniza el tab Sprint ante cambios
  // emitidos por otros módulos (locus-backlog-core, locus-storage, etc.) sin acoplamiento directo.
  window.addEventListener('shell:render-sprint-tab', function() {
    renderSprintTab();
  });

  // T-202605-051: Event delegation en #sprint-items-list para ítems generados dinámicamente
  const itemsList = document.getElementById('sprint-items-list');
  if (itemsList) {
    itemsList.addEventListener('click', function(e) {
      const item = e.target.closest('[data-item-code]');
      if (item) openItemPanel(item.dataset.itemCode);
    });
    itemsList.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('[data-item-code]');
      if (item) {
        e.preventDefault();
        openItemPanel(item.dataset.itemCode);
      }
    });
  }
});

// ── T-202605-107: setSprintCurrent — marcar / desmarcar sprint en curso ────────

/**
 * Marca o desmarca un sprint abierto como "en curso" (current: true).
 *
 * Comportamiento:
 *  - Si sprintId NO es current → lo marca current: true y desmarca cualquier otro.
 *  - Si sprintId YA es current → lo desmarca (current: false). Ninguno queda como current.
 *
 * Actualiza el DOM inmediatamente (sin reload) y persiste via save().
 *
 * Accesible desde inline handlers HTML: window.setSprintCurrent(sprintId)
 *
 * @param {string} sprintId
 */
export function setSprintCurrent(sprintId) {
  if (!sprintId) return;

  const allSprints = getActiveSprints();
  if (!allSprints || !allSprints.length) return;

  // Proyecto activo — todos los sprints comparten el mismo projId
  const targetSprint = allSprints.find(s => s.id === sprintId);
  if (!targetSprint) return;

  // B-202605-056: guard — solo sprints activos pueden marcarse como current
  if (targetSprint.status !== 'active') {
    console.warn(`[setSprintCurrent] sprint ${sprintId} no es active (status: ${targetSprint.status}) — operación ignorada`);
    return;
  }

  const projId      = targetSprint.projId || targetSprint.projectId || null;
  const isAlready   = !!targetSprint.current;
  const nextCurrent = !isAlready; // toggle

  // Mutar modelo — solo sprints del mismo proyecto
  allSprints.forEach(s => {
    const sameProj = projId
      ? (s.projId === projId || s.projectId === projId)
      : true; // sin projId → afectar todos (fallback seguro)
    if (!sameProj) return;
    s.current = (s.id === sprintId) ? nextCurrent : false;
  });

  // Persistir
  save();

  // T-202605-150: sincronizar status bar al cambiar sprint en curso
  _markStatusBarDirty();

  // T-202605-142: sincronizar header y burndown del tab Sprint en tiempo real
  renderSprintTab();

  // Actualizar DOM — sin reload
  // T-202605-148: pasar projId para que _syncCurrentBadges filtre solo sprints del proyecto objetivo
  _syncCurrentBadges(allSprints, projId);
}

/**
 * Sincroniza badges y botones de current en el DOM según el estado del modelo.
 * Opera sobre elementos con data-sprint-id en el tab Sprint.
 *
 * T-202605-148: acepta projId opcional — cuando se provee, opera únicamente sobre
 * los sprints del proyecto objetivo. Evita mutar badges de sprints de otros proyectos
 * cuando allSprints contiene sprints multi-proyecto y projId es null en el modelo.
 *
 * @param {Array}       sprints — array ya mutado
 * @param {string|null} projId  — proyecto objetivo; null → sin filtro (comportamiento original)
 */
function _syncCurrentBadges(sprints, projId) {
  // T-202605-148: filtrar al proyecto objetivo cuando projId está disponible
  const targets = projId
    ? sprints.filter(s => (s.projId === projId || s.projectId === projId))
    : sprints;

  targets.forEach(s => {
    // Badge — elemento con data-sprint-current-badge="[sprintId]"
    const badge = document.querySelector(`[data-sprint-current-badge="${s.id}"]`);
    if (badge) {
      badge.classList.toggle('is-hidden', !s.current);
    }

    // Botón — elemento con data-sprint-set-current="[sprintId]"
    const btn = document.querySelector(`[data-sprint-set-current="${s.id}"]`);
    if (btn) {
      btn.classList.toggle('is-hidden', !!s.current);
      btn.classList.toggle('is-current', !!s.current);
      btn.setAttribute('aria-pressed', String(!!s.current));
      btn.title = s.current ? 'Desmarcar sprint en curso' : 'Marcar como sprint en curso';
    }
  });
}

// ── END T-202605-107 ────────────────────────────────────────────────────────

// ── Exposición pública ──────────────────────────────────────────────────────

// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
window._renderSprintItems       = _renderSprintItems;
window._renderSprintWorkers     = _renderSprintWorkers;
window._renderSprintScopeAdded  = _renderSprintScopeAdded;
window._renderSprintManager     = _renderSprintManager;     // T-202605-123
window._sptSwitch               = _sptSwitch;               // R-202605-052
window._renderSprintPlanificar  = _renderSprintPlanificar;  // R-202605-052
window._renderSprintMeta        = _renderSprintMeta;        // T-202606-029
// R-202605-006
window._spmToggle               = _spmToggle;
window._spmRegistrar            = _spmRegistrar;
window._spmReactivar            = _spmReactivar;
window._spmRetro                = _spmRetro;
window._spmEditar               = _spmEditar;
window._spmCancelEdit           = _spmCancelEdit;      // B-202605-008
window._spmActivarExistente     = _spmActivarExistente;
window._spmPickerSelect         = _spmPickerSelect;    // R-202605-008
window._spmPickerKey            = _spmPickerKey;       // R-202605-008
window._spmPickerClose          = _spmPickerClose;     // R-202605-008
window._spmUpdateButtons        = _spmUpdateButtons;
window.setSprintCurrent         = setSprintCurrent; // T-202605-107

// ── B-202605-019: Listeners — sprint management panel (_spm*) ───────────────
document.addEventListener('DOMContentLoaded', function () {

  // sprint-mgmt-toggle → _spmToggle()
  const spmToggle = document.getElementById('sprint-mgmt-toggle');
  if (spmToggle) spmToggle.addEventListener('click', function () {
    if (typeof _spmToggle === 'function') _spmToggle();
  });

  // spm-btn-registrar → _spmRegistrar()
  const spmRegistrar = document.getElementById('spm-btn-registrar');
  if (spmRegistrar) spmRegistrar.addEventListener('click', function () {
    if (typeof _spmRegistrar === 'function') _spmRegistrar();
  });

  // spm-btn-reactivar → _spmReactivar()
  const spmReactivar = document.getElementById('spm-btn-reactivar');
  if (spmReactivar) spmReactivar.addEventListener('click', function () {
    if (typeof _spmReactivar === 'function') _spmReactivar();
  });

  // spm-btn-retro → _spmRetro()
  const spmRetro = document.getElementById('spm-btn-retro');
  if (spmRetro) spmRetro.addEventListener('click', function () {
    if (typeof _spmRetro === 'function') _spmRetro();
  });

  // spm-btn-editar → _spmEditar()
  const spmEditar = document.getElementById('spm-btn-editar');
  if (spmEditar) spmEditar.addEventListener('click', function () {
    if (typeof _spmEditar === 'function') _spmEditar();
  });

  // spm-new-sprint-btn → openNewSprintInline()
  const spmNewSprint = document.getElementById('spm-new-sprint-btn');
  if (spmNewSprint) spmNewSprint.addEventListener('click', function () {
    if (typeof openNewSprintInline === 'function') openNewSprintInline();
  });

  // spm-empty-btn-registrar → _spmRegistrar()
  const spmEmptyRegistrar = document.getElementById('spm-empty-btn-registrar');
  if (spmEmptyRegistrar) spmEmptyRegistrar.addEventListener('click', function () {
    if (typeof _spmRegistrar === 'function') _spmRegistrar();
  });

  // spm-empty-btn-activar → _spmActivarExistente()
  const spmEmptyActivar = document.getElementById('spm-empty-btn-activar');
  if (spmEmptyActivar) spmEmptyActivar.addEventListener('click', function () {
    if (typeof _spmActivarExistente === 'function') _spmActivarExistente();
  });

});
// ── END B-202605-019 ─────────────────────────────────────────────────────────
