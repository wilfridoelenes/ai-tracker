// [PP] mod:5 · autor:Rune · 2026-07-09 13:58 UTC-6
// T-202606-166: getProjectById movida a locus-storage.js — import actualizado.
// INC-[pendiente-ID]: header migrado a formato canónico (BR-Execution §9) — v/sprint eliminados.
// INC-[pendiente-ID]: state referenciado sin import en _closedForProj —
// ReferenceError en runtime (ESM sin bundler). Fix: import getState + reemplazo.
// INC-[pendiente-ID]: _closedForProj leía backlog-items-{id} crudo sin merge de historico —
// subcuenta ítems done de sprints cerrados. Fix: usa _activeAndHistoricoItems (core.js).
// INC-[pendiente-ID]: _buildHourlyInsightData (Métrica B) tenía el mismo patrón sin detectar:
// `typeof state !== 'undefined'` (línea ~161) nunca es true en ESM sin global — falla en
// silencio, no lanza error, pero "ítems cerrados por hora" queda siempre vacío. Además leía
// backlog-items-{id} crudo, mismo gap de historico que _closedForProj. Fix: getState() +
// _activeAndHistoricoItems(p), con el mismo criterio done/historico de core.js.
import { _activeAndHistoricoItems, _getPeriodBounds, _parseSpanishDate, _sessInRange, sessionDateKey } from './locus-analytics-core.js';
import { getAllSessions, getProjectById, getState } from './locus-storage.js';

import { esc } from './locus-ui-shell.js';

// locus-analytics-charts.js
// Responsabilidad: Heatmap, distribución horaria, patrones de productividad,
//   checkpoints por proyecto.
// Dependencias: locus-analytics-core.js · locus-storage.js

const HEATMAP_WEEKS = 12; // últimas N semanas — configurable

export function renderHeatmap() {
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
export function _buildHourlyInsightData(allSess) {
  // A — sesiones por hora
  const sessCountsByHour = new Array(24).fill(0);
  allSess.forEach(s => {
    if (!s.resetAt) return;
    const t = String(s.resetAt).replace(/\D/g, '');
    if (t.length < 3) return;
    const h = parseInt(t.length === 3 ? t[0] : t.slice(0, 2), 10);
    if (h >= 0 && h <= 23) sessCountsByHour[h]++;
  });

  // B — ítems cerrados por hora (closedAt del backlog global, incluye historico de sprints cerrados)
  const closedCountsByHour = new Array(24).fill(0);
  try {
    const allProjects = getState().projects || [];
    allProjects.forEach(p => {
      _activeAndHistoricoItems(p).forEach(item => {
        if (item.status !== 'done' && item.status !== 'historico') return;
        if (item.status === 'historico' && item.discardReason) return;
        const ts = item.closedAt || item.archivedAt || item.updatedAt;
        if (!ts) return;
        const d = new Date(ts);
        if (isNaN(d.getTime())) return;
        const h = d.getHours();
        if (h >= 0 && h <= 23) closedCountsByHour[h]++;
      });
    });
  } catch {}

  const maxSess   = Math.max(...sessCountsByHour, 0);
  const maxClosed = Math.max(...closedCountsByHour, 0);
  const peakSessH   = maxSess   > 0 ? sessCountsByHour.indexOf(maxSess)   : -1;
  const peakClosedH = maxClosed > 0 ? closedCountsByHour.indexOf(maxClosed) : -1;

  return { sessCountsByHour, closedCountsByHour, maxSess, maxClosed, peakSessH, peakClosedH };
}

export function renderHourly() {
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

export function renderProductivityPatterns() {
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
    const projsToCheck = projId === '__global__' ? (getState().projects || []) : (() => {
      const p = getProjectById(projId); return p ? [p] : [];
    })();
    projsToCheck.forEach(p => {
      _activeAndHistoricoItems(p).forEach(item => {
        if (item.status !== 'done' && item.status !== 'historico') return;
        if (item.status === 'historico' && item.discardReason) return;
        const ts = item.closedAt || item.updatedAt || item.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (!isNaN(d) && d >= _pBounds.current.start && d <= _pBounds.current.end) count++;
      });
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
export function renderCheckpointsByProject() {
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

