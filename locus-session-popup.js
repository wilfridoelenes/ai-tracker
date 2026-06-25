// [PP] v0.8.0 · sprint:PP-S-10 · mod:13 · autor:Rune · 2026-06-25 UTC-6
// locus-session-popup.js
// Responsabilidad: openDetail, popup de sesión completo, notas, renombrar, edición inline, Log de Sesiones (R-202604-016).
// Dependencias: locus-storage.js · locus-toast.js · locus-session-parse.js

import { TAG_COLORS, openTagModal } from './locus-tags.js';
import { getItems } from './locus-backlog-core.js';
import { _sessRelTsShared } from './locus-sesiones-utils.js';
// T-202606-166: _getActiveProjectFilter movida a locus-storage.js
import { showToast, showToastInline, toast } from './locus-toast.js';
import { esc, switchSubTab, switchTab, getCurrentTab } from './locus-ui-shell.js';
import { _findSession, _findSessionByAI, _getActiveProjectFilter, getAI, getAISessions, getActiveTracker, getState, save, _resetWorker } from './locus-storage.js';

import { fmt12 } from './locus-session-hora.js';

import { parsePaste } from './locus-session-parse.js';

// Variables de estado del popup — declaradas como módulo (eran globales en el stack monolítico)
let popAIId = null;
let popSessId = null;

function toggleStatus(id) {
  const ai = getAI(id);
  ai.status = ai.status === 'available' ? 'exhausted' : 'available';
  if (ai.status === 'available') { ai.resetTime = ''; /* interrupted se limpia solo con dismissInterrupted */ }
  save(); window.dispatchEvent(new CustomEvent('shell:render-tracker')); _rebuildLogBody();
}

export function toggleShowAll(id) { const ai = getAI(id); ai.showAll = !ai.showAll; save(); window.dispatchEvent(new CustomEvent('shell:render-tracker')); }

