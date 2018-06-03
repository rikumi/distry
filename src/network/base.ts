import { EventEmitter } from 'events'

export class Network extends EventEmitter {
  address: string
  neighbors: string[]

  send(data: any, to: string) {
    throw new Error('Not implemented')
  }

  broadcast(data: any) {

  }
}