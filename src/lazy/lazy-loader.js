export async function lazyLoad(path) {
  return await import(path)
}
