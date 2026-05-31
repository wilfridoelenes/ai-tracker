export class RuntimeTelemetry {
  trace(event, payload = {}) {
    console.log('[Telemetry]', event, payload)
  }

  performance(name, duration) {
    console.log('[Performance]', name, duration)
  }

  memory(snapshot) {
    console.log('[Memory]', snapshot)
  }
}

export const telemetry = new RuntimeTelemetry()
