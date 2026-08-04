// [PP] mod:26 · autor:Rune · 2026-08-04 UTC-6
// INC-202608-087 (derivado de INC-202608-085, misma auditoría end-to-end footer
// DOC-UPDATEs): #sstab-btn-docupdates (index.html) nace is-hidden y ningún módulo lo
// revelaba — verificado sin ocurrencias en este archivo, locus-projects.js,
// locus-ui-shell.js ni locus-contracts.js. Fix: _updateDocUpdatesBadge() toggla is-hidden
// del sub-tab según total de entradas pendientes (AC1/AC2). processDocUpdate() ahora llama
// renderDocUpdatesPending() en sus dos ramas mutantes (primera entrada / conflicto) — sin
// esto, el sub-tab recién revelado nunca se actualizaba hasta que el usuario lo activara
// manualmente, imposible mientras seguía is-hidden (círculo cerrado). AC3 del INC (navegar
// desde el footer #gf-ckpt) queda sin verificar — ese código vive en
// locus-sesiones-stats.js (_getFooterAlert), no adjunto en esta sesión.
// [PP] mod:25 · autor:Rune · 2026-08-04 UTC-6
// INC-202608-085 (auditoría end-to-end footer DOC-UPDATEs solicitada por el founder):
// processDocUpdate() corregido — leía { doc, seccion, contenido } (nombres del formato
// Markdown legacy) en vez de doc/section/content (schema JSON vigente, __BR-Ecosystem §8).
// Toda entrada real llegaba indexada como "[doc]::undefined" con contenido perdido; dos
// DOC-UPDATEs del mismo doc en secciones distintas colisionaban en la misma key. Fix con
// fallback a los nombres legacy — extractDocUpdates() y su único call site (path Markdown en
// locus-session-save.js) siguen funcionando sin cambio. Se agregan accion/escalateTo al
// índice — antes se perdían siempre, sin excepción. Ver detalle completo en el comentario de
// la función. contract_update: sí — nuevos campos accion/escalateTo en las entradas de
// docUpdateIndex[key][], consumidos por locus-backlog-sprints.js (Paso 2 del cierre de sprint,
// mismo CHECKPOINT). No modifica extractDocUpdates(), renderDocUpdatesPending() ni
// resolveDocUpdate() — el fix es exclusivo del punto de entrada.
// [PP] mod:24 · autor:Rune · 2026-07-30 09:00 UTC-6
// INC-202607-073: importHtmlMap() y _importContextMdFromText() escribían CONTEXT/HTML-MAP
// solo a localStorage y nunca llamaban saveContextDocs() — tracker_docs quedaba vacía en
// Supabase desde la migración a JSON CHECKPOINT. _tplKey() ya resuelve el proyecto activo
// internamente (verificado contra locus-storage.js) — no era bug de scoping, solo la
// llamada faltante. Fix: agregar saveContextDocs() al final de ambos flujos de import.
// TKT1 (REQ CAEL-0720-01): _updateSubTabButtons() — btn-export-backlog/btn-export-backlog-full
// ahora visibles en los 4 subtabs de Backlog (backlog/qbacklog/qdisc/historico) vía
// _exportBarSubs.includes(sub), en vez de sub !== 'backlog'. Sin cambio de firma —
// contract_update: no.
// [PP] mod:22 · autor:Rune · 2026-07-17 UTC-6
// TKT-202607-032 (REQ-202607-004) AC-2: banner .du-vencido-banner/-icon/-msg (entregable Nova,
// locus-docs.css mod:5) integrado en renderDocUpdatesPending() — un banner por entrada
// vencida, antepuesto a la lista, texto literal __BR-Ecosystem §5. Opción B — sin selector de
// rol. AC-4 retirado (Cael, patch previo) — sin selector de rol no hay "quién no es dueño".
// contract_update: n/a — firma sin cambio.
// [PP] mod:21 · autor:Rune · 2026-07-17 UTC-6
// TKT-202607-032 (REQ-202607-004) AC-1: renderDocUpdatesPending() ordena keys — entradas con
// vencido:true primero (sort estable, sin alterar orden relativo dentro de cada grupo). Cierra
// el gap que dejó TKT-CAEL-0717-02 (renderizaba el badge pero no reordenaba).
// [PP] mod:20 · autor:Rune · 2026-07-17 UTC-6
// TKT-CAEL-0717-02 (REQ-CAEL-0717-01): renderDocUpdatesPending() consume entries[].vencido
// (ya calculado por _scmExecuteClose() — locus-backlog-sprints.js, fix TKT-202607-031) y
// renderiza .du-meta-vencido en ambas ramas (con y sin conflicto). Sin nueva función — solo
// lectura del campo existente. No toca _docUpdateStaleness() (locus-sesiones-stats.js) — ese
// criterio de 14d es intencionalmente distinto, ver comentario en CSS.
// [PP] mod:19 · autor:Rune · 2026-07-15 UTC-6
// TKT-[pendiente-ID] (REQ-[pendiente-ID] · createdAt en docUpdateIndex): processDocUpdate()
//   agrega createdAt:Date.now() a toda entrada nueva (primera entrada de una key y entradas
//   de conflicto) — desbloquea el cómputo de vencimiento del DOC-UPDATE. resolveDocUpdate()
//   no se toca: el spread {...entries[chosenIndex]} ya conserva createdAt sin cambios.
//   Entradas persistidas antes de este cambio quedan sin createdAt — se leen sin error
//   (ningún consumo actual del campo), antigüedad tratada como "desconocida" hasta que la
//   entrada se resuelva o expire por ciclo normal del sprint.
// [PP] mod:16 · autor:Rune · 2026-07-13 UTC-6
// INC-[pendiente-ID]: import real de APP_VERSION desde locus-workers.js — guard
// typeof APP_VERSION !== 'undefined' nunca era true (variable module-privada, sin export
// hasta este fix). Fallback literal 'v0' retirado — resuelve siempre a un valor real ahora
// que la cadena de fallback (_effectiveVersion → APP_VERSION) tiene ambos eslabones vivos.
// [PP] mod:15 · autor:Rune · 2026-07-13 00:50 UTC-6
// TKT-[pendiente-ID] (REQ-[pendiente-ID] · sidebar DocLog): los 3 botones doc-log-btn-*
//   (uno por sub-panel: backlog/htmlmap/context) se retiran de sus toolbars — ver index.html.
//   Se reemplazan por un único #btn-view-doclog en Acciones del sidebar, mostrado/titulado
//   según el sub-tab activo y abriendo openDocLog(getCurrentSubTab()) — ver _updateSubTabButtons.
// TKT-202607-007 (Sprint PP-S-01 / __OB-Strategy §5 regla dura de separador de versión):
//   _validateDocFileNameVersionSeparator ahora existe e implementada — la entrega mod:13
//   documentó la función en este header pero el cuerpo nunca se escribió (0 definiciones,
//   0 invocaciones reales); Finn lo detectó en auditoría y devolvió a Rune. Valida que el
//   segmento -vN.N.N del nombre de archivo use "." como separador, no "_". Enganchada en
//   importHtmlMap, _importContextMdFromFile y la rama 'context' de _dropzoneHandle — únicos
//   puntos de este archivo que reciben un objeto File real con .name disponible antes de leer
//   el contenido. Doc Refs (css-ref, ux-ref, ui-Inventory, module-contracts) no tienen import
//   flow en este archivo — quedan fuera del alcance por construcción: sin segmento -vN.N.N
//   reconocible, la función retorna sin efecto (AC3 edge case). No toca _importContextMdFromText
//   — su firma no cambia, sigue sin recibir fileName.
// locus-docs.js
// Última actualización: 2026-05-28 UTC-6
// Módulo: Sub-tab Documentos — Context vivo, HTML-MAP import/export, Docs onboarding, modificación badges
// Extraído de ai-tracker-ai-notes.js

