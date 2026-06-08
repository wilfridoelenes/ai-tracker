// [PP] v1.2.4 · sprint:PP-S-01 · mod:8 · autor:Rune · 2026-06-04 23:30 UTC-6
import { renderCheckpointsByProject, renderHeatmap, renderHourly, renderProductivityPatterns } from './locus-analytics-charts.js';
import { _closedItemsInRange, _delta, _getIntervalsInPeriod, _getPeriodBounds, _openedItemsInRange, _periodLabel, _posTooltip, _prevPeriodLabel, _sessInRange, exportWeeklySummary, getAnalyticsColor, getTooltip, hideAnalyticsTooltip, sessionDateKey } from './locus-analytics-core.js';

import { navigateToItem } from './locus-backlog-sprints.js';

// T-202606-166: _getActiveProjectFilter y getProjectById movidas a locus-storage.js

import { _getActiveProjectFilter, getAllSessions, getProjectById } from './locus-storage.js';

import { esc, switchTab } from './locus-ui-shell.js';

// [PP] v1.2.4 · sprint:PP-S-09 · mod:2 · autor:Rune · 2026-05-28 UTC-6
// locus-analytics-render.js
// Responsabilidad: renderAnalytics — función principal del tab de analytics.
// Dependencias: locus-analytics-core.js · locus-analytics-digest.js · locus-analytics-charts.js

// R-202605-061: dirty flag — evita renders redundantes sin cambio de estado
let _analyticsDirty = false;
export function _markAnalyticsDirty() { _analyticsDirty = true; }
// window.* — solo para locus-api.js (T6)
window._markAnalyticsDirty = _markAnalyticsDirty;

