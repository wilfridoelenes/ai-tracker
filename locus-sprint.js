// [PP] v0.2.0 · sprint:PP-S-03 · mod:40 · autor:Rune · 2026-06-15 UTC-6
// locus-sprint.js
// Módulo: Orquestador del tab Sprint — renderSprintTab, _renderSprintItems, _renderSprintWorkers, _renderSprintScopeAdded, _sptSwitch, _renderSprintPlanificar

import { _isBlocked, getItems} from './locus-backlog-core.js';
import { openItemPanel } from './locus-backlog-panel.js';
import { _renderPlanningView, _attachPlanCloseHandler, _attachPlanViewDelegation } from './locus-sprint-planificacion.js';
import { _getActiveSprint, confirmCloseSprint, createSprint, createSprintFromGroup, openSprintRetroView, setSprintStatus, openNewSprintInline, _getConflictingSprints } from './locus-backlog-sprints.js'; // T-202606-089 AC-3 · T-202606-105
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
  // T-202606-042: ocultar header en sub-tab Sprints, visible en Ítems/Planificar/Plan
  const _sphHeader = document.getElementById('sprint-panel-header');
  if (_sphHeader) _sphHeader.classList.toggle('is-hidden', subtab === 'sprints');
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
    _renderSpsActivo(); // T-202606-036
    _renderSpsProgramados(); // T-202606-037
    _renderSpsPausados(); // T-202606-041
    _renderSpsHotfix(); // T-202606-038
    _renderSpsCerrados(); // T-202606-039
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

// Helper: escapar HTML para valores en innerHTML
function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── T-202606-XXX: _spsFieldEdit — edit inline click-directo en sub-tab Sprints ──
//
// Convierte un elemento de texto (.sps-meta-value, .sps-scheduled-name) en un
// <input> inline. blur/Enter → commit. Escape → cancelar. Muta sprint en getActiveSprints()
// para persistir. Renderiza la sección correspondiente al confirmar.
//
// @param {Element}  el         — elemento de texto a convertir
// @param {string}   sprintId   — ID del sprint a editar
// @param {string}   field      — clave del campo ('label' | 'version_target' | 'release_type' | 'goal')
// @param {Function} onDone     — callback post-commit/cancel → re-render del contenedor
// @param {Object}   [opts]     — { inputType: 'text'|'select', options: [{v,t}] }

function _spsFieldEdit(el, sprintId, field, onDone, opts) {
  if (el.dataset.spsEditing === '1') return;
  el.dataset.spsEditing = '1';

  const original = el.textContent;
  const isSelect = opts && opts.inputType === 'select';
  let input;

  if (isSelect) {
    input = document.createElement('select');
    input.className = 'sps-field-input sps-field-select';
    (opts.options || []).forEach(function(o) {
      const opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.t;
      if (o.v === original || o.t === original) opt.selected = true;
      input.appendChild(opt);
    });
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'sps-field-input';
    input.value = original === '—' ? '' : original;
  }

  el.style.display = 'none';
  el.parentNode.insertBefore(input, el.nextSibling);
  input.focus();
  if (!isSelect) input.select();

  let committed = false;

  function _commit() {
    if (committed) return;
    committed = true;
    const newVal = isSelect ? input.value : input.value.trim();
    input.remove();
    el.style.display = '';
    delete el.dataset.spsEditing;
    if (newVal && newVal !== original && newVal !== '—') {
      const sp = getActiveSprints().find(function(s) { return s.id === sprintId; });
      if (sp) {
        // label: reconstruir canónico 'ID · Nombre descriptivo' — patrón de confirmEditSprint
        if (field === 'label') {
          sp.label = sprintId + ' · ' + newVal;
        } else {
          sp[field] = newVal;
        }
        try {
          save();
          showToast('Sprint actualizado.', 'success');
        } catch (err) {
          showToast('Error al guardar. Intenta de nuevo.', 'error');
        }
      }
    }
    onDone();
  }

  function _cancel() {
    if (committed) return;
    committed = true;
    input.remove();
    el.style.display = '';
    delete el.dataset.spsEditing;
    // sin save — solo re-render para limpiar estado visual
    onDone();
  }

  input.addEventListener('blur', _commit);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); input.removeEventListener('blur', _commit); _cancel(); }
  });
}

