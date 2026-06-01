// [PP] v1.2.4 · sprint:PP-S-14 · mod:19 · autor:Rune · 2026-06-01 UTC-6
// locus-sprint-project.js
// Última actualización: 2026-05-19 UTC-6
// Módulo: Export de documentos (Backlog, Sprints, History) + gestión de proyectos
// Renombrado de ai-tracker-sprint-project.js
import { loadHtmlMap } from './locus-map-viewer.js';
import { _syncCleanProjectBtn } from './locus-reports.js';
import { _blogLog, _effectiveVersion, _offlineQueuePush, _tplKey, getActiveProject, getActiveSprints, getActiveTracker, getProjectSessions, getState, getSupabaseUserId, save } from './locus-storage.js';
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';


import { renderAnalytics } from './locus-analytics-render.js';

import { loadBacklog, renderStats, updateBacklogBanner, updateStatusFilterUI } from './locus-backlog-core.js';
import { closeQuickCapture } from './locus-sesiones-capture.js';

import { updateBacklogFooter } from './locus-backlog-item.js';

import { renderBacklogList } from './locus-backlog-render.js';

import { _renderTplProjBanner } from './locus-docs.js';


import { _gconfirmOpen, closeModal } from './locus-modals.js';

import { renderProyectos } from './locus-projects.js';

import { _updateHeaderProjectLabel } from './locus-sesiones-stats.js';

import { render } from './locus-sesiones.js';

import { closePopup } from './locus-session-popup.js';

import { showToast, showToastInline } from './locus-toast.js';

// ── Utilidades de módulo — T3.bis ─────────────────────────────────────────────
export function pad(n) { return String(n).padStart(2, '0'); }
export function _sprintNum(id) {
  if (!id) return null;
  const m = String(id).match(/S-(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

// T-202604-243: prefijo de documento vivo según proyecto activo — OL-CONTEXT §7
// R-202605-002: _PREFIX_MAP consumida desde locus-storage.js — sin declaración local
export function _docPrefix() {
  const proj = getActiveProject();
  if (!proj) return 'XX';
  if (proj.prefix) return proj.prefix;
  const name = proj.name || '';
  return _PREFIX_MAP[name] || (name.slice(0, 2).toUpperCase() || 'XX');
}

// R-1: _updateHeaderProjectLabel — definición canónica en checkpoint.js
// Este módulo la llama via guard — no la redefine.

// R-202604-040: genera bloque ## Estado actual para el Backlog exportado
function _buildCurrentStateMd() {
  const state = getState();
  const lines = ['## Estado actual', ''];

  // Ítems pendientes por tipo
  const pendientes = ITEMS.filter(i => i.status === 'pendiente');
  if (pendientes.length) {
    const byType = {};
    pendientes.forEach(i => {
      if (!i.code) return; // B-202605-030: guard contra code null
      const t = i.code[0];
      byType[t] = (byType[t] || 0) + 1;
    });
    const pendStr = Object.entries(byType).map(([t, n]) => `${t}=${n}`).join(' | ');
    lines.push(`**Pendientes:** ${pendStr} (${pendientes.length} total)`);
  }

  // Último bloqueante registrado en sesiones
  const allSessions = [];
  (state.projects || []).forEach(p => (p.sessions || []).forEach(s => allSessions.push(s)));
  allSessions.sort((a, b) => parseInt(b.id) - parseInt(a.id));
  const lastWithBlocker = allSessions.find(s => s.bloqueantes);
  if (lastWithBlocker) {
    lines.push(`**Último bloqueante:** ${lastWithBlocker.bloqueantes}`);
    lines.push(`*(registrado: ${lastWithBlocker.date || lastWithBlocker.dateShort || '—'})*`);
  }

  lines.push('', '---', '');
  // Solo emitir si hay contenido real (más de header + separador)
  const hasContent = pendientes.length || lastWithBlocker;
  return hasContent ? lines.join('\n') : '';
}

// R-202604-052: extraer MAJOR.MINOR.PATCH de versión canónica para naming generacional
// R-202605-002: _effectiveVersion() llamada como función — typeof guard corregido
function _backlogVersion() {
  const _src = _effectiveVersion() || 'v0';
  const m = _src.replace(/^v/, '').match(/^(\d+\.\d+(?:\.\d+)?)/);
  return m ? `v${m[1]}` : (_src || 'v0');
}

// R-202604-052: sprint cerrado más reciente del proyecto activo
// R-202605-002: usa getActiveSprints() como fuente de verdad v3
function _lastClosedSprint() {
  const sprints = getActiveSprints();
  const closed = sprints.filter(s => s.status === 'closed');
  if (!closed.length) return null;
  return closed.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0))[0];
}

export function exportBacklogMd() {
  if (!ITEMS.length) { showToast('warning', 'Sin ítems en el backlog para exportar'); return; }
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  _showExportConfirmModal('Backlog', `${pfx}-BACKLOG_${ver}.md`, () => _generateBacklogMd(ver));
}

// AC-5: Exportar historial completo — todos los ítems sin filtro generacional
export function exportFullHistoryMd() {
  if (!ITEMS.length) { showToast('warning', 'Sin ítems en el backlog para exportar'); return; }
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  _showExportConfirmModal('Historial completo', `${pfx}-BACKLOG-FULL_${ver}.md`, () => _generateFullHistoryBySprintMd(ver));
}

// R-202605-132: Export "Por sprint" — historial estructurado con todos los campos de sprint
// AC-3: disponible como opción — genera Markdown con secciones por sprint
// AC-4: scope_added flag — ítems creados durante el sprint marcados
// AC-5: retro de cada sprint cerrado incluida si existe
// AC-7: ítems sin sprint en sección 'Sin sprint' al final
function exportSprintsMd() {
  if (!ITEMS.length) { showToast('warning', 'Sin ítems en el backlog para exportar'); return; }
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  _showExportConfirmModal('Sprints — historial completo', `${pfx}-SPRINTS_${ver}.md`, () => _generateSprintsExportMd(ver));
}

// R-202605-132: genera Markdown por sprint con todos los campos estructurados
function _generateSprintsContent(newVersion) {
  const state = getState();
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;
  const pfx = _docPrefix();
  const _activeProj = getActiveProject();
  const _projName = _activeProj ? (_activeProj.name || 'Sin proyecto') : 'Sin proyecto';

  // B-202605-026: state.sprints directo — getActiveSprints() retorna solo 'active' post-fix
  const allSprints = (state && Array.isArray(state.sprints)) ? state.sprints : [];
  // Todos los sprints — cerrados primero (desc), luego activo, luego abiertos
  const closedSprints = allSprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  const activeSprints = allSprints.filter(s => s.status === 'active');
  const orderedSprints = [...closedSprints, ...activeSprints];

  const _itemRow = (i, sprintOpenedAt) => {
    const effortN = parseInt(i.effort) || 1;
    const effortDots = '●'.repeat(effortN) + '○'.repeat(3 - effortN);
    const typeLabel = i.code ? i.code[0] : '?';
    // AC-4: scope_added — ítem creado después de que el sprint fue abierto
    let scopeNote = '';
    if (sprintOpenedAt && i.createdAt) {
      const createdTs = new Date(i.createdAt).getTime();
      if (!isNaN(createdTs) && createdTs > sprintOpenedAt) scopeNote = ' ⊕';
    }
    return `| \`${i.code}\` | ${i.title || i.desc || '—'} | ${typeLabel} | ${effortDots} (${effortN}) | ${i.status || '—'} |${scopeNote ? ' scope added' : ''} |`;
  };

  const _itemRowHeader = () =>
    `| Código | Título | Tipo | Effort | Status final | Nota |\n|--------|--------|------|--------|--------------|------|`;

  let sprintSections = '';

  orderedSprints.forEach(sp => {
    const spItems = ITEMS.filter(i => i.sprint === sp.id);
    const doneItems = spItems.filter(i => i.status === 'done' || i.status === 'historico');
    const doneEffort = doneItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const totalEffort = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const pctEntrega = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;
    const closedDate = sp.closedAt
      ? (() => { const d = new Date(sp.closedAt); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })()
      : '—';

    // AC-2: todos los campos de sprint
    const metaRows = [
      `| ID | ${sp.id} |`,
      `| Nombre | ${sp.label || sp.name || sp.id} |`,
      `| Status | ${sp.status || '—'} |`,
      sp.goal ? `| Goal | ${sp.goal} |` : '',
      sp.version_target ? `| Versión target | ${sp.version_target} |` : '',
      sp.release_type ? `| Release type | ${sp.release_type} |` : '',
      `| Cerrado | ${closedDate} |`,
      `| Effort planeado | ${totalEffort} |`,
      `| Effort done | ${doneEffort} |`,
      `| % entrega | ${pctEntrega}% |`,
    ].filter(Boolean).join('\n');

    const sprintOpenedAt = sp.openedAt || sp.createdAt || 0;
    const itemsBlock = spItems.length
      ? `${_itemRowHeader()}\n${spItems.map(i => _itemRow(i, sprintOpenedAt)).join('\n')}`
      : '_Sin ítems registrados._';

    // AC-5: retro del sprint cerrado si existe
    const retroBlock = (sp.retroMd || sp.retro)
      ? `\n#### Retrospectiva\n\n${sp.retroMd || sp.retro}\n`
      : '';

    sprintSections += `\n### ${sp.label || sp.name || sp.id}\n\n| Campo | Valor |\n|---|---|\n${metaRows}\n\n${itemsBlock}\n${retroBlock}\n---\n`;
  });

  // AC-7: ítems sin sprint en sección 'Sin sprint' al final
  const noSprintItems = ITEMS.filter(i => !i.sprint || i.sprint === 'n/a');
  let noSprintSection = '';
  if (noSprintItems.length) {
    noSprintSection = `\n### Sin sprint asignado\n\n${_itemRowHeader()}\n${noSprintItems.map(i => _itemRow(i, 0)).join('\n')}\n\n---\n`;
  }

  // Resumen de velocidad por sprint cerrado
  const velocityRows = closedSprints.map(sp => {
    const spItems = ITEMS.filter(i => i.sprint === sp.id);
    const doneEffort = spItems
      .filter(i => i.status === 'done' || i.status === 'historico')
      .reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const totalEffort = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const pct = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;
    return `| ${sp.id} | ${sp.label || sp.name || sp.id} | ${totalEffort} | ${doneEffort} | ${pct}% |`;
  }).join('\n');

  const avgVelocity = closedSprints.length
    ? (() => {
        const totals = closedSprints.map(sp =>
          ITEMS.filter(i => i.sprint === sp.id && (i.status === 'done' || i.status === 'historico'))
               .reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0)
        );
        return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
      })()
    : 0;

  const md = `# ${pfx}-SPRINTS_${newVersion}.md
<!-- Versión: ${newVersion} | Última actualización: ${dateStr} | Export estructurado de sprints -->

---

## Meta

| Campo | Valor |
|---|---|
| Proyecto | ${_projName} |
| Versión | ${newVersion} |
| Última actualización | ${dateStr} |
| Sprints totales | ${allSprints.length} |
| Sprints cerrados | ${closedSprints.length} |
| Velocidad promedio | ${avgVelocity} effort/sprint |

---

## Velocidad por sprint

| Sprint | Nombre | Planeado | Done | % Entrega |
|--------|--------|----------|------|-----------|
${velocityRows || '_Sin sprints cerrados._'}

---

## Detalle por sprint
${orderedSprints.length ? sprintSections : '\n_Sin sprints registrados._\n'}
${noSprintSection}`;

  return md;
}

