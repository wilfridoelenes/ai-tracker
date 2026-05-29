export class DistributedSync {
  synchronize(nodes) {
    return {
      synchronized: true,
      nodes
    }
  }
}

export const distributedSync =
  new DistributedSync()
