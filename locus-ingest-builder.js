// [PP] mod:2 · autor:Rune · 2026-08-30 22:20 UTC-6
// TKT2 (ref_id CAEL-08302200-06, REQ ref_id CAEL-08302200-01): docUpdatePatchItems agregado —
// canal propio para type: doc_update_patch dentro de items[], mismo criterio de separación que
// patchIntencionItems. Ver comentario completo en _buildTgItemsFromParsed().
// TKT-202608-476 (REQ-202608-198, TKT3 de "Partir parsePaste()/_processIngestBatch() en
// unidades de responsabilidad única"): módulo nuevo — construcción de tgItems/patchItems desde
// un CHECKPOINT ya parseado, extraída de locus-session-parse.js. Contenido movido byte a byte,
// sin reescritura de lógica — _normalizeNoIncluye()/_buildPlaneadaTgItem()/
// _buildTgItemsFromParsed() son idénticas a su versión previa en locus-session-parse.js
// (mod:218, previa a este TKT). Único cambio real: export agregado a _buildTgItemsFromParsed —
// las otras 2 funciones son privadas de este módulo, consumidas solo internamente, igual que
// antes. Consumida por locus-session-parse.js en sus mismos 2 call sites (flujo single
// ~L2356, flujo batch dentro de _parseBatchBlock ~L3817 de ese archivo) vía import cross-módulo
// — ver header de mod:219 de locus-session-parse.js para el detalle completo del movimiento.
// Ciclo ESM de 2 nodos con locus-session-parse.js: este archivo importa
// _normalizeSprint/_ITIL_TYPES/_buildItilItem/_canonicalStatus/_VALID_STATUSES_GATE/
// _resolveSprintFields desde allá, locus-session-parse.js importa _buildTgItemsFromParsed
// desde aquí — seguro, ningún símbolo se evalúa en top-level de ninguno de los dos módulos,
// mismo patrón ya vigente entre locus-session-hora.js/locus-session-save.js/
// locus-session-parse.js. `_reqsNoAc`/gate `req-sin-AC` y el gate de duplicados de
// `[tmp:slug]` en `_resolveCheckpointBatch` no se tocan — permanecen en locus-session-parse.js.
import { _GEN2_TYPES, itemKind } from './locus-backlog-core.js';
import { _isPlaceholderCode } from './locus-backlog-item.js';
import { _blogLog } from './locus-storage.js';
import { showToast } from './locus-toast.js';
import {
  _normalizeSprint,
  _ITIL_TYPES,
  _buildItilItem,
  _canonicalStatus,
  _VALID_STATUSES_GATE,
  _resolveSprintFields
} from './locus-session-parse.js';

// [PP] TKT3 (REQ histórico — sin CHECKPOINT confirmado · Ingesta batch de CHECKPOINTs con resolución de [tmp:slug]
//   cross-CHECKPOINT): extraída de parsePasteStandalone sin cambio de comportamiento —
//   procesa ckpt._rawItems de UN bloque CHECKPOINT ya parseado en tgItems/patchItems.
//   Reutilizada por el flujo single (batch de tamaño 1, AC3 — sin regresión) y por el
//   flujo batch (2+ bloques, AC1/AC2/AC4) para construir el preview de cada bloque con
//   buildTGPreview. Sin efectos laterales propios más allá de _blogLog/showToast — mismos
//   que ya existían inline. No persiste, no wiring a _applyCheckpointBatch (eso es TKT4).
// TKT-202608-278 (REQ-202608-113, origen_disc DISC-202608-115): _buildTgItemsFromParsed
// coaccionaba no_incluye a [] en silencio cuando el valor entrante no era ya un array JS —
// __BR-Ecosystem §8 muestra no_incluye como valor escalar de ejemplo en el schema, sin
// declarar que debe ser array, y module-contracts mod:104 ya fijaba array como forma canónica
// de storage. Normaliza: array pasa igual · string con comas se divide y se trimea · string
// sin comas se envuelve en array de 1 · cualquier otro tipo con contenido se coacciona a []
// pero deja rastro en DocLog · vacío/ausente/null/undefined/"" se coacciona a [] sin ruido.
function _normalizeNoIncluye(raw, itemCode) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const _trimmed = raw.trim();
    if (_trimmed === '') return [];
    return _trimmed.split(',').map(s => s.trim()).filter(s => s !== '');
  }
  if (raw !== null && raw !== undefined && raw !== '') {
    _blogLog(
      'no_incluye-formato-invalido',
      itemCode || '[pendiente-ID]',
      `no_incluye con formato inválido (no string, no array) — coaccionado a []. Valor crudo: ${JSON.stringify(raw)}`,
      'backlog'
    );
  }
  return [];
}

