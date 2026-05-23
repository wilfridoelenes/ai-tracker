// locus-ui-shell.js
// Última actualización: 2026-05-19 · Extraído de ai-tracker-checkpoint.js y ai-tracker-ai-notes.js
// Responsabilidad: UI shell — tab switching, theme, search, shortcuts, setup checklist
// Debe cargarse antes de ai-tracker-checkpoint.js y ai-tracker-ai-notes.js

// ── Global utility ────────────────────────────────────────────────────────
// esc() usada por múltiples módulos (backlog, session, toast, checkpoint)
// Vive aquí porque locus-ui-shell.js carga primero

function esc(s) { return s ? (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

// ── Tab switching ──────────────────────────────────────────────────────────

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
    if (typeof _updateSubTabButtons === 'function') _updateSubTabButtons(currentSubTab || 'backlog');
  }
  if (typeof _stopHoyTicker === 'function') _stopHoyTicker();
  if (tab !== 'tracker' && typeof _stopSidebarTicker === 'function') _stopSidebarTicker();

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
    if (typeof render === 'function') render(); // B-202605-[pendiente-ID]: applyViewMode eliminada en refactor — reemplazada por render()
  } else if (tab === 'backlog') {
    if (typeof updateBacklogBanner === 'function') updateBacklogBanner();
    if (typeof renderBacklogList === 'function') renderBacklogList();
  } else if (tab === 'analytics') {
    if (typeof renderAnalytics === 'function') renderAnalytics();
  } else if (tab === 'sprint') {
    // T-[pendiente-ID]: renderSprint() — pendiente implementación
  } else if (tab === 'proyectos') {
    if (typeof renderProyectos === 'function') renderProyectos();
  }

  // B-[pendiente-ID]: cada tab-panel tiene su propio overflow-y:auto —
  // resetear el scroll del panel activo al cambiar de tab
  if (tabEl) tabEl.scrollTop = 0;

  // Refresh radar sidebar
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}

// ── Sub-tab switching (extraído de ai-tracker-ai-notes.js) ─────────────────

function switchSubTab(sub) {
  currentSubTab = sub;
  ['backlog','htmlmap','context','plan','contratos'].forEach(s => {
    const btn = document.getElementById('sstab-btn-' + s);
    const panel = document.getElementById('sspanel-' + s);
    if (btn) btn.classList.toggle('active', s === sub);
    if (panel) panel.classList.toggle('active', s === sub);
  });
  if (typeof _updateSubTabButtons === 'function') _updateSubTabButtons(sub);
  if (typeof _renderTplProjBanner === 'function') _renderTplProjBanner();
  if (sub === 'htmlmap') {
    if (typeof renderHtmlMap === 'function') renderHtmlMap();
    if (typeof updateHtmlMapModificationBadge === 'function') updateHtmlMapModificationBadge();
  }
  if (sub === 'backlog') {
    if (typeof loadBacklog === 'function') loadBacklog();
    if (typeof renderBacklogList === 'function') renderBacklogList();
    if (typeof renderStats === 'function') renderStats();
    if (typeof updateBacklogModificationBadge === 'function') updateBacklogModificationBadge();
  }
  if (sub === 'context') { if (typeof renderContext === 'function') renderContext(); }
  if (sub === 'plan') { if (typeof renderPlan === 'function') renderPlan(); }
  if (sub === 'contratos') { if (typeof renderContratos === 'function') renderContratos(); }
  if (typeof renderAIStatusBar === 'function') renderAIStatusBar();
  if (typeof _renderDocsOnboarding === 'function') _renderDocsOnboarding(); // T-202604-204
}

// ── Theme ──────────────────────────────────────────────────────────────────

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  if (typeof save === 'function') save();
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

// ── Search dispatch (extraído de ai-tracker-checkpoint.js) ────────────────