function _generateSprintsExportMd(newVersion) {
  const pfx = _docPrefix();
  const md = _generateSprintsContent(newVersion);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pfx}-SPRINTS_${newVersion}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('download', `📥 ${pfx}-SPRINTS_${newVersion}.md descargado`);
}

// B-202605-261 / R-202605-124 / R-202605-132: Export histórico agrupado por sprint
// AC-1: secciones por sprint cerrado con nombre, goal, fecha cierre, effort done, lista de ítems
// AC-2: bloque pre-S-23 (sprints sin datos de effort) al final como sección única lista plana
// AC-3: ítems sin sprint en sección 'Sin sprint asignado' si existen
// AC-4 (R-202605-132): scope_added flag — ítems creados durante el sprint
// AC-5 (R-202605-132): retro de sprint cerrado incluida si existe
// B-202605-515: _generateFullHistoryContent — función pura que retorna el string Markdown
// sin blob download ni toast. _generateFullHistoryBySprintMd delega aquí.
export function _generateFullHistoryContent(newVersion) {
  const state = getState();
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;
  const pfx = _docPrefix();
  const _activeProj = getActiveProject();
  const _projName = _activeProj ? (_activeProj.name || 'Sin proyecto') : 'Sin proyecto';

  // Sprint threshold: S-23 es el primer sprint con datos completos de effort
  // Sprints anteriores van al bloque histórico plano
  const SPRINT_DATA_THRESHOLD = 23;
  const _sprintNum = id => {
    if (!id) return null;
    const m = String(id).match(/S-(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  };

  // B-202605-026: state.sprints directo — getActiveSprints() retorna solo 'active' post-fix
  const allSprints = (state && Array.isArray(state.sprints)) ? state.sprints : [];
  const closedSprints = allSprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  // Sprints con datos completos (>= S-23)
  const sprintsWithData = closedSprints.filter(s => (_sprintNum(s.id) || 0) >= SPRINT_DATA_THRESHOLD);
  // Sprints sin datos de effort (< S-23) — sus IDs para agrupar ítems históricos
  const legacySprintIds = new Set(
    closedSprints
      .filter(s => (_sprintNum(s.id) || 0) < SPRINT_DATA_THRESHOLD)
      .map(s => s.id)
  );

  const _itemRow = (i, sprintOpenedAt) => {
    const effortN = parseInt(i.effort) || 1;
    const effortDots = '●'.repeat(effortN) + '○'.repeat(3 - effortN);
    const typeLabel = i.code ? i.code[0] : '?';
    // AC-4 (R-202605-132): scope_added — ítem creado después de que el sprint fue abierto
    let scopeAdded = '';
    if (sprintOpenedAt && i.createdAt) {
      const createdTs = new Date(i.createdAt).getTime();
      if (!isNaN(createdTs) && createdTs > sprintOpenedAt) scopeAdded = ' ⊕';
    }
    return `| \`${i.code}\` | ${i.title || i.desc || '—'} | ${typeLabel} | ${effortDots} (${effortN}) | ${i.status || '—'} |${scopeAdded ? ` _scope added_` : ''} |`;
  };

  const _itemRowHeader = () =>
    `| Código | Título | Tipo | Effort | Status | Nota |\n|--------|--------|------|--------|--------|------|`;

  // Secciones por sprint con datos
  let sprintSections = '';
  sprintsWithData.forEach(sp => {
    const spItems = ITEMS.filter(i => i.sprint === sp.id);
    const doneItems = spItems.filter(i => i.status === 'done' || i.status === 'historico');
    const doneEffort = doneItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const totalEffort = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const pctEntrega = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;
    const closedDate = sp.closedAt
      ? (() => { const d = new Date(sp.closedAt); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })()
      : '—';

    const metaRows = [
      `| ID | ${sp.id} |`,
      `| Nombre | ${sp.label || sp.name || sp.id} |`,
      sp.goal ? `| Goal | ${sp.goal} |` : '',
      sp.version_target ? `| Versión | ${sp.version_target} |` : '',
      sp.release_type ? `| Release | ${sp.release_type} |` : '',
      `| Cerrado | ${closedDate} |`,
      `| Effort done | ${doneEffort} / ${totalEffort} (${pctEntrega}%) |`,
    ].filter(Boolean).join('\n');

    // AC-4: pasar openedAt del sprint para calcular scope_added
    const sprintOpenedAt = sp.openedAt || sp.createdAt || 0;
    const itemsBlock = spItems.length
      ? `${_itemRowHeader()}\n${spItems.map(i => _itemRow(i, sprintOpenedAt)).join('\n')}`
      : '_Sin ítems registrados._';

    // AC-5 (R-202605-132): retro del sprint cerrado si existe
    const retroBlock = (sp.retroMd || sp.retro)
      ? `\n#### Retrospectiva\n\n${sp.retroMd || sp.retro}\n`
      : '';

    sprintSections += `\n### ${sp.label || sp.name || sp.id}\n\n| Campo | Valor |\n|---|---|\n${metaRows}\n\n${itemsBlock}\n${retroBlock}\n---\n`;
  });

  // Bloque histórico pre-S-23 — ítems de sprints sin datos de effort
  const legacyItems = ITEMS.filter(i => i.sprint && legacySprintIds.has(i.sprint));
  let legacySection = '';
  if (legacyItems.length) {
    legacySection = `\n### Histórico pre-S-${SPRINT_DATA_THRESHOLD} (sin datos de sprint)\n\n_Ítems de sprints anteriores sin datos de effort registrados._\n\n${_itemRowHeader()}\n${legacyItems.map(i => _itemRow(i, 0)).join('\n')}\n\n---\n`;
  }

  // Ítems sin sprint asignado
  const noSprintItems = ITEMS.filter(i => !i.sprint || i.sprint === 'n/a');
  let noSprintSection = '';
  if (noSprintItems.length) {
    noSprintSection = `\n### Sin sprint asignado\n\n${_itemRowHeader()}\n${noSprintItems.map(i => _itemRow(i, 0)).join('\n')}\n\n---\n`;
  }

  const md = `# ${pfx}-BACKLOG-FULL_${newVersion}.md
<!-- Versión: ${newVersion} | Última actualización: ${dateStr} | Historial completo agrupado por sprint -->

---

## Meta

| Campo | Valor |
|---|---|
| Proyecto | ${_projName} |
| Versión del backlog | ${newVersion} |
| Última actualización | ${dateStr} |
| Generado por | TL — export historial completo |

---

## Sprints cerrados
${sprintsWithData.length ? sprintSections : '\n_Sin sprints cerrados con datos completos._\n\n---\n'}
${legacySection}${noSprintSection}
## Estadísticas

| Métrica | Valor |
|---------|-------|
| Total ítems | ${ITEMS.length} |
| Sprints cerrados con datos | ${sprintsWithData.length} |
| Sprints históricos (pre-S-${SPRINT_DATA_THRESHOLD}) | ${legacySprintIds.size} |
`;

  // B-202605-515: retornar string puro — el download lo hace _generateFullHistoryBySprintMd
  return md;
}

// B-202605-515: wrapper que mantiene el comportamiento visible existente
// exportFullHistoryMd() llama a este wrapper — sin cambios para el usuario
function _generateFullHistoryBySprintMd(newVersion) {
  const md = _generateFullHistoryContent(newVersion);
  if (!md) return;
  const pfx = _docPrefix();
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pfx}-BACKLOG-FULL_${newVersion}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('download', `📥 ${pfx}-BACKLOG-FULL_${newVersion}.md descargado`);
}

function _showExportConfirmModal(label, filename, onConfirm) {
  // R-202604-047: shell estático en index.html
  const overlay = document.getElementById('export-confirm-overlay');
  if (!overlay) return;
  const titleEl = document.getElementById('export-confirm-title');
  const filenameEl = document.getElementById('export-confirm-filename');
  if (titleEl) titleEl.textContent = `⬇ Exportar ${label}`;
  if (filenameEl) filenameEl.textContent = filename;
  overlay.classList.add('open');
  // Reemplazar botón para limpiar handlers acumulados
  const btn = document.getElementById('export-confirm-btn');
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      onConfirm();
    });
  }
}

