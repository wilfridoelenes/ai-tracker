export class DependencyResolver {
  constructor() {
    this.graph = new Map()
  }

  register(moduleName, dependencies = []) {
    this.graph.set(moduleName, dependencies)
  }

  resolve(moduleName, visited = new Set()) {
    if (visited.has(moduleName)) {
      throw new Error(`Circular dependency detected: ${moduleName}`)
    }

    visited.add(moduleName)

    const deps = this.graph.get(moduleName) || []

    return deps.flatMap(dep => [
      dep,
      ...this.resolve(dep, visited)
    ])
  }

  executionOrder() {
    return [...this.graph.keys()]
  }
}

export const dependencyResolver = new DependencyResolver()
