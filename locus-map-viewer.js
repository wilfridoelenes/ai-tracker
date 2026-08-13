// [PP] mod:4 · autor:Rune · 2026-08-12 09:00 UTC-6
import { _skelHide, _skelShow } from './locus-backlog-core.js';
import { _tplKey } from './locus-storage.js';

import { esc } from './locus-ui-shell.js';
import { _dropzoneHandle } from './locus-docs.js'; // T-202606-089 AC-3 — ciclo seguro: uso solo dentro de handler

// locus-map-viewer.js
// Última actualización: 2026-05-28 UTC-6
// Módulo: HTML MAP viewer — render, filtro, búsqueda y toggle de módulos
// Extraído de ai-tracker-backlog.js (renderHtmlMap, setHtmlMapFilter, updateHtmlMapBanner,
//   _hmOnSearch, _hmToggleModule, _hmSearch) y ai-tracker-ai-notes.js
//   (HTML_MAP_SECTIONS, htmlMapFilter, loadHtmlMap) — AC-10, AC-12
// T-202605-030 Fase 1A: addEventListener para los 4 botones hmfilter-* (all, css, html, js)
//              Elimina inline onclick de index.html para setHtmlMapFilter.
// T-202605-035 Fase 1A Capa B: Migrar handlers dinámicos restantes.
//              Dropzone: ondragover/ondragleave/ondrop/onclick → addEventListener post-render.
//              Pills dinámicas: onclick inline → event delegation en .mm-pills.
//              Search: oninput/onclick clear → addEventListener post-render.
//              mm-module-header: onclick → event delegation en .mm-modules.
//
// Dependencias externas consumidas sin mover:
//   _skelShow / _skelHide   → locus-backlog-core.js
//   _dropzoneHandle         → locus-docs.js  (import directo — T-202606-089)
//   _tplKey / esc           → locus-storage.js
//   showToast               → locus-toast.js
//
// MAP helpers definidas en este módulo (migradas desde ai-tracker-ai-notes.js):
//   parseHtmlMapMd
//
// Orden en index.html: después de locus-docs.js, antes de locus-backlog-core.js

// ── Estado interno — AC-3: inicializa en cada carga, sin persistencia ─────
let HTML_MAP_SECTIONS = [];
let htmlMapFilter = 'all';
let _hmSearch = '';

// ── MAP helpers — migradas desde ai-tracker-ai-notes.js ───────────────────
// Definidas aquí porque locus-map-viewer.js es su único consumidor real.
// ai-tracker-ai-notes.js las referencia en _getMapContent via typeof guard.

// R-202605-137: Markdown legacy — read-only, sin cambios al parser original
export function parseHtmlMapMd(text) {
  const sections = [];
  const lines = text.split('\n');
  // Formato modular v3: headers H2 = archivos, tablas = funciones con Línea/Función/Área
  // Formato legacy: ## CSS / ## HTML / ## JS + tablas planas
  let currentFile = null;
  let currentType = null;
  // Detectar si es formato modular (tiene headers con nombres de archivo)
  const isModular = /##\s+\S+\.(js|css|html)\b/i.test(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      const header = line.slice(3).trim();
      if (isModular) {
        const fileMatch = header.match(/^(\S+\.(js|css|html))/i);
        if (fileMatch) {
          currentFile = fileMatch[1];
          currentType = fileMatch[2].toLowerCase();
        } else {
          currentFile = null;
        }
      } else {
        if (/CSS/i.test(header)) { currentType = 'css'; currentFile = null; }
        else if (/HTML/i.test(header)) { currentType = 'html'; currentFile = null; }
        else if (/JS/i.test(header)) { currentType = 'js'; currentFile = null; }
        else { currentFile = null; }
      }
      continue;
    }
    if (!line.startsWith('|')) continue;
    if (/^\|\s*[-:]+/.test(line)) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 2) continue;
    const firstCol = cols[0].toLowerCase();
    if (['sección','elemento','section','línea','linea','líneas','función','funcion','function','line'].includes(firstCol)) continue;
    if (cols[0].startsWith('---') || cols[0].startsWith('===')) continue;

    if (isModular && currentFile) {
      const lineNum = cols[0];
      const fnName = cols[1] || '';
      const area = cols[2] || '';
      sections.push({
        type: currentType || 'js',
        file: currentFile,
        name: fnName,
        line: lineNum,
        area: area,
        comment: area,
        lines: lineNum
      });
    } else {
      sections.push({
        type: currentType || 'js',
        file: null,
        name: cols[0],
        line: cols[2] || '',
        area: '',
        comment: cols[1] || '',
        lines: cols[2] || ''
      });
    }
  }
  return sections;
}

// ── loadHtmlMap ────────────────────────────────────────────────────────────
// AC-9: lee html-map-sections de localStorage via _tplKey.
// Si no hay dato o JSON inválido → HTML_MAP_SECTIONS = []. Sin throw.
export function loadHtmlMap() {
  const stored = localStorage.getItem(_tplKey('html-map-sections'));
  if (stored) { try { HTML_MAP_SECTIONS = JSON.parse(stored); } catch { HTML_MAP_SECTIONS = []; } } else { HTML_MAP_SECTIONS = []; }
}

// ── updateHtmlMapBanner ────────────────────────────────────────────────────
// AC-8: lee html-map-meta de localStorage via _tplKey y actualiza DOM.
// Sin error si el banner no existe.
export function updateHtmlMapBanner() {
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

// ── setHtmlMapFilter ───────────────────────────────────────────────────────
// AC-5: actualiza htmlMapFilter, activa pill correcta, llama renderHtmlMap.
export function setHtmlMapFilter(f) {
  htmlMapFilter = f;
  document.querySelectorAll('.hmfilter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.file === f || (f === 'all' && btn.dataset.file === 'all'));
  });
  renderHtmlMap();
}

