export const appState = {
  ui: {},
  sessions: {},
  analytics: {},
  backlog: {},
  storage: {}
}

export function setState(key, value) {
  appState[key] = value
}

export function getState(key) {
  return appState[key]
}
