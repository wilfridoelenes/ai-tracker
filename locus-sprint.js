// [PP] v0.2.0 · sprint:PP-S-03 · mod:31 · autor:Rune · 2026-06-15 UTC-6
// locus-sprint.js
// Módulo: Orquestador del tab Sprint — renderSprintTab, _renderSprintItems, _renderSprintWorkers, _renderSprintScopeAdded, _sptSwitch, _renderSprintPlanificar

import { _isBlocked, getItems} from './locus-backlog-core.js';
import { openItemPanel } from './locus-backlog-panel.js';
import { _renderPlanningView, _attachPlanCloseHandler, _attachPlanViewDelegation } from './locus-sprint-planificacion.js';
import { _getActiveSprint, confirmCloseSprint, createSprint, createSprintFromGroup, editSprintInline, openSprintRetroView, setSprintStatus, openNewSprintInline, _getConflictingSprints } from './locus-backlog-sprints.js'; // T-202606-089 AC-3 · T-202606-105
import { _gconfirmOpen } from './locus-modals.js';
import { renderPlanInto } from './locus-sprint-plan.js';
import { getAI, getActiveSprints, getAllSessions, save } from './locus-storage.js';
import { getProjectById, _getActiveProjectFilter } from './locus-proj-core.js';
import { showToast, toast } from './locus-toast.js';

import { render } from './locus-sesiones.js';
import { _markStatusBarDirty } from './locus-sesiones-stats.js';

// ── Estado interno ──────────────────────────────────────────────────────────
let _sprintTabActiveSprint = null;
const _SPT_SUBTAB_KEY   = 'locus-sprint-subtab';
const _SPT_SUBTAB_VALID = ['items', 'planificar', 'plan', 'sprints'];
let _sptActiveSubtab = _SPT_SUBTAB_VALID.includes(localStorage.getItem(_SPT_SUBTAB_KEY))
  ? localStorage.getItem(_SPT_SUBTAB_KEY)
  : 'items'; // B-202606-066: persiste entre recargas de página

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

// B-202606-008: normaliza sprint.id extrayendo solo el prefijo base (antes del ' · ')
// Necesario porque sprint.id puede contener el label completo ("PP-S-01 · Nombre")
// mientras que i.sprint almacena solo el prefijo base ("PP-S-01").
function _spIdBase(sprintId) {
  return (sprintId || '').split(' · ')[0].trim();
}

