var EventEmitter = require('events')
var child = require('child_process')

// single thread digest calculator using open ssl
class Digester extends EventEmitter { 

  constructor() {
    super()
    this.queue = []

    this.current = null
    this.spawn = null
    this.hash = null
  }

  digest(fpath) {
    this.queue.push(fpath) 
    this.openssl()
  } 

  openssl() {

    if (this.spawn) return          // busy    

    do { // FIXME
      this.current = this.queue.shift()
    } while(this.current.parent === null)

    this.current = this.queue.shift() 
    // console.log('calculating ' + this.current)
    this.spawn = child.spawn('openssl', ['dgst', '-sha256', '-r', this.current])
    this.spawn.stdout.on('data', data => {
      this.hash = data.toString().split(' ')[0]
    })

    this.spawn.on('close', code => {

      if (code === 0) {
        console.log(this.hash)
        // FIXME
      }
      else {
        console.log('error: ' + this.current + ', code: ' + code)
        // FIXME
      }
      
      this.current = null
      this.spawn = null
      this.hash = null
      this.openssl()
    })
  }
}

export default () => new Digester()

