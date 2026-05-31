export class FaultBoundary {
  async execute(task) {
    try {
      return await task()
    } catch (error) {
      console.error('Fault isolated:', error)
      return null
    }
  }
}

export const faultBoundary = new FaultBoundary()
