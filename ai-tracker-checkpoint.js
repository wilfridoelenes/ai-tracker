// ── SHARED — Versión, tabs, theme, toast, save/load, search dispatch ──

// Fuente de verdad de versión — actualizar aquí al hacer bump
const APP_VERSION = 'v3.4';

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

// T-074: umbral de días sin sesión para sugerencia contextual
const STALE_DAYS_THRESHOLD = 3;

// T-074: true si la IA lleva >STALE_DAYS_THRESHOLD días sin sesión Y tiene ítems en-progreso
function _hasStaleSuggestion(ai) {
  if (ai.status === 'exhausted') return false;
  const aiSessions = getAISessions(ai.id);
  if (!aiSessions.length) return false;
  const last = aiSessions[aiSessions.length - 1];
  const lastDate = new Date(last.date);
  if (isNaN(lastDate)) return false;
  const diffDays = (Date.now() - lastDate.getTime()) / 86400000;
  if (diffDays <= STALE_DAYS_THRESHOLD) return false;
  const hasInProgress = ITEMS.some(i => i.status === 'en-progreso');
  return hasInProgress;
}

// T-011: Avatar logos SVG — banco de logos predefinidos
const AVATAR_LOGOS = {
  claude: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.7"/><path d="M8 12a4 4 0 018 0" fill="currentColor"/></svg>',
  gpt4: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/></svg>',
  gemini: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 8l3 3-3 3-3-3 3-3z" fill="currentColor"/><path d="M15 11l3-3v6l-3-3z" fill="currentColor" opacity="0.6"/><path d="M9 11l-3-3v6l3-3z" fill="currentColor" opacity="0.6"/></svg>',
  llama: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/><path d="M10 14c0 1 1 2 2 2s2-1 2-2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 9l-1.5-2.5M17 9l1.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  mistral: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/></svg>',
  cohere: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/><circle cx="14" cy="11" r="1.5" fill="currentColor"/><path d="M10 11l2-3 2 3" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
  anthropic: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v10M8 11h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="15.5" cy="9" r="1" fill="currentColor"/></svg>',
  default: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/><path d="M7 15c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
};
document.title = 'AI Tracker ' + _effectiveVersion(); // v3.0.0.9.6

// Header project label — muestra Prefijo · Nombre canónico del proyecto activo
function _updateHeaderProjectLabel() {
  const prefixEl = document.getElementById('header-project-prefix');
  const nameEl   = document.getElementById('header-project-name');
  if (!prefixEl || !nameEl) return;

  // Mapa canónico: id de proyecto → { prefix, name }
  const CANONICAL = {
    // Fallback por nombre si no hay id limpio
  };

  const filterId = (typeof _getActiveProjectFilter === 'function') ? _getActiveProjectFilter() : '';
  const proj = filterId && (typeof getProjectById === 'function') ? getProjectById(filterId) : null;

  if (proj) {
    // Derivar prefijo: primeras 2-3 letras en mayúsculas, o usar icono si existe
    const prefix = proj.prefix || (proj.name || 'PP').slice(0, 2).toUpperCase();
    const name   = proj.name || 'Proyecto';
    prefixEl.textContent = prefix;
    nameEl.textContent   = name;
  } else {
    // Sin proyecto activo → mostrar identidad del tracker
    prefixEl.textContent = 'AI';
    nameEl.textContent   = 'AI Tracker';
  }
}
// Exponer para que sprint-project.js lo llame al cambiar proyecto
window._updateHeaderProjectLabel = _updateHeaderProjectLabel;

// AC-8: Firebase eliminado — Supabase es el único backend de sync

// Sync pill helper
// T-202604-312: color semántico — verde/neutro cuando conectado, rojo solo en error real de sync
// Estados: synced → verde | syncing → acento neutro | local → neutro | offline → rojo
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
      chip.classList.remove('hidden');
    } else {
      chip.classList.add('hidden');
    }
  }
}

function handleSyncPillClick() {
  if (!_supabaseUser) { if (typeof openAuthModal === 'function') openAuthModal(); else signInWithSupabase(); }
  else { signOutSupabase(); }
}

// ── T-202605-482c: Supabase Auth — Google OAuth (founder único, multidispositivo) ──
// SUPABASE_URL y SUPABASE_ANON_KEY se inyectan como variables de entorno en Vercel.
// En desarrollo local, definir en un archivo .env.local (no commitear).
const SUPABASE_URL  = (typeof window !== 'undefined') ? (window.__ENV?.SUPABASE_URL       || window.SUPABASE_URL)       : null;
const SUPABASE_KEY  = (typeof window !== 'undefined') ? (window.__ENV?.SUPABASE_ANON_KEY  || window.SUPABASE_ANON_KEY)  : null;

let _supabase           = null;   // cliente Supabase
let _supabaseUser       = null;   // sesión activa del founder
let _supabaseReady      = null;   // promesa: resuelve cuando onAuthStateChange dispara
let _realtimeChannel    = null;   // T-202605-XXX: canal Realtime para sync multidispositivo
let _realtimeLastTs     = null;   // timestamp del último update remoto procesado

if (SUPABASE_URL && SUPABASE_KEY && typeof supabase !== 'undefined') {
  try {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        storage: localStorage  // B-202605-504: code_verifier PKCE en localStorage — sobrevive redirects de Vercel
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

// ── T-202605-483: Fallback offline — cola de pendientes + listeners de red ──
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
  // Deduplicar: si ya hay una entrada del mismo tipo, reemplazar (solo el último write importa)
  const idx = _offlineQueue.findIndex(e => e.type === entry.type);
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
  if (btn) btn.classList.add('hidden');
}

function signInWithSupabase() {
  // B-fix: redirigir en la misma pestaña — el flujo skipBrowserRedirect+popup
  // causaba que la pestaña nueva procesara el token y la original nunca recibía sesión.
  // Con redirect estándar: Google → Supabase → misma pestaña → onAuthStateChange dispara.
  if (!_supabase) { setSyncStatus('offline', '✕ sin conexión'); return; }
  _supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      skipBrowserRedirect: false  // B-202605-504: redirect en misma pestaña — PKCE flow estándar
    }
  }).catch(err => {
    console.warn('Supabase Google sign-in error:', err);
    showToast('error', 'Error al conectar: ' + (err.message || err));
  });
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

// openAuthModal / closeAuthModal — R[tmp:magic-link-auth]
function openAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) return;
  const emailForm = document.getElementById('auth-email-form');
  const sentState = document.getElementById('auth-sent-state');
  const emailInput = document.getElementById('auth-email-input');
  if (emailForm) emailForm.classList.remove('hidden');
  if (sentState) sentState.classList.add('hidden');
  if (emailInput) emailInput.value = '';
  overlay.classList.add('open');
  setTimeout(() => { if (emailInput) emailInput.focus(); }, 80);
}

function closeAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

// signInWithMagicLink — Supabase OTP por email — R[tmp:magic-link-auth]
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
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin }
  });
  if (btn) { btn.disabled = false; btn.textContent = 'Enviar magic link'; }
  if (error) {
    console.warn('Magic link error:', error);
    showToast('error', 'Error al enviar: ' + (error.message || error));
    return;
  }
  const emailForm = document.getElementById('auth-email-form');
  const sentState = document.getElementById('auth-sent-state');
  if (!resend) {
    if (emailForm) emailForm.classList.add('hidden');
    if (sentState) sentState.classList.remove('hidden');
  }
  showToast('info', resend ? 'Link reenviado a ' + email : 'Magic link enviado a ' + email);
}

// getSupabaseUserId — user_id del founder para queries Supabase
function getSupabaseUserId() {
  return _supabaseUser ? _supabaseUser.id : null;
}

let currentTab = 'tracker';

// navegar al Tracker enfocando la card de una IA
function _scrollToCard(aiId) {
  const detail = document.querySelector('.tracker-detail');
  if (detail) detail.scrollTop = 0;
}

function navigateToCard(aiId) {
  _trackerSelectedId = aiId;
  switchTab('tracker');
  setTimeout(() => {
    render();
    _scrollToCard(aiId);
    const ta = document.getElementById('ta-' + aiId);
    if (ta) setTimeout(() => { ta.focus(); enterFocusMode(aiId); }, 80);
  }, 80);
}

function switchTab(tab) {
  // B-202605-207: cerrar panel de detalle al cambiar de tab
  if (typeof closeItemPanel === 'function') {
    const panel = document.getElementById('item-detail-panel');
    if (panel && panel.classList.contains('open')) closeItemPanel();
  }
  // T-202604-254: tab 'hoy' eliminado — redirigir a 'tracker'
  if (tab === 'hoy') tab = 'tracker';
  currentTab = tab;
  localStorage.setItem('active-tab', tab); // B-202604-013: persistir tab activo
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tab);
  const tabBtn = document.getElementById('tab-btn-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');

  // Visibility of tab-specific header buttons
  document.querySelectorAll('.tracker-only').forEach(el => el.classList.toggle('hidden', tab !== 'tracker'));
  document.querySelectorAll('.analytics-only').forEach(el => el.classList.toggle('hidden', tab !== 'analytics'));
  // Templates toolbar: update buttons via _updateSubTabButtons
  if (tab === 'backlog') {
    _updateSubTabButtons(currentSubTab || 'backlog');
  }
  _stopHoyTicker();
  if (tab !== 'tracker') _stopSidebarTicker();

  // Update search placeholder — T-202605-460: conservar término, cerrar panel
  const si = document.getElementById('search-global');
  if (si) {
    si.placeholder = tab === 'tracker' ? 'Buscar sesiones...' : tab === 'backlog' ? 'Buscar ítems...' : 'Buscar...';
    // Conservar el término visible pero cerrar el panel de resultados
  }
  const sc = document.getElementById('search-count');
  if (sc) sc.textContent = '';
  // T-202605-460: cerrar panel sin borrar el término del input
  const _surPanel = document.getElementById('search-unified-results');
  if (_surPanel) _surPanel.remove();

  if (tab === 'tracker') {
    applyViewMode();
  } else if (tab === 'backlog') {
    updateBacklogBanner();
    renderBacklogList();
  } else if (tab === 'analytics') {
    renderAnalytics();
  } else if (tab === 'proyectos') {
    if (typeof renderProyectos === 'function') renderProyectos();
  }

  // B-[pendiente-ID]: cada tab-panel tiene su propio overflow-y:auto —
  // resetear el scroll del panel activo al cambiar de tab
  if (tabEl) tabEl.scrollTop = 0;

  // Refresh radar sidebar
  renderGlobalRadarSidebar();
}

function esc(s) { return s ? (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

// T-202604-121: auto-asignar IDs a ítems [pendiente-ID] / [tmp:slug] en tgItems
// T-202604-TMP: [tmp:slug] mantiene identidad entre CHECKPOINTs de la misma sesión
function _slugify(desc) {
  // Deriva slug de las primeras 3 palabras del desc normalizado
  if (!desc) return 'item';
  return desc.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join('-') || 'item';
}

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
}

function _assignPendingIds(tgItems) {
  if (!tgItems || !tgItems.length) return tgItems;
  const meta = JSON.parse(localStorage.getItem(_tplKey('backlog-meta')) || '{}');
  if (!meta.counters) meta.counters = { P:0, T:0, R:0, B:0 };
  const now = new Date();
  const yyyymm = now.getFullYear().toString() + String(now.getMonth()+1).padStart(2,'0');
  const assigned = [];
  // T-202604-023: índice de títulos normalizados para detección de duplicados
  const _norm = s => (s || '').toLowerCase().replace(/[^a-z0-9áéíóúüñ]/g, ' ').replace(/\s+/g, ' ').trim();
  // B-018: mapa título→código para poder mostrar el código existente en el notice de duplicado
  const existingTitleMap = new Map(ITEMS.map(i => [_norm(i.title), i.code]));
  // T-202604-TMP: mapa tmp-slug → código real (persiste 24h entre CHECKPOINTs)
  const tmpMap = _loadTmpIdMap();
  let tmpMapDirty = false;

  tgItems.forEach(item => {
    const code = item.code || '';

    // --- Detectar [tmp:slug] ---
    const tmpMatch = code.match(/^\[tmp:([a-z0-9_-]+)\]$/i);
    if (tmpMatch) {
      const slug = tmpMatch[1].toLowerCase();
      if (tmpMap[slug]) {
        // Ya conocemos el código real — resolver directamente (update, no crear)
        item.code = tmpMap[slug].code;
        item._tmpResolved = true;
      } else {
        // Primer avistamiento: generar código real y guardar en mapa
        const t = (item.type || (code.match(/^[PTRB]/i) ? code[0] : '') || 'T').toUpperCase();
        if (!'PTRB'.includes(t)) { item._invalidType = true; assigned.push(item); return; }
        meta.counters[t] = (meta.counters[t] || 0) + 1;
        const num = String(meta.counters[t]).padStart(3, '0');
        item.code = `${t}-${yyyymm}-${num}`;
        item._wasAssigned = true;
        tmpMap[slug] = { code: item.code, createdAt: Date.now() };
        tmpMapDirty = true;
      }
      assigned.push(item);
      return;
    }

    // --- Detectar [pendiente-ID] ---
    if (code === '[pendiente-ID]' || code.startsWith('[pendiente-ID]')) {
      // T-202604-023: si ya existe un ítem con el mismo título, marcar como duplicado
      const existingCode = existingTitleMap.get(_norm(item.desc || item.title));
      if (existingCode) {
        item._duplicate = true;
        item._existingCode = existingCode;
        assigned.push(item);
        return;
      }
      // T-202604-TMP: derivar slug del desc y buscar en tmpMap antes de crear código nuevo
      const slug = _slugify(item.desc || item.title);
      if (slug && tmpMap[slug]) {
        item.code = tmpMap[slug].code;
        item._tmpResolved = true;
        assigned.push(item);
        return;
      }
      const t = (item.type || (code.match(/^[PTRB]/i) ? code[0] : '') || 'T').toUpperCase();
      if (!'PTRB'.includes(t)) { item._invalidType = true; assigned.push(item); return; }
      meta.counters[t] = (meta.counters[t] || 0) + 1;
      const num = String(meta.counters[t]).padStart(3, '0');
      item.code = `${t}-${yyyymm}-${num}`;
      item._wasAssigned = true;
      if (slug) { tmpMap[slug] = { code: item.code, createdAt: Date.now() }; tmpMapDirty = true; }
    }

    assigned.push(item);
  });

  localStorage.setItem(_tplKey('backlog-meta'), JSON.stringify(meta));
  if (tmpMapDirty) _saveTmpIdMap(tmpMap);
  return assigned;
}

// T-202604-121: super toast visual para resultado de CHECKPOINT
let _ckptTimer = null;
let _ckptTimerEnd = null;   // P-001: timestamp cuando expira el timer activo
let _lastCheckpointResult = null;
function showCheckpointPanel(result) {
  _lastCheckpointResult = result;
  _updateCkptReopenBtn();
  const panel = document.getElementById('ckpt-panel');
  const body = document.getElementById('ckpt-body');
  const bar = document.getElementById('ckpt-bar');
  if (!panel || !body) return;

  const sections = [];

  // Creados (nuevos)
  if (result.created && result.created.length) {
    const rows = result.created.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code">${esc(i.code)}${i._wasAssigned ? ' <span class="ckpt-new-id-badge">★nuevo ID</span>' : ''}</span>
        <span class="ckpt-item-desc">${esc((i.desc || '').slice(0, 60))}</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section created">
      <div class="ckpt-section-header">✚ ${result.created.length} nuevo${result.created.length>1?'s':''}</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // Avances de status (verde)
  if (result.advanced && result.advanced.length) {
    const rows = result.advanced.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code">${esc(i.code)}</span>
        <span class="ckpt-item-desc">${esc((i.desc || '').slice(0, 50))}</span>
        <span class="ckpt-item-arrow">${esc(i.from)} → ${esc(i.to)}</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section advanced">
      <div class="ckpt-section-header">✓ ${result.advanced.length} avance${result.advanced.length>1?'s':''} de status</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // R-202604-077: Panel diff unificado — retrocesos + descartes en lista única con confirmación inline
  const _hasPendingConfirm = (result.retroceso && result.retroceso.length) || (result.discarded && result.discarded.length);
  if (_hasPendingConfirm) {
    // Estado mutable por referencia — indexado por tipo+código para lookups en handlers
    window._ckptPendingConfirm = {
      retroceso: (result.retroceso || []).map(i => ({ ...i, confirmed: false })),
      discarded: (result.discarded || []).map(i => ({ ...i, confirmed: false, selectedReason: i.reason || '' }))
    };

    const _renderCkptDiffPanel = () => {
      const sec = document.getElementById('ckpt-diff-unified');
      if (!sec) return;

      const pending = window._ckptPendingConfirm;
      const totalItems = pending.retroceso.length + pending.discarded.length;
      const confirmedCount = pending.retroceso.filter(i => i.confirmed).length
        + pending.discarded.filter(i => i.confirmed && i.selectedReason).length;
      const allReady = confirmedCount === totalItems
        || (pending.discarded.every(i => i.confirmed && i.selectedReason) && pending.retroceso.every(i => i.confirmed));

      // Filas de retroceso
      const retroRows = pending.retroceso.map((i, idx) => {
        const checked = i.confirmed ? 'checked' : '';
        return `<div class="ckpt-diff-row ckpt-diff-row--retroceso${i.confirmed ? ' ckpt-diff-row--confirmed' : ''}" id="ckpt-diff-retro-${idx}">
          <label class="ckpt-diff-check-wrap" title="${i.confirmed ? 'Desmarcar' : 'Confirmar retroceso'}">
            <input type="checkbox" class="ckpt-diff-cb" ${checked}
              onchange="_ckptDiffToggleRetro(${idx})">
          </label>
          <div class="ckpt-diff-content">
            <span class="ckpt-diff-code">${esc(i.code)}</span>
            <span class="ckpt-diff-desc">${esc((i.desc || '').slice(0, 45))}</span>
            <span class="ckpt-diff-arrow ckpt-diff-arrow--retroceso">${esc(i.from)} → ${esc(i.to)}</span>
            <span class="ckpt-diff-type-badge ckpt-diff-type-badge--retroceso">↓ retroceso</span>
          </div>
        </div>`;
      }).join('');

      // Filas de descarte
      const discardRows = pending.discarded.map((i, idx) => {
        const checked = i.confirmed ? 'checked' : '';
        const reasonOptions = ['duplicado','fuera de alcance','reemplazado','obsoleto']
          .map(r => `<option value="${r}"${i.selectedReason === r ? ' selected' : ''}>${r}</option>`)
          .join('');
        const reasonHtml = i.reason
          ? `<span class="ckpt-diff-reason-pill">${esc(i.reason)}${i.ref ? ' · ' + esc(i.ref) : ''}</span>`
          : `<select class="ckpt-diff-reason-select" data-discard-idx="${idx}"
               onchange="_ckptDiffSelectReason(${idx}, this.value)">
               <option value="">— razón —</option>
               ${reasonOptions}
             </select>`;
        const isReady = i.confirmed && (i.reason || i.selectedReason);
        return `<div class="ckpt-diff-row ckpt-diff-row--discard${isReady ? ' ckpt-diff-row--confirmed' : ''}" id="ckpt-diff-discard-${idx}">
          <label class="ckpt-diff-check-wrap" title="${i.confirmed ? 'Desmarcar' : 'Confirmar descarte'}">
            <input type="checkbox" class="ckpt-diff-cb" ${checked}
              onchange="_ckptDiffToggleDiscard(${idx})">
          </label>
          <div class="ckpt-diff-content">
            <span class="ckpt-diff-code">${esc(i.code)}</span>
            <span class="ckpt-diff-desc">${esc((i.desc || '').slice(0, 45))}</span>
            ${reasonHtml}
            <span class="ckpt-diff-type-badge ckpt-diff-type-badge--discard">🗑 descarte</span>
          </div>
        </div>`;
      }).join('');

      const pendingLeft = totalItems - confirmedCount;
      const confirmBtn = `<button id="ckpt-diff-confirm-btn"
        class="ckpt-btn-diff-confirm${allReady ? '' : ' ckpt-btn-diff-confirm--blocked'}"
        onclick="_ckptDiffApplyAll()"
        ${allReady ? '' : 'disabled'}>
        ✓ Confirmar ${confirmedCount > 0 ? `(${confirmedCount}/${totalItems})` : `todo (${totalItems})`}
      </button>`;
      const cancelBtn = `<button class="ckpt-btn-diff-cancel" onclick="_ckptDiffCancel()">✕ Cancelar</button>`;

      sec.innerHTML = `
        <div class="ckpt-section-header ckpt-section-header--diff">
          ⚠ ${totalItems} cambio${totalItems > 1 ? 's' : ''} requiere${totalItems === 1 ? '' : 'n'} confirmación
          ${pendingLeft > 0 ? `<span class="ckpt-diff-pending-count">${pendingLeft} pendiente${pendingLeft > 1 ? 's' : ''}</span>` : ''}
        </div>
        <div class="ckpt-diff-rows">${retroRows}${discardRows}</div>
        <div class="ckpt-diff-footer">${cancelBtn}${confirmBtn}</div>`;
    };

    // Handlers globales — limpiados en _ckptDiffCleanup
    window._ckptDiffToggleRetro = (idx) => {
      window._ckptPendingConfirm.retroceso[idx].confirmed = !window._ckptPendingConfirm.retroceso[idx].confirmed;
      _renderCkptDiffPanel();
    };
    window._ckptDiffToggleDiscard = (idx) => {
      window._ckptPendingConfirm.discarded[idx].confirmed = !window._ckptPendingConfirm.discarded[idx].confirmed;
      _renderCkptDiffPanel();
    };
    window._ckptDiffSelectReason = (idx, val) => {
      window._ckptPendingConfirm.discarded[idx].selectedReason = val;
      _renderCkptDiffPanel();
    };
    window._ckptDiffCancel = () => {
      _ckptDiffCleanup();
    };
    window._ckptDiffApplyAll = () => {
      const pending = window._ckptPendingConfirm;
      // Aplicar retrocesos confirmados
      pending.retroceso.filter(i => i.confirmed).forEach(i => {
        const item = ITEMS.find(b => b.code === i.code);
        if (!item) return;
        const from = item.status;
        item.status = i.to;
        item.statusChangedAt = Date.now();
        _blogLog('retroceso', i.code, from + ' → ' + i.to, 'backlog');
      });
      // Aplicar descartes confirmados con razón
      pending.discarded.filter(i => i.confirmed && (i.reason || i.selectedReason)).forEach(i => {
        const item = ITEMS.find(b => b.code === i.code);
        if (!item) return;
        item.status = 'descartado';
        item.discardReason = i.selectedReason || i.reason || '';
        item.discardRef = i.ref || '';
        item.statusChangedAt = Date.now();
        _blogLog('ckpt-descarte', i.code, item.discardReason, 'backlog');
      });
      _undoSnapshot();
      saveBacklog();
      _setBacklogModified();
      renderBacklogList(); updateBacklogBanner(); renderStats();
      const appliedRetro = pending.retroceso.filter(i => i.confirmed).length;
      const appliedDiscard = pending.discarded.filter(i => i.confirmed && (i.reason || i.selectedReason)).length;
      const total = appliedRetro + appliedDiscard;
      if (total) showToast('info', `✓ ${total} cambio${total > 1 ? 's' : ''} aplicado${total > 1 ? 's' : ''}`);
      // Descarga diferida si estaba pendiente
      if (window._pendingTemplateDownload) {
        window._pendingTemplateDownload = false;
        if (_templateTrigger() === 'session') downloadTemplates();
      }
      _ckptDiffCleanup();
    };

    const _ckptDiffCleanup = () => {
      delete window._ckptPendingConfirm;
      delete window._ckptDiffToggleRetro;
      delete window._ckptDiffToggleDiscard;
      delete window._ckptDiffSelectReason;
      delete window._ckptDiffCancel;
      delete window._ckptDiffApplyAll;
      const sec = document.getElementById('ckpt-diff-unified');
      if (sec) sec.innerHTML = '';
    };

    sections.push(`<div class="ckpt-section ckpt-section--diff" id="ckpt-diff-unified"></div>`);
    // Render diferido — el elemento debe estar en DOM primero
    requestAnimationFrame(_renderCkptDiffPanel);
  }

  // Actualizados (otros campos) — T-202604-414: diff inline por campo
  if (result.updated && result.updated.length) {
    const _renderFieldDiff = (changes) => {
      if (!Array.isArray(changes) || !changes.length) return '';
      return changes.map(c => {
        if (c.field === 'ac') {
          // AC diff: línea por línea
          const fromLines = Array.isArray(c.from) ? c.from : [];
          const toLines   = Array.isArray(c.to)   ? c.to   : [];
          const removed = fromLines.filter(l => !toLines.includes(l));
          const added   = toLines.filter(l => !fromLines.includes(l));
          const kept    = toLines.filter(l => fromLines.includes(l));
          const diffRows = [
            ...removed.map(l => `<div class="ckpt-diff-ac-line removed">− ${esc(l)}</div>`),
            ...added.map(l =>   `<div class="ckpt-diff-ac-line added">+ ${esc(l)}</div>`),
            kept.length ? `<div class="ckpt-diff-ac-unchanged">${kept.length} sin cambio${kept.length>1?'s':''}</div>` : ''
          ].join('');
          return `<div class="ckpt-diff-field"><span class="ckpt-diff-label">ac</span><div class="ckpt-diff-ac">${diffRows}</div></div>`;
        }
        // Campo simple: from → to
        return `<div class="ckpt-diff-field">
          <span class="ckpt-diff-label">${esc(c.field)}</span>
          <span class="ckpt-diff-from">${esc(String(c.from))}</span>
          <span class="ckpt-diff-arrow">→</span>
          <span class="ckpt-diff-to">${esc(String(c.to))}</span>
        </div>`;
      }).join('');
    };

    const rows = result.updated.map(i => {
      const hasDiff = Array.isArray(i.changes) && i.changes.length;
      const diffHtml = hasDiff
        ? `<div class="ckpt-diff-block">${_renderFieldDiff(i.changes)}</div>`
        : `<span class="ckpt-item-change">${esc(i.change || '')}</span>`;
      return `<div class="ckpt-item ckpt-item--updated">
        <div class="ckpt-item-row">
          <span class="ckpt-item-code">${esc(i.code)}</span>
          <span class="ckpt-item-desc">${esc((i.desc || '').slice(0, 50))}</span>
        </div>
        ${diffHtml}
      </div>`;
    }).join('');
    sections.push(`<div class="ckpt-section updated">
      <div class="ckpt-section-header">↑ ${result.updated.length} actualizado${result.updated.length>1?'s':''}</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // Ignorados — separados por razón
  const ignoredOk = (result.ignored || []).filter(i => i.reason === 'ya-en-status' || i.reason === 'sin-cambios');
  const ignoredNoStatus = (result.ignored || []).filter(i => i.reason === 'sin-status');
  const ignoredDup = (result.ignored || []).filter(i => i.reason === 'duplicado');

  // sin-status: warning rojo — parser no detectó status
  if (ignoredNoStatus.length) {
    const rows = ignoredNoStatus.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code">${esc(i.code)}</span>
        <span class="ckpt-item-desc">${esc((i.desc || '').slice(0, 50))}</span>
        <span class="ckpt-item-change ckpt-item-change--error">sin status</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section warning">
      <div class="ckpt-section-header">⚠ ${ignoredNoStatus.length} sin status detectado — revisar formato</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // duplicado: notice amarillo — posible duplicado por título
  if (ignoredDup.length) {
    const rows = ignoredDup.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code ckpt-item-change--warn">[nuevo]</span>
        <span class="ckpt-item-desc">${esc((i.desc || '').slice(0, 60))}</span>
        <span class="ckpt-item-change ckpt-item-change--warn">duplicado de ${i.existingCode ? esc(i.existingCode) : 'ítem existente'}</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section notice">
      <div class="ckpt-section-header">~ ${ignoredDup.length} posible${ignoredDup.length>1?'s duplicados':' duplicado'} — no agregado</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // ya-en-status / sin-cambios: neutro colapsado
  if (ignoredOk.length) {
    const rows = ignoredOk.map(i =>
      `<div class="ckpt-item">
        <span class="ckpt-item-code">${esc(i.code)}</span>
        <span class="ckpt-item-desc">${esc((i.desc || '').slice(0, 50))}</span>
        <span class="ckpt-item-change">${i.reason === 'ya-en-status' ? 'ya ' + esc(i.status || '') : 'sin cambios'}</span>
      </div>`).join('');
    sections.push(`<div class="ckpt-section ignored">
      <div class="ckpt-section-header">— ${ignoredOk.length} sin cambios</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // Context mergeado
  if (result.contextSections && result.contextSections.length) {
    const rows = result.contextSections.map(s =>
      `<div class="ckpt-item"><span class="ckpt-item-desc">${esc(s)}</span></div>`).join('');
    sections.push(`<div class="ckpt-section context">
      <div class="ckpt-section-header">📄 Context — ${result.contextSections.length} sección${result.contextSections.length>1?'es':''}</div>
      <div class="ckpt-section-body">${rows}</div>
    </div>`);
  }

  // R-202605-140: sección informativa — Próximo paso y Decisión cuando no hay ítems (Caso B)
  // o como complemento cuando sí los hay (Caso A, sidebar derecho lo renderiza por separado)
  const _isInfoOnly = (v) => !v || v.trim().toLowerCase() === 'n/a';
  const _proximoPaso = result.proximoPaso || '';
  const _decision    = result.decision    || '';
  const _hasProximo  = !_isInfoOnly(_proximoPaso);
  const _hasDecision = !_isInfoOnly(_decision);
  if (!sections.length && (_hasProximo || _hasDecision)) {
    // Caso B: CHECKPOINT sin ítems — solo campos informativos
    const _proximoHtml = _hasProximo
      ? `<div class="ckpt-info-proximo">
           <span class="ckpt-info-label ckpt-info-label--proximo">→ Próximo paso</span>
           <span class="ckpt-info-text">${esc(_proximoPaso)}</span>
         </div>`
      : '';
    const _decisionHtml = _hasDecision
      ? `<div class="ckpt-info-decision">
           <span class="ckpt-info-label ckpt-info-label--decision">Decisión</span>
           <span class="ckpt-info-text">${esc(_decision)}</span>
         </div>`
      : '';
    sections.push(`<div class="ckpt-section ckpt-section--info">${_proximoHtml}${_decisionHtml}</div>`);
  } else if (sections.length && (_hasProximo || _hasDecision)) {
    // Caso A: hay ítems — inyectar proximoPaso en el objeto result para que el sidebar lo muestre
    // El HTML del sidebar se renderiza en index.html; aquí anotamos en el panel body como footer
    const _proximoHtml = _hasProximo
      ? `<div class="ckpt-info-proximo ckpt-info-proximo--inline">
           <span class="ckpt-info-label ckpt-info-label--proximo">→ Próximo paso</span>
           <span class="ckpt-info-text">${esc(_proximoPaso)}</span>
         </div>`
      : '';
    if (_proximoHtml) sections.push(`<div class="ckpt-section ckpt-section--info-footer">${_proximoHtml}</div>`);
  }

  if (!sections.length) return; // nada que mostrar

  body.innerHTML = sections.join('');
  clearTimeout(_ckptTimer);
  // R-202604-077: panel diff unificado mantiene abierto sin timeout mientras hay confirmaciones pendientes
  const hasPending = _hasPendingConfirm;
  const duration = hasPending ? 120000 : 7000;
  if (bar) {
    bar.style.setProperty('--ckpt-bar-duration', (duration / 1000) + 's');
    bar.classList.remove('ckpt-bar--running');
    void bar.offsetWidth;
    bar.classList.add('ckpt-bar--running');
  }
  panel.classList.add('open');
  _ckptTimerEnd = Date.now() + duration;
  _ckptTimer = setTimeout(() => { panel.classList.remove('open'); _ckptTimerEnd = null; }, duration);
}

function togglePasteHelp(id) {
  const box = document.getElementById('paste-help-' + id);
  if (!box) return;
  box.classList.toggle('hidden');
}

// R-202605-XXX: Botones accionables textarea paste — Limpiar y Pegar
function clearPasteTa(id) {
  const ta = document.getElementById('ta-' + id);
  if (!ta || !ta.value) return;
  // B-202605: bloquear limpieza si hay borrador guardado en localStorage
  const hasDraft = !!localStorage.getItem('draft-' + id);
  if (hasDraft) {
    showToast('warning', 'Hay un borrador guardado — guarda o descarta la sesión antes de limpiar');
    return;
  }
  ta.value = '';
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.focus();
  _updatePasteTaActions(id);
}

async function pasteFromClipboard(id) {
  const ta = document.getElementById('ta-' + id);
  if (!ta) return;
  // Un solo click: intentar clipboard API, si falla enfocar textarea para paste manual
  try {
    const text = await navigator.clipboard.readText();
    if (!text) { ta.focus(); return; }
    ta.value = text;
    ta.dispatchEvent(new Event('paste', { bubbles: true }));
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    _updatePasteTaActions(id);
  } catch (e) {
    // Sin permiso de clipboard: enfocar el textarea para que el usuario pegue con Ctrl+V
    ta.focus();
    showToast('info', 'Pega con Ctrl+V — el navegador no permite acceso directo al portapapeles');
  }
}

function _updatePasteTaActions(id) {
  const ta    = document.getElementById('ta-' + id);
  const btn   = document.getElementById('pta-clear-' + id);
  if (!ta || !btn) return;
  const hasVal = ta.value.length > 0;
  btn.disabled = !hasVal;
  btn.classList.toggle('paste-ta-btn--disabled', !hasVal);
}

function _updateCkptReopenBtn() {
  const btn = document.getElementById('ckpt-reopen-btn');
  if (!btn) return;
  btn.classList.toggle('hidden', !_lastCheckpointResult);
}

function closeCkptPanel() {
  const panel = document.getElementById('ckpt-panel');
  if (panel) panel.classList.remove('open');
  clearTimeout(_ckptTimer);
  _ckptTimerEnd = null;
}

// P-001: pausar/reanudar timer del panel CHECKPOINT cuando un modal de confirmación está abierto
function _pauseCkptTimer() {
  if (!_ckptTimer || !_ckptTimerEnd) return;
  clearTimeout(_ckptTimer);
  _ckptTimer = null;
  // Guardar tiempo restante en _ckptTimerEnd (negativo = ya no hay timer activo, solo residual)
  _ckptTimerEnd = _ckptTimerEnd - Date.now(); // ms restantes
}

function _resumeCkptTimer() {
  const panel = document.getElementById('ckpt-panel');
  if (!panel || !panel.classList.contains('open')) { _ckptTimerEnd = null; return; }
  const remaining = typeof _ckptTimerEnd === 'number' ? _ckptTimerEnd : 0;
  if (remaining <= 0) { panel.classList.remove('open'); _ckptTimerEnd = null; return; }
  _ckptTimerEnd = Date.now() + remaining; // restaurar como timestamp absoluto
  _ckptTimer = setTimeout(() => { panel.classList.remove('open'); _ckptTimerEnd = null; }, remaining);
}

// Toast stack system — múltiples toasts simultáneos con spring animation
const _TOAST_ICONS = { success: '✓', download: '↓', info: 'ℹ', warning: '⚠', error: '✕' };
// T-202604-229: duraciones base por tipo; 0 = sin auto-dismiss
// T-202604-279: duraciones calibradas — base mínima + 40ms/char sobre el mínimo
//   success : mín 2000ms + 40ms/char
//   error   : 0 (sin auto-dismiss — requiere acción del usuario)
//   warning : mín 3000ms + 40ms/char
//   info    : mín 2000ms + 40ms/char
//   download: Math.min(8000, 4000 + 40ms/char) — o hasta dismiss
//   copy / neutral / confirm: planos (sin contenido variable largo)
const _TOAST_DEFAULTS = { success: 2000, download: 4000, error: 0, warning: 3000, info: 2000, confirm: 3500, copy: 2000, neutral: 2500 };
// T-202604-279: calcula duración calibrada según tipo y longitud del texto visible
function _toastDuration(type, title, body) {
  const base = _TOAST_DEFAULTS[type] ?? 2000;
  if (base === 0) return null; // error → sin auto-dismiss
  if (type === 'copy' || type === 'neutral' || type === 'confirm') return base;
  const len = (title ? title.replace(/<[^>]+>/g, '').length : 0) + (body ? body.replace(/<[^>]+>/g, '').length : 0);
  const calibrated = base + len * 40;
  if (type === 'download') return Math.min(8000, calibrated);
  return calibrated;
}

// T-202604-280: stack rules — máximo 3 visibles, queue, prioridad, digest
const _TOAST_MAX = 3;
const _TOAST_PRIORITY = { error: 0, warning: 1, success: 2, info: 3, download: 4 };
let _toastQueue = []; // { type, title, body, base, onClick }

function _toastVisibleCount() {
  const stack = document.getElementById('toast-stack');
  if (!stack) return 0;
  return Array.from(stack.querySelectorAll('.toast-item')).filter(t => !t._dismissed).length;
}

function _toastRender(type, title, body, base, onClick) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;

  const el = document.createElement('div');
  el.className = 'toast-item t-' + type;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icon = _TOAST_ICONS[type] || 'ℹ';
  const titleHtml = /<[a-z][\s\S]*>/i.test(title) ? title : esc(title);
  const bodyHtml  = body ? (/<[a-z][\s\S]*>/i.test(body) ? body : esc(body)) : null;
  const progressHtml = base !== null ? `<div class="toast-progress"></div>` : '';

  el.innerHTML =
    `<span class="toast-icon">${icon}</span>` +
    `<span class="toast-msg">` +
      `<span class="toast-title">${titleHtml}</span>` +
      (bodyHtml ? `<span class="toast-body">${bodyHtml}</span>` : '') +
    `</span>` +
    `<button class="toast-dismiss" aria-label="Cerrar notificación">×</button>` +
    progressHtml;

  el.querySelector('.toast-dismiss').addEventListener('click', (e) => {
    e.stopPropagation();
    _dismissToast(el);
  });

  if (onClick) {
    el.querySelector('.toast-msg').classList.add('toast-clickable');
    el.querySelector('.toast-msg').addEventListener('click', () => { onClick(); _dismissToast(el); }, { once: true });
  } else if (type === 'error' || type === 'warning') {
    el.classList.add('toast-clickable');
    el.addEventListener('click', () => _dismissToast(el), { once: true });
  }

  // T-202604-228: stagger — cap 3 → 180ms máx
  const _staggerIdx = Math.min(_toastVisibleCount(), _TOAST_MAX - 1);
  const _staggerDelay = _staggerIdx * 60;

  stack.appendChild(el);
  if (base === null) el._noDismiss = true;
  el.getBoundingClientRect();
  if (_staggerDelay > 0) el.style.setProperty('--toast-stagger-delay', _staggerDelay + 'ms');
  el.classList.add('show');
  if (_staggerDelay > 0) setTimeout(() => { el.style.removeProperty('--toast-stagger-delay'); }, _staggerDelay + 300);

  if (base !== null) {
    el.style.setProperty('--toast-duration', (base / 1000) + 's');
    el._hideTimer = setTimeout(() => _dismissToast(el), base);
    el._timerEnd = Date.now() + base;

    el.addEventListener('mouseenter', () => {
      if (el._dismissed) return;
      clearTimeout(el._hideTimer);
      el._hideTimer = null;
      el._remaining = Math.max(0, el._timerEnd - Date.now());
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'paused');
    });
    el.addEventListener('mouseleave', () => {
      if (el._dismissed || el._remaining == null) return;
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'running');
      el._timerEnd = Date.now() + el._remaining;
      el._hideTimer = setTimeout(() => _dismissToast(el), el._remaining);
      el._remaining = null;
    });
    // T-202604-221: touch — pausa en touchstart, reanuda en touchend/touchcancel fuera del toast
    el.addEventListener('touchstart', () => {
      if (el._dismissed) return;
      clearTimeout(el._hideTimer);
      el._hideTimer = null;
      el._remaining = Math.max(0, el._timerEnd - Date.now());
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'paused');
    }, { passive: true });
    const _touchResume = () => {
      if (el._dismissed || el._remaining == null) return;
      const bar = el.querySelector('.toast-progress');
      if (bar) bar.style.setProperty('--toast-play-state', 'running');
      el._timerEnd = Date.now() + el._remaining;
      el._hideTimer = setTimeout(() => _dismissToast(el), el._remaining);
      el._remaining = null;
    };
    el.addEventListener('touchend', _touchResume, { passive: true });
    el.addEventListener('touchcancel', _touchResume, { passive: true });
  }

  // T-202604-221: accesibilidad teclado — Tab navega entre toasts, Enter/Space cierra
  el.setAttribute('tabindex', '0');
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _dismissToast(el); }
  });
}

