export class SecurityManager {
  validatePlugin(plugin) {
    return Boolean(plugin?.name)
  }

  authorize(scope) {
    console.log('Authorizing scope:', scope)
    return true
  }
}

export const securityManager = new SecurityManager()
