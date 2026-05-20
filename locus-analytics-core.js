// locus-analytics-core.js
// Responsabilidad: State de analytics, período/rango, helpers de fecha,
//   tooltip, delta, ítems abiertos/cerrados, export semanal MD.
// Dependencias: locus-storage.js · locus-toast.js

// locus-analytics.js
// Última actualización: 2026-05-19 UTC-6
// Módulo de analytics — KPIs, heatmap, productividad, flujo acumulativo, digest toasts
// Renombrado de ai-tracker-analytics.js
// Requiere: locus-storage.js · ai-tracker-checkpoint.js

const ANALYTICS_COLORS = ['#8BC34A','#38bdf8','#e8a832','#e85555','#f472b6','#a3e635','#fb923c','#2ecc78'];

function getAnalyticsColor(idx) {
  return ANALYTICS_COLORS[idx % ANALYTICS_COLORS.length];
}

// ── Analytics período: 'week' | 'month' | 'quarter' (default: week) ──
let _analyticsPeriod = localStorage.getItem('analytics-period') || 'week';
// R-202604-070: Comparación side-by-side — dos proyectos independientes
let _compareProjectIdA = null;
let _compareProjectIdB = null;
// Alias legacy para retrocompatibilidad con setCompareProject existente
function setCompareProject(projId) {
  _compareProjectIdB = projId || null;
  renderAnalytics();
}
function setCompareProjectA(projId) {
  _compareProjectIdA = projId || null;
  renderAnalytics();
}
function setCompareProjectB(projId) {
  _compareProjectIdB = projId || null;
  renderAnalytics();
}
function clearComparison() {
  _compareProjectIdA = null;
  _compareProjectIdB = null;
  renderAnalytics();
}

function setAnalyticsPeriod(p) {
  _analyticsPeriod = p;
  localStorage.setItem('analytics-period', p);
  document.querySelectorAll('.period-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.period === p);
  });
  renderAnalytics();
}

// Legacy — mantenido para compatibilidad con exportAnalyticsMd y otros llamadores
let _analyticsRange = 3;
function setAnalyticsRange(n) { _analyticsRange = n; renderAnalytics(); }

// T-202605-452: Gráfico de flujo acumulativo — filtros de proyecto y tipo
let _cfProjId   = '';
let _cfTypeFilter = '';
function setCfProject(id)   { _cfProjId = id || ''; renderAnalytics(); }
function setCfType(t)        { _cfTypeFilter = t || ''; renderAnalytics(); }

// Devuelve { current: {start,end}, previous: {start,end} } para el período activo
function _getPeriodBounds() {
  const now = new Date();
  if (_analyticsPeriod === 'week') {
    // T-202604-399: 7 días rodantes (hoy incluido) en lugar de semana calendario
    const end = new Date(now); end.setHours(23,59,59,999);
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0,0,0,0);
    const prevEnd = new Date(start); prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    const prevStart = new Date(prevEnd); prevStart.setDate(prevEnd.getDate() - 6); prevStart.setHours(0,0,0,0);
    return { current: { start, end }, previous: { start: prevStart, end: prevEnd } };
  }
  if (_analyticsPeriod === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const pStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const pEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { current: { start, end }, previous: { start: pStart, end: pEnd } };
  }
  // quarter
  const q = Math.floor(now.getMonth() / 3);
  const qStart = new Date(now.getFullYear(), q * 3, 1);
  const qEnd = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
  const pqStart = new Date(now.getFullYear(), q * 3 - 3, 1);
  const pqEnd = new Date(now.getFullYear(), q * 3, 0, 23, 59, 59, 999);
  return { current: { start: qStart, end: qEnd }, previous: { start: pqStart, end: pqEnd } };
}

// Filtra sesiones dentro de un rango {start,end}
function _sessInRange(sessions, range) {
  return sessions.filter(s => {
    if (!s.date) return false;
    let d = new Date(s.date);
    if (isNaN(d.getTime())) d = _parseSpanishDate(s.date);
    return d && !isNaN(d.getTime()) && d >= range.start && d <= range.end;
  });
}

// Devuelve etiqueta del período actual
function _periodLabel() {
  const now = new Date();
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  if (_analyticsPeriod === 'week') {
    // T-202604-399: etiqueta de 7 días rodantes
    const bounds = _getPeriodBounds();
    const s = bounds.current.start, e = bounds.current.end;
    return `Últ. 7 días · ${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]}`;
  }
  if (_analyticsPeriod === 'month') return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `Q${q} ${now.getFullYear()}`;
}

