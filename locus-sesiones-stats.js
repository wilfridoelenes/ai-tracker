// [PP] v1.2.4 · sprint:PP-S-09 · mod:3 · autor:Rune · 2026-05-28 UTC-6
// locus-sesiones-stats.js
// Responsabilidad: Stats globales, status bar, breadcrumb interactivo, helpers de Workers
//   (hasRecentSession, _isInSession, toggleCollapseAll, navigateToCard).

import { _isCountableItem } from './locus-backlog-core.js';
import { openItemPanel } from './locus-backlog-panel.js';
import { navigateToItem } from './locus-backlog-sprints.js';
import { openPulsoPanel } from './locus-pulso.js';
import { _markTrackerDirty, render, selectTrackerAI } from './locus-sesiones.js';
import { openDetail } from './locus-session-popup.js';
import { _getActiveProjectFilter, getProjectById } from './locus-sprint-project.js';
import { _effectiveVersion, getActiveProject, getActiveTracker, getAllSessions } from './locus-storage.js';

// APP_VERSION — fuente de verdad: locus-workers.js
// R-202605-012: constante movida a locus-workers.js (carga antes). Disponible globalmente aquí.
// R-202604-086: versión efectiva — localStorage override prevalece sobre APP_VERSION.
// Se escribe desde _mgApplyBumpedVersion() en locus-map-generator.js al confirmar el generador.
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

document.title = 'Locus ' + _effectiveVersion();