import { _updateUndoUI } from './locus-backlog-core.js';
import { closeDocLog, openDocLog, _updateDocLogCount } from './locus-doc-log.js';
import { _mgGetVersion } from './locus-map-generator.js';
import { parseHtmlMapMd, renderHtmlMap, updateHtmlMapBanner } from './locus-map-viewer.js';
import { _blogLog, _docPrefix, _effectiveVersion, _getDocUpdateIndex, _projKey, _setDocUpdateIndex, _tplKey, getActiveProject, saveContextDocs } from './locus-storage.js';
import { APP_VERSION } from './locus-workers.js'; // INC-[pendiente-ID]: import real — antes typeof-guard muerto sobre variable privada

// T-202606-166: _docPrefix movida a locus-storage.js

import { showToast } from './locus-toast.js';

import { esc, getCurrentSubTab, switchSubTab } from './locus-ui-shell.js';

// TKT-202607-007: valida que el segmento -vN.N.N del nombre de archivo use "." como
// separador — no "_". Sin segmento de versión reconocible (Doc Refs sin versión en el
// nombre) retorna sin efecto — AC3 edge case. No bloquea el import — solo alerta a DocLog.
function _validateDocFileNameVersionSeparator(fileName, category) {
  if (!fileName) return;
  const m = fileName.match(/-v(\d+[.\d_]*\d)\.md$/i);
  if (!m) return; // sin segmento -vN.N.N — Doc Ref u otro nombre sin versión, no aplica
  const versionSegment = m[1];
  if (versionSegment.includes('_')) {
    _blogLog(
      'nombre-invalido',
      fileName,
      `Separador de versión inválido: ${fileName} usa "_" — separador canónico es "." (ver __OB-Strategy §5).`,
      category
    );
  }
}

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
  // TKT1 (REQ CAEL-0720-01): barra de exportación (Descargar Backlog / Historial completo)
  // visible en los 4 subtabs del tab Backlog — antes solo en 'backlog'. Mismo set que
  // _backlogSubs en locus-ui-shell.js (switchTab) — duplicado local porque esa constante
  // no está exportada. No toca btn-undo-backlog/btn-redo-backlog/btn-new-item, que
  // permanecen exclusivos de sub === 'backlog' (ver bloque undoRow debajo, sin cambio).
  const _exportBarSubs = ['backlog', 'qbacklog', 'qdisc', 'historico'];
  if (btnE) btnE.classList.toggle('is-hidden', !_exportBarSubs.includes(sub));
  if (btnFull) btnFull.classList.toggle('is-hidden', !_exportBarSubs.includes(sub));
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
  // btn-view-doclog — visible solo en backlog/htmlmap/context (únicos docs con log) — TKT-[pendiente-ID]
  const btnViewDocLog = document.getElementById('btn-view-doclog');
  if (btnViewDocLog) {
    const docLogTitles = { backlog: 'Historial de acciones del Backlog', htmlmap: 'Historial de acciones del MAP', context: 'Historial de acciones del Context' };
    const hasDocLog = sub in docLogTitles;
    btnViewDocLog.classList.toggle('is-hidden', !hasDocLog);
    if (hasDocLog) {
      btnViewDocLog.title = docLogTitles[sub];
      _updateDocLogCount(sub);
    }
  }

  // AC-3 (T-202606-033): sub docupdates — renderizar al activar
  if (sub === 'docupdates') {
    renderDocUpdatesPending();
  }
  // Collapse danger body when switching tabs
  const dangerBody = document.getElementById('tpl-danger-body');
  if (dangerBody) dangerBody.classList.remove('open');
  // sub-tab plan — no tiene botones de acción ni danger zone (read-only)
  if (sub === 'plan') {
    if (dangerZone) dangerZone.classList.add('is-hidden');
  }
  // sub-tab docupdates — sin danger zone
  if (sub === 'docupdates') {
    if (dangerZone) dangerZone.classList.add('is-hidden');
  }
  // Hide actions section label if no buttons visible
  // TKT1 (REQ CAEL-01) inline_fix: dos contenedores comparten .tpl-sidebar-actions
  // (#tpl-toolbar en Backlog, #proj-doc-actions en Proyectos) — resolver por ID según
  // el dominio de `sub`, no por querySelector genérico (tomaba siempre el primer match).
  const actionsSection = document.getElementById(
    ['htmlmap', 'context', 'docupdates', 'contratos'].includes(sub) ? 'proj-doc-actions' : 'tpl-toolbar'
  );
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