// Etiqueta del período anterior
function _prevPeriodLabel() {
  const now = new Date();
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  if (_analyticsPeriod === 'week') {
    const bounds = _getPeriodBounds();
    const s = bounds.previous.start, e = bounds.previous.end;
    return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]}`;
  }
  if (_analyticsPeriod === 'month') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${MONTHS[prev.getMonth()]} ${prev.getFullYear()}`;
  }
  const q = Math.floor(now.getMonth() / 3);
  const prevQ = q === 0 ? 4 : q;
  const prevY = q === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return `Q${prevQ} ${prevY}`;
}

// Delta formateado con flecha
function _delta(curr, prev) {
  if (prev === 0 && curr === 0) return { html: '<span class="kpi-delta neutral">—</span>', dir: 0 };
  if (prev === 0) return { html: `<span class="kpi-delta up">▲ nuevo</span>`, dir: 1 };
  const d = curr - prev;
  if (d === 0) return { html: `<span class="kpi-delta neutral">= igual</span>`, dir: 0 };
  const pct = Math.round(Math.abs(d / prev) * 100);
  if (d > 0) return { html: `<span class="kpi-delta up">▲ ${pct}%</span>`, dir: 1 };
  return { html: `<span class="kpi-delta down">▼ ${pct}%</span>`, dir: -1 };
}

// Genera semanas dentro del período actual para el gráfico de barras
// Mantenido por compatibilidad — internamente delega a _getIntervalsInPeriod
function _getWeeksInPeriod() {
  return _getIntervalsInPeriod().intervals;
}

// Granularidad adaptativa según período:
//   week   → días (7 barras)
//   month  → días (28–31 barras)
//   quarter → semanas (12–13 barras)
// Devuelve { intervals, granularity } donde cada interval es { start, end, idx }
function _getIntervalsInPeriod() {
  const bounds = _getPeriodBounds();
  const { start, end } = bounds.current;
  const granularity = _analyticsPeriod === 'quarter' ? 'week' : 'day';
  const intervals = [];

  if (granularity === 'day') {
    // Un intervalo por día desde start hasta end
    const d = new Date(start); d.setHours(0,0,0,0);
    const endDay = new Date(end); endDay.setHours(23,59,59,999);
    let idx = 0;
    while (d <= endDay) {
      const iStart = new Date(d);
      const iEnd = new Date(d); iEnd.setHours(23,59,59,999);
      intervals.push({ start: iStart, end: iEnd, idx: idx++ });
      d.setDate(d.getDate() + 1);
    }
  } else {
    // Un intervalo por semana (lunes→domingo)
    const d = new Date(start);
    const dow = d.getDay();
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diffToMon);
    d.setHours(0,0,0,0);
    let idx = 0;
    while (d <= end) {
      const wStart = new Date(d);
      const wEnd = new Date(d); wEnd.setDate(d.getDate() + 6); wEnd.setHours(23,59,59,999);
      intervals.push({ start: wStart, end: wEnd, idx: idx++ });
      d.setDate(d.getDate() + 7);
    }
  }

  return { intervals, granularity };
}

// Devuelve los últimos N meses como strings 'YYYY-MM', más antiguo primero (legacy)
function lastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// Legacy — usado por exportAnalyticsMd
function getAnalyticsMonths() { return lastNMonths(3); }

// Formatea 'YYYY-MM' → 'Ene 25' para eje X
function fmtMonth(ym) {
  const [y, m] = ym.split('-');
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return names[parseInt(m, 10) - 1] + ' ' + String(y).slice(2);
}

