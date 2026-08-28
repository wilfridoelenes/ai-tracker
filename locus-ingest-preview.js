// [PP] mod:1 · autor:Rune · 2026-08-27 09:20 UTC-6
// TKT-202608-474 (REQ-202608-198, parent: Partir parsePaste()/_processIngestBatch() en
// unidades de responsabilidad única — grupo 1/4, render): módulo nuevo — extrae el render de
// preview de ingesta y sus helpers de validación desde locus-session-parse.js (módulo
// crítico, ver _pp-context §6), sin cambio de comportamiento observable. Contenido movido
// tal cual, sin reescritura: los 3 helpers de #ingest-validation-panel (CAEL-25/26),
// _updateIngestBlockCount() (TKT2 REQ CAEL-01), y el par _ingestPreviewMeta()/
// _renderIngestBlockPreview() (TKT-202608-235, REQ-202608-089) con sus dependencias
// internas (_TRACE_TITLE_RE, _isTraceOnlyBlock). _routeParse()/_splitCheckpointBlocks()/
// _onApplyBatch() y la lógica de side effects permanecen en locus-session-parse.js — fuera
// de scope de este TKT (no_incluye).
// Responsabilidad: render de preview de bloques de ingesta (#ingest-block-preview-anchor,
//   #ingest-block-count) + panel de validación bloqueante/warning (#ingest-validation-panel).
// Dependencias: locus-session-parse.js (_splitCheckpointBlocks — ciclo ESM de 2 nodos,
//   seguro: ambos lados invocan los símbolos importados solo dentro de cuerpos de función,
//   nunca en top-level de módulo, mismo criterio ya vigente para el ciclo de 3 nodos
//   session-parse↔session-hora↔session-save documentado en locus-session-parse.js).

import { getItems, getIncidents } from './locus-backlog-core.js';
import { renderCkptField } from './locus-ckpt-render.js';
import { navigateToItem } from './locus-item-navigator.js';
import { esc } from './locus-ui-shell.js';
import { _splitCheckpointBlocks } from './locus-session-parse.js';

// CAEL-25: helpers de #ingest-validation-panel — reemplazan el target prev-${id},
// inexistente en el DOM desde la migración a #ingest-ta global (CAEL-22).
export function _showIngestValidationError(msgHtml) {
  const panel = document.getElementById('ingest-validation-panel');
  const errEl = document.getElementById('ingest-validation-error');
  const errMsgEl = document.getElementById('ingest-validation-error-msg');
  const warnEl = document.getElementById('ingest-validation-warnings');
  if (!panel || !errEl || !errMsgEl) return;
  panel.classList.remove('is-hidden');
  errEl.classList.remove('is-hidden');
  errMsgEl.innerHTML = msgHtml;
  if (warnEl) warnEl.classList.add('is-hidden');
}

// CAEL-26: helper de warnings dinámicos — mismo shell que _showIngestValidationError,
// target #ingest-validation-warnings. Botón compartido entre los 4 tipos de warning:
// se clona antes de adjuntar el listener para no acumular listeners entre warnings
// consecutivos de la misma sesión de textarea (AC de contrato interno).
export function _showIngestValidationWarning(msgHtml, onForce) {
  const panel = document.getElementById('ingest-validation-panel');
  const warnEl = document.getElementById('ingest-validation-warnings');
  const warnMsgEl = document.getElementById('ingest-validation-warning-msg');
  const forceBtn = document.getElementById('ingest-validation-force-btn');
  const errEl = document.getElementById('ingest-validation-error');
  if (!panel || !warnEl || !warnMsgEl || !forceBtn) return;
  panel.classList.remove('is-hidden');
  warnEl.classList.remove('is-hidden');
  warnMsgEl.innerHTML = msgHtml;
  if (errEl) errEl.classList.add('is-hidden');
  const _freshBtn = forceBtn.cloneNode(true);
  forceBtn.parentNode.replaceChild(_freshBtn, forceBtn);
  _freshBtn.addEventListener('click', onForce, { once: true });
}