// Header project label — muestra Prefijo · Nombre canónico del proyecto activo
// R-202605-167: Breadcrumb interactivo — proyecto › sprint › ítem activo
export function _updateHeaderProjectLabel() {
  // ── Segmento 1: proyecto ──────────────────────────────────────────────────
  const projBtn    = document.getElementById('breadcrumb-proj');
  const firstSep   = document.querySelector('.breadcrumb-sep--first');
  const sprintBtn  = document.getElementById('breadcrumb-sprint');
  const sprintSep  = document.querySelector('.breadcrumb-sep--sprint');
  const itemBtn    = document.getElementById('breadcrumb-item');
  if (!projBtn) return;

  const filterId = _getActiveProjectFilter();
  const proj = filterId ? getProjectById(filterId) : null;

  if (proj) {
    projBtn.textContent = proj.name || 'Proyecto';
    projBtn.removeAttribute('disabled');
  } else {
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
        const tracker = getActiveTracker();
        const items = tracker.items || [];
        const aiSessions = getAllSessions().filter(s => s.aiId === _trackerSelectedId);
        const sessIds = new Set(aiSessions.map(s => s.id));
        const linked = items.filter(i =>
          i.status !== 'done' &&
          i.status !== 'descartado' &&
          i.sessionId && sessIds.has(i.sessionId)
        );
        if (linked.length > 0) {
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
        if (_target) {
          openItemPanel(_target);
        } else {
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

// navegar al Tracker enfocando la card de una IA
export function _scrollToCard(aiId) {
  const detail = document.querySelector('.tracker-detail');
  if (detail) detail.scrollTop = 0;
}

export function navigateToCard(aiId) {
  switchTab('sesiones');
  setTimeout(() => {
    selectTrackerAI(aiId);
    const ta = document.getElementById('ta-' + aiId);
    if (ta) setTimeout(() => { ta.focus(); }, 80);
  }, 80);
}

export function updateStats() {
  const tot = getAllSessions().length;
  const tgBadgeSub = document.getElementById('tg-badge-sub');
  if (tgBadgeSub) {
    const tracker = getActiveTracker();
    const activeCount = (tracker.items || []).filter(x => x.status !== 'done').length;
    tgBadgeSub.textContent = activeCount;
    tgBadgeSub.classList.toggle('tg-badge-sub--visible', !!activeCount);
  }
}

// Detecta si una IA está "en sesión": disponible con última sesión sin resetAt ni quickCapture
export function _isInSession(ai) {
  if (ai.status !== 'available' || ai.interrupted) return false;
  const allSess = getAllSessions().filter(s => s.aiId === ai.id);
  if (!allSess.length) return false;
  const last = allSess.reduce((a, b) => (parseInt(b.id) || 0) > (parseInt(a.id) || 0) ? b : a);
  return !!(last && !last.resetAt && !last.quickCapture);
}

// T-202605-523: helper compartido — evita recalcular sprint activo en múltiples bloques
function _getActiveSprintStats() {
  try {
    const proj = getActiveProject();
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

// T-086 / T-202604-181: Barra de estado sobre el grid
// T-202605-118: dirty flag — render quirúrgico
let _statusBarDirty = false;
export function _markStatusBarDirty() { _statusBarDirty = true; }
window._markStatusBarDirty = _markStatusBarDirty;

export function renderStatusBar() {
  if (!_statusBarDirty) return;
  try {
  // R-202604-060: tracker-status-bar DEPRECATED — lógica migrada a tracker-grid-header + global-footer

  // ── T-202605-002: Sprint pill en #header-sprint-pill-wrap ────────────────
  try {
    const _pillWrap = document.getElementById('header-sprint-pill-wrap');
    if (_pillWrap) {
      const { sp, spDone, spTotal, spPct, spLabel } = _getActiveSprintStats();
      if (sp) {
        const pillHtml = `<button class="tgh-sprint-pill" title="Ver sprint health">` +
          `<span class="tgh-sprint-name">${spLabel}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-progress">${spDone}/${spTotal}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-pct">${spPct}%</span>` +
          `<span class="tgh-sprint-bar-wrap"><span class="tgh-sprint-bar-fill" style="--pct:${spPct}%"></span></span>` +
          `</button>`;
        _pillWrap.innerHTML = pillHtml;
        const _sprintPillBtn = _pillWrap.querySelector('.tgh-sprint-pill');
        if (_sprintPillBtn) {
          _sprintPillBtn.addEventListener('click', function() {
            if (typeof toggleSprintHealthPanel === 'function') toggleSprintHealthPanel();
          });
        }
        _pillWrap.classList.add('hsr-visible');
        _pillWrap.classList.remove('is-hidden');
      } else {
        _pillWrap.innerHTML = '';
        _pillWrap.classList.remove('hsr-visible');
        _pillWrap.classList.add('is-hidden');
      }
    }
  } catch (e) {}

  _updateHeaderProjectLabel();

  const gridHeader = document.getElementById('tracker-grid-header');
  if (gridHeader) {
    gridHeader.innerHTML = '';
    gridHeader.classList.remove('tgh-visible');
  }

  // ── Global footer: R-202604-080 ──────────────────────────────────────────
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

  if (gfVersion) {
    gfVersion.textContent = _effectiveVersion();
    gfVersion.classList.remove('is-hidden');
  }

  if (gfTotal || gfDone) {
    const total = _items.filter(i => _isCountableItem(i)).length;
    const done  = _items.filter(i => _isCountableItem(i) && i.status === 'done').length;
    if (gfTotal) { gfTotal.textContent = total + ' ítems'; gfTotal.classList.remove('is-hidden'); }
    if (gfDone)  { gfDone.textContent  = '✓ ' + done;   gfDone.classList.remove('is-hidden'); }
  }

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
          openDetail(lastSess.aiId, lastSess.id);
        };
      } else {
        gfCkpt.classList.add('is-hidden');
        gfCkpt.onclick = null;
      }
    } catch(e) { gfCkpt.classList.add('is-hidden'); }
  }

  if (gfPulso) {
    gfPulso.textContent = '◉ Pulso';
    gfPulso.classList.remove('is-hidden');
    gfPulso.classList.add('gf-pulso--link');
    gfPulso.onclick = function() {
      openPulsoPanel();
    };
  }

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
    _statusBarDirty = false;
  }
}

// T-097: Colapsar/expandir todas las cards activas
export function toggleCollapseAll() {
  const active = state.ais.filter(a => !a.archived);
  const allCollapsed = active.every(a => !a.showAll);
  active.forEach(a => { a.showAll = allCollapsed; });
  save();
  _markTrackerDirty();
  render();
}

// hasRecentSession — fuente de verdad: locus-notifications.js
// B-202605-012: definición eliminada de este archivo para resolver duplicación.
// Call sites existentes consumen la función de locus-notifications.js (carga antes).
