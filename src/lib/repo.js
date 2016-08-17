import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'

import { openDriveConfsAsync } from '../models/driveConfs'

import { readXstat } from './xstat'
import { mkdirpAsync, fsStatAsync, fsMkdirAsync, mapXstatToObject } from './tools'
import { createProtoMapTree } from './protoMapTree'
import {nodeUserReadable,nodeUserWritable} from './perm'

import { createDrive, createDriveAsync } from './drive'

Promise.promisifyAll(fs)

const readXstatAsync = Promise.promisify(readXstat)

// return an array of xstat that is valid drive root xstat
const scanSystemDrivesAsync = async (drivePath) => 
  fs.readdirAsync(drivePath)
    .map(entry => readXstatAsync(path.join(drivePath, entry), null))
    .filter(xstat => xstat !== null &&
      xstat.isDirectory() && 
      xstat.owner.length > 0 &&
      xstat.writelist &&
      xstat.readlist)

/**

  runtime status of a drive

  1. 'unsupported', 'offline', 'online'
  2. for online drive, index status: 'none', 'indexing', 'indexed'

**/
const buildDriveList = (definitions, xstats) => 

  definitions.map(def => {

    // only fruitmix URI protocol is processed, for now
    if (def.URI === 'fruitmix') { 
      let xstat = xstats.find(x => x.uuid === def.uuid)
      if (xstat) {
        return {
          uuid: def.uuid,
          status: 'online',
          indexStatus: 'none'
        }
      }
      else {
        return {
          uuid: def.uuid,
          status: 'offline',
          indexStatus: 'none'
        }
      }
    }
    else {
      return {
        uuid: def.uuid,
        status: 'unsupported',
        indexStatus: 'none'
      }
    }
  })

class Drive {

  construct(definition, xstat) {
    this.definition = definition
    this.xstat = xstat  
  }
}

class Repo {

  constructor(paths, models) {

    this.paths = paths
    this.models = models

    this.definitions = null
    this.trees = null
    this.drives = null

    this.initState = 'IDLE' // 'INITIALIZING', 'INITIALIZED', 'DEINITIALIZING',
  }

  // load drive definitions, scan system drive folder, build
  async init() {

    if (this.initState !== 'IDLE') 
      return new Error('invalid state')

    this.initState = 'INITIALIZING'

    let modelPath = this.paths.get('models')
    let defs = openDriveConfsAsync(path.join(modelPath, 'driveConfs.json'))
    if (!defs) {
      this.initState = 'IDLE'
      return new Error('fail to load definitions')
    }

    let drivePath = this.paths.get('models')
    let xstats = await scanSystemDrivesAsync(drivePath)
    this.drives = buildDriveList(defs, xstats)

    let scanning = this.drives.filter(drv => drv.status === 'online' && drv.definition.index === 'auto')
     
    this.initState = 'INITIALIZED'
  }

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
  
  async scanDrivesAsync() {
    await fs.readdirAsync(dpath).map(entry => createDriveAsync(path.join(dpath, entry)))
  }

  scanDrives(callback) {
    fs.readdir(this.driveDirPath(), (err, entries) => {
      if (err) callback(err)
      if (entries.length === 0) return callback(null)      
      let count = entries.length
      entries.forEach(entry => {
        createProtoMapTree(path.join(this.driveDirPath(), entry), 'drive', (err, tree) => {
          if (!err) this.drives.push(tree)
          if (!--count) callback()
        })
      })      
    }) 
  } 

  createDrive(userUUID, callback) {
  
    let dirpath = path.join(this.driveDirPath(), userUUID)
    fs.mkdir(dirpath, err => {

      if (err) return callback(err)
      let perm = {
        owner: [userUUID],
        writelist: [],
        readlist: []
      }

      readXstat2(dirpath, perm, (err, xstat) => {
        if (err) return callback(err)

        createProtoMapTree(dirpath, 'drive', (err, tree) => {
          if (err) return callback(err)
          this.drives.push(tree)
          callback(null, tree)    
        }) 
      })
    })
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
  scanSystemDrivesAsync
}

export { createRepo, testing }

