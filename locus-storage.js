// [PP] v0.8.0 · sprint:PP-S-09 · mod:58 · autor:Rune · 2026-06-25 UTC-6
// locus-storage.js
// Última actualización: B-202606-105/106/107 — LOCUS_KEYS.CHANGELOG/NOTIF_HISTORY/LOG_FILTERS
// corregidas a las claves reales que los módulos consumidores ya usan localmente (la purga de
// cuota crítica ahora libera datos reales en vez de claves fantasma) · OFFLINE_QUEUE_KEY
// (entrada duplicada de OFFLINE_QUEUE, sin call sites) eliminada de LOCUS_KEYS.
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
  CHANGELOG:        'ai-tracker-changelog',
  PLAN_PREFIX:      'locus-plan-',
  NOTIF_HISTORY:    'ai-tracker-notifs-history',
  LOG_FILTERS:      'log-filter-state',
  DRAFT_PREFIX:     'locus-draft-',
  THEME:            'theme',
  TMP_ID_MAP:       'tmp-id-map',
  SHORTCUTS:        'user-shortcuts',
  USER_PREFS_TS:    'user-prefs-ts',
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

// T-202606-005: cache en módulo de sprints — fuente de verdad en runtime, poblado desde tracker_sprints.
// getActiveSprints() retorna este cache síncrono. _loadSprintsFromSupabase() lo popula al cargar.
// Fallback: si Supabase no está disponible, se lee desde localStorage clave sprints-{projId}.
let _sprintsCache = [];

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

// B-[pendiente-ID]: contador in-flight para saveBacklog() — >0 mientras hay al menos un
// upsert hacia tracker_items en curso. _loadFromSupabase() lo verifica antes de mergear
// items remotos, igual que ya verifica _saveDebounceTimer para el state general (línea ~1546).
// Contador en vez de booleano: varios call sites de saveBacklog() no usan await (fire-and-
// forget) — dos invocaciones pueden solaparse. Un booleano simple liberaría la protección
// en cuanto la PRIMERA terminara, aunque la segunda siguiera en vuelo. El contador solo
// llega a 0 cuando TODAS las invocaciones activas confirmaron (éxito o error).
// Sin este guard, un _loadFromSupabase() disparado por CUALQUIER canal Realtime (state,
// backlog o sessions — no hay canal dedicado a tracker_items) podía pisar un cambio local
// reciente (ej: parentId recién asignado, status:done de Finn) si el upsert de saveBacklog()
// todavía no había confirmado en Supabase. El guard de timestamp existente (B-202606-094)
// no cubre esta ventana porque compara contra localStorage, que solo se actualiza DESPUÉS
// de la confirmación del upsert — no contra el estado en memoria recién modificado.
let _saveBacklogInFlightCount = 0;

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

