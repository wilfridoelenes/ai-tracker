// locus-checkpoint-hoy.js
// Responsabilidad: Vista Hoy, sidebar/hoy tickers, auto-download,
//   normStatus, buildTGPreview, selectAIForQuickCapture.
// Dependencias: locus-checkpoint-stats.js · locus-storage.js


// B-202605-014: toggleBacklogFocusMode vive en locus-backlog-core.js


// ── ESC cascade, keydown listener, shortcuts — extraídos a locus-ui-shell.js
// _escCascade, click listener search-unified-results,
// keydown listener global, _SHORTCUT_DEFS, _shortcutKey, _shortcutConflict,
// _shortcutsRender, _shortcutsStartEdit, _shortcutsCaptureKey,
// _shortcutsSaveEdit, _shortcutsResetOne, restoreDefaultShortcuts,
// openShortcuts, closeShortcuts, openShortcutsRef, closeShortcutsRef, _sk
// ─────────────────────────────────────────────────────────────────────────

// T-202604-295: trigger de descarga de templates — 'session' (default) | 'sprint'
// _templateTrigger definida en locus-session.js — consumir via guard
// _TPL_TRIGGER_KEY preservada para _updateAutoDownloadLabel e _initAutoDlLabel
const _TPL_TRIGGER_KEY = 'template-download-trigger';
function _autoDownloadOn() {
  // Backward compat — ON si trigger es 'session' (comportamiento original)
  const trig = typeof _templateTrigger === 'function' ? _templateTrigger() : (localStorage.getItem(_TPL_TRIGGER_KEY) || 'session');
  return trig === 'session';
}
function toggleAutoDownload() {
  const trig = typeof _templateTrigger === 'function' ? _templateTrigger() : (localStorage.getItem(_TPL_TRIGGER_KEY) || 'session');
  const next = trig === 'session' ? 'sprint' : 'session';
  localStorage.setItem(_TPL_TRIGGER_KEY, next);
  _saveUserPrefs(); // R-4: sincronizar preferencia a Supabase
  _updateAutoDownloadLabel();
}
function _updateAutoDownloadLabel() {
  const btn = document.getElementById('more-menu-autodl');
  const _trig = typeof _templateTrigger === 'function' ? _templateTrigger() : (localStorage.getItem(_TPL_TRIGGER_KEY) || 'session');
  if (btn) btn.textContent = `⬇ Descargar templates: ${_trig === 'session' ? 'al guardar sesión' : 'al cerrar sprint'}`;
}
// Inicializar label al cargar
(function _initAutoDlLabel() {
  const btn = document.getElementById('more-menu-autodl');
  const _trig = typeof _templateTrigger === 'function' ? _templateTrigger() : (localStorage.getItem(_TPL_TRIGGER_KEY) || 'session');
  if (btn) btn.textContent = `⬇ Descargar templates: ${_trig === 'session' ? 'al guardar sesión' : 'al cerrar sprint'}`;
})();


(function _initSearchTooltip() {
  const si = document.getElementById('search-global');
  if (!si) return;
  const container = si.closest('.header-search');
  if (!container) return;
  const btn = container.querySelector('button, [role="button"]');
  if (btn && !btn.title) btn.title = 'Ctrl+F';
})();

// ── T-052: Vista Hoy ──
// ─── Utilidad countdown para tab Hoy ─────────────────────────────────────────
function _hoyMsUntilReset(ai) {
  if (!ai.resetTime) return Infinity;
  const [h, m] = ai.resetTime.split(':').map(Number);
  const r = new Date(); r.setHours(h, m, 0, 0);
  if (r <= new Date()) r.setDate(r.getDate() + 1);
  return r - new Date();
}