export function openDetail(aiId, sessId) {
  const ai = getAI(aiId);
  const found = _findSessionByAI(aiId, sessId);
  const s = found ? found.sess : null;
  if (!s) {
    // T2 (openDetail Col3): sesión inexistente → error visible, no stale
    const _ph = document.getElementById('tracker-preview-header');
    const _pb = document.getElementById('tracker-preview-body');
    const _pv = document.getElementById('tracker-preview');
    const _pi = document.getElementById('tracker-preview-inner');
    const _pe = document.getElementById('tracker-preview-empty');
    if (_ph) _ph.innerHTML = '';
    if (_pb) _pb.innerHTML = '<p class="sp-error">Sesión no encontrada</p>';
    if (_pv) _pv.classList.add('preview-open');
    if (_pi) { _pi.classList.remove('is-hidden'); _pi.classList.add('d-flex'); }
    if (_pe) _pe.classList.add('is-hidden');
    const _tabEl = document.getElementById('tab-sesiones');
    if (_tabEl) _tabEl.classList.add('preview-open');
    return;
  }
  popAIId = aiId; popSessId = sessId;

  const aiSessAll = getAISessions(aiId);
  const isLastSess = aiSessAll.length > 0 && aiSessAll[aiSessAll.length - 1].id === s.id;
  // T-202604-004: badges en header
  const starBadge = s.starred ? `<span class="pop-header-badge starred">⭐ destacada</span>` : '';
  const quickBadge = s.quickCapture ? `<span class="pop-header-badge quick">⚡ rápida</span>` : '';
  // T-202604-098: badge inReview en popup (solo sesión más reciente)
  const reviewBadge = (s.inReview && isLastSess) ? `<span class="pop-header-badge review">🔍 en revisión</span>` : '';
  // T-087: Sección superior — siempre visible (resumen + pendiente + B-006 reset)
  let topFields = '';
  if (s.summary) topFields += `<div class="popup-section summary"><div class="popup-section-label">Resumen</div><div class="pop-editable popup-section-val" id="pop-field-summary" data-popup-edit="summary" title="Editar resumen">${esc(s.summary)}<span class="pop-edit-icon">✏</span></div></div>`;
  if (s.pending) topFields += `<div class="popup-section pending"><div class="popup-section-label">⏳ Pendiente</div><div class="pop-editable popup-section-val" id="pop-field-pending" data-popup-edit="pending" title="Editar pendiente">${esc(s.pending)}<span class="pop-edit-icon">✏</span></div></div>`;

  // R-202604-039: campos de memoria narrativa — colapsados, solo si tienen contenido
  const _narrativeFields = [
    { key: 'decision',    label: '🧠 Decisión',    val: s.decision    || '' },
    { key: 'contexto',    label: '📌 Contexto',    val: s.contexto    || '' },
    { key: 'bloqueantes', label: '🚧 Bloqueantes', val: s.bloqueantes || '' },
    { key: 'aprendizaje', label: '💡 Aprendizaje', val: s.aprendizaje || '' },
  ].filter(f => f.val);
  if (_narrativeFields.length) {
    const _narKey = `pop-nar-${sessId}`;
    const _narOpen = sessionStorage.getItem(_narKey) === 'open';
    const _narClass = _narOpen ? ' open' : '';
    const _narBody = _narrativeFields.map(f =>
      `<div class="popup-section popup-section--pt"><div class="popup-section-label">${f.label}</div><div class="popup-section-val popup-section-val--pre">${esc(f.val)}</div></div>`
    ).join('');
    topFields += `<div class="popup-secondary-toggle${_narClass}" id="pop-nar-toggle" data-popup-action="toggleNar" data-nar-key="${esc(_narKey)}">
      <span class="toggle-arrow">▶</span>
      <span>Memoria narrativa</span>
    </div>
    <div class="popup-secondary-body${_narClass}" id="pop-nar-body">${_narBody}</div>`;
  }


  // T-087: Sección media — archivos + tags + trazabilidad — colapsable si está vacía
  let midFields = '';
  if (s.files) {
    const _fileList = s.files.split('|').map(f => f.trim()).filter(Boolean);
    const _filesHtml = _fileList.length > 1
      ? `<ul class="popup-file-list">${_fileList.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
      : `<div class="popup-section-val mono">${esc(s.files)}</div>`;
    midFields += `<div class="popup-section files"><div class="popup-section-label">📄 Archivos</div>${_filesHtml}</div>`;
  }

  const tgItems = (getActiveTracker().items || []).filter(x => x.sessionId === s.id);
  if (tgItems.length) {
    const rows = tgItems.map(x => `
      <div class="popup-tg-row">
        <span class="popup-tg-badge ${x.code[0]}">${x.code[0]}</span>
        <button class="popup-tg-code popup-tg-code--link" data-nav-item-code="${esc(x.code)}" title="Ir al ítem en Backlog">${esc(x.code)}</button>
        <span class="popup-tg-desc">${esc(x.desc)}</span>
        <span class="popup-tg-status">${esc(x.status)}</span>
      </div>`).join('');
    midFields += `<div class="popup-section"><div class="popup-section-label">📋 Tracker items</div>${rows}</div>`;
  }

  // T-053: sección de vínculo con backlog
  midFields += `<div class="popup-section" id="pop-refs-section">
    <div class="popup-section-label">🔗 Backlog vinculado</div>
    ${renderBacklogRefs(s)}
  </div>`;

  const tagHtml = (s.tags || []).map(tid => {
    const t = getState().tags.find(x => x.id === tid);
    const ci = TAG_COLORS.indexOf(t?.color);
    return t ? `<span class="tag tc-${ci >= 0 ? ci : 0}">${esc(t.name)}</span>` : '';
  }).join('');
  midFields += `<div class="popup-section"><div class="popup-section-label">Etiquetas</div>
    <div class="tag-wrap tag-wrap--mt">${tagHtml}<button class="tag-add-btn" data-popup-action="openTag" data-ai-id="${esc(aiId)}" data-sess-id="${esc(sessId)}">+ etiqueta</button></div>
  </div>`;

  // T-087: si sección media tiene contenido no trivial (archivos, tg, refs no vacíos) → mostrar toggle
  const hasMidContent = s.files || tgItems.length > 0;
  // Restaurar estado de colapso guardado por sesión
  const midKey = `pop-mid-${sessId}`;
  const midOpen = sessionStorage.getItem(midKey) !== 'closed';
  const midOpenClass = midOpen ? ' open' : '';

  let midHtml = '';
  if (hasMidContent) {
    midHtml = `<div class="popup-secondary-toggle${midOpenClass}" id="pop-mid-toggle" data-popup-action="toggleMid" data-sess-id="${esc(sessId)}">
      <span class="toggle-arrow">▶</span>
      <span>Archivos · trazabilidad · etiquetas</span>
    </div>
    <div class="popup-secondary-body${midOpenClass}" id="pop-mid-body">${midFields}</div>`;
  } else {
    // Si no hay contenido extra — mostrar igual pero sin toggle (solo refs/tags)
    midHtml = midFields;
  }

  // ── Preview panel — desktop único ────────────────────────────────────
  const isDesktop = true; // DUP-05: mobile eliminado — siempre desktop
  if (isDesktop) {
    // Populate preview panel — render IDs directly here so all edit functions work
    const tab = document.getElementById('tab-sesiones');
    const preview = document.getElementById('tracker-preview');
    const previewEmpty = document.getElementById('tracker-preview-empty');
    const previewInner = document.getElementById('tracker-preview-inner');
    const previewHeader = document.getElementById('tracker-preview-header');
    const previewBody = document.getElementById('tracker-preview-body');
    const previewFooter = document.getElementById('tracker-preview-footer');

    // Remove active class from all sess-rows
    document.querySelectorAll('.sess-row.preview-active').forEach(el => el.classList.remove('preview-active'));
    // Add active class to current sess-row
    const activeRow = document.querySelector(`.sess-row[data-sess-id="${sessId}"]`);
    if (activeRow) activeRow.classList.add('preview-active');

    // Header — with functional IDs for edit + star update
    // Preview project selector — activo session's project, editable post-registro
    const _previewProjects = (getState().projects || []).filter(p => p.status !== 'archived');
    const _previewSessProjId = (() => {
      for (const p of (getState().projects || [])) {
        if ((p.sessions || []).some(x => x.id === sessId)) return p.id;
      }
      return '';
    })();
    const _previewProjOpts = _previewProjects.map(p =>
      `<option value="${esc(p.id)}" ${p.id === _previewSessProjId ? 'selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`
    ).join('');
    // T-202605-472: onchange no muta directamente — pide confirm inline antes de aplicar
    const _previewProjSelect = `<select class="paste-proj-select preview-proj-select" id="preview-proj-${sessId}" title="Proyecto de esta sesión"><option value="">sin proyecto</option>${_previewProjOpts}</select>`;

    // T-202606-015: header 2 líneas — línea 1: popup-title-input (editable directo), línea 2: Worker · fecha · chip sprint + badges sin resetAt
    const _popFmtDate = (() => {
      try {
        const d = s.date ? new Date(s.date) : null;
        return d && !isNaN(d) ? d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      } catch (e) { return ''; }
    })();
    const _popSprintChip = s.sprintId ? `<span class="pop-header-badge mh-sprint">${esc(s.sprintId)}</span>` : '';
    const _popStarBadge  = s.starred      ? `<span class="pop-header-badge starred">⭐ destacada</span>` : '';
    const _popQuickBadge = s.quickCapture ? `<span class="pop-header-badge quick">⚡ rápida</span>` : '';
    const _popReviewBadge = (s.inReview && isLastSess) ? `<span class="pop-header-badge review">🔍 en revisión</span>` : '';

    previewHeader.innerHTML = `
      <button class="tracker-preview-close" id="pop-close-btn" title="Cerrar">✕</button>
      <div class="popup-header-body">
        <div class="changelog-row-body">
          ${_previewProjSelect}
          <input class="popup-title-input" id="pop-title-input" type="text" value="${esc(s.title)}" autocomplete="off">
          <div class="popup-date" id="pop-meta"><span>${esc(ai.name)}${_popFmtDate ? ' · ' + _popFmtDate : ''}</span>${_popSprintChip}${_popStarBadge}${_popQuickBadge}${_popReviewBadge}</div>
        </div>
      </div>`;

    // Body — topFields + midHtml with all functional IDs
    previewBody.innerHTML = topFields + midHtml;

    // Footer — incluye confirm de borrado inline (B-fix: era appendChild a previewInner → overflow:hidden lo ocultaba)
    previewFooter.innerHTML = `
      <div class="popup-footer-row">
        <button class="btn-ghost${s.starred ? ' starred' : ''}" id="pop-star-btn" title="${s.starred ? 'Quitar destacado' : 'Destacar sesión'}">${s.starred ? '⭐' : '☆'}</button>
        <button class="btn-ghost btn-danger-sm" id="pop-delete-open-btn" title="Eliminar sesión">🗑</button>
      </div>
      <div id="pop-delete-confirm" class="pop-delete-confirm">
        <span class="confirm-text">¿Eliminar esta sesión?</span>
        <button class="confirm-no" id="pop-delete-cancel-btn">Cancelar</button>
        <button class="confirm-yes" id="pop-delete-confirm-btn">Eliminar</button>
      </div>`;

    // Show panel
    previewEmpty.classList.add('is-hidden');
    previewInner.classList.remove('is-hidden'); previewInner.classList.add('d-flex');
    tab.classList.add('preview-open');
    preview.scrollTop = 0;

    // ── Event delegation post-render — CSS Purity ────────────────────────
    const _pdClose = document.getElementById('pop-close-btn');
    if (_pdClose) _pdClose.addEventListener('click', closePopup);

    const _pdStar = document.getElementById('pop-star-btn');
    if (_pdStar) _pdStar.addEventListener('click', starCurrentSession);

    const _pdDeleteOpen = document.getElementById('pop-delete-open-btn');
    if (_pdDeleteOpen) _pdDeleteOpen.addEventListener('click', openDeleteConfirm);

    const _pdDeleteCancel = document.getElementById('pop-delete-cancel-btn');
    if (_pdDeleteCancel) _pdDeleteCancel.addEventListener('click', closeDeleteConfirm);

    const _pdDeleteConfirm = document.getElementById('pop-delete-confirm-btn');
    if (_pdDeleteConfirm) _pdDeleteConfirm.addEventListener('click', deleteCurrentSession);

    const _pdProjSel = document.getElementById('preview-proj-' + sessId);
    if (_pdProjSel) _pdProjSel.addEventListener('change', function() { _previewProjConfirmChange(aiId, sessId, this); });

    // Campos editables (summary, pending) en body
    previewBody.querySelectorAll('[data-popup-edit]').forEach(function(el) {
      el.addEventListener('click', function() { startPopupEdit(el.dataset.popupEdit); });
    });

    // T-202606-015: popup-title-input — edición directa con persistencia en blur/Enter
    const _pdTitleInput = document.getElementById('pop-title-input');
    if (_pdTitleInput) {
      let _titleDone = false;
      const _commitTitle = function() {
        if (_titleDone) return; _titleDone = true;
        const newVal = _pdTitleInput.value.trim();
        const found2 = _findSession(popSessId);
        const s2 = found2 ? found2.sess : null;
        if (s2 && newVal && newVal !== s2.title) {
          s2.title = newVal;
          save();
          window.dispatchEvent(new CustomEvent('shell:render-tracker'));
          showToast('success', 'Sesión actualizada');
        }
        // re-render para reflejar valor en Col2 sin perder foco si fue Enter
      };
      _pdTitleInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); _commitTitle(); }
        if (e.key === 'Escape') { e.preventDefault(); _titleDone = true; openDetail(popAIId, popSessId); }
      });
      _pdTitleInput.addEventListener('blur', function() {
        setTimeout(function() { if (!_titleDone) _commitTitle(); }, 150);
      });
    }

    // Toggle narrativa
    const _pdNarToggle = document.getElementById('pop-nar-toggle');
    if (_pdNarToggle) {
      _pdNarToggle.addEventListener('click', function() {
        const k = _pdNarToggle.dataset.narKey;
        const o = sessionStorage.getItem(k) === 'open';
        sessionStorage.setItem(k, o ? 'closed' : 'open');
        _pdNarToggle.classList.toggle('open', !o);
        const narBody = document.getElementById('pop-nar-body');
        if (narBody) narBody.classList.toggle('open', !o);
      });
    }

    // Toggle mid
    const _pdMidToggle = document.getElementById('pop-mid-toggle');
    if (_pdMidToggle) {
      _pdMidToggle.addEventListener('click', function() {
        togglePopupMid(_pdMidToggle.dataset.sessId);
      });
    }

    const _pdUnlockNow = document.getElementById('pop-unlock-now-btn');
    if (_pdUnlockNow) _pdUnlockNow.addEventListener('click', unlockNowFromPopup);

    // Tags
    previewBody.querySelectorAll('[data-popup-action="openTag"]').forEach(function(btn) {
      btn.addEventListener('click', function() { openTagModal(btn.dataset.aiId, btn.dataset.sessId); });
    });

    // Nav a backlog items (tgItems)
    previewBody.querySelectorAll('[data-nav-item-code]').forEach(function(btn) {
      btn.addEventListener('click', function() { navigateToBacklogItem(btn.dataset.navItemCode); });
    });
  }
}
export function closePopup() {
  // Close preview panel
  const tab = document.getElementById('tab-sesiones');
  const previewEmpty = document.getElementById('tracker-preview-empty');
  const previewInner = document.getElementById('tracker-preview-inner');
  if (tab) tab.classList.remove('preview-open');
  if (previewEmpty) previewEmpty.classList.remove('is-hidden');
  if (previewInner) {
    previewInner.classList.add('is-hidden'); previewInner.classList.remove('d-flex');
    // Remove injected delete confirm so it doesn't duplicate on next open
    const dc = document.getElementById('pop-delete-confirm');
    if (dc && previewInner.contains(dc)) dc.remove();
  }
  document.querySelectorAll('.sess-row.preview-active').forEach(el => el.classList.remove('preview-active'));
  popAIId = null; popSessId = null;
}

