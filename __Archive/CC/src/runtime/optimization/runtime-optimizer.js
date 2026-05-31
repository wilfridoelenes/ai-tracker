export class RuntimeOptimizer {
  optimize(modules = []) {
    return modules.sort()
  }

  prioritize(tasks = []) {
    return tasks.reverse()
  }
}

export const runtimeOptimizer =
  new RuntimeOptimizer()
