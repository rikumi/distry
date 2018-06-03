import { Network } from './base'
import * as fs from 'fs'
import * as cp from 'child_process'
import * as crypto from 'crypto'
import chalk from 'chalk'

export class FileNetwork extends Network {
  address: string
  neighbors = []

  constructor(public fileName) {
    super()
    this.address = crypto.randomBytes(4).toString('hex')
    cp.execSync(`touch ${fileName}`)

    const reader = cp.spawn('tail', ['-0f', fileName])
    reader.stdout.on('data', data => {
      try {
        data.toString().trim().split('\n').map(k => {
          let { data, from, to } = JSON.parse(k)
          if (!to || to === this.address) {
            this.emit('receive', { data, from, to })
          }
        })
      } catch (e) {
        console.error(e)
      }
    })

    this.broadcast('join')
    this.on('receive', ({ from, to, data }) => {
      if (data === 'join' && from !== this.address && !~this.neighbors.indexOf(from)) {
        this.neighbors.push(from)
        if (!to) {
          this.send('join', from)
        }
      }
    })
    console.log('[FileNet]', `connected to network ${chalk.yellow(fileName)} with address ${chalk.yellow(this.address)}`)
  }

  send(data: any, to: string) {
    fs.appendFile(this.fileName, JSON.stringify({ data, from: this.address, to }) + '\n', () => {})
  }

  broadcast(data: any) {
    fs.appendFile(this.fileName, JSON.stringify({ data, from: this.address }) + '\n', () => {})
  }
}