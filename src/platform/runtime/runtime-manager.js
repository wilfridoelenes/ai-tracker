export class RuntimeManager {
  constructor() {
    this.modules = new Map()
  }

  register(name, module) {
    this.modules.set(name, module)
  }

  get(name) {
    return this.modules.get(name)
  }

  list() {
    return [...this.modules.keys()]
  }
}

export const runtimeManager = new RuntimeManager()
