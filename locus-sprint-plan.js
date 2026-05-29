// [PP] v1.2.4 · sprint:PP-S-09 · mod:4 · autor:Rune · 2026-05-28 UTC-6
// locus-sprint-plan.js
// Versión: 1.1 | Última actualización: 2026-05-28 UTC-6 | R-202605-043: renderPlanInto + _buildPlanContent
// Módulo: Bloque PLAN — savePlan, loadPlan, renderPlan, togglePlanZoneDone
// Extraído de ai-tracker-ai-notes.js · Renombrado de locus-plan.js (T-202605-066)
import { _offlineQueuePush, _tplKey, getActiveSprints } from './locus-storage.js';
import { showToast } from './locus-toast.js';

// ── Helpers de módulo — T3.bis ────────────────────────────────────────────────
// Versiones de módulo de _liveStatus y _sessIsDone para consumo externo.
// Leen directamente de localStorage (mismo patrón que _buildPlanContent).
function _getItemByCode() {
  try {
    const raw = localStorage.getItem(_tplKey('backlog-items'));
    const items = raw ? JSON.parse(raw) : [];
    const map = {};
    items.forEach(it => { if (it.code) map[it.code] = it; });
    return map;
  } catch(e) { return {}; }
}

export function _liveStatus(code) {
  const map = _getItemByCode();
  const it = map[code];
  return it ? (it.status || 'pendiente') : 'pendiente';
}

export function _sessIsDone(sess) {
  const map = _getItemByCode();
  const codes = sess.items || [];
  return codes.length > 0 && codes.every(c => {
    const it = map[c];
    const s = it ? (it.status || 'pendiente') : 'pendiente';
    return s === 'done' || s === 'descartado';
  });
}

// ════════════════════════════════════════════════════════════════════
// R-202604-076 · Bloque ---PLAN--- · Sub-tab Plan en Documentos
// ════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
// T-202605-068 — Migración de keys de storage al prefijo sprint-plan:*
//
// Keys anteriores (deprecados):
//   localStorage : ai-tracker-plan-{projId}
//   localStorage : ai-tracker-plan-auto-{projId}
//   localStorage : locus-plan-zone-done-collapsed
//   Supabase     : plan-{projId}   (tracker_docs.key)
//
// Keys canónicos nuevos (sprint-plan:*):
//   localStorage : sprint-plan:{projId}
//   localStorage : sprint-plan:auto-{projId}
//   localStorage : sprint-plan:zone-done-collapsed
//   Supabase     : sprint-plan-{projId}  (tracker_docs.key)
// ════════════════════════════════════════════════════════════════════

// Storage key para planes por proyecto
function _planKey(projId) { return `sprint-plan:${projId}`; }

// T-202605-068: migración atómica de keys legacy → sprint-plan:*
// Fases: (1) escribir nuevos keys · (2) verificar lectura · (3) eliminar anteriores
// Si verificación falla → rollback completo + toast · keys anteriores intactos
function _migratePlanKeys() {
  const toMigrate = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('ai-tracker-plan-') && !k.includes('-auto-')) {
        const projId = k.slice('ai-tracker-plan-'.length);
        toMigrate.push({ oldKey: k, newKey: `sprint-plan:${projId}` });
      } else if (k.startsWith('ai-tracker-plan-auto-')) {
        const projId = k.slice('ai-tracker-plan-auto-'.length);
        toMigrate.push({ oldKey: k, newKey: `sprint-plan:auto-${projId}` });
      } else if (k === 'locus-plan-zone-done-collapsed') {
        toMigrate.push({ oldKey: k, newKey: 'sprint-plan:zone-done-collapsed' });
      }
    }
  } catch(e) {
    console.warn('[locus-sprint-plan] _migratePlanKeys scan error:', e);
    return;
  }
  if (!toMigrate.length) return;

  // Fase 1 — escribir nuevos keys
  const written = [];
  let writeFailed = false;
  for (const { oldKey, newKey } of toMigrate) {
    try {
      const val = localStorage.getItem(oldKey);
      if (val === null) continue;
      localStorage.setItem(newKey, val);
      written.push({ oldKey, newKey, originalVal: val });
    } catch(e) {
      writeFailed = true;
      console.warn('[locus-sprint-plan] _migratePlanKeys write error:', newKey, e);
      break;
    }
  }

  if (writeFailed) {
    written.forEach(({ newKey }) => { try { localStorage.removeItem(newKey); } catch(e2) {} });
    showToast('Error al migrar storage del Plan — datos anteriores intactos', 'error');
    return;
  }

  // Fase 2 — verificar lectura de nuevos keys
  let verifyFailed = false;
  for (const { newKey, originalVal } of written) {
    try {
      if (localStorage.getItem(newKey) !== originalVal) { verifyFailed = true; break; }
    } catch(e) { verifyFailed = true; break; }
  }

  if (verifyFailed) {
    written.forEach(({ newKey }) => { try { localStorage.removeItem(newKey); } catch(e2) {} });
    showToast('Error al verificar migración de storage del Plan — datos anteriores intactos', 'error');
    return;
  }

  // Fase 3 — eliminar keys anteriores (solo si verificación exitosa)
  written.forEach(({ oldKey }) => { try { localStorage.removeItem(oldKey); } catch(e) {} });
}