// Extrae 'YYYY-MM' de un campo date de sesión
function sessionYM(s) {
  if (!s.date) return null;
  let d = new Date(s.date);
  if (isNaN(d.getTime())) d = _parseSpanishDate(s.date);
  if (!d || isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Parsea formato de fecha español legacy: "12 abr 2026 11:08 a.m."
function _parseSpanishDate(str) {
  const _MES = {ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11};
  const m = String(str).toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?))?/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = _MES[m[2].slice(0,3)];
  const year = parseInt(m[3], 10);
  if (mon === undefined || isNaN(day) || isNaN(year)) return null;
  let hour = m[4] ? parseInt(m[4], 10) : 12;
  const min = m[5] ? parseInt(m[5], 10) : 0;
  if (m[6]) {
    const pm = m[6].replace(/\./g,'') === 'pm';
    if (pm && hour !== 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
  }
  return new Date(year, mon, day, hour, min, 0);
}

// Extrae fecha YYYY-MM-DD de sesión para cálculos de racha
function sessionDateKey(s) {
  if (!s.date) return null;
  let d = new Date(s.date);
  if (isNaN(d.getTime())) d = _parseSpanishDate(s.date);
  if (!d || isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Tooltip singleton
let _analyticsTooltip = null;
function getTooltip() {
  if (!_analyticsTooltip) {
    _analyticsTooltip = document.createElement('div');
    _analyticsTooltip.className = 'analytics-tooltip';
    document.body.appendChild(_analyticsTooltip);
  }
  return _analyticsTooltip;
}

function showAnalyticsTooltip(e, monthLabel, rows) {
  const tip = getTooltip();
  const total = rows.reduce((s, r) => s + r.count, 0);
  tip.innerHTML = `
    <div class="atip-header">
      <span class="atip-date">${monthLabel}</span>
      <span class="atip-total">${total}</span>
    </div>
    <div class="atip-rows">
      ${rows.map(r => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
        return `<div class="atip-row">
          <span class="atip-dot" style="--tip-dot-color:${r.color}"></span>
          <span class="atip-name">${esc(r.name)}</span>
          <span class="atip-count">${r.count}</span>
          <div class="atip-bar-track"><div class="atip-bar-fill" style="--tip-bar-pct:${pct}%;--tip-bar-color:${r.color}"></div></div>
        </div>`;
      }).join('')}
    </div>`;
  tip.classList.add('visible');
  _posTooltip(e);
}

function _posTooltip(e) {
  const tip = getTooltip();
  const tw = tip.offsetWidth || 140;
  const th = tip.offsetHeight || 80;
  let x = e.clientX + 14;
  let y = e.clientY - th / 2;
  if (x + tw > window.innerWidth - 8) x = e.clientX - tw - 14;
  if (y < 4) y = 4;
  if (y + th > window.innerHeight - 4) y = window.innerHeight - th - 4;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}

function hideAnalyticsTooltip() {
  const tip = getTooltip();
  tip.classList.remove('visible');
}

// ═══ T-202604-380: Count-up en métricas numéricas de cards de proyectos ═══
let _countupDone = false;

function _animateCountUp(container) {
  if (_countupDone) return;
  _countupDone = true;

  const els = container.querySelectorAll('[data-countup]');
  if (!els.length) return;

  const duration = 400;
  const start = performance.now();

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeOut(progress);

    els.forEach(el => {
      const target = parseInt(el.dataset.countup, 10);
      if (isNaN(target)) return;
      const current = Math.round(ease * target);

      // Preserve first text node (the number + optional suffix like "%")
      // Children (e.g. .proy2-metric-frac) are untouched — only the leading text node
      const firstChild = el.firstChild;
      if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
        const full = firstChild.textContent;
        // Replace leading integer in the text node
        firstChild.textContent = full.replace(/^\d+/, current);
      } else if (!el.querySelector('[data-countup-skip]')) {
        // Fallback: element has no text node prefix (pure number, no suffix)
        const saved = el.innerHTML;
        el.dataset.countupSaved = el.dataset.countupSaved || saved;
        el.textContent = String(current);
      }
    });

    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ═══ T-202604-119: Tab Proyectos — Dashboard estratégico ═══
function _closedItemsInRange(range) {
  let count = 0;
  (state.projects || []).forEach(p => {
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        if (item.status !== 'done') return;
        const ts = item.closedAt || item.updatedAt || item.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (!isNaN(d) && d >= range.start && d <= range.end) count++;
      });
    } catch {}
  });
  return count;
}

// Retorna count de ítems creados en range {start,end}
function _openedItemsInRange(range) {
  let count = 0;
  (state.projects || []).forEach(p => {
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        const ts = item.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (!isNaN(d) && d >= range.start && d <= range.end) count++;
      });
    } catch {}
  });
  return count;
}

// Retorna array de ítems done en range, con campos {code, title, projId, projName}
function _closedItemsDetailInRange(range) {
  const results = [];
  (state.projects || []).forEach(p => {
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        if (item.status !== 'done') return;
        const ts = item.closedAt || item.updatedAt || item.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (!isNaN(d) && d >= range.start && d <= range.end) {
          results.push({ code: item.code || '—', title: item.title || '—', projId: p.id, projName: p.name || p.id });
        }
      });
    } catch {}
  });
  return results;
}

// Retorna array de ítems creados en range, con campos {code, title, projId, projName}
function _openedItemsDetailInRange(range) {
  const results = [];
  (state.projects || []).forEach(p => {
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        const ts = item.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (!isNaN(d) && d >= range.start && d <= range.end) {
          results.push({ code: item.code || '—', title: item.title || '—', projId: p.id, projName: p.name || p.id });
        }
      });
    } catch {}
  });
  return results;
}

