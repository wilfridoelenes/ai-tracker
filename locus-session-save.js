// [PP] v1.2.4 · sprint:PP-S-03 · mod:29 · autor:Rune · 2026-06-11 UTC-6
// locus-session-save.js
// Responsabilidad: Templates, changelog, buildContextMd, buildBacklogMd, saveSession, _doSaveSession, _doApplyMergeAndFinish.
// Dependencias: locus-storage.js · locus-toast.js · locus-session-parse.js
import { loadBacklog, renderStats, getItems} from './locus-backlog-core.js';
import { applyPatchesFromTG, mergeBacklogFromTG } from './locus-backlog-item.js';
import { showMergeDiffPanel } from './locus-backlog-merge.js';
import { _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { updateTabNotifBadges } from './locus-notifications.js';
import { _markRadarDirty, renderGlobalRadarSidebar, toggleRadarSidebar } from './locus-radar.js';
import { stopSessionTimer } from './locus-sesiones-utils.js';
import { _getLocalStorageUsage } from './locus-sprint-project.js';
import { _generateBacklogContent, _generateBacklogMd } from './locus-backlog-generator.js';
import { _docPrefix, _effectiveVersion, _findSession, _tplKey, getAI, getActiveProject, getActiveSprints, getActiveTracker, saveImmediate } from './locus-storage.js';


import { extractContextSections, extractHtmlMapSections, mergeContextSections, mergeHtmlMapSections } from './locus-docs.js';

import { showCheckpointPanel } from './locus-sesiones-viz.js';

import { render } from './locus-sesiones.js';

import { _showProjRequiredInPanel, _templateTrigger, interpretHora } from './locus-session-hora.js';

import { _setPhase, _tryIngestPlan, _tryIngestSprintProposal, _applySprintInheritanceToItems, parseSprintProposal, parsePaste } from './locus-session-parse.js'; // T-202606-032: isParseInFlight eliminado — AC-5 | T-202606-020: _applySprintInheritanceToItems

import { _getAllSessionsChron, _rebuildLogBody } from './locus-session-popup.js';

import { showToast } from './locus-toast.js';

import { esc, getCurrentTab } from './locus-ui-shell.js';

let _pendingTemplateDownload = false; // T5: variable de módulo — reemplaza window._pendingTemplateDownload
// T-202606-020 · AC-5: tabla de transiciones válidas por tipo de ítem — BR-Core §4
// Clave: tipo de ítem ('R' | 'T' | 'B' | 'P'). Valor: Set de status permitidos.
// Nota: tipo desconocido → no validar (AC-6, ignorar silenciosamente).
export const VALID_TRANSITIONS = {
  R: new Set(['pendiente', 'en-revision', 'bloqueado', 'descartado', 'done']),
  T: new Set(['pendiente', 'en-revision', 'done', 'descartado']),
  B: new Set(['pendiente', 'en-revision', 'done', 'descartado']),
  P: new Set(['pendiente', 'promovida', 'descartado'])
};

// T-202606-020 · AC-2 · AC-5 · AC-6
// Recibe el array de tgItems ya procesado por mergeBacklogFromTG (post-clasificación).
// Devuelve array de { code, type, status, reason } para ítems con transición inválida.
// Solo evalúa ítems con type conocido y status declarado — el resto se ignora silenciosamente (AC-6).
export function validateLifecycleTransitions(tgItems) {
  if (!tgItems || !tgItems.length) return [];
  const invalid = [];
  tgItems.forEach(item => {
    const type   = item.type || (item.code ? item.code.charAt(0) : '');
    const status = item.status;
    // AC-6: tipo desconocido → ignorar silenciosamente
    if (!type || !VALID_TRANSITIONS[type]) return;
    // Sin status declarado → no hay transición que validar
    if (!status) return;
    if (!VALID_TRANSITIONS[type].has(status)) {
      // Construir motivo legible para el panel DIFF (AC-3)
      let reason = '';
      if (type === 'P' && status === 'done') {
        reason = 'P no puede tener status done — solo promovida o descartado';
      } else if (type === 'R' && status === 'done') {
        reason = 'R no puede marcarse done directamente — requiere sesión de cierre de Finn';
      } else if (type === 'T' && status === 'bloqueado') {
        reason = 'T no puede tener status bloqueado — solo pendiente, en-revision, done o descartado';
      } else if (type === 'B' && status === 'bloqueado') {
        reason = 'B no puede tener status bloqueado — solo pendiente, en-revision, done o descartado';
      } else {
        reason = `${type} no puede tener status '${status}' según BR-Core §4`;
      }
      invalid.push({ code: item.code, type, status, reason });
    }
  });
  return invalid;
}

const _confirmTimers = {};            // timers de confirmación por worker ID

function toggleTemplateTrigger(val) {
  localStorage.setItem(_TMPL_TRIGGER_KEY, val);
  // Actualizar UI si el toggle está visible
  const r1 = document.getElementById('tmpl-trigger-session');
  const r2 = document.getElementById('tmpl-trigger-sprint');
  if (r1) r1.checked = val === 'session';
  if (r2) r2.checked = val === 'sprint';
}

// T-202604-115: Descargar templates individuales (HTML + CONTEXT + Backlog)
export function downloadTemplates() {
  showToast('download', 'Templates listos — click para descargar', null, 8000, () => { _doDownloadTemplates(); });
}

function _dlTemplatesCancel() {
  // Alias mantenido por compatibilidad — no-op
}

// R-202604-040: genera sección ## Memoria reciente con las últimas 5 sesiones que tengan campos narrativos
function _buildNarrativeMemoryMd() {
  const rows = _getAllSessionsChron();
  const withNarrative = rows.filter(({ sess }) =>
    sess.decision || sess.contexto || sess.bloqueantes || sess.aprendizaje
  ).slice(0, 5);
  if (!withNarrative.length) return '';

  const lines = ['## Memoria reciente', ''];
  withNarrative.forEach(({ sess, ai }) => {
    const aiName = ai ? ai.name : 'IA desconocida';
    lines.push(`### ${sess.date || sess.dateShort || 'Sin fecha'} · ${aiName}`);
    if (sess.title) lines.push(`**Sesión:** ${sess.title}`);
    if (sess.decision)    lines.push(`**Decisión:** ${sess.decision}`);
    if (sess.contexto)    lines.push(`**Contexto:** ${sess.contexto}`);
    if (sess.bloqueantes) lines.push(`**Bloqueantes:** ${sess.bloqueantes}`);
    if (sess.aprendizaje) lines.push(`**Aprendizaje:** ${sess.aprendizaje}`);
    lines.push('');
  });
  lines.push('---', '');
  return lines.join('\n');
}

function _doDownloadTemplates() {
  // B-202605-267: usar versión canónica (post-Generator) en lugar de APP_VERSION hardcodeada
  const _ver = _effectiveVersion || (typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v3.4');

  // Backlog
  _generateBacklogMd(_ver);

  // CONTEXT — enriquecido con sección de memoria narrativa al final
  setTimeout(() => {
    const raw = localStorage.getItem(_tplKey('context-raw'));
    if (raw) {
      // R-202604-040: añadir sección de memoria narrativa al final del CONTEXT exportado
      const narrativeMd = _buildNarrativeMemoryMd();
      const enriched = narrativeMd ? raw.trimEnd() + '\n\n---\n\n' + narrativeMd : raw;
      const b = new Blob([enriched], { type: 'text/markdown' });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = `${_docPrefix()}-CONTEXT_${_ver}.md`;
      a.click(); URL.revokeObjectURL(u);
    }
  }, 300);

  // HTML-MAP
  setTimeout(() => {
    const raw = localStorage.getItem(_tplKey('html-map-raw'));
    if (raw) {
      const b = new Blob([raw], { type: 'text/markdown' });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = `${_docPrefix()}-MAP_${_ver}.md`;
      a.click(); URL.revokeObjectURL(u);
    }
  }, 600);

}

// T-202604-061: Changelog interno
const CHANGELOG_KEY = 'ai-tracker-changelog';
const CHANGELOG_MAX = 50;

function _addChangelogEntry(parsed) {
  // estado formato: "YYYY-MM-DD HH:MM UTC-6 — descripción"
  // archivos formato: "AI-Tracker-vX.X.X.X.html, ..."
  const estadoMatch = parsed.estado.match(/^(\d{4}-\d{2}-\d{2}[^\—–-]*?)\s*[—–-]+\s*(.+)$/);
  const fecha = estadoMatch ? estadoMatch[1].trim() : parsed.estado.slice(0, 16);
  const desc  = estadoMatch ? estadoMatch[2].trim() : parsed.estado;

  // extraer versión del campo archivos
  const versionMatch = (parsed.archivos || '').match(/AI-Tracker-(v[\d.]+)\.html/i);
  const version = versionMatch ? versionMatch[1] : APP_VERSION;

  const entry = { version, fecha, desc, titulo: parsed.titulo || '', ts: Date.now() };

  let log = [];
  try { log = JSON.parse(localStorage.getItem(CHANGELOG_KEY) || '[]'); } catch { log = []; }
  log.unshift(entry);
  if (log.length > CHANGELOG_MAX) log = log.slice(0, CHANGELOG_MAX);
  localStorage.setItem(CHANGELOG_KEY, JSON.stringify(log));
}

function openChangelog() {
  // R-202604-047: shell estático en index.html
  const overlay = document.getElementById('changelog-overlay');
  if (!overlay) return;
  const body = document.getElementById('changelog-body');
  if (body) body.innerHTML = _buildChangelogInner();
  overlay.classList.add('open');
  const closeBtn = overlay.querySelector('[data-close-changelog]');
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'), { once: true });
}

function _buildChangelogInner() {
  let log = [];
  try { log = JSON.parse(localStorage.getItem(CHANGELOG_KEY) || '[]'); } catch { log = []; }

  const rows = log.length ? log.map(e => `
    <div class="chlog-entry">
      <div class="changelog-row-date">
        <span class="chlog-version">${esc(e.version)}</span>
      </div>
      <div class="changelog-row-body">
        ${e.titulo ? `<div class="chlog-title">${esc(e.titulo)}</div>` : ''}
        <div class="chlog-body">${esc(e.desc)}</div>
        <div class="chlog-date">${esc(e.fecha)}</div>
      </div>
    </div>`).join('')
  : `<div class="chlog-empty">Sin entradas aún — se registran al guardar sesiones con bloque CHECKPOINT.</div>`;

  return `
    <div class="modal-title">📋 Changelog</div>
    <div class="changelog-scroll">${rows}</div>
    <div class="modal-actions changelog-actions">
      <button data-close-changelog>Cerrar</button>
    </div>`;
}

// Alias legacy — por si hay referencias directas
function _buildChangelogHTML() {
  return `<div class="modal modal--changelog">${_buildChangelogInner()}</div>`;
}

// R-202604-042: genera sección de memoria narrativa reciente para el CONTEXT exportado
// Toma las últimas N sesiones del proyecto activo que tengan al menos un campo narrativo con contenido real
function _buildNarrativeMd() {
  const N = 10;
  const proj = getActiveProject();
  const sessions = (proj && Array.isArray(proj.sessions)) ? proj.sessions : [];
  if (!sessions.length) return '';

  // Filtrar sesiones con al menos un campo narrativo con contenido (distinto a vacío y a 'n/a')
  const _hasContent = (val) => val && val.trim() && val.trim().toLowerCase() !== 'n/a';

  const narrative = sessions
    .slice()
    .reverse() // más recientes primero
    .filter(s => _hasContent(s.decision) || _hasContent(s.contexto) || _hasContent(s.bloqueantes) || _hasContent(s.aprendizaje))
    .slice(0, N);

  if (!narrative.length) return '';

  const _ai = (aiId) => {
    const a = getAI(aiId); return a ? a.name : aiId;
    return aiId || '—';
  };

  const entries = narrative.map(s => {
    const lines = [`**${s.date || s.dateShort || '—'}** · ${_ai(s.aiId)}` + (s.title ? ` · *${s.title}*` : '')];
    if (_hasContent(s.decision))    lines.push(`- **Decisión:** ${s.decision.trim()}`);
    if (_hasContent(s.contexto))    lines.push(`- **Contexto:** ${s.contexto.trim()}`);
    if (_hasContent(s.bloqueantes)) lines.push(`- **Bloqueantes:** ${s.bloqueantes.trim()}`);
    if (_hasContent(s.aprendizaje)) lines.push(`- **Aprendizaje:** ${s.aprendizaje.trim()}`);
    return lines.join('\n');
  }).join('\n\n');

  return `\n---\n\n## Memoria narrativa reciente\n\n${entries}\n`;
}

function buildContextMd(version) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC-6';
  const tracker = getActiveTracker();
  const counters = tracker.counters || { P: 0, T: 0, R: 0, B: 0 };

  // Sprint activo — acepta 'active' y 'open'
  const allSprints = getActiveSprints();
  const activeSprint = allSprints.find(s => s.status === 'active' || s.status === 'open') || null;
  const lastClosed  = allSprints.filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0))[0] || null;

  // Archivo principal — nombre real del HTML si está disponible
  const htmlFile = typeof APP_VERSION !== 'undefined'
    ? `AI-Tracker-v${APP_VERSION.replace(/^v/, '')}.html`
    : `AI-Tracker-v${version}.html`;

  // Proyecto activo
  const proj = getActiveProject();
  const allProjects = (typeof state !== 'undefined' && state.projects) ? state.projects : [];

  // Todas las sesiones — para bloqueante y decisiones
  const allSessions = [];
  allProjects.forEach(p => (p.sessions || []).forEach(s => allSessions.push({ sess: s, proj: p })));
  allSessions.sort((a, b) => parseInt(b.sess.id || 0) - parseInt(a.sess.id || 0));

  // ── Sección: Estado actual ───────────────────────────────────────────────────
  let estadoSection = `## Estado actual\n\n`;
  estadoSection += `| Campo | Valor |\n|---|---|\n`;
  estadoSection += `| Archivo principal | \`${htmlFile}\` |\n`;
  estadoSection += `| Sprint activo | ${activeSprint ? `${activeSprint.id}${activeSprint.name ? ' · ' + activeSprint.name : ''}` : '—'} |\n`;
  estadoSection += `| Sprint cerrado más reciente | ${lastClosed ? lastClosed.id : '—'} |\n`;
  estadoSection += `| Contadores | P=${counters.P} · T=${counters.T} · R=${counters.R} · B=${counters.B} |\n`;
  const lastBlockerEntry = allSessions.find(({ sess }) => sess.bloqueantes && sess.bloqueantes.trim());
  if (lastBlockerEntry) {
    estadoSection += `| Último bloqueante | ${lastBlockerEntry.sess.bloqueantes.trim()} |\n`;
  }
  estadoSection += `\n`;

  // ── Sección: Stack — estática ────────────────────────────────────────────────
  const stackSection = `## Stack\n\n| Capa | Tecnología |\n|------|-----------|\n| UI | HTML + CSS custom (CSS vars, dark/light theme) |\n| Lógica | Vanilla JS ES6 (sin frameworks, sin build step) |\n| Persistencia | \`localStorage\` — clave \`ai-tracker-v4\` + \`backlog-items\` + \`backlog-meta\` |\n| Sync | Firebase Firestore (opcional) — SDK vía CDN, modo offline automático |\n`;

  // ── Sección: Proyectos registrados ───────────────────────────────────────────
  let projectsSection = `## Proyectos registrados\n\n`;
  if (allProjects.length) {
    projectsSection += `| Proyecto | Estado | Sprints | Sesiones | Ítems |\n|---|---|---|---|---|\n`;
    allProjects.forEach(p => {
      const sprintCount = Array.isArray(p.sprints) ? p.sprints.length : 0;
      const sessCount   = Array.isArray(p.sessions) ? p.sessions.length : 0;
      const itemCount   = (p.tracker && Array.isArray(p.tracker.items)) ? p.tracker.items.length : 0;
      const status      = p.status || 'active';
      projectsSection += `| ${p.name || p.id} | ${status} | ${sprintCount} | ${sessCount} | ${itemCount} |\n`;
    });
  } else {
    projectsSection += `_Sin proyectos registrados._\n`;
  }
  projectsSection += `\n`;

  // ── Sección: Tabs de la app — estática ──────────────────────────────────────
  const tabsSection = `## Tabs de la app\n\n| Tab | ID | Default | Descripción |\n|-----|----|---------|-------------|\n| 🗂 Sesiones | \`tab-sesiones\` | ✅ activo | Vista principal — Cards / Log / Proyecto |\n| 📁 Proyectos | \`tab-proyectos\` | — | Dashboard de proyectos |\n| 🗃 Documentos | \`tab-backlog\` | — | Sub-tabs: Backlog / HTML-MAP / Context |\n| 📊 Analytics | \`tab-analytics\` | — | Gráfico sesiones/mes + ranking + streaks + heatmap + histograma |\n\n**Radar (\`📡\`):** sidebar global, no un tab. DOM: \`#radar-sidebar\`. Toggled via \`toggleRadarSidebar()\`.\n\n`;

  // ── Sección: localStorage keys activas — estática ───────────────────────────
  const localStorageSection = `## localStorage — keys activas\n\n| Key | Descripción |\n|-----|-------------|\n| \`ai-tracker-v4\` | State principal serializado |\n| \`backlog-items[-{projId}]\` | Array de ítems del Backlog.md importado |\n| \`backlog-meta[-{projId}]\` | \`{ version, updated, importedAt, counters }\` |\n| \`backlog-log\` | Historial de cambios del backlog |\n| \`context-log\` | Log de acciones sobre el Context |\n| \`html-map-log\` | Log de acciones sobre el HTML-MAP |\n| \`html-map-raw[-{projId}]\` | Texto raw del HTML-MAP.md importado |\n| \`html-map-sections[-{projId}]\` | Array de secciones parseadas del HTML-MAP |\n| \`html-map-meta[-{projId}]\` | \`{ file, version, importedAt, total }\` |\n| \`context-raw[-{projId}]\` | Texto raw del CONTEXT.md importado |\n| \`context-sections[-{projId}]\` | Secciones parseadas del CONTEXT (JSON) |\n| \`context-meta[-{projId}]\` | \`{ version, updated, importedAt }\` |\n| \`notes-{projId}\` | Notas rápidas por proyecto |\n| \`active-tab\` | Tab activo al cerrar |\n| \`tracker-view-mode\` | Modo de vista del tab Tracker: \`cards\` \\| \`chrono\` \\| \`project\` |\n| \`backlog-view-mode\` | Modo vista Backlog: plano \\| tree \\| kanban |\n| \`tmp-id-map\` | Mapeo \`{ slug → { code, createdAt } }\`. TTL 24h |\n| \`ai-tracker-changelog\` | Historial interno de cambios (max 50 entradas) |\n\nKeys con sufijo \`-{projId}\` cuando hay proyecto activo (via \`_tplKey(base)\`).\n\n`;

  // ── Sección: Decisiones técnicas registradas ─────────────────────────────────
  // Extraer del proyecto activo — campo decisions
  let decisionsSection = `## Decisiones técnicas registradas\n\n`;
  const projDecisions = (proj && Array.isArray(proj.decisions)) ? proj.decisions : [];
  if (projDecisions.length) {
    // Ordenar por fecha desc, tomar las 20 más recientes
    const sorted = [...projDecisions]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 20);
    decisionsSection += `| Fecha | Decisión | Autor |\n|---|---|---|\n`;
    sorted.forEach(d => {
      const fecha  = (d.date || '—').slice(0, 10);
      const texto  = (d.text || '').replace(/\|/g, '\\|').slice(0, 120);
      const autor  = (d.author || '—').replace(/\|/g, '\\|');
      decisionsSection += `| ${fecha} | ${texto} | ${autor} |\n`;
    });
  } else {
    decisionsSection += `_Sin decisiones técnicas registradas en el proyecto activo._\n`;
  }
  decisionsSection += `\n`;

  // ── Sección: Gaps / pendientes sprint activo ─────────────────────────────────
  let gapsSection = `## Gaps / pendientes sprint activo\n\n`;
  if (activeSprint && proj && proj.tracker && Array.isArray(proj.tracker.items)) {
    const sprintItems = proj.tracker.items.filter(i =>
      i.sprint === activeSprint.id && i.status === 'pendiente'
    );
    if (sprintItems.length) {
      gapsSection += `| Ítem | Descripción | Tipo | Effort |\n|---|---|---|---|\n`;
      sprintItems.slice(0, 30).forEach(i => {
        const desc   = (i.title || i.desc || '').replace(/\|/g, '\\|').slice(0, 100);
        const tipo   = i.type || '—';
        const effort = i.effort || '—';
        gapsSection += `| \`${i.code || '[pendiente]'}\` | ${desc} | ${tipo} | ${effort} |\n`;
      });
    } else {
      gapsSection += `_Sin ítems pendientes en el sprint activo._\n`;
    }
  } else {
    gapsSection += `_Sin sprint activo o sin proyecto seleccionado._\n`;
  }
  gapsSection += `\n`;

  // ── Sección: Narrativa operativa ─────────────────────────────────────────────
  const narrativeMd = _buildNarrativeMd ? _buildNarrativeMd() : '';

  return `# CONTEXT — Locus
# CONTEXT.md
<!--
  Versión: ${version}
  Última actualización: ${timestamp}
  Reglas generales: nombre archivo + numeración oficial + CHECKPOINT acumulativo
-->

Versión: ${version}
Última actualización: ${timestamp}
Archivo principal: \`${htmlFile}\`

---

${estadoSection}
---

${stackSection}

---

${projectsSection}
---

${tabsSection}
---

${localStorageSection}
---

${decisionsSection}
---

${gapsSection}
---

## Notas

Documento generado automáticamente desde Locus v${version}.
Importa este archivo en la siguiente sesión.
${narrativeMd}
`;
}