export function _resetIngestValidationPanel() {
  const panel = document.getElementById('ingest-validation-panel');
  const errEl = document.getElementById('ingest-validation-error');
  const errMsgEl = document.getElementById('ingest-validation-error-msg');
  const warnEl = document.getElementById('ingest-validation-warnings');
  const warnMsgEl = document.getElementById('ingest-validation-warning-msg'); // CAEL-26
  if (panel) panel.classList.add('is-hidden');
  if (errEl) errEl.classList.add('is-hidden');
  if (errMsgEl) errMsgEl.innerHTML = '';
  if (warnEl) warnEl.classList.add('is-hidden');
  if (warnMsgEl) warnMsgEl.innerHTML = ''; // CAEL-26
}

export function _updateIngestBlockCount() {
  const el = document.getElementById('ingest-block-count');
  if (!el) return;
  const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
  const n = ta ? _splitCheckpointBlocks(ta.value).length : 0;
  el.textContent = n === 1 ? '1 bloque detectado' : `${n} bloques detectados`;
}

// TKT-202608-235 (REQ-202608-089, sprint PP-S-26): extrae `title` (truncable en el render) y un
//   resumen de `files` ("archivo · mod:N", solo el primer segmento) de un bloque de texto crudo
//   ya separado por _splitCheckpointBlocks — sin invocar parseCheckpoint/_parseBatchBlock. Esta
//   función es deliberadamente más liviana que la validación real (sin gate de draft, sin
//   _jsonParseError, sin _extractCkptMeta) porque corre en cada keystroke/paste vía
//   _renderIngestBlockPreview() (AC "happy path") — el único propósito es un title truncado y un
//   subtítulo de archivo para el preview visual, no persistencia ni aval de founder.
//   Bloque que no parsea como JSON (fence sin cerrar, prosa suelta capturada por
//   _extractBareJsonBlocks, etc.) devuelve null — no es "bloque válido" a efectos de este AC y no
//   genera fila de preview (AC "estado vacío" se cumple por composición: 0 bloques válidos → []).
//   Función pura, sin efectos laterales — mismo criterio de pureza que _extractCkptMeta/
//   _ckptArchivosToNames. contract_update: no — función nueva, sin consumidores externos.
// TKT2 (ref_id CAEL-08111800-03, parent REQ ref_id CAEL-08111800-01, AC "Extracción de datos"):
//   patrón del title de un CHECKPOINT de trazabilidad pura ya aplicado fuera de la cola de
//   doc_updates (Excepción de dueño co-presente, __BR-Core OWNERSHIP DE DOCUMENTOS). Em dash
//   "—" y "§" literales — mismo carácter que el resto de este archivo usa en comentarios de
//   la misma naturaleza. Función pura, sin efectos laterales.
const _TRACE_TITLE_RE = /^DOC-UPDATE aplicado — (.+?) §(.+?) \(([^)]+)\)$/;

// TKT2 (AC "happy path"): trigger de clasificación — items:[] (array vacío, no ausente) +
//   sin array doc_updates (per schema nunca se emite vacío, BR-Ecosystem §8 — "se omite si no
//   hay cambios para ningún doc"; el chequeo de ausencia cubre igual el caso defensivo de un
//   array vacío mal emitido) + docs_verified presente y distinto de 'n/a'. Función pura.
function _isTraceOnlyBlock(parsed) {
  if (!Array.isArray(parsed.items) || parsed.items.length !== 0) return false;
  if (parsed.doc_updates !== undefined) return false;
  if (typeof parsed.docs_verified !== 'string') return false;
  const _dv = parsed.docs_verified.trim();
  return !!_dv && _dv.toLowerCase() !== 'n/a';
}

