// ai-tracker-checkpoint.js
// Última actualización: 2026-05-13 UTC-6
// UI, render, tabs, toast, theme, search, tracker — persistencia extraída a locus-storage.js
// Requiere locus-storage.js cargado ANTES en index.html

// Fuente de verdad de versión — actualizar aquí al hacer bump
const APP_VERSION = 'v3.4';

// R-202604-086: versión efectiva — localStorage override prevalece sobre APP_VERSION.
// Se escribe desde _mgApplyBumpedVersion() en ai-tracker-map-generator.js al confirmar el generador.
// APP_VERSION es el fallback de primer arranque; el generador es la fuente de verdad post-bump.
// T-074: umbral de días sin sesión para sugerencia contextual
const STALE_DAYS_THRESHOLD = 3;

// T-074: true si la IA lleva >STALE_DAYS_THRESHOLD días sin sesión Y tiene ítems pendientes
function _hasStaleSuggestion(ai) {
  if (ai.status === 'exhausted') return false;
  const aiSessions = getAISessions(ai.id);
  if (!aiSessions.length) return false;
  const last = aiSessions[aiSessions.length - 1];
  const lastDate = new Date(last.date);
  if (isNaN(lastDate)) return false;
  const diffDays = (Date.now() - lastDate.getTime()) / 86400000;
  if (diffDays <= STALE_DAYS_THRESHOLD) return false;
  const hasInProgress = ITEMS.some(i => i.status === 'pendiente'); // B-202605-046: 'en-progreso' es valor legacy — schema canónico usa 'pendiente'
  return hasInProgress;
}

// T-011: Avatar logos SVG — banco de logos predefinidos
const AVATAR_LOGOS = {
  claude: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.7"/><path d="M8 12a4 4 0 018 0" fill="currentColor"/></svg>',
  gpt4: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/></svg>',
  gemini: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 8l3 3-3 3-3-3 3-3z" fill="currentColor"/><path d="M15 11l3-3v6l-3-3z" fill="currentColor" opacity="0.6"/><path d="M9 11l-3-3v6l3-3z" fill="currentColor" opacity="0.6"/></svg>',
  llama: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/><path d="M10 14c0 1 1 2 2 2s2-1 2-2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 9l-1.5-2.5M17 9l1.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  mistral: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/></svg>',
  cohere: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/><circle cx="14" cy="11" r="1.5" fill="currentColor"/><path d="M10 11l2-3 2 3" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
  anthropic: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M8 11h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15.5" cy="9" r="1" fill="currentColor"/></svg>',
  default: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/><path d="M7 15c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
};
document.title = 'Locus ' + _effectiveVersion(); // v3.0.0.9.6

// Header project label — muestra Prefijo · Nombre canónico del proyecto activo
// R-202605-167: Breadcrumb interactivo — proyecto › sprint › ítem activo
// Extiende _updateHeaderProjectLabel — no crea función nueva.
// La estructura de tres <button> siempre está en el DOM; visibilidad por clase.
function _updateHeaderProjectLabel() {
  // ── Segmento 1: proyecto ──────────────────────────────────────────────────
  const projBtn    = document.getElementById('breadcrumb-proj');
  const firstSep   = document.querySelector('.breadcrumb-sep--first');
  const sprintBtn  = document.getElementById('breadcrumb-sprint');
  const sprintSep  = document.querySelector('.breadcrumb-sep--sprint');
  const itemBtn    = document.getElementById('breadcrumb-item');
  if (!projBtn) return;

  const filterId = (typeof _getActiveProjectFilter === 'function') ? _getActiveProjectFilter() : '';
  const proj = filterId && (typeof getProjectById === 'function') ? getProjectById(filterId) : null;

  if (proj) {
    projBtn.textContent = proj.name || 'Proyecto';
    projBtn.removeAttribute('disabled');
  } else {
    // Sin proyecto activo → texto plano sin interacción
    projBtn.textContent = 'Locus';
    projBtn.setAttribute('disabled', '');
  }

  // ── Segmento 2: sprint ────────────────────────────────────────────────────
  if (sprintBtn && sprintSep) {
    const sp = proj && proj.sprints
      ? proj.sprints.find(s => s.status === 'active')
      : null;

    if (sp) {
      sprintBtn.textContent = sp.label || sp.id || 'Sprint';
      sprintBtn.title = 'Ver sprint health';
      sprintBtn.classList.remove('breadcrumb-seg--hidden');
      sprintSep.classList.remove('breadcrumb-seg--hidden');
      if (firstSep) firstSep.classList.remove('breadcrumb-seg--hidden');
    } else {
      sprintBtn.classList.add('breadcrumb-seg--hidden');
      sprintSep.classList.add('breadcrumb-seg--hidden');
      if (firstSep) firstSep.classList.add('breadcrumb-seg--hidden');
    }
  }

  // ── Segmento 3: ítem activo del Worker seleccionado ───────────────────────
  if (itemBtn) {
    let activeItem = null;
    try {
      if (typeof _trackerSelectedId !== 'undefined' && _trackerSelectedId) {
        const tracker = (typeof getActiveTracker === 'function') ? getActiveTracker() : { items: [] };
        const items = tracker.items || [];
        // Ítems pendientes/en-curso vinculados a sesiones del AI seleccionado
        const aiSessions = (typeof getAllSessions === 'function')
          ? getAllSessions().filter(s => s.aiId === _trackerSelectedId)
          : [];
        const sessIds = new Set(aiSessions.map(s => s.id));
        const linked = items.filter(i =>
          i.status !== 'done' &&
          i.status !== 'descartado' &&
          i.sessionId && sessIds.has(i.sessionId)
        );
        if (linked.length > 0) {
          // Preferir el de mayor prioridad
          const PRI = { high: 0, medium: 1, low: 2 };
          linked.sort((a, b) => (PRI[a.priority] ?? 3) - (PRI[b.priority] ?? 3));
          activeItem = linked[0];
        }
      }
    } catch (e) {}

    if (activeItem) {
      const code = activeItem.code || '';
      const title = activeItem.title || activeItem.desc || code;
      const label = code ? code + (title ? ' ' + title : '') : title;
      itemBtn.textContent = label;
      itemBtn.title = 'Ver ítem ' + code;
      itemBtn.onclick = function () {
        const _allItems = (typeof ITEMS !== 'undefined') ? ITEMS : [];
        const _target = _allItems.find(function(b) { return b.code === code; });
        if (_target && typeof openItemPanel === 'function') {
          openItemPanel(_target);
        } else if (typeof navigateToItem === 'function') {
          navigateToItem(code);
        }
      };
      itemBtn.classList.remove('breadcrumb-seg--hidden');
    } else {
      itemBtn.textContent = '';
      itemBtn.title = '';
      itemBtn.onclick = null;
      itemBtn.classList.add('breadcrumb-seg--hidden');
    }
  }
}
// Exponer para que sprint-project.js lo llame al cambiar proyecto
window._updateHeaderProjectLabel = _updateHeaderProjectLabel;

// AC-8: Firebase eliminado — Supabase es el único backend de sync
// setSyncStatus y handleSyncPillClick → migradas a locus-storage.js

// ── T-202605-482c: Supabase Auth — migrado a locus-storage.js ──
// El bloque de inicialización de Supabase (createClient, onAuthStateChange, getSession)
// vive en locus-storage.js que carga antes. Eliminado aquí para evitar duplicación.


// navegar al Tracker enfocando la card de una IA
function _scrollToCard(aiId) {
  const detail = document.querySelector('.tracker-detail');
  if (detail) detail.scrollTop = 0;
}

function navigateToCard(aiId) {
  _trackerSelectedId = aiId;
  switchTab('tracker');
  setTimeout(() => {
    render();
    _scrollToCard(aiId);
    const ta = document.getElementById('ta-' + aiId);
    if (ta) setTimeout(() => { ta.focus(); enterFocusMode(aiId); }, 80);
  }, 80);
}

function switchTab(tab) {
  // DUP-05: cerrar preview de sesión al cambiar de tab
  if (typeof closePopup === 'function') closePopup();
  // B-202605-207: cerrar panel de detalle al cambiar de tab
  if (typeof closeItemPanel === 'function') {
    const panel = document.getElementById('item-detail-panel');
    if (panel && panel.classList.contains('open')) closeItemPanel();
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
  // Templates toolbar: update buttons via _updateSubTabButtons
  if (tab === 'backlog') {
    _updateSubTabButtons(currentSubTab || 'backlog');
  }
  _stopHoyTicker();
  if (tab !== 'tracker') _stopSidebarTicker();

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
    render(); // B-202605-[pendiente-ID]: applyViewMode eliminada en refactor — reemplazada por render()
  } else if (tab === 'backlog') {
    updateBacklogBanner();
    renderBacklogList();
  } else if (tab === 'analytics') {
    renderAnalytics();
  } else if (tab === 'proyectos') {
    if (typeof renderProyectos === 'function') renderProyectos();
  }

  // B-[pendiente-ID]: cada tab-panel tiene su propio overflow-y:auto —
  // resetear el scroll del panel activo al cambiar de tab
  if (tabEl) tabEl.scrollTop = 0;

  // Refresh radar sidebar
  renderGlobalRadarSidebar();
}

function esc(s) { return s ? (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

// T-202604-121: auto-asignar IDs a ítems [pendiente-ID] / [tmp:slug] en tgItems
// T-202604-TMP: [tmp:slug] mantiene identidad entre CHECKPOINTs de la misma sesión
function _slugify(desc) {
  // Deriva slug de las primeras 3 palabras del desc normalizado
  // B-202605-027: retorna '' cuando desc vacío — el caller asigna slug único por posición/timestamp
  if (!desc) return '';
  return desc.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join('-') || '';
}

// _loadTmpIdMap y _saveTmpIdMap → migradas a locus-storage.js

function _assignPendingIds(tgItems) {
  if (!tgItems || !tgItems.length) return tgItems;
  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  if (!meta.counters) meta.counters = { P:0, T:0, R:0, B:0 };
  const now = new Date();
  const yyyymm = now.getFullYear().toString() + String(now.getMonth()+1).padStart(2,'0');
  const assigned = [];
  // T-202604-023: índice de títulos normalizados para detección de duplicados
  const _norm = s => (s || '').toLowerCase().replace(/[^a-z0-9áéíóúüñ]/g, ' ').replace(/\s+/g, ' ').trim();
  // B-018: mapa título→código para poder mostrar el código existente en el notice de duplicado
  const existingTitleMap = new Map(ITEMS.map(i => [_norm(i.title), i.code]));
  // T-202604-TMP: mapa tmp-slug → código real (persiste 24h entre CHECKPOINTs)
  const tmpMap = _loadTmpIdMap();
  let tmpMapDirty = false;

  tgItems.forEach(item => {
    const code = item.code || '';

    // --- Detectar [tmp:slug] ---
    const tmpMatch = code.match(/^\[tmp:([a-z0-9_-]+)\]$/i);
    if (tmpMatch) {
      const slug = tmpMatch[1].toLowerCase();
      if (tmpMap[slug]) {
        // Ya conocemos el código real — resolver directamente (update, no crear)
        item.code = tmpMap[slug].code;
        item._tmpResolved = true;
      } else {
        // Primer avistamiento: generar código real y guardar en mapa
        const t = (item.type || (code.match(/^[PTRB]/i) ? code[0] : '') || 'T').toUpperCase();
        if (!'PTRB'.includes(t)) { item._invalidType = true; assigned.push(item); return; }
        meta.counters[t] = (meta.counters[t] || 0) + 1;
        const num = String(meta.counters[t]).padStart(3, '0');
        item.code = `${t}-${yyyymm}-${num}`;
        item._wasAssigned = true;
        tmpMap[slug] = { code: item.code, createdAt: Date.now() };
        tmpMapDirty = true;
      }
      assigned.push(item);
      return;
    }

    // --- Detectar [pendiente-ID] ---
    if (code === '[pendiente-ID]' || code.startsWith('[pendiente-ID]')) {
      // T-202604-023: si ya existe un ítem con el mismo título, marcar como duplicado
      const existingCode = existingTitleMap.get(_norm(item.desc || item.title));
      if (existingCode) {
        item._duplicate = true;
        item._existingCode = existingCode;
        assigned.push(item);
        return;
      }
      // T-202604-TMP: derivar slug del desc/title y buscar en tmpMap antes de crear código nuevo
      // B-202605-027: si title y desc vacíos, generar slug único por posición+timestamp para evitar colisión
      const _rawSlug = _slugify(item.desc || item.title);
      const _fallbackSlug = _rawSlug || `item-${Date.now()}-${assigned.length}`;
      // B-202605-027: deduplicar slug en tmpMap — si ya existe, agregar sufijo numérico
      let slug = _fallbackSlug;
      if (!_rawSlug) {
        // slug sintético: siempre único, no buscar en tmpMap (no hay title que persista)
      } else if (tmpMap[slug]) {
        item.code = tmpMap[slug].code;
        item._tmpResolved = true;
        assigned.push(item);
        return;
      }
      const t = (item.type || (code.match(/^[PTRB]/i) ? code[0] : '') || 'T').toUpperCase();
      if (!'PTRB'.includes(t)) { item._invalidType = true; assigned.push(item); return; }
      meta.counters[t] = (meta.counters[t] || 0) + 1;
      const num = String(meta.counters[t]).padStart(3, '0');
      item.code = `${t}-${yyyymm}-${num}`;
      item._wasAssigned = true;
      if (_rawSlug) { tmpMap[slug] = { code: item.code, createdAt: Date.now() }; tmpMapDirty = true; }
    }

    assigned.push(item);
  });

  localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
  if (tmpMapDirty) _saveTmpIdMap(tmpMap);
  return assigned;
}

// T-202604-121: super toast visual para resultado de CHECKPOINT
let _ckptTimer = null;
let _ckptTimerEnd = null;   // P-001: timestamp cuando expira el timer activo
let _lastCheckpointResult = null;
function showCheckpointPanel(result) {
  _lastCheckpointResult = result;
  _updateCkptReopenBtn();
  const panel = document.getElementById('ckpt-panel');
  const body = document.getElementById('ckpt-body');
  const bar = document.getElementById('ckpt-bar');
  if (!panel || !body) return;

  const sections = [];

  // Creados (nuevos)
  if (result.created && result.created.length) {
    const rows = result.created.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code">${esc(i.code)}${i._wasAssigned ? ' <span class="ckpt-new-id-badge">★nuevo ID</span>' : ''}</span>
        <span class="ckpt-item-desc">${esc((i.title || i.desc || '').slice(0, 60))}</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section created">
      <div class="ckpt-section-header">✚ ${result.created.length} nuevo${result.created.length>1?'s':''}</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // Avances de status (verde)
  if (result.advanced && result.advanced.length) {
    const rows = result.advanced.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code">${esc(i.code)}</span>
        <span class="ckpt-item-desc">${esc((i.title || i.desc || '').slice(0, 50))}</span>
        <span class="ckpt-item-arrow">${esc(i.from)} → ${esc(i.to)}</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section advanced">
      <div class="ckpt-section-header">✓ ${result.advanced.length} avance${result.advanced.length>1?'s':''} de status</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // R-202604-077: Panel diff unificado — retrocesos + descartes en lista única con confirmación inline
  const _hasPendingConfirm = (result.retroceso && result.retroceso.length) || (result.discarded && result.discarded.length);
  if (_hasPendingConfirm) {
    // Estado mutable por referencia — indexado por tipo+código para lookups en handlers
    window._ckptPendingConfirm = {
      retroceso: (result.retroceso || []).map(i => ({ ...i, confirmed: false })),
      discarded: (result.discarded || []).map(i => ({ ...i, confirmed: false, selectedReason: i.reason || '' }))
    };

    const _renderCkptDiffPanel = () => {
      const sec = document.getElementById('ckpt-diff-unified');
      if (!sec) return;

      const pending = window._ckptPendingConfirm;
      const totalItems = pending.retroceso.length + pending.discarded.length;
      const confirmedCount = pending.retroceso.filter(i => i.confirmed).length
        + pending.discarded.filter(i => i.confirmed && i.selectedReason).length;
      const allReady = confirmedCount === totalItems
        || (pending.discarded.every(i => i.confirmed && i.selectedReason) && pending.retroceso.every(i => i.confirmed));

      // Filas de retroceso
      const retroRows = pending.retroceso.map((i, idx) => {
        const checked = i.confirmed ? 'checked' : '';
        return `<div class="ckpt-diff-row ckpt-diff-row--retroceso${i.confirmed ? ' ckpt-diff-row--confirmed' : ''}" id="ckpt-diff-retro-${idx}">
          <label class="ckpt-diff-check-wrap" title="${i.confirmed ? 'Desmarcar' : 'Confirmar retroceso'}">
            <input type="checkbox" class="ckpt-diff-cb" ${checked}
              onchange="_ckptDiffToggleRetro(${idx})">
          </label>
          <div class="ckpt-diff-content">
            <span class="ckpt-diff-code">${esc(i.code)}</span>
            <span class="ckpt-diff-desc">${esc((i.title || i.desc || '').slice(0, 45))}</span>
            <span class="ckpt-diff-arrow ckpt-diff-arrow--retroceso">${esc(i.from)} → ${esc(i.to)}</span>
            <span class="ckpt-diff-type-badge ckpt-diff-type-badge--retroceso">↓ retroceso</span>
          </div>
        </div>`;
      }).join('');

      // Filas de descarte
      const discardRows = pending.discarded.map((i, idx) => {
        const checked = i.confirmed ? 'checked' : '';
        const reasonOptions = ['duplicado','fuera de alcance','reemplazado','obsoleto']
          .map(r => `<option value="${r}"${i.selectedReason === r ? ' selected' : ''}>${r}</option>`)
          .join('');
        const reasonHtml = i.reason
          ? `<span class="ckpt-diff-reason-pill">${esc(i.reason)}${i.ref ? ' · ' + esc(i.ref) : ''}</span>`
          : `<select class="ckpt-diff-reason-select" data-discard-idx="${idx}"
               onchange="_ckptDiffSelectReason(${idx}, this.value)">
               <option value="">— razón —</option>
               ${reasonOptions}
             </select>`;
        const isReady = i.confirmed && (i.reason || i.selectedReason);
        return `<div class="ckpt-diff-row ckpt-diff-row--discard${isReady ? ' ckpt-diff-row--confirmed' : ''}" id="ckpt-diff-discard-${idx}">
          <label class="ckpt-diff-check-wrap" title="${i.confirmed ? 'Desmarcar' : 'Confirmar descarte'}">
            <input type="checkbox" class="ckpt-diff-cb" ${checked}
              onchange="_ckptDiffToggleDiscard(${idx})">
          </label>
          <div class="ckpt-diff-content">
            <span class="ckpt-diff-code">${esc(i.code)}</span>
            <span class="ckpt-diff-desc">${esc((i.title || i.desc || '').slice(0, 45))}</span>
            ${reasonHtml}
            <span class="ckpt-diff-type-badge ckpt-diff-type-badge--discard">🗑 descarte</span>
          </div>
        </div>`;
      }).join('');

      const pendingLeft = totalItems - confirmedCount;
      const confirmBtn = `<button id="ckpt-diff-confirm-btn"
        class="ckpt-btn-diff-confirm${allReady ? '' : ' ckpt-btn-diff-confirm--blocked'}"
        onclick="_ckptDiffApplyAll()"
        ${allReady ? '' : 'disabled'}>
        ✓ Confirmar ${confirmedCount > 0 ? `(${confirmedCount}/${totalItems})` : `todo (${totalItems})`}
      </button>`;
      const cancelBtn = `<button class="ckpt-btn-diff-cancel" onclick="_ckptDiffCancel()">✕ Cancelar</button>`;

      sec.innerHTML = `
        <div class="ckpt-section-header ckpt-section-header--diff">
          ⚠ ${totalItems} cambio${totalItems > 1 ? 's' : ''} requiere${totalItems === 1 ? '' : 'n'} confirmación
          ${pendingLeft > 0 ? `<span class="ckpt-diff-pending-count">${pendingLeft} pendiente${pendingLeft > 1 ? 's' : ''}</span>` : ''}
        </div>
        <div class="ckpt-diff-rows">${retroRows}${discardRows}</div>
        <div class="ckpt-diff-footer">${cancelBtn}${confirmBtn}</div>`;
    };

    // Handlers globales — limpiados en _ckptDiffCleanup
    window._ckptDiffToggleRetro = (idx) => {
      window._ckptPendingConfirm.retroceso[idx].confirmed = !window._ckptPendingConfirm.retroceso[idx].confirmed;
      _renderCkptDiffPanel();
    };
    window._ckptDiffToggleDiscard = (idx) => {
      window._ckptPendingConfirm.discarded[idx].confirmed = !window._ckptPendingConfirm.discarded[idx].confirmed;
      _renderCkptDiffPanel();
    };
    window._ckptDiffSelectReason = (idx, val) => {
      window._ckptPendingConfirm.discarded[idx].selectedReason = val;
      _renderCkptDiffPanel();
    };
    window._ckptDiffCancel = () => {
      _ckptDiffCleanup();
    };
    window._ckptDiffApplyAll = () => {
      // AC-2: deshabilitar botón inmediatamente — no doble-apply
      const applyBtn = document.querySelector('[onclick="_ckptDiffApplyAll()"], [onclick="window._ckptDiffApplyAll()"]');
      if (applyBtn) applyBtn.disabled = true;

      const pending = window._ckptPendingConfirm;
      let applyError = false;
      try {
        // Aplicar retrocesos confirmados
        pending.retroceso.filter(i => i.confirmed).forEach(i => {
          const item = ITEMS.find(b => b.code === i.code);
          if (!item) return;
          const from = item.status;
          item.status = i.to;
          item.statusChangedAt = Date.now();
          _blogLog('retroceso', i.code, from + ' → ' + i.to, 'backlog');
        });
        // Aplicar descartes confirmados con razón
        pending.discarded.filter(i => i.confirmed && (i.reason || i.selectedReason)).forEach(i => {
          const item = ITEMS.find(b => b.code === i.code);
          if (!item) return;
          item.status = 'descartado';
          item.discardReason = i.selectedReason || i.reason || '';
          item.discardRef = i.ref || '';
          item.statusChangedAt = Date.now();
          _blogLog('ckpt-descarte', i.code, item.discardReason, 'backlog');
        });
        _undoSnapshot();
        saveBacklog();
        _setBacklogModified();
        renderBacklogList(); updateBacklogBanner(); renderStats();
      } catch (e) {
        // AC-7: si la operación lanza error, no mostrar confirmación — dejar panel en su estado
        applyError = true;
        if (applyBtn) applyBtn.disabled = false;
      }

      if (!applyError) {
        // AC-1: mostrar "✓ Cambios aplicados" dentro del panel — sin toast
        const sec = document.getElementById('ckpt-diff-unified');
        if (sec) {
          sec.innerHTML = '<div class="ckpt-diff-applied">✓ Cambios aplicados</div>';
        }
        // AC-3: cerrar panel automáticamente a los 1.5s — timer cancelable (AC-8)
        window._ckptDiffAutoCloseTimer = setTimeout(() => {
          window._ckptDiffAutoCloseTimer = null;
          _ckptDiffCleanup();
        }, 1500);
      }

      // B-202605-024: typeof guard — downloadTemplates puede no estar disponible si el módulo no cargó
      if (!applyError && window._pendingTemplateDownload) {
        window._pendingTemplateDownload = false;
        if (_templateTrigger() === 'session') {
          if (typeof downloadTemplates === 'function') {
            downloadTemplates();
          } else {
            showToast('warning', '⚠️ Descarga no disponible — módulo de plantillas no cargado');
          }
        }
      }
    };

    const _ckptDiffCleanup = () => {
      // AC-8: cancelar timer de cierre automático si el panel se cierra manualmente antes
      if (window._ckptDiffAutoCloseTimer) {
        clearTimeout(window._ckptDiffAutoCloseTimer);
        window._ckptDiffAutoCloseTimer = null;
      }
      delete window._ckptPendingConfirm;
      delete window._ckptDiffToggleRetro;
      delete window._ckptDiffToggleDiscard;
      delete window._ckptDiffSelectReason;
      delete window._ckptDiffCancel;
      delete window._ckptDiffApplyAll;
      const sec = document.getElementById('ckpt-diff-unified');
      if (sec) sec.innerHTML = '';
    };

    sections.push(`<div class="ckpt-section ckpt-section--diff" id="ckpt-diff-unified"></div>`);
    // Render diferido — el elemento debe estar en DOM primero
    requestAnimationFrame(_renderCkptDiffPanel);
  }

  // Actualizados (otros campos) — T-202604-414: diff inline por campo
  if (result.updated && result.updated.length) {
    const _renderFieldDiff = (changes) => {
      if (!Array.isArray(changes) || !changes.length) return '';
      return changes.map(c => {
        if (c.field === 'ac') {
          // AC diff: línea por línea
          const fromLines = Array.isArray(c.from) ? c.from : [];
          const toLines   = Array.isArray(c.to)   ? c.to   : [];
          const removed = fromLines.filter(l => !toLines.includes(l));
          const added   = toLines.filter(l => !fromLines.includes(l));
          const kept    = toLines.filter(l => fromLines.includes(l));
          const diffRows = [
            ...removed.map(l => `<div class="ckpt-diff-ac-line removed">− ${esc(l)}</div>`),
            ...added.map(l =>   `<div class="ckpt-diff-ac-line added">+ ${esc(l)}</div>`),
            kept.length ? `<div class="ckpt-diff-ac-unchanged">${kept.length} sin cambio${kept.length>1?'s':''}</div>` : ''
          ].join('');
          return `<div class="ckpt-diff-field"><span class="ckpt-diff-label">ac</span><div class="ckpt-diff-ac">${diffRows}</div></div>`;
        }
        // Campo simple: from → to
        return `<div class="ckpt-diff-field">
          <span class="ckpt-diff-label">${esc(c.field)}</span>
          <span class="ckpt-diff-from">${esc(String(c.from))}</span>
          <span class="ckpt-diff-arrow">→</span>
          <span class="ckpt-diff-to">${esc(String(c.to))}</span>
        </div>`;
      }).join('');
    };

    const rows = result.updated.map(i => {
      const hasDiff = Array.isArray(i.changes) && i.changes.length;
      const diffHtml = hasDiff
        ? `<div class="ckpt-diff-block">${_renderFieldDiff(i.changes)}</div>`
        : `<span class="ckpt-item-change">${esc(i.change || '')}</span>`;
      return `<div class="ckpt-item ckpt-item--updated">
        <div class="ckpt-item-row">
          <span class="ckpt-item-code">${esc(i.code)}</span>
          <span class="ckpt-item-desc">${esc((i.title || i.desc || '').slice(0, 50))}</span>
        </div>
        ${diffHtml}
      </div>`;
    }).join('');
    sections.push(`<div class="ckpt-section updated">
      <div class="ckpt-section-header">↑ ${result.updated.length} actualizado${result.updated.length>1?'s':''}</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // Ignorados — separados por razón
  const ignoredOk = (result.ignored || []).filter(i => i.reason === 'ya-en-status' || i.reason === 'sin-cambios');
  const ignoredNoStatus = (result.ignored || []).filter(i => i.reason === 'sin-status');
  const ignoredDup = (result.ignored || []).filter(i => i.reason === 'duplicado');

  // sin-status: warning rojo — parser no detectó status
  if (ignoredNoStatus.length) {
    const rows = ignoredNoStatus.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code">${esc(i.code)}</span>
        <span class="ckpt-item-desc">${esc((i.title || i.desc || '').slice(0, 50))}</span>
        <span class="ckpt-item-change ckpt-item-change--error">sin status</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section warning">
      <div class="ckpt-section-header">⚠ ${ignoredNoStatus.length} sin status detectado — revisar formato</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // duplicado: notice amarillo — posible duplicado por título
  if (ignoredDup.length) {
    const rows = ignoredDup.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code ckpt-item-change--warn">[nuevo]</span>
        <span class="ckpt-item-desc">${esc((i.title || i.desc || '').slice(0, 60))}</span>
        <span class="ckpt-item-change ckpt-item-change--warn">duplicado de ${i.existingCode ? esc(i.existingCode) : 'ítem existente'}</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section notice">
      <div class="ckpt-section-header">~ ${ignoredDup.length} posible${ignoredDup.length>1?'s duplicados':' duplicado'} — no agregado</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // ya-en-status / sin-cambios: neutro colapsado
  if (ignoredOk.length) {
    const rows = ignoredOk.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code">${esc(i.code)}</span>
        <span class="ckpt-item-desc">${esc((i.title || i.desc || '').slice(0, 50))}</span>
        <span class="ckpt-item-change">${i.reason === 'ya-en-status' ? 'ya ' + esc(i.status || '') : 'sin cambios'}</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section ignored">
      <div class="ckpt-section-header">— ${ignoredOk.length} sin cambios</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // Context mergeado
  if (result.contextSections && result.contextSections.length) {
    const rows = result.contextSections.map(s =>
      `<div class="ckpt-item"><span class="ckpt-item-desc">${esc(s)}</span></div>`).join('');
    sections.push(`<div class="ckpt-section context">
      <div class="ckpt-section-header">📄 Context — ${result.contextSections.length} sección${result.contextSections.length>1?'es':''}</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // R-202605-140: sección informativa — Próximo paso y Decisión cuando no hay ítems (Caso B)
  // o como complemento cuando sí los hay (Caso A, sidebar derecho lo renderiza por separado)
  const _isInfoOnly = (v) => !v || v.trim().toLowerCase() === 'n/a';
  const _proximoPaso = result.proximoPaso || '';
  const _decision    = result.decision    || '';
  const _hasProximo  = !_isInfoOnly(_proximoPaso);
  const _hasDecision = !_isInfoOnly(_decision);
  if (!sections.length && (_hasProximo || _hasDecision)) {
    // Caso B: CHECKPOINT sin ítems — solo campos informativos
    const _proximoHtml = _hasProximo
      ? `<div class="ckpt-info-proximo">
           <span class="ckpt-info-label ckpt-info-label--proximo">→ Próximo paso</span>
           <span class="ckpt-info-text">${esc(_proximoPaso)}</span>
         </div>`
      : '';
    const _decisionHtml = _hasDecision
      ? `<div class="ckpt-info-decision">
           <span class="ckpt-info-label ckpt-info-label--decision">Decisión</span>
           <span class="ckpt-info-text">${esc(_decision)}</span>
         </div>`
      : '';
    sections.push(`<div class="ckpt-section ckpt-section--info">${_proximoHtml}${_decisionHtml}</div>`);
  } else if (sections.length && (_hasProximo || _hasDecision)) {
    // Caso A: hay ítems — inyectar proximoPaso en el objeto result para que el sidebar lo muestre
    // El HTML del sidebar se renderiza en index.html; aquí anotamos en el panel body como footer
    const _proximoHtml = _hasProximo
      ? `<div class="ckpt-info-proximo ckpt-info-proximo--inline">
           <span class="ckpt-info-label ckpt-info-label--proximo">→ Próximo paso</span>
           <span class="ckpt-info-text">${esc(_proximoPaso)}</span>
         </div>`
      : '';
    if (_proximoHtml) sections.push(`<div class="ckpt-section ckpt-section--info-footer">${_proximoHtml}</div>`);
  }

  if (!sections.length) {
    showToast('info', 'Este CHECKPOINT no tiene ítems ni próximo paso — nada que mostrar.');
    return;
  }

  body.innerHTML = sections.join('');
  clearTimeout(_ckptTimer);
  // R-202604-077: panel diff unificado mantiene abierto sin timeout mientras hay confirmaciones pendientes
  const hasPending = _hasPendingConfirm;
  const duration = hasPending ? 120000 : 7000;
  if (bar) {
    bar.style.setProperty('--ckpt-bar-duration', (duration / 1000) + 's');
    bar.classList.remove('ckpt-bar--running');
    void bar.offsetWidth;
    bar.classList.add('ckpt-bar--running');
  }
  panel.classList.add('open');
  _ckptTimerEnd = Date.now() + duration;
  _ckptTimer = setTimeout(() => { panel.classList.remove('open'); _ckptTimerEnd = null; }, duration);
}

function togglePasteHelp(id) {
  const box = document.getElementById('paste-help-' + id);
  if (!box) return;
  box.classList.toggle('is-hidden');
}


function _updateCkptReopenBtn() {
  const btn = document.getElementById('ckpt-reopen-btn');
  if (!btn) return;
  btn.classList.toggle('is-hidden', !_lastCheckpointResult);
}

function closeCkptPanel() {
  const panel = document.getElementById('ckpt-panel');
  if (panel) panel.classList.remove('open');
  clearTimeout(_ckptTimer);
  _ckptTimerEnd = null;
}

// P-001: pausar/reanudar timer del panel CHECKPOINT cuando un modal de confirmación está abierto
function _pauseCkptTimer() {
  if (!_ckptTimer || !_ckptTimerEnd) return;
  clearTimeout(_ckptTimer);
  _ckptTimer = null;
  // Guardar tiempo restante en _ckptTimerEnd (negativo = ya no hay timer activo, solo residual)
  _ckptTimerEnd = _ckptTimerEnd - Date.now(); // ms restantes
}

function _resumeCkptTimer() {
  const panel = document.getElementById('ckpt-panel');
  if (!panel || !panel.classList.contains('open')) { _ckptTimerEnd = null; return; }
  const remaining = typeof _ckptTimerEnd === 'number' ? _ckptTimerEnd : 0;
  if (remaining <= 0) { panel.classList.remove('open'); _ckptTimerEnd = null; return; }
  _ckptTimerEnd = Date.now() + remaining; // restaurar como timestamp absoluto
  _ckptTimer = setTimeout(() => { panel.classList.remove('open'); _ckptTimerEnd = null; }, remaining);
}

// Toast stack system — múltiples toasts simultáneos con spring animation
const _TOAST_ICONS = { success: '✓', download: '↓', info: 'ℹ', warning: '⚠', error: '✕' };
// T-202604-229: duraciones base por tipo; 0 = sin auto-dismiss
// T-202604-279: duraciones calibradas — base mínima + 40ms/char sobre el mínimo
//   success : mín 2000ms + 40ms/char
//   error   : 0 (sin auto-dismiss — requiere acción del usuario)
//   warning : mín 3000ms + 40ms/char
//   info    : mín 2000ms + 40ms/char
//   download: Math.min(8000, 4000 + 40ms/char) — o hasta dismiss
//   copy / neutral / confirm: planos (sin contenido variable largo)
const _TOAST_DEFAULTS = { success: 2000, download: 4000, error: 0, warning: 3000, info: 2000, confirm: 3500, copy: 2000, neutral: 2500 };
// T-202604-279: calcula duración calibrada según tipo y longitud del texto visible
function _toastDuration(type, title, body) {
  const base = _TOAST_DEFAULTS[type] ?? 2000;
  if (base === 0) return null; // error → sin auto-dismiss
  if (type === 'copy' || type === 'neutral' || type === 'confirm') return base;
  const len = (title ? title.replace(/<[^>]+>/g, '').length : 0) + (body ? body.replace(/<[^>]+>/g, '').length : 0);
  const calibrated = base + len * 40;
  if (type === 'download') return Math.min(8000, calibrated);
  return calibrated;
}

// T-202604-280: stack rules — máximo 3 visibles, queue, prioridad, digest
const _TOAST_MAX = 3;
const _TOAST_PRIORITY = { error: 0, warning: 1, success: 2, info: 3, download: 4 };
let _toastQueue = []; // { type, title, body, base, onClick }

function _toastVisibleCount() {
  const stack = document.getElementById('toast-stack');
  if (!stack) return 0;
  return Array.from(stack.querySelectorAll('.toast-item')).filter(t => !t._dismissed).length;
}

function _toastRender(type, title, body, base, onClick) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;

  const el = document.createElement('div');
  el.className = 'toast-item t-' + type;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icon = _TOAST_ICONS[type] || 'ℹ';
  // B-202605-043: regex estricto — requiere nombre de tag HTML válido seguido de espacio, '/' o '>'
  // Evita falsos positivos con expresiones como '<3', '<3 items', etc.
  const _isHtml = s => /<[a-z][a-z0-9]*[\s/>]/i.test(s) || /<\/[a-z][a-z0-9]*>/i.test(s);
  const titleHtml = _isHtml(title) ? title : esc(title);
  const bodyHtml  = body ? (_isHtml(body) ? body : esc(body)) : null;
  const progressHtml = base !== null ? `<div class="toast-progress"></div>` : '';

  el.innerHTML =
    `<span class="toast-icon">${icon}</span>` +
    `<span class="toast-msg">` +
      `<span class="toast-title">${titleHtml}</span>` +
      (bodyHtml ? `<span class="toast-body">${bodyHtml}</span>` : '') +
    `</span>` +
    `<button class="toast-dismiss" aria-label="Cerrar notificación">×</button>` +
    progressHtml;

  el.querySelector('.toast-dismiss').addEventListener('click', (e) => {
    e.stopPropagation();
    _dismissToast(el);
  });

  if (onClick) {
    el.querySelector('.toast-msg').classList.add('toast-clickable');
    el.querySelector('.toast-msg').addEventListener('click', () => { onClick(); _dismissToast(el); }, { once: true });
  } else if (type === 'error' || type === 'warning') {
    el.classList.add('toast-clickable');
    el.addEventListener('click', () => _dismissToast(el), { once: true });
  }

  // T-202604-228: stagger — cap 3 → 180ms máx
  const _staggerIdx = Math.min(_toastVisibleCount(), _TOAST_MAX - 1);
  const _staggerDelay = _staggerIdx * 60;

  stack.appendChild(el);
  if (base === null) el._noDismiss = true;
  el.getBoundingClientRect();
  if (_staggerDelay > 0) el.style.setProperty('--toast-stagger-delay', _staggerDelay + 'ms');
  el.classList.add('show');
  if (_staggerDelay > 0) setTimeout(() => { el.style.removeProperty('--toast-stagger-delay'); }, _staggerDelay + 300);

  if (base !== null) {
    el.style.setProperty('--toast-duration', (base / 1000) + 's');
    el._hideTimer = setTimeout(() => _dismissToast(el), base);
    el._timerEnd = Date.now() + base;

    el.addEventListener('mouseenter', () => {
      if (el._dismissed) return;
      clearTimeout(el._hideTimer);
      el._hideTimer = null;
      el._remaining = Math.max(0, el._timerEnd - Date.now());
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'paused');
    });
    el.addEventListener('mouseleave', () => {
      if (el._dismissed || el._remaining == null) return;
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'running');
      el._timerEnd = Date.now() + el._remaining;
      el._hideTimer = setTimeout(() => _dismissToast(el), el._remaining);
      el._remaining = null;
    });
    // T-202604-221: touch — pausa en touchstart, reanuda en touchend/touchcancel fuera del toast
    el.addEventListener('touchstart', () => {
      if (el._dismissed) return;
      clearTimeout(el._hideTimer);
      el._hideTimer = null;
      el._remaining = Math.max(0, el._timerEnd - Date.now());
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'paused');
    }, { passive: true });
    const _touchResume = () => {
      if (el._dismissed || el._remaining == null) return;
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'running');
      el._timerEnd = Date.now() + el._remaining;
      el._hideTimer = setTimeout(() => _dismissToast(el), el._remaining);
      el._remaining = null;
    };
    el.addEventListener('touchend', _touchResume, { passive: true });
    el.addEventListener('touchcancel', _touchResume, { passive: true });
  }

  // T-202604-221: accesibilidad teclado — Tab navega entre toasts, Enter/Space cierra
  el.setAttribute('tabindex', '0');
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _dismissToast(el); }
  });
}

