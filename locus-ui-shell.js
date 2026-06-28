// [PP] mod:33 · autor:Rune · 2026-06-28 UTC-6
// locus-ui-shell.js
// Última actualización: 2026-06-05 · T-202606-055: Romper ciclos — eliminar imports hacia módulos que importan locus-ui-shell.js
// Responsabilidad: UI shell — tab switching, theme, search, shortcuts, setup checklist
// Debe cargarse antes de ai-tracker-checkpoint.js y ai-tracker-ai-notes.js
//
// PATRÓN DE DESACOPLAMIENTO (T-202606-055):
// Las funciones de render/UI que antes se importaban directamente ahora se invocan via:
//   (a) event dispatch: window.dispatchEvent(new CustomEvent('shell:invoke', { detail: { fn, args } }))
//       — usado para funciones de render de tab/subtab y acciones de UI que pueden ser asíncronas
//   (b) lazy import dinámico import() — usado para funciones síncronas en handlers críticos
//       donde el resultado debe procesarse en la misma pila (overlays, atajos de teclado)
//   (c) acceso via window.* — para funciones que ya exponen contrato público en window
//       (locus-api.js garantiza que el contrato público está disponible post-DOMContentLoaded)
// Cada módulo consumidor es responsable de registrar listener 'shell:invoke' para sus propias funciones.

import { _saveUserPrefs, _shortcutsLoad, _shortcutsSave, getAllSessions, getState, save, _getActiveProjectFilter, _parseInfraLine, setInfraVersionData, _docPrefix, handleSyncPillClick } from './locus-storage.js';
import { _openItemEditorSafe, onBacklogSortChange, toggleDepsFilter, toggleSortDir } from './locus-backlog-core.js';
import { closeArranquePanel } from './locus-sesiones-arranque.js';
import { openPendPanel, closePendPanel } from './locus-pend.js';
import { openCommandPalette, closeCommandPalette } from './locus-command-palette.js';
import { confirmItemEditor } from './locus-backlog-editor.js';
import { _mgExportAllZip } from './locus-map-generator.js';
import { closeImportDiff, confirmImport, downloadGlobalReport, exportData, importData, openCleanProjectModal } from './locus-reports.js';
import { openChangelog } from './locus-session-save.js';
import { parsePasteStandalone, saveStandaloneCheckpoint } from './locus-session-parse.js';
import { searchContratos } from './locus-contracts.js';
import { toggleContextSection, _dropzoneHandle } from './locus-docs.js'; // T-202606-089 AC-3 — ciclo seguro: uso solo dentro de handler

// ── Global utility ────────────────────────────────────────────────────────
// esc() usada por múltiples módulos (backlog, session, toast, checkpoint)
// Vive aquí porque locus-ui-shell.js carga primero

export function esc(s) { return s ? (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

// ── Sub-tab state ──────────────────────────────────────────────────────────
var currentSubTab = 'backlog'; // ESM-B: var para evitar TDZ en ciclo ui-shell ↔ docs

// ── Tab switching ──────────────────────────────────────────────────────────

// R-202605-067: estado sucio del textarea de AI Card
// El flag es escrito por locus-tracker.js cuando el textarea tiene texto no guardado.
// Si locus-tracker.js aún no lo declara, se usa detección DOM como fallback.
var _trackerTextareaDirty = false; // ESM-B: var para evitar TDZ en ciclo ui-shell ↔ docs
var currentTab = localStorage.getItem('active-tab') || 'sesiones'; // ESM-B: var para evitar TDZ en ciclo ui-shell ↔ docs

// B-202605-019: array module-level para acciones de contratos en panel de búsqueda
// Se repuebla en cada llamada a onSearch — delegation usa índice via data-contrato-idx
let _surContratoActions = [];
let _gChordTimer = null;    // T-202606-098: ESM Pure — reemplaza window._gChordTimer
let _gChordPending = false; // T-202606-098: ESM Pure — reemplaza window._gChordPending

// T-202606-006 T3: lazy refs para romper ciclos ui-shell ↔ backlog-core y ui-shell ↔ session-hora
// Inyectadas desde main.js via _initUiShellRefs() — misma estrategia que _initApp opts en storage.
let _getItemsFn = function() { return []; };
let _relDateFn  = function() { return null; };
export function _initUiShellRefs(opts) {
  if (opts.getItems) _getItemsFn = opts.getItems;
  if (opts.relDate)  _relDateFn  = opts.relDate;
}

export function getCurrentTab() { return currentTab; }
export function getCurrentSubTab() { return currentSubTab; }

export function switchTab(tab) {
  // R-202605-067: guard — confirm si hay texto sin guardar en textarea de AI Card
  const _dirtyTextarea = document.querySelector('.note-ta[data-dirty="true"], .ai-card textarea[data-dirty="true"]');
  const _isDirty = _trackerTextareaDirty || !!_dirtyTextarea;
  if (_isDirty) {
    const _proceed = window.confirm('Hay texto sin guardar. ¿Salir de todos modos?');
    if (!_proceed) {
      // AC-3: restaurar foco al textarea que disparó el estado sucio
      const _focusTarget = _dirtyTextarea || document.querySelector('.note-ta, .ai-card textarea');
      if (_focusTarget) _focusTarget.focus();
      return;
    }
  }

  // DUP-05: cerrar preview de sesión al cambiar de tab
  // (a) event dispatch — locus-session-popup.js escucha 'shell:close-popup'
  window.dispatchEvent(new CustomEvent('shell:close-popup'));
  // B-202605-207: cerrar panel de detalle al cambiar de tab
  // (a) event dispatch — locus-backlog-panel.js escucha 'shell:close-item-panel'
  const panel = document.getElementById('item-detail-panel');
  if (panel && panel.classList.contains('open')) {
    window.dispatchEvent(new CustomEvent('shell:close-item-panel'));
  }
  // T-202604-254: tab 'hoy' eliminado — redirigir a 'tracker'
  if (tab === 'hoy') tab = 'tracker';
  currentTab = tab;
  localStorage.setItem('active-tab', tab); // B-202604-013: persistir tab activo
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tab);
  const tabBtn = document.getElementById('tab-btn-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');

  // Visibility of tab-specific header buttons
  document.querySelectorAll('.tracker-only').forEach(el => el.classList.toggle('is-hidden', tab !== 'tracker'));
  document.querySelectorAll('.analytics-only').forEach(el => el.classList.toggle('is-hidden', tab !== 'analytics'));
  // Templates toolbar: update buttons via _updateSubTabButtons
  // (a) event dispatch — locus-docs.js escucha 'shell:update-subtab-buttons'
  if (tab === 'backlog') {
    window.dispatchEvent(new CustomEvent('shell:update-subtab-buttons', { detail: { sub: currentSubTab || 'backlog' } }));
  }
  // (a) event dispatch — locus-sesiones.js escucha 'shell:stop-sidebar-ticker'
  if (tab !== 'tracker') window.dispatchEvent(new CustomEvent('shell:stop-sidebar-ticker'));

  // Update search placeholder — T-202605-460: conservar término, cerrar panel
  const si = document.getElementById('search-global');
  if (si) {
    si.placeholder = tab === 'tracker' ? 'Buscar sesiones...' : tab === 'backlog' ? 'Buscar ítems...' : 'Buscar...';
    // Conservar el término visible pero cerrar el panel de resultados
  }
  const sc = document.getElementById('search-count');
  if (sc) sc.textContent = '';
  // T-202605-460: cerrar panel sin borrar el término del input
  const _surPanel = document.getElementById('search-unified-results');
  if (_surPanel) _surPanel.remove();

  if (tab === 'tracker') {
    // (a) event dispatch — locus-sesiones.js escucha 'shell:render-tracker'
    window.dispatchEvent(new CustomEvent('shell:render-tracker'));
  } else if (tab === 'backlog') {
    // (a) event dispatch — locus-backlog-core.js escucha 'shell:update-backlog-banner'
    window.dispatchEvent(new CustomEvent('shell:update-backlog-banner'));
    // (a) event dispatch — locus-backlog-render.js escucha 'shell:render-backlog-list'
    window.dispatchEvent(new CustomEvent('shell:render-backlog-list'));
  } else if (tab === 'analytics') {
    // (a) event dispatch — locus-analytics-render.js escucha 'shell:render-analytics'
    window.dispatchEvent(new CustomEvent('shell:render-analytics'));
  } else if (tab === 'sprint') {
    // (a) event dispatch — locus-sprint.js escucha 'shell:render-sprint-tab'
    window.dispatchEvent(new CustomEvent('shell:render-sprint-tab'));
  } else if (tab === 'proyectos') {
    // (a) event dispatch — locus-projects.js escucha 'shell:render-proyectos'
    window.dispatchEvent(new CustomEvent('shell:render-proyectos'));
  }

  // B-[pendiente-ID]: cada tab-panel tiene su propio overflow-y:auto —
  // resetear el scroll del panel activo al cambiar de tab
  if (tabEl) tabEl.scrollTop = 0;

  // Refresh radar sidebar
  // (a) event dispatch — locus-radar.js escucha 'shell:radar-refresh'
  window.dispatchEvent(new CustomEvent('shell:radar-refresh'));
}

// ── Sub-tab switching (extraído de ai-tracker-ai-notes.js) ─────────────────

export function switchSubTab(sub) {
  currentSubTab = sub;
  ['backlog','q-backlog','q-disc','hotfix','htmlmap','context','plan','contratos','historico'].forEach(s => {
    const btn = document.getElementById('sstab-btn-' + s);
    const panel = document.getElementById('sspanel-' + s);
    if (btn) btn.classList.toggle('active', s === sub);
    if (panel) panel.classList.toggle('active', s === sub);
  });
  // (a) event dispatch — locus-docs.js escucha 'shell:update-subtab-buttons'
  window.dispatchEvent(new CustomEvent('shell:update-subtab-buttons', { detail: { sub } }));
  // (a) event dispatch — locus-docs.js escucha 'shell:render-tpl-proj-banner'
  window.dispatchEvent(new CustomEvent('shell:render-tpl-proj-banner'));
  if (sub === 'htmlmap') {
    // (a) event dispatch — locus-map-viewer.js escucha 'shell:render-html-map'
    window.dispatchEvent(new CustomEvent('shell:render-html-map'));
    // (a) event dispatch — locus-docs.js escucha 'shell:update-htmlmap-modification-badge'
    window.dispatchEvent(new CustomEvent('shell:update-htmlmap-modification-badge'));
  }
  if (sub === 'backlog') {
    // (a) event dispatch — locus-backlog-core.js escucha 'shell:load-backlog'
    window.dispatchEvent(new CustomEvent('shell:load-backlog'));
    // (a) event dispatch — locus-backlog-render.js escucha 'shell:render-backlog-list'
    window.dispatchEvent(new CustomEvent('shell:render-backlog-list'));
    // renderStats() se llama directamente — no hay listener de shell:render-stats
    // (a) event dispatch — locus-docs.js escucha 'shell:update-backlog-modification-badge'
    window.dispatchEvent(new CustomEvent('shell:update-backlog-modification-badge'));
  }
  if (sub === 'q-backlog') {
    // (a) event dispatch — locus-backlog-render.js escucha 'shell:render-q-backlog'
    // TKT-B4: 'icebox' → 'q-backlog'/'q-disc' — TKT-C1 registrará estos listeners en locus-backlog-render.js
    window.dispatchEvent(new CustomEvent('shell:render-q-backlog'));
  }
  if (sub === 'q-disc') {
    // (a) event dispatch — locus-backlog-render.js escucha 'shell:render-q-disc'
    // TKT-B4: panel Q-DISC para DISCs — TKT-C1 registrará este listener
    window.dispatchEvent(new CustomEvent('shell:render-q-disc'));
  }
  if (sub === 'hotfix') {
    // T-202606-091: dispatch para refresco de contenido del panel Hotfix.
    // Sin listener aún — render de #hotfix-panel-body pendiente de especificación (gap reportado a Cael).
    window.dispatchEvent(new CustomEvent('shell:render-hotfix'));
    // T-202606-098 T1: renderStats()/updateStatusFilterUI() eliminados — exclusivos de subtab backlog
  }
  if (sub === 'context') {
    // (a) event dispatch — locus-docs.js escucha 'shell:render-context'
    window.dispatchEvent(new CustomEvent('shell:render-context'));
  }
  if (sub === 'plan') {
    // (a) event dispatch — locus-sprint-plan.js escucha 'shell:render-plan'
    window.dispatchEvent(new CustomEvent('shell:render-plan'));
  }
  if (sub === 'contratos') {
    // (a) event dispatch — locus-contracts.js escucha 'shell:render-contratos'
    window.dispatchEvent(new CustomEvent('shell:render-contratos'));
  }
  if (sub === 'historico') {
    // (a) event dispatch — locus-backlog-archive.js escucha 'shell:render-historico'
    window.dispatchEvent(new CustomEvent('shell:render-historico'));
    // T-202606-098 T1: renderStats()/updateStatusFilterUI() eliminados — exclusivos de subtab backlog
  }
  // (a) event dispatch — locus-docs.js escucha 'shell:render-docs-onboarding'
  window.dispatchEvent(new CustomEvent('shell:render-docs-onboarding')); // T-202604-204
}

// ── Theme ──────────────────────────────────────────────────────────────────

export function toggleTheme() {
  const state = getState();
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  save();
}

export function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('more-menu-theme');
  if (btn) {
    const icon = btn.querySelector('.mm-icon');
    if (icon) icon.textContent = t === 'dark' ? '☀' : '🌙';
    // actualizar texto del label según tema activo
    btn.childNodes[btn.childNodes.length - 1].textContent = t === 'dark' ? ' Tema claro' : ' Tema oscuro';
  }
}

