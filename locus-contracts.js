// [PP] v1.0.0 · sprint:PP-S-HOTFIX · mod:3 · autor:Rune · 2026-06-24 UTC-6
// locus-contracts.js
// Última actualización: B-202606-104 — confirmResetSessions() ahora persiste el reset en
// LOCUS_KEYS.STATE ('locus-state-v1') en lugar del string legacy 'ai-tracker-v4', que la app
// ya no lee. El reset local vuelve a tener efecto tras recargar.
// Módulo: Contratos de módulo — renderContratos, _ctr*, openContratoDetail, exportContratosMd
// Extraído de ai-tracker-ai-notes.js
// T-202605-030 Fase 1A: addEventListener para btn-export-contratos, sidebar-danger-btn-contratos,
//              ctr-search-input (oninput), ctr-search-clear (onclick).
//              Elimina inline onclick/oninput de index.html para estas funciones.

// Módulo: Contratos de módulo — renderContratos, _ctr*, openContratoDetail, exportContratosMd
// Extraído de ai-tracker-ai-notes.js

import { renderStats, getItems} from './locus-backlog-core.js';
import { _focusFirstInteractive, _restoreModalFocus } from './locus-modals.js';
import { LOCUS_KEYS, _offlineQueuePush, _tplKey, save, setSyncStatus } from './locus-storage.js';

import { showToast } from './locus-toast.js';

import { switchSubTab, switchTab } from './locus-ui-shell.js';

// ════════════════════════════════════════════════════════════════════
// R-202604-075 · CONTRATOS DE MÓDULO
// ════════════════════════════════════════════════════════════════════

// Storage helpers
function _ctrKey()    { return _tplKey('contratos-data'); }
function _ctrLoad()   { try { return JSON.parse(localStorage.getItem(_ctrKey()) || '{}'); } catch { return {}; } }
function _ctrSave(d)  { try { localStorage.setItem(_ctrKey(), JSON.stringify(d)); } catch(e) { console.error('ctr save error', e); } }

// Modelo:
// contratosData = {
//   [filename]: {
//     file: string,
//     updatedAt: timestamp,
//     updatedBy: string,   // código de ítem o 'manual'
//     functions: [
//       {
//         name: string,
//         signature: string,
//         invariants: string[],
//         sideEffects: string[],
//         lastTouched: string,   // código de ítem
//         riskSprints: string[]  // sprints donde fue modificada
//       }
//     ]
//   }
// }

// Merge de contrato desde un ítem parseado
// ítem.contract = { file, functions: [ { name, signature, invariants, sideEffects, lastTouched, riskSprints } ] }
export function padEnd(s, n) { return String(s).padEnd(n); }

export function _ctrMergeFromItem(itemCode, contract) {
  if (!contract || !contract.file) return;
  const data = _ctrLoad();
  const now = Date.now();
  if (!data[contract.file]) {
    data[contract.file] = { file: contract.file, updatedAt: now, updatedBy: itemCode, functions: [] };
  }
  const mod = data[contract.file];
  mod.updatedAt = now;
  mod.updatedBy = itemCode;
  (contract.functions || []).forEach(fn => {
    if (!fn.name) return;
    const existing = mod.functions.find(f => f.name === fn.name);
    if (existing) {
      if (fn.signature)    existing.signature    = fn.signature;
      if (fn.invariants)   existing.invariants   = fn.invariants;
      if (fn.sideEffects)  existing.sideEffects  = fn.sideEffects;
      existing.lastTouched = itemCode;
      if (fn.riskSprints)  existing.riskSprints  = [...new Set([...(existing.riskSprints||[]), ...fn.riskSprints])];
    } else {
      mod.functions.push({
        name:        fn.name,
        signature:   fn.signature   || '',
        invariants:  fn.invariants  || [],
        sideEffects: fn.sideEffects || [],
        lastTouched: itemCode,
        riskSprints: fn.riskSprints || []
      });
    }
  });
  _ctrSave(data);
  _ctrUpdateBadge();
}

// Badge en nav
function _ctrUpdateBadge() {
  const data = _ctrLoad();
  const badge = document.getElementById('tpl-badge-contratos');
  if (!badge) return;
  const modCount = Object.keys(data).length;
  badge.textContent = modCount > 0 ? modCount : '';
}

// Estado de búsqueda
let _ctrSearchQuery = '';
let _ctrActiveModule = null;

function onContratosSearch() {
  const inp = document.getElementById('ctr-search-input');
  _ctrSearchQuery = inp ? inp.value.trim().toLowerCase() : '';
  const clr = document.getElementById('ctr-search-clear');
  if (clr) clr.classList.toggle('ctr-search-clear--visible', !!_ctrSearchQuery);
  renderContratos();
}

