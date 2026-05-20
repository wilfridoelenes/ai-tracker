// ai-tracker-checkpoint.js
// Última actualización: 2026-05-19 UTC-6
// UI, render, tabs, toast, theme, search — Tab Tracker extraído a locus-tracker.js
// Requiere: locus-storage.js, locus-toast.js, locus-tracker.js cargados ANTES en index.html


// Fuente de verdad de versión — actualizar aquí al hacer bump
const APP_VERSION = 'v3.4';

// R-202604-086: versión efectiva — localStorage override prevalece sobre APP_VERSION.
// Se escribe desde _mgApplyBumpedVersion() en ai-tracker-map-generator.js al confirmar el generador.
// APP_VERSION es el fallback de primer arranque; el generador es la fuente de verdad post-bump.
// T-074: umbral de días sin sesión para sugerencia contextual
const STALE_DAYS_THRESHOLD = 3;

// T-074: true si la IA lleva >STALE_DAYS_THRESHOLD días sin sesión Y tiene ítems pendientes
function _hasStaleSuggestion(ai) {
  if (ai.status === 'exhausted') return false;
  const aiSessions = getAISessions(ai.id);
  if (!aiSessions.length) return false;
  const last = aiSessions[aiSessions.length - 1];
  const lastDate = new Date(last.date);
  if (isNaN(lastDate)) return false;
  const diffDays = (Date.now() - lastDate.getTime()) / 86400000;
  if (diffDays <= STALE_DAYS_THRESHOLD) return false;
  const hasInProgress = ITEMS.some(i => i.status === 'pendiente'); // B-202605-046: 'en-progreso' es valor legacy — schema canónico usa 'pendiente'
  return hasInProgress;
}

// T-011: Avatar logos SVG — banco de logos predefinidos
const AVATAR_LOGOS = {
  claude: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.7"/><path d="M8 12a4 4 0 018 0" fill="currentColor"/></svg>',
  gpt4: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/></svg>',
  gemini: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 8l3 3-3 3-3-3 3-3z" fill="currentColor"/><path d="M15 11l3-3v6l-3-3z" fill="currentColor" opacity="0.6"/><path d="M9 11l-3-3v6l3-3z" fill="currentColor" opacity="0.6"/></svg>',
  llama: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/><path d="M10 14c0 1 1 2 2 2s2-1 2-2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 9l-1.5-2.5M17 9l1.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  mistral: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/></svg>',
  cohere: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/><circle cx="14" cy="11" r="1.5" fill="currentColor"/><path d="M10 11l2-3 2 3" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
  anthropic: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M8 11h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15.5" cy="9" r="1" fill="currentColor"/></svg>',
  default: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/><path d="M7 15c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
};
document.title = 'Locus ' + _effectiveVersion(); // v3.0.0.9.6

// Header project label — muestra Prefijo · Nombre canónico del proyecto activo
// R-202605-167: Breadcrumb interactivo — proyecto › sprint › ítem activo
// Extiende _updateHeaderProjectLabel — no crea función nueva.
// La estructura de tres <button> siempre está en el DOM; visibilidad por clase.
function _updateHeaderProjectLabel() {
  // ── Segmento 1: proyecto ──────────────────────────────────────────────────
  const projBtn    = document.getElementById('breadcrumb-proj');
  const firstSep   = document.querySelector('.breadcrumb-sep--first');
  const sprintBtn  = document.getElementById('breadcrumb-sprint');
  const sprintSep  = document.querySelector('.breadcrumb-sep--sprint');
  const itemBtn    = document.getElementById('breadcrumb-item');
  if (!projBtn) return;

  const filterId = (typeof _getActiveProjectFilter === 'function') ? _getActiveProjectFilter() : '';
  const proj = filterId && (typeof getProjectById === 'function') ? getProjectById(filterId) : null;

  if (proj) {
    projBtn.textContent = proj.name || 'Proyecto';
    projBtn.removeAttribute('disabled');
  } else {
    // Sin proyecto activo → texto plano sin interacción
    projBtn.textContent = 'Locus';
    projBtn.setAttribute('disabled', '');
  }

  // ── Segmento 2: sprint ────────────────────────────────────────────────────
  if (sprintBtn && sprintSep) {
    const sp = proj && proj.sprints
      ? proj.sprints.find(s => s.status === 'active')
      : null;

    if (sp) {
      sprintBtn.textContent = sp.label || sp.id || 'Sprint';
      sprintBtn.title = 'Ver sprint health';
      sprintBtn.classList.remove('breadcrumb-seg--hidden');
      sprintSep.classList.remove('breadcrumb-seg--hidden');
      if (firstSep) firstSep.classList.remove('breadcrumb-seg--hidden');
    } else {
      sprintBtn.classList.add('breadcrumb-seg--hidden');
      sprintSep.classList.add('breadcrumb-seg--hidden');
      if (firstSep) firstSep.classList.add('breadcrumb-seg--hidden');
    }
  }

  // ── Segmento 3: ítem activo del Worker seleccionado ───────────────────────
  if (itemBtn) {
    let activeItem = null;
    try {
      if (typeof _trackerSelectedId !== 'undefined' && _trackerSelectedId) {
        const tracker = (typeof getActiveTracker === 'function') ? getActiveTracker() : { items: [] };
        const items = tracker.items || [];
        // Ítems pendientes/en-curso vinculados a sesiones del AI seleccionado
        const aiSessions = (typeof getAllSessions === 'function')
          ? getAllSessions().filter(s => s.aiId === _trackerSelectedId)
          : [];
        const sessIds = new Set(aiSessions.map(s => s.id));
        const linked = items.filter(i =>
          i.status !== 'done' &&
          i.status !== 'descartado' &&
          i.sessionId && sessIds.has(i.sessionId)
        );
        if (linked.length > 0) {
          // Preferir el de mayor prioridad
          const PRI = { high: 0, medium: 1, low: 2 };
          linked.sort((a, b) => (PRI[a.priority] ?? 3) - (PRI[b.priority] ?? 3));
          activeItem = linked[0];
        }
      }
    } catch (e) {}

    if (activeItem) {
      const code = activeItem.code || '';
      const title = activeItem.title || activeItem.desc || code;
      const label = code ? code + (title ? ' ' + title : '') : title;
      itemBtn.textContent = label;
      itemBtn.title = 'Ver ítem ' + code;
      itemBtn.onclick = function () {
        const _allItems = (typeof ITEMS !== 'undefined') ? ITEMS : [];
        const _target = _allItems.find(function(b) { return b.code === code; });
        if (_target && typeof openItemPanel === 'function') {
          openItemPanel(_target);
        } else if (typeof navigateToItem === 'function') {
          navigateToItem(code);
        }
      };
      itemBtn.classList.remove('breadcrumb-seg--hidden');
    } else {
      itemBtn.textContent = '';
      itemBtn.title = '';
      itemBtn.onclick = null;
      itemBtn.classList.add('breadcrumb-seg--hidden');
    }
  }
}
// Exponer para que sprint-project.js lo llame al cambiar proyecto
window._updateHeaderProjectLabel = _updateHeaderProjectLabel;

// AC-8: Firebase eliminado — Supabase es el único backend de sync
// setSyncStatus y handleSyncPillClick → migradas a locus-storage.js

// ── T-202605-482c: Supabase Auth — migrado a locus-storage.js ──
// El bloque de inicialización de Supabase (createClient, onAuthStateChange, getSession)
// vive en locus-storage.js que carga antes. Eliminado aquí para evitar duplicación.


// navegar al Tracker enfocando la card de una IA
function _scrollToCard(aiId) {
  const detail = document.querySelector('.tracker-detail');
  if (detail) detail.scrollTop = 0;
}

function navigateToCard(aiId) {
  _trackerSelectedId = aiId;
  switchTab('tracker');
  setTimeout(() => {
    if (typeof render === 'function') render();
    _scrollToCard(aiId);
    const ta = document.getElementById('ta-' + aiId);
    if (ta) setTimeout(() => { ta.focus(); enterFocusMode(aiId); }, 80);
  }, 80);
}


// ── UI Shell — extraído a locus-ui-shell.js ──────────────────────────────
// switchTab, toggleTheme, applyTheme, onSearchDispatch, renderSetupChecklist,
// _scbDismissed, _scbDismiss, _scbStep, _scbExpand, _scbCollapse,
// _scbOnStepComplete, _scbStepAction
// ─────────────────────────────────────────────────────────────────────────


function updateStats() {
  // v3: contar sesiones desde proyectos
  const tot = getAllSessions().length;
  // Actualizar badge del sub-tab Tracker (tg-badge-sub)
  const tgBadgeSub = document.getElementById('tg-badge-sub');
  if (tgBadgeSub) {
    const tracker = getActiveTracker();
    const activeCount = (tracker.items || []).filter(x => x.status !== 'done').length;
    tgBadgeSub.textContent = activeCount;
    tgBadgeSub.classList.toggle('tg-badge-sub--visible', !!activeCount);
  }
}

// Detecta si una IA está "en sesión": disponible con última sesión sin resetAt ni quickCapture
// = checkpoint registrado pero aún no se agotó formalmente
function _isInSession(ai) {
  if (ai.status !== 'available' || ai.interrupted) return false;
  // Usar id (timestamp) como proxy de orden — más robusto que date (formato localizado)
  const allSess = getAllSessions().filter(s => s.aiId === ai.id);
  if (!allSess.length) return false;
  const last = allSess.reduce((a, b) => (parseInt(b.id) || 0) > (parseInt(a.id) || 0) ? b : a);
  return !!(last && !last.resetAt && !last.quickCapture);
}

