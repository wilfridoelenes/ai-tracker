// [PP] v0.5.0 · sprint:PP-Q-Backlog · mod:21 · autor:Rune · 2026-07-03 UTC-6
// locus-sesiones-stats.js
// Responsabilidad: Stats globales, status bar, breadcrumb de proyecto, helpers de Workers
//   (hasRecentSession, _isInSession, toggleCollapseAll, navigateToCard).
// TKT-202606-005: segmentos sprint/ítem del breadcrumb eliminados — #breadcrumb-sprint
//   y #breadcrumb-item no existen en el DOM (index.html solo declara #breadcrumb-proj).

import { _isCountableItem, getItems} from './locus-backlog-core.js';
import { openPulsoPanel } from './locus-pulso.js';
// selectTrackerAI y _markTrackerDirty desacoplados vía shell:* events (T-202606-084)
import { openDetail } from './locus-session-popup.js';
// T-202606-166: _getActiveProjectFilter y getProjectById movidas a locus-storage.js
import { _effectiveVersion, _getActiveProjectFilter, _isInSession, getActiveSprints, getAISessions, getActiveProject, getActiveTracker, getAllSessions, getProjectById, save } from './locus-storage.js';

import { switchTab } from './locus-ui-shell.js';

// APP_VERSION — fuente de verdad: locus-workers.js
// R-202605-012: constante movida a locus-workers.js (carga antes). Disponible globalmente aquí.
// R-202604-086: versión efectiva — localStorage override prevalece sobre APP_VERSION.
// Se escribe desde _mgApplyBumpedVersion() en locus-map-generator.js al confirmar el generador.
// APP_VERSION es el fallback de primer arranque; el generador es la fuente de verdad post-bump.

// T-074: umbral de días sin sesión para sugerencia contextual
const STALE_DAYS_THRESHOLD = 3;

// T-074: true si la IA lleva >STALE_DAYS_THRESHOLD días sin sesión Y tiene ítems pendientes
export function _hasStaleSuggestion(ai) {
  if (ai.status === 'exhausted') return false;
  const aiSessions = getAISessions(ai.id);
  if (!aiSessions.length) return false;
  const last = aiSessions[aiSessions.length - 1];
  const lastDate = new Date(last.date);
  if (isNaN(lastDate)) return false;
  const diffDays = (Date.now() - lastDate.getTime()) / 86400000;
  if (diffDays <= STALE_DAYS_THRESHOLD) return false;
  const _items = (typeof getItems() !== 'undefined' ? getItems() : []);
  const hasInProgress = _items.some(i => i.status === 'pendiente'); // B-202605-046: 'en-progreso' es valor legacy — schema canónico usa 'pendiente'
  return hasInProgress;
}

document.title = 'Locus ' + _effectiveVersion();

// Header project label — muestra Prefijo · Nombre canónico del proyecto activo
export function _updateHeaderProjectLabel() {
  const projBtn = document.getElementById('breadcrumb-proj');
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
}
// _updateHeaderProjectLabel expuesta vía export — window.* eliminado (T5)

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
    window.dispatchEvent(new CustomEvent('shell:select-tracker-ai', { detail: { aiId } }));
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

// T-202605-082: _isInSession movida a locus-storage.js como export canónico.
// Importada en L13. locus-radar.js importa directamente desde storage — window.* eliminado.

// hasRecentSession — fuente de verdad: locus-notifications.js
// B-202605-012: definición eliminada de este archivo para resolver duplicación.
// Call sites existentes consumen la función de locus-notifications.js (carga antes).

// T-202605-523: helper compartido — evita recalcular sprint activo en múltiples bloques
function _getActiveSprintStats() {
  try {
    const proj = getActiveProject();
    const sp = proj && proj.sprints ? proj.sprints.find(s => s.status === 'active') : null;
    if (!sp) return { sp: null, spItems: [], spDone: 0, spTotal: 0, spPct: 0, spLabel: '' };
    // B-202606-026: alinear criterio con _renderSprintItems — excluir descartados, incluir solo R·B·T
    const spItems = (typeof getItems() !== 'undefined' ? getItems() : []).filter(i => {
      const t = i.type || (i.code ? i.code.charAt(0) : '');
      return i.sprint && i.sprint.startsWith(sp.id) &&
        (t === 'R' || t === 'B' || t === 'T') &&
        i.status !== 'descartado';
    });
    const spDone  = spItems.filter(i => i.status === 'done').length;
    const spTotal = spItems.length;
    const spPct   = spTotal > 0 ? Math.round((spDone / spTotal) * 100) : 0;
    const spLabel = (sp.label && sp.label !== sp.id) ? `${sp.id} · ${sp.label}` : (sp.id || '');
    return { sp, spItems, spDone, spTotal, spPct, spLabel };
  } catch(e) {
    return { sp: null, spItems: [], spDone: 0, spTotal: 0, spPct: 0, spLabel: '' };
  }
}

// T-086 / T-202604-181: Barra de estado sobre el grid
// T-202605-118: dirty flag — render quirúrgico
let _statusBarDirty = false;
export function _markStatusBarDirty() { _statusBarDirty = true; }

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
            switchTab('sprint');
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
  const gfSyncEl   = document.getElementById('gf-sync');
  if (gfSyncEl) gfSyncEl.classList.remove('is-hidden');

  const _items = (typeof getItems() !== 'undefined' ? getItems() : []);

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

  // T-[tmp:tkt-layout-zonas]: badge de versión en zona de identidad — AC2: fallback '—' si _effectiveVersion() no retorna valor
  if (gfVersion) {
    const _v = _effectiveVersion();
    gfVersion.textContent = _v ? _v : '—';
    gfVersion.classList.remove('is-hidden');
  }

  if (gfTotal || gfDone) {
    // B-202606-027: alinear criterio con renderStats() en locus-backlog-core.js
    // excluir done sin sprint (Q-Backlog/Q-DISC Gen2) y done en sprints cerrados — mismo criterio que stats-bar del backlog
    const _closedSprintIds = new Set(
      (typeof getActiveSprints !== 'undefined' ? getActiveSprints() : [])
        .filter(s => s.status === 'closed').map(s => s.id)
    );
    const _isInClosedSprint = i => i.sprint && _closedSprintIds.has(i.sprint);
    const total = _items.filter(i => _isCountableItem(i) && !_isInClosedSprint(i) && i.status !== 'descartado' && i.status !== 'historico').length;
    const done  = _items.filter(i => _isCountableItem(i) && i.status === 'done' && !_isInClosedSprint(i) && i.sprint).length;
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
  window.dispatchEvent(new CustomEvent('shell:mark-tracker-dirty'));
  window.dispatchEvent(new CustomEvent('shell:render-tracker'));
}

// hasRecentSession — fuente de verdad: locus-notifications.js
// B-202605-012: definición eliminada de este archivo para resolver duplicación.
// Call sites existentes consumen la función de locus-notifications.js (carga antes).

// T-[tmp:t-listeners-storage-render]: listeners shell:* — desacoplamiento de locus-storage.js
// locus-storage.js despacha shell:mark-statusbar-dirty + shell:render-statusbar + shell:update-stats
// en lugar de llamar directamente a las funciones de este módulo
window.addEventListener('shell:mark-statusbar-dirty', () => { _markStatusBarDirty(); });
window.addEventListener('shell:render-statusbar', () => { renderStatusBar(); });
window.addEventListener('shell:update-stats', () => { updateStats(); });