// R-202605-053: bloque ## Sprint activo — primera sección del backlog exportado
// AC-1: primera línea del contenido después del encabezado # BACKLOG
// AC-2: campos sprint (nombre canónico), status, version_target, release_type
// AC-3: si no hay sprint abierto → sprint: ninguno, demás campos n/a
function _buildSprintActivoMd() {
  // T-202605-151: solo sprint con current:true — sin fallback a all[0]
  // Mismo patrón que renderSprintBurndown (T-202605-027)
  const all = getActiveSprints().filter(s => s.status === 'active');
  const currentSprint = all.find(s => s.current === true) || null;
  if (!currentSprint) return '';
  const lines = [
    '## Sprint activo',
    '',
    '| Campo | Valor |',
    '|---|---|',
    `| sprint | ${currentSprint.name || currentSprint.id} |`,
    `| status | ${currentSprint.status} |`,
    `| version_target | ${currentSprint.version_target || 'n/a'} |`,
    `| release_type | ${currentSprint.release_type || 'n/a'} |`,
    `| scope | ${currentSprint.scope || 'n/a'} |`,
    '',
    '---',
    '',
  ];
  return lines.join('\n');
}

export function _generateBacklogContent(newVersion, opts = {}) {
  const state = getState();
  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const _activeProj = getActiveProject();
  const _projName = _activeProj ? (_activeProj.name || 'Sin proyecto') : 'Sin proyecto';
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;

  // R-202604-052: filtro generacional — solo pendiente (todos) + done del sprint cerrado actual
  // fullHistory: true → sin filtro (exportFullHistoryMd)
  // B-202605-262: done y descartado del sprint activo se incluyen — son parte del sprint vivo,
  //               no histórico. El cierre formal es el trigger para migrarlos al Histórico.
  let exportItems;
  if (opts.fullHistory) {
    exportItems = ITEMS;
  } else {
    const lastClosed = _lastClosedSprint();
    const lastClosedId = lastClosed ? lastClosed.id : null;
    const activeSprint = (state.sprints || []).find(s => s.status === 'active');
    const activeSprintId = activeSprint ? activeSprint.id : null;
    exportItems = ITEMS.filter(i => {
      if (i.status === 'historico') return false; // B-202604-193: histórico nunca en export activo
      if (i.status === 'pendiente' || i.status === 'en curso') return true; // AC-3: sin sprint se arrastra
      if (i.status === 'done' && lastClosedId && i.sprint === lastClosedId) return true; // AC-1: done del sprint cerrado actual
      // B-202605-262: done y descartado del sprint activo — parte del sprint vivo, no histórico
      if (activeSprintId && i.sprint === activeSprintId &&
          (i.status === 'done' || i.status === 'descartado')) return true;
      return false; // AC-2: done/descartado de sprints anteriores → excluidos
    });
  }

  // Contadores — máximos de ITEMS completo + state.tracker.counters (no del subconjunto)
  const counters = { P:0, T:0, R:0, B:0 };
  ITEMS.forEach(i => {
    if (!i.code) return; // B-202605-030: guard contra code null
    const t = i.code[0];
    const m = i.code.match(/[PITRB]-\d{6}-(\d{3})/);
    if (m) { const n = parseInt(m[1]); if (n > counters[t]) counters[t] = n; }
  });
  // Merge con getActiveTracker().counters (pueden tener ítems no en ITEMS)
  const activeCounters = getActiveTracker().counters || {};
  Object.keys(activeCounters).forEach(t => {
    if (activeCounters[t] > (counters[t] || 0)) counters[t] = activeCounters[t];
  });
  const counterStr = `P=${String(counters.P).padStart(3,'0')} | T=${String(counters.T).padStart(3,'0')} | R=${String(counters.R).padStart(3,'0')} | B=${String(counters.B).padStart(3,'0')}`;

  // ── Índice de estado ──
  // AC-6 (R-202605-132): incluir sprint en el mapa para reflejarlo en el índice
  const statusMap = {};
  exportItems.forEach(i => { statusMap[i.code] = { status: i.status, sprint: i.sprint || '' }; });
  const indexLines = _buildIndexLines(statusMap);

  // ── Sección de ítems ──
  const itemsMd = _buildItemsMd(exportItems);

  // ── Estadísticas finales ──
  const totalItems = exportItems.length;
  const doneCount = exportItems.filter(i => i.status === 'done').length;
  const backlogCount = exportItems.filter(i => i.status === 'backlog').length;

  // R-202604-040: bloque de estado actual — sprint activo, pendientes, último bloqueante
  const currentStateMd = _buildCurrentStateMd();

  // R-202605-053: bloque ## Sprint activo — primera sección del export (fuente de verdad en sesión)
  const sprintActivoMd = _buildSprintActivoMd();

  // R-202605-002: versión canónica para campos de metadata del export
  const _appVerStr = _effectiveVersion();

  const pfx = _docPrefix();
  const md = `# ${pfx}-BACKLOG_${newVersion}.md
<!-- Versión: ${newVersion} | Última actualización: ${dateStr} | App: AI-Tracker-${newVersion} -->

---

${sprintActivoMd}## Meta

| Campo | Valor |
|---|---|
| Proyecto | ${_projName} |
| Versión del backlog | ${newVersion} |
| Última actualización | ${dateStr} |
| Generado por | TL — exportado desde app |

---

${currentStateMd}## Índice de estado

\`\`\`
${indexLines}
Contadores: ${counterStr}
App: ${_appVerStr} — exportado desde tracker
\`\`\`

---

## Ítems

---

${itemsMd}

---

## Estadísticas finales

| Métrica | Valor |
|---------|-------|
| Ítems totales | ${totalItems} |
| Done | ${doneCount} |
| Backlog | ${backlogCount} |
| App version actual | ${_appVerStr} |
| Próxima versión | ${newVersion} |
`;

  return { md, meta, counters, dateStr };
}

