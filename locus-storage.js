// [PP] v0.5.0 · sprint:PP-S-05 · mod:30 · autor:Rune · 2026-06-21 UTC-6
// locus-storage.js
// Última actualización: T-202606-005: dispatch storage:item-excluded en saveBacklog
// Módulo de persistencia, auth y sync — extraído de ai-tracker-checkpoint.js
// Carga ANTES que ai-tracker-checkpoint.js en index.html

import { _showArranquePanel } from './locus-sesiones-arranque.js'; // B-202606-044 — ciclo seguro: uso solo dentro de setTimeout en handler


// T-202606-056: imports cíclicos eliminados — reemplazados por event dispatch o acceso directo a state
// Patrones aplicados:
//   (a) event dispatch via _dispatch(event, detail?) — locus-backlog-render, locus-notifications,
//       locus-pulso, locus-radar, locus-sesiones-stats, locus-sesiones, locus-toast, locus-ui-shell
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
  CHANGELOG:        'locus-changelog',
  PLAN_PREFIX:      'locus-plan-',
  NOTIF_HISTORY:    'locus-notif-history',
  LOG_FILTERS:      'locus-log-filters',
  DRAFT_PREFIX:     'locus-draft-',
  THEME:            'theme',
  TMP_ID_MAP:       'tmp-id-map',
  SHORTCUTS:        'user-shortcuts',
  USER_PREFS_TS:    'user-prefs-ts',
  OFFLINE_QUEUE_KEY: 'locus-offline-queue',
  PULSO:            'locus-pulso',
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
let _realtimeChannels   = [];     // T-202606-002: canales Realtime — tracker_state, tracker_backlog, tracker_sessions
let _realtimeLastTs     = null;   // timestamp del último update remoto procesado

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
            if (typeof closeAuthModal === 'function') closeAuthModal();
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
        if (typeof closeAuthModal === 'function') closeAuthModal();
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
  if (!_supabaseUser) { if (typeof openAuthModal === 'function') openAuthModal(); else signInWithSupabase(); }
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

// ── GRUPO 1 — ESTADO Y PERSISTENCIA ──────────────────────────────────────────

const _SAVE_DEBOUNCE_MS = 5000; // acumula calls; Supabase solo escribe si dirty
let _saveDebounceTimer = null;
let _stateDirty = false;

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
        projects: (state.projects || []).map(p => { const { sessions, ...rest } = p; return rest; })
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
      const sessionWrites = [];
      for (const proj of (state.projects || [])) {
        if (proj.sessions && proj.sessions.length > 0) {
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
  // (a) event dispatch — locus-pulso.js escucha 'shell:mark-pulso-dirty' + 'shell:render-pulso-dot'
  _dispatch('shell:mark-pulso-dirty');
  _dispatch('shell:render-pulso-dot');
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
  // (a) event dispatch — locus-pulso.js escucha 'shell:mark-pulso-dirty'
  _dispatch('shell:mark-pulso-dirty');
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
    // (a) event dispatch — locus-radar.js + locus-pulso.js escuchan respectivamente
    _dispatch('shell:render-radar');
    _dispatch('shell:render-pulso-dot');
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
    // (a) event dispatch — locus-radar.js + locus-pulso.js escuchan respectivamente
    _dispatch('shell:render-radar');
    _dispatch('shell:render-pulso-dot');
    _offlineQueuePush({ type: 'state' });
    return;
  }

  // AC-1 R-C1: online + auth → encolar debounce hacia _saveFlush(). No escribir localStorage aquí.
  clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(() => _saveFlush(), _SAVE_DEBOUNCE_MS);
}

// T-202604-299: saveImmediate() — bypasa debounce para eventos críticos
// Usar en: saveSession(), signOutSupabase(), beforeunload
export async function saveImmediate() {
  _stateDirty = true;
  clearTimeout(_saveDebounceTimer);
  await _saveFlush();
}

