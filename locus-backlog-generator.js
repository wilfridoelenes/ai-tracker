// [PP] v0.3.0 · sprint:PP-S-01 · mod:16 · autor:Rune · 2026-06-12 UTC-6
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
  // T-202606-069: separador canónico punto — reemplazar _ por . en segmento de versión
  const _canonVer = ver => ver.replace(/_/g, '.');
  const _doExport = () => _showExportConfirmModal('Backlog', `${pfx}-BACKLOG_${_canonVer(ver)}.md`, () => _generateBacklogMd(ver));
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
  const _canonVer2 = v => v.replace(/_/g, '.');
  _showExportConfirmModal('Historial completo', `${pfx}-BACKLOG-FULL_${_canonVer2(ver)}.md`, () => _generateFullHistoryBySprintMd(ver));
}

// R-202605-132: Export "Por sprint"
function exportSprintsMd() {
  if (!getItems().length) { showToast('warning', 'Sin ítems en el backlog para exportar'); return; }
  const pfx = _docPrefix();
  const ver = _backlogVersion();
  const _canonVer3 = v => v.replace(/_/g, '.');
  _showExportConfirmModal('Sprints — historial completo', `${pfx}-SPRINTS_${_canonVer3(ver)}.md`, () => _generateSprintsExportMd(ver));
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

  const md = `# ${pfx}-SPRINTS_${newVersion.replace(/_/g, ".")}.md
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
  a.download = `${pfx}-SPRINTS_${newVersion.replace(/_/g, ".")}.md`; // T-202606-069
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

  const md = `# ${pfx}-BACKLOG-FULL_${newVersion.replace(/_/g, ".")}.md
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
  a.download = `${pfx}-BACKLOG-FULL_${newVersion.replace(/_/g, ".")}.md`; // T-202606-069
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
    `| sprint_id | ${currentSprint.id} |`,
    `| sprint_name | ${currentSprint.name || currentSprint.label || 'n/a'} |`,
    `| status | ${currentSprint.status} |`,
    `| version_target | ${currentSprint.version_target || 'n/a'} |`,
    `| release_type | ${currentSprint.release_type || 'n/a'} |`,
    `| scope | ${currentSprint.scope || 'n/a'} |`,
    // T-202606-067: campo goal — 'n/a' si no declarado + warn en consola
    (() => {
      if (!currentSprint.goal) {
        console.warn(`[locus-backlog-generator] Sprint ${currentSprint.id} sin goal declarado — exportando como n/a`);
        return `| goal | n/a |`;
      }
      return `| goal | ${currentSprint.goal} |`;
    })(),
    '',
    '---',
    '',
  ];
  return lines.join('\n');
}

// T-202606-060: sección ## Sprints programados — solo si existen sprints con status 'programado'.
// Campos: Sprint · Orden activación · Ítems asignados (R=N · T=N · B=N) · Effort total · Adelantados.
// Se omite completamente si no hay sprints programados.
// Aparece después de ## Sprint activo y antes de ## Meta.
function _buildSprintsProgramadosMd() {
  const sprints = getActiveSprints();
  const programados = sprints.filter(s => s.status === 'programado' || s.status === 'scheduled');
  if (!programados.length) return '';

  const allItems = getItems();

  // Orden de activación: si el objeto sprint tiene campo de orden, usarlo; sino usar posición en array
  const rows = programados.map((sp, idx) => {
    const spItems = allItems.filter(i => {
      if (!i.sprint) return false;
      const m = String(i.sprint).match(/^([A-Za-z]+-S-?\d+)/i);
      const normId = m ? m[1] : i.sprint;
      return normId === sp.id;
    });
    const rCount = spItems.filter(i => i.code && i.code.startsWith('R-')).length;
    const tCount = spItems.filter(i => i.code && i.code.startsWith('T-')).length;
    const bCount = spItems.filter(i => i.code && i.code.startsWith('B-')).length;
    const effortTotal = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const doneCount = spItems.filter(i => i.status === 'done').length;

    const orden = sp.activationOrder != null ? sp.activationOrder : (idx + 1);
    const label = sp.label || sp.name || sp.id;
    return `| ${label} | ${orden} | R=${rCount} · T=${tCount} · B=${bCount} | ${effortTotal} | ${doneCount} done |`;
  });

  return [
    '## Sprints programados',
    '',
    '| Sprint | Orden activación | Ítems asignados | Effort total | Adelantados |',
    '|--------|-----------------|-----------------|--------------|-------------|',
    ...rows,
    '',
    '---',
    '',
  ].join('\n');
}


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
  infraVersion: 17, // B-202606-015
  brCore: '2.2',
  brEcosystem: '3.15',
  brExecution: '2.6',
  obStrategy: '4.7',
};

