// locus-tracker.js
// Última actualización: 2026-05-19 UTC-6
// Módulo: Tab Tracker — render, cards de IAs, session list, log card, detail panel, mini-hist
// Requiere: locus-storage.js, locus-toast.js cargados ANTES en index.html
// Cargado por: ai-tracker-checkpoint.js (implícito via orden de index.html)

let _trackerSelectedId = null;

// ── R-202604-078: Vista Por IA / Historial ──────────────────────────────
let _trackerCurrentView = 'poria'; // 'poria' | 'historial'
let _trackerViewProjFilter = '';

function _trackerSetView(view) {
  _trackerCurrentView = view;

  // toggle buttons
  const btnPoria    = document.getElementById('tvh-btn-poria');
  const btnHistorial = document.getElementById('tvh-btn-historial');
  if (btnPoria)    { btnPoria.classList.toggle('active', view === 'poria');    btnPoria.setAttribute('aria-pressed', view === 'poria' ? 'true' : 'false'); }
  if (btnHistorial) { btnHistorial.classList.toggle('active', view === 'historial'); btnHistorial.setAttribute('aria-pressed', view === 'historial' ? 'true' : 'false'); }

  // panel classes
  const tab = document.getElementById('tab-tracker');
  if (!tab) return;
  tab.classList.toggle('tracker-view--poria',    view === 'poria');
  tab.classList.toggle('tracker-view--historial', view === 'historial');

  // populate project selector cada vez que cambia la vista
  _trackerViewPopulateProjects();

  if (view === 'historial') {
    // Vista B: render col 1 agrupada por día + col 2 global hist
    _trackerHistDayRender();
    if (typeof _trackerRenderHist === 'function') _trackerRenderHist();
  } else if (view === 'poria') {
    // Vista A: persistencia — si hay sesión seleccionada, aterrizar en su IA
    if (_trackerHistSelectedSessId) {
      const allSess = (typeof getAllSessions === 'function') ? getAllSessions() : [];
      const sess = allSess.find(s => s.id === _trackerHistSelectedSessId);
      if (sess && sess.aiId) {
        navigateToCard(sess.aiId);
        return;
      }
    }
    // fallback: re-render normal + mini-hist
    if (typeof render === 'function') render();
    if (typeof _trackerRenderMiniHist === 'function') _trackerRenderMiniHist(_trackerSelectedId);
  }
}

function _trackerViewPopulateProjects() {
  const sel = document.getElementById('tvh-proj-select');
  if (!sel) return;
  const projects = (state.projects || []).filter(p => p.status !== 'paused');
  const current = _trackerViewProjFilter;
  sel.innerHTML = '<option value="">Todos los proyectos</option>' +
    projects.map(p => `<option value="${esc(p.id)}"${p.id === current ? ' selected' : ''}>${esc((p.icon || '📁') + ' ' + p.name)}</option>`).join('');
  // B-202605-269: ocultar el select si solo hay 0 o 1 proyecto — no aporta filtrado útil
  sel.classList.toggle('tvh-proj-single', projects.length <= 1);
}

function _trackerViewProjChange() {
  const sel = document.getElementById('tvh-proj-select');
  _trackerViewProjFilter = sel ? sel.value : '';
  // sincronizar con filtro de historial col 2 existente
  _trackerHistProjFilter = _trackerViewProjFilter;
  if (_trackerCurrentView === 'poria') {
    if (typeof _trackerRenderMiniHist === 'function') _trackerRenderMiniHist(_trackerSelectedId);
  } else {
    if (typeof _trackerRenderHist === 'function') _trackerRenderHist();
  }
  // re-render col 1 Vista B si está activa
  if (_trackerCurrentView === 'historial') _trackerHistDayRender();
}

// ── END R-202604-078 Entrega 1 ──────────────────────────────────────────

// ── R-202604-078 Entrega 2: Vista Historial — col 1 agrupada por día ───

function _trackerHistDayRender() {
  const bodyEl = document.getElementById('tvh-hist-col1-body');
  if (!bodyEl) return;

  const periodSel = document.getElementById('tvh-hist-period');
  const days = periodSel ? parseInt(periodSel.value, 10) : 7;

  let allSessions = (typeof getAllSessions === 'function') ? getAllSessions() : [];

  // filtro por proyecto (sincronizado con tvh-proj-select)
  if (_trackerViewProjFilter) {
    allSessions = allSessions.filter(s => s.projectId === _trackerViewProjFilter);
  }

  // filtro por período
  if (days > 0) {
    const cutoff = Date.now() - days * 86400000;
    allSessions = allSessions.filter(s => {
      const ts = s.updatedAt || s.createdAt || 0;
      return ts >= cutoff;
    });
  }

  // más reciente primero
  const sorted = [...allSessions].sort((a, b) => {
    const ta = a.updatedAt || a.createdAt || 0;
    const tb = b.updatedAt || b.createdAt || 0;
    return tb - ta;
  });

  if (!sorted.length) {
    bodyEl.innerHTML = `<div class="tvh-hist-empty"><span class="tvh-hist-empty-icon">📋</span><span>Sin sesiones en este período</span></div>`;
    return;
  }

  // Agrupar por fecha YYYY-MM-DD
  const groups = [];
  const groupMap = {};
  sorted.forEach(s => {
    const ts = s.updatedAt || s.createdAt || 0;
    const dateKey = ts ? new Date(ts).toISOString().slice(0, 10) : 'sin-fecha';
    if (!groupMap[dateKey]) {
      groupMap[dateKey] = [];
      groups.push(dateKey);
    }
    groupMap[dateKey].push(s);
  });

  const today    = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  bodyEl.innerHTML = groups.map(dateKey => {
    let dayLabel = dateKey;
    if (dateKey === today)     dayLabel = 'Hoy';
    else if (dateKey === yesterday) dayLabel = 'Ayer';
    else {
      // format as "lun 28 abr"
      try {
        const d = new Date(dateKey + 'T12:00:00');
        dayLabel = d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
      } catch(_) { dayLabel = dateKey; }
    }

    const rows = groupMap[dateKey].map(s => {
      const ai = (state.ais || []).find(a => a.id === s.aiId);
      const aiName = ai ? esc(ai.name) : '—';
      const isActive = s.id === _trackerHistSelectedSessId;
      // R-202605-162: timestamp relativo bajo el título — usa helper compartido
      const tsLabel = _sessRelTsShared(s);
      const tsHtml = tsLabel ? `<span class="tvh-hist-day-row-ts">${esc(tsLabel)}</span>` : '';
      return `<div class="tvh-hist-day-row${isActive ? ' active' : ''}"
          data-sess-id="${s.id}"
          data-ai-id="${s.aiId}"
          onclick="_trackerHistDaySelect('${s.id}','${s.aiId}')">
        <span class="tvh-hist-day-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <span class="tvh-hist-day-row-ai">${aiName}</span>
        ${tsHtml}
      </div>`;
    }).join('');

    return `<div class="tvh-hist-day-group">
      <div class="tvh-hist-day-label">${dayLabel}<span class="tvh-hist-day-count">${groupMap[dateKey].length}</span></div>
      <div class="tvh-hist-day-rows">${rows}</div>
    </div>`;
  }).join('');
}