// R-202604-035: escribe sesiones de un proyecto — Supabase upsert por lotes de 400
async function _saveSessions(proj) {
  if (!proj || !proj.sessions || !proj.sessions.length) return;
  const sessions = proj.sessions;

  // Supabase — upsert por lotes de 400
  if (_supabase && _supabaseUser) {
    const BATCH = 400;
    for (let i = 0; i < sessions.length; i += BATCH) {
      // T-202606-097: timestamp único por lote — registrar ANTES del await para cubrir
      // el echo de Realtime de tracker_sessions. Mismo patrón que _saveFlush() L557.
      const _sessTs = new Date().toISOString();
      _realtimeLastTs = _sessTs;
      const chunk = sessions.slice(i, i + BATCH).map(sess => ({
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
        _offlineQueuePush({ type: 'sessions', projId: proj.id });
        break;
      }
    }
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

// R-202604-035: saveBacklog() — escribe en /backlog/items-{suffix} y /backlog/meta-{suffix}
export async function saveBacklog() {
  // T-[pendiente-ID]: purga inteligente — si localStorage supera el 80% de capacidad,
  // purgar ítems done/descartado >90 días del caché local antes de intentar escribir.
  // Los ítems purgados siguen existiendo en Supabase — solo se elimina el caché local.
  if (_localStorageUsageRatio() > 0.8) {
    {
      const purged = _purgeStaleBacklogCache();
      if (purged > 0) showToast('warning', `⚠️ Caché local compacto — ${purged} ítem${purged > 1 ? 's' : ''} archivado${purged > 1 ? 's' : ''} (disponibles en Supabase)`);
    }
  }

  // T-[pendiente-ID]: gate de validación estructural — un R/T/B con sprint:'icebox'
  // o un ítem con status:'historico' recibido como escritura entrante nunca llega
  // a Supabase ni a localStorage. icebox es zona exclusiva de P (__BR-Ecosystem §5).
  // status:'historico' es de solo lectura, asignado únicamente por Locus al cerrar sprint.
  const _rawItems = _getItems();
  const items = _rawItems.filter(it => {
    if (it.type !== 'P' && it.sprint === 'icebox') {
      console.warn(`[AI Tracker] saveBacklog: ítem ${it.code || '[sin code]'} excluido — type:${it.type} no puede tener sprint:icebox`);
      _dispatch('storage:item-excluded', { code: it.code || '[pendiente-ID]', type: it.type, reason: `type:${it.type} no puede tener sprint:icebox` });
      return false;
    }
    if (it.status === 'historico') {
      console.warn(`[AI Tracker] saveBacklog: ítem ${it.code || '[sin code]'} excluido — status:historico es de solo lectura, asignado por Locus al cerrar sprint`);
      _dispatch('storage:item-excluded', { code: it.code || '[pendiente-ID]', type: it.type, reason: 'status:historico es de solo lectura' });
      return false;
    }
    return true;
  });
  const key = _tplKey('backlog-items');
  const projId = _getActiveProjectFilter();
  const metaKey = _tplKey('backlog-meta');
  const meta = JSON.parse(localStorage.getItem(metaKey) || '{}');
  // T-202606-103: timestamp único — un solo new Date().toISOString() para meta.updated
  // y el updated_at de ambas filas de Supabase. Evita que _loadFromSupabase compare
  // valores generados en momentos distintos del mismo write.
  const _writeTs = new Date().toISOString();
  meta.updated = _writeTs;
  const suffix = projId ? '-' + projId : '-global';

  // AC-3 R-C5: sin Supabase o sin auth → localStorage como único destino.
  if (!_supabase || !_supabaseUser) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
      localStorage.setItem(metaKey, JSON.stringify(meta)); // B-202605-089: persistir meta.updated en localStorage
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.error('[AI Tracker] localStorage quota exceeded, attempting cleanup...');
        try {
          localStorage.removeItem(LOCUS_KEYS.CHANGELOG);
          localStorage.setItem(key, JSON.stringify(items));
          localStorage.setItem(metaKey, JSON.stringify(meta)); // B-202605-091: persistir meta.updated en path de cleanup
          showToast('warning', '⚠️ Cuota de almacenamiento crítica — se limpió historial');
        } catch (err2) {
          console.error('[AI Tracker] saveBacklog failed after cleanup:', err2);
          // B-[pendiente-ID]: toast bloqueante con CTAs — Exportar y Limpiar y reintentar
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
              btnExport.addEventListener('click', () => {
                exportBacklogMd();
              }, { once: true });
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

  // AC-1 R-C5: Supabase disponible → upsert primero. localStorage solo como caché post-write exitoso.
  try {
    // T-202606-097: registrar _realtimeLastTs ANTES del await — mismo patrón que _saveFlush() L557.
    // Evita que el echo de Realtime de tracker_backlog dispare _loadFromSupabase() innecesariamente.
    _realtimeLastTs = _writeTs;
    const { error } = await _supabase.from('tracker_backlog').upsert([
      { user_id: _supabaseUser.id, key: 'items' + suffix, value: items, updated_at: _writeTs },
      { user_id: _supabaseUser.id, key: 'meta'  + suffix, value: meta,  updated_at: _writeTs }
    ], { onConflict: 'user_id,key' });
    if (error) throw error;
    // AC-1 R-C5: upsert exitoso → escribir localStorage como caché. Nunca antes.
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveBacklog: fallo al cachear en localStorage post-upsert', lsErr);
    }
    setSyncStatus('synced', '✓ sincronizado');
  } catch (err) {
    // AC-2 R-C5: upsert falla → localStorage como fallback + encolar + toast.
    // T-202606-097: resetear _realtimeLastTs — el timestamp no llegó a Supabase,
    // sin reset el guard bloquearía el próximo cambio remoto legítimo.
    _realtimeLastTs = null;
    console.error('[AI Tracker] Supabase saveBacklog() failed:', err);
    setSyncStatus('offline', '✕ sin conexión');
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveBacklog: fallo al escribir localStorage fallback', lsErr);
    }
    showToast('warning', '⚠️ Backlog no sincronizado con Supabase — guardado localmente');
    // T-202606-104: projId explícito — la conversión ''→null ocurre aquí, en el call
    // site, no se asume que _offlineQueuePush la normalice internamente.
    _offlineQueuePush({ type: 'backlog', projId: projId || null });
  }
}

// ── T-202606-105: storage dedicado para ítems status:historico ──────────────
// R-202606-037: ITEMS en memoria nunca contiene historico — estos ítems viven
// en su propia clave Supabase/localStorage, separada de 'items'+suffix.
// saveBacklog() no lee ni escribe este storage — ver gate de exclusión ahí mismo.
const _HISTORICO_KEY = 'tracker-backlog-historico';

// Escribe el array de ítems historico en su clave dedicada — Supabase primero,
// localStorage como caché post-write exitoso o como fallback ante fallo de red.
export async function saveHistoricoItems(items) {
  const projId = _getActiveProjectFilter();
  const suffix = projId ? '-' + projId : '-global';
  const key = _HISTORICO_KEY + suffix;
  const payload = Array.isArray(items) ? items : [];

  // Sin Supabase o sin auth → localStorage como único destino.
  if (!_supabase || !_supabaseUser) {
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveHistoricoItems: fallo al escribir en localStorage (sin auth)', lsErr);
    }
    return;
  }

  try {
    const _histTs = new Date().toISOString();
    // T-202606-097: registrar _realtimeLastTs ANTES del await — cubre echo de Realtime
    // de tracker_backlog originado en este write. Mismo patrón que _saveFlush() L557.
    _realtimeLastTs = _histTs;
    const { error } = await _supabase.from('tracker_backlog').upsert(
      [{ user_id: _supabaseUser.id, key: 'historico' + suffix, value: payload, updated_at: _histTs }],
      { onConflict: 'user_id,key' }
    );
    if (error) throw error;
    // Upsert exitoso → escribir localStorage como caché. Nunca antes.
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveHistoricoItems: fallo al cachear en localStorage post-upsert', lsErr);
    }
  } catch (err) {
    // T-202606-097: resetear _realtimeLastTs — timestamp no llegó a Supabase.
    _realtimeLastTs = null;
    // Upsert falla → localStorage como fallback + DocLog + sin afectar ITEMS.
    console.error('[AI Tracker] Supabase saveHistoricoItems() failed:', err);
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveHistoricoItems: fallo al escribir localStorage fallback', lsErr);
    }
    showToast('warning', '⚠️ Histórico no sincronizado con Supabase — guardado localmente');
  }
}

