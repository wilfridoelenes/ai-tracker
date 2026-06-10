// [PP] v1.0.0 · sprint:PP-S-01 · mod:1 · autor:Rune · 2026-06-11 07:00 UTC-6
// locus-sesiones-viz.js
// Responsabilidad: Panel diff de CHECKPOINT (showCheckpointPanel), Item Viz Panel
//   (_showItemVizPanel), corrección de hora (openCorrectHora).
// Extraído de: locus-checkpoint-viz.js
// Dependencias: locus-sesiones-stats.js · locus-storage.js · locus-toast.js
// Carga después de: locus-sesiones-stats.js · locus-sesiones-capture.js
import { render } from './locus-sesiones.js';
import { getItems } from './locus-backlog-core.js';
import { switchSubTab, switchTab } from './locus-ui-shell.js';

import { fmt12, interpretHora } from './locus-session-hora.js';

import { getAI, getAISessions, save } from './locus-storage.js';

// ── B-202604-094: Corregir hora de desbloqueo desde card ──
let _correctHoraAIId = null;

function openCorrectHora(id) {
  const ai = getAI(id);
  if (!ai) return;
  _correctHoraAIId = id;

  const modal = document.getElementById('gconfirm-overlay');
  const title = document.getElementById('gconfirm-title');
  const msg = document.getElementById('gconfirm-msg');
  const okBtn = document.getElementById('gconfirm-ok-btn');
  if (!modal) return;

  title.textContent = '⏰ Corregir hora de desbloqueo';
  const inputWrap = document.getElementById('gconfirm-input-wrap');
  if (inputWrap) inputWrap.classList.add('is-hidden');

  const currentLabel = ai.resetTime ? fmt12(ai.resetTime) : '(sin hora)';
  msg.innerHTML = `
    <div class="correct-hora-current">Hora actual: <strong>${esc(currentLabel)}</strong></div>
    <div class="correct-hora-input-row">
      <input id="correct-hora-input" class="hora-input correct-hora-input" type="text" maxlength="4" placeholder="--:--">
      <div id="correct-hora-disp" class="correct-hora-disp">—</div>
      <div id="correct-hora-warn" class="correct-hora-warn is-hidden" aria-live="polite"></div>
    </div>
    <div class="correct-hora-unlock-row">
      <button class="btn-ghost correct-hora-unlock-btn" id="correct-hora-unlock-btn">✅ Desbloquear ahora</button>
    </div>`;

  // Eventos post-render — CSS Purity
  const _chInput = document.getElementById('correct-hora-input');
  if (_chInput) {
    _chInput.addEventListener('input', function() {
      // B-202606-018: truncar a 4 dígitos en tiempo real
      let raw = (_chInput.value || '').replace(/\D/g, '');
      if (raw.length > 4) { raw = raw.slice(0, 4); _chInput.value = raw; }
      const disp = document.getElementById('correct-hora-disp');
      const warn = document.getElementById('correct-hora-warn');
      const r = interpretHora(raw);
      if (disp) {
        disp.textContent = r ? r.label : (raw.length >= 3 ? 'hora inválida' : (raw.length ? '...' : '—'));
        disp.className = r ? 'hora-disp--valid' : (raw.length >= 3 ? 'hora-disp--error' : 'hora-disp--hint');
      }
      // T-202606-065: advertencia no bloqueante si hora > 5h desde ahora
      if (warn) {
        if (r && (r.epoch - Date.now()) > 5 * 3600000) {
          warn.textContent = '⚠ ¿Más de 5h?';
          warn.classList.remove('is-hidden');
        } else {
          warn.textContent = '';
          warn.classList.add('is-hidden');
        }
      }
    });
    _chInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') { event.preventDefault(); confirmCorrectHora(); }
    });
  }
  const _chUnlockBtn = document.getElementById('correct-hora-unlock-btn');
  if (_chUnlockBtn) {
    _chUnlockBtn.addEventListener('click', function() { unlockNowFromCard(); });
  }

  okBtn.textContent = 'Guardar';
  okBtn.className = 'btn-primary';
  okBtn.onclick = confirmCorrectHora;
  const cancelBtn = modal.querySelector('button:not(#gconfirm-ok-btn)');
  if (cancelBtn) cancelBtn.onclick = () => { _correctHoraAIId = null; modal.classList.remove('open'); };

  // B-202604-094 fix: diferir classList.add('open') al siguiente tick para evitar
  // que el click que originó esta llamada sea interpretado como click-outside
  setTimeout(() => {
    modal.classList.add('open');
    setTimeout(() => {
      const inp = document.getElementById('correct-hora-input');
      if (inp) {
        if (ai.resetTime) inp.value = ai.resetTime.replace(':', '');
        inp.focus(); inp.select();
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
    // B-202606-019: asegurar que la IA queda exhausted al guardar hora desde modal diff
    ai.status = 'exhausted';
    ai.resetTime = result.hhmm;
    ai.resetEpoch = result.epoch;
    const aiSessions = getAISessions(id);
    if (aiSessions.length > 0) {
      const lastSess = aiSessions[aiSessions.length - 1];
      lastSess.resetAt = result.label;
    }
    save(); render();
    if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
  } else {
    inp.classList.add('error');
    setTimeout(() => inp.classList.remove('error'), 1200);
    return;
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

// ─── R-202604-036: _showItemVizPanel — visualizador de ítems al parsear paste ───

let _itemVizPendingCb = null;
let _itemVizItems     = null;
let _itemVizSessId    = null;
let _itemVizProjId    = null;
let _itemVizExcluded  = new Set();
let _itemVizKeyHandler = null;

function _showItemVizPanel(tgItems, sessId, projId, onConfirm) {
  if (!tgItems || !tgItems.length) { onConfirm(); return; }

  _itemVizPendingCb = onConfirm;
  _itemVizItems     = tgItems;
  _itemVizSessId    = sessId;
  _itemVizProjId    = projId;
  _itemVizExcluded  = new Set();

  tgItems.forEach((item, idx) => {
    const bk = (typeof getItems() !== 'undefined') ? getItems().find(i => i.code === item.code) || null : null;
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

  const _vizKeyHandler = (e) => {
    if (e.key !== 'Enter') return;
    const tag = (document.activeElement || {}).tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener('keydown', _vizKeyHandler);
    _itemVizConfirm();
  };
  document.addEventListener('keydown', _vizKeyHandler);
  _itemVizKeyHandler = _vizKeyHandler;
}

export function _itemVizClose() {
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
  if (_itemVizKeyHandler) {
    document.removeEventListener('keydown', _itemVizKeyHandler);
    _itemVizKeyHandler = null;
  }
}

export function _itemVizConfirm() {
  if (!_itemVizPendingCb || !_itemVizItems) return;
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
  switchTab('backlog');
  switchSubTab('backlog');
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

  const _getBacklogItem = (code) => {
    if (typeof getItems() === 'undefined') return null;
    return getItems().find(i => i.code === code) || null;
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

  const sinCambioIdxs = new Set(
    items.map((item, idx) => _isSinCambio(item) ? idx : -1).filter(i => i >= 0)
  );
  const activeItems    = items.filter((_, idx) => !sinCambioIdxs.has(idx));
  const sinCambioItems = items.filter((_, idx) =>  sinCambioIdxs.has(idx));

  const userExcluded = [..._itemVizExcluded].filter(idx => !sinCambioIdxs.has(idx));
  const toSave = activeItems.length - userExcluded.length;

  if (confirmBtn) {
    const note = sinCambioItems.length ? ` · ${sinCambioItems.length} sin cambios ignorados` : '';
    confirmBtn.textContent = userExcluded.length
      ? `Guardar sesión (${toSave} de ${activeItems.length})${note}`
      : `Guardar sesión (${toSave})${note}`;
  }

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
        ${!isSinCambio ? `<button class="viz-nav-btn" data-viz-nav-code="${esc(item.code)}" title="Ver en Backlog">→ Backlog</button>` : ''}
      </div>` : '';

    const newBlock = (!bkItem && isReal) ? `
      <div class="viz-new-fields">
        ${item.effort ? `<span class="viz-new-chip">effort: ${item.effort}</span>` : ''}
        ${item.area   ? `<span class="viz-new-chip">area: ${esc(item.area)}</span>`   : ''}
        ${item.ac && item.ac.length ? `<div class="viz-new-ac"><span class="viz-new-chip viz-new-chip--ac">AC</span> ${item.ac.map(a => `<span class="viz-ac-item">${esc(a)}</span>`).join('')}</div>` : ''}
      </div>` : '';

    const fieldDiffs = mergeResult === 'actualizado' ? _fieldDiffChips(item, bkItem) : '';

    const codeDisplay = isReal
      ? `<button class="viz-code viz-code--real viz-code--copyable" data-type-color="${esc(typeColor)}" data-code="${esc(item.code)}" title="Click para copiar">${esc(item.code)}</button>`
      : `<span class="viz-code viz-code--pending">${esc(item.code)}</span>`;

    const checkboxHtml = !isSinCambio
      ? `<label class="viz-checkbox-wrap" title="${isExcluded ? 'Incluir en merge' : 'Excluir del merge'}">
          <input type="checkbox" class="viz-checkbox" data-viz-idx="${idx}" ${isExcluded ? '' : 'checked'}>
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

  const activeRows = activeItems.map(item => _buildRow(item, items.indexOf(item), false)).join('');

  const newCount = activeItems.filter(item => !_getBacklogItem(item.code)).length;
  const updCount = activeItems.filter(item =>  !!_getBacklogItem(item.code)).length;
  const summary = `<div class="viz-summary">
    ${newCount ? `<span class="viz-sum-chip viz-sum-new">${newCount} nuevo${newCount !== 1 ? 's' : ''}</span>` : ''}
    ${updCount ? `<span class="viz-sum-chip viz-sum-upd">${updCount} actualización${updCount !== 1 ? 'es' : ''}</span>` : ''}
    ${sinCambioItems.length ? `<span class="viz-sum-chip viz-sum-sinc">${sinCambioItems.length} sin cambios</span>` : ''}
  </div>`;

  let sinCambioGroup = '';
  if (sinCambioItems.length) {
    const sinCambioRows = sinCambioItems.map(item => _buildRow(item, items.indexOf(item), true)).join('');
    sinCambioGroup = `
      <div class="viz-sinc-group" id="viz-sinc-group">
        <button class="viz-sinc-header" id="viz-sinc-header-btn">
          <span class="viz-sinc-label">${sinCambioItems.length} ítem${sinCambioItems.length !== 1 ? 's' : ''} ya existen sin cambios — se ignorarán</span>
          <span class="viz-sinc-chevron" id="viz-sinc-chevron">▸</span>
        </button>
        <div class="viz-sinc-body" id="viz-sinc-body">
          ${sinCambioRows}
        </div>
      </div>`;
  }

  body.innerHTML = summary + `<div class="viz-rows">${activeRows}</div>` + sinCambioGroup;

  // Event delegation post-render — CSS Purity
  body.querySelectorAll('.viz-checkbox[data-viz-idx]').forEach(function(cb) {
    cb.addEventListener('change', function() {
      _itemVizToggleExclude(parseInt(cb.dataset.vizIdx, 10));
    });
  });
  body.querySelectorAll('[data-viz-nav-code]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _itemVizNavBacklog(btn.dataset.vizNavCode);
    });
  });
  body.querySelectorAll('.viz-code--copyable[data-code]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      _vizCopyCode(e, btn);
    });
  });
  const _sincHeaderBtn = document.getElementById('viz-sinc-header-btn');
  if (_sincHeaderBtn) {
    _sincHeaderBtn.addEventListener('click', function() { _itemVizToggleSinCambios(); });
  }

  // CSS Purity: colores de tipo calculados en runtime → custom properties CSS
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

// B-202605-505: helper de copia segura
export function _copyTextSafe(text) {
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

// ══ showCheckpointPanel — R-202605-140 ══

let _lastCheckpointResult = null;
let _ckptPanelTimer = null;

export function getLastCheckpointResult() { return _lastCheckpointResult; }
const _CKPT_PANEL_DURATION = 12000;

export function showCheckpointPanel(data) {
  const panel  = document.getElementById('ckpt-panel');
  const body   = document.getElementById('ckpt-body');
  const bar    = document.getElementById('ckpt-bar');
  const reopen = document.getElementById('ckpt-reopen-btn');
  if (!panel || !body) return;

  _lastCheckpointResult = data;

  const _isInfoOnly = (v) => !v || v.trim().toLowerCase() === 'n/a';
  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const sections = [
    { key: 'created',   label: '✅ Creados',      cls: 'ckpt-created'   },
    { key: 'advanced',  label: '⬆ Avanzados',     cls: 'ckpt-advanced'  },
    { key: 'updated',   label: '✏ Actualizados',  cls: 'ckpt-updated'   },
    { key: 'retroceso', label: '⚠ Retroceso',     cls: 'ckpt-retroceso' },
    { key: 'discarded', label: '🗑 Descartados',   cls: 'ckpt-discarded' },
    { key: 'ignored',   label: '— Ignorados',      cls: 'ckpt-ignored'   },
  ];

  let html = '';

  sections.forEach(({ key, label, cls }) => {
    const items = data[key];
    if (!items || !items.length) return;
    html += `<div class="ckpt-section ${cls}">`;
    html += `<div class="ckpt-section-label">${label}</div>`;
    html += `<ul class="ckpt-item-list">`;
    items.forEach(item => {
      const code  = item.code  ? `<span class="ckpt-item-code">${esc(item.code)}</span>` : '';
      const title = item.title ? esc(item.title) : (item.code ? '' : esc(String(item)));
      html += `<li class="ckpt-item-row">${code}<span class="ckpt-item-title">${title}</span></li>`;
    });
    html += `</ul></div>`;
  });

  if (data.contextSections && data.contextSections.length) {
    html += `<div class="ckpt-section ckpt-context">`;
    html += `<div class="ckpt-section-label">📄 Context actualizado</div>`;
    html += `<ul class="ckpt-item-list">`;
    data.contextSections.forEach(s => {
      html += `<li class="ckpt-item-row"><span class="ckpt-item-title">${esc(s)}</span></li>`;
    });
    html += `</ul></div>`;
  }

  if (!_isInfoOnly(data.proximoPaso)) {
    html += `<div class="ckpt-section ckpt-next">`;
    html += `<div class="ckpt-section-label">➡ Próximo paso</div>`;
    html += `<div class="ckpt-info-text">${esc(data.proximoPaso)}</div>`;
    html += `</div>`;
  }
  if (!_isInfoOnly(data.decision)) {
    html += `<div class="ckpt-section ckpt-decision">`;
    html += `<div class="ckpt-section-label">🔒 Decisión</div>`;
    html += `<div class="ckpt-info-text">${esc(data.decision)}</div>`;
    html += `</div>`;
  }

  body.innerHTML = html;

  panel.classList.add('open');
  if (reopen) reopen.classList.add('is-hidden');

  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '100%';
    void bar.offsetWidth;
    bar.style.transition = `width ${_CKPT_PANEL_DURATION}ms linear`;
    bar.style.width = '0%';
  }

  if (_ckptPanelTimer) clearTimeout(_ckptPanelTimer);
  _ckptPanelTimer = setTimeout(() => closeCkptPanel(), _CKPT_PANEL_DURATION);
}

export function closeCkptPanel() {
  const panel  = document.getElementById('ckpt-panel');
  const bar    = document.getElementById('ckpt-bar');
  const reopen = document.getElementById('ckpt-reopen-btn');

  if (panel) panel.classList.remove('open');
  if (bar)   { bar.style.transition = 'none'; bar.style.width = '0%'; }
  if (reopen && _lastCheckpointResult) reopen.classList.remove('is-hidden');

  if (_ckptPanelTimer) { clearTimeout(_ckptPanelTimer); _ckptPanelTimer = null; }
}

// ══ END showCheckpointPanel ══

// ── Exposición pública — locus-sesiones.js invoca openCorrectHora via guard typeof ──
// Sin esta asignación el guard `typeof openCorrectHora === 'function'` retorna false en ESM
// y los botones open-correct-hora / dot-correct-hora nunca ejecutan nada.

// B-202606-020 fix: locus-ui-shell.js despacha shell:show-checkpoint-panel desde ckpt-reopen-btn
// getLastCheckpointResult() se invoca aquí — locus-ui-shell.js no importa este módulo
window.addEventListener('shell:show-checkpoint-panel', () => { showCheckpointPanel(getLastCheckpointResult()); });