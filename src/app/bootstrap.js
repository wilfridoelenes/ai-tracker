import * as Modules from '../esm-core/index.js'
import { globalEventBus } from '../infrastructure/event-bus.js'

export async function initializeApplication() {
  console.log('Advanced ESM Bootstrap')

  const total = Object.keys(Modules).length

  globalEventBus.emit('system:ready', {
    modules: total
  })

  console.log('Modules loaded:', total)

  return total
}
