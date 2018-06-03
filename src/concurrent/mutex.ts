import { Network } from '../network/base'

const generateNanoseconds = () => {
  let [sec, nanosec] = process.hrtime()
  return sec * 1000000000 + nanosec
}

export class Mutex {
  using = false
  acquiring = false
  acquireTimestamp = 0
  waitingQueue = []
  given = 0
  acquireCallback = null

  constructor(public id: string, public network: Network) {
    this.network.on('receive', ({ from, to, data }) => {
      if (data.mutex === id) {
        if (data.method === 'acquire' && from !== this.network.address) {
          if (!this.using && (!this.acquiring || this.acquireTimestamp > data.time)) {
            this.network.send({ mutex: this.id, method: 'permit' }, from)
          } else {
            this.waitingQueue.push(from)
          }
        } else if (data.method === 'permit') {
          this.given++
          if (this.given >= this.network.neighbors.length) {
            this.given -= this.network.neighbors.length
            this.acquireCallback()
          }
        }
      }
    })
  }

  async acquire() {
    this.acquiring = true
    this.given = 0
    this.acquireTimestamp = generateNanoseconds()
    this.network.broadcast({ mutex: this.id, method: 'acquire', time: this.acquireTimestamp })
    await new Promise(r => this.acquireCallback = r)
    this.using = true
    this.acquiring = false
  }

  async release() {
    if (!this.using) {
      throw Error('Trying to release a mutex without holding.')
    }
    this.waitingQueue.map(k => this.network.send({ mutex: this.id, method: 'permit' }, k))
    this.using = false
  }
}