function deleteCurrentSession() {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  if (!found) return;
  found.proj.sessions = found.proj.sessions.filter(s => s.id !== popSessId);
  save(); window.dispatchEvent(new CustomEvent('shell:render-tracker')); closePopup(); _rebuildLogBody(); showToast('success', 'Sesión eliminada');
}
// T-087: confirmación inline
function openDeleteConfirm() {
  const el = document.getElementById('pop-delete-confirm');
  if (el) el.classList.add('open');
}
function closeDeleteConfirm() {
  const el = document.getElementById('pop-delete-confirm');
  if (el) el.classList.remove('open');
}
function togglePopupMid(sessId) {
  const toggle = document.getElementById('pop-mid-toggle');
  const body = document.getElementById('pop-mid-body');
  if (!toggle || !body) return;
  const isOpen = body.classList.toggle('open');
  toggle.classList.toggle('open', isOpen);
  sessionStorage.setItem(`pop-mid-${sessId}`, isOpen ? 'open' : 'closed');
}
// T-202604-098: Toggle estado inReview en sesión más reciente
export function toggleInReview(aiId, sessId) {
  const found = _findSessionByAI(aiId, sessId);
  if (!found) return;
  const s = found.sess;
  // Solo opera en la sesión más reciente de esta IA
  const aiSess = getAISessions(aiId);
  const latestId = aiSess.length > 0 ? aiSess[aiSess.length - 1].id : null;
  if (s.id !== latestId) return;
  s.inReview = !s.inReview;
  save(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
}
// T-026: Destacar sesión
function starSession(aiId, sessId) {
  const found = _findSessionByAI(aiId, sessId);
  if (!found) return;
  found.sess.starred = !found.sess.starred;
  save(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
}
function starCurrentSession() {
  if (!popAIId || !popSessId) return;
  starSession(popAIId, popSessId);
  // Actualizar botón en popup sin cerrarlo
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  const starBtn = document.getElementById('pop-star-btn');
  if (starBtn && s) { starBtn.textContent = s.starred ? '⭐' : '☆'; starBtn.classList.toggle('starred', !!s.starred); starBtn.title = s.starred ? 'Quitar destacado' : 'Destacar sesión'; }
  // T-202604-004: refrescar badge starred en header
  // B-202606-037: metaEl.innerHTML reconstruye el bloque completo de #pop-meta — debe conservar
  // ai.name y reviewBadge igual que el render original (línea ~213), no solo fecha + resetAt + starred/quick.
  const metaEl = document.getElementById('pop-meta');
  if (metaEl && s) {
    const ai = getAI(popAIId);
    const aiSessAll = getAISessions(popAIId);
    const isLastSess = aiSessAll.length > 0 && aiSessAll[aiSessAll.length - 1].id === s.id;
    const starBadge = s.starred ? `<span class="pop-header-badge starred">⭐ destacada</span>` : '';
    const quickBadge = s.quickCapture ? `<span class="pop-header-badge quick">⚡ rápida</span>` : '';
    const reviewBadge = (s.inReview && isLastSess) ? `<span class="pop-header-badge review">🔍 en revisión</span>` : '';
    // T-202606-065: fecha formateada — mismo patrón que openDetail (T-202606-062). Nunca string crudo ISO ni 'Invalid Date'.
    const _fmtDate = (() => {
      try {
        const d = s.date ? new Date(s.date) : null;
        return d && !isNaN(d) ? d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      } catch (e) { return ''; }
    })();
    // T-202606-015: estructura #pop-meta alineada con openDetail — sin resetAt, con chip sprint
    metaEl.innerHTML = `<span>${esc(ai ? ai.name : '')}${_fmtDate ? ' · ' + _fmtDate : ''}</span>${s.sprintId ? `<span class="pop-header-badge mh-sprint">${esc(s.sprintId)}</span>` : ''}${starBadge}${quickBadge}${reviewBadge}`;
  }
  showToast('info', s?.starred ? 'Sesión destacada' : 'Destacado quitado');
}

// Preview panel — cambio de proyecto de sesión ya guardada
// T-202605-472: confirm inline antes de mutar projectId desde el select del detalle de sesión
function _previewProjConfirmChange(aiId, sessId, selectEl) {
  const newProjId  = selectEl.value;
  const prevProjId = (() => {
    for (const p of (getState().projects || [])) {
      if ((p.sessions || []).some(x => x.id === sessId)) return p.id;
    }
    return '';
  })();

  if (newProjId === prevProjId) return; // sin cambio real

  const newProj = (getState().projects || []).find(p => p.id === newProjId);
  const projName = newProj ? `${newProj.icon || '📁'} ${newProj.name}` : 'sin proyecto';

  // T-202606-088: guard typeof eliminado — showToastInline importada explícitamente vía ESM.
  selectEl.dataset.pendingProj = newProjId;
  selectEl.dataset.prevProj    = prevProjId;
  showToastInline(
    selectEl,
    `¿Mover a ${projName}?`,
    [
      { label: 'Confirmar', cls: 'btn-confirm', cb: () => {
          savePreviewProject(aiId, sessId, newProjId);
          delete selectEl.dataset.pendingProj;
        }
      },
      { label: 'Cancelar',  cls: 'btn-cancel',  cb: () => {
          selectEl.value = prevProjId;
          delete selectEl.dataset.pendingProj;
        }
      }
    ]
  );
}

function savePreviewProject(aiId, sessId, newProjId) {
  if (!newProjId) return;
  const projects = getState().projects || [];
  // Encontrar proyecto origen (donde vive la sesión)
  let fromProj = null, sess = null;
  for (const p of projects) {
    const idx = (p.sessions || []).findIndex(x => x.id === sessId);
    if (idx !== -1) { fromProj = p; sess = p.sessions[idx]; break; }
  }
  if (!sess) return;
  const toProj = projects.find(p => p.id === newProjId);
  if (!toProj) return;
  if (fromProj && fromProj.id === newProjId) return; // sin cambio
  // Mover sesión al nuevo proyecto
  if (fromProj) fromProj.sessions = (fromProj.sessions || []).filter(x => x.id !== sessId);
  if (!toProj.sessions) toProj.sessions = [];
  toProj.sessions.push(sess);
  save(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
  showToast('success', `Sesión movida a ${esc(toProj.icon || '📁')} ${esc(toProj.name)}`);
}




function unlockNowFromPopup() {
  if (!popAIId) return;
  const ai = getAI(popAIId);
  if (!ai) return;
  _resetWorker(ai);
  save(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
  if (getCurrentTab() === 'sesiones') window.dispatchEvent(new CustomEvent('shell:sesiones-render'));
  closePopup();
  showToast('success', `${ai.name} marcada como disponible`);
}

// Genera el HTML interior de la sección de vínculos en el popup
function renderBacklogRefs(s) {
  const refs = s.trackerRefs || [];
  let html = '';

  // Ítems vinculados — fila con código + descripción + status + desvincular
  if (refs.length) {
    refs.forEach(code => {
      const type = code[0] || '';
      const item = typeof getItems() !== 'undefined' ? getItems().find(i => i.code === code) : null;
      const desc = item ? item.title : '—';
      const status = item ? item.status : '';
      const statusLabel = {'pendiente':'Pendiente','done':'Hecho'}[status] || status;
      html += `<div class="popup-tg-row">
        <span class="popup-tg-badge ${type}">${type}</span>
        <button class="popup-tg-code popup-tg-code--link" data-nav-item-code="${esc(code)}" title="Ir al ítem en Backlog">${esc(code)}</button>
        <span class="popup-tg-desc">${esc(desc)}</span>
        <span class="popup-tg-status">${esc(statusLabel)}</span>
        <button class="popup-ref-unlink" data-unlink-code="${esc(code)}" title="Desvincular">✕</button>
      </div>`;
    });
  } else {
    html += '<div class="popup-ref-empty">Sin ítems vinculados.</div>';
  }

  // Selector — vacío si no hay backlog importado
  if (typeof getItems() === 'undefined' || !getItems().length) {
    html += `<div class="popup-ref-empty">Importa tu <code>Backlog.md</code> para vincular ítems.</div>`;
  } else {
    html += `<input class="popup-ref-search" id="pop-ref-input" type="text" placeholder="Buscar por código o título..." autocomplete="off">`;
    html += `<div class="popup-ref-suggestions" id="pop-ref-suggestions"></div>`;
  }

  return html;
}

// Re-renderiza solo la sección de refs sin cerrar el popup
function refreshPopupRefs() {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!s) return;
  const section = document.getElementById('pop-refs-section');
  if (!section) return;
  // Conservar query actual del input
  const inputVal = (document.getElementById('pop-ref-input') || {}).value || '';
  section.innerHTML = '<div class="popup-section-label">🔗 Backlog vinculado</div>' + renderBacklogRefs(s);
  // Restaurar query y re-filtrar
  const inp = document.getElementById('pop-ref-input');
  if (inp) {
    inp.value = inputVal;
    inp.addEventListener('input', onPopupRefSearch);
    onPopupRefSearch();
  }
  // Event delegation para nav y unlink
  section.querySelectorAll('[data-nav-item-code]').forEach(function(btn) {
    btn.addEventListener('click', function() { navigateToBacklogItem(btn.dataset.navItemCode); });
  });
  section.querySelectorAll('[data-unlink-code]').forEach(function(btn) {
    btn.addEventListener('click', function() { unlinkBacklogItem(btn.dataset.unlinkCode); });
  });
}

// Filtra getItems() según query y muestra sugerencias en el popup
function onPopupRefSearch() {
  const inp = document.getElementById('pop-ref-input');
  const sugEl = document.getElementById('pop-ref-suggestions');
  if (!inp || !sugEl) return;
  const q = inp.value.toLowerCase().trim();
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  const refs = s ? (s.trackerRefs || []) : [];

  if (!q) { sugEl.innerHTML = ''; return; }

  if (typeof getItems() === 'undefined') { sugEl.innerHTML = ''; return; }
  const matches = getItems().filter(i =>
    !refs.includes(i.code) && (
      i.code.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q)
    )
  ).slice(0, 8);

  if (!matches.length) {
    sugEl.innerHTML = '<div class="popup-ref-empty">Sin resultados.</div>';
    return;
  }

  sugEl.innerHTML = matches.map(i => {
    const type = (i.code[0] || '');
    return `<div class="popup-ref-suggestion" data-link-code="${esc(i.code)}">
      <span class="popup-tg-badge ${type}">${type}</span>
      <span class="popup-ref-code">${esc(i.code)}</span>
      <span class="popup-ref-title">${esc(i.title)}</span>
    </div>`;
  }).join('');
  // Event delegation para sugerencias
  sugEl.querySelectorAll('[data-link-code]').forEach(function(el) {
    el.addEventListener('click', function() { linkBacklogItem(el.dataset.linkCode); });
  });
}

// Vincula un código de backlog a la sesión actual
function linkBacklogItem(code) {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!s) return;
  if (!s.trackerRefs) s.trackerRefs = [];
  if (s.trackerRefs.includes(code)) return;
  s.trackerRefs.push(code);
  // B-246 + B-245: registrar en history[] del ítem con aiId de la sesión
  if (typeof getItems() !== 'undefined') {
    const item = getItems().find(i => i.code === code);
    if (item) {
      if (!item.history) item.history = [];
      item.history.push({ type: 'session-linked', ts: Date.now(), aiId: popAIId, data: { sessId: popSessId } });
    }
  }
  save();
  refreshPopupRefs();
  showToast('success', `${code} vinculado`);
}

// Desvincula un código de backlog de la sesión actual
function unlinkBacklogItem(code) {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!s) return;
  s.trackerRefs = (s.trackerRefs || []).filter(c => c !== code);
  // B-246 + B-245: registrar en history[] del ítem con aiId de la sesión
  if (typeof getItems() !== 'undefined') {
    const item = getItems().find(i => i.code === code);
    if (item) {
      if (!item.history) item.history = [];
      item.history.push({ type: 'session-unlinked', ts: Date.now(), aiId: popAIId, data: { sessId: popSessId } });
    }
  }
  save();
  refreshPopupRefs();
  showToast('success', `${code} desvinculado`);
}

