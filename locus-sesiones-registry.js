// [PP] v1.2.4 · sprint:PP-S-01 · mod:1 · autor:Rune · 2026-06-06 UTC-6
// locus-sesiones-registry.js
// T-202606-058: Registry de callbacks para desacoplar locus-sesiones.js ↔ locus-sprint-project.js
// Patrón idéntico a _coreCallbacks en locus-backlog-core.js (T-202606-057).
// Sin dependencias — importable por cualquier módulo sin arrastrar el árbol de locus-sesiones.
//
// Funciones registradas por locus-sprint-project en DOMContentLoaded:
//   getProjectById          → _sesSPCallbacks.getProjectById          (retorna objeto | undefined)
//   _getActiveProjectFilter → _sesSPCallbacks.getActiveProjectFilter  (retorna string)
//   openProjModal           → _sesSPCallbacks.openProjModal           (acción void)
//   selectProjectFilter     → _sesSPCallbacks.selectProjectFilter     (acción void)

export const _sesSPCallbacks = {};

export function _registerSesSPCallback(name, fn) {
  if (typeof fn !== 'function') {
    console.warn('[locus-sesiones-registry] _registerSesSPCallback: "' + name + '" no es función — ignorado');
    return;
  }
  _sesSPCallbacks[name] = fn;
}
