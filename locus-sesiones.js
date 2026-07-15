// [PP] mod:47 · autor:Rune · 2026-07-14 20:40 UTC-6
// INC-[pendiente-ID]: avatarEl.textContent → innerHTML en _populateWorkerHeader() (L836) —
// ai.avatar es markup SVG; con textContent se pintaba como texto crudo (path data visible
// en pantalla, ver captura del founder). Mismo patrón ya usado en #pop-avatar.
// [PP] mod:41 · autor:Rune · 2026-07-14 UTC-6
// CAEL-12 (REQ CAEL-10): buildCard()/#grid retirados — código muerto desde CAEL-08 (#grid no
// existe en el DOM). _populateWorkerHeader() reemplaza avatar/nombre/badge/menú de acciones sobre
// .worker-header (CAEL-11). Reasigna dotmenu-${id}/dotmenu-wrap-${id}/cd-${id}/name-${id} para que
// toggleCardMenu/closeCardMenu (locus-workers.js) y el interval de reset (locus-sesiones-utils.js)
// sigan funcionando sin cambios — cero wiring nuevo en esos módulos. Impacto lateral fuera de este
// archivo (dead refs a #card-${id} en locus-command-palette.js, locus-sesiones-capture.js,
// locus-session-save.js, locus-ui-shell.js, locus-workers.js, locus-sesiones-stats.js) registrado
// como DISC en el CHECKPOINT — no tocado aquí (fuera del archivo declarado en CAEL-12).
// locus-sesiones.js
// Última actualización: 2026-06-06 · T-202606-058: Romper ciclo locus-sesiones ↔ locus-sprint-project
// Módulo: Tab Sesiones — render, cards de IAs, session list, log card, detail panel, mini-hist,
//   sidebar ticker, auto-download preference.
// Requiere: locus-storage.js, locus-toast.js, locus-tracker-utils.js cargados ANTES en index.html
// Timer · suggestion · weekly summary → locus-tracker-utils.js
// normStatus · buildTGPreview · STATUS_LABELS · TG_PARSER_CONFIG → locus-session-parse.js

import { updateTabNotifBadges, _computeNotifications, _notifReadSet, _notifGoto } from './locus-notifications.js';
import { _initRadarSidebarState, renderGlobalRadarSidebar, toggleRadarSidebar } from './locus-radar.js';
import { _scrollToCard, _updateHeaderProjectLabel, navigateToCard, renderStatusBar, updateStats, _hasStaleSuggestion } from './locus-sesiones-stats.js';
import { renderSuggestionBanner, startSessionTimer, _buildSuggestionReason, _sessRelTsShared, _cscardRelTs, _hoyMsUntilReset, getCD } from './locus-sesiones-utils.js';
import { fmt12, confirmSave, interpretHora, relDate } from './locus-session-hora.js';
import { openCorrectHora } from './locus-sesiones-viz.js'; // T-202606-089 AC-3 — ciclo seguro: uso solo dentro de handlers
import { closeLogCard, closePopup, openDetail, startRename, toggleInReview, toggleShowAll } from './locus-session-popup.js'; // T-202606-089 AC-3
// T-202606-058: import de locus-sprint-project eliminado — ciclo A↔B roto.
// _getActiveProjectFilter · getProjectById · openProjModal · selectProjectFilter
// consumidas via _sesSPCallbacks registry (registradas por locus-sprint-project en DOMContentLoaded).
import { getActiveProject, getActiveTracker, getAllSessions, getAI, getAISessions, getLastAISession, _findSession, save, getState, saveImmediate, _getCurrentSession, _isInSession, _resetWorker, getActiveSprints } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';
import { esc } from './locus-ui-shell.js';
import { archiveAI, closeCardMenu, confirmClear, deleteAI, openAddAI, openAvatarModal, toggleArchivedSection, toggleCardMenu } from './locus-workers.js';

import { downloadReport } from './locus-reports.js';

import { openQuickCapture, confirmInterruptInline, dismissInterrupted } from './locus-sesiones-capture.js'; // T-202606-089 AC-3

import { STATUS_LABELS, handlePaste, handleInput } from './locus-session-parse.js';
// T-202606-058: registry extraído a locus-sesiones-registry.js (módulo sin dependencias).
// locus-sprint-project importa _registerSesSPCallback desde registry — no desde aquí.
import { _sesSPCallbacks } from './locus-sesiones-registry.js';

let _trackerSelectedId = null;
// shell:sesiones-render — listener en window per B-202606-021
window.addEventListener('shell:sesiones-render', () => { _markTrackerDirty(); render(); });
// ── END T-202606-058 ─────────────────────────────────────────────────────────

// TKT3b: severidad de notificación — mismo mapa que _notifHistoryAdd en locus-notifications.js
const _TVH_SEVERITY_RANK = { warn: 2, ok: 1, info: 0 };
const _TVH_SEVERITY_MAP  = { incHigh: 'warn', sprintLow: 'warn', unblocked: 'ok', sprintOrphans: 'warn' };

// TKT3b: teaser de notificación en tracker-view-header — reusa el motor de locus-notifications.js
function _renderNotifTeaser() {
  const teaser = document.getElementById('tvh-notif-teaser');
  if (!teaser) return;

  const all    = _computeNotifications();
  const read   = _notifReadSet();
  const unseen = all.filter(function(n) { return !read.has(n.id); });

  if (!unseen.length) {
    teaser.classList.add('is-hidden');
    return;
  }

  // AC: mayor severidad primero, empate por ts más reciente
  const sorted = unseen.slice().sort(function(a, b) {
    const rankA = _TVH_SEVERITY_RANK[_TVH_SEVERITY_MAP[a.type] || 'info'];
    const rankB = _TVH_SEVERITY_RANK[_TVH_SEVERITY_MAP[b.type] || 'info'];
    if (rankB !== rankA) return rankB - rankA;
    return (b.ts || 0) - (a.ts || 0);
  });
  const top = sorted[0];

  const iconEl  = document.getElementById('tvh-notif-icon');
  const titleEl = document.getElementById('tvh-notif-title');
  const bodyEl  = document.getElementById('tvh-notif-body');
  if (iconEl)  iconEl.textContent  = top.icon || '';
  if (titleEl) titleEl.textContent = top.title || '';
  if (bodyEl)  bodyEl.textContent  = top.body || '';

  teaser.dataset.notifId = top.id;
  const count = unseen.length;
  const viewAllBtn = document.getElementById('tvh-notif-viewall');
  if (viewAllBtn) viewAllBtn.textContent = 'Ver todas (' + count + ')';

  teaser.classList.remove('is-hidden');
}

window.addEventListener('shell:update-notif-badges', _renderNotifTeaser);

document.addEventListener('DOMContentLoaded', function() {
  const teaser = document.getElementById('tvh-notif-teaser');
  if (teaser) {
    teaser.addEventListener('click', function(e) {
      if (e.target.closest('#tvh-notif-viewall')) {
        e.stopPropagation();
        const sidebar = document.getElementById('global-radar-sidebar');
        if (sidebar && sidebar.classList.contains('collapsed')) toggleRadarSidebar();
        return;
      }
      const id = teaser.dataset.notifId;
      if (id) _notifGoto(id);
    });
  }
  _renderNotifTeaser();
});


