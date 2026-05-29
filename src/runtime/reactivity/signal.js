export class Signal {
  constructor(value) {
    this.value = value
    this.subscribers = []
  }

  get() {
    return this.value
  }

  set(value) {
    this.value = value
    this.subscribers.forEach(fn => fn(value))
  }

  subscribe(fn) {
    this.subscribers.push(fn)
  }
}
