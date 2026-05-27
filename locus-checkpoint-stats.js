// locus-checkpoint-stats.js
// Responsabilidad: Stats globales, status bar, sistema de notificaciones,
//   hasRecentSession, toggleCollapseAll, navigateToCard, scrollToCard.
// Dependencias: locus-storage.js · locus-toast.js · locus-tracker.js

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
      sprintBtn.classList.remove('is-hidden');
      sprintSep.classList.remove('is-hidden');
      if (firstSep) firstSep.classList.remove('is-hidden');
    } else {
      sprintBtn.classList.add('is-hidden');
      sprintSep.classList.add('is-hidden');
      if (firstSep) firstSep.classList.add('is-hidden');
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
      itemBtn.classList.remove('is-hidden');
    } else {
      itemBtn.textContent = '';
      itemBtn.title = '';
      itemBtn.onclick = null;
      itemBtn.classList.add('is-hidden');
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
  switchTab('sesiones');
  setTimeout(() => {
    // B: delegar en selectTrackerAI — setea _trackerSelectedId en su scope, marca dirty y llama render
    if (typeof selectTrackerAI === 'function') {
      selectTrackerAI(aiId);
    } else {
      if (typeof _markTrackerDirty === 'function') _markTrackerDirty(); if (typeof render === 'function') render();
    }
    const ta = document.getElementById('ta-' + aiId);
    if (ta) setTimeout(() => { ta.focus(); }, 80);
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
// T-202605-118: dirty flag — render quirúrgico
let _statusBarDirty = false;
function _markStatusBarDirty() { _statusBarDirty = true; }
window._markStatusBarDirty = _markStatusBarDirty;

function renderStatusBar() {
  if (!_statusBarDirty) return;
  try {
  // R-202604-060: tracker-status-bar DEPRECATED — lógica migrada a tracker-grid-header + global-footer

  // ── T-202605-002: Sprint pill en #header-sprint-pill-wrap ────────────────
  // Pill migrado al header global — vive dentro de .logo-project-label.
  try {
    const _pillWrap = document.getElementById('header-sprint-pill-wrap');
    if (_pillWrap) {
      const { sp, spDone, spTotal, spPct, spLabel } = _getActiveSprintStats();
      if (sp) {
        const pillHtml = `<button class="tgh-sprint-pill" onclick="if(typeof toggleSprintHealthPanel==='function')toggleSprintHealthPanel();" title="Ver sprint health">` +
          `<span class="tgh-sprint-name">${spLabel}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-progress">${spDone}/${spTotal}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-pct">${spPct}%</span>` +
          `<span class="tgh-sprint-bar-wrap"><span class="tgh-sprint-bar-fill" style="--pct:${spPct}%"></span></span>` +
          `</button>`;
        _pillWrap.innerHTML = pillHtml;
        _pillWrap.classList.add('hsr-visible');
        _pillWrap.classList.remove('is-hidden');
      } else {
        _pillWrap.innerHTML = '';
        _pillWrap.classList.remove('hsr-visible');
        _pillWrap.classList.add('is-hidden');
      }
    }
  } catch (e) {}

  // Sincronizar breadcrumb con el estado actual de sprint/proyecto
  if (typeof _updateHeaderProjectLabel === 'function') _updateHeaderProjectLabel();

  // ── Grid header: vacío — pill migrado a header global (T-202605-002) ──
  const gridHeader = document.getElementById('tracker-grid-header');
  if (gridHeader) {
    gridHeader.innerHTML = '';
    gridHeader.classList.remove('tgh-visible');
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
  if (gfSyncEl) gfSyncEl.classList.remove('is-hidden');

  const _items = (typeof ITEMS !== 'undefined' ? ITEMS : []);

  // gf-proyecto
  if (gfProyecto) {
    try {
      const proj = getActiveProject();
      const nombre = (proj && proj.name) ? proj.name : 'Locus';
      gfProyecto.textContent = nombre;
      gfProyecto.classList.remove('is-hidden');
    } catch(e) {
      gfProyecto.textContent = 'Locus';
      gfProyecto.classList.remove('is-hidden');
    }
  }

  // gf-version
  if (gfVersion) {
    gfVersion.textContent = (typeof _effectiveVersion === 'function') ? _effectiveVersion() : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '');
    gfVersion.classList.remove('is-hidden');
  }

  // gf-total / gf-done
  if (gfTotal || gfDone) {
    const total = _items.filter(i => typeof _isCountableItem === 'function' ? _isCountableItem(i) : true).length;
    const done  = _items.filter(i => (typeof _isCountableItem === 'function' ? _isCountableItem(i) : true) && i.status === 'done').length;
    if (gfTotal) { gfTotal.textContent = total + ' ítems'; gfTotal.classList.remove('is-hidden'); }
    if (gfDone)  { gfDone.textContent  = '✓ ' + done;   gfDone.classList.remove('is-hidden'); }
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
        gfCkpt.classList.remove('is-hidden');
        gfCkpt.classList.add('gf-ckpt--link');
        gfCkpt.onclick = function() {
          if (typeof openDetail === 'function') openDetail(lastSess.aiId, lastSess.id);
        };
      } else {
        gfCkpt.classList.add('is-hidden');
        gfCkpt.onclick = null;
      }
    } catch(e) { gfCkpt.classList.add('is-hidden'); }
  }

  // gf-pulso
  if (gfPulso) {
    gfPulso.textContent = '◉ Pulso';
    gfPulso.classList.remove('is-hidden');
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
        gfFecha.classList.remove('is-hidden');
      } else {
        gfFecha.classList.add('is-hidden');
      }
    } catch(e) { gfFecha.classList.add('is-hidden'); }
  }
  } finally {
    _statusBarDirty = false; // AC-5 T-202605-118: reset en finally
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

  // 3. R-202605-058: ítem high + sprint activo + sin sesión ≥ threshold días
  // Condiciones: priority === 'high' AND sprint === sprint activo AND días sin sesión ≥ threshold
  // Ítems medium/low o sin sprint asignado no generan notificación de staleness.
  if (cfg.itemInactivo && cfg.itemInactivo.enabled) {
    const thresh = cfg.itemInactivo.threshold || 14;
    const allSprintsForInactivo = (typeof getActiveSprints === 'function' ? getActiveSprints() : []);
    const activeSprintIds = allSprintsForInactivo
      .filter(function(s) { return s.status === 'active'; })
      .map(function(s) { return s.id; });
    items.forEach(function(item) {
      if (item.status !== 'pendiente') return;
      if (item.priority !== 'high') return;                          // AC-2: solo high
      if (!item.sprint || item.sprint === 'n/a') return;            // AC-3: sin sprint → skip
      if (!activeSprintIds.includes(item.sprint)) return;           // AC-1: debe ser sprint activo
      if (!item.createdAt) return;
      const ageDays = (Date.now() - item.createdAt) / 86400000;
      if (ageDays < thresh) return;                                  // AC-4: threshold como gate
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
          if (typeof switchTab === 'function') switchTab('sesiones');
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
  updateTabNotifBadges(all);
}

function markAllNotifsRead() {
  const notifs = _computeNotifications();
  const set    = _notifReadSet();
  // AC-3: guardar todas en historial antes de marcar
  notifs.forEach(function(n) { _notifHistoryAdd(n); });
  notifs.forEach(function(n) { set.add(n.id); });
  _notifSaveRead(set);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  updateTabNotifBadges(notifs);
}

// B-202605-239: badges numéricos en tab buttons — un badge por tab con notifs no leídas
// tab field en cada notif determina qué tab recibe el badge
function updateTabNotifBadges(allNotifs) {
  const notifs = (Array.isArray(allNotifs)) ? allNotifs : _computeNotifications();
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
// B mayor: panel config siempre presente en DOM — openNotifConfig lo expande directamente
// B-202605-008: forzar estado expandido incondicionalmente — la condición anterior
// fallaba silenciosamente cuando unseen=0 o cuando el panel ya estaba expandido
function openNotifConfig() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  // Expandir sidebar si está colapsado
  if (sidebar.classList.contains('collapsed')) {
    toggleRadarSidebar();
  }
  // Sincronizar variable de módulo ANTES del re-render para que _renderCfgPanel()
  // produzca el panel ya expandido — evita el flash de panel colapsado
  window._rsbCfgExpanded = true;
  // Re-renderizar para asegurar que el panel esté presente con estado correcto
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  // Scroll al panel con un tick para que el DOM esté listo
  setTimeout(function() {
    var body = document.getElementById('rsb-cfg-body');
    if (body) body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  save(); if (typeof _markTrackerDirty === 'function') _markTrackerDirty(); if (typeof render === 'function') render();
}


