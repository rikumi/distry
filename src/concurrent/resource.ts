import { EventEmitter } from 'events'
import { Network } from '../network/base'
import { Mutex } from './mutex'

export default class Resource extends EventEmitter {
  mutex: Mutex
  synced = {}
  syncedCallback = null

  constructor(public id: string, public value: any, public network: Network) {
    super()
    this.mutex = new Mutex(id, network)
    this.network.on('receive', ({ from, to, data }) => {
      if (data.resource === this.id) {
        if (data.method === 'change') {
          this.value = data.value
          this.emit('change', this.value)
          if (from !== this.network.address) {
            this.network.send({ resource: this.id, method: 'synced' }, from)
          }
        } else if (data.method === 'synced') {
          this.synced[from] = true
          if (!this.network.neighbors.find(k => !this.synced[k])) {
            this.syncedCallback()
          }
        }
      }
    })
  }

  async update(mapFunc) {
    await this.mutex.acquire()
    this.network.broadcast({ resource: this.id, method: 'change', value: mapFunc(this.value) })
    await new Promise(r => this.syncedCallback = r)
    await this.mutex.release()
  }
}