export class HotReloadManager {
  async reload(moduleName) {
    console.log('Reloading module:', moduleName)
  }
}

export const hotReloadManager = new HotReloadManager()
