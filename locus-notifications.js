// [PP] mod:18 · autor:Rune · 2026-08-18 22:30 UTC-6
// TKT4 (REQ CAEL-0723-01, ref_id CAEL-0723-01): bloque 5 (rama Reactiva) — gatea con
// isSlaClockPaused(item) (locus-backlog-core.js) antes de evaluar _fires. Cubre las 3
// prioridades (high/medium/low) con un solo early-return, sin duplicar el check por rama.
// Sin cambio de _NOTIF_DEFAULTS, _itilThresholdH ni el resto de bloques del generador.
// [PP] mod:16 · autor:Rune · 2026-07-23 05:05 UTC-6
// TKT2 (REQ CAEL-0722-01), blocked_at resuelto: "Restaurar por defecto" usa
// _showAlertCfgResetConfirm()/_dismissAlertCfgConfirm() — réplica exacta del patrón D-03
// (_showInlineConfirmDone/_dismissInlineConfirm, locus-backlog-core.js), localizado vía
// Archivo.zip adjuntado por el founder. Ya no llama _notifConfigReset() directo al click.
// [PP] mod:15 · autor:Rune · 2026-07-23 04:20 UTC-6
// TKT2 (REQ CAEL-0722-01): openNotifConfig() reescrito — modal propio vía _gconfirmOpen()
// en vez de togglear/scrollear el Radar Sidebar. Nueva _wireAlertCfgDelegation() scoped a
// #gconfirm-body-html. Import de toggleRadarSidebar retirado (huérfano tras el cambio).
// blocked_at: "Restaurar por defecto" usa reset directo — el patrón D-03
// (.item-inline-confirm) queda pendiente hasta identificar el módulo que lo implementa.
// [PP] mod:14 · autor:Rune · 2026-07-13 UTC-6
// INC histórico — sin CHECKPOINT confirmado: getState() importado — typeof state !== 'undefined' en
// _computeNotifications() (bloque 6, aiCadencia) nunca era true — 'active' siempre
// era []. La notificación "IA fuera de cadencia" nunca disparaba pese a estar
// enabled:true por default. Fix: getState().ais, mismo patrón ya usado en el resto
// del módulo (getActiveSprints, getAllSessions).
// [PP] mod:13 · autor:Rune · 2026-07-13 UTC-6
// TKT1 (REQ CAEL-04): import de navigateToItem apunta a locus-item-navigator.js — antes
// locus-backlog-sprints.js. Sin cambio de comportamiento.
// [PP] mod:12 · autor:Rune · 2026-07-12 20:06 UTC-6
// TKT2 (REQ CAEL-01 · PP-S-02): bloque 5 reescrito — antes solo alertaba INC sla_priority:
//   high (filtro item.type !== 'INC' explícito, config incHigh única). Ahora cubre los 4
//   tipos de la rama Reactiva (INC/PRB/KE/CHG) y las 3 prioridades (incMedium a 48h,
//   incLow contra sprint abierto — BR-Core §6). CHG usa item.status (vocabulario Scrum,
//   BR-Ecosystem §4b) para el check de cerrado; INC/PRB/KE usan incIncidentStatus().
// Fix DISC (bug preexistente, no relacionado a REQ CAEL-01): counts agrega 'sprint' —
// sprintLow declaraba tab:'sprint' sin clave correspondiente en counts, badge nunca se incrementaba.
// TKT3 (REQ CAEL-01): counts extendido con 'incidentes' · notificación incHigh cambia tab de
// 'backlog' a 'incidentes' — badge del tab Incidentes ahora independiente del de Backlog.
// TKT-202607-INC-NAMING (INC histórico — sin CHECKPOINT confirmado): la alerta "INC high sin resolver" (__BR-Core
//   §6) era código muerto — iteraba `items` (getItems()), que nunca contiene tipo INC desde
//   la separación ITEMS/INCIDENTS de TKT-202607-005. Import de getIncidents() agregado,
//   bloque re-apuntado a `incidents`. Fallback slaPriority||sla_priority e
//   incidentStatus||incident_status agregado — mismo motivo que el resto de fixes de esta
//   sesión (ver locus-backlog-core.js / locus-storage.js / locus-backlog-render.js mismo TKT).
// locus-notifications.js
// Responsabilidad: Motor de notificaciones transversal del ecosistema — cómputo, lectura,
//   configuración, historial y badges de tabs.
// Extraído de: locus-checkpoint-stats.js
// Dependencias: locus-storage.js · locus-radar.js · locus-ui-shell.js
// Carga antes de: locus-sesiones-stats.js · locus-radar.js

