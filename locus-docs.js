// [PP] v1.2.4 · sprint:PP-S-09 · mod:12 · autor:Rune · 2026-06-03 UTC-6
// locus-docs.js
// Última actualización: 2026-05-28 UTC-6
// Módulo: Sub-tab Documentos — Context vivo, HTML-MAP import/export, Docs onboarding, modificación badges
// Extraído de ai-tracker-ai-notes.js

import { _updateUndoUI, importBacklog } from './locus-backlog-core.js';
import { closeDocLog } from './locus-doc-log.js';
import { _mgGetVersion } from './locus-map-generator.js';
import { parseHtmlMapMd, renderHtmlMap, updateHtmlMapBanner } from './locus-map-viewer.js';
import { _blogLog, _effectiveVersion, _projKey, _tplKey, getActiveProject, saveContextDocs } from './locus-storage.js';

import { _docPrefix } from './locus-sprint-project.js';

import { showToast } from './locus-toast.js';

import { esc, switchSubTab } from './locus-ui-shell.js';

// ── T-202604-048: Sub-tabs Templates ──

let currentSubTab = 'backlog';

// T-202604-108: tracking modificaciones Context en sesión activa
let _contextModifiedInSession = false;
let _contextSectionsTouched = []; // headers tocados esta sesión — para detección de conflicto

// T-202604-109: tracking modificaciones HTML-MAP en sesión activa
let _htmlMapModifiedInSession = false;
let _htmlMapModifiedTimer = null;

// T-202604-110: tracking modificaciones Backlog en sesión activa
let _backlogModifiedInSession = false;

export function _updateSubTabButtons(sub) {
  const btnB = document.getElementById('btn-import-backlog');
  const btnE = document.getElementById('btn-export-backlog');
  const btnFull = document.getElementById('btn-export-backlog-full');
  const btnNew = document.getElementById('btn-new-item');
  const btnM = document.getElementById('btn-import-htmlmap');
  const btnME = document.getElementById('btn-export-htmlmap');
  // T-202604-124 / T-202604-006: bootstrap único por proyecto
  const _backlogRaw = localStorage.getItem(_tplKey('backlog-items'));
  const backlogBootstrapped = !!_backlogRaw && (() => { try { return JSON.parse(_backlogRaw).length > 0; } catch { return false; } })();
  if (btnB) btnB.classList.add('is-hidden'); // R-202604-052: import manual eliminado
  if (btnE) btnE.classList.toggle('is-hidden', sub !== 'backlog');
  if (btnFull) btnFull.classList.toggle('is-hidden', sub !== 'backlog');
  if (btnNew) btnNew.classList.toggle('is-hidden', sub !== 'backlog');
  const undoRow = document.getElementById('tpl-undo-row');
  const btnUndo = document.getElementById('btn-undo-backlog');
  const btnRedo = document.getElementById('btn-redo-backlog');
  if (undoRow) undoRow.classList.toggle('is-hidden', sub !== 'backlog');
  if (btnUndo) btnUndo.classList.toggle('is-hidden', sub !== 'backlog');
  if (btnRedo) btnRedo.classList.toggle('is-hidden', sub !== 'backlog');
  if (sub === 'backlog') _updateUndoUI();
  // T-202604-123 / T-202604-006: bootstrap único por proyecto
  const mapBootstrapped = !!localStorage.getItem(_tplKey('html-map-raw'));
  if (btnM) btnM.classList.toggle('is-hidden', !(sub === 'htmlmap' && !mapBootstrapped));
  if (btnME) {
    btnME.classList.toggle('is-hidden', sub !== 'htmlmap');
    const hasData = !!localStorage.getItem(_tplKey('html-map-raw'));
    btnME.disabled = !hasData;
    btnME.title = hasData ? 'Exportar MODULE-MAP.md' : 'Sin datos — importa primero';
  }
  // [tmp:map-generator] — botón Generar MAP visible siempre en sub htmlmap
  const btnGenMap = document.getElementById('btn-generate-map');
  if (btnGenMap) btnGenMap.classList.toggle('is-hidden', sub !== 'htmlmap');
  const btnIC = document.getElementById('btn-import-context');
  if (btnIC) btnIC.classList.add('is-hidden');
  const btnEC = document.getElementById('btn-export-context');
  if (btnEC) {
    const hasContext = !!localStorage.getItem(_tplKey('context-raw'));
    btnEC.classList.toggle('is-hidden', sub !== 'context');
    btnEC.disabled = !hasContext;
    btnEC.title = hasContext ? 'Exportar CONTEXT.md actualizado' : 'Sin datos — importa primero';
  }
  // Sidebar danger zone — show always, per-sub reset button visible
  const dangerZone = document.getElementById('tpl-sidebar-danger');
  if (dangerZone) dangerZone.classList.remove('is-hidden');
  const dbBacklog   = document.getElementById('sidebar-danger-btn-backlog');
  const dbHistorico = document.getElementById('sidebar-danger-btn-historico');
  const dbContext = document.getElementById('sidebar-danger-btn-context');
  const dbHtmlmap = document.getElementById('sidebar-danger-btn-htmlmap');
  const dbContratos = document.getElementById('sidebar-danger-btn-contratos');
  if (dbBacklog)    dbBacklog.classList.toggle('is-hidden', sub !== 'backlog');
  if (dbHistorico)  dbHistorico.classList.toggle('is-hidden', sub !== 'backlog');
  if (dbContext)    dbContext.classList.toggle('is-hidden', sub !== 'context');
  if (dbHtmlmap)    dbHtmlmap.classList.toggle('is-hidden', sub !== 'htmlmap');
  if (dbContratos)  dbContratos.classList.toggle('is-hidden', sub !== 'contratos');
  // Contratos — botones toolbar
  const btnExpContratos = document.getElementById('btn-export-contratos');
  if (btnExpContratos) {
    btnExpContratos.classList.toggle('is-hidden', sub !== 'contratos');
    const hasContratos = !!localStorage.getItem(_tplKey('contratos-data'));
    btnExpContratos.disabled = !hasContratos;
    btnExpContratos.title = hasContratos ? 'Exportar Contratos.md' : 'Sin contratos definidos aún';
  }
  // Collapse danger body when switching tabs
  const dangerBody = document.getElementById('tpl-danger-body');
  if (dangerBody) dangerBody.classList.remove('open');
  // sub-tab plan — no tiene botones de acción ni danger zone (read-only)
  if (sub === 'plan') {
    if (dangerZone) dangerZone.classList.add('is-hidden');
  }
  // Hide actions section label if no buttons visible
  const actionsSection = document.querySelector('.tpl-sidebar-actions');
  if (actionsSection) {
    const allItems = actionsSection.querySelectorAll('button, .tpl-action-row');
    const anyVisible = Array.from(allItems).some(el => !el.classList.contains('is-hidden'));
    actionsSection.classList.toggle('is-hidden', !anyVisible);
  }
}


