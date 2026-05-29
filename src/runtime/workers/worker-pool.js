export class WorkerPool {
  constructor() {
    this.workers = []
  }

  register(worker) {
    this.workers.push(worker)
  }

  size() {
    return this.workers.length
  }
}

export const workerPool = new WorkerPool()
