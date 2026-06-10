// [PP] v1.0.0 · sprint:PP-S-01 · mod:1 · autor:Rune · 2026-06-11 07:00 UTC-6
// locus-command-palette.js
// Versión: 1.0.4 | Última actualización: 2026-05-23 UTC-6 | B-032 Ctrl+K bubble · B-033 switchTab prefijos · B-242 filtrar IAs archivadas · B-243 navegar a sección Contexto · T-202605-067 nav-tab-sprint
// Renombrado de ai-tracker-command-palette.js


import { confirmCloseSprint, navigateToItem } from './locus-backlog-sprints.js';
import { openItemEditor, openTemplatePicker } from './locus-backlog-editor.js';
import { toggleRadarSidebar } from './locus-radar.js';
import { openQuickCapture } from './locus-sesiones-capture.js';
import { openDetail } from './locus-session-popup.js';
import { openProjPanel } from './locus-sprint-project.js';
import { selectProjectFilter } from './locus-proj-core.js';
import { exportBacklogMd } from './locus-backlog-generator.js';
import { _getActiveProjectFilter, getActiveProject, getActiveSprints, getState } from './locus-storage.js';
import { showToast, toast } from './locus-toast.js';
import { openShortcutsRef, switchSubTab, switchTab, toggleTheme } from './locus-ui-shell.js';
import { normalize } from './locus-map-generator.js';
import { openStandaloneCheckpoint } from './locus-session-parse.js';
import { openDocLog } from './locus-doc-log.js';
import { openPendPanel } from './locus-pend.js';

'use strict';

/* ────────────────────────────────────────────────────────────────
   CONSTANTS
──────────────────────────────────────────────────────────────────*/
const CP_RECENT_KEY = 'cp-recent-commands';
const CP_RECENT_MAX = 5;

/* ────────────────────────────────────────────────────────────────
   COMMAND REGISTRY
   Cada comando tiene: id, label, icon, keywords, action
──────────────────────────────────────────────────────────────────*/

