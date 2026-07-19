// [PP] mod:2 · autor:Rune · 2026-07-18 UTC-6
// CHG-CAEL-0718-15: agregado getSaveLockAgeMs() — edad en ms del lock de saveBacklog en
// vuelo, para distinguir transitorio de huérfano en el log de _loadFromSupabase() (ver
// INC-ref:CAEL-0718-14). Sin cambio de comportamiento en withSaveLock/isSaveInFlight/
// getSaveInFlightCount — mismo contrato, solo se agrega un timestamp de acompañamiento.
// TKT-202607-082 (REQ-202607-018): módulo de estado de sync/realtime — máquina de estados
// que reemplaza las 3 variables globales sueltas de locus-storage.js (_realtimeLastTs,
// _realtimeSubscribedFor, _saveBacklogInFlightCount). Ningún consumidor externo lee o
// escribe estado directo — toda interacción pasa por las funciones exportadas de este
// módulo (AC1 del TKT — ver locus-storage.js contract_detail en CHECKPOINT de entrega).
//
// Inventario de puntos de contacto verificado por grep sobre locus-storage.js (mod:106,
// 2026-07-09) — AC1. Ningún punto adicional detectado fuera de los ya identificados en el
// TKT:
//   _saveFlush()                                                    L879-931
//   _saveSessions()                                                 L1087-1098
//   saveBacklog()                                                   L1489-1569
//   saveHistoricoItems()                                            L1761-1819
//   _subscribeRealtime() / _handleRemoteChange() / _handleChannelStatus()  L1980-2103
//   _loadFromSupabase()                                             L2328-2450
//
// AC6: el inventario reveló 4 funciones (_saveFlush, _saveSessions, saveBacklog,
// saveHistoricoItems) que registran el timestamp de eco ANTES de un await — mismo patrón
// repetido para cerrar la misma race condition (Realtime notificando el cambio propio
// antes de que el guard tuviera valor). No es un caso aislado — por eso markEchoPending()/
// commitEcho()/clearEcho() modelan ese timing como parte explícita del contrato de este
// eje, en vez de exponer un setter libre que cada caller usa a su manera.

// ---------------------------------------------------------------------------
// Estado interno — inaccesible fuera de este módulo (AC4)
// ---------------------------------------------------------------------------

let _echoTs = null;          // equivalente a _realtimeLastTs
let _subscribedFor = null;   // equivalente a _realtimeSubscribedFor
let _saveInFlight = 0;       // equivalente a _saveBacklogInFlightCount
let _saveLockTakenAt = null; // CHG-CAEL-0718-15: timestamp de la primera adquisición del
                              // lock desde que el contador estaba en 0 — permite distinguir
                              // un save transitorio de uno huérfano sin depender de reportes
                              // manuales de timing (ver INC-ref:CAEL-0718-14)

// ---------------------------------------------------------------------------
// Estados nombrados — AC2
// ---------------------------------------------------------------------------

export const EchoState = Object.freeze({ IDLE: 'idle', PENDING: 'pending' });
export const SubscriptionState = Object.freeze({ IDLE: 'idle', ACTIVE: 'active' });
export const SaveState = Object.freeze({ IDLE: 'idle', IN_FLIGHT: 'in_flight' });

// ---------------------------------------------------------------------------
// Eje 1 — Eco propio (echo de Realtime originado por este mismo cliente)
// ---------------------------------------------------------------------------

/**
 * Registra el timestamp de eco ANTES del await de red — mismo timing que _saveFlush,
 * _saveSessions, saveBacklog y saveHistoricoItems ya aplicaban de forma independiente
 * (AC6). `ts` lo calcula el caller (ISO string o epoch ms según la tabla destino) — este
 * módulo no impone formato, solo el contrato de timing de la transición.
 * AC3: rechaza la transición si no recibe timestamp — no aplica un valor vacío en silencio.
 */
export function markEchoPending(ts) {
  if (ts == null) {
    console.error('[locus-sync-state] markEchoPending: ts requerido — transición rechazada.');
    return false;
  }
  _echoTs = ts;
  return true;
}

/**
 * Confirma el eco tras un upsert exitoso. No muta estado adicional — el valor ya
 * registrado por markEchoPending() es el vigente hasta que _handleRemoteChange lo
 * consuma por comparación. Existe como función explícita para que el contrato sea
 * simétrico: toda escritura (markEchoPending) tiene un cierre explícito, exitoso
 * (commitEcho) o fallido (clearEcho) — nunca queda ambiguo cuál de los dos ocurrió.
 */
export function commitEcho() {
  return true;
}

/** Limpia el eco cuando el upsert falla — equivalente al reset en los catch originales. */
export function clearEcho() {
  _echoTs = null;
  return true;
}