// TKT-A1 (REQ histórico — sin CHECKPOINT confirmado · origen_disc DISC-202608-148): builder común a las 2 ramas
// Planeada de _buildTgItemsFromParsed — rol-no-autorizado-bloqueado y general. Antes de este
// TKT, ambas ramas duplicaban ~30 campos casi idénticos; la rama rol-no-autorizado-bloqueado
// no propagaba `priority` — se perdía silenciosamente (caía a 'medium' vía buildScrumItem) en
// todo REQ bloqueado con rol no autorizado, bug confirmado contra código real y contra
// _Locus-ckpt-render-ref.md (REQ.priority: obligatorio "siempre"). `status` y `role` quedan
// como parámetros — son el único par de campos donde las 2 ramas divergen intencionalmente
// (bloqueado fuerza 'pendiente' + rol resuelto; general usa el status/rol declarados). Sin
// cambio de comportamiento para el resto de campos — mismo default/fallback que cada rama ya
// tenía antes de este TKT. _buildItilItem() no se toca — familia de validación distinta
// (incident_status vs status), sin precedente de builder unificado en este módulo.
function _buildPlaneadaTgItem(it, ckpt, opts) {
  const _sprintF = _resolveSprintFields(it);
  return {
    type:            it.type,
    code:            it.code,
    refId:           it.ref_id || null,
    title:           it.title  || it.desc || '',
    desc:            it.title  || it.desc || '',
    priority:        it.priority || 'medium',
    status:          opts.status,
    _noStatus:       false,
    effort:          it.effort != null ? (parseInt(it.effort) || null) : null,
    area:            it.area   || '',
    sprint:          _sprintF.sprintAlias,
    sprint_id:       _sprintF.sprint_id,
    sprint_name:     _sprintF.sprint_name,
    ac:              Array.isArray(it.ac) ? it.ac : [],
    role:            opts.role,
    discardReason:   it.discard_reason || it.reason || '',
    discardRef:      it.ref    || '',
    blockedBy:       Array.isArray(it.blockedBy) ? it.blockedBy : [],
    promovida_a:     it.promovida_a || null,
    parentId:        it.parent      || null,
    dependsOn:       Array.isArray(it.depends_on) ? it.depends_on : [],
    triggeredBy:     it.triggered_by  || null,
    origenDisc:      it.origen_disc   || null,
    intencion:       it.intencion     || null,
    no_incluye:      _normalizeNoIncluye(it.no_incluye, it.code),
    contract_detail: it.contract_detail || null,
    archivos:        Array.isArray(it.archivos) ? it.archivos : [],
    kill_criteria:   it.kill_criteria || null,
    nextRole:        it.next_role     || null,
    designIntent:    it.design_intent || null,
    blockedAt:       it.blocked_at    || null,
    contract_update: it.contract_update || null,
    draft:           ckpt.draft === true,
    schema_version:  it.schema_version != null ? Number(it.schema_version) : 0
  };
}