export function _generateBacklogMd(newVersion, opts = {}) {
  const pfx = _docPrefix();
  const { md, meta, counters, dateStr } = _generateBacklogContent(newVersion, opts);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pfx}-BACKLOG_${newVersion}.md`;
  a.click();
  URL.revokeObjectURL(url);

  // Actualizar meta con nueva versión
  meta.version = newVersion;
  meta.updated = dateStr;
  meta.counters = counters;
  localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
  updateBacklogBanner();

  showToast('download', `📥 ${pfx}-BACKLOG_${newVersion}.md descargado`);
}

// Construye las líneas del índice de estado agrupadas por tipo
// AC-6 (R-202605-132): itemMap acepta {status, sprint?} — refleja sprint de cada ítem en el índice
function _buildIndexLines(itemMap) {
  const groups = { T: [], R: [], B: [], P: [], '?': [] }; // B-202605-019: bucket '?' para [pendiente-ID]
  Object.keys(itemMap).forEach(code => {
    const t = code[0];
    const entry = itemMap[code];
    // Compatibilidad: acepta string (status) o {status, sprint}
    const status = typeof entry === 'string' ? entry : (entry.status || '—');
    const sprint = typeof entry === 'object' ? (entry.sprint || '') : '';
    if (groups[t]) {
      groups[t].push({ code, status, sprint });
    } else {
      groups['?'].push({ code, status, sprint }); // B-202605-019: code[0] fuera de PTRB → Sin código asignado
    }
  });
  const lines = [];
  Object.keys(groups).forEach(t => {
    if (!groups[t].length) return;
    groups[t].sort((a, b) => a.code.localeCompare(b.code));
    // Agrupar en líneas de 6 para legibilidad (sprint amplía el token)
    const chunks = [];
    for (let i = 0; i < groups[t].length; i += 6) chunks.push(groups[t].slice(i, i+6));
    const label = t === '?' ? 'Sin código asignado' : t; // B-202605-019
    chunks.forEach(chunk => {
      lines.push(label + ': ' + chunk.map(x => {
        const sprintTag = x.sprint ? ` [${x.sprint}]` : '';
        return `${x.code} ${x.status}${sprintTag}`;
      }).join(' | '));
    });
  });
  return lines.join('\n');
}

// Construye la sección de ítems en formato Backlog.md
function _buildItemsMd(items) {
  const state = getState();
  const src = items || ITEMS;
  return src.map(item => {
    let md = `### ${item.code} · ${item.title || item.desc || '(sin título)'}\n`;
    md += `**Priority:** ${item.priority || 'medium'}\n`;
    const _area = (item.area || '').includes('**') ? '' : (item.area || '').trim();
    md += `**Area:** ${_area}\n`;
    md += `**Effort:** ${item.effort || 1}\n`;
    if (item.impact) md += `**Impact:** ${item.impact}\n`;
    md += `**Status:** ${item.status || 'pendiente'}\n`;
    if (item.discardReason) md += `**DiscardReason:** ${item.discardReason}\n`;
    if (item.discardRef)    md += `**DiscardRef:** ${item.discardRef}\n`;
    if (item.sprint) {
      const _sprintObj = (state.sprints || []).find(s => s.id === item.sprint);
      const _sprintLabel = _sprintObj ? (_sprintObj.name || item.sprint) : item.sprint;
      // AC-1 (R-202605-132): SprintId nunca vacío — campo estructurado + label legible
      md += `**SprintId:** ${item.sprint}\n`;
      md += `**Sprint:** ${_sprintLabel}\n`;
    }
    if (item.role)   md += `**Role:** ${item.role}\n`;
    if (item.parentId) md += `**ParentId:** ${item.parentId}\n`;
    if (item.origin)   md += `**Origin:** ${item.origin}\n`;
    if (item.blockedBy && item.blockedBy.length) md += `**BlockedBy:** ${item.blockedBy.join(', ')}\n`;
    if (item.archivos && item.archivos.length) md += `**Archivos:** ${item.archivos.join(', ')}\n`;
    if (item.version) md += `**Version:** ${item.version}\n`;
    // desc y AC van antes de los timestamps — el regex de desc captura desde **Version:** hasta
    // ### Criterios o $, por lo que CreatedAt/StatusChangedAt/DoneAt deben quedar DESPUÉS para
    // no ser absorbidos en item.desc durante el parse (causa de duplicados y pérdida de AC).
    if (item.desc) md += `\n${item.desc}\n`;
    if (item.ac && item.ac.length) {
      md += `\n### Criterios de aceptación\n`;
      item.ac.forEach(c => {
        const checked = item.status === 'done' ? 'x' : ' ';
        md += `- [${checked}] ${c}\n`;
      });
    }
    if (item.notes) md += `\n**Notes:** ${item.notes}\n`;
    if (item.createdAt)       md += `**CreatedAt:** ${item.createdAt}\n`;
    if (item.statusChangedAt) md += `**StatusChangedAt:** ${item.statusChangedAt}\n`;
    if (item.doneAt)          md += `**DoneAt:** ${item.doneAt}\n`;
    return md;
  }).join('\n---\n\n');
}

// ── Keyboard shortcuts ──
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const s = document.getElementById('search-global');
    if (s) { s.focus(); s.select(); }
  }
  if (e.key === 'Escape') {
    closePopup();
    closePendPanel();
    closeModal('add-modal');
    closeModal('tag-modal');
    const _qcOverlay = document.getElementById('qc-modal-overlay'); if (_qcOverlay) _qcOverlay.classList.remove('open');
    closeQuickCapture();
  }
});

// Init — diferido post-DOMContentLoaded con gate de auth
// load() ya fue llamado por _initApp() en locus-storage.js antes de que este módulo renderice.
// Este bloque solo ejecuta las inicializaciones de sprint-project que dependen de state ya cargado.
document.addEventListener('DOMContentLoaded', function _sprintProjectInit() {
  // Gate: sin auth no hay state válido — _initApp() habrá bloqueado con openAuthModal()
  if (!getSupabaseUserId()) return;

  const state = getState();
  // Auto-seleccionar primer proyecto activo si no hay filtro (backlog requiere proyecto)
  (function _ensureProjectFilter() {
    if (_getActiveProjectFilter()) return;
    const active = (state.projects || []).find(p => p.status === 'active' || (!p.status && !p.archived));
    if (active) _setActiveProjectFilter(active.id);
  })();

  // Migración: paused → archived (one-time, idempotent)
  if (state.projects && state.projects.some(p => p.status === 'paused')) {
    state.projects.forEach(p => { if (p.status === 'paused') p.status = 'archived'; });
    save();
  }
});
// ── T-077: Panel selector proyectos ──

const PROJ_COLORS = ['#7c6af7','#38bdf8','#2ecc78','#e8a832','#e85555','#f472b6','#a3e635','#fb923c','#8BC34A','#64748b'];

// B-202605-022: funciones nombradas para drag delegation en #proj-list
// Definidas en módulo-scope para que removeEventListener pueda referenciarlas
function _projListDragStartHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  if (row) projDragStart(e, row.dataset.dragProjId, row);
}
function _projListDragEndHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  projDragEnd(e, row);
}
function _projListDragOverHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  if (row) projDragOver(e, row.dataset.dragProjId, row);
}
function _projListDragLeaveHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  projDragLeave(e, row);
}
function _projListDropHandler(e) {
  const row = e.target.closest('[data-drag-proj-id]');
  if (row) projDrop(e, row.dataset.dragProjId, row);
}

export function _getActiveProjectFilter() {
  return localStorage.getItem('current-project-filter') || '';
}

export function _setActiveProjectFilter(projId) {
  if (projId) localStorage.setItem('current-project-filter', projId);
  else localStorage.removeItem('current-project-filter');
  _updateProjBreadcrumb();
  _updateProjFilterBtn();
  _updateHeaderProjectLabel();
  _syncCleanProjectBtn();
}