// B-202606-021: movida desde locus-reports.js — evita ciclo ESM
// locus-reports.js importa applyTheme de locus-ui-shell.js, por lo que no puede
// ser importada desde aquí. _templateTrigger() inlineada (getter de localStorage, una línea).
// T-202604-009: toggle ⋯ dropdown
// B — position:fixed para escapar overflow:hidden del header (Nova 2026-05-12)
// T-202606-042: exportada para consumo directo en locus-backlog-panel.js sin pasar por window
export function toggleMoreMenu() {
  const m   = document.getElementById('more-menu');
  const btn = document.getElementById('more-menu-btn');
  if (!m) return;

  const isHidden = m.classList.contains('is-hidden');

  if (isHidden) {
    // Anclar coords relativas al viewport — necesario porque .more-menu usa position:fixed
    if (btn) {
      const rect = btn.getBoundingClientRect();
      m.style.setProperty('--menu-top',   rect.bottom + 6 + 'px');
      m.style.setProperty('--menu-right', window.innerWidth - rect.right + 'px');
      m.style.setProperty('--menu-left',  'auto');
    }
    m.classList.remove('is-hidden');

    // T-202604-295: sync checked state desde localStorage — shell estático en index.html
    // _templateTrigger() inlineada — evita import de locus-session-hora.js (ciclo ESM)
    const cur = localStorage.getItem('template-download-trigger') || 'session';
    const sesRad = document.getElementById('tmpl-trigger-session');
    const sprRad = document.getElementById('tmpl-trigger-sprint');
    if (sesRad) sesRad.checked = cur === 'session';
    if (sprRad) sprRad.checked = cur === 'sprint';

    // Cerrar al hacer click fuera del menú
    const _closeOnOutside = (e) => {
      if (!m.contains(e.target) && e.target !== btn) {
        m.classList.add('is-hidden');
        document.removeEventListener('mousedown', _closeOnOutside);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', _closeOnOutside), 0);
  } else {
    m.classList.add('is-hidden');
  }
}

// ── T-202606-009: handler de #hdr-menu-infra-subpanel (reemplaza T-202606-031) ─────────────────────
// Acepta la línea completa BR (<!-- **infra_version: N** | BR-Core vX ... -->).
// Parsea con _parseInfraLine · guarda objeto completo con setInfraVersionData.
export function initInfraVersionHandler() {
  const toggleBtn = document.getElementById('mm-btn-sync-infra');
  const subpanel  = document.getElementById('hdr-menu-infra-subpanel');
  const textarea  = document.getElementById('hdr-menu-infra-textarea');
  const applyBtn  = document.getElementById('hdr-menu-infra-apply');
  const errMsg    = document.getElementById('hdr-menu-infra-error');

  if (!toggleBtn || !subpanel || !textarea || !applyBtn || !errMsg) return;

  // Actualizar placeholder al formato de línea completa BR
  textarea.placeholder = '<!-- **infra_version: N** | BR-Core vX.Y · BR-Ecosystem vX.Y · BR-Execution vX.Y · OB-Strategy vX.Y -->';

  // Toggle del subpanel
  toggleBtn.addEventListener('click', function () {
    subpanel.classList.toggle('open');
  });

  // Habilitación/deshabilitación de Aplicar según contenido
  textarea.addEventListener('input', function () {
    applyBtn.disabled = textarea.value.trim() === '';
  });

  // Validación + apply
  applyBtn.addEventListener('click', function () {
    const raw = textarea.value.trim();
    const parsed = _parseInfraLine(raw);

    if (!parsed) {
      textarea.classList.add('hdr-menu-textarea--error');
      errMsg.textContent = 'Pegar la línea <!-- **infra_version:** ... --> completa';
      errMsg.classList.remove('is-hidden');
      return;
    }

    // Limpiar estado de error previo
    textarea.classList.remove('hdr-menu-textarea--error');
    errMsg.textContent = '';
    errMsg.classList.add('is-hidden');

    setInfraVersionData(parsed);
    subpanel.classList.remove('open');
  });
}

// ── Search dispatch (extraído de ai-tracker-checkpoint.js) ────────────────

export function onSearchDispatch() {
  // T-202604-420: búsqueda global unificada como punto de entrada principal
  const _surPanel = document.getElementById('search-unified-results');
  if (_surPanel) _surPanel.remove();

  // Siempre invocar búsqueda global unificada
  onSearch();
}

// ── Search (extraído de ai-tracker-ai-notes.js) ───────────────────────────

// T-202604-293: Búsqueda global unificada — IAs + sesiones + notas
// T-202604-420: Ampliada — Backlog + Proyectos como grupos adicionales
// B-202605-236: filtro por proyecto activo
// B-202605-237: highlight del término buscado en resultados
let _searchScopeAll = false;

function _toggleSearchScope() {
  _searchScopeAll = !_searchScopeAll;
  const btn = document.getElementById('search-scope-btn');
  if (btn) btn.textContent = _searchScopeAll ? '🌐 Todos los proyectos' : '📁 Proyecto activo';
  onSearch();
}

export function onSearch() {
  const state = getState();
  const q = (document.getElementById('search-global').value || '').toLowerCase().trim();
  const countEl = document.getElementById('search-count');

  // Limpiar panel unificado previo
  const prevPanel = document.getElementById('search-unified-results');
  if (prevPanel) prevPanel.remove();

  if (!q) {
    // (a) event dispatch — locus-sesiones.js escucha 'shell:render-tracker'
    window.dispatchEvent(new CustomEvent('shell:render-tracker'));
    if (countEl) countEl.textContent = '';
    return;
  }

  // B-202605-236: proyecto activo para filtrar sesiones/proyectos
  const _activeProjId = (!_searchScopeAll && _getActiveProjectFilter()) || null;

  // B-202605-237: helper para resaltar término buscado en texto
  const _esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function hlText(raw, term) {
    if (!raw || !term) return _esc(raw || '');
    const escaped = _esc(raw);
    const escapedTerm = _esc(term);
    const re = new RegExp('(' + escapedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escaped.replace(re, '<mark class="sur-hl">$1</mark>');
  }

  // ── 1. IAs coincidentes (nombre o notas) ──
  const aiMatches = (state.ais || []).filter(ai =>
    !ai.archived &&
    (ai.name.toLowerCase().includes(q) || (ai.notes || '').toLowerCase().includes(q))
  );

  // ── 2. Sesiones coincidentes ──
  const sessMatches = [];
  (state.projects || []).forEach(proj => {
    // B-202605-236: filtrar por proyecto activo cuando el scope no es "todos"
    if (_activeProjId && proj.id !== _activeProjId) return;
    (proj.sessions || []).forEach(s => {
      if (
        s.title.toLowerCase().includes(q) ||
        (s.summary || '').toLowerCase().includes(q) ||
        (s.pending || '').toLowerCase().includes(q) ||
        (s.files || '').toLowerCase().includes(q) ||
        (s.tags || []).some(tid => {
          const t = (state.tags || []).find(x => x.id === tid);
          return t && t.name.toLowerCase().includes(q);
        })
      ) {
        const ai = (state.ais || []).find(a => a.id === s.aiId);
        sessMatches.push({ sess: s, proj, ai });
      }
    });
  });
  // Cronológica inversa, máx 30
  sessMatches.sort((a, b) => parseInt(b.sess.id) - parseInt(a.sess.id));
  const sessSlice = sessMatches.slice(0, 30);

  // ── 3. T-202604-420: Ítems de backlog coincidentes ──
  const _items = _getItemsFn();
  const backlogMatches = _items.filter(item => {
    if (item.status === 'descartado') return false;
    const titleHit = (item.title || item.desc || '').toLowerCase().includes(q);
    const codeHit = (item.code || '').toLowerCase().includes(q);
    const acHit = (item.ac || []).some(a => (typeof a === 'string' ? a : (a.text || '')).toLowerCase().includes(q));
    return titleHit || codeHit || acHit;
  });

  // ── 5. T-202604-420: Proyectos coincidentes ──
  const projMatches = (state.projects || []).filter(p =>
    p.status !== 'archived' &&
    // B-202605-236: si scope es proyecto activo, solo mostrar ese proyecto
    (!_activeProjId || p.id === _activeProjId) &&
    ((p.name || '').toLowerCase().includes(q) || (p.icon || '').toLowerCase().includes(q))
  );

  const total = aiMatches.length + sessMatches.length;
  // R-202604-075: contratos en búsqueda global
  const contratoMatches = searchContratos(q);
  // B-202605-019: poblar array de acciones para event delegation (delegation usa índice)
  _surContratoActions = contratoMatches.map(r => r.action);
  // B-243: búsqueda en contexto del proyecto activo — usa _ctxSections ya cargado
  const contextMatches = [];
  if (typeof _ctxSections !== 'undefined' && _ctxSections && _ctxSections.length) {
    const qNorm = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    _ctxSections.forEach(sec => {
      const titleNorm = sec.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const bodyNorm  = sec.lines.join('\n').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (titleNorm.includes(qNorm) || bodyNorm.includes(qNorm)) {
        contextMatches.push(sec);
      }
    });
  }

  const totalWithContratos = total + contratoMatches.length + backlogMatches.length + projMatches.length + contextMatches.length;
  if (countEl) countEl.textContent = totalWithContratos
    ? `${totalWithContratos} resultado${totalWithContratos !== 1 ? 's' : ''} · IAs, sesiones, notas, backlog, proyectos, contexto`
    : 'Sin resultados';

  // ── Filtrar cards del grid (comportamiento previo) ──
  state.ais.forEach(ai => {
    const card = document.getElementById('card-' + ai.id);
    if (!card) return;
    const nameMatch = ai.name.toLowerCase().includes(q);
    const notesMatch = (ai.notes || '').toLowerCase().includes(q);
    const hasSessMatch = sessMatches.some(({ ai: sai }) => sai && sai.id === ai.id);
    card.classList.toggle('is-hidden', !(nameMatch || notesMatch || hasSessMatch));
    const list = card.querySelector('.sess-list');
    if (!list) return;
    const matchSessIds = new Set(sessMatches.filter(({ ai: sai }) => sai && sai.id === ai.id).map(({ sess }) => sess.id));
    list.querySelectorAll('.sess-row').forEach(row => {
      const sessId = row.dataset.sessId;
      const match = notesMatch || (sessId && matchSessIds.has(sessId));
      row.classList.toggle('is-hidden', !match);
    });
  });

  // ── Renderizar panel de resultados agrupados ──
  const grid = document.getElementById('grid');
  if (!grid) return;

  // B-202605-236: scope toggle label
  const scopeLabel = _activeProjId ? '\u{1F4C1} Proyecto activo' : '\u{1F310} Todos los proyectos';

  let html = '<div class="sur-inner">';

  // B-202605-236: control de scope visible en cabecera del panel
  html += `<div class="sur-scope-row"><button class="sur-scope-btn" id="search-scope-btn" data-action="toggleSearchScope">${scopeLabel}</button></div>`;

  // Grupo IAs
  if (aiMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">\u{1F916} IAs (${aiMatches.length})</div>
      <div class="sur-rows">`;
    aiMatches.forEach(ai => {
      const statusDot = ai.status === 'available' ? '\u{1F7E2}' : '\u{1F534}';
      const noteSnip = ai.notes ? `<span class="sur-meta">${hlText(ai.notes.slice(0, 80), q)}${ai.notes.length > 80 ? '\u2026' : ''}</span>` : '';
      html += `<div class="sur-row" data-action="navigateToCard" data-ai-id="${ai.id}">
        <span class="sur-row-icon">${statusDot}</span>
        <span class="sur-row-title">${hlText(ai.name, q)}</span>
        ${noteSnip}
      </div>`;
    });
    html += '</div></div>';
  }

  // Grupo Sesiones
  if (sessSlice.length) {
    const moreCount = sessMatches.length - sessSlice.length;
    html += `<div class="sur-group">
      <div class="sur-group-label">\u{1F4CB} Sesiones (${sessMatches.length})</div>
      <div class="sur-rows">`;
    sessSlice.forEach(({ sess, proj, ai }) => {
      const aiName = ai ? hlText(ai.name, q) : '\u2014';
      const projName = proj ? _esc((proj.icon || '\u{1F4C1}') + ' ' + proj.name) : '';
      const dateLabel = _relDateFn(sess.date, sess.savedAt || sess.createdAt) || sess.dateShort || '';
      const summSnip = sess.summary ? `<span class="sur-meta">${hlText(sess.summary.slice(0, 80), q)}${sess.summary.length > 80 ? '\u2026' : ''}</span>` : '';
      html += `<div class="sur-row" data-action="openDetail" data-ai-id="${ai ? ai.id : ''}" data-sess-id="${sess.id}">
        <span class="sur-row-icon">📄</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(sess.title, q)}</span>
          <span class="sur-row-sub">${aiName}${projName ? ' · ' + projName : ''}${dateLabel ? ' · ' + dateLabel : ''}</span>
          ${summSnip}
        </div>
      </div>`;
    });
    if (moreCount > 0) {
      html += `<div class="sur-more">+${moreCount} sesión${moreCount !== 1 ? 'es' : ''} más — usa Log para explorar</div>`;
    }
    html += '</div></div>';
  }

  // Grupo Contratos — R-202604-075
  if (contratoMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">📐 Contratos (${contratoMatches.length})</div>
      <div class="sur-rows">`;
    contratoMatches.forEach((r, idx) => {
      const icon = r.type === 'contrato-modulo' ? '📄' : '⚙';
      html += `<div class="sur-row" data-action="contratoAction" data-contrato-idx="${idx}">
        <span class="sur-row-icon">${icon}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(r.label, q)}</span>
          <span class="sur-row-sub">${_esc(r.sub)}</span>
        </div>
      </div>`;
    });
    html += '</div></div>';
  }

  // Grupo Backlog — T-202604-420
  if (backlogMatches.length) {
    const bSlice = backlogMatches.slice(0, 25);
    const bMore = backlogMatches.length - bSlice.length;
    html += `<div class="sur-group">
      <div class="sur-group-label">🗃 Backlog (${backlogMatches.length})</div>
      <div class="sur-rows">`;
    bSlice.forEach(item => {
      const typeIcons = { R: '🔵', T: '🟢', B: '🔴', P: '🟣' };
      const typeChar = (item.code || '').charAt(0);
      const icon = typeIcons[typeChar] || '📌';
      const statusLabel = item.status === 'done' ? ' · ✓' : '';
      html += `<div class="sur-row" data-action="navigateToItem" data-item-code="${_esc(item.code)}">
        <span class="sur-row-icon">${icon}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(item.title || item.desc || item.code, q)}</span>
          <span class="sur-row-sub"><span class="sur-badge">${_esc(item.code)}</span>${statusLabel}</span>
        </div>
      </div>`;
    });
    if (bMore > 0) {
      html += `<div class="sur-more">+${bMore} ítem${bMore !== 1 ? 's' : ''} más — usa filtros de Backlog para explorar</div>`;
    }
    html += '</div></div>';
  }

  // Grupo Proyectos — T-202604-420
  if (projMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">📁 Proyectos (${projMatches.length})</div>
      <div class="sur-rows">`;
    projMatches.forEach(p => {
      const sessCount = (p.sessions || []).length;
      html += `<div class="sur-row" data-action="selectProjectFilter" data-proj-id="${_esc(p.id)}">
        <span class="sur-row-icon">${_esc(p.icon || '📁')}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(p.name, q)}</span>
          <span class="sur-row-sub">${sessCount} sesión${sessCount !== 1 ? 'es' : ''}</span>
        </div>
      </div>`;
    });
    html += '</div></div>';
  }

  if (!totalWithContratos) {
    html += `<div class="sur-empty">Sin resultados para "<strong>${_esc(q)}</strong>"</div>`;
  }

  // B-243: Grupo Contexto — secciones del sub-tab Contexto que coinciden con la búsqueda
  if (contextMatches.length) {
    const ctxSlice = contextMatches.slice(0, 6);
    const ctxMore  = contextMatches.length - ctxSlice.length;
    html += `<div class="sur-group">
      <div class="sur-group-label">📄 Contexto (${contextMatches.length})</div>
      <div class="sur-rows">`;
    ctxSlice.forEach(sec => {
      const secIdx = _ctxSections.indexOf(sec);
      const snippet = sec.lines.find(l => {
        const n = l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return n.includes(q.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      }) || '';
      html += `<div class="sur-row" data-action="navigateToContext" data-ctx-idx="${secIdx}">
        <span class="sur-row-icon">📄</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(sec.title, q)}</span>
          ${snippet ? `<span class="sur-meta">${hlText(snippet.trim().slice(0, 80), q)}${snippet.trim().length > 80 ? '…' : ''}</span>` : ''}
        </div>
      </div>`;
    });
    if (ctxMore > 0) {
      html += `<div class="sur-more">+${ctxMore} sección${ctxMore !== 1 ? 'es' : ''} más — abre Contexto para explorar</div>`;
    }
    html += '</div></div>';
  }

  html += '</div>';

  const panel = document.createElement('div');
  panel.id = 'search-unified-results';
  panel.className = 'search-unified-results';
  panel.innerHTML = html;
  grid.insertAdjacentElement('afterend', panel);
}

// ── Setup Checklist (SCB) ──────────────────────────────────────────────────

function _scbDismissed() {
  return localStorage.getItem('setup-checklist-dismissed') === '1';
}

function _scbDismiss() {
  localStorage.setItem('setup-checklist-dismissed', '1');
  const banner = document.getElementById('setup-checklist-banner');
  if (banner) {
    banner.classList.remove('scb-expanded');
    banner.classList.add('is-hidden');
  }
}

function _scbStep(id, done) {
  const el = document.getElementById('scb-step-' + id);
  if (!el) return;
  const icon = el.querySelector('.scb-icon');
  const wasDone = el.classList.contains('scb-done');
  el.classList.toggle('scb-done', done);
  el.classList.remove('scb-active');
  if (icon) icon.textContent = done ? '✓' : '○';
  // opacity fade ○→✓ 150ms (CSS handles transition)
  if (!wasDone && done) el.classList.add('scb-just-done');
}

export function renderSetupChecklist() {
  const banner = document.getElementById('setup-checklist-banner');
  if (!banner) return;
  if (_scbDismissed()) { banner.classList.add('is-hidden'); return; }

  const state = getState();
  const workerDone  = (state.ais || []).length > 0;
  const projectDone = (state.projects || []).length > 0;
  // (c) acceso via window.* — getItems expuesto por locus-backlog-core.js
  const itemDone    = _getItemsFn().length > 0;
  const sessionDone = getAllSessions().length > 0;
  const allDone = workerDone && projectDone && itemDone && sessionDone;

  if (allDone) { banner.classList.add('is-hidden'); return; }

  banner.classList.remove('is-hidden');
  _scbStep('worker',  workerDone);
  _scbStep('project', projectDone);
  _scbStep('item',    itemDone);
  _scbStep('session', sessionDone);

  // Mark first pending step as active
  const steps = [
    { id: 'worker',  done: workerDone },
    { id: 'project', done: projectDone },
    { id: 'item',    done: itemDone },
    { id: 'session', done: sessionDone }
  ];
  for (const s of steps) {
    if (!s.done) {
      const el = document.getElementById('scb-step-' + s.id);
      if (el) el.classList.add('scb-active');
      break;
    }
  }

  // If banner was expanded and first step is now done → collapse
  if (banner.classList.contains('scb-expanded') && workerDone) {
    _scbCollapse(banner);
    try { localStorage.setItem('onboarding-seen', '1'); } catch(_) {}
    _saveUserPrefs();
  }

  // First use: expand if onboarding-seen not set and banner not yet expanded
  const isFirstUse = !localStorage.getItem('onboarding-seen');
  if (isFirstUse && !banner.classList.contains('scb-expanded')) {
    _scbExpand(banner);
  }
}

function _scbExpand(banner) {
  const b = banner || document.getElementById('setup-checklist-banner');
  if (!b) return;
  b.classList.add('scb-expanded');
  // Focus first action button
  const firstAction = b.querySelector('.scb-active .scb-step-action');
  if (firstAction) setTimeout(() => firstAction.focus(), 210); // after transition
}

function _scbCollapse(banner) {
  const b = banner || document.getElementById('setup-checklist-banner');
  if (!b) return;
  b.classList.remove('scb-expanded');
}

// Called when user completes first step — collapse expanded state
function _scbOnStepComplete() {
  const banner = document.getElementById('setup-checklist-banner');
  if (banner && banner.classList.contains('scb-expanded')) {
    _scbCollapse(banner);
    // Mark onboarding-seen so expanded state doesn't reappear
    try { localStorage.setItem('onboarding-seen', '1'); } catch(_) {}
    _saveUserPrefs();
  }
}

// Action buttons per step — routes to existing open functions
function _scbStepAction(stepId) {
  switch (stepId) {
    // (a) event dispatch — locus-workers.js escucha 'shell:open-add-ai'
    case 'worker':  window.dispatchEvent(new CustomEvent('shell:open-add-ai')); break;
    case 'project': openProjModal(); break;
    case 'item':    switchTab('backlog'); break;
    case 'session': /* Session created via CHECKPOINT paste — no direct action */ break;
  }
}

// ── ESC Cascade ────────────────────────────────────────────────────────────

// T-202604-418: Atajos de teclado globales
// Cascade Escape — cierra en orden de profundidad (más reciente primero)
export function _escCascade() {
  const _overlayChecks = [
    // T-202605-460: panel búsqueda global — prioridad más alta
    () => { const el = document.getElementById('search-unified-results'); if (el) { el.remove(); return true; } },
    // Prioridad alta — modales de confirmación / editing
    () => { const el = document.getElementById('shortcuts-ref-overlay'); if (el && !el.classList.contains('is-hidden')) { closeShortcutsRef(); return true; } },
    () => { const el = document.getElementById('shortcuts-overlay'); if (el && !el.classList.contains('is-hidden')) { closeShortcuts(); return true; } },
    () => { const el = document.getElementById('cp-overlay'); if (el && !el.classList.contains('is-hidden')) { closeCommandPalette(); return true; } },
    // (a) event dispatch — locus-sesiones-capture.js escucha 'shell:close-quick-capture'
    () => { const el = document.getElementById('qc-modal-overlay'); if (el && el.classList.contains('open')) { window.dispatchEvent(new CustomEvent('shell:close-quick-capture')); return true; } },
    // (a) event dispatch — locus-backlog-panel.js escucha 'shell:close-item-panel'
    () => { const el = document.getElementById('item-detail-panel'); if (el && el.classList.contains('open')) { window.dispatchEvent(new CustomEvent('shell:close-item-panel')); return true; } },
    // (a) event dispatch — locus-backlog-editor.js escucha 'shell:close-item-editor'
    () => { const el = document.getElementById('item-editor-overlay'); if (el && el.offsetParent !== null) { window.dispatchEvent(new CustomEvent('shell:close-item-editor')); return true; } },
    // (a) event dispatch — locus-sesiones-viz.js escucha 'shell:item-viz-close'
    () => { const el = document.getElementById('merge-diff-overlay'); if (el && el.offsetParent !== null) { { const p = document.getElementById('item-viz-overlay'); if (p && !p.classList.contains('is-hidden')) { window.dispatchEvent(new CustomEvent('shell:item-viz-close')); return true; } } } },
    () => { const el = document.getElementById('item-viz-overlay'); if (el && !el.classList.contains('is-hidden')) { window.dispatchEvent(new CustomEvent('shell:item-viz-close')); return true; } },
    () => { const el = document.getElementById('pend-overlay'); if (el && el.offsetParent !== null) { closePendPanel(); return true; } },
    // (a) event dispatch — locus-sprint-project.js escucha 'shell:close-proj-modal'
    () => { const el = document.getElementById('proj-modal-overlay'); if (el && el.offsetParent !== null) { window.dispatchEvent(new CustomEvent('shell:close-proj-modal')); return true; } },
    // (a) event dispatch — locus-sprint-project.js escucha 'shell:close-proj-panel'
    () => { const el = document.getElementById('proj-panel-overlay'); if (el && el.offsetParent !== null) { window.dispatchEvent(new CustomEvent('shell:close-proj-panel')); return true; } },
    // (a) event dispatch — locus-pulso.js escucha 'shell:close-pulso-panel'
    () => { const el = document.getElementById('pulso-panel'); if (el && el.offsetParent !== null) { window.dispatchEvent(new CustomEvent('shell:close-pulso-panel')); return true; } },
  ];
  for (const check of _overlayChecks) {
    if (check()) return;
  }
}

// ── Click listener — cerrar search-unified-results al click fuera ──────────
// T-202605-460
document.addEventListener('click', e => {
  const panel = document.getElementById('search-unified-results');
  if (!panel) return;
  const input = document.getElementById('search-global');
  if (!panel.contains(e.target) && e.target !== input) panel.remove();
}, true);

// ── Keydown listener global ────────────────────────────────────────────────
// T-202604-418: Atajos de teclado globales
document.addEventListener('keydown', e => {
  // Escape en cascada — prioridad absoluta
  if (e.key === 'Escape') {
    _escCascade();
    return;
  }

  // Cmd+K / Ctrl+K → delegado a _cpGlobalKeydown en ai-tracker-command-palette.js

  // T-202605-442: Cmd+? → referencia de atajos (Cmd+Shift+/ y Cmd+?)
  if ((e.metaKey || e.ctrlKey) && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
    e.preventDefault();
    openShortcutsRef();
    return;
  }

  // Ctrl+F / Cmd+F — foco al search global
  // B-202606-001: ignorar cuando el IDP está abierto
  if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
    const idp = document.getElementById('item-detail-panel');
    if (idp && !idp.classList.contains('is-hidden')) return;
    const si = document.getElementById('search-global');
    if (!si) return;
    e.preventDefault();
    si.focus();
    si.select();
    return;
  }

  // R-202604-043: keyboard shortcuts globales
  // Desactivados cuando el foco está en input/textarea/contenteditable
  const _tag = document.activeElement ? document.activeElement.tagName : '';
  const _editable = document.activeElement ? document.activeElement.isContentEditable : false;
  const _inInput = _tag === 'INPUT' || _tag === 'TEXTAREA' || _tag === 'SELECT' || _editable;

  // Chord G + letra — navegar entre tabs (configurable)
  const _hasChordWithG = _SHORTCUT_DEFS && _SHORTCUT_DEFS.some(d => d.chord && (_shortcutKey(d.id) || '').startsWith('g'));
  if (!_inInput && !e.ctrlKey && !e.metaKey && !e.altKey && e.key === 'g' && _hasChordWithG) {
    clearTimeout(_gChordTimer);
    _gChordPending = true;
    _gChordTimer = setTimeout(() => { _gChordPending = false; }, 1000);
    e.preventDefault();
    return;
  }
  if (_gChordPending && !e.ctrlKey && !e.metaKey && !e.altKey) {
    clearTimeout(_gChordTimer);
    _gChordPending = false;
    const _letter = e.key.toLowerCase();
    const _chordDef = _SHORTCUT_DEFS && _SHORTCUT_DEFS.find(d => {
      if (!d.chord) return false;
      const active = _shortcutKey(d.id) || '';
      return active.replace('g+', '') === _letter;
    });
    if (_chordDef) {
      e.preventDefault();
      const _tabIdMap = {
        'tab-tracker': 'tracker', 'tab-backlog': 'backlog',
        'tab-analytics': 'analytics', 'tab-proyectos': 'proyectos'
      };
      const _dest = _tabIdMap[_chordDef.id];
      if (_dest) switchTab(_dest);
    }
    return;
  }

  if (_inInput || e.ctrlKey || e.metaKey || e.altKey) return;

  // T-202605-442 + T-202604-418: dispatch por tecla configurada
  const _pressedKey = e.key.toLowerCase();

  // T-202604-420: '/' → foco en búsqueda global (solo si foco no está en campo de texto)
  if (_pressedKey === '/' && !_inInput) {
    e.preventDefault();
    const si = document.getElementById('search-global');
    if (!si) return;
    si.focus();
    si.select();
    return;
  }

  // T-202604-418: Shift+N → nuevo ítem
  if (e.shiftKey && e.key === 'N') {
    e.preventDefault();
    openItemEditor(null);
    return;
  }

  // T-202604-418: S → guardar sesión activa si hay borrador pendiente
  if (_pressedKey === _sk('save-session')) {
    e.preventDefault();
    const _activeTA = document.querySelector('.main-textarea:not([readonly])');
    if (_activeTA && _activeTA.value.trim()) {
      const _aiId = _activeTA.closest('[data-ai-id]') && _activeTA.closest('[data-ai-id]').dataset.aiId;
      const _sbtn = _aiId
        ? document.getElementById(`sbtn-${_aiId}`)
        : document.querySelector('.sc-save');
      if (_sbtn) _sbtn.click();
    }
    return;
  }

  // T-202604-418: F → toggle focus mode (deprecado — focus mode eliminado)

  // T-202604-418: / → búsqueda global (cuando no está en input)
  if (e.key === '/') {
    e.preventDefault();
    const si = document.getElementById('search-global');
    if (si) { si.focus(); si.select(); }
    return;
  }

  if (_pressedKey === _sk('search')) {
    e.preventDefault();
    const _searches = ['backlog-search', 'search-global', 'log-search', 'context-search', 'map-search'];
    for (const sid of _searches) {
      const sel = document.getElementById(sid);
      if (sel && sel.offsetParent !== null) { sel.focus(); sel.select(); break; }
    }
    return;
  }

  if (_pressedKey === _sk('paste-ckpt')) {
    e.preventDefault();
    switchTab('backlog');
    setTimeout(() => {
      switchSubTab('tracker');
      const _standalonePanel = document.getElementById('sspanel-tracker');
      if (_standalonePanel) _standalonePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return;
  }

  // T-202604-418: J/K → navegan en cualquier lista activa
  if (_pressedKey === _sk('nav-up') || _pressedKey === _sk('nav-down')) {
    e.preventDefault();
    const _dir = _pressedKey === _sk('nav-down') ? 1 : -1;
    const _selectors = [
      '.backlog-item:not([style*="display: none"]):not([style*="display:none"])',
      '.log-card',
      '.hoy-mini-card',
    ];
    for (const _sel of _selectors) {
      const _items = Array.from(document.querySelectorAll(_sel)).filter(el => el.offsetParent !== null);
      if (!_items.length) continue;
      const _cur = _items.findIndex(el => el.classList.contains('kb-selected'));
      let _next = _cur + _dir;
      if (_next < 0) _next = _items.length - 1;
      if (_next >= _items.length) _next = 0;
      _items.forEach(el => el.classList.remove('kb-selected'));
      _items[_next].classList.add('kb-selected');
      _items[_next].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      break;
    }
    return;
  }

  // T-202604-418: Enter → abre detalle del ítem seleccionado en cualquier lista
  if (e.key === 'Enter') {
    const _selBL = document.querySelector('.backlog-item.kb-selected');
    if (_selBL) {
      e.preventDefault();
      const _code = _selBL.dataset.code;
      if (_code) navigateToItem(_code);
      else {
        const _item = _selBL.dataset.id && _getItemsFn().find(i => i.id === _selBL.dataset.id); // B-202606-024: getItems() → _getItemsFn()
        if (_item) openItemPanel(_item);
      }
      return;
    }
    const _selLog = document.querySelector('.log-card.kb-selected');
    if (_selLog) {
      e.preventDefault();
      _selLog.click();
      return;
    }
    return;
  }

  if (_pressedKey === _sk('edit-item')) {
    if (currentTab !== 'backlog') return;
    const _sel = document.querySelector('.backlog-item.kb-selected');
    if (!_sel) return;
    e.preventDefault();
    const _code = _sel.dataset.code;
    if (_code) openItemEditor(null, _code);
    return;
  }
});

// ── Shortcuts configurables ────────────────────────────────────────────────
// T-202605-442
// _SHORTCUTS_KEY, _USER_PREFS_TS_KEY, _shortcutsLoad, _shortcutsSave → viven en locus-storage.js

const _SHORTCUT_DEFS = [
  // Navegación de tabs (chord G+)
  { id: 'tab-tracker',   label: 'Ir a Tracker',                  group: 'Navegación', default: 'g+t', chord: true },
  { id: 'tab-backlog',   label: 'Ir a Backlog',                   group: 'Navegación', default: 'g+d', chord: true },
  { id: 'tab-analytics', label: 'Ir a Analytics',                 group: 'Navegación', default: 'g+a', chord: true },
  { id: 'tab-proyectos', label: 'Ir a Proyectos',                 group: 'Navegación', default: 'g+p', chord: true },
  // Acciones globales — T-202604-418
  { id: 'save-session',  label: 'Guardar sesión activa',          group: 'Acciones',   default: 's',   chord: false },
  { id: 'search',        label: 'Búsqueda en tab activo',         group: 'Acciones',   default: '/',   chord: false },
  { id: 'paste-ckpt',    label: 'Pegar CHECKPOINT',               group: 'Acciones',   default: 'p',   chord: false },
  // R-202605-065: guardar desde textarea de AI Card — no configurable (combo fijo ⌘/Ctrl+↵)
  { id: 'save-session-textarea', label: 'Guardar sesión (textarea activo)', group: 'Acciones', default: '⌘+Enter / Ctrl+Enter', chord: false, fixed: true },
  // Backlog — T-202604-418 amplía J/K a cualquier lista activa
  { id: 'nav-up',        label: 'Ítem anterior (lista activa)',   group: 'Backlog',    default: 'j',   chord: false },
  { id: 'nav-down',      label: 'Ítem siguiente (lista activa)',  group: 'Backlog',    default: 'k',   chord: false },
  { id: 'edit-item',     label: 'Editar ítem seleccionado',       group: 'Backlog',    default: 'e',   chord: false },
];

// Resuelve la tecla activa de un shortcut (override o default)
function _shortcutKey(id) {
  const overrides = _shortcutsLoad();
  const def = _SHORTCUT_DEFS.find(d => d.id === id);
  if (!def) return null;
  return overrides[id] || def.default;
}

// Detecta conflictos: retorna id del shortcut que ya usa esa tecla, excluyendo el propio
function _shortcutConflict(key, excludeId) {
  const overrides = _shortcutsLoad();
  for (const def of _SHORTCUT_DEFS) {
    if (def.id === excludeId) continue;
    const active = overrides[def.id] || def.default;
    if (active.toLowerCase() === key.toLowerCase()) return def.id;
  }
  return null;
}

// Render del panel de configuración
function _shortcutsRender() {
  const body = document.getElementById('shortcuts-body');
  if (!body) return;
  // Pasar validIds para limpiar claves huérfanas de versiones anteriores (B-202606-002)
  const overrides = _shortcutsLoad(_SHORTCUT_DEFS.map(d => d.id));

  // Agrupar por grupo
  const groups = {};
  _SHORTCUT_DEFS.forEach(def => {
    if (!groups[def.group]) groups[def.group] = [];
    groups[def.group].push(def);
  });

  body.innerHTML = Object.entries(groups).map(([group, defs]) => {
    const rows = defs.map(def => {
      // R-202605-065: atajos fijos (fixed:true) — solo visualización, sin edición
      if (def.fixed) {
        return `<div class="sc-row sc-row--fixed" data-id="${def.id}">
          <span class="sc-row-label">${def.label}</span>
          <div class="sc-row-right">
            <kbd class="sc-key-pill sc-key-pill--fixed">${def.default}</kbd>
          </div>
        </div>`;
      }
      const active = overrides[def.id] || def.default;
      const isModified = !!overrides[def.id] && overrides[def.id] !== def.default;
      const displayKey = def.chord
        ? active.replace('+', ' → ').toUpperCase()
        : active.toUpperCase();
      return `<div class="sc-row" data-id="${def.id}">
        <span class="sc-row-label">${def.label}</span>
        <div class="sc-row-right">
          ${isModified ? `<span class="sc-modified-badge">modificado</span>` : ''}
          <kbd class="sc-key-pill${isModified ? ' is-modified' : ''}">${displayKey}</kbd>
          <button class="sc-edit-btn" data-action="shortcutsStartEdit" data-sc-id="${def.id}" title="Cambiar atajo">✎</button>
          ${isModified ? `<button class="sc-reset-one-btn" data-action="shortcutsResetOne" data-sc-id="${def.id}" title="Restaurar default">↺</button>` : ''}
        </div>
      </div>`;
    }).join('');
    return `<div class="sc-group">
      <div class="sc-group-label">${group}</div>
      ${rows}
    </div>`;
  }).join('');
}

// Iniciar edición inline de un atajo
function _shortcutsStartEdit(id) {
  const def = _SHORTCUT_DEFS.find(d => d.id === id);
  if (!def) return;
  const row = document.querySelector(`.sc-row[data-id="${id}"]`);
  if (!row) return;

  const overrides = _shortcutsLoad();
  const current = overrides[id] || def.default;

  row.innerHTML = `
    <span class="sc-row-label">${def.label}</span>
    <div class="sc-row-right sc-editing">
      <input class="sc-key-input" id="sc-input-${id}"
        value="${current}"
        placeholder="${def.chord ? 'ej: g+t' : 'ej: n'}"
        maxlength="5"
        autocomplete="off" autocorrect="off" spellcheck="false">
      <span class="sc-error" id="sc-err-${id}"></span>
      <button class="sc-save-btn" id="sc-save-${id}">Guardar</button>
      <button class="sc-cancel-btn" id="sc-cancel-${id}">Cancelar</button>
    </div>`;

  const input = document.getElementById(`sc-input-${id}`);
  if (input) {
    input.addEventListener('keydown', function(e) { _shortcutsCaptureKey(e, id, def.chord); });
    input.focus();
    input.select();
  }
  const saveBtn = document.getElementById(`sc-save-${id}`);
  if (saveBtn) saveBtn.addEventListener('click', function() { _shortcutsSaveEdit(id, def.chord); });
  const cancelBtn = document.getElementById(`sc-cancel-${id}`);
  if (cancelBtn) cancelBtn.addEventListener('click', function() { _shortcutsRender(); });
}

// Captura de tecla en modo edición
function _shortcutsCaptureKey(e, id, isChord) {
  if (e.key === 'Escape') { _shortcutsRender(); return; }
  if (e.key === 'Enter') { _shortcutsSaveEdit(id, isChord); return; }
  if (isChord) return; // chord: usuario escribe manualmente (g+t)
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;
  e.preventDefault();
  const input = document.getElementById(`sc-input-${id}`);
  if (input) input.value = e.key.toLowerCase();
}

function _shortcutsSaveEdit(id, isChord) {
  const input = document.getElementById(`sc-input-${id}`);
  if (!input) return;
  const errEl = document.getElementById(`sc-err-${id}`);
  const raw = input.value.trim().toLowerCase();

  if (!raw) { if (errEl) errEl.textContent = 'Escribe una tecla'; return; }
  if (isChord && !/^g\+[a-z]$/.test(raw)) {
    if (errEl) errEl.textContent = 'Formato: g+letra (ej: g+t)'; return;
  }
  if (!isChord && (raw.length !== 1 || !/[a-z]/.test(raw))) {
    if (errEl) errEl.textContent = 'Solo una letra (a-z)'; return;
  }

  const conflict = _shortcutConflict(raw, id);
  if (conflict) {
    const conflictDef = _SHORTCUT_DEFS.find(d => d.id === conflict);
    if (errEl) errEl.textContent = `Conflicto con: ${conflictDef ? conflictDef.label : conflict}`;
    return;
  }

  const def = _SHORTCUT_DEFS.find(d => d.id === id);
  const overrides = _shortcutsLoad();
  if (raw === def.default) {
    delete overrides[id];
  } else {
    overrides[id] = raw;
  }
  _shortcutsSave(overrides);
  _shortcutsRender();
}

function _shortcutsResetOne(id) {
  const overrides = _shortcutsLoad();
  delete overrides[id];
  _shortcutsSave(overrides);
  _shortcutsRender();
}

export function restoreDefaultShortcuts() {
  localStorage.removeItem(_SHORTCUTS_KEY);
  _saveUserPrefs(); // R-4: sincronizar reset a Supabase
  _shortcutsRender();
}

export function openShortcuts() {
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) {
    overlay.classList.remove('is-hidden');
    _shortcutsRender();
    // (b) lazy import dinámico — _focusFirstInteractive requiere ejecución síncrona post-render
    import('./locus-modals.js').then(m => m._focusFirstInteractive('shortcuts-panel'));
  }
}

export function closeShortcuts(e) {
  if (e && e.target !== document.getElementById('shortcuts-overlay')) return;
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) overlay.classList.add('is-hidden');
}

// DUP-03: openShortcutsRef y closeShortcutsRef redirigen a #shortcuts-overlay
export function openShortcutsRef() { openShortcuts(); }
function closeShortcutsRef(e) { closeShortcuts(e); }

// Shorthand interno
function _sk(id) { return _shortcutKey(id); }

// ── T-202605-044: Migración de handlers inline → addEventListener ──────────
// Reemplaza los onclick declarados en index.html para los elementos de shell:
// logo-btn, tab-btn (×5), sstab-btn (×5), more-menu-theme,
// botón Shortcuts en more-menu, botón Templates en proj-panel.
document.addEventListener('DOMContentLoaded', function () {

  // #logo-btn → switchTab('sesiones')
  const logoBtn = document.getElementById('logo-btn');
  if (logoBtn) logoBtn.addEventListener('click', function () { switchTab('sesiones'); });

  // .tab-btn (×5) — cada botón lleva su tab en el id: tab-btn-{tab}
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    const tab = btn.id.replace('tab-btn-', '');
    btn.addEventListener('click', function () { switchTab(tab); });
  });

  // .sstab-btn (×7) — cada botón lleva su sub-tab en el id: sstab-btn-{tab}
  document.querySelectorAll('[id^="sstab-btn-"]').forEach(function (btn) {
    const stab = btn.id.replace('sstab-btn-', '');
    btn.addEventListener('click', function () { switchSubTab(stab); });
  });

  // #more-menu-theme → toggleTheme()
  const themeBtn = document.getElementById('more-menu-theme');
  if (themeBtn) themeBtn.addEventListener('click', function () { toggleTheme(); });

  // Botón Shortcuts en more-menu — delegation sobre document en capture
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('#more-menu button');
    if (!btn) return;
    if (btn.dataset.action === 'open-shortcuts') {
      e.stopPropagation();
      openShortcuts();
      toggleMoreMenu();
    }
  }, true);

});

// ── END locus-ui-shell.js ──────────────────────────────────────────────────

// ── B-202605-019: Listeners adicionales — scb-dismiss, arranque-btn-ver-todo, event delegation data-action ──
document.addEventListener('DOMContentLoaded', function () {

  // .scb-dismiss → _scbDismiss()
  const scbDismissBtn = document.querySelector('.scb-dismiss');
  if (scbDismissBtn) scbDismissBtn.addEventListener('click', function () { _scbDismiss(); });

  // T-202605-081: .scb-step-action → _scbStepAction(data-step)
  // Delegación sobre #setup-checklist-banner — cubre botones "Hacer ahora →" de cada paso
  const scbBanner = document.getElementById('setup-checklist-banner');
  if (scbBanner) {
    scbBanner.addEventListener('click', function (e) {
      const btn = e.target.closest('.scb-step-action');
      if (!btn) return;
      const stepId = btn.dataset.step;
      if (stepId) _scbStepAction(stepId);
    });
  }

  // #arranque-btn-ver-todo → closeArranquePanel() + switchTab('proyectos')
  const arranqueVerTodoBtn = document.getElementById('arranque-btn-ver-todo');
  if (arranqueVerTodoBtn) arranqueVerTodoBtn.addEventListener('click', function () {
    closeArranquePanel();
    switchTab('proyectos');
  });

  // Event delegation — data-action en sur-row (panel búsqueda) y shortcuts-body
  document.addEventListener('click', function (e) {
    const row = e.target.closest('[data-action]');
    if (!row) return;
    const action = row.dataset.action;
    if (action === 'navigateToCard') {
      const _aiId = row.dataset.aiId;
      import('./locus-sesiones-stats.js').then(function(m) { if (typeof m.navigateToCard === 'function') m.navigateToCard(_aiId); });
    } else if (action === 'openDetail') {
      openDetail(row.dataset.aiId, row.dataset.sessId);
    } else if (action === 'contratoAction') {
      const idx = parseInt(row.dataset.contratoIdx, 10);
      if (typeof _surContratoActions !== 'undefined' && _surContratoActions[idx]) {
        _surContratoActions[idx]();
      }
    } else if (action === 'navigateToItem') {
      navigateToItem(row.dataset.itemCode);
    } else if (action === 'selectProjectFilter') {
      selectProjectFilter(row.dataset.projId);
    } else if (action === 'navigateToContext') {
      const secIdx = parseInt(row.dataset.ctxIdx, 10);
      switchTab('backlog');
      setTimeout(function () {
        switchSubTab('context');
        setTimeout(function () {
          toggleContextSection(secIdx);
          const el = document.getElementById('ctx-sec-' + secIdx);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }, 80);
    } else if (action === 'toggleSearchScope') {
      _toggleSearchScope();
    } else if (action === 'shortcutsStartEdit') {
      _shortcutsStartEdit(row.dataset.scId);
    } else if (action === 'shortcutsResetOne') {
      _shortcutsResetOne(row.dataset.scId);
    }
  });

});

// ── B-202605-019: Listeners — header, breadcrumb, more-menu, inputs ─────────
document.addEventListener('DOMContentLoaded', function () {

  // breadcrumb-proj → openProjPanel()
  const breadcrumbProj = document.getElementById('breadcrumb-proj');
  if (breadcrumbProj) breadcrumbProj.addEventListener('click', function () {
    openProjPanel();
  });

  // hdr-search-trigger → openCommandPalette()
  const hdrSearchTrigger = document.getElementById('hdr-search-trigger');
  if (hdrSearchTrigger) hdrSearchTrigger.addEventListener('click', function () {
    openCommandPalette();
  });

  // header-pend-btn → openPendPanel()
  const headerPendBtn = document.getElementById('header-pend-btn');
  if (headerPendBtn) headerPendBtn.addEventListener('click', function () {
    openPendPanel();
  });

  // ckpt-reopen-btn → shell:show-checkpoint-panel — locus-sesiones-viz.js escucha y llama showCheckpointPanel internamente
  const ckptReopenBtn = document.getElementById('ckpt-reopen-btn');
  if (ckptReopenBtn) ckptReopenBtn.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('shell:show-checkpoint-panel'));
  });

  // user-chip → handleSyncPillClick()
  const userChip = document.getElementById('user-chip');
  if (userChip) userChip.addEventListener('click', function () {
    handleSyncPillClick();
  });

  // more-menu-btn — listener gestionado por locus-backlog-panel.js (_wrappedToggleMoreMenu)
  // B-202606-021: listener duplicado aquí causaba toggle doble (abrir → cerrar en el mismo click)

  // more-menu items por ID
  const mm = {
    'mm-btn-backup':    function () { exportData(); toggleMoreMenu(); },
    'mm-btn-import':    function () { const el = document.getElementById('imp'); if (el) el.click(); toggleMoreMenu(); },
    'mm-btn-report':    function () { downloadGlobalReport(); toggleMoreMenu(); },
    'mm-btn-changelog': function () { openChangelog(); toggleMoreMenu(); },
    // (a) event dispatch — locus-notifications.js escucha 'shell:open-notif-config'
    'mm-btn-notif':     function () { window.dispatchEvent(new CustomEvent('shell:open-notif-config')); toggleMoreMenu(); },
    'mm-btn-sync':      function () { handleSyncPillClick(); toggleMoreMenu(); },
    'mm-btn-clean':     function () { openCleanProjectModal(); toggleMoreMenu(); },
  };
  Object.keys(mm).forEach(function (id) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', mm[id]);
  });

  // #hdr-menu-infra-subpanel — toggle + validación + apply (T-202606-031)
  initInfraVersionHandler();


  // imp file input → importData()
  const impInput = document.getElementById('imp');
  if (impInput) impInput.addEventListener('change', function (e) {
    importData(e);
  });

  // #arranque-close-btn → closeArranquePanel()
  const arranqueCloseBtn = document.getElementById('arranque-close-btn');
  if (arranqueCloseBtn) arranqueCloseBtn.addEventListener('click', function () {
    closeArranquePanel();
  });

});
// ── END B-202605-019 ─────────────────────────────────────────────────────────

// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────

// ── T-202605-078: Migración handlers inline index.html → addEventListener ───
document.addEventListener('DOMContentLoaded', function () {

  // storage-warn close btn
  const storageWarnClose = document.getElementById('storage-warn-close-btn');
  if (storageWarnClose) storageWarnClose.addEventListener('click', function () {
    const el = document.getElementById('storage-warn');
    if (el) el.classList.add('is-hidden');
  });

  // btn-export-backlog
  const btnExportBacklog = document.getElementById('btn-export-backlog');
  if (btnExportBacklog) btnExportBacklog.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('shell:export-backlog'));
  });

  // btn-export-backlog-full
  const btnExportBacklogFull = document.getElementById('btn-export-backlog-full');
  if (btnExportBacklogFull) btnExportBacklogFull.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('shell:export-history'));
  });

  // btn-import-htmlmap
  const btnImportHtmlmap = document.getElementById('btn-import-htmlmap');
  if (btnImportHtmlmap) btnImportHtmlmap.addEventListener('click', function () {
    const fi = document.getElementById('htmlmap-file-input');
    if (fi) fi.click();
  });

  // btn-new-backlog-item
  const btnNewBacklogItem = document.getElementById('btn-new-backlog-item');
  if (btnNewBacklogItem) btnNewBacklogItem.addEventListener('click', function () {
    _openItemEditorSafe(null, null);
  });

  // fbar-deps-btn
  const fbarDepsBtn = document.getElementById('fbar-deps-btn');
  if (fbarDepsBtn) fbarDepsBtn.addEventListener('click', function () {
    toggleDepsFilter();
  });

  // fbar-sort-select
  const fbarSortSelect = document.getElementById('fbar-sort-select');
  if (fbarSortSelect) fbarSortSelect.addEventListener('change', function () {
    onBacklogSortChange(this.value);
  });

  // fbar-sort-dir-btn
  const fbarSortDirBtn = document.getElementById('fbar-sort-dir-btn');
  if (fbarSortDirBtn) fbarSortDirBtn.addEventListener('click', function () {
    toggleSortDir();
  });

  // context-dropzone — drag & drop + click
  const ctxDropzone = document.getElementById('context-dropzone');
  if (ctxDropzone) {
    ctxDropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      this.classList.add('doc-dropzone--over');
    });
    ctxDropzone.addEventListener('dragleave', function () {
      this.classList.remove('doc-dropzone--over');
    });
    ctxDropzone.addEventListener('drop', function (e) {
      this.classList.remove('doc-dropzone--over');
      _dropzoneHandle(e, 'context');
    });
    ctxDropzone.addEventListener('click', function () {
      const fi = document.getElementById('context-file-input');
      if (fi) fi.click();
    });
  }

  // ctx-export-btn
  const ctxExportBtn = document.getElementById('ctx-export-btn');
  if (ctxExportBtn) ctxExportBtn.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('shell:export-context'));
  });

  // tag-new-input — Enter key
  const tagNewInput = document.getElementById('tag-new-input');
  if (tagNewInput) tagNewInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addNewTag();
  });

  // tag-new-btn
  const tagNewBtn = document.getElementById('tag-new-btn');
  if (tagNewBtn) tagNewBtn.addEventListener('click', function () {
    addNewTag();
  });

  // qc-modal — stopPropagation
  const qcModal = document.querySelector('.qc-modal');
  if (qcModal) qcModal.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  // import-diff-overlay — click outside to close
  const importDiffOverlay = document.getElementById('import-diff-overlay');
  if (importDiffOverlay) importDiffOverlay.addEventListener('click', function (e) {
    if (e.target === this) closeImportDiff();
  });

  // import-diff-cancel-btn
  const importDiffCancel = document.getElementById('import-diff-cancel-btn');
  if (importDiffCancel) importDiffCancel.addEventListener('click', function () {
    closeImportDiff();
  });

  // import-diff-confirm-btn
  const importDiffConfirm = document.getElementById('import-diff-confirm-btn');
  if (importDiffConfirm) importDiffConfirm.addEventListener('click', function () {
    confirmImport();
  });

  // item-editor-overlay — click outside to close
  const itemEditorOverlay = document.getElementById('item-editor-overlay');
  if (itemEditorOverlay) itemEditorOverlay.addEventListener('click', function (e) {
    if (e.target === this) closeItemEditor();
  });

  // ie-cancel-btn
  const ieCancelBtn = document.getElementById('ie-cancel-btn');
  if (ieCancelBtn) ieCancelBtn.addEventListener('click', function () {
    closeItemEditor();
  });

  // ie-save-btn
  const ieSaveBtn = document.getElementById('ie-save-btn');
  if (ieSaveBtn) ieSaveBtn.addEventListener('click', function () {
    confirmItemEditor();
  });

  // standalone-ckpt-ta
  const standaloneCkptTa = document.getElementById('standalone-ckpt-ta');
  if (standaloneCkptTa) standaloneCkptTa.addEventListener('input', function () {
    parsePasteStandalone();
  });

  // standalone-ckpt-btn
  const standaloneCkptBtn = document.getElementById('standalone-ckpt-btn');
  if (standaloneCkptBtn) standaloneCkptBtn.addEventListener('click', function () {
    saveStandaloneCheckpoint();
  });

  // export-confirm-cancel-btn
  const exportConfirmCancelBtn = document.getElementById('export-confirm-cancel-btn');
  if (exportConfirmCancelBtn) exportConfirmCancelBtn.addEventListener('click', function () {
    const overlay = document.getElementById('export-confirm-overlay');
    if (overlay) overlay.classList.remove('open');
  });

  // proj-mismatch-cancel-btn
  const projMismatchCancelBtn = document.getElementById('proj-mismatch-cancel-btn');
  if (projMismatchCancelBtn) projMismatchCancelBtn.addEventListener('click', function () {
    const overlay = document.getElementById('proj-mismatch-overlay');
    if (overlay) overlay.classList.remove('open');
  });

  // shortcuts-overlay — click outside (delegado al overlay)
  const shortcutsOverlay = document.getElementById('shortcuts-overlay');
  if (shortcutsOverlay) shortcutsOverlay.addEventListener('click', function (e) {
    closeShortcuts(e);
  });

  // shortcuts-restore-btn
  const shortcutsRestoreBtn = document.getElementById('shortcuts-restore-btn');
  if (shortcutsRestoreBtn) shortcutsRestoreBtn.addEventListener('click', function () {
    restoreDefaultShortcuts();
  });

  // shortcuts-close-btn
  const shortcutsCloseBtn = document.getElementById('shortcuts-close-btn');
  if (shortcutsCloseBtn) shortcutsCloseBtn.addEventListener('click', function () {
    closeShortcuts();
  });

  // cp-overlay — click outside to close
  const cpOverlay = document.getElementById('cp-overlay');
  if (cpOverlay) cpOverlay.addEventListener('click', function (e) {
    if (e.target === this) closeCommandPalette();
  });

  // mg-version-input
  const mgVersionInput = document.getElementById('mg-version-input');
  if (mgVersionInput) mgVersionInput.addEventListener('input', function () {
    const preview = document.getElementById('mg-filename-preview');
    if (preview) {
      preview.textContent = _docPrefix() + '-MAP_' + this.value + '.md';
    }
  });

  // mg-export-backlog-btn
  const mgExportBacklogBtn = document.getElementById('mg-export-backlog-btn');
  if (mgExportBacklogBtn) mgExportBacklogBtn.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('shell:export-backlog'));
  });

  // mg-export-history-btn
  const mgExportHistoryBtn = document.getElementById('mg-export-history-btn');
  if (mgExportHistoryBtn) mgExportHistoryBtn.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('shell:export-history'));
  });

  // mg-export-context-btn
  const mgExportContextBtn = document.getElementById('mg-export-context-btn');
  if (mgExportContextBtn) mgExportContextBtn.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('shell:export-context'));
  });

  // mg-export-all-btn
  const mgExportAllBtn = document.getElementById('mg-export-all-btn');
  if (mgExportAllBtn) mgExportAllBtn.addEventListener('click', function () {
    _mgExportAllZip();
  });

});
// ── END T-202605-078 ─────────────────────────────────────────────────────────

// T-[tmp:t-listeners-storage-sesiones]: listener shell:apply-theme — desacoplamiento de locus-storage.js
// locus-storage.js despacha shell:apply-theme con detail: { theme }
// en lugar de llamar applyTheme() directamente
window.addEventListener('shell:apply-theme', (e) => {
  const { theme } = e.detail || {};
  applyTheme(theme);
});
