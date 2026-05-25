// locus-sprint.js
// Versión: 1.2 | Última actualización: 2026-05-25 UTC-6
// Módulo: Orquestador del tab Sprint — renderSprintTab, _renderSprintItems, _renderSprintWorkers, _renderSprintScopeAdded, _sptSwitch, _renderSprintPlanificar
// Consume: locus-sprint-plan.js · locus-backlog-sprints.js · locus-checkpoint-stats.js · locus-storage.js · locus-backlog-render.js
// Carga: después de locus-sprint-plan.js, antes de locus-api.js

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
  if (typeof _isBlocked === 'function') return _isBlocked(item);
  return false;
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
  if (typeof ITEMS !== 'undefined') {
    const children = ITEMS.filter(i => i.parentCode === item.code && i.type === 'T');
    if (children.length > 0) {
      const done = children.filter(c => c.status === 'done').length;
      childrenHtml = `<span class="spi-item-children">${done}/${children.length} T</span>`;
    }
  }

  const onclick = `if(typeof openItemPanel==='function') openItemPanel('${item.code}')`;

  return `<div class="${cls}" tabindex="0" role="button" aria-label="${item.code}: ${item.title}" onclick="${onclick}">
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

const _SPT_PANELS   = ['items', 'planificar', 'plan'];

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
  if (subtab === 'plan' && typeof renderPlanInto === 'function') renderPlanInto('sprint-plan-container');
}

// ── Render panel Planificar — R-202605-052 ──────────────────────────────────

function _renderSprintPlanificar() {
  const container = document.getElementById('sprint-planificar-container');
  if (!container) return;
  // _renderPlanningView vive en locus-backlog-render.js — espera un elemento contenedor
  if (typeof _renderPlanningView === 'function') {
    _renderPlanningView(container, "_sptSwitch('items', document.getElementById('spt-tab-items'))");
  } else {
    container.innerHTML = '<div class="spi-section-empty">Vista Planificar no disponible.</div>';
  }
}


function _renderSprintItems(sprint) {
  if (typeof ITEMS === 'undefined') return;

  const spItems = ITEMS.filter(i => {
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

  if (typeof getAI === 'function') {
    const sessions = typeof getAllSessions === 'function' ? getAllSessions() : [];
    const sprintItemCodes = (typeof ITEMS !== 'undefined')
      ? new Set(ITEMS.filter(i => i.sprint && i.sprint.startsWith(sprint.id)).map(i => i.code))
      : new Set();

    const aiIds = new Set();
    sessions.forEach(sess => {
      if (!sess.tgItems || !Array.isArray(sess.tgItems)) return;
      if (sess.tgItems.some(code => sprintItemCodes.has(code))) {
        if (sess.aiId) aiIds.add(sess.aiId);
      }
    });

    aiIds.forEach(id => {
      const ai = typeof getAI === 'function' ? getAI(id) : null;
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

  if (typeof ITEMS === 'undefined') return;

  const scopeItems = ITEMS.filter(i =>
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

// ── Función principal ───────────────────────────────────────────────────────

function renderSprintTab() {
  // T-202605-117: Guard de tab activo — skip render si el tab Sprint no es el visible.
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

  const sprint = typeof _getActiveSprint === 'function' ? _getActiveSprint() : null;
  _sprintTabActiveSprint = sprint;

  if (!sprint) {
    // Sin sprint activo — mostrar empty state, ocultar nav
    if (header)    header.classList.add('is-hidden');
    if (itemsList) itemsList.classList.add('is-hidden');
    if (emptyEl)   emptyEl.classList.remove('is-hidden');
    if (sptNav)    sptNav.classList.add('is-hidden');
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

  // Workers
  _renderSprintWorkers(sprint);

  // Scope added
  _renderSprintScopeAdded(sprint);
}

// ── Exposición pública ──────────────────────────────────────────────────────

window.renderSprintTab          = renderSprintTab;
window._renderSprintItems       = _renderSprintItems;
window._renderSprintWorkers     = _renderSprintWorkers;
window._renderSprintScopeAdded  = _renderSprintScopeAdded;
window._sptSwitch               = _sptSwitch;               // R-202605-052
window._renderSprintPlanificar  = _renderSprintPlanificar;  // R-202605-052
