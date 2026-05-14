// locus-storage.js
// Última actualización: 2026-05-13 UTC-6
// Módulo de persistencia, auth y sync — extraído de ai-tracker-checkpoint.js
// Carga ANTES que ai-tracker-checkpoint.js en index.html
// No contiene lógica de UI, render, toast ni timer de sesión.

// ── VARIABLES DE MÓDULO ───────────────────────────────────────────────────────

// R-202604-086: versión efectiva — localStorage override prevalece sobre APP_VERSION.
// Se escribe desde _mgApplyBumpedVersion() en ai-tracker-map-generator.js al confirmar el generador.
// APP_VERSION es el fallback de primer arranque; el generador es la fuente de verdad post-bump.
const _APP_VERSION_KEY = 'app-version-override';
// B-202605-263: función getter — lee localStorage en cada invocación para reflejar bumps post-carga
function _effectiveVersion() {
  try {
    const stored = localStorage.getItem(_APP_VERSION_KEY);
    return (stored && stored.trim() && stored !== 'undefined') ? stored : APP_VERSION;
  } catch(e) { return APP_VERSION; }
}

// ── T-202605-482c: Supabase Auth — Google OAuth (founder único, multidispositivo) ──
const SUPABASE_URL  = (typeof window !== 'undefined') ? (window.__ENV?.SUPABASE_URL       || window.SUPABASE_URL)       : null;
const SUPABASE_KEY  = (typeof window !== 'undefined') ? (window.__ENV?.SUPABASE_ANON_KEY  || window.SUPABASE_ANON_KEY)  : null;

let _supabase           = null;   // cliente Supabase
let _supabaseUser       = null;   // sesión activa del founder
let _supabaseReady      = null;   // promesa: resuelve cuando onAuthStateChange dispara
let _realtimeChannel    = null;   // T-202605-XXX: canal Realtime para sync multidispositivo
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
            if (typeof _loadFromSupabase === 'function') _loadFromSupabase();
            if (typeof render === 'function') render();
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
        if (typeof _refreshMigrationBtnVisibility === 'function') _refreshMigrationBtnVisibility();
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
        if (typeof _loadFromSupabase === 'function') _loadFromSupabase();
        if (typeof render === 'function') render();
        _subscribeRealtime();
        if (typeof _refreshMigrationBtnVisibility === 'function') _refreshMigrationBtnVisibility();
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
function setSyncStatus(status, label) {
  // T-202605-433: sync-pill eliminado — nuevos IDs en menú ⋯
  const dot = document.getElementById('sync-status-dot');
  const lbl = document.getElementById('sync-status-label');
  if (dot) dot.className = 'mm-icon sync-status-dot sync-status-dot--' + status;
  if (lbl) lbl.textContent = 'Sync: ' + label;
  // R-202604-060: mirror en global footer
  const gfSync = document.getElementById('gf-sync');
  if (gfSync) { gfSync.className = 'gf-sync gf-sync--' + status; gfSync.textContent = label; }
  // T-202605-USR: chip de usuario en header
  const chip = document.getElementById('user-chip');
  const chipDot = document.getElementById('user-chip-dot');
  const chipName = document.getElementById('user-chip-name');
  if (chip && chipDot && chipName) {
    if (_supabaseUser) {
      const name = (_supabaseUser.user_metadata?.full_name || _supabaseUser.email || '').split(' ')[0];
      chipName.textContent = name;
      chipDot.className = 'user-chip-dot user-chip-dot--' + status;
      chip.classList.remove('is-hidden');
    } else {
      chip.classList.add('is-hidden');
    }
  }
}

function handleSyncPillClick() {
  if (!_supabaseUser) { if (typeof openAuthModal === 'function') openAuthModal(); else signInWithSupabase(); }
  else { signOutSupabase(); }
}

// ── SHORTCUTS + USER PREFS ───────────────────────────────────────────────────
// T-202605-442: Atajos de teclado configurables — migrado desde ai-tracker-checkpoint.js
// _saveUserPrefs (más abajo) los necesita al serializar preferencias hacia Supabase
const _SHORTCUTS_KEY = 'user-shortcuts';
const _USER_PREFS_TS_KEY = 'user-prefs-ts'; // R-4: timestamp del último user-prefs aplicado desde Supabase

