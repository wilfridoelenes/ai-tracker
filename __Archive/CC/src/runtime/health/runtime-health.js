export class RuntimeHealth {
  constructor() {
    this.metrics = {
      memory: [],
      renders: [],
      workers: [],
      plugins: []
    }
  }

  report(type, payload) {
    if (!this.metrics[type]) {
      this.metrics[type] = []
    }

    this.metrics[type].push({
      ...payload,
      timestamp: Date.now()
    })
  }

  snapshot() {
    return this.metrics
  }
}

export const runtimeHealth = new RuntimeHealth()
