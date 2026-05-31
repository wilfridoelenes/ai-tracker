self.onmessage = (event) => {
  const result = {
    received: true,
    payload: event.data
  }

  self.postMessage(result)
}