function _buildCommandRegistry() {
  const nav = [
    {
      id: 'nav-tab-tracker',
      label: 'Ir a Tracker',
      icon: '🗂',
      keywords: ['tracker', 'tab', 'ir', 'sesiones', 'cards'],
      group: 'Navegación',
      action: () => { switchTab('tab-tracker'); },
    },
    {
      id: 'nav-tab-backlog',
      label: 'Ir a Documentos',
      icon: '🗃',
      keywords: ['backlog', 'documentos', 'context', 'map', 'tab'],
      group: 'Navegación',
      action: () => { switchTab('tab-backlog'); },
    },
    {
      id: 'nav-tab-analytics',
      label: 'Ir a Analytics',
      icon: '📊',
      keywords: ['analytics', 'estadisticas', 'metricas', 'tab'],
      group: 'Navegación',
      action: () => { switchTab('tab-analytics'); },
    },
    {
      id: 'nav-tab-proyectos',
      label: 'Ir a Proyectos',
      icon: '📁',
      keywords: ['proyectos', 'dashboard', 'tab'],
      group: 'Navegación',
      action: () => { switchTab('tab-proyectos'); },
    },
    {
      // T-202605-067: nav al tab Sprint — reemplaza sub-tab Plan eliminado
      id: 'nav-tab-sprint',
      label: 'Ir a Sprint',
      icon: '🏃',
      keywords: ['sprint', 'tab', 'plan', 'activo', 'burndown'],
      group: 'Navegación',
      action: () => { switchTab('tab-sprint'); },
    },
    {
      id: 'nav-radar',
      label: 'Abrir Radar',
      icon: '📡',
      keywords: ['radar', 'sidebar', 'panel', 'global'],
      group: 'Navegación',
      action: () => { toggleRadarSidebar(); },
    },
  ];

  const actions = [
    {
      id: 'action-new-session',
      label: 'Nueva sesión rápida',
      icon: '⚡',
      keywords: ['nueva', 'sesion', 'quick', 'capture', 'rapida'],
      group: 'Acciones',
      action: () => { openQuickCapture(); },
    },
    {
      id: 'action-new-item',
      label: 'Nuevo ítem de backlog',
      icon: '➕',
      keywords: ['nuevo', 'item', 'backlog', 'ticket', 'agregar'],
      group: 'Acciones',
      action: () => {
        switchTab('tab-backlog');
        setTimeout(() => { openItemEditor(null); }, 150);
      },
    },
    {
      id: 'action-standalone-checkpoint',
      label: 'Checkpoint standalone',
      icon: '📋',
      keywords: ['checkpoint', 'standalone', 'paste', 'importar'],
      group: 'Acciones',
      action: () => { openStandaloneCheckpoint(); },
    },
    {
      id: 'action-toggle-theme',
      label: 'Cambiar tema claro/oscuro',
      icon: '🌓',
      keywords: ['tema', 'theme', 'claro', 'oscuro', 'dark', 'light'],
      group: 'Acciones',
      action: () => { toggleTheme(); },
    },
    {
      id: 'action-close-sprint',
      label: 'Cerrar sprint activo',
      icon: '🏁',
      keywords: ['cerrar', 'sprint', 'close', 'activo'],
      group: 'Acciones',
      action: () => {
        // B-202605-026: filtrar por status === 'active' — getActiveSprints() retorna todos los sprints del proyecto
          const allSprints = getActiveSprints();
          const active = allSprints.filter(s => s.status === 'active');
          if (active.length > 0) confirmCloseSprint(active[0].id);
          else _cpShowToast('No hay sprint activo para cerrar');
      },
    },
    {
      id: 'action-export-backlog',
      label: 'Exportar backlog',
      icon: '📤',
      keywords: ['exportar', 'backlog', 'export', 'descargar'],
      group: 'Acciones',
      action: () => { exportBacklogMd(); },
    },
    {
      id: 'action-open-doc-log',
      label: 'Ver historial de documentos',
      icon: '📜',
      keywords: ['log', 'historial', 'documentos', 'doc'],
      group: 'Acciones',
      action: () => { openDocLog(); },
    },
    {
      id: 'action-quick-note',
      label: 'Nueva nota rápida',
      icon: '📝',
      keywords: ['nota', 'quick', 'note', 'rapida', 'nueva'],
      group: 'Acciones',
      action: () => { if (typeof openQuickNote === 'function') openQuickNote(); },
    },
    // T-202605-449/451: templates de ítems desde command palette
    {
      id: 'action-use-template',
      label: 'Usar template de ítem',
      icon: '⬡',
      keywords: ['template', 'plantilla', 'predefinido', 'item', 'usar'],
      group: 'Acciones',
      action: () => {
        switchTab('tab-backlog');
        setTimeout(() => {
          openItemEditor(null);
          setTimeout(() => { openTemplatePicker(); }, 120);
        }, 150);
      },
    },
    // B-243: acción para buscar en contexto del proyecto
    {
      id: 'action-search-context',
      label: 'Buscar en contexto',
      icon: '🔍',
      keywords: ['buscar', 'contexto', 'context', 'search', 'proyecto'],
      group: 'Acciones',
      action: () => {
        switchTab('tab-backlog');
        setTimeout(() => { switchSubTab('context'); }, 80);
      },
    },
    // AC-3 R-202604-084: acción cambiar proyecto activo
    {
      id: 'action-switch-project',
      label: 'Cambiar proyecto activo',
      icon: '📁',
      keywords: ['cambiar', 'proyecto', 'switch', 'project', 'activo', 'filtro'],
      group: 'Acciones',
      action: () => {
        switchTab('tab-proyectos');
        setTimeout(() => { openProjPanel(); }, 150);
      },
    },
    // [pendiente-ID]: Panel de pendientes — trigger via Command Palette
    {
      id: 'action-open-pend-panel',
      label: 'Ver pendientes',
      icon: '⏳',
      keywords: ['pendientes', 'pend', 'panel', 'ver', 'pendiente'],
      group: 'Acciones',
      action: () => { openPendPanel(); },
    },
    {
      id: 'shortcuts-ref',
      label: 'Ver atajos de teclado',
      icon: '⌨️',
      keywords: ['atajos', 'shortcuts', 'teclado', 'keyboard', 'ver'],
      group: 'Acciones',
      action: () => { openShortcutsRef(); },
    },
    {
      id: 'search-global',
      label: 'Buscar…',
      icon: '🔍',
      keywords: ['buscar', 'search', 'global', 'find'],
      group: 'Acciones',
      action: () => {
        const si = document.getElementById('search-global');
        if (si) { si.focus(); si.select(); }
      },
    },
  ];

  return [...nav, ...actions];
}

