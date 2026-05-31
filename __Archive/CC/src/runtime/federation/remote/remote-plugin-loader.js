export class RemotePluginLoader {
  async load(url) {
    return {
      loaded: true,
      url
    }
  }
}

export const remotePluginLoader =
  new RemotePluginLoader()