export function renderAnalytics() {
  if (!_analyticsDirty) return;
  _analyticsDirty = false;
  // T-202605-117: Guard de tab activo — skip render si el tab Analytics no es el visible.
  // AC-4: Command Palette abierto no cuenta como cambio de tab — evaluar tab subyacente.
  // AC-5: si currentTab no es detectable → fail-safe, ejecutar sin guard.
  const _cpOpen = (() => {
    const el = document.getElementById('cp-overlay');
    return el && !el.classList.contains('is-hidden');
  })();
  if (!_cpOpen && typeof currentTab !== 'undefined' && currentTab !== 'analytics') return;

  const container = document.getElementById('tab-analytics-inner');
  if (!container) return;
  // T-202604-216: skeleton while computing analytics
  const _skelAnalytics = Array(4).fill('<div class="skel-row skel-row--lg"></div>').join('');
  container.innerHTML = _skelAnalytics;
  container.classList.add('is-loading');

  const bounds = _getPeriodBounds();
  const allSess = getAllSessions();
  const allProjects = state.projects || [];

  const currSess = _sessInRange(allSess, bounds.current);
  const prevSess = _sessInRange(allSess, bounds.previous);

  // R-202605-178: guard estado vacío — sin sesiones registradas
  if (!allSess.length) {
    container.classList.remove('is-loading');
    container.innerHTML = `
      <div class="empty-state empty-state--mt">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-title">Las métricas aparecen cuando tengas sesiones registradas</div>
        <div class="empty-state-hint">Pega tu primer CHECKPOINT en el tab Tracker para empezar.</div>
        <button class="empty-state-btn" data-action="analytics-goto-tracker">Ir al Tracker</button>
      </div>`;
    return;
  }

  // ── KPI helpers ──
  function _dominantProject(sessions) {
    const cnt = {};
    sessions.forEach(s => { if (s.projectId) cnt[s.projectId] = (cnt[s.projectId] || 0) + 1; });
    const top = Object.entries(cnt).sort((a,b) => b[1]-a[1])[0];
    if (!top) return null;
    const proj = getProjectById(top[0]);
    return proj ? { proj, count: top[1] } : null;
  }

  function _activeProjectCount(sessions) {
    return new Set(sessions.map(s => s.projectId).filter(Boolean)).size;
  }

  // ── KPI data ──
  const kpiSessions   = { curr: currSess.length, prev: prevSess.length };
  const kpiProjects   = { curr: _activeProjectCount(currSess), prev: _activeProjectCount(prevSess) };
  const kpiClosed     = { curr: _closedItemsInRange(bounds.current), prev: _closedItemsInRange(bounds.previous) };
  const kpiOpened     = { curr: _openedItemsInRange(bounds.current), prev: _openedItemsInRange(bounds.previous) };
  const domProj       = _dominantProject(currSess);

  // ── KPI Archivos modificados ──
  // Fuente: s.files de sesiones en el período (comma-separated, ej: "ai-tracker-backlog.js, ai-tracker-checkpoint.js")
  function _filesKpi(sessions) {
    let mods = 0;
    const unique = new Set();
    sessions.forEach(s => {
      if (!s.files) return;
      const names = s.files.split(',').map(f => f.trim()).filter(Boolean);
      if (names.length) {
        mods++;
        names.forEach(n => unique.add(n));
      }
    });
    return { mods, unique: unique.size };
  }
  const _fCurr = _filesKpi(currSess);
  const _fPrev = _filesKpi(prevSess);
  const kpiFiles = { curr: _fCurr.mods, prev: _fPrev.mods, uniqueCurr: _fCurr.unique, uniquePrev: _fPrev.unique };
  const _kpiFilesExtra = _fCurr.unique > 0
    ? `<div class="akpi-files-unique">${_fCurr.unique} archivo${_fCurr.unique !== 1 ? 's' : ''} distinto${_fCurr.unique !== 1 ? 's' : ''}</div>`
    : '<div class="akpi-files-unique akpi-muted">sin archivos registrados</div>';

  // ── IA KPIs ──
  const activeDays = new Set(currSess.map(s => sessionDateKey(s)).filter(Boolean));
  const aiKpiCheckpoints = currSess.length;
  const aiKpiAvgPerDay   = activeDays.size ? (currSess.length / activeDays.size).toFixed(1) : '0';
  // Día con más checkpoints
  const dayCounts = {};
  currSess.forEach(s => { const k = sessionDateKey(s); if (k) dayCounts[k] = (dayCounts[k]||0)+1; });
  const peakDay = Object.entries(dayCounts).sort((a,b)=>b[1]-a[1])[0];
  const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  let peakDayLabel = '—';
  if (peakDay) {
    const pd = new Date(peakDay[0]);
    peakDayLabel = `${DAYS_ES[pd.getDay()]} ${pd.getDate()} ${MONTHS_ES[pd.getMonth()]} · ${peakDay[1]} checkpoints`;
  }

  // ── Gráfico barras: sesiones por día o semana dentro del período, coloreadas por proyecto ──
  function _buildBarChart() {
    const { intervals, granularity } = _getIntervalsInPeriod();
    if (!intervals.length) return '<div class="analytics-empty">Sin datos en período</div>';

    // Proyectos con sesiones en el período actual
    const projIds = [...new Set(currSess.map(s=>s.projectId).filter(Boolean))];
    const projColors = {};
    projIds.forEach((id, i) => { projColors[id] = getAnalyticsColor(i); });

    // Por intervalo: contar sesiones por proyecto
    const DAY_SHORT = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
    const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    const intervalData = intervals.map(iv => {
      const ivSess = _sessInRange(allSess, iv);
      const byProj = {};
      ivSess.forEach(s => {
        const pid = s.projectId || '__none__';
        byProj[pid] = (byProj[pid]||0) + 1;
      });
      return { iv, byProj, total: ivSess.length };
    });

    const maxTotal = Math.max(...intervalData.map(d=>d.total), 1);
    // T-202604-403: ancho completo del contenedor — W adaptativo, no fijo
    const W = 900, H = 240;
    const PAD = { top: 20, right: 20, bottom: 40, left: 38 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;
    const n = intervals.length;
    const barW = Math.max(4, Math.floor((cW / n) * 0.65));
    const gap = cW / n;

    const yStep = maxTotal <= 4 ? 1 : maxTotal <= 10 ? 2 : 5;
    const yTop = Math.max(Math.ceil(maxTotal / yStep) * yStep, yStep);
    const yOf = v => PAD.top + cH - (v / yTop) * cH;
    const xOf = i => PAD.left + gap * i + gap / 2;

    // Determinar qué índices deben mostrar etiqueta en el eje X
    // Para días: mostrar solo algunos para no saturar
    function _shouldShowLabel(i, total) {
      if (granularity === 'week') return true; // siempre para semanas
      if (total <= 14) return true;             // todos si caben
      if (total <= 31) return i % 3 === 0;     // cada 3 días
      return i % 7 === 0;                       // cada semana
    }

    function _intervalLabel(iv, granularity) {
      if (granularity === 'day') {
        const d = iv.start;
        return `${DAY_SHORT[d.getDay()]} ${d.getDate()}`;
      }
      // semana: mostrar inicio de semana
      const s = iv.start;
      return `${s.getDate()}/${s.getMonth()+1}`;
    }

    function _intervalTooltipLabel(iv, granularity) {
      if (granularity === 'day') {
        const d = iv.start;
        return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
      }
      const s = iv.start, e = iv.end;
      return `Sem ${s.getDate()}/${s.getMonth()+1} – ${e.getDate()}/${e.getMonth()+1}`;
    }

    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="analytics-bar-svg">
      <defs>
        <style>
          @keyframes barRise {
            from { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
            to   { transform: scaleY(1); transform-origin: bottom; opacity: 0.85; }
          }
          .analytics-bar-seg {
            animation: barRise 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
            transform-box: fill-box;
            transform-origin: bottom;
          }
        </style>
      </defs>`;

    // Guías Y — T-202604-403: eje Y legible con labels prominentes
    for (let v = 0; v <= yTop; v += yStep) {
      const yy = yOf(v);
      svg += `<line x1="${PAD.left}" y1="${yy}" x2="${W-PAD.right}" y2="${yy}" stroke="var(--border)" stroke-width="${v===0?'1.5':'1'}" stroke-dasharray="${v===0?'none':'4,5'}" opacity="${v===0?'0.8':'0.5'}"/>`;
      svg += `<text x="${PAD.left-8}" y="${yy+4}" font-size="10" fill="var(--text2)" font-family="JetBrains Mono,monospace" text-anchor="end" font-weight="500">${v}</text>`;
    }

    // Barras apiladas por proyecto
    intervalData.forEach((id, i) => {
      const x = xOf(i) - barW / 2;
      let yBase = yOf(0);
      const allProjIds = Object.keys(id.byProj);
      allProjIds.sort();

      allProjIds.forEach(pid => {
        const cnt = id.byProj[pid] || 0;
        if (!cnt) return;
        const barH = (cnt / yTop) * cH;
        yBase -= barH;
        const color = projColors[pid] || 'var(--hint)';
        const proj = pid !== '__none__' ? getProjectById(pid) : null;
        const ivLabel = _intervalTooltipLabel(id.iv, granularity);
        const tip = `${ivLabel} · ${proj ? proj.name : 'Sin proyecto'}: ${cnt}`;
        const staggerDelay = (i * 28 + 20).toFixed(0);
        svg += `<rect x="${x}" y="${yBase}" width="${barW}" height="${barH}" fill="${color}" rx="2" data-tip="${esc(tip)}" class="analytics-bar-seg" style="--bar-delay:${staggerDelay}ms;animation-delay:var(--bar-delay)"/>`;
      });

      // Etiqueta eje X (selectiva para no saturar)
      if (_shouldShowLabel(i, n)) {
        const lbl = _intervalLabel(id.iv, granularity);
        svg += `<text x="${xOf(i)}" y="${H-PAD.bottom+14}" font-size="10" fill="var(--text2)" font-family="JetBrains Mono,monospace" text-anchor="middle">${lbl}</text>`;
      }

      // Total encima de barra (solo si hay sesiones y barras no son demasiado densas)
      if (id.total > 0 && (granularity === 'week' || n <= 21)) {
        svg += `<text x="${xOf(i)}" y="${yOf(id.total)-4}" font-size="10" fill="var(--text)" font-family="JetBrains Mono,monospace" text-anchor="middle" font-weight="600">${id.total}</text>`;
      }
    });

    svg += `</svg>`;

    // Leyenda de proyectos
    const legendItems = projIds.map(pid => {
      const proj = getProjectById(pid);
      return `<span class="abar-legend-item"><span class="abar-legend-dot" style="--legend-dot-color:${projColors[pid]}"></span>${esc(proj ? proj.name : 'Sin proyecto')}</span>`;
    }).join('');

    return `<div class="abar-wrap">${svg}</div>
      <div class="abar-legend">${legendItems}</div>`;
  }

  // ── R-202605-111: Empty state helpers — KPI cards sin datos en el período ──
  // Distingue: período vacío (sin sesiones) vs período con sesiones pero métrica en 0
  const _periodHasSessions = currSess.length > 0;
  const _emptyPeriodHint = `<div class="akpi-hint akpi-muted">Sin datos en este período</div>`;

  function _kpiEmptyExtra(baseExtra, metric) {
    // Si el período no tiene sesiones, reemplaza cualquier extra con mensaje contextual
    if (!_periodHasSessions) return _emptyPeriodHint;
    // Si el período tiene sesiones pero la métrica es 0, añade indicador junto al extra
    if (metric === 0 && !baseExtra) return `<div class="akpi-hint akpi-muted">Sin registros en el período</div>`;
    return baseExtra;
  }

  // ── T-402: KPIs nuevas — Velocidad de cierre · Eficiencia sesión · Deuda acumulada ──

  // Helper: ítems cerrados en un range usando los mismos helpers existentes
  // Velocidad de cierre = ítems done / días activos en el período
  const _closedCurr = kpiClosed.curr;
  const _closedPrev = kpiClosed.prev;
  const _activeDaysCurr = activeDays.size;
  const _activeDaysPrev = new Set(prevSess.map(s => sessionDateKey(s)).filter(Boolean)).size;
  const kpiCloseVelocity = {
    curr: _activeDaysCurr ? parseFloat((_closedCurr / _activeDaysCurr).toFixed(1)) : 0,
    prev: _activeDaysPrev ? parseFloat((_closedPrev / _activeDaysPrev).toFixed(1)) : 0,
  };

  // Eficiencia de sesión = ítems cerrados / sesiones (cuántos ítems cierra cada sesión)
  const kpiSessionEfficiency = {
    curr: currSess.length ? parseFloat((_closedCurr / currSess.length).toFixed(1)) : 0,
    prev: prevSess.length ? parseFloat((_closedPrev / prevSess.length).toFixed(1)) : 0,
  };

  // Deuda acumulada = ítems pendientes globales (todos los proyectos, no filtrados por período)
  // Más alto = peor (semanticDir = -1)
  function _totalPendingItems() {
    let count = 0;
    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status === 'pendiente') count++;
        });
      } catch {}
    });
    return count;
  }
  const kpiDebt = {
    curr: _totalPendingItems(),
    prev: kpiClosed.curr > 0 ? Math.max(0, _totalPendingItems() + kpiClosed.curr - kpiOpened.curr) : _totalPendingItems(),
  };

  // ── T-401: Sparklines — datos históricos por intervalo ──
  function _sparklineForIntervals(metricFn, intervals) {
    if (!intervals || intervals.length < 2) return [];
    return intervals.map(iv => metricFn(iv));
  }
  const { intervals: _sparkIntervals } = _getIntervalsInPeriod();
  const _sparkSessions   = _sparklineForIntervals(iv => _sessInRange(allSess, iv).length, _sparkIntervals);
  const _sparkClosed     = _sparklineForIntervals(iv => _closedItemsInRange(iv), _sparkIntervals);
  const _sparkOpened     = _sparklineForIntervals(iv => _openedItemsInRange(iv), _sparkIntervals);
  const _sparkEfficiency = _sparkIntervals.map(iv => {
    const s = _sessInRange(allSess, iv).length;
    const c = _closedItemsInRange(iv);
    return s ? parseFloat((c / s).toFixed(1)) : 0;
  });

  // ── T-401: KPI card HTML — color semántico + sparkline ──
  // sparklineData: array de números (valores históricos, más antiguo primero)
  // semanticDir: 1 = más es mejor (sesiones, cerrados), -1 = más es peor (deuda), 0 = neutro
  function _kpiCard(icon, label, curr, prev, extraHtml, unit, sparklineData, semanticDir) {
    const d = _delta(curr, prev);
    const prevLabel = _prevPeriodLabel();
    const unitSpan = unit ? `<span class="akpi-unit">${unit}</span>` : '';

    // Color semántico en el valor según dirección + delta
    let valueColorClass = '';
    if (semanticDir && d.dir !== 0) {
      const positive = d.dir * semanticDir > 0;
      valueColorClass = positive ? ' akpi-value--up' : ' akpi-value--down';
    }

    // Sparkline SVG inline — solo si hay datos
    let sparkHtml = '';
    if (sparklineData && sparklineData.length >= 2) {
      const W = 60, H = 22, PAD = 2;
      const vals = sparklineData;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = max - min || 1;
      const n = vals.length;
      const pts = vals.map((v, i) => {
        const x = PAD + (i / (n - 1)) * (W - PAD * 2);
        const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      // Color de línea basado en tendencia
      const trend = vals[vals.length - 1] - vals[0];
      const lineDir = trend > 0 ? 1 : trend < 0 ? -1 : 0;
      const lineColor = semanticDir && lineDir !== 0
        ? (lineDir * semanticDir > 0 ? 'var(--green,#2ecc78)' : 'var(--red,#e85555)')
        : 'var(--hint)';
      sparkHtml = `<svg class="akpi-sparkline" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <polyline points="${pts}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
        <circle cx="${pts.split(' ').pop().split(',')[0]}" cy="${pts.split(' ').pop().split(',')[1]}" r="2" fill="${lineColor}"/>
      </svg>`;
    }

    return `<div class="akpi-card${extraHtml && extraHtml.includes('akpi-muted') && !extraHtml.includes('akpi-files') ? ' akpi-card--no-data' : ''}">
      <div class="akpi-icon">${icon}</div>
      <div class="akpi-body">
        <div class="akpi-label">${label}</div>
        <div class="akpi-value-row">
          <div class="akpi-value${valueColorClass}">${curr}${unitSpan}</div>
          ${sparkHtml}
        </div>
        <div class="akpi-meta">${d.html} <span class="akpi-prev">vs ${prevLabel}: ${prev}</span></div>
        ${extraHtml || ''}
      </div>
    </div>`;
  }

  // ── Proyecto dominante ──
  const domHtml = domProj
    ? `<div class="akpi-dom-proj" style="--dom-proj-color:${domProj.proj.color||'var(--accent)'}">
        <span class="akpi-dom-icon">${domProj.proj.icon||'📁'}</span>
        <span class="akpi-dom-name">${esc(domProj.proj.name)}</span>
        <span class="akpi-dom-count">${domProj.count} sesión${domProj.count!==1?'es':''}</span>
      </div>`
    : '<span class="akpi-muted">Sin sesiones</span>';

  // ── R-202604-070: Comparación side-by-side — dos proyectos independientes ──
  let compColHtml = '';
  const _projects = state.projects || [];
  const _hasComparison = _compareProjectIdA || _compareProjectIdB;

  if (_hasComparison) {
    function _projMetricsSbs(sessions, prevSessions) {
      const files = sessions.reduce((acc, s) => {
        if (!s.files) return acc;
        s.files.split(',').map(f => f.trim()).filter(Boolean).forEach(f => acc.add(f));
        return acc;
      }, new Set());
      const prevFiles = prevSessions.reduce((acc, s) => {
        if (!s.files) return acc;
        s.files.split(',').map(f => f.trim()).filter(Boolean).forEach(f => acc.add(f));
        return acc;
      }, new Set());
      const days = new Set(sessions.map(s => sessionDateKey(s)).filter(Boolean));
      const prevDays = new Set(prevSessions.map(s => sessionDateKey(s)).filter(Boolean));
      return {
        sessions: sessions.length,
        prevSessions: prevSessions.length,
        files: files.size,
        prevFiles: prevFiles.size,
        days: days.size,
        prevDays: prevDays.size,
        avgPerDay: days.size ? (sessions.length / days.size).toFixed(1) : '0',
        prevAvgPerDay: prevDays.size ? (prevSessions.length / prevDays.size).toFixed(1) : '0',
      };
    }

    function _sessForProj(projId, sessions) {
      if (!projId) return sessions;
      return sessions.filter(s => s.projectId === projId);
    }

    const projA = _compareProjectIdA ? getProjectById(_compareProjectIdA) : null;
    const projB = _compareProjectIdB ? getProjectById(_compareProjectIdB) : null;
    const sessA     = _sessForProj(_compareProjectIdA, currSess);
    const prevSessA = _sessForProj(_compareProjectIdA, prevSess);
    const sessB     = _sessForProj(_compareProjectIdB, currSess);
    const prevSessB = _sessForProj(_compareProjectIdB, prevSess);
    const mA = _projMetricsSbs(sessA, prevSessA);
    const mB = _projMetricsSbs(sessB, prevSessB);

    const labelA = projA ? `${projA.icon || '📁'} ${projA.name}` : '📊 Todos';
    const labelB = projB ? `${projB.icon || '📁'} ${projB.name}` : '📊 Todos';
    const colorA = projA?.color || 'var(--text2)';
    const colorB = projB?.color || 'var(--accent)';

    function _cmpRow(icon, label, valA, valB, prevA, prevB) {
      const dA = _delta(valA, prevA);
      const dB = _delta(valB, prevB);
      const aWins = valA > valB, bWins = valB > valA;
      return `<div class="acmp-metric-row">
        <div class="acmp-metric-label">${icon} ${label}</div>
        <div class="acmp-metric-vals">
          <div class="acmp-val acmp-val-a${aWins ? ' acmp-val--winner' : ''}">
            <span class="acmp-val-num">${valA}</span>
            <span class="acmp-val-delta">${dA.html}</span>
          </div>
          <div class="acmp-divider"></div>
          <div class="acmp-val acmp-val-b${bWins ? ' acmp-val--winner' : ''}">
            <span class="acmp-val-num">${valB}</span>
            <span class="acmp-val-delta">${dB.html}</span>
          </div>
        </div>
      </div>`;
    }

    compColHtml = `
      <div class="analytics-section acmp-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">⚖️ Comparación de proyectos</div>
          <div class="analytics-section-sub">${periodLabel}</div>
        </div>
        <div class="acmp-wrap">
          <div class="acmp-headers">
            <div class="acmp-header acmp-header-a" style="--comp-col-color:${colorA}">
              <span class="acmp-header-dot" style="--acmp-dot-color:${colorA}"></span>
              <span class="acmp-header-name">${esc(labelA)}</span>
            </div>
            <div class="acmp-header acmp-header-b" style="--comp-col-color:${colorB}">
              <span class="acmp-header-dot" style="--acmp-dot-color:${colorB}"></span>
              <span class="acmp-header-name">${esc(labelB)}</span>
            </div>
          </div>
          <div class="acmp-metrics">
            ${_cmpRow('📋', 'Sesiones', mA.sessions, mB.sessions, mA.prevSessions, mB.prevSessions)}
            ${_cmpRow('🗂', 'Archivos distintos', mA.files, mB.files, mA.prevFiles, mB.prevFiles)}
            ${_cmpRow('📅', 'Días activos', mA.days, mB.days, mA.prevDays, mB.prevDays)}
            ${_cmpRow('📈', 'Promedio / día', parseFloat(mA.avgPerDay), parseFloat(mB.avgPerDay), parseFloat(mA.prevAvgPerDay), parseFloat(mB.prevAvgPerDay))}
          </div>
          <div class="acmp-footer">
            <button class="acmp-clear-btn" data-action="analytics-clear-comparison">✕ Limpiar comparación</button>
          </div>
        </div>
      </div>`;
  }

  // ── R-070: Selectores side-by-side en control bar ──
  function _buildCompareSelector(slot, currentId) {
    const opts = _projects
      .filter(p => p.id && p.name)
      .map(p => `<option value="${esc(p.id)}"${p.id === currentId ? ' selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`)
      .join('');
    return `<select class="period-btn compare-proj-select compare-proj-select--${slot}" onchange="setCompareProject${slot.toUpperCase()}(this.value || null)" title="Proyecto ${slot.toUpperCase()}">
      <option value="">＋ Proyecto ${slot.toUpperCase()}</option>
      ${opts}
    </select>`;
  }
  const compareSelectHtml = _projects.length >= 2
    ? `<div class="acmp-selectors">
        ${_buildCompareSelector('a', _compareProjectIdA)}
        <span class="acmp-vs-label">vs</span>
        ${_buildCompareSelector('b', _compareProjectIdB)}
       </div>`
    : '';

  // ── T-202605-453: Tiempo promedio pendiente → done ──
  // Recolecta todos los ítems done con createdAt + closedAt de todos los proyectos
  function _cycleTimeData() {
    const byType   = { R: [], T: [], B: [] };
    const byEffort = { 1: [], 2: [], 3: [] };
    const outlierCandidates = [];

    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          const created = item.createdAt || item.StatusChangedAt;
          const closed  = item.closedAt || item.updatedAt;
          if (!created || !closed) return;
          const days = Math.max(0, Math.round((closed - created) / 86400000));
          const t = (item.code || '')[0];
          const e = parseInt(item.effort) || 1;
          const entry = {
            days,
            code:    item.code  || '—',
            title:   item.title || item.desc || '—',
            type:    t,
            effort:  e,
            projId:  p.id,
          };
          if (byType[t])           byType[t].push(entry);
          if (byEffort[e])         byEffort[e].push(entry);
          outlierCandidates.push(entry);
        });
      } catch {}
    });

    function avg(arr) {
      if (!arr.length) return null;
      return Math.round(arr.reduce((s, i) => s + i.days, 0) / arr.length);
    }

    // Promedio global para detectar outliers (>2× promedio global)
    const globalAvg = avg(outlierCandidates) || 0;
    const outliers  = outlierCandidates
      .filter(i => i.days > globalAvg * 2 && globalAvg > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 6);

    // Tendencia sprint a sprint: comparar últimos 2 sprints cerrados con ítems done
    // Agrupa done items por sprint field → ordena por sprint id → toma los 2 últimos
    const bySprint = {};
    outlierCandidates.forEach(e => {
      // Recuperar sprint del item desde localStorage (ya tenemos el entry, buscar sprint)
      // Como ya parseamos, simplemente asociamos por sprint field obtenido antes
    });

    // Recolecta tendencia: sprints con avg cycle time
    const sprintAvgs = [];
    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        const sprintMap = {};
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          const created = item.createdAt || item.StatusChangedAt;
          const closed  = item.closedAt  || item.updatedAt;
          if (!created || !closed || !item.sprint) return;
          const days = Math.max(0, Math.round((closed - created) / 86400000));
          if (!sprintMap[item.sprint]) sprintMap[item.sprint] = [];
          sprintMap[item.sprint].push(days);
        });
        Object.entries(sprintMap).forEach(([sp, vals]) => {
          const existing = sprintAvgs.find(x => x.sprint === sp);
          if (existing) {
            existing.vals.push(...vals);
          } else {
            sprintAvgs.push({ sprint: sp, vals });
          }
        });
      } catch {}
    });

    // Ordena sprints por nombre (S-01, S-02…) y toma los últimos 5 para tendencia
    const sprintTrend = sprintAvgs
      .sort((a, b) => a.sprint.localeCompare(b.sprint, undefined, { numeric: true }))
      .slice(-5)
      .map(x => ({ sprint: x.sprint, avg: Math.round(x.vals.reduce((s, v) => s + v, 0) / x.vals.length) }));

    // Tendencia: comparar último sprint con el anterior
    let trendDir = 0; // 0=sin datos, 1=mejorando, -1=empeorando
    if (sprintTrend.length >= 2) {
      const last = sprintTrend[sprintTrend.length - 1].avg;
      const prev = sprintTrend[sprintTrend.length - 2].avg;
      if (last < prev) trendDir = 1;
      else if (last > prev) trendDir = -1;
    }

    return {
      byType:  { R: avg(byType.R), T: avg(byType.T), B: avg(byType.B) },
      byEffort:{ 1: avg(byEffort[1]), 2: avg(byEffort[2]), 3: avg(byEffort[3]) },
      globalAvg,
      outliers,
      sprintTrend,
      trendDir,
      totalDone: outlierCandidates.length,
    };
  }
  const _ctData = _cycleTimeData();

  function _ctDaysLabel(n) {
    if (n === null) return '<span class="ct-nodata">—</span>';
    return `<span class="ct-days">${n}</span><span class="ct-days-unit"> d</span>`;
  }

  function _ctTrendHtml(dir) {
    if (dir === 0) return '';
    if (dir === 1) return '<span class="ct-trend ct-trend--up">▼ mejorando</span>';
    return '<span class="ct-trend ct-trend--down">▲ empeorando</span>';
  }

  // Mini sparkline para trend sprint a sprint
  function _ctSparkHtml(sprintTrend) {
    if (sprintTrend.length < 2) return '';
    const W = 80, H = 28, PAD = 3;
    const vals = sprintTrend.map(x => x.avg);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const n = vals.length;
    const pts = vals.map((v, i) => {
      const x = PAD + (i / (n - 1)) * (W - PAD * 2);
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const trend = vals[vals.length - 1] - vals[0];
    // Para cycle time: bajar es bueno (semanticDir -1)
    const lineColor = trend < 0 ? 'var(--green,#2ecc78)' : trend > 0 ? 'var(--red,#e85555)' : 'var(--hint)';
    const lastPt = pts.split(' ').pop();
    return `<svg class="ct-sparkline" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <polyline points="${pts}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
      <circle cx="${lastPt.split(',')[0]}" cy="${lastPt.split(',')[1]}" r="2.2" fill="${lineColor}"/>
    </svg>`;
  }

  // HTML de outliers
  function _ctOutliersHtml(outliers, globalAvg) {
    if (!outliers.length) return '<div class="ct-no-outliers">Sin outliers detectados</div>';
    return outliers.map(o => {
      const typeClass = o.type === 'R' ? 'ct-pill-r' : o.type === 'T' ? 'ct-pill-t' : 'ct-pill-b';
      return `<button class="ct-outlier-row" data-action="analytics-goto-item" data-item-code="${_esc(o.code)}" title="Ir al ítem">
        <span class="ct-outlier-code ct-pill ${typeClass}">${esc(o.code)}</span>
        <span class="ct-outlier-title">${esc(o.title.length > 42 ? o.title.slice(0, 42) + '…' : o.title)}</span>
        <span class="ct-outlier-days">${o.days}d</span>
        <span class="ct-outlier-mult">${globalAvg > 0 ? (o.days / globalAvg).toFixed(1) + '×' : ''}</span>
      </button>`;
    }).join('');
  }

  const _ctHtml = `
    <div class="ct-section analytics-section">
      <div class="analytics-section-header">
        <div class="analytics-section-title">⏱ Tiempo pendiente → done</div>
        <div class="analytics-section-sub">Promedio global · ${_ctData.totalDone} ítem${_ctData.totalDone !== 1 ? 's' : ''} cerrado${_ctData.totalDone !== 1 ? 's' : ''}</div>
      </div>

      <!-- Global + tendencia -->
      <div class="ct-global-row">
        <div class="ct-global-card">
          <div class="ct-global-val">${_ctData.globalAvg > 0 ? _ctData.globalAvg : '—'}<span class="ct-global-unit">${_ctData.globalAvg > 0 ? ' d' : ''}</span></div>
          <div class="ct-global-label">promedio global</div>
        </div>
        <div class="ct-trend-block">
          ${_ctSparkHtml(_ctData.sprintTrend)}
          ${_ctTrendHtml(_ctData.trendDir)}
          ${_ctData.sprintTrend.length >= 2 ? `<div class="ct-trend-label">${_ctData.sprintTrend.map(x => `<span title="${esc(x.sprint)}">${x.avg}d</span>`).join('<span class="ct-trend-sep">→</span>')}</div>` : '<div class="ct-trend-label ct-nodata">Sin datos de sprint</div>'}
        </div>
      </div>

      <!-- Por tipo -->
      <div class="ct-grid">
        <div class="ct-block">
          <div class="ct-block-header">Por tipo</div>
          <div class="ct-type-rows">
            <div class="ct-type-row">
              <span class="ct-pill ct-pill-r">R</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byType.R !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byType.R / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--blue,#38bdf8)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byType.R)}</span>
            </div>
            <div class="ct-type-row">
              <span class="ct-pill ct-pill-t">T</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byType.T !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byType.T / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--green,#2ecc78)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byType.T)}</span>
            </div>
            <div class="ct-type-row">
              <span class="ct-pill ct-pill-b">B</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byType.B !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byType.B / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--red,#e85555)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byType.B)}</span>
            </div>
          </div>
        </div>

        <div class="ct-block">
          <div class="ct-block-header">Por effort</div>
          <div class="ct-type-rows">
            <div class="ct-type-row">
              <span class="ct-effort-badge">E1</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byEffort[1] !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byEffort[1] / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--accent)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byEffort[1])}</span>
            </div>
            <div class="ct-type-row">
              <span class="ct-effort-badge ct-effort-badge--2">E2</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byEffort[2] !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byEffort[2] / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--accent)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byEffort[2])}</span>
            </div>
            <div class="ct-type-row">
              <span class="ct-effort-badge ct-effort-badge--3">E3</span>
              <span class="ct-bar-wrap"><span class="ct-bar" style="--ct-bar-pct:${_ctData.byEffort[3] !== null && _ctData.globalAvg > 0 ? Math.min(100, Math.round((_ctData.byEffort[3] / (_ctData.globalAvg * 2 || 1)) * 100)) : 0}%;--ct-bar-color:var(--accent)"></span></span>
              <span class="ct-type-val">${_ctDaysLabel(_ctData.byEffort[3])}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Outliers -->
      <div class="ct-outliers-wrap">
        <div class="ct-outliers-header">
          <span class="ct-outliers-title">Outliers — más del doble del promedio</span>
          ${_ctData.globalAvg > 0 ? `<span class="ct-outliers-baseline">baseline ${_ctData.globalAvg}d</span>` : ''}
        </div>
        <div class="ct-outliers-list">
          ${_ctOutliersHtml(_ctData.outliers, _ctData.globalAvg)}
        </div>
      </div>
    </div>`;

  // ── R-202605-128: Forecast — sprints estimados para vaciar el backlog ──
  function _buildForecastData() {
    // Recolectar sprints cerrados con effort_done calculado desde ítems
    const closedSprintEffort = {};

    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          if (!item.sprint) return;
          const type = (item.code || item.type || '')[0];
          if (type === 'P') return; // excluir tipo P
          const e = parseInt(item.effort) || 0;
          if (!e) return; // excluir sin effort
          if (!closedSprintEffort[item.sprint]) closedSprintEffort[item.sprint] = 0;
          closedSprintEffort[item.sprint] += e;
        });
      } catch {}
    });

    // Obtener IDs de sprints cerrados desde state
    const closedSprintIds = new Set(
      (state.projects || [])
        .flatMap(p => (p.sprints || []))
        .filter(s => s.status === 'closed')
        .map(s => s.id)
    );

    // Solo sprints cerrados con effort > 0
    const closedWithData = Object.entries(closedSprintEffort)
      .filter(([id, eff]) => closedSprintIds.has(id) && eff > 0)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

    if (closedWithData.length < 2) {
      return { insufficient: true, closedCount: closedWithData.length };
    }

    // Últimos 3 sprints cerrados con datos
    const last3 = closedWithData.slice(-3);
    const avgVelocity = Math.round(
      last3.reduce((sum, [, e]) => sum + e, 0) / last3.length
    );

    // Backlog pendiente: T + R + B con effort, sin sprint cerrado, sin descartado
    let pendingEffort = 0;
    (state.projects || []).forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status === 'done' || item.status === 'descartado') return;
          const type = (item.code || item.type || '')[0];
          if (type === 'P') return;
          const e = parseInt(item.effort) || 0;
          if (!e) return;
          pendingEffort += e;
        });
      } catch {}
    });

    if (avgVelocity <= 0) return { insufficient: true, closedCount: closedWithData.length };

    const sprintsNeeded = Math.ceil(pendingEffort / avgVelocity);

    return {
      insufficient: false,
      avgVelocity,
      pendingEffort,
      sprintsNeeded,
      sprintsUsed: last3.map(([id]) => id),
      closedCount: closedWithData.length,
    };
  }

  const _fcData = _buildForecastData();

  const _forecastHtml = (() => {
    if (_fcData.insufficient) {
      const msg = _fcData.closedCount < 2
        ? `Datos insuficientes para forecast — se necesitan al menos 2 sprints cerrados con effort registrado (actualmente ${_fcData.closedCount || 0})`
        : 'Datos insuficientes para calcular forecast';
      return `
    <div class="fcst-section analytics-section">
      <div class="analytics-section-header">
        <div class="analytics-section-title">🔭 Forecast de backlog</div>
        <div class="analytics-section-sub">Sprints estimados al ritmo actual</div>
      </div>
      <div class="fcst-insufficient">${msg}</div>
    </div>`;
    }

    const sprintLabel = _fcData.sprintsNeeded === 1 ? 'sprint' : 'sprints';
    const effortLabel = `${_fcData.pendingEffort} effort pendiente`;
    const velocityLabel = `ritmo: ${_fcData.avgVelocity} effort / sprint`;
    const sprintsRef = _fcData.sprintsUsed.join(', ');

    return `
    <div class="fcst-section analytics-section">
      <div class="analytics-section-header">
        <div class="analytics-section-title">🔭 Forecast de backlog</div>
        <div class="analytics-section-sub">Basado en ${_fcData.sprintsUsed.length} sprint${_fcData.sprintsUsed.length !== 1 ? 's' : ''} cerrado${_fcData.sprintsUsed.length !== 1 ? 's' : ''} · ${sprintsRef}</div>
      </div>
      <div class="fcst-main-row">
        <div class="fcst-number-block">
          <span class="fcst-number">${_fcData.sprintsNeeded}</span>
          <span class="fcst-number-unit">${sprintLabel}</span>
        </div>
        <div class="fcst-detail-block">
          <div class="fcst-detail-line">
            <span class="fcst-detail-label">Backlog pendiente</span>
            <span class="fcst-detail-val">${effortLabel}</span>
          </div>
          <div class="fcst-detail-line">
            <span class="fcst-detail-label">Velocidad promedio</span>
            <span class="fcst-detail-val">${velocityLabel}</span>
          </div>
          <div class="fcst-hint">A tu ritmo actual, el backlog se vaciaría en ~${_fcData.sprintsNeeded} ${sprintLabel}</div>
        </div>
      </div>
    </div>`;
  })();

  // ── Render principal ──
  const periodLabel = _periodLabel();
  const prevLabel   = _prevPeriodLabel();

  container.innerHTML = `
    <div class="analytics-v2-wrap">

      <!-- T-202604-399/400: Barra de control Analytics — pill group + zona acciones -->
      <div class="analytics-control-bar">
        <div class="analytics-period-pills">
          <button class="period-btn${_analyticsPeriod==='week'?' active':''}" data-period="week" data-action="analytics-set-period">Últ. 7 días</button>
          <button class="period-btn${_analyticsPeriod==='month'?' active':''}" data-period="month" data-action="analytics-set-period">Este mes</button>
          <button class="period-btn${_analyticsPeriod==='quarter'?' active':''}" data-period="quarter" data-action="analytics-set-period">Este trimestre</button>
          <span class="analytics-period-label">${periodLabel}</span>
        </div>
        <div class="analytics-actions-group">
          ${compareSelectHtml}
          <button class="analytics-action-btn" data-action="analytics-export-weekly" title="Exportar resumen de los últimos 7 días">⬇ Resumen semanal</button>
        </div>
      </div>

      <!-- KPIs principales — T-401: color semántico + sparkline -->
      <div class="akpi-row">
        ${_kpiCard('📋', 'Sesiones', kpiSessions.curr, kpiSessions.prev, _kpiEmptyExtra(null, kpiSessions.curr), null, _sparkSessions, 1)}
        ${_kpiCard('📁', 'Proyectos activos', kpiProjects.curr, kpiProjects.prev, _kpiEmptyExtra(null, kpiProjects.curr), null, null, 1)}
        ${_kpiCard('✅', 'Ítems cerrados', kpiClosed.curr, kpiClosed.prev, _kpiEmptyExtra(null, kpiClosed.curr), null, _sparkClosed, 1)}
        ${_kpiCard('➕', 'Ítems abiertos', kpiOpened.curr, kpiOpened.prev, _kpiEmptyExtra(null, kpiOpened.curr), null, _sparkOpened, 0)}
        ${_kpiCard('🗂', 'Archivos modificados', kpiFiles.curr, kpiFiles.prev, _kpiEmptyExtra(_kpiFilesExtra, kpiFiles.curr), null, null, 1)}
      </div>

      <!-- T-402: KPIs nuevas — Velocidad · Eficiencia · Deuda -->
      <div class="akpi-row akpi-row-new">
        ${_kpiCard('⚡', 'Velocidad de cierre', kpiCloseVelocity.curr, kpiCloseVelocity.prev, _kpiEmptyExtra(`<div class="akpi-hint">ítems / día activo</div>`, kpiCloseVelocity.curr), null, null, 1)}
        ${_kpiCard('🎯', 'Eficiencia de sesión', kpiSessionEfficiency.curr, kpiSessionEfficiency.prev, _kpiEmptyExtra(`<div class="akpi-hint">ítems / sesión</div>`, kpiSessionEfficiency.curr), null, _sparkEfficiency, 1)}
        ${_kpiCard('📦', 'Deuda acumulada', kpiDebt.curr, kpiDebt.prev, `<div class="akpi-hint">ítems pendientes totales</div>`, null, null, -1)}
      </div>

      <!-- T-202605-453: Tiempo promedio pendiente → done -->
      ${_ctHtml}

      <!-- R-202605-128: Forecast de backlog -->
      ${_forecastHtml}

      <!-- Proyecto dominante -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">🏆 Foco del período</div>
          <div class="analytics-section-sub">Proyecto con más sesiones · ${periodLabel}</div>
        </div>
        ${domHtml}
      </div>

      <!-- R-202604-070: Comparación side-by-side -->
      ${compColHtml}

      <!-- Gráfico de barras por día o semana según período -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">📊 Sesiones por ${_analyticsPeriod === 'quarter' ? 'semana' : 'día'}</div>
          <div class="analytics-section-sub">Por proyecto · ${periodLabel}</div>
        </div>
        <div id="analytics-chart-wrap" class="analytics-chart-wrap">
          ${_buildBarChart()}
        </div>
      </div>

      <!-- T-202605-452: Flujo acumulativo — ítems entrando vs saliendo -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">📈 Flujo acumulativo</div>
          <div class="analytics-section-sub">Ítems creados vs cerrados · todos los períodos</div>
        </div>
        <div class="acf-toolbar">
          <select class="acf-select" onchange="setCfProject(this.value)" aria-label="Filtrar por proyecto">
            <option value="">Todos los proyectos</option>
            ${(state.projects || []).map(p => `<option value="${esc(p.id)}" ${_cfProjId === p.id ? 'selected' : ''}>${esc(p.name || p.id)}</option>`).join('')}
          </select>
          <select class="acf-select" onchange="setCfType(this.value)" aria-label="Filtrar por tipo">
            <option value="">Todos los tipos</option>
            <option value="R" ${_cfTypeFilter === 'R' ? 'selected' : ''}>R — Requerimientos</option>
            <option value="T" ${_cfTypeFilter === 'T' ? 'selected' : ''}>T — Tickets</option>
            <option value="B" ${_cfTypeFilter === 'B' ? 'selected' : ''}>B — Bugs</option>
            <option value="P" ${_cfTypeFilter === 'P' ? 'selected' : ''}>P — Ideas</option>
          </select>
        </div>
        <div class="acf-chart-wrap">
          ${_buildCumulativeFlowChart()}
        </div>
      </div>

      <!-- KPIs de IAs -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">🤖 Checkpoints</div>
          <div class="analytics-section-sub">Registros de sesión · ${periodLabel}</div>
        </div>
        ${!_periodHasSessions
          ? `<div class="analytics-empty">Sin checkpoints en este período</div>`
          : `<div class="akpi-row akpi-row-sm">
          <div class="akpi-card akpi-card-sm">
            <div class="akpi-icon">📌</div>
            <div class="akpi-body">
              <div class="akpi-label">Total checkpoints</div>
              <div class="akpi-value">${aiKpiCheckpoints}</div>
            </div>
          </div>
          <div class="akpi-card akpi-card-sm">
            <div class="akpi-icon">📈</div>
            <div class="akpi-body">
              <div class="akpi-label">Promedio por día activo</div>
              <div class="akpi-value">${aiKpiAvgPerDay}</div>
            </div>
          </div>
          <div class="akpi-card akpi-card-sm">
            <div class="akpi-icon">🔥</div>
            <div class="akpi-body">
              <div class="akpi-label">Día pico</div>
              <div class="akpi-value akpi-value-sm">${peakDayLabel}</div>
            </div>
          </div>
        </div>`}
      </div>

      <!-- Heatmap -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">🗓 Actividad diaria</div>
          <div class="analytics-section-sub">Últimas 12 semanas · sesiones por día</div>
        </div>
        <div id="analytics-heatmap"></div>
      </div>

      <!-- Histograma por hora -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">⏰ Distribución por hora</div>
          <div class="analytics-section-sub">Hora del día más frecuente de trabajo</div>
        </div>
        <div id="analytics-hourly"></div>
      </div>

      <!-- B-QA-069-05: analytics-two-col — 2 columnas en ≥1100px -->
      <div class="analytics-two-col">

      <!-- T-202604-275: Patrones de productividad -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">🧠 Patrones de productividad</div>
          <div class="analytics-section-sub">Día y hora pico por proyecto · mín. ${_PROD_MIN_SESSIONS} sesiones</div>
        </div>
        <div id="analytics-productivity"></div>
      </div>

      <!-- T-202604-274: Checkpoints por proyecto -->
      <div class="analytics-section">
        <div class="analytics-section-header">
          <div class="analytics-section-title">📌 Checkpoints por proyecto</div>
          <div class="analytics-section-sub">Semana · mes · total acumulado</div>
        </div>
        <div id="analytics-ckpt-by-proj"></div>
      </div>

      </div><!-- /analytics-two-col -->

    </div>`;
  container.classList.remove('is-loading');
  // T-407: trigger animación de entrada en secciones
  requestAnimationFrame(() => {
    container.querySelectorAll('.analytics-section, .akpi-row, .akpi-row-new, .analytics-control-bar').forEach((el, i) => {
      el.style.setProperty('--section-delay', `${i * 40}ms`);
      el.classList.add('analytics-section--animate');
    });
  });

  // Tooltip sobre barras del gráfico
  const chartWrap = document.getElementById('analytics-chart-wrap');
  if (chartWrap) {
    chartWrap.addEventListener('mousemove', function(e) {
      const seg = e.target.closest('.analytics-bar-seg');
      if (!seg) { hideAnalyticsTooltip(); return; }
      const tip = seg.dataset.tip;
      if (tip) {
        // Parse "Lu 14 Abr · Proyecto: 3" → premium layout
        const parts = tip.split(' · ');
        const dateLabel = parts[0] || '';
        const rest = parts.slice(1).join(' · ');
        const match = rest.match(/^(.+):\s*(\d+)$/);
        const tip2 = getTooltip();
        if (match) {
          const count = parseInt(match[2], 10);
          const color = seg.getAttribute('fill') || 'var(--accent)';
          tip2.innerHTML = `
            <div class="atip-header">
              <span class="atip-date">${dateLabel}</span>
              <span class="atip-total">${count}</span>
            </div>
            <div class="atip-rows">
              <div class="atip-row">
                <span class="atip-dot" style="--atip-color:${color}"></span>
                <span class="atip-name">${esc(match[1])}</span>
                <span class="atip-count">${count}</span>
                <div class="atip-bar-track"><div class="atip-bar-fill" style="--atip-color:${color}"></div></div>
              </div>
            </div>`;
        } else {
          tip2.innerHTML = `<div class="atip-header"><span class="atip-date">${esc(tip)}</span></div>`;
        }
        tip2.classList.add('visible');
        _posTooltip(e);
      }
    });
    chartWrap.addEventListener('mouseleave', hideAnalyticsTooltip);
  }

  renderHeatmap();
  renderHourly();
  renderProductivityPatterns();
  renderCheckpointsByProject();
}