// ── T-202604-273: Resumen semanal exportable a MD ──
function exportWeeklySummary() {
  const now = new Date();

  // Últimos 7 días (hoy inclusive)
  const end   = new Date(now); end.setHours(23,59,59,999);
  const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0,0,0,0);
  const range = { start, end };

  // B-202605-040: guard typeof — getAllSessions puede no estar disponible si el módulo no cargó
  if (typeof getAllSessions !== 'function') {
    showToast('error', 'Error al exportar — módulo de sesiones no disponible');
    return;
  }
  const allSess  = getAllSessions();
  const weekSess = _sessInRange(allSess, range);

  // Sesiones por proyecto
  const projSessMap = {};
  weekSess.forEach(s => {
    const pid = s.projectId || '__none__';
    if (!projSessMap[pid]) {
      const p = pid === '__none__' ? null : (state.projects || []).find(x => x.id === pid);
      projSessMap[pid] = { name: p ? p.name : 'Sin proyecto', sessions: [] };
    }
    projSessMap[pid].sessions.push(s);
  });

  // Ítems done y nuevos en la semana con detalle
  const doneItems   = _closedItemsDetailInRange(range);
  const newItems    = _openedItemsDetailInRange(range);

  // Checkpoints por proyecto (de T-274, misma lógica)
  const ckptByProj = Object.entries(projSessMap)
    .sort((a, b) => b[1].sessions.length - a[1].sessions.length)
    .map(([, v]) => `| ${v.name} | ${v.sessions.length} |`)
    .join('\n');

  // Formatear rango
  const MO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const fmtDate = d => `${d.getDate()} ${MO[d.getMonth()]} ${d.getFullYear()}`;
  const fechaFile = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  // Sesiones individuales agrupadas por proyecto
  let sessByProjMd = '';
  Object.values(projSessMap).forEach(({ name, sessions }) => {
    sessByProjMd += `\n### ${name}\n`;
    sessions
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .forEach(s => {
        const dateStr = s.dateShort || (s.date ? s.date.slice(0, 10) : '—');
        sessByProjMd += `- **${dateStr}** · ${s.title || '(sin título)'}\n`;
        if (s.summary) sessByProjMd += `  ${s.summary}\n`;
      });
  });
  if (!sessByProjMd) sessByProjMd = '\n_Sin sesiones en este período._\n';

  const doneSection = doneItems.length
    ? doneItems.map(i => `- \`${i.code}\` ${i.title} _(${i.projName})_`).join('\n')
    : '_Sin ítems cerrados en la semana._';

  const newSection = newItems.length
    ? newItems.map(i => `- \`${i.code}\` ${i.title} _(${i.projName})_`).join('\n')
    : '_Sin ítems nuevos en la semana._';

  // T-202605-454: Insight de horas productivas para el resumen semanal
  const _wkInsight = _buildHourlyInsightData(weekSess);
  const _wi_fmt = n => String(n).padStart(2, '0');
  let weeklyInsightMd = '';
  if (_wkInsight.maxSess > 0) {
    const wSessLabel   = _wkInsight.peakSessH >= 0 ? `${_wi_fmt(_wkInsight.peakSessH)}:00–${_wi_fmt(_wkInsight.peakSessH)}:59` : '—';
    const wClosedLabel = _wkInsight.peakClosedH >= 0 ? `${_wi_fmt(_wkInsight.peakClosedH)}:00–${_wi_fmt(_wkInsight.peakClosedH)}:59` : '—';
    const wSame = _wkInsight.peakSessH >= 0 && _wkInsight.peakSessH === _wkInsight.peakClosedH;
    const wText = wSame
      ? `Tu hora más productiva esta semana fue ${wSessLabel} — máxima actividad y máximos cierres coincidieron`
      : _wkInsight.peakClosedH >= 0
        ? `Iniciaste más sesiones a las ${wSessLabel} (${_wkInsight.maxSess}), pero cerraste más ítems a las ${wClosedLabel} (${_wkInsight.maxClosed})`
        : `Tu hora de mayor actividad esta semana fue ${wSessLabel} (${_wkInsight.maxSess} sesiones)`;
    weeklyInsightMd = `\n## Insight de horas productivas\n\n${wText}\n\n| Métrica | Hora pico | Total |\n|---------|-----------|-------|\n| Sesiones iniciadas | ${wSessLabel} | ${_wkInsight.maxSess} |\n${_wkInsight.maxClosed > 0 ? `| Ítems cerrados | ${wClosedLabel} | ${_wkInsight.maxClosed} |\n` : ''}`;
  }

  const md =
`# PEPE — Resumen semanal
> Período: ${fmtDate(start)} – ${fmtDate(end)} · Generado: ${fmtDate(now)}

## Checkpoints por proyecto

| Proyecto | Checkpoints |
|----------|-------------|
${ckptByProj || '| — | 0 |'}

**Total:** ${weekSess.length} checkpoint${weekSess.length !== 1 ? 's' : ''}

## Sesiones de la semana
${sessByProjMd}
## Ítems cerrados (done)

${doneSection}

## Ítems nuevos creados

${newSection}
${weeklyInsightMd}`;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `PEPE-Resumen-${fechaFile}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('success', 'Resumen semanal exportado');
}

// ── T-202604-271: Digest contextual al abrir app ──
