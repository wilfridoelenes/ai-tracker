
export class BacklogService {
  createItem(payload) {
    return {
      id: crypto.randomUUID(),
      ...payload
    }
  }
}