// T-202604-222: nueva firma (type, title, body?, duration?, onClick?)
// T-202604-278: regla onClick — solo usar cuando la acción NO es accesible de otra forma en el
//   contexto actual. Toasts informativos van sin onClick. Si el usuario puede encontrar la acción
//   en la UI principal, onClick es redundante y se omite.
//   Ejemplos válidos: navegar a una sección que se acaba de modificar en otro tab.
//   Ejemplos inválidos: dismiss manual (ya hay botón ×), re-abrir modal que tiene acceso directo.
function showToast(type, title, body = null, duration = null, onClick = null) {
  // T-202604-229: duration explícito tiene prioridad; si no → _toastDuration calibra por tipo+len
  // T-202604-279: _toastDuration() aplica fórmula base + 40ms/char; error siempre null (no dismiss)
  const base = duration !== null ? duration : _toastDuration(type, title, body);

  // T-202604-280: si ya hay _TOAST_MAX visibles → encolar; persistentes (base=null) siempre pasan directo
  if (base !== null && _toastVisibleCount() >= _TOAST_MAX) {
    _toastQueue.push({ type, title, body, base, onClick });
    // Reordenar queue por prioridad
    _toastQueue.sort((a, b) =>
      (_TOAST_PRIORITY[a.type] ?? 99) - (_TOAST_PRIORITY[b.type] ?? 99)
    );
    return;
  }

  _toastRender(type, title, body, base, onClick);
}

function _dismissToast(el) {
  if (el._dismissed) return;
  el._dismissed = true;
  clearTimeout(el._hideTimer);
  el.classList.add('toast-hide');
  setTimeout(() => {
    el.remove();
    _toastNext(); // T-202604-280: mostrar siguiente de queue al dismissear
  }, 160); // T-202604-221: 150ms transición salida + 10ms buffer
}

// T-202604-280: extrae el siguiente toast de queue (ya ordenado por prioridad) y lo renderiza
function _toastNext() {
  if (!_toastQueue.length) return;
  if (_toastVisibleCount() >= _TOAST_MAX) return;
  const next = _toastQueue.shift();
  _toastRender(next.type, next.title, next.body, next.base, next.onClick);
}

// T-202604-280: digest — agrupa múltiples mensajes del mismo tipo en un solo toast
// Uso: showToastDigest('warning', ['Proyecto A estancado', 'Proyecto B estancado', 'Proyecto C estancado'])
// Resultado: "Proyecto A estancado" + body "y 2 más" si count > 1, o toast individual si solo 1
function showToastDigest(type, msgs, duration = null) {
  if (!msgs || !msgs.length) return;
  if (msgs.length === 1) {
    showToast(type, msgs[0], null, duration);
    return;
  }
  const title = msgs[0];
  const body = `y ${msgs.length - 1} más`;
  showToast(type, title, body, duration);
}

// alias — retrocompat
function toast(msg) { showToast('info', msg); }

// T-202604-221: showToastInline — toast anclado al elemento que detona la acción
// Acciones sobre ítems: marcar done, copiar código, cambio de status
// En mobile (<600px) delega a showToast global.
//
// Firma original:   showToastInline(anchorEl, type, title, opts)
// Firma con acción: showToastInline(anchorEl, actions, title, opts)
//   donde actions es Array<{ label, cls, cb }> — detectado por Array.isArray(actionsOrType)
//
// R-202605-151: modo acción — renderiza título + botones. Al ejecutar cb() cierra el toast.
//   Click fuera del anchor cierra sin ejecutar ningún callback (cancelar implícito).
//   Mobile (≤600px): delega a showToast con el título — sin botones.
function showToastInline(anchorEl, actionsOrType, title, opts = {}) {
  const isActionMode = Array.isArray(actionsOrType);
  const type = isActionMode ? 'info' : actionsOrType;
  const actions = isActionMode ? actionsOrType : null;

  if (!anchorEl) { showToast(type, title); return; }

  // Mobile: delegar al sistema global (sin botones de acción)
  if (window.innerWidth <= 600) {
    showToast(type, title);
    return;
  }

  // Limpiar inline anterior en el mismo anchor si existe
  const prev = anchorEl.querySelector('.toast-inline');
  if (prev) prev.remove();

  // Asegurar position:relative en el anchor
  const pos = getComputedStyle(anchorEl).position;
  if (pos === 'static') anchorEl.style.setProperty('position', 'relative');

  const el = document.createElement('div');
  // R-202605-174: detección de viewport — flip a 'below' cuando anchor cerca del top
  // No aplica en mobile (≤600px) — ya delegado a showToast() antes de llegar aquí
  const _TOAST_INLINE_FLIP_THRESHOLD = 80; // px desde el top del viewport
  let placement = opts.position || 'above';
  try {
    const rect = anchorEl.getBoundingClientRect();
    if (rect.top < _TOAST_INLINE_FLIP_THRESHOLD) {
      placement = 'below';
    }
  } catch(e) {
    // getBoundingClientRect falló — conservar placement calculado hasta ahora
  }
  el.className = `toast-inline t-${type} toast-inline--${placement}`;
  el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const _hideInline = () => {
    if (el._inlineDismissed) return;
    el._inlineDismissed = true;
    clearTimeout(el._inlineTimer);
    el.classList.add('toast-hide');
    setTimeout(() => el.remove(), 200);
  };

  if (isActionMode && actions.length) {
    // Modo acción: texto + botones
    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast-inline-msg';
    msgSpan.textContent = title;
    el.appendChild(msgSpan);

    const btnWrap = document.createElement('span');
    btnWrap.className = 'toast-inline-actions';
    actions.forEach(({ label, cls, cb }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `toast-inline-btn${cls ? ' ' + cls : ''}`;
      btn.textContent = label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _hideInline();
        if (typeof cb === 'function') cb();
      });
      btnWrap.appendChild(btn);
    });
    el.appendChild(btnWrap);

    // Click fuera del anchor — cancelar implícito (sin ejecutar cb)
    const _outsideHandler = (e) => {
      if (!anchorEl.contains(e.target)) {
        _hideInline();
        document.removeEventListener('click', _outsideHandler, true);
      }
    };
    // Diferir para no capturar el click que abrió el toast
    setTimeout(() => document.addEventListener('click', _outsideHandler, true), 0);
    el._outsideHandler = _outsideHandler;

  } else {
    // Modo informativo original
    const icon = _TOAST_ICONS[type] || 'ℹ';
    el.textContent = `${icon} ${title}`;
    el._inlineTimer = setTimeout(_hideInline, 2000);
  }

  anchorEl.appendChild(el);
  el.getBoundingClientRect(); // forzar reflow
  el.classList.add('show');
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  save();
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  // T-202605-433: theme-btn eliminado — nuevo ID en menú ⋯
  const btn = document.getElementById('more-menu-theme');
  if (btn) {
    const icon = btn.querySelector('.mm-icon');
    if (icon) icon.textContent = t === 'dark' ? '☀' : '🌙';
  }
}
function onSearchDispatch() {
  // T-202604-420: búsqueda global unificada como punto de entrada principal
  // La búsqueda por tab queda subordinada — onSearch incluye backlog + proyectos + IAs + sesiones + notas
  const _surPanel = document.getElementById('search-unified-results');
  if (_surPanel) _surPanel.remove();

  const q = (document.getElementById('search-global')?.value || '').trim();

  // Siempre invocar búsqueda global unificada
  if (typeof onSearch === 'function') onSearch();
}

// ── TAB-TRACKER — State, render, cards, sesiones, tracker global, tags, pendientes ──

// DEFAULT_AIS declarado en locus-storage.js — debe estar disponible antes de load()
let popAIId = null, popSessId = null;
let tagModalAIId = null, tagModalSessId = null, selectedColor = 0;

const TAG_COLORS = ['#7c6af7','#2ecc78','#e8a832','#e85555','#38bdf8','#f472b6','#a3e635','#fb923c'];

function _scbDismissed() {
  return localStorage.getItem('setup-checklist-dismissed') === '1';
}
function _scbDismiss() {
  localStorage.setItem('setup-checklist-dismissed', '1');
  const banner = document.getElementById('setup-checklist-banner');
  if (banner) {
    banner.classList.remove('scb-expanded');
    banner.setAttribute('aria-expanded', 'false');
    banner.classList.add('is-hidden');
  }
}
function _scbStep(id, done) {
  const el = document.getElementById('scb-step-' + id);
  if (!el) return;
  const icon = el.querySelector('.scb-icon');
  const wasDone = el.classList.contains('scb-done');
  el.classList.toggle('scb-done', done);
  el.classList.remove('scb-active');
  if (icon) icon.textContent = done ? '✓' : '○';
  // opacity fade ○→✓ 150ms (CSS handles transition)
  if (!wasDone && done) el.classList.add('scb-just-done');
}
function renderSetupChecklist() {
  const banner = document.getElementById('setup-checklist-banner');
  if (!banner) return;
  if (_scbDismissed()) { banner.classList.add('is-hidden'); return; }

  const workerDone  = (state.ais || []).length > 0;
  const projectDone = (state.projects || []).length > 0;
  const itemDone    = (typeof ITEMS !== 'undefined' ? ITEMS : []).length > 0;
  const sessionDone = (typeof getAllSessions === 'function') ? getAllSessions().length > 0 : false;
  const allDone = workerDone && projectDone && itemDone && sessionDone;

  if (allDone) { banner.classList.add('is-hidden'); return; }

  banner.classList.remove('is-hidden');
  _scbStep('worker',  workerDone);
  _scbStep('project', projectDone);
  _scbStep('item',    itemDone);
  _scbStep('session', sessionDone);

  // Mark first pending step as active
  const steps = [
    { id: 'worker',  done: workerDone },
    { id: 'project', done: projectDone },
    { id: 'item',    done: itemDone },
    { id: 'session', done: sessionDone }
  ];
  for (const s of steps) {
    if (!s.done) {
      const el = document.getElementById('scb-step-' + s.id);
      if (el) el.classList.add('scb-active');
      break;
    }
  }

  // If banner was expanded and first step is now done → collapse
  if (banner.classList.contains('scb-expanded') && workerDone) {
    _scbCollapse(banner);
    try { localStorage.setItem('onboarding-seen', '1'); } catch(_) {}
    if (typeof _saveUserPrefs === 'function') _saveUserPrefs();
  }

  // First use: expand if onboarding-seen not set and banner not yet expanded
  const isFirstUse = !localStorage.getItem('onboarding-seen');
  if (isFirstUse && !banner.classList.contains('scb-expanded')) {
    _scbExpand(banner);
  }
}

function _scbExpand(banner) {
  const b = banner || document.getElementById('setup-checklist-banner');
  if (!b) return;
  b.classList.add('scb-expanded');
  b.setAttribute('aria-expanded', 'true');
  // Focus first action button
  const firstAction = b.querySelector('.scb-active .scb-step-action');
  if (firstAction) setTimeout(() => firstAction.focus(), 210); // after transition
}

function _scbCollapse(banner) {
  const b = banner || document.getElementById('setup-checklist-banner');
  if (!b) return;
  b.classList.remove('scb-expanded');
  b.setAttribute('aria-expanded', 'false');
}

// Called when user completes first step — collapse expanded state
function _scbOnStepComplete() {
  const banner = document.getElementById('setup-checklist-banner');
  if (banner && banner.classList.contains('scb-expanded')) {
    _scbCollapse(banner);
    // Mark onboarding-seen so expanded state doesn't reappear
    try { localStorage.setItem('onboarding-seen', '1'); } catch(_) {}
    if (typeof _saveUserPrefs === 'function') _saveUserPrefs();
  }
}

// Action buttons per step — routes to existing open functions
function _scbStepAction(stepId) {
  switch (stepId) {
    case 'worker':  if (typeof openAddAI === 'function') openAddAI(); break;
    case 'project': if (typeof openProjModal === 'function') openProjModal(); break;
    case 'item':    if (typeof switchTab === 'function') switchTab('backlog'); break;
    case 'session': /* Session created via CHECKPOINT paste — no direct action */ break;
  }
}
// ── END R-202605-008 ──────────────────────────────────────────────────────────

function updateStats() {
  // v3: contar sesiones desde proyectos
  const tot = getAllSessions().length;
  // Actualizar badge del sub-tab Tracker (tg-badge-sub)
  const tgBadgeSub = document.getElementById('tg-badge-sub');
  if (tgBadgeSub) {
    const tracker = getActiveTracker();
    const activeCount = (tracker.items || []).filter(x => x.status !== 'done').length;
    tgBadgeSub.textContent = activeCount;
    tgBadgeSub.classList.toggle('tg-badge-sub--visible', !!activeCount);
  }
}

// Detecta si una IA está "en sesión": disponible con última sesión sin resetAt ni quickCapture
// = checkpoint registrado pero aún no se agotó formalmente
function _isInSession(ai) {
  if (ai.status !== 'available' || ai.interrupted) return false;
  // Usar id (timestamp) como proxy de orden — más robusto que date (formato localizado)
  const allSess = getAllSessions().filter(s => s.aiId === ai.id);
  if (!allSess.length) return false;
  const last = allSess.reduce((a, b) => (parseInt(b.id) || 0) > (parseInt(a.id) || 0) ? b : a);
  return !!(last && !last.resetAt && !last.quickCapture);
}

// T-086 / T-202604-181: Barra de estado sobre el grid (solo vista Cards)
// T-202605-523: helper compartido — evita recalcular sprint activo en múltiples bloques de renderStatusBar
function _getActiveSprintStats() {
  try {
    const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
    const sp = proj && proj.sprints ? proj.sprints.find(s => s.status === 'active') : null;
    if (!sp) return { sp: null, spItems: [], spDone: 0, spTotal: 0, spPct: 0, spLabel: '' };
    const spItems = (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(i => i.sprint === sp.id);
    const spDone  = spItems.filter(i => i.status === 'done').length;
    const spTotal = spItems.length;
    const spPct   = spTotal > 0 ? Math.round((spDone / spTotal) * 100) : 0;
    const spLabel = sp.label || sp.id || '';
    return { sp, spItems, spDone, spTotal, spPct, spLabel };
  } catch(e) {
    return { sp: null, spItems: [], spDone: 0, spTotal: 0, spPct: 0, spLabel: '' };
  }
}

// Contenido: toggle tema (izq) · Sprint activo · Pendientes · Último cambio relativo (der)
function renderStatusBar() {
  // R-202604-060: tracker-status-bar DEPRECATED — lógica migrada a tracker-grid-header + global-footer

  // ── R-202605-168: Sprint progress bar — segunda fila del header ───────────
  // Reutiliza el cálculo de sprint activo; no duplica lógica.
  try {
    const _hsrRow    = document.getElementById('header-sprint-row');
    const _hsrLabel  = document.getElementById('hsr-label');
    const _hsrFill   = document.getElementById('hsr-bar-fill');
    const _hsrText   = document.getElementById('hsr-text');
    if (_hsrRow) {
      const { sp: _hsprSp, spDone: _hsprDone, spTotal: _hsprTotal, spPct: _hsprPct } = _getActiveSprintStats();

      if (_hsprSp) {
        if (_hsrLabel) _hsrLabel.textContent = _hsprSp.label || _hsprSp.id || '';
        if (_hsrFill) {
          _hsrFill.style.setProperty('--hsr-pct', _hsprPct + '%');
          _hsrFill.classList.toggle('hsr-bar-fill--success', _hsprPct >= 70);
          _hsrFill.classList.toggle('hsr-bar-fill--accent',  _hsprPct < 70);
        }
        if (_hsrText) _hsrText.textContent = _hsprPct + '% · ' + _hsprDone + '/' + _hsprTotal;
        _hsrRow.setAttribute('aria-valuenow', _hsprPct);
        _hsrRow.classList.add('hsr-visible');
      } else {
        _hsrRow.classList.remove('hsr-visible');
      }
    }
  } catch (e) {}

  // Sincronizar breadcrumb con el estado actual de sprint/proyecto
  if (typeof _updateHeaderProjectLabel === 'function') _updateHeaderProjectLabel();

  // ── Grid header: vacío — pill migrado a tracker-view-header (R-202605-139) ──
  const gridHeader = document.getElementById('tracker-grid-header');
  if (gridHeader) {
    gridHeader.innerHTML = '';
    gridHeader.classList.remove('tgh-visible');
  }

  // ── R-202605-139: sprint pill en tracker-view-header ──────────────────────────────────
  // El sprint pertenece al proyecto activo, no a un AI individual.
  // El pill vive a la izquierda del selector de vista, siempre visible en el tab Tracker.
  const viewHeader = document.getElementById('tracker-view-header');
  if (viewHeader) {
    let sprintPillHtml = '';
    try {
      const { sp, spDone, spTotal, spPct, spLabel } = _getActiveSprintStats();
      if (sp) {
        sprintPillHtml = `<button class="tgh-sprint-pill tvh-sprint-pill" onclick="if(typeof toggleSprintHealthPanel==='function')toggleSprintHealthPanel();" title="Ver sprint health">` +
          `<span class="tgh-sprint-name">${spLabel}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-progress">${spDone}/${spTotal}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-pct">${spPct}%</span>` +
          `<span class="tgh-sprint-bar-wrap"><span class="tgh-sprint-bar-fill" style="--pct:${spPct}%"></span></span>` +
          `</button>`;
      }
    } catch(e) {}

    const existingPill = viewHeader.querySelector('.tvh-sprint-pill');
    if (existingPill) {
      if (sprintPillHtml) {
        existingPill.outerHTML = sprintPillHtml;
      } else {
        existingPill.remove();
      }
    } else if (sprintPillHtml) {
      viewHeader.insertAdjacentHTML('afterbegin', sprintPillHtml);
    }
  }


  // ── Global footer: R-202604-080 — barra de estado global ─────────────────
  const gfProyecto = document.getElementById('gf-proyecto');
  const gfVersion  = document.getElementById('gf-version');
  const gfTotal    = document.getElementById('gf-total');
  const gfDone     = document.getElementById('gf-done');
  const gfCkpt     = document.getElementById('gf-ckpt');
  const gfPulso    = document.getElementById('gf-pulso');
  const gfFecha    = document.getElementById('gf-fecha');
  const gfSyncEl   = document.getElementById('gf-sync');
  if (gfSyncEl) gfSyncEl.classList.remove('gf-hidden');

  const _items = (typeof ITEMS !== 'undefined' ? ITEMS : []);

  // gf-proyecto
  if (gfProyecto) {
    try {
      const proj = getActiveProject();
      const nombre = (proj && proj.name) ? proj.name : 'Locus';
      gfProyecto.textContent = nombre;
      gfProyecto.classList.remove('gf-hidden');
    } catch(e) {
      gfProyecto.textContent = 'Locus';
      gfProyecto.classList.remove('gf-hidden');
    }
  }

  // gf-version
  if (gfVersion) {
    gfVersion.textContent = (typeof _effectiveVersion === 'function') ? _effectiveVersion() : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '');
    gfVersion.classList.remove('gf-hidden');
  }

  // gf-total / gf-done
  if (gfTotal || gfDone) {
    const total = _items.filter(i => typeof _isCountableItem === 'function' ? _isCountableItem(i) : true).length;
    const done  = _items.filter(i => (typeof _isCountableItem === 'function' ? _isCountableItem(i) : true) && i.status === 'done').length;
    if (gfTotal) { gfTotal.textContent = total + ' ítems'; gfTotal.classList.remove('gf-hidden'); }
    if (gfDone)  { gfDone.textContent  = '✓ ' + done;   gfDone.classList.remove('gf-hidden'); }
  }

  // gf-ckpt: ultimo checkpoint global
  if (gfCkpt) {
    try {
      const allSess = getAllSessions().slice().sort((a, b) => {
        const ta = a.timestamp || a.endTime || a.startTime || 0;
        const tb = b.timestamp || b.endTime || b.startTime || 0;
        return tb - ta;
      });
      const lastSess = allSess[0] || null;
      if (lastSess) {
        const titulo = (lastSess.title || lastSess.nombre || '').slice(0, 28) || '—';
        gfCkpt.textContent = '⏱ ' + titulo;
        gfCkpt.classList.remove('gf-hidden');
        gfCkpt.classList.add('gf-ckpt--link');
        gfCkpt.onclick = function() {
          if (typeof openDetail === 'function') openDetail(lastSess.aiId, lastSess.id);
        };
      } else {
        gfCkpt.classList.add('gf-hidden');
        gfCkpt.onclick = null;
      }
    } catch(e) { gfCkpt.classList.add('gf-hidden'); }
  }

  // gf-pulso
  if (gfPulso) {
    gfPulso.textContent = '◉ Pulso';
    gfPulso.classList.remove('gf-hidden');
    gfPulso.classList.add('gf-pulso--link');
    gfPulso.onclick = function() {
      if (typeof openPulsoPanel === 'function') openPulsoPanel();
    };
  }

  // gf-fecha
  if (gfFecha) {
    try {
      const timestamps = _items.map(i => i.statusChangedAt).filter(Boolean);
      if (timestamps.length) {
        const maxTs = Math.max.apply(null, timestamps);
        const iso   = new Date(maxTs).toISOString().split('T')[0];
        gfFecha.textContent = iso;
        gfFecha.classList.remove('gf-hidden');
      } else {
        gfFecha.classList.add('gf-hidden');
      }
    } catch(e) { gfFecha.classList.add('gf-hidden'); }
  }
}

// AI STATUS BAR — footer persistente visible en todos los módulos
// Dot gris = agotada | dot verde = disponible | dot púrpura pulsante = en sesión | dot ámbar pulsante = interrumpida

// T-202604-422: Notificaciones de ecosistema — motor + helpers
const _NOTIF_KEY         = 'ai-tracker-notifs-read';
const _NOTIF_CONFIG_KEY  = 'ai-tracker-notifs-config';
// R-202605-119: historial de notificaciones descartadas
const _NOTIF_HISTORY_KEY = 'ai-tracker-notifs-history';
const _NOTIF_HISTORY_MAX = 50;

// R-202605-119: helpers de historial
function _notifHistory() {
  try { return JSON.parse(localStorage.getItem(_NOTIF_HISTORY_KEY) || '[]'); } catch { return []; }
}

function _notifHistoryAdd(notif) {
  // severity: 'info' para la mayoría, 'warn' para bugs high y sprint low, 'ok' para desbloqueados
  const severityMap = { bugHigh: 'warn', sprintLow: 'warn', unblocked: 'ok', sprintOrphans: 'warn' };
  const entry = {
    type:      notif.type,
    severity:  severityMap[notif.type] || 'info',
    text:      notif.title + ' — ' + notif.body,
    ts:        Date.now(),
    projectId: notif.projectId || null
  };
  const hist = _notifHistory();
  hist.push(entry);
  // AC-4: FIFO — máximo 50 entradas
  const pruned = hist.length > _NOTIF_HISTORY_MAX ? hist.slice(hist.length - _NOTIF_HISTORY_MAX) : hist;
  try { localStorage.setItem(_NOTIF_HISTORY_KEY, JSON.stringify(pruned)); } catch {}
}

// Configuración de notificaciones — tipos habilitados y umbrales de tiempo
// B-202605-240: persiste en localStorage
const _NOTIF_DEFAULTS = {
  unblocked:     { enabled: true,  label: 'Bloqueante resuelto',              threshold: 7  },
  sprintOrphans: { enabled: true,  label: 'Sprint cerrado con pendientes',    threshold: 0  },
  itemInactivo:  { enabled: true,  label: 'Ítem sin sesión vinculada',        threshold: 14 },
  sprintLow:     { enabled: true,  label: 'Sprint con avance bajo a mitad',   threshold: 20 },
  bugHigh:       { enabled: true,  label: 'Bug high sin sesión vinculada',    threshold: 7  },
  aiCadencia:    { enabled: true,  label: 'IA fuera de cadencia histórica',   threshold: 0  },
};

function _notifConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(_NOTIF_CONFIG_KEY) || '{}');
    // Merge con defaults — nuevos tipos no borran config existente
    const merged = {};
    Object.keys(_NOTIF_DEFAULTS).forEach(k => {
      merged[k] = Object.assign({}, _NOTIF_DEFAULTS[k], stored[k] || {});
    });
    return merged;
  } catch { return Object.assign({}, _NOTIF_DEFAULTS); }
}

function _saveNotifConfig(cfg) {
  try { localStorage.setItem(_NOTIF_CONFIG_KEY, JSON.stringify(cfg)); } catch {}
}

function _notifReadSet() {
  try { return new Set(JSON.parse(localStorage.getItem(_NOTIF_KEY) || '[]')); } catch { return new Set(); }
}
function _notifSaveRead(set) {
  try { localStorage.setItem(_NOTIF_KEY, JSON.stringify([...set])); } catch {}
}

// Computa todas las notificaciones activas del ecosistema
// B-202605-238: implementa los 4 triggers del AC de R-202604-084
// Devuelve array de { id, type, tab, icon, title, body, action }
// Función canónica — ¿tiene el ítem sesión vinculada en los últimos N días?
// Consulta trackerRefs + backlogRefs. Usa savedAt || createdAt como timestamp.
// Fallback: si el ítem fue creado hace menos de N días sin ninguna mención, retorna true.
function hasRecentSession(item, days) {
  if (!item) return true;
  const allSess = (typeof getAllSessions === 'function' ? getAllSessions() : []);
  const cutoff  = Date.now() - days * 86400000;
  let lastMentionTs = 0;
  allSess.forEach(function(s) {
    const refs = (s.trackerRefs || []).concat(s.backlogRefs || []);
    if (refs.includes(item.code)) {
      const ts = s.savedAt || s.createdAt || (s.date ? new Date(s.date).getTime() : 0);
      if (ts > lastMentionTs) lastMentionTs = ts;
    }
  });
  if (!lastMentionTs) {
    const createdAt = item.createdAt || 0;
    if (!createdAt) return false;
    return (Date.now() - createdAt) / 86400000 <= days;
  }
  return lastMentionTs >= cutoff;
}

