// [PP] mod:2 · autor:Rune · 2026-07-31 UTC-6
// locus-sesiones-registry.js
// T-202606-058: Registry de callbacks para desacoplar locus-sesiones.js ↔ locus-sprint-project.js
// Patrón idéntico a _coreCallbacks en locus-backlog-core.js (T-202606-057).
// Sin dependencias — importable por cualquier módulo sin arrastrar el árbol de locus-sesiones.
//
// Funciones registradas por locus-sprint-project en DOMContentLoaded:
//   getProjectById          → _sesSPCallbacks.getProjectById          (retorna objeto | undefined)
//   _getActiveProjectFilter → _sesSPCallbacks.getActiveProjectFilter  (retorna string)
//   selectProjectFilter     → _sesSPCallbacks.selectProjectFilter     (acción void)
// inline_fix sesión 2026-07-31: entrada "openProjModal" retirada de esta lista — sin registro
// activo ni consumidor desde TKT-202607-213 (ver locus-sprint-project.js mod:16).

export const _sesSPCallbacks = {};

export function _registerSesSPCallback(name, fn) {
  if (typeof fn !== 'function') {
    console.warn('[locus-sesiones-registry] _registerSesSPCallback: "' + name + '" no es función — ignorado');
    return;
  }
  _sesSPCallbacks[name] = fn;
}