// T-202604-222: nueva firma (type, title, body?, duration?, onClick?)
// T-202604-278: regla onClick — solo usar cuando la acción NO es accesible de otra forma en el
//   contexto actual. Toasts informativos van sin onClick. Si el usuario puede encontrar la acción
//   en la UI principal, onClick es redundante y se omite.
//   Ejemplos válidos: navegar a una sección que se acaba de modificar en otro tab.
//   Ejemplos inválidos: dismiss manual (ya hay botón ×), re-abrir modal que tiene acceso directo.
function showToast(type, title, body = null, duration = null, onClick = null) {
  // T-202604-229: duration explícito tiene prioridad; si no → _toastDuration calibra por tipo+len
  // T-202604-279: _toastDuration() aplica fórmula base + 40ms/char; error siempre null (no dismiss)
  const base = duration !== null ? duration : _toastDuration(type, title, body);

  // T-202604-280: si ya hay _TOAST_MAX visibles → encolar; persistentes (base=null) siempre pasan directo
  if (base !== null && _toastVisibleCount() >= _TOAST_MAX) {
    _toastQueue.push({ type, title, body, base, onClick });
    // Reordenar queue por prioridad
    _toastQueue.sort((a, b) =>
      (_TOAST_PRIORITY[a.type] ?? 99) - (_TOAST_PRIORITY[b.type] ?? 99)
    );
    return;
  }

  _toastRender(type, title, body, base, onClick);
}

function _dismissToast(el) {
  if (el._dismissed) return;
  el._dismissed = true;
  clearTimeout(el._hideTimer);
  el.classList.add('toast-hide');
  setTimeout(() => {
    el.remove();
    _toastNext(); // T-202604-280: mostrar siguiente de queue al dismissear
  }, 160); // T-202604-221: 150ms transición salida + 10ms buffer
}

// T-202604-280: extrae el siguiente toast de queue (ya ordenado por prioridad) y lo renderiza
function _toastNext() {
  if (!_toastQueue.length) return;
  if (_toastVisibleCount() >= _TOAST_MAX) return;
  const next = _toastQueue.shift();
  _toastRender(next.type, next.title, next.body, next.base, next.onClick);
}

// T-202604-280: digest — agrupa múltiples mensajes del mismo tipo en un solo toast
// Uso: showToastDigest('warning', ['Proyecto A estancado', 'Proyecto B estancado', 'Proyecto C estancado'])
// Resultado: "Proyecto A estancado" + body "y 2 más" si count > 1, o toast individual si solo 1
function showToastDigest(type, msgs, duration = null) {
  if (!msgs || !msgs.length) return;
  if (msgs.length === 1) {
    showToast(type, msgs[0], null, duration);
    return;
  }
  const title = msgs[0];
  const body = `y ${msgs.length - 1} más`;
  showToast(type, title, body, duration);
}

// alias — retrocompat
function toast(msg) { showToast('info', msg); }

// T-202604-221: showToastInline — toast anclado al elemento que detona la acción
// Acciones sobre ítems: marcar done, copiar código, cambio de status
// En mobile (<600px) delega a showToast global.
//
// Firma original:   showToastInline(anchorEl, type, title, opts)
// Firma con acción: showToastInline(anchorEl, actions, title, opts)
//   donde actions es Array<{ label, cls, cb }> — detectado por Array.isArray(actionsOrType)
//
// R-202605-151: modo acción — renderiza título + botones. Al ejecutar cb() cierra el toast.
//   Click fuera del anchor cierra sin ejecutar ningún callback (cancelar implícito).
//   Mobile (≤600px): delega a showToast con el título — sin botones.
function showToastInline(anchorEl, actionsOrType, title, opts = {}) {
  const isActionMode = Array.isArray(actionsOrType);
  const type = isActionMode ? 'info' : actionsOrType;
  const actions = isActionMode ? actionsOrType : null;

  if (!anchorEl) { showToast(type, title); return; }

  // Mobile: delegar al sistema global (sin botones de acción)
  if (window.innerWidth <= 600) {
    showToast(type, title);
    return;
  }

  // Limpiar inline anterior en el mismo anchor si existe
  const prev = anchorEl.querySelector('.toast-inline');
  if (prev) prev.remove();

  // Asegurar position:relative en el anchor
  const pos = getComputedStyle(anchorEl).position;
  if (pos === 'static') anchorEl.style.setProperty('position', 'relative');

  const el = document.createElement('div');
  const placement = opts.position || 'above';
  el.className = `toast-inline t-${type} toast-inline--${placement}`;
  el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const _hideInline = () => {
    if (el._inlineDismissed) return;
    el._inlineDismissed = true;
    clearTimeout(el._inlineTimer);
    el.classList.add('toast-hide');
    setTimeout(() => el.remove(), 200);
  };

  if (isActionMode && actions.length) {
    // Modo acción: texto + botones
    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast-inline-msg';
    msgSpan.textContent = title;
    el.appendChild(msgSpan);

    const btnWrap = document.createElement('span');
    btnWrap.className = 'toast-inline-actions';
    actions.forEach(({ label, cls, cb }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `toast-inline-btn${cls ? ' ' + cls : ''}`;
      btn.textContent = label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _hideInline();
        if (typeof cb === 'function') cb();
      });
      btnWrap.appendChild(btn);
    });
    el.appendChild(btnWrap);

    // Click fuera del anchor — cancelar implícito (sin ejecutar cb)
    const _outsideHandler = (e) => {
      if (!anchorEl.contains(e.target)) {
        _hideInline();
        document.removeEventListener('click', _outsideHandler, true);
      }
    };
    // Diferir para no capturar el click que abrió el toast
    setTimeout(() => document.addEventListener('click', _outsideHandler, true), 0);
    el._outsideHandler = _outsideHandler;

  } else {
    // Modo informativo original
    const icon = _TOAST_ICONS[type] || 'ℹ';
    el.textContent = `${icon} ${title}`;
    el._inlineTimer = setTimeout(_hideInline, 2000);
  }

  anchorEl.appendChild(el);
  el.getBoundingClientRect(); // forzar reflow
  el.classList.add('show');
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  save();
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  // T-202605-433: theme-btn eliminado — nuevo ID en menú ⋯
  const btn = document.getElementById('more-menu-theme');
  if (btn) {
    const icon = btn.querySelector('.mm-icon');
    if (icon) icon.textContent = t === 'dark' ? '☀' : '🌙';
  }
}

// T-202604-299: debounce config + dirty flag
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

// R-202604-035: escribe sesiones de un proyecto
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


// ── T-202604-055: Log de acciones del backlog ──
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
  if (!_supabase) return;

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

  if (_supabase && _supabaseUser) {
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
}

function onSearchDispatch() {
  // T-202604-420: búsqueda global unificada como punto de entrada principal
  // La búsqueda por tab queda subordinada — onSearch incluye backlog + proyectos + IAs + sesiones + notas
  const _surPanel = document.getElementById('search-unified-results');
  if (_surPanel) _surPanel.remove();

  const q = (document.getElementById('search-global')?.value || '').trim();

  // Siempre invocar búsqueda global unificada
  if (typeof onSearch === 'function') onSearch();
}

// ── TAB-TRACKER — State, render, cards, sesiones, tracker global, tags, pendientes ──

const DEFAULT_AIS = [];

// v3.0.0: sessions, tracker y sprints viven en project — no en state global
let state = {ais:[], theme:'dark', tags:[], projects:[], _stateVersion:3};
let popAIId = null, popSessId = null;
let tagModalAIId = null, tagModalSessId = null, selectedColor = 0;

const TAG_COLORS = ['#7c6af7','#2ecc78','#e8a832','#e85555','#38bdf8','#f472b6','#a3e635','#fb923c'];

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

function load() {
  // Carga síncrona desde localStorage (arranque inmediato)
  const s = localStorage.getItem('ai-tracker-v4');
  let _migrated = false;
  if (s) { try { _migrated = _applyStateData(JSON.parse(s)); } catch (e) { console.error('[AI Tracker] Estado corrupto en localStorage — restaurando defaults:', e); _applyStateData({ais: clone(DEFAULT_AIS), theme:'dark', tags:[]}); showToast('error', '❌ Estado corrupto detectado — se restauraron los valores por defecto. Tus datos en Supabase no fueron afectados.', null, 10000); } }
  else { _applyStateData({ais: clone(DEFAULT_AIS), theme:'dark', tags:[]}); }
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
  // B-202604-010: render inicial desde estado real — el HTML estático es un snapshot,
  // sin este render el DOM no refleja localStorage al refrescar
  render();
  // R-202604-072: panel de contexto diario — diferido para que ITEMS esté cargado
  setTimeout(_showArranquePanel, 400);
  // R-202604-073: dot Pulso — inicializar desde localStorage si existe, recalcular en 600ms
  (function() {
    const cached = (() => { try { return JSON.parse(localStorage.getItem(_PULSO_KEY) || 'null'); } catch(e) { return null; } })();
    const dot = document.getElementById('pulso-dot');
    if (dot && cached && cached.color) dot.className = `pulso-dot pulso-dot--${cached.color}`;
  })();
  setTimeout(renderPulsoDot, 600);
  // T-084: verificar umbral de sesiones al cargar
  setTimeout(checkStorageWarn, 500);

  // T-202605-482: cargar desde Supabase
  if (_supabase) {
    _loadFromSupabase();
  }
}

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
        const shouldLoad  = remoteItems.length && (ITEMS.length === 0 || localTs === 0 || remoteTs > localTs);
        if (shouldLoad) {
          // Reemplazar completo — no merge aditivo
          ITEMS.length = 0;
          remoteItems.forEach(ri => ITEMS.push(ri));
          localStorage.setItem(_tplKey('backlog-items'), JSON.stringify(ITEMS));
          localStorage.setItem(_tplKey('backlog-meta'),  JSON.stringify(remoteMeta));
        }
      }
    } catch (blErr) {
      console.warn('[AI Tracker] Error cargando backlog desde Supabase:', blErr);
    }

    // ── 6. Cargar docs vivos (context, htmlmap, plan) — R-202605-120: Supabase es fuente de verdad ─────────────────────
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

    // ── 7. Re-render final ────────────────────────────────────────────────
    render(); renderHoy(); updateStats();
    if (typeof renderBacklogList === 'function') renderBacklogList();
    setSyncStatus('synced', '✓ sincronizado');

  } catch (err) {
    console.error('[AI Tracker] _loadFromSupabase() failed:', err);
    setSyncStatus('offline', '✕ sin conexión');
    showToast('warning', '⚠️ No se pudo cargar desde Supabase — operando en modo local', null, 6000);
  }
}

// R-202604-035: _loadFromFirebase eliminado — AC-8: Firebase eliminado, Supabase es el único backend
// _migrateLegacyFirebaseDoc eliminado — migración one-shot completada

// T-084: Muestra banner de advertencia si totalSessions supera el umbral
const STORAGE_WARN_THRESHOLD = 300;
function checkStorageWarn() {
  const total = getAllSessions().length;
  const banner = document.getElementById('storage-warn');
  if (!banner) return;
  const overThreshold = total > STORAGE_WARN_THRESHOLD;
  banner.classList.toggle('storage-warning-banner--visible', overThreshold);
}
function getAI(id) { return state.ais.find(a => a.id === id); }

// ── v3.0.0: helpers de sesiones por proyecto ──

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

// Claves localStorage por proyecto
function _projKey(base, projId) { return projId ? base + '-' + projId : base; }

// T-202604-006: clave de template para el proyecto activo
function _tplKey(base) {
  const projId = _getActiveProjectFilter();
  return projId ? base + '-' + projId : base;
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

function updateStats() {
  // v3: contar sesiones desde proyectos
  const tot = getAllSessions().length;
  // Actualizar badge del sub-tab Tracker (tg-badge-sub)
  const tgBadgeSub = document.getElementById('tg-badge-sub');
  if (tgBadgeSub) {
    const tracker = getActiveTracker();
    const activeCount = (tracker.items || []).filter(x => x.status !== 'done').length;
    tgBadgeSub.textContent = activeCount;
    tgBadgeSub.classList.toggle('tg-badge-sub--visible', !!activeCount);
  }
}

// Detecta si una IA está "en sesión": disponible con última sesión sin resetAt ni quickCapture
// = checkpoint registrado pero aún no se agotó formalmente
function _isInSession(ai) {
  if (ai.status !== 'available' || ai.interrupted) return false;
  // Usar id (timestamp) como proxy de orden — más robusto que date (formato localizado)
  const allSess = getAllSessions().filter(s => s.aiId === ai.id);
  if (!allSess.length) return false;
  const last = allSess.reduce((a, b) => (parseInt(b.id) || 0) > (parseInt(a.id) || 0) ? b : a);
  return !!(last && !last.resetAt && !last.quickCapture);
}

// T-086 / T-202604-181: Barra de estado sobre el grid (solo vista Cards)
// Contenido: toggle tema (izq) · Sprint activo · Pendientes · Último cambio relativo (der)
function renderStatusBar() {
  // R-202604-060: tracker-status-bar DEPRECATED — lógica migrada a tracker-grid-header + global-footer

  // ── Grid header: vacío — pill migrado a tracker-view-header (R-202605-139) ──
  const gridHeader = document.getElementById('tracker-grid-header');
  if (gridHeader) {
    gridHeader.innerHTML = '';
    gridHeader.classList.remove('tgh-visible');
  }

  // ── R-202605-139: sprint pill en tracker-view-header ──────────────────────────────────
  // El sprint pertenece al proyecto activo, no a un AI individual.
  // El pill vive a la izquierda del selector de vista, siempre visible en el tab Tracker.
  const viewHeader = document.getElementById('tracker-view-header');
  if (viewHeader) {
    let sprintPillHtml = '';
    try {
      const proj = getActiveProject();
      const sp = proj && proj.sprints ? proj.sprints.find(s => s.status === 'active') : null;
      if (sp) {
        const spItems = (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(i => i.sprint === sp.id);
        const spDone  = spItems.filter(i => i.status === 'done').length;
        const spTotal = spItems.length;
        const spPct   = spTotal > 0 ? Math.round((spDone / spTotal) * 100) : 0;
        const spLabel = sp.label || sp.id;
        sprintPillHtml = `<button class="tgh-sprint-pill tvh-sprint-pill" onclick="if(typeof toggleSprintHealthPanel==='function')toggleSprintHealthPanel();" title="Ver sprint health">` +
          `<span class="tgh-sprint-name">${spLabel}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-progress">${spDone}/${spTotal}</span>` +
          `<span class="tgh-sprint-sep">·</span>` +
          `<span class="tgh-sprint-pct">${spPct}%</span>` +
          `<span class="tgh-sprint-bar-wrap"><span class="tgh-sprint-bar-fill" style="--pct:${spPct}%"></span></span>` +
          `</button>`;
      }
    } catch(e) {}

    const existingPill = viewHeader.querySelector('.tvh-sprint-pill');
    if (existingPill) {
      if (sprintPillHtml) {
        existingPill.outerHTML = sprintPillHtml;
      } else {
        existingPill.remove();
      }
    } else if (sprintPillHtml) {
      viewHeader.insertAdjacentHTML('afterbegin', sprintPillHtml);
    }
  }


  // ── Global footer: R-202604-080 — barra de estado global ─────────────────
  const gfProyecto = document.getElementById('gf-proyecto');
  const gfVersion  = document.getElementById('gf-version');
  const gfTotal    = document.getElementById('gf-total');
  const gfDone     = document.getElementById('gf-done');
  const gfCkpt     = document.getElementById('gf-ckpt');
  const gfPulso    = document.getElementById('gf-pulso');
  const gfFecha    = document.getElementById('gf-fecha');
  const gfSyncEl   = document.getElementById('gf-sync');
  if (gfSyncEl) gfSyncEl.classList.remove('gf-hidden');

  const _items = (typeof ITEMS !== 'undefined' ? ITEMS : []);

  // gf-proyecto
  if (gfProyecto) {
    try {
      const proj = getActiveProject();
      const nombre = (proj && proj.name) ? proj.name : 'AI Tracker';
      gfProyecto.textContent = nombre;
      gfProyecto.classList.remove('gf-hidden');
    } catch(e) {
      gfProyecto.textContent = 'AI Tracker';
      gfProyecto.classList.remove('gf-hidden');
    }
  }

  // gf-version
  if (gfVersion) {
    gfVersion.textContent = (typeof _effectiveVersion === 'function') ? _effectiveVersion() : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '');
    gfVersion.classList.remove('gf-hidden');
  }

  // gf-total / gf-done
  if (gfTotal || gfDone) {
    const total = _items.filter(i => typeof _isCountableItem === 'function' ? _isCountableItem(i) : true).length;
    const done  = _items.filter(i => (typeof _isCountableItem === 'function' ? _isCountableItem(i) : true) && i.status === 'done').length;
    if (gfTotal) { gfTotal.textContent = total + ' ítems'; gfTotal.classList.remove('gf-hidden'); }
    if (gfDone)  { gfDone.textContent  = '✓ ' + done;   gfDone.classList.remove('gf-hidden'); }
  }

  // gf-ckpt: ultimo checkpoint global
  if (gfCkpt) {
    try {
      const allSess = getAllSessions().slice().sort((a, b) => {
        const ta = a.timestamp || a.endTime || a.startTime || 0;
        const tb = b.timestamp || b.endTime || b.startTime || 0;
        return tb - ta;
      });
      const lastSess = allSess[0] || null;
      if (lastSess) {
        const titulo = (lastSess.title || lastSess.nombre || '').slice(0, 28) || '—';
        gfCkpt.textContent = '⏱ ' + titulo;
        gfCkpt.classList.remove('gf-hidden');
        gfCkpt.classList.add('gf-ckpt--link');
        gfCkpt.onclick = function() {
          if (typeof openDetail === 'function') openDetail(lastSess.aiId, lastSess.id);
        };
      } else {
        gfCkpt.classList.add('gf-hidden');
        gfCkpt.onclick = null;
      }
    } catch(e) { gfCkpt.classList.add('gf-hidden'); }
  }

  // gf-pulso
  if (gfPulso) {
    gfPulso.textContent = '◉ Pulso';
    gfPulso.classList.remove('gf-hidden');
    gfPulso.classList.add('gf-pulso--link');
    gfPulso.onclick = function() {
      if (typeof openPulsoPanel === 'function') openPulsoPanel();
    };
  }

  // gf-fecha
  if (gfFecha) {
    try {
      const timestamps = _items.map(i => i.statusChangedAt).filter(Boolean);
      if (timestamps.length) {
        const maxTs = Math.max.apply(null, timestamps);
        const iso   = new Date(maxTs).toISOString().split('T')[0];
        gfFecha.textContent = iso;
        gfFecha.classList.remove('gf-hidden');
      } else {
        gfFecha.classList.add('gf-hidden');
      }
    } catch(e) { gfFecha.classList.add('gf-hidden'); }
  }
}

// AI STATUS BAR — footer persistente visible en todos los módulos
// Dot gris = agotada | dot verde = disponible | dot púrpura pulsante = en sesión | dot ámbar pulsante = interrumpida

// T-202604-422: Notificaciones de ecosistema — motor + helpers
const _NOTIF_KEY         = 'ai-tracker-notifs-read';
const _NOTIF_CONFIG_KEY  = 'ai-tracker-notifs-config';
// R-202605-119: historial de notificaciones descartadas
const _NOTIF_HISTORY_KEY = 'ai-tracker-notifs-history';
const _NOTIF_HISTORY_MAX = 50;

// R-202605-119: helpers de historial
function _notifHistory() {
  try { return JSON.parse(localStorage.getItem(_NOTIF_HISTORY_KEY) || '[]'); } catch { return []; }
}

function _notifHistoryAdd(notif) {
  // severity: 'info' para la mayoría, 'warn' para bugs high y sprint low, 'ok' para desbloqueados
  const severityMap = { bugHigh: 'warn', sprintLow: 'warn', unblocked: 'ok', sprintOrphans: 'warn' };
  const entry = {
    type:      notif.type,
    severity:  severityMap[notif.type] || 'info',
    text:      notif.title + ' — ' + notif.body,
    ts:        Date.now(),
    projectId: notif.projectId || null
  };
  const hist = _notifHistory();
  hist.push(entry);
  // AC-4: FIFO — máximo 50 entradas
  const pruned = hist.length > _NOTIF_HISTORY_MAX ? hist.slice(hist.length - _NOTIF_HISTORY_MAX) : hist;
  try { localStorage.setItem(_NOTIF_HISTORY_KEY, JSON.stringify(pruned)); } catch {}
}

// Configuración de notificaciones — tipos habilitados y umbrales de tiempo
// B-202605-240: persiste en localStorage
const _NOTIF_DEFAULTS = {
  unblocked:     { enabled: true,  label: 'Bloqueante resuelto',              threshold: 7  },
  sprintOrphans: { enabled: true,  label: 'Sprint cerrado con pendientes',    threshold: 0  },
  itemInactivo:  { enabled: true,  label: 'Ítem sin sesión vinculada',        threshold: 14 },
  sprintLow:     { enabled: true,  label: 'Sprint con avance bajo a mitad',   threshold: 20 },
  bugHigh:       { enabled: true,  label: 'Bug high sin sesión vinculada',    threshold: 7  },
  aiCadencia:    { enabled: true,  label: 'IA fuera de cadencia histórica',   threshold: 0  },
};

function _notifConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(_NOTIF_CONFIG_KEY) || '{}');
    // Merge con defaults — nuevos tipos no borran config existente
    const merged = {};
    Object.keys(_NOTIF_DEFAULTS).forEach(k => {
      merged[k] = Object.assign({}, _NOTIF_DEFAULTS[k], stored[k] || {});
    });
    return merged;
  } catch { return Object.assign({}, _NOTIF_DEFAULTS); }
}

function _saveNotifConfig(cfg) {
  try { localStorage.setItem(_NOTIF_CONFIG_KEY, JSON.stringify(cfg)); } catch {}
}

function _notifReadSet() {
  try { return new Set(JSON.parse(localStorage.getItem(_NOTIF_KEY) || '[]')); } catch { return new Set(); }
}
function _notifSaveRead(set) {
  try { localStorage.setItem(_NOTIF_KEY, JSON.stringify([...set])); } catch {}
}

// Computa todas las notificaciones activas del ecosistema
// B-202605-238: implementa los 4 triggers del AC de R-202604-084
// Devuelve array de { id, type, tab, icon, title, body, action }
// Función canónica — ¿tiene el ítem sesión vinculada en los últimos N días?
// Consulta trackerRefs + backlogRefs. Usa savedAt || createdAt como timestamp.
// Fallback: si el ítem fue creado hace menos de N días sin ninguna mención, retorna true.
function hasRecentSession(item, days) {
  if (!item) return true;
  const allSess = (typeof getAllSessions === 'function' ? getAllSessions() : []);
  const cutoff  = Date.now() - days * 86400000;
  let lastMentionTs = 0;
  allSess.forEach(function(s) {
    const refs = (s.trackerRefs || []).concat(s.backlogRefs || []);
    if (refs.includes(item.code)) {
      const ts = s.savedAt || s.createdAt || (s.date ? new Date(s.date).getTime() : 0);
      if (ts > lastMentionTs) lastMentionTs = ts;
    }
  });
  if (!lastMentionTs) {
    const createdAt = item.createdAt || 0;
    if (!createdAt) return false;
    return (Date.now() - createdAt) / 86400000 <= days;
  }
  return lastMentionTs >= cutoff;
}

