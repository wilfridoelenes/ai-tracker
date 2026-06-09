// [PP] v1.2.4 · sprint:PP-S-05 · mod:13 · autor:Rune · 2026-06-08 UTC-6
// locus-projects.js
// Última actualización: 2026-05-19 UTC-6
// Módulo: Vista Proyectos — renderProyectos, renderProject, analytics de proyecto, cronológico
// Extraído de ai-tracker-ai-notes.js

import { _calcRelevanceScore, loadBacklog, getItems} from './locus-backlog-core.js';
import { _getActiveSprint } from './locus-backlog-sprints.js';
import { loadHtmlMap } from './locus-map-viewer.js';
import { relDate } from './locus-session-hora.js';
import { _countProjSessions, _setActiveProjectFilter, _updateProjBreadcrumb, _updateProjFilterBtn, selectProjectFilter, setProjContext } from './locus-proj-core.js';
// openProjModal — accedida via window.* para evitar ciclo con locus-sprint-project.js (T-202606-197)
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';

import { _animateCountUp, fmtMonth, getAnalyticsMonths, sessionDateKey, sessionYM } from './locus-analytics-core.js';

import { openDetail } from './locus-session-popup.js';

import { _projKey, getAI, getAISessions, getProjectSessions, save } from './locus-storage.js';
import { _countProjSessions, _getActiveProjectFilter, _setActiveProjectFilter, _updateProjBreadcrumb, _updateProjFilterBtn, getProjectById, selectProjectFilter, setProjContext } from './locus-proj-core.js';

import { showToast } from './locus-toast.js';

// ── T-202604-061: Analytics — gráfico comparativo mensual ──

