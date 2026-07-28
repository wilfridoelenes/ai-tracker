// [PP] mod:9 · autor:Rune · 2026-07-27 UTC-6
// TKT-202607-164 (parent REQ-202607-053, depends_on TKT-202607-161): gap de integración
// detectado por Finn en sesión de cierre del REQ — locus-incidents.css (TKT-202607-160, Nova)
// ya declaraba las reglas :hover/is-copied de .qinc-item-code-chip contra un nodo hijo
// .qinc-item-code-chip-icon que ningún TKT insertaba en el markup (ver comentario mod:1 de
// locus-incidents.css y el fix mod:8 de este mismo archivo — el ícono quedó fuera de scope
// de ambos TKTs). AC1: copyCodeHtml agrega <i class="ti ti-copy qinc-item-code-chip-icon">
// como primer hijo del chip, antes del texto del código — mismo patrón ya usado por
// copyItemHtml (ti-copy) en este archivo. El swap ti-copy↔ti-check de AC2 se resuelve en
// locus-incidents-render.js (mod:20) — este archivo solo declara el nodo base.
// [PP] mod:8 · autor:Rune · 2026-07-27 UTC-6
// TKT-202607-161 — fix Bug mayor (QA bloqueado por Finn, AC1 no cumplido en mod:7): el mod
// anterior agregaba qinc-item-code-chip "junto a" bitem-subline-code sin fusionar con
// .qinc-type-badge — AC1 exige un único elemento reemplazando ambos. Corregido: se retira el
// <span class="qinc-type-badge"> del header de buildQIncItem() (ver return) y copyCodeHtml
// absorbe el modificador de tipo --inc/--prb/--chg que locus-incidents.css ya declaraba desde
// TKT-202607-160 (Nova) sin ningún caller que lo aplicara — CSS dejó de estar muerto. El
// código (INC-XXXXXX-NNN) ya lleva el prefijo de tipo como texto, por lo que la etiqueta
// separada del badge quedaba redundante una vez fusionado; typeLabel se conserva en el
// atributo title del chip. copy-code (data-action) y sus AC2/AC3/AC4 (mod:7,
// locus-incidents-render.js) no cambian — mismo nodo, mismo dataset, mismo handler.
// Impacto lateral: .qinc-type-badge (CSS) puede quedar sin consumidor en el módulo Q-INC —
// Rune no audita ni edita archivos .css (CSS Purity). Señalado a Nova para verificar si la
// clase es huérfana en este scope antes de considerarla deuda.
// [PP] mod:7 · autor:Rune · 2026-07-27 UTC-6
// TKT-202607-161 (parent REQ-202607-053, depends_on TKT-202607-160): buildQIncItem() —
// copyCodeHtml agrega la clase qinc-item-code-chip junto a bitem-subline-code, sin
// reemplazarla — bitem-subline-code es el patrón compartido con el Backlog principal (ver
// comentario original más abajo, "patrón idéntico al Backlog principal"); retirarla habría
// dejado sin estilo base a los chips de código de REQ/TKT que reusan esa misma clase fuera
// de Q-INC. AC1: sin la clase nueva, los estados hover/active/focus-visible que Nova
// declaró en TKT-202607-160 (locus-incidents.css) no tenían ningún nodo real que matchear
// en el DOM — el selector .qinc-item-code-chip nunca aplicaba. AC2/AC3 (locus-incidents-render.js,
// mismo REQ): la rama de click de copy-code no distinguía éxito de fallo de clipboard —
// is-copied se agregaba de forma síncrona sin esperar la Promise, y un fallo quedaba
// silenciado sin is-copy-error. Corregido para gatear ambas clases contra el resultado real
// de navigator.clipboard.writeText(), mismo patrón ya usado por qi-copy-item en ese archivo.
// AC4 — impacto lateral: grep contra todo el módulo Q-INC confirma una única instancia de
// data-action="copy-code" (locus-incidents-render.js L612) — sin otro caller que actualizar.
// bitem-subline-code queda fuera de scope — no se audita ni se toca, pertenece a
// locus-backlog-item.js/locus-backlog.css.

