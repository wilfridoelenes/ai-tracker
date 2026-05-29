export class ModuleRegistry {
  constructor() {
    this.modules = new Map()
  }

  register(name, module) {
    this.modules.set(name, module)
  }

  resolve(name) {
    return this.modules.get(name)
  }

  list() {
    return [...this.modules.keys()]
  }
}

export const moduleRegistry = new ModuleRegistry()
