// [PP] mod:104 · autor:Rune · 2026-07-08 UTC-6
// INC-[pendiente-ID]: _subscribeRealtime() no reconectaba tras CHANNEL_ERROR/CLOSED/TIMED_OUT
// — el guard de idempotencia bloqueaba la reconexión porque _realtimeChannels seguía con
// canales muertos y _realtimeSubscribedFor sin resetear. Fix: _handleChannelStatus() limpia
// el canal caído del tracking y resetea _realtimeSubscribedFor a null. Ver detalle en
// _subscribeRealtime().
// INC-[pendiente-ID] (deprecación Sesiones/Pulso, founder confirmó): eliminados wiring de
// _showArranquePanel (import + setTimeout en _renderAfterAuth) y los 4 sitios de dispatch
// 'shell:mark-pulso-dirty'/'shell:render-pulso-dot' (post-debounce, save() no-auth, save()
// offline x2, _renderAfterAuth) — sin listener desde que se borró locus-pulso.js. Eliminado
// también el IIFE de init del dot Pulso desde caché (LOCUS_KEYS.PULSO) y la key PULSO del
// registro LOCUS_KEYS — sin otro consumidor en el proyecto (verificado por grep antes de
// borrar, a diferencia de TKT-202607-042). Módulo crítico — activar verificación de
// regresiones en Finn.
// TKT5 (REQ-202607-015): deleteIncidentRows(codes) — elimina filas de tracker_incidents por
//   code. Invocada por _scmExecuteClose (locus-backlog-sprints.js) solo tras saveHistoricoItems()
//   exitoso para el batch que incluye esos incidentes — orden de operaciones write-antes-que-
//   delete. Sin cambio de firma en saveHistoricoItems() ni en ningún otro export existente.
//   Módulo crítico — activar verificación de regresiones en Finn.
// TKT-202607-044 (REQ-202607-015): INCIDENTS conectado a tracker_incidents — saveBacklog()
// upsert onConflict:code (independiente de ITEMS, sin reintento en caso de fallo) +
// _loadFromSupabase() consulta tracker_incidents y puebla INCIDENTS (merge-por-fila, mismo
// patrón anti-race que ITEMS). _getIncidents inyectado via _initApp(opts.getIncidents).
// Módulo crítico — activar verificación de regresiones en Finn.
// INC-[pendiente-ID]: fix _itemsRef en null cuando ITEMS local está vacío (length 0) —
//   el ternario producía null en vez de la referencia al array vacío real, lo que hacía
//   shouldEvaluate=false y saltaba el bloque de merge con Supabase sin importar cuántas
//   filas remotas válidas hubiera. _itemsRef ahora siempre es la referencia real de _getItems().
//   Módulo crítico — activar verificación de regresiones en Finn. Sin cambio de firma.
// TKT1 (limpieza post-rename): lista de módulos consumidores en L1010 actualizada — locus-backlog-archive → locus-backlog-historico. Sin cambio de código.
// TKT2 + TKT5 (REQ-contract-rename): campo contract → contract_detail en los tres puntos de
//   mapeo hacia/desde Supabase — _toItemRow() (outgoing, TKT2), rehidratación desde tracker_items
//   (incoming, TKT2), saveHistoricoItems() (mapeo paralelo, TKT5 — excepción de continuidad,
//   sin él la persistencia de históricos seguía escribiendo null). contract_update (columna
//   distinta) sin cambio en los tres sitios — fuera de scope, ya coincide con nombre canónico.
//   DDL requerido: sí — ALTER TABLE tracker_items RENAME COLUMN contract TO contract_detail;
//   No ejecutado desde el TKT — deuda registrada con escalate_to: Vera. Módulo crítico —
//   activar verificación de regresiones en Finn.
// locus-storage.js
// Última actualización: TKT1 (REQ-sprints-migration) — _allSprintsCache cross-proyecto reemplaza
// _sprintsCache por-proyecto-activo. getAllProjectsSprints() nueva, getActiveSprints() deriva del
// proyecto activo sin cambio de firma. _loadSprintsFromSupabase(projId) → _loadAllProjectsSprintsFromSupabase()
// (sin projId, una sola query). _verifyAndCleanSprintsBlob eliminada — proj.sprints ya no se
// inicializa, migra ni lee en _applyStateData().
// corregidas a las claves reales que los módulos consumidores ya usan localmente (la purga de
// cuota crítica ahora libera datos reales en vez de claves fantasma) · OFFLINE_QUEUE_KEY
// (entrada duplicada de OFFLINE_QUEUE, sin call sites) eliminada de LOCUS_KEYS.
// Módulo de persistencia, auth y sync — extraído de ai-tracker-checkpoint.js
// Carga ANTES que ai-tracker-checkpoint.js en index.html



// T-202606-056: imports cíclicos eliminados — reemplazados por event dispatch o acceso directo a state
// Patrones aplicados:
//   (a) event dispatch via _dispatch(event, detail?) — locus-backlog-render, locus-notifications,
//       locus-radar, locus-sesiones-stats, locus-sesiones, locus-toast, locus-ui-shell
//   acceso directo a state.projects — locus-sprint-project (getProjectById)

function _dispatch(event, detail) {
  window.dispatchEvent(detail !== undefined
    ? new CustomEvent(event, { detail })
    : new CustomEvent(event));
}

function showToast(type, msg, body, duration) {
  _dispatch('shell:toast', { type, msg, body, duration });
}

// ── Lazy references para romper ciclos storage ↔ backlog-generator y storage ↔ backlog-core ──
// exportBacklogMd vive en locus-backlog-generator.js — ciclo ESM: backlog-generator importa storage.
// _getItems vive en locus-backlog-core.js — mismo ciclo.
// T2/T-202606-046: declaradas como let para que _initApp(opts) inyecte referencias directas
// desde main.js. Fallbacks window.* eliminados en T-202606-049.
// _getActiveProjectFilter: movida a export function en este módulo (T-202606-166) — sin lazy ref.
let exportBacklogMd = function() {};
// T-202606-003 / T-202606-046: getItems, _localStorageUsageRatio, _migrateItemTypes y
// _purgeStaleBacklogCache inyectados via _initApp — ciclo storage ↔ backlog-core eliminado.
// Fallback seguro: _getItems devuelve [] (sin acceso a window); las demás son no-ops.
let _getItems = function() {
  console.warn('[AI Tracker] _getItems: getItems no disponible — usando fallback []');
  return [];
};
// TKT-202607-044 (REQ-202607-015): mismo patrón lazy ref que _getItems — rompe el ciclo
// storage ↔ backlog-core para el array INCIDENTS (separado de ITEMS desde TKT-202607-005).
let _getIncidents = function() {
  console.warn('[AI Tracker] _getIncidents: getIncidents no disponible — usando fallback []');
  return [];
};
let _localStorageUsageRatio = function() { return 0; };
let _migrateItemTypes = function() {};
let _purgeStaleBacklogCache = function() { return 0; };
// T-202606-006 T3: renderSprintTab inyectado via _initApp — ciclo storage ↔ sprint eliminado.
let _renderSprintTabFn = function() {};
// No contiene lógica de UI, render, toast ni timer de sesión.

// ── VARIABLES DE MÓDULO ───────────────────────────────────────────────────────

// R-202605-002: claves localStorage centralizadas — fuente canónica para todos los módulos
export const LOCUS_KEYS = {
  STATE:            'locus-state-v1',
  OFFLINE_QUEUE:    'locus-offline-queue',
  CHANGELOG:        'ai-tracker-changelog',
  PLAN_PREFIX:      'locus-plan-',
  // REQ-PERSIST-OPT TKT1: respaldo local de sesiones de Worker por proyecto — clave nueva,
  // sin call sites previos a este TKT. Se concatena con proj.id.
  SESSIONS_PREFIX:  'locus-sessions-',
  NOTIF_HISTORY:    'ai-tracker-notifs-history',
  LOG_FILTERS:      'log-filter-state',
  DRAFT_PREFIX:     'locus-draft-',
  THEME:            'theme',
  TMP_ID_MAP:       'tmp-id-map',
  SHORTCUTS:        'user-shortcuts',
  USER_PREFS_TS:    'user-prefs-ts',
  TPL_TRIGGER:      'locus-tpl-trigger',
  CTX_DOCS_PREFIX:  'tracker-ctx-docs',
  HM_DOCS_PREFIX:   'tracker-hm-docs',
  ONBOARDING_SEEN:  'onboarding-seen',
  DRAFT_KEY_PREFIX: 'draft-',
  // T-202606-032: índice de DOC-UPDATEs por sprint — persiste en state.projects[i].docUpdateIndex
  DOC_UPDATE_INDEX: 'docUpdateIndex',
};

// R-202605-002: strings canónicos de proyecto — fuente única de verdad
export const CANONICAL_PROJECTS = ['Obsidian Labs', 'Alisto', 'Content Manager', 'Locus'];

// T-202606-009: infra_version sync — parsear línea completa BR y alimentar generador.
// Reemplaza getInfraVersionActive/setInfraVersionActive (eliminados).
// Getter/setter canónicos: getInfraVersionData() · setInfraVersionData(obj).
// Fuente de verdad: state.infraVersionData → persistido via save().
// Referencia: __OB-Strategy §5.

// Parsea la línea completa de encabezado BR y extrae los 5 campos.
// Retorna objeto { infraVersion, brCore, brEcosystem, brExecution, obStrategy } o null si el patrón no coincide.
export function _parseInfraLine(str) {
  if (!str || !str.includes('infra_version:')) return null;
  const numMatch = str.match(/infra_version:\s*(\d+)/);
  const coreMatch = str.match(/BR-Core\s+v([\d.]+)/);
  const ecoMatch = str.match(/BR-Ecosystem\s+v([\d.]+)/);
  const execMatch = str.match(/BR-Execution\s+v([\d.]+)/);
  const obMatch = str.match(/OB-Strategy\s+v([\d.]+)/);
  if (!numMatch) return null;
  return {
    infraVersion: parseInt(numMatch[1], 10),
    brCore: coreMatch ? coreMatch[1] : null,
    brEcosystem: ecoMatch ? ecoMatch[1] : null,
    brExecution: execMatch ? execMatch[1] : null,
    obStrategy: obMatch ? obMatch[1] : null,
  };
}

let _infraVersionData = null;

export function getInfraVersionData() {
  return _infraVersionData;
}

export function setInfraVersionData(obj) {
  if (!obj || typeof obj.infraVersion !== 'number' || !Number.isFinite(obj.infraVersion) || obj.infraVersion <= 0) return false;
  _infraVersionData = obj;
  if (typeof state !== 'undefined') {
    state.infraVersionData = obj;
    // Limpiar campo legacy si existe
    if ('infraVersionActive' in state) delete state.infraVersionActive;
    save();
  }
  return true;
}

// R-202605-002: prefijos de proyecto — fuente única de verdad
export const _PREFIX_MAP = {
  'Obsidian Labs':   'OL',
  'Alisto':          'AS',
  'Content Manager': 'CM',
  'Locus':           'PP',
};

// R-202605-002: versión efectiva — lee sprint cerrado más reciente con version_target
// Jerarquía: sprint cerrado más reciente con version_target > '' (sin fallback hardcodeado)
export function _effectiveVersion() {
  try {
    const sprints = getActiveSprints();
    const closed = sprints.filter(s => s.status === 'closed' && s.version_target && s.version_target.trim());
    if (closed.length) {
      closed.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
      return closed[0].version_target.trim();
    }
    return '';
  } catch(e) { return ''; }
}

// ── T-202605-482c: Supabase Auth — Google OAuth (founder único, multidispositivo) ──
const SUPABASE_URL  = (typeof window !== 'undefined') ? (window.__ENV?.SUPABASE_URL       || window.SUPABASE_URL)       : null;
const SUPABASE_KEY  = (typeof window !== 'undefined') ? (window.__ENV?.SUPABASE_ANON_KEY  || window.SUPABASE_ANON_KEY)  : null;

let _supabase           = null;   // cliente Supabase
var _supabaseUser       = null;   // sesión activa del founder — ESM-B: var para evitar TDZ
let _supabaseReady      = null;   // promesa: resuelve cuando onAuthStateChange dispara
let _realtimeChannels   = [];     // T-202606-002: canales Realtime — tracker_state, tracker_sessions
// INC-[pendiente-ID] (triggered_by hallazgo fuera de scope, cierre INC-202607-009): user_id
// para el cual _realtimeChannels está activo. Permite que _subscribeRealtime() sea idempotente
// ante llamadas repetidas del mismo usuario — ver comentario completo en _subscribeRealtime().
let _realtimeSubscribedFor = null;
let _realtimeLastTs     = null;   // timestamp del último update remoto procesado

// TKT1 · REQ-sessions-mutator: dirty-tracking de sesiones por proyecto — evita que _saveFlush()
// re-suba el array completo de proj.sessions en cada guardado. _mutateSessions() es el único
// punto que debe escribir en proj.sessions Y en estos mapas a la vez (ver invariant del mutador).
// {projectId: Set<sessionId>} — vacío o ausente para un proyecto = nada pendiente de subir.
// _dirtySyncBaseline registra qué proyectos ya tuvieron su primer upsert completo — sin esta
// marca, _saveSessions() no puede distinguir "proyecto sin cambios" de "proyecto nunca sincronizado".
// _dirtySessionRemovals (TKT2 · REQ-sessions-mutator): {projectId: Set<sessionId>} — ids que
// _saveSessions() debe borrar en Supabase. Separado de _dirtySessionIds porque un id removido
// ya no está en proj.sessions — no puede vivir en el mismo set que se resuelve contra el array.
let _dirtySessionIds  = {};
let _dirtySyncBaseline = new Set();
let _dirtySessionRemovals = {};

// _mutateSessions() — único punto de mutación de proj.sessions con dirty-tracking.
// op: 'add' (agrega payload al final) | 'remove' (filtra por payload = sessionId) |
//     'move' (payload = {toProj, sessionId} — reasigna proyecto sin DELETE, ver TKT3).
// Invariant: toda mutación de proj.sessions fuera de esta función no queda registrada como
// dirty — _saveSessions() la ignorará hasta el próximo full-resync. TKT1 migró el call site de
// creación (locus-session-save.js); TKT2 corrigió 'remove' (DELETE real) y migró
// confirmPurge() (locus-reports.js); TKT3 agrega 'move' y migra savePreviewProject()
// (locus-session-popup.js). Queda pendiente: deleteCurrentSession() (popup) y
// executeConfirm('clear') (locus-workers.js, borrado en bloque por aiId) — TKT4.
// 'remove' (TKT2): además de filtrar proj.sessions, encola el id en _dirtySessionRemovals —
// _saveSessions() emite DELETE real contra tracker_sessions por cada id encolado.
export function _mutateSessions(proj, op, payload) {
  if (!proj) return;
  if (!proj.sessions) proj.sessions = [];
  if (!_dirtySessionIds[proj.id]) _dirtySessionIds[proj.id] = new Set();
  if (!_dirtySessionRemovals[proj.id]) _dirtySessionRemovals[proj.id] = new Set();

  if (op === 'add') {
    proj.sessions.push(payload);
    _dirtySessionIds[proj.id].add(payload.id);
  } else if (op === 'remove') {
    proj.sessions = proj.sessions.filter(s => s.id !== payload);
    _dirtySessionRemovals[proj.id].add(payload);
  } else if (op === 'move') {
    // TKT3 · REQ-sessions-mutator: mover sesión entre proyectos — misma fila en Supabase
    // (onConflict user_id+session_id, verificado contra el mapa de verifyConstraintsSync():
    // tracker_sessions: ['user_id','session_id']). No dispara DELETE — solo reasigna
    // project_id vía upsert, marcando dirty en toProj. Nunca toca _dirtySessionRemovals
    // de proj (fromProj) — la fila no se borra, solo se reescribe.
    const { toProj, sessionId } = payload;
    if (!toProj) return;
    const idx = proj.sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return;
    const [sess] = proj.sessions.splice(idx, 1);
    if (!toProj.sessions) toProj.sessions = [];
    toProj.sessions.push(sess);
    if (!_dirtySessionIds[toProj.id]) _dirtySessionIds[toProj.id] = new Set();
    _dirtySessionIds[toProj.id].add(sessionId);
  }
}

// TKT1 · REQ-sprints-migration: cache cross-proyecto en módulo de sprints — fuente de verdad en
// runtime, poblado desde tracker_sprints en una sola query sin filtro project_id. Objeto plano
// {projectId: Sprint[]} — getAllProjectsSprints() lo retorna directamente, getActiveSprints()
// deriva el array del proyecto activo. _loadAllProjectsSprintsFromSupabase() lo popula al cargar.
// Fallback: si Supabase no está disponible, se lee por proyecto desde localStorage clave sprints-{projId}.
let _allSprintsCache = {};

if (SUPABASE_URL && SUPABASE_KEY && typeof supabase !== 'undefined') {
  try {
    // B-202605-504: Safari bloquea localStorage en redirects OAuth via ITP —
    // usa implicit flow en Safari, PKCE con localStorage en Chrome y resto.
    const _isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        storage: localStorage,
        flowType: _isSafari ? 'implicit' : 'pkce'
      }
    });

    _supabaseReady = new Promise(resolve => {
      _supabase.auth.onAuthStateChange((event, session) => {
        _supabaseUser = session ? session.user : null;
        if (_supabaseUser) {
          setSyncStatus('synced', '✓ ' + (_supabaseUser.user_metadata?.full_name || _supabaseUser.email || 'ok').split(' ')[0]);
          if (event === 'SIGNED_IN') {
            closeAuthModal();
            _loadFromSupabase();
            // (a) event dispatch — locus-sesiones.js escucha 'shell:mark-tracker-dirty' + 'shell:render-tracker'
            _dispatch('shell:mark-tracker-dirty'); _dispatch('shell:render-tracker');
            // T-202605-XXX: activar sync Realtime al iniciar sesión
            _subscribeRealtime();
          }
          // T-202605-XXX: si la sesión ya existía al cargar (INITIAL_SESSION), también suscribir
          if (event === 'INITIAL_SESSION') {
            _subscribeRealtime();
          }
        } else {
          setSyncStatus('local', '☁ conectar');
          // T-202605-XXX: limpiar canal al cerrar sesión
          _unsubscribeRealtime();
        }
        resolve(_supabaseUser);
        _refreshMigrationBtnVisibility();
      });
    });

    // B-202605-504: getSession explícito post-listener — cubre el caso donde INITIAL_SESSION
    // disparó antes de que el listener estuviera registrado (flujo PKCE post-redirect en Vercel).
    _supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !_supabaseUser) {
        // El listener no capturó la sesión — aplicar manualmente
        _supabaseUser = session.user;
        setSyncStatus('synced', '✓ ' + (_supabaseUser.user_metadata?.full_name || _supabaseUser.email || 'ok').split(' ')[0]);
        closeAuthModal();
        _loadFromSupabase();
        // (a) event dispatch — locus-sesiones.js escucha 'shell:mark-tracker-dirty' + 'shell:render-tracker'
        _dispatch('shell:mark-tracker-dirty'); _dispatch('shell:render-tracker');
        _subscribeRealtime();
        _refreshMigrationBtnVisibility();
      }
    });
  } catch(e) {
    console.warn('Supabase init error:', e);
    _supabaseReady = Promise.resolve(null);
  }
} else {
  _supabaseReady = Promise.resolve(null);
}

// ── SYNC STATUS UI ────────────────────────────────────────────────────────────
// T-202604-312: color semántico — verde/neutro cuando conectado, rojo solo en error real de sync
// Estados: synced → verde | syncing → acento neutro | local → neutro | offline → rojo
// Migrado desde ai-tracker-checkpoint.js — necesario antes del init de auth
export function setSyncStatus(status, label) {
  // T-202605-433: sync-pill eliminado — nuevos IDs en menú ⋯
  const dot = document.getElementById('sync-status-dot');
  const lbl = document.getElementById('sync-status-label');
  if (dot) dot.className = 'mm-icon sync-status-dot sync-status-dot--' + status;
  if (lbl) lbl.textContent = 'Sync: ' + label;
  // R-202604-060: mirror en global footer
  const gfSync = document.getElementById('gf-sync');
  if (gfSync) { gfSync.className = 'gf-sync gf-sync--' + status; gfSync.textContent = label; }
  // actualizar ítem de usuario en menú ⋯
  _updateUserMenuItem();
}

function _updateUserMenuItem() {
  const btn = document.getElementById('mm-btn-user');
  const nameEl = document.getElementById('mm-user-name');
  if (!btn) return;
  if (_supabaseUser) {
    const name = (_supabaseUser.user_metadata?.full_name || _supabaseUser.email || '').split(' ')[0];
    if (nameEl) nameEl.textContent = name;
    btn.classList.remove('is-hidden');
  } else {
    btn.classList.add('is-hidden');
  }
}

export function handleSyncPillClick() {
  if (!_supabaseUser) { openAuthModal(); }
}

// ── SHORTCUTS + USER PREFS ───────────────────────────────────────────────────
// T-202605-442: Atajos de teclado configurables — migrado desde ai-tracker-checkpoint.js
// _saveUserPrefs (más abajo) los necesita al serializar preferencias hacia Supabase
const _SHORTCUTS_KEY = LOCUS_KEYS.SHORTCUTS;
const _USER_PREFS_TS_KEY = LOCUS_KEYS.USER_PREFS_TS; // R-4: timestamp del último user-prefs aplicado desde Supabase

