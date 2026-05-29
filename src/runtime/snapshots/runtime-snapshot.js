export class RuntimeSnapshot {
  capture(state) {
    return {
      timestamp: Date.now(),
      state
    }
  }
}

export const runtimeSnapshot = new RuntimeSnapshot()
