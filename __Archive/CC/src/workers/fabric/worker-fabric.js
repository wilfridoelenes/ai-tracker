export class WorkerFabric {
  constructor() {
    this.workers = new Map()
  }

  register(name, worker) {
    this.workers.set(name, worker)
  }

  dispatch(name, payload) {
    const worker = this.workers.get(name)

    if (!worker) {
      throw new Error(`Worker not found: ${name}`)
    }

    worker.postMessage(payload)
  }

  size() {
    return this.workers.size
  }
}

export const workerFabric = new WorkerFabric()
