// [PP] mod:35 · autor:Rune · 2026-06-30 UTC-6
// INC-[pendiente-ID] (triggered_by REQ-202606-003 / REQ-202606-001): las 4 rutas de status
//   manual de este archivo (_mdiffDoApply retroceso/discard, _confirmRetroceso, _confirmDiscard,
//   _applyDiscardBatch) seteaban item.status directo sin invocar _syncParentRStatus (ahora
//   exportada desde locus-backlog-core.js mod:70) — el R padre quedaba desincronizado tras
//   retroceso/descarte manual. Corregido en las 4. La ruta de ingest normal de CHECKPOINT
//   (mergeBacklogFromTG/applyPatchesFromTG en locus-backlog-item.js) tiene el mismo bug y
//   sigue sin corregir — archivo no adjunto en esta sesión.
// [PP] mod:34 · autor:Rune · 2026-06-30 UTC-6
// INC-[pendiente-ID] (triggered_by TKT-202606-013): corregidos los 2 call sites restantes de
//   showToast({title,body,type}) → showToast(type,title,body) — firma posicional real.
// Fix inline (TKT-202606-013): corregido call de showToast en gate TKT-202606-012 — firma
//   posicional (type,title,body), no objeto. Bug descubierto al implementar TKT-013.
// TKT-202606-012 (REQ-202606-003 · AC2): gate de exclusividad sprint_proposal + items REQ/TKT
//   bloquea showMergeDiffPanel completo con toast error cuando ambos llegan en el mismo CHECKPOINT —
//   __BR-Ecosystem §12. DISC/INC/PRB/KE/CHG/patch no activan el gate.
// TKT-202606-011 (REQ-202606-003 · AC3): showMergeDiffPanel renderiza banner con badge
//   "Pendiente de aval Finn" (.mdiff-step0-badge, mismo patrón visual que Step 0/Sugerencia)
//   y deshabilita mdiff-apply-btn/mdiff-backlog-btn cuando ckptMeta.draftPending === true —
//   vía el mismo mecanismo de bloqueo que retroPendingItems/discardPendingItems/sprintPendingItems
//   en _mdiffUpdateConfirmBtn. Sin clases CSS nuevas — solo reutiliza .mdiff-step0-* existentes.
// locus-backlog-merge.js
// Última actualización: REQ-MERGE-GEN2: migrar detección de tipo Gen2 en badges, sort, title y parentHtml
// Responsabilidad: showMergeDiffPanel + modales de confirmación de status (retroceso, descarte)
// Dependencias: locus-backlog-core.js · locus-backlog-item.js · locus-backlog-sprints.js · locus-storage.js · locus-toast.js
// Carga: después de locus-backlog-item.js