// ── switchSubTab — extraído a locus-ui-shell.js ──────────────────────────
// ─────────────────────────────────────────────────────────────────────────


// T-202604-204: Checklist onboarding de documentos


function _docsOnboardingSteps() {
  const hasBacklog = !!localStorage.getItem(_tplKey('backlog-items')) &&
    (() => { try { return JSON.parse(localStorage.getItem(_tplKey('backlog-items'))).length > 0; } catch { return false; } })();
  const hasContext = !!localStorage.getItem(_tplKey('context-raw'));
  const hasMap     = !!localStorage.getItem(_tplKey('html-map-raw'));
  return [
    {
      title: 'Importar Backlog.md',
      hint: 'Sube el archivo Backlog.md del proyecto activo.',
      done: hasBacklog,
      action: () => { switchSubTab('backlog'); setTimeout(() => document.getElementById('backlog-file-input')?.click(), 80); }
    },
    {
      title: 'Importar CONTEXT.md',
      hint: 'Sube el archivo de contexto del proyecto.',
      done: hasContext,
      action: () => { switchSubTab('context'); setTimeout(() => document.getElementById('context-file-input')?.click(), 80); }
    },
    {
      title: 'Importar MODULE-MAP.md',
      hint: 'Sube el mapa de módulos del proyecto.',
      done: hasMap,
      action: () => { switchSubTab('htmlmap'); setTimeout(() => document.getElementById('htmlmap-file-input')?.click(), 80); }
    }
  ];
}

export function _renderDocsOnboarding() {
  // Buscar el contenedor del sub-tab activo — insertar banner antes del contenido
  const panel = document.getElementById('sspanel-' + currentSubTab);
  if (!panel) return;

  // Si ya fue descartado → no mostrar nunca
  if (localStorage.getItem('onboarding-docs-seen') === '1') {
    const existing = document.getElementById('docs-onboarding-banner');
    if (existing) existing.remove();
    return;
  }

  const steps = _docsOnboardingSteps();
  const doneCount = steps.filter(s => s.done).length;

  // Si los 3 pasos están completos → colapsar y setear flag
  if (doneCount === 3) {
    _dismissDocsOnboarding();
    return;
  }

  // Crear o reusar el banner
  let banner = document.getElementById('docs-onboarding-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'docs-onboarding-banner';
    // Insertar al inicio del panel activo
    panel.insertBefore(banner, panel.firstChild);
  } else if (banner.parentNode !== panel) {
    panel.insertBefore(banner, panel.firstChild);
  }

  const stepsHtml = steps.map((s, i) => `
    <div class="docs-ob-step${s.done ? ' done' : ''}">
      <div class="docs-ob-num">${s.done ? '✓' : i + 1}</div>
      <div class="docs-ob-step-text">
        <div class="docs-ob-step-title">${s.title}</div>
        <div class="docs-ob-step-hint">${s.hint}</div>
        ${!s.done ? `<button class="docs-ob-step-action" data-step-idx="${i}">Hacer ahora →</button>` : ''}
      </div>
    </div>`).join('');

  banner.innerHTML = `
    <div class="docs-ob-header" data-docs-ob-toggle>
      <span class="docs-ob-icon">📋</span>
      <span class="docs-ob-title">Configura los documentos del proyecto</span>
      <span class="docs-ob-progress">${doneCount}/3 ▾</span>
      <button class="docs-ob-dismiss" title="No mostrar de nuevo">✕</button>
    </div>
    <div class="docs-ob-body">${stepsHtml}</div>`;
}

function _docsOnboardingAction(idx) {
  const steps = _docsOnboardingSteps();
  const fn = steps[idx]?.action;
  if (fn) fn();
}

function _dismissDocsOnboarding() {
  localStorage.setItem('onboarding-docs-seen', '1');
  const banner = document.getElementById('docs-onboarding-banner');
  if (banner) {
    banner.classList.add('collapsed');
    setTimeout(() => banner.remove(), 350);
  }
}

