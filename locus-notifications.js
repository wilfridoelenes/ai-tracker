// [PP] mod:4 · autor:Rune · 2026-06-28 UTC-6
// locus-notifications.js
// Responsabilidad: Motor de notificaciones transversal del ecosistema — cómputo, lectura,
//   configuración, historial y badges de tabs.
// Extraído de: locus-checkpoint-stats.js
// Dependencias: locus-storage.js · locus-radar.js · locus-ui-shell.js
// Carga antes de: locus-sesiones-stats.js · locus-radar.js

import { setFilter } from './locus-backlog-item.js';
import { getItems, _registerCoreCallback } from './locus-backlog-core.js';
import { navigateToItem } from './locus-backlog-sprints.js';
import { renderGlobalRadarSidebar, toggleRadarSidebar } from './locus-radar.js';
import { navigateToCard } from './locus-sesiones-stats.js';
import { getActiveSprints, getAllSessions } from './locus-storage.js';
import { switchTab } from './locus-ui-shell.js';
import { toast } from './locus-toast.js';
import { getMdiffStepZeroActive } from './locus-backlog-merge.js';

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
export const _NOTIF_DEFAULTS = {
  unblocked:     { enabled: true,  label: 'Bloqueante resuelto',              threshold: 7  },
  sprintOrphans: { enabled: true,  label: 'Sprint cerrado con pendientes',    threshold: 0  },
  itemInactivo:  { enabled: true,  label: 'Ítem sin sesión vinculada',        threshold: 14 },
  sprintLow:     { enabled: true,  label: 'Sprint con avance bajo a mitad',   threshold: 20 },
  bugHigh:       { enabled: true,  label: 'Bug high sin sesión vinculada',    threshold: 7  },
  aiCadencia:    { enabled: true,  label: 'IA fuera de cadencia histórica',   threshold: 0  },
};

export function _notifConfig() {
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

export function _notifReadSet() {
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
export function hasRecentSession(item, days) {
  if (!item) return true;
  const allSess = (getAllSessions());
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

export function _computeNotifications() {
  const notifs = [];
  const items  = (typeof getItems() !== 'undefined' ? getItems() : []);
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
        action: function() { navigateToItem(item.code); }
      });
    });
  }

  // 2. Sprint cerrado con pendientes sin reasignar
  if (cfg.sprintOrphans && cfg.sprintOrphans.enabled) {
    const allSprints = (getActiveSprints());
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
          switchTab('backlog');
          setTimeout(function() { setFilter('sprint', sp.id); }, 80);
        }
      });
    });
  }

  // 3. R-202605-058: ítem high + sprint activo + sin sesión ≥ threshold días
  // Condiciones: priority === 'high' AND sprint === sprint activo AND días sin sesión ≥ threshold
  // Ítems medium/low o sin sprint asignado no generan notificación de staleness.
  if (cfg.itemInactivo && cfg.itemInactivo.enabled) {
    const thresh = cfg.itemInactivo.threshold || 14;
    const allSprintsForInactivo = (getActiveSprints());
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
        action: function() { navigateToItem(item.code); }
      });
    });
  }

  // 4. B-202605-238 AC: sprint con < 20% avance a mitad de período
  if (cfg.sprintLow && cfg.sprintLow.enabled) {
    const minPct = cfg.sprintLow.threshold != null ? cfg.sprintLow.threshold : 20;
    const allSprints2 = (getActiveSprints());
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
        id, type: 'sprintLow', tab: 'sprint', icon: '\u26A1',
        title: 'Sprint con avance bajo',
        body: (sp.label || sp.id) + ' \u2014 ' + spPct + '% a mitad del período',
        action: function() {
          switchTab('sprint');
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
        action: function() { navigateToItem(item.code); }
      });
    });
  }

  // 6. B-202605-238 AC: IA sin sesión vs cadencia histórica
  if (cfg.aiCadencia && cfg.aiCadencia.enabled) {
    const active = (typeof state !== 'undefined' ? (state.ais || []) : []).filter(function(a) { return !a.archived; });
    active.forEach(function(ai) {
      if (ai.status === 'exhausted') return;
      const allSess  = (getAllSessions())
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
          switchTab('sesiones');
          setTimeout(function() { navigateToCard(ai.id); }, 80);
        }
      });
    });
  }

  return notifs;
}

export function markNotifRead(id) {
  // AC-3: guardar en historial antes de marcar como leída
  const all    = _computeNotifications();
  const notif  = all.find(function(n) { return n.id === id; });
  if (notif) _notifHistoryAdd(notif);
  const set = _notifReadSet();
  set.add(id);
  _notifSaveRead(set);
  renderGlobalRadarSidebar();
  updateTabNotifBadges(all);
}

