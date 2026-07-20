// [PP] mod:62 · autor:Rune · 2026-07-19 15:00 UTC-6
// INC-PP-export-confirm-dead-shell: removido handler muerto de export-confirm-cancel-btn/
//   export-confirm-overlay — ambos retirados de index.html en REQ CAEL-0720-01 TKT2, el listener
//   nunca se adjuntaba (getElementById siempre null). Limpieza en el mismo INC que migra
//   _showExportConfirmModal (locus-backlog-generator.js) al shell reemplazante #gconfirm-overlay.
// [PP] mod:61 · autor:Rune · 2026-07-19 00:00 UTC-6
// INC-PP-openProjPanel: breadcrumb-proj usaba openProjPanel() directo (ReferenceError) — migrado a dispatch shell:open-proj-panel, mismo patrón de T-202606-167
// TKT1 (REQ-CAEL-0717-01): _renderInfraCurrentValue() agregada — lee getInfraVersionData()
// (import agregado desde locus-storage.js) y puebla #hdr-menu-infra-current-value al abrir
// el modal via openInfraSync(). Sin dato → 'sin sincronizar en esta sesión', nunca vacío ni
// 'undefined'. applyBtn ahora dispara 'shell:render-statusbar' tras aplicar (TKT2 — refresco
// del footer sin recargar, mismo patrón que locus-sesiones.js/locus-sesiones-utils.js).
// [PP] mod:59 · autor:Rune · 2026-07-17 12:40 UTC-6
// TKT2 (REQ CAEL-01, ref_id CAEL-03): switchTab() resetea currentSubTab a un sub-tab válido
// del tab destino ('backlog'|'proyectos') si el sub-tab activo pertenece al otro contexto —
// currentSubTab es variable compartida entre ambos tabs desde que Proyectos adoptó el mismo
// sistema de sub-tabs en TKT1.
// [PP] mod:56 · autor:Rune · 2026-07-15 12:40 UTC-6
// TKT1 (REQ CAEL-01, ref_id CAEL-02) — AC agregado por gap detectado en auditoría propia:
// switchSubTab() ahora sincroniza aria-selected junto con el toggle de .active, solo para
// botones con role="tab" (guard evita tocar sstab-btn-* que no son parte de un tablist ARIA).
// [PP] mod:55 · autor:Rune · 2026-07-15 12:30 UTC-6
// TKT1 (REQ CAEL-01, ref_id CAEL-02) — bugfix detectado en revisión propia antes de re-entrega:
// switchSubTab() no incluía 'docupdates' en el array de toggle .active — el sub-tab DOC-UPDATEs
// migrado en este mismo TKT (AC-8) nunca recibía .active en botón ni panel al seleccionarse.
// _updateSubTabButtons() en locus-docs.js sí gestionaba render/visibilidad de 'docupdates'
// correctamente — el hueco estaba solo en este array de este archivo.
// [PP] mod:54 · autor:Rune · 2026-07-14 20:45 UTC-6
// TKT1/CAEL-XX + INC-[pendiente-ID] (/ shadowed): ver CHECKPOINT de sesión — atajos de teclado.
// REQ CAEL-búsqueda-tipos, TKT único: (1) icono de resultado por tipo ahora usa itemKind(item)
// en vez de code.charAt(0) (anti-pattern Gen1 ya documentado en module-contracts §4) — mapa
// _TYPE_ICONS con los 7 tipos Gen2. (2) onSearch() ahora combina getItems()+getIncidents() en
// typeMatches — INC/PRB/KE/CHG buscables por código, título y comportamiento_actual, antes
// solo REQ/TKT/DISC. (3) Grupo "🗃 Ítems" (renombrado de "Backlog") movido al inicio de la
// jerarquía de render — siempre primero, antes de IAs/Sesiones/Contratos/Proyectos/Contexto.
// Helper _isDiscardedItem() unifica el criterio de descarte entre status (REQ/TKT/DISC/CHG) e
// incident_status (INC/PRB/KE) — excepción de vocabulario de CHG ya documentada en
// __BR-Ecosystem §4b.
// [PP] mod:49 · autor:Rune · 2026-07-14 16:00 UTC-6
// INC — fix: handler 'openDetail' del delegador data-action (línea ~1189) llamaba a
// openDetail() como global directo, sin definirla ni importarla — ReferenceError en cada
// click. openDetail() vive en locus-session-popup.js (confirmado en código real). Reemplazado
// por import() dinámico, mismo patrón que 'navigateToCard'/'navigateToItem' en el mismo
// delegador — necesario porque locus-session-popup.js importa switchTab/switchSubTab/esc/
// getCurrentTab de este módulo, un import estático crearía ciclo ESM.
// [PP] mod:48 · autor:Rune · 2026-07-14 UTC-6
// Deprecación Command Palette (cont.): removidos import de openCommandPalette/closeCommandPalette,
// el check de cp-overlay en _escCascade, el wiring hdr-search-trigger→openCommandPalette y el
// wiring cp-overlay click-outside. locus-command-palette.js eliminado del proyecto.
// TKT1 (REQ CAEL-04): navigateToItem() reubicada a locus-item-navigator.js. Este archivo no
// la importaba estáticamente (2 call sites bare, L879/L1176) — reemplazados por import()
// dinámico (patrón (b) ya documentado en este header) en vez de import estático, para evitar
// ciclo ESM: locus-item-navigator.js importa switchTab/switchSubTab de este mismo módulo.
// [PP] mod:44 · autor:Rune · 2026-07-13 UTC-6
// TKT1 (REQ CAEL-01): switchSubTab() cierra #item-detail-panel si está .open, antes de
// aplicar el cambio de sub-tab — mismo patrón (event dispatch 'shell:close-item-panel')
// ya usado en switchTab() (B-202605-207). No toca switchTab ni ningún otro handler.
// [PP] mod:43 · autor:Rune · 2026-07-11 22:45 UTC-6
// TKT2 (REQ CAEL-01): switchTab agrega caso 'incidentes' (dispatch shell:render-qinc) —
// switchSubTab pierde el bloque/entrada 'qinc', sub-tab eliminado (ver index.html mod:112).
// INC-[pendiente-ID]: closeItemEditor agregado al import de locus-backlog-editor.js — la
// función existe y está exportada ahí, pero el import previo no la incluía. Invocada sin
// import en dos handlers de este archivo (~L1357, ~L1363), causando ReferenceError en runtime.
// [PP] mod:41 · autor:Rune · 2026-07-07 UTC-6
// INC-[pendiente-ID] (deprecación Sesiones/Pulso, founder confirmó): eliminados import de
// closeArranquePanel y sus dos listeners (#arranque-btn-ver-todo, #arranque-close-btn) —
// Sesión de Arranque deprecada. #arranque-cta-btn no tenía listener en este archivo (vivía
// en locus-sesiones-arranque.js, ya borrado). Segunda pasada de verificación (grep -i "pulso"
// completo del archivo, no solo por nombre de función) encontró una entrada más no capturada
// en la primera pasada: _escCascade() dispatchaba 'shell:close-pulso-panel' al detectar
// #pulso-panel visible — eliminada. No había entrada equivalente para #arranque-overlay en
// este array (su Escape handler vivía dentro de locus-sesiones-arranque.js, ya borrado).
// TKT1 (limpieza post-rename): comentario en L207 actualizado — locus-backlog-archive.js → locus-backlog-historico.js. Sin cambio de código.
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

