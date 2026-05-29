export class RuntimeMonitor {
  event(name, payload = {}) {
    console.log('[Monitor]', name, payload)
  }

  warning(message) {
    console.warn('[Warning]', message)
  }

  critical(message) {
    console.error('[Critical]', message)
  }
}

export const runtimeMonitor = new RuntimeMonitor()
