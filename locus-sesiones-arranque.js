// [PP] v1.2.4 · sprint:PP-S-09 · mod:4 · autor:Rune · 2026-05-28 UTC-6
// locus-sesiones-arranque.js
// Responsabilidad: Panel de Sesión de Arranque — contexto diario al abrir la app
//   (R-202604-072). Muestra resumen de ayer, ítem sugerido, estado IA y sesión del plan.
// Extraído de: locus-checkpoint-viz.js
// Dependencias: locus-sesiones-viz.js · locus-sesiones-stats.js · locus-storage.js · locus-sprint-plan.js
// Carga después de: locus-sesiones-viz.js · locus-sesiones-stats.js · locus-sprint-plan.js

import { _copyTextSafe } from './locus-sesiones-viz.js';
import { selectTrackerAI } from './locus-sesiones.js';
import { loadPlan } from './locus-sprint-plan.js';
import { _tplKey } from './locus-storage.js';
import { switchTab } from './locus-ui-shell.js';

// ─────────────────────────────────────────────────────────────────────────────
// R-202604-072: Sesión de Arranque — panel de contexto diario al abrir la app
// ─────────────────────────────────────────────────────────────────────────────

const _ARRANQUE_KEY = 'ai-tracker-arranque-ts';
const _ARRANQUE_6H  = 6 * 60 * 60 * 1000;

// ── Funciones de módulo — consumibles por locus-pulso.js y locus-sprint-plan.js ──────────

/**
 * Carga el backlog desde localStorage usando la clave del proyecto activo.
 * Devuelve un mapa code → item para consulta O(1).
 */
function _arranqueItemByCode() {
  try {
    const _tplK = _tplKey('backlog-items');
    const raw = localStorage.getItem(_tplK);
    const items = raw ? JSON.parse(raw) : [];
    const map = {};
    items.forEach(it => { if (it.code) map[it.code] = it; });
    return map;
  } catch (e) { return {}; }
}

/** Devuelve el status live de un ítem por código. */
function _liveStatus(code) {
  const it = _arranqueItemByCode()[code];
  return it ? (it.status || 'pendiente') : 'pendiente';
}

/** Devuelve el título live de un ítem por código. */
function _liveTitle(code) {
  const it = _arranqueItemByCode()[code];
  return it ? (it.title || it.desc || '') : '';
}

/** Determina si una sesión del plan está completa (todos sus ítems done/descartado). */
function _sessIsDone(sess) {
  const codes = sess.items || [];
  return codes.length > 0 && codes.every(c => {
    const s = _liveStatus(c);
    return s === 'done' || s === 'descartado';
  });
}

/**
 * Determina si una sesión del plan está bloqueada.
 * Requiere el Set de IDs done calculado externamente para evitar re-computar.
 * @param {object} sess - Sesión del plan
 * @param {Set<string>} doneIds - Set de IDs de sesiones completadas
 */
function _isBlocked(sess, doneIds) {
  const deps = (sess.depende_de || []).filter(Boolean);
  return deps.length > 0 && !deps.every(d => doneIds.has(d));
}

/**
 * Filtra las sesiones bloqueadas de un array de sesiones pendientes.
 * @param {Array} pendingSessions - Sesiones no completadas
 * @param {Set<string>} doneIds - Set de IDs de sesiones completadas
 */
function _blocked(pendingSessions, doneIds) {
  return pendingSessions.filter(s => _isBlocked(s, doneIds));
}

function closeArranquePanel() {
  const overlay = document.getElementById('arranque-overlay');
  if (overlay) overlay.classList.remove('arranque-visible');
}