// R-202605-120: savePlan — localStorage inmediato + Supabase async (tracker_docs, key plan-{suffix})
// El objeto plan se envuelve en { data, _savedAt } para comparación de timestamps en _loadFromSupabase
export function savePlan(projId, plan) {
  // localStorage inmediato
  const payload = { data: plan, _savedAt: Date.now() };
  try { localStorage.setItem(_planKey(projId), JSON.stringify(payload)); } catch(e) {}

  // Supabase async — no bloquea el caller
  if (typeof _supabase !== 'undefined' && _supabase &&
      typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    const suffix = '-' + projId;
    const nowIso = new Date().toISOString();
    _supabase.from('tracker_docs').upsert(
      [{ user_id: _supabaseUser.id, key: 'sprint-plan' + suffix, value: payload, updated_at: nowIso }],
      { onConflict: 'user_id,key' }
    ).then(({ error }) => {
      if (error) {
        console.warn('[AI Tracker] savePlan Supabase failed:', error);
        _offlineQueuePush({ type: 'plan', projId });
      }
    });
  }
}

// R-202605-120: loadPlan — lee desde localStorage (caché)
// La hidratación desde Supabase ocurre en _loadFromSupabase() paso 6
export function loadPlan(projId) {
  try {
    const raw = localStorage.getItem(_planKey(projId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Soporte legacy: si el valor es array directo (antes de R-202605-120) — devolver tal cual
    // Si es el nuevo wrapper { data, _savedAt } — devolver solo data
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.data !== undefined)
      ? parsed.data
      : parsed;
  } catch(e) { return null; }
}

// T-202605-510: leer _savedAt del wrapper sin exponer data al caller
function _planSavedAt(projId) {
  try {
    const raw = localStorage.getItem(_planKey(projId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed._savedAt)
      ? parsed._savedAt
      : null;
  } catch(e) { return null; }
}

// T-202605-509: helpers para toggle colapso zona --done
const _PLAN_ZONE_DONE_KEY = 'sprint-plan:zone-done-collapsed';

function _planZoneDoneCollapsed() {
  try {
    const val = localStorage.getItem(_PLAN_ZONE_DONE_KEY);
    if (val === null) return false;
    const parsed = JSON.parse(val);
    return parsed === true || parsed === false ? parsed : false;
  } catch(e) { return false; }
}

function togglePlanZoneDone() {
  const next = !_planZoneDoneCollapsed();
  try { localStorage.setItem(_PLAN_ZONE_DONE_KEY, JSON.stringify(next)); } catch(e) {}
  const row = document.querySelector('.plan-zone--done .plan-sessions-row');
  const btn = document.querySelector('.plan-zone--done .plan-zone-toggle');
  if (row) { row.classList.toggle('is-hidden', next); }
  if (btn) {
    btn.innerHTML        = next ? '&#x25b2;' : '&#x25be;';
    btn.title            = next ? 'Expandir' : 'Colapsar';
    btn.setAttribute('aria-label', next ? 'Expandir completadas' : 'Colapsar completadas');
  }
}

// Renderizar el sub-tab Plan para el proyecto activo
// R-202604-085 + R-B: dos scopes diferenciados — sesion (superior) y sprint (inferior)
// Backward compatible: planes legacy (sin campo scope) se muestran en sección sprint
// R-202605-043: renderPlanInto — renderiza el plan en un contenedor arbitrario
// Permite reutilizar la lógica desde el tab Sprint sin depender de #sspanel-plan
export function renderPlanInto(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  _buildPlanContent(container);
}

export function renderPlan() {
  const panel = document.getElementById('sspanel-plan');
  if (!panel) return;
  _buildPlanContent(panel);
}

function _buildPlanContent(panel) {
  const proj = getActiveProject();
  if (!proj) {
    panel.innerHTML = `<div class="plan-empty">Selecciona un proyecto para ver su plan.</div>`;
    return;
  }

  const sprints = loadPlan(proj.id);
  if (!sprints || !sprints.length) {
    panel.innerHTML = `<div class="plan-empty">Sin plan activo — pega un CHECKPOINT con bloque <code>---EXECUTION-PLAN---</code> para ver el plan.</div>`;
    return;
  }

  // T-202605-488: chip "Generado automáticamente" si el plan vino del Generator
  let autoChipHtml = '';
  try {
    const metaKey = `sprint-plan:auto-${proj.id}`;
    const metaRaw = localStorage.getItem(metaKey);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      const d = new Date(meta.ts);
      const label = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
      autoChipHtml = `<div class="plan-auto-chip">⚙ Generado automáticamente · ${label}</div>`;
    }
  } catch(e) {}

  // T-202605-510: timestamp de última actualización del plan
  let savedTsHtml = '';
  try {
    const savedAt = _planSavedAt(proj.id);
    if (savedAt) {
      const d = new Date(savedAt);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      savedTsHtml = `<div class="plan-saved-ts">Actualizado: ${hh}:${mm}</div>`;
    }
  } catch(e) {}

  // Resolver ítems del backlog en tiempo real
  const backlog = (() => {
    try {
      const raw = localStorage.getItem(_tplKey('backlog-items'));
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  })();
  const _itemByCode = {};
  backlog.forEach(it => { if (it.code) _itemByCode[it.code] = it; });

  const _statusClass   = st => st === 'done' ? 'plan-item--done' : st === 'descartado' ? 'plan-item--discarded' : '';
  const _statusLabel   = st => st === 'done' ? '✓' : st === 'descartado' ? '—' : '○';
  const _liveStatus    = code => { const it = _itemByCode[code]; return it ? (it.status || 'pendiente') : 'pendiente'; };
  const _liveTitle     = code => { const it = _itemByCode[code]; return it ? (it.title || it.desc || '') : ''; };
  const _sessIsDone    = sess => {
    const codes = sess.items || [];
    return codes.length > 0 && codes.every(c => { const s = _liveStatus(c); return s === 'done' || s === 'descartado'; });
  };
  const _sessIsBlocked = (sess, doneIds) => {
    const deps = (sess.depende_de || []).filter(Boolean);
    return deps.length > 0 && !deps.every(d => doneIds.has(d));
  };

  // Pre-poblar mapa id→sesión para etiquetas de bloqueo
  const _allSessionsById = {};
  sprints.forEach(sp => { (sp.sessions || []).forEach(sess => { if (sess.id) _allSessionsById[sess.id] = sess; }); });

  // SVG conector vertical entre sesiones secuenciales
  const _connector = () => `<div class="plan-connector">
    <svg width="2" height="32" viewBox="0 0 2 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="1" y1="0" x2="1" y2="26" stroke="var(--border2, var(--border))" stroke-width="2" stroke-dasharray="4 2"/>
      <polygon points="1,32 -3,24 5,24" fill="var(--border2, var(--border))"/>
    </svg>
  </div>`;

  // Card de sesión
  const _sessCard = (sess, idx, extraClass) => {
    const codes         = sess.items || [];
    const resolvedItems = codes.map(code => ({ code, status: _liveStatus(code), title: _liveTitle(code) }));
    const allDone       = _sessIsDone(sess);
    const archivos      = (sess.archivos   || []).filter(Boolean);
    const dependeDe     = (sess.depende_de || []).filter(Boolean);
    const badgeHtml     = allDone
      ? `<span class="plan-session-badge plan-session-badge--done">✓ Completa</span>`
      : extraClass === 'plan-session--blocked'
        ? `<span class="plan-session-badge plan-session-badge--blocked">⛔ Bloqueada</span>`
        : '';
    const depsHtml = (extraClass === 'plan-session--blocked' && dependeDe.length)
      ? dependeDe.map(depId => {
          const depSess = _allSessionsById[depId];
          if (!depSess) {
            return `<span class="plan-file-pill plan-file-pill--broken">⚠ dep no encontrada: ${esc(depId)}</span>`;
          }
          const label = depSess.rol ? `${depSess.rol} · ${depId}` : depId;
          return `<span class="plan-file-pill">Bloqueada por ${esc(label)}</span>`;
        }).join('')
      : '';

    // T-202605-512: micro-barra de progreso X/N por sesión
    const _sessDone  = resolvedItems.filter(it => it.status === 'done' || it.status === 'descartado').length;
    const _sessTotal = resolvedItems.length;
    const _sessPct   = _sessTotal ? Math.round((_sessDone / _sessTotal) * 100) : 0;
    const _sessProgHtml = _sessTotal
      ? `<div class="plan-session-prog">
          <div class="plan-session-prog-bar" style="--sess-prog-pct:${_sessPct}%"></div>
          <span class="plan-session-prog-label">${_sessDone}/${_sessTotal}</span>
        </div>`
      : '';

    return `<div class="plan-session ${allDone ? 'plan-session--done' : extraClass}">
      <div class="plan-session-header">
        <span class="plan-session-num">Sesión ${idx}</span>
        ${sess.id  ? `<span class="plan-session-id">${esc(sess.id)}</span>` : ''}
        ${sess.rol ? `<span class="plan-session-rol">${esc(sess.rol)}</span>` : ''}
        ${badgeHtml}
      </div>
      ${depsHtml ? `<div class="plan-session-deps">${depsHtml}</div>` : ''}
      ${archivos.length ? `<div class="plan-session-files">${archivos.map(f => `<span class="plan-file-pill">${esc(f)}</span>`).join('')}</div>` : ''}
      <div class="plan-session-items">
        ${resolvedItems.map(it => `
          <div class="plan-item ${_statusClass(it.status)}">
            <span class="plan-item-status" title="${esc(it.status)}">${_statusLabel(it.status)}</span>
            <span class="plan-item-code">${esc(it.code)}</span>
            <span class="plan-item-title">${esc(it.title)}</span>
          </div>`).join('')}
        ${resolvedItems.length === 0 ? `<div class="plan-item-empty">Sin ítems declarados</div>` : ''}
      </div>
      ${_sessProgHtml}
    </div>`;
  };

  // T-202605-511: lookup de sprints activos para chip 'activo'
  const _activeSprintIds = (() => {
    try {
      return new Set(
        getActiveSprints()
          .filter(sp => sp.status === 'active')
          .map(sp => sp.id)
      );
    } catch(e) { return new Set(); }
  })();

  // Render de un grupo de sprints — reutilizable para ambos scopes
  const _renderSprintGroup = group => {
    let html = '';
    let globalSessIdx = 0;

    group.forEach(sprint => {
      const sprintLabel  = sprint.id ? sprint.id : 'Sin sprint';
      const sessions     = sprint.sessions || [];
      const doneIds      = new Set(sessions.filter(s => _sessIsDone(s)).map(s => s.id).filter(Boolean));
      const doneSessions = sessions.filter(s =>  _sessIsDone(s));
      const available    = sessions.filter(s => !_sessIsDone(s) && !_sessIsBlocked(s, doneIds));
      const blocked      = sessions.filter(s => !_sessIsDone(s) &&  _sessIsBlocked(s, doneIds));
      const allCodes     = sessions.flatMap(s => s.items || []);
      const totalItems   = allCodes.length;
      const doneItems    = allCodes.filter(c => { const st = _liveStatus(c); return st === 'done' || st === 'descartado'; }).length;
      const pct          = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
      const isActive     = sprint.id && _activeSprintIds.has(sprint.id);

      html += `<div class="plan-sprint-block">
        <div class="plan-sprint-header">
          <span class="plan-sprint-id">${esc(sprintLabel)}</span>${isActive ? `<span class="plan-sprint-badge--active">activo</span>` : ''}
          ${totalItems ? `<div class="plan-sprint-progress-bar-wrap">
            <div class="plan-sprint-progress-bar" style="--plan-pct:${pct}%"></div>
            <span class="plan-sprint-progress-label">${doneItems}/${totalItems} ítems (${pct}%)</span>
          </div>` : ''}
        </div>`;

      if (!sessions.length) {
        html += `<div class="plan-empty plan-empty--inline">Sin sesiones declaradas.</div>`;
      }

      if (available.length) {
        html += `<div class="plan-zone plan-zone--available"><div class="plan-zone-label">Pendientes</div><div class="plan-sessions-row">`;
        available.forEach(sess => { globalSessIdx++; html += _sessCard(sess, globalSessIdx, ''); });
        html += `</div></div>`;
      }
      if (blocked.length) {
        html += `<div class="plan-zone plan-zone--sequential"><div class="plan-zone-label">Bloqueadas</div><div class="plan-sessions-row">`;
        blocked.forEach((sess, i) => { globalSessIdx++; if (i > 0) html += _connector(); html += _sessCard(sess, globalSessIdx, 'plan-session--blocked'); });
        html += `</div></div>`;
      }
      if (doneSessions.length) {
        const _doneCollapsed = _planZoneDoneCollapsed();
        const _doneAriaLabel = _doneCollapsed ? 'Expandir completadas' : 'Colapsar completadas';
        const _doneTitleAttr = _doneCollapsed ? 'Expandir' : 'Colapsar';
        const _doneChevron   = _doneCollapsed ? '&#x25b2;' : '&#x25be;';
        html += `<div class="plan-zone plan-zone--done">`;
        html += `<div class="plan-zone-label">Completadas<button class="plan-zone-toggle" onclick="togglePlanZoneDone()" aria-label="${_doneAriaLabel}" title="${_doneTitleAttr}">${_doneChevron}</button></div>`;
        html += `<div class="plan-sessions-row${_doneCollapsed ? ' is-hidden' : ''}">`;
        doneSessions.forEach(sess => { globalSessIdx++; html += _sessCard(sess, globalSessIdx, 'plan-session--done'); });
        html += `</div></div>`;
      }

      html += `</div>`; // /plan-sprint-block
    });

    return html;
  };

  // Separar sprints por scope — sesion vs sprint (legacy sin scope → sprint)
  const sprintsSesion = sprints.filter(sp => sp.scope === 'sesion');
  const sprintsSprint = sprints.filter(sp => sp.scope !== 'sesion');

  // Construir HTML — sección sesion primero (AC de Nova)
  let html = autoChipHtml + savedTsHtml;

  // SECCIÓN SESIÓN
  html += `<div class="plan-scope-section plan-scope-section--sesion">
    <div class="plan-scope-header">
      <span class="plan-scope-label">Sesión activa</span>
      <span class="plan-scope-hint">Ítems en curso esta sesión</span>
    </div>`;

  if (sprintsSesion.length) {
    try {
      // R-202605-153: clonar sesiones antes de truncar — no mutar datos en memoria
      const sesionCloned = sprintsSesion.map(sp => ({
        ...sp,
        sessions: (sp.sessions || []).map(sess => ({ ...sess, items: [...(sess.items || [])] }))
      }));
      const totalItemsSesion = sesionCloned.flatMap(sp => sp.sessions.flatMap(s => s.items)).length;
      if (totalItemsSesion > 3) {
        html += `<div class="plan-scope-truncated-badge">⚠ Plan de sesión tiene ${totalItemsSesion} ítems — mostrando primeros 3</div>`;
        let itemCount = 0;
        sesionCloned.forEach(sp => {
          sp.sessions.forEach(sess => { sess.items = sess.items.filter(() => itemCount++ < 3); });
        });
      }
      html += _renderSprintGroup(sesionCloned);
    } catch(e) {
      console.warn('[AI Tracker] renderPlan sesion error:', e);
      html += `<div class="plan-scope-empty plan-scope-empty--error">Error al renderizar sesión activa — el bloque puede estar malformado.</div>`;
    }
  } else {
    html += `<div class="plan-scope-empty">Sin sesión activa — el plan se actualiza al pegar el próximo CHECKPOINT</div>`;
  }

  html += `</div>`; // /plan-scope-section--sesion

  // SECCIÓN SPRINT
  html += `<div class="plan-scope-section plan-scope-section--sprint">
    <div class="plan-scope-header">
      <span class="plan-scope-label">Plan de sprint</span>
      <span class="plan-scope-hint">Referencia del ciclo completo</span>
    </div>`;

  if (sprintsSprint.length) {
    try {
      html += _renderSprintGroup(sprintsSprint);
    } catch(e) {
      console.warn('[AI Tracker] renderPlan sprint error:', e);
      html += `<div class="plan-scope-empty plan-scope-empty--error">Error al renderizar plan de sprint — el bloque puede estar malformado.</div>`;
    }
  } else {
    html += `<div class="plan-scope-empty">Sin plan de sprint — abre sprint para generar</div>`;
  }

  html += `</div>`; // /plan-scope-section--sprint

  panel.innerHTML = html;
}

// T-202605-068: ejecutar migración atómica al cargar el módulo
(function() { try { _migratePlanKeys(); } catch(e) { console.warn('[locus-sprint-plan] migración fallida:', e); } })();

// ── Exposición pública ──────────────────────────────────────────────────────
window.renderPlan           = renderPlan;
window.renderPlanInto       = renderPlanInto;       // R-202605-043
window.savePlan             = savePlan;              // T-202605-068
window.loadPlan             = loadPlan;              // T-202605-068
window.togglePlanZoneDone   = togglePlanZoneDone;   // T-202605-068
window._liveStatus          = _liveStatus;           // T3.bis
window._sessIsDone          = _sessIsDone;           // T3.bis