import { _calcPriority, _getActiveSessionAiId, _undoSnapshot, loadBacklog, renderStats, updateBacklogBanner, getItems, _registerCoreCallback, itemKind as _itemKindFn, _syncParentRStatus } from './locus-backlog-core.js';
import { _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { _buildNewSprintForm, _getSprintById } from './locus-backlog-sprints.js';
import { _blogLog, getActiveProject, getActiveSprints, saveBacklog, _sprintDisplay } from './locus-storage.js'; // TKT5-[pendiente-ID]: _sprintDisplay para opción de sprint nuevo en DIFF
import { showToast, toast } from './locus-toast.js';
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';

import { applyPatchesFromTG, mergeBacklogFromTG, _checkAndOrphanParentR } from './locus-backlog-item.js';

import { _setBacklogModified } from './locus-docs.js';

import { render } from './locus-sesiones.js';

import { interpretHora, _horaUpdate } from './locus-session-hora.js';



// R-202605-033: Extraído de locus-backlog-item.js

// R-202606-002: _mdiff* convertidas de window.* a variables let de módulo
// El closure showMergeDiffPanel las asigna al abrir y null al cerrar — mismo ciclo de vida
let _mdiffToggleSection = null;
let _mdiffJumpTo = null;
let _mdiffSetItemSprint = null;
let _mdiffUpdateConfirmBtn = null;

// T-202606-006: true mientras el DIFF está abierto — consultable por otros módulos vía getter.
// Se pone true al hacer overlay.classList.add('open') y false en todos los cierres del DIFF.
export let _mdiffStepZeroActive = false;
export function getMdiffStepZeroActive() { return _mdiffStepZeroActive; }

// T-202606-037: ckptMeta — campos narrativos del CHECKPOINT para sección superior del panel.
// Objeto con campos: { resumen, aprendizaje, bloqueantes, decision, proximoPaso } — todos string, todos opcionales.
// Si es null/undefined, todos los campos se tratan como cadena vacía (AC-5).
export function showMergeDiffPanel(tgItems, sessId, projId, onApply, ckptMeta) {
  // T-202606-037 AC-1: early-return sin ítems eliminado — el panel siempre abre cuando hay CHECKPOINT válido.
  // AC-5: ckptMeta null/undefined normalizado a objeto vacío.
  const _ckptMeta = (ckptMeta && typeof ckptMeta === 'object') ? ckptMeta : {};
  const _metaResumen     = _ckptMeta.resumen      || '';
  const _metaAprendizaje = _ckptMeta.aprendizaje  || '';
  const _metaBloqueantes = _ckptMeta.bloqueantes  || '';
  const _metaDecision    = _ckptMeta.decision     || '';
  const _metaProxPaso    = _ckptMeta.proximoPaso  || '';

  // B-202606-001: separar type:patch antes del dry-run — no deben pasar por mergeBacklogFromTG.
  // Los patches actualizan campos de ítems existentes via applyPatchesFromTG y no generan diff visual.
  // Se aplican en _mdiffDoApply después de onApply() para que ítems nuevos ya existan en getItems().
  const _patchItems = tgItems.filter(i => i.type === 'patch');
  tgItems = tgItems.filter(i => i.type !== 'patch');

  // TKT-202606-012 (REQ-202606-003 · AC2): gate de exclusividad sprint_proposal + items.
  // __BR-Ecosystem §12 — sprint_proposal debe ir en CHECKPOINT independiente, nunca junto a
  // ítems REQ/TKT. type:patch ya fue excluido arriba — no cuenta para este gate. DISC/INC/PRB/
  // KE/CHG no activan el gate — solo REQ y TKT. Corre antes de cualquier mutación o dry-run.
  if (_ckptMeta.sprintProposal && tgItems.some(i => i.type === 'REQ' || i.type === 'TKT')) {
    const _msg = 'sprint_proposal debe ir en CHECKPOINT independiente antes de los ítems. Separar y reemitir.';
    // Fix inline (triggered_by TKT-202606-013): showToast usa firma posicional (type, title, body) —
    // ver locus-toast.js:145. {title,body,type} como objeto único no renderiza texto — bug descubierto
    // al implementar TKT-202606-013, mismo patrón roto en otros call sites preexistentes (ver INC).
    showToast('error', 'CHECKPOINT bloqueado', _msg);
    console.warn('[Locus] showMergeDiffPanel:', _msg);
    return; // ningún ítem se aplica — early-return antes de mergeBacklogFromTG y cualquier mutación
  }

  // T-202606-165: validar sprints no registrados antes del dry-run.
  // Ítems no-patch con sprint distinto de icebox/'' que no exista en getActiveSprints()
  // bloquean el CHECKPOINT completo sin aplicar nada.
  // B-202606-048: patches (type:patch) excluidos de esta validación — operan sobre ítems existentes.
  // Se valida contra la lista completa — sprints cerrados incluidos — para no bloquear
  // CHECKPOINTs históricos con sprint ya cerrado que lleguen por retomada.
  // B-202606-044 compat: buscar por id primero, luego por label (mismo criterio que _sprintSelect).
  // B-202606-063: excluir sprints declarados en la ---SPRINT-PROPOSAL--- del mismo CHECKPOINT —
  // el gate corre antes del Step 0, cuando el sprint aún no existe en getActiveSprints().
  // Si el CHECKPOINT crea el sprint via proposal, los ítems que lo referencian son válidos.
  {
    const _allSprints = getActiveSprints(); // incluye closed

    // Extraer prefijos cortos de sprints declarados en la proposal del mismo CHECKPOINT
    const _proposal = _ckptMeta.sprintProposal || null;
    const _proposalSprintIds = [];
    if (_proposal) {
      // Schema JSON usa campo "id" — schema legado usa "sprint"
      const _pId = _proposal.id || _proposal.sprint || null;
      if (_pId) {
        // Prefijo corto: "PP-S-06 · nombre" → "PP-S-06"
        _proposalSprintIds.push(_pId.split(/\s*·\s*/)[0].trim());
        // String completo también — por si el ítem usa el label completo
        _proposalSprintIds.push(_pId);
      }
    }

    // B-202606-048: excluir _patchItems de la validación de sprints desconocidos.
    // Un type:patch opera sobre ítems existentes — su campo sprint (si lo declara) es
    // un campo a actualizar, no una asignación de contenedor nueva. Incluirlos en _allItems
    // bloqueaba CHECKPOINTs de solo patches cuando el sprint declarado aún no estaba registrado,
    // aunque los ítems patcheados ya existieran en el backlog con ese sprint.
    const _allItems   = [...tgItems];
    const _unknownSprints = [];
    for (const it of _allItems) {
      const s = it.sprint;
      if (!s) continue; // TKT-B-inline: eliminado s==='icebox' (Gen1) — !s cubre sprint vacío/ausente en Gen2
      // Gen2: zonas persistentes no son sprints — reconocidas por patrón de nombre, sin registro en tracker_sprints
      if (/^[A-Z]+-Q-(Backlog|DISC|INC)$/i.test(s)) continue;
      // B-202606-063: sprint declarado en la proposal del mismo CHECKPOINT — no es desconocido
      if (_proposalSprintIds.includes(s)) continue;
      const _byId     = _allSprints.find(sp => sp.id    === s);
      const _byLabel  = !_byId ? _allSprints.find(sp => sp.label === s) : null;
      // B-202606-063: sprint guardado con id largo antes del fix de mod:43 — buscar por prefijo también.
      // "PP-S-06" coincide con id "PP-S-06 · IDP fixes..." via startsWith del id guardado.
      const _byPrefix = (!_byId && !_byLabel)
        ? _allSprints.find(sp => (sp.id || '').startsWith(s + ' ') || (sp.id || '') === s || (sp.name || '').startsWith(s + ' '))
        : null;
      if (!_byId && !_byLabel && !_byPrefix && !_unknownSprints.includes(s)) {
        _unknownSprints.push(s);
      }
    }
    if (_unknownSprints.length > 0) {
      const _sprintList = _unknownSprints.map(s => `"${s}"`).join(', ');
      const _msg = _unknownSprints.length === 1
        ? `CHECKPOINT bloqueado: sprint ${_sprintList} no registrado. Registrar el sprint antes de continuar.`
        : `CHECKPOINT bloqueado: sprints ${_sprintList} no registrados. Registrar los sprints antes de continuar.`;
      // Fix INC-[pendiente-ID] (triggered_by TKT-202606-013): showToast firma posicional.
      showToast('error', 'CHECKPOINT bloqueado', _msg);
      console.warn('[Locus] showMergeDiffPanel:', _msg);
      return; // AC-2: ningún ítem aplicado — early-return antes de cualquier mutación
    }
  }

  // Todo CHECKPOINT válido pasa por el DIFF — sin excepción por contenido.
  // Patches se aplican en _mdiffDoApply tras onApply() — comportamiento preservado.
  // Dry-run: obtener diff sin mutar getItems()
  const _prevFilter = localStorage.getItem('current-project-filter') || '';
  const _filterChanged = projId && projId !== _prevFilter;
  if (_filterChanged) {
    localStorage.setItem('current-project-filter', projId);
    loadBacklog();
  }
  let diff;
  try {
    diff = mergeBacklogFromTG(tgItems, sessId, { dryRun: true, ckptRol: _ckptMeta.rol || '' });
  } finally {
    if (_filterChanged) {
      // B-202605-010: restaurar filter antes de loadBacklog — si loadBacklog lanza, el filter ya está restaurado
      if (_prevFilter) localStorage.setItem('current-project-filter', _prevFilter);
      else localStorage.removeItem('current-project-filter');
      try {
        loadBacklog();
      } catch (e) {
        console.error('[AI Tracker] showMergeDiffPanel: loadBacklog falló en finally — filter restaurado, backlog puede estar desactualizado.', e);
        // Fix INC-[pendiente-ID] (triggered_by TKT-202606-013): showToast firma posicional.
        showToast('error', 'Error al restaurar backlog', 'Recarga la página.');
      }
    }
  }

  const total = diff.created.length + diff.advanced.length + diff.updated.length +
                diff.retroceso.length + diff.discarded.length + diff.ignored.length +
                diff.createdAndClosed.length + diff.tmpSuggestions.length +
                (diff.invalidTransition || []).length; // T-202606-020

  const _criticalReasons = ['duplicado', 'sin-status', 'tipo-invalido'];
  const _hasCriticalIgnored = (diff.ignored || []).some(i => _criticalReasons.includes(i.reason));

  // B-202605-500: sprints asignados desde el DIFF a ítems nuevos (aún no existen en getItems() durante dryRun)
  const _mdiffPendingSprints = {}; // { [code]: sprintId }

  // Todo CHECKPOINT válido abre el DIFF — sin excepción por total=0 ni por ausencia de narrativa.

  // ── Helpers de renderizado ──
  // R-202605-148: pill corto B/T/R/P — letra única con color semántico en .mdiff-type-badge
  const _typeName  = { INC: 'INC', TKT: 'TKT', REQ: 'REQ', DISC: 'DISC' };
  // R-202605-148: clase CSS por tipo — hex fijos de identidad del backlog
  const _typeClass = { INC: 'mdiff-type--inc', TKT: 'mdiff-type--tkt', REQ: 'mdiff-type--req', DISC: 'mdiff-type--disc' };
  // R-202605-148: orden canónico INC → REQ → TKT → DISC para sort dentro de sección
  const _typeOrder = { INC: 0, REQ: 1, TKT: 2, DISC: 3 };

  const _pill = (cls, label) =>
    `<span class="mdiff-pill mdiff-pill--${cls}">${label}</span>`;

  // T-202606-019: chips individuales por campo en sección 'Campos actualizados'
  // Consume changes[] — array de { field, from, to } del objeto diff.
  // AC-7: from/to null → muestra '—' en lugar de crash.
  // AC-2: campo status usa clase por valor canónico via lookup table.
  const _STATUS_CHIP_CLS = {
    'pendiente':   'pendiente',
    'discovery':   'pendiente', // TKT-202606-010: mismo chip que 'pendiente' — sin clase indefinida en DIFF
    'en-revision': 'en-revision',
    'done':        'done',
    'descartado':  'descartado',
    'promoted':    'promoted',
    'bloqueado':   'bloqueado',
  };

  const _fieldChips = (changes) => {
    if (!changes || !changes.length) return '';
    const chips = changes.map(({ field, from, to }) => {
      const fromStr = from != null ? esc(String(from)) : '—';
      const toStr   = to   != null ? esc(String(to))   : '—';
      let extraCls = '';
      if (field === 'status') {
        const key = to != null ? String(to).toLowerCase() : '';
        const variant = _STATUS_CHIP_CLS[key] || 'unknown';
        extraCls = ` mdiff-field-chip--status-${variant}`;
      }
      return `<span class="mdiff-field-chip${extraCls}">${esc(field)}: ${fromStr} → ${toStr}</span>`;
    }).join('');
    return `<div class="mdiff-field-chips">${chips}</div>`;
  };

  // R-202605-148: select de sprint inline — persiste via _mdiffSetItemSprint sin re-render del DIFF
  // B-202606-032: sprintOverride — sprint del objeto diff para ítems nuevos que aún no existen en getItems()
  const _sprintSelect = (code, sprintOverride) => {
    const openSprints = getActiveSprints().filter(s => s.status !== 'closed');
    const item = getItems().find(i => i.code === code);
    // B-202606-032: para ítems nuevos (item === null), usar sprintOverride del objeto diff como fuente
    const rawSprint = item ? (item.sprint || '') : (sprintOverride || '');
    // B-202606-0XX (TKT-B2): sin sprint asignado = valor vacío — Q-Backlog, no icebox (Gen1 deprecado).
    // B-202606-044: el CHECKPOINT puede declarar sprint como label completo ('PP-S-04 · Nombre')
    //   o como id corto ('PP-S-04'). Buscar por id primero, luego por label como fallback.
    const isUnassigned = !rawSprint;
    const _matchById    = rawSprint ? openSprints.find(s => s.id    === rawSprint) : null;
    const _matchByLabel = !_matchById && rawSprint ? openSprints.find(s => s.label === rawSprint) : null;
    const _matched      = _matchById || _matchByLabel || null;
    const sprintExists  = !!_matched;
    const currentSprint = sprintExists ? _matched.id : '';
    // TKT5-[pendiente-ID]: _sprintDisplay aplica patrón id · label — antes s.label||s.id
    const options = openSprints.map(s =>
      `<option value="${esc(s.id)}" ${currentSprint === s.id ? 'selected' : ''}>${esc(_sprintDisplay(s.id))}</option>`
    ).join('');
    // B-202606-0XX (TKT-B2): 'Sin sprint (Q-Backlog)' (value='') reemplaza icebox como opción especial.
    return `<select class="mdiff-sprint-select" data-item-code="${esc(code)}"
      data-action="mdiff-set-sprint"
      data-stop-propagation="true">
      <option value="" ${isUnassigned || !currentSprint ? 'selected' : ''}>Sin sprint (Q-Backlog)</option>
      ${options}
      <option value="__new__">＋ Nuevo sprint...</option>
    </select>`;
  };

  // T-202605-037: para ítems tipo T, muestra el campo parent debajo del título
  // parentOverride: valor de parent del objeto diff cuando el ítem aún no existe en getItems() (recién creado)
  // REQ-MERGE-GEN2 TKT3: migrado a _itemKindFn para detectar TKT via tipo Gen2
  const _parentHtml = (code, parentOverride) => {
    if (_itemKindFn({ code }) !== 'TKT') return '';
    const item = getItems().find(i => i.code === code);
    const parentVal = item
      ? (item.parent || null)
      : (parentOverride || null);
    const label = parentVal ? esc(parentVal) : 'Sin parent';
    return `<div class="mdiff-parent-hint">Parent: ${label}</div>`;
  };

  // T-202606-141: capa visual de depends_on — pills inline bajo el título, alerta cuando hay dep bloqueado.
  // dependsOn: array de códigos. Status resuelto contra getItems() en memoria — sin llamada a Supabase.
  // Ítems aún no persistidos (recién creados en el mismo CHECKPOINT) no existen en getItems() → tratados como bloqueados.
  const _depsHtml = (dependsOn) => {
    if (!Array.isArray(dependsOn) || dependsOn.length === 0) return '';
    const allItems = getItems();
    let hasBlocked = false;
    const pills = dependsOn.map(depCode => {
      const depItem = allItems.find(i => i.code === depCode);
      const depStatus = depItem ? (depItem.status || 'pendiente') : 'pendiente';
      const isDone = depStatus === 'done';
      if (!isDone) hasBlocked = true;
      const cls = isDone ? 'mdiff-dep-pill--done' : 'mdiff-dep-pill--blocked';
      const statusLabel = isDone ? '✓ done' : depStatus;
      return `<span class="mdiff-dep-pill ${cls}">${esc(depCode)} · ${statusLabel}</span>`;
    }).join('');
    const rowCls = hasBlocked ? 'mdiff-deps-row mdiff-deps-row--blocked' : 'mdiff-deps-row';
    return `<div class="${rowCls}">${pills}</div>`;
  };

  // REQ-MERGE-GEN2 TKT1: parámetro itemType (pos 3) — callers pasan i.type || _itemKindFn({code: i.code})
  const _card = (code, desc, accentClass, pillsHtml, extraHtml = '', parentOverride = undefined, sprintOverride = undefined, itemType = undefined) => {
    const typeCls   = _typeClass[itemType] || 'mdiff-type--unknown';
    // R-202605-148: ítem sin tipo declarado muestra '?' — no rompe el render
    const typeName  = _typeName[itemType]  || '?';
    return `
    <div class="mdiff-card mdiff-card--${accentClass} ${typeCls}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(code)}</span>
          ${pillsHtml}
          ${_sprintSelect(code, sprintOverride)}
        </div>
        ${_parentHtml(code, parentOverride)}
        <div class="mdiff-desc">${esc(desc || '')}</div>
        ${extraHtml}
      </div>
    </div>`;
  };

  // ── Fila de retroceso ──
  // REQ-MERGE-GEN2 TKT1: migrado a i.type || _itemKindFn para tipo Gen2
  const _retrocedoRow = (i, idx) => {
    const itemType  = i.type || _itemKindFn({ code: i.code });
    const typeCls  = _typeClass[itemType] || 'mdiff-type--unknown';
    // R-202605-148: ítem sin tipo declarado muestra '?'
    const typeName = _typeName[itemType]  || '?';
    return `
    <div class="mdiff-card mdiff-card--warn mdiff-card--retroceso ${typeCls}" data-retroceso-idx="${idx}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(i.code)}</span>
          ${_pill('retroceso', `${esc(i.from)} → ${esc(i.to)}`)}
          ${_sprintSelect(i.code, i.sprint)}
        </div>
        <div class="mdiff-desc">${esc(i.title || '')}</div>
      </div>
    </div>`;
  };

  // ── Fila de descarte ──
  const _DISCARD_REASONS = ['duplicado', 'fuera de alcance', 'reemplazado', 'obsoleto'];
  // REQ-MERGE-GEN2 TKT1: migrado a i.type || _itemKindFn para tipo Gen2
  const _discardRow = (i, idx) => {
    const itemType  = i.type || _itemKindFn({ code: i.code });
    const typeCls   = _typeClass[itemType] || 'mdiff-type--unknown';
    // R-202605-148: ítem sin tipo declarado muestra '?'
    const typeName  = _typeName[itemType]  || '?';
    // B-202606-053: i.reason viene del diff (CHECKPOINT); si está ausente,
    // consultar discardReason del ítem en getItems() — ítem ya descartado en el backlog.
    const _existingItem = !i.reason ? getItems().find(it => it.code === i.code) : null;
    const _resolvedReason = i.reason || (_existingItem && _existingItem.discardReason) || null;
    const hasReason = !!_resolvedReason;
    const reasonHtml = hasReason
      ? `<span class="mdiff-discard-reason-pill">${esc(_resolvedReason)}${i.ref ? ' · ' + esc(i.ref) : ''}</span>`
      : '';
    return `
    <div class="mdiff-card mdiff-card--red mdiff-card--discard ${typeCls}" data-discard-idx="${idx}">
      <div class="mdiff-card-accent"></div>
      <div class="mdiff-card-body">
        <div class="mdiff-card-top">
          <span class="mdiff-type-badge">${typeName}</span>
          <span class="mdiff-code mdiff-card-title">${esc(i.code)}</span>
          ${_pill('discarded', 'descartado')}
          ${reasonHtml}
          ${_sprintSelect(i.code, i.sprint)}
        </div>
        <div class="mdiff-desc">${esc(i.title || '')}</div>
      </div>
    </div>`;
  };

  // R-202605-148: sort INC→REQ→TKT→DISC dentro de un array de ítems del DIFF
  // REQ-MERGE-GEN2 TKT1: migrado a .type || _itemKindFn para tipo Gen2
  const _sortByType = arr => [...arr].sort((a, b) => {
    const ca = a.type || _itemKindFn({ code: a.code });
    const cb = b.type || _itemKindFn({ code: b.code });
    return (_typeOrder[ca] ?? 99) - (_typeOrder[cb] ?? 99);
  });

  // ── Construir secciones con IDs para jump ──
  const _section = (id, accentClass, titleHtml, rows, collapsed = false) => `
    <div class="mdiff-section" id="mdiff-sec-${id}">
      <button class="mdiff-section-header mdiff-section-header--${accentClass}${collapsed ? ' is-collapsed' : ''}"
              data-action="mdiff-toggle-section" type="button">
        <span class="mdiff-section-chevron">▾</span>
        <span>${titleHtml}</span>
      </button>
      <div class="mdiff-section-body${collapsed ? ' is-hidden' : ''}">${rows}</div>
    </div>`;

  let sectionsHtml = '';

  if (diff.created.length) {
    const rows = _sortByType(diff.created).map(i => _card(i.code, i.title, 'green', _pill('created', '＋ creado'), _depsHtml(i.dependsOn), i.parent, i.sprint, i.type || _itemKindFn({ code: i.code }))).join('');
    sectionsHtml += _section('created', 'green', `Creados <span class="mdiff-sec-count">${diff.created.length}</span>`, rows);
  }
  // B-202604-198: ítems que nacen y cierran en el mismo CHECKPOINT — grupo diferenciado
  if (diff.createdAndClosed.length) {
    const rows = _sortByType(diff.createdAndClosed).map(i => _card(
      i.code, i.title, 'green',
      _pill('created', '＋ creado') + _pill('advanced', 'pendiente → done'),
      `<div class="mdiff-change-hint">Creado y cerrado en esta sesión</div>` + _depsHtml(i.dependsOn),
      i.parent, i.sprint, i.type || _itemKindFn({ code: i.code })
    )).join('');
    sectionsHtml += _section('created-and-closed', 'green', `Creados y cerrados <span class="mdiff-sec-count">${diff.createdAndClosed.length}</span>`, rows);
  }
  // B-202604-198: sugerencias de match [tmp:slug] → ID real existente
  // REQ-MERGE-GEN2 TKT1 AC-2: tmpSuggestions usa tmpCode sin .type — fallback a _itemKindFn({code: i.tmpCode}) || 'UNKNOWN'
  if (diff.tmpSuggestions.length) {
    const rows = _sortByType(diff.tmpSuggestions).map(i => _card(
      i.tmpCode, i.title, 'warn',
      _pill('warn', '⚠ tmp sin match aplicado'),
      `<div class="mdiff-change-hint">Posible coincidencia: <strong>${esc(i.suggestedCode)}</strong> — ${esc(i.suggestedTitle)}</div>
       <div class="mdiff-change-hint mdiff-change-hint--secondary">Confirma manualmente en el backlog si corresponde al mismo ítem.</div>`,
      undefined, undefined, _itemKindFn({ code: i.tmpCode }) || 'UNKNOWN'
    )).join('');
    sectionsHtml += _section('tmp-suggestions', 'warn', `⚠ TMP sin match confirmado <span class="mdiff-sec-count">${diff.tmpSuggestions.length}</span>`, rows);
  }
  // T-202606-020 · AC-3: sección Transiciones inválidas — advertencia, no bloquea aplicación (AC-4)
  if ((diff.invalidTransition || []).length) {
    const rows = (diff.invalidTransition).map(i =>
      _card(i.code, i.reason, 'warn',
        _pill('warn', `⚠ ${esc(i.type)} → ${esc(i.status)}`),
        undefined, undefined, undefined, i.type || _itemKindFn({ code: i.code })
      )
    ).join('');
    sectionsHtml += _section('invalid-transition', 'warn',
      `⚠ Transiciones inválidas <span class="mdiff-pill mdiff-pill--warn mdiff-sec-count">${diff.invalidTransition.length}</span>`,
      rows
    );
  }
  if (diff.advanced.length) {
    const rows = _sortByType(diff.advanced).map(i => _card(i.code, i.title, 'blue', _pill('advanced', `${esc(i.from)} → ${esc(i.to)}`), _depsHtml(i.dependsOn), undefined, i.sprint, i.type || _itemKindFn({ code: i.code }))).join('');
    sectionsHtml += _section('advanced', 'blue', `Avance de status <span class="mdiff-sec-count">${diff.advanced.length}</span>`, rows);
  }
  if (diff.updated.length) {
    const rows = _sortByType(diff.updated).map(i => _card(i.code, i.title, 'accent',
      _pill('updated', '✎ actualizado'),
      _fieldChips(i.changes) + _depsHtml(i.dependsOn),
      i.parent, i.sprint, i.type || _itemKindFn({ code: i.code })
    )).join('');
    sectionsHtml += _section('updated', 'accent', `Campos actualizados <span class="mdiff-sec-count">${diff.updated.length}</span>`, rows);
  }
  if (diff.retroceso.length) {
    const rows = _sortByType(diff.retroceso).map((i, idx) => _retrocedoRow(i, idx)).join('');
    sectionsHtml += _section('retroceso', 'warn', `⚠ Retrocesos <span class="mdiff-sec-count">${diff.retroceso.length}</span>`, rows);
  }
  if (diff.discarded.length) {
    const rows = _sortByType(diff.discarded).map((i, idx) => _discardRow(i, idx)).join('');
    sectionsHtml += _section('discarded', 'red', `🗑 Descartes <span class="mdiff-sec-count">${diff.discarded.length}</span>`, rows);
  }
  if (diff.ignored.length) {
    const ignoredCritical = diff.ignored.filter(i => _criticalReasons.includes(i.reason));
    const ignoredOk       = diff.ignored.filter(i => !_criticalReasons.includes(i.reason));
    if (ignoredCritical.length) {
      const rows = _sortByType(ignoredCritical).map(i => {
        let pill, hint = '';
        if (i.reason === 'duplicado')     { pill = _pill('warn', '⚠ duplicado'); hint = i.existingCode ? `<div class="mdiff-change-hint">existe como ${esc(i.existingCode)}</div>` : ''; }
        else if (i.reason === 'sin-status')    { pill = _pill('warn', '⚠ sin status'); }
        else if (i.reason === 'tipo-invalido') { pill = _pill('warn', '⚠ tipo inválido'); }
        return _card(i.code, i.title, 'warn', pill, hint, undefined, undefined, i.type || _itemKindFn({ code: i.code }));
      }).join('');
      sectionsHtml += _section('attention', 'warn', `⚠ Requieren atención <span class="mdiff-sec-count">${ignoredCritical.length}</span>`, rows);
    }
    if (ignoredOk.length) {
      const rows = _sortByType(ignoredOk).map(i => _card(i.code, i.title, 'muted', _pill('ignored', 'sin cambios'), undefined, undefined, undefined, i.type || _itemKindFn({ code: i.code }))).join('');
      // Sin cambios colapsado por defecto
      sectionsHtml += _section('unchanged', 'muted', `Sin cambios <span class="mdiff-sec-count">${ignoredOk.length}</span>`, rows, true);
    }
  }

  // ── Inyectar en shell ──
  const overlay = document.getElementById('merge-diff-overlay');
  if (!overlay) return;
  const header      = document.getElementById('merge-diff-header');
  const body        = document.getElementById('merge-diff-body');
  const footer      = document.getElementById('merge-diff-footer');
  const summaryChips = document.getElementById('mdiff-summary-chips');
  const pendingList  = document.getElementById('mdiff-pending-list');

  // T-202606-155: Step 0 condicional — ---SPRINT-PROPOSAL--- detectado en el CHECKPOINT
  // sprintProposal y onApproveProposal llegan via ckptMeta (campos opcionales)
  // AC-4: Step 0 no genera estado persistente — el sprint se crea solo al aprobar aquí
  const _sprintProposal   = _ckptMeta.sprintProposal   || null;
  const _onApproveProposal = _ckptMeta.onApproveProposal || null;

  // T-202606-038: sección de campos narrativos — aparece antes de las secciones de backlog.
  // AC-4: campos vacíos no renderizan fila. AC-3: Próximo paso al final con separador visual.
  // AC-7: encabezado visualmente distinguible del encabezado de secciones de backlog.
  // B-202606-062: movida antes de if (_sprintProposal) — const no hace hoisting, ReferenceError garantizado si se invoca antes de declaración
  const _buildNarrativeSection = () => {
    const _rows = [
      { label: 'Resumen',     value: _metaResumen     },
      { label: 'Aprendizaje', value: _metaAprendizaje },
      { label: 'Bloqueantes', value: _metaBloqueantes },
      { label: 'Decisión',    value: _metaDecision    },
    ].filter(r => r.value).map(r =>
      `<div class="mdiff-narrative-row">
        <span class="mdiff-narrative-label">${esc(r.label)}</span>
        <span class="mdiff-narrative-value">${esc(r.value)}</span>
      </div>`
    ).join('');

    const _proxPasoHtml = _metaProxPaso
      ? `<div class="mdiff-narrative-proxpaso">
          <span class="mdiff-narrative-label">Próximo paso</span>
          <span class="mdiff-narrative-value">${esc(_metaProxPaso)}</span>
        </div>`
      : '';

    // B-202606-024: condición corregida — _rows es string, !_rows evalúa '' como falsy
    // aunque _proxPasoHtml tenga valor. Evaluación explícita de ambos.
    if (!_rows.length && !_proxPasoHtml) return '';

    return `<div class="mdiff-narrative-section">
      <div class="mdiff-narrative-header">Contexto de sesión</div>
      ${_rows}
      ${_proxPasoHtml ? `<div class="mdiff-narrative-proxpaso-wrap">${_proxPasoHtml}</div>` : ''}
    </div>`;
  };

  // TKT-202606-011 AC3: banner persistente cuando el CHECKPOINT es borrador (draft:true en origen,
  // ai._parsed.draft → _ckptMeta.draftPending). No es una sugerencia descartable como
  // _renderTriggeredBySuggestion — es el estado del panel mientras espera aval de Finn.
  // Sin botones de acción: el founder revisa los ítems propuestos, no decide nada aquí.
  const _draftPending = _ckptMeta.draftPending === true;
  const _renderDraftPendingBanner = () => {
    if (!_draftPending || !body) return;
    const _bannerHtml = `
      <div class="mdiff-step0" id="mdiff-draft-banner">
        <div class="mdiff-step0-header">
          <span class="mdiff-step0-badge">Pendiente de aval Finn</span>
          <span class="mdiff-step0-title">Borrador de especificación</span>
        </div>
        <p class="mdiff-icebox-gate-desc">Este CHECKPOINT tiene draft:true — Finn aún no avaló los AC. Guardar queda deshabilitado hasta que llegue el CHECKPOINT final de Finn con draft:false.</p>
      </div>`;
    body.insertAdjacentHTML('afterbegin', _bannerHtml);
  };

  // T-202606-021: Trigger 3 — sugerencia 1-tap de sprint para B con triggered_by en sprint activo.
  // Llega via ckptMeta.triggeredBySuggestion: { b, suggestedSprint, onAccept }. No-bloqueante:
  // ignorar deja el B en icebox (default). Inserta el prompt al inicio del body.
  const _tgSuggestion = _ckptMeta.triggeredBySuggestion || null;
  const _renderTriggeredBySuggestion = () => {
    if (!_tgSuggestion || !body) return;
    const { b, suggestedSprint, onAccept } = _tgSuggestion;
    const _promptHtml = `
      <div class="mdiff-tgsugg-gate" id="mdiff-tgsugg-gate">
        <div class="mdiff-icebox-gate-header">
          <span class="mdiff-step0-badge">Sugerencia</span>
          <span class="mdiff-step0-title">Mover B a sprint activo</span>
        </div>
        <p class="mdiff-icebox-gate-desc">${esc(b.code || '[pendiente-ID]')} — ${esc(b.title || '')} fue disparado por un ítem en ${esc(suggestedSprint)}. ¿Asignar este B al mismo sprint?</p>
        <div class="mdiff-step0-actions">
          <button class="mdiff-btn mdiff-btn--primary" id="mdiff-tgsugg-accept">✓ Mover a ${esc(suggestedSprint)}</button>
          <button class="mdiff-btn mdiff-btn--cancel" id="mdiff-tgsugg-dismiss">Ignorar</button>
        </div>
      </div>`;
    body.insertAdjacentHTML('afterbegin', _promptHtml);

    const _acceptBtn  = document.getElementById('mdiff-tgsugg-accept');
    const _dismissBtn = document.getElementById('mdiff-tgsugg-dismiss');
    if (_acceptBtn) {
      _acceptBtn.addEventListener('click', () => {
        if (typeof onAccept === 'function') onAccept();
        const _gateEl = document.getElementById('mdiff-tgsugg-gate');
        if (_gateEl) _gateEl.remove();
      }, { once: true });
    }
    if (_dismissBtn) {
      _dismissBtn.addEventListener('click', () => {
        const _gateEl = document.getElementById('mdiff-tgsugg-gate');
        if (_gateEl) _gateEl.remove();
      }, { once: true });
    }
  };

  if (_sprintProposal && body) {
    // T-202606-023 AC-3: calcular estado resultante en el momento de renderizar Step 0.
    // getActiveSprints() refleja el estado actual — si hay sprint active, el nuevo será scheduled.
    // Nota: _tryIngestSprintProposal aplica la misma lógica al aprobar → ambos son coherentes.
    const _existsActive = getActiveSprints().some(sp => sp.status === 'active' && !sp.isHotfix);
    const _resultingStatusLabel = _existsActive
      ? 'Programado — se activa al cerrar el sprint activo'
      : 'Activo — se abre inmediatamente';

    // Renderizar Step 0 antes del contenido normal — reemplaza body temporalmente
    const _step0Html = `
      <div class="mdiff-step0" id="mdiff-step0">
        <div class="mdiff-step0-header">
          <span class="mdiff-step0-badge">Step 0</span>
          <span class="mdiff-step0-title">Apertura de sprint</span>
        </div>
        <div class="mdiff-step0-fields">
          <div class="mdiff-step0-row"><span class="mdiff-step0-label">Sprint</span><span class="mdiff-step0-value">${esc(_sprintProposal.id || _sprintProposal.sprint)}</span></div>
          <div class="mdiff-step0-row"><span class="mdiff-step0-label">Versión</span><span class="mdiff-step0-value">${esc(_sprintProposal.version_target)}</span></div>
          <div class="mdiff-step0-row"><span class="mdiff-step0-label">Tipo</span><span class="mdiff-step0-value">${esc(_sprintProposal.release_type)}</span></div>
          <div class="mdiff-step0-row"><span class="mdiff-step0-label">Scope</span><span class="mdiff-step0-value">${esc(_sprintProposal.scope)}</span></div>
          <div class="mdiff-step0-row"><span class="mdiff-step0-label">Goal</span><span class="mdiff-step0-value">${esc(_sprintProposal.goal)}</span></div>
          ${(_sprintProposal.out_of_scope && _sprintProposal.out_of_scope.length)
            ? `<div class="mdiff-step0-row"><span class="mdiff-step0-label">Out of scope</span><span class="mdiff-step0-value">${_sprintProposal.out_of_scope.map(s => esc(s)).join(' · ')}</span></div>`
            : ''}
          <div class="mdiff-step0-row"><span class="mdiff-step0-label">Estado</span><span class="mdiff-step0-value">${esc(_resultingStatusLabel)}</span></div>
        </div>
        <div class="mdiff-step0-actions">
          <button class="mdiff-btn mdiff-btn--primary" id="mdiff-step0-approve">✓ Aprobar apertura</button>
          <button class="mdiff-btn mdiff-btn--cancel" id="mdiff-step0-reject">✕ Rechazar</button>
        </div>
      </div>`;
    // B-202606-003: body contiene únicamente Step 0 hasta aprobación —
    // narrativa y sectionsHtml se inyectan en el handler de aprobación.
    body.innerHTML = _step0Html;

    // Handlers Step 0 — un solo listener por botón via getElementById post-render
    const _approveBtn = document.getElementById('mdiff-step0-approve');
    const _rejectBtn  = document.getElementById('mdiff-step0-reject');
    if (_approveBtn) {
      _approveBtn.addEventListener('click', () => {
        // B-202606-060: wrap en try/catch — si _onApproveProposal lanza, mostrar error inline
        // y abortar: el DIFF no avanza, el Step 0 permanece visible con el mensaje de error.
        if (typeof _onApproveProposal === 'function') {
          try {
            _onApproveProposal(_sprintProposal);
          } catch (err) {
            const _actionsEl = document.querySelector('#mdiff-step0 .mdiff-step0-actions');
            if (_actionsEl) {
              const _existing = _actionsEl.querySelector('.mdiff-step0-error');
              if (_existing) _existing.remove();
              const _errEl = document.createElement('p');
              _errEl.className = 'mdiff-step0-error';
              _errEl.textContent = `Error al aprobar: ${err.message || 'error desconocido'}`;
              _actionsEl.appendChild(_errEl);
            }
            return; // AC-1 + AC-2: DIFF no avanza, Step 0 permanece con estado de error
          }
        }
        const step0El = document.getElementById('mdiff-step0');
        if (step0El) step0El.remove();

        // B-202606-003 AC-2: inyectar narrativa + secciones ahora que Step 0 fue aprobado
        if (body) body.innerHTML = _buildNarrativeSection() + sectionsHtml;
        _renderTriggeredBySuggestion();

        // T-202606-164 (TKT-B2): gate de revisión ítems sin sprint — prompt no-bloqueante post-aprobación
        // AC-1: aparece al confirmar Step 0, antes de que el founder interactúe con el DIFF
        // AC-2: no-bloqueante — el founder puede cerrarlo y el sprint ya está activo
        // AC-3: lista ítems sin sprint cuya area aparece en el scope del sprint (case-insensitive)
        const _scopeRaw = (_sprintProposal && _sprintProposal.scope) ? _sprintProposal.scope.toLowerCase() : '';
        // T-202606-164 AC-4: tokenizar area por · para matching de áreas compuestas
        // Cualquier token del area que aparezca en el scope → ítem relevante
        const _iceboxRelated = _scopeRaw
          ? getItems().filter(it => {
              if (it.sprint || !it.area) return false;
              const _areaTokens = it.area.split('·').map(t => t.trim().toLowerCase()).filter(Boolean);
              return _areaTokens.some(token => _scopeRaw.includes(token));
            })
          : [];

        if (_iceboxRelated.length > 0 && body) {
          const _iceboxRows = _iceboxRelated.map(it => {
            const _iceboxItemType = it.type || _itemKindFn({ code: it.code });
            return `<div class="mdiff-icebox-row">
              <span class="mdiff-type-badge ${_typeClass[_iceboxItemType] || 'mdiff-type--unknown'}">${_typeName[_iceboxItemType] || '?'}</span>
              <span class="mdiff-icebox-code">${esc(it.code || '—')}</span>
              <span class="mdiff-icebox-title">${esc(it.title || '—')}</span>
              <span class="mdiff-icebox-area">${esc(it.area || '')}</span>
            </div>`;
          }).join('');

          const _iceboxPromptHtml = `
            <div class="mdiff-icebox-gate" id="mdiff-icebox-gate">
              <div class="mdiff-icebox-gate-header">
                <span class="mdiff-step0-badge">Q-Backlog</span>
                <span class="mdiff-step0-title">Ítems relacionados sin sprint</span>
              </div>
              <p class="mdiff-icebox-gate-desc">Hay ${_iceboxRelated.length} ítem${_iceboxRelated.length !== 1 ? 's' : ''} sin sprint (Q-Backlog) con área relacionada al scope de este sprint. ¿Querés moverlos al sprint?</p>
              <div class="mdiff-icebox-list">${_iceboxRows}</div>
              <div class="mdiff-step0-actions">
                <button class="mdiff-btn mdiff-btn--cancel" id="mdiff-icebox-gate-dismiss">Ignorar</button>
              </div>
            </div>`;

          // Insertar el prompt al inicio del body, antes del contenido del DIFF
          body.insertAdjacentHTML('afterbegin', _iceboxPromptHtml);

          const _dismissBtn = document.getElementById('mdiff-icebox-gate-dismiss');
          if (_dismissBtn) {
            _dismissBtn.addEventListener('click', () => {
              const _gateEl = document.getElementById('mdiff-icebox-gate');
              if (_gateEl) _gateEl.remove();
            }, { once: true });
          }
        }
      }, { once: true });
    }
    if (_rejectBtn) {
      // T-202606-156 AC-4: rechazar Step 0 cierra el panel completo — DIFF no se aplica.
      // Mismo comportamiento que el botón Cancel: sin toast, sin aplicar ítems.
      _rejectBtn.addEventListener('click', () => {
        overlay.classList.remove('open');
        document.removeEventListener('keydown', _mdiffKeyHandler);
        _mdiffUpdateConfirmBtn = null;
        _mdiffToggleSection = null;
        _mdiffJumpTo = null;
        _mdiffSetItemSprint = null;
        _mdiffStepZeroActive = false; // T-202606-006
        _itemExcludedAC.abort(); // T-202606-006 — limpiar listener
      }, { once: true });
    }
  }

  // Header: título + contexto de paso
  if (header) {
    const projName = getActiveProject()
      ? getActiveProject().name : '';
    // T-202606-038 AC-2: cuando no hay ítems, el header muestra '0 ítems' sin contador distorsionado
    const totalLabel = total > 0 ? `${total} ítem${total !== 1 ? 's' : ''}` : '0 ítems';
    header.innerHTML = `
      <div class="mdiff-header-inner">
        <div class="mdiff-header-left">
          <div class="mdiff-step-label">Guardar sesión</div>
          <div class="mdiff-header-title">Revisión de cambios${projName ? ` · <span class="mdiff-proj-name">${esc(projName)}</span>` : ''}</div>
        </div>
        <div class="mdiff-header-total">${totalLabel}</div>
      </div>`;
  }

  // Body: sección narrativa + secciones de backlog
  // T-202606-155: si hay Step 0, body.innerHTML ya fue asignado arriba — no sobreescribir
  if (body && !_sprintProposal) {
    body.innerHTML = _buildNarrativeSection() + sectionsHtml;
    _renderTriggeredBySuggestion();
    _renderDraftPendingBanner();
  }

  // Summary chips: clickeables con jump a sección
  const _chipDefs = [
    { key: 'created',           id: 'created',           label: 'creados',            cls: 'green',  count: diff.created.length },
    { key: 'createdAndClosed',  id: 'created-and-closed', label: 'creados y cerrados', cls: 'green', count: diff.createdAndClosed.length },
    { key: 'advanced',          id: 'advanced',          label: 'avances',            cls: 'blue',   count: diff.advanced.length },
    { key: 'updated',           id: 'updated',           label: 'actualizados',       cls: 'accent', count: diff.updated.length },
    { key: 'retroceso',         id: 'retroceso',         label: 'retrocesos',         cls: 'warn',   count: diff.retroceso.length },
    { key: 'discarded',         id: 'discarded',         label: 'descartes',          cls: 'red',    count: diff.discarded.length },
    { key: 'tmpSuggestions',    id: 'tmp-suggestions',   label: 'tmp sin match',      cls: 'warn',   count: diff.tmpSuggestions.length },
    { key: 'invalidTransition', id: 'invalid-transition', label: 'transiciones inv.', cls: 'warn',   count: (diff.invalidTransition || []).length }, // T-202606-020
    { key: 'unchanged',         id: 'unchanged',         label: 'sin cambios',        cls: 'muted',  count: diff.ignored.filter(i => !_criticalReasons.includes(i.reason)).length },
  ];

  if (summaryChips) {
    summaryChips.innerHTML = _chipDefs
      .filter(c => c.count > 0)
      .map(c => `<button class="mdiff-sum-chip mdiff-sum-chip--${c.cls}"
          data-action="mdiff-jump-to" data-sec-id="${c.id}" type="button">
          <span class="mdiff-sum-count">${c.count}</span>
          <span class="mdiff-sum-label">${c.label}</span>
        </button>`).join('');
  }

  // Helper: toggle sección
  _mdiffToggleSection = function(btn) {
    const body = btn.nextElementSibling;
    const collapsed = btn.classList.toggle('is-collapsed');
    body.classList.toggle('is-hidden', collapsed);
  };

  // Helper: jump a sección
  _mdiffJumpTo = function(secId) {
    const el = document.getElementById('mdiff-sec-' + secId);
    if (!el) return;
    // Si está colapsada, expandir
    const headerBtn = el.querySelector('.mdiff-section-header');
    const secBody   = el.querySelector('.mdiff-section-body');
    if (headerBtn && headerBtn.classList.contains('is-collapsed')) {
      headerBtn.classList.remove('is-collapsed');
      secBody.classList.remove('is-hidden');
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // R-202605-148: persistir sprint desde select inline del DIFF sin re-render del panel
  _mdiffSetItemSprint = function(sel) {
    const code = sel.dataset.itemCode;
    if (!code) return;
    const val = sel.value;
    if (val === '__new__') {
      // Revertir select a valor actual antes de reemplazarlo con el mini-form
      sel.value = (getItems().find(i => i.code === code) || {}).sprint || '';
      _mdiffOpenNewSprintForm(sel, code);
      return;
    }
    // T-202606-035 (TKT-B2): bloqueo sin-sprint + en-revision — BR-Ecosystem §5
    if (val === '') {
      const _itemForBlock = getItems().find(i => i.code === code);
      if (_itemForBlock && _itemForBlock.status === 'en-revision') {
        showToast(`CHECKPOINT bloqueado: ${code} tiene status en-revision sin sprint asignado. Asignar sprint antes de continuar.`, 'error');
        sel.value = _itemForBlock.sprint || '';
        return;
      }
    }
    _mdiffPersistSprint(code, val);
  };

  // R-202605-148: mini-formulario inline — reemplaza el select en la card
  // Campos: nombre, goal (opcional), version_target, release_type
  // B-202605-077: refactorizado para consumir _buildNewSprintForm.
  //   - projId del ítem activo en el DIFF (no el filtro global de proyecto)
  //   - Si createSprint falla, ítems con sprint: n/a (onCancel restaura select sin asignar)
  function _mdiffOpenNewSprintForm(sel, code) {
    // Obtener projId del ítem en getItems(); si es nuevo (aún no existe), usar projId de la sesión
    const _itemForSprint = getItems().find(i => i.code === code);
    const _projIdForForm = (_itemForSprint && _itemForSprint.projectId) || projId || null;


    const form = _buildNewSprintForm(
      _projIdForForm,
      // onConfirm: sprint creado exitosamente
      function(newSprintId) {
        _mdiffPersistSprint(code, newSprintId);
        const restoredSel = _mdiffRestoreSelect(wrapDiv, code, newSprintId);
        // Añadir la nueva opción a todos los demás selects del DIFF
        // TKT5-[pendiente-ID]: _sprintDisplay aplica patrón id · label — antes _newSp.label || newSprintId
        const _newSpLabel = _sprintDisplay(newSprintId);
        document.querySelectorAll('.mdiff-sprint-select[data-item-code]').forEach(s => {
          if (s === restoredSel) return;
          const newOptNode = s.querySelector('option[value="__new__"]');
          const opt = document.createElement('option');
          opt.value = newSprintId;
          opt.textContent = _newSpLabel;
          if (newOptNode) s.insertBefore(opt, newOptNode);
          else s.appendChild(opt);
        });
      },
      // onCancel: createSprint falló o usuario canceló — restaurar select sin asignar sprint
      function() {
        _mdiffRestoreSelect(wrapDiv, code, null);
      }
    );

    const wrapDiv = document.createElement('div');
    wrapDiv.innerHTML = form.html;
    const formEl = wrapDiv.firstElementChild || wrapDiv;
    // Preservar referencia al select para _mdiffRestoreSelect
    formEl._originalSelect = sel;
    sel.parentNode.replaceChild(formEl, sel);
    form.init(formEl);
  }

  // B-202605-077: _mdiffSyncConfirmBtn, _mdiffConfirmNewSprintForm, _mdiffCancelNewSprintForm
  // eliminados — lógica migrada a _buildNewSprintForm (locus-backlog-sprints.js).
  // Los handlers _bnsf_confirm/_bnsf_cancel se registran en window por _buildNewSprintForm.init().

  // Reemplaza el mini-form con un select reconstruido
  function _mdiffRestoreSelect(wrap, code, selectedId) {
    const openSprints = getActiveSprints().filter(s => s.status !== 'closed');
    const currentSprint = code
      ? ((getItems().find(i => i.code === code) || {}).sprint || '')
      : '';
    const effectiveSelected = selectedId || currentSprint;

    const sel = document.createElement('select');
    sel.className = 'mdiff-sprint-select';
    if (code) sel.dataset.itemCode = code;
    sel.addEventListener('change', function() { if (_mdiffSetItemSprint) _mdiffSetItemSprint(sel); });
    sel.addEventListener('click', function(e) { e.stopPropagation(); });

    // B-202606-0XX (TKT-B2): 'Sin sprint (Q-Backlog)' (value='') reemplaza icebox como opción especial.
    const unassignedOpt = document.createElement('option');
    unassignedOpt.value = '';
    unassignedOpt.textContent = 'Sin sprint (Q-Backlog)';
    if (!effectiveSelected) unassignedOpt.selected = true;
    sel.appendChild(unassignedOpt);

    openSprints.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      // TKT5-[pendiente-ID]: _sprintDisplay aplica patrón id · label — antes s.label||s.id
      opt.textContent = _sprintDisplay(s.id);
      if (s.id === effectiveSelected) opt.selected = true;
      sel.appendChild(opt);
    });

    const newOpt = document.createElement('option');
    newOpt.value = '__new__';
    newOpt.textContent = '＋ Nuevo sprint...';
    sel.appendChild(newOpt);

    wrap.parentNode.replaceChild(sel, wrap);
    return sel;
  }

  // R-202605-148: persistir sprint en getItems() + saveBacklog sin re-render del backlog ni del DIFF
  function _mdiffPersistSprint(code, sprintId) {
    const item = getItems().find(i => i.code === code);
    if (!item) {
      // B-202605-500: ítem nuevo aún no existe en getItems() durante dryRun — guardar para aplicar en _mdiffDoApply
      _mdiffPendingSprints[code] = sprintId || '';
      return;
    }
    const prevSprint = item.sprint || '';
    item.sprint = sprintId || '';
    item.priority = _calcPriority(item);
    if (sprintId) {
      const targetSprint = _getSprintById(sprintId);
      if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
        item.scope_added = true;
      }
    } else {
      delete item.scope_added;
    }
    if (!item.history) item.history = [];
    item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: prevSprint || null, to: item.sprint || null } });
    saveBacklog();
    _setBacklogModified();
    // No llama renderBacklogList() — el DIFF permanece intacto
  }

  // Helper: validar pendientes y actualizar panel derecho
  _mdiffUpdateConfirmBtn = function() {
    const applyBtn   = document.getElementById('mdiff-apply-btn');
    const backlogBtn = document.getElementById('mdiff-backlog-btn');
    if (!applyBtn) return;

    // Recoger estado de controles en columna derecha
    const retroPendingItems = [];
    diff.retroceso.forEach((item, idx) => {
      const cb = document.getElementById(`mdiff-right-retro-cb-${idx}`);
      if (!cb || !cb.checked) retroPendingItems.push({ item, idx });
    });

    const discardPendingItems = [];
    diff.discarded.forEach((item, idx) => {
      if (item.reason) return; // ya tiene razón preestablecida
      const sel = document.getElementById(`mdiff-right-discard-${idx}`);
      if (!sel || !sel.value) discardPendingItems.push({ item, idx });
    });

    // T-202606-001 (TKT-B2): ítem nuevo REQ/TKT/INC sin sprint efectivo bloquea aplicación —
    // sin sprint es zona exclusiva de Q-Backlog/Q-DISC (BR-Ecosystem §5). El founder debe elegir
    // sprint real vía el _sprintSelect ya presente en la card antes de poder guardar.
    // DISC nunca entra aquí — filtrado explícitamente por tipo (vive siempre en Q-DISC).
    const sprintPendingItems = [];
    [...diff.created, ...diff.createdAndClosed].forEach((item) => {
      // item.type es el string completo del schema (REQ/TKT/INC/DISC) — fuente canónica.
      // Fallback al prefijo de code solo si type no vino declarado (no debería ocurrir en items no-patch).
      const _codePrefix = (item.code || '?')[0].toUpperCase();
      const _prefixToKind = { R: 'REQ', T: 'TKT', I: 'INC', D: 'DISC' };
      const itemKind = item.type || _prefixToKind[_codePrefix] || _codePrefix;
      if (itemKind !== 'REQ' && itemKind !== 'TKT' && itemKind !== 'INC') return;
      const effectiveSprint = Object.prototype.hasOwnProperty.call(_mdiffPendingSprints, item.code)
        ? _mdiffPendingSprints[item.code]
        : item.sprint;
      if (!effectiveSprint || effectiveSprint === '') {
        sprintPendingItems.push(item);
      }
    });

    // TKT-202606-011 AC3: draftPending bloquea el guardado igual que los demás pendientes —
    // el botón permanece deshabilitado mientras el CHECKPOINT no tenga aval de Finn (draft:false).
    const blocked = retroPendingItems.length > 0 || discardPendingItems.length > 0 || sprintPendingItems.length > 0 || _draftPending;
    applyBtn.disabled = blocked;
    applyBtn.classList.toggle('mdiff-apply-blocked', blocked);
    if (backlogBtn) {
      backlogBtn.disabled = blocked;
      backlogBtn.classList.toggle('mdiff-apply-blocked', blocked);
    }

    // Construir contenido de columna derecha
    if (pendingList) {
      const hasRetrocesos  = diff.retroceso.length > 0;
      const hasDescartes   = diff.discarded.filter(i => !i.reason).length > 0;
      const hasDescartesConRazon = diff.discarded.filter(i => !!i.reason).length > 0;
      const hasSprintPending = sprintPendingItems.length > 0;

      if (!hasRetrocesos && !hasDescartes && !hasDescartesConRazon && !hasSprintPending) {
        // Sin pendientes — listo
        pendingList.innerHTML = `<div class="mdiff-pending-ok">✓ Listo para guardar</div>`;
        return;
      }

      let html = '';

      // Banner de advertencia si hay pendientes
      if (blocked) {
        const pendingCount = retroPendingItems.length + discardPendingItems.length + sprintPendingItems.length;
        html += `
          <div class="mdiff-right-banner mdiff-right-banner--warn">
            <span class="mdiff-right-banner-icon">⚠</span>
            <span class="mdiff-right-banner-text">
              ${pendingCount} acción${pendingCount > 1 ? 'es requieren' : ' requiere'} confirmación antes de guardar
            </span>
          </div>`;
      } else {
        html += `<div class="mdiff-pending-ok">✓ Listo para guardar</div>`;
      }

      // Sección sprint requerido — T-202606-001
      if (hasSprintPending) {
        html += `<div class="mdiff-right-section-title">Sprint requerido</div>`;
        sprintPendingItems.forEach((item) => {
          html += `
            <div class="mdiff-right-sprint-pending-row">
              <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
              <span class="mdiff-right-sprint-pending-desc">${esc(item.title || '')}</span>
              <span class="mdiff-right-sprint-pending-hint">sin sprint asignado — elegir sprint en la card</span>
            </div>`;
        });
      }

      // Sección retrocesos
      if (hasRetrocesos) {
        html += `<div class="mdiff-right-section-title">Retrocesos</div>`;
        diff.retroceso.forEach((item, idx) => {
          const cbId = `mdiff-right-retro-cb-${idx}`;
          const existingCb = document.getElementById(cbId);
          const isChecked  = existingCb ? existingCb.checked : false;
          html += `
            <label class="mdiff-right-retro-row ${isChecked ? 'is-confirmed' : ''}">
              <input type="checkbox" id="${cbId}" class="mdiff-right-retro-cb"
                     data-retroceso-idx="${idx}"
                     ${isChecked ? 'checked' : ''}>
              <span class="mdiff-right-retro-info">
                <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
                <span class="mdiff-retro-status">${esc(item.from)} → ${esc(item.to)}</span>
              </span>
            </label>`;
        });
      }

      // Sección descartes que necesitan razón
      if (hasDescartes) {
        html += `<div class="mdiff-right-section-title">Razón de descarte</div>`;
        diff.discarded.forEach((item, idx) => {
          if (item.reason) return; // ya tiene razón
          const selId = `mdiff-right-discard-${idx}`;
          const existingSel = document.getElementById(selId);
          const currentVal  = existingSel ? existingSel.value : '';
          html += `
            <div class="mdiff-right-discard-row">
              <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
              <span class="mdiff-right-discard-desc">${esc(item.title || '')}</span>
              <select id="${selId}" class="mdiff-right-discard-select"
                      data-discard-idx="${idx}">
                <option value="">— razón —</option>
                ${_DISCARD_REASONS.map(r => `<option value="${esc(r)}" ${currentVal === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}
              </select>
            </div>`;
        });
      }

      // Descartes con razón preestablecida — solo confirmar visualmente
      if (hasDescartesConRazon) {
        diff.discarded.forEach((item) => {
          if (!item.reason) return;
          html += `
            <div class="mdiff-right-discard-row mdiff-right-discard-row--preset">
              <span class="mdiff-code mdiff-code--sm">${esc(item.code)}</span>
              <span class="mdiff-discard-reason-pill">${esc(item.reason)}</span>
            </div>`;
        });
      }

      pendingList.innerHTML = html;
    }

    // Actualizar texto del botón apply
    const totalApply = diff.created.length + diff.advanced.length + diff.updated.length
                     + diff.retroceso.length + diff.discarded.length + diff.createdAndClosed.length;
    applyBtn.textContent = blocked ? '✓ Guardar sesión' : `✓ Guardar sesión (${totalApply})`;
     };

  // Footer: input duración + botones de acción
  // T-202606-046: input HH:MM declarado por Nova en T-202606-042 — HTML conforme a spec de Nova.
  if (footer) {
    footer.innerHTML = `
      <div class="mdiff-duration-row">
        <label class="mdiff-duration-label" for="mdiff-duration-input">Hora de reset</label>
        <input
          class="mdiff-duration-input"
          id="mdiff-duration-input"
          type="text"
          inputmode="numeric"
          placeholder="ej: 2130"
          maxlength="4"
          autocomplete="off"
          aria-label="Hora de reset del worker en formato HHMM (ej: 2130)"
        >
        <div class="mdiff-duration-hint" id="mdiff-duration-disp">—</div>
      </div>
      <div class="mdiff-footer-actions">
        <button id="mdiff-cancel-btn" class="mdiff-btn mdiff-btn--cancel">✕ Cancelar</button>
        <button id="mdiff-backlog-btn" class="mdiff-btn mdiff-btn--secondary">Ver Backlog</button>
        <button class="mdiff-btn mdiff-btn--primary" id="mdiff-apply-btn">✓ Guardar sesión</button>
      </div>`;
  }

  overlay.classList.add('open');
  _mdiffStepZeroActive = true; // T-202606-006

  // T-202606-006: listener storage:item-excluded — agrega fila en Step 0 del DIFF.
  // Se registra con { once: false } y se limpia al cerrar el panel vía AbortController.
  const _itemExcludedAC = new AbortController();
  window.addEventListener('storage:item-excluded', (e) => {
    if (!_mdiffStepZeroActive) return;
    const { code, type, reason } = e.detail || {};
    const _body = document.getElementById('merge-diff-body');
    if (!_body) return;
    // Buscar o crear contenedor de exclusiones en Step 0
    let _excContainer = document.getElementById('mdiff-excluded-items');
    if (!_excContainer) {
      _excContainer = document.createElement('div');
      _excContainer.id = 'mdiff-excluded-items';
      _excContainer.className = 'mdiff-step0 mdiff-excluded-section';
      _excContainer.innerHTML = `
        <div class="mdiff-step0-header">
          <span class="mdiff-step0-badge">Excluido</span>
          <span class="mdiff-step0-title">Ítems no guardados</span>
        </div>
        <div class="mdiff-excluded-rows" id="mdiff-excluded-rows"></div>`;
      _body.insertAdjacentElement('afterbegin', _excContainer);
    }
    const _rows = document.getElementById('mdiff-excluded-rows');
    if (!_rows) return;
    // Copy corto legible — type llega como string completo del schema (confirmado: locus-storage.js
    // emite it.type directamente en storage:item-excluded, sin letra única).
    const _typeLabel = { REQ: 'un Requerimiento', TKT: 'un Ticket', INC: 'un Incidente', DISC: 'una Idea' }[type] || type;
    const _shortCopy = `${code || '[pendiente-ID]'} no se guardó — ${_typeLabel} no puede quedar sin sprint asignado.`;
    const _row = document.createElement('details');
    _row.className = 'mdiff-excluded-row';
    _row.innerHTML = `<summary class="mdiff-excluded-summary">${_shortCopy}</summary>` +
      `<div class="mdiff-excluded-detail">${reason || ''}</div>`;
    _rows.appendChild(_row);
  }, { signal: _itemExcludedAC.signal });

  // T-202606-173 AC-1: foco inicial en input de hora al abrir el modal
  requestAnimationFrame(() => {
    const _focusInput = overlay.querySelector('#mdiff-duration-input');
    if (_focusInput) _focusInput.focus();
  });

  // Evaluar estado inicial del botón
  _mdiffUpdateConfirmBtn();

  // ── Handler de aplicar: aplica retrocesos y descartes ──
  function _mdiffDoApply(andThenGoBacklog) {
    // Retrocesos confirmados — leer checkboxes de columna derecha
    if (diff.retroceso.length) {
      diff.retroceso.forEach((retroItem, idx) => {
        const cb = document.getElementById(`mdiff-right-retro-cb-${idx}`);
        if (cb && cb.checked) {
          const item = getItems().find(i => i.code === retroItem.code);
          if (item) {
            const from = item.status;
            item.status = retroItem.to;
            item.statusChangedAt = Date.now();
            // B-202606-085: limpiar doneAt al retroceder desde done — mismo patrón que _confirmRetroceso
            if (from === 'done') item.doneAt = null;
            _syncParentRStatus(item.code, item.status); // INC-[pendiente-ID]: sync R padre tras retroceso vía CHECKPOINT
            _blogLog('retroceso', retroItem.code, from + ' → ' + retroItem.to, 'backlog');
          }
        }
      });
    }

    // Descartes: aplicar con reason del selector de columna derecha o preestablecida
    if (diff.discarded.length) {
      diff.discarded.forEach((discItem, idx) => {
        const item = getItems().find(i => i.code === discItem.code);
        if (!item) return;
        const sel = document.getElementById(`mdiff-right-discard-${idx}`);
        const finalReason = sel ? (sel.value || discItem.reason || '') : (discItem.reason || '');
        const finalRef    = discItem.ref || '';
        item.status        = 'descartado';
        item.discardReason = finalReason;
        item.discardRef    = finalRef;
        item.statusChangedAt = Date.now();
        _syncParentRStatus(item.code, item.status); // INC-[pendiente-ID]: sync R padre tras descarte vía CHECKPOINT
        _checkAndOrphanParentR(item.code, Date.now()); // INC-[pendiente-ID]: mismo patrón que _confirmDiscard/_applyDiscardBatch
        _blogLog('ckpt-descarte', discItem.code, finalReason, 'backlog');
      });
    }

    // Si hubo retrocesos o descartes → persistir y re-renderizar
    const hadPending = diff.retroceso.length || diff.discarded.length;
    if (hadPending) {
      _undoSnapshot();
      saveBacklog();
      _setBacklogModified();
    }

    // Contar ítems aplicados para toast
    const appliedCount = diff.created.length + diff.advanced.length + diff.updated.length
                       + diff.retroceso.filter((_, idx) => {
                           const cb = document.getElementById(`mdiff-right-retro-cb-${idx}`);
                           return cb && cb.checked;
                         }).length
                       + diff.discarded.length
                       + diff.createdAndClosed.length;

    // B-202606-037: leer valor raw del input de hora de desbloqueo antes de cerrar el panel.
    // Se pasa sin procesar a onApply — el caller (saveSession) llama a interpretHora internamente.
    // Si está vacío → string vacío → horaResult null → worker permanece disponible.
    const _durationInput = document.getElementById('mdiff-duration-input');
    const _horaRaw = _durationInput ? (_durationInput.value.trim() || '') : '';

    overlay.classList.remove('open');
    document.removeEventListener('keydown', _mdiffKeyHandler);
    // B-202605-050: limpiar todas las referencias _mdiff* al cerrar el panel
    _mdiffUpdateConfirmBtn = null;
    _mdiffToggleSection = null;
    _mdiffJumpTo = null;
    _mdiffSetItemSprint = null;
    _mdiffStepZeroActive = false; // T-202606-006
    _itemExcludedAC.abort(); // T-202606-006 — limpiar listener

    if (appliedCount > 0) {
      showToast('success', `Sesión guardada — ${appliedCount} ítem${appliedCount !== 1 ? 's' : ''} aplicado${appliedCount !== 1 ? 's' : ''}`);
    }

    // B-202606-037: pasar horaRaw como argumento de onApply — saveSession resuelve horaResult.
    // T-202606-039: guard — onApply puede ser undefined si el caller no lo provee.
    if (typeof onApply === 'function') onApply(_horaRaw);

    // B-202606-001: aplicar patches después de onApply() — ítems nuevos ya existen en getItems()
    // T-202606-028: propagar ckptHeaderRole — antes el guard de done en R nunca recibía
    // el rol del header y rechazaba siempre, incluso con QA · Finn. Mismo dato fuente
    // que ckptRol en mergeBacklogFromTG (línea ~130).
    if (_patchItems.length) applyPatchesFromTG(_patchItems, null, { ckptHeaderRole: _ckptMeta.rol || '' });

    // B-202605-500: aplicar sprints pendientes sobre ítems nuevos (ya existen en getItems() tras onApply)
    const pendingEntries = Object.entries(_mdiffPendingSprints);
    if (pendingEntries.length) {
      let changed = false;
      pendingEntries.forEach(([code, sprintId]) => {
        const item = getItems().find(i => i.code === code);
        if (!item) return;
        item.sprint = sprintId || '';
        item.priority = _calcPriority(item);
        if (sprintId) {
          const targetSprint = _getSprintById(sprintId);
          if (targetSprint && targetSprint.status === 'active' && targetSprint.startedAt) {
            item.scope_added = true;
          }
        } else {
          delete item.scope_added;
        }
        if (!item.history) item.history = [];
        item.history.push({ type: 'sprint', ts: Date.now(), aiId: _getActiveSessionAiId() || undefined, data: { from: null, to: sprintId || null } });
        changed = true;
      });
      if (changed) {
        saveBacklog();
        _setBacklogModified();
      }
    }

    if (andThenGoBacklog) {
      switchTab('backlog');
      switchSubTab('backlog');
    }
  }

  // Delegation — evita onclick= en HTML dinámico; _mdiff* accesibles via window
  overlay.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
      // data-stop-propagation en selects
      if (e.target.closest('[data-stop-propagation]')) { e.stopPropagation(); }
      return;
    }
    const action = btn.dataset.action;
    if (action === 'mdiff-toggle-section') {
      if (_mdiffToggleSection) _mdiffToggleSection(btn);
    } else if (action === 'mdiff-jump-to') {
      if (_mdiffJumpTo) _mdiffJumpTo(btn.dataset.secId);
    }
  });

  // T-202606-008: delegation change — reemplaza onchange= inline en templates de pendingList y _sprintSelect
  overlay.addEventListener('change', function(e) {
    // Sprint select — data-action="mdiff-set-sprint" (generado por _sprintSelect)
    if (e.target.classList.contains('mdiff-sprint-select') && e.target.dataset.action === 'mdiff-set-sprint') {
      if (_mdiffSetItemSprint) _mdiffSetItemSprint(e.target);
      // T-202606-001: re-evaluar gate — el cambio puede destrabar un pendiente de sprint icebox
      if (_mdiffUpdateConfirmBtn) _mdiffUpdateConfirmBtn();
      return;
    }
    // Retroceso checkbox — data-retroceso-idx (generado en _mdiffUpdateConfirmBtn)
    if (e.target.classList.contains('mdiff-right-retro-cb')) {
      if (_mdiffUpdateConfirmBtn) _mdiffUpdateConfirmBtn();
      return;
    }
    // Discard select — data-discard-idx (generado en _mdiffUpdateConfirmBtn)
    if (e.target.classList.contains('mdiff-right-discard-select')) {
      if (_mdiffUpdateConfirmBtn) _mdiffUpdateConfirmBtn();
      return;
    }
  });

  overlay.querySelector('#mdiff-cancel-btn').addEventListener('click', () => {
    overlay.classList.remove('open');
    document.removeEventListener('keydown', _mdiffKeyHandler);
    // B-202605-050: limpiar todas las referencias _mdiff* al cerrar el panel
    _mdiffUpdateConfirmBtn = null;
    _mdiffToggleSection = null;
    _mdiffJumpTo = null;
    _mdiffSetItemSprint = null;
    _mdiffStepZeroActive = false; // T-202606-006
    _itemExcludedAC.abort(); // T-202606-006 — limpiar listener
    // Sin toast — el usuario canceló deliberadamente
  });

  // AC-7: parseo de hora de desbloqueo — feedback visual inline con interpretHora
  const _durationInputEl = overlay.querySelector('#mdiff-duration-input');
  const _durationDispEl  = overlay.querySelector('#mdiff-duration-disp');
  if (_durationInputEl && _durationDispEl) {
    // B-202606-037 AC-3: pre-llenar con ai.resetTime si el worker ya tenía hora declarada.
    // ckptMeta.resetTime viene en formato "HH:MM" — se stripea el separador para HHMM.
    const _existingReset = (_ckptMeta.resetTime || '').replace(/\D/g, '');
    if (_existingReset) {
      _durationInputEl.value = _existingReset;
      _horaUpdate(_durationInputEl, _durationDispEl);
    }
    _durationInputEl.addEventListener('input', () => {
      _horaUpdate(_durationInputEl, _durationDispEl);
    });
    // B-202606-NNN: Enter en input de hora mueve foco al botón Guardar.
    // stopPropagation evita que _mdiffKeyHandler lo reciba y dispare _mdiffDoApply prematuramente.
    // T-202606-082: si el botón está disabled, mover foco al primer pendiente bloqueante en lugar de focus() silencioso.
    _durationInputEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      e.stopPropagation();
      const applyBtn = document.getElementById('mdiff-apply-btn');
      if (applyBtn && !applyBtn.disabled) {
        applyBtn.focus();
        return;
      }
      // AC-2: retroceso pendiente — primer checkbox sin marcar
      const firstUncheckedRetro = overlay.querySelector('.mdiff-right-retro-cb:not(:checked)');
      if (firstUncheckedRetro) { firstUncheckedRetro.focus(); return; }
      // AC-3: descarte pendiente sin razón — primer select vacío
      const allDiscardSelects = overlay.querySelectorAll('.mdiff-right-discard-select');
      for (const sel of allDiscardSelects) {
        if (!sel.value) { sel.focus(); return; }
      }
      // AC-4: sin pendiente identificable — no hacer nada (silencioso)
    });
  }

  overlay.querySelector('#mdiff-backlog-btn').addEventListener('click', () => {
    if (overlay.querySelector('#mdiff-backlog-btn').disabled) return;
    _mdiffDoApply(true);
  });

  overlay.querySelector('#mdiff-apply-btn').addEventListener('click', () => {
    if (overlay.querySelector('#mdiff-apply-btn').disabled) return;
    _mdiffDoApply(false);
  });

  // Enter → Aplicar (solo si no bloqueado)
  let _mdiffReady = false;
  setTimeout(() => { _mdiffReady = true; }, 300);
  function _mdiffKeyHandler(e) {
    if (e.key === 'Enter' && _mdiffReady) {
      // Guard: Enter en input de hora lo maneja su propio keydown — no apply aquí
      if (e.target && e.target.id === 'mdiff-duration-input') return;
      const btn = document.getElementById('mdiff-apply-btn');
      if (btn && !btn.disabled) {
        e.preventDefault();
        e.stopPropagation(); // B-[pendiente-ID]: Enter propagado a otros listeners del documento cuando el diff está activo
        _mdiffDoApply(false);
      }
    } else if (e.key === 'Escape') {
      document.removeEventListener('keydown', _mdiffKeyHandler);
      overlay.classList.remove('open');
      // B-202605-050: limpiar todas las referencias _mdiff* al cerrar el panel
      _mdiffUpdateConfirmBtn = null;
      _mdiffToggleSection = null;
      _mdiffJumpTo = null;
      _mdiffSetItemSprint = null;
      _mdiffStepZeroActive = false; // T-202606-006
      _itemExcludedAC.abort(); // T-202606-006 — limpiar listener
    }
  }
  document.addEventListener('keydown', _mdiffKeyHandler);
}

// T-202604-059: Confirmación de retroceso de status
function _showStatusConfirmModal({ title, body, okLabel, okClass, onConfirm }) {
  // R-202604-047: shell estático en index.html — inject content + classList
  const overlay = document.getElementById('status-confirm-overlay');
  if (!overlay) return;
  const titleEl = document.getElementById('status-confirm-title');
  const bodyEl = document.getElementById('status-confirm-body-text');
  const cancelBtn = document.getElementById('status-confirm-cancel-btn');
  const okBtn = document.getElementById('status-confirm-ok-btn');
  if (titleEl) titleEl.innerHTML = title;
  if (bodyEl) bodyEl.innerHTML = body;
  if (okBtn) {
    okBtn.textContent = okLabel;
    okBtn.className = `status-confirm-ok ${okClass || ''}`;
    // Reemplazar para limpiar handlers acumulados
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    newOkBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      onConfirm();
    });
  }
  if (cancelBtn) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
    });
  }
  overlay.classList.add('open');
}

export function _confirmRetroceso(code, toStatus) {
  const item = getItems().find(i => i.code === code);
  if (!item) return;
  const from = item.status;
  _showStatusConfirmModal({
    title: '⚠ Retroceso de status',
    body: `<strong>${esc(code)}</strong> pasará de <strong>${from}</strong> → <strong>${toStatus}</strong>.<br><br>¿Confirmas el retroceso?`,
    okLabel: 'Sí, retroceder',
    okClass: '',
    onConfirm: () => {
      item.status = toStatus;
      item.statusChangedAt = Date.now();
      // B-202606-007: limpiar doneAt al retroceder desde done — AC-1
      if (from === 'done') item.doneAt = null;
      _syncParentRStatus(code, toStatus); // INC-[pendiente-ID]: sync R padre tras retroceso manual
      _blogLog('retroceso', code, from + ' → ' + toStatus, 'backlog');
      _undoSnapshot();
      saveBacklog();
      _setBacklogModified();
      showToast('info', '↓ ' + code + ' → ' + toStatus);
      // Animación de salida — mismo patrón que _confirmDiscard
      const _retEl = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
      if (_retEl) {
        _retEl.classList.add('item-exit-anim');
        setTimeout(() => {
          _markBacklogListDirty();
          renderBacklogList(); updateBacklogBanner(); renderStats();
        }, 230);
      } else {
        _markBacklogListDirty();
        renderBacklogList(); updateBacklogBanner(); renderStats();
      }

    }
  });
}

export function _confirmDiscard(code, reason, ref) {
  const item = getItems().find(i => i.code === code);
  if (!item) return;

  // Si no viene razón preestablecida, mostrar selector inline
  const reasonInputId = 'discard-reason-select';
  const refInputId    = 'discard-ref-input';
  const manualInput   = !reason;

  const bodyHtml = manualInput
    ? `<strong>${esc(code)}</strong> será marcado como <strong>descartado</strong>.<br><br>
       <div class="discard-modal-fields">
         <div>
           <label class="discard-field-label">Razón</label><br>
           <select id="${reasonInputId}" class="discard-field-select">
             <option value="">— seleccionar —</option>
             <option value="duplicado">duplicado</option>
             <option value="fuera de alcance">fuera de alcance</option>
             <option value="reemplazado">reemplazado</option>
             <option value="obsoleto">obsoleto</option>
           </select>
         </div>
         <div>
           <label class="discard-field-label">Referencia (opcional)</label><br>
           <input id="${refInputId}" type="text" placeholder="ej: T-202604-066" class="discard-field-input">
         </div>
       </div>
       <div class="discard-modal-hint">El ítem se conserva para trazabilidad pero no contará en métricas.</div>`
    : `<strong>${esc(code)}</strong> será marcado como <strong>descartado</strong>.<br>Razón: <strong>${esc(reason)}</strong>${ref ? '<br>Reemplazado por: <strong>' + esc(ref) + '</strong>' : ''}<br><br>El ítem se conserva para trazabilidad pero no contará en métricas.`;

  _showStatusConfirmModal({
    title: '🗑 Descartar ítem',
    body: bodyHtml,
    okLabel: 'Descartar',
    okClass: 'danger',
    onConfirm: () => {
      const finalReason = manualInput
        ? (document.getElementById(reasonInputId)?.value || '')
        : reason;
      const finalRef = manualInput
        ? (document.getElementById(refInputId)?.value.trim() || '')
        : ref;
      item.status = 'descartado';
      item.discardReason = finalReason;
      item.discardRef = finalRef;
      _syncParentRStatus(code, 'descartado'); // INC-[pendiente-ID]: sync R padre tras descarte manual
      _blogLog('descartado', code, finalReason || '', 'backlog');
      _checkAndOrphanParentR(code, Date.now()); // T-202606-017 AC-1
      _undoSnapshot();
      saveBacklog();
      _setBacklogModified();
      showToast('info', '🗑 ' + code + ' descartado');
      // Animación de salida — agrega clase al nodo DOM, espera que complete (220ms) y luego re-renderiza
      const _exitEl = document.querySelector(`.item[data-code="${CSS.escape(code)}"]`);
      if (_exitEl) {
        _exitEl.classList.add('item-exit-anim');
        setTimeout(() => {
          _markBacklogListDirty();
          renderBacklogList(); updateBacklogBanner(); renderStats();
        }, 230);
      } else {
        _markBacklogListDirty();
        renderBacklogList(); updateBacklogBanner(); renderStats();
      }
    }
  });
}

// B-202604-NNN: confirmar lote de descartes desde panel CHECKPOINT (todos con reason definida)
function _applyDiscardBatch(items) {
  if (!items || !items.length) return;
  let applied = 0;
  items.forEach(({ code, reason, ref }) => {
    const item = getItems().find(i => i.code === code);
    if (!item) return;
    item.status = 'descartado';
    item.discardReason = reason || '';
    item.discardRef = ref || '';
    item.statusChangedAt = Date.now();
    _syncParentRStatus(code, 'descartado'); // INC-[pendiente-ID]: sync R padre tras descarte batch
    _blogLog('ckpt-descarte', code, reason || '', 'backlog');
    _checkAndOrphanParentR(code, Date.now()); // T-202606-017 AC-1
    applied++;
  });
  if (!applied) return;
  _undoSnapshot();
  saveBacklog();
  _setBacklogModified();
  // item-exit-anim no aplica en batch — múltiples nodos simultáneos generan race condition con setTimeout
  // _markBacklogListDirty antes de re-render para consistencia con _confirmDiscard
  _markBacklogListDirty();
  renderBacklogList(); updateBacklogBanner(); renderStats();
  showToast('info', '🗑 ' + applied + ' ítem' + (applied > 1 ? 's descartados' : ' descartado'));
  // Quitar sección de descartes del panel si ya no hay pendientes
  const panel = document.getElementById('ckpt-panel-body');
  if (panel) {
    const sec = panel.querySelector('.ckpt-section.discarded');
    if (sec) sec.remove();
  }

}

// T-202606-077: registrar callbacks en locus-backlog-core
document.addEventListener('DOMContentLoaded', () => {
  _registerCoreCallback('confirmDiscard',   _confirmDiscard);
  _registerCoreCallback('confirmRetroceso', _confirmRetroceso);
});
