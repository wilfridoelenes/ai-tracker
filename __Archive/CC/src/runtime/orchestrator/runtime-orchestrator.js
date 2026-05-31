export class RuntimeOrchestrator {
  constructor() {
    this.modules = []
  }

  register(module) {
    this.modules.push(module)
  }

  async start() {
    for (const module of this.modules) {
      if (module.boot) {
        await module.boot()
      }
    }

    return this.modules.length
  }
}

export const runtimeOrchestrator = new RuntimeOrchestrator()