/** Getter de solo lectura (AC4) — valor crudo, para comparación directa en el guard de Realtime. */
export function getEchoTs() {
  return _echoTs;
}

/** Getter de solo lectura (AC4) — estado nombrado del eje. */
export function getEchoState() {
  return _echoTs != null ? EchoState.PENDING : EchoState.IDLE;
}

// ---------------------------------------------------------------------------
// Eje 2 — Suscripción activa por canal
// ---------------------------------------------------------------------------

/**
 * AC3: valida la transición antes de aplicarla. Replica el guard original de
 * _subscribeRealtime() — rechaza suscribir un usuario distinto mientras ya hay una
 * suscripción activa para otro usuario. Ese caso debe pasar primero por unsubscribe(),
 * igual que el fix de _handleChannelStatus() resetea a null antes de permitir reconexión.
 */
export function subscribe(userId) {
  if (userId == null) {
    console.error('[locus-sync-state] subscribe: userId requerido — transición rechazada.');
    return false;
  }
  if (_subscribedFor != null && _subscribedFor !== userId) {
    console.error(
      `[locus-sync-state] subscribe: ya suscrito a ${_subscribedFor} — llamar unsubscribe() antes de suscribir a ${userId}.`
    );
    return false;
  }
  _subscribedFor = userId;
  return true;
}

export function unsubscribe() {
  _subscribedFor = null;
  return true;
}

/**
 * Idempotencia: equivalente directo al guard original
 * `_realtimeChannels.length > 0 && _realtimeSubscribedFor === user.id`. El caller sigue
 * siendo responsable de verificar _realtimeChannels.length — ese estado no migra a este
 * módulo porque no es una de las 3 variables en scope de este TKT (ver `no_incluye`).
 */
export function isSubscribedFor(userId) {
  return _subscribedFor === userId;
}

/** Getter de solo lectura (AC4) — valor crudo. */
export function getSubscribedFor() {
  return _subscribedFor;
}

/** Getter de solo lectura (AC4) — estado nombrado del eje. */
export function getSubscriptionState() {
  return _subscribedFor != null ? SubscriptionState.ACTIVE : SubscriptionState.IDLE;
}

// ---------------------------------------------------------------------------
// Eje 3 — Operación de guardado en curso
// ---------------------------------------------------------------------------

/**
 * AC5: el contador nunca queda huérfano en un path de error. A diferencia de los ejes 1
 * y 2, esta transición envuelve la operación async completa del caller — el incremento
 * y el decremento viven en la misma función, con el decremento garantizado por un
 * `finally` interno de este módulo. Si `fn` lanza una excepción antes de completarse,
 * el finally corre igual: el contador nunca queda en un valor mayor a las operaciones
 * realmente en vuelo, sin que el caller necesite su propio try/finally para este eje.
 *
 * Uso esperado en TKT2 (migración de call sites):
 *   await syncState.withSaveLock(async () => { ...cuerpo actual de saveBacklog()... });
 */
export async function withSaveLock(fn) {
  // CHG-CAEL-0718-15: solo se re-arma el timestamp cuando el contador parte de 0 — si hay
  // saves concurrentes superpuestos, la edad reportada es la del primero en tomar el lock,
  // no la de cada adquisición individual (mismo criterio que el propio contador, que mide
  // "hay al menos uno en vuelo", no cada operación por separado).
  if (_saveInFlight === 0) _saveLockTakenAt = Date.now();
  _saveInFlight++;
  try {
    return await fn();
  } finally {
    _saveInFlight = Math.max(0, _saveInFlight - 1);
    if (_saveInFlight === 0) _saveLockTakenAt = null;
  }
}

/**
 * CHG-CAEL-0718-15: edad en ms del lock actualmente en vuelo — null si no hay ninguno.
 * Existe para que el log de _loadFromSupabase() distinga un save transitorio (unos pocos
 * cientos de ms, normal) de uno huérfano (por encima de _SAVE_UPSERT_TIMEOUT_MS sin liberar,
 * señal real de bug) sin depender de que alguien esté mirando la consola en el momento exacto.
 */
export function getSaveLockAgeMs() {
  return _saveLockTakenAt != null ? Date.now() - _saveLockTakenAt : null;
}

/** Getter de solo lectura (AC4) — valor crudo, mismo contrato booleano que el guard original. */
export function isSaveInFlight() {
  return _saveInFlight > 0;
}

/** Getter de solo lectura (AC4) — valor crudo del contador. */
export function getSaveInFlightCount() {
  return _saveInFlight;
}

/** Getter de solo lectura (AC4) — estado nombrado del eje. */
export function getSaveState() {
  return _saveInFlight > 0 ? SaveState.IN_FLIGHT : SaveState.IDLE;
}
