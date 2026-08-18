// [PP] mod:7 · autor:Rune · 2026-08-18 22:30 UTC-6
// TKT1 (REQ CAEL-08061000-01): interpretHora() gana withinResetWindow — ventana máxima
// de negocio de 5h para que un worker quede exhausted. Criterio único consumido por
// _horaUpdate (visual, este archivo) y por los tres confirm handlers externos (Quick
// Capture, panel DIFF, modal de corrección de hora) — mismas reglas en los cuatro
// puntos de consumo, sin duplicar el cálculo.
// INC-202608-092: _horaUpdate() solo reescribía inputEl.value cuando raw.length > 4
// tras stripear no-dígitos — pero maxlength="4" del input (locus-backlog-merge.js
// #mdiff-duration-input) cuenta caracteres, no dígitos, y truncaba nativamente antes
// de que esta función pudiera intervenir (ej. "21:30" → navegador trunca a "21:3" →
// stripeado "213", 3 dígitos, nunca superaba el umbral que disparaba la reescritura).
// interpretHora("213") interpretaba 2:13 en vez de 21:30 — sin error visible, solo
// hora incorrecta. Fix de causa raíz: reescribir inputEl.value = raw en cada evento
// input, no solo al superar 4 dígitos — unifica unidad de conteo (dígito) entre esta
// función y el atributo maxlength nativo (carácter) para cualquier input que la use.
// TKT-202607-217 (origen DISC-202607-079): parseHora/horaKey/correctHora eliminadas —
// dead code confirmado, sin export, sin exposición a window, sin caller real en el
// proyecto. Comentario huérfano de exposición a window (fin de archivo) retirado junto.
// INC histórico — sin CHECKPOINT confirmado: getState() importado — typeof state !== 'undefined' en
// _showProjRequiredInPanel nunca era true (state es var privada de locus-storage.js,
// exportada pero no importada aquí). Lista de proyectos en el banner de "selecciona
// proyecto" siempre estaba vacía — banner mostraba "No hay proyectos creados" aunque
// sí los hubiera. Fix: getState().projects, mismo patrón ya usado en getProjectById.
// locus-session-hora.js
import { _doSaveSession, saveSession } from './locus-session-save.js';
import { getAI, getState } from './locus-storage.js'; // INC histórico — sin CHECKPOINT confirmado: getState agregado — guard typeof state muerto

import { esc } from './locus-ui-shell.js';


// Responsabilidad: Componente de hora — _horaUpdate, interpretHora, fmt12, relDate, confirmSave.
// Dependencias: locus-storage.js · locus-toast.js · locus-session-parse.js

export function _horaUpdate(inputEl, dispEl) {
  if (!dispEl) return;
  // B-202606-018 + INC-202608-092: siempre reescribir con solo dígitos — no solo al
  // superar 4. Un maxlength nativo en el input cuenta caracteres, no dígitos: con
  // separador (ej. "21:30") el navegador puede truncar a 4 caracteres ("21:3") antes
  // de que este stripeo corra, dejando un resultado de 3 dígitos que nunca disparaba
  // la reescritura previa (solo activa con raw.length > 4) y perdía el dígito final.
  let raw = inputEl ? inputEl.value.replace(/\D/g, '') : '';
  if (raw.length > 4) raw = raw.slice(0, 4);
  if (inputEl && inputEl.value !== raw) inputEl.value = raw;
  const result = interpretHora(raw);
  if (result && !result.withinResetWindow) {
    // TKT1 (REQ CAEL-08061000-01): hora válida pero fuera de la ventana de 5h.
    dispEl.textContent = 'máximo 5 horas desde ahora';
    dispEl.className = 'hora-disp--error';
    if (inputEl) inputEl.classList.add('error');
  } else if (result) {
    dispEl.textContent = result.label;
    dispEl.className = 'hora-disp--valid';
    if (inputEl) inputEl.classList.remove('error');
  } else {
    if (raw.length >= 3) {
      dispEl.textContent = 'hora inválida';
      dispEl.className = 'hora-disp--error';
      if (inputEl) inputEl.classList.add('error');
    } else {
      dispEl.textContent = raw.length ? '...' : '—';
      dispEl.className = 'hora-disp--hint';
      if (inputEl) inputEl.classList.remove('error');
    }
  }
}

export function interpretHora(raw) {
  if (!raw) return null;
  let h, m;
  if (raw.length === 1) { h = parseInt(raw); m = 0; }
  else if (raw.length === 2) { h = parseInt(raw); m = 0; }
  else if (raw.length === 3) { h = parseInt(raw.slice(0,1)); m = parseInt(raw.slice(1)); }
  else if (raw.length === 4) { h = parseInt(raw.slice(0,2)); m = parseInt(raw.slice(2)); }
  else return null;
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  const hhmm = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  // B-202604-009: epoch absoluto — próxima ocurrencia futura de esta hora
  const _r = new Date(); _r.setHours(h, m, 0, 0);
  if (_r <= new Date()) _r.setDate(_r.getDate() + 1);
  const epoch = _r.getTime();
  // TKT1 (REQ CAEL-08061000-01): withinResetWindow — inclusive, exactamente 5h se
  // considera dentro de la ventana. Único criterio, consumido por _horaUpdate (abajo)
  // y por los tres confirm handlers externos vía este mismo campo del retorno.
  const withinResetWindow = (epoch - Date.now()) <= 5 * 60 * 60 * 1000;
  return {h, m, hhmm, label: `${h12}:${String(m).padStart(2,'0')} ${period}`, epoch, withinResetWindow};
}

