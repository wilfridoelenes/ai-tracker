// [PP] v1.2.4 · sprint:PP-S-09 · mod:11 · autor:Rune · 2026-06-08 UTC-6
// locus-backlog-generator.js
// Responsabilidad: Generación y export de documentos — Backlog, Historial, Sprints, Context.
// Extraído de locus-sprint-project.js — T-202606-016.
// Dependencias: locus-storage.js · locus-backlog-core.js · locus-toast.js
// T-202606-166: _docPrefix movida a locus-storage.js — import actualizado.

import { _blogLog, _docPrefix, _effectiveVersion, _tplKey, getActiveProject, getActiveSprints, getActiveTracker, getState } from './locus-storage.js';
import { getItems, updateBacklogBanner } from './locus-backlog-core.js';
import { showToast } from './locus-toast.js';

// ── Versión canónica para naming de docs exportados ─────────────────────────
// T-202606-022: usa version_target del sprint activo como fuente de verdad.
// Fallback a _effectiveVersion() si no hay sprint activo o no tiene version_target declarado.
function _backlogVersion() {
  const sprints = getActiveSprints();
  const activeSprint = sprints.find(s => s.status === 'active' && s.current === true)
    || sprints.find(s => s.status === 'active');
  const versionTarget = activeSprint && activeSprint.version_target
    ? activeSprint.version_target.trim()
    : null;
  const _src = versionTarget || _effectiveVersion() || 'v0.0.0'; // T-202606-029: fallback canónico
  const m = _src.replace(/^v/, '').match(/^(\d+\.\d+(?:\.\d+)?)/);
  return m ? `v${m[1]}` : 'v0.0.0'; // T-202606-029: fallback canónico ante formato no semver
}

// R-202604-052: sprint cerrado más reciente del proyecto activo
// R-202605-002: usa getActiveSprints() como fuente de verdad v3
function _lastClosedSprint() {
  const sprints = getActiveSprints();
  const closed = sprints.filter(s => s.status === 'closed');
  if (!closed.length) return null;
  return closed.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0))[0];
}

