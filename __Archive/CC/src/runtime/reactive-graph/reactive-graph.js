export class ReactiveGraph {
  constructor() {
    this.nodes = new Map()
  }

  subscribe(node, dependency) {
    if (!this.nodes.has(node)) {
      this.nodes.set(node, [])
    }

    this.nodes.get(node).push(dependency)
  }

  invalidate(node) {
    return {
      invalidated: node,
      dependencies: this.nodes.get(node) || []
    }
  }

  graph() {
    return [...this.nodes.entries()]
  }
}

export const reactiveGraph = new ReactiveGraph()
