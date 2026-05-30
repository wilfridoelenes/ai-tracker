// [PP] v1.2.4 · sprint:PP-S-09 · mod:1 · autor:Rune · 2026-05-30 UTC-6
// locus-tags.js
// Módulo: Tags — modal, picker, colores, toggle, creación
// Extraído de locus-misc-ui.js — T-202605-072

import { _saveModalTrigger } from './locus-modals.js';
import { _findSession, getState, save } from './locus-storage.js';
import { showToast } from './locus-toast.js';
import { render } from './locus-sesiones.js';
import { openDetail } from './locus-session-popup.js';
import { esc } from './locus-ui-shell.js';

// ── Paleta canónica de 8 colores — alineada con .tc-0 a .tc-7 en locus-modals.css ──
export const TAG_COLORS = [
  'var(--purple)',  // tc-0
  'var(--green)',   // tc-1
  'var(--amber)',   // tc-2
  'var(--red)',     // tc-3
  'var(--blue)',    // tc-4
  'var(--pink)',    // tc-5
  'var(--lime)',    // tc-6
  'var(--orange)',  // tc-7
];

// ── Estado privado del modal ──
let tagModalAIId  = null;
let tagModalSessId = null;
let selectedColor  = 0;

// ── API pública ──

export function openTagModal(aiId, sessId) {
  _saveModalTrigger('tag-modal');
  tagModalAIId = aiId;
  tagModalSessId = sessId;
  selectedColor = 0;
  renderTagPicker();
  renderColorPicker();
  document.getElementById('tag-new-input').value = '';
  document.getElementById('tag-modal').classList.add('open');
  setTimeout(() => document.getElementById('tag-new-input').focus(), 80);
}

export function renderTagPicker() {
  const found = tagModalSessId ? _findSession(tagModalSessId) : null;
  const s = found ? found.sess : null;
  const selected = s ? s.tags || [] : [];
  const list = document.getElementById('tag-picker-list');
  if (!list) return;
  if (!getState().tags.length) {
    list.innerHTML = `<div class="pi-no-ac">Sin etiquetas aún — crea una abajo</div>`;
    return;
  }
  list.innerHTML = getState().tags.map(t => {
    const isSel = selected.includes(t.id);
    return `<div class="tag-picker-row${isSel ? ' selected' : ''}" data-action="toggle-tag" data-tag-id="${t.id}">
      <div class="tag-picker-dot" style="--dot-color:${t.color}"></div>
      <div class="tag-picker-name">${esc(t.name)}</div>
      ${isSel ? `<span class="tag-picker-check">✓</span>` : ''}
    </div>`;
  }).join('');
}

export function renderColorPicker() {
  const row = document.getElementById('color-picker-row');
  if (!row) return;
  row.innerHTML = TAG_COLORS.map((c, i) =>
    `<div class="color-dot-btn${i === selectedColor ? ' sel' : ''}" style="--dot-color:${c}" data-action="select-color" data-color-idx="${i}"></div>`
  ).join('');
}

export function selectColor(i) {
  selectedColor = i;
  renderColorPicker();
}

export function toggleTagOnSession(tagId) {
  const found = tagModalSessId ? _findSession(tagModalSessId) : null;
  const s = found ? found.sess : null;
  if (!s) return;
  if (!s.tags) s.tags = [];
  const idx = s.tags.indexOf(tagId);
  if (idx >= 0) s.tags.splice(idx, 1);
  else s.tags.push(tagId);
  save();
  renderTagPicker();
  render();
  openDetail(tagModalAIId, tagModalSessId);
}

export function addNewTag() {
  const name = document.getElementById('tag-new-input').value.trim();
  if (!name) { showToast('warning', 'Escribe un nombre'); return; }
  if (getState().tags.find(t => t.name.toLowerCase() === name.toLowerCase())) {
    showToast('warning', 'Ya existe esa etiqueta');
    return;
  }
  const tag = { id: 'tag-' + Date.now(), name, color: TAG_COLORS[selectedColor] };
  getState().tags.push(tag);
  const found = tagModalSessId ? _findSession(tagModalSessId) : null;
  const s = found ? found.sess : null;
  if (s) { if (!s.tags) s.tags = []; s.tags.push(tag.id); }
  save();
  renderTagPicker();
  renderColorPicker();
  render();
  document.getElementById('tag-new-input').value = '';
  showToast('success', `Etiqueta "${name}" creada`);
}

// ── Delegation handlers ──
document.addEventListener('DOMContentLoaded', () => {
  const tagPickerList = document.getElementById('tag-picker-list');
  if (tagPickerList) tagPickerList.addEventListener('click', e => {
    const row = e.target.closest('[data-action="toggle-tag"]');
    if (row) toggleTagOnSession(row.dataset.tagId);
  });

  const colorPickerRow = document.getElementById('color-picker-row');
  if (colorPickerRow) colorPickerRow.addEventListener('click', e => {
    const dot = e.target.closest('[data-action="select-color"]');
    if (dot) selectColor(Number(dot.dataset.colorIdx));
  });
});