function _ingestPreviewMeta(blockText) {
  let parsed;
  try {
    // Fence-strip: bloques fenced de _splitCheckpointBlocks conservan ``` / ```json — JSON.parse
    // no tolera el fence. Mismo strip que ya aplica el path de parseCheckpoint sobre bloques
    // fenced antes de intentar el parse.
    const _stripped = blockText.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
    parsed = JSON.parse(_stripped);
  } catch (e) {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || typeof parsed.title !== 'string' || !parsed.title.trim()) {
    return null; // sin title no hay nada verificable como CHECKPOINT — mismo gate de BR-Ecosystem §8
  }
  const _title = parsed.title.trim();
  // `files` es el campo de nivel-sesión del CHECKPOINT (BR-Ecosystem §8 — "nombre · mod:N ·
  // autor:Rol | ..."), no el `archivos` por-ítem de TKT/REQ individual dentro de items[]. Mismo
  // campo fuente que _ckptArchivosToNames ya consume (ahí vía ckpt.archivos post-parseCheckpoint,
  // acá directo del JSON crudo porque este helper no pasa por parseCheckpoint).
  let meta = '';
  if (typeof parsed.files === 'string' && parsed.files.trim()) {
    const _parts = parsed.files.split('|')[0].split('·').map(s => s.trim());
    if (_parts[0]) meta = _parts[1] ? `${_parts[0]} · ${_parts[1]}` : _parts[0];
  }

  // TKT2 (AC "estado de error"): un bloque trace-only cuyo title no matchea el patrón cae al
  // preview genérico — no lanza excepción, no altera el conteo de bloques detectados (ese
  // conteo viene de _splitCheckpointBlocks vía _updateIngestBlockCount, no de esta función).
  if (_isTraceOnlyBlock(parsed)) {
    const _m = _TRACE_TITLE_RE.exec(_title);
    if (_m) {
      const _code = _m[3].trim();
      // AC "Link de origen": el link solo se renderiza si el código resuelve contra un ítem
      // real — mismas dos fuentes que navigateToItem() consulta (locus-item-navigator.js),
      // consultadas acá en modo lectura (sin navegar) para decidir si el link existe.
      const _originExists = getItems().some(i => i.code === _code) || getIncidents().some(i => i.code === _code);
      const _tr = typeof parsed.tensions_resolved === 'string' ? parsed.tensions_resolved.trim() : '';
      return {
        title: _title,
        meta,
        category: 'trazabilidad',
        trace: {
          doc: _m[1].trim(),
          section: `§${_m[2].trim()}`,
          code: _code,
          originExists: _originExists,
          docsVerified: parsed.docs_verified.trim(),
          tensionsResolved: (_tr && _tr.toLowerCase() !== 'n/a') ? _tr : ''
        }
      };
    }
    // trace-only por schema pero title no matchea el patrón esperado — fallback a genérico.
  }

  // TKT-202608-333 (REQ-202608-132, AC2/AC3): clasificación crea/modifica. items[] con al
  //   menos un type:'patch'|'patch-intencion' → 'modifica' — precede a 'crea' si el bloque
  //   mezcla creación de ítems nuevos con un patch sobre código real ya existente en el mismo
  //   items[] (permitido por schema, __BR-Ecosystem §8 — "type: patch... se puede mezclar con
  //   ítems normales en el mismo bloque"). Supuesto declarado por Rune: los dos AC del TKT
  //   describen escenarios puros (solo-crea / solo-patch), sin cubrir el caso mixto — se
  //   resuelve dando precedencia a 'modifica' porque tocar un código real ya existente es la
  //   señal de mayor consecuencia para quien revisa el preview antes de pegar. items[] sin
  //   type reconocible, o ausente/vacío sin ser trace-only, cae a 'generic' sin cambio.
  if (Array.isArray(parsed.items) && parsed.items.length) {
    const _patchItems = parsed.items.filter(it => it && (it.type === 'patch' || it.type === 'patch-intencion'));
    if (_patchItems.length) {
      const _codes = [...new Set(_patchItems.map(it => {
        if (it.code && typeof it.code === 'object') return it.code.ref_id || '?';
        return typeof it.code === 'string' && it.code ? it.code : '?';
      }))];
      const _fieldSet = new Set();
      _patchItems.forEach(it => {
        Object.keys(it).forEach(k => { if (k !== 'type' && k !== 'code') _fieldSet.add(k); });
      });
      // TKT-202608-340 (AC2 · AC4): campo real por-ítem renderizado vía renderCkptField, itemType
      //   resuelto por el `type` del ítem target — para type:'patch'/'patch-intencion' el itemType
      //   real (REQ/TKT/...) no está disponible en el bloque (patch solo trae `code`), así que el
      //   catálogo consulta directamente bajo la clave 'patch'/'patch-intencion', que cubre los
      //   campos comunes de la instrucción misma (type/code/founder_confirmado). Campos target
      //   heredados (ver _Locus-ckpt-render-ref.md, fila `patch | cualquier campo patcheable...`)
      //   no se resuelven aquí — requieren conocer el itemType real del código parcheado, fuera
      //   de scope de este TKT (no_incluye: cambios al motor de render mismo). renderCkptField
      //   retorna null silenciosamente ante campo no mapeado (AC4) — .filter(Boolean) descarta
      //   sin lanzar excepción, el resto de campos se renderiza igual.
      const _renderedFields = _patchItems.flatMap(it => {
        const _itemType = it.type === 'patch-intencion' ? 'patch-intencion' : 'patch';
        return Object.keys(it)
          .filter(k => k !== 'type' && k !== 'code')
          .map(k => renderCkptField(_itemType, k, it[k]))
          .filter(Boolean);
      });
      // TKT-202608-353 (REQ-202608-139): resolver el tipo real de cada código parcheado contra
      //   el backlog vivo — un type:'patch' no trae el tipo del ítem target (solo code + campos),
      //   mismo gap ya documentado arriba para renderCkptField. Mismo mecanismo que _originExists
      //   (rama 'trazabilidad', arriba) — getItems()/getIncidents() por code, sin inferencia por
      //   prefijo. Ampliado por decisión del founder (esta sesión) a todo tipo, no solo ITIL —
      //   discrepancia con el AC original de Cael (acotado a INC/PRB/CHG), declarada en el
      //   CHECKPOINT de este TKT. Un code:{ref_id,title} (patch sobre ítem de la misma tanda aún
      //   sin código real) no resuelve — badge omitido para ese código, sin excepción (mismo
      //   criterio de silencio que _originExists ante código no encontrado).
      const _resolvedTypes = [...new Set(_patchItems.map(it => {
        const _code = typeof it.code === 'string' ? it.code : null;
        if (!_code) return null;
        const _real = getItems().find(i => i.code === _code) || getIncidents().find(i => i.code === _code);
        return _real ? _real.type : null;
      }).filter(Boolean))];
      // Transición ITIL: solo cuando el patch declara incident_status o status Y el tipo
      //   resuelto es INC/PRB/CHG. avance = destino closed/done. escalacion = destino
      //   escalated_to_prb/escalated_to_chg. Otros destinos (ej. detected, in_progress,
      //   root_cause_confirmed, resolved) no son ni avance ni escalación en el sentido visual
      //   de este AC — sin chip de transición para esos casos, mismo criterio de "no inventar
      //   una lectura que el AC no pidió".
      let _transition = null;
      if (_resolvedTypes.some(t => t === 'INC' || t === 'PRB' || t === 'CHG')) {
        const _dest = _patchItems.map(it => it.incident_status || it.status).find(Boolean);
        if (_dest === 'closed' || _dest === 'done') _transition = { kind: 'avance', dest: _dest };
        else if (_dest === 'escalated_to_prb' || _dest === 'escalated_to_chg') _transition = { kind: 'escalacion', dest: _dest };
      }
      const _isHighPriority = _patchItems.some(it => it.sla_priority === 'high');
      return { title: _title, meta, category: 'modifica', patch: { codes: _codes, fields: [..._fieldSet] }, rendered: _renderedFields, types: _resolvedTypes, transition: _transition, highPriority: _isHighPriority };
    }
    const _typesSeen = [];
    parsed.items.forEach(it => {
      if (it && typeof it.type === 'string' && !_typesSeen.includes(it.type)) _typesSeen.push(it.type);
    });
    if (_typesSeen.length) {
      // TKT-202608-340 (AC1 · AC4): mismo criterio — cada ítem de creación resuelve sus campos
      //   reales contra el catálogo de su propio itemType. Campos ausentes del catálogo (AC4)
      //   retornan null y se descartan sin romper el render del resto.
      const _renderedFields = parsed.items.flatMap(it => {
        if (!it || typeof it.type !== 'string') return [];
        return Object.keys(it)
          .filter(k => k !== 'type' && k !== 'code')
          .map(k => renderCkptField(it.type, k, it[k]))
          .filter(Boolean);
      });
      // TKT5 (REQ-202608-132, AC1): cantidad de ítems del bloque — mismo criterio de membresía que
      //   _typesSeen (it && typeof it.type === 'string'), no parsed.items.length crudo, para no
      //   contar entradas malformadas sin type que tampoco aportan a typesSummary/rendered.
      const _itemCount = parsed.items.filter(it => it && typeof it.type === 'string').length;
      // TKT-202608-353 (REQ-202608-139): 'types'/'highPriority' con el mismo shape que la rama
      //   'modifica' (arriba) — aquí el tipo ya viene explícito en cada ítem (a diferencia de
      //   'modifica', que debe resolverlo contra el backlog), así que se deriva directo de
      //   _typesSeen sin lookup adicional.
      const _isHighPriorityCrea = parsed.items.some(it => it && it.sla_priority === 'high');
      return { title: _title, meta, category: 'crea', typesSummary: _typesSeen.join(' + '), count: _itemCount, rendered: _renderedFields, types: _typesSeen, highPriority: _isHighPriorityCrea };
    }
  }

  // AC5 — items[] vacío (`[]`, ya cubierto por el guard `.length` de arriba) o ausente cae acá
  // sin invocar renderCkptField — categoría 'generic', sin campo `rendered`, mismo comportamiento
  // previo a este TKT. _renderIngestBlockPreview() no requiere `rendered` en esta rama.
  return { title: _title, meta, category: 'generic' };
}

