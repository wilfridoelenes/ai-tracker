// [PP] v0.1.0 · sprint:PP-S-02 · mod:17 · autor:Rune · 2026-06-17 15:00 UTC-6
// locus-sesiones.js
// Última actualización: 2026-06-06 · T-202606-058: Romper ciclo locus-sesiones ↔ locus-sprint-project
// Módulo: Tab Sesiones — render, cards de IAs, session list, log card, detail panel, mini-hist,
//   sidebar ticker, auto-download preference.
// Requiere: locus-storage.js, locus-toast.js, locus-tracker-utils.js cargados ANTES en index.html
// Timer · suggestion · weekly summary → locus-tracker-utils.js
// normStatus · buildTGPreview · STATUS_LABELS · TG_PARSER_CONFIG → locus-session-parse.js

import { updateTabNotifBadges } from './locus-notifications.js';
import { _initRadarSidebarState, renderGlobalRadarSidebar } from './locus-radar.js';
import { _scrollToCard, _updateHeaderProjectLabel, navigateToCard, renderStatusBar, updateStats, _hasStaleSuggestion } from './locus-sesiones-stats.js';
import { renderSuggestionBanner, startSessionTimer, _buildSuggestionReason, _sessRelTsShared, _cscardRelTs, _hoyMsUntilReset, getCD } from './locus-sesiones-utils.js';
import { fmt12, confirmSave, interpretHora, relDate } from './locus-session-hora.js';
import { openCorrectHora } from './locus-sesiones-viz.js'; // T-202606-089 AC-3 — ciclo seguro: uso solo dentro de handlers
import { closeLogCard, closePopup, openDetail, startRename, toggleInReview, toggleShowAll } from './locus-session-popup.js'; // T-202606-089 AC-3
// T-202606-058: import de locus-sprint-project eliminado — ciclo A↔B roto.
// _getActiveProjectFilter · getProjectById · openProjModal · selectProjectFilter
// consumidas via _sesSPCallbacks registry (registradas por locus-sprint-project en DOMContentLoaded).
import { getActiveProject, getActiveTracker, getAllSessions, getAI, getAISessions, getLastAISession, _findSession, save, getState, saveImmediate, _getCurrentSession, _isInSession } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';
import { esc, renderSetupChecklist } from './locus-ui-shell.js';
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
    // Último acceso: sesión en curso si existe, si no la más reciente del historial
    const lastSess = currentSess || (filtered.length ? filtered[filtered.length - 1] : null);
    lastMetaEl.textContent = lastSess
      ? ('Último: ' + (lastSess.date ? relDate(lastSess.date) : (lastSess.dateShort || lastSess.date || '')))
      : '';
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

  // T-202606-051: _renderRow — 4 líneas por fila según AC
  const _renderRow = (s, group, isInProgress) => {
    const isActive = s.id === _trackerHistSelectedSessId;

    // AC línea 1: título + badge 'en curso' si in-progress (reemplaza timestamp), o timestamp
    const badgeHtml  = isInProgress
      ? `<span class="mh-row-badge-live">en curso</span>`
      : '';
    const tsHtml     = !isInProgress
      ? (() => { const fixedTs = _sessFixedTs(s, group); return fixedTs ? `<span class="mh-row-ts">${fixedTs}</span>` : ''; })()
      : '';
    const titleHtml  = `<div class="mh-row-title" title="${esc(s.title)}">${esc(s.title)}</div>`;

    // AC línea 2: summary truncado a 2 líneas — omitido si vacío
    const summaryHtml = s.summary
      ? `<div class="mh-row-summary">${esc(s.summary)}</div>`
      : '';

    // AC línea 3: pill de rol + (timestamp o badge) + refs coloreadas por tipo
    const rolHtml = s.rol
      ? `<span class="mh-row-rol">${esc(s.rol)}</span>`
      : '';

    const refs = s.trackerRefs || [];
    const visibleRefs = refs.slice(0, 3);
    const extraCount  = refs.length - visibleRefs.length;
    const refTagsHtml = visibleRefs.map(code => {
      const t = (code[0] || '').toUpperCase();
      const typeClass = t === 'T' ? 'mh-ref-tag--t'
                      : t === 'R' ? 'mh-ref-tag--r'
                      : t === 'B' ? 'mh-ref-tag--b'
                      : '';
      return `<span class="mh-ref-tag ${typeClass}">${esc(code)}</span>`;
    }).join('');
    const refMoreHtml = extraCount > 0
      ? `<span class="mh-ref-more">+${extraCount}</span>`
      : '';
    const refsHtml = (refTagsHtml || refMoreHtml)
      ? `<span class="mh-row-refs">${refTagsHtml}${refMoreHtml}</span>`
      : '';

    const metaHtml = (rolHtml || tsHtml || badgeHtml || refsHtml)
      ? `<div class="mh-row-meta">${rolHtml}${badgeHtml}${tsHtml}${refsHtml}</div>`
      : '';

    // AC línea 4: decision con prefijo → truncado 1 línea — omitido si vacío
    const decisionHtml = s.decision
      ? `<div class="mh-row-decision"><span class="mh-row-decision-prefix">→</span><span class="mh-row-decision-text">${esc(s.decision)}</span></div>`
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
      ${titleHtml}
      ${summaryHtml}
      ${metaHtml}
      ${decisionHtml}
    </div>`;
  };
  // ── END T-202606-051 ──

  // AC-2: grupo 'ahora' al tope si hay sesión en curso — AC-5: omitido si no hay sesión en curso
  const ahoraHtml = currentSess
    ? `<div class="sess-group-sep">Ahora</div>` + _renderRow(currentSess, 'hoy', true)
    : '';

  // Grupos temporales del historial
  const histHtml = _groupOrder
    .filter(g => _grouped[g].length > 0)
    .map(g =>
      `<div class="sess-group-sep">${_groupLabel[g]}</div>` +
      _grouped[g].map(s => _renderRow(s, g, false)).join('')
    ).join('');

  listEl.innerHTML = ahoraHtml + histHtml;

  // Auto-seleccionar la sesión más reciente del historial si no hay ninguna seleccionada
  // (la sesión en curso no participa en la selección de col 3 desde este flujo)
  const latestSess = sorted[0];
  if (latestSess && !_trackerHistSelectedSessId) {
    _trackerHistSelectedSessId = latestSess.id;
    const firstHistRow = listEl.querySelector('.tracker-mini-hist-row:not(.mh-row--in-progress)');
    if (firstHistRow) firstHistRow.classList.add('active');
    openDetail(latestSess.aiId, latestSess.id);
  }

  // T-202605-471: scroll al row activo para que siempre quede visible
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

  // mobile: navegar a col 3
  if (window.innerWidth < 900) {
    _trackerSwitchCol('items');
  }
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
      const t = (code[0] || '').toUpperCase();
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
  // DUP-05: cerrar preview de sesión al cambiar de Worker
  closePopup();
  // T-202604-373: skeleton rows en historial al cambiar de IA
  const _prevCard = _trackerSelectedId ? document.getElementById('card-' + _trackerSelectedId) : null;
  if (_prevCard) {
    const _prevList = _prevCard.querySelector('.sess-list');
    if (_prevList) {
      _prevList.innerHTML = '<div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div>';
    }
  }
  // Fase 2: resetear sesión seleccionada al cambiar de IA — mini-hist auto-selecciona la más reciente
  if (_trackerSelectedId !== aiId) _trackerHistSelectedSessId = null;
  _trackerSelectedId = aiId;
  closeLogCard();
  // R-202604-061 AC-5: try-catch defensivo — skeleton siempre se limpia
  try {
    _markTrackerDirty(); render();
    // R-202604-061 AC-06: fade-in del panel de detalle al cambiar selección
    requestAnimationFrame(() => {
      const _newCard = document.getElementById('card-' + aiId);
      if (_newCard) {
        _newCard.classList.remove('detail-fade-in');
        void _newCard.offsetWidth; // force reflow
        _newCard.classList.add('detail-fade-in');
      }
    });
  } catch(e) {
    // skeleton cleanup garantizado aunque render falle
    const _fallbackCard = _prevCard || (document.getElementById('card-' + aiId));
    if (_fallbackCard) {
      const _fl = _fallbackCard.querySelector('.sess-list');
      if (_fl && _fl.querySelector('.skel-row')) _fl.innerHTML = '';
    }
    console.error('render() error in selectTrackerAI:', e);
  }
  _scrollToCard(aiId);
  // T-202605-446: iniciar/retomar cronómetro al seleccionar IA
  startSessionTimer(aiId);
  // R-202605-167: actualizar segmento 3 del breadcrumb al cambiar Worker seleccionado
  _updateHeaderProjectLabel();
  // focus textarea si disponible
  setTimeout(() => {
    const ta = document.getElementById('ta-' + aiId);
    if (ta) { ta.focus(); }
  }, 80);
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
  const grid = document.getElementById('grid');
  const emptyEl = document.getElementById('tracker-detail-empty');


  if (!getState().ais.length) {
    if (grid) grid.innerHTML = '';
    // R-202605-178 AC: sin workers — único CTA
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); emptyEl.innerHTML = `
      <div class="empty-state-icon">🤖</div>
      <div class="empty-state-title">Agrega tu primer Worker</div>
      <div class="empty-state-hint">Los Workers son las IAs que usas. Empieza por crear uno para registrar tus sesiones.</div>
      <button class="empty-state-btn" data-action="openAddAI">＋ Nuevo Worker</button>`; }
    updateStats(); renderStatusBar(); renderSetupChecklist(); return;
  }

  // R-202605-007 AC: con workers pero sin proyecto activo — solo CTA "Nuevo Proyecto"
  const _hasActiveProj = !!getActiveProject();
  if (!_hasActiveProj && (getState().projects || []).length === 0) {
    if (grid) grid.innerHTML = '';
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); emptyEl.innerHTML = `
      <div class="empty-state-icon">🗂</div>
      <div class="empty-state-title">Sin proyecto activo</div>
      <div class="empty-state-hint">Crea un proyecto para empezar a registrar sesiones y gestionar tu backlog.</div>
      <div class="es-cta-row">
        <button class="empty-state-btn" data-action="openProjModal">＋ Nuevo Proyecto</button>
      </div>`; }
    updateStats(); renderStatusBar(); renderSetupChecklist(); return;
  }

  // auto-select: preferir disponible/en-sesión sobre agotada
  const allActive = getState().ais.filter(ai => !ai.archived);
  if (!_trackerSelectedId || !getState().ais.find(a => a.id === _trackerSelectedId)) {
    const preferred = allActive.find(a => a.status !== 'exhausted') || allActive[0];
    _trackerSelectedId = preferred ? preferred.id : null;
  }

  if (!_trackerSelectedId) {
    if (grid) {
      grid.innerHTML = '';
      const archived = getState().ais.filter(a => a.archived);
      if (archived.length) {
        const section = document.createElement('div');
        section.className = 'archived-section';
        const isOpen = localStorage.getItem('archived-open') === '1';
        section.innerHTML = `<button class="archived-toggle">
          ${isOpen ? '▼' : '▶'} Archivadas (${archived.length})</button>
          <div class="archived-grid${isOpen ? ' open' : ''}" id="archived-grid"></div>`;
        grid.appendChild(section);
        const archGrid = section.querySelector('#archived-grid');
        archived.forEach(a => archGrid.appendChild(buildCard(a)));
      }
    }
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); }
    updateStats(); renderStatusBar(); renderSetupChecklist(); return;
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

  if (grid) {
    // R-110: sort IN-SESSION → DISPONIBLE → AGOTADA — sobre array, no manipula DOM
    const _sortOrder = (ai) => {
      if (ai.status !== 'exhausted' && _isInSession(ai)) return 0;
      if (ai.status !== 'exhausted') return 1;
      return 2;
    };
    const aisToRender = [...getState().ais.filter(a => !a.archived)].sort((a, b) => _sortOrder(a) - _sortOrder(b));
    const ai = aisToRender.find(a => a.id === _trackerSelectedId) || getState().ais.find(a => a.id === _trackerSelectedId);
    // B-202605-056: preservar valor del textarea antes de destruir el DOM
    // grid.innerHTML = '' elimina el textarea y su valor en cada render — restaurar post-buildCard
    const _taId = ai ? 'ta-' + ai.id : null;
    const _taSaved = _taId ? ((document.getElementById(_taId) || {}).value || '') : '';
    grid.innerHTML = '';
    if (ai) {
      const card = buildCard(ai);
      card.dataset.aiId = ai.id;
      grid.appendChild(card);
      // R-202604-061 AC-04: stagger reveal — una sola card en tracker, delay 0ms
      card.style.setProperty('--card-stagger-delay', '0ms');
      requestAnimationFrame(() => card.classList.add('stagger-in'));
      // B-202605-056: restaurar valor del textarea si había texto antes del render
      if (_taSaved) {
        const _taNew = document.getElementById(_taId);
        if (_taNew && !_taNew.value) {
          _taNew.value = _taSaved;
          // R-202605-064: re-aplicar indicador visual si el textarea tiene contenido post-render
          const _taWrap = _taNew.closest('.paste-ta-wrap');
          if (_taWrap) _taWrap.classList.add('paste-ta-wrap--has-content');
        }
      }

      // T-202606-050: csCard va en #tracker-ckpt-section (Col 2) — no en #grid
      const existingCsCard = document.getElementById('current-session-card-' + ai.id);
      if (existingCsCard) existingCsCard.remove();

      // archived section below card
      const archived = getState().ais.filter(a => a.archived);
      if (archived.length) {
        const section = document.createElement('div');
        section.className = 'archived-section';
        const isOpen = localStorage.getItem('archived-open') === '1';
        section.innerHTML = `<button class="archived-toggle">
          ${isOpen ? '▼' : '▶'} Archivadas (${archived.length})</button>
          <div class="archived-grid${isOpen ? ' open' : ''}" id="archived-grid"></div>`;
        grid.appendChild(section);
        const archGrid = section.querySelector('#archived-grid');
        archived.forEach(a => archGrid.appendChild(buildCard(a)));
      }
    }
  }

  // T-202606-050: render Col 2 — #tracker-ckpt-section + #tracker-mini-hist + empty global
  _trackerRenderCol2(_trackerSelectedId);
  _trackerHistAttachDropTargets();
  updateStats();
  renderStatusBar();
  renderGlobalRadarSidebar();
  if (!_radarSbInited) { _radarSbInited = true; _initRadarSidebarState(); }
  if (typeof renderProjDots === 'function') renderProjDots();
  // T-202605-447: actualizar banner de sesión sugerida tras cada render
  renderSuggestionBanner();
  // R-202605-008: actualizar checklist de setup tras cada render
  renderSetupChecklist();
  // B-202605-508: actualizar badges de tabs al final de cada render
  updateTabNotifBadges();
}

const TG_TYPE_NAMES = {P:'Idea', T:'Ticket', R:'Requerimiento', B:'Bug'};

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

  // "disponible desde" — hora del último reset o última sesión
  function _availableSinceLabel() {
    if (ai.resetTime && ai.resetEpoch) {
      const epoch = new Date(ai.resetEpoch);
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

  // "disponible desde" — hora del último reset o última sesión
  function _availableSinceLabel() {
    if (ai.resetTime && ai.resetEpoch) {
      const epoch = new Date(ai.resetEpoch);
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
function openBlindExhaustMode(id) {
  const ai = getAI(id);
  if (!ai || ai.status !== 'available' || _isInSession(ai)) return;
  const footer = document.getElementById('footer-' + id);
  if (!footer) return;
  footer.classList.add('card-footer--blind-exhaust-mode');
  const inline = document.getElementById('bexhaust-inline-' + id);
  if (inline) inline.classList.remove('is-hidden');
  setTimeout(() => {
    const inp = document.getElementById('bexhaust-hora-' + id);
    if (inp) { inp.focus(); inp.select(); }
  }, 30);
}

function cancelBlindExhaustMode(id) {
  const footer = document.getElementById('footer-' + id);
  if (footer) footer.classList.remove('card-footer--blind-exhaust-mode');
  const inline = document.getElementById('bexhaust-inline-' + id);
  if (inline) inline.classList.add('is-hidden');
  const inp = document.getElementById('bexhaust-hora-' + id);
  if (inp) inp.value = '';
  const disp = document.getElementById('bexhaust-disp-' + id);
  if (disp) { disp.textContent = '—'; disp.className = 'hora-parsed'; }
  const btn = document.getElementById('bexhaust-confirm-' + id);
  if (btn) btn.disabled = true;
}

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

function blindExhaustHoraKey(event, id) {
  if (event.key === 'Escape') { event.preventDefault(); cancelBlindExhaustMode(id); return; }
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
  cancelBlindExhaustMode(id);
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

function buildCard(ai) {
  const el = document.createElement('div');
  const isInterrupted = !!ai.interrupted;
  const isInSession   = !isInterrupted && _isInSession(ai);
  el.className = 'card ' + (ai.status === 'exhausted' ? 'exhausted' : 'available') + (isInterrupted ? ' interrupted-state' : '') + (isInSession ? ' in-session-state' : '');
  el.id = 'card-' + ai.id;

  const cd = ai.status === 'exhausted' ? getCD(ai.resetTime, ai.resetEpoch) : '';
  const resetLabel = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : '';
  // T-055: banner sesión interrumpida
  const interruptedBannerHTML = ai.interrupted
    ? `<div class="interrupted-banner visible">
        <span class="interrupted-banner-text">⚡ Checkpoint en curso</span>
        <button class="interrupted-banner-btn" data-action="dismiss-interrupted" data-ai-id="${ai.id}">Continuar →</button>
       </div>`
    : `<div class="interrupted-banner" id="intbanner-${ai.id}"></div>`;

  // T-202604-203: stats bar sin countdown (countdown va en zona central)
  const _cdInStats = false;

  // v3: sesiones de esta IA en el contexto del proyecto activo
  const aiSessions = getAISessions(ai.id);
  const SESSIONS_DEFAULT = 3;
  const shown = ai.showAll ? aiSessions : [...aiSessions].slice(-SESSIONS_DEFAULT);
  const _latestSessId = aiSessions.length > 0 ? aiSessions[aiSessions.length - 1].id : null;

  // v3: tracker del proyecto activo para indicadores de sesión
  const projTracker = getActiveTracker();

  // T-397: helper — build a single sess-row HTML
  const _buildSessRow = (s, isHero) => {
    const tagDots = (s.tags || []).map(tid => {
      const t = getState().tags.find(x => x.id === tid);
      return t ? `<span class="sess-tag-dot" data-tag-color="${esc(t.color)}" title="${esc(t.name)}"></span>` : '';
    }).join('');
    const tgItems = projTracker.items.filter(x => x.sessionId === s.id);
    const tgCounts = {P:0,T:0,R:0,B:0};
    tgItems.forEach(x => {
      const t = x.code ? x.code[0] : (x.type || '');
      if (tgCounts[t] !== undefined) tgCounts[t]++;
    });
    const tgInds = Object.entries(tgCounts).filter(([,v]) => v > 0)
      .map(([k, v]) => `<span class="sess-ind sess-ind-${k}" title="${TG_TYPE_NAMES[k]}"><span class="ind-short">${k}${v > 1 ? v : ''}</span><span class="ind-full">${TG_TYPE_NAMES[k]}${v > 1 ? '×'+v : ''}</span></span>`).join('');
    const pendInd = '';
    const noHoraTag = (!s.resetAt && !s.quickCapture) ? `<span class="sess-no-hora" title="Sin hora de reset registrada">sin hora</span>` : '';
    const refPills = (s.trackerRefs || []).map(code => {
      const type = code[0] || '';
      return `<span class="popup-ref-pill ${type} popup-ref-pill--sm" title="${esc(code)}" data-action="open-detail-stop" data-ai-id="${ai.id}" data-sess-id="${s.id}">${esc(code)}</span>`;
    }).join('');
    const starInd = s.starred ? `<span class="sess-ind sess-ind--starred" title="Destacada">⭐</span>` : '';
    const quickInd = s.quickCapture ? `<span class="sess-ind sess-quick-tag" title="Captura rápida">⚡</span>` : '';
    const isLatest = s.id === _latestSessId;
    const reviewInd = isLatest
      ? `<span class="sess-review-ind${s.inReview ? ' active' : ''}" title="${s.inReview ? 'En revisión — click para desactivar' : 'Marcar en revisión'}" data-action="toggle-in-review-stop" data-ai-id="${ai.id}" data-sess-id="${s.id}">${s.inReview ? '🔍 revisión' : '🔍'}</span>`
      : '';
    const summaryTrunc = s.summary ? (s.summary.length > 80 ? s.summary.slice(0, 80) + '…' : s.summary) : '';
    const summaryHtml = isHero && s.summary
      ? `<div class="sess-row-summary sess-row-summary--expanded">${esc(s.summary.slice(0, 220))}${s.summary.length > 220 ? '…' : ''}</div>`
      : (s.summary ? `<div class="sess-row-summary">${esc(summaryTrunc)}</div>` : '');
    const decisionHtml = isHero && s.decision
      ? `<div class="sess-row-decision"><span class="sess-row-decision-label">→</span>${esc(s.decision.slice(0, 160))}${s.decision.length > 160 ? '…' : ''}</div>`
      : '';
    const extraCls = (s.starred ? ' sess-row-starred' : '') + (isHero ? ' sess-row--latest' : '');
    return `<div class="sess-row${extraCls}" data-sess-id="${s.id}" data-action="open-detail" data-ai-id="${ai.id}">>
      <div class="sess-row-top">
        <div class="sess-row-title" title="${esc(s.title)}">${esc(s.title)}</div>
        <div class="sess-row-date" title="${esc(s.date || s.dateShort || '')}">${s.date ? relDate(s.date) : (s.dateShort || '')}</div>
      </div>
      <div class="sess-row-bottom">
        ${summaryHtml}
        <div class="sess-row-indicators">${starInd}${quickInd}${pendInd}${tgInds}${noHoraTag}${reviewInd}<div class="sess-row-tags">${tagDots}</div></div>
      </div>
      ${decisionHtml}
    </div>`;
  };

  // T-397: hero (latest) + horizontal strip (older)
  const shownReversed = [...shown].reverse();
  const latestSess = shownReversed[0] || null;
  const olderSess = shownReversed.slice(1);
  const heroHTML = latestSess ? _buildSessRow(latestSess, true) : '';
  const olderHTML = olderSess.length > 0
    ? `<div class="sess-list-horiz">${olderSess.map(s => _buildSessRow(s, false)).join('')}</div>`
    : '';
  const sessRows = heroHTML + olderHTML;

  // B-258: emptyState inline — información de sugerencia dentro de la card, sin banner global
  const _noSessReason = _buildSuggestionReason(ai);
  const emptyState = `<div class="no-sess">
    <span class="no-sess-icon">📋</span>
    Sin checkpoints registrados
    ${_noSessReason ? `<div class="no-sess-suggestion">${esc(_noSessReason)}</div>` : ''}
    <div class="no-sess-hint">Pega el bloque CHECKPOINT al terminar tu sesión con la IA</div>
  </div>`;

  // v3: stats de sesiones desde proyecto activo
  const nowYM = new Date().toISOString().slice(0,7);
  const sessThisMonth = aiSessions.filter(s => (s.date || '').startsWith(nowYM)).length;
  const sessTotal = aiSessions.length;

  const histHTMLv2 = `
    <div class="history">
      <div class="history-header">
        <div class="history-label">Historial</div>
        <div class="history-header-right">
          <span class="sess-pill">${sessTotal}</span>
        </div>
      </div>
      ${sessTotal === 0 ? emptyState : `
        <div class="sess-list-hero" id="sess-list-${ai.id}">${sessRows}</div>
        ${sessTotal > SESSIONS_DEFAULT ? `<button class="show-all-btn" data-action="toggle-show-all" data-ai-id="${ai.id}">${ai.showAll ? '▲ ocultar historial' : '▾ Ver historial (' + sessTotal + ')'}</button>` : ''}
      `}
    </div>`;

  // Selector de proyecto — inline en paste-label
  const _activeProjects = (getState().projects || []).filter(p => p.status !== 'paused');
  const _activeProjId = (_sesSPCallbacks.getActiveProjectFilter || (() => ''))() || '';
  const _projOptions = _activeProjects.map(p =>
    `<option value="${esc(p.id)}" ${p.id === _activeProjId ? 'selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`
  ).join('');
  const _projInlineSelect = `<select class="paste-proj-select" id="sess-proj-${ai.id}" title="Proyecto de esta sesión"><option value="">proyecto…</option>${_projOptions}</select>`;

  // T-202604-203: zona central — contenido condicional por estado
  // Estado available: textarea + preview
  // Estado exhausted: countdown dramático
  // B-255: label "Disponible en X h Y min" calculado desde _hoyMsUntilReset
  const _buildUnlockLabel = (aiObj) => {
    const msLeft = _hoyMsUntilReset(aiObj);
    if (!isFinite(msLeft) || msLeft <= 0) return 'Disponible ahora';
    const totalMin = Math.floor(msLeft / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `Disponible en ${m}min`;
    return `Disponible en ${h}h ${String(m).padStart(2,'0')}min`;
  };
  const unlockLabel = ai.status === 'exhausted' && ai.resetTime ? _buildUnlockLabel(ai) : '';

  const inputHTML = ai.status === 'available' ? `
    <div class="paste-wrap">
      <div class="paste-label">Resumen de sesión ${_projInlineSelect}</div>
      <div class="paste-help-box is-hidden" id="paste-help-${ai.id}">Pega el bloque <code>---CHECKPOINT---</code> que genera el TL al final de cada sesión. Si no tienes el bloque, escribe el título en la primera línea y el resumen en las siguientes.</div>
      <div class="sc-stepper" id="phasebar-${ai.id}" role="list">
        <div class="sc-step active" id="phase-paste-${ai.id}" role="listitem" aria-current="step" data-step="1"><span class="sc-step-num" aria-hidden="true">1</span>pegar</div>
        <div class="sc-step" id="phase-confirm-${ai.id}" role="listitem" data-step="2"><span class="sc-step-num" aria-hidden="true">2</span>confirmar</div>
        <div class="sc-step" id="phase-save-${ai.id}" role="listitem" data-step="3"><span class="sc-step-num" aria-hidden="true">3</span>guardar</div>
      </div>
      <div class="paste-ta-wrap">
        <textarea class="paste-ta" id="ta-${ai.id}" rows="3"></textarea>
        <div class="paste-ta-hint" id="pta-hint-${ai.id}">Pega el bloque <code>---CHECKPOINT---</code> que genera el rol al cerrar sesión. Si no tienes el bloque, escribe el título en la primera línea y el resumen en las siguientes.</div>
      </div>
      <div class="char-counter" id="cc-${ai.id}"></div>
    </div>
    <div class="preview" id="prev-${ai.id}"></div>
  ` : ai.resetTime ? `
    <div class="card-countdown-zone">
      <div class="countdown-dramatic">
        <div class="card-stat-countdown" id="cd-${ai.id}">${cd || '--:--:--'}</div>
        <div class="card-stat-reset-lbl">${resetLabel}</div>
        <div class="sc-unlock-field" id="unlock-lbl-${ai.id}">
          ${unlockLabel ? `<i class="sc-unlock-icon ti ti-lock-open"></i><span class="sc-unlock-label">${unlockLabel}</span>` : ''}
        </div>
      </div>
    </div>
  ` : `
    <div class="card-countdown-zone card-countdown-zone--notime">
      <div class="countdown-no-time">
        <div class="countdown-no-time-msg">Sin hora de desbloqueo asignada</div>
        <button class="countdown-assign-hora-btn" data-action="open-correct-hora" data-ai-id="${ai.id}">⏰ Asignar hora</button>
      </div>
    </div>
  `;

  // T-202604-203: footer fijo — acciones primarias siempre en la misma posición
  const footerHTML = ai.status === 'available' ? `
    <div class="sc-footer" id="footer-${ai.id}">
      <div class="blind-exhaust-inline is-hidden" id="bexhaust-inline-${ai.id}">
        <div class="blind-exhaust-hora-row">
          <input class="hora-input blind-exhaust-hora-input" id="bexhaust-hora-${ai.id}" type="text" maxlength="4" placeholder="--:--"
            aria-label="Hora de desbloqueo para agotamiento ciego">
          <div>
            <div class="hora-parsed" id="bexhaust-disp-${ai.id}">—</div>
            <div class="hora-hint-txt">hora de desbloqueo · Enter para agotar</div>
          </div>
        </div>
        <div class="blind-exhaust-confirm-row">
          <button class="blind-exhaust-confirm-btn" id="bexhaust-confirm-${ai.id}" data-action="confirm-blind-exhaust" data-ai-id="${ai.id}" disabled aria-label="Confirmar agotamiento ciego">🔴 Agotar</button>
          <button class="blind-exhaust-cancel-btn" data-action="cancel-blind-exhaust" data-ai-id="${ai.id}">Cancelar</button>
        </div>
      </div>
    </div>
  ` : `
    <div class="sc-footer sc-footer--exhausted">
      <button class="card-footer-unlock-btn" data-action="open-correct-hora" data-ai-id="${ai.id}">⏰ Corregir hora</button>
    </div>
  `;


  // v3: stale usa aiSessions
  const staleLastDate = aiSessions.length > 0 ? new Date(aiSessions[aiSessions.length-1].date) : null;
  const staleDays = staleLastDate ? Math.floor((Date.now()-staleLastDate.getTime())/86400000) : 0;

  const checkpointTotal = aiSessions.length; // todos los registros
  const sessConHora = aiSessions.filter(s => s.resetAt && !s.quickCapture).length; // con hora bloqueada
  const avgLabel2 = avgBetweenSessions(ai);
  const avgShort = avgLabel2 ? avgLabel2.replace(' entre sesiones','') : '—';
  // T-202604-203: stats bar idéntica en ambos estados — solo números, sin countdown
  const statsBarHTML = `<div class="sc-stats">
      <div class="sc-stat"><span class="sc-stat-val">${checkpointTotal}</span><span class="sc-stat-lbl">checkpoints</span></div>
      <div class="sc-stat"><span class="sc-stat-val">${sessConHora}</span><span class="sc-stat-lbl">sesiones</span></div>
      <div class="sc-stat"><span class="sc-stat-val">${avgShort}</span><span class="sc-stat-lbl" title="Tiempo promedio entre sesiones de este Worker, desde apertura">desde apertura</span></div>
    </div>`;

  // Project chip — basado en la última sesión de la IA
  const _lastSess = getLastAISession(ai.id);
  const _cardProj = _lastSess ? (_sesSPCallbacks.getProjectById || (() => undefined))(_lastSess.projectId) : null;
  const _projChipHTML = _cardProj
    ? `<span class="card-proj-chip" title="${esc(_cardProj.name)}" data-action="select-project-filter-stop" data-proj-id="${_cardProj.id}">${esc(_cardProj.icon || '📁')} ${esc(_cardProj.name)}</span>`
    : '';

  // Premium card: avatar initial + status pill animado + countdown dramático
  const _aiInitial = esc(ai.name).charAt(0).toUpperCase();
  const _isAvail = ai.status === 'available';

  // Sprint activo del proyecto de la card — para mostrar ID en header
  const _cardActiveSprint = _cardProj && _cardProj.sprints
    ? _cardProj.sprints.find(s => s.status === 'active')
    : null;
  const _cardSprintId = _cardActiveSprint ? esc(_cardActiveSprint.id || _cardActiveSprint.name || '') : '';
  const _cardSprintHTML = _cardSprintId
    ? `<span class="sc-sprint-id" title="${esc(_cardActiveSprint.name || _cardActiveSprint.id)}">${_cardSprintId}</span>`
    : '';

  el.innerHTML = `
    ${interruptedBannerHTML}
    <div class="sc-header">
      <div class="sc-header-left">
        <div class="sc-avatar" title="${esc(ai.name)}" data-action="dblclick-avatar" data-ai-id="${ai.id}">${ai.avatar || _aiInitial}</div>
        <span class="sc-project" id="name-${ai.id}">${esc(ai.name)}</span>
        ${isInSession
          ? `<span class="sc-badge"><span class="sc-badge-dot"></span>${STATUS_LABELS.insession}</span>`
          : _isAvail
            ? `<span class="sc-badge sc-badge--avail">${STATUS_LABELS.available}</span>`
            : `<span class="sc-badge sc-badge--exhausted">${STATUS_LABELS.exhausted}</span>`
        }
      </div>
      <div class="sc-header-right">
        ${_hasStaleSuggestion(ai) ? `<span class="stale-dot" title="Última sesión hace ${staleDays} días — tienes ítems en progreso pendientes"></span>` : ''}
        ${_cardSprintHTML}
        ${_isAvail ? `<button class="btn-quick" data-action="open-quick-capture" data-ai-id="${ai.id}" title="Registrar sesión rápida sin protocolo">⚡</button>` : ''}
        <div class="card-dot-menu" id="dotmenu-wrap-${ai.id}">
          <button class="sc-menu-btn" data-action="toggle-card-menu" data-ai-id="${ai.id}" title="Más opciones" aria-label="Más opciones"><i class="ti ti-dots"></i></button>
          <div class="card-dot-dropdown" id="dotmenu-${ai.id}">
            <button class="card-dot-item" data-action="dot-rename" data-ai-id="${ai.id}"><span class="dot-item-icon">✎</span> Renombrar</button>
            ${_isAvail ? `<button class="card-dot-item" data-action="interrupt" data-ai-id="${ai.id}"><span class="dot-item-icon">⛓️‍💥</span> Interrumpir sesión</button>` : ''}
            ${_isAvail ? `<button class="card-dot-item" data-action="dot-blind-exhaust" data-ai-id="${ai.id}"><span class="dot-item-icon">🔴</span> Agotar</button>` : ''}
            ${!_isAvail ? `<button class="card-dot-item" data-action="dot-correct-hora" data-ai-id="${ai.id}"><span class="dot-item-icon">⏰</span> Corregir hora de desbloqueo</button>` : ''}
            <button class="card-dot-item${sessTotal < 2 ? ' disabled' : ''}" data-action="dot-download-report" data-ai-id="${ai.id}" title="${sessTotal < 2 ? 'Necesitas al menos 2 sesiones' : 'Descargar reporte markdown'}"${sessTotal < 2 ? ' disabled' : ''}><span class="dot-item-icon">📥</span> Descargar reporte</button>
            <button class="card-dot-item" data-action="dot-avatar" data-ai-id="${ai.id}"><span class="dot-item-icon">🖼️</span> Cambiar avatar</button>
            <hr class="card-dot-divider">
            <div class="danger-zone">
            <button class="card-dot-item danger" data-action="dot-archive" data-ai-id="${ai.id}"><span class="dot-item-icon">⊟</span> Archivar</button>
            <button class="card-dot-item danger" data-action="dot-clear" data-ai-id="${ai.id}"><span class="dot-item-icon">⌫</span> Limpiar historial</button>
            <button class="card-dot-item danger" data-action="dot-delete" data-ai-id="${ai.id}"><span class="dot-item-icon">✕</span> Eliminar IA</button>
            </div>
          </div>
        </div>
        <span class="card-drag-handle" title="Arrastrar para reordenar">⠿</span>
      </div>
    </div>
    ${statsBarHTML}
    <div class="card-body">
      ${inputHTML}
      
    </div>
    ${footerHTML}`;
  // CSS Purity: tag dot background color calculado desde datos → setProperty post-render
  el.querySelectorAll('[data-tag-color]').forEach(dot => {
    dot.style.setProperty('background', dot.dataset.tagColor);
  });

  // T-202605-057: Migración on* → addEventListener post-render
  // ── Textarea paste-ta ──
  const taEl = el.querySelector(`#ta-${ai.id}`);
  if (taEl) {
    taEl.addEventListener('paste', () => {
      handlePaste(ai.id);
    });
    taEl.addEventListener('input', function () {
      handleInput(ai.id);
      this.closest('.paste-ta-wrap')?.classList.toggle('paste-ta-wrap--has-content', this.value.length > 0);
    });
  }
  // ── Blind exhaust hora input ──
  const bexhaustEl = el.querySelector(`#bexhaust-hora-${ai.id}`);
  if (bexhaustEl) {
    bexhaustEl.addEventListener('input', () => { blindExhaustHoraInput(ai.id); });
    bexhaustEl.addEventListener('keydown', (e) => { blindExhaustHoraKey(e, ai.id); });
  }
  // END T-202605-057

  return el;
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
  document.querySelectorAll('textarea[id^="ta-"]').forEach(ta => {
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

// ── Tab pills mobile ─────────────────────────────────────────────────────
function _trackerSwitchCol(col) {
  document.querySelectorAll('.tracker-col').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tracker-col-tab').forEach(btn => btn.classList.remove('active'));

  const colMap = { card: 'tracker-col-card', hist: 'tracker-col-hist' };
  const colEl = document.getElementById(colMap[col]);
  if (colEl) colEl.classList.add('active');

  const tab = document.querySelector(`.tracker-col-tab[data-col="${col}"]`);
  if (tab) tab.classList.add('active');
}

// Inicializar col card como activa en mobile al cargar
(function _trackerInitMobileCol() {
  const cardCol = document.getElementById('tracker-col-card');
  if (cardCol) cardCol.classList.add('active');
})();




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

// ── B-202605-019: Listeners — tracker-col-tabs ───────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.tracker-col-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const col = btn.dataset.col;
      if (col && typeof _trackerSwitchCol === 'function') _trackerSwitchCol(col);
    });
  });
});
// ── END B-202605-019 ─────────────────────────────────────────────────────────


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
        if (typeof _trackerMiniHistSelect === 'function') _trackerMiniHistSelect(sessId || el.dataset.sessId, aiId);
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
      // Footer — blind exhaust
      case 'confirm-blind-exhaust':
        if (typeof confirmBlindExhaust === 'function') confirmBlindExhaust(aiId);
        break;
      case 'cancel-blind-exhaust':
        if (typeof cancelBlindExhaustMode === 'function') cancelBlindExhaustMode(aiId);
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
      case 'dot-blind-exhaust':
        closeCardMenu(aiId);
        if (typeof openBlindExhaustMode === 'function') openBlindExhaustMode(aiId);
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
