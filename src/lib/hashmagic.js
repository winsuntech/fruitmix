var EventEmitter = require('events')
var child = require('child_process')

class HashMagic extends EventEmitter {

  constructor(target, uuid, timestamp) {
    super()

    this.target = target
    this.uuid = uuid
    this.timestamp = timestamp

    this.hashSpawn = null
    this.hash = null

    this.magicSpawn = null
    this.magic = null

    this.abort = false
  }

  start() {

    this.hashSpawn = child.spawn('openssl', ['dgst', '-sha256', '-r', this.target])
    this.hashSpawn.stdout.on('data', data => {
      let hash = data.toString().trim().split(' ')[0]
      this.hashSpawn = null
      this.hash = hash
      if (this.magic)
        this.emit('finish')
    })
      
    this.magicSpawn = child.spawn('file', ['-b', this.target])
    this.magicSpawn.stdout.on('data', data => {
      let magic = data.toString().trim()
      this.magicSpawn = null
      this.magic = magic
      if (this.hash)
        this.emit('finish')
    })
  }


}

var hm = new HashMagic('perm.js', 123, 456)
hm.start()
hm.on('finish', () => console.log(hm))


