// [PP] mod:2 · autor:Rune · 2026-07-24 UTC-6
// TKT3 (REQ CAEL-0723-01, ref_id CAEL-0723-01): buildQIncItem() — slaClass (vencido/riesgo)
// gateado por isSlaClockPaused(item) (locus-backlog-core.js). No toca slaPrioBadge,
// incStatusBadge ni slaCountdownHtml — solo la clase a nivel de .qinc-item.
// [PP] mod:1 · autor:Rune · 2026-07-23 UTC-6
// TKT2 (REQ split-itil-item, ref_id CAEL-0722-08 · extracción ITIL + call sites internos —
//   TKT2 y TKT3 de la tabla original acordada con el founder se fusionan aquí: separar
//   "mover funciones" de "actualizar los 2 call sites que las invocan dentro del mismo
//   archivo" habría dejado locus-backlog-item.js roto entre TKTs (mergeBacklogFromTG/
//   applyPatchesFromTG invocan buildIncidentItem/validateIncidentTransitions localmente —
//   no son operaciones separables sin un estado intermedio inválido). Corrección de
//   especificación declarada en el CHECKPOINT — ver __BR-Execution §1 Fase 2).
// Módulo nuevo — separa la rama Reactiva (INC/PRB/KE/CHG, __BR-Ecosystem §4b) de la Planeada
// (REQ/TKT/DISC, que se queda en locus-backlog-item.js). Trasplantado tal cual desde
// locus-backlog-item.js mod:132 — sin cambio de comportamiento, sin cambio de firma en
// ninguna de las 3 funciones. Consumidores externos conocidos (locus-incidents-render.js
// para buildQIncItem) NO actualizados en este TKT — locus-backlog-item.js re-exporta las 3
// funciones como puente temporal (ver mod:133 de ese archivo) hasta TKT3 (actualizar
// locus-incidents-render.js + main.js + retirar el puente), bloqueado por archivos no
// adjuntos en esta sesión.
import { _buildCommonItemFields, TYPE_LABELS } from './locus-backlog-item.js';
import { esc } from './locus-ui-shell.js';
import { itemKind, isSlaClockPaused } from './locus-backlog-core.js'; // TKT3 (REQ CAEL-0723-01, ref_id CAEL-0723-01): isSlaClockPaused agregado — gatea clases SLA en buildQIncItem()
import { incSlaPriority, incComportamientoActual, incIncidentStatus, incOriginModule, SLA_RIESGO_WINDOW_MS } from './locus-inc-fields.js';
import { _VALID_INCIDENT_STATUS, _VALID_PRB_STATUS, _VALID_KE_STATUS } from './locus-session-parse.js';

// TKT-PARSER-2a (REQ-[pendiente-ID]): tabla de pares válidos de transición ITIL.
// Clave: incidentStatus origen. Valor: Set de incidentStatus destino permitidos desde ese origen.
// Distinto de _VALID_INCIDENT_STATUS (locus-session-parse.js) — ese set valida pertenencia
// del valor al vocabulario ITIL; esta tabla valida que el PAR origen→destino sea una
// transición real del ciclo de vida (BR-Core §6), no solo que ambos valores existan.
const _VALID_INCIDENT_TRANSITIONS = {
  detected:    new Set(['assigned']),
  assigned:    new Set(['in_progress']),
  in_progress: new Set(['resolved', 'escalated_to_prb', 'escalated_to_chg']),
  resolved:    new Set(['closed'])
  // closed, escalated_to_prb, escalated_to_chg, descartado: sin transiciones salientes declaradas —
  // estados terminales del ciclo dentro de este merge. Reabrir un INC closed no es un caso cubierto
  // por este AC — fuera de scope de TKT-PARSER-2a.
};

// TKT1 (REQ CAEL-01): tabla de transiciones propia de PRB — BR-Core §6.
// PRB no tiene status 'assigned' (a diferencia de INC) — nace directamente en 'detected'.
const _VALID_PRB_TRANSITIONS = {
  detected:    new Set(['in_progress']),
  in_progress: new Set(['resolved']),
  resolved:    new Set(['closed'])
  // closed, descartado: estados terminales — sin transiciones salientes declaradas, mismo criterio
  // que _VALID_INCIDENT_TRANSITIONS para closed. Fuera de scope de TKT1.
};