export function _shortcutsLoad(validIds) {
  try {
    const raw = localStorage.getItem(_SHORTCUTS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    if (!validIds || !Array.isArray(validIds) || validIds.length === 0) return map;
    // Filtrar claves huérfanas — claves no presentes en _SHORTCUT_DEFS
    const cleaned = {};
    let dirty = false;
    for (const key of Object.keys(map)) {
      if (validIds.includes(key)) {
        cleaned[key] = map[key];
      } else {
        dirty = true; // clave huérfana detectada
      }
    }
    // Persistir mapa limpio si se eliminó al menos una clave huérfana
    if (dirty) _shortcutsSave(cleaned);
    return cleaned;
  } catch(_) { return {}; }
}

export function _shortcutsSave(map) {
  localStorage.setItem(_SHORTCUTS_KEY, JSON.stringify(map));
  _saveUserPrefs(); // R-4: persistir en Supabase
}

// ── TMP ID MAP ────────────────────────────────────────────────────────────────
// Migrado desde ai-tracker-checkpoint.js — operación Supabase pura
function _loadTmpIdMap() {
  try {
    const raw = localStorage.getItem(LOCUS_KEYS.TMP_ID_MAP);
    if (!raw) return {};
    const map = JSON.parse(raw);
    // TTL: limpiar entradas con más de 24h
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let dirty = false;
    Object.keys(map).forEach(k => {
      if (!map[k].createdAt || map[k].createdAt < cutoff) { delete map[k]; dirty = true; }
    });
    if (dirty) localStorage.setItem(LOCUS_KEYS.TMP_ID_MAP, JSON.stringify(map));
    return map;
  } catch(e) { return {}; }
}

function _saveTmpIdMap(map) {
  try { localStorage.setItem(LOCUS_KEYS.TMP_ID_MAP, JSON.stringify(map)); } catch(e) {}
  // R-1: persistir tmp-id-map en Supabase para sobrevivir cambio de dispositivo
  if (_supabase && _supabaseUser) {
    _supabase.from('tracker_docs').upsert(
      [{ user_id: _supabaseUser.id, key: 'tmp-id-map', value: { map, savedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }],
      { onConflict: 'user_id,key' }
    ).then(({ error }) => {
      if (error) {
        console.warn('[AI Tracker] _saveTmpIdMap Supabase error:', error);
        _offlineQueuePush({ type: 'tmp-id-map' });
      }
    });
  }
}

// ── GRUPO 5 — OFFLINE QUEUE ───────────────────────────────────────────────────
// T-202605-483: Fallback offline — cola de pendientes + listeners de red
// Cola persistida en localStorage para sobrevivir recargas
const _OFFLINE_QUEUE_KEY = LOCUS_KEYS.OFFLINE_QUEUE;
let _offlineQueue = (() => {
  try { return JSON.parse(localStorage.getItem(_OFFLINE_QUEUE_KEY) || '[]'); } catch { return []; }
})();
let _isOnline = navigator.onLine;

function _offlineQueueSave() {
  try { localStorage.setItem(_OFFLINE_QUEUE_KEY, JSON.stringify(_offlineQueue)); } catch(e) {}
}

// Encola un write pendiente con timestamp — last-write-wins por tipo de entrada
export function _offlineQueuePush(entry) {
  // T-525: deduplicar por type+projId — evita pérdida silenciosa de writes en multi-proyecto
  // Antes deduplicaba solo por type: dos proyectos distintos con type 'sessions' colisionaban
  const idx = _offlineQueue.findIndex(e =>
    e.type === entry.type && (e.projId || null) === (entry.projId || null)
  );
  if (idx !== -1) _offlineQueue.splice(idx, 1);
  _offlineQueue.push({ ...entry, queuedAt: Date.now() });
  _offlineQueueSave();
}

// Flush la cola al reconectar — last-write-wins
async function _offlineQueueFlush() {
  if (!_offlineQueue.length) return;
  if (!_supabase || !_supabaseUser) return;
  const queue = [..._offlineQueue];
  _offlineQueue = [];
  _offlineQueueSave();

  setSyncStatus('syncing', '⟳ sincronizando');
  let failed = false;

  for (const entry of queue) {
    try {
      if (entry.type === 'state') {
        _stateDirty = true;
        await _saveFlush();
      } else if (entry.type === 'backlog') {
        await saveBacklog();
      } else if (entry.type === 'docs') {
        await saveContextDocs();
      } else if (entry.type === 'plan' && entry.projId) {
        // R-202605-120: flush plan desde localStorage a Supabase al reconectar
        const planRaw = localStorage.getItem(LOCUS_KEYS.PLAN_PREFIX + entry.projId);
        if (planRaw && _supabase && _supabaseUser) {
          const suffix = '-' + entry.projId;
          const payload = (() => { try { return JSON.parse(planRaw); } catch { return null; } })();
          if (payload) {
            const { error: planErr } = await _supabase.from('tracker_docs').upsert(
              [{ user_id: _supabaseUser.id, key: 'plan' + suffix, value: payload, updated_at: new Date().toISOString() }],
              { onConflict: 'user_id,key' }
            );
            if (planErr) throw planErr;
          }
        }
      } else if (entry.type === 'sessions' && entry.projId) {
        const proj = (state.projects || []).find(p => p.id === entry.projId);
        if (proj) await _saveSessions(proj);
      } else if (entry.type === 'historico') {
        // REQ-PERSIST-OPT TKT4 AC-4: reintenta saveHistoricoItems desde el payload ya
        // cacheado en localStorage por el respaldo optimista de la propia función.
        // AC-5: sin payload válido → no lanza error, simplemente no reintenta esta entrada.
        const _histSuffix = entry.projId ? '-' + entry.projId : '-global';
        const histRaw = localStorage.getItem(_HISTORICO_KEY + _histSuffix);
        if (histRaw) {
          const histPayload = (() => { try { return JSON.parse(histRaw); } catch { return null; } })();
          if (histPayload) await saveHistoricoItems(histPayload);
        }
      } else if (entry.type === 'tmp-id-map') {
        // R-1: flush tmp-id-map desde localStorage a Supabase al reconectar
        const raw = localStorage.getItem(LOCUS_KEYS.TMP_ID_MAP);
        if (raw && _supabase && _supabaseUser) {
          const map = (() => { try { return JSON.parse(raw); } catch { return null; } })();
          if (map) {
            const { error: mapErr } = await _supabase.from('tracker_docs').upsert(
              [{ user_id: _supabaseUser.id, key: 'tmp-id-map', value: { map, savedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }],
              { onConflict: 'user_id,key' }
            );
            if (mapErr) throw mapErr;
          }
        }
      } else if (entry.type === 'notes' && entry.projId !== undefined) {
        // R-2: flush notas desde localStorage a Supabase al reconectar
        const notesKey = entry.projId ? 'notes-' + entry.projId : 'notes';
        const notesRaw = localStorage.getItem(notesKey);
        if (notesRaw && _supabase && _supabaseUser) {
          const notes = (() => { try { return JSON.parse(notesRaw); } catch { return null; } })();
          if (notes) {
            const sbKey = entry.projId ? 'notes-' + entry.projId : 'notes-global';
            const { error: notesErr } = await _supabase.from('tracker_docs').upsert(
              [{ user_id: _supabaseUser.id, key: sbKey, value: { notes, updatedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }],
              { onConflict: 'user_id,key' }
            );
            if (notesErr) throw notesErr;
          }
        }
      } else if (entry.type === 'user-prefs') {
        // R-4: flush preferencias de usuario desde localStorage a Supabase al reconectar
        await _saveUserPrefs();
      }
    } catch(e) {
      console.warn('[AI Tracker] Offline queue flush error:', e);
      _offlineQueue.push(entry);
      failed = true;
    }
  }

  _offlineQueueSave();
  if (!failed) {
    setSyncStatus('synced', '✓ sincronizado');
    showToast('success', '✓ Datos sincronizados al reconectar');
  }
}

// Listeners de red — actualizan indicador y disparan flush
window.addEventListener('online', () => {
  _isOnline = true;
  if (_supabase) {
    setSyncStatus('syncing', '⟳ reconectando');
    _offlineQueueFlush();
  } else {
    setSyncStatus('local', 'local');
  }
});

window.addEventListener('offline', () => {
  _isOnline = false;
  setSyncStatus('offline', '✕ sin conexión');
});

// AC-8 Fase B: _refreshMigrationBtnVisibility — botón de migración FB→SB eliminado en Fase B
function _refreshMigrationBtnVisibility() {
  const btn = document.getElementById('btn-migrate-fb-sb');
  if (btn) btn.classList.add('is-hidden');
}

// ── GRUPO 2 — SUPABASE / AUTH ─────────────────────────────────────────────────

function signInWithSupabase() {
  // B-202605-504: Safari usa popup (skipBrowserRedirect:true) porque ITP borra el hash
  // en redirects cross-origin — el token nunca llega a la app via redirect.
  // Chrome y resto usan redirect estándar en la misma pestaña.
  if (!_supabase) { setSyncStatus('offline', '✕ sin conexión'); return; }
  const _isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (_isSafari) {
    // Safari: popup flow — abre ventana de Google, al cerrar onAuthStateChange dispara en la pestaña original
    _supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true
      }
    }).then(({ data }) => {
      if (data?.url) {
        const popup = window.open(data.url, '_blank', 'width=500,height=600');
        if (!popup) showToast('error', 'Permite popups para iniciar sesión');
      }
    }).catch(err => {
      console.warn('Supabase Google sign-in error:', err);
      showToast('error', 'Error al conectar: ' + (err.message || err));
    });
  } else {
    // Chrome y resto: redirect estándar en misma pestaña
    _supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: false
      }
    }).catch(err => {
      console.warn('Supabase Google sign-in error:', err);
      showToast('error', 'Error al conectar: ' + (err.message || err));
    });
  }
}

// signOutSupabase — cierra sesión Supabase
function signOutSupabase() {
  if (!_supabase) { setSyncStatus('local', '☁ conectar'); return; }
  saveImmediate().finally(() => {
    _supabase.auth.signOut().then(() => {
      _supabaseUser = null;
      setSyncStatus('local', '☁ conectar');
      showToast('info', 'Sesión cerrada');
    });
  });
}

async function signInWithMagicLink(resend = false) {
  if (!_supabase) { setSyncStatus('offline', '✕ sin conexión'); return; }
  const emailInput = document.getElementById('auth-email-input');
  const email = emailInput ? emailInput.value.trim() : '';
  if (!email || !email.includes('@')) {
    showToast('error', 'Ingresa un email válido');
    if (emailInput) emailInput.focus();
    return;
  }
  const btn = document.getElementById('auth-btn-magic');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
  const { error } = await _supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } // B-202605-044: solo emails pre-registrados pueden autenticarse
  });
  if (btn) { btn.disabled = false; btn.textContent = 'Enviar enlace de acceso'; }
  if (error) {
    console.warn('Magic link error:', error);
    showToast('error', 'Error al enviar: ' + (error.message || error));
    return;
  }
  const emailForm = document.getElementById('auth-email-form');
  const sentState = document.getElementById('auth-sent-state');
  if (!resend) {
    if (emailForm) emailForm.classList.add('is-hidden');
    if (sentState) sentState.classList.remove('is-hidden');
  }
  showToast('info', resend ? 'Enlace reenviado a ' + email : 'Enlace de acceso enviado a ' + email);
}

// getSupabaseUserId — user_id del founder para queries Supabase
export function getSupabaseUserId() {
  return _supabaseUser ? _supabaseUser.id : null;
}

// TKT1b · verifyConstraintsSync — herramienta de consola, sin uso en flujo de la app.
// Compara los constraints reales de tracker_items (vía RPC get_table_constraints, TKT1a)
// contra los valores canónicos declarados en __BR-Ecosystem §4 (tracker_items_type_check)
// y __BR-Core §4 (chk_status_by_type). Detecta desincronía DDL↔código tras migraciones de schema.
// Firma: Promise<{ok,mismatches,uniquePkCheck}|null> — sin call sites externos en este archivo.
//
// [tmp:tkt2-extend-rpc · 2026-07-01] Chequeo onConflict vs UNIQUE/PK REACTIVADO. get_table_constraints
// fue extendida (DROP+CREATE+GRANT, [tmp:tkt1-extend-rpc]) para incluir filas con contype 'u'/'p'
// además de las CHECK ('c') ya retornadas. Confirmado por query en vivo del founder contra
// get_table_constraints('tracker_items'): retorna tracker_items_code_key (u, UNIQUE(code)) y
// tracker_items_pkey (p, PRIMARY KEY(id)) junto a las 5 filas CHECK — shape coincide con lo
// asumido originalmente en TKT1 (histórico [INC-PP] de esta cadena, ya resuelto). uniquePkCheck
// pasa de 'disabled' a 'active'. _checkOnConflictAgainstRows() vuelve a invocarse para las 5 tablas.
//
// Deuda registrada: _CANONICAL_TYPES y _CANONICAL_STATUS_BY_TYPE duplican los valores de
// _VALID_STATUS_BY_TYPE / _VALID_ITEM_TYPES definidos localmente dentro de saveBacklog()
// (línea ~867). No se extraen a constante de módulo compartida en este TKT — saveBacklog()
// está fuera de su impacto lateral declarado. Candidato a refactor de unificación, prioridad low.
const _CANONICAL_TYPES = ['REQ', 'TKT', 'DISC', 'INC', 'PRB', 'KE', 'CHG'];
const _CANONICAL_STATUS_BY_TYPE = {
  REQ:  ['pendiente', 'en-proceso', 'en-revision', 'done', 'bloqueado', 'orphaned', 'descartado'],
  TKT:  ['pendiente', 'en-revision', 'done', 'descartado'],
  INC:  ['detected', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated_to_prb', 'escalated_to_chg', 'descartado'],
  PRB:  ['detected', 'in_progress', 'resolved', 'closed', 'descartado'],
  KE:   ['active', 'resolved', 'descartado'],
  CHG:  ['pendiente', 'en-revision', 'done', 'descartado'],
  DISC: ['discovery', 'promoted', 'descartado'],
};

// onConflict declarado en código, por tabla — fuente: auditoría manual de call sites (2026-06-30).
// tracker_items excluido de este mapa — se cubre aparte junto a los CHECK ya existentes.
const _EXPECTED_ONCONFLICT = {
  tracker_docs:     ['user_id', 'key'],
  tracker_sessions: ['user_id', 'session_id'],
  tracker_sprints:  ['user_id', 'sprint_id'],
  tracker_state:    ['user_id', 'key'],
};
const _EXPECTED_ONCONFLICT_ITEMS = ['code'];

// Extrae los literales 'texto' de un fragmento ARRAY[...] de Postgres (condef crudo).
function _parsePgTextArrayLiteral(arrText) {
  const matches = arrText.match(/'((?:[^'\\]|\\.)*)'/g) || [];
  return matches.map(m => m.slice(1, -1));
}

// Extrae la lista de columnas del primer paréntesis de un condef de UNIQUE/PK,
// ej: "UNIQUE (user_id, key)" → ['user_id', 'key']. No usar sobre condef de CHECK.
function _parsePgColumnList(condef) {
  const m = condef.match(/\(([^)]*)\)/);
  if (!m) return [];
  return m[1].split(',').map(s => s.trim());
}

function _sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

// Compara el onConflict esperado de una tabla contra sus filas UNIQUE/PK reales.
// Empuja un mismatch a `mismatches` si ninguna fila coincide como set de columnas.
// Reactivada en TKT2 [tmp:tkt2-extend-rpc] — get_table_constraints ahora expone contype real.
function _checkOnConflictAgainstRows(tabla, rows, expected, mismatches) {
  const uniqueOrPkRows = (rows || []).filter(r => r.contype === 'u' || r.contype === 'p');
  const match = uniqueOrPkRows.some(r => _sameSet(_parsePgColumnList(r.condef), expected));
  if (!match) {
    mismatches.push({
      tabla,
      onConflictDeclarado: expected.join(','),
      constraintReal: uniqueOrPkRows.map(r => r.condef),
    });
  }
}

// Ejecuta get_table_constraints para una tabla — null si la RPC falla, con warning ya emitido.
async function _fetchTableConstraints(tabla) {
  try {
    const { data, error } = await _supabase.rpc('get_table_constraints', { p_table_name: tabla });
    if (error) {
      if (error.code === '42883') {
        console.warn('[Locus] verifyConstraintsSync: RPC get_table_constraints no existe — ¿TKT1a aplicado?');
      } else {
        console.warn(`[Locus] verifyConstraintsSync: error consultando constraints de ${tabla} —`, error.message || error);
      }
      return null;
    }
    return data || [];
  } catch (e) {
    console.warn(`[Locus] verifyConstraintsSync: error inesperado invocando la RPC para ${tabla} —`, e?.message || e);
    return null;
  }
}

export async function verifyConstraintsSync() {
  if (!_supabase || !_supabaseUser) {
    console.warn('[Locus] verifyConstraintsSync: sin auth — verificación no disponible');
    return null;
  }

  const mismatches = [];

  // ── tracker_items — CHECK constraints canónicos + onConflict:code vs UNIQUE/PK real ──
  const itemsRows = await _fetchTableConstraints('tracker_items');
  if (!itemsRows) {
    mismatches.push({ tabla: 'tracker_items', constraints_check: 'unavailable' });
  } else {
    const typeRow = itemsRows.find(r => r.conname === 'tracker_items_type_check');
    if (!typeRow) {
      mismatches.push({ constraint: 'tracker_items_type_check', esperado: _CANONICAL_TYPES, real: '[constraint no encontrado en Supabase]' });
    } else {
      const arrMatch = typeRow.condef.match(/ARRAY\[(.*?)\]/s);
      const realTypes = arrMatch ? _parsePgTextArrayLiteral(arrMatch[1]) : [];
      if (!_sameSet(realTypes, _CANONICAL_TYPES)) {
        mismatches.push({ constraint: 'tracker_items_type_check', esperado: _CANONICAL_TYPES, real: realTypes });
      }
    }

    const statusRow = itemsRows.find(r => r.conname === 'chk_status_by_type');
    if (!statusRow) {
      mismatches.push({ constraint: 'chk_status_by_type', esperado: _CANONICAL_STATUS_BY_TYPE, real: '[constraint no encontrado en Supabase]' });
    } else {
      const whenBlocks = [...statusRow.condef.matchAll(/WHEN\s+'(\w+)'::text\s+THEN\s+\(status\s*=\s*ANY\s*\(ARRAY\[(.*?)\]\)\)/gs)];
      const realByType = {};
      for (const [, type, arrText] of whenBlocks) {
        realByType[type] = _parsePgTextArrayLiteral(arrText);
      }
      for (const type of Object.keys(_CANONICAL_STATUS_BY_TYPE)) {
        const real = realByType[type] || [];
        if (!_sameSet(real, _CANONICAL_STATUS_BY_TYPE[type])) {
          mismatches.push({ constraint: `chk_status_by_type[${type}]`, esperado: _CANONICAL_STATUS_BY_TYPE[type], real });
        }
      }
    }

    _checkOnConflictAgainstRows('tracker_items', itemsRows, _EXPECTED_ONCONFLICT_ITEMS, mismatches);
  }

  // ── Resto de tablas — onConflict vs UNIQUE/PK real (RPC extendida, TKT1 [tmp:tkt1-extend-rpc]) ──
  for (const tabla of Object.keys(_EXPECTED_ONCONFLICT)) {
    const rows = await _fetchTableConstraints(tabla);
    if (!rows) {
      mismatches.push({ tabla, constraints_check: 'unavailable' });
      continue;
    }
    _checkOnConflictAgainstRows(tabla, rows, _EXPECTED_ONCONFLICT[tabla], mismatches);
  }

  if (mismatches.length === 0) {
    console.log('[Locus] verifyConstraintsSync — OK: constraints sincronizados con BR-Ecosystem y onConflict verificado contra UNIQUE/PK reales (5 tablas).');
    return { ok: true, mismatches: [], uniquePkCheck: 'active' };
  }

  for (const d of mismatches) {
    if (d.constraints_check) {
      console.warn(`[Locus] verifyConstraintsSync — ${d.tabla}: constraints_check unavailable.`);
    } else if (d.onConflictDeclarado) {
      console.warn(`[Locus] verifyConstraintsSync — DESINCRONÍA onConflict en ${d.tabla}. Declarado:`, d.onConflictDeclarado, 'Constraint real:', d.constraintReal);
    } else {
      console.warn(`[Locus] verifyConstraintsSync — DESINCRONÍA en ${d.constraint}. Esperado:`, d.esperado, 'Real:', d.real);
    }
  }
  return { ok: false, mismatches, uniquePkCheck: 'active' };
}

// ── GRUPO 1 — ESTADO Y PERSISTENCIA ──────────────────────────────────────────

const _SAVE_DEBOUNCE_MS = 5000; // acumula calls; Supabase solo escribe si dirty
let _saveDebounceTimer = null;
let _stateDirty = false;

// B-[pendiente-ID]: contador in-flight para saveBacklog() — >0 mientras hay al menos un
// upsert hacia tracker_items en curso. _loadFromSupabase() lo verifica antes de mergear
// items remotos, igual que ya verifica _saveDebounceTimer para el state general (línea ~1546).
// Contador en vez de booleano: varios call sites de saveBacklog() no usan await (fire-and-
// forget) — dos invocaciones pueden solaparse. Un booleano simple liberaría la protección
// en cuanto la PRIMERA terminara, aunque la segunda siguiera en vuelo. El contador solo
// llega a 0 cuando TODAS las invocaciones activas confirmaron (éxito o error).
// Sin este guard, un _loadFromSupabase() disparado por CUALQUIER canal Realtime (state,
// sessions o items — [tmp:req-realtime-items] TKT1 agregó canal dedicado a tracker_items,
// el guard sigue siendo necesario para los tres) podía pisar un cambio local
// reciente (ej: parentId recién asignado, status:done de Finn) si el upsert de saveBacklog()
// todavía no había confirmado en Supabase. El guard de timestamp existente (B-202606-094)
// no cubre esta ventana porque compara contra localStorage, que solo se actualiza DESPUÉS
// de la confirmación del upsert — no contra el estado en memoria recién modificado.
let _saveBacklogInFlightCount = 0;

// Opción A — ignorar heartbeat de tracker_state cuando no hay actividad de usuario reciente.
// tracker_state recibe UPDATEs periódicos cada ~7s (trigger moddatetime o _saveFlush propio)
// que _handleRemoteChange interpretaba como cambio genuino → _loadFromSupabase() → render
// global completo → parpadeo de parent en backlog + pérdida de foco en card de sesiones.
// _markUserAction() se llama desde cualquier acción que modifica state (save, saveImmediate,
// saveBacklog, interacciones de UI). Si el UPDATE de tracker_state llega más de
// _USER_ACTION_WINDOW_MS después de la última acción → es heartbeat → ignorar.
const _USER_ACTION_WINDOW_MS = 15_000; // 15s — cubre debounce de 5s + latencia de red
let _lastUserActionTs = 0;
// _initLoadComplete: true cuando la primera _loadFromSupabase() terminó — garantiza que
// _markUserAction() no abra la ventana durante el arranque (renders post-auth, saves de
// migración de sprints HOTFIX, etc.). Antes de este flag, cualquier save() del init
// marcaba acción de usuario y dejaba pasar los heartbeats de los primeros 15s.
let _initLoadComplete = false;
export function _markUserAction() {
  if (!_initLoadComplete) return; // ignorar acciones del arranque
  _lastUserActionTs = Date.now();
}