// ── T-202604-025: Edición inline de sesión ──
function startPopupEdit(field) {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!s) return;

  let el, currentVal, inputTag;
  if (field === 'summary') {
    el = document.getElementById('pop-field-summary');
    currentVal = s.summary || '';
    inputTag = 'textarea';
  } else if (field === 'pending') {
    el = document.getElementById('pop-field-pending');
    currentVal = s.pending || '';
    inputTag = 'textarea';
  } else return;

  if (!el || el.classList.contains('editing')) return;
  el.classList.add('editing');

  const rows = inputTag === 'textarea' ? Math.max(3, (currentVal.match(/\n/g)||[]).length + 2) : null;
  const inputEl = document.createElement(inputTag);
  inputEl.className = 'pop-inline-input';
  inputEl.value = currentVal;
  if (inputTag === 'textarea') { inputEl.rows = rows; }

  const hint = document.createElement('div');
  hint.className = 'pop-edit-hint';
  hint.textContent = 'Enter confirma · Escape cancela' + (inputTag === 'textarea' ? ' · Shift+Enter nueva línea' : '');

  el.innerHTML = '';
  el.appendChild(inputEl);
  el.appendChild(hint);
  inputEl.focus();
  if (inputTag === 'input') { inputEl.select(); }

  let done = false;

  function commit() {
    if (done) return; done = true;
    const newVal = inputEl.value.trim();
    if (newVal !== currentVal) {
      s[field] = newVal;
      save();
      window.dispatchEvent(new CustomEvent('shell:render-tracker'));
      showToast('success', 'Sesión actualizada');
    }
    openDetail(popAIId, popSessId);
  }

  function cancel() {
    if (done) return; done = true;
    openDetail(popAIId, popSessId);
  }

  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    else if (e.key === 'Enter' && (inputTag === 'input' || !e.shiftKey)) { e.preventDefault(); commit(); }
  });

  // blur dispara después de keydown — el flag `done` previene doble ejecución
  inputEl.addEventListener('blur', function() {
    setTimeout(() => { if (!done) commit(); }, 150);
  });
}

