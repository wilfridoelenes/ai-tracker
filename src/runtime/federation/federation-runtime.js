export class FederationRuntime {
  async loadRemote(name) {
    console.log('Loading remote module:', name)
  }
}

export const federationRuntime = new FederationRuntime()
