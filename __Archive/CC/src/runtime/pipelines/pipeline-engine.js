export class PipelineEngine {
  constructor() {
    this.steps = []
  }

  use(step) {
    this.steps.push(step)
  }

  async run(payload) {
    let current = payload

    for (const step of this.steps) {
      current = await step(current)
    }

    return current
  }
}

export const pipelineEngine = new PipelineEngine()