function onSearchDispatch() {
  // T-202604-420: búsqueda global unificada como punto de entrada principal
  const _surPanel = document.getElementById('search-unified-results');
  if (_surPanel) _surPanel.remove();

  // Siempre invocar búsqueda global unificada
  if (typeof onSearch === 'function') onSearch();
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

function onSearch() {
  const q = (document.getElementById('search-global').value || '').toLowerCase().trim();
  const countEl = document.getElementById('search-count');

  // Limpiar panel unificado previo
  const prevPanel = document.getElementById('search-unified-results');
  if (prevPanel) prevPanel.remove();

  if (!q) {
    if (typeof render === 'function') render();
    if (countEl) countEl.textContent = '';
    return;
  }

  // B-202605-236: proyecto activo para filtrar sesiones/proyectos
  const _activeProjId = (typeof _getActiveProjectFilter === 'function' && !_searchScopeAll)
    ? _getActiveProjectFilter()
    : null;

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

  // ── 3. Notas rápidas coincidentes ──
  // B-202605-022: respetar scope de proyecto activo — filtrar por projectId cuando aplica
  const noteMatches = (state.quickNotes || []).filter(n => {
    const textHit = (n.text || '').toLowerCase().includes(q) || (n.itemRef || '').toLowerCase().includes(q);
    if (!textHit) return false;
    if (_activeProjId && n.projectId && n.projectId !== _activeProjId) return false;
    return true;
  });

  // ── 4. T-202604-420: Ítems de backlog coincidentes ──
  const backlogMatches = (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(item => {
    if (item.status === 'descartado') return false;
    const titleHit = (item.title || item.desc || '').toLowerCase().includes(q);
    const codeHit = (item.code || '').toLowerCase().includes(q);
    const acHit = (item.ac || []).some(a => (typeof a === 'string' ? a : (a.text || '')).toLowerCase().includes(q));
    return titleHit || codeHit || acHit;
  });

  // ── 5. T-202604-420: Proyectos coincidentes ──
  const projMatches = (state.projects || []).filter(p =>
    p.status !== 'archived' &&
    // B-202605-236: si scope es proyecto activo, solo mostrar ese proyecto
    (!_activeProjId || p.id === _activeProjId) &&
    ((p.name || '').toLowerCase().includes(q) || (p.icon || '').toLowerCase().includes(q))
  );

  const total = aiMatches.length + sessMatches.length + noteMatches.length;
  // R-202604-075: contratos en búsqueda global
  const contratoMatches = (typeof searchContratos === 'function') ? searchContratos(q) : [];
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

  const totalWithContratos = total + contratoMatches.length + backlogMatches.length + projMatches.length + contextMatches.length;
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
    const aiSess = typeof getAISessions === 'function' ? getAISessions(ai.id) : [];
    const matchSessIds = new Set(sessMatches.filter(({ ai: sai }) => sai && sai.id === ai.id).map(({ sess }) => sess.id));
    list.querySelectorAll('.sess-row').forEach(row => {
      const titleEl = row.querySelector('.sess-row-title');
      const rowTitle = titleEl ? titleEl.textContent : '';
      const match = notesMatch || aiSess.some(s => matchSessIds.has(s.id) && s.title === rowTitle);
      row.classList.toggle('is-hidden', !match);
    });
  });

  // ── Renderizar panel de resultados agrupados ──
  const grid = document.getElementById('grid');
  if (!grid) return;

  // B-202605-236: scope toggle label
  const scopeLabel = _activeProjId ? '\u{1F4C1} Proyecto activo' : '\u{1F310} Todos los proyectos';

  let html = '<div class="sur-inner">';

  // B-202605-236: control de scope visible en cabecera del panel
  html += `<div class="sur-scope-row"><button class="sur-scope-btn" id="search-scope-btn" onclick="_toggleSearchScope()">${scopeLabel}</button></div>`;

  // Grupo IAs
  if (aiMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">\u{1F916} IAs (${aiMatches.length})</div>
      <div class="sur-rows">`;
    aiMatches.forEach(ai => {
      const statusDot = ai.status === 'available' ? '\u{1F7E2}' : '\u{1F534}';
      const noteSnip = ai.notes ? `<span class="sur-meta">${hlText(ai.notes.slice(0, 80), q)}${ai.notes.length > 80 ? '\u2026' : ''}</span>` : '';
      html += `<div class="sur-row" onclick="navigateToCard('${ai.id}')">
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
      const dateLabel = (typeof relDate === 'function' ? relDate(sess.date, sess.savedAt || sess.createdAt) : '') || sess.dateShort || '';
      const summSnip = sess.summary ? `<span class="sur-meta">${hlText(sess.summary.slice(0, 80), q)}${sess.summary.length > 80 ? '\u2026' : ''}</span>` : '';
      html += `<div class="sur-row" onclick="openDetail('${ai ? ai.id : ''}','${sess.id}')">
        <span class="sur-row-icon">\u{1F4C4}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(sess.title, q)}</span>
          <span class="sur-row-sub">${aiName}${projName ? ' \u00B7 ' + projName : ''}${dateLabel ? ' \u00B7 ' + dateLabel : ''}</span>
          ${summSnip}
        </div>
      </div>`;
    });
    if (moreCount > 0) {
      html += `<div class="sur-more">+${moreCount} sesión${moreCount !== 1 ? 'es' : ''} más — usa Log para explorar</div>`;
    }
    html += '</div></div>';
  }

  // Grupo Notas
  if (noteMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">📝 Notas (${noteMatches.length})</div>
      <div class="sur-rows">`;
    noteMatches.slice(0, 20).forEach(n => {
      const dateLabel = (typeof relDate === 'function' ? relDate(n.updatedAt || n.createdAt) : '') || '';
      const refBadge = n.itemRef ? `<span class="sur-badge">${hlText(n.itemRef, q)}</span>` : '';
      html += `<div class="sur-row" onclick="openQuickNote('${n.id}')">
        <span class="sur-row-icon">🗒</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(n.text.slice(0, 100), q)}${n.text.length > 100 ? '…' : ''}</span>
          <span class="sur-row-sub">${refBadge}${dateLabel}</span>
        </div>
      </div>`;
    });
    if (noteMatches.length > 20) {
      html += `<div class="sur-more">+${noteMatches.length - 20} nota${noteMatches.length - 20 !== 1 ? 's' : ''} más</div>`;
    }
    html += '</div></div>';
  }

  // Grupo Contratos — R-202604-075
  if (contratoMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">📐 Contratos (${contratoMatches.length})</div>
      <div class="sur-rows">`;
    contratoMatches.forEach(r => {
      const icon = r.type === 'contrato-modulo' ? '📄' : '⚙';
      html += `<div class="sur-row" onclick="(${r.action.toString()})()">
        <span class="sur-row-icon">${icon}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(r.label, q)}</span>
          <span class="sur-row-sub">${_esc(r.sub)}</span>
        </div>
      </div>`;
    });
    html += '</div></div>';
  }

  // Grupo Backlog — T-202604-420
  if (backlogMatches.length) {
    const bSlice = backlogMatches.slice(0, 25);
    const bMore = backlogMatches.length - bSlice.length;
    html += `<div class="sur-group">
      <div class="sur-group-label">🗃 Backlog (${backlogMatches.length})</div>
      <div class="sur-rows">`;
    bSlice.forEach(item => {
      const typeIcons = { R: '🔵', T: '🟢', B: '🔴', P: '🟣' };
      const typeChar = (item.code || '').charAt(0);
      const icon = typeIcons[typeChar] || '📌';
      const statusLabel = item.status === 'done' ? ' · ✓' : '';
      html += `<div class="sur-row" onclick="navigateToItem(${JSON.stringify(item.code)})">
        <span class="sur-row-icon">${icon}</span>
        <div class="sur-row-body">
          <span class="sur-row-title">${hlText(item.title || item.desc || item.code, q)}</span>
          <span class="sur-row-sub"><span class="sur-badge">${_esc(item.code)}</span>${statusLabel}</span>
        </div>
      </div>`;
    });
    if (bMore > 0) {
      html += `<div class="sur-more">+${bMore} ítem${bMore !== 1 ? 's' : ''} más — usa filtros de Backlog para explorar</div>`;
    }
    html += '</div></div>';
  }

  // Grupo Proyectos — T-202604-420
  if (projMatches.length) {
    html += `<div class="sur-group">
      <div class="sur-group-label">📁 Proyectos (${projMatches.length})</div>
      <div class="sur-rows">`;
    projMatches.forEach(p => {
      const sessCount = (p.sessions || []).length;
      html += `<div class="sur-row" onclick="typeof selectProjectFilter==='function'&&selectProjectFilter(${JSON.stringify(p.id)})">
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
      html += `<div class="sur-row" onclick="
        (function(){
          if(typeof switchTab==='function') switchTab('backlog');
          setTimeout(function(){
            if(typeof switchSubTab==='function') switchSubTab('context');
            setTimeout(function(){
              if(typeof toggleContextSection==='function') toggleContextSection(${secIdx});
              var el=document.getElementById('ctx-sec-${secIdx}');
              if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
            },120);
          },80);
        })()">
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
  grid.insertAdjacentElement('afterend', panel);
}

// ── Setup Checklist (SCB) ──────────────────────────────────────────────────

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

// ── ESC Cascade ────────────────────────────────────────────────────────────

// T-202604-418: Atajos de teclado globales
// Cascade Escape — cierra en orden de profundidad (más reciente primero)
function _escCascade() {
  const _overlayChecks = [
    // T-202605-460: panel búsqueda global — prioridad más alta
    () => { const el = document.getElementById('search-unified-results'); if (el) { el.remove(); return true; } },
    // Prioridad alta — modales de confirmación / editing
    () => { const el = document.getElementById('shortcuts-ref-overlay'); if (el && !el.classList.contains('is-hidden')) { closeShortcutsRef(); return true; } },
    () => { const el = document.getElementById('shortcuts-overlay'); if (el && !el.classList.contains('is-hidden')) { closeShortcuts(); return true; } },
    () => { const el = document.getElementById('cp-overlay'); if (el && !el.classList.contains('is-hidden')) { if (typeof closeCommandPalette === 'function') closeCommandPalette(); return true; } },
    () => { const el = document.getElementById('quick-note-modal'); if (el && el.offsetParent !== null) { if (typeof closeQuickNote === 'function') closeQuickNote(); return true; } },
    () => { const el = document.getElementById('qc-modal-overlay'); if (el && el.classList.contains('open')) { if (typeof closeQuickCapture === 'function') closeQuickCapture(); return true; } },
    () => { const el = document.getElementById('item-detail-panel'); if (el && el.classList.contains('open')) { if (typeof closeItemPanel === 'function') closeItemPanel(); return true; } },
    () => { const el = document.getElementById('item-editor-overlay'); if (el && el.offsetParent !== null) { if (typeof closeItemEditor === 'function') closeItemEditor(); return true; } },
    () => { const el = document.getElementById('merge-diff-overlay'); if (el && el.offsetParent !== null) { if (typeof showMergeDiffPanel === 'function') { const p = document.getElementById('item-viz-overlay'); if (p && !p.classList.contains('is-hidden')) { if (typeof _itemVizClose === 'function') _itemVizClose(); return true; } } } },
    () => { const el = document.getElementById('item-viz-overlay'); if (el && !el.classList.contains('is-hidden')) { if (typeof _itemVizClose === 'function') _itemVizClose(); return true; } },
    () => { const el = document.getElementById('pend-overlay'); if (el && el.offsetParent !== null) { if (typeof closePendPanel === 'function') closePendPanel(); return true; } },
    () => { const el = document.getElementById('proj-modal-overlay'); if (el && el.offsetParent !== null) { if (typeof closeProjModal === 'function') closeProjModal(); return true; } },
    () => { const el = document.getElementById('proj-panel-overlay'); if (el && el.offsetParent !== null) { if (typeof closeProjPanel === 'function') closeProjPanel(); return true; } },
    () => { const el = document.getElementById('pulso-panel'); if (el && el.offsetParent !== null) { if (typeof closePulsoPanel === 'function') closePulsoPanel(); return true; } },
    () => { if (window.focusActiveId) { if (typeof exitFocusMode === 'function') exitFocusMode(); return true; } },
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

  // Cmd+K / Ctrl+K → delegado a _cpGlobalKeydown en ai-tracker-command-palette.js

  // T-202605-442: Cmd+? → referencia de atajos (Cmd+Shift+/ y Cmd+?)
  if ((e.metaKey || e.ctrlKey) && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
    e.preventDefault();
    if (typeof openShortcutsRef === 'function') openShortcutsRef();
    return;
  }

  // B-202605-014: Ctrl+F / Cmd+F — contextual según tab activo y estado de panel
  if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
    const _isBacklogTab = currentTab === 'backlog' || currentTab === 'tab-backlog';
    const _itemPanel = document.getElementById('item-detail-panel');
    const _panelOpen = _itemPanel && _itemPanel.classList.contains('open');
    if (_isBacklogTab && !_panelOpen) {
      e.preventDefault();
      // R-202605-175: guard typeof — si módulo backlog no cargó, toast warning
      if (typeof toggleBacklogFocusMode === 'function') {
        toggleBacklogFocusMode();
      } else {
        if (typeof showToast === 'function') showToast('warning', '⚠️ Módulo de backlog no disponible');
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
    const _activeTA = document.querySelector('.main-textarea:not([readonly])');
    if (_activeTA && _activeTA.value.trim()) {
      const _aiId = _activeTA.closest('[data-ai-id]') && _activeTA.closest('[data-ai-id]').dataset.aiId;
      const _sbtn = _aiId
        ? document.getElementById(`sbtn-${_aiId}`)
        : document.querySelector('.sc-save');
      if (_sbtn) _sbtn.click();
    } else {
      if (window.focusActiveId && typeof confirmSave === 'function') confirmSave(window.focusActiveId);
    }
    return;
  }

  // T-202604-418: F → toggle focus mode
  if (_pressedKey === _sk('toggle-focus')) {
    e.preventDefault();
    if (window.focusActiveId) {
      if (typeof exitFocusMode === 'function') exitFocusMode();
    } else {
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

function restoreDefaultShortcuts() {
  localStorage.removeItem(_SHORTCUTS_KEY);
  if (typeof _saveUserPrefs === 'function') _saveUserPrefs(); // R-4: sincronizar reset a Supabase
  _shortcutsRender();
}

function openShortcuts() {
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) {
    overlay.classList.remove('is-hidden');
    _shortcutsRender();
    if (typeof _focusFirstInteractive === 'function') _focusFirstInteractive('shortcuts-panel');
  }
}

function closeShortcuts(e) {
  if (e && e.target !== document.getElementById('shortcuts-overlay')) return;
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) overlay.classList.add('is-hidden');
}

// DUP-03: openShortcutsRef y closeShortcutsRef redirigen a #shortcuts-overlay
function openShortcutsRef() { openShortcuts(); }
function closeShortcutsRef(e) { closeShortcuts(e); }

// Shorthand interno
function _sk(id) { return _shortcutKey(id); }

// ── END locus-ui-shell.js ──────────────────────────────────────────────────