// R-202604-035 / T-202604-299: _saveFlush() — lógica real de escritura
// Llamada por el timer de debounce o por saveImmediate()
async function _saveFlush() {
  clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = null;

  // AC-4 R-C1: Supabase primero cuando disponible — localStorage solo como caché post-write exitoso.
  if (_supabase && _supabaseUser && _stateDirty) {
    _stateDirty = false;
    setSyncStatus('syncing', '⟳ sincronizando');
    try {
      const stateWithoutSessions = {
        ...state,
        // T-202606-005 AC-3: excluir sprints del blob — sprints viven en tracker_sprints
        projects: (state.projects || []).map(p => { const { sessions, sprints, ...rest } = p; return rest; })
      };
      const _nowTs = new Date().toISOString();
      // B-202606-XXX: registrar _realtimeLastTs ANTES del await — cierra race condition
      // donde Supabase notificaba via Realtime antes de que _realtimeLastTs tuviera valor,
      // causando que _loadFromSupabase() recargara el state y pisara cambios locales (ej: tema).
      _realtimeLastTs = _nowTs;
      const { error } = await _supabase.from('tracker_state').upsert({
        user_id: _supabaseUser.id,
        key: 'main',
        value: stateWithoutSessions,
        updated_at: _nowTs
      }, { onConflict: 'user_id,key' });
      if (error) throw error;

      // Sesiones — upsert en paralelo por proyecto
      // INC-[pendiente-ID] (triggered_by TKT2): antes solo se llamaba _saveSessions(proj)
      // si proj.sessions.length > 0 — un proyecto purgado por completo (sessions vacío)
      // nunca llegaba a _saveSessions(), así que su DELETE pendiente en
      // _dirtySessionRemovals jamás se enviaba. Ahora también entra si hay removals
      // pendientes, aunque sessions esté vacío.
      const sessionWrites = [];
      for (const proj of (state.projects || [])) {
        const hasPendingRemovals = _dirtySessionRemovals[proj.id] && _dirtySessionRemovals[proj.id].size > 0;
        if ((proj.sessions && proj.sessions.length > 0) || hasPendingRemovals) {
          sessionWrites.push(_saveSessions(proj));
        }
      }
      if (sessionWrites.length > 0) await Promise.all(sessionWrites);

      // AC-4 R-C1: upsert exitoso → escribir localStorage como caché
      try {
        localStorage.setItem(LOCUS_KEYS.STATE, JSON.stringify(state));
      } catch (lsErr) {
        if (lsErr.name === 'QuotaExceededError') {
          console.error('[AI Tracker] localStorage quota exceeded in _saveFlush(), attempting cleanup...');
          try {
            localStorage.removeItem(LOCUS_KEYS.CHANGELOG);
            localStorage.setItem(LOCUS_KEYS.STATE, JSON.stringify(state));
            // R-202605-055: showToast eliminado de _saveFlush — ruido silencioso en flujo de guardado
          } catch (lsErr2) {
            console.error('[AI Tracker] _saveFlush() localStorage cache failed after cleanup:', lsErr2);
            // R-202605-055: showToast eliminado de _saveFlush — ruido silencioso en flujo de guardado
          }
        } else { throw lsErr; }
      }

      setSyncStatus('synced', '✓ sincronizado');
    } catch (err) {
      // AC-5 R-C1: upsert Supabase falla → localStorage como fallback + encolar + toast
      console.error('[AI Tracker] Supabase save() failed:', err);
      _stateDirty = true;
      // B-202606-005 AC-3: upsert falló — el timestamp registrado antes del await no llegó
      // a Supabase. Resetear a null para que la próxima notificación Realtime no sea ignorada
      // por el guard (_realtimeLastTs && remoteTs === _realtimeLastTs) con un ts fantasma.
      _realtimeLastTs = null;
      setSyncStatus('offline', '✕ sin conexión');
      try {
        localStorage.setItem(LOCUS_KEYS.STATE, JSON.stringify(state));
      } catch (lsErr) {
        console.error('[AI Tracker] _saveFlush() fallback localStorage also failed:', lsErr);
      }
      // R-202605-055: showToast eliminado de _saveFlush — ruido silencioso en flujo de guardado
      _offlineQueuePush({ type: 'state' });
    }
  }

  // T-202605-118: AC-6 — renders post-debounce (online+auth path)
  // B-202605-079: activar dirty flags antes de llamar renders — sin mark los guards devuelven no-op
  // (a) event dispatch — locus-radar.js escucha 'shell:mark-radar-dirty' + 'shell:render-radar'
  _dispatch('shell:mark-radar-dirty');
  _dispatch('shell:render-radar');
  // (a) event dispatch — locus-sesiones-stats.js escucha 'shell:mark-statusbar-dirty' + 'shell:render-statusbar'
  _dispatch('shell:mark-statusbar-dirty');
  _dispatch('shell:render-statusbar');
}

// R-202604-035 / T-202604-299: save() — debounced
// Escribe localStorage inmediatamente (sync); Supabase se acumula hasta _SAVE_DEBOUNCE_MS
// Para eventos críticos usar saveImmediate()
export function save() {
  _stateDirty = true;

  // T-202605-118: activar dirty flags — renders se ejecutan path-específico (AC-6: no antes del flush en online+auth)
  // (a) event dispatch — locus-radar.js escucha 'shell:mark-radar-dirty'
  _dispatch('shell:mark-radar-dirty');
  // (a) event dispatch — locus-sesiones-stats.js escucha 'shell:mark-statusbar-dirty'
  _dispatch('shell:mark-statusbar-dirty');

  // AC-3 R-C1: sin auth → localStorage inmediato. Supabase no se intenta.
  if (!_supabaseUser) {
    try {
      localStorage.setItem(LOCUS_KEYS.STATE, JSON.stringify(state));
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.error('[AI Tracker] localStorage quota exceeded in save(), attempting cleanup...');
        try {
          localStorage.removeItem(LOCUS_KEYS.CHANGELOG);
          localStorage.setItem(LOCUS_KEYS.STATE, JSON.stringify(state));
          showToast('warning', '⚠️ Cuota crítica — se limpió historial automáticamente');
        } catch (err2) {
          console.error('[AI Tracker] save() failed after cleanup:', err2);
          showToast('error', '❌ Almacenamiento lleno. Limpia sesiones archivadas.');
        }
      } else { throw err; }
    }
    // T-202605-118: render inmediato — sin auth, sin debounce
    // (a) event dispatch — locus-radar.js escucha 'shell:render-radar'
    _dispatch('shell:render-radar');
    return;
  }

  // AC-2 R-C1: offline → localStorage inmediato como fallback + encolar para reintento.
  if (!_isOnline) {
    try {
      localStorage.setItem(LOCUS_KEYS.STATE, JSON.stringify(state));
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.error('[AI Tracker] localStorage quota exceeded in save() offline, attempting cleanup...');
        try {
          localStorage.removeItem(LOCUS_KEYS.CHANGELOG);
          localStorage.setItem(LOCUS_KEYS.STATE, JSON.stringify(state));
          showToast('warning', '⚠️ Cuota crítica — se limpió historial automáticamente');
        } catch (err2) {
          console.error('[AI Tracker] save() offline failed after cleanup:', err2);
          showToast('error', '❌ Almacenamiento lleno. Limpia sesiones archivadas.');
        }
      } else { throw err; }
    }
    // T-202605-118: render inmediato — offline, sin debounce
    // (a) event dispatch — locus-radar.js escucha 'shell:render-radar'
    _dispatch('shell:render-radar');
    _offlineQueuePush({ type: 'state' });
    return;
  }

  // AC-1 R-C1: online + auth → encolar debounce hacia _saveFlush(). No escribir localStorage aquí.
  clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(() => _saveFlush(), _SAVE_DEBOUNCE_MS);
  _markUserAction();
}

// T-202604-299: saveImmediate() — bypasa debounce para eventos críticos
// Usar en: saveSession(), signOutSupabase(), beforeunload
export async function saveImmediate() {
  _stateDirty = true;
  clearTimeout(_saveDebounceTimer);
  _markUserAction();
  await _saveFlush();
}

// R-202604-035: escribe sesiones de un proyecto — Supabase upsert por lotes de 400
// REQ-PERSIST-OPT TKT1: localStorage escrito de forma optimista ANTES del upsert —
// un hard reload durante el batch ya no pierde proj.sessions en ambos lados.
async function _saveSessions(proj) {
  if (!proj) return;
  if (!proj.sessions) proj.sessions = [];
  // AC-4 (TKT2): no salir temprano si hay removals pendientes, aunque proj.sessions
  // haya quedado vacío (ej. purga total) — el DELETE debe correr igual.
  const _pendingRemovals = _dirtySessionRemovals[proj.id];
  const _hasPendingRemovals = _pendingRemovals && _pendingRemovals.size > 0;
  if (!proj.sessions.length && !_hasPendingRemovals) return;
  const sessions = proj.sessions;

  // AC-1: respaldo local inmediato, antes de cualquier intento de red.
  try {
    localStorage.setItem(LOCUS_KEYS.SESSIONS_PREFIX + proj.id, JSON.stringify(sessions));
  } catch (lsErr) {
    console.warn('[AI Tracker] _saveSessions: fallo al escribir respaldo local pre-upsert', lsErr);
  }

  // Supabase — upsert por lotes de 400, solo de sesiones dirty (TKT1) + DELETE real de
  // removals pendientes (TKT2 · REQ-sessions-mutator)
  if (_supabase && _supabaseUser) {
    // AC-2/AC-4 (TKT2): DELETE de removals corre siempre que haya pendientes, independiente
    // de si hay algo para subir o si el proyecto ya tuvo su baseline — un remove no depende
    // del estado de sync de los adds.
    const removalsPending = _dirtySessionRemovals[proj.id];
    if (removalsPending && removalsPending.size) {
      const idsToDelete = Array.from(removalsPending);
      const { error: delError } = await _supabase
        .from('tracker_sessions')
        .delete()
        .eq('user_id', _supabaseUser.id)
        .in('session_id', idsToDelete);
      if (delError) {
        // AC-3 (TKT2): no limpiar removals en error — reintenta en el próximo _saveFlush().
        console.error('[AI Tracker] Supabase _saveSessions DELETE failed:', delError);
      } else {
        idsToDelete.forEach(id => removalsPending.delete(id));
      }
    }

    // AC-4: primera sincronización de este proyecto en este cliente → upsert completo una
    // sola vez. _dirtySyncBaseline distingue "sin cambios pendientes" de "nunca sincronizado"
    // — sin esta marca, un proyecto recién cargado no subiría nada (dirty arranca vacío).
    const needsBaseline = !_dirtySyncBaseline.has(proj.id);
    const dirtyIds = _dirtySessionIds[proj.id] || new Set();
    const sessionsToUpload = needsBaseline ? sessions : sessions.filter(s => dirtyIds.has(s.id));

    if (!sessionsToUpload.length) { _dirtySyncBaseline.add(proj.id); return; }

    // Ids capturados ANTES del await — una mutación nueva que llegue durante el upsert queda
    // dirty para el próximo ciclo, no se pierde ni se limpia de más (AC-3).
    const idsBeingUploaded = new Set(sessionsToUpload.map(s => s.id));

    const BATCH = 400;
    for (let i = 0; i < sessionsToUpload.length; i += BATCH) {
      // T-202606-097: timestamp único por lote — registrar ANTES del await para cubrir
      // el echo de Realtime de tracker_sessions. Mismo patrón que _saveFlush() L557.
      const _sessTs = new Date().toISOString();
      _realtimeLastTs = _sessTs;
      const chunk = sessionsToUpload.slice(i, i + BATCH).map(sess => ({
        user_id:    _supabaseUser.id,
        project_id: proj.id,
        session_id: sess.id,
        data:       sess,
        updated_at: _sessTs
      }));
      const { error } = await _supabase.from('tracker_sessions').upsert(chunk, { onConflict: 'user_id,session_id' });
      if (error) {
        // T-202606-097: upsert falló — resetear para no bloquear próximo cambio remoto legítimo.
        _realtimeLastTs = null;
        console.error('[AI Tracker] Supabase _saveSessions failed:', error);
        // AC-2: localStorage ya tiene la copia completa desde el bloque de arriba —
        // sin escritura adicional aquí.
        _offlineQueuePush({ type: 'sessions', projId: proj.id });
        // AC-3: no limpiar dirty en error — reintenta en el próximo _saveFlush().
        return;
      }
    }

    // AC-3: éxito — limpiar solo los ids recién subidos.
    if (_dirtySessionIds[proj.id]) idsBeingUploaded.forEach(id => _dirtySessionIds[proj.id].delete(id));
    _dirtySyncBaseline.add(proj.id);
    return;
  }
}

// ── GRUPO 7 — STORAGE HEALTH ──────────────────────────────────────────────────

// T-202604-055: Log de acciones del backlog
// T-202606-076: export ESM — consumidores importan explícitamente en lugar de acceder via window
export const BACKLOG_LOG_MAX = 100;
// T-202606-077: export ESM — consumidores importan explícitamente en lugar de acceder via window
export const _DOC_LOG_KEYS = { backlog: 'backlog-log', context: 'context-log', htmlmap: 'html-map-log' };

