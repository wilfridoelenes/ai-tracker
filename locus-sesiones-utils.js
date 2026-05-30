// [PP] v1.2.4 · sprint:PP-S-09 · mod:6 · autor:Rune · 2026-05-29 UTC-6
// locus-sesiones-utils.js
// Última actualización: 2026-05-24 · R-202605-054 guard state global | Extraído de locus-sesiones.js
// Módulo: Timer de sesión · Worker chip activo · Sesión sugerida · Resumen semanal
// Requiere: locus-storage.js, locus-ui-shell.js (switchTab) cargados ANTES en index.html
// Debe cargarse ANTES de locus-sesiones.js

import { _cscardRelTs, render, selectTrackerAI } from './locus-sesiones.js';
import { getAI, getAISessions, getActiveProject } from './locus-storage.js';
import { switchTab } from './locus-ui-shell.js';

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
  _renderActiveWorkerChip();
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
    const ai = (typeof state !== 'undefined' && state.ais && state.ais.find(a => a.id === aiId));
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
    (typeof state !== 'undefined' && state.ais || []).forEach(ai => _renderTimerInCard(ai.id));
    _renderActiveWorkerChip();
    // Actualizar timestamps relativos en cards de sesión en curso
    document.querySelectorAll('.cscard-timer[data-ts]').forEach(el => {
      const ts = parseInt(el.dataset.ts, 10);
      if (ts) el.textContent = _cscardRelTs(ts);
    });
  }, 60000);
  // Actualización inmediata al arrancar el tick
  (typeof state !== 'undefined' && state.ais || []).forEach(ai => _renderTimerInCard(ai.id));
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

export function _renderActiveWorkerChip() {
  const chip = document.getElementById('header-active-worker');
  if (!chip) return;

  // Buscar el Worker con timer activo — si hay más de uno, el de mayor elapsed
  let best = null;
  let bestElapsed = -1;
  (typeof state !== 'undefined' && state.ais || []).forEach(ai => {
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
  selectTrackerAI(aiId);
  if (document.querySelector('.tab-btn.active')?.dataset.tab !== 'sesiones') {
    switchTab('sesiones');
  }
}
// window fallback para inline handler en index.html
// _hwcClick — función privada del módulo, accedida via addEventListener (T5)

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
  const active = (typeof state !== 'undefined' && state.ais || []).filter(ai => !ai.archived);
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
  const allSessions = (typeof state !== 'undefined' && state.projects || []).flatMap(p => (p.sessions || []));
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
    const proj = getActiveProject();
    const projFallback = proj || (typeof state !== 'undefined' && state.projects && state.projects[0]);
    const sp = projFallback && projFallback.sprints ? projFallback.sprints.find(s => s.status === 'active') : null;
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

// T-202605-045: Migrar handler inline #header-active-worker → addEventListener
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function _initHwcHandler() {
    const chip = document.getElementById('header-active-worker');
    if (chip) chip.addEventListener('click', _hwcClick);
  }, { once: true });
} else {
  const chip = document.getElementById('header-active-worker');
  if (chip) chip.addEventListener('click', _hwcClick);
}

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
