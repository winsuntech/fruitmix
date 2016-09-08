import path from 'path'
import EventEmitter from 'events'

import Promise from 'bluebird'

import { fs, mkdirpAsync, rimrafAsync } from '../util/async'

import { readXstat, readXstatAsync } from './xstat'
import { nodeUserReadable, nodeUserWritable} from './perm'

import { createDrive } from './drive'
import createHashMagic from './hashMagic'

class Repo extends EventEmitter {

  // repo constructor
  constructor(paths, driveModel) {
    super()
    this.paths = paths
    this.driveModel = driveModel
    this.drives = []
    this.initState = 'IDLE' // 'INITIALIZING', 'INITIALIZED', 'DEINITIALIZING',
    this.hashMagicWorker = createHashMagic()
    this.hashMagicWorker.on('end', ret => {
      console.log('===')
      console.log(ret)
      console.log('===')
      console.log(this.hashMagicWorker)
      console.log('===')
    })
  }

  // create a fruitmix drive object (not create a drive model!)
  createFruitmixDrive(conf, callback) {

    let dir = this.paths.get('drives')
    let drvpath = path.join(dir, conf.uuid)
    fs.stat(drvpath, (err, stat) => {

      if (err) return callback(err)
      let drive = createDrive(conf)
      drive.on('driveCached', () => console.log(`driveCached: ${drive.uuid}`))
      drive.on('hashlessAdded', node => {
        console.log(`hashlessAdded: ${drive.uuid} ${node.name}`) 
        this.hashMagicWorker.start(drive.abspath(node), node.uuid)
      })
      drive.setRootpath(drvpath)
      callback(null, drive)
    })
  }

  // retrieve all drives from configuration
  // TODO there may be a small risk that a user is deleted but drive not
  init(callback) {

    if (this.initState !== 'IDLE') return new Error('invalid state')

    this.initState = 'INITIALIZING'

    // retrieve drive directory 
    let dir = this.paths.get('drives')
    let list = this.driveModel.collection.list
    let count = list.length

    if (!count) {
      this.initState = 'INITIALIZED'
      return callback()
    }

    list.forEach(conf => {
      if (conf.URI === 'fruitmix') {
        this.createFruitmixDrive(conf, (err, drive) => {
          if (!err) this.drives.push(drive)
          if (!--count) {
            this.initState = 'INITIALIZED'
            callback()
          }
        })
      }
      else if (!--count)
        callback()
    })
  }

  // SERVICE API: create new fruitmix drive
  // label must be string, can be empty
  // fixedOwner, true or false
  // owner, uuid array, must be exactly one if fixedOwner true
  // writelist, uuid array
  // readlist, uuid array
  // memCache, true or false
  // return uuid 
  async apiCreateFruitmixDrive({label, fixedOwner, owner, writelist, readlist, memCache}) {

    let uuid = UUID.v4()          
    let dir = this.paths.get('drives')

    // create foldre in drive dir
    await mkdirpAsync(path.join(dir, uuid))

    // save to driveModel
    await this.driveModel.createDrive({
      label, fixedOwner, URI: 'fruitmix', uuid, owner, writelist, readlist, memCache
    })
   
    // create drive and load it 
    let drv = createFruitmixDrive(dir)(conf)
    this.drives.push(drv)

    return uuid
  }

  // FIXME real implementation should maintain a table
  getTmpDirForDrive(drive) {
    return this.paths.get('tmp') 
  }
  
  findNodeByUUID(uuid) {
    return this.findNodeInDriveByUUID(uuid)
  }

  findNodeInDriveByUUID(uuid) {
    for (let i = 0; i < this.drives.length; i++) {
      if (this.drives[i].cacheState !== 'CREATED') continue
      let x = this.drives[i].uuidMap.get(uuid)
      if (x) return x
    }
  }

