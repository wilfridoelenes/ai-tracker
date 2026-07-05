// [PP] mod:6 · autor:Rune · 2026-07-05 11:05 UTC-6
// INC-[pendiente-ID] — verificado contra locus-storage.js real: p.sprints fue eliminado del blob
// por REQ-sprints-migration. allSprints (anotaciones de sprint en el gráfico) leía p.sprints →
// siempre vacío → sin líneas de anotación, en silencio. Fix: getAllProjectsSprints()[p.id].
// INC-[pendiente-ID]: header migrado a formato canónico (BR-Execution §9) — v/sprint eliminados.
// INC-[pendiente-ID]: state referenciado sin import en _buildCumulativeFlowChart (2 sitios) —
// ReferenceError en runtime. Fix: import getState desde locus-storage.js.
// INC-[pendiente-ID]: _cfProjId y _cfTypeFilter (filtros del propio gráfico que esta función
// construye, 3 sitios: proyecto x2, tipo x1) también se referenciaban bare — mismo patrón, no
// detectado en el fix anterior porque el ReferenceError de `state` ocurría primero en el flujo.
import { esc } from './locus-ui-shell.js';
import { getAllProjectsSprints, getState } from './locus-storage.js';
import { _cfProjId, _cfTypeFilter } from './locus-analytics-core.js';
// locus-analytics-digest.js
// Responsabilidad: Gráfico de flujo acumulativo (_buildCumulativeFlowChart).
// Dependencias: locus-analytics-core.js · locus-storage.js
// R-202605-056: _runDigestToasts eliminada — digest de toasts al abrir app removido.

export function _buildCumulativeFlowChart() {
  const W = 760, H = 220, PAD_L = 42, PAD_R = 16, PAD_T = 16, PAD_B = 36;
  const CHART_W = W - PAD_L - PAD_R;
  const CHART_H = H - PAD_T - PAD_B;

  // ── Recolectar todos los ítems de todos los proyectos (con filtro de proyecto) ──
  const allItems = [];
  (getState().projects || []).forEach(p => {
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
  // INC-[pendiente-ID]: p.sprints eliminado del blob por REQ-sprints-migration (locus-storage.js
  // §_applyStateData) — allSprints quedaba siempre vacío, sin líneas de anotación de sprint en el
  // gráfico. Fix: getAllProjectsSprints()[p.id].
  const allSprints = (getState().projects || []).flatMap(p => {
    if (_cfProjId && p.id !== _cfProjId) return [];
    return (getAllProjectsSprints()[p.id] || []).map(s => ({ ...s, projName: p.name }));
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

