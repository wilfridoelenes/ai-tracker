export class AdvancedTelemetry {
  metric(name, value) {
    console.log('[AdvancedMetric]', name, value)
  }

  timing(name, duration) {
    console.log('[Timing]', name, duration)
  }

  dependency(name, latency) {
    console.log('[Dependency]', name, latency)
  }
}

export const advancedTelemetry =
  new AdvancedTelemetry()
