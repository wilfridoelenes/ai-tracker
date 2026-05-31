export class RuntimeCompiler {
  compile(module) {
    console.log('Compiling module:', module)
    return module
  }
}

export const runtimeCompiler = new RuntimeCompiler()
