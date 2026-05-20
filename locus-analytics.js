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
const _DIGEST_KEY      = 'digest-last-open';
const _DIGEST_COOLDOWN = 8 * 60 * 60 * 1000; // 8 h en ms
const _DIGEST_MAX      = 3;

function _runDigestToasts() {
  // Guardia: no mostrar si la app se abrió hace menos de 8 h
  const now      = Date.now();
  const lastOpen = parseInt(localStorage.getItem(_DIGEST_KEY) || '0', 10);
  if (now - lastOpen < _DIGEST_COOLDOWN) return;
  localStorage.setItem(_DIGEST_KEY, String(now));

  const toasts = [];

  // AC1 — proyectos activos con más de 3 días sin sesión
  const activeProjs = (state.projects || []).filter(p => p.status !== 'paused');
  for (const proj of activeProjs) {
    if (toasts.length >= _DIGEST_MAX) break;
    const sessions = getProjectSessions(proj.id) || [];
    if (!sessions.length) continue; // proyecto sin sesiones — no aplica
    const lastDate = sessions
      .map(s => s.date ? new Date(s.date).getTime() : 0)
      .reduce((a, b) => Math.max(a, b), 0);
    if (!lastDate) continue;
    const daysSince = Math.floor((now - lastDate) / 86400000);
    if (daysSince > 3) {
      toasts.push({
        msg: `📂 <strong>${proj.name}</strong> lleva ${daysSince} días sin sesión`,
        type: 'info'
      });
    }
  }

  // AC2 — ítems bloqueados (sprint + pendiente + 14+ días sin movimiento)
  if (toasts.length < _DIGEST_MAX) {
    const BLOCKED_CUTOFF = now - 14 * 24 * 60 * 60 * 1000;
    const allItems       = typeof ITEMS !== 'undefined' ? ITEMS : [];
    const blockedCount   = allItems.filter(i =>
      i.sprint &&
      i.status === 'pendiente' &&
      (i.updatedAt || i.createdAt) &&
      (i.updatedAt || i.createdAt) < BLOCKED_CUTOFF
    ).length;
    if (blockedCount > 0) {
      toasts.push({
        msg: `🔒 ${blockedCount} ítem${blockedCount !== 1 ? 's' : ''} bloqueado${blockedCount !== 1 ? 's' : ''} — <a href="#" onclick="switchTab('tab-proyectos');return false;" class="analytics-link">ver Proyectos</a>`,
        type: 'warning'
      });
    }
  }

  // Emitir hasta _DIGEST_MAX toasts con stagger de 600 ms
  toasts.slice(0, _DIGEST_MAX).forEach((t, i) => {
    setTimeout(() => showToast(t.type, t.msg, null, 7000), i * 600);
  });
}

// Hook: correr tras load() + render() sin bloquear el render inicial
window.addEventListener('load', () => {
  setTimeout(_runDigestToasts, 1800);
});