// R-202604-035: saveBacklog() — T-202606-008: reescrito para upsert relacional fila por fila
// en tabla items (DDL creado en T-202606-007). Firma saveBacklog() → void intacta — los 7
// call sites (locus-backlog-core, locus-backlog-merge, locus-backlog-panel,
// locus-backlog-sprints, locus-backlog-item, locus-session-parse, locus-session-save)
// no requieren cambio de código. localStorage se mantiene como caché/fallback (sin auth).
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

  // Gate de validación estructural — un R/T/B con sprint:'icebox' o un ítem con
  // status:'historico' nunca llega a Supabase ni a localStorage.
  // icebox es zona exclusiva de P (__BR-Ecosystem §5).
  // status:'historico' es de solo lectura, asignado únicamente por Locus al cerrar sprint.
  //
  // B-202606-097: gate chk_status_by_type — reflejo client-side del CHECK constraint de
  // Postgres (T-202606-007 DDL). Un ítem con combinación type+status inválida se excluye
  // del upsert hasta que su status sea corregido. No se elimina de ITEMS en memoria.
  // Estados válidos por tipo — alineados con DDL real (verificado 2026-06-24, ALTER aplicado
  // tras B-202606-100 — chk_status_by_type ahora permite 'done' para type:R):
  //   R: pendiente · en-proceso · en-revision · done · bloqueado · orphaned · descartado
  //      (done solo llega aquí vía sesión de cierre de Finn — el guard de origen vive en
  //      applyPatchesFromTG/_applyDoneStatus, no en este filtro de persistencia)
  //   T: pendiente · en-revision · done · descartado · historico
  //   B: pendiente · en-revision · done · descartado · historico
  //   P: pendiente · promovida · descartado · historico
  // Nota: historico se excluye antes de llegar aquí por el gate `it.status === 'historico'`
  // arriba — este Set lo declara por coherencia con el DDL, no porque llegue a evaluarse.
  const _VALID_STATUS_BY_TYPE = {
    R: new Set(['pendiente', 'en-proceso', 'en-revision', 'done', 'bloqueado', 'orphaned', 'descartado']),
    T: new Set(['pendiente', 'en-revision', 'done', 'descartado', 'historico']),
    B: new Set(['pendiente', 'en-revision', 'done', 'descartado', 'historico']),
    P: new Set(['pendiente', 'promovida', 'descartado', 'historico']),
  };

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

  const key = _tplKey('backlog-items');
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
  // Las columnas que contienen objetos JS (intencion, contract, no_incluye cuando es objeto)
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
  //   · origen_p  → origin_p (naming DDL)
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
      // DDL: columna 'parent' TEXT (no 'parent_id')
      parent:               it.parent           || it.parentId || null,
      // depends_on: array JS → text[] Postgres
      depends_on:           Array.isArray(it.depends_on) ? it.depends_on : [],
      triggered_by:         it.triggered_by     || null,
      no_incluye:           it.no_incluye != null ? it.no_incluye : null,
      kill_criteria:        it.kill_criteria    || null,
      promovida_a:          it.promovida_a      || null,
      // DDL: columna 'origin_p' TEXT (no 'origen_p')
      origin_p:             it.origen_p         || null,
      discard_reason:       it.discard_reason   || null,
      comportamiento_actual: it.comportamiento_actual || null,
      origin_module:        it.origin_module    || null,
      // DDL: columna 'verified_by' TEXT (no 'verificado_por')
      verified_by:          it.verificado_por   || null,
      schema_version:       it.schema_version != null ? Number(it.schema_version) : 2,
      // ac: array JS → jsonb Postgres
      ac:                   Array.isArray(it.ac) ? it.ac : [],
      // intencion, contract: objetos → jsonb Postgres
      intencion:            it.intencion        || null,
      contract:             it.contract         || null,
      // DDL: updated_at BIGINT (epoch ms) — no ISO string
      // _updatedAtMs calculado una vez fuera de _toItemRow — todas las filas comparten el mismo valor (AC-3)
      updated_at:           _updatedAtMs
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

  // B-[pendiente-ID]: incrementar contador in-flight ANTES del try — cubre toda la ventana
  // del upsert, no solo el caso de éxito. finally garantiza decremento incluso ante throw
  // no capturado por el catch interno (nunca debe quedar el contador desbalanceado).
  _saveBacklogInFlightCount++;
  try {
    const rows = items.map(_toItemRow);

    // B-202606-093: deduplicar por code antes del upsert — Postgres rechaza un batch con
    // el mismo code dos veces aunque onConflict esté declarado (viola unique constraint
    // dentro del mismo statement). Mismo patrón que migrateHistoricosToTrackerItems paso 3.
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

    // Upsert exitoso → escribir localStorage como caché. Nunca antes.
    try {
      localStorage.setItem(key, JSON.stringify(items));
      localStorage.setItem(metaKey, JSON.stringify(meta));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveBacklog: fallo al cachear en localStorage post-upsert', lsErr);
    }
    setSyncStatus('synced', '✓ sincronizado');
  } catch (err) {
    // T-202606-097: resetear _realtimeLastTs — el timestamp no llegó a Supabase.
    _realtimeLastTs = null;
    console.error('[AI Tracker] Supabase saveBacklog() failed:', err);
    setSyncStatus('offline', '✕ sin conexión');
    try {
      localStorage.setItem(key, JSON.stringify(items));
      localStorage.setItem(metaKey, JSON.stringify(meta));
    } catch (lsErr) {
      console.warn('[AI Tracker] saveBacklog: fallo al escribir localStorage fallback', lsErr);
    }
    showToast('warning', '⚠️ Backlog no sincronizado con Supabase — guardado localmente');
    _offlineQueuePush({ type: 'backlog', projId: projId || null });
  } finally {
    // B-[pendiente-ID]: decrementar siempre — éxito, error, o cualquier throw imprevisto.
    _saveBacklogInFlightCount--;
  }
}

// ── T-202606-105: storage dedicado para ítems status:historico ──────────────
// R-202606-037: ITEMS en memoria nunca contiene historico — estos ítems viven
// en su propia clave Supabase/localStorage ('tracker-backlog-historico'), separada
// de 'items'+suffix, confirmado por conteo en Supabase. saveBacklog() no lee ni
// escribe este storage — ver gate de exclusión ahí mismo.
const _HISTORICO_KEY = 'tracker-backlog-historico';

