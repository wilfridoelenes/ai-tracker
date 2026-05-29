export class DistributedScheduler {
  constructor() {
    this.queue = []
  }

  schedule(task, options = {}) {
    this.queue.push({
      task,
      priority: options.priority || 'normal'
    })
  }

  async run() {
    for (const item of this.queue) {
      await item.task()
    }
  }
}

export const distributedScheduler = new DistributedScheduler()