import { setFilter } from './locus-backlog-item.js';
import { getItems, getIncidents, _registerCoreCallback, isSlaClockPaused } from './locus-backlog-core.js'; // TKT4 (REQ CAEL-0723-01, ref_id CAEL-0723-01): isSlaClockPaused agregado — pausa de reloj SLA en bloque 5
import { navigateToItem } from './locus-item-navigator.js'; // TKT1 (REQ CAEL-04): reubicado — antes en locus-backlog-sprints.js
import { renderGlobalRadarSidebar } from './locus-radar.js';
import { navigateToCard } from './locus-sesiones-stats.js';
import { _sprintDisplay, getActiveSprints, getAllSessions, getState } from './locus-storage.js'; // INC histórico — sin CHECKPOINT confirmado: getState agregado — guard typeof state muerto
import { switchTab } from './locus-ui-shell.js';
import { toast } from './locus-toast.js';
import { getMdiffStepZeroActive } from './locus-backlog-merge.js';
import { incSlaPriority, incIncidentStatus } from './locus-inc-fields.js'; // TKT1 REQ-centralizar-accesores-itil
import { _gconfirmOpen } from './locus-modals.js'; // TKT2 (REQ CAEL-0722-01): modal propio de configuración de alertas

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
  const severityMap = { incHigh: 'warn', sprintLow: 'warn', unblocked: 'ok', sprintOrphans: 'warn' };
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
  incHigh:       { enabled: true,  label: 'Incidente high sin resolver',      threshold: 18 },
  // TKT2 (REQ CAEL-01): incMedium/incLow — BR-Core §6 declara SLA de reloj para los 4 tipos
  // de la rama Reactiva (INC/PRB/KE/CHG) vía sla_priority, en las 3 prioridades — antes solo
  // existía config para 'high'. threshold en horas para incMedium (mismo criterio que incHigh,
  // 72h SLA / 48h alerta). incLow no usa threshold de horas — su condición es "sprint abierto"
  // (BR-Core §6: SLA de low = "próximo sprint"), threshold:0 es placeholder sin efecto.
  incMedium:     { enabled: true,  label: 'Incidente medium sin resolver',    threshold: 48 },
  incLow:        { enabled: true,  label: 'Incidente low sin resolver — sprint abierto', threshold: 0 },
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
  // TKT-202607-INC-NAMING: INC/PRB/KE/CHG viven en el array INCIDENTS desde TKT-202607-005
  // (getItems() nunca los contiene — _setITEMS() los filtra). El bloque #5 de abajo (INC
  // high sin resolver) iteraba solo sobre `items` — nunca encontraba ningún ítem type:'INC'
  // desde esa separación. Bloque #5 actualizado para leer de `incidents`.
  const incidents = (typeof getIncidents() !== 'undefined' ? getIncidents() : []);
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
        body: _sprintDisplay(sp.id) + ' \u2014 ' + cnt + ' \xEDtem' + (cnt !== 1 ? 's' : '') + ' sin reasignar',
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
        body: _sprintDisplay(sp.id) + ' \u2014 ' + spPct + '% a mitad del período',
        action: function() {
          switchTab('sprint');
        }
      });
    });
  }

  // 5. Rama Reactiva (INC/PRB/KE/CHG) con sla_priority sin resolver — BR-Core §6: el SLA
  //    "aplica uniformemente a los 4 tipos... vía sla_priority", en las 3 prioridades.
  // TKT2 (REQ CAEL-01): antes este bloque filtraba item.type !== 'INC' y solo declaraba
  //    threshold para 'high' — PRB/KE/CHG y las prioridades medium/low nunca generaban
  //    notificación. Unificado en un solo loop sobre los 4 tipos y las 3 prioridades.
  {
    const _itilAlertTypeByPriority = { high: 'incHigh', medium: 'incMedium', low: 'incLow' };
    const _itilThresholdH = {
      high:   (cfg.incHigh   && cfg.incHigh.threshold)   || 18,
      medium: (cfg.incMedium && cfg.incMedium.threshold) || 48
      // low: sin threshold de horas — ver rama _priority === 'low' abajo
    };
    // BR-Core §6: SLA de low = "próximo sprint" — se evalúa contra sprint abierto, no edad en horas.
    const _openSprintNow = getActiveSprints().some(function(s) { return s.status === 'active'; });
    // TKT1 (REQ-centralizar-accesores-itil): itera `incidents` (no `items`) — INC/PRB/KE/CHG
    // viven en INCIDENTS. Fallback centralizado en locus-inc-fields.js — items hidratados
    // desde Supabase solo traen el campo snake_case.
    incidents.forEach(function(item) {
      if (!['INC', 'PRB', 'KE', 'CHG'].includes(item.type)) return;
      const _priority = incSlaPriority(item);
      const _notifType = _itilAlertTypeByPriority[_priority];
      if (!_notifType) return; // sla_priority ausente o valor no reconocido — no alertar
      if (!cfg[_notifType] || !cfg[_notifType].enabled) return;
      // Estado resuelto no alerta — CHG usa `status` (vocabulario Scrum, BR-Ecosystem §4b),
      // INC/PRB/KE usan incidentStatus (vocabulario ITIL).
      const _closed = item.type === 'CHG'
        ? ['done', 'descartado'].includes(item.status)
        : ['resolved', 'closed', 'descartado'].includes(incIncidentStatus(item));
      if (_closed) return;
      // TKT4 (REQ CAEL-0723-01, ref_id CAEL-0723-01): derived_items apuntando a un REQ/DISC/CHG
      // no-terminal pausa el reloj SLA — no genera notificación en ninguna de las 3 prioridades,
      // sin caché (isSlaClockPaused se recalcula en cada ejecución de generateNotifications()).
      if (isSlaClockPaused(item)) return;
      let _ageHours = null;
      let _fires;
      if (_priority === 'low') {
        _fires = _openSprintNow;
      } else {
        if (!item.createdAt) return;
        _ageHours = (Date.now() - item.createdAt) / 3600000;
        _fires = _ageHours > _itilThresholdH[_priority];
      }
      if (!_fires) return;
      const id  = 'inc-' + _priority + '-' + item.code;
      const lbl = (item.title || '').substring(0, 40);
      const _icon = _priority === 'high' ? '\uD83D\uDED1' : (_priority === 'medium' ? '\u23F3' : '\uD83D\uDCC5');
      const _ageLabel = _ageHours != null
        ? ' lleva ' + Math.floor(_ageHours) + 'h sin resolver'
        : ' sin resolver \u2014 sprint abierto';
      notifs.push({
        id, type: _notifType, tab: 'incidentes', icon: _icon,
        title: 'Incidente ' + _priority + ' sin resolver',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + _ageLabel,
        action: function() { navigateToItem(item.code); }
      });
    });
  }

  // 6. B-202605-238 AC: IA sin sesión vs cadencia histórica
  if (cfg.aiCadencia && cfg.aiCadencia.enabled) {
    const active = (getState().ais || []).filter(function(a) { return !a.archived; });
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
  // TKT3 (REQ CAEL-01): 'incidentes' agregado — badge del tab Incidentes independiente del de Backlog.
  // Fix DISC (bug preexistente): 'sprint' agregado — sprintLow (línea ~225) declara tab:'sprint'
  // desde antes de esta sesión, pero counts no tenía la clave — el badge del tab Sprint nunca se
  // incrementaba pese a que la notificación existía y estaba habilitada (cfg.sprintLow.enabled).
  const counts = { tracker: 0, backlog: 0, analytics: 0, proyectos: 0, incidentes: 0, sprint: 0 };
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
// TKT2 (REQ CAEL-0722-01): modal propio vía shell gconfirm — reemplaza la redirección al
// Radar Sidebar (R-202605-119, ya no togglea ni hace scrollIntoView). Edge case AC: si el
// sidebar está colapsado, permanece colapsado — el modal no depende de su estado.
export function openNotifConfig() {
  const cfg = _notifConfig();
  const rows = Object.keys(_NOTIF_DEFAULTS).map(function(key) {
    const def = cfg[key];
    const thrInput = (typeof def.threshold === 'number' && def.threshold > 0)
      ? '<input class="alertcfg-input" type="number" min="1" max="365" value="' + def.threshold + '"' +
        (def.enabled ? '' : ' disabled') +
        ' data-action="cfgSetThreshold" data-cfg-key="' + key + '">' +
        '<span class="alertcfg-unit">d</span>'
      : '';
    return '<div class="alertcfg-row">' +
      '<label class="alertcfg-label">' + def.label + '</label>' +
      '<div class="alertcfg-controls">' +
        thrInput +
        '<input class="alertcfg-toggle" type="checkbox"' + (def.enabled ? ' checked' : '') +
          ' data-action="cfgSetEnabled" data-cfg-key="' + key + '">' +
      '</div>' +
    '</div>';
  }).join('');

  // blocked_at (CHECKPOINT TKT2): AC4 de TKT1 pide que "Restaurar por defecto" revele el
  // par accept/cancel de .item-inline-confirm (D-03) — módulo que lo implementa no
  // identificado ni adjunto en sesión (ver CHECKPOINT de Cael, blockers). Fallback: reset
  // directo al click. No retomar esta parte sin el módulo de referencia.
  const bodyHtml = '<div class="alertcfg-list" id="alertcfg-list">' +
    rows +
    '<div class="alertcfg-reset-wrap">' +
      '<button type="button" class="alertcfg-reset-btn" id="alertcfg-reset-btn" data-action="cfgReset">Restaurar por defecto</button>' +
    '</div>' +
  '</div>';

  _gconfirmOpen({ title: 'Configurar alertas', msg: '', okLabel: 'Cerrar', danger: false, bodyHtml: bodyHtml }, function() {});
  _wireAlertCfgDelegation();
}

// D-03 (item-inline-confirm) — réplica exacta del patrón de _showInlineConfirmDone/
// _dismissInlineConfirm en locus-backlog-core.js: mismas clases (item-inline-confirm,
// __accept, __cancel, is-visible), mismo timing (auto-cancel 6s, transitionend con
// fallback 400ms). No se importa la función original — es module-scoped ahí y está
// anclada a .item[data-code]; aquí el ancla es .alertcfg-reset-wrap.
function _showAlertCfgResetConfirm(btn) {
  const wrap = btn.closest('.alertcfg-reset-wrap');
  if (!wrap) return;
  const existing = wrap.querySelector('.item-inline-confirm');
  if (existing) existing.remove();

  const confirmEl = document.createElement('div');
  confirmEl.className = 'item-inline-confirm';
  confirmEl.innerHTML =
    '<button type="button" class="item-inline-confirm__accept">Restaurar</button>' +
    '<button type="button" class="item-inline-confirm__cancel">Cancelar</button>';
  wrap.appendChild(confirmEl);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => confirmEl.classList.add('is-visible'));
  });

  const autoCancel = setTimeout(() => _dismissAlertCfgConfirm(confirmEl), 6000);

  confirmEl.querySelector('.item-inline-confirm__accept').addEventListener('click', () => {
    clearTimeout(autoCancel);
    _dismissAlertCfgConfirm(confirmEl);
    _notifConfigReset();
  });
  confirmEl.querySelector('.item-inline-confirm__cancel').addEventListener('click', () => {
    clearTimeout(autoCancel);
    _dismissAlertCfgConfirm(confirmEl);
  });
}

