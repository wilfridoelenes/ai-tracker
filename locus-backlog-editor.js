// [PP] v1.0.7 · sprint:PP-S-09 · mod:11 · autor:Rune · 2026-06-03 UTC-6
// locus-backlog-editor.js
// Última actualización: 2026-05-31 UTC-6
// Módulo: Item Editor — edición de ítems existentes del backlog
// Renombrado desde locus-item-editor.js (T-202605-121)
import { _getActiveSprint } from './locus-backlog-sprints.js';
import { _restoreModalFocus, _saveModalTrigger } from './locus-modals.js';

import { _getNextItemCode, _undoSnapshot, renderStats, updateBacklogBanner } from './locus-backlog-core.js';

import { renderBacklogList } from './locus-backlog-render.js';

import { _blogLog, _tplKey, save } from './locus-storage.js';

import { showToast } from './locus-toast.js';

import { esc } from './locus-ui-shell.js';

// ── T-202604-109: Editor de ítems del Backlog ──
let _editorItemId = null; // null = nuevo, o id existente para editar

function _refreshParentIdDropdown(selectedType, selectedParentId) {
  const field = document.getElementById('field-parentid');
  const sel = document.getElementById('item-parentid');
  if (!field || !sel) return;
  // Solo T y B pueden tener R padre
  const show = selectedType === 'T' || selectedType === 'B';
  field.classList.toggle('is-hidden', !show);
  if (!show) { sel.value = ''; return; }
  // Poblar con R disponibles
  const rItems = ITEMS.filter(i => i.code && i.code[0] === 'R');
  sel.innerHTML = '<option value="">— Sin R padre —</option>' +
    rItems.map(r => `<option value="${esc(r.code)}"${r.code === selectedParentId ? ' selected' : ''}>${esc(r.code)} · ${esc(r.title || r.desc || '')}</option>`).join('');
}

// T-202604-294: helper — retorna id del sprint activo si existe, '' si no
function _activeSprint() {
  const s = _getActiveSprint();
  return s ? s.id : '';
}