// T-202606-086: re-export para preservar compatibilidad — implementaciones movidas a locus-sesiones-utils.js
export { _sessRelTsShared, _cscardRelTs } from './locus-sesiones-utils.js';
// ── END R-202605-162 helper ──────────────────────────────────────────────

// Helper: hora fija por grupo — mini historial
// hoy   → 'HH:MM'
// ayer  → 'HH:MM'  (sección ya dice "Ayer")
// semana→ 'lun · HH:MM'
// anteriores → '10 may'
function _sessFixedTs(s, group) {
  const ts = s.createdAt || s.date && new Date(s.date).getTime() || 0; // B-202605-067: createdAt como fuente — refleja ocurrencia, no edición. Fallback a s.date
  if (!ts) return (s.dateShort || '—'); // B-[pendiente-ID]: fallback '—' cuando no hay timestamp ni dateShort
  try {
    if (group === 'hoy' || group === 'ayer') {
      return new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (group === 'semana') {
      const dow  = new Date(ts).toLocaleDateString('es', { weekday: 'short' });
      const hhmm = new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${dow} · ${hhmm}`;
    }
    return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  } catch(_) {
    return (s.dateShort || '—'); // B-[pendiente-ID]: fallback '—' en catch
  }
}

// ── R-202604-078 Fase 2: Mini-historial de IA en Col2 (modo Por IA) ─────
// T-[pendiente-ID]: refactorizado — sesión en curso integrada como grupo 'ahora' al tope (AC-2..AC-9)

// Render Col2 en modo Por IA: lista unificada — sesión en curso + historial agrupado
function _trackerRenderMiniHist(aiId) {
  const listEl  = document.getElementById('tracker-mini-hist-list');
  const titleEl = document.getElementById('tracker-mini-hist-title');
  if (!listEl) return;

  if (!aiId) {
    // T-202605-470: sin IA — título neutral
    if (titleEl) titleEl.textContent = 'Sesiones';
    const lastMetaEl = document.getElementById('tracker-mini-hist-last');
    if (lastMetaEl) lastMetaEl.textContent = '';
    listEl.innerHTML = '<div class="tracker-mini-hist-empty">Selecciona una IA</div>';
    return;
  }

  const allSessions = getAllSessions();
  // B-[pendiente-ID]: guard aiId — evita que s.aiId===null pase el filtro cuando aiId es null
  const aiSessions = aiId ? allSessions.filter(s => s.aiId === aiId) : [];

  // AC-9: excluir sesión en curso de pastSessions — se construye desde currentSess directamente
  const currentSess  = _getCurrentSession(aiId);
  const pastSessions = currentSess
    ? aiSessions.filter(s => s.id !== currentSess.id)
    : aiSessions;

  // R-202605-116 AC: filtro de proyecto — usa proyecto activo (getActiveProject)
  const _activeProjMH = getActiveProject();
  const projFilter = _activeProjMH ? _activeProjMH.id : null;
  const filtered = projFilter
    ? pastSessions.filter(s => s.projectId === projFilter)
    : pastSessions;

  // más reciente primero — sort explícito por createdAt descendente, con fallback a s.date
  // B-[pendiente-ID]: createdAt ausente en algunas sesiones causaba ts=0 y orden incorrecto
  const _sortTs = (s) => s.createdAt || (s.date && new Date(s.date).getTime()) || 0;
  const sorted = [...filtered].sort((a, b) => _sortTs(b) - _sortTs(a));

  // AC-4: conteo total incluye sesión en curso
  const totalCount = aiSessions.length;
  if (titleEl) {
    titleEl.textContent = `${totalCount} ${totalCount !== 1 ? 'sesiones' : 'sesión'}`;
  }
  const lastMetaEl = document.getElementById('tracker-mini-hist-last');
  if (lastMetaEl) {
    // T-202606-078: semántica de label según estado de sesión — reutiliza _cscardRelTs (no introduce tercer formato de tiempo relativo)
    if (currentSess) {
      // Happy path — sesión en curso: 'En curso · hace X minuto(s)/hora(s)'
      lastMetaEl.textContent = 'En curso · ' + _cscardRelTs(currentSess.createdAt);
    } else if (sorted.length) {
      // Happy path — sin sesión en curso: 'Último: hace X' usando la más reciente del historial filtrado (sorted[0])
      lastMetaEl.textContent = 'Último: ' + _cscardRelTs(sorted[0].createdAt);
    } else {
      // Estado de error — sin sesión en curso y sin historial: vacío, sin placeholder
      lastMetaEl.textContent = '';
    }
  }

  // AC-6: sin contenido en absoluto — empty state
  if (!currentSess && !sorted.length) {
    const emptyMsg = projFilter
      ? 'Sin checkpoints para este filtro'
      : (aiSessions.length === 0
          ? 'Sin sesiones registradas'
          : 'Sin sesiones anteriores');
    listEl.innerHTML = `<div class="tracker-mini-hist-empty">${emptyMsg}</div>`;
    return;
  }

  // R-202605-162: usa helper compartido — _sessRelTsShared definida antes de esta función
  const _sessRelTs = _sessRelTsShared;

  // Agrupar historial en Hoy / Ayer / Últimos 7 días / Anteriores
  const _localDateKey = (d) => {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const _todayKey  = _localDateKey(new Date());
  const _ydDate    = new Date(); _ydDate.setDate(_ydDate.getDate() - 1);
  const _yesterKey = _localDateKey(_ydDate);
  const _7dDate    = new Date(); _7dDate.setDate(_7dDate.getDate() - 7);
  const _7dKey     = _localDateKey(_7dDate); // B-202605-068: criterio dateKey local
  const _sessGroup = (s) => {
    const ts = s.createdAt || 0;
    if (!ts) return 'anteriores';
    const dateKey = _localDateKey(new Date(ts));
    if (dateKey === _todayKey)  return 'hoy';
    if (dateKey === _yesterKey) return 'ayer';
    if (dateKey >= _7dKey)      return 'semana'; // B-202605-068: >= incluye día exacto -7
    return 'anteriores';
  };
  const _groupLabel = { hoy: 'Hoy', ayer: 'Ayer', semana: 'Últimos 7 días', anteriores: 'Anteriores' };
  const _groupOrder = ['hoy', 'ayer', 'semana', 'anteriores'];

  const _grouped = { hoy: [], ayer: [], semana: [], anteriores: [] };
  sorted.forEach(s => _grouped[_sessGroup(s)].push(s));

  // T-202606-013: _renderRow — jerarquía 3 líneas según AC
  // Línea 1: sprint badge + título truncado + timestamp
  // Línea 2: summary truncado 1 línea — omitido si vacío
  // Línea 3: refs coloreadas + badge doc-update + rol pill con margin-left:auto
  const _activeSprintId = (getActiveSprints().find(sp => sp.status === 'active') || {}).id || null;

  const _renderRow = (s, group, isInProgress) => {
    const isActive = s.id === _trackerHistSelectedSessId;

    // Línea 1: sprint badge + título truncado a 1 línea + timestamp alineado a la derecha
    const sprintId = s.sprintId || '';
    const sprintBadgeHtml = sprintId
      ? (() => {
          const isActiveSprint = _activeSprintId && sprintId === _activeSprintId;
          const cls = isActiveSprint ? 'mh-sprint active-sprint' : 'mh-sprint';
          return `<span class="${cls}">${esc(sprintId)}</span>`;
        })()
      : '';
    const tsHtml = isInProgress
      ? `<span class="mh-row-badge-live">en curso</span>`
      : (() => { const fixedTs = _sessFixedTs(s, group); return fixedTs ? `<span class="mh-row-ts">${fixedTs}</span>` : ''; })();
    const titleHtml = `<div class="mh-row-title" title="${esc(s.title)}">${esc(s.title)}</div>`;
    const line1Html = `<div class="tracker-mini-hist-row-top">${sprintBadgeHtml}${titleHtml}${tsHtml}</div>`;

    // Línea 2: summary truncado a 1 línea — omitido si vacío, sin reservar espacio
    const summaryHtml = s.summary
      ? `<div class="mh-row-summary">${esc(s.summary)}</div>`
      : '';

    // Línea 3: refs coloreadas + badge doc-update + rol pill con margin-left:auto
    const refs = s.trackerRefs || [];
    const visibleRefs = refs.slice(0, 3);
    const extraCount  = refs.length - visibleRefs.length;
    const refTagsHtml = visibleRefs.map(code => {
      const t = _codeKind(code);
      const typeClass = t ? `mh-ref-tag--${t.toLowerCase()}` : '';
      return `<span class="mh-ref-tag ${typeClass}">${esc(code)}</span>`;
    }).join('');
    const refMoreHtml = extraCount > 0
      ? `<span class="mh-ref-more" title="${esc(refs.slice(3).join(', '))}">+${extraCount}</span>`
      : '';
    const refsHtml = (refTagsHtml || refMoreHtml)
      ? `<span class="mh-row-refs">${refTagsHtml}${refMoreHtml}</span>`
      : '';
    const docUpdateHtml = s.hasDocUpdates
      ? `<span class="mh-badge-docupdate">doc-update</span>`
      : '';
    const rolHtml = s.rol
      ? `<span class="mh-row-rol">${esc(s.rol)}</span>`
      : '';
    const metaHtml = (refsHtml || docUpdateHtml || rolHtml)
      ? `<div class="mh-row-meta">${refsHtml}${docUpdateHtml}${rolHtml}</div>`
      : '';

    const rowCls = [
      'tracker-mini-hist-row',
      'sess-row',
      isActive     ? 'active'              : '',
      isInProgress ? 'mh-row--in-progress' : ''
    ].filter(Boolean).join(' ');

    return `<div class="${rowCls}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        data-action="mini-hist-select">
      ${line1Html}
      ${summaryHtml}
      ${metaHtml}
    </div>`;
  };
  // ── END T-202606-013 ──

  // AC-2: grupo 'ahora' al tope si hay sesión en curso — AC-5: omitido si no hay sesión en curso
  const ahoraHtml = currentSess
    ? `<div class="sess-group-sep">Ahora</div>` + _renderRow(currentSess, 'hoy', true)
    : '';

  // Grupos temporales del historial — T-202606-082: conteo inline 'Hoy · N'
  const histHtml = _groupOrder
    .filter(g => _grouped[g].length > 0)
    .map(g =>
      `<div class="sess-group-sep">${_groupLabel[g]} · ${_grouped[g].length}</div>` +
      _grouped[g].map(s => _renderRow(s, g, false)).join('')
    ).join('');

  listEl.innerHTML = ahoraHtml + histHtml;

  // T-202606-077: auto-select eliminado — Col3 solo se abre por selección explícita del founder.
  // Si _trackerHistSelectedSessId tiene valor, restaurar clase active en el row correspondiente.
  if (_trackerHistSelectedSessId) {
    const prevRow = listEl.querySelector(`.tracker-mini-hist-row[data-sess-id="${_trackerHistSelectedSessId}"]`);
    if (prevRow) {
      prevRow.classList.add('active');
      openDetail(prevRow.dataset.aiId, _trackerHistSelectedSessId);
    } else {
      // AC estado de error — sesión previa ya no existe en el listado
      _trackerHistSelectedSessId = null;
    }
  }

  // T-202605-471: scroll al row activo — solo si hay row activo
  requestAnimationFrame(() => {
    const activeRow = listEl.querySelector('.tracker-mini-hist-row.active');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

// Seleccionar sesión desde mini-hist (Col2 modo Por IA) → Col3 preview
function _trackerMiniHistSelect(sessId, aiId) {
  // AC-5 (T-202606-052): toggle si misma fila ya seleccionada
  if (_trackerHistSelectedSessId === sessId) {
    _trackerHistSelectedSessId = null;
    document.querySelectorAll('.tracker-mini-hist-row').forEach(r => r.classList.remove('active'));
    _trackerClosePreview();
    return;
  }

  _trackerHistSelectedSessId = sessId;

  // resaltar en Col2
  document.querySelectorAll('.tracker-mini-hist-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // Col3: openDetail como único renderer (T1-T3 openDetail Col3)
  openDetail(aiId, sessId);

}

// ── T-202606-052: Col3 preview de sesión ─────────────────────────────────

// B-202606-036: _trackerOpenPreview y _escHtml eliminadas — render de Col3 unificado en
// openDetail (locus-session-popup.js) desde R-202606-008. _trackerOpenPreview: 0 call sites
// confirmados. _escHtml: único consumidor era _trackerOpenPreview, huérfana como consecuencia.

// Cierra el panel Col3 preview
function _trackerClosePreview() {
  const tabEl   = document.getElementById('tab-sesiones');
  const innerEl = document.getElementById('tracker-preview-inner');
  tabEl?.classList.remove('preview-open');
  if (innerEl) {
    innerEl.classList.remove('d-flex');
    innerEl.classList.add('is-hidden');
  }
}

// ── END T-202606-052 ─────────────────────────────────────────────────────

// ── END R-202604-078 Fase 2 ──────────────────────────────────────────────

// ── T-202606-050: Col 2 — lista unificada (sesión en curso + historial) ──
// Refactorizado: ckpt-section y divider permanecen con is-hidden permanente (AC-1).
// _trackerRenderMiniHist gestiona toda la col 2 incluyendo sesión en curso (AC-2..AC-9).
function _trackerRenderCol2(aiId) {
  const miniHist  = document.getElementById('tracker-mini-hist');
  const col2Empty = document.getElementById('tracker-col2-empty');
  if (!miniHist) return;

  // AC-1: ckpt-section y divider permanecen ocultos — sin lógica de toggle
  const ckptSection = document.getElementById('tracker-ckpt-section');
  const divider     = document.getElementById('tracker-col2-divider');
  if (ckptSection) ckptSection.classList.add('is-hidden');
  if (divider)     divider.classList.add('is-hidden');

  // Determinar si hay contenido para mostrar (sesión en curso + historial)
  const currentSess = aiId ? _getCurrentSession(aiId) : null;
  const allSessions = getAllSessions();
  const aiSessions  = aiId ? allSessions.filter(s => s.aiId === aiId) : [];
  const _activeProjMH = getActiveProject();
  const projFilter  = _activeProjMH ? _activeProjMH.id : null;
  const pastSessions = currentSess
    ? aiSessions.filter(s => s.id !== currentSess.id)
    : aiSessions;
  const filtered = projFilter ? pastSessions.filter(s => s.projectId === projFilter) : pastSessions;
  const hasContent = !!currentSess || filtered.length > 0;

  if (!hasContent) {
    miniHist.classList.add('is-hidden');
    if (col2Empty) col2Empty.classList.remove('is-hidden');
    return;
  }

  if (col2Empty) col2Empty.classList.add('is-hidden');
  miniHist.classList.remove('is-hidden');
  _trackerRenderMiniHist(aiId);
}
// ── END T-202606-050 ─────────────────────────────────────────────────────────

// ── R-202605-116: Card sesión en curso — col 1, debajo del card IA ──────
// T-202605-082: _getCurrentSession y _getCurrentCheckpoint movidas a locus-storage.js como fuente canónica.
// Importadas en L19. Disponibles directamente sin typeof guard.

function _buildCurrentSessionCard(aiId) {
  const currentSess = _getCurrentSession(aiId);
  if (!currentSess) return null;

  const allSess   = getAllSessions();
  const aiSess    = allSess.filter(s => s.aiId === aiId);
  const sessIndex = aiSess.findIndex(s => s.id === currentSess.id);

  const continuousSess = [];
  for (let i = sessIndex; i >= 0; i--) {
    const s = aiSess[i];
    if (s.quickCapture) break;
    if (s.resetAt && i < sessIndex) break;
    continuousSess.push(s);
  }
  const shown = continuousSess.slice(0, 3);
  const total = continuousSess.length;

  const dateLabel = (currentSess.date)
    ? relDate(currentSess.date)
    : (currentSess.dateShort || '');

  const sessionRows = shown.map((s, idx) => {
    const isLatest = idx === 0;
    const summaryHtml = isLatest && s.summary
      ? `<div class="cscard-row-summary">${esc(s.summary.slice(0, 160))}${s.summary.length > 160 ? '…' : ''}</div>`
      : '';
    const refPills = (s.trackerRefs || []).slice(0, 4).map(code => {
      const t = _codeKind(code);
      return `<span class="cscard-ref-pill cscard-ref-pill--${t.toLowerCase()}">${esc(code)}</span>`;
    }).join('');
    const latestCls = isLatest ? ' cscard-row--latest' : '';
    return `<div class="cscard-row${latestCls}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        data-action="mini-hist-select">
      <div class="cscard-row-top">
        <span class="cscard-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <span class="cscard-row-date">${isLatest ? dateLabel : ''}</span>
      </div>
      ${summaryHtml}
      ${refPills ? `<div class="cscard-row-refs">${refPills}</div>` : ''}
    </div>`;
  }).join('');

  const moreHtml = total > 3
    ? `<div class="cscard-more">+ ${total - 3} checkpoint${total - 3 !== 1 ? 's' : ''} anteriores</div>`
    : '';

  const el = document.createElement('div');
  el.className = 'current-session-card';
  el.id = 'current-session-card-' + aiId;
  const _cscardTs = currentSess.updatedAt || currentSess.createdAt || 0;
  const _cscardInitLabel = _cscardTs ? _cscardRelTs(_cscardTs) : '';
  el.innerHTML = `
    <div class="cscard-header">
      <span class="cscard-dot"></span>
      <span class="cscard-label">Checkpoint en curso</span>
      <span class="cscard-timer" id="cscard-timer-${aiId}" data-ai-id="${aiId}" data-ts="${_cscardTs}">${_cscardInitLabel}</span>
    </div>
    <div class="cscard-rows">
      ${sessionRows}
      ${moreHtml}
    </div>`;

  return el;
}

// ── END R-202605-116 ─────────────────────────────────────────────────────

export function selectTrackerAI(aiId) {
  // T-202606-012 AC-1: si aiId ya es el activo, no hay cambio de selección — retornar sin tocar
  // _trackerHistSelectedSessId ni llamar a render()
  if (_trackerSelectedId === aiId) return;
  // DUP-05: cerrar preview de sesión al cambiar de Worker
  closePopup();
  // T-202606-012 AC-2: aiId distinto al activo — reset de _trackerHistSelectedSessId antes de render()
  // Fase 2: resetear sesión seleccionada al cambiar de IA — mini-hist auto-selecciona la más reciente
  _trackerHistSelectedSessId = null;
  _trackerSelectedId = aiId;
  closeLogCard();
  // R-202604-061 AC-5: try-catch defensivo — skeleton siempre se limpia
  try {
    _markTrackerDirty(); render();
    // R-202604-061 AC-06 / CAEL-12: fade-in ahora en .worker-header (buildCard/#card-${id} retirado)
    requestAnimationFrame(() => {
      const _newHeader = document.getElementById('worker-header');
      if (_newHeader) {
        _newHeader.classList.remove('detail-fade-in');
        void _newHeader.offsetWidth; // force reflow
        _newHeader.classList.add('detail-fade-in');
      }
    });
  } catch(e) {
    console.error('render() error in selectTrackerAI:', e);
  }
  _scrollToCard(aiId);
  // T-202605-446: iniciar/retomar cronómetro al seleccionar IA
  startSessionTimer(aiId);
  // R-202605-167: actualizar segmento 3 del breadcrumb al cambiar Worker seleccionado
  _updateHeaderProjectLabel();
}


// B-202605-082: dirty flag — evita renders redundantes sin cambio de estado
let _trackerDirty = false;
let _radarSbInited = false; // T5: variable de módulo — reemplaza window._radarSbInited
export function _markTrackerDirty() { _trackerDirty = true; }
export function render() {
  // B-202605-hoy: si hay workers pero emptyEl esta visible (estado pre-auth residual), forzar render
  if (!_trackerDirty) {
    const _emptyCheck = document.getElementById('tracker-detail-empty');
    if (_emptyCheck && !_emptyCheck.classList.contains('is-hidden') && getState().ais && getState().ais.length) {
      _trackerDirty = true;
    } else {
      return;
    }
  }
  _trackerDirty = false;
  const emptyEl = document.getElementById('tracker-detail-empty');
  const _headerEl = document.getElementById('worker-header');


  if (!getState().ais.length) {
    if (_headerEl) _headerEl.classList.add('is-hidden');
    // R-202605-178 AC: sin workers — único CTA
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); emptyEl.innerHTML = `
      <div class="empty-state-icon">🤖</div>
      <div class="empty-state-title">Agrega tu primer Worker</div>
      <div class="empty-state-hint">Los Workers son las IAs que usas. Empieza por crear uno para registrar tus sesiones.</div>
      <button class="empty-state-btn" data-action="openAddAI">＋ Nuevo Worker</button>`; }
    updateStats(); renderStatusBar(); return;
  }

  // R-202605-007 AC: con workers pero sin proyecto activo — solo CTA "Nuevo Proyecto"
  const _hasActiveProj = !!getActiveProject();
  if (!_hasActiveProj && (getState().projects || []).length === 0) {
    if (_headerEl) _headerEl.classList.add('is-hidden');
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); emptyEl.innerHTML = `
      <div class="empty-state-icon">🗂</div>
      <div class="empty-state-title">Sin proyecto activo</div>
      <div class="empty-state-hint">Crea un proyecto para empezar a registrar sesiones y gestionar tu backlog.</div>
      <div class="es-cta-row">
        <button class="empty-state-btn" data-action="openProjModal">＋ Nuevo Proyecto</button>
      </div>`; }
    updateStats(); renderStatusBar(); return;
  }

  // T-202606-XXX AC: auto-select prioriza in-session > disponible > agotada
  const allActive = getState().ais.filter(ai => !ai.archived);
  if (!_trackerSelectedId || !getState().ais.find(a => a.id === _trackerSelectedId)) {
    const preferred = allActive.find(a => a.status !== 'exhausted' && _isInSession(a))
      || allActive.find(a => a.status !== 'exhausted')
      || allActive[0];
    _trackerSelectedId = preferred ? preferred.id : null;
  }

  if (!_trackerSelectedId) {
    // CAEL-12: #grid retirado (CAEL-08) — buildCard()/archived-section aquí eran código muerto.
    // Lista de Workers archivados sin reemplazo — ver INC registrado (CAEL-10, no_incluye).
    const _wh = document.getElementById('worker-header');
    if (_wh) _wh.classList.add('is-hidden');
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); }
    updateStats(); renderStatusBar(); return;
  }

  if (emptyEl) emptyEl.classList.remove('visible');
  // B-202604-XXX: ocultar del flujo del DOM cuando hay IA seleccionada
  if (emptyEl) emptyEl.classList.add('is-hidden');

  // R-202604-060: aplicar color del proyecto activo como CSS custom property (CSS Purity — setProperty permitido)
  const _activeProjForColor = getActiveProject();
  if (_activeProjForColor && _activeProjForColor.color) {
    document.documentElement.style.setProperty('--proj-color', _activeProjForColor.color);
  } else {
    document.documentElement.style.removeProperty('--proj-color');
  }

  // CAEL-12: buildCard()/#grid retirados — .worker-header reemplaza avatar/nombre/badge/menú.
  // R-110: sort IN-SESSION → DISPONIBLE → AGOTADA (se conserva — determina cuál ai es la relevante
  // cuando _trackerSelectedId coincide con más de un candidato tras filtros de archivado).
  const _sortOrder = (ai) => {
    if (ai.status !== 'exhausted' && _isInSession(ai)) return 0;
    if (ai.status !== 'exhausted') return 1;
    return 2;
  };
  const aisToRender = [...getState().ais.filter(a => !a.archived)].sort((a, b) => _sortOrder(a) - _sortOrder(b));
  const ai = aisToRender.find(a => a.id === _trackerSelectedId) || getState().ais.find(a => a.id === _trackerSelectedId);
  if (ai) {
    _populateWorkerHeader(ai);
    // T-202606-050: csCard va en #tracker-ckpt-section (Col 2) — no en #grid (retirado)
    const existingCsCard = document.getElementById('current-session-card-' + ai.id);
    if (existingCsCard) existingCsCard.remove();
  }

  // T-202606-050: render Col 2 — #tracker-ckpt-section + #tracker-mini-hist + empty global
  _trackerRenderCol2(_trackerSelectedId);
  _trackerHistAttachDropTargets();
  updateStats();
  renderStatusBar();
  renderGlobalRadarSidebar();
  if (!_radarSbInited) { _radarSbInited = true; _initRadarSidebarState(); }
  // T-202605-447: actualizar banner de sesión sugerida tras cada render
  renderSuggestionBanner();
  // R-202605-008: checklist de setup eliminado — REQ-[pendiente-ID] TKT1
  // B-202605-508: actualizar badges de tabs al final de cada render
  updateTabNotifBadges();
}

// TKT0-gen2: deriva tipo Gen2 desde code o campo type — reemplaza code[0]
function _codeKind(codeOrItem) {
  if (!codeOrItem) return '';
  const code = typeof codeOrItem === 'string' ? codeOrItem : (codeOrItem.code || '');
  const type = typeof codeOrItem === 'object' ? (codeOrItem.type || '') : '';
  for (const t of ['REQ','TKT','INC','DISC','PRB','KE','CHG']) {
    if (type === t || code.startsWith(t + '-')) return t;
  }
  return '';
}

const TG_TYPE_NAMES = {DISC:'Discovery', TKT:'Ticket', REQ:'Requerimiento', INC:'Incidente', PRB:'Problem', KE:'Known Error', CHG:'Change'};

// T-202604-047: tiempo promedio entre sesiones consecutivas
function buildHoyCard(ai, idx = 0, opts = {}) {
  const isInterrupted = !!ai.interrupted;
  const isInSession   = !!opts.inSession;
  const statusClass = ai.status === 'exhausted' ? 'exhausted' : 'available';
  const cardClass = 'hoy-mini-card ' + statusClass + (isInterrupted ? ' interrupted-state' : '') + (isInSession ? ' in-session-state' : '');

  const aiSessions = getAISessions(ai.id);
  const checkpointTotal = aiSessions.length;
  const sessConHora = aiSessions.filter(s => s.resetAt && !s.quickCapture).length;
  const avgLabel2 = avgBetweenSessions(ai);
  const avgShort = avgLabel2 ? avgLabel2.replace(' entre sesiones','') : '—';

  const cd = ai.status === 'exhausted' ? getCD(ai.resetTime, ai.resetEpoch) : '';
  const resetLabel = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : '';

  // "disponible desde" — usa availableSince si existe, fallback a última sesión
  function _availableSinceLabel() {
    if (ai.availableSince) {
      const epoch = new Date(ai.availableSince);
      const hh = String(epoch.getHours()).padStart(2,'0');
      const mm = String(epoch.getMinutes()).padStart(2,'0');
      return fmt12(`${hh}:${mm}`);
    }
    const last = aiSessions.length ? aiSessions[aiSessions.length - 1] : null;
    if (last && last.date) {
      const d = new Date(last.date);
      if (!isNaN(d)) {
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        return fmt12(`${hh}:${mm}`);
      }
    }
    return null;
  }

  const availSince = ai.status === 'available' ? _availableSinceLabel() : null;

  const statsBar = ai.status === 'exhausted'
    ? `<div class="hoy-mini-stats">
        <div class="hoy-mini-stat exhausted-cell">
          <div>
            <div class="hoy-exh-countdown">${cd || '--:--:--'}</div>
            <div class="hoy-exh-reset-label">${resetLabel || 'sin hora'}</div>
          </div>
        </div>
      </div>`
    : `<button class="hoy-mini-ckpt-full" data-action="navigate-to-card" data-ai-id="${ai.id}">>
        + checkpoint
        <span class="hoy-mini-ckpt-since">${availSince ? `desde ${availSince}` : 'disponible'}</span>
      </button>`;

  // T-316: badge diferenciado — ámbar para interrupted, púrpura para in-session
  const statusBadge = isInterrupted
    ? `<div class="hoy-mini-actions"><span class="hoy-mini-badge hoy-mini-badge--interrupted">⚡ Interrumpida</span></div>`
    : isInSession
      ? `<div class="hoy-mini-actions"><span class="hoy-mini-badge hoy-mini-badge--insession">● En sesión</span></div>`
      : '';

  // T-316: pill de proyecto de la última sesión global (sin filtro de proyecto activo)
  const _lastSessGlobal = getAllSessions().filter(s => s.aiId === ai.id).slice(-1)[0] || null;
  const _lastProjGlobal = _lastSessGlobal ? (_sesSPCallbacks.getProjectById || (() => undefined))(_lastSessGlobal.projectId) : null;
  const projPill = _lastProjGlobal
    ? `<span class="hoy-mini-proj-pill" title="${esc(_lastProjGlobal.name)}">${esc(_lastProjGlobal.icon || '📁')} ${esc(_lastProjGlobal.name)}</span>`
    : '';

  // quick button only for available/interrupted, not exhausted
  const quickBtn = (ai.status !== 'exhausted')
    ? `<button class="btn-quick" data-action="open-quick-capture" data-ai-id="${ai.id}" title="Sesión rápida">⚡</button>`
    : '';

  return `<div class="${cardClass}" data-hoy-ai-id="${ai.id}" data-anim-delay="${idx * 60}" data-action="navigate-to-card">>
    <div class="hoy-mini-strip">
      <div class="hoy-mini-name">${esc(ai.name)}</div>
      <div class="hoy-mini-right">
        ${quickBtn}
      </div>
    </div>
    ${statsBar}
    ${statusBadge}
    ${projPill ? `<div class="hoy-mini-proj-row">${projPill}</div>` : ''}
  </div>`;
}

function _hoyMarkExhausted(id) {
  // Marks an AI as exhausted from Tab Hoy — no reset time (user can set later)
  const ai = getAI(id);
  if (!ai) return;
  ai.status = 'exhausted';
  ai.resetTime = '';
  ai.resetEpoch = null;
  save();
  _markTrackerDirty(); render();
}

// ── Bloqueo ciego — agotar IA sin crear sesión ni log ──

function blindExhaustHoraInput(id) {
  const inp = document.getElementById('bexhaust-hora-' + id);
  const disp = document.getElementById('bexhaust-disp-' + id);
  const btn = document.getElementById('bexhaust-confirm-' + id);
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);
  if (disp) {
    disp.textContent = result ? result.label : (raw.length >= 3 ? 'hora inválida' : (raw.length ? '...' : '—'));
    disp.className = 'hora-parsed' + (result ? ' hora-disp--valid' : (raw.length >= 3 ? ' hora-disp--error' : ''));
  }
  if (btn) btn.disabled = !result;
}

function _resetHoraWidget(id) {
  const inp  = document.getElementById('bexhaust-hora-' + id);
  const disp = document.getElementById('bexhaust-disp-' + id);
  const btn  = document.getElementById('bexhaust-confirm-' + id);
  if (inp)  { inp.value = ''; inp.classList.remove('error'); }
  if (disp) { disp.textContent = '—'; disp.className = 'hora-parsed card-hora-disp'; }
  if (btn)  btn.disabled = true;
}

function blindExhaustHoraKey(event, id) {
  if (event.key === 'Escape') { event.preventDefault(); _resetHoraWidget(id); return; }
  if (event.key === 'Enter') { event.preventDefault(); confirmBlindExhaust(id); }
}

function confirmBlindExhaust(id) {
  const ai = getAI(id);
  if (!ai || ai.status !== 'available') return;
  const inp = document.getElementById('bexhaust-hora-' + id);
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);
  if (!result) {
    showToast('error', 'Hora inválida — ingresa formato HHMM (ej: 2100)');
    return;
  }
  ai.status = 'exhausted';
  ai.resetTime = result.hhmm;
  ai.resetEpoch = result.epoch;
  // AC: no crea sesión, no toca resetAt de sesiones existentes, no emite log
  _resetHoraWidget(id);
  saveImmediate().then(() => {
    _markTrackerDirty(); render();
  });
  showToast('info', `${ai.name} — agotada sin sesión · desbloqueo a las ${result.label}`);
}

export function avgBetweenSessions(ai) {
  const dated = getAISessions(ai.id)
    .map(s => new Date(s.date).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b);
  if (dated.length < 2) return null;
  let totalMs = 0;
  for (let i = 1; i < dated.length; i++) totalMs += dated[i] - dated[i - 1];
  const avgMs = totalMs / (dated.length - 1);
  const avgH = avgMs / 3600000;
  if (avgH < 24) return `~${Math.round(avgH)}h entre sesiones`;
  const d = Math.floor(avgH / 24);
  const h = Math.round(avgH % 24);
  return h > 0 ? `~${d}d ${h}h entre sesiones` : `~${d}d entre sesiones`;
}

// CAEL-12 (REQ CAEL-10): puebla .worker-header con el Worker seleccionado — reemplaza el
// avatar/nombre/badge/menú que antes armaba buildCard() dentro de #grid (retirado en CAEL-08).
// Reasigna dotmenu-${id}/cd-${id} porque toggleCardMenu/closeCardMenu (locus-workers.js:154,223)
// y el interval de countdown (locus-sesiones-utils.js:395) buscan esos ids por convención —
// cero wiring nuevo en esos módulos, solo mantener la convención de id sobre el nuevo contenedor.
function _populateWorkerHeader(ai) {
  const header = document.getElementById('worker-header');
  if (!header) return;
  header.classList.remove('is-hidden');

  const isInterrupted = !!ai.interrupted;
  const isInSession = !isInterrupted && _isInSession(ai);
  const isAvail = ai.status === 'available';
  const aiInitial = esc(ai.name).charAt(0).toUpperCase();

  // CAEL-03 (REQ CAEL-01): estado único del worker — misma prioridad ya usada arriba
  // (isInterrupted > isInSession > isAvail > exhausted) — fuente de verdad para
  // avatar, acento del header y badge, evitando que se desincronicen entre sí.
  const state = isInterrupted ? 'interrupted' : isInSession ? 'insession' : isAvail ? 'available' : 'exhausted';

  const avatarEl = document.getElementById('worker-header-avatar');
  if (avatarEl) {
    avatarEl.innerHTML = ai.avatar || aiInitial; // INC-[pendiente-ID]: textContent no renderizaba el SVG — corregido a innerHTML, mismo patrón que #pop-avatar (locus-workers.js:83)
    avatarEl.title = ai.name;
    avatarEl.dataset.aiId = ai.id;
    avatarEl.className = 'sc-avatar sc-avatar--' + state;
  }

  // is-hidden ya se removió arriba — no re-evaluar aquí.
  header.className = 'sc-header worker-header worker-header--' + state;

  // .sc-project (nombre) — id se reasigna a name-${id} (locus-session-popup.js:736 lo busca así),
  // por eso se localiza por clase estable dentro de #worker-header, no por el id (que muta).
  const nameEl = header.querySelector('.sc-project');
  if (nameEl) { nameEl.textContent = ai.name; nameEl.id = 'name-' + ai.id; }

  const badgeEl = document.getElementById('worker-header-badge');
  if (badgeEl) {
    badgeEl.className = 'sc-badge sc-badge--' + (state === 'exhausted' ? 'exhausted' : state === 'available' ? 'avail' : state);
    badgeEl.innerHTML = isInSession
      ? `<span class="sc-badge-dot"></span>${STATUS_LABELS.insession}`
      : STATUS_LABELS[state];
  }

  // Ícono de reset (legado) — se conserva sin cambio para interrupted/insession, fuera de
  // scope de CAEL-03. Para exhausted, ver bloque .worker-header-unlock más abajo — el pill
  // deja de usarse en ese estado (AC-1/CAEL-03).
  const resetIcon = header.querySelector('.worker-header-reset-icon');
  if (resetIcon) {
    resetIcon.dataset.aiId = ai.id;
    if (!isAvail && state !== 'exhausted') {
      resetIcon.classList.remove('is-hidden');
      resetIcon.id = 'cd-' + ai.id; // convención esperada por el interval de reset (locus-sesiones-utils.js:395) — sin conflicto: el interval ignora ais con status !== 'exhausted'
      const cdSpan = resetIcon.querySelector('span');
      const resetLabel = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : '';
      if (cdSpan) cdSpan.textContent = ai.resetTime ? '--:--:--' : '';
      resetIcon.title = ai.resetTime ? resetLabel : 'Sin hora de desbloqueo asignada';
    } else {
      resetIcon.classList.add('is-hidden');
      resetIcon.removeAttribute('id');
      resetIcon.id = 'worker-header-reset-icon';
    }
  }

  // CAEL-03 (REQ CAEL-01): countdown de agotado — bloque .worker-header-unlock (CSS: CAEL-02,
  // locus-sesiones.css:4397) inyectado solo en estado exhausted y removido del DOM al salir de
  // él, sin dejar el temporizador corriendo en segundo plano (AC-2/AC-3). El id cd-${id} vive en
  // .worker-header-unlock-value como nodo hoja — coincide con getElementById('cd-'+id).textContent
  // en locus-sesiones-utils.js:395 (a diferencia del patrón previo, que lo asignaba al contenedor).
  // Se inserta como HERMANO de #worker-header, no como hijo — #worker-header es .sc-header
  // (display:flex, fila), y .worker-header-unlock necesita renderizar como fila completa aparte
  // con su propio border-top, igual que #wh-exh-row en worker_header_redesign_nova.html (sibling
  // de #wh, fuera de su flex row). Insertarlo como hijo lo comprime a un ítem más de esa fila.
  let unlockEl = header.parentElement ? header.parentElement.querySelector('.worker-header-unlock') : null;
  if (state === 'exhausted') {
    if (!unlockEl && header.parentElement) {
      unlockEl = document.createElement('div');
      unlockEl.className = 'worker-header-unlock';
      unlockEl.innerHTML =
        '<span class="worker-header-unlock-label">Disponible en</span>' +
        '<span class="worker-header-unlock-value"></span>';
      header.after(unlockEl);
    }
    if (unlockEl) {
      unlockEl.dataset.aiId = ai.id;
      const valueEl = unlockEl.querySelector('.worker-header-unlock-value');
      const cd = getCD(ai.resetTime, ai.resetEpoch);
      if (valueEl) {
        valueEl.id = 'cd-' + ai.id; // convención esperada por el interval de reset (locus-sesiones-utils.js:395)
        valueEl.textContent = cd || (ai.resetTime ? '--:--:--' : '');
      }
      unlockEl.title = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : 'Sin hora de desbloqueo asignada';
    }
  } else if (unlockEl) {
    unlockEl.remove();
  }

  // Botón de ingesta de CHECKPOINT (CAEL-33) — bloque dedicado, localizado por id fijo
  // (no se reasigna, a diferencia de resetIcon/dotmenu). No comparte loop con otros botones.
  const ingestBtn = document.getElementById('worker-header-ingest-btn');
  if (ingestBtn) ingestBtn.dataset.aiId = ai.id;

  // Dot-menu — reasigna ids esperados por toggleCardMenu/closeCardMenu + data-ai-id en cada acción
  // .card-dot-menu — clase estable; el id se reasigna a dotmenu-wrap-${id}
  // (_closeCardMenuPortal, locus-workers.js:211, lo busca vía dataset.wrapId).
  const wrap = header.querySelector('.card-dot-menu');
  if (wrap) {
    wrap.id = 'dotmenu-wrap-' + ai.id; // _closeCardMenuPortal (locus-workers.js:211) busca este id por dataset.wrapId
    const dropdown = wrap.querySelector('.card-dot-dropdown') || document.getElementById('dotmenu-' + ai.id);
    if (dropdown) dropdown.id = 'dotmenu-' + ai.id;
    wrap.querySelectorAll('[data-action]').forEach(el => { el.dataset.aiId = ai.id; });

    // interrupt (disponible) vs corregir-hora (agotada) — mutuamente excluyentes, igual que buildCard
    const interruptBtn = wrap.querySelector('[data-action="interrupt"]');
    const correctHoraBtn = wrap.querySelector('[data-action="dot-correct-hora"]');
    if (interruptBtn) interruptBtn.classList.toggle('is-hidden', !isAvail);
    if (correctHoraBtn) correctHoraBtn.classList.toggle('is-hidden', isAvail);

    // descargar reporte — deshabilitado con <2 sesiones, igual que buildCard
    const sessTotal = getAISessions(ai.id).length;
    const dlBtn = wrap.querySelector('[data-action="dot-download-report"]');
    if (dlBtn) {
      dlBtn.classList.toggle('disabled', sessTotal < 2);
      dlBtn.disabled = sessTotal < 2;
      dlBtn.title = sessTotal < 2 ? 'Necesitas al menos 2 sesiones' : 'Descargar reporte markdown';
    }
  }
}

// ── Vista Historial col 2 — estado ──────────────────────────────────────
let _trackerHistSelectedSessId = null;

// ── T-202604-372: Drag & drop sesión → textarea col 1 — estado ──────────
let _trackerDragSessId = null;
let _trackerDragAiId   = null;


// ── T-202604-372: Drag & drop sesión → textarea col 1 ───────────────────

function _trackerHistDragStart(e, sessId, aiId) {
  _trackerDragSessId = sessId;
  _trackerDragAiId   = aiId;
  e.dataTransfer.effectAllowed = 'copy';
  // texto a soltar: título de la sesión como referencia
  const allSessions = getAllSessions();
  const s = allSessions.find(x => x.id === sessId);
  const text = s ? s.title : sessId;
  e.dataTransfer.setData('text/plain', text);
  e.currentTarget.classList.add('dragging');
}

function _trackerHistDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  _trackerDragSessId = null;
  _trackerDragAiId   = null;
}

function _trackerHistAttachDropTargets() {
  // Attach drop zone a todos los textareas ta-{aiId} visibles
  document.querySelectorAll('textarea[id^="ta-"], #ingest-ta').forEach(ta => {
    if (ta._trackerDropAttached) return;
    ta._trackerDropAttached = true;

    ta.addEventListener('dragover', (e) => {
      if (!_trackerDragSessId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      ta.classList.add('tracker-drop-active');
    });

    ta.addEventListener('dragleave', () => {
      ta.classList.remove('tracker-drop-active');
    });

    ta.addEventListener('drop', (e) => {
      if (!_trackerDragSessId) return;
      e.preventDefault();
      ta.classList.remove('tracker-drop-active');

      const allSessions = getAllSessions();
      const s = allSessions.find(x => x.id === _trackerDragSessId);
      if (!s) return;

      // Insertar referencia de sesión: título + fecha como texto en el textarea
      const dateLabel = s.date ? relDate(s.date) : (s.dateShort || '');
      const ref = `[Sesión: ${s.title}${dateLabel ? ' · ' + dateLabel : ''}]`;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const before = ta.value.slice(0, start);
      const after  = ta.value.slice(end);
      ta.value = before + ref + after;
      ta.selectionStart = ta.selectionEnd = start + ref.length;
      ta.dispatchEvent(new Event('input'));
      ta.focus();
    });
  });
}

// CAEL-13: apertura del modal de ingesta unificado (CAEL-07/08).
// INC-ingest-ta-unwired: wiring de paste/input agregado aquí — CAEL-20 (declarado como
// dependencia de este TKT) nunca se implementó. Guard idempotente (_ingestWired) porque
// #ingest-ta es global (CAEL-22) y persiste entre aperturas de distintos Workers — el
// listener se adjunta una sola vez, pero lee overlay.dataset.aiId en cada evento, no en
// el momento de adjuntar, para reflejar siempre el Worker activo.
export function _openIngestModal(aiId) {
  if (!aiId) return;
  const overlay = document.getElementById('ingest-modal-overlay');
  if (!overlay) return;
  overlay.dataset.aiId = aiId;
  overlay.classList.add('open');
  const ta = document.getElementById('ingest-ta');
  if (ta) {
    ta.value = '';
    ta.focus();
    if (!ta._ingestWired) {
      ta._ingestWired = true;
      ta.addEventListener('paste', () => handlePaste(overlay.dataset.aiId));
      ta.addEventListener('input', () => handleInput(overlay.dataset.aiId));
    }
  }
}




// T-202606-085: re-export para preservar compatibilidad — implementación movida a locus-sesiones-utils.js
export { _hoyMsUntilReset, _hoyCountdownLabel } from './locus-sesiones-utils.js';

// ── B-202605-017: Delegación para [data-action="interrupt"] ──
// Reemplaza onclick="confirmInterruptInline('${ai.id}',this)" en el template del dropdown.
// Delegación en #tab-sesiones (contenedor estático raíz) — el dotmenu es dinámico.
document.addEventListener('DOMContentLoaded', () => {
  const tabSesiones = document.getElementById('tab-sesiones');
  if (tabSesiones) {
    tabSesiones.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="interrupt"]');
      if (btn) {
        const aiId = btn.dataset.aiId;
        if (aiId) confirmInterruptInline(aiId, btn);
      }
    });
  }
});
// ── END B-202605-017 ──

// ── T-202605-057: Delegación dblclick — sc-avatar → startRename ──────────
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('dblclick', e => {
    const el = e.target.closest('[data-action="dblclick-avatar"]');
    if (!el) return;
    const aiId = el.dataset.aiId;
    if (aiId) startRename(aiId);
  });
});
// ── END T-202605-057 ─────────────────────────────────────────────────────

// ── B-202605-019: Listeners — on* migrados desde templates de locus-sesiones.js ──
// Cubre: archived-toggle, empty-state-btn openAddAI/openProjModal.
document.addEventListener('DOMContentLoaded', function () {
  // .archived-toggle → toggleArchivedSection(el)
  // Delegación en document — el elemento se genera dinámicamente en render().
  document.addEventListener('click', function _archivedToggleDelegate(e) {
    const el = e.target.closest('.archived-toggle');
    if (!el) return;
    toggleArchivedSection(el);
  });

  // [data-action="openAddAI"] → openAddAI()
  // [data-action="openProjModal"] → openProjModal(false)
  // Delegación en document — los botones se generan dinámicamente en render().
  document.addEventListener('click', function _sesionesEmptyStateDelegate(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'openAddAI') {
      openAddAI();
    } else if (action === 'openProjModal') {
      (_sesSPCallbacks.openProjModal || (() => {}))(false);
    }
  });

});
// ── END B-202605-019 ─────────────────────────────────────────────────────────

// --- Delegation: locus-sesiones.js ---
document.addEventListener('DOMContentLoaded', () => {
  // Contenedores: #tab-sesiones (grid de cards HOY) + #tracker-col-card (sidebar) + document para elementos dinámicos
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const aiId = el.dataset.aiId;
    const sessId = el.dataset.sessId;
    const projId = el.dataset.projId;
    const filterId = el.dataset.filterId;

    switch (action) {
      // Sidebar tracker rows
      case 'select-tracker-ai':
        selectTrackerAI(aiId);
        break;
      // T-202606-052: cerrar panel Col3 preview
      case 'preview-close':
        _trackerHistSelectedSessId = null;
        document.querySelectorAll('.tracker-mini-hist-row').forEach(r => r.classList.remove('active'));
        _trackerClosePreview();
        break;
      // Mini hist rows (stopPropagation preservado)
      case 'mini-hist-select':
        e.stopPropagation();
        _trackerMiniHistSelect(sessId || el.dataset.sessId, aiId);
        break;
      // Hoy card — navigate to card
      case 'navigate-to-card':
        navigateToCard(aiId);
        break;
      // Hoy card — open quick capture (stopPropagation)
      case 'open-quick-capture':
        e.stopPropagation();
        openQuickCapture(aiId);
        break;
      // Interrupted banner
      case 'dismiss-interrupted':
        dismissInterrupted(aiId);
        break;
      // Popup ref pill (stopPropagation)
      case 'open-detail-stop':
        e.stopPropagation();
        openDetail(aiId, sessId);
        break;
      // Toggle in review (stopPropagation)
      case 'toggle-in-review-stop':
        e.stopPropagation();
        toggleInReview(aiId, sessId);
        break;
      // Sess row — open detail
      case 'open-detail':
        openDetail(aiId, el.closest('[data-sess-id]')?.dataset.sessId || sessId);
        break;
      // Show all toggle
      case 'toggle-show-all':
        toggleShowAll(aiId);
        break;
      // Footer — assign hora / correct hora
      case 'open-correct-hora':
        openCorrectHora(aiId);
        break;
      // Header — abrir modal de ingesta de CHECKPOINT (CAEL-33)
      case 'open-ingest':
        _openIngestModal(aiId);
        break;
      // Footer — blind exhaust
      case 'confirm-blind-exhaust':
        confirmBlindExhaust(aiId);
        break;
      // Project chip (stopPropagation)
      case 'select-project-filter-stop':
        e.stopPropagation();
        (_sesSPCallbacks.selectProjectFilter || (() => {}))(projId);
        break;
      // Card dot menu toggle
      case 'toggle-card-menu':
        toggleCardMenu(aiId, el, e);
        break;
      // Card dot items — close menu then execute
      case 'dot-rename':
        closeCardMenu(aiId);
        startRename(aiId);
        break;
      case 'dot-correct-hora':
        closeCardMenu(aiId);
        openCorrectHora(aiId);
        break;
      case 'dot-download-report':
        closeCardMenu(aiId);
        downloadReport(aiId);
        break;
      case 'dot-avatar':
        closeCardMenu(aiId);
        openAvatarModal(aiId);
        break;
      case 'dot-archive':
        closeCardMenu(aiId);
        archiveAI(aiId);
        break;
      case 'dot-clear':
        closeCardMenu(aiId);
        confirmClear(aiId);
        break;
      case 'dot-delete':
        closeCardMenu(aiId);
        deleteAI(aiId);
        break;
    }
  });
});

// T-[tmp:t-listeners-storage-sesiones]: listeners shell:* — desacoplamiento de locus-storage.js
// locus-storage.js despacha shell:mark-tracker-dirty + shell:render-tracker + shell:update-auto-download-label
// en lugar de llamar directamente a las funciones de este módulo
window.addEventListener('shell:mark-tracker-dirty', () => { _markTrackerDirty(); });
window.addEventListener('shell:render-tracker', () => { render(); });
// T-202606-084: selectTrackerAI desacoplado de stats y utils vía event
window.addEventListener('shell:select-tracker-ai', (e) => { selectTrackerAI(e.detail.aiId); });