/* ────────────────────────────────────────────────────────────────
   DYNAMIC COMMANDS — proyectos e ítems desde state
──────────────────────────────────────────────────────────────────*/

function _buildDynamicCommands(query) {
  const cmds = [];
  if (!query || query.length < 2) return cmds;

  // B-242: acciones dinámicas por IA activa — 'Nueva sesión con [nombre IA]'
  if (typeof state !== 'undefined' && state.ais) {
    state.ais.filter(ai => !ai.archived).forEach(ai => {
      const label = `Nueva sesión con ${ai.name}`;
      if (_fuzzyMatch(ai.name, query) || _fuzzyMatch(label, query) || _fuzzyMatch('nueva sesion', query)) {
        cmds.push({
          id: `ai-new-sess-${ai.id}`,
          label,
          icon: '⚡',
          keywords: ['nueva', 'sesion', ai.name.toLowerCase(), ai.id],
          group: 'Acciones',
          action: () => {
            switchTab('tab-tracker');
            setTimeout(() => {
              const card = document.getElementById('card-' + ai.id);
              if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              const ta = document.getElementById('ta-' + ai.id);
              if (ta) ta.focus();
            }, 120);
          },
        });
      }
    });
  }

  // Proyectos
  if (getActiveProject() !== null || getState() !== null) {
    const projects = (getState() && getState().projects) ? getState().projects : [];
    projects.filter(p => p.status !== 'archived').forEach(p => {
      const label = p.name || '';
      if (_fuzzyMatch(label, query) || _fuzzyMatch(p.id, query)) {
        cmds.push({
          id: `proj-${p.id}`,
          label: `Proyecto: ${label}`,
          icon: p.icon || '📁',
          keywords: [label.toLowerCase(), p.id],
          group: 'Proyectos',
          action: () => {
            selectProjectFilter(p.id);
            switchTab('tab-proyectos');
          },
        });
      }
    });
  }

  // Ítems del backlog por código (ej: "T-419", "R-082")
  const codePattern = /^[PTRB]-?\d{3,}$/i;
  if (codePattern.test(query.trim())) {
    const items = _getAllBacklogItems();
    const q = query.trim().toUpperCase().replace('-', '');
    items.forEach(item => {
      const code = (item.code || '').toUpperCase().replace('-', '');
      if (code.includes(q)) {
        cmds.push({
          id: `item-${item.code}`,
          label: `${item.code}: ${item.title || item.desc || ''}`.slice(0, 60),
          icon: _itemTypeIcon(item.type),
          keywords: [item.code, (item.title || item.desc || '').toLowerCase()],
          group: 'Ítems',
          action: () => {
            navigateToItem(item.code);
          },
        });
      }
    });
  }

  // Sesiones — búsqueda por título o resumen
  if (query.trim().length >= 2 && typeof state !== 'undefined') {
    const q = query.trim().toLowerCase();
    const allSessions = [];
    (state.projects || []).forEach(proj => {
      (proj.sessions || []).forEach(s => {
        if (
          (s.title || '').toLowerCase().includes(q) ||
          (s.summary || '').toLowerCase().includes(q)
        ) {
          const ai = (state.ais || []).find(a => a.id === s.aiId);
          allSessions.push({ s, ai });
        }
      });
    });
    allSessions
      .sort((a, b) => parseInt(b.s.id || 0) - parseInt(a.s.id || 0))
      .slice(0, 6)
      .forEach(({ s, ai }) => {
        cmds.push({
          id: 'sess-' + s.id,
          label: s.title || '(sin título)',
          icon: '📄',
          keywords: [],
          group: 'Sesiones',
          action: () => {
            if (ai) openDetail(ai.id, s.id);
          },
        });
      });
  }

  return cmds;
}

