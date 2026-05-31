export class TaskScheduler {
  queue(task) {
    return queueMicrotask(task)
  }

  defer(task) {
    return setTimeout(task, 0)
  }
}

export const scheduler = new TaskScheduler()