export function _updateProjBreadcrumb() {
  // absorbido por _updateProjFilterBtn — no-op
}

export function _updateProjFilterBtn() {
  const btn = document.getElementById('proj-filter-btn');
  if (!btn) return;
  const filterId = _getActiveProjectFilter();
  if (filterId) {
    const proj = getProjectById(filterId);
    const avatar = proj
      ? (proj.icon
          ? `<span class="proj-filter-icon">${esc(proj.icon)}</span>`
          : `<span class="proj-filter-initial" style="--proj-color:${proj.color || '#7c6af7'}">${esc((proj.name||'P')[0].toUpperCase())}</span>`)
      : '';
    const name = proj ? esc(proj.name) : 'Proyecto';
    btn.innerHTML = `${avatar}${name} <span title="Limpiar filtro" class="proj-filter-clear">✕</span>`;
    btn.classList.add('active');
    const clearSpan = btn.querySelector('.proj-filter-clear');
    if (clearSpan) {
      clearSpan.addEventListener('click', function(e) {
        e.stopPropagation();
        clearProjectFilter();
      });
    }
  } else {
    btn.innerHTML = '📁 Proyectos';
    btn.classList.remove('active');
  }
}

function clearProjectFilter() {
  _setActiveProjectFilter('');
  // B-202604-NNN: recargar ITEMS siempre al limpiar filtro
  loadBacklog(); loadHtmlMap();
  render(); renderHoy();
  if (typeof currentTab !== 'undefined' && currentTab === 'analytics') renderAnalytics();
  // B-202604-NNN: render backlog incondicional — funciona en tab Templates y tab Backlog
  renderBacklogList(); renderStats();
  _renderTplProjBanner();
  switchSubTab(currentSubTab);
}

export function openProjPanel() {
  renderProjPanel();
  document.getElementById('proj-panel-overlay').classList.add('open');
  // R-202604-066: chevron animado — activar mientras panel abierto
  const btn = document.getElementById('proj-filter-btn');
  if (btn) btn.classList.add('active');
}

export function closeProjPanel() {
  document.getElementById('proj-panel-overlay').classList.remove('open');
  // R-202604-066: chevron animado — desactivar al cerrar
  const btn = document.getElementById('proj-filter-btn');
  if (btn) btn.classList.remove('active');
}

function renderProjPanel() {
  const state = getState();
  const body = document.getElementById('proj-panel-body');
  if (!body) return;
  const filterId = _getActiveProjectFilter();
  const projects = (state.projects || []).filter(p => p.status !== 'archived');

  let html = '';

  if (!projects.length) {
    html += `<div class="proj-panel-empty">Sin proyectos — crea uno abajo</div>`;
  } else {
    projects.forEach(proj => {
      const sessCount = _countProjSessions(proj);
      const isActive = filterId === proj.id;
      html += `<div class="proj-row${isActive ? ' active' : ''}" data-proj-id="${proj.id}">
        ${proj.icon ? `<span class="proj-row-icon">${esc(proj.icon)}</span>` : `<span class="proj-row-dot" style="--proj-color:${proj.color || '#7c6af7'}"></span>`}
        <span class="proj-row-name">${esc(proj.name)}${proj.notes ? `<span class="proj-row-notes">${esc(proj.notes)}</span>` : ''}</span>
        <span class="proj-row-count">${sessCount}</span>
        <button class="proj-row-edit" data-proj-edit-id="${proj.id}" title="Editar">✎</button>
      </div>`;
    });
  }

  if (filterId) {
    html += `<div class="proj-all-row proj-all-row--separator" data-proj-clear="1">
      <span class="proj-all-row-icon">✕</span>
      <span class="proj-all-row-label">Sin filtro activo</span>
    </div>`;
  }

  body.innerHTML = html;

  body.addEventListener('click', function _projPanelDelegate(e) {
    const editBtn = e.target.closest('[data-proj-edit-id]');
    if (editBtn) {
      e.stopPropagation();
      closeProjPanel();
      openProjModal(true, editBtn.dataset.projEditId);
      return;
    }
    const clearRow = e.target.closest('[data-proj-clear]');
    if (clearRow) { selectProjectFilter(''); return; }
    const row = e.target.closest('[data-proj-id]');
    if (row) { selectProjectFilter(row.dataset.projId); return; }
  }, { once: true });
}

export function _countProjSessions(proj) {
  return getProjectSessions(proj.id).length;
}

export function selectProjectFilter(projId) {
  _setActiveProjectFilter(projId);
  closeProjPanel();
  // B-202604-NNN: recargar ITEMS siempre al cambiar proyecto — independientemente del tab activo
  loadBacklog(); loadHtmlMap();
  render(); renderHoy();
  if (typeof currentTab !== 'undefined' && currentTab === 'analytics') renderAnalytics();
  // B-202604-NNN: render backlog incondicional — funciona en tab Templates y tab Backlog
  renderBacklogList(); renderStats();
  _renderTplProjBanner();
  switchSubTab(currentSubTab);
  if (projId) {
    const proj = getProjectById(projId);
    showToast('info', proj ? `Filtro: ${proj.name}` : 'Filtro activo');
  } else {
    showToast('info', 'Filtro limpiado');
  }
}

// ── T-080: Modal gestión proyectos CRUD ──

let _projEditId = null; // null = crear, string = editar
let _projSelectedColor = 0;

export function openProjModal(editMode, projId) {
  _projEditId = editMode && projId ? projId : null;
  _projSelectedColor = 0;
  _renderProjColorRow();
  _renderProjList();

  const heading = document.getElementById('proj-form-heading');
  const nameInput = document.getElementById('proj-name-input');
  const emojiInput = document.getElementById('proj-emoji');

  if (_projEditId) {
    const proj = getProjectById(_projEditId);
    if (proj) {
      if (heading) heading.textContent = '✎ Editar proyecto';
      if (nameInput) nameInput.value = proj.name;
      if (emojiInput) emojiInput.value = proj.icon || '';
      const prefixInput = document.getElementById('proj-prefix-input');
      if (prefixInput) prefixInput.value = proj.prefix || '';
      const notesInput = document.getElementById('proj-notes-input');
      if (notesInput) notesInput.value = proj.notes || '';
      _projSelectedColor = PROJ_COLORS.indexOf(proj.color);
      if (_projSelectedColor < 0) _projSelectedColor = 0;
      _renderProjColorRow();
    }
  } else {
    if (heading) heading.textContent = '+ Nuevo proyecto';
    if (nameInput) nameInput.value = '';
    if (emojiInput) emojiInput.value = '';
  }

  const projModalOverlay = document.getElementById('proj-modal-overlay');
  if (projModalOverlay) projModalOverlay.classList.add('open');
  setTimeout(() => { if (nameInput) nameInput.focus(); }, 80);
}

export function closeProjModal() {
  const projModalOverlay = document.getElementById('proj-modal-overlay');
  if (projModalOverlay) projModalOverlay.classList.remove('open');
  _projEditId = null;
}

function cancelProjForm() {
  _projEditId = null;
  const heading = document.getElementById('proj-form-heading');
  const nameInput = document.getElementById('proj-name-input');
  const emojiInput = document.getElementById('proj-emoji');
  const prefixInput = document.getElementById('proj-prefix-input');
  if (heading) heading.textContent = '+ Nuevo proyecto';
  if (nameInput) nameInput.value = '';
  if (emojiInput) emojiInput.value = '';
  if (prefixInput) prefixInput.value = '';
  const notesInput = document.getElementById('proj-notes-input');
  if (notesInput) notesInput.value = '';
  _projSelectedColor = 0;
  _renderProjColorRow();
}

function _renderProjColorRow() {
  const row = document.getElementById('proj-color-row');
  if (!row) return;
  row.innerHTML = PROJ_COLORS.map((c, i) =>
    `<div class="proj-color-dot${i === _projSelectedColor ? ' sel' : ''}" style="--proj-color:${c}" data-color-idx="${i}" title="${c}"></div>`
  ).join('');
  row.addEventListener('click', function _colorRowDelegate(e) {
    const dot = e.target.closest('[data-color-idx]');
    if (dot) selectProjColor(parseInt(dot.dataset.colorIdx, 10));
  }, { once: true });
}

function selectProjColor(i) {
  _projSelectedColor = i;
  _renderProjColorRow();
}