// [PP] mod:6 · autor:Rune · 2026-07-27 UTC-6
// INC-202607-056 (triggered_by INC-202607-046): _VALID_INCIDENT_TRANSITIONS no declaraba
// transiciones salientes desde 'escalated_to_prb' ni 'escalated_to_chg' — quedaron marcadas
// como terminales por scope explícito de TKT-PARSER-2a ("fuera de scope"), pero __BR-Core §6
// sí declara ambas como transiciones válidas: 'escalated_to_prb → closed' (Finn cierra el INC
// cuando el PRB derivado llega a closed) y 'escalated_to_chg → closed' (Finn cierra el INC
// cuando el CHG derivado llega a done, o cuando el fix llegó por vía alterna y el CHG fue
// descartado — ver INC-202607-046). Sin estas dos entradas, validateIncidentTransitions()
// rechazaba el par con 'transición ITIL inválida' vía _blogLog('patch-incidentstatus-invalido', ...)
// — rechazo silencioso, sin alerta visible al founder, indistinguible de un patch no aplicado
// (síntoma reportado: type:patch pegado en Locus, incident_status no cambia en el export
// siguiente). Fix: agregadas ambas entradas con destino único 'closed', consistente con
// __BR-Core §6 (ninguna otra transición saliente declarada desde esos dos estados).
// INC-202607-038 (reapertura): buildQIncItem() calculaba slaClass y el texto/clase VENCIDO
// del countdown solo contra slaDeadline vs Date.now(), sin gate de estado terminal — un INC
// closed (o CHG done) conserva su slaDeadline histórico y siempre salía "vencido". Agregado
// isTerminal (incStatus === 'closed' || item.status === 'done') gateando slaClass y
// slaCountdownHtml completo, no solo el modificador visual. El cierre previo de este INC se
// declaró sin verificar el archivo real — este mod corrige el código y la verificación.
// [PP] mod:4 · autor:Rune · 2026-07-24 UTC-6
// INC-202607-018 (triggered_by INC-202607-013): _VALID_PRB_TRANSITIONS no declaraba
// 'root_cause_confirmed' (BR-Core §6, ex-KE fusionado infra_version 51) ni como destino de
// in_progress ni como origen hacia resolved — un patch con esos pares se rechazaba en
// silencio, mismo patrón de fallo que INC-202607-004 documentó para INC. Agregado
// in_progress→{resolved, root_cause_confirmed} y root_cause_confirmed→resolved. Sin cambio
// de firma ni de comportamiento para INC — solo afecta _VALID_PRB_TRANSITIONS.
// [PP] mod:3 · autor:Rune · 2026-07-24 UTC-6
// TKT (REQ CAEL-0724-01): retiro de KE residual — fusionado a PRB.root_cause_confirmed
// (infra_version 51). Import de _VALID_KE_STATUS retirado. _VALID_KE_TRANSITIONS retirada
// completa. validateIncidentTransitions() sin ramas itilType==='KE' — solo PRB/default INC.
// buildIncidentItem() sin 'KE' en la lista de tipos que setean incidentStatus. Sin cambio de
// comportamiento para itilType 'INC'/'PRB' — verificado, mismos resultados exactos.
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
import { _VALID_INCIDENT_STATUS, _VALID_PRB_STATUS } from './locus-session-parse.js';

