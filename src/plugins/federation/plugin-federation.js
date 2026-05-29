export class PluginFederation {
  async load(pluginUrl) {
    console.log('Loading federated plugin:', pluginUrl)

    return {
      loaded: true,
      pluginUrl
    }
  }
}

export const pluginFederation = new PluginFederation()
