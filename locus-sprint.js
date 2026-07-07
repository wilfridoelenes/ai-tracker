// [PP] mod:82 · autor:Rune · 2026-07-07 UTC-6
// TKT-202607-042 (REQ-202607-014): eliminación real de 'plan' en _SPT_SUBTAB_VALID/_SPT_PANELS,
// del array literal de listeners de subtabs, de la referencia a panelPlan/sprint-panel-plan en
// la rama sin-sprint-activo, y de comentarios de visibilidad. El header mod:81 abajo declaraba
// esta limpieza como ya hecha — el código no reflejaba el comentario (verificado por Finn en
// auditoría de TKT-202607-041). Import de locus-sprint-plan.js nunca estuvo en este archivo —
// vivía en main.js (removido en este mismo TKT). getProjectById no es import de este módulo.
// [PP] mod:81 · autor:Rune · 2026-07-06 20:32 UTC-6
// REQ-execution-plan-deprecation: removido tab "Plan" — render (subtab 'plan' → renderPlanInto),
//   badge (btnPlan, AC-2 de _updateSprintTabBadges), import de locus-sprint-plan.js.
//   getProjectById también removido de import (sin otros consumidores tras este cambio).
//   No confundir con tab "Planificar" (_renderSprintPlanificar / locus-sprint-planificacion.js) —
//   feature distinto, no tocado.
// REQ-[tmp:req-vocab-historico]: comentario actualizado — referenciaba locus-backlog-archive.js
// (renombrado a locus-backlog-historico.js). Sin cambio de código, solo comentario.
// locus-sprint.js
// Módulo: Orquestador del tab Sprint — renderSprintTab, _renderSprintItems, _renderSprintWorkers, _renderSprintScopeAdded, _sptSwitch, _renderSprintPlanificar

import { _isBlocked, getItems, itemKind } from './locus-backlog-core.js';
import { openItemPanel } from './locus-backlog-panel.js';
import { _renderPlanningView, _attachPlanCloseHandler, _attachPlanViewDelegation } from './locus-sprint-planificacion.js';
import { _getActiveSprint, confirmCloseSprint, createSprintFromGroup, openSprintRetroView, setSprintStatus, _getConflictingSprints } from './locus-backlog-sprints.js'; // T-202606-089 AC-3 · T-202606-105
import { _gconfirmOpen } from './locus-modals.js';
import { getAI, getActiveSprints, getAllSessions, save, _upsertSprint, getHistoricoItemsSync, refreshHistoricoCache } from './locus-storage.js'; // INC-fix: contador de sprint cerrado no veía ítems migrados a historico — getHistoricoItemsSync/refreshHistoricoCache viven en locus-storage.js, no en locus-backlog-historico.js
import { _getActiveProjectFilter } from './locus-proj-core.js';
import { showToast, toast } from './locus-toast.js';

import { render } from './locus-sesiones.js';
import { _markStatusBarDirty } from './locus-sesiones-stats.js';

// ── Estado interno ──────────────────────────────────────────────────────────
let _sprintTabActiveSprint = null;
const _SPT_SUBTAB_KEY   = 'locus-sprint-subtab';
const _SPT_SUBTAB_VALID = ['items', 'planificar', 'sprints'];
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

// B-202606-XXX: tras deserialización desde JSON el getter item.sprint definido en
// _normalizeItems (T-202606-084) se pierde — solo sprint_id persiste como campo real.
// _iSprint() lee sprint_id con fallback a sprint para cubrir ambos casos.
function _iSprint(i) { return i.sprint_id !== undefined ? i.sprint_id : (i.sprint || ''); }

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
    const children = getItems().filter(i => i.parentCode === item.code && itemKind(i) === 'TKT');
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

const _SPT_PANELS   = ['items', 'planificar', 'sprints']; // T-202606-029: tercer sub-tab tras cancelación de Plan (TKT-202607-042)