// T-202604-006: Banner proyecto activo en Templates
export function _renderTplProjBanner() {
  const banner = document.getElementById('tpl-proj-banner');
  if (!banner) return;
  const proj = getActiveProject();
  if (!proj) { banner.classList.add('d-none'); banner.classList.remove('d-flex'); return; }
  banner.classList.remove('d-none'); banner.classList.add('d-flex');
  const icon = document.getElementById('tpl-proj-icon');
  const name = document.getElementById('tpl-proj-name');
  if (icon) icon.textContent = proj.icon || '📁';
  if (name) name.textContent = proj.name;
}

// T-202604-006: Render Tracker del proyecto activo en sub-panel Templates


// HTML_MAP_SECTIONS y htmlMapFilter migrados a locus-map-viewer.js (AC-10)

export function importHtmlMap(event) {
  // R-202605-XXX: solo Markdown — rama JSON eliminada
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const sections = parseHtmlMapMd(text);
    localStorage.setItem(_tplKey('html-map-raw'), text);
    localStorage.setItem(_tplKey('html-map-sections'), JSON.stringify(sections));
    // Meta — leer version y nombre del encabezado Markdown
    let version = '—';
    let fileName = file.name;
    const vm = text.match(/Versi[oó]n:\s*([\d.v][\d.]*)/); if (vm) version = vm[1];
    const fm = text.match(/^#\s+(.+)/m); if (fm) fileName = fm[1].trim();
    const meta = {
      file: fileName,
      version,
      importedAt: new Date().toLocaleString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
      total: sections.length,
      format: 'markdown'
    };
    localStorage.setItem(_tplKey('html-map-meta'), JSON.stringify(meta));
    updateHtmlMapBanner();
    updateHtmlMapModificationBadge();
    renderHtmlMap();
    _setHtmlMapModified();
    _blogLog('importado', meta.file, `v${meta.version} · ${sections.length} secciones`, 'htmlmap');
    _updateDocLogCount('htmlmap');
    document.getElementById('htmlmap-filter-bar').classList.remove('is-hidden');
    showToast('success', `Module Map importado — ${sections.length} secciones`);
  };
  reader.readAsText(file);
  event.target.value = '';
}

// parseHtmlMapMd / _isMapJson / _extractMapJson / _parseMapJson — migradas a locus-map-viewer.js
// loadHtmlMap migrada a locus-map-viewer.js (AC-10)

// ── B-202605-514: _getMapContent() — retorna string del MAP con versión aplicada ──
// Retorna null si no hay datos en localStorage.
// exportHtmlMapMd() y _mgExportAllZip() consumen esta función.
export function _getMapContent(ver) {
  // R-202605-XXX: MAP siempre Markdown — rama JSON eliminada
  const raw = localStorage.getItem(_tplKey('html-map-raw'));
  if (!raw) return null;
  const resolvedVer = ver || (typeof _effectiveVersion !== 'undefined' && _effectiveVersion
    ? _effectiveVersion
    : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v0'));
  return raw.replace(/Versi[oó]n:\s*[\d.v][\d.]*/, `Versión: ${resolvedVer}`);
}

// ── T-103 / T-202604-123: Exportar HTML-MAP con versión editable ──
export function exportHtmlMapMd() {
  // DUP-08: descarga directa — #htmlmap-export-overlay eliminado
  const raw = localStorage.getItem(_tplKey('html-map-raw'));
  if (!raw) { showToast('warning', 'Sin datos — importa primero'); return; }
  const ver = _mgGetVersion()
    ? _mgGetVersion()
    : (typeof _effectiveVersion !== 'undefined' && _effectiveVersion)
      ? _effectiveVersion
      : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v0');
  // R-202605-XXX: MAP siempre Markdown — rama JSON eliminada
  const ext = 'md';
  // B-202605-514: usar _getMapContent() — lógica de versioning centralizada
  const updated = _getMapContent(ver) || raw;
  _clearHtmlMapModifiedBadge();
  const fname = `${_docPrefix()}-MAP_${ver}.${ext}`;
  const mtype = 'text/markdown';
  const b = new Blob([updated], { type: mtype });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = fname;
  a.click(); URL.revokeObjectURL(u);
  _blogLog('exportado', fname, '', 'htmlmap');
  _updateDocLogCount('htmlmap');
  showToast('download', `${fname} exportado`);
}

// ── T-202604-102: Context vivo — import/store/export ──

// R-202605-136: detectar si el texto es JSON de CONTEXT (no Markdown)
function _isContextJson(text) {
  if (!text || !text.trim()) return false;
  try {
    const o = JSON.parse(text.trim());
    return typeof o === 'object' && o !== null && 'version' in o;
  } catch(e) { return false; }
}

// R-202605-136: parsear CONTEXT en formato JSON a estructura de secciones para renderContext
function parseContextJson(text) {
  let obj;
  try { obj = JSON.parse(text.trim()); }
  catch(e) { return { version: '—', sections: [], raw: text, isJson: true, error: e.message }; }

  const version = obj.version || '—';
  const sections = [];

  // Stack
  if (Array.isArray(obj.stack) && obj.stack.length) {
    const rows = obj.stack.map(s => `| ${s.layer||''} | ${s.tech||''} |`).join('\n');
    sections.push({ name: 'Stack', content: `| Capa | Tecnología |\n|------|------------|\n${rows}` });
  }

  // Estado / sprint
  if (obj.sprints) {
    const sp = obj.sprints;
    const sprintLines = [
      sp.active       ? `Sprint activo: ${sp.active}`              : null,
      sp.goal         ? `Goal: ${sp.goal}`                         : null,
      sp.version_target ? `Version target: ${sp.version_target}`   : null,
      sp.release_type ? `Release type: ${sp.release_type}`         : null
    ].filter(Boolean);
    sections.push({ name: 'Estado actual', content: sprintLines.join('\n') });
  }

  // Contadores
  if (obj.counters) {
    const c = obj.counters;
    sections.push({ name: 'Contadores', content: `P=${c.P||0} · T=${c.T||0} · R=${c.R||0} · B=${c.B||0}` });
  }

  // Decisiones técnicas
  if (Array.isArray(obj.decisions) && obj.decisions.length) {
    const rows = obj.decisions.map(d => `| ${d.date||'—'} | ${(d.text||'').replace(/\|/g,'\\|')} |`).join('\n');
    sections.push({ name: 'Decisiones técnicas registradas', content: `| Fecha | Decisión |\n|-------|----------|\n${rows}` });
  } else {
    sections.push({ name: 'Decisiones técnicas registradas', content: '_Sin decisiones técnicas registradas._' });
  }

  // Gaps
  if (Array.isArray(obj.gaps) && obj.gaps.length) {
    const rows = obj.gaps.map(g => `| ${g.code||'—'} | ${(g.title||'').replace(/\|/g,'\\|')} | ${g.priority||'—'} |`).join('\n');
    sections.push({ name: 'Gaps / pendientes sprint activo', content: `| Código | Título | Priority |\n|--------|--------|----------|\n${rows}` });
  } else {
    sections.push({ name: 'Gaps / pendientes sprint activo', content: '_Sin ítems pendientes en el sprint activo._' });
  }

  // Notas / Memoria operativa
  if (obj.notes && obj.notes.trim()) {
    sections.push({ name: 'Notas / Memoria operativa', content: obj.notes });
  }

  return { version, sections, raw: text, isJson: true };
}

function parseContextMd(text) {
  // Extrae versión y secciones del CONTEXT.md — read-only para CONTEXTs históricos en Markdown
  const versionMatch = text.match(/[Vv]ersi[oó]n:\s*([\d.]+)/);
  const version = versionMatch ? versionMatch[1] : '—';
  
  // Parsear secciones (por ## Nombre)
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push({
          name: currentSection,
          content: currentContent.join('\n').trim()
        });
      }
      currentSection = line.slice(3).trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    sections.push({
      name: currentSection,
      content: currentContent.join('\n').trim()
    });
  }
  
  return { version, sections, raw: text };
}

