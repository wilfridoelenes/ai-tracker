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
          '<button class="rsb-notif-goto" onclick="event.stopPropagation();_notifGoto(' + sid + ')" title="Ir al \xEDtem">\u2192</button>' +
          '<button class="rsb-notif-dismiss" onclick="event.stopPropagation();markNotifRead(' + sid + ')" title="Marcar como le\xEDda">\u2713</button>' +
        '</div>' +
      '</div>';
    }).join('');

    var markAllBtn = unseen.length > 1
      ? '<button class="rsb-notif-mark-all" onclick="event.stopPropagation();markAllNotifsRead()">Marcar todas \u2713</button>'
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

  // B mayor: panel config extraído a _renderCfgPanel() — se llama siempre desde renderGlobalRadarSidebar()
  return '<div class="radar-sb-section rsb-notif-section">' +
    notifContent +
  '</div>';
}

// B mayor: variable de módulo — preserva estado de expansión del panel config entre re-renders
// B menor: _rsbToggleCfg y renderGlobalRadarSidebar leen/escriben este valor
// Expuesto en window para que openNotifConfig (locus-checkpoint-stats.js) pueda sincronizarlo
let _rsbCfgExpanded = false;
Object.defineProperty(window, '_rsbCfgExpanded', {
  get: function() { return _rsbCfgExpanded; },
  set: function(v) { _rsbCfgExpanded = !!v; },
  configurable: true
});

// B mayor: _renderCfgPanel — extraída de _renderNotifSection para llamarse siempre,
// independientemente de si hay notificaciones activas (unseen > 0 o no)
function _renderCfgPanel() {
  var cfg = _notifConfig();
  var cfgRows = Object.keys(_NOTIF_DEFAULTS).map(function(key) {
    var def = cfg[key];
    var thrInput = (typeof def.threshold === 'number' && def.threshold > 0)
      ? '<input class="rsb-cfg-thr" type="number" min="1" max="365" value="' + def.threshold + '"' +
        (def.enabled ? '' : ' disabled') +
        ' onchange="_notifConfigSetThreshold(\''  + key + '\',this.value)" onclick="event.stopPropagation()">' +
        '<span class="rsb-cfg-thr-unit">d</span>'
      : '';
    return '<div class="rsb-cfg-row">' +
      '<label class="rsb-cfg-label">' + def.label + '</label>' +
      '<div class="rsb-cfg-controls">' +
        thrInput +
        '<input class="rsb-cfg-toggle" type="checkbox"' + (def.enabled ? ' checked' : '') +
          ' onchange="_notifConfigSetEnabled(\''  + key + '\',this.checked)" onclick="event.stopPropagation()">' +
      '</div>' +
    '</div>';
  }).join('');

  // B menor: aplicar estado de expansión preservado en _rsbCfgExpanded
  var bodyClass = _rsbCfgExpanded ? 'rsb-cfg-body' : 'rsb-cfg-body rsb-cfg-body--hidden';
  var arrowChar = _rsbCfgExpanded ? '\u25BE' : '\u25B8';
  var ariaExpanded = _rsbCfgExpanded ? 'true' : 'false';

  return '<div class="rsb-cfg-section" id="rsb-cfg-section">' +
    '<button class="rsb-cfg-toggle-btn" onclick="_rsbToggleCfg(event)" aria-expanded="' + ariaExpanded + '" id="rsb-cfg-toggle-btn">' +
      '<span>\uD83D\uDD14 Configurar alertas</span>' +
      '<span class="rsb-cfg-arrow" id="rsb-cfg-arrow">' + arrowChar + '</span>' +
    '</button>' +
    '<div class="' + bodyClass + '" id="rsb-cfg-body">' +
      cfgRows +
    '</div>' +
  '</div>';
}

