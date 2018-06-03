import { FileNetwork } from './network/file'
import chalk from 'chalk'
import Resource from './concurrent/resource'

// import * as timeout from './promise-timeout'
// timeout(2000)

const net = new FileNetwork('./filenet-pool')
const sleep = async t => new Promise(r => setTimeout(r, t))

;(async () => {

  // wait for all others to join the network
  await sleep(1000)

  const MAX = 20
  const cars = new Resource('cars', 0, net)
  let empty = true
  let full = false

  cars.on('change', value => {
    if (value >= MAX) {
      full = true
      empty = false
    } else if (value <= 0) {
      empty = true
      full = false
    } else {
      empty = false
      full = false
    }
  })
 
  // while (true) {
    await sleep(1000 + Math.random() * 1000)
    if (Math.random() > 0.5 && !full || empty) {
      await cars.update(value => value + 1) // park
      console.log('parked', cars.value)
    } else {
      await cars.update(value => value - 1) // unpark
      console.log('unparked', cars.value)
    }
  // }
})()