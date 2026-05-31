export class BaseRenderer {
  render(data) {
    throw new Error('render() must be implemented')
  }
}