// ── END T-202606-XXX ─────────────────────────────────────────────────────────

// ── T-202606-036 / T-202606-043: _renderSpsActivo — card del sprint activo ──
//
// T-202606-043: rediseño — card-header con menú ··· (Pausar · sep · Cerrar rojo),
// meta-grid (versión · release · goal), barra done/total.
// Sin botones inline. Sin edición inline de campos.
// Empty state con CTA si no hay sprint activo.

function _renderSpsActivo() {
  const container = document.getElementById('sps-activo');
  if (!container) return;

  const sprint = _getActiveSprint();

  if (!sprint) {
    container.innerHTML =
      '<span class="sps-section-label">Activo</span>' +
      '<div class="sps-empty">' +
        '<p>No hay sprint activo.</p>' +
        '<button class="sps-empty-cta" type="button">Crear sprint</button>' +
      '</div>';
    const cta = container.querySelector('.sps-empty-cta');
    if (cta) cta.addEventListener('click', function() { openNewSprintInline(); });
    return;
  }

  const id    = sprint.id || '';
  const label = sprint.label || sprint.name || '';
  const vt    = sprint.version_target || '—';
  const rt    = sprint.release_type || sprint.releaseType || '—';
  const goal  = sprint.goal || '—';

  // Burndown — ítems done/total (R/B/T, sin descartados)
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

  container.innerHTML =
    '<span class="sps-section-label">Activo</span>' +
    '<div class="sps-card" data-sprint-id="' + _escHtml(id) + '">' +
      '<div class="sps-card-header">' +
        '<span class="sps-card-id font-mono">' + _escHtml(id) + '</span>' +
        '<span class="sps-card-title sps-meta-editable" tabindex="0" title="Click para editar título">' + _escHtml(label) + '</span>' +
        '<span class="sml-badge sprint-badge-active">Activo</span>' +
        '<div class="sps-menu-wrap">' +
          '<button class="sps-btn-menu" type="button" aria-label="Acciones del sprint activo" aria-expanded="false" aria-haspopup="true" data-sps-activo-menu>···</button>' +
          '<div class="sps-dropdown" role="menu" aria-label="Acciones sprint activo" hidden>' +
            '<button class="sps-dropdown-item" role="menuitem" type="button" data-sps-action="pausar">Pausar sprint</button>' +
            '<hr style="margin:4px 0;border:none;border-top:1px solid var(--border)">' +
            '<button class="sps-dropdown-item sps-dropdown-item--danger" role="menuitem" type="button" data-sps-action="cerrar">Cerrar sprint</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sps-meta">' +
        '<div class="sps-meta-item"><span class="sps-meta-label">Versión</span><span class="sps-meta-value sps-meta-editable" tabindex="0" title="Click para editar">' + _escHtml(vt) + '</span></div>' +
        '<div class="sps-meta-item"><span class="sps-meta-label">Release</span><span class="sps-meta-value sps-meta-editable" tabindex="0" title="Click para editar">' + _escHtml(rt) + '</span></div>' +
        '<div class="sps-meta-item sps-meta-item--goal"><span class="sps-meta-label">Goal</span><span class="sps-meta-value sps-meta-editable" tabindex="0" title="Click para editar">' + _escHtml(goal) + '</span></div>' +
      '</div>' +
      '<div class="sps-progress-wrap">' +
        '<div class="sps-burndown-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso del sprint: ' + done + ' de ' + total + ' ítems done">' +
          '<div class="sps-burndown-fill"></div>' +
        '</div>' +
        '<span class="sps-burndown-label">' + done + ' / ' + total + ' ítems done</span>' +
      '</div>' +
    '</div>';

  // CSS Purity: variable de progreso via setProperty
  const fillEl = container.querySelector('.sps-burndown-fill');
  if (fillEl) fillEl.style.setProperty('--sps-burndown-pct', pct + '%');

  // Menú ···
  container.removeEventListener('click', _spsActivoHandleClick);
  container.addEventListener('click', _spsActivoHandleClick);
  container.removeEventListener('keydown', _spsActivoHandleKeydown);
  container.addEventListener('keydown', _spsActivoHandleKeydown);
}