export function _blogLog(action, code, detail, doc) {
  const key = _DOC_LOG_KEYS[doc] || _DOC_LOG_KEYS.backlog;
  let log = [];
  try { log = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  log.unshift({ ts: Date.now(), action, code: code || '', detail: detail || '' });
  if (log.length > BACKLOG_LOG_MAX) log = log.slice(0, BACKLOG_LOG_MAX);
  try { localStorage.setItem(key, JSON.stringify(log)); } catch {}
}

export function _relTs(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min';
  if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + 'h';
  return 'hace ' + Math.floor(diff / 86400) + 'd';
}

// R-202604-035: saveBacklog() — T-202606-008: reescrito para upsert relacional fila por fila
// en tabla items (DDL creado en T-202606-007). Firma saveBacklog() → void intacta — los 9
// archivos consumidores (locus-backlog-core, locus-backlog-merge, locus-backlog-panel,
// locus-backlog-sprints, locus-backlog-item, locus-backlog-editor, locus-backlog-historico,
// locus-backlog-render, locus-reports — 41 invocaciones en total) no requieren cambio de
// código. locus-session-parse y locus-session-save no invocan saveBacklog() directamente —
// corregido tras auditoría T-[pendiente-ID], el comentario original los listaba por error.
// localStorage se mantiene como caché/fallback (sin auth).
export async function saveBacklog() {
  _markUserAction();
  // T-[pendiente-ID]: purga inteligente — si localStorage supera el 80% de capacidad,
  // purgar ítems done/descartado >90 días del caché local antes de intentar escribir.
  // Los ítems purgados siguen existiendo en Supabase — solo se elimina el caché local.
  if (_localStorageUsageRatio() > 0.8) {
    {
      const purged = _purgeStaleBacklogCache();
      if (purged > 0) showToast('warning', `⚠️ Caché local compacto — ${purged} ítem${purged > 1 ? 's' : ''} archivado${purged > 1 ? 's' : ''} (disponibles en Supabase)`);
    }
  }

  // Gate de validación estructural — un ítem con status:'historico' nunca llega
  // a Supabase ni a localStorage. status:'historico' es de solo lectura,
  // asignado únicamente por Locus al cerrar sprint.
  //
  // B-202606-097: gate chk_status_by_type — reflejo client-side del CHECK constraint de
  // Postgres (T-202606-007 DDL). Un ítem con combinación type+status inválida se excluye
  // del upsert hasta que su status sea corregido. No se elimina de ITEMS en memoria.
  // TKT-B5b: Estados válidos por tipo — alineados con DDL real Gen2 (ALTER aplicado
  // 2026-06-27, ver tracking REQ-B5b) y con VALID_TRANSITIONS en locus-session-save.js —
  // misma fuente de verdad, sin contradicción entre los dos archivos:
  //   REQ:  pendiente · en-proceso · en-revision · done · bloqueado · orphaned · descartado
  //   TKT:  pendiente · en-revision · done · descartado
  //   INC:  detected · assigned · in_progress · resolved · closed · escalated_to_prb · escalated_to_chg · descartado
  //   PRB:  detected · in_progress · resolved · closed · descartado
  //   KE:   active · resolved · descartado
  //   CHG:  pendiente · en-revision · done · descartado
  //   DISC: discovery · promoted · descartado
  // Nota: historico se excluye antes de llegar aquí por el gate `it.status === 'historico'`
  // arriba — ningún tipo lo declara en su propio Set porque es asignado exclusivamente
  // por Locus al cerrar sprint (__BR-Ecosystem §5), no un status nativo del ciclo de vida.
  const _VALID_STATUS_BY_TYPE = {
    REQ:  new Set(['pendiente', 'en-proceso', 'en-revision', 'done', 'bloqueado', 'orphaned', 'descartado']),
    TKT:  new Set(['pendiente', 'en-revision', 'done', 'descartado']),
    INC:  new Set(['detected', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated_to_prb', 'escalated_to_chg', 'descartado']),
    PRB:  new Set(['detected', 'in_progress', 'resolved', 'closed', 'descartado']),
    KE:   new Set(['active', 'resolved', 'descartado']),
    CHG:  new Set(['pendiente', 'en-revision', 'done', 'descartado']),
    DISC: new Set(['discovery', 'promoted', 'descartado']),
  };

  // INC-[pendiente-ID]: gate chk_type_canonico — reflejo client-side de tracker_items_type_check
  // (Postgres). Un ítem cuyo .type no es uno de los 7 tipos canónicos del ecosistema nunca debe
  // llegar al upsert — 'patch' es instrucción de operación del parser, no un tipo de ítem, y no
  // debe persistir como valor de columna type bajo ninguna circunstancia, sin importar cómo llegó
  // a getItems(). Sin este gate, una sola fila corrupta en memoria bloquea TODO el batch de
  // saveBacklog() — incluyendo ítems legítimos no relacionados — porque Postgres rechaza el INSERT
  // completo, no solo la fila inválida.
  // INC-202607-009: tracker_items es exclusivamente para BACKLOG_TYPES (REQ/TKT/DISC) desde
  // TKT-202607-005 — ITIL (INC/PRB/KE/CHG) vive solo en tracker_incidents. El set anterior
  // incluía los 7 tipos canónicos del ecosistema, no los 3 válidos para ESTA tabla — permitía
  // que filas ITIL se escribieran aquí sin sla_priority (columna que no existe en tracker_items),
  // dejando remanentes que el merge de _loadFromSupabase volvía a traer a memoria en cada carga.
  const _VALID_ITEM_TYPES = new Set(['REQ', 'TKT', 'DISC']);

  const _rawItems = _getItems();

  // INC-[pendiente-ID]: auto-sincronizar status con incidentStatus para ítems tipo INC.
  // __BR-Core §4: incident_status reemplaza el ciclo pendiente→en-revision→done para ítems
  // ITIL — es la fuente de verdad del ciclo de vida real de un INC. chk_status_by_type (gate
  // más abajo) valida la columna genérica `status` contra _VALID_STATUS_BY_TYPE.INC, que
  // exige los mismos valores ITIL (detected/assigned/in_progress/...). Un INC creado o
  // patcheado en otro módulo con status:'pendiente' (default genérico) e incidentStatus
  // correctamente en 'detected' quedaba excluido del upsert — el ítem nunca se persistía
  // aunque su ciclo de vida ITIL fuera válido. Se corrige en el punto de guardado, mutando
  // el ítem en memoria (mismo patrón que el resto de este gate — el ítem no se descarta,
  // se corrige) para que la sincronización sobreviva más allá de esta sola llamada.
  _rawItems.forEach(it => {
    if (it.type === 'INC') {
      const _incStatus = it.incidentStatus || it.incident_status;
      if (_incStatus && it.status !== _incStatus) {
        console.warn(`[AI Tracker] saveBacklog: ítem ${it.code || '[sin code]'} — status:'${it.status}' desincronizado de incidentStatus:'${_incStatus}'. Sincronizando status antes de validar chk_status_by_type.`);
        it.status = _incStatus;
      }
    }
  });

  const items = _rawItems.filter(it => {
    if (it.status === 'historico') {
      console.warn(`[AI Tracker] saveBacklog: ítem ${it.code || '[sin code]'} excluido — status:historico es de solo lectura, asignado por Locus al cerrar sprint`);
      _dispatch('storage:item-excluded', { code: it.code || '[pendiente-ID]', type: it.type, reason: 'status:historico es de solo lectura' });
      return false;
    }
    // INC-[pendiente-ID]: excluir cualquier ítem con type no canónico — incluye el caso 'patch'
    // que originó el INC (tracker_items_type_check, 23514). Se excluye ANTES del gate de
    // status+type porque _VALID_STATUS_BY_TYPE[it.type] sería undefined para un type inválido,
    // y `if (_validStatuses && ...)` con _validStatuses undefined NO filtra — dejaba pasar
    // silenciosamente cualquier type corrupto. Este gate cierra ese hueco.
    // INC-202607-009: ITIL (INC/PRB/KE/CHG) es una exclusión esperada de esta tabla — no un
    // dato corrupto — desde que _VALID_ITEM_TYPES se acotó a BACKLOG_TYPES. Se distingue del
    // resto para no alarmar al founder con un toast de "dato corrupto" ante algo por diseño.
    if (['INC', 'PRB', 'KE', 'CHG'].includes(it.type)) {
      console.warn(`[AI Tracker] saveBacklog: ítem ${it.code || '[sin code]'} excluido de tracker_items — type:${it.type} es ITIL, vive exclusivamente en tracker_incidents.`);
      return false;
    }
    if (!_VALID_ITEM_TYPES.has(it.type)) {
      console.warn(`[AI Tracker] saveBacklog: ítem ${it.code || '[sin code]'} excluido del upsert — type:"${it.type}" no es un tipo canónico de tracker_items (REQ/TKT/DISC). Viola tracker_items_type_check.`);
      _dispatch('storage:item-excluded', { code: it.code || '[sin code]', type: it.type, reason: `type:"${it.type}" no es canónico — viola tracker_items_type_check` });
      setTimeout(() => showToast('error', `${it.code || '[sin code]'} no se guardó — type:"${it.type}" inválido (no canónico). Revisar con Rune — dato corrupto en memoria.`, null, 8000), 0);
      return false;
    }
    // B-202606-097: excluir combinaciones type+status que violarían chk_status_by_type en Postgres.
    // El ítem permanece en ITEMS en memoria — solo se bloquea del upsert hasta corrección.
    // B-[pendiente-ID]: toast visible agregado — antes esta exclusión era silenciosa para el
    // founder (solo console.warn + evento), lo que hizo invisible el fallo de persistencia
    // tras el patch R→done de Finn en B-202606-100.
    const _validStatuses = _VALID_STATUS_BY_TYPE[it.type];
    if (_validStatuses && !_validStatuses.has(it.status)) {
      console.warn(`[AI Tracker] saveBacklog: ítem ${it.code || '[sin code]'} excluido del upsert — type:${it.type} no puede tener status:${it.status} (viola chk_status_by_type)`);
      _dispatch('storage:item-excluded', { code: it.code || '[pendiente-ID]', type: it.type, reason: `type:${it.type} no puede tener status:${it.status} — viola chk_status_by_type` });
      setTimeout(() => showToast('warning', `${it.code || '[sin code]'} no se guardó — combinación type:${it.type}/status:${it.status} inválida (chk_status_by_type). Revisar con Rune.`, null, 8000), 0);
      return false;
    }
    return true;
  });

  // TKT-202607-044 (REQ-202607-015): INCIDENTS — array separado de ITEMS desde
  // TKT-202607-005, persiste en tabla propia tracker_incidents (no tracker_items).
  // Mismo criterio de gate que ITEMS — una fila de tipo o incident_status inválido
  // haría rechazar el batch completo en Postgres (chk_incident_status_by_type).
  const _VALID_INCIDENT_TYPES = new Set(['INC', 'PRB', 'KE', 'CHG']);
  const _VALID_INCIDENT_STATUS_BY_TYPE = {
    INC: new Set(['detected', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated_to_prb', 'escalated_to_chg', 'descartado']),
    PRB: new Set(['detected', 'in_progress', 'resolved', 'closed', 'descartado']),
    KE:  new Set(['active', 'resolved', 'descartado']),
    CHG: new Set(['pendiente', 'en-revision', 'done', 'descartado']),
  };
  const _rawIncidents = _getIncidents();
  const incidents = _rawIncidents.filter(inc => {
    const _incStatusRaw = inc.incidentStatus || inc.incident_status;
    if (_incStatusRaw === 'historico') {
      console.warn(`[AI Tracker] saveBacklog: incidente ${inc.code || '[sin code]'} excluido — incident_status:historico es de solo lectura, asignado por Locus al cerrar sprint`);
      return false;
    }
    if (!_VALID_INCIDENT_TYPES.has(inc.type)) {
      console.warn(`[AI Tracker] saveBacklog: incidente ${inc.code || '[sin code]'} excluido del upsert — type:"${inc.type}" no es un tipo canónico de incidente (INC/PRB/KE/CHG).`);
      return false;
    }
    const _validIncStatuses = _VALID_INCIDENT_STATUS_BY_TYPE[inc.type];
    if (_validIncStatuses && _incStatusRaw && !_validIncStatuses.has(_incStatusRaw)) {
      console.warn(`[AI Tracker] saveBacklog: incidente ${inc.code || '[sin code]'} excluido del upsert — type:${inc.type} no puede tener incident_status:${_incStatusRaw} (viola chk_incident_status_by_type)`);
      return false;
    }
    // INC-202607-[pendiente-ID]: sla_priority es NOT NULL en tracker_incidents y obligatorio
    // en todo INC/PRB/KE/CHG (__BR-Ecosystem §5). Sin este gate, _toIncidentRow() enviaba
    // sla_priority:null y Postgres rechazaba el batch completo (23502) en cada upsert —
    // loop de error en cada evento Realtime. Se excluye la fila (mismo tratamiento que type/
    // incident_status inválidos) en vez de asignar un default de negocio no solicitado.
    if (!inc.sla_priority) {
      console.warn(`[AI Tracker] saveBacklog: incidente ${inc.code || '[sin code]'} excluido del upsert — sla_priority ausente (viola NOT NULL de tracker_incidents). Requiere sla_priority declarado por Cael/Finn.`);
      return false;
    }
    return true;
  });

  const key = _tplKey('backlog-items');
  const incidentsKey = _tplKey('backlog-incidents');
  const projId = _getActiveProjectFilter();
  const metaKey = _tplKey('backlog-meta');
  const meta = JSON.parse(localStorage.getItem(metaKey) || '{}');
  // T-202606-103: timestamp único — un solo new Date().toISOString() reutilizado en
  // meta.updated y en el updated_at de cada fila del upsert relacional.
  // AC-3: _writeTs calculado una vez antes del upsert — las N filas del batch comparten
  // el mismo valor, sin llamadas adicionales a new Date().
  const _writeTs = new Date().toISOString();
  meta.updated = _writeTs;

  // Sin Supabase o sin auth → localStorage como único destino (sin cambio de comportamiento).
  if (!_supabase || !_supabaseUser) {
    // TKT-202607-044 / AC-3: respaldo optimista de INCIDENTS — best-effort, independiente
    // del flujo de recuperación de cuota de ITEMS (abajo) para no acoplar los dos arrays.
    try {
      localStorage.setItem(incidentsKey, JSON.stringify(incidents));
    } catch (incLsErr) {
      console.warn('[AI Tracker] saveBacklog: fallo al escribir respaldo local de incidentes (offline)', incLsErr);
    }
    try {
      localStorage.setItem(key, JSON.stringify(items));
      localStorage.setItem(metaKey, JSON.stringify(meta));
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.error('[AI Tracker] localStorage quota exceeded, attempting cleanup...');
        try {
          localStorage.removeItem(LOCUS_KEYS.CHANGELOG);
          localStorage.setItem(key, JSON.stringify(items));
          localStorage.setItem(metaKey, JSON.stringify(meta));
          showToast('warning', '⚠️ Cuota de almacenamiento crítica — se limpió historial');
        } catch (err2) {
          console.error('[AI Tracker] saveBacklog failed after cleanup:', err2);
          const _quotaBody =
            `<span class="toast-quota-actions">` +
              `<button class="toast-quota-btn" id="toast-quota-export">Exportar backlog</button>` +
              `<button class="toast-quota-btn" id="toast-quota-clean">Limpiar y reintentar</button>` +
            `</span>`;
          showToast('error', '❌ Almacenamiento lleno — el backlog no se guardó', _quotaBody);
          requestAnimationFrame(() => {
            const btnExport = document.getElementById('toast-quota-export');
            const btnClean  = document.getElementById('toast-quota-clean');
            if (btnExport) {
              btnExport.addEventListener('click', () => { exportBacklogMd(); }, { once: true });
            }
            if (btnClean) {
              btnClean.addEventListener('click', async () => {
                const purgeable = [LOCUS_KEYS.CHANGELOG, LOCUS_KEYS.NOTIF_HISTORY, LOCUS_KEYS.LOG_FILTERS];
                purgeable.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
                await saveBacklog();
              }, { once: true });
            }
          });
          return;
        }
      } else {
        console.error('[AI Tracker] saveBacklog error:', err);
        throw err;
      }
    }
    return;
  }

  // T-202606-008: upsert relacional — cada ítem es una fila en tabla items.
  // Las columnas que contienen arrays JS (ac, depends_on) se mapean a text[] de Postgres.
  // Las columnas que contienen objetos JS (intencion, contract_detail, no_incluye cuando es objeto)
  // se mapean a jsonb. Postgres aplica el CHECK constraint de status por type (T1).
  //
  // AC-1: upsert de ítem nuevo → 1 fila por code, sin tocar filas existentes.
  // AC-2: _setITEMS() modifica status → upsert actualiza solo esa fila por onConflict:code.
  // AC-3: _writeTs calculado una vez antes de este bloque — todas las filas del batch lo comparten.
  // AC-4 (edge case icebox/P): project_id se deriva de projId — sprint:'icebox' sigue en columna sprint.
  // AC-5 (contrato): saveBacklog() → void — ningún call site requiere cambio.

  // Construir filas para el upsert relacional. Los campos que Postgres espera como columnas
  // tipadas se mapean explícitamente; el resto se serializa en el campo jsonb `extra` si la
  // tabla lo tuviera (DDL de T1 no incluye `extra` — solo columnas declaradas).
  // T-202606-008 fix: columnas alineadas con DDL de tracker_items (T-202606-007).
  // Correcciones vs entrega inicial:
  //   · tabla: 'items' → 'tracker_items'
  //   · parent_id → parent   (nombre real de columna en DDL)
  //   · origen_p  → origin_p (naming DDL Gen1) → origen_disc (DDL Gen2)
  //   · verificado_por → verified_by (naming DDL)
  //   · contract_update eliminado — columna no existe en DDL
  //   · updated_at: ISO string → BIGINT epoch ms (tipo DDL: BIGINT)
  function _toItemRow(it) {
    return {
      // T-202606-026: user_id obligatorio en cada fila — RLS de tracker_items (T-202606-024)
      // filtra por user_id = auth.uid(). _supabaseUser está garantizado no-null en este punto
      // por el gate `if (!_supabase || !_supabaseUser) { ...; return; }` anterior en saveBacklog().
      user_id:              _supabaseUser.id,
      project_id:           projId || null,
      code:                 it.code             || null,
      type:                 it.type             || null,
      title:                it.title            || null,
      status:               it.status           || null,
      priority:             it.priority         || null,
      effort:               it.effort != null ? Number(it.effort) : null,
      area:                 it.area             || null,
      sprint:               it.sprint           || null,
      role:                 it.role             || null,
      // DDL: columna 'parent' TEXT (no 'parent_id') · T-[pendiente-ID]: parentId es el único
      // campo canónico en JS — fallback it.parent eliminado (REQ-unify-parent TKT2)
      parent:               it.parentId         || null,
      // depends_on: array JS → text[] Postgres · campo canónico en JS es dependsOn (camelCase)
      // INC triggered_by TKT-202607-063: leía it.depends_on — siempre undefined, persistía [] sin importar el dato real.
      depends_on:           Array.isArray(it.dependsOn) ? it.dependsOn : [],
      triggered_by:         it.triggered_by     || null,
      no_incluye:           it.no_incluye != null ? it.no_incluye : null,
      kill_criteria:        it.kill_criteria    || null,
      promovida_a:          it.promovida_a      || null,
      // DDL: columna renombrada origen_disc (Gen2) — era origin_p en Gen1
      origen_disc:          it.origenDisc       || null,
      discard_reason:       it.discard_reason   || null,
      comportamiento_actual: it.comportamiento_actual || null,
      origin_module:        it.origin_module    || null,
      // DDL: columna 'verified_by' TEXT (no 'verificado_por')
      verified_by:          it.verificado_por   || null,
      schema_version:       it.schema_version != null ? Number(it.schema_version) : 2,
      // ac: array JS → jsonb Postgres
      ac:                   Array.isArray(it.ac) ? it.ac : [],
      // intencion, contract_detail: objetos → jsonb Postgres
      // T-[pendiente-ID] (REQ-contract-rename, TKT2): contract_detail reemplaza a contract —
      // alineado a BR-Execution §2. Sin retrocompatibilidad — it.contract ya no se lee.
      intencion:            it.intencion        || null,
      contract_detail:      it.contract_detail  || null,
      // Campos Gen2 agregados en ALTER TABLE (T-[pendiente-ID])
      next_role:            it.nextRole          || null,
      design_intent:        it.designIntent      || null,
      blocked_at:           it.blockedAt         || null,
      contract_update:      it.contract_update   || null,
      archivos:             Array.isArray(it.archivos) ? it.archivos : null,
      sla_priority:         it.sla_priority      || null,
      sla_deadline:         it.slaDeadline       != null ? it.slaDeadline : null,
      incident_status:      it.incidentStatus    || it.incident_status || null,
      resolution_type:      it.resolutionType    || it.resolution_type || null,
      derived_items:        Array.isArray(it.derived_items) ? it.derived_items : null,
      queue:                it.queue             || null,
      // DDL: updated_at BIGINT (epoch ms) — no ISO string
      // _updatedAtMs calculado una vez fuera de _toItemRow — todas las filas comparten el mismo valor (AC-3)
      updated_at:           _updatedAtMs
    };
  }

  // TKT-202607-044 (REQ-202607-015): _toIncidentRow() — mapeo hacia las columnas reales
  // de tracker_incidents (verificadas vía information_schema — 18 columnas, schema propio
  // y más angosto que tracker_items: sin status/priority/effort/area/sprint/role/ac/parent/
  // depends_on, que no existen en esta tabla). onConflict:code — mismo target que _toItemRow().
  function _toIncidentRow(inc) {
    return {
      user_id:               _supabaseUser.id,
      project_id:            projId || null,
      code:                  inc.code               || null,
      type:                  inc.type               || null,
      title:                 inc.title              || null,
      triggered_by:          inc.triggered_by       || null,
      comportamiento_actual: inc.comportamiento_actual || null,
      origin_module:         inc.origin_module      || null,
      archivos:              Array.isArray(inc.archivos) ? inc.archivos : null,
      derived_items:         Array.isArray(inc.derived_items) ? inc.derived_items : null,
      sla_priority:          inc.sla_priority       || null,
      incident_status:       inc.incidentStatus     || inc.incident_status || null,
      resolution_type:       inc.resolutionType     || inc.resolution_type || null,
      discard_reason:        inc.discard_reason     || null,
      // Fix QA (Finn) — TKT-202607-044: sla_deadline es timestamptz en tracker_incidents
      // (confirmado vía information_schema.columns), no bigint. inc.slaDeadline vive en
      // memoria como epoch ms (ver _mapRowToIncident) — convertir a ISO string antes de
      // escribir o Postgres rechaza el upsert completo (invalid input syntax for type
      // timestamp with time zone). Defensivo ante string ya-ISO por si el ítem no pasó
      // aún por hidratación (creado client-side, sla_deadline sin normalizar todavía).
      sla_deadline: (() => {
        if (inc.slaDeadline == null) return null;
        if (typeof inc.slaDeadline === 'number') return new Date(inc.slaDeadline).toISOString();
        return inc.slaDeadline;
      })(),
      // Mismo _updatedAtMs que _toItemRow — un único timestamp de escritura para todo el CHECKPOINT.
      updated_at:            _updatedAtMs
    };
  }

  // AC-3: un único timestamp epoch para todas las filas del batch — calculado antes de map().
  // DDL: updated_at BIGINT (epoch ms). _writeTs (ISO) sigue siendo la referencia para
  // meta.updated y _realtimeLastTs — ambos usan string ISO por compatibilidad con el resto
  // de la app. _updatedAtMs es exclusivo del upsert a tracker_items.
  const _updatedAtMs = Date.now();

  // T-202606-097: registrar _realtimeLastTs ANTES del await — mismo patrón que _saveFlush().
  // Evita que el echo de Realtime de tracker_items dispare _loadFromSupabase() innecesariamente.
  _realtimeLastTs = _writeTs;

  // REQ-PERSIST-OPT TKT2: respaldo local optimista — ANTES del upsert, no después.
  // AC-1/AC-4: usa 'items' ya filtrado por el gate chk_status_by_type (arriba en esta función),
  // nunca _rawItems sin filtrar — un hard reload durante el upsert ya no pierde el dato,
  // y el respaldo nunca contiene combinaciones type+status inválidas.
  try {
    localStorage.setItem(key, JSON.stringify(items));
    localStorage.setItem(metaKey, JSON.stringify(meta));
  } catch (lsErr) {
    console.warn('[AI Tracker] saveBacklog: fallo al escribir respaldo local pre-upsert', lsErr);
  }

  // TKT-202607-044 / AC-3: respaldo local optimista de INCIDENTS — ANTES del upsert a
  // tracker_incidents, mismo momento que el respaldo de ITEMS arriba. Es la única garantía
  // de no pérdida de dato si el upsert de incidentes falla — sin reintento (ver más abajo).
  try {
    localStorage.setItem(incidentsKey, JSON.stringify(incidents));
  } catch (incLsErr) {
    console.warn('[AI Tracker] saveBacklog: fallo al escribir respaldo local de incidentes pre-upsert', incLsErr);
  }

  // B-[pendiente-ID]: incrementar contador in-flight ANTES del try — cubre toda la ventana
  // del upsert, no solo el caso de éxito. finally garantiza decremento incluso ante throw
  // no capturado por el catch interno (nunca debe quedar el contador desbalanceado).
  _saveBacklogInFlightCount++;
  try {
    const rows = items.map(_toItemRow);

    // B-202606-093: deduplicar por code antes del upsert — Postgres rechaza un batch con
    // el mismo code dos veces aunque onConflict esté declarado (viola unique constraint
    // dentro del mismo statement).
    // Último ítem del array gana en caso de duplicado (comportamiento estándar de Map).
    const _rowsMap = new Map();
    for (const row of rows) _rowsMap.set(row.code, row);
    const dedupedRows = Array.from(_rowsMap.values());
    if (dedupedRows.length < rows.length) {
      console.warn('[AI Tracker] saveBacklog: duplicados en ITEMS eliminados antes de upsert:', rows.length - dedupedRows.length);
    }

    // Upsert multi-fila en un único request — onConflict:code garantiza que una fila
    // existente se actualiza en lugar de duplicarse (AC-2).
    // DDL: tabla se llama tracker_items (no items) — T-202606-007.
    const { error } = await _supabase
      .from('tracker_items')
      .upsert(dedupedRows, { onConflict: 'code' });
    if (error) throw error;

    // Upsert exitoso → estampar _updatedAtMs en los objetos vivos de ITEMS.
    // B-[pendiente-ID]: _updatedAtMs solo se seteaba en la hidratación de _loadFromSupabase.
    // Cualquier _loadFromSupabase que completara después del upsert encontraba localRowTs=0
    // (o el timestamp de la hidratación anterior) — la fila remota ganaba con la versión
    // vieja (sin parentId, sin el status recién cambiado). El stamp aquí garantiza que el
    // merge posterior vea localRowTs >= remoteRowTs y conserve el estado local actualizado.
    // _rawItems contiene referencias directas a los objetos en el array vivo de ITEMS —
    // no es una copia, el stamp se refleja inmediatamente en _getItems().
    for (const it of _rawItems) it._updatedAtMs = _updatedAtMs;

    // REQ-PERSIST-OPT TKT2 / AC-2: localStorage ya tiene el respaldo desde antes del upsert
    // (ver bloque pre-upsert arriba) — sin escritura duplicada aquí.
    setSyncStatus('synced', '✓ sincronizado');
  } catch (err) {
    // T-202606-097: resetear _realtimeLastTs — el timestamp no llegó a Supabase.
    _realtimeLastTs = null;
    console.error('[AI Tracker] Supabase saveBacklog() failed:', err);
    setSyncStatus('offline', '✕ sin conexión');
    // REQ-PERSIST-OPT TKT2 / AC-3: localStorage ya tiene el respaldo desde antes del upsert
    // (ver bloque pre-upsert arriba) — sin escritura duplicada aquí.
    showToast('warning', '⚠️ Backlog no sincronizado con Supabase — guardado localmente');
    _offlineQueuePush({ type: 'backlog', projId: projId || null });
  } finally {
    // B-[pendiente-ID]: decrementar siempre — éxito, error, o cualquier throw imprevisto.
    _saveBacklogInFlightCount--;
  }

  // TKT-202607-044 (REQ-202607-015) / AC-1: upsert de INCIDENTS → tracker_incidents,
  // onConflict:code. Independiente del bloque de ITEMS arriba — un fallo aquí no revierte
  // ni bloquea el upsert de ITEMS ya confirmado, y viceversa (tablas distintas, sin
  // transacción compartida). AC-3: a diferencia de ITEMS, un fallo de upsert de incidentes
  // no se encola en _offlineQueuePush — sin reintento. El respaldo local optimista escrito
  // arriba (pre-upsert) es la única garantía de no pérdida de dato hasta el siguiente
  // saveBacklog() exitoso.
  try {
    const incidentRows = incidents.map(_toIncidentRow);
    const _incRowsMap = new Map();
    for (const row of incidentRows) _incRowsMap.set(row.code, row);
    const dedupedIncidentRows = Array.from(_incRowsMap.values());
    if (dedupedIncidentRows.length < incidentRows.length) {
      console.warn('[AI Tracker] saveBacklog: duplicados en INCIDENTS eliminados antes de upsert:', incidentRows.length - dedupedIncidentRows.length);
    }
    if (dedupedIncidentRows.length > 0) {
      const { error: incError } = await _supabase
        .from('tracker_incidents')
        .upsert(dedupedIncidentRows, { onConflict: 'code' });
      if (incError) throw incError;
    }
  } catch (incErr) {
    console.error('[AI Tracker] Supabase saveBacklog() — upsert de tracker_incidents falló:', incErr);
    showToast('warning', '⚠️ Incidentes no sincronizados con Supabase — guardado localmente');
  }
}

// TKT5 (REQ-202607-015): deleteIncidentRows() — elimina filas de tracker_incidents por code.
// Invocar exclusivamente después de que saveHistoricoItems() haya completado sin error para
// el batch que incluye esos incidentes (orden de operaciones: write antes que delete — ver
// _scmExecuteClose en locus-backlog-sprints.js). Un fallo aquí no revierte el cierre del
// sprint que la invoca — el incidente migrado queda temporalmente duplicado (visible en
// tracker_items historico y en tracker_incidents) hasta reintento. Elimina exclusivamente
// por code, exclusivamente en tracker_incidents — nunca toca tracker_items. Sin cambio de
// firma respecto al contrato declarado: deleteIncidentRows(codes) → void.
export async function deleteIncidentRows(codes) {
  const list = Array.isArray(codes) ? codes.filter(Boolean) : [];
  if (!list.length) return;
  // Sin Supabase o sin auth → nada que eliminar remotamente. El incidente permanece en
  // memoria/localStorage — no hay tracker_incidents que limpiar en modo offline.
  if (!_supabase || !_supabaseUser) return;
  const { error } = await _supabase
    .from('tracker_incidents')
    .delete()
    .eq('user_id', _supabaseUser.id)
    .in('code', list);
  if (error) throw error;
}

// INC-[pendiente-ID] TKT-fix: _mapRowToItem() — única fuente del mapeo de columnas
// DDL (snake_case, tracker_items) → campos JS canónicos del schema de ítems (camelCase
// donde aplica: parentId, nextRole, designIntent, blockedAt, incidentStatus, etc.).
// Extraída del bloque inline que ya usaba la rehidratación de ítems activos (merge en
// _loadFromSupabase) — mismo contrato, sin cambio de comportamiento para esa ruta.
// Reusada por getHistoricoItems() para que los ítems historico también lleguen con
// parentId poblado — sin este mapeo, _buildChildMap() (locus-backlog-render.js) no
// puede agrupar TKT/INC historico bajo su REQ y el árbol renderiza plano.
// contract: pure — no I/O, no mutación de argumento, mismo `row` → mismo `item` siempre.
function _mapRowToItem(row) {
  return {
    code:                  row.code,
    type:                  row.type,
    title:                 row.title,
    status:                row.status,
    priority:              row.priority,
    effort:                row.effort,
    area:                  row.area,
    sprint:                row.sprint,
    role:                  row.role,
    // T-[pendiente-ID]: parentId es el único campo canónico en JS (REQ-unify-parent TKT2).
    // 'parent' solo existe como nombre de columna en Supabase — se mapea aquí directo
    // a parentId, sin persistir item.parent en memoria.
    parentId:              row.parent,       // DDL: columna parent TEXT
    // 'depends_on' solo existe como nombre de columna en Supabase — se mapea aquí directo
    // a dependsOn, campo canónico en JS. INC triggered_by TKT-202607-063: este load asignaba
    // depends_on (snake_case) al ítem en memoria, dejándolo sin el campo dependsOn que el
    // resto del app consume — se perdía tras cada reload.
    dependsOn:             Array.isArray(row.depends_on) ? row.depends_on : [],
    triggered_by:          row.triggered_by,
    no_incluye:            row.no_incluye,
    kill_criteria:         row.kill_criteria,
    promovida_a:           row.promovida_a,
    origen_disc:           row.origen_disc,
    discard_reason:        row.discard_reason,
    comportamiento_actual: row.comportamiento_actual,
    origin_module:         row.origin_module,
    verificado_por:        row.verified_by,  // DDL: verified_by → JS: verificado_por
    schema_version:        row.schema_version,
    ac:                    Array.isArray(row.ac) ? row.ac : [],
    intencion:             row.intencion,
    // T-[pendiente-ID] (REQ-contract-rename, TKT2): rehidratación lee contract_detail.
    contract_detail:       row.contract_detail,
    nextRole:              row.next_role,
    designIntent:          row.design_intent,
    blockedAt:             row.blocked_at,
    contract_update:       row.contract_update,
    archivos:              Array.isArray(row.archivos) ? row.archivos : null,
    sla_priority:          row.sla_priority,
    // TKT-A1: Gen2 — campos ITIL con naming camelCase interno
    incidentStatus:        row.incident_status || null,
    resolutionType:        row.resolution_type || null,
    derived_items:         Array.isArray(row.derived_items) ? row.derived_items : null,
    queue:                 row.queue           || null,
    createdAt:             row.created_at      || null,
    // TKT-A1: sla_deadline calculado al hidratar si sla_priority presente y sla_deadline ausente
    // AC: sla_priority:high → createdAt+86400000ms; medium → createdAt+259200000ms; low → null
    // Base: row.created_at (bigint epoch ms, NOT NULL en DDL de tracker_items)
    slaDeadline: (() => {
      if (row.sla_deadline != null) return row.sla_deadline;
      if (!row.sla_priority) return null;
      const _base = row.created_at || null;
      if (!_base) return null;
      if (row.sla_priority === 'high')   return _base + 86400000;
      if (row.sla_priority === 'medium') return _base + 259200000;
      return null;
    })(),
    _updatedAtMs:          row.updated_at    // conservar timestamp para comparaciones futuras
  };
}

// TKT-202607-044 (REQ-202607-015): _mapRowToIncident() — mapeo de columnas DDL de
// tracker_incidents (snake_case) → campos JS canónicos de INCIDENTS (camelCase donde
// aplica: incidentStatus, resolutionType, createdAt, slaDeadline) — mismo patrón que
// _mapRowToItem(). tracker_incidents tiene schema propio, más angosto que tracker_items
// (sin status/priority/effort/area/sprint/role/ac/parent — esos campos no existen en
// esta tabla, ver columnas reales verificadas: archivos, code, comportamiento_actual,
// created_at, derived_items, discard_reason, id, incident_status, origin_module,
// project_id, resolution_type, sla_deadline, sla_priority, title, triggered_by, type,
// updated_at, user_id).
// Fix QA (Finn) — TKT-202607-044: created_at y sla_deadline son timestamptz en
// tracker_incidents (confirmado vía information_schema.columns) — NO bigint como en
// tracker_items. A diferencia de _mapRowToItem, aquí normalizamos a epoch ms con
// Date.parse/getTime al leer, para que createdAt/slaDeadline en INCIDENTS sean del mismo
// tipo (number epoch ms) que en ITEMS — cualquier lógica compartida de SLA (__BR-Core §6)
// no necesita discriminar por tipo de origen. Solo updated_at es bigint aquí — sin cambio.
function _mapRowToIncident(row) {
  return {
    code:                  row.code,
    type:                  row.type,
    title:                 row.title,
    triggered_by:          row.triggered_by,
    comportamiento_actual: row.comportamiento_actual,
    origin_module:         row.origin_module,
    archivos:              Array.isArray(row.archivos) ? row.archivos : null,
    derived_items:         Array.isArray(row.derived_items) ? row.derived_items : null,
    sla_priority:          row.sla_priority,
    incidentStatus:        row.incident_status || null,
    resolutionType:        row.resolution_type || null,
    discard_reason:        row.discard_reason,
    // timestamptz → epoch ms. row.created_at llega como ISO string desde Supabase.
    createdAt:             row.created_at != null ? new Date(row.created_at).getTime() : null,
    // Mismo cálculo derivado que _mapRowToItem en intención — pero con base epoch ms
    // normalizada desde ISO string (timestamptz), no un bigint crudo como en tracker_items.
    // sla_deadline explícito tiene precedencia; si ausente, se calcula desde createdAt +
    // ventana de sla_priority.
    slaDeadline: (() => {
      if (row.sla_deadline != null) return new Date(row.sla_deadline).getTime();
      if (!row.sla_priority) return null;
      const _base = row.created_at != null ? new Date(row.created_at).getTime() : null;
      if (_base == null) return null;
      if (row.sla_priority === 'high')   return _base + 86400000;
      if (row.sla_priority === 'medium') return _base + 259200000;
      return null;
    })(),
    // updated_at SÍ es bigint en tracker_incidents (confirmado) — sin transformación.
    _updatedAtMs:          row.updated_at
  };
}

// ── storage para ítems status:historico ──────────────────────────────────────
// Fuente canónica: tracker_items con status:'historico' — una fila por ítem,
// misma tabla que los ítems activos. tracker_backlog JSONB legacy eliminado
// como destino de escritura. localStorage mantiene clave _HISTORICO_KEY como
// caché optimista y fallback sin auth — misma mecánica que antes.
// saveBacklog() no lee ni escribe este storage — ver gate de exclusión ahí mismo.
const _HISTORICO_KEY = 'tracker-backlog-historico';

// Escribe el array de ítems historico en tracker_items — Supabase primero,
// localStorage como caché optimista pre-upsert y fallback ante fallo de red.
export async function saveHistoricoItems(items) {
  const projId = _getActiveProjectFilter();
  const suffix = projId ? '-' + projId : '-global';
  const key = _HISTORICO_KEY + suffix;

  // Deduplicar por code — último ítem del array gana en caso de duplicado.
  const _raw = Array.isArray(items) ? items : [];
  const _dedupMap = new Map();
  for (const it of _raw) _dedupMap.set(it.code, it);
  const payload = Array.from(_dedupMap.values());
  if (payload.length < _raw.length) {
    console.warn(`[AI Tracker] saveHistoricoItems: duplicados eliminados antes de upsert: ${_raw.length - payload.length}`);
  }

  // Sin Supabase o sin auth → localStorage como único destino.
  if (!_supabase || !_supabaseUser) {
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveHistoricoItems: fallo al escribir en localStorage (sin auth)', lsErr);
    }
    return;
  }

  // Respaldo local optimista — ANTES del upsert.
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (lsErr) {
    console.warn('[AI Tracker] saveHistoricoItems: fallo al escribir respaldo local pre-upsert', lsErr);
  }

  try {
    // _realtimeLastTs en epoch ms — mismo formato que tracker_items (BIGINT).
    // Registrar ANTES del await para cubrir el echo de Realtime.
    const _updatedAtMs = Date.now();
    _realtimeLastTs = _updatedAtMs;

    // Mapear con el mismo DDL que saveBacklog()._toItemRow() — columnas exactas de tracker_items.
    const rows = payload.map(it => ({
      user_id:               _supabaseUser.id,
      project_id:            projId || null,
      code:                  it.code              || null,
      type:                  it.type              || null,
      title:                 it.title             || null,
      status:                'historico',
      priority:              it.priority          || null,
      effort:                it.effort != null ? Number(it.effort) : null,
      area:                  it.area              || null,
      sprint:                it.sprint            || null,
      role:                  it.role              || null,
      parent:                it.parentId          || null,
      // INC triggered_by TKT-202607-063: leía it.depends_on — campo canónico en JS es dependsOn.
      depends_on:            Array.isArray(it.dependsOn) ? it.dependsOn : [],
      triggered_by:          it.triggered_by      || null,
      no_incluye:            it.no_incluye        != null ? it.no_incluye : null,
      kill_criteria:         it.kill_criteria     || null,
      promovida_a:           it.promovida_a       || null,
      origen_disc:           it.origenDisc        || null,
      discard_reason:        it.discard_reason    || null,
      comportamiento_actual: it.comportamiento_actual || null,
      origin_module:         it.origin_module     || null,
      verified_by:           it.verificado_por    || null,
      schema_version:        it.schema_version != null ? Number(it.schema_version) : 2,
      ac:                    Array.isArray(it.ac) ? it.ac : [],
      intencion:             it.intencion         || null,
      // T-[pendiente-ID] (REQ-contract-rename, TKT5): contract_detail reemplaza a contract —
      // mismo mapeo paralelo a _toItemRow() (TKT2), no unificado (deuda distinta, no_incluye).
      contract_detail:       it.contract_detail   || null,
      next_role:             it.nextRole          || null,
      design_intent:         it.designIntent      || null,
      blocked_at:            it.blockedAt         || null,
      contract_update:       it.contract_update   || null,
      archivos:              Array.isArray(it.archivos) ? it.archivos : null,
      sla_priority:          it.sla_priority      || null,
      sla_deadline:          it.slaDeadline       != null ? it.slaDeadline : null,
      incident_status:       it.incidentStatus    || it.incident_status || null,
      resolution_type:       it.resolutionType    || it.resolution_type || null,
      derived_items:         Array.isArray(it.derived_items) ? it.derived_items : null,
      queue:                 it.queue             || null,
      updated_at:            _updatedAtMs,
    }));

    // onConflict:code — mismo target que saveBacklog()._toItemRow() (T-202606-007).
    // tracker_items no tiene constraint sobre (user_id,code); usar ese par aquí
    // produce 42P10 (no unique/exclusion constraint matching ON CONFLICT).
    const { error } = await _supabase
      .from('tracker_items')
      .upsert(rows, { onConflict: 'code' });
    if (error) throw error;
  } catch (err) {
    _realtimeLastTs = null;
    console.error('[AI Tracker] Supabase saveHistoricoItems() failed:', err);
    showToast('warning', '⚠️ Histórico no sincronizado con Supabase — guardado localmente');
    _offlineQueuePush({ type: 'historico', projId: projId || null });
  }
}

// Lee el array de ítems historico desde tracker_items — nunca mezclados con ITEMS activos.
// Preferencia: Supabase si hay sesión activa, localStorage como fallback/caché.
// INC-[pendiente-ID]: signature_change: false — projId es param opcional. Sin projId,
// mismo comportamiento que antes (_getActiveProjectFilter()). Con projId explícito,
// permite lectura cross-proyecto — requerido por locus-analytics-core.js, que itera
// todos los proyectos, no solo el activo.
export async function getHistoricoItems(projId) {
  const _effProjId = projId !== undefined ? projId : _getActiveProjectFilter();
  const suffix = _effProjId ? '-' + _effProjId : '-global';
  const key = _HISTORICO_KEY + suffix;

  let result = [];
  if (_supabase && _supabaseUser) {
    try {
      const query = _effProjId
        ? _supabase
            .from('tracker_items')
            .select('*')
            .eq('user_id', _supabaseUser.id)
            .eq('project_id', _effProjId)
            .eq('status', 'historico')
        : _supabase
            .from('tracker_items')
            .select('*')
            .eq('user_id', _supabaseUser.id)
            .eq('status', 'historico');
      const { data, error } = await query;
      if (error) throw error;
      const rawRows = Array.isArray(data) ? data : [];
      // INC-[pendiente-ID] TKT-fix: mapear filas crudas → schema JS antes de cachear/retornar.
      // localStorage conserva las filas crudas (fidelidad con la fila de Supabase para
      // fallback offline) — el mapeo se aplica en cada lectura, sea remota o local.
      try { localStorage.setItem(key, JSON.stringify(rawRows)); } catch (_) {}
      result = rawRows.map(_mapRowToItem);
      _historicoCache.set(_effProjId || '__global__', result);
      return result;
    } catch (err) {
      console.warn('[AI Tracker] getHistoricoItems: fallo Supabase, usando localStorage', err);
    }
  }

  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    const rawRows = Array.isArray(parsed) ? parsed : [];
    result = rawRows.map(_mapRowToItem);
  } catch (_) {
    result = [];
  }
  _historicoCache.set(_effProjId || '__global__', result);
  return result;
}

// INC-[pendiente-ID]: cache sync de ítems historico — evita N llamadas async por render
// (sparklines de analytics, archivo histórico, export de retro). Poblado por
// refreshHistoricoCache(); leído sync por getHistoricoItemsSync(). Invalidado en los
// 2 puntos de escritura conocidos: cierre de sprint (locus-backlog-sprints.js) y
// purga manual (locus-backlog-core.js purgeAllHistorico) — ver _invalidateHistoricoCache.
const _historicoCache = new Map(); // key: projId || '__global__' → items[]

// Refresca el cache para un proyecto (o el activo, si se omite). Llamar UNA VEZ por
// entrada de render — no dentro de loops de intervalo/proyecto. Los consumidores leen
// después vía getHistoricoItemsSync(), sin I/O adicional.
export async function refreshHistoricoCache(projId) {
  await getHistoricoItems(projId);
}

// Lectura sync desde el cache — [] si aún no se refrescó para ese projId. Nunca dispara I/O;
// si el cache está vacío es responsabilidad del caller haber llamado refreshHistoricoCache antes.
export function getHistoricoItemsSync(projId) {
  const _effProjId = projId !== undefined ? projId : _getActiveProjectFilter();
  return _historicoCache.get(_effProjId || '__global__') || [];
}

// Invalida el cache tras una escritura conocida. Sin projId → invalida todo (uso: purga global).
// Con projId → invalida solo ese proyecto (uso: cierre de sprint del proyecto activo).
export function _invalidateHistoricoCache(projId) {
  if (projId === undefined) { _historicoCache.clear(); return; }
  _historicoCache.delete(projId || '__global__');
}
// ── END T-202606-105 ──────────────────────────────────────────────────────────

// R-202604-035: saveContextDocs() — escribe en tracker_docs
export async function saveContextDocs() {
  const projId = _getActiveProjectFilter();
  const suffix = projId ? '-' + projId : '-global';

  const ctxPayload = {
    raw:      localStorage.getItem(_tplKey('context-raw'))      || '',
    sections: localStorage.getItem(_tplKey('context-sections')) || '[]',
    meta:     localStorage.getItem(_tplKey('context-meta'))     || '{}'
  };
  const hmPayload = {
    raw:      localStorage.getItem(_tplKey('html-map-raw'))      || '',
    sections: localStorage.getItem(_tplKey('html-map-sections')) || '[]',
    meta:     localStorage.getItem(_tplKey('html-map-meta'))     || '{}'
  };

  // AC-8 R-C1: sin Supabase o sin auth → localStorage como único destino.
  if (!_supabase || !_supabaseUser) {
    try {
      localStorage.setItem(LOCUS_KEYS.CTX_DOCS_PREFIX + suffix, JSON.stringify(ctxPayload));
      localStorage.setItem(LOCUS_KEYS.HM_DOCS_PREFIX  + suffix, JSON.stringify(hmPayload));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveContextDocs: fallo al escribir en localStorage (sin auth)', lsErr);
    }
    return;
  }

  // REQ-PERSIST-OPT TKT3: respaldo local optimista — ANTES del upsert, no después.
  try {
    localStorage.setItem(LOCUS_KEYS.CTX_DOCS_PREFIX + suffix, JSON.stringify(ctxPayload));
    localStorage.setItem(LOCUS_KEYS.HM_DOCS_PREFIX  + suffix, JSON.stringify(hmPayload));
  } catch (lsErr) {
    console.warn('[AI Tracker] saveContextDocs: fallo al escribir respaldo local pre-upsert', lsErr);
  }

  try {
    const { error } = await _supabase.from('tracker_docs').upsert([
      { user_id: _supabaseUser.id, key: 'context' + suffix, value: ctxPayload, updated_at: new Date().toISOString() },
      { user_id: _supabaseUser.id, key: 'htmlmap' + suffix, value: hmPayload,  updated_at: new Date().toISOString() }
    ], { onConflict: 'user_id,key' });
    if (error) throw error;
    // REQ-PERSIST-OPT TKT3 / AC-2: localStorage ya tiene el respaldo desde antes del upsert —
    // sin escritura duplicada aquí.
  } catch (err) {
    // AC-7 R-C1: upsert falla → encolar + toast. Respaldo local ya existe desde antes del upsert.
    console.error('[AI Tracker] Supabase saveContextDocs() failed:', err);
    setSyncStatus('offline', '✕ sin conexión');
    // REQ-PERSIST-OPT TKT3 / AC-3: localStorage ya tiene el respaldo desde antes del upsert —
    // sin escritura duplicada aquí.
    showToast('warning', '⚠️ Context/HTML-MAP no sincronizado con Supabase — guardado localmente');
    _offlineQueuePush({ type: 'docs' });
  }
}

// ── GRUPO 3 — SYNC Y REALTIME ─────────────────────────────────────────────────

// T-202606-002: suscribe tracker_state y tracker_sessions a Realtime.
// Cuando otro dispositivo guarda en cualquiera de las tres tablas, este cliente recarga
// el estado remoto completo vía _loadFromSupabase(). Throttle: ignora eventos originados
// en este mismo cliente (_realtimeLastTs). Fallback: si la suscripción a alguna tabla
// falla, el resto de la app sigue funcional vía localStorage/poll.
export function _subscribeRealtime() {
  if (!_supabase || !_supabaseUser) return;
  // INC-[pendiente-ID] (triggered_by hallazgo fuera de scope, cierre INC-202607-009):
  // supabase-js re-emite INITIAL_SESSION en cada _recoverAndRefresh (visibilitychange/foco
  // de pestaña), lo que llamaba a _subscribeRealtime() muchas veces por sesión larga.
  // unsubscribe+resubscribe en cada llamada dependía de que removeChannel() limpiara a
  // tiempo (try/catch silencioso más abajo) — si la desuscripción no terminaba antes de la
  // siguiente llamada, el canal viejo quedaba zombie recibiendo el mismo broadcast, y se
  // acumulaba uno más por cada auth event repetido (~150 duplicados del mismo evento en
  // sesiones de horas). Fix: idempotencia — mismo usuario + canales ya activos → no-op.
  // Solo se recrean los canales si el usuario cambió o no hay canales activos.
  if (_realtimeChannels.length > 0 && _realtimeSubscribedFor === _supabaseUser.id) return;
  _unsubscribeRealtime(); // limpiar canales previos si existen (usuario distinto o estado inconsistente)

  // Manejador compartido: recibe payload de cualquiera de las tres tablas.
  // Si el updated_at es el mismo que el último write local, ignora para evitar reload-loop.
  // B-202606-094 fix: updated_at llega en dos formatos según la tabla — ISO string
  // (tracker_state) o epoch ms BIGINT (tracker_items). _realtimeLastTs
  // se fija en saveBacklog()/_saveFlush()/saveHistoricoItems() en formatos distintos según
  // el path de escritura. Comparar sin normalizar nunca igualaba para el path de
  // tracker_items — el guard de throttle no detenía nada y cada saveBacklog() dejaba la
  // puerta abierta a un _loadFromSupabase() disparado por cualquier evento de las otras
  // tablas. _toEpochMs() normaliza ambos lados a epoch ms antes de comparar.
  function _toEpochMs(ts) {
    if (typeof ts === 'number') return ts;
    const parsed = Date.parse(ts);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function _handleRemoteChange(payload) {
    const remoteTs = payload.new?.updated_at;
    if (!remoteTs) return;
    const remoteMs = _toEpochMs(remoteTs);
    const lastMs   = _toEpochMs(_realtimeLastTs);
    if (remoteMs != null && lastMs != null && remoteMs === lastMs) return;

    // Opción A — ignorar heartbeat de tracker_state.
    // tracker_state recibe UPDATEs periódicos (~7s) sin acción del usuario — trigger
    // moddatetime o echo del propio _saveFlush. Si el UPDATE llega más de
    // _USER_ACTION_WINDOW_MS después de la última acción de usuario → es heartbeat → ignorar.
    // tracker_sessions no se filtra: ese canal solo recibe UPDATEs
    // cuando hay cambios genuinos de contenido (no tienen trigger de heartbeat propio).
    if (payload.table === 'tracker_state') {
      const msSinceAction = Date.now() - _lastUserActionTs;
      if (msSinceAction > _USER_ACTION_WINDOW_MS) {
        // Silencioso — no loggear para no contaminar la consola con los heartbeats ignorados
        return;
      }
    }

    console.log('[AI Tracker] Realtime: cambio remoto detectado —', payload.table || '', remoteTs);
    _loadFromSupabase();
  }

  // INC-[pendiente-ID]: handler compartido de status de canal. Antes, CHANNEL_ERROR solo
  // hacía console.warn — _realtimeChannels seguía con length > 0 y _realtimeSubscribedFor
  // seguía apuntando al mismo user.id, así que el guard de idempotencia de arriba
  // (`if (_realtimeChannels.length > 0 && _realtimeSubscribedFor === _supabaseUser.id) return;`)
  // convertía en no-op la siguiente llamada a _subscribeRealtime() (disparada por
  // INITIAL_SESSION en foco/visibilitychange) y el canal muerto nunca se reemplazaba —
  // la sesión se quedaba sin Realtime para esa tabla hasta reload manual. Fix: ante
  // CHANNEL_ERROR/TIMED_OUT/CLOSED, remover el canal caído del tracking y resetear
  // _realtimeSubscribedFor a null para que la próxima llamada reconecte los tres canales.
  function _handleChannelStatus(channelName, getCh) {
    // INC-[pendiente-ID] (triggered_by hallazgo fuera de scope, RangeError stack overflow):
    // removeChannel(ch) llamado sincrónicamente dentro de este mismo callback de status
    // reentraba — supabase-js dispara CLOSED de nuevo como parte del propio cierre del
    // canal, dentro del mismo _trigger, volviendo a entrar a este callback y a llamar
    // removeChannel() sobre el mismo canal indefinidamente hasta agotar el stack.
    // Fix: (a) guard `handled` — este canal se procesa una sola vez por ciclo de error,
    // (b) removeChannel() diferido con setTimeout(0) para salir de la pila síncrona del
    // propio _trigger del canal antes de pedirle que se remueva a sí mismo.
    let handled = false;
    return (status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        if (handled) return;
        handled = true;
        console.warn('[AI Tracker] Realtime: error en canal ' + channelName + ' — app sigue funcional vía fallback, reintentando en próximo evento de auth');
        const ch = getCh();
        _realtimeChannels = _realtimeChannels.filter((c) => c !== ch);
        _realtimeSubscribedFor = null;
        if (ch) {
          setTimeout(() => { try { _supabase.removeChannel(ch); } catch(e) {} }, 0);
        }
      }
    };
  }

  // Canal 1 — tracker_state (existente)
  const chState = _supabase
    .channel('tracker-state-' + _supabaseUser.id)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tracker_state', filter: 'user_id=eq.' + _supabaseUser.id },
      _handleRemoteChange
    )
    .subscribe(_handleChannelStatus('tracker_state', () => chState));

  // Canal 2 — tracker_sessions (T-202606-002)
  const chSessions = _supabase
    .channel('tracker-sessions-' + _supabaseUser.id)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tracker_sessions', filter: 'user_id=eq.' + _supabaseUser.id },
      _handleRemoteChange
    )
    .subscribe(_handleChannelStatus('tracker_sessions', () => chSessions));

  // Canal 3 — tracker_items ([tmp:req-realtime-items] TKT1)
  // Sin filtro de heartbeat — tracker_items no tiene trigger periódico propio, mismo
  // patrón que Canal 2. El guard anti-loop ya existente (_saveBacklogInFlightCount +
  // comparación _realtimeLastTs en _handleRemoteChange, línea ~1560) cubre este canal
  // sin necesidad de código adicional — ver comentario en _saveBacklogInFlightCount
  // (línea ~736) que documentaba este gap antes de esta entrega.
  const chItems = _supabase
    .channel('tracker-items-' + _supabaseUser.id)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tracker_items', filter: 'user_id=eq.' + _supabaseUser.id },
      _handleRemoteChange
    )
    .subscribe(_handleChannelStatus('tracker_items', () => chItems));

  _realtimeChannels = [chState, chSessions, chItems];
  _realtimeSubscribedFor = _supabaseUser.id;
}