function importContextMd() {
  // Legacy stub — redirige al file picker (textarea eliminado)
  document.getElementById('context-file-input')?.click();
}

export function _importContextMdFromText(text) {
  if (!text || !text.trim()) { showToast('warning', '⚠ Archivo vacío o inválido'); return; }

  // R-202605-136: detectar formato JSON vs Markdown
  const looksJson = text.trim().startsWith('{');
  let parsed;
  if (looksJson) {
    // Validar JSON explícitamente antes de proceder
    try { JSON.parse(text.trim()); }
    catch(e) {
      showToast('error', `✗ JSON inválido: ${e.message}`);
      return;
    }
    parsed = parseContextJson(text);
  } else {
    parsed = parseContextMd(text);
  }

  const now = new Date().toLocaleString('es-MX', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });

  const meta = {
    version: parsed.version,
    importedAt: now,
    sectionCount: parsed.sections.length,
    lastModified: null,
    format: parsed.isJson ? 'json' : 'markdown'
  };
  localStorage.setItem(_tplKey('context-raw'), text);
  localStorage.setItem(_tplKey('context-meta'), JSON.stringify(meta));
  localStorage.setItem(_tplKey('context-sections'), JSON.stringify(parsed.sections));
  renderContext();
  _updateSubTabButtons('context');
  _blogLog('importado', `v${parsed.version}`, `${parsed.sections.length} secciones`, 'context');
  _updateDocLogCount('context');
  const fmtLabel = parsed.isJson ? ' · JSON' : '';
  showToast('success', `✓ CONTEXT v${parsed.version} importado (${parsed.sections.length} secciones${fmtLabel})`);
}

export function updateContextBanner() {
  const meta = JSON.parse(localStorage.getItem(_tplKey('context-meta')) || '{}');
  const vEl = document.getElementById('cmeta-version');
  const iEl = document.getElementById('cmeta-imported');
  const cEl = document.getElementById('cmeta-section-count');
  const fEl = document.getElementById('cmeta-format'); // opcional — graceful si no existe
  if (vEl) vEl.textContent = meta.version ? 'v' + meta.version : '—';
  if (iEl) iEl.textContent = meta.importedAt || '—';
  if (cEl) {
    const n = meta.sectionCount || 0;
    cEl.textContent = n ? n + ' secciones' : '';
  }
  if (fEl) fEl.textContent = meta.format ? meta.format.toUpperCase() : '';
}

// renderContextStatus — legacy stub (llamado desde código externo)
function renderContextStatus() { renderContext(); }

function _importContextMdFromFile(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => _importContextMdFromText(e.target.result);
  reader.readAsText(file);
}

// Handler unificado para dropzones — context, htmlmap, backlog
function _dropzoneHandle(event, doc) {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  if (doc === 'context') {
    const reader = new FileReader();
    reader.onload = e => _importContextMdFromText(e.target.result);
    reader.readAsText(file);
  } else if (doc === 'htmlmap') {
    importHtmlMap({ target: { files: [file], value: '' } });
  } else if (doc === 'backlog') {
    importBacklog({ target: { files: [file], value: '' } });
  }
}

