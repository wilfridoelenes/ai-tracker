
export class SessionsService {
  createSession(data) {
    return {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...data
    }
  }
}