export function startRename(id) {
  const ai = getAI(id);
  const el = document.getElementById('name-' + id);
  if (!el) return;
  const inp = document.createElement('input');
  inp.className = 'card-name-input'; inp.value = ai.name;
  el.replaceWith(inp); inp.focus(); inp.select();
  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const newName = inp.value.trim();
    if (!newName) {
      showToast('warning', 'El nombre no puede estar vacío');
      window.dispatchEvent(new CustomEvent('shell:render-tracker')); return;
    }
    // T-092: validar duplicados case-insensitive (excluir la propia IA)
    const nameLower = newName.toLowerCase();
    const duplicate = (getState()?.ais || []).find(a => a.id !== id && a.name.toLowerCase() === nameLower);
    if (duplicate) {
      showToast('warning', `Ya existe una IA llamada "${duplicate.name}"`);
      window.dispatchEvent(new CustomEvent('shell:render-tracker')); return;
    }
    ai.name = newName;
    save(); window.dispatchEvent(new CustomEvent('shell:render-tracker'));
  };
  const cancel = () => { if (committed) return; committed = true; window.dispatchEvent(new CustomEvent('shell:render-tracker')); };
  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    if (e.key === 'Escape') { inp.removeEventListener('blur', commit); cancel(); }
  });
}


// ── T-031: Notas libres por IA ──
function editNotes(id) {
  const ai = getAI(id);
  const wrap = document.getElementById('notes-wrap-' + id);
  if (!wrap) return;
  const ta = document.createElement('textarea');
  ta.className = 'card-notes-ta';
  ta.value = ai.notes || '';
  ta.placeholder = 'Notas libres sobre esta IA o proyecto...';
  const actions = document.createElement('div');
  actions.className = 'card-notes-actions';
  actions.innerHTML = `
    <button class="card-notes-save" data-notes-id="${esc(id)}">Guardar</button>
    <button class="card-notes-cancel" data-notes-cancel-id="${esc(id)}">Cancelar</button>`;
  wrap.innerHTML = '';
  wrap.appendChild(ta);
  wrap.appendChild(actions);
  // Store textarea ref for save/cancel
  wrap._ta = ta;
  ta.focus();
  // Auto-resize
  ta.addEventListener('input', () => { ta.style.setProperty('--ta-height', 'auto'); ta.style.setProperty('--ta-height', ta.scrollHeight + 'px'); });
  // Event delegation post-render
  const _notesSave = actions.querySelector('[data-notes-id]');
  if (_notesSave) _notesSave.addEventListener('click', function() { saveNotes(id); });
  const _notesCancel = actions.querySelector('[data-notes-cancel-id]');
  if (_notesCancel) _notesCancel.addEventListener('click', function() { cancelNotes(id); });
}

function saveNotes(id) {
  const ai = getAI(id);
  const wrap = document.getElementById('notes-wrap-' + id);
  if (!wrap || !wrap._ta) return;
  ai.notes = wrap._ta.value.trim();
  save();
  renderNotesDisplay(id);
}