// ── T-202605-452: Gráfico de flujo acumulativo — ítems creados vs cerrados ──
function _buildCumulativeFlowChart() {
  const W = 760, H = 220, PAD_L = 42, PAD_R = 16, PAD_T = 16, PAD_B = 36;
  const CHART_W = W - PAD_L - PAD_R;
  const CHART_H = H - PAD_T - PAD_B;

  // ── Recolectar todos los ítems de todos los proyectos (con filtro de proyecto) ──
  const allItems = [];
  (state.projects || []).forEach(p => {
    if (_cfProjId && p.id !== _cfProjId) return;
    try {
      const raw = localStorage.getItem(`backlog-items-${p.id}`);
      if (!raw) return;
      JSON.parse(raw).forEach(item => {
        if (_cfTypeFilter && !(item.code || '').startsWith(_cfTypeFilter)) return;
        allItems.push(item);
      });
    } catch {}
  });

  if (!allItems.length) {
    return `<div class="analytics-empty">Sin datos para mostrar — registra ítems en el backlog</div>`;
  }

  // ── Determinar rango temporal: primer createdAt → hoy ──
  const now = new Date();
  const timestamps = allItems.map(i => i.createdAt).filter(Boolean).map(t => new Date(t));
  if (!timestamps.length) return `<div class="analytics-empty">Sin ítems con fecha de creación</div>`;

  const firstDate = new Date(Math.min(...timestamps));
  firstDate.setHours(0, 0, 0, 0);
  const lastDate = new Date(now);
  lastDate.setHours(23, 59, 59, 999);

  // Granularidad: si el rango > 60 días → semanas; si > 180 días → meses
  const totalDays = Math.ceil((lastDate - firstDate) / 86400000);
  let granularity = 'day';
  if (totalDays > 180) granularity = 'month';
  else if (totalDays > 60) granularity = 'week';

  // ── Construir array de puntos en el tiempo ──
  function buildPoints() {
    const points = [];
    const d = new Date(firstDate);

    while (d <= lastDate) {
      const pEnd = new Date(d);
      if (granularity === 'day')       { pEnd.setHours(23, 59, 59, 999); }
      else if (granularity === 'week') { pEnd.setDate(d.getDate() + 6); pEnd.setHours(23, 59, 59, 999); }
      else                             { pEnd.setMonth(d.getMonth() + 1, 0); pEnd.setHours(23, 59, 59, 999); }

      let opened = 0, closed = 0;
      allItems.forEach(item => {
        const created = item.createdAt ? new Date(item.createdAt) : null;
        const closedTs = item.status === 'done' ? (item.closedAt || item.updatedAt ? new Date(item.closedAt || item.updatedAt) : null) : null;
        if (created && !isNaN(created) && created <= pEnd) opened++;
        if (closedTs && !isNaN(closedTs) && closedTs <= pEnd) closed++;
      });

      points.push({ date: new Date(d), opened, closed });

      if (granularity === 'day')       d.setDate(d.getDate() + 1);
      else if (granularity === 'week') d.setDate(d.getDate() + 7);
      else                             d.setMonth(d.getMonth() + 1);
    }
    return points;
  }

  const points = buildPoints();
  if (points.length < 2) return `<div class="analytics-empty">Insuficientes datos temporales para graficar</div>`;

  const maxVal = Math.max(...points.map(p => p.opened), 1);

  // ── Helper: coordenadas x/y ──
  function xOf(i) { return PAD_L + (i / (points.length - 1)) * CHART_W; }
  function yOf(v) { return PAD_T + CHART_H - (v / maxVal) * CHART_H; }

  // ── Construir paths ──
  function buildPath(key) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p[key]).toFixed(1)}`).join(' ');
  }

  const pathOpened = buildPath('opened');
  const pathClosed = buildPath('closed');

  // ── Area fills (opened - gap between curves) ──
  const areaFill = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p.opened).toFixed(1)}`).join(' ')
    + ' '
    + [...points].reverse().map((p, ri, arr) => {
        const i = points.length - 1 - ri;
        return `${ri === 0 ? 'L' : 'L'}${xOf(i).toFixed(1)},${yOf(p.closed).toFixed(1)}`;
      }).join(' ')
    + ' Z';

  // ── Anotaciones de sprint ──
  const allSprints = (state.projects || []).flatMap(p => {
    if (_cfProjId && p.id !== _cfProjId) return [];
    return (p.sprints || []).map(s => ({ ...s, projName: p.name }));
  });

  const sprintAnnots = allSprints
    .filter(s => s.id)
    .map(s => {
      // Inferir fecha de inicio del sprint a partir del primer ítem done en ese sprint
      let startTs = null;
      allItems.forEach(item => {
        if ((item.sprint || '') !== s.id) return;
        const ts = item.createdAt;
        if (!ts) return;
        if (!startTs || ts < startTs) startTs = ts;
      });
      return startTs ? { id: s.id, ts: new Date(startTs) } : null;
    })
    .filter(Boolean)
    .filter(a => a.ts >= firstDate && a.ts <= lastDate);

  // ── Y-axis ticks ──
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((maxVal / tickCount) * i));

  const DAYS_SHORT  = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
  const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  function fmtDate(d) {
    if (granularity === 'day')   return `${DAYS_SHORT[d.getDay()]} ${d.getDate()}`;
    if (granularity === 'week')  return `${d.getDate()}/${d.getMonth() + 1}`;
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }

  // X-axis labels — show subset to avoid crowding
  const labelStep = Math.ceil(points.length / 8);
  const xLabels = points
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i % labelStep === 0 || i === points.length - 1)
    .map(({ p, i }) => `<text x="${xOf(i).toFixed(1)}" y="${(H - 6).toFixed(1)}" class="acf-axis-label" text-anchor="middle">${esc(fmtDate(p.date))}</text>`);

  // Sprint annotation lines
  const sprintLines = sprintAnnots.map(a => {
    // Find nearest point index
    const idx = points.reduce((best, p, i) => {
      return Math.abs(p.date - a.ts) < Math.abs(points[best].date - a.ts) ? i : best;
    }, 0);
    const x = xOf(idx).toFixed(1);
    return `
      <line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + CHART_H}" class="acf-sprint-line"/>
      <text x="${x}" y="${(PAD_T - 3).toFixed(1)}" class="acf-sprint-label" text-anchor="middle">${esc(a.id)}</text>`;
  });

  // Dots at last point
  const lastIdx = points.length - 1;
  const lastPt = points[lastIdx];

  return `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="acf-svg" role="img" aria-label="Flujo acumulativo de ítems">
      <defs>
        <linearGradient id="acf-grad-gap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--acf-color-gap-top, rgba(234,88,12,0.18))"/>
          <stop offset="100%" stop-color="var(--acf-color-gap-bot, rgba(234,88,12,0.04))"/>
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      ${yTicks.map(v => {
        const y = yOf(v).toFixed(1);
        return `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" class="acf-grid-line"/>
                <text x="${(PAD_L - 6).toFixed(1)}" y="${y}" class="acf-axis-label" text-anchor="end" dominant-baseline="middle">${v}</text>`;
      }).join('')}

      <!-- Sprint annotations -->
      ${sprintLines.join('')}

      <!-- Gap fill between lines -->
      <path d="${areaFill}" class="acf-area-gap"/>

      <!-- Line: opened (creados acumulados) -->
      <path d="${pathOpened}" class="acf-line acf-line--opened"/>

      <!-- Line: closed (cerrados acumulados) -->
      <path d="${pathClosed}" class="acf-line acf-line--closed"/>

      <!-- X-axis labels -->
      ${xLabels.join('')}

      <!-- Endpoint dots -->
      <circle cx="${xOf(lastIdx).toFixed(1)}" cy="${yOf(lastPt.opened).toFixed(1)}" r="4" class="acf-dot acf-dot--opened">
        <title>Creados: ${lastPt.opened}</title>
      </circle>
      <circle cx="${xOf(lastIdx).toFixed(1)}" cy="${yOf(lastPt.closed).toFixed(1)}" r="4" class="acf-dot acf-dot--closed">
        <title>Cerrados: ${lastPt.closed}</title>
      </circle>
    </svg>
    <div class="acf-legend">
      <div class="acf-legend-item">
        <span class="acf-legend-dot acf-legend-dot--opened"></span>
        <span class="acf-legend-label">Creados acumulados</span>
        <span class="acf-legend-val">${lastPt.opened}</span>
      </div>
      <div class="acf-legend-item">
        <span class="acf-legend-dot acf-legend-dot--closed"></span>
        <span class="acf-legend-label">Cerrados acumulados</span>
        <span class="acf-legend-val">${lastPt.closed}</span>
      </div>
      <div class="acf-legend-item acf-legend-item--gap">
        <span class="acf-legend-dot acf-legend-dot--gap"></span>
        <span class="acf-legend-label">Backlog neto</span>
        <span class="acf-legend-val">${lastPt.opened - lastPt.closed}</span>
      </div>
    </div>`;
}

