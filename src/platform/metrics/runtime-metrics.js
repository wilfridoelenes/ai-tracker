export class RuntimeMetrics {
  collect() {
    return {
      memory: performance.memory || {},
      timestamp: Date.now()
    }
  }
}

export const runtimeMetrics = new RuntimeMetrics()