function _computeNotifications() {
  const notifs = [];
  const items  = (typeof ITEMS !== 'undefined' ? ITEMS : []);
  const cfg    = _notifConfig();

  // Helper interno — delega a función canónica
  function _itemHasRecentSession(item, days) {
    return hasRecentSession(item, days);
  }

  // 1. Bloqueante resuelto — pendiente con dep done + history.unblocked reciente
  if (cfg.unblocked && cfg.unblocked.enabled) {
    items.forEach(function(item) {
      if (item.status !== 'pendiente') return;
      if (!item.blockedBy || !item.blockedBy.length) return;
      const resolved = item.blockedBy.filter(function(c) {
        const dep = items.find(function(i) { return i.code === c; });
        return dep && dep.status === 'done';
      });
      if (!resolved.length) return;
      const recent = (item.history || []).find(function(h) {
        return h.type === 'unblocked' &&
          resolved.includes(h.data && h.data.by) &&
          (Date.now() - (h.ts || 0)) / 86400000 < (cfg.unblocked.threshold || 7);
      });
      if (!recent) return;
      const id  = 'unblocked-' + item.code + '-' + recent.ts;
      const lbl = (item.title || '').substring(0, 48);
      notifs.push({
        id, type: 'unblocked', tab: 'backlog', icon: '\uD83D\uDD13',
        title: 'Bloqueante resuelto',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + ' ya puede avanzar',
        action: function() { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
      });
    });
  }

  // 2. Sprint cerrado con pendientes sin reasignar
  if (cfg.sprintOrphans && cfg.sprintOrphans.enabled) {
    const allSprints = (typeof getActiveSprints === 'function' ? getActiveSprints() : []);
    allSprints.filter(function(s) { return s.status === 'closed'; }).forEach(function(sp) {
      const orphans = items.filter(function(i) { return i.sprint === sp.id && i.status === 'pendiente'; });
      if (!orphans.length) return;
      const id  = 'sprint-orphans-' + sp.id;
      const cnt = orphans.length;
      notifs.push({
        id, type: 'sprintOrphans', tab: 'backlog', icon: '\u26A0\uFE0F',
        title: 'Sprint cerrado con pendientes',
        body: (sp.label || sp.id) + ' \u2014 ' + cnt + ' \xEDtem' + (cnt !== 1 ? 's' : '') + ' sin reasignar',
        action: function() {
          if (typeof switchTab === 'function') switchTab('backlog');
          if (typeof setFilter === 'function') setTimeout(function() { setFilter('sprint', sp.id); }, 80);
        }
      });
    });
  }

  // 3. B-202605-238 AC: ítem pendiente sin sesión vinculada > 14 días
  if (cfg.itemInactivo && cfg.itemInactivo.enabled) {
    const thresh = cfg.itemInactivo.threshold || 14;
    items.forEach(function(item) {
      if (item.status !== 'pendiente') return;
      if (!item.createdAt) return;
      const ageDays = (Date.now() - item.createdAt) / 86400000;
      if (ageDays <= thresh) return;
      if (_itemHasRecentSession(item, thresh)) return;
      const id  = 'item-inactivo-' + item.code;
      const lbl = (item.title || '').substring(0, 40);
      notifs.push({
        id, type: 'itemInactivo', tab: 'backlog', icon: '\uD83D\uDD51',
        title: 'Ítem sin actividad',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + ' sin sesión en ' + Math.floor(ageDays) + ' días',
        action: function() { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
      });
    });
  }

  // 4. B-202605-238 AC: sprint con < 20% avance a mitad de período
  if (cfg.sprintLow && cfg.sprintLow.enabled) {
    const minPct = cfg.sprintLow.threshold != null ? cfg.sprintLow.threshold : 20;
    const allSprints2 = (typeof getActiveSprints === 'function' ? getActiveSprints() : []);
    allSprints2.filter(function(s) { return s.status === 'active'; }).forEach(function(sp) {
      if (!sp.startedAt || !sp.endsAt) return;
      const now      = Date.now();
      const total    = sp.endsAt - sp.startedAt;
      const elapsed  = now - sp.startedAt;
      if (total <= 0 || elapsed / total < 0.5) return; // aún no llega a mitad
      const spItems  = items.filter(function(i) { return i.sprint === sp.id; });
      const spDone   = spItems.filter(function(i) { return i.status === 'done'; }).length;
      const spPct    = spItems.length > 0 ? Math.round((spDone / spItems.length) * 100) : 0;
      if (spPct >= minPct) return;
      const id = 'sprint-low-' + sp.id;
      notifs.push({
        id, type: 'sprintLow', tab: 'backlog', icon: '\u26A1',
        title: 'Sprint con avance bajo',
        body: (sp.label || sp.id) + ' \u2014 ' + spPct + '% a mitad del período',
        action: function() {
          if (typeof switchTab === 'function') switchTab('backlog');
          if (typeof toggleSprintHealthPanel === 'function') setTimeout(toggleSprintHealthPanel, 80);
        }
      });
    });
  }

  // 5. B-202605-238 AC: B de prioridad high sin sesión vinculada > 7 días
  if (cfg.bugHigh && cfg.bugHigh.enabled) {
    const bugThresh = cfg.bugHigh.threshold || 7;
    items.forEach(function(item) {
      if (item.type !== 'B') return;
      if (item.priority !== 'high') return;
      if (item.status !== 'pendiente') return;
      if (!item.createdAt) return;
      const ageDays = (Date.now() - item.createdAt) / 86400000;
      if (ageDays <= bugThresh) return;
      if (_itemHasRecentSession(item, bugThresh)) return;
      const id  = 'bug-high-' + item.code;
      const lbl = (item.title || '').substring(0, 40);
      notifs.push({
        id, type: 'bugHigh', tab: 'backlog', icon: '\uD83D\uDED1',
        title: 'Bug high sin atención',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + ' lleva ' + Math.floor(ageDays) + ' días sin sesión',
        action: function() { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
      });
    });
  }

  // 6. B-202605-238 AC: IA sin sesión vs cadencia histórica
  if (cfg.aiCadencia && cfg.aiCadencia.enabled) {
    const active = (typeof state !== 'undefined' ? (state.ais || []) : []).filter(function(a) { return !a.archived; });
    active.forEach(function(ai) {
      if (ai.status === 'exhausted') return;
      const allSess  = (typeof getAllSessions === 'function' ? getAllSessions() : [])
        .filter(function(s) { return s.aiId === ai.id; })
        .sort(function(a, b) { return (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0); });
      if (allSess.length < 3) return; // sin cadencia establecida
      // Calcular intervalo promedio entre las últimas 6 sesiones
      const recent6   = allSess.slice(-6);
      let totalGap = 0, gapCount = 0;
      for (let i = 1; i < recent6.length; i++) {
        const diff = (new Date(recent6[i].date).getTime() || 0) - (new Date(recent6[i - 1].date).getTime() || 0);
        if (diff > 0) { totalGap += diff; gapCount++; }
      }
      if (!gapCount) return;
      const avgGapMs  = totalGap / gapCount;
      const lastSess  = allSess[allSess.length - 1];
      const sinceMs   = Date.now() - (new Date(lastSess.date).getTime() || 0);
      if (sinceMs < avgGapMs * 1.5) return; // dentro del 150% de cadencia normal
      const sinceD    = Math.floor(sinceMs / 86400000);
      const id        = 'ai-cadencia-' + ai.id;
      notifs.push({
        id, type: 'aiCadencia', tab: 'tracker', icon: '\uD83E\uDD16',
        title: 'IA fuera de cadencia',
        body: (ai.name || ai.id) + ' sin sesión en ' + sinceD + ' días (cadencia habitual: ' + Math.round(avgGapMs / 86400000) + 'd)',
        action: function() {
          if (typeof switchTab === 'function') switchTab('tracker');
          if (typeof navigateToCard === 'function') setTimeout(function() { navigateToCard(ai.id); }, 80);
        }
      });
    });
  }

  return notifs;
}

function markNotifRead(id) {
  // AC-3: guardar en historial antes de marcar como leída
  const all    = _computeNotifications();
  const notif  = all.find(function(n) { return n.id === id; });
  if (notif) _notifHistoryAdd(notif);
  const set = _notifReadSet();
  set.add(id);
  _notifSaveRead(set);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  updateTabNotifBadges();
}

function markAllNotifsRead() {
  const notifs = _computeNotifications();
  const set    = _notifReadSet();
  // AC-3: guardar todas en historial antes de marcar
  notifs.forEach(function(n) { _notifHistoryAdd(n); });
  notifs.forEach(function(n) { set.add(n.id); });
  _notifSaveRead(set);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  updateTabNotifBadges();
}

// B-202605-239: badges numéricos en tab buttons — un badge por tab con notifs no leídas
// tab field en cada notif determina qué tab recibe el badge
function updateTabNotifBadges() {
  const notifs = _computeNotifications();
  const read   = _notifReadSet();
  const unseen = notifs.filter(function(n) { return !read.has(n.id); });

  // Contar por tab
  const counts = { tracker: 0, backlog: 0, analytics: 0, proyectos: 0 };
  unseen.forEach(function(n) {
    if (n.tab && counts.hasOwnProperty(n.tab)) counts[n.tab]++;
  });

  // Actualizar badges en cada tab button
  Object.keys(counts).forEach(function(tab) {
    const btn = document.getElementById('tab-btn-' + tab);
    if (!btn) return;
    let badge = btn.querySelector('.tab-notif-badge');
    if (counts[tab] > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'tab-notif-badge';
        btn.appendChild(badge);
      }
      badge.textContent = counts[tab] > 9 ? '9+' : counts[tab];
      badge.classList.remove('is-hidden');
    } else {
      if (badge) badge.classList.add('is-hidden');
    }
  });
}

// B-202605-240: UI de configuración de notificaciones — tipos y umbrales
// R-202605-119: openNotifConfig redirige al Radar Sidebar — config unificada ahí
function openNotifConfig() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  // Expandir sidebar si está colapsado
  if (sidebar.classList.contains('collapsed')) {
    toggleRadarSidebar();
  }
  // Re-renderizar para asegurar que el panel esté presente
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  // Expandir el panel config con un tick para que el DOM esté listo
  setTimeout(function() {
    var body  = document.getElementById('rsb-cfg-body');
    var arrow = document.getElementById('rsb-cfg-arrow');
    var btn   = document.getElementById('rsb-cfg-toggle-btn');
    if (body && body.classList.contains('rsb-cfg-body--hidden')) {
      body.classList.remove('rsb-cfg-body--hidden');
      if (arrow) arrow.textContent = '▾';
      if (btn)   btn.setAttribute('aria-expanded', 'true');
      body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 50);
}

function _notifConfigReset() {
  try { localStorage.removeItem(_NOTIF_CONFIG_KEY); } catch {}
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}

function _notifConfigSetEnabled(key, enabled) {
  const cfg = _notifConfig();
  if (!cfg[key]) cfg[key] = Object.assign({}, _NOTIF_DEFAULTS[key]);
  cfg[key].enabled = !!enabled;
  _saveNotifConfig(cfg);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}

function _notifConfigSetThreshold(key, val) {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 1) return;
  const cfg = _notifConfig();
  if (!cfg[key]) cfg[key] = Object.assign({}, _NOTIF_DEFAULTS[key]);
  cfg[key].threshold = num;
  _saveNotifConfig(cfg);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}


const _notifActionMap = {};
function _registerNotifActions(notifs) {
  notifs.forEach(function(n) { _notifActionMap[n.id] = n.action; });
}
function _notifGoto(id) {
  const fn = _notifActionMap[id];
  if (typeof fn === 'function') fn();
  markNotifRead(id);
}

// RADAR — movido a locus-radar.js

// T-097: Colapsar/expandir todas las cards activas
function toggleCollapseAll() {
  const active = state.ais.filter(a => !a.archived);
  const allCollapsed = active.every(a => !a.showAll);
  active.forEach(a => { a.showAll = allCollapsed; });
  save(); render();
}

let _trackerSelectedId = null;

// ── R-202604-078: Vista Por IA / Historial ──────────────────────────────
let _trackerCurrentView = 'poria'; // 'poria' | 'historial'
let _trackerViewProjFilter = '';

function _trackerSetView(view) {
  _trackerCurrentView = view;

  // toggle buttons
  const btnPoria    = document.getElementById('tvh-btn-poria');
  const btnHistorial = document.getElementById('tvh-btn-historial');
  if (btnPoria)    { btnPoria.classList.toggle('active', view === 'poria');    btnPoria.setAttribute('aria-pressed', view === 'poria' ? 'true' : 'false'); }
  if (btnHistorial) { btnHistorial.classList.toggle('active', view === 'historial'); btnHistorial.setAttribute('aria-pressed', view === 'historial' ? 'true' : 'false'); }

  // panel classes
  const tab = document.getElementById('tab-tracker');
  if (!tab) return;
  tab.classList.toggle('tracker-view--poria',    view === 'poria');
  tab.classList.toggle('tracker-view--historial', view === 'historial');

  // populate project selector cada vez que cambia la vista
  _trackerViewPopulateProjects();

  if (view === 'historial') {
    // Vista B: render col 1 agrupada por día + col 2 global hist
    _trackerHistDayRender();
    if (typeof _trackerRenderHist === 'function') _trackerRenderHist();
  } else if (view === 'poria') {
    // Vista A: persistencia — si hay sesión seleccionada, aterrizar en su IA
    if (_trackerHistSelectedSessId) {
      const allSess = (typeof getAllSessions === 'function') ? getAllSessions() : [];
      const sess = allSess.find(s => s.id === _trackerHistSelectedSessId);
      if (sess && sess.aiId) {
        navigateToCard(sess.aiId);
        return;
      }
    }
    // fallback: re-render normal + mini-hist
    if (typeof render === 'function') render();
    if (typeof _trackerRenderMiniHist === 'function') _trackerRenderMiniHist(_trackerSelectedId);
  }
}

function _trackerViewPopulateProjects() {
  const sel = document.getElementById('tvh-proj-select');
  if (!sel) return;
  const projects = (state.projects || []).filter(p => p.status !== 'paused');
  const current = _trackerViewProjFilter;
  sel.innerHTML = '<option value="">Todos los proyectos</option>' +
    projects.map(p => `<option value="${esc(p.id)}"${p.id === current ? ' selected' : ''}>${esc((p.icon || '📁') + ' ' + p.name)}</option>`).join('');
  // B-202605-269: ocultar el select si solo hay 0 o 1 proyecto — no aporta filtrado útil
  sel.classList.toggle('tvh-proj-single', projects.length <= 1);
}

function _trackerViewProjChange() {
  const sel = document.getElementById('tvh-proj-select');
  _trackerViewProjFilter = sel ? sel.value : '';
  // sincronizar con filtro de historial col 2 existente
  _trackerHistProjFilter = _trackerViewProjFilter;
  if (_trackerCurrentView === 'poria') {
    if (typeof _trackerRenderMiniHist === 'function') _trackerRenderMiniHist(_trackerSelectedId);
  } else {
    if (typeof _trackerRenderHist === 'function') _trackerRenderHist();
  }
  // re-render col 1 Vista B si está activa
  if (_trackerCurrentView === 'historial') _trackerHistDayRender();
}

// ── END R-202604-078 Entrega 1 ──────────────────────────────────────────

// ── R-202604-078 Entrega 2: Vista Historial — col 1 agrupada por día ───

function _trackerHistDayRender() {
  const bodyEl = document.getElementById('tvh-hist-col1-body');
  if (!bodyEl) return;

  const periodSel = document.getElementById('tvh-hist-period');
  const days = periodSel ? parseInt(periodSel.value, 10) : 7;

  let allSessions = (typeof getAllSessions === 'function') ? getAllSessions() : [];

  // filtro por proyecto (sincronizado con tvh-proj-select)
  if (_trackerViewProjFilter) {
    allSessions = allSessions.filter(s => s.projectId === _trackerViewProjFilter);
  }

  // filtro por período
  if (days > 0) {
    const cutoff = Date.now() - days * 86400000;
    allSessions = allSessions.filter(s => {
      const ts = s.updatedAt || s.createdAt || 0;
      return ts >= cutoff;
    });
  }

  // más reciente primero
  const sorted = [...allSessions].sort((a, b) => {
    const ta = a.updatedAt || a.createdAt || 0;
    const tb = b.updatedAt || b.createdAt || 0;
    return tb - ta;
  });

  if (!sorted.length) {
    bodyEl.innerHTML = `<div class="tvh-hist-empty"><span class="tvh-hist-empty-icon">📋</span><span>Sin sesiones en este período</span></div>`;
    return;
  }

  // Agrupar por fecha YYYY-MM-DD
  const groups = [];
  const groupMap = {};
  sorted.forEach(s => {
    const ts = s.updatedAt || s.createdAt || 0;
    const dateKey = ts ? new Date(ts).toISOString().slice(0, 10) : 'sin-fecha';
    if (!groupMap[dateKey]) {
      groupMap[dateKey] = [];
      groups.push(dateKey);
    }
    groupMap[dateKey].push(s);
  });

  const today    = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  bodyEl.innerHTML = groups.map(dateKey => {
    let dayLabel = dateKey;
    if (dateKey === today)     dayLabel = 'Hoy';
    else if (dateKey === yesterday) dayLabel = 'Ayer';
    else {
      // format as "lun 28 abr"
      try {
        const d = new Date(dateKey + 'T12:00:00');
        dayLabel = d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
      } catch(_) { dayLabel = dateKey; }
    }

    const rows = groupMap[dateKey].map(s => {
      const ai = (state.ais || []).find(a => a.id === s.aiId);
      const aiName = ai ? esc(ai.name) : '—';
      const isActive = s.id === _trackerHistSelectedSessId;
      // R-202605-162: timestamp relativo bajo el título — usa helper compartido
      const tsLabel = _sessRelTsShared(s);
      const tsHtml = tsLabel ? `<span class="tvh-hist-day-row-ts">${esc(tsLabel)}</span>` : '';
      return `<div class="tvh-hist-day-row${isActive ? ' active' : ''}"
          data-sess-id="${s.id}"
          data-ai-id="${s.aiId}"
          onclick="_trackerHistDaySelect('${s.id}','${s.aiId}')">
        <span class="tvh-hist-day-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <span class="tvh-hist-day-row-ai">${aiName}</span>
        ${tsHtml}
      </div>`;
    }).join('');

    return `<div class="tvh-hist-day-group">
      <div class="tvh-hist-day-label">${dayLabel}<span class="tvh-hist-day-count">${groupMap[dateKey].length}</span></div>
      <div class="tvh-hist-day-rows">${rows}</div>
    </div>`;
  }).join('');
}

// Seleccionar sesión desde col 1 Vista B
function _trackerHistDaySelect(sessId, aiId) {
  _trackerHistSelectedSessId = sessId;

  // actualizar estado activo en col 1
  document.querySelectorAll('.tvh-hist-day-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // actualizar estado activo en col 2 (hist panel)
  document.querySelectorAll('.tracker-hist-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // col 2 en Vista B: mostrar preview de sesión via openDetail si disponible
  if (typeof openDetail === 'function') {
    openDetail(aiId, sessId);
  }

  // mobile: navegar a col 2
  if (window.innerWidth < 600 && typeof _trackerSwitchCol === 'function') {
    _trackerSwitchCol('hist');
  }
}

// ── END R-202604-078 Entrega 2 ──────────────────────────────────────────

// ── R-202605-162: Helper compartido — timestamp relativo para filas de sesión ─
// Usado por _trackerRenderMiniHist, _trackerHistDayRender y _buildLogRow
// Formato: mismo día → 'Hoy · HH:MM' | ayer → 'Ayer · HH:MM' |
//          2–6 días → 'Hace N días' | 7–13 días → 'Hace 1 semana' |
//          14–29 días → 'Hace N semanas' | 30+ días → 'DD mmm'
function _sessRelTsShared(s) {
  const ts = s.updatedAt || s.createdAt || 0;
  if (!ts) return (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '');
  const diffMs = Date.now() - ts;
  const diffD  = Math.floor(diffMs / 86400000);
  const todayKey = new Date().toISOString().slice(0, 10);
  const dateKey  = new Date(ts).toISOString().slice(0, 10);
  try {
    const hhmm = new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (dateKey === todayKey)      return `Hoy · ${hhmm}`;
    if (diffD === 1)               return `Ayer · ${hhmm}`;
  } catch(_) { /* fallthrough */ }
  if (diffD >= 2  && diffD <= 6)  return `Hace ${diffD} días`;
  if (diffD >= 7  && diffD <= 13) return 'Hace 1 semana';
  if (diffD >= 14 && diffD <= 29) return `Hace ${Math.floor(diffD / 7)} semanas`;
  try {
    return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  } catch(_) {
    return (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '');
  }
}

// Helper: hora fija por grupo — mini historial
// hoy   → 'HH:MM'
// ayer  → 'HH:MM'  (sección ya dice "Ayer")
// semana→ 'lun · HH:MM'
// anteriores → '10 may'
function _sessFixedTs(s, group) {
  const ts = s.updatedAt || s.createdAt || 0;
  if (!ts) return (s.dateShort || '');
  try {
    if (group === 'hoy' || group === 'ayer') {
      return new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (group === 'semana') {
      const dow  = new Date(ts).toLocaleDateString('es', { weekday: 'short' });
      const hhmm = new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${dow} · ${hhmm}`;
    }
    return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  } catch(_) {
    return (s.dateShort || '');
  }
}

// Helper: timestamp relativo dinámico para card sesión en curso
// 'ahora' · 'hace 1 minuto' · 'hace 3 horas' · 'hace 1 día'
function _cscardRelTs(ts) {
  if (!ts) return '';
  const diffMs  = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`;
  if (diffH   < 24) return `hace ${diffH} hora${diffH !== 1 ? 's' : ''}`;
  return `hace ${diffD} día${diffD !== 1 ? 's' : ''}`;
}
// ── END R-202605-162 helper ──────────────────────────────────────────────

// ── R-202604-078 Fase 2: Mini-historial de IA en Col2 (modo Por IA) ─────

// Render Col2 en modo Por IA: lista de sesiones de la IA seleccionada
function _trackerRenderMiniHist(aiId) {
  const panelEl  = document.getElementById('tracker-mini-hist-panel');
  const listEl   = document.getElementById('tracker-mini-hist-list');
  const titleEl  = document.getElementById('tracker-mini-hist-title');
  const countEl  = document.getElementById('tracker-mini-hist-count');
  const emptyEl  = document.getElementById('tracker-mini-hist-empty');
  if (!listEl) return;

  if (!aiId) {
    // T-202605-470: sin IA — título neutral
    if (titleEl) titleEl.textContent = 'Sesiones';
    if (countEl) { countEl.textContent = ''; countEl.classList.add('is-hidden'); }
    const lastMetaEl = document.getElementById('tracker-mini-hist-last');
    if (lastMetaEl) lastMetaEl.textContent = '';
    listEl.innerHTML = '<div class="tracker-mini-hist-empty"><span class="tracker-mini-hist-empty-icon">📋</span><span>Selecciona una IA</span></div>';
    return;
  }

  const allSessions = typeof getAllSessions === 'function' ? getAllSessions() : [];
  const aiSessions  = allSessions.filter(s => s.aiId === aiId);

  // R-202605-116 AC: excluir sesión en curso del mini historial
  const currentSess = (typeof _getCurrentSession === 'function') ? _getCurrentSession(aiId) : null;
  const pastSessions = currentSess
    ? aiSessions.filter(s => s.id !== currentSess.id)
    : aiSessions;

  // R-202605-116 AC: filtro de proyecto — usa selector global del tracker view
  const projFilter = _trackerViewProjFilter;
  const filtered = projFilter
    ? pastSessions.filter(s => s.projectId === projFilter)
    : pastSessions;

  // más reciente primero
  const sorted = [...filtered].reverse();

  // T-202605-470: header muestra conteo + último acceso — el nombre de la IA ya es visible en col 1
  const totalCount = aiSessions.length;
  if (titleEl) {
    titleEl.textContent = `${totalCount} sesión${totalCount !== 1 ? 'es' : ''}`;
  }
  const lastMetaEl = document.getElementById('tracker-mini-hist-last');
  if (lastMetaEl) {
    const lastSess = aiSessions.length ? aiSessions[aiSessions.length - 1] : null;
    lastMetaEl.textContent = lastSess
      ? ('Último: ' + ((typeof relDate === 'function' && lastSess.date) ? relDate(lastSess.date) : (lastSess.dateShort || lastSess.date || '')))
      : '';
  }

  if (countEl) {
    // Mostrar filtered count solo cuando hay filtro de proyecto activo
    if (projFilter && sorted.length !== totalCount) {
      countEl.textContent = sorted.length + ' filtradas';
      countEl.classList.remove('is-hidden');
    } else {
      countEl.textContent = '';
      countEl.classList.add('is-hidden');
    }
  }

  if (!sorted.length) {
    // T-202605-473: mensajes diferenciados — filtro activo vs sin sesiones reales
    const emptyMsg = projFilter
      ? 'Sin sesiones para este filtro'
      : (aiSessions.length === 0 ? 'Esta IA no tiene sesiones registradas' : 'Sin sesiones');
    listEl.innerHTML = `<div class="tracker-mini-hist-empty"><span class="tracker-mini-hist-empty-icon">📋</span><span>${emptyMsg}</span></div>`;
    return;
  }

  const projTracker = typeof getActiveTracker === 'function' ? getActiveTracker() : { items: [] };

  // R-202605-162: usa helper compartido — _sessRelTsShared definida antes de esta función
  const _sessRelTs = _sessRelTsShared;

  // Agrupar en Hoy / Ayer / Últimos 7 días / Anteriores
  const _nowMs = Date.now();
  const _localDateKey = (d) => {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const _todayKey  = _localDateKey(new Date());
  const _ydDate    = new Date(); _ydDate.setDate(_ydDate.getDate() - 1);
  const _yesterKey = _localDateKey(_ydDate);
  const _7dAgo     = _nowMs - 7 * 86400000;
  const _sessGroup = (s) => {
    const ts = s.updatedAt || s.createdAt || 0;
    if (!ts) return 'anteriores';
    const dateKey = _localDateKey(new Date(ts));
    if (dateKey === _todayKey)  return 'hoy';
    if (dateKey === _yesterKey) return 'ayer';
    if (ts >= _7dAgo)           return 'semana';
    return 'anteriores';
  };
  const _groupLabel = { hoy: 'Hoy', ayer: 'Ayer', semana: 'Últimos 7 días', anteriores: 'Anteriores' };
  const _groupOrder = ['hoy', 'ayer', 'semana', 'anteriores'];

  const _grouped = { hoy: [], ayer: [], semana: [], anteriores: [] };
  sorted.forEach(s => _grouped[_sessGroup(s)].push(s));

  // sesión en curso — para marcar in-progress
  const _inProgressSess = (typeof _getCurrentSession === 'function') ? _getCurrentSession(aiId) : null;

  const _renderRow = (s, group) => {
    const proj     = s.projectId ? (typeof getProjectById === 'function' ? getProjectById(s.projectId) : null) : null;
    const isActive = s.id === _trackerHistSelectedSessId;
    const isInProg = _inProgressSess && s.id === _inProgressSess.id;

    // badge de ítems vinculados
    const linkedItems = projTracker.items.filter(x => x.sessionId === s.id);
    const badgeHtml = linkedItems.length
      ? `<span class="sess-items-badge">${linkedItems.length}</span>`
      : '';

    // pill de proyecto
    const projPill = proj
      ? `<span class="sess-proj-pill">${esc(proj.name || proj.icon || '📁')}</span>`
      : '';

    // hora fija por grupo — no relativa
    const fixedTs  = _sessFixedTs(s, group);
    const tsHtml   = fixedTs ? `<span class="sess-timestamp">${fixedTs}</span>` : '';

    // separador meta (·) solo si hay proyecto Y hay timestamp
    const metaSep = (proj && fixedTs) ? `<span class="sess-meta-sep">·</span>` : '';

    // indicadores secundarios
    const starInd   = s.starred  ? `<span class="tracker-mini-hist-ind" title="Destacada">⭐</span>` : '';
    const reviewInd = s.inReview ? `<span class="tracker-mini-hist-ind" title="En revisión">🔍</span>` : '';

    const rowCls = [
      'tracker-mini-hist-row',
      'sess-row',
      isActive  ? 'active'               : '',
      isInProg  ? 'sess-row--in-progress' : ''
    ].filter(Boolean).join(' ');

    return `<div class="${rowCls}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        onclick="_trackerMiniHistSelect('${s.id}','${s.aiId}')">
      <div class="sess-row-top">
        <span class="sess-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        ${badgeHtml}
      </div>
      <div class="sess-row-bottom">
        ${projPill}${metaSep}${tsHtml}
        ${starInd}${reviewInd}
      </div>
    </div>`;
  };

  listEl.innerHTML = _groupOrder
    .filter(g => _grouped[g].length > 0)
    .map(g =>
      `<div class="sess-group-sep">${_groupLabel[g]}</div>` +
      _grouped[g].map(s => _renderRow(s, g)).join('')
    ).join('');

  // Auto-seleccionar la sesión más reciente si no hay ninguna seleccionada —
  // Col3 nunca queda vacío al cambiar de IA
  const latestSess = sorted[0];
  if (latestSess && !_trackerHistSelectedSessId) {
    _trackerHistSelectedSessId = latestSess.id;
    const firstRow = listEl.querySelector('.tracker-mini-hist-row');
    if (firstRow) firstRow.classList.add('active');
    if (typeof openDetail === 'function') openDetail(latestSess.aiId, latestSess.id);
  }

  // T-202605-471: scroll al row activo para que siempre quede visible
  requestAnimationFrame(() => {
    const activeRow = listEl.querySelector('.tracker-mini-hist-row.active');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

// Seleccionar sesión desde mini-hist (Col2 modo Por IA) → Col3 preview
function _trackerMiniHistSelect(sessId, aiId) {
  _trackerHistSelectedSessId = sessId;

  // resaltar en Col2
  document.querySelectorAll('.tracker-mini-hist-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // Col3: preview de sesión via openDetail
  if (typeof openDetail === 'function') {
    openDetail(aiId, sessId);
  }

  // mobile: navegar a col 3
  if (window.innerWidth < 900 && typeof _trackerSwitchCol === 'function') {
    _trackerSwitchCol('items');
  }
}

// ── END R-202604-078 Fase 2 ──────────────────────────────────────────────

// ── R-202605-116: Card sesión en curso — col 1, debajo del card IA ──────

function _getCurrentSession(aiId) {
  const allSess = (typeof getAllSessions === 'function') ? getAllSessions() : [];
  const aiSess  = allSess.filter(s => s.aiId === aiId);
  if (!aiSess.length) return null;
  const last = aiSess.reduce((a, b) =>
    (parseInt(b.id) || 0) > (parseInt(a.id) || 0) ? b : a
  );
  if (last && !last.resetAt && !last.quickCapture) return last;
  return null;
}

function _buildCurrentSessionCard(aiId) {
  const currentSess = _getCurrentSession(aiId);
  if (!currentSess) return null;

  const allSess   = (typeof getAllSessions === 'function') ? getAllSessions() : [];
  const aiSess    = allSess.filter(s => s.aiId === aiId);
  const sessIndex = aiSess.findIndex(s => s.id === currentSess.id);

  const continuousSess = [];
  for (let i = sessIndex; i >= 0; i--) {
    const s = aiSess[i];
    if (s.quickCapture) break;
    if (s.resetAt && i < sessIndex) break;
    continuousSess.push(s);
  }
  const shown = continuousSess.slice(0, 3);
  const total = continuousSess.length;

  const dateLabel = (typeof relDate === 'function' && currentSess.date)
    ? relDate(currentSess.date)
    : (currentSess.dateShort || '');

  const sessionRows = shown.map((s, idx) => {
    const isLatest = idx === 0;
    const summaryHtml = isLatest && s.summary
      ? `<div class="cscard-row-summary">${esc(s.summary.slice(0, 160))}${s.summary.length > 160 ? '…' : ''}</div>`
      : '';
    const refPills = (s.trackerRefs || []).slice(0, 4).map(code => {
      const t = (code[0] || '').toUpperCase();
      return `<span class="cscard-ref-pill cscard-ref-pill--${t.toLowerCase()}">${esc(code)}</span>`;
    }).join('');
    const latestCls = isLatest ? ' cscard-row--latest' : '';
    return `<div class="cscard-row${latestCls}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        onclick="_trackerMiniHistSelect('${s.id}','${s.aiId}')">
      <div class="cscard-row-top">
        <span class="cscard-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <span class="cscard-row-date">${isLatest ? dateLabel : ''}</span>
      </div>
      ${summaryHtml}
      ${refPills ? `<div class="cscard-row-refs">${refPills}</div>` : ''}
    </div>`;
  }).join('');

  const moreHtml = total > 3
    ? `<div class="cscard-more">+ ${total - 3} checkpoint${total - 3 !== 1 ? 's' : ''} anteriores</div>`
    : '';

  const el = document.createElement('div');
  el.className = 'current-session-card';
  el.id = 'current-session-card-' + aiId;
  const _cscardTs = currentSess.updatedAt || currentSess.createdAt || 0;
  const _cscardInitLabel = _cscardTs ? _cscardRelTs(_cscardTs) : '';
  el.innerHTML = `
    <div class="cscard-header">
      <span class="cscard-dot"></span>
      <span class="cscard-label">Sesión en curso</span>
      <span class="cscard-timer" id="cscard-timer-${aiId}" data-ai-id="${aiId}" data-ts="${_cscardTs}">${_cscardInitLabel}</span>
    </div>
    <div class="cscard-rows">
      ${sessionRows}
      ${moreHtml}
    </div>`;

  return el;
}

// ── END R-202605-116 ─────────────────────────────────────────────────────

function selectTrackerAI(aiId) {
  // DUP-05: cerrar preview de sesión al cambiar de Worker
  if (typeof closePopup === 'function') closePopup();
  // T-202604-373: skeleton rows en historial al cambiar de IA
  const _prevCard = _trackerSelectedId ? document.getElementById('card-' + _trackerSelectedId) : null;
  if (_prevCard) {
    const _prevList = _prevCard.querySelector('.sess-list');
    if (_prevList) {
      _prevList.innerHTML = '<div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div>';
    }
  }
  // Fase 2: resetear sesión seleccionada al cambiar de IA — mini-hist auto-selecciona la más reciente
  if (_trackerSelectedId !== aiId) _trackerHistSelectedSessId = null;
  _trackerSelectedId = aiId;
  if (typeof closeLogCard === 'function') closeLogCard();
  // R-202604-061 AC-5: try-catch defensivo — skeleton siempre se limpia
  try {
    render();
    // R-202604-061 AC-06: fade-in del panel de detalle al cambiar selección
    requestAnimationFrame(() => {
      const _newCard = document.getElementById('card-' + aiId);
      if (_newCard) {
        _newCard.classList.remove('detail-fade-in');
        void _newCard.offsetWidth; // force reflow
        _newCard.classList.add('detail-fade-in');
      }
    });
  } catch(e) {
    // skeleton cleanup garantizado aunque render falle
    const _fallbackCard = _prevCard || (document.getElementById('card-' + aiId));
    if (_fallbackCard) {
      const _fl = _fallbackCard.querySelector('.sess-list');
      if (_fl && _fl.querySelector('.skel-row')) _fl.innerHTML = '';
    }
    console.error('render() error in selectTrackerAI:', e);
  }
  _scrollToCard(aiId);
  // T-202605-446: iniciar/retomar cronómetro al seleccionar IA
  startSessionTimer(aiId);
  // R-202605-167: actualizar segmento 3 del breadcrumb al cambiar Worker seleccionado
  if (typeof _updateHeaderProjectLabel === 'function') _updateHeaderProjectLabel();
  // focus textarea si disponible
  setTimeout(() => {
    const ta = document.getElementById('ta-' + aiId);
    if (ta) { ta.focus(); enterFocusMode(aiId); }
  }, 80);
}

function _renderTrackerSidebar() {
  const nonArchived = state.ais.filter(ai => !ai.archived);
  const inSession = nonArchived.filter(ai => ai.status !== 'exhausted' && !ai.interrupted && _isInSession(ai));
  const available = nonArchived.filter(ai => ai.status !== 'exhausted' && !_isInSession(ai));
  const exhausted = nonArchived.filter(ai => ai.status === 'exhausted');
  const archived  = state.ais.filter(ai => ai.archived);

  const mkRow = (ai, forceInSession = false) => {
    const sel = _trackerSelectedId === ai.id ? ' selected' : '';
    const dot = ai.status === 'exhausted' ? 'exhausted'
              : ai.interrupted            ? 'interrupted'
              : forceInSession            ? 'insession'
              : 'available';
    // countdown para agotadas
    let cd = '';
    if (ai.status === 'exhausted' && ai.resetTime) {
      const [hh, mm] = ai.resetTime.split(':').map(Number);
      const now = new Date();
      const reset = new Date(now); reset.setHours(hh, mm, 0, 0);
      if (reset <= now) reset.setDate(reset.getDate() + 1);
      const diff = Math.max(0, Math.round((reset - now) / 60000));
      const h = Math.floor(diff / 60), m = diff % 60;
      cd = `<span class="tsb-ai-cd">${h}h${String(m).padStart(2,'0')}</span>`;
    }
    // T-202604-206: info secundaria — N sesiones · hace X
    const _aiSess = getAISessions(ai.id);
    const _sessCount = _aiSess.length;
    const _lastSess = _aiSess.length ? _aiSess[_aiSess.length - 1] : null;
    const _lastDate = _lastSess ? (_lastSess.date || _lastSess.dateShort || '') : '';
    const _rel = _lastDate && typeof relDate === 'function' ? relDate(_lastDate) : '';
    const _meta = _sessCount
      ? `<span class="tsb-ai-meta">${_sessCount} ses${_rel ? ' · ' + _rel : ''}</span>`
      : '';
    return `<div class="tsb-ai-row${sel}" onclick="selectTrackerAI('${ai.id}')" id="tsb-row-${ai.id}">
      <span class="tsb-ai-dot ${dot}"></span>
      <span class="tsb-ai-name">${esc(ai.name)}</span>
      ${_meta}
      ${cd}
    </div>`;
  };

  const isEl = document.getElementById('tsb-insession');
  const avEl = document.getElementById('tsb-available');
  const exEl = document.getElementById('tsb-exhausted');
  if (!avEl || !exEl) return;

  if (!state.ais.length) {
    if (isEl) isEl.innerHTML = '';
    avEl.innerHTML = `<div class="tsb-empty-hint">Sin IAs</div>`;
    exEl.innerHTML = '';
    return;
  }

  // En curso — ocultar sección si vacía
  if (isEl) {
    const isSection = isEl.closest('.tracker-sidebar-section');
    if (inSession.length) {
      isEl.innerHTML = inSession.map(ai => mkRow(ai, true)).join('');
      if (isSection) isSection.classList.remove('is-hidden');
    } else {
      isEl.innerHTML = '';
      if (isSection) isSection.classList.add('is-hidden');
    }
  }

  avEl.innerHTML = available.length
    ? available.map(ai => mkRow(ai)).join('')
    : `<div class="tsb-empty-hint">—</div>`;

  let exHtml = exhausted.map(ai => mkRow(ai)).join('');
  if (archived.length) {
    const isOpen = localStorage.getItem('archived-open') === '1';
    exHtml += `<div class="tsb-archived-toggle" onclick="this.classList.toggle('open');localStorage.setItem('archived-open',this.classList.contains('open')?'1':'0');_renderTrackerSidebar()">
      ${isOpen ? '▼' : '▶'} Archivadas (${archived.length})</div>`;
    if (isOpen) exHtml += archived.map(ai => mkRow(ai)).join('');
  }
  exEl.innerHTML = exHtml || `<div class="tsb-empty-hint">—</div>`;

  // arrancar ticker dinámico si hay agotadas con resetTime
  if (exhausted.some(ai => ai.resetTime)) _startSidebarTicker();
  else _stopSidebarTicker();
}

// ══════════════════════════════════════════════════════════════════════════════
// S-17: T-202605-446 · Cronómetro de sesión — card IA activa
// ══════════════════════════════════════════════════════════════════════════════

const _TIMER_KEY_PREFIX = 'ai-tracker-session-timer-';
let _timerIntervalId = null;

function _timerKey(aiId) { return _TIMER_KEY_PREFIX + aiId; }

function _getTimerData(aiId) {
  try {
    const raw = localStorage.getItem(_timerKey(aiId));
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function _setTimerData(aiId, data) {
  try { localStorage.setItem(_timerKey(aiId), JSON.stringify(data)); } catch(e) {}
}

function _clearTimerData(aiId) {
  try { localStorage.removeItem(_timerKey(aiId)); } catch(e) {}
}

function _timerIsActive(aiId) {
  const d = _getTimerData(aiId);
  return !!(d && d.running);
}

// Llamado al guardar sesión — detiene cronómetro y retorna tiempo total en ms
function stopSessionTimer(aiId) {
  const d = _getTimerData(aiId);
  if (!d) return 0;
  const elapsed = d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0);
  _setTimerData(aiId, { running: false, elapsed, startEpoch: null });
  _refreshTimerTick();
  _renderActiveWorkerChip();
  return elapsed;
}

// Llamado al abrir/seleccionar una IA — inicia o retoma cronómetro
function startSessionTimer(aiId) {
  const existing = _getTimerData(aiId);
  if (existing && existing.running) return; // ya corriendo
  const elapsed = existing ? existing.elapsed : 0;
  _setTimerData(aiId, { running: true, elapsed, startEpoch: Date.now() });
  _refreshTimerTick();
}

function _formatTimer(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function _renderTimerInCard(aiId) {
  const timerEl = document.getElementById('session-timer-' + aiId);
  const dotEl   = document.getElementById('session-timer-dot-' + aiId);
  if (!timerEl || !dotEl) return;
  const d = _getTimerData(aiId);
  if (!d) { timerEl.textContent = '00:00:00'; dotEl.className = 'session-timer-dot session-timer-dot--paused'; return; }
  const elapsed = d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0);
  timerEl.textContent = _formatTimer(elapsed);
  dotEl.className = 'session-timer-dot' + (d.running ? ' session-timer-dot--active' : ' session-timer-dot--paused');
  // Actualizar título de sesión activa en tiempo real
  const titleEl = document.getElementById('rsb-session-title-' + aiId);
  if (titleEl) {
    const ai = state.ais && state.ais.find(a => a.id === aiId);
    if (ai) {
      const sessions = getAISessions(aiId);
      const last = sessions.length ? sessions[sessions.length - 1] : null;
      const t = (last && last.title) ? last.title : '';
      titleEl.textContent = t.length > 28 ? t.substring(0, 28) + '\u2026' : t;
    }
  }
}

function _refreshTimerTick() {
  clearInterval(_timerIntervalId);
  _timerIntervalId = setInterval(() => {
    state.ais.forEach(ai => _renderTimerInCard(ai.id));
    _renderActiveWorkerChip();
    // Actualizar timestamps relativos en cards de sesión en curso
    document.querySelectorAll('.cscard-timer[data-ts]').forEach(el => {
      const ts = parseInt(el.dataset.ts, 10);
      if (ts) el.textContent = _cscardRelTs(ts);
    });
  }, 60000);
  // Actualización inmediata al arrancar el tick
  state.ais.forEach(ai => _renderTimerInCard(ai.id));
  _renderActiveWorkerChip();
  document.querySelectorAll('.cscard-timer[data-ts]').forEach(el => {
    const ts = parseInt(el.dataset.ts, 10);
    if (ts) el.textContent = _cscardRelTs(ts);
  });
}

// HTML del widget cronómetro — insertado en buildCard()
function _timerWidgetHtml(aiId) {
  const d = _getTimerData(aiId);
  const elapsed = d ? d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0) : 0;
  const dotCls = (d && d.running) ? 'session-timer-dot--active' : 'session-timer-dot--paused';
  return `<div class="session-timer-wrap">` +
    `<span class="session-timer-dot ${dotCls}" id="session-timer-dot-${aiId}"></span>` +
    `<span class="session-timer-display" id="session-timer-${aiId}">${_formatTimer(elapsed)}</span>` +
    `</div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// R-202605-170: Worker activo chip — nombre y cronómetro en header
// ══════════════════════════════════════════════════════════════════════════════

function _renderActiveWorkerChip() {
  const chip = document.getElementById('header-active-worker');
  if (!chip) return;

  // Buscar el Worker con timer activo — si hay más de uno, el de mayor elapsed
  let best = null;
  let bestElapsed = -1;
  (state.ais || []).forEach(ai => {
    const d = _getTimerData(ai.id);
    if (!d || !d.running) return;
    const elapsed = d.elapsed + (Date.now() - d.startEpoch);
    if (elapsed > bestElapsed) { best = ai; bestElapsed = elapsed; }
  });

  if (!best) {
    chip.classList.add('is-hidden');
    return;
  }

  const h = Math.floor(bestElapsed / 3600000);
  const m = Math.floor((bestElapsed % 3600000) / 60000);
  const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

  chip.querySelector('.hwc-name').textContent = best.name || best.id;
  chip.querySelector('.hwc-time').textContent = timeStr;
  chip.dataset.hwcAiId = best.id;
  chip.classList.remove('is-hidden');
}

function _hwcClick() {
  const chip = document.getElementById('header-active-worker');
  const aiId = chip && chip.dataset.hwcAiId;
  if (!aiId) return;
  if (typeof selectTrackerAI === 'function') selectTrackerAI(aiId);
  if (typeof switchTab === 'function' && document.querySelector('.tab-btn.active')?.dataset.tab !== 'tracker') {
    switchTab('tracker');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// S-17: T-202605-447 · Sesión sugerida — banner de arranque
// ══════════════════════════════════════════════════════════════════════════════

function _computeSuggestionScore(ai) {
  // Peso 40%: días desde última sesión (más días = más urgente)
  const allSess = getAISessions(ai.id);
  let daysSinceScore = 0;
  if (allSess.length) {
    const lastSess = allSess.reduce((a, b) => {
      const ta = new Date(a.date || 0).getTime();
      const tb = new Date(b.date || 0).getTime();
      return ta > tb ? a : b;
    });
    const daysSince = (Date.now() - new Date(lastSess.date || 0).getTime()) / 86400000;
    daysSinceScore = Math.min(daysSince / 7, 1); // normalizado a 7 días
  } else {
    daysSinceScore = 1; // nunca usado = máxima urgencia
  }

  // Peso 40%: ítems high pendientes asignados a esta IA
  const aiSigla = ai.role || '';
  const highPending = (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(i =>
    i.status === 'pendiente' && i.priority === 'high' &&
    aiSigla && i.role && i.role.includes(aiSigla)
  ).length;
  const highScore = Math.min(highPending / 5, 1); // normalizado a 5 ítems

  // Peso 20%: cadencia histórica (ratio sesiones últimas 2 semanas)
  const recentSess = allSess.filter(s => {
    return (Date.now() - new Date(s.date || 0).getTime()) < 14 * 86400000;
  }).length;
  const cadenceScore = recentSess > 0 ? 0 : 1; // sin actividad reciente = más urgente

  return (daysSinceScore * 0.4) + (highScore * 0.4) + (cadenceScore * 0.2);
}

function _getSuggestedAI() {
  const active = (state.ais || []).filter(ai => !ai.archived);
  if (!active.length) return null;
  // Desempate: gana el que tiene más ítems high pendientes
  return active.reduce((best, ai) => {
    const scoreAI   = _computeSuggestionScore(ai);
    const scoreBest = _computeSuggestionScore(best);
    if (scoreAI > scoreBest) return ai;
    if (scoreAI === scoreBest) {
      const aiHigh   = _highPendingCount(ai);
      const bestHigh = _highPendingCount(best);
      return aiHigh >= bestHigh ? ai : best;
    }
    return best;
  });
}

function _highPendingCount(ai) {
  const aiSigla = ai.role || '';
  return (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(i =>
    i.status === 'pendiente' && i.priority === 'high' &&
    aiSigla && i.role && i.role.includes(aiSigla)
  ).length;
}

function _buildSuggestionReason(ai) {
  const allSess = getAISessions(ai.id);
  const parts = [];
  if (allSess.length) {
    const lastSess = allSess.reduce((a, b) =>
      new Date(a.date||0) > new Date(b.date||0) ? a : b
    );
    const days = Math.floor((Date.now() - new Date(lastSess.date||0).getTime()) / 86400000);
    if (days >= 1) parts.push(`llevas ${days} día${days !== 1 ? 's' : ''} sin sesión con ${ai.name}`);
  } else {
    parts.push(`nunca has tenido una sesión con ${ai.name}`);
  }
  const high = _highPendingCount(ai);
  if (high > 0) parts.push(`${high} ítem${high !== 1 ? 's' : ''} high pendiente${high !== 1 ? 's' : ''}`);
  return parts.join(' · ');
}

function renderSuggestionBanner() {
  // B-258: banner global eliminado — información equivalente inline en buildCard()
  const banner = document.getElementById('session-suggestion-banner');
  if (banner) banner.classList.add('suggestion-banner--hidden');
}

function dismissSuggestionBanner() {
  const banner = document.getElementById('session-suggestion-banner');
  if (banner) banner.classList.add('suggestion-banner--hidden');
}

function startSuggestedSession(aiId) {
  dismissSuggestionBanner();
  // Seleccionar la IA sugerida
  if (typeof _trackerSelectAI === 'function') _trackerSelectAI(aiId);
  else if (typeof _trackerSelectedId !== 'undefined') {
    _trackerSelectedId = aiId;
    render();
  }
  startSessionTimer(aiId);
}

// ══════════════════════════════════════════════════════════════════════════════
// S-17: T-202605-448 · Resumen semanal automático — panel lunes
// ══════════════════════════════════════════════════════════════════════════════

const _WEEKLY_KEY = 'ai-tracker-weekly-dismissed';

function _isMonday() { return new Date().getDay() === 1; }

function _getMondayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function _weeklyAlreadyDismissed() {
  try {
    const raw = localStorage.getItem(_WEEKLY_KEY);
    return raw === _getMondayKey();
  } catch(e) { return false; }
}

function _markWeeklyDismissed() {
  try { localStorage.setItem(_WEEKLY_KEY, _getMondayKey()); } catch(e) {}
}

function _buildWeeklySummary() {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 86400000;
  const twoWeeksAgo = now - 14 * 86400000;

  // Sesiones de la semana anterior (entre hace 14 días y hace 7 días)
  const allSessions = (state.projects || []).flatMap(p => (p.sessions || []));
  const lastWeekSess = allSessions.filter(s => {
    const ts = new Date(s.date || 0).getTime();
    return ts >= twoWeeksAgo && ts < oneWeekAgo;
  });

  if (!lastWeekSess.length) return null; // sin actividad — no mostrar

  const totalSessions = lastWeekSess.length;

  // Ítems cerrados (done en esa semana)
  const allItems = typeof ITEMS !== 'undefined' ? ITEMS : [];
  const doneLast = allItems.filter(i => i.status === 'done').length;
  const pendingNow = allItems.filter(i => i.status === 'pendiente').length;

  // IAs más activas
  const aiCounts = {};
  lastWeekSess.forEach(s => {
    const ai = getAI(s.aiId);
    const name = ai ? ai.name : s.aiId;
    aiCounts[name] = (aiCounts[name] || 0) + 1;
  });
  const topAIs = Object.entries(aiCounts).sort((a,b)=>b[1]-a[1]).slice(0,3)
    .map(([n,c]) => `${n} (${c})`).join(', ');

  // Sprint progress
  let sprintProgress = '—';
  try {
    const proj = getActiveProject() || (state.projects && state.projects[0]);
    const sp = proj && proj.sprints ? proj.sprints.find(s => s.status === 'active') : null;
    if (sp) {
      const spItems = allItems.filter(i => i.sprint === sp.id);
      const spDone = spItems.filter(i => i.status === 'done').length;
      const spTotal = spItems.length;
      const spPct = spTotal > 0 ? Math.round((spDone/spTotal)*100) : 0;
      sprintProgress = `${sp.label || sp.id} · ${spDone}/${spTotal} (${spPct}%)`;
    }
  } catch(e) {}

  return { totalSessions, doneLast, pendingNow, topAIs, sprintProgress };
}

function _exportWeeklySummaryMd() {
  const s = _buildWeeklySummary();
  if (!s) return;
  const lines = [
    '# Resumen semanal — Locus',
    `**Fecha:** ${new Date().toLocaleDateString('es-MX', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}`,
    '',
    `- **Sesiones registradas:** ${s.totalSessions}`,
    `- **Ítems cerrados:** ${s.doneLast}`,
    `- **Ítems abiertos:** ${s.pendingNow}`,
    `- **IAs más activas:** ${s.topAIs || '—'}`,
    `- **Sprint progress:** ${s.sprintProgress}`,
  ];
  const blob = new Blob([lines.join('\n')], {type:'text/markdown'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'resumen-semanal.md'; a.click();
  URL.revokeObjectURL(url);
}

function dismissWeeklySummary() {
  _markWeeklyDismissed();
  const modal = document.getElementById('weekly-summary-modal');
  if (modal) modal.classList.add('weekly-modal--hidden');
}

function _maybeShowWeeklySummary() {
  if (!_isMonday()) return;
  if (_weeklyAlreadyDismissed()) return;
  const summary = _buildWeeklySummary();
  if (!summary) return;

  // Poblar contenido
  const el = id => document.getElementById(id);
  if (el('wsum-sessions')) el('wsum-sessions').textContent = summary.totalSessions;
  if (el('wsum-done'))     el('wsum-done').textContent     = summary.doneLast;
  if (el('wsum-pending'))  el('wsum-pending').textContent  = summary.pendingNow;
  if (el('wsum-ais'))      el('wsum-ais').textContent      = summary.topAIs || '—';
  if (el('wsum-sprint'))   el('wsum-sprint').textContent   = summary.sprintProgress;

  const modal = document.getElementById('weekly-summary-modal');
  if (modal) modal.classList.remove('weekly-modal--hidden');
}

function render() {
  const grid = document.getElementById('grid');
  const emptyEl = document.getElementById('tracker-detail-empty');

  _renderTrackerSidebar();

  if (!state.ais.length) {
    if (grid) grid.innerHTML = '';
    // R-202605-178 AC: sin workers — único CTA
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); emptyEl.innerHTML = `
      <div class="empty-state-icon">🤖</div>
      <div class="empty-state-title">Agrega tu primer Worker</div>
      <div class="empty-state-hint">Los Workers son las IAs que usas. Empieza por crear uno para registrar tus sesiones.</div>
      <button class="empty-state-btn" onclick="openAddAI()">＋ Nuevo Worker</button>`; }
    updateStats(); renderStatusBar(); renderSetupChecklist(); return;
  }

  // R-202605-007 AC: con workers pero sin proyecto activo — solo CTA "Nuevo Proyecto"
  const _hasActiveProj = typeof getActiveProject === 'function' && !!getActiveProject();
  if (!_hasActiveProj && (state.projects || []).length === 0) {
    if (grid) grid.innerHTML = '';
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); emptyEl.innerHTML = `
      <div class="empty-state-icon">🗂</div>
      <div class="empty-state-title">Sin proyecto activo</div>
      <div class="empty-state-hint">Crea un proyecto para empezar a registrar sesiones y gestionar tu backlog.</div>
      <div class="es-cta-row">
        <button class="empty-state-btn" onclick="if(typeof openProjModal==='function')openProjModal(false)">＋ Nuevo Proyecto</button>
      </div>`; }
    updateStats(); renderStatusBar(); renderSetupChecklist(); return;
  }

  // auto-select: preferir disponible/en-sesión sobre agotada
  const allActive = state.ais.filter(ai => !ai.archived);
  if (!_trackerSelectedId || !state.ais.find(a => a.id === _trackerSelectedId)) {
    const preferred = allActive.find(a => a.status !== 'exhausted') || allActive[0];
    _trackerSelectedId = preferred ? preferred.id : null;
  }

  if (!_trackerSelectedId) {
    if (grid) grid.innerHTML = '';
    if (emptyEl) { emptyEl.classList.remove('is-hidden'); emptyEl.classList.add('visible'); }
    updateStats(); renderStatusBar(); renderSetupChecklist(); return;
  }

  if (emptyEl) emptyEl.classList.remove('visible');
  // B-202604-XXX: ocultar del flujo del DOM cuando hay IA seleccionada
  if (emptyEl) emptyEl.classList.add('is-hidden');

  // R-202604-060: aplicar color del proyecto activo como CSS custom property (CSS Purity — setProperty permitido)
  const _activeProjForColor = getActiveProject();
  if (_activeProjForColor && _activeProjForColor.color) {
    document.documentElement.style.setProperty('--proj-color', _activeProjForColor.color);
  } else {
    document.documentElement.style.removeProperty('--proj-color');
  }

  if (grid) {
    // R-110: sort IN-SESSION → DISPONIBLE → AGOTADA — sobre array, no manipula DOM
    const _sortOrder = (ai) => {
      if (ai.status !== 'exhausted' && _isInSession(ai)) return 0;
      if (ai.status !== 'exhausted') return 1;
      return 2;
    };
    const aisToRender = [...state.ais.filter(a => !a.archived)].sort((a, b) => _sortOrder(a) - _sortOrder(b));
    const ai = aisToRender.find(a => a.id === _trackerSelectedId) || state.ais.find(a => a.id === _trackerSelectedId);
    grid.innerHTML = '';
    if (ai) {
      const card = buildCard(ai);
      card.dataset.aiId = ai.id;
      grid.appendChild(card);
      // R-202604-061 AC-04: stagger reveal — una sola card en tracker, delay 0ms
      card.style.setProperty('--card-stagger-delay', '0ms');
      requestAnimationFrame(() => card.classList.add('stagger-in'));

      // R-202605-116: card sesión en curso — se inserta después del card IA
      const existingCsCard = document.getElementById('current-session-card-' + ai.id);
      if (existingCsCard) existingCsCard.remove();
      const csCard = (typeof _buildCurrentSessionCard === 'function')
        ? _buildCurrentSessionCard(ai.id)
        : null;
      if (csCard) {
        grid.appendChild(csCard);
        requestAnimationFrame(() => csCard.classList.add('cscard-visible'));
      }

      // archived section below card
      const archived = state.ais.filter(a => a.archived);
      if (archived.length) {
        const section = document.createElement('div');
        section.className = 'archived-section';
        const isOpen = localStorage.getItem('archived-open') === '1';
        section.innerHTML = `<button class="archived-toggle" onclick="toggleArchivedSection(this)">
          ${isOpen ? '▼' : '▶'} Archivadas (${archived.length})</button>
          <div class="archived-grid${isOpen ? ' open' : ''}" id="archived-grid"></div>`;
        grid.appendChild(section);
        const archGrid = section.querySelector('#archived-grid');
        archived.forEach(a => archGrid.appendChild(buildCard(a)));
      }
    }
  }

  updateStats();
  renderStatusBar();
  renderGlobalRadarSidebar();
  if (!window._radarSbInited) { window._radarSbInited = true; _initRadarSidebarState(); }
  renderProjDots();
  // R-202604-059: actualizar historial col 2 según modo activo + re-attach drop targets tras cada render
  if (_trackerCurrentView === 'poria') {
    if (typeof _trackerRenderMiniHist === 'function') _trackerRenderMiniHist(_trackerSelectedId);
  } else {
    if (typeof _trackerRenderHist === 'function') _trackerRenderHist();
  }
  if (typeof _trackerHistAttachDropTargets === 'function') _trackerHistAttachDropTargets();
  // T-202605-447: actualizar banner de sesión sugerida tras cada render
  renderSuggestionBanner();
  // R-202605-008: actualizar checklist de setup tras cada render
  renderSetupChecklist();
  // B-202605-508: actualizar badges de tabs al final de cada render
  updateTabNotifBadges();
  // R-202605-170: sincronizar chip de worker activo en header
  _renderActiveWorkerChip();
}

const TG_TYPE_NAMES = {I:'Idea', P:'Pendiente', T:'Ticket', R:'Requerimiento', B:'Bug'};

// T-202604-047: tiempo promedio entre sesiones consecutivas
function buildHoyCard(ai, idx = 0, opts = {}) {
  const isInterrupted = !!ai.interrupted;
  const isInSession   = !!opts.inSession;
  const statusClass = ai.status === 'exhausted' ? 'exhausted' : 'available';
  const cardClass = 'hoy-mini-card ' + statusClass + (isInterrupted ? ' interrupted-state' : '') + (isInSession ? ' in-session-state' : '');

  const aiSessions = getAISessions(ai.id);
  const checkpointTotal = aiSessions.length;
  const sessConHora = aiSessions.filter(s => s.resetAt && !s.quickCapture).length;
  const avgLabel2 = avgBetweenSessions(ai);
  const avgShort = avgLabel2 ? avgLabel2.replace(' entre sesiones','') : '—';

  const cd = ai.status === 'exhausted' ? getCD(ai.resetTime, ai.resetEpoch) : '';
  const resetLabel = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : '';

  // "disponible desde" — hora del último reset o última sesión
  function _availableSinceLabel() {
    if (ai.resetTime && ai.resetEpoch) {
      const epoch = new Date(ai.resetEpoch);
      const hh = String(epoch.getHours()).padStart(2,'0');
      const mm = String(epoch.getMinutes()).padStart(2,'0');
      return fmt12(`${hh}:${mm}`);
    }
    const last = aiSessions.length ? aiSessions[aiSessions.length - 1] : null;
    if (last && last.date) {
      const d = new Date(last.date);
      if (!isNaN(d)) {
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        return fmt12(`${hh}:${mm}`);
      }
    }
    return null;
  }

  const availSince = ai.status === 'available' ? _availableSinceLabel() : null;

  const statsBar = ai.status === 'exhausted'
    ? `<div class="hoy-mini-stats">
        <div class="hoy-mini-stat exhausted-cell">
          <div>
            <div class="hoy-exh-countdown">${cd || '--:--:--'}</div>
            <div class="hoy-exh-reset-label">${resetLabel || 'sin hora'}</div>
          </div>
        </div>
      </div>`
    : `<button class="hoy-mini-ckpt-full" onclick="event.stopPropagation();navigateToCard('${ai.id}')">
        + checkpoint
        <span class="hoy-mini-ckpt-since">${availSince ? `desde ${availSince}` : 'disponible'}</span>
      </button>`;

  // T-316: badge diferenciado — ámbar para interrupted, púrpura para in-session
  const statusBadge = isInterrupted
    ? `<div class="hoy-mini-actions"><span class="hoy-mini-badge hoy-mini-badge--interrupted">⚡ Interrumpida</span></div>`
    : isInSession
      ? `<div class="hoy-mini-actions"><span class="hoy-mini-badge hoy-mini-badge--insession">● En sesión</span></div>`
      : '';

  // T-316: pill de proyecto de la última sesión global (sin filtro de proyecto activo)
  const _lastSessGlobal = getAllSessions().filter(s => s.aiId === ai.id).slice(-1)[0] || null;
  const _lastProjGlobal = _lastSessGlobal ? getProjectById(_lastSessGlobal.projectId) : null;
  const projPill = _lastProjGlobal
    ? `<span class="hoy-mini-proj-pill" title="${esc(_lastProjGlobal.name)}">${esc(_lastProjGlobal.icon || '📁')} ${esc(_lastProjGlobal.name)}</span>`
    : '';

  // quick button only for available/interrupted, not exhausted
  const quickBtn = (ai.status !== 'exhausted')
    ? `<button class="btn-quick" onclick="event.stopPropagation();openQuickCapture('${ai.id}')" title="Sesión rápida">⚡</button>`
    : '';

  return `<div class="${cardClass}" data-hoy-ai-id="${ai.id}" data-anim-delay="${idx * 60}" onclick="navigateToCard('${ai.id}')">
    <div class="hoy-mini-strip">
      <div class="hoy-mini-name">${esc(ai.name)}</div>
      <div class="hoy-mini-right">
        ${quickBtn}
      </div>
    </div>
    ${statsBar}
    ${statusBadge}
    ${projPill ? `<div class="hoy-mini-proj-row">${projPill}</div>` : ''}
  </div>`;
}

function _hoyMarkExhausted(id) {
  // Marks an AI as exhausted from Tab Hoy — no reset time (user can set later)
  const ai = getAI(id);
  if (!ai) return;
  ai.status = 'exhausted';
  ai.resetTime = '';
  ai.resetEpoch = null;
  save();
  renderHoy();
  render();
}

// ── Bloqueo ciego — agotar IA sin crear sesión ni log ──
function openBlindExhaustMode(id) {
  const ai = getAI(id);
  if (!ai || ai.status !== 'available' || _isInSession(ai)) return;
  const footer = document.getElementById('footer-' + id);
  if (!footer) return;
  footer.classList.add('card-footer--blind-exhaust-mode');
  const inline = document.getElementById('bexhaust-inline-' + id);
  if (inline) inline.classList.remove('is-hidden');
  setTimeout(() => {
    const inp = document.getElementById('bexhaust-hora-' + id);
    if (inp) { inp.focus(); inp.select(); }
  }, 30);
}

function cancelBlindExhaustMode(id) {
  const footer = document.getElementById('footer-' + id);
  if (footer) footer.classList.remove('card-footer--blind-exhaust-mode');
  const inline = document.getElementById('bexhaust-inline-' + id);
  if (inline) inline.classList.add('is-hidden');
  const inp = document.getElementById('bexhaust-hora-' + id);
  if (inp) inp.value = '';
  const disp = document.getElementById('bexhaust-disp-' + id);
  if (disp) { disp.textContent = '—'; disp.className = 'hora-parsed'; }
  const btn = document.getElementById('bexhaust-confirm-' + id);
  if (btn) btn.disabled = true;
}

function blindExhaustHoraInput(id) {
  const inp = document.getElementById('bexhaust-hora-' + id);
  const disp = document.getElementById('bexhaust-disp-' + id);
  const btn = document.getElementById('bexhaust-confirm-' + id);
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);
  if (disp) {
    disp.textContent = result ? result.label : (raw.length >= 3 ? 'hora inválida' : (raw.length ? '...' : '—'));
    disp.className = 'hora-parsed' + (result ? ' hora-disp--valid' : (raw.length >= 3 ? ' hora-disp--error' : ''));
  }
  if (btn) btn.disabled = !result;
}

function blindExhaustHoraKey(event, id) {
  if (event.key === 'Escape') { event.preventDefault(); cancelBlindExhaustMode(id); return; }
  if (event.key === 'Enter') { event.preventDefault(); confirmBlindExhaust(id); }
}

function confirmBlindExhaust(id) {
  const ai = getAI(id);
  if (!ai || ai.status !== 'available') return;
  const inp = document.getElementById('bexhaust-hora-' + id);
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);
  if (!result) {
    showToast('error', 'Hora inválida — ingresa formato HHMM (ej: 2100)');
    return;
  }
  ai.status = 'exhausted';
  ai.resetTime = result.hhmm;
  ai.resetEpoch = result.epoch;
  // AC: no crea sesión, no toca resetAt de sesiones existentes, no emite log
  cancelBlindExhaustMode(id);
  saveImmediate().then(() => {
    render();
    if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
  });
  showToast('info', `${ai.name} — agotada sin sesión · desbloqueo a las ${result.label}`);
}

function avgBetweenSessions(ai) {
  const dated = getAISessions(ai.id)
    .map(s => new Date(s.date).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b);
  if (dated.length < 2) return null;
  let totalMs = 0;
  for (let i = 1; i < dated.length; i++) totalMs += dated[i] - dated[i - 1];
  const avgMs = totalMs / (dated.length - 1);
  const avgH = avgMs / 3600000;
  if (avgH < 24) return `~${Math.round(avgH)}h entre sesiones`;
  const d = Math.floor(avgH / 24);
  const h = Math.round(avgH % 24);
  return h > 0 ? `~${d}d ${h}h entre sesiones` : `~${d}d entre sesiones`;
}

function buildCard(ai) {
  const el = document.createElement('div');
  const isInterrupted = !!ai.interrupted;
  const isInSession   = !isInterrupted && _isInSession(ai);
  el.className = 'card ' + (ai.status === 'exhausted' ? 'exhausted' : 'available') + (isInterrupted ? ' interrupted-state' : '') + (isInSession ? ' in-session-state' : '');
  el.id = 'card-' + ai.id;

  const cd = ai.status === 'exhausted' ? getCD(ai.resetTime, ai.resetEpoch) : '';
  const resetLabel = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : '';
  // T-055: banner sesión interrumpida
  const interruptedBannerHTML = ai.interrupted
    ? `<div class="interrupted-banner visible">
        <span class="interrupted-banner-text">⚡ Sesión en curso</span>
        <button class="interrupted-banner-btn" onclick="dismissInterrupted('${ai.id}')">Continuar →</button>
       </div>`
    : `<div class="interrupted-banner" id="intbanner-${ai.id}"></div>`;

  // T-202604-203: stats bar sin countdown (countdown va en zona central)
  const _cdInStats = false;

  // v3: sesiones de esta IA en el contexto del proyecto activo
  const aiSessions = getAISessions(ai.id);
  const SESSIONS_DEFAULT = 3;
  const shown = ai.showAll ? aiSessions : [...aiSessions].slice(-SESSIONS_DEFAULT);
  const _latestSessId = aiSessions.length > 0 ? aiSessions[aiSessions.length - 1].id : null;

  // v3: tracker del proyecto activo para indicadores de sesión
  const projTracker = getActiveTracker();

  // T-397: helper — build a single sess-row HTML
  const _buildSessRow = (s, isHero) => {
    const tagDots = (s.tags || []).map(tid => {
      const t = state.tags.find(x => x.id === tid);
      return t ? `<span class="sess-tag-dot" data-tag-color="${esc(t.color)}" title="${esc(t.name)}"></span>` : '';
    }).join('');
    const tgItems = projTracker.items.filter(x => x.sessionId === s.id);
    const tgCounts = {P:0,T:0,R:0,B:0};
    tgItems.forEach(x => {
      const t = x.code ? x.code[0] : (x.type || '');
      if (tgCounts[t] !== undefined) tgCounts[t]++;
    });
    const tgInds = Object.entries(tgCounts).filter(([,v]) => v > 0)
      .map(([k, v]) => `<span class="sess-ind sess-ind-${k}" title="${TG_TYPE_NAMES[k]}"><span class="ind-short">${k}${v > 1 ? v : ''}</span><span class="ind-full">${TG_TYPE_NAMES[k]}${v > 1 ? '×'+v : ''}</span></span>`).join('');
    const pendInd = '';
    const noHoraTag = (!s.resetAt && !s.quickCapture) ? `<span class="sess-no-hora" title="Sin hora de reset registrada">sin hora</span>` : '';
    const refPills = (s.trackerRefs || []).map(code => {
      const type = code[0] || '';
      return `<span class="popup-ref-pill ${type} popup-ref-pill--sm" title="${esc(code)}" onclick="event.stopPropagation();openDetail('${ai.id}','${s.id}')">${esc(code)}</span>`;
    }).join('');
    const starInd = s.starred ? `<span class="sess-ind sess-ind--starred" title="Destacada">⭐</span>` : '';
    const quickInd = s.quickCapture ? `<span class="sess-ind sess-quick-tag" title="Captura rápida">⚡</span>` : '';
    const isLatest = s.id === _latestSessId;
    const reviewInd = isLatest
      ? `<span class="sess-review-ind${s.inReview ? ' active' : ''}" title="${s.inReview ? 'En revisión — click para desactivar' : 'Marcar en revisión'}" onclick="event.stopPropagation();toggleInReview('${ai.id}','${s.id}')">${s.inReview ? '🔍 revisión' : '🔍'}</span>`
      : '';
    const summaryTrunc = s.summary ? (s.summary.length > 80 ? s.summary.slice(0, 80) + '…' : s.summary) : '';
    const summaryHtml = isHero && s.summary
      ? `<div class="sess-row-summary sess-row-summary--expanded">${esc(s.summary.slice(0, 220))}${s.summary.length > 220 ? '…' : ''}</div>`
      : (s.summary ? `<div class="sess-row-summary">${esc(summaryTrunc)}</div>` : '');
    const decisionHtml = isHero && s.decision
      ? `<div class="sess-row-decision"><span class="sess-row-decision-label">→</span>${esc(s.decision.slice(0, 160))}${s.decision.length > 160 ? '…' : ''}</div>`
      : '';
    const extraCls = (s.starred ? ' sess-row-starred' : '') + (isHero ? ' sess-row--latest' : '');
    return `<div class="sess-row${extraCls}" data-sess-id="${s.id}" onclick="openDetail('${ai.id}','${s.id}')">
      <div class="sess-row-top">
        <div class="sess-row-title" title="${esc(s.title)}">${esc(s.title)}</div>
        <div class="sess-row-date" title="${esc(s.date || s.dateShort || '')}">${(typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '')}</div>
      </div>
      <div class="sess-row-bottom">
        ${summaryHtml}
        <div class="sess-row-indicators">${starInd}${quickInd}${pendInd}${tgInds}${noHoraTag}${reviewInd}<div class="sess-row-tags">${tagDots}</div></div>
      </div>
      ${decisionHtml}
    </div>`;
  };

  // T-397: hero (latest) + horizontal strip (older)
  const shownReversed = [...shown].reverse();
  const latestSess = shownReversed[0] || null;
  const olderSess = shownReversed.slice(1);
  const heroHTML = latestSess ? _buildSessRow(latestSess, true) : '';
  const olderHTML = olderSess.length > 0
    ? `<div class="sess-list-horiz">${olderSess.map(s => _buildSessRow(s, false)).join('')}</div>`
    : '';
  const sessRows = heroHTML + olderHTML;

  // B-258: emptyState inline — información de sugerencia dentro de la card, sin banner global
  const _noSessReason = _buildSuggestionReason(ai);
  const emptyState = `<div class="no-sess">
    <span class="no-sess-icon">📋</span>
    Sin sesiones aún
    ${_noSessReason ? `<div class="no-sess-suggestion">${esc(_noSessReason)}</div>` : ''}
    <div class="no-sess-hint">Pega el bloque CHECKPOINT al terminar tu sesión con la IA</div>
  </div>`;

  // v3: stats de sesiones desde proyecto activo
  const nowYM = new Date().toISOString().slice(0,7);
  const sessThisMonth = aiSessions.filter(s => (s.date || '').startsWith(nowYM)).length;
  const sessTotal = aiSessions.length;

  const histHTMLv2 = `
    <div class="history">
      <div class="history-header">
        <div class="history-label">Historial</div>
        <div class="history-header-right">
          <span class="sess-pill">${sessTotal}</span>
        </div>
      </div>
      ${sessTotal === 0 ? emptyState : `
        <div class="sess-list-hero" id="sess-list-${ai.id}">${sessRows}</div>
        ${sessTotal > SESSIONS_DEFAULT ? `<button class="show-all-btn" onclick="toggleShowAll('${ai.id}')">${ai.showAll ? '▲ ocultar historial' : '▾ Ver historial (' + sessTotal + ')'}</button>` : ''}
      `}
    </div>`;

  // Selector de proyecto — inline en paste-label
  const _activeProjects = (state.projects || []).filter(p => p.status !== 'paused');
  const _activeProjId = _getActiveProjectFilter() || '';
  const _projOptions = _activeProjects.map(p =>
    `<option value="${esc(p.id)}" ${p.id === _activeProjId ? 'selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`
  ).join('');
  const _projInlineSelect = `<select class="paste-proj-select" id="sess-proj-${ai.id}" title="Proyecto de esta sesión"><option value="">proyecto…</option>${_projOptions}</select>`;

  // T-202604-203: zona central — contenido condicional por estado
  // Estado available: textarea + preview
  // Estado exhausted: countdown dramático
  // B-255: label "Disponible en X h Y min" calculado desde _hoyMsUntilReset
  const _buildUnlockLabel = (aiObj) => {
    const msLeft = _hoyMsUntilReset(aiObj);
    if (!isFinite(msLeft) || msLeft <= 0) return 'Disponible ahora';
    const totalMin = Math.floor(msLeft / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `Disponible en ${m}min`;
    return `Disponible en ${h}h ${String(m).padStart(2,'0')}min`;
  };
  const unlockLabel = ai.status === 'exhausted' && ai.resetTime ? _buildUnlockLabel(ai) : '';

  const inputHTML = ai.status === 'available' ? `
    <div class="paste-wrap">
      <div class="paste-label">Resumen de sesión ${_projInlineSelect}</div>
      <div class="paste-help-box hidden" id="paste-help-${ai.id}">Pega el bloque <code>---CHECKPOINT---</code> que genera el TL al final de cada sesión. Si no tienes el bloque, escribe el título en la primera línea y el resumen en las siguientes.</div>
      <div class="sc-stepper" id="phasebar-${ai.id}" role="list">
        <div class="sc-step active" id="phase-paste-${ai.id}" role="listitem" aria-current="step" data-step="1"><span class="sc-step-num" aria-hidden="true">1</span>pegar</div>
        <div class="sc-step" id="phase-confirm-${ai.id}" role="listitem" data-step="2"><span class="sc-step-num" aria-hidden="true">2</span>confirmar</div>
        <div class="sc-step" id="phase-save-${ai.id}" role="listitem" data-step="3"><span class="sc-step-num" aria-hidden="true">3</span>guardar</div>
      </div>
      <div class="paste-ta-wrap">
        <textarea class="paste-ta" id="ta-${ai.id}" rows="3"
          onpaste="if(typeof handlePaste==='function'){handlePaste('${ai.id}')}else{showToast('error','Módulo de ingesta no disponible')}"
          oninput="if(typeof handleInput==='function'){handleInput('${ai.id}');}"
          onfocus="enterFocusMode('${ai.id}')"></textarea>
        <div class="paste-ta-hint" id="pta-hint-${ai.id}">Pega el bloque <code>---CHECKPOINT---</code> que genera el rol al cerrar sesión. Si no tienes el bloque, escribe el título en la primera línea y el resumen en las siguientes.</div>
      </div>
      <div class="char-counter" id="cc-${ai.id}"></div>
    </div>
    <div class="preview" id="prev-${ai.id}"></div>
  ` : ai.resetTime ? `
    <div class="card-countdown-zone">
      <div class="countdown-dramatic">
        <div class="card-stat-countdown" id="cd-${ai.id}">${cd || '--:--:--'}</div>
        <div class="card-stat-reset-lbl">${resetLabel}</div>
        <div class="sc-unlock-field" id="unlock-lbl-${ai.id}">
          ${unlockLabel ? `<i class="sc-unlock-icon ti ti-lock-open"></i><span class="sc-unlock-label">${unlockLabel}</span>` : ''}
        </div>
      </div>
    </div>
  ` : `
    <div class="card-countdown-zone card-countdown-zone--notime">
      <div class="countdown-no-time">
        <div class="countdown-no-time-msg">Sin hora de desbloqueo asignada</div>
        <button class="countdown-assign-hora-btn" onclick="openCorrectHora('${ai.id}')">⏰ Asignar hora</button>
      </div>
    </div>
  `;

  // T-202604-203: footer fijo — acciones primarias siempre en la misma posición
  const footerHTML = ai.status === 'available' ? `
    <div class="sc-footer" id="footer-${ai.id}">
      <div class="sc-unlock">
        <label class="sc-unlock-label" for="hora-${ai.id}">
          <i class="sc-unlock-icon ti ti-lock" aria-hidden="true"></i>desbloqueo
        </label>
        <input class="hora-input" id="hora-${ai.id}" type="text" maxlength="4" placeholder="--:--"
          oninput="parseHora('${ai.id}')"
          onkeydown="horaKey(event,'${ai.id}')">
        <div class="hora-parsed" id="hdisp-${ai.id}">—</div>
      </div>
      <button class="sc-save" id="sbtn-${ai.id}" onclick="confirmSave('${ai.id}')" disabled>guardar sesión</button>
      <div class="blind-exhaust-inline hidden" id="bexhaust-inline-${ai.id}">
        <div class="blind-exhaust-hora-row">
          <input class="hora-input blind-exhaust-hora-input" id="bexhaust-hora-${ai.id}" type="text" maxlength="4" placeholder="--:--"
            oninput="blindExhaustHoraInput('${ai.id}')"
            onkeydown="blindExhaustHoraKey(event,'${ai.id}')"
            aria-label="Hora de desbloqueo para agotamiento ciego">
          <div>
            <div class="hora-parsed" id="bexhaust-disp-${ai.id}">—</div>
            <div class="hora-hint-txt">hora de desbloqueo · Enter para agotar</div>
          </div>
        </div>
        <div class="blind-exhaust-confirm-row">
          <button class="blind-exhaust-confirm-btn" id="bexhaust-confirm-${ai.id}" onclick="confirmBlindExhaust('${ai.id}')" disabled aria-label="Confirmar agotamiento ciego">🔴 Agotar</button>
          <button class="blind-exhaust-cancel-btn" onclick="cancelBlindExhaustMode('${ai.id}')">Cancelar</button>
        </div>
      </div>
    </div>
  ` : `
    <div class="sc-footer sc-footer--exhausted">
      <button class="card-footer-unlock-btn" onclick="openCorrectHora('${ai.id}')">⏰ Corregir hora</button>
    </div>
  `;

  // T-031: Notas — colapsadas por defecto con label explicativo (rediseño AI Card)
  const notesVal = ai.notes || '';
  const notesHTML = `<div class="card-notes-wrap" id="notes-wrap-${ai.id}">
    <button class="sc-notes-toggle${notesVal ? '' : ' empty'}" id="notes-toggle-${ai.id}" onclick="toggleNotes('${ai.id}')" aria-expanded="false">
      <span class="sc-notes-toggle-icon ti ti-chevron-right"></span>
      <span class="sc-notes-desc">notas de sesión</span>
    </button>
    <div class="card-notes-body is-hidden" id="notes-body-${ai.id}">
      ${notesVal
        ? `<div class="card-notes-text" id="notes-text-${ai.id}" onclick="editNotes('${ai.id}')" title="Click para editar notas">${esc(notesVal)}</div>`
        : `<div class="card-notes-text empty-notes" id="notes-text-${ai.id}" onclick="editNotes('${ai.id}')" title="Agregar notas">+ notas libres</div>`
      }
    </div>
  </div>`;

  // v3: stale usa aiSessions
  const staleLastDate = aiSessions.length > 0 ? new Date(aiSessions[aiSessions.length-1].date) : null;
  const staleDays = staleLastDate ? Math.floor((Date.now()-staleLastDate.getTime())/86400000) : 0;

  const checkpointTotal = aiSessions.length; // todos los registros
  const sessConHora = aiSessions.filter(s => s.resetAt && !s.quickCapture).length; // con hora bloqueada
  const avgLabel2 = avgBetweenSessions(ai);
  const avgShort = avgLabel2 ? avgLabel2.replace(' entre sesiones','') : '—';
  // T-202604-203: stats bar idéntica en ambos estados — solo números, sin countdown
  const statsBarHTML = `<div class="sc-stats">
      <div class="sc-stat"><span class="sc-stat-val">${checkpointTotal}</span><span class="sc-stat-lbl">checkpoints</span></div>
      <div class="sc-stat"><span class="sc-stat-val">${sessConHora}</span><span class="sc-stat-lbl">sesiones</span></div>
      <div class="sc-stat"><span class="sc-stat-val">${avgShort}</span><span class="sc-stat-lbl" title="Tiempo promedio entre sesiones de este Worker, desde apertura">desde apertura</span></div>
    </div>`;

  // Project chip — basado en la última sesión de la IA
  const _lastSess = getLastAISession(ai.id);
  const _cardProj = _lastSess ? getProjectById(_lastSess.projectId) : null;
  const _projChipHTML = _cardProj
    ? `<span class="card-proj-chip" title="${esc(_cardProj.name)}" onclick="event.stopPropagation();selectProjectFilter('${_cardProj.id}')">${esc(_cardProj.icon || '📁')} ${esc(_cardProj.name)}</span>`
    : '';

  // Premium card: avatar initial + status pill animado + countdown dramático
  const _aiInitial = esc(ai.name).charAt(0).toUpperCase();
  const _isAvail = ai.status === 'available';

  // Sprint activo del proyecto de la card — para mostrar ID en header
  const _cardActiveSprint = _cardProj && _cardProj.sprints
    ? _cardProj.sprints.find(s => s.status === 'active')
    : null;
  const _cardSprintId = _cardActiveSprint ? esc(_cardActiveSprint.id || _cardActiveSprint.name || '') : '';
  const _cardSprintHTML = _cardSprintId
    ? `<span class="sc-sprint-id" title="${esc(_cardActiveSprint.name || _cardActiveSprint.id)}">${_cardSprintId}</span>`
    : '';

  el.innerHTML = `
    ${interruptedBannerHTML}
    <div class="sc-header">
      <div class="sc-header-left">
        <div class="sc-avatar" title="${esc(ai.name)}" ondblclick="startRename('${ai.id}')">${_aiInitial}</div>
        <span class="sc-project" id="name-${ai.id}">${esc(ai.name)}</span>
        ${isInSession
          ? `<span class="sc-badge"><span class="sc-badge-dot"></span>${STATUS_LABELS.insession}</span>`
          : _isAvail
            ? `<span class="sc-badge sc-badge--avail">${STATUS_LABELS.available}</span>`
            : `<span class="sc-badge sc-badge--exhausted">${STATUS_LABELS.exhausted}</span>`
        }
      </div>
      <div class="sc-header-right">
        ${_hasStaleSuggestion(ai) ? `<span class="stale-dot" title="Última sesión hace ${staleDays} días — tienes ítems en progreso pendientes"></span>` : ''}
        ${_cardSprintHTML}
        ${_isAvail ? `<button class="btn-quick" onclick="openQuickCapture('${ai.id}')" title="Registrar sesión rápida sin protocolo">⚡</button>` : ''}
        <div class="card-dot-menu" id="dotmenu-wrap-${ai.id}">
          <button class="sc-menu-btn" onclick="toggleCardMenu('${ai.id}',event)" title="Más opciones" aria-label="Más opciones"><i class="ti ti-dots"></i></button>
          <div class="card-dot-dropdown" id="dotmenu-${ai.id}">
            <button class="card-dot-item" onclick="closeCardMenu('${ai.id}');startRename('${ai.id}')"><span class="dot-item-icon">✎</span> Renombrar</button>
            ${_isAvail ? `<button class="card-dot-item" onclick="confirmInterruptInline('${ai.id}',this)"><span class="dot-item-icon">⛓️‍💥</span> Interrumpir sesión</button>` : ''}
            ${_isAvail ? `<button class="card-dot-item" onclick="closeCardMenu('${ai.id}');openBlindExhaustMode('${ai.id}')"><span class="dot-item-icon">🔴</span> Agotar</button>` : ''}
            ${!_isAvail ? `<button class="card-dot-item" onclick="closeCardMenu('${ai.id}');openCorrectHora('${ai.id}')"><span class="dot-item-icon">⏰</span> Corregir hora de desbloqueo</button>` : ''}
            <button class="card-dot-item${sessTotal < 2 ? ' disabled' : ''}" onclick="closeCardMenu('${ai.id}');${sessTotal >= 2 ? `downloadReport('${ai.id}')` : ''}" title="${sessTotal < 2 ? 'Necesitas al menos 2 sesiones' : 'Descargar reporte markdown'}"${sessTotal < 2 ? ' disabled' : ''}><span class="dot-item-icon">📥</span> Descargar reporte</button>
            <hr class="card-dot-divider">
            <div class="danger-zone">
            <button class="card-dot-item danger" onclick="closeCardMenu('${ai.id}');archiveAI('${ai.id}')"><span class="dot-item-icon">⊟</span> Archivar</button>
            <button class="card-dot-item danger" onclick="closeCardMenu('${ai.id}');confirmClear('${ai.id}')"><span class="dot-item-icon">⌫</span> Limpiar historial</button>
            <button class="card-dot-item danger" onclick="closeCardMenu('${ai.id}');deleteAI('${ai.id}')"><span class="dot-item-icon">✕</span> Eliminar IA</button>
            </div>
          </div>
        </div>
        <span class="card-drag-handle" title="Arrastrar para reordenar">⠿</span>
      </div>
    </div>
    ${statsBarHTML}
    <div class="card-body">
      ${inputHTML}
      ${_trackerCurrentView !== 'poria' ? histHTMLv2 : ''}
      ${notesHTML}
    </div>
    ${footerHTML}`;
  // CSS Purity: tag dot background color calculado desde datos → setProperty post-render
  el.querySelectorAll('[data-tag-color]').forEach(dot => {
    dot.style.setProperty('background', dot.dataset.tagColor);
  });
  return el;
}

// ── R-[pendiente-ID]: Quick Capture — modal unificado con stepper ──
// Reemplaza: T-071 (quick-modal-overlay) + selectAIForQuickCapture (ai-quick-select-modal)
// Shell HTML: #qc-modal-overlay con #qc-panel-1 (selector) y #qc-panel-2 (formulario)
// CSS: locus-modals.css §qc-

let _quickAIId = null;
let _qcStep = 0; // 0 = sin inicializar · 1 = paso 1 · 2 = paso 2

// ── Helpers internos ──

function _qcEl(id) { return document.getElementById(id); }

// AC-10: transición entre pasos via .hidden — sin style.display (CSS Purity H-01/H-02)
function _qcSetStep(step) {
  _qcStep = step;
  const panel1 = _qcEl('qc-panel-1');
  const panel2 = _qcEl('qc-panel-2');
  const dot1   = _qcEl('qc-dot-1');
  const dot2   = _qcEl('qc-dot-2');
  const stepper = _qcEl('qc-stepper');
  const backBtn = _qcEl('qc-back-btn');
  const nextBtn = _qcEl('qc-next-btn');

  if (step === 1) {
    panel1.classList.remove('hidden');
    panel2.classList.add('hidden');
    dot1.classList.add('qc-dot--active');
    dot2.classList.remove('qc-dot--active');
    stepper.setAttribute('aria-label', 'Paso 1 de 2');
    backBtn.textContent = 'Cancelar';
    nextBtn.textContent = 'Continuar';
    nextBtn.disabled = !_qcEl('qc-worker-list').querySelector('.qc-worker-item--selected');
  } else {
    panel1.classList.add('hidden');
    panel2.classList.remove('hidden');
    dot1.classList.remove('qc-dot--active');
    dot2.classList.add('qc-dot--active');
    stepper.setAttribute('aria-label', 'Paso 2 de 2');
    backBtn.textContent = 'Atrás';
    nextBtn.textContent = 'Guardar';
    nextBtn.disabled = false;
    // AC-11: foco al primer elemento interactivo del Paso 2
    setTimeout(() => { const qt = _qcEl('quick-title'); if (qt) qt.focus(); }, 60);
  }
}

// Inyecta lista de Workers en Paso 1 — genera qc-worker-item por cada Worker activo
function _qcRenderWorkerList() {
  const list = _qcEl('qc-worker-list');
  if (!list) return;
  const available = (state.ais || []).filter(a => !a.archived);
  list.innerHTML = available.map(ai => `
    <button class="qc-worker-item" data-worker-id="${esc(ai.id)}" onclick="qcSelectWorker(this)">
      <span class="qc-worker-avatar">${esc((ai.sigla || ai.name || '?').slice(0,2).toUpperCase())}</span>
      <span class="qc-worker-name">${esc(ai.name)}</span>
      <span class="qc-worker-check hidden">✓</span>
    </button>
  `).join('');
}

// ── API pública ──

// AC-03/04/05: abre modal — con id salta Paso 1 (skip), sin id muestra selector
function openQuickCapture(id) {
  const overlay = _qcEl('qc-modal-overlay');
  if (!overlay) return;

  // Limpiar estado previo
  _quickAIId = null;
  _qcStep = 0;
  _qcEl('quick-title').value = '';
  _qcEl('quick-summary').value = '';
  _qcEl('quick-hora').value = '';
  _qcEl('quick-hora-disp').textContent = 'hora de desbloqueo (opcional)';

  const available = (state.ais || []).filter(a => !a.archived);

  if (id) {
    // Llamado directo con Worker conocido — skip Paso 1 (AC-05)
    _quickAIId = id;
    _qcEl('qc-stepper').classList.add('hidden'); // sin stepper en skip
    _qcEl('qc-worker-chip-name').textContent = (getAI(id) || {}).name || id;
    overlay.classList.add('open');
    _qcSetStep(2);
  } else if (available.length === 1) {
    // AC-05: un solo Worker — skip Paso 1 directamente
    _quickAIId = available[0].id;
    _qcEl('qc-stepper').classList.add('hidden');
    _qcEl('qc-worker-chip-name').textContent = available[0].name;
    overlay.classList.add('open');
    _qcSetStep(2);
  } else {
    // Múltiples Workers — mostrar Paso 1
    _qcEl('qc-stepper').classList.remove('hidden');
    _qcRenderWorkerList();
    overlay.classList.add('open');
    _qcSetStep(1);
  }
}

// AC-04: selección de Worker en Paso 1
function qcSelectWorker(el) {
  _qcEl('qc-worker-list').querySelectorAll('.qc-worker-item').forEach(item => {
    item.classList.remove('qc-worker-item--selected');
    item.querySelector('.qc-worker-check').classList.add('hidden');
  });
  el.classList.add('qc-worker-item--selected');
  el.querySelector('.qc-worker-check').classList.remove('hidden');
  _quickAIId = el.dataset.workerId;
  _qcEl('qc-next-btn').disabled = false;
}

// Botón Continuar / Guardar
function qcHandleNext() {
  if (_qcStep === 1) {
    if (!_quickAIId) return;
    _qcEl('qc-worker-chip-name').textContent = (getAI(_quickAIId) || {}).name || _quickAIId;
    _qcSetStep(2);
  } else {
    confirmQuickCapture();
  }
}

// Botón Cancelar / Atrás
function qcHandleBack() {
  if (_qcStep === 2 && _qcEl('qc-stepper') && !_qcEl('qc-stepper').classList.contains('hidden')) {
    // En Paso 2 con stepper visible → volver a Paso 1
    _quickAIId = null;
    _qcSetStep(1);
  } else {
    closeQuickCapture();
  }
}

// Cierra el modal y limpia estado
function closeQuickCapture(e) {
  if (e && e.target !== _qcEl('qc-modal-overlay')) return;
  _qcEl('qc-modal-overlay').classList.remove('open');
  _quickAIId = null;
  _qcStep = 0;
}

// Alias legacy — closeQuickModal referenciado en cascade Escape y quickTitleKey
function closeQuickModal(e) { closeQuickCapture(e); }

// T-202605-430: usa _horaUpdate — feedback visual completo igual que la referencia
function quickParseHora() {
  const inp = _qcEl('quick-hora');
  const disp = _qcEl('quick-hora-disp');
  if (inp && !inp.value.replace(/\D/g, '')) {
    if (disp) { disp.textContent = 'hora de desbloqueo (opcional)'; disp.className = 'hora-disp--hint'; }
    return;
  }
  _horaUpdate(inp, disp);
}

function quickTitleKey(e) {
  if (e.key === 'Enter') { e.preventDefault(); confirmQuickCapture(); }
  if (e.key === 'Escape') { closeQuickCapture(); }
}

function confirmQuickCapture() {
  if (!_quickAIId) return;
  const title = _qcEl('quick-title').value.trim();
  if (!title) {
    _qcEl('quick-title').focus();
    const _qt = _qcEl('quick-title');
    if (_qt) { _qt.classList.add('input-border-error'); setTimeout(() => _qt.classList.remove('input-border-error'), 1200); }
    return;
  }
  const summary = _qcEl('quick-summary').value.trim();
  const horaRaw = _qcEl('quick-hora').value.replace(/\D/g,'');
  const horaResult = horaRaw ? interpretHora(horaRaw) : null;

  const ai = getAI(_quickAIId);
  const now = new Date();
  const sess = {
    id: 'sess-' + Date.now(),
    title,
    summary,
    files: '',
    pending: '',
    tags: [],
    trackerRefs: [],
    starred: false,
    quickCapture: true,
    resetAt: horaResult ? horaResult.hhmm : '',
    dateShort: now.toLocaleDateString('es-MX', {day:'2-digit',month:'short'}),
    date: now.toISOString()
  };

  // v3: sesión va al proyecto activo con aiId
  sess.aiId = _quickAIId;
  const activeProj = getActiveProject();
  if (!activeProj) {
    showToast('warning', '⚠ Selecciona un proyecto antes de guardar la sesión');
    if (typeof openProjPanel === 'function') openProjPanel();
    return;
  }
  if (!activeProj.sessions) activeProj.sessions = [];
  activeProj.sessions.push(sess);

  if (horaResult) {
    // T-089: solo cambiar status a exhausted si estaba disponible
    if (ai.status === 'available') ai.status = 'exhausted';
    ai.resetTime = horaResult.hhmm;
    ai.resetEpoch = horaResult.epoch;
  }

  closeQuickCapture();
  // B-202605-XXX: usar saveImmediate() para garantizar escritura en Supabase antes de
  // cualquier recarga. save() con debounce de 5s podía perder resetTime/resetEpoch/status
  // si el usuario recargaba la tab antes de que el timer disparara.
  saveImmediate().then(() => { render(); if (currentTab === 'hoy') renderHoy(); });
  showToast('success', `${ai.name} — sesión rápida guardada`);
}

// ── END R-[pendiente-ID] Quick Capture ──

// ── T-055: Sesión interrumpida ──
// T-093: confirmación inline dentro del dropdown antes de interrumpir
function confirmInterruptInline(id, triggerBtn) {
  const dropdown = document.getElementById('dotmenu-' + id);
  if (!dropdown) return;
  // Si ya hay un confirm-row, no duplicar
  if (dropdown.querySelector('.dot-confirm-row')) return;
  // Ocultar el botón trigger
  triggerBtn.classList.add('is-hidden');
  const row = document.createElement('div');
  row.className = 'dot-confirm-row';
  row.innerHTML = `<span class="dot-confirm-label">⚡ ¿Interrumpir?</span>
    <button class="dot-confirm-cancel" onclick="cancelInterruptInline('${id}')">No</button>
    <button class="dot-confirm-ok" onclick="closeCardMenu('${id}');interruptSession('${id}')">Sí</button>`;
  triggerBtn.after(row);
}
function cancelInterruptInline(id) {
  const dropdown = document.getElementById('dotmenu-' + id);
  if (!dropdown) return;
  const row = dropdown.querySelector('.dot-confirm-row');
  if (row) row.remove();
  const btn = dropdown.querySelector('.card-dot-item[onclick*="confirmInterruptInline"]');
  if (btn) btn.classList.remove('is-hidden');
}

function interruptSession(id) {
  const ai = getAI(id);
  _gconfirmOpen({
    title: `Marcar sesión interrumpida`,
    msg: `"${ai.name}" pasará a estado agotado.`,
    okLabel: 'Confirmar',
    danger: false,
    inputLabel: 'Hora de reset (opcional)',
    inputPlaceholder: '--:--'
  }, (horaRaw) => {
    const horaResult = horaRaw ? interpretHora(horaRaw.replace(/\D/g,'')) : null;
    ai.status = 'exhausted';
    ai.interrupted = true;
    if (horaResult) { ai.resetTime = horaResult.hhmm; ai.resetEpoch = horaResult.epoch; }
    // R-202604-061 AC-2: clase transitoria antes de interrupted-state
    const _intCard = document.getElementById('card-' + id);
    if (_intCard) _intCard.classList.add('tracker-card--interrupting');
    setTimeout(() => {
      save(); render();
      if (currentTab === 'hoy') renderHoy();
    }, 200);
    showToast('info', `${ai.name} — sesión interrumpida`);
  });
}

function dismissInterrupted(id) {
  const ai = getAI(id);
  ai.interrupted = false;
  save(); render();
  if (currentTab === 'hoy') renderHoy();
}

// T-058 ya maneja auto-disponible; al desbloquearse, si tenía interrupted, lo conservamos
// Solo limpiamos interrupted cuando el usuario hace click en "Continuar →"

// ── T-056: Focus Zone — modo registro ──
let focusActiveId = null;

function enterFocusMode(id) {
  if (focusActiveId === id) return;
  // Si había otro activo, salir primero
  if (focusActiveId) exitFocusMode();
  focusActiveId = id;

  const activeCard = document.getElementById('card-' + id);
  if (activeCard) {
    activeCard.classList.add('focus-active');
    // T-202604-004: historial permanece visible en modo protagonista
    // Scroll NO se hace aquí — enterFocusMode se dispara desde onfocus del textarea
    // y causaría scroll indeseado al hacer click dentro del campo.
    // El scroll al navegar se maneja en _scrollToCard().
  }

  // Dimmear los demás cards
  document.querySelectorAll('.card').forEach(c => {
    if (c.id !== 'card-' + id) c.classList.add('focus-dimmed');
  });
}

function exitFocusMode() {
  if (!focusActiveId) return;
  const activeCard = document.getElementById('card-' + focusActiveId);
  if (activeCard) {
    activeCard.classList.remove('focus-active');
  }
  document.querySelectorAll('.card.focus-dimmed').forEach(c => c.classList.remove('focus-dimmed'));
  focusActiveId = null;
}

// B-202605-014: Backlog Focus Mode — Top-10 · Cmd+F con tab Backlog activo sin panel abierto
// _backlogFocusMode declarada en ai-tracker-backlog.js — no redeclarar aquí (SyntaxError duplicate var)

function toggleBacklogFocusMode() {
  _backlogFocusMode = !_backlogFocusMode;

  // Indicador visual — botón #fbar-focus-btn en bl-toolbar (patrón canónico .active)
  const focusBtn = document.getElementById('fbar-focus-btn');
  if (focusBtn) focusBtn.classList.toggle('active', _backlogFocusMode);

  // Obtener todos los .backlog-item del DOM
  const allItems = document.querySelectorAll('.backlog-item');
  if (!allItems.length) return;

  if (!_backlogFocusMode) {
    // Desactivar — restaurar todos los ítems
    allItems.forEach(el => {
      el.classList.remove('blf-hidden');
      el.removeAttribute('aria-hidden');
    });
    return;
  }

  // Calcular Top-10 desde tracker items del proyecto activo
  const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
  const tracker = (typeof getActiveTracker === 'function') ? getActiveTracker() : { items: [] };
  const trackerItems = tracker.items || [];

  // Sprint activo — sin depender de getActiveSprints() (B-202605-026 pendiente)
  const activeSprint = proj && proj.sprints
    ? proj.sprints.find(s => s.status === 'active')
    : null;

  // Filtro: pendientes del sprint activo, o todos los pendientes si no hay sprint
  const pool = trackerItems.filter(i =>
    i.status === 'pendiente' &&
    (!activeSprint || i.sprint === activeSprint.id)
  );

  // Orden: high → medium → low
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const sorted = [...pool].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 3;
    const pb = PRIORITY_ORDER[b.priority] ?? 3;
    return pa - pb;
  });

  // Top-10 — si pool vacío (sin sprint activo con ítems), usar todos los pendientes
  const top10Pool = sorted.length > 0 ? sorted : trackerItems
    .filter(i => i.status === 'pendiente')
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));

  const top10Codes = new Set(top10Pool.slice(0, 10).map(i => i.code).filter(Boolean));

  // Aplicar .blf-hidden a ítems fuera del Top-10
  allItems.forEach(el => {
    // data-code es el atributo canónico en .backlog-item — fallback a data-id
    const code = el.dataset.code || el.dataset.id || '';
    const inTop10 = top10Codes.has(code);
    el.classList.toggle('blf-hidden', !inTop10);
    if (!inTop10) {
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('aria-hidden');
    }
  });
}

// ESC para salir del modo registro
// ── T-202604-418: Atajos de teclado globales ─────────────────────────────

// Cascade Escape — cierra en orden de profundidad (más reciente primero)
function _escCascade() {
  const _overlayChecks = [
    // T-202605-460: panel búsqueda global — prioridad más alta
    () => { const el = document.getElementById('search-unified-results'); if (el) { el.remove(); return true; } },
    // Prioridad alta — modales de confirmación / editing
    () => { const el = document.getElementById('shortcuts-ref-overlay'); if (el && !el.classList.contains('is-hidden')) { closeShortcutsRef(); return true; } },
    () => { const el = document.getElementById('shortcuts-overlay'); if (el && !el.classList.contains('is-hidden')) { closeShortcuts(); return true; } },
    () => { const el = document.getElementById('cp-overlay'); if (el && !el.classList.contains('is-hidden')) { closeCommandPalette(); return true; } },
    () => { const el = document.getElementById('quick-note-modal'); if (el && el.offsetParent !== null) { if (typeof closeQuickNote === 'function') closeQuickNote(); return true; } },
    () => { const el = document.getElementById('qc-modal-overlay'); if (el && el.classList.contains('open')) { closeQuickCapture(); return true; } },
    () => { const el = document.getElementById('item-detail-panel'); if (el && el.classList.contains('open')) { if (typeof closeItemPanel === 'function') closeItemPanel(); return true; } },
    () => { const el = document.getElementById('item-editor-overlay'); if (el && el.offsetParent !== null) { if (typeof closeItemEditor === 'function') closeItemEditor(); return true; } },
    () => { const el = document.getElementById('merge-diff-overlay'); if (el && el.offsetParent !== null) { if (typeof showMergeDiffPanel === 'function') { const p = document.getElementById('item-viz-overlay'); if (p && !p.classList.contains('is-hidden')) { if (typeof _itemVizClose === 'function') _itemVizClose(); return true; } } } },
    () => { const el = document.getElementById('item-viz-overlay'); if (el && !el.classList.contains('is-hidden')) { if (typeof _itemVizClose === 'function') _itemVizClose(); return true; } },
    () => { const el = document.getElementById('pend-overlay'); if (el && el.offsetParent !== null) { if (typeof closePendPanel === 'function') closePendPanel(); return true; } },
    () => { const el = document.getElementById('proj-modal-overlay'); if (el && el.offsetParent !== null) { if (typeof closeProjModal === 'function') closeProjModal(); return true; } },
    () => { const el = document.getElementById('proj-panel-overlay'); if (el && el.offsetParent !== null) { if (typeof closeProjPanel === 'function') closeProjPanel(); return true; } },
    () => { const el = document.getElementById('pulso-panel'); if (el && el.offsetParent !== null) { if (typeof closePulsoPanel === 'function') closePulsoPanel(); return true; } },
    () => { if (focusActiveId) { exitFocusMode(); return true; } },
  ];
  for (const check of _overlayChecks) {
    if (check()) return;
  }
}

// T-202605-460: click fuera del panel search-unified-results lo cierra
document.addEventListener('click', e => {
  const panel = document.getElementById('search-unified-results');
  if (!panel) return;
  const input = document.getElementById('search-global');
  if (!panel.contains(e.target) && e.target !== input) panel.remove();
}, true);

document.addEventListener('keydown', e => {
  // T-202604-418: Escape en cascada — prioridad absoluta
  if (e.key === 'Escape') {
    _escCascade();
    return;
  }

  // Cmd+K / Ctrl+K → delegado a _cpGlobalKeydown en ai-tracker-command-palette.js

  // T-202605-442: Cmd+? → referencia de atajos (Cmd+Shift+/ y Cmd+?)
  if ((e.metaKey || e.ctrlKey) && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
    e.preventDefault();
    if (typeof openShortcutsRef === 'function') openShortcutsRef();
    return;
  }

  // B-202605-014: Ctrl+F / Cmd+F — contextual según tab activo y estado de panel
  // Con tab Backlog activo y sin panel abierto → activa Top-10 backlog focus
  // Con panel abierto → activa focus del panel (comportamiento previo)
  // Otros casos → focus búsqueda global (comportamiento previo)
  if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
    const _isBacklogTab = currentTab === 'backlog' || currentTab === 'tab-backlog';
    const _itemPanel = document.getElementById('item-detail-panel');
    const _panelOpen = _itemPanel && _itemPanel.classList.contains('open');
    if (_isBacklogTab && !_panelOpen) {
      e.preventDefault();
      // R-202605-175: guard typeof — si módulo backlog no cargó, toast warning en lugar de error silencioso
      if (typeof toggleBacklogFocusMode === 'function') {
        toggleBacklogFocusMode();
      } else {
        showToast('warning', '⚠️ Módulo de backlog no disponible');
      }
      return;
    }
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
    window._gChordPending = true;
    clearTimeout(window._gChordTimer);
    window._gChordTimer = setTimeout(() => { window._gChordPending = false; }, 1000);
    e.preventDefault();
    return;
  }
  if (window._gChordPending && !e.ctrlKey && !e.metaKey && !e.altKey) {
    window._gChordPending = false;
    clearTimeout(window._gChordTimer);
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
      if (_dest && typeof switchTab === 'function') switchTab(_dest);
    }
    return;
  }

  if (_inInput || e.ctrlKey || e.metaKey || e.altKey) return;

  // T-202605-442 + T-202604-418: dispatch por tecla configurada
  const _pressedKey = e.key.toLowerCase();

  // T-202604-420: '/' → foco en búsqueda global (solo si foco no está en campo de texto)
  if (_pressedKey === '/' && !_inInput) {
    e.preventDefault();
    const si = document.getElementById('search-global');
    if (!si) return;
    si.focus();
    si.select();
    return;
  }

  // T-202604-418: N → nota rápida (openQuickNote)
  if (_pressedKey === _sk('quick-note')) {
    e.preventDefault();
    if (typeof openQuickNote === 'function') openQuickNote();
    return;
  }

  // T-202604-418: Shift+N → nuevo ítem
  if (e.shiftKey && e.key === 'N') {
    e.preventDefault();
    if (typeof openItemEditor === 'function') openItemEditor(null);
    return;
  }

  // T-202604-418: S → guardar sesión activa si hay borrador pendiente
  if (_pressedKey === _sk('save-session')) {
    e.preventDefault();
    // Detecta IA con borrador activo — textarea con contenido
    const _activeTA = document.querySelector('.main-textarea:not([readonly])');
    if (_activeTA && _activeTA.value.trim()) {
      const _aiId = _activeTA.closest('[data-ai-id]') && _activeTA.closest('[data-ai-id]').dataset.aiId;
      const _sbtn = _aiId
        ? document.getElementById(`sbtn-${_aiId}`)
        : document.querySelector('.sc-save');
      if (_sbtn) _sbtn.click();
    } else {
      // Fallback: llamar confirmSave con el AI activo en focusMode
      if (focusActiveId && typeof confirmSave === 'function') confirmSave(focusActiveId);
    }
    return;
  }

  // T-202604-418: F → toggle focus mode
  if (_pressedKey === _sk('toggle-focus')) {
    e.preventDefault();
    if (focusActiveId) {
      exitFocusMode();
    } else {
      // Activar focus en el AI activo en tab tracker si hay uno en sesión
      const _inSessCard = document.querySelector('.card.in-session-state');
      if (_inSessCard) {
        const _ta = _inSessCard.querySelector('.main-textarea');
        if (_ta) _ta.focus();
      }
    }
    return;
  }

  // T-202604-418: / → búsqueda global (cuando no está en input)
  if (e.key === '/') {
    e.preventDefault();
    const si = document.getElementById('search-global');
    if (si) { si.focus(); si.select(); }
    return;
  }

  if (_pressedKey === _sk('search')) {
    // Búsqueda en tab activo (F — ahora reasignado a focus; / es búsqueda global)
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
    if (typeof switchTab === 'function') switchTab('backlog');
    setTimeout(() => {
      if (typeof switchSubTab === 'function') switchSubTab('tracker');
      const _standalonePanel = document.getElementById('sspanel-tracker');
      if (_standalonePanel) _standalonePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return;
  }

  // T-202604-418: J/K → navegan en cualquier lista activa (no solo backlog)
  if (_pressedKey === _sk('nav-up') || _pressedKey === _sk('nav-down')) {
    e.preventDefault();
    const _dir = _pressedKey === _sk('nav-down') ? 1 : -1;

    // Intentar primero en backlog, luego en log (historial), luego en lista de tracker
    const _selectors = [
      '.backlog-item:not([style*="display: none"]):not([style*="display:none"])',
      '.log-card',
      '.hoy-mini-card',
    ];
    let _handled = false;
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
      _handled = true;
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
      if (_code && typeof navigateToItem === 'function') navigateToItem(_code);
      else if (typeof openItemPanel === 'function') {
        const _item = _selBL.dataset.id && (typeof ITEMS !== 'undefined') && ITEMS.find(i => i.id === _selBL.dataset.id);
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
    if (_code && typeof openItemEditor === 'function') openItemEditor(null, _code);
    return;
  }
});


// ── Command Palette — delegado a ai-tracker-command-palette.js ───────────
// openCommandPalette() y closeCommandPalette() viven en ai-tracker-command-palette.js
// Implementación local eliminada — T-202604-418 / T-202604-419
// ─────────────────────────────────────────────────────────────────────────


// ── T-202605-442: Atajos de teclado configurables ────────────────────────
// _SHORTCUTS_KEY, _USER_PREFS_TS_KEY, _shortcutsLoad, _shortcutsSave → migradas a locus-storage.js
const _SHORTCUT_DEFS = [
  // Navegación de tabs (chord G+)
  { id: 'tab-tracker',   label: 'Ir a Tracker',                  group: 'Navegación', default: 'g+t', chord: true },
  { id: 'tab-backlog',   label: 'Ir a Backlog',                   group: 'Navegación', default: 'g+d', chord: true },
  { id: 'tab-analytics', label: 'Ir a Analytics',                 group: 'Navegación', default: 'g+a', chord: true },
  { id: 'tab-proyectos', label: 'Ir a Proyectos',                 group: 'Navegación', default: 'g+p', chord: true },
  // Acciones globales — T-202604-418
  { id: 'quick-note',    label: 'Nueva nota rápida',              group: 'Acciones',   default: 'n',   chord: false },
  { id: 'save-session',  label: 'Guardar sesión activa',          group: 'Acciones',   default: 's',   chord: false },
  { id: 'toggle-focus',  label: 'Toggle modo protagonista',       group: 'Acciones',   default: 'f',   chord: false },
  { id: 'search',        label: 'Búsqueda en tab activo',         group: 'Acciones',   default: '/',   chord: false },
  { id: 'paste-ckpt',    label: 'Pegar CHECKPOINT',               group: 'Acciones',   default: 'p',   chord: false },
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
  const overrides = _shortcutsLoad();

  // Agrupar por grupo
  const groups = {};
  _SHORTCUT_DEFS.forEach(def => {
    if (!groups[def.group]) groups[def.group] = [];
    groups[def.group].push(def);
  });

  body.innerHTML = Object.entries(groups).map(([group, defs]) => {
    const rows = defs.map(def => {
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
          <button class="sc-edit-btn" onclick="_shortcutsStartEdit('${def.id}')" title="Cambiar atajo">✎</button>
          ${isModified ? `<button class="sc-reset-one-btn" onclick="_shortcutsResetOne('${def.id}')" title="Restaurar default">↺</button>` : ''}
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
        onkeydown="_shortcutsCaptureKey(event,'${id}',${def.chord})"
        autocomplete="off" autocorrect="off" spellcheck="false">
      <span class="sc-error" id="sc-err-${id}"></span>
      <button class="sc-save-btn" onclick="_shortcutsSaveEdit('${id}',${def.chord})">Guardar</button>
      <button class="sc-cancel-btn" onclick="_shortcutsRender()">Cancelar</button>
    </div>`;

  const input = document.getElementById(`sc-input-${id}`);
  if (input) { input.focus(); input.select(); }
}

// Captura de tecla en modo edición — para atajos simples, detecta la tecla en keydown
function _shortcutsCaptureKey(e, id, isChord) {
  if (e.key === 'Escape') { _shortcutsRender(); return; }
  if (e.key === 'Enter') { _shortcutsSaveEdit(id, isChord); return; }
  if (isChord) return; // chord: usuario escribe manualmente (g+t)
  // atajo simple: capturar la tecla presionada (1 char, sin modificadores no-shift)
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

  // Validar formato
  if (!raw) { if (errEl) errEl.textContent = 'Escribe una tecla'; return; }
  if (isChord && !/^g\+[a-z]$/.test(raw)) {
    if (errEl) errEl.textContent = 'Formato: g+letra (ej: g+t)'; return;
  }
  if (!isChord && (raw.length !== 1 || !/[a-z]/.test(raw))) {
    if (errEl) errEl.textContent = 'Solo una letra (a-z)'; return;
  }

  // Verificar conflicto
  const conflict = _shortcutConflict(raw, id);
  if (conflict) {
    const conflictDef = _SHORTCUT_DEFS.find(d => d.id === conflict);
    if (errEl) errEl.textContent = `Conflicto con: ${conflictDef ? conflictDef.label : conflict}`;
    return;
  }

  const def = _SHORTCUT_DEFS.find(d => d.id === id);
  const overrides = _shortcutsLoad();
  if (raw === def.default) {
    delete overrides[id]; // restaurar = eliminar override
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

function restoreDefaultShortcuts() {
  localStorage.removeItem(_SHORTCUTS_KEY);
  _saveUserPrefs(); // R-4: sincronizar reset a Supabase
  _shortcutsRender();
}

function openShortcuts() {
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) {
    overlay.classList.remove('is-hidden');
    _shortcutsRender();
    _focusFirstInteractive('shortcuts-panel');
  }
}

function closeShortcuts(e) {
  if (e && e.target !== document.getElementById('shortcuts-overlay')) return;
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) overlay.classList.add('is-hidden');
}

// DUP-03: openShortcutsRef y closeShortcutsRef redirigen a #shortcuts-overlay
// Todos los triggers (⌘?, command palette, ESC handler) siguen funcionando sin cambios
function openShortcutsRef() { openShortcuts(); }
function closeShortcutsRef(e) { closeShortcuts(e); }

// ── Integración con el handler global de keydown ─────────────────────────
// Helpers para resolver teclas activas desde el handler existente

function _sk(id) { return _shortcutKey(id); }  // shorthand interno

// ── END T-202605-442 ─────────────────────────────────────────────────────

const _modalTriggerMap = new Map(); // modal id → elemento que tenía foco antes de abrir

function _saveModalTrigger(id) {
  const active = document.activeElement;
  if (active && active !== document.body) _modalTriggerMap.set(id, active);
}

function _restoreModalFocus(id) {
  const trigger = _modalTriggerMap.get(id);
  if (trigger && typeof trigger.focus === 'function') {
    try { trigger.focus(); } catch(_) {}
  }
  _modalTriggerMap.delete(id);
}

function _focusFirstInteractive(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const sel = 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])';
  const el = container.querySelector(sel);
  if (el) setTimeout(() => el.focus(), 50);
}

// T-202604-295: trigger de descarga de templates — 'session' (default) | 'sprint'
const _TPL_TRIGGER_KEY = 'template-download-trigger';
function _templateTrigger() {
  return localStorage.getItem(_TPL_TRIGGER_KEY) || 'session';
}
function _autoDownloadOn() {
  // Backward compat — ON si trigger es 'session' (comportamiento original)
  return _templateTrigger() === 'session';
}
function toggleAutoDownload() {
  const next = _templateTrigger() === 'session' ? 'sprint' : 'session';
  localStorage.setItem(_TPL_TRIGGER_KEY, next);
  _saveUserPrefs(); // R-4: sincronizar preferencia a Supabase
  _updateAutoDownloadLabel();
}
function _updateAutoDownloadLabel() {
  const btn = document.getElementById('more-menu-autodl');
  if (btn) btn.textContent = `⬇ Descargar templates: ${_templateTrigger() === 'session' ? 'al guardar sesión' : 'al cerrar sprint'}`;
}
// Inicializar label al cargar
(function _initAutoDlLabel() {
  const btn = document.getElementById('more-menu-autodl');
  if (btn) btn.textContent = `⬇ Descargar templates: ${_templateTrigger() === 'session' ? 'al guardar sesión' : 'al cerrar sprint'}`;
})();


(function _initSearchTooltip() {
  const si = document.getElementById('search-global');
  if (!si) return;
  const container = si.closest('.header-search');
  if (!container) return;
  const btn = container.querySelector('button, [role="button"]');
  if (btn && !btn.title) btn.title = 'Ctrl+F';
})();

// Click fuera del card activo para salir
document.addEventListener('click', e => {
  if (!focusActiveId) return;
  const activeCard = document.getElementById('card-' + focusActiveId);
  if (activeCard && !activeCard.contains(e.target)) exitFocusMode();
}, true);

// ── T-052: Vista Hoy ──
// ─── Utilidad countdown para tab Hoy ─────────────────────────────────────────
function _hoyMsUntilReset(ai) {
  if (!ai.resetTime) return Infinity;
  const [h, m] = ai.resetTime.split(':').map(Number);
  const r = new Date(); r.setHours(h, m, 0, 0);
  if (r <= new Date()) r.setDate(r.getDate() + 1);
  return r - new Date();
}

function _hoyCountdownLabel(ms) {
  if (!isFinite(ms) || ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function _hoyGetProjName(ai) {
  const lastSess = getLastAISession(ai.id);
  if (!lastSess || !lastSess.projectId) return '';
  const proj = getProjectById(lastSess.projectId);
  if (!proj) return '';
  return (proj.icon ? proj.icon + ' ' : '') + proj.name;
}

// Tiempo que lleva disponible — última sesión más antigua = primero
function _hoyAvailableSince(ai) {
  const last = getLastAISession(ai.id);
  if (!last || !last.date) return 0;
  return new Date(last.date).getTime();
}

// Ticker global para countdowns en tab Hoy
let _hoyTickerInterval = null;
function _startHoyTicker() {
  _stopHoyTicker();
  _hoyTickerInterval = setInterval(() => {
    if (currentTab !== 'hoy') { _stopHoyTicker(); return; }
    document.querySelectorAll('[data-hoy-ai-id]').forEach(el => {
      const ai = getAI(el.dataset.hoyAiId);
      if (!ai || ai.status !== 'exhausted') return;
      const ms = _hoyMsUntilReset(ai);
      const cdEl = el.querySelector('.hoy-exh-countdown');
      if (!cdEl) return;
      cdEl.textContent = _hoyCountdownLabel(ms);
      cdEl.classList.toggle('soon', ms < 30 * 60000);
      if (ms <= 0) renderHoy();
    });
  }, 1000);
}
function _stopHoyTicker() {
  if (_hoyTickerInterval) { clearInterval(_hoyTickerInterval); _hoyTickerInterval = null; }
}

// Ticker de countdown para IAs agotadas en el sidebar del Tab Tracker
let _sidebarTickerInterval = null;
function _startSidebarTicker() {
  _stopSidebarTicker();
  _sidebarTickerInterval = setInterval(() => {
    const exhausted = state.ais.filter(ai => !ai.archived && ai.status === 'exhausted' && ai.resetTime);
    if (!exhausted.length) { _stopSidebarTicker(); return; }
    let anyExpired = false;
    exhausted.forEach(ai => {
      const el = document.getElementById('tsb-row-' + ai.id);
      if (el) {
        let cdEl = el.querySelector('.tsb-ai-cd');
        const [hh, mm] = ai.resetTime.split(':').map(Number);
        const now = new Date();
        const reset = new Date(now); reset.setHours(hh, mm, 0, 0);
        if (reset <= now) reset.setDate(reset.getDate() + 1);
        const diff = Math.max(0, Math.round((reset - now) / 60000));
        if (diff === 0) { anyExpired = true; }
        else {
          const h = Math.floor(diff / 60), m = diff % 60;
          const label = `${h}h${String(m).padStart(2,'0')}`;
          if (!cdEl) { cdEl = document.createElement('span'); cdEl.className = 'tsb-ai-cd'; el.appendChild(cdEl); }
          cdEl.textContent = label;
        }
      }
      // T-202604-254: update radar sidebar countdown
      const rsbCard = document.getElementById('rsb-card-' + ai.id);
      if (rsbCard) {
        const cdEl = rsbCard.querySelector('.rsb-countdown');
        if (cdEl) { cdEl.textContent = getCD(ai.resetTime, ai.resetEpoch) || '--:--:--'; }
      }
      // B-255: update card unlock label in real time
      const unlockLblEl = document.getElementById('unlock-lbl-' + ai.id);
      if (unlockLblEl) {
        const msLeft = _hoyMsUntilReset(ai);
        if (!isFinite(msLeft) || msLeft <= 0) {
          unlockLblEl.textContent = 'Disponible ahora';
        } else {
          const totalMin = Math.floor(msLeft / 60000);
          const h = Math.floor(totalMin / 60);
          const m = totalMin % 60;
          unlockLblEl.textContent = h === 0
            ? `Disponible en ${m}min`
            : `Disponible en ${h}h ${String(m).padStart(2,'0')}min`;
        }
      }
    });
    if (anyExpired) { render(); }
  }, 1000); // T-202604-302: cada 1s — countdown live sin interacción
}
function _stopSidebarTicker() {
  if (_sidebarTickerInterval) { clearInterval(_sidebarTickerInterval); _sidebarTickerInterval = null; }
}

// T-202604-324: mini progress dots del ecosistema en el header nav
function renderProjDots() {
  // Eliminado — ruido con pocos proyectos activos
}

function renderHoy() {
  const el = document.getElementById('hoy-content');
  if (!el) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const allSess = getAllSessions();

  // ── Stats: Hoy / Semana / Mes / Total ──────────────────────────────────
  function _wkStart(offsetWeeks) {
    const d = new Date(now); const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day) + offsetWeeks * 7); d.setHours(0,0,0,0); return d;
  }
  function _moStart(offsetMonths) {
    return new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1, 0, 0, 0, 0);
  }
  const wkFrom  = _wkStart(0).getTime();  const wkPrev = _wkStart(-1).getTime();
  const moFrom  = _moStart(0).getTime();  const moPrev = _moStart(-1).getTime(); const moPrevEnd = _moStart(0).getTime() - 1;
  const dayFrom = new Date(now).setHours(0,0,0,0);
  const prevDayFrom = dayFrom - 86400000;

  const sHoy  = allSess.filter(s => s.date && new Date(s.date).getTime() >= dayFrom).length;
  const sHoyPrev = allSess.filter(s => { const t = s.date && new Date(s.date).getTime(); return t && t >= prevDayFrom && t < dayFrom; }).length;
  const sSemC = allSess.filter(s => s.date && new Date(s.date).getTime() >= wkFrom).length;
  const sSemP = allSess.filter(s => { const t = s.date && new Date(s.date).getTime(); return t && t >= wkPrev && t < wkFrom; }).length;
  const sMesC = allSess.filter(s => s.date && new Date(s.date).getTime() >= moFrom).length;
  const sMesP = allSess.filter(s => { const t = s.date && new Date(s.date).getTime(); return t && t >= moPrev && t < moPrevEnd; }).length;
  const sTotal = allSess.length;

  function _delta(curr, prev) {
    const d = curr - prev;
    if (d > 0) return `<span class="radar-delta radar-delta--up">+${d}</span>`;
    if (d < 0) return `<span class="radar-delta radar-delta--neutral">${d}</span>`;
    return `<span class="radar-delta radar-delta--neutral">=</span>`;
  }

  // ── Último checkpoint global ───────────────────────────────────────────
  const allSessSorted = [...allSess].filter(s => s.date).sort((a,b) => new Date(b.date) - new Date(a.date));
  const lastCkpt = allSessSorted.length ? allSessSorted[0] : null;
  function _lastCkptLabel() {
    if (!lastCkpt) return '—';
    const d = new Date(lastCkpt.date);
    if (isNaN(d)) return '—';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return 'ahora';
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `${diffH}h`;
    return `${Math.floor(diffH/24)}d`;
  }

  // ── Proyecto más activo del mes ─────────────────────────────────────────
  const activeProjects = (state.projects || []).filter(p => p.status !== 'paused' && (p.sessions || []).length > 0);
  const projMonthStats = activeProjects.map(p => ({
    name: (p.icon ? p.icon + ' ' : '') + p.name,
    count: (p.sessions || []).filter(s => s.date && new Date(s.date).getTime() >= moFrom).length
  })).filter(p => p.count > 0).sort((a,b) => b.count - a.count);
  const topProj = projMonthStats[0] || null;

  // ── Racha de días activos ───────────────────────────────────────────────
  function _calcStreak() {
    const dayKeys = new Set(allSess.filter(s => s.date).map(s => s.date.split('T')[0]));
    let streak = 0;
    const d = new Date(now);
    // if no session today, start checking from yesterday
    const todayKey = d.toISOString().split('T')[0];
    if (!dayKeys.has(todayKey)) { d.setDate(d.getDate() - 1); }
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (!dayKeys.has(key)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }
  const streak = _calcStreak();

  // ── Hora pico ───────────────────────────────────────────────────────────
  function _peakHour() {
    const counts = new Array(24).fill(0);
    allSess.filter(s => s.date).forEach(s => {
      const h = new Date(s.date).getHours();
      if (!isNaN(h)) counts[h]++;
    });
    const max = Math.max(...counts);
    if (max === 0) return null;
    const h = counts.indexOf(max);
    const ampm = h < 12 ? 'am' : 'pm';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { label: `${h12}${ampm}`, count: max };
  }
  const peak = _peakHour();

  // ── Sesiones completas vs quick ─────────────────────────────────────────
  const completas = allSess.filter(s => !s.quickCapture).length;
  const rapidas   = allSess.filter(s => s.quickCapture).length;

  // ── Promedio de sesiones por día activo ────────────────────────────────
  function _avgPerActiveDay() {
    const dayKeys = new Set(allSess.filter(s => s.date).map(s => s.date.split('T')[0]));
    if (!dayKeys.size) return '—';
    return (allSess.length / dayKeys.size).toFixed(1);
  }
  const avgPerDay = _avgPerActiveDay();

  // ── Stats grid ─────────────────────────────────────────────────────────
  const statsHTML = `<div class="radar-stats-grid">
    <div class="radar-card radar-card-accent">
      <div class="radar-card-label">Último checkpoint</div>
      <div class="radar-card-value">${_lastCkptLabel()}</div>
      <div class="radar-card-sub">${lastCkpt ? esc(lastCkpt.title || '').slice(0,28) || '—' : '—'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Hoy ${_delta(sHoy, sHoyPrev)}</div>
      <div class="radar-card-value">${sHoy}</div>
      <div class="radar-card-sub">semana: ${sSemC} ${_delta(sSemC, sSemP)}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Este mes ${_delta(sMesC, sMesP)}</div>
      <div class="radar-card-value">${sMesC}</div>
      <div class="radar-card-sub">total: ${sTotal} sesiones</div>
    </div>
    <div class="radar-card${streak >= 3 ? ' radar-card-streak' : ''}">
      <div class="radar-card-label">Racha activa</div>
      <div class="radar-card-value">${streak}<span class="radar-streak-unit">${streak === 1 ? 'día' : 'días'}</span></div>
      <div class="radar-card-sub">${streak >= 7 ? '🔥 Semana completa' : streak >= 3 ? '✨ En racha' : streak > 0 ? 'sigue así' : 'sin sesiones hoy'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Proyecto del mes</div>
      <div class="radar-card-value radar-card-value--sm radar-card-value--truncate">${topProj ? esc(topProj.name).slice(0,18) : '—'}</div>
      <div class="radar-card-sub">${topProj ? topProj.count + ' checkpoints' : 'sin actividad'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Hora pico</div>
      <div class="radar-card-value">${peak ? peak.label : '—'}</div>
      <div class="radar-card-sub">${peak ? peak.count + ' sesiones a esa hora' : 'sin datos'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Completas / Rápidas</div>
      <div class="radar-card-value radar-card-value--sm">${completas}<span class="radar-card-value-secondary"> / ${rapidas}</span></div>
      <div class="radar-card-sub">${sTotal ? Math.round(completas/sTotal*100) + '% con protocolo' : '—'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Promedio / día activo</div>
      <div class="radar-card-value">${avgPerDay}</div>
      <div class="radar-card-sub">sesiones por día con actividad</div>
    </div>
  </div>`;

  // ── Clasificar IAs ────────────────────────────────────────────────────────
  const allAIs = state.ais.filter(a => !a.archived);
  const interrupted = allAIs.filter(a => a.interrupted);
  // T-182: En curso = IAs con draft activo (estado morado), excluidas de Disponibles
  const inSession   = allAIs.filter(a => !a.interrupted && _isInSession(a));
  const available   = allAIs
    .filter(a => a.status === 'available' && !a.interrupted && !_isInSession(a))
    .sort((a, b) => _hoyAvailableSince(a) - _hoyAvailableSince(b)); // más antigua primero
  const exhausted   = allAIs
    .filter(a => a.status === 'exhausted' && !a.interrupted)
    .sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b));   // próxima a liberarse primero

  let html = statsHTML;

  // ── Interrumpidas — mini-card naranja ────────────────────────────────────
  if (interrupted.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🟠 En curso (${interrupted.length})</div>
      <div class="hoy-available-grid">`;
    interrupted.forEach((ai, i) => { html += buildHoyCard(ai, i); });
    html += `</div></div>`;
  }

  // ── En curso — IAs con draft activo / estado morado (T-182) ─────────────
  if (inSession.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🟣 En curso (${inSession.length})</div>
      <div class="hoy-available-grid">`;
    inSession.forEach((ai, i) => { html += buildHoyCard(ai, i, { inSession: true }); });
    html += `</div></div>`;
  }

  // ── Disponibles — mini-card ──────────────────────────────────────────────
  if (available.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🟢 Disponibles (${available.length})</div>
      <div class="hoy-available-grid">`;
    available.forEach((ai, i) => { html += buildHoyCard(ai, i); });
    html += `</div></div>`;
  }

  // ── Agotadas — nuevo formato mini-card ───────────────────────────────────
  if (exhausted.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🔴 Agotadas (${exhausted.length}) — próxima primero</div>
      <div class="hoy-available-grid">`;
    exhausted.forEach((ai, i) => { html += buildHoyCard(ai, i); });
    html += `</div></div>`;
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  // T-202604-207: si no hay IAs en absoluto → empty state con CTA
  if (allAIs.length === 0) {
    html += `<div class="hoy-empty">
      <span class="hoy-empty-icon">🤖</span>
      <div class="hoy-empty-msg">Aún no tienes IAs registradas.</div>
      <button class="btn-primary" onclick="openAddAI()">+ Agregar primera IA</button>
    </div>`;
  } else if (!interrupted.length && !inSession.length && !available.length && !exhausted.length) {
    html += `<div class="hoy-empty"><span class="hoy-empty-icon">✨</span>No hay IAs registradas aún.</div>`;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  {
    const nextExh = exhausted.find(a => a.resetTime);
    const nextLabel = nextExh ? (() => {
      const ms = _hoyMsUntilReset(nextExh);
      const m = Math.floor(ms/60000); const h = Math.floor(m/60); const rm = m%60;
      return h > 0 ? `${h}h ${rm}m` : `${rm}min`;
    })() : null;
    const today = now.toLocaleDateString('es-MX', {weekday:'long', day:'numeric', month:'long'});
    html += `<div class="radar-footer">
      <span>${today}</span>
      <span>${nextLabel ? `⏳ próxima IA en ${nextLabel} (${esc(nextExh.name)})` : '✓ todas las IAs disponibles'}</span>
      <span class="radar-footer-version">${_effectiveVersion()}</span>
    </div>`;
  }

  el.innerHTML = html;
  // CSS Purity: animation-delay calculado en runtime → setProperty post-render
  el.querySelectorAll('[data-anim-delay]').forEach(card => {
    card.style.setProperty('animation-delay', card.dataset.animDelay + 'ms');
  });
  _startHoyTicker();
}


// T-202604-052: Selector de IA para captura rápida desde tab Hoy
// R-[pendiente-ID]: selectAIForQuickCapture reemplazado — openQuickCapture() sin id
// maneja skip si worker único y Paso 1 si múltiples
function selectAIForQuickCapture() {
  const available = (state.ais || []).filter(a => !a.archived);
  if (!available.length) {
    showToast('warning', 'Sin Workers disponibles — todos agotados');
    return;
  }
  openQuickCapture();
}


// T-202604-215: Labels de status en español — fuente de verdad para UI
const STATUS_LABELS = {
  available:    'Disponible',
  exhausted:    'Agotada',
  insession:    'En curso',
  interrupted:  'Interrumpida'
};

const TG_PARSER_CONFIG = {
  TYPES: ['P', 'T', 'R', 'B'],
  TYPE_NAMES: { P: 'Ideas', T: 'Tickets', R: 'Requerimientos', B: 'Bugs' },
  STATUS_ALIASES: {
    'pendiente':'📤 Pendiente', '📤 pendiente':'📤 Pendiente',
    'backlog':'⏳ Backlog', '⏳ backlog':'⏳ Backlog',
    'done':'✅ DONE', '✅ done':'✅ DONE', 'listo':'✅ DONE',
    'en progreso':'🔄 En progreso', '🔄 en progreso':'🔄 En progreso',
    'in-progress':'🔄 En progreso', 'progreso':'🔄 En progreso',
    'descartado':'🗑 Descartado', '🗑 descartado':'🗑 Descartado'
  }
};

function normStatus(raw) {
  if (!raw) return '📤 Pendiente';
  const key = raw.trim().toLowerCase();
  const resolved = TG_PARSER_CONFIG.STATUS_ALIASES[key];
  if (!resolved) {
    console.warn('[AI Tracker] normStatus: status desconocido "' + raw.trim() + '" — usando "📤 Pendiente"');
    return '📤 Pendiente';
  }
  return resolved;
}
function buildTGPreview(items, discrepancy) {
  if (!items.length && !discrepancy) return '';
  let html = `<div class="preview-tg">
    <div class="preview-tg-header">
      <div class="preview-tg-header-label">📋 Items detectados</div>
      <div class="preview-tg-header-count">${items.length} ítem${items.length !== 1 ? 's' : ''}</div>
    </div>`;
  if (discrepancy) {
    html += `<div class="preview-tg-discrepancy">
      ⚠ ${discrepancy.raw} línea${discrepancy.raw !== 1 ? 's' : ''} en el texto — solo ${discrepancy.parsed} parseada${discrepancy.parsed !== 1 ? 's' : ''}. Verifica el formato de las líneas no detectadas.
    </div>`;
  }
  html += `<div class="preview-tg-badges-row">`;
  TG_PARSER_CONFIG.TYPES.forEach(type => {
    const count = items.filter(x => x.type === type).length;
    if (count) html += `<span class="preview-tg-badge ${type}" title="${TG_PARSER_CONFIG.TYPE_NAMES[type]} (${count})">${type} ${count}</span>`;
  });
  html += `</div>`;
  items.forEach(item => {
    const existing = (getActiveTracker().items || []).find(x => x.code === item.code);
    const tag = existing
      ? `<span class="preview-tg-tag update">↑ actualizar</span>`
      : `<span class="preview-tg-tag new">+ nuevo</span>`;
    // T-202605-436 AC4: indicador visual para ítems nuevos sin AC
    const noAcTag = (!existing && (!item.ac || item.ac.length === 0))
      ? `<span class="preview-tg-tag preview-tg-tag--warn" title="Ítem nuevo sin criterios de aceptación">sin AC</span>`
      : '';
    html += `<div class="preview-tg-row">
      <span class="preview-tg-badge ${item.type}">${item.type}</span>
      <span class="preview-tg-code">${esc(item.code)}</span>
      <span class="preview-tg-desc">${esc(item.title)}${tag}${noAcTag}</span>
      <span class="preview-tg-status">${esc(item.status)}</span>
    </div>`;
  });
  html += `</div>`;
  return html;
}

// ── B-202604-094: Corregir hora de desbloqueo desde card ──
let _correctHoraAIId = null;

function openCorrectHora(id) {
  const ai = getAI(id);
  if (!ai) return;
  _correctHoraAIId = id;

  // Reutilizar el generic confirm modal como contenedor de input
  const modal = document.getElementById('gconfirm-overlay');
  const title = document.getElementById('gconfirm-title');
  const msg = document.getElementById('gconfirm-msg');
  const okBtn = document.getElementById('gconfirm-ok-btn');
  if (!modal) return;

  title.textContent = '⏰ Corregir hora de desbloqueo';
  // Ocultar el input-wrap del modal genérico (usado por _gconfirmOpen)
  const inputWrap = document.getElementById('gconfirm-input-wrap');
  if (inputWrap) inputWrap.classList.add('is-hidden');

  const currentLabel = ai.resetTime ? fmt12(ai.resetTime) : '(sin hora)';
  msg.innerHTML = `
    <div class="correct-hora-current">Hora actual: <strong>${esc(currentLabel)}</strong></div>
    <div class="correct-hora-input-row">
      <input id="correct-hora-input" class="hora-input correct-hora-input" type="text" maxlength="4" placeholder="--:--"
        oninput="(function(){
          const raw=(document.getElementById('correct-hora-input')||{}).value.replace(/\\D/g,'');
          const disp=document.getElementById('correct-hora-disp');
          const r=interpretHora(raw);
          if(disp){disp.textContent=r?r.label:(raw.length>=3?'hora inválida':(raw.length?'...':'—'));disp.className=r?'hora-disp--valid':(raw.length>=3?'hora-disp--error':'hora-disp--hint');}
        })()"
        onkeydown="if(event.key==='Enter'){event.preventDefault();confirmCorrectHora();}">
      <div id="correct-hora-disp" class="correct-hora-disp">—</div>
    </div>
    <div class="correct-hora-unlock-row">
      <button class="btn-ghost correct-hora-unlock-btn" onclick="unlockNowFromCard()">✅ Desbloquear ahora</button>
    </div>`;

  okBtn.textContent = 'Guardar';
  okBtn.className = 'btn-primary';
  okBtn.onclick = confirmCorrectHora;
  // Reasignar cancel button del modal genérico
  const cancelBtn = modal.querySelector('button:not(#gconfirm-ok-btn)');
  if (cancelBtn) cancelBtn.onclick = () => { _correctHoraAIId = null; modal.classList.remove('open'); };

  // B-202604-094 fix: diferir classList.add('open') al siguiente tick para evitar
  // que el click que originó esta llamada sea interpretado como click-outside
  // por el listener de _gconfirmOpen y cierre el modal inmediatamente.
  setTimeout(() => {
    modal.classList.add('open');
    setTimeout(() => {
      const inp = document.getElementById('correct-hora-input');
      if (inp) {
        // Precargar hora actual si existe
        if (ai.resetTime) inp.value = ai.resetTime.replace(':', '');
        inp.focus(); inp.select();
        // Disparar oninput para mostrar la hora precargada
        inp.dispatchEvent(new Event('input'));
      }
    }, 50);
  }, 0);
}

function confirmCorrectHora() {
  const id = _correctHoraAIId;
  if (!id) return;
  const ai = getAI(id);
  if (!ai) return;
  const inp = document.getElementById('correct-hora-input');
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);

  if (result) {
    ai.resetTime = result.hhmm;
    ai.resetEpoch = result.epoch;
    // Actualizar resetAt en la sesión más reciente
    const aiSessions = getAISessions(id);
    if (aiSessions.length > 0) {
      const lastSess = aiSessions[aiSessions.length - 1];
      lastSess.resetAt = result.label;
    }
    save(); render();
    if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
  } else {
    // Hora inválida — mantener modal abierto sin toast
    inp.classList.add('error');
    setTimeout(() => inp.classList.remove('error'), 1200);
    return; // No cerrar modal
  }

  _correctHoraAIId = null;
  const modal = document.getElementById('gconfirm-overlay');
  if (modal) modal.classList.remove('open');
}

function unlockNowFromCard() {
  const id = _correctHoraAIId;
  if (!id) return;
  const ai = getAI(id);
  if (!ai) return;
  ai.status = 'available';
  ai.resetTime = '';
  ai.resetEpoch = null;
  _correctHoraAIId = null;
  const modal = document.getElementById('gconfirm-overlay');
  if (modal) modal.classList.remove('open');
  save(); render();
  if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
}

// ══ T-202604-268 / T-202604-270: QUICK NOTE ══
let _quickNoteAC = null; // autocomplete state
let _quickNoteEditId = null; // id of note being edited, null = create mode

function openQuickNote(editId) {
  const modal = document.getElementById('quick-note-modal');
  if (!modal) return;
  _quickNoteEditId = editId || null;
  _quickNoteAC = null;
  // Populate fields
  if (_quickNoteEditId) {
    const note = (state.quickNotes || []).find(n => n.id === _quickNoteEditId);
    if (!note) return;
    document.getElementById('qn-text').value = note.text || '';
    document.getElementById('qn-ref').value = note.itemRef || '';
    document.getElementById('qn-title').textContent = '✏️ Editar nota';
    document.getElementById('qn-delete-btn').classList.add('qn-delete-btn--visible');
    document.getElementById('qn-delete-confirm').classList.remove('qn-delete-confirm--visible');
  } else {
    document.getElementById('qn-text').value = '';
    document.getElementById('qn-ref').value = '';
    document.getElementById('qn-title').textContent = '✏️ Nota rápida';
    document.getElementById('qn-delete-btn').classList.remove('qn-delete-btn--visible');
    document.getElementById('qn-delete-confirm').classList.remove('qn-delete-confirm--visible');
  }
  document.getElementById('qn-ac-list').innerHTML = '';
  document.getElementById('qn-ac-list').classList.remove('qn-ac-list--visible');
  modal.classList.add('open');
  setTimeout(() => document.getElementById('qn-text').focus(), 80);
}
// B-202605-005: exponer en window para que módulos de búsqueda y panel de proyecto puedan invocarla vía onclick inline
window.openQuickNote = openQuickNote;

function closeQuickNote() {
  const modal = document.getElementById('quick-note-modal');
  if (modal) modal.classList.remove('open');
  _quickNoteAC = null;
  _quickNoteEditId = null;
}

function saveQuickNote() {
  const text = (document.getElementById('qn-text').value || '').trim();
  if (!text) { document.getElementById('qn-text').focus(); return; }
  const itemRef = (document.getElementById('qn-ref').value || '').trim();
  if (!state.quickNotes) state.quickNotes = [];
  if (_quickNoteEditId) {
    // Edit mode — update in place
    const note = state.quickNotes.find(n => n.id === _quickNoteEditId);
    if (note) { note.text = text; note.itemRef = itemRef; note.updatedAt = new Date().toISOString(); }
    save();
  } else {
    // Create mode
    state.quickNotes.unshift({ id: 'qn-' + Date.now(), text, itemRef: itemRef || '', createdAt: new Date().toISOString() });
    save();
  }
  closeQuickNote();
  if (typeof _refreshProjectNotes === 'function') _refreshProjectNotes();
}

function qnRequestDelete() {
  document.getElementById('qn-delete-confirm').classList.add('qn-delete-confirm--visible');
  document.getElementById('qn-delete-btn').classList.remove('qn-delete-btn--visible');
}

function qnCancelDelete() {
  document.getElementById('qn-delete-confirm').classList.remove('qn-delete-confirm--visible');
  document.getElementById('qn-delete-btn').classList.add('qn-delete-btn--visible');
}

function qnConfirmDelete() {
  if (!_quickNoteEditId) return;
  state.quickNotes = (state.quickNotes || []).filter(n => n.id !== _quickNoteEditId);
  save();
  closeQuickNote();
  if (typeof _refreshProjectNotes === 'function') _refreshProjectNotes();
}

function _qnRefInput(val) {
  const list = document.getElementById('qn-ac-list');
  const q = val.trim().toLowerCase();
  if (!q || !list) { if (list) { list.innerHTML = ''; list.classList.remove('qn-ac-list--visible'); } return; }
  const matches = (typeof ITEMS !== 'undefined' ? ITEMS : [])
    .filter(i => {
      const code = (i.code || '').toLowerCase();
      const title = (i.title || '').toLowerCase();
      return code.includes(q) || title.includes(q);
    })
    .slice(0, 6);
  if (!matches.length) { list.innerHTML = ''; list.classList.remove('qn-ac-list--visible'); return; }
  list.innerHTML = matches.map(i =>
    `<div class="qn-ac-item" onclick="_qnSelectAC('${esc(i.code)}')">
      <span class="qn-ac-code">${esc(i.code)}</span>
      <span class="qn-ac-desc">${esc((i.title || '').slice(0,60))}</span>
    </div>`
  ).join('');
  list.classList.add('qn-ac-list--visible');
}

function _qnSelectAC(code) {
  document.getElementById('qn-ref').value = code;
  const list = document.getElementById('qn-ac-list');
  if (list) { list.innerHTML = ''; list.classList.remove('qn-ac-list--visible'); }
}

function _qnRefKeydown(e) {
  if (e.key === 'Enter') { e.preventDefault(); saveQuickNote(); }
  if (e.key === 'Escape') closeQuickNote();
}

function _qnTextKeydown(e) {
  if (e.key === 'Escape') closeQuickNote();
}
// ══ END T-202604-268 ══

function _qnOverlayClick(e) {
  if (e.target.id === 'quick-note-modal') closeQuickNote();
}

// T-202604-269: navegar a ítem en Backlog desde badge de nota
function _qnNavToItem(code) {
  if (!code) return;
  switchTab('backlog');
  if (typeof switchSubTab === 'function') switchSubTab('backlog');
  setTimeout(() => {
    // Intentar scroll al ítem por data-code
    const el = document.querySelector(`[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('backlog-item--highlight');
      setTimeout(() => el.classList.remove('backlog-item--highlight'), 1800);
    }
  }, 220);
}

// T-202604-299: beforeunload → en locus-storage.js

// ─── R-202604-036: showMergeDiffPanel — visualizador de ítems al parsear paste ───
// Reemplaza T-202604-201 (panel diff genérico)
// Muestra tabla de ítems con: código, tipo, título, status resultante,
// datos de backlog si existe, campos inline si es nuevo, checkbox excluir, Ver en Backlog

let _itemVizPendingCb = null;
let _itemVizItems     = null;
let _itemVizSessId    = null;
let _itemVizProjId    = null;
// Estado de exclusiones — set de índices excluidos
let _itemVizExcluded  = new Set();
let _itemVizKeyHandler = null; // T-202605-429: ref al handler Enter para limpieza en close

function showMergeDiffPanel(tgItems, sessId, projId, onConfirm) {
  if (!tgItems || !tgItems.length) { onConfirm(); return; }

  _itemVizPendingCb = onConfirm;
  _itemVizItems     = tgItems;
  _itemVizSessId    = sessId;
  _itemVizProjId    = projId;
  _itemVizExcluded  = new Set();

  // AC: auto-excluir ítems sin cambios — se ignorarán al guardar (AC-3)
  tgItems.forEach((item, idx) => {
    const bk = (typeof ITEMS !== 'undefined') ? ITEMS.find(i => i.code === item.code) || null : null;
    if (bk) {
      const unchanged =
        bk.status === item.status &&
        (bk.title || bk.desc || '') === (item.desc || item.title || '') &&
        String(bk.priority || '') === String(item.priority || '') &&
        String(bk.effort || '') === String(item.effort || '') &&
        JSON.stringify(bk.ac || []) === JSON.stringify(item.ac || []);
      if (unchanged) _itemVizExcluded.add(idx);
    }
  });

  _itemVizRender();

  const overlay = document.getElementById('item-viz-overlay');
  if (overlay) {
    overlay.classList.remove('closing');
    overlay.classList.add('open', 'item-viz--flex');
  }

  // T-202605-429: Enter confirma cuando el foco está en el panel — no dispara desde inputs
  const _vizKeyHandler = (e) => {
    if (e.key !== 'Enter') return;
    const tag = (document.activeElement || {}).tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    document.removeEventListener('keydown', _vizKeyHandler);
    _itemVizConfirm();
  };
  document.addEventListener('keydown', _vizKeyHandler);
  // Guardar ref para poder limpiar en _itemVizClose
  _itemVizKeyHandler = _vizKeyHandler;
}

function _itemVizClose() {
  const overlay = document.getElementById('item-viz-overlay');
  if (overlay) {
    overlay.classList.add('closing');
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.classList.remove('closing', 'item-viz--flex');
    }, 220);
  }
  _itemVizPendingCb = null;
  _itemVizItems = null;
  _itemVizExcluded = new Set();
  // T-202605-429: limpiar handler Enter si quedó registrado
  if (_itemVizKeyHandler) {
    document.removeEventListener('keydown', _itemVizKeyHandler);
    _itemVizKeyHandler = null;
  }
}

function _itemVizConfirm() {
  if (!_itemVizPendingCb || !_itemVizItems) return;
  // Mutar el array original in-place — el closure en session.js tiene referencia al mismo array
  const filtered = _itemVizItems.filter((_, i) => !_itemVizExcluded.has(i));
  _itemVizItems.splice(0, _itemVizItems.length, ...filtered);
  const cb = _itemVizPendingCb;
  _itemVizClose();
  cb();
}

function _itemVizToggleExclude(idx) {
  if (_itemVizExcluded.has(idx)) _itemVizExcluded.delete(idx);
  else _itemVizExcluded.add(idx);
  _itemVizRender();
}

function _itemVizToggleSinCambios() {
  const body    = document.getElementById('viz-sinc-body');
  const chevron = document.getElementById('viz-sinc-chevron');
  if (!body) return;
  const open = body.classList.toggle('viz-sinc-body--open');
  if (chevron) chevron.textContent = open ? '▾' : '▸';
}

function _itemVizNavBacklog(code) {
  _itemVizClose();
  if (typeof switchTab === 'function') switchTab('backlog');
  if (typeof switchSubTab === 'function') switchSubTab('backlog');
  setTimeout(() => {
    const el = document.querySelector(`[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bitem--nav-highlight');
      setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1800);
    }
  }, 220);
}

function _itemVizRender() {
  const body = document.getElementById('item-viz-body');
  const confirmBtn = document.getElementById('item-viz-confirm-btn');
  if (!body || !_itemVizItems) return;

  const items = _itemVizItems;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const _getBacklogItem = (code) => {
    if (typeof ITEMS === 'undefined') return null;
    return ITEMS.find(i => i.code === code) || null;
  };

  const _isSinCambio = (item) => {
    const bk = _getBacklogItem(item.code);
    if (!bk) return false;
    return bk.status === item.status &&
      (bk.title || bk.desc || '') === (item.desc || item.title || '') &&
      String(bk.priority || '') === String(item.priority || '') &&
      String(bk.effort   || '') === String(item.effort   || '') &&
      JSON.stringify(bk.ac || []) === JSON.stringify(item.ac || []);
  };

  const _typeColor = { P: '#7c6af7', T: '#2ecc78', R: '#38bdf8', B: '#e85555' };
  const _typeName  = { P: 'Idea',   T: 'Ticket', R: 'Req.',    B: 'Bug'     };

  const _mergeResultClass = (r) =>
    r === 'nuevo'      ? 'viz-status-new'       :
    r === 'actualizado'? 'viz-status-updated'    : 'viz-status-unchanged';

  const _mergeResultLabel = (r) =>
    r === 'nuevo'      ? 'nuevo'       :
    r === 'actualizado'? 'actualización': 'sin cambios';

  // AC-5 / AC-6: chips de campos afectados con conteo
  const _fieldDiffChips = (item, bk) => {
    if (!bk) return '';
    const chips = [];
    if (bk.status !== item.status)
      chips.push(`<span class="viz-field-chip">status</span>`);
    if ((bk.title || bk.desc || '') !== (item.desc || item.title || ''))
      chips.push(`<span class="viz-field-chip">desc</span>`);
    if (String(bk.priority || '') !== String(item.priority || ''))
      chips.push(`<span class="viz-field-chip">priority</span>`);
    if (String(bk.effort || '') !== String(item.effort || ''))
      chips.push(`<span class="viz-field-chip">effort</span>`);
    const oldAc = bk.ac || [], newAc = item.ac || [];
    if (JSON.stringify(oldAc) !== JSON.stringify(newAc)) {
      const added   = newAc.filter(a => !oldAc.includes(a)).length;
      const removed = oldAc.filter(a => !newAc.includes(a)).length;
      let label = 'ac';
      if (added)   label += ` +${added}`;
      if (removed) label += ` -${removed}`;
      chips.push(`<span class="viz-field-chip viz-field-chip--ac">${label}</span>`);
    }
    return chips.length ? `<div class="viz-field-diffs">${chips.join('')}</div>` : '';
  };

  // ── Clasificar ítems ─────────────────────────────────────────────────────
  const sinCambioIdxs = new Set(
    items.map((item, idx) => _isSinCambio(item) ? idx : -1).filter(i => i >= 0)
  );
  const activeItems    = items.filter((_, idx) => !sinCambioIdxs.has(idx));
  const sinCambioItems = items.filter((_, idx) =>  sinCambioIdxs.has(idx));

  // AC-4: contador excluye sin-cambios + exclusiones manuales
  const userExcluded = [..._itemVizExcluded].filter(idx => !sinCambioIdxs.has(idx));
  const toSave = activeItems.length - userExcluded.length;

  if (confirmBtn) {
    const note = sinCambioItems.length ? ` · ${sinCambioItems.length} sin cambios ignorados` : '';
    confirmBtn.textContent = userExcluded.length
      ? `Guardar sesión (${toSave} de ${activeItems.length})${note}`
      : `Guardar sesión (${toSave})${note}`;
  }

  // ── Builder de fila ──────────────────────────────────────────────────────
  const _buildRow = (item, idx, isSinCambio) => {
    const isExcluded = _itemVizExcluded.has(idx);
    const bkItem     = _getBacklogItem(item.code);
    const isReal     = /^[PTRB]-\d{6}-\d{3}/.test(item.code);

    const mergeResult = bkItem
      ? (isSinCambio ? 'sin cambio' : 'actualizado')
      : 'nuevo';

    const typeColor = _typeColor[item.type] || 'var(--accent)';
    const typeName  = _typeName[item.type]  || item.type;

    const bkBlock = bkItem ? `
      <div class="viz-bk-row">
        <span class="viz-bk-label">Backlog</span>
        <span class="viz-bk-status viz-bk-status--${bkItem.status}">${bkItem.status}</span>
        ${bkItem.sprint ? `<span class="viz-bk-chip">${esc(bkItem.sprint)}</span>` : ''}
        ${bkItem.effort ? `<span class="viz-bk-chip">e${bkItem.effort}</span>` : ''}
        ${!isSinCambio ? `<button class="viz-nav-btn" onclick="_itemVizNavBacklog('${esc(item.code)}')" title="Ver en Backlog">→ Backlog</button>` : ''}
      </div>` : '';

    const newBlock = (!bkItem && isReal) ? `
      <div class="viz-new-fields">
        ${item.effort ? `<span class="viz-new-chip">effort: ${item.effort}</span>` : ''}
        ${item.area   ? `<span class="viz-new-chip">area: ${esc(item.area)}</span>`   : ''}
        ${item.ac && item.ac.length ? `<div class="viz-new-ac"><span class="viz-new-chip viz-new-chip--ac">AC</span> ${item.ac.map(a => `<span class="viz-ac-item">${esc(a)}</span>`).join('')}</div>` : ''}
      </div>` : '';

    const fieldDiffs = mergeResult === 'actualizado' ? _fieldDiffChips(item, bkItem) : '';

    // T-202605-428: código real clickeable — copia al clipboard con feedback visual idéntico al backlog
    const codeDisplay = isReal
      ? `<button class="viz-code viz-code--real viz-code--copyable" data-type-color="${esc(typeColor)}" data-code="${esc(item.code)}" title="Click para copiar" onclick="_vizCopyCode(event,this)">${esc(item.code)}</button>`
      : `<span class="viz-code viz-code--pending">${esc(item.code)}</span>`;

    const checkboxHtml = !isSinCambio
      ? `<label class="viz-checkbox-wrap" title="${isExcluded ? 'Incluir en merge' : 'Excluir del merge'}">
          <input type="checkbox" class="viz-checkbox" ${isExcluded ? '' : 'checked'}
            onchange="_itemVizToggleExclude(${idx})">
         </label>`
      : `<span class="viz-sinc-icon">—</span>`;

    return `
      <div class="viz-row${isExcluded ? ' viz-row--excluded' : ''}${isSinCambio ? ' viz-row--sinc' : ''}" id="viz-row-${idx}">
        ${checkboxHtml}
        <div class="viz-type-badge" data-type-color="${esc(typeColor)}">${typeName}</div>
        <div class="viz-content">
          <div class="viz-row-top">
            ${codeDisplay}
            <span class="viz-desc">${esc(item.title || item.desc || item.status)}</span>
            <span class="viz-merge-result ${_mergeResultClass(mergeResult)}">${_mergeResultLabel(mergeResult)}</span>
          </div>
          <div class="viz-row-bottom">
            <span class="viz-status-incoming">→ ${esc(item.status)}</span>
            ${bkBlock}
            ${newBlock}
            ${fieldDiffs}
          </div>
        </div>
      </div>`;
  };

  // ── Renderizar filas activas ─────────────────────────────────────────────
  const activeRows = activeItems.map(item => _buildRow(item, items.indexOf(item), false)).join('');

  // ── Summary ──────────────────────────────────────────────────────────────
  const newCount = activeItems.filter(item => !_getBacklogItem(item.code)).length;
  const updCount = activeItems.filter(item =>  !!_getBacklogItem(item.code)).length;
  const summary = `<div class="viz-summary">
    ${newCount ? `<span class="viz-sum-chip viz-sum-new">${newCount} nuevo${newCount !== 1 ? 's' : ''}</span>` : ''}
    ${updCount ? `<span class="viz-sum-chip viz-sum-upd">${updCount} actualización${updCount !== 1 ? 'es' : ''}</span>` : ''}
    ${sinCambioItems.length ? `<span class="viz-sum-chip viz-sum-sinc">${sinCambioItems.length} sin cambios</span>` : ''}
  </div>`;

  // ── Grupo sin cambios — AC-1: colapsado por defecto ──────────────────────
  let sinCambioGroup = '';
  if (sinCambioItems.length) {
    const sinCambioRows = sinCambioItems.map(item => _buildRow(item, items.indexOf(item), true)).join('');
    sinCambioGroup = `
      <div class="viz-sinc-group" id="viz-sinc-group">
        <button class="viz-sinc-header" onclick="_itemVizToggleSinCambios()">
          <span class="viz-sinc-label">${sinCambioItems.length} ítem${sinCambioItems.length !== 1 ? 's' : ''} ya existen sin cambios — se ignorarán</span>
          <span class="viz-sinc-chevron" id="viz-sinc-chevron">▸</span>
        </button>
        <div class="viz-sinc-body" id="viz-sinc-body">
          ${sinCambioRows}
        </div>
      </div>`;
  }

  body.innerHTML = summary + `<div class="viz-rows">${activeRows}</div>` + sinCambioGroup;

  // CSS Purity: colores de tipo calculados en runtime → custom properties CSS (B-202605-055)
  body.querySelectorAll('[data-type-color]').forEach(el => {
    const color = el.dataset.typeColor;
    if (el.classList.contains('viz-type-badge')) {
      el.style.setProperty('--viz-type-bg', color + '22');
      el.style.setProperty('--viz-type-color', color);
      el.style.setProperty('--viz-type-border', color + '44');
    } else {
      el.style.setProperty('--viz-type-color', color);
    }
  });
}

// B-202605-505: helper de copia segura — garantiza que el ghost textarea recibe el foco
// antes de execCommand('copy') para evitar que el portapapeles del usuario quede
// sobreescrito con el contenido del textarea activo (ej: CHECKPOINT en edición).
function _copyTextSafe(text) {
  const prev = document.activeElement;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.className = 'clipboard-ghost';
  document.body.appendChild(ta);
  if (prev && typeof prev.blur === 'function') prev.blur();
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
  if (prev && typeof prev.focus === 'function') prev.focus();
}

// T-202605-428: copy helper para códigos en el panel DIFF
function _vizCopyCode(e, el) {
  e.stopPropagation();
  const code = el.dataset.code || el.textContent;
  if (!code) return;
  const _doFlash = () => {
    const prev = el.textContent;
    el.classList.add('viz-code--copied');
    el.textContent = '✓';
    setTimeout(() => { el.classList.remove('viz-code--copied'); el.textContent = prev; }, 1400);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(_doFlash).catch(() => {
      _copyTextSafe(code); _doFlash();
    });
  } else {
    _copyTextSafe(code); _doFlash();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// R-202604-072: Sesión de Arranque — panel de contexto diario al abrir la app
// ─────────────────────────────────────────────────────────────────────────────

const _ARRANQUE_KEY = 'ai-tracker-arranque-ts';
const _ARRANQUE_6H  = 6 * 60 * 60 * 1000;

function closeArranquePanel() {
  const overlay = document.getElementById('arranque-overlay');
  if (overlay) overlay.classList.remove('arranque-visible');
}

function _showArranquePanel() {
  const overlay = document.getElementById('arranque-overlay');
  const body    = document.getElementById('arranque-body');
  const ctaBtn  = document.getElementById('arranque-cta-btn');
  if (!overlay || !body) return;

  // AC: no aparece si han pasado menos de 6h desde el último arranque (localStorage)
  const lastShown = parseInt(localStorage.getItem(_ARRANQUE_KEY) || '0', 10);
  if (Date.now() - lastShown < _ARRANQUE_6H) return;

  // AC: no aparece si no hay proyectos ni ítems — onboarding tiene prioridad
  const allProjects = (state.projects || []).filter(p => (p.sessions || []).length > 0);
  const allItems    = typeof ITEMS !== 'undefined' ? ITEMS : [];
  if (allProjects.length === 0 && allItems.length === 0) return;

  // Persistir timestamp antes de mostrar
  try { localStorage.setItem(_ARRANQUE_KEY, String(Date.now())); } catch(e) {}

  // ── Bloque 1: Resumen de ayer ────────────────────────────────────────────
  const now        = Date.now();
  const DAY        = 86400000;
  const allSess    = getAllSessions();
  // Sesiones de las últimas 24h — "ayer" = última sesión del día anterior al de hoy
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const yesterStart = new Date(todayStart.getTime() - DAY);

  // Ítems cerrados en la última sesión (la más reciente)
  const lastSess = allSess.slice().sort((a, b) => {
    const ta = new Date(a.date || 0).getTime();
    const tb = new Date(b.date || 0).getTime();
    return tb - ta;
  })[0] || null;

  let bloque1Html = '';
  if (lastSess) {
    const lastSessDate = new Date(lastSess.date || 0);
    const daysDiff = Math.floor((now - lastSessDate.getTime()) / DAY);
    const lastProjObj = (state.projects || []).find(p => p.id === lastSess.projectId);
    const lastProjName = lastProjObj ? (lastProjObj.name || lastProjObj.id) : '';
    const lastAIObj = (state.ais || []).find(a => a.id === lastSess.aiId);
    const lastAIName = lastAIObj ? lastAIObj.name : '';

    // Ítems done vinculados a esa sesión
    const closedInSess = allItems.filter(i =>
      i.status === 'done' && (i.sessionId === lastSess.id || (lastSess.trackerRefs || []).includes(i.code))
    );

    if (daysDiff === 0 || daysDiff === 1) {
      const whenLabel = daysDiff === 0 ? 'hoy' : 'ayer';
      bloque1Html = `<div class="arr-section">
        <span class="arr-label">Última sesión — ${whenLabel}</span>
        <span class="arr-value arr-value--small">${lastProjName ? esc(lastProjName) + ' · ' : ''}${lastAIName ? esc(lastAIName) : ''}</span>
        ${closedInSess.length > 0
          ? `<ul class="arr-item-list arr-item-list--compact">
              ${closedInSess.slice(0,3).map(i => {
                const t = (i.code||'T')[0].toUpperCase();
                const _tc = {P:'#7c6af7',T:'#2ecc78',R:'#38bdf8',B:'#e85555'};
                return `<li class="arr-item arr-item--done">
                  <span class="arr-item-code" style="--arr-type-color:${_tc[t]||'#38bdf8'}">${esc(i.code)}</span>
                  <span class="arr-item-desc">${esc(i.title || i.desc || '')}</span>
                </li>`;
              }).join('')}
              ${closedInSess.length > 3 ? `<li class="arr-item arr-item--more">+${closedInSess.length - 3} más</li>` : ''}
            </ul>`
          : `<span class="arr-value arr-value--muted">${esc(lastSess.title || 'Sin ítems cerrados registrados')}</span>`
        }
      </div>`;
    } else {
      bloque1Html = `<div class="arr-section">
        <span class="arr-label">Última sesión</span>
        <span class="arr-value arr-value--muted">Hace ${daysDiff} días${lastProjName ? ' · ' + esc(lastProjName) : ''}</span>
      </div>`;
    }
  }

  // ── Bloque 2: Ítem sugerido ──────────────────────────────────────────────
  // Proyecto con más actividad reciente
  const projByActivity = allProjects.slice().sort((a, b) => {
    const ta = Math.max(...(a.sessions||[]).map(s => new Date(s.date||0).getTime()), 0);
    const tb = Math.max(...(b.sessions||[]).map(s => new Date(s.date||0).getTime()), 0);
    return tb - ta;
  });
  const mostActiveProj = projByActivity[0] || null;
  const activeSprint = mostActiveProj
    ? ((mostActiveProj.sprints||[]).find(s => s.status === 'active') || (mostActiveProj.sprints||[]).find(s => s.status === 'open') || null)
    : null;

  // Top 1 ítem por score del sprint activo del proyecto más activo
  const suggestedItem = allItems
    .filter(i => i.status === 'pendiente' && typeof i._score === 'number' && (!activeSprint || i.sprint === activeSprint.id))
    .sort((a, b) => b._score - a._score)[0] || null;

  let bloque2Html = '';
  if (suggestedItem) {
    const t = (suggestedItem.code||'T')[0].toUpperCase();
    const _tc = {P:'#7c6af7',T:'#2ecc78',R:'#38bdf8',B:'#e85555'};
    bloque2Html = `<div class="arr-section">
      <span class="arr-label">Ítem sugerido${activeSprint ? ' · ' + esc(activeSprint.name || activeSprint.id) : ''}</span>
      <div class="arr-item arr-item--featured">
        <span class="arr-item-code" style="--arr-type-color:${_tc[t]||'#38bdf8'}">${esc(suggestedItem.code)}</span>
        <span class="arr-item-desc">${esc(suggestedItem.title || suggestedItem.desc || '')}</span>
      </div>
    </div>`;
  }

  // ── Bloque 3: Estado IA ──────────────────────────────────────────────────
  const nonArchived = (state.ais || []).filter(a => !a.archived);
  // IA disponible con mayor score (si hay _score no disponible calculamos por sesiones recientes)
  const available = nonArchived.filter(a => a.status === 'available' && !a.interrupted);
  const inSession  = nonArchived.filter(a => a.interrupted || (a.status === 'available' && allSess.some(s => s.aiId === a.id && new Date(s.date||0).getTime() > now - 3*60*60*1000)));
  const exhausted  = nonArchived.filter(a => a.status === 'exhausted');

  // Mejor IA disponible: la que tiene sesión más reciente (más contexto)
  const bestAI = available.sort((a, b) => {
    const ta = Math.max(...allSess.filter(s => s.aiId === a.id).map(s => new Date(s.date||0).getTime()), 0);
    const tb = Math.max(...allSess.filter(s => s.aiId === b.id).map(s => new Date(s.date||0).getTime()), 0);
    return tb - ta;
  })[0] || null;

  let bloque3Html = '';
  if (bestAI) {
    bloque3Html = `<div class="arr-section">
      <span class="arr-label">IA disponible</span>
      <div class="arr-ai-row">
        <span class="arr-ai-name">${esc(bestAI.name)}</span>
        <span class="arr-ai-badge arr-ai-badge--available">disponible</span>
      </div>
    </div>`;
  } else if (exhausted.length > 0) {
    // Mostrar la que se resetea antes
    const nextToReset = exhausted.slice().sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b))[0];
    const msLeft = _hoyMsUntilReset(nextToReset);
    const cdLabel = _hoyCountdownLabel(msLeft);
    bloque3Html = `<div class="arr-section">
      <span class="arr-label">IAs disponibles</span>
      <div class="arr-ai-row">
        <span class="arr-ai-name">${esc(nextToReset.name)}</span>
        <span class="arr-ai-badge arr-ai-badge--exhausted">en ${cdLabel}</span>
      </div>
    </div>`;
  }

  // ── Bloque 4: Sesión recomendada del plan (R-202605-097) ─────────────────
  let bloque4Html = '';
  let _planPromptText = null; // texto a copiar — null = sin plan

  const _activeProj = (state.projects || []).find(p => p.id === (getActiveProject && getActiveProject() ? getActiveProject().id : null))
    || (state.projects || []).filter(p => !p.archived)[0]
    || null;

  if (_activeProj && typeof loadPlan === 'function') {
    const _planSprints = loadPlan(_activeProj.id);
    const _backlogItems = (() => {
      try {
        const _tplK = typeof _tplKey === 'function' ? _tplKey('backlog-items') : 'backlog-items';
        const raw = localStorage.getItem(_tplK);
        return raw ? JSON.parse(raw) : [];
      } catch(e) { return []; }
    })();
    const _itemByCode = {};
    _backlogItems.forEach(it => { if (it.code) _itemByCode[it.code] = it; });

    const _liveStatus = code => { const it = _itemByCode[code]; return it ? (it.status || 'pendiente') : 'pendiente'; };
    const _liveTitle  = code => { const it = _itemByCode[code]; return it ? (it.title || it.desc || '') : ''; };
    const _sessScore  = sess => (sess.items || []).reduce((sum, code) => {
      const it = _itemByCode[code];
      if (!it || _liveStatus(code) === 'done' || _liveStatus(code) === 'descartado') return sum;
      const w = it.priority === 'high' ? 3 : it.priority === 'low' ? 1 : 2;
      return sum + w;
    }, 0);
    const _sessIsDone = sess => {
      const codes = sess.items || [];
      return codes.length > 0 && codes.every(c => { const s = _liveStatus(c); return s === 'done' || s === 'descartado'; });
    };

    if (_planSprints && _planSprints.length) {
      // Aplanar sesiones con sprint de origen
      const _allSessions = [];
      _planSprints.forEach(sp => {
        (sp.sessions || []).forEach(sess => {
          _allSessions.push({ ...sess, _sprintId: sp.id });
        });
      });

      // IDs de sesiones done — para calcular bloqueos
      const _doneIds = new Set(_allSessions.filter(s => _sessIsDone(s)).map(s => s.id).filter(Boolean));
      const _isBlocked = sess => {
        const deps = (sess.depende_de || []).filter(Boolean);
        return deps.length > 0 && !deps.every(d => _doneIds.has(d));
      };

      // Filtrar sesiones pendientes (no done)
      const _pendingSessions = _allSessions.filter(s => !_sessIsDone(s));

      if (_pendingSessions.length === 0) {
        // Todos los ítems del plan done — sprint completado
        bloque4Html = `<div class="arr-section arr-section--plan">
          <span class="arr-label">Sesión del plan</span>
          <div class="arr-plan-done">✓ Todas las sesiones del sprint completadas</div>
        </div>`;
      } else {
        // Separar desbloqueadas vs bloqueadas
        const _available = _pendingSessions.filter(s => !_isBlocked(s));
        const _blocked   = _pendingSessions.filter(s =>  _isBlocked(s));

        // Sesión recomendada = desbloqueada con mayor score de ítems
        const _recommended = _available.slice().sort((a, b) => _sessScore(b) - _sessScore(a))[0] || null;
        const _others = _available.filter(s => s !== _recommended);

        // Construir HTML de la sesión recomendada
        const _typeColor = { P: '#7c6af7', T: '#2ecc78', R: '#38bdf8', B: '#e85555' };
        const _itemPill = code => {
          const t = (code || 'T')[0].toUpperCase();
          return `<span class="arr-item-code" style="--arr-type-color:${_typeColor[t] || '#38bdf8'}">${esc(code)}</span>`;
        };
        const _filePill = f => `<span class="arr-file-pill">${esc(f)}</span>`;

        let recHtml = '';
        if (_recommended) {
          const pendingCodes = (_recommended.items || []).filter(c => {
            const s = _liveStatus(c); return s !== 'done' && s !== 'descartado';
          });
          const archivos = (_recommended.archivos || []).filter(Boolean);

          // Validar campos antes de construir prompt — AC R-202605-097
          const _missingFields = [];
          if (!_recommended.rol) _missingFields.push('rol');
          if (!pendingCodes.length) _missingFields.push('ítems');
          const _promptIncomplete = _missingFields.length > 0;

          // Solo construir texto a copiar si campos completos
          const _contextFiles = ['PP-CONTEXT', 'PP-BACKLOG'];
          const _allFiles = [...new Set([...archivos, ..._contextFiles])];
          if (!_promptIncomplete) {
            _planPromptText = [
              `Rol: ${_recommended.rol}`,
              `Sprint: ${_recommended._sprintId || ''}`,
              `Ítems: ${(_recommended.items || []).join(', ')}`,
              `Archivos técnicos: ${archivos.join(', ') || '—'}`,
              `Archivos de contexto: ${_contextFiles.join(', ')}`,
            ].join('\n');
          }

          const archivosHtml = _allFiles.length
            ? `<div class="arr-plan-files">
                <span class="arr-plan-files-label">Archivos</span>
                <div class="arr-plan-files-row">
                  ${archivos.map(f => _filePill(f)).join('')}
                  ${_contextFiles.map(f => `<span class="arr-file-pill arr-file-pill--ctx">${esc(f)}</span>`).join('')}
                </div>
              </div>`
            : '';

          const incompleteWarningHtml = _promptIncomplete
            ? `<div class="arr-plan-warning">⚠ Faltan campos en el plan: ${_missingFields.join(', ')} — edita el bloque ---EXECUTION-PLAN--- antes de copiar</div>`
            : '';

          recHtml = `<div class="arr-plan-card arr-plan-card--recommended">
            <div class="arr-plan-card-header">
              <span class="arr-plan-indicator arr-plan-indicator--available">●</span>
              <span class="arr-plan-rol">${esc(_recommended.rol || '—')}</span>
              ${_recommended._sprintId ? `<span class="arr-plan-sprint">${esc(_recommended._sprintId)}</span>` : ''}
            </div>
            <div class="arr-plan-items">
              ${pendingCodes.length ? pendingCodes.map(_itemPill).join('') : '<span class="arr-plan-no-items">Sin ítems pendientes</span>'}
            </div>
            ${archivosHtml}
            ${incompleteWarningHtml}
            <button class="arr-plan-copy-btn${_promptIncomplete ? ' arr-plan-copy-btn--disabled' : ''}" id="arr-copy-btn" type="button"${_promptIncomplete ? ' aria-disabled="true" title="Completa los campos faltantes para habilitar"' : ''}>Copiar prompt de arranque</button>
          </div>`;
        }

        // Sesiones adicionales disponibles (colapsadas)
        let othersHtml = '';
        if (_others.length) {
          othersHtml = _others.map(s => {
            const pendCount = (s.items || []).filter(c => { const st = _liveStatus(c); return st !== 'done' && st !== 'descartado'; }).length;
            return `<div class="arr-plan-row">
              <span class="arr-plan-indicator arr-plan-indicator--available">●</span>
              <span class="arr-plan-row-rol">${esc(s.rol || '—')}</span>
              <span class="arr-plan-row-count">${pendCount} ítem${pendCount !== 1 ? 's' : ''}</span>
            </div>`;
          }).join('');
        }

        // Sesiones bloqueadas
        let blockedHtml = '';
        if (_blocked.length) {
          blockedHtml = _blocked.map(s => {
            const blocker = _allSessions.find(b => (s.depende_de || []).includes(b.id) && !_doneIds.has(b.id));
            return `<div class="arr-plan-row arr-plan-row--blocked">
              <span class="arr-plan-indicator arr-plan-indicator--blocked">○</span>
              <span class="arr-plan-row-rol">${esc(s.rol || '—')}</span>
              ${blocker ? `<span class="arr-plan-row-blocker">requiere: ${esc(blocker.rol || blocker.id || '—')}</span>` : ''}
            </div>`;
          }).join('');
        }

        bloque4Html = `<div class="arr-section arr-section--plan">
          <span class="arr-label">Sesión del plan</span>
          ${recHtml}
          ${othersHtml || blockedHtml ? `<div class="arr-plan-others">${othersHtml}${blockedHtml}</div>` : ''}
        </div>`;
      }
    } else {
      // Sin plan activo
      bloque4Html = `<div class="arr-section arr-section--plan">
        <span class="arr-label">Sesión del plan</span>
        <div class="arr-plan-empty">Sin plan activo — abre una sesión con Rune para planificar el siguiente sprint</div>
      </div>`;
    }
  }

  // ── Render final ─────────────────────────────────────────────────────────
  // Saludo por hora
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '☀ Buenos días' : hour < 19 ? '👋 Buenas tardes' : '🌙 Buenas noches';
  const titleEl = overlay.querySelector('.arranque-title');
  if (titleEl) titleEl.textContent = greeting;

  body.innerHTML = bloque1Html + bloque2Html + bloque3Html + bloque4Html;

  // CTA botón copiar prompt (R-202605-097)
  const _copyBtn = document.getElementById('arr-copy-btn');
  if (_copyBtn) {
    _copyBtn.addEventListener('click', () => {
      if (!_planPromptText) return;
      navigator.clipboard.writeText(_planPromptText).then(() => {
        _copyBtn.classList.add('arr-plan-copy-btn--copied');
        _copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          _copyBtn.classList.remove('arr-plan-copy-btn--copied');
          _copyBtn.textContent = 'Copiar prompt de arranque';
        }, 2000);
      }).catch(() => {
        // B-202605-505: usar _copyTextSafe para evitar sobreescribir clipboard del usuario
        _copyTextSafe(_planPromptText);
        _copyBtn.classList.add('arr-plan-copy-btn--copied');
        _copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          _copyBtn.classList.remove('arr-plan-copy-btn--copied');
          _copyBtn.textContent = 'Copiar prompt de arranque';
        }, 2000);
      });
    });
  }

  // Footer CTA secundario: ir a Tracker
  if (ctaBtn) {
    ctaBtn.onclick = () => {
      closeArranquePanel();
      if (bestAI && typeof selectTrackerAI === 'function') {
        if (typeof switchTab === 'function') switchTab('tab-tracker');
        setTimeout(() => selectTrackerAI(bestAI.id), 80);
      } else if (typeof switchTab === 'function') {
        switchTab('tab-tracker');
      }
    };
    ctaBtn.textContent = bestAI ? `Arrancar con ${bestAI.name} →` : 'Arrancar →';
  }

  // AC: Escape y click fuera cierran el panel
  const onKey = (e) => { if (e.key === 'Escape') { closeArranquePanel(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  overlay.onclick = (e) => { if (e.target === overlay) { closeArranquePanel(); document.removeEventListener('keydown', onKey); } };

  overlay.classList.add('arranque-visible');
}

// ─────────────────────────────────────────────────────────────────────────────
// R-202604-073: Pulso del Ecosistema — dot semántico + panel de salud
// ─────────────────────────────────────────────────────────────────────────────

const _PULSO_KEY = 'ai-tracker-pulso';

function _calcPulsoDotState() {
  const now   = Date.now();
  const DAY   = 86400000;
  const WEEK  = 7 * DAY;
  const allItems = typeof ITEMS !== 'undefined' ? ITEMS : [];

  // Proyectos con al menos una sesión
  const activeProjects = (state.projects || []).filter(p => (p.sessions || []).length > 0);

  const projData = activeProjects.map(p => {
    const sessions = p.sessions || [];
    const lastTs   = sessions.reduce((mx, s) => { const t = s.savedAt || s.createdAt || 0; return t > mx ? t : mx; }, 0);
    const daysSince = lastTs ? Math.floor((now - lastTs) / DAY) : 999;

    // Sprint IDs de este proyecto
    const sprintIds = new Set((p.sprints || []).map(s => s.id));

    const closed7   = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) <= WEEK && sprintIds.has(i.sprint)).length;
    const closed714 = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) > WEEK && (now - i.doneAt) <= 2 * WEEK && sprintIds.has(i.sprint)).length;

    let indicator;
    if (closed7 === 0 || daysSince >= 4) {
      indicator = 'parado';
    } else if (closed714 === 0 || closed7 >= closed714 * 1.2) {
      indicator = 'acelerando';
    } else if (closed7 >= closed714 * 0.8) {
      indicator = 'estable';
    } else {
      indicator = 'parado';
    }

    return { id: p.id, name: p.name || p.id, daysSince, closedThisWeek: closed7, closedLastWeek: closed714, indicator, sprintIds };
  });

  // Bloqueantes activos (blockedBy con deps no done)
  const blockerCount = allItems.filter(i =>
    i.status === 'pendiente' && i.blockedBy && i.blockedBy.length > 0 &&
    i.blockedBy.some(c => { const dep = allItems.find(d => d.code === c); return !dep || dep.status !== 'done'; })
  ).length;

  // Sprints activos sin movimiento en 7+ días
  const staleSprints = [];
  activeProjects.forEach(p => {
    (p.sprints || []).filter(s => s.status === 'active').forEach(sp => {
      const closedRecently = allItems.some(i => i.sprint === sp.id && i.status === 'done' && i.doneAt && (now - i.doneAt) <= WEEK);
      if (!closedRecently) staleSprints.push({ name: sp.label || sp.id, project: p.name || p.id });
    });
  });

  // Velocidad global
  const totalThisWeek = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) <= WEEK).length;
  const totalLastWeek = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) > WEEK && (now - i.doneAt) <= 2 * WEEK).length;

  // Color dot
  const hasData   = activeProjects.length > 0;
  const hasRed    = hasData && (projData.some(p => p.daysSince >= 7) || blockerCount > 0);
  const hasYellow = hasData && !hasRed && projData.some(p => p.daysSince >= 4);
  const dotColor  = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

  // B-202605-521: hasData expuesto para que renderPulsoDot aplique --neutral al header dot sin afectar el footer
  return { dotColor, hasData, projData, blockerCount, staleSprints, totalThisWeek, totalLastWeek };
}

function renderPulsoDot() {
  // B-202605-522: cálculo de estado ocurre antes de cualquier guard de elemento
  const s = _calcPulsoDotState();
  const labels = { green: 'Ecosistema activo ✓', yellow: '⚠ Actividad baja — algún proyecto inactivo 4-7d', red: '⛔ Alerta — proyectos parados o bloqueantes activos' };
  // DUP-04: punto de entrada consolidado en footer — #gf-pulso es el elemento interactivo
  const dot = document.getElementById('pulso-dot');
  const gfPulso = document.getElementById('gf-pulso');
  // B-202605-521: sin datos → neutral (gris); con datos → color del ecosistema
  const color = s.hasData ? s.dotColor : 'neutral';
  const label = s.hasData ? (labels[s.dotColor] || '') : 'Sin datos';
  if (dot) {
    dot.className = `pulso-dot pulso-dot--${color}`;
  }
  if (gfPulso) {
    gfPulso.setAttribute('aria-label', label);
    gfPulso.title = label;
  }
  try { localStorage.setItem(_PULSO_KEY, JSON.stringify({ color: s.dotColor, ts: Date.now() })); } catch(e) {}
}

function openPulsoPanel() {
  const overlay = document.getElementById('pulso-overlay');
  const body    = document.getElementById('pulso-body');
  if (!overlay || !body) return;

  const s = _calcPulsoDotState();

  // Barra de velocidad global
  const velPct   = s.totalLastWeek > 0 ? Math.round((s.totalThisWeek / s.totalLastWeek) * 100) : (s.totalThisWeek > 0 ? 100 : 0);
  const velLabel = s.totalLastWeek === 0
    ? (s.totalThisWeek > 0 ? `${s.totalThisWeek} ítem${s.totalThisWeek !== 1 ? 's' : ''} esta semana` : 'Sin actividad esta semana')
    : `${s.totalThisWeek} cerrados · ${velPct}% vs semana anterior`;
  const velFill  = Math.min(100, velPct || (s.totalThisWeek > 0 ? 60 : 0));
  const velColor = velFill >= 80 ? '#2ecc78' : velFill >= 40 ? '#e8a832' : '#e85555';

  let html = `<div class="pls-section">
    <span class="pls-label">Velocidad global</span>
    <div class="pls-vel-bar-wrap" title="${velLabel}">
      <div class="pls-vel-bar" style="--pls-vel-fill:${velFill}%;--pls-vel-color:${velColor}"></div>
    </div>
    <span class="pls-vel-text">${esc(velLabel)}</span>
  </div>`;

  if (s.projData.length > 0) {
    html += `<div class="pls-section pls-section--list"><span class="pls-label">Proyectos activos</span>`;
    html += s.projData.map(p => {
      const icon  = p.indicator === 'acelerando' ? '▲' : p.indicator === 'estable' ? '●' : '▼';
      const cls   = `pls-ind pls-ind--${p.indicator === 'acelerando' ? 'up' : p.indicator === 'estable' ? 'neutral' : 'down'}`;
      const extra = p.indicator === 'parado' && p.daysSince < 999 ? ` · ${p.daysSince}d sin sesión` : '';
      return `<div class="pls-proj-row">
        <span class="${cls}" title="${p.indicator}">${icon}</span>
        <span class="pls-proj-name">${esc(p.name)}</span>
        <span class="pls-proj-stats">${p.closedThisWeek} cerrado${p.closedThisWeek !== 1 ? 's' : ''}${extra}</span>
      </div>`;
    }).join('');
    html += `</div>`;
  }

  if (s.blockerCount > 0) {
    html += `<div class="pls-section pls-section--alert">
      <button class="pls-blocker-btn" onclick="closePulsoPanel();if(typeof switchTab==='function')switchTab('backlog')">
        ⛔ ${s.blockerCount} bloqueante${s.blockerCount !== 1 ? 's' : ''} activo${s.blockerCount !== 1 ? 's' : ''} → ver en Backlog
      </button>
    </div>`;
  }

  if (s.staleSprints.length > 0) {
    html += `<div class="pls-section"><span class="pls-label">Sprints sin movimiento (7+ días)</span>`;
    html += s.staleSprints.map(sp => `<div class="pls-stale-row">⚠ <strong>${esc(sp.name)}</strong> · ${esc(sp.project)}</div>`).join('');
    html += `</div>`;
  }

  // R-202604-076: Planes activos
  if (typeof _buildPulsoPlanesHtml === 'function') {
    html += _buildPulsoPlanesHtml();
  }

  if (s.projData.length === 0 && s.blockerCount === 0 && s.staleSprints.length === 0) {
    html += `<div class="pls-empty">Sin datos aún. Registra sesiones y ítems para ver el pulso del ecosistema.</div>`;
  }

  body.innerHTML = html;
  overlay.classList.add('pulso-visible');

  const onKey = (e) => { if (e.key === 'Escape') { closePulsoPanel(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

function closePulsoPanel() {
  const overlay = document.getElementById('pulso-overlay');
  if (overlay) overlay.classList.remove('pulso-visible');
}

// ══ R-202604-059: Grid Tracker 3 columnas — lógica JS ══
// T-202604-367: historial col 2 | T-202604-368: preview col 3 | T-202604-372: drag & drop

let _trackerHistSelectedSessId = null;
let _trackerHistProjFilter = '';

// Poblar select de proyectos en col 2
function _trackerHistPopulateProjects() {
  const sel = document.getElementById('tracker-hist-proj-filter');
  if (!sel) return;
  const projects = (state.projects || []).filter(p => p.status !== 'paused');
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos los proyectos</option>' +
    projects.map(p => `<option value="${esc(p.id)}"${p.id === current ? ' selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`).join('');
}

// Render col 2: lista de sesiones con filtro de proyecto
function _trackerRenderHist() {
  const listEl = document.getElementById('tracker-hist-list');
  if (!listEl) return;

  _trackerHistPopulateProjects();

  const allSessions = getAllSessions(); // ordenadas cronológicamente
  const filtered = _trackerHistProjFilter
    ? allSessions.filter(s => s.projectId === _trackerHistProjFilter)
    : allSessions;

  // más reciente primero
  const sorted = [...filtered].reverse();

  if (!sorted.length) {
    listEl.innerHTML = `<div class="tracker-hist-empty">
      <span class="tracker-hist-empty-icon">📋</span>
      <span>Sin sesiones${_trackerHistProjFilter ? ' en este proyecto' : ''}</span>
    </div>`;
    return;
  }

  const projTracker = getActiveTracker();

  listEl.innerHTML = sorted.map(s => {
    const ai = state.ais.find(a => a.id === s.aiId);
    const aiName = ai ? esc(ai.name) : '—';
    const proj = s.projectId ? getProjectById(s.projectId) : null;
    const dateLabel = (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '');
    const isActive = s.id === _trackerHistSelectedSessId;

    // conteo de ítems backlog vinculados
    const linkedItems = projTracker.items.filter(x => x.sessionId === s.id);
    const badgeHtml = linkedItems.length
      ? `<span class="tracker-hist-items-badge">${linkedItems.length}</span>`
      : '';

    const projPill = proj
      ? `<span style="font-size:10px;color:var(--hint)">${esc(proj.icon || '📁')}</span>`
      : '';

    return `<div class="tracker-hist-row${isActive ? ' active' : ''}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        draggable="true"
        onclick="_trackerSelectSess('${s.id}','${s.aiId}')"
        ondragstart="_trackerHistDragStart(event,'${s.id}','${s.aiId}')"
        ondragend="_trackerHistDragEnd(event)">
      <span class="tracker-hist-row-drag">⠿</span>
      <div class="tracker-hist-row-top">
        <span class="tracker-hist-ai-dot"></span>
        <span class="tracker-hist-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <span class="tracker-hist-row-date">${dateLabel}</span>
      </div>
      <div class="tracker-hist-row-meta">
        ${projPill}
        <span class="tracker-hist-ai-name">${aiName}</span>
        ${badgeHtml}
      </div>
    </div>`;
  }).join('');

  // Re-attach drag target listeners
  _trackerHistAttachDropTargets();
}

// Handler cambio de filtro proyecto
function _trackerHistFilterChange() {
  const sel = document.getElementById('tracker-hist-proj-filter');
  _trackerHistProjFilter = sel ? sel.value : '';
  _trackerRenderHist();
}

// Seleccionar sesión: resaltar en col 2 + abrir preview
function _trackerSelectSess(sessId, aiId) {
  _trackerHistSelectedSessId = sessId;
  // actualizar estado activo en col 2
  document.querySelectorAll('.tracker-hist-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });
  // abrir preview en col 3
  if (typeof openDetail === 'function') openDetail(aiId, sessId);
}

// ── T-202604-372: Drag & drop sesión → textarea col 1 ──

let _trackerDragSessId = null;
let _trackerDragAiId   = null;

function _trackerHistDragStart(e, sessId, aiId) {
  _trackerDragSessId = sessId;
  _trackerDragAiId   = aiId;
  e.dataTransfer.effectAllowed = 'copy';
  // texto a soltar: título de la sesión como referencia
  const allSessions = getAllSessions();
  const s = allSessions.find(x => x.id === sessId);
  const text = s ? s.title : sessId;
  e.dataTransfer.setData('text/plain', text);
  e.currentTarget.classList.add('dragging');
}

function _trackerHistDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  _trackerDragSessId = null;
  _trackerDragAiId   = null;
}

function _trackerHistAttachDropTargets() {
  // Attach drop zone a todos los textareas ta-{aiId} visibles
  document.querySelectorAll('textarea[id^="ta-"]').forEach(ta => {
    if (ta._trackerDropAttached) return;
    ta._trackerDropAttached = true;

    ta.addEventListener('dragover', (e) => {
      if (!_trackerDragSessId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      ta.classList.add('tracker-drop-active');
    });

    ta.addEventListener('dragleave', () => {
      ta.classList.remove('tracker-drop-active');
    });

    ta.addEventListener('drop', (e) => {
      if (!_trackerDragSessId) return;
      e.preventDefault();
      ta.classList.remove('tracker-drop-active');

      const allSessions = getAllSessions();
      const s = allSessions.find(x => x.id === _trackerDragSessId);
      if (!s) return;

      // Insertar referencia de sesión: título + fecha como texto en el textarea
      const dateLabel = (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '');
      const ref = `[Sesión: ${s.title}${dateLabel ? ' · ' + dateLabel : ''}]`;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const before = ta.value.slice(0, start);
      const after  = ta.value.slice(end);
      ta.value = before + ref + after;
      ta.selectionStart = ta.selectionEnd = start + ref.length;
      ta.dispatchEvent(new Event('input'));
      ta.focus();
    });
  });
}

// ── Tab pills mobile ──
function _trackerSwitchCol(col) {
  document.querySelectorAll('.tracker-col').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tracker-col-tab').forEach(btn => btn.classList.remove('active'));

  const colMap = { card: 'tracker-col-card', hist: 'tracker-col-hist' };
  const colEl = document.getElementById(colMap[col]);
  if (colEl) colEl.classList.add('active');

  const tab = document.querySelector(`.tracker-col-tab[data-col="${col}"]`);
  if (tab) tab.classList.add('active');
}

// Inicializar col card como activa en mobile al cargar
(function _trackerInitMobileCol() {
  const cardCol = document.getElementById('tracker-col-card');
  if (cardCol) cardCol.classList.add('active');
})();

// ══ END R-202604-059 ══

// R-migración Firebase→Supabase eliminada — AC-8: migración completada

// ── toggleNotes override — rediseño AI Card ──────────────────────────────────
// Compatible con estructura nueva (card-notes-body + is-hidden) y legacy.
// Si coexiste con toggleNotes en ai-tracker-ai-notes.js, este override prevalece
// por estar cargado después. Ver MAP: ai-tracker-ai-notes.js L2.
function toggleNotes(id) {
  const body    = document.getElementById('notes-body-' + id);
  const toggle  = document.getElementById('notes-toggle-' + id);

  // Nueva estructura (rediseño AI Card)
  if (body) {
    const isHidden = body.classList.contains('is-hidden');
    body.classList.toggle('is-hidden', !isHidden);
    if (toggle) {
      toggle.classList.toggle('open', isHidden);
      toggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    }
    return;
  }

  // Legacy — opera sobre card-notes-text.expanded (estructura anterior)
  const notesEl = document.getElementById('notes-text-' + id);
  if (!notesEl) return;
  notesEl.classList.toggle('expanded');
  if (toggle) {
    const exp = notesEl.classList.contains('expanded');
    toggle.classList.toggle('open', exp);
    toggle.setAttribute('aria-expanded', String(exp));
  }
}