// TKT-202608-235 (REQ-202608-089, sprint PP-S-26 · design_intent: ingest_block_preview_mockup,
//   aprobado por founder): renderiza .ingest-block-preview* — entregable visual de Nova
//   (locus-modals-base.css mod:25). Contenido 100% dinámico, sin shell estático (BR-Execution §5
//   — el contenedor entero se genera/destruye, no se togglea con classList.add/remove is-hidden,
//   por decisión explícita de Nova declarada en su entregable). Monta sobre
//   #ingest-block-preview-anchor — punto de anclaje estático que debe existir en el modal de
//   ingesta junto a #ingest-block-count (index.html no está adjunto en esta sesión — ver bloqueo
//   declarado en el CHECKPOINT de este TKT). Deriva los bloques de la misma fuente que
//   _updateIngestBlockCount() (_splitCheckpointBlocks(ta.value)) — no duplica la detección.
export function _renderIngestBlockPreview() {
  const _anchor = document.getElementById('ingest-block-preview-anchor');
  if (!_anchor) return; // anclaje no presente en este modal/vista — no-op, mismo criterio que _updateIngestBlockCount
  const ta = document.getElementById('ingest-ta') /* CAEL-22 */;
  const _blocks = ta ? _splitCheckpointBlocks(ta.value) : [];
  // TKT-202608-336 (REQ-202608-132, AC1): idx preservado desde la posición original en _blocks —
  //   no el índice post-.filter(Boolean). Mismo criterio que _resolveCheckpointBatch (Paso 1, más
  //   abajo en este archivo — b.idx es la posición real en el array de bloques sin filtrar, no la
  //   posición tras descartar los inválidos; divergían en cuanto el batch mezclaba bloques válidos
  //   e inválidos — Bug 1, ya corregido del lado de locus-backlog-merge.js/_buildAttributedCardsBlock,
  //   que filtra por meta.idx explícito en vez del índice de iteración de .map()). _splitCheckpointBlocks(ta.value)
  //   es la misma fuente compartida entre este preview y _resolveCheckpointBatch (vía _processIngestBatch) —
  //   mismo idx en ambos lados sin recálculo propio.
  const _metas = _blocks
    .map((blockText, idx) => {
      const m = _ingestPreviewMeta(blockText);
      return m ? { ...m, idx } : null;
    })
    .filter(Boolean);

  if (!_metas.length) {
    // AC "estado vacío" — 0 bloques válidos → ninguna fila, ningún contenedor fantasma.
    _anchor.innerHTML = '';
    return;
  }

  _anchor.innerHTML = `
    <div class="ingest-block-preview">
      <div class="ingest-block-preview-label">preview de bloques detectados</div>
      <div class="ingest-block-preview-list">
        ${_metas.map(m => {
          const _short = m.title.length > 60 ? m.title.slice(0, 60) + '…' : m.title;
          // TKT2 (ref_id CAEL-08111800-03, parent REQ ref_id CAEL-08111800-01): rama de
          //   render del bloque de trazabilidad — entregable de Nova (locus-modals-base.css
          //   mod:30, .ingest-block-preview-icon--trace / .ingest-block-preview-tag /
          //   .ingest-block-preview-origin). El resto de bloques (category 'generic') sigue
          //   el markup original sin cambio.
          if (m.category === 'trazabilidad') {
            const _t = m.trace;
            return `
              <div class="ingest-block-preview-item" data-block-idx="${esc(m.idx)}" tabindex="0">
                <svg class="ti-svg ingest-block-preview-icon ingest-block-preview-icon--trace"><use href="#ti-git-commit"></use></svg>
                <div class="ingest-block-preview-text">
                  <div class="ingest-block-preview-title-row">
                    <div class="ingest-block-preview-title" title="${esc(m.title)}">${esc(_short)}</div>
                    <span class="ingest-block-preview-tag" aria-label="bloque de trazabilidad — sin cambios de backlog">Trazabilidad</span>
                  </div>
                  <div class="ingest-block-preview-meta">${esc(_t.doc)} ${esc(_t.section)}</div>
                  <div class="ingest-block-preview-meta">docs_verified: ${esc(_t.docsVerified)}</div>
                  ${_t.tensionsResolved ? `<div class="ingest-block-preview-meta">tensions_resolved: ${esc(_t.tensionsResolved)}</div>` : ''}
                  ${_t.originExists ? `<a href="#" class="ingest-block-preview-origin" data-code="${esc(_t.code)}">${esc(_t.code)}</a>` : ''}
                </div>
              </div>`;
          }
          // TKT-202608-333 (REQ-202608-132, AC2/AC3): badge 'Crea'/'Modifica' — clase base +
          //   modificador ya entregado por Nova (locus-modals-base.css mod:32,
          //   .ingest-block-preview-tag--crea/--modifica). Mismo slot que el badge de
          //   trazabilidad (title-row), mismo patrón visual, categoría mutuamente excluyente.
          if (m.category === 'crea' || m.category === 'modifica') {
            const _isCrea = m.category === 'crea';
            // TKT-202608-340 (AC1/AC2): campos reales renderizados por renderCkptField (motor de
            //   render, TKT-202608-339) — cada entrada de m.rendered ya trae {html, hint} listo,
            //   se concatena tal cual. AC4: m.rendered nunca contiene entradas null (.filter(Boolean)
            //   ya aplicado en _ingestPreviewMeta) — sin guard adicional necesario acá. AC5: bloques
            //   sin items[] (category 'generic') no llegan a esta rama, sin campo `rendered` que leer.
            const _renderedHtml = (m.rendered && m.rendered.length)
              ? `<div class="ingest-block-preview-fields">${m.rendered.map(r => r.html).join('')}</div>`
              : '';
            // TKT-202608-353 (REQ-202608-139, design_intent: ingest_preview_itil_badge_transition):
            //   badge de tipo — uno por cada type distinto en m.types (normalmente 1; un bloque
            //   'crea' con ítems de tipos mezclados muestra un badge por tipo, sin límite —
            //   el mockup aprobado no cubrió el caso multi-tipo explícitamente, se extiende el
            //   mismo patrón visual en vez de forzar un único badge que ocultaría información).
            //   Chip --high solo si algún ítem del bloque declara sla_priority:'high' (AC del
            //   mockup: "su ausencia... ya comunica no urgente"). Fila de transición solo cuando
            //   m.transition existe (exclusivo de bloques 'modifica' con INC/PRB/CHG resuelto,
            //   ver _ingestPreviewMeta) — kind 'avance'/'escalacion' mapea 1:1 a las clases
            //   entregadas por Nova. Flecha con aria-hidden (AC de accesibilidad del entregable
            //   de Nova) — el texto plano de la transición ya es legible sin ella.
            const _typeBadges = (m.types || []).map(t => `<span class="ingest-block-preview-type">${esc(t)}</span>`).join('');
            const _highChip = m.highPriority ? `<span class="ingest-block-preview-tag ingest-block-preview-tag--high">High</span>` : '';
            const _transitionHtml = m.transition
              ? `<div class="ingest-block-preview-transition ingest-block-preview-transition--${m.transition.kind}"><span class="ingest-block-preview-transition-arrow" aria-hidden="true">→</span><span>${esc(m.transition.dest)}</span></div>`
              : '';
            return `
              <div class="ingest-block-preview-item" data-block-idx="${esc(m.idx)}" tabindex="0">
                <svg class="ti-svg ingest-block-preview-icon"><use href="#ti-file-text"></use></svg>
                <div class="ingest-block-preview-text">
                  <div class="ingest-block-preview-title-row">
                    ${_typeBadges}
                    <div class="ingest-block-preview-title" title="${esc(m.title)}">${esc(_short)}</div>
                    <span class="ingest-block-preview-tag ingest-block-preview-tag--${_isCrea ? 'crea' : 'modifica'}">${_isCrea ? 'Crea' : 'Modifica'}</span>
                    ${_highChip}
                  </div>
                  ${_transitionHtml}
                  ${_isCrea
                    ? `<div class="ingest-block-preview-meta">${esc(m.typesSummary)} · ${m.count === 1 ? '1 ítem' : `${esc(m.count)} ítems`}</div>`
                    : `<div class="ingest-block-preview-meta">${esc(m.patch.codes.join(' + '))}</div>${m.patch.fields.length ? `<div class="ingest-block-preview-meta">${esc(m.patch.fields.join(', '))}</div>` : ''}`}
                  ${m.meta ? `<div class="ingest-block-preview-meta">${esc(m.meta)}</div>` : ''}
                  ${_renderedHtml}
                </div>
              </div>`;
          }
          return `
            <div class="ingest-block-preview-item" data-block-idx="${esc(m.idx)}" tabindex="0">
              <svg class="ti-svg ingest-block-preview-icon"><use href="#ti-file-text"></use></svg>
              <div class="ingest-block-preview-text">
                <div class="ingest-block-preview-title" title="${esc(m.title)}">${esc(_short)}</div>
                ${m.meta ? `<div class="ingest-block-preview-meta">${esc(m.meta)}</div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;

  // TKT2 (AC "Link de origen"): binding post-render sobre los nodos recién creados — no hay
  //   acumulación de listeners entre renders porque _anchor.innerHTML se reasigna completo en
  //   cada llamada (los nodos anteriores, con sus listeners, se descartan junto con el HTML
  //   anterior). Mismo criterio de pureza que el resto de esta función: sin listener delegado
  //   persistente sobre _anchor, que sí acumularía si se registrara aquí en cada llamada.
  _anchor.querySelectorAll('.ingest-block-preview-origin').forEach(_el => {
    _el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToItem(_el.dataset.code);
    });
  });

  // TKT-202608-336 (REQ-202608-132, AC1/AC2/AC4): click o Enter/Space en un ítem del preview
  //   navega — scrollIntoView + foco — hasta la .mdiff-narrative-section con el mismo
  //   data-block-idx en el panel DIFF (columna 2/3 del mismo shell #modal-split-shell,
  //   #merge-diff-overlay — ver index.html; ambas columnas viven en el mismo documento, sin
  //   iframe, querySelector directo alcanza ambos lados). La sección solo existe tras procesar
  //   el batch (_buildAttributedCardsBlock(), locus-backlog-merge.js, gate _ckptMetas.length>=2)
  //   — sin match (batch no procesado aún, o modo single sin agrupación por bloque) → no-op
  //   silencioso, sin excepción (AC2). Guard: click dentro de .ingest-block-preview-origin no
  //   dispara este handler — ese nodo ya tiene su propio listener de navegación (arriba) y no
  //   debe competir con el scroll de bloque. Mismo criterio de pureza de listeners que el resto
  //   de esta función — sin acumulación entre renders, _anchor.innerHTML se reasigna completo.
  _anchor.querySelectorAll('.ingest-block-preview-item[data-block-idx]').forEach(_item => {
    const _scrollToSection = () => {
      const _section = document.querySelector(`.mdiff-narrative-section[data-block-idx="${_item.dataset.blockIdx}"]`);
      if (!_section) return; // sin sección correspondiente todavía — no-op silencioso (AC2)
      _section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      _section.focus({ preventScroll: true });
    };
    _item.addEventListener('click', (e) => {
      if (e.target.closest('.ingest-block-preview-origin')) return; // navegación propia, sin competir
      _scrollToSection();
    });
    _item.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('.ingest-block-preview-origin')) return;
      e.preventDefault(); // evita scroll de página por Space
      _scrollToSection();
    });
  });
}