function _shortcutsLoad() {
  try {
    const raw = localStorage.getItem(_SHORTCUTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(_) { return {}; }
}

function _shortcutsSave(map) {
  localStorage.setItem(_SHORTCUTS_KEY, JSON.stringify(map));
  _saveUserPrefs(); // R-4: persistir en Supabase
}

// ── TMP ID MAP ────────────────────────────────────────────────────────────────
// Migrado desde ai-tracker-checkpoint.js — operación Supabase pura
function _loadTmpIdMap() {
  try {
    const raw = localStorage.getItem('tmp-id-map');
    if (!raw) return {};
    const map = JSON.parse(raw);
    // TTL: limpiar entradas con más de 24h
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let dirty = false;
    Object.keys(map).forEach(k => {
      if (!map[k].createdAt || map[k].createdAt < cutoff) { delete map[k]; dirty = true; }
    });
    if (dirty) localStorage.setItem('tmp-id-map', JSON.stringify(map));
    return map;
  } catch(e) { return {}; }
}

function _saveTmpIdMap(map) {
  try { localStorage.setItem('tmp-id-map', JSON.stringify(map)); } catch(e) {}
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
const _OFFLINE_QUEUE_KEY = 'ai-tracker-offline-queue';
let _offlineQueue = (() => {
  try { return JSON.parse(localStorage.getItem(_OFFLINE_QUEUE_KEY) || '[]'); } catch { return []; }
})();
let _isOnline = navigator.onLine;

function _offlineQueueSave() {
  try { localStorage.setItem(_OFFLINE_QUEUE_KEY, JSON.stringify(_offlineQueue)); } catch(e) {}
}

// Encola un write pendiente con timestamp — last-write-wins por tipo de entrada
function _offlineQueuePush(entry) {
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
        const planRaw = localStorage.getItem('ai-tracker-plan-' + entry.projId);
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
        const raw = localStorage.getItem('tmp-id-map');
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
function getSupabaseUserId() {
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

  // localStorage siempre (rápido, sin costo de red)
  try {
    localStorage.setItem('ai-tracker-v4', JSON.stringify(state));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('[AI Tracker] localStorage quota exceeded in save(), attempting cleanup...');
      try {
        localStorage.removeItem('ai-tracker-changelog');
        localStorage.setItem('ai-tracker-v4', JSON.stringify(state));
        showToast('warning', '⚠️ Cuota crítica — se limpió historial automáticamente');
      } catch (err2) {
        console.error('[AI Tracker] save() failed after cleanup:', err2);
        showToast('error', '❌ Almacenamiento lleno. Limpia sesiones archivadas.');
        _stateDirty = false;
        return;
      }
    } else {
      throw err;
    }
  }

  // T-202605-482: Supabase — prioridad cuando disponible
  if (_supabase && _supabaseUser && _stateDirty) {
    _stateDirty = false;
    setSyncStatus('syncing', '⟳ sincronizando');
    try {
      const stateWithoutSessions = {
        ...state,
        projects: (state.projects || []).map(p => { const { sessions, ...rest } = p; return rest; })
      };
      const _nowTs = new Date().toISOString();
      const { error } = await _supabase.from('tracker_state').upsert({
        user_id: _supabaseUser.id,
        key: 'main',
        value: stateWithoutSessions,
        updated_at: _nowTs
      }, { onConflict: 'user_id,key' });
      if (error) throw error;
      // T-202605-XXX: registrar el ts que acabamos de escribir
      // para que el listener Realtime lo ignore (evita reload-loop)
      _realtimeLastTs = _nowTs;

      // Sesiones — upsert en paralelo por proyecto
      const sessionWrites = [];
      for (const proj of (state.projects || [])) {
        if (proj.sessions && proj.sessions.length > 0) {
          sessionWrites.push(_saveSessions(proj));
        }
      }
      if (sessionWrites.length > 0) await Promise.all(sessionWrites);

      setSyncStatus('synced', '✓ sincronizado');
    } catch (err) {
      console.error('[AI Tracker] Supabase save() failed:', err);
      _stateDirty = true;
      setSyncStatus('offline', '✕ sin conexión');
      showToast('warning', '⚠️ No se sincronizó con Supabase — datos guardados localmente');
      // T-202605-483: encolar para reintento al reconectar
      _offlineQueuePush({ type: 'state' });
    }
    return;
  }

}

// R-202604-035 / T-202604-299: save() — debounced
// Escribe localStorage inmediatamente (sync); Supabase se acumula hasta _SAVE_DEBOUNCE_MS
// Para eventos críticos usar saveImmediate()
function save() {
  _stateDirty = true;
  // localStorage siempre inmediato (barato)
  try {
    localStorage.setItem('ai-tracker-v4', JSON.stringify(state));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('[AI Tracker] localStorage quota exceeded in save(), attempting cleanup...');
      try {
        localStorage.removeItem('ai-tracker-changelog');
        localStorage.setItem('ai-tracker-v4', JSON.stringify(state));
        showToast('warning', '⚠️ Cuota crítica — se limpió historial automáticamente');
      } catch (err2) {
        console.error('[AI Tracker] save() failed after cleanup:', err2);
        showToast('error', '❌ Almacenamiento lleno. Limpia sesiones archivadas.');
        return;
      }
    } else {
      throw err;
    }
  }
  // T-202604-304 / T-202604-302: actualización reactiva del Radar tras cualquier mutación de estado
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  // R-202604-073: actualización reactiva del dot Pulso
  if (typeof renderPulsoDot === 'function') renderPulsoDot();
  // T-202605-482: Supabase — encolar debounce o encolar offline directo
  if (_supabase) {
    if (!_isOnline) {
      // offline — encolar sin intentar red
      _offlineQueuePush({ type: 'state' });
    } else {
      clearTimeout(_saveDebounceTimer);
      _saveDebounceTimer = setTimeout(() => _saveFlush(), _SAVE_DEBOUNCE_MS);
    }
  }
}

// T-202604-299: saveImmediate() — bypasa debounce para eventos críticos
// Usar en: saveSession(), signOutSupabase(), beforeunload
async function saveImmediate() {
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
      const chunk = sessions.slice(i, i + BATCH).map(sess => ({
        user_id:    _supabaseUser.id,
        project_id: proj.id,
        session_id: sess.id,
        data:       sess,
        updated_at: new Date().toISOString()
      }));
      const { error } = await _supabase.from('tracker_sessions').upsert(chunk, { onConflict: 'user_id,session_id' });
      if (error) {
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
const BACKLOG_LOG_MAX = 100;
const _DOC_LOG_KEYS = { backlog: 'backlog-log', context: 'context-log', htmlmap: 'html-map-log' };

function _blogLog(action, code, detail, doc) {
  const key = _DOC_LOG_KEYS[doc] || _DOC_LOG_KEYS.backlog;
  let log = [];
  try { log = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  log.unshift({ ts: Date.now(), action, code: code || '', detail: detail || '' });
  if (log.length > BACKLOG_LOG_MAX) log = log.slice(0, BACKLOG_LOG_MAX);
  try { localStorage.setItem(key, JSON.stringify(log)); } catch {}
}

function _relTs(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min';
  if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + 'h';
  return 'hace ' + Math.floor(diff / 86400) + 'd';
}

// R-202604-035: saveBacklog() — escribe en /backlog/items-{suffix} y /backlog/meta-{suffix}
async function saveBacklog() {
  // T-[pendiente-ID]: purga inteligente — si localStorage supera el 80% de capacidad,
  // purgar ítems done/descartado >90 días del caché local antes de intentar escribir.
  // Los ítems purgados siguen existiendo en Supabase — solo se elimina el caché local.
  if (typeof _localStorageUsageRatio === 'function' && _localStorageUsageRatio() > 0.8) {
    if (typeof _purgeStaleBacklogCache === 'function') {
      const purged = _purgeStaleBacklogCache();
      if (purged > 0) showToast('warning', `⚠️ Caché local compacto — ${purged} ítem${purged > 1 ? 's' : ''} archivado${purged > 1 ? 's' : ''} (disponibles en Supabase)`);
    }
  }

  const items = (typeof ITEMS !== 'undefined') ? ITEMS : [];
  const key = _tplKey('backlog-items');
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('[AI Tracker] localStorage quota exceeded, attempting cleanup...');
      try {
        localStorage.removeItem('ai-tracker-changelog');
        localStorage.setItem(key, JSON.stringify(items));
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
        // Registrar handlers tras render (el toast se inserta en el stack sincrónicamente)
        requestAnimationFrame(() => {
          const btnExport = document.getElementById('toast-quota-export');
          const btnClean  = document.getElementById('toast-quota-clean');
          if (btnExport) {
            btnExport.addEventListener('click', () => {
              if (typeof exportBacklogMd === 'function') exportBacklogMd();
            }, { once: true });
          }
          if (btnClean) {
            btnClean.addEventListener('click', async () => {
              // Purgar claves no críticas para liberar espacio y reintentar
              const purgeable = ['ai-tracker-changelog', 'ai-tracker-notif-history', 'ai-tracker-log-filters'];
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

  const projId = _getActiveProjectFilter();
  const metaKey = _tplKey('backlog-meta');
  const meta = JSON.parse(localStorage.getItem(metaKey) || '{}');
  const suffix = projId ? '-' + projId : '-global';

  // T-202605-482: Supabase — prioridad cuando disponible
  if (_supabase && _supabaseUser) {
    try {
      const { error } = await _supabase.from('tracker_backlog').upsert([
        { user_id: _supabaseUser.id, key: 'items' + suffix, value: items, updated_at: new Date().toISOString() },
        { user_id: _supabaseUser.id, key: 'meta'  + suffix, value: meta,  updated_at: new Date().toISOString() }
      ], { onConflict: 'user_id,key' });
      if (error) throw error;
      setSyncStatus('synced', '✓ sincronizado');
    } catch (err) {
      console.error('[AI Tracker] Supabase saveBacklog() failed:', err);
      setSyncStatus('offline', '✕ sin conexión');
      showToast('warning', '⚠️ Backlog no sincronizado con Supabase — guardado localmente');
      _offlineQueuePush({ type: 'backlog' });
    }
    return;
  }

}

// R-202604-035: saveContextDocs() — escribe en tracker_docs
async function saveContextDocs() {
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

  // B-202605-041: persistir en localStorage ANTES de intentar Supabase —
  // garantiza que los datos sobreviven un fallo o ausencia de Supabase.
  try {
    localStorage.setItem('tracker-ctx-docs' + suffix, JSON.stringify(ctxPayload));
    localStorage.setItem('tracker-hm-docs'  + suffix, JSON.stringify(hmPayload));
  } catch (lsErr) {
    console.warn('[AI Tracker] saveContextDocs: fallo al escribir en localStorage', lsErr);
  }

  if (!_supabase || !_supabaseUser) return;

  try {
    const { error } = await _supabase.from('tracker_docs').upsert([
      { user_id: _supabaseUser.id, key: 'context' + suffix, value: ctxPayload, updated_at: new Date().toISOString() },
      { user_id: _supabaseUser.id, key: 'htmlmap' + suffix, value: hmPayload,  updated_at: new Date().toISOString() }
    ], { onConflict: 'user_id,key' });
    if (error) throw error;
  } catch (err) {
    console.error('[AI Tracker] Supabase saveContextDocs() failed:', err);
    setSyncStatus('offline', '✕ sin conexión');
    showToast('warning', '⚠️ Context/HTML-MAP no sincronizado con Supabase — guardado localmente');
    _offlineQueuePush({ type: 'docs' });
  }
}

// ── GRUPO 3 — SYNC Y REALTIME ─────────────────────────────────────────────────

// T-202605-482: carga Supabase multi-tabla en segundo plano
// T-202605-XXX: Realtime sync — multidispositivo
// Escucha cambios en tracker_state para el user activo.
// Cuando otro cliente guarda, el updated_at cambia → este cliente recarga.
// Throttle: no recarga si el cambio vino de este mismo cliente (_realtimeLastTs).
function _subscribeRealtime() {
  if (!_supabase || !_supabaseUser) return;
  _unsubscribeRealtime(); // limpiar canal previo si existe

  _realtimeChannel = _supabase
    .channel('tracker-state-' + _supabaseUser.id)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tracker_state',
        filter: 'user_id=eq.' + _supabaseUser.id
      },
      (payload) => {
        const remoteTs = payload.new?.updated_at;
        if (!remoteTs) return;

        // Ignorar si el timestamp es el mismo que el último que guardamos nosotros
        // (evita reload-loop: yo guardo → Supabase notifica → yo recargo → guardo → ...)
        if (_realtimeLastTs && remoteTs === _realtimeLastTs) return;

        // Otro cliente guardó algo — recargar estado remoto
        console.log('[AI Tracker] Realtime: cambio remoto detectado —', remoteTs);
        if (typeof _loadFromSupabase === 'function') _loadFromSupabase();
      }
    )
    .subscribe();
}

function _unsubscribeRealtime() {
  if (_realtimeChannel) {
    try { _supabase.removeChannel(_realtimeChannel); } catch(e) {}
    _realtimeChannel = null;
  }
}

async function _loadFromSupabase() {
  const authUser = await (_supabaseReady || Promise.resolve(null));
  if (!authUser) {
    setSyncStatus('local', '☁ conectar');
    return;
  }
  try {
    setSyncStatus('syncing', '⟳ sincronizando');

    // ── 1. Cargar state/main ──────────────────────────────────────────────
    const { data: stateRows, error: stateErr } = await _supabase
      .from('tracker_state')
      .select('value')
      .eq('user_id', _supabaseUser.id)
      .eq('key', 'main')
      .maybeSingle();
    if (stateErr) throw stateErr;

    if (stateRows && stateRows.value) {
      const remote = stateRows.value;

      // ── 2. Merge IAs — local gana en status volátil ───────────────────
      const localAIMap  = new Map((state.ais || []).map(a => [a.id, a]));
      const remoteAIMap = new Map((remote.ais || []).map(a => [a.id, a]));
      remoteAIMap.forEach((remoteAI, id) => {
        remoteAI.sessions = [];
        const localAI = localAIMap.get(id);
        if (localAI) {
          remoteAI.status      = localAI.status;
          remoteAI.resetTime   = localAI.resetTime;
          remoteAI.resetEpoch  = localAI.resetEpoch;
          remoteAI.interrupted = localAI.interrupted;
        }
      });
      localAIMap.forEach((localAI, id) => {
        if (!remoteAIMap.has(id)) { if (!remote.ais) remote.ais = []; remote.ais.push({ ...localAI, sessions: [] }); }
      });

      // ── 3. Merge proyectos ────────────────────────────────────────────
      const localProjMap = new Map((state.projects || []).map(p => [p.id, p]));
      if (!remote.projects) remote.projects = [];
      remote.projects.forEach(rp => {
        const lp = localProjMap.get(rp.id);
        rp.sessions = lp ? (lp.sessions || []) : [];
        if (lp && lp.sprints && lp.sprints.length) {
          const localSprintMap = new Map(lp.sprints.map(s => [s.id, s]));
          rp.sprints = (rp.sprints || []).map(rs => {
            const ls = localSprintMap.get(rs.id);
            return ls ? { ...rs, status: ls.status, ...(ls.closedAt ? { closedAt: ls.closedAt } : {}) } : rs;
          });
          lp.sprints.forEach(ls => { if (!rp.sprints.some(rs => rs.id === ls.id)) rp.sprints.push({ ...ls }); });
        }
      });
      localProjMap.forEach((lp, id) => {
        if (!remote.projects.some(p => p.id === id)) remote.projects.push({ ...lp });
      });

      _applyStateData(remote);
      state.ais.forEach(ai => {
        if (ai.status === 'exhausted' && ai.resetTime && _resetExpired(ai.resetTime, ai.resetEpoch)) {
          ai.status = 'available'; ai.resetTime = ''; ai.resetEpoch = null;
        }
      });
    }

    // ── 4. Cargar sesiones ───────────────────────────────────────────────
    try {
      const { data: sessRows, error: sessErr } = await _supabase
        .from('tracker_sessions')
        .select('project_id, session_id, data')
        .eq('user_id', _supabaseUser.id);
      if (sessErr) throw sessErr;
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
          remoteSessions.forEach(s => { if (!localIds.has(s.id)) { proj.sessions.push(s); localIds.add(s.id); } });
        });
        try { localStorage.setItem('ai-tracker-v4', JSON.stringify(state)); } catch {}
      }
    } catch (sessErr) {
      console.warn('[AI Tracker] Error cargando sesiones desde Supabase:', sessErr);
    }

    // ── 5. Cargar backlog ────────────────────────────────────────────────
    try {
      const projId = _getActiveProjectFilter();
      const suffix = projId ? '-' + projId : '-global';
      const { data: blRows, error: blErr } = await _supabase
        .from('tracker_backlog')
        .select('key, value')
        .eq('user_id', _supabaseUser.id)
        .in('key', ['items' + suffix, 'meta' + suffix]);
      if (blErr) throw blErr;
      if (blRows && blRows.length) {
        const blMap = Object.fromEntries(blRows.map(r => [r.key, r.value]));
        const remoteItems = blMap['items' + suffix] || [];
        const remoteMeta  = blMap['meta'  + suffix] || {};
        const localMeta   = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
        const localTs     = localMeta.updated  ? new Date(localMeta.updated).getTime()  : 0;
        const remoteTs    = remoteMeta.updated ? new Date(remoteMeta.updated).getTime() : 0;
        // Supabase es fuente de verdad — remoto gana si es más nuevo o local está vacío
        const _itemsRef = (typeof ITEMS !== 'undefined') ? ITEMS : null;
        const shouldLoad  = remoteItems.length && (!_itemsRef || _itemsRef.length === 0 || localTs === 0 || remoteTs > localTs);
        if (shouldLoad && _itemsRef) {
          // Reemplazar completo — no merge aditivo
          _itemsRef.length = 0;
          remoteItems.forEach(ri => _itemsRef.push(ri));
          localStorage.setItem(_tplKey('backlog-items'), JSON.stringify(_itemsRef));
          localStorage.setItem(_tplKey('backlog-meta'),  JSON.stringify(remoteMeta));
        }
      }
    } catch (blErr) {
      console.warn('[AI Tracker] Error cargando backlog desde Supabase:', blErr);
    }

    // ── 6. Cargar docs vivos (context, htmlmap, plan) — R-202605-120: Supabase es fuente de verdad ──
    // Patrón idéntico al backlog: Supabase gana si es más nuevo o localStorage vacío
    try {
      const projId = _getActiveProjectFilter();
      const suffix = projId ? '-' + projId : '-global';
      const { data: docRows, error: docErr } = await _supabase
        .from('tracker_docs')
        .select('key, value, updated_at')
        .eq('user_id', _supabaseUser.id)
        .in('key', ['context' + suffix, 'htmlmap' + suffix, 'plan' + suffix]);
      if (docErr) throw docErr;
      if (docRows && docRows.length) {
        const docMap = Object.fromEntries(docRows.map(r => [r.key, r]));

        // Helper: aplica doc remoto si Supabase es más nuevo o local está vacío
        const _applyDocIfNewer = (remoteRow, localRawKey, applyFn) => {
          if (!remoteRow || !remoteRow.value) return;
          const localVal  = localStorage.getItem(_tplKey(localRawKey));
          const remoteTs  = remoteRow.updated_at ? new Date(remoteRow.updated_at).getTime() : 0;
          const remoteMeta = remoteRow.value.meta;
          const localMeta  = (() => { try { return JSON.parse(localStorage.getItem(_tplKey(localRawKey + '-meta')) || '{}'); } catch { return {}; } })();
          const localTs    = localMeta.importedAt ? new Date(localMeta.importedAt).getTime() : 0;
          const shouldLoad = !localVal || localTs === 0 || remoteTs > localTs;
          if (shouldLoad) applyFn(remoteRow.value);
        };

        // Context
        _applyDocIfNewer(docMap['context' + suffix], 'context-raw', (ctx) => {
          if (ctx.raw)      try { localStorage.setItem(_tplKey('context-raw'),      ctx.raw);      } catch {}
          if (ctx.sections) try { localStorage.setItem(_tplKey('context-sections'), ctx.sections); } catch {}
          if (ctx.meta)     try { localStorage.setItem(_tplKey('context-meta'),     ctx.meta);     } catch {}
        });

        // HTML-MAP
        _applyDocIfNewer(docMap['htmlmap' + suffix], 'html-map-raw', (hm) => {
          if (hm.raw)      try { localStorage.setItem(_tplKey('html-map-raw'),      hm.raw);      } catch {}
          if (hm.sections) try { localStorage.setItem(_tplKey('html-map-sections'), hm.sections); } catch {}
          if (hm.meta)     try { localStorage.setItem(_tplKey('html-map-meta'),     hm.meta);     } catch {}
        });

        // Plan — R-202605-120: plan persiste en Supabase
        const planRow = docMap['plan' + suffix];
        if (planRow && planRow.value && planRow.value.data) {
          const localPlanRaw = projId ? localStorage.getItem('ai-tracker-plan-' + projId) : null;
          const remoteTs     = planRow.updated_at ? new Date(planRow.updated_at).getTime() : 0;
          const localTs      = (() => { try { const p = JSON.parse(localPlanRaw || 'null'); return p && p._savedAt ? p._savedAt : 0; } catch { return 0; } })();
          if (!localPlanRaw || localTs === 0 || remoteTs > localTs) {
            const planKey = projId ? 'ai-tracker-plan-' + projId : null;
            if (planKey) try { localStorage.setItem(planKey, JSON.stringify(planRow.value.data)); } catch {}
          }
        }
      }
    } catch (docsErr) {
      console.warn('[AI Tracker] Error cargando docs desde Supabase:', docsErr);
    }

    // ── 6b. tmp-id-map — R-1 ─────────────────────────────────────────────
    try {
      const { data: mapRows } = await _supabase
        .from('tracker_docs')
        .select('key, value, updated_at')
        .eq('user_id', _supabaseUser.id)
        .eq('key', 'tmp-id-map');
      if (mapRows && mapRows.length) {
        const remoteRow = mapRows[0];
        const remoteTs  = remoteRow.updated_at ? new Date(remoteRow.updated_at).getTime() : 0;
        const localRaw  = localStorage.getItem('tmp-id-map');
        // Supabase gana si local está vacío o remoto es más reciente
        if (!localRaw || remoteTs > 0) {
          const localMap  = (() => { try { return JSON.parse(localRaw || '{}'); } catch { return {}; } })();
          // Comparar por cantidad de entradas + timestamp de la entrada más reciente
          const localMaxTs = Object.values(localMap).reduce((m, v) => Math.max(m, v.createdAt || 0), 0);
          if (!localRaw || remoteTs > localMaxTs) {
            const merged = { ...localMap, ...(remoteRow.value && remoteRow.value.map ? remoteRow.value.map : {}) };
            try { localStorage.setItem('tmp-id-map', JSON.stringify(merged)); } catch(_) {}
          }
        }
      }
    } catch (mapErr) {
      console.warn('[AI Tracker] Error cargando tmp-id-map desde Supabase:', mapErr);
    }

    // ── 6c. Notas de proyecto — R-2 ──────────────────────────────────────
    try {
      const projId  = _getActiveProjectFilter();
      const sbKey   = projId ? 'notes-' + projId : 'notes-global';
      const localKey = projId ? 'notes-' + projId : 'notes';
      const { data: noteRows } = await _supabase
        .from('tracker_docs')
        .select('key, value, updated_at')
        .eq('user_id', _supabaseUser.id)
        .eq('key', sbKey);
      if (noteRows && noteRows.length) {
        const remoteRow   = noteRows[0];
        const remoteNotes = remoteRow.value && Array.isArray(remoteRow.value.notes) ? remoteRow.value.notes : null;
        if (remoteNotes) {
          const remoteTs  = remoteRow.updated_at ? new Date(remoteRow.updated_at).getTime() : 0;
          const localRaw  = localStorage.getItem(localKey);
          const localNotes = (() => { try { return JSON.parse(localRaw || '[]'); } catch { return []; } })();
          // Solo aplicar si local está vacío o Supabase es más reciente
          const shouldLoad = !localRaw || localNotes.length === 0 || remoteTs > 0;
          if (shouldLoad && remoteNotes.length > 0) {
            try { localStorage.setItem(localKey, JSON.stringify(remoteNotes)); } catch(_) {}
          }
        }
      }
    } catch (notesErr) {
      console.warn('[AI Tracker] Error cargando notas desde Supabase:', notesErr);
    }

    // ── 6d. Borradores de CHECKPOINT — R-3 ───────────────────────────────
    try {
      const { data: draftRows } = await _supabase
        .from('tracker_docs')
        .select('key, value, updated_at')
        .eq('user_id', _supabaseUser.id)
        .like('key', 'draft-%');
      if (draftRows && draftRows.length) {
        for (const row of draftRows) {
          if (!row.value || !row.value.text) continue;
          // Extraer aiId de la key 'draft-{aiId}'
          const aiId = row.key.replace(/^draft-/, '');
          // Verificar que la AI existe en el state local
          const aiExists = (state.ais || []).some(a => a.id === aiId);
          if (!aiExists) continue;
          const remoteTs  = row.updated_at ? new Date(row.updated_at).getTime() : 0;
          const localRaw  = localStorage.getItem('draft-' + aiId);
          // AC-1: sin draft local → aplicar remoto sin condición adicional
          // AC-2: con draft local → aplicar solo si remoto es estrictamente más reciente
          // AC-4: remoteTs === 0 (updated_at nulo/inválido) → no aplicar, local gana
          if (!localRaw) {
            if (remoteTs > 0) {
              try { localStorage.setItem('draft-' + aiId, row.value.text); } catch(_) {}
              // AC-7: dot visual solo cuando el draft efectivamente se aplica
              const dot = document.getElementById('draft-' + aiId);
              if (dot) dot.className = 'draft-dot visible';
            }
          } else {
            // AC-6: localTs-ts no parseable → tratar como 0 (remoto gana si remoteTs > 0)
            const localTsRaw = localStorage.getItem('draft-' + aiId + '-ts');
            const localTs    = localTsRaw ? (Number(localTsRaw) || 0) : 0;
            // AC-2 + AC-3: remoto solo gana si es estrictamente más reciente
            if (remoteTs > 0 && remoteTs > localTs) {
              try { localStorage.setItem('draft-' + aiId, row.value.text); } catch(_) {}
              // AC-7: dot visual solo cuando el draft efectivamente se aplica
              const dot = document.getElementById('draft-' + aiId);
              if (dot) dot.className = 'draft-dot visible';
            }
          }
        }
      }
    } catch (draftErr) {
      console.warn('[AI Tracker] Error cargando borradores desde Supabase:', draftErr);
    }

    // ── 6e. Preferencias de usuario — R-4 ────────────────────────────────
    try {
      const { data: prefsRows } = await _supabase
        .from('tracker_docs')
        .select('key, value, updated_at')
        .eq('user_id', _supabaseUser.id)
        .eq('key', 'user-prefs');
      if (prefsRows && prefsRows.length) {
        const remoteRow = prefsRows[0];
        const prefs     = remoteRow.value;
        if (prefs) {
          const remoteTs = remoteRow.updated_at ? new Date(remoteRow.updated_at).getTime() : 0;
          const localTs  = (() => { try { return new Date(localStorage.getItem(_USER_PREFS_TS_KEY) || 0).getTime(); } catch { return 0; } })();
          if (remoteTs > localTs) {
            // Shortcuts
            if (prefs.shortcuts && typeof prefs.shortcuts === 'object') {
              try { localStorage.setItem(_SHORTCUTS_KEY, JSON.stringify(prefs.shortcuts)); } catch(_) {}
            }
            // Template trigger
            if (prefs.templateTrigger) {
              try { localStorage.setItem(_TPL_TRIGGER_KEY, prefs.templateTrigger); _updateAutoDownloadLabel(); } catch(_) {}
            }
            // Onboarding
            if (prefs.onboardingSeen) {
              try { localStorage.setItem('onboarding-seen', '1'); } catch(_) {}
            }
            // Marcar timestamp local
            try { localStorage.setItem(_USER_PREFS_TS_KEY, remoteRow.updated_at || new Date().toISOString()); } catch(_) {}
          }
        }
      }
    } catch (prefsErr) {
      console.warn('[AI Tracker] Error cargando preferencias desde Supabase:', prefsErr);
    }
    if (typeof render === 'function') render();
    if (typeof renderHoy === 'function') renderHoy();
    if (typeof updateStats === 'function') updateStats();
    if (typeof renderBacklogList === 'function') renderBacklogList();
    setSyncStatus('synced', '✓ sincronizado');

  } catch (err) {
    console.error('[AI Tracker] _loadFromSupabase() failed:', err);
    setSyncStatus('offline', '✕ sin conexión');
    if (typeof showToast === 'function') showToast('warning', '⚠️ No se pudo cargar desde Supabase — operando en modo local', null, 6000);
  }
}

// ── GRUPO 6 — GETTERS PUROS ───────────────────────────────────────────────────

// v3.0.0: sessions, tracker y sprints viven en project — no en state global
let state = {ais:[], theme:'dark', tags:[], projects:[], _stateVersion:3};

// ── v3.0.0: detección de formato v2 ──
function _isV2State(raw) {
  // v2: state.tracker global + ai.sessions[] + state.sprints global
  // v3: project.sessions[] + project.tracker + project.sprints[]
  if (!raw) return false;
  if (raw._stateVersion === 3) return false;
  // Si hay tracker global O ais con sessions, es v2
  return !!(raw.tracker || (raw.ais && raw.ais.some(a => a.sessions && a.sessions.length > 0)));
}

// ── v3.0.0: migración automática v2 → v3 ──
function _migrateV2toV3(raw) {
  console.log('[AI Tracker] Migrando state v2 → v3...');

  // 1. Crear o reutilizar proyecto "AI Tracker" como contenedor de migración
  if (!raw.projects) raw.projects = [];
  let migProj = raw.projects.find(p => p._migrated || p.name === 'AI Tracker');
  if (!migProj) {
    migProj = {
      id: 'proj-' + Math.random().toString(36).slice(2, 8),
      name: 'AI Tracker',
      color: '#7c6af7',
      icon: '🤖',
      status: 'active',
      notes: '',
      sessions: [],
      tracker: { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } },
      sprints: [],
      contextVersion: '',
      backlogVersion: '',
      htmlMapVersion: '',
      _migrated: true
    };
    raw.projects.unshift(migProj);
  } else {
    // Asegurar campos v3 en proyecto existente
    if (!migProj.sessions) migProj.sessions = [];
    if (!migProj.tracker) migProj.tracker = { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
    if (!migProj.sprints) migProj.sprints = [];
    if (!migProj.contextVersion) migProj.contextVersion = '';
    if (!migProj.backlogVersion) migProj.backlogVersion = '';
    if (!migProj.htmlMapVersion) migProj.htmlMapVersion = '';
  }

  // 2. Migrar ai.sessions[] → project.sessions[] con aiId
  (raw.ais || []).forEach(ai => {
    (ai.sessions || []).forEach(s => {
      // Evitar duplicados si ya fue migrado parcialmente
      const exists = migProj.sessions.some(ps => ps.id === s.id);
      if (!exists) {
        migProj.sessions.push(Object.assign({}, s, { aiId: ai.id }));
      }
    });
    // Limpiar sessions del ai — en v3 las IAs no tienen sessions
    ai.sessions = [];
    // Limpiar campo project del ai — en v3 las IAs son globales
    delete ai.project;
  });

  // 3. Migrar state.tracker → project.tracker
  if (raw.tracker && raw.tracker.items && raw.tracker.items.length > 0) {
    const existingCodes = new Set(migProj.tracker.items.map(i => i.code));
    (raw.tracker.items || []).forEach(item => {
      if (!existingCodes.has(item.code)) migProj.tracker.items.push(item);
    });
    // Merge counters — el máximo gana
    const rc = raw.tracker.counters || {};
    const mc = migProj.tracker.counters;
    Object.keys(rc).forEach(k => { if ((rc[k] || 0) > (mc[k] || 0)) mc[k] = rc[k]; });
  }
  delete raw.tracker;

  // 4. Migrar state.sprints → project.sprints
  if (raw.sprints && raw.sprints.length > 0) {
    const existingIds = new Set(migProj.sprints.map(s => s.id));
    (raw.sprints || []).forEach(sp => {
      if (!existingIds.has(sp.id)) migProj.sprints.push(sp);
    });
  }
  delete raw.sprints;

  // 5. Migrar proj.aiIds → eliminar (v3 no usa aiIds)
  raw.projects.forEach(p => { delete p.aiIds; delete p.sessionsCount; });

  // 6. Migrar templates globales de localStorage → claves por proyecto
  const projId = migProj.id;
  ['context-raw', 'context-sections', 'context-meta',
   'html-map-raw', 'html-map-sections', 'html-map-meta'].forEach(key => {
    const val = localStorage.getItem(key);
    if (val && !localStorage.getItem(key + '-' + projId)) {
      try { localStorage.setItem(key + '-' + projId, val); } catch(e) {}
    }
  });
  // Backlog items
  const bkItems = localStorage.getItem('backlog-items');
  if (bkItems && !localStorage.getItem('backlog-items-' + projId)) {
    try { localStorage.setItem('backlog-items-' + projId, bkItems); } catch(e) {}
  }
  const bkMeta = localStorage.getItem('backlog-meta');
  if (bkMeta && !localStorage.getItem('backlog-meta-' + projId)) {
    try { localStorage.setItem('backlog-meta-' + projId, bkMeta); } catch(e) {}
  }

  // 7. Marcar como v3 para no re-migrar
  raw._stateVersion = 3;

  // 8. Activar el proyecto migrado como activo
  if (!localStorage.getItem('current-project-filter')) {
    localStorage.setItem('current-project-filter', migProj.id);
  }

  console.log('[AI Tracker] Migración v2→v3 completa. Proyecto:', migProj.name, '| Sesiones migradas:', migProj.sessions.length);
  return raw;
}

function _applyStateData(raw) {
  // v3.0.0: migración automática si se detecta formato v2
  if (_isV2State(raw)) raw = _migrateV2toV3(raw);

  if (!raw.theme) raw.theme = 'dark';
  if (!raw.tags) raw.tags = [];
  if (!raw.projects) raw.projects = [];
  if (!raw._stateVersion) raw._stateVersion = 3;
  if (!raw.quickNotes) raw.quickNotes = [];

  // v3: migración de proyectos — asegurar campos v3
  let _dateNormalized = false;
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
    // Migrar sessions internas
    proj.sessions.forEach(s => {
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
            _dateNormalized = true;
          }
        }
      }
    });
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

    // R-202605-121: seed de nombres canónicos para sprints S-01–S-20 sin label
    // Sprints creados antes de S-23 no tienen label guardado — se usa el ID como label.
    // S-07b y S-16b se preservan tal cual (formato no estándar, no se normalizan).
    if (proj.sprints && proj.sprints.length) {
      const _HISTORICAL_SPRINT_IDS = new Set([
        'S-01','S-02','S-03','S-04','S-05','S-06','S-07','S-07b',
        'S-08','S-09','S-10','S-11','S-12','S-13','S-14','S-15',
        'S-16','S-16b','S-17','S-18','S-19','S-20'
      ]);
      let _sprintSeeded = false;
      proj.sprints.forEach(sp => {
        if (_HISTORICAL_SPRINT_IDS.has(sp.id) && !sp.label) {
          sp.label = sp.id; // ID como label canónico — nunca se sobreescribe si ya existe
          _sprintSeeded = true;
        }
      });
      if (_sprintSeeded) console.log('[AI Tracker] R-202605-121: labels canónicos aplicados a sprints históricos sin nombre.');
    }
  });

  // v3: IAs son globales — sin sessions, sin project
  let wasMigrated = false;
  (raw.ais || []).forEach(ai => {
    if (!ai.sessions) ai.sessions = [];
    if (ai.interrupted === undefined) ai.interrupted = false;
    if (ai.notes === undefined) ai.notes = '';
    if (ai.avatar === undefined) ai.avatar = '';
    if (ai.archived === undefined) ai.archived = false;
    if (ai.showAll === undefined) ai.showAll = false;
    // Normalización: sesiones en ai.sessions → project.sessions (sin deuda heredada)
    if (ai.sessions.length > 0) {
      const targetProj = (raw.projects || []).find(p => p.name === 'AI Tracker') || (raw.projects || [])[0];
      if (targetProj) {
        if (!targetProj.sessions) targetProj.sessions = [];
        const existingIds = new Set(targetProj.sessions.map(s => s.id));
        ai.sessions.forEach(s => {
          if (!existingIds.has(s.id)) {
            targetProj.sessions.push({ ...s, aiId: ai.id });
            existingIds.add(s.id);
          }
        });
        console.log(`[AI Tracker] Normalización: ${ai.sessions.length} sesión(es) de "${ai.name}" movidas a project.sessions`);
      }
      ai.sessions = []; // limpiar — en v3 ai.sessions siempre vacío
      wasMigrated = true;
    }
    delete ai.project; // v2 compat — eliminado en v3
  });

  state = raw;
  applyTheme(state.theme);
  return wasMigrated || _dateNormalized;
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
  const s = localStorage.getItem('ai-tracker-v4');
  let _migrated = false;
  if (s) {
    try { _migrated = _applyStateData(JSON.parse(s)); }
    catch (e) {
      console.error('[AI Tracker] Estado corrupto en localStorage — restaurando defaults:', e);
      _applyStateData({ais: clone(DEFAULT_AIS), theme:'dark', tags:[]});
    }
  } else {
    _applyStateData({ais: clone(DEFAULT_AIS), theme:'dark', tags:[]});
  }
  // Normalización: si había sesiones en ai.sessions[], persistir inmediatamente sin esperar Supabase
  if (_migrated) {
    try { localStorage.setItem('ai-tracker-v4', JSON.stringify(state)); } catch {}
    console.log('[AI Tracker] Normalización ai.sessions→project.sessions persistida');
  }
  // B-202604-009: limpiar IAs expiradas antes del primer render — usar epoch cuando existe
  state.ais.forEach(ai => {
    if (ai.status === 'exhausted' && ai.resetTime) {
      if (_resetExpired(ai.resetTime, ai.resetEpoch)) {
        ai.status = 'available';
        ai.resetTime = '';
        ai.resetEpoch = null;
      }
    }
  });
  // R-202604-073: dot Pulso — inicializar desde caché localStorage sin esperar render completo
  (function() {
    const cached = (() => { try { return JSON.parse(localStorage.getItem(_PULSO_KEY) || 'null'); } catch(e) { return null; } })();
    const dot = document.getElementById('pulso-dot');
    if (dot && cached && cached.color) dot.className = `pulso-dot pulso-dot--${cached.color}`;
  })();
}

// _initApp() — punto de arranque de la app. Llamado desde DOMContentLoaded en index.html
// una vez que todos los módulos JS están disponibles.
// Gate de auth: si no hay sesión activa → openAuthModal() bloqueante, sin render.
// Si hay sesión activa → render completo + sync Supabase.
function _initApp() {
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
  if (typeof render === 'function') render();
  // B-202605-508: garantizar badges visibles al arranque
  if (typeof updateTabNotifBadges === 'function') updateTabNotifBadges();
  // R-202604-072: panel de contexto diario — diferido para que ITEMS esté cargado
  if (typeof _showArranquePanel === 'function') setTimeout(_showArranquePanel, 400);
  // R-202604-073: dot Pulso — recalcular con datos reales
  if (typeof renderPulsoDot === 'function') setTimeout(renderPulsoDot, 600);
  // T-084: verificar umbral de sesiones
  if (typeof checkStorageWarn === 'function') setTimeout(checkStorageWarn, 500);
  // T-202605-482: sincronizar desde Supabase
  if (_supabase && typeof _loadFromSupabase === 'function') _loadFromSupabase();
}

// Claves localStorage por proyecto
function _projKey(base, projId) { return projId ? base + '-' + projId : base; }

// T-202604-006: clave de template para el proyecto activo
function _tplKey(base) {
  const projId = _getActiveProjectFilter();
  return projId ? base + '-' + projId : base;
}

function getAI(id) { return state.ais.find(a => a.id === id); }

// Proyecto activo (objeto)
function getActiveProject() {
  const id = _getActiveProjectFilter();
  return id ? getProjectById(id) : null;
}

// Todas las sesiones de un proyecto
function getProjectSessions(projId) {
  const proj = getProjectById(projId);
  return proj ? (proj.sessions || []) : [];
}

// Todas las sesiones de todos los proyectos (vista global)
function getAllSessions() {
  // Guardia: detectar sesiones corruptas en ai.sessions (nunca debería ocurrir en v3)
  (state.ais || []).forEach(ai => {
    if (ai.sessions && ai.sessions.length > 0) {
      console.warn(`[AI Tracker] ATENCIÓN: ai "${ai.name}" tiene ${ai.sessions.length} sesión(es) en ai.sessions — debería estar vacío en v3. Recarga la app para normalizar.`);
    }
  });
  return (state.projects || []).flatMap(p => (p.sessions || []).map(s => ({ ...s, projectId: p.id })));
}

// Sesiones de un proyecto filtradas por aiId
function getSessionsByAI(projId, aiId) {
  return getProjectSessions(projId).filter(s => s.aiId === aiId);
}

// Encontrar a qué proyecto pertenece una sesión por su id
function getProjectForSession(sessId) {
  return (state.projects || []).find(p => (p.sessions || []).some(s => s.id === sessId)) || null;
}

// Tracker del proyecto activo (o vacío si no hay proyecto)
function getActiveTracker() {
  const proj = getActiveProject();
  if (!proj) return { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
  if (!proj.tracker) proj.tracker = { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
  return proj.tracker;
}

// Sprints del proyecto activo
function getActiveSprints() {
  const proj = getActiveProject();
  return proj ? (proj.sprints || []) : [];
}

// Contar sesiones de una IA en todos los proyectos
function countAISessions(aiId) {
  return (state.projects || []).reduce((sum, p) => sum + (p.sessions || []).filter(s => s.aiId === aiId).length, 0);
}

// Última sesión de una IA en el proyecto activo (o en todos si no hay filtro)
function getLastAISession(aiId) {
  const projId = _getActiveProjectFilter();
  const sessions = projId
    ? getProjectSessions(projId).filter(s => s.aiId === aiId)
    : getAllSessions().filter(s => s.aiId === aiId);
  return sessions.length ? sessions[sessions.length - 1] : null;
}

// Sesiones de una IA en el proyecto activo (o todos)
function getAISessions(aiId) {
  const projId = _getActiveProjectFilter();
  if (projId) return getProjectSessions(projId).filter(s => s.aiId === aiId);
  return getAllSessions().filter(s => s.aiId === aiId);
}

// Busca una sesión por id en todos los proyectos — devuelve { proj, sess } o null
function _findSession(sessId) {
  for (const proj of (state.projects || [])) {
    const sess = (proj.sessions || []).find(x => x.id === sessId);
    if (sess) return { proj, sess };
  }
  return null;
}

// Busca una sesión por aiId + sessId — para compatibilidad con funciones que tienen ambos
function _findSessionByAI(aiId, sessId) {
  for (const proj of (state.projects || [])) {
    const sess = (proj.sessions || []).find(x => x.id === sessId && x.aiId === aiId);
    if (sess) return { proj, sess };
  }
  return null;
}

// ── GRUPO 4 — USER PREFS (Supabase) ──────────────────────────────────────────

async function _saveUserPrefs() {
  const shortcuts     = _shortcutsLoad();
  const templateTrigger = localStorage.getItem(_TPL_TRIGGER_KEY) || 'session';
  const onboardingSeen  = !!localStorage.getItem('onboarding-seen');
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
