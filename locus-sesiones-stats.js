// [PP] mod:25 · autor:Rune · 2026-07-14 UTC-6
// INC-[pendiente-ID] (deprecación Sesiones/Pulso, founder confirmó): eliminado wiring del
// dot #gf-pulso del footer (import openPulsoPanel + bloque gfPulso en _updateHeaderProjectLabel
// o función equivalente de footer) — Pulso deprecado. gfProyecto/gfVersion/gfCkpt/gfSyncEl
// no tocados — responsabilidad mixta de este archivo, solo se removió la porción de Pulso.
// locus-sesiones-stats.js
// Responsabilidad: Stats globales, status bar, breadcrumb de proyecto, helpers de Workers
//   (hasRecentSession, _isInSession, toggleCollapseAll, navigateToCard).
// TKT-202606-005: segmentos sprint/ítem del breadcrumb eliminados — #breadcrumb-sprint
//   y #breadcrumb-item no existen en el DOM (index.html solo declara #breadcrumb-proj).

import { getItems, getIncidents, itemKind } from './locus-backlog-core.js';
// REQ-[pendiente-ID] TKT1: _getFooterAlert() consume _zoneStaleness (mismo umbral que Q-DISC/
// Q-Backlog, ya validado en producción) y los accessors ITIL canónicos camelCase/snake_case.
import { _zoneStaleness } from './locus-backlog-zone-engine.js';
import { incSlaPriority, incIncidentStatus } from './locus-inc-fields.js';
// selectTrackerAI y _markTrackerDirty desacoplados vía shell:* events (T-202606-084)
import { openDetail } from './locus-session-popup.js';
// T-202606-166: _getActiveProjectFilter y getProjectById movidas a locus-storage.js
import { _effectiveVersion, _getActiveProjectFilter, _isInSession, getAISessions, getActiveProject, getActiveTracker, getAllSessions, getProjectById, save } from './locus-storage.js';

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
    const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
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
      const t = itemKind(i);
      return i.sprint && i.sprint.startsWith(sp.id) &&
        (t === 'REQ' || t === 'TKT') &&
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

// REQ-[pendiente-ID] TKT1 — alerta de salud del proyecto activo para #gf-ckpt.
// AC-1 (happy path INC): INC con sla_priority:high, incident_status no en (closed,descartado)
//   y slaDeadline vencido → { type:'inc', text, targetTab:'incidentes' }.
// AC-2 (happy path sprint): sin alerta INC, sprint activo con >=40% de sus REQ/TKT en
//   en-revision/en-proceso → { type:'sprint', text, targetTab:'sprint' }.
// AC-3 (happy path backlog): sin alerta INC ni sprint, hay al menos un REQ/TKT/DISC sin sprint
//   con _zoneStaleness() != null → { type:'backlog', text, targetTab:'backlog' }.
// AC-4 (estado vacío): ninguna condición activa → null — el caller aplica su propio fallback.
// AC-5 (error): cualquier excepción interna → null, nunca propaga al caller.
// no_incluye: no evalúa DOC-UPDATE vencido (requiere timestamp en docUpdateIndex, no existe
//   hoy — registrado como DISC aparte) · no evalúa las señales de burndown ascendente ni
//   "REQ sin done en 2+ sesiones" de sprint en riesgo (requieren historial de sesiones por
//   REQ, fuera de este TKT) · no dispara notificación ni sonido, solo texto del footer.
export function _getFooterAlert() {
  try {
    const incs = (typeof getIncidents === 'function' ? getIncidents() : []) || [];
    const incAlert = incs.find(i => {
      const st = incIncidentStatus(i);
      if (st === 'closed' || st === 'descartado') return false;
      if (incSlaPriority(i) !== 'high') return false;
      return typeof i.slaDeadline === 'number' && Date.now() >= i.slaDeadline;
    });
    if (incAlert) {
      const hrsVencido = Math.floor((Date.now() - incAlert.slaDeadline) / 3600000);
      const titulo = (incAlert.title || incAlert.titulo || '').slice(0, 32);
      return { type: 'inc', text: `${incAlert.code || 'INC'} vencido ${hrsVencido}h — ${titulo}`, targetTab: 'incidentes' };
    }

    const { spItems, spTotal } = _getActiveSprintStats();
    if (spTotal > 0) {
      const enRev = spItems.filter(i => i.status === 'en-revision' || i.status === 'en-proceso').length;
      const pct = enRev / spTotal;
      if (pct >= 0.4) {
        return { type: 'sprint', text: `Sprint en riesgo — ${Math.round(pct * 100)}% en en-revisión`, targetTab: 'sprint' };
      }
    }

    const stale = (typeof getItems === 'function' ? getItems() : []).filter(i =>
      !i.sprint && i.status !== 'descartado' && i.status !== 'historico' && _zoneStaleness(i)
    );
    if (stale.length > 0) {
      const discCount  = stale.filter(i => itemKind(i) === 'DISC').length;
      const otherCount = stale.length - discCount;
      const text = discCount && otherCount
        ? `${stale.length} ítems vencidos en Q-DISC/Q-Backlog`
        : discCount
        ? `${discCount} DISC sin grooming +30d`
        : `${otherCount} ítems sin mover +14d en Q-Backlog`;
      return { type: 'backlog', text, targetTab: 'backlog' };
    }

    return null;
  } catch (e) {
    return null;
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
  const gfCkpt     = document.getElementById('gf-ckpt');
  const gfSyncEl   = document.getElementById('gf-sync');
  if (gfSyncEl) gfSyncEl.classList.remove('is-hidden');

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

  if (gfCkpt) {
    try {
      // REQ-[pendiente-ID] TKT3: limpiar clases de estado de un render previo antes de decidir
      gfCkpt.classList.remove('gf-ckpt--alert-inc', 'gf-ckpt--alert-sprint', 'gf-ckpt--alert-backlog', 'gf-ckpt--link');
      gfCkpt.onclick = null;

      const alert = _getFooterAlert();
      if (alert) {
        gfCkpt.textContent = alert.text;
        gfCkpt.classList.remove('is-hidden');
        gfCkpt.classList.add('gf-ckpt--alert-' + alert.type);
        gfCkpt.onclick = function() { switchTab(alert.targetTab); };
        return;
      }

      const allSess = getAllSessions().slice().sort((a, b) => {
        const ta = a.timestamp || a.endTime || a.startTime || 0;
        const tb = b.timestamp || b.endTime || b.startTime || 0;
        return tb - ta;
      });
      const lastSess = allSess[0] || null;
      if (lastSess) {
        const nextStep = lastSess.proximoPaso || '';
        const texto = nextStep ? nextStep.slice(0, 32) : ((lastSess.title || lastSess.nombre || '').slice(0, 28) || '—');
        gfCkpt.textContent = (nextStep ? '→ ' : '⏱ ') + texto;
        gfCkpt.classList.remove('is-hidden');
        gfCkpt.classList.add('gf-ckpt--link');
        gfCkpt.onclick = function() {
          openDetail(lastSess.aiId, lastSess.id);
        };
      } else {
        gfCkpt.classList.add('is-hidden');
      }
    } catch(e) { gfCkpt.classList.add('is-hidden'); }
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