// Lee el array de ítems historico desde su clave dedicada — nunca mezclados con ITEMS.
// Preferencia: Supabase si hay sesión activa, localStorage como fallback/cache.
export async function getHistoricoItems() {
  const projId = _getActiveProjectFilter();
  const suffix = projId ? '-' + projId : '-global';
  const key = _HISTORICO_KEY + suffix;

  if (_supabase && _supabaseUser) {
    try {
      const { data, error } = await _supabase
        .from('tracker_backlog')
        .select('value')
        .eq('user_id', _supabaseUser.id)
        .eq('key', 'historico' + suffix)
        .maybeSingle();
      if (error) throw error;
      if (data && Array.isArray(data.value)) {
        try { localStorage.setItem(key, JSON.stringify(data.value)); } catch (_) {}
        return data.value;
      }
    } catch (err) {
      console.warn('[AI Tracker] getHistoricoItems: fallo Supabase, usando localStorage', err);
    }
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
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

  try {
    const { error } = await _supabase.from('tracker_docs').upsert([
      { user_id: _supabaseUser.id, key: 'context' + suffix, value: ctxPayload, updated_at: new Date().toISOString() },
      { user_id: _supabaseUser.id, key: 'htmlmap' + suffix, value: hmPayload,  updated_at: new Date().toISOString() }
    ], { onConflict: 'user_id,key' });
    if (error) throw error;
    // AC-6 R-C1: upsert exitoso → escribir localStorage como caché post-write. Nunca antes.
    try {
      localStorage.setItem(LOCUS_KEYS.CTX_DOCS_PREFIX + suffix, JSON.stringify(ctxPayload));
      localStorage.setItem(LOCUS_KEYS.HM_DOCS_PREFIX  + suffix, JSON.stringify(hmPayload));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveContextDocs: fallo al cachear en localStorage post-upsert', lsErr);
    }
  } catch (err) {
    // AC-7 R-C1: upsert falla → localStorage como fallback + encolar + toast.
    console.error('[AI Tracker] Supabase saveContextDocs() failed:', err);
    setSyncStatus('offline', '✕ sin conexión');
    try {
      localStorage.setItem(LOCUS_KEYS.CTX_DOCS_PREFIX + suffix, JSON.stringify(ctxPayload));
      localStorage.setItem(LOCUS_KEYS.HM_DOCS_PREFIX  + suffix, JSON.stringify(hmPayload));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveContextDocs: fallo al escribir localStorage fallback', lsErr);
    }
    showToast('warning', '⚠️ Context/HTML-MAP no sincronizado con Supabase — guardado localmente');
    _offlineQueuePush({ type: 'docs' });
  }
}

// ── GRUPO 3 — SYNC Y REALTIME ─────────────────────────────────────────────────

// T-202606-002: suscribe tracker_state, tracker_backlog y tracker_sessions a Realtime.
// Cuando otro dispositivo guarda en cualquiera de las tres tablas, este cliente recarga
// el estado remoto completo vía _loadFromSupabase(). Throttle: ignora eventos originados
// en este mismo cliente (_realtimeLastTs). Fallback: si la suscripción a alguna tabla
// falla, el resto de la app sigue funcional vía localStorage/poll.
export function _subscribeRealtime() {
  if (!_supabase || !_supabaseUser) return;
  _unsubscribeRealtime(); // limpiar canales previos si existen

  // Manejador compartido: recibe payload de cualquiera de las tres tablas.
  // Si el updated_at es el mismo que el último write local, ignora para evitar reload-loop.
  function _handleRemoteChange(payload) {
    const remoteTs = payload.new?.updated_at;
    if (!remoteTs) return;
    if (_realtimeLastTs && remoteTs === _realtimeLastTs) return;
    console.log('[AI Tracker] Realtime: cambio remoto detectado —', payload.table || '', remoteTs);
    _loadFromSupabase();
  }

  // Canal 1 — tracker_state (existente)
  const chState = _supabase
    .channel('tracker-state-' + _supabaseUser.id)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tracker_state', filter: 'user_id=eq.' + _supabaseUser.id },
      _handleRemoteChange
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('[AI Tracker] Realtime: error en canal tracker_state — app sigue funcional vía fallback');
      }
    });

  // Canal 2 — tracker_backlog (T-202606-002)
  const chBacklog = _supabase
    .channel('tracker-backlog-' + _supabaseUser.id)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tracker_backlog', filter: 'user_id=eq.' + _supabaseUser.id },
      _handleRemoteChange
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('[AI Tracker] Realtime: error en canal tracker_backlog — app sigue funcional vía fallback');
      }
    });

  // Canal 3 — tracker_sessions (T-202606-002)
  const chSessions = _supabase
    .channel('tracker-sessions-' + _supabaseUser.id)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tracker_sessions', filter: 'user_id=eq.' + _supabaseUser.id },
      _handleRemoteChange
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('[AI Tracker] Realtime: error en canal tracker_sessions — app sigue funcional vía fallback');
      }
    });

  _realtimeChannels = [chState, chBacklog, chSessions];
}