function _getAllBacklogItems() {
  try {
    const proj = getActiveProject();
    const key = proj ? `backlog-items-${proj.id}` : 'backlog-items';
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// B-243: busca en el contexto raw del proyecto activo y devuelve resultados agrupados en 'Contexto'
function _cpSearchContext(query) {
  if (!query || query.length < 2) return [];
  try {
    const projId = _getActiveProjectFilter();
    const key = projId ? `context-raw-${projId}` : 'context-raw';
    const raw = localStorage.getItem(key) || '';
    if (!raw) return [];

    const cmds = [];
    const lines = raw.split('\n');
    let currentSection = '';
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    lines.forEach(line => {
      if (/^## /.test(line)) {
        currentSection = line.replace(/^## /, '').trim();
      } else {
        const norm = line.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (norm.includes(q)) {
          const snippet = line.trim().slice(0, 80);
          const sectionTitle = currentSection || 'Contexto';
          cmds.push({
            id: `ctx-${currentSection}-${cmds.length}`,
            label: snippet || sectionTitle,
            icon: '📄',
            keywords: [],
            group: 'Contexto',
            sub: currentSection,
            action: () => {
              switchTab('tab-backlog');
              setTimeout(() => {
                switchSubTab('context');
              }, 80);
            },
          });
        }
      }
    });

    // Máximo 4 resultados de contexto para no saturar
    return cmds.slice(0, 4);
  } catch {
    return [];
  }
}

function _itemTypeIcon(type) {
  const icons = { P: '💡', T: '🎫', R: '📦', B: '🐛' };
  return icons[type] || '•';
}

/* ────────────────────────────────────────────────────────────────
   FUZZY MATCH
──────────────────────────────────────────────────────────────────*/

function _fuzzyMatch(str, query) {
  if (!str || !query) return false;
  const s = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes(q)) return true;
  // char-by-char fuzzy
  let si = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const found = s.indexOf(q[qi], si);
    if (found === -1) return false;
    si = found + 1;
  }
  return true;
}

function _fuzzyScore(str, query) {
  if (!str || !query) return 0;
  const s = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.startsWith(q)) return 100;
  if (s.includes(q)) return 80;
  return 50;
}

/* ────────────────────────────────────────────────────────────────
   RECENT COMMANDS
──────────────────────────────────────────────────────────────────*/

function _loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(CP_RECENT_KEY) || '[]');
  } catch { return []; }
}

function _saveRecent(cmdId) {
  const recent = _loadRecent().filter(id => id !== cmdId);
  recent.unshift(cmdId);
  localStorage.setItem(CP_RECENT_KEY, JSON.stringify(recent.slice(0, CP_RECENT_MAX)));
}

/* ────────────────────────────────────────────────────────────────
   STATE
──────────────────────────────────────────────────────────────────*/

const _cp = {
  open: false,
  query: '',
  results: [],
  selectedIdx: 0,
  registry: [],
};

/* ────────────────────────────────────────────────────────────────
   DOM HELPERS
──────────────────────────────────────────────────────────────────*/

function _el(id) { return document.getElementById(id); }

function _cpInput()       { return _el('cp-input'); }    // ID canónico en index.html
function _cpList()        { return _el('cp-body'); }      // ID canónico en index.html
function _cpOverlay()     { return _el('cp-overlay'); }  // ID canónico en index.html
function _cpRecent()      { return _el('cp-recent'); }   // no existe en HTML canónico — guards en uso

/* ────────────────────────────────────────────────────────────────
   OPEN / CLOSE
──────────────────────────────────────────────────────────────────*/

export function openCommandPalette() {
  if (_cp.open) return;
  _cp.open = true;
  _cp.query = '';
  _cp.selectedIdx = 0;
  _cp.registry = _buildCommandRegistry();

  const overlay = _cpOverlay();
  if (!overlay) return;

  overlay.classList.remove('is-hidden');
  document.body.classList.add('cp-body-lock');

  const input = _cpInput();
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 30);
  }

  _cpRenderRecent();
  _cpRenderResults([]);
}

function closeCommandPalette() {
  if (!_cp.open) return;
  _cp.open = false;

  const overlay = _cpOverlay();
  if (overlay) overlay.classList.add('is-hidden');
  document.body.classList.remove('cp-body-lock');
}

/* ────────────────────────────────────────────────────────────────
   SEARCH & RENDER
──────────────────────────────────────────────────────────────────*/

function _cpSearch(query) {
  _cp.query = query;
  _cp.selectedIdx = 0;

  if (!query.trim()) {
    _cpRenderRecent();
    _cpRenderResults([]);
    return;
  }

  // Static commands
  const staticMatches = _cp.registry
    .filter(cmd => {
      return _fuzzyMatch(cmd.label, query) ||
        cmd.keywords.some(k => _fuzzyMatch(k, query));
    })
    .map(cmd => ({ ...cmd, _score: _fuzzyScore(cmd.label, query) }))
    .sort((a, b) => b._score - a._score);

  // Dynamic commands (proyectos + ítems + IAs)
  const dynamicMatches = _buildDynamicCommands(query);

  // B-243: búsqueda en contexto del proyecto activo
  const contextMatches = _cpSearchContext(query);

  const all = [...staticMatches, ...dynamicMatches, ...contextMatches].slice(0, 12);
  _cp.results = all;

  // Hide recent when searching
  const recentEl = _cpRecent();
  if (recentEl) recentEl.classList.add('cp-hidden');

  _cpRenderResults(all);
}