function confirmProjForm() {
  const state = getState();
  const name = (document.getElementById('proj-name-input') || {value:''}).value.trim();
  if (!name) {
    const el = document.getElementById('proj-name-input');
    if (el) { el.classList.add('input-border-error'); setTimeout(() => el.classList.remove('input-border-error'), 1200); }
    showToast('warning', 'El nombre es obligatorio'); return;
  }
  const emoji = (document.getElementById('proj-emoji') || {value:''}).value.trim();
  const notes = (document.getElementById('proj-notes-input') || {value:''}).value.trim();
  const color = PROJ_COLORS[_projSelectedColor] || PROJ_COLORS[0];

  if (!state.projects) state.projects = [];

  if (_projEditId) {
    const proj = getProjectById(_projEditId);
    if (proj) {
      proj.name = name;
      proj.color = color;
      proj.icon = emoji;
      proj.prefix = (document.getElementById('proj-prefix-input') || {value:''}).value.trim().toUpperCase().slice(0, 3);
      proj.notes = notes;
      showToastInline('success', `Proyecto "${name}" actualizado`, document.getElementById('proj-form-confirm-btn'));
    }
    save();
    closeProjModal();
    _renderProjList();
    _updateProjBreadcrumb();
    _updateProjFilterBtn();
    _updateHeaderProjectLabel();
    return;
  } else {
    const id = 'proj-' + Math.random().toString(36).slice(2, 8);
    const prefix = (document.getElementById('proj-prefix-input') || {value:''}).value.trim().toUpperCase().slice(0, 3);
    state.projects.push({ id, name, color, icon: emoji, prefix, notes, status: 'active', context: '', contextVersion: '', backlog: [], backlogVersion: '' });
    showToastInline('success', `Proyecto "${name}" creado`, document.getElementById('proj-form-confirm-btn'));
  }

  save();
  cancelProjForm();
  _renderProjList();
  _updateProjBreadcrumb();
  _updateProjFilterBtn();
}

function _toggleProjArchivedSection() {
  var k = 'proj-modal-archived-open';
  var now = localStorage.getItem(k) !== '0';
  localStorage.setItem(k, now ? '0' : '1');
  _renderProjList();
}

function _renderProjList() {
  const state = getState();
  const list = document.getElementById('proj-list');
  if (!list) return;
  const projects = state.projects || [];
  if (!projects.length) {
    list.innerHTML = `<div class="proj-empty-hint">Aún no hay proyectos — crea uno arriba</div>`;
    return;
  }

  const activeProjs = projects.filter(p => p.status !== 'archived');
  const archivedProjs = projects.filter(p => p.status === 'archived');

  function _projRow(proj) {
    const sessCount = _countProjSessions(proj);
    const isArchived = proj.status === 'archived';
    return `<div class="proj-list-row${isArchived ? ' paused' : ''}" draggable="${isArchived ? 'false' : 'true'}"
      id="prow-${proj.id}"
      data-drag-proj-id="${proj.id}">
      <span class="proj-list-drag">${isArchived ? '' : '⠿'}</span>
      ${proj.icon
        ? `<span class="proj-list-icon">${esc(proj.icon)}</span>`
        : proj.prefix
          ? `<span class="proj-list-prefix" style="--proj-color:${proj.color || '#7c6af7'}">${esc(proj.prefix)}</span>`
          : `<span class="proj-list-dot" style="--proj-color:${proj.color || '#7c6af7'}"></span>`}
      <span class="proj-list-name">${esc(proj.name)}${proj.notes ? `<br><span class="proj-list-notes">${esc(proj.notes)}</span>` : ''}</span>
      <span class="proj-list-meta">${sessCount} ses.</span>
      <div class="proj-list-actions">
        <button class="proj-list-btn" data-proj-action="edit" data-proj-id="${proj.id}" title="Editar">✎</button>
        <button class="proj-list-btn" data-proj-action="archive" data-proj-id="${proj.id}" title="${isArchived ? 'Restaurar' : 'Archivar'}">${isArchived ? '↩' : '📦'}</button>
        <button class="proj-list-btn danger" data-proj-action="delete" data-proj-id="${proj.id}" title="Eliminar">✕</button>
      </div>
    </div>`;
  }

  const archivedKey = 'proj-modal-archived-open';
  const archivedOpen = localStorage.getItem(archivedKey) !== '0';

  let html = activeProjs.map(_projRow).join('');
  if (archivedProjs.length) {
    html += `<div class="proj-archived-section">
      <button class="proj-archived-toggle" data-proj-action="toggle-archived">
        <span class="proj-archived-arrow">${archivedOpen ? '▾' : '▸'}</span>
        <span>Archivados (${archivedProjs.length})</span>
      </button>
      ${archivedOpen ? archivedProjs.map(_projRow).join('') : ''}
    </div>`;
  }
  list.innerHTML = html || `<div class="proj-empty-hint">Aún no hay proyectos — crea uno arriba</div>`;

  // Event delegation — botones de acción (B-202605-023: remove antes de add — evita acumulación en nodo persistente)
  function _projListClickDelegate(e) {
    const btn = e.target.closest('[data-proj-action]');
    if (!btn) return;
    const action = btn.dataset.projAction;
    const projId = btn.dataset.projId;
    if (action === 'edit') { editProjInline(projId); return; }
    if (action === 'archive') { toggleProjArchive(projId); return; }
    if (action === 'delete') { deleteProjConfirm(projId); return; }
    if (action === 'toggle-archived') { _toggleProjArchivedSection(); return; }
  }
  list.removeEventListener('click', _projListClickDelegate);
  list.addEventListener('click', _projListClickDelegate);

  // Event delegation — drag & drop (B-202605-022: remove antes de add — evita acumulación en nodo persistente)
  list.removeEventListener('dragstart', _projListDragStartHandler);
  list.removeEventListener('dragend',   _projListDragEndHandler);
  list.removeEventListener('dragover',  _projListDragOverHandler);
  list.removeEventListener('dragleave', _projListDragLeaveHandler);
  list.removeEventListener('drop',      _projListDropHandler);
  list.addEventListener('dragstart', _projListDragStartHandler);
  list.addEventListener('dragend',   _projListDragEndHandler);
  list.addEventListener('dragover',  _projListDragOverHandler);
  list.addEventListener('dragleave', _projListDragLeaveHandler);
  list.addEventListener('drop',      _projListDropHandler);
}

