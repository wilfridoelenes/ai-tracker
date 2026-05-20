// locus-checkpoint-viz.js
// Responsabilidad: Corrección de hora (B-202604-094), Item Viz Panel (R-202604-036),
//   panel de Arranque (R-202604-072).
// Dependencias: locus-checkpoint-stats.js · locus-storage.js · locus-toast.js

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
    save(); if (typeof render === 'function') render();
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
  save(); if (typeof render === 'function') render();
  if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
}

// T-202604-299: beforeunload → en locus-storage.js

// ─── R-202604-036: _showItemVizPanel — visualizador de ítems al parsear paste ───
// Reemplaza T-202604-201 (panel diff genérico)
// Muestra tabla de ítems con: código, tipo, título, status resultante,
// datos de backlog si existe, campos inline si es nuevo, checkbox excluir, Ver en Backlog
// Nota: backlog.js expone showMergeDiffPanel (merge-diff-overlay, dry-run) — nombre compartido
// resuelto: esta función renombrada a _showItemVizPanel para evitar colisión de nombres.

let _itemVizPendingCb = null;
let _itemVizItems     = null;
let _itemVizSessId    = null;
let _itemVizProjId    = null;
// Estado de exclusiones — set de índices excluidos
let _itemVizExcluded  = new Set();
let _itemVizKeyHandler = null; // T-202605-429: ref al handler Enter para limpieza en close

function _showItemVizPanel(tgItems, sessId, projId, onConfirm) {
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

// ══ R-202604-059: Grid Tracker 3 columnas — lógica JS ══
// T-202604-367: historial col 2 | T-202604-368: preview col 3 | T-202604-372: drag & drop

// ══ END R-202604-059 ══
// Funciones tracker hist/drag/mobile migradas a locus-tracker.js

// R-migración Firebase→Supabase eliminada — AC-8: migración completada

