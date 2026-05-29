export class ExecutionEngine {
  async execute(task) {
    const started = performance.now()

    const result = await task()

    const ended = performance.now()

    return {
      result,
      duration: ended - started
    }
  }
}

export const executionEngine = new ExecutionEngine()
