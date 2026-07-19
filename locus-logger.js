// [PP] mod:1 · autor:Rune · 2026-07-18 22:30 UTC-6

// Flag único de gate para nivel debug — desactivado por default.
// Activar en consola: window._LOCUS_DEBUG = true
if (typeof window !== 'undefined' && typeof window._LOCUS_DEBUG === 'undefined') {
  window._LOCUS_DEBUG = false;
}

function _debugEnabled() {
  return typeof window !== 'undefined' && window._LOCUS_DEBUG === true;
}

function debug(...args) {
  if (_debugEnabled()) {
    console.log(...args);
  }
}

function warn(...args) {
  console.warn(...args);
}

function error(...args) {
  console.error(...args);
}

export { debug, warn, error };
