export class PluginRegistry {
  constructor() {
    this.plugins = []
  }

  register(plugin) {
    this.plugins.push(plugin)
  }

  all() {
    return this.plugins
  }
}

export const pluginRegistry = new PluginRegistry()