// R-202605-119: toggle del panel config en el Radar Sidebar
function _rsbToggleCfg(e) {
  if (e) e.stopPropagation();
  var body  = document.getElementById('rsb-cfg-body');
  var arrow = document.getElementById('rsb-cfg-arrow');
  var btn   = document.getElementById('rsb-cfg-toggle-btn');
  if (!body) return;
  var isHidden = body.classList.toggle('rsb-cfg-body--hidden');
  _rsbCfgExpanded = !isHidden; // B menor: sincronizar variable de módulo
  if (arrow) arrow.textContent = isHidden ? '\u25B8' : '\u25BE';
  if (btn)   btn.setAttribute('aria-expanded', String(!isHidden));
}

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
      ? (state.projects || []).find(p => p.id === lastSess.projId)
      : null;
    if (!proj) return '';
    const color = proj.color || '#7c6af7';
    return `<span class="rsb-proj-pill" data-proj-color="${esc(color)}">${esc(proj.name)}</span>`;
  } catch(e) { return ''; }
}

// ── CARD BUILDERS ─────────────────────────────────────────────────────────────

// Perf: acepta sessions pre-cacheadas para evitar múltiples calls a getAISessions por card
function _buildSessionCard(ai, isInterrupted, sessions) {
  const elapsed = _sessionElapsed(ai, sessions);
  const sessionTitle = _sessionTitle(ai, sessions);
  const pill = _projPill(ai, sessions);

  const warnClass = elapsed && elapsed.ms > 3600000 ? ' rsb-elapsed-warn' : '';
  const cls = isInterrupted ? 'rsb-card interrupted-state' : 'rsb-card in-session-state';
  const badge = isInterrupted
    ? `<span class="rsb-status-badge rsb-status-interrupted">⚡ en curso</span>`
    : `<span class="rsb-status-badge rsb-status-session">● sesión</span>`;

  const quickBtn = `<button class="rsb-card-quick" onclick="event.stopPropagation();openQuickCapture('${ai.id}')" title="Sesión rápida">⚡</button>`;

  let sessionInfo = '';
  if (!isInterrupted) {
    const elapsedHtml = elapsed
      ? `<span class="rsb-session-elapsed${warnClass}" id="rsb-elapsed-${ai.id}">${elapsed.label}</span>`
      : '';
    const titleHtml = sessionTitle
      ? `<span class="rsb-session-title" id="rsb-session-title-${ai.id}">${esc(sessionTitle.substring(0, 28))}${sessionTitle.length > 28 ? '…' : ''}</span>`
      : '';
    sessionInfo = `<div class="rsb-card-session-info">${titleHtml}${elapsedHtml}</div>`;
  } else {
    sessionInfo = `<div class="rsb-interrupted-badge">⚡ Sesión en curso</div>`;
  }

  // R-202605-177: chip de ítem activo — primer código de trackerRefs de la última sesión
  let activeItemChip = '';
  try {
    const lastSess = (typeof getLastAISession === 'function') ? getLastAISession(ai.id) : null;
    if (lastSess && lastSess.trackerRefs && lastSess.trackerRefs.length > 0) {
      const code = lastSess.trackerRefs[0];
      let codeExists = false;
      try {
        const tracker = (typeof getActiveTracker === 'function') ? getActiveTracker() : null;
        if (tracker && tracker.items) {
          codeExists = tracker.items.some(i => i.code === code);
        }
      } catch (_e) {}
      if (codeExists) {
        activeItemChip = `<div class="rsb-card-active-item">
          <button class="rsb-active-item-btn" onclick="event.stopPropagation();typeof navigateToItem==='function'&&navigateToItem('${esc(code)}')" title="Ver ítem ${esc(code)}">${esc(code)}</button>
        </div>`;
      } else if (code) {
        activeItemChip = `<div class="rsb-card-active-item">
          <span class="rsb-active-item-code">${esc(code)}</span>
        </div>`;
      }
    }
  } catch (_e) {}

  const ckptBtn = `<button class="rsb-ckpt-direct-btn" onclick="event.stopPropagation();showCheckpointPanel && showCheckpointPanel('${ai.id}'); navigateToCard('${ai.id}')">
    ⬡ checkpoint
  </button>`;

  return `<div class="${cls}" onclick="navigateToCard('${ai.id}')" id="rsb-card-${ai.id}">
    <div class="rsb-card-row">
      <div class="rsb-card-name" title="${esc(ai.name)}">${esc(ai.name)}</div>
      <div class="rsb-card-meta">${badge}${quickBtn}</div>
    </div>
    ${pill ? `<div class="rsb-card-proj">${pill}</div>` : ''}
    ${activeItemChip}
    ${sessionInfo}
    ${ckptBtn}
  </div>`;
}