// TKT1 (REQ CAEL-01): tabla de transiciones propia de KE — BR-Core §6.
// KE nace en 'active' — único estado no terminal del ciclo.
const _VALID_KE_TRANSITIONS = {
  active: new Set(['resolved', 'descartado'])
  // resolved, descartado: estados terminales — sin transiciones salientes declaradas.
};

// TKT-PARSER-2a (REQ-[pendiente-ID]): valida un par (oldIncidentStatus, newIncidentStatus).
// No usa VALID_TRANSITIONS (locus-session-save.js) — esa tabla es de status Scrum por tipo,
// no de transiciones ITIL por par origen→destino. Devuelve {valid:true} o {valid:false, reason}.
// TKT1 (REQ CAEL-01): parámetro `itilType` agregado — antes esta función validaba todo par
// contra el vocabulario y la tabla de transiciones de INC, sin distinguir tipo. PRB y KE
// comparten mecanismo pero tienen vocabulario y tabla de transiciones propios (BR-Core §6) —
// aplicar la tabla de INC a un PRB rechazaba transiciones válidas de su propio ciclo
// (ej. detected→in_progress). `itilType` es opcional y por defecto 'INC' — preserva el
// comportamiento exacto de todo caller que no fue actualizado a pasar el tipo.
export function validateIncidentTransitions(oldIncidentStatus, newIncidentStatus, itilType = 'INC') {
  const _statusSet = itilType === 'PRB' ? _VALID_PRB_STATUS
    : itilType === 'KE' ? _VALID_KE_STATUS
    : _VALID_INCIDENT_STATUS;
  const _transitions = itilType === 'PRB' ? _VALID_PRB_TRANSITIONS
    : itilType === 'KE' ? _VALID_KE_TRANSITIONS
    : _VALID_INCIDENT_TRANSITIONS;
  if (!_statusSet.has(oldIncidentStatus) || !_statusSet.has(newIncidentStatus)) {
    // Valor fuera del vocabulario ITIL del tipo — ya debió rechazarse en _buildItilItem (locus-session-parse.js).
    // Defensivo: no es una transición ITIL inválida en sí, es un valor inválido — no bloquear aquí.
    return { valid: true };
  }
  // INC-[pendiente-ID] (gap detectado en auditoría Q-INC): 'descartado' es destino válido desde
  // CUALQUIER estado no-terminal para los 3 tipos ITIL — BR-Core §6 lo declara sin restricción de
  // origen ("Cualquier status → descartado | Con justificación explícita en el CHECKPOINT") para
  // INC y PRB, y _VALID_KE_TRANSITIONS ya lo permitía para KE. Antes de este fix, solo KE tenía la
  // transición declarada en su tabla — INC/PRB la rechazaban con "transición ITIL inválida" pese a
  // estar autorizada por BR. Chequeo centralizado aquí (no replicado en las 3 tablas por-tipo) para
  // que la regla transversal viva en un solo lugar — mismo criterio de causa raíz que ya motivó
  // extraer _itilStatusSet/_itilStatusList en locus-session-parse.js. 'closed' NO se excluye como
  // origen — BR-Core no declara excepción para closed, la regla es literal "cualquier status".
  // discard_reason (obligatorio en items descartados, ver BR-Ecosystem §5) se valida en el punto
  // de ingesta del patch, no aquí — esta función solo valida el par de estados.
  if (newIncidentStatus === 'descartado' && oldIncidentStatus !== 'descartado' && itilType !== 'KE') {
    return { valid: true };
  }
  const _allowed = _transitions[oldIncidentStatus];
  if (!_allowed || !_allowed.has(newIncidentStatus)) {
    return { valid: false, reason: `transición ITIL inválida: ${oldIncidentStatus} → ${newIncidentStatus}` };
  }
  return { valid: true };
}