function _cpRenderRecent() {
  const recentEl = _cpRecent();
  if (!recentEl) return;
  const recentIds = _loadRecent();
  if (recentIds.length === 0) {
    recentEl.classList.add('cp-hidden');
    return;
  }
  recentEl.classList.remove('cp-hidden');
  const all = _buildCommandRegistry();
  const recentCmds = recentIds
    .map(id => all.find(c => c.id === id))
    .filter(Boolean);

  recentEl.innerHTML = `
    <div class="cp-section-label">Recientes</div>
    ${recentCmds.map((cmd, i) => _cpItemHtml(cmd, i, true)).join('')}
  `;
}

function _cpRenderResults(results) {
  const list = _cpList();
  if (!list) return;

  if (results.length === 0 && _cp.query.trim()) {
    list.innerHTML = `<div class="cp-empty">Sin resultados para "<strong>${_escHtml(_cp.query)}</strong>"</div>`;
    return;
  }

  if (results.length === 0) {
    list.innerHTML = '';
    return;
  }

  // Group by group
  const groups = {};
  results.forEach((cmd, i) => {
    const g = cmd.group || 'General';
    if (!groups[g]) groups[g] = [];
    groups[g].push({ cmd, i });
  });

  let html = '';
  Object.entries(groups).forEach(([group, items]) => {
    html += `<div class="cp-section-label">${_escHtml(group)}</div>`;
    items.forEach(({ cmd, i }) => {
      html += _cpItemHtml(cmd, i, false);
    });
  });

  list.innerHTML = html;
  _cpHighlight();
}

function _cpItemHtml(cmd, idx, isRecent) {
  return `
    <div class="cp-item${isRecent ? ' cp-item-recent' : ''}" 
         data-idx="${idx}" 
         data-cmd-id="${_escHtml(cmd.id)}"
         role="option"
         aria-selected="false">
      <span class="cp-item-icon">${cmd.icon || '•'}</span>
      <span class="cp-item-label">${_escHtml(cmd.label)}${cmd.sub ? `<span class="cp-item-sub"> · ${_escHtml(cmd.sub)}</span>` : ''}</span>
      ${isRecent ? '<span class="cp-item-badge">reciente</span>' : ''}
    </div>
  `;
}

