export class PluginSystem {
  constructor() {
    this.plugins = []
  }

  use(plugin) {
    this.plugins.push(plugin)
  }

  initialize() {
    this.plugins.forEach(plugin => {
      if (plugin.boot) plugin.boot()
    })
  }
}

export const pluginSystem = new PluginSystem()