export function fmt12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  return `${h12}:${String(m).padStart(2,'0')} ${p}`;
}

// T-202604-028: fecha relativa
// Acepta timestamp numérico (ms) o string de fecha "3 May. 2026".
// Para timestamps < 24h emite "hace X min" / "hace X h" en lugar de "Hoy".
export function relDate(dateStr, ts) {
  if (!dateStr && !ts) return '';

  // — Rama 1: valor numérico (timestamp ms directo) —
  const asNum = typeof dateStr === 'number' ? dateStr
    : (typeof dateStr === 'string' && /^\d{10,13}$/.test(dateStr.trim())) ? parseInt(dateStr) : null;
  if (asNum) {
    const diffMs  = Date.now() - asNum;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMin  < 2)  return 'ahora';
    if (diffMin  < 60) return `hace ${diffMin} min`;
    if (diffHrs  < 24) return `hace ${diffHrs} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 6)  return `Hace ${diffDays} días`;
    if (diffDays <= 13) return 'Hace 1 semana';
    if (diffDays <= 27) return `Hace ${Math.floor(diffDays/7)} semanas`;
    if (diffDays <= 45) return 'Hace 1 mes';
    return `Hace ${Math.floor(diffDays/30)} meses`;
  }

  // — Rama 2: string de fecha "3 May. 2026" —
  if (!dateStr) return '';
  const m = dateStr.match(/(\d{1,2})\s+(\w+)\.?\s+(\d{4})/);
  if (!m) return '';
  const months = {ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11};
  const mon = months[m[2].toLowerCase().replace('.','')];
  if (mon === undefined) return '';
  const d = new Date(parseInt(m[3]), mon, parseInt(m[1]));
  const now = new Date(); now.setHours(0,0,0,0); d.setHours(0,0,0,0);
  const diff = Math.round((now - d) / 86400000);
  if (diff === 0) {
    // Si el caller pasó el timestamp real, usarlo para precisión sub-24h
    if (ts) {
      const diffMs  = Date.now() - ts;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMs / 3600000);
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    return 'Hoy';
  }
  if (diff === 1) return 'Ayer';
  if (diff <= 6) return `Hace ${diff} días`;
  if (diff <= 13) return 'Hace 1 semana';
  if (diff <= 27) return `Hace ${Math.floor(diff/7)} semanas`;
  if (diff <= 45) return 'Hace 1 mes';
  return `Hace ${Math.floor(diff/30)} meses`;
}

// T-202604-103: paso de confirmación inline antes de guardar
// T-202604-051: confirmSave llama directamente a saveSession — sin paso intermedio
const _confirmTimers = {};

// T-202604-190: ID de sesión quick a completar — si está seteado, saveSession actualiza en lugar de crear
let _pendingCompleteId = null;
// R-202605-095: abre el panel item-viz con banner bloqueante cuando no hay proyecto seleccionado.
// El botón Guardar queda en estado --btn-blocked hasta que el usuario selecciona proyecto en el card.
// No dispara toast — la advertencia vive completamente dentro del panel.
export function _showProjRequiredInPanel(id, parsed, horaResult) {
  // histórico — sin CHECKPOINT confirmado fix: guardar foco antes de cualquier mutación DOM (body.innerHTML + cloneNode)
  const _vizPrevFocus = document.activeElement;

  const overlay = document.getElementById('item-viz-overlay');
  const confirmBtn = document.getElementById('item-viz-confirm-btn');
  const body = document.getElementById('item-viz-body');
  if (!overlay || !confirmBtn || !body) return;

  // Construir lista de proyectos para el banner
  const projects = getState().projects || [];
  const projOptions = projects.map(p =>
    `<option value="${esc(p.id)}">${esc(p.name || p.id)}</option>`
  ).join('');
  const hasProjOptions = projects.length > 0;

  // Banner de advertencia — zona superior del body, estado visual diferenciado
  body.innerHTML = `
    <div class="iviz-proj-required" id="iviz-proj-required-banner" role="alert">
      <div class="iviz-proj-required-icon" aria-hidden="true">⚠</div>
      <div class="iviz-proj-required-content">
        <div class="iviz-proj-required-title">Selecciona un proyecto para continuar</div>
        <div class="iviz-proj-required-desc">La sesión no tiene un proyecto asignado. Elige uno para poder guardar.</div>
        ${hasProjOptions ? `
          <select class="iviz-proj-select" id="iviz-proj-select"
            aria-label="Seleccionar proyecto" aria-required="true">
            <option value="">— Elige un proyecto —</option>
            ${projOptions}
          </select>` : `<div class="iviz-proj-empty">No hay proyectos creados. Crea uno primero desde el panel de Proyectos.</div>`}
      </div>
    </div>`;

  // AC-6: botón bloqueado sin disabled nativo — aria-disabled + clase CSS
  // El click handler hace guard explícito. El botón sigue siendo focusable (Tab/Space/Enter).
  const _newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(_newConfirmBtn, confirmBtn);
  _newConfirmBtn.classList.add('item-viz-confirm-btn--blocked');
  _newConfirmBtn.setAttribute('aria-disabled', 'true');
  _newConfirmBtn.setAttribute('title', 'Selecciona un proyecto para habilitar el guardado');

  let _resolvedProj = null;

  // Listener único en el select — actualiza estado del botón
  const _projSelect = document.getElementById('iviz-proj-select');
  if (_projSelect) {
    _projSelect.addEventListener('change', () => {
      const selId = _projSelect.value;
      _resolvedProj = selId ? (projects.find(p => p.id === selId) || null) : null;
      const banner = document.getElementById('iviz-proj-required-banner');
      if (_resolvedProj) {
        _newConfirmBtn.classList.remove('item-viz-confirm-btn--blocked');
        _newConfirmBtn.removeAttribute('aria-disabled');
        _newConfirmBtn.removeAttribute('title');
        if (banner) banner.classList.add('iviz-proj-required--resolved');
      } else {
        _newConfirmBtn.classList.add('item-viz-confirm-btn--blocked');
        _newConfirmBtn.setAttribute('aria-disabled', 'true');
        _newConfirmBtn.setAttribute('title', 'Selecciona un proyecto para habilitar el guardado');
        if (banner) banner.classList.remove('iviz-proj-required--resolved');
      }
    });
  }

  // Handler de confirmación con guard explícito (AC-6: no depende de disabled nativo)
  _newConfirmBtn.addEventListener('click', () => {
    if (!_resolvedProj) return;
    overlay.classList.add('closing');
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.classList.remove('closing', 'item-viz--flex');
      // histórico — sin CHECKPOINT confirmado: restaurar foco al elemento que lo tenía antes de abrir
      if (_vizPrevFocus && typeof _vizPrevFocus.focus === 'function') {
        _vizPrevFocus.focus();
      }
    }, 220);
    // Sincronizar selector del card para que el estado quede consistente
    const projSelectEl = document.getElementById('sess-proj-' + id);
    if (projSelectEl) { projSelectEl.value = _resolvedProj.id; }
    _doSaveSession(id, getAI(id), parsed, _resolvedProj, horaResult);
  }, { once: true });

  // Abrir panel
  overlay.classList.remove('closing');
  overlay.classList.add('open', 'item-viz--flex');
  // histórico — sin CHECKPOINT confirmado: mover foco al overlay para lectores de pantalla
  overlay.focus();
}

export function confirmSave(id) {
  saveSession(id);
}

function cancelConfirmSave(id) {
  // Mantenido por compatibilidad con referencias existentes — no-op
}

// R-202605-065: ⌘+Enter / Ctrl+Enter en textarea de AI Card → guardar sesión
// Delegación a nivel document — captura textareas generados dinámicamente por buildCard.
// Guard de id: solo activa en elementos con id 'ta-{aiId}' para no interferir con
// otros contextos (modales, IDP, búsqueda, item-editor-overlay, standalone-checkpoint-ta).
(function _initTaGuardarShortcut() {
  document.addEventListener('keydown', function _taGuardarKeydown(e) {
    // Solo ⌘+Enter (Mac) y Ctrl+Enter (Win/Linux)
    if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;

    const ta = e.target;
    if (!ta || ta.tagName !== 'TEXTAREA') return;

    // Guard: solo textareas principales de AI Card (id="ta-{aiId}")
    const taId = ta.id || '';
    if (!taId.startsWith('ta-')) return;

    // Guard: no disparar si el textarea está vacío (mismo comportamiento que botón deshabilitado)
    if (!ta.value.trim()) return;

    // Guard: no disparar si hay un modal/overlay de mayor prioridad abierto
    const _blockers = [
      'item-editor-overlay',
      'item-viz-overlay',
      'merge-diff-overlay',
      'gconfirm-overlay',
      'proj-modal-overlay',
    ];
    for (const bid of _blockers) {
      const el = document.getElementById(bid);
      if (el && (el.offsetParent !== null || el.classList.contains('open'))) return;
    }

    e.preventDefault();
    e.stopPropagation();

    const aiId = taId.slice(3); // strip 'ta-'
    confirmSave(aiId);
  }, true); // capture phase — antes de que otros handlers puedan consumir el evento
})();

// T-202604-295: helper persistente para trigger de descarga de templates
const _TMPL_TRIGGER_KEY = 'template-download-trigger';
export function _templateTrigger() {
  return localStorage.getItem(_TMPL_TRIGGER_KEY) || 'session';
}