// T-086 / T-202604-181: Barra de estado sobre el grid (solo vista Cards)
// T-202605-523: helper compartido — evita recalcular sprint activo en múltiples bloques de renderStatusBar
function _getActiveSprintStats() {
  try {
    const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
    const sp = proj && proj.sprints ? proj.sprints.find(s => s.status === 'active') : null;
    if (!sp) return { sp: null, spItems: [], spDone: 0, spTotal: 0, spPct: 0, spLabel: '' };
    const spItems = (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(i => i.sprint === sp.id);
    const spDone  = spItems.filter(i => i.status === 'done').length;
    const spTotal = spItems.length;
    const spPct   = spTotal > 0 ? Math.round((spDone / spTotal) * 100) : 0;
    const spLabel = sp.label || sp.id || '';
    return { sp, spItems, spDone, spTotal, spPct, spLabel };
  } catch(e) {
    return { sp: null, spItems: [], spDone: 0, spTotal: 0, spPct: 0, spLabel: '' };
  }
}

// Contenido: toggle tema (izq) · Sprint activo · Pendientes · Último cambio relativo (der)
function renderStatusBar() {
  // R-202604-060: tracker-status-bar DEPRECATED — lógica migrada a tracker-grid-header + global-footer

  // ── R-202605-168: Sprint progress bar — segunda fila del header ───────────
  // Reutiliza el cálculo de sprint activo; no duplica lógica.
  try {
    const _hsrRow    = document.getElementById('header-sprint-row');
    const _hsrLabel  = document.getElementById('hsr-label');
    const _hsrFill   = document.getElementById('hsr-bar-fill');
    const _hsrText   = document.getElementById('hsr-text');
    if (_hsrRow) {
      const { sp: _hsprSp, spDone: _hsprDone, spTotal: _hsprTotal, spPct: _hsprPct } = _getActiveSprintStats();

      if (_hsprSp) {
        if (_hsrLabel) _hsrLabel.textContent = _hsprSp.label || _hsprSp.id || '';
        if (_hsrFill) {
          _hsrFill.style.setProperty('--hsr-pct', _hsprPct + '%');
          _hsrFill.classList.toggle('hsr-bar-fill--success', _hsprPct >= 70);
          _hsrFill.classList.toggle('hsr-bar-fill--accent',  _hsprPct < 70);
        }
        if (_hsrText) _hsrText.textContent = _hsprPct + '% · ' + _hsprDone + '/' + _hsprTotal;
        _hsrRow.setAttribute('aria-valuenow', _hsprPct);
        _hsrRow.classList.add('hsr-visible');
      } else {
        _hsrRow.classList.remove('hsr-visible');
      }
    }
  } catch (e) {}

  // Sincronizar breadcrumb con el estado actual de sprint/proyecto
  if (typeof _updateHeaderProjectLabel === 'function') _updateHeaderProjectLabel();

  // ── Grid header: vacío — pill migrado a tracker-view-header (R-202605-139) ──
  const gridHeader = document.getElementById('tracker-grid-header');
  if (gridHeader) {
    gridHeader.innerHTML = '';
    gridHeader.classList.remove('tgh-visible');
  }

  // ── R-202605-139: sprint pill en tracker-view-header ──────────────────────────────────
  // El sprint pertenece al proyecto activo, no a un AI individual.
  // El pill vive a la izquierda del selector de vista, siempre visible en el tab Tracker.
  const viewHeader = document.getElementById('tracker-view-header');
  if (viewHeader) {
    let sprintPillHtml = '';
    try {
      const { sp, spDone, spTotal, spPct, spLabel } = _getActiveSprintStats();
      if (sp) {
        sprintPillHtml = `<button class="tgh-sprint-pill tvh-sprint-pill" onclick="if(typeof toggleSprintHealthPanel==='function')toggleSprintHealthPanel();" title="Ver sprint health">` +
          `<span class="tgh-sprint-name">${spLabel}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-progress">${spDone}/${spTotal}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-pct">${spPct}%</span>` +
          `<span class="tgh-sprint-bar-wrap"><span class="tgh-sprint-bar-fill" style="--pct:${spPct}%"></span></span>` +
          `</button>`;
      }
    } catch(e) {}

    const existingPill = viewHeader.querySelector('.tvh-sprint-pill');
    if (existingPill) {
      if (sprintPillHtml) {
        existingPill.outerHTML = sprintPillHtml;
      } else {
        existingPill.remove();
      }
    } else if (sprintPillHtml) {
      viewHeader.insertAdjacentHTML('afterbegin', sprintPillHtml);
    }
  }


  // ── Global footer: R-202604-080 — barra de estado global ─────────────────
  const gfProyecto = document.getElementById('gf-proyecto');
  const gfVersion  = document.getElementById('gf-version');
  const gfTotal    = document.getElementById('gf-total');
  const gfDone     = document.getElementById('gf-done');
  const gfCkpt     = document.getElementById('gf-ckpt');
  const gfPulso    = document.getElementById('gf-pulso');
  const gfFecha    = document.getElementById('gf-fecha');
  const gfSyncEl   = document.getElementById('gf-sync');
  if (gfSyncEl) gfSyncEl.classList.remove('gf-hidden');

  const _items = (typeof ITEMS !== 'undefined' ? ITEMS : []);

  // gf-proyecto
  if (gfProyecto) {
    try {
      const proj = getActiveProject();
      const nombre = (proj && proj.name) ? proj.name : 'Locus';
      gfProyecto.textContent = nombre;
      gfProyecto.classList.remove('gf-hidden');
    } catch(e) {
      gfProyecto.textContent = 'Locus';
      gfProyecto.classList.remove('gf-hidden');
    }
  }

  // gf-version
  if (gfVersion) {
    gfVersion.textContent = (typeof _effectiveVersion === 'function') ? _effectiveVersion() : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '');
    gfVersion.classList.remove('gf-hidden');
  }

  // gf-total / gf-done
  if (gfTotal || gfDone) {
    const total = _items.filter(i => typeof _isCountableItem === 'function' ? _isCountableItem(i) : true).length;
    const done  = _items.filter(i => (typeof _isCountableItem === 'function' ? _isCountableItem(i) : true) && i.status === 'done').length;
    if (gfTotal) { gfTotal.textContent = total + ' ítems'; gfTotal.classList.remove('gf-hidden'); }
    if (gfDone)  { gfDone.textContent  = '✓ ' + done;   gfDone.classList.remove('gf-hidden'); }
  }

  // gf-ckpt: ultimo checkpoint global
  if (gfCkpt) {
    try {
      const allSess = getAllSessions().slice().sort((a, b) => {
        const ta = a.timestamp || a.endTime || a.startTime || 0;
        const tb = b.timestamp || b.endTime || b.startTime || 0;
        return tb - ta;
      });
      const lastSess = allSess[0] || null;
      if (lastSess) {
        const titulo = (lastSess.title || lastSess.nombre || '').slice(0, 28) || '—';
        gfCkpt.textContent = '⏱ ' + titulo;
        gfCkpt.classList.remove('gf-hidden');
        gfCkpt.classList.add('gf-ckpt--link');
        gfCkpt.onclick = function() {
          if (typeof openDetail === 'function') openDetail(lastSess.aiId, lastSess.id);
        };
      } else {
        gfCkpt.classList.add('gf-hidden');
        gfCkpt.onclick = null;
      }
    } catch(e) { gfCkpt.classList.add('gf-hidden'); }
  }

  // gf-pulso
  if (gfPulso) {
    gfPulso.textContent = '◉ Pulso';
    gfPulso.classList.remove('gf-hidden');
    gfPulso.classList.add('gf-pulso--link');
    gfPulso.onclick = function() {
      if (typeof openPulsoPanel === 'function') openPulsoPanel();
    };
  }

  // gf-fecha
  if (gfFecha) {
    try {
      const timestamps = _items.map(i => i.statusChangedAt).filter(Boolean);
      if (timestamps.length) {
        const maxTs = Math.max.apply(null, timestamps);
        const iso   = new Date(maxTs).toISOString().split('T')[0];
        gfFecha.textContent = iso;
        gfFecha.classList.remove('gf-hidden');
      } else {
        gfFecha.classList.add('gf-hidden');
      }
    } catch(e) { gfFecha.classList.add('gf-hidden'); }
  }
}

// AI STATUS BAR — footer persistente visible en todos los módulos
// Dot gris = agotada | dot verde = disponible | dot púrpura pulsante = en sesión | dot ámbar pulsante = interrumpida

// T-202604-422: Notificaciones de ecosistema — motor + helpers
const _NOTIF_KEY         = 'ai-tracker-notifs-read';
const _NOTIF_CONFIG_KEY  = 'ai-tracker-notifs-config';
// R-202605-119: historial de notificaciones descartadas
const _NOTIF_HISTORY_KEY = 'ai-tracker-notifs-history';
const _NOTIF_HISTORY_MAX = 50;

// R-202605-119: helpers de historial
function _notifHistory() {
  try { return JSON.parse(localStorage.getItem(_NOTIF_HISTORY_KEY) || '[]'); } catch { return []; }
}

function _notifHistoryAdd(notif) {
  // severity: 'info' para la mayoría, 'warn' para bugs high y sprint low, 'ok' para desbloqueados
  const severityMap = { bugHigh: 'warn', sprintLow: 'warn', unblocked: 'ok', sprintOrphans: 'warn' };
  const entry = {
    type:      notif.type,
    severity:  severityMap[notif.type] || 'info',
    text:      notif.title + ' — ' + notif.body,
    ts:        Date.now(),
    projectId: notif.projectId || null
  };
  const hist = _notifHistory();
  hist.push(entry);
  // AC-4: FIFO — máximo 50 entradas
  const pruned = hist.length > _NOTIF_HISTORY_MAX ? hist.slice(hist.length - _NOTIF_HISTORY_MAX) : hist;
  try { localStorage.setItem(_NOTIF_HISTORY_KEY, JSON.stringify(pruned)); } catch {}
}

// Configuración de notificaciones — tipos habilitados y umbrales de tiempo
// B-202605-240: persiste en localStorage
const _NOTIF_DEFAULTS = {
  unblocked:     { enabled: true,  label: 'Bloqueante resuelto',              threshold: 7  },
  sprintOrphans: { enabled: true,  label: 'Sprint cerrado con pendientes',    threshold: 0  },
  itemInactivo:  { enabled: true,  label: 'Ítem sin sesión vinculada',        threshold: 14 },
  sprintLow:     { enabled: true,  label: 'Sprint con avance bajo a mitad',   threshold: 20 },
  bugHigh:       { enabled: true,  label: 'Bug high sin sesión vinculada',    threshold: 7  },
  aiCadencia:    { enabled: true,  label: 'IA fuera de cadencia histórica',   threshold: 0  },
};

function _notifConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(_NOTIF_CONFIG_KEY) || '{}');
    // Merge con defaults — nuevos tipos no borran config existente
    const merged = {};
    Object.keys(_NOTIF_DEFAULTS).forEach(k => {
      merged[k] = Object.assign({}, _NOTIF_DEFAULTS[k], stored[k] || {});
    });
    return merged;
  } catch { return Object.assign({}, _NOTIF_DEFAULTS); }
}

function _saveNotifConfig(cfg) {
  try { localStorage.setItem(_NOTIF_CONFIG_KEY, JSON.stringify(cfg)); } catch {}
}

function _notifReadSet() {
  try { return new Set(JSON.parse(localStorage.getItem(_NOTIF_KEY) || '[]')); } catch { return new Set(); }
}
function _notifSaveRead(set) {
  try { localStorage.setItem(_NOTIF_KEY, JSON.stringify([...set])); } catch {}
}

// Computa todas las notificaciones activas del ecosistema
// B-202605-238: implementa los 4 triggers del AC de R-202604-084
// Devuelve array de { id, type, tab, icon, title, body, action }
// Función canónica — ¿tiene el ítem sesión vinculada en los últimos N días?
// Consulta trackerRefs + backlogRefs. Usa savedAt || createdAt como timestamp.
// Fallback: si el ítem fue creado hace menos de N días sin ninguna mención, retorna true.
function hasRecentSession(item, days) {
  if (!item) return true;
  const allSess = (typeof getAllSessions === 'function' ? getAllSessions() : []);
  const cutoff  = Date.now() - days * 86400000;
  let lastMentionTs = 0;
  allSess.forEach(function(s) {
    const refs = (s.trackerRefs || []).concat(s.backlogRefs || []);
    if (refs.includes(item.code)) {
      const ts = s.savedAt || s.createdAt || (s.date ? new Date(s.date).getTime() : 0);
      if (ts > lastMentionTs) lastMentionTs = ts;
    }
  });
  if (!lastMentionTs) {
    const createdAt = item.createdAt || 0;
    if (!createdAt) return false;
    return (Date.now() - createdAt) / 86400000 <= days;
  }
  return lastMentionTs >= cutoff;
}

