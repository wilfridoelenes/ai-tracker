// locus-radar.js
// Última actualización: 2026-05-13 | Radar Sidebar — render, toggle, search, pin, collapse
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

// ── R-202605-119: _renderNotifSection — empty state + historial + panel config colapsable al pie ──
function _renderNotifSection() {
  const all    = _computeNotifications();
  const read   = _notifReadSet();
  const unseen = all.filter(function(n) { return !read.has(n.id); });

  _registerNotifActions(all);

  // AC-2: helper para formatear ts en card
  function _fmtNotifTs(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var pad = function(x) { return String(x).padStart(2,'0'); };
    return d.getDate() + '/' + pad(d.getMonth()+1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  var notifContent;
  if (unseen.length) {
    var rows = unseen.map(function(n) {
      var eid  = n.id.replace(/&/g,'&amp;').replace(/\"/g,'&quot;');
      var body = n.body.replace(/</g,'&lt;').replace(/>/g,'&gt;');
      var sid  = JSON.stringify(n.id);
      // AC-2: clases rsb-notif-type y rsb-notif-ts en cada card
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

  // Panel config colapsable — fuente de verdad única para umbrales
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

  var cfgPanel = '<div class="rsb-cfg-section" id="rsb-cfg-section">' +
    '<button class="rsb-cfg-toggle-btn" onclick="_rsbToggleCfg(event)" aria-expanded="false" id="rsb-cfg-toggle-btn">' +
      '<span>\uD83D\uDD14 Configurar alertas</span>' +
      '<span class="rsb-cfg-arrow" id="rsb-cfg-arrow">\u25B8</span>' +
    '</button>' +
    '<div class="rsb-cfg-body rsb-cfg-body--hidden" id="rsb-cfg-body">' +
      cfgRows +
    '</div>' +
  '</div>';

  return '<div class="radar-sb-section rsb-notif-section">' +
    notifContent +
    cfgPanel +
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
  if (arrow) arrow.textContent = isHidden ? '\u25B8' : '\u25BE';
  if (btn)   btn.setAttribute('aria-expanded', String(!isHidden));
}

// R-202605-113: renderGlobalRadarSidebar — jerarquía, auto-hide Dock, cards por estado
// Grupos: En sesión → Disponibles → Agotadas (colapsadas por defecto)
// Eliminados: Sprint Activo · Top Pendientes
// Nuevos: timer en sesión, btn CKPT directo, Agotadas colapsables, notif oculta cuando count=0

function renderGlobalRadarSidebar() {
  const sidebar = document.getElementById('global-radar-sidebar');
  const container = document.getElementById('radar-sidebar-cards');
  if (!sidebar || !container) return;

  const active = (state.ais || []).filter(a => !a.archived);

  const interrupted = active.filter(a => a.interrupted);
  const inSession   = active.filter(a => !a.interrupted && _isInSession(a));
  // Disponibles — ordenadas por tiempo desde última sesión (más descansada primero)
  const available   = active
    .filter(a => a.status === 'available' && !a.interrupted && !_isInSession(a))
    .sort((a, b) => _hoyAvailableSince(a) - _hoyAvailableSince(b));
  // Agotadas — ordenadas por tiempo restante (la que se libera antes, primero)
  const exhausted   = active
    .filter(a => a.status === 'exhausted' && !a.interrupted)
    .sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b));

  // ── helpers ──────────────────────────────────────────────────────────────

  function _sessionElapsed(ai) {
    // Tiempo transcurrido desde el inicio de la sesión activa
    try {
      const timerData = JSON.parse(localStorage.getItem('session-timer-' + ai.id) || 'null');
      if (timerData && timerData.startEpoch) {
        const ms = Date.now() - timerData.startEpoch;
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return { label: `${m}m ${String(s).padStart(2,'0')}s`, ms };
      }
    } catch(e) {}
    // Fallback: hora de última sesión
    const sessions = getAISessions(ai.id);
    const last = sessions.length ? sessions[sessions.length - 1] : null;
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

  function _sessionTitle(ai) {
    try {
      const sessions = getAISessions(ai.id);
      const last = sessions.length ? sessions[sessions.length - 1] : null;
      return last && last.title ? last.title : '';
    } catch(e) { return ''; }
  }

  function _projPill(ai) {
    try {
      const aiSessions = getAISessions(ai.id);
      if (!aiSessions.length) return '';
      const lastSess = aiSessions[aiSessions.length - 1];
      const proj = lastSess && lastSess.projId
        ? (state.projects || []).find(p => p.id === lastSess.projId)
        : null;
      if (!proj) return '';
      const color = proj.color || '#7c6af7';
      return `<span class="rsb-proj-pill" style="--rsb-proj-color:${color}">${esc(proj.name)}</span>`;
    } catch(e) { return ''; }
  }

  // ── card builders ─────────────────────────────────────────────────────────

  function _buildSessionCard(ai, isInterrupted) {
    const elapsed = _sessionElapsed(ai);
    const sessionTitle = _sessionTitle(ai);
    const pill = _projPill(ai);

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
        // Verificar si el código existe en el backlog — si no, mostrar como texto plano sin link
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

    // Botón CKPT directo — un click, sin abrir detalle
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

  function _buildAvailableCard(ai) {
    const pill = _projPill(ai);

    // Calcular timestamp de última sesión o reset — para .rsb-card-ts en meta
    let sinceLabel = '';
    if (ai.resetTime && ai.resetEpoch) {
      const epoch = new Date(ai.resetEpoch);
      const hh = String(epoch.getHours()).padStart(2,'0');
      const mm = String(epoch.getMinutes()).padStart(2,'0');
      sinceLabel = fmt12(`${hh}:${mm}`);
    } else {
      const aiSessions = getAISessions(ai.id);
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

    // Timestamp visible en meta — solo si hay valor
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

  // ── notificaciones (oculto cuando count = 0) ──────────────────────────────
  const notifSection = (() => {
    const notifHtml = _renderNotifSection();
    // Ocultar cuando no hay notificaciones sin leer
    const unseen = _computeNotifications().filter(n => !_notifReadSet().has(n.id)).length;
    if (!unseen) return '';
    return notifHtml;
  })();

  // ── construir HTML ─────────────────────────────────────────────────────────
  let html = notifSection;

  if (!active.length) {
    html = `<div class="rsb-empty-state">
      <div class="rsb-empty-icon">🤖</div>
      <div class="rsb-empty-title">Sin IAs registradas</div>
      <div class="rsb-empty-hint">Agrega una IA para comenzar a registrar sesiones.</div>
      <button class="rsb-empty-btn" onclick="openAddAI()">+ Nueva IA</button>
    </div>`;
  } else {
    // Grupo 1: En sesión (interrupted + inSession fusionados — orden fijo: interrupted primero)
    const enSesionAll = [...interrupted, ...inSession];
    if (enSesionAll.length) {
      const cards = [
        ...interrupted.map(a => _buildSessionCard(a, true)),
        ...inSession.map(a => _buildSessionCard(a, false))
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
        <div class="rsb-section-body">${available.map(a => _buildAvailableCard(a)).join('')}</div>
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

  container.innerHTML = html;

  // Header — contadores — R-202605-138: contadores migrados a fila 2
  const titleEl  = sidebar.querySelector('.radar-sidebar-title');
  const row2El   = sidebar.querySelector('.rsb-header-row2');
  if (titleEl) {
    const unseen = _computeNotifications().filter(n => !_notifReadSet().has(n.id)).length;
    const notifBadge = unseen ? ` <span class="rsb-notif-hdr-badge">${unseen}</span>` : '';
    // Fila 1: solo título + badge de notificaciones — sin contadores
    titleEl.innerHTML = `Centro de notificaciones${notifBadge}`;
  }
  if (row2El) {
    // Fila 2: contadores de disponibilidad — se ocultan si valor es 0
    const sessionCount  = interrupted.length + inSession.length;
    const counts = [
      sessionCount   ? `<span class="rsb-hdr-count rsb-hdr-session"><span class="rsb-hdr-dot"></span>${sessionCount}</span>`   : '',
      available.length  ? `<span class="rsb-hdr-count rsb-hdr-available"><span class="rsb-hdr-dot"></span>${available.length}</span>`  : '',
      exhausted.length  ? `<span class="rsb-hdr-count rsb-hdr-exhausted"><span class="rsb-hdr-dot"></span>${exhausted.length}</span>`  : '',
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
}

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

// ── RADAR SEARCH — Nova UX ────────────────────────────────────────────────────
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
    card.classList.toggle('rsb-hidden', !match);
    if (match) visibleCount++;
  });

  // Ocultar secciones cuyos cards estén todos hidden
  container.querySelectorAll('.radar-sb-section').forEach(section => {
    const anyVisible = Array.from(section.querySelectorAll('.rsb-card'))
      .some(c => !c.classList.contains('rsb-hidden'));
    section.classList.toggle('rsb-hidden', !anyVisible);
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

  // Focus solo si viene de interacción directa (no de re-render)
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
// ── END RADAR SEARCH ──────────────────────────────────────────────────────────

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
// isCollapsed true → removeProperty (sidebar colapsado, sin desplazamiento)
// isCollapsed false → setProperty 300px (sidebar expandido, desplazar toast-stack)
// Guard: si document.documentElement no está disponible, no lanza error
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
  // R-202605-173: delegar offset a función centralizada
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
    // R-202605-173: delegar offset a función centralizada (rama colapsado)
    _applyToastOffset(true);
  } else {
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('radar-sb-collapsed');
    document.body.classList.add('radar-sb-open');
    // R-202605-173: delegar offset a función centralizada (rama expandido)
    _applyToastOffset(false);
  }

  // Restaurar estado pin — reutiliza sidebar ya declarado arriba
  if (localStorage.getItem('rsb-pinned') === '1') {
    sidebar.classList.add('rsb-pinned');
    const btn = document.getElementById('rsb-pin-btn');
    if (btn) btn.title = 'Desfijar sidebar';
  }

  // R-202605-113: Auto-hide — colapsa si el cursor sale y no regresa en 2.5s
  // Usa toggleRadarSidebar() para mantener estado DOM + localStorage consistentes
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