function _infraVersionStr() {
  const v = f => (f !== undefined && f !== null) ? f : 'n/a';
  return `<!-- **infra_version: ${v(INFRA_VERSIONS.infraVersion)}** | BR-Core v${v(INFRA_VERSIONS.brCore)} · BR-Ecosystem v${v(INFRA_VERSIONS.brEcosystem)} · BR-Execution v${v(INFRA_VERSIONS.brExecution)} · OB-Strategy v${v(INFRA_VERSIONS.obStrategy)} -->`;
}

// ── Generación de contenido Backlog ─────────────────────────────────────────
// T-202606-149: ## Historial de sprints — sección del backlog exportado
// Entrada: sprints cerrados de getActiveSprints(). Salida: bloque Markdown con entrada por sprint.
// Sin sprints cerrados: sección presente con texto `(sin sprints cerrados)`.
// Formato: ### [Prefijo]-S-XX · [Nombre] | version_target: vX.X.X | cerrado: YYYY-MM-DD
//          scope: [descripción]
function _buildSprintHistorialMd() {
  const pad = n => String(n).padStart(2, '0');
  const sprints = getActiveSprints();
  const closed = sprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  if (!closed.length) {
    return `## Historial de sprints\n\n(sin sprints cerrados)\n`;
  }

  const lines = closed.map(sp => {
    const name = sp.label || sp.name || sp.id;
    const vt = sp.version_target ? sp.version_target.trim() : '—';
    const closedDate = sp.closedAt
      ? (() => { const d = new Date(sp.closedAt); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })()
      : '—';
    const scope = (sp.scope && sp.scope.trim()) ? sp.scope.trim() : '—';
    return `### ${sp.id} · ${name} | version_target: ${vt} | cerrado: ${closedDate}\n\nscope: ${scope}\n`;
  });

  return `## Historial de sprints\n\n${lines.join('\n---\n\n')}\n`;
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

  let exportItems;
  if (opts.fullHistory) {
    exportItems = getItems();
  } else {
    const lastClosed = _lastClosedSprint();
    const lastClosedId = lastClosed ? lastClosed.id : null;
    const activeSprint = (state.sprints || []).find(s => s.status === 'active');
    const activeSprintId = activeSprint ? activeSprint.id : null;
    // B-202606-014: normalizar ID de sprint — i.sprint puede almacenarse como label completo
    // ("PP-S-01 · ESM Migration...") en lugar del ID canónico ("PP-S-01").
    // Extraer solo el segmento "[Prefijo]-S-XX" antes de comparar.
    const _normSprintId = val => {
      if (!val) return val;
      const m = String(val).match(/^([A-Za-z]+-S\d+)/i); // T-202606-063: guion canónico obligatorio — sin '?'
      return m ? m[1] : val;
    };
    const _normActiveSprintId = _normSprintId(activeSprintId);
    const _normLastClosedId   = _normSprintId(lastClosedId);
    // Pre-computar set de Rs activos para regla de hijos (T/B con parent en R no cerrado)
    const allItems = getItems();
    const activeRCodes = new Set(
      allItems
        .filter(i => i.code && i.code.startsWith('R-') && i.status !== 'done' && i.status !== 'descartado')
        .map(i => i.code)
    );
    // T-202606-058: pre-computar set de Ts hijos de Rs activos para Regla 3
    const activeTCodes = new Set(
      allItems
        .filter(i => i.code && i.code.startsWith('T-') &&
          activeRCodes.has(i.parentId || i.parent))
        .map(i => i.code)
    );
    exportItems = allItems.filter(i => {
      if (i.status === 'historico') return false;
      if (i.status === 'en curso') return false; // B-202606-052: status no canónico — fuera de BR-Ecosystem §5
      // Regla 1: status activos directos — incluye en-revision
      if (i.status === 'pendiente' || i.status === 'en-revision') return true;
      // Regla 2: hijos (T o B) de R activo — exportar sin importar su status
      if ((i.code && (i.code.startsWith('T-') || i.code.startsWith('B-'))) &&
          (i.parentId || i.parent) && activeRCodes.has(i.parentId || i.parent)) return true;
      // Regla 3 (T-202606-058): B con triggered_by apuntando a T del R activo y status pendiente o en-revision
      if (i.code && i.code.startsWith('B-') &&
          (i.status === 'pendiente' || i.status === 'en-revision') &&
          i.triggered_by && activeTCodes.has(i.triggered_by)) return true;
      // Sprint cerrado más reciente: ítems done
      // B-202606-014: normalizar i.sprint antes de comparar
      if (i.status === 'done' && _normLastClosedId && _normSprintId(i.sprint) === _normLastClosedId) return true;
      // Sprint activo: ítems done o descartados
      // B-202606-014: normalizar i.sprint antes de comparar
      if (_normActiveSprintId && _normSprintId(i.sprint) === _normActiveSprintId &&
          (i.status === 'done' || i.status === 'descartado')) return true;
      return false;
    });
  }

  // T-202606-068: _computeBacklogCounters — fuente única para itemCounters y counters (max-ID).
  // Los tres bloques (Estado actual · Índice · Estadísticas) derivan de esta misma llamada.
  const _computeBacklogCounters = () => {
    const allForCount = getItems();
    const itemC = { P:0, T:0, R:0, B:0 };
    const maxId  = { P:0, T:0, R:0, B:0 };
    allForCount.forEach(i => {
      if (!i.code) return;
      const t = i.code[0];
      if (itemC[t] !== undefined) itemC[t]++;
      const m = i.code.match(/[PITRB]-\d{6}-(\d{3})/);
      if (m) { const n = parseInt(m[1]); if (n > maxId[t]) maxId[t] = n; }
    });
    const activeC = getActiveTracker().counters || {};
    Object.keys(activeC).forEach(t => {
      if (activeC[t] > (maxId[t] || 0)) maxId[t] = activeC[t];
    });
    return { itemC, maxId };
  };
  const { itemC: itemCounters, maxId: counters } = _computeBacklogCounters();
  const itemCounterStr = `P=${itemCounters.P} | T=${itemCounters.T} | R=${itemCounters.R} | B=${itemCounters.B}`;
  const counterStr = `P=${String(counters.P).padStart(3,'0')} | T=${String(counters.T).padStart(3,'0')} | R=${String(counters.R).padStart(3,'0')} | B=${String(counters.B).padStart(3,'0')}`;

  const statusMap = {};
  exportItems.forEach(i => { statusMap[i.code] = { status: i.status, sprint: i.sprint || '' }; });
  const indexLines = _buildIndexLines(statusMap);

  // T-202606-061: orden canónico OBDS §3 §6 en ## Ítems
  // (1) Rs sprint activo + hijos, (2) T/B sprint activo huérfanos,
  // (3) Rs sprints programados/otros + hijos, (4) Rs icebox + hijos, (5) Ps icebox
  const _normSprintIdForSort = val => {
    if (!val) return null;
    const m = String(val).match(/^([A-Za-z]+-S-?\d+)/i);
    return m ? m[1] : val;
  };
  const _activeSprintIdForSort = (() => {
    const sp = (state.sprints || []).find(s => s.status === 'active' && s.current === true)
            || (state.sprints || []).find(s => s.status === 'active');
    return sp ? sp.id : null;
  })();
  const _programadosIdsForSort = new Set(
    (state.sprints || [])
      .filter(s => s.status === 'programado' || s.status === 'scheduled')
      .map(s => s.id)
  );
  const _sprintGroup = item => {
    const normId = _normSprintIdForSort(item.sprint);
    if (normId && normId === _activeSprintIdForSort) return 0;   // sprint activo
    if (normId && _programadosIdsForSort.has(normId)) return 1;  // programado
    if (!normId || item.sprint === 'icebox') return 2;           // icebox
    return 1; // sprint asignado no activo ni icebox → grupo otros
  };
  const _typeOrder = code => {
    if (!code) return 4;
    if (code[0] === 'R') return 0;
    if (code[0] === 'T') return 1;
    if (code[0] === 'B') return 2;
    if (code[0] === 'P') return 3;
    return 4;
  };
  const sortedExportItems = [...exportItems].sort((a, b) => {
    const ga = _sprintGroup(a), gb = _sprintGroup(b);
    if (ga !== gb) return ga - gb;
    return _typeOrder(a.code) - _typeOrder(b.code);
  });

  const { mainMd, orphansMd } = _buildItemsMd(sortedExportItems);

  const totalItems = exportItems.length;
  const doneCount = exportItems.filter(i => i.status === 'done').length;
  const backlogCount = exportItems.filter(i => i.status === 'backlog').length;
  const enRevisionCount = exportItems.filter(i => i.status === 'en-revision').length; // T-202606-110

  const currentStateMd = _buildCurrentStateMd();
  const sprintActivoMd = _buildSprintActivoMd();
  const sprintsProgramadosMd = _buildSprintsProgramadosMd(); // T-202606-060
  const _appVerStr = _effectiveVersion();
  const pfx = _docPrefix();

  const md = `# ${pfx}-BACKLOG_${newVersion.replace(/_/g, ".")}.md
<!-- Versión: ${newVersion} | Última actualización: ${dateStr} | App: AI-Tracker-${_appVerStr} -->
${_infraVersionStr()}

---

${sprintActivoMd}${sprintsProgramadosMd}## Meta

| Campo | Valor |
|---|---|
| Proyecto | ${_projName} |
| Versión del backlog | ${newVersion} |
| Última actualización | ${dateStr} |
| Generado por | Locus — exportado desde app |

---

${currentStateMd}## Índice de estado

\`\`\`
${indexLines}
Ítems: ${itemCounterStr}
Últimos IDs: ${counterStr}
App: ${_appVerStr} — exportado desde tracker
\`\`\`

---

## Ítems

---

${mainMd}

---

${orphansMd ? `## Ítems huérfanos\n\n> Ts y Bs sin parent declarado — requieren revisión de Cael antes del próximo sprint.\n\n---\n\n${orphansMd}\n\n---\n\n` : ''}${_buildSprintHistorialMd()}
---

## Estadísticas finales

| Métrica | Valor |
|---------|-------|
| Ítems totales | ${totalItems} |
| Done | ${doneCount} |
| En revisión | ${enRevisionCount} |
| Pendientes | ${exportItems.filter(i => i.status === 'pendiente').length} |
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
  a.download = `${pfx}-BACKLOG_${newVersion.replace(/_/g, ".")}.md`; // T-202606-069: separador canónico
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
        const sprintTag = x.sprint ? ` [${String(x.sprint).split(' · ')[0]}]` : '';
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
// T-202606-071: campos calculados para Ts y Bs del sprint activo.
// Entrada: item (T o B), sessions (array flat de todas las sesiones del proyecto activo).
// Retorna objeto con last_checkpoint, last_mod, gap_activo, qa_iteracion — ausente si no aplica.
function _computeCalcFields(item, sessions) {
  if (!item.code) return {};
  const code = item.code;

  // Sesiones que referencian este ítem — ordenadas cronológicamente ascendente por id numérico
  const refs = sessions
    .filter(s => Array.isArray(s.trackerRefs) && s.trackerRefs.includes(code))
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));

  if (!refs.length) return {};

  const result = {};

  // last_checkpoint: título de la sesión más reciente con trackerRefs que incluye el código
  const lastRef = refs[refs.length - 1];
  if (lastRef.title) result.last_checkpoint = lastRef.title;

  // last_mod: 'mod:N · autor:Rol' del primer objeto archivos de la sesión más reciente con archivos no vacío
  const lastWithArchivos = [...refs].reverse().find(s => Array.isArray(s.archivos) && s.archivos.length > 0);
  if (lastWithArchivos) {
    const first = lastWithArchivos.archivos[0];
    if (first && first.mod !== undefined && first.autor) {
      result.last_mod = `mod:${first.mod} · autor:${first.autor}`;
    }
  }

  // gap_activo — señal primaria: devolucion_cael explícita
  const refsWithDC = refs.filter(s => s.devolucion_cael !== undefined && s.devolucion_cael !== null);
  if (refsWithDC.length > 0) {
    // Usar la sesión más reciente con devolucion_cael declarado
    const lastDC = [...refsWithDC].sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const latestDC = lastDC[lastDC.length - 1];
    if (latestDC.devolucion_cael === true) {
      // true: verificar si hay sesión posterior con rol PO
      const laterPO = refs.find(s =>
        parseInt(s.id) > parseInt(latestDC.id) &&
        typeof s.rol === 'string' && s.rol.startsWith('PO')
      );
      result.gap_activo = !laterPO;
    } else {
      result.gap_activo = false;
    }
  } else {
    // Fallback: sin devolucion_cael en ninguna sesión del ítem
    const lastSess = refs[refs.length - 1];
    const isLastQA = typeof lastSess.rol === 'string' && lastSess.rol.startsWith('QA');
    const hasPriorPO = refs.some(s =>
      s !== lastSess &&
      typeof s.rol === 'string' && s.rol.startsWith('PO')
    );
    result.gap_activo = isLastQA && hasPriorPO;
  }

  // qa_iteracion: conteo de sesiones con rol que comienza con 'QA'
  const qaCount = refs.filter(s => typeof s.rol === 'string' && s.rol.startsWith('QA')).length;
  if (qaCount > 0) result.qa_iteracion = qaCount;

  return result;
}