// B-202605-517: stub legacy reemplazado — delegación a _generateBacklogContent (ai-tracker-sprint-project.js)
// La función anterior leía tracker.items (schema legacy, solo sesiones) en lugar de getItems() (backlog global),
// produciendo exports truncados con backlogs de 24+ ítems.
export function buildBacklogMd(version) {
  {
    const { md } = _generateBacklogContent(version);
    return md;
  }
  // Fallback: _generateBacklogContent no disponible (carga parcial de módulos)
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC-6';
  return `# Backlog-v${version}.md\n<!-- Versión: v${version} | Última actualización: ${timestamp} -->\n\n⚠ buildBacklogMd: _generateBacklogContent no disponible — adjunta ai-tracker-sprint-project.js\n`;
}

// R-202604-022: muestra alerta de cuota de localStorage si supera umbrales
export function _checkStorageQuota() {

  const { usedKB, totalKB, pct } = _getLocalStorageUsage();
  if (pct >= 0.85) {
    showToast('error', `⚠ localStorage al ${Math.round(pct * 100)}% (${usedKB} KB / ${totalKB} KB) — limpia ítems o exporta datos`, null, 8000);
  } else if (pct >= 0.70) {
    showToast('warning', `⚠ localStorage al ${Math.round(pct * 100)}% (${usedKB} KB / ${totalKB} KB)`, null, 6000);
  }
}