function clearContratosSearch() {
  _ctrSearchQuery = '';
  const inp = document.getElementById('ctr-search-input');
  if (inp) inp.value = '';
  const clr = document.getElementById('ctr-search-clear');
  if (clr) clr.classList.remove('ctr-search-clear--visible');
  renderContratos();
}

// Determinar si una función es área de riesgo — modificada en últimos 2 sprints activos
function _ctrIsRisk(fn) {
  if (!fn.riskSprints || !fn.riskSprints.length) return false;
  const allSprints = (state.projects || []).flatMap(p => p.sprints || []);
  const activeSprints = allSprints.filter(s => s.status !== 'closed').map(s => s.id);
  // Tomar últimos 2 sprints por orden
  const sorted = allSprints.sort((a, b) => (a.id > b.id ? -1 : 1)).slice(0, 2).map(s => s.id);
  const recent = [...new Set([...activeSprints, ...sorted])];
  return fn.riskSprints.some(sp => recent.includes(sp));
}

// Render principal del sub-tab
export function renderContratos() {
  const listEl   = document.getElementById('ctr-list-panel');
  const detailEl = document.getElementById('ctr-detail-panel');
  if (!listEl || !detailEl) return;

  const data = _ctrLoad();
  const modules = Object.values(data);
  _ctrUpdateBadge();

  // Sin contratos → empty state
  if (!modules.length) {
    listEl.innerHTML = `<div class="ctr-empty">
      <span class="ctr-empty-icon">📐</span>
      <p class="ctr-empty-title">Sin contratos definidos</p>
      <p class="ctr-empty-hint">Rune genera el contrato inicial de un módulo en el CHECKPOINT de la primera sesión que lo toca.<br>Agrega el campo <code>contract</code> en un ítem R o T del bloque <code>---getItems()---</code>.</p>
    </div>`;
    detailEl.innerHTML = '';
    return;
  }

  // Filtrar por búsqueda
  const q = _ctrSearchQuery;
  const filtered = q
    ? modules.filter(m =>
        m.file.toLowerCase().includes(q) ||
        (m.functions || []).some(f => f.name.toLowerCase().includes(q) || f.signature.toLowerCase().includes(q))
      )
    : modules;

  if (!filtered.length) {
    listEl.innerHTML = `<div class="ctr-empty"><p class="ctr-empty-title">Sin resultados para "${_ctrSearchQuery}"</p></div>`;
    detailEl.innerHTML = '';
    return;
  }

  // Lista de módulos
  listEl.innerHTML = filtered.map(m => {
    const fnCount   = (m.functions || []).length;
    const riskCount = (m.functions || []).filter(_ctrIsRisk).length;
    const isActive  = _ctrActiveModule === m.file;
    const updDate   = m.updatedAt ? new Date(m.updatedAt).toLocaleDateString('es-MX', { day:'2-digit', month:'short' }) : '—';
    return `<div class="ctr-module-row${isActive ? ' ctr-module-row--active' : ''}" data-file="${_esc(m.file)}">
      <span class="ctr-module-name">${_esc(m.file)}</span>
      <span class="ctr-module-meta">
        <span class="ctr-fn-count" title="${fnCount} funciones">${fnCount} fn</span>
        ${riskCount ? `<span class="ctr-risk-badge" title="${riskCount} función${riskCount !== 1 ? 'es' : ''} modificada${riskCount !== 1 ? 's' : ''} en últimos 2 sprints">⚠ ${riskCount}</span>` : ''}
        <span class="ctr-updated" title="Última actualización">${updDate}</span>
      </span>
    </div>`;
  }).join('');

  // Detalle del módulo activo
  if (_ctrActiveModule && data[_ctrActiveModule]) {
    _renderContratoDetail(data[_ctrActiveModule], detailEl);
  } else {
    detailEl.innerHTML = `<div class="ctr-detail-placeholder"><span>← Selecciona un módulo para ver sus contratos</span></div>`;
  }
}

function openContratoDetail(file) {
  _ctrActiveModule = file;
  renderContratos();
}