export function buildIncidentItem(item, ctx) {
  const { _incomingType, initialStatus } = ctx;
  return {
    ..._buildCommonItemFields(item, ctx),
    queue: item.queue || null,
    ...(['INC', 'PRB', 'KE'].includes(_incomingType) ? { incidentStatus: item.incidentStatus || initialStatus } : {}),
    slaPriority: item.slaPriority || null,
    slaDeadline: item.slaDeadline || null,
    comportamientoActual: item.comportamientoActual || '',
    originModule: item.originModule || null,
    derivedItems: item.derivedItems || [],
    resolutionType: item.resolutionType || null,
  };
}

export function buildQIncItem(item) {
  const type      = itemKind(item) || '';
  const typeLabel = TYPE_LABELS[type] || type || '—';
  const code      = item.code || item.id || '';

  // Badge incidentStatus — '—' si ausente, sin crash
  const incStatus    = incIncidentStatus(item) || '';
  const incStatusBadge = incStatus
    ? `<span class="qinc-badge qinc-badge--status">${esc(incStatus)}</span>`
    : `<span class="qinc-badge qinc-badge--status qinc-badge--empty">—</span>`;

  // Badge slaPriority — '—' si ausente, sin crash
  const slaPrio      = incSlaPriority(item) || '';
  const slaPrioBadge = slaPrio
    ? `<span class="qinc-badge qinc-badge--sla qinc-badge--sla-${slaPrio}">${esc(slaPrio)}</span>`
    : `<span class="qinc-badge qinc-badge--sla qinc-badge--empty">—</span>`;

  const slaDeadline  = item.slaDeadline || item.sla_deadline || null;

  // TKT3 (REQ CAEL-0723-01, ref_id CAEL-0723-01): derived_items apuntando a un REQ/DISC/CHG
  // no-terminal pausa el reloj SLA — no aplica ni --sla-vencido ni --sla-riesgo. No toca
  // slaPrioBadge/incStatusBadge ni slaCountdownHtml — solo la clase a nivel de card.
  const slaPaused = isSlaClockPaused(item);

  // Clases SLA — mutuamente excluyentes (AC TKT-B2a AC4)
  // Fix inline (TKT1, triggered_by [tmp:tkt-countdown-sla]): la rama --sla-riesgo no
  // exigía slaPrio === 'high' — cualquier prioridad dentro de la ventana de 6h recibía
  // la clase a nivel de card. Corregido para exigir 'high', igual que ya exigía la rama
  // vencido. Calculado antes del countdown porque TKT1 lo consume abajo.
  let slaClass = '';
  if (slaDeadline && !slaPaused) {
    if (slaPrio === 'high' && slaDeadline < Date.now()) {
      slaClass = 'qinc-item--sla-vencido';
    } else if (slaPrio === 'high' && slaDeadline >= Date.now() && slaDeadline < Date.now() + SLA_RIESGO_WINDOW_MS) {
      slaClass = 'qinc-item--sla-riesgo';
    }
  }

  // Countdown slaDeadline — solo si presente
  let slaCountdownHtml = '';
  if (slaDeadline) {
    const remaining = slaDeadline - Date.now();
    if (remaining < 0) {
      // Fix inline (TKT1): el modificador --vencido se aplicaba al span del countdown para
      // CUALQUIER prioridad con deadline pasado, sin gate de slaPrio — contradice AC4 (medium/low
      // sin --riesgo ni --vencido en el countdown). El texto "VENCIDO" se sigue mostrando para
      // medium/low (no_incluye de TKT1 no pide removerlo), pero sin el modificador visual --vencido.
      const vencidoClass = slaPrio === 'high' ? ' qinc-sla-countdown--vencido' : '';
      slaCountdownHtml = `<span class="qinc-sla-countdown${vencidoClass}">VENCIDO</span>`;
    } else {
      const hrs = Math.floor(remaining / 3600000);
      const min = Math.floor((remaining % 3600000) / 60000);
      // TKT1 AC1/AC2: --riesgo espeja exactamente slaClass — mismo umbral, ya gateado a 'high' arriba.
      const riesgoClass = slaClass === 'qinc-item--sla-riesgo' ? ' qinc-sla-countdown--riesgo' : '';
      slaCountdownHtml = `<span class="qinc-sla-countdown${riesgoClass}">${hrs}h ${min}m</span>`;
    }
  }

  // comportamientoActual expandible — togglable vía data-qi-action (AC TKT-B2a AC5)
  // Fix INC (Q-INC render audit, 2026-07-18): antes el contenido era su propio trigger,
  // pero CSS le aplicaba display:none por defecto — un elemento no renderizado no puede
  // recibir click ni foco, comportamiento_actual nunca era alcanzable. Ahora el trigger es
  // un <button> real y separado (activación por teclado nativa, sin keydown propio) que
  // controla el contenido vía aria-expanded/aria-controls — mismo patrón semántico que
  // .idp-section-toggle (locus-backlog-panel.js), CSS entregado por Nova (mod:102 de
  // locus-backlog.css).
  const comportamiento = incComportamientoActual(item) || '';
  const comportId = `qinc-comport-${esc(code)}`;
  const comportamientoHtml = comportamiento
    ? `<button type="button" class="qinc-item-comportamiento-toggle" data-qi-action="qi-toggle-comportamiento" aria-expanded="false" aria-controls="${comportId}">
    <span class="qinc-toggle-arrow">▸</span> Comportamiento actual
  </button>
  <div class="qinc-item-comportamiento" id="${comportId}">${esc(comportamiento)}</div>`
    : '';

  // Copy-code badge — patrón idéntico al Backlog principal (AC TKT-B2a AC2)
  const copyCodeHtml = `<span class="bitem-subline-code" data-action="copy-code" data-code="${esc(code)}" data-idx="-1" title="Click para copiar ID">${esc(code)}</span>`;

  // TKT-B (REQ CAEL-0722-01, ref_id CAEL-0722-06): botón "Copiar ítem" — copia el bloque
  // completo del ítem (mismo formato que _PP-incidents.md §Ítems) sin exportar el archivo
  // entero. data-qi-action propio, distinto de copy-code (que solo copia el código).
  const copyItemHtml = `<button type="button" class="qinc-item-copy-btn" data-qi-action="qi-copy-item" data-code="${esc(code)}" title="Copiar ítem completo" aria-label="Copiar contenido completo de ${esc(code)}">
    <i class="ti ti-copy" aria-hidden="true"></i> Copiar ítem
  </button>`;

  // TKT-A (REQ CAEL-0722-01, ref_id CAEL-0722-05): línea meta secundaria — origin_module +
  // role/next_role, con fallback "sin asignar" cuando ambos están ausentes. Clickeable,
  // mismo guard que .qinc-item-header (if (code) import(...) en locus-incidents-render.js) —
  // sin code, la línea no lleva data-qi-action ni atributos de interactividad.
  const originModuleVal = incOriginModule(item);
  const roleVal = item.next_role || item.role || '';
  const metaSecondaryInteractive = code
    ? ` data-qi-action="qi-open-panel" role="button" tabindex="0" aria-label="Abrir detalle de ${esc(code)}"`
    : '';
  const metaSecondaryHtml = `
  <div class="qinc-item-meta-secondary"${metaSecondaryInteractive}>
    <span><i class="ti ti-cube qinc-item-meta-secondary-icon" aria-hidden="true"></i>${esc(originModuleVal || 'sin asignar')}</span>
    <span><i class="ti ti-user qinc-item-meta-secondary-icon" aria-hidden="true"></i>${esc(roleVal || 'sin asignar')}</span>
  </div>`;

  return `
<div class="qinc-item ${slaClass}" data-code="${esc(code)}" data-type="${esc(type)}">
  <div class="qinc-item-header" data-qi-action="qi-open-panel" role="button" tabindex="0" aria-label="Abrir detalle de ${esc(code)}">
    <span class="qinc-type-badge qinc-type-badge--${type.toLowerCase()}" title="${esc(typeLabel)}">${esc(type)}</span>
    ${copyCodeHtml}
    <span class="qinc-item-title">${esc(item.title || '(sin título)')}</span>
    ${copyItemHtml}
    ${slaCountdownHtml}
  </div>
  <div class="qinc-item-meta">
    ${incStatusBadge}
    ${slaPrioBadge}
  </div>
  ${metaSecondaryHtml}
  ${comportamientoHtml}
</div>`.trim();
}
