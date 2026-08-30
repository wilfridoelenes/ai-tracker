// [PP] mod:12 · autor:Rune · 2026-08-30 UTC-6
// TKT-202608-491 (REQ-202608-207, TKT3): guard ai.interrupted retirado del setInterval de
// auto-reset (línea ~394) — ver comentario inline. Sin lectura ni escritura de ai.interrupted
// restante en este archivo (verificado por grep).
// [PP] mod:11 · autor:Rune · 2026-08-18 UTC-6
// INC-[pendiente-ID]: setInterval de auto-reset (línea ~386) ganó guard !ai.interrupted —
// mismo patrón ya corregido en locus-storage.js mod:169/188. Ver ese header para el
// reporte original del founder.
// TKT2 (CAEL-08111815-01): saveWorker() agregado dentro del setInterval de auto-reset —
// save() de fin de ciclo ya no persiste ais en tracker_state.
// locus-sesiones-utils.js
// Última actualización: 2026-05-24 · R-202605-054 guard state global | Extraído de locus-sesiones.js
// Módulo: Timer de sesión · Worker chip activo · Sesión sugerida · Resumen semanal · Reset de IAs
// Requiere: locus-storage.js, locus-ui-shell.js (switchTab) cargados ANTES en index.html
// Debe cargarse ANTES de locus-sesiones.js

import { relDate } from './locus-session-hora.js';
import { getAI, getAISessions, getActiveProject, getState, save, _resetWorker, saveWorker } from './locus-storage.js';
import { switchTab, getCurrentTab } from './locus-ui-shell.js';
import { showToast } from './locus-toast.js';
import { renderStatusBar, updateStats } from './locus-sesiones-stats.js';
import { getItems } from './locus-backlog-core.js'; // ESM-1 · T-202606-039

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
export function stopSessionTimer(aiId) {
  const d = _getTimerData(aiId);
  if (!d) return 0;
  const elapsed = d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0);
  _setTimerData(aiId, { running: false, elapsed, startEpoch: null });
  _refreshTimerTick();
  return elapsed;
}

// Llamado al abrir/seleccionar una IA — inicia o retoma cronómetro
export function startSessionTimer(aiId) {
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
    const ai = (getState().ais || []).find(a => a.id === aiId);
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
    (getState().ais || []).forEach(ai => _renderTimerInCard(ai.id));
    document.querySelectorAll('.cscard-timer[data-ts]').forEach(el => {
      const ts = parseInt(el.dataset.ts, 10);
      if (ts) el.textContent = _cscardRelTs(ts);
    });
  }, 60000);
  // Actualización inmediata al arrancar el tick
  (getState().ais || []).forEach(ai => _renderTimerInCard(ai.id));
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
  const highPending = getItems().filter(i =>
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
  const active = (getState().ais || []).filter(ai => !ai.archived);
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
  return getItems().filter(i =>
    i.status === 'pendiente' && i.priority === 'high' &&
    aiSigla && i.role && i.role.includes(aiSigla)
  ).length;
}