// Seleccionar sesión desde col 1 Vista B
function _trackerHistDaySelect(sessId, aiId) {
  _trackerHistSelectedSessId = sessId;

  // actualizar estado activo en col 1
  document.querySelectorAll('.tvh-hist-day-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // actualizar estado activo en col 2 (hist panel)
  document.querySelectorAll('.tracker-hist-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // col 2 en Vista B: mostrar preview de sesión via openDetail si disponible
  if (typeof openDetail === 'function') {
    openDetail(aiId, sessId);
  }

  // mobile: navegar a col 2
  if (window.innerWidth < 600 && typeof _trackerSwitchCol === 'function') {
    _trackerSwitchCol('hist');
  }
}

// ── END R-202604-078 Entrega 2 ──────────────────────────────────────────

// ── R-202605-162: Helper compartido — timestamp relativo para filas de sesión ─
// Usado por _trackerRenderMiniHist, _trackerHistDayRender y _buildLogRow
// Formato: mismo día → 'Hoy · HH:MM' | ayer → 'Ayer · HH:MM' |
//          2–6 días → 'Hace N días' | 7–13 días → 'Hace 1 semana' |
//          14–29 días → 'Hace N semanas' | 30+ días → 'DD mmm'
function _sessRelTsShared(s) {
  const ts = s.updatedAt || s.createdAt || 0;
  if (!ts) return (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '');
  const diffMs = Date.now() - ts;
  const diffD  = Math.floor(diffMs / 86400000);
  const todayKey = new Date().toISOString().slice(0, 10);
  const dateKey  = new Date(ts).toISOString().slice(0, 10);
  try {
    const hhmm = new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (dateKey === todayKey)      return `Hoy · ${hhmm}`;
    if (diffD === 1)               return `Ayer · ${hhmm}`;
  } catch(_) { /* fallthrough */ }
  if (diffD >= 2  && diffD <= 6)  return `Hace ${diffD} días`;
  if (diffD >= 7  && diffD <= 13) return 'Hace 1 semana';
  if (diffD >= 14 && diffD <= 29) return `Hace ${Math.floor(diffD / 7)} semanas`;
  try {
    return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  } catch(_) {
    return (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '');
  }
}

// Helper: hora fija por grupo — mini historial
// hoy   → 'HH:MM'
// ayer  → 'HH:MM'  (sección ya dice "Ayer")
// semana→ 'lun · HH:MM'
// anteriores → '10 may'
function _sessFixedTs(s, group) {
  const ts = s.updatedAt || s.createdAt || 0;
  if (!ts) return (s.dateShort || '');
  try {
    if (group === 'hoy' || group === 'ayer') {
      return new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (group === 'semana') {
      const dow  = new Date(ts).toLocaleDateString('es', { weekday: 'short' });
      const hhmm = new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${dow} · ${hhmm}`;
    }
    return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  } catch(_) {
    return (s.dateShort || '');
  }
}

// Helper: timestamp relativo dinámico para card sesión en curso
// 'ahora' · 'hace 1 minuto' · 'hace 3 horas' · 'hace 1 día'
function _cscardRelTs(ts) {
  if (!ts) return '';
  const diffMs  = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`;
  if (diffH   < 24) return `hace ${diffH} hora${diffH !== 1 ? 's' : ''}`;
  return `hace ${diffD} día${diffD !== 1 ? 's' : ''}`;
}
// ── END R-202605-162 helper ──────────────────────────────────────────────

// ── R-202604-078 Fase 2: Mini-historial de IA en Col2 (modo Por IA) ─────

// Render Col2 en modo Por IA: lista de sesiones de la IA seleccionada
function _trackerRenderMiniHist(aiId) {
  const panelEl  = document.getElementById('tracker-mini-hist-panel');
  const listEl   = document.getElementById('tracker-mini-hist-list');
  const titleEl  = document.getElementById('tracker-mini-hist-title');
  const countEl  = document.getElementById('tracker-mini-hist-count');
  const emptyEl  = document.getElementById('tracker-mini-hist-empty');
  if (!listEl) return;

  if (!aiId) {
    // T-202605-470: sin IA — título neutral
    if (titleEl) titleEl.textContent = 'Sesiones';
    if (countEl) { countEl.textContent = ''; countEl.classList.add('is-hidden'); }
    const lastMetaEl = document.getElementById('tracker-mini-hist-last');
    if (lastMetaEl) lastMetaEl.textContent = '';
    listEl.innerHTML = '<div class="tracker-mini-hist-empty"><span class="tracker-mini-hist-empty-icon">📋</span><span>Selecciona una IA</span></div>';
    return;
  }

  const allSessions = typeof getAllSessions === 'function' ? getAllSessions() : [];
  const aiSessions  = allSessions.filter(s => s.aiId === aiId);

  // R-202605-116 AC: excluir sesión en curso del mini historial
  const currentSess = (typeof _getCurrentSession === 'function') ? _getCurrentSession(aiId) : null;
  const pastSessions = currentSess
    ? aiSessions.filter(s => s.id !== currentSess.id)
    : aiSessions;

  // R-202605-116 AC: filtro de proyecto — usa selector global del tracker view
  const projFilter = _trackerViewProjFilter;
  const filtered = projFilter
    ? pastSessions.filter(s => s.projectId === projFilter)
    : pastSessions;

  // más reciente primero
  const sorted = [...filtered].reverse();

  // T-202605-470: header muestra conteo + último acceso — el nombre de la IA ya es visible en col 1
  const totalCount = aiSessions.length;
  if (titleEl) {
    titleEl.textContent = `${totalCount} sesión${totalCount !== 1 ? 'es' : ''}`;
  }
  const lastMetaEl = document.getElementById('tracker-mini-hist-last');
  if (lastMetaEl) {
    const lastSess = aiSessions.length ? aiSessions[aiSessions.length - 1] : null;
    lastMetaEl.textContent = lastSess
      ? ('Último: ' + ((typeof relDate === 'function' && lastSess.date) ? relDate(lastSess.date) : (lastSess.dateShort || lastSess.date || '')))
      : '';
  }

  if (countEl) {
    // Mostrar filtered count solo cuando hay filtro de proyecto activo
    if (projFilter && sorted.length !== totalCount) {
      countEl.textContent = sorted.length + ' filtradas';
      countEl.classList.remove('is-hidden');
    } else {
      countEl.textContent = '';
      countEl.classList.add('is-hidden');
    }
  }

  if (!sorted.length) {
    // T-202605-473: mensajes diferenciados — filtro activo vs sin sesiones reales
    const emptyMsg = projFilter
      ? 'Sin sesiones para este filtro'
      : (aiSessions.length === 0 ? 'Esta IA no tiene sesiones registradas' : 'Sin sesiones');
    listEl.innerHTML = `<div class="tracker-mini-hist-empty"><span class="tracker-mini-hist-empty-icon">📋</span><span>${emptyMsg}</span></div>`;
    return;
  }

  const projTracker = typeof getActiveTracker === 'function' ? getActiveTracker() : { items: [] };

  // R-202605-162: usa helper compartido — _sessRelTsShared definida antes de esta función
  const _sessRelTs = _sessRelTsShared;

  // Agrupar en Hoy / Ayer / Últimos 7 días / Anteriores
  const _nowMs = Date.now();
  const _localDateKey = (d) => {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const _todayKey  = _localDateKey(new Date());
  const _ydDate    = new Date(); _ydDate.setDate(_ydDate.getDate() - 1);
  const _yesterKey = _localDateKey(_ydDate);
  const _7dAgo     = _nowMs - 7 * 86400000;
  const _sessGroup = (s) => {
    const ts = s.updatedAt || s.createdAt || 0;
    if (!ts) return 'anteriores';
    const dateKey = _localDateKey(new Date(ts));
    if (dateKey === _todayKey)  return 'hoy';
    if (dateKey === _yesterKey) return 'ayer';
    if (ts >= _7dAgo)           return 'semana';
    return 'anteriores';
  };
  const _groupLabel = { hoy: 'Hoy', ayer: 'Ayer', semana: 'Últimos 7 días', anteriores: 'Anteriores' };
  const _groupOrder = ['hoy', 'ayer', 'semana', 'anteriores'];

  const _grouped = { hoy: [], ayer: [], semana: [], anteriores: [] };
  sorted.forEach(s => _grouped[_sessGroup(s)].push(s));

  // sesión en curso — para marcar in-progress
  const _inProgressSess = (typeof _getCurrentSession === 'function') ? _getCurrentSession(aiId) : null;

  const _renderRow = (s, group) => {
    const proj     = s.projectId ? (typeof getProjectById === 'function' ? getProjectById(s.projectId) : null) : null;
    const isActive = s.id === _trackerHistSelectedSessId;
    const isInProg = _inProgressSess && s.id === _inProgressSess.id;

    // badge de ítems vinculados
    const linkedItems = projTracker.items.filter(x => x.sessionId === s.id);
    const badgeHtml = linkedItems.length
      ? `<span class="sess-items-badge">${linkedItems.length}</span>`
      : '';

    // pill de proyecto
    const projPill = proj
      ? `<span class="sess-proj-pill">${esc(proj.name || proj.icon || '📁')}</span>`
      : '';

    // hora fija por grupo — no relativa
    const fixedTs  = _sessFixedTs(s, group);
    const tsHtml   = fixedTs ? `<span class="sess-timestamp">${fixedTs}</span>` : '';

    // separador meta (·) solo si hay proyecto Y hay timestamp
    const metaSep = (proj && fixedTs) ? `<span class="sess-meta-sep">·</span>` : '';

    // indicadores secundarios
    const starInd   = s.starred  ? `<span class="tracker-mini-hist-ind" title="Destacada">⭐</span>` : '';
    const reviewInd = s.inReview ? `<span class="tracker-mini-hist-ind" title="En revisión">🔍</span>` : '';

    const rowCls = [
      'tracker-mini-hist-row',
      'sess-row',
      isActive  ? 'active'               : '',
      isInProg  ? 'sess-row--in-progress' : ''
    ].filter(Boolean).join(' ');

    return `<div class="${rowCls}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        onclick="_trackerMiniHistSelect('${s.id}','${s.aiId}')">
      <div class="sess-row-top">
        <span class="sess-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        ${badgeHtml}
      </div>
      <div class="sess-row-bottom">
        ${projPill}${metaSep}${tsHtml}
        ${starInd}${reviewInd}
      </div>
    </div>`;
  };

  listEl.innerHTML = _groupOrder
    .filter(g => _grouped[g].length > 0)
    .map(g =>
      `<div class="sess-group-sep">${_groupLabel[g]}</div>` +
      _grouped[g].map(s => _renderRow(s, g)).join('')
    ).join('');

  // Auto-seleccionar la sesión más reciente si no hay ninguna seleccionada —
  // Col3 nunca queda vacío al cambiar de IA
  const latestSess = sorted[0];
  if (latestSess && !_trackerHistSelectedSessId) {
    _trackerHistSelectedSessId = latestSess.id;
    const firstRow = listEl.querySelector('.tracker-mini-hist-row');
    if (firstRow) firstRow.classList.add('active');
    if (typeof openDetail === 'function') openDetail(latestSess.aiId, latestSess.id);
  }

  // T-202605-471: scroll al row activo para que siempre quede visible
  requestAnimationFrame(() => {
    const activeRow = listEl.querySelector('.tracker-mini-hist-row.active');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

// Seleccionar sesión desde mini-hist (Col2 modo Por IA) → Col3 preview
function _trackerMiniHistSelect(sessId, aiId) {
  _trackerHistSelectedSessId = sessId;

  // resaltar en Col2
  document.querySelectorAll('.tracker-mini-hist-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // Col3: preview de sesión via openDetail
  if (typeof openDetail === 'function') {
    openDetail(aiId, sessId);
  }

  // mobile: navegar a col 3
  if (window.innerWidth < 900 && typeof _trackerSwitchCol === 'function') {
    _trackerSwitchCol('items');
  }
}

// ── END R-202604-078 Fase 2 ──────────────────────────────────────────────

// ── R-202605-116: Card sesión en curso — col 1, debajo del card IA ──────

function _getCurrentSession(aiId) {
  const allSess = (typeof getAllSessions === 'function') ? getAllSessions() : [];
  const aiSess  = allSess.filter(s => s.aiId === aiId);
  if (!aiSess.length) return null;
  const last = aiSess.reduce((a, b) =>
    (parseInt(b.id) || 0) > (parseInt(a.id) || 0) ? b : a
  );
  if (last && !last.resetAt && !last.quickCapture) return last;
  return null;
}

function _buildCurrentSessionCard(aiId) {
  const currentSess = _getCurrentSession(aiId);
  if (!currentSess) return null;

  const allSess   = (typeof getAllSessions === 'function') ? getAllSessions() : [];
  const aiSess    = allSess.filter(s => s.aiId === aiId);
  const sessIndex = aiSess.findIndex(s => s.id === currentSess.id);

  const continuousSess = [];
  for (let i = sessIndex; i >= 0; i--) {
    const s = aiSess[i];
    if (s.quickCapture) break;
    if (s.resetAt && i < sessIndex) break;
    continuousSess.push(s);
  }
  const shown = continuousSess.slice(0, 3);
  const total = continuousSess.length;

  const dateLabel = (typeof relDate === 'function' && currentSess.date)
    ? relDate(currentSess.date)
    : (currentSess.dateShort || '');

  const sessionRows = shown.map((s, idx) => {
    const isLatest = idx === 0;
    const summaryHtml = isLatest && s.summary
      ? `<div class="cscard-row-summary">${esc(s.summary.slice(0, 160))}${s.summary.length > 160 ? '…' : ''}</div>`
      : '';
    const refPills = (s.trackerRefs || []).slice(0, 4).map(code => {
      const t = (code[0] || '').toUpperCase();
      return `<span class="cscard-ref-pill cscard-ref-pill--${t.toLowerCase()}">${esc(code)}</span>`;
    }).join('');
    const latestCls = isLatest ? ' cscard-row--latest' : '';
    return `<div class="cscard-row${latestCls}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        onclick="_trackerMiniHistSelect('${s.id}','${s.aiId}')">
      <div class="cscard-row-top">
        <span class="cscard-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <span class="cscard-row-date">${isLatest ? dateLabel : ''}</span>
      </div>
      ${summaryHtml}
      ${refPills ? `<div class="cscard-row-refs">${refPills}</div>` : ''}
    </div>`;
  }).join('');

  const moreHtml = total > 3
    ? `<div class="cscard-more">+ ${total - 3} checkpoint${total - 3 !== 1 ? 's' : ''} anteriores</div>`
    : '';

  const el = document.createElement('div');
  el.className = 'current-session-card';
  el.id = 'current-session-card-' + aiId;
  const _cscardTs = currentSess.updatedAt || currentSess.createdAt || 0;
  const _cscardInitLabel = _cscardTs ? _cscardRelTs(_cscardTs) : '';
  el.innerHTML = `
    <div class="cscard-header">
      <span class="cscard-dot"></span>
      <span class="cscard-label">Sesión en curso</span>
      <span class="cscard-timer" id="cscard-timer-${aiId}" data-ai-id="${aiId}" data-ts="${_cscardTs}">${_cscardInitLabel}</span>
    </div>
    <div class="cscard-rows">
      ${sessionRows}
      ${moreHtml}
    </div>`;

  return el;
}

// ── END R-202605-116 ─────────────────────────────────────────────────────

function selectTrackerAI(aiId) {
  // DUP-05: cerrar preview de sesión al cambiar de Worker
  if (typeof closePopup === 'function') closePopup();
  // T-202604-373: skeleton rows en historial al cambiar de IA
  const _prevCard = _trackerSelectedId ? document.getElementById('card-' + _trackerSelectedId) : null;
  if (_prevCard) {
    const _prevList = _prevCard.querySelector('.sess-list');
    if (_prevList) {
      _prevList.innerHTML = '<div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div>';
    }
  }
  // Fase 2: resetear sesión seleccionada al cambiar de IA — mini-hist auto-selecciona la más reciente
  if (_trackerSelectedId !== aiId) _trackerHistSelectedSessId = null;
  _trackerSelectedId = aiId;
  if (typeof closeLogCard === 'function') closeLogCard();
  // R-202604-061 AC-5: try-catch defensivo — skeleton siempre se limpia
  try {
    render();
    // R-202604-061 AC-06: fade-in del panel de detalle al cambiar selección
    requestAnimationFrame(() => {
      const _newCard = document.getElementById('card-' + aiId);
      if (_newCard) {
        _newCard.classList.remove('detail-fade-in');
        void _newCard.offsetWidth; // force reflow
        _newCard.classList.add('detail-fade-in');
      }
    });
  } catch(e) {
    // skeleton cleanup garantizado aunque render falle
    const _fallbackCard = _prevCard || (document.getElementById('card-' + aiId));
    if (_fallbackCard) {
      const _fl = _fallbackCard.querySelector('.sess-list');
      if (_fl && _fl.querySelector('.skel-row')) _fl.innerHTML = '';
    }
    console.error('render() error in selectTrackerAI:', e);
  }
  _scrollToCard(aiId);
  // T-202605-446: iniciar/retomar cronómetro al seleccionar IA
  startSessionTimer(aiId);
  // R-202605-167: actualizar segmento 3 del breadcrumb al cambiar Worker seleccionado
  if (typeof _updateHeaderProjectLabel === 'function') _updateHeaderProjectLabel();
  // focus textarea si disponible
  setTimeout(() => {
    const ta = document.getElementById('ta-' + aiId);
    if (ta) { ta.focus(); enterFocusMode(aiId); }
  }, 80);
}

function _renderTrackerSidebar() {
  const nonArchived = state.ais.filter(ai => !ai.archived);
  const inSession = nonArchived.filter(ai => ai.status !== 'exhausted' && !ai.interrupted && _isInSession(ai));
  const available = nonArchived.filter(ai => ai.status !== 'exhausted' && !_isInSession(ai));
  const exhausted = nonArchived.filter(ai => ai.status === 'exhausted');
  const archived  = state.ais.filter(ai => ai.archived);

  const mkRow = (ai, forceInSession = false) => {
    const sel = _trackerSelectedId === ai.id ? ' selected' : '';
    const dot = ai.status === 'exhausted' ? 'exhausted'
              : ai.interrupted            ? 'interrupted'
              : forceInSession            ? 'insession'
              : 'available';
    // countdown para agotadas
    let cd = '';
    if (ai.status === 'exhausted' && ai.resetTime) {
      const [hh, mm] = ai.resetTime.split(':').map(Number);
      const now = new Date();
      const reset = new Date(now); reset.setHours(hh, mm, 0, 0);
      if (reset <= now) reset.setDate(reset.getDate() + 1);
      const diff = Math.max(0, Math.round((reset - now) / 60000));
      const h = Math.floor(diff / 60), m = diff % 60;
      cd = `<span class="tsb-ai-cd">${h}h${String(m).padStart(2,'0')}</span>`;
    }
    // T-202604-206: info secundaria — N sesiones · hace X
    const _aiSess = getAISessions(ai.id);
    const _sessCount = _aiSess.length;
    const _lastSess = _aiSess.length ? _aiSess[_aiSess.length - 1] : null;
    const _lastDate = _lastSess ? (_lastSess.date || _lastSess.dateShort || '') : '';
    const _rel = _lastDate && typeof relDate === 'function' ? relDate(_lastDate) : '';
    const _meta = _sessCount
      ? `<span class="tsb-ai-meta">${_sessCount} ses${_rel ? ' · ' + _rel : ''}</span>`
      : '';
    return `<div class="tsb-ai-row${sel}" onclick="selectTrackerAI('${ai.id}')" id="tsb-row-${ai.id}">
      <span class="tsb-ai-dot ${dot}"></span>
      <span class="tsb-ai-name">${esc(ai.name)}</span>
      ${_meta}
      ${cd}
    </div>`;
  };

  const isEl = document.getElementById('tsb-insession');
  const avEl = document.getElementById('tsb-available');
  const exEl = document.getElementById('tsb-exhausted');
  if (!avEl || !exEl) return;

  if (!state.ais.length) {
    if (isEl) isEl.innerHTML = '';
    avEl.innerHTML = `<div class="tsb-empty-hint">Sin IAs</div>`;
    exEl.innerHTML = '';
    return;
  }

  // En curso — ocultar sección si vacía
  if (isEl) {
    const isSection = isEl.closest('.tracker-sidebar-section');
    if (inSession.length) {
      isEl.innerHTML = inSession.map(ai => mkRow(ai, true)).join('');
      if (isSection) isSection.classList.remove('is-hidden');
    } else {
      isEl.innerHTML = '';
      if (isSection) isSection.classList.add('is-hidden');
    }
  }

  avEl.innerHTML = available.length
    ? available.map(ai => mkRow(ai)).join('')
    : `<div class="tsb-empty-hint">—</div>`;

  let exHtml = exhausted.map(ai => mkRow(ai)).join('');
  if (archived.length) {
    const isOpen = localStorage.getItem('archived-open') === '1';
    exHtml += `<div class="tsb-archived-toggle" onclick="this.classList.toggle('open');localStorage.setItem('archived-open',this.classList.contains('open')?'1':'0');_renderTrackerSidebar()">
      ${isOpen ? '▼' : '▶'} Archivadas (${archived.length})</div>`;
    if (isOpen) exHtml += archived.map(ai => mkRow(ai)).join('');
  }
  exEl.innerHTML = exHtml || `<div class="tsb-empty-hint">—</div>`;

  // arrancar ticker dinámico si hay agotadas con resetTime
  if (exhausted.some(ai => ai.resetTime)) _startSidebarTicker();
  else _stopSidebarTicker();
}

// ══════════════════════════════════════════════════════════════════════════════
// S-17: T-202605-446 · Cronómetro de sesión — card IA activa
// ══════════════════════════════════════════════════════════════════════════════

const _TIMER_KEY_PREFIX = 'ai-tracker-session-timer-';
let _timerIntervalId = null;

function _timerKey(aiId) { return _TIMER_KEY_PREFIX + aiId; }

function _getTimerData(aiId) {
  try {
    const raw = localStorage.getItem(_timerKey(aiId));
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function _setTimerData(aiId, data) {
  try { localStorage.setItem(_timerKey(aiId), JSON.stringify(data)); } catch(e) {}
}

function _clearTimerData(aiId) {
  try { localStorage.removeItem(_timerKey(aiId)); } catch(e) {}
}

function _timerIsActive(aiId) {
  const d = _getTimerData(aiId);
  return !!(d && d.running);
}

// Llamado al guardar sesión — detiene cronómetro y retorna tiempo total en ms
function stopSessionTimer(aiId) {
  const d = _getTimerData(aiId);
  if (!d) return 0;
  const elapsed = d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0);
  _setTimerData(aiId, { running: false, elapsed, startEpoch: null });
  _refreshTimerTick();
  _renderActiveWorkerChip();
  return elapsed;
}

// Llamado al abrir/seleccionar una IA — inicia o retoma cronómetro
function startSessionTimer(aiId) {
  const existing = _getTimerData(aiId);
  if (existing && existing.running) return; // ya corriendo
  const elapsed = existing ? existing.elapsed : 0;
  _setTimerData(aiId, { running: true, elapsed, startEpoch: Date.now() });
  _refreshTimerTick();
}

function _formatTimer(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function _renderTimerInCard(aiId) {
  const timerEl = document.getElementById('session-timer-' + aiId);
  const dotEl   = document.getElementById('session-timer-dot-' + aiId);
  if (!timerEl || !dotEl) return;
  const d = _getTimerData(aiId);
  if (!d) { timerEl.textContent = '00:00:00'; dotEl.className = 'session-timer-dot session-timer-dot--paused'; return; }
  const elapsed = d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0);
  timerEl.textContent = _formatTimer(elapsed);
  dotEl.className = 'session-timer-dot' + (d.running ? ' session-timer-dot--active' : ' session-timer-dot--paused');
  // Actualizar título de sesión activa en tiempo real
  const titleEl = document.getElementById('rsb-session-title-' + aiId);
  if (titleEl) {
    const ai = state.ais && state.ais.find(a => a.id === aiId);
    if (ai) {
      const sessions = getAISessions(aiId);
      const last = sessions.length ? sessions[sessions.length - 1] : null;
      const t = (last && last.title) ? last.title : '';
      titleEl.textContent = t.length > 28 ? t.substring(0, 28) + '\u2026' : t;
    }
  }
}

function _refreshTimerTick() {
  clearInterval(_timerIntervalId);
  _timerIntervalId = setInterval(() => {
    state.ais.forEach(ai => _renderTimerInCard(ai.id));
    _renderActiveWorkerChip();
    // Actualizar timestamps relativos en cards de sesión en curso
    document.querySelectorAll('.cscard-timer[data-ts]').forEach(el => {
      const ts = parseInt(el.dataset.ts, 10);
      if (ts) el.textContent = _cscardRelTs(ts);
    });
  }, 60000);
  // Actualización inmediata al arrancar el tick
  state.ais.forEach(ai => _renderTimerInCard(ai.id));
  _renderActiveWorkerChip();
  document.querySelectorAll('.cscard-timer[data-ts]').forEach(el => {
    const ts = parseInt(el.dataset.ts, 10);
    if (ts) el.textContent = _cscardRelTs(ts);
  });
}

// HTML del widget cronómetro — insertado en buildCard()
function _timerWidgetHtml(aiId) {
  const d = _getTimerData(aiId);
  const elapsed = d ? d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0) : 0;
  const dotCls = (d && d.running) ? 'session-timer-dot--active' : 'session-timer-dot--paused';
  return `<div class="session-timer-wrap">` +
    `<span class="session-timer-dot ${dotCls}" id="session-timer-dot-${aiId}"></span>` +
    `<span class="session-timer-display" id="session-timer-${aiId}">${_formatTimer(elapsed)}</span>` +
    `</div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// R-202605-170: Worker activo chip — nombre y cronómetro en header
// ══════════════════════════════════════════════════════════════════════════════

function _renderActiveWorkerChip() {
  const chip = document.getElementById('header-active-worker');
  if (!chip) return;

  // Buscar el Worker con timer activo — si hay más de uno, el de mayor elapsed
  let best = null;
  let bestElapsed = -1;
  (state.ais || []).forEach(ai => {
    const d = _getTimerData(ai.id);
    if (!d || !d.running) return;
    const elapsed = d.elapsed + (Date.now() - d.startEpoch);
    if (elapsed > bestElapsed) { best = ai; bestElapsed = elapsed; }
  });

  if (!best) {
    chip.classList.add('is-hidden');
    return;
  }

  const h = Math.floor(bestElapsed / 3600000);
  const m = Math.floor((bestElapsed % 3600000) / 60000);
  const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

  chip.querySelector('.hwc-name').textContent = best.name || best.id;
  chip.querySelector('.hwc-time').textContent = timeStr;
  chip.dataset.hwcAiId = best.id;
  chip.classList.remove('is-hidden');
}

function _hwcClick() {
  const chip = document.getElementById('header-active-worker');
  const aiId = chip && chip.dataset.hwcAiId;
  if (!aiId) return;
  if (typeof selectTrackerAI === 'function') selectTrackerAI(aiId);
  if (typeof switchTab === 'function' && document.querySelector('.tab-btn.active')?.dataset.tab !== 'tracker') {
    switchTab('tracker');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// S-17: T-202605-447 · Sesión sugerida — banner de arranque
// ══════════════════════════════════════════════════════════════════════════════

function _computeSuggestionScore(ai) {
  // Peso 40%: días desde última sesión (más días = más urgente)
  const allSess = getAISessions(ai.id);
  let daysSinceScore = 0;
  if (allSess.length) {
    const lastSess = allSess.reduce((a, b) => {
      const ta = new Date(a.date || 0).getTime();
      const tb = new Date(b.date || 0).getTime();
      return ta > tb ? a : b;
    });
    const daysSince = (Date.now() - new Date(lastSess.date || 0).getTime()) / 86400000;
    daysSinceScore = Math.min(daysSince / 7, 1); // normalizado a 7 días
  } else {
    daysSinceScore = 1; // nunca usado = máxima urgencia
  }

  // Peso 40%: ítems high pendientes asignados a esta IA
  const aiSigla = ai.role || '';
  const highPending = (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(i =>
    i.status === 'pendiente' && i.priority === 'high' &&
    aiSigla && i.role && i.role.includes(aiSigla)
  ).length;
  const highScore = Math.min(highPending / 5, 1); // normalizado a 5 ítems

  // Peso 20%: cadencia histórica (ratio sesiones últimas 2 semanas)
  const recentSess = allSess.filter(s => {
    return (Date.now() - new Date(s.date || 0).getTime()) < 14 * 86400000;
  }).length;
  const cadenceScore = recentSess > 0 ? 0 : 1; // sin actividad reciente = más urgente

  return (daysSinceScore * 0.4) + (highScore * 0.4) + (cadenceScore * 0.2);
}

function _getSuggestedAI() {
  const active = (state.ais || []).filter(ai => !ai.archived);
  if (!active.length) return null;
  // Desempate: gana el que tiene más ítems high pendientes
  return active.reduce((best, ai) => {
    const scoreAI   = _computeSuggestionScore(ai);
    const scoreBest = _computeSuggestionScore(best);
    if (scoreAI > scoreBest) return ai;
    if (scoreAI === scoreBest) {
      const aiHigh   = _highPendingCount(ai);
      const bestHigh = _highPendingCount(best);
      return aiHigh >= bestHigh ? ai : best;
    }
    return best;
  });
}

function _highPendingCount(ai) {
  const aiSigla = ai.role || '';
  return (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(i =>
    i.status === 'pendiente' && i.priority === 'high' &&
    aiSigla && i.role && i.role.includes(aiSigla)
  ).length;
}

function _buildSuggestionReason(ai) {
  const allSess = getAISessions(ai.id);
  const parts = [];
  if (allSess.length) {
    const lastSess = allSess.reduce((a, b) =>
      new Date(a.date||0) > new Date(b.date||0) ? a : b
    );
    const days = Math.floor((Date.now() - new Date(lastSess.date||0).getTime()) / 86400000);
    if (days >= 1) parts.push(`llevas ${days} día${days !== 1 ? 's' : ''} sin sesión con ${ai.name}`);
  } else {
    parts.push(`nunca has tenido una sesión con ${ai.name}`);
  }
  const high = _highPendingCount(ai);
  if (high > 0) parts.push(`${high} ítem${high !== 1 ? 's' : ''} high pendiente${high !== 1 ? 's' : ''}`);
  return parts.join(' · ');
}

function renderSuggestionBanner() {
  // B-258: banner global eliminado — información equivalente inline en buildCard()
  const banner = document.getElementById('session-suggestion-banner');
  if (banner) banner.classList.add('suggestion-banner--hidden');
}

function dismissSuggestionBanner() {
  const banner = document.getElementById('session-suggestion-banner');
  if (banner) banner.classList.add('suggestion-banner--hidden');
}

function startSuggestedSession(aiId) {
  dismissSuggestionBanner();
  // Seleccionar la IA sugerida
  if (typeof _trackerSelectAI === 'function') _trackerSelectAI(aiId);
  else if (typeof _trackerSelectedId !== 'undefined') {
    _trackerSelectedId = aiId;
    render();
  }
  startSessionTimer(aiId);
}

// ══════════════════════════════════════════════════════════════════════════════
// S-17: T-202605-448 · Resumen semanal automático — panel lunes
// ══════════════════════════════════════════════════════════════════════════════

const _WEEKLY_KEY = 'ai-tracker-weekly-dismissed';

function _isMonday() { return new Date().getDay() === 1; }

function _getMondayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function _weeklyAlreadyDismissed() {
  try {
    const raw = localStorage.getItem(_WEEKLY_KEY);
    return raw === _getMondayKey();
  } catch(e) { return false; }
}

function _markWeeklyDismissed() {
  try { localStorage.setItem(_WEEKLY_KEY, _getMondayKey()); } catch(e) {}
}

function _buildWeeklySummary() {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 86400000;
  const twoWeeksAgo = now - 14 * 86400000;

  // Sesiones de la semana anterior (entre hace 14 días y hace 7 días)
  const allSessions = (state.projects || []).flatMap(p => (p.sessions || []));
  const lastWeekSess = allSessions.filter(s => {
    const ts = new Date(s.date || 0).getTime();
    return ts >= twoWeeksAgo && ts < oneWeekAgo;
  });

  if (!lastWeekSess.length) return null; // sin actividad — no mostrar

  const totalSessions = lastWeekSess.length;

  // Ítems cerrados (done en esa semana)
  const allItems = typeof ITEMS !== 'undefined' ? ITEMS : [];
  const doneLast = allItems.filter(i => i.status === 'done').length;
  const pendingNow = allItems.filter(i => i.status === 'pendiente').length;

  // IAs más activas
  const aiCounts = {};
  lastWeekSess.forEach(s => {
    const ai = getAI(s.aiId);
    const name = ai ? ai.name : s.aiId;
    aiCounts[name] = (aiCounts[name] || 0) + 1;
  });
  const topAIs = Object.entries(aiCounts).sort((a,b)=>b[1]-a[1]).slice(0,3)
    .map(([n,c]) => `${n} (${c})`).join(', ');

  // Sprint progress
  let sprintProgress = '—';
  try {
    const proj = getActiveProject() || (state.projects && state.projects[0]);
    const sp = proj && proj.sprints ? proj.sprints.find(s => s.status === 'active') : null;
    if (sp) {
      const spItems = allItems.filter(i => i.sprint === sp.id);
      const spDone = spItems.filter(i => i.status === 'done').length;
      const spTotal = spItems.length;
      const spPct = spTotal > 0 ? Math.round((spDone/spTotal)*100) : 0;
      sprintProgress = `${sp.label || sp.id} · ${spDone}/${spTotal} (${spPct}%)`;
    }
  } catch(e) {}

  return { totalSessions, doneLast, pendingNow, topAIs, sprintProgress };
}

function _exportWeeklySummaryMd() {
  const s = _buildWeeklySummary();
  if (!s) return;
  const lines = [
    '# Resumen semanal — Locus',
    `**Fecha:** ${new Date().toLocaleDateString('es-MX', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}`,
    '',
    `- **Sesiones registradas:** ${s.totalSessions}`,
    `- **Ítems cerrados:** ${s.doneLast}`,
    `- **Ítems abiertos:** ${s.pendingNow}`,
    `- **IAs más activas:** ${s.topAIs || '—'}`,
    `- **Sprint progress:** ${s.sprintProgress}`,
  ];
  const blob = new Blob([lines.join('\n')], {type:'text/markdown'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'resumen-semanal.md'; a.click();
  URL.revokeObjectURL(url);
}

function dismissWeeklySummary() {
  _markWeeklyDismissed();
  const modal = document.getElementById('weekly-summary-modal');
  if (modal) modal.classList.add('weekly-modal--hidden');
}

function _maybeShowWeeklySummary() {
  if (!_isMonday()) return;
  if (_weeklyAlreadyDismissed()) return;
  const summary = _buildWeeklySummary();
  if (!summary) return;

  // Poblar contenido
  const el = id => document.getElementById(id);
  if (el('wsum-sessions')) el('wsum-sessions').textContent = summary.totalSessions;
  if (el('wsum-done'))     el('wsum-done').textContent     = summary.doneLast;
  if (el('wsum-pending'))  el('wsum-pending').textContent  = summary.pendingNow;
  if (el('wsum-ais'))      el('wsum-ais').textContent      = summary.topAIs || '—';
  if (el('wsum-sprint'))   el('wsum-sprint').textContent   = summary.sprintProgress;

  const modal = document.getElementById('weekly-summary-modal');
  if (modal) modal.classList.remove('weekly-modal--hidden');
}

function render() {
  const grid = document.getElementById('grid');
  const emptyEl = document.getElementById('tracker-detail-empty');

  _renderTrackerSidebar();

  if (!state.ais.length) {
    if (grid) grid.innerHTML = '';
    // R-202605-178 AC: sin workers — único CTA
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); emptyEl.innerHTML = `
      <div class="empty-state-icon">🤖</div>
      <div class="empty-state-title">Agrega tu primer Worker</div>
      <div class="empty-state-hint">Los Workers son las IAs que usas. Empieza por crear uno para registrar tus sesiones.</div>
      <button class="empty-state-btn" onclick="openAddAI()">＋ Nuevo Worker</button>`; }
    if (typeof updateStats === 'function') updateStats(); if (typeof renderStatusBar === 'function') renderStatusBar(); if (typeof renderSetupChecklist === 'function') renderSetupChecklist(); return;
  }

  // R-202605-007 AC: con workers pero sin proyecto activo — solo CTA "Nuevo Proyecto"
  const _hasActiveProj = typeof getActiveProject === 'function' && !!getActiveProject();
  if (!_hasActiveProj && (state.projects || []).length === 0) {
    if (grid) grid.innerHTML = '';
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); emptyEl.innerHTML = `
      <div class="empty-state-icon">🗂</div>
      <div class="empty-state-title">Sin proyecto activo</div>
      <div class="empty-state-hint">Crea un proyecto para empezar a registrar sesiones y gestionar tu backlog.</div>
      <div class="es-cta-row">
        <button class="empty-state-btn" onclick="if(typeof openProjModal==='function')openProjModal(false)">＋ Nuevo Proyecto</button>
      </div>`; }
    if (typeof updateStats === 'function') updateStats(); if (typeof renderStatusBar === 'function') renderStatusBar(); if (typeof renderSetupChecklist === 'function') renderSetupChecklist(); return;
  }

  // auto-select: preferir disponible/en-sesión sobre agotada
  const allActive = state.ais.filter(ai => !ai.archived);
  if (!_trackerSelectedId || !state.ais.find(a => a.id === _trackerSelectedId)) {
    const preferred = allActive.find(a => a.status !== 'exhausted') || allActive[0];
    _trackerSelectedId = preferred ? preferred.id : null;
  }

  if (!_trackerSelectedId) {
    if (grid) grid.innerHTML = '';
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); }
    if (typeof updateStats === 'function') updateStats(); if (typeof renderStatusBar === 'function') renderStatusBar(); if (typeof renderSetupChecklist === 'function') renderSetupChecklist(); return;
  }

  if (emptyEl) emptyEl.classList.remove('visible');
  // B-202604-XXX: ocultar del flujo del DOM cuando hay IA seleccionada
  if (emptyEl) emptyEl.classList.add('is-hidden');

  // R-202604-060: aplicar color del proyecto activo como CSS custom property (CSS Purity — setProperty permitido)
  const _activeProjForColor = getActiveProject();
  if (_activeProjForColor && _activeProjForColor.color) {
    document.documentElement.style.setProperty('--proj-color', _activeProjForColor.color);
  } else {
    document.documentElement.style.removeProperty('--proj-color');
  }

  if (grid) {
    // R-110: sort IN-SESSION → DISPONIBLE → AGOTADA — sobre array, no manipula DOM
    const _sortOrder = (ai) => {
      if (ai.status !== 'exhausted' && _isInSession(ai)) return 0;
      if (ai.status !== 'exhausted') return 1;
      return 2;
    };
    const aisToRender = [...state.ais.filter(a => !a.archived)].sort((a, b) => _sortOrder(a) - _sortOrder(b));
    const ai = aisToRender.find(a => a.id === _trackerSelectedId) || state.ais.find(a => a.id === _trackerSelectedId);
    grid.innerHTML = '';
    if (ai) {
      const card = buildCard(ai);
      card.dataset.aiId = ai.id;
      grid.appendChild(card);
      // R-202604-061 AC-04: stagger reveal — una sola card en tracker, delay 0ms
      card.style.setProperty('--card-stagger-delay', '0ms');
      requestAnimationFrame(() => card.classList.add('stagger-in'));

      // R-202605-116: card sesión en curso — se inserta después del card IA
      const existingCsCard = document.getElementById('current-session-card-' + ai.id);
      if (existingCsCard) existingCsCard.remove();
      const csCard = (typeof _buildCurrentSessionCard === 'function')
        ? _buildCurrentSessionCard(ai.id)
        : null;
      if (csCard) {
        grid.appendChild(csCard);
        requestAnimationFrame(() => csCard.classList.add('cscard-visible'));
      }

      // archived section below card
      const archived = state.ais.filter(a => a.archived);
      if (archived.length) {
        const section = document.createElement('div');
        section.className = 'archived-section';
        const isOpen = localStorage.getItem('archived-open') === '1';
        section.innerHTML = `<button class="archived-toggle" onclick="toggleArchivedSection(this)">
          ${isOpen ? '▼' : '▶'} Archivadas (${archived.length})</button>
          <div class="archived-grid${isOpen ? ' open' : ''}" id="archived-grid"></div>`;
        grid.appendChild(section);
        const archGrid = section.querySelector('#archived-grid');
        archived.forEach(a => archGrid.appendChild(buildCard(a)));
      }
    }
  }

  if (typeof updateStats === 'function') updateStats();
  if (typeof renderStatusBar === 'function') renderStatusBar();
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  if (!window._radarSbInited) { window._radarSbInited = true; _initRadarSidebarState(); }
  if (typeof renderProjDots === 'function') renderProjDots();
  // R-202604-059: actualizar historial col 2 según modo activo + re-attach drop targets tras cada render
  if (_trackerCurrentView === 'poria') {
    if (typeof _trackerRenderMiniHist === 'function') _trackerRenderMiniHist(_trackerSelectedId);
  } else {
    if (typeof _trackerRenderHist === 'function') _trackerRenderHist();
  }
  if (typeof _trackerHistAttachDropTargets === 'function') _trackerHistAttachDropTargets();
  // T-202605-447: actualizar banner de sesión sugerida tras cada render
  renderSuggestionBanner();
  // R-202605-008: actualizar checklist de setup tras cada render
  if (typeof renderSetupChecklist === 'function') renderSetupChecklist();
  // B-202605-508: actualizar badges de tabs al final de cada render
  if (typeof updateTabNotifBadges === 'function') updateTabNotifBadges();
  // R-202605-170: sincronizar chip de worker activo en header
  _renderActiveWorkerChip();
}

const TG_TYPE_NAMES = {I:'Idea', P:'Pendiente', T:'Ticket', R:'Requerimiento', B:'Bug'};

// T-202604-047: tiempo promedio entre sesiones consecutivas
function buildHoyCard(ai, idx = 0, opts = {}) {
  const isInterrupted = !!ai.interrupted;
  const isInSession   = !!opts.inSession;
  const statusClass = ai.status === 'exhausted' ? 'exhausted' : 'available';
  const cardClass = 'hoy-mini-card ' + statusClass + (isInterrupted ? ' interrupted-state' : '') + (isInSession ? ' in-session-state' : '');

  const aiSessions = getAISessions(ai.id);
  const checkpointTotal = aiSessions.length;
  const sessConHora = aiSessions.filter(s => s.resetAt && !s.quickCapture).length;
  const avgLabel2 = avgBetweenSessions(ai);
  const avgShort = avgLabel2 ? avgLabel2.replace(' entre sesiones','') : '—';

  const cd = ai.status === 'exhausted' ? getCD(ai.resetTime, ai.resetEpoch) : '';
  const resetLabel = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : '';

  // "disponible desde" — hora del último reset o última sesión
  function _availableSinceLabel() {
    if (ai.resetTime && ai.resetEpoch) {
      const epoch = new Date(ai.resetEpoch);
      const hh = String(epoch.getHours()).padStart(2,'0');
      const mm = String(epoch.getMinutes()).padStart(2,'0');
      return fmt12(`${hh}:${mm}`);
    }
    const last = aiSessions.length ? aiSessions[aiSessions.length - 1] : null;
    if (last && last.date) {
      const d = new Date(last.date);
      if (!isNaN(d)) {
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        return fmt12(`${hh}:${mm}`);
      }
    }
    return null;
  }

  const availSince = ai.status === 'available' ? _availableSinceLabel() : null;

  const statsBar = ai.status === 'exhausted'
    ? `<div class="hoy-mini-stats">
        <div class="hoy-mini-stat exhausted-cell">
          <div>
            <div class="hoy-exh-countdown">${cd || '--:--:--'}</div>
            <div class="hoy-exh-reset-label">${resetLabel || 'sin hora'}</div>
          </div>
        </div>
      </div>`
    : `<button class="hoy-mini-ckpt-full" onclick="event.stopPropagation();navigateToCard('${ai.id}')">
        + checkpoint
        <span class="hoy-mini-ckpt-since">${availSince ? `desde ${availSince}` : 'disponible'}</span>
      </button>`;

  // T-316: badge diferenciado — ámbar para interrupted, púrpura para in-session
  const statusBadge = isInterrupted
    ? `<div class="hoy-mini-actions"><span class="hoy-mini-badge hoy-mini-badge--interrupted">⚡ Interrumpida</span></div>`
    : isInSession
      ? `<div class="hoy-mini-actions"><span class="hoy-mini-badge hoy-mini-badge--insession">● En sesión</span></div>`
      : '';

  // T-316: pill de proyecto de la última sesión global (sin filtro de proyecto activo)
  const _lastSessGlobal = getAllSessions().filter(s => s.aiId === ai.id).slice(-1)[0] || null;
  const _lastProjGlobal = _lastSessGlobal ? getProjectById(_lastSessGlobal.projectId) : null;
  const projPill = _lastProjGlobal
    ? `<span class="hoy-mini-proj-pill" title="${esc(_lastProjGlobal.name)}">${esc(_lastProjGlobal.icon || '📁')} ${esc(_lastProjGlobal.name)}</span>`
    : '';

  // quick button only for available/interrupted, not exhausted
  const quickBtn = (ai.status !== 'exhausted')
    ? `<button class="btn-quick" onclick="event.stopPropagation();openQuickCapture('${ai.id}')" title="Sesión rápida">⚡</button>`
    : '';

  return `<div class="${cardClass}" data-hoy-ai-id="${ai.id}" data-anim-delay="${idx * 60}" onclick="navigateToCard('${ai.id}')">
    <div class="hoy-mini-strip">
      <div class="hoy-mini-name">${esc(ai.name)}</div>
      <div class="hoy-mini-right">
        ${quickBtn}
      </div>
    </div>
    ${statsBar}
    ${statusBadge}
    ${projPill ? `<div class="hoy-mini-proj-row">${projPill}</div>` : ''}
  </div>`;
}

function _hoyMarkExhausted(id) {
  // Marks an AI as exhausted from Tab Hoy — no reset time (user can set later)
  const ai = getAI(id);
  if (!ai) return;
  ai.status = 'exhausted';
  ai.resetTime = '';
  ai.resetEpoch = null;
  save();
  renderHoy();
  render();
}

// ── Bloqueo ciego — agotar IA sin crear sesión ni log ──
function openBlindExhaustMode(id) {
  const ai = getAI(id);
  if (!ai || ai.status !== 'available' || _isInSession(ai)) return;
  const footer = document.getElementById('footer-' + id);
  if (!footer) return;
  footer.classList.add('card-footer--blind-exhaust-mode');
  const inline = document.getElementById('bexhaust-inline-' + id);
  if (inline) inline.classList.remove('is-hidden');
  setTimeout(() => {
    const inp = document.getElementById('bexhaust-hora-' + id);
    if (inp) { inp.focus(); inp.select(); }
  }, 30);
}

function cancelBlindExhaustMode(id) {
  const footer = document.getElementById('footer-' + id);
  if (footer) footer.classList.remove('card-footer--blind-exhaust-mode');
  const inline = document.getElementById('bexhaust-inline-' + id);
  if (inline) inline.classList.add('is-hidden');
  const inp = document.getElementById('bexhaust-hora-' + id);
  if (inp) inp.value = '';
  const disp = document.getElementById('bexhaust-disp-' + id);
  if (disp) { disp.textContent = '—'; disp.className = 'hora-parsed'; }
  const btn = document.getElementById('bexhaust-confirm-' + id);
  if (btn) btn.disabled = true;
}

function blindExhaustHoraInput(id) {
  const inp = document.getElementById('bexhaust-hora-' + id);
  const disp = document.getElementById('bexhaust-disp-' + id);
  const btn = document.getElementById('bexhaust-confirm-' + id);
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);
  if (disp) {
    disp.textContent = result ? result.label : (raw.length >= 3 ? 'hora inválida' : (raw.length ? '...' : '—'));
    disp.className = 'hora-parsed' + (result ? ' hora-disp--valid' : (raw.length >= 3 ? ' hora-disp--error' : ''));
  }
  if (btn) btn.disabled = !result;
}

function blindExhaustHoraKey(event, id) {
  if (event.key === 'Escape') { event.preventDefault(); cancelBlindExhaustMode(id); return; }
  if (event.key === 'Enter') { event.preventDefault(); confirmBlindExhaust(id); }
}

function confirmBlindExhaust(id) {
  const ai = getAI(id);
  if (!ai || ai.status !== 'available') return;
  const inp = document.getElementById('bexhaust-hora-' + id);
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);
  if (!result) {
    if (typeof showToast === 'function') showToast('error', 'Hora inválida — ingresa formato HHMM (ej: 2100)');
    return;
  }
  ai.status = 'exhausted';
  ai.resetTime = result.hhmm;
  ai.resetEpoch = result.epoch;
  // AC: no crea sesión, no toca resetAt de sesiones existentes, no emite log
  cancelBlindExhaustMode(id);
  saveImmediate().then(() => {
    render();
    if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
  });
  if (typeof showToast === 'function') showToast('info', `${ai.name} — agotada sin sesión · desbloqueo a las ${result.label}`);
}

function avgBetweenSessions(ai) {
  const dated = getAISessions(ai.id)
    .map(s => new Date(s.date).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b);
  if (dated.length < 2) return null;
  let totalMs = 0;
  for (let i = 1; i < dated.length; i++) totalMs += dated[i] - dated[i - 1];
  const avgMs = totalMs / (dated.length - 1);
  const avgH = avgMs / 3600000;
  if (avgH < 24) return `~${Math.round(avgH)}h entre sesiones`;
  const d = Math.floor(avgH / 24);
  const h = Math.round(avgH % 24);
  return h > 0 ? `~${d}d ${h}h entre sesiones` : `~${d}d entre sesiones`;
}

function buildCard(ai) {
  const el = document.createElement('div');
  const isInterrupted = !!ai.interrupted;
  const isInSession   = !isInterrupted && _isInSession(ai);
  el.className = 'card ' + (ai.status === 'exhausted' ? 'exhausted' : 'available') + (isInterrupted ? ' interrupted-state' : '') + (isInSession ? ' in-session-state' : '');
  el.id = 'card-' + ai.id;

  const cd = ai.status === 'exhausted' ? getCD(ai.resetTime, ai.resetEpoch) : '';
  const resetLabel = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : '';
  // T-055: banner sesión interrumpida
  const interruptedBannerHTML = ai.interrupted
    ? `<div class="interrupted-banner visible">
        <span class="interrupted-banner-text">⚡ Sesión en curso</span>
        <button class="interrupted-banner-btn" onclick="dismissInterrupted('${ai.id}')">Continuar →</button>
       </div>`
    : `<div class="interrupted-banner" id="intbanner-${ai.id}"></div>`;

  // T-202604-203: stats bar sin countdown (countdown va en zona central)
  const _cdInStats = false;

  // v3: sesiones de esta IA en el contexto del proyecto activo
  const aiSessions = getAISessions(ai.id);
  const SESSIONS_DEFAULT = 3;
  const shown = ai.showAll ? aiSessions : [...aiSessions].slice(-SESSIONS_DEFAULT);
  const _latestSessId = aiSessions.length > 0 ? aiSessions[aiSessions.length - 1].id : null;

  // v3: tracker del proyecto activo para indicadores de sesión
  const projTracker = getActiveTracker();

  // T-397: helper — build a single sess-row HTML
  const _buildSessRow = (s, isHero) => {
    const tagDots = (s.tags || []).map(tid => {
      const t = state.tags.find(x => x.id === tid);
      return t ? `<span class="sess-tag-dot" data-tag-color="${esc(t.color)}" title="${esc(t.name)}"></span>` : '';
    }).join('');
    const tgItems = projTracker.items.filter(x => x.sessionId === s.id);
    const tgCounts = {P:0,T:0,R:0,B:0};
    tgItems.forEach(x => {
      const t = x.code ? x.code[0] : (x.type || '');
      if (tgCounts[t] !== undefined) tgCounts[t]++;
    });
    const tgInds = Object.entries(tgCounts).filter(([,v]) => v > 0)
      .map(([k, v]) => `<span class="sess-ind sess-ind-${k}" title="${TG_TYPE_NAMES[k]}"><span class="ind-short">${k}${v > 1 ? v : ''}</span><span class="ind-full">${TG_TYPE_NAMES[k]}${v > 1 ? '×'+v : ''}</span></span>`).join('');
    const pendInd = '';
    const noHoraTag = (!s.resetAt && !s.quickCapture) ? `<span class="sess-no-hora" title="Sin hora de reset registrada">sin hora</span>` : '';
    const refPills = (s.trackerRefs || []).map(code => {
      const type = code[0] || '';
      return `<span class="popup-ref-pill ${type} popup-ref-pill--sm" title="${esc(code)}" onclick="event.stopPropagation();openDetail('${ai.id}','${s.id}')">${esc(code)}</span>`;
    }).join('');
    const starInd = s.starred ? `<span class="sess-ind sess-ind--starred" title="Destacada">⭐</span>` : '';
    const quickInd = s.quickCapture ? `<span class="sess-ind sess-quick-tag" title="Captura rápida">⚡</span>` : '';
    const isLatest = s.id === _latestSessId;
    const reviewInd = isLatest
      ? `<span class="sess-review-ind${s.inReview ? ' active' : ''}" title="${s.inReview ? 'En revisión — click para desactivar' : 'Marcar en revisión'}" onclick="event.stopPropagation();toggleInReview('${ai.id}','${s.id}')">${s.inReview ? '🔍 revisión' : '🔍'}</span>`
      : '';
    const summaryTrunc = s.summary ? (s.summary.length > 80 ? s.summary.slice(0, 80) + '…' : s.summary) : '';
    const summaryHtml = isHero && s.summary
      ? `<div class="sess-row-summary sess-row-summary--expanded">${esc(s.summary.slice(0, 220))}${s.summary.length > 220 ? '…' : ''}</div>`
      : (s.summary ? `<div class="sess-row-summary">${esc(summaryTrunc)}</div>` : '');
    const decisionHtml = isHero && s.decision
      ? `<div class="sess-row-decision"><span class="sess-row-decision-label">→</span>${esc(s.decision.slice(0, 160))}${s.decision.length > 160 ? '…' : ''}</div>`
      : '';
    const extraCls = (s.starred ? ' sess-row-starred' : '') + (isHero ? ' sess-row--latest' : '');
    return `<div class="sess-row${extraCls}" data-sess-id="${s.id}" onclick="openDetail('${ai.id}','${s.id}')">
      <div class="sess-row-top">
        <div class="sess-row-title" title="${esc(s.title)}">${esc(s.title)}</div>
        <div class="sess-row-date" title="${esc(s.date || s.dateShort || '')}">${(typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '')}</div>
      </div>
      <div class="sess-row-bottom">
        ${summaryHtml}
        <div class="sess-row-indicators">${starInd}${quickInd}${pendInd}${tgInds}${noHoraTag}${reviewInd}<div class="sess-row-tags">${tagDots}</div></div>
      </div>
      ${decisionHtml}
    </div>`;
  };

  // T-397: hero (latest) + horizontal strip (older)
  const shownReversed = [...shown].reverse();
  const latestSess = shownReversed[0] || null;
  const olderSess = shownReversed.slice(1);
  const heroHTML = latestSess ? _buildSessRow(latestSess, true) : '';
  const olderHTML = olderSess.length > 0
    ? `<div class="sess-list-horiz">${olderSess.map(s => _buildSessRow(s, false)).join('')}</div>`
    : '';
  const sessRows = heroHTML + olderHTML;

  // B-258: emptyState inline — información de sugerencia dentro de la card, sin banner global
  const _noSessReason = _buildSuggestionReason(ai);
  const emptyState = `<div class="no-sess">
    <span class="no-sess-icon">📋</span>
    Sin sesiones aún
    ${_noSessReason ? `<div class="no-sess-suggestion">${esc(_noSessReason)}</div>` : ''}
    <div class="no-sess-hint">Pega el bloque CHECKPOINT al terminar tu sesión con la IA</div>
  </div>`;

  // v3: stats de sesiones desde proyecto activo
  const nowYM = new Date().toISOString().slice(0,7);
  const sessThisMonth = aiSessions.filter(s => (s.date || '').startsWith(nowYM)).length;
  const sessTotal = aiSessions.length;

  const histHTMLv2 = `
    <div class="history">
      <div class="history-header">
        <div class="history-label">Historial</div>
        <div class="history-header-right">
          <span class="sess-pill">${sessTotal}</span>
        </div>
      </div>
      ${sessTotal === 0 ? emptyState : `
        <div class="sess-list-hero" id="sess-list-${ai.id}">${sessRows}</div>
        ${sessTotal > SESSIONS_DEFAULT ? `<button class="show-all-btn" onclick="toggleShowAll('${ai.id}')">${ai.showAll ? '▲ ocultar historial' : '▾ Ver historial (' + sessTotal + ')'}</button>` : ''}
      `}
    </div>`;

  // Selector de proyecto — inline en paste-label
  const _activeProjects = (state.projects || []).filter(p => p.status !== 'paused');
  const _activeProjId = _getActiveProjectFilter() || '';
  const _projOptions = _activeProjects.map(p =>
    `<option value="${esc(p.id)}" ${p.id === _activeProjId ? 'selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`
  ).join('');
  const _projInlineSelect = `<select class="paste-proj-select" id="sess-proj-${ai.id}" title="Proyecto de esta sesión"><option value="">proyecto…</option>${_projOptions}</select>`;

  // T-202604-203: zona central — contenido condicional por estado
  // Estado available: textarea + preview
  // Estado exhausted: countdown dramático
  // B-255: label "Disponible en X h Y min" calculado desde _hoyMsUntilReset
  const _buildUnlockLabel = (aiObj) => {
    const msLeft = _hoyMsUntilReset(aiObj);
    if (!isFinite(msLeft) || msLeft <= 0) return 'Disponible ahora';
    const totalMin = Math.floor(msLeft / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `Disponible en ${m}min`;
    return `Disponible en ${h}h ${String(m).padStart(2,'0')}min`;
  };
  const unlockLabel = ai.status === 'exhausted' && ai.resetTime ? _buildUnlockLabel(ai) : '';

  const inputHTML = ai.status === 'available' ? `
    <div class="paste-wrap">
      <div class="paste-label">Resumen de sesión ${_projInlineSelect}</div>
      <div class="paste-help-box hidden" id="paste-help-${ai.id}">Pega el bloque <code>---CHECKPOINT---</code> que genera el TL al final de cada sesión. Si no tienes el bloque, escribe el título en la primera línea y el resumen en las siguientes.</div>
      <div class="sc-stepper" id="phasebar-${ai.id}" role="list">
        <div class="sc-step active" id="phase-paste-${ai.id}" role="listitem" aria-current="step" data-step="1"><span class="sc-step-num" aria-hidden="true">1</span>pegar</div>
        <div class="sc-step" id="phase-confirm-${ai.id}" role="listitem" data-step="2"><span class="sc-step-num" aria-hidden="true">2</span>confirmar</div>
        <div class="sc-step" id="phase-save-${ai.id}" role="listitem" data-step="3"><span class="sc-step-num" aria-hidden="true">3</span>guardar</div>
      </div>
      <div class="paste-ta-wrap">
        <textarea class="paste-ta" id="ta-${ai.id}" rows="3"
          onpaste="if(typeof handlePaste==='function'){handlePaste('${ai.id}')}else{showToast('error','Módulo de ingesta no disponible')}"
          oninput="if(typeof handleInput==='function'){handleInput('${ai.id}');}"
          onfocus="enterFocusMode('${ai.id}')"></textarea>
        <div class="paste-ta-hint" id="pta-hint-${ai.id}">Pega el bloque <code>---CHECKPOINT---</code> que genera el rol al cerrar sesión. Si no tienes el bloque, escribe el título en la primera línea y el resumen en las siguientes.</div>
      </div>
      <div class="char-counter" id="cc-${ai.id}"></div>
    </div>
    <div class="preview" id="prev-${ai.id}"></div>
  ` : ai.resetTime ? `
    <div class="card-countdown-zone">
      <div class="countdown-dramatic">
        <div class="card-stat-countdown" id="cd-${ai.id}">${cd || '--:--:--'}</div>
        <div class="card-stat-reset-lbl">${resetLabel}</div>
        <div class="sc-unlock-field" id="unlock-lbl-${ai.id}">
          ${unlockLabel ? `<i class="sc-unlock-icon ti ti-lock-open"></i><span class="sc-unlock-label">${unlockLabel}</span>` : ''}
        </div>
      </div>
    </div>
  ` : `
    <div class="card-countdown-zone card-countdown-zone--notime">
      <div class="countdown-no-time">
        <div class="countdown-no-time-msg">Sin hora de desbloqueo asignada</div>
        <button class="countdown-assign-hora-btn" onclick="openCorrectHora('${ai.id}')">⏰ Asignar hora</button>
      </div>
    </div>
  `;

  // T-202604-203: footer fijo — acciones primarias siempre en la misma posición
  const footerHTML = ai.status === 'available' ? `
    <div class="sc-footer" id="footer-${ai.id}">
      <div class="sc-unlock">
        <label class="sc-unlock-label" for="hora-${ai.id}">
          <i class="sc-unlock-icon ti ti-lock" aria-hidden="true"></i>desbloqueo
        </label>
        <input class="hora-input" id="hora-${ai.id}" type="text" maxlength="4" placeholder="--:--"
          oninput="parseHora('${ai.id}')"
          onkeydown="horaKey(event,'${ai.id}')">
        <div class="hora-parsed" id="hdisp-${ai.id}">—</div>
      </div>
      <button class="sc-save" id="sbtn-${ai.id}" onclick="confirmSave('${ai.id}')" disabled>guardar sesión</button>
      <div class="blind-exhaust-inline hidden" id="bexhaust-inline-${ai.id}">
        <div class="blind-exhaust-hora-row">
          <input class="hora-input blind-exhaust-hora-input" id="bexhaust-hora-${ai.id}" type="text" maxlength="4" placeholder="--:--"
            oninput="blindExhaustHoraInput('${ai.id}')"
            onkeydown="blindExhaustHoraKey(event,'${ai.id}')"
            aria-label="Hora de desbloqueo para agotamiento ciego">
          <div>
            <div class="hora-parsed" id="bexhaust-disp-${ai.id}">—</div>
            <div class="hora-hint-txt">hora de desbloqueo · Enter para agotar</div>
          </div>
        </div>
        <div class="blind-exhaust-confirm-row">
          <button class="blind-exhaust-confirm-btn" id="bexhaust-confirm-${ai.id}" onclick="confirmBlindExhaust('${ai.id}')" disabled aria-label="Confirmar agotamiento ciego">🔴 Agotar</button>
          <button class="blind-exhaust-cancel-btn" onclick="cancelBlindExhaustMode('${ai.id}')">Cancelar</button>
        </div>
      </div>
    </div>
  ` : `
    <div class="sc-footer sc-footer--exhausted">
      <button class="card-footer-unlock-btn" onclick="openCorrectHora('${ai.id}')">⏰ Corregir hora</button>
    </div>
  `;


  // v3: stale usa aiSessions
  const staleLastDate = aiSessions.length > 0 ? new Date(aiSessions[aiSessions.length-1].date) : null;
  const staleDays = staleLastDate ? Math.floor((Date.now()-staleLastDate.getTime())/86400000) : 0;

  const checkpointTotal = aiSessions.length; // todos los registros
  const sessConHora = aiSessions.filter(s => s.resetAt && !s.quickCapture).length; // con hora bloqueada
  const avgLabel2 = avgBetweenSessions(ai);
  const avgShort = avgLabel2 ? avgLabel2.replace(' entre sesiones','') : '—';
  // T-202604-203: stats bar idéntica en ambos estados — solo números, sin countdown
  const statsBarHTML = `<div class="sc-stats">
      <div class="sc-stat"><span class="sc-stat-val">${checkpointTotal}</span><span class="sc-stat-lbl">checkpoints</span></div>
      <div class="sc-stat"><span class="sc-stat-val">${sessConHora}</span><span class="sc-stat-lbl">sesiones</span></div>
      <div class="sc-stat"><span class="sc-stat-val">${avgShort}</span><span class="sc-stat-lbl" title="Tiempo promedio entre sesiones de este Worker, desde apertura">desde apertura</span></div>
    </div>`;

  // Project chip — basado en la última sesión de la IA
  const _lastSess = getLastAISession(ai.id);
  const _cardProj = _lastSess ? getProjectById(_lastSess.projectId) : null;
  const _projChipHTML = _cardProj
    ? `<span class="card-proj-chip" title="${esc(_cardProj.name)}" onclick="event.stopPropagation();selectProjectFilter('${_cardProj.id}')">${esc(_cardProj.icon || '📁')} ${esc(_cardProj.name)}</span>`
    : '';

  // Premium card: avatar initial + status pill animado + countdown dramático
  const _aiInitial = esc(ai.name).charAt(0).toUpperCase();
  const _isAvail = ai.status === 'available';

  // Sprint activo del proyecto de la card — para mostrar ID en header
  const _cardActiveSprint = _cardProj && _cardProj.sprints
    ? _cardProj.sprints.find(s => s.status === 'active')
    : null;
  const _cardSprintId = _cardActiveSprint ? esc(_cardActiveSprint.id || _cardActiveSprint.name || '') : '';
  const _cardSprintHTML = _cardSprintId
    ? `<span class="sc-sprint-id" title="${esc(_cardActiveSprint.name || _cardActiveSprint.id)}">${_cardSprintId}</span>`
    : '';

  el.innerHTML = `
    ${interruptedBannerHTML}
    <div class="sc-header">
      <div class="sc-header-left">
        <div class="sc-avatar" title="${esc(ai.name)}" ondblclick="startRename('${ai.id}')">${_aiInitial}</div>
        <span class="sc-project" id="name-${ai.id}">${esc(ai.name)}</span>
        ${isInSession
          ? `<span class="sc-badge"><span class="sc-badge-dot"></span>${STATUS_LABELS.insession}</span>`
          : _isAvail
            ? `<span class="sc-badge sc-badge--avail">${STATUS_LABELS.available}</span>`
            : `<span class="sc-badge sc-badge--exhausted">${STATUS_LABELS.exhausted}</span>`
        }
      </div>
      <div class="sc-header-right">
        ${_hasStaleSuggestion(ai) ? `<span class="stale-dot" title="Última sesión hace ${staleDays} días — tienes ítems en progreso pendientes"></span>` : ''}
        ${_cardSprintHTML}
        ${_isAvail ? `<button class="btn-quick" onclick="openQuickCapture('${ai.id}')" title="Registrar sesión rápida sin protocolo">⚡</button>` : ''}
        <div class="card-dot-menu" id="dotmenu-wrap-${ai.id}">
          <button class="sc-menu-btn" onclick="toggleCardMenu('${ai.id}',event)" title="Más opciones" aria-label="Más opciones"><i class="ti ti-dots"></i></button>
          <div class="card-dot-dropdown" id="dotmenu-${ai.id}">
            <button class="card-dot-item" onclick="closeCardMenu('${ai.id}');startRename('${ai.id}')"><span class="dot-item-icon">✎</span> Renombrar</button>
            ${_isAvail ? `<button class="card-dot-item" onclick="confirmInterruptInline('${ai.id}',this)"><span class="dot-item-icon">⛓️‍💥</span> Interrumpir sesión</button>` : ''}
            ${_isAvail ? `<button class="card-dot-item" onclick="closeCardMenu('${ai.id}');openBlindExhaustMode('${ai.id}')"><span class="dot-item-icon">🔴</span> Agotar</button>` : ''}
            ${!_isAvail ? `<button class="card-dot-item" onclick="closeCardMenu('${ai.id}');openCorrectHora('${ai.id}')"><span class="dot-item-icon">⏰</span> Corregir hora de desbloqueo</button>` : ''}
            <button class="card-dot-item${sessTotal < 2 ? ' disabled' : ''}" onclick="closeCardMenu('${ai.id}');${sessTotal >= 2 ? `downloadReport('${ai.id}')` : ''}" title="${sessTotal < 2 ? 'Necesitas al menos 2 sesiones' : 'Descargar reporte markdown'}"${sessTotal < 2 ? ' disabled' : ''}><span class="dot-item-icon">📥</span> Descargar reporte</button>
            <hr class="card-dot-divider">
            <div class="danger-zone">
            <button class="card-dot-item danger" onclick="closeCardMenu('${ai.id}');archiveAI('${ai.id}')"><span class="dot-item-icon">⊟</span> Archivar</button>
            <button class="card-dot-item danger" onclick="closeCardMenu('${ai.id}');confirmClear('${ai.id}')"><span class="dot-item-icon">⌫</span> Limpiar historial</button>
            <button class="card-dot-item danger" onclick="closeCardMenu('${ai.id}');deleteAI('${ai.id}')"><span class="dot-item-icon">✕</span> Eliminar IA</button>
            </div>
          </div>
        </div>
        <span class="card-drag-handle" title="Arrastrar para reordenar">⠿</span>
      </div>
    </div>
    ${statsBarHTML}
    <div class="card-body">
      ${inputHTML}
      ${_trackerCurrentView !== 'poria' ? histHTMLv2 : ''}
    </div>
    ${footerHTML}`;
  // CSS Purity: tag dot background color calculado desde datos → setProperty post-render
  el.querySelectorAll('[data-tag-color]').forEach(dot => {
    dot.style.setProperty('background', dot.dataset.tagColor);
  });
  return el;
}
