export class ObservabilityEngine {
  metric(name, value) {
    console.log('[Metric]', name, value)
  }

  trace(event, payload = {}) {
    console.log('[Trace]', event, payload)
  }

  profile(name, callback) {
    const start = performance.now()
    const result = callback()
    const end = performance.now()

    console.log('[Profile]', name, end - start)

    return result
  }
}

export const observability = new ObservabilityEngine()
