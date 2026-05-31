import { lifecycleManager } from './lifecycle/lifecycle-manager.js'
import { diagnostics } from './diagnostics/runtime-diagnostics.js'

export async function bootstrapRuntime() {
  diagnostics.log('Runtime boot start')

  await lifecycleManager.boot()

  diagnostics.log('Runtime boot completed')
}