function _showArranquePanel() {
  const overlay    = document.getElementById('arranque-overlay');
  const body       = document.getElementById('arranque-body');
  const ctaBtn     = document.getElementById('arranque-cta-btn');
  const closeBtn   = document.getElementById('arranque-close-btn');
  const verTodoBtn = document.getElementById('arranque-btn-ver-todo');
  if (!overlay || !body) return;

  // AC: no aparece si han pasado menos de 6h desde el último arranque (localStorage)
  const lastShown = parseInt(localStorage.getItem(_ARRANQUE_KEY) || '0', 10);
  if (Date.now() - lastShown < _ARRANQUE_6H) return;

  // AC: no aparece si no hay proyectos ni ítems — onboarding tiene prioridad
  const allProjects = (state.projects || []).filter(p => (p.sessions || []).length > 0);
  const allItems    = typeof ITEMS !== 'undefined' ? ITEMS : [];
  if (allProjects.length === 0 && allItems.length === 0) return;

  // Persistir timestamp antes de mostrar
  try { localStorage.setItem(_ARRANQUE_KEY, String(Date.now())); } catch(e) {}

  // ── Bloque 1: Resumen de ayer ────────────────────────────────────────────
  const now        = Date.now();
  const DAY        = 86400000;
  const allSess    = getAllSessions();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const yesterStart = new Date(todayStart.getTime() - DAY);

  const lastSess = allSess.slice().sort((a, b) => {
    const ta = new Date(a.date || 0).getTime();
    const tb = new Date(b.date || 0).getTime();
    return tb - ta;
  })[0] || null;

  let bloque1Html = '';
  if (lastSess) {
    const lastSessDate = new Date(lastSess.date || 0);
    const daysDiff = Math.floor((now - lastSessDate.getTime()) / DAY);
    const lastProjObj = (state.projects || []).find(p => p.id === lastSess.projectId);
    const lastProjName = lastProjObj ? (lastProjObj.name || lastProjObj.id) : '';
    const lastAIObj = (state.ais || []).find(a => a.id === lastSess.aiId);
    const lastAIName = lastAIObj ? lastAIObj.name : '';

    const closedInSess = allItems.filter(i =>
      i.status === 'done' && (i.sessionId === lastSess.id || (lastSess.trackerRefs || []).includes(i.code))
    );

    if (daysDiff === 0 || daysDiff === 1) {
      const whenLabel = daysDiff === 0 ? 'hoy' : 'ayer';
      bloque1Html = `<div class="arr-section">
        <span class="arr-label">Última sesión — ${whenLabel}</span>
        <span class="arr-value arr-value--small">${lastProjName ? esc(lastProjName) + ' · ' : ''}${lastAIName ? esc(lastAIName) : ''}</span>
        ${closedInSess.length > 0
          ? `<ul class="arr-item-list arr-item-list--compact">
              ${closedInSess.slice(0,3).map(i => {
                const t = (i.code||'T')[0].toUpperCase();
                const _tc = {P:'#7c6af7',T:'#2ecc78',R:'#38bdf8',B:'#e85555'};
                return `<li class="arr-item arr-item--done">
                  <span class="arr-item-code" style="--arr-type-color:${_tc[t]||'#38bdf8'}">${esc(i.code)}</span>
                  <span class="arr-item-desc">${esc(i.title || i.desc || '')}</span>
                </li>`;
              }).join('')}
              ${closedInSess.length > 3 ? `<li class="arr-item arr-item--more">+${closedInSess.length - 3} más</li>` : ''}
            </ul>`
          : `<span class="arr-value arr-value--muted">${esc(lastSess.title || 'Sin ítems cerrados registrados')}</span>`
        }
      </div>`;
    } else {
      bloque1Html = `<div class="arr-section">
        <span class="arr-label">Última sesión</span>
        <span class="arr-value arr-value--muted">Hace ${daysDiff} días${lastProjName ? ' · ' + esc(lastProjName) : ''}</span>
      </div>`;
    }
  }

  // ── Bloque 2: Ítem sugerido ──────────────────────────────────────────────
  const projByActivity = allProjects.slice().sort((a, b) => {
    const ta = Math.max(...(a.sessions||[]).map(s => new Date(s.date||0).getTime()), 0);
    const tb = Math.max(...(b.sessions||[]).map(s => new Date(s.date||0).getTime()), 0);
    return tb - ta;
  });
  const mostActiveProj = projByActivity[0] || null;
  const activeSprint = mostActiveProj
    ? ((mostActiveProj.sprints||[]).find(s => s.status === 'active') || (mostActiveProj.sprints||[]).find(s => s.status === 'open') || null)
    : null;

  const suggestedItem = allItems
    .filter(i => i.status === 'pendiente' && typeof i._score === 'number' && (!activeSprint || i.sprint === activeSprint.id))
    .sort((a, b) => b._score - a._score)[0] || null;

  let bloque2Html = '';
  if (suggestedItem) {
    const t = (suggestedItem.code||'T')[0].toUpperCase();
    const _tc = {P:'#7c6af7',T:'#2ecc78',R:'#38bdf8',B:'#e85555'};
    bloque2Html = `<div class="arr-section">
      <span class="arr-label">Ítem sugerido${activeSprint ? ' · ' + esc(activeSprint.name || activeSprint.id) : ''}</span>
      <div class="arr-item arr-item--featured">
        <span class="arr-item-code" style="--arr-type-color:${_tc[t]||'#38bdf8'}">${esc(suggestedItem.code)}</span>
        <span class="arr-item-desc">${esc(suggestedItem.title || suggestedItem.desc || '')}</span>
      </div>
    </div>`;
  }

  // ── Bloque 3: Estado IA ──────────────────────────────────────────────────
  const nonArchived = (state.ais || []).filter(a => !a.archived);
  const available = nonArchived.filter(a => a.status === 'available' && !a.interrupted);
  const inSession  = nonArchived.filter(a => a.interrupted || (a.status === 'available' && allSess.some(s => s.aiId === a.id && new Date(s.date||0).getTime() > now - 3*60*60*1000)));
  const exhausted  = nonArchived.filter(a => a.status === 'exhausted');

  const bestAI = available.sort((a, b) => {
    const ta = Math.max(...allSess.filter(s => s.aiId === a.id).map(s => new Date(s.date||0).getTime()), 0);
    const tb = Math.max(...allSess.filter(s => s.aiId === b.id).map(s => new Date(s.date||0).getTime()), 0);
    return tb - ta;
  })[0] || null;

  let bloque3Html = '';
  if (bestAI) {
    bloque3Html = `<div class="arr-section">
      <span class="arr-label">IA disponible</span>
      <div class="arr-ai-row">
        <span class="arr-ai-name">${esc(bestAI.name)}</span>
        <span class="arr-ai-badge arr-ai-badge--available">disponible</span>
      </div>
    </div>`;
  } else if (exhausted.length > 0) {
    const nextToReset = exhausted.slice().sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b))[0];
    const msLeft = _hoyMsUntilReset(nextToReset);
    const cdLabel = _hoyCountdownLabel(msLeft);
    bloque3Html = `<div class="arr-section">
      <span class="arr-label">IAs disponibles</span>
      <div class="arr-ai-row">
        <span class="arr-ai-name">${esc(nextToReset.name)}</span>
        <span class="arr-ai-badge arr-ai-badge--exhausted">en ${cdLabel}</span>
      </div>
    </div>`;
  }

  // ── Bloque 4: Sesión recomendada del plan (R-202605-097) ─────────────────
  let bloque4Html = '';
  let _planPromptText = null;

  const _activeProj = (state.projects || []).find(p => p.id === (getActiveProject && getActiveProject() ? getActiveProject().id : null))
    || (state.projects || []).filter(p => !p.archived)[0]
    || null;

  if (_activeProj) {
    const _planSprints = loadPlan(_activeProj.id);
    const _backlogItems = (() => {
      try {
        const _tplK = _tplKey('backlog-items');
        const raw = localStorage.getItem(_tplK);
        return raw ? JSON.parse(raw) : [];
      } catch(e) { return []; }
    })();
    const _itemByCode = {};
    _backlogItems.forEach(it => { if (it.code) _itemByCode[it.code] = it; });

    // Closures locales sobre _itemByCode — mismo comportamiento que funciones de módulo
    // pero con acceso directo al mapa ya cargado (evita re-parse de localStorage)
    const _liveStatusLocal = code => { const it = _itemByCode[code]; return it ? (it.status || 'pendiente') : 'pendiente'; };
    const _liveTitleLocal  = code => { const it = _itemByCode[code]; return it ? (it.title || it.desc || '') : ''; };
    const _sessScoreLocal  = sess => (sess.items || []).reduce((sum, code) => {
      const it = _itemByCode[code];
      if (!it || _liveStatusLocal(code) === 'done' || _liveStatusLocal(code) === 'descartado') return sum;
      const w = it.priority === 'high' ? 3 : it.priority === 'low' ? 1 : 2;
      return sum + w;
    }, 0);
    const _sessIsDoneLocal = sess => {
      const codes = sess.items || [];
      return codes.length > 0 && codes.every(c => { const s = _liveStatusLocal(c); return s === 'done' || s === 'descartado'; });
    };

    if (_planSprints && _planSprints.length) {
      const _allSessions = [];
      _planSprints.forEach(sp => {
        (sp.sessions || []).forEach(sess => {
          _allSessions.push({ ...sess, _sprintId: sp.id });
        });
      });

      const _doneIds = new Set(_allSessions.filter(s => _sessIsDoneLocal(s)).map(s => s.id).filter(Boolean));
      const _isBlockedLocal = sess => {
        const deps = (sess.depende_de || []).filter(Boolean);
        return deps.length > 0 && !deps.every(d => _doneIds.has(d));
      };

      const _pendingSessions = _allSessions.filter(s => !_sessIsDoneLocal(s));

      if (_pendingSessions.length === 0) {
        bloque4Html = `<div class="arr-section arr-section--plan">
          <span class="arr-label">Sesión del plan</span>
          <div class="arr-plan-done">✓ Todas las sesiones del sprint completadas</div>
        </div>`;
      } else {
        const _available = _pendingSessions.filter(s => !_isBlockedLocal(s));
        const _blocked   = _pendingSessions.filter(s =>  _isBlockedLocal(s));
        const _recommended = _available.slice().sort((a, b) => _sessScoreLocal(b) - _sessScoreLocal(a))[0] || null;
        const _others = _available.filter(s => s !== _recommended);

        const _typeColor = { P: '#7c6af7', T: '#2ecc78', R: '#38bdf8', B: '#e85555' };
        const _itemPill = code => {
          const t = (code || 'T')[0].toUpperCase();
          return `<span class="arr-item-code" style="--arr-type-color:${_typeColor[t] || '#38bdf8'}">${esc(code)}</span>`;
        };
        const _filePill = f => `<span class="arr-file-pill">${esc(f)}</span>`;

        let recHtml = '';
        if (_recommended) {
          const pendingCodes = (_recommended.items || []).filter(c => {
            const s = _liveStatusLocal(c); return s !== 'done' && s !== 'descartado';
          });
          const archivos = (_recommended.archivos || []).filter(Boolean);

          const _missingFields = [];
          if (!_recommended.rol) _missingFields.push('rol');
          if (!pendingCodes.length) _missingFields.push('ítems');
          const _promptIncomplete = _missingFields.length > 0;

          const _contextFiles = ['PP-CONTEXT', 'PP-BACKLOG'];
          const _allFiles = [...new Set([...archivos, ..._contextFiles])];
          if (!_promptIncomplete) {
            _planPromptText = [
              `Rol: ${_recommended.rol}`,
              `Sprint: ${_recommended._sprintId || ''}`,
              `Ítems: ${(_recommended.items || []).join(', ')}`,
              `Archivos técnicos: ${archivos.join(', ') || '—'}`,
              `Archivos de contexto: ${_contextFiles.join(', ')}`,
            ].join('\n');
          }

          const archivosHtml = _allFiles.length
            ? `<div class="arr-plan-files">
                <span class="arr-plan-files-label">Archivos</span>
                <div class="arr-plan-files-row">
                  ${archivos.map(f => _filePill(f)).join('')}
                  ${_contextFiles.map(f => `<span class="arr-file-pill arr-file-pill--ctx">${esc(f)}</span>`).join('')}
                </div>
              </div>`
            : '';

          const incompleteWarningHtml = _promptIncomplete
            ? `<div class="arr-plan-warning">⚠ Faltan campos en el plan: ${_missingFields.join(', ')} — edita el bloque ---EXECUTION-PLAN--- antes de copiar</div>`
            : '';

          recHtml = `<div class="arr-plan-card arr-plan-card--recommended">
            <div class="arr-plan-card-header">
              <span class="arr-plan-indicator arr-plan-indicator--available">●</span>
              <span class="arr-plan-rol">${esc(_recommended.rol || '—')}</span>
              ${_recommended._sprintId ? `<span class="arr-plan-sprint">${esc(_recommended._sprintId)}</span>` : ''}
            </div>
            <div class="arr-plan-items">
              ${pendingCodes.length ? pendingCodes.map(_itemPill).join('') : '<span class="arr-plan-no-items">Sin ítems pendientes</span>'}
            </div>
            ${archivosHtml}
            ${incompleteWarningHtml}
            <button class="arr-plan-copy-btn${_promptIncomplete ? ' arr-plan-copy-btn--disabled' : ''}" id="arr-copy-btn" type="button"${_promptIncomplete ? ' aria-disabled="true" title="Completa los campos faltantes para habilitar"' : ''}>Copiar prompt de arranque</button>
          </div>`;
        }

        let othersHtml = '';
        if (_others.length) {
          othersHtml = _others.map(s => {
            const pendCount = (s.items || []).filter(c => { const st = _liveStatusLocal(c); return st !== 'done' && st !== 'descartado'; }).length;
            return `<div class="arr-plan-row">
              <span class="arr-plan-indicator arr-plan-indicator--available">●</span>
              <span class="arr-plan-row-rol">${esc(s.rol || '—')}</span>
              <span class="arr-plan-row-count">${pendCount} ítem${pendCount !== 1 ? 's' : ''}</span>
            </div>`;
          }).join('');
        }

        let blockedHtml = '';
        if (_blocked.length) {
          blockedHtml = _blocked.map(s => {
            const blocker = _allSessions.find(b => (s.depende_de || []).includes(b.id) && !_doneIds.has(b.id));
            return `<div class="arr-plan-row arr-plan-row--blocked">
              <span class="arr-plan-indicator arr-plan-indicator--blocked">○</span>
              <span class="arr-plan-row-rol">${esc(s.rol || '—')}</span>
              ${blocker ? `<span class="arr-plan-row-blocker">requiere: ${esc(blocker.rol || blocker.id || '—')}</span>` : ''}
            </div>`;
          }).join('');
        }

        bloque4Html = `<div class="arr-section arr-section--plan">
          <span class="arr-label">Sesión del plan</span>
          ${recHtml}
          ${othersHtml || blockedHtml ? `<div class="arr-plan-others">${othersHtml}${blockedHtml}</div>` : ''}
        </div>`;
      }
    } else {
      bloque4Html = `<div class="arr-section arr-section--plan">
        <span class="arr-label">Sesión del plan</span>
        <div class="arr-plan-empty">Sin plan activo — abre una sesión con Rune para planificar el siguiente sprint</div>
      </div>`;
    }
  }

  // ── Render final ─────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '☀ Buenos días' : hour < 19 ? '👋 Buenas tardes' : '🌙 Buenas noches';
  const titleEl = overlay.querySelector('.arranque-title');
  if (titleEl) titleEl.textContent = greeting;

  body.innerHTML = bloque1Html + bloque2Html + bloque3Html + bloque4Html;

  // CTA botón copiar prompt (R-202605-097)
  const _copyBtn = document.getElementById('arr-copy-btn');
  if (_copyBtn) {
    _copyBtn.addEventListener('click', () => {
      if (!_planPromptText) return;
      navigator.clipboard.writeText(_planPromptText).then(() => {
        _copyBtn.classList.add('arr-plan-copy-btn--copied');
        _copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          _copyBtn.classList.remove('arr-plan-copy-btn--copied');
          _copyBtn.textContent = 'Copiar prompt de arranque';
        }, 2000);
      }).catch(() => {
        // B-202605-505: usar _copyTextSafe para evitar sobreescribir clipboard del usuario
        _copyTextSafe(_planPromptText);
        _copyBtn.classList.add('arr-plan-copy-btn--copied');
        _copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          _copyBtn.classList.remove('arr-plan-copy-btn--copied');
          _copyBtn.textContent = 'Copiar prompt de arranque';
        }, 2000);
      });
    });
  }

  // Footer CTA secundario: ir a Tracker
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      closeArranquePanel();
      if (bestAI) {
        switchTab('sesiones');
        setTimeout(() => selectTrackerAI(bestAI.id), 80);
      } else {
        switchTab('sesiones');
      }
    });
    ctaBtn.textContent = bestAI ? `Arrancar con ${bestAI.name} →` : 'Arrancar →';
  }

  // Botón cerrar (✕)
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeArranquePanel());
  }

  // Botón ver todo — navega a tab sesiones sin seleccionar IA
  if (verTodoBtn) {
    verTodoBtn.addEventListener('click', () => {
      closeArranquePanel();
      switchTab('sesiones');
    });
  }

  // AC: Escape y click fuera cierran el panel
  const onKey = (e) => { if (e.key === 'Escape') { closeArranquePanel(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  overlay.onclick = (e) => { if (e.target === overlay) { closeArranquePanel(); document.removeEventListener('keydown', onKey); } };

  overlay.classList.add('arranque-visible');
}

// ── Exposición pública ───────────────────────────────────────────────────────
window._isBlocked        = _isBlocked;
window._blocked          = _blocked;
window._liveStatus       = _liveStatus;
window._liveTitle        = _liveTitle;
window._sessIsDone       = _sessIsDone;
window._showArranquePanel = _showArranquePanel;
window.closeArranquePanel = closeArranquePanel;
