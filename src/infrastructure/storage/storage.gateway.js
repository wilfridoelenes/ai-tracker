export class StorageGateway {
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  load(key) {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  }
}

export const storageGateway = new StorageGateway()