function cancelNotes(id) {
  renderNotesDisplay(id);
}

function renderNotesDisplay(id) {
  const ai = getAI(id);
  const wrap = document.getElementById('notes-wrap-' + id);
  if (!wrap) return;
  const val = ai.notes || '';
  if (val) {
    wrap.innerHTML = `
      <div class="card-notes-text" id="notes-text-${id}" data-edit-notes-id="${esc(id)}" title="Click para editar notas">${esc(val)}</div>
      <span class="card-notes-toggle" id="notes-toggle-${id}" data-toggle-notes-id="${esc(id)}"></span>`;
    // Event delegation post-render
    const _notesText = wrap.querySelector('[data-edit-notes-id]');
    if (_notesText) _notesText.addEventListener('click', function() { editNotes(id); });
    const _notesToggle = wrap.querySelector('[data-toggle-notes-id]');
    if (_notesToggle) _notesToggle.addEventListener('click', function() { toggleNotes(id); });
    // Verificar si hay overflow para mostrar toggle
    setTimeout(() => checkNotesOverflow(id), 50);
  } else {
    wrap.innerHTML = `<div class="card-notes-text empty-notes" id="notes-text-${id}" data-edit-notes-id="${esc(id)}" title="Agregar notas">+ notas libres</div>`;
    const _notesTextEmpty = wrap.querySelector('[data-edit-notes-id]');
    if (_notesTextEmpty) _notesTextEmpty.addEventListener('click', function() { editNotes(id); });
  }
}

function checkNotesOverflow(id) {
  const textEl = document.getElementById('notes-text-' + id);
  const toggleEl = document.getElementById('notes-toggle-' + id);
  if (!textEl || !toggleEl) return;
  const isOverflowing = textEl.scrollHeight > textEl.clientHeight + 2;
  toggleEl.classList.toggle('is-hidden', !isOverflowing); toggleEl.classList.toggle('d-inline-block', isOverflowing);
  if (isOverflowing) toggleEl.textContent = '▾ ver más';
}

// ─── R-202604-016: Log de Sesiones ────────────────────────────────────────────

// Persistencia de filtros
const LOG_FILTER_KEY = 'log-filter-state';
function _saveLogFilters() {
  try {
    localStorage.setItem(LOG_FILTER_KEY, JSON.stringify({
      ai: _logFilterAI,
      type: _logFilterType,
      // proj no se persiste — se toma del filtro global activo
      starred: _logFilterStarred,
    }));
  } catch(e) {}
}
function _loadLogFilters() {
  try {
    const raw = localStorage.getItem(LOG_FILTER_KEY);
    if (!raw) return;
    const f = JSON.parse(raw);
    _logFilterAI      = f.ai      || '';
    _logFilterType    = f.type    || 'all';
    // _logFilterProj se toma del filtro global activo del header — no se persiste
    _logFilterStarred = !!f.starred;
  } catch(e) {}
}

// Estado del log card
let _logFilterAI      = '';     // aiId activo o ''
let _logFilterType    = 'all';  // 'all' | 'session' | 'quick' | 'interrupted'
let _logFilterProj    = '';     // projId activo o ''
let _logFilterStarred = false;  // solo starred
let _logSearch        = '';
let _logScrollHandler = null;   // B-202605-053: referencia de módulo — sobrevive card.innerHTML

// Recopila todas las sesiones de todos los proyectos, cronológicas inversas
export function _getAllSessionsChron() {
  const rows = [];
  (getState()?.projects || []).forEach(proj => {
    (proj.sessions || []).forEach(s => {
      const ai = (getState()?.ais || []).find(a => a.id === s.aiId) || null;
      rows.push({ sess: s, proj, ai });
    });
  });
  rows.sort((a, b) => parseInt(b.sess.id) - parseInt(a.sess.id));
  return rows;
}

// Construye la lista de IAs que tienen sesiones (para los pills de filtro)
function _logAIList() {
  const seen = new Map();
  _getAllSessionsChron().forEach(({ ai }) => {
    if (ai && !seen.has(ai.id)) seen.set(ai.id, ai);
  });
  return [...seen.values()];
}

// Tipo de sesión
function _sessType(s) {
  if (s.interrupted) return 'interrupted';
  if (s.quickCapture) return 'quick';
  return 'session';
}

function _sessTypeLabel(s) {
  const t = _sessType(s);
  if (t === 'quick') return 'quick';
  if (t === 'interrupted') return 'interrumpida';
  if (s.starred) return 'destacada';
  return 'sesión';
}

function _sessTypePill(s) {
  const t = _sessType(s);
  if (t === 'quick') return '<span class="log-pill log-pill--quick">⚡ quick</span>';
  if (t === 'interrupted') return '<span class="log-pill log-pill--interrupted">⚡ interrumpida</span>';
  if (s.starred) return '<span class="log-pill log-pill--starred">⭐ destacada</span>';
  return '<span class="log-pill log-pill--normal">sesión</span>';
}

// Renderiza el header del log card (pills IA + pills tipo + buscador + contador)
function _buildLogHeader(total, filtered) {
  const aiList = _logAIList();
  const projList = (getState()?.projects || []);

  const aiPills = aiList.map(ai => {
    const active = _logFilterAI === ai.id ? ' log-ai-pill--active' : '';
    const color = ai.color ? ai.color : '';
    // B-202605-020: color aplicado como data-color — nunca interpolado como atributo sin nombre
    const colorAttr = color ? `data-color="${esc(color)}" style="--ai-pill-color:${esc(color)}"` : '';
    return `<button class="log-ai-pill${active}" ${colorAttr} data-log-filter-ai="${esc(ai.id)}" title="${esc(ai.name)}">${esc(ai.name)}</button>`;
  }).join('');

  const typePills = [
    { key: 'all',         label: 'Todas' },
    { key: 'session',     label: 'Sesión' },
    { key: 'quick',       label: 'Quick' },
    { key: 'interrupted', label: 'Interrumpida' },
  ].map(({ key, label }) =>
    `<button class="log-type-pill${_logFilterType === key ? ' log-type-pill--active' : ''}" data-log-filter-type="${key}">${label}</button>`
  ).join('');

  const starredPill = `<button class="log-type-pill${_logFilterStarred ? ' log-type-pill--active' : ''}" data-log-filter-starred title="Solo destacadas">⭐</button>`;

  const projOptions = projList.map(p =>
    `<option value="${esc(p.id)}"${_logFilterProj === p.id ? ' selected' : ''}>${esc((p.icon || '📁') + ' ' + p.name)}</option>`
  ).join('');
  const projSelect = projList.length
    ? `<select class="log-proj-select" id="log-proj-select">
        <option value="">Todos los proyectos</option>
        ${projOptions}
       </select>`
    : '';

  const countLabel = filtered < total ? `${filtered} / ${total}` : `${total}`;

  return `
    <div class="log-card-header">
      <div class="log-card-title-row">
        <span class="log-card-title">📋 Log de sesiones</span>
        <span class="log-card-count" id="log-count">${countLabel}</span>
        <button class="log-card-close" id="log-card-close-btn" title="Cerrar (ESC)">✕</button>
      </div>
      <input class="log-search-input" id="log-search-input" type="text" placeholder="🔍 Buscar título o resumen…"
        value="${esc(_logSearch)}" autocomplete="off">
      <div class="log-filters-row">
        <div class="log-ai-pills" id="log-ai-pills">${aiPills || '<span class="log-hint">Sin sesiones</span>'}</div>
        <div class="log-type-pills">${typePills}${starredPill}</div>
      </div>
    </div>`;
}