// Perf: acepta sessions pre-cacheadas
function _buildAvailableCard(ai, sessions) {
  const pill = _projPill(ai, sessions);

  let sinceLabel = '';
  if (ai.resetTime && ai.resetEpoch) {
    const epoch = new Date(ai.resetEpoch);
    const hh = String(epoch.getHours()).padStart(2,'0');
    const mm = String(epoch.getMinutes()).padStart(2,'0');
    sinceLabel = fmt12(`${hh}:${mm}`);
  } else {
    const aiSessions = sessions || getAISessions(ai.id);
    const last = aiSessions.length ? aiSessions[aiSessions.length - 1] : null;
    if (last && last.date) {
      const d = new Date(last.date);
      if (!isNaN(d)) {
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        sinceLabel = fmt12(`${hh}:${mm}`);
      }
    }
  }

  const tsSpan = sinceLabel
    ? `<span class="rsb-card-ts">${sinceLabel}</span>`
    : '';

  return `<div class="rsb-card available" onclick="navigateToCard('${ai.id}')" id="rsb-card-${ai.id}">
    <div class="rsb-card-row">
      <div class="rsb-card-name" title="${esc(ai.name)}">${esc(ai.name)}</div>
      <div class="rsb-card-meta">
        ${tsSpan}
        <span class="rsb-status-badge rsb-status-available">🟢</span>
        <button class="rsb-card-quick" onclick="event.stopPropagation();openQuickCapture('${ai.id}')" title="Sesión rápida">⚡</button>
      </div>
    </div>
    ${pill ? `<div class="rsb-card-proj">${pill}</div>` : ''}
  </div>`;
}

function _buildExhaustedCard(ai) {
  const cd = getCD(ai.resetTime, ai.resetEpoch);
  const resetLabel = ai.resetTime ? `hasta ${fmt12(ai.resetTime)}` : '';
  return `<div class="rsb-card exhausted rsb-compact" onclick="navigateToCard('${ai.id}')" id="rsb-card-${ai.id}">
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
function _markRadarDirty() { _radarDirty = true; }
window._markRadarDirty = _markRadarDirty;

function renderGlobalRadarSidebar() {
  if (!_radarDirty) return;
  // AC-3 T-202605-118: skip si hay foco activo dentro del sidebar
  const _rsbFocusEl = document.getElementById('radar-sidebar-cards');
  const _rsbAEl = document.activeElement;
  if (_rsbAEl && _rsbFocusEl && _rsbFocusEl.contains(_rsbAEl)) return;
  try {
  const sidebar = document.getElementById('global-radar-sidebar');
  const container = document.getElementById('radar-sidebar-cards');
  if (!sidebar || !container) return;

  const active = (state.ais || []).filter(a => !a.archived);

  // Perf: cachear sessions por worker — una sola call a getAISessions por AI para todo el render
  const _sessionsCache = {};
  active.forEach(a => { _sessionsCache[a.id] = getAISessions(a.id); });
  const _getSessions = (ai) => _sessionsCache[ai.id] || [];

  const interrupted = active.filter(a => a.interrupted);
  const inSession   = active.filter(a => !a.interrupted && _isInSession(a));
  const available   = active
    .filter(a => a.status === 'available' && !a.interrupted && !_isInSession(a))
    .sort((a, b) => _hoyAvailableSince(a) - _hoyAvailableSince(b));
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
      <button class="rsb-empty-btn" onclick="openAddAI()">+ Nueva IA</button>
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
        <div class="radar-sb-section-label rsb-collapsible" onclick="_rsbToggleAgotadas()">
          <span class="rsb-section-caret">▾</span>
          <span class="rsb-section-label-text">🔴 Agotadas (${exhausted.length})${metaLabel ? ` · ${metaLabel}` : ''}</span>
        </div>
        <div class="rsb-section-body">${exhausted.map(a => _buildExhaustedCard(a)).join('')}</div>
      </div>`;
    }
  }

  // B-202605-009: leer estado real del DOM ANTES de destruirlo con innerHTML
  // _rsbCfgExpanded puede estar desincronizado si el panel fue expandido sin pasar por openNotifConfig
  var _cfgBodyEl = document.getElementById('rsb-cfg-body');
  if (_cfgBodyEl) {
    _rsbCfgExpanded = !_cfgBodyEl.classList.contains('rsb-cfg-body--hidden');
  }

  container.innerHTML = html;

  // B-04 CSS Purity: aplicar --rsb-proj-color via setProperty post-render — no inline style=
  container.querySelectorAll('.rsb-proj-pill[data-proj-color]').forEach(pill => {
    pill.style.setProperty('--rsb-proj-color', pill.dataset.projColor);
  });

  // B mayor: _renderCfgPanel siempre presente en el DOM — independiente de unseen y de active.length
  // Se inserta después de innerHTML para sobrevivir al bloque empty-state
  container.insertAdjacentHTML('beforeend', _renderCfgPanel());

  // Header — contadores — R-202605-138: contadores migrados a fila 2
  const titleEl = sidebar.querySelector('.radar-sidebar-title');
  const row2El  = sidebar.querySelector('.rsb-header-row2');
  if (titleEl) {
    // Perf: reutilizar unseenCount ya calculado — no llamar _computeNotifications() de nuevo
    const notifBadge = unseenCount ? ` <span class="rsb-notif-hdr-badge">${unseenCount}</span>` : '';
    titleEl.innerHTML = `Centro de notificaciones${notifBadge}`;
  }
  if (row2El) {
    const sessionCount = interrupted.length + inSession.length;
    const counts = [
      sessionCount     ? `<span class="rsb-hdr-count rsb-hdr-session"><span class="rsb-hdr-dot"></span>${sessionCount}</span>`    : '',
      available.length ? `<span class="rsb-hdr-count rsb-hdr-available"><span class="rsb-hdr-dot"></span>${available.length}</span>` : '',
      exhausted.length ? `<span class="rsb-hdr-count rsb-hdr-exhausted"><span class="rsb-hdr-dot"></span>${exhausted.length}</span>` : '',
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

  updateTabNotifBadges();
  if (_rsbSearchQuery) rsbFilterAIs(_rsbSearchQuery, true);
  } finally {
    _radarDirty = false; // AC-5 T-202605-118: reset en finally
  }
}