// Escribe el array de ítems historico en su clave dedicada — Supabase primero,
// localStorage como caché post-write exitoso o como fallback ante fallo de red.
export async function saveHistoricoItems(items) {
  const projId = _getActiveProjectFilter();
  const suffix = projId ? '-' + projId : '-global';
  const key = _HISTORICO_KEY + suffix;
  // B-202606-093 AC-2: deduplicar por code antes de escribir el JSONB — cada escritura
  // sanea el dato existente. Último ítem del array gana en caso de duplicado.
  const _raw = Array.isArray(items) ? items : [];
  const _dedupMap = new Map();
  for (const it of _raw) _dedupMap.set(it.code, it);
  const payload = Array.from(_dedupMap.values());
  if (payload.length < _raw.length) {
    console.warn(`[AI Tracker] saveHistoricoItems: duplicados en array eliminados antes de upsert: ${_raw.length - payload.length}`);
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

// ── T-202606-019: verifyPrePurgaIntegrity() — verificación de integridad pre-purga ──
// Función de solo lectura — no modifica ninguna tabla ni localStorage.
// Invocar desde consola del browser antes de ejecutar T4 (purga de JSONB legacy).
// Retorna: true (sin discrepancias) | false (delta detectado) | null (sin auth)
export async function verifyPrePurgaIntegrity() {
  // AC-5: sin auth → null + warn.
  if (!_supabase || !_supabaseUser) {
    console.warn('[Locus] verifyPrePurgaIntegrity: sin auth — verificación no disponible');
    return null;
  }

  const projId = _getActiveProjectFilter();
  const suffix = projId ? '-' + projId : '-global';

  try {
    // Queries paralelas — solo lectura.
    const [itemsResult, jsonbResult, historicoResult] = await Promise.all([
      // 1. Contar filas activas en tracker_items (excluye status:historico).
      _supabase
        .from('tracker_items')
        .select('code, status', { count: 'exact' })
        .eq('project_id', projId || '')
        .neq('status', 'historico'),

      // 2. Leer blob items-PP desde tracker_backlog (JSONB legacy).
      _supabase
        .from('tracker_backlog')
        .select('value')
        .eq('user_id', _supabaseUser.id)
        .eq('key', 'items' + suffix)
        .maybeSingle(),

      // 3. Leer históricos desde tracker_backlog clave historico-PP.
      _supabase
        .from('tracker_backlog')
        .select('value')
        .eq('user_id', _supabaseUser.id)
        .eq('key', 'historico' + suffix)
        .maybeSingle()
    ]);

    // ── 1. Procesar tracker_items ────────────────────────────────────────
    if (itemsResult.error) throw itemsResult.error;
    const itemsCount = itemsResult.count ?? (itemsResult.data ? itemsResult.data.length : 0);

    // ── 2. Procesar blob JSONB legacy ────────────────────────────────────
    if (jsonbResult.error) throw jsonbResult.error;
    const jsonbRaw   = jsonbResult.data && Array.isArray(jsonbResult.data.value) ? jsonbResult.data.value : [];
    // AC-2/AC-3: excluir status:historico del conteo JSONB — comparación simétrica.
    const jsonbActive = jsonbRaw.filter(it => it.status !== 'historico');
    const jsonbCount  = jsonbActive.length;

    // ── 3. Procesar históricos ────────────────────────────────────────────
    if (historicoResult.error) throw historicoResult.error;
    const historicoRaw   = historicoResult.data && Array.isArray(historicoResult.data.value) ? historicoResult.data.value : [];
    const historicoCount = historicoRaw.length;

    // ── AC-1: reporte de los tres conteos ────────────────────────────────
    console.log('[Locus] verifyPrePurgaIntegrity — conteos pre-purga:');
    console.log('  tracker_items  (activos, project_id=' + (projId || 'global') + '):', itemsCount);
    console.log('  tracker_backlog items' + suffix + ' (JSONB activos, excl. historico):', jsonbCount);
    console.log('  tracker_backlog historico' + suffix + ':', historicoCount);

    // ── AC-4: históricos reportados, no afectan retorno ──────────────────
    if (historicoCount > 0) {
      console.log('[Locus] verifyPrePurgaIntegrity — históricos en tracker_backlog: ' + historicoCount + ' ítem(s). Storage correcto — no requieren migración.');
    }

    // ── AC-2 / AC-3: comparación y retorno ───────────────────────────────
    const delta = jsonbCount - itemsCount;
    if (delta > 0) {
      // AC-2: discrepancia — hay ítems en JSONB que no están en tracker_items.
      console.warn('[Locus] verifyPrePurgaIntegrity — ATENCIÓN: ' + delta + ' ítem(s) en JSONB no encontrados en tracker_items. NO ejecutar purga hasta resolver.');
      return false;
    }

    // AC-3: sin discrepancia.
    console.log('[Locus] verifyPrePurgaIntegrity — OK: integridad verificada. Seguro proceder con purga.');
    return true;

  } catch (err) {
    console.error('[Locus] verifyPrePurgaIntegrity — error al verificar:', err);
    return null;
  }
}
// ── END T-202606-019 ──────────────────────────────────────────────────────────

// ── T-202606-020: migrateHistoricosToTrackerItems() — migración históricos JSONB → tracker_items ──
// AC: los 201 ítems historico del JSONB de tracker_backlog se insertan como filas en tracker_items.
// Sin duplicados: onConflict:'code' — si el code ya existe se omite silenciosamente.
// Edge case: ítems malformados se registran en errorLog y la migración continúa.
// Prerrequisito de T-202606-010 (purga).
export async function migrateHistoricosToTrackerItems() {
  if (!_supabase || !_supabaseUser) {
    console.warn('[Locus] migrateHistoricosToTrackerItems: sin auth — migración no disponible');
    return null;
  }

  const projId = _getActiveProjectFilter();
  const suffix = projId ? '-' + projId : '-global';

  try {
    // 1. Leer históricos desde tracker_backlog clave historico+suffix
    const { data: blData, error: blError } = await _supabase
      .from('tracker_backlog')
      .select('value')
      .eq('user_id', _supabaseUser.id)
      .eq('key', 'historico' + suffix)
      .maybeSingle();

    if (blError) throw blError;

    const historicos = blData && Array.isArray(blData.value) ? blData.value : [];
    console.log('[Locus] migrateHistoricosToTrackerItems — históricos encontrados en JSONB:', historicos.length);

    if (historicos.length === 0) {
      console.log('[Locus] migrateHistoricosToTrackerItems — sin históricos que migrar. Done.');
      return { migrated: 0, errors: [] };
    }

    // 2. Construir filas para tracker_items — mismo esquema que _toItemRow en saveBacklog
    const _updatedAtMs = Date.now();
    const errorLog = [];
    const rows = [];

    for (const it of historicos) {
      try {
        if (!it || typeof it !== 'object') throw new Error('ítem no es objeto');
        if (!it.code) throw new Error('ítem sin code');
        rows.push({
          project_id:            projId || null,
          code:                  it.code,
          type:                  it.type             || null,
          title:                 it.title            || null,
          status:                'historico',
          priority:              it.priority         || null,
          effort:                it.effort != null ? Number(it.effort) : null,
          area:                  it.area             || null,
          sprint:                it.sprint           || null,
          role:                  it.role             || null,
          parent:                it.parent           || it.parentId || null,
          depends_on:            Array.isArray(it.depends_on) ? it.depends_on : [],
          triggered_by:          it.triggered_by     || null,
          no_incluye:            it.no_incluye       != null ? it.no_incluye : null,
          kill_criteria:         it.kill_criteria    || null,
          promovida_a:           it.promovida_a      || null,
          origin_p:              it.origen_p         || null,
          discard_reason:        it.discard_reason   || null,
          comportamiento_actual: it.comportamiento_actual || null,
          origin_module:         it.origin_module    || null,
          verified_by:           it.verificado_por   || null,
          schema_version:        it.schema_version != null ? Number(it.schema_version) : 2,
          ac:                    Array.isArray(it.ac) ? it.ac : [],
          intencion:             it.intencion        || null,
          contract:              it.contract         || null,
          updated_at:            _updatedAtMs
        });
      } catch (rowErr) {
        errorLog.push({ code: it?.code || '[sin code]', error: rowErr.message });
        console.warn('[Locus] migrateHistoricosToTrackerItems — ítem omitido:', it?.code || '[sin code]', rowErr.message);
      }
    }

    // 3. Deduplicar rows por code — Postgres rechaza upsert si el mismo code aparece dos veces en el batch.
    // Último ítem del array gana en caso de duplicado (comportamiento estándar de Map).
    const rowsMap = new Map();
    for (const row of rows) rowsMap.set(row.code, row);
    const dedupedRows = Array.from(rowsMap.values());
    if (dedupedRows.length < rows.length) {
      console.warn('[Locus] migrateHistoricosToTrackerItems — duplicados en JSONB eliminados:', rows.length - dedupedRows.length);
    }

    // 4. Upsert en tracker_items — onConflict:'code' inserta nuevos y actualiza existentes.
    // No usamos ignoreDuplicates:true — necesitamos que los colisionantes queden con status:historico.
    if (dedupedRows.length > 0) {
      const { error: upsertError } = await _supabase
        .from('tracker_items')
        .upsert(dedupedRows, { onConflict: 'code' });
      if (upsertError) throw upsertError;
    }

    // 4b. Forzar status:historico en cualquier fila que haya quedado con status distinto.
    // UPDATE selectivo solo en los codes del batch — no toca filas fuera del conjunto migrado.
    if (dedupedRows.length > 0) {
      const codes = dedupedRows.map(r => r.code);
      const { error: updateError } = await _supabase
        .from('tracker_items')
        .update({ status: 'historico' })
        .in('code', codes)
        .eq('project_id', projId || null);
      if (updateError) throw updateError;
    }

    // 4. Verificar integridad post-migración — COUNT de historico en tracker_items (sin user_id — no es columna del DDL)
    const { count, error: countError } = await _supabase
      .from('tracker_items')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projId || null)
      .eq('status', 'historico');

    if (countError) throw countError;

    console.log('[Locus] migrateHistoricosToTrackerItems — filas historico en tracker_items post-migración:', count);
    console.log('[Locus] migrateHistoricosToTrackerItems — errores de fila:', errorLog.length);
    if (errorLog.length > 0) console.warn('[Locus] migrateHistoricosToTrackerItems — errorLog:', errorLog);

    console.log('[Locus] migrateHistoricosToTrackerItems — OK. Migrados:', dedupedRows.length, '· Errores:', errorLog.length);
    return { migrated: dedupedRows.length, historicoCountInTable: count, errors: errorLog };

  } catch (err) {
    console.error('[Locus] migrateHistoricosToTrackerItems — error:', err);
    return null;
  }
}
// ── END T-202606-020 ──────────────────────────────────────────────────────────

// ── T-202606-010: executePurgaJsonbLegacy() — purga de JSONB legacy en tracker_backlog ──
// Prerrequisito: verifyPrePurgaIntegrity() retorna true + T-202606-020 done.
// Elimina las claves items+suffix e historico+suffix de tracker_backlog para el proyecto activo.
// AC edge case: no introduce dependencia que haga irreversible un rollback a PP-S-01 —
// los datos ya están en tracker_items (relacional) y en localStorage como caché.
export async function executePurgaJsonbLegacy() {
  if (!_supabase || !_supabaseUser) {
    console.warn('[Locus] executePurgaJsonbLegacy: sin auth — purga no disponible');
    return null;
  }

  const projId = _getActiveProjectFilter();
  const suffix = projId ? '-' + projId : '-global';
  const keysToDelete = ['items' + suffix, 'historico' + suffix];

  try {
    console.log('[Locus] executePurgaJsonbLegacy — iniciando purga de claves:', keysToDelete);

    const { error, count } = await _supabase
      .from('tracker_backlog')
      .delete({ count: 'exact' })
      .eq('user_id', _supabaseUser.id)
      .in('key', keysToDelete);

    if (error) throw error;

    console.log('[Locus] executePurgaJsonbLegacy — OK. Filas eliminadas de tracker_backlog:', count);
    console.log('[Locus] executePurgaJsonbLegacy — claves purgadas:', keysToDelete);
    return { deleted: count, keys: keysToDelete };

  } catch (err) {
    console.error('[Locus] executePurgaJsonbLegacy — error:', err);
    return null;
  }
}
// ── END T-202606-010 ──────────────────────────────────────────────────────────

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
  // B-202606-094 fix: updated_at llega en dos formatos según la tabla — ISO string
  // (tracker_state, tracker_backlog) o epoch ms BIGINT (tracker_items). _realtimeLastTs
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
      // T-202606-005: cargar sprints desde tracker_sprints después de _applyStateData
      // para que el projId del proyecto activo esté disponible.
      const _activeProjForSprints = getActiveProject();
      if (_activeProjForSprints) {
        await _loadSprintsFromSupabase(_activeProjForSprints.id);
      }
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

    // ── 2. Batch paralelo: sesiones + items relacional + backlog JSONB (legacy) + docs + drafts ──
    // T-202606-009: items se carga desde tracker_items (tabla relacional) en paralelo con
    // el resto del batch. El JSONB legacy de items/historico (blResult / tracker_backlog) está
    // confirmado vacío desde 2026-06-24 — purga ejecutada, sin filas remanentes.
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

    const [sessResult, itemsResult, blResult, docsResult, draftsResult] = await Promise.allSettled([
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

      // 5b. Backlog JSONB legacy — purga ejecutada (T-202606-010), confirmado vacío desde 2026-06-24.
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
    // un _loadFromSupabase() disparado por OTRO canal (tracker_state/tracker_backlog/tracker_sessions
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
        const shouldEvaluate = _itemsRef !== null && (
          _itemsRef.length === 0 ||
          !localItemsRaw     ||
          remoteMaxTs > localMaxTs
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
            const item = {
              code:                  row.code,
              type:                  row.type,
              title:                 row.title,
              status:                row.status,
              priority:              row.priority,
              effort:                row.effort,
              area:                  row.area,
              sprint:                row.sprint,
              role:                  row.role,
              parent:                row.parent,       // DDL: parent TEXT
              depends_on:            Array.isArray(row.depends_on) ? row.depends_on : [],
              triggered_by:          row.triggered_by,
              no_incluye:            row.no_incluye,
              kill_criteria:         row.kill_criteria,
              promovida_a:           row.promovida_a,
              origen_p:              row.origin_p,     // DDL: origin_p → JS: origen_p
              discard_reason:        row.discard_reason,
              comportamiento_actual: row.comportamiento_actual,
              origin_module:         row.origin_module,
              verificado_por:        row.verified_by,  // DDL: verified_by → JS: verificado_por
              schema_version:        row.schema_version,
              ac:                    Array.isArray(row.ac) ? row.ac : [],
              intencion:             row.intencion,
              contract:              row.contract,
              _updatedAtMs:          row.updated_at    // conservar timestamp para comparaciones futuras
            };
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

    // ── 5b. Procesar backlog JSONB legacy ────────────────────────────────
    // Purga ya ejecutada (T-202606-010) desde 2026-06-24 — este bloque está inerte
    // (blResult sin filas). Se elimina junto con la entrada en el batch en limpieza futura.
    try {
      if (blResult.status === 'fulfilled' && !blResult.value.error) {
        const blRows = blResult.value.data;
        if (blRows && blRows.length) {
          const blMap = Object.fromEntries(blRows.map(r => [r.key, r.value]));
          const remoteMeta  = blMap['meta'  + suffix] || {};
          localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(remoteMeta));
        }
      } else {
        console.warn('[AI Tracker] Error cargando backlog JSONB legacy desde Supabase:', blResult.reason || blResult.value?.error);
      }
    } catch (blErr) {
      console.warn('[AI Tracker] Error procesando backlog JSONB legacy:', blErr);
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

// T-202606-011: verificar que todo proyecto con datos de sprint en el blob legacy
// tiene su contraparte completa en tracker_sprints, re-migrar si falta, y eliminar
// los datos de sprint del blob una vez verificado. Reemplaza la función de migración
// de T-202606-004 — su propósito (poblar tracker_sprints) ya fue cumplido; esta función
// además limpia el blob, lo que la anterior explícitamente no hacía (AC-6 de T-202606-005).
// Llamada desde _applyStateData() como fire-and-forget cuando auth está disponible.
//
// AC-1: verificación — para cada proyecto con sprints en el blob, confirma que el mismo
//   conjunto de sprint_id existe en tracker_sprints.
// AC-2: edge case — si falta algún sprint_id en tracker_sprints, re-ejecuta el upsert
//   (misma lógica de construcción de filas que tenía la función anterior) antes
//   de continuar con la limpieza de ese proyecto.
// AC-3: estado de error — si la re-migración falla, no limpia el blob de ese proyecto,
//   lo deja intacto, registra el project_id en consola, continúa con el resto.
// AC-4: happy path — una vez verificado (directo o tras re-migración exitosa), elimina
//   proj.sprints del blob para ese proyecto. Resto del blob sin cambio.
// AC-5: edge case — proyecto sin sprints en el blob se omite sin error.
async function _verifyAndCleanSprintsBlob(projects) {
  if (!_supabase || !_supabaseUser) return;
  const userId = _supabaseUser.id;

  const toIso = v => {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return new Date(v).toISOString();
    return null;
  };

  const buildRows = (projId, sprints) => sprints.map(sp => {
    let status = sp.status || 'pendiente';
    if (status === 'open') status = 'abierto';
    return {
      user_id:        userId,
      project_id:     projId,
      sprint_id:      sp.id,
      label:          sp.label || null,
      status,
      version_target: sp.version_target || null,
      release_type:   sp.release_type || null,
      scope:          sp.scope || null,
      goal:           sp.goal || null,
      out_of_scope:   sp.out_of_scope || null,
      opened_at:      toIso(sp.startedAt || sp.opened_at),
      closed_at:      toIso(sp.closedAt || sp.closed_at),
      updated_at:     new Date().toISOString()
    };
  }).filter(r => !!r.sprint_id);

  for (const proj of projects) {
    const projId = proj.id;
    if (!projId) continue;
    const sprints = proj.sprints || [];
    // AC-5: proyecto sin sprints en el blob — omitir sin error
    if (!sprints.length) continue;

    // AC-1: verificar que cada sprint_id del blob existe en tracker_sprints
    const { data: existing, error: checkErr } = await _supabase
      .from('tracker_sprints')
      .select('sprint_id')
      .eq('user_id', userId)
      .eq('project_id', projId);
    if (checkErr) {
      console.error('[Locus] T-202606-011: error al verificar tracker_sprints para', projId, checkErr);
      continue; // AC-3: no limpiar este proyecto si la verificación falla
    }

    const existingIds = new Set((existing || []).map(r => r.sprint_id));
    const missing = sprints.filter(sp => sp.id && !existingIds.has(sp.id));

    if (missing.length > 0) {
      // AC-2: re-migrar los sprints faltantes antes de limpiar
      const rows = buildRows(projId, missing);
      if (rows.length > 0) {
        const { error: upsertErr } = await _supabase
          .from('tracker_sprints')
          .upsert(rows, { onConflict: 'user_id,sprint_id' });
        if (upsertErr) {
          // AC-3: fallo de re-migración — no limpiar el blob de este proyecto
          console.error('[Locus] T-202606-011: re-migración falló para', projId, upsertErr);
          continue;
        }
        console.log('[Locus] T-202606-011: re-migrados', rows.length, 'sprint(s) faltante(s) —', projId);
      }
    }

    // AC-4: verificación (directa o post re-migración) exitosa — limpiar blob de este proyecto
    delete proj.sprints;
    console.log('[Locus] T-202606-011: blob de sprints eliminado —', projId);
  }
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

  // T-202606-016: _ensureHotfixSprint — crea sprint S-HOTFIX si el proyecto no lo tiene.
  // Idempotente: AC-3 — si ya existe isHotfix:true no crea otro.
  // AC-4: no modifica sprints regulares existentes.
  // Se llama dentro del forEach de migración — cubre proyectos nuevos (AC-1) y existentes (AC-2).
  // T-202606-016: _ensureHotfixSprint — crea sprint S-HOTFIX si el proyecto no lo tiene.
  // Idempotente: AC-3 — si ya existe isHotfix:true no crea otro.
  // AC-4: no modifica sprints regulares existentes.
  // Se llama dentro del forEach de migración — cubre proyectos nuevos (AC-1) y existentes (AC-2).
  //
  // T-202606-011 — impacto lateral, ciclo 2: con sesión Supabase activa, NO puede usarse
  // getActiveSprints()/_sprintsCache para detectar si ya existe el HOTFIX — _sprintsCache
  // se popula en _loadSprintsFromSupabase(projId), que en _loadFromSupabase() corre DESPUÉS
  // de _applyStateData() (diseño de T-202606-005, para que el projId del proyecto activo
  // esté disponible). En el momento en que este forEach corre, _sprintsCache tiene datos
  // obsoletos o vacíos — nunca los del proyecto que se está procesando.
  // Fix: consulta directa a tracker_sprints, mismo patrón que _verifyAndCleanSprintsBlob.
  // Fire-and-forget — no bloquea _applyStateData(). onConflict en _upsertSprint hace que
  // un duplicado eventual (multi-tab) no persista: la segunda escritura sobreescribe la
  // primera con el mismo sprint_id.
  function _ensureHotfixSprint(proj) {
    const _hasSupabaseSession = !!(_supabase && _supabaseUser);

    if (_hasSupabaseSession) {
      _supabase
        .from('tracker_sprints')
        .select('sprint_id')
        .eq('user_id', _supabaseUser.id)
        .eq('project_id', proj.id)
        .then(({ data, error }) => {
          if (error) {
            console.error('[Locus] T-202606-011: _ensureHotfixSprint verificación falló —', proj.id, error);
            return;
          }
          const _hasHotfix = (data || []).some(r => (r.sprint_id || '').includes('-S-HOTFIX'));
          if (_hasHotfix) return; // ya existe en tracker_sprints

          let prefix = 'XX';
          const regularRow = (data || []).find(r => /^[A-Za-z]+-S\d+$/i.test(r.sprint_id || ''));
          if (regularRow) {
            const m = (regularRow.sprint_id || '').match(/^([A-Za-z]+)-S\d+$/i);
            if (m) prefix = m[1].toUpperCase();
          } else if (proj.prefix) {
            prefix = String(proj.prefix).toUpperCase();
          } else if (proj.name) {
            prefix = proj.name.split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 3) || 'XX';
          }
          const hotfixId = prefix + '-S-HOTFIX';
          const hotfixSprintObj = {
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
          };
          _upsertSprint(hotfixSprintObj, proj.id).catch(err => {
            console.error('[Locus] T-202606-011: _ensureHotfixSprint upsert falló —', proj.id, err);
          });
          console.log('[Locus] T-202606-011: sprint HOTFIX creado en tracker_sprints —', hotfixId);
        })
        .catch(err => {
          console.error('[Locus] T-202606-011: _ensureHotfixSprint query falló —', proj.id, err);
        });
      return;
    }

    // Sin sesión activa — comportamiento legacy sin cambio, escribe en el blob.
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
    // T-202606-005 AC-6: _applyStateData ya no es la fuente de verdad para sprints.
    // Los sprints viven en tracker_sprints — _loadSprintsFromSupabase() popula _sprintsCache.
    // Las migraciones de blob abajo se conservan como idempotentes para compatibilidad
    // con sesiones sin auth (donde el blob legacy sigue siendo la única fuente).
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

  // T-202606-011: verificar migración completa a tracker_sprints y limpiar el blob legacy.
  // Fire-and-forget — no bloquea _applyStateData(). Re-migra defensivamente si falta algún
  // sprint, luego elimina proj.sprints del blob de cada proyecto verificado.
  if (_supabase && _supabaseUser) {
    _verifyAndCleanSprintsBlob(raw.projects || []).catch(err => {
      console.error('[Locus] T-202606-011: verificación/limpieza de sprints falló', err);
    });
  }

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

// Sprints del proyecto activo
// T-202605-025: parámetro opcional currentOnly — cuando true retorna el sprint current
// del proyecto activo. null si no hay proyecto activo o ningún sprint tiene current: true.
// T-202606-005: lee desde _sprintsCache (poblado desde tracker_sprints) en lugar del blob.
// Shape de retorno idéntico — ningún call site requiere cambio.
export function getActiveSprints(currentOnly = false) {
  if (currentOnly) return _sprintsCache.find(sp => sp.current === true) || null;
  return _sprintsCache;
}

// T-202606-005: popula _sprintsCache desde tracker_sprints en Supabase.
// Llamada desde _loadFromSupabase() al cargar. Fallback a localStorage si no hay auth.
// AC-8: error de Supabase → retorna array vacío + toast de advertencia.
export async function _loadSprintsFromSupabase(projId) {
  const lsKey = 'sprints-' + (projId || 'global');
  if (!_supabase || !_supabaseUser) {
    // AC-7 fallback sin auth → localStorage
    try {
      const raw = localStorage.getItem(lsKey);
      _sprintsCache = raw ? JSON.parse(raw) : [];
    } catch(e) {
      _sprintsCache = [];
    }
    return;
  }
  try {
    const { data, error } = await _supabase
      .from('tracker_sprints')
      .select('sprint_id,label,status,version_target,release_type,scope,goal,out_of_scope,opened_at,closed_at,updated_at,project_id')
      .eq('user_id', _supabaseUser.id)
      .eq('project_id', projId || '');
    if (error) throw error;
    // AC-2: mapear campos de tracker_sprints al shape canónico de sprint en memoria
    _sprintsCache = (data || []).map(row => ({
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
    }));
    // Escribir a localStorage como caché (AC-7: fallback disponible en próxima sesión sin auth)
    try { localStorage.setItem(lsKey, JSON.stringify(_sprintsCache)); } catch(e) {}
  } catch(err) {
    // AC-8: error de Supabase → array vacío + toast
    console.error('[Locus] T-202606-005: error al cargar tracker_sprints', err);
    showToast('warning', 'No se pudieron cargar los sprints — reintentando al reconectar');
    _sprintsCache = [];
  }
}

// T-202606-005: helpers exportados para createSprint y setSprintStatus en locus-backlog-sprints.js

// Upsert de un sprint a tracker_sprints + actualiza _sprintsCache.
// Fallback sin auth: escribe a localStorage clave sprints-{projId}.
export async function _upsertSprint(sprintObj, projId) {
  // Actualizar cache en memoria primero (optimistic)
  const idx = _sprintsCache.findIndex(s => s.id === sprintObj.id);
  if (idx >= 0) {
    _sprintsCache[idx] = { ..._sprintsCache[idx], ...sprintObj };
  } else {
    _sprintsCache.push({ ...sprintObj, projId, projectId: projId });
  }

  const lsKey = 'sprints-' + (projId || 'global');

  if (!_supabase || !_supabaseUser) {
    // AC-7: fallback sin auth → localStorage
    try { localStorage.setItem(lsKey, JSON.stringify(_sprintsCache)); } catch(e) {}
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
    try { localStorage.setItem(lsKey, JSON.stringify(_sprintsCache)); } catch(e) {}
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