function _computeNotifications() {
  const notifs = [];
  const items  = (typeof ITEMS !== 'undefined' ? ITEMS : []);
  const cfg    = _notifConfig();

  // Helper interno — delega a función canónica
  function _itemHasRecentSession(item, days) {
    return hasRecentSession(item, days);
  }

  // 1. Bloqueante resuelto — pendiente con dep done + history.unblocked reciente
  if (cfg.unblocked && cfg.unblocked.enabled) {
    items.forEach(function(item) {
      if (item.status !== 'pendiente') return;
      if (!item.blockedBy || !item.blockedBy.length) return;
      const resolved = item.blockedBy.filter(function(c) {
        const dep = items.find(function(i) { return i.code === c; });
        return dep && dep.status === 'done';
      });
      if (!resolved.length) return;
      const recent = (item.history || []).find(function(h) {
        return h.type === 'unblocked' &&
          resolved.includes(h.data && h.data.by) &&
          (Date.now() - (h.ts || 0)) / 86400000 < (cfg.unblocked.threshold || 7);
      });
      if (!recent) return;
      const id  = 'unblocked-' + item.code + '-' + recent.ts;
      const lbl = (item.title || '').substring(0, 48);
      notifs.push({
        id, type: 'unblocked', tab: 'backlog', icon: '\uD83D\uDD13',
        title: 'Bloqueante resuelto',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + ' ya puede avanzar',
        action: function() { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
      });
    });
  }

  // 2. Sprint cerrado con pendientes sin reasignar
  if (cfg.sprintOrphans && cfg.sprintOrphans.enabled) {
    const allSprints = (typeof getActiveSprints === 'function' ? getActiveSprints() : []);
    allSprints.filter(function(s) { return s.status === 'closed'; }).forEach(function(sp) {
      const orphans = items.filter(function(i) { return i.sprint === sp.id && i.status === 'pendiente'; });
      if (!orphans.length) return;
      const id  = 'sprint-orphans-' + sp.id;
      const cnt = orphans.length;
      notifs.push({
        id, type: 'sprintOrphans', tab: 'backlog', icon: '\u26A0\uFE0F',
        title: 'Sprint cerrado con pendientes',
        body: (sp.label || sp.id) + ' \u2014 ' + cnt + ' \xEDtem' + (cnt !== 1 ? 's' : '') + ' sin reasignar',
        action: function() {
          if (typeof switchTab === 'function') switchTab('backlog');
          if (typeof setFilter === 'function') setTimeout(function() { setFilter('sprint', sp.id); }, 80);
        }
      });
    });
  }

  // 3. B-202605-238 AC: ítem pendiente sin sesión vinculada > 14 días
  if (cfg.itemInactivo && cfg.itemInactivo.enabled) {
    const thresh = cfg.itemInactivo.threshold || 14;
    items.forEach(function(item) {
      if (item.status !== 'pendiente') return;
      if (!item.createdAt) return;
      const ageDays = (Date.now() - item.createdAt) / 86400000;
      if (ageDays <= thresh) return;
      if (_itemHasRecentSession(item, thresh)) return;
      const id  = 'item-inactivo-' + item.code;
      const lbl = (item.title || '').substring(0, 40);
      notifs.push({
        id, type: 'itemInactivo', tab: 'backlog', icon: '\uD83D\uDD51',
        title: 'Ítem sin actividad',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + ' sin sesión en ' + Math.floor(ageDays) + ' días',
        action: function() { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
      });
    });
  }

  // 4. B-202605-238 AC: sprint con < 20% avance a mitad de período
  if (cfg.sprintLow && cfg.sprintLow.enabled) {
    const minPct = cfg.sprintLow.threshold != null ? cfg.sprintLow.threshold : 20;
    const allSprints2 = (typeof getActiveSprints === 'function' ? getActiveSprints() : []);
    allSprints2.filter(function(s) { return s.status === 'active'; }).forEach(function(sp) {
      if (!sp.startedAt || !sp.endsAt) return;
      const now      = Date.now();
      const total    = sp.endsAt - sp.startedAt;
      const elapsed  = now - sp.startedAt;
      if (total <= 0 || elapsed / total < 0.5) return; // aún no llega a mitad
      const spItems  = items.filter(function(i) { return i.sprint === sp.id; });
      const spDone   = spItems.filter(function(i) { return i.status === 'done'; }).length;
      const spPct    = spItems.length > 0 ? Math.round((spDone / spItems.length) * 100) : 0;
      if (spPct >= minPct) return;
      const id = 'sprint-low-' + sp.id;
      notifs.push({
        id, type: 'sprintLow', tab: 'backlog', icon: '\u26A1',
        title: 'Sprint con avance bajo',
        body: (sp.label || sp.id) + ' \u2014 ' + spPct + '% a mitad del período',
        action: function() {
          if (typeof switchTab === 'function') switchTab('backlog');
          if (typeof toggleSprintHealthPanel === 'function') setTimeout(toggleSprintHealthPanel, 80);
        }
      });
    });
  }

  // 5. B-202605-238 AC: B de prioridad high sin sesión vinculada > 7 días
  if (cfg.bugHigh && cfg.bugHigh.enabled) {
    const bugThresh = cfg.bugHigh.threshold || 7;
    items.forEach(function(item) {
      if (item.type !== 'B') return;
      if (item.priority !== 'high') return;
      if (item.status !== 'pendiente') return;
      if (!item.createdAt) return;
      const ageDays = (Date.now() - item.createdAt) / 86400000;
      if (ageDays <= bugThresh) return;
      if (_itemHasRecentSession(item, bugThresh)) return;
      const id  = 'bug-high-' + item.code;
      const lbl = (item.title || '').substring(0, 40);
      notifs.push({
        id, type: 'bugHigh', tab: 'backlog', icon: '\uD83D\uDED1',
        title: 'Bug high sin atención',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + ' lleva ' + Math.floor(ageDays) + ' días sin sesión',
        action: function() { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
      });
    });
  }

  // 6. B-202605-238 AC: IA sin sesión vs cadencia histórica
  if (cfg.aiCadencia && cfg.aiCadencia.enabled) {
    const active = (typeof state !== 'undefined' ? (state.ais || []) : []).filter(function(a) { return !a.archived; });
    active.forEach(function(ai) {
      if (ai.status === 'exhausted') return;
      const allSess  = (typeof getAllSessions === 'function' ? getAllSessions() : [])
        .filter(function(s) { return s.aiId === ai.id; })
        .sort(function(a, b) { return (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0); });
      if (allSess.length < 3) return; // sin cadencia establecida
      // Calcular intervalo promedio entre las últimas 6 sesiones
      const recent6   = allSess.slice(-6);
      let totalGap = 0, gapCount = 0;
      for (let i = 1; i < recent6.length; i++) {
        const diff = (new Date(recent6[i].date).getTime() || 0) - (new Date(recent6[i - 1].date).getTime() || 0);
        if (diff > 0) { totalGap += diff; gapCount++; }
      }
      if (!gapCount) return;
      const avgGapMs  = totalGap / gapCount;
      const lastSess  = allSess[allSess.length - 1];
      const sinceMs   = Date.now() - (new Date(lastSess.date).getTime() || 0);
      if (sinceMs < avgGapMs * 1.5) return; // dentro del 150% de cadencia normal
      const sinceD    = Math.floor(sinceMs / 86400000);
      const id        = 'ai-cadencia-' + ai.id;
      notifs.push({
        id, type: 'aiCadencia', tab: 'tracker', icon: '\uD83E\uDD16',
        title: 'IA fuera de cadencia',
        body: (ai.name || ai.id) + ' sin sesión en ' + sinceD + ' días (cadencia habitual: ' + Math.round(avgGapMs / 86400000) + 'd)',
        action: function() {
          if (typeof switchTab === 'function') switchTab('tracker');
          if (typeof navigateToCard === 'function') setTimeout(function() { navigateToCard(ai.id); }, 80);
        }
      });
    });
  }

  return notifs;
}

function markNotifRead(id) {
  // AC-3: guardar en historial antes de marcar como leída
  const all    = _computeNotifications();
  const notif  = all.find(function(n) { return n.id === id; });
  if (notif) _notifHistoryAdd(notif);
  const set = _notifReadSet();
  set.add(id);
  _notifSaveRead(set);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  updateTabNotifBadges();
}

function markAllNotifsRead() {
  const notifs = _computeNotifications();
  const set    = _notifReadSet();
  // AC-3: guardar todas en historial antes de marcar
  notifs.forEach(function(n) { _notifHistoryAdd(n); });
  notifs.forEach(function(n) { set.add(n.id); });
  _notifSaveRead(set);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  updateTabNotifBadges();
}

// B-202605-239: badges numéricos en tab buttons — un badge por tab con notifs no leídas
// tab field en cada notif determina qué tab recibe el badge
function updateTabNotifBadges() {
  const notifs = _computeNotifications();
  const read   = _notifReadSet();
  const unseen = notifs.filter(function(n) { return !read.has(n.id); });

  // Contar por tab
  const counts = { tracker: 0, backlog: 0, analytics: 0, proyectos: 0 };
  unseen.forEach(function(n) {
    if (n.tab && counts.hasOwnProperty(n.tab)) counts[n.tab]++;
  });

  // Actualizar badges en cada tab button
  Object.keys(counts).forEach(function(tab) {
    const btn = document.getElementById('tab-btn-' + tab);
    if (!btn) return;
    let badge = btn.querySelector('.tab-notif-badge');
    if (counts[tab] > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'tab-notif-badge';
        btn.appendChild(badge);
      }
      badge.textContent = counts[tab] > 9 ? '9+' : counts[tab];
      badge.classList.remove('is-hidden');
    } else {
      if (badge) badge.classList.add('is-hidden');
    }
  });
}

// B-202605-240: UI de configuración de notificaciones — tipos y umbrales
// R-202605-119: openNotifConfig redirige al Radar Sidebar — config unificada ahí
function openNotifConfig() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  // Expandir sidebar si está colapsado
  if (sidebar.classList.contains('collapsed')) {
    toggleRadarSidebar();
  }
  // Re-renderizar para asegurar que el panel esté presente
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  // Expandir el panel config con un tick para que el DOM esté listo
  setTimeout(function() {
    var body  = document.getElementById('rsb-cfg-body');
    var arrow = document.getElementById('rsb-cfg-arrow');
    var btn   = document.getElementById('rsb-cfg-toggle-btn');
    if (body && body.classList.contains('rsb-cfg-body--hidden')) {
      body.classList.remove('rsb-cfg-body--hidden');
      if (arrow) arrow.textContent = '▾';
      if (btn)   btn.setAttribute('aria-expanded', 'true');
      body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 50);
}

function _notifConfigReset() {
  try { localStorage.removeItem(_NOTIF_CONFIG_KEY); } catch {}
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}

function _notifConfigSetEnabled(key, enabled) {
  const cfg = _notifConfig();
  if (!cfg[key]) cfg[key] = Object.assign({}, _NOTIF_DEFAULTS[key]);
  cfg[key].enabled = !!enabled;
  _saveNotifConfig(cfg);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}

function _notifConfigSetThreshold(key, val) {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 1) return;
  const cfg = _notifConfig();
  if (!cfg[key]) cfg[key] = Object.assign({}, _NOTIF_DEFAULTS[key]);
  cfg[key].threshold = num;
  _saveNotifConfig(cfg);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}


const _notifActionMap = {};
function _registerNotifActions(notifs) {
  notifs.forEach(function(n) { _notifActionMap[n.id] = n.action; });
}
function _notifGoto(id) {
  const fn = _notifActionMap[id];
  if (typeof fn === 'function') fn();
  markNotifRead(id);
}

// RADAR — movido a locus-radar.js

// T-097: Colapsar/expandir todas las cards activas
function toggleCollapseAll() {
  const active = state.ais.filter(a => !a.archived);
  const allCollapsed = active.every(a => !a.showAll);
  active.forEach(a => { a.showAll = allCollapsed; });
  save(); if (typeof render === 'function') render();
}



// ── R-[pendiente-ID]: Quick Capture — modal unificado con stepper ──
// Reemplaza: T-071 (quick-modal-overlay) + selectAIForQuickCapture (ai-quick-select-modal)
// Shell HTML: #qc-modal-overlay con #qc-panel-1 (selector) y #qc-panel-2 (formulario)
// CSS: locus-modals.css §qc-

let _quickAIId = null;
let _qcStep = 0; // 0 = sin inicializar · 1 = paso 1 · 2 = paso 2

// ── Helpers internos ──

function _qcEl(id) { return document.getElementById(id); }

// AC-10: transición entre pasos via .hidden — sin style.display (CSS Purity H-01/H-02)
function _qcSetStep(step) {
  _qcStep = step;
  const panel1 = _qcEl('qc-panel-1');
  const panel2 = _qcEl('qc-panel-2');
  const dot1   = _qcEl('qc-dot-1');
  const dot2   = _qcEl('qc-dot-2');
  const stepper = _qcEl('qc-stepper');
  const backBtn = _qcEl('qc-back-btn');
  const nextBtn = _qcEl('qc-next-btn');

  if (step === 1) {
    panel1.classList.remove('hidden');
    panel2.classList.add('hidden');
    dot1.classList.add('qc-dot--active');
    dot2.classList.remove('qc-dot--active');
    stepper.setAttribute('aria-label', 'Paso 1 de 2');
    backBtn.textContent = 'Cancelar';
    nextBtn.textContent = 'Continuar';
    nextBtn.disabled = !_qcEl('qc-worker-list').querySelector('.qc-worker-item--selected');
  } else {
    panel1.classList.add('hidden');
    panel2.classList.remove('hidden');
    dot1.classList.remove('qc-dot--active');
    dot2.classList.add('qc-dot--active');
    stepper.setAttribute('aria-label', 'Paso 2 de 2');
    backBtn.textContent = 'Atrás';
    nextBtn.textContent = 'Guardar';
    nextBtn.disabled = false;
    // AC-11: foco al primer elemento interactivo del Paso 2
    setTimeout(() => { const qt = _qcEl('quick-title'); if (qt) qt.focus(); }, 60);
  }
}

// Inyecta lista de Workers en Paso 1 — genera qc-worker-item por cada Worker activo
function _qcRenderWorkerList() {
  const list = _qcEl('qc-worker-list');
  if (!list) return;
  const available = (state.ais || []).filter(a => !a.archived);
  list.innerHTML = available.map(ai => `
    <button class="qc-worker-item" data-worker-id="${esc(ai.id)}" onclick="qcSelectWorker(this)">
      <span class="qc-worker-avatar">${esc((ai.sigla || ai.name || '?').slice(0,2).toUpperCase())}</span>
      <span class="qc-worker-name">${esc(ai.name)}</span>
      <span class="qc-worker-check hidden">✓</span>
    </button>
  `).join('');
}

// ── API pública ──

// AC-03/04/05: abre modal — con id salta Paso 1 (skip), sin id muestra selector
function openQuickCapture(id) {
  const overlay = _qcEl('qc-modal-overlay');
  if (!overlay) return;

  // Limpiar estado previo
  _quickAIId = null;
  _qcStep = 0;
  _qcEl('quick-title').value = '';
  _qcEl('quick-summary').value = '';
  _qcEl('quick-hora').value = '';
  _qcEl('quick-hora-disp').textContent = 'hora de desbloqueo (opcional)';

  const available = (state.ais || []).filter(a => !a.archived);

  if (id) {
    // Llamado directo con Worker conocido — skip Paso 1 (AC-05)
    _quickAIId = id;
    _qcEl('qc-stepper').classList.add('hidden'); // sin stepper en skip
    _qcEl('qc-worker-chip-name').textContent = (getAI(id) || {}).name || id;
    overlay.classList.add('open');
    _qcSetStep(2);
  } else if (available.length === 1) {
    // AC-05: un solo Worker — skip Paso 1 directamente
    _quickAIId = available[0].id;
    _qcEl('qc-stepper').classList.add('hidden');
    _qcEl('qc-worker-chip-name').textContent = available[0].name;
    overlay.classList.add('open');
    _qcSetStep(2);
  } else {
    // Múltiples Workers — mostrar Paso 1
    _qcEl('qc-stepper').classList.remove('hidden');
    _qcRenderWorkerList();
    overlay.classList.add('open');
    _qcSetStep(1);
  }
}

// AC-04: selección de Worker en Paso 1
function qcSelectWorker(el) {
  _qcEl('qc-worker-list').querySelectorAll('.qc-worker-item').forEach(item => {
    item.classList.remove('qc-worker-item--selected');
    item.querySelector('.qc-worker-check').classList.add('hidden');
  });
  el.classList.add('qc-worker-item--selected');
  el.querySelector('.qc-worker-check').classList.remove('hidden');
  _quickAIId = el.dataset.workerId;
  _qcEl('qc-next-btn').disabled = false;
}

// Botón Continuar / Guardar
function qcHandleNext() {
  if (_qcStep === 1) {
    if (!_quickAIId) return;
    _qcEl('qc-worker-chip-name').textContent = (getAI(_quickAIId) || {}).name || _quickAIId;
    _qcSetStep(2);
  } else {
    confirmQuickCapture();
  }
}

// Botón Cancelar / Atrás
function qcHandleBack() {
  if (_qcStep === 2 && _qcEl('qc-stepper') && !_qcEl('qc-stepper').classList.contains('hidden')) {
    // En Paso 2 con stepper visible → volver a Paso 1
    _quickAIId = null;
    _qcSetStep(1);
  } else {
    closeQuickCapture();
  }
}

// Cierra el modal y limpia estado
function closeQuickCapture(e) {
  if (e && e.target !== _qcEl('qc-modal-overlay')) return;
  _qcEl('qc-modal-overlay').classList.remove('open');
  _quickAIId = null;
  _qcStep = 0;
}

// Alias legacy — closeQuickModal referenciado en cascade Escape y quickTitleKey
function closeQuickModal(e) { closeQuickCapture(e); }

// T-202605-430: usa _horaUpdate — feedback visual completo igual que la referencia
function quickParseHora() {
  const inp = _qcEl('quick-hora');
  const disp = _qcEl('quick-hora-disp');
  if (inp && !inp.value.replace(/\D/g, '')) {
    if (disp) { disp.textContent = 'hora de desbloqueo (opcional)'; disp.className = 'hora-disp--hint'; }
    return;
  }
  _horaUpdate(inp, disp);
}

function quickTitleKey(e) {
  if (e.key === 'Enter') { e.preventDefault(); confirmQuickCapture(); }
  if (e.key === 'Escape') { closeQuickCapture(); }
}

function confirmQuickCapture() {
  if (!_quickAIId) return;
  const title = _qcEl('quick-title').value.trim();
  if (!title) {
    _qcEl('quick-title').focus();
    const _qt = _qcEl('quick-title');
    if (_qt) { _qt.classList.add('input-border-error'); setTimeout(() => _qt.classList.remove('input-border-error'), 1200); }
    return;
  }
  const summary = _qcEl('quick-summary').value.trim();
  const horaRaw = _qcEl('quick-hora').value.replace(/\D/g,'');
  const horaResult = horaRaw ? interpretHora(horaRaw) : null;

  const ai = getAI(_quickAIId);
  const now = new Date();
  const sess = {
    id: 'sess-' + Date.now(),
    title,
    summary,
    files: '',
    pending: '',
    tags: [],
    trackerRefs: [],
    starred: false,
    quickCapture: true,
    resetAt: horaResult ? horaResult.hhmm : '',
    dateShort: now.toLocaleDateString('es-MX', {day:'2-digit',month:'short'}),
    date: now.toISOString()
  };

  // v3: sesión va al proyecto activo con aiId
  sess.aiId = _quickAIId;
  const activeProj = getActiveProject();
  if (!activeProj) {
    if (typeof showToast === 'function') showToast('warning', '⚠ Selecciona un proyecto antes de guardar la sesión');
    if (typeof openProjPanel === 'function') openProjPanel();
    return;
  }
  if (!activeProj.sessions) activeProj.sessions = [];
  activeProj.sessions.push(sess);

  if (horaResult) {
    // T-089: solo cambiar status a exhausted si estaba disponible
    if (ai.status === 'available') ai.status = 'exhausted';
    ai.resetTime = horaResult.hhmm;
    ai.resetEpoch = horaResult.epoch;
  }

  closeQuickCapture();
  // B-202605-XXX: usar saveImmediate() para garantizar escritura en Supabase antes de
  // cualquier recarga. save() con debounce de 5s podía perder resetTime/resetEpoch/status
  // si el usuario recargaba la tab antes de que el timer disparara.
  saveImmediate().then(() => { typeof render === 'function' && render(); if (currentTab === 'hoy') renderHoy(); });
  if (typeof showToast === 'function') showToast('success', `${ai.name} — sesión rápida guardada`);
}

// ── END R-[pendiente-ID] Quick Capture ──

// ── T-055: Sesión interrumpida ──
// T-093: confirmación inline dentro del dropdown antes de interrumpir
function confirmInterruptInline(id, triggerBtn) {
  const dropdown = document.getElementById('dotmenu-' + id);
  if (!dropdown) return;
  // Si ya hay un confirm-row, no duplicar
  if (dropdown.querySelector('.dot-confirm-row')) return;
  // Ocultar el botón trigger
  triggerBtn.classList.add('is-hidden');
  const row = document.createElement('div');
  row.className = 'dot-confirm-row';
  row.innerHTML = `<span class="dot-confirm-label">⚡ ¿Interrumpir?</span>
    <button class="dot-confirm-cancel" onclick="cancelInterruptInline('${id}')">No</button>
    <button class="dot-confirm-ok" onclick="closeCardMenu('${id}');interruptSession('${id}')">Sí</button>`;
  triggerBtn.after(row);
}
function cancelInterruptInline(id) {
  const dropdown = document.getElementById('dotmenu-' + id);
  if (!dropdown) return;
  const row = dropdown.querySelector('.dot-confirm-row');
  if (row) row.remove();
  const btn = dropdown.querySelector('.card-dot-item[onclick*="confirmInterruptInline"]');
  if (btn) btn.classList.remove('is-hidden');
}

function interruptSession(id) {
  const ai = getAI(id);
  if (typeof _gconfirmOpen !== 'function') return;
  _gconfirmOpen({
    title: `Marcar sesión interrumpida`,
    msg: `"${ai.name}" pasará a estado agotado.`,
    okLabel: 'Confirmar',
    danger: false,
    inputLabel: 'Hora de reset (opcional)',
    inputPlaceholder: '--:--'
  }, (horaRaw) => {
    const horaResult = horaRaw ? interpretHora(horaRaw.replace(/\D/g,'')) : null;
    ai.status = 'exhausted';
    ai.interrupted = true;
    if (horaResult) { ai.resetTime = horaResult.hhmm; ai.resetEpoch = horaResult.epoch; }
    // R-202604-061 AC-2: clase transitoria antes de interrupted-state
    const _intCard = document.getElementById('card-' + id);
    if (_intCard) _intCard.classList.add('tracker-card--interrupting');
    setTimeout(() => {
      save(); if (typeof render === 'function') render();
      if (currentTab === 'hoy') renderHoy();
    }, 200);
    if (typeof showToast === 'function') showToast('info', `${ai.name} — sesión interrumpida`);
  });
}

function dismissInterrupted(id) {
  const ai = getAI(id);
  ai.interrupted = false;
  save(); if (typeof render === 'function') render();
  if (currentTab === 'hoy') renderHoy();
}

// T-058 ya maneja auto-disponible; al desbloquearse, si tenía interrupted, lo conservamos
// Solo limpiamos interrupted cuando el usuario hace click en "Continuar →"

// ── T-056: Focus Zone — modo registro ──
let focusActiveId = null;

function enterFocusMode(id) {
  if (focusActiveId === id) return;
  // Si había otro activo, salir primero
  if (focusActiveId) exitFocusMode();
  focusActiveId = id;

  const activeCard = document.getElementById('card-' + id);
  if (activeCard) {
    activeCard.classList.add('focus-active');
    // T-202604-004: historial permanece visible en modo protagonista
    // Scroll NO se hace aquí — enterFocusMode se dispara desde onfocus del textarea
    // y causaría scroll indeseado al hacer click dentro del campo.
    // El scroll al navegar se maneja en _scrollToCard().
  }

  // Dimmear los demás cards
  document.querySelectorAll('.card').forEach(c => {
    if (c.id !== 'card-' + id) c.classList.add('focus-dimmed');
  });
}

function exitFocusMode() {
  if (!focusActiveId) return;
  const activeCard = document.getElementById('card-' + focusActiveId);
  if (activeCard) {
    activeCard.classList.remove('focus-active');
  }
  document.querySelectorAll('.card.focus-dimmed').forEach(c => c.classList.remove('focus-dimmed'));
  focusActiveId = null;
}

// B-202605-014: Backlog Focus Mode — Top-10 · Cmd+F con tab Backlog activo sin panel abierto
// _backlogFocusMode declarada en ai-tracker-backlog.js — no redeclarar aquí (SyntaxError duplicate var)

function toggleBacklogFocusMode() {
  _backlogFocusMode = !_backlogFocusMode;

  // Indicador visual — botón #fbar-focus-btn en bl-toolbar (patrón canónico .active)
  const focusBtn = document.getElementById('fbar-focus-btn');
  if (focusBtn) focusBtn.classList.toggle('active', _backlogFocusMode);

  // Obtener todos los .backlog-item del DOM
  const allItems = document.querySelectorAll('.backlog-item');
  if (!allItems.length) return;

  if (!_backlogFocusMode) {
    // Desactivar — restaurar todos los ítems
    allItems.forEach(el => {
      el.classList.remove('blf-hidden');
      el.removeAttribute('aria-hidden');
    });
    return;
  }

  // Calcular Top-10 desde tracker items del proyecto activo
  const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
  const tracker = (typeof getActiveTracker === 'function') ? getActiveTracker() : { items: [] };
  const trackerItems = tracker.items || [];

  // Sprint activo — sin depender de getActiveSprints() (B-202605-026 pendiente)
  const activeSprint = proj && proj.sprints
    ? proj.sprints.find(s => s.status === 'active')
    : null;

  // Filtro: pendientes del sprint activo, o todos los pendientes si no hay sprint
  const pool = trackerItems.filter(i =>
    i.status === 'pendiente' &&
    (!activeSprint || i.sprint === activeSprint.id)
  );

  // Orden: high → medium → low
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const sorted = [...pool].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 3;
    const pb = PRIORITY_ORDER[b.priority] ?? 3;
    return pa - pb;
  });

  // Top-10 — si pool vacío (sin sprint activo con ítems), usar todos los pendientes
  const top10Pool = sorted.length > 0 ? sorted : trackerItems
    .filter(i => i.status === 'pendiente')
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));

  const top10Codes = new Set(top10Pool.slice(0, 10).map(i => i.code).filter(Boolean));

  // Aplicar .blf-hidden a ítems fuera del Top-10
  allItems.forEach(el => {
    // data-code es el atributo canónico en .backlog-item — fallback a data-id
    const code = el.dataset.code || el.dataset.id || '';
    const inTop10 = top10Codes.has(code);
    el.classList.toggle('blf-hidden', !inTop10);
    if (!inTop10) {
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('aria-hidden');
    }
  });
}