function _dismissAlertCfgConfirm(confirmEl) {
  if (!confirmEl) return;
  confirmEl.classList.remove('is-visible');
  const fallback = setTimeout(() => confirmEl.remove(), 400);
  confirmEl.addEventListener('transitionend', () => { clearTimeout(fallback); confirmEl.remove(); }, { once: true });
}

// TKT2: delegación scoped al contenedor del modal (#gconfirm-body-html) — reemplaza la
// delegación que vivía en #global-radar-sidebar (locus-radar.js). Listener attach una sola
// vez sobre el contenedor persistente; _gconfirmOpen() solo reescribe su innerHTML en cada
// apertura, por lo que no requiere re-wiring.
let _alertCfgDelegationInited = false;
function _wireAlertCfgDelegation() {
  const container = document.getElementById('gconfirm-body-html');
  if (!container || _alertCfgDelegationInited) return;
  _alertCfgDelegationInited = true;

  container.addEventListener('click', function(e) {
    const el = e.target.closest('[data-action]');
    if (!el || el.dataset.action !== 'cfgReset') return;
    e.stopPropagation();
    _showAlertCfgResetConfirm(el);
  });

  container.addEventListener('change', function(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const key = el.dataset.cfgKey;
    if (action === 'cfgSetThreshold') {
      e.stopPropagation();
      const num = parseInt(el.value, 10);
      if (isNaN(num) || num < 1) { el.classList.add('alertcfg-input--error'); return; }
      el.classList.remove('alertcfg-input--error');
      _notifConfigSetThreshold(key, el.value);
    } else if (action === 'cfgSetEnabled') {
      e.stopPropagation();
      _notifConfigSetEnabled(key, el.checked);
    }
  });
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

// TKT-notif-config-cleanup: closeNotifConfig() y sus listeners (#notif-config-close-btn,
// #notif-config-reset-btn, #notif-config-listo-btn) eliminados — el overlay #notif-config-overlay
// que consumían fue removido de index.html (R-202605-119 ya había redirigido la config
// al Radar Sidebar; este código quedó huérfano). _notifConfigReset() se conserva —
// la usa el Radar Sidebar directamente, no depende del overlay eliminado.
document.addEventListener('DOMContentLoaded', function() {
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
