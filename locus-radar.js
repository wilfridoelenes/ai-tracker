// [PP] mod:15 · autor:Rune · 2026-07-23 04:20 UTC-6
// TKT2 (REQ CAEL-0722-01): _rsbCfgExpanded, _renderCfgPanel(), _rsbToggleCfg() y la
// delegación de rsbToggleCfg/cfgReset/cfgSetThreshold/cfgSetEnabled dentro de
// #global-radar-sidebar retirados — la configuración de alertas migró a modal propio
// (locus-notifications.js openNotifConfig() + _wireAlertCfgDelegation()). El sidebar
// solo renderiza estado de workers.
// locus-radar.js
// Última actualización: 2026-05-25 | Perf: cachear getAISessions por render + _computeNotifications llamada una vez + _renderNotifSection acepta params pre-calculados
// Extraído de ai-tracker-checkpoint.js (líneas 3114–3712)
//
// Dependencias cross-módulo (resueltas en runtime via guards typeof):
//   checkpoint.js → _computeNotifications, _notifReadSet, _notifHistory, _notifConfig,
//                   _NOTIF_DEFAULTS, _notifConfigSetThreshold, _notifConfigSetEnabled,
//                   _notifGoto, _registerNotifActions, markNotifRead, markAllNotifsRead,
//                   updateTabNotifBadges, esc, getAISessions, getLastAISession,
//                   getActiveTracker, getCD, fmt12, _isInSession, _hoyAvailableSince,
//                   _hoyMsUntilReset, state
//   session.js   → navigateToCard, openQuickCapture
//   checkpoint.js → showCheckpointPanel

import { _computeNotifications, _notifGoto, _notifReadSet, _registerNotifActions, markAllNotifsRead, markNotifRead, updateTabNotifBadges } from './locus-notifications.js';
import { openQuickCapture } from './locus-sesiones-capture.js';
// TKT2 (CAEL-0717-01): import circular controlado con locus-sesiones.js (que ya importa
// de este módulo, línea de arriba en ese archivo) — seguro porque _openIngestModal solo
// se invoca dentro del click handler, nunca en tiempo de evaluación del módulo.
import { _openIngestModal } from './locus-sesiones.js';
import { navigateToCard } from './locus-sesiones-stats.js';
import { getAISessions, getState, _isInSession } from './locus-storage.js';
import { esc } from './locus-ui-shell.js';
import { openAddAI } from './locus-workers.js';

import { fmt12 } from './locus-session-hora.js';
import { _hoyMsUntilReset, getCD } from './locus-sesiones-utils.js';