export function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function _renderContratoDetail(mod, el) {
  const fns = mod.functions || [];
  const q = _ctrSearchQuery;
  const visible = q
    ? fns.filter(f => f.name.toLowerCase().includes(q) || f.signature.toLowerCase().includes(q))
    : fns;

  const rows = visible.map(fn => {
    const isRisk = _ctrIsRisk(fn);
    const invariantsHtml = (fn.invariants || []).length
      ? `<ul class="ctr-fn-list">${fn.invariants.map(i => `<li>${_esc(i)}</li>`).join('')}</ul>`
      : `<span class="ctr-fn-none">—</span>`;
    const sideEffectsHtml = (fn.sideEffects || []).length
      ? `<ul class="ctr-fn-list">${fn.sideEffects.map(s => `<li>${_esc(s)}</li>`).join('')}</ul>`
      : `<span class="ctr-fn-none">—</span>`;
    return `<div class="ctr-fn-row${isRisk ? ' ctr-fn-row--risk' : ''}">
      <div class="ctr-fn-header">
        <span class="ctr-fn-name">${_esc(fn.name)}</span>
        ${isRisk ? `<span class="ctr-risk-badge ctr-risk-badge--inline" title="Modificada en últimos 2 sprints">⚠ riesgo</span>` : ''}
        ${fn.lastTouched ? `<span class="ctr-fn-touched" title="Último ítem que la tocó">${_esc(fn.lastTouched)}</span>` : ''}
      </div>
      ${fn.signature ? `<code class="ctr-fn-sig">${_esc(fn.signature)}</code>` : ''}
      <div class="ctr-fn-section">
        <span class="ctr-fn-label">Invariantes</span>
        ${invariantsHtml}
      </div>
      <div class="ctr-fn-section">
        <span class="ctr-fn-label">Efectos secundarios</span>
        ${sideEffectsHtml}
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `<div class="ctr-detail-wrap">
    <div class="ctr-detail-header">
      <span class="ctr-detail-title">${_esc(mod.file)}</span>
      <button class="ctr-detail-close" title="Cerrar detalle">✕</button>
    </div>
    <div class="ctr-fn-list-wrap">
      ${rows || `<div class="ctr-empty"><p class="ctr-empty-title">Sin funciones registradas</p></div>`}
    </div>
  </div>`;
}

// Export MD
function exportContratosMd() {
  const data = _ctrLoad();
  const modules = Object.values(data);
  if (!modules.length) { showToast('warn', 'Sin contratos para exportar'); return; }

  // padEnd definida a nivel de módulo — T3.bis
  let md = `# Contratos de Módulo\n\n`;
  md += `Exportado: ${new Date().toLocaleString('es-MX')}\n\n---\n\n`;

  modules.forEach(m => {
    const fns = m.functions || [];
    const riskCount = fns.filter(_ctrIsRisk).length;
    md += `## ${m.file}\n\n`;
    md += `Última actualización: ${m.updatedAt ? new Date(m.updatedAt).toLocaleString('es-MX') : '—'} · Ítem: ${m.updatedBy || '—'}\n`;
    md += `Funciones: ${fns.length} · Áreas de riesgo: ${riskCount}\n\n`;
    if (!fns.length) { md += `_Sin funciones registradas_\n\n`; return; }
    fns.forEach(fn => {
      const risk = _ctrIsRisk(fn);
      md += `### ${fn.name}${risk ? ' ⚠' : ''}\n\n`;
      if (fn.signature) md += `**Firma:** \`${fn.signature}\`\n\n`;
      if (fn.lastTouched) md += `**Última sesión:** ${fn.lastTouched}\n\n`;
      if ((fn.invariants || []).length) {
        md += `**Invariantes:**\n${fn.invariants.map(i => `- ${i}`).join('\n')}\n\n`;
      }
      if ((fn.sideEffects || []).length) {
        md += `**Efectos secundarios:**\n${fn.sideEffects.map(s => `- ${s}`).join('\n')}\n\n`;
      }
      if ((fn.riskSprints || []).length) {
        md += `**Sprints con modificación:** ${fn.riskSprints.join(', ')}\n\n`;
      }
    });
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Contratos.md';
  a.click();
  showToast('success', 'Contratos.md exportado');
}

// Reset
function resetContratosData() {
  localStorage.removeItem(_ctrKey());
  _ctrActiveModule = null;
  _ctrUpdateBadge();
  renderContratos();
  showToast('success', 'Contratos reseteados');
}

// Búsqueda global — incluir contratos en scope
export function searchContratos(q) {
  const data = _ctrLoad();
  const results = [];
  const ql = q.toLowerCase();
  Object.values(data).forEach(m => {
    if (m.file.toLowerCase().includes(ql)) {
      results.push({ type: 'contrato-modulo', label: m.file, sub: `${(m.functions||[]).length} funciones`, action: () => { switchTab('backlog'); setTimeout(() => { switchSubTab('contratos'); openContratoDetail(m.file); }, 80); } });
    }
    (m.functions || []).forEach(fn => {
      if (fn.name.toLowerCase().includes(ql) || fn.signature.toLowerCase().includes(ql)) {
        results.push({ type: 'contrato-fn', label: fn.name, sub: m.file, action: () => { switchTab('backlog'); setTimeout(() => { switchSubTab('contratos'); openContratoDetail(m.file); }, 80); } });
      }
    });
  });
  return results;
}

// Resetear Sesiones — preserva Workers y Proyectos
function openResetSessionsModal() {
  const input = document.getElementById('reset-sessions-input');
  if (input) { input.value = ''; }
  const btn = document.getElementById('reset-sessions-confirm-btn');
  if (btn) btn.disabled = true;
  const hint = document.getElementById('reset-sessions-hint');
  if (hint) hint.classList.add('is-hidden');
  document.getElementById('reset-sessions-overlay').classList.add('open');
  _focusFirstInteractive('reset-sessions-overlay');
}

function closeResetSessionsModal() {
  document.getElementById('reset-sessions-overlay').classList.remove('open');
  _restoreModalFocus('reset-sessions-overlay');
}

function confirmResetSessions() {
  const input = document.getElementById('reset-sessions-input');
  if (!input || input.value.trim() !== 'RESET') return;

  // Vaciar sesiones y sprints de todos los proyectos — preservar workers, proyectos, theme, tags
  if (typeof state !== 'undefined' && Array.isArray(state.projects)) {
    state.projects.forEach(proj => {
      proj.sessions = [];
      proj.sprints = [];
    });
  }

  // Persistir state limpio en localStorage
  try {
    localStorage.setItem(LOCUS_KEYS.STATE, JSON.stringify(state));
  } catch (e) {
    showToast('error', '❌ Error al guardar — intenta de nuevo');
    return;
  }

  // T-202605-017: limpiar version override al resetear
  localStorage.removeItem('app-version-override');

  // AC-9: sincronizar reset a Supabase cuando el usuario está autenticado
  if (typeof _supabase !== 'undefined' && _supabase &&
      typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    (async () => {
      try {
        // Borrar sesiones en tracker_sessions para todos los proyectos
        const { error: sessErr } = await _supabase
          .from('tracker_sessions')
          .delete()
          .eq('user_id', _supabaseUser.id);
        if (sessErr) throw sessErr;

        // Sobrescribir state en tracker_state con sesiones y sprints vacíos
        const stateWithoutSessions = {
          ...state,
          projects: (state.projects || []).map(p => {
            const { sessions, ...rest } = p;
            return { ...rest, sprints: [] };
          })
        };
        const { error: stateErr } = await _supabase
          .from('tracker_state')
          .upsert({
            user_id: _supabaseUser.id,
            key: 'main',
            value: stateWithoutSessions,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,key' });
        if (stateErr) throw stateErr;

        setSyncStatus('synced', '✓ sincronizado');
      } catch (err) {
        console.error('[AI Tracker] confirmResetSessions: Supabase sync error:', err);
        setSyncStatus('offline', '✕ sin conexión');
        _offlineQueuePush({ type: 'state' });
        showToast('warning', '⚠️ Reset local aplicado — Supabase se sincronizará al reconectar');
      }
    })();
  }

  closeResetSessionsModal();

  // Re-render
  if (typeof renderSessionList === 'function') renderSessionList();
  renderStats();

  showToast('success', 'Sesiones y sprints reseteados — Workers y Proyectos conservados');
}

// ── addEventListener — T-202605-030 ──
// Reemplaza los inline onclick/oninput eliminados de index.html para funciones de este módulo.
document.addEventListener('DOMContentLoaded', () => {

  // btn-export-contratos — Exportar Contratos.md
  const btnExportContratos = document.getElementById('btn-export-contratos');
  if (btnExportContratos) btnExportContratos.addEventListener('click', exportContratosMd);

  // sidebar-danger-btn-contratos — Resetear Contratos
  const btnResetContratos = document.getElementById('sidebar-danger-btn-contratos');
  if (btnResetContratos) btnResetContratos.addEventListener('click', resetContratosData);

  // ctr-search-input — oninput búsqueda
  const ctrSearchInput = document.getElementById('ctr-search-input');
  if (ctrSearchInput) ctrSearchInput.addEventListener('input', onContratosSearch);

  // ctr-search-clear — limpiar búsqueda
  const ctrSearchClear = document.getElementById('ctr-search-clear');
  if (ctrSearchClear) ctrSearchClear.addEventListener('click', clearContratosSearch);

  // ── T-202605-033: Migración handlers dinámicos ──
  // ctr-list-panel → delegación para .ctr-module-row (generados dinámicamente por renderContratos)
  // data-file transporta el argumento de openContratoDetail sin onclick inline
  const ctrListPanel = document.getElementById('ctr-list-panel');
  if (ctrListPanel) ctrListPanel.addEventListener('click', (e) => {
    const row = e.target.closest('.ctr-module-row');
    if (row && row.dataset.file) openContratoDetail(row.dataset.file);
  });

  // ctr-detail-panel → delegación para .ctr-detail-close (generado dinámicamente por _renderContratoDetail)
  const ctrDetailPanel = document.getElementById('ctr-detail-panel');
  if (ctrDetailPanel) ctrDetailPanel.addEventListener('click', (e) => {
    if (e.target.closest('.ctr-detail-close')) { _ctrActiveModule = null; renderContratos(); }
  });
  // ── END T-202605-033 locus-contracts ──

});

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