// ── ESC cascade, keydown listener, shortcuts — extraídos a locus-ui-shell.js
// _escCascade, click listener search-unified-results,
// keydown listener global, _SHORTCUT_DEFS, _shortcutKey, _shortcutConflict,
// _shortcutsRender, _shortcutsStartEdit, _shortcutsCaptureKey,
// _shortcutsSaveEdit, _shortcutsResetOne, restoreDefaultShortcuts,
// openShortcuts, closeShortcuts, openShortcutsRef, closeShortcutsRef, _sk
// ─────────────────────────────────────────────────────────────────────────

// T-202604-295: trigger de descarga de templates — 'session' (default) | 'sprint'
const _TPL_TRIGGER_KEY = 'template-download-trigger';
function _templateTrigger() {
  return localStorage.getItem(_TPL_TRIGGER_KEY) || 'session';
}
function _autoDownloadOn() {
  // Backward compat — ON si trigger es 'session' (comportamiento original)
  return _templateTrigger() === 'session';
}
function toggleAutoDownload() {
  const next = _templateTrigger() === 'session' ? 'sprint' : 'session';
  localStorage.setItem(_TPL_TRIGGER_KEY, next);
  _saveUserPrefs(); // R-4: sincronizar preferencia a Supabase
  _updateAutoDownloadLabel();
}
function _updateAutoDownloadLabel() {
  const btn = document.getElementById('more-menu-autodl');
  if (btn) btn.textContent = `⬇ Descargar templates: ${_templateTrigger() === 'session' ? 'al guardar sesión' : 'al cerrar sprint'}`;
}
// Inicializar label al cargar
(function _initAutoDlLabel() {
  const btn = document.getElementById('more-menu-autodl');
  if (btn) btn.textContent = `⬇ Descargar templates: ${_templateTrigger() === 'session' ? 'al guardar sesión' : 'al cerrar sprint'}`;
})();


