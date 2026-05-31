self.onmessage = async (event) => {
  const payload = event.data

  self.postMessage({
    processed: true,
    payload,
    worker: 'distributed-worker'
  })
}