function _sptSwitch(subtab, triggerBtn, skipItemsRender = false) {
  _sptActiveSubtab = subtab; // B-202606-065/066: persiste entre renders y recargas de página
  localStorage.setItem(_SPT_SUBTAB_KEY, subtab);
  // T-202606-042: ocultar header en sub-tab Sprints, visible en Ítems/Planificar
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
  if (subtab === 'sprints') {
    _renderSpsActivo(); // T-202606-036
    _renderSpsProgramados(); // T-202606-037
    _renderSpsPausados(); // T-202606-041
    // TKT-B1: _renderSpsHotfix eliminada — Q-INC reemplaza S-HOTFIX
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

  // B-202606-030: initialValue calculado internamente desde el modelo — el caller
  // no pasa initialValue. Fuente única de verdad: getActiveSprints()[sprintId][field].
  // original queda como fallback de display para guard de no-cambio.
  const _sp          = getActiveSprints().find(function(s) { return s.id === sprintId; });
  const initialValue = _sp ? (_sp[field] !== undefined ? String(_sp[field]) : '') : el.textContent;
  const original     = el.textContent;
  const isSelect     = opts && opts.inputType === 'select';
  let input;

  if (isSelect) {
    input = document.createElement('select');
    input.className = 'sps-field-input sps-field-select';
    (opts.options || []).forEach(function(o) {
      const opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.t;
      if (o.v === initialValue || o.t === initialValue) opt.selected = true;
      input.appendChild(opt);
    });
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'sps-field-input';
    input.value = initialValue === '—' ? '' : initialValue;
  }

  el.classList.add('is-hidden');
  el.parentNode.insertBefore(input, el.nextSibling);
  input.focus();
  if (!isSelect) input.select();

  let committed = false;

  function _commit() {
    if (committed) return;
    committed = true;
    const newVal = isSelect ? input.value : input.value.trim();
    input.remove();
    el.classList.remove('is-hidden');
    delete el.dataset.spsEditing;
    // B-202606-030: initialValue siempre viene del modelo — _noChangeRef usa initialValue directamente
    const _noChangeRef = initialValue;
    if (newVal && newVal !== _noChangeRef && newVal !== '—') {
      const sp = getActiveSprints().find(function(s) { return s.id === sprintId; });
      if (sp) {
        // B-202606-029: label NO concatena el ID — id y label son campos separados (BR-Ecosystem §5)
        if (field === 'label') {
          sp.label = newVal;
        } else {
          sp[field] = newVal;
        }
        try {
          // B-202606-XXX: save() persiste `state` — los sprints viven en tracker_sprints
          // desde T-202606-005 y no se sincronizan vía save(). Usar _upsertSprint().
          // QA: _getActiveProjectFilter() puede ser '' en vista "todos" — usar el proyecto
          // dueño del sprint primero, mismo patrón que setSprintStatus en locus-backlog-sprints.js.
          const _projId = sp.projId || sp.projectId || _getActiveProjectFilter();
          _upsertSprint(sp, _projId).catch(function(err) {
            showToast('error', 'Error al guardar. Intenta de nuevo.');
          });
          showToast('success', 'Sprint actualizado.');
        } catch (err) {
          showToast('error', 'Error al guardar. Intenta de nuevo.');
        }
      }
    }
    onDone();
  }

  function _cancel() {
    if (committed) return;
    committed = true;
    input.remove();
    el.classList.remove('is-hidden');
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
        '<p class="sps-empty-hint">La apertura de sprint se propone desde Cael (sprint_proposal) — no hay creación manual.</p>' +
      '</div>';
    return;
  }

  const id    = sprint.id || '';
  // INC-[pendiente-ID]: 'label' se renderiza en sps-card-title, junto a sps-card-id
  // (span separado, ver container.innerHTML abajo) — no debe re-incluir el id como prefijo
  // o duplica visualmente el ID. Mismo bug ya corregido en Programados/Cerrados/Pausados —
  // esta era la instancia visible en la captura del founder (sub-tab Sprints → Activo).
  const label = sprint.label || sprint.name || id;
  const vt    = sprint.version_target || '—';
  const rt    = sprint.release_type || sprint.releaseType || '—';
  const goal  = sprint.goal || '—';

  // Burndown — ítems done/total (R/B/T, sin descartados)
  let total = 0;
  let done  = 0;
  let spItems = [];
  if (Array.isArray(getItems())) {
    const _sid = _spIdBase(id);
    spItems = getItems().filter(i => {
      const t = i.type || (i.code ? i.code.charAt(0) : '');
      return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
        (['REQ','TKT','INC'].includes(itemKind({type:t}))) &&
        i.status !== 'descartado';
    });
    total = spItems.length;
    done  = spItems.filter(i => i.status === 'done').length;
  }
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // T-202606-034: conteo de bloqueados — reutiliza _sprintIsBlocked() ya
  // existente (L48), misma fuente que _sprintItemHtml() usa para el listado.
  // Un solo recorrido sobre spItems ya filtrado — no se recalcula el universo.
  const bloqueadosCount = spItems.filter(i => i.status !== 'done' && _sprintIsBlocked(i)).length;

  // T-202606-003: modificador visual para sprint pausado
  const pausadoCls = sprint.status === 'pausado' ? ' sps-card--pausado' : '';

  container.innerHTML =
    '<span class="sps-section-label">Activo</span>' +
    '<div class="sps-card' + pausadoCls + '" data-sprint-id="' + _escHtml(id) + '">' +
      '<div class="sps-card-header">' +
        '<span class="sps-card-id font-mono">' + _escHtml(id) + '</span>' +
        '<span class="sps-card-title sps-meta-editable" tabindex="0" title="Click para editar título">' + _escHtml(label) + '</span>' +
        '<span class="sml-badge sprint-badge-active">Activo</span>' +
        '<div class="sps-menu-wrap">' +
          '<button class="sps-btn-menu" type="button" aria-label="Acciones del sprint activo" aria-expanded="false" aria-haspopup="true" data-sps-activo-menu>···</button>' +
          '<div class="sps-dropdown" role="menu" aria-label="Acciones sprint activo" hidden>' +
            '<button class="sps-dropdown-item" role="menuitem" type="button" data-sps-action="pausar">Pausar sprint</button>' +
            '<div class="sps-dropdown-sep" role="separator"></div>' +
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
    '</div>' +
    '<div class="sph-panel">' +
      '<span class="sph-title">Salud del sprint</span>' +
      '<div class="sph-row">' +
        '<div class="sph-bar-track">' +
          '<div class="sph-bar-fill"></div>' +
        '</div>' +
        '<span class="sph-pct">' + pct + '%</span>' +
      '</div>' +
      '<span class="sph-count">' + done + ' / ' + total + ' ítems</span>' +
      '<div class="sph-alert">' +
        '<span class="sph-alert-icon">⚠</span>' +
        '<span class="sph-alert-text">' + bloqueadosCount + ' ítems bloqueados</span>' +
      '</div>' +
    '</div>';

  // CSS Purity: variable de progreso via setProperty — un solo cálculo (pct),
  // consumido por .sps-burndown-fill (card) y .sph-bar-fill (panel nuevo)
  // dentro del mismo scope de container.
  const fillEl = container.querySelector('.sps-burndown-fill');
  if (fillEl) fillEl.style.setProperty('--sps-burndown-pct', pct + '%');
  const sphFillEl = container.querySelector('.sph-bar-fill');
  if (sphFillEl) sphFillEl.style.setProperty('--sps-burndown-pct', pct + '%');

  // T-202606-034: fila de alerta — visibilidad por classList, nunca por
  // ausencia/presencia en el DOM (CSS Purity / no innerHTML condicional).
  const sphAlertEl = container.querySelector('.sph-alert');
  if (sphAlertEl) sphAlertEl.classList.toggle('is-visible', bloqueadosCount > 0);

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
      // B-202606-030: initialValue calculado internamente — caller no pasa initialValue
      opts = {};
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
  const all = getActiveSprints().filter(function(s) { return s.status === 'scheduled'; });

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

  // AC-4 (T-202606-001): sin programados → sección vacía sin encabezado — no ocupa espacio visual
  if (sprints.length === 0) {
    container.innerHTML = '';
    container.classList.add('is-hidden');
    container.removeEventListener('click', _sppHandleClick);
    return;
  }

  // Hay programados — restaurar visibilidad si estaba oculto
  container.classList.remove('is-hidden');

  const rows = sprints.map(function(s) {
    const id    = s.id || '';
    // INC-[pendiente-ID]: 'label' se renderiza junto a un span de id separado (sps-scheduled-id,
    // línea siguiente) — no debe re-incluir el id como prefijo o duplica visualmente el ID.
    // Mismo criterio ya correcto en _renderSprintSummaryTable (ssm-row-name): label crudo, sin id.
    const label = s.label || s.name || id;

    // Conteo done/total de ítems del sprint programado
    let total = 0;
    let done  = 0;
    let advDone = 0; // ítems ya done en un sprint programado = adelantados
    if (Array.isArray(getItems())) {
      const _sid = _spIdBase(id);
      const spItems = getItems().filter(function(i) {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
          (['REQ','TKT','INC'].includes(itemKind({type:t}))) &&
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
          '<div class="sps-bd-mini-fill" data-sps-bd-pct="' + pct + '"></div>' +
        '</div>' +
        '<span class="sps-scheduled-count">' + done + ' / ' + total + '</span>' +
      '</div>';
  }).join('');

  container.innerHTML =
    '<span class="sps-section-label">Programados</span>' +
    '<div class="sps-card">' + rows + '</div>';

  container.querySelectorAll('.sps-bd-mini-fill[data-sps-bd-pct]').forEach(function(fillEl) {
    fillEl.style.setProperty('--sbm-fill-width', fillEl.dataset.spsBdPct + '%');
  });

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
    // B-202606-030: initialValue calculado internamente — caller no pasa initialValue ni descriptive2
    _spsFieldEdit(nameEl, sprintId, 'label', function() { _renderSpsProgramados(); }, {});
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

    const labelText = sprint.label ? `${sprint.id} · ${sprint.label}` : (sprint.name || sprint.id);
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
        showToast('error', 'Error al guardar. Intenta de nuevo.');
        sprint.status = 'scheduled';
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
    return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
      (['REQ','TKT','INC'].includes(itemKind({type:t}))) &&
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

    const rItems = sectionItems.filter(i => itemKind(i) === 'REQ');
    const tItems = sectionItems.filter(i => itemKind(i) === 'TKT');
    const bItems = sectionItems.filter(i => itemKind(i) === 'INC');

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
      ? new Set(getItems().filter(i => _iSprint(i) && _iSprint(i).startsWith(_sid)).map(i => i.code))
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
    _iSprint(i) && _iSprint(i).startsWith(_sid) &&
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

  // Agrupar ítems no descartados por sprint, excluyendo active, closed e ítems sin sprint (Q-Backlog/Q-DISC)
  const plannedMap = {};
  getItems().forEach(i => {
    const raw = _iSprint(i).trim();
    if (!raw) return; // TKT-B6: eliminado raw==='icebox' (Gen1) — !raw cubre Q-Backlog/Q-DISC en Gen2
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
    const label  = spObj ? (spObj.label ? `${spObj.id} · ${spObj.label}` : spObj.id) : sprintId;
    const countR = items.filter(i => itemKind(i) === 'REQ').length;
    const countT = items.filter(i => itemKind(i) === 'TKT').length;
    const countB = items.filter(i => itemKind(i) === 'INC').length;
    const effort = items.reduce((acc, i) => acc + (parseInt(i.effort) || 0), 0);

    const countParts = [];
    if (countR) countParts.push(`<span class="spl-type spl-type--req">REQ=${countR}</span>`);
    if (countT) countParts.push(`<span class="spl-type spl-type--tkt">TKT=${countT}</span>`);
    if (countB) countParts.push(`<span class="spl-type spl-type--inc">INC=${countB}</span>`);

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

// TKT-B1: _renderHotfixSection eliminada — usaba isHotfix:true y sprint-hotfix-list (Gen1)

// ── T-202606-002: Resumen agregado de sprints normales ──────────────────────
//
// Lista todos los sprints normales (isHotfix falsy) con id, nombre, status badge,
// conteo R/T/B, effort total. Escribe en #sprint-summary-list. Solo lectura —
// edición de campos de sprint vive en sub-tab Sprints (_renderSpsActivo /
// _renderSpsProgramados).

function _renderSprintSummaryTable(allSprints) {
  const container = document.getElementById('sprint-summary-list');
  if (!container) return;

  // TKT-B1: isHotfix eliminado — Gen2 no tiene sprints con isHotfix:true
  const normalSprints = allSprints ? [...allSprints] : [];

  // sin sprints → empty state
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
                         : sprint.status === 'scheduled'  ? 'sprint-badge-programado'
                         : sprint.status === 'pausado'    ? 'sprint-badge-paused'
                         :                                  'sprint-badge-closed';
    const statusTxt      = sprint.status === 'active'     ? 'Activo'
                         : sprint.status === 'scheduled'  ? 'Programado'
                         : sprint.status === 'pausado'    ? 'Pausado'
                         :                                  'Cerrado';

    // Conteo R/T/B y effort — AC-2 T2
    let countR = 0, countT = 0, countB = 0, effort = 0;
    if (Array.isArray(getItems())) {
      const _sid = _spIdBase(sprint.id); // B-202606-008
      const spItems = getItems().filter(i => {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
          (['REQ','TKT','INC'].includes(itemKind({type:t}))) &&
          i.status !== 'descartado';
      });
      countR = spItems.filter(i => itemKind(i) === 'REQ').length;
      countT = spItems.filter(i => itemKind(i) === 'TKT').length;
      countB = spItems.filter(i => itemKind(i) === 'INC').length;
      effort = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 0), 0);
    }

    const countParts = [];
    if (countR) countParts.push(`<span class="ssm-type ssm-type--req">${countR} REQ</span>`);
    if (countT) countParts.push(`<span class="ssm-type ssm-type--tkt">${countT} TKT</span>`);
    if (countB) countParts.push(`<span class="ssm-type ssm-type--inc">${countB} INC</span>`);
    const countsHtml = countParts.length ? countParts.join('') : '<span class="ssm-type ssm-type--empty">0 ítems</span>';

    return `<div class="ssm-row" data-sprint-id="${_escHtml(sprint.id)}">
  <div class="ssm-row-top">
    <span class="ssm-row-id">${_escHtml(sprint.id)}</span>
    <span class="ssm-row-name">${_escHtml(sprint.label || sprint.name || '')}</span>
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
  const items = conflicts.map(s => `${s.label ? `${s.id} · ${s.label}` : (s.name || s.id)} · abierto ${_fmtDate(s.startedAt)}`).join('<br>');
  const count = conflicts.length;
  banner.innerHTML = `
    <span class="sprint-conflict-icon">⚠</span>
    <span class="sprint-conflict-text">${count} sprint${count > 1 ? 's' : ''} activo${count > 1 ? 's' : ''} simultáneamente — solo puede haber uno<br>
      <span class="sprint-conflict-list">${items}</span>
    </span>
    <button class="sprint-conflict-btn" type="button" data-sprint-conflict-resolve>Resolver en sub-tab Sprints</button>
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
    if (e.target.closest('[data-sprint-conflict-resolve]')) _sptSwitch('sprints');
  };
}

// ── Función principal ───────────────────────────────────────────────────────

// T-202606-098: badges de conteo en sub-tab nav
// AC-1: badge Ítems = ítems activos (pendiente + en-revision + bloqueado) del sprint activo
// AC-3/AC-4: tabs Planificar y Sprints no tienen badge
// AC-7: sin sprint activo → sin badges
function _updateSprintTabBadges() {
  const sprint = _getActiveSprint();
  const btnItems = document.getElementById('spt-tab-items');

  // AC-7: sin sprint activo → limpiar badges y salir
  if (!sprint) {
    if (btnItems) { const b = btnItems.querySelector('.spt-tab-badge'); if (b) b.textContent = ''; }
    return;
  }

  // AC-1: conteo de ítems activos
  if (btnItems) {
    let badge = btnItems.querySelector('.spt-tab-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'spt-tab-badge';
      badge.setAttribute('aria-hidden', 'true');
      btnItems.appendChild(badge);
    }
    const _sid = _spIdBase(sprint.id);
    const spItems = getItems().filter(i => {
      const t = i.type || (i.code ? i.code.charAt(0) : '');
      return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
        (['REQ','TKT','INC'].includes(itemKind({type:t}))) &&
        i.status !== 'descartado';
    });
    const activeCount = spItems.filter(i =>
      i.status === 'pendiente' || i.status === 'en-revision' || _sprintIsBlocked(i)
    ).length;
    badge.textContent = activeCount > 0 ? String(activeCount) : '';
  }
}

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
  const sptNav    = _spEl('spt-nav'); // R-202605-043

  // T-202606-105: banner de conflicto — sprints activos simultáneos
  _renderConflictBanner();

  const sprint = _sprintNow;

  if (!sprint) {
    // T-202606-001 AC-3: segunda evaluación — sprint programado (scheduled) sin sprint activo.
    // _getActiveSprint() solo retorna status:'active'. Si hay scheduled → rama con-sprint.
    const _activeProjId  = _getActiveProjectFilter();
    const _hasScheduled = getActiveSprints().some(function(s) {
      return s.status === 'scheduled' && s.projectId === _activeProjId; // TKT-B1: isHotfix eliminado
    });
    if (_hasScheduled) {
      // Hay sprint programado — caer en rama con-sprint (default 'items')
      // Continúa fuera del bloque if (!sprint)
    } else {
      // T-202606-001 AC-1/AC-2: sin sprint activo ni programado — sptNav visible, default 'sprints'.
      // Reemplaza la arquitectura de empty state dedicado (R-202605-006, deprecada).
      if (header)    header.classList.add('is-hidden');
      if (itemsList) itemsList.classList.add('is-hidden');
      if (sptNav)    sptNav.classList.remove('is-hidden');
      const workers    = _spEl('sprint-workers');
      const scopeAdded = _spEl('sprint-scope-added');
      if (workers)   workers.classList.add('is-hidden');
      if (scopeAdded) scopeAdded.classList.add('is-hidden');
      // Ocultar paneles que requieren sprint activo — R-202605-043 + R-202605-052
      const panelItems      = _spEl('sprint-panel-items');
      const panelPlanificar = _spEl('sprint-panel-planificar');
      if (panelItems)      panelItems.classList.add('is-hidden');
      if (panelPlanificar) panelPlanificar.classList.add('is-hidden');
      // T-202606-001 AC-1: sub-tab 'sprints' es el default — visible y activo
      _sptActiveSubtab = 'sprints';
      localStorage.setItem(_SPT_SUBTAB_KEY, 'sprints');
      // T-202606-002: modo vista-principal — header de contexto visible, ancho completo
      const panelSprints = _spEl('sprint-panel-sprints');
      if (panelSprints) panelSprints.classList.add('spt-main-view');
      // T-202606-002: empty-state total — ningún sprint de ningún tipo (activo/programado/
      // pausado/cerrado) para el proyecto activo.
      const _hasAnySprint = getActiveSprints().some(function(s) {
        return s.projectId === _activeProjId; // TKT-B1: isHotfix eliminado
      });
      _sptSwitch('sprints', _spEl('spt-tab-sprints'), true);
      return;
    }
  }

  // Hay sprint activo

  // T-202606-001 AC-3: default a sub-tab 'items' cuando hay sprint activo o programado —
  // sin cambio respecto al comportamiento previo, salvo que el estado persistido sea inválido.
  if (_sptActiveSubtab === 'sprints' && !_SPT_SUBTAB_VALID.includes(localStorage.getItem(_SPT_SUBTAB_KEY))) {
    _sptActiveSubtab = 'items';
  }

  // Mostrar subtab nav y resetear a "Ítems" — R-202605-043
  if (sptNav) {
    sptNav.classList.remove('is-hidden');
  }

  // T-202606-002: hay sprint activo o programado — salir de modo vista-principal si estaba activo
  const _panelSprintsRestore = _spEl('sprint-panel-sprints');
  if (_panelSprintsRestore) {
    _panelSprintsRestore.classList.remove('spt-main-view', 'spt-no-sprints-at-all');
  }

  // Header — T-202606-042: remove is-hidden base antes de _sptSwitch para que el toggle por subtab tenga la última palabra
  if (header) {
    header.classList.remove('is-hidden');
    const nameEl    = _spEl('sph-name');
    const versionEl = _spEl('sph-version');
    const pillEl    = _spEl('sph-release-pill');
    const daysEl    = _spEl('sph-days');

    if (nameEl)    nameEl.textContent    = sprint.label ? `${sprint.id} · ${sprint.label}` : (sprint.name || sprint.id || '');
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

  // T-202606-100: aplicar estado de colapso persistido al header
  _sphApplyCollapsed();

  // T-202606-042: _sptSwitch después de header.classList.remove — el toggle de subtab tiene la última palabra sobre visibilidad del header
  _sptSwitch(_sptActiveSubtab, _spEl('spt-tab-' + _sptActiveSubtab), true); // B-202606-065: usa estado persistido — no lee DOM. true = skip items render (renderSprintTab lo hace directamente)

  // Ítems
  if (itemsList) itemsList.classList.remove('is-hidden');
  _renderSprintItems(sprint);

  // Workers
  _renderSprintWorkers(sprint);

  // Scope added
  _renderSprintScopeAdded(sprint);

  // T-202606-098: badges de conteo en sub-tab nav — AC-5
  _updateSprintTabBadges();
}

// ── T-202606-100: Header sprint colapsable ────────────────────────────────

const _SPH_COLLAPSED_KEY = 'locus-sprint-header-collapsed';

function _sphIsCollapsed() {
  try { return localStorage.getItem(_SPH_COLLAPSED_KEY) === 'true'; } catch (e) { return false; }
}

function _sphSetCollapsed(collapsed) {
  try { localStorage.setItem(_SPH_COLLAPSED_KEY, String(collapsed)); } catch (e) {}
}

function _sphApplyCollapsed() {
  const header = document.getElementById('sprint-panel-header');
  const inner  = header && header.querySelector('.sph-inner');
  const btn    = document.getElementById('sph-collapse-btn');
  if (!header || !inner || !btn) return;
  const collapsed = _sphIsCollapsed();
  header.classList.toggle('is-collapsed', collapsed);
  inner.classList.toggle('is-hidden', collapsed);
  btn.setAttribute('aria-expanded', String(!collapsed));
  btn.setAttribute('aria-label', collapsed ? 'Expandir header' : 'Colapsar header');
}

function _sphToggle() {
  const collapsed = !_sphIsCollapsed();
  _sphSetCollapsed(collapsed);
  _sphApplyCollapsed();
}

// ── T-202606-038: Sprint HOTFIX persistente ───────────────────────────────
//
// TKT-B1: ensureHotfixSprint eliminada — S-HOTFIX no existe en Gen2

// ── T-202606-041: _renderSpsPausados — sección sprints pausados ──────────────
//
// Renderiza en #sps-pausados una card por sprint con status 'pausado' e isHotfix falsy.
// Si no hay pausados: innerHTML vacío + display:none — no ocupa espacio visual.
// Si hay pausados tras haber estado oculto: display:'' restaura visibilidad.
// Excluye isHotfix:true aunque tengan status 'pausado'.
// B-202606-090: filtro usaba 'paused' (inglés) — el resto del módulo escribe/lee
// 'pausado' (español, ver L312/460/1144/1148). La sección nunca mostraba nada.

function _renderSpsPausados() {
  const container = document.getElementById('sps-pausados');
  if (!container) return;

  const allSprints = getActiveSprints();
  const paused = allSprints
    ? allSprints.filter(s => s.status === 'pausado') // TKT-B1: isHotfix eliminado
    : [];

  // AC-4/AC-5: sin pausados → ocultar contenedor sin empty state
  if (paused.length === 0) {
    container.innerHTML = '';
    container.classList.add('is-hidden');
    return;
  }

  // AC-3/AC-5: hay pausados → restaurar visibilidad
  container.classList.remove('is-hidden');

  const cards = paused.map(function(s) {
    // INC-[pendiente-ID]: composite construido una sola vez aquí (mismo patrón que
    // _renderSpsActivo) — evita "id · id" cuando no hay label ni name propios.
    const title = s.label ? `${s.id} · ${s.label}` : (s.name ? `${s.id} · ${s.name}` : s.id);
    const pausedDate = s.pausedAt || s.createdAt
      ? new Date(s.pausedAt || s.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';

    return (
      '<div class="sps-card sps-card--paused" data-sprint-id="' + _escHtml(s.id || '') + '">' +
        '<div class="sps-header">' +
          '<span class="sps-title">' + _escHtml(title) + '</span>' +
          '<span class="sml-badge sml-badge--paused">PAUSADO</span>' +
        '</div>' +
        '<div class="sps-pausados-meta">' +
          '<span class="sps-pausados-date">Pausado: ' + pausedDate + '</span>' +
          '<button class="sps-btn-reactivar" aria-label="Reactivar ' + _escHtml(s.id || '') + '">Reactivar</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML = cards;

  // T-202606-008: listeners de botones Reactivar — AC-1/AC-2/AC-3
  container.querySelectorAll('.sps-btn-reactivar').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const card = btn.closest('[data-sprint-id]');
      if (!card) return;
      const sprintId = card.dataset.sprintId;
      const result = setSprintStatus(sprintId, 'active');
      // AC-2: re-render solo si setSprintStatus retornó éxito (no false)
      // AC-3: si retorna false, setSprintStatus ya disparó toast — no agregar más
      if (result !== false) {
        _renderSpsPausados();
      }
    });
  });
}
// ── END T-202606-041 / T-202606-008 ──────────────────────────────────────────

// TKT-B1: _renderSpsHotfix, _spsHotfixHandleClick, _spsHotfixHandleKeydown eliminadas — Gen2 usa Q-INC

// ── T-202606-039: _renderSpsCerrados — lista colapsada de sprints cerrados con retro inline ──
//
// Renderiza en #sps-cerrados todos los sprints cerrados ordenados por closedAt desc.
// Cada fila es colapsable — clic expande retro inline (patrón 0fr→1fr).
// Exactamente un sprint expandido en todo momento. Clic en fila ya expandida colapsa.
// Sin ítems: muestra empty state inline — la sección no desaparece.
// Retro: contenido de sprint.retroDoc (texto plano, solo lectura). Sin retroDoc → 'Retro no disponible'.

let _spsCerradosExpanded = null; // ID del sprint actualmente expandido

async function _renderSpsCerrados() {
  const container = document.getElementById('sps-cerrados');
  if (!container) return;

  // INC-fix: getHistoricoItemsSync() lee de un cache que arranca vacío por proyecto —
  // el caller es responsable de haberlo refrescado antes (locus-storage.js:1465-1466).
  // Sin este await, el contador vuelve a mostrar 0 en la primera visita al sub-tab Sprints.
  await refreshHistoricoCache();

  const allSprints = getActiveSprints();
  const closed = allSprints
    ? allSprints
        .filter(s => s.status === 'closed') // TKT-B1: isHotfix eliminado
        .sort((a, b) => {
          const ta = b.closedAt || b.createdAt || 0;
          const tb = a.closedAt || a.createdAt || 0;
          if (ta !== tb) return ta - tb;
          // AC-1 (T-202606-001): tiebreaker por ID descendente cuando ambos timestamps son null/0
          return (b.id || '').localeCompare(a.id || '');
        })
    : [];

  // AC-3 (T-202606-001): sin cerrados → sección vacía sin encabezado — no ocupa espacio visual
  if (closed.length === 0) {
    container.innerHTML = '';
    container.classList.add('is-hidden');
    container.removeEventListener('click', _spsCerradosHandleClick);
    _spsCerradosExpanded = null;
    return;
  }

  // Hay cerrados — restaurar visibilidad si estaba oculto
  container.classList.remove('is-hidden');

  // Calcular conteos done/descartado desde getItems()
  // Fix de alineación BR (__BR-Ecosystem §5): "migrado" eliminado — bajo el Gate duro
  // de cierre, un sprint no cierra con ítems en pendiente/en-revision, por lo que ese
  // conteo era siempre 0 en la práctica. Ver __BR-Ecosystem §5 y locus-backlog-sprints.js AC-3.
  const rows = closed.map(sprint => {
    const _sid = _spIdBase(sprint.id);
    let doneCnt = 0, descartadoCnt = 0;
    {
      // INC-fix: getItems() ya no contiene status:historico (T-202606-106) — los ítems
      // done de un sprint cerrado migran a getHistoricoItemsSync(). Combinar ambas fuentes
      // para que el contador cuente contra el universo real, no solo el activo.
      const live = Array.isArray(getItems()) ? getItems() : [];
      const hist = Array.isArray(getHistoricoItemsSync()) ? getHistoricoItemsSync() : [];
      const seen = new Set();
      const allItems = [];
      for (const i of [...live, ...hist]) {
        if (!i || !i.code || seen.has(i.code)) continue;
        seen.add(i.code);
        allItems.push(i);
      }
      const spItems = allItems.filter(i => {
        const t = i.type || (i.code ? i.code.charAt(0) : '');
        return _iSprint(i) && _iSprint(i).startsWith(_sid) &&
          (['REQ','TKT','INC'].includes(itemKind({type:t})));
      });
      doneCnt       = spItems.filter(i => i.status === 'done' || i.status === 'historico').length;
      descartadoCnt = spItems.filter(i => i.status === 'descartado').length;
    }

    // INC-[pendiente-ID]: 'label' se renderiza en sps-cerrados-label, junto a sps-cerrados-id
    // (span separado, línea siguiente) — no debe re-incluir el id como prefijo o duplica
    // visualmente el ID. Mismo criterio ya correcto en ssm-row-name.
    const label = sprint.label || sprint.name || sprint.id;
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
            '<span class="sps-count-descartado">' + descartadoCnt + ' desc.</span>' +
          '</span>' +
          '<div class="sps-menu-wrap">' +
            '<button class="sps-btn-menu" type="button" aria-label="Acciones sprint ' + _escHtml(sprint.id) + '" aria-expanded="false" aria-haspopup="true" data-sps-cerrados-menu>···</button>' +
            '<div class="sps-dropdown" role="menu" aria-label="Acciones ' + _escHtml(sprint.id) + '" hidden>' +
              '<button class="sps-dropdown-item" role="menuitem" type="button" data-sps-cerrados-action="ver-retro">Ver retro completa</button>' +
              '<button class="sps-dropdown-item" role="menuitem" type="button" data-sps-cerrados-action="exportar">Exportar .md</button>' +
            '</div>' +
          '</div>' +
          '<span class="sps-cerrados-chevron" aria-hidden="true">' + (isExpanded ? '▲' : '▼') + '</span>' +
        '</div>' +
        '<div class="sps-cerrados-retro" id="sps-cerrados-retro-' + _escHtml(sprint.id) + '">' +
          '<div class="sps-cerrados-retro-inner">' +
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
  // T-202606-002: menú ⋯ — abrir/cerrar dropdown
  const menuBtn = e.target.closest('[data-sps-cerrados-menu]');
  if (menuBtn) {
    e.stopPropagation(); // no propagar al header — evita toggle de expand
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

  // T-202606-002: acciones del dropdown
  const actionBtn = e.target.closest('[data-sps-cerrados-action]');
  if (actionBtn) {
    e.stopPropagation();
    const row = actionBtn.closest('[data-sprint-id]');
    if (!row) return;
    const sprintId = row.dataset.sprintId;
    // Cerrar dropdown antes de ejecutar
    const dropdown = actionBtn.closest('.sps-dropdown');
    if (dropdown) { dropdown.hidden = true; }
    const menuWrap = actionBtn.closest('.sps-menu-wrap');
    if (menuWrap) {
      const btn = menuWrap.querySelector('[data-sps-cerrados-menu]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
    const act = actionBtn.getAttribute('data-sps-cerrados-action');
    if (act === 'ver-retro' || act === 'exportar') {
      openSprintRetroView(sprintId);
    }
    return;
  }

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
      const prevHeader = prevRow.querySelector('.sps-cerrados-header');
      const prevChevron = prevRow.querySelector('.sps-cerrados-chevron');
      if (prevHeader) prevHeader.setAttribute('aria-expanded', 'false');
      if (prevChevron) prevChevron.textContent = '▼';
      prevRow.classList.remove('is-expanded');
    }
  }

  // Expandir nuevo (si es distinto al anterior)
  if (next) {
    const nextRow = container.querySelector('[data-sprint-id="' + next + '"]');
    if (nextRow) {
      const nextHeader = nextRow.querySelector('.sps-cerrados-header');
      const nextChevron = nextRow.querySelector('.sps-cerrados-chevron');
      if (nextHeader) nextHeader.setAttribute('aria-expanded', 'true');
      if (nextChevron) nextChevron.textContent = '▲';
      nextRow.classList.add('is-expanded');
    }
  }

  _spsCerradosExpanded = next;
}
// ── END T-202606-039 / T-202606-002 ────────────────────────────────────────

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

  // Sub-tabs sprint: Ítems / Planificar / Sprints — T-202606-029
  ['items', 'planificar', 'sprints'].forEach(function(subtab) {
    const btn = document.getElementById('spt-tab-' + subtab);
    if (btn) {
      btn.addEventListener('click', function() {
        _sptSwitch(subtab, btn);
      });
    }
  });

  // B-202606-021: listener shell:render-sprint-tab — sincroniza el tab Sprint ante cambios
  // emitidos por otros módulos (locus-backlog-core, locus-storage, etc.) sin acoplamiento directo.
  window.addEventListener('shell:render-sprint-tab', function() {
    renderSprintTab();
    _updateSprintTabBadges(); // T-202606-098 AC-6
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

  // T-202606-100: sph-collapse-btn → _sphToggle()
  const sphCollapseBtn = document.getElementById('sph-collapse-btn');
  if (sphCollapseBtn) sphCollapseBtn.addEventListener('click', _sphToggle);

});
// ── END B-202605-019 ─────────────────────────────────────────────────────────