(function _initSearchTooltip() {
  const si = document.getElementById('search-global');
  if (!si) return;
  const container = si.closest('.header-search');
  if (!container) return;
  const btn = container.querySelector('button, [role="button"]');
  if (btn && !btn.title) btn.title = 'Ctrl+F';
})();

// Click fuera del card activo para salir
document.addEventListener('click', e => {
  if (!focusActiveId) return;
  const activeCard = document.getElementById('card-' + focusActiveId);
  if (activeCard && !activeCard.contains(e.target)) exitFocusMode();
}, true);

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
    if (currentTab !== 'hoy') { _stopHoyTicker(); return; }
    document.querySelectorAll('[data-hoy-ai-id]').forEach(el => {
      const ai = getAI(el.dataset.hoyAiId);
      if (!ai || ai.status !== 'exhausted') return;
      const ms = _hoyMsUntilReset(ai);
      const cdEl = el.querySelector('.hoy-exh-countdown');
      if (!cdEl) return;
      cdEl.textContent = _hoyCountdownLabel(ms);
      cdEl.classList.toggle('soon', ms < 30 * 60000);
      if (ms <= 0) renderHoy();
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
  _sidebarTickerInterval = setInterval(() => {
    const exhausted = state.ais.filter(ai => !ai.archived && ai.status === 'exhausted' && ai.resetTime);
    if (!exhausted.length) { _stopSidebarTicker(); return; }
    let anyExpired = false;
    exhausted.forEach(ai => {
      const el = document.getElementById('tsb-row-' + ai.id);
      if (el) {
        let cdEl = el.querySelector('.tsb-ai-cd');
        const [hh, mm] = ai.resetTime.split(':').map(Number);
        const now = new Date();
        const reset = new Date(now); reset.setHours(hh, mm, 0, 0);
        if (reset <= now) reset.setDate(reset.getDate() + 1);
        const diff = Math.max(0, Math.round((reset - now) / 60000));
        if (diff === 0) { anyExpired = true; }
        else {
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
    if (anyExpired) { if (typeof render === 'function') render(); }
  }, 1000); // T-202604-302: cada 1s — countdown live sin interacción
}
function _stopSidebarTicker() {
  if (_sidebarTickerInterval) { clearInterval(_sidebarTickerInterval); _sidebarTickerInterval = null; }
}

// T-202604-324: mini progress dots del ecosistema en el header nav
function renderProjDots() {
  // Eliminado — ruido con pocos proyectos activos
}

function renderHoy() {
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

// ── B-202604-094: Corregir hora de desbloqueo desde card ──
let _correctHoraAIId = null;

function openCorrectHora(id) {
  const ai = getAI(id);
  if (!ai) return;
  _correctHoraAIId = id;

  // Reutilizar el generic confirm modal como contenedor de input
  const modal = document.getElementById('gconfirm-overlay');
  const title = document.getElementById('gconfirm-title');
  const msg = document.getElementById('gconfirm-msg');
  const okBtn = document.getElementById('gconfirm-ok-btn');
  if (!modal) return;

  title.textContent = '⏰ Corregir hora de desbloqueo';
  // Ocultar el input-wrap del modal genérico (usado por _gconfirmOpen)
  const inputWrap = document.getElementById('gconfirm-input-wrap');
  if (inputWrap) inputWrap.classList.add('is-hidden');

  const currentLabel = ai.resetTime ? fmt12(ai.resetTime) : '(sin hora)';
  msg.innerHTML = `
    <div class="correct-hora-current">Hora actual: <strong>${esc(currentLabel)}</strong></div>
    <div class="correct-hora-input-row">
      <input id="correct-hora-input" class="hora-input correct-hora-input" type="text" maxlength="4" placeholder="--:--"
        oninput="(function(){
          const raw=(document.getElementById('correct-hora-input')||{}).value.replace(/\\D/g,'');
          const disp=document.getElementById('correct-hora-disp');
          const r=interpretHora(raw);
          if(disp){disp.textContent=r?r.label:(raw.length>=3?'hora inválida':(raw.length?'...':'—'));disp.className=r?'hora-disp--valid':(raw.length>=3?'hora-disp--error':'hora-disp--hint');}
        })()"
        onkeydown="if(event.key==='Enter'){event.preventDefault();confirmCorrectHora();}">
      <div id="correct-hora-disp" class="correct-hora-disp">—</div>
    </div>
    <div class="correct-hora-unlock-row">
      <button class="btn-ghost correct-hora-unlock-btn" onclick="unlockNowFromCard()">✅ Desbloquear ahora</button>
    </div>`;

  okBtn.textContent = 'Guardar';
  okBtn.className = 'btn-primary';
  okBtn.onclick = confirmCorrectHora;
  // Reasignar cancel button del modal genérico
  const cancelBtn = modal.querySelector('button:not(#gconfirm-ok-btn)');
  if (cancelBtn) cancelBtn.onclick = () => { _correctHoraAIId = null; modal.classList.remove('open'); };

  // B-202604-094 fix: diferir classList.add('open') al siguiente tick para evitar
  // que el click que originó esta llamada sea interpretado como click-outside
  // por el listener de _gconfirmOpen y cierre el modal inmediatamente.
  setTimeout(() => {
    modal.classList.add('open');
    setTimeout(() => {
      const inp = document.getElementById('correct-hora-input');
      if (inp) {
        // Precargar hora actual si existe
        if (ai.resetTime) inp.value = ai.resetTime.replace(':', '');
        inp.focus(); inp.select();
        // Disparar oninput para mostrar la hora precargada
        inp.dispatchEvent(new Event('input'));
      }
    }, 50);
  }, 0);
}

function confirmCorrectHora() {
  const id = _correctHoraAIId;
  if (!id) return;
  const ai = getAI(id);
  if (!ai) return;
  const inp = document.getElementById('correct-hora-input');
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);

  if (result) {
    ai.resetTime = result.hhmm;
    ai.resetEpoch = result.epoch;
    // Actualizar resetAt en la sesión más reciente
    const aiSessions = getAISessions(id);
    if (aiSessions.length > 0) {
      const lastSess = aiSessions[aiSessions.length - 1];
      lastSess.resetAt = result.label;
    }
    save(); if (typeof render === 'function') render();
    if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
  } else {
    // Hora inválida — mantener modal abierto sin toast
    inp.classList.add('error');
    setTimeout(() => inp.classList.remove('error'), 1200);
    return; // No cerrar modal
  }

  _correctHoraAIId = null;
  const modal = document.getElementById('gconfirm-overlay');
  if (modal) modal.classList.remove('open');
}

function unlockNowFromCard() {
  const id = _correctHoraAIId;
  if (!id) return;
  const ai = getAI(id);
  if (!ai) return;
  ai.status = 'available';
  ai.resetTime = '';
  ai.resetEpoch = null;
  _correctHoraAIId = null;
  const modal = document.getElementById('gconfirm-overlay');
  if (modal) modal.classList.remove('open');
  save(); if (typeof render === 'function') render();
  if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
}

// T-202604-299: beforeunload → en locus-storage.js

// ─── R-202604-036: _showItemVizPanel — visualizador de ítems al parsear paste ───
// Reemplaza T-202604-201 (panel diff genérico)
// Muestra tabla de ítems con: código, tipo, título, status resultante,
// datos de backlog si existe, campos inline si es nuevo, checkbox excluir, Ver en Backlog
// Nota: backlog.js expone showMergeDiffPanel (merge-diff-overlay, dry-run) — nombre compartido
// resuelto: esta función renombrada a _showItemVizPanel para evitar colisión de nombres.

let _itemVizPendingCb = null;
let _itemVizItems     = null;
let _itemVizSessId    = null;
let _itemVizProjId    = null;
// Estado de exclusiones — set de índices excluidos
let _itemVizExcluded  = new Set();
let _itemVizKeyHandler = null; // T-202605-429: ref al handler Enter para limpieza en close

function _showItemVizPanel(tgItems, sessId, projId, onConfirm) {
  if (!tgItems || !tgItems.length) { onConfirm(); return; }

  _itemVizPendingCb = onConfirm;
  _itemVizItems     = tgItems;
  _itemVizSessId    = sessId;
  _itemVizProjId    = projId;
  _itemVizExcluded  = new Set();

  // AC: auto-excluir ítems sin cambios — se ignorarán al guardar (AC-3)
  tgItems.forEach((item, idx) => {
    const bk = (typeof ITEMS !== 'undefined') ? ITEMS.find(i => i.code === item.code) || null : null;
    if (bk) {
      const unchanged =
        bk.status === item.status &&
        (bk.title || bk.desc || '') === (item.desc || item.title || '') &&
        String(bk.priority || '') === String(item.priority || '') &&
        String(bk.effort || '') === String(item.effort || '') &&
        JSON.stringify(bk.ac || []) === JSON.stringify(item.ac || []);
      if (unchanged) _itemVizExcluded.add(idx);
    }
  });

  _itemVizRender();

  const overlay = document.getElementById('item-viz-overlay');
  if (overlay) {
    overlay.classList.remove('closing');
    overlay.classList.add('open', 'item-viz--flex');
  }

  // T-202605-429: Enter confirma cuando el foco está en el panel — no dispara desde inputs
  const _vizKeyHandler = (e) => {
    if (e.key !== 'Enter') return;
    const tag = (document.activeElement || {}).tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    document.removeEventListener('keydown', _vizKeyHandler);
    _itemVizConfirm();
  };
  document.addEventListener('keydown', _vizKeyHandler);
  // Guardar ref para poder limpiar en _itemVizClose
  _itemVizKeyHandler = _vizKeyHandler;
}

function _itemVizClose() {
  const overlay = document.getElementById('item-viz-overlay');
  if (overlay) {
    overlay.classList.add('closing');
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.classList.remove('closing', 'item-viz--flex');
    }, 220);
  }
  _itemVizPendingCb = null;
  _itemVizItems = null;
  _itemVizExcluded = new Set();
  // T-202605-429: limpiar handler Enter si quedó registrado
  if (_itemVizKeyHandler) {
    document.removeEventListener('keydown', _itemVizKeyHandler);
    _itemVizKeyHandler = null;
  }
}

function _itemVizConfirm() {
  if (!_itemVizPendingCb || !_itemVizItems) return;
  // Mutar el array original in-place — el closure en session.js tiene referencia al mismo array
  const filtered = _itemVizItems.filter((_, i) => !_itemVizExcluded.has(i));
  _itemVizItems.splice(0, _itemVizItems.length, ...filtered);
  const cb = _itemVizPendingCb;
  _itemVizClose();
  cb();
}

function _itemVizToggleExclude(idx) {
  if (_itemVizExcluded.has(idx)) _itemVizExcluded.delete(idx);
  else _itemVizExcluded.add(idx);
  _itemVizRender();
}

function _itemVizToggleSinCambios() {
  const body    = document.getElementById('viz-sinc-body');
  const chevron = document.getElementById('viz-sinc-chevron');
  if (!body) return;
  const open = body.classList.toggle('viz-sinc-body--open');
  if (chevron) chevron.textContent = open ? '▾' : '▸';
}

function _itemVizNavBacklog(code) {
  _itemVizClose();
  if (typeof switchTab === 'function') switchTab('backlog');
  if (typeof switchSubTab === 'function') switchSubTab('backlog');
  setTimeout(() => {
    const el = document.querySelector(`[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bitem--nav-highlight');
      setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1800);
    }
  }, 220);
}

function _itemVizRender() {
  const body = document.getElementById('item-viz-body');
  const confirmBtn = document.getElementById('item-viz-confirm-btn');
  if (!body || !_itemVizItems) return;

  const items = _itemVizItems;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const _getBacklogItem = (code) => {
    if (typeof ITEMS === 'undefined') return null;
    return ITEMS.find(i => i.code === code) || null;
  };

  const _isSinCambio = (item) => {
    const bk = _getBacklogItem(item.code);
    if (!bk) return false;
    return bk.status === item.status &&
      (bk.title || bk.desc || '') === (item.desc || item.title || '') &&
      String(bk.priority || '') === String(item.priority || '') &&
      String(bk.effort   || '') === String(item.effort   || '') &&
      JSON.stringify(bk.ac || []) === JSON.stringify(item.ac || []);
  };

  const _typeColor = { P: '#7c6af7', T: '#2ecc78', R: '#38bdf8', B: '#e85555' };
  const _typeName  = { P: 'Idea',   T: 'Ticket', R: 'Req.',    B: 'Bug'     };

  const _mergeResultClass = (r) =>
    r === 'nuevo'      ? 'viz-status-new'       :
    r === 'actualizado'? 'viz-status-updated'    : 'viz-status-unchanged';

  const _mergeResultLabel = (r) =>
    r === 'nuevo'      ? 'nuevo'       :
    r === 'actualizado'? 'actualización': 'sin cambios';

  // AC-5 / AC-6: chips de campos afectados con conteo
  const _fieldDiffChips = (item, bk) => {
    if (!bk) return '';
    const chips = [];
    if (bk.status !== item.status)
      chips.push(`<span class="viz-field-chip">status</span>`);
    if ((bk.title || bk.desc || '') !== (item.desc || item.title || ''))
      chips.push(`<span class="viz-field-chip">desc</span>`);
    if (String(bk.priority || '') !== String(item.priority || ''))
      chips.push(`<span class="viz-field-chip">priority</span>`);
    if (String(bk.effort || '') !== String(item.effort || ''))
      chips.push(`<span class="viz-field-chip">effort</span>`);
    const oldAc = bk.ac || [], newAc = item.ac || [];
    if (JSON.stringify(oldAc) !== JSON.stringify(newAc)) {
      const added   = newAc.filter(a => !oldAc.includes(a)).length;
      const removed = oldAc.filter(a => !newAc.includes(a)).length;
      let label = 'ac';
      if (added)   label += ` +${added}`;
      if (removed) label += ` -${removed}`;
      chips.push(`<span class="viz-field-chip viz-field-chip--ac">${label}</span>`);
    }
    return chips.length ? `<div class="viz-field-diffs">${chips.join('')}</div>` : '';
  };

  // ── Clasificar ítems ─────────────────────────────────────────────────────
  const sinCambioIdxs = new Set(
    items.map((item, idx) => _isSinCambio(item) ? idx : -1).filter(i => i >= 0)
  );
  const activeItems    = items.filter((_, idx) => !sinCambioIdxs.has(idx));
  const sinCambioItems = items.filter((_, idx) =>  sinCambioIdxs.has(idx));

  // AC-4: contador excluye sin-cambios + exclusiones manuales
  const userExcluded = [..._itemVizExcluded].filter(idx => !sinCambioIdxs.has(idx));
  const toSave = activeItems.length - userExcluded.length;

  if (confirmBtn) {
    const note = sinCambioItems.length ? ` · ${sinCambioItems.length} sin cambios ignorados` : '';
    confirmBtn.textContent = userExcluded.length
      ? `Guardar sesión (${toSave} de ${activeItems.length})${note}`
      : `Guardar sesión (${toSave})${note}`;
  }

  // ── Builder de fila ──────────────────────────────────────────────────────
  const _buildRow = (item, idx, isSinCambio) => {
    const isExcluded = _itemVizExcluded.has(idx);
    const bkItem     = _getBacklogItem(item.code);
    const isReal     = /^[PTRB]-\d{6}-\d{3}/.test(item.code);

    const mergeResult = bkItem
      ? (isSinCambio ? 'sin cambio' : 'actualizado')
      : 'nuevo';

    const typeColor = _typeColor[item.type] || 'var(--accent)';
    const typeName  = _typeName[item.type]  || item.type;

    const bkBlock = bkItem ? `
      <div class="viz-bk-row">
        <span class="viz-bk-label">Backlog</span>
        <span class="viz-bk-status viz-bk-status--${bkItem.status}">${bkItem.status}</span>
        ${bkItem.sprint ? `<span class="viz-bk-chip">${esc(bkItem.sprint)}</span>` : ''}
        ${bkItem.effort ? `<span class="viz-bk-chip">e${bkItem.effort}</span>` : ''}
        ${!isSinCambio ? `<button class="viz-nav-btn" onclick="_itemVizNavBacklog('${esc(item.code)}')" title="Ver en Backlog">→ Backlog</button>` : ''}
      </div>` : '';

    const newBlock = (!bkItem && isReal) ? `
      <div class="viz-new-fields">
        ${item.effort ? `<span class="viz-new-chip">effort: ${item.effort}</span>` : ''}
        ${item.area   ? `<span class="viz-new-chip">area: ${esc(item.area)}</span>`   : ''}
        ${item.ac && item.ac.length ? `<div class="viz-new-ac"><span class="viz-new-chip viz-new-chip--ac">AC</span> ${item.ac.map(a => `<span class="viz-ac-item">${esc(a)}</span>`).join('')}</div>` : ''}
      </div>` : '';

    const fieldDiffs = mergeResult === 'actualizado' ? _fieldDiffChips(item, bkItem) : '';

    // T-202605-428: código real clickeable — copia al clipboard con feedback visual idéntico al backlog
    const codeDisplay = isReal
      ? `<button class="viz-code viz-code--real viz-code--copyable" data-type-color="${esc(typeColor)}" data-code="${esc(item.code)}" title="Click para copiar" onclick="_vizCopyCode(event,this)">${esc(item.code)}</button>`
      : `<span class="viz-code viz-code--pending">${esc(item.code)}</span>`;

    const checkboxHtml = !isSinCambio
      ? `<label class="viz-checkbox-wrap" title="${isExcluded ? 'Incluir en merge' : 'Excluir del merge'}">
          <input type="checkbox" class="viz-checkbox" ${isExcluded ? '' : 'checked'}
            onchange="_itemVizToggleExclude(${idx})">
         </label>`
      : `<span class="viz-sinc-icon">—</span>`;

    return `
      <div class="viz-row${isExcluded ? ' viz-row--excluded' : ''}${isSinCambio ? ' viz-row--sinc' : ''}" id="viz-row-${idx}">
        ${checkboxHtml}
        <div class="viz-type-badge" data-type-color="${esc(typeColor)}">${typeName}</div>
        <div class="viz-content">
          <div class="viz-row-top">
            ${codeDisplay}
            <span class="viz-desc">${esc(item.title || item.desc || item.status)}</span>
            <span class="viz-merge-result ${_mergeResultClass(mergeResult)}">${_mergeResultLabel(mergeResult)}</span>
          </div>
          <div class="viz-row-bottom">
            <span class="viz-status-incoming">→ ${esc(item.status)}</span>
            ${bkBlock}
            ${newBlock}
            ${fieldDiffs}
          </div>
        </div>
      </div>`;
  };

  // ── Renderizar filas activas ─────────────────────────────────────────────
  const activeRows = activeItems.map(item => _buildRow(item, items.indexOf(item), false)).join('');

  // ── Summary ──────────────────────────────────────────────────────────────
  const newCount = activeItems.filter(item => !_getBacklogItem(item.code)).length;
  const updCount = activeItems.filter(item =>  !!_getBacklogItem(item.code)).length;
  const summary = `<div class="viz-summary">
    ${newCount ? `<span class="viz-sum-chip viz-sum-new">${newCount} nuevo${newCount !== 1 ? 's' : ''}</span>` : ''}
    ${updCount ? `<span class="viz-sum-chip viz-sum-upd">${updCount} actualización${updCount !== 1 ? 'es' : ''}</span>` : ''}
    ${sinCambioItems.length ? `<span class="viz-sum-chip viz-sum-sinc">${sinCambioItems.length} sin cambios</span>` : ''}
  </div>`;

  // ── Grupo sin cambios — AC-1: colapsado por defecto ──────────────────────
  let sinCambioGroup = '';
  if (sinCambioItems.length) {
    const sinCambioRows = sinCambioItems.map(item => _buildRow(item, items.indexOf(item), true)).join('');
    sinCambioGroup = `
      <div class="viz-sinc-group" id="viz-sinc-group">
        <button class="viz-sinc-header" onclick="_itemVizToggleSinCambios()">
          <span class="viz-sinc-label">${sinCambioItems.length} ítem${sinCambioItems.length !== 1 ? 's' : ''} ya existen sin cambios — se ignorarán</span>
          <span class="viz-sinc-chevron" id="viz-sinc-chevron">▸</span>
        </button>
        <div class="viz-sinc-body" id="viz-sinc-body">
          ${sinCambioRows}
        </div>
      </div>`;
  }

  body.innerHTML = summary + `<div class="viz-rows">${activeRows}</div>` + sinCambioGroup;

  // CSS Purity: colores de tipo calculados en runtime → custom properties CSS (B-202605-055)
  body.querySelectorAll('[data-type-color]').forEach(el => {
    const color = el.dataset.typeColor;
    if (el.classList.contains('viz-type-badge')) {
      el.style.setProperty('--viz-type-bg', color + '22');
      el.style.setProperty('--viz-type-color', color);
      el.style.setProperty('--viz-type-border', color + '44');
    } else {
      el.style.setProperty('--viz-type-color', color);
    }
  });
}

// B-202605-505: helper de copia segura — garantiza que el ghost textarea recibe el foco
// antes de execCommand('copy') para evitar que el portapapeles del usuario quede
// sobreescrito con el contenido del textarea activo (ej: CHECKPOINT en edición).
function _copyTextSafe(text) {
  const prev = document.activeElement;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.className = 'clipboard-ghost';
  document.body.appendChild(ta);
  if (prev && typeof prev.blur === 'function') prev.blur();
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
  if (prev && typeof prev.focus === 'function') prev.focus();
}

// T-202605-428: copy helper para códigos en el panel DIFF
function _vizCopyCode(e, el) {
  e.stopPropagation();
  const code = el.dataset.code || el.textContent;
  if (!code) return;
  const _doFlash = () => {
    const prev = el.textContent;
    el.classList.add('viz-code--copied');
    el.textContent = '✓';
    setTimeout(() => { el.classList.remove('viz-code--copied'); el.textContent = prev; }, 1400);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(_doFlash).catch(() => {
      _copyTextSafe(code); _doFlash();
    });
  } else {
    _copyTextSafe(code); _doFlash();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// R-202604-072: Sesión de Arranque — panel de contexto diario al abrir la app
// ─────────────────────────────────────────────────────────────────────────────

const _ARRANQUE_KEY = 'ai-tracker-arranque-ts';
const _ARRANQUE_6H  = 6 * 60 * 60 * 1000;

function closeArranquePanel() {
  const overlay = document.getElementById('arranque-overlay');
  if (overlay) overlay.classList.remove('arranque-visible');
}

function _showArranquePanel() {
  const overlay = document.getElementById('arranque-overlay');
  const body    = document.getElementById('arranque-body');
  const ctaBtn  = document.getElementById('arranque-cta-btn');
  if (!overlay || !body) return;

  // AC: no aparece si han pasado menos de 6h desde el último arranque (localStorage)
  const lastShown = parseInt(localStorage.getItem(_ARRANQUE_KEY) || '0', 10);
  if (Date.now() - lastShown < _ARRANQUE_6H) return;

  // AC: no aparece si no hay proyectos ni ítems — onboarding tiene prioridad
  const allProjects = (state.projects || []).filter(p => (p.sessions || []).length > 0);
  const allItems    = typeof ITEMS !== 'undefined' ? ITEMS : [];
  if (allProjects.length === 0 && allItems.length === 0) return;

  // Persistir timestamp antes de mostrar
  try { localStorage.setItem(_ARRANQUE_KEY, String(Date.now())); } catch(e) {}

  // ── Bloque 1: Resumen de ayer ────────────────────────────────────────────
  const now        = Date.now();
  const DAY        = 86400000;
  const allSess    = getAllSessions();
  // Sesiones de las últimas 24h — "ayer" = última sesión del día anterior al de hoy
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const yesterStart = new Date(todayStart.getTime() - DAY);

  // Ítems cerrados en la última sesión (la más reciente)
  const lastSess = allSess.slice().sort((a, b) => {
    const ta = new Date(a.date || 0).getTime();
    const tb = new Date(b.date || 0).getTime();
    return tb - ta;
  })[0] || null;

  let bloque1Html = '';
  if (lastSess) {
    const lastSessDate = new Date(lastSess.date || 0);
    const daysDiff = Math.floor((now - lastSessDate.getTime()) / DAY);
    const lastProjObj = (state.projects || []).find(p => p.id === lastSess.projectId);
    const lastProjName = lastProjObj ? (lastProjObj.name || lastProjObj.id) : '';
    const lastAIObj = (state.ais || []).find(a => a.id === lastSess.aiId);
    const lastAIName = lastAIObj ? lastAIObj.name : '';

    // Ítems done vinculados a esa sesión
    const closedInSess = allItems.filter(i =>
      i.status === 'done' && (i.sessionId === lastSess.id || (lastSess.trackerRefs || []).includes(i.code))
    );

    if (daysDiff === 0 || daysDiff === 1) {
      const whenLabel = daysDiff === 0 ? 'hoy' : 'ayer';
      bloque1Html = `<div class="arr-section">
        <span class="arr-label">Última sesión — ${whenLabel}</span>
        <span class="arr-value arr-value--small">${lastProjName ? esc(lastProjName) + ' · ' : ''}${lastAIName ? esc(lastAIName) : ''}</span>
        ${closedInSess.length > 0
          ? `<ul class="arr-item-list arr-item-list--compact">
              ${closedInSess.slice(0,3).map(i => {
                const t = (i.code||'T')[0].toUpperCase();
                const _tc = {P:'#7c6af7',T:'#2ecc78',R:'#38bdf8',B:'#e85555'};
                return `<li class="arr-item arr-item--done">
                  <span class="arr-item-code" style="--arr-type-color:${_tc[t]||'#38bdf8'}">${esc(i.code)}</span>
                  <span class="arr-item-desc">${esc(i.title || i.desc || '')}</span>
                </li>`;
              }).join('')}
              ${closedInSess.length > 3 ? `<li class="arr-item arr-item--more">+${closedInSess.length - 3} más</li>` : ''}
            </ul>`
          : `<span class="arr-value arr-value--muted">${esc(lastSess.title || 'Sin ítems cerrados registrados')}</span>`
        }
      </div>`;
    } else {
      bloque1Html = `<div class="arr-section">
        <span class="arr-label">Última sesión</span>
        <span class="arr-value arr-value--muted">Hace ${daysDiff} días${lastProjName ? ' · ' + esc(lastProjName) : ''}</span>
      </div>`;
    }
  }

  // ── Bloque 2: Ítem sugerido ──────────────────────────────────────────────
  // Proyecto con más actividad reciente
  const projByActivity = allProjects.slice().sort((a, b) => {
    const ta = Math.max(...(a.sessions||[]).map(s => new Date(s.date||0).getTime()), 0);
    const tb = Math.max(...(b.sessions||[]).map(s => new Date(s.date||0).getTime()), 0);
    return tb - ta;
  });
  const mostActiveProj = projByActivity[0] || null;
  const activeSprint = mostActiveProj
    ? ((mostActiveProj.sprints||[]).find(s => s.status === 'active') || (mostActiveProj.sprints||[]).find(s => s.status === 'open') || null)
    : null;

  // Top 1 ítem por score del sprint activo del proyecto más activo
  const suggestedItem = allItems
    .filter(i => i.status === 'pendiente' && typeof i._score === 'number' && (!activeSprint || i.sprint === activeSprint.id))
    .sort((a, b) => b._score - a._score)[0] || null;

  let bloque2Html = '';
  if (suggestedItem) {
    const t = (suggestedItem.code||'T')[0].toUpperCase();
    const _tc = {P:'#7c6af7',T:'#2ecc78',R:'#38bdf8',B:'#e85555'};
    bloque2Html = `<div class="arr-section">
      <span class="arr-label">Ítem sugerido${activeSprint ? ' · ' + esc(activeSprint.name || activeSprint.id) : ''}</span>
      <div class="arr-item arr-item--featured">
        <span class="arr-item-code" style="--arr-type-color:${_tc[t]||'#38bdf8'}">${esc(suggestedItem.code)}</span>
        <span class="arr-item-desc">${esc(suggestedItem.title || suggestedItem.desc || '')}</span>
      </div>
    </div>`;
  }

  // ── Bloque 3: Estado IA ──────────────────────────────────────────────────
  const nonArchived = (state.ais || []).filter(a => !a.archived);
  // IA disponible con mayor score (si hay _score no disponible calculamos por sesiones recientes)
  const available = nonArchived.filter(a => a.status === 'available' && !a.interrupted);
  const inSession  = nonArchived.filter(a => a.interrupted || (a.status === 'available' && allSess.some(s => s.aiId === a.id && new Date(s.date||0).getTime() > now - 3*60*60*1000)));
  const exhausted  = nonArchived.filter(a => a.status === 'exhausted');

  // Mejor IA disponible: la que tiene sesión más reciente (más contexto)
  const bestAI = available.sort((a, b) => {
    const ta = Math.max(...allSess.filter(s => s.aiId === a.id).map(s => new Date(s.date||0).getTime()), 0);
    const tb = Math.max(...allSess.filter(s => s.aiId === b.id).map(s => new Date(s.date||0).getTime()), 0);
    return tb - ta;
  })[0] || null;

  let bloque3Html = '';
  if (bestAI) {
    bloque3Html = `<div class="arr-section">
      <span class="arr-label">IA disponible</span>
      <div class="arr-ai-row">
        <span class="arr-ai-name">${esc(bestAI.name)}</span>
        <span class="arr-ai-badge arr-ai-badge--available">disponible</span>
      </div>
    </div>`;
  } else if (exhausted.length > 0) {
    // Mostrar la que se resetea antes
    const nextToReset = exhausted.slice().sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b))[0];
    const msLeft = _hoyMsUntilReset(nextToReset);
    const cdLabel = _hoyCountdownLabel(msLeft);
    bloque3Html = `<div class="arr-section">
      <span class="arr-label">IAs disponibles</span>
      <div class="arr-ai-row">
        <span class="arr-ai-name">${esc(nextToReset.name)}</span>
        <span class="arr-ai-badge arr-ai-badge--exhausted">en ${cdLabel}</span>
      </div>
    </div>`;
  }

  // ── Bloque 4: Sesión recomendada del plan (R-202605-097) ─────────────────
  let bloque4Html = '';
  let _planPromptText = null; // texto a copiar — null = sin plan

  const _activeProj = (state.projects || []).find(p => p.id === (getActiveProject && getActiveProject() ? getActiveProject().id : null))
    || (state.projects || []).filter(p => !p.archived)[0]
    || null;

  if (_activeProj && typeof loadPlan === 'function') {
    const _planSprints = loadPlan(_activeProj.id);
    const _backlogItems = (() => {
      try {
        const _tplK = typeof _tplKey === 'function' ? _tplKey('backlog-items') : 'backlog-items';
        const raw = localStorage.getItem(_tplK);
        return raw ? JSON.parse(raw) : [];
      } catch(e) { return []; }
    })();
    const _itemByCode = {};
    _backlogItems.forEach(it => { if (it.code) _itemByCode[it.code] = it; });

    const _liveStatus = code => { const it = _itemByCode[code]; return it ? (it.status || 'pendiente') : 'pendiente'; };
    const _liveTitle  = code => { const it = _itemByCode[code]; return it ? (it.title || it.desc || '') : ''; };
    const _sessScore  = sess => (sess.items || []).reduce((sum, code) => {
      const it = _itemByCode[code];
      if (!it || _liveStatus(code) === 'done' || _liveStatus(code) === 'descartado') return sum;
      const w = it.priority === 'high' ? 3 : it.priority === 'low' ? 1 : 2;
      return sum + w;
    }, 0);
    const _sessIsDone = sess => {
      const codes = sess.items || [];
      return codes.length > 0 && codes.every(c => { const s = _liveStatus(c); return s === 'done' || s === 'descartado'; });
    };

    if (_planSprints && _planSprints.length) {
      // Aplanar sesiones con sprint de origen
      const _allSessions = [];
      _planSprints.forEach(sp => {
        (sp.sessions || []).forEach(sess => {
          _allSessions.push({ ...sess, _sprintId: sp.id });
        });
      });

      // IDs de sesiones done — para calcular bloqueos
      const _doneIds = new Set(_allSessions.filter(s => _sessIsDone(s)).map(s => s.id).filter(Boolean));
      const _isBlocked = sess => {
        const deps = (sess.depende_de || []).filter(Boolean);
        return deps.length > 0 && !deps.every(d => _doneIds.has(d));
      };

      // Filtrar sesiones pendientes (no done)
      const _pendingSessions = _allSessions.filter(s => !_sessIsDone(s));

      if (_pendingSessions.length === 0) {
        // Todos los ítems del plan done — sprint completado
        bloque4Html = `<div class="arr-section arr-section--plan">
          <span class="arr-label">Sesión del plan</span>
          <div class="arr-plan-done">✓ Todas las sesiones del sprint completadas</div>
        </div>`;
      } else {
        // Separar desbloqueadas vs bloqueadas
        const _available = _pendingSessions.filter(s => !_isBlocked(s));
        const _blocked   = _pendingSessions.filter(s =>  _isBlocked(s));

        // Sesión recomendada = desbloqueada con mayor score de ítems
        const _recommended = _available.slice().sort((a, b) => _sessScore(b) - _sessScore(a))[0] || null;
        const _others = _available.filter(s => s !== _recommended);

        // Construir HTML de la sesión recomendada
        const _typeColor = { P: '#7c6af7', T: '#2ecc78', R: '#38bdf8', B: '#e85555' };
        const _itemPill = code => {
          const t = (code || 'T')[0].toUpperCase();
          return `<span class="arr-item-code" style="--arr-type-color:${_typeColor[t] || '#38bdf8'}">${esc(code)}</span>`;
        };
        const _filePill = f => `<span class="arr-file-pill">${esc(f)}</span>`;

        let recHtml = '';
        if (_recommended) {
          const pendingCodes = (_recommended.items || []).filter(c => {
            const s = _liveStatus(c); return s !== 'done' && s !== 'descartado';
          });
          const archivos = (_recommended.archivos || []).filter(Boolean);

          // Validar campos antes de construir prompt — AC R-202605-097
          const _missingFields = [];
          if (!_recommended.rol) _missingFields.push('rol');
          if (!pendingCodes.length) _missingFields.push('ítems');
          const _promptIncomplete = _missingFields.length > 0;

          // Solo construir texto a copiar si campos completos
          const _contextFiles = ['PP-CONTEXT', 'PP-BACKLOG'];
          const _allFiles = [...new Set([...archivos, ..._contextFiles])];
          if (!_promptIncomplete) {
            _planPromptText = [
              `Rol: ${_recommended.rol}`,
              `Sprint: ${_recommended._sprintId || ''}`,
              `Ítems: ${(_recommended.items || []).join(', ')}`,
              `Archivos técnicos: ${archivos.join(', ') || '—'}`,
              `Archivos de contexto: ${_contextFiles.join(', ')}`,
            ].join('\n');
          }

          const archivosHtml = _allFiles.length
            ? `<div class="arr-plan-files">
                <span class="arr-plan-files-label">Archivos</span>
                <div class="arr-plan-files-row">
                  ${archivos.map(f => _filePill(f)).join('')}
                  ${_contextFiles.map(f => `<span class="arr-file-pill arr-file-pill--ctx">${esc(f)}</span>`).join('')}
                </div>
              </div>`
            : '';

          const incompleteWarningHtml = _promptIncomplete
            ? `<div class="arr-plan-warning">⚠ Faltan campos en el plan: ${_missingFields.join(', ')} — edita el bloque ---EXECUTION-PLAN--- antes de copiar</div>`
            : '';

          recHtml = `<div class="arr-plan-card arr-plan-card--recommended">
            <div class="arr-plan-card-header">
              <span class="arr-plan-indicator arr-plan-indicator--available">●</span>
              <span class="arr-plan-rol">${esc(_recommended.rol || '—')}</span>
              ${_recommended._sprintId ? `<span class="arr-plan-sprint">${esc(_recommended._sprintId)}</span>` : ''}
            </div>
            <div class="arr-plan-items">
              ${pendingCodes.length ? pendingCodes.map(_itemPill).join('') : '<span class="arr-plan-no-items">Sin ítems pendientes</span>'}
            </div>
            ${archivosHtml}
            ${incompleteWarningHtml}
            <button class="arr-plan-copy-btn${_promptIncomplete ? ' arr-plan-copy-btn--disabled' : ''}" id="arr-copy-btn" type="button"${_promptIncomplete ? ' aria-disabled="true" title="Completa los campos faltantes para habilitar"' : ''}>Copiar prompt de arranque</button>
          </div>`;
        }

        // Sesiones adicionales disponibles (colapsadas)
        let othersHtml = '';
        if (_others.length) {
          othersHtml = _others.map(s => {
            const pendCount = (s.items || []).filter(c => { const st = _liveStatus(c); return st !== 'done' && st !== 'descartado'; }).length;
            return `<div class="arr-plan-row">
              <span class="arr-plan-indicator arr-plan-indicator--available">●</span>
              <span class="arr-plan-row-rol">${esc(s.rol || '—')}</span>
              <span class="arr-plan-row-count">${pendCount} ítem${pendCount !== 1 ? 's' : ''}</span>
            </div>`;
          }).join('');
        }

        // Sesiones bloqueadas
        let blockedHtml = '';
        if (_blocked.length) {
          blockedHtml = _blocked.map(s => {
            const blocker = _allSessions.find(b => (s.depende_de || []).includes(b.id) && !_doneIds.has(b.id));
            return `<div class="arr-plan-row arr-plan-row--blocked">
              <span class="arr-plan-indicator arr-plan-indicator--blocked">○</span>
              <span class="arr-plan-row-rol">${esc(s.rol || '—')}</span>
              ${blocker ? `<span class="arr-plan-row-blocker">requiere: ${esc(blocker.rol || blocker.id || '—')}</span>` : ''}
            </div>`;
          }).join('');
        }

        bloque4Html = `<div class="arr-section arr-section--plan">
          <span class="arr-label">Sesión del plan</span>
          ${recHtml}
          ${othersHtml || blockedHtml ? `<div class="arr-plan-others">${othersHtml}${blockedHtml}</div>` : ''}
        </div>`;
      }
    } else {
      // Sin plan activo
      bloque4Html = `<div class="arr-section arr-section--plan">
        <span class="arr-label">Sesión del plan</span>
        <div class="arr-plan-empty">Sin plan activo — abre una sesión con Rune para planificar el siguiente sprint</div>
      </div>`;
    }
  }

  // ── Render final ─────────────────────────────────────────────────────────
  // Saludo por hora
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '☀ Buenos días' : hour < 19 ? '👋 Buenas tardes' : '🌙 Buenas noches';
  const titleEl = overlay.querySelector('.arranque-title');
  if (titleEl) titleEl.textContent = greeting;

  body.innerHTML = bloque1Html + bloque2Html + bloque3Html + bloque4Html;

  // CTA botón copiar prompt (R-202605-097)
  const _copyBtn = document.getElementById('arr-copy-btn');
  if (_copyBtn) {
    _copyBtn.addEventListener('click', () => {
      if (!_planPromptText) return;
      navigator.clipboard.writeText(_planPromptText).then(() => {
        _copyBtn.classList.add('arr-plan-copy-btn--copied');
        _copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          _copyBtn.classList.remove('arr-plan-copy-btn--copied');
          _copyBtn.textContent = 'Copiar prompt de arranque';
        }, 2000);
      }).catch(() => {
        // B-202605-505: usar _copyTextSafe para evitar sobreescribir clipboard del usuario
        _copyTextSafe(_planPromptText);
        _copyBtn.classList.add('arr-plan-copy-btn--copied');
        _copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          _copyBtn.classList.remove('arr-plan-copy-btn--copied');
          _copyBtn.textContent = 'Copiar prompt de arranque';
        }, 2000);
      });
    });
  }

  // Footer CTA secundario: ir a Tracker
  if (ctaBtn) {
    ctaBtn.onclick = () => {
      closeArranquePanel();
      if (bestAI && typeof selectTrackerAI === 'function') {
        if (typeof switchTab === 'function') switchTab('tab-tracker');
        setTimeout(() => selectTrackerAI(bestAI.id), 80);
      } else if (typeof switchTab === 'function') {
        switchTab('tab-tracker');
      }
    };
    ctaBtn.textContent = bestAI ? `Arrancar con ${bestAI.name} →` : 'Arrancar →';
  }

  // AC: Escape y click fuera cierran el panel
  const onKey = (e) => { if (e.key === 'Escape') { closeArranquePanel(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  overlay.onclick = (e) => { if (e.target === overlay) { closeArranquePanel(); document.removeEventListener('keydown', onKey); } };

  overlay.classList.add('arranque-visible');
}

// ══ R-202604-059: Grid Tracker 3 columnas — lógica JS ══
// T-202604-367: historial col 2 | T-202604-368: preview col 3 | T-202604-372: drag & drop

// ══ END R-202604-059 ══
// Funciones tracker hist/drag/mobile migradas a locus-tracker.js

// R-migración Firebase→Supabase eliminada — AC-8: migración completada

