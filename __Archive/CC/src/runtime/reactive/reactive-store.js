export class ReactiveStore {
  constructor(initial = {}) {
    this.state = initial
    this.listeners = []
  }

  subscribe(listener) {
    this.listeners.push(listener)
  }

  setState(next) {
    this.state = { ...this.state, ...next }
    this.listeners.forEach(fn => fn(this.state))
  }

  getState() {
    return this.state
  }
}

export const reactiveStore = new ReactiveStore()
