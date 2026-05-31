export class LifecycleManager {
  constructor() {
    this.modules = []
  }

  register(module) {
    this.modules.push(module)
  }

  async boot() {
    for (const mod of this.modules) {
      if (mod.boot) {
        await mod.boot()
      }
    }
  }

  async destroy() {
    for (const mod of this.modules) {
      if (mod.destroy) {
        await mod.destroy()
      }
    }
  }
}

export const lifecycleManager = new LifecycleManager()