// T-202604-108: marcar context como modificado en sesión + badge en sub-tab btn
function _setContextModified() {
  _contextModifiedInSession = true;
  const btn = document.getElementById('sstab-btn-context');
  if (btn && !btn.querySelector('.sstab-modified-dot')) {
    const dot = document.createElement('span');
    dot.className = 'sstab-modified-dot';
    dot.title = 'Context modificado en esta sesión';
    btn.appendChild(dot);
  }
  // Actualizar campo "Modificado" en banner
  const modSep = document.getElementById('cmeta-mod-sep');
  const modLabel = document.getElementById('cmeta-mod-label');
  const modVal = document.getElementById('cmeta-mod-val');
  const now = new Date().toLocaleString('es-MX', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  if (modSep) modSep.classList.remove('is-hidden');
  if (modLabel) modLabel.classList.remove('is-hidden');
  if (modVal) { modVal.classList.remove('is-hidden'); modVal.textContent = now; }
}

function _clearContextModifiedBadge() {
  const btn = document.getElementById('sstab-btn-context');
  if (btn) { const dot = btn.querySelector('.sstab-modified-dot'); if (dot) dot.remove(); }
  const modSep = document.getElementById('cmeta-mod-sep');
  const modLabel = document.getElementById('cmeta-mod-label');
  const modVal = document.getElementById('cmeta-mod-val');
  if (modSep) modSep.classList.add('is-hidden');
  if (modLabel) modLabel.classList.add('is-hidden');
  if (modVal) modVal.classList.add('is-hidden');
}

// T-202604-109: badge HTML-MAP modificado en sesión
function _setHtmlMapModified() {
  _htmlMapModifiedInSession = true;
  const btn = document.getElementById('sstab-btn-htmlmap');
  if (btn && !btn.querySelector('.sstab-modified-dot')) {
    const dot = document.createElement('span');
    dot.className = 'sstab-modified-dot';
    dot.title = 'Module Map modificado en esta sesión';
    btn.appendChild(dot);
  }
  // T-202604-109: Mostrar badge de actualización en el panel
  updateHtmlMapModificationBadge();
  // B-202604-118: auto-dismiss del badge después de 8s
  clearTimeout(_htmlMapModifiedTimer);
  _htmlMapModifiedTimer = setTimeout(() => _clearHtmlMapModifiedBadge(), 8000);
}

// B-202604-118: ocultar badge MAP-SECTION sin limpiar el flag de sesión
function _clearHtmlMapModifiedBadge() {
  clearTimeout(_htmlMapModifiedTimer);
  _htmlMapModifiedTimer = null;
  const modSep = document.getElementById('hmeta-mod-sep');
  const modLabel = document.getElementById('hmeta-mod-label');
  const modVal = document.getElementById('hmeta-mod-val');
  if (modSep) modSep.classList.add('is-hidden');
  if (modLabel) modLabel.classList.add('is-hidden');
  if (modVal) modVal.classList.add('is-hidden');
}

export function updateHtmlMapModificationBadge() {
  const meta = JSON.parse(localStorage.getItem('html-map-meta') || '{}');
  const htmlmapMeta = document.getElementById('htmlmap-meta-banner');
  if (!htmlmapMeta) return;
  
  const modSep = document.getElementById('hmeta-mod-sep');
  const modLabel = document.getElementById('hmeta-mod-label');
  const modVal = document.getElementById('hmeta-mod-val');
  
  if (_htmlMapModifiedInSession && meta.version) {
    const now = new Date().toLocaleString('es-MX', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    if (modSep) modSep.classList.remove('is-hidden');
    if (modLabel) modLabel.classList.remove('is-hidden');
    if (modVal) { modVal.classList.remove('is-hidden'); modVal.textContent = now; }
  }
}

// T-202604-110: badge Backlog modificado en sesión
export function _setBacklogModified() {
  _backlogModifiedInSession = true;
  const btn = document.getElementById('sstab-btn-backlog');
  if (btn && !btn.querySelector('.sstab-modified-dot')) {
    const dot = document.createElement('span');
    dot.className = 'sstab-modified-dot';
    dot.title = 'Backlog modificado en esta sesión';
    btn.appendChild(dot);
  }
  // T-202604-110: Mostrar badge de actualización en el panel
  updateBacklogModificationBadge();
}

export function updateBacklogModificationBadge() {
  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const backlogMeta = document.getElementById('backlog-meta-banner');
  if (!backlogMeta) return;
  
  const modSep = document.getElementById('bmeta-mod-sep');
  const modVal = document.getElementById('bmeta-mod-val');
  
  if (_backlogModifiedInSession && meta.version) {
    const now = new Date().toLocaleString('es-MX', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    if (modSep) modSep.classList.remove('is-hidden');
    if (modVal) { modVal.classList.remove('is-hidden'); modVal.textContent = '✎ ' + now; }
  }
}

// T-202604-108: extraer bloques CONTEXT-SECTION del texto pegado
export function extractContextSections(text) {
  const sections = [];
  // AC-3: solo procesar secciones dentro del bloque CHECKPOINT
  const ckptMatch = text.match(/---CHECKPOINT---([\s\S]*?)---FIN-CHECKPOINT---/);
  const scope = ckptMatch ? ckptMatch[1] : '';
  if (!scope) return sections;
  // Regex: CONTEXT-SECTION: <contenido> CONTEXT-SECTION-END
  const re = /CONTEXT-SECTION:\s*([\s\S]*?)CONTEXT-SECTION-END/g;
  let m;
  while ((m = re.exec(scope)) !== null) {
    const block = m[1].trim();
    // El header ## es la primera línea del bloque
    const headerMatch = block.match(/^(##[^\n]+)/);
    if (!headerMatch) continue;
    const header = headerMatch[1].trim();
    const content = block; // incluye el header
    sections.push({ header, content });
  }
  return sections;
}

// T-202604-108: merge de secciones al Context raw almacenado
export function mergeContextSections(sections, projId) {
  if (!sections.length) return;
  const _ctxKey = base => projId ? _projKey(base, projId) : _tplKey(base);
  let raw = localStorage.getItem(_ctxKey('context-raw')) || '';

  // Detección de conflicto: sección ya tocada en esta sesión
  const conflicts = sections.filter(s => _contextSectionsTouched.includes(s.header));
  if (conflicts.length) {
    const conflictArea = document.getElementById('context-conflict-area');
    if (conflictArea) {
      const names = conflicts.map(c => `<code>${esc(c.header)}</code>`).join(', ');
      conflictArea.innerHTML = `
        <div class="context-conflict-banner">
          ⚠ Conflicto — ${names} ya fue modificada en esta sesión.
          <button class="conflict-banner-dismiss">Ignorar</button>
        </div>`;
    }
    showToast('warning', '⚠ Conflicto de sección — revisa el banner en Context');
    return;
  }

  // Aplicar cada sección
  sections.forEach(({ header, content }) => {
    _contextSectionsTouched.push(header);
    const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sectionRe = new RegExp(`(${escapedHeader}[\\s\\S]*?)(?=\\n## |$)`);
    if (sectionRe.test(raw)) {
      raw = raw.replace(sectionRe, content);
    } else {
      raw = raw.trimEnd() + '\n\n' + content;
    }
  });

  const meta = JSON.parse(localStorage.getItem(_ctxKey('context-meta')) || '{}');
  const vMatch = sections.map(s => s.content).join('\n').match(/[Vv]ersi[oó]n:\s*([\d.]+)/);
  if (vMatch) meta.version = vMatch[1];

  localStorage.setItem(_ctxKey('context-raw'), raw);
  localStorage.setItem(_ctxKey('context-meta'), JSON.stringify(meta));
  _setContextModified();
  _blogLog('sección mergeada', '', `${sections.length} sección(es)`, 'context');
  _updateDocLogCount('context');
  saveContextDocs();
  updateContextBanner();
  if (currentSubTab === 'context') renderContext();
  showToast('success', `✓ Context actualizado — ${sections.length} sección(es) mergeada(s)`);
}

// extraer bloques MAP-SECTION del texto pegado
export function extractHtmlMapSections(text) {
  const sections = [];
  // AC-3: solo procesar secciones dentro del bloque CHECKPOINT
  const ckptMatch = text.match(/---CHECKPOINT---([\s\S]*?)---FIN-CHECKPOINT---/);
  const scope = ckptMatch ? ckptMatch[1] : '';
  if (!scope) return sections;
  const re = /MAP-SECTION:\s*([\s\S]*?)MAP-SECTION-END/g;
  let m;
  while ((m = re.exec(scope)) !== null) {
    const block = m[1].trim();
    const headerMatch = block.match(/^(##[^\n]+)/);
    if (!headerMatch) continue;
    const header = headerMatch[1].trim();
    sections.push({ header, content: block });
  }
  return sections;
}

// merge de secciones MAP-SECTION al HTML-MAP raw almacenado
export function mergeHtmlMapSections(sections, projId) {
  if (!sections.length) return;
  const _mapKey = base => projId ? _projKey(base, projId) : _tplKey(base);
  let raw = localStorage.getItem(_mapKey('html-map-raw')) || '';
  if (!raw) {
    showToast('warning', '⚠ Module Map no importado — secciones MAP-SECTION ignoradas');
    return;
  }
  sections.forEach(({ header, content }) => {
    const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sectionRe = new RegExp(`(${escapedHeader}[\\s\\S]*?)(?=\\n## |$)`);
    if (sectionRe.test(raw)) {
      raw = raw.replace(sectionRe, content);
    } else {
      raw = raw.trimEnd() + '\n\n' + content;
    }
  });
  // Re-parsear secciones navegables
  const parsed = parseHtmlMapMd(raw);
  localStorage.setItem(_mapKey('html-map-raw'), raw);
  localStorage.setItem(_mapKey('html-map-sections'), JSON.stringify(parsed));
  _setHtmlMapModified();
  _blogLog('sección mergeada', '', `${sections.length} sección(es)`, 'htmlmap');
  _updateDocLogCount('htmlmap');
  if (currentSubTab === 'htmlmap') renderHtmlMap();
  showToast('success', `✓ Module Map actualizado — ${sections.length} sección(es) mergeada(s)`);
}

// T-202604-108: renderContext — two states: empty / loaded
export function renderContext() {
  const emptyEl = document.getElementById('context-empty-state');
  const loadedEl = document.getElementById('context-loaded-state');
  if (!emptyEl || !loadedEl) return;

  const raw = localStorage.getItem(_tplKey('context-raw'));
  const hasData = !!raw;

  emptyEl.classList.toggle('is-hidden', hasData);
  loadedEl.classList.toggle('is-hidden', !hasData);

  if (!hasData) return;

  // Actualizar banner
  updateContextBanner();

  let sections;
  if (_isContextJson(raw)) {
    // R-202605-136: formato JSON — convertir a {title, lines} para _renderContextSections
    const parsed = parseContextJson(raw);
    sections = parsed.sections.map(s => ({
      title: s.name,
      lines: (s.content || '').split('\n')
    }));
  } else {
    // Markdown legacy — read-only: parsear por ## headers
    const lines = raw.split('\n');
    sections = [];
    let current = null;
    for (const line of lines) {
      if (/^## /.test(line)) {
        if (current) sections.push(current);
        current = { title: line.replace(/^## /, '').trim(), lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    }
    if (current) sections.push(current);
  }

  _ctxSections = sections; // cache para búsqueda
  _renderContextSections(sections, '');
}

// Cache interno de secciones para búsqueda sin re-parsear
let _ctxSections = [];

function _renderContextSections(sections, query) {
  const el = document.getElementById('context-content');
  if (!el) return;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sections.filter(s => s.title.toLowerCase().includes(q) || s.lines.join('\n').toLowerCase().includes(q))
    : sections;

  if (!filtered.length) {
    el.innerHTML = `<div class="ctx-search-empty">Sin resultados para "<strong>${esc(q)}</strong>"</div>`;
    return;
  }

  let html = '';
  filtered.forEach((sec, idx) => {
    const bodyMd = sec.lines.join('\n').trim();
    const bodyHtml = renderContextMd(bodyMd);
    // Secciones modificadas por CHECKPOINT en esta sesión — resaltar
    const isTouched = _contextSectionsTouched.includes('## ' + sec.title);
    const touchedClass = isTouched ? ' ctx-sec-touched' : '';
    const touchedBadge = isTouched ? '<span class="ctx-touched-badge">✎ actualizado</span>' : '';
    // Primera sección abierta por defecto (solo sin query)
    const openClass = (!q && idx === 0) ? ' open' : (q ? ' open' : '');
    html += `
      <div class="context-section${openClass}${touchedClass}" id="ctx-sec-${idx}">
        <div class="context-section-header" data-ctx-idx="${idx}">
          <span class="context-section-title">${esc(sec.title)}</span>
          ${touchedBadge}
          <span class="context-section-toggle">▾</span>
        </div>
        <div class="context-section-body">${bodyHtml}</div>
      </div>`;
  });
  el.innerHTML = html;
}

function onContextSearch() {
  const input = document.getElementById('ctx-search-input');
  const clear = document.getElementById('ctx-search-clear');
  const q = input ? input.value : '';
  if (clear) clear.classList.toggle('is-hidden', !q);
  _renderContextSections(_ctxSections, q);
}

function clearContextSearch() {
  const input = document.getElementById('ctx-search-input');
  const clear = document.getElementById('ctx-search-clear');
  if (input) input.value = '';
  if (clear) clear.classList.add('is-hidden');
  _renderContextSections(_ctxSections, '');
}

function contextShowImport() {
  const emptyEl = document.getElementById('context-empty-state');
  const loadedEl = document.getElementById('context-loaded-state');
  if (emptyEl) emptyEl.classList.remove('is-hidden');
  if (loadedEl) loadedEl.classList.add('is-hidden');
}

function toggleContextSection(idx) {
  const el = document.getElementById('ctx-sec-' + idx);
  if (el) el.classList.toggle('open');
}

// Render básico de Markdown a HTML para el body de secciones Context
function renderContextMd(md) {
  if (!md) return '';
  let html = '';
  const lines = md.split('\n');
  let inCode = false;
  let codeBuf = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return '';
    let t = '<table>';
    tableRows.forEach((row, i) => {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (i === 0) {
        t += '<tr>' + cells.map(c => `<th>${renderContextInline(c)}</th>`).join('') + '</tr>';
      } else if (/^[-:| ]+$/.test(row.replace(/\|/g, ''))) {
        // separador — skip
      } else {
        t += '<tr>' + cells.map(c => `<td>${renderContextInline(c)}</td>`).join('') + '</tr>';
      }
    });
    t += '</table>';
    tableRows = [];
    return t;
  };

  for (const line of lines) {
    // Bloques de código
    if (line.startsWith('```')) {
      if (inCode) {
        html += `<pre>${esc(codeBuf.join('\n'))}</pre>`;
        codeBuf = []; inCode = false;
      } else { inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // Tablas
    if (line.startsWith('|')) {
      if (inTable) { tableRows.push(line); }
      else { inTable = true; tableRows = [line]; }
      continue;
    } else if (inTable) {
      html += flushTable(); inTable = false;
    }

    // h3
    if (/^### /.test(line)) { html += `<h3>${esc(line.replace(/^### /, ''))}</h3>`; continue; }
    // listas
    if (/^[-*] /.test(line)) { html += `<li>${renderContextInline(line.replace(/^[-*] /, ''))}</li>`; continue; }
    if (/^\d+\. /.test(line)) { html += `<li>${renderContextInline(line.replace(/^\d+\. /, ''))}</li>`; continue; }
    // párrafo
    if (line.trim()) { html += `<p>${renderContextInline(line)}</p>`; continue; }
  }
  if (inCode) html += `<pre>${esc(codeBuf.join('\n'))}</pre>`;
  if (inTable) html += flushTable();
  return html;
}

function renderContextInline(text) {
  // bold, inline code, escaped
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// ── Context panel CSS ──


// ── Analytics v2 — estilos inyectados ──

// ── T-202605-031: Migración handlers on* → addEventListener ──
// Todos los handlers de locus-docs eliminados de index.html — se bindean aquí via DOMContentLoaded.
// Delegación en contenedores estáticos donde aplica.
document.addEventListener('DOMContentLoaded', () => {
  // context-file-input → _importContextMdFromFile
  const ctxFileInput = document.getElementById('context-file-input');
  if (ctxFileInput) ctxFileInput.addEventListener('change', _importContextMdFromFile);

  // doc-log-btn-backlog → openDocLog('backlog')
  const dlBacklog = document.getElementById('doc-log-btn-backlog');
  if (dlBacklog) dlBacklog.addEventListener('click', () => openDocLog('backlog'));

  // doc-log-btn-htmlmap → openDocLog('htmlmap')
  const dlHtmlmap = document.getElementById('doc-log-btn-htmlmap');
  if (dlHtmlmap) dlHtmlmap.addEventListener('click', () => openDocLog('htmlmap'));

  // htmlmap-file-input → importHtmlMap
  const hmFileInput = document.getElementById('htmlmap-file-input');
  if (hmFileInput) hmFileInput.addEventListener('change', importHtmlMap);

  // doc-log-btn-context → openDocLog('context')
  const dlContext = document.getElementById('doc-log-btn-context');
  if (dlContext) dlContext.addEventListener('click', () => openDocLog('context'));

  // .ctx-import-btn → contextShowImport (sin ID — selector de clase)
  const ctxImportBtn = document.querySelector('.ctx-import-btn');
  if (ctxImportBtn) ctxImportBtn.addEventListener('click', contextShowImport);

  // ctx-search-input → onContextSearch
  const ctxSearch = document.getElementById('ctx-search-input');
  if (ctxSearch) ctxSearch.addEventListener('input', onContextSearch);

  // ctx-search-clear → clearContextSearch
  const ctxClear = document.getElementById('ctx-search-clear');
  if (ctxClear) ctxClear.addEventListener('click', clearContextSearch);

  // doc-log-overlay → closeDocLog
  const dlOverlay = document.getElementById('doc-log-overlay');
  if (dlOverlay) dlOverlay.addEventListener('click', closeDocLog);

  // .doc-log-close-btn → closeDocLog (sin ID — selector de clase)
  const dlCloseBtn = document.querySelector('.doc-log-close-btn');
  if (dlCloseBtn) dlCloseBtn.addEventListener('click', closeDocLog);

  // mg-export-htmlmap-btn → exportHtmlMapMd
  const mgExportHtmlmap = document.getElementById('mg-export-htmlmap-btn');
  if (mgExportHtmlmap) mgExportHtmlmap.addEventListener('click', exportHtmlMapMd);

  // ── T-202605-034: Delegación handlers dinámicos ──

  // .docs-ob-step-action [data-step-idx] → _docsOnboardingAction
  // Banner se inserta en sspanel dinámico — document como raíz
  document.addEventListener('click', function(e) {
    const stepBtn = e.target.closest('.docs-ob-step-action[data-step-idx]');
    if (stepBtn) {
      const idx = parseInt(stepBtn.dataset.stepIdx, 10);
      _docsOnboardingAction(idx);
    }
  });

  // .docs-ob-header [data-docs-ob-toggle] → toggle body visibility
  document.addEventListener('click', function(e) {
    const header = e.target.closest('.docs-ob-header[data-docs-ob-toggle]');
    if (header) {
      const body = header.parentElement.querySelector('.docs-ob-body');
      const progress = header.querySelector('.docs-ob-progress');
      if (body) {
        body.classList.toggle('is-hidden');
        if (progress) progress.textContent = body.classList.contains('is-hidden') ? '\u25b8' : '\u25be';
      }
    }
  });

  // .docs-ob-dismiss → _dismissDocsOnboarding
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.docs-ob-dismiss');
    if (btn) {
      e.stopPropagation();
      _dismissDocsOnboarding();
    }
  });

  // .conflict-banner-dismiss → remove banner — delegado en #context-conflict-area
  const conflictArea = document.getElementById('context-conflict-area');
  if (conflictArea) {
    conflictArea.addEventListener('click', function(e) {
      const btn = e.target.closest('.conflict-banner-dismiss');
      if (btn) btn.closest('.context-conflict-banner').remove();
    });
  }

  // .context-section-header [data-ctx-idx] → toggleContextSection — delegado en #context-content
  const ctxContent = document.getElementById('context-content');
  if (ctxContent) {
    ctxContent.addEventListener('click', function(e) {
      const header = e.target.closest('.context-section-header[data-ctx-idx]');
      if (header) {
        const idx = parseInt(header.dataset.ctxIdx, 10);
        toggleContextSection(idx);
      }
    });
  }

  // ── END T-202605-034 ──

});
// ── END T-202605-031 locus-docs ──

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
window._setBacklogModified          = _setBacklogModified;
window._updateSubTabButtons         = _updateSubTabButtons;
window.importHtmlMap                = importHtmlMap;
window._importContextMdFromText     = _importContextMdFromText;
window._getMapContent               = _getMapContent;
window.exportHtmlMapMd              = exportHtmlMapMd;
window.updateContextBanner          = updateContextBanner;
window.renderContext                = renderContext;
window.extractContextSections       = extractContextSections;
window.mergeContextSections         = mergeContextSections;
window.extractHtmlMapSections       = extractHtmlMapSections;
window.mergeHtmlMapSections         = mergeHtmlMapSections;
window._renderTplProjBanner         = _renderTplProjBanner;
window._renderDocsOnboarding        = _renderDocsOnboarding;
window.updateHtmlMapModificationBadge = updateHtmlMapModificationBadge;
window.updateBacklogModificationBadge = updateBacklogModificationBadge;
window.importContextMd              = importContextMd;
window.onContextSearch              = onContextSearch;
window.clearContextSearch           = clearContextSearch;
window.contextShowImport            = contextShowImport;
window.toggleContextSection         = toggleContextSection;
window.renderContextMd              = renderContextMd;
window.renderContextInline          = renderContextInline;
window.renderContextStatus          = renderContextStatus;