function editProjInline(projId) {
  _projEditId = projId;
  const proj = getProjectById(projId);
  if (!proj) return;
  const heading = document.getElementById('proj-form-heading');
  const nameInput = document.getElementById('proj-name-input');
  const emojiInput = document.getElementById('proj-emoji');
  if (heading) heading.textContent = '✎ Editar: ' + proj.name;
  if (nameInput) { nameInput.value = proj.name; nameInput.focus(); }
  if (emojiInput) emojiInput.value = proj.icon || '';
  const notesInput = document.getElementById('proj-notes-input');
  if (notesInput) notesInput.value = proj.notes || '';
  _projSelectedColor = PROJ_COLORS.indexOf(proj.color);
  if (_projSelectedColor < 0) _projSelectedColor = 0;
  _renderProjColorRow();
  // Scroll al form
  const form = document.getElementById('proj-form');
  if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleProjArchive(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const wasArchived = proj.status === 'archived';
  proj.status = wasArchived ? 'active' : 'archived';
  // Si el proyecto activo en filtro se archiva, limpiar filtro
  if (!wasArchived && _getActiveProjectFilter() === projId) {
    _setActiveProjectFilter('');
  }
  save();
  _renderProjList();
  renderProyectos();
  showToast('info', !wasArchived ? `"${proj.name}" archivado` : `"${proj.name}" restaurado`);
}

function deleteProjConfirm(projId) {
  const proj = getProjectById(projId);
  if (!proj) return;
  const sessCount = _countProjSessions(proj);
  const msg = sessCount > 0
    ? `Las ${sessCount} sesiones de las IAs vinculadas mantendrán sus datos.`
    : `Esta acción no se puede deshacer.`;
  _gconfirmOpen({ title: `¿Eliminar "${proj.name}"?`, msg, okLabel: 'Eliminar', danger: true }, () => {
    const state = getState();
    state.projects = (state.projects || []).filter(p => p.id !== projId);
    if (_getActiveProjectFilter() === projId) _setActiveProjectFilter('');
    save();
    _renderProjList();
    _updateProjBreadcrumb();
    showToast('success', `Proyecto eliminado`);
  });
}

// Drag & drop proyectos en modal
let _projDragId = null;
function projDragStart(e, projId, rowEl) {
  _projDragId = projId;
  if (rowEl) rowEl.classList.add('dragging');
}
function projDragEnd(e, rowEl) {
  if (rowEl) rowEl.classList.remove('dragging');
  document.querySelectorAll('.proj-list-row').forEach(r => r.classList.remove('drag-over'));
  _projDragId = null;
}
function projDragOver(e, projId, rowEl) {
  e.preventDefault();
  if (_projDragId === projId) return;
  document.querySelectorAll('.proj-list-row').forEach(r => r.classList.remove('drag-over'));
  if (rowEl) rowEl.classList.add('drag-over');
}
function projDragLeave(e, rowEl) {
  if (rowEl) rowEl.classList.remove('drag-over');
}
function projDrop(e, toId, rowEl) {
  e.preventDefault();
  if (rowEl) rowEl.classList.remove('drag-over');
  if (!_projDragId || _projDragId === toId) return;
  const state = getState();
  const projs = state.projects || [];
  const fromIdx = projs.findIndex(p => p.id === _projDragId);
  const toIdx   = projs.findIndex(p => p.id === toId);
  if (fromIdx < 0 || toIdx < 0) return;
  const [moved] = projs.splice(fromIdx, 1);
  projs.splice(toIdx, 0, moved);
  save();
  _renderProjList();
}

// T-076: helpers (redefinidos aquí para acceso completo al state actualizado)
export function getProjectById(id) {
  const state = getState();
  return (state.projects || []).find(p => p.id === id);
}
// Helper: retorna proyectos que tienen sesiones de una IA específica
function getProjectsByAI(aiId) {
  const state = getState();
  return (state.projects || []).filter(p => (p.sessions || []).some(s => s.aiId === aiId));
}

// T-202604-002: helpers para context y backlog por proyecto
export function getProjContext(projId) {
  const proj = getProjectById(projId);
  return proj ? (proj.context || '') : '';
}
export function setProjContext(projId, text, version) {
  const proj = getProjectById(projId);
  if (!proj) return;
  proj.context = text || '';
  if (version !== undefined) proj.contextVersion = version || '';
  save();
}

// T-202604-267: Notas rápidas — modelo de datos y persistencia
// Clave localStorage: notes-{projId} (o 'notes' si no hay proyecto activo)
// Objeto nota: { id, text, createdAt, updatedAt, itemRef? }

function _notesKey(projId) {
  return projId ? 'notes-' + projId : 'notes';
}

function _loadNotes(projId) {
  try {
    return JSON.parse(localStorage.getItem(_notesKey(projId)) || '[]');
  } catch { return []; }
}

function _saveNotes(projId, notes) {
  try {
    localStorage.setItem(_notesKey(projId), JSON.stringify(notes));
  } catch (e) { console.warn('[AI Tracker] _saveNotes error:', e); }
  // R-2: persistir notas en Supabase para sobrevivir cambio de dispositivo
  if (typeof _supabase !== 'undefined' && _supabase && typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    const sbKey = projId ? 'notes-' + projId : 'notes-global';
    _supabase.from('tracker_docs').upsert(
      [{ user_id: _supabaseUser.id, key: sbKey, value: { notes, updatedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }],
      { onConflict: 'user_id,key' }
    ).then(({ error }) => {
      if (error) {
        console.warn('[AI Tracker] _saveNotes Supabase error:', error);
        _offlineQueuePush({ type: 'notes', projId: projId || null });
      }
    });
  }
}

function _noteId() {
  return 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

// Crear nota — devuelve la nota creada
function createNote(text, itemRef) {
  const projId = _getActiveProjectFilter();
  const proj = projId ? getProjectById(projId) : null;
  if (!proj && projId) return null;
  const notes = _loadNotes(projId);
  const now = Date.now();
  const note = { id: _noteId(), text: text || '', createdAt: now, updatedAt: now };
  if (itemRef) note.itemRef = itemRef;
  notes.push(note);
  _saveNotes(projId, notes);
  // Exponer en proyecto activo para acceso via getActiveProject().quickNotes
  if (proj) { proj.quickNotes = notes; save(); }
  return note;
}

// Editar nota existente — devuelve true si encontrada
function editNote(noteId, text, itemRef) {
  const projId = _getActiveProjectFilter();
  const proj = projId ? getProjectById(projId) : null;
  const notes = _loadNotes(projId);
  const idx = notes.findIndex(n => n.id === noteId);
  if (idx === -1) return false;
  notes[idx].text = text !== undefined ? text : notes[idx].text;
  notes[idx].updatedAt = Date.now();
  if (itemRef !== undefined) {
    if (itemRef) notes[idx].itemRef = itemRef;
    else delete notes[idx].itemRef;
  }
  _saveNotes(projId, notes);
  if (proj) { proj.quickNotes = notes; save(); }
  return true;
}

// Eliminar nota — devuelve true si encontrada
function deleteNote(noteId) {
  const projId = _getActiveProjectFilter();
  const proj = projId ? getProjectById(projId) : null;
  const notes = _loadNotes(projId);
  const filtered = notes.filter(n => n.id !== noteId);
  if (filtered.length === notes.length) return false;
  _saveNotes(projId, filtered);
  if (proj) { proj.quickNotes = filtered; save(); }
  return true;
}

// Leer notas del proyecto activo — expuesto para getActiveProject().quickNotes
function getActiveProjectNotes() {
  const projId = _getActiveProjectFilter();
  return _loadNotes(projId);
}

// T-081: _filteredAIs — retorna AIs según filtro global activo (por sesiones)
function _filteredAIs() {
  const state = getState();
  const filterId = _getActiveProjectFilter();
  if (!filterId) return state.ais;
  const proj = getProjectById(filterId);
  if (!proj) return state.ais;
  const aiIds = new Set((proj.sessions || []).map(s => s.aiId).filter(Boolean));
  return state.ais.filter(a => aiIds.has(a.id));
}



// Init backlog si hay ítems
if (typeof ITEMS !== 'undefined' && ITEMS.length) {
  const ftypes = document.getElementById('filter-bar-types');
  const fstatus = document.getElementById('filter-bar-status');
  if (ftypes) ftypes.classList.remove('is-hidden');
  if (fstatus) fstatus.classList.remove('is-hidden');
  renderStats();
  updateBacklogBanner();
  updateStatusFilterUI();
  updateBacklogFooter();
}

// T-052 / B-202604-013 / T-202604-048 — Init diferido: requiere módulos completos (switchTab en checkpoint.js)
document.addEventListener('DOMContentLoaded', function _sprintProjectUIInit() {
  // T-052: ocultar tabs que no son el activo por defecto
  document.querySelectorAll('.tracker-only').forEach(el => el.classList.add('is-hidden'));
  document.querySelectorAll('.analytics-only').forEach(el => el.classList.add('is-hidden'));
  // B-202604-013 / T-202604-317: restaurar tab activo — switchTab vive en checkpoint.js
  const _savedTab = localStorage.getItem('active-tab');
  switchTab(_savedTab || 'tracker');
  // T-202604-048: cargar Module Map desde localStorage
  loadHtmlMap();
  if (typeof renderHoy === 'function') renderHoy();
  // Garantizar status bar visible tras restaurar tab
  if (typeof renderAIStatusBar === 'function') renderAIStatusBar();
  // T-202604-009: onboarding primer uso
  // R-[pendiente-ID]: _checkOnboarding removed — SCB handles first-use onboarding
  // T-077: inicializar estado visual de filtro proyectos
  if (typeof _updateProjBreadcrumb === 'function') _updateProjBreadcrumb();
  if (typeof _updateProjFilterBtn === 'function') _updateProjFilterBtn();
  _updateHeaderProjectLabel();

  // T-202605-064: bindings estáticos proj-panel (on* removidos de index.html)
  const _projPanelOverlay = document.getElementById('proj-panel-overlay');
  if (_projPanelOverlay) {
    _projPanelOverlay.addEventListener('click', function(e) {
      if (e.target === _projPanelOverlay) closeProjPanel();
    });
  }
  const _projPanelCloseBtn = document.getElementById('proj-panel-close-btn');
  if (_projPanelCloseBtn) _projPanelCloseBtn.addEventListener('click', closeProjPanel);
  const _projPanelNuevoBtn = document.getElementById('proj-panel-btn-nuevo');
  if (_projPanelNuevoBtn) _projPanelNuevoBtn.addEventListener('click', function() { closeProjPanel(); openProjModal(); });
  const _projPanelGestionarBtn = document.getElementById('proj-panel-btn-gestionar');
  if (_projPanelGestionarBtn) _projPanelGestionarBtn.addEventListener('click', function() { closeProjPanel(); openProjModal(); });

  // T-202605-064: bindings estáticos proj-modal (on* removidos de index.html)
  const _projModalOverlay = document.getElementById('proj-modal-overlay');
  if (_projModalOverlay) {
    _projModalOverlay.addEventListener('click', function(e) {
      if (e.target === _projModalOverlay) closeProjModal();
    });
  }
  const _projModalCloseBtn = document.getElementById('proj-modal-close-btn');
  if (_projModalCloseBtn) _projModalCloseBtn.addEventListener('click', closeProjModal);
  const _projFormCancelBtn = document.getElementById('proj-form-cancel-btn');
  if (_projFormCancelBtn) _projFormCancelBtn.addEventListener('click', cancelProjForm);
  const _projFormConfirmBtn = document.getElementById('proj-form-confirm-btn');
  if (_projFormConfirmBtn) _projFormConfirmBtn.addEventListener('click', confirmProjForm);
  const _projNameInput = document.getElementById('proj-name-input');
  if (_projNameInput) _projNameInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') confirmProjForm(); });
});


// R-[pendiente-ID]: Onboarding overlay removed — _checkOnboarding, _renderOnboardingSteps, _onboardingStepAction, _dismissOnboarding eliminated. SCB handles first-use via renderSetupChecklist.

// T-202605-491: Firebase wizard removido — Firebase deprecado, Supabase es el provider activo.

// T-047: inicializar botón de rango activo al cargar
(function() {
  const saved = parseInt(localStorage.getItem('analytics-range') || '3', 10);
  if (typeof setAnalyticsRange === 'function') setAnalyticsRange(saved);
  document.querySelectorAll('.range-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.range) === saved);
  });
})();

// ── Splash screen controller ──
const SplashController = {
  splash: null,
  progressFill: null,
  statusEl: null,
  startTime: Date.now(),
  minDuration: 1200, // ms mínimo de visibilidad
  
  init() {
    this.splash = document.getElementById('pepe-splash');
    this.progressFill = document.getElementById('pepe-progress-fill');
    this.statusEl = document.getElementById('splash-status');
    
    // Extrae versión del title del documento
    const title = document.title.match(/v([\d.]+)/);
    if (title) {
      const versionEl = document.getElementById('splash-version');
      if (versionEl) versionEl.textContent = 'v' + title[1];
    }
    
    return this;
  },
  
  updateProgress(percent, status) {
    // percent: 0-100
    // status: string de estado
    if (this.progressFill) {
      this.progressFill.style.setProperty('--splash-progress', percent + '%');
      if (percent === 100) {
        this.progressFill.classList.remove('indeterminate');
      }
    }
    if (this.statusEl && status) {
      this.statusEl.textContent = status;
    }
  },
  
  hide() {
    // Respetar duración mínima
    const elapsed = Date.now() - this.startTime;
    const delay = Math.max(0, this.minDuration - elapsed);
    
    setTimeout(() => {
      if (this.splash) {
        this.splash.classList.add('fade-out');
        setTimeout(() => {
          if (this.splash && this.splash.parentNode) {
            this.splash.remove();
          }
        }, 600);
      }
    }, delay);
  }
};



// R-202604-022: calcula uso actual de localStorage como porcentaje
// Asume límite estándar de 5MB (5 * 1024 * 1024 chars)
export function _getLocalStorageUsage() {
  const LIMIT = 5 * 1024 * 1024;
  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += (key + localStorage.getItem(key)).length;
    }
  }
  return { usedKB: (used / 1024).toFixed(1), totalKB: (LIMIT / 1024).toFixed(0), pct: used / LIMIT };
}