// ── UTILS ─────────────────────────────────────────────────────────────────────
function _fmtNotifTs(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var pad = function(x) { return String(x).padStart(2,'0'); };
  return d.getDate() + '/' + pad(d.getMonth()+1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// ── NOTIFICACIONES ────────────────────────────────────────────────────────────

// R-202605-119: _renderNotifSection — empty state + historial + panel config colapsable al pie
// Perf: acepta allNotifs y readSet pre-calculados desde renderGlobalRadarSidebar — evita tercer call a _computeNotifications por render
function _renderNotifSection(allNotifs, readSet) {
  const all    = allNotifs || _computeNotifications();
  const read   = readSet   || _notifReadSet();
  const unseen = all.filter(function(n) { return !read.has(n.id); });

  _registerNotifActions(all);

  var notifContent;
  if (unseen.length) {
    var rows = unseen.map(function(n) {
      var eid  = n.id.replace(/&/g,'&amp;').replace(/\"/g,'&quot;');
      var body = n.body.replace(/</g,'&lt;').replace(/>/g,'&gt;');
      var sid  = JSON.stringify(n.id);
      return '<div class="rsb-notif-item rsb-notif-item--unseen" data-id="' + eid + '">' +
        '<span class="rsb-notif-icon">' + n.icon + '</span>' +
        '<div class="rsb-notif-content">' +
          '<div class="rsb-notif-title">' + n.title + '</div>' +
          '<div class="rsb-notif-body">' + body + '</div>' +
          '<span class="rsb-notif-type rsb-notif-type--' + (n.type || 'info') + '">' + (n.type || '') + '</span>' +
        '</div>' +
        '<div class="rsb-notif-actions">' +
          '<span class="rsb-notif-ts">' + _fmtNotifTs(n.ts || Date.now()) + '</span>' +
          '<button class="rsb-notif-goto" data-action="notifGoto" data-notif-id=\'' + sid + '\' title="Ir al ítem">\u2192</button>' +
          '<button class="rsb-notif-dismiss" data-action="notifDismiss" data-notif-id=\'' + sid + '\' title="Marcar como leída">\u2713</button>' +
        '</div>' +
      '</div>';
    }).join('');

    var markAllBtn = unseen.length > 1
      ? '<button class="rsb-notif-mark-all" data-action="notifMarkAll">Marcar todas \u2713</button>'
      : '';

    var badgeHtml = ' <span class="rsb-notif-badge">' + unseen.length + '</span>';

    notifContent = '<div class="radar-sb-section-label rsb-notif-label">' +
      '<span>\uD83D\uDD14 Notificaciones' + badgeHtml + '</span>' +
      markAllBtn +
    '</div>' + rows;

  } else {
    // AC-6: sin notifs vivas → mostrar historial si existe
    var hist = _notifHistory();
    if (hist.length) {
      var histRows = hist.slice().reverse().map(function(entry) {
        var sevClass = 'rsb-notif-hist--' + (entry.severity || 'info');
        var text = (entry.text || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return '<div class="rsb-notif-hist-item ' + sevClass + '">' +
          '<span class="rsb-notif-type rsb-notif-type--' + (entry.type || 'info') + '">' + (entry.type || '') + '</span>' +
          '<span class="rsb-notif-hist-text">' + text + '</span>' +
          '<span class="rsb-notif-ts">' + _fmtNotifTs(entry.ts) + '</span>' +
        '</div>';
      }).join('');

      notifContent = '<div class="radar-sb-section-label rsb-notif-label">' +
        '<span>\uD83D\uDD14 Historial</span>' +
      '</div>' + histRows;

    } else {
      // AC-6: sin notifs vivas NI historial → empty state unificado
      notifContent = '<div class="rsb-notif-empty rsb-notif-empty--full">' +
        '<span class="rsb-notif-empty-icon">\u2713</span>' +
        '<span class="rsb-notif-empty-label">Todo en orden</span>' +
      '</div>';
    }
  }

  return '<div class="radar-sb-section rsb-notif-section">' +
    notifContent +
  '</div>';
}

// TKT2 (REQ CAEL-0722-01): _rsbCfgExpanded, _renderCfgPanel() y _rsbToggleCfg() retirados —
// la configuración de alertas migró a modal propio (locus-notifications.js openNotifConfig()).
// El Radar Sidebar ya no renderiza ni gestiona expansión de ningún panel de config.
let _rsbAutoHideInited = false;
let _rsbHandlersInited = false;

// ── DATA HELPERS ──────────────────────────────────────────────────────────────

// Perf: acepta sessions pre-cacheadas para evitar call a getAISessions por card
function _sessionElapsed(ai, sessions) {
  try {
    const timerData = JSON.parse(localStorage.getItem('session-timer-' + ai.id) || 'null');
    if (timerData && timerData.startEpoch) {
      const ms = Date.now() - timerData.startEpoch;
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      return { label: `${m}m ${String(s).padStart(2,'0')}s`, ms };
    }
  } catch(e) {}
  const _sessions = sessions || getAISessions(ai.id);
  const last = _sessions.length ? _sessions[_sessions.length - 1] : null;
  if (last && last.date) {
    const ms = Date.now() - new Date(last.date).getTime();
    if (ms > 0 && ms < 86400000) {
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      return { label: `${m}m ${String(s).padStart(2,'0')}s`, ms };
    }
  }
  return null;
}

// Perf: acepta sessions pre-cacheadas
function _sessionTitle(ai, sessions) {
  try {
    const _sessions = sessions || getAISessions(ai.id);
    const last = _sessions.length ? _sessions[_sessions.length - 1] : null;
    return last && last.title ? last.title : '';
  } catch(e) { return ''; }
}

// Perf: acepta sessions pre-cacheadas
function _projPill(ai, sessions) {
  try {
    const aiSessions = sessions || getAISessions(ai.id);
    if (!aiSessions.length) return '';
    const lastSess = aiSessions[aiSessions.length - 1];
    const proj = lastSess && lastSess.projId
      ? (getState().projects || []).find(p => p.id === lastSess.projId)
      : null;
    if (!proj) return '';
    const color = proj.color || '#7c6af7';
    return `<span class="rsb-proj-pill" data-proj-color="${esc(color)}">${esc(proj.name)}</span>`;
  } catch(e) { return ''; }
}

// ── CARD BUILDERS ─────────────────────────────────────────────────────────────

// Perf: acepta sessions pre-cacheadas para evitar múltiples calls a getAISessions por card
function _buildSessionCard(ai, isInterrupted, sessions) {
  const pill = _projPill(ai, sessions);

  const cls = isInterrupted ? 'rsb-card interrupted-state' : 'rsb-card in-session-state';
  // TKT2 (CAEL-0717-01): interrupted-state conserva el badge — no_incluye. in-session-state
  // reemplaza el badge "● sesión" por + (registrar CHKPT) y ⚡ (sesión rápida).
  // TKT2 (REQ-restore-draft, Rune) AC1: badge de borrador — solo en la rama con botón +,
  // antes de él. localStorage.getItem es síncrono, sin costo relevante por card.
  const _draftBadge = (!isInterrupted && localStorage.getItem('draft-' + ai.id))
    ? `<span id="draft-${ai.id}" class="draft-dot visible" data-action="open-ingest" data-ai-id="${ai.id}" role="button" tabindex="0" title="Borrador pendiente — click para restaurar" aria-label="Borrador pendiente — click para restaurar"></span>`
    : '';
  const meta = isInterrupted
    ? `<span class="rsb-status-badge rsb-status-interrupted">⚡ en curso</span>`
    : `${_draftBadge}<button class="rsb-card-quick" data-action="open-ingest" data-ai-id="${ai.id}" title="Pegar CHECKPOINT" aria-label="Pegar CHECKPOINT"><i class="ti ti-plus" aria-hidden="true"></i></button>
       <button class="rsb-card-quick" data-action="openQuickCapture" data-ai-id="${ai.id}" title="Sesión rápida" aria-label="Sesión rápida">⚡</button>`;

  return `<div class="${cls}" data-action="navigateToCard" data-ai-id="${ai.id}" id="rsb-card-${ai.id}">
    <div class="rsb-card-row">
      <div class="rsb-card-name" title="${esc(ai.name)}">${esc(ai.name)}</div>
      <div class="rsb-card-meta">${meta}</div>
    </div>
    ${pill ? `<div class="rsb-card-proj">${pill}</div>` : ''}
  </div>`;
}

// Perf: acepta sessions pre-cacheadas
function _buildAvailableCard(ai, sessions) {
  const pill = _projPill(ai, sessions);

  let sinceLabel = '';
  if (ai.availableSince) {
    const epoch = new Date(ai.availableSince);
    const hh = String(epoch.getHours()).padStart(2,'0');
    const mm = String(epoch.getMinutes()).padStart(2,'0');
    sinceLabel = fmt12(`${hh}:${mm}`);
  } else if (ai.resetTime) {
    // T-202606-007: fallback usa resetTime (hora configurada de disponibilidad) — no last.date
    sinceLabel = fmt12(ai.resetTime);
  }

  const tsSpan = sinceLabel
    ? `<span class="rsb-card-ts">${sinceLabel}</span>`
    : '';

  return `<div class="rsb-card available" data-action="navigateToCard" data-ai-id="${ai.id}" id="rsb-card-${ai.id}">
    <div class="rsb-card-row">
      <div class="rsb-card-name" title="${esc(ai.name)}">${esc(ai.name)}</div>
      <div class="rsb-card-meta">
        ${tsSpan}
        ${localStorage.getItem('draft-' + ai.id) ? `<span id="draft-${ai.id}" class="draft-dot visible" data-action="open-ingest" data-ai-id="${ai.id}" role="button" tabindex="0" title="Borrador pendiente — click para restaurar" aria-label="Borrador pendiente — click para restaurar"></span>` : ''}
        <button class="rsb-card-quick" data-action="open-ingest" data-ai-id="${ai.id}" title="Pegar CHECKPOINT" aria-label="Pegar CHECKPOINT"><i class="ti ti-plus" aria-hidden="true"></i></button>
        <button class="rsb-card-quick" data-action="openQuickCapture" data-ai-id="${ai.id}" title="Sesión rápida" aria-label="Sesión rápida">⚡</button>
      </div>
    </div>
    ${pill ? `<div class="rsb-card-proj">${pill}</div>` : ''}
  </div>`;
}

function _buildExhaustedCard(ai) {
  const cd = getCD(ai.resetTime, ai.resetEpoch);
  const resetLabel = ai.resetTime ? `hasta ${fmt12(ai.resetTime)}` : '';
  return `<div class="rsb-card exhausted rsb-compact" data-action="navigateToCard" data-ai-id="${ai.id}" id="rsb-card-${ai.id}">
    <div class="rsb-card-row">
      <div class="rsb-card-name" title="${esc(ai.name)}">${esc(ai.name)}</div>
      <div class="rsb-card-meta"><span class="rsb-status-badge rsb-status-exhausted">🔴</span></div>
    </div>
    <div class="rsb-card-body">
      <div class="rsb-countdown" id="rsb-cd-${ai.id}">${cd || '--:--:--'}</div>
      ${resetLabel ? `<div class="rsb-reset-label">${resetLabel}</div>` : ''}
    </div>
  </div>`;
}

// ── RENDER PRINCIPAL ──────────────────────────────────────────────────────────

// R-202605-113: renderGlobalRadarSidebar — jerarquía, auto-hide Dock, cards por estado
// Grupos: En sesión → Disponibles → Agotadas (colapsadas por defecto)
// Eliminados: Sprint Activo · Top Pendientes
// Nuevos: timer en sesión, btn CKPT directo, Agotadas colapsables, notif oculta cuando count=0
// T-202605-118: dirty flag — render quirúrgico
let _radarDirty = false;
export function _markRadarDirty() { _radarDirty = true; }
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────

export function renderGlobalRadarSidebar() {
  if (!_radarDirty) return;
  // AC-3 T-202605-118: skip si hay foco activo dentro del sidebar
  const _rsbFocusEl = document.getElementById('radar-sidebar-cards');
  const _rsbAEl = document.activeElement;
  if (_rsbAEl && _rsbFocusEl && _rsbFocusEl.contains(_rsbAEl)) return;
  try {
  const sidebar = document.getElementById('global-radar-sidebar');
  const container = document.getElementById('radar-sidebar-cards');
  if (!sidebar || !container) return;

  const active = (getState().ais || []).filter(a => !a.archived);

  // Perf: cachear sessions por worker — una sola call a getAISessions por AI para todo el render
  const _sessionsCache = {};
  active.forEach(a => { _sessionsCache[a.id] = getAISessions(a.id); });
  const _getSessions = (ai) => _sessionsCache[ai.id] || [];

  const interrupted = active.filter(a => a.interrupted);
  // T-202606-037: inSession ordenado por recencia de última sesión — descendente
  // Timestamp: Math.max de createdAt||date||0 por sesión — consistente con B-202606-044
  const inSession   = active
    .filter(a => !a.interrupted && _isInSession(a))
    .sort((a, b) => {
      const tA = _getSessions(a).reduce((mx, s) => Math.max(mx, s.createdAt || s.date || 0), 0);
      const tB = _getSessions(b).reduce((mx, s) => Math.max(mx, s.createdAt || s.date || 0), 0);
      return tB - tA;
    });
  // T-202606-038: available ordenado alfabéticamente por nombre — reemplaza sort por _hoyMsUntilReset
  const available   = active
    .filter(a => a.status === 'available' && !a.interrupted && !_isInSession(a))
    .sort((a, b) => a.name.localeCompare(b.name));
  const exhausted   = active
    .filter(a => a.status === 'exhausted' && !a.interrupted)
    .sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b));

  // Perf: _computeNotifications una sola vez por render — reutilizada en header y body
  const _allNotifs = _computeNotifications();
  const _readSet   = _notifReadSet();
  const unseenCount = _allNotifs.filter(n => !_readSet.has(n.id)).length;

  // Notificaciones — oculto cuando count = 0
  // B mayor: _renderNotifSection solo cuando hay unseen — pasa params pre-calculados (AC-4)
  let html = unseenCount ? _renderNotifSection(_allNotifs, _readSet) : '';

  if (!active.length) {
    html += `<div class="rsb-empty-state">
      <div class="rsb-empty-icon">🤖</div>
      <div class="rsb-empty-title">Sin IAs registradas</div>
      <div class="rsb-empty-hint">Agrega una IA para comenzar a registrar sesiones.</div>
      <button class="rsb-empty-btn" data-action="openAddAI">+ Nueva IA</button>
    </div>`;
  } else {
    // Grupo 1: En sesión (interrupted + inSession — orden fijo: interrupted primero)
    const enSesionAll = [...interrupted, ...inSession];
    if (enSesionAll.length) {
      const cards = [
        ...interrupted.map(a => _buildSessionCard(a, true, _getSessions(a))),
        ...inSession.map(a => _buildSessionCard(a, false, _getSessions(a)))
      ].join('');
      html += `<div class="radar-sb-section">
        <div class="radar-sb-section-label">● En sesión (${enSesionAll.length})</div>
        <div class="rsb-section-body">${cards}</div>
      </div>`;
    }

    // Grupo 2: Disponibles
    if (available.length) {
      html += `<div class="radar-sb-section">
        <div class="radar-sb-section-label">🟢 Disponibles (${available.length})</div>
        <div class="rsb-section-body">${available.map(a => _buildAvailableCard(a, _getSessions(a))).join('')}</div>
      </div>`;
    }

    // Grupo 3: Agotadas — colapsado por defecto
    if (exhausted.length) {
      const nextMs = _hoyMsUntilReset(exhausted[0]);
      const nextMin = nextMs > 0 ? Math.ceil(nextMs / 60000) : 0;
      const metaLabel = nextMin > 0 ? `próxima en ${nextMin}min` : '';
      const isCollapsed = localStorage.getItem('rsb-agotadas-collapsed') !== '0';
      const colClass = isCollapsed ? ' rsb-section-collapsed' : '';
      html += `<div class="radar-sb-section${colClass}" id="rsb-group-agotadas">
        <div class="radar-sb-section-label rsb-collapsible" data-action="rsbToggleAgotadas">
          <span class="rsb-section-caret">▾</span>
          <span class="rsb-section-label-text">🔴 Agotadas (${exhausted.length})${metaLabel ? ` · ${metaLabel}` : ''}</span>
        </div>
        <div class="rsb-section-body">${exhausted.map(a => _buildExhaustedCard(a)).join('')}</div>
      </div>`;
    }
  }

  // B-[pendiente-ID]: guard de diff — evita reescribir innerHTML (y el parpadeo visual que
  // produce) cuando el html generado es idéntico al ya presente en el DOM. _saveFlush()
  // despacha shell:render-radar en cada guardado sin distinguir si el cambio afecta al radar —
  // este guard evita el costo visual de esa señal incondicional. No reemplaza el guard
  // _radarDirty (AC-3 foco / reset en finally) — opera después de él.
  const _rsbHtmlUnchanged = container.innerHTML === html;
  if (!_rsbHtmlUnchanged) {
    container.innerHTML = html;

    // B-04 CSS Purity: aplicar --rsb-proj-color via setProperty post-render — no inline style=
    container.querySelectorAll('.rsb-proj-pill[data-proj-color]').forEach(pill => {
      pill.style.setProperty('--rsb-proj-color', pill.dataset.projColor);
    });
  }

  // Header — contadores — R-202605-138: contadores migrados a fila 2
  const titleEl = sidebar.querySelector('.radar-sidebar-title');
  const row2El  = sidebar.querySelector('.rsb-header-row2');
  if (titleEl) {
    // Perf: reutilizar unseenCount ya calculado — no llamar _computeNotifications() de nuevo
    const notifBadge = unseenCount ? ` <span class="rsb-notif-hdr-badge">${unseenCount}</span>` : '';
    titleEl.innerHTML = `Workers${notifBadge}`;
  }
  if (row2El) {
    const sessionCount = interrupted.length + inSession.length;
    const counts = [
      sessionCount     ? `<span class="rsb-hdr-count rsb-hdr-session"><span class="rsb-hdr-dot"></span>${sessionCount} en sesión</span>`    : '',
      available.length ? `<span class="rsb-hdr-count rsb-hdr-available"><span class="rsb-hdr-dot"></span>${available.length} disponibles</span>` : '',
      exhausted.length ? `<span class="rsb-hdr-count rsb-hdr-exhausted"><span class="rsb-hdr-dot"></span>${exhausted.length} agotadas</span>` : '',
    ].filter(Boolean).join('');
    row2El.innerHTML = counts ? `<span class="rsb-hdr-counts">${counts}</span>` : '';
  }

  // CSS Purity: sprint bar pct via custom property
  container.querySelectorAll('.rsb-sprint-bar[data-pct]').forEach(el => {
    el.style.setProperty('--rsb-pct', el.dataset.pct + '%');
  });

  // Restaurar estado collapsed
  const _sbSaved = localStorage.getItem('radar-sidebar-collapsed');
  if (_sbSaved === '1') {
    sidebar.classList.add('collapsed');
    document.body.classList.remove('radar-sb-open');
    document.body.classList.add('radar-sb-collapsed');
  } else {
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('radar-sb-collapsed');
    document.body.classList.add('radar-sb-open');
  }

  updateTabNotifBadges(_allNotifs);
  if (_rsbSearchQuery) rsbFilterAIs(_rsbSearchQuery, true);
  } finally {
    _radarDirty = false; // AC-5 T-202605-118: reset en finally
  }
}

// ── COLLAPSE / GRUPOS ─────────────────────────────────────────────────────────

// R-202605-172: Toggle colapsar/expandir grupos del radar sidebar
// Función independiente de toggleCollapseAll() del tracker (que opera sobre getState().ais.showAll)
export function _rsbToggleCollapseAll() {
  const container = document.getElementById('radar-sidebar-cards');
  if (!container) return;
  const sections = container.querySelectorAll('.radar-sb-section');
  if (!sections.length) return;
  const allCollapsed = Array.from(sections).every(s => s.classList.contains('rsb-section-collapsed'));
  sections.forEach(s => {
    if (allCollapsed) {
      s.classList.remove('rsb-section-collapsed');
    } else {
      s.classList.add('rsb-section-collapsed');
    }
  });
}

// Toggle sección Agotadas (colapsable por defecto)
function _rsbToggleAgotadas() {
  const group = document.getElementById('rsb-group-agotadas');
  if (!group) return;
  const isNowCollapsed = group.classList.toggle('rsb-section-collapsed');
  localStorage.setItem('rsb-agotadas-collapsed', isNowCollapsed ? '1' : '0');
}

// ── RADAR SEARCH ──────────────────────────────────────────────────────────────

let _rsbSearchQuery = '';

export function rsbFilterAIs(query, silent) {
  _rsbSearchQuery = (query || '').trim();
  const q = _rsbSearchQuery.toLowerCase();
  const wrap = document.getElementById('rsb-search-wrap');
  const container = document.getElementById('radar-sidebar-cards');
  if (!container) return;

  if (wrap) wrap.classList.toggle('rsb-has-value', q.length > 0);

  const cards = container.querySelectorAll('.rsb-card');
  let visibleCount = 0;

  cards.forEach(card => {
    const nameEl = card.querySelector('.rsb-card-name');
    const name = (nameEl ? nameEl.textContent : card.textContent).toLowerCase();
    const match = !q || name.includes(q);
    card.classList.toggle('is-hidden', !match);
    if (match) visibleCount++;
  });

  // Ocultar secciones cuyos cards estén todos hidden
  container.querySelectorAll('.radar-sb-section').forEach(section => {
    const anyVisible = Array.from(section.querySelectorAll('.rsb-card'))
      .some(c => !c.classList.contains('is-hidden'));
    section.classList.toggle('is-hidden', !anyVisible);
  });

  // Empty state de búsqueda
  let noResults = container.querySelector('.rsb-search-no-results');
  if (q.length > 0 && visibleCount === 0) {
    if (!noResults) {
      noResults = document.createElement('p');
      noResults.className = 'rsb-search-no-results';
      noResults.textContent = 'Sin resultados';
      container.appendChild(noResults);
    }
  } else if (noResults) {
    noResults.remove();
  }

  if (!silent) {
    const input = document.getElementById('rsb-search-input');
    if (input) input.focus();
  }
}

export function rsbClearSearch() {
  const input = document.getElementById('rsb-search-input');
  if (input) input.value = '';
  rsbFilterAIs('');
}

// ── PIN / OFFSET / TOGGLE / INIT ──────────────────────────────────────────────

// R-202605-113: Pin toggle — desactiva auto-hide cuando está fijado
export function rsbTogglePin() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  const isPinned = sidebar.classList.toggle('rsb-pinned');
  localStorage.setItem('rsb-pinned', isPinned ? '1' : '0');
  const btn = document.getElementById('rsb-pin-btn');
  if (btn) btn.title = isPinned ? 'Desfijar sidebar' : 'Fijar sidebar';
}

function _rsbIsPinned() {
  return localStorage.getItem('rsb-pinned') === '1';
}

// R-202605-173: Centralizar aplicación de --toast-right-offset
function _applyToastOffset(isCollapsed) {
  try {
    if (!document.documentElement) return;
    if (isCollapsed) {
      document.documentElement.style.removeProperty('--toast-right-offset');
    } else {
      document.documentElement.style.setProperty('--toast-right-offset', '300px');
    }
  } catch(e) {}
}

// T-202604-254: Toggle sidebar Radar
export function toggleRadarSidebar() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  document.body.classList.toggle('radar-sb-collapsed', isCollapsed);
  document.body.classList.toggle('radar-sb-open', !isCollapsed);
  localStorage.setItem('radar-sidebar-collapsed', isCollapsed ? '1' : '0');
  _applyToastOffset(isCollapsed);
}

