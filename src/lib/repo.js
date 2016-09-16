import path from 'path'
import EventEmitter from 'events'

import Promise from 'bluebird'

import { fs, mkdirpAsync, rimrafAsync } from '../util/async'

import { readXstat, readXstatAsync } from './xstat'

import { createDrive } from './drive'
import createHashMagic from './hashMagic'

// repo is responsible for managing all drives
class Repo extends EventEmitter {

  // repo constructor
  constructor(paths, driveModel, forest) {

    super()

    this.paths = paths
    this.driveModel = driveModel
    this.forest = forest

    this.forest.on('driveCached', () => console.log(`driveCached: ${drive.uuid}`))
    this.forest.on('hashlessAdded', node => {
      console.log(`hashlessAdded drive: uuid:${node.uuid} path:${node.namepath()}`) 
      this.hashMagicWorker.start(node.namepath(), node.uuid)
    })

    this.state = 'IDLE' // 'INITIALIZING', 'INITIALIZED', 'DEINITIALIZING',

    this.scanners = []

    this.hashMagicWorker = createHashMagic()
    this.hashMagicWorker.on('end', ret => {

      if (this.state === 'IDLE') return

      // find drive containing this uuid
      this.forest.updateHashMagic(ret.target, ret.uuid, ret.hash, ret.magic, ret.timestamp, err => {

        if (this.forest.hashless.size === 0) {
          console.log(`hashMagicWorkerStopped`)
          return this.emit('hashMagicWorkerStopped')
        }
        
        let node = this.forest.hashless.values().next().value 
        this.hashMagicWorker.start(node.namepath(), node.uuid)
      })
    })

  }

  async initAsync() {

    if (this.state !== 'IDLE') throw new Error('invalid state')

    this.state = 'INITIALIZING'
    
    let dir = this.paths.get('drives')
    let list = this.driveModel.collection.list
    let props = []

    // TODO this is the easy version
    for (let i = 0; i < list.length; i++) {

      let conf = list[i]
      if (conf.URI !== 'fruitmix') 
        continue

      try {
        let stat = await fs.statAsync(path.join(dir, conf.uuid))
        if (stat.isDirectory()) {
          props.push({
            uuid: conf.uuid,
            type: 'folder',
            owner: conf.owner,
            writelist: conf.writelist,
            readlist: conf.readlist,
            name: path.join(dir, conf.uuid)
          })
        }
      }
      catch (e) {
        continue
      }
    } // loop end

    let roots = props.map(prop => 
      this.forest.createNode(null, prop))     

    let promises = roots.map(root => 
      new Promise(resolve => this.forest.scan(root, () => resolve())))

    Promise.all(promises)
      .then(() => this.emit('driveCached'))
      .catch(e => {})

    this.state = 'INITIALIZED'
  }

  // TODO there may be a small risk that a user is deleted but drive not
  init(callback) {
    this.initAsync()
      .then(() => callback())
      .catch(e => callback(e))
  }

  // TODO
  deinit() {
    this.hashMagicWorker.abort()
    this.state = 'IDLE'
  }

  // FIXME real implementation should maintain a table
  getTmpDirForDrive(drive) {
    return this.paths.get('tmp') 
  }

  getTmpFolderForNode(node) {
    return this.paths.get('tmp')
  }

  getDrives(userUUID) {
    return this.driveModel.collection.list
  }

////////////////////////////////////////////////////////////////////////////////

}

const createRepo = (paths, driveModel, forest) => new Repo(paths, driveModel, forest)

const testing = {
}

export { createRepo, testing }

