// [PP] v1.0.0 · sprint:PP-S-01 · mod:1 · autor:Rune · 2026-06-11 07:00 UTC-6
// locus-pulso.js
// Última actualización: 2026-05-19 | Panel Pulso del Ecosistema
// Extraído de: ai-tracker-checkpoint.js · ai-tracker-ai-notes.js
// Fase A — Refactor JS modular
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';
import { getItems } from './locus-backlog-core.js';

import { loadPlan } from './locus-sprint-plan.js';

import { _tplKey } from './locus-storage.js';

// ════════════════════════════════════════════════════════════════════
// CONSTANTE INTERNA
// ════════════════════════════════════════════════════════════════════

const _PULSO_KEY = 'ai-tracker-pulso';

// ════════════════════════════════════════════════════════════════════
// _calcPulsoDotState — interno
// Calcula estado del ecosistema: colores, velocidad, bloqueantes, sprints estancados
// Dependencias: getItems() (global), state (global)
// ════════════════════════════════════════════════════════════════════

function _calcPulsoDotState() {
  const now   = Date.now();
  const DAY   = 86400000;
  const WEEK  = 7 * DAY;
  const allItems = typeof getItems() !== 'undefined' ? getItems() : [];

  // Proyectos con al menos una sesión
  const activeProjects = (state.projects || []).filter(p => (p.sessions || []).length > 0);

  const projData = activeProjects.map(p => {
    const sessions = p.sessions || [];
    const lastTs   = sessions.reduce((mx, s) => { const t = s.savedAt || s.createdAt || 0; return t > mx ? t : mx; }, 0);
    const daysSince = lastTs ? Math.floor((now - lastTs) / DAY) : 999;

    // Sprint IDs de este proyecto
    const sprintIds = new Set((p.sprints || []).map(s => s.id));

    const closed7   = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) <= WEEK && sprintIds.has(i.sprint)).length;
    const closed714 = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) > WEEK && (now - i.doneAt) <= 2 * WEEK && sprintIds.has(i.sprint)).length;

    let indicator;
    if (closed7 === 0 || daysSince >= 4) {
      indicator = 'parado';
    } else if (closed714 === 0 || closed7 >= closed714 * 1.2) {
      indicator = 'acelerando';
    } else if (closed7 >= closed714 * 0.8) {
      indicator = 'estable';
    } else {
      indicator = 'parado';
    }

    return { id: p.id, name: p.name || p.id, daysSince, closedThisWeek: closed7, closedLastWeek: closed714, indicator, sprintIds };
  });

  // Bloqueantes activos (blockedBy con deps no done)
  const blockerCount = allItems.filter(i =>
    i.status === 'pendiente' && i.blockedBy && i.blockedBy.length > 0 &&
    i.blockedBy.some(c => { const dep = allItems.find(d => d.code === c); return !dep || dep.status !== 'done'; })
  ).length;

  // Sprints activos sin movimiento en 7+ días
  const staleSprints = [];
  activeProjects.forEach(p => {
    (p.sprints || []).filter(s => s.status === 'active').forEach(sp => {
      const closedRecently = allItems.some(i => i.sprint === sp.id && i.status === 'done' && i.doneAt && (now - i.doneAt) <= WEEK);
      if (!closedRecently) staleSprints.push({ name: sp.label || sp.id, project: p.name || p.id });
    });
  });

  // Velocidad global
  const totalThisWeek = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) <= WEEK).length;
  const totalLastWeek = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) > WEEK && (now - i.doneAt) <= 2 * WEEK).length;

  // Color dot
  const hasData   = activeProjects.length > 0;
  const hasRed    = hasData && (projData.some(p => p.daysSince >= 7) || blockerCount > 0);
  const hasYellow = hasData && !hasRed && projData.some(p => p.daysSince >= 4);
  const dotColor  = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

  // B-202605-521: hasData expuesto para que renderPulsoDot aplique --neutral al header dot sin afectar el footer
  return { dotColor, hasData, projData, blockerCount, staleSprints, totalThisWeek, totalLastWeek };
}

// ════════════════════════════════════════════════════════════════════
// _buildPulsoPlanesHtml — interno
// Construye HTML de la sección "Planes activos" dentro del panel Pulso
// Dependencias: state (global), loadPlan (global), _tplKey (global), localStorage
// Extraído de: ai-tracker-ai-notes.js
// ════════════════════════════════════════════════════════════════════