import { _saveUserPrefs, _shortcutsLoad, _shortcutsSave, getAllSessions, getState, save, _getActiveProjectFilter, _parseInfraLine, setInfraVersionData, getInfraVersionData, _docPrefix, handleSyncPillClick } from './locus-storage.js';
import { _openItemEditorSafe, onBacklogSortChange, toggleDepsFilter, toggleSortDir, itemKind, getIncidents } from './locus-backlog-core.js';
import { openPendPanel, closePendPanel } from './locus-pend.js';
import { confirmItemEditor, closeItemEditor } from './locus-backlog-editor.js';
import { _mgExportAllZip } from './locus-map-generator.js';
import { closeImportDiff, confirmImport, downloadGlobalReport, exportData, importData, openCleanProjectModal } from './locus-reports.js';
import { openChangelog } from './locus-session-save.js';
import { searchContratos } from './locus-contracts.js';
import { toggleContextSection, _dropzoneHandle } from './locus-docs.js'; // T-202606-089 AC-3 — ciclo seguro: uso solo dentro de handler

// ── Global utility ────────────────────────────────────────────────────────
// esc() usada por múltiples módulos (backlog, session, toast, checkpoint)
// Vive aquí porque locus-ui-shell.js carga primero

export function esc(s) { return s ? (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

// ── Sub-tab state ──────────────────────────────────────────────────────────
var currentSubTab = 'backlog'; // ESM-B: var para evitar TDZ en ciclo ui-shell ↔ docs

// ── Tab switching ──────────────────────────────────────────────────────────

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
  // R-202605-067 + INC-guard-texto-sin-guardar: guard reconectado a #ingest-ta (CAEL-22) —
  // los selectores .note-ta/.ai-card/data-dirty y _trackerTextareaDirty quedaron muertos
  // desde la unificación del ingest a un único textarea global. Lectura directa de DOM,
  // sin import nuevo — _isDirty ahora refleja contenido real sin guardar.
  const _ingestTa = document.getElementById('ingest-ta');
  const _isDirty = !!(_ingestTa && _ingestTa.value.trim());
  if (_isDirty) {
    const _proceed = window.confirm('Hay texto sin guardar. ¿Salir de todos modos?');
    if (!_proceed) {
      _ingestTa.focus();
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
  // TKT2 (REQ CAEL-01, ref_id CAEL-03): currentSubTab es compartida entre tab-proyectos y
  // tab-backlog (ambos usan switchSubTab/getCurrentSubTab) — sin este reset, navegar desde
  // Proyectos→Context a Backlog dejaba currentSubTab='context', un sub-tab inexistente en Backlog.
  const _backlogSubs = ['backlog', 'qbacklog', 'qdisc', 'historico'];
  const _proyectosSubs = ['htmlmap', 'context', 'docupdates', 'contratos'];
  if (tab === 'backlog' && !_backlogSubs.includes(currentSubTab)) currentSubTab = 'backlog';
  if (tab === 'proyectos' && !_proyectosSubs.includes(currentSubTab)) currentSubTab = 'htmlmap';

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
  } else if (tab === 'incidentes') {
    // TKT2 (REQ CAEL-01): dispatch movido aquí desde switchSubTab('qinc') —
    // mismo evento 'shell:render-qinc' que locus-backlog-render.js ya escucha, sin cambio de render.
    window.dispatchEvent(new CustomEvent('shell:render-qinc'));
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
  // TKT1 (REQ CAEL-01): cerrar panel de detalle al cambiar de sub-tab —
  // mismo patrón que B-202605-207 en switchTab(), extendido a sub-tab.
  // (a) event dispatch — locus-backlog-panel.js escucha 'shell:close-item-panel'
  const _itemPanel = document.getElementById('item-detail-panel');
  if (_itemPanel && _itemPanel.classList.contains('open')) {
    window.dispatchEvent(new CustomEvent('shell:close-item-panel'));
  }
  currentSubTab = sub;
  // INC-[pendiente-ID]: 'docupdates' faltaba en este array — sub-tab migrado en TKT1
  // (REQ CAEL-01, AC-8) nunca recibía .active en botón/panel al seleccionarse, pese a
  // que _updateSubTabButtons() en locus-docs.js sí lo trata (L157/L168/L176).
  ['backlog','qbacklog','qdisc','htmlmap','context','plan','docupdates','contratos','historico'].forEach(s => {
    const btn = document.getElementById('sstab-btn-' + s);
    const panel = document.getElementById('sspanel-' + s);
    if (btn) {
      btn.classList.toggle('active', s === sub);
      if (btn.getAttribute('role') === 'tab') btn.setAttribute('aria-selected', s === sub ? 'true' : 'false');
    }
    if (panel) panel.classList.toggle('active', s === sub);
  });
  // (a) event dispatch — locus-docs.js escucha 'shell:update-subtab-buttons'
  window.dispatchEvent(new CustomEvent('shell:update-subtab-buttons', { detail: { sub } }));
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
  if (sub === 'qbacklog') {
    // INC-[pendiente-ID]: 'q-backlog' → 'qbacklog' — alineado con IDs reales de index.html
    // (sstab-btn-qbacklog / sspanel-qbacklog) y con locus-backlog-render.js (renderQBacklogPanel).
    window.dispatchEvent(new CustomEvent('shell:render-qbacklog'));
  }
  if (sub === 'qdisc') {
    // INC-[pendiente-ID]: 'q-disc' → 'qdisc' — alineado con IDs reales de index.html
    // (sstab-btn-qdisc / sspanel-qdisc) y con locus-backlog-render.js (renderQDiscPanel).
    window.dispatchEvent(new CustomEvent('shell:render-qdisc'));
  }
  // TKT2 (REQ CAEL-01): bloque 'qinc' removido de aquí — sstab-btn-qinc/sspanel-qinc
  // ya no existen, Q-INC se activa vía switchTab('incidentes'), no switchSubTab('qinc').
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
    // (a) event dispatch — locus-backlog-historico.js escucha 'shell:render-historico'
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

// ── TKT-infra-sync-modal: handler de #infra-sync-overlay (reemplaza T-202606-009 — subpanel inline eliminado del DOM, ver TKT header en 3 zonas) ─────
// Acepta la línea completa BR (<!-- **infra_version: N** | BR-Core vX ... -->).
// Parsea con _parseInfraLine · guarda objeto completo con setInfraVersionData.
// TKT1 (REQ-CAEL-0717-01): renderiza el valor Actual del modal desde getInfraVersionData() —
// lectura en vivo en cada apertura, nunca vacío ni 'undefined' (AC edge case sin dato).
function _renderInfraCurrentValue() {
  const el = document.getElementById('hdr-menu-infra-current-value');
  if (!el) return;
  const data = getInfraVersionData();
  if (!data) {
    el.textContent = 'sin sincronizar en esta sesión';
    return;
  }
  const parts = ['infra_version: ' + data.infraVersion];
  const brParts = [];
  if (data.brCore) brParts.push('BR-Core v' + data.brCore);
  if (data.brEcosystem) brParts.push('BR-Ecosystem v' + data.brEcosystem);
  if (data.brExecution) brParts.push('BR-Execution v' + data.brExecution);
  if (data.obStrategy) brParts.push('OB-Strategy v' + data.obStrategy);
  if (brParts.length) parts.push(brParts.join(' · '));
  el.textContent = parts.join(' | ');
}

export function openInfraSync() {
  const overlay = document.getElementById('infra-sync-overlay');
  // INC — .modal-overlay base es display:none; solo .open fuerza display:flex.
  // 'is-hidden' tiene !important y bloquearía .open si quedara en el elemento
  // (ver limpieza de markup inicial en index.html — mismo patrón que #changelog-overlay).
  if (overlay) overlay.classList.add('open');
  // TKT1: valor Actual en vivo cada vez que se abre el modal.
  _renderInfraCurrentValue();
}

export function closeInfraSync() {
  const overlay = document.getElementById('infra-sync-overlay');
  if (overlay) overlay.classList.remove('open');
}

export function initInfraVersionHandler() {
  const openBtn   = document.getElementById('mm-btn-sync-infra');
  const overlay   = document.getElementById('infra-sync-overlay');
  const closeBtn  = document.getElementById('infra-sync-close-btn');
  const textarea  = document.getElementById('hdr-menu-infra-textarea');
  const applyBtn  = document.getElementById('hdr-menu-infra-apply');
  const errMsg    = document.getElementById('hdr-menu-infra-error');

  if (!openBtn || !overlay || !closeBtn || !textarea || !applyBtn || !errMsg) return;

  // Actualizar placeholder al formato de línea completa BR
  textarea.placeholder = '<!-- **infra_version: N** | BR-Core vX.Y · BR-Ecosystem vX.Y · BR-Execution vX.Y · OB-Strategy vX.Y -->';

  // Abrir modal — cierra el dropdown #more-menu al mismo tiempo (mismo patrón que mm-btn-notif)
  openBtn.addEventListener('click', function () {
    openInfraSync();
    toggleMoreMenu();
  });

  // Cerrar modal
  closeBtn.addEventListener('click', closeInfraSync);

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
    closeInfraSync();
    // TKT2: refresco del footer sin recargar — mismo patrón que locus-sesiones.js/locus-sesiones-utils.js.
    window.dispatchEvent(new CustomEvent('shell:render-statusbar'));
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

// REQ CAEL-búsqueda-tipos TKT1: descartado unificado — INC/PRB/KE usan incident_status,
// REQ/TKT/DISC/CHG usan status (CHG es excepción de vocabulario, __BR-Ecosystem §4b).
function _isDiscardedItem(item, kind) {
  if (kind === 'INC' || kind === 'PRB' || kind === 'KE') return item.incident_status === 'descartado';
  return item.status === 'descartado';
}

// REQ CAEL-búsqueda-tipos TKT1: icono canónico por tipo — itemKind(item), nunca code.charAt(0)
// (anti-pattern Gen1 documentado en _Locus-module-contracts §4). Colores/orden según
// __BR-Ecosystem §4 — tabla de tipos.
const _TYPE_ICONS = { REQ: '🔵', TKT: '🟢', DISC: '🟣', INC: '🔴', PRB: '🟠', KE: '🟡', CHG: '⚪' };

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

  // ── 3. REQ CAEL-búsqueda-tipos TKT1+TKT2: Ítems de backlog + incidentes coincidentes (Planeada + Reactiva) ──
  const _items = _getItemsFn();
  const _incidents = getIncidents();
  const typeMatches = [..._items, ..._incidents].filter(item => {
    const kind = itemKind(item);
    if (_isDiscardedItem(item, kind)) return false;
    const titleHit = (item.title || item.desc || '').toLowerCase().includes(q);
    const codeHit = (item.code || '').toLowerCase().includes(q);
    const acHit = (item.ac || []).some(a => (typeof a === 'string' ? a : (a.text || '')).toLowerCase().includes(q));
    const compHit = (item.comportamiento_actual || '').toLowerCase().includes(q);
    return titleHit || codeHit || acHit || compHit;
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

  const totalWithContratos = total + contratoMatches.length + typeMatches.length + projMatches.length + contextMatches.length;
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
  // INC CAEL-11 · fix: #grid pertenecía a un layout de cards que ya no existe (la app usa
  // tracker-3col/sidebar/tabs) — el guard cortaba en silencio después de ya haber escrito
  // countEl.textContent, dejando "N resultados" sin panel visible. Opción C (aprobada por
  // el founder): ancla al wrapper del input, dropdown posicionado vía CSS (locus-layout.css).
  const searchAnchor = document.getElementById('header-search-wrap');
  if (!searchAnchor) return;

  // B-202605-236: scope toggle label
  const scopeLabel = _activeProjId ? '\u{1F4C1} Proyecto activo' : '\u{1F310} Todos los proyectos';

  let html = '<div class="sur-inner">';

  // B-202605-236: control de scope visible en cabecera del panel
  html += `<div class="sur-scope-row"><button class="sur-scope-btn" id="search-scope-btn" data-action="toggleSearchScope">${scopeLabel}</button></div>`;

  // Grupo Tipos — REQ CAEL-búsqueda-tipos: unifica rama Planeada (REQ/TKT/DISC) + Reactiva
  // (INC/PRB/KE/CHG). Siempre primero en la jerarquía de render (TKT3).
  if (typeMatches.length) {
    const tSlice = typeMatches.slice(0, 25);
    const tMore = typeMatches.length - tSlice.length;
    html += `<div class="sur-group">
      <div class="sur-group-label">🗃 Ítems (${typeMatches.length})</div>
      <div class="sur-rows">`;
    tSlice.forEach(item => {
      const kind = itemKind(item);
      const icon = _TYPE_ICONS[kind] || '📌';
      const isTerminal = kind === 'KE' ? item.incident_status === 'resolved'
        : (kind === 'INC' || kind === 'PRB') ? item.incident_status === 'closed'
        : item.status === 'done';
      const statusLabel = isTerminal ? ' · ✓' : '';
      html += `<div class="sur-row" data-action="navigateToItem" data-item-code="${_esc(item.code)}">
        <span class="sur-row-icon">${icon}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(item.title || item.desc || item.code, q)}</span>
          <span class="sur-row-sub"><span class="sur-badge">${_esc(item.code)}</span>${statusLabel}</span>
        </div>
      </div>`;
    });
    if (tMore > 0) {
      html += `<div class="sur-more">+${tMore} ítem${tMore !== 1 ? 's' : ''} más — usa filtros de Backlog para explorar</div>`;
    }
    html += '</div></div>';
  }

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
  searchAnchor.insertAdjacentElement('beforeend', panel);
}

// ── SCB eliminado — REQ-[pendiente-ID] TKT1. Ver TKT3 para el dock que ocupa el slot. ──

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

  // T-202604-418: Shift+N → nuevo ítem
  if (e.shiftKey && e.key === 'N') {
    e.preventDefault();
    openItemEditor(null);
    return;
  }

  // INC-S-dead-code: S → abre el modal de ingesta del Worker activo, leyendo
  // dataset.aiId de #worker-header-ingest-btn (poblado en _populateWorkerHeader) y
  // simulando click sobre ese botón — ya wireado al delegador data-action="open-ingest"
  // en locus-sesiones.js. Sin import nuevo — evita el ciclo que module-contracts §3
  // ya documenta como anti-pattern para este módulo. Sin Worker activo, no ejecuta acción.
  if (_pressedKey === _sk('save-session')) {
    e.preventDefault();
    const _ingestBtn = document.getElementById('worker-header-ingest-btn');
    if (_ingestBtn && _ingestBtn.dataset.aiId) _ingestBtn.click();
    return;
  }

  // T-202604-418: F → toggle focus mode (deprecado — focus mode eliminado)

  // INC-[pendiente-ID]: los dos bloques que interceptaban '/' con foco directo a
  // #search-global (T-202604-420 y T-202604-418) quedan eliminados — shadowaban
  // permanentemente el bloque siguiente (_sk('search')), la implementación real
  // y configurable de "Búsqueda en tab activo" declarada en _SHORTCUT_DEFS. Con
  // la tecla default ('/') ambos bloques capturaban el evento primero y el bloque
  // de abajo nunca se alcanzaba — el comportamiento por default contradecía su
  // propio label en el panel de shortcuts.
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
      // TKT1 (REQ CAEL-04): navigateToItem() reubicada a locus-item-navigator.js. Este archivo
      // no la importaba estáticamente (llamada bare — dependía de wiring externo no verificable
      // en esta sesión). import() dinámico — patrón (b) ya documentado en el header de este
      // archivo — evita ciclo ESM, ya que locus-item-navigator.js importa switchTab/switchSubTab
      // de este mismo módulo.
      if (_code) import('./locus-item-navigator.js').then(m => m.navigateToItem(_code));
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
  // TKT1 (REQ CAEL-01, ciclo 2026-07-14): 5 atajos funcionales reales sin entrada en el panel —
  // fixed:true en los cinco. No se reescriben como configurables porque sus handlers (líneas
  // ~771/779/842/910 y _escCascade()) usan literales de tecla hardcodeados, no _sk() — declararlos
  // editables sin rewiring de handler produciría un override cosmético que no cambia el
  // comportamiento real, el mismo tipo de defecto que este TKT existe para cerrar, no repetir.
  { id: 'new-item',      label: 'Nuevo ítem',                     group: 'Acciones',   default: 'Shift+N',         chord: false, fixed: true },
  { id: 'focus-search',  label: 'Foco en búsqueda global',        group: 'Acciones',   default: 'Ctrl+F / Cmd+F',  chord: false, fixed: true },
  { id: 'open-shortcuts-ref', label: 'Abrir referencia de atajos', group: 'Acciones',  default: 'Cmd+? / Cmd+Shift+/', chord: false, fixed: true },
  { id: 'open-detail',   label: 'Abrir detalle de ítem seleccionado', group: 'Backlog', default: 'Enter',         chord: false, fixed: true },
  { id: 'close-cascade', label: 'Cerrar overlay activo',          group: 'Backlog',    default: 'Esc',             chord: false, fixed: true },
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
    // TKT2/REQ-CAEL-01: resetear confirm de "Restaurar defaults" — evita quedar
    // visible si el panel se cerró con el confirm abierto sin cancelar
    const _restoreConfirm = document.getElementById('shortcuts-restore-confirm');
    if (_restoreConfirm) _restoreConfirm.classList.remove('is-visible');
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

  // TKT1 (REQ CAEL-01) AC-6: navegación por flechas en cualquier [role="tablist"] —
  // roving focus entre [role="tab"] visibles (sin .is-hidden) del mismo contenedor.
  // Delegado a nivel documento — cubre tablists nuevos (Proyectos) y existentes (Sprint)
  // sin requerir listener por contenedor.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const active = document.activeElement;
    if (!active || active.getAttribute('role') !== 'tab') return;
    const tablist = active.closest('[role="tablist"]');
    if (!tablist) return;
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]')).filter(t => !t.classList.contains('is-hidden'));
    const idx = tabs.indexOf(active);
    if (idx === -1) return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  });

  // #more-menu-theme → toggleTheme()
  const themeBtn = document.getElementById('more-menu-theme');
  if (themeBtn) themeBtn.addEventListener('click', function () { toggleTheme(); });

  // REQ CAEL-12 · TKT1 (CAEL-13): #search-global → onSearchDispatch ya existente (línea 379).
  // onSearch()/onSearchDispatch() estaban implementados pero sin listener que los invocara
  // al escribir — gap real detectado en integración, no ambigüedad de AC.
  const searchInput = document.getElementById('search-global');
  const searchClearBtn = document.getElementById('search-global-clear');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      if (searchClearBtn) searchClearBtn.classList.toggle('is-hidden', !searchInput.value);
      onSearchDispatch();
    });
  }
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', function () {
      if (!searchInput) return;
      searchInput.value = '';
      searchClearBtn.classList.add('is-hidden');
      searchInput.focus();
      onSearchDispatch();
    });
  }

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

