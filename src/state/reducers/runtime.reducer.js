export function runtimeReducer(state, action) {
  switch (action.type) {
    case 'RUNTIME_BOOT':
      return {
        ...state,
        booted: true
      }

    default:
      return state
  }
}
