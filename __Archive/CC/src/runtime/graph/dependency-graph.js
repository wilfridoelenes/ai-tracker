export class DependencyGraph {
  constructor() {
    this.nodes = new Map()
  }

  addModule(name, deps = []) {
    this.nodes.set(name, deps)
  }

  dependencies(name) {
    return this.nodes.get(name) || []
  }

  visualize() {
    return [...this.nodes.entries()]
  }
}

export const dependencyGraph = new DependencyGraph()