function _hoyCountdownLabel(ms) {
  if (!isFinite(ms) || ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function _hoyGetProjName(ai) {
  const lastSess = getLastAISession(ai.id);
  if (!lastSess || !lastSess.projectId) return '';
  const proj = getProjectById(lastSess.projectId);
  if (!proj) return '';
  return (proj.icon ? proj.icon + ' ' : '') + proj.name;
}

// Tiempo que lleva disponible — última sesión más antigua = primero
function _hoyAvailableSince(ai) {
  const last = getLastAISession(ai.id);
  if (!last || !last.date) return 0;
  return new Date(last.date).getTime();
}

// Ticker global para countdowns en tab Hoy
let _hoyTickerInterval = null;
function _startHoyTicker() {
  _stopHoyTicker();
  _hoyTickerInterval = setInterval(() => {
    if (typeof currentTab === 'undefined' || currentTab !== 'sesiones') { _stopHoyTicker(); return; }
    document.querySelectorAll('[data-hoy-ai-id]').forEach(el => {
      const ai = getAI(el.dataset.hoyAiId);
      if (!ai || ai.status !== 'exhausted') return;
      const ms = _hoyMsUntilReset(ai);
      const cdEl = el.querySelector('.hoy-exh-countdown');
      if (!cdEl) return;
      cdEl.textContent = _hoyCountdownLabel(ms);
      cdEl.classList.toggle('soon', ms < 30 * 60000);
      if (ms <= 0) { if (typeof _markHoyDirty === 'function') _markHoyDirty(); renderHoy(); }
    });
  }, 1000);
}
function _stopHoyTicker() {
  if (_hoyTickerInterval) { clearInterval(_hoyTickerInterval); _hoyTickerInterval = null; }
}

// Ticker de countdown para IAs agotadas en el sidebar del Tab Tracker
let _sidebarTickerInterval = null;
function _startSidebarTicker() {
  _stopSidebarTicker();
  // B-202605-047: set de IDs ya procesados para expiración en este ciclo de ticker.
  // Evita doble escritura en unlock-lbl- y rsb-card- cuando render() relanza el ticker
  // antes de que saveImmediate confirme el cambio de estado en state.ais.
  const _expiredThisTick = new Set();
  _sidebarTickerInterval = setInterval(() => {
    const exhausted = state.ais.filter(ai => !ai.archived && ai.status === 'exhausted' && ai.resetTime);
    if (!exhausted.length) { _stopSidebarTicker(); return; }
    exhausted.forEach(ai => {
      // B-202605-047: si este ai ya fue procesado para expiración en este ticker,
      // no escribir unlock-lbl ni rsb-card hasta que el nuevo ticker arranque post-render.
      if (_expiredThisTick.has(ai.id)) return;

      const el = document.getElementById('tsb-row-' + ai.id);
      if (el) {
        let cdEl = el.querySelector('.tsb-ai-cd');
        const [hh, mm] = ai.resetTime.split(':').map(Number);
        const now = new Date();
        const reset = new Date(now); reset.setHours(hh, mm, 0, 0);
        if (reset <= now) reset.setDate(reset.getDate() + 1);
        const diff = Math.max(0, Math.round((reset - now) / 60000));
        if (diff === 0) {
          // B-202605-047: marcar antes de mutar estado para bloquear escrituras
          // en unlock-lbl y rsb-card durante el render que viene a continuación.
          _expiredThisTick.add(ai.id);
          // Fix: limpiar los tres campos de estado, persistir y hacer render completo.
          // Las actualizaciones quirúrgicas de DOM previas eran insuficientes — no movían
          // la IA de la sección exhausted a available en sidebar ni en card.
          ai.status = 'available';
          ai.resetTime = '';
          ai.resetEpoch = null;
          if (typeof saveImmediate === 'function') {
            saveImmediate().then(() => {
              if (typeof render === 'function') render();
              if (typeof _markHoyDirty === 'function') _markHoyDirty();
              if (typeof renderHoy === 'function' && typeof currentTab !== 'undefined' && currentTab === 'sesiones') renderHoy();
            });
          } else {
            if (typeof render === 'function') render();
            if (typeof _markHoyDirty === 'function') _markHoyDirty();
            if (typeof renderHoy === 'function' && typeof currentTab !== 'undefined' && currentTab === 'sesiones') renderHoy();
          }
          return; // B-202605-047: no continuar a las escrituras de DOM de este ai
        } else {
          const h = Math.floor(diff / 60), m = diff % 60;
          const label = `${h}h${String(m).padStart(2,'0')}`;
          if (!cdEl) { cdEl = document.createElement('span'); cdEl.className = 'tsb-ai-cd'; el.appendChild(cdEl); }
          cdEl.textContent = label;
        }
      }
      // T-202604-254: update radar sidebar countdown
      const rsbCard = document.getElementById('rsb-card-' + ai.id);
      if (rsbCard) {
        const cdEl = rsbCard.querySelector('.rsb-countdown');
        if (cdEl) { cdEl.textContent = getCD(ai.resetTime, ai.resetEpoch) || '--:--:--'; }
      }
      // B-255: update card unlock label in real time
      const unlockLblEl = document.getElementById('unlock-lbl-' + ai.id);
      if (unlockLblEl) {
        const msLeft = _hoyMsUntilReset(ai);
        if (!isFinite(msLeft) || msLeft <= 0) {
          unlockLblEl.textContent = 'Disponible ahora';
        } else {
          const totalMin = Math.floor(msLeft / 60000);
          const h = Math.floor(totalMin / 60);
          const m = totalMin % 60;
          unlockLblEl.textContent = h === 0
            ? `Disponible en ${m}min`
            : `Disponible en ${h}h ${String(m).padStart(2,'0')}min`;
        }
      }
    });
  }, 1000); // T-202604-302: cada 1s — countdown live sin interacción
}
function _stopSidebarTicker() {
  if (_sidebarTickerInterval) { clearInterval(_sidebarTickerInterval); _sidebarTickerInterval = null; }
}

// T-202604-324: mini progress dots del ecosistema en el header nav
function renderProjDots() {
  // Eliminado — ruido con pocos proyectos activos
}

// R-202605-061: dirty flag — evita renders redundantes sin cambio de estado
let _hoyDirty = false;
function _markHoyDirty() { _hoyDirty = true; }
window._markHoyDirty = _markHoyDirty;

function renderHoy() {
  if (!_hoyDirty) return;
  _hoyDirty = false;
  const el = document.getElementById('hoy-content');
  if (!el) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const allSess = getAllSessions();

  // ── Stats: Hoy / Semana / Mes / Total ──────────────────────────────────
  function _wkStart(offsetWeeks) {
    const d = new Date(now); const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day) + offsetWeeks * 7); d.setHours(0,0,0,0); return d;
  }
  function _moStart(offsetMonths) {
    return new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1, 0, 0, 0, 0);
  }
  const wkFrom  = _wkStart(0).getTime();  const wkPrev = _wkStart(-1).getTime();
  const moFrom  = _moStart(0).getTime();  const moPrev = _moStart(-1).getTime(); const moPrevEnd = _moStart(0).getTime() - 1;
  const dayFrom = new Date(now).setHours(0,0,0,0);
  const prevDayFrom = dayFrom - 86400000;

  const sHoy  = allSess.filter(s => s.date && new Date(s.date).getTime() >= dayFrom).length;
  const sHoyPrev = allSess.filter(s => { const t = s.date && new Date(s.date).getTime(); return t && t >= prevDayFrom && t < dayFrom; }).length;
  const sSemC = allSess.filter(s => s.date && new Date(s.date).getTime() >= wkFrom).length;
  const sSemP = allSess.filter(s => { const t = s.date && new Date(s.date).getTime(); return t && t >= wkPrev && t < wkFrom; }).length;
  const sMesC = allSess.filter(s => s.date && new Date(s.date).getTime() >= moFrom).length;
  const sMesP = allSess.filter(s => { const t = s.date && new Date(s.date).getTime(); return t && t >= moPrev && t < moPrevEnd; }).length;
  const sTotal = allSess.length;

  function _delta(curr, prev) {
    const d = curr - prev;
    if (d > 0) return `<span class="radar-delta radar-delta--up">+${d}</span>`;
    if (d < 0) return `<span class="radar-delta radar-delta--neutral">${d}</span>`;
    return `<span class="radar-delta radar-delta--neutral">=</span>`;
  }

  // ── Último checkpoint global ───────────────────────────────────────────
  const allSessSorted = [...allSess].filter(s => s.date).sort((a,b) => new Date(b.date) - new Date(a.date));
  const lastCkpt = allSessSorted.length ? allSessSorted[0] : null;
  function _lastCkptLabel() {
    if (!lastCkpt) return '—';
    const d = new Date(lastCkpt.date);
    if (isNaN(d)) return '—';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return 'ahora';
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `${diffH}h`;
    return `${Math.floor(diffH/24)}d`;
  }

  // ── Proyecto más activo del mes ─────────────────────────────────────────
  const activeProjects = (state.projects || []).filter(p => p.status !== 'paused' && (p.sessions || []).length > 0);
  const projMonthStats = activeProjects.map(p => ({
    name: (p.icon ? p.icon + ' ' : '') + p.name,
    count: (p.sessions || []).filter(s => s.date && new Date(s.date).getTime() >= moFrom).length
  })).filter(p => p.count > 0).sort((a,b) => b.count - a.count);
  const topProj = projMonthStats[0] || null;

  // ── Racha de días activos ───────────────────────────────────────────────
  function _calcStreak() {
    const dayKeys = new Set(allSess.filter(s => s.date).map(s => s.date.split('T')[0]));
    let streak = 0;
    const d = new Date(now);
    // if no session today, start checking from yesterday
    const todayKey = d.toISOString().split('T')[0];
    if (!dayKeys.has(todayKey)) { d.setDate(d.getDate() - 1); }
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (!dayKeys.has(key)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }
  const streak = _calcStreak();

  // ── Hora pico ───────────────────────────────────────────────────────────
  function _peakHour() {
    const counts = new Array(24).fill(0);
    allSess.filter(s => s.date).forEach(s => {
      const h = new Date(s.date).getHours();
      if (!isNaN(h)) counts[h]++;
    });
    const max = Math.max(...counts);
    if (max === 0) return null;
    const h = counts.indexOf(max);
    const ampm = h < 12 ? 'am' : 'pm';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { label: `${h12}${ampm}`, count: max };
  }
  const peak = _peakHour();

  // ── Sesiones completas vs quick ─────────────────────────────────────────
  const completas = allSess.filter(s => !s.quickCapture).length;
  const rapidas   = allSess.filter(s => s.quickCapture).length;

  // ── Promedio de sesiones por día activo ────────────────────────────────
  function _avgPerActiveDay() {
    const dayKeys = new Set(allSess.filter(s => s.date).map(s => s.date.split('T')[0]));
    if (!dayKeys.size) return '—';
    return (allSess.length / dayKeys.size).toFixed(1);
  }
  const avgPerDay = _avgPerActiveDay();

  // ── Stats grid ─────────────────────────────────────────────────────────
  const statsHTML = `<div class="radar-stats-grid">
    <div class="radar-card radar-card-accent">
      <div class="radar-card-label">Último checkpoint</div>
      <div class="radar-card-value">${_lastCkptLabel()}</div>
      <div class="radar-card-sub">${lastCkpt ? esc(lastCkpt.title || '').slice(0,28) || '—' : '—'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Hoy ${_delta(sHoy, sHoyPrev)}</div>
      <div class="radar-card-value">${sHoy}</div>
      <div class="radar-card-sub">semana: ${sSemC} ${_delta(sSemC, sSemP)}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Este mes ${_delta(sMesC, sMesP)}</div>
      <div class="radar-card-value">${sMesC}</div>
      <div class="radar-card-sub">total: ${sTotal} sesiones</div>
    </div>
    <div class="radar-card${streak >= 3 ? ' radar-card-streak' : ''}">
      <div class="radar-card-label">Racha activa</div>
      <div class="radar-card-value">${streak}<span class="radar-streak-unit">${streak === 1 ? 'día' : 'días'}</span></div>
      <div class="radar-card-sub">${streak >= 7 ? '🔥 Semana completa' : streak >= 3 ? '✨ En racha' : streak > 0 ? 'sigue así' : 'sin sesiones hoy'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Proyecto del mes</div>
      <div class="radar-card-value radar-card-value--sm radar-card-value--truncate">${topProj ? esc(topProj.name).slice(0,18) : '—'}</div>
      <div class="radar-card-sub">${topProj ? topProj.count + ' checkpoints' : 'sin actividad'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Hora pico</div>
      <div class="radar-card-value">${peak ? peak.label : '—'}</div>
      <div class="radar-card-sub">${peak ? peak.count + ' sesiones a esa hora' : 'sin datos'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Completas / Rápidas</div>
      <div class="radar-card-value radar-card-value--sm">${completas}<span class="radar-card-value-secondary"> / ${rapidas}</span></div>
      <div class="radar-card-sub">${sTotal ? Math.round(completas/sTotal*100) + '% con protocolo' : '—'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Promedio / día activo</div>
      <div class="radar-card-value">${avgPerDay}</div>
      <div class="radar-card-sub">sesiones por día con actividad</div>
    </div>
  </div>`;

  // ── Clasificar IAs ────────────────────────────────────────────────────────
  const allAIs = state.ais.filter(a => !a.archived);
  const interrupted = allAIs.filter(a => a.interrupted);
  // T-182: En curso = IAs con draft activo (estado morado), excluidas de Disponibles
  const inSession   = allAIs.filter(a => !a.interrupted && _isInSession(a));
  const available   = allAIs
    .filter(a => a.status === 'available' && !a.interrupted && !_isInSession(a))
    .sort((a, b) => _hoyAvailableSince(a) - _hoyAvailableSince(b)); // más antigua primero
  const exhausted   = allAIs
    .filter(a => a.status === 'exhausted' && !a.interrupted)
    .sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b));   // próxima a liberarse primero

  let html = statsHTML;

  // ── Interrumpidas — mini-card naranja ────────────────────────────────────
  if (interrupted.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🟠 En curso (${interrupted.length})</div>
      <div class="hoy-available-grid">`;
    interrupted.forEach((ai, i) => { html += typeof buildHoyCard === 'function' ? buildHoyCard(ai, i) : '' });
    html += `</div></div>`;
  }

  // ── En curso — IAs con draft activo / estado morado (T-182) ─────────────
  if (inSession.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🟣 En curso (${inSession.length})</div>
      <div class="hoy-available-grid">`;
    inSession.forEach((ai, i) => { html += typeof buildHoyCard === 'function' ? buildHoyCard(ai, i, { inSession: true }) : '' });
    html += `</div></div>`;
  }

  // ── Disponibles — mini-card ──────────────────────────────────────────────
  if (available.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🟢 Disponibles (${available.length})</div>
      <div class="hoy-available-grid">`;
    available.forEach((ai, i) => { html += typeof buildHoyCard === 'function' ? buildHoyCard(ai, i) : '' });
    html += `</div></div>`;
  }

  // ── Agotadas — nuevo formato mini-card ───────────────────────────────────
  if (exhausted.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🔴 Agotadas (${exhausted.length}) — próxima primero</div>
      <div class="hoy-available-grid">`;
    exhausted.forEach((ai, i) => { html += typeof buildHoyCard === 'function' ? buildHoyCard(ai, i) : '' });
    html += `</div></div>`;
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  // T-202604-207: si no hay IAs en absoluto → empty state con CTA
  if (allAIs.length === 0) {
    html += `<div class="hoy-empty">
      <span class="hoy-empty-icon">🤖</span>
      <div class="hoy-empty-msg">Aún no tienes IAs registradas.</div>
      <button class="btn-primary" onclick="openAddAI()">+ Agregar primera IA</button>
    </div>`;
  } else if (!interrupted.length && !inSession.length && !available.length && !exhausted.length) {
    html += `<div class="hoy-empty"><span class="hoy-empty-icon">✨</span>No hay IAs registradas aún.</div>`;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  {
    const nextExh = exhausted.find(a => a.resetTime);
    const nextLabel = nextExh ? (() => {
      const ms = _hoyMsUntilReset(nextExh);
      const m = Math.floor(ms/60000); const h = Math.floor(m/60); const rm = m%60;
      return h > 0 ? `${h}h ${rm}m` : `${rm}min`;
    })() : null;
    const today = now.toLocaleDateString('es-MX', {weekday:'long', day:'numeric', month:'long'});
    html += `<div class="radar-footer">
      <span>${today}</span>
      <span>${nextLabel ? `⏳ próxima IA en ${nextLabel} (${esc(nextExh.name)})` : '✓ todas las IAs disponibles'}</span>
      <span class="radar-footer-version">${_effectiveVersion()}</span>
    </div>`;
  }

  el.innerHTML = html;
  // CSS Purity: animation-delay calculado en runtime → setProperty post-render
  el.querySelectorAll('[data-anim-delay]').forEach(card => {
    card.style.setProperty('animation-delay', card.dataset.animDelay + 'ms');
  });
  _startHoyTicker();
}


// T-202604-052: Selector de IA para captura rápida desde tab Hoy
// R-[pendiente-ID]: selectAIForQuickCapture reemplazado — openQuickCapture() sin id
// maneja skip si worker único y Paso 1 si múltiples
function selectAIForQuickCapture() {
  const available = (state.ais || []).filter(a => !a.archived);
  if (!available.length) {
    if (typeof showToast === 'function') showToast('warning', 'Sin Workers disponibles — todos agotados');
    return;
  }
  openQuickCapture();
}


// T-202604-215: Labels de status en español — fuente de verdad para UI
const STATUS_LABELS = {
  available:    'Disponible',
  exhausted:    'Agotada',
  insession:    'En curso',
  interrupted:  'Interrumpida'
};

const TG_PARSER_CONFIG = {
  TYPES: ['P', 'T', 'R', 'B'],
  TYPE_NAMES: { P: 'Ideas', T: 'Tickets', R: 'Requerimientos', B: 'Bugs' },
  STATUS_ALIASES: {
    'pendiente':'📤 Pendiente', '📤 pendiente':'📤 Pendiente',
    'backlog':'⏳ Backlog', '⏳ backlog':'⏳ Backlog',
    'done':'✅ DONE', '✅ done':'✅ DONE', 'listo':'✅ DONE',
    'en progreso':'🔄 En progreso', '🔄 en progreso':'🔄 En progreso',
    'in-progress':'🔄 En progreso', 'progreso':'🔄 En progreso',
    'descartado':'🗑 Descartado', '🗑 descartado':'🗑 Descartado'
  }
};

function normStatus(raw) {
  if (!raw) return '📤 Pendiente';
  const key = raw.trim().toLowerCase();
  const resolved = TG_PARSER_CONFIG.STATUS_ALIASES[key];
  if (!resolved) {
    console.warn('[AI Tracker] normStatus: status desconocido "' + raw.trim() + '" — usando "📤 Pendiente"');
    return '📤 Pendiente';
  }
  return resolved;
}
function buildTGPreview(items, discrepancy) {
  if (!items.length && !discrepancy) return '';
  let html = `<div class="preview-tg">
    <div class="preview-tg-header">
      <div class="preview-tg-header-label">📋 Items detectados</div>
      <div class="preview-tg-header-count">${items.length} ítem${items.length !== 1 ? 's' : ''}</div>
    </div>`;
  if (discrepancy) {
    html += `<div class="preview-tg-discrepancy">
      ⚠ ${discrepancy.raw} línea${discrepancy.raw !== 1 ? 's' : ''} en el texto — solo ${discrepancy.parsed} parseada${discrepancy.parsed !== 1 ? 's' : ''}. Verifica el formato de las líneas no detectadas.
    </div>`;
  }
  html += `<div class="preview-tg-badges-row">`;
  TG_PARSER_CONFIG.TYPES.forEach(type => {
    const count = items.filter(x => x.type === type).length;
    if (count) html += `<span class="preview-tg-badge ${type}" title="${TG_PARSER_CONFIG.TYPE_NAMES[type]} (${count})">${type} ${count}</span>`;
  });
  html += `</div>`;
  items.forEach(item => {
    const existing = (getActiveTracker().items || []).find(x => x.code === item.code);
    const tag = existing
      ? `<span class="preview-tg-tag update">↑ actualizar</span>`
      : `<span class="preview-tg-tag new">+ nuevo</span>`;
    // T-202605-436 AC4: indicador visual para ítems nuevos sin AC
    const noAcTag = (!existing && (!item.ac || item.ac.length === 0))
      ? `<span class="preview-tg-tag preview-tg-tag--warn" title="Ítem nuevo sin criterios de aceptación">sin AC</span>`
      : '';
    html += `<div class="preview-tg-row">
      <span class="preview-tg-badge ${item.type}">${item.type}</span>
      <span class="preview-tg-code">${esc(item.code)}</span>
      <span class="preview-tg-desc">${esc(item.title)}${tag}${noAcTag}</span>
      <span class="preview-tg-status">${esc(item.status)}</span>
    </div>`;
  });
  html += `</div>`;
  return html;
}

