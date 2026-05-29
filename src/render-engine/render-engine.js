export class RenderEngine {
  render(component, state) {
    return component(state)
  }
}

export const renderEngine = new RenderEngine()