// TKT-PARSER-2a (REQ-[pendiente-ID]): tabla de pares válidos de transición ITIL.
// Clave: incidentStatus origen. Valor: Set de incidentStatus destino permitidos desde ese origen.
// Distinto de _VALID_INCIDENT_STATUS (locus-session-parse.js) — ese set valida pertenencia
// del valor al vocabulario ITIL; esta tabla valida que el PAR origen→destino sea una
// transición real del ciclo de vida (BR-Core §6), no solo que ambos valores existan.
const _VALID_INCIDENT_TRANSITIONS = {
  // INC-[pendiente-ID] (triggered_by INC-202607-004 · fix de causa raíz real, sesión 2026-07-24):
  // tabla desactualizada — reflejaba el ciclo ITIL previo a infra_version 52/53 (__BR-Core §6),
  // con 'assigned'/'in_progress' como estados intermedios ya fusionados/eliminados. 'detected'
  // solo permitía transicionar a 'assigned' (estado inexistente en el schema vigente), por lo
  // que todo patch detected→resolved se rechazaba en silencio vía _blogLog sin aparecer como
  // error en el export — causa raíz real del fallo de cierre de INC-202607-004 e INC-202607-003.
  detected: new Set(['resolved', 'escalated_to_prb', 'escalated_to_chg']),
  resolved: new Set(['closed']),
  // INC-202607-056: agregadas — __BR-Core §6 declara ambas transiciones ("El PRB/CHG derivado
  // llega a closed/done — Finn cierra el INC original en la misma sesión de cierre"). Antes de
  // este fix, un patch escalated_to_prb→closed o escalated_to_chg→closed se rechazaba en
  // silencio como "transición ITIL inválida" pese a estar autorizado por BR.
  escalated_to_prb: new Set(['closed']),
  escalated_to_chg: new Set(['closed'])
  // closed, descartado: sin transiciones salientes declaradas — estados terminales del ciclo
  // dentro de este merge. Reabrir un INC closed no es un caso cubierto por este AC — fuera de
  // scope de TKT-PARSER-2a.
};

// TKT1 (REQ CAEL-01): tabla de transiciones propia de PRB — BR-Core §6.
// PRB no tiene status 'assigned' (a diferencia de INC) — nace directamente en 'detected'.
// INC-202607-018 (triggered_by INC-202607-013): 'root_cause_confirmed' agregado — estado
// intermedio del ciclo de PRB (ex-KE, fusionado infra_version 51) ausente desde la creación
// de esta tabla. in_progress ahora permite ambos destinos declarados en BR-Core §6
// (resolved directo, o root_cause_confirmed cuando la causa raíz está identificada sin fix
// disponible); root_cause_confirmed permite avanzar a resolved cuando el fix definitivo se
// implementa.
const _VALID_PRB_TRANSITIONS = {
  detected:               new Set(['in_progress']),
  in_progress:            new Set(['resolved', 'root_cause_confirmed']),
  root_cause_confirmed:   new Set(['resolved']),
  resolved:               new Set(['closed'])
  // closed, descartado: estados terminales — sin transiciones salientes declaradas, mismo criterio
  // que _VALID_INCIDENT_TRANSITIONS para closed. Fuera de scope de TKT1.
};