function _buildPulsoPlanesHtml() {
  const projects = (state.projects || []).filter(p => !p.archived);
  const rows = [];

  const backlog = (() => {
    try {
      const raw = localStorage.getItem(_tplKey('backlog-items'));
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  })();
  const _itemByCode = {};
  backlog.forEach(it => { if (it.code) _itemByCode[it.code] = it; });
  const _liveStatus = code => { const it = _itemByCode[code]; return it ? (it.status || 'pendiente') : 'pendiente'; };

  projects.forEach(proj => {
    const sprints = loadPlan(proj.id);
    if (!sprints || !sprints.length) return;

    // Aplanar todas las sesiones de todos los sprints
    const allSessions = sprints.flatMap(sp => sp.sessions || []);
    const totalSess = allSessions.length;
    const doneSess = allSessions.filter(sess => {
      const codes = sess.items || [];
      return codes.length > 0 && codes.every(code => {
        const st = _liveStatus(code);
        return st === 'done' || st === 'descartado';
      });
    }).length;

    // Sprint activo — primer sprint con sesiones pendientes
    const activeSprint = sprints.find(sp =>
      (sp.sessions || []).some(sess =>
        (sess.items || []).some(code => {
          const st = _liveStatus(code);
          return st !== 'done' && st !== 'descartado';
        })
      )
    );
    const sprintLabel = activeSprint ? (activeSprint.id || 'Sin sprint') : (sprints[sprints.length - 1]?.id || '—');

    // Próxima sesión pendiente
    const nextSess = allSessions.find(sess =>
      (sess.items || []).some(code => {
        const st = _liveStatus(code);
        return st !== 'done' && st !== 'descartado';
      })
    );
    const nextItems = nextSess
      ? (nextSess.items || []).filter(code => {
          const st = _liveStatus(code);
          return st !== 'done' && st !== 'descartado';
        }).join(' · ')
      : '';

    rows.push(`<div class="pls-plan-row pls-plan-row--clickable" data-pulso-action="goto-plan" title="Ver plan completo">
      <span class="pls-plan-proj">${esc(proj.name)}</span>
      <span class="pls-plan-sprint">${esc(sprintLabel)}</span>
      <span class="pls-plan-progress">${doneSess}/${totalSess} sesiones</span>
      ${nextItems ? `<span class="pls-plan-next">→ ${esc(nextItems)}</span>` : ''}
    </div>`);
  });

  if (!rows.length) return '';
  return `<div class="pls-section pls-section--list">
    <span class="pls-label">Planes activos</span>
    ${rows.join('')}
  </div>`;
}

// ════════════════════════════════════════════════════════════════════
// renderPulsoDot — público
// Actualiza color y aria-label del dot de pulso en el footer global
// Dependencias: _calcPulsoDotState, _PULSO_KEY, localStorage, DOM (#pulso-dot, #gf-pulso)
// ════════════════════════════════════════════════════════════════════

// T-202605-118: dirty flag — render quirúrgico
let _pulsoDotDirty = false;
export function _markPulsoDotDirty() { _pulsoDotDirty = true; }

export function renderPulsoDot() {
  if (!_pulsoDotDirty) return;
  try {
  // B-202605-522: cálculo de estado ocurre antes de cualquier guard de elemento
  const s = _calcPulsoDotState();
  const labels = { green: 'Ecosistema activo ✓', yellow: '⚠ Actividad baja — algún proyecto inactivo 4-7d', red: '⛔ Alerta — proyectos parados o bloqueantes activos' };
  // DUP-04: punto de entrada consolidado en footer — #gf-pulso es el elemento interactivo
  const dot = document.getElementById('pulso-dot');
  const gfPulso = document.getElementById('gf-pulso');
  // B-202605-521: sin datos → neutral (gris); con datos → color del ecosistema
  const color = s.hasData ? s.dotColor : 'neutral';
  const label = s.hasData ? (labels[s.dotColor] || '') : 'Sin datos';
  if (dot) {
    dot.className = `pulso-dot pulso-dot--${color}`;
  }
  if (gfPulso) {
    gfPulso.setAttribute('aria-label', label);
    gfPulso.title = label;
  }
  try { localStorage.setItem(_PULSO_KEY, JSON.stringify({ color: s.dotColor, ts: Date.now() })); } catch(e) {}
  } finally {
    _pulsoDotDirty = false; // AC-5 T-202605-118: reset en finally
  }
}

// ════════════════════════════════════════════════════════════════════
// openPulsoPanel — público
// Abre el overlay del panel Pulso y renderiza contenido
// Dependencias: _calcPulsoDotState, _buildPulsoPlanesHtml, closePulsoPanel, esc, switchTab (globales)
// ════════════════════════════════════════════════════════════════════

export function openPulsoPanel() {
  const overlay = document.getElementById('pulso-overlay');
  const body    = document.getElementById('pulso-body');
  if (!overlay || !body) return;

  const s = _calcPulsoDotState();

  // Barra de velocidad global
  const velPct   = s.totalLastWeek > 0 ? Math.round((s.totalThisWeek / s.totalLastWeek) * 100) : (s.totalThisWeek > 0 ? 100 : 0);
  const velLabel = s.totalLastWeek === 0
    ? (s.totalThisWeek > 0 ? `${s.totalThisWeek} ítem${s.totalThisWeek !== 1 ? 's' : ''} esta semana` : 'Sin actividad esta semana')
    : `${s.totalThisWeek} cerrados · ${velPct}% vs semana anterior`;
  const velFill  = Math.min(100, velPct || (s.totalThisWeek > 0 ? 60 : 0));
  const velColor = velFill >= 80 ? '#2ecc78' : velFill >= 40 ? '#e8a832' : '#e85555';

  let html = `<div class="pls-section">
    <span class="pls-label">Velocidad global</span>
    <div class="pls-vel-bar-wrap" title="${velLabel}">
      <div class="pls-vel-bar" style="--pls-vel-fill:${velFill}%;--pls-vel-color:${velColor}"></div>
    </div>
    <span class="pls-vel-text">${esc(velLabel)}</span>
  </div>`;

  if (s.projData.length > 0) {
    html += `<div class="pls-section pls-section--list"><span class="pls-label">Proyectos activos</span>`;
    html += s.projData.map(p => {
      const icon  = p.indicator === 'acelerando' ? '▲' : p.indicator === 'estable' ? '●' : '▼';
      const cls   = `pls-ind pls-ind--${p.indicator === 'acelerando' ? 'up' : p.indicator === 'estable' ? 'neutral' : 'down'}`;
      const extra = p.indicator === 'parado' && p.daysSince < 999 ? ` · ${p.daysSince}d sin sesión` : '';
      return `<div class="pls-proj-row">
        <span class="${cls}" title="${p.indicator}">${icon}</span>
        <span class="pls-proj-name">${esc(p.name)}</span>
        <span class="pls-proj-stats">${p.closedThisWeek} cerrado${p.closedThisWeek !== 1 ? 's' : ''}${extra}</span>
      </div>`;
    }).join('');
    html += `</div>`;
  }

  if (s.blockerCount > 0) {
    html += `<div class="pls-section pls-section--alert">
      <button class="pls-blocker-btn" data-pulso-action="goto-backlog">
        ⛔ ${s.blockerCount} bloqueante${s.blockerCount !== 1 ? 's' : ''} activo${s.blockerCount !== 1 ? 's' : ''} → ver en Backlog
      </button>
    </div>`;
  }

  if (s.staleSprints.length > 0) {
    html += `<div class="pls-section"><span class="pls-label">Sprints sin movimiento (7+ días)</span>`;
    html += s.staleSprints.map(sp => `<div class="pls-stale-row">⚠ <strong>${esc(sp.name)}</strong> · ${esc(sp.project)}</div>`).join('');
    html += `</div>`;
  }

  // R-202604-076: Planes activos
  if (typeof _buildPulsoPlanesHtml === 'function') {
    html += _buildPulsoPlanesHtml();
  }

  if (s.projData.length === 0 && s.blockerCount === 0 && s.staleSprints.length === 0) {
    html += `<div class="pls-empty">Sin datos aún. Registra sesiones y ítems para ver el pulso del ecosistema.</div>`;
  }

  body.innerHTML = html;
  overlay.classList.add('pulso-visible');

  // T-202605-045: Event delegation para data-pulso-action (pls-blocker-btn y pls-plan-row)
  if (!body._pulsoHandlerAttached) {
    body._pulsoHandlerAttached = true;
    body.addEventListener('click', (e) => {
      const el = e.target.closest('[data-pulso-action]');
      if (!el) return;
      const action = el.dataset.pulsoAction;
      if (action === 'goto-backlog') {
        closePulsoPanel();
        switchTab('backlog');
      } else if (action === 'goto-plan') {
        closePulsoPanel();
        switchTab('backlog');
        setTimeout(() => { switchSubTab('plan'); }, 80);
      }
    });
  }

  const onKey = (e) => { if (e.key === 'Escape') { closePulsoPanel(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

// ════════════════════════════════════════════════════════════════════
// closePulsoPanel — público
// Cierra el overlay del panel Pulso
// Dependencias: DOM (#pulso-overlay)
// ════════════════════════════════════════════════════════════════════

export function closePulsoPanel() {
  const overlay = document.getElementById('pulso-overlay');
  if (overlay) overlay.classList.remove('pulso-visible');
}

// ════════════════════════════════════════════════════════════════════
// WINDOW FALLBACK
// Cubre call sites en strings de template HTML generado dinámicamente
// en ai-tracker-checkpoint.js y ai-tracker-ai-notes.js.
// Si locus-pulso.js falla al cargar, los onclick HTML no producen ReferenceError.
// ════════════════════════════════════════════════════════════════════


// T-202605-045: Migrar handlers inline de index.html → addEventListener
// #gf-pulso, #pulso-overlay (guard event.target===this), .pulso-close-btn
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initPulsoHandlers, { once: true });
} else {
  _initPulsoHandlers();
}

function _initPulsoHandlers() {
  const gfPulso = document.getElementById('gf-pulso');
  if (gfPulso) gfPulso.addEventListener('click', openPulsoPanel);

  const overlay = document.getElementById('pulso-overlay');
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closePulsoPanel(); });

  const closeBtn = document.querySelector('.pulso-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closePulsoPanel);
}

// T-[tmp:t-listeners-storage-render]: listeners shell:* — desacoplamiento de locus-storage.js
// locus-storage.js despacha shell:mark-pulso-dirty + shell:render-pulso-dot en lugar de llamar directamente
window.addEventListener('shell:mark-pulso-dirty', () => { _markPulsoDotDirty(); });
window.addEventListener('shell:render-pulso-dot', () => { renderPulsoDot(); });
