export class PluginHotPatcher {
  async patch(plugin, update) {
    return {
      plugin,
      patched: true,
      update
    }
  }
}

export const pluginHotPatcher =
  new PluginHotPatcher()