// Renderiza una fila del log
function _buildLogRow({ sess, proj, ai }) {
  if (!ai) return '';
  const color = ai.color || 'var(--accent)';
  const aiName = ai.name || '—';
  const projName = proj ? (proj.icon || '📁') + ' ' + proj.name : '';
  const summarySnippet = sess.summary ? esc(sess.summary.slice(0, 120)) + (sess.summary.length > 120 ? '…' : '') : '';
  const typePill = _sessTypePill(sess);

  // trackerRefs pills
  const refs = (sess.trackerRefs || []);
  const refPills = refs.length
    ? refs.slice(0, 4).map(code => {
        const t = code[0]; // P T R B
        const cls = t === 'T' ? 'log-ref--t' : t === 'P' ? 'log-ref--p' : t === 'R' ? 'log-ref--r' : t === 'B' ? 'log-ref--b' : '';
        return `<button class="log-ref log-ref--link ${cls}" data-log-nav-code="${esc(code)}" title="Ir al ítem en Backlog">${esc(code)}</button>`;
      }).join('') + (refs.length > 4 ? `<span class="log-ref log-ref--more">+${refs.length - 4}</span>` : '')
    : '';

  // quickCapture indicator
  const qcBadge = sess.quickCapture ? '<span class="log-qc-badge" title="Quick capture">⚡</span>' : '';

  // R-202605-162: timestamp relativo bajo el título — usa helper compartido
  const tsLabel = _sessRelTsShared(sess);
  const tsMeta = tsLabel ? `<span class="log-row-ts">${esc(tsLabel)}</span>` : '';

  return `
    <div class="log-row" id="log-row-${esc(sess.id)}" data-log-ai="${esc(ai.id)}" data-log-sess="${esc(sess.id)}" title="Ver detalle">
      <div class="log-row-left">
        <span class="log-ai-dot" style="--ai-dot-color:${color}"></span>
      </div>
      <div class="log-row-body">
        <div class="log-row-top">
          <span class="log-ai-name" style="--ai-name-color:${color}">${esc(aiName)}</span>
          ${projName ? `<span class="log-proj-name">${esc(projName)}</span>` : ''}
          ${typePill}
          ${qcBadge}
          <span class="log-row-date">${esc(sess.dateShort || '')}</span>
        </div>
        <div class="log-row-title">${esc(sess.title)}</div>
        ${tsMeta ? `<div class="log-row-ts-line">${tsMeta}</div>` : ''}
        ${summarySnippet ? `<div class="log-row-summary">${summarySnippet}</div>` : ''}
        ${refPills ? `<div class="log-row-refs">${refPills}</div>` : ''}
      </div>
    </div>`;
}

// Construye y actualiza el cuerpo del log card
export function _rebuildLogBody() {
  const card = document.getElementById('log-card');
  if (!card) return;

  // Proyecto activo siempre del filtro global del header
  const activeProjId = _getActiveProjectFilter();

  const all = _getAllSessionsChron();
  const q = _logSearch.toLowerCase();

  const filtered = all.filter(({ sess, ai, proj }) => {
    if (_logFilterAI && (!ai || ai.id !== _logFilterAI)) return false;
    if (activeProjId && (!proj || proj.id !== activeProjId)) return false;
    if (_logFilterStarred && !sess.starred) return false;
    if (_logFilterType !== 'all') {
      if (_logFilterType === 'session' && _sessType(sess) !== 'session') return false;
      if (_logFilterType === 'quick' && !sess.quickCapture) return false;
      if (_logFilterType === 'interrupted' && !sess.interrupted) return false;
    }
    if (q && !sess.title.toLowerCase().includes(q) && !(sess.summary || '').toLowerCase().includes(q) &&
        !(sess.decision || '').toLowerCase().includes(q) && !(sess.contexto || '').toLowerCase().includes(q) &&
        !(sess.bloqueantes || '').toLowerCase().includes(q) && !(sess.aprendizaje || '').toLowerCase().includes(q)) return false;
    return true;
  });

  const hasSearch = !!q;
  const hasFilterAI = !!_logFilterAI;
  const hasFilterProj = !!activeProjId;
  const hasFilterStarred = !!_logFilterStarred;
  const hasFilterType = _logFilterType !== 'all';
  const hasActiveFilter = hasSearch || hasFilterAI || hasFilterProj || hasFilterStarred || hasFilterType;

  const header = _buildLogHeader(all.length, filtered.length);
  const rows = filtered.map(r => _buildLogRow(r)).join('');

  // B-256: empty state diferenciado por causa
  let emptyHtml = '';
  if (!filtered.length) {
    if (!all.length) {
      // Causa (a): nunca hubo sesiones
      emptyHtml = `<div class="log-empty log-empty--never">
        <span class="log-empty-icon">📋</span>
        <span class="log-empty-msg">Sin sesiones registradas</span>
        <span class="log-empty-hint">Pega un CHECKPOINT en la card de una IA para registrar tu primera sesión.</span>
      </div>`;
    } else if (hasSearch) {
      // Causa (c): búsqueda sin coincidencias
      emptyHtml = `<div class="log-empty log-empty--search">
        <span class="log-empty-icon">🔍</span>
        <span class="log-empty-msg">Sin resultados para «${esc(q)}»</span>
        <button class="log-empty-cta" data-log-clear-filters>Limpiar búsqueda</button>
      </div>`;
    } else {
      // Causa (b): filtros activos sin resultados
      emptyHtml = `<div class="log-empty log-empty--filter">
        <span class="log-empty-icon">⚠️</span>
        <span class="log-empty-msg">Sin sesiones con los filtros activos</span>
        <button class="log-empty-cta" data-log-clear-filters>Limpiar filtros</button>
      </div>`;
    }
  }

  // B-257: marcar pills/controles con advertencia cuando filtros activos producen cero resultados
  const filtersWarnClass = (!filtered.length && hasActiveFilter && all.length) ? ' log-filters-row--warn' : '';

  const body = filtered.length ? rows : emptyHtml;
  const scrollTopBtn = `<button class="log-scroll-top hidden" id="log-scroll-top" title="Ir al inicio">↑</button>`;

  // Inyectar warn class en log-filters-row post-render
  const headerWithWarn = filtersWarnClass
    ? header.replace('class="log-filters-row"', `class="log-filters-row${filtersWarnClass}"`)
    : header;

  card.innerHTML = `${headerWithWarn}<div class="log-card-body" id="log-body">${body}</div>${scrollTopBtn}`;

  // ── Event delegation post-render ──────────────────────────────────────────
  const _lcClose = document.getElementById('log-card-close-btn');
  if (_lcClose) _lcClose.addEventListener('click', closeLogCard);

  const _lcSearch = document.getElementById('log-search-input');
  if (_lcSearch) _lcSearch.addEventListener('input', onLogSearch);

  const _lcProjSel = document.getElementById('log-proj-select');
  if (_lcProjSel) _lcProjSel.addEventListener('change', function() { setLogFilterProj(this.value); });

  card.querySelectorAll('[data-log-filter-ai]').forEach(function(btn) {
    btn.addEventListener('click', function() { setLogFilterAI(btn.dataset.logFilterAi); });
  });

  card.querySelectorAll('[data-log-filter-type]').forEach(function(btn) {
    btn.addEventListener('click', function() { setLogFilterType(btn.dataset.logFilterType); });
  });

  const _lcStarredPill = card.querySelector('[data-log-filter-starred]');
  if (_lcStarredPill) _lcStarredPill.addEventListener('click', setLogFilterStarred);

  card.querySelectorAll('[data-log-clear-filters]').forEach(function(btn) {
    btn.addEventListener('click', clearLogFilters);
  });

  const _lcScrollTop = document.getElementById('log-scroll-top');
  if (_lcScrollTop) _lcScrollTop.addEventListener('click', _logScrollTop);

  // Filas del log — click en la fila abre detail; click en ref pill navega sin abrir detail
  card.querySelectorAll('.log-row[data-log-ai]').forEach(function(row) {
    row.addEventListener('click', function() {
      openDetail(row.dataset.logAi, row.dataset.logSess);
    });
  });

  card.querySelectorAll('[data-log-nav-code]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigateToBacklogItem(btn.dataset.logNavCode);
    });
  });

  // Scroll-to-top button visibility
  // B-202605-053: variable de módulo _logScrollHandler — card.innerHTML destruye #log-body en cada
  // render, por lo que guardar la referencia en el elemento DOM deja el handler huérfano.
  const logBody = document.getElementById('log-body');
  const scrollBtn = document.getElementById('log-scroll-top');
  if (logBody && scrollBtn) {
    if (_logScrollHandler) {
      logBody.removeEventListener('scroll', _logScrollHandler);
    }
    _logScrollHandler = () => {
      scrollBtn.classList.toggle('is-hidden', logBody.scrollTop <= 120);
      scrollBtn.classList.toggle('d-flex', logBody.scrollTop > 120);
    };
    logBody.addEventListener('scroll', _logScrollHandler, { passive: true });
  }
}

