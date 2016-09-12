import path from 'path'
import EventEmitter from 'events'

import Promise from 'bluebird'

import { fs, mkdirpAsync, rimrafAsync } from '../util/async'

import { readXstat, readXstatAsync } from './xstat'

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

      if (this.initState === 'IDLE') return

      // find drive containing this uuid
      let drive = this.findDriveByUUID(ret.uuid) // TODO

      drive.updateHashMagic(ret.target, ret.uuid, ret.hash, ret.magic, ret.timestamp, err => {
        
        let ret = this.findHashless() 
        if (!ret) {
          console.log(`hashMagicWorkerStopped drive: ${drive.uuid}`)
          return this.emit('hashMagicWorkerStopped')
        }
        
        let { target, uuid } = ret
        this.hashMagicWorker.start(target, uuid)
      })
    })
    this.hashMagicWorkerState = 'STOPPED'
  }

  // this function find a hashless node in all drives, randomly
  findHashless() {

    let i
    let drives = this.drives.filter(drv => drv.hashless.size > 0) // FIXME filter out non-indexed drive
    if (!drives.length) return null
    
    i = Math.floor(Math.random() * drives.length)
    let drive = drives[i]

    let hashless = Array.from(drive.hashless)
    i = Math.floor(Math.random() * hashless.length)
    
    return {
      target: drive.abspath(hashless[i]),
      uuid: hashless[i].uuid
    }    
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
        console.log(`hashlessAdded drive: ${drive.uuid}, uuid:${node.uuid} path:${node.namepath()}`) 
        this.hashMagicWorker.start(node.namepath(), node.uuid)
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

  // TODO
  deinit() {
    this.hashMagicWorker.abort()
    this.initState = 'IDLE'
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

  getTmpFolderForNode(node) {
    return this.paths.get('tmp')
  }

  findDriveByUUID(uuid) {
    return this.drives.find(drv => {
      if (drv.uuidMap.get(uuid)) return true
      return false
    })
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

////////////////////////////////////////////////////////////////////////////////

  getFilePath(userUUID, fileUUID) {

    // FIXME!
    let drive = this.findDriveByUUID(fileUUID)
    let node = this.findNodeByUUID(fileUUID)
    if (!node) {
      return 'ENOENT'
    }

    if (!node.isFile()) {
      return 'EINVAL'
    }

    if (!node.userReadable(userUUID)) {
      return 'EACCESS'
    }

    return drive.abspath(node)
  }
  
  listFolder(userUUID, folderUUID) {

    let node = this.findNodeByUUID(folderUUID)
    if (!node) {
      let e = new Error(`listFolder: ${folderUUID} not found`)
      e.code = 'ENOENT'
      return e
    }

    if (!node.isDirectory()) {
      let e = new Error(`listFolder: ${folderUUID} is not a folder`)
      e.code = 'ENOTDIR'
      return e
    }

    if (!node.userReadable(userUUID)) {
      let e = new Error(`listFolder: ${folderUUID} not accessible for given user ${userUUID}`)
      e.code = 'EACCESS'
      return e
    }

    return node
      .getChildren()
      .map(n => {
        if (n.isDirectory()) {
          return {
            uuid: n.uuid,
            type: 'folder',
            owner: n.owner, 
            writelist: n.writelist,
            readlist: n.readlist,
            name: n.name
          }
        }
        else if (n.isFile()) {
          return {
            uuid: n.uuid,
            type: 'file',
            owner: n.owner,
            writelist: n.writelist,
            readlist: n.readlist,
            name: n.name,
            mtime: n.mtime,
            size: n.size
          }
        }
        else
          return null
      })
      .filter(n => !!n)
  }

  getMediaPath(userUUID, digest) {

    // only indexed drived
    for (let i = 0; i < this.drives.length; i ++) {
      let drive = drives[i]
      // drive.hashMap 
    }
  }

  getSharedWithMe(userUUID) {

    let set = new Set()
    
    let filtered = this.drives
    filtered.forEach(drv => {

      if (drv.owners.find(userUUID)) return

      drv.root.preVisit(node => {
        if (node.writelist) set.add(node)
      })
    })

    return Array.from(set)
  }

  getSharedToOthers(userUUID) {

    let set = new Set()
    
    let filtered = this.drives
    filtered.forEach(drv => {
      if (!drv.owners.find(userUUID)) return

      drv.root.preVisit(node => {
        if (node.writelist) set.add(node)
      })
    })

    return Array.from(set)
  }

  getMedia(userUUID) {
  
    let filtered = this.drives // TODO

    let map = new Map()
    filtered.forEach(drv => {
      drv.hashMap.forEach((digestObj, digest) => {
        if (map.has(digest)) return
        for (let i = 0; i < digestObj.nodes.length; i++) {
          if (digestObj.nodes[i].userReadable(userUUID)) {
            map.set(digest, digestObj.meta)
            return
          }
        }
      })
    }) 

    return Array.from(map, ([digest, meta]) => {
      return Object.assign({digest}, meta)
    })
  }
}

const createRepo = (paths, driveModel) => new Repo(paths, driveModel)

const testing = {
}

export { createRepo, testing }

