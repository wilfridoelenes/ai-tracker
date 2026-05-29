export class DependencyContainer {
  constructor() {
    this.services = new Map()
  }

  register(name, service) {
    this.services.set(name, service)
  }

  resolve(name) {
    return this.services.get(name)
  }
}

export const container = new DependencyContainer()