function _logScrollTop() {
  const body = document.getElementById('log-body');
  if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
}

export function scrollToLogCard(highlightSessId) {
  if (getCurrentTab() !== 'sesiones') switchTab('sesiones');

  const grid = document.getElementById('grid');
  const detailEmpty = document.getElementById('tracker-detail-empty');
  const card = document.getElementById('log-card');

  if (grid) grid.classList.add('is-hidden');
  if (detailEmpty) detailEmpty.classList.add('is-hidden');
  if (card) card.classList.remove('is-hidden');

  _rebuildLogBody();

  requestAnimationFrame(() => {
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (highlightSessId) {
      const row = document.getElementById('log-row-' + highlightSessId);
      if (row) {
        row.classList.add('log-row--highlight');
        setTimeout(() => row.classList.remove('log-row--highlight'), 1800);
      }
    }
  });
}

export function closeLogCard() {
  const grid = document.getElementById('grid');
  const detailEmpty = document.getElementById('tracker-detail-empty');
  const card = document.getElementById('log-card');

  if (card) card.classList.add('is-hidden');
  if (grid) grid.classList.remove('is-hidden');
  if (detailEmpty) detailEmpty.classList.remove('is-hidden');
}

function setLogFilterAI(aiId) {
  _logFilterAI = _logFilterAI === aiId ? '' : aiId;
  _saveLogFilters();
  _rebuildLogBody();
}

function setLogFilterType(type) {
  _logFilterType = type;
  _saveLogFilters();
  _rebuildLogBody();
}

function setLogFilterProj(projId) {
  _logFilterProj = projId;
  _saveLogFilters();
  _rebuildLogBody();
}

function setLogFilterStarred() {
  _logFilterStarred = !_logFilterStarred;
  _saveLogFilters();
  _rebuildLogBody();
}

// B-256: reset completo de filtros del log — CTA del empty state
function clearLogFilters() {
  _logFilterAI      = '';
  _logFilterType    = 'all';
  _logFilterStarred = false;
  _logSearch        = '';
  _saveLogFilters();
  const inp = document.getElementById('log-search-input');
  if (inp) inp.value = '';
  _rebuildLogBody();
}

function onLogSearch() {
  const inp = document.getElementById('log-search-input');
  _logSearch = inp ? inp.value : '';
  _rebuildLogBody();
}

// Hook: parchear render() global para que siempre reconstruya el log card.
// Se ejecuta tras window.onload, momento en que todos los módulos JS ya están cargados.
window.addEventListener('load', function() {
  // Restaurar filtros persistidos
  _loadLogFilters();

  // B-202605-002: patch de navigateToCard eliminado.
  // El patch causaba render() como efecto secundario (via switchTab) que destruía
  // el DOM del preview al cambiar de IA. closeLogCard() se dispara desde
  // selectTrackerAI() en locus-tracker.js — no se necesita interceptar aquí.

  // ESC para cerrar log card
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const card = document.getElementById('log-card');
      if (card && !card.classList.contains('is-hidden')) {
        closeLogCard();
      }
    }
  });

  // Click fuera del log card cierra — usar captura en el card para detener propagación interna
  document.addEventListener('click', function(e) {
    const card = document.getElementById('log-card');
    if (!card || card.classList.contains('is-hidden')) return;
    // Si el target ya fue removido del DOM (ej: _rebuildLogBody hizo innerHTML), no cerrar
    if (!document.contains(e.target)) return;
    // Si el click fue dentro del log-card, no cerrar
    if (card.contains(e.target)) return;
    // El log card vive dentro de #tracker-detail — solo cerrar si click fuera de ese contenedor
    const container = document.getElementById('tracker-detail') || card.parentElement;
    if (container && !container.contains(e.target)) {
      // Verificar que no sea el botón que abre el log
      const logBtn = document.querySelector('.tsb-log-btn');
      if (logBtn && logBtn.contains(e.target)) return;
      closeLogCard();
    }
  });

  // Ocultar log card por defecto al iniciar
  const card = document.getElementById('log-card');
  if (card) card.classList.add('is-hidden');

  _rebuildLogBody();
});

// R-202604-021: Navegar a un ítem del backlog por código
function navigateToBacklogItem(code) {
  if (!code) return;
  switchTab('backlog');
  switchSubTab('backlog');
  // Esperar a que el tab y la lista rendericen antes de scrollear
  setTimeout(() => {
    const el = document.querySelector(`.bitem[data-code="${CSS.escape(code)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('bitem--nav-highlight');
    setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1800);
  }, 120);
}