  // operation name, args ..., return true / false
  permission(nodeuuid,useruuid,action) {
    let node=null
    switch(action.type) {
    case 'DRV_CREATE_FILE_OR_FOLDER':
      node = findNodeInDriveByUUID(nodeuuid)
      if (!node) return new Error('uuid not found')
      return nodeUserWritable(node,useruuid)
      // requires user have at least write permission in folder, or, this is the drive he/she owns.
      // requires action.userUUID, action.folderUUID
    case 'DRV_DELETE_FILE_OR_FOLDER':
      node = findNodeInDriveByUUID(nodeuuid)
      if (!node) return new Error('uuid not found')
      return nodeUserWritable(node,useruuid)
    case 'LIB_CREATE_FILE':
      node = findNodeInLibraryByUUID(nodeuuid)
      if (!node) return new Error('uuid not found')
      return nodeUserWritable(node,useruuid)
    case 'LIB_DELETE_FILE':
      node = findNodeInLibraryByUUID(nodeuuid)
      if (!node) return new Error('uuid not found')
      return nodeUserWritable(node,useruuid)
    case 'DRV_READ_FILE':
      node = findNodeInDriveByUUID(nodeuuid)
      if (!node) return new Error('uuid not found')
      return nodeUserReadable(node,useruuid)
    case 'LIB_READ_FILE':
      node = findNodeInLibraryByUUID(nodeuuid)
      if (!node) return new Error('uuid not found')
      return nodeUserReadable(node,useruuid)
    case 'DRV_READ_FILE':
      node = findNodeInDriveByUUID(nodeuuid)
      if (!node) return new Error('uuid not found')
      return nodeUserWritable(node,useruuid)
    case 'LIB_READ_FILE':
      node = findNodeInLibraryByUUID(nodeuuid)
      if (!node) return new Error('uuid not found')
      return nodeUserWritable(node,useruuid)
    default:
      return false
    }
  }
  
  createFileInDrive(userUUID, srcpath, targetDirUUID, filename, callback) {

    let node = this.findNodeInDriveByUUID(targetDirUUID)
    if (!node) return callback(new Error('uuid not found')) 

    node.tree.importFile(userUUID, srcpath, node, filename, (err, node) => {
      err ? callback(err) : callback(null, node)
    })
  }

  // tested briefly
  createFolder(userUUID, folderName, targetDirUUID, callback) {
    
    let node = this.findNodeInDriveByUUID(targetDirUUID)
    if (!node) return callback(new Error('uuid not found'))

    node.tree.createFolder(userUUID, node, folderName, (err, node) => 
      err ? callback(err) : callback(null, node))
  }

  /** read **/  
  readDriveFileorFolderInfo(uuid){
    let node = this.findNodeInDriveByUUID(uuid)
    if (!node) return new Error('uuid not found')

    return node
  }

  /** update **/
  renameDriveFileOrFolder(uuid, newName,callback) {

    let node = this.findNodeInDriveByUUID(uuid)
    if (!node) return callback(new Error('uuid not found'))

    node.tree.renameFileOrFolder(node,newName, (err,node)=>{
      err ? callback(err) : callback(null, node)
    })
    // TODO
  } 

  // overwrite
  updateDriveFile(targetDirUUID, xattr,callback) {
    let node = this.findNodeInDriveByUUID(targetDirUUID)
    if (!node) return callback(new Error('uuid not found'))

    node.tree.updateDriveFile(node,xattr,(err,node)=>{
      err ? callback(err) : callback(null, node)
    })
  }

  /** delete **/
  deleteDriveFolder(folderUUID,callback) {
    let node = this.findNodeInDriveByUUID(folderUUID)
    if (!node) return callback(new Error('uuid not found'))

    node.tree.deleteFileOrFolder(node,(err,node)=>{
      err ? callback(err) : callback(null, node)
    })
  }
}

const createRepo = (paths, driveModel) => new Repo(paths, driveModel)

const testing = {
}

export { createRepo, testing }