// T-088: Helper — retorna AIs respetando filtro activo de proyecto (legacy)
function _getAnalyticsAIs() {
  const filterId = _getActiveProjectFilter();
  if (!filterId) return state.ais;
  const proj = getProjectById(filterId);
  if (!proj) return state.ais;
  const aiIdsInProj = new Set((proj.sessions || []).map(s => s.aiId).filter(Boolean));
  return state.ais.filter(ai => aiIdsInProj.has(ai.id));
}

// renderRanking y renderStreak eliminados — reemplazados por KPI cards en renderAnalytics v2

// ── T-042: Heatmap de actividad por día de la semana ──

// ── T8: Delegation — #tab-analytics-inner ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const analyticsInner = document.getElementById('tab-analytics-inner');
  if (!analyticsInner) return;
  analyticsInner.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'analytics-goto-tracker':
        switchTab('tracker');
        break;
      case 'analytics-clear-comparison':
        clearComparison();
        break;
      case 'analytics-goto-item':
        navigateToItem(btn.dataset.itemCode);
        break;
      case 'analytics-set-period':
        setAnalyticsPeriod(btn.dataset.period);
        break;
      case 'analytics-export-weekly':
        exportWeeklySummary();
        break;
    }
  });
});
// ─────────────────────────────────────────────────────────────────────────