function _sprintItemHtml(item) {
  const isBlocked = _sprintIsBlocked(item);
  const isDone    = item.status === 'done';
  let cls = 'spi-item';
  if (isBlocked) cls += ' spi-item--blocked';
  if (isDone)    cls += ' spi-item--done';

  const isEnRevision = !isDone && !isBlocked && item.status === 'en-revision';
  const statusLabel = isDone ? 'Done' : isBlocked ? 'Bloqueado' : isEnRevision ? 'En revisión' : 'Pendiente';
  const statusCls   = isDone ? 'spi-item-status--done' : isBlocked ? 'spi-item-status--blocked' : isEnRevision ? 'spi-item-status--en-revision' : 'spi-item-status--pendiente';
  const blockedIcon = isBlocked ? `<span class="spi-item-blocked-icon" aria-hidden="true">⚠</span>` : '';

  // Progreso de hijos (Ts)
  let childrenHtml = '';
  if (Array.isArray(getItems())) {
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

function _sptSwitch(subtab, triggerBtn, skipItemsRender = false) {
  _sptActiveSubtab = subtab; // B-202606-065/066: persiste entre renders y recargas de página
  localStorage.setItem(_SPT_SUBTAB_KEY, subtab);
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
  if (subtab === 'items' && !skipItemsRender) { // B-202606-008: re-render al volver al subtab Ítems — skip si viene desde renderSprintTab (evita doble render)
    const sprint = _getActiveSprint();
    if (sprint) {
      const itemsList = document.getElementById('sprint-items-list');
      if (itemsList) itemsList.classList.remove('is-hidden');
      _renderSprintItems(sprint);
      _renderSprintWorkers(sprint);
      _renderSprintScopeAdded(sprint);
    }
  }
  if (subtab === 'planificar') _renderSprintPlanificar();
  if (subtab === 'plan') renderPlanInto('sprint-plan-container');
  if (subtab === 'sprints') {
    _renderSprintMeta(_getActiveSprint()); // T-202606-029
    _renderSpsActivo(); // T-202606-036
    _renderSpsProgramados(); // T-202606-037
    _renderSpsHotfix(); // T-202606-038
  }
}

// ── Render panel Planificar — R-202605-052 ──────────────────────────────────

function _renderSprintPlanificar() {
  const container = document.getElementById('sprint-planificar-container');
  if (!container) return;
  _renderPlanningView(container);
  // B-202606-034: adjuntar delegación de drag & drop al container correcto —
  // antes se adjuntaba a #backlog-list (que no existe en el tab Sprint)
  _attachPlanViewDelegation(container);
  _attachPlanCloseHandler();
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
  // AC-5: version_target vacío → error inline, no persistir
  if (field === 'version_target' && !newVal) {
    const editWrap = row.querySelector('.spm-meta-edit-wrap');
    if (editWrap) {
      let errEl = editWrap.querySelector('.spm-meta-input-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'spm-meta-input-error';
        errEl.textContent = 'La versión no puede estar vacía.';
        editWrap.appendChild(errEl);
      }
      const input = editWrap.querySelector('.spm-meta-input');
      if (input) input.focus();
    }
    return;
  }

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
    showToast('Error al guardar. Intenta de nuevo.', 'error');
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

// ── T-202606-036: _renderSpsActivo — card del sprint activo en sub-tab Sprints ──

/**
 * Renderiza en #sps-activo la card del sprint activo: header con ID + label
 * editable + badge de estado, meta (version_target/release_type/goal) editable,
 * barra de burndown, y acciones (cerrar sprint / pausar-reanudar).
 * Empty state si no hay sprint activo.
 */
function _renderSpsActivo() {
  const container = document.getElementById('sps-activo');
  if (!container) return;

  const sprint = _getActiveSprint();

  if (!sprint) {
    container.innerHTML =
      '<div class="sps-empty">' +
        '<p>No hay sprint activo.</p>' +
        '<button class="sps-empty-cta" type="button">Crear sprint</button>' +
      '</div>';
    const cta = container.querySelector('.sps-empty-cta');
    if (cta) cta.addEventListener('click', function() { openNewSprintInline(); });
    return;
  }

  const isPausado = sprint.status === 'pausado';
  const cardCls   = isPausado ? 'sps-card sps-card--pausado' : 'sps-card';

  const id    = sprint.id || '';
  const label = sprint.label || sprint.name || '';
  const vt    = sprint.version_target || '';
  const rt    = sprint.release_type || sprint.releaseType || '';
  const goal  = sprint.goal || '';
  const scope = sprint.scope || '';

  const badgeCls = isPausado ? 'sprint-badge-paused' : 'sprint-badge-active';
  const badgeTxt = isPausado ? 'Pausado' : 'Activo';

  // Burndown — mismo cálculo que _renderSprintSummaryTable (R/B/T, sin descartados)
  let total = 0;
  let done  = 0;
  if (Array.isArray(getItems())) {
    const _sid = _spIdBase(id);
    const spItems = getItems().filter(i => {
      const t = i.type || (i.code ? i.code.charAt(0) : '');
      return i.sprint && i.sprint.startsWith(_sid) &&
        (t === 'R' || t === 'B' || t === 'T') &&
        i.status !== 'descartado';
    });
    total = spItems.length;
    done  = spItems.filter(i => i.status === 'done').length;
  }
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function _metaItem(key, label, value, modClass) {
    const isEmpty  = !value;
    const valClass = 'sps-meta-value' + (modClass ? ' ' + modClass : '') + (isEmpty ? ' sps-meta-value--empty' : '');
    const valText  = isEmpty ? 'Sin declarar' : _escHtml(value);
    return '<div class="sps-meta-item" data-sps-field="' + key + '">' +
      '<span class="sps-meta-label">' + label + '</span>' +
      '<span class="' + valClass + '" data-sps-edit="' + key + '" tabindex="0" role="button" aria-label="Editar ' + label + '">' + valText + '</span>' +
      '</div>';
  }

  container.innerHTML =
    '<div class="' + cardCls + '" data-sprint-id="' + _escHtml(id) + '">' +
      '<div class="sps-header">' +
        '<span class="sps-title" data-sps-edit="label" tabindex="0" role="button" aria-label="Editar nombre del sprint">' +
          _escHtml(id) + (label ? ' · ' + _escHtml(label) : '') +
        '</span>' +
        '<span class="sml-badge ' + badgeCls + '">' + badgeTxt + '</span>' +
      '</div>' +
      '<div class="sps-meta">' +
        _metaItem('version_target', 'Versión', vt) +
        _metaItem('release_type', 'Release type', rt) +
        _metaItem('goal', 'Goal', goal, 'sps-inline-input--goal') +
        _metaItem('scope', 'Scope', scope, 'sps-inline-input--scope') +
      '</div>' +
      '<div class="sps-burndown-wrap">' +
        '<div class="sps-burndown-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Burndown del sprint: ' + pct + '% completado">' +
          '<div class="sps-burndown-fill"></div>' +
        '</div>' +
        '<span class="sps-burndown-label">' + done + '/' + total + ' · ' + pct + '%</span>' +
      '</div>' +
      '<div class="sps-actions">' +
        '<button class="sps-btn" data-sps-action="pausar" type="button">' + (isPausado ? 'Reanudar' : 'Pausar') + '</button>' +
        '<button class="sps-btn sps-btn--close" data-sps-action="cerrar" type="button">Cerrar sprint</button>' +
      '</div>' +
    '</div>';

  // CSS Purity: variable de progreso via setProperty — permitido por _Locus-css-ref §CSS Purity
  const fillEl = container.querySelector('.sps-burndown-fill');
  if (fillEl) fillEl.style.setProperty('--sps-burndown-pct', pct + '%');

  // Delegación de edición inline — patrón _spmMetaHandleEdit
  container.removeEventListener('click', _spsHandleClick);
  container.addEventListener('click', _spsHandleClick);
}

function _spsHandleClick(e) {
  const action = e.target.closest('[data-sps-action]');
  if (action) {
    const act = action.getAttribute('data-sps-action');
    const sprint = _getActiveSprint();
    if (!sprint) return;
    if (act === 'pausar') {
      const newStatus = sprint.status === 'pausado' ? 'active' : 'pausado';
      setSprintStatus(sprint.id, newStatus);
      _renderSpsActivo();
    } else if (act === 'cerrar') {
      confirmCloseSprint(sprint.id);
    }
    return;
  }

  const editEl = e.target.closest('[data-sps-edit]');
  if (!editEl) return;
  const field = editEl.getAttribute('data-sps-edit');
  const sprint = _getActiveSprint();
  if (!sprint) return;

  const currentVal = field === 'label'           ? (sprint.label || sprint.name || '')
                   : field === 'version_target'  ? (sprint.version_target || '')
                   : field === 'release_type'    ? (sprint.release_type || sprint.releaseType || '')
                   : field === 'goal'            ? (sprint.goal || '')
                   : field === 'scope'           ? (sprint.scope || '')
                   : '';

  _spsOpenEdit(editEl, field, currentVal, sprint);
}

function _spsOpenEdit(editEl, field, current, sprint) {
  editEl.classList.add('is-hidden');

  const inputCls = field === 'goal'  ? 'sps-inline-input sps-inline-input--goal'
                  : field === 'scope' ? 'sps-inline-input sps-inline-input--scope'
                  : 'sps-inline-input';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = inputCls;
  input.value = current;
  input.setAttribute('aria-label', 'Editar ' + field);
  editEl.insertAdjacentElement('afterend', input);
  input.focus();

  function commit() {
    const trimmed = input.value.trim();
    if (!trimmed) {
      // AC-4/AC-5: vacío descarta el cambio y restaura el valor anterior — no persiste
      input.remove();
      editEl.classList.remove('is-hidden');
      return;
    }
    _spsSaveField(sprint, field, trimmed, current);
  }
  function cancel() {
    input.remove();
    editEl.classList.remove('is-hidden');
  }

  input.addEventListener('keydown', function(ev) {
    if (ev.key === 'Enter')  commit();
    if (ev.key === 'Escape') cancel();
  });
  input.addEventListener('blur', commit);
}

function _spsSaveField(sprint, field, newVal, oldVal) {
  const allSprints = getActiveSprints();
  const target = allSprints.find(function(s) { return s.id === sprint.id; });
  if (!target) { _renderSpsActivo(); return; }

  if (field === 'label')           target.label = newVal;
  if (field === 'version_target')  target.version_target = newVal;
  if (field === 'release_type')    { target.release_type = newVal; target.releaseType = newVal; }
  if (field === 'goal')             target.goal = newVal;
  if (field === 'scope')            target.scope = newVal;

  try {
    save();
  } catch (err) {
    showToast('Error al guardar. Intenta de nuevo.', 'error');
    if (field === 'label')           target.label = oldVal;
    if (field === 'version_target')  target.version_target = oldVal;
    if (field === 'release_type')    { target.release_type = oldVal; target.releaseType = oldVal; }
    if (field === 'goal')             target.goal = oldVal;
    if (field === 'scope')            target.scope = oldVal;
  }

  _renderSpsActivo();
}

// ── END T-202606-036 ─────────────────────────────────────────────────────────

// ── T-202606-037: _renderSpsProgramados — lista de Sprints Programados ──────

/**
 * _getProgramadosSprints — filtra sprints con status 'programado', normaliza
 * activationOrder para los que no lo tienen (se les asigna el índice de su
 * posición en el array ordenado, 0-based, y se persiste via save() antes de
 * retornar), y retorna el array ordenado por activationOrder ascendente.
 * Sprints sin activationOrder van al final, en orden de aparición del array.
 */
function _getProgramadosSprints() {
  const all = getActiveSprints().filter(function(s) { return s.status === 'programado'; });

  const withOrder    = all.filter(function(s) { return typeof s.activationOrder === 'number'; });
  const withoutOrder = all.filter(function(s) { return typeof s.activationOrder !== 'number'; });

  withOrder.sort(function(a, b) { return a.activationOrder - b.activationOrder; });

  if (withoutOrder.length > 0) {
    const startIdx = withOrder.length;
    withoutOrder.forEach(function(s, i) { s.activationOrder = startIdx + i; });
    try {
      save();
    } catch (err) {
      // activationOrder queda asignado en memoria — próxima lectura reintenta la normalización
    }
  }

  return withOrder.concat(withoutOrder);
}

/**
 * Renderiza en #sps-programados la lista de sprints en estado 'programado':
 * fila por sprint con drag handle, ID, label+scope, version_target editable
 * y botón Descartar. Empty state inline si no hay sprints programados.
 */
function _renderSpsProgramados() {
  const container = document.getElementById('sps-programados');
  if (!container) return;

  const sprints = _getProgramadosSprints();

  if (sprints.length === 0) {
    container.innerHTML = '<div class="sps-scheduled-empty">Sin sprints programados</div>';
    return;
  }

  container.innerHTML = sprints.map(function(s) {
    const id    = s.id || '';
    const label = s.label || s.name || '';
    const vt    = s.version_target || '';
    const scope = s.scope || '';
    const nameText  = scope ? (label + ' — ' + scope) : label;
    const nameClass = 'sps-scheduled-name' + (nameText ? '' : ' sps-meta-value--empty');
    const vtClass   = 'sps-meta-value' + (vt ? '' : ' sps-meta-value--empty');

    return '<div class="sps-scheduled-row" draggable="false" data-sprint-id="' + _escHtml(id) + '">' +
        '<span class="drag-handle" tabindex="0" role="button" aria-label="Reordenar sprint ' + _escHtml(id) + '"></span>' +
        '<span class="sps-scheduled-id">' + _escHtml(id) + '</span>' +
        '<span class="' + nameClass + '" data-spp-edit="label" tabindex="0" role="button" aria-label="Editar nombre del sprint ' + _escHtml(id) + '">' +
          (nameText ? _escHtml(nameText) : 'Sin declarar') +
        '</span>' +
        '<span class="' + vtClass + '" data-spp-edit="version_target" tabindex="0" role="button" aria-label="Editar versión de ' + _escHtml(id) + '">' +
          (vt ? _escHtml(vt) : 'Sin declarar') +
        '</span>' +
        '<button class="sps-btn sps-btn--close" type="button" data-spp-action="descartar" aria-label="Descartar sprint ' + _escHtml(id) + '">Descartar</button>' +
      '</div>';
  }).join('');

  container.removeEventListener('click', _sppHandleClick);
  container.addEventListener('click', _sppHandleClick);

  _sppAttachDrag(container);
}

function _sppHandleClick(e) {
  const discardBtn = e.target.closest('[data-spp-action="descartar"]');
  if (discardBtn) {
    const row = discardBtn.closest('.sps-scheduled-row');
    const id  = row ? row.getAttribute('data-sprint-id') : null;
    const sprint = getActiveSprints().find(function(s) { return s.id === id; });
    if (!sprint) return;

    const label = sprint.label || sprint.name || sprint.id;
    _gconfirmOpen({
      title: 'Descartar sprint',
      msg: 'Se descartará el sprint "' + label + '". Esta acción no se puede deshacer.',
      okLabel: 'Descartar',
      danger: true
    }, function() {
      sprint.status = 'descartado';
      try {
        save();
      } catch (err) {
        showToast('Error al guardar. Intenta de nuevo.', 'error');
        sprint.status = 'programado';
      }
      _renderSpsProgramados();
    });
    return;
  }

  const editEl = e.target.closest('[data-spp-edit]');
  if (!editEl) return;
  const row = editEl.closest('.sps-scheduled-row');
  const id  = row ? row.getAttribute('data-sprint-id') : null;
  const sprint = getActiveSprints().find(function(s) { return s.id === id; });
  if (!sprint) return;

  const field = editEl.getAttribute('data-spp-edit');
  const currentVal = field === 'label'           ? (sprint.label || sprint.name || '')
                    : field === 'version_target' ? (sprint.version_target || '')
                    : '';

  _sppOpenEdit(editEl, field, currentVal, sprint);
}

function _sppOpenEdit(editEl, field, current, sprint) {
  editEl.classList.add('is-hidden');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'sps-inline-input';
  input.value = current;
  input.setAttribute('aria-label', 'Editar ' + field);
  editEl.insertAdjacentElement('afterend', input);
  input.focus();

  function commit() {
    const trimmed = input.value.trim();
    if (!trimmed) {
      // AC-4: vacío descarta el cambio y restaura el valor anterior — no persiste
      input.remove();
      editEl.classList.remove('is-hidden');
      return;
    }
    _sppSaveField(sprint, field, trimmed, current);
  }
  function cancel() {
    input.remove();
    editEl.classList.remove('is-hidden');
  }

  input.addEventListener('keydown', function(ev) {
    if (ev.key === 'Enter')  commit();
    if (ev.key === 'Escape') cancel();
  });
  input.addEventListener('blur', commit);
}

function _sppSaveField(sprint, field, newVal, oldVal) {
  const allSprints = getActiveSprints();
  const target = allSprints.find(function(s) { return s.id === sprint.id; });
  if (!target) { _renderSpsProgramados(); return; }

  if (field === 'label')          target.label = newVal;
  if (field === 'version_target') target.version_target = newVal;

  try {
    save();
  } catch (err) {
    showToast('Error al guardar. Intenta de nuevo.', 'error');
    if (field === 'label')          target.label = oldVal;
    if (field === 'version_target') target.version_target = oldVal;
  }

  _renderSpsProgramados();
}

/**
 * _sppAttachDrag — habilita reordenamiento drag & drop sobre las filas de
 * #sps-programados. El drag solo inicia desde .drag-handle: mousedown sobre
 * el handle habilita draggable en la fila; dragend lo deshabilita. Arrastrar
 * el resto de la fila no activa drag (AC-3).
 */
function _sppAttachDrag(container) {
  const rows = container.querySelectorAll('.sps-scheduled-row');
  rows.forEach(function(row) {
    const handle = row.querySelector('.drag-handle');
    if (!handle) return;

    var _dragStarted = false;

    handle.addEventListener('mousedown', function() {
      _dragStarted = false;
      row.setAttribute('draggable', 'true');
    });

    handle.addEventListener('mouseup', function() {
      if (!_dragStarted) row.setAttribute('draggable', 'false');
    });

    handle.addEventListener('mouseleave', function() {
      if (!_dragStarted) row.setAttribute('draggable', 'false');
    });

    row.addEventListener('dragstart', function(e) {
      if (row.getAttribute('draggable') !== 'true') { e.preventDefault(); return; }
      _dragStarted = true;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', row.getAttribute('data-sprint-id') || '');
      row.classList.add('is-dragging');
    });

    row.addEventListener('dragend', function() {
      _dragStarted = false;
      row.classList.remove('is-dragging');
      row.setAttribute('draggable', 'false');
    });

    row.addEventListener('dragover', function(e) {
      e.preventDefault();
    });

    row.addEventListener('drop', function(e) {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId  = row.getAttribute('data-sprint-id');
      if (!draggedId || draggedId === targetId) return;
      _sppReorder(draggedId, targetId);
    });
  });
}

/**
 * _sppReorder — mueve el sprint draggedId a la posición de targetId dentro
 * de los sprints programados, reasigna activationOrder secuencial (0-based)
 * a todos según el nuevo orden, persiste via save() y re-renderiza (AC-3).
 */
function _sppReorder(draggedId, targetId) {
  const sprints = _getProgramadosSprints();
  const fromIdx = sprints.findIndex(function(s) { return s.id === draggedId; });
  const toIdx   = sprints.findIndex(function(s) { return s.id === targetId; });
  if (fromIdx === -1 || toIdx === -1) return;

  const reordered = sprints.slice();
  const moved = reordered.splice(fromIdx, 1)[0];
  reordered.splice(toIdx, 0, moved);

  reordered.forEach(function(s, i) { s.activationOrder = i; });

  try {
    save();
  } catch (err) {
    showToast('Error al guardar el orden. Intenta de nuevo.', 'error');
  }

  _renderSpsProgramados();
}

// ── END T-202606-037 ─────────────────────────────────────────────────────────

// ── B-202606-064: T-202606-131/132 eliminados — aprobación de sprint ocurre via Step 0 del DIFF ──

// ── B-202606-006: helper — HTML del contenedor R con Ts hijos ────────────────

function _sprintRGroupHtml(rItem, childTs) {
  const code  = rItem.code  || '';
  const title = rItem.title || '';
  // B-202606-013: indicador de progreso X/N Ts done — solo cuando hay Ts en el sprint
  const tDone  = childTs.filter(t => t.status === 'done').length;
  const tTotal = childTs.length;
  const progressHtml = tTotal > 0
    ? `<span class="spi-r-header-progress">${tDone}/${tTotal} T</span>`
    : '';
  return `<div class="spi-r-group" data-r-group="${code}">
  <div class="spi-r-header" role="button" tabindex="0"
       aria-expanded="true" aria-controls="spi-r-children-${code}"
       data-r-toggle="${code}">
    <span class="spi-r-header-code">${code}</span>
    <span class="spi-r-header-title">${title}</span>
    ${progressHtml}
    <span class="spi-r-header-toggle" aria-hidden="true">▾</span>
  </div>
  <div class="spi-r-children" id="spi-r-children-${code}">
    ${childTs.map(_sprintItemHtml).join('')}
  </div>
</div>`;
}

function _renderSprintItems(sprint) {
  // B-202606-006: guard corregido — getItems() siempre retorna array, nunca undefined
  if (!Array.isArray(getItems())) return;

  // B-202606-008: normalizar sprint.id — puede contener el label completo ("PP-S-01 · Nombre")
  // mientras que i.sprint almacena solo el prefijo base ("PP-S-01"). Sin normalización el
  // startsWith falla y spItems queda vacío aunque haya ítems en el sprint.
  const _sid = _spIdBase(sprint.id);

  const spItems = getItems().filter(i => {
    const t = i.type || (i.code ? i.code.charAt(0) : '');
    return i.sprint && i.sprint.startsWith(_sid) &&
      (t === 'R' || t === 'B' || t === 'T') &&
      i.status !== 'descartado';
  });

  const pendiente   = spItems.filter(i => i.status === 'pendiente' && !_sprintIsBlocked(i));
  const enRevision  = spItems.filter(i => i.status === 'en-revision' && !_sprintIsBlocked(i));
  const bloqueado   = spItems.filter(i => i.status !== 'done' &&  _sprintIsBlocked(i));
  const done        = spItems.filter(i => i.status === 'done');

  // B-202606-006 AC-1: helper — renderiza una sección agrupando Rs con sus Ts hijos.
  // Un R se renderiza como contenedor (_sprintRGroupHtml) solo si tiene al menos un T
  // hijo en la misma sección. R sin Ts en la sección → ítem plano, no contenedor vacío (AC-3).
  // Ts huérfanos (sin R padre en spItems) y Bs siempre se renderizan como ítems planos (AC-2).
  function _renderSection(sectionItems) {
    if (!sectionItems.length) return null; // null = señal de empty state al llamador

    const rItems = sectionItems.filter(i => (i.type || (i.code ? i.code.charAt(0) : '')) === 'R');
    const tItems = sectionItems.filter(i => (i.type || (i.code ? i.code.charAt(0) : '')) === 'T');
    const bItems = sectionItems.filter(i => (i.type || (i.code ? i.code.charAt(0) : '')) === 'B');

    const rCodesInSection = new Set(rItems.map(r => r.code));

    // Ts con R padre presente en esta sección → agrupados bajo el R
    // Ts sin R padre en esta sección (huérfanos) → ítem plano (AC-2)
    const tByParent = {};
    const tOrphans  = [];
    tItems.forEach(t => {
      const parentCode = t.parentCode || t.parent || null;
      if (parentCode && rCodesInSection.has(parentCode)) {
        if (!tByParent[parentCode]) tByParent[parentCode] = [];
        tByParent[parentCode].push(t);
      } else {
        tOrphans.push(t);
      }
    });

    const parts = [];

    // Rs con Ts hijos → grupo contenedor; Rs sin Ts en esta sección → ítem plano (AC-3)
    rItems.forEach(r => {
      const childTs = tByParent[r.code] || [];
      parts.push(childTs.length ? _sprintRGroupHtml(r, childTs) : _sprintItemHtml(r));
    });

    // Ts huérfanos y Bs siempre planos (AC-2)
    tOrphans.forEach(t => parts.push(_sprintItemHtml(t)));
    bItems.forEach(b  => parts.push(_sprintItemHtml(b)));

    return parts.join('');
  }

  // Sección pendiente
  const bodyPend = _spEl('spi-body-pendiente');
  const cntPend  = _spEl('spi-count-pendiente');
  if (bodyPend) {
    const html = _renderSection(pendiente);
    bodyPend.innerHTML = html !== null ? html : '<div class="spi-section-empty">Sin ítems pendientes</div>';
  }
  if (cntPend) cntPend.textContent = pendiente.length;

  // Sección en-revision — B-202606-031
  const bodyRev = _spEl('spi-body-en-revision');
  const cntRev  = _spEl('spi-count-en-revision');
  if (bodyRev) {
    const html = _renderSection(enRevision);
    bodyRev.innerHTML = html !== null ? html : '<div class="spi-section-empty">Sin ítems en revisión</div>';
  }
  if (cntRev) cntRev.textContent = enRevision.length;

  // Sección bloqueado
  const bodyBlk = _spEl('spi-body-bloqueado');
  const cntBlk  = _spEl('spi-count-bloqueado');
  if (bodyBlk) {
    const html = _renderSection(bloqueado);
    bodyBlk.innerHTML = html !== null ? html : '<div class="spi-section-empty">Sin ítems bloqueados</div>';
  }
  if (cntBlk) cntBlk.textContent = bloqueado.length;

  // Sección done
  const bodyDone = _spEl('spi-body-done');
  const cntDone  = _spEl('spi-count-done');
  if (bodyDone) {
    const html = _renderSection(done);
    bodyDone.innerHTML = html !== null ? html : '<div class="spi-section-empty">Sin ítems completados</div>';
  }
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
    const allDone = spItems.length > 0 && bloqueado.length === 0 && pendiente.length === 0 && enRevision.length === 0;
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
    const _sid = _spIdBase(sprint.id); // B-202606-008
    const sprintItemCodes = Array.isArray(getItems())
      ? new Set(getItems().filter(i => i.sprint && i.sprint.startsWith(_sid)).map(i => i.code))
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

  if (!Array.isArray(getItems())) return;

  const _sid = _spIdBase(sprint.id); // B-202606-008
  const scopeItems = getItems().filter(i =>
    i.sprint && i.sprint.startsWith(_sid) &&
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

// ── T-202606-040: _renderPlannedSprints — sección Sprints planificados ──────
//
// Muestra en #sprint-planned-list los sprints que tienen ítems asignados
// y cuyo status es distinto a 'active' o 'closed' (sprints no registrados
// en getActiveSprints() o registrados con otro status).
//
// AC1: sprint con ítems aparece con conteo R=N · T=N · B=N y effort total.
// AC2: ítems en sprint activo (active) no aparecen aquí — solo sprints planificados.
// AC3: sprint sin ítems asignados no aparece.
// AC4: al abrir formalmente un sprint planificado, desaparece de esta sección.
// AC5: sprint activo excluido de esta sección.

function _renderPlannedSprints() {
  const container = document.getElementById('sprint-planned-list');
  if (!container) return;

  if (!Array.isArray(getItems())) {
    container.innerHTML = '';
    return;
  }

  const allSprints    = getActiveSprints();
  const activeIds     = new Set(allSprints.filter(s => s.status === 'active').map(s => s.id));
  const closedIds     = new Set(allSprints.filter(s => s.status === 'closed').map(s => s.id));
  const _extractId    = s => (s || '').split(' · ')[0].trim();

  // Agrupar ítems no descartados por sprint, excluyendo active, closed e icebox
  const plannedMap = {};
  getItems().forEach(i => {
    const raw = (i.sprint || '').trim();
    if (!raw || raw === 'icebox') return;
    const id = _extractId(raw);
    if (!id) return;
    if (activeIds.has(id) || closedIds.has(id)) return;
    if (i.status === 'descartado') return;
    if (!plannedMap[id]) plannedMap[id] = [];
    plannedMap[id].push(i);
  });

  const keys = Object.keys(plannedMap);
  if (!keys.length) {
    container.innerHTML = '';
    return;
  }

  // Ordenar por número de sprint ascendente (próximos primero)
  keys.sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, '')) || 0;
    const nb = parseInt(b.replace(/\D/g, '')) || 0;
    return na - nb;
  });

  let html = `<div class="spl-section">
    <div class="spl-header">
      <span class="spl-title">Sprints planificados</span>
      <span class="spl-count">${keys.length}</span>
    </div>
    <div class="spl-list">`;

  keys.forEach(sprintId => {
    const items  = plannedMap[sprintId];
    const spObj  = allSprints.find(s => s.id === sprintId);
    const label  = spObj ? (spObj.label || sprintId) : sprintId;
    const countR = items.filter(i => (i.type || (i.code ? i.code.charAt(0) : '')) === 'R').length;
    const countT = items.filter(i => (i.type || (i.code ? i.code.charAt(0) : '')) === 'T').length;
    const countB = items.filter(i => (i.type || (i.code ? i.code.charAt(0) : '')) === 'B').length;
    const effort = items.reduce((acc, i) => acc + (parseInt(i.effort) || 0), 0);

    const countParts = [];
    if (countR) countParts.push(`<span class="spl-type spl-type--r">R=${countR}</span>`);
    if (countT) countParts.push(`<span class="spl-type spl-type--t">T=${countT}</span>`);
    if (countB) countParts.push(`<span class="spl-type spl-type--b">B=${countB}</span>`);

    html += `<div class="spl-row" data-sprint-id="${_escHtml(sprintId)}">
      <span class="spl-row-id">${_escHtml(sprintId)}</span>
      ${label !== sprintId ? `<span class="spl-row-name">${_escHtml(label.replace(/^[A-Za-z]+-S-\d+\s*·?\s*/i, ''))}</span>` : ''}
      <span class="spl-row-counts">${countParts.join('')}</span>
      <span class="spl-row-effort">effort ${effort}</span>
    </div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

// ── END T-202606-040 ──────────────────────────────────────────────────────────

// ── T-202605-123: Gestor de sprints — lista completa con progreso y acceso a retro ──

function _renderSprintManager() {
  const container = document.getElementById('sprint-manager-list');
  if (!container) return;

  // T-202606-040: sección "Sprints planificados" — independiente de si hay
  // sprints registrados en getActiveSprints(), por eso va antes del early-return
  _renderPlannedSprints();

  const allSprints = getActiveSprints();

  // T-202606-001: Sección HOTFIX — siempre antes de la lista normal
  _renderHotfixSection(allSprints);

  // T-202606-002: Resumen agregado — sprints normales (isHotfix falsy)
  _renderSprintSummaryTable(allSprints);

  if (!allSprints || allSprints.length === 0) {
    container.innerHTML = '<div class="sml-empty">No hay sprints registrados</div>';
    return;
  }

  // Excluir HOTFIX de la lista principal — T-202606-001 AC-6 no-regresión
  // B-202606-019: incluir 'scheduled' en ordered — antes quedaban excluidos y no aparecían en Tab Sprints.
  // El filtro de closed usaba status !== 'active' (capturaba scheduled + closed), pero la construcción
  // de rows trataba todo lo que no es active como 'Cerrado', haciendo scheduled invisible.
  // Separar en tres grupos explícitos: active, scheduled, closed.
  const active    = allSprints.filter(s => s.status === 'active' && !s.isHotfix);
  const scheduled = allSprints.filter(s => s.status === 'scheduled' && !s.isHotfix);
  const closed    = allSprints
    .filter(s => s.status === 'closed' && !s.isHotfix)
    .sort((a, b) => (b.closedAt || b.createdAt || 0) - (a.closedAt || a.createdAt || 0));

  const ordered = [...active, ...scheduled, ...closed];

  if (!ordered.length) {
    container.innerHTML = '<div class="sml-empty">No hay sprints registrados</div>';
    return;
  }

  const rows = ordered.map(sprint => {
    const isActive  = sprint.status === 'active';
    const hasRetro  = !!sprint.retroDoc;

    // Calcular progreso desde getItems()
    let total = 0;
    let done  = 0;
    if (Array.isArray(getItems())) {
      // B-202606-006: incluir T en el conteo — el filtro anterior excluía Ts del burndown
      const _sid = _spIdBase(sprint.id); // B-202606-008
      const spItems = getItems().filter(i => {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return i.sprint && i.sprint.startsWith(_sid) &&
          (t === 'R' || t === 'B' || t === 'T') &&
          i.status !== 'descartado';
      });
      total = spItems.length;
      done  = spItems.filter(i => i.status === 'done').length;
    }

    const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
    // B-202606-019: declarar isScheduled e isClosed antes de isFullDone — isFullDone los referencia.
    const isScheduled = sprint.status === 'scheduled';
    const isClosed    = !isActive && !isScheduled;
    const isFullDone = isClosed && pct === 100;

    const label     = sprint.label || sprint.name || sprint.id || '';
    // B-202606-019: status 'scheduled' recibe label y clase propios — no colapsado en 'Cerrado'.
    const statusCls = isActive    ? 'sml-badge--active'
                    : isScheduled ? 'sml-badge--scheduled'
                    : 'sml-badge--closed';
    const statusTxt = isActive    ? 'Activo'
                    : isScheduled ? 'Programado'
                    : 'Cerrado';
    const rowCls    = isActive    ? 'sml-row sml-row--active'
                    : isScheduled ? 'sml-row sml-row--scheduled'
                    : 'sml-row';
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

// ── T-202606-001: Sección HOTFIX diferenciada en subtab Ítems ────────────────
//
// Renderiza en #sprint-hotfix-list una sección con label fija 'PP-S-HOTFIX · Sprint persistente'
// visible siempre cuando isHotfix:true existe en proj.sprints — sin burndown ni botón cierre.
// Si no existe ningún sprint con isHotfix:true, la sección no aparece.

function _renderHotfixSection(allSprints) {
  const container = document.getElementById('sprint-hotfix-list');
  if (!container) return;

  // AC-4: sin sprint con isHotfix:true → sección ausente, sin error
  const hotfixSprint = allSprints ? allSprints.find(s => s.isHotfix === true) : null;
  if (!hotfixSprint) {
    container.innerHTML = '';
    return;
  }

  // AC-2: conteo de ítems por status usando patrón .spi-count-*
  let pendiente = 0;
  let done = 0;
  if (Array.isArray(getItems())) {
    const _hsid = _spIdBase(hotfixSprint.id); // B-202606-008
    const hotfixItems = getItems().filter(i => {
      const t = i.type || (i.code ? i.code.charAt(0) : '');
      return i.sprint && i.sprint.startsWith(_hsid) &&
        (t === 'R' || t === 'B' || t === 'T') &&
        i.status !== 'descartado';
    });
    pendiente = hotfixItems.filter(i => i.status !== 'done').length;
    done      = hotfixItems.filter(i => i.status === 'done').length;
    const total = hotfixItems.length;

    // AC-3: 0 ítems → visible con '0 ítems'
    // AC-2: N ítems → 'N pendiente · N done'
    const countText = total === 0
      ? '0 ítems'
      : `${pendiente} pendiente · ${done} done`;

    container.innerHTML = `<div class="sml-hotfix-section">
  <div class="sml-hotfix-header">
    <span class="sml-hotfix-label">${_escHtml(hotfixSprint.id)} · Sprint persistente</span>
    <span class="sml-hotfix-count">${countText}</span>
  </div>
</div>`;
  } else {
    container.innerHTML = `<div class="sml-hotfix-section">
  <div class="sml-hotfix-header">
    <span class="sml-hotfix-label">${_escHtml(hotfixSprint.id)} · Sprint persistente</span>
    <span class="sml-hotfix-count">0 ítems</span>
  </div>
</div>`;
  }
}

// ── END T-202606-001 ─────────────────────────────────────────────────────────

// ── T-202606-002 / T-202606-003: Resumen agregado de sprints normales + edición inline ──
//
// T2: lista todos los sprints normales (isHotfix falsy) con id, nombre, status badge,
//     conteo R/T/B, effort total. Escribe en #sprint-summary-list.
// T3: goal, scope, version_target editables inline — click activa input/textarea in-place,
//     blur/Enter guarda, Escape cancela.

function _renderSprintSummaryTable(allSprints) {
  const container = document.getElementById('sprint-summary-list');
  if (!container) return;

  // AC-4 T2: solo sprints normales (isHotfix falsy)
  const normalSprints = allSprints
    ? allSprints.filter(s => !s.isHotfix)
    : [];

  // AC-4 T2: sin sprints normales → empty state
  if (!normalSprints.length) {
    container.innerHTML = '<div class="ssm-empty">Sin sprints creados</div>';
    return;
  }

  // Ordenar: activos primero, luego por fecha desc
  const ordered = [
    ...normalSprints.filter(s => s.status === 'active'),
    ...normalSprints
      .filter(s => s.status !== 'active')
      .sort((a, b) => (b.closedAt || b.createdAt || 0) - (a.closedAt || a.createdAt || 0)),
  ];

  const rows = ordered.map(sprint => {
    const isActive  = sprint.status === 'active';
    // AC-2b T-202606-002: badge multi-status — programado y pausado tienen clases propias
    const statusBadgeCls = sprint.status === 'active'     ? 'sprint-badge-active'
                         : sprint.status === 'programado' ? 'sprint-badge-programado'
                         : sprint.status === 'pausado'    ? 'sprint-badge-paused'
                         :                                  'sprint-badge-closed';
    const statusTxt      = sprint.status === 'active'     ? 'Activo'
                         : sprint.status === 'programado' ? 'Programado'
                         : sprint.status === 'pausado'    ? 'Pausado'
                         :                                  'Cerrado';

    // Conteo R/T/B y effort — AC-2 T2
    let countR = 0, countT = 0, countB = 0, effort = 0;
    if (Array.isArray(getItems())) {
      const _sid = _spIdBase(sprint.id); // B-202606-008
      const spItems = getItems().filter(i => {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return i.sprint && i.sprint.startsWith(_sid) &&
          (t === 'R' || t === 'B' || t === 'T') &&
          i.status !== 'descartado';
      });
      countR = spItems.filter(i => (i.type || i.code.charAt(0)) === 'R').length;
      countT = spItems.filter(i => (i.type || i.code.charAt(0)) === 'T').length;
      countB = spItems.filter(i => (i.type || i.code.charAt(0)) === 'B').length;
      effort = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 0), 0);
    }

    const countParts = [];
    if (countR) countParts.push(`<span class="ssm-type ssm-type--r">${countR} R</span>`);
    if (countT) countParts.push(`<span class="ssm-type ssm-type--t">${countT} T</span>`);
    if (countB) countParts.push(`<span class="ssm-type ssm-type--b">${countB} B</span>`);
    const countsHtml = countParts.length ? countParts.join('') : '<span class="ssm-type ssm-type--empty">0 ítems</span>';

    // T3: campos editables — goal, scope, version_target
    const vt    = sprint.version_target || '';
    const goal  = sprint.goal  || '';
    const scope = sprint.scope || '';

    function _editableField(field, value, labelText) {
      const isEmpty   = !value;
      const valCls    = isEmpty ? 'ssm-field-value ssm-field-value--empty' : 'ssm-field-value';
      const valText   = isEmpty ? 'Sin definir — click para editar' : _escHtml(value);
      return `<div class="ssm-field" data-ssm-sprint="${_escHtml(sprint.id)}" data-ssm-field="${field}">
  <span class="ssm-field-label">${labelText}</span>
  <span class="${valCls}" tabindex="0" role="button" aria-label="Editar ${labelText} de ${sprint.id}">${valText}</span>
</div>`;
    }

    const fieldsHtml = isActive ? [
      _editableField('version_target', vt,    'Versión'),
      _editableField('goal',           goal,  'Goal'),
      _editableField('scope',          scope, 'Scope'),
    ].join('') : '';

    return `<div class="ssm-row" data-sprint-id="${_escHtml(sprint.id)}">
  <div class="ssm-row-top">
    <span class="ssm-row-id">${_escHtml(sprint.id)}</span>
    <span class="ssm-row-name">${_escHtml((sprint.label || sprint.name || sprint.id).replace(/^[A-Za-z]+-S-\d+\s*·?\s*/i, ''))}</span>
    <span class="ssm-badge ${statusBadgeCls}">${statusTxt}</span>
    <span class="ssm-counts">${countsHtml}</span>
    <span class="ssm-effort">effort ${effort}</span>
  </div>
  ${fieldsHtml ? `<div class="ssm-fields">${fieldsHtml}</div>` : ''}
</div>`;
  }).join('');

  container.innerHTML = rows;

  // T3: Event delegation para edición inline
  container.removeEventListener('click',   _ssmHandleEdit);
  container.removeEventListener('keydown', _ssmHandleEditKeydown);
  container.addEventListener('click',   _ssmHandleEdit);
  container.addEventListener('keydown', _ssmHandleEditKeydown);
}

// T3: activar edición al click en .ssm-field-value
function _ssmHandleEdit(e) {
  const valEl = e.target.closest('.ssm-field-value');
  if (!valEl) return;
  const fieldEl = valEl.closest('[data-ssm-field]');
  if (!fieldEl) return;
  // No abrir si ya hay input activo en esta celda
  if (fieldEl.querySelector('.ssm-edit-input, .ssm-edit-textarea')) return;

  const sprintId = fieldEl.dataset.ssmSprint;
  const field    = fieldEl.dataset.ssmField;
  _ssmOpenEdit(fieldEl, sprintId, field);
}

// T3: activar edición con Enter/Space desde .ssm-field-value (accesibilidad)
function _ssmHandleEditKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const valEl = e.target.closest('.ssm-field-value');
  if (!valEl) return;
  e.preventDefault();
  valEl.click();
}

// T3: abrir input/textarea in-place
function _ssmOpenEdit(fieldEl, sprintId, field) {
  const allSprints = getActiveSprints();
  const sprint     = allSprints ? allSprints.find(s => s.id === sprintId) : null;
  if (!sprint) return;

  const currentVal = field === 'version_target' ? (sprint.version_target || '')
                   : field === 'goal'            ? (sprint.goal  || '')
                   : field === 'scope'           ? (sprint.scope || '')
                   : '';

  const valEl = fieldEl.querySelector('.ssm-field-value, .ssm-field-value--empty');
  if (valEl) valEl.classList.add('is-hidden');

  let editEl;

  if (field === 'scope' || field === 'goal') {
    // Textarea para campos multilinea
    editEl = document.createElement('textarea');
    editEl.className = 'ssm-edit-textarea';
    editEl.value = currentVal;
    editEl.setAttribute('aria-label', `Editar ${field} de ${sprintId}`);
    editEl.rows = 2;
  } else {
    // Input text para version_target
    editEl = document.createElement('input');
    editEl.type = 'text';
    editEl.className = 'ssm-edit-input';
    editEl.value = currentVal;
    editEl.setAttribute('aria-label', `Editar ${field} de ${sprintId}`);
  }

  // AC-2/AC-3 T3: blur guarda, Enter guarda (solo en input — no en textarea)
  editEl.addEventListener('blur', function() {
    _ssmCommit(fieldEl, sprintId, field, editEl.value.trim(), currentVal);
  });
  editEl.addEventListener('keydown', function(ev) {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      _ssmCancel(fieldEl, currentVal);
    }
    if (ev.key === 'Enter' && editEl.tagName === 'INPUT') {
      ev.preventDefault();
      editEl.blur(); // dispara commit via blur
    }
  });

  fieldEl.appendChild(editEl);
  editEl.focus();
  if (editEl.tagName === 'INPUT') editEl.select();
}

// T3: persistir valor
function _ssmCommit(fieldEl, sprintId, field, newVal, oldVal) {
  // Ignorar si el editEl ya fue retirado (doble blur)
  if (!fieldEl.querySelector('.ssm-edit-input, .ssm-edit-textarea')) return;

  const allSprints = getActiveSprints();
  const sprint     = allSprints ? allSprints.find(s => s.id === sprintId) : null;
  if (!sprint) { _renderSprintSummaryTable(allSprints); return; }

  if (field === 'version_target') sprint.version_target = newVal || oldVal; // no permitir vacío
  if (field === 'goal')           sprint.goal  = newVal;
  if (field === 'scope')          sprint.scope = newVal;

  try {
    save();
    // AC-6 T3: micro-flash de confirmación
    _ssmFlash(fieldEl);
  } catch (err) {
    // AC-7 T3: save() falla → revertir y toast
    if (field === 'version_target') sprint.version_target = oldVal;
    if (field === 'goal')           sprint.goal  = oldVal;
    if (field === 'scope')          sprint.scope = oldVal;
    showToast('Error al guardar. Intenta de nuevo.', 'error');
  }

  // Re-renderizar la tabla para reflejar el nuevo valor
  _renderSprintSummaryTable(getActiveSprints());
}

// T3: cancelar — restaurar valor original
function _ssmCancel(fieldEl, originalVal) {
  const editEl = fieldEl.querySelector('.ssm-edit-input, .ssm-edit-textarea');
  if (editEl) editEl.remove();
  const valEl = fieldEl.querySelector('.ssm-field-value, .ssm-field-value--empty');
  if (valEl) valEl.classList.remove('is-hidden');
}

// T3 AC-6: micro-flash vía clase .item-status-confirmed
function _ssmFlash(fieldEl) {
  const valEl = fieldEl.querySelector('.ssm-field-value, .ssm-field-value--empty');
  if (!valEl) return;
  valEl.classList.add('item-status-confirmed');
  setTimeout(() => valEl.classList.remove('item-status-confirmed'), 800);
}

// ── END T-202606-002 / T-202606-003 ─────────────────────────────────────────

// ── T-202606-105: Banner de sprints activos en conflicto ─────────────────────

// Inyecta o elimina #sprint-conflict-banner antes del contenido principal del tab.
// AC: si _getConflictingSprints() retorna > 0 ítems → banner visible con lista de códigos.
//     si retorna 0 → banner ausente del DOM.
function _renderConflictBanner() {
  const BANNER_ID   = 'sprint-conflict-banner';
  const ANCHOR_ID   = 'sprint-panel-header'; // se inserta antes de este elemento
  const conflicts   = _getConflictingSprints();
  let banner        = document.getElementById(BANNER_ID);

  if (!conflicts.length) {
    // AC: 0 conflictos → banner ausente del DOM
    if (banner) banner.remove();
    return;
  }

  // Construir o reusar el banner
  if (!banner) {
    banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.className = 'sprint-conflict-banner';
  }

  // AC: formato '[nombre] · abierto [DD/MM/YYYY]' — startedAt nulo → 'fecha desconocida'
  function _fmtDate(ts) {
    if (!ts) return 'fecha desconocida';
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  const items = conflicts.map(s => `${s.label || s.name || s.id} · abierto ${_fmtDate(s.startedAt)}`).join('<br>');
  const count = conflicts.length;
  banner.innerHTML = `
    <span class="scb-icon">⚠</span>
    <span class="scb-text">${count} sprint${count > 1 ? 's' : ''} activo${count > 1 ? 's' : ''} simultáneamente — solo puede haber uno<br>
      <span class="scb-list">${items}</span>
    </span>
    <button class="scb-btn" type="button" data-scb-resolve>Resolver en sub-tab Sprints</button>
  `;

  // Insertar antes del anchor si no está ya en el DOM
  const anchor = document.getElementById(ANCHOR_ID);
  if (anchor && anchor.parentNode && !document.getElementById(BANNER_ID)) {
    anchor.parentNode.insertBefore(banner, anchor);
  } else if (!anchor && !document.getElementById(BANNER_ID)) {
    // Fallback: primer hijo del contenedor del tab Sprint
    const tabContainer = document.getElementById('sprint-tab-container') || document.getElementById('tab-sprint');
    if (tabContainer) tabContainer.prepend(banner);
  }

  // AC: delegación en el banner — listener único persistente, funciona en rerenders sucesivos.
  // innerHTML se actualiza en cada render → se re-asigna el delegador cada vez para
  // garantizar que el botón recién creado responde. El handler previo no acumula
  // porque se asigna a la propiedad onclick del banner (no addEventListener).
  banner.onclick = (e) => {
    if (e.target.closest('[data-scb-resolve]')) _sptSwitch('sprints');
  };
}

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

  // T-202606-105: banner de conflicto — sprints activos simultáneos
  _renderConflictBanner();

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
    _sptSwitch(_sptActiveSubtab, _spEl('spt-tab-' + _sptActiveSubtab), true); // B-202606-065: usa estado persistido — no lee DOM. true = skip items render (renderSprintTab lo hace directamente)
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

    // T-202606-130: badge 'Pendiente aprobación' — visible solo cuando formallyOpened === false
    const pendingBadge = _spEl('sph-pending-badge');
    if (pendingBadge) {
      const isPending = sprint.formallyOpened === false;
      pendingBadge.classList.toggle('is-hidden', !isPending);
    }

    // B-202606-064: botón 'Aprobar apertura' eliminado — aprobación ocurre via Step 0 del DIFF
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
  if (!Array.isArray(getItems())) return null;
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

  // T-202606-106 AC-4/5/6: si hay sprint active distinto → diálogo de confirmación 1-click
  const activoDistinto = getActiveSprints().find(s =>
    s.status === 'active' && s.id !== sprint.id && !s.isHotfix
  );

  if (activoDistinto) {
    // AC-4: mostrar diálogo con ambos nombres antes de ejecutar
    _gconfirmOpen({
      title: 'Reactivar sprint',
      msg: `Cerrar “${activoDistinto.label || activoDistinto.id}” y activar “${sprint.label || sprint.id}”`,
      okLabel: 'Confirmar',
      danger: false
    }, () => {
      // AC-5: founder confirma — cerrar activo primero, luego activar
      setSprintStatus(activoDistinto.id, 'closed');
      setSprintStatus(sprint.id, 'active');
      renderSprintTab();
    });
    // AC-6: founder cancela — _gconfirmOpen no llama el callback — sin modificación
    return;
  }

  // Sin sprint activo distinto — flujo normal
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

// ── T-202606-038: Sprint HOTFIX persistente ───────────────────────────────
//
// ensureHotfixSprint(projId) — crea el sprint [Prefix]-S-HOTFIX para el proyecto
// si no existe. Idempotente: si ya existe no hace nada.
// El prefix se deriva de los sprints existentes del proyecto, o de projId como fallback.
//
// Condiciones del sprint HOTFIX creado:
//   - id:              [Prefix]-S-HOTFIX
//   - label:           [Prefix]-S-HOTFIX
//   - status:          active
//   - version_target:  n/a  (única excepción a la regla dura — BR-Core §6)
//   - projId:          projId recibido
//   - isHotfix:        true  (flag interno — protege de cierre normal)
//
export function ensureHotfixSprint(projId) {
  if (!projId) return;

  const proj = getProjectById(projId);
  if (!proj) return;
  if (!Array.isArray(proj.sprints)) proj.sprints = [];

  // Prefix: campo proj.prefix es la fuente de verdad. Fallback: derivar de sprints existentes,
  // luego projId en mayúsculas.
  let prefix = (proj.prefix || '').toUpperCase();
  if (!prefix && proj.sprints.length) {
    const parts = proj.sprints[0].id.split('-S-');
    if (parts.length >= 2) prefix = parts[0];
  }
  if (!prefix) prefix = projId.toUpperCase();

  const hotfixId = prefix + '-S-HOTFIX';

  // Idempotente — si ya existe no hacer nada
  if (proj.sprints.some(s => s.id === hotfixId)) return;

  const hasCurrentSprint = proj.sprints.some(s => s.status === 'active' && s.current === true);

  proj.sprints.push({
    id: hotfixId,
    label: hotfixId,
    status: 'active',
    version_target: 'n/a',
    isHotfix: true,
    projId,
    current: !hasCurrentSprint ? true : undefined,
    formallyOpened: false,
    createdAt: Date.now(),
  });
  save();
}

// Crea el sprint HOTFIX del proyecto activo desde la UI (botón 1-tap)
function _spmCreateHotfix() {
  const projId = _getActiveProjectFilter();
  const proj   = projId ? getProjectById(projId) : null;

  if (!proj) {
    showToast('info', 'No hay proyecto activo para crear el sprint HOTFIX.');
    return;
  }

  const prefix   = (proj.prefix || projId.toUpperCase());
  const hotfixId = prefix + '-S-HOTFIX';

  if ((proj.sprints || []).some(s => s.id === hotfixId)) {
    showToast('info', `${hotfixId} ya existe.`);
    return;
  }

  ensureHotfixSprint(projId);
  showToast('success', `Sprint ${hotfixId} creado.`);
  renderSprintTab();
}
// ── END T-202606-038 ─────────────────────────────────────────────────────

// ── T-202606-038 T5: _renderSpsHotfix — card persistente HOTFIX en sub-tab Sprints ──
//
// Renderiza en #sps-hotfix una card siempre visible con los Bs priority:high
// en status pendiente o en-revision del sprint S-HOTFIX del proyecto activo.
// La card nunca se oculta — muestra 'Sin bugs críticos activos' cuando no hay ítems.
// Clic en una fila de B abre el Item Editor (#item-editor-overlay) via openItemPanel.

function _renderSpsHotfix() {
  const container = document.getElementById('sps-hotfix');
  if (!container) return;

  // Localizar sprint HOTFIX del proyecto activo
  const allSprints = getActiveSprints();
  const hotfixSprint = allSprints ? allSprints.find(s => s.isHotfix === true) : null;

  // Bs activos: priority high + sprint S-HOTFIX + status pendiente o en-revision
  let activeBugs = [];
  if (hotfixSprint && Array.isArray(getItems())) {
    const _hsid = _spIdBase(hotfixSprint.id);
    activeBugs = getItems().filter(i => {
      const t = i.type || (i.code ? i.code.charAt(0) : '');
      return t === 'B' &&
        i.priority === 'high' &&
        i.sprint && i.sprint.startsWith(_hsid) &&
        (i.status === 'pendiente' || i.status === 'en-revision');
    });
  }

  // Filas de bugs o mensaje vacío
  let bodyHtml;
  if (activeBugs.length === 0) {
    bodyHtml = '<p class="sps-hotfix-empty">Sin bugs críticos activos</p>';
  } else {
    const rows = activeBugs.map(b =>
      '<div class="sps-hotfix-row" data-item-code="' + _escHtml(b.code) + '" tabindex="0" role="button" aria-label="Abrir ' + _escHtml(b.code) + '">' +
        '<span class="sps-hotfix-code">' + _escHtml(b.code) + '</span>' +
        '<span class="sps-hotfix-title">' + _escHtml(b.title || '') + '</span>' +
        '<span class="sps-hotfix-status">' + _escHtml(b.status) + '</span>' +
      '</div>'
    ).join('');
    bodyHtml = '<div class="sps-hotfix-list">' + rows + '</div>';
  }

  const sprintLabel = hotfixSprint ? _escHtml(hotfixSprint.id) : 'S-HOTFIX';

  container.innerHTML =
    '<div class="sps-card sps-card--hotfix">' +
      '<div class="sps-header">' +
        '<span class="sps-title">' + sprintLabel + ' · Sprint persistente</span>' +
        '<span class="sml-badge sprint-badge-hotfix">HOTFIX</span>' +
      '</div>' +
      bodyHtml +
    '</div>';

  // Event delegation — clic y teclado en filas de B
  container.removeEventListener('click', _spsHotfixHandleClick);
  container.addEventListener('click', _spsHotfixHandleClick);
  container.removeEventListener('keydown', _spsHotfixHandleKeydown);
  container.addEventListener('keydown', _spsHotfixHandleKeydown);
}

function _spsHotfixHandleClick(e) {
  const row = e.target.closest('[data-item-code]');
  if (row) openItemPanel(row.dataset.itemCode);
}

function _spsHotfixHandleKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const row = e.target.closest('[data-item-code]');
  if (row) {
    e.preventDefault();
    openItemPanel(row.dataset.itemCode);
  }
}
// ── END T-202606-038 T5 ──────────────────────────────────────────────────

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

  // AC-5: HOTFIX — oculto si el sprint HOTFIX del proyecto ya existe (T-202606-038)
  const btnHotfix = document.getElementById('spm-btn-hotfix');
  if (btnHotfix) {
    const projId = _getActiveProjectFilter();
    const proj   = projId ? getProjectById(projId) : null;
    const prefix = proj ? (proj.prefix || projId.toUpperCase()) : null;
    const hotfixId = prefix ? prefix + '-S-HOTFIX' : null;
    const exists = (proj && hotfixId) ? (proj.sprints || []).some(s => s.id === hotfixId) : false;
    btnHotfix.classList.toggle('is-hidden', !proj || exists);
  }

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

  // T-202606-006 T3: listener para sprint:switch-subtab — reemplaza window._sptSwitch en planificacion
  window.addEventListener('sprint:switch-subtab', function(e) {
    const { subtab, triggerBtn } = (e.detail || {});
    if (subtab) _sptSwitch(subtab, triggerBtn || null);
  });

  // T-202605-051: Event delegation en #sprint-items-list para ítems generados dinámicamente
  const itemsList = document.getElementById('sprint-items-list');
  if (itemsList) {
    // B-202606-006 AC-4: toggle colapso/expansión de grupo R — debe evaluarse antes de data-item-code
    itemsList.addEventListener('click', function(e) {
      const toggle = e.target.closest('[data-r-toggle]');
      if (!toggle) return;
      const code     = toggle.dataset.rToggle;
      const children = document.getElementById('spi-r-children-' + code);
      if (!children) return;
      const expanded = toggle.getAttribute('aria-expanded') !== 'false';
      children.classList.toggle('is-hidden', expanded);
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    itemsList.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const toggle = e.target.closest('[data-r-toggle]');
      if (!toggle) return;
      e.preventDefault();
      toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
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

  // B-202606-064: listeners de botón 'Aprobar apertura' y modal eliminados
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

// B-202606-024: window._sptSwitch · window.setSprintCurrent eliminados — no hay consumidores en HTML ni window.*

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

  // spm-btn-hotfix → _spmCreateHotfix() — T-202606-038
  const spmHotfix = document.getElementById('spm-btn-hotfix');
  if (spmHotfix) spmHotfix.addEventListener('click', function () {
    if (typeof _spmCreateHotfix === 'function') _spmCreateHotfix();
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
    openNewSprintInline();
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