export function openItemEditor(itemId = null, itemCode = null) {
  _saveModalTrigger('item-editor-overlay');
  const overlay = document.getElementById('item-editor-overlay');
  // T-522: guard — si el overlay no existe el módulo externo no cargó correctamente
  if (!overlay) {
    console.warn('[openItemEditor] item-editor-overlay no encontrado — módulo externo no cargado');
    return;
  }
  const title = document.getElementById('item-editor-title');
  const typeSelect = document.getElementById('item-type');
  // T-202605-451: reset save-as panel on open
  const savePanel = document.getElementById('tpl-save-panel');
  if (savePanel) savePanel.classList.remove('open');


  if (itemId || itemCode) {
    // Editar ítem existente — buscar por id primero, luego por code como fallback
    const item = itemId
      ? (ITEMS.find(i => i.id === itemId) || ITEMS.find(i => i.code === itemId))
      : ITEMS.find(i => i.code === itemCode);
    if (!item) return;
    _editorItemId = item.id || item.code; // guardar lo que tengamos
    title.textContent = '✎ Editar ítem';
    // AC-7: indicar visualmente que es actualización
    title.className = (title.className || '').replace(/item-editor-title--\S+/g, '').trim() + ' item-editor-title--edit';
    
    typeSelect.value = item.code[0];
    document.getElementById('item-code').value = item.code;
    document.getElementById('item-title').value = item.title || item.desc || ''; // DUP-06: fallback a desc si title vacío
    document.getElementById('item-priority').value = item.priority || 'medium';
    document.getElementById('item-effort').value = item.effort || 1;
    document.getElementById('item-area').value = item.area || '';
    document.getElementById('item-desc').value = item.desc || '';
    document.getElementById('item-ac').value = (item.ac || []).join('\n');
    const notesEl = document.getElementById('item-notes');
    if (notesEl) notesEl.value = item.notes || '';
    const bbEl = document.getElementById('item-blocked-by');
    if (bbEl) bbEl.value = (item.blockedBy || []).join(', ');
    const archivosEl = document.getElementById('item-archivos');
    if (archivosEl) archivosEl.value = (item.archivos || []).join(', ');
    _refreshParentIdDropdown(item.code[0], item.parentId || '');
  } else {
    // Nuevo ítem
    _editorItemId = null;
    title.textContent = '➕ Nuevo ítem';
    title.className = (title.className || '').replace(/item-editor-title--\S+/g, '').trim();
    typeSelect.value = 'T';
    document.getElementById('item-code').value = '';
    document.getElementById('item-title').value = '';
    document.getElementById('item-priority').value = 'medium';
    document.getElementById('item-effort').value = 1;
    document.getElementById('item-area').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-ac').value = '';
    const notesElNew = document.getElementById('item-notes');
    if (notesElNew) notesElNew.value = '';
    const bbElNew = document.getElementById('item-blocked-by');
    if (bbElNew) bbElNew.value = '';
    const archivosElNew = document.getElementById('item-archivos');
    if (archivosElNew) archivosElNew.value = '';
    _refreshParentIdDropdown('T', '');
  }

  // Actualizar dropdown al cambiar tipo
  typeSelect.onchange = () => _refreshParentIdDropdown(typeSelect.value, document.getElementById('item-parentid').value);

  // Paste-to-autofill en campo Prompt/Descripción
  const descTA = document.getElementById('item-desc');
  descTA.onpaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    if (!pasted) return;
    const filled = _ieAutofillFromPaste(pasted);
    if (filled) {
      e.preventDefault();
      _refreshParentIdDropdown(document.getElementById('item-type').value, document.getElementById('item-parentid').value);
    }
  };
  
  overlay.classList.add('open');
  document.getElementById('item-title').focus();
}