export function _unsubscribeRealtime() {
  // T-202606-002 + [tmp:req-realtime-items] TKT1: limpiar todos los canales registrados
  // (tracker_state, tracker_sessions, tracker_items)
  for (const ch of _realtimeChannels) {
    try { _supabase.removeChannel(ch); } catch(e) {}
  }
  _realtimeChannels = [];
  _realtimeSubscribedFor = null;
}

// _resetExpiredInternal — uso exclusivo de locus-storage.js.
// La versión exportada (fuente canónica) vive en locus-sesiones-utils.js.
// No importar desde sesiones-utils — crearía ciclo (sesiones-utils → storage → sesiones-utils).
function _resetExpiredInternal(resetTime, resetEpoch) {
  if (resetEpoch && typeof resetEpoch === 'number') {
    return Date.now() >= resetEpoch;
  }
  if (resetTime && typeof resetTime === 'string') {
    const parts = resetTime.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const reset = new Date();
      reset.setHours(parts[0], parts[1], 0, 0);
      return Date.now() >= reset.getTime();
    }
  }
  return false;
}

// _resetWorker — único punto de mutación de estado exhausted → available.
// Todos los call sites de reset deben pasar por aquí.
// Registra availableSince para que _isInSession pueda comparar sin depender de resetEpoch.
export function _resetWorker(ai) {
  ai.status      = 'available';
  ai.resetTime   = '';
  ai.resetEpoch  = null;
  ai.availableSince = Date.now();
}

