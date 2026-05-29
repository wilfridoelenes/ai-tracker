export class RuntimePersistence {
  save(snapshot) {
    return JSON.stringify(snapshot)
  }

  restore(serialized) {
    return JSON.parse(serialized)
  }
}

export const runtimePersistence =
  new RuntimePersistence()