export function _unsubscribeRealtime() {
  // T-202606-002: limpiar todos los canales registrados (tracker_state, tracker_backlog, tracker_sessions)
  for (const ch of _realtimeChannels) {
    try { _supabase.removeChannel(ch); } catch(e) {}
  }
  _realtimeChannels = [];
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
  const _itemsRef = _getItems().length ? _getItems() : null;
  const _itemsSnapshot = _itemsRef ? structuredClone(_itemsRef) : null;
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

    // ── 2. Batch paralelo: sesiones + backlog + docs (context/htmlmap/plan/tmp-id-map/notes/user-prefs) + drafts ──
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

    const [sessResult, blResult, docsResult, draftsResult] = await Promise.allSettled([
      // 4. Sesiones
      _supabase
        .from('tracker_sessions')
        .select('project_id, session_id, data')
        .eq('user_id', _supabaseUser.id),

      // 5. Backlog
      _supabase
        .from('tracker_backlog')
        .select('key, value')
        .eq('user_id', _supabaseUser.id)
        .in('key', ['items' + suffix, 'meta' + suffix]),

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

    // ── 5. Procesar backlog ──────────────────────────────────────────────
    try {
      if (blResult.status === 'fulfilled' && !blResult.value.error) {
        const blRows = blResult.value.data;
        if (blRows && blRows.length) {
          const blMap = Object.fromEntries(blRows.map(r => [r.key, r.value]));
          const remoteItems = blMap['items' + suffix] || [];
          const remoteMeta  = blMap['meta'  + suffix] || {};
          const localMeta   = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
          const localTs     = localMeta.updated  ? new Date(localMeta.updated).getTime()  : 0;
          const remoteTs    = remoteMeta.updated ? new Date(remoteMeta.updated).getTime() : 0;
          // R-202605-022 Fase 3 AC-1: _itemsRef capturado en snapshot al inicio — no redeclarar.
          const shouldLoad  = remoteItems.length && (!_itemsRef || _itemsRef.length === 0 || localTs === 0 || remoteTs > localTs);
          if (shouldLoad && _itemsRef) {
            _itemsRef.length = 0;
            // T-202606-106: excluir status:historico de la carga remota — historico es de
            // solo lectura, asignado únicamente por Locus al cerrar sprint, y vive en su
            // storage dedicado (T-202606-105). ITEMS nunca debe recibirlo, ni vía Supabase.
            remoteItems.forEach(ri => { if (ri.status !== 'historico') _itemsRef.push(ri); });
            _migrateItemTypes();
            localStorage.setItem(_tplKey('backlog-items'), JSON.stringify(_itemsRef));
            localStorage.setItem(_tplKey('backlog-meta'),  JSON.stringify(remoteMeta));
          }
        }
      } else {
        console.warn('[AI Tracker] Error cargando backlog desde Supabase:', blResult.reason || blResult.value?.error);
      }
    } catch (blErr) {
      console.warn('[AI Tracker] Error procesando backlog:', blErr);
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
    if (typeof renderHoy === 'function') renderHoy();
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
  if (!raw.quickNotes) raw.quickNotes = [];
  // T-202606-009: cargar infraVersionData desde state si existe — _parseInfraLine lo pobló en sesión previa.
  if (raw.infraVersionData && typeof raw.infraVersionData.infraVersion === 'number' && raw.infraVersionData.infraVersion > 0) {
    _infraVersionData = raw.infraVersionData;
  }
  // Limpiar campo legacy infraVersionActive si aún existe en storage persistido
  if ('infraVersionActive' in raw) delete raw.infraVersionActive;

  // T-202606-016: _ensureHotfixSprint — crea sprint S-HOTFIX si el proyecto no lo tiene.
  // Idempotente: AC-3 — si ya existe isHotfix:true no crea otro.
  // AC-4: no modifica sprints regulares existentes.
  // Se llama dentro del forEach de migración — cubre proyectos nuevos (AC-1) y existentes (AC-2).
  function _ensureHotfixSprint(proj) {
    if (!proj.sprints) proj.sprints = [];
    if (proj.sprints.some(sp => sp.isHotfix === true)) return; // AC-3: ya existe
    // Derivar prefijo: desde sprints regulares → proj.prefix → iniciales del nombre → 'XX'
    let prefix = 'XX';
    const regularSprint = proj.sprints.find(sp => /^[A-Za-z]+-S\d+$/i.test(sp.id || ''));
    if (regularSprint) {
      const m = (regularSprint.id || '').match(/^([A-Za-z]+)-S\d+$/i);
      if (m) prefix = m[1].toUpperCase();
    } else if (proj.prefix) {
      prefix = String(proj.prefix).toUpperCase();
    } else if (proj.name) {
      prefix = proj.name.split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 3) || 'XX';
    }
    const hotfixId = prefix + '-S-HOTFIX';
    proj.sprints.push({
      id: hotfixId,
      label: hotfixId,
      goal: '',
      version_target: 'n/a',
      release_type: null,
      status: 'active',
      current: false,
      formallyOpened: true,
      isHotfix: true,
      startedAt: Date.now(),
      createdAt: Date.now()
    });
    console.log('[Locus] T-202606-016: sprint HOTFIX creado —', hotfixId);
  }

  // v3: migración de proyectos — asegurar campos v3
  (raw.projects || []).forEach(proj => {
    if (!proj.sessions) proj.sessions = [];
    if (!proj.tracker) proj.tracker = { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
    if (!proj.tracker.counters) proj.tracker.counters = { P: 0, T: 0, R: 0, B: 0 };
    if (!proj.sprints) proj.sprints = [];
    if (proj.contextVersion === undefined) proj.contextVersion = '';
    if (proj.backlogVersion === undefined) proj.backlogVersion = '';
    if (proj.htmlMapVersion === undefined) proj.htmlMapVersion = '';
    if (proj.notes === undefined) proj.notes = '';
    if (proj.status === undefined) proj.status = 'active';
    if (proj.infraVersion === undefined) proj.infraVersion = 0; // T-202606-209: campo infra_version del proyecto
    // AC-4 [R — Eliminar status 'open']: migración de sprints 'open' → 'active' o 'closed'
    // Corre en cada _applyStateData() — idempotente, no requiere flag.
    const _hasActiveSprint = proj.sprints.some(sp => sp.status === 'active');
    proj.sprints.forEach(sp => {
      if (sp.status === 'open') {
        const newStatus = _hasActiveSprint ? 'closed' : 'active';
        console.log(`[Locus] migración open→${newStatus}: sprint ${sp.id}`);
        sp.status = newStatus;
      }
    });
    // B-[pendiente-ID]: migración programado → scheduled — normaliza sprints guardados con
    // nombre BR antes de que se estandarizara scheduled como valor canónico de storage.
    // Idempotente — corre en cada _applyStateData() sin efecto si ya está normalizado.
    proj.sprints.forEach(sp => {
      if (sp.status === 'programado') sp.status = 'scheduled';
    });
    // T-202606-016: asegurar sprint S-HOTFIX — después de migración open→active/closed
    // para no alterar _hasActiveSprint ni la lógica de migración legacy.
    _ensureHotfixSprint(proj);
    // T-202605-025: campo current — default false + migración automática
    // B-202605-028: si hay múltiples activos sin current, marcar el más reciente (por startedAt).
    // Idempotente: corre en cada _applyStateData().\
    proj.sprints.forEach(sp => { if (sp.current === undefined) sp.current = false; });
    // T-202606-016: excluir sprint HOTFIX de la selección de current — nunca debe ser current
    const activeSprints = proj.sprints.filter(sp => sp.status === 'active' && !sp.isHotfix);
    const hasCurrentActive = activeSprints.some(sp => sp.current === true);
    if (!hasCurrentActive && activeSprints.length > 0) {
      const mostRecent = activeSprints.reduce((a, b) => ((a.startedAt || 0) >= (b.startedAt || 0) ? a : b));
      mostRecent.current = true;
    }
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
  // R-202604-073: dot Pulso — inicializar desde caché localStorage sin esperar render completo
  (function() {
    const cached = (() => { try { return JSON.parse(localStorage.getItem(LOCUS_KEYS.PULSO) || 'null'); } catch(e) { return null; } })();
    const dot = document.getElementById('pulso-dot');
    if (dot && cached && cached.color) dot.className = `pulso-dot pulso-dot--${cached.color}`;
  })();
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
      if (typeof openAuthModal === 'function') openAuthModal();
      else console.warn('[AI Tracker] openAuthModal no disponible — auth requerida');
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
  // R-202604-072: panel de contexto diario — diferido para que _getItems() esté disponible
  setTimeout(_showArranquePanel, 400);
  // R-202604-073: dot Pulso — recalcular con datos reales
  // B-202605-079: mark antes del setTimeout — el guard requiere flag activo al ejecutar
  // (a) event dispatch — locus-pulso.js escucha 'shell:mark-pulso-dirty' + 'shell:render-pulso-dot'
  _dispatch('shell:mark-pulso-dirty');
  setTimeout(() => _dispatch('shell:render-pulso-dot'), 600);
  // T-084: verificar umbral de sesiones
  if (typeof checkStorageWarn === 'function') setTimeout(checkStorageWarn, 500);
  // B-202606-XXX: render inicial del backlog desde localStorage — garantiza items visibles
  // aunque Supabase no responda. _loadFromSupabase re-renderiza si hay datos frescos.
  // (a) event dispatch — locus-backlog-render.js escucha 'shell:mark-backlog-dirty' + 'shell:render-backlog-list'
  _dispatch('shell:mark-backlog-dirty');
  _dispatch('shell:render-backlog-list');
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

// Sprints del proyecto activo
// T-202605-025: parámetro opcional currentOnly — cuando true retorna el sprint current
// del proyecto activo. null si no hay proyecto activo o ningún sprint tiene current: true.
export function getActiveSprints(currentOnly = false) {
  const proj = getActiveProject();
  if (!proj) return currentOnly ? null : [];
  const sprints = proj.sprints || [];
  if (currentOnly) return sprints.find(sp => sp.current === true) || null;
  return sprints;
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
  if (btnGoogle) btnGoogle.addEventListener('click', () => { if (typeof closeAuthModal === 'function') closeAuthModal(); signInWithSupabase(); });

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
  if (btnCancel) btnCancel.addEventListener('click', () => { if (typeof closeAuthModal === 'function') closeAuthModal(); });

  // Sync pill
  const syncPill = document.getElementById('mm-btn-sync');
  if (syncPill) syncPill.addEventListener('click', handleSyncPillClick);

  // User menu item — cerrar sesión
  const userBtn = document.getElementById('mm-btn-user');
  if (userBtn) userBtn.addEventListener('click', () => { signOutSupabase(); });
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

// ── T-202606-199: getActivePlan() — retorna plan del proyecto activo desde localStorage ──
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