// ── COLLAPSE / GRUPOS ─────────────────────────────────────────────────────────

// R-202605-172: Toggle colapsar/expandir grupos del radar sidebar
// Función independiente de toggleCollapseAll() del tracker (que opera sobre state.ais.showAll)
function _rsbToggleCollapseAll() {
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
window._rsbToggleCollapseAll = _rsbToggleCollapseAll;

// Toggle sección Agotadas (colapsable por defecto)
function _rsbToggleAgotadas() {
  const group = document.getElementById('rsb-group-agotadas');
  if (!group) return;
  const isNowCollapsed = group.classList.toggle('rsb-section-collapsed');
  localStorage.setItem('rsb-agotadas-collapsed', isNowCollapsed ? '1' : '0');
}

// ── RADAR SEARCH ──────────────────────────────────────────────────────────────

let _rsbSearchQuery = '';

function rsbFilterAIs(query, silent) {
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

function rsbClearSearch() {
  const input = document.getElementById('rsb-search-input');
  if (input) input.value = '';
  rsbFilterAIs('');
}

// ── PIN / OFFSET / TOGGLE / INIT ──────────────────────────────────────────────

// R-202605-113: Pin toggle — desactiva auto-hide cuando está fijado
function rsbTogglePin() {
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
function toggleRadarSidebar() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  document.body.classList.toggle('radar-sb-collapsed', isCollapsed);
  document.body.classList.toggle('radar-sb-open', !isCollapsed);
  localStorage.setItem('radar-sidebar-collapsed', isCollapsed ? '1' : '0');
  _applyToastOffset(isCollapsed);
}

// T-202604-254: Init sidebar state from localStorage
function _initRadarSidebarState() {
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
  if (!window._rsbAutoHideInited) {
    window._rsbAutoHideInited = true;
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
}

// Bug 2: _initRadarSidebarState se extrajo de checkpoint.js pero el call quedó allá.
// Auto-invocación al cargar el módulo — guard para DOM no listo aún.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initRadarSidebarState);
} else {
  _initRadarSidebarState();
}