export function saveSession(id) {
  // T-202606-032: guard isParseInFlight eliminado — AC-5.
  // saveSession solo se llama desde dentro de parsePaste (auto-trigger) o desde el botón manual
  // después de que parsePaste completó. El parámetro _retryCount ya no es necesario.
  // B-202605-054: getAI(id) puede devolver null si el worker fue eliminado entre el inicio
  // de la sesión y el guardado (ej: purge concurrente). Sin guard, ai._parsed explota.
  const ai = getAI(id);
  if (!ai) {
    showToast('error', '⚠ No se encontró el worker — recarga la página');
    return;
  }
  const parsed = ai._parsed || {};
  const ta = document.getElementById('ta-' + id);
  const raw = ta ? ta.value.trim() : '';
  // B-202604-NNN: evitar que marcas de bloque (---CHECKPOINT---, ```) queden como título
  const _rawFallbackLine = raw.split('\n').find(l => { const t = l.trim(); return t && !t.startsWith('---') && !t.startsWith('```'); }) || '';
  const title = parsed.title || _rawFallbackLine.slice(0, 80) || '';
  if (!title) {
    showToast('warning', '⚠ El textarea está vacío — pega el resumen de la sesión');
    const ta2 = document.getElementById('ta-' + id);
    if (ta2) { ta2.focus(); ta2.style.setProperty('--input-border-flash', 'var(--red)'); ta2.classList.add('input-border-error'); setTimeout(() => { ta2.classList.remove('input-border-error'); }, 2000); }
    return;
  }

  // B-202606-037: horaRaw se lee dentro del callback del DIFF — no aquí.
  // El input hora-[id] del card fue reemplazado por mdiff-duration-input en el DIFF.

  // Proyecto: leer del selector del card, con fallback al activo global
  const projSelectEl = document.getElementById('sess-proj-' + id);
  const selectedProjId = projSelectEl ? projSelectEl.value : '';
  const activeProj = (selectedProjId ? (state.projects || []).find(p => p.id === selectedProjId) : null)
    || getActiveProject();
  // R-202605-095: sin proyecto → no abortar con toast. El panel de ítems comunica el problema inline.
  // Si no hay ítems que mostrar en el panel, aún así abrir el panel con solo el banner.
  const _needsProject = !activeProj;
  if (_needsProject) {
    // Marcar el selector con error visual (sin toast)
    if (projSelectEl) { projSelectEl.classList.add('input-outline-error'); setTimeout(() => { projSelectEl.classList.remove('input-outline-error'); }, 2000); }
    // Abrir el panel con banner bloqueante — el usuario debe seleccionar proyecto desde el card
    // B-202606-037: horaResult aún no disponible en este gate — se resuelve en el DIFF
    _showProjRequiredInPanel(id, parsed, null);
    return;
  }

  // P-202604-115: validar campo Proyecto del CHECKPOINT vs proyecto del card
  // Solo aplica a CHECKPOINTs (no a sesiones manuales sin bloque)
  if (parsed.isCheckpoint) {
    const _ckptProj = (parsed.ckptProyecto || '').trim();
    const _cardProjName = (activeProj.name || '').trim();
    const _projMatch = _ckptProj && _cardProjName === _ckptProj;
    const _projMismatch = _ckptProj && !_projMatch;
    const _projMissing = !_ckptProj;

    if (_projMismatch || _projMissing) {
      // Aviso no ignorable — requiere acción explícita: Continuar o Cancelar
      const _msg = _projMissing
        ? `El CHECKPOINT no tiene campo <strong>Proyecto:</strong>.<br>Se guardará en <strong>${esc(_cardProjName)}</strong>.`
        : `El CHECKPOINT declara <strong>${esc(_ckptProj)}</strong> pero el card tiene seleccionado <strong>${esc(_cardProjName)}</strong>.`;
      _showProjMismatchModal({
        msg: _msg,
        // B-202606-037: horaResult aún no disponible — se resuelve en el DIFF
        onContinue: () => _doSaveSession(id, ai, parsed, activeProj, null)
      });
      return;
    }
  }

  // B-202606-037: horaResult ya no se pasa desde aquí — se resuelve dentro del DIFF
  _doSaveSession(id, ai, parsed, activeProj, null);
}