// TKT (REQ CAEL-0724-01): _VALID_KE_TRANSITIONS retirada — KE fusionado a PRB.root_cause_confirmed
// (infra_version 51), type:'KE' ya no alcanza este archivo desde que _GEN2_TYPES lo excluye
// (TKT-202607-067, locus-backlog-core.js mod:131) — tabla era código muerto.

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
    : _VALID_INCIDENT_STATUS;
  const _transitions = itilType === 'PRB' ? _VALID_PRB_TRANSITIONS
    : _VALID_INCIDENT_TRANSITIONS;
  if (!_statusSet.has(oldIncidentStatus) || !_statusSet.has(newIncidentStatus)) {
    // Valor fuera del vocabulario ITIL del tipo — ya debió rechazarse en _buildItilItem (locus-session-parse.js).
    // Defensivo: no es una transición ITIL inválida en sí, es un valor inválido — no bloquear aquí.
    return { valid: true };
  }
  // INC-[pendiente-ID] (gap detectado en auditoría Q-INC): 'descartado' es destino válido desde
  // CUALQUIER estado no-terminal para INC/PRB — BR-Core §6 lo declara sin restricción de
  // origen ("Cualquier status → descartado | Con justificación explícita en el CHECKPOINT").
  // Antes de este fix, INC/PRB la rechazaban con "transición ITIL inválida" pese a estar
  // autorizada por BR. Chequeo centralizado aquí (no replicado en las tablas por-tipo) para
  // que la regla transversal viva en un solo lugar — mismo criterio de causa raíz que ya motivó
  // extraer _itilStatusSet/_itilStatusList en locus-session-parse.js. 'closed' NO se excluye como
  // origen — BR-Core no declara excepción para closed, la regla es literal "cualquier status".
  // discard_reason (obligatorio en items descartados, ver BR-Ecosystem §5) se valida en el punto
  // de ingesta del patch, no aquí — esta función solo valida el par de estados.
  // TKT (REQ CAEL-0724-01): condición `&& itilType !== 'KE'` retirada — KE fusionado a
  // PRB.root_cause_confirmed (infra_version 51), ya no existe itilType 'KE' que excluir.
  if (newIncidentStatus === 'descartado' && oldIncidentStatus !== 'descartado') {
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
    ...(['INC', 'PRB'].includes(_incomingType) ? { incidentStatus: item.incidentStatus || initialStatus } : {}),
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

  // INC-202607-038 (triggered_by INC-202607-038 — reapertura tras cierre sin verificación
  // real del fix): un ítem terminal conserva su slaDeadline histórico — sin este chequeo,
  // buildQIncItem() lo evalúa siempre contra Date.now() y lo pinta como vencido/en riesgo
  // aunque incident_status ya sea closed (INC/PRB). CHG usa status (no incident_status,
  // BR-Ecosystem §4b) — done es su terminal equivalente. Mismo criterio de estado terminal
  // que _isQIncTerminal() en locus-incidents-render.js, sin importarlo aquí (ese módulo
  // importa buildQIncItem de este archivo — importar en la dirección contraria crea ciclo ESM).
  const isTerminal = incStatus === 'closed' || item.status === 'done';

  // Clases SLA — mutuamente excluyentes (AC TKT-B2a AC4)
  // Fix inline (TKT1, triggered_by [tmp:tkt-countdown-sla]): la rama --sla-riesgo no
  // exigía slaPrio === 'high' — cualquier prioridad dentro de la ventana de 6h recibía
  // la clase a nivel de card. Corregido para exigir 'high', igual que ya exigía la rama
  // vencido. Calculado antes del countdown porque TKT1 lo consume abajo.
  let slaClass = '';
  if (slaDeadline && !slaPaused && !isTerminal) {
    if (slaPrio === 'high' && slaDeadline < Date.now()) {
      slaClass = 'qinc-item--sla-vencido';
    } else if (slaPrio === 'high' && slaDeadline >= Date.now() && slaDeadline < Date.now() + SLA_RIESGO_WINDOW_MS) {
      slaClass = 'qinc-item--sla-riesgo';
    }
  }

  // Countdown slaDeadline — solo si presente y no terminal. Un ítem closed/done no tiene
  // countdown que mostrar — su SLA dejó de correr en el momento del cierre, no en Date.now().
  let slaCountdownHtml = '';
  if (slaDeadline && !isTerminal) {
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

  // TKT-202607-161 AC1 (fix Bug mayor, QA bloqueado por Finn — sesión 2026-07-27): antes
  // .qinc-type-badge y el chip de código eran dos elementos hermanos ("junto a", no
  // fusionados) — AC1 exige un único elemento reemplazando ambos. El código (INC-XXXXXX-NNN)
  // ya contiene el prefijo de tipo como texto — la etiqueta separada del badge era redundante
  // una vez fusionado. Se retira el <span class="qinc-type-badge"> del header (ver return más
  // abajo) y este chip absorbe el modificador de tipo --inc/--prb/--chg que locus-incidents.css
  // ya declaraba (TKT-202607-160, Nova) pero que ningún caller aplicaba — CSS dejó de estar
  // muerto. title conserva typeLabel (antes solo en el badge) + el hint de copiar.
  const copyCodeHtml = `<span class="bitem-subline-code qinc-item-code-chip qinc-item-code-chip--${esc(type.toLowerCase())}" data-action="copy-code" data-code="${esc(code)}" data-idx="-1" title="${esc(typeLabel)} · Click para copiar ID"><i class="ti ti-copy qinc-item-code-chip-icon" aria-hidden="true"></i>${esc(code)}</span>`;

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