function _computeNotifications() {
  const notifs = [];
  const items  = (typeof ITEMS !== 'undefined' ? ITEMS : []);
  const cfg    = _notifConfig();

  // Helper interno — delega a función canónica
  function _itemHasRecentSession(item, days) {
    return hasRecentSession(item, days);
  }

  // 1. Bloqueante resuelto — pendiente con dep done + history.unblocked reciente
  if (cfg.unblocked && cfg.unblocked.enabled) {
    items.forEach(function(item) {
      if (item.status !== 'pendiente') return;
      if (!item.blockedBy || !item.blockedBy.length) return;
      const resolved = item.blockedBy.filter(function(c) {
        const dep = items.find(function(i) { return i.code === c; });
        return dep && dep.status === 'done';
      });
      if (!resolved.length) return;
      const recent = (item.history || []).find(function(h) {
        return h.type === 'unblocked' &&
          resolved.includes(h.data && h.data.by) &&
          (Date.now() - (h.ts || 0)) / 86400000 < (cfg.unblocked.threshold || 7);
      });
      if (!recent) return;
      const id  = 'unblocked-' + item.code + '-' + recent.ts;
      const lbl = (item.title || item.desc || '').substring(0, 48);
      notifs.push({
        id, type: 'unblocked', tab: 'backlog', icon: '\uD83D\uDD13',
        title: 'Bloqueante resuelto',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + ' ya puede avanzar',
        action: function() { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
      });
    });
  }

  // 2. Sprint cerrado con pendientes sin reasignar
  if (cfg.sprintOrphans && cfg.sprintOrphans.enabled) {
    const allSprints = (typeof getActiveSprints === 'function' ? getActiveSprints() : []);
    allSprints.filter(function(s) { return s.status === 'closed'; }).forEach(function(sp) {
      const orphans = items.filter(function(i) { return i.sprint === sp.id && i.status === 'pendiente'; });
      if (!orphans.length) return;
      const id  = 'sprint-orphans-' + sp.id;
      const cnt = orphans.length;
      notifs.push({
        id, type: 'sprintOrphans', tab: 'backlog', icon: '\u26A0\uFE0F',
        title: 'Sprint cerrado con pendientes',
        body: (sp.label || sp.id) + ' \u2014 ' + cnt + ' \xEDtem' + (cnt !== 1 ? 's' : '') + ' sin reasignar',
        action: function() {
          if (typeof switchTab === 'function') switchTab('backlog');
          if (typeof setFilter === 'function') setTimeout(function() { setFilter('sprint', sp.id); }, 80);
        }
      });
    });
  }

  // 3. B-202605-238 AC: ítem pendiente sin sesión vinculada > 14 días
  if (cfg.itemInactivo && cfg.itemInactivo.enabled) {
    const thresh = cfg.itemInactivo.threshold || 14;
    items.forEach(function(item) {
      if (item.status !== 'pendiente') return;
      if (!item.createdAt) return;
      const ageDays = (Date.now() - item.createdAt) / 86400000;
      if (ageDays <= thresh) return;
      if (_itemHasRecentSession(item, thresh)) return;
      const id  = 'item-inactivo-' + item.code;
      const lbl = (item.title || item.desc || '').substring(0, 40);
      notifs.push({
        id, type: 'itemInactivo', tab: 'backlog', icon: '\uD83D\uDD51',
        title: 'Ítem sin actividad',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + ' sin sesión en ' + Math.floor(ageDays) + ' días',
        action: function() { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
      });
    });
  }

  // 4. B-202605-238 AC: sprint con < 20% avance a mitad de período
  if (cfg.sprintLow && cfg.sprintLow.enabled) {
    const minPct = cfg.sprintLow.threshold != null ? cfg.sprintLow.threshold : 20;
    const allSprints2 = (typeof getActiveSprints === 'function' ? getActiveSprints() : []);
    allSprints2.filter(function(s) { return s.status === 'active'; }).forEach(function(sp) {
      if (!sp.startedAt || !sp.endsAt) return;
      const now      = Date.now();
      const total    = sp.endsAt - sp.startedAt;
      const elapsed  = now - sp.startedAt;
      if (total <= 0 || elapsed / total < 0.5) return; // aún no llega a mitad
      const spItems  = items.filter(function(i) { return i.sprint === sp.id; });
      const spDone   = spItems.filter(function(i) { return i.status === 'done'; }).length;
      const spPct    = spItems.length > 0 ? Math.round((spDone / spItems.length) * 100) : 0;
      if (spPct >= minPct) return;
      const id = 'sprint-low-' + sp.id;
      notifs.push({
        id, type: 'sprintLow', tab: 'backlog', icon: '\u26A1',
        title: 'Sprint con avance bajo',
        body: (sp.label || sp.id) + ' \u2014 ' + spPct + '% a mitad del período',
        action: function() {
          if (typeof switchTab === 'function') switchTab('backlog');
          if (typeof toggleSprintHealthPanel === 'function') setTimeout(toggleSprintHealthPanel, 80);
        }
      });
    });
  }

  // 5. B-202605-238 AC: B de prioridad high sin sesión vinculada > 7 días
  if (cfg.bugHigh && cfg.bugHigh.enabled) {
    const bugThresh = cfg.bugHigh.threshold || 7;
    items.forEach(function(item) {
      if (item.type !== 'B') return;
      if (item.priority !== 'high') return;
      if (item.status !== 'pendiente') return;
      if (!item.createdAt) return;
      const ageDays = (Date.now() - item.createdAt) / 86400000;
      if (ageDays <= bugThresh) return;
      if (_itemHasRecentSession(item, bugThresh)) return;
      const id  = 'bug-high-' + item.code;
      const lbl = (item.title || item.desc || '').substring(0, 40);
      notifs.push({
        id, type: 'bugHigh', tab: 'backlog', icon: '\uD83D\uDED1',
        title: 'Bug high sin atención',
        body: item.code + (lbl ? ' \u2014 ' + lbl : '') + ' lleva ' + Math.floor(ageDays) + ' días sin sesión',
        action: function() { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
      });
    });
  }

  // 6. B-202605-238 AC: IA sin sesión vs cadencia histórica
  if (cfg.aiCadencia && cfg.aiCadencia.enabled) {
    const active = (typeof state !== 'undefined' ? (state.ais || []) : []).filter(function(a) { return !a.archived; });
    active.forEach(function(ai) {
      if (ai.status === 'exhausted') return;
      const allSess  = (typeof getAllSessions === 'function' ? getAllSessions() : [])
        .filter(function(s) { return s.aiId === ai.id; })
        .sort(function(a, b) { return (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0); });
      if (allSess.length < 3) return; // sin cadencia establecida
      // Calcular intervalo promedio entre las últimas 6 sesiones
      const recent6   = allSess.slice(-6);
      let totalGap = 0, gapCount = 0;
      for (let i = 1; i < recent6.length; i++) {
        const diff = (new Date(recent6[i].date).getTime() || 0) - (new Date(recent6[i - 1].date).getTime() || 0);
        if (diff > 0) { totalGap += diff; gapCount++; }
      }
      if (!gapCount) return;
      const avgGapMs  = totalGap / gapCount;
      const lastSess  = allSess[allSess.length - 1];
      const sinceMs   = Date.now() - (new Date(lastSess.date).getTime() || 0);
      if (sinceMs < avgGapMs * 1.5) return; // dentro del 150% de cadencia normal
      const sinceD    = Math.floor(sinceMs / 86400000);
      const id        = 'ai-cadencia-' + ai.id;
      notifs.push({
        id, type: 'aiCadencia', tab: 'tracker', icon: '\uD83E\uDD16',
        title: 'IA fuera de cadencia',
        body: (ai.name || ai.id) + ' sin sesión en ' + sinceD + ' días (cadencia habitual: ' + Math.round(avgGapMs / 86400000) + 'd)',
        action: function() {
          if (typeof switchTab === 'function') switchTab('tracker');
          if (typeof navigateToCard === 'function') setTimeout(function() { navigateToCard(ai.id); }, 80);
        }
      });
    });
  }

  return notifs;
}

function markNotifRead(id) {
  // AC-3: guardar en historial antes de marcar como leída
  const all    = _computeNotifications();
  const notif  = all.find(function(n) { return n.id === id; });
  if (notif) _notifHistoryAdd(notif);
  const set = _notifReadSet();
  set.add(id);
  _notifSaveRead(set);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  updateTabNotifBadges();
}

function markAllNotifsRead() {
  const notifs = _computeNotifications();
  const set    = _notifReadSet();
  // AC-3: guardar todas en historial antes de marcar
  notifs.forEach(function(n) { _notifHistoryAdd(n); });
  notifs.forEach(function(n) { set.add(n.id); });
  _notifSaveRead(set);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  updateTabNotifBadges();
}

// B-202605-239: badges numéricos en tab buttons — un badge por tab con notifs no leídas
// tab field en cada notif determina qué tab recibe el badge
function updateTabNotifBadges() {
  const notifs = _computeNotifications();
  const read   = _notifReadSet();
  const unseen = notifs.filter(function(n) { return !read.has(n.id); });

  // Contar por tab
  const counts = { tracker: 0, backlog: 0, analytics: 0, proyectos: 0 };
  unseen.forEach(function(n) {
    if (n.tab && counts.hasOwnProperty(n.tab)) counts[n.tab]++;
  });

  // Actualizar badges en cada tab button
  Object.keys(counts).forEach(function(tab) {
    const btn = document.getElementById('tab-btn-' + tab);
    if (!btn) return;
    let badge = btn.querySelector('.tab-notif-badge');
    if (counts[tab] > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'tab-notif-badge';
        btn.appendChild(badge);
      }
      badge.textContent = counts[tab] > 9 ? '9+' : counts[tab];
      badge.classList.remove('hidden');
    } else {
      if (badge) badge.classList.add('hidden');
    }
  });
}

// B-202605-240: UI de configuración de notificaciones — tipos y umbrales
// R-202605-119: openNotifConfig redirige al Radar Sidebar — config unificada ahí
function openNotifConfig() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  // Expandir sidebar si está colapsado
  if (sidebar.classList.contains('collapsed')) {
    toggleRadarSidebar();
  }
  // Re-renderizar para asegurar que el panel esté presente
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
  // Expandir el panel config con un tick para que el DOM esté listo
  setTimeout(function() {
    var body  = document.getElementById('rsb-cfg-body');
    var arrow = document.getElementById('rsb-cfg-arrow');
    var btn   = document.getElementById('rsb-cfg-toggle-btn');
    if (body && body.classList.contains('rsb-cfg-body--hidden')) {
      body.classList.remove('rsb-cfg-body--hidden');
      if (arrow) arrow.textContent = '▾';
      if (btn)   btn.setAttribute('aria-expanded', 'true');
      body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 50);
}

function _notifConfigReset() {
  try { localStorage.removeItem(_NOTIF_CONFIG_KEY); } catch {}
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}

function _notifConfigSetEnabled(key, enabled) {
  const cfg = _notifConfig();
  if (!cfg[key]) cfg[key] = Object.assign({}, _NOTIF_DEFAULTS[key]);
  cfg[key].enabled = !!enabled;
  _saveNotifConfig(cfg);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}

function _notifConfigSetThreshold(key, val) {
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 1) return;
  const cfg = _notifConfig();
  if (!cfg[key]) cfg[key] = Object.assign({}, _NOTIF_DEFAULTS[key]);
  cfg[key].threshold = num;
  _saveNotifConfig(cfg);
  if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
}


const _notifActionMap = {};
function _registerNotifActions(notifs) {
  notifs.forEach(function(n) { _notifActionMap[n.id] = n.action; });
}
function _notifGoto(id) {
  const fn = _notifActionMap[id];
  if (typeof fn === 'function') fn();
  markNotifRead(id);
}

// R-202605-119: _renderNotifSection — empty state + historial + panel config colapsable al pie
function _renderNotifSection() {
  const all    = _computeNotifications();
  const read   = _notifReadSet();
  const unseen = all.filter(function(n) { return !read.has(n.id); });

  _registerNotifActions(all);

  // AC-2: helper para formatear ts en card
  function _fmtNotifTs(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var pad = function(x) { return String(x).padStart(2,'0'); };
    return d.getDate() + '/' + pad(d.getMonth()+1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  var notifContent;
  if (unseen.length) {
    var rows = unseen.map(function(n) {
      var eid  = n.id.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      var body = n.body.replace(/</g,'&lt;').replace(/>/g,'&gt;');
      var sid  = JSON.stringify(n.id);
      // AC-2: clases rsb-notif-type y rsb-notif-ts en cada card
      return '<div class="rsb-notif-item rsb-notif-item--unseen" data-id="' + eid + '">' +
        '<span class="rsb-notif-icon">' + n.icon + '</span>' +
        '<div class="rsb-notif-content">' +
          '<div class="rsb-notif-title">' + n.title + '</div>' +
          '<div class="rsb-notif-body">' + body + '</div>' +
          '<span class="rsb-notif-type rsb-notif-type--' + (n.type || 'info') + '">' + (n.type || '') + '</span>' +
        '</div>' +
        '<div class="rsb-notif-actions">' +
          '<span class="rsb-notif-ts">' + _fmtNotifTs(n.ts || Date.now()) + '</span>' +
          '<button class="rsb-notif-goto" onclick="event.stopPropagation();_notifGoto(' + sid + ')" title="Ir al \xEDtem">\u2192</button>' +
          '<button class="rsb-notif-dismiss" onclick="event.stopPropagation();markNotifRead(' + sid + ')" title="Marcar como le\xEDda">\u2713</button>' +
        '</div>' +
      '</div>';
    }).join('');

    var markAllBtn = unseen.length > 1
      ? '<button class="rsb-notif-mark-all" onclick="event.stopPropagation();markAllNotifsRead()">Marcar todas \u2713</button>'
      : '';

    var badgeHtml = ' <span class="rsb-notif-badge">' + unseen.length + '</span>';

    notifContent = '<div class="radar-sb-section-label rsb-notif-label">' +
      '<span>\uD83D\uDD14 Notificaciones' + badgeHtml + '</span>' +
      markAllBtn +
    '</div>' + rows;

  } else {
    // AC-6: sin notifs vivas → mostrar historial si existe
    var hist = _notifHistory();
    if (hist.length) {
      var histRows = hist.slice().reverse().map(function(entry) {
        var sevClass = 'rsb-notif-hist--' + (entry.severity || 'info');
        var text = (entry.text || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return '<div class="rsb-notif-hist-item ' + sevClass + '">' +
          '<span class="rsb-notif-type rsb-notif-type--' + (entry.type || 'info') + '">' + (entry.type || '') + '</span>' +
          '<span class="rsb-notif-hist-text">' + text + '</span>' +
          '<span class="rsb-notif-ts">' + _fmtNotifTs(entry.ts) + '</span>' +
        '</div>';
      }).join('');

      notifContent = '<div class="radar-sb-section-label rsb-notif-label">' +
        '<span>\uD83D\uDD14 Historial</span>' +
      '</div>' + histRows;

    } else {
      // AC-6: sin notifs vivas NI historial → empty state unificado
      notifContent = '<div class="rsb-notif-empty rsb-notif-empty--full">' +
        '<span class="rsb-notif-empty-icon">\u2713</span>' +
        '<span class="rsb-notif-empty-label">Todo en orden</span>' +
      '</div>';
    }
  }

  // Panel config colapsable — fuente de verdad única para umbrales
  var cfg = _notifConfig();
  var cfgRows = Object.keys(_NOTIF_DEFAULTS).map(function(key) {
    var def = cfg[key];
    var thrInput = (typeof def.threshold === 'number' && def.threshold > 0)
      ? '<input class="rsb-cfg-thr" type="number" min="1" max="365" value="' + def.threshold + '"' +
        (def.enabled ? '' : ' disabled') +
        ' onchange="_notifConfigSetThreshold(\''  + key + '\',this.value)" onclick="event.stopPropagation()">' +
        '<span class="rsb-cfg-thr-unit">d</span>'
      : '';
    return '<div class="rsb-cfg-row">' +
      '<label class="rsb-cfg-label">' + def.label + '</label>' +
      '<div class="rsb-cfg-controls">' +
        thrInput +
        '<input class="rsb-cfg-toggle" type="checkbox"' + (def.enabled ? ' checked' : '') +
          ' onchange="_notifConfigSetEnabled(\''  + key + '\',this.checked)" onclick="event.stopPropagation()">' +
      '</div>' +
    '</div>';
  }).join('');

  var cfgPanel = '<div class="rsb-cfg-section" id="rsb-cfg-section">' +
    '<button class="rsb-cfg-toggle-btn" onclick="_rsbToggleCfg(event)" aria-expanded="false" id="rsb-cfg-toggle-btn">' +
      '<span>\uD83D\uDD14 Configurar alertas</span>' +
      '<span class="rsb-cfg-arrow" id="rsb-cfg-arrow">\u25B8</span>' +
    '</button>' +
    '<div class="rsb-cfg-body rsb-cfg-body--hidden" id="rsb-cfg-body">' +
      cfgRows +
    '</div>' +
  '</div>';

  return '<div class="radar-sb-section rsb-notif-section">' +
    notifContent +
    cfgPanel +
  '</div>';
}

// R-202605-119: toggle del panel config en el Radar Sidebar
function _rsbToggleCfg(e) {
  if (e) e.stopPropagation();
  var body  = document.getElementById('rsb-cfg-body');
  var arrow = document.getElementById('rsb-cfg-arrow');
  var btn   = document.getElementById('rsb-cfg-toggle-btn');
  if (!body) return;
  var isHidden = body.classList.toggle('rsb-cfg-body--hidden');
  if (arrow) arrow.textContent = isHidden ? '\u25B8' : '\u25BE';
  if (btn)   btn.setAttribute('aria-expanded', String(!isHidden));
}

// R-202605-113: renderGlobalRadarSidebar — jerarquía, auto-hide Dock, cards por estado
// Grupos: En sesión → Disponibles → Agotadas (colapsadas por defecto)
// Eliminados: Sprint Activo · Top Pendientes
// Nuevos: timer en sesión, btn CKPT directo, Agotadas colapsables, notif oculta cuando count=0

function renderGlobalRadarSidebar() {
  const sidebar = document.getElementById('global-radar-sidebar');
  const container = document.getElementById('radar-sidebar-cards');
  if (!sidebar || !container) return;

  const active = (state.ais || []).filter(a => !a.archived);

  const interrupted = active.filter(a => a.interrupted);
  const inSession   = active.filter(a => !a.interrupted && _isInSession(a));
  // Disponibles — ordenadas por tiempo desde última sesión (más descansada primero)
  const available   = active
    .filter(a => a.status === 'available' && !a.interrupted && !_isInSession(a))
    .sort((a, b) => _hoyAvailableSince(a) - _hoyAvailableSince(b));
  // Agotadas — ordenadas por tiempo restante (la que se libera antes, primero)
  const exhausted   = active
    .filter(a => a.status === 'exhausted' && !a.interrupted)
    .sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b));

  // ── helpers ──────────────────────────────────────────────────────────────

  function _sessionElapsed(ai) {
    // Tiempo transcurrido desde el inicio de la sesión activa
    try {
      const timerData = JSON.parse(localStorage.getItem('session-timer-' + ai.id) || 'null');
      if (timerData && timerData.startEpoch) {
        const ms = Date.now() - timerData.startEpoch;
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return { label: `${m}m ${String(s).padStart(2,'0')}s`, ms };
      }
    } catch(e) {}
    // Fallback: hora de última sesión
    const sessions = getAISessions(ai.id);
    const last = sessions.length ? sessions[sessions.length - 1] : null;
    if (last && last.date) {
      const ms = Date.now() - new Date(last.date).getTime();
      if (ms > 0 && ms < 86400000) {
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return { label: `${m}m ${String(s).padStart(2,'0')}s`, ms };
      }
    }
    return null;
  }

  function _sessionTitle(ai) {
    try {
      const sessions = getAISessions(ai.id);
      const last = sessions.length ? sessions[sessions.length - 1] : null;
      return last && last.title ? last.title : '';
    } catch(e) { return ''; }
  }

  function _projPill(ai) {
    try {
      const aiSessions = getAISessions(ai.id);
      if (!aiSessions.length) return '';
      const lastSess = aiSessions[aiSessions.length - 1];
      const proj = lastSess && lastSess.projId
        ? (state.projects || []).find(p => p.id === lastSess.projId)
        : null;
      if (!proj) return '';
      const color = proj.color || '#7c6af7';
      return `<span class="rsb-proj-pill" style="--rsb-proj-color:${color}">${esc(proj.name)}</span>`;
    } catch(e) { return ''; }
  }

  // ── card builders ─────────────────────────────────────────────────────────

  function _buildSessionCard(ai, isInterrupted) {
    const elapsed = _sessionElapsed(ai);
    const sessionTitle = _sessionTitle(ai);
    const pill = _projPill(ai);

    const warnClass = elapsed && elapsed.ms > 3600000 ? ' rsb-elapsed-warn' : '';
    const cls = isInterrupted ? 'rsb-card interrupted-state' : 'rsb-card in-session-state';
    const badge = isInterrupted
      ? `<span class="rsb-status-badge rsb-status-interrupted">⚡ en curso</span>`
      : `<span class="rsb-status-badge rsb-status-session">● sesión</span>`;

    const quickBtn = `<button class="rsb-card-quick" onclick="event.stopPropagation();openQuickCapture('${ai.id}')" title="Sesión rápida">⚡</button>`;

    let sessionInfo = '';
    if (!isInterrupted) {
      const elapsedHtml = elapsed
        ? `<span class="rsb-session-elapsed${warnClass}" id="rsb-elapsed-${ai.id}">${elapsed.label}</span>`
        : '';
      const titleHtml = sessionTitle
        ? `<span class="rsb-session-title" id="rsb-session-title-${ai.id}">${esc(sessionTitle.substring(0, 28))}${sessionTitle.length > 28 ? '…' : ''}</span>`
        : '';
      sessionInfo = `<div class="rsb-card-session-info">${titleHtml}${elapsedHtml}</div>`;
    } else {
      sessionInfo = `<div class="rsb-interrupted-badge">⚡ Sesión en curso</div>`;
    }

    // Botón CKPT directo — un click, sin abrir detalle
    const ckptBtn = `<button class="rsb-ckpt-direct-btn" onclick="event.stopPropagation();showCheckpointPanel && showCheckpointPanel('${ai.id}'); navigateToCard('${ai.id}')">
      ⬡ checkpoint
    </button>`;

    return `<div class="${cls}" onclick="navigateToCard('${ai.id}')" id="rsb-card-${ai.id}">
      <div class="rsb-card-row">
        <div class="rsb-card-name" title="${esc(ai.name)}">${esc(ai.name)}</div>
        <div class="rsb-card-meta">${badge}${quickBtn}</div>
      </div>
      ${pill ? `<div class="rsb-card-proj">${pill}</div>` : ''}
      ${sessionInfo}
      ${ckptBtn}
    </div>`;
  }

  function _buildAvailableCard(ai) {
    const pill = _projPill(ai);
    let sinceLabel = '';
    if (ai.resetTime && ai.resetEpoch) {
      const epoch = new Date(ai.resetEpoch);
      const hh = String(epoch.getHours()).padStart(2,'0');
      const mm = String(epoch.getMinutes()).padStart(2,'0');
      sinceLabel = fmt12(`${hh}:${mm}`);
    } else {
      const aiSessions = getAISessions(ai.id);
      const last = aiSessions.length ? aiSessions[aiSessions.length - 1] : null;
      if (last && last.date) {
        const d = new Date(last.date);
        if (!isNaN(d)) {
          const hh = String(d.getHours()).padStart(2,'0');
          const mm = String(d.getMinutes()).padStart(2,'0');
          sinceLabel = fmt12(`${hh}:${mm}`);
        }
      }
    }
    const sinceSpan = sinceLabel
      ? `<span class="rsb-ckpt-since">desde ${sinceLabel}</span>`
      : `<span class="rsb-ckpt-since">disponible</span>`;

    return `<div class="rsb-card available" onclick="navigateToCard('${ai.id}')" id="rsb-card-${ai.id}">
      <div class="rsb-card-row">
        <div class="rsb-card-name" title="${esc(ai.name)}">${esc(ai.name)}</div>
        <div class="rsb-card-meta">
          <span class="rsb-status-badge rsb-status-available">🟢</span>
          <button class="rsb-card-quick" onclick="event.stopPropagation();openQuickCapture('${ai.id}')" title="Sesión rápida">⚡</button>
        </div>
      </div>
      ${pill ? `<div class="rsb-card-proj">${pill}</div>` : ''}
      <div class="rsb-card-body">
        <button class="rsb-ckpt-btn" onclick="event.stopPropagation();navigateToCard('${ai.id}')">
          + checkpoint ${sinceSpan}
        </button>
      </div>
    </div>`;
  }

  function _buildExhaustedCard(ai) {
    const cd = getCD(ai.resetTime, ai.resetEpoch);
    const resetLabel = ai.resetTime ? `hasta ${fmt12(ai.resetTime)}` : '';
    return `<div class="rsb-card exhausted rsb-compact" onclick="navigateToCard('${ai.id}')" id="rsb-card-${ai.id}">
      <div class="rsb-card-row">
        <div class="rsb-card-name" title="${esc(ai.name)}">${esc(ai.name)}</div>
        <div class="rsb-card-meta"><span class="rsb-status-badge rsb-status-exhausted">🔴</span></div>
      </div>
      <div class="rsb-card-body">
        <div class="rsb-countdown" id="rsb-cd-${ai.id}">${cd || '--:--:--'}</div>
        ${resetLabel ? `<div class="rsb-reset-label">${resetLabel}</div>` : ''}
      </div>
    </div>`;
  }

  // ── notificaciones (oculto cuando count = 0) ──────────────────────────────
  const notifSection = (() => {
    const notifHtml = _renderNotifSection();
    // Ocultar cuando no hay notificaciones sin leer
    const unseen = _computeNotifications().filter(n => !_notifReadSet().has(n.id)).length;
    if (!unseen) return '';
    return notifHtml;
  })();

  // ── construir HTML ─────────────────────────────────────────────────────────
  let html = notifSection;

  if (!active.length) {
    html = `<div class="rsb-empty-state">
      <div class="rsb-empty-icon">🤖</div>
      <div class="rsb-empty-title">Sin IAs registradas</div>
      <div class="rsb-empty-hint">Agrega una IA para comenzar a registrar sesiones.</div>
      <button class="rsb-empty-btn" onclick="openAddAI()">+ Nueva IA</button>
    </div>`;
  } else {
    // Grupo 1: En sesión (interrupted + inSession fusionados — orden fijo: interrupted primero)
    const enSesionAll = [...interrupted, ...inSession];
    if (enSesionAll.length) {
      const cards = [
        ...interrupted.map(a => _buildSessionCard(a, true)),
        ...inSession.map(a => _buildSessionCard(a, false))
      ].join('');
      html += `<div class="radar-sb-section">
        <div class="radar-sb-section-label">● En sesión (${enSesionAll.length})</div>
        <div class="rsb-section-body">${cards}</div>
      </div>`;
    }

    // Grupo 2: Disponibles
    if (available.length) {
      html += `<div class="radar-sb-section">
        <div class="radar-sb-section-label">🟢 Disponibles (${available.length})</div>
        <div class="rsb-section-body">${available.map(a => _buildAvailableCard(a)).join('')}</div>
      </div>`;
    }

    // Grupo 3: Agotadas — colapsado por defecto
    if (exhausted.length) {
      const nextMs = _hoyMsUntilReset(exhausted[0]);
      const nextMin = nextMs > 0 ? Math.ceil(nextMs / 60000) : 0;
      const metaLabel = nextMin > 0 ? `próxima en ${nextMin}min` : '';
      const isCollapsed = localStorage.getItem('rsb-agotadas-collapsed') !== '0';
      const colClass = isCollapsed ? ' rsb-section-collapsed' : '';
      html += `<div class="radar-sb-section${colClass}" id="rsb-group-agotadas">
        <div class="radar-sb-section-label rsb-collapsible" onclick="_rsbToggleAgotadas()">
          <span class="rsb-section-caret">▾</span>
          <span class="rsb-section-label-text">🔴 Agotadas (${exhausted.length})${metaLabel ? ` · ${metaLabel}` : ''}</span>
        </div>
        <div class="rsb-section-body">${exhausted.map(a => _buildExhaustedCard(a)).join('')}</div>
      </div>`;
    }
  }

  container.innerHTML = html;

  // Header — contadores — R-202605-138: contadores migrados a fila 2
  const titleEl  = sidebar.querySelector('.radar-sidebar-title');
  const row2El   = sidebar.querySelector('.rsb-header-row2');
  if (titleEl) {
    const unseen = _computeNotifications().filter(n => !_notifReadSet().has(n.id)).length;
    const notifBadge = unseen ? ` <span class="rsb-notif-hdr-badge">${unseen}</span>` : '';
    // Fila 1: solo título + badge de notificaciones — sin contadores
    titleEl.innerHTML = `Centro de notificaciones${notifBadge}`;
  }
  if (row2El) {
    // Fila 2: contadores de disponibilidad — se ocultan si valor es 0
    const sessionCount  = interrupted.length + inSession.length;
    const counts = [
      sessionCount   ? `<span class="rsb-hdr-count rsb-hdr-session"><span class="rsb-hdr-dot"></span>${sessionCount}</span>`   : '',
      available.length  ? `<span class="rsb-hdr-count rsb-hdr-available"><span class="rsb-hdr-dot"></span>${available.length}</span>`  : '',
      exhausted.length  ? `<span class="rsb-hdr-count rsb-hdr-exhausted"><span class="rsb-hdr-dot"></span>${exhausted.length}</span>`  : '',
    ].filter(Boolean).join('');
    row2El.innerHTML = counts ? `<span class="rsb-hdr-counts">${counts}</span>` : '';
  }

  // CSS Purity: sprint bar pct via custom property
  container.querySelectorAll('.rsb-sprint-bar[data-pct]').forEach(el => {
    el.style.setProperty('--rsb-pct', el.dataset.pct + '%');
  });

  // Restaurar estado collapsed
  const _sbSaved = localStorage.getItem('radar-sidebar-collapsed');
  if (_sbSaved === '1') {
    sidebar.classList.add('collapsed');
    document.body.classList.remove('radar-sb-open');
    document.body.classList.add('radar-sb-collapsed');
  } else {
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('radar-sb-collapsed');
    document.body.classList.add('radar-sb-open');
  }

  updateTabNotifBadges();
  if (_rsbSearchQuery) rsbFilterAIs(_rsbSearchQuery, true);
}

// Toggle sección Agotadas (colapsable por defecto)
function _rsbToggleAgotadas() {
  const group = document.getElementById('rsb-group-agotadas');
  if (!group) return;
  const isNowCollapsed = group.classList.toggle('rsb-section-collapsed');
  localStorage.setItem('rsb-agotadas-collapsed', isNowCollapsed ? '1' : '0');
}

// RADAR SEARCH — Nova UX
let _rsbSearchQuery = '';

function rsbFilterAIs(query, silent) {
  _rsbSearchQuery = (query || '').trim();
  const q = _rsbSearchQuery.toLowerCase();
  const wrap = document.getElementById('rsb-search-wrap');
  const container = document.getElementById('radar-sidebar-cards');
  if (!container) return;

  if (wrap) wrap.classList.toggle('rsb-has-value', q.length > 0);

  const cards = container.querySelectorAll('.rsb-card');
  let visibleCount = 0;

  cards.forEach(card => {
    const nameEl = card.querySelector('.rsb-card-name');
    const name = (nameEl ? nameEl.textContent : card.textContent).toLowerCase();
    const match = !q || name.includes(q);
    card.classList.toggle('rsb-hidden', !match);
    if (match) visibleCount++;
  });

  // Ocultar secciones cuyos cards estén todos hidden
  container.querySelectorAll('.radar-sb-section').forEach(section => {
    const anyVisible = Array.from(section.querySelectorAll('.rsb-card'))
      .some(c => !c.classList.contains('rsb-hidden'));
    section.classList.toggle('rsb-hidden', !anyVisible);
  });

  // Empty state de búsqueda
  let noResults = container.querySelector('.rsb-search-no-results');
  if (q.length > 0 && visibleCount === 0) {
    if (!noResults) {
      noResults = document.createElement('p');
      noResults.className = 'rsb-search-no-results';
      noResults.textContent = 'Sin resultados';
      container.appendChild(noResults);
    }
  } else if (noResults) {
    noResults.remove();
  }

  // Focus solo si viene de interacción directa (no de re-render)
  if (!silent) {
    const input = document.getElementById('rsb-search-input');
    if (input) input.focus();
  }
}

function rsbClearSearch() {
  const input = document.getElementById('rsb-search-input');
  if (input) input.value = '';
  rsbFilterAIs('');
}
// END RADAR SEARCH

// R-202605-113: Pin toggle — desactiva auto-hide cuando está fijado
function rsbTogglePin() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  const isPinned = sidebar.classList.toggle('rsb-pinned');
  localStorage.setItem('rsb-pinned', isPinned ? '1' : '0');
  const btn = document.getElementById('rsb-pin-btn');
  if (btn) btn.title = isPinned ? 'Desfijar sidebar' : 'Fijar sidebar';
}

function _rsbIsPinned() {
  return localStorage.getItem('rsb-pinned') === '1';
}

// T-202604-254: Toggle sidebar Radar
function toggleRadarSidebar() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  const isCollapsed = sidebar.classList.toggle('collapsed');
  document.body.classList.toggle('radar-sb-collapsed', isCollapsed);
  document.body.classList.toggle('radar-sb-open', !isCollapsed);
  localStorage.setItem('radar-sidebar-collapsed', isCollapsed ? '1' : '0');
  // T-202604-300: desplazar toast-stack cuando sidebar está expandida (284px + 16px gap)
  if (isCollapsed) {
    document.documentElement.style.removeProperty('--toast-right-offset');
  } else {
    document.documentElement.style.setProperty('--toast-right-offset', '300px');
  }
}

// T-202604-254: Init sidebar state from localStorage
function _initRadarSidebarState() {
  const sidebar = document.getElementById('global-radar-sidebar');
  if (!sidebar) return;
  const saved = localStorage.getItem('radar-sidebar-collapsed');
  if (saved === '1') {
    sidebar.classList.add('collapsed');
    document.body.classList.remove('radar-sb-open');
    document.body.classList.add('radar-sb-collapsed');
    document.documentElement.style.removeProperty('--toast-right-offset');
  } else {
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('radar-sb-collapsed');
    document.body.classList.add('radar-sb-open');
    // T-202604-300: sidebar expandida al cargar → desplazar toast-stack
    document.documentElement.style.setProperty('--toast-right-offset', '300px');
  }

  // Restaurar estado pin — reutiliza sidebar ya declarado arriba
  if (localStorage.getItem('rsb-pinned') === '1') {
    sidebar.classList.add('rsb-pinned');
    const btn = document.getElementById('rsb-pin-btn');
    if (btn) btn.title = 'Desfijar sidebar';
  }

  // R-202605-113: Auto-hide — colapsa si el cursor sale y no regresa en 2.5s
  // Usa toggleRadarSidebar() para mantener estado DOM + localStorage consistentes
  if (!window._rsbAutoHideInited) {
    window._rsbAutoHideInited = true;
    let _rsbHideTimer = null;

    sidebar.addEventListener('mouseleave', () => {
      if (sidebar.classList.contains('collapsed')) return;
      if (_rsbIsPinned()) return;
      _rsbHideTimer = setTimeout(() => {
        if (!sidebar.classList.contains('collapsed') && !_rsbIsPinned()) {
          toggleRadarSidebar();
        }
      }, 2500);
    });

    sidebar.addEventListener('mouseenter', () => {
      if (_rsbHideTimer) { clearTimeout(_rsbHideTimer); _rsbHideTimer = null; }
      if (sidebar.classList.contains('collapsed')) {
        toggleRadarSidebar();
      }
    });
  }
}

// T-097: Colapsar/expandir todas las cards activas
function toggleCollapseAll() {
  const active = state.ais.filter(a => !a.archived);
  const allCollapsed = active.every(a => !a.showAll);
  active.forEach(a => { a.showAll = allCollapsed; });
  save(); render();
}

let _trackerSelectedId = null;

// ── R-202604-078: Vista Por IA / Historial ──────────────────────────────
let _trackerCurrentView = 'poria'; // 'poria' | 'historial'
let _trackerViewProjFilter = '';

function _trackerSetView(view) {
  _trackerCurrentView = view;

  // toggle buttons
  const btnPoria    = document.getElementById('tvh-btn-poria');
  const btnHistorial = document.getElementById('tvh-btn-historial');
  if (btnPoria)    { btnPoria.classList.toggle('active', view === 'poria');    btnPoria.setAttribute('aria-pressed', view === 'poria' ? 'true' : 'false'); }
  if (btnHistorial) { btnHistorial.classList.toggle('active', view === 'historial'); btnHistorial.setAttribute('aria-pressed', view === 'historial' ? 'true' : 'false'); }

  // panel classes
  const tab = document.getElementById('tab-tracker');
  if (!tab) return;
  tab.classList.toggle('tracker-view--poria',    view === 'poria');
  tab.classList.toggle('tracker-view--historial', view === 'historial');

  // populate project selector cada vez que cambia la vista
  _trackerViewPopulateProjects();

  if (view === 'historial') {
    // Vista B: render col 1 agrupada por día + col 2 global hist
    _trackerHistDayRender();
    if (typeof _trackerRenderHist === 'function') _trackerRenderHist();
  } else if (view === 'poria') {
    // Vista A: persistencia — si hay sesión seleccionada, aterrizar en su IA
    if (_trackerHistSelectedSessId) {
      const allSess = (typeof getAllSessions === 'function') ? getAllSessions() : [];
      const sess = allSess.find(s => s.id === _trackerHistSelectedSessId);
      if (sess && sess.aiId) {
        navigateToCard(sess.aiId);
        return;
      }
    }
    // fallback: re-render normal + mini-hist
    if (typeof render === 'function') render();
    if (typeof _trackerRenderMiniHist === 'function') _trackerRenderMiniHist(_trackerSelectedId);
  }
}

function _trackerViewPopulateProjects() {
  const sel = document.getElementById('tvh-proj-select');
  if (!sel) return;
  const projects = (state.projects || []).filter(p => p.status !== 'paused');
  const current = _trackerViewProjFilter;
  sel.innerHTML = '<option value="">Todos los proyectos</option>' +
    projects.map(p => `<option value="${esc(p.id)}"${p.id === current ? ' selected' : ''}>${esc((p.icon || '📁') + ' ' + p.name)}</option>`).join('');
  // B-202605-269: ocultar el select si solo hay 0 o 1 proyecto — no aporta filtrado útil
  sel.classList.toggle('tvh-proj-single', projects.length <= 1);
}

function _trackerViewProjChange() {
  const sel = document.getElementById('tvh-proj-select');
  _trackerViewProjFilter = sel ? sel.value : '';
  // sincronizar con filtro de historial col 2 existente
  _trackerHistProjFilter = _trackerViewProjFilter;
  if (_trackerCurrentView === 'poria') {
    if (typeof _trackerRenderMiniHist === 'function') _trackerRenderMiniHist(_trackerSelectedId);
  } else {
    if (typeof _trackerRenderHist === 'function') _trackerRenderHist();
  }
  // re-render col 1 Vista B si está activa
  if (_trackerCurrentView === 'historial') _trackerHistDayRender();
}

// ── END R-202604-078 Entrega 1 ──────────────────────────────────────────

// ── R-202604-078 Entrega 2: Vista Historial — col 1 agrupada por día ───

function _trackerHistDayRender() {
  const bodyEl = document.getElementById('tvh-hist-col1-body');
  if (!bodyEl) return;

  const periodSel = document.getElementById('tvh-hist-period');
  const days = periodSel ? parseInt(periodSel.value, 10) : 7;

  let allSessions = (typeof getAllSessions === 'function') ? getAllSessions() : [];

  // filtro por proyecto (sincronizado con tvh-proj-select)
  if (_trackerViewProjFilter) {
    allSessions = allSessions.filter(s => s.projectId === _trackerViewProjFilter);
  }

  // filtro por período
  if (days > 0) {
    const cutoff = Date.now() - days * 86400000;
    allSessions = allSessions.filter(s => {
      const ts = s.updatedAt || s.createdAt || 0;
      return ts >= cutoff;
    });
  }

  // más reciente primero
  const sorted = [...allSessions].sort((a, b) => {
    const ta = a.updatedAt || a.createdAt || 0;
    const tb = b.updatedAt || b.createdAt || 0;
    return tb - ta;
  });

  if (!sorted.length) {
    bodyEl.innerHTML = `<div class="tvh-hist-empty"><span class="tvh-hist-empty-icon">📋</span><span>Sin sesiones en este período</span></div>`;
    return;
  }

  // Agrupar por fecha YYYY-MM-DD
  const groups = [];
  const groupMap = {};
  sorted.forEach(s => {
    const ts = s.updatedAt || s.createdAt || 0;
    const dateKey = ts ? new Date(ts).toISOString().slice(0, 10) : 'sin-fecha';
    if (!groupMap[dateKey]) {
      groupMap[dateKey] = [];
      groups.push(dateKey);
    }
    groupMap[dateKey].push(s);
  });

  const today    = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  bodyEl.innerHTML = groups.map(dateKey => {
    let dayLabel = dateKey;
    if (dateKey === today)     dayLabel = 'Hoy';
    else if (dateKey === yesterday) dayLabel = 'Ayer';
    else {
      // format as "lun 28 abr"
      try {
        const d = new Date(dateKey + 'T12:00:00');
        dayLabel = d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
      } catch(_) { dayLabel = dateKey; }
    }

    const rows = groupMap[dateKey].map(s => {
      const ai = (state.ais || []).find(a => a.id === s.aiId);
      const aiName = ai ? esc(ai.name) : '—';
      const isActive = s.id === _trackerHistSelectedSessId;
      return `<div class="tvh-hist-day-row${isActive ? ' active' : ''}"
          data-sess-id="${s.id}"
          data-ai-id="${s.aiId}"
          onclick="_trackerHistDaySelect('${s.id}','${s.aiId}')">
        <span class="tvh-hist-day-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <span class="tvh-hist-day-row-ai">${aiName}</span>
      </div>`;
    }).join('');

    return `<div class="tvh-hist-day-group">
      <div class="tvh-hist-day-label">${dayLabel}<span class="tvh-hist-day-count">${groupMap[dateKey].length}</span></div>
      <div class="tvh-hist-day-rows">${rows}</div>
    </div>`;
  }).join('');
}

// Seleccionar sesión desde col 1 Vista B
function _trackerHistDaySelect(sessId, aiId) {
  _trackerHistSelectedSessId = sessId;

  // actualizar estado activo en col 1
  document.querySelectorAll('.tvh-hist-day-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // actualizar estado activo en col 2 (hist panel)
  document.querySelectorAll('.tracker-hist-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // col 2 en Vista B: mostrar preview de sesión via openDetail si disponible
  if (typeof openDetail === 'function') {
    openDetail(aiId, sessId);
  }

  // mobile: navegar a col 2
  if (window.innerWidth < 600 && typeof _trackerSwitchCol === 'function') {
    _trackerSwitchCol('hist');
  }
}

// ── END R-202604-078 Entrega 2 ──────────────────────────────────────────

// ── R-202604-078 Fase 2: Mini-historial de IA en Col2 (modo Por IA) ─────

// Render Col2 en modo Por IA: lista de sesiones de la IA seleccionada
function _trackerRenderMiniHist(aiId) {
  const panelEl  = document.getElementById('tracker-mini-hist-panel');
  const listEl   = document.getElementById('tracker-mini-hist-list');
  const titleEl  = document.getElementById('tracker-mini-hist-title');
  const countEl  = document.getElementById('tracker-mini-hist-count');
  const emptyEl  = document.getElementById('tracker-mini-hist-empty');
  if (!listEl) return;

  if (!aiId) {
    // T-202605-470: sin IA — título neutral
    if (titleEl) titleEl.textContent = 'Sesiones';
    if (countEl) { countEl.textContent = ''; countEl.classList.add('hidden'); }
    const lastMetaEl = document.getElementById('tracker-mini-hist-last');
    if (lastMetaEl) lastMetaEl.textContent = '';
    listEl.innerHTML = '<div class="tracker-mini-hist-empty"><span class="tracker-mini-hist-empty-icon">📋</span><span>Selecciona una IA</span></div>';
    return;
  }

  const allSessions = typeof getAllSessions === 'function' ? getAllSessions() : [];
  const aiSessions  = allSessions.filter(s => s.aiId === aiId);

  // R-202605-116 AC: excluir sesión en curso del mini historial
  const currentSess = (typeof _getCurrentSession === 'function') ? _getCurrentSession(aiId) : null;
  const pastSessions = currentSess
    ? aiSessions.filter(s => s.id !== currentSess.id)
    : aiSessions;

  // R-202605-116 AC: filtro de proyecto — usa selector global del tracker view
  const projFilter = _trackerViewProjFilter;
  const filtered = projFilter
    ? pastSessions.filter(s => s.projectId === projFilter)
    : pastSessions;

  // más reciente primero
  const sorted = [...filtered].reverse();

  // T-202605-470: header muestra conteo + último acceso — el nombre de la IA ya es visible en col 1
  const totalCount = aiSessions.length;
  if (titleEl) {
    titleEl.textContent = `${totalCount} sesión${totalCount !== 1 ? 'es' : ''}`;
  }
  const lastMetaEl = document.getElementById('tracker-mini-hist-last');
  if (lastMetaEl) {
    const lastSess = aiSessions.length ? aiSessions[aiSessions.length - 1] : null;
    lastMetaEl.textContent = lastSess
      ? ('Último: ' + ((typeof relDate === 'function' && lastSess.date) ? relDate(lastSess.date) : (lastSess.dateShort || lastSess.date || '')))
      : '';
  }

  if (countEl) {
    // Mostrar filtered count solo cuando hay filtro de proyecto activo
    if (projFilter && sorted.length !== totalCount) {
      countEl.textContent = sorted.length + ' filtradas';
      countEl.classList.remove('hidden');
    } else {
      countEl.textContent = '';
      countEl.classList.add('hidden');
    }
  }

  if (!sorted.length) {
    // T-202605-473: mensajes diferenciados — filtro activo vs sin sesiones reales
    const emptyMsg = projFilter
      ? 'Sin sesiones para este filtro'
      : (aiSessions.length === 0 ? 'Esta IA no tiene sesiones registradas' : 'Sin sesiones');
    listEl.innerHTML = `<div class="tracker-mini-hist-empty"><span class="tracker-mini-hist-empty-icon">📋</span><span>${emptyMsg}</span></div>`;
    return;
  }

  const projTracker = typeof getActiveTracker === 'function' ? getActiveTracker() : { items: [] };

  // T-202605-488: helper — timestamp relativo de alta precisión
  const _sessRelTs = (s) => {
    const ts = s.updatedAt || s.createdAt || 0;
    if (!ts) return (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '');
    const diffMs  = Date.now() - ts;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH   = Math.floor(diffMs / 3600000);
    const diffD   = Math.floor(diffMs / 86400000);
    if (diffMin < 60)  return diffMin <= 1 ? 'ahora' : `hace ${diffMin}min`;
    if (diffH   < 24)  return `hace ${diffH}h`;
    if (diffD   === 1) return 'ayer';
    if (diffD   < 7) {
      try {
        return new Date(ts).toLocaleDateString('es', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
      } catch(_) { return `hace ${diffD}d`; }
    }
    try {
      return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' });
    } catch(_) { return (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || ''); }
  };

  // T-202605-488: agrupar en Hoy / Esta semana / Anteriores
  const _nowMs    = Date.now();
  const _todayKey = new Date().toISOString().slice(0, 10);
  const _weekAgo  = _nowMs - 7 * 86400000;
  const _sessGroup = (s) => {
    const ts = s.updatedAt || s.createdAt || 0;
    if (!ts) return 'anteriores';
    const dateKey = new Date(ts).toISOString().slice(0, 10);
    if (dateKey === _todayKey) return 'hoy';
    if (ts >= _weekAgo)       return 'semana';
    return 'anteriores';
  };
  const _groupLabel = { hoy: 'Hoy', semana: 'Esta semana', anteriores: 'Anteriores' };
  const _groupOrder = ['hoy', 'semana', 'anteriores'];

  const _grouped = { hoy: [], semana: [], anteriores: [] };
  sorted.forEach(s => _grouped[_sessGroup(s)].push(s));

  // sesión en curso — para marcar in-progress
  const _inProgressSess = (typeof _getCurrentSession === 'function') ? _getCurrentSession(aiId) : null;

  const _renderRow = (s) => {
    const proj     = s.projectId ? (typeof getProjectById === 'function' ? getProjectById(s.projectId) : null) : null;
    const isActive = s.id === _trackerHistSelectedSessId;
    const isInProg = _inProgressSess && s.id === _inProgressSess.id;

    // badge de ítems vinculados — T-202605-488
    const linkedItems = projTracker.items.filter(x => x.sessionId === s.id);
    const badgeHtml = linkedItems.length
      ? `<span class="sess-items-badge">${linkedItems.length}</span>`
      : '';

    // pill de proyecto con nombre — T-202605-488
    const projPill = proj
      ? `<span class="sess-proj-pill">${esc(proj.name || proj.icon || '📁')}</span>`
      : '';

    // timestamp relativo de alta precisión — T-202605-488
    const tsHtml = `<span class="sess-timestamp">${_sessRelTs(s)}</span>`;

    // separador meta (·) solo si hay proyecto
    const metaSep = proj ? `<span class="sess-meta-sep">·</span>` : '';

    // indicadores secundarios (sin cambio)
    const starInd   = s.starred      ? `<span class="tracker-mini-hist-ind" title="Destacada">⭐</span>` : '';
    const reviewInd = s.inReview     ? `<span class="tracker-mini-hist-ind" title="En revisión">🔍</span>` : '';

    const rowCls = [
      'tracker-mini-hist-row',
      'sess-row',
      isActive  ? 'active'            : '',
      isInProg  ? 'sess-row--in-progress' : ''
    ].filter(Boolean).join(' ');

    return `<div class="${rowCls}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        onclick="_trackerMiniHistSelect('${s.id}','${s.aiId}')">
      <div class="sess-row-top">
        <span class="sess-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        ${badgeHtml}
      </div>
      <div class="sess-row-bottom">
        ${projPill}${metaSep}${tsHtml}
        ${starInd}${reviewInd}
      </div>
    </div>`;
  };

  listEl.innerHTML = _groupOrder
    .filter(g => _grouped[g].length > 0)
    .map(g =>
      `<div class="sess-group-sep">${_groupLabel[g]}</div>` +
      _grouped[g].map(_renderRow).join('')
    ).join('');

  // Auto-seleccionar la sesión más reciente si no hay ninguna seleccionada —
  // Col3 nunca queda vacío al cambiar de IA
  const latestSess = sorted[0];
  if (latestSess && !_trackerHistSelectedSessId) {
    _trackerHistSelectedSessId = latestSess.id;
    const firstRow = listEl.querySelector('.tracker-mini-hist-row');
    if (firstRow) firstRow.classList.add('active');
    if (typeof openDetail === 'function') openDetail(latestSess.aiId, latestSess.id);
  }

  // T-202605-471: scroll al row activo para que siempre quede visible
  requestAnimationFrame(() => {
    const activeRow = listEl.querySelector('.tracker-mini-hist-row.active');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

// Seleccionar sesión desde mini-hist (Col2 modo Por IA) → Col3 preview
function _trackerMiniHistSelect(sessId, aiId) {
  _trackerHistSelectedSessId = sessId;

  // resaltar en Col2
  document.querySelectorAll('.tracker-mini-hist-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });

  // Col3: preview de sesión via openDetail
  if (typeof openDetail === 'function') {
    openDetail(aiId, sessId);
  }

  // mobile: navegar a col 3
  if (window.innerWidth < 900 && typeof _trackerSwitchCol === 'function') {
    _trackerSwitchCol('items');
  }
}

// ── END R-202604-078 Fase 2 ──────────────────────────────────────────────

// ── R-202605-116: Card sesión en curso — col 1, debajo del card IA ──────

function _getCurrentSession(aiId) {
  const allSess = (typeof getAllSessions === 'function') ? getAllSessions() : [];
  const aiSess  = allSess.filter(s => s.aiId === aiId);
  if (!aiSess.length) return null;
  const last = aiSess.reduce((a, b) =>
    (parseInt(b.id) || 0) > (parseInt(a.id) || 0) ? b : a
  );
  if (last && !last.resetAt && !last.quickCapture) return last;
  return null;
}

function _buildCurrentSessionCard(aiId) {
  const currentSess = _getCurrentSession(aiId);
  if (!currentSess) return null;

  const allSess   = (typeof getAllSessions === 'function') ? getAllSessions() : [];
  const aiSess    = allSess.filter(s => s.aiId === aiId);
  const sessIndex = aiSess.findIndex(s => s.id === currentSess.id);

  const continuousSess = [];
  for (let i = sessIndex; i >= 0; i--) {
    const s = aiSess[i];
    if (s.quickCapture) break;
    if (s.resetAt && i < sessIndex) break;
    continuousSess.push(s);
  }
  const shown = continuousSess.slice(0, 3);
  const total = continuousSess.length;

  const dateLabel = (typeof relDate === 'function' && currentSess.date)
    ? relDate(currentSess.date)
    : (currentSess.dateShort || '');

  const sessionRows = shown.map((s, idx) => {
    const isLatest = idx === 0;
    const summaryHtml = isLatest && s.summary
      ? `<div class="cscard-row-summary">${esc(s.summary.slice(0, 160))}${s.summary.length > 160 ? '…' : ''}</div>`
      : '';
    const refPills = (s.trackerRefs || []).slice(0, 4).map(code => {
      const t = (code[0] || '').toUpperCase();
      return `<span class="cscard-ref-pill cscard-ref-pill--${t.toLowerCase()}">${esc(code)}</span>`;
    }).join('');
    const latestCls = isLatest ? ' cscard-row--latest' : '';
    return `<div class="cscard-row${latestCls}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        onclick="_trackerMiniHistSelect('${s.id}','${s.aiId}')">
      <div class="cscard-row-top">
        <span class="cscard-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <span class="cscard-row-date">${isLatest ? dateLabel : ''}</span>
      </div>
      ${summaryHtml}
      ${refPills ? `<div class="cscard-row-refs">${refPills}</div>` : ''}
    </div>`;
  }).join('');

  const moreHtml = total > 3
    ? `<div class="cscard-more">+ ${total - 3} checkpoint${total - 3 !== 1 ? 's' : ''} anteriores</div>`
    : '';

  const el = document.createElement('div');
  el.className = 'current-session-card';
  el.id = 'current-session-card-' + aiId;
  el.innerHTML = `
    <div class="cscard-header">
      <span class="cscard-dot"></span>
      <span class="cscard-label">Sesión en curso</span>
      <span class="cscard-timer" id="cscard-timer-${aiId}"></span>
    </div>
    <div class="cscard-rows">
      ${sessionRows}
      ${moreHtml}
    </div>`;

  return el;
}

// ── END R-202605-116 ─────────────────────────────────────────────────────

function selectTrackerAI(aiId) {
  // T-202604-373: skeleton rows en historial al cambiar de IA
  const _prevCard = _trackerSelectedId ? document.getElementById('card-' + _trackerSelectedId) : null;
  if (_prevCard) {
    const _prevList = _prevCard.querySelector('.sess-list');
    if (_prevList) {
      _prevList.innerHTML = '<div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div>';
    }
  }
  // Fase 2: resetear sesión seleccionada al cambiar de IA — mini-hist auto-selecciona la más reciente
  if (_trackerSelectedId !== aiId) _trackerHistSelectedSessId = null;
  _trackerSelectedId = aiId;
  if (typeof closeLogCard === 'function') closeLogCard();
  // R-202604-061 AC-5: try-catch defensivo — skeleton siempre se limpia
  try {
    render();
    // R-202604-061 AC-06: fade-in del panel de detalle al cambiar selección
    requestAnimationFrame(() => {
      const _newCard = document.getElementById('card-' + aiId);
      if (_newCard) {
        _newCard.classList.remove('detail-fade-in');
        void _newCard.offsetWidth; // force reflow
        _newCard.classList.add('detail-fade-in');
      }
    });
  } catch(e) {
    // skeleton cleanup garantizado aunque render falle
    const _fallbackCard = _prevCard || (document.getElementById('card-' + aiId));
    if (_fallbackCard) {
      const _fl = _fallbackCard.querySelector('.sess-list');
      if (_fl && _fl.querySelector('.skel-row')) _fl.innerHTML = '';
    }
    console.error('render() error in selectTrackerAI:', e);
  }
  _scrollToCard(aiId);
  // T-202605-446: iniciar/retomar cronómetro al seleccionar IA
  startSessionTimer(aiId);
  // focus textarea si disponible
  setTimeout(() => {
    const ta = document.getElementById('ta-' + aiId);
    if (ta) { ta.focus(); enterFocusMode(aiId); }
  }, 80);
}

function _renderTrackerSidebar() {
  const nonArchived = state.ais.filter(ai => !ai.archived);
  const inSession = nonArchived.filter(ai => ai.status !== 'exhausted' && !ai.interrupted && _isInSession(ai));
  const available = nonArchived.filter(ai => ai.status !== 'exhausted' && !_isInSession(ai));
  const exhausted = nonArchived.filter(ai => ai.status === 'exhausted');
  const archived  = state.ais.filter(ai => ai.archived);

  const mkRow = (ai, forceInSession = false) => {
    const sel = _trackerSelectedId === ai.id ? ' selected' : '';
    const dot = ai.status === 'exhausted' ? 'exhausted'
              : ai.interrupted            ? 'interrupted'
              : forceInSession            ? 'insession'
              : 'available';
    // countdown para agotadas
    let cd = '';
    if (ai.status === 'exhausted' && ai.resetTime) {
      const [hh, mm] = ai.resetTime.split(':').map(Number);
      const now = new Date();
      const reset = new Date(now); reset.setHours(hh, mm, 0, 0);
      if (reset <= now) reset.setDate(reset.getDate() + 1);
      const diff = Math.max(0, Math.round((reset - now) / 60000));
      const h = Math.floor(diff / 60), m = diff % 60;
      cd = `<span class="tsb-ai-cd">${h}h${String(m).padStart(2,'0')}</span>`;
    }
    // T-202604-206: info secundaria — N sesiones · hace X
    const _aiSess = getAISessions(ai.id);
    const _sessCount = _aiSess.length;
    const _lastSess = _aiSess.length ? _aiSess[_aiSess.length - 1] : null;
    const _lastDate = _lastSess ? (_lastSess.date || _lastSess.dateShort || '') : '';
    const _rel = _lastDate && typeof relDate === 'function' ? relDate(_lastDate) : '';
    const _meta = _sessCount
      ? `<span class="tsb-ai-meta">${_sessCount} ses${_rel ? ' · ' + _rel : ''}</span>`
      : '';
    return `<div class="tsb-ai-row${sel}" onclick="selectTrackerAI('${ai.id}')" id="tsb-row-${ai.id}">
      <span class="tsb-ai-dot ${dot}"></span>
      <span class="tsb-ai-name">${esc(ai.name)}</span>
      ${_meta}
      ${cd}
    </div>`;
  };

  const isEl = document.getElementById('tsb-insession');
  const avEl = document.getElementById('tsb-available');
  const exEl = document.getElementById('tsb-exhausted');
  if (!avEl || !exEl) return;

  if (!state.ais.length) {
    if (isEl) isEl.innerHTML = '';
    avEl.innerHTML = `<div class="tsb-empty-hint">Sin IAs</div>`;
    exEl.innerHTML = '';
    return;
  }

  // En curso — ocultar sección si vacía
  if (isEl) {
    const isSection = isEl.closest('.tracker-sidebar-section');
    if (inSession.length) {
      isEl.innerHTML = inSession.map(ai => mkRow(ai, true)).join('');
      if (isSection) isSection.classList.remove('hidden');
    } else {
      isEl.innerHTML = '';
      if (isSection) isSection.classList.add('hidden');
    }
  }

  avEl.innerHTML = available.length
    ? available.map(ai => mkRow(ai)).join('')
    : `<div class="tsb-empty-hint">—</div>`;

  let exHtml = exhausted.map(ai => mkRow(ai)).join('');
  if (archived.length) {
    const isOpen = localStorage.getItem('archived-open') === '1';
    exHtml += `<div class="tsb-archived-toggle" onclick="this.classList.toggle('open');localStorage.setItem('archived-open',this.classList.contains('open')?'1':'0');_renderTrackerSidebar()">
      ${isOpen ? '▼' : '▶'} Archivadas (${archived.length})</div>`;
    if (isOpen) exHtml += archived.map(ai => mkRow(ai)).join('');
  }
  exEl.innerHTML = exHtml || `<div class="tsb-empty-hint">—</div>`;

  // arrancar ticker dinámico si hay agotadas con resetTime
  if (exhausted.some(ai => ai.resetTime)) _startSidebarTicker();
  else _stopSidebarTicker();
}

// ══════════════════════════════════════════════════════════════════════════════
// S-17: T-202605-446 · Cronómetro de sesión — card IA activa
// ══════════════════════════════════════════════════════════════════════════════

const _TIMER_KEY_PREFIX = 'ai-tracker-session-timer-';
let _timerIntervalId = null;

function _timerKey(aiId) { return _TIMER_KEY_PREFIX + aiId; }

function _getTimerData(aiId) {
  try {
    const raw = localStorage.getItem(_timerKey(aiId));
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function _setTimerData(aiId, data) {
  try { localStorage.setItem(_timerKey(aiId), JSON.stringify(data)); } catch(e) {}
}

function _clearTimerData(aiId) {
  try { localStorage.removeItem(_timerKey(aiId)); } catch(e) {}
}

function _timerIsActive(aiId) {
  const d = _getTimerData(aiId);
  return !!(d && d.running);
}

// Llamado al guardar sesión — detiene cronómetro y retorna tiempo total en ms
function stopSessionTimer(aiId) {
  const d = _getTimerData(aiId);
  if (!d) return 0;
  const elapsed = d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0);
  _setTimerData(aiId, { running: false, elapsed, startEpoch: null });
  _refreshTimerTick();
  return elapsed;
}

// Llamado al abrir/seleccionar una IA — inicia o retoma cronómetro
function startSessionTimer(aiId) {
  const existing = _getTimerData(aiId);
  if (existing && existing.running) return; // ya corriendo
  const elapsed = existing ? existing.elapsed : 0;
  _setTimerData(aiId, { running: true, elapsed, startEpoch: Date.now() });
  _refreshTimerTick();
}

function _formatTimer(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function _renderTimerInCard(aiId) {
  const timerEl = document.getElementById('session-timer-' + aiId);
  const dotEl   = document.getElementById('session-timer-dot-' + aiId);
  if (!timerEl || !dotEl) return;
  const d = _getTimerData(aiId);
  if (!d) { timerEl.textContent = '00:00:00'; dotEl.className = 'session-timer-dot session-timer-dot--paused'; return; }
  const elapsed = d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0);
  timerEl.textContent = _formatTimer(elapsed);
  dotEl.className = 'session-timer-dot' + (d.running ? ' session-timer-dot--active' : ' session-timer-dot--paused');
  // Actualizar título de sesión activa en tiempo real
  const titleEl = document.getElementById('rsb-session-title-' + aiId);
  if (titleEl) {
    const ai = state.ais && state.ais.find(a => a.id === aiId);
    if (ai) {
      const sessions = getAISessions(aiId);
      const last = sessions.length ? sessions[sessions.length - 1] : null;
      const t = (last && last.title) ? last.title : '';
      titleEl.textContent = t.length > 28 ? t.substring(0, 28) + '\u2026' : t;
    }
  }
}

function _refreshTimerTick() {
  clearInterval(_timerIntervalId);
  _timerIntervalId = setInterval(() => {
    state.ais.forEach(ai => _renderTimerInCard(ai.id));
  }, 1000);
}

// HTML del widget cronómetro — insertado en buildCard()
function _timerWidgetHtml(aiId) {
  const d = _getTimerData(aiId);
  const elapsed = d ? d.elapsed + (d.running ? (Date.now() - d.startEpoch) : 0) : 0;
  const dotCls = (d && d.running) ? 'session-timer-dot--active' : 'session-timer-dot--paused';
  return `<div class="session-timer-wrap">` +
    `<span class="session-timer-dot ${dotCls}" id="session-timer-dot-${aiId}"></span>` +
    `<span class="session-timer-display" id="session-timer-${aiId}">${_formatTimer(elapsed)}</span>` +
    `</div>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// S-17: T-202605-447 · Sesión sugerida — banner de arranque
// ══════════════════════════════════════════════════════════════════════════════

function _computeSuggestionScore(ai) {
  // Peso 40%: días desde última sesión (más días = más urgente)
  const allSess = getAISessions(ai.id);
  let daysSinceScore = 0;
  if (allSess.length) {
    const lastSess = allSess.reduce((a, b) => {
      const ta = new Date(a.date || 0).getTime();
      const tb = new Date(b.date || 0).getTime();
      return ta > tb ? a : b;
    });
    const daysSince = (Date.now() - new Date(lastSess.date || 0).getTime()) / 86400000;
    daysSinceScore = Math.min(daysSince / 7, 1); // normalizado a 7 días
  } else {
    daysSinceScore = 1; // nunca usado = máxima urgencia
  }

  // Peso 40%: ítems high pendientes asignados a esta IA
  const aiSigla = ai.role || '';
  const highPending = (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(i =>
    i.status === 'pendiente' && i.priority === 'high' &&
    aiSigla && i.role && i.role.includes(aiSigla)
  ).length;
  const highScore = Math.min(highPending / 5, 1); // normalizado a 5 ítems

  // Peso 20%: cadencia histórica (ratio sesiones últimas 2 semanas)
  const recentSess = allSess.filter(s => {
    return (Date.now() - new Date(s.date || 0).getTime()) < 14 * 86400000;
  }).length;
  const cadenceScore = recentSess > 0 ? 0 : 1; // sin actividad reciente = más urgente

  return (daysSinceScore * 0.4) + (highScore * 0.4) + (cadenceScore * 0.2);
}

function _getSuggestedAI() {
  const active = (state.ais || []).filter(ai => !ai.archived);
  if (!active.length) return null;
  // Desempate: gana el que tiene más ítems high pendientes
  return active.reduce((best, ai) => {
    const scoreAI   = _computeSuggestionScore(ai);
    const scoreBest = _computeSuggestionScore(best);
    if (scoreAI > scoreBest) return ai;
    if (scoreAI === scoreBest) {
      const aiHigh   = _highPendingCount(ai);
      const bestHigh = _highPendingCount(best);
      return aiHigh >= bestHigh ? ai : best;
    }
    return best;
  });
}

function _highPendingCount(ai) {
  const aiSigla = ai.role || '';
  return (typeof ITEMS !== 'undefined' ? ITEMS : []).filter(i =>
    i.status === 'pendiente' && i.priority === 'high' &&
    aiSigla && i.role && i.role.includes(aiSigla)
  ).length;
}

function _buildSuggestionReason(ai) {
  const allSess = getAISessions(ai.id);
  const parts = [];
  if (allSess.length) {
    const lastSess = allSess.reduce((a, b) =>
      new Date(a.date||0) > new Date(b.date||0) ? a : b
    );
    const days = Math.floor((Date.now() - new Date(lastSess.date||0).getTime()) / 86400000);
    if (days >= 1) parts.push(`llevas ${days} día${days !== 1 ? 's' : ''} sin sesión con ${ai.name}`);
  } else {
    parts.push(`nunca has tenido una sesión con ${ai.name}`);
  }
  const high = _highPendingCount(ai);
  if (high > 0) parts.push(`${high} ítem${high !== 1 ? 's' : ''} high pendiente${high !== 1 ? 's' : ''}`);
  return parts.join(' · ');
}

function renderSuggestionBanner() {
  // B-258: banner global eliminado — información equivalente inline en buildCard()
  const banner = document.getElementById('session-suggestion-banner');
  if (banner) banner.classList.add('suggestion-banner--hidden');
}

function dismissSuggestionBanner() {
  const banner = document.getElementById('session-suggestion-banner');
  if (banner) banner.classList.add('suggestion-banner--hidden');
}

function startSuggestedSession(aiId) {
  dismissSuggestionBanner();
  // Seleccionar la IA sugerida
  if (typeof _trackerSelectAI === 'function') _trackerSelectAI(aiId);
  else if (typeof _trackerSelectedId !== 'undefined') {
    _trackerSelectedId = aiId;
    render();
  }
  startSessionTimer(aiId);
}

// ══════════════════════════════════════════════════════════════════════════════
// S-17: T-202605-448 · Resumen semanal automático — panel lunes
// ══════════════════════════════════════════════════════════════════════════════

const _WEEKLY_KEY = 'ai-tracker-weekly-dismissed';

function _isMonday() { return new Date().getDay() === 1; }

function _getMondayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function _weeklyAlreadyDismissed() {
  try {
    const raw = localStorage.getItem(_WEEKLY_KEY);
    return raw === _getMondayKey();
  } catch(e) { return false; }
}

function _markWeeklyDismissed() {
  try { localStorage.setItem(_WEEKLY_KEY, _getMondayKey()); } catch(e) {}
}

function _buildWeeklySummary() {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 86400000;
  const twoWeeksAgo = now - 14 * 86400000;

  // Sesiones de la semana anterior (entre hace 14 días y hace 7 días)
  const allSessions = (state.projects || []).flatMap(p => (p.sessions || []));
  const lastWeekSess = allSessions.filter(s => {
    const ts = new Date(s.date || 0).getTime();
    return ts >= twoWeeksAgo && ts < oneWeekAgo;
  });

  if (!lastWeekSess.length) return null; // sin actividad — no mostrar

  const totalSessions = lastWeekSess.length;

  // Ítems cerrados (done en esa semana)
  const allItems = typeof ITEMS !== 'undefined' ? ITEMS : [];
  const doneLast = allItems.filter(i => i.status === 'done').length;
  const pendingNow = allItems.filter(i => i.status === 'pendiente').length;

  // IAs más activas
  const aiCounts = {};
  lastWeekSess.forEach(s => {
    const ai = getAI(s.aiId);
    const name = ai ? ai.name : s.aiId;
    aiCounts[name] = (aiCounts[name] || 0) + 1;
  });
  const topAIs = Object.entries(aiCounts).sort((a,b)=>b[1]-a[1]).slice(0,3)
    .map(([n,c]) => `${n} (${c})`).join(', ');

  // Sprint progress
  let sprintProgress = '—';
  try {
    const proj = getActiveProject() || (state.projects && state.projects[0]);
    const sp = proj && proj.sprints ? proj.sprints.find(s => s.status === 'active') : null;
    if (sp) {
      const spItems = allItems.filter(i => i.sprint === sp.id);
      const spDone = spItems.filter(i => i.status === 'done').length;
      const spTotal = spItems.length;
      const spPct = spTotal > 0 ? Math.round((spDone/spTotal)*100) : 0;
      sprintProgress = `${sp.label || sp.id} · ${spDone}/${spTotal} (${spPct}%)`;
    }
  } catch(e) {}

  return { totalSessions, doneLast, pendingNow, topAIs, sprintProgress };
}

function _exportWeeklySummaryMd() {
  const s = _buildWeeklySummary();
  if (!s) return;
  const lines = [
    '# Resumen semanal — AI Tracker',
    `**Fecha:** ${new Date().toLocaleDateString('es-MX', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}`,
    '',
    `- **Sesiones registradas:** ${s.totalSessions}`,
    `- **Ítems cerrados:** ${s.doneLast}`,
    `- **Ítems abiertos:** ${s.pendingNow}`,
    `- **IAs más activas:** ${s.topAIs || '—'}`,
    `- **Sprint progress:** ${s.sprintProgress}`,
  ];
  const blob = new Blob([lines.join('\n')], {type:'text/markdown'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'resumen-semanal.md'; a.click();
  URL.revokeObjectURL(url);
}

function dismissWeeklySummary() {
  _markWeeklyDismissed();
  const modal = document.getElementById('weekly-summary-modal');
  if (modal) modal.classList.add('weekly-modal--hidden');
}

function _maybeShowWeeklySummary() {
  if (!_isMonday()) return;
  if (_weeklyAlreadyDismissed()) return;
  const summary = _buildWeeklySummary();
  if (!summary) return;

  // Poblar contenido
  const el = id => document.getElementById(id);
  if (el('wsum-sessions')) el('wsum-sessions').textContent = summary.totalSessions;
  if (el('wsum-done'))     el('wsum-done').textContent     = summary.doneLast;
  if (el('wsum-pending'))  el('wsum-pending').textContent  = summary.pendingNow;
  if (el('wsum-ais'))      el('wsum-ais').textContent      = summary.topAIs || '—';
  if (el('wsum-sprint'))   el('wsum-sprint').textContent   = summary.sprintProgress;

  const modal = document.getElementById('weekly-summary-modal');
  if (modal) modal.classList.remove('weekly-modal--hidden');
}

function render() {
  const grid = document.getElementById('grid');
  const emptyEl = document.getElementById('tracker-detail-empty');

  _renderTrackerSidebar();

  if (!state.ais.length) {
    if (grid) grid.innerHTML = '';
    // R-202604-068 AC-1: empty state con pasos y acción primaria visible
    if (emptyEl) { emptyEl.classList.remove('hidden'); emptyEl.classList.add('visible'); emptyEl.innerHTML = `
      <div class="empty-state-icon">🤖</div>
      <div class="empty-state-title">Sin IAs registradas</div>
      <div class="empty-state-hint">Registra las IAs que usas (Claude, GPT, Gemini…) para hacer seguimiento de cada sesión de trabajo.</div>
      <button class="empty-state-btn" onclick="openAddAI()">＋ Agregar primera IA</button>
      <div class="empty-state-steps">
        <div class="empty-step"><span class="empty-step-n">1</span><span>Agrega una IA</span></div>
        <div class="empty-step-sep">→</div>
        <div class="empty-step"><span class="empty-step-n">2</span><span>Pega el CHECKPOINT al terminar</span></div>
        <div class="empty-step-sep">→</div>
        <div class="empty-step"><span class="empty-step-n">3</span><span>El backlog se actualiza solo</span></div>
      </div>`; }
    updateStats(); renderStatusBar(); return;
  }

  // auto-select: preferir disponible/en-sesión sobre agotada
  const allActive = state.ais.filter(ai => !ai.archived);
  if (!_trackerSelectedId || !state.ais.find(a => a.id === _trackerSelectedId)) {
    const preferred = allActive.find(a => a.status !== 'exhausted') || allActive[0];
    _trackerSelectedId = preferred ? preferred.id : null;
  }

  if (!_trackerSelectedId) {
    if (grid) grid.innerHTML = '';
    if (emptyEl) { emptyEl.classList.remove('hidden'); emptyEl.classList.add('visible'); }
    updateStats(); renderStatusBar(); return;
  }

  if (emptyEl) emptyEl.classList.remove('visible');
  // B-202604-XXX: ocultar del flujo del DOM cuando hay IA seleccionada
  if (emptyEl) emptyEl.classList.add('hidden');

  // R-202604-060: aplicar color del proyecto activo como CSS custom property (CSS Purity — setProperty permitido)
  const _activeProjForColor = getActiveProject();
  if (_activeProjForColor && _activeProjForColor.color) {
    document.documentElement.style.setProperty('--proj-color', _activeProjForColor.color);
  } else {
    document.documentElement.style.removeProperty('--proj-color');
  }

  if (grid) {
    // R-110: sort IN-SESSION → DISPONIBLE → AGOTADA — sobre array, no manipula DOM
    const _sortOrder = (ai) => {
      if (ai.status !== 'exhausted' && _isInSession(ai)) return 0;
      if (ai.status !== 'exhausted') return 1;
      return 2;
    };
    const aisToRender = [...state.ais.filter(a => !a.archived)].sort((a, b) => _sortOrder(a) - _sortOrder(b));
    const ai = aisToRender.find(a => a.id === _trackerSelectedId) || state.ais.find(a => a.id === _trackerSelectedId);
    grid.innerHTML = '';
    if (ai) {
      const card = buildCard(ai);
      card.dataset.aiId = ai.id;
      grid.appendChild(card);
      // R-202604-061 AC-04: stagger reveal — una sola card en tracker, delay 0ms
      card.style.setProperty('--card-stagger-delay', '0ms');
      requestAnimationFrame(() => card.classList.add('stagger-in'));

      // R-202605-116: card sesión en curso — se inserta después del card IA
      const existingCsCard = document.getElementById('current-session-card-' + ai.id);
      if (existingCsCard) existingCsCard.remove();
      const csCard = (typeof _buildCurrentSessionCard === 'function')
        ? _buildCurrentSessionCard(ai.id)
        : null;
      if (csCard) {
        grid.appendChild(csCard);
        requestAnimationFrame(() => csCard.classList.add('cscard-visible'));
      }

      // archived section below card
      const archived = state.ais.filter(a => a.archived);
      if (archived.length) {
        const section = document.createElement('div');
        section.className = 'archived-section';
        const isOpen = localStorage.getItem('archived-open') === '1';
        section.innerHTML = `<button class="archived-toggle" onclick="toggleArchivedSection(this)">
          ${isOpen ? '▼' : '▶'} Archivadas (${archived.length})</button>
          <div class="archived-grid${isOpen ? ' open' : ''}" id="archived-grid"></div>`;
        grid.appendChild(section);
        const archGrid = section.querySelector('#archived-grid');
        archived.forEach(a => archGrid.appendChild(buildCard(a)));
      }
    }
  }

  updateStats();
  renderStatusBar();
  renderGlobalRadarSidebar();
  if (!window._radarSbInited) { window._radarSbInited = true; _initRadarSidebarState(); }
  renderProjDots();
  // B-202604-154: restaurar drafts tras reconstrucción del card — evita que el textarea quede vacío
  if (typeof restoreDrafts === 'function') restoreDrafts();
  // R-202604-059: actualizar historial col 2 según modo activo + re-attach drop targets tras cada render
  if (_trackerCurrentView === 'poria') {
    if (typeof _trackerRenderMiniHist === 'function') _trackerRenderMiniHist(_trackerSelectedId);
  } else {
    if (typeof _trackerRenderHist === 'function') _trackerRenderHist();
  }
  if (typeof _trackerHistAttachDropTargets === 'function') _trackerHistAttachDropTargets();
  // T-202605-447: actualizar banner de sesión sugerida tras cada render
  renderSuggestionBanner();
}

const TG_TYPE_NAMES = {I:'Idea', P:'Pendiente', T:'Ticket', R:'Requerimiento', B:'Bug'};

// T-202604-047: tiempo promedio entre sesiones consecutivas
function buildHoyCard(ai, idx = 0, opts = {}) {
  const isInterrupted = !!ai.interrupted;
  const isInSession   = !!opts.inSession;
  const statusClass = ai.status === 'exhausted' ? 'exhausted' : 'available';
  const cardClass = 'hoy-mini-card ' + statusClass + (isInterrupted ? ' interrupted-state' : '') + (isInSession ? ' in-session-state' : '');

  const aiSessions = getAISessions(ai.id);
  const checkpointTotal = aiSessions.length;
  const sessConHora = aiSessions.filter(s => s.resetAt && !s.quickCapture).length;
  const avgLabel2 = avgBetweenSessions(ai);
  const avgShort = avgLabel2 ? avgLabel2.replace(' entre sesiones','') : '—';

  const cd = ai.status === 'exhausted' ? getCD(ai.resetTime, ai.resetEpoch) : '';
  const resetLabel = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : '';

  // "disponible desde" — hora del último reset o última sesión
  function _availableSinceLabel() {
    if (ai.resetTime && ai.resetEpoch) {
      const epoch = new Date(ai.resetEpoch);
      const hh = String(epoch.getHours()).padStart(2,'0');
      const mm = String(epoch.getMinutes()).padStart(2,'0');
      return fmt12(`${hh}:${mm}`);
    }
    const last = aiSessions.length ? aiSessions[aiSessions.length - 1] : null;
    if (last && last.date) {
      const d = new Date(last.date);
      if (!isNaN(d)) {
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        return fmt12(`${hh}:${mm}`);
      }
    }
    return null;
  }

  const availSince = ai.status === 'available' ? _availableSinceLabel() : null;

  const statsBar = ai.status === 'exhausted'
    ? `<div class="hoy-mini-stats">
        <div class="hoy-mini-stat exhausted-cell">
          <div>
            <div class="hoy-exh-countdown">${cd || '--:--:--'}</div>
            <div class="hoy-exh-reset-label">${resetLabel || 'sin hora'}</div>
          </div>
        </div>
      </div>`
    : `<button class="hoy-mini-ckpt-full" onclick="event.stopPropagation();navigateToCard('${ai.id}')">
        + checkpoint
        <span class="hoy-mini-ckpt-since">${availSince ? `desde ${availSince}` : 'disponible'}</span>
      </button>`;

  // T-316: badge diferenciado — ámbar para interrupted, púrpura para in-session
  const statusBadge = isInterrupted
    ? `<div class="hoy-mini-actions"><span class="hoy-mini-badge hoy-mini-badge--interrupted">⚡ Interrumpida</span></div>`
    : isInSession
      ? `<div class="hoy-mini-actions"><span class="hoy-mini-badge hoy-mini-badge--insession">● En sesión</span></div>`
      : '';

  // T-316: pill de proyecto de la última sesión global (sin filtro de proyecto activo)
  const _lastSessGlobal = getAllSessions().filter(s => s.aiId === ai.id).slice(-1)[0] || null;
  const _lastProjGlobal = _lastSessGlobal ? getProjectById(_lastSessGlobal.projectId) : null;
  const projPill = _lastProjGlobal
    ? `<span class="hoy-mini-proj-pill" title="${esc(_lastProjGlobal.name)}">${esc(_lastProjGlobal.icon || '📁')} ${esc(_lastProjGlobal.name)}</span>`
    : '';

  // quick button only for available/interrupted, not exhausted
  const quickBtn = (ai.status !== 'exhausted')
    ? `<button class="btn-quick" onclick="event.stopPropagation();openQuickCapture('${ai.id}')" title="Sesión rápida">⚡</button>`
    : '';

  return `<div class="${cardClass}" data-hoy-ai-id="${ai.id}" data-anim-delay="${idx * 60}" onclick="navigateToCard('${ai.id}')">
    <div class="hoy-mini-strip">
      <div class="hoy-mini-name">${esc(ai.name)}</div>
      <div class="hoy-mini-right">
        ${quickBtn}
      </div>
    </div>
    ${statsBar}
    ${statusBadge}
    ${projPill ? `<div class="hoy-mini-proj-row">${projPill}</div>` : ''}
  </div>`;
}

function _hoyMarkExhausted(id) {
  // Marks an AI as exhausted from Tab Hoy — no reset time (user can set later)
  const ai = getAI(id);
  if (!ai) return;
  ai.status = 'exhausted';
  ai.resetTime = '';
  ai.resetEpoch = null;
  save();
  renderHoy();
  render();
}

// ── Bloqueo ciego — agotar IA sin crear sesión ni log ──
function openBlindExhaustMode(id) {
  const ai = getAI(id);
  if (!ai || ai.status !== 'available' || _isInSession(ai)) return;
  const footer = document.getElementById('footer-' + id);
  if (!footer) return;
  footer.classList.add('card-footer--blind-exhaust-mode');
  const inline = document.getElementById('bexhaust-inline-' + id);
  if (inline) inline.classList.remove('hidden');
  setTimeout(() => {
    const inp = document.getElementById('bexhaust-hora-' + id);
    if (inp) { inp.focus(); inp.select(); }
  }, 30);
}

function cancelBlindExhaustMode(id) {
  const footer = document.getElementById('footer-' + id);
  if (footer) footer.classList.remove('card-footer--blind-exhaust-mode');
  const inline = document.getElementById('bexhaust-inline-' + id);
  if (inline) inline.classList.add('hidden');
  const inp = document.getElementById('bexhaust-hora-' + id);
  if (inp) inp.value = '';
  const disp = document.getElementById('bexhaust-disp-' + id);
  if (disp) { disp.textContent = '—'; disp.className = 'hora-parsed'; }
  const btn = document.getElementById('bexhaust-confirm-' + id);
  if (btn) btn.disabled = true;
}

function blindExhaustHoraInput(id) {
  const inp = document.getElementById('bexhaust-hora-' + id);
  const disp = document.getElementById('bexhaust-disp-' + id);
  const btn = document.getElementById('bexhaust-confirm-' + id);
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);
  if (disp) {
    disp.textContent = result ? result.label : (raw.length >= 3 ? 'hora inválida' : (raw.length ? '...' : '—'));
    disp.className = 'hora-parsed' + (result ? ' hora-disp--valid' : (raw.length >= 3 ? ' hora-disp--error' : ''));
  }
  if (btn) btn.disabled = !result;
}

function blindExhaustHoraKey(event, id) {
  if (event.key === 'Escape') { event.preventDefault(); cancelBlindExhaustMode(id); return; }
  if (event.key === 'Enter') { event.preventDefault(); confirmBlindExhaust(id); }
}

function confirmBlindExhaust(id) {
  const ai = getAI(id);
  if (!ai || ai.status !== 'available') return;
  const inp = document.getElementById('bexhaust-hora-' + id);
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);
  if (!result) {
    showToast('error', 'Hora inválida — ingresa formato HHMM (ej: 2100)');
    return;
  }
  ai.status = 'exhausted';
  ai.resetTime = result.hhmm;
  ai.resetEpoch = result.epoch;
  // AC: no crea sesión, no toca resetAt de sesiones existentes, no emite log
  cancelBlindExhaustMode(id);
  saveImmediate().then(() => {
    render();
    if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
  });
  showToast('info', `${ai.name} — agotada sin sesión · desbloqueo a las ${result.label}`);
}

function avgBetweenSessions(ai) {
  const dated = getAISessions(ai.id)
    .map(s => new Date(s.date).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b);
  if (dated.length < 2) return null;
  let totalMs = 0;
  for (let i = 1; i < dated.length; i++) totalMs += dated[i] - dated[i - 1];
  const avgMs = totalMs / (dated.length - 1);
  const avgH = avgMs / 3600000;
  if (avgH < 24) return `~${Math.round(avgH)}h entre sesiones`;
  const d = Math.floor(avgH / 24);
  const h = Math.round(avgH % 24);
  return h > 0 ? `~${d}d ${h}h entre sesiones` : `~${d}d entre sesiones`;
}

function buildCard(ai) {
  const el = document.createElement('div');
  const isInterrupted = !!ai.interrupted;
  const isInSession   = !isInterrupted && _isInSession(ai);
  el.className = 'card ' + (ai.status === 'exhausted' ? 'exhausted' : 'available') + (isInterrupted ? ' interrupted-state' : '') + (isInSession ? ' in-session-state' : '');
  el.id = 'card-' + ai.id;

  const cd = ai.status === 'exhausted' ? getCD(ai.resetTime, ai.resetEpoch) : '';
  const resetLabel = ai.resetTime ? `hasta las ${fmt12(ai.resetTime)}` : '';
  // T-055: banner sesión interrumpida
  const interruptedBannerHTML = ai.interrupted
    ? `<div class="interrupted-banner visible">
        <span class="interrupted-banner-text">⚡ Sesión en curso</span>
        <button class="interrupted-banner-btn" onclick="dismissInterrupted('${ai.id}')">Continuar →</button>
       </div>`
    : `<div class="interrupted-banner" id="intbanner-${ai.id}"></div>`;

  // T-202604-203: stats bar sin countdown (countdown va en zona central)
  const _cdInStats = false;

  // v3: sesiones de esta IA en el contexto del proyecto activo
  const aiSessions = getAISessions(ai.id);
  const SESSIONS_DEFAULT = 3;
  const shown = ai.showAll ? aiSessions : [...aiSessions].slice(-SESSIONS_DEFAULT);
  const _latestSessId = aiSessions.length > 0 ? aiSessions[aiSessions.length - 1].id : null;

  // v3: tracker del proyecto activo para indicadores de sesión
  const projTracker = getActiveTracker();

  // T-397: helper — build a single sess-row HTML
  const _buildSessRow = (s, isHero) => {
    const tagDots = (s.tags || []).map(tid => {
      const t = state.tags.find(x => x.id === tid);
      return t ? `<span class="sess-tag-dot" data-tag-color="${esc(t.color)}" title="${esc(t.name)}"></span>` : '';
    }).join('');
    const tgItems = projTracker.items.filter(x => x.sessionId === s.id);
    const tgCounts = {P:0,T:0,R:0,B:0};
    tgItems.forEach(x => {
      const t = x.code ? x.code[0] : (x.type || '');
      if (tgCounts[t] !== undefined) tgCounts[t]++;
    });
    const tgInds = Object.entries(tgCounts).filter(([,v]) => v > 0)
      .map(([k, v]) => `<span class="sess-ind sess-ind-${k}" title="${TG_TYPE_NAMES[k]}"><span class="ind-short">${k}${v > 1 ? v : ''}</span><span class="ind-full">${TG_TYPE_NAMES[k]}${v > 1 ? '×'+v : ''}</span></span>`).join('');
    const pendInd = '';
    const noHoraTag = (!s.resetAt && !s.quickCapture) ? `<span class="sess-no-hora" title="Sin hora de reset registrada">sin hora</span>` : '';
    const refPills = (s.trackerRefs || []).map(code => {
      const type = code[0] || '';
      return `<span class="popup-ref-pill ${type} popup-ref-pill--sm" title="${esc(code)}" onclick="event.stopPropagation();openDetail('${ai.id}','${s.id}')">${esc(code)}</span>`;
    }).join('');
    const starInd = s.starred ? `<span class="sess-ind sess-ind--starred" title="Destacada">⭐</span>` : '';
    const quickInd = s.quickCapture ? `<span class="sess-ind sess-quick-tag" title="Captura rápida">⚡</span>` : '';
    const isLatest = s.id === _latestSessId;
    const reviewInd = isLatest
      ? `<span class="sess-review-ind${s.inReview ? ' active' : ''}" title="${s.inReview ? 'En revisión — click para desactivar' : 'Marcar en revisión'}" onclick="event.stopPropagation();toggleInReview('${ai.id}','${s.id}')">${s.inReview ? '🔍 revisión' : '🔍'}</span>`
      : '';
    const summaryTrunc = s.summary ? (s.summary.length > 80 ? s.summary.slice(0, 80) + '…' : s.summary) : '';
    const summaryHtml = isHero && s.summary
      ? `<div class="sess-row-summary sess-row-summary--expanded">${esc(s.summary.slice(0, 220))}${s.summary.length > 220 ? '…' : ''}</div>`
      : (s.summary ? `<div class="sess-row-summary">${esc(summaryTrunc)}</div>` : '');
    const decisionHtml = isHero && s.decision
      ? `<div class="sess-row-decision"><span class="sess-row-decision-label">→</span>${esc(s.decision.slice(0, 160))}${s.decision.length > 160 ? '…' : ''}</div>`
      : '';
    const extraCls = (s.starred ? ' sess-row-starred' : '') + (isHero ? ' sess-row--latest' : '');
    return `<div class="sess-row${extraCls}" data-sess-id="${s.id}" onclick="openDetail('${ai.id}','${s.id}')">
      <div class="sess-row-top">
        <div class="sess-row-title" title="${esc(s.title)}">${esc(s.title)}</div>
        <div class="sess-row-date" title="${esc(s.date || s.dateShort || '')}">${relDate(s.date) || s.dateShort || ''}</div>
      </div>
      <div class="sess-row-bottom">
        ${summaryHtml}
        <div class="sess-row-indicators">${starInd}${quickInd}${pendInd}${tgInds}${noHoraTag}${reviewInd}<div class="sess-row-tags">${tagDots}</div></div>
      </div>
      ${decisionHtml}
    </div>`;
  };

  // T-397: hero (latest) + horizontal strip (older)
  const shownReversed = [...shown].reverse();
  const latestSess = shownReversed[0] || null;
  const olderSess = shownReversed.slice(1);
  const heroHTML = latestSess ? _buildSessRow(latestSess, true) : '';
  const olderHTML = olderSess.length > 0
    ? `<div class="sess-list-horiz">${olderSess.map(s => _buildSessRow(s, false)).join('')}</div>`
    : '';
  const sessRows = heroHTML + olderHTML;

  // B-258: emptyState inline — información de sugerencia dentro de la card, sin banner global
  const _noSessReason = _buildSuggestionReason(ai);
  const emptyState = `<div class="no-sess">
    <span class="no-sess-icon">📋</span>
    Sin sesiones aún
    ${_noSessReason ? `<div class="no-sess-suggestion">${esc(_noSessReason)}</div>` : ''}
    <div class="no-sess-hint">Pega el bloque CHECKPOINT al terminar tu sesión con la IA</div>
  </div>`;

  // v3: stats de sesiones desde proyecto activo
  const nowYM = new Date().toISOString().slice(0,7);
  const sessThisMonth = aiSessions.filter(s => (s.date || '').startsWith(nowYM)).length;
  const sessTotal = aiSessions.length;

  const histHTMLv2 = `
    <div class="history">
      <div class="history-header">
        <div class="history-label">Historial</div>
        <div class="history-header-right">
          <span class="sess-pill">${sessTotal}</span>
        </div>
      </div>
      ${sessTotal === 0 ? emptyState : `
        <div class="sess-list-hero" id="sess-list-${ai.id}">${sessRows}</div>
        ${sessTotal > SESSIONS_DEFAULT ? `<button class="show-all-btn" onclick="toggleShowAll('${ai.id}')">${ai.showAll ? '▲ ocultar historial' : '▾ Ver historial (' + sessTotal + ')'}</button>` : ''}
      `}
    </div>`;

  // Selector de proyecto — inline en paste-label
  const _activeProjects = (state.projects || []).filter(p => p.status !== 'paused');
  const _activeProjId = _getActiveProjectFilter() || '';
  const _projOptions = _activeProjects.map(p =>
    `<option value="${esc(p.id)}" ${p.id === _activeProjId ? 'selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`
  ).join('');
  const _projInlineSelect = `<select class="paste-proj-select" id="sess-proj-${ai.id}" title="Proyecto de esta sesión"><option value="">proyecto…</option>${_projOptions}</select>`;

  // T-202604-203: zona central — contenido condicional por estado
  // Estado available: textarea + preview
  // Estado exhausted: countdown dramático
  // B-255: label "Disponible en X h Y min" calculado desde _hoyMsUntilReset
  const _buildUnlockLabel = (aiObj) => {
    const msLeft = _hoyMsUntilReset(aiObj);
    if (!isFinite(msLeft) || msLeft <= 0) return 'Disponible ahora';
    const totalMin = Math.floor(msLeft / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `Disponible en ${m}min`;
    return `Disponible en ${h}h ${String(m).padStart(2,'0')}min`;
  };
  const unlockLabel = ai.status === 'exhausted' && ai.resetTime ? _buildUnlockLabel(ai) : '';

  const inputHTML = ai.status === 'available' ? `
    <div class="paste-wrap">
      <div class="paste-label">Resumen de sesión <span class="draft-dot" id="draft-${ai.id}"></span>${_projInlineSelect}</div>
      <div class="paste-help-box hidden" id="paste-help-${ai.id}">Pega el bloque <code>---CHECKPOINT---</code> que genera el TL al final de cada sesión. Si no tienes el bloque, escribe el título en la primera línea y el resumen en las siguientes.</div>
      <div class="phase-bar" id="phasebar-${ai.id}">
        <div class="phase-bar-step active" id="phase-paste-${ai.id}"><span class="phase-bar-dot"></span>Pegar</div>
        <div class="phase-bar-step" id="phase-confirm-${ai.id}"><span class="phase-bar-dot"></span>Confirmar</div>
        <div class="phase-bar-step" id="phase-save-${ai.id}"><span class="phase-bar-dot"></span>Guardar</div>
      </div>
      <div class="paste-ta-wrap">
        <textarea class="paste-ta" id="ta-${ai.id}" rows="3"
          placeholder="Pega aquí el resumen del prompt...&#10;&#10;**Título:** ...&#10;**Resumen:** ...&#10;**Archivos:** ..."
          onpaste="handlePaste('${ai.id}')"
          oninput="handleInput('${ai.id}'); _updatePasteTaActions('${ai.id}')"
          onfocus="enterFocusMode('${ai.id}')"></textarea>
        <div class="paste-ta-actions" id="pta-${ai.id}">
          <button class="paste-ta-btn paste-ta-btn--paste" onclick="pasteFromClipboard('${ai.id}')" aria-label="Pegar desde portapapeles" title="Pegar">📋</button>
          <button class="paste-ta-btn paste-ta-btn--clear paste-ta-btn--disabled" id="pta-clear-${ai.id}" onclick="clearPasteTa('${ai.id}')" aria-label="Limpiar textarea" title="Limpiar" disabled>✕</button>
        </div>
      </div>
      <div class="char-counter" id="cc-${ai.id}"></div>
    </div>
    <div class="preview" id="prev-${ai.id}"></div>
  ` : ai.resetTime ? `
    <div class="card-countdown-zone">
      <div class="countdown-dramatic">
        <div class="card-stat-countdown" id="cd-${ai.id}">${cd || '--:--:--'}</div>
        <div class="card-stat-reset-lbl">${resetLabel}</div>
        <div class="card-unlock-time" id="unlock-lbl-${ai.id}">${unlockLabel}</div>
      </div>
    </div>
  ` : `
    <div class="card-countdown-zone card-countdown-zone--notime">
      <div class="countdown-no-time">
        <div class="countdown-no-time-msg">Sin hora de desbloqueo asignada</div>
        <button class="countdown-assign-hora-btn" onclick="openCorrectHora('${ai.id}')">⏰ Asignar hora</button>
      </div>
    </div>
  `;

  // T-202604-203: footer fijo — acciones primarias siempre en la misma posición
  const footerHTML = ai.status === 'available' ? `
    <div class="card-footer" id="footer-${ai.id}">
      <div class="hora-row">
        <input class="hora-input" id="hora-${ai.id}" type="text" maxlength="4" placeholder="--:--"
          oninput="parseHora('${ai.id}')"
          onkeydown="horaKey(event,'${ai.id}')">
        <div>
          <div class="hora-parsed" id="hdisp-${ai.id}">—</div>
          <div class="hora-hint-txt">hora de desbloqueo (opcional) · Enter para guardar</div>
        </div>
      </div>
      <div class="card-footer-actions-row">
        <button class="save-btn" id="sbtn-${ai.id}" onclick="confirmSave('${ai.id}')" disabled>Guardar sesión</button>
      </div>
      <div class="blind-exhaust-inline hidden" id="bexhaust-inline-${ai.id}">
        <div class="blind-exhaust-hora-row">
          <input class="hora-input blind-exhaust-hora-input" id="bexhaust-hora-${ai.id}" type="text" maxlength="4" placeholder="--:--"
            oninput="blindExhaustHoraInput('${ai.id}')"
            onkeydown="blindExhaustHoraKey(event,'${ai.id}')"
            aria-label="Hora de desbloqueo para agotamiento ciego">
          <div>
            <div class="hora-parsed" id="bexhaust-disp-${ai.id}">—</div>
            <div class="hora-hint-txt">hora de desbloqueo · Enter para agotar</div>
          </div>
        </div>
        <div class="blind-exhaust-confirm-row">
          <button class="blind-exhaust-confirm-btn" id="bexhaust-confirm-${ai.id}" onclick="confirmBlindExhaust('${ai.id}')" disabled aria-label="Confirmar agotamiento ciego">🔴 Agotar</button>
          <button class="blind-exhaust-cancel-btn" onclick="cancelBlindExhaustMode('${ai.id}')">Cancelar</button>
        </div>
      </div>
    </div>
  ` : `
    <div class="card-footer card-footer--exhausted">
      <button class="card-footer-unlock-btn" onclick="openCorrectHora('${ai.id}')">⏰ Corregir hora</button>
    </div>
  `;

  // T-031: Notas
  const notesVal = ai.notes || '';
  const notesHTML = `<div class="card-notes-wrap" id="notes-wrap-${ai.id}">
    ${notesVal
      ? `<div class="card-notes-text" id="notes-text-${ai.id}" onclick="editNotes('${ai.id}')" title="Click para editar notas">${esc(notesVal)}</div>
         <span class="card-notes-toggle hidden" id="notes-toggle-${ai.id}" onclick="toggleNotes('${ai.id}')"></span>`
      : `<div class="card-notes-text empty-notes" id="notes-text-${ai.id}" onclick="editNotes('${ai.id}')" title="Agregar notas">+ notas libres</div>`
    }
  </div>`;

  // v3: stale usa aiSessions
  const staleLastDate = aiSessions.length > 0 ? new Date(aiSessions[aiSessions.length-1].date) : null;
  const staleDays = staleLastDate ? Math.floor((Date.now()-staleLastDate.getTime())/86400000) : 0;

  const checkpointTotal = aiSessions.length; // todos los registros
  const sessConHora = aiSessions.filter(s => s.resetAt && !s.quickCapture).length; // con hora bloqueada
  const avgLabel2 = avgBetweenSessions(ai);
  const avgShort = avgLabel2 ? avgLabel2.replace(' entre sesiones','') : '—';
  // T-202604-203: stats bar idéntica en ambos estados — solo números, sin countdown
  const statsBarHTML = `<div class="card-stats-bar${ai.status === 'exhausted' ? ' exhausted-bar' : ' available-bar'}">
      <div class="card-stat-cell"><div class="card-stat-num">${checkpointTotal}</div><div class="card-stat-lbl">checkpoints</div></div>
      <div class="card-stat-cell"><div class="card-stat-num">${sessConHora}</div><div class="card-stat-lbl">sesiones</div></div>
      <div class="card-stat-cell"><div class="card-stat-num">${avgShort}</div><div class="card-stat-lbl" title="Tiempo promedio entre sesiones de este AI">frecuencia</div></div>
    </div>`;

  // Project chip — basado en la última sesión de la IA
  const _lastSess = getLastAISession(ai.id);
  const _cardProj = _lastSess ? getProjectById(_lastSess.projectId) : null;
  const _projChipHTML = _cardProj
    ? `<span class="card-proj-chip" title="${esc(_cardProj.name)}" onclick="event.stopPropagation();selectProjectFilter('${_cardProj.id}')">${esc(_cardProj.icon || '📁')} ${esc(_cardProj.name)}</span>`
    : '';

  // Premium card: avatar initial + status pill animado + countdown dramático
  const _aiInitial = esc(ai.name).charAt(0).toUpperCase();
  const _isAvail = ai.status === 'available';

  el.innerHTML = `
    ${interruptedBannerHTML}
    <div class="card-header-premium">
      <div class="card-avatar-col">
        <div class="card-avatar ${ai.status}${isInterrupted ? ' interrupted' : ''}" title="${esc(ai.name)}">
          <span class="card-avatar-initial">${_aiInitial}</span>
          <span class="card-avatar-pulse"></span>
        </div>
      </div>
      <div class="card-identity">
        <div class="card-name-row">
          <div class="card-name" ondblclick="startRename('${ai.id}')" id="name-${ai.id}" title="Doble click para renombrar">${esc(ai.name)}</div>
          <span class="card-rename-hint">✎</span>
        </div>
        <div class="card-meta-row">
          <span class="card-status-pill ${isInSession ? 'insession' : ai.status}">
            <span class="card-status-dot"></span>
            ${isInSession ? STATUS_LABELS.insession : _isAvail ? STATUS_LABELS.available : STATUS_LABELS.exhausted}
          </span>
          ${_projChipHTML}
          ${_hasStaleSuggestion(ai) ? `<span class="stale-dot" title="Última sesión hace ${staleDays} días — tienes ítems en progreso pendientes"></span>` : ''}
        </div>
      </div>
      <div class="card-right">
        ${_isAvail ? `<button class="btn-quick" onclick="openQuickCapture('${ai.id}')" title="Registrar sesión rápida sin protocolo">⚡</button>` : ''}
        <div class="card-dot-menu" id="dotmenu-wrap-${ai.id}">
          <button class="card-dot-btn" onclick="toggleCardMenu('${ai.id}',event)" title="Más opciones">⋯</button>
          <div class="card-dot-dropdown" id="dotmenu-${ai.id}">
            <button class="card-dot-item" onclick="closeCardMenu('${ai.id}');startRename('${ai.id}')"><span class="dot-item-icon">✎</span> Renombrar</button>
            ${_isAvail ? `<button class="card-dot-item" onclick="confirmInterruptInline('${ai.id}',this)"><span class="dot-item-icon">⛓️‍💥</span> Interrumpir sesión</button>` : ''}
            ${_isAvail ? `<button class="card-dot-item" onclick="closeCardMenu('${ai.id}');openBlindExhaustMode('${ai.id}')"><span class="dot-item-icon">🔴</span> Agotar</button>` : ''}
            ${!_isAvail ? `<button class="card-dot-item" onclick="closeCardMenu('${ai.id}');openCorrectHora('${ai.id}')"><span class="dot-item-icon">⏰</span> Corregir hora de desbloqueo</button>` : ''}
            <button class="card-dot-item${sessTotal < 2 ? ' disabled' : ''}" onclick="closeCardMenu('${ai.id}');${sessTotal >= 2 ? `downloadReport('${ai.id}')` : ''}" title="${sessTotal < 2 ? 'Necesitas al menos 2 sesiones' : 'Descargar reporte markdown'}"${sessTotal < 2 ? ' disabled' : ''}><span class="dot-item-icon">📥</span> Descargar reporte</button>
            <hr class="card-dot-divider">
            <div class="danger-zone">
            <button class="card-dot-item danger" onclick="closeCardMenu('${ai.id}');archiveAI('${ai.id}')"><span class="dot-item-icon">⊟</span> Archivar</button>
            <button class="card-dot-item danger" onclick="closeCardMenu('${ai.id}');confirmClear('${ai.id}')"><span class="dot-item-icon">⌫</span> Limpiar historial</button>
            <button class="card-dot-item danger" onclick="closeCardMenu('${ai.id}');deleteAI('${ai.id}')"><span class="dot-item-icon">✕</span> Eliminar IA</button>
            </div>
          </div>
        </div>
        <button class="focus-exit-btn" onclick="exitFocusMode()" title="Salir del modo protagonista">✕ salir</button>
        <span class="card-drag-handle" title="Arrastrar para reordenar">⠿</span>
      </div>
    </div>
    ${statsBarHTML}
    <div class="card-body">
      ${inputHTML}
      ${_trackerCurrentView !== 'poria' ? histHTMLv2 : ''}
      ${notesHTML}
    </div>
    ${footerHTML}`;
  // CSS Purity: tag dot background color calculado desde datos → setProperty post-render
  el.querySelectorAll('[data-tag-color]').forEach(dot => {
    dot.style.setProperty('background', dot.dataset.tagColor);
  });
  return el;
}

// ── T-071: Captura rápida ──
let _quickAIId = null;

function openQuickCapture(id) {
  _quickAIId = id;
  const ai = getAI(id);
  document.getElementById('quick-modal-ai-name').textContent = ai.name;
  document.getElementById('quick-title').value = '';
  document.getElementById('quick-summary').value = '';
  document.getElementById('quick-hora').value = '';
  document.getElementById('quick-hora-disp').textContent = 'hora de desbloqueo (opcional)';
  document.getElementById('quick-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('quick-title').focus(), 80);
}

function closeQuickModal(e) {
  if (e && e.target !== document.getElementById('quick-modal-overlay')) return;
  document.getElementById('quick-modal-overlay').classList.remove('open');
  _quickAIId = null;
}

// T-202605-430: usa _horaUpdate — feedback visual completo igual que la referencia
function quickParseHora() {
  const inp = document.getElementById('quick-hora');
  const disp = document.getElementById('quick-hora-disp');
  if (inp && !inp.value.replace(/\D/g, '')) {
    if (disp) { disp.textContent = 'hora de desbloqueo (opcional)'; disp.className = 'hora-disp--hint'; }
    return;
  }
  _horaUpdate(inp, disp);
}

function quickTitleKey(e) {
  if (e.key === 'Enter') { e.preventDefault(); confirmQuickCapture(); }
  if (e.key === 'Escape') { closeQuickModal(); }
}

function confirmQuickCapture() {
  if (!_quickAIId) return;
  const title = document.getElementById('quick-title').value.trim();
  if (!title) {
    document.getElementById('quick-title').focus();
    const _qt = document.getElementById('quick-title');
    if (_qt) { _qt.classList.add('input-border-error'); setTimeout(() => _qt.classList.remove('input-border-error'), 1200); }
    return;
  }
  const summary = document.getElementById('quick-summary').value.trim();
  const horaRaw = document.getElementById('quick-hora').value.replace(/\D/g,'');
  const horaResult = horaRaw ? interpretHora(horaRaw) : null;

  const ai = getAI(_quickAIId);
  const now = new Date();
  const sess = {
    id: 'sess-' + Date.now(),
    title,
    summary,
    files: '',
    pending: '',
    tags: [],
    trackerRefs: [],
    starred: false,
    quickCapture: true,
    resetAt: horaResult ? horaResult.hhmm : '',
    dateShort: now.toLocaleDateString('es-MX', {day:'2-digit',month:'short'}),
    date: now.toISOString()
  };

  // v3: sesión va al proyecto activo con aiId
  sess.aiId = _quickAIId;
  const activeProj = getActiveProject();
  if (!activeProj) {
    showToast('warning', '⚠ Selecciona un proyecto antes de guardar la sesión');
    if (typeof openProjPanel === 'function') openProjPanel();
    return;
  }
  if (!activeProj.sessions) activeProj.sessions = [];
  activeProj.sessions.push(sess);

  if (horaResult) {
    // T-089: solo cambiar status a exhausted si estaba disponible
    if (ai.status === 'available') ai.status = 'exhausted';
    ai.resetTime = horaResult.hhmm;
    ai.resetEpoch = horaResult.epoch;
  }

  document.getElementById('quick-modal-overlay').classList.remove('open');
  _quickAIId = null;
  // B-202605-XXX: usar saveImmediate() para garantizar escritura en Supabase antes de
  // cualquier recarga. save() con debounce de 5s podía perder resetTime/resetEpoch/status
  // si el usuario recargaba la tab antes de que el timer disparara.
  saveImmediate().then(() => { render(); if (currentTab === 'hoy') renderHoy(); });
  showToast('success', `${ai.name} — sesión rápida guardada`);
}

// ── T-055: Sesión interrumpida ──
// T-093: confirmación inline dentro del dropdown antes de interrumpir
function confirmInterruptInline(id, triggerBtn) {
  const dropdown = document.getElementById('dotmenu-' + id);
  if (!dropdown) return;
  // Si ya hay un confirm-row, no duplicar
  if (dropdown.querySelector('.dot-confirm-row')) return;
  // Ocultar el botón trigger
  triggerBtn.classList.add('hidden');
  const row = document.createElement('div');
  row.className = 'dot-confirm-row';
  row.innerHTML = `<span class="dot-confirm-label">⚡ ¿Interrumpir?</span>
    <button class="dot-confirm-cancel" onclick="cancelInterruptInline('${id}')">No</button>
    <button class="dot-confirm-ok" onclick="closeCardMenu('${id}');interruptSession('${id}')">Sí</button>`;
  triggerBtn.after(row);
}
function cancelInterruptInline(id) {
  const dropdown = document.getElementById('dotmenu-' + id);
  if (!dropdown) return;
  const row = dropdown.querySelector('.dot-confirm-row');
  if (row) row.remove();
  const btn = dropdown.querySelector('.card-dot-item[onclick*="confirmInterruptInline"]');
  if (btn) btn.classList.remove('hidden');
}

function interruptSession(id) {
  const ai = getAI(id);
  _gconfirmOpen({
    title: `Marcar sesión interrumpida`,
    msg: `"${ai.name}" pasará a estado agotado.`,
    okLabel: 'Confirmar',
    danger: false,
    inputLabel: 'Hora de reset (opcional)',
    inputPlaceholder: '--:--'
  }, (horaRaw) => {
    const horaResult = horaRaw ? interpretHora(horaRaw.replace(/\D/g,'')) : null;
    ai.status = 'exhausted';
    ai.interrupted = true;
    if (horaResult) { ai.resetTime = horaResult.hhmm; ai.resetEpoch = horaResult.epoch; }
    // R-202604-061 AC-2: clase transitoria antes de interrupted-state
    const _intCard = document.getElementById('card-' + id);
    if (_intCard) _intCard.classList.add('tracker-card--interrupting');
    setTimeout(() => {
      save(); render();
      if (currentTab === 'hoy') renderHoy();
    }, 200);
    showToast('info', `${ai.name} — sesión interrumpida`);
  });
}

function dismissInterrupted(id) {
  const ai = getAI(id);
  ai.interrupted = false;
  save(); render();
  if (currentTab === 'hoy') renderHoy();
}

// T-058 ya maneja auto-disponible; al desbloquearse, si tenía interrupted, lo conservamos
// Solo limpiamos interrupted cuando el usuario hace click en "Continuar →"

// ── T-056: Focus Zone — modo registro ──
let focusActiveId = null;

function enterFocusMode(id) {
  if (focusActiveId === id) return;
  // Si había otro activo, salir primero
  if (focusActiveId) exitFocusMode();
  focusActiveId = id;

  const activeCard = document.getElementById('card-' + id);
  if (activeCard) {
    activeCard.classList.add('focus-active');
    // T-202604-004: historial permanece visible en modo protagonista
    // Scroll NO se hace aquí — enterFocusMode se dispara desde onfocus del textarea
    // y causaría scroll indeseado al hacer click dentro del campo.
    // El scroll al navegar se maneja en _scrollToCard().
  }

  // Dimmear los demás cards
  document.querySelectorAll('.card').forEach(c => {
    if (c.id !== 'card-' + id) c.classList.add('focus-dimmed');
  });
}

function exitFocusMode() {
  if (!focusActiveId) return;
  const activeCard = document.getElementById('card-' + focusActiveId);
  if (activeCard) {
    activeCard.classList.remove('focus-active');
  }
  document.querySelectorAll('.card.focus-dimmed').forEach(c => c.classList.remove('focus-dimmed'));
  focusActiveId = null;
}

// ESC para salir del modo registro
// ── T-202604-418: Atajos de teclado globales ─────────────────────────────

// Cascade Escape — cierra en orden de profundidad (más reciente primero)
function _escCascade() {
  const _overlayChecks = [
    // T-202605-460: panel búsqueda global — prioridad más alta
    () => { const el = document.getElementById('search-unified-results'); if (el) { el.remove(); return true; } },
    // Prioridad alta — modales de confirmación / editing
    () => { const el = document.getElementById('shortcuts-ref-overlay'); if (el && !el.classList.contains('hidden')) { closeShortcutsRef(); return true; } },
    () => { const el = document.getElementById('shortcuts-overlay'); if (el && !el.classList.contains('hidden')) { closeShortcuts(); return true; } },
    () => { const el = document.getElementById('cmd-palette-overlay'); if (el && !el.classList.contains('hidden')) { closeCommandPalette(); return true; } },
    () => { const el = document.getElementById('quick-note-modal'); if (el && el.offsetParent !== null) { if (typeof closeQuickNote === 'function') closeQuickNote(); return true; } },
    () => { const el = document.getElementById('quick-modal-overlay'); if (el && el.classList.contains('open')) { closeQuickModal(); return true; } },
    () => { const el = document.getElementById('item-detail-panel'); if (el && el.classList.contains('open')) { if (typeof closeItemPanel === 'function') closeItemPanel(); return true; } },
    () => { const el = document.getElementById('item-editor-overlay'); if (el && el.offsetParent !== null) { if (typeof closeItemEditor === 'function') closeItemEditor(); return true; } },
    () => { const el = document.getElementById('merge-diff-overlay'); if (el && el.offsetParent !== null) { if (typeof showMergeDiffPanel === 'function') { const p = document.getElementById('item-viz-overlay'); if (p && !p.classList.contains('hidden')) { if (typeof _itemVizClose === 'function') _itemVizClose(); return true; } } } },
    () => { const el = document.getElementById('item-viz-overlay'); if (el && !el.classList.contains('hidden')) { if (typeof _itemVizClose === 'function') _itemVizClose(); return true; } },
    () => { const el = document.getElementById('pend-overlay'); if (el && el.offsetParent !== null) { if (typeof closePendPanel === 'function') closePendPanel(); return true; } },
    () => { const el = document.getElementById('proj-modal-overlay'); if (el && el.offsetParent !== null) { if (typeof closeProjModal === 'function') closeProjModal(); return true; } },
    () => { const el = document.getElementById('proj-panel-overlay'); if (el && el.offsetParent !== null) { if (typeof closeProjPanel === 'function') closeProjPanel(); return true; } },
    () => { const el = document.getElementById('pulso-panel'); if (el && el.offsetParent !== null) { if (typeof closePulsoPanel === 'function') closePulsoPanel(); return true; } },
    () => { if (focusActiveId) { exitFocusMode(); return true; } },
  ];
  for (const check of _overlayChecks) {
    if (check()) return;
  }
}

// T-202605-460: click fuera del panel search-unified-results lo cierra
document.addEventListener('click', e => {
  const panel = document.getElementById('search-unified-results');
  if (!panel) return;
  const input = document.getElementById('search-global');
  if (!panel.contains(e.target) && e.target !== input) panel.remove();
}, true);

document.addEventListener('keydown', e => {
  // T-202604-418: Escape en cascada — prioridad absoluta
  if (e.key === 'Escape') {
    _escCascade();
    return;
  }

  // T-202604-418: Cmd+K / Ctrl+K → command palette
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    openCommandPalette();
    return;
  }

  // T-202605-442: Cmd+? → referencia de atajos (Cmd+Shift+/ y Cmd+?)
  if ((e.metaKey || e.ctrlKey) && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
    e.preventDefault();
    if (typeof openShortcutsRef === 'function') openShortcutsRef();
    return;
  }

  // T-202604-208: Ctrl+F / Cmd+F → focus búsqueda global
  if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
    const si = document.getElementById('search-global');
    if (!si) return;
    e.preventDefault();
    si.focus();
    si.select();
    return;
  }

  // R-202604-043: keyboard shortcuts globales
  // Desactivados cuando el foco está en input/textarea/contenteditable
  const _tag = document.activeElement ? document.activeElement.tagName : '';
  const _editable = document.activeElement ? document.activeElement.isContentEditable : false;
  const _inInput = _tag === 'INPUT' || _tag === 'TEXTAREA' || _tag === 'SELECT' || _editable;

  // Chord G + letra — navegar entre tabs (configurable)
  const _hasChordWithG = _SHORTCUT_DEFS && _SHORTCUT_DEFS.some(d => d.chord && (_shortcutKey(d.id) || '').startsWith('g'));
  if (!_inInput && !e.ctrlKey && !e.metaKey && !e.altKey && e.key === 'g' && _hasChordWithG) {
    window._gChordPending = true;
    clearTimeout(window._gChordTimer);
    window._gChordTimer = setTimeout(() => { window._gChordPending = false; }, 1000);
    e.preventDefault();
    return;
  }
  if (window._gChordPending && !e.ctrlKey && !e.metaKey && !e.altKey) {
    window._gChordPending = false;
    clearTimeout(window._gChordTimer);
    const _letter = e.key.toLowerCase();
    const _chordDef = _SHORTCUT_DEFS && _SHORTCUT_DEFS.find(d => {
      if (!d.chord) return false;
      const active = _shortcutKey(d.id) || '';
      return active.replace('g+', '') === _letter;
    });
    if (_chordDef) {
      e.preventDefault();
      const _tabIdMap = {
        'tab-tracker': 'tracker', 'tab-backlog': 'backlog',
        'tab-analytics': 'analytics', 'tab-proyectos': 'proyectos'
      };
      const _dest = _tabIdMap[_chordDef.id];
      if (_dest && typeof switchTab === 'function') switchTab(_dest);
    }
    return;
  }

  if (_inInput || e.ctrlKey || e.metaKey || e.altKey) return;

  // T-202605-442 + T-202604-418: dispatch por tecla configurada
  const _pressedKey = e.key.toLowerCase();

  // T-202604-420: '/' → foco en búsqueda global (solo si foco no está en campo de texto)
  if (_pressedKey === '/' && !_inInput) {
    e.preventDefault();
    const si = document.getElementById('search-global');
    if (!si) return;
    si.focus();
    si.select();
    return;
  }

  // T-202604-418: N → nota rápida (openQuickNote)
  if (_pressedKey === _sk('quick-note')) {
    e.preventDefault();
    if (typeof openQuickNote === 'function') openQuickNote();
    return;
  }

  // T-202604-418: Shift+N → nuevo ítem
  if (e.shiftKey && e.key === 'N') {
    e.preventDefault();
    if (typeof openItemEditor === 'function') openItemEditor(null);
    return;
  }

  // T-202604-418: S → guardar sesión activa si hay borrador pendiente
  if (_pressedKey === _sk('save-session')) {
    e.preventDefault();
    // Detecta IA con borrador activo — textarea con contenido
    const _activeTA = document.querySelector('.main-textarea:not([readonly])');
    if (_activeTA && _activeTA.value.trim()) {
      const _aiId = _activeTA.closest('[data-ai-id]') && _activeTA.closest('[data-ai-id]').dataset.aiId;
      const _sbtn = _aiId
        ? document.getElementById(`sbtn-${_aiId}`)
        : document.querySelector('.save-btn');
      if (_sbtn) _sbtn.click();
    } else {
      // Fallback: llamar confirmSave con el AI activo en focusMode
      if (focusActiveId && typeof confirmSave === 'function') confirmSave(focusActiveId);
    }
    return;
  }

  // T-202604-418: F → toggle focus mode
  if (_pressedKey === _sk('toggle-focus')) {
    e.preventDefault();
    if (focusActiveId) {
      exitFocusMode();
    } else {
      // Activar focus en el AI activo en tab tracker si hay uno en sesión
      const _inSessCard = document.querySelector('.card.in-session-state');
      if (_inSessCard) {
        const _ta = _inSessCard.querySelector('.main-textarea');
        if (_ta) _ta.focus();
      }
    }
    return;
  }

  // T-202604-418: / → búsqueda global (cuando no está en input)
  if (e.key === '/') {
    e.preventDefault();
    const si = document.getElementById('search-global');
    if (si) { si.focus(); si.select(); }
    return;
  }

  if (_pressedKey === _sk('search')) {
    // Búsqueda en tab activo (F — ahora reasignado a focus; / es búsqueda global)
    e.preventDefault();
    const _searches = ['backlog-search', 'search-global', 'log-search', 'context-search', 'map-search'];
    for (const sid of _searches) {
      const sel = document.getElementById(sid);
      if (sel && sel.offsetParent !== null) { sel.focus(); sel.select(); break; }
    }
    return;
  }
  if (_pressedKey === _sk('paste-ckpt')) {
    e.preventDefault();
    if (typeof switchTab === 'function') switchTab('backlog');
    setTimeout(() => {
      if (typeof switchSubTab === 'function') switchSubTab('tracker');
      const _standalonePanel = document.getElementById('sspanel-tracker');
      if (_standalonePanel) _standalonePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return;
  }

  // T-202604-418: J/K → navegan en cualquier lista activa (no solo backlog)
  if (_pressedKey === _sk('nav-up') || _pressedKey === _sk('nav-down')) {
    e.preventDefault();
    const _dir = _pressedKey === _sk('nav-down') ? 1 : -1;

    // Intentar primero en backlog, luego en log (historial), luego en lista de tracker
    const _selectors = [
      '.backlog-item:not([style*="display: none"]):not([style*="display:none"])',
      '.log-card',
      '.hoy-mini-card',
    ];
    let _handled = false;
    for (const _sel of _selectors) {
      const _items = Array.from(document.querySelectorAll(_sel)).filter(el => el.offsetParent !== null);
      if (!_items.length) continue;
      const _cur = _items.findIndex(el => el.classList.contains('kb-selected'));
      let _next = _cur + _dir;
      if (_next < 0) _next = _items.length - 1;
      if (_next >= _items.length) _next = 0;
      _items.forEach(el => el.classList.remove('kb-selected'));
      _items[_next].classList.add('kb-selected');
      _items[_next].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      _handled = true;
      break;
    }
    return;
  }

  // T-202604-418: Enter → abre detalle del ítem seleccionado en cualquier lista
  if (e.key === 'Enter') {
    const _selBL = document.querySelector('.backlog-item.kb-selected');
    if (_selBL) {
      e.preventDefault();
      const _code = _selBL.dataset.code;
      if (_code && typeof navigateToItem === 'function') navigateToItem(_code);
      else if (typeof openItemPanel === 'function') {
        const _item = _selBL.dataset.id && (typeof ITEMS !== 'undefined') && ITEMS.find(i => i.id === _selBL.dataset.id);
        if (_item) openItemPanel(_item);
      }
      return;
    }
    const _selLog = document.querySelector('.log-card.kb-selected');
    if (_selLog) {
      e.preventDefault();
      _selLog.click();
      return;
    }
    return;
  }

  if (_pressedKey === _sk('edit-item')) {
    if (currentTab !== 'backlog') return;
    const _sel = document.querySelector('.backlog-item.kb-selected');
    if (!_sel) return;
    e.preventDefault();
    const _code = _sel.dataset.code;
    if (_code && typeof openItemEditor === 'function') openItemEditor(null, _code);
    return;
  }
});

// ── T-202604-418: Command Palette | T-202604-419: recientes, fuzzy, ítems por código ──

const _CP_HISTORY_KEY = 'cp-history';
const _CP_MAX_HISTORY = 5;

function _cpHistoryLoad() {
  try { return JSON.parse(localStorage.getItem(_CP_HISTORY_KEY) || '[]'); } catch(_) { return []; }
}
function _cpHistorySave(cmds) {
  localStorage.setItem(_CP_HISTORY_KEY, JSON.stringify(cmds.slice(0, _CP_MAX_HISTORY)));
}
function _cpHistoryAdd(cmd) {
  const hist = _cpHistoryLoad().filter(c => c.id !== cmd.id);
  hist.unshift(cmd);
  _cpHistorySave(hist);
}

// T-202604-419: fuzzy match mejorado — normaliza acentos, char-by-char
function _cpFuzzy(str, q) {
  if (!str || !q) return false;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const s = norm(str), query = norm(q);
  if (s.includes(query)) return true;
  let si = 0;
  for (let qi = 0; qi < query.length; qi++) {
    const f = s.indexOf(query[qi], si);
    if (f === -1) return false;
    si = f + 1;
  }
  return true;
}

// T-202604-419: ítems del backlog activo para búsqueda por código
function _cpBacklogItems() {
  try {
    const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
    const key = proj ? `backlog-items-${proj.id}` : 'backlog-items';
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch(_) { return []; }
}

// Definición de comandos estáticos del palette
function _cpCommands() {
  const cmds = [
    // Navegación entre tabs
    { id: 'nav-tracker',   label: 'Ir a Tracker',       icon: '📡', group: 'Navegación', action: () => { if (typeof switchTab === 'function') switchTab('tracker'); } },
    { id: 'nav-backlog',   label: 'Ir a Backlog',        icon: '📋', group: 'Navegación', action: () => { if (typeof switchTab === 'function') switchTab('backlog'); } },
    { id: 'nav-analytics', label: 'Ir a Analytics',      icon: '📊', group: 'Navegación', action: () => { if (typeof switchTab === 'function') switchTab('analytics'); } },
    { id: 'nav-proyectos', label: 'Ir a Proyectos',      icon: '🗂️', group: 'Navegación', action: () => { if (typeof switchTab === 'function') switchTab('proyectos'); } },
    // Acciones globales
    { id: 'new-note',       label: 'Nueva nota rápida',          icon: '✏️', group: 'Acciones', action: () => { if (typeof openQuickNote === 'function') openQuickNote(); } },
    { id: 'new-item',       label: 'Nuevo ítem de backlog',       icon: '＋', group: 'Acciones', action: () => { if (typeof openItemEditor === 'function') openItemEditor(null); } },
    { id: 'new-session',    label: 'Nueva sesión rápida',         icon: '⚡', group: 'Acciones', action: () => { if (typeof openQuickCapture === 'function') openQuickCapture(); } },
    { id: 'close-sprint',   label: 'Cerrar sprint activo',        icon: '🏁', group: 'Acciones', action: () => {
      const active = (typeof getActiveSprints === 'function') ? getActiveSprints() : [];
      if (active && active.length > 0) { if (typeof confirmCloseSprint === 'function') confirmCloseSprint(active[0].id); }
      else if (typeof showToast === 'function') showToast('info', 'No hay sprint activo para cerrar');
    }},
    { id: 'standalone-ckpt',label: 'Checkpoint standalone',       icon: '📋', group: 'Acciones', action: () => { if (typeof openStandaloneCheckpoint === 'function') openStandaloneCheckpoint(); } },
    { id: 'search-global',  label: 'Buscar…',                     icon: '🔍', group: 'Acciones', action: () => { const si = document.getElementById('search-global'); if (si) { si.focus(); si.select(); } } },
    { id: 'export-backlog', label: 'Exportar Backlog',             icon: '⬇️', group: 'Acciones', action: () => { if (typeof exportBacklogMd === 'function') exportBacklogMd(); } },
    { id: 'shortcuts-ref',  label: 'Ver atajos de teclado',        icon: '⌨️', group: 'Acciones', action: () => { if (typeof openShortcutsRef === 'function') openShortcutsRef(); } },
    { id: 'toggle-theme',   label: 'Cambiar tema (claro/oscuro)', icon: '🌓', group: 'Acciones', action: () => { if (typeof toggleTheme === 'function') toggleTheme(); } },
  ];

  // Proyectos activos — cambiar proyecto activo
  if (typeof state !== 'undefined' && state.projects) {
    state.projects.filter(p => !p.archived).forEach(p => {
      cmds.push({
        id: `proj-${p.id}`,
        label: `Cambiar a proyecto: ${p.name}`,
        icon: p.icon || '📁',
        group: 'Proyectos',
        action: () => { if (typeof selectProjectFilter === 'function') selectProjectFilter(p.id); }
      });
    });
  }

  return cmds;
}

// Fix Finn: comandos dinámicos — sesiones del proyecto activo (grupo Sesiones en palette)
function _cpSessionCommands(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const allSessions = [];
  (typeof state !== 'undefined' ? (state.projects || []) : []).forEach(proj => {
    (proj.sessions || []).forEach(s => {
      if (
        (s.title || '').toLowerCase().includes(q) ||
        (s.summary || '').toLowerCase().includes(q)
      ) {
        const ai = (state.ais || []).find(a => a.id === s.aiId);
        allSessions.push({ s, ai });
      }
    });
  });
  allSessions.sort((a, b) => parseInt(b.s.id || 0) - parseInt(a.s.id || 0));
  return allSessions.slice(0, 6).map(({ s, ai }) => ({
    id: 'sess-' + s.id,
    label: s.title || '(sin título)',
    icon: '📄',
    group: 'Sesiones',
    action: function() {
      if (ai && typeof openDetail === 'function') openDetail(ai.id, s.id);
    }
  }));
}

// T-202604-419: comandos dinámicos — ítems del backlog por código (ej: "T-419", "R-082")
function _cpItemCommands(query) {
  const typeIcons = { P: '💡', T: '🎫', R: '📦', B: '🐛' };
  const codeRx = /^[ptrb]-?\d{2,}/i;
  if (!codeRx.test(query.trim())) return [];
  const q = query.trim().toUpperCase().replace(/-/g, '');
  return _cpBacklogItems()
    .filter(item => {
      const code = (item.code || '').toUpperCase().replace(/-/g, '');
      return code.includes(q);
    })
    .slice(0, 6)
    .map(item => ({
      id: `item-${item.code}`,
      label: `${item.code}: ${(item.title || item.desc || '').slice(0, 50)}`,
      icon: typeIcons[item.type] || '•',
      group: 'Ítems',
      action: () => { if (typeof navigateToItem === 'function') navigateToItem(item.code); }
    }));
}

let _cpSelectedIdx = 0;

function openCommandPalette() {
  const overlay = document.getElementById('cmd-palette-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  const input = document.getElementById('cmd-palette-input');
  if (input) { input.value = ''; setTimeout(() => input.focus(), 30); }
  _cpSelectedIdx = 0;
  _cpRender('');
}

function closeCommandPalette() {
  const overlay = document.getElementById('cmd-palette-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function _cpRender(query) {
  const list = document.getElementById('cmd-palette-list');
  if (!list) return;

  const q = query.trim();
  const allCmds = _cpCommands();
  let items;

  if (!q) {
    // T-202604-419: sin query → recientes primero (con badge), luego todos
    const hist = _cpHistoryLoad();
    const histIds = hist.map(h => h.id);
    const histCmds = histIds.map(id => allCmds.find(c => c.id === id)).filter(Boolean)
                            .map(c => ({ ...c, _recent: true }));
    const rest = allCmds.filter(c => !histIds.includes(c.id));
    items = [...histCmds, ...rest];
  } else {
    // T-202604-419: fuzzy match mejorado + ítems por código
    // Fix Finn: agregar sesiones como grupo dinámico
    const staticMatches = allCmds.filter(c => _cpFuzzy(c.label, q));
    const itemMatches   = _cpItemCommands(q);
    const sessMatches   = _cpSessionCommands(q);
    items = [...staticMatches, ...itemMatches, ...sessMatches];
  }

  if (!items.length) {
    list.innerHTML = '<div class="cp-empty">Sin resultados</div>';
    list._cpFlat = [];
    return;
  }

  // Agrupar por grupo (recientes primero si presentes)
  const groups = {};
  items.forEach(c => {
    const g = c._recent ? 'Recientes' : (c.group || 'General');
    if (!groups[g]) groups[g] = [];
    groups[g].push(c);
  });

  const flat = items;
  if (_cpSelectedIdx >= flat.length) _cpSelectedIdx = 0;

  list.innerHTML = Object.entries(groups).map(([group, cmds]) => {
    const rows = cmds.map(c => {
      const idx = flat.indexOf(c);
      const isSel = idx === _cpSelectedIdx;
      const recentBadge = c._recent ? '<span class="cp-badge-recent">reciente</span>' : '';
      return `<div class="cp-item${isSel ? ' cp-item--selected' : ''}" data-cp-idx="${idx}" onclick="_cpExecute(${idx})" onmouseenter="_cpHover(${idx})">
        <span class="cp-item-icon">${c.icon}</span>
        <span class="cp-item-label">${c.label}</span>
        ${recentBadge}
      </div>`;
    }).join('');
    return `<div class="cp-group"><div class="cp-group-label">${group}</div>${rows}</div>`;
  }).join('');

  list._cpFlat = flat;
}

function _cpHover(idx) {
  _cpSelectedIdx = idx;
  document.querySelectorAll('#cmd-palette-list .cp-item').forEach(el => {
    el.classList.toggle('cp-item--selected', parseInt(el.dataset.cpIdx) === idx);
  });
}

function _cpExecute(idx) {
  const list = document.getElementById('cmd-palette-list');
  const flat = list && list._cpFlat;
  const cmd = flat && flat[idx];
  if (!cmd) return;
  closeCommandPalette();
  _cpHistoryAdd({ id: cmd.id, label: cmd.label });
  setTimeout(() => cmd.action(), 60);
}

function _cpKeydown(e) {
  const list = document.getElementById('cmd-palette-list');
  const flat = list && list._cpFlat;
  if (!flat || !flat.length) return;

  if (e.key === 'Escape') { e.preventDefault(); closeCommandPalette(); return; }
  if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
    e.preventDefault();
    _cpSelectedIdx = (_cpSelectedIdx + 1) % flat.length;
    _cpRender(document.getElementById('cmd-palette-input').value);
    document.querySelector('#cmd-palette-list .cp-item--selected')?.scrollIntoView({ block: 'nearest' });
    return;
  }
  if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
    e.preventDefault();
    _cpSelectedIdx = (_cpSelectedIdx - 1 + flat.length) % flat.length;
    _cpRender(document.getElementById('cmd-palette-input').value);
    document.querySelector('#cmd-palette-list .cp-item--selected')?.scrollIntoView({ block: 'nearest' });
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    _cpExecute(_cpSelectedIdx);
    return;
  }
}

function _cpInput(e) {
  _cpSelectedIdx = 0;
  _cpRender(e.target.value);
}

// ── END T-202604-418 / T-202604-419 ───────────────────────────────────────

// ── T-202605-442: Atajos de teclado configurables ────────────────────────

const _SHORTCUTS_KEY = 'user-shortcuts';

// Definición canónica — id, label, grupo, default key, si es chord G+key
const _SHORTCUT_DEFS = [
  // Navegación de tabs (chord G+)
  { id: 'tab-tracker',   label: 'Ir a Tracker',                  group: 'Navegación', default: 'g+t', chord: true },
  { id: 'tab-backlog',   label: 'Ir a Backlog',                   group: 'Navegación', default: 'g+d', chord: true },
  { id: 'tab-analytics', label: 'Ir a Analytics',                 group: 'Navegación', default: 'g+a', chord: true },
  { id: 'tab-proyectos', label: 'Ir a Proyectos',                 group: 'Navegación', default: 'g+p', chord: true },
  // Acciones globales — T-202604-418
  { id: 'quick-note',    label: 'Nueva nota rápida',              group: 'Acciones',   default: 'n',   chord: false },
  { id: 'save-session',  label: 'Guardar sesión activa',          group: 'Acciones',   default: 's',   chord: false },
  { id: 'toggle-focus',  label: 'Toggle modo protagonista',       group: 'Acciones',   default: 'f',   chord: false },
  { id: 'search',        label: 'Búsqueda en tab activo',         group: 'Acciones',   default: '/',   chord: false },
  { id: 'paste-ckpt',    label: 'Pegar CHECKPOINT',               group: 'Acciones',   default: 'p',   chord: false },
  // Backlog — T-202604-418 amplía J/K a cualquier lista activa
  { id: 'nav-up',        label: 'Ítem anterior (lista activa)',   group: 'Backlog',    default: 'j',   chord: false },
  { id: 'nav-down',      label: 'Ítem siguiente (lista activa)',  group: 'Backlog',    default: 'k',   chord: false },
  { id: 'edit-item',     label: 'Editar ítem seleccionado',       group: 'Backlog',    default: 'e',   chord: false },
];

// Carga y guarda
function _shortcutsLoad() {
  try {
    const raw = localStorage.getItem(_SHORTCUTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(_) { return {}; }
}

function _shortcutsSave(map) {
  localStorage.setItem(_SHORTCUTS_KEY, JSON.stringify(map));
}

// Resuelve la tecla activa de un shortcut (override o default)
function _shortcutKey(id) {
  const overrides = _shortcutsLoad();
  const def = _SHORTCUT_DEFS.find(d => d.id === id);
  if (!def) return null;
  return overrides[id] || def.default;
}

// Detecta conflictos: retorna id del shortcut que ya usa esa tecla, excluyendo el propio
function _shortcutConflict(key, excludeId) {
  const overrides = _shortcutsLoad();
  for (const def of _SHORTCUT_DEFS) {
    if (def.id === excludeId) continue;
    const active = overrides[def.id] || def.default;
    if (active.toLowerCase() === key.toLowerCase()) return def.id;
  }
  return null;
}

// Render del panel de configuración
function _shortcutsRender() {
  const body = document.getElementById('shortcuts-body');
  if (!body) return;
  const overrides = _shortcutsLoad();

  // Agrupar por grupo
  const groups = {};
  _SHORTCUT_DEFS.forEach(def => {
    if (!groups[def.group]) groups[def.group] = [];
    groups[def.group].push(def);
  });

  body.innerHTML = Object.entries(groups).map(([group, defs]) => {
    const rows = defs.map(def => {
      const active = overrides[def.id] || def.default;
      const isModified = !!overrides[def.id] && overrides[def.id] !== def.default;
      const displayKey = def.chord
        ? active.replace('+', ' → ').toUpperCase()
        : active.toUpperCase();
      return `<div class="sc-row" data-id="${def.id}">
        <span class="sc-row-label">${def.label}</span>
        <div class="sc-row-right">
          ${isModified ? `<span class="sc-modified-badge">modificado</span>` : ''}
          <kbd class="sc-key-pill${isModified ? ' is-modified' : ''}">${displayKey}</kbd>
          <button class="sc-edit-btn" onclick="_shortcutsStartEdit('${def.id}')" title="Cambiar atajo">✎</button>
          ${isModified ? `<button class="sc-reset-one-btn" onclick="_shortcutsResetOne('${def.id}')" title="Restaurar default">↺</button>` : ''}
        </div>
      </div>`;
    }).join('');
    return `<div class="sc-group">
      <div class="sc-group-label">${group}</div>
      ${rows}
    </div>`;
  }).join('');
}

// Iniciar edición inline de un atajo
function _shortcutsStartEdit(id) {
  const def = _SHORTCUT_DEFS.find(d => d.id === id);
  if (!def) return;
  const row = document.querySelector(`.sc-row[data-id="${id}"]`);
  if (!row) return;

  const overrides = _shortcutsLoad();
  const current = overrides[id] || def.default;

  row.innerHTML = `
    <span class="sc-row-label">${def.label}</span>
    <div class="sc-row-right sc-editing">
      <input class="sc-key-input" id="sc-input-${id}"
        value="${current}"
        placeholder="${def.chord ? 'ej: g+t' : 'ej: n'}"
        maxlength="5"
        onkeydown="_shortcutsCaptureKey(event,'${id}',${def.chord})"
        autocomplete="off" autocorrect="off" spellcheck="false">
      <span class="sc-error" id="sc-err-${id}"></span>
      <button class="sc-save-btn" onclick="_shortcutsSaveEdit('${id}',${def.chord})">Guardar</button>
      <button class="sc-cancel-btn" onclick="_shortcutsRender()">Cancelar</button>
    </div>`;

  const input = document.getElementById(`sc-input-${id}`);
  if (input) { input.focus(); input.select(); }
}

// Captura de tecla en modo edición — para atajos simples, detecta la tecla en keydown
function _shortcutsCaptureKey(e, id, isChord) {
  if (e.key === 'Escape') { _shortcutsRender(); return; }
  if (e.key === 'Enter') { _shortcutsSaveEdit(id, isChord); return; }
  if (isChord) return; // chord: usuario escribe manualmente (g+t)
  // atajo simple: capturar la tecla presionada (1 char, sin modificadores no-shift)
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;
  e.preventDefault();
  const input = document.getElementById(`sc-input-${id}`);
  if (input) input.value = e.key.toLowerCase();
}

function _shortcutsSaveEdit(id, isChord) {
  const input = document.getElementById(`sc-input-${id}`);
  if (!input) return;
  const errEl = document.getElementById(`sc-err-${id}`);
  const raw = input.value.trim().toLowerCase();

  // Validar formato
  if (!raw) { if (errEl) errEl.textContent = 'Escribe una tecla'; return; }
  if (isChord && !/^g\+[a-z]$/.test(raw)) {
    if (errEl) errEl.textContent = 'Formato: g+letra (ej: g+t)'; return;
  }
  if (!isChord && (raw.length !== 1 || !/[a-z]/.test(raw))) {
    if (errEl) errEl.textContent = 'Solo una letra (a-z)'; return;
  }

  // Verificar conflicto
  const conflict = _shortcutConflict(raw, id);
  if (conflict) {
    const conflictDef = _SHORTCUT_DEFS.find(d => d.id === conflict);
    if (errEl) errEl.textContent = `Conflicto con: ${conflictDef ? conflictDef.label : conflict}`;
    return;
  }

  const def = _SHORTCUT_DEFS.find(d => d.id === id);
  const overrides = _shortcutsLoad();
  if (raw === def.default) {
    delete overrides[id]; // restaurar = eliminar override
  } else {
    overrides[id] = raw;
  }
  _shortcutsSave(overrides);
  _shortcutsRender();
}

function _shortcutsResetOne(id) {
  const overrides = _shortcutsLoad();
  delete overrides[id];
  _shortcutsSave(overrides);
  _shortcutsRender();
}

function restoreDefaultShortcuts() {
  localStorage.removeItem(_SHORTCUTS_KEY);
  _shortcutsRender();
}

function openShortcuts() {
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    _shortcutsRender();
    _focusFirstInteractive('shortcuts-panel');
  }
}

function closeShortcuts(e) {
  if (e && e.target !== document.getElementById('shortcuts-overlay')) return;
  const overlay = document.getElementById('shortcuts-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// Referencia rápida Cmd+? — lista todos los atajos activos
function openShortcutsRef() {
  const overlay = document.getElementById('shortcuts-ref-overlay');
  const body = document.getElementById('shortcuts-ref-body');
  if (!overlay || !body) return;

  const overrides = _shortcutsLoad();
  const groups = {};
  _SHORTCUT_DEFS.forEach(def => {
    if (!groups[def.group]) groups[def.group] = [];
    groups[def.group].push(def);
  });

  body.innerHTML = Object.entries(groups).map(([group, defs]) => {
    const rows = defs.map(def => {
      const active = overrides[def.id] || def.default;
      const display = def.chord
        ? active.replace('+', ' → ').toUpperCase()
        : active.toUpperCase();
      return `<div class="scr-row">
        <kbd class="scr-key">${display}</kbd>
        <span class="scr-label">${def.label}</span>
      </div>`;
    }).join('');
    return `<div class="scr-group">
      <div class="scr-group-label">${group}</div>
      ${rows}
    </div>`;
  }).join('') +
  `<div class="scr-group scr-group--fixed">
    <div class="scr-group-label">Sistema (no configurables)</div>
    <div class="scr-row"><kbd class="scr-key">ESC</kbd><span class="scr-label">Cerrar en cascada / salir modo protagonista</span></div>
    <div class="scr-row"><kbd class="scr-key">⌘K</kbd><span class="scr-label">Command palette</span></div>
    <div class="scr-row"><kbd class="scr-key">⌘?</kbd><span class="scr-label">Esta referencia de atajos</span></div>
    <div class="scr-row"><kbd class="scr-key">⌘F</kbd><span class="scr-label">Búsqueda global</span></div>
    <div class="scr-row"><kbd class="scr-key">⇧N</kbd><span class="scr-label">Nuevo ítem</span></div>
    <div class="scr-row"><kbd class="scr-key">ENTER</kbd><span class="scr-label">Abrir detalle del ítem seleccionado</span></div>
  </div>`;

  overlay.classList.remove('hidden');
}

function closeShortcutsRef(e) {
  if (e && e.target !== document.getElementById('shortcuts-ref-overlay')) return;
  const overlay = document.getElementById('shortcuts-ref-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ── Integración con el handler global de keydown ─────────────────────────
// Helpers para resolver teclas activas desde el handler existente

function _sk(id) { return _shortcutKey(id); }  // shorthand interno

// ── END T-202605-442 ─────────────────────────────────────────────────────

const _modalTriggerMap = new Map(); // modal id → elemento que tenía foco antes de abrir

function _saveModalTrigger(id) {
  const active = document.activeElement;
  if (active && active !== document.body) _modalTriggerMap.set(id, active);
}

function _restoreModalFocus(id) {
  const trigger = _modalTriggerMap.get(id);
  if (trigger && typeof trigger.focus === 'function') {
    try { trigger.focus(); } catch(_) {}
  }
  _modalTriggerMap.delete(id);
}

function _focusFirstInteractive(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const sel = 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])';
  const el = container.querySelector(sel);
  if (el) setTimeout(() => el.focus(), 50);
}

// T-202604-295: trigger de descarga de templates — 'session' (default) | 'sprint'
const _TPL_TRIGGER_KEY = 'template-download-trigger';
function _templateTrigger() {
  return localStorage.getItem(_TPL_TRIGGER_KEY) || 'session';
}
function _autoDownloadOn() {
  // Backward compat — ON si trigger es 'session' (comportamiento original)
  return _templateTrigger() === 'session';
}
function toggleAutoDownload() {
  const next = _templateTrigger() === 'session' ? 'sprint' : 'session';
  localStorage.setItem(_TPL_TRIGGER_KEY, next);
  _updateAutoDownloadLabel();
}
function _updateAutoDownloadLabel() {
  const btn = document.getElementById('more-menu-autodl');
  if (btn) btn.textContent = `⬇ Descargar templates: ${_templateTrigger() === 'session' ? 'al guardar sesión' : 'al cerrar sprint'}`;
}
// Inicializar label al cargar
(function _initAutoDlLabel() {
  const btn = document.getElementById('more-menu-autodl');
  if (btn) btn.textContent = `⬇ Descargar templates: ${_templateTrigger() === 'session' ? 'al guardar sesión' : 'al cerrar sprint'}`;
})();


(function _initSearchTooltip() {
  const si = document.getElementById('search-global');
  if (!si) return;
  const container = si.closest('.header-search');
  if (!container) return;
  const btn = container.querySelector('button, [role="button"]');
  if (btn && !btn.title) btn.title = 'Ctrl+F';
})();

// Click fuera del card activo para salir
document.addEventListener('click', e => {
  if (!focusActiveId) return;
  const activeCard = document.getElementById('card-' + focusActiveId);
  if (activeCard && !activeCard.contains(e.target)) exitFocusMode();
}, true);

// ── T-052: Vista Hoy ──
// ─── Utilidad countdown para tab Hoy ─────────────────────────────────────────
function _hoyMsUntilReset(ai) {
  if (!ai.resetTime) return Infinity;
  const [h, m] = ai.resetTime.split(':').map(Number);
  const r = new Date(); r.setHours(h, m, 0, 0);
  if (r <= new Date()) r.setDate(r.getDate() + 1);
  return r - new Date();
}

function _hoyCountdownLabel(ms) {
  if (!isFinite(ms) || ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function _hoyGetProjName(ai) {
  const lastSess = getLastAISession(ai.id);
  if (!lastSess || !lastSess.projectId) return '';
  const proj = getProjectById(lastSess.projectId);
  if (!proj) return '';
  return (proj.icon ? proj.icon + ' ' : '') + proj.name;
}

// Tiempo que lleva disponible — última sesión más antigua = primero
function _hoyAvailableSince(ai) {
  const last = getLastAISession(ai.id);
  if (!last || !last.date) return 0;
  return new Date(last.date).getTime();
}

// Ticker global para countdowns en tab Hoy
let _hoyTickerInterval = null;
function _startHoyTicker() {
  _stopHoyTicker();
  _hoyTickerInterval = setInterval(() => {
    if (currentTab !== 'hoy') { _stopHoyTicker(); return; }
    document.querySelectorAll('[data-hoy-ai-id]').forEach(el => {
      const ai = getAI(el.dataset.hoyAiId);
      if (!ai || ai.status !== 'exhausted') return;
      const ms = _hoyMsUntilReset(ai);
      const cdEl = el.querySelector('.hoy-exh-countdown');
      if (!cdEl) return;
      cdEl.textContent = _hoyCountdownLabel(ms);
      cdEl.classList.toggle('soon', ms < 30 * 60000);
      if (ms <= 0) renderHoy();
    });
  }, 1000);
}
function _stopHoyTicker() {
  if (_hoyTickerInterval) { clearInterval(_hoyTickerInterval); _hoyTickerInterval = null; }
}

// Ticker de countdown para IAs agotadas en el sidebar del Tab Tracker
let _sidebarTickerInterval = null;
function _startSidebarTicker() {
  _stopSidebarTicker();
  _sidebarTickerInterval = setInterval(() => {
    const exhausted = state.ais.filter(ai => !ai.archived && ai.status === 'exhausted' && ai.resetTime);
    if (!exhausted.length) { _stopSidebarTicker(); return; }
    let anyExpired = false;
    exhausted.forEach(ai => {
      const el = document.getElementById('tsb-row-' + ai.id);
      if (el) {
        let cdEl = el.querySelector('.tsb-ai-cd');
        const [hh, mm] = ai.resetTime.split(':').map(Number);
        const now = new Date();
        const reset = new Date(now); reset.setHours(hh, mm, 0, 0);
        if (reset <= now) reset.setDate(reset.getDate() + 1);
        const diff = Math.max(0, Math.round((reset - now) / 60000));
        if (diff === 0) { anyExpired = true; }
        else {
          const h = Math.floor(diff / 60), m = diff % 60;
          const label = `${h}h${String(m).padStart(2,'0')}`;
          if (!cdEl) { cdEl = document.createElement('span'); cdEl.className = 'tsb-ai-cd'; el.appendChild(cdEl); }
          cdEl.textContent = label;
        }
      }
      // T-202604-254: update radar sidebar countdown
      const rsbCard = document.getElementById('rsb-card-' + ai.id);
      if (rsbCard) {
        const cdEl = rsbCard.querySelector('.rsb-countdown');
        if (cdEl) { cdEl.textContent = getCD(ai.resetTime, ai.resetEpoch) || '--:--:--'; }
      }
      // B-255: update card unlock label in real time
      const unlockLblEl = document.getElementById('unlock-lbl-' + ai.id);
      if (unlockLblEl) {
        const msLeft = _hoyMsUntilReset(ai);
        if (!isFinite(msLeft) || msLeft <= 0) {
          unlockLblEl.textContent = 'Disponible ahora';
        } else {
          const totalMin = Math.floor(msLeft / 60000);
          const h = Math.floor(totalMin / 60);
          const m = totalMin % 60;
          unlockLblEl.textContent = h === 0
            ? `Disponible en ${m}min`
            : `Disponible en ${h}h ${String(m).padStart(2,'0')}min`;
        }
      }
    });
    if (anyExpired) { render(); }
  }, 1000); // T-202604-302: cada 1s — countdown live sin interacción
}
function _stopSidebarTicker() {
  if (_sidebarTickerInterval) { clearInterval(_sidebarTickerInterval); _sidebarTickerInterval = null; }
}

// T-202604-324: mini progress dots del ecosistema en el header nav
function renderProjDots() {
  // Eliminado — ruido con pocos proyectos activos
}

function renderHoy() {
  const el = document.getElementById('hoy-content');
  if (!el) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const allSess = getAllSessions();

  // ── Stats: Hoy / Semana / Mes / Total ──────────────────────────────────
  function _wkStart(offsetWeeks) {
    const d = new Date(now); const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day) + offsetWeeks * 7); d.setHours(0,0,0,0); return d;
  }
  function _moStart(offsetMonths) {
    return new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1, 0, 0, 0, 0);
  }
  const wkFrom  = _wkStart(0).getTime();  const wkPrev = _wkStart(-1).getTime();
  const moFrom  = _moStart(0).getTime();  const moPrev = _moStart(-1).getTime(); const moPrevEnd = _moStart(0).getTime() - 1;
  const dayFrom = new Date(now).setHours(0,0,0,0);
  const prevDayFrom = dayFrom - 86400000;

  const sHoy  = allSess.filter(s => s.date && new Date(s.date).getTime() >= dayFrom).length;
  const sHoyPrev = allSess.filter(s => { const t = s.date && new Date(s.date).getTime(); return t && t >= prevDayFrom && t < dayFrom; }).length;
  const sSemC = allSess.filter(s => s.date && new Date(s.date).getTime() >= wkFrom).length;
  const sSemP = allSess.filter(s => { const t = s.date && new Date(s.date).getTime(); return t && t >= wkPrev && t < wkFrom; }).length;
  const sMesC = allSess.filter(s => s.date && new Date(s.date).getTime() >= moFrom).length;
  const sMesP = allSess.filter(s => { const t = s.date && new Date(s.date).getTime(); return t && t >= moPrev && t < moPrevEnd; }).length;
  const sTotal = allSess.length;

  function _delta(curr, prev) {
    const d = curr - prev;
    if (d > 0) return `<span class="radar-delta radar-delta--up">+${d}</span>`;
    if (d < 0) return `<span class="radar-delta radar-delta--neutral">${d}</span>`;
    return `<span class="radar-delta radar-delta--neutral">=</span>`;
  }

  // ── Último checkpoint global ───────────────────────────────────────────
  const allSessSorted = [...allSess].filter(s => s.date).sort((a,b) => new Date(b.date) - new Date(a.date));
  const lastCkpt = allSessSorted.length ? allSessSorted[0] : null;
  function _lastCkptLabel() {
    if (!lastCkpt) return '—';
    const d = new Date(lastCkpt.date);
    if (isNaN(d)) return '—';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return 'ahora';
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `${diffH}h`;
    return `${Math.floor(diffH/24)}d`;
  }

  // ── Proyecto más activo del mes ─────────────────────────────────────────
  const activeProjects = (state.projects || []).filter(p => p.status !== 'paused' && (p.sessions || []).length > 0);
  const projMonthStats = activeProjects.map(p => ({
    name: (p.icon ? p.icon + ' ' : '') + p.name,
    count: (p.sessions || []).filter(s => s.date && new Date(s.date).getTime() >= moFrom).length
  })).filter(p => p.count > 0).sort((a,b) => b.count - a.count);
  const topProj = projMonthStats[0] || null;

  // ── Racha de días activos ───────────────────────────────────────────────
  function _calcStreak() {
    const dayKeys = new Set(allSess.filter(s => s.date).map(s => s.date.split('T')[0]));
    let streak = 0;
    const d = new Date(now);
    // if no session today, start checking from yesterday
    const todayKey = d.toISOString().split('T')[0];
    if (!dayKeys.has(todayKey)) { d.setDate(d.getDate() - 1); }
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (!dayKeys.has(key)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }
  const streak = _calcStreak();

  // ── Hora pico ───────────────────────────────────────────────────────────
  function _peakHour() {
    const counts = new Array(24).fill(0);
    allSess.filter(s => s.date).forEach(s => {
      const h = new Date(s.date).getHours();
      if (!isNaN(h)) counts[h]++;
    });
    const max = Math.max(...counts);
    if (max === 0) return null;
    const h = counts.indexOf(max);
    const ampm = h < 12 ? 'am' : 'pm';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { label: `${h12}${ampm}`, count: max };
  }
  const peak = _peakHour();

  // ── Sesiones completas vs quick ─────────────────────────────────────────
  const completas = allSess.filter(s => !s.quickCapture).length;
  const rapidas   = allSess.filter(s => s.quickCapture).length;

  // ── Promedio de sesiones por día activo ────────────────────────────────
  function _avgPerActiveDay() {
    const dayKeys = new Set(allSess.filter(s => s.date).map(s => s.date.split('T')[0]));
    if (!dayKeys.size) return '—';
    return (allSess.length / dayKeys.size).toFixed(1);
  }
  const avgPerDay = _avgPerActiveDay();

  // ── Stats grid ─────────────────────────────────────────────────────────
  const statsHTML = `<div class="radar-stats-grid">
    <div class="radar-card radar-card-accent">
      <div class="radar-card-label">Último checkpoint</div>
      <div class="radar-card-value">${_lastCkptLabel()}</div>
      <div class="radar-card-sub">${lastCkpt ? esc(lastCkpt.title || '').slice(0,28) || '—' : '—'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Hoy ${_delta(sHoy, sHoyPrev)}</div>
      <div class="radar-card-value">${sHoy}</div>
      <div class="radar-card-sub">semana: ${sSemC} ${_delta(sSemC, sSemP)}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Este mes ${_delta(sMesC, sMesP)}</div>
      <div class="radar-card-value">${sMesC}</div>
      <div class="radar-card-sub">total: ${sTotal} sesiones</div>
    </div>
    <div class="radar-card${streak >= 3 ? ' radar-card-streak' : ''}">
      <div class="radar-card-label">Racha activa</div>
      <div class="radar-card-value">${streak}<span class="radar-streak-unit">${streak === 1 ? 'día' : 'días'}</span></div>
      <div class="radar-card-sub">${streak >= 7 ? '🔥 Semana completa' : streak >= 3 ? '✨ En racha' : streak > 0 ? 'sigue así' : 'sin sesiones hoy'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Proyecto del mes</div>
      <div class="radar-card-value radar-card-value--sm radar-card-value--truncate">${topProj ? esc(topProj.name).slice(0,18) : '—'}</div>
      <div class="radar-card-sub">${topProj ? topProj.count + ' checkpoints' : 'sin actividad'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Hora pico</div>
      <div class="radar-card-value">${peak ? peak.label : '—'}</div>
      <div class="radar-card-sub">${peak ? peak.count + ' sesiones a esa hora' : 'sin datos'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Completas / Rápidas</div>
      <div class="radar-card-value radar-card-value--sm">${completas}<span class="radar-card-value-secondary"> / ${rapidas}</span></div>
      <div class="radar-card-sub">${sTotal ? Math.round(completas/sTotal*100) + '% con protocolo' : '—'}</div>
    </div>
    <div class="radar-card">
      <div class="radar-card-label">Promedio / día activo</div>
      <div class="radar-card-value">${avgPerDay}</div>
      <div class="radar-card-sub">sesiones por día con actividad</div>
    </div>
  </div>`;

  // ── Clasificar IAs ────────────────────────────────────────────────────────
  const allAIs = state.ais.filter(a => !a.archived);
  const interrupted = allAIs.filter(a => a.interrupted);
  // T-182: En curso = IAs con draft activo (estado morado), excluidas de Disponibles
  const inSession   = allAIs.filter(a => !a.interrupted && _isInSession(a));
  const available   = allAIs
    .filter(a => a.status === 'available' && !a.interrupted && !_isInSession(a))
    .sort((a, b) => _hoyAvailableSince(a) - _hoyAvailableSince(b)); // más antigua primero
  const exhausted   = allAIs
    .filter(a => a.status === 'exhausted' && !a.interrupted)
    .sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b));   // próxima a liberarse primero

  let html = statsHTML;

  // ── Interrumpidas — mini-card naranja ────────────────────────────────────
  if (interrupted.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🟠 En curso (${interrupted.length})</div>
      <div class="hoy-available-grid">`;
    interrupted.forEach((ai, i) => { html += buildHoyCard(ai, i); });
    html += `</div></div>`;
  }

  // ── En curso — IAs con draft activo / estado morado (T-182) ─────────────
  if (inSession.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🟣 En curso (${inSession.length})</div>
      <div class="hoy-available-grid">`;
    inSession.forEach((ai, i) => { html += buildHoyCard(ai, i, { inSession: true }); });
    html += `</div></div>`;
  }

  // ── Disponibles — mini-card ──────────────────────────────────────────────
  if (available.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🟢 Disponibles (${available.length})</div>
      <div class="hoy-available-grid">`;
    available.forEach((ai, i) => { html += buildHoyCard(ai, i); });
    html += `</div></div>`;
  }

  // ── Agotadas — nuevo formato mini-card ───────────────────────────────────
  if (exhausted.length) {
    html += `<div class="hoy-section">
      <div class="hoy-section-title">🔴 Agotadas (${exhausted.length}) — próxima primero</div>
      <div class="hoy-available-grid">`;
    exhausted.forEach((ai, i) => { html += buildHoyCard(ai, i); });
    html += `</div></div>`;
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  // T-202604-207: si no hay IAs en absoluto → empty state con CTA
  if (allAIs.length === 0) {
    html += `<div class="hoy-empty">
      <span class="hoy-empty-icon">🤖</span>
      <div class="hoy-empty-msg">Aún no tienes IAs registradas.</div>
      <button class="btn-primary" onclick="openAddAI()">+ Agregar primera IA</button>
    </div>`;
  } else if (!interrupted.length && !inSession.length && !available.length && !exhausted.length) {
    html += `<div class="hoy-empty"><span class="hoy-empty-icon">✨</span>No hay IAs registradas aún.</div>`;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  {
    const nextExh = exhausted.find(a => a.resetTime);
    const nextLabel = nextExh ? (() => {
      const ms = _hoyMsUntilReset(nextExh);
      const m = Math.floor(ms/60000); const h = Math.floor(m/60); const rm = m%60;
      return h > 0 ? `${h}h ${rm}m` : `${rm}min`;
    })() : null;
    const today = now.toLocaleDateString('es-MX', {weekday:'long', day:'numeric', month:'long'});
    html += `<div class="radar-footer">
      <span>${today}</span>
      <span>${nextLabel ? `⏳ próxima IA en ${nextLabel} (${esc(nextExh.name)})` : '✓ todas las IAs disponibles'}</span>
      <span class="radar-footer-version">${_effectiveVersion()}</span>
    </div>`;
  }

  el.innerHTML = html;
  // CSS Purity: animation-delay calculado en runtime → setProperty post-render
  el.querySelectorAll('[data-anim-delay]').forEach(card => {
    card.style.setProperty('animation-delay', card.dataset.animDelay + 'ms');
  });
  _startHoyTicker();
}


// T-202604-052: Selector de IA para captura rápida desde tab Hoy
function selectAIForQuickCapture() {
  const available = state.ais.filter(a => !a.archived);
  if (!available.length) {
    showToast('warning', 'Sin IAs disponibles — todas agotadas');
    return;
  }

  // R-202604-047: shell estático en index.html — solo inject lista + classList
  const modal = document.getElementById('ai-quick-select-modal');
  if (!modal) return;

  const list = document.getElementById('ai-quick-select-list');
  if (list) {
    list.innerHTML = available.map(ai => `
      <div class="ai-quick-select-item" onclick="openQuickCapture('${ai.id}');document.getElementById('ai-quick-select-modal').classList.remove('open');">
        <div class="ai-quick-select-name">${esc(ai.name)}</div>
        <div class="ai-quick-select-status">${ai.status === 'available' ? '✓ Disponible' : '⏳ Agotada'}</div>
      </div>
    `).join('');
  }

  modal.classList.add('open');
}


// T-202604-215: Labels de status en español — fuente de verdad para UI
const STATUS_LABELS = {
  available:    'Disponible',
  exhausted:    'Agotada',
  insession:    'En curso',
  interrupted:  'Interrumpida'
};

const TG_PARSER_CONFIG = {
  TYPES: ['P', 'T', 'R', 'B'],
  TYPE_NAMES: { P: 'Ideas', T: 'Tickets', R: 'Requerimientos', B: 'Bugs' },
  STATUS_ALIASES: {
    'pendiente':'📤 Pendiente', '📤 pendiente':'📤 Pendiente',
    'backlog':'⏳ Backlog', '⏳ backlog':'⏳ Backlog',
    'done':'✅ DONE', '✅ done':'✅ DONE', 'listo':'✅ DONE',
    'en progreso':'🔄 En progreso', '🔄 en progreso':'🔄 En progreso',
    'in-progress':'🔄 En progreso', 'progreso':'🔄 En progreso',
    'descartado':'🗑 Descartado', '🗑 descartado':'🗑 Descartado'
  }
};

function normStatus(raw) {
  if (!raw) return '📤 Pendiente';
  const key = raw.trim().toLowerCase();
  const resolved = TG_PARSER_CONFIG.STATUS_ALIASES[key];
  if (!resolved) {
    console.warn('[AI Tracker] normStatus: status desconocido "' + raw.trim() + '" — usando "📤 Pendiente"');
    return '📤 Pendiente';
  }
  return resolved;
}
function buildTGPreview(items, discrepancy) {
  if (!items.length && !discrepancy) return '';
  let html = `<div class="preview-tg">
    <div class="preview-tg-header">
      <div class="preview-tg-header-label">📋 Items detectados</div>
      <div class="preview-tg-header-count">${items.length} ítem${items.length !== 1 ? 's' : ''}</div>
    </div>`;
  if (discrepancy) {
    html += `<div class="preview-tg-discrepancy">
      ⚠ ${discrepancy.raw} línea${discrepancy.raw !== 1 ? 's' : ''} en el texto — solo ${discrepancy.parsed} parseada${discrepancy.parsed !== 1 ? 's' : ''}. Verifica el formato de las líneas no detectadas.
    </div>`;
  }
  html += `<div class="preview-tg-badges-row">`;
  TG_PARSER_CONFIG.TYPES.forEach(type => {
    const count = items.filter(x => x.type === type).length;
    if (count) html += `<span class="preview-tg-badge ${type}" title="${TG_PARSER_CONFIG.TYPE_NAMES[type]} (${count})">${type} ${count}</span>`;
  });
  html += `</div>`;
  items.forEach(item => {
    const existing = (getActiveTracker().items || []).find(x => x.code === item.code);
    const tag = existing
      ? `<span class="preview-tg-tag update">↑ actualizar</span>`
      : `<span class="preview-tg-tag new">+ nuevo</span>`;
    // T-202605-436 AC4: indicador visual para ítems nuevos sin AC
    const noAcTag = (!existing && (!item.ac || item.ac.length === 0))
      ? `<span class="preview-tg-tag preview-tg-tag--warn" title="Ítem nuevo sin criterios de aceptación">sin AC</span>`
      : '';
    html += `<div class="preview-tg-row">
      <span class="preview-tg-badge ${item.type}">${item.type}</span>
      <span class="preview-tg-code">${esc(item.code)}</span>
      <span class="preview-tg-desc">${esc(item.desc)}${tag}${noAcTag}</span>
      <span class="preview-tg-status">${esc(item.status)}</span>
    </div>`;
  });
  html += `</div>`;
  return html;
}

// ── B-202604-094: Corregir hora de desbloqueo desde card ──
let _correctHoraAIId = null;

function openCorrectHora(id) {
  const ai = getAI(id);
  if (!ai) return;
  _correctHoraAIId = id;

  // Reutilizar el generic confirm modal como contenedor de input
  const modal = document.getElementById('gconfirm-overlay');
  const title = document.getElementById('gconfirm-title');
  const msg = document.getElementById('gconfirm-msg');
  const okBtn = document.getElementById('gconfirm-ok-btn');
  if (!modal) return;

  title.textContent = '⏰ Corregir hora de desbloqueo';
  // Ocultar el input-wrap del modal genérico (usado por _gconfirmOpen)
  const inputWrap = document.getElementById('gconfirm-input-wrap');
  if (inputWrap) inputWrap.classList.add('hidden');

  const currentLabel = ai.resetTime ? fmt12(ai.resetTime) : '(sin hora)';
  msg.innerHTML = `
    <div class="correct-hora-current">Hora actual: <strong>${esc(currentLabel)}</strong></div>
    <div class="correct-hora-input-row">
      <input id="correct-hora-input" class="hora-input correct-hora-input" type="text" maxlength="4" placeholder="--:--"
        oninput="(function(){
          const raw=(document.getElementById('correct-hora-input')||{}).value.replace(/\\D/g,'');
          const disp=document.getElementById('correct-hora-disp');
          const r=interpretHora(raw);
          if(disp){disp.textContent=r?r.label:(raw.length>=3?'hora inválida':(raw.length?'...':'—'));disp.className=r?'hora-disp--valid':(raw.length>=3?'hora-disp--error':'hora-disp--hint');}
        })()"
        onkeydown="if(event.key==='Enter'){event.preventDefault();confirmCorrectHora();}">
      <div id="correct-hora-disp" class="correct-hora-disp">—</div>
    </div>
    <div class="correct-hora-unlock-row">
      <button class="btn-ghost correct-hora-unlock-btn" onclick="unlockNowFromCard()">✅ Desbloquear ahora</button>
    </div>`;

  okBtn.textContent = 'Guardar';
  okBtn.className = 'btn-primary';
  okBtn.onclick = confirmCorrectHora;
  // Reasignar cancel button del modal genérico
  const cancelBtn = modal.querySelector('button:not(#gconfirm-ok-btn)');
  if (cancelBtn) cancelBtn.onclick = () => { _correctHoraAIId = null; modal.classList.remove('open'); };

  // B-202604-094 fix: diferir classList.add('open') al siguiente tick para evitar
  // que el click que originó esta llamada sea interpretado como click-outside
  // por el listener de _gconfirmOpen y cierre el modal inmediatamente.
  setTimeout(() => {
    modal.classList.add('open');
    setTimeout(() => {
      const inp = document.getElementById('correct-hora-input');
      if (inp) {
        // Precargar hora actual si existe
        if (ai.resetTime) inp.value = ai.resetTime.replace(':', '');
        inp.focus(); inp.select();
        // Disparar oninput para mostrar la hora precargada
        inp.dispatchEvent(new Event('input'));
      }
    }, 50);
  }, 0);
}

function confirmCorrectHora() {
  const id = _correctHoraAIId;
  if (!id) return;
  const ai = getAI(id);
  if (!ai) return;
  const inp = document.getElementById('correct-hora-input');
  if (!inp) return;
  const raw = inp.value.replace(/\D/g, '');
  const result = interpretHora(raw);

  if (result) {
    ai.resetTime = result.hhmm;
    ai.resetEpoch = result.epoch;
    // Actualizar resetAt en la sesión más reciente
    const aiSessions = getAISessions(id);
    if (aiSessions.length > 0) {
      const lastSess = aiSessions[aiSessions.length - 1];
      lastSess.resetAt = result.label;
    }
    save(); render();
    if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
    showToast('success', `Hora corregida · ${ai.name} desbloquea a las ${result.label}`);
  } else {
    showToast('error', 'Hora inválida — ingresa formato HHMM (ej: 2100)');
    return; // No cerrar modal
  }

  _correctHoraAIId = null;
  const modal = document.getElementById('gconfirm-overlay');
  if (modal) modal.classList.remove('open');
}

function unlockNowFromCard() {
  const id = _correctHoraAIId;
  if (!id) return;
  const ai = getAI(id);
  if (!ai) return;
  ai.status = 'available';
  ai.resetTime = '';
  ai.resetEpoch = null;
  _correctHoraAIId = null;
  const modal = document.getElementById('gconfirm-overlay');
  if (modal) modal.classList.remove('open');
  save(); render();
  if (typeof renderHoy === 'function' && currentTab === 'hoy') renderHoy();
  showToast('success', `${ai.name} marcada como disponible`);
}

// ══ T-202604-268 / T-202604-270: QUICK NOTE ══
let _quickNoteAC = null; // autocomplete state
let _quickNoteEditId = null; // id of note being edited, null = create mode

function openQuickNote(editId) {
  const modal = document.getElementById('quick-note-modal');
  if (!modal) return;
  _quickNoteEditId = editId || null;
  _quickNoteAC = null;
  // Populate fields
  if (_quickNoteEditId) {
    const note = (state.quickNotes || []).find(n => n.id === _quickNoteEditId);
    if (!note) return;
    document.getElementById('qn-text').value = note.text || '';
    document.getElementById('qn-ref').value = note.itemRef || '';
    document.getElementById('qn-title').textContent = '✏️ Editar nota';
    document.getElementById('qn-delete-btn').classList.add('qn-delete-btn--visible');
    document.getElementById('qn-delete-confirm').classList.remove('qn-delete-confirm--visible');
  } else {
    document.getElementById('qn-text').value = '';
    document.getElementById('qn-ref').value = '';
    document.getElementById('qn-title').textContent = '✏️ Nota rápida';
    document.getElementById('qn-delete-btn').classList.remove('qn-delete-btn--visible');
    document.getElementById('qn-delete-confirm').classList.remove('qn-delete-confirm--visible');
  }
  document.getElementById('qn-ac-list').innerHTML = '';
  document.getElementById('qn-ac-list').classList.remove('qn-ac-list--visible');
  modal.classList.add('open');
  setTimeout(() => document.getElementById('qn-text').focus(), 80);
}

function closeQuickNote() {
  const modal = document.getElementById('quick-note-modal');
  if (modal) modal.classList.remove('open');
  _quickNoteAC = null;
  _quickNoteEditId = null;
}

function saveQuickNote() {
  const text = (document.getElementById('qn-text').value || '').trim();
  if (!text) { document.getElementById('qn-text').focus(); return; }
  const itemRef = (document.getElementById('qn-ref').value || '').trim();
  if (!state.quickNotes) state.quickNotes = [];
  if (_quickNoteEditId) {
    // Edit mode — update in place
    const note = state.quickNotes.find(n => n.id === _quickNoteEditId);
    if (note) { note.text = text; note.itemRef = itemRef; note.updatedAt = new Date().toISOString(); }
    save();
    showToast('success', 'Nota actualizada');
  } else {
    // Create mode
    state.quickNotes.unshift({ id: 'qn-' + Date.now(), text, itemRef: itemRef || '', createdAt: new Date().toISOString() });
    save();
    showToast('success', 'Nota guardada');
  }
  closeQuickNote();
}

function qnRequestDelete() {
  document.getElementById('qn-delete-confirm').classList.add('qn-delete-confirm--visible');
  document.getElementById('qn-delete-btn').classList.remove('qn-delete-btn--visible');
}

function qnCancelDelete() {
  document.getElementById('qn-delete-confirm').classList.remove('qn-delete-confirm--visible');
  document.getElementById('qn-delete-btn').classList.add('qn-delete-btn--visible');
}

function qnConfirmDelete() {
  if (!_quickNoteEditId) return;
  state.quickNotes = (state.quickNotes || []).filter(n => n.id !== _quickNoteEditId);
  save();
  showToast('success', 'Nota eliminada');
  closeQuickNote();
}

function _qnRefInput(val) {
  const list = document.getElementById('qn-ac-list');
  const q = val.trim().toLowerCase();
  if (!q || !list) { if (list) { list.innerHTML = ''; list.classList.remove('qn-ac-list--visible'); } return; }
  const matches = (typeof ITEMS !== 'undefined' ? ITEMS : [])
    .filter(i => {
      const code = (i.code || '').toLowerCase();
      const title = (i.title || i.desc || '').toLowerCase();
      return code.includes(q) || title.includes(q);
    })
    .slice(0, 6);
  if (!matches.length) { list.innerHTML = ''; list.classList.remove('qn-ac-list--visible'); return; }
  list.innerHTML = matches.map(i =>
    `<div class="qn-ac-item" onclick="_qnSelectAC('${esc(i.code)}')">
      <span class="qn-ac-code">${esc(i.code)}</span>
      <span class="qn-ac-desc">${esc((i.title || i.desc || '').slice(0,60))}</span>
    </div>`
  ).join('');
  list.classList.add('qn-ac-list--visible');
}

function _qnSelectAC(code) {
  document.getElementById('qn-ref').value = code;
  const list = document.getElementById('qn-ac-list');
  if (list) { list.innerHTML = ''; list.classList.remove('qn-ac-list--visible'); }
}

function _qnRefKeydown(e) {
  if (e.key === 'Enter') { e.preventDefault(); saveQuickNote(); }
  if (e.key === 'Escape') closeQuickNote();
}

function _qnTextKeydown(e) {
  if (e.key === 'Escape') closeQuickNote();
}
// ══ END T-202604-268 ══

function _qnOverlayClick(e) {
  if (e.target.id === 'quick-note-modal') closeQuickNote();
}

// T-202604-269: navegar a ítem en Backlog desde badge de nota
function _qnNavToItem(code) {
  if (!code) return;
  switchTab('backlog');
  if (typeof switchSubTab === 'function') switchSubTab('backlog');
  setTimeout(() => {
    // Intentar scroll al ítem por data-code
    const el = document.querySelector(`[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('backlog-item--highlight');
      setTimeout(() => el.classList.remove('backlog-item--highlight'), 1800);
    }
  }, 220);
}

// T-202604-299: beforeunload — flush Supabase si hay cambios pendientes
window.addEventListener('beforeunload', () => {
  if (_stateDirty && _supabase && _supabaseUser) {
    clearTimeout(_saveDebounceTimer);
    _saveFlush(); // best-effort; browser puede no esperar la promesa
  }
});

// ─── R-202604-036: showMergeDiffPanel — visualizador de ítems al parsear paste ───
// Reemplaza T-202604-201 (panel diff genérico)
// Muestra tabla de ítems con: código, tipo, título, status resultante,
// datos de backlog si existe, campos inline si es nuevo, checkbox excluir, Ver en Backlog

let _itemVizPendingCb = null;
let _itemVizItems     = null;
let _itemVizSessId    = null;
let _itemVizProjId    = null;
// Estado de exclusiones — set de índices excluidos
let _itemVizExcluded  = new Set();
let _itemVizKeyHandler = null; // T-202605-429: ref al handler Enter para limpieza en close

function showMergeDiffPanel(tgItems, sessId, projId, onConfirm) {
  if (!tgItems || !tgItems.length) { onConfirm(); return; }

  _itemVizPendingCb = onConfirm;
  _itemVizItems     = tgItems;
  _itemVizSessId    = sessId;
  _itemVizProjId    = projId;
  _itemVizExcluded  = new Set();

  // AC: auto-excluir ítems sin cambios — se ignorarán al guardar (AC-3)
  tgItems.forEach((item, idx) => {
    const bk = (typeof ITEMS !== 'undefined') ? ITEMS.find(i => i.code === item.code) || null : null;
    if (bk) {
      const unchanged =
        bk.status === item.status &&
        (bk.title || bk.desc || '') === (item.desc || item.title || '') &&
        String(bk.priority || '') === String(item.priority || '') &&
        String(bk.effort || '') === String(item.effort || '') &&
        JSON.stringify(bk.ac || []) === JSON.stringify(item.ac || []);
      if (unchanged) _itemVizExcluded.add(idx);
    }
  });

  _itemVizRender();

  const overlay = document.getElementById('item-viz-overlay');
  if (overlay) {
    overlay.classList.remove('closing');
    overlay.classList.add('open', 'item-viz--flex');
  }

  // T-202605-429: Enter confirma cuando el foco está en el panel — no dispara desde inputs
  const _vizKeyHandler = (e) => {
    if (e.key !== 'Enter') return;
    const tag = (document.activeElement || {}).tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    document.removeEventListener('keydown', _vizKeyHandler);
    _itemVizConfirm();
  };
  document.addEventListener('keydown', _vizKeyHandler);
  // Guardar ref para poder limpiar en _itemVizClose
  _itemVizKeyHandler = _vizKeyHandler;
}

function _itemVizClose() {
  const overlay = document.getElementById('item-viz-overlay');
  if (overlay) {
    overlay.classList.add('closing');
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.classList.remove('closing', 'item-viz--flex');
    }, 220);
  }
  _itemVizPendingCb = null;
  _itemVizItems = null;
  _itemVizExcluded = new Set();
  // T-202605-429: limpiar handler Enter si quedó registrado
  if (_itemVizKeyHandler) {
    document.removeEventListener('keydown', _itemVizKeyHandler);
    _itemVizKeyHandler = null;
  }
}

function _itemVizConfirm() {
  if (!_itemVizPendingCb || !_itemVizItems) return;
  // Mutar el array original in-place — el closure en session.js tiene referencia al mismo array
  const filtered = _itemVizItems.filter((_, i) => !_itemVizExcluded.has(i));
  _itemVizItems.splice(0, _itemVizItems.length, ...filtered);
  const cb = _itemVizPendingCb;
  _itemVizClose();
  cb();
}

function _itemVizToggleExclude(idx) {
  if (_itemVizExcluded.has(idx)) _itemVizExcluded.delete(idx);
  else _itemVizExcluded.add(idx);
  _itemVizRender();
}

function _itemVizToggleSinCambios() {
  const body    = document.getElementById('viz-sinc-body');
  const chevron = document.getElementById('viz-sinc-chevron');
  if (!body) return;
  const open = body.classList.toggle('viz-sinc-body--open');
  if (chevron) chevron.textContent = open ? '▾' : '▸';
}

function _itemVizNavBacklog(code) {
  _itemVizClose();
  if (typeof switchTab === 'function') switchTab('backlog');
  if (typeof switchSubTab === 'function') switchSubTab('backlog');
  setTimeout(() => {
    const el = document.querySelector(`[data-code="${CSS.escape(code)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bitem--nav-highlight');
      setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1800);
    }
  }, 220);
}

function _itemVizRender() {
  const body = document.getElementById('item-viz-body');
  const confirmBtn = document.getElementById('item-viz-confirm-btn');
  if (!body || !_itemVizItems) return;

  const items = _itemVizItems;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const _getBacklogItem = (code) => {
    if (typeof ITEMS === 'undefined') return null;
    return ITEMS.find(i => i.code === code) || null;
  };

  const _isSinCambio = (item) => {
    const bk = _getBacklogItem(item.code);
    if (!bk) return false;
    return bk.status === item.status &&
      (bk.title || bk.desc || '') === (item.desc || item.title || '') &&
      String(bk.priority || '') === String(item.priority || '') &&
      String(bk.effort   || '') === String(item.effort   || '') &&
      JSON.stringify(bk.ac || []) === JSON.stringify(item.ac || []);
  };

  const _typeColor = { P: '#7c6af7', T: '#2ecc78', R: '#38bdf8', B: '#e85555' };
  const _typeName  = { P: 'Idea',   T: 'Ticket', R: 'Req.',    B: 'Bug'     };

  const _mergeResultClass = (r) =>
    r === 'nuevo'      ? 'viz-status-new'       :
    r === 'actualizado'? 'viz-status-updated'    : 'viz-status-unchanged';

  const _mergeResultLabel = (r) =>
    r === 'nuevo'      ? 'nuevo'       :
    r === 'actualizado'? 'actualización': 'sin cambios';

  // AC-5 / AC-6: chips de campos afectados con conteo
  const _fieldDiffChips = (item, bk) => {
    if (!bk) return '';
    const chips = [];
    if (bk.status !== item.status)
      chips.push(`<span class="viz-field-chip">status</span>`);
    if ((bk.title || bk.desc || '') !== (item.desc || item.title || ''))
      chips.push(`<span class="viz-field-chip">desc</span>`);
    if (String(bk.priority || '') !== String(item.priority || ''))
      chips.push(`<span class="viz-field-chip">priority</span>`);
    if (String(bk.effort || '') !== String(item.effort || ''))
      chips.push(`<span class="viz-field-chip">effort</span>`);
    const oldAc = bk.ac || [], newAc = item.ac || [];
    if (JSON.stringify(oldAc) !== JSON.stringify(newAc)) {
      const added   = newAc.filter(a => !oldAc.includes(a)).length;
      const removed = oldAc.filter(a => !newAc.includes(a)).length;
      let label = 'ac';
      if (added)   label += ` +${added}`;
      if (removed) label += ` -${removed}`;
      chips.push(`<span class="viz-field-chip viz-field-chip--ac">${label}</span>`);
    }
    return chips.length ? `<div class="viz-field-diffs">${chips.join('')}</div>` : '';
  };

  // ── Clasificar ítems ─────────────────────────────────────────────────────
  const sinCambioIdxs = new Set(
    items.map((item, idx) => _isSinCambio(item) ? idx : -1).filter(i => i >= 0)
  );
  const activeItems    = items.filter((_, idx) => !sinCambioIdxs.has(idx));
  const sinCambioItems = items.filter((_, idx) =>  sinCambioIdxs.has(idx));

  // AC-4: contador excluye sin-cambios + exclusiones manuales
  const userExcluded = [..._itemVizExcluded].filter(idx => !sinCambioIdxs.has(idx));
  const toSave = activeItems.length - userExcluded.length;

  if (confirmBtn) {
    const note = sinCambioItems.length ? ` · ${sinCambioItems.length} sin cambios ignorados` : '';
    confirmBtn.textContent = userExcluded.length
      ? `Guardar sesión (${toSave} de ${activeItems.length})${note}`
      : `Guardar sesión (${toSave})${note}`;
  }

  // ── Builder de fila ──────────────────────────────────────────────────────
  const _buildRow = (item, idx, isSinCambio) => {
    const isExcluded = _itemVizExcluded.has(idx);
    const bkItem     = _getBacklogItem(item.code);
    const isReal     = /^[PTRB]-\d{6}-\d{3}/.test(item.code);

    const mergeResult = bkItem
      ? (isSinCambio ? 'sin cambio' : 'actualizado')
      : 'nuevo';

    const typeColor = _typeColor[item.type] || 'var(--accent)';
    const typeName  = _typeName[item.type]  || item.type;

    const bkBlock = bkItem ? `
      <div class="viz-bk-row">
        <span class="viz-bk-label">Backlog</span>
        <span class="viz-bk-status viz-bk-status--${bkItem.status}">${bkItem.status}</span>
        ${bkItem.sprint ? `<span class="viz-bk-chip">${esc(bkItem.sprint)}</span>` : ''}
        ${bkItem.effort ? `<span class="viz-bk-chip">e${bkItem.effort}</span>` : ''}
        ${!isSinCambio ? `<button class="viz-nav-btn" onclick="_itemVizNavBacklog('${esc(item.code)}')" title="Ver en Backlog">→ Backlog</button>` : ''}
      </div>` : '';

    const newBlock = (!bkItem && isReal) ? `
      <div class="viz-new-fields">
        ${item.effort ? `<span class="viz-new-chip">effort: ${item.effort}</span>` : ''}
        ${item.area   ? `<span class="viz-new-chip">area: ${esc(item.area)}</span>`   : ''}
        ${item.ac && item.ac.length ? `<div class="viz-new-ac"><span class="viz-new-chip viz-new-chip--ac">AC</span> ${item.ac.map(a => `<span class="viz-ac-item">${esc(a)}</span>`).join('')}</div>` : ''}
      </div>` : '';

    const fieldDiffs = mergeResult === 'actualizado' ? _fieldDiffChips(item, bkItem) : '';

    // T-202605-428: código real clickeable — copia al clipboard con feedback visual idéntico al backlog
    const codeDisplay = isReal
      ? `<button class="viz-code viz-code--real viz-code--copyable" data-type-color="${esc(typeColor)}" data-code="${esc(item.code)}" title="Click para copiar" onclick="_vizCopyCode(event,this)">${esc(item.code)}</button>`
      : `<span class="viz-code viz-code--pending">${esc(item.code)}</span>`;

    const checkboxHtml = !isSinCambio
      ? `<label class="viz-checkbox-wrap" title="${isExcluded ? 'Incluir en merge' : 'Excluir del merge'}">
          <input type="checkbox" class="viz-checkbox" ${isExcluded ? '' : 'checked'}
            onchange="_itemVizToggleExclude(${idx})">
         </label>`
      : `<span class="viz-sinc-icon">—</span>`;

    return `
      <div class="viz-row${isExcluded ? ' viz-row--excluded' : ''}${isSinCambio ? ' viz-row--sinc' : ''}" id="viz-row-${idx}">
        ${checkboxHtml}
        <div class="viz-type-badge" data-type-color="${esc(typeColor)}">${typeName}</div>
        <div class="viz-content">
          <div class="viz-row-top">
            ${codeDisplay}
            <span class="viz-desc">${esc(item.desc || item.title || item.status)}</span>
            <span class="viz-merge-result ${_mergeResultClass(mergeResult)}">${_mergeResultLabel(mergeResult)}</span>
          </div>
          <div class="viz-row-bottom">
            <span class="viz-status-incoming">→ ${esc(item.status)}</span>
            ${bkBlock}
            ${newBlock}
            ${fieldDiffs}
          </div>
        </div>
      </div>`;
  };

  // ── Renderizar filas activas ─────────────────────────────────────────────
  const activeRows = activeItems.map(item => _buildRow(item, items.indexOf(item), false)).join('');

  // ── Summary ──────────────────────────────────────────────────────────────
  const newCount = activeItems.filter(item => !_getBacklogItem(item.code)).length;
  const updCount = activeItems.filter(item =>  !!_getBacklogItem(item.code)).length;
  const summary = `<div class="viz-summary">
    ${newCount ? `<span class="viz-sum-chip viz-sum-new">${newCount} nuevo${newCount !== 1 ? 's' : ''}</span>` : ''}
    ${updCount ? `<span class="viz-sum-chip viz-sum-upd">${updCount} actualización${updCount !== 1 ? 'es' : ''}</span>` : ''}
    ${sinCambioItems.length ? `<span class="viz-sum-chip viz-sum-sinc">${sinCambioItems.length} sin cambios</span>` : ''}
  </div>`;

  // ── Grupo sin cambios — AC-1: colapsado por defecto ──────────────────────
  let sinCambioGroup = '';
  if (sinCambioItems.length) {
    const sinCambioRows = sinCambioItems.map(item => _buildRow(item, items.indexOf(item), true)).join('');
    sinCambioGroup = `
      <div class="viz-sinc-group" id="viz-sinc-group">
        <button class="viz-sinc-header" onclick="_itemVizToggleSinCambios()">
          <span class="viz-sinc-label">${sinCambioItems.length} ítem${sinCambioItems.length !== 1 ? 's' : ''} ya existen sin cambios — se ignorarán</span>
          <span class="viz-sinc-chevron" id="viz-sinc-chevron">▸</span>
        </button>
        <div class="viz-sinc-body" id="viz-sinc-body">
          ${sinCambioRows}
        </div>
      </div>`;
  }

  body.innerHTML = summary + `<div class="viz-rows">${activeRows}</div>` + sinCambioGroup;

  // CSS Purity: colores de tipo calculados en runtime → setProperty post-render
  body.querySelectorAll('[data-type-color]').forEach(el => {
    const color = el.dataset.typeColor;
    if (el.classList.contains('viz-type-badge')) {
      el.style.setProperty('background', color + '22');
      el.style.setProperty('color', color);
      el.style.setProperty('border-color', color + '44');
    } else {
      el.style.setProperty('color', color);
    }
  });
}

// T-202605-428: copy helper para códigos en el panel DIFF
function _vizCopyCode(e, el) {
  e.stopPropagation();
  const code = el.dataset.code || el.textContent;
  if (!code) return;
  const _doFlash = () => {
    const prev = el.textContent;
    el.classList.add('viz-code--copied');
    el.textContent = '✓';
    setTimeout(() => { el.classList.remove('viz-code--copied'); el.textContent = prev; }, 1400);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(_doFlash).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = code; ta.className = 'clipboard-ghost';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); _doFlash();
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = code; ta.className = 'clipboard-ghost';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); _doFlash();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// R-202604-072: Sesión de Arranque — panel de contexto diario al abrir la app
// ─────────────────────────────────────────────────────────────────────────────

const _ARRANQUE_KEY = 'ai-tracker-arranque-ts';
const _ARRANQUE_6H  = 6 * 60 * 60 * 1000;

function closeArranquePanel() {
  const overlay = document.getElementById('arranque-overlay');
  if (overlay) overlay.classList.remove('arranque-visible');
}

function _showArranquePanel() {
  const overlay = document.getElementById('arranque-overlay');
  const body    = document.getElementById('arranque-body');
  const ctaBtn  = document.getElementById('arranque-cta-btn');
  if (!overlay || !body) return;

  // AC: no aparece si han pasado menos de 6h desde el último arranque (localStorage)
  const lastShown = parseInt(localStorage.getItem(_ARRANQUE_KEY) || '0', 10);
  if (Date.now() - lastShown < _ARRANQUE_6H) return;

  // AC: no aparece si no hay proyectos ni ítems — onboarding tiene prioridad
  const allProjects = (state.projects || []).filter(p => (p.sessions || []).length > 0);
  const allItems    = typeof ITEMS !== 'undefined' ? ITEMS : [];
  if (allProjects.length === 0 && allItems.length === 0) return;

  // Persistir timestamp antes de mostrar
  try { localStorage.setItem(_ARRANQUE_KEY, String(Date.now())); } catch(e) {}

  // ── Bloque 1: Resumen de ayer ────────────────────────────────────────────
  const now        = Date.now();
  const DAY        = 86400000;
  const allSess    = getAllSessions();
  // Sesiones de las últimas 24h — "ayer" = última sesión del día anterior al de hoy
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const yesterStart = new Date(todayStart.getTime() - DAY);

  // Ítems cerrados en la última sesión (la más reciente)
  const lastSess = allSess.slice().sort((a, b) => {
    const ta = new Date(a.date || 0).getTime();
    const tb = new Date(b.date || 0).getTime();
    return tb - ta;
  })[0] || null;

  let bloque1Html = '';
  if (lastSess) {
    const lastSessDate = new Date(lastSess.date || 0);
    const daysDiff = Math.floor((now - lastSessDate.getTime()) / DAY);
    const lastProjObj = (state.projects || []).find(p => p.id === lastSess.projectId);
    const lastProjName = lastProjObj ? (lastProjObj.name || lastProjObj.id) : '';
    const lastAIObj = (state.ais || []).find(a => a.id === lastSess.aiId);
    const lastAIName = lastAIObj ? lastAIObj.name : '';

    // Ítems done vinculados a esa sesión
    const closedInSess = allItems.filter(i =>
      i.status === 'done' && (i.sessionId === lastSess.id || (lastSess.trackerRefs || []).includes(i.code))
    );

    if (daysDiff === 0 || daysDiff === 1) {
      const whenLabel = daysDiff === 0 ? 'hoy' : 'ayer';
      bloque1Html = `<div class="arr-section">
        <span class="arr-label">Última sesión — ${whenLabel}</span>
        <span class="arr-value arr-value--small">${lastProjName ? esc(lastProjName) + ' · ' : ''}${lastAIName ? esc(lastAIName) : ''}</span>
        ${closedInSess.length > 0
          ? `<ul class="arr-item-list arr-item-list--compact">
              ${closedInSess.slice(0,3).map(i => {
                const t = (i.code||'T')[0].toUpperCase();
                const _tc = {P:'#7c6af7',T:'#2ecc78',R:'#38bdf8',B:'#e85555'};
                return `<li class="arr-item arr-item--done">
                  <span class="arr-item-code" style="--arr-type-color:${_tc[t]||'#38bdf8'}">${esc(i.code)}</span>
                  <span class="arr-item-desc">${esc(i.desc||'')}</span>
                </li>`;
              }).join('')}
              ${closedInSess.length > 3 ? `<li class="arr-item arr-item--more">+${closedInSess.length - 3} más</li>` : ''}
            </ul>`
          : `<span class="arr-value arr-value--muted">${esc(lastSess.title || 'Sin ítems cerrados registrados')}</span>`
        }
      </div>`;
    } else {
      bloque1Html = `<div class="arr-section">
        <span class="arr-label">Última sesión</span>
        <span class="arr-value arr-value--muted">Hace ${daysDiff} días${lastProjName ? ' · ' + esc(lastProjName) : ''}</span>
      </div>`;
    }
  }

  // ── Bloque 2: Ítem sugerido ──────────────────────────────────────────────
  // Proyecto con más actividad reciente
  const projByActivity = allProjects.slice().sort((a, b) => {
    const ta = Math.max(...(a.sessions||[]).map(s => new Date(s.date||0).getTime()), 0);
    const tb = Math.max(...(b.sessions||[]).map(s => new Date(s.date||0).getTime()), 0);
    return tb - ta;
  });
  const mostActiveProj = projByActivity[0] || null;
  const activeSprint = mostActiveProj
    ? ((mostActiveProj.sprints||[]).find(s => s.status === 'active') || (mostActiveProj.sprints||[]).find(s => s.status === 'open') || null)
    : null;

  // Top 1 ítem por score del sprint activo del proyecto más activo
  const suggestedItem = allItems
    .filter(i => i.status === 'pendiente' && typeof i._score === 'number' && (!activeSprint || i.sprint === activeSprint.id))
    .sort((a, b) => b._score - a._score)[0] || null;

  let bloque2Html = '';
  if (suggestedItem) {
    const t = (suggestedItem.code||'T')[0].toUpperCase();
    const _tc = {P:'#7c6af7',T:'#2ecc78',R:'#38bdf8',B:'#e85555'};
    bloque2Html = `<div class="arr-section">
      <span class="arr-label">Ítem sugerido${activeSprint ? ' · ' + esc(activeSprint.name || activeSprint.id) : ''}</span>
      <div class="arr-item arr-item--featured">
        <span class="arr-item-code" style="--arr-type-color:${_tc[t]||'#38bdf8'}">${esc(suggestedItem.code)}</span>
        <span class="arr-item-desc">${esc(suggestedItem.desc||'')}</span>
      </div>
    </div>`;
  }

  // ── Bloque 3: Estado IA ──────────────────────────────────────────────────
  const nonArchived = (state.ais || []).filter(a => !a.archived);
  // IA disponible con mayor score (si hay _score no disponible calculamos por sesiones recientes)
  const available = nonArchived.filter(a => a.status === 'available' && !a.interrupted);
  const inSession  = nonArchived.filter(a => a.interrupted || (a.status === 'available' && allSess.some(s => s.aiId === a.id && new Date(s.date||0).getTime() > now - 3*60*60*1000)));
  const exhausted  = nonArchived.filter(a => a.status === 'exhausted');

  // Mejor IA disponible: la que tiene sesión más reciente (más contexto)
  const bestAI = available.sort((a, b) => {
    const ta = Math.max(...allSess.filter(s => s.aiId === a.id).map(s => new Date(s.date||0).getTime()), 0);
    const tb = Math.max(...allSess.filter(s => s.aiId === b.id).map(s => new Date(s.date||0).getTime()), 0);
    return tb - ta;
  })[0] || null;

  let bloque3Html = '';
  if (bestAI) {
    bloque3Html = `<div class="arr-section">
      <span class="arr-label">IA disponible</span>
      <div class="arr-ai-row">
        <span class="arr-ai-name">${esc(bestAI.name)}</span>
        <span class="arr-ai-badge arr-ai-badge--available">disponible</span>
      </div>
    </div>`;
  } else if (exhausted.length > 0) {
    // Mostrar la que se resetea antes
    const nextToReset = exhausted.slice().sort((a, b) => _hoyMsUntilReset(a) - _hoyMsUntilReset(b))[0];
    const msLeft = _hoyMsUntilReset(nextToReset);
    const cdLabel = _hoyCountdownLabel(msLeft);
    bloque3Html = `<div class="arr-section">
      <span class="arr-label">IAs disponibles</span>
      <div class="arr-ai-row">
        <span class="arr-ai-name">${esc(nextToReset.name)}</span>
        <span class="arr-ai-badge arr-ai-badge--exhausted">en ${cdLabel}</span>
      </div>
    </div>`;
  }

  // ── Bloque 4: Sesión recomendada del plan (R-202605-097) ─────────────────
  let bloque4Html = '';
  let _planPromptText = null; // texto a copiar — null = sin plan

  const _activeProj = (state.projects || []).find(p => p.id === (getActiveProject && getActiveProject() ? getActiveProject().id : null))
    || (state.projects || []).filter(p => !p.archived)[0]
    || null;

  if (_activeProj && typeof loadPlan === 'function') {
    const _planSprints = loadPlan(_activeProj.id);
    const _backlogItems = (() => {
      try {
        const _tplK = typeof _tplKey === 'function' ? _tplKey('backlog-items') : 'backlog-items';
        const raw = localStorage.getItem(_tplK);
        return raw ? JSON.parse(raw) : [];
      } catch(e) { return []; }
    })();
    const _itemByCode = {};
    _backlogItems.forEach(it => { if (it.code) _itemByCode[it.code] = it; });

    const _liveStatus = code => { const it = _itemByCode[code]; return it ? (it.status || 'pendiente') : 'pendiente'; };
    const _liveTitle  = code => { const it = _itemByCode[code]; return it ? (it.title || it.desc || '') : ''; };
    const _sessScore  = sess => (sess.items || []).reduce((sum, code) => {
      const it = _itemByCode[code];
      if (!it || _liveStatus(code) === 'done' || _liveStatus(code) === 'descartado') return sum;
      const w = it.priority === 'high' ? 3 : it.priority === 'low' ? 1 : 2;
      return sum + w;
    }, 0);
    const _sessIsDone = sess => {
      const codes = sess.items || [];
      return codes.length > 0 && codes.every(c => { const s = _liveStatus(c); return s === 'done' || s === 'descartado'; });
    };

    if (_planSprints && _planSprints.length) {
      // Aplanar sesiones con sprint de origen
      const _allSessions = [];
      _planSprints.forEach(sp => {
        (sp.sessions || []).forEach(sess => {
          _allSessions.push({ ...sess, _sprintId: sp.id });
        });
      });

      // IDs de sesiones done — para calcular bloqueos
      const _doneIds = new Set(_allSessions.filter(s => _sessIsDone(s)).map(s => s.id).filter(Boolean));
      const _isBlocked = sess => {
        const deps = (sess.depende_de || []).filter(Boolean);
        return deps.length > 0 && !deps.every(d => _doneIds.has(d));
      };

      // Filtrar sesiones pendientes (no done)
      const _pendingSessions = _allSessions.filter(s => !_sessIsDone(s));

      if (_pendingSessions.length === 0) {
        // Todos los ítems del plan done — sprint completado
        bloque4Html = `<div class="arr-section arr-section--plan">
          <span class="arr-label">Sesión del plan</span>
          <div class="arr-plan-done">✓ Todas las sesiones del sprint completadas</div>
        </div>`;
      } else {
        // Separar desbloqueadas vs bloqueadas
        const _available = _pendingSessions.filter(s => !_isBlocked(s));
        const _blocked   = _pendingSessions.filter(s =>  _isBlocked(s));

        // Sesión recomendada = desbloqueada con mayor score de ítems
        const _recommended = _available.slice().sort((a, b) => _sessScore(b) - _sessScore(a))[0] || null;
        const _others = _available.filter(s => s !== _recommended);

        // Construir HTML de la sesión recomendada
        const _typeColor = { P: '#7c6af7', T: '#2ecc78', R: '#38bdf8', B: '#e85555' };
        const _itemPill = code => {
          const t = (code || 'T')[0].toUpperCase();
          return `<span class="arr-item-code" style="--arr-type-color:${_typeColor[t] || '#38bdf8'}">${esc(code)}</span>`;
        };
        const _filePill = f => `<span class="arr-file-pill">${esc(f)}</span>`;

        let recHtml = '';
        if (_recommended) {
          const pendingCodes = (_recommended.items || []).filter(c => {
            const s = _liveStatus(c); return s !== 'done' && s !== 'descartado';
          });
          const archivos = (_recommended.archivos || []).filter(Boolean);

          // Validar campos antes de construir prompt — AC R-202605-097
          const _missingFields = [];
          if (!_recommended.rol) _missingFields.push('rol');
          if (!pendingCodes.length) _missingFields.push('ítems');
          const _promptIncomplete = _missingFields.length > 0;

          // Solo construir texto a copiar si campos completos
          const _contextFiles = ['PP-CONTEXT', 'PP-BACKLOG'];
          const _allFiles = [...new Set([...archivos, ..._contextFiles])];
          if (!_promptIncomplete) {
            _planPromptText = [
              `Rol: ${_recommended.rol}`,
              `Sprint: ${_recommended._sprintId || ''}`,
              `Ítems: ${(_recommended.items || []).join(', ')}`,
              `Archivos técnicos: ${archivos.join(', ') || '—'}`,
              `Archivos de contexto: ${_contextFiles.join(', ')}`,
            ].join('\n');
          }

          const archivosHtml = _allFiles.length
            ? `<div class="arr-plan-files">
                <span class="arr-plan-files-label">Archivos</span>
                <div class="arr-plan-files-row">
                  ${archivos.map(f => _filePill(f)).join('')}
                  ${_contextFiles.map(f => `<span class="arr-file-pill arr-file-pill--ctx">${esc(f)}</span>`).join('')}
                </div>
              </div>`
            : '';

          const incompleteWarningHtml = _promptIncomplete
            ? `<div class="arr-plan-warning">⚠ Faltan campos en el plan: ${_missingFields.join(', ')} — edita el bloque ---PLAN--- antes de copiar</div>`
            : '';

          recHtml = `<div class="arr-plan-card arr-plan-card--recommended">
            <div class="arr-plan-card-header">
              <span class="arr-plan-indicator arr-plan-indicator--available">●</span>
              <span class="arr-plan-rol">${esc(_recommended.rol || '—')}</span>
              ${_recommended._sprintId ? `<span class="arr-plan-sprint">${esc(_recommended._sprintId)}</span>` : ''}
            </div>
            <div class="arr-plan-items">
              ${pendingCodes.length ? pendingCodes.map(_itemPill).join('') : '<span class="arr-plan-no-items">Sin ítems pendientes</span>'}
            </div>
            ${archivosHtml}
            ${incompleteWarningHtml}
            <button class="arr-plan-copy-btn${_promptIncomplete ? ' arr-plan-copy-btn--disabled' : ''}" id="arr-copy-btn" type="button"${_promptIncomplete ? ' aria-disabled="true" title="Completa los campos faltantes para habilitar"' : ''}>Copiar prompt de arranque</button>
          </div>`;
        }

        // Sesiones adicionales disponibles (colapsadas)
        let othersHtml = '';
        if (_others.length) {
          othersHtml = _others.map(s => {
            const pendCount = (s.items || []).filter(c => { const st = _liveStatus(c); return st !== 'done' && st !== 'descartado'; }).length;
            return `<div class="arr-plan-row">
              <span class="arr-plan-indicator arr-plan-indicator--available">●</span>
              <span class="arr-plan-row-rol">${esc(s.rol || '—')}</span>
              <span class="arr-plan-row-count">${pendCount} ítem${pendCount !== 1 ? 's' : ''}</span>
            </div>`;
          }).join('');
        }

        // Sesiones bloqueadas
        let blockedHtml = '';
        if (_blocked.length) {
          blockedHtml = _blocked.map(s => {
            const blocker = _allSessions.find(b => (s.depende_de || []).includes(b.id) && !_doneIds.has(b.id));
            return `<div class="arr-plan-row arr-plan-row--blocked">
              <span class="arr-plan-indicator arr-plan-indicator--blocked">○</span>
              <span class="arr-plan-row-rol">${esc(s.rol || '—')}</span>
              ${blocker ? `<span class="arr-plan-row-blocker">requiere: ${esc(blocker.rol || blocker.id || '—')}</span>` : ''}
            </div>`;
          }).join('');
        }

        bloque4Html = `<div class="arr-section arr-section--plan">
          <span class="arr-label">Sesión del plan</span>
          ${recHtml}
          ${othersHtml || blockedHtml ? `<div class="arr-plan-others">${othersHtml}${blockedHtml}</div>` : ''}
        </div>`;
      }
    } else {
      // Sin plan activo
      bloque4Html = `<div class="arr-section arr-section--plan">
        <span class="arr-label">Sesión del plan</span>
        <div class="arr-plan-empty">Sin plan activo — abre una sesión con Rune para planificar el siguiente sprint</div>
      </div>`;
    }
  }

  // ── Render final ─────────────────────────────────────────────────────────
  // Saludo por hora
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '☀ Buenos días' : hour < 19 ? '👋 Buenas tardes' : '🌙 Buenas noches';
  const titleEl = overlay.querySelector('.arranque-title');
  if (titleEl) titleEl.textContent = greeting;

  body.innerHTML = bloque1Html + bloque2Html + bloque3Html + bloque4Html;

  // CTA botón copiar prompt (R-202605-097)
  const _copyBtn = document.getElementById('arr-copy-btn');
  if (_copyBtn) {
    _copyBtn.addEventListener('click', () => {
      if (!_planPromptText) return;
      navigator.clipboard.writeText(_planPromptText).then(() => {
        _copyBtn.classList.add('arr-plan-copy-btn--copied');
        _copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          _copyBtn.classList.remove('arr-plan-copy-btn--copied');
          _copyBtn.textContent = 'Copiar prompt de arranque';
        }, 2000);
      }).catch(() => {
        // Fallback para entornos sin clipboard API
        const ta = document.createElement('textarea');
        ta.value = _planPromptText;
        ta.style.setProperty('position', 'fixed');
        ta.style.setProperty('opacity', '0');
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        _copyBtn.classList.add('arr-plan-copy-btn--copied');
        _copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          _copyBtn.classList.remove('arr-plan-copy-btn--copied');
          _copyBtn.textContent = 'Copiar prompt de arranque';
        }, 2000);
      });
    });
  }

  // Footer CTA secundario: ir a Tracker
  if (ctaBtn) {
    ctaBtn.onclick = () => {
      closeArranquePanel();
      if (bestAI && typeof selectTrackerAI === 'function') {
        if (typeof switchTab === 'function') switchTab('tab-tracker');
        setTimeout(() => selectTrackerAI(bestAI.id), 80);
      } else if (typeof switchTab === 'function') {
        switchTab('tab-tracker');
      }
    };
    ctaBtn.textContent = bestAI ? `Arrancar con ${bestAI.name} →` : 'Arrancar →';
  }

  // AC: Escape y click fuera cierran el panel
  const onKey = (e) => { if (e.key === 'Escape') { closeArranquePanel(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  overlay.onclick = (e) => { if (e.target === overlay) { closeArranquePanel(); document.removeEventListener('keydown', onKey); } };

  overlay.classList.add('arranque-visible');
}

// ─────────────────────────────────────────────────────────────────────────────
// R-202604-073: Pulso del Ecosistema — dot semántico + panel de salud
// ─────────────────────────────────────────────────────────────────────────────

const _PULSO_KEY = 'ai-tracker-pulso';

function _calcPulsoDotState() {
  const now   = Date.now();
  const DAY   = 86400000;
  const WEEK  = 7 * DAY;
  const allItems = typeof ITEMS !== 'undefined' ? ITEMS : [];

  // Proyectos con al menos una sesión
  const activeProjects = (state.projects || []).filter(p => (p.sessions || []).length > 0);

  const projData = activeProjects.map(p => {
    const sessions = p.sessions || [];
    const lastTs   = sessions.reduce((mx, s) => { const t = s.savedAt || s.createdAt || 0; return t > mx ? t : mx; }, 0);
    const daysSince = lastTs ? Math.floor((now - lastTs) / DAY) : 999;

    // Sprint IDs de este proyecto
    const sprintIds = new Set((p.sprints || []).map(s => s.id));

    const closed7   = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) <= WEEK && sprintIds.has(i.sprint)).length;
    const closed714 = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) > WEEK && (now - i.doneAt) <= 2 * WEEK && sprintIds.has(i.sprint)).length;

    let indicator;
    if (closed7 === 0 || daysSince >= 4) {
      indicator = 'parado';
    } else if (closed714 === 0 || closed7 >= closed714 * 1.2) {
      indicator = 'acelerando';
    } else if (closed7 >= closed714 * 0.8) {
      indicator = 'estable';
    } else {
      indicator = 'parado';
    }

    return { id: p.id, name: p.name || p.id, daysSince, closedThisWeek: closed7, closedLastWeek: closed714, indicator, sprintIds };
  });

  // Bloqueantes activos (blockedBy con deps no done)
  const blockerCount = allItems.filter(i =>
    i.status === 'pendiente' && i.blockedBy && i.blockedBy.length > 0 &&
    i.blockedBy.some(c => { const dep = allItems.find(d => d.code === c); return !dep || dep.status !== 'done'; })
  ).length;

  // Sprints activos sin movimiento en 7+ días
  const staleSprints = [];
  activeProjects.forEach(p => {
    (p.sprints || []).filter(s => s.status === 'active').forEach(sp => {
      const closedRecently = allItems.some(i => i.sprint === sp.id && i.status === 'done' && i.doneAt && (now - i.doneAt) <= WEEK);
      if (!closedRecently) staleSprints.push({ name: sp.label || sp.id, project: p.name || p.id });
    });
  });

  // Velocidad global
  const totalThisWeek = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) <= WEEK).length;
  const totalLastWeek = allItems.filter(i => i.status === 'done' && i.doneAt && (now - i.doneAt) > WEEK && (now - i.doneAt) <= 2 * WEEK).length;

  // Color dot
  const hasRed    = projData.some(p => p.daysSince >= 7) || blockerCount > 0;
  const hasYellow = !hasRed && projData.some(p => p.daysSince >= 4);
  const dotColor  = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

  return { dotColor, projData, blockerCount, staleSprints, totalThisWeek, totalLastWeek };
}

function renderPulsoDot() {
  const dot = document.getElementById('pulso-dot');
  if (!dot) return;
  const s = _calcPulsoDotState();
  dot.className = `pulso-dot pulso-dot--${s.dotColor}`;
  const labels = { green: 'Ecosistema activo ✓', yellow: '⚠ Actividad baja — algún proyecto inactivo 4-7d', red: '⛔ Alerta — proyectos parados o bloqueantes activos' };
  dot.title = labels[s.dotColor] || '';
  try { localStorage.setItem(_PULSO_KEY, JSON.stringify({ color: s.dotColor, ts: Date.now() })); } catch(e) {}
}

function openPulsoPanel() {
  const overlay = document.getElementById('pulso-overlay');
  const body    = document.getElementById('pulso-body');
  if (!overlay || !body) return;

  const s = _calcPulsoDotState();

  // Barra de velocidad global
  const velPct   = s.totalLastWeek > 0 ? Math.round((s.totalThisWeek / s.totalLastWeek) * 100) : (s.totalThisWeek > 0 ? 100 : 0);
  const velLabel = s.totalLastWeek === 0
    ? (s.totalThisWeek > 0 ? `${s.totalThisWeek} ítem${s.totalThisWeek !== 1 ? 's' : ''} esta semana` : 'Sin actividad esta semana')
    : `${s.totalThisWeek} cerrados · ${velPct}% vs semana anterior`;
  const velFill  = Math.min(100, velPct || (s.totalThisWeek > 0 ? 60 : 0));
  const velColor = velFill >= 80 ? '#2ecc78' : velFill >= 40 ? '#e8a832' : '#e85555';

  let html = `<div class="pls-section">
    <span class="pls-label">Velocidad global</span>
    <div class="pls-vel-bar-wrap" title="${velLabel}">
      <div class="pls-vel-bar" style="--pls-vel-fill:${velFill}%;--pls-vel-color:${velColor}"></div>
    </div>
    <span class="pls-vel-text">${esc(velLabel)}</span>
  </div>`;

  if (s.projData.length > 0) {
    html += `<div class="pls-section pls-section--list"><span class="pls-label">Proyectos activos</span>`;
    html += s.projData.map(p => {
      const icon  = p.indicator === 'acelerando' ? '▲' : p.indicator === 'estable' ? '●' : '▼';
      const cls   = `pls-ind pls-ind--${p.indicator === 'acelerando' ? 'up' : p.indicator === 'estable' ? 'neutral' : 'down'}`;
      const extra = p.indicator === 'parado' && p.daysSince < 999 ? ` · ${p.daysSince}d sin sesión` : '';
      return `<div class="pls-proj-row">
        <span class="${cls}" title="${p.indicator}">${icon}</span>
        <span class="pls-proj-name">${esc(p.name)}</span>
        <span class="pls-proj-stats">${p.closedThisWeek} cerrado${p.closedThisWeek !== 1 ? 's' : ''}${extra}</span>
      </div>`;
    }).join('');
    html += `</div>`;
  }

  if (s.blockerCount > 0) {
    html += `<div class="pls-section pls-section--alert">
      <button class="pls-blocker-btn" onclick="closePulsoPanel();if(typeof switchTab==='function')switchTab('backlog')">
        ⛔ ${s.blockerCount} bloqueante${s.blockerCount !== 1 ? 's' : ''} activo${s.blockerCount !== 1 ? 's' : ''} → ver en Backlog
      </button>
    </div>`;
  }

  if (s.staleSprints.length > 0) {
    html += `<div class="pls-section"><span class="pls-label">Sprints sin movimiento (7+ días)</span>`;
    html += s.staleSprints.map(sp => `<div class="pls-stale-row">⚠ <strong>${esc(sp.name)}</strong> · ${esc(sp.project)}</div>`).join('');
    html += `</div>`;
  }

  // R-202604-076: Planes activos
  if (typeof _buildPulsoPlanesHtml === 'function') {
    html += _buildPulsoPlanesHtml();
  }

  if (s.projData.length === 0 && s.blockerCount === 0 && s.staleSprints.length === 0) {
    html += `<div class="pls-empty">Sin datos aún. Registra sesiones y ítems para ver el pulso del ecosistema.</div>`;
  }

  body.innerHTML = html;
  overlay.classList.add('pulso-visible');

  const onKey = (e) => { if (e.key === 'Escape') { closePulsoPanel(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

function closePulsoPanel() {
  const overlay = document.getElementById('pulso-overlay');
  if (overlay) overlay.classList.remove('pulso-visible');
}

// ══ R-202604-059: Grid Tracker 3 columnas — lógica JS ══
// T-202604-367: historial col 2 | T-202604-368: preview col 3 | T-202604-372: drag & drop

let _trackerHistSelectedSessId = null;
let _trackerHistProjFilter = '';

// Poblar select de proyectos en col 2
function _trackerHistPopulateProjects() {
  const sel = document.getElementById('tracker-hist-proj-filter');
  if (!sel) return;
  const projects = (state.projects || []).filter(p => p.status !== 'paused');
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos los proyectos</option>' +
    projects.map(p => `<option value="${esc(p.id)}"${p.id === current ? ' selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`).join('');
}

// Render col 2: lista de sesiones con filtro de proyecto
function _trackerRenderHist() {
  const listEl = document.getElementById('tracker-hist-list');
  if (!listEl) return;

  _trackerHistPopulateProjects();

  const allSessions = getAllSessions(); // ordenadas cronológicamente
  const filtered = _trackerHistProjFilter
    ? allSessions.filter(s => s.projectId === _trackerHistProjFilter)
    : allSessions;

  // más reciente primero
  const sorted = [...filtered].reverse();

  if (!sorted.length) {
    listEl.innerHTML = `<div class="tracker-hist-empty">
      <span class="tracker-hist-empty-icon">📋</span>
      <span>Sin sesiones${_trackerHistProjFilter ? ' en este proyecto' : ''}</span>
    </div>`;
    return;
  }

  const projTracker = getActiveTracker();

  listEl.innerHTML = sorted.map(s => {
    const ai = state.ais.find(a => a.id === s.aiId);
    const aiName = ai ? esc(ai.name) : '—';
    const proj = s.projectId ? getProjectById(s.projectId) : null;
    const dateLabel = (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '');
    const isActive = s.id === _trackerHistSelectedSessId;

    // conteo de ítems backlog vinculados
    const linkedItems = projTracker.items.filter(x => x.sessionId === s.id);
    const badgeHtml = linkedItems.length
      ? `<span class="tracker-hist-items-badge">${linkedItems.length}</span>`
      : '';

    const projPill = proj
      ? `<span style="font-size:10px;color:var(--hint)">${esc(proj.icon || '📁')}</span>`
      : '';

    return `<div class="tracker-hist-row${isActive ? ' active' : ''}"
        data-sess-id="${s.id}"
        data-ai-id="${s.aiId}"
        draggable="true"
        onclick="_trackerSelectSess('${s.id}','${s.aiId}')"
        ondragstart="_trackerHistDragStart(event,'${s.id}','${s.aiId}')"
        ondragend="_trackerHistDragEnd(event)">
      <span class="tracker-hist-row-drag">⠿</span>
      <div class="tracker-hist-row-top">
        <span class="tracker-hist-ai-dot"></span>
        <span class="tracker-hist-row-title" title="${esc(s.title)}">${esc(s.title)}</span>
        <span class="tracker-hist-row-date">${dateLabel}</span>
      </div>
      <div class="tracker-hist-row-meta">
        ${projPill}
        <span class="tracker-hist-ai-name">${aiName}</span>
        ${badgeHtml}
      </div>
    </div>`;
  }).join('');

  // Re-attach drag target listeners
  _trackerHistAttachDropTargets();
}

// Handler cambio de filtro proyecto
function _trackerHistFilterChange() {
  const sel = document.getElementById('tracker-hist-proj-filter');
  _trackerHistProjFilter = sel ? sel.value : '';
  _trackerRenderHist();
}

// Seleccionar sesión: resaltar en col 2 + abrir preview
function _trackerSelectSess(sessId, aiId) {
  _trackerHistSelectedSessId = sessId;
  // actualizar estado activo en col 2
  document.querySelectorAll('.tracker-hist-row').forEach(row => {
    row.classList.toggle('active', row.dataset.sessId === sessId);
  });
}

// ── T-202604-372: Drag & drop sesión → textarea col 1 ──

let _trackerDragSessId = null;
let _trackerDragAiId   = null;

function _trackerHistDragStart(e, sessId, aiId) {
  _trackerDragSessId = sessId;
  _trackerDragAiId   = aiId;
  e.dataTransfer.effectAllowed = 'copy';
  // texto a soltar: título de la sesión como referencia
  const allSessions = getAllSessions();
  const s = allSessions.find(x => x.id === sessId);
  const text = s ? s.title : sessId;
  e.dataTransfer.setData('text/plain', text);
  e.currentTarget.classList.add('dragging');
}

function _trackerHistDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  _trackerDragSessId = null;
  _trackerDragAiId   = null;
}

function _trackerHistAttachDropTargets() {
  // Attach drop zone a todos los textareas ta-{aiId} visibles
  document.querySelectorAll('textarea[id^="ta-"]').forEach(ta => {
    if (ta._trackerDropAttached) return;
    ta._trackerDropAttached = true;

    ta.addEventListener('dragover', (e) => {
      if (!_trackerDragSessId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      ta.classList.add('tracker-drop-active');
    });

    ta.addEventListener('dragleave', () => {
      ta.classList.remove('tracker-drop-active');
    });

    ta.addEventListener('drop', (e) => {
      if (!_trackerDragSessId) return;
      e.preventDefault();
      ta.classList.remove('tracker-drop-active');

      const allSessions = getAllSessions();
      const s = allSessions.find(x => x.id === _trackerDragSessId);
      if (!s) return;

      // Insertar referencia de sesión: título + fecha como texto en el textarea
      const dateLabel = (typeof relDate === 'function' && s.date) ? relDate(s.date) : (s.dateShort || '');
      const ref = `[Sesión: ${s.title}${dateLabel ? ' · ' + dateLabel : ''}]`;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const before = ta.value.slice(0, start);
      const after  = ta.value.slice(end);
      ta.value = before + ref + after;
      ta.selectionStart = ta.selectionEnd = start + ref.length;
      ta.dispatchEvent(new Event('input'));
      ta.focus();
    });
  });
}

// ── Tab pills mobile ──
function _trackerSwitchCol(col) {
  document.querySelectorAll('.tracker-col').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tracker-col-tab').forEach(btn => btn.classList.remove('active'));

  const colMap = { card: 'tracker-col-card', hist: 'tracker-col-hist' };
  const colEl = document.getElementById(colMap[col]);
  if (colEl) colEl.classList.add('active');

  const tab = document.querySelector(`.tracker-col-tab[data-col="${col}"]`);
  if (tab) tab.classList.add('active');
}

// Inicializar col card como activa en mobile al cargar
(function _trackerInitMobileCol() {
  const cardCol = document.getElementById('tracker-col-card');
  if (cardCol) cardCol.classList.add('active');
})();

// ══ END R-202604-059 ══

// R-migración Firebase→Supabase eliminada — AC-8: migración completada