// R-202605-022 Fase 3 AC-2: lock anti-doble-load — previene cargas concurrentes de _loadFromSupabase.
// onAuthStateChange(INITIAL_SESSION) + getSession() pueden disparar en paralelo;
// el segundo disparo detecta el flag activo y sale como no-op.
let _loadFromSupabaseInFlight = false;

// B-202606-028: flag que indica que _initApp() completó la inyección de referencias.
// _loadFromSupabase puede dispararse via onAuthStateChange antes de _initApp —
// en ese caso _getItems aún es el fallback [] y emitiría un warn incorrecto.
// El retry de 200ms entra limpio una vez que _initApp termina.
let _appReady = false;

// T-202606-101: contador y límite de retries para el guard _appReady.
// Previene acumulación indefinida de setTimeouts si _initApp nunca completa.
const _LOAD_RETRY_MAX = 50; // 50 × 200ms = 10 segundos de espera máxima
let _loadRetryCount = 0;

export async function _loadFromSupabase() {
  // AC-9 R-C2: si hay un write local pendiente en debounce, el state local es más reciente
  // que Supabase — cancelar la carga para evitar rollback silencioso del estado volátil.
  if (_saveDebounceTimer !== null) return;

  // B-202606-028 / T-202606-101: si _initApp aún no completó la inyección de referencias,
  // _getItems sigue siendo el fallback [] — postergar 200ms y reintentar.
  // Guard de salida: detener retries tras _LOAD_RETRY_MAX intentos (~10 s) para
  // evitar acumulación indefinida de setTimeouts cuando _appReady nunca se activa.
  if (!_appReady) {
    if (_loadRetryCount >= _LOAD_RETRY_MAX) {
      console.error('[AI Tracker] _loadFromSupabase: _appReady no se activó tras ' + _LOAD_RETRY_MAX + ' intentos — retries detenidos.');
      _loadRetryCount = 0;
      return;
    }
    _loadRetryCount++;
    setTimeout(_loadFromSupabase, 200);
    return;
  }
  _loadRetryCount = 0; // resetear contador al entrar limpio

  // R-202605-022 Fase 3 AC-2: guard anti-doble-load — el segundo disparo es no-op.
  if (_loadFromSupabaseInFlight) return;
  _loadFromSupabaseInFlight = true;

  const authUser = await (_supabaseReady || Promise.resolve(null));
  if (!authUser) {
    setSyncStatus('local', '☁ conectar');
    _loadFromSupabaseInFlight = false;
    return;
  }

  // R-202605-022 Fase 3 AC-1: snapshot del estado antes de cualquier mutación.
  // Si _loadFromSupabase falla a mitad, restauramos getItems() y state al estado previo.
  // T-202605-084: structuredClone garantiza deep clone — Object.assign shallow no es suficiente
  // para objetos anidados como items[i].ac o items[i].intencion.
  const _itemsRef = _getItems();
  const _itemsSnapshot = _itemsRef ? structuredClone(_itemsRef) : null;
  // TKT-202607-044 (REQ-202607-015): snapshot de INCIDENTS — mismo mecanismo de rollback
  // que ITEMS, para que un fallo a mitad de carga restaure ambos arrays.
  const _incidentsRef = _getIncidents();
  const _incidentsSnapshot = _incidentsRef ? structuredClone(_incidentsRef) : null;
  const _stateSnapshot = structuredClone(state);

  try {
    setSyncStatus('syncing', '⟳ sincronizando');

    // ── 1. Cargar state/main (secuencial — popula state.projects para batches siguientes) ──
    const { data: stateRows, error: stateErr } = await _supabase
      .from('tracker_state')
      .select('value')
      .eq('user_id', _supabaseUser.id)
      .eq('key', 'main')
      .maybeSingle();
    if (stateErr) throw stateErr;

    if (stateRows && stateRows.value) {
      const remote = stateRows.value;
      _applyStateData(remote);
      // TKT1 · REQ-sprints-migration: carga cross-proyecto en una sola query — ya no depende
      // de que el proyecto activo esté disponible primero.
      await _loadAllProjectsSprintsFromSupabase();
      let _resetChanged = false;
      (state?.ais || []).forEach(ai => {
        if (ai.status === 'exhausted' && ai.resetTime && _resetExpiredInternal(ai.resetTime, ai.resetEpoch)) {
          _resetWorker(ai);
          _resetChanged = true;
        }
      });
      // Persistir availableSince escrito por _resetWorker — sin esto se pierde en el próximo sync
      if (_resetChanged) save();
    }

    // ── 2. Batch paralelo: sesiones + items relacional + docs + drafts ──
    // T-202606-009: items se carga desde tracker_items (tabla relacional) en paralelo con
    // el resto del batch. tracker_backlog JSONB legacy eliminado del batch (T-202606-105 TKT3) —
    // purga ejecutada 2026-06-24, históricos migrados a tracker_items.
    // Colapsa 6 queries secuenciales a tracker_docs en una sola con .in('key', [...])
    const projId = _getActiveProjectFilter();
    const suffix = projId ? '-' + projId : '-global';
    const notesKey = projId ? 'notes-' + projId : 'notes-global';
    const docsKeysToFetch = [
      'context' + suffix,
      'htmlmap' + suffix,
      'plan' + suffix,
      'tmp-id-map',
      notesKey,
      'user-prefs'
    ];

    const [sessResult, itemsResult, incidentsResult, docsResult, draftsResult] = await Promise.allSettled([
      // 4. Sesiones
      _supabase
        .from('tracker_sessions')
        .select('project_id, session_id, data')
        .eq('user_id', _supabaseUser.id),

      // 5. Items relacionales — T-202606-009: fuente primaria de hidratación de ITEMS.
      // Filtra por project_id para obtener solo los ítems del proyecto activo.
      // T-202606-026: filtro explícito user_id además de RLS — mismo patrón defensivo
      // que el resto de queries de este módulo (tracker_state, tracker_sessions, tracker_docs).
      // Supabase PostgREST retorna text[] como arrays JS y jsonb como objetos/arrays JS nativos
      // — depends_on y ac no requieren parse adicional.
      projId
        ? _supabase
            .from('tracker_items')
            .select('*')
            .eq('project_id', projId)
            .eq('user_id', _supabaseUser.id)
        : Promise.resolve({ data: [], error: null }),

      // 5b. Incidentes relacionales — TKT-202607-044 (REQ-202607-015): fuente primaria de
      // hidratación de INCIDENTS. Tabla propia tracker_incidents (no tracker_items) desde
      // TKT-202607-005 — mismo patrón defensivo de filtro project_id + user_id.
      projId
        ? _supabase
            .from('tracker_incidents')
            .select('*')
            .eq('project_id', projId)
            .eq('user_id', _supabaseUser.id)
        : Promise.resolve({ data: [], error: null }),

      // 6 + 6b + 6c + 6e — una sola query para todos los docs
      _supabase
        .from('tracker_docs')
        .select('key, value, updated_at')
        .eq('user_id', _supabaseUser.id)
        .in('key', docsKeysToFetch),

      // 6d. Drafts — LIKE no se puede combinar con .in(), va paralelo aparte
      _supabase
        .from('tracker_docs')
        .select('key, value, updated_at')
        .eq('user_id', _supabaseUser.id)
        .like('key', 'draft-%')
    ]);

    // ── 4. Procesar sesiones ─────────────────────────────────────────────
    try {
      if (sessResult.status === 'fulfilled' && !sessResult.value.error) {
        const sessRows = sessResult.value.data;
        if (sessRows && sessRows.length) {
          const remoteSessMap = {};
          sessRows.forEach(row => {
            if (!remoteSessMap[row.project_id]) remoteSessMap[row.project_id] = [];
            remoteSessMap[row.project_id].push(row.data);
          });
          state.projects.forEach(proj => {
            const remoteSessions = remoteSessMap[proj.id] || [];
            if (!remoteSessions.length) return;
            if (!proj.sessions) proj.sessions = [];
            const localIds = new Set(proj.sessions.map(s => s.id));
            // TKT1 · REQ-sessions-mutator AC-5: hidratación de sesiones remotas — push directo,
            // NUNCA via _mutateSessions(). Estas sesiones ya existen en Supabase; marcarlas
            // dirty causaría un loop de re-subida de lo que acaba de llegar del servidor.
            remoteSessions.forEach(s => { if (!localIds.has(s.id)) { _normalizeSessionFields(s); proj.sessions.push(s); localIds.add(s.id); } });
          });
          try { localStorage.setItem(LOCUS_KEYS.STATE, JSON.stringify(state)); } catch {}
        }
      } else {
        console.warn('[AI Tracker] Error cargando sesiones desde Supabase:', sessResult.reason || sessResult.value?.error);
      }
    } catch (sessErr) {
      console.warn('[AI Tracker] Error procesando sesiones:', sessErr);
    }

    // ── 5. Procesar items relacionales — T-202606-009 ────────────────────
    // Fuente primaria de hidratación de ITEMS: tabla tracker_items (relacional).
    // AC-1: 5 filas remotas con project_id='PP' → ITEMS contiene exactamente esos 5 objetos,
    //        depends_on reconstruido como array JS desde text[] (PostgREST lo entrega ya como array).
    // AC-2: columna ac tipo jsonb → array JS nativo (PostgREST deserializa jsonb automáticamente).
    // AC-3: fallo de red en SELECT → console.warn + no tocar _itemsRef (fallback a localStorage).
    // AC-4: tabla vacía para project_id='PP' → _itemsRef.length = 0 (array vacío, nunca undefined).
    // B-[pendiente-ID]: si saveBacklog() tiene un upsert de tracker_items en vuelo, saltar el
    // merge por completo — el guard de timestamp (B-202606-094) compara contra localStorage,
    // que todavía no refleja el cambio reciente mientras el upsert no confirma. Sin este guard,
    // un _loadFromSupabase() disparado por OTRO canal (tracker_state/tracker_sessions
    // — no hay canal Realtime dedicado a tracker_items) puede pisar el cambio local en esa ventana.
    if (_saveBacklogInFlightCount > 0) {
      console.log('[AI Tracker] _loadFromSupabase: saveBacklog en vuelo (' + _saveBacklogInFlightCount + ') — merge de tracker_items omitido en esta pasada.');
    } else {
    try {
      if (itemsResult.status === 'fulfilled' && !itemsResult.value.error) {
        const remoteRows = itemsResult.value.data || [];
        // AC-4: tabla vacía → inicializar ITEMS como array vacío.
        // Determinar si vale la pena evaluar merge: ITEMS local vacío → siempre.
        // ITEMS local con datos → solo si hay al menos una fila remota más reciente
        // que su contraparte local (ver merge por fila más abajo — B-202606-094).
        const localItemsRaw = localStorage.getItem(_tplKey('backlog-items'));
        const localItems    = (() => { try { return JSON.parse(localItemsRaw || '[]'); } catch { return []; } })();
        const localByCode   = new Map(localItems.map(it => [it.code, it]));
        const remoteMaxTs   = remoteRows.reduce((m, row) => {
          const ts = row.updated_at || 0; // BIGINT epoch ms desde DDL
          return ts > m ? ts : m;
        }, 0);
        const localMaxTs    = localItems.reduce((m, it) => {
          const ts = it._updatedAtMs || 0;
          return ts > m ? ts : m;
        }, 0);
        // TKT-fix-merge-gate: remoteMaxTs es ciego a un DELETE que borra justo la fila con
        // mayor updated_at — el máximo remoto baja y remoteMaxTs > localMaxTs nunca se
        // cumple, saltando el bloque de merge completo (incluida la detección de deletes
        // de líneas ~1958-1972) y dejando el ítem borrado remotamente en caché indefinidamente.
        // remoteActiveCount !== localCount es una señal barata y segura de alta/baja de filas
        // — se excluye 'historico' del conteo remoto porque el forEach de abajo también lo excluye.
        const remoteActiveCount = remoteRows.filter(row => row.status !== 'historico').length;
        const localCount        = localItems.length;
        const shouldEvaluate = _itemsRef !== null && (
          _itemsRef.length === 0 ||
          !localItemsRaw     ||
          remoteMaxTs > localMaxTs ||
          remoteActiveCount !== localCount
        );
        // B-202606-094 fix: el reemplazo completo de _itemsRef permitía que un
        // read-after-write race (la fila recién upserteada todavía no visible en el
        // SELECT, pero otra fila cualquiera con timestamp reciente) revirtiera ítems
        // que no cambiaron remotamente — ej: un parent vinculado segundos antes.
        // Merge por fila: cada fila remota solo sobrescribe su contraparte local si
        // su propio updated_at es estrictamente más nuevo. Una fila local sin
        // contraparte remota más nueva se conserva intacta.
        if (shouldEvaluate && _itemsRef) {
          const merged = [];
          // T-202606-106: excluir status:historico — solo lectura, vive en storage dedicado.
          // depends_on: text[] → PostgREST lo entrega como array JS — no requiere parse (AC-1).
          // ac: jsonb → PostgREST lo entrega como array JS — no requiere parse (AC-2).
          remoteRows.forEach(row => {
            if (row.status === 'historico') return;
            // INC-202607-009: tracker_items conserva filas remanentes de tipo ITIL
            // (INC/PRB/KE/CHG) de antes de TKT-202607-005 — nunca tuvieron sla_priority
            // en esta tabla porque no es su columna. Sin este gate, cada carga las
            // volvía a mergear en ITEMS, _migrateItemTypes() las reenrutaba a INCIDENTS
            // pisando la fila correcta ya persistida en tracker_incidents (con
            // sla_priority) con esta copia obsoleta sin el campo — loop de saveBacklog().
            // ITIL no vive en tracker_items — se excluye del merge, nunca se escribe aquí.
            if (['INC', 'PRB', 'KE', 'CHG'].includes(row.type)) {
              console.warn(`[AI Tracker] _loadFromSupabase: fila remanente tipo ITIL en tracker_items excluida del merge — ${row.code || '[sin code]'} (type:${row.type}). Vive en tracker_incidents, no aquí.`);
              return;
            }
            const localMatch  = localByCode.get(row.code);
            const localRowTs  = localMatch?._updatedAtMs || 0;
            const remoteRowTs = row.updated_at || 0;
            // AC: si el local es igual o más nuevo que esta fila remota específica,
            // conservar el local — esta fila remota es la causa del read-after-write
            // race, no una actualización genuina de este ítem.
            if (localMatch && localRowTs >= remoteRowTs) {
              merged.push(localMatch);
              localByCode.delete(row.code);
              return;
            }
            // Mapear nombres de columna DDL → nombres de campo JS del schema de ítems.
            // INC-[pendiente-ID] TKT-fix: extraído a _mapRowToItem() — única fuente del
            // mapeo DDL→JS, reusada también por getHistoricoItems(). Antes de este fix,
            // getHistoricoItems() retornaba filas crudas de Supabase sin este mapeo: los
            // ítems historico nunca tenían parentId poblado (solo row.parent snake_case),
            // por lo que _buildChildMap() no podía agruparlos bajo su REQ — historico
            // renderizaba como lista plana.
            const item = _mapRowToItem(row);
            merged.push(item);
            localByCode.delete(row.code);
          });
          // Ítems locales sin fila remota (code no presente en remoteRows).
          // B-202606-094 follow-up: _updatedAtMs solo se setea en este mismo bloque de
          // hidratación (línea ~1732) — ningún otro path de escritura local lo popula.
          // Por lo tanto _updatedAtMs poblado es prueba de que el ítem fue confirmado
          // contra una fila remota en una carga anterior. Dos casos posibles para un
          // leftover:
          //   (a) _updatedAtMs ausente → nunca confirmado remoto → creado offline,
          //       upsert pendiente (ver _offlineQueuePush tipo 'backlog'). Conservar.
          //   (b) _updatedAtMs presente → fue confirmado remoto antes y ya no aparece
          //       en remoteRows → eliminado remotamente (DELETE en tracker_items).
          //       Descartar — restaura el AC-1 original de T-202606-009 ("ITEMS
          //       contiene exactamente las filas remotas") para el caso de deletion.
          for (const leftover of localByCode.values()) {
            if (leftover._updatedAtMs == null) merged.push(leftover);
          }

          _itemsRef.length = 0;
          merged.forEach(it => _itemsRef.push(it));
          _migrateItemTypes();
          try { localStorage.setItem(_tplKey('backlog-items'), JSON.stringify(_itemsRef)); } catch {}
        }
      } else {
        // AC-3: fallo de red → silencioso, no tocar _itemsRef. Fallback a localStorage ya cargado.
        console.warn('[AI Tracker] Error cargando items relacionales desde Supabase:', itemsResult.reason || itemsResult.value?.error);
      }
    } catch (itemsErr) {
      // AC-3: cualquier error en el procesamiento → silencioso, no tocar _itemsRef.
      console.warn('[AI Tracker] Error procesando items relacionales:', itemsErr);
    }
    } // B-[pendiente-ID]: cierre del else del guard _saveBacklogInFlightCount

    // ── 5b. Procesar incidentes relacionales — TKT-202607-044 (REQ-202607-015) ──────────
    // INCIDENTS (INC/PRB/KE/CHG) vive en tracker_incidents — tabla separada de tracker_items
    // desde TKT-202607-005. Mismo guard de saveBacklog-en-vuelo y mismo merge-por-fila que
    // ITEMS (B-202606-094): una fila remota solo sobrescribe su contraparte local si su
    // propio updated_at es estrictamente más nuevo — evita que un read-after-write race
    // revierta un incidente que no cambió remotamente.
    // AC-2 (TKT-202607-044): 9 incidentes remotos con project_id activo → INCIDENTS
    // contiene exactamente esos 9 objetos tras la carga.
    if (_saveBacklogInFlightCount > 0) {
      console.log('[AI Tracker] _loadFromSupabase: saveBacklog en vuelo (' + _saveBacklogInFlightCount + ') — merge de tracker_incidents omitido en esta pasada.');
    } else {
    try {
      if (incidentsResult.status === 'fulfilled' && !incidentsResult.value.error) {
        const remoteIncRows = incidentsResult.value.data || [];
        const incidentsKey     = _tplKey('backlog-incidents');
        const localIncidentsRaw = localStorage.getItem(incidentsKey);
        const localIncidents    = (() => { try { return JSON.parse(localIncidentsRaw || '[]'); } catch { return []; } })();
        const localIncByCode    = new Map(localIncidents.map(inc => [inc.code, inc]));
        const remoteIncMaxTs    = remoteIncRows.reduce((m, row) => {
          const ts = row.updated_at || 0;
          return ts > m ? ts : m;
        }, 0);
        const localIncMaxTs     = localIncidents.reduce((m, inc) => {
          const ts = inc._updatedAtMs || 0;
          return ts > m ? ts : m;
        }, 0);
        // incident_status:historico se excluye del conteo remoto — mismo criterio que
        // remoteActiveCount para ITEMS, para detectar altas/bajas de filas de forma barata.
        const remoteActiveIncCount = remoteIncRows.filter(row => row.incident_status !== 'historico').length;
        const localIncCount        = localIncidents.length;
        const shouldEvaluateInc = _incidentsRef !== null && (
          _incidentsRef.length === 0 ||
          !localIncidentsRaw ||
          remoteIncMaxTs > localIncMaxTs ||
          remoteActiveIncCount !== localIncCount
        );
        if (shouldEvaluateInc && _incidentsRef) {
          const mergedInc = [];
          remoteIncRows.forEach(row => {
            if (row.incident_status === 'historico') return;
            const localMatch  = localIncByCode.get(row.code);
            const localRowTs  = localMatch?._updatedAtMs || 0;
            const remoteRowTs = row.updated_at || 0;
            if (localMatch && localRowTs >= remoteRowTs) {
              mergedInc.push(localMatch);
              localIncByCode.delete(row.code);
              return;
            }
            const inc = _mapRowToIncident(row);
            mergedInc.push(inc);
            localIncByCode.delete(row.code);
          });
          // Incidentes locales sin fila remota — mismo criterio que ITEMS: sin _updatedAtMs
          // → creado offline, upsert pendiente, conservar. Con _updatedAtMs → confirmado
          // remoto antes y ya no aparece → eliminado remotamente, descartar.
          for (const leftover of localIncByCode.values()) {
            if (leftover._updatedAtMs == null) mergedInc.push(leftover);
          }
          _incidentsRef.length = 0;
          mergedInc.forEach(inc => _incidentsRef.push(inc));
          try { localStorage.setItem(incidentsKey, JSON.stringify(_incidentsRef)); } catch {}
        }
      } else {
        console.warn('[AI Tracker] Error cargando incidentes relacionales desde Supabase:', incidentsResult.reason || incidentsResult.value?.error);
      }
    } catch (incidentsErr) {
      console.warn('[AI Tracker] Error procesando incidentes relacionales:', incidentsErr);
    }
    }

    // ── 6. Procesar docs vivos (context, htmlmap, plan, tmp-id-map, notes, user-prefs) ──
    try {
      if (docsResult.status === 'fulfilled' && !docsResult.value.error) {
        const docRows = docsResult.value.data;
        if (docRows && docRows.length) {
          const docMap = Object.fromEntries(docRows.map(r => [r.key, r]));

          const _applyDocIfNewer = (remoteRow, localRawKey, applyFn) => {
            if (!remoteRow || !remoteRow.value) return;
            const localVal   = localStorage.getItem(_tplKey(localRawKey));
            const remoteTs   = remoteRow.updated_at ? new Date(remoteRow.updated_at).getTime() : 0;
            const localMeta  = (() => { try { return JSON.parse(localStorage.getItem(_tplKey(localRawKey + '-meta')) || '{}'); } catch { return {}; } })();
            const localTs    = localMeta.importedAt ? new Date(localMeta.importedAt).getTime() : 0;
            const shouldLoad = !localVal || localTs === 0 || remoteTs > localTs;
            if (shouldLoad) applyFn(remoteRow.value);
          };

          // 6a. Context
          _applyDocIfNewer(docMap['context' + suffix], 'context-raw', (ctx) => {
            if (ctx.raw)      try { localStorage.setItem(_tplKey('context-raw'),      ctx.raw);      } catch {}
            if (ctx.sections) try { localStorage.setItem(_tplKey('context-sections'), ctx.sections); } catch {}
            if (ctx.meta)     try { localStorage.setItem(_tplKey('context-meta'),     ctx.meta);     } catch {}
          });

          // 6a. HTML-MAP
          _applyDocIfNewer(docMap['htmlmap' + suffix], 'html-map-raw', (hm) => {
            if (hm.raw)      try { localStorage.setItem(_tplKey('html-map-raw'),      hm.raw);      } catch {}
            if (hm.sections) try { localStorage.setItem(_tplKey('html-map-sections'), hm.sections); } catch {}
            if (hm.meta)     try { localStorage.setItem(_tplKey('html-map-meta'),     hm.meta);     } catch {}
          });

          // 6a. Plan
          const planRow = docMap['plan' + suffix];
          if (planRow && planRow.value && planRow.value.data) {
            const localPlanRaw = projId ? localStorage.getItem(LOCUS_KEYS.PLAN_PREFIX + projId) : null;
            const remoteTs     = planRow.updated_at ? new Date(planRow.updated_at).getTime() : 0;
            const localTs      = (() => { try { const p = JSON.parse(localPlanRaw || 'null'); return p && p._savedAt ? p._savedAt : 0; } catch { return 0; } })();
            if (!localPlanRaw || localTs === 0 || remoteTs > localTs) {
              const planKey = projId ? 'ai-tracker-plan-' + projId : null;
              if (planKey) try { localStorage.setItem(planKey, JSON.stringify(planRow.value.data)); } catch {}
            }
          }

          // 6b. tmp-id-map
          const mapRow = docMap['tmp-id-map'];
          if (mapRow) {
            const remoteTs  = mapRow.updated_at ? new Date(mapRow.updated_at).getTime() : 0;
            const localRaw  = localStorage.getItem(LOCUS_KEYS.TMP_ID_MAP);
            if (!localRaw || remoteTs > 0) {
              const localMap   = (() => { try { return JSON.parse(localRaw || '{}'); } catch { return {}; } })();
              const localMaxTs = Object.values(localMap).reduce((m, v) => Math.max(m, v.createdAt || 0), 0);
              if (!localRaw || remoteTs > localMaxTs) {
                const merged = { ...localMap, ...(mapRow.value && mapRow.value.map ? mapRow.value.map : {}) };
                try { localStorage.setItem(LOCUS_KEYS.TMP_ID_MAP, JSON.stringify(merged)); } catch {}
              }
            }
          }

          // 6c. Notas de proyecto
          const noteRow    = docMap[notesKey];
          const localNoteKey = projId ? 'notes-' + projId : 'notes';
          if (noteRow) {
            const remoteNotes = noteRow.value && Array.isArray(noteRow.value.notes) ? noteRow.value.notes : null;
            if (remoteNotes) {
              const remoteTs   = noteRow.updated_at ? new Date(noteRow.updated_at).getTime() : 0;
              const localRaw   = localStorage.getItem(localNoteKey);
              const localNotes = (() => { try { return JSON.parse(localRaw || '[]'); } catch { return []; } })();
              const shouldLoad = !localRaw || localNotes.length === 0 || remoteTs > 0;
              if (shouldLoad && remoteNotes.length > 0) {
                try { localStorage.setItem(localNoteKey, JSON.stringify(remoteNotes)); } catch {}
              }
            }
          }

          // 6e. Preferencias de usuario
          const prefsRow = docMap['user-prefs'];
          if (prefsRow && prefsRow.value) {
            const prefs    = prefsRow.value;
            const remoteTs = prefsRow.updated_at ? new Date(prefsRow.updated_at).getTime() : 0;
            const localTs  = (() => { try { return new Date(localStorage.getItem(_USER_PREFS_TS_KEY) || 0).getTime(); } catch { return 0; } })();
            if (remoteTs > localTs) {
              if (prefs.shortcuts && typeof prefs.shortcuts === 'object') {
                try { localStorage.setItem(_SHORTCUTS_KEY, JSON.stringify(prefs.shortcuts)); } catch {}
              }
              if (prefs.templateTrigger) {
                try { localStorage.setItem(LOCUS_KEYS.TPL_TRIGGER, prefs.templateTrigger); _dispatch('shell:update-auto-download-label'); } catch {}
              }
              if (prefs.onboardingSeen) {
                try { localStorage.setItem(LOCUS_KEYS.ONBOARDING_SEEN, '1'); } catch {}
              }
              try { localStorage.setItem(_USER_PREFS_TS_KEY, prefsRow.updated_at || new Date().toISOString()); } catch {}
            }
          }
        }
      } else {
        console.warn('[AI Tracker] Error cargando docs desde Supabase:', docsResult.reason || docsResult.value?.error);
      }
    } catch (docsErr) {
      console.warn('[AI Tracker] Error procesando docs:', docsErr);
    }

    // ── 6d. Procesar drafts ──────────────────────────────────────────────
    try {
      if (draftsResult.status === 'fulfilled' && !draftsResult.value.error) {
        const draftRows = draftsResult.value.data;
        if (draftRows && draftRows.length) {
          for (const row of draftRows) {
            if (!row.value || !row.value.text) continue;
            const aiId    = row.key.replace(/^draft-/, '');
            const aiExists = (state.ais || []).some(a => a.id === aiId);
            if (!aiExists) continue;
            const remoteTs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
            const localRaw = localStorage.getItem(LOCUS_KEYS.DRAFT_KEY_PREFIX + aiId);
            if (!localRaw) {
              if (remoteTs > 0) {
                try { localStorage.setItem(LOCUS_KEYS.DRAFT_KEY_PREFIX + aiId, row.value.text); } catch {}
                const dot = document.getElementById('draft-' + aiId);
                if (dot) dot.className = 'draft-dot visible';
              }
            } else {
              const localTsRaw = localStorage.getItem(LOCUS_KEYS.DRAFT_KEY_PREFIX + aiId + '-ts');
              const localTs    = localTsRaw ? (Number(localTsRaw) || 0) : 0;
              if (remoteTs > 0 && remoteTs > localTs) {
                try { localStorage.setItem(LOCUS_KEYS.DRAFT_KEY_PREFIX + aiId, row.value.text); } catch {}
                const dot = document.getElementById('draft-' + aiId);
                if (dot) dot.className = 'draft-dot visible';
              }
            }
          }
        }
      } else {
        console.warn('[AI Tracker] Error cargando borradores desde Supabase:', draftsResult.reason || draftsResult.value?.error);
      }
    } catch (draftErr) {
      console.warn('[AI Tracker] Error procesando borradores:', draftErr);
    }

    // (a) event dispatch — locus-sesiones.js escucha 'shell:mark-tracker-dirty' + 'shell:render-tracker'
    _dispatch('shell:mark-tracker-dirty'); _dispatch('shell:render-tracker');
    // (a) event dispatch — locus-sesiones-stats.js escucha 'shell:update-stats'
    _dispatch('shell:update-stats');
    // (a) event dispatch — locus-radar.js escucha 'shell:mark-radar-dirty' + 'shell:render-radar'
    _dispatch('shell:mark-radar-dirty');
    _dispatch('shell:render-radar');
    // (a) event dispatch — locus-backlog-render.js escucha 'shell:mark-backlog-dirty' + 'shell:render-backlog-list'
    _dispatch('shell:mark-backlog-dirty');
    // (a) event dispatch — locus-sesiones-stats.js escucha 'shell:mark-statusbar-dirty'
    _dispatch('shell:mark-statusbar-dirty');
    _dispatch('shell:render-backlog-list');
    // B: re-render tab Sprint tras carga Supabase — evita empty state en refresh
    _renderSprintTabFn();
    setSyncStatus('synced', '✓ sincronizado');
    // Opción A — habilitar _markUserAction() solo después de que la primera carga completa.
    // Cualquier save() que ocurra antes de este punto (renders post-auth, migraciones de
    // sprints HOTFIX, etc.) no abre la ventana de heartbeat.
    _initLoadComplete = true;

  } catch (err) {
    console.error('[AI Tracker] _loadFromSupabase() failed:', err);
    setSyncStatus('offline', '✕ sin conexión');

    // R-202605-022 Fase 3 AC-1: rollback — restaurar getItems() y state al snapshot pre-carga
    // para evitar que un fallo a mitad deje el backlog en estado parcialmente aplicado.
    // T-202605-084: restaurar getItems() con deep clone del snapshot — shallow spread no restaura propiedades anidadas.
    if (_itemsRef && _itemsSnapshot) {
      _itemsRef.length = 0;
      _itemsSnapshot.forEach(item => _itemsRef.push(structuredClone(item)));
    }
    // TKT-202607-044: mismo rollback para INCIDENTS — un fallo a mitad de carga no debe
    // dejar INCIDENTS en estado parcialmente aplicado.
    if (_incidentsRef && _incidentsSnapshot) {
      _incidentsRef.length = 0;
      _incidentsSnapshot.forEach(inc => _incidentsRef.push(structuredClone(inc)));
    }
    // T-202605-084: Object.assign(state, snapshot) restaura propiedades top-level correctamente
    // porque _stateSnapshot es un deep clone (structuredClone) — cada propiedad anidada es
    // una copia independiente. La referencia del módulo-local state se preserva.
    Object.assign(state, _stateSnapshot);

    showToast('warning', '⚠️ No se pudo cargar desde Supabase — operando en modo local', null, 6000);
  } finally {
    // R-202605-022 Fase 3 AC-2: liberar lock siempre — éxito o error.
    _loadFromSupabaseInFlight = false;
  }
}

