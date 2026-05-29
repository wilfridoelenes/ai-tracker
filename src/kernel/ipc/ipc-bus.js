export class IPCBus {
  constructor() {
    this.channels = new Map()
  }

  subscribe(channel, callback) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, [])
    }

    this.channels.get(channel).push(callback)
  }

  publish(channel, payload) {
    const listeners = this.channels.get(channel) || []

    listeners.forEach(cb => cb(payload))
  }
}

export const ipcBus = new IPCBus()