function renderAnalytics() {
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
        <button class="empty-state-btn" onclick="if(typeof switchTab==='function')switchTab('tracker')">Ir al Tracker</button>
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
            <button class="acmp-clear-btn" onclick="clearComparison()">✕ Limpiar comparación</button>
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
      return `<button class="ct-outlier-row" onclick="navigateToItem(${JSON.stringify(o.code)})" title="Ir al ítem">
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
          <button class="period-btn${_analyticsPeriod==='week'?' active':''}" data-period="week" onclick="setAnalyticsPeriod('week')">Últ. 7 días</button>
          <button class="period-btn${_analyticsPeriod==='month'?' active':''}" data-period="month" onclick="setAnalyticsPeriod('month')">Este mes</button>
          <button class="period-btn${_analyticsPeriod==='quarter'?' active':''}" data-period="quarter" onclick="setAnalyticsPeriod('quarter')">Este trimestre</button>
          <span class="analytics-period-label">${periodLabel}</span>
        </div>
        <div class="analytics-actions-group">
          ${compareSelectHtml}
          <button class="analytics-action-btn" onclick="exportWeeklySummary()" title="Exportar resumen de los últimos 7 días">⬇ Resumen semanal</button>
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
const HEATMAP_WEEKS = 12; // últimas N semanas — configurable

function renderHeatmap() {
  const el = document.getElementById('analytics-heatmap');
  if (!el) return;

  // Construir mapa fecha → count (T-088: respeta filtro proyecto)
  const dayCount = {};
  let _excludedCount = 0;
  getAllSessions().forEach(s => {
    const k = sessionDateKey(s);
    if (k) dayCount[k] = (dayCount[k] || 0) + 1;
    else _excludedCount++;
  });

  if (!Object.keys(dayCount).length) {
    el.innerHTML = '<div class="analytics-empty">Sin sesiones registradas</div>';
    return;
  }

  // Construir grid: semanas × 7 días (L=0 … D=6)
  const today = new Date();
  // Ajustar al domingo más reciente como fin de semana
  const endDate = new Date(today);
  // Ir hasta el sábado de esta semana (día 6)
  const dayOfWeek = today.getDay(); // 0=Dom … 6=Sab
  endDate.setDate(today.getDate() + (6 - dayOfWeek));

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (HEATMAP_WEEKS * 7 - 1));

  // Generar todas las celdas
  const weeks = [];
  let week = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dow = d.getDay(); // 0=Dom
    week.push({ k, count: dayCount[k] || 0, dow });
    if (dow === 6) { weeks.push(week); week = []; }
    d.setDate(d.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  const maxCount = Math.max(...Object.values(dayCount), 1);

  function levelClass(count) {
    if (!count) return 'empty';
    const r = count / maxCount;
    if (r < 0.25) return 'l1';
    if (r < 0.5)  return 'l2';
    if (r < 0.75) return 'l3';
    return 'l4';
  }

  const DAY_LABELS = ['D','L','M','X','J','V','S'];
  const SHOW_LABELS = [0, 2, 4]; // Dom, Mar, Jue para no saturar

  // Etiquetas de semana (mes abreviado en primera semana del mes)
  const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  let weeksHtml = '';
  let prevMonth = -1;
  weeks.forEach(wk => {
    const firstDay = wk.find(c => c.k);
    const dt = firstDay ? new Date(firstDay.k) : null;
    const mo = dt ? dt.getMonth() : -1;
    const weekLabel = (dt && mo !== prevMonth) ? MONTH_SHORT[mo] : '';
    if (mo !== prevMonth && mo !== -1) prevMonth = mo;

    // Rellenar si la semana no tiene 7 días (primera/última parcial)
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const cell = wk.find(c => c.dow === i);
      if (cell) {
        const lvl = levelClass(cell.count);
        const weekIdx = weeks.indexOf(wk);
        cells.push(`<div class="heatmap-cell ${lvl}" data-level="${lvl}" data-week="${weekIdx}" title="${cell.k}${cell.count ? ' · ' + cell.count + ' sesión' + (cell.count > 1 ? 'es' : '') : ''}"></div>`);
      } else {
        cells.push(`<div class="heatmap-cell heatmap-cell--hidden"></div>`);
      }
    }

    weeksHtml += `<div class="heatmap-week-col">
      <div class="heatmap-week-header">${weekLabel}</div>
      ${cells.join('')}
    </div>`;
  });

  // Columna de etiquetas días
  const labelsHtml = DAY_LABELS.map((l, i) =>
    `<div class="heatmap-day-label">${SHOW_LABELS.includes(i) ? l : ''}</div>`
  ).join('');

  // Leyenda de niveles
  const legendCells = ['empty','l1','l2','l3','l4'].map(cls =>
    `<div class="heatmap-cell ${cls} heatmap-cell--legend"></div>`
  ).join('');

  el.innerHTML = `
    <div class="heatmap-wrap">
      <div class="heatmap-grid">
        <div class="heatmap-labels-col">${labelsHtml}</div>
        <div class="heatmap-weeks">${weeksHtml}</div>
      </div>
      <!-- T-202604-404: Leyenda inline debajo del grid -->
      <div class="heatmap-legend heatmap-legend--inline">
        <span class="heatmap-legend-label">Menos</span>
        <div class="heatmap-legend-cells">${legendCells}</div>
        <span class="heatmap-legend-label">Más</span>
      </div>
    </div>
    ${_excludedCount > 0 ? `<div class="heatmap-excluded-notice" title="Sesiones sin fecha registrada — no se pueden ubicar en el heatmap">⚠ ${_excludedCount} sesión${_excludedCount > 1 ? 'es' : ''} sin fecha excluida${_excludedCount > 1 ? 's' : ''}</div>` : ''}`;

  // AC2: Stagger reveal por columna (week index)
  requestAnimationFrame(() => {
    el.querySelectorAll('.heatmap-cell[data-week]').forEach(cell => {
      const wIdx = parseInt(cell.dataset.week, 10) || 0;
      cell.style.setProperty('--hm-delay', `${wIdx * 18}ms`);
    });
  });
}

// ── T-045: Distribución de sesiones por hora del día ──
// ── T-202605-454: Insight de horas productivas — dos métricas separadas ──
// Métrica A: hora con más sesiones iniciadas (resetAt)
// Métrica B: hora con más ítems cerrados (closedAt de backlog cruzado con hora de sesión)
function _buildHourlyInsightData(allSess) {
  // A — sesiones por hora
  const sessCountsByHour = new Array(24).fill(0);
  allSess.forEach(s => {
    if (!s.resetAt) return;
    const t = String(s.resetAt).replace(/\D/g, '');
    if (t.length < 3) return;
    const h = parseInt(t.length === 3 ? t[0] : t.slice(0, 2), 10);
    if (h >= 0 && h <= 23) sessCountsByHour[h]++;
  });

  // B — ítems cerrados por hora (closedAt del backlog global)
  const closedCountsByHour = new Array(24).fill(0);
  try {
    const allProjects = (typeof state !== 'undefined' && state.projects) ? state.projects : [];
    allProjects.forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          const ts = item.closedAt || item.updatedAt;
          if (!ts) return;
          const d = new Date(ts);
          if (isNaN(d.getTime())) return;
          const h = d.getHours();
          if (h >= 0 && h <= 23) closedCountsByHour[h]++;
        });
      } catch {}
    });
  } catch {}

  const maxSess   = Math.max(...sessCountsByHour, 0);
  const maxClosed = Math.max(...closedCountsByHour, 0);
  const peakSessH   = maxSess   > 0 ? sessCountsByHour.indexOf(maxSess)   : -1;
  const peakClosedH = maxClosed > 0 ? closedCountsByHour.indexOf(maxClosed) : -1;

  return { sessCountsByHour, closedCountsByHour, maxSess, maxClosed, peakSessH, peakClosedH };
}

function renderHourly() {
  const el = document.getElementById('analytics-hourly');
  if (!el) return;

  // Contar sesiones por hora (0–23) usando resetAt como proxy (T-088: respeta filtro proyecto)
  const counts = new Array(24).fill(0);
  let total = 0;
  getAllSessions().forEach(s => {
    if (!s.resetAt) return; // excluir quickCapture sin hora
    const t = String(s.resetAt).replace(/\D/g, '');
    if (t.length < 3) return;
    const hour = parseInt(t.length === 3 ? t[0] : t.slice(0, 2), 10);
    if (hour >= 0 && hour <= 23) { counts[hour]++; total++; }
  });

  if (!total) {
    el.innerHTML = '<div class="analytics-empty">Sin sesiones con hora registrada</div>';
    return;
  }

  const maxCount = Math.max(...counts, 1);
  const peakHour = counts.indexOf(maxCount);

  const bars = counts.map((c, h) => {
    const heightPct = Math.round((c / maxCount) * 100);
    const isPeak = c === maxCount && c > 0;
    const tip = `${c} sesión${c !== 1 ? 'es' : ''} entre ${String(h).padStart(2,'0')}:00 y ${String(h).padStart(2,'0')}:59`;
    const label = h % 4 === 0 ? String(h).padStart(2,'0') : '';
    return `<div class="hourly-bar-col" title="${tip}">
      <div class="hourly-bar${isPeak ? ' peak' : ''}" style="--bar-h:${Math.max(heightPct, 2)}%"></div>
      <div class="hourly-label">${label}</div>
    </div>`;
  }).join('');

  // T-202605-454: Insight accionable — dos métricas separadas
  const _allSessForInsight = getAllSessions();
  const _insight = _buildHourlyInsightData(_allSessForInsight);
  const _fmt2 = n => String(n).padStart(2, '0');

  let insightHtml = '';
  if (_insight.maxSess > 0 || _insight.maxClosed > 0) {
    const sessLabel = _insight.peakSessH >= 0
      ? `${_fmt2(_insight.peakSessH)}:00 – ${_fmt2(_insight.peakSessH)}:59`
      : '—';
    const closedLabel = _insight.peakClosedH >= 0
      ? `${_fmt2(_insight.peakClosedH)}:00 – ${_fmt2(_insight.peakClosedH)}:59`
      : '—';
    const sameHour = _insight.peakSessH >= 0 && _insight.peakSessH === _insight.peakClosedH;
    const insightText = sameHour
      ? `Tu hora más productiva es ${sessLabel} — máxima actividad y máximos cierres coinciden`
      : _insight.peakClosedH >= 0
        ? `Inicias más sesiones a las ${sessLabel}, pero cierras más ítems a las ${closedLabel}`
        : `Tu hora de mayor actividad es ${sessLabel}`;
    insightHtml = `
    <div class="hourly-insight-row">
      <div class="hourly-insight-icon">💡</div>
      <div class="hourly-insight-body">
        <div class="hourly-insight-text">${insightText}</div>
        <div class="hourly-insight-metrics">
          <span class="hourly-insight-pill hourly-insight-pill--sess" title="Hora con más sesiones iniciadas">
            <span class="hourly-insight-pill-label">Sesiones</span>
            <span class="hourly-insight-pill-val">${sessLabel}</span>
            <span class="hourly-insight-pill-count">${_insight.maxSess}</span>
          </span>
          ${_insight.maxClosed > 0 ? `<span class="hourly-insight-pill hourly-insight-pill--closed" title="Hora con más ítems cerrados">
            <span class="hourly-insight-pill-label">Cierres</span>
            <span class="hourly-insight-pill-val">${closedLabel}</span>
            <span class="hourly-insight-pill-count">${_insight.maxClosed}</span>
          </span>` : ''}
        </div>
      </div>
    </div>`;
  }

  el.innerHTML = `
    <div class="hourly-hero-row">
      <div class="hourly-hero-badge">⚡</div>
      <div class="hourly-hero-body">
        <div class="hourly-hero-time">${String(peakHour).padStart(2,'0')}:00 – ${String(peakHour).padStart(2,'0')}:59</div>
        <div class="hourly-hero-label">Hora pico · ${maxCount} sesión${maxCount !== 1 ? 'es' : ''}</div>
      </div>
    </div>
    ${insightHtml}
    <div class="hourly-wrap">
      <div class="hourly-bars">${bars}</div>
    </div>`;
}

// ── T-202604-275: Patrones de productividad — día y hora más efectivo por proyecto ──
const _PROD_MIN_SESSIONS = 5;
const _DOW_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const _DOW_SHORT  = ['D','L','M','X','J','V','S'];

function renderProductivityPatterns() {
  const el = document.getElementById('analytics-productivity');
  if (!el) return;

  const allSess = getAllSessions();
  if (!allSess.length) {
    el.innerHTML = '<div class="analytics-empty">Sin sesiones registradas</div>';
    return;
  }

  // T-406: ítems cerrados por proyecto en el período activo
  const _pBounds = _getPeriodBounds();
  function _closedForProj(projId) {
    let count = 0;
    const projsToCheck = projId === '__global__' ? (state.projects || []) : (() => {
      const p = getProjectById(projId); return p ? [p] : [];
    })();
    projsToCheck.forEach(p => {
      try {
        const raw = localStorage.getItem(`backlog-items-${p.id}`);
        if (!raw) return;
        JSON.parse(raw).forEach(item => {
          if (item.status !== 'done') return;
          const ts = item.closedAt || item.updatedAt || item.createdAt;
          if (!ts) return;
          const d = new Date(ts);
          if (!isNaN(d) && d >= _pBounds.current.start && d <= _pBounds.current.end) count++;
        });
      } catch {}
    });
    return count;
  }

  const projMap = {};

  const _makeEntry = (name, color) => ({
    name,
    color,
    dowCounts: new Array(7).fill(0),
    hourCounts: new Array(24).fill(0),
    total: 0
  });

  projMap['__global__'] = _makeEntry('Global', 'var(--accent)');

  allSess.forEach(s => {
    let dow = null;
    if (s.date) {
      let d = new Date(s.date);
      if (isNaN(d.getTime())) d = _parseSpanishDate(s.date);
      if (d && !isNaN(d.getTime())) dow = d.getDay();
    }

    let hour = null;
    if (s.resetAt) {
      const t = String(s.resetAt).replace(/\D/g, '');
      if (t.length >= 3) {
        const h = parseInt(t.length === 3 ? t[0] : t.slice(0, 2), 10);
        if (h >= 0 && h <= 23) hour = h;
      }
    }

    if (dow === null && hour === null) return;

    const projId = s.projectId || '__none__';
    if (projId !== '__none__') {
      if (!projMap[projId]) {
        const proj = getProjectById(projId);
        if (proj) projMap[projId] = _makeEntry(proj.name, proj.color || 'var(--accent)');
      }
    }

    const targets = [projMap['__global__']];
    if (projId !== '__none__' && projMap[projId]) targets.push(projMap[projId]);

    targets.forEach(entry => {
      if (dow !== null) entry.dowCounts[dow]++;
      if (hour !== null) entry.hourCounts[hour]++;
      entry.total++;
    });
  });

  const entries = Object.values(projMap).filter(e => e.total >= _PROD_MIN_SESSIONS);

  if (!entries.length) {
    el.innerHTML = `<div class="analytics-empty">Sin datos suficientes — se necesitan al menos ${_PROD_MIN_SESSIONS} sesiones</div>`;
    return;
  }

  function _peakDow(entry) {
    const max = Math.max(...entry.dowCounts);
    if (!max) return { label: '—', count: 0 };
    return { label: _DOW_LABELS[entry.dowCounts.indexOf(max)], count: max };
  }

  function _peakHour(entry) {
    const max = Math.max(...entry.hourCounts);
    if (!max) return { label: '—', count: 0 };
    const h = entry.hourCounts.indexOf(max);
    return { label: `${String(h).padStart(2,'0')}:00`, count: max };
  }

  function _miniDowBar(counts) {
    const max = Math.max(...counts, 1);
    return _DOW_SHORT.map((l, i) => {
      const pct = Math.round((counts[i] / max) * 100);
      const active = counts[i] === Math.max(...counts) && counts[i] > 0;
      return `<div class="ppat-bar-col" title="${_DOW_LABELS[i]}: ${counts[i]}">
        <div class="ppat-bar${active ? ' ppat-bar-peak' : ''}" style="--ppat-h:${Math.max(pct, 4)}%"></div>
        <div class="ppat-bar-label">${l}</div>
      </div>`;
    }).join('');
  }

  function _miniHourBar(counts) {
    const max = Math.max(...counts, 1);
    const groups = [];
    for (let i = 0; i < 24; i += 3) {
      const sum = counts.slice(i, i + 3).reduce((a, b) => a + b, 0);
      const peakInGroup = Math.max(...counts.slice(i, i + 3));
      const globalMax = Math.max(...counts);
      const active = peakInGroup === globalMax && globalMax > 0;
      const pct = Math.round((sum / (max * 3)) * 100);
      groups.push(`<div class="ppat-bar-col" title="${String(i).padStart(2,'0')}–${String(i+2).padStart(2,'0')}h: ${sum}">
        <div class="ppat-bar${active ? ' ppat-bar-peak' : ''}" style="--ppat-h:${Math.max(pct, 4)}%"></div>
        <div class="ppat-bar-label">${String(i).padStart(2,'0')}</div>
      </div>`);
    }
    return groups.join('');
  }

  const rows = entries.map((entry, _entryIdx) => {
    const dow  = _peakDow(entry);
    const hour = _peakHour(entry);
    const colorDot = entry.color.startsWith('var') ? 'var(--accent)' : entry.color;
    // T-406: efectividad cruzada — ítems cerrados en período activo para este proyecto
    const projIdForEff = Object.keys(projMap).find(k => projMap[k] === entry) || '__global__';
    const closedCount  = _closedForProj(projIdForEff);
    const efficiency   = entry.total ? (closedCount / entry.total).toFixed(2) : '0.00';
    const effClass     = parseFloat(efficiency) >= 0.5 ? 'ppat-eff--high' : parseFloat(efficiency) >= 0.2 ? 'ppat-eff--mid' : 'ppat-eff--low';
    return `<div class="ppat-row" style="--ppat-entry-delay:${_entryIdx * 60}ms">
      <div class="ppat-proj-name">
        <span class="ppat-dot" style="--ppat-dot-color:${colorDot}"></span>
        <span>${esc(entry.name)}</span>
        <span class="ppat-total">${entry.total} ses.</span>
      </div>
      <div class="ppat-charts">
        <div class="ppat-chart-block">
          <div class="ppat-chart-label">Día pico · <strong>${dow.label}</strong> (${dow.count})</div>
          <div class="ppat-bars">${_miniDowBar(entry.dowCounts)}</div>
        </div>
        <div class="ppat-chart-block">
          <div class="ppat-chart-label">Hora pico · <strong>${hour.label}</strong> (${hour.count})</div>
          <div class="ppat-bars">${_miniHourBar(entry.hourCounts)}</div>
        </div>
        <div class="ppat-chart-block ppat-eff-block">
          <div class="ppat-chart-label">Efectividad · período activo</div>
          <div class="ppat-eff-row">
            <span class="ppat-eff-num ${effClass}">${efficiency}</span>
            <span class="ppat-eff-detail">${closedCount} ítem${closedCount !== 1 ? 's' : ''} / ${entry.total} ses.</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="ppat-wrap">
      <div class="ppat-note">Mínimo ${_PROD_MIN_SESSIONS} sesiones para mostrar patrón. Hora derivada de hora de reset registrada.</div>
      ${rows}
    </div>`;
}

// ── T-202604-274: Checkpoints por proyecto — esta semana, este mes, total ──
function renderCheckpointsByProject() {
  const el = document.getElementById('analytics-ckpt-by-proj');
  if (!el) return;

  const allSess = getAllSessions();
  if (!allSess.length) {
    el.innerHTML = '<div class="analytics-empty">Sin sesiones registradas</div>';
    return;
  }

  // Calcular bounds fijos (semana actual y mes actual) independientes del período seleccionado
  const now = new Date();

  // Semana actual: lunes→domingo
  const dow = now.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(now); weekStart.setDate(now.getDate() + diffToMon); weekStart.setHours(0,0,0,0);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);

  // Mes actual
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const weekSess  = _sessInRange(allSess, { start: weekStart, end: weekEnd });
  const monthSess = _sessInRange(allSess, { start: monthStart, end: monthEnd });

  // Acumular por proyecto
  const projData = {}; // projId → { name, color, icon, week, month, total }

  function _addToProj(sessArr, field) {
    sessArr.forEach(s => {
      const pid = s.projectId || '__none__';
      if (!projData[pid]) {
        if (pid === '__none__') {
          projData[pid] = { name: 'Sin proyecto', color: 'var(--text3)', icon: '—', week: 0, month: 0, total: 0 };
        } else {
          const p = getProjectById(pid);
          projData[pid] = {
            name: p ? p.name : pid,
            color: p ? (p.color || 'var(--accent)') : 'var(--accent)',
            icon: p ? (p.icon || '📁') : '📁',
            week: 0, month: 0, total: 0
          };
        }
      }
      projData[pid][field]++;
    });
  }

  // Total: contar todas las sesiones primero para asegurar que aparezcan proyectos con 0 en semana/mes
  allSess.forEach(s => {
    const pid = s.projectId || '__none__';
    if (!projData[pid]) {
      if (pid === '__none__') {
        projData[pid] = { name: 'Sin proyecto', color: 'var(--text3)', icon: '—', week: 0, month: 0, total: 0 };
      } else {
        const p = getProjectById(pid);
        projData[pid] = {
          name: p ? p.name : pid,
          color: p ? (p.color || 'var(--accent)') : 'var(--accent)',
          icon: p ? (p.icon || '📁') : '📁',
          week: 0, month: 0, total: 0
        };
      }
    }
    projData[pid].total++;
  });
  _addToProj(weekSess, 'week');
  _addToProj(monthSess, 'month');

  const entries = Object.values(projData).sort((a, b) => b.total - a.total);

  if (!entries.length) {
    el.innerHTML = '<div class="analytics-empty">Sin datos</div>';
    return;
  }

  const maxTotal = Math.max(...entries.map(e => e.total), 1);

  const rowsHtml = entries.map(e => {
    const barPct = Math.round((e.total / maxTotal) * 100);
    const colorStyle = e.color.startsWith('var') ? e.color : e.color;
    const dotStyle = e.color.startsWith('var') ? `color:${e.color}` : `color:${e.color}`;
    return `<div class="ckpt-proj-row">
      <div class="ckpt-proj-name">
        <span class="ckpt-proj-icon">${esc(e.icon)}</span>
        <span class="ckpt-proj-label">${esc(e.name)}</span>
      </div>
      <div class="ckpt-proj-nums">
        <span class="ckpt-num" title="Esta semana">${e.week}</span>
        <span class="ckpt-num" title="Este mes">${e.month}</span>
        <span class="ckpt-num ckpt-num-total" title="Total">${e.total}</span>
      </div>
      <div class="ckpt-proj-bar-track">
        <div class="ckpt-proj-bar-fill" style="--ckpt-bar-pct:${barPct}%;--proj-bar-color:${e.color.startsWith('var') ? 'var(--accent)' : e.color}"></div>
      </div>
    </div>`;
  }).join('');

  // Totales globales
  const totalWeek  = weekSess.length;
  const totalMonth = monthSess.length;
  const totalAll   = allSess.length;

  el.innerHTML = `
    <div class="ckpt-proj-wrap">
      <div class="ckpt-proj-header">
        <div class="ckpt-proj-header-name">Proyecto</div>
        <div class="ckpt-proj-header-nums">
          <span>Semana</span>
          <span>Mes</span>
          <span>Total</span>
        </div>
      </div>
      <div class="ckpt-proj-rows">${rowsHtml}</div>
      <div class="ckpt-proj-footer">
        <span>Total</span>
        <div class="ckpt-proj-header-nums">
          <span>${totalWeek}</span>
          <span>${totalMonth}</span>
          <span>${totalAll}</span>
        </div>
      </div>
    </div>`;
}

// ── T-046: Exportar resumen de analytics en markdown ──
function exportAnalyticsMd() {
  const now = new Date();
  const months = getAnalyticsMonths();
  const rangeLabel = _analyticsRange === 0 ? 'Todo el historial' : `Últimos ${_analyticsRange} mes${_analyticsRange > 1 ? 'es' : ''}`;

  // Totales por IA en el período
  const rows = state.ais.map(ai => {
    const aiSess = getAISessions(ai.id);
    const count = aiSess.filter(s => {
      const ym = sessionYM(s);
      return ym && months.includes(ym);
    }).length;
    return { name: ai.name, count };
  }).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

  const totalSess = rows.reduce((a, r) => a + r.count, 0);
  const topAI = rows[0]?.name || '—';

  // Racha
  const daySet = new Set();
  getAllSessions().forEach(s => {
    const k = sessionDateKey(s);
    if (k) daySet.add(k);
  });
  let maxStreak = 0, streak = 0;
  const sortedDays = [...daySet].sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { streak = 1; }
    else {
      const diff = Math.round((new Date(sortedDays[i]) - new Date(sortedDays[i-1])) / 86400000);
      streak = diff === 1 ? streak + 1 : 1;
    }
    if (streak > maxStreak) maxStreak = streak;
  }

  const fecha = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const monthRows = months.map(ym => {
    const total = getAllSessions().filter(s => sessionYM(s) === ym).length;
    return `| ${fmtMonth(ym)} | ${total} |`;
  });

  const md = `# Locus — Resumen Analytics
> Generado: ${fecha} · Período: ${rangeLabel}

## Métricas clave
- **Sesiones en período:** ${totalSess}
- **IA más activa:** ${topAI}
- **Racha máxima:** ${maxStreak} días consecutivos
- **Días únicos con sesión:** ${daySet.size}
- **IAs activas en período:** ${rows.length}

## Sesiones por IA
${rows.map((r, i) => `${i+1}. **${r.name}** — ${r.count} sesión${r.count !== 1 ? 'es' : ''}`).join('\n')}

## Sesiones por mes
| Mes | Sesiones |
|-----|----------|
${monthRows.join('\n')}
`;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${fecha}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('success', 'Resumen exportado');
}
