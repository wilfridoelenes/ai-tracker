export class CommandBus {
  constructor() {
    this.handlers = new Map()
  }

  register(command, handler) {
    this.handlers.set(command, handler)
  }

  async execute(command, payload) {
    const handler = this.handlers.get(command)

    if (!handler) {
      throw new Error(`No handler for ${command}`)
    }

    return await handler(payload)
  }
}

export const commandBus = new CommandBus()