export function markAllNotifsRead() {
  const notifs = _computeNotifications();
  const set    = _notifReadSet();
  // AC-3: guardar todas en historial antes de marcar
  notifs.forEach(function(n) { _notifHistoryAdd(n); });
  notifs.forEach(function(n) { set.add(n.id); });
  _notifSaveRead(set);
  renderGlobalRadarSidebar();
  updateTabNotifBadges(notifs);
}

// B-202605-239: badges numéricos en tab buttons — un badge por tab con notifs no leídas
// tab field en cada notif determina qué tab recibe el badge
export function updateTabNotifBadges(allNotifs) {
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

// B-202605-240: UI de configuración de notificaciones
// R-202605-119: openNotifConfig redirige al Radar Sidebar — config unificada ahí
export function openNotifConfig() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  if (sidebar.classList.contains('collapsed')) {
    toggleRadarSidebar();
  }
  renderGlobalRadarSidebar();
  setTimeout(function() {
    var body = document.getElementById('rsb-cfg-body');
    if (body) body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

export function _notifConfigReset() {
  try { localStorage.removeItem(_NOTIF_CONFIG_KEY); } catch {}
  renderGlobalRadarSidebar();
}

export function _notifConfigSetEnabled(key, enabled) {
  const cfg = _notifConfig();
  if (!cfg[key]) cfg[key] = Object.assign({}, _NOTIF_DEFAULTS[key]);
  cfg[key].enabled = !!enabled;
  _saveNotifConfig(cfg);
  renderGlobalRadarSidebar();
}

export function _notifConfigSetThreshold(key, val) {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 1) return;
  const cfg = _notifConfig();
  if (!cfg[key]) cfg[key] = Object.assign({}, _NOTIF_DEFAULTS[key]);
  cfg[key].threshold = num;
  _saveNotifConfig(cfg);
  renderGlobalRadarSidebar();
}

export function closeNotifConfig() {
  const overlay = document.getElementById('notif-config-overlay');
  if (overlay) overlay.classList.add('is-hidden');
}

document.addEventListener('DOMContentLoaded', function() {
  var _notifConfigCloseBtn = document.getElementById('notif-config-close-btn');
  if (_notifConfigCloseBtn) _notifConfigCloseBtn.addEventListener('click', closeNotifConfig);

  var _notifConfigResetBtn = document.getElementById('notif-config-reset-btn');
  if (_notifConfigResetBtn) _notifConfigResetBtn.addEventListener('click', _notifConfigReset);

  var _notifConfigListoBtn = document.getElementById('notif-config-listo-btn');
  if (_notifConfigListoBtn) _notifConfigListoBtn.addEventListener('click', closeNotifConfig);

  // T-202606-077: registrar hasRecentSession en _coreCallbacks
  // locus-backlog-core lo consume para cálculo de prioridad automática de ítems.
  _registerCoreCallback('hasRecentSession', hasRecentSession);
});

const _notifActionMap = {};
export function _registerNotifActions(notifs) {
  notifs.forEach(function(n) { _notifActionMap[n.id] = n.action; });
}
export function _notifGoto(id) {
  const fn = _notifActionMap[id];
  if (typeof fn === 'function') fn();
  markNotifRead(id);
}

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────

// T-[tmp:t-listeners-storage-render]: listeners shell:* — desacoplamiento de locus-storage.js
// locus-storage.js despacha shell:update-notif-badges en lugar de llamar updateTabNotifBadges() directamente
window.addEventListener('shell:update-notif-badges', () => { updateTabNotifBadges(); });
// B-202606-020 fix: locus-ui-shell.js despacha shell:open-notif-config desde mm-btn-notif handler
window.addEventListener('shell:open-notif-config', () => { openNotifConfig(); });

// T-202606-007: notificación cuando un ítem se excluye al guardar por no tener sprint.
// Migrado desde locus-radar.js — pertenece al motor de notificaciones transversal.
// Si Step 0 del DIFF está activo, T2 es la única superficie — sin toast duplicado.
const _EXCLUDED_TYPE_LABEL = { REQ: 'un Requerimiento', TKT: 'un Ticket', INC: 'un Incidente', DISC: 'una Discovery' };
window.addEventListener('storage:item-excluded', (e) => {
  if (getMdiffStepZeroActive()) return;
  const { code, type } = e.detail || {};
  const _typeLabel = _EXCLUDED_TYPE_LABEL[type] || type;
  toast(`${code || '[pendiente-ID]'} no se guardó — ${_typeLabel} no puede ir sin sprint.`);
});