// ── GRUPO 6 — GETTERS PUROS ───────────────────────────────────────────────────

// v3.0.0: sessions, tracker y sprints viven en project — no en state global
export var state = {ais:[], theme:'dark', tags:[], projects:[], _stateVersion:3}; // ESM-B: var para evitar TDZ — T-202606-023: export añadido para consumo ESM directo

// getState(): getter dinámico — siempre retorna la referencia actual de state.
export function getState() { return state; }

// B-[pendiente-ID] AC-5: fuente única de normalización de sesión — defaults de campos,
// fecha ISO y backfill de createdAt. Consumida por _applyStateData (migración local, todas
// las sesiones) y por el merge remoto de Supabase (solo sesiones nuevas — ver AC-4).
function _normalizeSessionFields(s) {
  if (!s.tags) s.tags = [];
  if (!s.trackerRefs) s.trackerRefs = [];
  if (s.quickCapture === undefined) s.quickCapture = false;
  if (s.starred === undefined) s.starred = false;
  // Normalizar date: sesiones con formato español "12 abr 2026 11:08 a.m." → ISO
  if (s.date && isNaN(new Date(s.date).getTime())) {
    const _MES = {ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11};
    const m = String(s.date).toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?))?/);
    if (m) {
      const day = parseInt(m[1], 10);
      const mon = _MES[m[2].slice(0,3)];
      const year = parseInt(m[3], 10);
      if (mon !== undefined && !isNaN(day) && !isNaN(year)) {
        let hour = m[4] ? parseInt(m[4], 10) : 12;
        const min = m[5] ? parseInt(m[5], 10) : 0;
        if (m[6]) {
          const pm = m[6].replace(/\./g,'') === 'pm';
          if (pm && hour !== 12) hour += 12;
          if (!pm && hour === 12) hour = 0;
        }
        s.date = new Date(year, mon, day, hour, min, 0).toISOString();
      }
    }
  }
  // B-202606-044 AC-1/AC-2: sesiones sin createdAt — backfill desde s.date (ya ISO en este punto).
  // Sin esto, _getCurrentSession/_isInSession (createdAt||0 sin fallback) y el sort de col2
  // trataban estas sesiones como timestamp 0.
  if (!s.createdAt) {
    const _bfTs = s.date ? new Date(s.date).getTime() : 0;
    s.createdAt = isNaN(_bfTs) ? 0 : _bfTs;
  }
  return s;
}