// ── _hmOnSearch ────────────────────────────────────────────────────────────
// AC-6: actualiza _hmSearch y llama renderHtmlMap.
function _hmOnSearch(val) {
  _hmSearch = (val || '').trim().toLowerCase();
  renderHtmlMap();
}

// ── _hmToggleModule ────────────────────────────────────────────────────────
// AC-7: abre/cierra el body del módulo correcto por fileId, sincroniza flecha.
function _hmToggleModule(fileId) {
  const body = document.getElementById('hmmod-body-' + fileId);
  const header = document.querySelector(`.mm-module-header[data-hmmod="${fileId}"]`);
  if (!body) return;
  const isOpen = body.classList.toggle('mm-open');
  if (header) header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

// ── renderHtmlMap ──────────────────────────────────────────────────────────
// AC-4: tres estados — empty+dropzone (sin raw), empty sin dropzone (raw sin secciones),
//        render modular completo (hay secciones). Sin regresión visual ni funcional.
export function renderHtmlMap() {
  const el = document.getElementById('htmlmap-content');
  if (!el) return;
  _skelShow(el, 'tbl');
  loadHtmlMap();
  if (!HTML_MAP_SECTIONS.length) {
    const _mapRawExists = !!localStorage.getItem(_tplKey('html-map-raw'));
    el.innerHTML = !_mapRawExists ? `
      <div class="doc-dropzone" id="htmlmap-dropzone">
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
    // T-202605-035: adjuntar handlers de dropzone post-render (sin on* inline)
    const dz = document.getElementById('htmlmap-dropzone');
    if (dz) {
      dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('doc-dropzone--over'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('doc-dropzone--over'));
      dz.addEventListener('drop', e => {
        dz.classList.remove('doc-dropzone--over');
        _dropzoneHandle(e, 'htmlmap');
      });
      dz.addEventListener('click', () => {
        const fi = document.getElementById('htmlmap-file-input');
        if (fi) fi.click();
      });
    }
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

  // ── Module Map árbol modular ──
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
  const allPill = `<button class="hmfilter-pill hmfilter-pill--all ${!activeFile ? 'active' : ''}" data-file="all">Todos</button>`;
  const filePills = fileOrder.map(f => {
    const isActive = activeFile === f;
    return `<button class="hmfilter-pill ${isActive ? 'active' : ''} ${fileTypeClass(f)}" data-file="${esc(f)}" title="${esc(f)}">${esc(fileShortName(f))}<span class="hmfilter-pill-count">${fileMap[f].length}</span></button>`;
  }).join('');

  // Barra de búsqueda
  const searchBar = `
    <div class="mm-search-wrap">
      <input class="mm-search" type="text" placeholder="Buscar función, área…" value="${esc(_hmSearch)}">
      ${_hmSearch ? `<button class="mm-search-clear">✕</button>` : ''}
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
        <div class="mm-module-header" data-hmmod="${fileId}" role="button" tabindex="0" aria-expanded="${openByDefault ? 'true' : 'false'}" aria-controls="hmmod-body-${fileId}">
          <span class="mm-file-badge ${fileTypeClass(f)}">${fileTypeLabel(f)}</span>
          <span class="mm-file-name">${esc(f)}</span>
          <span class="mm-fn-count">${rows.length} fn</span>
          <div class="mm-bar-wrap" title="${rows.length} funciones"><div class="mm-bar-fill" style="--mm-bar-w:${Math.round((rows.length/_maxFnCount)*100)}%;--mm-bar-color:${fileTypeBarColor(f)}"></div></div>
          <svg class="ti-svg chevron" aria-hidden="true"><use href="#ti-chevron-right"></use></svg>
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

  // T-202605-035: event delegation — pills dinámicas (.mm-pills)
  const pillsContainer = el.querySelector('.mm-pills');
  if (pillsContainer) {
    pillsContainer.addEventListener('click', e => {
      const btn = e.target.closest('[data-file]');
      if (btn) setHtmlMapFilter(btn.dataset.file);
    });
  }

  // T-202605-035: search input oninput + clear button
  const searchInput = el.querySelector('.mm-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => _hmOnSearch(e.target.value));
  }
  const clearBtn = el.querySelector('.mm-search-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      _hmOnSearch('');
      const inp = el.querySelector('.mm-search');
      if (inp) inp.value = '';
    });
  }

  // T-202605-035: event delegation — .mm-module-header (toggle módulo)
  const modulesContainer = el.querySelector('.mm-modules');
  if (modulesContainer) {
    modulesContainer.addEventListener('click', e => {
      const header = e.target.closest('[data-hmmod]');
      if (header) _hmToggleModule(header.dataset.hmmod);
    });
  }

  _skelHide(el);
}

// ── addEventListener — T-202605-030 ──
// Los 4 botones hmfilter-* (all, css, html, js) son estáticos en index.html.
// Se adjuntan aquí; eliminan sus onclick de index.html.
// Nota: los pills generados dinámicamente dentro de renderHtmlMap() mantienen onclick
// inline porque se regeneran en cada render y no existen en el DOM al cargar.
document.addEventListener('DOMContentLoaded', () => {
  const hmFilterMap = { 'hmfilter-all': 'all', 'hmfilter-css': 'css', 'hmfilter-html': 'html', 'hmfilter-js': 'js' };
  Object.entries(hmFilterMap).forEach(([id, filter]) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => setHtmlMapFilter(filter));
  });
});

// ── AC-11: exponer como window.* para inline handlers y callers en ai-notes ──
// parseHtmlMapMd — expuesta para callers externos
