export class RuntimeDiagnostics {
  log(message, payload = {}) {
    console.log('[Runtime]', message, payload)
  }

  warn(message) {
    console.warn('[Runtime Warning]', message)
  }

  error(message) {
    console.error('[Runtime Error]', message)
  }
}

export const diagnostics = new RuntimeDiagnostics()
