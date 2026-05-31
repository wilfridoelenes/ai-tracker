export class AutoScaler {
  scale(workers, load) {
    if (load > 0.8) {
      return workers + 1
    }

    if (load < 0.3 && workers > 1) {
      return workers - 1
    }

    return workers
  }
}

export const autoScaler = new AutoScaler()
