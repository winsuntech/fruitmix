import path from 'path'

import Promise from 'bluebird'

import { fs, mkdirpAsync, rimrafAsync } from '../util/async'

import { readXstat, readXstatAsync } from './xstat'
import { createProtoMapTree } from './protoMapTree'
import { nodeUserReadable, nodeUserWritable} from './perm'

import { createDrive } from './drive'

// currying
const createFruitmixDrive = (dir) => {

  return async (conf) => {

    let drive = createDrive(conf.uuid, conf.owner, conf.writelist, conf.readlist, conf.fixedOwner)
    let drvpath = path.join(dir, conf.uuid)
    let inspect = await fs.statAsync(drvpath).reflect()
    
    if (inspect.isFulfilled() && inspect.value().isDirectory()) {
      drive.setRootpath(drvpath)  
      if (conf.indexing) 
        drive.buildMemTreeAsync().then(r=>{}).catch(e=>{}) 
    }    

    return drive
  }
}

// currying
const createOtherDrive = (whatever) => {

  return async (conf) => {
    return createDrive(conf.uuid, conf.owner, conf.writelist, conf.readlist, conf.fixedOwner)
  }
}

class Repo {

  constructor(paths, models) {

    this.paths = paths
    this.models = models

    this.confs = null
    this.drives = null

    this.initState = 'IDLE' // 'INITIALIZING', 'INITIALIZED', 'DEINITIALIZING',
  }

  async init() {

    // check state
    if (this.initState !== 'IDLE') return new Error('invalid state')

    this.initState = 'INITIALIZING'

    // retrieve models path, open config
    let modelDir = this.paths.get('models')
    let tmpDir = this.paths.get('tmp')
    let conf = await openOrCreateCollectionAsync(path.join(modelDir, 'driveConf.json'), tmpDir)
    if (!confs) {
      this.initState = 'IDLE'
      return new Error('fail to load drive configuration')
    }
    this.confs = confs

    // retrieve drive directory 
    let dir = this.paths.get('drives')

    this.drives = await Promise.all(confs.map(conf => {

      if (conf.URI === 'fruitmix')
        return createFruitmixDrive(dir)(conf)
      else
        return createOtherDrive()(conf)
    }))

    this.initState = 'INITIALIZED'
  }

  // SERVICE API: create new fruitmix drive
  // label must be string, can be empty
  // fixedOwner, true or false
  // owner, uuid array, must be exactly one if fixedOwner true
  // writelist, uuid array
  // readlist, uuid array
  // memCache, true or false
  // return uuid 
  async createFruitmixDrive({label, fixedOwner, owner, writelist, readlist, cache}) {

    let uuid = UUID.v4()          
    let dir = this.paths.get('drives')

    // create foldre in drive dir
    await mkdirpAsync(path.join(dir, uuid))

    // update data model
    await this.conf.updateAsync(conf.list, [...conf.list, drvconf])
   
    // create drive and load it 
    let drv = createFruitmixDrive(dir)(conf)
    this.drives.push(drv)

    return uuid
  }

  //////////////////////////////////////////////////////////////////////////  

  findTreeInDriveByUUID(uuid) {
    return this.drives.find(tree => tree.uuidMap.get(uuid))
  }

  findNodeInDriveByUUID(uuid) {
    for (let i = 0; i < this.drives.length; i++) {
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

    //let tree = findTreeInDriveByUUID(userUUID)
    //if (!tree) return callback    
    let node = this.findNodeInDriveByUUID(targetDirUUID)
    if (!node) return callback(new Error('uuid not found')) 

    node.tree.importFile(srcpath, node, filename, (err, node) => {
      err ? callback(err) : callback(null, node)
    })
  }

  createDriveFolder(userUUID, folderName, targetDirUUID,callback) {
    // let tree = this.findTreeInDriveByUUID(userUUID)
    // if (!tree) return callback(new Error('tree not found')) 

    let node = this.findNodeInDriveByUUID(targetDirUUID)
    if (!node) return callback(new Error('uuid not found')) 

    node.tree.createFolder(node,folderName,(err,node) => {
      err?callback(err) : callback(null,node) 
    })
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

  // deprecated
  printTree(keys) {

    let queue = []
    if (!this.tree) return console.log('no tree attached')

    this.tree.root.preVisit(node => {

      let obj = {
        parent: node.parent === null ? null : node.parent.uuid,
        parentName: node.parent === null ? null : node.parent.attribute.name,
        children: node.children.map(n => n.uuid),
        childrenName: node.children.map(n => n.attribute.name)
      }
       
      queue.push(obj)
    })
    console.log(queue)
  }
}

async function createRepoAsync(rootpath) {

  mkdirpAsync(path.join(rootpath, 'drive'))
  mkdirpAsync(path.join(rootpath, 'library'))
  return new Repo(rootpath)
}

const createRepo = (paths, models) => new Repo(paths, models)

const testing = {
}

export { createRepo, testing }