function _applyStateData(raw) {

  if (!raw.theme) raw.theme = 'dark';
  if (!raw.tags) raw.tags = [];
  if (!raw.projects) raw.projects = [];
  if (!raw._stateVersion) raw._stateVersion = 3;
  // T-202606-009: cargar infraVersionData desde state si existe — _parseInfraLine lo pobló en sesión previa.
  if (raw.infraVersionData && typeof raw.infraVersionData.infraVersion === 'number' && raw.infraVersionData.infraVersion > 0) {
    _infraVersionData = raw.infraVersionData;
  }
  // Limpiar campo legacy infraVersionActive si aún existe en storage persistido
  if ('infraVersionActive' in raw) delete raw.infraVersionActive;

  // v3: migración de proyectos — asegurar campos v3
  (raw.projects || []).forEach(proj => {
    if (!proj.sessions) proj.sessions = [];
    if (!proj.tracker) proj.tracker = { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
    if (!proj.tracker.counters) proj.tracker.counters = { P: 0, T: 0, R: 0, B: 0 };
    if (proj.contextVersion === undefined) proj.contextVersion = '';
    if (proj.backlogVersion === undefined) proj.backlogVersion = '';
    if (proj.htmlMapVersion === undefined) proj.htmlMapVersion = '';
    if (proj.notes === undefined) proj.notes = '';
    if (proj.status === undefined) proj.status = 'active';
    if (proj.infraVersion === undefined) proj.infraVersion = 0; // T-202606-209: campo infra_version del proyecto
    // TKT1 · REQ-sprints-migration: proj.sprints eliminado del blob — _applyStateData() ya no
    // inicializa, migra ni lee proj.sprints. Los sprints viven exclusivamente en tracker_sprints,
    // poblados en _allSprintsCache por _loadAllProjectsSprintsFromSupabase().
    // Migrar sessions internas — B-202606-044 AC-5: normalización vía _normalizeSessionFields
    proj.sessions.forEach(_normalizeSessionFields);
    // Eliminar campos v2 obsoletos
    delete proj.context;
    delete proj.backlog;
    delete proj.aiIds;
    delete proj.sessionsCount;

    // R-202605-135: schema_version — ítems en tracker.items sin campo se tratan como v0 → migrar a v1
    if (proj.tracker && proj.tracker.items) {
      proj.tracker.items.forEach(item => {
        if (item.schema_version === undefined) item.schema_version = 1;
      });
    }
  });

  // v3: IAs son globales — sin sessions, sin project
  (raw.ais || []).forEach(ai => {
    if (!ai.sessions) ai.sessions = [];
    if (ai.interrupted === undefined) ai.interrupted = false;
    if (ai.notes === undefined) ai.notes = '';
    if (ai.avatar === undefined) ai.avatar = '';
    if (ai.archived === undefined) ai.archived = false;
    if (ai.showAll === undefined) ai.showAll = false;
    delete ai.project; // v2 compat — eliminado en v3
  });

  // B-202606-XXX: preservar tema local si hay un write pendiente en debounce.
  // Race condition: toggleTheme() programa save() con debounce de 5 s. Si _loadFromSupabase()
  // se ejecuta antes de que el flush llegue a Supabase, _applyStateData sobrescribe state.theme
  // con el valor remoto (dark), revirtiendo el cambio local silenciosamente.
  const _pendingTheme = (_saveDebounceTimer !== null) ? state.theme : null;

  Object.assign(state, raw);

  if (_pendingTheme) state.theme = _pendingTheme;
  // (a) event dispatch — locus-ui-shell.js escucha 'shell:apply-theme'
  _dispatch('shell:apply-theme', { theme: state.theme });
}

// B-202604-011: clone nunca estuvo definida — fallback crasheaba silenciosamente
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

// DEFAULT_AIS: valor inicial del estado cuando no hay datos en localStorage.
// Declarado aquí (locus-storage.js) porque load() lo necesita antes de que
// ai-tracker-checkpoint.js esté disponible en el DOM.
const DEFAULT_AIS = [];

// load() — solo datos, sin efectos de UI.
// Carga estado desde localStorage en memoria y normaliza — no llama render ni toast.
// Llamada desde _initApp() una vez que todos los módulos están disponibles.
function load() {
  // Carga síncrona desde localStorage (arranque inmediato)
  const s = localStorage.getItem(LOCUS_KEYS.STATE);
  if (s) {
    try { _applyStateData(JSON.parse(s)); }
    catch (e) {
      console.error('[AI Tracker] Estado corrupto en localStorage — restaurando defaults:', e);
      _applyStateData({ais: clone(DEFAULT_AIS), theme:'dark', tags:[]});
    }
  } else {
    _applyStateData({ais: clone(DEFAULT_AIS), theme:'dark', tags:[]});
  }
  // B-202604-009: limpiar IAs expiradas antes del primer render — usar epoch cuando existe
  (state?.ais || []).forEach(ai => {
    if (ai.status === 'exhausted' && ai.resetTime) {
      if (_resetExpiredInternal(ai.resetTime, ai.resetEpoch)) {
        _resetWorker(ai);
      }
    }
  });
}

// _initApp() — punto de arranque de la app. Llamado desde DOMContentLoaded en main.js
// una vez que todos los módulos JS están disponibles.
// Gate de auth: si no hay sesión activa → openAuthModal() bloqueante, sin render.
// Si hay sesión activa → render completo + sync Supabase.
export function _initApp(opts = {}) {
  // _getActiveProjectFilter: export function local (T-202606-166) — no requiere inyección via opts.
  if (opts.exportBacklogMd) exportBacklogMd = opts.exportBacklogMd;
  // T-202606-003: inyectar las cuatro referencias de backlog-core para eliminar el import directo
  if (opts.getItems) _getItems = opts.getItems;
  else console.warn('[AI Tracker] _initApp: getItems no recibido en opts — usando fallback []');
  if (opts.localStorageUsageRatio) _localStorageUsageRatio = opts.localStorageUsageRatio;
  else console.warn('[AI Tracker] _initApp: localStorageUsageRatio no recibido en opts — usando fallback 0');
  if (opts.migrateItemTypes) _migrateItemTypes = opts.migrateItemTypes;
  else console.warn('[AI Tracker] _initApp: migrateItemTypes no recibido en opts — usando no-op');
  if (opts.purgeStaleBacklogCache) _purgeStaleBacklogCache = opts.purgeStaleBacklogCache;
  else console.warn('[AI Tracker] _initApp: purgeStaleBacklogCache no recibido en opts — usando fallback 0');
  // TKT-202607-044 (REQ-202607-015): inyectar getIncidents — mismo patrón que getItems,
  // rompe el ciclo storage ↔ backlog-core para el array INCIDENTS.
  if (opts.getIncidents) _getIncidents = opts.getIncidents;
  else console.warn('[AI Tracker] _initApp: getIncidents no recibido en opts — usando fallback []');
  // T-202606-006 T3: renderSprintTab inyectado para eliminar window.renderSprintTab
  if (opts.renderSprintTab) _renderSprintTabFn = opts.renderSprintTab;
  // B-202606-028: marcar referencias inyectadas — _loadFromSupabase puede reintentar ahora.
  _appReady = true;
  // 1. Cargar estado desde localStorage en memoria (sin UI)
  load();

  // 2. Verificar auth antes de cualquier render
  const checkAuth = (user) => {
    if (!user) {
      // Sin auth → modal bloqueante. Sin render, sin interacción.
      openAuthModal();
      return;
    }
    // 3. Auth confirmada → render completo
    _renderAfterAuth();
  };

  // Esperar a que Supabase resuelva el estado de auth inicial
  if (_supabaseReady) {
    _supabaseReady.then(user => checkAuth(user));
  } else {
    // Sin Supabase configurado — auth no disponible, bloquear
    checkAuth(null);
  }
}

// _renderAfterAuth() — secuencia de render post-auth.
// Solo se llama cuando hay sesión activa confirmada.
function _renderAfterAuth() {
  // B-202604-010: render inicial desde estado real
  // (a) event dispatch — locus-sesiones.js escucha 'shell:mark-tracker-dirty' + 'shell:render-tracker'
  _dispatch('shell:mark-tracker-dirty'); _dispatch('shell:render-tracker');
  // B-202605-508: garantizar badges visibles al arranque
  // (a) event dispatch — locus-notifications.js escucha 'shell:update-notif-badges'
  _dispatch('shell:update-notif-badges');
  // T-084: verificar umbral de sesiones
  // T-202606-009: guard typeof eliminado — checkStorageWarn definida en este módulo (ver más abajo)
  setTimeout(checkStorageWarn, 500);
  // B-202606-XXX: render inicial del backlog desde localStorage — garantiza items visibles
  // aunque Supabase no responda. _loadFromSupabase re-renderiza si hay datos frescos.
  // (a) event dispatch — locus-backlog-render.js escucha 'shell:mark-backlog-dirty' + 'shell:render-backlog-list'
  // Race condition fix: setTimeout(0) garantiza que todos los módulos ESM registraron
  // sus listeners antes de disparar — resuelve badges de sidebar vacíos al init.
  setTimeout(() => {
    _dispatch('shell:mark-backlog-dirty');
    _dispatch('shell:render-backlog-list');
  }, 0);
  // T-202605-482: sincronizar desde Supabase
  if (_supabase) _loadFromSupabase();
}

// Claves localStorage por proyecto
export function _projKey(base, projId) { return projId ? base + '-' + projId : base; }

// T-202604-006: clave de template para el proyecto activo
export function _tplKey(base) {
  const projId = _getActiveProjectFilter();
  return projId ? base + '-' + projId : base;
}

export function getAI(id) { return (state?.ais || []).find(a => a.id === id); }

// Proyecto activo (objeto)
export function getActiveProject() {
  const id = _getActiveProjectFilter();
  // acceso directo a state.projects — dato vive en locus-storage, no requiere import externo
  return id ? (state.projects || []).find(p => p.id === id) || null : null;
}

// Todas las sesiones de un proyecto
export function getProjectSessions(projId) {
  // acceso directo a state.projects — dato vive en locus-storage, no requiere import externo
  const proj = (state.projects || []).find(p => p.id === projId);
  return proj ? (proj.sessions || []) : [];
}

// Todas las sesiones de todos los proyectos (vista global)
export function getAllSessions() {
  // Guardia: detectar sesiones corruptas en ai.sessions (nunca debería ocurrir en v3)
  (state?.ais || []).forEach(ai => {
    if (ai.sessions && ai.sessions.length > 0) {
      console.warn(`[AI Tracker] ATENCIÓN: ai "${ai.name}" tiene ${ai.sessions.length} sesión(es) en ai.sessions — debería estar vacío en v3. Recarga la app para normalizar.`);
    }
  });
  return (state?.projects || []).flatMap(p => (p.sessions || []).map(s => ({ ...s, projectId: p.id })));
}
// R-202605-050: alias canónico — getAllCheckpoints
function getAllCheckpoints() { return getAllSessions(); }

// Sesiones de un proyecto filtradas por aiId
function getSessionsByAI(projId, aiId) {
  return getProjectSessions(projId).filter(s => s.aiId === aiId);
}

// Encontrar a qué proyecto pertenece una sesión por su id
function getProjectForSession(sessId) {
  return (state.projects || []).find(p => (p.sessions || []).some(s => s.id === sessId)) || null;
}

// Tracker del proyecto activo (o vacío si no hay proyecto)
export function getActiveTracker() {
  const proj = getActiveProject();
  if (!proj) return { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
  if (!proj.tracker) proj.tracker = { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
  return proj.tracker;
}

// TKT1 · REQ-sprints-migration: cache cross-proyecto — objeto {projectId: Sprint[]}. Nunca
// retorna undefined a nivel raíz ({} si no hay datos). getAllProjectsSprints()[projId] es
// undefined para un proyecto sin sprints cargados en cache (key ausente) — todo call site debe
// usar fallback getAllProjectsSprints()[projId] || [], nunca acceso directo sin fallback.
export function getAllProjectsSprints() {
  return _allSprintsCache;
}

// Sprints del proyecto activo
// T-202605-025: parámetro opcional currentOnly — cuando true retorna el sprint current
// del proyecto activo. null si no hay proyecto activo o ningún sprint tiene current: true.
// TKT1 · REQ-sprints-migration: deriva de _allSprintsCache[_getActiveProjectFilter()] || [] en
// vez de cache plano. Shape de retorno idéntico — ningún call site existente requiere cambio.
export function getActiveSprints(currentOnly = false) {
  const sprints = _allSprintsCache[_getActiveProjectFilter()] || [];
  if (currentOnly) return sprints.find(sp => sp.current === true) || null;
  return sprints;
}

// TKT1 · REQ-sprints-migration: popula _allSprintsCache para todos los proyectos del usuario en
// una sola query a tracker_sprints sin filtro project_id. Reemplaza _loadSprintsFromSupabase(projId)
// — no coexisten. Llamada desde _loadFromSupabase() al cargar.
// AC — estado de error: si la query falla, _allSprintsCache se mantiene en su último valor
// conocido (no se vacía), se muestra toast de advertencia y se loggea el error.
// AC — edge case sin auth: itera state.projects y puebla _allSprintsCache[proj.id] desde
// localStorage.getItem('sprints-' + proj.id) por proyecto.
export async function _loadAllProjectsSprintsFromSupabase() {
  if (!_supabase || !_supabaseUser) {
    const next = {};
    (state.projects || []).forEach(proj => {
      const lsKey = 'sprints-' + proj.id;
      try {
        const raw = localStorage.getItem(lsKey);
        next[proj.id] = raw ? JSON.parse(raw) : [];
      } catch(e) {
        next[proj.id] = [];
      }
    });
    _allSprintsCache = next;
    return;
  }
  try {
    const { data, error } = await _supabase
      .from('tracker_sprints')
      .select('sprint_id,label,status,version_target,release_type,scope,goal,out_of_scope,opened_at,closed_at,updated_at,project_id')
      .eq('user_id', _supabaseUser.id);
    if (error) throw error;
    // AC: mapear campos de tracker_sprints al shape canónico de sprint en memoria, agrupado por proyecto
    const next = {};
    (data || []).forEach(row => {
      const sp = {
        id:             row.sprint_id,
        label:          row.label || row.sprint_id,
        status:         row.status,
        version_target: row.version_target,
        release_type:   row.release_type,
        scope:          row.scope,
        goal:           row.goal,
        out_of_scope:   row.out_of_scope || [],
        opened_at:      row.opened_at,
        closed_at:      row.closed_at,
        // campos derivados necesarios para call sites existentes
        startedAt:      row.opened_at ? new Date(row.opened_at).getTime() : null,
        closedAt:       row.closed_at ? new Date(row.closed_at).getTime() : null,
        current:        row.status === 'active',
        isHotfix:       (row.sprint_id || '').includes('-S-HOTFIX'),
        formallyOpened: true,
        projId:         row.project_id,
        projectId:      row.project_id
      };
      if (!next[row.project_id]) next[row.project_id] = [];
      next[row.project_id].push(sp);
    });
    _allSprintsCache = next;
    // Escribir a localStorage como caché por proyecto (fallback disponible en próxima sesión sin auth)
    Object.keys(next).forEach(projId => {
      try { localStorage.setItem('sprints-' + projId, JSON.stringify(next[projId])); } catch(e) {}
    });
  } catch(err) {
    // AC — error de Supabase: cache se mantiene en su último valor conocido, no se vacía
    console.error('[Locus] TKT1 · REQ-sprints-migration: error al cargar tracker_sprints', err);
    showToast('warning', 'No se pudieron cargar los sprints — reintentando al reconectar');
  }
}

// T-202606-005: helpers exportados para createSprint y setSprintStatus en locus-backlog-sprints.js

// Upsert de un sprint a tracker_sprints + actualiza _allSprintsCache[projId].
// Fallback sin auth: escribe a localStorage clave sprints-{projId}.
export async function _upsertSprint(sprintObj, projId) {
  // Actualizar cache en memoria primero (optimistic) — crea la key del proyecto si no existe
  if (!_allSprintsCache[projId]) _allSprintsCache[projId] = [];
  const list = _allSprintsCache[projId];
  const idx = list.findIndex(s => s.id === sprintObj.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...sprintObj };
  } else {
    list.push({ ...sprintObj, projId, projectId: projId });
  }

  const lsKey = 'sprints-' + (projId || 'global');

  if (!_supabase || !_supabaseUser) {
    // AC: fallback sin auth → localStorage
    try { localStorage.setItem(lsKey, JSON.stringify(list)); } catch(e) {}
    return;
  }

  const toIso = v => {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return new Date(v).toISOString();
    return null;
  };

  const row = {
    user_id:        _supabaseUser.id,
    project_id:     projId || '',
    sprint_id:      sprintObj.id,
    label:          sprintObj.label || null,
    status:         sprintObj.status || 'active',
    version_target: sprintObj.version_target || null,
    release_type:   sprintObj.release_type || null,
    scope:          sprintObj.scope || null,
    goal:           sprintObj.goal || null,
    out_of_scope:   sprintObj.out_of_scope || null,
    opened_at:      toIso(sprintObj.startedAt || sprintObj.opened_at),
    closed_at:      toIso(sprintObj.closedAt  || sprintObj.closed_at),
    updated_at:     new Date().toISOString()
  };

  const { error } = await _supabase
    .from('tracker_sprints')
    .upsert(row, { onConflict: 'user_id,sprint_id' });
  if (error) {
    console.error('[Locus] T-202606-005: upsert a tracker_sprints falló', error);
  } else {
    // Actualizar localStorage como caché post-write
    try { localStorage.setItem(lsKey, JSON.stringify(list)); } catch(e) {}
  }
}

// T-202606-087: display canónico 'id · nombre' para sprint — usado en card subline e IDP.
// Si el sprint no está registrado en getActiveSprints() o su label coincide con el id, retorna solo el id.
export function _sprintDisplay(sprintId) {
  if (!sprintId) return sprintId;
  const sp = getActiveSprints().find(s => s.id === sprintId);
  const label = sp && sp.label;
  return (label && label !== sprintId) ? `${sprintId} · ${label}` : sprintId;
}

// Contar sesiones de una IA en todos los proyectos
function countAISessions(aiId) {
  return (state.projects || []).reduce((sum, p) => sum + (p.sessions || []).filter(s => s.aiId === aiId).length, 0);
}
// R-202605-050: alias canónico — countAICheckpoints
function countAICheckpoints(aiId) { return countAISessions(aiId); }

// Última sesión de una IA en el proyecto activo (o en todos si no hay filtro)
export function getLastAISession(aiId) {
  const projId = _getActiveProjectFilter();
  const sessions = projId
    ? getProjectSessions(projId).filter(s => s.aiId === aiId)
    : getAllSessions().filter(s => s.aiId === aiId);
  return sessions.length ? sessions[sessions.length - 1] : null;
}

// Sesiones de una IA en el proyecto activo (o todos)
export function getAISessions(aiId) {
  const projId = _getActiveProjectFilter();
  if (projId) return getProjectSessions(projId).filter(s => s.aiId === aiId);
  return getAllSessions().filter(s => s.aiId === aiId);
}
// R-202605-050: alias canónico — getAICheckpoints
function getAICheckpoints(aiId) { return getAISessions(aiId); }

// T-202605-082: _getCurrentSession — fuente de verdad canónica (movida desde locus-sesiones.js)
// Detecta la sesión en curso de una IA: última sesión sin resetAt ni quickCapture,
// posterior al resetEpoch del Worker si existe, y sin status exhausted sin resetEpoch.
// Fix: guard de availableSince — cubre el caso post-reset donde resetEpoch ya es null.
export function _getCurrentSession(aiId) {
  const allSess = getAllSessions();
  const aiSess  = allSess.filter(s => s.aiId === aiId);
  if (!aiSess.length) return null;
  const last = aiSess.reduce((a, b) =>
    (parseInt(b.id) || 0) > (parseInt(a.id) || 0) ? b : a
  );
  if (!last || last.resetAt || last.quickCapture) return null;
  const sessTs = last.createdAt || 0;
  // B-202605-066: si el worker tiene resetEpoch, el checkpoint debe ser posterior a ese timestamp
  const ai = (getState().ais || []).find(a => a.id === aiId);
  if (ai && ai.resetEpoch) {
    if (sessTs <= new Date(ai.resetEpoch).getTime()) return null;
  }
  // Fix: si el worker tiene availableSince, la sesión debe ser posterior al reset
  if (ai && ai.availableSince) {
    if (sessTs <= ai.availableSince) return null;
  }
  // AC-2: worker exhausted sin resetEpoch — no puede haber sesión en curso
  if (ai && ai.status === 'exhausted' && !ai.resetEpoch) return null;
  return last;
}
// R-202605-050: alias canónico — _getCurrentCheckpoint
export function _getCurrentCheckpoint(aiId) { return _getCurrentSession(aiId); }

// T-202605-082: _isInSession — fuente de verdad canónica (movida desde locus-sesiones-stats.js)
// Detecta si una IA está "en sesión": disponible con última sesión sin resetAt ni quickCapture,
// posterior al resetEpoch del Worker si existe, y posterior a availableSince si existe.
// B-202605-026: check de resetEpoch — Workers con reset previo no quedan en verde.
// Fix: availableSince — cubre el caso post-reset donde resetEpoch ya es null.
export function _isInSession(ai) {
  if (ai.status !== 'available' || ai.interrupted) return false;
  const allSess = getAllSessions().filter(s => s.aiId === ai.id);
  if (!allSess.length) return false;
  const last = allSess.reduce((a, b) => (parseInt(b.id) || 0) > (parseInt(a.id) || 0) ? b : a);
  if (!last || last.resetAt || last.quickCapture) return false;
  const sessTs = last.createdAt || 0;
  if (ai.resetEpoch) {
    if (sessTs <= new Date(ai.resetEpoch).getTime()) return false;
  }
  if (ai.availableSince) {
    if (sessTs <= ai.availableSince) return false;
  }
  return true;
}

// Busca una sesión por id en todos los proyectos — devuelve { proj, sess } o null
export function _findSession(sessId) {
  for (const proj of (state.projects || [])) {
    const sess = (proj.sessions || []).find(x => x.id === sessId);
    if (sess) return { proj, sess };
  }
  return null;
}
// R-202605-050: alias canónico — _findCheckpoint
function _findCheckpoint(sessId) { return _findSession(sessId); }

// Busca una sesión por aiId + sessId — para compatibilidad con funciones que tienen ambos
export function _findSessionByAI(aiId, sessId) {
  for (const proj of (state.projects || [])) {
    const sess = (proj.sessions || []).find(x => x.id === sessId && x.aiId === aiId);
    if (sess) return { proj, sess };
  }
  return null;
}
// R-202605-050: alias canónico — _findCheckpointByAI
function _findCheckpointByAI(aiId, sessId) { return _findSessionByAI(aiId, sessId); }

// ── GRUPO 4 — USER PREFS (Supabase) ──────────────────────────────────────────

export async function _saveUserPrefs() {
  const shortcuts     = _shortcutsLoad();
  const templateTrigger = localStorage.getItem(LOCUS_KEYS.TPL_TRIGGER) || 'session';
  const onboardingSeen  = !!localStorage.getItem(LOCUS_KEYS.ONBOARDING_SEEN);
  const updatedAt       = new Date().toISOString();
  if (_supabase && _supabaseUser) {
    try {
      const { error } = await _supabase.from('tracker_docs').upsert(
        [{ user_id: _supabaseUser.id, key: 'user-prefs', value: { shortcuts, templateTrigger, onboardingSeen, updatedAt }, updated_at: updatedAt }],
        { onConflict: 'user_id,key' }
      );
      if (error) throw error;
      try { localStorage.setItem(_USER_PREFS_TS_KEY, updatedAt); } catch(_) {}
    } catch(err) {
      console.warn('[AI Tracker] _saveUserPrefs Supabase error:', err);
      _offlineQueuePush({ type: 'user-prefs' });
    }
  }
}

// T-202604-299: beforeunload — flush Supabase si hay cambios pendientes
window.addEventListener('beforeunload', () => {
  if (_stateDirty && _supabase && _supabaseUser) {
    clearTimeout(_saveDebounceTimer);
    _saveFlush(); // best-effort; browser puede no esperar la promesa
  }
});

// T-202605-060: Migración inline handlers — auth modal
function _initStorageListeners() {
  // Auth modal — Google
  const btnGoogle = document.getElementById('auth-btn-google');
  if (btnGoogle) btnGoogle.addEventListener('click', () => { closeAuthModal(); signInWithSupabase(); });

  // Auth modal — Magic link send
  const btnMagic = document.getElementById('auth-btn-magic');
  if (btnMagic) btnMagic.addEventListener('click', () => signInWithMagicLink());

  // Auth modal — Email input Enter key
  const emailInput = document.getElementById('auth-email-input');
  if (emailInput) emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') signInWithMagicLink(); });

  // Auth modal — Resend
  const btnResend = document.getElementById('auth-resend-btn');
  if (btnResend) btnResend.addEventListener('click', () => signInWithMagicLink(true));

  // Auth modal — Cancel
  const btnCancel = document.getElementById('auth-cancel-btn');
  if (btnCancel) btnCancel.addEventListener('click', () => { closeAuthModal(); });

  // Sync pill
  const syncPill = document.getElementById('mm-btn-sync');
  if (syncPill) syncPill.addEventListener('click', handleSyncPillClick);

  // User menu item — cerrar sesión
  const userBtn = document.getElementById('mm-btn-user');
  if (userBtn) userBtn.addEventListener('click', () => { signOutSupabase(); });

  // T-202606-027: cierre de panel de aviso de almacenamiento — puramente visual,
  // no invoca saveBacklog ni _purgeStaleBacklogCache (AC3 — sin efecto lateral)
  const storageWarnCloseBtn = document.getElementById('storage-warn-close-btn');
  if (storageWarnCloseBtn) {
    storageWarnCloseBtn.addEventListener('click', () => {
      const panel = document.getElementById('storage-warn');
      if (panel) panel.classList.add('is-hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', _initStorageListeners);

// ── T-202606-166: funciones de proyecto movidas desde locus-sprint-project.js ─
// Ownership: locus-storage.js — consumen getState(), getActiveProject() y _PREFIX_MAP
// que ya viven aquí. Eliminadas de exports en sprint-project para romper ciclos Patrón A.

export function _getActiveProjectFilter() {
  return localStorage.getItem('current-project-filter') || '';
}

export function getProjectById(id) {
  const state = getState();
  return (state.projects || []).find(p => p.id === id);
}

export function _docPrefix() {
  const proj = getActiveProject();
  if (!proj) return 'XX';
  if (proj.prefix) return proj.prefix;
  const name = proj.name || '';
  return _PREFIX_MAP[name] || (name.slice(0, 2).toUpperCase() || 'XX');
}
// ── END T-202606-166 ──────────────────────────────────────────────────────────

// ── T-202606-032: Índice de DOC-UPDATEs por proyecto ─────────────────────────
// El índice vive en proj.docUpdateIndex — persistido en state via save().
// Estructura: { 'doc::sección': [ { contenido, titulo, conflicto } ] }
// Por proyecto activo — _getActiveProjectFilter() determina el proyecto.

export function _getDocUpdateIndex() {
  const proj = getActiveProject();
  if (!proj) return {};
  return proj.docUpdateIndex || {};
}

export function _setDocUpdateIndex(index) {
  const proj = getActiveProject();
  if (!proj) return;
  proj.docUpdateIndex = index;
  save();
}
// ── END T-202606-032 ──────────────────────────────────────────────────────────

// ── T-202606-009: checkStorageWarn() — conecta _localStorageUsageRatio al panel #storage-warn ──
// Ownership: locus-storage.js — consume _localStorageUsageRatio (inyectada via _initApp).
// AC1 happy path: ratio > 0.8 → remueve is-hidden de #storage-warn.
// AC2 estado normal: ratio <= 0.8 → #storage-warn conserva is-hidden (no se toca).
// AC3 estado de error: #storage-warn ausente en el DOM → no lanza excepción.
export function checkStorageWarn() {
  const panel = document.getElementById('storage-warn');
  if (!panel) return;
  if (_localStorageUsageRatio() > 0.8) panel.classList.remove('is-hidden');
}
// ── END T-202606-009 ──────────────────────────────────────────────────────────
// Firma: getActivePlan() → Object | null
// Ownership: locus-storage.js — consume LOCUS_KEYS.PLAN_PREFIX y getState().activeProjectId
// Accesible desde locus-backlog-item.js en el mismo ciclo de carga sin guard typeof requerido.
export function getActivePlan() {
  try {
    const _s = getState();
    const projId = _s && _s.activeProjectId != null
      ? _s.activeProjectId
      : null;
    if (projId == null) return null;
    const raw = localStorage.getItem(LOCUS_KEYS.PLAN_PREFIX + projId);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  } catch (_) {
    return null;
  }
}

// ── B-202606-069: openAuthModal / closeAuthModal ──────────────────────────────
// AC1 happy path — close: #auth-modal-overlay.classList.add('is-hidden')
// AC2 happy path — open: #auth-modal-overlay.classList.remove('is-hidden')
// AC3 estado de error: overlay ausente en DOM → sin excepción
// AC4 cancel btn: listener en _initStorageListeners() lo invoca (typeof guard cumplido)
export function closeAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (overlay) overlay.classList.add('is-hidden');
}

export function openAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (overlay) overlay.classList.remove('is-hidden');
}
// ── END B-202606-069 ──────────────────────────────────────────────────────────

// ── purgeLocalCache() — limpieza de caché stale de localStorage ──────────────
// Elimina claves de caché derivadas que Supabase repoblará al reconectar.
// LOCUS_KEYS.STATE no se purga — es el único fallback real ante pérdida de auth.
// Uso desde consola: import { purgeLocalCache } from './locus-storage.js'; purgeLocalCache('PP');
// Retorna número de claves eliminadas — útil para toast de confirmación.
export function purgeLocalCache(projId) {
  const suffix = projId ? '-' + projId : '';
  const keys = [
    'backlog-items'    + suffix,
    'backlog-meta'     + suffix,
    'sprints-'         + (projId || 'global'),
    'tracker-backlog-historico' + (projId ? '-' + projId : '-global'),
    LOCUS_KEYS.CHANGELOG,
    LOCUS_KEYS.NOTIF_HISTORY,
    LOCUS_KEYS.LOG_FILTERS,
    LOCUS_KEYS.PLAN_PREFIX       + (projId || ''),
    LOCUS_KEYS.CTX_DOCS_PREFIX   + suffix,
    LOCUS_KEYS.HM_DOCS_PREFIX    + suffix,
  ].filter(Boolean);
  let cleared = 0;
  keys.forEach(k => {
    try {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
        cleared++;
      }
    } catch (_) {}
  });
  return cleared;
}
// ── END purgeLocalCache ───────────────────────────────────────────────────────