// HTML_MAP_SECTIONS y htmlMapFilter migrados a locus-map-viewer.js (AC-10)

export function importHtmlMap(event) {
  // R-202605-XXX: solo Markdown — rama JSON eliminada
  const file = event.target.files[0];
  if (!file) return;
  _validateDocFileNameVersionSeparator(file.name, 'htmlmap');
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
    // INC-202607-073: persistir a tracker_docs — antes solo quedaba en localStorage.
    saveContextDocs();
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
    : APP_VERSION);
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
      : APP_VERSION;
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
  // INC-202607-073: persistir a tracker_docs — antes solo quedaba en localStorage.
  saveContextDocs();
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
  _validateDocFileNameVersionSeparator(file.name, 'context');
  const reader = new FileReader();
  reader.onload = e => _importContextMdFromText(e.target.result);
  reader.readAsText(file);
}

// Handler unificado para dropzones — context, htmlmap
export function _dropzoneHandle(event, doc) {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  if (doc === 'context') {
    _validateDocFileNameVersionSeparator(file.name, 'context');
    const reader = new FileReader();
    reader.onload = e => _importContextMdFromText(e.target.result);
    reader.readAsText(file);
  } else if (doc === 'htmlmap') {
    importHtmlMap({ target: { files: [file], value: '' } });
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

// ── T-202606-032: Extracción y procesamiento de DOC-UPDATEs desde CHECKPOINT ──

// extractDocUpdates — extrae bloques ---DOC-UPDATE--- del texto pegado.
// Solo procesa dentro del bloque ---CHECKPOINT--- / ---FIN-CHECKPOINT---.
// Retorna array de { doc, seccion, accion, contenido } — un objeto por bloque.
export function extractDocUpdates(text) {
  const updates = [];
  const ckptMatch = text.match(/---CHECKPOINT---([\s\S]*?)---FIN-CHECKPOINT---/);
  const scope = ckptMatch ? ckptMatch[1] : '';
  if (!scope) return updates;
  const re = /---DOC-UPDATE---([\s\S]*?)---DOC-UPDATE-END---/g;
  let m;
  while ((m = re.exec(scope)) !== null) {
    const block = m[1];
    const doc     = (block.match(/^doc:\s*(.+)/m)     || [])[1]?.trim() || '';
    const seccion = (block.match(/^seccion:\s*(.+)/m) || [])[1]?.trim() || '';
    const accion  = (block.match(/^accion:\s*(.+)/m)  || [])[1]?.trim() || '';
    // contenido: todo lo que sigue a la línea "contenido:"
    const contenidoMatch = block.match(/^contenido:\s*\n([\s\S]*)/m);
    const contenido = contenidoMatch ? contenidoMatch[1].trim() : '';
    if (doc && seccion) updates.push({ doc, seccion, accion, contenido });
  }
  return updates;
}

// processDocUpdate — registra un DOC-UPDATE en el índice del proyecto activo.
// Detecta conflicto (misma key, contenido distinto), actualiza flags y llama save().
// checkpointTitle: campo Título del CHECKPOINT de origen — para el mensaje de conflicto.
// Retorna { key, conflicto, msg } — msg es la alerta de conflicto si aplica.
// INC-202608-085 (hallazgo de auditoría end-to-end del footer DOC-UPDATEs, 2026-08-04):
// esta función solo leía { doc, seccion, contenido } — nombres en español, heredados del
// formato Markdown legacy ---DOC-UPDATE--- (extractDocUpdates(), arriba en este archivo, que
// sí produce esos nombres). El schema JSON vigente (único formato válido hoy, __BR-Ecosystem
// §8) usa doc/section/action/escalate_to/content — nombres en inglés. Los 4 call sites reales
// (parsePaste y batch en locus-session-parse.js, path Markdown y path JSON en
// locus-session-save.js) pasan el objeto crudo sin remapear — confirmado que
// locus-session-parse.js ~L2140 ya usa du.section correctamente para otro propósito, prueba de
// que el campo real es `section`, no `seccion`. Efecto: toda entrada del schema JSON se
// indexaba como "[doc]::undefined" con contenido perdido, y dos DOC-UPDATEs del mismo doc en
// secciones distintas colisionaban en la misma key (conflicto falso). action/escalate_to nunca
// se persistían. Fix: normalizar con fallback al nombre legacy — sin tocar extractDocUpdates()
// ni ningún call site, causa raíz resuelta en el único punto de entrada. contract_update: sí
// — ver CHECKPOINT de esta entrega, entradas de docUpdateIndex[key][] ganan accion/escalateTo.
export function processDocUpdate(update, checkpointTitle) {
  const doc        = update.doc;
  const seccion     = update.section      ?? update.seccion   ?? '';
  const contenido   = update.content      ?? update.contenido ?? '';
  const accion      = update.action       ?? update.accion    ?? '';
  const escalateTo  = update.escalate_to  ?? update.escalateTo ?? '';
  const key = doc + '::' + seccion;
  const index = _getDocUpdateIndex();

  if (!index[key]) {
    // Primera entrada para esta key en el sprint — sin conflicto
    // REQ-[pendiente-ID] (TKT1): createdAt registra el momento exacto de creación de la
    // entrada — base para el cómputo de vencimiento (footer alert prioridad 3 / BR-Ecosystem §3).
    index[key] = [{ contenido, titulo: checkpointTitle, conflicto: false, createdAt: Date.now(), accion, escalateTo }];
    _setDocUpdateIndex(index);
    _blogLog('ckpt-creado', key, checkpointTitle, 'backlog');
    // INC-202608-087: sin este call, el sub-tab/badge no reflejaban la entrada nueva hasta
    // que el sub-tab (hasta ahora inalcanzable) se activara manualmente — círculo cerrado.
    renderDocUpdatesPending();
    return { key, conflicto: false, msg: null };
  }

  const existing = index[key];

  // AC-4: entrada idempotente — mismo contenido exacto, no genera conflicto
  const duplicate = existing.find(e => e.contenido === contenido);
  if (duplicate) {
    // Sin cambio en el índice — entrada ya presente
    return { key, conflicto: false, msg: null };
  }

  // AC-2: contenido distinto → conflicto — marcar ambas entradas existentes y la nueva
  // createdAt de la entrada nueva es propio — no hereda el de las entradas previas de la key.
  existing.forEach(e => { e.conflicto = true; });
  existing.push({ contenido, titulo: checkpointTitle, conflicto: true, createdAt: Date.now(), accion, escalateTo });
  _setDocUpdateIndex(index);
  _blogLog('ckpt-creado', key, 'conflicto: ' + checkpointTitle, 'backlog');
  // INC-202608-087: mismo criterio que la rama sin conflicto — mantener el sub-tab/badge
  // sincronizados con el índice real en cuanto cambia, no solo al activar el sub-tab.
  renderDocUpdatesPending();

  const titulos = existing.map(e => e.titulo).filter(Boolean);
  const msg = 'Conflicto DOC-UPDATE: ' + seccion + ' de ' + doc +
    ' tiene dos propuestas contradictorias — ' + titulos[0] + ' vs ' + titulos[titulos.length - 1] +
    '. Resolver antes de aplicar.';
  return { key, conflicto: true, msg };
}

// resolveDocUpdate — el dueño elige una propuesta; descarta las demás.
// chosenIndex: índice dentro del array index[key] de la propuesta elegida.
// Registra descarte en DocLog para cada entrada no elegida.
export function resolveDocUpdate(key, chosenIndex) {
  const index = _getDocUpdateIndex();
  if (!index[key]) return;
  const entries = index[key];
  entries.forEach((e, i) => {
    if (i !== chosenIndex) {
      _blogLog('descartado', key, 'descartado · conflicto resuelto a favor de: ' + (entries[chosenIndex]?.titulo || ''), 'backlog');
    }
  });
  // Conservar solo la entrada elegida, sin flag de conflicto
  const chosen = { ...entries[chosenIndex], conflicto: false };
  index[key] = [chosen];
  _setDocUpdateIndex(index);
}
// ── END T-202606-032 ──────────────────────────────────────────────────────────

// ── T-202606-033: UI de alerta y resolución de conflicto DOC-UPDATE ──────────

// renderDocUpdatesPending — renderiza la lista de DOC-UPDATEs pendientes en #doc-updates-list.
// Entradas en conflicto muestran bandera visual + títulos de ambos CHECKPOINTs.
// Botón Aplicar deshabilitado mientras el conflicto no esté resuelto.
export function renderDocUpdatesPending() {
  const container = document.getElementById('doc-updates-list');
  if (!container) return;

  const index = _getDocUpdateIndex();
  // TKT-202607-032 AC-1: entradas con vencido:true se renderizan primero — sort estable,
  // no altera el orden relativo entre entradas del mismo estado (vencido/no vencido).
  const keys = Object.keys(index).sort((a, b) => {
    const aVencido = (index[a] || []).some(e => e.vencido === true);
    const bVencido = (index[b] || []).some(e => e.vencido === true);
    if (aVencido === bVencido) return 0;
    return aVencido ? -1 : 1;
  });

  if (!keys.length) {
    container.innerHTML = '<div class="du-empty-state">Sin DOC-UPDATEs pendientes en este sprint.</div>';
    _updateDocUpdatesBadge(0, 0);
    return;
  }

  let conflictCount = 0;
  // TKT-202607-032 AC-2: un banner de bloqueo por entrada vencida — texto literal de
  // __BR-Ecosystem §5, sin selector de rol (Opción B confirmada por founder). Se antepone
  // a la lista, no reemplaza el badge por-entrada (.du-meta-vencido) ya existente.
  const vencidoBanners = [];
  const html = keys.map(key => {
    const entries = index[key];
    const hasConflict = entries.some(e => e.conflicto);
    if (hasConflict) conflictCount++;

    const [doc, seccion] = key.split('::');
    const keyAttr = esc(key);
    // TKT-CAEL-0717-02 (REQ-CAEL-0717-01): vencido ya viene calculado por
    // _scmExecuteClose() (locus-backlog-sprints.js, fix TKT-202607-031) — 2+ sprints
    // cerrados del proyecto desde createdAt. No se recalcula aquí, solo se lee.
    const isVencido = entries.some(e => e.vencido === true);
    const vencidoBadgeHtml = isVencido ? '<span class="du-meta-vencido">Vencido</span>' : '';
    if (isVencido) {
      vencidoBanners.push(`
        <div class="du-vencido-banner">
          <span class="du-vencido-icon">⚠</span>
          <span class="du-vencido-msg">Bloqueo: DOC-UPDATE ${esc(doc)}§${esc(seccion)} vencido — resolver antes de continuar.</span>
        </div>`);
    }

    if (hasConflict) {
      // AC-1 + AC-2: bandera visual con mensaje canónico y títulos de los CHECKPOINTs
      const titulos = entries.map(e => esc(e.titulo || '—'));
      const optionsHtml = entries.map((e, i) => `
        <label class="du-conflict-option">
          <input type="radio" name="du-resolve-${keyAttr}" value="${i}" class="du-conflict-radio">
          <span class="du-conflict-option-title">${esc(e.titulo || '—')}</span>
          <span class="du-conflict-option-preview">${esc((e.contenido || '').slice(0, 120))}${(e.contenido || '').length > 120 ? '…' : ''}</span>
        </label>`).join('');
      // T-202606-034-2g (revisado): recordatorio de regla transitoria — aplica a todas las entradas, con y sin conflicto

      return `
        <div class="du-entry du-entry--conflict" data-du-key="${keyAttr}">
          <div class="du-conflict-flag">
            <span class="du-conflict-icon">⚠</span>
            <span class="du-conflict-msg">Conflicto DOC-UPDATE: <strong>${esc(seccion)}</strong> de <strong>${esc(doc)}</strong> tiene dos propuestas contradictorias — ${titulos[0]} vs ${titulos[titulos.length - 1]}. Resolver antes de aplicar.</span>
          </div>
          <div class="du-meta">
            <span class="du-meta-doc">${esc(doc)}</span>
            <span class="du-meta-sep">·</span>
            <span class="du-meta-section">${esc(seccion)}</span>
            ${vencidoBadgeHtml}
          </div>
          <div class="du-transitorio-note">Regla transitoria activa — verificar que el MD actualizado está adjunto al CHECKPOINT de origen.</div>
          <div class="du-conflict-options" role="group" aria-label="Elegir propuesta">
            ${optionsHtml}
          </div>
          <div class="du-actions">
            <button class="du-btn-resolve" data-du-key="${keyAttr}" disabled aria-disabled="true">Resolver conflicto</button>
            <button class="du-btn-apply is-hidden" data-du-key="${keyAttr}" disabled aria-disabled="true">Aplicar</button>
          </div>
        </div>`;
    }

    // Sin conflicto — botón Aplicar habilitado
    const entry = entries[0];
    // T-202606-034-2g: recordatorio de regla transitoria BR-Core §8 — visible en cada entrada
    // Entrada: DOC-UPDATE pendiente; Salida: recordatorio visible en la tarjeta
    const _duTransitorioHtml = `<div class="du-transitorio-note">Regla transitoria activa — verificar que el MD actualizado está adjunto al CHECKPOINT de origen.</div>`;
    return `
      <div class="du-entry" data-du-key="${keyAttr}">
        <div class="du-meta">
          <span class="du-meta-doc">${esc(doc)}</span>
          <span class="du-meta-sep">·</span>
          <span class="du-meta-section">${esc(seccion)}</span>
          <span class="du-meta-sep">·</span>
          <span class="du-meta-titulo">${esc(entry.titulo || '—')}</span>
          ${vencidoBadgeHtml}
        </div>
        ${_duTransitorioHtml}
        <div class="du-content-preview">${esc((entry.contenido || '').slice(0, 200))}${(entry.contenido || '').length > 200 ? '…' : ''}</div>
        <div class="du-actions">
          <button class="du-btn-apply" data-du-key="${keyAttr}">Aplicar</button>
          <button class="du-btn-discard" data-du-key="${keyAttr}">Descartar</button>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = vencidoBanners.join('') + html;
  _updateDocUpdatesBadge(keys.length, conflictCount);
}

// _updateDocUpdatesBadge — actualiza el badge del nav btn y el contador de conflictos.
// INC-202608-087 (auditoría end-to-end footer DOC-UPDATEs, derivada de INC-202608-085):
// #sstab-btn-docupdates nace is-hidden en index.html y ningún módulo lo revelaba —
// verificado sin ocurrencias en locus-docs.js, locus-projects.js, locus-ui-shell.js ni
// locus-contracts.js. Este es el único punto de la app que ya conoce el conteo real de
// DOC-UPDATEs pendientes (total, recibido de renderDocUpdatesPending()) en cada render —
// se agrega el toggle del sub-tab aquí en vez de introducir un nuevo call site. sin AC de
// contrato adicional: no cambia firma, agrega efecto lateral sobre un botón hasta ahora
// inalcanzable.
function _updateDocUpdatesBadge(total, conflicts) {
  const badge = document.getElementById('tpl-badge-docupdates');
  if (badge) {
    badge.textContent = conflicts > 0 ? String(conflicts) : '';
    badge.classList.toggle('du-badge--conflict', conflicts > 0);
  }
  const conflictSummary = document.getElementById('du-conflict-summary');
  if (conflictSummary) {
    conflictSummary.textContent = conflicts > 0
      ? `${conflicts} conflicto${conflicts > 1 ? 's' : ''} sin resolver`
      : '';
    conflictSummary.classList.toggle('is-hidden', conflicts === 0);
  }
  // INC-202608-087, AC1+AC2: revelar/ocultar el sub-tab según haya o no entradas pendientes.
  const subTabBtn = document.getElementById('sstab-btn-docupdates');
  if (subTabBtn) {
    subTabBtn.classList.toggle('is-hidden', total === 0);
  }
}

// _initDocUpdatesListeners — delega clicks en #doc-updates-list.
function _initDocUpdatesListeners() {
  const list = document.getElementById('doc-updates-list');
  if (!list) return;

  // Radio change → habilitar "Resolver conflicto" cuando hay selección
  list.addEventListener('change', function(e) {
    const radio = e.target.closest('.du-conflict-radio');
    if (!radio) return;
    const entry = radio.closest('.du-entry--conflict');
    if (!entry) return;
    const btnResolve = entry.querySelector('.du-btn-resolve');
    if (btnResolve) {
      btnResolve.disabled = false;
      btnResolve.removeAttribute('aria-disabled');
    }
  });

  list.addEventListener('click', function(e) {

    // AC-2: "Resolver conflicto" → elige la propuesta seleccionada, descarta las demás
    const btnResolve = e.target.closest('.du-btn-resolve');
    if (btnResolve && !btnResolve.disabled) {
      const key = btnResolve.dataset.duKey;
      const entry = btnResolve.closest('.du-entry--conflict');
      const selected = entry?.querySelector('.du-conflict-radio:checked');
      if (!selected) return;
      const chosenIndex = parseInt(selected.value, 10);
      resolveDocUpdate(key, chosenIndex);
      showToast('success', 'Conflicto resuelto — propuesta seleccionada lista para aplicar.');
      renderDocUpdatesPending();
      return;
    }

    // AC-1: "Aplicar" → marca como aplicado y elimina del índice
    const btnApply = e.target.closest('.du-btn-apply');
    if (btnApply && !btnApply.disabled) {
      const key = btnApply.dataset.duKey;
      const idx = _getDocUpdateIndex();
      const entry = (idx[key] || [])[0];
      if (entry) {
        _blogLog('aplicado', key, entry.titulo || '', 'backlog');
      }
      delete idx[key];
      _setDocUpdateIndex(idx);
      showToast('success', 'DOC-UPDATE aplicado y registrado en DocLog.');
      renderDocUpdatesPending();
      return;
    }

    // "Descartar" → elimina del índice sin aplicar
    const btnDiscard = e.target.closest('.du-btn-discard');
    if (btnDiscard) {
      const key = btnDiscard.dataset.duKey;
      const idx = _getDocUpdateIndex();
      const entry = (idx[key] || [])[0];
      if (entry) {
        _blogLog('descartado', key, entry.titulo || '', 'backlog');
      }
      delete idx[key];
      _setDocUpdateIndex(idx);
      showToast('info', 'DOC-UPDATE descartado.');
      renderDocUpdatesPending();
    }
  });
}

// ── END T-202606-033 ──────────────────────────────────────────────────────────

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

export function toggleContextSection(idx) {
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

  // btn-view-doclog (sidebar, único) → openDocLog(sub activo) — TKT-[pendiente-ID]
  const dlSidebar = document.getElementById('btn-view-doclog');
  if (dlSidebar) dlSidebar.addEventListener('click', () => openDocLog(getCurrentSubTab()));

  // htmlmap-file-input → importHtmlMap
  const hmFileInput = document.getElementById('htmlmap-file-input');
  if (hmFileInput) hmFileInput.addEventListener('change', importHtmlMap);

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

  // T-202606-033: inicializar listeners de DOC-UPDATEs pendientes
  _initDocUpdatesListeners();

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

// ── B-[pendiente-ID]: listener shell:update-subtab-buttons ──────────────────
window.addEventListener('shell:update-subtab-buttons', e => {
  _updateSubTabButtons(e.detail?.sub || 'backlog');
});
// ── END B-[pendiente-ID] ──

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────

// T-202606-072: listeners shell:* — desacoplamiento de módulos consumidores
// locus-backlog-core.js despacha shell:backlog-modified y shell:backlog-subtab-update
// en lugar de llamar directamente a las funciones de este módulo
window.addEventListener('shell:backlog-modified',     () => { _setBacklogModified(); });
window.addEventListener('shell:backlog-subtab-update', e => { _updateSubTabButtons(e.detail?.tab); });