// T-202604-254: Init sidebar state from localStorage
export function _initRadarSidebarState() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  const saved = localStorage.getItem('radar-sidebar-collapsed');
  if (saved === '1') {
    sidebar.classList.add('collapsed');
    document.body.classList.remove('radar-sb-open');
    document.body.classList.add('radar-sb-collapsed');
    _applyToastOffset(true);
  } else {
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('radar-sb-collapsed');
    document.body.classList.add('radar-sb-open');
    _applyToastOffset(false);
  }

  // Restaurar estado pin
  if (localStorage.getItem('rsb-pinned') === '1') {
    sidebar.classList.add('rsb-pinned');
    const btn = document.getElementById('rsb-pin-btn');
    if (btn) btn.title = 'Desfijar sidebar';
  }

  // R-202605-113: Auto-hide — colapsa si el cursor sale y no regresa en 2.5s
  if (!_rsbAutoHideInited) {
    _rsbAutoHideInited = true;
    let _rsbHideTimer = null;

    sidebar.addEventListener('mouseleave', () => {
      if (sidebar.classList.contains('collapsed')) return;
      if (_rsbIsPinned()) return;
      _rsbHideTimer = setTimeout(() => {
        if (!sidebar.classList.contains('collapsed') && !_rsbIsPinned()) {
          toggleRadarSidebar();
        }
      }, 2500);
    });

    sidebar.addEventListener('mouseenter', () => {
      if (_rsbHideTimer) { clearTimeout(_rsbHideTimer); _rsbHideTimer = null; }
      if (sidebar.classList.contains('collapsed')) {
        toggleRadarSidebar();
      }
    });
  }

  // T-202605-045: Migrar handlers inline de index.html a addEventListener
  if (!_rsbHandlersInited) {
    _rsbHandlersInited = true;

    const pinBtn = document.getElementById('rsb-pin-btn');
    if (pinBtn) pinBtn.addEventListener('click', rsbTogglePin);

    const toggleBtn = document.getElementById('radar-sidebar-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleRadarSidebar);

    const strip = document.querySelector('.radar-sidebar-strip');
    if (strip) strip.addEventListener('click', toggleRadarSidebar);

    const addIaBtn = document.querySelector('.rsb-add-ia-btn');
    if (addIaBtn) addIaBtn.addEventListener('click', openAddAI);

    const searchInput = document.getElementById('rsb-search-input');
    if (searchInput) searchInput.addEventListener('input', () => rsbFilterAIs(searchInput.value));

    const searchClear = document.getElementById('rsb-search-clear');
    if (searchClear) searchClear.addEventListener('click', rsbClearSearch);
  }
}

