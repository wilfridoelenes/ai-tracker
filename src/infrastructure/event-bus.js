export class EventBus {
  constructor() {
    this.events = new Map()
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
  }

  emit(event, payload) {
    const listeners = this.events.get(event) || []
    listeners.forEach(cb => cb(payload))
  }
}

export const globalEventBus = new EventBus()