// ── Modal de confirmación de export ─────────────────────────────────────────
function _showExportConfirmModal(label, filename, onConfirm) {
  const overlay = document.getElementById('export-confirm-overlay');
  if (!overlay) return;
  const titleEl = document.getElementById('export-confirm-title');
  const filenameEl = document.getElementById('export-confirm-filename');
  if (titleEl) titleEl.textContent = `⬇ Exportar ${label}`;
  if (filenameEl) filenameEl.textContent = filename;
  overlay.classList.add('open');
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

// ── Export Backlog ───────────────────────────────────────────────────────────
// T-202606-108: verifica si version_target, release_type o scope del sprint activo son n/a o ausentes.
// Retorna true si alguno falla — false si todos están completos o no hay sprint activo (AC-4).
function _sprintHasIncompleteFields() {
  const sprints = getActiveSprints();
  const activeSprint = sprints.find(s => s.status === 'active' && s.current === true)
    || sprints.find(s => s.status === 'active');
  if (!activeSprint) return false; // AC-4: sin sprint activo → no advertir
  const _isEmpty = v => !v || v === 'n/a';
  return _isEmpty(activeSprint.version_target)
    || _isEmpty(activeSprint.release_type)
    || _isEmpty(activeSprint.scope);
}

export function exportBacklogMd() {
  if (!getItems().length) { showToast('warning', 'Sin ítems en el backlog para exportar'); return; }
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  const _doExport = () => _showExportConfirmModal('Backlog', `${pfx}-BACKLOG_${ver}.md`, () => _generateBacklogMd(ver));
  // T-202606-108: AC-1/AC-2 — advertir si sprint activo tiene campos incompletos
  if (_sprintHasIncompleteFields()) {
    showToast(
      'warning',
      'Sprint sin version_target / release_type / scope — el backlog exportado tendrá campos incompletos.',
      'Continuar de todas formas',
      0,        // AC-2: sin auto-dismiss
      _doExport // AC-3: onClick dispara el export
    );
    return;
  }
  _doExport(); // AC-5: sprint completo → export directo sin toast
}

// AC-5: Exportar historial completo — todos los ítems sin filtro generacional
export function exportFullHistoryMd() {
  if (!getItems().length) { showToast('warning', 'Sin ítems en el backlog para exportar'); return; }
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  _showExportConfirmModal('Historial completo', `${pfx}-BACKLOG-FULL_${ver}.md`, () => _generateFullHistoryBySprintMd(ver));
}

// R-202605-132: Export "Por sprint"
function exportSprintsMd() {
  if (!getItems().length) { showToast('warning', 'Sin ítems en el backlog para exportar'); return; }
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  _showExportConfirmModal('Sprints — historial completo', `${pfx}-SPRINTS_${ver}.md`, () => _generateSprintsExportMd(ver));
}

// R-202605-132: genera Markdown por sprint
function _generateSprintsContent(newVersion) {
  const state = getState();
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;
  const pfx = _docPrefix();
  const _activeProj = getActiveProject();
  const _projName = _activeProj ? (_activeProj.name || 'Sin proyecto') : 'Sin proyecto';

  const allSprints = (state && Array.isArray(state.sprints)) ? state.sprints : [];
  const closedSprints = allSprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  const activeSprints = allSprints.filter(s => s.status === 'active');
  const orderedSprints = [...closedSprints, ...activeSprints];

  const _itemRow = (i, sprintOpenedAt) => {
    const effortN = parseInt(i.effort) || 1;
    const effortDots = '●'.repeat(effortN) + '○'.repeat(3 - effortN);
    const typeLabel = i.code ? i.code[0] : '?';
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
    const spItems = getItems().filter(i => i.sprint === sp.id);
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

    const retroBlock = (sp.retroMd || sp.retro)
      ? `\n#### Retrospectiva\n\n${sp.retroMd || sp.retro}\n`
      : '';

    sprintSections += `\n### ${sp.label || sp.name || sp.id}\n\n| Campo | Valor |\n|---|---|\n${metaRows}\n\n${itemsBlock}\n${retroBlock}\n---\n`;
  });

  const noSprintItems = getItems().filter(i => !i.sprint || i.sprint === 'n/a');
  let noSprintSection = '';
  if (noSprintItems.length) {
    noSprintSection = `\n### Sin sprint asignado\n\n${_itemRowHeader()}\n${noSprintItems.map(i => _itemRow(i, 0)).join('\n')}\n\n---\n`;
  }

  const velocityRows = closedSprints.map(sp => {
    const spItems = getItems().filter(i => i.sprint === sp.id);
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
          getItems().filter(i => i.sprint === sp.id && (i.status === 'done' || i.status === 'historico'))
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

// B-202605-515: _generateFullHistoryContent — función pura que retorna el string Markdown
export function _generateFullHistoryContent(newVersion) {
  const state = getState();
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;
  const pfx = _docPrefix();
  const _activeProj = getActiveProject();
  const _projName = _activeProj ? (_activeProj.name || 'Sin proyecto') : 'Sin proyecto';

  const SPRINT_DATA_THRESHOLD = 23;
  const _sprintNum = id => {
    if (!id) return null;
    const m = String(id).match(/S-(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  };

  const allSprints = (state && Array.isArray(state.sprints)) ? state.sprints : [];
  const closedSprints = allSprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  const sprintsWithData = closedSprints.filter(s => (_sprintNum(s.id) || 0) >= SPRINT_DATA_THRESHOLD);
  const legacySprintIds = new Set(
    closedSprints
      .filter(s => (_sprintNum(s.id) || 0) < SPRINT_DATA_THRESHOLD)
      .map(s => s.id)
  );

  const _itemRow = (i, sprintOpenedAt) => {
    const effortN = parseInt(i.effort) || 1;
    const effortDots = '●'.repeat(effortN) + '○'.repeat(3 - effortN);
    const typeLabel = i.code ? i.code[0] : '?';
    let scopeAdded = '';
    if (sprintOpenedAt && i.createdAt) {
      const createdTs = new Date(i.createdAt).getTime();
      if (!isNaN(createdTs) && createdTs > sprintOpenedAt) scopeAdded = ' ⊕';
    }
    return `| \`${i.code}\` | ${i.title || i.desc || '—'} | ${typeLabel} | ${effortDots} (${effortN}) | ${i.status || '—'} |${scopeAdded ? ` _scope added_` : ''} |`;
  };

  const _itemRowHeader = () =>
    `| Código | Título | Tipo | Effort | Status | Nota |\n|--------|--------|------|--------|--------|------|`;

  let sprintSections = '';
  sprintsWithData.forEach(sp => {
    const spItems = getItems().filter(i => i.sprint === sp.id);
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

    const sprintOpenedAt = sp.openedAt || sp.createdAt || 0;
    const itemsBlock = spItems.length
      ? `${_itemRowHeader()}\n${spItems.map(i => _itemRow(i, sprintOpenedAt)).join('\n')}`
      : '_Sin ítems registrados._';

    const retroBlock = (sp.retroMd || sp.retro)
      ? `\n#### Retrospectiva\n\n${sp.retroMd || sp.retro}\n`
      : '';

    sprintSections += `\n### ${sp.label || sp.name || sp.id}\n\n| Campo | Valor |\n|---|---|\n${metaRows}\n\n${itemsBlock}\n${retroBlock}\n---\n`;
  });

  const legacyItems = getItems().filter(i => i.sprint && legacySprintIds.has(i.sprint));
  let legacySection = '';
  if (legacyItems.length) {
    legacySection = `\n### Histórico pre-S-${SPRINT_DATA_THRESHOLD} (sin datos de sprint)\n\n_Ítems de sprints anteriores sin datos de effort registrados._\n\n${_itemRowHeader()}\n${legacyItems.map(i => _itemRow(i, 0)).join('\n')}\n\n---\n`;
  }

  const noSprintItems = getItems().filter(i => !i.sprint || i.sprint === 'n/a');
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
| Total ítems | ${getItems().length} |
| Sprints cerrados con datos | ${sprintsWithData.length} |
| Sprints históricos (pre-S-${SPRINT_DATA_THRESHOLD}) | ${legacySprintIds.size} |
`;

  return md;
}

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

// R-202605-053: bloque ## Sprint activo — primera sección del backlog exportado
function _buildSprintActivoMd() {
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

// R-202604-040: bloque de estado actual
function _buildCurrentStateMd() {
  const state = getState();
  const lines = ['## Estado actual', ''];

  const pendientes = getItems().filter(i => i.status === 'pendiente');
  if (pendientes.length) {
    const byType = {};
    pendientes.forEach(i => {
      if (!i.code) return;
      const t = i.code[0];
      byType[t] = (byType[t] || 0) + 1;
    });
    const pendStr = Object.entries(byType).map(([t, n]) => `${t}=${n}`).join(' | ');
    lines.push(`**Pendientes:** ${pendStr} (${pendientes.length} total)`);
  }

  const allSessions = [];
  (state.projects || []).forEach(p => (p.sessions || []).forEach(s => allSessions.push(s)));
  allSessions.sort((a, b) => parseInt(b.id) - parseInt(a.id));
  const lastWithBlocker = allSessions.find(s => s.bloqueantes);
  if (lastWithBlocker) {
    lines.push(`**Último bloqueante:** ${lastWithBlocker.bloqueantes}`);
    lines.push(`*(registrado: ${lastWithBlocker.date || lastWithBlocker.dateShort || '—'})*`);
  }

  lines.push('', '---', '');
  const hasContent = pendientes.length || lastWithBlocker;
  return hasContent ? lines.join('\n') : '';
}

// T-202606-107: constante de versiones de infraestructura — fuente única para el encabezado de export.
// AC-2: valores declarados aquí, no hardcodeados en el template literal.
// AC-3: helper _infraVersionStr() valida cada campo — undefined/null → 'n/a'.
const INFRA_VERSIONS = {
  infraVersion: 8,
  brCore: '2.1',
  brEcosystem: '3.8',
  brExecution: '2.4',
  obStrategy: '4.3',
};

function _infraVersionStr() {
  const v = f => (f !== undefined && f !== null) ? f : 'n/a';
  return `<!-- **infra_version: ${v(INFRA_VERSIONS.infraVersion)}** | BR-Core v${v(INFRA_VERSIONS.brCore)} · BR-Ecosystem v${v(INFRA_VERSIONS.brEcosystem)} · BR-Execution v${v(INFRA_VERSIONS.brExecution)} · OB-Strategy v${v(INFRA_VERSIONS.obStrategy)} -->`;
}

// ── Generación de contenido Backlog ─────────────────────────────────────────
export function _generateBacklogContent(newVersion, opts = {}) {
  const state = getState();
  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const _activeProj = getActiveProject();
  const _projName = _activeProj ? (_activeProj.name || 'Sin proyecto') : 'Sin proyecto';
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;

  let exportItems;
  if (opts.fullHistory) {
    exportItems = getItems();
  } else {
    const lastClosed = _lastClosedSprint();
    const lastClosedId = lastClosed ? lastClosed.id : null;
    const activeSprint = (state.sprints || []).find(s => s.status === 'active');
    const activeSprintId = activeSprint ? activeSprint.id : null;
    exportItems = getItems().filter(i => {
      if (i.status === 'historico') return false;
      if (i.status === 'pendiente' || i.status === 'en curso') return true;
      if (i.status === 'done' && lastClosedId && i.sprint === lastClosedId) return true;
      if (activeSprintId && i.sprint === activeSprintId &&
          (i.status === 'done' || i.status === 'descartado')) return true;
      return false;
    });
  }

  const counters = { P:0, T:0, R:0, B:0 };
  getItems().forEach(i => {
    if (!i.code) return;
    const t = i.code[0];
    const m = i.code.match(/[PITRB]-\d{6}-(\d{3})/);
    if (m) { const n = parseInt(m[1]); if (n > counters[t]) counters[t] = n; }
  });
  const activeCounters = getActiveTracker().counters || {};
  Object.keys(activeCounters).forEach(t => {
    if (activeCounters[t] > (counters[t] || 0)) counters[t] = activeCounters[t];
  });
  const counterStr = `P=${String(counters.P).padStart(3,'0')} | T=${String(counters.T).padStart(3,'0')} | R=${String(counters.R).padStart(3,'0')} | B=${String(counters.B).padStart(3,'0')}`;

  const statusMap = {};
  exportItems.forEach(i => { statusMap[i.code] = { status: i.status, sprint: i.sprint || '' }; });
  const indexLines = _buildIndexLines(statusMap);

  const itemsMd = _buildItemsMd(exportItems);

  const totalItems = exportItems.length;
  const doneCount = exportItems.filter(i => i.status === 'done').length;
  const backlogCount = exportItems.filter(i => i.status === 'backlog').length;
  const enRevisionCount = exportItems.filter(i => i.status === 'en-revision').length; // T-202606-110

  const currentStateMd = _buildCurrentStateMd();
  const sprintActivoMd = _buildSprintActivoMd();
  const _appVerStr = _effectiveVersion();
  const pfx = _docPrefix();

  const md = `# ${pfx}-BACKLOG_${newVersion}.md
<!-- Versión: ${newVersion} | Última actualización: ${dateStr} | App: AI-Tracker-${_appVerStr} -->
${_infraVersionStr()}

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
| En revisión | ${enRevisionCount} |
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

  meta.version = newVersion;
  meta.updated = dateStr;
  meta.counters = counters;
  localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
  updateBacklogBanner();

  showToast('download', `📥 ${pfx}-BACKLOG_${newVersion}.md descargado`);
}

function _buildIndexLines(itemMap) {
  const groups = { T: [], R: [], B: [], P: [], '?': [] };
  Object.keys(itemMap).forEach(code => {
    const t = code[0];
    const entry = itemMap[code];
    const status = typeof entry === 'string' ? entry : (entry.status || '—');
    const sprint = typeof entry === 'object' ? (entry.sprint || '') : '';
    if (groups[t]) {
      groups[t].push({ code, status, sprint });
    } else {
      groups['?'].push({ code, status, sprint });
    }
  });
  const lines = [];
  Object.keys(groups).forEach(t => {
    if (!groups[t].length) return;
    groups[t].sort((a, b) => a.code.localeCompare(b.code));
    const chunks = [];
    for (let i = 0; i < groups[t].length; i += 6) chunks.push(groups[t].slice(i, i+6));
    const label = t === '?' ? 'Sin código asignado' : t;
    chunks.forEach(chunk => {
      lines.push(label + ': ' + chunk.map(x => {
        const sprintTag = x.sprint ? ` [${x.sprint}]` : '';
        return `${x.code} ${x.status}${sprintTag}`;
      }).join(' | '));
    });
  });
  return lines.join('\n');
}

// T-202606-017: determina si un T tiene bloqueo activo.
// Un T está bloqueado cuando al menos un código en depends_on apunta a un T
// cuyo status es 'pendiente' o 'en-revision'. 'descartado' equivale a done — no bloquea.
function _isItemBlocked(item) {
  if (!item.depends_on || !item.depends_on.length) return { blocked: false, blockers: [] };
  const blockers = [];
  item.depends_on.forEach(depCode => {
    const dep = getItems().find(i => i.code === depCode);
    if (!dep) return; // código no resuelto — no bloquea
    const s = dep.status || 'pendiente';
    if (s === 'pendiente' || s === 'en-revision') blockers.push(depCode);
    // 'done', 'descartado', 'historico' — no bloquean
  });
  return { blocked: blockers.length > 0, blockers };
}

// T-202606-017: genera los campos de un ítem sin el encabezado de título.
// T-202606-109: campos no canónicos movidos a bloque metadata al final.
//   Campos nuevos: schema_version (AC-2), depends_on array vacío (AC-3), no_incluye (AC-4), intencion (AC-5).
//   AC-3: campo canónico verificado = depends_on (snake_case).
function _buildItemFieldsMd(item, state) {
  let md = '';
  md += `**Priority:** ${item.priority || 'medium'}\n`;
  const _area = (item.area || '').includes('**') ? '' : (item.area || '').trim();
  md += `**Area:** ${_area}\n`;
  md += `**Effort:** ${item.effort || 1}\n`;
  md += `**Status:** ${item.status || 'pendiente'}\n`;
  if (item.schema_version != null) md += `**SchemaVersion:** ${item.schema_version}\n`; // AC-2
  if (item.discardReason) md += `**DiscardReason:** ${item.discardReason}\n`;
  if (item.discardRef)    md += `**DiscardRef:** ${item.discardRef}\n`;
  if (item.sprint) {
    const _sprintObj = (state.sprints || []).find(s => s.id === item.sprint);
    const _sprintLabel = _sprintObj ? (_sprintObj.name || item.sprint) : item.sprint;
    md += `**SprintId:** ${item.sprint}\n`;
    md += `**Sprint:** ${_sprintLabel}\n`;
  }
  if (item.role)     md += `**Role:** ${item.role}\n`;
  if (item.parentId) md += `**ParentId:** ${item.parentId}\n`;
  // AC-3: depends_on snake_case — emitir siempre en Ts (array vacío → DependsOn: [])
  if (item.depends_on != null) {
    md += `**DependsOn:** ${item.depends_on.length ? item.depends_on.join(', ') : '[]'}\n`;
  }
  if (item.origin)   md += `**Origin:** ${item.origin}\n`;
  if (item.blockedBy && item.blockedBy.length) md += `**BlockedBy:** ${item.blockedBy.join(', ')}\n`;
  if (item.archivos && item.archivos.length)   md += `**Archivos:** ${item.archivos.join(', ')}\n`;
  if (item.desc)     md += `\n${item.desc}\n`;
  // AC-5: bloque intencion estructurado — solo si existe
  if (item.intencion) {
    md += `\n**Intención:**\n`;
    if (item.intencion.problema)    md += `- Problema: ${item.intencion.problema}\n`;
    if (item.intencion.done_cuando) md += `- Done cuando: ${item.intencion.done_cuando}\n`;
    if (item.intencion.no_incluye)  md += `- No incluye: ${item.intencion.no_incluye}\n`;
  }
  // AC-4: no_incluye como lista — solo si existe y tiene elementos
  if (item.no_incluye && item.no_incluye.length) {
    md += `\n**No incluye:**\n`;
    item.no_incluye.forEach(n => { md += `- ${n}\n`; });
  }
  if (item.ac && item.ac.length) {
    md += `\n### Criterios de aceptación\n`;
    item.ac.forEach(c => {
      const checked = item.status === 'done' ? 'x' : ' ';
      md += `- [${checked}] ${c}\n`;
    });
  }
  if (item.notes) md += `\n**Notes:** ${item.notes}\n`;
  // AC-1: createdAt, statusChangedAt, impact, version → bloque metadata al final
  const _metaParts = [];
  if (item.createdAt)       _metaParts.push(`CreatedAt:${item.createdAt}`);
  if (item.statusChangedAt) _metaParts.push(`StatusChangedAt:${item.statusChangedAt}`);
  if (item.impact)          _metaParts.push(`Impact:${item.impact}`);
  if (item.version)         _metaParts.push(`Version:${item.version}`);
  if (item.doneAt)          _metaParts.push(`DoneAt:${item.doneAt}`);
  if (_metaParts.length)    md += `<!-- metadata: ${_metaParts.join(' · ')} -->\n`;
  return md;
}

// T-202606-017: estructura nueva — Rs como headers H3 con Ts anidados (H4) e indicadores de bloqueo.
function _buildItemsMd(items) {
  const state = getState();
  const src = items || getItems();

  // Índice de Ts por parentId para lookup O(1)
  const tsByParent = {};
  src.forEach(i => {
    if (!i.code || i.code[0] !== 'T') return;
    const pid = i.parentId || i.parent;
    if (!pid) return;
    if (!tsByParent[pid]) tsByParent[pid] = [];
    tsByParent[pid].push(i);
  });

  // Ts con parent declarado — se renderizan bajo su R, no en la lista plana
  const tsWithParent = new Set(
    src.filter(i => i.code && i.code[0] === 'T' && (i.parentId || i.parent))
       .map(i => i.code)
  );

  const sections = [];

  src.forEach(item => {
    if (!item.code) return;
    const type = item.code[0];

    // Ts con parent — se renderizan bajo su R
    if (type === 'T' && tsWithParent.has(item.code)) return;

    if (type === 'R') {
      // ── R como header H3 con Ts anidados ──────────────────────────────
      let md = `### ${item.code} · ${item.title || item.desc || '(sin título)'}\n`;
      md += _buildItemFieldsMd(item, state);

      const children = tsByParent[item.code] || [];
      if (children.length) {
        md += `\n#### Tickets\n\n`;
        children.forEach(t => {
          const { blocked, blockers } = _isItemBlocked(t);
          const blockerTag = blocked ? ` ⚠ bloqueado por ${blockers.join(', ')}` : '';
          md += `##### ${t.code} · ${t.title || t.desc || '(sin título)'}${blockerTag}\n`;
          md += _buildItemFieldsMd(t, state);
          md += '\n';
        });
      }
      sections.push(md);

    } else if (type === 'T') {
      // ── T huérfano (sin R padre) ───────────────────────────────────────
      const { blocked, blockers } = _isItemBlocked(item);
      const blockerTag = blocked ? ` ⚠ bloqueado por ${blockers.join(', ')}` : '';
      let md = `### ${item.code} · ${item.title || item.desc || '(sin título)'}${blockerTag}\n`;
      md += _buildItemFieldsMd(item, state);
      sections.push(md);

    } else {
      // ── P y B ─────────────────────────────────────────────────────────
      let md = `### ${item.code} · ${item.title || item.desc || '(sin título)'}\n`;
      md += _buildItemFieldsMd(item, state);
      sections.push(md);
    }
  });

  return sections.join('\n---\n\n');
}

// ── Context export ────────────────────────────────────────────────────────────
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

// ── Exposición pública — compatibilidad con locus-api.js ─────────────────────
window.exportBacklogMd             = exportBacklogMd;
window.exportFullHistoryMd         = exportFullHistoryMd;
window._generateFullHistoryContent = _generateFullHistoryContent;
window.exportContextMd             = exportContextMd;
window._generateBacklogMd          = _generateBacklogMd;
window._generateBacklogContent     = _generateBacklogContent;
window.exportSprintsMd             = exportSprintsMd;