// Bug 2: _initRadarSidebarState se extrajo de checkpoint.js pero el call quedó allá.
// Auto-invocación al cargar el módulo — guard para DOM no listo aún.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initRadarSidebarState);
} else {
  _initRadarSidebarState();
}

// ── B-202605-019: Event delegation para data-action en #global-radar-sidebar ──
document.addEventListener('DOMContentLoaded', function () {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;

  // Click delegation — cubre rsb-card, rsb-card-quick, rsb-empty-btn, rsb-collapsible,
  // rsb-notif-goto, rsb-notif-dismiss, rsb-notif-mark-all
  // REQ-restore-draft TKT2 (Rune) AC7: draft-dot es role="button" tabindex="0" (span, no
  // nativamente interactivo) — Enter/Espacio no disparan .click() por sí solos. Scoped al
  // propio elemento, no al delegador genérico de [data-action] — el resto de acciones ya
  // son <button> nativos y no lo necesitan.
  sidebar.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[role="button"][data-action="open-ingest"]');
    if (!el) return;
    e.preventDefault();
    _openIngestModal(el.dataset.aiId);
  });

  sidebar.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'navigateToCard') {
      navigateToCard(el.dataset.aiId);
    } else if (action === 'openQuickCapture') {
      e.stopPropagation();
      openQuickCapture(el.dataset.aiId);
    } else if (action === 'open-ingest') {
      e.stopPropagation();
      _openIngestModal(el.dataset.aiId);
    } else if (action === 'notifGoto') {
      e.stopPropagation();
      try { _notifGoto(JSON.parse(el.dataset.notifId)); } catch(_) {}
    } else if (action === 'notifDismiss') {
      e.stopPropagation();
      try { markNotifRead(JSON.parse(el.dataset.notifId)); } catch(_) {}
    } else if (action === 'notifMarkAll') {
      e.stopPropagation();
      markAllNotifsRead();
    } else if (action === 'openAddAI') {
      openAddAI();
    } else if (action === 'rsbToggleAgotadas') {
      _rsbToggleAgotadas();
    }
  });
  // TKT2 (REQ CAEL-0722-01): change delegation de cfgSetThreshold/cfgSetEnabled retirada —
  // re-scoped al contenedor del modal en locus-notifications.js (_wireAlertCfgDelegation).
});

// ── Exposición pública — T-202605-068 ───────────────────────────────────────

// T-[tmp:t-listeners-storage-render]: listeners shell:* — desacoplamiento de locus-storage.js
// locus-storage.js despacha shell:mark-radar-dirty + shell:render-radar en lugar de llamar directamente
window.addEventListener('shell:mark-radar-dirty', () => { _markRadarDirty(); });
window.addEventListener('shell:render-radar', () => { renderGlobalRadarSidebar(); });

// T-202606-007: listener storage:item-excluded migrado a locus-notifications.js — motor de notificaciones transversal
