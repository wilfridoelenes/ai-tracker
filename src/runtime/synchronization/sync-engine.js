export class SyncEngine {
  synchronize(source, target) {
    return {
      source,
      target,
      synchronized: true
    }
  }
}

export const syncEngine = new SyncEngine()
