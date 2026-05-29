export class CapabilityPolicy {
  constructor() {
    this.permissions = new Map()
  }

  allow(plugin, capability) {
    if (!this.permissions.has(plugin)) {
      this.permissions.set(plugin, [])
    }

    this.permissions.get(plugin).push(capability)
  }

  validate(plugin, capability) {
    return (this.permissions.get(plugin) || [])
      .includes(capability)
  }
}

export const capabilityPolicy = new CapabilityPolicy()
