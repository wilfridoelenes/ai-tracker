export class SandboxRuntime {
  execute(plugin) {
    console.log('Executing isolated plugin:', plugin)
  }
}

export const sandboxRuntime = new SandboxRuntime()