// Reutiliza los mismos colores que chrono para consistencia visual
export function renderProyectos() {
  // T-202605-117: Guard de tab activo — skip render si el tab Proyectos no es el visible.
  // AC-4: Command Palette abierto no cuenta como cambio de tab — evaluar tab subyacente.
  // AC-5: si currentTab no es detectable → fail-safe, ejecutar sin guard.
  const _cpOpen = (() => {
    const el = document.getElementById('cp-overlay');
    return el && !el.classList.contains('is-hidden');
  })();
  if (!_cpOpen && typeof currentTab !== 'undefined' && currentTab !== 'proyectos') return;

  const el = document.getElementById('tab-proyectos-inner');
  if (!el) return;

  const allProjects = state.projects || [];
  const activeProjects = allProjects.filter(p => p.status !== 'archived');
  const archivedProjects = allProjects.filter(p => p.status === 'archived');
  const activeProjId = _getActiveProjectFilter();

  // — helpers —
  function _weekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  function _projSessions(proj) {
    return getProjectSessions(proj.id) || [];
  }

  function _sessThisWeek(proj) {
    const from = _weekStart();
    return _projSessions(proj).filter(s => {
      const d = s.date ? new Date(s.date) : null;
      return d && d >= from;
    });
  }

  function _lastSession(proj) {
    const sess = _projSessions(proj).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return sess[0] || null;
  }

  // T-202604-276: tendencia de actividad — compara últimas 2 semanas vs 2 semanas anteriores
  // Retorna: { badge: string|null, dir: "up"|"down"|null }
  function _trend(proj) {
    const sessions = _projSessions(proj);
    if (!sessions.length) return { badge: null, dir: null };
    const now = Date.now();
    const W2 = 14 * 24 * 60 * 60 * 1000;
    const recent = sessions.filter(s => s.date && (now - new Date(s.date).getTime()) <= W2).length;
    const prev   = sessions.filter(s => s.date && (now - new Date(s.date).getTime()) > W2 && (now - new Date(s.date).getTime()) <= W2 * 2).length;
    if (prev === 0 && recent === 0) return { badge: null, dir: null };
    if (prev === 0) return { badge: null, dir: null }; // primer periodo sin base — neutro
    const delta = (recent - prev) / prev;
    if (delta >= 0.2)  return { badge: '<span class="proy2-trend proy2-trend-up">↑ acelerando</span>', dir: "up" };
    if (delta <= -0.2) return { badge: '<span class="proy2-trend proy2-trend-down">↓ desacelerando</span>', dir: "down" };
    return { badge: null, dir: null };
  }

  function _relTimeShort(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 2) return 'ahora';
    if (m < 60) return `hace ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `hace ${d}d`;
    const w = Math.floor(d / 7);
    if (w < 5) return `hace ${w}sem`;
    return `hace ${Math.floor(d / 30)}mes`;
  }

  function _backlogStats(proj) {
    const key = _projKey('backlog-items', proj.id);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const items = JSON.parse(raw);
      if (!items || !items.length) return null;
      // Lógica R-con-hijos: R con hijos → excluir R, contar hijos. R sin hijos → contar R.
      const rCodesWithChildren = new Set(items.filter(i => i.parentId).map(i => i.parentId));
      const countable = items.filter(i => {
        if ((i.code || '')[0] === 'R' && rCodesWithChildren.has(i.code)) return false;
        return i.status !== 'descartado';
      });
      const total = countable.filter(i => i.status === 'pendiente' || i.status === 'done').length;
      const done = countable.filter(i => i.status === 'done').length;
      const pending = countable.filter(i => i.status === 'pendiente').length;
      const highPending = countable.filter(i => i.status === 'pendiente' && i.priority === 'high').length;
      const next = countable.find(i => i.status === 'pendiente');
      return { total, done, pending, highPending, next };
    } catch { return null; }
  }

  function _typeColor(code) {
    if (!code) return 'var(--accent)';
    if (code.startsWith('T')) return 'var(--green)';
    if (code.startsWith('B')) return 'var(--red)';
    if (code.startsWith('R')) return '#38bdf8';
    return '#7c6af7';
  }

  function _effortDots(n) {
    const v = parseInt(n) || 1;
    return '●'.repeat(v) + '○'.repeat(Math.max(0, 3 - v));
  }

  function _buildCard(proj, isArchived, idx = 0) {
    const isSelected = proj.id === activeProjId;
    const weekly = _sessThisWeek(proj);
    const last = _lastSession(proj);
    const bk = _backlogStats(proj);
    // T-202604-276: tendencia — solo para proyectos activos
    const trendData = !isArchived ? _trend(proj) : { badge: null };

    // Icon
    const iconHtml = proj.icon
      ? `<div class="proy2-icon">${esc(proj.icon)}</div>`
      : `<div class="proy2-icon proy2-icon--default" style="--proj-color-bg:${proj.color||'#7c6af7'}22;--proj-color-border:${proj.color||'#7c6af7'}44;--proj-color:${proj.color||'#7c6af7'}">📁</div>`;

    // Badges
    const statusBadge = isArchived
      ? `<span class="proy2-badge proy2-badge-paused">📦 Archivado</span>`
      : `<span class="proy2-badge proy2-badge-active">● Activo</span>`;
    const selectedBadge = ''; // T-375: removed pill — visual handled by card class + CSS
    // T-202604-276: badge de tendencia (solo activos, solo si hay dato)
    const trendBadge = trendData.badge || '';
    // T-202604-272: badge "Estancado" — activos con 7+ días sin sesión
    let stagnantBadge = '';
    if (!isArchived && last) {
      const daysSince = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
      if (daysSince >= 7) {
        stagnantBadge = `<span class="proy2-badge proy2-badge-stagnant">⏸ Estancado · ${daysSince}d</span>`;
      }
    }

    // Actions — T-202604-318: Eliminar con inline confirm, sin modal global
    const actionsHtml = isArchived
      ? `<button class="proy2-btn" data-action="proj-restore" data-proj-id="${proj.id}">↩ Restaurar</button>
         <button class="proy2-btn" data-action="proj-edit" data-proj-id="${proj.id}">Editar</button>
         <button class="proy2-btn proy2-btn-danger" data-action="proj-delete-inline" data-proj-id="${proj.id}" title="Eliminar">✕</button>`
      : `<button class="proy2-btn proy2-btn-icon" data-action="proj-archive" data-proj-id="${proj.id}" title="Archivar">📦</button>
         <button class="proy2-btn" data-action="proj-edit" data-proj-id="${proj.id}">Editar</button>
         <button class="proy2-btn proy2-btn-primary" data-action="proj-open" data-proj-id="${proj.id}">Abrir</button>
         <button class="proy2-btn proy2-btn-danger" data-action="proj-delete-inline" data-proj-id="${proj.id}" title="Eliminar">✕</button>`;

    // Metrics row — only for active
    let metricsHtml = '';
    if (!isArchived) {
      // Progress
      let progressContent;
      if (!bk) {
        progressContent = `<div class="proy2-metric-value proy2-muted">—</div><div class="proy2-metric-sub">sin backlog</div>`;
      } else {
        const pct = bk.total > 0 ? Math.round((bk.done / bk.total) * 100) : 0;
        progressContent = `
          <div class="proy2-metric-value" data-countup="${pct}">${pct}% <span class="proy2-metric-frac">${bk.done}/${bk.total}</span></div>
          <div class="proy2-progress-bg"><div class="proy2-progress-fill" style="--proj-progress-pct:${pct}%;--proj-progress-color:${proj.color||'var(--green)'}"></div></div>`;
      }

      // Checkpoints this week
      const weekActive = weekly.length > 0;
      const weekContent = weekActive
        ? `<div class="proy2-metric-value proy2-green" data-countup="${weekly.length}">${weekly.length}</div><div class="proy2-metric-sub"><span class="proy2-dot proy2-dot-green"></span>Activo esta semana</div>`
        : `<div class="proy2-metric-value proy2-muted" data-countup="0">0</div><div class="proy2-metric-sub"><span class="proy2-dot proy2-dot-gray"></span>Sin actividad</div>`;

      // Last checkpoint
      const lastContent = last
        ? `<div class="proy2-metric-value proy2-metric-sm">${_relTimeShort(last.date)}</div>`
        : `<div class="proy2-metric-value proy2-muted proy2-metric-sm">—</div>`;

      // Pending items
      let pendContent;
      if (!bk) {
        pendContent = `<div class="proy2-metric-value proy2-muted">—</div>`;
      } else {
        pendContent = `<div class="proy2-metric-value" data-countup="${bk.pending}">${bk.pending}</div>
          <div class="proy2-metric-sub">${bk.highPending > 0 ? `${bk.highPending} prioridad alta` : 'sin prioridad alta'}</div>`;
      }

      metricsHtml = `<div class="proy2-metrics">
        <div class="proy2-metric">
          <div class="proy2-metric-label">Progreso backlog</div>
          ${progressContent}
        </div>
        <div class="proy2-metric">
          <div class="proy2-metric-label">Checkpoints semana</div>
          ${weekContent}
        </div>
        <div class="proy2-metric">
          <div class="proy2-metric-label">Último checkpoint</div>
          ${lastContent}
        </div>
        <div class="proy2-metric">
          <div class="proy2-metric-label">Ítems pendientes</div>
          ${pendContent}
        </div>
      </div>`;
    }

    // R-202604-063 AC-03: velocidad del proyecto en card
    // R-202604-063 AC-05: fecha estimada de cierre
    // Note: _calcProjVelocity and _estimateSprintClose are defined in renderProyectos scope
    let velocityHtml = '';
    let sprintEstHtml = '';
    if (!isArchived) {
      const vel = _calcProjVelocity(proj);
      const est = _estimateSprintClose(proj);
      velocityHtml = `<div class="proy2-velocity">
        <span class="proy2-velocity-label">Velocidad</span>
        <span class="proy2-velocity-val">${vel > 0 ? vel + ' ses/sem' : '—'}</span>
      </div>`;
      sprintEstHtml = `<div class="proy2-sprint-est">
        <span class="proy2-sprint-est-label">Cierre estimado</span>
        <span class="proy2-sprint-est-val">${est || '—'}</span>
      </div>`;
    }

    // R-202604-063 AC-07 (T-377): timeline heatmap horizontal — 14 días
    let heatmapHtml = '';
    if (!isArchived) {
      const sessions = _projSessions(proj);
      const dots = [];
      for (let d = 13; d >= 0; d--) {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - d);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const count = sessions.filter(s => {
          const sd = s.date ? new Date(s.date) : null;
          return sd && sd >= dayStart && sd < dayEnd;
        }).length;
        const level = count === 0 ? 'heat-0' : count === 1 ? 'heat-1' : 'heat-2';
        const label = dayStart.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
        dots.push(`<div class="proy2-heat-dot ${level}" title="${label}${count ? ' · ' + count + ' sesión' + (count > 1 ? 'es' : '') : ''}"></div>`);
      }
      heatmapHtml = `<div class="proy2-heatmap">${dots.join('')}</div>`;
    }

    // Next item
    let nextHtml = '';
    if (bk && bk.next) {
      const c = bk.next.code || '';
      nextHtml = `<div class="proy2-next">
        <span class="proy2-next-label">🚩 Próximo</span>
        <div class="proy2-next-content">
          <div>
            <span class="proy2-next-code" style="--item-type-color:${_typeColor(c)}">${esc(c)}</span>
            ${c ? `<span class="proy2-next-sep">·</span>` : ''}
            <span class="proy2-next-desc">${esc((bk.next.title || '').slice(0, 90))}</span>
          </div>
          <div class="proy2-next-meta">
            <span>${_effortDots(bk.next.effort)}</span>
            ${bk.next.area ? `<span>${esc(bk.next.area)}</span>` : ''}
            ${bk.next.sprint ? `<span>sprint ${esc(bk.next.sprint)}</span>` : '<span>sin sprint</span>'}
          </div>
        </div>
      </div>`;
    } else if (!isArchived) {
      nextHtml = `<div class="proy2-next">
        <span class="proy2-next-label">🚩 Próximo</span>
        <span class="proy2-next-empty">Sin ítems pendientes</span>
      </div>`;
    }

    // T-202604-263: última sesión visible sin click
    let lastSessHtml = '';
    if (!isArchived) {
      if (last) {
        const lastAI = state.ais.find(a => a.id === last.aiId);
        const lastAIName = lastAI ? lastAI.name : (last.aiId || '—');
        const lastDate = relDate(last.date, last.savedAt || last.createdAt) || _relTimeShort(last.date) || '';
        lastSessHtml = `<div class="proy2-last-sess">
          <span class="proy2-last-sess-label">Última sesión</span>
          <div class="proy2-last-sess-body">
            <span class="proy2-last-sess-date">${esc(lastDate)}</span>
            <span class="proy2-last-sess-sep">·</span>
            <span class="proy2-last-sess-ai">${esc(lastAIName)}</span>
            <span class="proy2-last-sess-sep">·</span>
            <span class="proy2-last-sess-title">${esc((last.title || '').slice(0, 80))}</span>
          </div>
        </div>`;
      } else {
        lastSessHtml = `<div class="proy2-last-sess">
          <span class="proy2-last-sess-label">Última sesión</span>
          <span class="proy2-last-sess-empty">Sin sesiones aún</span>
        </div>`;
      }
    }

    const cardClass = ['proy2-card', isSelected ? 'proy2-selected' : '', isArchived ? 'proy2-paused' : ''].filter(Boolean).join(' ');
    const sessCount = _countProjSessions ? _countProjSessions(proj) : (proj.sessions || []).length;
    const deleteMsg = sessCount > 0
      ? `${sessCount} sesiones se conservarán. ¿Eliminar "${esc(proj.name)}"?`
      : `¿Eliminar "${esc(proj.name)}"? Esta acción no se puede deshacer.`;

    return `<div class="${cardClass}" id="proy2-card-${proj.id}" style="--card-idx:${idx}">
      <div class="proy2-header">
        ${iconHtml}
        <div class="proy2-title-block">
          <div class="proy2-name">${esc(proj.name)}</div>
          <div class="proy2-badges">${statusBadge}${selectedBadge}${trendBadge}${stagnantBadge}</div>
        </div>
        <div class="proy2-actions">${actionsHtml}</div>
      </div>
      ${heatmapHtml}
      ${nextHtml}
      ${metricsHtml}
      <div class="proy2-footer-meta">
        ${velocityHtml}
        ${sprintEstHtml}
      </div>
      ${lastSessHtml}
      <div class="inline-confirm proy2-inline-confirm" id="proy2-del-confirm-${proj.id}">
        <div class="inline-confirm-msg">${deleteMsg}</div>
        <div class="inline-confirm-actions">
          <button class="btn-sm danger" data-action="proj-delete-execute" data-proj-id="${proj.id}">Sí, eliminar</button>
          <button class="btn-sm" data-action="proj-delete-cancel" data-proj-id="${proj.id}">Cancelar</button>
        </div>
      </div>
    </div>`;
  }

  // — render —
  const activeCount = activeProjects.length;
  const totalCount = allProjects.length;

  if (!totalCount) {
    el.innerHTML = `
      <div class="proy2-top-bar">
        <div class="proy2-top-title">📁 Proyectos</div>
        <button class="proy2-btn proy2-btn-new" data-action="open-proj-modal">+ Nuevo</button>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">Sin proyectos</div>
        <div class="empty-state-hint">Los proyectos agrupan tus sesiones y backlog. Crea el primero para organizar tu trabajo.</div>
        <button class="empty-state-btn" data-action="open-proj-modal">＋ Nuevo proyecto</button>
      </div>`;
    return;
  }

  // T-202604-389: Activos primero — proyectos con sesión esta semana antes que inactivos
  const sortedActiveProjects = [...activeProjects].sort((a, b) => {
    const aActive = _sessThisWeek(a).length > 0 ? 1 : 0;
    const bActive = _sessThisWeek(b).length > 0 ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    // secundario: último checkpoint más reciente primero
    const aLast = _lastSession(a);
    const bLast = _lastSession(b);
    return new Date(bLast?.date || 0) - new Date(aLast?.date || 0);
  });
  const activeCardsHtml = sortedActiveProjects.map((p, i) => _buildCard(p, false, i)).join('');

  const archivedOpen = localStorage.getItem('proy2-archived-open') !== '0';
  const archivedSectionHtml = archivedProjects.length
    ? `<div class="proy2-archived-section">
        <button data-action="toggle-archived-section" class="proy2-archived-toggle">
          <span>${archivedOpen ? '▾' : '▸'}</span>
          <span>Archivados (${archivedProjects.length})</span>
        </button>
        ${archivedOpen ? archivedProjects.map((p, i) => _buildCard(p, true, i)).join('') : ''}
      </div>`
    : '';

  // R-202604-063 AC-02: velocidad = sesiones/semana promedio últimas 4 semanas por proyecto
  function _calcProjVelocity(proj) {
    const sessions = _projSessions(proj);
    if (!sessions.length) return 0;
    const now = Date.now();
    const W4 = 28 * 24 * 60 * 60 * 1000;
    const recent = sessions.filter(s => s.date && (now - new Date(s.date).getTime()) <= W4);
    return Math.round((recent.length / 4) * 10) / 10; // 1 decimal
  }

  // R-202604-063 AC-04: fecha estimada de cierre basada en ítems pendientes / velocidad
  function _estimateSprintClose(proj) {
    const vel = _calcProjVelocity(proj);
    if (vel === 0) return null;
    const bk = _backlogStats(proj);
    if (!bk || bk.pending === 0) return null;
    const weeksNeeded = bk.pending / vel;
    const closeDate = new Date(Date.now() + weeksNeeded * 7 * 24 * 60 * 60 * 1000);
    const dd = String(closeDate.getDate()).padStart(2, '0');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `~${dd} ${months[closeDate.getMonth()]}`;
  }

  // R-202604-063 AC-06: sugerencia del día — proyecto con más high priority sin sesión esta semana
  function _suggestionProj() {
    const candidates = activeProjects.filter(p => _sessThisWeek(p).length === 0);
    if (!candidates.length) return null;
    const scored = candidates.map(p => {
      const bk = _backlogStats(p);
      return { proj: p, score: bk ? bk.highPending : 0 };
    }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);
    return scored[0] ? scored[0].proj : null;
  }
  const suggestion = _suggestionProj();

  // R-202604-063 AC-01: header ecosistema — total activos + sesiones globales + high priority urgente
  const totalGlobalSess = (state.ais || []).reduce((acc, ai) => {
    return acc + (getAISessions ? getAISessions(ai.id).length : 0);
  }, 0);
  const allHighPending = activeProjects.reduce((acc, p) => {
    const bk = _backlogStats(p);
    return acc + (bk ? bk.highPending : 0);
  }, 0);

  const suggestionHtml = suggestion
    ? `<div class="proy2-suggestion">💡 Sugerencia: <span class="proy2-suggestion-name">${esc(suggestion.name)}</span> — sin actividad esta semana, tiene ítems de prioridad alta</div>`
    : '';

  const ecosHeaderHtml = `
    <div class="proy2-eco-header">
      <div class="proy2-eco-stats">
        <span class="proy2-eco-stat"><strong>${activeCount}</strong> proyecto${activeCount !== 1 ? 's' : ''}</span>
        <span class="proy2-eco-sep">·</span>
        <span class="proy2-eco-stat"><strong>${totalGlobalSess}</strong> sesiones totales</span>
        ${allHighPending > 0 ? `<span class="proy2-eco-sep">·</span><span class="proy2-eco-stat proy2-eco-high"><strong>${allHighPending}</strong> prioridad alta pendientes</span>` : ''}
      </div>
      ${suggestionHtml}
    </div>`;

  el.innerHTML = `
    <div class="proy2-top-bar">
      <div class="proy2-top-title">📁 Proyectos <span class="proy2-top-count">${activeCount} activo${activeCount !== 1 ? 's' : ''}</span></div>
      <button class="proy2-btn proy2-btn-new" data-action="open-proj-modal">+ Nuevo</button>
    </div>
    ${ecosHeaderHtml}
    <div class="proy2-list">
      ${activeCardsHtml}
      ${archivedSectionHtml}
    </div>`;

  // T-202604-380: count-up solo en primer render de página
  _animateCountUp(el);
}

// T-202604-318: confirmación inline en card de proyecto — sin modal global
function _proyDeleteInline(projId) {
  const el = document.getElementById(`proy2-del-confirm-${projId}`);
  if (!el) return;
  el.classList.toggle('open');
}

function _proyDeleteExecute(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  state.projects = (state.projects || []).filter(p => p.id !== projId);
  if (_getActiveProjectFilter() === projId) {
    _setActiveProjectFilter('');
  }
  save();
  renderProyectos();
  _updateProjBreadcrumb();
  showToast('success', `Proyecto eliminado`);
}

function _proyAbrir(projId) {
  _setActiveProjectFilter(projId);
  _updateProjBreadcrumb();
  _updateProjFilterBtn();
  // Recargar templates con las keys del proyecto recién activado
  loadBacklog();
  loadHtmlMap();
  // Refrescar el sub-tab activo si Templates está visible
  if (currentSubTab) switchSubTab(currentSubTab);
  switchTab('hoy');
  showToast('info', 'Proyecto activo: ' + (getProjectById(projId)?.name || projId));
}



// ── T-057: Vista cronológica ──
// Colores por IA — generados dinámicamente a partir del índice
const CHRONO_COLORS = ['#7c6af7','#2ecc78','#38bdf8','#e8a832','#e85555','#f472b6','#a3e635','#fb923c'];

function getAIColor(aiId) {
  const idx = state.ais.findIndex(a => a.id === aiId);
  return CHRONO_COLORS[idx % CHRONO_COLORS.length] || '#7c6af7';
}


// T-078: Estado de filtros inline de la vista proyecto
let _projViewFilterAI = ''; // aiId activo o ''
let _projViewSearch = '';

function renderProject(query) {
  // query viene del buscador global — sincronizar con estado interno
  if (query !== undefined) _projViewSearch = query.toLowerCase().trim();
  const q = _projViewSearch;
  // Usar tracker-detail como contenedor para que overflow-y:auto active el scroll
  const trackerPanel = document.querySelector('.tracker-detail') || document.getElementById('tab-tracker');

  // Limpiar vista anterior si existe
  ['project-view-header','project-view-title','project-sess-list','project-list'].forEach(id => {
    const el = document.getElementById(id); if (el) el.remove();
  });

  // Construir lista plana de sesiones según filtro global de proyecto
  const filterId = _getActiveProjectFilter();
  const sourceAIs = state.ais.filter(a => !a.archived);
  const _projForFilter = filterId ? getProjectById(filterId) : null;
  const _aiIdsInProj = _projForFilter ? new Set((_projForFilter.sessions || []).map(s => s.aiId).filter(Boolean)) : null;
  let filteredAIs = (_aiIdsInProj)
    ? sourceAIs.filter(a => _aiIdsInProj.has(a.id))
    : sourceAIs;

  // Aplicar filtro inline de IA
  if (_projViewFilterAI) filteredAIs = filteredAIs.filter(a => a.id === _projViewFilterAI);

  let allSessions = [];
  filteredAIs.forEach(ai => {
    getAISessions(ai.id).forEach(s => {
      // Si hay filtro de proyecto, solo incluir sesiones de ese proyecto
      if (filterId && s.projectId !== filterId) return;
      if (q && !(
        s.title.toLowerCase().includes(q) ||
        (s.summary || '').toLowerCase().includes(q) ||
        ai.name.toLowerCase().includes(q)
      )) return;
      allSessions.push({ ai, s });
    });
  });

  // Ordenar más reciente primero
  allSessions.sort((a, b) => new Date(b.s.date || 0) - new Date(a.s.date || 0));

  // ── Stats card (sobre todas las sesiones de las AIs en scope, sin filtros inline) ──
  const scopeAIs = _aiIdsInProj ? sourceAIs.filter(a => _aiIdsInProj.has(a.id)) : sourceAIs;
  const scopeSessions = filterId
    ? scopeAIs.flatMap(a => getAISessions(a.id).filter(s => s.projectId === filterId))
    : scopeAIs.flatMap(a => a.sessions);
  const totalSess = scopeSessions.length;
  const lastSessDate = scopeSessions.length
    ? scopeSessions.reduce((latest, s) => {
        const d = new Date(s.date || 0);
        return d > latest ? d : latest;
      }, new Date(0))
    : null;
  const lastSessLabel = lastSessDate && lastSessDate > new Date(0)
    ? (relDate(lastSessDate.toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'})) || lastSessDate.toLocaleDateString('es-MX', {day:'2-digit', month:'short'}))
    : '—';
  const uniqueAIs = scopeAIs.filter(a => a.sessions.length > 0).length;
  const now = new Date();
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);
  const activeDays30 = new Set(
    scopeSessions
      .filter(s => s.date && new Date(s.date) >= monthAgo)
      .map(s => new Date(s.date).toDateString())
  ).size;

  const projName = filterId ? (getProjectById(filterId)?.name || 'Proyecto') : 'Todos';

  // R-202604-045: empty state cuando el proyecto activo no tiene sesiones
  // Usa scopeSessions (fuente real) — _projObj.sessions puede estar vacío en path legacy v2
  if (filterId && scopeSessions.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.id = 'project-view-header';
    emptyEl.className = 'proj-no-sessions-empty';
    emptyEl.innerHTML = `
      <div class="proj-no-sessions-icon">🗂</div>
      <div class="proj-no-sessions-title">Proyecto nuevo — sin sesiones aún</div>
      <div class="proj-no-sessions-hint">Inicia una sesión desde el Tracker y asígnala a este proyecto para empezar a registrar.</div>
      <button class="proj-no-sessions-cta" data-action="go-to-tracker">Ir al Tracker →</button>`;
    trackerPanel.appendChild(emptyEl);
    return;
  }

  // T-202604-030: próximo paso de la última sesión del proyecto activo
  const _projSessions = filterId
    ? (getProjectById(filterId)?.sessions || []).slice().sort((a,b) => new Date(b.date||0) - new Date(a.date||0))
    : [];
  const _lastNextStep = _projSessions.find(s => s.nextStep)?.nextStep || '';

  // Header con stats
  const headerEl = document.createElement('div');
  headerEl.id = 'project-view-header';
  headerEl.className = 'proj-view-header';

  // Chips de filtro por IA
  const aiChips = scopeAIs.length > 1
    ? `<span class="proj-filter-label">Filtrar por IA:</span>` + scopeAIs.map(a =>
        `<span class="proj-filter-chip${_projViewFilterAI === a.id ? ' active' : ''}"
          data-action="toggle-ai-filter" data-ai-id="${a.id}">${esc(a.name)}</span>`
      ).join('')
    : '';

  headerEl.innerHTML = `
    <div class="proj-stats-card">
      <div class="proj-stat-item">
        <div class="proj-stat-value">${totalSess}</div>
        <div class="proj-stat-label">Sesiones totales</div>
      </div>
      <div class="proj-stat-item">
        <div class="proj-stat-value proj-stat-value--sm">${lastSessLabel}</div>
        <div class="proj-stat-label">Última sesión</div>
      </div>
      <div class="proj-stat-item">
        <div class="proj-stat-value">${uniqueAIs}</div>
        <div class="proj-stat-label">IAs involucradas</div>
      </div>
      <div class="proj-stat-item">
        <div class="proj-stat-value">${activeDays30}</div>
        <div class="proj-stat-label">Días activos /30</div>
      </div>
    </div>
    ${_lastNextStep ? `<div class="proj-next-step"><span class="proj-next-step-arrow">→</span><span>${esc(_lastNextStep)}</span></div>` : ''}
    <div class="proj-filters-row">
      ${aiChips}
      <input class="proj-search-input" type="text" placeholder="Buscar en proyecto…"
        value="${esc(q)}" oninput="_projViewSearchInput(this.value)"
        autocomplete="off">
    </div>`;
  trackerPanel.appendChild(headerEl);

  // T-079: Botón toggle analytics + sección analytics
  if (filterId) {
    const analyticsToggleEl = document.createElement('div');
    analyticsToggleEl.className = 'proj-analytics-toggle-wrap';
    analyticsToggleEl.innerHTML = `<button class="proj-analytics-toggle" id="proj-analytics-toggle-btn"
      data-action="toggle-proj-analytics" data-filter-id="${filterId}">📊 Ver analytics del proyecto</button>`;
    trackerPanel.appendChild(analyticsToggleEl);

    const analyticsEl = document.createElement('div');
    analyticsEl.id = 'proj-analytics-section';
    analyticsEl.className = 'proj-analytics-section';
    trackerPanel.appendChild(analyticsEl);

    // Restaurar estado abierto si estaba abierto
    if (renderProject._analyticsOpen) {
      analyticsEl.classList.add('open');
      renderProjectAnalytics(filterId);
      const btn = analyticsToggleEl.querySelector('#proj-analytics-toggle-btn');
      if (btn) btn.textContent = '📊 Ocultar analytics';
    }
  }

  // Título de lista
  const titleEl = document.createElement('div');
  titleEl.id = 'project-view-title';
  titleEl.className = 'proj-view-title';
  titleEl.textContent = `${projName} — ${allSessions.length} sesión${allSessions.length !== 1 ? 'es' : ''}`;
  trackerPanel.appendChild(titleEl);

  // T-202604-265: indicador salud sprint activo
  if (filterId) {
    const sprintEl = document.createElement('div');
    sprintEl.id = 'project-sprint-health';
    sprintEl.className = 'proj-sprint-health';
    const activeSprint = _getActiveSprint();
    if (activeSprint) {
      const sprintItems = (typeof getItems() !== 'undefined' ? getItems() : [])
        .filter(i => i.sprint === activeSprint.id && i.status !== 'descartado');
      const total = sprintItems.length;
      const done = sprintItems.filter(i => i.status === 'done').length;
      const totalEffort = sprintItems.reduce((sum, i) => sum + (parseInt(i.effort) || 1), 0);
      const doneEffort = sprintItems.filter(i => i.status === 'done').reduce((sum, i) => sum + (parseInt(i.effort) || 1), 0);
      const pct = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;
      const sprintLabel = activeSprint.label || activeSprint.id;
      sprintEl.innerHTML = `
        <div class="sprint-health-header">
          <span class="sprint-health-label">${esc(sprintLabel)}</span>
          <span class="sprint-health-counts">${done}/${total} ítems · ${pct}% effort</span>
        </div>
        <div class="sprint-health-bar-wrap">
          <div class="sprint-health-bar" style="--sprint-pct:${pct}%"></div>
        </div>`;
    } else {
      sprintEl.innerHTML = `
        <div class="sprint-health-empty">
          <span class="sprint-health-none">Sin sprint activo</span>
          <button class="btn-ghost btn-sm sprint-health-cta" data-action="go-to-sprint-create">+ Crear sprint</button>
        </div>`;
    }
    trackerPanel.appendChild(sprintEl);
  }

  // T-202604-285: contexto rico del proyecto — preview MD + secciones colapsables + edición inline
  if (filterId) {
    const proj = getProjectById(filterId);
    const ctxRaw = proj ? (proj.context || '') : '';
    const ctxEl = document.createElement('div');
    ctxEl.id = 'project-ctx-section';
    ctxEl.className = 'proj-ctx-section';
    ctxEl.dataset.projId = filterId;
    ctxEl.dataset.editing = '0';

    const _renderCtxPreview = (md) => {
      if (!md) return '<div class="proj-ctx-empty">Sin contexto registrado. Haz click en Editar para agregar.</div>';
      // Dividir por encabezados ## — secciones colapsables
      const sections = [];
      let currentTitle = null;
      let currentLines = [];
      for (const line of md.split('\n')) {
        if (/^## /.test(line)) {
          if (currentTitle !== null) sections.push({ title: currentTitle, body: currentLines.join('\n') });
          else if (currentLines.some(l => l.trim())) sections.push({ title: null, body: currentLines.join('\n') });
          currentTitle = line.replace(/^## /, '').trim();
          currentLines = [];
        } else {
          currentLines.push(line);
        }
      }
      if (currentTitle !== null) sections.push({ title: currentTitle, body: currentLines.join('\n') });
      else if (currentLines.some(l => l.trim())) sections.push({ title: null, body: currentLines.join('\n') });

      if (!sections.length) return '<div class="proj-ctx-empty">Sin contenido</div>';

      // Si no hay secciones ## → render plano sin colapsables
      if (sections.length === 1 && sections[0].title === null) {
        return `<div class="proj-ctx-body">${renderContextMd(sections[0].body)}</div>`;
      }

      return sections.map((sec, idx) => {
        const sId = `proj-ctx-sec-${filterId}-${idx}`;
        if (sec.title === null) {
          return `<div class="proj-ctx-body proj-ctx-lead">${renderContextMd(sec.body)}</div>`;
        }
        return `<div class="proj-ctx-sec">
          <div class="proj-ctx-sec-header" data-action="ctx-toggle-sec" data-sec-id="${sId}">
            <span class="proj-ctx-sec-arrow" id="${sId}-arrow">▾</span>
            <span class="proj-ctx-sec-title">${esc(sec.title)}</span>
          </div>
          <div class="proj-ctx-sec-body" id="${sId}">${renderContextMd(sec.body)}</div>
        </div>`;
      }).join('');
    };

    const _buildCtxEl = (editing) => {
      if (editing) {
        ctxEl.innerHTML = `
          <div class="proj-ctx-header">
            <span class="proj-ctx-label">📄 Contexto</span>
            <div class="proj-ctx-actions">
              <button class="proj-ctx-btn proj-ctx-save" data-action="ctx-save" data-filter-id="${filterId}">Guardar</button>
              <button class="proj-ctx-btn proj-ctx-cancel" data-action="ctx-cancel" data-filter-id="${filterId}">Cancelar</button>
            </div>
          </div>
          <textarea class="proj-ctx-textarea" id="proj-ctx-ta-${filterId}">${esc(ctxRaw)}</textarea>`;
        setTimeout(() => {
          const ta = document.getElementById('proj-ctx-ta-' + filterId);
          if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
        }, 50);
      } else {
        ctxEl.innerHTML = `
          <div class="proj-ctx-header">
            <span class="proj-ctx-label">📄 Contexto</span>
            <button class="proj-ctx-btn proj-ctx-edit" data-action="ctx-start-edit" data-filter-id="${filterId}">Editar</button>
          </div>
          <div class="proj-ctx-preview">${_renderCtxPreview(ctxRaw)}</div>`;
      }
    };

    _buildCtxEl(false);
    trackerPanel.appendChild(ctxEl);
  }

  // T-202604-264: top 3 ítems sugeridos por score
  if (filterId) {
    const suggestedEl = document.createElement('div');
    suggestedEl.id = 'project-suggested-items';
    suggestedEl.className = 'proj-suggested-section';
    const candidateItems = (typeof getItems() !== 'undefined' ? getItems() : [])
      .filter(i => i.status === 'pendiente')
      .map(i => ({ ...i, _score: _calcRelevanceScore(i) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 3);
    if (candidateItems.length) {
      const typeColor = c => {
        if (!c) return 'var(--accent)';
        if (c[0] === 'T') return 'var(--green, #2ecc78)';
        if (c[0] === 'B') return 'var(--red, #e85555)';
        if (c[0] === 'R') return '#38bdf8';
        return '#7c6af7';
      };
      suggestedEl.innerHTML = `
        <div class="proj-suggested-header">
          <span class="proj-suggested-title">⚡ Sugeridos</span>
          <span class="proj-suggested-count">${candidateItems.length}</span>
        </div>
        <div class="proj-suggested-list">
          ${candidateItems.map(i => `
            <div class="proj-suggested-row" data-action="qn-nav-to-item" data-code="${esc(i.code)}">>
              <span class="proj-suggested-code" style="--item-type-color:${typeColor(i.code)}">${esc(i.code)}</span>
              <span class="proj-suggested-desc">${esc((i.title || i.desc || '').slice(0, 80))}</span>
              <span class="proj-suggested-score" title="Score de relevancia">${i._score}</span>
            </div>`).join('')}
        </div>`;
    } else {
      suggestedEl.innerHTML = `
        <div class="proj-suggested-header">
          <span class="proj-suggested-title">⚡ Sugeridos</span>
        </div>
        <div class="proj-suggested-empty">Sin ítems pendientes</div>`;
    }
    trackerPanel.appendChild(suggestedEl);
  }

  // T-202604-266: sección Bloqueados — ítems con sprint asignado y 14+ días sin movimiento
  if (filterId) {
    const BLOCKED_DAYS = 14;
    const blockedCutoff = Date.now() - BLOCKED_DAYS * 24 * 60 * 60 * 1000;
    const blockedItems = (typeof getItems() !== 'undefined' ? getItems() : [])
      .filter(i =>
        i.sprint &&
        i.status === 'pendiente' &&
        (i.updatedAt || i.createdAt) &&
        (i.updatedAt || i.createdAt) < blockedCutoff
      )
      .map(i => ({
        ...i,
        _daysBlocked: Math.floor((Date.now() - (i.updatedAt || i.createdAt)) / 86400000)
      }))
      .sort((a, b) => b._daysBlocked - a._daysBlocked);

    if (blockedItems.length) {
      const blockedEl = document.createElement('div');
      blockedEl.id = 'project-blocked-items';
      blockedEl.className = 'proj-blocked-section';
      const typeColor = c => {
        if (!c) return 'var(--accent)';
        if (c[0] === 'T') return 'var(--green, #2ecc78)';
        if (c[0] === 'B') return 'var(--red, #e85555)';
        if (c[0] === 'R') return '#38bdf8';
        return '#7c6af7';
      };
      blockedEl.innerHTML = `
        <div class="proj-blocked-header">
          <span class="proj-blocked-title">🔒 Bloqueados</span>
          <span class="proj-blocked-count">${blockedItems.length}</span>
        </div>
        <div class="proj-blocked-list">
          ${blockedItems.map(i => `
            <div class="proj-blocked-row" data-action="qn-nav-to-item" data-code="${esc(i.code)}">>
              <span class="proj-blocked-code" style="--item-type-color:${typeColor(i.code)}">${esc(i.code)}</span>
              <span class="proj-blocked-desc">${esc((i.title || i.desc || '').slice(0, 80))}</span>
              <span class="proj-blocked-days" title="${i._daysBlocked} días sin movimiento">${i._daysBlocked}d</span>
            </div>`).join('')}
        </div>`;
      trackerPanel.appendChild(blockedEl);
    }
  }

  const listEl = document.createElement('div');
  listEl.id = 'project-sess-list';
  listEl.className = 'proj-sess-list';

  const countEl = document.getElementById('search-count');
  if (q && countEl) countEl.textContent = `${allSessions.length} resultado${allSessions.length !== 1 ? 's' : ''} encontrado${allSessions.length !== 1 ? 's' : ''}`;
  else if (countEl) countEl.textContent = '';

  if (!allSessions.length) {
    listEl.innerHTML = `<div class="project-empty">${q || _projViewFilterAI ? 'Sin resultados con los filtros actuales' : 'Sin sesiones registradas'}</div>`;
  } else {
    listEl.innerHTML = allSessions.map(({ ai, s }) =>
      `<div class="proj-sess-row" data-action="open-session-detail" data-ai-id="${ai.id}" data-sess-id="${s.id}">>
        <span class="proj-sess-ai">${esc(ai.name)}</span>
        <span class="proj-sess-title">${esc(s.title)}</span>
        <span class="proj-sess-date">${relDate(s.date, s.savedAt || s.createdAt) || s.dateShort || ''}</span>
      </div>`
    ).join('');
  }
  trackerPanel.appendChild(listEl);

}
// T-202604-289: render interno de la sección Decisiones (reutilizable por CRUD)
function _renderDecisionsSection(el, projId, decisions) {
  const sorted = [...decisions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const rowsHtml = sorted.map(d => `
    <div class="proj-dec-row" data-dec-id="${esc(d.id)}">
      <div class="proj-dec-body">
        <div class="proj-dec-text" id="proj-dec-text-${esc(d.id)}">${esc(d.text)}</div>
        <div class="proj-dec-meta">
          <span class="proj-dec-date">${esc(d.date || '—')}</span>
          ${d.author ? `<span class="proj-dec-sep">·</span><span class="proj-dec-author">${esc(d.author)}</span>` : ''}
        </div>
      </div>
      <div class="proj-dec-actions">
        <button class="proj-dec-btn" title="Editar" data-action="dec-edit" data-proj-id="${esc(projId)}" data-dec-id="${esc(d.id)}">✎</button>
        <button class="proj-dec-btn proj-dec-btn-del" title="Eliminar" data-action="dec-delete" data-proj-id="${esc(projId)}" data-dec-id="${esc(d.id)}">✕</button>
      </div>
    </div>`).join('');

  el.innerHTML = `
    <div class="proj-dec-header">
      <span class="proj-dec-title">🗂 Decisiones</span>
      ${decisions.length ? `<span class="proj-dec-count">${decisions.length}</span>` : ''}
      <button class="proj-dec-add-btn" data-action="dec-add" data-proj-id="${esc(projId)}" title="Agregar decisión">＋ Agregar</button>
    </div>
    <div id="proj-dec-form-${esc(projId)}" class="proj-dec-form hidden">
      <textarea class="proj-dec-textarea" id="proj-dec-ta-${esc(projId)}" placeholder="Describe la decisión tomada…" rows="3"></textarea>
      <div class="proj-dec-form-row">
        <input class="proj-dec-input" id="proj-dec-author-${esc(projId)}" type="text" placeholder="Autor / rol (ej: PO · Alex)" maxlength="60">
        <div class="proj-dec-form-actions">
          <button class="proj-dec-btn proj-dec-btn-save" data-action="dec-save" data-proj-id="${esc(projId)}">Guardar</button>
          <button class="proj-dec-btn" data-action="dec-cancel" data-proj-id="${esc(projId)}">Cancelar</button>
        </div>
      </div>
    </div>
    ${sorted.length
      ? `<div class="proj-dec-list">${rowsHtml}</div>`
      : `<div class="proj-dec-empty">Sin decisiones registradas.</div>`}`;
}

// T-202604-289: abrir formulario de nueva decisión
function _projOpenAddDecision(projId) {
  const form = document.getElementById('proj-dec-form-' + projId);
  if (!form) return;
  const ta = document.getElementById('proj-dec-ta-' + projId);
  const auth = document.getElementById('proj-dec-author-' + projId);
  if (ta) { ta.value = ''; ta.removeAttribute('data-edit-id'); }
  if (auth) auth.value = '';
  form.classList.remove('is-hidden');
  if (ta) setTimeout(() => ta.focus(), 40);
}

// T-202604-289: guardar decisión (nueva o edición)
function _projSaveDecision(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const ta = document.getElementById('proj-dec-ta-' + projId);
  const auth = document.getElementById('proj-dec-author-' + projId);
  const text = (ta ? ta.value.trim() : '');
  if (!text) { showToast('warning', 'El texto de la decisión no puede estar vacío'); return; }
  const editId = ta ? ta.getAttribute('data-edit-id') : null;
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  if (!Array.isArray(proj.decisions)) proj.decisions = [];
  if (editId) {
    const dec = proj.decisions.find(d => d.id === editId);
    if (dec) { dec.text = text; dec.author = (auth ? auth.value.trim() : ''); dec.updatedAt = Date.now(); }
  } else {
    proj.decisions.push({ id: 'dec-' + Date.now(), text, author: (auth ? auth.value.trim() : ''), date: dateStr, createdAt: Date.now() });
  }
  save();
  const el = document.getElementById('project-decisions-section');
  if (el) _renderDecisionsSection(el, projId, proj.decisions);
  showToast('success', editId ? 'Decisión actualizada' : 'Decisión guardada');
}

// T-202604-289: cancelar formulario
function _projCancelDecision(projId) {
  const form = document.getElementById('proj-dec-form-' + projId);
  if (form) form.classList.add('is-hidden');
}

// T-202604-289: abrir formulario en modo edición
function _projEditDecision(projId, decId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const dec = (proj.decisions || []).find(d => d.id === decId);
  if (!dec) return;
  const form = document.getElementById('proj-dec-form-' + projId);
  const ta = document.getElementById('proj-dec-ta-' + projId);
  const auth = document.getElementById('proj-dec-author-' + projId);
  if (!form || !ta) return;
  ta.value = dec.text || '';
  ta.setAttribute('data-edit-id', decId);
  if (auth) auth.value = dec.author || '';
  form.classList.remove('is-hidden');
  setTimeout(() => ta.focus(), 40);
}

// T-202604-289: eliminar decisión con confirmación inline
function _projDeleteDecision(projId, decId) {
  const proj = getProjectById(projId);
  if (!proj || !Array.isArray(proj.decisions)) return;
  const idx = proj.decisions.findIndex(d => d.id === decId);
  if (idx < 0) return;
  proj.decisions.splice(idx, 1);
  save();
  const el = document.getElementById('project-decisions-section');
  if (el) _renderDecisionsSection(el, projId, proj.decisions);
  showToast('success', 'Decisión eliminada');
}

// T-202604-266: navegar a ítem en Backlog y hacer scroll al elemento
function _qnNavToItem(code) {
  if (!code) return;
  switchTab('backlog');
  switchSubTab('backlog');
  // Esperar render del backlog antes de scroll
  setTimeout(() => {
    // buildBacklogItem genera id="bl-item-{code}" — intentar directo primero
    let el = document.getElementById('bl-item-' + code);
    // Fallback: buscar por data-code
    if (!el) el = document.querySelector(`[data-code="${CSS.escape(code)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
}

// T-202604-285: helpers edición inline de contexto de proyecto
function _projCtxStartEdit(projId) {
  const ctxEl = document.getElementById('project-ctx-section');
  if (!ctxEl) return;
  ctxEl.dataset.editing = '1';
  const proj = getProjectById(projId);
  const raw = proj ? (proj.context || '') : '';
  ctxEl.innerHTML = `
    <div class="proj-ctx-header">
      <span class="proj-ctx-label">📄 Contexto</span>
      <div class="proj-ctx-actions">
        <button class="proj-ctx-btn proj-ctx-save" data-action="ctx-save" data-filter-id="${projId}">Guardar</button>
        <button class="proj-ctx-btn proj-ctx-cancel" data-action="ctx-cancel" data-filter-id="${projId}">Cancelar</button>
      </div>
    </div>
    <textarea class="proj-ctx-textarea" id="proj-ctx-ta-${projId}">${esc(raw)}</textarea>`;
  setTimeout(() => {
    const ta = document.getElementById('proj-ctx-ta-' + projId);
    if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }, 50);
}

function _projCtxSave(projId) {
  const ta = document.getElementById('proj-ctx-ta-' + projId);
  if (!ta) return;
  const newText = ta.value;
  setProjContext(projId, newText);
  renderProject();
}

function _projCtxCancelEdit(projId) {
  renderProject();
}

function _projCtxToggleSec(sId) {
  const body = document.getElementById(sId);
  const arrow = document.getElementById(sId + '-arrow');
  if (!body) return;
  const isOpen = !body.classList.contains('collapsed');
  body.classList.toggle('collapsed', isOpen);
  if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
}

function _projToggleAIFilter(aiId) {
  _projViewFilterAI = _projViewFilterAI === aiId ? '' : aiId;
  renderProject();
}

function _projViewSearchInput(val) {
  _projViewSearch = val.toLowerCase().trim();
  renderProject();
}

// ── T-079: Analytics por proyecto ──
renderProject._analyticsOpen = false;

function _toggleProjAnalytics(projId) {
  const section = document.getElementById('proj-analytics-section');
  const btn = document.getElementById('proj-analytics-toggle-btn');
  if (!section) return;
  renderProject._analyticsOpen = !section.classList.contains('open');
  section.classList.toggle('open');
  if (btn) btn.textContent = section.classList.contains('open') ? '📊 Ocultar analytics' : '📊 Ver analytics del proyecto';
  if (section.classList.contains('open')) renderProjectAnalytics(projId);
}

function renderProjectAnalytics(projId) {
  const section = document.getElementById('proj-analytics-section');
  if (!section) return;
  const proj = getProjectById(projId);
  if (!proj) return;

  const allSess = getProjectSessions(projId);
  const projAIIds = new Set(allSess.map(s => s.aiId).filter(Boolean));
  const projAIs = state.ais.filter(ai => projAIIds.has(ai.id) && !ai.archived);

  if (!allSess.length) {
    section.innerHTML = `<div class="proj-analytics-block"><div class="proj-analytics-block-title">Sin datos</div>
      <div class="proj-no-data-hint">Este proyecto no tiene sesiones registradas aún.</div></div>`;
    return;
  }

  // ── 1. Gráfico sesiones/mes (respeta rango T-047) ──
  const now = new Date();
  const months = getAnalyticsMonths();
  const monthLabels = months.map(ym => fmtMonth(ym));
  const rangeLabel = _analyticsRange === 0 ? 'Todo el historial' : `Últimos ${_analyticsRange} mes${_analyticsRange > 1 ? 'es' : ''}`;
  const counts = months.map(ym =>
    allSess.filter(s => sessionYM(s) === ym).length
  );
  const maxC = Math.max(...counts, 1);
  const barWidth = 100 / months.length;

  let barsHtml = counts.map((c, i) => {
    return `<div class="proj-analytics-col">
      <div class="proj-analytics-col-code">${c || ''}</div>
      <div class="proj-analytics-bar-wrap">
        <div class="proj-analytics-sess-bar" style="--sess-bar-h:${pct}%;--sess-bar-min-h:${c?2:0}px"></div>
      </div>
      <div class="proj-analytics-bar-label">${monthLabels[i]}</div>
    </div>`;
  }).join('');

  // ── 2. Ranking IAs más activas ──
  const aiRanks = projAIs.map(ai => ({ name: ai.name, count: getProjectSessions(projId).filter(s => s.aiId === ai.id).length }))
    .sort((a, b) => b.count - a.count);
  const maxR = aiRanks[0]?.count || 1;
  const rankHtml = aiRanks.map(r => `
    <div class="proj-ai-rank-row">
      <span class="proj-ai-rank-name">${esc(r.name)}</span>
      <div class="proj-ai-rank-bar-wrap"><div class="proj-ai-rank-bar" style="--rank-bar-pct:${(r.count/maxR*100).toFixed(1)}%"></div></div>
      <span class="proj-ai-rank-count">${r.count}</span>
    </div>`).join('');

  // ── 3. Racha del proyecto ──
  const daySet = new Set(allSess.map(s => sessionDateKey(s)).filter(Boolean));
  let streak = 0, bestStreak = 0, tempStreak = 0;
  const d = new Date();
  // Racha actual
  while (true) {
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (daySet.has(k)) { streak++; d.setDate(d.getDate()-1); }
    else if (streak === 0) { d.setDate(d.getDate()-1); if (d < new Date(now.getFullYear(), now.getMonth()-3, 1)) break; }
    else break;
  }
  // Mejor racha histórica
  const sortedDays = Array.from(daySet).sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { tempStreak = 1; }
    else {
      const prev = new Date(sortedDays[i-1]); prev.setDate(prev.getDate()+1);
      const cur = new Date(sortedDays[i]);
      tempStreak = prev.toDateString() === cur.toDateString() ? tempStreak+1 : 1;
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
  }

  section.innerHTML = `
    <div class="proj-analytics-block">
      <div class="proj-analytics-block-title">Sesiones por mes — ${esc(proj.name)} <span class="proj-analytics-range-label">${rangeLabel}</span></div>
      <div class="proj-analytics-bars-row">${barsHtml}</div>
    </div>
    <div class="proj-analytics-block">
      <div class="proj-analytics-block-title">IAs más activas</div>
      ${rankHtml || '<div class="pi-no-ac">Sin datos</div>'}
    </div>
    <div class="proj-analytics-block proj-analytics-block--flex">
      <div>
        <div class="proj-racha-value">${streak}</div>
        <div class="proj-racha-label">Racha actual (días)</div>
      </div>
      <div>
        <div class="proj-racha-value">${bestStreak}</div>
        <div class="proj-racha-label">Mejor racha (días)</div>
      </div>
      <div>
        <div class="proj-racha-value">${allSess.length}</div>
        <div class="proj-racha-label">Sesiones totales</div>
      </div>
    </div>
    <div class="proj-analytics-export-row">
      <button class="btn-export-analytics" data-action="download-project-report" data-proj-id="${projId}">⬇️ Descargar reporte del proyecto</button>
    </div>`;
}

function downloadProjectReport(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const projSess = getProjectSessions(projId);
  const projAIIds = new Set(projSess.map(s => s.aiId).filter(Boolean));
  const projAIs = state.ais.filter(ai => projAIIds.has(ai.id) && !ai.archived);
  const allSess = projSess
    .map(s => ({ ai: getAI(s.aiId), s }))
    .filter(x => x.ai)
    .sort((a, b) => new Date(b.s.date||0) - new Date(a.s.date||0));

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', {year:'numeric',month:'2-digit',day:'2-digit'});
  let md = `# Reporte de proyecto — ${proj.name}
`;
  md += `Generado: ${dateStr} · ${projSess.length} sesiones · ${projAIs.length} IAs

`;
  md += `## IAs involucradas
`;
  projAIs.forEach(ai => { md += `- **${ai.name}**: ${projSess.filter(s => s.aiId === ai.id).length} sesiones
`; });
  md += `
## Sesiones
`;
  allSess.forEach(({ ai, s }) => {
    md += `
### ${s.title || '(sin título)'}
`;
    md += `**IA:** ${ai.name} · **Fecha:** ${s.date || '—'}
`;
    if (s.summary) md += `**Resumen:** ${s.summary}
`;
    if (s.pending) md += `**Pendiente:** ${s.pending}
`;
  });

  // T-202604-289: sección Decisiones
  const decisions = Array.isArray(proj.decisions) ? proj.decisions : [];
  if (decisions.length) {
    md += `\n## Decisiones\n\n`;
    md += `| Fecha | Autor | Decisión |\n|-------|-------|----------|\n`;
    [...decisions]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .forEach(d => {
        md += `| ${d.date || '—'} | ${d.author || '—'} | ${(d.text || '').replace(/\n/g, ' ')} |\n`;
      });
  }

  const blob = new Blob([md], {type:'text/markdown'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reporte-${(proj.name||'proyecto').replace(/\s+/g,'-').toLowerCase()}.md`;
  a.click(); URL.revokeObjectURL(a.href);
  showToast('success', 'Reporte descargado');
}

function toggleProjectSection(key) {
  // Mantenido por compatibilidad — T-078 ya no usa secciones colapsables
  if (!renderProject._collapsed) renderProject._collapsed = {};
  const body = document.getElementById('pbody-' + key);
  const arrow = document.getElementById('parrow-' + key);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open', isOpen);
  renderProject._collapsed[key] = isOpen;
}

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
window.renderProyectos          = renderProyectos;
window.renderProject            = renderProject;
window.getAIColor               = getAIColor;
window.renderProjectAnalytics   = renderProjectAnalytics;
window.downloadProjectReport    = downloadProjectReport;
window.toggleProjectSection     = toggleProjectSection;
window._projOpenAddDecision     = _projOpenAddDecision;
window._projSaveDecision        = _projSaveDecision;
window._projCancelDecision      = _projCancelDecision;
window._projEditDecision        = _projEditDecision;
window._projDeleteDecision      = _projDeleteDecision;
window._projCtxStartEdit        = _projCtxStartEdit;
window._projCtxSave             = _projCtxSave;
window._projCtxCancelEdit       = _projCtxCancelEdit;
window._projCtxToggleSec        = _projCtxToggleSec;
window._projToggleAIFilter      = _projToggleAIFilter;
window._projViewSearchInput     = _projViewSearchInput;
window._toggleProjAnalytics     = _toggleProjAnalytics;

// --- Delegation: locus-projects.js ---
document.addEventListener('DOMContentLoaded', () => {
  // Contenedor principal del tab proyectos
  const tabProyectos = document.getElementById('tab-proyectos-inner') || document.body;
  tabProyectos.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, projId, aiId, filterId, secId, decId, code, sessId } = {
      action: el.dataset.action,
      projId: el.dataset.projId,
      aiId: el.dataset.aiId,
      filterId: el.dataset.filterId,
      secId: el.dataset.secId,
      decId: el.dataset.decId,
      code: el.dataset.code,
      sessId: el.dataset.sessId
    };
    switch (action) {
      case 'open-proj-modal':
        if (typeof window.openProjModal === 'function') window.openProjModal();
        break;
      case 'toggle-archived-section': {
        const o = localStorage.getItem('proy2-archived-open') !== '0';
        localStorage.setItem('proy2-archived-open', o ? '0' : '1');
        if (typeof renderProyectos === 'function') renderProyectos();
        break;
      }
      case 'go-to-tracker':
        switchTab('tab-tracker');
        break;
      case 'go-to-sprint-create':
        switchTab('backlog');
        switchSubTab('backlog');
        break;
      case 'toggle-ai-filter':
        if (typeof _projToggleAIFilter === 'function') _projToggleAIFilter(aiId);
        break;
      case 'toggle-proj-analytics':
        if (typeof _toggleProjAnalytics === 'function') _toggleProjAnalytics(filterId);
        break;
      case 'ctx-toggle-sec':
        if (typeof _projCtxToggleSec === 'function') _projCtxToggleSec(secId);
        break;
      case 'ctx-save':
        if (typeof _projCtxSave === 'function') _projCtxSave(filterId);
        break;
      case 'ctx-cancel':
        if (typeof _projCtxCancelEdit === 'function') _projCtxCancelEdit(filterId);
        break;
      case 'ctx-start-edit':
        if (typeof _projCtxStartEdit === 'function') _projCtxStartEdit(filterId);
        break;
      case 'qn-nav-to-item':
        if (typeof _qnNavToItem === 'function') _qnNavToItem(code);
        break;
      case 'open-session-detail':
        openDetail(aiId, sessId);
        break;
      case 'dec-edit':
        if (typeof _projEditDecision === 'function') _projEditDecision(projId, decId);
        break;
      case 'dec-delete':
        if (typeof _projDeleteDecision === 'function') _projDeleteDecision(projId, decId);
        break;
      case 'dec-add':
        if (typeof _projOpenAddDecision === 'function') _projOpenAddDecision(projId);
        break;
      case 'dec-save':
        if (typeof _projSaveDecision === 'function') _projSaveDecision(projId);
        break;
      case 'dec-cancel':
        if (typeof _projCancelDecision === 'function') _projCancelDecision(projId);
        break;
      case 'download-project-report':
        if (typeof downloadProjectReport === 'function') downloadProjectReport(projId);
        break;
      case 'proj-delete-execute':
        e.stopPropagation();
        if (typeof _proyDeleteExecute === 'function') _proyDeleteExecute(projId);
        break;
      case 'proj-delete-cancel':
        e.stopPropagation();
        if (typeof _proyDeleteInline === 'function') _proyDeleteInline(projId);
        break;
      case 'proj-open':
        selectProjectFilter(projId);
        break;
    }
  });
});