// P-202604-115: modal Continuar/Cancelar para discrepancia de proyecto
function _showProjMismatchModal({ msg, onContinue }) {
  // R-202604-047: shell estático en index.html
  const overlay = document.getElementById('proj-mismatch-overlay');
  if (!overlay) return;
  const msgEl = document.getElementById('proj-mismatch-msg');
  if (msgEl) msgEl.innerHTML = msg;
  overlay.classList.add('open');
  // Reemplazar botón para limpiar handlers acumulados
  const btn = document.getElementById('proj-mismatch-continue');
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      onContinue();
    });
  }
}

// T-202605-120: construye una versión enriquecida de tgItems para visualización en el panel diff.
// Para cada patchItem, busca el ítem real en getItems() global y genera un objeto con los campos
// del patch aplicados encima — permite que el panel muestre qué ítems serán actualizados
// sin aplicar los cambios reales (eso ocurre en el callback vía applyPatchesFromTG).
// Los patchItems que no tienen código real en getItems() se omiten silenciosamente.
function _buildPatchTgItems(patchItems, existingTgItems) {
  if (!patchItems || !patchItems.length) return existingTgItems || [];
  const base = (existingTgItems || []).slice();
  if (typeof getItems() === 'undefined' || !Array.isArray(getItems())) return base;
  const existingCodes = new Set(base.map(x => x.code));
  patchItems.forEach(patch => {
    if (!patch.code || /^\[/.test(patch.code)) return; // ignorar placeholders
    if (existingCodes.has(patch.code)) return; // ya está en tgItems — no duplicar
    const real = getItems().find(x => x.code === patch.code);
    if (!real) return;
    // Construir representación visual: ítem real con campos del patch aplicados
    const synthetic = Object.assign({}, real);
    Object.keys(patch).forEach(k => { if (k !== 'type' && k !== 'code') synthetic[k] = patch[k]; });
    base.push(synthetic);
  });
  return base;
}

// B-202604-116: merge de backlog apuntando al proyecto del card, no al filtro global activo.
// Sobrescribe temporalmente current-project-filter + recarga getItems() del proyecto destino,
// ejecuta el merge, y restaura el estado anterior (filtro + getItems() del proyecto original).
// _setActiveProjectFilter no se usa porque tiene side-effects de UI.
export function _mergeBacklogWithProject(tgItems, sessId, projId) {
  if (!tgItems || !tgItems.length) return { created:[], updated:[], ignored:[], advanced:[], retroceso:[], discarded:[] };
  const _prevFilter = localStorage.getItem('current-project-filter') || '';
  const _filterChanged = projId && projId !== _prevFilter;
  if (_filterChanged) {
    // Apuntar al proyecto del card y recargar getItems() correspondientes
    localStorage.setItem('current-project-filter', projId);
    loadBacklog();
  }
  let result;
  try {
    result = mergeBacklogFromTG(tgItems, sessId);
  } finally {
    if (_filterChanged) {
      // Restaurar filtro original y recargar getItems() del proyecto original
      if (_prevFilter) localStorage.setItem('current-project-filter', _prevFilter);
      else localStorage.removeItem('current-project-filter');
      loadBacklog();
    }
  }
  return result;
}

// R-202604-017 + P-202604-115: lógica central de guardado extraída para reutilización
export function _doSaveSession(id, ai, parsed, activeProj, horaResult) {
  const ta = document.getElementById('ta-' + id);
  const raw = ta ? ta.value.trim() : '';
  // B-202604-NNN: evitar que marcas de bloque (---CHECKPOINT---, ```) queden como título
  const _rawFallbackLine = raw.split('\n').find(l => { const t = l.trim(); return t && !t.startsWith('---') && !t.startsWith('```'); }) || '';
  const title = parsed.title || _rawFallbackLine.slice(0, 80) || '';
  const tgRefsRaw = parsed.tgItems || [];
  const trackerRefs = tgRefsRaw.map(x => x.code).filter(Boolean);
  const now = new Date();
  const dateShort = now.toLocaleDateString('es-MX', {day:'2-digit', month:'short'});
  const dateFull = now.toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'}) + ' ' +
                   now.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

  const tgItems = parsed.tgItems || [];

  // R-202605-049: sessionGroupId — hereda del checkpoint activo del worker o genera nuevo
  const _allSessForGroup = (activeProj.sessions || []).filter(s => s.aiId === ai.id && !s.resetAt);
  const _lastSessForGroup = _allSessForGroup.length ? _allSessForGroup[_allSessForGroup.length - 1] : null;
  const _sessionGroupId = (_lastSessForGroup && _lastSessForGroup.sessionGroupId)
    ? _lastSessForGroup.sessionGroupId
    : 'sg-' + Date.now();

  // v3.0.0: sesión va al proyecto activo con aiId
  // R-202604-017 AC-3: ckptProyecto registrado en sesión para trazabilidad en log
  const newSess = {
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
    aiId: ai.id,
    title, summary: parsed.summary || '', files: parsed.files || '',
    pending: parsed.pending || '', tags: [],
    nextStep: parsed.nextStep || '',
    trackerRefs,
    ckptProyecto: parsed.ckptProyecto || '',
    // R-202604-039: campos de memoria narrativa
    decision:    parsed.decision    || '',
    contexto:    parsed.contexto    || '',
    bloqueantes: parsed.bloqueantes || '',
    aprendizaje: parsed.aprendizaje || '',
    // T-202606-016: campos informativos adicionales del CHECKPOINT
    duration:         parsed.duration         || '',
    docsVerified:     parsed.docsVerified      || '',
    tensionsResolved: parsed.tensionsResolved  || '',
    resetAt: '',  // B-202606-037: se completa en el callback del DIFF tras leer mdiff-duration-input
    // R-202605-049: sessionGroupId — agrupa checkpoints bajo sesión como contenedor
    sessionGroupId: _sessionGroupId,
    // T-202605-446: tiempo cronometrado de la sesión en ms
    // B-202606-037: stopSessionTimer se llama aquí para capturar elapsed antes de que el usuario
    // interactúe con el DIFF. durationMs se recalcula en el callback si hay horaResult.
    durationMs: (typeof stopSessionTimer === 'function') ? stopSessionTimer(id) : 0,
    dateShort, date: dateFull
  };
  // B-202605-004: newSess NO se persiste aquí. El push de sessions[] y el populate de
  // tracker.items ocurren en _doApplyMergeAndFinish, después de confirmación del panel.
  // Si el usuario cancela, ni sessions[] ni tracker.items quedan con entradas huérfanas.
  const sessId = newSess.id;

  // T-098: merge del TRACKER-GLOBAL al Backlog en memoria (acumulable)
  // T-202604-121: recoger resultado detallado para super toast
  // B-202604-116: usar proyecto del card, no filtro global activo
  // T-202604-201: panel de confirmación diff antes de aplicar el merge
  // T-202606-037 AC-3: extraer campos narrativos del CHECKPOINT parseado para pasarlos como ckptMeta.
  // B-202606-037: el callback recibe horaRaw desde mdiff-duration-input, interpreta horaResult,
  // completa newSess.resetAt y recalcula durationMs como horaResult.epoch - (Date.now() - newSess.durationMs).
  const _ckptMeta = {
    resumen:     parsed.summary    || '',
    aprendizaje: parsed.aprendizaje || '',
    bloqueantes: parsed.bloqueantes || '',
    decision:    parsed.decision    || '',
    proximoPaso: parsed.nextStep    || '',
    // B-202606-037 AC-3: resetTime del worker para pre-llenar mdiff-duration-input en el DIFF.
    // Formato "HH:MM" — el DIFF stripea el separador antes de asignarlo al input.
    resetTime:   ai.resetTime || '',
  };
  const _patchItemsN = parsed.patchItems || [];
  const _tgItemsForPanel = _buildPatchTgItems(_patchItemsN, tgItems);
  // T-202606-155: si el CHECKPOINT tiene ---SPRINT-PROPOSAL--- válido, pasarlo a showMergeDiffPanel
  // como ckptMeta.sprintProposal para que Step 0 sea el gate de creación del sprint.
  // El sprint NO se crea aquí — se crea solo al aprobar Step 0 en el DIFF.
  const _spProposal = (raw && raw.includes('---SPRINT-PROPOSAL---'))
    ? parseSprintProposal(raw)
    : null;
  const _validSpProposal = (_spProposal && !_spProposal.error) ? _spProposal : null;
  if (_validSpProposal) {
    _ckptMeta.sprintProposal = _validSpProposal;
    _ckptMeta.onApproveProposal = function(proposal) {
      // T-202606-020 AC-1/AC-2/AC-3/AC-4: herencia automática de sprint a ítems del CHECKPOINT.
      // _tryIngestSprintProposal retorna el id del sprint creado (string) o false.
      // Mutar _tgItemsForPanel in-place → el DIFF refleja el sprint asignado antes de que el founder confirme.
      const _spCreated = _tryIngestSprintProposal(raw);
      if (_spCreated) _applySprintInheritanceToItems(_tgItemsForPanel, _spCreated);
    };
  }
  // Todo CHECKPOINT válido pasa por el DIFF — sin excepción.
  // B-202605-NNN: cancelar timer Supabase de draft antes de abrir el panel diff.
  // Si el usuario tarda >3s en confirmar, el timer se dispara y hace upsert del draft.
  // Ese upsert puede llegar por realtime DESPUÉS del delete post-confirm → restoreDrafts restaura el textarea.
  clearTimeout(window['_draftSbTimer_' + id]);
  showMergeDiffPanel(_tgItemsForPanel, sessId, activeProj.id, (horaRaw) => {
    // B-202606-037: leer horaRaw desde el input del DIFF (mdiff-duration-input).
    // interpretHora convierte HHMM → { label, hhmm, epoch }. Si vacío → null → worker disponible.
    const horaResult = interpretHora((horaRaw || '').replace(/\D/g, ''));
    if (horaResult) {
      newSess.resetAt = horaResult.label;
      // Recalcular durationMs: desde inicio de sesión (epoch estimado) hasta hora de desbloqueo.
      // startEpoch estimado = Date.now() - elapsed acumulado (stopSessionTimer ya lo detuvo).
      const _estimatedStartEpoch = Date.now() - (newSess.durationMs || 0);
      const _calcDuration = horaResult.epoch - _estimatedStartEpoch;
      if (_calcDuration > 0) newSess.durationMs = _calcDuration;
    }
    _doApplyMergeAndFinish(id, ai, parsed, activeProj, horaResult, sessId, tgItems, newSess);
  }, _ckptMeta);
}

// T-202604-201: segunda mitad de _doSaveSession — ejecutada tras confirmación del panel de diff
async function _doApplyMergeAndFinish(id, ai, parsed, activeProj, horaResult, sessId, tgItems, newSess) {
  // B-202605-004: push atómico — la sesión entra en activeProj.sessions solo aquí,
  // después de que el usuario confirmó el panel MergeDiff (o en el fallback directo).
  // Garantiza que cancelar el panel no deja sesiones huérfanas en el array.
  if (!activeProj.sessions) activeProj.sessions = [];
  if (newSess && !activeProj.sessions.find(s => s.id === newSess.id)) {
    activeProj.sessions.push(newSess);
  }

  // v3.0.0: tracker del proyecto activo — también aquí para atomicidad con sessions[].
  // Sin esto, tracker.items quedaría con sessionId huérfano si el usuario cancela el panel.
  if (!activeProj.tracker) activeProj.tracker = { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
  const tracker = activeProj.tracker;
  let newCount = 0, updCount = 0;
  tgItems.forEach(item => {
    const existing = tracker.items.find(x => x.code === item.code);
    if (existing) {
      existing.desc = item.desc; existing.status = item.status; existing.sessionId = sessId;
      updCount++;
    } else {
      const c = tracker.counters;
      const numMatch = item.code.match(/[PTRB]-\d{6}-(\d{3})/);
      if (numMatch) { const num = parseInt(numMatch[1]); if (num >= (c[item.type] || 0)) c[item.type] = num; }
      tracker.items.push({id:'tgi-'+Date.now()+'-'+Math.random().toString(36).slice(2,6), code:item.code, desc:item.desc, status:item.status, sessionId:sessId});
      newCount++;
    }
  });

  const raw = (document.getElementById('ta-' + id) || {}).value || '';
  const mergeResult = _mergeBacklogWithProject(tgItems, sessId, activeProj.id);
  // R-202605-062: aplicar patches después del merge de ítems normales
  if (parsed.patchItems && parsed.patchItems.length) {
    applyPatchesFromTG(parsed.patchItems, sessId);
  }

  // B-202604-XXX: actualizar trackerRefs con códigos reales post-_assignPendingIds
  // _mergeBacklogWithProject resuelve [pendiente-ID] → código real en tgItems
  // newSess.trackerRefs fue construido antes de esa resolución — se sincroniza aquí
  if (newSess && tgItems.length) {
    newSess.trackerRefs = tgItems.map(x => x.code).filter(c => c && /^[PTRB]-\d{6}-\d{3}/.test(c));
  }

  // T-202604-108: merge de secciones CONTEXT-SECTION si las hay en el paste
  const contextSections = extractContextSections(raw);
  const mergedCtxNames = [];
  if (contextSections.length) {
    contextSections.forEach(s => mergedCtxNames.push(s.header.replace(/^##\s*/, '')));
    mergeContextSections(contextSections, activeProj.id);
  }

  // merge de secciones MAP-SECTION si las hay en el paste
  const mapSections = extractHtmlMapSections(raw);
  if (mapSections.length) mergeHtmlMapSections(mapSections, activeProj.id);

  // R-202604-076 + R-B: parsear y guardar bloque ---PLAN--- / ---EXECUTION-PLAN--- si existe
  // B-202605-XXX: usar _tryIngestPlan en lugar de savePlan directo — preserva scope:sprint al guardar scope:sesion
  if (raw.includes('---PLAN---') || raw.includes('---EXECUTION-PLAN---')) _tryIngestPlan(raw);

  if (horaResult) { ai.status = 'exhausted'; ai.resetTime = horaResult.hhmm; ai.resetEpoch = horaResult.epoch; }
  ai._parsed = {};
  // T-202604-103: limpiar timer de confirmación si quedó activo
  if (_confirmTimers[id]) { clearTimeout(_confirmTimers[id]); delete _confirmTimers[id]; }
  // B-202605-NNN: clearTimeout antes de removeItem — evita que un timer completado justo antes
  // del save haga upsert en Supabase después de que el draft ya fue eliminado de localStorage.
  // El orden incorrecto (removeItem → clearTimeout) dejaba una ventana donde el timer podía
  // leer el draft de localStorage si se disparaba entre ambas líneas.
  clearTimeout(window['_draftSbTimer_' + id]);
  localStorage.removeItem('draft-' + id);
  localStorage.removeItem('draft-' + id + '-ts');
  // R-3: eliminar borrador de Supabase al guardar sesión
  if (typeof _supabase !== 'undefined' && _supabase && typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    _supabase.from('tracker_docs').delete().eq('user_id', _supabaseUser.id).eq('key', 'draft-' + id)
      .then(({ error }) => { if (error) console.warn('[AI Tracker] draft delete Supabase error:', error); });
  }
  const _taClear = document.getElementById('ta-' + id);
  // B-202605-NNN: no llamar parsePaste(id) aquí — parsePaste con ta.value='' puede re-disparar
  // el debounce path y reescribir el draft si hay un oninput pendiente en la cola del browser.
  // El rAF post-render ya limpia el textarea y valida el estado final.
  if (_taClear) { _taClear.value = ''; _taClear.classList.remove('ta-has-items'); }
  await saveImmediate(); render();
  // R-202604-022: alerta de cuota tras guardar
  _checkStorageQuota();
  // B-007: actualizar stat bar y lista backlog siempre al guardar sesión
  renderStats();
  // B-202604-XXX: actualizar tab Hoy tras guardar CKPT con hora de cierre — sin esto el card no refleja estado exhausted sin refresh manual
  if (getCurrentTab() === 'sesiones') render();
  if (getCurrentTab() === 'backlog') { _markBacklogListDirty(); renderBacklogList(); }
  // R-202604-016: actualizar log card
  _rebuildLogBody();
  // R-003: animar la primera sess-row del card recién guardado
  // B-202605-265: _setPhase(id,3) movido dentro de rAF — render() reconstruye el DOM con
  // grid.innerHTML='', los elementos phase-* no existen hasta el siguiente frame.
  // Segundo render() + renderGlobalRadarSidebar() garantizan sidebar y card actualizados.
  requestAnimationFrame(() => {
    _setPhase(id, 3);
    render();
    _markRadarDirty(); renderGlobalRadarSidebar();
    // B-202605-XXX: re-limpiar draft después del segundo render() — restoreDrafts() corre
    // al final de render() y puede repoblar el textarea si el draft sobrevivió en localStorage
    // (race entre parsePaste con ta.value='' y un oninput/debounce timer previo).
    localStorage.removeItem('draft-' + id);
    localStorage.removeItem('draft-' + id + '-ts');
    const _dotRaf = document.getElementById('draft-' + id);
    if (_dotRaf) _dotRaf.className = 'draft-dot';
    const _taRaf = document.getElementById('ta-' + id);
    if (_taRaf && _taRaf.value.trim()) { _taRaf.value = ''; parsePaste(id); }
    const card = document.getElementById('card-' + id);
    if (card) {
      const firstRow = card.querySelector('.sess-row');
      if (firstRow) {
        firstRow.classList.remove('fade-slide-in');
        void firstRow.offsetWidth; // forzar reflow para reiniciar animación
        firstRow.classList.add('fade-slide-in');
      }
      // T-085: destello verde en el card al guardar sesión
      card.classList.remove('card-flash');
      void card.offsetWidth;
      card.classList.add('card-flash');
      setTimeout(() => card.classList.remove('card-flash'), 650);
      // R-202604-061 AC-1: feedback en botón guardar
      const _sbtn = document.getElementById('sbtn-' + id);
      if (_sbtn) {
        _sbtn.classList.add('btn--saved');
        setTimeout(() => _sbtn.classList.remove('btn--saved'), 1800);
      }
      // T-202604-410: estado transitorio post-merge en card
      const _hasMergeItems = mergeResult && (
        mergeResult.created.length || mergeResult.advanced.length ||
        mergeResult.updated.length || mergeResult.retroceso.length ||
        mergeResult.discarded.length
      );
      if (_hasMergeItems) {
        const _successBadge = document.createElement('div');
        _successBadge.className = 'card-merge-success-badge';
        const _counts = [];
        if (mergeResult.created.length)  _counts.push(`+${mergeResult.created.length} creado${mergeResult.created.length > 1 ? 's' : ''}`);
        if (mergeResult.advanced.length) _counts.push(`${mergeResult.advanced.length} avanzado${mergeResult.advanced.length > 1 ? 's' : ''}`);
        if (mergeResult.updated.length)  _counts.push(`${mergeResult.updated.length} actualizado${mergeResult.updated.length > 1 ? 's' : ''}`);
        if (mergeResult.retroceso.length) _counts.push(`${mergeResult.retroceso.length} retroceso${mergeResult.retroceso.length > 1 ? 's' : ''}`);
        if (mergeResult.discarded.length) _counts.push(`${mergeResult.discarded.length} descartado${mergeResult.discarded.length > 1 ? 's' : ''}`);
        _successBadge.textContent = '✓ Merge aplicado · ' + _counts.join(' · ');
        card.appendChild(_successBadge);
        requestAnimationFrame(() => _successBadge.classList.add('visible'));
        setTimeout(() => {
          _successBadge.classList.remove('visible');
          setTimeout(() => _successBadge.remove(), 400);
        }, 2600);
      }
    }
  });

  // T-202604-061: registrar entrada en changelog si es CHECKPOINT
  if (parsed.isCheckpoint && parsed.estado) _addChangelogEntry(parsed);

  // T-202604-121: super toast con detalle del merge
  // R-202605-140: proximoPaso y decision abren el panel aunque no haya ítems
  const _ckptProximoPaso = parsed.nextStep  || '';
  const _ckptDecision    = parsed.decision  || '';
  // T-202606-039 AC nuevo 1: inlineFixes del CHECKPOINT → panel para visibilidad al founder
  const _ckptInlineFixes = Array.isArray(parsed.inlineFixes) && parsed.inlineFixes.length ? parsed.inlineFixes : null;
  const _isInfoOnly = (v) => !v || v.trim().toLowerCase() === 'n/a';
  const _hasInfoFields = !_isInfoOnly(_ckptProximoPaso) || !_isInfoOnly(_ckptDecision);
  const hasMergeData = mergeResult.created.length || mergeResult.advanced.length || mergeResult.retroceso.length || mergeResult.discarded.length || mergeResult.updated.length || mergeResult.ignored.length || mergedCtxNames.length || _hasInfoFields || !!_ckptInlineFixes;
  if (hasMergeData) {
    showCheckpointPanel({ ...mergeResult, contextSections: mergedCtxNames, proximoPaso: _ckptProximoPaso, decision: _ckptDecision, inlineFixes: _ckptInlineFixes });
  }
  const _hasPending = mergeResult.retroceso?.length || mergeResult.discarded?.length;
  const _baseMsg = horaResult ? `Sesión guardada · desbloquea a las ${horaResult.label}` : 'Sesión guardada';
  if (!_hasPending) {
    // T-202604-295: descargar templates solo si trigger es 'session' (default)
    if (_templateTrigger() === 'session') {
      showToast('download', _baseMsg + ' · click para descargar templates', null, 8000, () => { _doDownloadTemplates(); });
    } else {
      showToast('success', _baseMsg);
    }
  } else {
    showToast('success', _baseMsg);
    _pendingTemplateDownload = true;
  }
}