function _cpHighlight() {
  const list = _cpList();
  if (!list) return;
  const items = list.querySelectorAll('.cp-item:not(.cp-item-recent)');
  items.forEach((el, i) => {
    el.classList.toggle('cp-item-selected', i === _cp.selectedIdx);
    el.setAttribute('aria-selected', i === _cp.selectedIdx ? 'true' : 'false');
  });
  // Scroll selected into view
  const sel = list.querySelector('.cp-item-selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

/* ────────────────────────────────────────────────────────────────
   EXECUTE
──────────────────────────────────────────────────────────────────*/

function _cpExecute(cmd) {
  if (!cmd) return;
  _saveRecent(cmd.id);
  closeCommandPalette();
  try {
    cmd.action();
  } catch (e) {
    console.error('[CP] Error ejecutando comando:', cmd.id, e);
  }
}

function _cpExecuteSelected() {
  if (_cp.results.length === 0) return;
  const cmd = _cp.results[_cp.selectedIdx];
  if (cmd) _cpExecute(cmd);
}

function _cpExecuteRecentByEl(el) {
  const cmdId = el.dataset.cmdId;
  if (!cmdId) return;
  const all = _buildCommandRegistry();
  const cmd = all.find(c => c.id === cmdId);
  if (cmd) _cpExecute(cmd);
}

/* ────────────────────────────────────────────────────────────────
   KEYBOARD NAVIGATION
──────────────────────────────────────────────────────────────────*/

function _cpKeydown(e) {
  if (!_cp.open) return;

  switch (e.key) {
    case 'Escape':
      e.stopPropagation();
      closeCommandPalette();
      break;

    case 'ArrowDown':
      e.preventDefault();
      _cp.selectedIdx = Math.min(_cp.selectedIdx + 1, _cp.results.length - 1);
      _cpHighlight();
      break;

    case 'ArrowUp':
      e.preventDefault();
      _cp.selectedIdx = Math.max(_cp.selectedIdx - 1, 0);
      _cpHighlight();
      break;

    case 'Enter':
      e.preventDefault();
      _cpExecuteSelected();
      break;

    case 'Tab':
      e.preventDefault();
      if (e.shiftKey) {
        _cp.selectedIdx = Math.max(_cp.selectedIdx - 1, 0);
      } else {
        _cp.selectedIdx = Math.min(_cp.selectedIdx + 1, _cp.results.length - 1);
      }
      _cpHighlight();
      break;
  }
}

/* ────────────────────────────────────────────────────────────────
   GLOBAL KEYDOWN — Cmd+K / Ctrl+K
──────────────────────────────────────────────────────────────────*/

function _cpGlobalKeydown(e) {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const modifier = isMac ? e.metaKey : e.ctrlKey;

  if (modifier && e.key === 'k') {
    // B-202605-032: stopPropagation antes de preventDefault — impide que otros listeners
    // en la misma fase bubble reciban el evento, pero permite que este handler sea el único.
    // Registrado en bubble (no capture) para no bloquear listeners de capture de SP.
    e.stopPropagation();
    e.preventDefault();
    if (_cp.open) {
      closeCommandPalette();
    } else {
      openCommandPalette();
    }
    return;
  }

  // Delegate to palette keydown if open
  if (_cp.open) _cpKeydown(e);
}

/* ────────────────────────────────────────────────────────────────
   CLICK HANDLERS
──────────────────────────────────────────────────────────────────*/

function _cpOnOverlayClick(e) {
  if (e.target === _cpOverlay()) closeCommandPalette();
}

function _cpOnListClick(e) {
  const item = e.target.closest('.cp-item');
  if (!item) return;

  if (item.classList.contains('cp-item-recent')) {
    _cpExecuteRecentByEl(item);
    return;
  }

  const idx = parseInt(item.dataset.idx, 10);
  if (!isNaN(idx) && _cp.results[idx]) {
    _cp.selectedIdx = idx;
    _cpExecuteSelected();
  }
}

function _cpOnListMouseover(e) {
  const item = e.target.closest('.cp-item:not(.cp-item-recent)');
  if (!item) return;
  const idx = parseInt(item.dataset.idx, 10);
  if (!isNaN(idx)) {
    _cp.selectedIdx = idx;
    _cpHighlight();
  }
}

/* ────────────────────────────────────────────────────────────────
   TOAST (fallback simple)
──────────────────────────────────────────────────────────────────*/

function _cpShowToast(msg) {
  showToast('info', msg);
}

/* ────────────────────────────────────────────────────────────────
   UTILS
──────────────────────────────────────────────────────────────────*/

function _escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ────────────────────────────────────────────────────────────────
   INIT — llamar una vez tras DOMContentLoaded
──────────────────────────────────────────────────────────────────*/

export function initCommandPalette() {
  // Global Cmd+K listener
  // B-202605-032: registrado en fase bubble (false) — SP listener también en bubble puede ejecutar.
  // stopPropagation en el handler evita conflicto con otros listeners bubble en el mismo evento.
  document.addEventListener('keydown', _cpGlobalKeydown, false);

  // Overlay click to close
  const overlay = _cpOverlay();
  if (overlay) overlay.addEventListener('click', _cpOnOverlayClick);

  // Input search
  const input = _cpInput();
  if (input) {
    input.addEventListener('input', e => _cpSearch(e.target.value));
    // Prevent Esc from bubbling to _escCascade — _cpGlobalKeydown delegates to _cpKeydown which closes
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); closeCommandPalette(); }
    });
  }

  // Results list interaction
  const list = _cpList();
  if (list) {
    list.addEventListener('click', _cpOnListClick);
    list.addEventListener('mouseover', _cpOnListMouseover);
  }

  // Recent list interaction
  const recent = _cpRecent();
  if (recent) {
    recent.addEventListener('click', e => {
      const item = e.target.closest('.cp-item-recent');
      if (item) _cpExecuteRecentByEl(item);
    });
  }
}

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