(function() {
  const PEPE_URI = document.querySelector('link[rel="icon"]').href;
  
  // Inicializar splash
  SplashController.init();
  
  // Logo en header
  const logoImg = document.getElementById('pepe-logo');
  if (logoImg) logoImg.src = PEPE_URI;
  
  // Splash
  const splashImg = document.getElementById('pepe-splash-img');
  if (splashImg) splashImg.src = PEPE_URI;
  
  // Simulación de carga
  SplashController.updateProgress(20, '↓ Cargando sesiones...');
  
  setTimeout(() => {
    SplashController.updateProgress(50, '↓ Sincronizando...');
  }, 300);
  
  setTimeout(() => {
    SplashController.updateProgress(85, '✓ Procesando datos...');
  }, 600);
  
  setTimeout(() => {
    SplashController.updateProgress(100, '✓ Listo');
    // Esperar un poco más y esconder
    setTimeout(() => {
      SplashController.hide();
    }, 400);
  }, 900);
})();

// ── Context export — migrado desde ai-tracker-backlog.js ─────────────────
// B-202605-260, R-202605-136
function _generateContextContent() {
  const raw = localStorage.getItem(_tplKey('context-raw'));
  if (!raw) return null;
  const _ctxVer = _effectiveVersion();

  let isJson = false;
  try { const o = JSON.parse(raw.trim()); isJson = typeof o === 'object' && o !== null && 'version' in o; } catch(e) {}
  const ext      = isJson ? 'json' : 'md';
  const mime     = isJson ? 'application/json' : 'text/markdown';
  const fileName = `${_docPrefix()}-CONTEXT_${_ctxVer}.${ext}`;
  return { raw, ext, mime, fileName };
}

export function exportContextMd() {
  const ctx = _generateContextContent();
  if (!ctx) { showToast('warning', 'Sin datos — importa primero'); return; }
  const { raw, mime, fileName } = ctx;

  _showExportConfirmModal('CONTEXT', fileName, () => {
    const b = new Blob([raw], { type: mime });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = fileName;
    a.click(); URL.revokeObjectURL(u);
    _blogLog('exportado', fileName, '', 'context');
    showToast('success', 'CONTEXT exportado');
  });
}

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
window.getProjectById            = getProjectById;
window._getActiveProjectFilter   = _getActiveProjectFilter;
window.pad                       = window.pad || pad;           // T3.bis
window._sprintNum                = _sprintNum;                   // T3.bis
window.exportBacklogMd           = exportBacklogMd;
window.openProjPanel             = openProjPanel;
window.selectProjectFilter       = selectProjectFilter;
window._docPrefix                = _docPrefix;
window.getProjContext            = getProjContext;
window.exportFullHistoryMd       = exportFullHistoryMd;
window._generateFullHistoryContent = _generateFullHistoryContent;
window.exportContextMd           = exportContextMd;
window._countProjSessions        = _countProjSessions;
window._setActiveProjectFilter   = _setActiveProjectFilter;
window._updateProjBreadcrumb     = _updateProjBreadcrumb;
window._updateProjFilterBtn      = _updateProjFilterBtn;
window.setProjContext            = setProjContext;
window._generateBacklogMd        = _generateBacklogMd;
window._generateBacklogContent   = _generateBacklogContent;
window._getLocalStorageUsage     = _getLocalStorageUsage;
window.openProjModal             = openProjModal;
window.closeProjPanel            = closeProjPanel;
window.closeProjModal            = closeProjModal;
// Inline handlers
window.clearProjectFilter        = clearProjectFilter;
window.renderProjPanel           = renderProjPanel;
window.cancelProjForm            = cancelProjForm;
window.selectProjColor           = selectProjColor;
window.confirmProjForm           = confirmProjForm;
window.editProjInline            = editProjInline;
window.toggleProjArchive         = toggleProjArchive;
window.deleteProjConfirm         = deleteProjConfirm;
window.projDragStart             = projDragStart;
window.projDragEnd               = projDragEnd;
window.projDragOver              = projDragOver;
window.projDragLeave             = projDragLeave;
window.projDrop                  = projDrop;
window.createNote                = createNote;
window.editNote                  = editNote;
window.deleteNote                = deleteNote;
window.getActiveProjectNotes     = getActiveProjectNotes;
window.exportSprintsMd           = exportSprintsMd;
