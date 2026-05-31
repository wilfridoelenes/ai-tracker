export class RuntimeGraphVisualizer {
  render(graph) {
    return JSON.stringify(graph, null, 2)
  }
}

export const runtimeGraphVisualizer =
  new RuntimeGraphVisualizer()
