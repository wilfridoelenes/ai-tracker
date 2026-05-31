import { moduleRegistry } from './registry/module-registry.js'
import { observability } from '../runtime/observability/observability-engine.js'

export async function bootKernel() {
  observability.trace('kernel:boot:start')

  console.log('Kernel initialized')
  console.log('Registered modules:', moduleRegistry.list().length)

  observability.trace('kernel:boot:complete')
}