export function _buildSuggestionReason(ai) {
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

export function renderSuggestionBanner() {
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
  window.dispatchEvent(new CustomEvent('shell:select-tracker-ai', { detail: { aiId } }));
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
  const allSessions = (getState().projects || []).flatMap(p => (p.sessions || []));
  const lastWeekSess = allSessions.filter(s => {
    const ts = new Date(s.date || 0).getTime();
    return ts >= twoWeeksAgo && ts < oneWeekAgo;
  });

  if (!lastWeekSess.length) return null; // sin actividad — no mostrar

  const totalSessions = lastWeekSess.length;

  // Ítems cerrados (done en esa semana)
  const allItems = getItems();
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
    const proj = getActiveProject();
    const projFallback = proj || (getState().projects && getState().projects[0]);
    const sp = projFallback && projFallback.sprints ? projFallback.sprints.find(s => s.status === 'active') : null;
    if (sp) {
      const spItems = allItems.filter(i => i.sprint === sp.id);
      const spDone = spItems.filter(i => i.status === 'done').length;
      const spTotal = spItems.length;
      const spPct = spTotal > 0 ? Math.round((spDone/spTotal)*100) : 0;
      sprintProgress = `${(sp.label && sp.label !== sp.id) ? `${sp.id} · ${sp.label}` : sp.id} · ${spDone}/${spTotal} (${spPct}%)`;
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
  if (modal) modal.classList.add('is-hidden');
}

export function _maybeShowWeeklySummary() {
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
  if (modal) modal.classList.remove('is-hidden');
}

// ══════════════════════════════════════════════════════════════════════════════
// T-202605-019: Migrado desde locus-misc-ui.js — Reset de IAs (getNextOccurrence, _resetExpired, getCD, setInterval)
// ══════════════════════════════════════════════════════════════════════════════

// B-202604-007: corrección — proyección correcta evita countdown vacío
export function getNextOccurrence(resetTime) {
  if (!resetTime) return null;
  const [h, m] = resetTime.split(':').map(Number);
  const r = new Date(); r.setHours(h, m, 0, 0);
  if (r <= new Date()) r.setDate(r.getDate() + 1);
  return r;
}

// B-202604-009: usa epoch absoluto cuando está disponible — evita liberar IAs por coincidencia de hora
export function _resetExpired(resetTime, resetEpoch) {
  if (!resetTime) return false;
  if (resetEpoch) return Date.now() >= resetEpoch;
  const [h, m] = resetTime.split(':').map(Number);
  const r = new Date(); r.setHours(h, m, 0, 0);
  return r <= new Date();
}

export function getCD(resetTime, resetEpoch) {
  if (!resetTime) return '';
  if (resetEpoch) {
    const d = resetEpoch - Date.now();
    if (d <= 0) return '00:00:00';
    const H = Math.floor(d / 3600000), M = Math.floor((d % 3600000) / 60000), S = Math.floor((d % 60000) / 1000);
    return `${String(H).padStart(2,'0')}:${String(M).padStart(2,'0')}:${String(S).padStart(2,'0')}`;
  }
  if (_resetExpired(resetTime)) return '00:00:00';
  const r = getNextOccurrence(resetTime);
  if (!r) return '';
  const d = r - new Date();
  if (d <= 0) return '00:00:00';
  const H = Math.floor(d / 3600000), M = Math.floor((d % 3600000) / 60000), S = Math.floor((d % 60000) / 1000);
  return `${String(H).padStart(2,'0')}:${String(M).padStart(2,'0')}:${String(S).padStart(2,'0')}`;
}

// T-058 + T-082: intervalo de reset de IAs — migrado desde locus-misc-ui.js
// TKT3 (REQ-202608-207, TKT-202608-491): guard ai.interrupted retirado — ai.interrupted
// deja de existir en el modelo. AC de negocio: un worker wip:true SÍ debe auto-resetearse
// a available cuando su hora expira, aquí igual que en los otros dos barrido de
// locus-storage.js (load()/_applyStateRow()) — wip permanece true tras el movimiento.
setInterval(() => {
  let changed = false;
  (getState()?.ais || []).forEach(ai => {
    if (ai.status !== 'exhausted' || !ai.resetTime) return;
    if (_resetExpired(ai.resetTime, ai.resetEpoch)) {
      _resetWorker(ai);
      changed = true;
      // TKT2 (CAEL-08111815-01): save() de abajo ya no sube ais — persistir cada Worker
      // reseteado por su canal propio, por fila, en el mismo tick del forEach.
      saveWorker(ai);
      showToast('info', `${ai.name} ya disponible`);
      return;
    }
    const cd = getCD(ai.resetTime, ai.resetEpoch);
    const el = document.getElementById('cd-' + ai.id);
    if (el) el.textContent = cd || '--:--:--';
  });
  if (changed) {
    save();
    window.dispatchEvent(new CustomEvent('shell:render-tracker'));
    const currentTab = getCurrentTab();
    if (currentTab === 'sesiones') window.dispatchEvent(new CustomEvent('shell:sesiones-render'));
  }
  updateStats();
  renderStatusBar();
}, 1000);

// ── END T-202605-019 ─────────────────────────────────────────────────────────

// ── B-202605-019: Listeners — weekly-summary-modal on* migrados desde index.html ──
(function _initWeeklySummaryHandlers() {
  function _bind() {
    const closeBtn   = document.getElementById('weekly-modal-close-btn');
    const dismissBtn = document.getElementById('weekly-dismiss-btn');
    const exportBtn  = document.getElementById('weekly-export-btn');
    if (closeBtn)   closeBtn.addEventListener('click', dismissWeeklySummary);
    if (dismissBtn) dismissBtn.addEventListener('click', dismissWeeklySummary);
    if (exportBtn)  exportBtn.addEventListener('click', _exportWeeklySummaryMd);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bind, { once: true });
  } else {
    _bind();
  }
})();
// ── END B-202605-019 ─────────────────────────────────────────────────────────


// T-202606-086: _sessRelTsShared y _cscardRelTs movidas desde locus-sesiones.js — elimina ciclos con popup y utils
export function _sessRelTsShared(s) {
  const ts = s.updatedAt || s.createdAt || 0;
  if (!ts) return s.date ? relDate(s.date) : (s.dateShort || '');
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
    return s.date ? relDate(s.date) : (s.dateShort || '');
  }
}
export function _cscardRelTs(ts) {
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

// T-202606-085: _hoyMsUntilReset movida desde locus-sesiones.js — elimina ciclo con locus-radar.js
export function _hoyMsUntilReset(ai) {
  if (!ai.resetTime) return Infinity;
  const [h, m] = ai.resetTime.split(':').map(Number);
  const r = new Date(); r.setHours(h, m, 0, 0);
  if (r <= new Date()) r.setDate(r.getDate() + 1);
  return r - new Date();
}
export function _hoyCountdownLabel(ms) {
  if (!isFinite(ms) || ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