function _buildItemFieldsMd(item, state) {
  let md = '';
  md += `**Priority:** ${item.priority || 'medium'}\n`;
  const _area = (item.area || '').includes('**') ? '' : (item.area || '').trim();
  md += `**Area:** ${_area}\n`;
  md += `**Effort:** ${item.effort || 1}\n`;
  md += `**Status:** ${item.status || 'pendiente'}\n`;
  md += `**SchemaVersion:** 2\n`; // T-202606-065: siempre schema_version 2 — independiente del valor en storage
  if (item.discardReason) md += `**DiscardReason:** ${item.discardReason}\n`;
  if (item.discardRef)    md += `**DiscardRef:** ${item.discardRef}\n`;
  if (item.sprint) {
    // T-202606-067: Ps siempre exportan con sprint: icebox — independiente del valor en storage
    const _sprintVal = (item.code && item.code[0] === 'P') ? 'icebox' : item.sprint;
    // T-202606-086: split en sprint_id / sprint_name — campo Sprint legacy eliminado
    const _sprintParts = String(_sprintVal).split(' · ');
    const _sprintId = _sprintParts[0];
    const _sprintName = _sprintParts.length > 1 ? _sprintParts.slice(1).join(' · ') : '';
    md += `**SprintId:** ${_sprintId}\n`;
    if (_sprintId !== 'icebox' && _sprintName) md += `**SprintName:** ${_sprintName}\n`;
  }
  if (item.role)     md += `**Role:** ${item.role}\n`;
  if (item.parentId) md += `**ParentId:** ${item.parentId}\n`;
  // T-202606-065: depends_on — emitir siempre en Ts con [] si no existe
  if (item.code && item.code[0] === 'T') {
    const _deps = Array.isArray(item.depends_on) ? item.depends_on : [];
    md += `**DependsOn:** ${_deps.length ? _deps.join(', ') : '[]'}\n`;
  } else if (item.depends_on != null) {
    md += `**DependsOn:** ${item.depends_on.length ? item.depends_on.join(', ') : '[]'}\n`;
  }
  if (item.origin)   md += `**Origin:** ${item.origin}\n`;
  if (item.blockedBy && item.blockedBy.length) md += `**BlockedBy:** ${item.blockedBy.join(', ')}\n`;
  // T-202606-065: triggered_by — emitir siempre en Bs con n/a si no existe
  if (item.code && item.code[0] === 'B') {
    md += `**TriggeredBy:** ${item.triggered_by || 'n/a'}\n`;
  }
  if (item.archivos && item.archivos.length)   md += `**Archivos:** ${item.archivos.join(', ')}\n`;
  if (item.desc)     md += `\n${item.desc}\n`;
  // AC-5: bloque intencion estructurado — solo si existe
  if (item.intencion) {
    md += `\n**Intención:**\n`;
    if (item.intencion.problema)    md += `- Problema: ${item.intencion.problema}\n`;
    if (item.intencion.done_cuando) md += `- Done cuando: ${item.intencion.done_cuando}\n`;
    if (item.intencion.no_incluye)  md += `- No incluye: ${item.intencion.no_incluye}\n`;
  }
  // T-202606-065: no_incluye — emitir siempre en Ts. Lista si existe, 'n/a' si no.
  if (item.code && item.code[0] === 'T') {
    if (item.no_incluye && item.no_incluye.length) {
      md += `\n**No incluye:**\n`;
      item.no_incluye.forEach(n => { md += `- ${n}\n`; });
    } else {
      md += `\n**No incluye:** n/a\n`;
    }
  }
  if (item.ac && item.ac.length) {
    md += `\n### Criterios de aceptación\n`;
    item.ac.forEach(c => {
      const checked = item.status === 'done' ? 'x' : ' ';
      md += `- [${checked}] ${c}\n`;
    });
  }
  if (item.notes) md += `\n**Notes:** ${item.notes}\n`;
  // T-202606-071: campos calculados — solo Ts y Bs del sprint activo (no icebox, no R, no P)
  if (item.code && (item.code[0] === 'T' || item.code[0] === 'B') && item.sprint && item.sprint !== 'icebox') {
    const _activeSprint = (state.sprints || []).find(s => s.status === 'active');
    const _activeSprintId = _activeSprint ? _activeSprint.id : null;
    const _normSId = val => {
      if (!val) return val;
      const m = String(val).match(/^([A-Za-z]+-S\d+)/i);
      return m ? m[1] : val;
    };
    if (_activeSprintId && _normSId(item.sprint) === _normSId(_activeSprintId)) {
      const _activeProj = getActiveProject();
      const _allSessions = _activeProj ? (_activeProj.sessions || []) : [];
      const calc = _computeCalcFields(item, _allSessions);
      const _calcParts = [];
      if (calc.last_checkpoint !== undefined) _calcParts.push(`LastCheckpoint:${calc.last_checkpoint}`);
      if (calc.last_mod        !== undefined) _calcParts.push(`LastMod:${calc.last_mod}`);
      if (calc.gap_activo      !== undefined) _calcParts.push(`GapActivo:${calc.gap_activo}`);
      if (calc.qa_iteracion    !== undefined) _calcParts.push(`QaIteracion:${calc.qa_iteracion}`);
      if (_calcParts.length) md += `<!-- calc: ${_calcParts.join(' · ')} -->\n`;
    }
  }
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
// T-202606-059: retorna { mainMd, orphansMd } — orphansMd contiene T y B sin parent declarado.
//   orphansMd es string vacío cuando no hay huérfanos.
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

    // T-202606-064: AC-1 — triggerBSet: Bs en src sin parentId con triggered_by apuntando a T hijo de R activo.
  // activeTCodes proviene de _generateBacklogContent via el array ya filtrado en exportItems —
  // reconstruimos el set localmente desde src para que _buildItemsMd sea autónoma.
  const _activeTCodesLocal = (() => {
    const activeRCodesLocal = new Set(
      src
        .filter(i => i.code && i.code.startsWith('R-') && i.status !== 'done' && i.status !== 'descartado')
        .map(i => i.code)
    );
    return new Set(
      src
        .filter(i => i.code && i.code.startsWith('T-') &&
          activeRCodesLocal.has(i.parentId || i.parent))
        .map(i => i.code)
    );
  })();
  const triggerBSet = new Set(
    src
      .filter(i => i.code && i.code[0] === 'B' &&
        !(i.parentId || i.parent) &&
        i.triggered_by && _activeTCodesLocal.has(i.triggered_by))
      .map(i => i.code)
  );

  // T-202606-059: AC-1 — huérfanos: T o B en src sin parentId y sin parent declarado
  // T-202606-064: AC-3 — Bs en triggerBSet excluidos de orphanCodes
  const orphanCodes = new Set(
    src
      .filter(i => i.code &&
        (i.code[0] === 'T' || i.code[0] === 'B') &&
        !(i.parentId || i.parent) &&
        !triggerBSet.has(i.code))
      .map(i => i.code)
  );

  const sections = [];
  const orphanSections = [];

  src.forEach(item => {
    if (!item.code) return;
    const type = item.code[0];

    // Ts con parent — se renderizan bajo su R
    if (type === 'T' && tsWithParent.has(item.code)) return;

    // T-202606-059: AC-2 — huérfanos excluidos del loop normal, acumulados en orphanSections
    if (orphanCodes.has(item.code)) {
      const { blocked, blockers } = type === 'T' ? _isItemBlocked(item) : { blocked: false, blockers: [] };
      const blockerTag = blocked ? ` ⚠ bloqueado por ${blockers.join(', ')}` : '';
      let md = `### ${item.code} · ${item.title || item.desc || '(sin título)'}${blockerTag}\n`;
      md += _buildItemFieldsMd(item, state);
      orphanSections.push(md);
      return;
    }

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
      // T-202606-064: AC-2 — Bs en triggerBSet cuyo triggered_by apunta a T hijo de este R
      // se renderizan después del último T hijo, bajo el mismo encabezado del R
      const triggerBsForR = src.filter(i =>
        triggerBSet.has(i.code) &&
        i.triggered_by && _activeTCodesLocal.has(i.triggered_by) &&
        (tsByParent[item.code] || []).some(t => t.code === i.triggered_by)
      );
      if (triggerBsForR.length) {
        if (!children.length) md += `\n#### Tickets\n\n`;
        triggerBsForR.forEach(b => {
          md += `##### ${b.code} · ${b.title || b.desc || '(sin título)'}\n`;
          md += _buildItemFieldsMd(b, state);
          md += '\n';
        });
      }
      sections.push(md);

    } else if (type === 'T') {
      // ── T sin R padre pero con parent declarado — no debería llegar aquí post-059
      const { blocked, blockers } = _isItemBlocked(item);
      const blockerTag = blocked ? ` ⚠ bloqueado por ${blockers.join(', ')}` : '';
      let md = `### ${item.code} · ${item.title || item.desc || '(sin título)'}${blockerTag}\n`;
      md += _buildItemFieldsMd(item, state);
      sections.push(md);

    } else {
      // ── P y B con parent (o P sin parent — P no es huérfana por diseño) ─
      let md = `### ${item.code} · ${item.title || item.desc || '(sin título)'}\n`;
      md += _buildItemFieldsMd(item, state);
      sections.push(md);
    }
  });

  // T-202606-059: AC-6 — orphansMd usa mismo formato _buildItemFieldsMd (ya aplicado arriba)
  const mainMd = sections.join('\n---\n\n');
  const orphansMd = orphanSections.length
    ? orphanSections.join('\n---\n\n')
    : '';

  return { mainMd, orphansMd };
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

// B-202606-024: window.export* eliminados — todos los consumidores usan ESM import
// B-202606-XXX: locus-ui-shell.js no puede importar directamente (ciclo T-202606-055)
// — registrar listeners shell: para que ui-shell pueda invocar via dispatch
window.addEventListener('shell:export-backlog', () => exportBacklogMd());
window.addEventListener('shell:export-history', () => exportFullHistoryMd());
window.addEventListener('shell:export-context', () => exportContextMd());