// ── B-202605-019: Listeners adicionales — event delegation data-action ──
// (arranque-btn-ver-todo eliminado — INC-[pendiente-ID], Sesión de Arranque deprecada)
// (scb-dismiss / scb-step-action eliminados — REQ-[pendiente-ID] TKT1, SCB removido)
document.addEventListener('DOMContentLoaded', function () {

  // Event delegation — data-action en sur-row (panel búsqueda) y shortcuts-body
  document.addEventListener('click', function (e) {
    const row = e.target.closest('[data-action]');
    if (!row) return;
    const action = row.dataset.action;
    if (action === 'navigateToCard') {
      const _aiId = row.dataset.aiId;
      import('./locus-sesiones-stats.js').then(function(m) { if (typeof m.navigateToCard === 'function') m.navigateToCard(_aiId); });
    } else if (action === 'openDetail') {
      const _aiId = row.dataset.aiId;
      const _sessId = row.dataset.sessId;
      import('./locus-session-popup.js').then(function(m) { if (typeof m.openDetail === 'function') m.openDetail(_aiId, _sessId); });
    } else if (action === 'contratoAction') {
      const idx = parseInt(row.dataset.contratoIdx, 10);
      if (typeof _surContratoActions !== 'undefined' && _surContratoActions[idx]) {
        _surContratoActions[idx]();
      }
    } else if (action === 'navigateToItem') {
      // TKT1 (REQ CAEL-04): mismo patrón que navigateToCard (línea anterior) — import() dinámico
      import('./locus-item-navigator.js').then(function(m) { m.navigateToItem(row.dataset.itemCode); });
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

  // breadcrumb-proj → shell:open-proj-panel (INC-PP-openProjPanel: openProjPanel() directo
  // no está importado en este módulo — importarlo crearía ciclo con locus-sprint-project.js,
  // que ya importa esc/switchTab/switchSubTab/getCurrentSubTab/getCurrentTab de este archivo.
  // Mismo patrón desacoplado que locus-backlog-render.js y locus-sesiones-capture.js — T-202606-167)
  const breadcrumbProj = document.getElementById('breadcrumb-proj');
  if (breadcrumbProj) breadcrumbProj.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('shell:open-proj-panel'));
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

  // btn-export-qinc — TKT3 (REQ CAEL-0720-05): toolbar estático #qinc-toolbar
  const btnExportQinc = document.getElementById('btn-export-qinc');
  if (btnExportQinc) btnExportQinc.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('shell:export-qinc'));
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

  // shortcuts-restore-btn — TKT2/REQ-CAEL-01: confirmación inline antes de ejecutar
  // (antes: ejecutaba restoreDefaultShortcuts() directo, sin paso de confirmación)
  const shortcutsRestoreBtn = document.getElementById('shortcuts-restore-btn');
  const shortcutsRestoreConfirm = document.getElementById('shortcuts-restore-confirm');
  if (shortcutsRestoreBtn) shortcutsRestoreBtn.addEventListener('click', function () {
    if (shortcutsRestoreConfirm) shortcutsRestoreConfirm.classList.add('is-visible');
  });
  const shortcutsRestoreConfirmAccept = document.getElementById('shortcuts-restore-confirm-accept');
  if (shortcutsRestoreConfirmAccept) shortcutsRestoreConfirmAccept.addEventListener('click', function () {
    restoreDefaultShortcuts();
    if (shortcutsRestoreConfirm) shortcutsRestoreConfirm.classList.remove('is-visible');
  });
  const shortcutsRestoreConfirmCancel = document.getElementById('shortcuts-restore-confirm-cancel');
  if (shortcutsRestoreConfirmCancel) shortcutsRestoreConfirmCancel.addEventListener('click', function () {
    if (shortcutsRestoreConfirm) shortcutsRestoreConfirm.classList.remove('is-visible');
  });

  // shortcuts-close-btn
  const shortcutsCloseBtn = document.getElementById('shortcuts-close-btn');
  if (shortcutsCloseBtn) shortcutsCloseBtn.addEventListener('click', function () {
    closeShortcuts();
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
