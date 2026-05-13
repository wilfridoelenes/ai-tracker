// T-202604-216: Skeleton helpers
const _SKEL_HTML_4 = Array(4).fill('<div class="skel-row"></div>').join('');
const _SKEL_HTML_5 = Array(5).fill('<div class="skel-row"></div>').join('');
const _SKEL_TBL    = Array(4).fill('<div class="skel-row skel-row--tbl"></div>').join('');
function _skelShow(el, variant) {
  if (!el) return;
  const h = variant === 'tbl' ? _SKEL_TBL : variant === 5 ? _SKEL_HTML_5 : _SKEL_HTML_4;
  el.innerHTML = h;
  el.classList.add('is-loading');
}
function _skelHide(el) { if (el) el.classList.remove('is-loading'); }

function _generateContextContent() {
  const raw = localStorage.getItem(_tplKey('context-raw'));
  if (!raw) return null;
  // B-202605-260: usar versión canónica (post-Generator) — no APP_VERSION hardcodeada
  const _ctxVer = (typeof _effectiveVersion === 'function')
    ? _effectiveVersion()
    : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v0');

  // R-202605-136: detectar formato JSON para extensión y MIME correctos
  let isJson = false;
  try { const o = JSON.parse(raw.trim()); isJson = typeof o === 'object' && o !== null && 'version' in o; } catch(e) {}
  const ext      = isJson ? 'json' : 'md';
  const mime     = isJson ? 'application/json' : 'text/markdown';
  const fileName = `${_docPrefix()}-CONTEXT_${_ctxVer}.${ext}`;
  return { raw, ext, mime, fileName };
}

function exportContextMd() {
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


function updateHtmlMapBanner() {
  const meta = JSON.parse(localStorage.getItem(_tplKey('html-map-meta')) || '{}');
  const banner = document.getElementById('htmlmap-meta-banner');
  if (!banner) return;
  if (meta.file) {
    banner.classList.add('visible');
    document.getElementById('hmeta-file').textContent = meta.file || '—';
    document.getElementById('hmeta-version').textContent = meta.version || '—';
    document.getElementById('hmeta-imported').textContent = meta.importedAt || '—';
    document.getElementById('hmeta-total').textContent = meta.total || '—';
  }
}

function setHtmlMapFilter(f) {
  htmlMapFilter = f;
  document.querySelectorAll('.hmfilter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.file === f || (f === 'all' && btn.dataset.file === 'all'));
  });
  renderHtmlMap();
}

let _hmSearch = '';

function _hmOnSearch(val) {
  _hmSearch = (val || '').trim().toLowerCase();
  renderHtmlMap();
}

function _hmToggleModule(fileId) {
  const body = document.getElementById('hmmod-body-' + fileId);
  const arrow = document.getElementById('hmmod-arrow-' + fileId);
  if (!body) return;
  const isOpen = body.classList.toggle('mm-open');
  if (arrow) arrow.classList.toggle('mm-arrow-open', isOpen);
}

function renderHtmlMap() {
  const el = document.getElementById('htmlmap-content');
  if (!el) return;
  _skelShow(el, 'tbl');
  loadHtmlMap();
  if (!HTML_MAP_SECTIONS.length) {
    const _mapRawExists = !!localStorage.getItem(_tplKey('html-map-raw'));
    el.innerHTML = !_mapRawExists ? `
      <div class="doc-dropzone" id="htmlmap-dropzone"
        ondragover="event.preventDefault();this.classList.add('doc-dropzone--over')"
        ondragleave="this.classList.remove('doc-dropzone--over')"
        ondrop="this.classList.remove('doc-dropzone--over');_dropzoneHandle(event,'htmlmap')"
        onclick="document.getElementById('htmlmap-file-input').click()">
        <div class="doc-dropzone-icon">🗺</div>
        <div class="doc-dropzone-title">Importar MODULE-MAP.md</div>
        <div class="doc-dropzone-hint">Arrastra el archivo aquí o haz click para seleccionar</div>
        <div class="doc-dropzone-badge">.md</div>
      </div>` : `
      <div class="htmlmap-empty">
        <div class="htmlmap-empty-icon">🗺</div>
        <div class="htmlmap-empty-title">Module Map sin secciones</div>
        <div class="htmlmap-empty-hint">El MAP se actualiza automáticamente vía CHECKPOINT.</div>
      </div>`;
    _skelHide(el);
    document.getElementById('htmlmap-filter-bar').classList.add('is-hidden');
    return;
  }

  updateHtmlMapBanner();
  const isModular = HTML_MAP_SECTIONS.some(s => s.file);

  if (!isModular) {
    // Fallback legado
    document.getElementById('htmlmap-filter-bar').classList.remove('is-hidden');
    const filtered = htmlMapFilter === 'all' ? HTML_MAP_SECTIONS : HTML_MAP_SECTIONS.filter(s => s.type === htmlMapFilter);
    const typeLabel = { css: 'CSS', html: 'HTML', js: 'JS' };
    const rows = filtered.map(s => `
      <tr>
        <td><span class="htmlmap-type-badge htmlmap-type-${s.type}">${typeLabel[s.type] || s.type}</span><br>${esc(s.name)}</td>
        <td>${esc(s.comment)}</td>
        <td>${esc(s.lines)}</td>
      </tr>`).join('');
    el.innerHTML = `<table class="htmlmap-table"><thead><tr><th>Sección</th><th>Comentario</th><th>Líneas</th></tr></thead><tbody>${rows}</tbody></table>`;
    return;
  }

  // ── Module.Map árbol modular ──
  document.getElementById('htmlmap-filter-bar').classList.add('is-hidden');

  // Agrupar por archivo preservando orden de aparición
  const fileMap = {};
  const fileOrder = [];
  HTML_MAP_SECTIONS.forEach(s => {
    const f = s.file || '__unknown__';
    if (!fileMap[f]) { fileMap[f] = []; fileOrder.push(f); }
    fileMap[f].push(s);
  });

  const q = _hmSearch;
  const activeFile = (htmlMapFilter !== 'all') ? htmlMapFilter : null;
  const filesToShow = activeFile ? fileOrder.filter(f => f === activeFile) : fileOrder;

  const fileTypeClass = f => f.endsWith('.css') ? 'mm-fc-css' : f.endsWith('.html') ? 'mm-fc-html' : 'mm-fc-js';
  const fileTypeLabel = f => f.endsWith('.css') ? 'CSS' : f.endsWith('.html') ? 'HTML' : 'JS';
  const fileShortName = f => f.replace('ai-tracker-', '').replace(/\.(js|css|html)$/, '');
  // T-202604-323: colores por tipo para la barra proporcional
  const fileTypeBarColor = f => f.endsWith('.css') ? 'var(--mm-bar-css,#38bdf8)' : f.endsWith('.html') ? 'var(--mm-bar-html,#f59e0b)' : 'var(--mm-bar-js,#2ecc78)';

  // Pills de archivo
  const allPill = `<button class="hmfilter-pill hmfilter-pill--all ${!activeFile ? 'active' : ''}" data-file="all" onclick="setHtmlMapFilter('all')">Todos</button>`;
  const filePills = fileOrder.map(f => {
    const isActive = activeFile === f;
    return `<button class="hmfilter-pill ${isActive ? 'active' : ''} ${fileTypeClass(f)}" data-file="${esc(f)}" onclick="setHtmlMapFilter('${esc(f)}')" title="${esc(f)}">${esc(fileShortName(f))}<span class="hmfilter-pill-count">${fileMap[f].length}</span></button>`;
  }).join('');

  // Barra de búsqueda
  const searchBar = `
    <div class="mm-search-wrap">
      <input class="mm-search" type="text" placeholder="Buscar función, área…" value="${esc(_hmSearch)}"
        oninput="_hmOnSearch(this.value)">
      ${_hmSearch ? `<button class="mm-search-clear" onclick="_hmOnSearch('');this.closest('.mm-search-wrap').querySelector('.mm-search').value=''">✕</button>` : ''}
    </div>`;

  // Árbol de módulos
  let modulesHtml = '';
  let totalVisible = 0;

  // T-202604-323: calcular máximo de funciones entre módulos visibles para escala proporcional
  const _maxFnCount = filesToShow.reduce((max, f) => {
    let rows = fileMap[f];
    if (q) rows = rows.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.area || '').toLowerCase().includes(q) ||
      String(s.line || s.lines || '').toLowerCase().includes(q)
    );
    return Math.max(max, rows.length);
  }, 1);

  filesToShow.forEach(f => {
    const fileId = f.replace(/[^a-zA-Z0-9]/g, '_');
    let rows = fileMap[f];
    if (q) {
      rows = rows.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.area || '').toLowerCase().includes(q) ||
        String(s.line || s.lines || '').toLowerCase().includes(q)
      );
    }
    if (!rows.length && q) return;
    totalVisible += rows.length;

    const openByDefault = !!activeFile || !!q || fileOrder.length <= 3;

    // Agrupar por área
    const areaMap = {};
    const areaOrder = [];
    rows.forEach(s => {
      const area = s.area || s.comment || 'General';
      if (!areaMap[area]) { areaMap[area] = []; areaOrder.push(area); }
      areaMap[area].push(s);
    });

    const areasHtml = areaOrder.map(area => {
      const areaRows = areaMap[area].map(s => `
        <tr class="mm-fn-row">
          <td class="mm-fn-line">${esc(String(s.line || s.lines || ''))}</td>
          <td class="mm-fn-name">${esc(s.name)}</td>
          <td class="mm-fn-area-cell"><span class="mm-area-pill">${esc(area)}</span></td>
        </tr>`).join('');
      return `
        <tbody class="mm-area-group">
          <tr class="mm-area-header-row"><td colspan="3" class="mm-area-label">${esc(area)}</td></tr>
          ${areaRows}
        </tbody>`;
    }).join('');

    modulesHtml += `
      <div class="mm-module" id="hmmod-${fileId}">
        <div class="mm-module-header" onclick="_hmToggleModule('${fileId}')">
          <span class="mm-file-badge ${fileTypeClass(f)}">${fileTypeLabel(f)}</span>
          <span class="mm-file-name">${esc(f)}</span>
          <span class="mm-fn-count">${rows.length} fn</span>
          <div class="mm-bar-wrap" title="${rows.length} funciones"><div class="mm-bar-fill" style="--mm-bar-w:${Math.round((rows.length/_maxFnCount)*100)}%;--mm-bar-color:${fileTypeBarColor(f)}"></div></div>
          <span class="mm-arrow ${openByDefault ? 'mm-arrow-open' : ''}" id="hmmod-arrow-${fileId}">›</span>
        </div>
        <div class="mm-module-body ${openByDefault ? 'mm-open' : ''}" id="hmmod-body-${fileId}">
          <table class="mm-table">
            <thead><tr><th>Línea</th><th>Función / Constante</th><th>Área</th></tr></thead>
            ${areasHtml}
          </table>
        </div>
      </div>`;
  });

  const emptyMsg = (q && !totalVisible)
    ? `<div class="htmlmap-empty"><div class="htmlmap-empty-hint">Sin resultados para "<strong>${esc(q)}</strong>"</div></div>`
    : '';

  el.innerHTML = `
    <div class="mm-toolbar">
      <div class="mm-pills">${allPill}${filePills}</div>
      ${searchBar}
    </div>
    <div class="mm-modules">${modulesHtml}${emptyMsg}</div>`;
  _skelHide(el);
}

// ── TAB-BACKLOG — State, parser, importación, render, filtros, búsqueda ──

// T-202604-187: CSS para children colapsables y toggle árbol/plano


// T-202604-323: HTML-MAP — barras proporcionales por módulo con color por tipo


let currentFilter = 'all';
let ITEMS = (() => {
  // T-202604-006: leer clave por proyecto activo sin depender de _tplKey (aún no definida)
  const _initProjId = localStorage.getItem('current-project-filter') || '';
  const _initKey = _initProjId ? 'backlog-items-' + _initProjId : null;
  const stored = _initKey ? localStorage.getItem(_initKey) : null;
  if (!stored && _initProjId) {
    // B-202605-062: proyecto activo sin datos — feedback explícito
    console.warn('[AI Tracker] ITEMS IIFE: proyecto activo "' + _initProjId + '" no tiene datos en localStorage.');
    // El empty state visual se muestra en renderBacklogList cuando ITEMS queda vacío
  }
  if (stored) {
    try {
      const items = JSON.parse(stored);
      // Migración inline: normalizar status legacy antes de que cualquier código use ITEMS
      // B-202604-193: 'historico' es valor canónico — NO normalizar a pendiente
      let migrated = false;
      items.forEach(item => {
        const norm = item.status === 'done' ? 'done' : item.status === 'descartado' ? 'descartado' : item.status === 'historico' ? 'historico' : 'pendiente';
        if (item.status !== norm) { item.status = norm; migrated = true; }
      });
      if (migrated) {
        try { localStorage.setItem(_initKey, JSON.stringify(items)); } catch {}
        console.log('[AI Tracker] ITEMS migration: legacy status values normalized');
      }
      return items;
    } catch {
      return [];
    }
  }
  return [];
})();

// B-202604-002: undo/redo stack para ITEMS (20 niveles)
const UNDO_MAX = 20;
let _undoStack = [];
let _redoStack = [];

// B-202604-194: Set de ids de ítems cuyos AC fueron reemplazados en la sesión activa.
// Vive solo en memoria — nunca se persiste a localStorage ni se serializa con ITEMS.
// Se limpia automáticamente al recargar la página (nueva sesión).
const _acReplacedSet = new Set();

// B-202605-012: wrapper con guardia typeof para llamadas inline a openItemEditor
// Evita falla silenciosa cuando el módulo externo no carga
function _openItemEditorSafe(id, code) {
  if (typeof openItemEditor === 'function') {
    openItemEditor(id, code);
  } else {
    if (typeof showToast === 'function') showToast({ title: 'No se pudo abrir el editor', body: 'Recarga la página.', type: 'error' });
    console.error('[AI Tracker] openItemEditor no disponible — módulo externo no cargado');
  }
}

function _undoSnapshot() {
  _undoStack.push(JSON.stringify(ITEMS));
  if (_undoStack.length > UNDO_MAX) _undoStack.shift();
  _redoStack = [];
  _updateUndoUI();
}

function undoBacklog() {
  if (!_undoStack.length) return;
  _redoStack.push(JSON.stringify(ITEMS));
  ITEMS = JSON.parse(_undoStack.pop());
  saveBacklog();
  renderBacklogList();
  renderStats();
  _updateUndoUI();
  showToast('info', '↩ Deshacer aplicado');
}

function redoBacklog() {
  if (!_redoStack.length) return;
  _undoStack.push(JSON.stringify(ITEMS));
  ITEMS = JSON.parse(_redoStack.pop());
  saveBacklog();
  renderBacklogList();
  renderStats();
  _updateUndoUI();
  showToast('info', '↪ Rehacer aplicado');
}

function _updateUndoUI() {
  const btnU = document.getElementById('btn-undo-backlog');
  const btnR = document.getElementById('btn-redo-backlog');
  if (btnU) { btnU.disabled = !_undoStack.length; btnU.title = _undoStack.length ? `Deshacer (${_undoStack.length})  Ctrl+Z` : 'Sin acciones para deshacer'; }
  if (btnR) { btnR.disabled = !_redoStack.length; btnR.title = _redoStack.length ? `Rehacer (${_redoStack.length})  Ctrl+Shift+Z` : 'Sin acciones para rehacer'; }
}

let backlogSearchQuery = '';
let _backlogSelectedCode = null; // T-202604-253: ítem seleccionado para Space → done
// T-202604-424: sprint eliminado como opción de sort — la agrupación por sprint es el modo de vista por defecto
// Opciones válidas: priority | effort | type | code | completedAt | createdAt
let backlogSortMode = 'priority';
let backlogSortDir = 'desc'; // T-072: asc | desc — default desc (nuevo → viejo)
let activeEfforts = new Set([1, 2, 3]); // T-071: todos activos por defecto
// T-202604-245: filtro por rol responsable — null = todos (sin filtro activo)
let activeRoleFilter = null;
// T-202604-357: filtro por prioridad — Set vacío = todos activos
let activePriorityFilter = new Set(); // vacío = sin filtro activo (todos visibles)
// T-202604-363: filtro Sin AC — pendientes sin criterios de aceptación
let _backlogNoAcMode = false;
// T-202604-339: vista Mike — filtro puntual T's pendientes del sprint activo (no persiste)
// T-202604-366: renombrado a Mi vista — filtro rotativo por rol con T's pendientes en sprint activo
let _backlogMikeMode = false;
let _miViewRoleIndex = 0; // índice del rol activo en la rotación

// T-202604-258: modo Focus — top 10 por score descendente
let _backlogFocusMode = false;

// R-202605-130: vista Planificación — drag & drop de ítems sin sprint al sprint siguiente
let _backlogPlanningMode = false;

// R-[tmp:sprint-group-toggle]: agrupación por sprint en backlog activo — activo por defecto
const _backlogSprintGroupRaw = localStorage.getItem('backlog-sprint-group-mode');
let _backlogSprintGroupMode = _backlogSprintGroupRaw !== null ? _backlogSprintGroupRaw !== 'false' : true;

// T-202604-187: toggle vista árbol (R con hijos colapsables) vs plana
// B-202604-122: leer desde localStorage para persistir entre recargas
// T-202604-287: backlog-view-mode extiende a 3 valores: 'true' | 'false' | 'kanban'
const _backlogViewModeRaw = localStorage.getItem('backlog-view-mode');
let _backlogKanbanMode = _backlogViewModeRaw === 'kanban';
let _backlogTreeMode = !_backlogKanbanMode && (_backlogViewModeRaw !== null
  ? _backlogViewModeRaw !== 'false'
  : true); // default: árbol
// T-202604-187: set de rCodes con bloque hijos colapsado
const _collapsedChildren = new Set();

// T-049: state de filtros mixtos
let activeTypes = new Set(['T','R','B','P']);
let activeStatuses = new Set(['pendiente']); // done oculto por defecto
let _blFooterCollapsed = false; // T-202604-360: footer fijo colapsable

const VERSIONS_ORDER = ['v2.0.0','futura'];
const VERSION_LABELS = {
  'v2.0.0':'Sprint activo',
  'futura':'Versión futura — sin fecha'
};

// T-049: colapso por versión — persiste en localStorage
const _CV_KEY = 'backlog-collapsed-versions';
function _cvLoad() {
  try { return new Set(JSON.parse(localStorage.getItem(_CV_KEY) || '[]')); } catch { return new Set(); }
}
function _cvSave() {
  try { localStorage.setItem(_CV_KEY, JSON.stringify([...collapsedVersions])); } catch {}
}
const collapsedVersions = _cvLoad();

// R-[tmp:toolbar-backlog-redesign]: collapse all — volátil, no persiste entre sesiones
function toggleCollapseAll() {
  const bodies = document.querySelectorAll('.version-group-body');
  const arrows = document.querySelectorAll('.version-collapse-arrow');
  const btn = document.getElementById('bl-collapse-all-btn');
  const label = btn ? btn.querySelector('.bl-collapse-btn-label') : null;
  const icon = btn ? btn.querySelector('.bl-collapse-btn-icon') : null;
  // detectar estado actual — si alguno está expandido, colapsar todo; si todos colapsados, expandir
  const anyExpanded = Array.from(bodies).some(b => !b.classList.contains('collapsed'));
  bodies.forEach(b => {
    const id = b.id ? b.id.replace('vbody-', '') : null;
    b.classList.toggle('collapsed', anyExpanded);
    if (id) anyExpanded ? collapsedVersions.add(id) : collapsedVersions.delete(id);
  });
  _cvSave();
  arrows.forEach(a => { a.textContent = anyExpanded ? '▸' : '▾'; });
  if (btn) btn.classList.toggle('is-collapsed', anyExpanded);
  if (label) label.textContent = anyExpanded ? 'Expandir' : 'Colapsar';
  if (icon) icon.textContent = anyExpanded ? '⊞' : '⊟';
}

// R-[tmp:toolbar-backlog-redesign]: filtro bloqueados — volátil
let _backlogBlockerFilter = false;
function toggleBacklogBlockerFilter() {
  _backlogBlockerFilter = !_backlogBlockerFilter;
  const btn = document.getElementById('fbar-blocker-btn');
  if (btn) btn.classList.toggle('active', _backlogBlockerFilter);
  renderBacklogList();
}

// T-202605-449: filtro por ítems con dependencias bloqueantes activas
// 0 = sin filtro | 1 = solo bloqueados | 2 = solo desbloqueados
let _depsFilter = 0;
function toggleDepsFilter() {
  _depsFilter = (_depsFilter + 1) % 3;
  const btn = document.getElementById('fbar-deps-btn');
  const labels = ['🔗 Deps', '🔒 Bloqueados', '🔓 Libres'];
  if (btn) {
    btn.textContent = labels[_depsFilter];
    btn.classList.toggle('active', _depsFilter > 0);
  }
  renderBacklogList();
}

// T-202605-449: helper — ítems con blockedBy[] que aún no están done
function _hasDepsBlocked(item) {
  if (!item.blockedBy || !item.blockedBy.length) return false;
  return item.blockedBy.some(c => {
    const dep = ITEMS.find(i => i.code === c);
    return !dep || dep.status !== 'done';
  });
}

// T-202604-261: ítem bloqueado — pendiente con sprint asignado y sin cambio de status en >14 días
const _BLOCKED_DAYS = 14;
function _isBlocked(item) {
  if (!item || item.status !== 'pendiente') return false;
  if (!item.sprint) return false;
  if (!item.statusChangedAt) return false;
  const daysSince = (Date.now() - item.statusChangedAt) / 86400000;
  return daysSince > _BLOCKED_DAYS;
}

// T-202604-259: sin mención en sesión en últimos 14 días — solo pendiente con sprint asignado
const _NO_SESSION_DAYS = 14;
// Wrapper — delega a hasRecentSession() canónica (checkpoint.js)
// B-202604-200: ítems recientes sin mención retornan true via fallback createdAt en hasRecentSession
function _hasRecentSession(item) {
  if (!item || item.status !== 'pendiente') return true; // no aplica
  if (!item.sprint) return true; // no aplica sin sprint
  if (typeof hasRecentSession !== 'function') return true; // guardia — función canónica no disponible
  return hasRecentSession(item, _NO_SESSION_DAYS);
}

// T-202604-297: prioridad automática desde señales del ítem — retorna 'high' | 'medium' | 'low'
// Reglas en orden de precedencia:
//   1. Tipo B → high
//   2. Sprint activo asignado → high
//   3. Effort 1 + cualquier sprint asignado → high
//   4. Sin sprint + effort 3 → low
//   5. Todo lo demás → medium
function _calcPriority(item) {
  if (!item) return 'medium';
  const type = (item.code || '')[0];
  if (type === 'B') return 'high';
  if (item.sprint) {
    const sp = _getSprintById(item.sprint);
    // T-202605-529: guard explícita — si el sprint asignado no tiene registro en getSprintById,
    // tratar el ítem como sin sprint asignado y continuar con lógica estándar por effort.
    // No retornar 'high' automáticamente por este caso (comportamiento implícito previo eliminado).
    if (sp === null || sp === undefined) {
      // Sprint asignado pero sin registro → calcular por effort sin elevación por sprint
      if (!item.sprint && parseInt(item.effort) === 3) return 'low';
      return 'medium';
    }
    const sprintIsOpen = sp.status === 'active' || sp.status === 'open';
    // B-202605-059: effort 1 → high solo si el sprint está activo u open — nunca en sprints cerrados
    if (sprintIsOpen) return 'high';
  }
  if (!item.sprint && parseInt(item.effort) === 3) return 'low';
  return 'medium';
}

// T-202604-297: aplicar prioridad calculada a todos los ítems pendientes
function _applyAllPriorities() {
  ITEMS.forEach(item => {
    if (item.status === 'pendiente') {
      item.priority = _calcPriority(item);
    }
  });
}

// T-202604-257: score de relevancia por ítem — retorna 0–100
// Señales: antigüedad, tipo, effort, sprint asignado, última mención en sesión, AC definidos
function _calcRelevanceScore(item, allSessionsCache) { // B-202605-009: allSessionsCache evita O(n×m)
  if (!item || item.status !== 'pendiente') return 0;

  let score = 0;

  // 1. TIPO — urgencia intrínseca (0–25)
  const typeScores = { B: 25, T: 18, R: 12, P: 6 };
  const type = itemType(item.code) || 'T';
  score += typeScores[type] ?? 10;

  // 2. SPRINT ASIGNADO (0–20)
  if (item.sprint) {
    const sp = _getSprintById(item.sprint);
    if (sp && sp.status === 'active') score += 20;   // sprint activo
    else if (sp && sp.status === 'open')  score += 12; // sprint abierto no activo
    else if (item.sprint)                 score += 6;  // sprint no registrado — heredado de import
  }

  // 3. EFFORT — favorece los fáciles de cerrar (0–15)
  const effortN = parseInt(item.effort) || 2;
  if (effortN === 1) score += 15;
  else if (effortN === 2) score += 8;
  // effort 3 = 0 puntos extra

  // 4. ANTIGÜEDAD — más viejo sube relevancia (0–20)
  if (item.createdAt) {
    const daysSinceCreation = Math.floor((Date.now() - item.createdAt) / 86400000);
    // Escala logarítmica: 0 días=0, 7 días=8, 30 días=14, 90+ días=20
    const ageScore = Math.min(20, Math.round(Math.log1p(daysSinceCreation / 7) * 9));
    score += ageScore;
  }

  // 5. ÚLTIMA MENCIÓN EN SESIÓN — reciente baja relevancia (evita doble trabajo), antigua sube (olvidado)
  // Rango: -10 a +10
  // B-202605-009: allSessionsCache ya calculado en _recalcAllScores — una llamada por ciclo, no una por ítem
  if (allSessionsCache && allSessionsCache.length) {
    let lastMentionTs = 0;
    allSessionsCache.forEach(s => {
      if ((s.backlogRefs || s.trackerRefs || []).includes(item.code)) {
        const ts = s.savedAt || s.createdAt || 0;
        if (ts > lastMentionTs) lastMentionTs = ts;
      }
    });
    if (lastMentionTs) {
      const daysSinceMention = Math.floor((Date.now() - lastMentionTs) / 86400000);
      if (daysSinceMention <= 2)  score -= 10; // trabajado reciente — baja prioridad
      else if (daysSinceMention <= 7)  score += 0;  // neutro
      else if (daysSinceMention <= 14) score += 5;  // algo olvidado
      else                             score += 10; // olvidado — sube
    }
    // Sin mención histórica: +5 (nunca referenciado = posiblemente olvidado desde import)
    else if (item.createdAt) score += 5;
  }

  // 6. AC DEFINIDOS — sin AC baja score (0 o +10)
  if (item.ac && item.ac.length > 0) score += 10;
  else score -= 5; // sin AC no es accionable

  return Math.max(0, Math.min(100, score));
}

// T-202604-257: recalcular score en todos los ITEMS pendientes y estamparlo en item._score
function _recalcAllScores() {
  // B-202605-009: una sola llamada a getAllSessions() por ciclo — no O(n×m)
  const _sessCache = typeof getAllSessions === 'function' ? getAllSessions() : [];
  ITEMS.forEach(item => {
    item._score = (item.status === 'pendiente') ? _calcRelevanceScore(item, _sessCache) : 0;
  });
}

// B-202605-210: sanear ítems con status 'pendiente' en sprints cerrados.
// Un ítem pendiente en un sprint cerrado es data inconsistente — el sprint ya no
// puede trabajarse. Se desasigna el sprint (sprint → '') para que vuelva al
// backlog general sin asignar, conservando el status 'pendiente' y el history.
// Retorna la cantidad de ítems saneados para el log.
function _sanitizePendingInClosedSprints() {
  if (typeof getActiveSprints !== 'function') return 0;
  const closedSprintIds = new Set(
    getActiveSprints()
      .filter(s => s.status === 'closed')
      .map(s => s.id)
  );
  if (!closedSprintIds.size) return 0;
  let count = 0;
  ITEMS.forEach(item => {
    if (
      item.status === 'pendiente' &&
      item.sprint &&
      closedSprintIds.has(item.sprint)
    ) {
      if (!item.history) item.history = [];
      item.history.push({
        type: 'sprint',
        ts: Date.now(),
        data: { from: item.sprint, to: null, reason: 'sanitize-closed-sprint' }
      });
      item.sprint = '';
      count++;
    }
  });
  // Segunda pasada: ítems con doneAt populado pero status pendiente
  // Causa: merge desde CHECKPOINT sobrescribió status sin respetar doneAt existente
  // B-202604-[pendiente-ID]: si el ítem tiene discardReason, el status correcto es 'descartado', no 'done'
  // B-202605-008: snapshot antes de mutar — resultado deshacible via undoBacklog()
  const pendingWithDoneAt = ITEMS.filter(item => item.status === 'pendiente' && item.doneAt);
  if (pendingWithDoneAt.length > 0) _undoSnapshot();
  let revived = 0;
  pendingWithDoneAt.forEach(item => {
      const targetStatus = item.discardReason ? 'descartado' : 'done';
      item.status = targetStatus;
      if (!item.history) item.history = [];
      item.history.push({
        type: 'status',
        ts: Date.now(),
        data: { from: 'pendiente', to: targetStatus, reason: 'sanitize-doneat-mismatch' }
      });
      revived++;
    });
  if (revived > 0) console.log(`[AI Tracker] sanitize-doneat-mismatch: ${revived} ítem(s) con doneAt populado restaurados a status correcto`);
  return count;
}

// T-[pendiente-ID]: Purga inteligente de localStorage — ítems done/descartado >90 días
// Retorna el número de ítems purgados del caché local (no se eliminan de Supabase).
function _localStorageUsageRatio() {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      total += (localStorage.getItem(k) || '').length;
    }
    // Límite conservador: 4.5MB (localStorage típico es 5MB por origen)
    return total / (4.5 * 1024 * 1024);
  } catch (_) { return 0; }
}

function _purgeStaleBacklogCache() {
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - NINETY_DAYS_MS;
  const purgeable = ['done', 'descartado'];
  const before = ITEMS.length;

  // B-202605-045: snapshot antes de mutar para que la purga sea deshacible
  if (typeof _undoSnapshot === 'function') _undoSnapshot();

  // Filtrar del array en memoria — Supabase conserva el registro completo
  ITEMS = ITEMS.filter(item => {
    if (!purgeable.includes(item.status)) return true; // nunca purgar pendientes/en-curso
    const ts = item.statusChangedAt || item.doneAt || 0;
    return ts > cutoff; // conservar si fue cerrado hace menos de 90 días
  });

  const purged = before - ITEMS.length;
  if (purged > 0) {
    console.log(`[AI Tracker] _purgeStaleBacklogCache: ${purged} ítem(s) purgado(s) del caché local (>90 días done/descartado)`);
    // B-202605-045: persistir tras mutación para que el estado sea consistente
    if (typeof saveBacklog === 'function') saveBacklog();
  }
  return purged;
}

// T-[pendiente-ID]: Purge permanente de ítems históricos pre-reset
// Elimina del array en memoria todos los ítems con status 'historico'.
// Acción irreversible (salvo undo inmediato) — requiere confirmación explícita.
function purgeAllHistorico() {
  const historicos = ITEMS.filter(i => i.status === 'historico');
  if (!historicos.length) {
    showToast('info', 'No hay ítems históricos para purgar.');
    return;
  }
  _gconfirmOpen({
    title: 'Purgar archivo histórico',
    msg: `¿Eliminar permanentemente los ${historicos.length} ítem${historicos.length !== 1 ? 's' : ''} históricos? Esta acción no se puede deshacer después de guardar.`,
    okLabel: 'Purgar',
    danger: true
  }, () => {
    if (typeof _undoSnapshot === 'function') _undoSnapshot();
    const before = ITEMS.length;
    ITEMS = ITEMS.filter(i => i.status !== 'historico');
    const purged = before - ITEMS.length;
    if (typeof saveBacklog === 'function') saveBacklog();
    renderBacklogList();
    renderStats();
    console.log(`[AI Tracker] purgeAllHistorico: ${purged} ítem(s) histórico(s) eliminados permanentemente.`);
    showToast('success', `🗑 ${purged} ítem${purged !== 1 ? 's' : ''} histórico${purged !== 1 ? 's' : ''} eliminado${purged !== 1 ? 's' : ''}.`);
  });
}

function loadBacklog() {
  // R-[pendiente-ID]: Supabase-first — si el usuario está autenticado, delegar a
  // _loadFromSupabase() que implementa lógica timestamp-first en su paso 5.
  // Migración one-shot (founder only): si localStorage tiene datos y Supabase está
  // vacío, _loadFromSupabase detecta ITEMS.length === 0 post-carga y no sobreescribe;
  // saveBacklog() al final del flujo empuja los datos locales a Supabase.
  if (typeof _supabase !== 'undefined' && _supabase &&
      typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    // Cargar localStorage como base inmediata (evita flash de backlog vacío)
    const s = localStorage.getItem(_tplKey('backlog-items'));
    if (s) { try { ITEMS = JSON.parse(s); } catch { ITEMS = []; } } else { ITEMS = []; }
    // Lanzar carga remota en background — _loadFromSupabase re-renderiza al terminar
    if (typeof _loadFromSupabase === 'function') _loadFromSupabase();
    // Ejecutar migraciones locales sobre los datos inmediatos mientras Supabase responde
  } else {
    const s = localStorage.getItem(_tplKey('backlog-items'));
    if (s) { try { ITEMS = JSON.parse(s); } catch { ITEMS = []; } } else { ITEMS = []; }
  }
  // Migración: normalizar status legacy (⏳ Backlog, in-progress, en-progreso, etc.)
  // B-202605-006: guardia explícita — _normalizeStatus debe estar disponible antes de continuar
  if (typeof _normalizeStatus !== 'function') {
    console.error('[AI Tracker] loadBacklog: _normalizeStatus no disponible — migración de status abortada. Verificar orden de carga de módulos.');
    if (typeof showToast === 'function') showToast({ title: 'Error de carga', body: '_normalizeStatus no disponible. Recarga la página.', type: 'error' });
    return;
  }
  let migrated = false;
  ITEMS.forEach(item => {
    const norm = _normalizeStatus(item.status);
    if (item.status !== norm) { item.status = norm; migrated = true; }
    // Migración: asignar id a ítems importados sin id (parseBacklogMd no los genera)
    if (!item.id) { item.id = 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2,6); migrated = true; }
    // R-202604-015: inicializar history[] si no existe
    if (!item.history) {
      item.history = [];
      if (item.statusChangedAt) {
        item.history.push({ type: 'status', ts: item.statusChangedAt, data: { to: item.status } });
      }
      migrated = true;
    }
    // B-202604-194: _acReplacedInSession eliminado de items — ahora vive en _acReplacedSet (memoria)
    // No se necesita delete aquí.
    // R-202605-135: schema_version — ítems sin campo se tratan como versión 0 y se migran
    if (item.schema_version === undefined) {
      item.schema_version = 1;
      migrated = true;
    }
  });
  // B-202605-061: migración desc→title — 'desc' no es campo canónico del schema v1
  // Si el ítem tiene desc y title está vacío, copiar desc a title (silencioso)
  // T-202605-507: delete item.desc en todo ítem con desc definido tras la copia — localStorage queda limpio
  ITEMS.forEach(item => {
    if (item.desc !== undefined) {
      if (!item.title || item.title.trim() === '') {
        item.title = item.desc;
      }
      delete item.desc;
      migrated = true;
    }
  });
  if (migrated) console.log('[AI Tracker] Status migration: legacy values normalized (historico preserved)');
  // B-202605-210: sanear pendientes en sprints cerrados (migración retroactiva)
  const sanitized = _sanitizePendingInClosedSprints();
  if (sanitized > 0) {
    console.log(`[AI Tracker] B-202605-210: ${sanitized} ítem(s) pendiente(s) en sprints cerrados → desasignados`);
    migrated = true;
  }
  _applyAllPriorities(); // T-202604-297: recalcular prioridad automática al cargar
  _recalcAllScores(); // T-202604-257: estampar score en memoria tras cargar
  // B-202605-048: saveBacklog() solo si hubo migraciones o saneamiento — carga limpia no escribe
  if (migrated || sanitized > 0) saveBacklog();
  // AC aria tablist: sincronizar estado inicial de atributos aria desde variables de estado
  if (typeof _syncViewAriaStates === 'function') _syncViewAriaStates();
}

// T-049: derivar tipo del código
function itemType(code) {
  const c = (code || '')[0];
  const t = ['I','T','R','B','P'].includes(c) ? c : null;
  return t === 'I' ? 'P' : t; // I es alias de P — normalizado
}

// T-049: toggle filtros tipo
// B-202604-146: reset explícito de filtros de tipo
function clearTypeFilters() {
  activeTypes = new Set(['T','R','B','P']);
  updateTypeFilterUI();
  renderBacklogList();
}

function toggleTypeFilter(type) {
  const allActive = activeTypes.size === 4; // T/R/B/P
  if (allActive) {
    // primer click: desactiva todos, activa solo el clickeado
    activeTypes = new Set([type]);
  } else if (activeTypes.has(type)) {
    // click en activo: si es el único, restaura todos
    if (activeTypes.size === 1) {
      activeTypes = new Set(['T','R','B','P']);
    } else {
      activeTypes.delete(type);
    }
  } else {
    // click en inactivo con otros ya activos: acumula
    activeTypes.add(type);
  }
  updateTypeFilterUI();
  renderBacklogList();
  // T-202604-364: filter-pulse feedback
  requestAnimationFrame(() => {
    document.querySelectorAll('.bl-fc-type-' + type).forEach(el => {
      el.classList.remove('filter-pulse');
      void el.offsetWidth;
      el.classList.add('filter-pulse');
      el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true });
    });
  });
}
function updateTypeFilterUI() {
  if (!document.getElementById('ftype-T')) return; // elementos ftype-* no presentes en el DOM actual
  ['T','R','B','P'].forEach(t => {
    const btn = document.getElementById('ftype-' + t);
    if (btn) {
      const isActive = activeTypes.has(t);
      btn.classList.toggle('active', isActive);
    }
    // chips accionables en stats bar
    const chip = document.querySelector(`.stat-type-chip.tc-${t}`);
    if (chip) chip.classList.toggle('active', activeTypes.has(t));
  });
  // B-UX: indicar visualmente cuando todos los tipos están activos = estado neutro "sin filtro"
  const sTypesEl = document.querySelector('.stat-card.s-types');
  if (sTypesEl) sTypesEl.classList.toggle('s-types--all-active', activeTypes.size === 4);
  updateClearFilterBtn();
}

// T-049: toggle filtros status
function toggleStatusFilter(status) {
  if (status === 'done' || status === 'descartado') {
    if (activeStatuses.has(status)) {
      activeStatuses.delete(status);
    } else {
      activeStatuses.add(status);
    }
  } else {
    if (activeStatuses.has(status)) {
      if (activeStatuses.size > 1) activeStatuses.delete(status);
    } else {
      activeStatuses.add(status);
    }
  }
  updateStatusFilterUI();
  renderBacklogList();
  // T-202604-364: filter-pulse feedback
  requestAnimationFrame(() => {
    const btnId = status === 'done' ? 'fstatus-done' : status === 'descartado' ? 'fstatus-descartado' : 'fstatus-pendiente';
    const el = document.getElementById(btnId);
    if (el) { el.classList.remove('filter-pulse'); void el.offsetWidth; el.classList.add('filter-pulse'); el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true }); }
  });
}
function updateStatusFilterUI() {
  const pendBtn = document.getElementById('fstatus-pendiente');
  if (pendBtn) pendBtn.classList.toggle('active', activeStatuses.has('pendiente'));
  const doneBtn = document.getElementById('fstatus-done');
  if (doneBtn) doneBtn.classList.toggle('active', activeStatuses.has('done'));
  const discBtn = document.getElementById('fstatus-descartado');
  if (discBtn) discBtn.classList.toggle('active', activeStatuses.has('descartado'));
  const enCursoBtn = document.getElementById('fstatus-en-curso');
  if (enCursoBtn) enCursoBtn.classList.toggle('active', activeStatuses.has('en curso'));
  updateClearFilterBtn();
}

// T-051: colapso por versión
function toggleVersionCollapse(v) {
  if (collapsedVersions.has(v)) collapsedVersions.delete(v);
  else collapsedVersions.add(v);
  _cvSave();
  const body = document.getElementById('vbody-' + v);
  const arrow = document.getElementById('varrow-' + v);
  if (body) body.classList.toggle('collapsed', collapsedVersions.has(v));
  if (arrow) arrow.textContent = collapsedVersions.has(v) ? '▸' : '▾';
}

// T-202604-118: generar siguiente código disponible por tipo
function _getNextItemCode(typeChar) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yyyymm = `${year}${month}`;
  const prefix = `${typeChar}-${yyyymm}-`;
  let maxNum = 0;
  ITEMS.forEach(item => {
    if (item.code && item.code.startsWith(prefix)) {
      const numMatch = item.code.match(new RegExp(`${prefix}(\\d{3})`));
      if (numMatch) {
        const num = parseInt(numMatch[1]);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${typeChar}-${yyyymm}-${nextNum}`;
}

// Bug B-202604-002: parser estricto — solo acepta ### seguido de código exacto [TIPO]-[YYYYMM]-[NNN]
function parseBacklogMd(text) {
  const items = [];
  const itemBlocks = text.split(/\n(?=###\s)/);

  itemBlocks.forEach((block, blockIdx) => {
    try {
      let headerMatch = block.match(/^###\s+([A-Z]-\d{6}-\d{3}(?:-[A-Za-z]+)?)\s+·\s*(.*)/);
      let code, title, needsAutoAssign = false;
      
      if (headerMatch) {
        code = headerMatch[1].trim();
        title = (headerMatch[2] || '').trim() || '(sin título)';
      } else {
        headerMatch = block.match(/^###\s+\[pendiente-ID\]\s+·\s+(.+)/);
        if (!headerMatch) return;
        title = headerMatch[1].trim();
        needsAutoAssign = true;
        code = null;
      }

      const get = (field) => {
        const m = block.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`));
        return m ? m[1].trim() : '';
      };

      const priority = get('Priority') || 'medium';
      const areaRaw  = get('Area') || '';
      // Fix integridad: sanear area si contiene markup de otro campo
      const area     = areaRaw.includes('**') ? areaRaw.split('**')[0].trim() : areaRaw.trim();
      const effort   = parseInt(get('Effort')) || 1;
      const impact   = get('Impact') || 'Medio';
      const status   = _normalizeStatus(get('Status'));
      const version  = get('Version') || 'futura';
      const sprint    = get('Sprint') || '';
      const parentId  = get('ParentId') || null;
      const role      = get('Role') || '';
      const discardReason = get('DiscardReason') || '';
      const discardRef    = get('DiscardRef') || '';
      const origin        = get('Origin') || null;

      // desc termina antes de ### Criterios, timestamps o fin de bloque.
      // Los timestamps (CreatedAt/StatusChangedAt/DoneAt) pueden aparecer antes o después del desc
      // según la versión del serializer — el regex los excluye explícitamente para evitar
      // que se acumulen en item.desc entre exports.
      const descMatch = block.match(/\*\*Version:\*\*[^\n]*\n+([\s\S]*?)(?=###\s*Criterios|\*\*CreatedAt:\*\*|\*\*StatusChangedAt:\*\*|\*\*DoneAt:\*\*|\*\*Notes:\*\*|$)/);
      const desc = descMatch ? descMatch[1].trim() : '';

      // B-202604-1001: detectar encabezado ### o formato **Criterios de aceptación:**
      const acMatch = block.match(/###\s*Criterios de aceptaci[oó]n\s*\n([\s\S]*?)(?=\n---|\n###|$)/)
                   || block.match(/\*\*Criterios de aceptaci[oó]n:\*\*\s*\n([\s\S]*?)(?=\n---|\n###|\n\*\*[A-Z]|$)/);
      const ac = [];
      if (acMatch) {
        acMatch[1].split('\n').forEach(l => {
          const m = l.match(/^-\s+\[[ x]\]\s+(.+)/);
          if (m) ac.push(m[1].trim());
        });
      }

      const createdAt      = parseInt(get('CreatedAt')) || null;
      const statusChangedAt = parseInt(get('StatusChangedAt')) || null;
      const doneAt          = parseInt(get('DoneAt')) || null;

      // T-202604-288: blockedBy — array de códigos
      const blockedByRaw = get('BlockedBy') || '';
      const blockedBy = blockedByRaw ? blockedByRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

      // R-202604-051: blocking — boolean, default false
      const blockingRaw = (get('Blocking') || '').toLowerCase();
      const blocking = blockingRaw === 'true' || blockingRaw === '1';

      // Leer notes: bloque después de ### Criterios (o ac) hasta fin o ---
      const notesMatch = block.match(/\*\*Notes:\*\*\s*(.+)/);
      const notes = notesMatch ? notesMatch[1].trim() : '';

      // T-202605-486: leer campo Archivos si existe
      const archivosRaw = get('Archivos') || '';
      const archivos = archivosRaw ? archivosRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

      items.push({ code, title, desc, priority, area, effort, impact, status, version, sprint, parentId: parentId || null, role: role || '', origin: origin || null, ac, notes, archivos, needsAutoAssign, discardReason, discardRef, createdAt, statusChangedAt, doneAt, blockedBy, blocking: blocking || false });
    } catch (err) {
      console.error('[AI Tracker] parseBacklogMd block ' + blockIdx + ' error:', err.message);
      console.error('[AI Tracker] block content (primeros 200 chars):', block.substring(0, 200));
    }
  });

  return items;
}

// T-048+T-050: parsear metadata del Backlog.md
function parseBacklogMeta(text) {
  const version = (text.match(/Versión del backlog\s*\|\s*([^\n|]+)/) || [])[1]?.trim() || '';
  const updated = (text.match(/Última actualización\s*\|\s*([^\n|]+)/) || [])[1]?.trim() || '';
  return { version, updated };
}

// T-050: tiempo relativo con granularidad h/m
function relativeImportTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  if (hours < 24) {
    const remMins = mins % 60;
    return remMins > 0 ? `hace ${hours}h ${remMins}m` : `hace ${hours}h`;
  }
  const remHours = hours % 24;
  return remHours > 0 ? `hace ${days}d ${remHours}h` : `hace ${days}d`;
}

// T-048: actualizar banner
function updateBacklogBanner() {
  const banner = document.getElementById('backlog-meta-banner');
  const exportBtn = document.getElementById('export-backlog-btn');
  if (!_getActiveProjectFilter() || !ITEMS.length) {
    if (banner) banner.classList.remove('visible');
    if (exportBtn) exportBtn.classList.add("is-hidden");
    return;
  }
  if (banner) banner.classList.add('visible');
  // Mostrar botón exportar solo si estamos en tab backlog
  if (exportBtn && currentTab === 'backlog') exportBtn.classList.remove("is-hidden")

  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('bmeta-version', meta.version || '—');
  el('bmeta-total', ITEMS.length + ' ítem' + (ITEMS.length !== 1 ? 's' : ''));
}

// Actualizar el indicador de importado cada minuto
setInterval(() => {
  if (currentTab === 'backlog') updateBacklogBanner();
}, 60000);

function importBacklog(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target.result;
      console.log('[AI Tracker] importBacklog: iniciando, texto length:', text.length);
      const parsed = parseBacklogMd(text);
      console.log('[AI Tracker] importBacklog: parseado', parsed.length, 'ítems');
      if (!parsed.length) { 
        console.error('[AI Tracker] Parse falló: sin ítems válidos');
        showToast('error', 'No se encontraron ítems válidos en el archivo.'); 
        return; 
      }
      
      console.log('[AI Tracker] importBacklog: procesando ítems...');
      let autoAssigned = 0;
      parsed.forEach(newItem => {
        // B-202604-193: ignorar silenciosamente ítems históricos en importación
        if (newItem.status === 'historico') return;
        if (newItem.needsAutoAssign && !newItem.code) {
          let typeChar = 'T';
          if (newItem.area && (newItem.area.includes('Bug') || newItem.area.includes('bug'))) typeChar = 'B';
          else if (newItem.area && (newItem.area.includes('Requerimiento') || newItem.area.includes('Feature') || newItem.area.includes('Epic'))) typeChar = 'R';
          else if (newItem.priority === 'pendiente') typeChar = 'I';
          newItem.code = _getNextItemCode(typeChar);
          autoAssigned++;
        }
        const idx = ITEMS.findIndex(i => i.code === newItem.code);
        if (idx >= 0) {
          // B-192: no sobreescribir ítems done/descartados en memoria con versión no-done del archivo
          const inMemory = ITEMS[idx];
          if (inMemory.status === 'descartado' && newItem.status !== 'descartado') return;
          if (inMemory.status === 'done' && newItem.status === 'pendiente') return;
          ITEMS[idx] = newItem;
        } else {
          // No agregar al backlog ítems descartados que no existen en memoria
          if (newItem.status === 'descartado') return;
          ITEMS.push(newItem);
        }
      });
      
      console.log('[AI Tracker] importBacklog: items merged en ITEMS, total:', ITEMS.length);
      
      const meta = parseBacklogMeta(text);
      meta.importedAt = Date.now();
      const countersMatch = text.match(/Contadores:\s*P=(\d+)\s*\|\s*T=(\d+)\s*\|\s*R=(\d+)\s*\|\s*B=(\d+)/);
      if (countersMatch) {
        meta.counters = { P: parseInt(countersMatch[1]), T: parseInt(countersMatch[2]), R: parseInt(countersMatch[3]), B: parseInt(countersMatch[4]) };
      }
      
      console.log('[AI Tracker] importBacklog: intentando setItem backlog-meta...');
      try {
        localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
        console.log('[AI Tracker] importBacklog: ✓ backlog-meta guardado');
      } catch (err) {
        console.error('[AI Tracker] importBacklog: ERROR setItem backlog-meta:', err.name, err.message);
        throw err;
      }
      
      // NO guardar backlog-raw en localStorage (muy pesado) — solo en Firestore si disponible
      console.log('[AI Tracker] importBacklog: backlog-raw no se guarda en localStorage (solo ítems parsedos)');

      console.log('[AI Tracker] importBacklog: llamando saveBacklog()...');
      try {
        await saveBacklog();
        console.log('[AI Tracker] importBacklog: ✓ saveBacklog() completado');
      } catch (saveErr) {
        console.error('[AI Tracker] importBacklog: saveBacklog() error:', saveErr.name, saveErr.message);
        throw saveErr;
      }

      // T-049: mostrar filtros
      const ftypes = document.getElementById('filter-bar-types');
      const fstatus = document.getElementById('filter-bar-status');
      if (ftypes) ftypes.classList.remove('is-hidden');
      if (fstatus) fstatus.classList.remove('is-hidden');

      updateBacklogBanner();
      updateStatusFilterUI();
      renderStats();
      renderBacklogList();
      updateBacklogFooter();
      _setBacklogModified();
      // Toast enriquecido con pills de color por tipo y sprint
      const TYPE_COLORS_TOAST = { B:'#e85555', T:'#2ecc78', R:'#38bdf8', I:'#7c6af7', P:'#7c6af7' };
      const byTypeTst = { B:0, T:0, R:0, I:0, P:0 };
      const sprintsTst = new Set();
      parsed.forEach(it => {
        const tc = it.code ? it.code[0] : 'T';
        if (byTypeTst[tc] !== undefined) byTypeTst[tc]++;
        if (it.sprint) sprintsTst.add(it.sprint);
      });
      const pillsHtml = ['R','T','B','I']
        .filter(t => byTypeTst[t] > 0)
        .map(t => '<span class="toast-type-pill" style="--toast-type-color:' + TYPE_COLORS_TOAST[t] + '">' + t + ' ' + byTypeTst[t] + '</span>')
        .join(' ');
      const sprintHtml = sprintsTst.size
        ? '<span class="toast-sprint-pill">' + [...sprintsTst].join(', ') + '</span>'
        : '';
      const autoHtml = autoAssigned ? '<div class="toast-auto-hint">' + autoAssigned + ' ID' + (autoAssigned !== 1 ? 's' : '') + ' auto-asignado' + (autoAssigned !== 1 ? 's' : '') + '</div>' : '';
      const toastMsg = '<div class="toast-import-title">✓ ' + parsed.length + ' ítem' + (parsed.length !== 1 ? 's' : '') + ' importado' + (parsed.length !== 1 ? 's' : '') + '</div><div class="toast-import-pills">' + pillsHtml + (sprintHtml ? ' ' + sprintHtml : '') + '</div>' + autoHtml;
      showToast('success', toastMsg, null, 5000);
      _updateSubTabButtons('backlog'); // ocultar botón importar tras bootstrap exitoso
    } catch(err) {
      console.error('[AI Tracker] importBacklog CATCH:', err.name, '—', err.message, err.stack);
      const errMsg = err.name === 'QuotaExceededError' 
        ? 'Almacenamiento lleno. Limpia sesiones archivadas o usa Firebase.' 
        : (err.message || 'Error desconocido');
      showToast('error', '❌ Error al importar: ' + errMsg);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function badgeClass(p) {
  return {high:'badge-high', medium:'badge-medium', low:'badge-low',
          critical:'badge-high', important:'badge-high', mejora:'badge-medium',
          futura:'badge-low'}[p] || 'badge-area';
}
function badgeLabel(p) {
  return {high:'Alto', medium:'Medio', low:'Bajo',
          critical:'Alto', important:'Alto', mejora:'Medio', futura:'Bajo'}[p] || p;
}
function statusClass(s) {
  // B-202605-229: historico agregado como status canónico
  return {'pendiente':'badge-status-backlog','done':'badge-status-done','descartado':'badge-status-descartado','historico':'badge-status-historico'}[s] || 'badge-status-backlog';
}
function statusLabel(s) {
  // B-202605-229: historico agregado como status canónico
  return {'pendiente':'Pendiente','done':'Hecho','descartado':'Descartado','historico':'Histórico'}[s] || s;
}

// B-245: helper para obtener el aiId de la sesión activa al momento de registrar en history[]
function _getActiveSessionAiId() {
  if (typeof state === 'undefined' || typeof _isInSession !== 'function') return null;
  const ai = (state.ais || []).find(a => !a.archived && _isInSession(a));
  return ai ? ai.id : null;
}

// T-202604-066: cambio de status inline
function setItemStatus(code, newStatus) {
  const item = ITEMS.find(i => i.code === code);
  if (!item || item.status === newStatus) return;

  // Descarte: siempre requiere confirmación
  if (newStatus === 'descartado') {
    // Resetear el select visualmente antes de que el modal confirme
    _resetStatusSelect(code, item.status);
    _confirmDiscard(code, '', '');
    return;
  }

  // Retroceso done → pendiente/backlog: requiere confirmación
  if (item.status === 'done' && (newStatus === 'pendiente' || newStatus === 'backlog' || newStatus === 'in-progress')) {
    _resetStatusSelect(code, item.status);
    _confirmRetroceso(code, newStatus);
    return;
  }

  // T-202605-449: advertir si se marca done con bloqueadores pendientes — no bloquea la acción
  if (newStatus === 'done' && _hasDepsBlocked(item)) {
    const pendingBlockers = (item.blockedBy || []).filter(c => {
      const dep = ITEMS.find(i => i.code === c);
      return !dep || dep.status !== 'done';
    });
    const label = pendingBlockers.length === 1
      ? `⚠ ${pendingBlockers[0]} aún pendiente — ¿marcar done igual?`
      : `⚠ ${pendingBlockers.length} bloqueadores pendientes — ¿marcar done igual?`;
    if (!confirm(label)) {
      _resetStatusSelect(code, item.status);
      return;
    }
  }

  const _prevStatus = item.status;
  item.status = newStatus;
  item.statusChangedAt = Date.now();
  if (newStatus === 'done' && !item.doneAt) item.doneAt = Date.now();
  // B-[tmp:closed-version]: persistir versión activa al cerrar ítem
  if (newStatus === 'done' || newStatus === 'descartado') {
    item.closedInVersion = (typeof _effectiveVersion === 'function') ? _effectiveVersion() : '';
  }
  // R-202604-015: registrar cambio en history[]
  if (!item.history) item.history = [];
  item.history.push({ type: 'status', ts: item.statusChangedAt, aiId: _getActiveSessionAiId() || undefined, data: { from: _prevStatus, to: newStatus, role: item.role || '' } });
  if (newStatus === 'pendiente') item.priority = _calcPriority(item); // T-202604-297
  _recalcAllScores(); // T-202604-257: recalcular scores tras cambio de status
  // R-202604-051 + T-202605-449: al marcar done, notificar ítems que quedaron desbloqueados
  if (newStatus === 'done') {
    const nowUnblocked = [];
    ITEMS.forEach(dep => {
      if (dep.status === 'pendiente' && dep.blockedBy && dep.blockedBy.includes(code)) {
        if (!dep.history) dep.history = [];
        dep.history.push({ type: 'unblocked', ts: Date.now(), data: { by: code } });
        // Verificar si con este done el ítem queda completamente desbloqueado
        const stillBlocked = dep.blockedBy.filter(c => {
          if (c === code) return false; // este acaba de hacerse done
          const blocker = ITEMS.find(i => i.code === c);
          return !blocker || blocker.status !== 'done';
        });
        if (stillBlocked.length === 0) nowUnblocked.push(dep.code);
      }
    });
    if (nowUnblocked.length) {
      const label = nowUnblocked.length === 1
        ? `🔓 ${nowUnblocked[0]} desbloqueado`
        : `🔓 ${nowUnblocked.length} ítems desbloqueados: ${nowUnblocked.join(', ')}`;
      setTimeout(() => showToast('success', label, null, 4000), 400);
    }
  }
  _undoSnapshot();
  _blogLog('status →', code, _prevStatus + ' → ' + newStatus, 'backlog');
  saveBacklog();
  // C8: animación salida si el ítem va a desaparecer del filtro activo
  if (newStatus === 'done' && !activeStatuses.has('done')) {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.classList.add('item-exit-anim');
      setTimeout(() => { renderBacklogList(); renderStats(); }, 360);
      return;
    }
  }
  renderBacklogList();
  renderStats();
}

function _resetStatusSelect(code, currentStatus) {
  // Resetea el select al valor actual mientras el modal está abierto
  const selects = document.querySelectorAll('.item-status-select');
  selects.forEach(sel => {
    if (sel.getAttribute('onchange') && sel.getAttribute('onchange').includes("'" + code + "'")) {
      sel.value = currentStatus;
    }
  });
}
function effortDots(n) {
  let h = '';
  for (let i = 0; i < 3; i++) h += `<div class="effort-dot${i < n ? ' filled' : ''}"></div>`;
  return h;
}

// Lógica R-con-hijos: si un R tiene hijos → no contable (se cuentan los hijos). R sin hijos → contable.
function _isCountableItem(i) {
  const rCodesWithChildren = new Set(ITEMS.filter(x => x.parentId).map(x => x.parentId));
  if (itemType(i.code) === 'P') return false; // P (posibilidades) no contaminan contadores de trabajo activo
  return !(itemType(i.code) === 'R' && rCodesWithChildren.has(i.code));
}

function renderStats() {
  if (!_getActiveProjectFilter() || !ITEMS.length) { document.getElementById('stats-bar').innerHTML = ''; return; }

  // T-202604-106: excluir ítems de sprints cerrados del módulo principal
  const closedSprintIds = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  const isInClosedSprint = i => i.sprint && closedSprintIds.has(i.sprint);

  const _countable = i => _isCountableItem(i);

  const countableItems = ITEMS.filter(i => _countable(i) && !isInClosedSprint(i) && i.status !== 'descartado' && i.status !== 'historico');

  // B-202605-205: incluir búsqueda activa — los contadores deben reflejar
  // los mismos ítems que aparecen en la lista, incluyendo el filtro de búsqueda.
  const _q = (backlogSearchQuery || '').trim().toLowerCase();
  const _matchesSearch = _q
    ? i => i.code.toLowerCase().includes(_q) || (i.title || '').toLowerCase().includes(_q) || (i.area || '').toLowerCase().includes(_q)
    : () => true;

  const visible = countableItems.filter(i => {
    const type = itemType(i.code);
    const typeOk = type ? activeTypes.has(type) : true;
    const statusOk = activeStatuses.has(i.status);
    return typeOk && statusOk && _matchesSearch(i);
  });

  // Por prioridad (sobre visibles)
  const c = {high:0, medium:0, low:0};
  visible.forEach(i => {
    const p = i.priority;
    if (p === 'high' || p === 'important' || p === 'critical' || p === 'importante') c.high++;
    else if (p === 'low' || p === 'futura' || p === 'baja') c.low++;
    else c.medium++;
  });

  // Por tipo (sobre visibles)
  const byType = {B:0, T:0, R:0, P:0};
  visible.forEach(i => { const t = itemType(i.code); if (t && byType[t] !== undefined) byType[t]++; });

  // Por effort (sobre visibles)
  const byEffort = {1:0, 2:0, 3:0};
  visible.forEach(i => { const e = parseInt(i.effort)||1; if (byEffort[e] !== undefined) byEffort[e]++; });
  // R-202605-122 AC5: contador de ítems sin effort (excluye P e históricos)
  const noEffortCount = countableItems.filter(i => !i.effort && itemType(i.code) !== 'P' && i.status !== 'historico').length;

  // Nivel 1: totales globales — P (ideas) excluidas de todos los contadores de trabajo activo
  const backlogCount = countableItems.filter(i => i.status === 'pendiente').length;
  const done     = countableItems.filter(i => i.status === 'done').length;
  // T-202604-358: descartados — discreto, no afecta pct
  const descartadoCount = ITEMS.filter(i => _isCountableItem(i) && i.status === 'descartado').length;
  const total    = backlogCount + done;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
  // Contador separado de P (ideas) — visible pero fuera del flujo de trabajo activo
  const pIdeasCount = ITEMS.filter(i => itemType(i.code) === 'P' && !isInClosedSprint(i) && i.status !== 'descartado' && i.status !== 'historico').length;

  document.getElementById('stats-bar').innerHTML = `
    <div class="stats-row">
      <!-- Nivel 1: progreso global -->
      <div class="stat-card s-progress">
        <div class="stat-progress-top">
          <div class="stat-progress-nums">
            <div class="stat-progress-item">
              <span class="stat-progress-n">${backlogCount}</span>
              <span class="stat-progress-l">Pendiente</span>
            </div>
            <div class="stat-progress-item">
              <span class="stat-progress-n s-done">${done}</span>
              <span class="stat-progress-l">Hecho</span>
            </div>
            ${descartadoCount > 0 ? `<div class="stat-progress-item stat-progress-item--discarded">
              <span class="stat-progress-n s-discarded">${descartadoCount}</span>
              <span class="stat-progress-l">Descartado</span>
            </div>` : ''}
          </div>
          <span class="stat-progress-pct">${pct}%</span>
        </div>
        <div class="stat-mini-track"><div class="stat-mini-fill" style="--stat-mini-w:${pct}%"></div></div>
      </div>
      <!-- Nivel 2: chips de tipo accionables — P (ideas) separado del flujo activo -->
      <div class="stat-card s-types">
        <div class="stat-detail-label">Tipo · filtrables</div>
        <div class="stat-detail-items">
          ${activeTypes.size < 4 ? `<span class="stat-type-chip stat-type-chip--all" onclick="clearTypeFilters()" title="Mostrar todos los tipos">✕ Todos</span>` : ''}
          ${[['B','Bug','Bugs / correcciones'],['T','Ticket','Tickets técnicos'],['R','Req','Requerimientos / epics']].map(([t,label,hint]) =>
            `<span class="stat-type-chip tc-${t}${activeTypes.has(t) ? ' active' : ''}" onclick="toggleTypeFilter('${t}')" title="${hint} — click para filtrar">
              <span class="tc-count">${byType[t]}</span><span class="tc-label">${label}</span>
            </span>`
          ).join('')}
          ${pIdeasCount > 0 ? `<span class="stat-type-chip tc-P stat-type-chip--ideas${activeTypes.has('P') ? ' active' : ''}" onclick="toggleTypeFilter('P')" title="Posibilidades — no afectan contadores de trabajo activo">
            <span class="tc-count">${pIdeasCount}</span><span class="tc-label">💡 Posibilidades</span>
          </span>` : ''}
        </div>
      </div>
    </div>
    <div class="stats-row">
      <!-- Nivel 3: prioridad + esfuerzo compacto -->
      <div class="stat-card s-meta">
        <div class="stat-meta-block">
          <div class="stat-meta-label">Prioridad</div>
          <div class="stat-meta-row">
            <span class="stat-pri-chip pri-high${activePriorityFilter.has('high') ? ' active' : ''}" onclick="togglePriorityFilter('high')" title="Filtrar por prioridad alta — click para activar/desactivar"><span class="spc-n">${c.high}</span> Alto</span>
            <span class="stat-pri-chip pri-medium${activePriorityFilter.has('medium') ? ' active' : ''}" onclick="togglePriorityFilter('medium')" title="Filtrar por prioridad media"><span class="spc-n">${c.medium}</span> Med</span>
            <span class="stat-pri-chip pri-low${activePriorityFilter.has('low') ? ' active' : ''}" onclick="togglePriorityFilter('low')" title="Filtrar por prioridad baja"><span class="spc-n">${c.low}</span> Bajo</span>
          </div>
        </div>
        <div class="stat-meta-block">
          <div class="stat-meta-label">Esfuerzo · filtrables${noEffortCount > 0 ? ` <span class="stat-effort-missing" title="Ítems sin effort asignado — requerido para burndown" onclick="toggleBacklogBlockerFilter && toggleEffortFilter(0)">${noEffortCount} sin effort</span>` : ''}</div>
          <div class="stat-meta-row">
            <span class="stat-effort-card${activeEfforts.has(1) ? ' active' : ''}" id="feff-1" onclick="toggleEffortFilter(1)" title="Filtrar effort 1"><span class="sec-count">${byEffort[1]}</span><span class="eff-label">● simple</span></span>
            <span class="stat-effort-card${activeEfforts.has(2) ? ' active' : ''}" id="feff-2" onclick="toggleEffortFilter(2)" title="Filtrar effort 2"><span class="sec-count">${byEffort[2]}</span><span class="eff-label">●● medio</span></span>
            <span class="stat-effort-card${activeEfforts.has(3) ? ' active' : ''}" id="feff-3" onclick="toggleEffortFilter(3)" title="Filtrar effort 3"><span class="sec-count">${byEffort[3]}</span><span class="eff-label">●●● complejo</span></span>
          </div>
        </div>
      </div>
    </div>
  `;
  // B-UX: reaplicar clases de estado de filtro tras recrear el DOM del stats-bar
  updateTypeFilterUI();
}
// T-053: construye el bloque de sesiones que referencian un ítem del backlog
function buildItemRefs(code) {
  const matches = [];
  getAllSessions().forEach(s => {
    if ((s.trackerRefs || []).includes(code)) {
      const ai = getAI(s.aiId);
      if (ai) matches.push({ ai, s });
    }
  });
  if (!matches.length) return '';
  const chips = matches.map(({ ai, s }) =>
    `<span class="item-ref-chip" title="${esc(s.title)}" onclick="switchTab('tracker');setTimeout(()=>openDetail('${ai.id}','${s.id}'),120)">${esc(ai.name)} · ${s.dateShort || s.date || ''}</span>`
  ).join('');
  return `<div class="item-refs"><span class="item-ref-label">Sesiones</span>${chips}</div>`;
}

// T-104/106: labels de tipo completos
const TYPE_LABELS = { I: 'Posibilidad', P: 'Pendiente', T: 'Ticket', R: 'Requerimiento', B: 'Bug' };

// T-108: toggle colapso de ítem individual
function toggleItemExpand(idx) {
  const body = document.getElementById('ibody-' + idx);
  const arrow = document.getElementById('iarrow-' + idx);
  if (!body) return;
  const open = body.classList.toggle('open');
  if (arrow) arrow.textContent = open ? '▾' : '▸';
  // T-202604-253: marcar ítem como seleccionado al expandir/colapsar
  _backlogSetSelected(body.closest ? body.closest('.item[data-code]') : null);
  // R-202604-015: abrir/cerrar panel lateral al expandir ítem
  const itemEl = body.closest ? body.closest('.item[data-code]') : null;
  const code = itemEl ? itemEl.dataset.code : null;
  if (open && code) {
    openItemPanel(code);
  } else if (!open) {
    closeItemPanel();
  }
}

// T-104/106: toggle secciones done/futura
function toggleSectionGroup(key) {
  const body = document.getElementById('sgbody-' + key);
  const arrow = document.getElementById('sgarrow-' + key);
  if (!body) return;
  const collapsed = body.classList.toggle('collapsed');
  if (arrow) arrow.textContent = collapsed ? '▸' : '▾';
  try { localStorage.setItem('backlog-' + key + '-open', collapsed ? '0' : '1'); } catch {}
}

// T-109: limpiar todos los filtros
function clearAllFilters() {
  activeTypes = new Set(['T','R','B','P']);
  activeStatuses = new Set(['pendiente']);
  activeEfforts = new Set([1, 2, 3]); // T-071
  activeRoleFilter = null; // T-202604-245
  activePriorityFilter = new Set(); // T-202604-357
  _backlogNoAcMode = false; // T-202604-363
  backlogSearchQuery = '';
  backlogSortMode = 'priority'; // T-202604-424: sprint eliminado como opción de sort
  backlogSortDir = 'desc'; // T-072 — default desc
  _backlogFocusMode = false; // T-202604-258
  _backlogPlanningMode = false; // R-202605-130
  const sortDirBtn = document.getElementById('fbar-sort-dir-btn');
  if (sortDirBtn) sortDirBtn.textContent = '↓';
  const searchEl = document.getElementById('search-global');
  if (searchEl) searchEl.value = '';
  const bsInput = document.getElementById('backlog-search-input');
  if (bsInput) bsInput.value = '';
  const bsClear = document.getElementById('backlog-search-clear');
  if (bsClear) bsClear.classList.remove('visible');
  const sortSel = document.getElementById('fbar-sort-select');
  if (sortSel && sortSel.value === 'sprint') sortSel.value = 'priority';
  updateTypeFilterUI();
  updateStatusFilterUI();
  updateEffortFilterUI(); // T-071
  updateRoleFilterUI();   // T-202604-245
  updateClearFilterBtn();
  renderBacklogList();
}

// R-202605-122 AC3: asignación rápida de effort desde badge sin abrir editor completo
function _quickAssignEffort(codeOrId) {
  const item = ITEMS.find(i => i.code === codeOrId || i.id === codeOrId);
  if (!item) return;
  const val = prompt('Asignar effort a ' + (item.code || item.id) + ' (1 = simple · 2 = medio · 3 = complejo):', '1');
  const n = parseInt(val);
  if (!val || isNaN(n) || n < 1 || n > 3) { showToast('warning', '⚠ Valor no válido — ingresa 1, 2 o 3'); return; }
  item.effort = n;
  if (item._needsEffortReview) delete item._needsEffortReview;
  _undoSnapshot();
  saveBacklog();
  renderBacklogList();
  renderStats();
  showToast('success', '✓ Effort ' + n + ' asignado a ' + (item.code || item.id));
}

// T-071: toggle filtro por esfuerzo
function toggleEffortFilter(e) {
  const n = parseInt(e);
  const allActive = activeEfforts.size === 3;
  if (allActive) {
    // primer click: desactiva todos, activa solo el clickeado
    activeEfforts = new Set([n]);
  } else if (activeEfforts.has(n)) {
    // click en activo: si es el único, restaura todos
    if (activeEfforts.size === 1) {
      activeEfforts = new Set([1, 2, 3]);
    } else {
      activeEfforts.delete(n);
    }
  } else {
    // click en inactivo con otros activos: acumula
    activeEfforts.add(n);
  }
  updateEffortFilterUI();
  renderBacklogList();
  // T-202604-364: filter-pulse feedback
  requestAnimationFrame(() => {
    const el = document.getElementById('feff-' + n);
    if (el) { el.classList.remove('filter-pulse'); void el.offsetWidth; el.classList.add('filter-pulse'); el.addEventListener('animationend', () => el.classList.remove('filter-pulse'), { once: true }); }
  });
}

function updateEffortFilterUI() {
  [1, 2, 3].forEach(n => {
    const el = document.getElementById('feff-' + n);
    if (el) el.classList.toggle('active', activeEfforts.has(n));
  });
}

// T-202604-065: sort handler
// T-202604-245: roles canónicos del ecosistema — fuente: Base Rules sección 2
const _ECOSYSTEM_ROLES = [
  'PO · Alex','FS · Mike',
  'PO · Axis','FS · Rex','UX · Nova',
  'PO · Orion','ET · Eden','GC · Sage','FS · Kai',
  'ST · Vera','QA · Finn','GW · Lena'
];

// T-202604-245: cambio de rol inline desde meta-grid
function setItemRole(code, role) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  item.role = role || '';
  _undoSnapshot();
  _blogLog('rol →', code, role || '(vacío)', 'backlog');
  saveBacklog();
  _setBacklogModified();
  renderBacklogList();
  renderStats();
  showToast('success', role ? `${code} → ${role}` : `${code} rol limpiado`);
}

// T-202604-245: toggle filtro por rol
function toggleRoleFilter(role) {
  // null = 'Sin rol'; string = rol específico
  if (activeRoleFilter === role) {
    activeRoleFilter = null; // segundo click = quitar filtro
  } else {
    activeRoleFilter = role;
  }
  updateRoleFilterUI();
  updateClearFilterBtn();
  renderBacklogList();
}

// T-202604-357: toggle filtro por prioridad — acumulable, combina con otros filtros
function togglePriorityFilter(p) {
  if (activePriorityFilter.has(p)) {
    activePriorityFilter.delete(p);
  } else {
    activePriorityFilter.add(p);
  }
  updateClearFilterBtn();
  renderBacklogList();
  renderStats();
}

function updatePriorityFilterUI() {
  ['high', 'medium', 'low'].forEach(p => {
    const el = document.querySelector('.stat-pri-chip.pri-' + p);
    if (el) el.classList.toggle('active', activePriorityFilter.has(p));
  });
}
function updateRoleFilterUI() {
  document.querySelectorAll('.frole-chip').forEach(chip => {
    const val = chip.dataset.role === '__none__' ? null : chip.dataset.role;
    chip.classList.toggle('active', activeRoleFilter === val);
  });
}

// T-202604-245: derivar lista de roles únicos en ITEMS
function _getActiveRoles() {
  const roles = new Set();
  ITEMS.forEach(i => { if (i.role && i.role.trim()) roles.add(i.role.trim()); });
  return [...roles].sort();
}

// T-202604-245: construir chips de rol para inyectar en filter bar
function _buildRoleChips() {
  const roles = _getActiveRoles();
  if (!roles.length) return '';
  const noneCount = ITEMS.filter(i => !i.role || !i.role.trim()).length;
  const chips = roles.map(r => {
    const isActive = activeRoleFilter === r;
    return `<button class="fbtn frole-chip${isActive ? ' active' : ''}" data-role="${esc(r)}" onclick="toggleRoleFilter('${esc(r)}')" title="Filtrar por rol: ${esc(r)}">${esc(r)}</button>`;
  });
  if (noneCount > 0) {
    const isActive = activeRoleFilter === null && activeRoleFilter !== undefined && activeRoleFilter !== 'initial';
    // chip Sin rol: activo cuando activeRoleFilter === '__none__' (sentinel)
    const isSinRolActive = activeRoleFilter === '__none__';
    chips.push(`<button class="fbtn frole-chip${isSinRolActive ? ' active' : ''}" data-role="__none__" onclick="toggleRoleFilter('__none__')" title="Ítems sin rol asignado">Sin rol</button>`);
  }
  return `<div class="frole-bar" id="frole-bar">${chips.join('')}</div>`;
}

function onBacklogSortChange(val) {
  // T-202604-424: ignorar 'sprint' si llega de localStorage legacy o select antiguo
  if (val === 'sprint') val = 'priority';
  backlogSortMode = val;
  renderBacklogList();
}

// T-072: toggle dirección de sort
function toggleSortDir() {
  backlogSortDir = backlogSortDir === 'asc' ? 'desc' : 'asc';
  const btn = document.getElementById('fbar-sort-dir-btn');
  if (btn) btn.textContent = backlogSortDir === 'asc' ? '↑' : '↓';
  renderBacklogList();
}

// T-202604-187: toggle árbol vs vista plana
// B-202604-122: persistir estado en localStorage
// T-202604-287: toggle vista Kanban
// T-202604-313/366: Mi vista — T's pendientes del rol activo en sprint activo, rotativo
function _getMiViewRoles() {
  const activeSprint = _getActiveSprint();
  if (!activeSprint) return [];
  const roles = new Set();
  ITEMS.forEach(i => {
    if (itemType(i.code) === 'T' && i.status === 'pendiente' && i.sprint === activeSprint.id && i.role && i.role.trim())
      roles.add(i.role.trim());
  });
  return [...roles].sort();
}

function _getMiViewLabel() {
  const roles = _getMiViewRoles();
  if (!roles.length) return 'Mi vista';
  const role = roles[_miViewRoleIndex % roles.length] || roles[0];
  return 'Mi vista: ' + role;
}

// T-202604-360: toggle footer fijo colapsable
function toggleBacklogFooter() {
  _blFooterCollapsed = !_blFooterCollapsed;
  const filtersRow = document.getElementById('bl-footer-filters');
  const toggleBtn  = document.getElementById('bl-footer-toggle');
  if (filtersRow) filtersRow.classList.toggle('bl-footer-row--hidden', _blFooterCollapsed);
  if (toggleBtn)  toggleBtn.textContent = _blFooterCollapsed ? '▼' : '▲';
}

// AC: aria tablist — sincroniza atributos aria-selected (vistas de agrupación) y aria-checked (modificadores)
// Vistas de agrupación mutuamente excluyentes: Sprints · Árbol · Kanban · Planificar
// Modificadores combinables: Focus · Mi vista
// Regla: nunca todas las vistas de agrupación inactivas — default Sprints
function _syncViewAriaStates() {
  // Vistas de agrupación — aria-selected refleja estado de cada variable
  const sprintBtn   = document.getElementById('fbar-sprint-btn');
  const treeBtn     = document.getElementById('fbar-tree-btn');
  const kanbanBtn   = document.getElementById('fbar-kanban-btn');
  const planningBtn = document.getElementById('fbar-planning-btn');

  // Determinar vista de agrupación activa
  // Prioridad: Planificación > Kanban > Árbol > Sprints (default)
  const anyGroupActive = _backlogPlanningMode || _backlogKanbanMode || _backlogTreeMode || _backlogSprintGroupMode;
  // Garantizar default: si ninguna activa, activar Sprints
  if (!anyGroupActive) {
    _backlogSprintGroupMode = true;
    localStorage.setItem('backlog-sprint-group-mode', 'true');
    if (sprintBtn) sprintBtn.classList.add('active');
  }

  if (sprintBtn)   sprintBtn.setAttribute('aria-selected',   String(_backlogSprintGroupMode && !_backlogKanbanMode && !_backlogPlanningMode));
  if (treeBtn)     treeBtn.setAttribute('aria-selected',     String(_backlogTreeMode && !_backlogKanbanMode && !_backlogPlanningMode));
  if (kanbanBtn)   kanbanBtn.setAttribute('aria-selected',   String(_backlogKanbanMode && !_backlogPlanningMode));
  if (planningBtn) planningBtn.setAttribute('aria-selected', String(_backlogPlanningMode));

  // Modificadores — aria-checked refleja estado
  const focusBtn = document.getElementById('fbar-focus-btn');
  const mikeBtn  = document.getElementById('fbar-mike-btn');
  if (focusBtn) focusBtn.setAttribute('aria-checked', String(_backlogFocusMode));
  if (mikeBtn)  mikeBtn.setAttribute('aria-checked',  String(_backlogMikeMode));
}

function toggleBacklogMikeMode() {
  const roles = _getMiViewRoles();
  if (!roles.length) return;
  if (!_backlogMikeMode) {
    _backlogMikeMode = true;
    _miViewRoleIndex = 0;
  } else if (roles.length === 1) {
    // Solo un rol — segundo click desactiva
    _backlogMikeMode = false;
    _miViewRoleIndex = 0;
  } else {
    // Rotar al siguiente rol
    _miViewRoleIndex = (_miViewRoleIndex + 1) % roles.length;
  }
  const btn = document.getElementById('fbar-mike-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogMikeMode);
    btn.textContent = _backlogMikeMode ? _getMiViewLabel() : 'Mi vista';
    btn.title = _backlogMikeMode
      ? 'Mi vista activa · click para rotar al siguiente rol'
      : 'Mi vista — T\'s pendientes por rol en sprint activo';
  }
  updateClearFilterBtn();
  _syncViewAriaStates();
  renderBacklogList();
}

function toggleBacklogKanbanMode() {
  _backlogKanbanMode = !_backlogKanbanMode;
  if (_backlogKanbanMode) {
    _backlogTreeMode = false;
    _backlogPlanningMode = false;
    localStorage.setItem('backlog-view-mode', 'kanban');
  } else {
    localStorage.setItem('backlog-view-mode', 'false'); // plano al salir de kanban
  }
  // Actualizar botón árbol
  const treeBtn = document.getElementById('fbar-tree-btn');
  if (treeBtn) {
    treeBtn.textContent = _backlogTreeMode ? '⊞ Árbol' : '☰ Plano';
    treeBtn.classList.toggle('active', _backlogTreeMode);
  }
  // Actualizar botón kanban
  const kbBtn = document.getElementById('fbar-kanban-btn');
  if (kbBtn) kbBtn.classList.toggle('active', _backlogKanbanMode);
  _syncViewAriaStates();
  renderBacklogList();
}

function toggleBacklogTreeMode() {
  if (_backlogKanbanMode) { _backlogKanbanMode = false; }
  if (_backlogPlanningMode) { _backlogPlanningMode = false; }
  _backlogTreeMode = !_backlogTreeMode;
  localStorage.setItem('backlog-view-mode', String(_backlogTreeMode));
  const btn = document.getElementById('fbar-tree-btn');
  if (btn) {
    btn.textContent = _backlogTreeMode ? '⊞ Árbol' : '☰ Plano';
    btn.title = _backlogTreeMode ? 'Vista árbol activa — click para vista plana' : 'Vista plana activa — click para vista árbol';
    btn.classList.toggle('active', _backlogTreeMode);
  }
  _syncViewAriaStates();
  renderBacklogList();
}

// T-202604-258: toggle modo Focus — top 10 ítems por score descendente
function toggleBacklogFocusMode() {
  _backlogFocusMode = !_backlogFocusMode;
  const btn = document.getElementById('fbar-focus-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogFocusMode);
    // T-202604-421: tooltip explica criterios
    btn.title = _backlogFocusMode
      ? 'Focus activo — Top 10 por: tipo · sprint · effort · antigüedad · click para desactivar'
      : 'Activar Focus — Top 10 por: tipo · sprint · effort · antigüedad';
    if (!_backlogFocusMode) btn.textContent = '🎯 Focus'; // reset label al desactivar
  }
  // B-202604-157: recalcular scores al activar Focus — garantiza orden por relevancia actualizado
  if (_backlogFocusMode) _recalcAllScores();
  updateClearFilterBtn();
  _syncViewAriaStates();
  renderBacklogList();
}

// R-[tmp:sprint-group-toggle]: toggle agrupación por sprint en backlog activo
function toggleBacklogSprintGroupMode() {
  _backlogSprintGroupMode = !_backlogSprintGroupMode;
  if (_backlogSprintGroupMode) {
    _backlogKanbanMode = false;
    _backlogTreeMode = false;
    _backlogPlanningMode = false;
  }
  localStorage.setItem('backlog-sprint-group-mode', String(_backlogSprintGroupMode));
  const btn = document.getElementById('fbar-sprint-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogSprintGroupMode);
    btn.title = _backlogSprintGroupMode ? 'Agrupación por sprint activa — click para vista plana' : 'Vista plana activa — click para agrupar por sprint';
  }
  _syncViewAriaStates();
  renderBacklogList();
}

// T-202604-363: toggle filtro Sin AC — pendientes sin criterios de aceptación
function toggleBacklogNoAcMode() {
  _backlogNoAcMode = !_backlogNoAcMode;
  const btn = document.getElementById('fbar-no-ac-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogNoAcMode);
    btn.title = _backlogNoAcMode ? 'Sin AC activo — click para desactivar' : 'Filtrar ítems sin criterios de aceptación';
  }
  updateClearFilterBtn();
  renderBacklogList();
}

// R-202605-130: vista Planificación — drag & drop de ítems sin sprint al sprint siguiente
function toggleBacklogPlanningMode() {
  _backlogPlanningMode = !_backlogPlanningMode;
  // Al activar planning, desactivar otros modos de vista exclusivos
  if (_backlogPlanningMode) {
    _backlogKanbanMode = false;
    _backlogTreeMode = false;
    _backlogSprintGroupMode = false;
    _backlogFocusMode = false;
  }
  const btn = document.getElementById('fbar-planning-btn');
  if (btn) {
    btn.classList.toggle('active', _backlogPlanningMode);
    btn.title = _backlogPlanningMode
      ? 'Vista Planificación activa — click para volver al backlog'
      : 'Vista Planificación — asignar ítems al siguiente sprint';
  }
  const kanbanBtn = document.getElementById('fbar-kanban-btn');
  if (kanbanBtn) kanbanBtn.classList.toggle('active', _backlogKanbanMode);
  const focusBtn = document.getElementById('fbar-focus-btn');
  if (focusBtn) focusBtn.classList.toggle('active', _backlogFocusMode);
  updateClearFilterBtn();
  _syncViewAriaStates();
  renderBacklogList();
}

// T-202604-187: colapsar/expandir bloque de hijos de un R
function toggleChildrenBlock(rCode) {
  if (_collapsedChildren.has(rCode)) {
    _collapsedChildren.delete(rCode);
  } else {
    _collapsedChildren.add(rCode);
  }
  const body = document.getElementById('rchildren-body-' + CSS.escape(rCode));
  const arrow = document.getElementById('rchildren-arrow-' + CSS.escape(rCode));
  if (body) body.classList.toggle('collapsed', _collapsedChildren.has(rCode));
  if (arrow) arrow.textContent = _collapsedChildren.has(rCode) ? '▸' : '▾';
}

// R-202604-016: asignar parent a un T/B desde item-body
function setItemParent(code, parentCode) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  item.parentId = parentCode || null;
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  renderBacklogList();
  renderStats();
  showToast('success', parentCode ? `${code} vinculado a ${parentCode}` : `${code} desvinculado`);
}

function updateClearFilterBtn() {
  const btn = document.getElementById('filter-clear-btn');
  if (!btn) return;
  const allTypes = activeTypes.size === 4;
  const defaultStatus = activeStatuses.size === 1 && activeStatuses.has('pendiente') && !activeStatuses.has('done');
  const noSearch = !backlogSearchQuery;
  const noRoleFilter = activeRoleFilter === null;
  const noPriorityFilter = activePriorityFilter.size === 0; // T-202604-357
  const isDefault = allTypes && defaultStatus && noSearch && noRoleFilter && noPriorityFilter && !_backlogFocusMode && !_backlogNoAcMode;
  btn.classList.toggle('is-hidden', isDefault);

  // R-202605-094: chips individuales limpiables por filtro activo
  const wrap = document.getElementById('active-filter-chips');
  if (!wrap) return;
  if (isDefault) { wrap.innerHTML = ''; return; }

  const chips = [];
  const _chip = (label, clearFn) =>
    `<span class="afc-chip" onclick="(${clearFn})()">${esc(label)} <span class="afc-chip-x">✕</span></span>`;

  if (!allTypes) {
    const excluded = ['T','R','B','P'].filter(t => !activeTypes.has(t));
    excluded.forEach(t => {
      const labels = { T:'Ticket', R:'Req', B:'Bug', P:'Posibilidad' };
      chips.push(_chip(`Sin ${labels[t]}`, `function(){toggleTypeFilter('${t}')}`));
    });
  }
  if (!defaultStatus) {
    [...activeStatuses].filter(s => s !== 'pendiente').forEach(s => {
      chips.push(_chip(`+${s}`, `function(){toggleStatusFilter('${s}')}`));
    });
    if (!activeStatuses.has('pendiente')) {
      chips.push(_chip('−Pendiente', `function(){toggleStatusFilter('pendiente')}`));
    }
  }
  if (!noRoleFilter) {
    const label = activeRoleFilter === '__none__' ? 'Sin rol' : activeRoleFilter;
    chips.push(_chip(`Rol: ${label}`, `function(){toggleRoleFilter(${activeRoleFilter === '__none__' ? "'__none__'" : `'${activeRoleFilter}'`})}`));
  }
  if (!noPriorityFilter) {
    [...activePriorityFilter].forEach(p => {
      chips.push(_chip(`Pri: ${p}`, `function(){togglePriorityFilter('${p}')}`));
    });
  }
  if (activeEfforts.size < 3) {
    [1,2,3].filter(e => !activeEfforts.has(e)).forEach(e => {
      chips.push(_chip(`Sin E${e}`, `function(){toggleEffortFilter(${e})}`));
    });
  }
  if (!noSearch) chips.push(_chip(`"${backlogSearchQuery}"`, `function(){clearBacklogSearch()}`));
  if (_backlogNoAcMode) chips.push(_chip('Sin AC', `function(){toggleBacklogNoAcMode()}`));
  if (_backlogFocusMode) chips.push(_chip('Focus top 10', `function(){toggleBacklogFocusMode()}`));

  wrap.innerHTML = chips.join('');
}

// T-202604-213: pills de contadores de status para headers de grupo
function _statusPills(items) {
  const counts = { pendiente: 0, done: 0, descartado: 0 };
  // P's (ideas) no son trabajo activo — excluir de pendiente, consistente con _isCountableItem
  items.forEach(i => {
    if (i.status === 'pendiente' && itemType(i.code) === 'P') return;
    if (counts[i.status] !== undefined) counts[i.status]++;
  });
  const cfg = [
    { key: 'pendiente', label: 'pendiente', color: 'var(--accent)',  bg: 'color-mix(in srgb, var(--accent) 15%, transparent)' },
    { key: 'done',      label: 'done',      color: 'var(--green)',   bg: 'color-mix(in srgb, var(--green) 15%, transparent)' },
    { key: 'descartado',label: 'desc.',     color: 'var(--c-done-text)', bg: 'var(--c-done-bg)' },
  ];
  return cfg
    .filter(c => counts[c.key] > 0)
    .map(c => `<span class="status-pill status-pill--${c.key}">${counts[c.key]} ${c.label}</span>`)
    .join('');
}

// T-202604-260: toggle colapso del panel salud — persiste en localStorage
function toggleSprintHealthPanel() {
  const body = document.getElementById('sprint-health-body');
  const arrow = document.getElementById('sprint-health-arrow');
  const header = body ? body.previousElementSibling : null;
  if (!body) return;
  const isNowCollapsed = !body.classList.contains('is-hidden');
  body.classList.toggle('is-hidden', isNowCollapsed);
  if (header) header.classList.toggle('sh-header--open', !isNowCollapsed);
  if (arrow) arrow.textContent = isNowCollapsed ? '▸' : '▾';
  try { localStorage.setItem('sprint-health-open', isNowCollapsed ? '0' : '1'); } catch {}
}

// R-202605-103: toggleClosedSprintsBody reemplazada por toggleArchivoHistorico
function toggleClosedSprintsBody() { toggleArchivoHistorico(); }

// T-202604-290 · T-202605-450: velocidad por sprint — retorna { avg, sprints: [{id, label, planned, real}] }
// planned = suma effort asignado (excluye descartados)
// real    = suma effort done
function _calcEstimatedVelocity() {
  const closedSprints = getActiveSprints()
    .filter(s => s.status === 'closed')
    .slice(-5); // R-202605-126: últimos 5 cerrados (antes: 3)
  if (closedSprints.length < 2) return null;
  const sprintData = closedSprints.map(sp => {
    const spItems = ITEMS.filter(i => i.sprint === sp.id && i.status !== 'descartado');
    const planned = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    const real    = spItems.filter(i => i.status === 'done' || i.status === 'historico')
                           .reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
    // R-202605-126: días activos del sprint para velocidad/día
    const tsStart  = sp.startedAt || sp.createdAt || null;
    const tsEnd    = sp.closedAt  || null;
    const daysActive = (tsStart && tsEnd)
      ? Math.max(1, Math.floor((tsEnd - tsStart) / 86400000))
      : null;
    const velPerDay = (daysActive !== null && real > 0)
      ? Math.round((real / daysActive) * 10) / 10
      : (daysActive !== null ? 0 : null);
    return { id: sp.id, label: sp.label || sp.id, planned, real, daysActive, velPerDay };
  });
  const reals = sprintData.map(d => d.real);
  const avg = Math.round((reals.reduce((a, b) => a + b, 0) / reals.length) * 10) / 10;
  return { avg, sprints: sprintData };
}

// T-202604-260: construir HTML del panel salud del sprint activo
// B-202605-249: fallback a sprint open más reciente cuando no hay sprint active
function _buildSprintHealthPanel() {
  if (!_getActiveProjectFilter()) return '';
  const activeSprint = _getActiveSprint();
  // B-202605-249: si no hay sprint active, usar el sprint open más reciente
  const _openFallback = !activeSprint
    ? (getActiveSprints()
        .filter(s => s.status === 'open')
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0] || null)
    : null;
  const displaySprint = activeSprint || _openFallback;
  if (!displaySprint) return '';
  const _isOpenFallback = !activeSprint && !!_openFallback; // B-202605-249: label diferenciador

  // Ítems del sprint (excluye descartados del conteo de comprometidos)
  const sprintItems = ITEMS.filter(i => i.sprint === displaySprint.id && i.status !== 'descartado');
  if (!sprintItems.length) return '';

  const totalItems   = sprintItems.length;
  const doneItems    = sprintItems.filter(i => i.status === 'done').length;
  const pendItems    = totalItems - doneItems;
  const pctItems     = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  // T-202604-261: ítems bloqueados en el sprint activo
  const blockedItems = sprintItems.filter(i => _isBlocked(i)).length;

  const totalEffort  = sprintItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const doneEffort   = sprintItems.filter(i => i.status === 'done')
                                  .reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const pctEffort    = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;

  // R-202605-127: burndown por effort — segmentos: done · scope added · descartado · pendiente
  // Ítems descartados del sprint (excluidos del sprintItems normal — query separada)
  const _allSprintItems   = ITEMS.filter(i => i.sprint === displaySprint.id);
  const _descartedItems   = _allSprintItems.filter(i => i.status === 'descartado');
  const descartedEffort   = _descartedItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  // Effort scope added (subconjunto de pendiente)
  const _scopeAddedPend   = sprintItems.filter(i => i.scope_added && i.status !== 'done');
  const scopeAddedEffortPend = _scopeAddedPend.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  // Pendiente puro (sin contar done)
  const pendEffort        = totalEffort - doneEffort;
  // Total incluyendo descartados para barra
  const totalEffortFull   = totalEffort + descartedEffort;
  // Ítems sin effort (excluye P e históricos) — badge de advertencia AC-7
  const noEffortItems     = _allSprintItems.filter(i =>
    i.status !== 'historico' &&
    itemType(i.code) !== 'P' &&
    !i.effort
  ).length;

  // Días transcurridos desde creación del sprint
  const createdAt    = displaySprint.createdAt || null;
  const daysElapsed  = createdAt ? Math.floor((Date.now() - createdAt) / 86400000) : null;
  const daysLabel    = daysElapsed === null ? '—'
    : daysElapsed === 0 ? 'hoy'
    : daysElapsed === 1 ? '1 día'
    : `${daysElapsed} días`;

  // Salud general: verde ≥70%, amarillo ≥40%, rojo <40%
  const healthColor  = pctItems >= 70 ? 'var(--green)' : pctItems >= 40 ? '#f59e0b' : 'var(--red,#e85555)';
  const isOpen = localStorage.getItem('sprint-health-open') !== '0';

  // B-202605-249: label diferenciado según status real del sprint
  const sprintLabel  = displaySprint.label || displaySprint.id;
  const _sprintStatusBadge = _isOpenFallback
    ? ' <span class="sh-sprint-status-badge sh-sprint-status-badge--open">abierto</span>'
    : ' <span class="sh-sprint-status-badge sh-sprint-status-badge--active">★</span>';

  // R-202605-127: burndown effort — barra segmentada + número + badge sin effort
  const _bTotal = totalEffortFull > 0 ? totalEffortFull : 1; // evitar /0
  const _pDone      = Math.round((doneEffort / _bTotal) * 100);
  const _pDescarted = Math.round((descartedEffort / _bTotal) * 100);
  const _pScopeAdd  = totalEffort > 0 ? Math.round((scopeAddedEffortPend / _bTotal) * 100) : 0;
  // pendiente puro = lo que queda fuera de done y scope added (ambos ya en barra)
  const _pPend      = Math.max(0, 100 - _pDone - _pDescarted - _pScopeAdd);

  const _noEffortBadge = noEffortItems > 0
    ? `<span class="sh-burndown-no-effort" title="${noEffortItems} ítem${noEffortItems !== 1 ? 's' : ''} sin effort — burndown incompleto">⚠ ${noEffortItems} sin effort</span>`
    : '';

  const burndownHtml = `<div class="sh-burndown">
    <div class="sh-burndown-header">
      <span class="sh-burndown-label">Burndown effort</span>
      <span class="sh-burndown-count"><strong>${doneEffort}</strong> de ${totalEffort} effort completado${descartedEffort > 0 ? ` · <span class="sh-burndown-desc-inline">${descartedEffort} desc.</span>` : ''}${_noEffortBadge}</span>
    </div>
    <div class="sh-burndown-track" title="${doneEffort} done · ${pendEffort} pendiente${scopeAddedEffortPend > 0 ? ' · ' + scopeAddedEffortPend + ' scope added' : ''}${descartedEffort > 0 ? ' · ' + descartedEffort + ' descartado' : ''}">
      <div class="sh-burndown-seg sh-burndown-seg--done"    style="--bd-w:${_pDone}%"></div>
      <div class="sh-burndown-seg sh-burndown-seg--scope"   style="--bd-w:${_pScopeAdd}%"></div>
      <div class="sh-burndown-seg sh-burndown-seg--pend"    style="--bd-w:${_pPend}%"></div>
      <div class="sh-burndown-seg sh-burndown-seg--desc"    style="--bd-w:${_pDescarted}%"></div>
    </div>
    <div class="sh-burndown-legend">
      <span class="sh-burndown-legend-item sh-burndown-legend-item--done">done</span>
      ${scopeAddedEffortPend > 0 ? '<span class="sh-burndown-legend-item sh-burndown-legend-item--scope">scope added</span>' : ''}
      <span class="sh-burndown-legend-item sh-burndown-legend-item--pend">pendiente</span>
      ${descartedEffort > 0 ? '<span class="sh-burndown-legend-item sh-burndown-legend-item--desc">descartado</span>' : ''}
    </div>
  </div>`;

  // R-202605-123: goal del sprint — mostrar o hint de edición si vacío
  const sprintGoal = displaySprint.goal ? displaySprint.goal.trim() : '';
  const goalHtml = sprintGoal
    ? `<div class="sh-goal">${esc(sprintGoal)}</div>`
    : `<div class="sh-goal sh-goal--empty" ondblclick="editSprintInline('${esc(displaySprint.id)}')" title="Doble click para agregar goal">Sin goal — ¿qué quieres lograr?</div>`;

  // T-202604-290 · T-202605-450: velocidad planificada vs real + tendencia
  const velocityData = _calcEstimatedVelocity();

  // R-202605-131: contador de ítems scope added en sprint activo
  const scopeAddedItems  = sprintItems.filter(i => i.scope_added);
  const scopeAddedCount  = scopeAddedItems.length;
  const scopeAddedEffort = scopeAddedItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const scopeAddedHtml   = scopeAddedCount > 0
    ? `<div class="sh-scope-added-row">
        <span class="sh-scope-added-label">Scope añadido durante el sprint</span>
        <span class="sh-scope-added-val">${scopeAddedCount} ítem${scopeAddedCount !== 1 ? 's' : ''} <span class="sh-scope-added-effort">(${scopeAddedEffort} effort)</span></span>
       </div>`
    : '';

  let velocityFooter;
  if (velocityData === null) {
    velocityFooter = `<div class="sh-footer">
        <span class="sh-footer-label">Velocidad</span>
        <span class="sh-footer-val sh-footer-val--hint">Sin datos suficientes (mínimo 2 sprints cerrados)</span>
      </div>`;
  } else {
    const { avg, sprints: vSprints } = velocityData;
    // Tendencia: comparar real del último sprint vs promedio previo
    const lastReal = vSprints[vSprints.length - 1].real;
    const prevAvg  = vSprints.slice(0, -1).reduce((a, d) => a + d.real, 0) / (vSprints.length - 1);
    const trendClass = lastReal >= prevAvg * 1.1 ? 'sh-trend--up' : lastReal <= prevAvg * 0.9 ? 'sh-trend--down' : 'sh-trend--flat';
    const trendIcon  = lastReal >= prevAvg * 1.1 ? '▲' : lastReal <= prevAvg * 0.9 ? '▼' : '→';
    // R-202605-126: columna vel/día en cada fila
    const trendRows  = vSprints.map(d => {
      const pct = d.planned > 0 ? Math.round((d.real / d.planned) * 100) : 0;
      const barColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? '#f59e0b' : 'var(--red,#e85555)';
      const velHtml = d.velPerDay === null
        ? `<span class="sh-trend-vel sh-trend-vel--na" title="Sin timestamps de inicio/cierre">—</span>`
        : `<span class="sh-trend-vel">${d.velPerDay}</span>`;
      return `<div class="sh-trend-row sh-trend-row--5col">
          <span class="sh-trend-label" title="${esc(d.label)}">${esc(d.id)}</span>
          <span class="sh-trend-nums"><span class="sh-trend-real">${d.real}</span><span class="sh-trend-sep">/</span><span class="sh-trend-plan">${d.planned}</span></span>
          <div class="sh-bar-track sh-bar-track--sm">
            <div class="sh-bar-fill" style="--sh-bar-w:${Math.min(pct,100)}%;--sh-bar-color:${barColor}"></div>
          </div>
          <span class="sh-trend-pct">${pct}%</span>
          ${velHtml}
        </div>`;
    }).join('');
    // R-202605-126: sección con encabezado visible + header 5 columnas
    velocityFooter = `<div class="sh-footer sh-footer--trend">
        <div class="sh-velocity-section-title">Velocidad por sprint</div>
        <div class="sh-footer-top">
          <span class="sh-footer-label">Velocidad real promedio</span>
          <span class="sh-footer-val">${avg} <span class="sh-trend-badge ${trendClass}">${trendIcon}</span></span>
        </div>
        <div class="sh-trend-header sh-trend-header--5col">
          <span class="sh-trend-col-sprint">Sprint</span>
          <span class="sh-trend-col-nums">Real / Plan.</span>
          <span class="sh-trend-col-bar"></span>
          <span class="sh-trend-col-pct">%</span>
          <span class="sh-trend-col-vel">vel/día</span>
        </div>
        <div class="sh-trend-rows">${trendRows}</div>
        <div class="sh-footer-suggest">Effort máx. sugerido próximo sprint: <strong>${avg}</strong></div>
      </div>`;
  }

  return `<div id="sprint-health-panel" class="sh-panel">
    <div onclick="toggleSprintHealthPanel()" class="sh-header${isOpen ? ' sh-header--open' : ''}">
      <span class="sh-title">Salud sprint</span>
      <span class="sh-sprint-label">${esc(sprintLabel)}${_sprintStatusBadge}</span>
      <span class="sh-summary">
        <span class="sh-pct" style="--sh-health-color:${healthColor}">${pctItems}%</span>
        <span id="sprint-health-arrow" class="sh-arrow">${isOpen ? '▾' : '▸'}</span>
      </span>
    </div>
    <div id="sprint-health-body" class="${isOpen ? 'sh-body' : 'sh-body hidden'}">
      ${goalHtml}
      <!-- R-202605-127: burndown por effort -->
      ${burndownHtml}
      <div class="sh-grid">
        <!-- Ítems -->
        <div class="sh-col sh-col--border">
          <div class="sh-col-label">Ítems</div>
          <div class="sh-col-nums">
            <span class="sh-num sh-num--green">${doneItems}</span>
            <span class="sh-num-total">/ ${totalItems}</span>
            <span class="sh-num-pend">(${pendItems} pend.)</span>
          </div>
          <div class="sh-bar-track">
            <div class="sh-bar-fill" style="--sh-bar-w:${pctItems}%;--sh-bar-color:${healthColor}"></div>
          </div>
        </div>
        <!-- Effort -->
        <div class="sh-col sh-col--border">
          <div class="sh-col-label">Effort</div>
          <div class="sh-col-nums">
            <span class="sh-num sh-num--blue">${doneEffort}</span>
            <span class="sh-num-total">/ ${totalEffort}</span>
            <span class="sh-num-pend">(${pctEffort}%)</span>
          </div>
          <div class="sh-bar-track">
            <div class="sh-bar-fill sh-bar-fill--blue" style="--sh-bar-w:${pctEffort}%"></div>
          </div>
        </div>
        <!-- Días -->
        <div class="sh-col">
          <div class="sh-col-label">Días activo</div>
          <div class="sh-days-val">${daysLabel}</div>
          ${daysElapsed !== null && daysElapsed > 14
            ? `<div class="sh-warn sh-warn--yellow">⚠ Sprint largo</div>`
            : daysElapsed !== null
              ? `<div class="sh-warn sh-warn--hint">desde apertura</div>`
              : ''}
          ${blockedItems > 0
            ? `<div class="sh-warn sh-warn--red">⛔ ${blockedItems} bloqueado${blockedItems !== 1 ? 's' : ''}</div>`
            : ''}
        </div>
      </div>
      <!-- T-202604-290 · T-202605-450: velocidad planificada vs real -->
      <!-- R-202605-131: scope added counter -->
      ${scopeAddedHtml}
      ${velocityFooter}
    </div>
  </div>`;
}

// T-202604-284: Sprint Roadmap — filtro activo (sprintId | null)
let _roadmapSprintFilter = null;

// T-202604-284: navegar al grupo de un sprint en el backlog
function roadmapGoToSprint(sprintId) {
  // T-202604-364: click feedback en chip
  requestAnimationFrame(() => {
    document.querySelectorAll('.rm-chip').forEach(el => {
      if (el.title && el.title.startsWith(sprintId + ' ·') || el.onclick && el.getAttribute('onclick') && el.getAttribute('onclick').includes(`'${sprintId}'`)) {
        el.classList.remove('rm-chip--clicked');
        void el.offsetWidth;
        el.classList.add('rm-chip--clicked');
        el.addEventListener('animationend', () => el.classList.remove('rm-chip--clicked'), { once: true });
      }
    });
  });
  // Si se hace click sobre el sprint ya activo → limpia filtro
  _roadmapSprintFilter = (_roadmapSprintFilter === sprintId) ? null : sprintId;

  // B-202604-159: actualizar chips visuales
  _renderSprintRoadmap();

  // T-202604-424: agrupación por sprint es siempre activa — no es necesario forzar sortMode
  // Asegurar status pendiente incluido
  if (!activeStatuses.has('pendiente')) {
    activeStatuses.add('pendiente');
    updateStatusFilterUI();
  }

  renderBacklogList();

  if (!_roadmapSprintFilter) return;

  // Scroll al grupo tras render
  requestAnimationFrame(() => {
    const groupId = sprintId === '__unassigned__'
      ? 'sin-asignar'
      : sprintId.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const groupEl = document.getElementById('vbody-' + groupId)?.closest('.version-group');
    if (!groupEl) return;
    groupEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    groupEl.classList.add('roadmap-sprint-highlight');
    setTimeout(() => groupEl.classList.remove('roadmap-sprint-highlight'), 1800);
  });
}

// T-202604-284: construir HTML del roadmap de sprints
// R-[tmp:toolbar-backlog-redesign]: sprint selector — trigger colapsado + dropdown on-demand

// B-202605-058: función de módulo única — elimina duplicación verbatim en _buildSprintSelector y _blSprintOpen
function _buildSprintOption(sp) {
  const id = sp.id;
  const label = sp.label || sp.id;
  const status = sp.status || 'open';
  const isActive = status === 'active';
  const isClosed = status === 'closed';
  const isSelected = _roadmapSprintFilter === id;
  const total = ITEMS.filter(i => (i.sprint || '').trim() === id).length;
  const done  = ITEMS.filter(i => (i.sprint || '').trim() === id && i.status === 'done').length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const mark  = isActive ? '★' : isClosed ? '·' : '○';
  const badgeCls = isActive ? 'bl-sprint-badge--active' : isClosed ? 'bl-sprint-badge--closed' : 'bl-sprint-badge--open';
  const badgeTxt = isActive ? 'activo' : isClosed ? 'cerrado' : 'abierto';
  const activeCls = isActive ? ' is-active-sprint' : '';
  const selectedCls = isSelected ? ' is-selected' : '';
  // T-202604-417: botón "Ver retro" para sprints cerrados con retroDoc guardado
  const retroBtn = isClosed && sp.retroDoc
    ? `<button class="bl-sprint-retro-btn" onclick="event.stopPropagation();openSprintRetroView('${esc(id)}')" title="Ver retrospectiva" type="button">retro</button>`
    : '';
  return `<button class="bl-sprint-option${activeCls}${selectedCls}" onclick="_blSprintSelect('${esc(id)}')" type="button">
    <span class="bl-sprint-option-mark">${mark}</span>
    <span class="bl-sprint-option-name">${esc(label)}</span>
    <div class="bl-sprint-option-meta">
      <div class="bl-sprint-option-bar-wrap"><div class="bl-sprint-option-bar-fill" style="width:${pct}%"></div></div>
      <span class="bl-sprint-option-pct">${pct}%</span>
      <span class="bl-sprint-option-badge ${badgeCls}">${badgeTxt}</span>
      ${retroBtn}
    </div>
  </button>`;
}

function _buildSprintSelector() {
  const allSprints = getActiveSprints() || [];
  if (!allSprints.length) return '';

  // Sprint activo para el trigger
  const activeSprint = allSprints.find(s => s.status === 'active');
  const openSprints  = allSprints.filter(s => s.status !== 'closed' && s.status !== 'active');
  const closedSprints = allSprints.filter(s => s.status === 'closed');

  // datos del sprint activo para la barra de progreso del trigger
  let triggerName = '', triggerPct = 0;
  if (activeSprint) {
    const id = activeSprint.id;
    const total = ITEMS.filter(i => (i.sprint || '').trim() === id).length;
    const done  = ITEMS.filter(i => (i.sprint || '').trim() === id && i.status === 'done').length;
    triggerPct = total > 0 ? Math.round((done / total) * 100) : 0;
    triggerName = activeSprint.label || activeSprint.id;
  } else if (openSprints.length) {
    triggerName = openSprints[openSprints.length - 1].label || openSprints[openSprints.length - 1].id;
  }

  const triggerNameHtml = triggerName
    ? `<span class="bl-sprint-active-name">${esc(triggerName)}</span>`
    : `<span class="bl-sprint-active-name is-empty">Sin sprint activo</span>`;

  const progressHtml = activeSprint ? `
    <div class="bl-sprint-trigger-progress">
      <div class="bl-sprint-trigger-bar-wrap">
        <div class="bl-sprint-trigger-bar-fill" style="--sbar-w:${triggerPct}%"></div>
      </div>
      <span class="bl-sprint-trigger-pct">${triggerPct}%</span>
    </div>` : '';

  // builder de opción individual — B-202605-058: referencia a función de módulo _buildSprintOption
  const closedOptionsHtml = closedSprints.map(_buildSprintOption).join('');
  const closedSection = closedSprints.length ? `
    <button class="bl-sprint-closed-toggle" id="bl-sprint-closed-toggle" onclick="_blSprintToggleClosed()" type="button">
      <span class="bl-sprint-closed-toggle-label">Cerrados</span>
      <span class="bl-sprint-closed-toggle-count">${closedSprints.length}</span>
      <span class="bl-sprint-closed-toggle-arrow">▾</span>
    </button>
    <div class="bl-sprint-closed-list is-hidden" id="bl-sprint-closed-list">
      ${closedOptionsHtml}
    </div>` : '';

  return `<div class="bl-sprint-trigger" id="bl-sprint-trigger" onclick="_blSprintOpen()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')_blSprintOpen()">
    <span class="bl-sprint-trigger-label">Sprint</span>
    ${triggerNameHtml}
    ${progressHtml}
    <span class="bl-sprint-trigger-arrow">▾</span>
  </div>`;
}

// abrir dropdown del sprint selector
function _blSprintOpen() {
  const bar = document.getElementById('bl-sprint-bar');
  const trigger = document.getElementById('bl-sprint-trigger');
  if (!bar || !trigger) return;
  if (document.getElementById('bl-sprint-dropdown')) return; // ya abierto

  trigger.classList.add('is-open');

  // construir dropdown
  const allSprints = getActiveSprints() || [];
  const activeSprint = allSprints.find(s => s.status === 'active');
  const openSprints  = allSprints.filter(s => s.status !== 'closed' && s.status !== 'active');
  const closedSprints = allSprints.filter(s => s.status === 'closed');

  // B-202605-058: referencia a función de módulo _buildSprintOption — elimina duplicación
  const openOptionsHtml   = [activeSprint, ...openSprints].filter(Boolean).map(_buildSprintOption).join('');
  const closedOptionsHtml = closedSprints.map(_buildSprintOption).join('');
  const closedSection = closedSprints.length ? `
    <button class="bl-sprint-closed-toggle" id="bl-sprint-closed-toggle" onclick="_blSprintToggleClosed()" type="button">
      <span class="bl-sprint-closed-toggle-label">Cerrados</span>
      <span class="bl-sprint-closed-toggle-count">${closedSprints.length}</span>
      <span class="bl-sprint-closed-toggle-arrow">▾</span>
    </button>
    <div class="bl-sprint-closed-list is-hidden" id="bl-sprint-closed-list">
      ${closedOptionsHtml}
    </div>` : '';

  bar.insertAdjacentHTML('beforeend', `
    <div class="bl-sprint-dropdown" id="bl-sprint-dropdown">
      <div class="bl-sprint-list" id="bl-sprint-list">
        ${openOptionsHtml}
        ${closedSection}
      </div>
    </div>
    <div class="bl-sprint-overlay" id="bl-sprint-overlay" onclick="_blSprintClose()"></div>
  `);
}

// cerrar dropdown — con animación de salida
function _blSprintClose() {
  const dropdown = document.getElementById('bl-sprint-dropdown');
  const overlay  = document.getElementById('bl-sprint-overlay');
  const trigger  = document.getElementById('bl-sprint-trigger');
  if (trigger) trigger.classList.remove('is-open');
  if (overlay) overlay.remove();
  if (dropdown) {
    dropdown.classList.add('is-closing');
    dropdown.addEventListener('animationend', () => dropdown.remove(), { once: true });
  }
}

// seleccionar sprint — filtra la lista y cierra
function _blSprintSelect(sprintId) {
  _blSprintClose();
  roadmapGoToSprint(sprintId);
}

// toggle sección cerrados dentro del dropdown
function _blSprintToggleClosed() {
  const toggle = document.getElementById('bl-sprint-closed-toggle');
  const list   = document.getElementById('bl-sprint-closed-list');
  const arrow  = toggle ? toggle.querySelector('.bl-sprint-closed-toggle-arrow') : null;
  if (!list) return;
  const isOpen = !list.classList.contains('is-hidden');
  list.classList.toggle('is-hidden', isOpen);
  if (toggle) toggle.classList.toggle('is-open', !isOpen);
  if (arrow) arrow.textContent = isOpen ? '▾' : '▴';
}

// render/update del sprint selector en #bl-sprint-bar
function _renderSprintRoadmap() {
  const bar = document.getElementById('bl-sprint-bar');
  if (!bar) return;
  if (document.getElementById('bl-sprint-dropdown')) return;
  const prevClosedList = document.getElementById('bl-sprint-closed-list');
  const closedWasOpen = prevClosedList ? !prevClosedList.classList.contains('is-hidden') : false;
  const html = _buildSprintSelector();
  bar.innerHTML = html;
  if (closedWasOpen) {
    const newList   = document.getElementById('bl-sprint-closed-list');
    const newToggle = document.getElementById('bl-sprint-closed-toggle');
    const newArrow  = newToggle ? newToggle.querySelector('.bl-sprint-closed-toggle-arrow') : null;
    if (newList)   newList.classList.remove('is-hidden');
    if (newToggle) newToggle.classList.add('is-open');
    if (newArrow)  newArrow.textContent = '▴';
  }
}

// alias legacy — roadmapGoToSprint sigue funcionando igual

// R-202605-130: vista Planificación — layout dos columnas con drag & drop
function _renderPlanningView(listEl) {
  const activeSprint = _getActiveSprint();
  const allSprints   = getActiveSprints();
  // Determinar sprint destino: siguiente abierto no activo, o null si no hay
  const openSprints  = allSprints.filter(s => s.status === 'open' || s.status === 'active');
  // Sprint destino = primer sprint open (no active), o activo si no hay otro
  const targetSprint = allSprints.find(s => s.status === 'open' && s.id !== (activeSprint && activeSprint.id))
                    || activeSprint
                    || null;

  // Columna izquierda: ítems pendientes sin sprint (no done, no descartado, no historico)
  const unassigned = ITEMS.filter(i =>
    !i.sprint &&
    i.status !== 'done' &&
    i.status !== 'descartado' &&
    i.status !== 'historico'
  ).sort((a, b) => {
    const prioOrder = { high: 0, medium: 1, low: 2 };
    const pa = prioOrder[a.priority] ?? 1;
    const pb = prioOrder[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return (parseInt(b.effort) || 1) - (parseInt(a.effort) || 1);
  });

  // Columna derecha: ítems ya en el sprint destino (pendientes)
  const inTarget = targetSprint
    ? ITEMS.filter(i =>
        i.sprint === targetSprint.id &&
        i.status !== 'done' &&
        i.status !== 'descartado' &&
        i.status !== 'historico'
      )
    : [];

  // Calcular effort acumulado en sprint destino
  const targetEffort = inTarget.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);

  // Velocidad promedio — AC-6/AC-7: _calcEstimatedVelocity disponible
  const velocityData  = _calcEstimatedVelocity();
  const velocityAvg   = velocityData ? velocityData.avg : null;
  const isOverloaded  = velocityAvg !== null && targetEffort > velocityAvg * 1.3;
  const pct           = velocityAvg !== null && velocityAvg > 0
    ? Math.min(Math.round((targetEffort / velocityAvg) * 100), 999)
    : null;

  // Barra de esfuerzo acumulado
  const effortBarWidth = velocityAvg
    ? Math.min((targetEffort / (velocityAvg * 1.3)) * 100, 100)
    : 0;

  // Meter HTML
  const meterHtml = velocityAvg !== null ? `
    <div class="bl-plan-meter">
      <div class="bl-plan-meter-bar">
        <div class="bl-plan-meter-fill ${isOverloaded ? 'bl-plan-meter-fill--over' : ''}"
             style="--plan-meter-pct: ${effortBarWidth}%"></div>
        <div class="bl-plan-meter-threshold" title="Velocidad promedio (${velocityAvg} effort)"></div>
      </div>
      <span class="bl-plan-meter-label ${isOverloaded ? 'bl-plan-meter-label--over' : ''}">
        ${targetEffort} / ${velocityAvg} effort${pct !== null ? ` (${pct}%)` : ''}
        ${isOverloaded ? ' · ⚠ Sobrecarga' : ''}
      </span>
    </div>` : `
    <div class="bl-plan-meter">
      <span class="bl-plan-meter-label">Effort acumulado: <strong>${targetEffort}</strong> — sin velocidad histórica</span>
    </div>`;

  // Helper: card compacta de ítem
  function _planCard(item, draggable, col) {
    const type  = itemType(item.code) || '';
    const typeColors = { T: '#2ecc78', R: '#38bdf8', B: '#e85555', P: '#7c6af7' };
    const tc    = typeColors[type] || 'var(--hint)';
    const eff   = parseInt(item.effort) || 1;
    const dots  = Array.from({length: 3}, (_, i) =>
      `<span class="bl-plan-dot${i < eff ? ' on' : ''}"></span>`).join('');
    const prioClass = item.priority === 'high' ? 'bl-plan-prio--high' : item.priority === 'low' ? 'bl-plan-prio--low' : '';
    return `<div class="bl-plan-card${draggable ? ' bl-plan-card--draggable' : ''}"
         draggable="${draggable ? 'true' : 'false'}"
         data-code="${esc(item.code)}"
         data-col="${col}"
         style="--item-type-color:${tc}"
         ondragstart="_planDragStart(event)"
         ondragend="_planDragEnd(event)">
      <div class="bl-plan-card-header">
        <span class="bl-plan-card-type">${type}</span>
        <span class="bl-plan-card-code">${esc(item.code)}</span>
        ${prioClass ? `<span class="bl-plan-card-prio ${prioClass}">${item.priority === 'high' ? '↑' : '↓'}</span>` : ''}
        <span class="bl-plan-dots">${dots}</span>
      </div>
      <div class="bl-plan-card-title">${esc(item.title || '')}</div>
    </div>`;
  }

  // Construir columnas
  const leftCards  = unassigned.map(i => _planCard(i, true, 'left')).join('') ||
    `<div class="bl-plan-empty">Sin ítems sin sprint</div>`;
  const rightCards = inTarget.map(i => _planCard(i, false, 'right')).join('') ||
    `<div class="bl-plan-empty">Sprint vacío — arrastra ítems aquí</div>`;

  const targetLabel = targetSprint ? (targetSprint.label || targetSprint.id) : 'Sin sprint destino';

  listEl.innerHTML = `
    <div class="bl-planning-view" id="bl-planning-view">
      <div class="bl-plan-header">
        <div class="bl-plan-header-title">
          <span class="bl-plan-header-icon">📋</span>
          Planificación
        </div>
        <button class="bl-plan-close-btn" onclick="toggleBacklogPlanningMode()" title="Volver al backlog">✕ Cerrar planificación</button>
      </div>

      <div class="bl-plan-columns">
        <!-- Columna izquierda: sin sprint -->
        <div class="bl-plan-col bl-plan-col--left"
             id="bl-plan-col-left"
             ondragover="_planDragOver(event)"
             ondragleave="_planDragLeave(event)"
             ondrop="_planDrop(event,'left')">
          <div class="bl-plan-col-header">
            <span class="bl-plan-col-title">Sin sprint</span>
            <span class="bl-plan-col-count">${unassigned.length} ítems</span>
          </div>
          <div class="bl-plan-col-body" id="bl-plan-left-body">
            ${leftCards}
          </div>
        </div>

        <!-- Separador -->
        <div class="bl-plan-sep">
          <div class="bl-plan-sep-arrow">→</div>
        </div>

        <!-- Columna derecha: sprint destino -->
        <div class="bl-plan-col bl-plan-col--right ${!targetSprint ? 'bl-plan-col--disabled' : ''}"
             id="bl-plan-col-right"
             ondragover="_planDragOver(event)"
             ondragleave="_planDragLeave(event)"
             ondrop="_planDrop(event,'right')">
          <div class="bl-plan-col-header">
            <span class="bl-plan-col-title">${esc(targetLabel)}</span>
            <span class="bl-plan-col-count">${inTarget.length} ítems</span>
          </div>
          ${meterHtml}
          <div class="bl-plan-col-body" id="bl-plan-right-body">
            ${rightCards}
          </div>
        </div>
      </div>

      ${!targetSprint ? '<div class="bl-plan-no-sprint">No hay sprint destino disponible. Crea un sprint para empezar a planificar.</div>' : ''}
    </div>`;
}

// R-202605-130: drag & drop handlers para vista planificación
let _planDragCode = null;

function _planDragStart(e) {
  const card = e.currentTarget;
  _planDragCode = card.dataset.code;
  card.classList.add('bl-plan-card--dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function _planDragEnd(e) {
  e.currentTarget.classList.remove('bl-plan-card--dragging');
  document.querySelectorAll('.bl-plan-col').forEach(c => c.classList.remove('bl-plan-col--over'));
  _planDragCode = null;
}

function _planDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const col = e.currentTarget;
  col.classList.add('bl-plan-col--over');
}

function _planDragLeave(e) {
  e.currentTarget.classList.remove('bl-plan-col--over');
}

function _planDrop(e, targetCol) {
  e.preventDefault();
  e.currentTarget.classList.remove('bl-plan-col--over');
  if (!_planDragCode) return;

  const item = ITEMS.find(i => i.code === _planDragCode);
  if (!item) return;

  if (targetCol === 'right') {
    // Asignar al sprint destino
    const allSprints  = getActiveSprints();
    const activeSprint = _getActiveSprint();
    const targetSprint = allSprints.find(s => s.status === 'open' && s.id !== (activeSprint && activeSprint.id))
                      || activeSprint
                      || null;
    if (!targetSprint) return;
    if (item.sprint === targetSprint.id) return; // ya está asignado
    setItemSprint(item.code, targetSprint.id);
    // setItemSprint llama renderBacklogList() → dispatch a _renderPlanningView automático
  } else if (targetCol === 'left') {
    // Desasignar del sprint (solo si venía de la derecha)
    if (!item.sprint) return;
    setItemSprint(item.code, '');
    // setItemSprint llama renderBacklogList() → dispatch a _renderPlanningView automático
  }
}

function renderBacklogList() {
  const listEl = document.getElementById('backlog-list');
  _skelShow(listEl, 5);
  const q = backlogSearchQuery;

  // R-[tmp:toolbar-backlog-redesign]: botones de vista ya son estáticos en HTML — solo actualizar estado
  (function _updateViewBtns() {
    const treeBtn   = document.getElementById('fbar-tree-btn');
    const focusBtn  = document.getElementById('fbar-focus-btn');
    const kanbanBtn = document.getElementById('fbar-kanban-btn');
    const mikeBtn   = document.getElementById('fbar-mike-btn');

    if (treeBtn) {
      treeBtn.classList.toggle('active', _backlogTreeMode);
      treeBtn.textContent = _backlogTreeMode ? '⊞ Árbol' : '☰ Plano';
      treeBtn.title = _backlogTreeMode ? 'Vista árbol activa — click para vista plana' : 'Vista plana activa — click para vista árbol';
    }
    if (kanbanBtn) {
      kanbanBtn.classList.toggle('active', _backlogKanbanMode);
      kanbanBtn.title = _backlogKanbanMode ? 'Vista Kanban activa — click para desactivar' : 'Vista Kanban — columnas por status';
    }
    if (focusBtn) {
      focusBtn.classList.toggle('active', _backlogFocusMode);
      focusBtn.title = _backlogFocusMode
        ? 'Focus activo — Top 10 por: tipo · sprint · effort · antigüedad · click para desactivar'
        : 'Activar Focus — Top 10 por: tipo · sprint · effort · antigüedad';
      if (!_backlogFocusMode) focusBtn.textContent = '🎯 Focus';
    }
    // Mi vista — visible solo con sprint activo + roles disponibles
    if (mikeBtn) {
      const activeSprint = _getActiveSprint();
      const miRoles = _getMiViewRoles();
      const show = !!(activeSprint && miRoles.length);
      mikeBtn.classList.toggle('is-hidden', !show);
      if (show) {
        mikeBtn.classList.toggle('active', _backlogMikeMode);
        mikeBtn.textContent = _backlogMikeMode ? _getMiViewLabel() : 'Mi vista';
      }
    }
    // R-202605-130: inyectar botón Planificación si no existe aún
    const viewsDiv = document.querySelector('.bl-toolbar-views');
    if (viewsDiv && !document.getElementById('fbar-planning-btn')) {
      const planningBtn = document.createElement('button');
      planningBtn.className = 'bl-toolbar-view-btn';
      planningBtn.id = 'fbar-planning-btn';
      planningBtn.title = 'Vista Planificación — asignar ítems al siguiente sprint';
      planningBtn.textContent = '📅 Planificar';
      planningBtn.onclick = toggleBacklogPlanningMode;
      viewsDiv.appendChild(planningBtn);
    }
    // Sin AC y bloqueados
    const noAcBtn = document.getElementById('fbar-no-ac-btn');
    if (noAcBtn) noAcBtn.classList.toggle('active', _backlogNoAcMode);
    const blockerBtn = document.getElementById('fbar-blocker-btn');
    if (blockerBtn) blockerBtn.classList.toggle('active', _backlogBlockerFilter);
    // R-[tmp:sprint-group-toggle]: botón agrupación por sprint
    const sprintBtn = document.getElementById('fbar-sprint-btn');
    if (sprintBtn) {
      sprintBtn.classList.toggle('active', _backlogSprintGroupMode);
      sprintBtn.title = _backlogSprintGroupMode ? 'Agrupación por sprint activa — click para vista plana' : 'Vista plana activa — click para agrupar por sprint';
    }
    // R-202605-130: botón planificación (inyectado via JS)
    const planBtn = document.getElementById('fbar-planning-btn');
    if (planBtn) planBtn.classList.toggle('active', _backlogPlanningMode);
  })();

  // Guard: backlog requiere proyecto activo
  if (!_getActiveProjectFilter()) {
    const hasProjects = (state.projects || []).length > 0;
    if (!hasProjects) {
      // R-202605-178: global empty — ningún proyecto creado → secuencia de primeros pasos
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🗂</div>
          <div class="empty-state-title">Crea tu primer proyecto para empezar</div>
          <div class="empty-state-hint">Sigue estos pasos para tener tu primer ítem en el backlog:</div>
          <ol class="empty-state-steps">
            <li><strong>Crea un proyecto</strong> en el tab Proyectos</li>
            <li><strong>Abre un sprint</strong> desde el Backlog</li>
            <li><strong>Registra tu primera sesión</strong> en el Tracker</li>
          </ol>
          <button class="empty-state-btn" onclick="if(typeof switchTab==='function')switchTab('proyectos')">Ir a Proyectos</button>
        </div>`;
    } else {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">Selecciona un proyecto</div>
          <div class="empty-state-hint">El backlog está vinculado a un proyecto. Selecciona uno para ver y gestionar sus ítems.</div>
          <button class="empty-state-btn" onclick="openProjPanel()">📁 Seleccionar proyecto</button>
        </div>`;
    }
    _skelHide(listEl);
    return;
  }

  if (!ITEMS.length) {
    // B-202605-062: diferenciar backlog vacío real vs proyecto sin datos en localStorage
    const _activeFilter = _getActiveProjectFilter();
    const _projKey = _activeFilter ? 'backlog-items-' + _activeFilter : null;
    const _hasStoredData = _projKey ? !!localStorage.getItem(_projKey) : false;
    if (_activeFilter && !_hasStoredData) {
      // Proyecto seleccionado pero sin datos en localStorage
      listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <div class="empty-state-title">Este proyecto no tiene ítems aún</div>
        <div class="empty-state-hint">Selecciona otro proyecto o empieza a registrar sesiones para ver ítems aquí.</div>
        <button class="empty-state-btn" onclick="openProjPanel()">Cambiar proyecto</button>
      </div>`;
      _skelHide(listEl);
      return;
    }
    // R-202605-178: backlog vacío — diferenciar sprint activo vs sin sprint
    const _activeSprint178 = _getActiveSprint();
    if (_activeSprint178) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">Registra tu primera sesión para ver ítems aquí</div>
          <div class="empty-state-hint">Tienes un sprint activo. Ve al Tracker, abre una sesión con tu IA y guarda el resultado.</div>
          <button class="empty-state-btn" onclick="if(typeof switchTab==='function')switchTab('tracker')">Ir al Tracker</button>
        </div>`;
    } else {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">Abre un sprint para empezar</div>
          <div class="empty-state-hint">El backlog necesita un sprint activo. Abre uno para organizar y ejecutar tu trabajo.</div>
          <button class="empty-state-btn" onclick="openNewSprintInline()">＋ Abrir sprint</button>
        </div>`;
    }
    _skelHide(listEl);
    return;
  }

  // R-202605-130: desviar a vista Planificación si está activa
  if (_backlogPlanningMode) {
    _renderPlanningView(listEl);
    _updateDocLogCount('backlog');
    _skelHide(listEl);
    return;
  }

  // T-202604-287: desviar a vista Kanban si está activa
  if (_backlogKanbanMode) {
    _renderKanban(listEl);
    _updateDocLogCount('backlog');
    _skelHide(listEl);
    return;
  }

  // T-202604-245: inyectar/actualizar barra de chips de rol
  (function _ensureRoleBar() {
    const filterBar = document.getElementById('filter-bar-status'); // bl-filter-strip
    if (!filterBar) return;
    const existing = document.getElementById('frole-bar');
    const newHtml = _buildRoleChips();
    if (!newHtml) { if (existing) existing.remove(); return; }
    if (existing) { existing.outerHTML = newHtml; } else { filterBar.insertAdjacentHTML('afterend', newHtml); }
  })();

  // T-202604-260: inyectar/actualizar panel salud del sprint activo
  (function _ensureSprintHealthPanel() {
    const existing = document.getElementById('sprint-health-panel');
    const html = _buildSprintHealthPanel();
    if (!html) { if (existing) existing.remove(); return; }
    if (existing) { existing.outerHTML = html; } else { listEl.insertAdjacentHTML('beforebegin', html); }
    // B-202604-161: si el Item Detail Panel está abierto, mantener oculto el nodo recién creado
    if (_itemPanelCode) {
      const el = document.getElementById('sprint-health-panel');
      if (el) el.classList.add('is-hidden');
    }
  })();

  // R-[tmp:toolbar-backlog-redesign]: sprint selector en #bl-sprint-bar (Capa 3)
  (function _ensureSprintRoadmap() {
    _renderSprintRoadmap();
    // B-202604-161: si el Item Detail Panel está abierto, mantener oculto
    if (_itemPanelCode) {
      const el = document.getElementById('bl-sprint-bar');
      if (el) el.classList.add('is-hidden');
    }
  })();

  // Filtrado por tipo + status + effort (T-071)
  // T-202604-048/187: excluir T/B con parentId en modo árbol — en modo plano se muestran todos
  // B-202604-193: excluir ítems históricos del plano activo — van a sección colapsada al fondo
  let filtered = ITEMS.filter(i => {
    if (i.status === 'historico') return false;
    const type = itemType(i.code);
    const typeOk = type ? activeTypes.has(type) : true;
    const statusOk = activeStatuses.has(i.status);
    const _rawEffort = parseInt(i.effort) || 1;
    const _normEffort = _rawEffort > 3 ? 3 : _rawEffort < 1 ? 1 : _rawEffort;
    const effortOk = activeEfforts.has(_normEffort); // T-071 · B-202605-233: effort >3 normalizado a 3
    // T-202604-245: filtro de rol
    let roleOk = true;
    if (activeRoleFilter === '__none__') {
      roleOk = !i.role || !i.role.trim();
    } else if (activeRoleFilter !== null) {
      roleOk = (i.role || '').trim() === activeRoleFilter;
    }
    const isChild = !!i.parentId; // en modo árbol, hijos aparecen bajo su R padre
    // T-202604-357: filtro por prioridad — vacío = todos
    let priorityOk = true;
    if (activePriorityFilter.size > 0) {
      const p = i.priority || 'medium';
      const isHigh = p === 'high' || p === 'important' || p === 'critical' || p === 'importante';
      const isLow  = p === 'low' || p === 'futura' || p === 'baja';
      if (activePriorityFilter.has('high') && isHigh) priorityOk = true;
      else if (activePriorityFilter.has('low') && isLow) priorityOk = true;
      else if (activePriorityFilter.has('medium') && !isHigh && !isLow) priorityOk = true;
      else priorityOk = false;
    }
    return typeOk && statusOk && effortOk && roleOk && priorityOk && (_backlogTreeMode ? !isChild : true);
  });

  // T-202604-363: Sin AC — solo pendientes sin criterios de aceptación
  if (_backlogNoAcMode) {
    filtered = filtered.filter(i => i.status === 'pendiente' && (!i.ac || !i.ac.length));
  }

  // R-[tmp:toolbar-backlog-redesign]: solo bloqueados — pendiente con sprint asignado sin cambio >14 días
  if (_backlogBlockerFilter) {
    filtered = filtered.filter(i => _isBlocked(i));
  }

  // T-202605-449: filtro por dependencias explícitas bloqueantes
  if (_depsFilter === 1) {
    filtered = filtered.filter(i => _hasDepsBlocked(i));
  } else if (_depsFilter === 2) {
    filtered = filtered.filter(i => !_hasDepsBlocked(i) && i.status === 'pendiente');
  }

  if (q) {
    filtered = filtered.filter(i =>
      i.code.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      (i.area || '').toLowerCase().includes(q)
    );
  }

  updateClearFilterBtn();

  // R-202605-165: Focus mode — Top-10 sprint-aware con .blf-hidden + aria-hidden (CSS collapse 150ms)
  // AC: sprint activo + high→medium primero · sin sprint activo: score global · ≤10 = todos visibles
  // AC: NO filtra filtered — aplica _blfHidden en ítems fuera del Top-10 → buildBacklogItem añade clase
  filtered.forEach(item => { delete item._blfHidden; delete item._focusRank; });
  if (_backlogFocusMode) {
    const pendienteFiltered = filtered.filter(i => i.status === 'pendiente');
    const _focusActiveSprint = _getActiveSprint();
    let sorted;
    if (_focusActiveSprint) {
      // Sprint activo: high→medium en sprint activo primero, luego resto por score
      const _priVal = p => { const v = p || 'medium'; return (v === 'high' || v === 'important' || v === 'critical' || v === 'importante') ? 0 : (v === 'medium') ? 1 : 2; };
      const inSprint  = pendienteFiltered.filter(i => (i.sprint || '').trim() === _focusActiveSprint.id && _priVal(i.priority) <= 1);
      const outSprint = pendienteFiltered.filter(i => !((i.sprint || '').trim() === _focusActiveSprint.id && _priVal(i.priority) <= 1));
      inSprint.sort((a, b) => _priVal(a.priority) - _priVal(b.priority) || (b._score || 0) - (a._score || 0));
      outSprint.sort((a, b) => (b._score || 0) - (a._score || 0));
      sorted = [...inSprint, ...outSprint];
    } else {
      sorted = [...pendienteFiltered].sort((a, b) => (b._score || 0) - (a._score || 0));
    }
    const showAll = sorted.length <= 10;
    const top10Codes = new Set(sorted.slice(0, 10).map(i => i.code));
    // Estampar rank y flag oculto — buildBacklogItem aplica .blf-hidden + aria-hidden
    sorted.slice(0, 10).forEach((item, idx) => { item._focusRank = idx + 1; });
    filtered.forEach(item => {
      if (item.status !== 'pendiente' || !top10Codes.has(item.code)) item._blfHidden = true;
    });
    // AC: label dinámico en botón con conteo real
    const focusBtn = document.getElementById('fbar-focus-btn');
    if (focusBtn) {
      const visibleCount = Math.min(sorted.length, 10);
      focusBtn.textContent = `🎯 Focus (${showAll ? 'todos' : visibleCount})`;
    }
  }

  // T-202604-313/366: Mi vista — T's pendientes del rol activo en sprint activo
  if (_backlogMikeMode) {
    const _activeSprint = _getActiveSprint();
    if (_activeSprint) {
      const _miRoles = _getMiViewRoles();
      const _miRole = _miRoles[_miViewRoleIndex % _miRoles.length] || null;
      filtered = filtered.filter(i =>
        itemType(i.code) === 'T' &&
        i.status === 'pendiente' &&
        i.sprint === _activeSprint.id &&
        (!_miRole || (i.role || '').trim() === _miRole)
      );
    }
  }

  // T-202604-065: sort dentro de cada grupo — T-072: respeta backlogSortDir
  const _priOrder = { high: 0, important: 0, critical: 0, importante: 0, medium: 1, low: 2, futura: 2, baja: 2 };
  const _typeOrder = { B: 0, T: 1, R: 2, I: 3 };
  const _dir = backlogSortDir === 'desc' ? -1 : 1;

  // T-202604-424: sort interno dentro de cada grupo de sprint — priority desc → effort asc
  // B-[pendiente-ID]: aplicar _dir para respetar backlogSortDir — el botón ↑↓ ahora funciona en modo sprint group
  function _sortGroup(arr) {
    return [...arr].sort((a, b) => {
      const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
      if (pa !== pb) return (pa - pb) * _dir;
      const ea = parseInt(a.effort) || 1, eb = parseInt(b.effort) || 1;
      if (ea !== eb) return (ea - eb) * _dir;
      return a.code.localeCompare(b.code) * _dir;
    });
  }

  function _sortItems(arr) {
    return [...arr].sort((a, b) => {
      let cmp = 0;
      if (backlogSortMode === 'priority') {
        const pa = _priOrder[a.priority] ?? 1, pb = _priOrder[b.priority] ?? 1;
        cmp = pa !== pb ? pa - pb : a.code.localeCompare(b.code);
      } else if (backlogSortMode === 'effort') {
        const ea = parseInt(a.effort) || 1, eb = parseInt(b.effort) || 1;
        cmp = ea !== eb ? eb - ea : a.code.localeCompare(b.code);
      } else if (backlogSortMode === 'type') {
        const ta = _typeOrder[itemType(a.code)] ?? 9, tb = _typeOrder[itemType(b.code)] ?? 9;
        cmp = ta !== tb ? ta - tb : a.code.localeCompare(b.code);
      } else if (backlogSortMode === 'completedAt') {
        // Ítems sin doneAt van al final (independiente de dir)
        const ha = a.doneAt != null, hb = b.doneAt != null;
        if (ha !== hb) return ha ? -1 : 1; // los que tienen fecha primero
        cmp = ha && hb ? (a.doneAt - b.doneAt) : a.code.localeCompare(b.code);
      } else if (backlogSortMode === 'createdAt') {
        // Ítems sin createdAt van al final (independiente de dir)
        const ha = a.createdAt != null, hb = b.createdAt != null;
        if (ha !== hb) return ha ? -1 : 1;
        cmp = ha && hb ? (a.createdAt - b.createdAt) : a.code.localeCompare(b.code);
      } else {
        cmp = a.code.localeCompare(b.code);
      }
      return cmp * _dir;
    });
  }

  // T-202604-061: separar done/descartado del resto
  // T-202604-082: modo sprint = agrupado por sprint; otros modos = lista plana
  // B-202604-131: aplicar filtro de búsqueda a done/descartado cuando q está activo
  // R-202604-091: 'en curso' fusionado — todos los pendiente van juntos, decorador visual separa activos
  // T-202604-427: P (ideas) separadas del flujo de trabajo activo — sección propia al final
  const ideaItems      = filtered.filter(i => i.status !== 'done' && i.status !== 'descartado' && itemType(i.code) === 'P');
  const pendienteItems = filtered.filter(i => i.status !== 'done' && i.status !== 'descartado' && itemType(i.code) !== 'P');
  const _matchesQuery = q
    ? (i => i.code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || (i.area || '').toLowerCase().includes(q))
    : () => true;
  const doneItems      = activeStatuses.has('done')
    ? ITEMS.filter(i => i.status === 'done' && _isCountableItem(i) && _matchesQuery(i))
    : [];
  const descartadoItems = activeStatuses.has('descartado')
    ? ITEMS.filter(i => i.status === 'descartado' && _matchesQuery(i))
    : [];

  let html = '';

  // B-202605-206: agrupación por sprint es el comportamiento por defecto.
  // T-202604-424 eliminó 'sprint' como opción del selector de sort, pero la condición de entrada
  // quedó atada a backlogSortMode === 'sprint' — inalcanzable. Fix: agrupar siempre que no haya
  // un modo exclusivo activo que tome control del rendering (kanban, focus, mike, noAc).
  const _useSprintGroups = _backlogSprintGroupMode && !_backlogKanbanMode && !_backlogFocusMode && !_backlogMikeMode && !_backlogNoAcMode;

  if (_useSprintGroups) {
    // ── Modo Sprint: agrupar pendientes por sprint ──
    const sprintMap = {};
    pendienteItems.forEach(i => {
      const s = (i.sprint || '').trim();
      const key = s || '__sin_asignar__';
      if (!sprintMap[key]) sprintMap[key] = [];
      sprintMap[key].push(i);
    });

    // P-202604-097: orden visual — activos primero, luego abiertos por número, sin asignar al final
    const sprintKeys = Object.keys(sprintMap)
      .filter(k => k !== '__sin_asignar__')
      .sort((a, b) => {
        const sa = _getSprintById(a), sb = _getSprintById(b);
        const rankA = sa?.status === 'active' ? 0 : sa?.status === 'closed' ? 2 : 1;
        const rankB = sb?.status === 'active' ? 0 : sb?.status === 'closed' ? 2 : 1;
        if (rankA !== rankB) return rankA - rankB;
        const na = parseInt(a.replace(/\D/g, '')) || 0;
        const nb = parseInt(b.replace(/\D/g, '')) || 0;
        return na - nb;
      });
    if (sprintMap['__sin_asignar__']) sprintKeys.push('__sin_asignar__');

    // B-202605-XXX: sprints abiertos sin pendientes — renderizar header con botón cerrar
    // aunque no aparezcan en sprintMap (todos sus ítems están done)
    const _allOpenSprints = getActiveSprints().filter(s => s.status !== 'closed');
    _allOpenSprints.forEach(s => {
      if (sprintMap[s.id]) return; // ya está en el mapa, se procesa abajo
      const hasAnyItem = ITEMS.some(i => (i.sprint || '').trim() === s.id); // hasAnyItem: verifica cualquier ítem en el sprint, no solo done
      if (!hasAnyItem) return; // sprint vacío — ignorar
      const isClosed = s.status === 'closed'; // B-fix: no hardcodear false — usar status real del sprint
      if (isClosed) return; // sprint cerrado — no renderizar en este bloque, aparece en cerrados
      const isActive = s.status === 'active';
      const groupId = s.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const doneInGroup = ITEMS.filter(i => (i.sprint || '').trim() === s.id && i.status === 'done').length;
      const totalInGroup = ITEMS.filter(i => (i.sprint || '').trim() === s.id).length;
      const pct = totalInGroup > 0 ? Math.round((doneInGroup / totalInGroup) * 100) : 0;
      const progressBar = `<div class="version-progress-inline">
          <div class="version-progress-bar-wrap"><div class="version-progress-bar" style="--ver-bar-w:${pct}%"></div></div>
          <span class="version-progress-label">${doneInGroup}/${totalInGroup} · ${pct}%</span>
        </div>`;
      // T-202605-456: ★ eliminado del version-tag — estado activo lo comunica sprint-badge-active
      const sprintBadge = '';
      const sprintStatusLabel = isActive ? `<span class="sprint-badge-active" class="sprint-badge-ml">activo</span>` : '';
      const sprintActions = `
        <div class="sprint-actions" onclick="event.stopPropagation()">
          ${!isActive ? `<button class="sprint-action-btn sprint-action-activate" onclick="setSprintStatus('${esc(s.id)}','active')" title="Marcar como activo">activar</button>` : ''}
          ${isActive ? `<button class="sprint-action-btn" onclick="setSprintStatus('${esc(s.id)}','open')" title="Quitar estado activo">desactivar</button>` : ''}
          <button class="sprint-action-btn sprint-action-close" onclick="confirmCloseSprint('${esc(s.id)}')" title="Cerrar sprint">cerrar</button>
        </div>`;
      const _sprintAllItems = ITEMS.filter(i => (i.sprint || '').trim() === s.id);
      const _sprintPills = _statusPills(_sprintAllItems);
      html += `<div class="version-group${isActive ? ' sprint-group-active' : ''}">
        <div onclick="toggleVersionCollapse('${groupId}')" class="version-collapse-trigger">
          <div class="version-header">
            <span id="sprint-label-wrap-${esc(s.id)}"><span class="version-tag">${esc(s.id)}${sprintBadge}</span>${(s.label && s.label !== s.id) ? `<span class="sprint-name-label">${esc(s.label.replace(/^[A-Za-z]+[-\s]S\d+\s*·?\s*/i, ''))}</span>` : ''}</span>${sprintStatusLabel}
            ${progressBar}
            ${_sprintPills ? `<span class="sprint-pills-secondary">${_sprintPills}</span>` : ''}
            ${sprintActions}
            <span class="version-collapse-arrow" id="varrow-${groupId}">▸</span>
          </div>
        </div>
        <div class="version-group-body items-grid collapsed" id="vbody-${groupId}"></div>
      </div>`;
    });

    sprintKeys.forEach(key => {
      const group = sprintMap[key];
      if (!group || !group.length) return;
      const isSinAsignar = key === '__sin_asignar__';
      const sprintObj = isSinAsignar ? null : _getSprintById(key);
      const label = isSinAsignar ? 'Sin asignar' : (sprintObj ? sprintObj.label : key);
      const groupId = isSinAsignar ? 'sin-asignar' : key.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const isCollapsed = collapsedVersions.has(groupId);
      const doneInGroup = ITEMS.filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key) && i.status === 'done').length;
      const totalInGroup = ITEMS.filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key)).length;
      const pct = totalInGroup > 0 ? Math.round((doneInGroup / totalInGroup) * 100) : 0;

      const isActive = sprintObj && sprintObj.status === 'active';
      const isClosed = sprintObj && sprintObj.status === 'closed';

      const progressBar = isSinAsignar ? '' : `<div class="version-progress-inline">
          <div class="version-progress-bar-wrap"><div class="version-progress-bar" style="--ver-bar-w:${pct}%"></div></div>
          <span class="version-progress-label">${doneInGroup}/${totalInGroup} · ${pct}%</span>
        </div>`;

      // T-202605-456: ★ eliminado del version-tag activo — estado lo comunica sprint-badge-active, formato unificado con cerrados
      const sprintBadge = isClosed ? ' ·' : '';
      const sprintStatusLabel = isActive
        ? `<span class="sprint-badge-active" class="sprint-badge-ml">activo</span>`
        : isClosed
          ? `<span class="sprint-badge-closed" class="sprint-badge-ml">cerrado</span>`
          : '';

      const sprintActions = isSinAsignar ? '' : `
        <div class="sprint-actions" onclick="event.stopPropagation()">
          ${!sprintObj ? `<button class="sprint-action-btn" onclick="createSprintFromGroup('${esc(key)}')" title="Registrar sprint en catálogo">+ registrar</button>` : ''}
          
          ${sprintObj && !isActive && !isClosed ? `<button class="sprint-action-btn sprint-action-activate" onclick="setSprintStatus('${esc(key)}','active')" title="Marcar como activo">activar</button>` : ''}
          ${sprintObj && isActive ? `<button class="sprint-action-btn" onclick="setSprintStatus('${esc(key)}','open')" title="Quitar estado activo">desactivar</button>` : ''}
          ${sprintObj && !isClosed ? `<button class="sprint-action-btn sprint-action-close" onclick="confirmCloseSprint('${esc(key)}')" title="Cerrar sprint">cerrar</button>` : ''}
          ${sprintObj && isClosed ? `<button class="sprint-action-btn" onclick="setSprintStatus('${esc(key)}','open')" title="Reabrir sprint">reabrir</button>` : ''}
          ${sprintObj && isClosed && sprintObj.retroDoc ? `<button class="sprint-action-btn sprint-action-retro" onclick="openSprintRetroView('${esc(key)}')" title="Ver retrospectiva">retro</button>` : ''}
        </div>`;

      const _sprintAllItems = ITEMS.filter(i => (i.sprint || '').trim() === (isSinAsignar ? '' : key));
      const _pendCount  = group.length;
      const _doneCount  = _sprintAllItems.filter(i => i.status === 'done').length;
      const _descCount  = _sprintAllItems.filter(i => i.status === 'descartado').length;
      const _pendPill   = _pendCount  ? `<span class="status-pill status-pill--pendiente">${_pendCount} pend.</span>` : '';
      const _donePill   = _doneCount  ? `<span class="status-pill status-pill--done">${_doneCount} done</span>` : '';
      const _descPill   = _descCount  ? `<span class="status-pill status-pill--descartado">${_descCount} desc.</span>` : '';
      html += `<div class="version-group${isActive ? ' sprint-group-active' : ''}${isClosed ? ' sprint-group-closed' : ''}">
        <div onclick="toggleVersionCollapse('${groupId}')" class="version-collapse-trigger">
          <div class="version-header">
            ${!isSinAsignar ? `<span id="sprint-label-wrap-${esc(key)}"${sprintObj && !isClosed ? ` ondblclick="event.stopPropagation();editSprintInline('${esc(key)}')" title="Doble click para editar"` : ''}><span class="version-tag">${esc(key)}${sprintBadge}</span>${(label && label !== key) ? `<span class="sprint-name-label">${esc(label.replace(/^[A-Za-z]+[-\s]S\d+\s*[·]?\s*/i, ''))}</span>` : ''}</span>${sprintStatusLabel}` : ''}
            ${_pendPill}
            ${isSinAsignar ? `<span class="version-label">Sin asignar</span>` : ''}
            ${progressBar}
            ${(_donePill || _descPill) ? `<span class="sprint-pills-secondary">${_donePill}${_descPill}</span>` : ''}
            ${sprintActions}
            <span class="version-collapse-arrow" id="varrow-${groupId}">${isCollapsed ? '▸' : '▾'}</span>
          </div>
        </div>
        <div class="version-group-body items-grid${isCollapsed ? ' collapsed' : ''}" id="vbody-${groupId}">`;
      _sortGroup(group).forEach(item => { html += buildBacklogItem(item); }); // T-202604-424: sort interno priority desc → effort asc
      html += `</div></div>`;
    });

    // R-202605-103: bloque sprints cerrados eliminado — absorbido por renderArchivoHistorico

  } else {
    // ── Modo plano: lista sin grupos de sprint ──

    // R-202604-051: sección Bloqueantes activos — sobre En curso y Pendientes
    const blockingItems = pendienteItems.filter(i => i.blocking);
    if (blockingItems.length && activeStatuses.has('pendiente')) {
      html += `<div class="section-group section-group--blocking" id="sg-blocking">
        <div class="section-group-header section-group-header--blocking">
          <span class="section-group-icon">⚠</span>
          <span>Bloqueantes activos</span>
          <span class="section-group-count">${blockingItems.length} ítem${blockingItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="items-grid" id="sgbody-blocking">`;
      _sortItems(blockingItems).forEach(item => { html += buildBacklogItem(item); });
      html += `</div></div>`;
    }

    const flatItems = _sortItems(pendienteItems);
    const _flatPills = _statusPills(pendienteItems);
    if (_flatPills) {
      html += `<div class="version-group-header">
        <span>${flatItems.length} ítem${flatItems.length !== 1 ? 's' : ''}</span>
        ${_flatPills}
      </div>`;
    }
    html += `<div class="items-grid" id="vbody-flat">`;
    flatItems.forEach(item => { html += buildBacklogItem(item); });
    html += `</div>`;
  }

  // T-202604-427: Ideas (P) — sección diferenciada, colapsada por defecto, antes de done
  if (ideaItems.length && activeTypes.has('P')) {
    const ideasOpen = localStorage.getItem('backlog-ideas-open') === '1';
    html += `<div class="section-group sg-ideas" id="sg-ideas">
      <div class="section-group-header" onclick="toggleSectionGroup('ideas')">
        <span class="section-group-arrow" id="sgarrow-ideas">${ideasOpen ? '▾' : '▸'}</span>
        <span>💡 Posibilidades</span>
        <span class="section-group-count">${ideaItems.length} ítem${ideaItems.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="section-group-body items-grid${ideasOpen ? '' : ' collapsed'}" id="sgbody-ideas">`;
    _sortItems(ideaItems).forEach(item => { html += buildBacklogItem(item); });
    html += `</div></div>`;
  }

  // Done al fondo — T-202604-356: colapsado por default (mismo comportamiento que descartados)
  if (doneItems.length) {
    const doneOpen = localStorage.getItem('backlog-done-open') === '1';
    html += `<div class="section-group" id="sg-done">
      <div class="section-group-header" onclick="toggleSectionGroup('done')">
        <span class="section-group-arrow" id="sgarrow-done">${doneOpen ? '▾' : '▸'}</span>
        <span>Completados</span>
        <span class="section-group-count">${doneItems.length} ítem${doneItems.length !== 1 ? 's' : ''}</span>
        <span class="sprint-pills-wrap">${_statusPills(doneItems)}</span>
      </div>
      <div class="section-group-body items-grid${doneOpen ? '' : ' collapsed'}" id="sgbody-done">`;
    _sortItems(doneItems).forEach(item => { html += buildBacklogItem(item); });
    html += `</div></div>`;
  }

  // T-202604-059: Descartados — colapsados por defecto, visibles solo si filtro activo
  if (descartadoItems.length && activeStatuses.has('descartado')) {
    const discOpen = localStorage.getItem('backlog-discarded-open') === '1';
    html += `<div class="section-group sg-discarded" id="sg-discarded">
      <div class="section-group-header" onclick="toggleSectionGroup('discarded')">
        <span class="section-group-arrow" id="sgarrow-discarded">${discOpen ? '▾' : '▸'}</span>
        <span>Descartados</span>
        <span class="section-group-count">${descartadoItems.length} ítem${descartadoItems.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="section-group-body items-grid${discOpen ? '' : ' collapsed'}" id="sgbody-discarded">`;
    descartadoItems.forEach(item => { html += buildBacklogItem(item); });
    html += `</div></div>`;
  }

  // B-202604-NNN: evaluar empty state sobre pendientes+done+descartados — no solo filtered (pendientes)
  const _hasVisible = pendienteItems.length || ideaItems.length || doneItems.length || (descartadoItems.length && activeStatuses.has('descartado'));
  if (!_hasVisible) {
    // T-202604-319: empty state contextual según causa
    const _activeSprint = _getActiveSprint();
    const _hasTypeFilter  = activeTypes.size < 4;
    const _hasRoleFilter  = activeRoleFilter !== null;
    const _hasStatusFilter = !(activeStatuses.has('pendiente') && activeStatuses.size === 1);
    const _hasEffortFilter = activeEfforts.size < 3;
    const _hasAnyFilter = q || _hasTypeFilter || _hasRoleFilter || _hasStatusFilter || _hasEffortFilter || _backlogFocusMode || _backlogMikeMode;

    let emptyIcon = '🔍', emptyTitle = '', emptyHint = '', emptyCTA = '';

    if (q) {
      emptyTitle = `Sin resultados para "${esc(q)}"`;
      emptyHint  = 'Prueba con otro término o limpia la búsqueda.';
      emptyCTA   = `<button class="empty-state-btn" onclick="document.getElementById('backlog-search').value='';onBacklogSearch()">✕ Limpiar búsqueda</button>`;
    } else if (_backlogMikeMode && _activeSprint) {
      const _miRoles = _getMiViewRoles();
      const _miRole = _miRoles[_miViewRoleIndex % _miRoles.length] || 'este rol';
      emptyIcon  = '⚡';
      emptyTitle = `Sin T's pendientes para ${_miRole} en ${_activeSprint.label || _activeSprint.id}`;
      emptyHint  = 'No hay tickets pendientes asignados a este rol en el sprint activo. Rota al siguiente rol o desactiva Mi vista.';
      emptyCTA   = `<button class="empty-state-btn" onclick="toggleBacklogMikeMode()">↻ Rotar rol / desactivar</button>`;
    } else if (_backlogFocusMode) {
      emptyIcon  = '🎯';
      emptyTitle = 'Sin ítems en Focus';
      emptyHint  = 'No hay ítems pendientes con los filtros actuales.';
      emptyCTA   = `<button class="empty-state-btn" onclick="toggleBacklogFocusMode()">✕ Desactivar Focus</button>`;
    } else if (backlogSortMode === 'sprint' && _activeSprint) {
      emptyIcon  = '📅';
      emptyTitle = `Sin ítems en ${_activeSprint.label || _activeSprint.id}`;
      emptyHint  = 'El sprint activo no tiene ítems con los filtros actuales. Asigna ítems desde el editor o cambia el sprint.';
      emptyCTA   = `<button class="empty-state-btn" onclick="setFilter('all')">Ver todos los ítems</button>`;
    } else if (_hasAnyFilter) {
      emptyTitle = 'Sin ítems con estos filtros';
      emptyHint  = 'Los filtros activos no coinciden con ningún ítem. Limpia los filtros para ver el backlog completo.';
      emptyCTA   = `<button class="empty-state-btn" onclick="document.getElementById('filter-clear-btn').click()">✕ Limpiar filtros</button>`;
    } else {
      emptyIcon  = '📋';
      emptyTitle = 'Sin ítems que mostrar';
      emptyHint  = 'No hay ítems en el backlog con el estado actual.';
    }

    html = `<div class="empty-state">
      <div class="empty-state-icon">${emptyIcon}</div>
      <div class="empty-state-title">${emptyTitle}</div>
      <div class="empty-state-hint">${emptyHint}</div>
      ${emptyCTA}
    </div>`;
  }

  // T-202604-319: footer total real siempre visible (independiente del filtro)
  updateBacklogFooter();

  listEl.classList.remove('kb-active');
  listEl.innerHTML = html;
  _skelHide(listEl);

  // R-202605-103: archivo histórico unificado — reemplaza _renderHistoricoSection + closed-sprints-block
  renderArchivoHistorico(listEl);

  const countEl = document.getElementById('search-count');
  if (countEl) {
    if (q) {
      const total = pendienteItems.length + doneItems.length + descartadoItems.length;
      countEl.textContent = `${total} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    } else {
      countEl.textContent = '';
    }
  }

  _attachBacklogDnD();
  _updateDocLogCount('backlog');

  // T-202604-362: placeholder del buscador refleja scope activo
  (function _updateSearchPlaceholder() {
    const inp = document.getElementById('backlog-search-input');
    if (!inp) return;
    const parts = [];
    const activeSprint = _getActiveSprint();
    const sprintFiltered = backlogSortMode === 'sprint' && activeSprint && !activeStatuses.has('done') && !activeStatuses.has('descartado');
    if (sprintFiltered) parts.push(activeSprint.label || activeSprint.id);
    if (activeTypes.size < 4) parts.push([...activeTypes].join('/'));
    if (activePriorityFilter.size > 0) parts.push('pri:' + [...activePriorityFilter].join('/'));
    const scopeCount = (pendienteItems.length + doneItems.length + (descartadoItems.length && activeStatuses.has('descartado') ? descartadoItems.length : 0));
    if (parts.length) {
      inp.placeholder = '🔍 Buscando en ' + parts.join(' · ') + ' · ' + scopeCount + ' ítem' + (scopeCount !== 1 ? 's' : '');
    } else {
      inp.placeholder = '🔍 Buscar…';
    }
  })();
}

// ─────────────────────────────────────────────────────────────────────────────
// B-[tmp:closed-version]: archivar ítems done/descartados al hacer bump de versión
// Llamada desde confirmMapGenerator() en ai-tracker-map-generator.js
// ─────────────────────────────────────────────────────────────────────────────
function archiveClosedItems() {
  let changed = false;
  ITEMS.forEach(item => {
    if (item.status === 'done' || item.status === 'descartado') {
      item.status = 'historico';
      changed = true;
    }
  });
  if (changed) {
    saveBacklog();
    renderBacklogList();
    renderStats();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// R-202605-103: Archivo histórico unificado
// Reemplaza _renderHistoricoSection (B-202604-193) + closed-sprints-block.
// Vista Por sprint: accordion de sprints cerrados con ítems históricos.
// Vista Lista plana: todos los históricos sin agrupación.
// Read-only treatment: CSS escopado a #arch-historico-body (Nova).
// ─────────────────────────────────────────────────────────────────────────────

const _ARCH_KEY       = 'ai-tracker-arch-open';
const _ARCH_VIEW_KEY  = 'ai-tracker-arch-view';   // 'sprint' | 'flat'
// B-[tmp:historico-expand]: mantener _HISTORICO_KEY en sync para compatibilidad
// con confirmCloseSprint que usa localStorage.setItem(_HISTORICO_KEY, '1')
const _HISTORICO_KEY  = _ARCH_KEY;

function renderArchivoHistorico(listEl) {
  const historicos = ITEMS.filter(i => i.status === 'historico');
  if (!historicos.length) return;

  const isOpen     = (() => { try { return localStorage.getItem(_ARCH_KEY) === '1'; } catch { return false; } })();
  const activeView = (() => { try { return localStorage.getItem(_ARCH_VIEW_KEY) || 'sprint'; } catch { return 'sprint'; } })();
  const total      = historicos.length;

  // Sprint más antiguo como referencia de "desde cuándo"
  const closedSprints = getActiveSprints()
    .filter(s => s.status === 'closed')
    .sort((a, b) => (a.closedAt || 0) - (b.closedAt || 0));
  const oldestSprintId = closedSprints.length ? esc(closedSprints[0].label || closedSprints[0].id) : '';
  const sinceHtml = oldestSprintId
    ? `<span class="arch-historico-since">desde ${oldestSprintId}</span>`
    : '';

  const section = document.createElement('div');
  section.id        = 'arch-historico';
  section.className = 'arch-historico';

  section.innerHTML = `
    <div class="arch-historico-header" onclick="toggleArchivoHistorico()" tabindex="0"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleArchivoHistorico()}"
         aria-expanded="${isOpen}" aria-controls="arch-historico-body">
      <span class="arch-historico-arrow${isOpen ? ' arch-historico-arrow--open' : ''}" aria-hidden="true">▸</span>
      <span class="arch-historico-title">Archivo histórico</span>
      <div class="arch-historico-meta">
        <span class="arch-historico-count">${total} ítem${total !== 1 ? 's' : ''}</span>
        ${sinceHtml}
      </div>
      <div class="arch-historico-tabs" onclick="event.stopPropagation()">
        <button class="arch-tab${activeView === 'sprint' ? ' arch-tab--active' : ''}"
                onclick="setArchivoView('sprint',this)">Por sprint</button>
        <button class="arch-tab${activeView === 'flat' ? ' arch-tab--active' : ''}"
                onclick="setArchivoView('flat',this)">Lista plana</button>
      </div>
    </div>
    <div class="arch-historico-body${isOpen ? '' : ' arch-historico-body--collapsed'}"
         id="arch-historico-body" role="region" aria-label="Archivo histórico">
    </div>`;

  const zoneDivider = document.createElement('div');
  zoneDivider.className = 'arch-zone-divider';
  listEl.appendChild(zoneDivider);
  listEl.appendChild(section);

  if (isOpen) {
    _renderArchivoBody(activeView);
  }
}

function toggleArchivoHistorico() {
  const body   = document.getElementById('arch-historico-body');
  const header = document.querySelector('#arch-historico .arch-historico-header');
  const arrow  = document.querySelector('#arch-historico .arch-historico-arrow');
  if (!body) return;

  const wasOpen  = !body.classList.contains('arch-historico-body--collapsed');
  const nowOpen  = !wasOpen;

  try { localStorage.setItem(_ARCH_KEY, nowOpen ? '1' : '0'); } catch {}
  if (header) header.setAttribute('aria-expanded', String(nowOpen));

  if (arrow) {
    arrow.classList.toggle('arch-historico-arrow--open', nowOpen);
  }

  if (nowOpen) {
    body.classList.remove('arch-historico-body--collapsed');
    const activeView = (() => { try { return localStorage.getItem(_ARCH_VIEW_KEY) || 'sprint'; } catch { return 'sprint'; } })();
    _renderArchivoBody(activeView);
  } else {
    body.classList.add('arch-historico-body--collapsed');
    body.innerHTML = '';
  }
}

function setArchivoView(view, btn) {
  try { localStorage.setItem(_ARCH_VIEW_KEY, view); } catch {}

  // Update tab active state
  const tabs = document.querySelectorAll('#arch-historico .arch-tab');
  tabs.forEach(t => t.classList.toggle('arch-tab--active', t === btn));

  _renderArchivoBody(view);
}

function _renderArchivoBody(view) {
  const body = document.getElementById('arch-historico-body');
  if (!body) return;

  if (view === 'sprint') {
    _renderArchivoViewSprint(body);
  } else {
    _renderArchivoViewFlat(body);
  }
}

// R-202605-124: número de sprint como entero para comparar con la frontera S-23
function _sprintNum(id) {
  const m = (id || '').match(/^S-(\d+)$/i);
  return m ? parseInt(m[1], 10) : 0;
}

// R-202605-124: fila compacta de ítem para el Archivo Histórico
// muestra: tipo · código · título · effort · status final
function _archItemRow(i) {
  const type   = esc(i.type || 'T');
  const code   = esc(i.code || '—');
  const title  = esc(i.title || '—');
  const effort = parseInt(i.effort) || 0;
  const effortHtml = effort
    ? `<span class="arch-row-effort" title="Effort ${effort}">${'●'.repeat(effort)}</span>`
    : '';
  const statusLabel = i.status === 'historico'
    ? (i.doneAt ? 'done' : i.discardReason ? 'descartado' : 'historico')
    : esc(i.status || '');
  return `<div class="arch-item-row">
    <span class="arch-row-type arch-row-type--${type.toLowerCase()}">${type}</span>
    <span class="arch-row-code">${code}</span>
    <span class="arch-row-title">${title}</span>
    ${effortHtml}
    <span class="arch-row-status">${statusLabel}</span>
  </div>`;
}

// R-202605-124: header HTML de una entrada de sprint con datos completos
function _archSprintEntryHtml(sp, spItems, entryId, entryKey, entryOpen) {
  const dateStr = sp.closedAt
    ? new Date(sp.closedAt).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'})
    : '—';
  const effortDone = spItems.reduce((acc, i) => acc + (parseInt(i.effort) || 0), 0);
  const effortHtml = effortDone
    ? `<span class="arch-se-effort" title="Effort entregado">${effortDone} effort</span>`
    : '';
  const goalHtml = sp.goal
    ? `<span class="arch-se-goal" title="${esc(sp.goal)}">${esc(sp.goal)}</span>`
    : '';
  const nameDisplay = sp.label
    ? esc(sp.label.replace(/^[A-Za-z]+[-\s]S\d+\s*·?\s*/i, ''))
    : esc(sp.id || 'Sprint sin nombre');

  return `<div class="arch-sprint-entry">
    <div class="arch-sprint-entry-header" tabindex="0"
         onclick="_toggleArchSprintEntry('${esc(entryId)}','${esc(entryKey)}')"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();_toggleArchSprintEntry('${esc(entryId)}','${esc(entryKey)}')}">
      <span class="arch-se-arrow${entryOpen ? ' arch-se-arrow--open' : ''}" aria-hidden="true">&#9658;</span>
      <span class="arch-se-id">${esc(sp.id)}</span>
      <span class="arch-se-name">${nameDisplay}</span>
      ${goalHtml}
      <span class="arch-se-date">${esc(dateStr)}</span>
      ${effortHtml}
      <span class="arch-se-count">${spItems.length} ítem${spItems.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="arch-sprint-items${entryOpen ? '' : ' arch-sprint-items--collapsed'}" id="${esc(entryId)}">
      ${entryOpen ? `<div class="arch-items-list">${spItems.map(_archItemRow).join('')}</div>` : ''}
    </div>
  </div>`;
}

// Vista Por sprint — accordion de sprints cerrados
// R-202605-124: sprints ≥ S-23 con datos completos · pre-S-23 agrupados como bloque único
function _renderArchivoViewSprint(body) {
  const historicos    = ITEMS.filter(i => i.status === 'historico');
  const closedSprints = getActiveSprints()
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0)); // más reciente primero

  // R-202605-124: frontera S-23 — sprints con datos completos vs. legado
  const BOUNDARY = 23;
  const recentSprints = closedSprints.filter(s => _sprintNum(s.id) >= BOUNDARY);
  const legacySprints = closedSprints.filter(s => _sprintNum(s.id) > 0 && _sprintNum(s.id) < BOUNDARY);

  // Ítems huérfanos (sin sprint registrado o sprint que ya no existe en catálogo)
  const registeredIds = new Set(closedSprints.map(s => s.id));
  const noSprint = historicos.filter(i => !i.sprint || !registeredIds.has(i.sprint));

  // Ítems de sprints legado (sprint id < S-23 que sí está en catálogo)
  const legacySprintIds = new Set(legacySprints.map(s => s.id));
  const legacyItems = historicos.filter(i => legacySprintIds.has(i.sprint));

  // Total de ítems sin agrupación moderna
  const preLegacyItems = [...legacyItems, ...noSprint];

  const hasData = recentSprints.some(s => historicos.filter(i => i.sprint === s.id).length > 0)
               || preLegacyItems.length > 0;

  if (!hasData) {
    body.innerHTML = `<div class="arch-view"><div class="arch-empty">Sin sprints cerrados con ítems históricos.</div></div>`;
    return;
  }

  let html = `<div class="arch-view" id="arch-view-sprint">`;

  // ── Sprints ≥ S-23 con datos completos ──────────────────────────────
  recentSprints.forEach(sp => {
    const spItems = historicos.filter(i => i.sprint === sp.id);
    if (!spItems.length) return;

    const entryKey  = 'arch-se-' + sp.id;
    const entryOpen = (() => { try { return localStorage.getItem(entryKey) === '1'; } catch { return false; } })();
    const entryId   = 'arch-se-body-' + sp.id.toLowerCase().replace(/[^a-z0-9]/g, '-');

    html += _archSprintEntryHtml(sp, spItems, entryId, entryKey, entryOpen);
  });

  // ── Histórico pre-S-23 — bloque único colapsable ─────────────────────
  if (preLegacyItems.length) {
    const legKey  = 'arch-se-legacy';
    const legOpen = (() => { try { return localStorage.getItem(legKey) === '1'; } catch { return false; } })();
    const legId   = 'arch-se-body-legacy';
    html += `<div class="arch-sprint-entry arch-sprint-entry--legacy">
      <div class="arch-sprint-entry-header" tabindex="0"
           onclick="_toggleArchSprintEntry('${legId}','${legKey}')"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();_toggleArchSprintEntry('${legId}','${legKey}')}">
        <span class="arch-se-arrow${legOpen ? ' arch-se-arrow--open' : ''}" aria-hidden="true">&#9658;</span>
        <span class="arch-se-id arch-se-id--legacy">pre-S-23</span>
        <span class="arch-se-name">Histórico pre-S-23 (sin datos de sprint)</span>
        <span class="arch-se-count">${preLegacyItems.length} ítem${preLegacyItems.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="arch-sprint-items${legOpen ? '' : ' arch-sprint-items--collapsed'}" id="${legId}">
        ${legOpen ? `<div class="arch-items-list">${preLegacyItems.map(_archItemRow).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  html += `</div>`;
  body.innerHTML = html;
}

// Vista Lista plana — todos los históricos sin agrupación
function _renderArchivoViewFlat(body) {
  const historicos = ITEMS.filter(i => i.status === 'historico')
    .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));

  if (!historicos.length) {
    body.innerHTML = `<div class="arch-view"><div class="arch-empty">Sin ítems históricos.</div></div>`;
    return;
  }

  body.innerHTML = `<div class="arch-view" id="arch-view-flat">
    ${historicos.map(i => buildBacklogItem(i)).join('')}
  </div>`;
}

// Toggle individual sprint entry dentro del archivo histórico
// R-202605-124: lazy render con _archItemRow (filas compactas) en lugar de buildBacklogItem
function _toggleArchSprintEntry(bodyId, storageKey) {
  const el = document.getElementById(bodyId);
  if (!el) return;

  const wasCollapsed = el.classList.contains('arch-sprint-items--collapsed');
  const nowOpen      = wasCollapsed;

  try { localStorage.setItem(storageKey, nowOpen ? '1' : '0'); } catch {}

  const header = el.previousElementSibling;
  const arrow  = header ? header.querySelector('.arch-se-arrow') : null;
  if (arrow) arrow.classList.toggle('arch-se-arrow--open', nowOpen);

  if (nowOpen) {
    // R-202605-124: lazy render de filas compactas al abrir
    if (!el.querySelector('.arch-items-list')) {
      let spItems;
      if (bodyId === 'arch-se-body-legacy') {
        // Bloque legado: históricos sin sprint en catálogo o sprint < S-23
        const BOUNDARY = 23;
        const closedSprints = getActiveSprints().filter(s => s.status === 'closed');
        const registeredIds = new Set(closedSprints.map(s => s.id));
        const legacyIds     = new Set(closedSprints.filter(s => _sprintNum(s.id) > 0 && _sprintNum(s.id) < BOUNDARY).map(s => s.id));
        spItems = ITEMS.filter(i => i.status === 'historico' && (!i.sprint || !registeredIds.has(i.sprint) || legacyIds.has(i.sprint)));
      } else {
        const spId = storageKey.replace(/^arch-se-/, '');
        spItems = ITEMS.filter(i => i.status === 'historico' && i.sprint === spId);
      }
      el.innerHTML = `<div class="arch-items-list">${spItems.map(_archItemRow).join('')}</div>`;
    }
    el.classList.remove('arch-sprint-items--collapsed');
  } else {
    el.classList.add('arch-sprint-items--collapsed');
  }
}

// ─── fin R-202605-103 ──────────────────────────────────────────────────────

// T-202604-287: Vista Kanban — 4 columnas: pendiente · progreso · done · descartado
function _renderKanban(listEl) {
  // R-202604-091: 3 columnas — 'en curso' eliminado, ítems activos decorados en 'pendiente'
  const COLS = [
    { id: 'pendiente',  label: 'Pendiente',  status: 'pendiente',  colorVar: 'var(--text2)',  accentColor: 'rgba(124,106,247,0.4)' },
    { id: 'done',       label: 'Hecho',        status: 'done',       colorVar: '#2ecc78',       accentColor: 'rgba(46,204,120,0.4)' },
    { id: 'descartado', label: 'Descartado',  status: 'descartado', colorVar: 'var(--hint)',   accentColor: 'rgba(120,120,120,0.3)' }
  ];

  // Mapeo de status normalizados para compatibilidad
  function _kanbanStatus(item) {
    // R-202604-091: 'en curso' → 'pendiente'
    const s = item.status;
    if (s === 'in-progress' || s === 'en progreso' || s === 'progreso' || s === 'en curso') return 'pendiente';
    return s; // pendiente | done | descartado
  }

  // Filtrar aplicando los mismos filtros activos del backlog
  const q = backlogSearchQuery;
  let allFiltered = ITEMS.filter(i => {
    const type = itemType(i.code);
    const typeOk = type ? activeTypes.has(type) : true;
    const _rawEffortK = parseInt(i.effort) || 1;
    const _normEffortK = _rawEffortK > 3 ? 3 : _rawEffortK < 1 ? 1 : _rawEffortK;
    const effortOk = activeEfforts.has(_normEffortK); // B-202605-233: effort >3 normalizado a 3
    let roleOk = true;
    if (activeRoleFilter === '__none__') roleOk = !i.role || !i.role.trim();
    else if (activeRoleFilter !== null) roleOk = (i.role || '').trim() === activeRoleFilter;
    return typeOk && effortOk && roleOk && i.status !== 'historico'; // B-202605-266
  });
  if (q) {
    allFiltered = allFiltered.filter(i =>
      i.code.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      (i.area || '').toLowerCase().includes(q)
    );
  }

  // Agrupar por columna
  const byCol = {};
  COLS.forEach(c => { byCol[c.id] = []; });
  allFiltered.forEach(item => {
    const cs = _kanbanStatus(item);
    if (byCol[cs]) byCol[cs].push(item);
    else byCol['pendiente'].push(item); // fallback
  });

  // Construir card Kanban (compacta: código + tipo + título + sprint + effort)
  function _kanbanCard(item) {
    const type = itemType(item.code) || '';
    const typeColors = { T:'#2ecc78', R:'#38bdf8', B:'#e85555', P:'#7c6af7' };
    const typeColor = typeColors[type] || 'var(--hint)';
    const effortN = parseInt(item.effort) || 0;
    const dots = Array.from({length:3}, (_,i) =>
      `<span class="kb-effort-dot${i < effortN ? ' on' : ''}"></span>`
    ).join('');
    const sprintBadge = item.sprint ? `<span class="kb-card-sprint">${esc(item.sprint)}</span>` : '';
    const prioBadge = (!item.status || item.status === 'pendiente') && item.priority && item.priority !== 'medium'
      ? `<span class="kb-card-prio kb-prio-${item.priority}">${badgeLabel(item.priority)}</span>` : '';
    const kbIsActive = _isActiveRecently(item);
    // T-202605-449: tratamiento visual Kanban para ítems bloqueados por dependencia
    const kbIsDepBlocked = _hasDepsBlocked(item);
    const kbDepBadge = kbIsDepBlocked ? '<span class="kb-dep-blocked-badge" title="Tiene dependencias pendientes">🔒</span>' : '';
    return `<div class="kb-card${kbIsActive ? ' kb-card--active' : ''}${kbIsDepBlocked ? ' kb-card--dep-blocked' : ''}" data-code="${esc(item.code)}" data-status="${esc(item.status)}"
        style="--kb-type-color:${typeColor}"
        draggable="true"
        ondragstart="event.dataTransfer.setData('text/plain','${esc(item.code)}');this.classList.add('kanban-card--dragging')"
        ondragend="this.classList.remove('kanban-card--dragging')"
        onclick="_kbCardClick(event,'${esc(item.code)}')">
      <div class="kb-card-header">
        <span class="kb-card-type">${type}</span>
        <span class="kb-card-code">${esc(item.code)}</span>
        <div class="kb-card-header-right">${kbDepBadge}${kbIsActive ? '<span class="kb-activity-dot" title="Actividad reciente"></span>' : ''}${prioBadge}</div>
      </div>
      <div class="kb-card-title">${esc(item.title)}</div>
      <div class="kb-card-footer">
        ${sprintBadge}
        <div class="kb-effort-dots">${dots}</div>
        ${item.area ? `<span class="kb-card-area">${esc(item.area)}</span>` : ''}
      </div>
    </div>`;
  }

  // Construir HTML de columnas
  let html = '<div class="kb-board">';
  COLS.forEach(col => {
    const colItems = byCol[col.id];
    html += `<div class="kb-col" id="kb-col-${col.id}"
        data-col-status="${col.id}"
        ondragover="event.preventDefault();this.classList.add('kb-col-dragover')"
        ondragleave="this.classList.remove('kb-col-dragover')"
        ondrop="_kbDrop(event,'${col.id}')">
      <div class="kb-col-header" style="--col-accent:${col.accentColor}">
        <span class="kb-col-title">${col.label}</span>
        <span class="kb-col-count">${colItems.length}</span>
      </div>
      <div class="kb-col-body" id="kb-body-${col.id}">
        ${colItems.length ? colItems.map(_kanbanCard).join('') : `<div class="kb-col-empty">Sin ítems</div>`}
      </div>
    </div>`;
  });
  html += '</div>';

  listEl.classList.add('kb-active');
  listEl.innerHTML = html;
  _skelHide(listEl);
}

// T-202604-287: handler drop Kanban — reutiliza setItemStatus con lógica de confirmación existente
function _kbDrop(event, toStatus) {
  event.preventDefault();
  const col = event.currentTarget;
  col.classList.remove('kb-col-dragover');
  const code = event.dataTransfer.getData('text/plain');
  if (!code) return;
  // Mapear columna 'progreso' al status real del sistema
  // R-202604-091: solo 3 columnas — 'en-curso' eliminado
  // Se almacena como 'in-progress' en item.status para conservar estado
  // R-202604-091: 'en-curso' eliminado del statusMap
  const statusMap = { pendiente: 'pendiente', done: 'done', descartado: 'descartado' };
  const newStatus = statusMap[toStatus] || toStatus;
  setItemStatus(code, newStatus);
}

// T-202604-287: click en card Kanban abre el editor del ítem
function _kbCardClick(event, code) {
  // No abrir si fue un drag (el drag pone clase antes del click)
  if (event.defaultPrevented) return;
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  _openItemEditorSafe(item.id || null, code); // B-202605-012
}

// T-202604-076: DnD para reordenar ítems dentro de grupo sprint (no aplica a done/descartado ni a modo plano)
function _attachBacklogDnD() {
  // B-202605-013: T-202604-424 eliminó 'sprint' como valor de backlogSortMode — guard era inalcanzable.
  // DnD activo cuando la agrupación por sprint está activa y no hay modo exclusivo que tome el rendering.
  if (!_backlogSprintGroupMode || _backlogKanbanMode || _backlogFocusMode || _backlogMikeMode || _backlogNoAcMode) return;
  // Solo grupos sprint: vbody-{groupId} — excluye sgbody-done, sgbody-discarded y vbody-flat
  const sprintBodies = document.querySelectorAll('[id^="vbody-"]:not(#vbody-flat)');
  sprintBodies.forEach(body => {
    const items = body.querySelectorAll('.item[data-code]');
    items.forEach(el => {
      const handle = el.querySelector('.item-drag-handle');
      if (!handle) return; // sin handle = sin sprint = no draggable
      el.draggable = true;
      handle.addEventListener('mousedown', () => { handle.classList.add('cursor-grabbing'); });
      handle.addEventListener('mouseup', () => { handle.classList.remove('cursor-grabbing'); });
      el.addEventListener('dragstart', e => {
        // B-202605-013: eliminado guard e.target === handle — dragstart dispara en el (.item), no en el handle
        // La activación ya está acotada: solo ítems con .item-drag-handle llegan aquí (guard L3650)
        e.dataTransfer.setData('text/plain', el.dataset.code);
        el.classList.add('item-dragging');
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('item-dragging');
        handle.classList.remove('cursor-grabbing');
      });
      el.addEventListener('dragover', e => {
        e.preventDefault();
        el.classList.add('item-drag-over');
      });
      el.addEventListener('dragleave', () => {
        el.classList.remove('item-drag-over');
      });
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('item-drag-over');
        const fromCode = e.dataTransfer.getData('text/plain');
        const toCode = el.dataset.code;
        if (!fromCode || fromCode === toCode) return;
        const fromIdx = ITEMS.findIndex(i => i.code === fromCode);
        const toIdx   = ITEMS.findIndex(i => i.code === toCode);
        if (fromIdx < 0 || toIdx < 0) return;
        if ((ITEMS[fromIdx].sprint || '') !== (ITEMS[toIdx].sprint || '')) return;
        const [moved] = ITEMS.splice(fromIdx, 1);
        ITEMS.splice(toIdx, 0, moved);
        _undoSnapshot();
        saveBacklog();
        renderBacklogList();
      });
    });
  });
}

// T-202604-074: edición inline de título con doble click
function _inlineEditTitle(code, e) {
  e.stopPropagation(); // evitar toggleItemExpand
  const span = e.currentTarget;
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  const originalTitle = item.title;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'item-title-edit-input';
  input.value = originalTitle;

  span.replaceWith(input);
  input.focus();
  input.select();

  function _commit() {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== originalTitle) {
      item.title = newTitle;
      _undoSnapshot();
      saveBacklog();
    }
    renderBacklogList();
  }

  function _cancel() {
    renderBacklogList();
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); _commit(); }
    if (e.key === 'Escape') { e.preventDefault(); _cancel(); }
    e.stopPropagation();
  });
  input.addEventListener('blur', _commit);
  input.addEventListener('click', e => e.stopPropagation());
}

// T-202604-048: construir mini progress-bar de hijos para R
// T-202604-187/188: _buildChildrenBlock con colapsable y progreso
function _buildChildrenBlock(rCode) {
  // B-202604-158: respetar filtros activos — solo mostrar hijos que pasan tipo y status
  const allChildren = ITEMS.filter(i => i.parentId === rCode);
  if (!allChildren.length) return '';
  const children = allChildren.filter(i => {
    const t = itemType(i.code);
    const typeOk = t ? activeTypes.has(t) : true;
    const statusOk = activeStatuses.has(i.status);
    return typeOk && statusOk;
  });
  if (!children.length) return '';
  const doneCount = children.filter(i => i.status === 'done').length;
  const pct = Math.round((doneCount / children.length) * 100);
  const isCollapsed = _collapsedChildren.has(rCode);

  const childRows = children.map(child => {
    // B-202605-011: IDs de DOM desde item.code — estables ante mutaciones de ITEMS
    const cSafeId = child.code.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cType = itemType(child.code) || '';
    const isDoneC = child.status === 'done';
    return `<div class="child-item${isDoneC ? ' is-done' : ''}">
      <span class="child-collapse-arrow" id="ciarrow-${cSafeId}" onclick="(function(){var _ci=ITEMS.findIndex(function(x){return x.code==='${esc(child.code)}'});if(_ci>=0)toggleItemExpand(_ci);var a=document.getElementById('ciarrow-${cSafeId}');var b=document.getElementById('ibody-${cSafeId}');if(a&&b)a.textContent=b.classList.contains('open')?'▾':'▸';event.stopPropagation();})()">&#x25B8;</span>
      <span class="item-type-pill ${cType} item-type-pill--sm">${cType}</span>
      <span class="child-title" onclick="(function(){var _ci=ITEMS.findIndex(function(x){return x.code==='${esc(child.code)}'});if(_ci>=0)toggleItemExpand(_ci);var a=document.getElementById('ciarrow-${cSafeId}');var b=document.getElementById('ibody-${cSafeId}');if(a&&b)a.textContent=b.classList.contains('open')?'▾':'▸';})()}">${esc(child.title)}</span>
      <span class="badge ${statusClass(child.status)} badge--sm">${statusLabel(child.status)}</span>
    </div>
    <div class="item-body item-body--child" id="ibody-${cSafeId}">
      <div id="code-badge-${cSafeId}" onclick="copyItemCode(event,'${esc(child.code)}',-1)" title="Click para copiar ID" class="item-code-badge">${esc(child.code)}</div>
      <div class="child-meta-row">
        <span class="badge ${badgeClass(child.priority)} badge--sm">${badgeLabel(child.priority)}</span>
        ${child.area ? `<span class="badge badge-area badge--sm">${esc(child.area)}</span>` : ''}
        ${child.effort ? `<div class="effort-dots effort-dots--inline">${effortDots(child.effort)}</div>` : ''}
      </div>
      ${child.ac && child.ac.length ? `<ul class="ac-list open ac-list--child">${child.ac.map(c => `<li class="ac-list-item--sm">${esc(c)}</li>`).join('')}</ul>` : ''}
      <div class="child-actions">
        <button onclick="event.stopPropagation();_openItemEditorSafe(null,'${esc(child.code)}')" class="btn-ghost btn-ghost--sm" title="Editar ítem">✎ Editar</button>
        <button onclick="event.stopPropagation();_confirmUnlinkChild('${esc(child.code)}','${esc(rCode)}')" class="btn-ghost btn-ghost--sm btn-ghost--muted" title="Desvincular del R padre">⊠ Desvincular</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="r-children-block">
    <div class="r-children-header" onclick="event.stopPropagation();toggleChildrenBlock('${esc(rCode)}')">
      <span class="r-children-tickets-label">Tickets</span>
      <div class="r-children-bar-wrap"><div class="r-children-bar" style="--rch-bar-w:${pct}%"></div></div>
      <span class="r-children-label">${doneCount}/${children.length} · ${pct}%</span>
      <span id="rchildren-arrow-${esc(rCode)}" class="r-children-arrow">${isCollapsed ? '▸' : '▾'}</span>
    </div>
    <div class="r-children-list${isCollapsed ? ' collapsed' : ''}" id="rchildren-body-${esc(rCode)}">${childRows}</div>
  </div>`;
}

// T-202604-004: desvincular child de R padre con confirmación
function _confirmUnlinkChild(childCode, rCode) {
  _gconfirmOpen({
    title: 'Desvincular ítem',
    msg: `¿Desvincular ${childCode} de ${rCode}? El ítem quedará sin padre.`,
    okLabel: 'Desvincular',
    danger: true
  }, () => {
    const item = ITEMS.find(i => i.code === childCode);
    if (item) { item.parentId = null; saveBacklog(); renderBacklogList(); renderStats(); showToast('success', `${childCode} desvinculado`); }
  });
}

// T-202604-028: timestamps legibles para item-body
function _buildItemTimestamps(item) {
  const _fmt = ts => {
    if (!ts) return null;
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays/7)} sem.`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays/30)} mes${Math.floor(diffDays/30)>1?'es':''}`;
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  };
  const _iso = ts => ts ? new Date(ts).toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' }) : '';
  const rows = [];
  if (item.createdAt) rows.push(`<span title="${_iso(item.createdAt)}">📅 Creado: <strong>${_fmt(item.createdAt)}</strong></span>`);
  if (item.statusChangedAt) rows.push(`<span title="${_iso(item.statusChangedAt)}">🔄 Último cambio: <strong>${_fmt(item.statusChangedAt)}</strong></span>`);
  if (item.doneAt) rows.push(`<span title="${_iso(item.doneAt)}">✅ Completado: <strong>${_fmt(item.doneAt)}</strong></span>`);
  if (!rows.length) return '';
  return `<div class="bitem-timestamps">${rows.join('')}</div>`;
}

// R-[pendiente-ID]: bloque de origen P padre — muestra enlace al P que originó este ítem
function _buildItemPOriginBlock(item) {
  if (!item.origin) return '';
  const pItem = ITEMS.find(i => i.code === item.origin);
  const pTitle = pItem ? esc(pItem.title) : '';
  return `<div class="bitem-origin-p-block">
    <span class="bitem-origin-p-label">Origen</span>
    <button class="bitem-origin-p-link" onclick="event.stopPropagation();navigateToItem('${esc(item.origin)}')" title="${pTitle}">${esc(item.origin)}</button>
    ${pTitle ? `<span class="bitem-origin-p-name" title="${pTitle}">${pTitle}</span>` : ''}
  </div>`;
}

// T-202604-NNN: bloque de origen — IA, sesión y archivos relacionados del ítem
function _buildItemOriginBlock(item) {
  if (!item.sessionId) return '';

  // getAllSessions() retorna sesiones planas con s.aiId — no {sess,ai} pairs
  const allSessions = typeof getAllSessions === 'function' ? getAllSessions() : [];
  const foundSess = allSessions.find(s => s && s.id === item.sessionId);
  if (!foundSess) return '';

  const foundAi = typeof getAI === 'function' ? getAI(foundSess.aiId) : null;

  const aiName = foundAi ? esc(foundAi.name || foundAi.id) : '—';
  const aiAvatar = (foundAi && foundAi.avatar) ? `<span class="bitem-origin-avatar">${foundAi.avatar}</span>` : '';

  // Fecha de sesión
  const _fmtSessDate = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  };
  const sessDate = foundSess.date ? esc(foundSess.date) : _fmtSessDate(foundSess.savedAt || foundSess.createdAt);
  const sessTitle = foundSess.title ? esc(foundSess.title) : '';
  const sessLabel = sessTitle ? `${sessTitle}${sessDate ? ' · ' + sessDate : ''}` : (sessDate || foundSess.id);

  // Archivos relacionados — sess.files es string (texto libre del paste), convertir a array
  const _filesRaw = foundSess.files || foundSess.archivos || '';
  const files = Array.isArray(_filesRaw)
    ? _filesRaw.filter(Boolean)
    : _filesRaw.split(/[\n,]+/).map(f => f.trim()).filter(Boolean);
  const filesHtml = files.length
    ? `<div class="bitem-origin-row bitem-origin-row--files">
        <span class="bitem-origin-label">Archivos</span>
        <div class="bitem-origin-files">
          ${files.map(f => `<span class="bitem-origin-file-pill" title="${esc(f)}">${esc(f)}</span>`).join('')}
        </div>
       </div>`
    : '';

  return `<div class="bitem-origin-block">
    <div class="bitem-origin-row">
      <span class="bitem-origin-label">IA</span>
      <span class="bitem-origin-value">${aiAvatar}${aiName}</span>
    </div>
    <div class="bitem-origin-row bitem-origin-row--mt">
      <span class="bitem-origin-label">Sesión</span>
      <span class="bitem-origin-value" title="${esc(foundSess.id || '')}">${sessLabel}</span>
    </div>
    ${filesHtml}
  </div>`;
}

// R-202605-010: status chip popover — un solo popover activo a la vez
let _statusPopoverCode = null;
function _openStatusPopover(e, code) {
  e.stopPropagation();
  // Cerrar popover previo
  const prev = document.getElementById('status-popover');
  if (prev) prev.remove();
  if (_statusPopoverCode === code) { _statusPopoverCode = null; return; }
  _statusPopoverCode = code;

  const item = ITEMS.find(i => i.code === code);
  if (!item) { _statusPopoverCode = null; return; }

  const isIdea = (itemType(code) || '') === 'P';
  const options = [
    { val: 'pendiente', label: 'Pendiente' },
    ...(!isIdea ? [{ val: 'done', label: 'Hecho' }] : []),
    { val: 'descartado', label: 'Descartado' }
  ];

  const pop = document.createElement('div');
  pop.id = 'status-popover';
  pop.className = 'bitem-status-popover';
  pop.setAttribute('role', 'menu');
  pop.onclick = e2 => e2.stopPropagation();

  pop.innerHTML = options.map(o =>
    `<button class="bitem-status-popover-btn${item.status === o.val ? ' is-current' : ''}" data-val="${o.val}">${o.label}</button>`
  ).join('');

  pop.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const newVal = btn.dataset.val;
      pop.remove();
      _statusPopoverCode = null;
      if (newVal !== item.status) {
        try {
          setItemStatus(code, newVal);
        } catch(err) {
          showToast('error', 'Error al cambiar status', null, 3000);
          // chip revierte automáticamente tras el re-render de renderBacklogList
        }
      }
    });
  });

  document.body.appendChild(pop);

  // Posicionar bajo el chip trigger
  const trigger = e.currentTarget;
  const rect = trigger.getBoundingClientRect();
  const popW = 120;
  let left = rect.left + window.scrollX;
  if (left + popW > window.innerWidth) left = window.innerWidth - popW - 8;
  pop.style.setProperty('--sp-top', (rect.bottom + window.scrollY + 4) + 'px');
  pop.style.setProperty('--sp-left', left + 'px');

  // Cerrar con Escape
  const _escHandler = ev => {
    if (ev.key === 'Escape') { pop.remove(); _statusPopoverCode = null; document.removeEventListener('keydown', _escHandler); }
  };
  document.addEventListener('keydown', _escHandler);

  // Cerrar al click fuera
  const _outsideHandler = ev => {
    if (!pop.contains(ev.target) && ev.target !== trigger) {
      pop.remove();
      _statusPopoverCode = null;
      document.removeEventListener('click', _outsideHandler, true);
    }
  };
  setTimeout(() => document.addEventListener('click', _outsideHandler, true), 0);
}

// T-108: construir un ítem colapsado
function buildBacklogItem(item) {
  const globalIdx = ITEMS.indexOf(item);
  const isDone = item.status === 'done';
  const isDiscarded = item.status === 'descartado';
  const isHistorico = item.status === 'historico'; // B-202604-193: read-only
  const type = itemType(item.code) || '';
  const typeLabel = TYPE_LABELS[type] || type;
  // R-202605-098: gate único para toda lógica diferenciada de tipo P
  const isIdea = type === 'P';

  // T-202604-050: detectar campos obligatorios faltantes (no aplica a descartados ni a P)
  // R-202605-098: P no tiene effort ni AC obligatorios — son conceptos que emergen al promoverse
  const missingFields = [];
  if (!isDiscarded) {
    if (!isIdea && !item.effort) missingFields.push('effort');
    if (!item.area)   missingFields.push('area');
    if (!isIdea && (!item.ac || !item.ac.length)) missingFields.push('ac');
  }
  // R-202605-122 AC2/AC3: badge 'sin effort' con acción rápida de asignación
  const _missingEffort = !isDiscarded && !isIdea && !item.effort;
  const _effortQuickBadge = _missingEffort
    ? `<span class="badge-missing badge-missing--effort" title="Esfuerzo no declarado — requerido para burndown">⚠ sin effort <button class="badge-effort-quick" onclick="event.stopPropagation();_quickAssignEffort('${esc(item.code || item.id)}')" title="Asignar effort rápidamente">Asignar</button></span>`
    : '';
  const _otherMissing = missingFields.filter(f => f !== 'effort');
  const missingAlert = (_missingEffort || _otherMissing.length)
    ? `<div class="bitem-missing-row">${_effortQuickBadge}${_otherMissing.map(f => `<span class="badge-missing">⚠ falta ${f}</span>`).join(' ')}</div>`
    : '';

  // AC list
  const acHtml = item.ac && item.ac.length
    ? `<div class="bitem-ac-block">
        <div class="bitem-ac-header">
          <span class="bitem-ac-check">✓</span>
          <span class="bitem-ac-count">${item.ac.length} criterio${item.ac.length !== 1 ? 's' : ''}</span>
        </div>
        <ul class="bitem-ac-list open">
          ${item.ac.map(c => `<li><span class="bitem-ac-dot"></span><span>${esc(c)}</span></li>`).join('')}
        </ul>
       </div>`
    : `<div class="bitem-ac-block"><div class="bitem-ac-header bitem-ac-header--empty">Sin criterios de aceptación</div></div>`;

  // Effort dots — large version for header, styled
  const effortN = parseInt(item.effort) || 0;
  const effortDotsHtml = (() => {
    let d = '';
    for (let i = 0; i < 3; i++) d += `<span class="bitem-effort-dot${i < effortN ? ' on' : ''}"></span>`;
    return `<div class="bitem-effort-dots" title="Esfuerzo ${effortN}/3">${d}</div>`;
  })();

  // Priority color
  const prioColors = { high:'#e85555', medium:'#f59e0b', low:'var(--hint)' };
  const prioColor = prioColors[item.priority] || 'var(--hint)';
  const prioBadgeHtml = (!isDone && !isDiscarded && item.priority)
    ? `<span class="bitem-prio-badge prio-${item.priority}">${badgeLabel(item.priority)}</span>`
    : '';
  // T-202604-199: badge "Sin AC" — solo en pendiente sin criterios
  const noAcBadge = (!isDone && !isDiscarded && item.status === 'pendiente' && (!item.ac || !item.ac.length))
    ? '<span class="badge-missing badge-missing--warning">Sin AC</span>'
    : '';
  // T-202604-261: badge "bloqueado" — pendiente con sprint >14 días sin cambio de status
  const blockedBadge = _isBlocked(item)
    ? '<span class="badge-missing badge-missing--blocked" title="Sin cambio de status en más de 14 días">⛔ bloqueado</span>'
    : '';
  // T-202604-259: badge "sin sesión" — pendiente con sprint sin mención en sesión en >14 días
  const noSessionBadge = (!isDone && !isDiscarded && item.sprint && !_hasRecentSession(item))
    ? '<span class="badge-missing badge-missing--idle" title="Sin mención en sesión en más de 14 días">💤 sin sesión</span>'
    : '';

  // Children count + progreso para R type (T-188)
  // B-202605-052: usar ITEMS sin filtrar como denominador — los filtros activos no afectan el porcentaje
  const childCount = type === 'R' ? ITEMS.filter(i => i.parentId === item.code).length : 0;
  const childDoneCount = type === 'R' ? ITEMS.filter(i => i.parentId === item.code && i.status === 'done').length : 0;
  const childBadge = (type === 'R' && childCount > 0 && !isDone && !isDiscarded)
    ? `<span class="bitem-child-badge" title="${childDoneCount}/${childCount} tickets done">${childDoneCount}/${childCount} <span class="bitem-child-badge-label">tickets</span></span>`
    : '';

  // T-202604-288: badge "Bloqueado por [código]" — blockedBy explícito pendiente
  const blockedByItems = (!isDone && !isDiscarded && item.blockedBy && item.blockedBy.length)
    ? item.blockedBy.filter(c => { const dep = ITEMS.find(i => i.code === c); return !dep || dep.status !== 'done'; })
    : [];
  const blockedByBadge = blockedByItems.length
    ? blockedByItems.map(c =>
        `<span class="badge-missing badge-missing--blocked badge-blocked-by" onclick="event.stopPropagation();openItemPanel('${esc(c)}')" title="Ir al ítem bloqueante">🔒 ${esc(c)}</span>`
      ).join('')
    : '';

  // R-202604-051: badge blocking:true — ítem bloqueante activo
  const blockingBadge = (!isDone && !isDiscarded && item.blocking)
    ? `<span class="badge-blocking" title="Este ítem bloquea a otros — debe resolverse primero">⚠ bloqueante</span>`
    : '';

  // B-202604-194: badge "AC actualizados" — flag de sesión en _acReplacedSet, desaparece al recargar
  const acReplacedBadge = (!isDone && !isDiscarded && _acReplacedSet.has(item.id))
    ? '<span class="badge-ac-replaced" title="Los criterios de aceptación fueron reemplazados en esta sesión via merge">↺ AC</span>'
    : '';

  // R-202604-091: decorador de actividad reciente — sesión vinculada en los últimos 7 días
  const isActive = (!isDone && !isDiscarded) ? _isActiveRecently(item) : false;

  // R-202605-131: badge scope added — ítem añadido durante el sprint activo
  const scopeAddedBadge = (!isDone && !isDiscarded && item.scope_added)
    ? '<span class="badge-scope-added" title="Añadido al sprint después de su apertura">＋ scope</span>'
    : '';

  // Header right slot
  // R-202605-098: para P pendiente — acciones inline en header sin necesidad de expandir
  const _ideaQuickActions = (isIdea && !isDiscarded && !isDone)
    ? `<div class="item-quick-actions">
        <button class="btn-promote" onclick="event.stopPropagation();_promoteItem('${esc(item.code)}')" title="Promover a Ticket o Requerimiento">⬆ Promover</button>
        <button class="btn-discard-idea" onclick="event.stopPropagation();setItemStatus('${esc(item.code)}','descartado')" title="Descartar esta idea">✕ Descartar</button>
       </div>`
    : '';
  // R-202605-010: status chip inline clickeable — solo para ítems pendientes (no P, no done, no descartado)
  const _statusChipHtml = (!isDone && !isDiscarded && !isIdea)
    ? `<button class="bitem-status-chip bitem-status-chip--${esc(item.status || 'pendiente')}" onclick="_openStatusPopover(event,'${esc(item.code)}')" title="Cambiar status" type="button">${statusLabel(item.status || 'pendiente')}</button>`
    : '';
  const headerRight = isDiscarded
    ? `<span class="bitem-discarded-icon">🗑</span>`
    : isDone
      ? `<span class="bitem-done-check">✓</span>`
      : isIdea
        ? `<div class="bitem-header-right">${_ideaQuickActions}</div>`
        : `<div class="bitem-header-right">${_statusChipHtml}${scopeAddedBadge}${noAcBadge}${acReplacedBadge}${blockingBadge}${blockedBadge}${blockedByBadge}${noSessionBadge}${childBadge}${prioBadgeHtml}${effortDotsHtml}</div>`;

  // R-202605-098: subline discard reason diferenciado para P
  // P descartado por promoción → chip con ref; P descartado manual → razón libre
  const _discardReasonHtml = (isDiscarded && item.discardReason)
    ? isIdea && item.discardRef
      ? `<span class="idea-promoted-chip" onclick="event.stopPropagation();navigateToItem('${esc(item.discardRef)}')" title="Ir al ítem promovido">${esc(item.discardRef)}</span>`
      : `<span class="idea-discard-reason">${esc(item.discardReason)}</span>`
    : isDiscarded && !isIdea && item.discardReason
      ? `<span class="bitem-discard-reason">🗑 ${esc(item.discardReason)}${item.discardRef ? ' · ' + esc(item.discardRef) : ''}</span>`
      : '';

  // Subline (area, sprint, discard reason, missing warning)
  const subline = `<div class="bitem-subline">
    ${item.role ? `<span class="bitem-subline-role" title="Rol responsable">${esc(item.role)}</span>` : ''}
    ${item.role && item.area ? `<span class="bitem-subline-sep">·</span>` : ''}
    ${item.area ? `<span class="bitem-subline-area" title="${esc(item.area)}">${esc(item.area)}</span>` : ''}
    ${item.area && (item.sprint || isIdea) ? `<span class="bitem-subline-sep">·</span>` : ''}
    ${item.sprint ? `<span class="bitem-subline-sprint" title="${esc((() => { const _s = getActiveSprints().find(s => s.id === item.sprint); return _s ? (_s.label || item.sprint) : item.sprint; })())}">${esc((() => { const _s = getActiveSprints().find(s => s.id === item.sprint); return _s ? _s.id : item.sprint; })())}</span>` : (isIdea && !isDone && !isDiscarded ? '<span class="bitem-no-sprint" title="Sin sprint asignado">sin sprint</span>' : '')}
    ${_discardReasonHtml}
    ${missingFields.length ? `<span class="bitem-missing-warn" title="Faltan: ${missingFields.join(', ')}">⚠</span>` : ''}
  </div>`;

  // Type block — the dominant visual element
  const typeBlock = type
    ? `<div class="bitem-type-block bitem-type-${type}">
        <span class="bitem-type-letter">${type}</span>
        <span class="bitem-type-label">${typeLabel}</span>
       </div>`
    : '';

  // R-202605-098: isPromoted — P descartado por promoción (tiene discardRef)
  const isPromoted = isIdea && isDiscarded && !!item.discardRef;
  // R-202605-165: .blf-hidden colapsa ítems fuera del Top-10 con transición 150ms ease-out
  const _blfHiddenClass = item._blfHidden ? ' blf-hidden' : '';
  const _blfAriaHidden  = item._blfHidden ? ' aria-hidden="true"' : '';
  return `<div class="item bitem${isDone ? ' is-done' : ''}${isDiscarded ? ' is-discarded' : ''}${isActive ? ' bitem--active' : ''}${isIdea ? ' bitem--idea' : ''}${isPromoted ? ' bitem--promoted' : ''}${_blfHiddenClass}" data-type="${type}" data-code="${esc(item.code)}"${_blfAriaHidden}>
    <div class="item-header bitem-header" onclick="toggleItemExpand(${globalIdx})">
      ${(!isDone && !isDiscarded && item.sprint) ? `<span class="item-drag-handle" title="Arrastrar para reordenar en sprint" ondragstart="event.stopPropagation()" onclick="event.stopPropagation()">⠿</span>` : ''}
      ${isActive ? '<span class="bitem-activity-dot" title="Actividad reciente — sesión vinculada en los últimos 7 días"></span>' : ''}
      ${typeBlock}
      <div class="bitem-title-col">
        <span class="bitem-code" id="code-badge-${globalIdx}" onclick="copyItemCode(event,'${esc(item.code)}',${globalIdx})" title="Click para copiar ID">${item._focusRank ? `<span class="bitem-focus-rank" title="Posición en Focus">#${item._focusRank}</span> ` : ''}${esc(item.code)}</span>
        <span class="bitem-title"${(!isDone && !isDiscarded) ? ` ondblclick="_inlineEditTitle('${esc(item.code)}',event)" title="Doble click para editar título"` : ''}>${esc(item.title)}</span>${isDiscarded && (!item.title || item.title.trim() === item.code) ? '<span class="bitem-ghost-note" title="Ítem sin título — posiblemente generado por un CHECKPOINT malformado">⚠ ítem fantasma — generado por CHECKPOINT malformado</span>' : ''}
        ${subline}
      </div>
      <button id="copy-item-btn-${esc(item.code)}" class="copy-item-btn" onclick="copyItemToClipboard(event,'${esc(item.code)}')" title="Copiar ítem para sesión FS">⎘</button>
      <span class="bitem-collapse-arrow" id="iarrow-${globalIdx}">▸</span>
      ${headerRight}
    </div>
    <div class="item-body bitem-body" id="ibody-${globalIdx}">
      ${item.notes ? `<div class="bitem-notes-block"><span class="bitem-notes-label">Notas</span><span class="bitem-notes-text">${esc(item.notes)}</span></div>` : ''}
      ${_isBlocked(item) ? `<div class="bitem-missing-row"><span class="badge-missing badge-missing--blocked">⛔ bloqueado — sin cambio de status en más de ${_BLOCKED_DAYS} días</span></div>` : ''}
      ${(!isDone && !isDiscarded && item.sprint && !_hasRecentSession(item)) ? `<div class="bitem-missing-row"><span class="badge-missing badge-missing--idle">💤 sin sesión — sin mención en los últimos ${_NO_SESSION_DAYS} días</span></div>` : ''}
      ${missingAlert}
      <div class="bitem-meta-grid" onclick="event.stopPropagation()">
        <div class="bitem-meta-cell">
          <span class="bitem-meta-label">Status</span>
          <select class="item-status-select bitem-select" onchange="setItemStatus('${esc(item.code)}',this.value)" onclick="event.stopPropagation()">
            <option value="pendiente"${item.status==='pendiente'?' selected':''}>Pendiente</option>
            ${!isIdea ? `<option value="done"${item.status==='done'?' selected':''}>Hecho</option>` : ''}
            <option value="descartado"${item.status==='descartado'?' selected':''}>Descartado</option>
          </select>
        </div>
        ${item.status === 'done' ? `<div class="bitem-meta-cell"><span class="bitem-meta-label">Versión</span><span class="bitem-meta-value mono">${esc(item.version || 'futura')}</span></div>` : ''}
        ${!isIdea ? `<div class="bitem-meta-cell">
          <span class="bitem-meta-label">Esfuerzo</span>
          <div class="bitem-effort-display">
            ${(() => { let d=''; for(let i=0;i<3;i++) d+=`<span class="bitem-effort-dot-sm${i<effortN?' on':''}"></span>`; return d; })()}
            <span class="bitem-effort-num">${item.effort ? item.effort+'/3' : '<span class="effort-missing">—</span>'}</span>
          </div>
        </div>` : ''}
        <div class="bitem-meta-cell">
          <span class="bitem-meta-label">Tipo</span>
          <span class="bitem-meta-value">${typeLabel || '—'}</span>
        </div>
        <div class="bitem-meta-cell" onclick="event.stopPropagation()">
          <span class="bitem-meta-label">Rol</span>
          <select class="item-status-select bitem-select" onchange="setItemRole('${esc(item.code)}',this.value)" class="bitem-select-role">
            <option value="">— Sin rol —</option>
            ${_ECOSYSTEM_ROLES.map(r => `<option value="${esc(r)}"${(item.role||'')=== r?' selected':''}>${esc(r)}</option>`).join('')}
          </select>
        </div>
        <div class="bitem-meta-cell" onclick="event.stopPropagation()">
          <span class="bitem-meta-label">Sprint</span>
          <div id="sprint-select-wrap-${esc(item.code)}">
            <select class="item-status-select bitem-select" onchange="setItemSprint('${esc(item.code)}',this.value)">
              <option value="">— Sin asignar</option>
              ${getActiveSprints().filter(s=>s.status!=='closed').map(s=>`<option value="${esc(s.id)}"${item.sprint===s.id?' selected':''}>${esc(s.label||s.id)}${s.status==='active'?' ★':''}</option>`).join('')}
              ${item.sprint && !getActiveSprints().find(s=>s.id===item.sprint) ? `<option value="${esc(item.sprint)}" selected>${esc(item.sprint)}</option>` : ''}
              <option value="__new__">＋ Nuevo sprint...</option>
            </select>
          </div>
        </div>
        ${(type === 'T' || type === 'B') ? (() => {
          // T-202604-354: solo R pendientes, orden descendente por código, label ID · Título truncado 60 chars
          const rItems = ITEMS
            .filter(i => itemType(i.code) === 'R' && i.status === 'pendiente')
            .sort((a, b) => b.code.localeCompare(a.code));
          const _rLabel = r => { const t = r.title || ''; return r.code + ' · ' + (t.length > 60 ? t.slice(0, 57) + '…' : t); };
          const currentParent = item.parentId ? ITEMS.find(i => i.code === item.parentId) : null;
          const ghostOption = (currentParent && !rItems.find(r => r.code === item.parentId))
            ? '<option value="' + esc(currentParent.code) + '" selected>' + esc(_rLabel(currentParent)) + ' [' + esc(currentParent.status) + ']</option>'
            : '';
          return '<div class="bitem-meta-cell" onclick="event.stopPropagation()">'
            + '<span class="bitem-meta-label">R padre</span>'
            + '<select class="item-status-select bitem-select" onchange="setItemParent(\'' + esc(item.code) + '\',this.value)">'
            + '<option value="">— Sin padre</option>'
            + ghostOption
            + rItems.map(r => '<option value="' + esc(r.code) + '"' + (item.parentId === r.code ? ' selected' : '') + '>' + esc(_rLabel(r)) + '</option>').join('')
            + '</select></div>';
        })() : ''}
      </div>
      ${isIdea ? '' : acHtml}
      ${(() => {
        // R-202604-074: AC Vivo — solo en pendientes con sprint; R-202605-098: nunca en P
        if (isIdea || isDone || isDiscarded || !item.sprint) return '';
        // Sin AC definidos — mensaje + CTA
        if (!item.ac || !item.ac.length) {
          const _emptyId = `acv-panel-empty-${globalIdx}`;
          return `<div class="acv-wrap acv-wrap--empty" id="${_emptyId}">
            <button class="acv-toggle" onclick="event.stopPropagation();_acvToggle('${_emptyId}')" title="Revisión de AC">
              <span class="acv-toggle-arrow">▸</span> Revisión de AC
            </button>
            <div class="acv-body acv-body--hidden">
              <p class="acv-empty-msg">Este ítem no tiene AC — agrega criterios antes de implementar.</p>
              <button class="acv-confirm-btn" onclick="event.stopPropagation();_openItemEditorSafe(null,'${esc(item.code)}')" title="Abrir editor de ítem">✎ Ir a Item Editor</button>
            </div>
          </div>`;
        }
        // Revisar si ya fue confirmado recientemente (< 48h)
        const _acRev = item.acReviewed;
        const _reviewed = _acRev && (Date.now() - _acRev) < 48 * 60 * 60 * 1000;
        // Parser heurístico de ambigüedad
        const _ambigTerms = [
          { re: /tiempo real/i,        desc: '"tiempo real" — define frecuencia o evento exacto' },
          { re: /correctamente/i,      desc: '"correctamente" — sin criterio explícito de corrección' },
          { re: /adecuadamente/i,      desc: '"adecuadamente" — ambiguo sin referencia' },
          { re: /\bfunciona\b/i,       desc: '"funciona" — define qué resultado es válido' },
          { re: /visible\b(?!.*\bcon\b.*\bcontraste\b)/i, desc: '"visible" — sin criterio explícito (contraste, posición, tamaño)' },
          { re: /sin regresi[oó]n(?!\s+en\s+\S)/i, desc: '"sin regresión" — scope no definido' },
        ];
        const _classify = (ac) => {
          if (/click|button|tab|badge|color|layout|css|px|rem|visible|muestra|aparece|oculta/i.test(ac)) return { cls: 'visual', label: 'visual' };
          if (/guarda|persiste|localStorage|storage|calcula|retorna|devuelve|valor/i.test(ac)) return { cls: 'datos', label: 'datos' };
          return { cls: 'funcional', label: 'funcional' };
        };
        const _acRows = item.ac.map((c, ci) => {
          const ambig = _ambigTerms.find(t => t.re.test(c));
          const cat   = _classify(c);
          const rowId = `acv-row-${globalIdx}-${ci}`;
          if (ambig) {
            return `<li class="acv-row acv-row--warn" id="${rowId}">
              <span class="acv-badge acv-badge--warn" title="${esc(ambig.desc)}">⚠</span>
              <span class="acv-text">${esc(c)}</span>
              <button class="acv-clarify-btn" onclick="event.stopPropagation();_acvStartEdit('${rowId}','${esc(item.code)}',${ci})" title="Aclarar este AC">Aclarar</button>
            </li>`;
          }
          return `<li class="acv-row acv-row--ok" id="${rowId}">
            <span class="acv-badge acv-badge--ok acv-badge--${cat.cls}" title="${cat.label}">✓</span>
            <span class="acv-text">${esc(c)}</span>
          </li>`;
        }).join('');
        const _panelId  = `acv-panel-${globalIdx}`;
        const _revClass = _reviewed ? ' acv-reviewed' : '';
        return `<div class="acv-wrap${_revClass}" id="${_panelId}">
          <button class="acv-toggle" onclick="event.stopPropagation();_acvToggle('${_panelId}')" title="Revisión de AC">
            <span class="acv-toggle-arrow">▸</span> Revisión de AC
          </button>
          <div class="acv-body acv-body--hidden">
            <ul class="acv-list">${_acRows}</ul>
            <button class="acv-confirm-btn" onclick="event.stopPropagation();_acvConfirm('${esc(item.code)}','${_panelId}')" title="Marcar revisión como completada">✓ Confirmar y proceder</button>
          </div>
        </div>`;
      })()}
      ${buildItemRefs(item.code)}
      ${type === 'R' ? _buildChildrenBlock(item.code) : ''}
      ${_buildItemTimestamps(item)}
      ${_buildItemOriginBlock(item)}
      ${item.origin ? _buildItemPOriginBlock(item) : ''}
      ${item.migratedFrom ? _buildItemMigratedBlock(item) : ''}
      ${_buildItemMentionedIn(item)}
      <div class="bitem-footer">
        ${isHistorico ? '' : `<button onclick="_openItemEditorSafe(null,'${esc(item.code)}')" class="bitem-edit-btn" title="Editar ítem">✎ Editar</button>`}
        ${(!isHistorico && isIdea && !isDone && !isDiscarded) ? `<button onclick="event.stopPropagation();_promoteItem('${esc(item.code)}')" class="bitem-promote-btn" title="Promover esta posibilidad a Ticket o Requerimiento">⬆ Promover</button>` : ''}
        ${(!isHistorico && type === 'T' && !isDone && !isDiscarded) ? `<button onclick="event.stopPropagation();_promoteTtoR('${esc(item.code)}')" class="bitem-promote-btn" title="Promover Ticket a Requerimiento">⬆ → R</button>` : ''}
        ${(!isHistorico && !isDone && !isDiscarded) ? `<button onclick="event.stopPropagation();_openMigrateItem('${esc(item.code)}')" class="bitem-promote-btn" title="Mover item a otro proyecto">&#x21C4; Mover</button>` : ''}
      </div>
    </div>
  </div>`;
}

// R-[pendiente-ID]: Promover ítem P → T o R con trazabilidad de origen
function _promoteItem(code) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  // R-202604-047: shell estático en index.html — inject content + classList
  const overlay = document.getElementById('promote-modal-overlay');
  if (!overlay) return;
  const body = document.getElementById('promote-modal-body');
  if (body) {
    body.innerHTML = `
      <div class="promote-modal-title">⬆ Promover idea</div>
      <div class="promote-modal-sub">${esc(code)} · ${esc(item.title)}</div>
      <div class="promote-modal-desc">¿A qué tipo quieres promover esta idea?</div>
      <div class="promote-type-btns">
        <button class="promote-type-btn" id="promote-btn-T" onclick="_promoteSelectType('T')">
          <div class="promote-type-letter">T</div>
          <div class="promote-type-name">Ticket</div>
          <div class="promote-type-hint">Tarea técnica concreta</div>
        </button>
        <button class="promote-type-btn" id="promote-btn-R" onclick="_promoteSelectType('R')">
          <div class="promote-type-letter">R</div>
          <div class="promote-type-name">Requerimiento</div>
          <div class="promote-type-hint">Feature o épica con tickets</div>
        </button>
      </div>
      <div class="promote-modal-actions">
        <button onclick="document.getElementById('promote-modal-overlay').classList.remove('open')" class="btn-cancel">Cancelar</button>
        <button id="promote-confirm-btn" onclick="_promoteConfirm('${esc(code)}')" class="btn-primary" disabled>Promover</button>
      </div>`;
  }
  _promoteTargetType = null;
  overlay.classList.add('open');
}

let _promoteTargetType = null;

function _promoteSelectType(type) {
  _promoteTargetType = type;
  ['T', 'R'].forEach(t => {
    const btn = document.getElementById('promote-btn-' + t);
    if (btn) btn.classList.toggle('selected', t === type);
  });
  const confirmBtn = document.getElementById('promote-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = false;
}

function _promoteConfirm(originCode) {
  if (!_promoteTargetType) return;
  const originItem = ITEMS.find(i => i.code === originCode);
  if (!originItem) return;

  const newCode = _getNextItemCode(_promoteTargetType);
  const nowTs = Date.now();

  // Crear ítem hijo con campos heredados + origin
  // R-202605-098: ítem hijo nace sin esfuerzo — el campo no se hereda del P original
  ITEMS.push({
    id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2, 6),
    code: newCode,
    title: originItem.title,
    desc: originItem.desc || '',
    priority: originItem.priority || 'medium',
    area: originItem.area || '',
    effort: null,
    impact: originItem.impact || 'Medio',
    status: 'pendiente',
    version: 'futura',
    sprint: originItem.sprint || '',
    ac: originItem.ac ? [...originItem.ac] : [],
    origin: originCode,
    sessionId: null,
    createdAt: nowTs,
    statusChangedAt: nowTs,
    doneAt: null
  });

  // R-202605-098: P padre → descartado automático con discardReason trazable
  // No requiere acción manual del founder
  originItem.status = 'descartado';
  originItem.statusChangedAt = nowTs;
  originItem.discardReason = 'promovido a ' + _promoteTargetType + ' ' + newCode;
  originItem.discardRef = newCode; // ref al ítem hijo — habilita bitem--promoted chip

  _blogLog('promovido', originCode, originCode + ' → ' + newCode, 'backlog');
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();

  const _pmo = document.getElementById('promote-modal-overlay');
  if (_pmo) _pmo.classList.remove('open');
  _promoteTargetType = null;

  renderBacklogList();
  renderStats();
  showToast('success', `⬆ ${originCode} promovido → ${newCode}`);

  // Navegar al ítem hijo creado
  setTimeout(() => navigateToItem(newCode), 200);
}

// T-202604-236: Promover T → R desde Backlog UI
function _promoteTtoR(code) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  // AC-5: solo en T pendiente o progreso
  if (item.status === 'done' || item.status === 'descartado') return;

  // R-202604-047: shell estático en index.html — inject content + classList
  // DUP-02: usa shell unificado #promote-modal-overlay
  const overlay = document.getElementById('promote-modal-overlay');
  if (!overlay) return;
  const body = document.getElementById('promote-modal-body');
  if (body) {
    body.innerHTML = `
      <div class="promote-modal-title">⬆ Promover Ticket a Requerimiento</div>
      <div class="promote-modal-sub">${esc(code)} · ${esc(item.title)}</div>
      <div class="promote-modal-info">
        Se creará un <strong>R</strong> heredando los campos del T.<br>
        El T origen quedará <strong>descartado</strong> con referencia al R nuevo.
      </div>
      <div class="promote-modal-actions">
        <button onclick="document.getElementById('promote-modal-overlay').classList.remove('open')"
          class="btn-ghost">Cancelar</button>
        <button onclick="_promoteTtoRConfirm('${esc(code)}')" class="btn-primary">⬆ Promover</button>
      </div>`;
  }
  overlay.classList.add('open');
}

function _promoteTtoRConfirm(originCode) {
  const originItem = ITEMS.find(i => i.code === originCode);
  if (!originItem) return;

  const newCode = _getNextItemCode('R');
  const nowTs = Date.now();

  // AC-2: R hereda desc · area · sprint · tags del T origen
  // AC-4: origin del R apunta al T
  ITEMS.push({
    id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2, 6),
    code: newCode,
    title: originItem.title,
    desc: originItem.desc || '',
    priority: originItem.priority || 'medium',
    area: originItem.area || '',
    effort: originItem.effort || 1,
    impact: originItem.impact || 'Medio',
    status: 'pendiente',
    version: 'futura',
    sprint: originItem.sprint || '',
    tags: originItem.tags ? [...originItem.tags] : [],
    ac: [],
    origin: originCode,
    sessionId: null,
    createdAt: nowTs,
    statusChangedAt: nowTs,
    doneAt: null
  });

  // AC-3: T origen → descartado con reason:reemplazado + ref al R nuevo
  originItem.status = 'descartado';
  originItem.statusChangedAt = nowTs;
  originItem.discardReason = 'reemplazado';
  originItem.discardRef = newCode;

  _blogLog('promovido-a-r', originCode, originCode + ' → ' + newCode, 'backlog');
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();

  const overlay = document.getElementById('promote-modal-overlay'); // DUP-02: shell unificado
  if (overlay) overlay.classList.remove('open');

  renderBacklogList();
  renderStats();
  showToast('success', `⬆ ${originCode} promovido → ${newCode}`);

  // Navegar al R creado
  setTimeout(() => navigateToItem(newCode), 200);
}

function copyItemCode(e, code, idx) {
  e.stopPropagation();
  navigator.clipboard.writeText(code).then(() => {
    const el = document.getElementById('code-badge-' + idx);
    if (!el) return;
    const prevText = el.textContent;
    el.classList.add('code-badge--copied');
    el.textContent = '✓ copiado';
    setTimeout(() => {
      el.classList.remove('code-badge--copied');
      el.textContent = prevText;
    }, 1500);
  }).catch(() => {
    // fallback silencioso
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.className = 'clipboard-ghost';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// T-202604-178: copia ítem formateado para sesión FS
function copyItemToClipboard(e, code) {
  e.stopPropagation();
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  const lines = [];

  // Línea 1: código + título
  lines.push(`[${item.code}] ${item.title || ''}`);

  // Línea 2: campos de contexto
  const meta = [`Status: ${item.status || 'pendiente'}`];
  if (item.effort) meta.push(`Effort: ${item.effort}`);
  if (item.area)   meta.push(`Area: ${item.area}`);
  if (item.sprint) meta.push(`Sprint: ${item.sprint}`);
  lines.push(meta.join(' | '));

  // AC
  if (item.ac && item.ac.length) {
    lines.push('');
    lines.push('AC:');
    item.ac.forEach(c => lines.push(`- ${c}`));
  }

  // Notas (desc)
  if (item.desc && item.desc.trim()) {
    lines.push('');
    lines.push(`Notas: ${item.desc.trim()}`);
  }

  // Tags (si el ítem los tiene)
  if (item.tags && item.tags.length) {
    const tagNames = item.tags.map(tid => {
      const t = (state.tags || []).find(t => t.id === tid);
      return t ? t.name : tid;
    });
    lines.push(`Tags: ${tagNames.join(', ')}`);
  }

  const text = lines.join('\n');
  const btnId = `copy-item-btn-${code}`;

  const _feedback = () => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.textContent = '✓';
    btn.classList.add('copy-item-btn--done');
    setTimeout(() => {
      btn.textContent = '⎘';
      btn.classList.remove('copy-item-btn--done');
    }, 1500);
  };

  navigator.clipboard.writeText(text).then(_feedback).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.className = 'clipboard-ghost';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    _feedback();
  });
}

function toggleAc(idx) {
  const list = document.getElementById(`ac-list-${idx}`);
  const arrow = document.getElementById(`ac-arrow-${idx}`);
  if (!list) return;
  list.classList.toggle('open');
  arrow.textContent = list.classList.contains('open') ? '▾' : '▸';
}

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('.f-' + f);
  if (btn) btn.classList.add('active');
  renderBacklogList();
}

function onBacklogSearch() {
  const input = document.getElementById('backlog-search-input');
  backlogSearchQuery = (input ? input.value : '').toLowerCase().trim();
  const clearBtn = document.getElementById('backlog-search-clear');
  if (clearBtn) clearBtn.classList.toggle('visible', !!backlogSearchQuery);
  updateClearFilterBtn();
  renderBacklogList();
  renderStats(); // B-202605-205: actualizar contadores de tipo con búsqueda activa
}

function clearBacklogSearch() {
  const input = document.getElementById('backlog-search-input');
  if (input) input.value = '';
  backlogSearchQuery = '';
  const clearBtn = document.getElementById('backlog-search-clear');
  if (clearBtn) clearBtn.classList.remove('visible');
  updateClearFilterBtn();
  renderBacklogList();
  renderStats(); // B-202605-205: restaurar contadores al limpiar búsqueda
}

function updateBacklogFooter() {
  // T-202604-360: footer fijo colapsable — dos filas: info + filtros accionables
  const footer = document.getElementById('backlog-footer');
  if (!footer) return;

  const d = new Date().toISOString().split('T')[0];
  const closedSprintIds = new Set(getActiveSprints().filter(s => s.status === 'closed').map(s => s.id));
  const countable = ITEMS.filter(i => _isCountableItem(i) && !i.sprint || !closedSprintIds.has(i.sprint));
  const total    = ITEMS.filter(i => _isCountableItem(i)).length;
  const pend     = ITEMS.filter(i => _isCountableItem(i) && i.status === 'pendiente').length;
  const done     = ITEMS.filter(i => _isCountableItem(i) && i.status === 'done').length;
  const pIdeas   = ITEMS.filter(i => itemType(i.code) === 'P' && i.status !== 'descartado').length;
  const byType   = { B: 0, T: 0, R: 0, P: 0 };
  ITEMS.forEach(i => { const t = itemType(i.code); if (t && byType[t] !== undefined) byType[t]++; });
  const activeSp = _getActiveSprint();

  footer.innerHTML = `
    <div class="bl-footer-row bl-footer-row--filters" id="bl-footer-filters">
      <div class="bl-footer-filter-group">
        <span class="bl-filter-label">Tipo</span>
        ${[['B','Bug'],['T','Ticket'],['R','Req'],['P','Pos.']].map(([t,l]) =>
          `<button class="bl-filter-chip bl-fc-type-${t}${activeTypes.has(t) ? ' active' : ''}" onclick="toggleTypeFilter('${t}')" title="${l}">${t} <span>${byType[t]}</span></button>`
        ).join('')}
      </div>
      <div class="bl-footer-filter-group">
        <span class="bl-filter-label">Status</span>
        <button class="bl-filter-chip${activeStatuses.has('pendiente') ? ' active' : ''}" onclick="toggleStatusFilter('pendiente')">Pendiente <span>${pend}</span></button>
        <button class="bl-filter-chip${activeStatuses.has('done') ? ' active' : ''}" onclick="toggleStatusFilter('done')">Done <span>${done}</span></button>
      </div>
      <div class="bl-footer-filter-group">
        <span class="bl-filter-label">Esfuerzo</span>
        ${[1,2,3].map(e => {
          const cnt = ITEMS.filter(i => (parseInt(i.effort)||1) === e).length;
          return `<button class="bl-filter-chip${activeEfforts.has(e) ? ' active' : ''}" onclick="toggleEffortFilter(${e})" title="Effort ${e}">E${e} <span>${cnt}</span></button>`;
        }).join('')}
      </div>
      <button class="bl-footer-clear" onclick="clearAllFilters()" title="Limpiar todos los filtros">✕ Limpiar</button>
    </div>
  `;

  // restaurar estado colapsado si aplica
  if (_blFooterCollapsed) {
    const filtersRow = document.getElementById('bl-footer-filters');
    const toggleBtn  = document.getElementById('bl-footer-toggle');
    if (filtersRow) filtersRow.classList.add('bl-footer-row--hidden');
    if (toggleBtn)  toggleBtn.textContent = '▼';
  }
}

// B-202604-198: Helper — detecta si un code es placeholder (nunca matchear contra backlog)
function _isPlaceholderCode(code) {
  if (!code) return true;
  if (code === '[pendiente-ID]') return true;
  if (/^\[tmp:[a-z0-9_-]+\]$/i.test(code)) return true;
  return false;
}

// B-202604-198: Helper — busca ítem existente cuyo title es similar a un [tmp:slug]
// Retorna { item, score } o null. Solo sugiere — nunca aplica automáticamente.
function _findTmpMatch(tmpCode, desc, existingItems) {
  if (!desc) return null;
  const needle = desc.trim().toLowerCase();
  let best = null, bestScore = 0;
  existingItems.forEach(item => {
    const haystack = (item.title || '').trim().toLowerCase();
    if (!haystack) return;
    // Similitud: palabras en común / total palabras
    const needleWords = needle.split(/\s+/);
    const haystackWords = haystack.split(/\s+/);
    const common = needleWords.filter(w => w.length > 3 && haystackWords.includes(w)).length;
    const score = common / Math.max(needleWords.length, haystackWords.length);
    if (score > 0.5 && score > bestScore) { best = item; bestScore = score; }
  });
  return best ? { item: best, score: bestScore } : null;
}

// ── T-098: Merge TRACKER-GLOBAL → ITEMS en memoria ──
// Llamado desde saveSession(). Acumula múltiples sesiones sin exportar.
// T-202604-121: retorna {created, updated, ignored} para super toast
function mergeBacklogFromTG(tgItems, sessionId, opts) {
  if (!tgItems || !tgItems.length) return { created:[], advanced:[], retroceso:[], discarded:[], updated:[], ignored:[], createdAndClosed:[], tmpSuggestions:[] };
  const _dryRun = !!(opts && opts.dryRun);

  // B-202604-198: Separar placeholders ANTES de _assignPendingIds para preservar su naturaleza.
  // Los placeholders siempre son ítems nuevos — nunca matchean contra el backlog.
  // _assignPendingIds se aplica solo a los que tienen type char válido (P/T/R/B) y código real.
  tgItems = _assignPendingIds(tgItems);

  let changed = false;
  const created = [], advanced = [], retroceso = [], discarded = [], updated = [], ignored = [];
  // B-202604-198: grupo propio para ítems que nacen y cierran en el mismo CHECKPOINT
  const createdAndClosed = [];
  // B-202604-198: sugerencias de match [tmp:slug] → ID real existente (para confirmación del usuario)
  const tmpSuggestions = [];

  // Orden de avance: pendiente < done < descartado (descartado solo vía confirmación)
  const _statusRank = { pendiente: 0, done: 1, descartado: 2 };

  // B-202605-007: snapshot antes de cualquier mutación — incluye cierre automático de P padre
  if (!_dryRun) _undoSnapshot();

  tgItems.forEach(item => {
    if (!item.code) return;
    if (item._invalidType) { ignored.push({ code: item.code || '[sin-código]', reason: 'tipo-invalido', desc: item.desc }); return; }
    if (item._duplicate) {
      // B-202605-XXX: ítem duplicado (título matchea existente via _assignPendingIds) —
      // aunque se ignore para status/creación, si trae AC se mergean sobre el existente.
      if (item.ac && item.ac.length && item._existingCode && !_dryRun) {
        const dupExisting = ITEMS.find(i => i.code === item._existingCode);
        if (dupExisting) {
          dupExisting.ac = item.ac;
          _acReplacedSet.add(dupExisting.id);
          if (sessionId && dupExisting.sessionId !== sessionId) dupExisting.sessionId = sessionId;
          if (!dupExisting.history) dupExisting.history = [];
          dupExisting.history.push({ type: 'field', ts: Date.now(), origin: 'checkpoint', sessionId: sessionId || null, data: { field: 'ac', from: null, to: item.ac } });
          changed = true;
        }
      }
      ignored.push({ code: '[pendiente-ID]', reason: 'duplicado', desc: item.desc, existingCode: item._existingCode || '' });
      return;
    }

    // B-202604-198: REGLA DE PLACEHOLDER — forzar rama "nuevo" sin intentar match
    // Un [tmp:slug] o [pendiente-ID] NUNCA matchea contra ITEMS existentes.
    // Nota: _assignPendingIds ya habrá convertido [pendiente-ID] con type char real si tiene
    // suficiente info; si no pudo (sin type), sigue siendo placeholder.
    const isPlaceholder = _isPlaceholderCode(item.code);

    // B-202604-198: REGLA DE TMP — detectar si [tmp:slug] corresponde a un ID real existente
    // por similitud de título. Si hay match potencial, registrar sugerencia y NO crear duplicado.
    if (isPlaceholder && /^\[tmp:[a-z0-9_-]+\]$/i.test(item.code)) {
      const tmpMatch = _findTmpMatch(item.code, item.desc, ITEMS);
      if (tmpMatch) {
        tmpSuggestions.push({
          tmpCode: item.code,
          desc: item.desc,
          suggestedCode: tmpMatch.item.code,
          suggestedTitle: tmpMatch.item.title || tmpMatch.item.desc,
          score: tmpMatch.score
        });
        // No crear duplicado — el usuario confirma el match en el panel
        return;
      }
    }

    // B-202604-198: si es placeholder, saltar directamente a rama "nuevo"
    const existing = isPlaceholder ? null : ITEMS.find(i => i.code === item.code);
    if (existing) {
      const newStatus = _tgStatusToBacklog(item.status);
      const oldStatus = existing.status || 'pendiente';
      const changes = [];

      // --- Lógica de status ---
      if (!item._noStatus && newStatus && newStatus !== oldStatus) {
        const oldRank = _statusRank[oldStatus] ?? 0;
        const newRank = _statusRank[newStatus] ?? 0;

        if (newStatus === 'descartado') {
          // Descarte: encolar para confirmación — no persistir todavía
          discarded.push({ code: item.code, desc: item.desc || existing.title, from: oldStatus, reason: item.discardReason || existing.discardReason || '', ref: item.discardRef || existing.discardRef || '' });
          // No tocar existing todavía — se aplica en _confirmDiscard()
        } else if (newRank > oldRank) {
          // Avance: aplicar directo (no en dryRun)
          changes.push({ field: 'status', from: oldStatus, to: newStatus }); // T-202604-414
          if (!_dryRun) {
            existing.status = newStatus;
            existing.statusChangedAt = Date.now();
            if (newStatus === 'done' && !existing.doneAt) existing.doneAt = Date.now();
            _blogLog('ckpt-avance', item.code, oldStatus + ' → ' + newStatus, 'backlog');
            changed = true;
          }
          advanced.push({ code: item.code, desc: item.desc || existing.title, from: oldStatus, to: newStatus });
        } else {
          // Retroceso: encolar para confirmación — no persistir todavía
          retroceso.push({ code: item.code, desc: item.desc || existing.title, from: oldStatus, to: newStatus });
          // No tocar existing todavía — se aplica en _confirmRetroceso()
        }
      }

      // --- Resto de campos: entrante gana si trae valor (vacíos no degradan) ---
      // T-202604-414: changes es array de {field, from, to} para diff inline en panel
      if (item.desc && item.desc !== existing.desc) { changes.push({ field: 'desc', from: existing.desc || '—', to: item.desc }); if (!_dryRun) { existing.desc = item.desc; changed = true; } }
      if (item.effort && item.effort !== existing.effort) { changes.push({ field: 'effort', from: existing.effort || '—', to: item.effort }); if (!_dryRun) { existing.effort = item.effort; changed = true; } }
      if (item.area && item.area !== existing.area) { changes.push({ field: 'area', from: existing.area || '—', to: item.area }); if (!_dryRun) { existing.area = item.area; changed = true; } }
      // B-202605-233: sprint vacío explícito ('' ) mueve ítem a Ideas — antes se ignoraba por falsy
      if (item.sprint !== undefined && item.sprint !== existing.sprint) { changes.push({ field: 'sprint', from: existing.sprint || '—', to: item.sprint }); if (!_dryRun) { existing.sprint = item.sprint; changed = true; } }
      // B-202604-179: ac: reemplaza si entrante trae contenido — no acumula entre CHECKPOINTs
      if (item.ac && item.ac.length) {
        changes.push({ field: 'ac', from: existing.ac || [], to: item.ac });
        if (!_dryRun) { existing.ac = item.ac; _acReplacedSet.add(existing.id); changed = true; }
      }
      // AC-4: role entrante gana si trae valor; si vacío no degrada el existente
      if (item.role && item.role !== existing.role) { changes.push({ field: 'role', from: existing.role || '—', to: item.role }); if (!_dryRun) { existing.role = item.role; changed = true; } }
      // parentId: entrante gana si trae valor; si vacío no degrada el existente
      if (item.parentId && item.parentId !== existing.parentId) { changes.push({ field: 'parentId', from: existing.parentId || '—', to: item.parentId }); if (!_dryRun) { existing.parentId = item.parentId; changed = true; } }
      // origin: entrante gana si trae valor; si vacío no degrada el existente
      if (item.origin && item.origin !== existing.origin) { changes.push({ field: 'origin', from: existing.origin || '—', to: item.origin }); if (!_dryRun) { existing.origin = item.origin; changed = true; } }
      // notes: entrante gana si trae valor; si vacío no degrada el existente
      if (item.notes && item.notes !== existing.notes) { changes.push({ field: 'notes', from: existing.notes || '—', to: item.notes }); if (!_dryRun) { existing.notes = item.notes; changed = true; } }
      // discardReason / discardRef
      if (item.discardReason && item.discardReason !== existing.discardReason) { changes.push({ field: 'discardReason', from: existing.discardReason || '—', to: item.discardReason }); if (!_dryRun) { existing.discardReason = item.discardReason; changed = true; } }
      if (item.discardRef    && item.discardRef    !== existing.discardRef)    { changes.push({ field: 'discardRef',    from: existing.discardRef    || '—', to: item.discardRef    }); if (!_dryRun) { existing.discardRef    = item.discardRef;    changed = true; } }
      // T-202604-288: blockedBy — append con dedup
      if (item.blockedBy && item.blockedBy.length) {
        const existingBB = existing.blockedBy || [];
        const newBB = item.blockedBy.filter(c => !existingBB.includes(c));
        if (newBB.length) { changes.push({ field: 'blockedBy', from: existingBB.join(', ') || '—', to: [...existingBB, ...newBB].join(', ') }); if (!_dryRun) { existing.blockedBy = [...existingBB, ...newBB]; changed = true; } }
      }
      // R-202604-051: blocking
      if (item.blocking === true && !existing.blocking) { changes.push({ field: 'blocking', from: '—', to: 'true' }); if (!_dryRun) { existing.blocking = true; changed = true; } }
      // Estampar sessionId siempre que venga uno (CHECKPOINT más reciente gana)
      if (!_dryRun && sessionId && existing.sessionId !== sessionId) { existing.sessionId = sessionId; changed = true; }

      // T-202604-423: registrar cambios de merge en history[] con origin 'checkpoint'
      // B-202605-241: origin era 'import' — corregido a 'checkpoint' para display correcto en timeline
      if (!_dryRun && changes.length) {
        if (!existing.history) existing.history = [];
        const importTs = Date.now();
        changes.forEach(ch => {
          // status ya se registra en setItemStatus — aquí solo los demás campos
          if (ch.field === 'status') return;
          existing.history.push({
            type: 'field',
            ts: importTs,
            origin: 'checkpoint',
            sessionId: sessionId || null,
            data: { field: ch.field, from: ch.from !== '—' ? ch.from : null, to: ch.to || null }
          });
        });
      }

      if (changes.length) {
        if (!advanced.find(a => a.code === item.code)) {
          // T-202604-414: emitir changes array estructurado + change string para backward compat
          updated.push({ code: item.code, desc: item.desc || existing.title, changes, change: changes.map(c => c.field).join(' · ') });
        }
      } else if (!advanced.find(a => a.code === item.code) && !retroceso.find(r => r.code === item.code) && !discarded.find(d => d.code === item.code)) {
        // Distinguir: ya tenía ese status (ok) vs no hubo cambio de status porque no llegó uno válido
        const noStatusIncoming = !item.status || _normalizeStatus(item.status) === 'pendiente'; // B-202605-042: comparación canónica — normStatus() retorna 'pendiente', no '📤 Pendiente'
        const alreadyInStatus = newStatus === oldStatus;
        if (alreadyInStatus && !noStatusIncoming) {
          ignored.push({ code: item.code, reason: 'ya-en-status', desc: existing.title, status: oldStatus });
        } else if (noStatusIncoming) {
          ignored.push({ code: item.code, reason: 'sin-status', desc: existing.title });
        } else {
          ignored.push({ code: item.code, reason: 'sin-cambios', desc: existing.title });
        }
      }
    } else {
      // AC-9: ítem nuevo — marcar si no tenía código real
      const isNew = item._wasAssigned;
      const nowTs = Date.now();
      const initialStatus = _tgStatusToBacklog(item.status) || 'pendiente';
      // B-202604-015: heredar sprint del padre si el ítem no trae sprint propio
      const _parentSprint = (!item.sprint && item.parentId)
        ? (ITEMS.find(p => p.code === item.parentId) || {}).sprint || ''
        : '';
      if (!_dryRun) {
        ITEMS.push({
          id: 'item-' + nowTs + '-' + Math.random().toString(36).slice(2,6),
          code: item.code,
          title: item.desc || item.code,
          desc: '',
          priority: 'medium',
          area: item.area || '',
          effort: item.effort || 1,
          impact: 'Medio',
          status: initialStatus,
          version: 'futura',
          sprint: item.sprint || _parentSprint,
          ac: item.ac || [],
          role: item.role || '',
          origin: item.origin || null,
          blockedBy: item.blockedBy || [],
          blocking: item.blocking || false,
          sessionId: sessionId || null,
          createdAt: nowTs,
          statusChangedAt: nowTs,
          doneAt: initialStatus === 'done' ? nowTs : null
        });
        _blogLog('ckpt-creado', item.code, item.desc || '', 'backlog');
        changed = true;

        // R-[pendiente-ID]: si el nuevo ítem tiene origin → cerrar automáticamente el P padre
        if (item.origin) {
          const pParent = ITEMS.find(p => p.code === item.origin);
          if (pParent && pParent.status !== 'done') {
            pParent.status = 'done';
            pParent.doneAt = pParent.doneAt || nowTs;
            pParent.statusChangedAt = nowTs;
            pParent.discardRef = item.code;
            _blogLog('ckpt-promovido', item.origin, item.origin + ' → ' + item.code, 'backlog');
          }
        }
      }
      // B-202604-198: si el ítem nace con status done en el mismo CHECKPOINT → grupo propio
      const initialStatusForGroup = _tgStatusToBacklog(item.status) || 'pendiente';
      if (initialStatusForGroup === 'done') {
        createdAndClosed.push({ code: item.code, desc: item.desc, _wasAssigned: isNew });
      } else {
        created.push({ code: item.code, desc: item.desc, _wasAssigned: isNew });
      }
    }
    // Actualizar contadores en backlog-meta (no en dryRun)
    if (!_dryRun) {
      const typeChar = item.code[0];
      if ('PTRB'.includes(typeChar)) {
        const numMatch = item.code.match(/[PTRB]-\d{6}-(\d{3})/);
        if (numMatch) {
          const num = parseInt(numMatch[1]);
          const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
          if (!meta.counters) meta.counters = { P:0, T:0, R:0, B:0 };
          if (num > (meta.counters[typeChar] || 0)) {
            meta.counters[typeChar] = num;
            localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
          }
        }
      }
    }
  });

  if (!_dryRun && changed) {
    saveBacklog(); // B-202605-007: _undoSnapshot() movido antes del forEach
    _setBacklogModified();
    renderStats(); // siempre actualizar stat bar aunque no estemos en tab Backlog
    if (currentTab === 'backlog') { renderBacklogList(); updateBacklogBanner(); }
  }
  return { created, advanced, retroceso, discarded, updated, ignored, createdAndClosed, tmpSuggestions };
}

// T-202604-201: Panel de confirmación post-paste con diff visual del merge
// Hace dry-run del merge, muestra el panel, y en "Aplicar" ejecuta onApply() que
// realiza el merge real + resto del flujo de guardado de sesión.
// R-202604-071: Merge Diff Panel — rediseño visual y funcional completo
// Two-column layout: secciones (izq, scroll) + panel sticky (der, resumen + acciones)
// Sticky section headers · secciones colapsables · summary chips con jump
// Toast de éxito con conteo real · cancelado silencioso (sin toast)
function showMergeDiffPanel(tgItems, sessId, projId, onApply) {
  if (!tgItems || !tgItems.length) { onApply(); return; }

  // Dry-run: obtener diff sin mutar ITEMS
  const _prevFilter = localStorage.getItem('current-project-filter') || '';
  const _filterChanged = projId && projId !== _prevFilter;
  if (_filterChanged) {
    localStorage.setItem('current-project-filter', projId);
    if (typeof loadBacklog === 'function') loadBacklog();
  }
  let diff;
  try {
    diff = mergeBacklogFromTG(tgItems, sessId, { dryRun: true });
  } finally {
    if (_filterChanged) {
      // B-202605-010: restaurar filter antes de loadBacklog — si loadBacklog lanza, el filter ya está restaurado
      if (_prevFilter) localStorage.setItem('current-project-filter', _prevFilter);
      else localStorage.removeItem('current-project-filter');
      try {
        if (typeof loadBacklog === 'function') loadBacklog();
      } catch (e) {
        console.error('[AI Tracker] showMergeDiffPanel: loadBacklog falló en finally — filter restaurado, backlog puede estar desactualizado.', e);
        if (typeof showToast === 'function') showToast({ title: 'Error al restaurar backlog', body: 'Recarga la página.', type: 'error' });
      }
    }
  }

  const total = diff.created.length + diff.advanced.length + diff.updated.length +
                diff.retroceso.length + diff.discarded.length + diff.ignored.length +
                diff.createdAndClosed.length + diff.tmpSuggestions.length;

  const _criticalReasons = ['duplicado', 'sin-status', 'tipo-invalido'];
  const _hasCriticalIgnored = (diff.ignored || []).some(i => _criticalReasons.includes(i.reason));

  // B-202605-500: sprints asignados desde el DIFF a ítems nuevos (aún no existen en ITEMS durante dryRun)
  const _mdiffPendingSprints = {}; // { [code]: sprintId }

  if (total === 0 && !_hasCriticalIgnored) { onApply(); return; }

  // ── Helpers de renderizado ──
  // R-202605-148: pill corto B/T/R/P — letra única con color semántico en .mdiff-type-badge
  const _typeName  = { B: 'B', T: 'T', R: 'R', P: 'P' };
  // R-202605-148: clase CSS por tipo — hex fijos de identidad del backlog
  const _typeClass = { B: 'mdiff-type--b', T: 'mdiff-type--t', R: 'mdiff-type--r', P: 'mdiff-type--p' };
  // R-202605-148: orden canónico B → R → T → P para sort dentro de sección
  const _typeOrder = { B: 0, R: 1, T: 2, P: 3 };

  const _pill = (cls, label) =>
    `<span class="mdiff-pill mdiff-pill--${cls}">${label}</span>`;

  // R-202605-148: select de sprint inline — persiste via _mdiffSetItemSprint sin re-render del DIFF
  const _sprintSelect = (code) => {
    const openSprints = (typeof getActiveSprints === 'function')
      ? getActiveSprints().filter(s => s.status !== 'closed')
      : [];
    const item = ITEMS.find(i => i.code === code);
    const rawSprint = item ? (item.sprint || '') : '';
    // R-202605-148 AC: si el sprint asignado ya no existe, mostrar 'Sin sprint' como fallback
    const sprintExists = rawSprint && openSprints.some(s => s.id === rawSprint);
    const currentSprint = sprintExists ? rawSprint : '';
    const options = openSprints.map(s =>
      `<option value="${esc(s.id)}" ${currentSprint === s.id ? 'selected' : ''}>${esc(s.label || s.id)}</option>`
    ).join('');
    return `<select class="mdiff-sprint-select" data-item-code="${esc(code)}"
      onchange="_mdiffSetItemSprint(this)"
      onclick="event.stopPropagation()">
      <option value="" ${!currentSprint ? 'selected' : ''}>Sin sprint</option>
      ${options}
      <option value="__new__">＋ Nuevo sprint...</option>
    </select>`;
  };

  const _card = (code, desc, accentClass, pillsHtml, extraHtml = '') => {
    const typeChar  = (code || '?')[0].toUpperCase();
    const typeCls   = _typeClass[typeChar] || 'mdiff-type--unknown';
    // R-202605-148: ítem sin tipo declarado muestra '?' — no rompe el render
    const typeName  = _typeName[typeChar]  || '?';
    return `
    <div class="mdiff-card mdiff-card--${accentClass} ${typeCls}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(code)}</span>
          ${pillsHtml}
          ${_sprintSelect(code)}
        </div>
        <div class="mdiff-desc">${esc(desc || '')}</div>
        ${extraHtml}
      </div>
    </div>`;
  };

  // ── Fila de retroceso ──
  const _retrocedoRow = (i, idx) => {
    const typeChar = (i.code || '?')[0].toUpperCase();
    const typeCls  = _typeClass[typeChar] || 'mdiff-type--unknown';
    // R-202605-148: ítem sin tipo declarado muestra '?'
    const typeName = _typeName[typeChar]  || '?';
    return `
    <div class="mdiff-card mdiff-card--warn mdiff-card--retroceso ${typeCls}" data-retroceso-idx="${idx}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(i.code)}</span>
          ${_pill('retroceso', `${esc(i.from)} → ${esc(i.to)}`)}
          ${_sprintSelect(i.code)}
        </div>
        <div class="mdiff-desc">${esc(i.desc || '')}</div>
      </div>
    </div>`;
  };

  // ── Fila de descarte ──
  const _DISCARD_REASONS = ['duplicado', 'fuera de alcance', 'reemplazado', 'obsoleto'];
  const _discardRow = (i, idx) => {
    const typeChar  = (i.code || '?')[0].toUpperCase();
    const typeCls   = _typeClass[typeChar] || 'mdiff-type--unknown';
    // R-202605-148: ítem sin tipo declarado muestra '?'
    const typeName  = _typeName[typeChar]  || '?';
    const hasReason = !!(i.reason);
    const reasonHtml = hasReason
      ? `<span class="mdiff-discard-reason-pill">${esc(i.reason)}${i.ref ? ' · ' + esc(i.ref) : ''}</span>`
      : '';
    return `
    <div class="mdiff-card mdiff-card--red mdiff-card--discard ${typeCls}" data-discard-idx="${idx}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(i.code)}</span>
          ${_pill('discarded', 'descartado')}
          ${reasonHtml}
          ${_sprintSelect(i.code)}
        </div>
        <div class="mdiff-desc">${esc(i.desc || '')}</div>
      </div>
    </div>`;
  };

  // R-202605-148: sort B→R→T→P dentro de un array de ítems del DIFF
  const _sortByType = arr => [...arr].sort((a, b) => {
    const ca = (a.code || '?')[0].toUpperCase();
    const cb = (b.code || '?')[0].toUpperCase();
    return (_typeOrder[ca] ?? 99) - (_typeOrder[cb] ?? 99);
  });

  // ── Construir secciones con IDs para jump ──
  const _section = (id, accentClass, titleHtml, rows, collapsed = false) => `
    <div class="mdiff-section" id="mdiff-sec-${id}">
      <button class="mdiff-section-header mdiff-section-header--${accentClass}${collapsed ? ' is-collapsed' : ''}"
              onclick="_mdiffToggleSection(this)" type="button">
        <span class="mdiff-section-chevron">▾</span>
        <span>${titleHtml}</span>
      </button>
      <div class="mdiff-section-body${collapsed ? ' is-hidden' : ''}">${rows}</div>
    </div>`;

  let sectionsHtml = '';

  if (diff.created.length) {
    const rows = _sortByType(diff.created).map(i => _card(i.code, i.desc, 'green', _pill('created', '＋ creado'))).join('');
    sectionsHtml += _section('created', 'green', `Creados <span class="mdiff-sec-count">${diff.created.length}</span>`, rows);
  }
  // B-202604-198: ítems que nacen y cierran en el mismo CHECKPOINT — grupo diferenciado
  if (diff.createdAndClosed.length) {
    const rows = _sortByType(diff.createdAndClosed).map(i => _card(
      i.code, i.desc, 'green',
      _pill('created', '＋ creado') + _pill('advanced', 'pendiente → done'),
      `<div class="mdiff-change-hint">Creado y cerrado en esta sesión</div>`
    )).join('');
    sectionsHtml += _section('created-and-closed', 'green', `Creados y cerrados <span class="mdiff-sec-count">${diff.createdAndClosed.length}</span>`, rows);
  }
  // B-202604-198: sugerencias de match [tmp:slug] → ID real existente
  if (diff.tmpSuggestions.length) {
    const rows = _sortByType(diff.tmpSuggestions).map(i => _card(
      i.tmpCode, i.desc, 'warn',
      _pill('warn', '⚠ tmp sin match aplicado'),
      `<div class="mdiff-change-hint">Posible coincidencia: <strong>${esc(i.suggestedCode)}</strong> — ${esc(i.suggestedTitle)}</div>
       <div class="mdiff-change-hint" style="color:var(--text2);font-size:0.8em">Confirma manualmente en el backlog si corresponde al mismo ítem.</div>`
    )).join('');
    sectionsHtml += _section('tmp-suggestions', 'warn', `⚠ TMP sin match confirmado <span class="mdiff-sec-count">${diff.tmpSuggestions.length}</span>`, rows);
  }
  if (diff.advanced.length) {
    const rows = _sortByType(diff.advanced).map(i => _card(i.code, i.desc, 'blue', _pill('advanced', `${esc(i.from)} → ${esc(i.to)}`))).join('');
    sectionsHtml += _section('advanced', 'blue', `Avance de status <span class="mdiff-sec-count">${diff.advanced.length}</span>`, rows);
  }
  if (diff.updated.length) {
    const rows = _sortByType(diff.updated).map(i => _card(i.code, i.desc, 'accent',
      _pill('updated', '✎ actualizado'),
      `<div class="mdiff-change-hint">${esc(i.change)}</div>`
    )).join('');
    sectionsHtml += _section('updated', 'accent', `Campos actualizados <span class="mdiff-sec-count">${diff.updated.length}</span>`, rows);
  }
  if (diff.retroceso.length) {
    const rows = _sortByType(diff.retroceso).map((i, idx) => _retrocedoRow(i, idx)).join('');
    sectionsHtml += _section('retroceso', 'warn', `⚠ Retrocesos <span class="mdiff-sec-count">${diff.retroceso.length}</span>`, rows);
  }
  if (diff.discarded.length) {
    const rows = _sortByType(diff.discarded).map((i, idx) => _discardRow(i, idx)).join('');
    sectionsHtml += _section('discarded', 'red', `🗑 Descartes <span class="mdiff-sec-count">${diff.discarded.length}</span>`, rows);
  }
  if (diff.ignored.length) {
    const ignoredCritical = diff.ignored.filter(i => _criticalReasons.includes(i.reason));
    const ignoredOk       = diff.ignored.filter(i => !_criticalReasons.includes(i.reason));
    if (ignoredCritical.length) {
      const rows = _sortByType(ignoredCritical).map(i => {
        let pill, hint = '';
        if (i.reason === 'duplicado')     { pill = _pill('warn', '⚠ duplicado'); hint = i.existingCode ? `<div class="mdiff-change-hint">existe como ${esc(i.existingCode)}</div>` : ''; }
        else if (i.reason === 'sin-status')    { pill = _pill('warn', '⚠ sin status'); }
        else if (i.reason === 'tipo-invalido') { pill = _pill('warn', '⚠ tipo inválido'); }
        return _card(i.code, i.desc, 'warn', pill, hint);
      }).join('');
      sectionsHtml += _section('attention', 'warn', `⚠ Requieren atención <span class="mdiff-sec-count">${ignoredCritical.length}</span>`, rows);
    }
    if (ignoredOk.length) {
      const rows = _sortByType(ignoredOk).map(i => _card(i.code, i.desc, 'muted', _pill('ignored', 'sin cambios'))).join('');
      // Sin cambios colapsado por defecto
      sectionsHtml += _section('unchanged', 'muted', `Sin cambios <span class="mdiff-sec-count">${ignoredOk.length}</span>`, rows, true);
    }
  }

  // ── Inyectar en shell ──
  const overlay = document.getElementById('merge-diff-overlay');
  if (!overlay) return;
  const header      = document.getElementById('merge-diff-header');
  const body        = document.getElementById('merge-diff-body');
  const footer      = document.getElementById('merge-diff-footer');
  const summaryChips = document.getElementById('mdiff-summary-chips');
  const pendingList  = document.getElementById('mdiff-pending-list');

  // Header: título + contexto de paso
  if (header) {
    const projName = (typeof getActiveProject === 'function' && getActiveProject())
      ? getActiveProject().name : '';
    header.innerHTML = `
      <div class="mdiff-header-inner">
        <div class="mdiff-header-left">
          <div class="mdiff-step-label">Guardar sesión</div>
          <div class="mdiff-header-title">Revisión de cambios${projName ? ` · <span class="mdiff-proj-name">${esc(projName)}</span>` : ''}</div>
        </div>
        <div class="mdiff-header-total">${total} ítem${total !== 1 ? 's' : ''}</div>
      </div>`;
  }

  // Body: secciones
  if (body) {
    body.innerHTML = sectionsHtml;
  }

  // Summary chips: clickeables con jump a sección
  const _chipDefs = [
    { key: 'created',           id: 'created',           label: 'creados',            cls: 'green',  count: diff.created.length },
    { key: 'createdAndClosed',  id: 'created-and-closed', label: 'creados y cerrados', cls: 'green', count: diff.createdAndClosed.length },
    { key: 'advanced',          id: 'advanced',          label: 'avances',            cls: 'blue',   count: diff.advanced.length },
    { key: 'updated',           id: 'updated',           label: 'actualizados',       cls: 'accent', count: diff.updated.length },
    { key: 'retroceso',         id: 'retroceso',         label: 'retrocesos',         cls: 'warn',   count: diff.retroceso.length },
    { key: 'discarded',         id: 'discarded',         label: 'descartes',          cls: 'red',    count: diff.discarded.length },
    { key: 'tmpSuggestions',    id: 'tmp-suggestions',   label: 'tmp sin match',      cls: 'warn',   count: diff.tmpSuggestions.length },
    { key: 'unchanged',         id: 'unchanged',         label: 'sin cambios',        cls: 'muted',  count: diff.ignored.filter(i => !_criticalReasons.includes(i.reason)).length },
  ];

  if (summaryChips) {
    summaryChips.innerHTML = _chipDefs
      .filter(c => c.count > 0)
      .map(c => `<button class="mdiff-sum-chip mdiff-sum-chip--${c.cls}"
          onclick="_mdiffJumpTo('${c.id}')" type="button">
          <span class="mdiff-sum-count">${c.count}</span>
          <span class="mdiff-sum-label">${c.label}</span>
        </button>`).join('');
  }

  // Helper: toggle sección
  window._mdiffToggleSection = function(btn) {
    const body = btn.nextElementSibling;
    const collapsed = btn.classList.toggle('is-collapsed');
    body.classList.toggle('is-hidden', collapsed);
  };

  // Helper: jump a sección
  window._mdiffJumpTo = function(secId) {
    const el = document.getElementById('mdiff-sec-' + secId);
    if (!el) return;
    // Si está colapsada, expandir
    const headerBtn = el.querySelector('.mdiff-section-header');
    const secBody   = el.querySelector('.mdiff-section-body');
    if (headerBtn && headerBtn.classList.contains('is-collapsed')) {
      headerBtn.classList.remove('is-collapsed');
      secBody.classList.remove('is-hidden');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // R-202605-148: persistir sprint desde select inline del DIFF sin re-render del panel
  window._mdiffSetItemSprint = function(sel) {
    const code = sel.dataset.itemCode;
    if (!code) return;
    const val = sel.value;
    if (val === '__new__') {
      // Revertir select a valor actual antes de reemplazarlo con el mini-form
      sel.value = (ITEMS.find(i => i.code === code) || {}).sprint || '';
      _mdiffOpenNewSprintForm(sel, code);
      return;
    }
    _mdiffPersistSprint(code, val);
  };

  // R-202605-148: mini-formulario inline — reemplaza el select en la card
  // Campos: nombre, goal (opcional), version_target, release_type
  function _mdiffOpenNewSprintForm(sel, code) {
    const suggestedRt = _suggestReleaseType(ITEMS.filter(i => i.sprint === code));
    const suggestedVt = _suggestVersionTarget(suggestedRt);

    // T-202605-500: mostrar ID auto-generado como prefijo no editable
    const _mdiffPreviewId = _nextSprintId();
    const _mdiffConfirmId = 'mdiff-sprint-confirm-' + code;
    // R-202605-009: radio buttons para release_type con label visible
    const rtRadios = ['Major', 'Minor', 'Patch'].map(v =>
      `<label class="sprint-inline-release-label">
        <input type="radio" name="mdiff-sprint-rt-${esc(code)}" value="${v}"
          ${suggestedRt === v ? 'checked' : ''}
          onchange="_mdiffSyncConfirmBtn('${esc(code)}');_clearSprintFieldErr('mdiff-sprint-rt-err-${esc(code)}')">
        ${v}
      </label>`
    ).join('');
    const wrap = document.createElement('div');
    wrap.className = 'mdiff-new-sprint-form';
    wrap.innerHTML = `
      <span class="sprint-inline-id-preview">${esc(_mdiffPreviewId)} ·</span>
      <input type="text" class="mdiff-new-sprint-inp" placeholder="Nombre descriptivo"
        onkeydown="if(event.key==='Enter'){event.preventDefault();_mdiffConfirmNewSprintForm(this,'${esc(code)}');}if(event.key==='Escape'){event.preventDefault();_mdiffCancelNewSprintForm(this);}">
      <input type="text" class="mdiff-new-sprint-goal" placeholder="Goal (opcional)"
        onkeydown="if(event.key==='Enter'){event.preventDefault();_mdiffConfirmNewSprintForm(this,'${esc(code)}');}if(event.key==='Escape'){event.preventDefault();_mdiffCancelNewSprintForm(this);}">
      <div class="mdiff-new-sprint-row">
        <label class="sprint-inline-release-label">Versión:</label>
        <input type="text" class="mdiff-new-sprint-vt" value="${esc(suggestedVt)}" placeholder="ej: v1.1.0"
          oninput="_mdiffSyncConfirmBtn('${esc(code)}');_clearSprintFieldErr('mdiff-sprint-vt-err-${esc(code)}')"
          onkeydown="if(event.key==='Enter'){event.preventDefault();_mdiffConfirmNewSprintForm(this,'${esc(code)}');}if(event.key==='Escape'){event.preventDefault();_mdiffCancelNewSprintForm(this);}">
        <span id="mdiff-sprint-vt-err-${esc(code)}" class="sprint-field-err hidden"></span>
        <label class="sprint-inline-release-label">Tipo de release:</label>
        <div class="sprint-inline-release-radios">${rtRadios}</div>
        <span id="mdiff-sprint-rt-err-${esc(code)}" class="sprint-field-err hidden"></span>
        <button type="button" id="${esc(_mdiffConfirmId)}" class="mdiff-new-sprint-confirm"
          onclick="_mdiffConfirmNewSprintForm(this,'${esc(code)}')">✓</button>
        <button type="button" class="mdiff-new-sprint-cancel"
          onclick="_mdiffCancelNewSprintForm(this)">✕</button>
      </div>`;

    // Guardar referencia al select original para restaurar si se cancela
    wrap._originalSelect = sel;
    sel.parentNode.replaceChild(wrap, sel);
    // R-202605-009: sync inicial del botón confirm
    setTimeout(() => {
      _mdiffSyncConfirmBtn(code);
      wrap.querySelector('.mdiff-new-sprint-inp').focus();
    }, 10);
  }

  // R-202605-009: sync estado del botón confirm en el mini-form del diff
  window._mdiffSyncConfirmBtn = function(code) {
    const btn  = document.getElementById('mdiff-sprint-confirm-' + code);
    const vtEl = btn ? btn.closest('.mdiff-new-sprint-form').querySelector('.mdiff-new-sprint-vt') : null;
    const rtEls = document.querySelectorAll(`input[name="mdiff-sprint-rt-${CSS.escape(code)}"]`);
    if (!btn) return;
    const vtOk = vtEl && vtEl.value.trim().length > 0;
    const rtOk = Array.from(rtEls).some(r => r.checked);
    btn.disabled = !(vtOk && rtOk);
  };

  window._mdiffConfirmNewSprintForm = function(el, code) {
    const wrap = el.closest('.mdiff-new-sprint-form');
    if (!wrap) return;
    const name = wrap.querySelector('.mdiff-new-sprint-inp').value.trim();
    const goal = wrap.querySelector('.mdiff-new-sprint-goal').value.trim();
    const vtEl = wrap.querySelector('.mdiff-new-sprint-vt');
    const vt   = vtEl ? vtEl.value.trim() : '';
    const rtEls = document.querySelectorAll(`input[name="mdiff-sprint-rt-${CSS.escape(code)}"]`);
    const rt   = (Array.from(rtEls).find(r => r.checked) || {}).value || '';

    if (!name) { wrap.querySelector('.mdiff-new-sprint-inp').focus(); return; }

    // R-202605-009: validación obligatoria de vt y rt — no confirma hasta que sean válidos
    let valid = true;
    if (!vt) {
      valid = false;
      const errEl = document.getElementById('mdiff-sprint-vt-err-' + code);
      if (vtEl) vtEl.classList.add('input-outline-error');
      if (errEl) { errEl.textContent = 'Ingresa una versión (ej: v1.0.0)'; errEl.classList.remove('is-hidden'); }
    }
    if (!rt) {
      valid = false;
      const errEl = document.getElementById('mdiff-sprint-rt-err-' + code);
      if (errEl) { errEl.textContent = 'Selecciona el tipo de release'; errEl.classList.remove('is-hidden'); }
    }
    if (!valid) return;

    // B-202605-499: input parcial S-XX (sin nombre descriptivo) — bifurcar sin mostrar toast de error
    const bareSprintMatch = /^S-\d+$/i.test(name);
    if (bareSprintMatch) {
      const existingSprint = _getSprintById(name.toUpperCase());
      if (existingSprint) {
        // Sprint ya existe → asignar directamente
        _mdiffPersistSprint(code, existingSprint.id);
        _mdiffRestoreSelect(wrap, code, existingSprint.id);
        return;
      } else {
        // Sprint no existe → restaurar select y abrir modal de nuevo sprint para completar nombre
        _mdiffRestoreSelect(wrap, code, null);
        if (typeof openNewSprintInline === 'function') openNewSprintInline(code);
        return;
      }
    }

    const newId = createSprint(name, goal, vt, rt);
    if (!newId) { wrap.querySelector('.mdiff-new-sprint-inp').focus(); return; }

    // Persistir sprint en el ítem
    _mdiffPersistSprint(code, newId);

    // Restaurar select con el nuevo sprint seleccionado + añadirlo a todos los selects del DIFF
    const restoredSel = _mdiffRestoreSelect(wrap, code, newId);

    // Añadir la nueva opción a todos los demás selects del DIFF
    // T-202605-500: label canónico generado por createSprint — leer desde state
    const _newSp = _getSprintById(newId);
    const _newSpLabel = _newSp ? (_newSp.label || newId) : newId;
    document.querySelectorAll(`.mdiff-sprint-select[data-item-code]`).forEach(s => {
      if (s === restoredSel) return;
      const newOpt = s.querySelector('option[value="__new__"]');
      const opt = document.createElement('option');
      opt.value = newId;
      opt.textContent = _newSpLabel;
      if (newOpt) s.insertBefore(opt, newOpt);
      else s.appendChild(opt);
    });
  };

  window._mdiffCancelNewSprintForm = function(el) {
    const wrap = el.closest('.mdiff-new-sprint-form');
    if (!wrap) return;
    const code = wrap.querySelector('.mdiff-new-sprint-inp')
      ? wrap.querySelector('[data-item-code]') : null;
    // Restaurar select original sin cambios
    _mdiffRestoreSelect(wrap, null, null);
  };

  // Reemplaza el mini-form con un select reconstruido
  function _mdiffRestoreSelect(wrap, code, selectedId) {
    const openSprints = (typeof getActiveSprints === 'function')
      ? getActiveSprints().filter(s => s.status !== 'closed')
      : [];
    const currentSprint = code
      ? ((ITEMS.find(i => i.code === code) || {}).sprint || '')
      : '';
    const effectiveSelected = selectedId || currentSprint;

    const sel = document.createElement('select');
    sel.className = 'mdiff-sprint-select';
    if (code) sel.dataset.itemCode = code;
    sel.setAttribute('onchange', '_mdiffSetItemSprint(this)');
    sel.setAttribute('onclick', 'event.stopPropagation()');

    const noSprint = document.createElement('option');
    noSprint.value = '';
    noSprint.textContent = 'Sin sprint';
    if (!effectiveSelected) noSprint.selected = true;
    sel.appendChild(noSprint);

    openSprints.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.label || s.id;
      if (s.id === effectiveSelected) opt.selected = true;
      sel.appendChild(opt);
    });

    const newOpt = document.createElement('option');
    newOpt.value = '__new__';
    newOpt.textContent = '＋ Nuevo sprint...';
    sel.appendChild(newOpt);

    wrap.parentNode.replaceChild(sel, wrap);
    return sel;
  }

  // R-202605-148: persistir sprint en ITEMS + saveBacklog sin re-render del backlog ni del DIFF
  function _mdiffPersistSprint(code, sprintId) {
    const item = ITEMS.find(i => i.code === code);
    if (!item) {
      // B-202605-500: ítem nuevo aún no existe en ITEMS durante dryRun — guardar para aplicar en _mdiffDoApply
      _mdiffPendingSprints[code] = sprintId || '';
      return;
    }
    const prevSprint = item.sprint || '';
    item.sprint = sprintId || '';
    item.priority = _calcPriority(item);
    if (sprintId) {
      const targetSprint = _getSprintById(sprintId);
      if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
        item.scope_added = true;
      }
    } else {
      delete item.scope_added;
    }
    if (!item.history) item.history = [];
    item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevSprint || null, to: item.sprint || null } });
    saveBacklog();
    _setBacklogModified();
    // No llama renderBacklogList() — el DIFF permanece intacto
  }

  // Helper: validar pendientes y actualizar panel derecho
  window._mdiffUpdateConfirmBtn = function() {
    const applyBtn   = document.getElementById('mdiff-apply-btn');
    const backlogBtn = document.getElementById('mdiff-backlog-btn');
    if (!applyBtn) return;

    // Recoger estado de controles en columna derecha
    const retroPendingItems = [];
    diff.retroceso.forEach((item, idx) => {
      const cb = document.getElementById(`mdiff-right-retro-cb-${idx}`);
      if (!cb || !cb.checked) retroPendingItems.push({ item, idx });
    });

    const discardPendingItems = [];
    diff.discarded.forEach((item, idx) => {
      if (item.reason) return; // ya tiene razón preestablecida
      const sel = document.getElementById(`mdiff-right-discard-${idx}`);
      if (!sel || !sel.value) discardPendingItems.push({ item, idx });
    });

    const blocked = retroPendingItems.length > 0 || discardPendingItems.length > 0;
    applyBtn.disabled = blocked;
    applyBtn.classList.toggle('mdiff-apply-blocked', blocked);
    if (backlogBtn) {
      backlogBtn.disabled = blocked;
      backlogBtn.classList.toggle('mdiff-apply-blocked', blocked);
    }

    // Construir contenido de columna derecha
    if (pendingList) {
      const hasRetrocesos  = diff.retroceso.length > 0;
      const hasDescartes   = diff.discarded.filter(i => !i.reason).length > 0;
      const hasDescartesConRazon = diff.discarded.filter(i => !!i.reason).length > 0;

      if (!hasRetrocesos && !hasDescartes && !hasDescartesConRazon) {
        // Sin pendientes — listo
        pendingList.innerHTML = `<div class="mdiff-pending-ok">✓ Listo para guardar</div>`;
        return;
      }

      let html = '';

      // Banner de advertencia si hay pendientes
      if (blocked) {
        const pendingCount = retroPendingItems.length + discardPendingItems.length;
        html += `
          <div class="mdiff-right-banner mdiff-right-banner--warn">
            <span class="mdiff-right-banner-icon">⚠</span>
            <span class="mdiff-right-banner-text">
              ${pendingCount} acción${pendingCount > 1 ? 'es requieren' : ' requiere'} confirmación antes de guardar
            </span>
          </div>`;
      } else {
        html += `<div class="mdiff-pending-ok">✓ Listo para guardar</div>`;
      }

      // Sección retrocesos
      if (hasRetrocesos) {
        html += `<div class="mdiff-right-section-title">Retrocesos</div>`;
        diff.retroceso.forEach((item, idx) => {
          const cbId = `mdiff-right-retro-cb-${idx}`;
          const existingCb = document.getElementById(cbId);
          const isChecked  = existingCb ? existingCb.checked : false;
          html += `
            <label class="mdiff-right-retro-row ${isChecked ? 'is-confirmed' : ''}">
              <input type="checkbox" id="${cbId}" class="mdiff-right-retro-cb"
                     data-retroceso-idx="${idx}" onchange="_mdiffUpdateConfirmBtn()"
                     ${isChecked ? 'checked' : ''}>
              <span class="mdiff-right-retro-info">
                <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
                <span class="mdiff-retro-status">${esc(item.from)} → ${esc(item.to)}</span>
              </span>
            </label>`;
        });
      }

      // Sección descartes que necesitan razón
      if (hasDescartes) {
        html += `<div class="mdiff-right-section-title">Razón de descarte</div>`;
        diff.discarded.forEach((item, idx) => {
          if (item.reason) return; // ya tiene razón
          const selId = `mdiff-right-discard-${idx}`;
          const existingSel = document.getElementById(selId);
          const currentVal  = existingSel ? existingSel.value : '';
          html += `
            <div class="mdiff-right-discard-row">
              <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
              <span class="mdiff-right-discard-desc">${esc(item.desc || '')}</span>
              <select id="${selId}" class="mdiff-right-discard-select"
                      data-discard-idx="${idx}" onchange="_mdiffUpdateConfirmBtn()">
                <option value="">— razón —</option>
                ${_DISCARD_REASONS.map(r => `<option value="${esc(r)}" ${currentVal === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}
              </select>
            </div>`;
        });
      }

      // Descartes con razón preestablecida — solo confirmar visualmente
      if (hasDescartesConRazon) {
        diff.discarded.forEach((item) => {
          if (!item.reason) return;
          html += `
            <div class="mdiff-right-discard-row mdiff-right-discard-row--preset">
              <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
              <span class="mdiff-discard-reason-pill">${esc(item.reason)}</span>
            </div>`;
        });
      }

      pendingList.innerHTML = html;
    }

    // Actualizar texto del botón apply
    const totalApply = diff.created.length + diff.advanced.length + diff.updated.length
                     + diff.retroceso.length + diff.discarded.length + diff.createdAndClosed.length;
    applyBtn.textContent = blocked ? '✓ Guardar sesión' : `✓ Guardar sesión (${totalApply})`;
  };

  // Footer: botones de acción
  if (footer) {
    footer.innerHTML = `
      <button id="mdiff-cancel-btn" class="mdiff-btn mdiff-btn--cancel">✕ Cancelar</button>
      <button id="mdiff-backlog-btn" class="mdiff-btn mdiff-btn--secondary">Ver Backlog</button>
      <button class="mdiff-btn mdiff-btn--primary" id="mdiff-apply-btn">✓ Guardar sesión</button>`;
  }

  overlay.classList.add('open');

  // Evaluar estado inicial del botón
  _mdiffUpdateConfirmBtn();

  // ── Handler de aplicar: aplica retrocesos y descartes ──
  function _mdiffDoApply(andThenGoBacklog) {
    // Retrocesos confirmados — leer checkboxes de columna derecha
    if (diff.retroceso.length) {
      diff.retroceso.forEach((retroItem, idx) => {
        const cb = document.getElementById(`mdiff-right-retro-cb-${idx}`);
        if (cb && cb.checked) {
          const item = ITEMS.find(i => i.code === retroItem.code);
          if (item) {
            const from = item.status;
            item.status = retroItem.to;
            item.statusChangedAt = Date.now();
            _blogLog('retroceso', retroItem.code, from + ' → ' + retroItem.to, 'backlog');
          }
        }
      });
    }

    // Descartes: aplicar con reason del selector de columna derecha o preestablecida
    if (diff.discarded.length) {
      diff.discarded.forEach((discItem, idx) => {
        const item = ITEMS.find(i => i.code === discItem.code);
        if (!item) return;
        const sel = document.getElementById(`mdiff-right-discard-${idx}`);
        const finalReason = sel ? (sel.value || discItem.reason || '') : (discItem.reason || '');
        const finalRef    = discItem.ref || '';
        item.status        = 'descartado';
        item.discardReason = finalReason;
        item.discardRef    = finalRef;
        item.statusChangedAt = Date.now();
        _blogLog('ckpt-descarte', discItem.code, finalReason, 'backlog');
      });
    }

    // Si hubo retrocesos o descartes → persistir y re-renderizar
    const hadPending = diff.retroceso.length || diff.discarded.length;
    if (hadPending) {
      _undoSnapshot();
      saveBacklog();
      _setBacklogModified();
    }

    // Contar ítems aplicados para toast
    const appliedCount = diff.created.length + diff.advanced.length + diff.updated.length
                       + diff.retroceso.filter((_, idx) => {
                           const cb = document.getElementById(`mdiff-right-retro-cb-${idx}`);
                           return cb && cb.checked;
                         }).length
                       + diff.discarded.length
                       + diff.createdAndClosed.length;

    overlay.classList.remove('open');
    document.removeEventListener('keydown', _mdiffKeyHandler);
    // B-202605-050: limpiar todas las referencias _mdiff* al cerrar el panel
    delete window._mdiffUpdateConfirmBtn;
    delete window._mdiffToggleSection;
    delete window._mdiffJumpTo;
    delete window._mdiffSetItemSprint;
    delete window._mdiffConfirmNewSprintForm;
    delete window._mdiffCancelNewSprintForm;

    if (typeof showToast === 'function' && appliedCount > 0) {
      showToast('success', `Sesión guardada — ${appliedCount} ítem${appliedCount !== 1 ? 's' : ''} aplicado${appliedCount !== 1 ? 's' : ''}`);
    }

    onApply();

    // B-202605-500: aplicar sprints pendientes sobre ítems nuevos (ya existen en ITEMS tras onApply)
    const pendingEntries = Object.entries(_mdiffPendingSprints);
    if (pendingEntries.length) {
      let changed = false;
      pendingEntries.forEach(([code, sprintId]) => {
        const item = ITEMS.find(i => i.code === code);
        if (!item) return;
        item.sprint = sprintId || '';
        item.priority = _calcPriority(item);
        if (sprintId) {
          const targetSprint = _getSprintById(sprintId);
          if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
            item.scope_added = true;
          }
        } else {
          delete item.scope_added;
        }
        if (!item.history) item.history = [];
        item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: null, to: sprintId || null } });
        changed = true;
      });
      if (changed) {
        saveBacklog();
        _setBacklogModified();
      }
    }

    if (andThenGoBacklog) {
      if (typeof switchTab === 'function') switchTab('backlog');
      if (typeof switchSubTab === 'function') switchSubTab('backlog');
    }
  }

  overlay.querySelector('#mdiff-cancel-btn').addEventListener('click', () => {
    overlay.classList.remove('open');
    document.removeEventListener('keydown', _mdiffKeyHandler);
    // B-202605-050: limpiar todas las referencias _mdiff* al cerrar el panel
    delete window._mdiffUpdateConfirmBtn;
    delete window._mdiffToggleSection;
    delete window._mdiffJumpTo;
    delete window._mdiffSetItemSprint;
    delete window._mdiffConfirmNewSprintForm;
    delete window._mdiffCancelNewSprintForm;
    // Sin toast — el usuario canceló deliberadamente
  });

  overlay.querySelector('#mdiff-backlog-btn').addEventListener('click', () => {
    if (overlay.querySelector('#mdiff-backlog-btn').disabled) return;
    _mdiffDoApply(true);
  });

  overlay.querySelector('#mdiff-apply-btn').addEventListener('click', () => {
    if (overlay.querySelector('#mdiff-apply-btn').disabled) return;
    _mdiffDoApply(false);
  });

  // Enter → Aplicar (solo si no bloqueado)
  let _mdiffReady = false;
  setTimeout(() => { _mdiffReady = true; }, 300);
  function _mdiffKeyHandler(e) {
    if (e.key === 'Enter' && _mdiffReady) {
      const btn = document.getElementById('mdiff-apply-btn');
      if (btn && !btn.disabled) {
        e.preventDefault();
        _mdiffDoApply(false);
      }
    } else if (e.key === 'Escape') {
      document.removeEventListener('keydown', _mdiffKeyHandler);
      overlay.classList.remove('open');
      // B-202605-050: limpiar todas las referencias _mdiff* al cerrar el panel
      delete window._mdiffUpdateConfirmBtn;
      delete window._mdiffToggleSection;
      delete window._mdiffJumpTo;
      delete window._mdiffSetItemSprint;
      delete window._mdiffConfirmNewSprintForm;
      delete window._mdiffCancelNewSprintForm;
    }
  }
  document.addEventListener('keydown', _mdiffKeyHandler);
}

// T-202604-059: Confirmación de retroceso de status
function _showStatusConfirmModal({ title, body, okLabel, okClass, onConfirm }) {
  // R-202604-047: shell estático en index.html — inject content + classList
  const overlay = document.getElementById('status-confirm-overlay');
  if (!overlay) return;
  const titleEl = document.getElementById('status-confirm-title');
  const bodyEl = document.getElementById('status-confirm-body-text');
  const cancelBtn = document.getElementById('status-confirm-cancel-btn');
  const okBtn = document.getElementById('status-confirm-ok-btn');
  if (titleEl) titleEl.innerHTML = title;
  if (bodyEl) bodyEl.innerHTML = body;
  if (okBtn) {
    okBtn.textContent = okLabel;
    okBtn.className = `status-confirm-ok ${okClass || ''}`;
    // Reemplazar para limpiar handlers acumulados
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    newOkBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      _resumeCkptTimer(); // P-001: reanudar al confirmar
      onConfirm();
    });
  }
  if (cancelBtn) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      _resumeCkptTimer();
    });
  }
  _pauseCkptTimer(); // P-001: pausar panel mientras modal está abierto
  overlay.classList.add('open');
}

function _confirmRetroceso(code, toStatus) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  const from = item.status;
  _showStatusConfirmModal({
    title: '⚠ Retroceso de status',
    body: `<strong>${esc(code)}</strong> pasará de <strong>${from}</strong> → <strong>${toStatus}</strong>.<br><br>¿Confirmas el retroceso?`,
    okLabel: 'Sí, retroceder',
    okClass: '',
    onConfirm: () => {
      item.status = toStatus;
      item.statusChangedAt = Date.now();
      _blogLog('retroceso', code, from + ' → ' + toStatus, 'backlog');
      _undoSnapshot();
      saveBacklog();
      _setBacklogModified();
      renderBacklogList(); updateBacklogBanner(); renderStats();
      showToast('info', '↓ ' + code + ' → ' + toStatus);
      // Disparar descarga diferida si no quedan retrocesos ni descartes pendientes
      if (window._pendingTemplateDownload) {
        const panel = document.getElementById('ckpt-panel-body');
        const stillPending = panel && (panel.querySelector('.ckpt-section.retroceso') || panel.querySelector('.ckpt-section.discarded'));
        if (!stillPending) { window._pendingTemplateDownload = false; if (_templateTrigger() === 'session') downloadTemplates(); }
      }
    }
  });
}

function _confirmDiscard(code, reason, ref) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  // Si no viene razón preestablecida, mostrar selector inline
  const reasonInputId = 'discard-reason-select';
  const refInputId    = 'discard-ref-input';
  const manualInput   = !reason;

  const bodyHtml = manualInput
    ? `<strong>${esc(code)}</strong> será marcado como <strong>descartado</strong>.<br><br>
       <div class="discard-modal-fields">
         <div>
           <label class="discard-field-label">Razón</label><br>
           <select id="${reasonInputId}" class="discard-field-select">
             <option value="">— seleccionar —</option>
             <option value="duplicado">duplicado</option>
             <option value="fuera de alcance">fuera de alcance</option>
             <option value="reemplazado">reemplazado</option>
             <option value="obsoleto">obsoleto</option>
           </select>
         </div>
         <div>
           <label class="discard-field-label">Referencia (opcional)</label><br>
           <input id="${refInputId}" type="text" placeholder="ej: T-202604-066" class="discard-field-input">
         </div>
       </div>
       <div class="discard-modal-hint">El ítem se conserva para trazabilidad pero no contará en métricas.</div>`
    : `<strong>${esc(code)}</strong> será marcado como <strong>descartado</strong>.<br>Razón: <strong>${esc(reason)}</strong>${ref ? '<br>Reemplazado por: <strong>' + esc(ref) + '</strong>' : ''}<br><br>El ítem se conserva para trazabilidad pero no contará en métricas.`;

  _showStatusConfirmModal({
    title: '🗑 Descartar ítem',
    body: bodyHtml,
    okLabel: 'Descartar',
    okClass: 'danger',
    onConfirm: () => {
      const finalReason = manualInput
        ? (document.getElementById(reasonInputId)?.value || '')
        : reason;
      const finalRef = manualInput
        ? (document.getElementById(refInputId)?.value.trim() || '')
        : ref;
      item.status = 'descartado';
      item.discardReason = finalReason;
      item.discardRef = finalRef;
      _blogLog('descartado', code, finalReason || '', 'backlog');
      _undoSnapshot();
      saveBacklog();
      _setBacklogModified();
      renderBacklogList(); updateBacklogBanner(); renderStats();
      showToast('info', '🗑 ' + code + ' descartado');
    }
  });
}

// B-202604-NNN: confirmar lote de descartes desde panel CHECKPOINT (todos con reason definida)
function _applyDiscardBatch(items) {
  if (!items || !items.length) return;
  let applied = 0;
  items.forEach(({ code, reason, ref }) => {
    const item = ITEMS.find(i => i.code === code);
    if (!item) return;
    item.status = 'descartado';
    item.discardReason = reason || '';
    item.discardRef = ref || '';
    item.statusChangedAt = Date.now();
    _blogLog('ckpt-descarte', code, reason || '', 'backlog');
    applied++;
  });
  if (!applied) return;
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  renderBacklogList(); updateBacklogBanner(); renderStats();
  showToast('info', '🗑 ' + applied + ' ítem' + (applied > 1 ? 's descartados' : ' descartado'));
  // Quitar sección de descartes del panel si ya no hay pendientes
  const panel = document.getElementById('ckpt-panel-body');
  if (panel) {
    const sec = panel.querySelector('.ckpt-section.discarded');
    if (sec) sec.remove();
  }
  // Disparar descarga diferida si no quedan retrocesos pendientes
  if (window._pendingTemplateDownload) {
    const stillPending = panel && panel.querySelector('.ckpt-section.retroceso');
    if (!stillPending) {
      window._pendingTemplateDownload = false;
      if (_templateTrigger() === 'session') downloadTemplates();
    }
  }
}


// Convierte estado del TRACKER-GLOBAL al formato del Backlog
function _tgStatusToBacklog(raw) {
  return _normalizeStatus(raw);
}

// Normaliza cualquier variante de status a los valores canónicos: 'pendiente' | 'done' | 'descartado' | 'historico'
function _normalizeStatus(raw) {
  if (!raw) return 'pendiente';
  const s = raw.toLowerCase().trim();
  // B-202604-193: 'historico' es valor canónico — NO normalizar a pendiente
  if (s === 'historico') return 'historico';
  if (s === 'done' || s.includes('done') || s.includes('listo')) return 'done';
  if (s === 'descartado' || s.includes('descart') || s.includes('discard')) return 'descartado';
  // R-202604-091: 'en curso' fusionado con 'pendiente' — decorador visual reemplaza al status
  if (s === 'en curso' || s === 'en-curso' || s === 'progreso' || s === 'in-progress' || s === 'en progreso') return 'pendiente';
  return 'pendiente';
}

// R-202604-091: decorador de actividad — pendiente con sesión vinculada en los últimos 7 días
const _ACTIVE_RECENT_DAYS = 7;
function _isActiveRecently(item) {
  if (!item || item.status !== 'pendiente') return false;
  if (typeof getAllSessions !== 'function') return false;
  const allSessions = getAllSessions();
  let lastTs = 0;
  allSessions.forEach(s => {
    if ((s.backlogRefs || s.trackerRefs || []).includes(item.code)) {
      const ts = s.savedAt || s.createdAt || 0;
      if (ts > lastTs) lastTs = ts;
    }
  });
  if (!lastTs) return false;
  return (Date.now() - lastTs) / 86400000 <= _ACTIVE_RECENT_DAYS;
}

// ── T-sprints: Catálogo de sprints ──

function _getActiveSprint() {
  return getActiveSprints().find(s => s.status === 'active') || null;
}

function _getSprintById(id) {
  return getActiveSprints().find(s => s.id === id) || null;
}

// T-202605-500: ID con prefijo de proyecto — [PREFIJO]-S[NN], consecutivo por proyecto
function _nextSprintId() {
  const prefix = (typeof _docPrefix === 'function') ? _docPrefix() : 'XX';
  const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-S(\\d+)$', 'i');
  const nums = getActiveSprints()
    .map(s => { const m = (s.id || '').match(re); return m ? parseInt(m[1], 10) : NaN; })
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return prefix + '-S' + String(max + 1).padStart(2, '0');
}

// T-202605-500: validar que el nombre descriptivo no esté vacío — el ID lo genera PP automáticamente
function _isValidSprintName(label) {
  return !!(label && label.trim());
}

// R-202605-134: sugerir release_type basado en el contenido del sprint
// Solo Bs/Ts → Patch · Rs features/UX → Minor · Rs arquitectura/refactor → Major · mezcla Rs+Bs → Minor
function _suggestReleaseType(sprintItems) {
  if (!sprintItems || !sprintItems.length) return 'Patch';
  const hasR = sprintItems.some(i => i.type === 'R');
  const hasB = sprintItems.some(i => i.type === 'B');
  const hasT = sprintItems.some(i => i.type === 'T');
  if (!hasR) return 'Patch';
  // Rs arquitectura/refactor → Major (keywords heurísticos)
  const archKeywords = /migra|refactor|arquitectura|core|parser|schema|json/i;
  const hasArch = sprintItems.some(i => i.type === 'R' && archKeywords.test(i.title || ''));
  if (hasArch) return 'Major';
  // mezcla Rs+Bs → Minor
  if (hasR && hasB) return 'Minor';
  // Rs features/UX → Minor
  return 'Minor';
}

// R-202605-134: sugerir version_target basado en última versión registrada
// Incrementa el segmento correcto según release_type
function _suggestVersionTarget(releaseType) {
  try {
    const vStr = (typeof _effectiveVersion === 'function' ? _effectiveVersion() : _effectiveVersion) || '0.0.0';
    const clean = vStr.replace(/^v/i, '');
    const parts = clean.split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    if (releaseType === 'Major') return `v${major + 1}.0.0`;
    if (releaseType === 'Minor') return `v${major}.${minor + 1}.0`;
    return `v${major}.${minor}.${patch + 1}`;
  } catch { return 'futura'; }
}

// R-202605-123: createSprint acepta goal opcional (máx 120 chars)
// R-202605-134: acepta version_target y release_type — se calculan con sugerencia automática si no se pasan
// T-202605-500: ID generado internamente con prefijo de proyecto — founder solo pasa nombre descriptivo
function createSprint(raw, goal, versionTarget, releaseType) {
  const _activeProjForSprint = getActiveProject();
  if (!_activeProjForSprint) { showToast('warning', 'Selecciona un proyecto primero'); return; }
  if (!_activeProjForSprint.sprints) _activeProjForSprint.sprints = [];
  raw = (raw || '').trim();
  // T-202605-500: ID siempre auto-generado — el founder solo ingresa el nombre descriptivo
  const id = _nextSprintId();
  const displayLabel = raw || id;
  if (!_isValidSprintName(displayLabel)) {
    showToast('warning', '⚠ Nombre de sprint no puede estar vacío');
    return;
  }
  if (_getSprintById(id)) { showToast('warning', 'Ya existe ' + id); return id; }
  const goalTrimmed = (goal || '').trim().slice(0, 120);
  // R-202605-134: version_target y release_type — usar sugerencia si no se pasan explícitamente
  const rt  = (releaseType   || '').trim() || null;
  const vt  = (versionTarget || '').trim() || null;
  // T-202605-500: label canónico = '[ID] · [Nombre descriptivo]'
  const canonicalLabel = displayLabel ? id + ' · ' + displayLabel : id;
  _activeProjForSprint.sprints.push({
    id, label: canonicalLabel, goal: goalTrimmed,
    version_target: vt, release_type: rt,
    status: 'open', createdAt: Date.now()
  });
  save();
  return id;
}

// T-202604-262: generar MD de retrospectiva del sprint cerrado
// T-202604-417: acepta parámetro notes (string) para notas manuales editadas antes de confirmar
// R-202605-129: generar MD de retrospectiva enriquecida del sprint
// T-202604-417: acepta parámetro notes (string) para notas manuales editadas antes de confirmar
function _generateSprintRetroMd(id, notes) {
  const sp = _getSprintById(id);
  const sprintLabel = sp ? (sp.label || sp.id) : id;
  const now = new Date();
  const utcM6 = new Date(now.getTime() - 6 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${utcM6.getUTCFullYear()}-${pad(utcM6.getUTCMonth()+1)}-${pad(utcM6.getUTCDate())} ${pad(utcM6.getUTCHours())}:${pad(utcM6.getUTCMinutes())} UTC-6`;

  // B-[tmp:retro-snapshot]: al momento de generar el MD, _scmExecuteClose ya mutó
  // los ítems done/descartado a 'historico'. Incluir 'historico' en doneItems para
  // reflejar la realidad post-cierre. pendItems son los reasignados (sprint vacío o nuevo).
  const sprintItems = ITEMS.filter(i => i.sprint === id);
  const doneItems    = sprintItems.filter(i => i.status === 'done' || i.status === 'historico');
  const pendItems    = sprintItems.filter(i => i.status === 'pendiente');

  const totalEffort  = sprintItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const doneEffort   = doneItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const pendEffort   = pendItems.reduce((acc, i) => acc + (parseInt(i.effort) || 1), 0);
  const pctItems     = sprintItems.length > 0 ? Math.round((doneItems.length / sprintItems.length) * 100) : 0;
  const pctEffort    = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;

  const closedAt = sp && sp.closedAt ? new Date(sp.closedAt) : now;
  const closedStr = `${closedAt.getFullYear()}-${pad(closedAt.getMonth()+1)}-${pad(closedAt.getDate())}`;
  const createdAt = sp && sp.createdAt ? new Date(sp.createdAt) : null;
  const daysElapsed = createdAt ? Math.floor((closedAt - createdAt) / 86400000) : null;

  const _itemRow = i => {
    const effortN = parseInt(i.effort) || 1;
    const effortDots = '●'.repeat(effortN) + '○'.repeat(3 - effortN);
    return `| \`${i.code}\` | ${i.title || '—'} | ${effortDots} (${effortN}) |`;
  };

  const doneSection = doneItems.length
    ? `## ✅ Completados (${doneItems.length})\n\n| Código | Título | Effort |\n|--------|--------|--------|\n${doneItems.map(_itemRow).join('\n')}\n`
    : `## ✅ Completados\n\n_Sin ítems completados en este sprint._\n`;

  const pendSection = pendItems.length
    ? `## ⏳ No completados (${pendItems.length})\n\n| Código | Título | Effort |\n|--------|--------|--------|\n${pendItems.map(_itemRow).join('\n')}\n`
    : `## ⏳ No completados\n\n_Todos los ítems fueron completados. 🎉_\n`;

  // T-202604-417: sesiones del período del sprint
  let sessionsSection = '';
  if (typeof getAllSessions === 'function') {
    const allSessions = getAllSessions();
    const spStart = sp && sp.createdAt ? sp.createdAt : 0;
    const spEnd   = sp && sp.closedAt  ? sp.closedAt  : Date.now();
    const spSessions = allSessions.filter(s => {
      const ts = s.hora ? new Date(s.hora).getTime() : (s.timestamp || 0);
      return ts >= spStart && ts <= spEnd;
    });
    if (spSessions.length) {
      const sessRows = spSessions.map(s => {
        const dateLabel = s.hora ? s.hora.slice(0, 10) : '—';
        const title = s.title || s.titulo || '—';
        const ai = s.aiName || s.ai || '—';
        return `| ${dateLabel} | ${ai} | ${title} |`;
      }).join('\n');
      sessionsSection = `## 🗂 Sesiones del sprint (${spSessions.length})\n\n| Fecha | IA / Rol | Título |\n|-------|----------|--------|\n${sessRows}\n`;
    }
  }

  // T-202604-417: aprendizajes registrados en CHECKPOINTs del sprint
  let learningsSection = '';
  if (typeof getAllSessions === 'function') {
    const allSessions = getAllSessions();
    const spStart = sp && sp.createdAt ? sp.createdAt : 0;
    const spEnd   = sp && sp.closedAt  ? sp.closedAt  : Date.now();
    const learnings = allSessions
      .filter(s => {
        const ts = s.hora ? new Date(s.hora).getTime() : (s.timestamp || 0);
        return ts >= spStart && ts <= spEnd && s.learning && s.learning.trim();
      })
      .map(s => `- ${s.learning.trim()}`);
    if (learnings.length) {
      learningsSection = `## 💡 Aprendizajes del sprint\n\n${learnings.join('\n')}\n`;
    }
  }

  // T-202604-417: notas manuales editadas por el founder
  const notesSection = notes && notes.trim()
    ? `## 📝 Notas\n\n${notes.trim()}\n`
    : '';

  // R-202605-131: sección de scope added en retro
  const scopeAddedRetroItems = sprintItems.filter(i => i.scope_added);
  const scopeAddedRetroSection = scopeAddedRetroItems.length
    ? `## ➕ Scope añadido durante el sprint (${scopeAddedRetroItems.length})\n\n| Código | Título | Effort |\n|--------|--------|--------|\n${scopeAddedRetroItems.map(_itemRow).join('\n')}\n`
    : '';

  const pfx = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';

  // R-202605-129: comparativa sprint anterior para el MD
  const prevMd = (() => {
    if (typeof getActiveSprints !== 'function') return null;
    const closed = getActiveSprints()
      .filter(s => s.status === 'closed' && s.deliveryMetrics && s.id !== id)
      .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
    const prev = closed[0];
    if (!prev) return null;
    const dm = prev.deliveryMetrics;
    const prevDn   = dm.effortDone    || 0;
    const prevDnom = (dm.effortPlanned || 0) + (dm.effortScopeAdded || 0);
    const prevPct  = prevDnom > 0 ? Math.round(prevDn / prevDnom * 100) : 0;
    const delta    = pctEffort - prevPct;
    return { label: prev.label || prev.id, prevPct, pctDel: pctEffort, delta, sign: delta > 0 ? '+' : '' };
  })();

  // R-202605-129: sección de descartados en el MD
  const discardedMdItems = sprintItems.filter(i => i.status === 'descartado');
  const discardedMdSection = discardedMdItems.length
    ? `## 🗑 Descartados (${discardedMdItems.length})\n\n| Código | Título | Effort |\n|--------|--------|--------|\n${discardedMdItems.map(_itemRow).join('\n')}\n`
    : '';

  return `# ${pfx}-Retrospectiva-${id}-${closedStr}.md
<!-- Sprint: ${sprintLabel} | Cerrado: ${closedStr} | Generado: ${dateStr} -->

---

## Sprint

| Campo | Valor |
|---|---|
| ID | ${id} |
| Nombre | ${sprintLabel} |
${sp && sp.goal ? `| Goal | ${sp.goal} |` : ''}
${sp && sp.version_target ? `| Versión | ${sp.version_target} |` : ''}
${sp && sp.release_type   ? `| Release  | ${sp.release_type} |` : ''}
| Cerrado | ${closedStr} |
${daysElapsed !== null ? `| Duración | ${daysElapsed} día${daysElapsed !== 1 ? 's' : ''} |` : ''}

---

## Resumen de progreso

| Métrica | Valor |
|---|---|
| Ítems comprometidos | ${sprintItems.length} |
| Ítems completados | ${doneItems.length} (${pctItems}%) |
| Ítems no completados | ${pendItems.length} |
| Effort total estimado | ${totalEffort} |
| Effort completado | ${doneEffort} (${pctEffort}%) |
| Effort pendiente | ${pendEffort} |
${prevMd ? `| Vs sprint anterior | ${prevMd.label}: ${prevMd.prevPct}% effort → este sprint ${prevMd.pctDel}% (${prevMd.sign}${prevMd.delta}%) |` : '| Vs sprint anterior | Primer sprint con datos completos |'}

---

${doneSection}
---

${pendSection}
---

${discardedMdSection ? discardedMdSection + '\n---\n\n' : ''}${scopeAddedRetroSection ? scopeAddedRetroSection + '\n---\n\n' : ''}${sessionsSection ? sessionsSection + '\n---\n\n' : ''}${learningsSection ? learningsSection + '\n---\n\n' : ''}${notesSection ? notesSection + '\n---\n\n' : ''}_Generado por Locus ${(typeof _effectiveVersion === 'function') ? _effectiveVersion() : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '')} · ${dateStr}_
`;
}

// T-202604-262: mostrar modal de descarga opcional de retrospectiva
// T-202604-417: abre el overlay de retro en modo vista — muestra retro guardada del sprint cerrado
function openSprintRetroView(id) {
  const sp = _getSprintById(id);
  if (!sp) return;
  const sprintLabel = sp.label || sp.id;
  const retroDoc = sp.retroDoc || '';
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const closedAt = sp.closedAt ? new Date(sp.closedAt) : now;
  const closedStr = `${closedAt.getFullYear()}-${pad(closedAt.getMonth()+1)}-${pad(closedAt.getDate())}`;
  const pfx = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';
  const filename = `${pfx}-Retrospectiva-${id}-${closedStr}.md`;

  const overlay = document.getElementById('sprint-retro-overlay');
  if (!overlay) return;

  const titleEl   = document.getElementById('sprint-retro-title');
  const bodyEl    = document.getElementById('sprint-retro-body');
  const notesEl   = document.getElementById('sprint-retro-notes');
  const filenameEl = document.getElementById('sprint-retro-filename');

  if (titleEl)   titleEl.textContent = `📄 Retrospectiva — ${sprintLabel}`;
  if (filenameEl) filenameEl.textContent = filename;

  // Mostrar MD como texto pre-formateado en el body
  if (bodyEl) bodyEl.textContent = retroDoc || '(sin retrospectiva guardada)';

  // Campo de notas solo lectura en vista
  if (notesEl) {
    notesEl.value = sp.retroNotes || '';
    notesEl.readOnly = true;
    notesEl.placeholder = '';
  }

  overlay.classList.add('open', 'sprint-retro-overlay--view');

  // Botón descargar: usa el retroDoc guardado
  const dlBtn = document.getElementById('sprint-retro-dl-btn');
  if (dlBtn) {
    const newDlBtn = dlBtn.cloneNode(true);
    dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);
    newDlBtn.addEventListener('click', () => {
      const md = retroDoc || _generateSprintRetroMd(id, sp.retroNotes || '');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('download', 'Retrospectiva descargada', filename);
    });
  }
}

function closeSprintRetroOverlay() {
  const overlay = document.getElementById('sprint-retro-overlay');
  if (overlay) overlay.classList.remove('open', 'sprint-retro-overlay--view');
}

// T-202604-417: prompt de descarga post-cierre — distinto de la vista de retro guardada
function _openRetroDownloadPrompt(id) {
  const sp = _getSprintById(id);
  if (!sp) return;
  const sprintLabel = sp.label || sp.id;
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const closedAt = sp.closedAt ? new Date(sp.closedAt) : now;
  const closedStr = `${closedAt.getFullYear()}-${pad(closedAt.getMonth()+1)}-${pad(closedAt.getDate())}`;
  const pfx = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';
  const filename = `${pfx}-Retrospectiva-${id}-${closedStr}.md`;

  const overlay = document.getElementById('sprint-retro-overlay');
  if (!overlay) return;
  overlay.classList.remove('sprint-retro-overlay--view');

  const titleEl    = document.getElementById('sprint-retro-title');
  const bodyEl     = document.getElementById('sprint-retro-body');
  const notesEl    = document.getElementById('sprint-retro-notes');
  const filenameEl = document.getElementById('sprint-retro-filename');

  if (titleEl)    titleEl.textContent = `✅ Sprint cerrado — ${sprintLabel}`;
  if (filenameEl) filenameEl.textContent = filename;
  if (bodyEl)     bodyEl.textContent = '';  // no mostrar MD completo en prompt de descarga
  if (notesEl) { notesEl.classList.add('is-hidden'); }

  overlay.classList.add('open');

  const dlBtn = document.getElementById('sprint-retro-dl-btn');
  if (dlBtn) {
    const newDlBtn = dlBtn.cloneNode(true);
    dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);
    newDlBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      const md = sp.retroDoc || _generateSprintRetroMd(id, sp.retroNotes || '');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('download', 'Retrospectiva descargada', filename);
    });
  }
}

function setSprintStatus(id, newStatus) {
  // newStatus: 'active' | 'open' | 'closed'
  if (newStatus === 'active') {
    // Solo un sprint activo a la vez
    getActiveSprints().forEach(s => { if (s.status === 'active') s.status = 'open'; });
  }
  const sp = _getSprintById(id);
  if (!sp) return;
  sp.status = newStatus;
  if (newStatus === 'active')  sp.startedAt = sp.startedAt || Date.now();
  if (newStatus === 'closed')  sp.closedAt  = sp.closedAt  || Date.now();
  if (newStatus === 'closed')  sp.endsAt    = sp.endsAt    || Date.now();
  if (newStatus !== 'closed') { delete sp.closedAt; delete sp.endsAt; }
  // B-202605-210 guard: al cerrar un sprint directamente (sin modal), desasignar
  // ítems pendientes que quedaron huérfanos para evitar data inconsistente.
  if (newStatus === 'closed') {
    let guardCount = 0;
    ITEMS.forEach(item => {
      if (item.status === 'pendiente' && item.sprint === id) {
        if (!item.history) item.history = [];
        item.history.push({
          type: 'sprint',
          ts: Date.now(),
          data: { from: id, to: null, reason: 'sprint-closed-guard' }
        });
        item.sprint = '';
        guardCount++;
      }
    });
    if (guardCount > 0) {
      console.log(`[AI Tracker] B-202605-210 guard: ${guardCount} ítem(s) pendiente(s) desasignados de ${id} al cerrar`);
    }
    // B-202605-232: migrar done/descartado → historico al cerrar sprint directamente (sin modal 3 pasos)
    const closeTs = Date.now();
    let migratedCount = 0;
    ITEMS.forEach(i => {
      if (i.sprint === id && (i.status === 'done' || i.status === 'descartado')) {
        i.status = 'historico';
        i.archivedAt = closeTs;
        migratedCount++;
      }
    });
    if (guardCount > 0 || migratedCount > 0) {
      saveBacklog(); // una sola vez tras ambas operaciones
    }
  }
  save();
  renderBacklogList();
  showToast('info', id + ' → ' + newStatus);
}

function setItemSprint(code, sprintId) {
  if (sprintId === '__new__') { openNewSprintInline(code); return; }
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  const prevSprint = item.sprint || '';
  item.sprint = sprintId || '';
  item.priority = _calcPriority(item); // T-202604-297
  // R-202605-131: marcar scope_added si el sprint destino está activo al momento de asignar
  if (sprintId) {
    const targetSprint = _getSprintById(sprintId);
    if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
      item.scope_added = true;
    } else if (!sprintId || prevSprint === sprintId) {
      // No marcar si se desasigna o se mueve al mismo sprint
    }
  } else {
    // Al desasignar de sprint, limpiar el flag
    delete item.scope_added;
  }
  if (!item.history) item.history = [];
  item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevSprint || null, to: item.sprint || null } });
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  renderBacklogList();
  renderStats();
}

// R-202605-009: sync estado de botón confirm — disabled hasta que vt y rt tengan valor
function _syncSprintConfirmBtn(code) {
  const btn  = document.getElementById('new-sprint-confirm-' + code);
  const vtEl = document.getElementById('new-sprint-vt-' + code);
  const rtEls = document.querySelectorAll(`input[name="new-sprint-rt-${CSS.escape(code)}"]`);
  if (!btn) return;
  const vtOk = vtEl && vtEl.value.trim().length > 0;
  const rtOk = Array.from(rtEls).some(r => r.checked);
  btn.disabled = !(vtOk && rtOk);
}

function openNewSprintInline(code) {
  // Muestra input inline en el select de sprint del ítem
  const wrap = document.getElementById('sprint-select-wrap-' + CSS.escape(code));
  if (!wrap) return;
  // T-202605-450: sugerencia de effort máximo basada en velocidad histórica
  const velocityData = _calcEstimatedVelocity();
  const suggestHtml = velocityData !== null
    ? `<span class="sprint-inline-hint">Velocidad real promedio: <strong>${velocityData.avg}</strong> effort</span>`
    : '';
  // R-202605-134: sugerencia automática de release_type y version_target
  const suggestedRt  = _suggestReleaseType(ITEMS.filter(i => i.sprint === code));
  const suggestedVt  = _suggestVersionTarget(suggestedRt);
  // T-202605-500: mostrar ID auto-generado como prefijo no editable
  const previewId = _nextSprintId();
  // R-202605-009: radio buttons para release_type — Major / Minor / Patch con label visible
  const rtRadios = ['Major', 'Minor', 'Patch'].map(v =>
    `<label class="sprint-inline-release-label">
      <input type="radio" name="new-sprint-rt-${esc(code)}" value="${v}"
        ${suggestedRt === v ? 'checked' : ''}
        onchange="_syncSprintConfirmBtn('${esc(code)}');_clearSprintFieldErr('new-sprint-rt-err-${esc(code)}')">
      ${v}
    </label>`
  ).join('');
  // R-202605-123: campo goal opcional bajo el nombre del sprint
  wrap.innerHTML = `<div class="sprint-inline-edit-wrap sprint-inline-edit-wrap--with-goal">
    <span class="sprint-inline-id-preview">${esc(previewId)} ·</span>
    <input id="new-sprint-inp-${esc(code)}" type="text" placeholder="Nombre descriptivo"
      class="sprint-inline-input"
      onkeydown="if(event.key==='Enter')confirmNewSprint('${esc(code)}');if(event.key==='Escape')renderBacklogList();">
    <button id="new-sprint-confirm-${esc(code)}" onclick="confirmNewSprint('${esc(code)}')" class="sprint-inline-confirm">&#10003;</button>
    <button onclick="renderBacklogList()" class="sprint-inline-cancel">&#10005;</button>
    ${suggestHtml}
    <input id="new-sprint-goal-${esc(code)}" type="text" placeholder="Goal del sprint (opcional, max 120)"
      class="sprint-inline-goal-input"
      maxlength="120"
      onkeydown="if(event.key==='Enter')confirmNewSprint('${esc(code)}');if(event.key==='Escape')renderBacklogList();">
    <div class="sprint-inline-release-row">
      <label class="sprint-inline-release-label">Versión:</label>
      <input id="new-sprint-vt-${esc(code)}" type="text" value="${esc(suggestedVt)}"
        class="sprint-inline-vt-input" placeholder="ej: v1.1.0"
        oninput="_syncSprintConfirmBtn('${esc(code)}');_clearSprintFieldErr('new-sprint-vt-err-${esc(code)}')"
        onkeydown="if(event.key==='Enter')confirmNewSprint('${esc(code)}');if(event.key==='Escape')renderBacklogList();">
      <span id="new-sprint-vt-err-${esc(code)}" class="sprint-field-err hidden"></span>
      <label class="sprint-inline-release-label">Tipo de release:</label>
      <div class="sprint-inline-release-radios">${rtRadios}</div>
      <span id="new-sprint-rt-err-${esc(code)}" class="sprint-field-err hidden"></span>
    </div>
  </div>`;
  // R-202605-009: sync inicial — con sugerencias pre-pobladas el botón puede arrancar habilitado
  setTimeout(() => {
    _syncSprintConfirmBtn(code);
    const inp = document.getElementById('new-sprint-inp-' + code);
    if (inp) inp.focus();
  }, 30);
}

// R-202605-009: limpiar mensaje de error de campo
function _clearSprintFieldErr(errId) {
  const el = document.getElementById(errId);
  if (!el) return;
  el.textContent = '';
  el.classList.add('is-hidden');
  // B-202605-506: quitar borde de error del input asociado (hermano anterior al span)
  const prev = el.previousElementSibling;
  if (prev && prev.tagName === 'INPUT') prev.classList.remove('input-outline-error');
}

function confirmNewSprint(code) {
  const inp = document.getElementById('new-sprint-inp-' + code);
  const raw = inp ? inp.value.trim() : '';
  if (!raw) { renderBacklogList(); return; }
  // R-202605-123: leer goal si está presente
  const goalInp = document.getElementById('new-sprint-goal-' + code);
  const goal = goalInp ? goalInp.value.trim() : '';
  // R-202605-134: leer version_target y release_type
  const vtInp = document.getElementById('new-sprint-vt-' + code);
  const rtEls = document.querySelectorAll(`input[name="new-sprint-rt-${CSS.escape(code)}"]`);
  const rtSel = document.getElementById('new-sprint-rt-' + code); // select fallback (mdiff)
  const vt = vtInp ? vtInp.value.trim() : '';
  const rt = rtEls.length > 0
    ? (Array.from(rtEls).find(r => r.checked) || {}).value || ''
    : (rtSel ? rtSel.value : '');
  // R-202605-009: validación obligatoria de vt y rt — modal no cierra hasta que sean válidos
  let valid = true;
  if (!vt) {
    valid = false;
    const errEl = document.getElementById('new-sprint-vt-err-' + code);
    if (vtInp) vtInp.classList.add('input-outline-error');
    if (errEl) { errEl.textContent = 'Ingresa una versión (ej: v1.0.0)'; errEl.classList.remove('is-hidden'); }
  }
  if (!rt) {
    valid = false;
    const errEl = document.getElementById('new-sprint-rt-err-' + code);
    if (errEl) { errEl.textContent = 'Selecciona el tipo de release'; errEl.classList.remove('is-hidden'); }
  }
  if (!valid) return;
  const id = createSprint(raw, goal, vt, rt);
  if (!id) { renderBacklogList(); return; } // sin proyecto activo — createSprint ya mostró toast
  setItemSprint(code, id);
}

// T-202604-246: edición inline del nombre de sprint desde el header del grupo
// R-202605-123: incluye campo goal editable
function editSprintInline(sprintId) {
  const wrap = document.getElementById('sprint-label-wrap-' + CSS.escape(sprintId));
  if (!wrap) return;
  const sp = _getSprintById(sprintId);
  if (!sp) return;
  // T-202605-500: separar ID fijo del nombre descriptivo editable
  const currentDescriptive = (sp.label || sp.id).replace(/^[A-Z]+[-\s]S\d+\s*·?\s*/i, '').trim() || (sp.label || sp.id);
  const currentGoal = sp.goal || '';
  // R-202605-134: leer o sugerir version_target y release_type
  const spItems   = ITEMS.filter(i => i.sprint === sprintId);
  const suggestRt = sp.release_type  || _suggestReleaseType(spItems);
  const suggestVt = sp.version_target || _suggestVersionTarget(suggestRt);
  const inputId = 'edit-sprint-inp-' + sprintId;
  const goalId  = 'edit-sprint-goal-' + sprintId;
  const vtId    = 'edit-sprint-vt-'   + sprintId;
  const rtId    = 'edit-sprint-rt-'   + sprintId;
  wrap.innerHTML = `<div class="sprint-inline-edit-wrap sprint-inline-edit-wrap--with-goal" onclick="event.stopPropagation()">
    <span class="sprint-inline-id-preview">${esc(sprintId)} ·</span>
    <input id="${esc(inputId)}" type="text" value="${esc(currentDescriptive)}"
      class="sprint-inline-input sprint-inline-input--wide"
      onkeydown="if(event.key==='Enter')confirmEditSprint('${esc(sprintId)}');if(event.key==='Escape')renderBacklogList();">
    <button onclick="confirmEditSprint('${esc(sprintId)}')" class="sprint-inline-confirm">&#10003;</button>
    <button onclick="renderBacklogList()" class="sprint-inline-cancel">&#10005;</button>
    <input id="${esc(goalId)}" type="text" value="${esc(currentGoal)}"
      placeholder="Goal del sprint (opcional, max 120)"
      class="sprint-inline-goal-input"
      maxlength="120"
      onkeydown="if(event.key==='Enter')confirmEditSprint('${esc(sprintId)}');if(event.key==='Escape')renderBacklogList();">
    <div class="sprint-inline-release-row">
      <label class="sprint-inline-release-label">Versión:</label>
      <input id="${esc(vtId)}" type="text" value="${esc(suggestVt)}"
        class="sprint-inline-vt-input" placeholder="v3.5"
        onkeydown="if(event.key==='Enter')confirmEditSprint('${esc(sprintId)}');if(event.key==='Escape')renderBacklogList();">
      <label class="sprint-inline-release-label">Tipo:</label>
      <select id="${esc(rtId)}" class="sprint-inline-rt-select">
        <option value="Patch"${suggestRt==='Patch'?' selected':''}>Patch</option>
        <option value="Minor"${suggestRt==='Minor'?' selected':''}>Minor</option>
        <option value="Major"${suggestRt==='Major'?' selected':''}>Major</option>
      </select>
    </div>
  </div>`;
  setTimeout(() => {
    const inp = document.getElementById(inputId);
    if (inp) { inp.focus(); inp.select(); }
  }, 30);
}

// AC-3: guardar persiste en state.sprints y re-renderiza
// R-202605-123: también persiste el goal editado
// R-202605-134: persiste version_target y release_type
function confirmEditSprint(sprintId) {
  const inputId = 'edit-sprint-inp-' + sprintId;
  const goalId  = 'edit-sprint-goal-' + sprintId;
  const vtId    = 'edit-sprint-vt-'   + sprintId;
  const rtId    = 'edit-sprint-rt-'   + sprintId;
  const inp = document.getElementById(inputId);
  const raw = inp ? inp.value.trim() : '';
  if (!raw) { renderBacklogList(); return; } // AC-4: cancelar si vacío — no modifica
  // T-202605-500: raw es el nombre descriptivo — el ID no cambia
  if (!_isValidSprintName(raw)) {
    if (inp) { inp.classList.add('sprint-inline-input--warn'); inp.title = 'El nombre descriptivo no puede estar vacío'; }
    showToast('warning', '⚠ El nombre descriptivo no puede estar vacío');
    return;
  }
  if (inp) inp.classList.remove('sprint-inline-input--warn');
  const sp = _getSprintById(sprintId);
  if (!sp) { renderBacklogList(); return; }
  // T-202605-500: reconstruir label canónico = 'ID · Nombre descriptivo'
  sp.label = sprintId + ' · ' + raw;
  // R-202605-123: persistir goal si el campo existe
  const goalInp = document.getElementById(goalId);
  if (goalInp !== null) {
    sp.goal = goalInp.value.trim().slice(0, 120);
  }
  // R-202605-134: persistir version_target y release_type
  const vtInp = document.getElementById(vtId);
  const rtSel = document.getElementById(rtId);
  if (vtInp !== null) sp.version_target = vtInp.value.trim();
  if (rtSel !== null) sp.release_type   = rtSel.value;
  save();
  renderBacklogList();
  showToast('success', '✓ Sprint actualizado: ' + sp.label);
}

// R-202604-089: estado del modal de cierre de sprint
let _scmState = null; // { id, step, pendingItems, doneItems, migrations: { [code]: '' | sprintId | '__discard__' } }

function confirmCloseSprint(id) {
  // R-202604-089: abre modal de 3 pasos en lugar de confirm directo
  const sp = _getSprintById(id);
  if (!sp) return;
  const pendingItems = ITEMS.filter(i => i.sprint === id && i.status !== 'done' && i.status !== 'descartado' && itemType(i.code) !== 'P');
  const doneItems    = ITEMS.filter(i => i.sprint === id && (i.status === 'done' || i.status === 'descartado'));
  const skipStep2    = pendingItems.length === 0;

  // R-202605-125: snapshot de effort al abrir modal de cierre
  const allSprintItems     = ITEMS.filter(i => i.sprint === id && itemType(i.code) !== 'P');
  const effortPlanned      = allSprintItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortDone         = doneItems.filter(i => i.status === 'done').reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortScopeAdded   = allSprintItems.filter(i => i.scope_added).reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const effortNotDone      = pendingItems.reduce((s, i) => s + (parseInt(i.effort) || 0), 0);
  const hasItemsWithoutEffort = allSprintItems.some(i => !i.effort || parseInt(i.effort) === 0);

  _scmState = {
    id,
    step: 1,
    skipStep2,
    pendingItems,
    doneItems,
    migrations: {},
    retroNotes: '',
    effortPlanned,
    effortDone,
    effortScopeAdded,
    effortNotDone,
    hasItemsWithoutEffort,
  };
  // default: todos los pendientes van a sin asignar
  pendingItems.forEach(i => { _scmState.migrations[i.code] = ''; });

  const overlay = document.getElementById('sprint-close-overlay');
  if (!overlay) return;
  overlay.classList.toggle('skip-step2', skipStep2);
  const titleEl = document.getElementById('sprint-close-title');
  if (titleEl) titleEl.textContent = 'Cerrar sprint ' + id;

  _scmRender();
  overlay.classList.add('open');
  _pauseCkptTimer();
}

function closeCloseSprintModal() {
  const overlay = document.getElementById('sprint-close-overlay');
  if (overlay) overlay.classList.remove('open');
  _scmState = null;
  _resumeCkptTimer();
}

function _scmBack() {
  if (!_scmState) return;
  if (_scmState.step <= 1) return;
  _scmState.step--;
  if (_scmState.skipStep2 && _scmState.step === 2) _scmState.step--;
  _scmRender();
}

function _scmNext() {
  if (!_scmState) return;
  const totalSteps = _scmState.skipStep2 ? 2 : 3;
  if (_scmState.step >= totalSteps) {
    _scmExecuteClose();
    return;
  }
  _scmState.step++;
  if (_scmState.skipStep2 && _scmState.step === 2) _scmState.step++;
  _scmRender();
}

function _scmBulkApply() {
  const sel = document.getElementById('scm-bulk-select');
  if (!sel || !_scmState) return;
  const val = sel.value;
  const selects = document.querySelectorAll('.scm-migration-select');
  selects.forEach(s => {
    s.value = val;
    const code = s.dataset.code;
    if (code) _scmState.migrations[code] = val;
  });
}

function _scmRender() {
  if (!_scmState) return;
  const { step, skipStep2, pendingItems, doneItems, migrations, id } = _scmState;
  const totalSteps = skipStep2 ? 2 : 3;
  const sp = _getSprintById(id);
  const spLabel = sp ? (sp.label || sp.id) : id;

  // actualizar indicadores de paso
  const steps = [1, 2, 3];
  steps.forEach(n => {
    const el = document.getElementById('scs-step-' + n);
    if (!el) return;
    el.classList.remove('active', 'done');
    const mappedStep = (skipStep2 && n === 2) ? null : n; // step 2 skipped
    if (mappedStep === null) return;
    const effectiveN = skipStep2 && n === 3 ? 2 : n;
    if (step === n) el.classList.add('active');
    else if (step > n) el.classList.add('done');
  });

  // botones de navegación
  const backBtn = document.getElementById('sprint-close-back-btn');
  const nextBtn = document.getElementById('sprint-close-next-btn');
  const isFirst = step === 1;
  const isLast  = step === (skipStep2 ? 2 : 3); // B-202605-001: skipStep2=true → último paso efectivo es 2

  if (backBtn) {
    backBtn.hidden = isFirst;
    backBtn.disabled = isFirst;
  }
  if (nextBtn) {
    if (isLast) {
      nextBtn.textContent = 'Cerrar sprint';
      nextBtn.classList.add('is-close');
    } else {
      nextBtn.textContent = 'Siguiente →';
      nextBtn.classList.remove('is-close');
    }
  }

  // renderizar cuerpo del paso activo
  const body = document.getElementById('sprint-close-body');
  if (!body) return;

  // B-202605-067: extraer métricas de _scmState antes de llamar a _scmStep1Html
  // para eliminar la referencia directa al global dentro de la función
  const _step1Metrics = {
    effortPlanned:         _scmState.effortPlanned          || 0,
    effortDone:            _scmState.effortDone             || 0,
    effortScopeAdded:      _scmState.effortScopeAdded       || 0,
    effortNotDone:         _scmState.effortNotDone          || 0,
    hasItemsWithoutEffort: _scmState.hasItemsWithoutEffort  || false,
  };
  if (step === 1) body.innerHTML = _scmStep1Html(sp, spLabel, pendingItems, doneItems, _step1Metrics);
  else if (step === 2 && !skipStep2) body.innerHTML = _scmStep2Html(pendingItems, migrations, id);
  else if (step === 2 && skipStep2) body.innerHTML = _scmStep3Html(pendingItems, doneItems, migrations, skipStep2); // B-202605-001: skipStep2=true → paso 2 es el último, renderiza resumen
  else if (step === 3 && !skipStep2) body.innerHTML = _scmStep3Html(pendingItems, doneItems, migrations, skipStep2);
}

// B-202605-067: métricas de entrega recibidas como parámetro — sin acceso a _scmState global
function _scmStep1Html(sp, spLabel, pendingItems, doneItems, metrics) {
  const doneCount  = doneItems.filter(i => i.status === 'done').length;
  const pendCount  = pendingItems.length;

  // R-202605-125: métricas de entrega desde snapshot pasado por _scmRender
  const m = metrics || {};
  const effortPlanned    = m.effortPlanned          || 0;
  const effortDone       = m.effortDone             || 0;
  const effortScopeAdded = m.effortScopeAdded       || 0;
  const effortNotDone    = m.effortNotDone          || 0;
  const hasNoEffort      = m.hasItemsWithoutEffort  || false;
  // % entrega = done / (planeado + scope added). Si todo es 0, usar conteo de ítems.
  const denominator = effortPlanned + effortScopeAdded;
  const pct = denominator
    ? Math.round(effortDone / denominator * 100)
    : (doneCount ? 100 : 0);

  const doneRows = doneItems.filter(i => i.status === 'done').map(i =>
    `<div class="scm-item-row">
      <span class="scm-item-type scm-type-${i.type||'T'}">${esc(i.type||'T')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title">${esc(i.title || '—')}</span>
    </div>`
  ).join('');
  const pendRows = pendingItems.map(i =>
    `<div class="scm-item-row">
      <span class="scm-item-type scm-type-${i.type||'T'}">${esc(i.type||'T')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title">${esc(i.title || '—')}</span>
    </div>`
  ).join('');

  // R-202605-134: mostrar version_target y release_type en el resumen del paso 1
  const vt = sp && sp.version_target ? sp.version_target : null;
  const rt = sp && sp.release_type   ? sp.release_type   : null;
  const releaseRow = (vt || rt) ? `
    <div class="scm-release-meta">
      ${vt ? `<span class="scm-release-tag scm-release-version">${esc(vt)}</span>` : ''}
      ${rt ? `<span class="scm-release-tag scm-release-type scm-release-type--${(rt||'').toLowerCase()}">${esc(rt)}</span>` : ''}
    </div>` : '';

  // R-202605-125: advertencia si hay ítems sin effort
  const effortWarn = hasNoEffort
    ? `<div class="scm-effort-warn">⚠ Algunos ítems no tienen effort asignado — % de entrega puede ser inexacto.</div>`
    : '';

  return `
    ${releaseRow}
    <div class="scm-summary-grid">
      <div class="scm-kpi scm-kpi--good">
        <div class="scm-kpi-value">${doneCount}</div>
        <div class="scm-kpi-label">completados</div>
      </div>
      <div class="scm-kpi${pendCount ? ' scm-kpi--warn' : ''}">
        <div class="scm-kpi-value">${pendCount}</div>
        <div class="scm-kpi-label">pendientes</div>
      </div>
      <div class="scm-kpi">
        <div class="scm-kpi-value">${pct}%</div>
        <div class="scm-kpi-label">% entrega</div>
      </div>
    </div>
    <table class="scm-effort-table">
      <tbody>
        <tr>
          <td class="scm-effort-label">Effort planeado</td>
          <td class="scm-effort-val">${effortPlanned}</td>
        </tr>
        <tr>
          <td class="scm-effort-label">Effort completado (done)</td>
          <td class="scm-effort-val scm-effort-val--done">${effortDone}</td>
        </tr>
        <tr class="${effortScopeAdded ? '' : 'scm-effort-row--muted'}">
          <td class="scm-effort-label">Scope added durante sprint</td>
          <td class="scm-effort-val">${effortScopeAdded || '—'}</td>
        </tr>
        <tr class="${effortNotDone ? 'scm-effort-row--warn' : 'scm-effort-row--muted'}">
          <td class="scm-effort-label">No completados (migran o se descartan)</td>
          <td class="scm-effort-val">${effortNotDone || '—'}</td>
        </tr>
      </tbody>
    </table>
    ${effortWarn}
    ${doneRows ? `<div class="scm-section-title">Completados</div><div class="scm-items-list">${doneRows}</div>` : ''}
    ${pendRows ? `<div class="scm-section-title">Pendientes</div><div class="scm-items-list">${pendRows}</div>` : ''}
    ${!doneRows && !pendRows ? '<div class="scm-empty-hint">Sprint sin ítems registrados.</div>' : ''}
    <div class="scm-docgen-hint">
      📄 Antes de cerrar:
      <button class="scm-docgen-btn" onclick="openMapGenerator()">Abrir Document Generator</button>
      para generar MAP + Sprint Review.
    </div>
  `;
}

function _scmStep2Html(pendingItems, migrations, currentId) {
  const otherSprints = getActiveSprints().filter(s => s.id !== currentId && s.status !== 'closed');
  const activeSp     = otherSprints.find(s => s.status === 'active');

  const sprintOptions = `
    <option value="">— sin asignar —</option>
    ${otherSprints.map(s => `<option value="${esc(s.id)}">${esc(s.label || s.id)}${s.status === 'active' ? ' ★' : ''}</option>`).join('')}
    <option value="__discard__">🗑 Descartar</option>
  `;

  const bulkDefaultVal = activeSp ? activeSp.id : '';
  const bulkSprintOpts = `
    <option value="">— sin asignar —</option>
    ${otherSprints.map(s => `<option value="${esc(s.id)}"${s.id === bulkDefaultVal ? ' selected' : ''}>${esc(s.label || s.id)}${s.status === 'active' ? ' ★' : ''}</option>`).join('')}
    <option value="__discard__">🗑 Descartar</option>
  `;

  const rows = pendingItems.map(i => {
    const cur = migrations[i.code] !== undefined ? migrations[i.code] : '';
    return `<div class="scm-migration-item">
      <div class="scm-migration-item-info">
        <span class="scm-migration-item-title">${esc(i.title || '—')}</span>
        <span class="scm-migration-item-meta">${esc(i.code)} · ${esc(i.type||'T')}</span>
      </div>
      <select class="scm-migration-select" data-code="${esc(i.code)}"
        onchange="_scmState && (_scmState.migrations['${esc(i.code)}'] = this.value)">
        ${sprintOptions.replace(`value="${esc(cur)}"`, `value="${esc(cur)}" selected`)}
      </select>
    </div>`;
  }).join('');

  return `
    <div class="scm-bulk-row">
      <span class="scm-nowrap">Aplicar a todos:</span>
      <select class="scm-bulk-select" id="scm-bulk-select">${bulkSprintOpts}</select>
      <button class="scm-bulk-apply" onclick="_scmBulkApply()">Aplicar</button>
    </div>
    <div class="scm-migration-intro">${pendingItems.length} ítem${pendingItems.length !== 1 ? 's' : ''} pendiente${pendingItems.length !== 1 ? 's' : ''} — elige el destino de cada uno:</div>
    ${rows}
  `;
}

// R-202605-129: Retro automática enriquecida al cerrar sprint — Paso 3 del modal
// B-202605-270: función nombrada para descarga de retro desde paso 3 del SCM
// Extrae la lógica del IIFE inline para evitar problemas de parsing de atributos HTML
// y adjunta el anchor al body antes del click para garantizar descarga en todos los browsers
function _scmDownloadRetro() {
  if (!_scmState) return;
  const ta = document.getElementById('scm-retro-notes-ta');
  const notes = ta ? ta.value : '';
  _scmState.retroNotes = notes;
  const md = _generateSprintRetroMd(_scmState.id || '', notes);
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ds = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const pfx = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';
  const fname = pfx + '-Retrospectiva-' + (_scmState.id || '') + '-' + ds + '.md';
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast('download', 'Retro descargada', fname);
}

function _scmStep3Html(pendingItems, doneItems, migrations, skipStep2) {
  const doneCount      = doneItems.filter(i => i.status === 'done').length;
  const discardedCount = doneItems.filter(i => i.status === 'descartado').length;

  // agrupar pendientes por destino
  const toSprint   = pendingItems.filter(i => migrations[i.code] && migrations[i.code] !== '__discard__');
  const toUnassign = pendingItems.filter(i => !migrations[i.code]);
  const toDiscard  = pendingItems.filter(i => migrations[i.code] === '__discard__');

  const itemRow = (i, destLabel, cls) =>
    `<div class="scm-confirm-row">
      <span class="scm-item-type scm-type-${i.type||'T'} scm-flex-shrink-0">${esc(i.type||'T')}</span>
      <span class="scm-item-code">${esc(i.code)}</span>
      <span class="scm-item-title scm-item-title-cell">${esc(i.title || '—')}</span>
      <span class="scm-confirm-dest ${cls}">${esc(destLabel)}</span>
    </div>`;

  const spLabel = id => { const s = _getSprintById(id); return s ? (s.label || s.id) : id; };

  // ── R-202605-129: datos para retro enriquecida ──
  const st    = _scmState || {};
  const spObj = _getSprintById(st.id || '');

  const goal          = spObj && spObj.goal          ? spObj.goal          : '';
  const versionTarget = spObj && spObj.version_target ? spObj.version_target : '';
  const releaseType   = spObj && spObj.release_type   ? spObj.release_type   : '';

  const effortPl  = st.effortPlanned    || 0;
  const effortDn  = st.effortDone       || 0;
  const effortSA  = st.effortScopeAdded || 0;
  const effortND  = st.effortNotDone    || 0;
  const denomPct  = effortPl + effortSA;
  const pctDel    = denomPct > 0 ? Math.round(effortDn / denomPct * 100) : 0;
  const pctCls    = pctDel >= 70 ? 'scm-retro3-pct--good' : pctDel >= 40 ? 'scm-retro3-pct--warn' : 'scm-retro3-pct--bad';

  // Comparativa sprint anterior — último cerrado con deliveryMetrics
  const _prevSp = (() => {
    const closed = getActiveSprints()
      .filter(s => s.status === 'closed' && s.deliveryMetrics && s.id !== (st.id || ''))
      .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
    return closed[0] || null;
  })();

  let deltaHtml;
  if (_prevSp) {
    const dm       = _prevSp.deliveryMetrics;
    const prevDn   = dm.effortDone       || 0;
    const prevDnom = (dm.effortPlanned   || 0) + (dm.effortScopeAdded || 0);
    const prevPct  = prevDnom > 0 ? Math.round(prevDn / prevDnom * 100) : 0;
    const delta    = pctDel - prevPct;
    const sign     = delta > 0 ? '+' : '';
    const dCls     = delta > 0 ? 'scm-retro3-delta--up' : delta < 0 ? 'scm-retro3-delta--down' : 'scm-retro3-delta--flat';
    const dIcon    = delta > 0 ? '▲' : delta < 0 ? '▼' : '→';
    deltaHtml = `<div class="scm-retro3-delta-row">
      <span class="scm-retro3-delta-label">vs ${esc(_prevSp.label || _prevSp.id)}</span>
      <span class="scm-retro3-delta ${dCls}">${dIcon} ${sign}${delta}% · prev ${prevPct}% (${prevDn} effort)</span>
    </div>`;
  } else {
    deltaHtml = `<div class="scm-retro3-delta-row">
      <span class="scm-retro3-delta-label">Comparativa</span>
      <span class="scm-retro3-delta scm-retro3-delta--none">Primer sprint con datos completos</span>
    </div>`;
  }

  // Listas compactas de ítems para la retro preview
  const _miniRow = i =>
    `<div class="scm-retro3-mini-row">
       <span class="scm-item-code">${esc(i.code)}</span>
       <span class="scm-retro3-mini-title">${esc(i.title || '—')}</span>
     </div>`;

  const completadosMini  = doneItems.filter(i => i.status === 'done').map(_miniRow).join('');
  const migradosMini     = [...toSprint, ...toUnassign].map(_miniRow).join('');
  const descartadosMini  = [...doneItems.filter(i => i.status === 'descartado'), ...toDiscard].map(_miniRow).join('');

  // release type badge
  const rtBadge = releaseType
    ? `<span class="scm-release-tag scm-release-type scm-release-type--${releaseType.toLowerCase()}">${esc(releaseType)}</span>`
    : '';
  const vtHtml = versionTarget
    ? `<span class="scm-release-tag scm-release-version">${esc(versionTarget)}</span> ${rtBadge}`
    : rtBadge;

  // Bloque retro preview (visible antes de confirmar)
  const retroPreview = `
    <div class="scm-retro3-panel">
      <div class="scm-retro3-header">
        <span class="scm-retro3-title">📄 Retrospectiva del sprint</span>
        <button class="scm-retro3-dl-btn" type="button"
          onclick="_scmDownloadRetro()">⬇ Descargar MD</button>
      </div>
      <div class="scm-retro3-body">
        ${goal ? `<div class="scm-retro3-row"><span class="scm-retro3-key">Goal</span><span class="scm-retro3-val">${esc(goal)}</span></div>` : ''}
        ${(versionTarget || releaseType) ? `<div class="scm-retro3-row"><span class="scm-retro3-key">Release</span><span class="scm-retro3-val">${vtHtml}</span></div>` : ''}
        <div class="scm-retro3-row">
          <span class="scm-retro3-key">Effort</span>
          <span class="scm-retro3-val">
            <span class="scm-retro3-effort-done">${effortDn}</span>
            <span class="scm-retro3-effort-sep"> / ${effortPl} plan.</span>
            ${effortSA > 0 ? `<span class="scm-retro3-effort-sa"> +${effortSA} scope added</span>` : ''}
            <span class="scm-retro3-pct ${pctCls}"> ${pctDel}%</span>
            ${effortND > 0 ? `<span class="scm-retro3-effort-nd"> · ${effortND} no ent.</span>` : ''}
          </span>
        </div>
        ${deltaHtml}
        ${completadosMini  ? `<div class="scm-retro3-list-wrap"><span class="scm-retro3-list-label">✅ Completados (${doneCount})</span><div class="scm-retro3-mini-list">${completadosMini}</div></div>` : ''}
        ${migradosMini     ? `<div class="scm-retro3-list-wrap"><span class="scm-retro3-list-label">⏭ Migrados (${toSprint.length + toUnassign.length})</span><div class="scm-retro3-mini-list">${migradosMini}</div></div>` : ''}
        ${descartadosMini  ? `<div class="scm-retro3-list-wrap scm-retro3-list-wrap--disc"><span class="scm-retro3-list-label">🗑 Descartados (${discardedCount + toDiscard.length})</span><div class="scm-retro3-mini-list">${descartadosMini}</div></div>` : ''}
      </div>
      <div class="scm-retro3-notes">
        <div class="scm-retro-notes-label">📝 Notas <span class="scm-retro-notes-hint">(opcional — se guardan con el sprint)</span></div>
        <textarea
          class="scm-retro-notes-ta"
          id="scm-retro-notes-ta"
          rows="3"
          placeholder="¿Qué salió bien? ¿Qué mejorar? ¿Algún aprendizaje para el próximo sprint?"
          oninput="if (_scmState) _scmState.retroNotes = this.value"
        >${esc(st.retroNotes || '')}</textarea>
      </div>
    </div>`;

  // ── Confirmación de movimientos ──
  let html = `<div class="scm-confirm-intro">Revisa la retro y los movimientos. <strong>Esta acción no se puede deshacer.</strong></div>`;
  html += retroPreview;
  html += `<div class="scm-confirm-movements-title">Movimientos de ítems</div>`;

  if (doneCount) html += `
    <div class="scm-confirm-group">
      <div class="scm-confirm-group-title">Completados (${doneCount}) → histórico</div>
      ${doneItems.filter(i => i.status === 'done').map(i => itemRow(i, 'histórico', '')).join('')}
    </div>`;

  if (discardedCount) html += `
    <div class="scm-confirm-group">
      <div class="scm-confirm-group-title">Descartados (${discardedCount}) → histórico</div>
      ${doneItems.filter(i => i.status === 'descartado').map(i => itemRow(i, 'histórico', '')).join('')}
    </div>`;

  if (!skipStep2) {
    const byDest = {};
    toSprint.forEach(i => {
      const d = migrations[i.code];
      if (!byDest[d]) byDest[d] = [];
      byDest[d].push(i);
    });
    Object.entries(byDest).forEach(([dest, items]) => {
      html += `<div class="scm-confirm-group">
        <div class="scm-confirm-group-title">→ ${esc(spLabel(dest))} (${items.length})</div>
        ${items.map(i => itemRow(i, spLabel(dest), '')).join('')}
      </div>`;
    });

    if (toUnassign.length) html += `
      <div class="scm-confirm-group">
        <div class="scm-confirm-group-title">Sin asignar (${toUnassign.length})</div>
        ${toUnassign.map(i => itemRow(i, 'sin asignar', 'scm-confirm-dest--unassign')).join('')}
      </div>`;

    if (toDiscard.length) html += `
      <div class="scm-confirm-group">
        <div class="scm-confirm-group-title">Descartar (${toDiscard.length})</div>
        ${toDiscard.map(i => itemRow(i, 'descartar', 'scm-confirm-dest--discard')).join('')}
      </div>`;
  }

  if (!doneCount && !discardedCount && pendingItems.length === 0) {
    html += '<div class="scm-empty-hint">Sprint sin ítems — se cerrará como vacío.</div>';
  }

  html += `
    <div class="scm-backup-hint">
      💾 Backup opcional:
      <button class="scm-docgen-btn" onclick="exportFullHistoryMd()" type="button">Descargar historial completo</button>
    </div>`;

  return html;
}

function _scmExecuteClose() {
  if (!_scmState) return;
  const { id, pendingItems, migrations, retroNotes,
          effortPlanned, effortDone, effortScopeAdded, effortNotDone } = _scmState;

  // aplicar migraciones de pendientes
  const closeTs = Date.now();
  pendingItems.forEach(i => {
    const dest = migrations[i.code];
    if (dest === '__discard__') {
      // B-202605-231: migrar a historico — no dejar como descartado en backlog vivo
      i.status = 'historico';
      i.archivedAt = closeTs;
      i.sprint = id; // mantiene referencia al sprint cerrado
    } else {
      i.sprint = dest || ''; // sprint destino o sin asignar
    }
  });

  // B-202604-193: archivar done/descartado → histórico
  // B-[tmp:sprint-revive]: excluir ítems ya procesados por el loop de migraciones
  // (pendientes con __discard__ ya quedan como historico arriba — processedCodes los excluye)
  const processedCodes = new Set(pendingItems.map(i => i.code));
  // R-202605-134: resolver version_target del sprint antes de iterar
  const spForClose = _getSprintById(id);
  const versionTarget = spForClose && spForClose.version_target ? spForClose.version_target : null;
  ITEMS.forEach(i => {
    if (i.sprint === id && !processedCodes.has(i.code) && (i.status === 'done' || i.status === 'descartado')) {
      const wasDone = i.status === 'done';
      i.status = 'historico';
      i.archivedAt = closeTs;
      // R-202605-134: aplicar version_target como version en ítems que estaban done
      if (wasDone && versionTarget) i.version = versionTarget;
    }
  });

  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  // B-[tmp:historico-expand]: forzar expansión del histórico post-cierre
  // sin esto la lista principal queda vacía y el histórico aparece colapsado
  try { localStorage.setItem(_HISTORICO_KEY, '1'); } catch {}
  closeCloseSprintModal();
  setSprintStatus(id, 'closed');
  renderStats(); // B-202605-269: refrescar contadores del backlog inmediatamente post-cierre

  // T-202604-417: guardar retro como documento en el sprint — accesible desde vista de sprints cerrados
  // R-202605-125: persistir métricas de entrega con el sprint cerrado
  const sp = _getSprintById(id);
  if (sp) {
    sp.retroNotes = retroNotes || '';
    sp.retroDoc   = _generateSprintRetroMd(id, retroNotes || '');
    // R-202605-125: métricas de entrega para Analytics (Nivel 2)
    const denominator = (effortPlanned || 0) + (effortScopeAdded || 0);
    sp.deliveryMetrics = {
      effortPlanned:    effortPlanned    || 0,
      effortDone:       effortDone       || 0,
      effortScopeAdded: effortScopeAdded || 0,
      effortNotDone:    effortNotDone    || 0,
      pctDelivery:      denominator ? Math.round((effortDone || 0) / denominator * 100) : 0,
      recordedAt:       Date.now(),
    };
    save();
  }

  // T-202604-295: descargar templates al cerrar sprint si trigger lo indica
  if (typeof _templateTrigger === 'function' && _templateTrigger() === 'sprint') {
    downloadTemplates();
  }

  // T-202604-417: ofrecer descarga de retro integrada al flujo
  if (sp && sp.retroDoc) {
    _openRetroDownloadPrompt(id);
  }
}

function createSprintFromGroup(id) {
  // Registra en catálogo un sprint que ya tiene ítems pero no estaba en proj.sprints
  if (_getSprintById(id)) return;
  const proj = getActiveProject();
  if (!proj) return;
  if (!proj.sprints) proj.sprints = [];
  proj.sprints.push({ id, label: id, status: 'open' });
  save();
  renderBacklogList();
  showToast('success', id + ' registrado en catálogo');
}

// R-[pendiente-ID]: navegar a un ítem del backlog por código — cambia a tab backlog, sub-tab backlog, hace scroll y pulsa highlight
function navigateToItem(code) {
  if (!code) return;
  // Asegurar que el filtro de status incluye el status del ítem
  const item = ITEMS.find(i => i.code === code);
  if (item && !activeStatuses.has(item.status)) {
    activeStatuses.add(item.status);
    updateStatusFilterUI();
  }
  if (typeof switchTab === 'function') switchTab('backlog');
  if (typeof switchSubTab === 'function') switchSubTab('backlog');
  // Esperar render y hacer scroll
  setTimeout(() => {
    const el = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('bitem--nav-highlight');
    setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1400);
  }, 120);
}

// ── T-098: Exportar Backlog.md ──


// T-202604-286: sección "Mencionado en" — sesiones que referencian este ítem
function _buildItemMentionedIn(item) {
  if (typeof getAllSessions !== 'function') return '';
  const allSessions = getAllSessions();
  const mentions = allSessions.filter(s =>
    (s.backlogRefs || s.trackerRefs || []).includes(item.code)
  );
  if (!mentions.length) return '';

  const _fmtRel = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    const diffMs = Date.now() - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays}d`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)}sem`;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  const rows = mentions.map(s => {
    const ai = typeof getAI === 'function' ? getAI(s.aiId) : null;
    const aiName = ai ? esc(ai.name) : 'IA';
    const ts = s.savedAt || s.createdAt || 0;
    const dateLabel = _fmtRel(ts) || s.dateShort || s.date || '';
    const title = s.title ? esc(s.title) : '';
    return `<div class="bitem-mention-row" onclick="event.stopPropagation();switchTab('tracker');setViewMode('chrono');setTimeout(()=>scrollToLogCard('${esc(s.id)}'),150)" title="Ver en Log View">
      <span class="bitem-mention-ai">${aiName}</span>
      <span class="bitem-mention-date">${dateLabel}</span>
      ${title ? `<span class="bitem-mention-title">${title}</span>` : ''}
    </div>`;
  }).join('');

  return `<div class="bitem-mentioned-in">
    <span class="bitem-mentioned-label">Mencionado en</span>
    ${rows}
  </div>`;
}

// T-202604-242: bloque visual "migrado de [proyecto]" en item-body
function _buildItemMigratedBlock(item) {
  if (!item.migratedFrom) return '';
  const fromProj = item.migratedFromProject ? esc(item.migratedFromProject) : '(proyecto anterior)';
  return `<div class="bitem-migrated-block">
    <span class="bitem-migrated-label">&#x21C4; Migrado de</span>
    <span class="bitem-migrated-value">${fromProj}</span>
    <span class="bitem-migrated-code" title="Código original">(${esc(item.migratedFrom)})</span>
  </div>`;
}

// T-202604-242: modal de selección de proyecto destino
function _openMigrateItem(code) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  const currentProjId = _getActiveProjectFilter();
  const currentProj = currentProjId ? getProjectById(currentProjId) : null;
  const currentProjName = currentProj ? currentProj.name : '(sin proyecto)';

  const destProjects = (state.projects || []).filter(p => p.status !== 'paused' && p.id !== currentProjId);
  if (!destProjects.length) {
    showToast('warning', 'No hay otros proyectos disponibles como destino');
    return;
  }

  const projOptions = destProjects.map(p =>
    `<label class="migrate-modal-option"><input type="radio" name="migrate-dest" value="${esc(p.id)}"> ${esc(p.name)}</label>`
  ).join('');

  // R-202604-047: shell estático en index.html — inject content + classList
  const overlay = document.getElementById('migrate-item-overlay');
  if (!overlay) return;
  const body = document.getElementById('migrate-modal-body');
  if (body) {
    body.innerHTML = `
      <div class="promote-modal-title">&#x21C4; Mover item a otro proyecto</div>
      <div class="migrate-modal-item">Item: <strong>${esc(item.code)}</strong> &mdash; ${esc(item.title || '')}</div>
      <div class="migrate-modal-origin">Origen: ${esc(currentProjName)}</div>
      <div class="migrate-modal-dest-label">Proyecto destino</div>
      <div class="migrate-modal-options">
        ${projOptions}
      </div>
      <div class="migrate-modal-hint">El item desaparecera del proyecto actual y aparecera en el destino con una referencia de origen.</div>
      <div class="migrate-modal-actions">
        <button onclick="document.getElementById('migrate-item-overlay').classList.remove('open')" class="btn-cancel">Cancelar</button>
        <button id="migrate-confirm-btn" onclick="_confirmMigrateItem('${esc(code)}')" class="btn-primary" disabled>&#x21C4; Mover</button>
      </div>`;
  }
  overlay.classList.add('open');
  overlay.querySelectorAll('input[name="migrate-dest"]').forEach(r => {
    r.addEventListener('change', () => {
      const btn = document.getElementById('migrate-confirm-btn');
      if (btn) btn.disabled = false;
    });
  });
}

// T-202604-242: ejecutar migración — AC-1 conservar ref, AC-2 flag destino, AC-3 sin duplicado en origen
function _confirmMigrateItem(code) {
  const overlay = document.getElementById('migrate-item-overlay');
  const selected = overlay ? overlay.querySelector('input[name="migrate-dest"]:checked') : null;
  if (!selected) return;
  const targetProjId = selected.value;

  const item = ITEMS.find(i => i.code === code);
  if (!item) return;

  const currentProjId = _getActiveProjectFilter();
  const currentProj = currentProjId ? getProjectById(currentProjId) : null;
  const currentProjName = currentProj ? currentProj.name : '(sin proyecto)';
  const targetProj = getProjectById(targetProjId);
  if (!targetProj) return;

  // AC-1: item destino conserva codigo origen como ref
  // AC-2: flag migratedFrom + migratedFromProject para bloque visual
  const migratedItem = Object.assign({}, item, {
    migratedFrom: code,
    migratedFromProject: currentProjName,
    migratedAt: Date.now()
  });

  const targetItems = getProjBacklog(targetProjId);
  targetItems.push(migratedItem);
  setProjBacklog(targetProjId, targetItems);

  // AC-3: eliminar del origen — sin duplicado
  const idx = ITEMS.indexOf(item);
  if (idx !== -1) {
    _undoSnapshot();
    ITEMS.splice(idx, 1);
    saveBacklog();
  }

  if (overlay) overlay.classList.remove('open');
  renderBacklogList();
  renderStats();
  showToast('success', '&#x21C4; ' + code + ' movido a "' + targetProj.name + '"');
}

// ═══ T-202604-253: Space → done para ítem seleccionado ═══

// AC-1 + helper visual: marcar ítem como seleccionado (resaltar)
function _backlogSetSelected(el) {
  // Quitar selección previa
  document.querySelectorAll('.item.bitem--selected').forEach(e => e.classList.remove('bitem--selected'));
  if (!el) { _backlogSelectedCode = null; return; }
  el.classList.add('bitem--selected');
  _backlogSelectedCode = el.getAttribute('data-code') || null;
}

// AC-1: keydown handler — Space cambia status a done si hay ítem seleccionado
// AC-2: sin conflicto con textarea, input, select, contenteditable
// B-202605-060: cleanup antes de registrar — evita acumulación en hot reload
(function _initBacklogSpaceKey() {
  if (document._backlogSpaceHandler) {
    document.removeEventListener('keydown', document._backlogSpaceHandler);
  }
  function _backlogSpaceHandler(e) {
    if (e.key !== ' ' && e.code !== 'Space') return;
    // AC-2: ignorar si el foco está en un campo de texto
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (document.activeElement && document.activeElement.isContentEditable) return;

    if (!_backlogSelectedCode) return;

    const item = typeof ITEMS !== 'undefined' ? ITEMS.find(i => i.code === _backlogSelectedCode) : null;
    if (!item || item.status === 'done' || item.status === 'descartado') return;

    e.preventDefault();
    const code = _backlogSelectedCode;

    // Cambiar status a done vía setItemStatus existente
    setItemStatus(code, 'done');

    // Toast con acción Undo inline
    if (typeof showToast === 'function') {
      showToast('success',
        `<span class="toast-undo-wrap">` +
        `<span>✓ <strong>${code}</strong> → done</span>` +
        `<button onclick="undoBacklog();this.closest('.toast-item, [class*=toast]')?.remove?.()" ` +
        `class="toast-undo-btn">↩ Undo</button>` +
        `</span>`,
        null, 4000
      );
    }
  }
  document._backlogSpaceHandler = _backlogSpaceHandler;
  document.addEventListener('keydown', _backlogSpaceHandler);
})();

// Deseleccionar al hacer clic fuera de ítems del backlog
document.addEventListener('click', function(e) {
  if (!_backlogSelectedCode) return;
  const item = e.target.closest('.item[data-code]');
  if (!item) {
    document.querySelectorAll('.item.bitem--selected').forEach(el => el.classList.remove('bitem--selected'));
    _backlogSelectedCode = null;
  }
});

// ═══════════════════════════════════════════════════════════════
// R-202604-015: Item Detail Panel — ficha viva del ítem
// ═══════════════════════════════════════════════════════════════

let _itemPanelCode = null;

// B-244: Modo Focus — estado y función toggle
let _focusModeActive = false;

function toggleFocusMode() {
  _focusModeActive = !_focusModeActive;
  document.body.classList.toggle('body--focus-mode', _focusModeActive);
  // Actualizar botón en panel si está abierto
  const focusBtn = document.getElementById('idp-focus-btn');
  if (focusBtn) {
    focusBtn.textContent = _focusModeActive ? '⛶ Salir focus' : '⛶ Focus';
    focusBtn.title = _focusModeActive ? 'Salir del Modo Focus (Esc)' : 'Activar Modo Focus';
    focusBtn.classList.toggle('idp-action-btn--active', _focusModeActive);
  }
}

function exitFocusMode() {
  if (_focusModeActive) {
    _focusModeActive = false;
    document.body.classList.remove('body--focus-mode');
    const focusBtn = document.getElementById('idp-focus-btn');
    if (focusBtn) {
      focusBtn.textContent = '⛶ Focus';
      focusBtn.title = 'Activar Modo Focus';
      focusBtn.classList.remove('idp-action-btn--active');
    }
  }
}
let _itemPanelNotesTimer = null;

function openItemPanel(code) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  _itemPanelCode = code;

  // R-202604-047: panel y wrapper estáticos en index.html — solo classList
  const panel = document.getElementById('item-detail-panel');
  const wrap = document.getElementById('backlog-two-col-wrap');
  if (!panel) return;

  if (wrap) wrap.classList.add('backlog-two-col');

  // B-161: ocultar roadmap y sprint health para liberar espacio en layout two-col
  const roadmap = document.getElementById('sprint-roadmap');
  if (roadmap) roadmap.classList.add('is-hidden');
  const spHealth = document.getElementById('sprint-health-panel');
  if (spHealth) spHealth.classList.add('is-hidden');

  // Registrar Esc handler (sin duplicar)
  document.removeEventListener('keydown', _itemPanelEscHandler);
  document.addEventListener('keydown', _itemPanelEscHandler);

  _renderItemPanel(item);
  panel.classList.add('open');
}

function closeItemPanel() {
  const panel = document.getElementById('item-detail-panel');
  if (panel) {
    panel.classList.remove('open');
    // B-244: salir de focus mode al cerrar el panel
    exitFocusMode();
    // Colapsar layout two-col al cerrar
    setTimeout(() => {
      const wrap = document.getElementById('backlog-two-col-wrap');
      if (wrap) wrap.classList.remove('backlog-two-col');
      // B-161: restaurar roadmap y sprint health al cerrar panel
      const roadmap = document.getElementById('sprint-roadmap');
      if (roadmap) roadmap.classList.remove('is-hidden');
      const spHealth = document.getElementById('sprint-health-panel');
      if (spHealth) spHealth.classList.remove('is-hidden');
    }, 280);
  }
  _itemPanelCode = null;
  document.removeEventListener('keydown', _itemPanelEscHandler);
}

function _itemPanelEscHandler(e) {
  if (e.key === 'Escape') {
    // B-244: si modo focus activo, salir primero sin cerrar el panel
    if (_focusModeActive) {
      exitFocusMode();
      // B-202605-051: si _backlogFocusMode también está activo, desactivarlo en el mismo Esc
      if (_backlogFocusMode && typeof toggleBacklogFocusMode === 'function') toggleBacklogFocusMode();
      return;
    }
    // Colapsar el ítem expandido también
    if (_itemPanelCode) {
      const itemEl = document.querySelector(`.item[data-code="${CSS.escape(_itemPanelCode)}"]`);
      if (itemEl) {
        const body = itemEl.querySelector('.bitem-body');
        const arrow = itemEl.querySelector('.bitem-collapse-arrow');
        if (body && body.classList.contains('open')) {
          body.classList.remove('open');
          if (arrow) arrow.textContent = '▸';
        }
      }
    }
    closeItemPanel();
  }
}

function _renderItemPanel(item) {
  const panel = document.getElementById('item-detail-panel');
  if (!panel) return;

  const type = itemType(item.code) || '';
  const typeColors = { T: '#2ecc78', R: '#38bdf8', B: '#e85555', P: '#7c6af7' };
  const typeColor = typeColors[type] || 'var(--text2)';
  const TYPE_NAMES = { T: 'Ticket', R: 'Requerimiento', B: 'Bug', P: 'Posibilidad' };

  // ── Header ──
  const doneBtn = item.status !== 'done' ? `<button class="idp-action-btn idp-action-done" onclick="_idpMarkDone('${esc(item.code)}')" title="Marcar done">✓ Done</button>` : '';
  const headerHtml = `
    <div class="idp-header">
      <div class="idp-type-chip idp-type-${type}" style="--tc:${typeColor}">${type}</div>
      <div class="idp-header-meta">
        <span class="idp-code">${esc(item.code)}</span>
        <span class="idp-type-name">${TYPE_NAMES[type] || type}</span>
      </div>
      <button class="idp-close-btn" onclick="closeItemPanel()" title="Cerrar panel (Esc)">✕</button>
    </div>
    <div class="idp-title-wrap">
      <span class="idp-title" id="idp-title-display"
        onclick="_idpStartEditTitle('${esc(item.code)}')"
        title="Click para editar título">${esc(item.title)}</span>
      <input class="idp-title-input hidden" id="idp-title-input"
        value="${esc(item.title)}"
        onblur="_idpSaveTitle('${esc(item.code)}')"
        onkeydown="if(event.key==='Enter'){event.preventDefault();_idpSaveTitle('${esc(item.code)}');}if(event.key==='Escape'){_idpCancelTitle();}">
    </div>
    <div class="idp-actions-bar">
      <button class="idp-action-btn" onclick="_idpCopyCode('${esc(item.code)}')" title="Copiar código">⎘ ${esc(item.code)}</button>
      <button class="idp-action-btn" onclick="_openItemEditorSafe(null,'${esc(item.code)}')" title="Abrir editor completo">✎ Editar</button>
      ${doneBtn}
      <button class="idp-action-btn${_focusModeActive ? ' idp-action-btn--active' : ''}" id="idp-focus-btn" onclick="toggleFocusMode()" title="${_focusModeActive ? 'Salir del Modo Focus (Esc)' : 'Activar Modo Focus'}">${_focusModeActive ? '⛶ Salir focus' : '⛶ Focus'}</button>
    </div>`;

  // ── Metadata grid — campos editables ──
  const sprintOptions = getActiveSprints().filter(s => s.status !== 'closed')
    .map(s => `<option value="${esc(s.id)}"${item.sprint === s.id ? ' selected' : ''}>${esc(s.label || s.id)}${s.status === 'active' ? ' ★' : ''}</option>`).join('');
  const sprintOrphan = item.sprint && !getActiveSprints().find(s => s.id === item.sprint)
    ? `<option value="${esc(item.sprint)}" selected>${esc(item.sprint)}</option>` : '';

  const metaHtml = `
    <div class="idp-meta-grid">
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Status</span>
        <select class="idp-meta-select" onchange="setItemStatus('${esc(item.code)}',this.value)">
          <option value="pendiente"${item.status === 'pendiente' ? ' selected' : ''}>⏳ pendiente</option>
          <option value="done"${item.status === 'done' ? ' selected' : ''}>✓ done</option>
          <option value="descartado"${item.status === 'descartado' ? ' selected' : ''}>🗑 descartado</option>
        </select>
      </div>
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Priority</span>
        <select class="idp-meta-select" onchange="_idpSetField('${esc(item.code)}','priority',this.value)">
          <option value="high"${item.priority === 'high' ? ' selected' : ''}>🔴 high</option>
          <option value="medium"${item.priority === 'medium' ? ' selected' : ''}>🟡 medium</option>
          <option value="low"${item.priority === 'low' ? ' selected' : ''}>⚪ low</option>
        </select>
      </div>
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Sprint</span>
        <select class="idp-meta-select" onchange="setItemSprint('${esc(item.code)}',this.value)">
          <option value="">— Sin asignar</option>
          ${sprintOptions}
          ${sprintOrphan}
          <option value="__new__">＋ Nuevo...</option>
        </select>
      </div>
      <div class="idp-meta-cell">
        <span class="idp-meta-label">Effort</span>
        <select class="idp-meta-select" onchange="_idpSetField('${esc(item.code)}','effort',this.value)">
          <option value=""${!item.effort ? ' selected' : ''}>—</option>
          <option value="1"${item.effort == 1 ? ' selected' : ''}>1 · simple</option>
          <option value="2"${item.effort == 2 ? ' selected' : ''}>2 · medio</option>
          <option value="3"${item.effort == 3 ? ' selected' : ''}>3 · complejo</option>
        </select>
      </div>
      <div class="idp-meta-cell idp-meta-cell--wide">
        <span class="idp-meta-label">Area</span>
        <input class="idp-meta-input" value="${esc(item.area || '')}" placeholder="—"
          onblur="_idpSetField('${esc(item.code)}','area',this.value)"
          onkeydown="if(event.key==='Enter')this.blur()">
      </div>
    </div>`;

  // ── Notes ──
  const notesHtml = `
    <div class="idp-section">
      <div class="idp-section-label">Notas</div>
      <textarea class="idp-notes-ta" id="idp-notes-ta" placeholder="Añade notas sobre este ítem..."
        oninput="_itemPanelNotesDirty()">${esc(item.notes || '')}</textarea>
      <div class="idp-notes-status" id="idp-notes-status"></div>
    </div>`;

  // ── Sessions vinculadas ──
  const allSessions = typeof getAllSessions === 'function' ? getAllSessions() : [];
  const linkedSessions = allSessions.filter(s => (s.trackerRefs || []).includes(item.code));
  const sessionsHtml = linkedSessions.length ? `
    <div class="idp-section">
      <div class="idp-section-label">Sesiones vinculadas</div>
      <div class="idp-sessions-list">
        ${linkedSessions.map(s => {
          const ai = typeof getAI === 'function' ? getAI(s.aiId) : null;
          const aiName = ai ? esc(ai.name) : 'IA';
          const dateLabel = s.dateShort || s.date || '';
          return `<div class="idp-session-chip" onclick="switchTab('tracker');setTimeout(()=>openDetail('${s.aiId}','${s.id}'),120)">
            <span class="idp-sess-ai">${aiName}</span>
            <span class="idp-sess-date">${esc(dateLabel)}</span>
            ${s.title ? `<span class="idp-sess-title">${esc(s.title)}</span>` : ''}
            <button class="idp-sess-unlink" onclick="event.stopPropagation();_idpUnlinkSession('${esc(item.code)}','${s.id}')" title="Desvincular sesión">✕</button>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // ── AC colapsable ──
  const acHtml = item.ac && item.ac.length ? `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" onclick="_idpToggleAc()">
        <span>Criterios de aceptación</span>
        <span class="idp-toggle-arrow" id="idp-ac-arrow">▾</span>
      </div>
      <div class="idp-ac-list" id="idp-ac-list">
        ${item.ac.map(c => `<div class="idp-ac-item"><span class="idp-ac-dot" style="--tc:${typeColor}"></span>${esc(c)}</div>`).join('')}
      </div>
    </div>` : '';

  // ── Timeline ──
  const timelineHtml = _buildPanelTimeline(item);

  // T-202605-449: sección Dependencias — Bloqueado por / Bloquea a
  const allBlockedBy = (item.blockedBy || []);
  const blockedByPending = allBlockedBy.filter(c => { const dep = ITEMS.find(i => i.code === c); return !dep || dep.status !== 'done'; });
  const blockedByDone    = allBlockedBy.filter(c => { const dep = ITEMS.find(i => i.code === c); return dep && dep.status === 'done'; });
  const blockingOthers = ITEMS.filter(i => i.blockedBy && i.blockedBy.includes(item.code) && i.status !== 'done' && i.status !== 'descartado');

  const _depsChip = (code, isDone) => {
    const dep = ITEMS.find(i => i.code === code);
    const title = dep ? esc(dep.title) : '';
    const cls = isDone ? 'idp-dep-chip idp-dep-chip--done' : 'idp-dep-chip';
    const icon = isDone ? '✓' : '🔒';
    return `<span class="${cls}" onclick="openItemPanel('${esc(code)}')" title="${title}">${icon} ${esc(code)}</span>`;
  };

  const depsHtml = (allBlockedBy.length || blockingOthers.length) ? `
    <div class="idp-section idp-section--deps">
      <div class="idp-section-label">Dependencias</div>
      ${allBlockedBy.length ? `
        <div class="idp-deps-row">
          <span class="idp-deps-label">Bloqueado por</span>
          <div class="idp-deps-chips">
            ${blockedByPending.map(c => _depsChip(c, false)).join('')}
            ${blockedByDone.map(c => _depsChip(c, true)).join('')}
          </div>
        </div>` : ''}
      ${blockingOthers.length ? `
        <div class="idp-deps-row">
          <span class="idp-deps-label">Bloquea a</span>
          <div class="idp-deps-chips">
            ${blockingOthers.map(i => {
              return `<span class="idp-dep-chip idp-dep-chip--blocks" onclick="openItemPanel('${esc(i.code)}')" title="${esc(i.title)}">⚠ ${esc(i.code)}</span>`;
            }).join('')}
          </div>
        </div>` : ''}
    </div>` : '';

  panel.innerHTML = `
    <div class="idp-inner">
      ${headerHtml}
      ${metaHtml}
      <div class="idp-divider"></div>
      ${depsHtml}
      ${notesHtml}
      ${sessionsHtml ? sessionsHtml : ''}
      ${acHtml}
      ${timelineHtml}
    </div>`;
}

function _buildPanelTimeline(item) {
  const _fmt = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays}d`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays/7)}sem`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays/30)}mes`;
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short' });
  };
  const _iso = ts => ts ? new Date(ts).toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' }) : '';

  const entries = [];

  // Creación
  if (item.createdAt) {
    entries.push({ ts: item.createdAt, type: 'created', icon: '✦', label: 'Creado', color: 'var(--hint)' });
  }

  // Historial de status desde history[]
  if (item.history && item.history.length) {
    item.history.forEach(h => {
      if (h.type === 'status') {
        const fromLabel = h.data.from ? `${h.data.from} → ` : '';
        const toLabel = h.data.to || '?';
        const statusIcons = { done: '✓', pendiente: '⏳', descartado: '🗑' };
        const statusColors2 = { done: '#2ecc78', pendiente: 'var(--text2)', descartado: 'var(--hint)' };
        entries.push({
          ts: h.ts,
          type: 'status',
          icon: statusIcons[toLabel] || '🔄',
          label: `${fromLabel}${toLabel}`,
          color: statusColors2[toLabel] || 'var(--text2)',
          sub: h.data.role || ''
        });
      } else if (h.type === 'sprint') {
        const from = h.data.from ? `${h.data.from} → ` : '';
        const to = h.data.to || '— sin asignar';
        // B-202605-241: origin 'checkpoint' (antes 'import') muestra 'CHECKPOINT · [sessionId]'
        const sub = (h.origin === 'checkpoint' || h.origin === 'import') ? `CHECKPOINT${h.sessionId ? ' · ' + h.sessionId : ''}` : '';
        entries.push({ ts: h.ts, type: 'sprint', icon: '🏃', label: `Sprint: ${from}${to}`, color: '#38bdf8', sub });
      } else if (h.type === 'field') {
        const fieldLabel = { effort: 'Effort', priority: 'Priority', area: 'Area', role: 'Role', desc: 'Descripción', ac: 'AC', notes: 'Notas', blockedBy: 'Bloqueado por' }[h.data.field] || h.data.field;
        const from = h.data.from ? `${h.data.from} → ` : '';
        // T-202604-423: ac puede ser array — mostrar conteo
        let toLabel = h.data.to || '—';
        if (h.data.field === 'ac' && Array.isArray(h.data.to)) toLabel = `${h.data.to.length} criterio${h.data.to.length !== 1 ? 's' : ''}`;
        // B-202605-241: mismo fix — backward compat con 'import' existente en datos
        const sub = (h.origin === 'checkpoint' || h.origin === 'import') ? `CHECKPOINT${h.sessionId ? ' · ' + h.sessionId : ''}` : '';
        entries.push({ ts: h.ts, type: 'field', icon: '✎', label: `${fieldLabel}: ${from}${toLabel}`, color: 'var(--text2)', sub });
      } else if (h.type === 'title') {
        // T-202604-423: cambio de título
        const from = h.data.from ? `"${h.data.from}" → ` : '';
        // B-202605-241: mismo fix
        const sub = (h.origin === 'checkpoint' || h.origin === 'import') ? `CHECKPOINT${h.sessionId ? ' · ' + h.sessionId : ''}` : '';
        entries.push({ ts: h.ts, type: 'title', icon: '✏', label: `Título: ${from}"${h.data.to || ''}"`, color: 'var(--text2)', sub });
      } else if (h.type === 'note') {
        entries.push({ ts: h.ts, type: 'note', icon: '✍', label: h.data.text || '', color: 'var(--accent)' });
      } else if (h.type === 'unblocked') {
        entries.push({ ts: h.ts, type: 'unblocked', icon: '🔓', label: `Desbloqueado por ${h.data.by || ''}`, color: '#2ecc78' });
      } else if (h.type === 'session-linked') {
        // B-246 + B-245: vinculación de sesión con nombre de IA
        const aiLinked = h.aiId && typeof getAI === 'function' ? getAI(h.aiId) : null;
        const aiName = aiLinked ? aiLinked.name : (h.aiId || '');
        entries.push({ ts: h.ts, type: 'session-linked', icon: '🔗', label: `Sesión vinculada${aiName ? ' · ' + aiName : ''}`, color: '#7c6af7', sub: h.data && h.data.sessId ? h.data.sessId : '' });
      } else if (h.type === 'session-unlinked') {
        // B-246 + B-245: desvinculación de sesión con nombre de IA
        const aiUnlinked = h.aiId && typeof getAI === 'function' ? getAI(h.aiId) : null;
        const aiNameU = aiUnlinked ? aiUnlinked.name : (h.aiId || '');
        entries.push({ ts: h.ts, type: 'session-unlinked', icon: '🔗', label: `Sesión desvinculada${aiNameU ? ' · ' + aiNameU : ''}`, color: 'var(--hint)', sub: h.data && h.data.sessId ? h.data.sessId : '' });
      }
    });
  } else if (item.statusChangedAt) {
    // Fallback para ítems sin history[]
    const statusIcons2 = { done: '✓', pendiente: '⏳', descartado: '🗑' };
    const statusColors3 = { done: '#2ecc78', pendiente: 'var(--text2)', descartado: 'var(--hint)' };
    entries.push({
      ts: item.statusChangedAt,
      type: 'status',
      icon: statusIcons2[item.status] || '🔄',
      label: `→ ${item.status}`,
      color: statusColors3[item.status] || 'var(--text2)'
    });
  }

  // Done
  if (item.doneAt && item.status === 'done') {
    const alreadyHasDone = entries.some(e => e.type === 'status' && e.ts === item.doneAt);
    if (!alreadyHasDone) {
      entries.push({ ts: item.doneAt, type: 'done', icon: '✓', label: 'Completado', color: '#2ecc78' });
    }
  }

  // Sesiones vinculadas en timeline
  const allSessions = typeof getAllSessions === 'function' ? getAllSessions() : [];
  allSessions.forEach(s => {
    if ((s.trackerRefs || []).includes(item.code)) {
      const ai = typeof getAI === 'function' ? getAI(s.aiId) : null;
      const ts = s.savedAt || s.createdAt || 0;
      if (ts) {
        entries.push({
          ts,
          type: 'session',
          icon: '⚡',
          label: (ai ? ai.name + ' · ' : '') + (s.dateShort || s.date || ''),
          color: '#7c6af7',
          sub: s.title || ''
        });
      }
    }
  });

  if (!entries.length) return `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" onclick="_idpToggleHistory()">
        <span>Historial</span>
        <span class="idp-toggle-arrow" id="idp-hist-arrow">▸</span>
      </div>
      <div class="idp-hist-body hidden" id="idp-hist-body">
        <div class="idp-tl-note-row">
          <input class="idp-tl-note-input" id="idp-tl-note-input" placeholder="Añadir nota al historial…"
            onkeydown="if(event.key==='Enter'&&this.value.trim()){_idpAddNote('${esc(item.code)}',this.value.trim());this.value=''}">
          <button class="idp-tl-note-btn" onclick="_idpAddNote_fromBtn('${esc(item.code)}')">＋</button>
        </div>
      </div>
    </div>`;

  // Ordenar cronológico
  entries.sort((a, b) => a.ts - b.ts);

  const rows = entries.map(e => `
    <div class="idp-tl-entry">
      <div class="idp-tl-dot-col">
        <div class="idp-tl-dot" style="--tl-color:${e.color}"></div>
        <div class="idp-tl-line"></div>
      </div>
      <div class="idp-tl-content">
        <div class="idp-tl-main">
          <span class="idp-tl-icon">${e.icon}</span>
          <span class="idp-tl-label" style="--tl-color:${e.color}">${esc(e.label)}</span>
          <span class="idp-tl-ts" title="${_iso(e.ts)}">${_fmt(e.ts)}</span>
        </div>
        ${e.sub ? `<div class="idp-tl-sub">${esc(e.sub)}</div>` : ''}
      </div>
    </div>`).join('');

  return `
    <div class="idp-section">
      <div class="idp-section-label idp-section-toggle" onclick="_idpToggleHistory()">
        <span>Historial <span class="idp-hist-count">${entries.length}</span></span>
        <span class="idp-toggle-arrow" id="idp-hist-arrow">▸</span>
      </div>
      <div class="idp-hist-body hidden" id="idp-hist-body">
        <div class="idp-timeline">${rows}</div>
        <div class="idp-tl-note-row">
          <input class="idp-tl-note-input" id="idp-tl-note-input" placeholder="Añadir nota al historial…"
            onkeydown="if(event.key==='Enter'&&this.value.trim()){_idpAddNote('${esc(item.code)}',this.value.trim());this.value=''}">
          <button class="idp-tl-note-btn" onclick="_idpAddNote_fromBtn('${esc(item.code)}')">＋</button>
        </div>
      </div>
    </div>`;
}

// R-202604-015: título editable inline en el panel
function _idpStartEditTitle(code) {
  const display = document.getElementById('idp-title-display');
  const input = document.getElementById('idp-title-input');
  if (!display || !input) return;
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  input.value = item.title;
  display.classList.add("is-hidden");
  input.classList.remove("is-hidden")
  input.focus();
  input.select();
}

function _idpSaveTitle(code) {
  const display = document.getElementById('idp-title-display');
  const input = document.getElementById('idp-title-input');
  if (!display || !input) return;
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  const newTitle = input.value.trim();
  if (newTitle && newTitle !== item.title) {
    const prevTitle = item.title;
    item.title = newTitle;
    // T-202604-423: registrar cambio de título en history[]
    if (!item.history) item.history = [];
    item.history.push({ type: 'title', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevTitle || null, to: newTitle } });
    _undoSnapshot();
    saveBacklog();
    _setBacklogModified();
    // Actualizar la lista sin cerrar el panel
    renderBacklogList();
    renderStats();
    showToast('success', `${code} — título actualizado`);
  }
  display.textContent = item.title;
  display.classList.remove("is-hidden")
  input.classList.add("is-hidden");
}

function _idpCancelTitle() {
  const display = document.getElementById('idp-title-display');
  const input = document.getElementById('idp-title-input');
  if (display) display.classList.remove("is-hidden")
  if (input) input.classList.add("is-hidden");
}

// R-202604-015: actualizar campo genérico del ítem desde el panel
function _idpSetField(code, field, value) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  const prev = item[field];
  item[field] = value;
  if (prev === value) return;
  // T-202604-423: registrar cambios de campos en history[] (incluye role)
  if (['effort', 'priority', 'area', 'role'].includes(field)) {
    if (!item.history) item.history = [];
    item.history.push({ type: 'field', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { field, from: prev || null, to: value || null } });
  }
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  renderBacklogList();
  renderStats();
  showToast('success', `${code} · ${field} → ${value || '—'}`);
}

function _itemPanelNotesDirty() {
  const statusEl = document.getElementById('idp-notes-status');
  if (statusEl) statusEl.textContent = '✎ sin guardar';
  clearTimeout(_itemPanelNotesTimer);
  _itemPanelNotesTimer = setTimeout(() => {
    const ta = document.getElementById('idp-notes-ta');
    if (!ta || !_itemPanelCode) return;
    const item = ITEMS.find(i => i.code === _itemPanelCode);
    if (!item) return;
    item.notes = ta.value;
    saveBacklog();
    const s = document.getElementById('idp-notes-status');
    if (s) { s.textContent = '✓ guardado'; setTimeout(() => { if (s) s.textContent = ''; }, 1500); }
  }, 800);
}

function _idpToggleAc() {
  const list = document.getElementById('idp-ac-list');
  const arrow = document.getElementById('idp-ac-arrow');
  if (!list) return;
  const open = list.classList.toggle('open');
  if (arrow) arrow.textContent = open ? '▾' : '▸';
}

// T-202604-423: toggle sección Historial en Item Detail Panel
function _idpToggleHistory() {
  const body = document.getElementById('idp-hist-body');
  const arrow = document.getElementById('idp-hist-arrow');
  if (!body) return;
  const open = body.classList.toggle('is-hidden');
  if (arrow) arrow.textContent = open ? '▸' : '▾';
}

// T-202604-307: copiar código al portapapeles desde panel
function _idpCopyCode(code) {
  navigator.clipboard.writeText(code).then(() => showToast('success', `${code} copiado`));
}

// T-202604-307: marcar done desde botón rápido en panel
function _idpMarkDone(code) {
  // T-202605-449: advertencia de bloqueadores delegada a setItemStatus — cubre todas las vías
  const item = ITEMS.find(i => i.code === code);
  setItemStatus(code, 'done');
  // Re-renderizar panel para ocultar el botón
  if (item && _itemPanelCode === code) _renderItemPanel(item);
}

// T-202604-307: desvincular sesión desde chip en panel
function _idpUnlinkSession(itemCode, sessId) {
  const allSessions = typeof getAllSessions === 'function' ? getAllSessions() : [];
  const sess = allSessions.find(s => s.id === sessId);
  if (!sess) return;
  sess.trackerRefs = (sess.trackerRefs || []).filter(c => c !== itemCode);
  if (typeof save === 'function') save();
  // Re-renderizar panel
  const item = ITEMS.find(i => i.code === itemCode);
  if (item) _renderItemPanel(item);
  showToast('success', 'Sesión desvinculada');
}

// T-202604-307: añadir nota manual al historial desde input
function _idpAddNote(code, text) {
  const item = ITEMS.find(i => i.code === code);
  if (!item || !text) return;
  if (!item.history) item.history = [];
  item.history.push({ type: 'note', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { text } });
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  _renderItemPanel(item);
  showToast('success', 'Nota añadida');
}

function _idpAddNote_fromBtn(code) {
  const inp = document.getElementById('idp-tl-note-input');
  if (!inp || !inp.value.trim()) return;
  _idpAddNote(code, inp.value.trim());
  inp.value = '';
}

// ════════════════════════════════════════════════════════════════════
// R-202604-074 · AC Vivo — helpers de interacción
// ════════════════════════════════════════════════════════════════════

function _acvToggle(panelId) {
  const wrap = document.getElementById(panelId);
  if (!wrap) return;
  const body  = wrap.querySelector('.acv-body');
  const arrow = wrap.querySelector('.acv-toggle-arrow');
  if (!body) return;
  const open = !body.classList.contains('acv-body--hidden');
  body.classList.toggle('acv-body--hidden', open);
  if (arrow) arrow.textContent = open ? '▸' : '▾';
}

function _acvStartEdit(rowId, code, acIdx) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const item = ITEMS.find(i => i.code === code);
  if (!item || !item.ac) return;
  const current = item.ac[acIdx] || '';
  row.innerHTML = `
    <div class="acv-inline-edit">
      <textarea class="acv-edit-ta" id="${rowId}-ta" rows="2">${esc(current)}</textarea>
      <div class="acv-edit-actions">
        <button class="acv-save-btn" onclick="event.stopPropagation();_acvSaveEdit('${rowId}','${esc(code)}',${acIdx})">Guardar</button>
        <button class="acv-cancel-btn" onclick="event.stopPropagation();renderBacklogList()">Cancelar</button>
      </div>
    </div>`;
  const ta = document.getElementById(rowId + '-ta');
  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}

function _acvSaveEdit(rowId, code, acIdx) {
  const ta = document.getElementById(rowId + '-ta');
  if (!ta) return;
  const newText = ta.value.trim();
  if (!newText) return;
  const item = ITEMS.find(i => i.code === code);
  if (!item || !item.ac) return;
  item.ac[acIdx] = newText;
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  showToast('success', 'AC actualizado');
  renderBacklogList();
}

function _acvConfirm(code, panelId) {
  const item = ITEMS.find(i => i.code === code);
  if (!item) return;
  item.acReviewed = Date.now();
  saveBacklog();
  const wrap = document.getElementById(panelId);
  if (wrap) wrap.classList.add('acv-reviewed');
  showToast('success', 'Revisión de AC confirmada');
}

// ════════════════════════════════════════════════════════════════════
// T-202605-443 · Sub-panel Descargar templates — comportamiento de colapso
// ════════════════════════════════════════════════════════════════════

// Toggle del sub-panel. Estado volátil — sin persistencia en localStorage.
function toggleTmplTriggerPanel(btn) {
  const body = document.getElementById('tmpl-trigger-body');
  if (!body) return;
  const collapsed = btn.classList.toggle('is-collapsed');
  body.classList.toggle('is-hidden', collapsed);
  const arrow = btn.querySelector('.tmpl-trigger-arrow');
  if (arrow) arrow.textContent = collapsed ? '▸' : '▾';
}

// Reset: el sub-panel siempre abre colapsado al abrir el menú ···.
// Patch sobre toggleMoreMenu — se engancha sin modificar el archivo que lo define.
(function _patchMoreMenuReset() {
  function _resetTmplTriggerPanel() {
    const btn  = document.querySelector('.tmpl-trigger-toggle');
    const body = document.getElementById('tmpl-trigger-body');
    if (!btn || !body) return;
    btn.classList.add('is-collapsed');
    body.classList.add('is-hidden');
    const arrow = btn.querySelector('.tmpl-trigger-arrow');
    if (arrow) arrow.textContent = '▸';
  }

  // Esperar a que toggleMoreMenu esté definido, luego parcharlo.
  function _tryPatch() {
    if (typeof window.toggleMoreMenu !== 'function') {
      setTimeout(_tryPatch, 100);
      return;
    }
    const _orig = window.toggleMoreMenu;
    window.toggleMoreMenu = function() {
      _orig.apply(this, arguments);
      // Tras abrir/cerrar el menú, forzar colapso del sub-panel.
      _resetTmplTriggerPanel();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _tryPatch);
  } else {
    _tryPatch();
  }
})();

// ═══════════════════════════════════════════════════════════════
// T-202605-441: shortcut Cmd+F / Ctrl+F → toggleFocusMode
// Binding local en backlog.js — sin colisión con búsqueda del nav.
// Solo activo cuando el tab Backlog está visible.
// ═══════════════════════════════════════════════════════════════

(function _initFocusShortcut() {
  // B-202605-060: cleanup antes de registrar — evita acumulación de listeners en hot reload
  if (document._focusShortcutHandler) {
    document.removeEventListener('keydown', document._focusShortcutHandler);
  }
  function _focusShortcutHandler(e) {
    // Solo si tab backlog activo
    const backlogPanel = document.getElementById('tab-backlog');
    if (!backlogPanel || !backlogPanel.classList.contains('active')) return;
    // Cmd+F (Mac) o Ctrl+F (Win/Linux) — sin shift, sin alt
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key === 'f') {
      // No interferir si el foco está en un input/textarea
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      // B-202605-014: con panel abierto → focus mode del panel; sin panel → Backlog Top-10
      const panelOpen = document.getElementById('item-detail-panel')?.classList.contains('open');
      if (panelOpen) {
        if (typeof toggleFocusMode === 'function') toggleFocusMode();
      } else {
        if (typeof toggleBacklogFocusMode === 'function') toggleBacklogFocusMode();
      }
    }
  }
  document._focusShortcutHandler = _focusShortcutHandler;
  document.addEventListener('keydown', _focusShortcutHandler);
})();

// B-[pendiente-ID]: export-backlog-btn — handler adjuntado una sola vez al iniciar
(function _initExportBacklogBtn() {
  function _attach() {
    const btn = document.getElementById('export-backlog-btn');
    if (btn && !btn._exportHandlerAttached) {
      btn.addEventListener('click', function() {
        if (typeof exportBacklogMd === 'function') exportBacklogMd();
      });
      btn._exportHandlerAttached = true;
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _attach);
  } else {
    _attach();
  }
})();