export function _buildTgItemsFromParsed(ckpt, parsedJSON) {
  const _validTypes    = _GEN2_TYPES;
  const _validStatuses = _VALID_STATUSES_GATE;
  const tgItems = [];
  const patchItems = [];
  const patchIntencionItems = []; // TKT1 (REQ-202607-061): canal propio, separado de patchItems
  const docUpdatePatchItems = []; // TKT2 (ref_id CAEL-08302200-06, REQ ref_id CAEL-08302200-01):
  // canal propio para type: doc_update_patch — mismo criterio de separación que
  // patchIntencionItems. Vive dentro de items[] (__BR-Ecosystem §8) pero no es un ítem de
  // backlog ni un patch sobre código real: resuelve una entrada ya registrada de doc_updates
  // por clave doc+section (locus-docs.js, applyDocUpdateResolution — TKT1).
  let itemError = null;
  // TKT3 (REQ-202608-107): gate de REQ sin AC — portado desde el loop inline de parsePaste
  // (_rsNoAc, retirado en TKT2 de este mismo REQ). BR-Ecosystem §5 + BR-Core §8 regla dura:
  // "R sin AC rechazado por Locus". Acumula todos los REQ sin AC del batch antes de emitir el
  // error consolidado — no interrumpe el loop en el primero, mismo criterio que _rsNoAc tenía.
  const _reqsNoAc = [];

  for (let i = 0; i < parsedJSON.length; i++) {
    const it = parsedJSON[i];
    if (it.type === 'patch') {
      if (!it.code || _isPlaceholderCode(it.code)) {
        _blogLog('patch-ignorado', it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (it.code || '(vacío)'), 'backlog');
        showToast('warn', `Patch descartado: código placeholder no patcheable — ${it.code || '(vacío)'}. Usa el código real asignado por Locus.`);
      } else {
        patchItems.push(it);
      }
      continue;
    }
    // TKT1 (REQ-202607-061): patch-intencion — mismo criterio que el path single (parseCheckpoint,
    // ver comentario ahí). Canal propio (patchIntencionItems), separado de patchItems.
    if (it.type === 'patch-intencion') {
      if (!it.code || _isPlaceholderCode(it.code)) {
        _blogLog('patch-ignorado', it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (it.code || '(vacío)'), 'backlog');
        showToast('warn', `Patch descartado: código placeholder no patcheable — ${it.code || '(vacío)'}. Usa el código real asignado por Locus.`);
      } else if (!it.founder_confirmado || typeof it.founder_confirmado !== 'string' || it.founder_confirmado.trim() === '') {
        _blogLog('patch-intencion-sin-confirmacion', it.code, 'patch-intencion sin founder_confirmado — no aplicado. Declarar confirmación explícita del founder.', 'backlog');
        showToast('warn', `patch-intencion descartado: falta founder_confirmado — ${it.code}.`);
      } else {
        patchIntencionItems.push(it);
      }
      continue;
    }
    // TKT2 (ref_id CAEL-08302200-06, REQ ref_id CAEL-08302200-01): doc_update_patch — resuelve
    // (aplicado/descartado) una entrada pendiente real de doc_updates por doc+section. Sin `code`
    // — direcciona por doc+section, misma clave que ya agrupa docUpdateIndex (locus-docs.js).
    if (it.type === 'doc_update_patch') {
      if (!it.doc || !it.section) {
        _blogLog('doc-update-patch-ignorado', (it.doc || '') + '::' + (it.section || ''), 'doc_update_patch ignorado: faltan doc o section.', 'backlog');
        showToast('warn', 'doc_update_patch descartado: faltan doc o section.');
      } else if (it.resolution !== 'aplicado' && it.resolution !== 'descartado') {
        _blogLog('doc-update-patch-ignorado', it.doc + '::' + it.section, 'doc_update_patch ignorado: resolution inválido "' + (it.resolution || '') + '" — válidos: aplicado | descartado.', 'backlog');
        showToast('warn', `doc_update_patch descartado: resolution inválido — ${it.doc}§${it.section}.`);
      } else {
        docUpdatePatchItems.push(it);
      }
      continue;
    }
    if (!it.type || !it.code) {
      itemError = `Ítem [${i}]: faltan campos obligatorios (type, code).`;
      break;
    }
    if (!_validTypes.includes(it.type)) {
      itemError = `Ítem [${i}]: type inválido "${it.type}". Válidos: REQ · TKT · DISC · INC · PRB · CHG`;
      break;
    }
    if (_ITIL_TYPES.has(it.type)) {
      const _itilResult3 = _buildItilItem(it, ckpt.rol || '', (ckpt.proyecto || '').trim(), ckpt.titulo);
      if (_itilResult3.error) {
        itemError = _itilResult3.error;
        break;
      }
      tgItems.push(_itilResult3.item);
      continue;
    }
    if (!it.status) {
      itemError = `Ítem [${i}]: faltan campos obligatorios (type, code, status).`;
      break;
    }
    if (it.status && (it.status.trim().toLowerCase() === 'historico' || it.status.trim().toLowerCase() === 'histórico')) {
      _blogLog(
        'status-historico-emitido',
        it.code || '[pendiente-ID]',
        `Status "historico" no es emitible — asignado exclusivamente por Locus al cerrar sprint`,
        'backlog'
      );
      continue;
    }
    const _normSt3 = _canonicalStatus(it.status, it.type);
    if (!_normSt3 || (!_validStatuses.includes(_normSt3) && _normSt3 !== 'promoted' && _normSt3 !== 'bloqueado' && _normSt3 !== 'discovery')) {
      itemError = `Ítem [${i}]: status inválido "${it.status}". Válidos: done · pendiente · descartado · en-revision${itemKind(it) === 'DISC' ? ' · discovery · promoted' : ''}`;
      break;
    }
    const _sprintRaw3 = it.sprint ? it.sprint.trim().toLowerCase() : '';
    const _sinSprint3 = _sprintRaw3 === '' || _sprintRaw3.endsWith('-q-backlog');
    if (_normSt3 === 'en-revision' && _sinSprint3) {
      itemError = `CHECKPOINT bloqueado: ${it.code || '[pendiente-ID]'} tiene status en-revision sin sprint asignado. Asignar sprint antes de continuar.`;
      break;
    }
    if (itemKind(it) === 'REQ' && _normSt3 === 'bloqueado') {
      const _resolvedRole = (it.role && it.role.trim()) ? it.role.trim() : (ckpt.rol || '');
      const _authorizedRole = 'QA · Finn';
      if (_resolvedRole !== _authorizedRole) {
        _blogLog(
          'rol-no-autorizado-bloqueado',
          it.code || '[pendiente-ID]',
          `Transición bloqueado en R ${it.code || '[pendiente-ID]'} rechazada: solo Finn puede mover un R a bloqueado. Rol resuelto: "${_resolvedRole}". Origen: ${ckpt.titulo || ''}`,
          'backlog'
        );
        // TKT-A1 (DISC-202608-148): builder común — ver _buildPlaneadaTgItem(). Cierra el bug
        // de `priority` ausente en esta rama (confirmado contra código real antes de este TKT).
        tgItems.push(_buildPlaneadaTgItem(it, ckpt, { status: 'pendiente', role: _resolvedRole }));
        _normalizeSprint(tgItems[tgItems.length - 1], tgItems);
        continue;
      }
    }
    // TKT3 (REQ-202608-107): REQ sin AC — mismo punto relativo que ocupaba en el loop inline
    // de parsePaste (después del bloque de REQ+bloqueado, antes de la construcción general del
    // ítem). Un REQ bloqueado con rol no autorizado ya salió por `continue` en el bloque de
    // arriba y nunca llega aquí — mismo orden que parsePaste tenía para ese caso combinado.
    if (itemKind(it) === 'REQ' && (!Array.isArray(it.ac) || it.ac.length === 0)) {
      _reqsNoAc.push(`R ${it.code || '[pendiente-ID]'} "${it.title || it.desc || ''}"`);
      continue;
    }
    // TKT-A1 (DISC-202608-148): builder común — ver _buildPlaneadaTgItem().
    tgItems.push(_buildPlaneadaTgItem(it, ckpt, { status: _normSt3, role: it.role || (ckpt.rol || '') }));
    if (itemKind(it) === 'DISC' && _normSt3 === 'promoted' && !it.promovida_a) {
      _blogLog('promoted-sin-ref', it.code || '[pendiente-ID]', 'DISC ' + (it.code || '[pendiente-ID]') + ' con status promoted sin campo promovida_a — trazabilidad incompleta', 'backlog');
    }
    // TKT1 (REQ-202608-107): alerta DocLog si T tiene contract_update: 'sí' y doc_updates
    // ausente o vacío — mismo check que ya existía solo en parsePaste (~L2224-2240, path
    // single). Consolida el gate para que el path batch dispare la misma alerta. AC-1..AC-5
    // idénticos al comentario original.
    if (itemKind(it) === 'TKT' && (it.contract_update || '').toLowerCase() === 'sí') {
      const _hasDocUpdates3 = Array.isArray(ckpt._rawDocUpdates) && ckpt._rawDocUpdates.length > 0;
      if (!_hasDocUpdates3) {
        _blogLog(
          'contract-update-sin-doc-update',
          it.code || '[pendiente-ID]',
          `contract_update declarado sí — DOC-UPDATE de module-contracts ausente en CHECKPOINT ${ckpt.titulo || ''}`,
          'backlog'
        );
      }
    }
    _normalizeSprint(tgItems[tgItems.length - 1], tgItems);
  }

  // TKT3 (REQ-202608-107): consolidar REQ sin AC — mismo criterio que el bloque equivalente
  // de parsePaste (T-202606-030 fix AC-2+AC-3). Solo se emite si ningún otro itemError ya
  // interrumpió el loop antes — un break-type error tiene precedencia.
  if (!itemError && _reqsNoAc.length > 0) {
    const _ckptOrigen3 = ckpt.titulo || '';
    itemError = `CHECKPOINT bloqueado: ${_reqsNoAc.join(' · ')} no tiene${_reqsNoAc.length !== 1 ? 'n' : ''} AC de coherencia de conjunto. Origen: ${_ckptOrigen3}. Adjuntar CHECKPOINT corregido antes de continuar.`;
    tgItems.length = 0;
  }

  return { tgItems, patchItems, patchIntencionItems, docUpdatePatchItems, itemError };
}