function _spsActivoHandleKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const editable = e.target.closest('.sps-meta-editable');
  if (editable) { e.preventDefault(); editable.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
}

function _spsActivoHandleClick(e) {
  // Edit inline — click en .sps-meta-value
  // Campos editables: Versión (version_target), Release (release_type), Goal (goal)
  // El campo Título (label) se edita haciendo click en .sps-card-title
  const metaVal = e.target.closest('.sps-meta-value, .sps-card-title');
  if (metaVal && !e.target.closest('[data-sps-activo-menu]') && !e.target.closest('.sps-dropdown')) {
    const sprint = _getActiveSprint();
    if (!sprint) return;

    const metaItem = metaVal.closest('.sps-meta-item');
    const isTitle  = metaVal.classList.contains('sps-card-title');
    let field, opts;

    if (isTitle) {
      field = 'label';
    } else if (metaItem) {
      const label = metaItem.querySelector('.sps-meta-label');
      const labelTxt = label ? label.textContent.trim() : '';
      if (labelTxt === 'Versión')  { field = 'version_target'; }
      else if (labelTxt === 'Release') {
        field = 'release_type';
        opts = { inputType: 'select', options: [
          { v: 'Major', t: 'Major' },
          { v: 'Minor', t: 'Minor' },
          { v: 'Patch', t: 'Patch' },
        ]};
      } else if (labelTxt === 'Goal') { field = 'goal'; }
    }

    if (field) {
      _spsFieldEdit(metaVal, sprint.id, field, function() { _renderSpsActivo(); }, opts);
      return;
    }
  }

  // Toggle menú
  const menuBtn = e.target.closest('[data-sps-activo-menu]');
  if (menuBtn) {
    const dropdown = menuBtn.nextElementSibling;
    if (!dropdown) return;
    const isOpen = !dropdown.hidden;
    dropdown.hidden = isOpen;
    menuBtn.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) {
      // Cerrar al hacer clic fuera
      function _closeOnOutside(ev) {
        if (!menuBtn.closest('.sps-menu-wrap').contains(ev.target)) {
          dropdown.hidden = true;
          menuBtn.setAttribute('aria-expanded', 'false');
          document.removeEventListener('click', _closeOnOutside, true);
        }
      }
      setTimeout(function() {
        document.addEventListener('click', _closeOnOutside, true);
      }, 0);
    }
    return;
  }

  // Acciones del menú
  const action = e.target.closest('[data-sps-action]');
  if (action) {
    // Cerrar menú
    const dropdown = action.closest('.sps-dropdown');
    if (dropdown) { dropdown.hidden = true; }
    const menuWrap = action.closest('.sps-menu-wrap');
    if (menuWrap) {
      const btn = menuWrap.querySelector('[data-sps-activo-menu]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    const act    = action.getAttribute('data-sps-action');
    const sprint = _getActiveSprint();
    if (!sprint) return;
    if (act === 'pausar') {
      const newStatus = sprint.status === 'pausado' ? 'active' : 'pausado';
      setSprintStatus(sprint.id, newStatus);
      _renderSpsActivo();
    } else if (act === 'cerrar') {
      confirmCloseSprint(sprint.id);
    }
  }
}

// ── END T-202606-036 / T-202606-043 ──────────────────────────────────────────

// ── T-202606-037 / T-202606-043: _renderSpsProgramados ──────────────────────
//
// T-202606-043: rediseño — section-label, una card contenedora, una fila por
// sprint programado con: drag-handle · ID · título · .pill-prog · badge
// adelantados (.pill-adv / .pill-adv-zero) · menú ··· · .sps-bd-mini ·
// conteo done/total. Sin botón inline de descartar.
// Empty state 'Sin sprints programados' si no hay programados.

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

function _renderSpsProgramados() {
  const container = document.getElementById('sps-programados');
  if (!container) return;

  const sprints = _getProgramadosSprints();

  if (sprints.length === 0) {
    container.innerHTML =
      '<span class="sps-section-label">Programados</span>' +
      '<div class="sps-scheduled-empty">Sin sprints programados</div>';
    container.removeEventListener('click', _sppHandleClick);
    return;
  }

  const rows = sprints.map(function(s) {
    const id    = s.id || '';
    const label = s.label || s.name || id;

    // Conteo done/total de ítems del sprint programado
    let total = 0;
    let done  = 0;
    let advDone = 0; // ítems ya done en un sprint programado = adelantados
    if (Array.isArray(getItems())) {
      const _sid = _spIdBase(id);
      const spItems = getItems().filter(function(i) {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return i.sprint && i.sprint.startsWith(_sid) &&
          (t === 'R' || t === 'B' || t === 'T') &&
          i.status !== 'descartado';
      });
      total   = spItems.length;
      done    = spItems.filter(function(i) { return i.status === 'done'; }).length;
      advDone = done; // en sprint programado, todo done es trabajo adelantado
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const advClass = advDone > 0 ? 'pill-adv' : 'pill-adv-zero';
    const advText  = advDone + ' adelantados';

    return '<div class="sps-scheduled-row" draggable="false" data-sprint-id="' + _escHtml(id) + '">' +
        '<span class="drag-handle" tabindex="0" role="button" aria-label="Reordenar sprint ' + _escHtml(id) + '"></span>' +
        '<span class="sps-scheduled-id font-mono">' + _escHtml(id) + '</span>' +
        '<span class="sps-scheduled-name sps-meta-editable" tabindex="0" title="Click para editar título">' + _escHtml(label) + '</span>' +
        '<span class="pill-prog">Programado</span>' +
        '<span class="' + advClass + '">' + advText + '</span>' +
        '<div class="sps-menu-wrap">' +
          '<button class="sps-btn-menu" type="button" aria-label="Acciones sprint ' + _escHtml(id) + '" aria-expanded="false" aria-haspopup="true" data-spp-menu>···</button>' +
          '<div class="sps-dropdown" role="menu" aria-label="Acciones ' + _escHtml(id) + '" hidden>' +
            '<button class="sps-dropdown-item sps-dropdown-item--danger" role="menuitem" type="button" data-spp-action="descartar">Descartar sprint</button>' +
          '</div>' +
        '</div>' +
        '<div class="sps-bd-mini" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + _escHtml(id) + ': ' + done + ' de ' + total + ' done">' +
          '<div class="sps-bd-mini-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<span class="sps-scheduled-count">' + done + ' / ' + total + '</span>' +
      '</div>';
  }).join('');

  container.innerHTML =
    '<span class="sps-section-label">Programados</span>' +
    '<div class="sps-card">' + rows + '</div>';

  container.removeEventListener('click', _sppHandleClick);
  container.addEventListener('click', _sppHandleClick);
  container.removeEventListener('keydown', _sppHandleKeydown);
  container.addEventListener('keydown', _sppHandleKeydown);

  _sppAttachDrag(container);
}

function _sppHandleKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const editable = e.target.closest('.sps-meta-editable');
  if (editable) { e.preventDefault(); editable.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
}

function _sppHandleClick(e) {
  // Edit inline — click en .sps-scheduled-name (título del sprint programado)
  const nameEl = e.target.closest('.sps-scheduled-name');
  if (nameEl && !e.target.closest('.sps-menu-wrap')) {
    const row = nameEl.closest('.sps-scheduled-row');
    const sprintId = row ? row.getAttribute('data-sprint-id') : null;
    if (!sprintId) return;
    _spsFieldEdit(nameEl, sprintId, 'label', function() { _renderSpsProgramados(); });
    return;
  }

  // Toggle menú ···
  const menuBtn = e.target.closest('[data-spp-menu]');
  if (menuBtn) {
    const dropdown = menuBtn.nextElementSibling;
    if (!dropdown) return;
    const isOpen = !dropdown.hidden;
    dropdown.hidden = isOpen;
    menuBtn.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) {
      function _closeOnOutside(ev) {
        if (!menuBtn.closest('.sps-menu-wrap').contains(ev.target)) {
          dropdown.hidden = true;
          menuBtn.setAttribute('aria-expanded', 'false');
          document.removeEventListener('click', _closeOnOutside, true);
        }
      }
      setTimeout(function() {
        document.addEventListener('click', _closeOnOutside, true);
      }, 0);
    }
    return;
  }

  // Acción descartar desde menú
  const discardBtn = e.target.closest('[data-spp-action="descartar"]');
  if (discardBtn) {
    // Cerrar menú
    const dropdown = discardBtn.closest('.sps-dropdown');
    if (dropdown) { dropdown.hidden = true; }
    const menuWrap = discardBtn.closest('.sps-menu-wrap');
    if (menuWrap) {
      const btn = menuWrap.querySelector('[data-spp-menu]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    const row = discardBtn.closest('.sps-scheduled-row');
    const id  = row ? row.getAttribute('data-sprint-id') : null;
    const sprint = getActiveSprints().find(function(s) { return s.id === id; });
    if (!sprint) return;

    const labelText = sprint.label || sprint.name || sprint.id;
    _gconfirmOpen({
      title: 'Descartar sprint',
      msg: 'Se descartará el sprint "' + labelText + '". Esta acción no se puede deshacer.',
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
}

// ── END T-202606-037 / T-202606-043 ──────────────────────────────────────────

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
  if (bdLabel) bdLabel.textContent = `${done.length} / ${total}`; // T-202606-042: ítems done / total (no effort)
  if (bdTrack) {
    bdTrack.setAttribute('aria-valuenow', pct);
    bdTrack.setAttribute('aria-valuetext', `${pct}% completado`);
  }

  // T-202606-042: bloque btnClose eliminado — #btn-close-sprint removido del HTML. Acción vive en .sps-actions (sub-tab Sprints)
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

// ── T-202606-002: Resumen agregado de sprints normales ──────────────────────
//
// Lista todos los sprints normales (isHotfix falsy) con id, nombre, status badge,
// conteo R/T/B, effort total. Escribe en #sprint-summary-list. Solo lectura —
// edición de campos de sprint vive en sub-tab Sprints (_renderSpsActivo /
// _renderSpsProgramados).

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

    return `<div class="ssm-row" data-sprint-id="${_escHtml(sprint.id)}">
  <div class="ssm-row-top">
    <span class="ssm-row-id">${_escHtml(sprint.id)}</span>
    <span class="ssm-row-name">${_escHtml((sprint.label || sprint.name || sprint.id).replace(/^[A-Za-z]+-S-\d+\s*·?\s*/i, ''))}</span>
    <span class="ssm-badge ${statusBadgeCls}">${statusTxt}</span>
    <span class="ssm-counts">${countsHtml}</span>
    <span class="ssm-effort">effort ${effort}</span>
  </div>
</div>`;
  }).join('');

  container.innerHTML = rows;

}
// ── END T-202606-002 ─────────────────────────────────────────────────────────

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
  }

  // Header — T-202606-042: remove is-hidden base antes de _sptSwitch para que el toggle por subtab tenga la última palabra
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

  // T-202606-042: _sptSwitch después de header.classList.remove — el toggle de subtab tiene la última palabra sobre visibilidad del header
  _sptSwitch(_sptActiveSubtab, _spEl('spt-tab-' + _sptActiveSubtab), true); // B-202606-065: usa estado persistido — no lee DOM. true = skip items render (renderSprintTab lo hace directamente)

  // Gestor de sprints — T-202605-123
  _renderSprintManager();

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


// ── T-202606-041: _renderSpsPausados — sección sprints pausados ──────────────
//
// Renderiza en #sps-pausados una card por sprint con status 'paused' e isHotfix falsy.
// Si no hay pausados: innerHTML vacío + display:none — no ocupa espacio visual.
// Si hay pausados tras haber estado oculto: display:'' restaura visibilidad.
// Excluye isHotfix:true aunque tengan status 'paused'.

function _renderSpsPausados() {
  const container = document.getElementById('sps-pausados');
  if (!container) return;

  const allSprints = getActiveSprints();
  const paused = allSprints
    ? allSprints.filter(s => s.status === 'paused' && !s.isHotfix)
    : [];

  // AC-4/AC-5: sin pausados → ocultar contenedor sin empty state
  if (paused.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  // AC-3/AC-5: hay pausados → restaurar visibilidad
  container.style.display = '';

  const cards = paused.map(function(s) {
    const label = s.label || s.name || s.id || '';
    const pausedDate = s.pausedAt || s.createdAt
      ? new Date(s.pausedAt || s.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

    return (
      '<div class="sps-card sps-card--paused">' +
        '<div class="sps-header">' +
          '<span class="sps-title">' + _escHtml(s.id || '') + ' · ' + _escHtml(label) + '</span>' +
          '<span class="sml-badge sml-badge--paused">PAUSADO</span>' +
        '</div>' +
        '<div class="sps-pausados-meta">' +
          '<span class="sps-pausados-date">Pausado: ' + pausedDate + '</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML = cards;
}
// ── END T-202606-041 ─────────────────────────────────────────────────────────

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
    '<span class="sps-section-label">Hotfix</span>' +
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

// ── T-202606-039: _renderSpsCerrados — lista colapsada de sprints cerrados con retro inline ──
//
// Renderiza en #sps-cerrados todos los sprints cerrados ordenados por closedAt desc.
// Cada fila es colapsable — clic expande retro inline (patrón 0fr→1fr).
// Exactamente un sprint expandido en todo momento. Clic en fila ya expandida colapsa.
// Sin ítems: muestra empty state inline — la sección no desaparece.
// Retro: contenido de sprint.retroDoc (texto plano, solo lectura). Sin retroDoc → 'Retro no disponible'.

let _spsCerradosExpanded = null; // ID del sprint actualmente expandido

function _renderSpsCerrados() {
  const container = document.getElementById('sps-cerrados');
  if (!container) return;

  const allSprints = getActiveSprints();
  const closed = allSprints
    ? allSprints
        .filter(s => s.status === 'closed' && !s.isHotfix)
        .sort((a, b) => (b.closedAt || b.createdAt || 0) - (a.closedAt || a.createdAt || 0))
    : [];

  // AC-2: empty state inline — sección no desaparece
  if (closed.length === 0) {
    container.innerHTML =
      '<span class="sps-section-label">Cerrados</span>' +
      '<div class="sps-card"><p class="sps-cerrados-empty">Sin sprints cerrados</p></div>';
    container.removeEventListener('click', _spsCerradosHandleClick);
    _spsCerradosExpanded = null;
    return;
  }

  // Calcular conteos done/migrado/descartado desde getItems()
  const rows = closed.map(sprint => {
    const _sid = _spIdBase(sprint.id);
    let doneCnt = 0, migradoCnt = 0, descartadoCnt = 0;
    if (Array.isArray(getItems())) {
      const spItems = getItems().filter(i => {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return i.sprint && i.sprint.startsWith(_sid) &&
          (t === 'R' || t === 'B' || t === 'T');
      });
      doneCnt       = spItems.filter(i => i.status === 'done' || i.status === 'historico').length;
      migradoCnt    = spItems.filter(i => i.status === 'pendiente' || i.status === 'en-revision').length;
      descartadoCnt = spItems.filter(i => i.status === 'descartado').length;
    }

    const label = sprint.label || sprint.name || sprint.id || '';
    const closedDate = sprint.closedAt
      ? new Date(sprint.closedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

    const isExpanded = _spsCerradosExpanded === sprint.id;

    // Contenido de retro — texto plano, sin inputs
    const retroContent = sprint.retroDoc
      ? _escHtml(sprint.retroDoc)
      : 'Retro no disponible';

    return (
      '<div class="sps-cerrados-row' + (isExpanded ? ' is-expanded' : '') + '" data-sprint-id="' + _escHtml(sprint.id) + '">' +
        '<div class="sps-cerrados-header" role="button" tabindex="0" aria-expanded="' + isExpanded + '" aria-controls="sps-cerrados-retro-' + _escHtml(sprint.id) + '">' +
          '<span class="sps-cerrados-id">' + _escHtml(sprint.id) + '</span>' +
          '<span class="sps-cerrados-label">' + _escHtml(label) + '</span>' +
          '<span class="sps-cerrados-date">' + closedDate + '</span>' +
          '<span class="pill-closed">Cerrado</span>' +
          '<span class="sps-cerrados-counts">' +
            '<span class="sps-count-done">' + doneCnt + ' done</span>' +
            '<span class="sps-count-migrado">' + migradoCnt + ' migrado</span>' +
            '<span class="sps-count-descartado">' + descartadoCnt + ' desc.</span>' +
          '</span>' +
          '<span class="sps-cerrados-chevron" aria-hidden="true">' + (isExpanded ? '▲' : '▼') + '</span>' +
        '</div>' +
        '<div class="sps-cerrados-retro" id="sps-cerrados-retro-' + _escHtml(sprint.id) + '" style="display:grid;grid-template-rows:' + (isExpanded ? '1fr' : '0fr') + '">' +
          '<div class="sps-cerrados-retro-inner" style="overflow:hidden">' +
            '<pre class="sps-cerrados-retro-body">' + retroContent + '</pre>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML =
    '<span class="sps-section-label">Cerrados</span>' +
    '<div class="sps-card">' + rows + '</div>';

  // Event delegation — clic y teclado en headers
  container.removeEventListener('click', _spsCerradosHandleClick);
  container.addEventListener('click', _spsCerradosHandleClick);
  container.removeEventListener('keydown', _spsCerradosHandleKeydown);
  container.addEventListener('keydown', _spsCerradosHandleKeydown);
}

function _spsCerradosHandleClick(e) {
  const header = e.target.closest('.sps-cerrados-header');
  if (!header) return;
  const row = header.closest('[data-sprint-id]');
  if (!row) return;
  _spsCerradosToggle(row.dataset.sprintId);
}

function _spsCerradosHandleKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const header = e.target.closest('.sps-cerrados-header');
  if (!header) return;
  const row = header.closest('[data-sprint-id]');
  if (!row) return;
  e.preventDefault();
  _spsCerradosToggle(row.dataset.sprintId);
}

// AC-3/AC-4: toggle — exactamente un sprint expandido, colapsar anterior antes de expandir nuevo
function _spsCerradosToggle(sprintId) {
  const container = document.getElementById('sps-cerrados');
  if (!container) return;

  const prev = _spsCerradosExpanded;
  const next = prev === sprintId ? null : sprintId;

  // Colapsar anterior
  if (prev) {
    const prevRow = container.querySelector('[data-sprint-id="' + prev + '"]');
    if (prevRow) {
      const prevRetro  = prevRow.querySelector('.sps-cerrados-retro');
      const prevHeader = prevRow.querySelector('.sps-cerrados-header');
      const prevChevron = prevRow.querySelector('.sps-cerrados-chevron');
      if (prevRetro)  prevRetro.style.gridTemplateRows = '0fr';
      if (prevHeader) prevHeader.setAttribute('aria-expanded', 'false');
      if (prevChevron) prevChevron.textContent = '▼';
      prevRow.classList.remove('is-expanded');
    }
  }

  // Expandir nuevo (si es distinto al anterior)
  if (next) {
    const nextRow = container.querySelector('[data-sprint-id="' + next + '"]');
    if (nextRow) {
      const nextRetro  = nextRow.querySelector('.sps-cerrados-retro');
      const nextHeader = nextRow.querySelector('.sps-cerrados-header');
      const nextChevron = nextRow.querySelector('.sps-cerrados-chevron');
      if (nextRetro)  nextRetro.style.gridTemplateRows = '1fr';
      if (nextHeader) nextHeader.setAttribute('aria-expanded', 'true');
      if (nextChevron) nextChevron.textContent = '▲';
      nextRow.classList.add('is-expanded');
    }
  }

  _spsCerradosExpanded = next;
}
// ── END T-202606-039 ─────────────────────────────────────────────────────

// Actualiza visibilidad de botones según estado — llamado desde renderSprintTab
function _spmUpdateButtons(sprint) {
  const section       = document.getElementById('sprint-mgmt-section');
  const btnRegistrar  = document.getElementById('spm-btn-registrar');
  const btnReactivar  = document.getElementById('spm-btn-reactivar');
  const btnRetro      = document.getElementById('spm-btn-retro');

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
}

// ── END R-202605-006 ──────────────────────────────────────────────────────

// ── T-202605-046: Listeners — spt-tab buttons ─────────────────────────────
// Migrado desde index.html — reemplaza onclick inline en .spt-tab. Listener de
// #btn-close-sprint eliminado (B-202606-024) — el elemento fue removido del HTML en T-202606-042

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