// Parser paste-to-autofill para el item editor.
// Soporta dos formatos:
//   1) Línea CHECKPOINT: T: [pendiente-ID]: Título | effort:2 | area:X | ac: c1 / c2
//   2) Bloque Markdown:  ### T-202604-001 · Título\n**Priority:** ...\n**Area:** ...\n
// Retorna true si se detectó y pobló algún campo.
function _ieAutofillFromPaste(text) {
  const t = text.trim();

  // ── Formato 1: línea CHECKPOINT ───────────────────────────────────────────
  // [PTRBI]: ([código]|[pendiente-ID]|[tmp:slug]): desc | effort:N | area:X | ac: c1 / c2
  const cpRe = /^([PTRB])\s*:\s*(?:\[pendiente-ID\]|\[tmp:[^\]]+\]|[PTRB]-\d{6}-\d{3}(?:-[A-Z]+)?)\s*:\s*(.+?)(?:\s*\|(.+))?$/i;
  const cpMatch = t.match(cpRe);
  if (cpMatch) {
    const typeChar = cpMatch[1].toUpperCase() === 'I' ? 'I' : cpMatch[1].toUpperCase();
    const descRaw  = cpMatch[2].trim();
    const rest     = cpMatch[3] || '';

    // Extraer pipes
    const pipes = {};
    rest.split('|').forEach(seg => {
      const kv = seg.match(/^\s*([a-z]+)\s*:\s*(.+)/i);
      if (kv) pipes[kv[1].toLowerCase().trim()] = kv[2].trim();
    });

    // AC: separado por " / "
    const acRaw = pipes['ac'] || '';
    const acList = acRaw ? acRaw.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean) : [];

    // Poblar formulario
    document.getElementById('item-type').value      = typeChar;
    document.getElementById('item-title').value     = descRaw;
    document.getElementById('item-area').value      = pipes['area'] || '';
    document.getElementById('item-effort').value    = parseInt(pipes['effort']) || 1;
    document.getElementById('item-ac').value        = acList.join('\n');
    document.getElementById('item-desc').value      = '';
    // T-202604-288: blockedBy desde pipe
    const bbAutofillEl = document.getElementById('item-blocked-by');
    if (bbAutofillEl) bbAutofillEl.value = pipes['blockedby'] || pipes['blockedBy'] || '';
    const archivosAutofillEl = document.getElementById('item-archivos');
    if (archivosAutofillEl) archivosAutofillEl.value = pipes['archivos'] || pipes['files'] || '';

    // Sprint / priority si viene
    if (pipes['priority']) document.getElementById('item-priority').value = pipes['priority'].toLowerCase();

    _ieHighlightAutofilled();
    showToast('success', '✓ Formulario autocompletado desde CHECKPOINT — verifica y guarda', null, 3000);
    return true;
  }

  // ── Formato 2: bloque Markdown ────────────────────────────────────────────
  // ### [CODE|pendiente-ID] · Título
  const mdHeaderRe = /^###\s+(?:(\[pendiente-ID\]|\[tmp:[^\]]+\]|([PTRB])-\d{6}-\d{3}(?:-[A-Za-z]+)?))\s+·\s+(.+)/im;
  // También acepta header sin código: ### Título (menos preciso — solo si hay campos **field:**)
  const mdHeaderSimple = /^###\s+(.+)/im;
  let mdMatch = t.match(mdHeaderRe);
  let mdSimple = false;
  if (!mdMatch) {
    // Intentar si hay al menos un campo **Field:** en el texto
    if (/\*\*(?:Priority|Area|Effort|Status)\*\*/.test(t)) {
      mdMatch = t.match(mdHeaderSimple);
      mdSimple = true;
    }
  }

  if (mdMatch) {
    const typeChar = mdSimple ? null : (mdMatch[2] ? mdMatch[2].toUpperCase() : null);
    const codeRaw  = mdSimple ? '' : (mdMatch[1] || '');
    const titleRaw = mdSimple ? mdMatch[1].trim() : mdMatch[3].trim();

    const get = (field) => {
      const m = t.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`, 'i'));
      return m ? m[1].trim() : '';
    };

    const priority = get('Priority') || 'medium';
    const area     = get('Area') || '';
    const effort   = parseInt(get('Effort')) || 1;

    // Descripción: bloque entre **Version:** y ### Criterios (o fin)
    const descMatch = t.match(/\*\*Version:\*\*[^\n]*\n+([\s\S]*?)(?=###\s*Criterios|$)/i);
    const desc = descMatch ? descMatch[1].trim() : '';

    // AC
    const acMatch = t.match(/###\s*Criterios de aceptación\s*\n([\s\S]*?)(?=\n---|$)/i);
    const ac = [];
    if (acMatch) {
      acMatch[1].split('\n').forEach(l => {
        const m = l.match(/^-\s+\[[ x]\]\s+(.+)/i);
        if (m) ac.push(m[1].trim());
        else {
          const m2 = l.match(/^-\s+(.+)/);
          if (m2) ac.push(m2[1].trim());
        }
      });
    }

    // Código real si viene
    const isRealCode = !mdSimple && codeRaw && /[PTRB]-\d{6}-\d{3}/i.test(codeRaw);

    // Poblar
    if (typeChar) document.getElementById('item-type').value  = typeChar;
    if (isRealCode) document.getElementById('item-code').value = codeRaw;
    document.getElementById('item-title').value    = titleRaw;
    document.getElementById('item-priority').value = priority.toLowerCase();
    document.getElementById('item-effort').value   = effort;
    document.getElementById('item-area').value     = area;
    document.getElementById('item-desc').value     = desc;
    document.getElementById('item-ac').value       = ac.join('\n');
    // T-202604-288: blockedBy desde MD
    const bbMdEl = document.getElementById('item-blocked-by');
    if (bbMdEl) bbMdEl.value = get('BlockedBy') || '';
    const archivosEl = document.getElementById('item-archivos');
    if (archivosEl) archivosEl.value = get('Archivos') || get('Files') || '';

    _ieHighlightAutofilled();
    showToast('success', '✓ Formulario autocompletado desde Markdown — verifica y guarda', null, 3000);
    return true;
  }

  return false; // no se detectó ningún formato — comportamiento normal
}

// Flash visual en campos rellenados automáticamente
function _ieHighlightAutofilled() {
  const ids = ['item-type','item-code','item-title','item-priority','item-effort','item-area','item-desc','item-ac','item-archivos'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('ie-autofilled');
    void el.offsetWidth; // reflow para reiniciar animación
    el.classList.add('ie-autofilled');
    setTimeout(() => el.classList.remove('ie-autofilled'), 1200);
  });
}

export function closeItemEditor() {
  document.getElementById('item-editor-overlay').classList.remove('open');
  _restoreModalFocus('item-editor-overlay');
  _editorItemId = null;
}

function confirmItemEditor() {
  const type = document.getElementById('item-type').value;
  const code = document.getElementById('item-code').value.trim();
  const title = document.getElementById('item-title').value.trim();
  
  if (!title) { showToast('warning', '⚠ Título es obligatorio'); return; }

  // R-202605-122 AC1: effort obligatorio para ítems no tipo P
  const effortRaw = document.getElementById('item-effort').value;
  if (type !== 'P' && (!effortRaw || effortRaw === '0' || effortRaw === '')) {
    const effortEl = document.getElementById('item-effort');
    if (effortEl) {
      effortEl.classList.add('field-error');
      effortEl.focus();
      setTimeout(() => effortEl.classList.remove('field-error'), 2000);
    }
    showToast('warning', '⚠ Effort es obligatorio — selecciona 1, 2 o 3');
    return;
  }

  const priority = document.getElementById('item-priority').value;
  const effort = parseInt(effortRaw) || 1;
  const area = document.getElementById('item-area').value.trim();
  const desc = document.getElementById('item-desc').value.trim();
  const acText = document.getElementById('item-ac').value.trim();
  const ac = acText ? acText.split('\n').map(l => l.replace(/^[-*]\s*(\[[ x]\]\s*)?/, '').trim()).filter(Boolean) : [];
  const parentId = (document.getElementById('item-parentid').value || '').trim() || null;
  const notesEl2 = document.getElementById('item-notes');
  // B-202605-068: si #item-notes no existe, emitir warning y preservar notes existentes
  if (!notesEl2) {
    console.warn('[AI Tracker] confirmItemEditor: #item-notes no encontrado en el DOM — notes no se actualizará');
  }
  const notes = notesEl2 ? notesEl2.value.trim() : null;
  const bbEl2 = document.getElementById('item-blocked-by');
  const blockedBy = bbEl2
    ? bbEl2.value.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const archivosEl2 = document.getElementById('item-archivos');
  const archivos = archivosEl2
    ? archivosEl2.value.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  
  // Generar código si está vacío — usa _getNextItemCode() para consistencia con el sistema
  let finalCode = code;
  if (!finalCode) {
    finalCode = _getNextItemCode(type);
  }

  if (_editorItemId) {
    // Editar existente
    const item = ITEMS.find(i => i.id === _editorItemId) || ITEMS.find(i => i.code === _editorItemId);
    if (!item) return;

    // AC-10: detectar colisión de código (código cambiado a uno que ya existe en otro ítem)
    if (finalCode !== item.code) {
      const collision = ITEMS.find(i => i.code === finalCode && i.code !== item.code);
      if (collision) {
        showToast('warning', '⚠ El código ' + finalCode + ' ya existe en otro ítem');
        return;
      }
    }

    // AC-6: lógica de status desde el editor (si hubiera selector de status en el editor en el futuro)
    // Por ahora el editor no expone selector de status — se gestiona desde inline/CHECKPOINT
    item.code = finalCode;
    item.title = title;
    item.priority = priority;
    item.effort = effort;
    item.area = area;
    item.desc = desc;
    item.ac = ac;
    // B-202605-068: si notes es null (#item-notes ausente del DOM), preservar valor existente
    // T-528: normalizar notes null→'' — ítems cargados desde CHECKPOINT sin campo notes
    if (notes !== null) item.notes = notes;
    if (item.notes == null) item.notes = '';
    item.blockedBy = blockedBy;
    item.archivos = archivos;
    item.parentId = parentId || null;
    // T-202606-036 AC1+AC2: si se edita un R y cambia su sprint, propagar a todos sus Ts hijos
    if (item.type === 'R' || (!item.type && item.code && item.code[0] === 'R')) {
      const normalizedSprint = item.sprint || 'icebox';
      ITEMS.forEach(child => {
        if (child.parentId === item.code && child.code && child.code[0] === 'T') {
          if ((child.sprint || 'icebox') !== normalizedSprint) {
            child.sprint = normalizedSprint;
            if (typeof _blogLog === 'function') _blogLog('sprint-heredado', child.code, `${child.code} sprint ajustado al de su parent ${item.code}: ${normalizedSprint}`, 'backlog');
          }
        }
      });
    }
    _blogLog('editado', finalCode, title, 'backlog');
    _undoSnapshot();
    saveBacklog();
    showToast('success', '✓ ' + finalCode + ' actualizado');
  } else {
    // AC-9: crear nuevo — código generado o ingresado manualmente
    // Verificar colisión también en creación
    const collision = ITEMS.find(i => i.code === finalCode);
    if (collision) {
      showToast('warning', '⚠ El código ' + finalCode + ' ya existe — edita el ítem existente');
      return;
    }
    const id = 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
    // B-202604-015: heredar sprint del padre si existe; T-202604-294: fallback a sprint activo
    const _newItemSprint = parentId
      ? ((ITEMS.find(p => p.code === parentId) || {}).sprint || _activeSprint())
      : _activeSprint();
    ITEMS.push({
      id, code: finalCode, title, priority, effort, area, desc, ac,
      notes: notes || '',
      blockedBy: blockedBy,
      archivos: archivos,
      parentId: parentId || null,
      sprint: _newItemSprint,
      status: 'pendiente', version: 'futura',
      schema_version: 1,
    });
    _blogLog('creado', finalCode, title, 'backlog');
    _undoSnapshot();
    saveBacklog();
    showToast('success', '✓ ' + finalCode + ' creado');
  }

  closeItemEditor();
  renderBacklogList();
  updateBacklogBanner();
}


// ══════════════════════════════════════════════════════════════════════════════
// T-202605-451 · TEMPLATES DE ÍTEMS — predefinidos y personalizados
// ══════════════════════════════════════════════════════════════════════════════

const _ITEM_TEMPLATES_KEY = 'ai-tracker-item-templates';

const _PREDEFINED_TEMPLATES = [
  {
    id: 'tpl-r-feature',
    name: 'R — Feature',
    builtin: true,
    type: 'R',
    priority: 'medium',
    effort: 2,
    area: 'UI · Feature',
    desc: '',
    ac: [
      'Visible en UI en el estado esperado',
      'Persiste correctamente en localStorage',
      'CSS Purity — sin style= inline',
      'Sin romper layout mobile (<600px)',
    ],
    notes: '',
  },
  {
    id: 'tpl-r-refactor',
    name: 'R — Refactor',
    builtin: true,
    type: 'R',
    priority: 'low',
    effort: 2,
    area: 'Refactor',
    desc: '',
    ac: [
      'Comportamiento externo idéntico al anterior',
      'Sin regresiones en módulos adyacentes',
      'CSS Purity — sin style= inline',
      'Deuda técnica documentada en CHECKPOINT',
    ],
    notes: '',
  },
  {
    id: 'tpl-b-bug',
    name: 'B — Bug',
    builtin: true,
    type: 'B',
    priority: 'high',
    effort: 1,
    area: '',
    desc: '',
    ac: [
      'Reproducir con pasos exactos',
      'Fix verificable: [descripción del estado esperado]',
      'Sin regresión en flujo afectado',
    ],
    notes: '',
  },
  {
    id: 'tpl-t-impl',
    name: 'T — Implementación',
    builtin: true,
    type: 'T',
    priority: 'medium',
    effort: 1,
    area: '',
    desc: '',
    ac: [
      'Implementado según AC del R padre',
      'CSS Purity — sin style= inline',
      'Verificado en happy path y edge case',
    ],
    notes: '',
  },
];

function _loadCustomTemplates() {
  try {
    const raw = localStorage.getItem(_ITEM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function _saveCustomTemplates(list) {
  try {
    localStorage.setItem(_ITEM_TEMPLATES_KEY, JSON.stringify(list));
  } catch (e) {
    showToast('error', '❌ Error al guardar template — almacenamiento lleno');
  }
}

function _getAllTemplates() {
  return [..._PREDEFINED_TEMPLATES, ..._loadCustomTemplates()];
}

// Abre el picker de templates
export function openTemplatePicker() {
  const overlay = document.getElementById('tpl-picker-overlay');
  if (!overlay) return;
  _renderTemplatePicker();
  overlay.classList.add('open');
}

function closeTemplatePicker() {
  const overlay = document.getElementById('tpl-picker-overlay');
  if (overlay) overlay.classList.remove('open');
}

function _renderTemplatePicker() {
  const list = document.getElementById('tpl-picker-list');
  if (!list) return;
  const all = _getAllTemplates();

  const predefined = all.filter(t => t.builtin);
  const custom = all.filter(t => !t.builtin);

  const renderGroup = (items, label) => {
    if (!items.length) return '';
    const header = label ? `<div class="tpl-section-label">${label}</div>` : '';
    return header + items.map(tpl => {
      const typeClass = 'tag-' + tpl.type.toLowerCase();
      const acCount = (tpl.ac || []).length;
      const deleteBtn = tpl.builtin ? '' :
        `<button class="tpl-delete-btn" data-tpl-del="${tpl.id}" title="Eliminar template">✕</button>`;
      return `
        <div class="tpl-picker-item" data-tpl-apply="${tpl.id}">
          <div class="tpl-item-info">
            <div class="tpl-item-name">${tpl.name}</div>
            <div class="tpl-item-meta">
              <span class="tpl-item-tag ${typeClass}">${tpl.type}</span>
              <span>Effort ${tpl.effort}</span>
              ${tpl.area ? `<span>${tpl.area}</span>` : ''}
              ${acCount ? `<span>${acCount} AC</span>` : ''}
              ${!tpl.builtin ? '<span class="tpl-item-custom-badge">personalizado</span>' : ''}
            </div>
          </div>
          ${deleteBtn}
        </div>`;
    }).join('');
  };

  const html = renderGroup(predefined, '') + renderGroup(custom, custom.length ? 'Personalizados' : '');
  list.innerHTML = html || '<div class="tpl-empty">No hay templates. Crea uno desde un ítem existente.</div>';

  // Delegation — evita onclick= en HTML generado; reemplaza _applyTemplate y _deleteCustomTemplate inline
  list.onclick = function(e) {
    const delBtn = e.target.closest('[data-tpl-del]');
    if (delBtn) { e.stopPropagation(); _deleteCustomTemplate(delBtn.dataset.tplDel); return; }
    const item = e.target.closest('[data-tpl-apply]');
    if (item) { _applyTemplate(item.dataset.tplApply); return; }
  };
}

function _applyTemplate(tplId) {
  const tpl = _getAllTemplates().find(t => t.id === tplId);
  if (!tpl) return;

  const typeSelect = document.getElementById('item-type');
  if (typeSelect) typeSelect.value = tpl.type;

  document.getElementById('item-title').value = '';
  document.getElementById('item-priority').value = tpl.priority || 'medium';
  document.getElementById('item-effort').value = tpl.effort || 1;
  document.getElementById('item-area').value = tpl.area || '';
  document.getElementById('item-desc').value = tpl.desc || '';
  document.getElementById('item-ac').value = (tpl.ac || []).join('\n');
  const notesEl = document.getElementById('item-notes');
  if (notesEl) notesEl.value = tpl.notes || '';

  if (typeof _refreshParentIdDropdown === 'function') {
    _refreshParentIdDropdown(tpl.type, '');
  }

  closeTemplatePicker();
  _ieHighlightAutofilled();
  document.getElementById('item-title').focus();
  showToast('success', '✓ Template aplicado — completa el título y guarda', null, 2500);
}

function _deleteCustomTemplate(tplId) {
  const customs = _loadCustomTemplates().filter(t => t.id !== tplId);
  _saveCustomTemplates(customs);
  _renderTemplatePicker();
  showToast('success', '✓ Template eliminado');
}

// Guarda el ítem actual (en editor abierto) como template personalizado
function saveCurrentItemAsTemplate() {
  const title = document.getElementById('item-title').value.trim();
  const type = document.getElementById('item-type').value;
  const priority = document.getElementById('item-priority').value;
  const effort = parseInt(document.getElementById('item-effort').value) || 1;
  const area = document.getElementById('item-area').value.trim();
  const desc = document.getElementById('item-desc').value.trim();
  const acText = document.getElementById('item-ac').value.trim();
  const ac = acText ? acText.split('\n').map(l => l.replace(/^[-*]\s*(\[[ x]\]\s*)?/, '').trim()).filter(Boolean) : [];
  const notesEl = document.getElementById('item-notes');
  const notes = notesEl ? notesEl.value.trim() : '';

  const tplNameInput = document.getElementById('tpl-save-name-input');
  const tplName = tplNameInput ? tplNameInput.value.trim() : (title || (type + ' — template'));
  if (!tplName) { showToast('warning', '⚠ Asigna un nombre al template'); return; }

  const customs = _loadCustomTemplates();
  const newTpl = {
    id: 'tpl-custom-' + Date.now(),
    name: tplName,
    builtin: false,
    type, priority, effort, area, desc, ac, notes,
  };
  customs.push(newTpl);
  _saveCustomTemplates(customs);

  // Ocultar el save-as panel
  const savePanel = document.getElementById('tpl-save-panel');
  if (savePanel) savePanel.classList.remove('open');

  showToast('success', '✓ Template "' + tplName + '" guardado');
}

function toggleTplSavePanel() {
  const panel = document.getElementById('tpl-save-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    const title = document.getElementById('item-title').value.trim();
    const type = document.getElementById('item-type').value;
    const nameInput = document.getElementById('tpl-save-name-input');
    if (nameInput) nameInput.value = title || type + ' — template';
    nameInput && nameInput.focus();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FIN T-202605-451
// ══════════════════════════════════════════════════════════════════════════════

// T-082: Helper centralizado — retorna el próximo Date en que resetTime ocurre
// Siempre retorna un Date futuro: si la hora ya pasó hoy, proyecta a mañana (+24h)

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
window.openItemEditor       = openItemEditor;
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
window.closeItemEditor      = closeItemEditor;
window.openTemplatePicker   = openTemplatePicker;
window.confirmItemEditor    = confirmItemEditor;
window.saveCurrentItemAsTemplate = saveCurrentItemAsTemplate;
window.toggleTplSavePanel   = toggleTplSavePanel;
window.closeTemplatePicker  = closeTemplatePicker;
window._applyTemplate       = _applyTemplate;
