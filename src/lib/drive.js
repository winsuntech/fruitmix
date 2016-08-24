import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'
import rimraf from 'rimraf'

import { readXstat } from './xstat'
import { ProtoMapTree } from './protoMapTree'
import { mapXstatToObject } from './tools'
import { visit } from './visitors'

const driveVisitor = (dir, node, entry, callback) => {

  let entrypath = path.join(dir, entry)
  readXstat(entrypath, (err, xstat) => {
    if (err) return callback()
    let object = mapXstatToObject(xstat)
    let entryNode = node.tree.createNode(node, object) 
    if (!xstat.isDirectory()) return callback()  
    callback(entryNode)
  })
}

const createDrive = (conf) => {

  return new Drive(conf)
}  

/**
  cache state: 

            ---------auto---------------------------------- (REMOVING)
            |                                                  ^
            |                                                  |
            |                                               [remove]
            |                                                  |
            v                                                  |
  o-----> (NONE) ----[create]---> (CREATING) -----auto----> (CREATED)
            ^                        |
            |                        |
            |                     [abort]
            |                        |
            |                        v
            ----auto------------- (ABORTING)


**/
// a drive tree is a in-memory caching and indexing layer for given virtual drive.
class Drive extends ProtoMapTree {

  constructor(conf) {

    let proto = { 
      owner: conf.fixedOwner ? conf.owner : [],
      writelist: undefined,
      readlist: undefined
    }

    super(proto)

    // this may not be a good idea to put all configuration information
    // in this object TODO
    this.label = conf.label
    this.fixedOwner = conf.fixedOwner
    this.URI = conf.URI
    this.uuid = conf.uuid
    this.owner = conf.owner
    this.writelist = conf.writelist
    this.readlist = conf.readlist
    this.cache = conf.cache

    this.cacheState = 'NONE'
    this.rootpath = null
  }

  setRootpath(rootpath) {

    if (this.cacheState !== 'NONE') throw new Error('rootpath can only be set when cacheState is NONE')

    this.rootpath = rootpath
    if (this.cache) this.buildCache() 
  }

  buildCache() {

    if (this.cacheState !== 'NONE') throw new Error('buildCache can only be called when cacheState is NONE')

    this.cacheState = 'CREATING'
    this.createNode(null, {
      uuid: this.uuid,
      type: 'folder',
      owner: this.owner,
      writelist: this.writelist,
      readlist: this.readlist,
      name: path.basename(this.rootpath)
    })

    let drive = this
    visit(this.rootpath, this.root, driveVisitor, () => {
      drive.cacheState = 'CREATED'
      drive.emit('driveCached', drive)
    })
  }

  // get absolute path of node
  abspath(node) {

    if (!this.rootpath) throw new Error('rootpath not set')

    let nodepath = node.nodepath().map(n => n.name)
    let prepend = path.resolve(this.rootpath, '..')
    nodepath.unshift(prepend)
    return path.join(...nodepath)
  }

  // this function tried to create a new folder
  createFolder(userUUID, targetNode, name, callback) {

    if (targetNode.getChildren().find(c => c.name === name))
      return callback(new Error('folder exists'))

    let targetpath = path.join(this.abspath(targetNode), name)

    fs.mkdir(targetpath, err => {
      if (err) return callback(err)
      readXstat(targetpath, { owner: [userUUID] }, (err, xstat) => {
        if (err) return callback(err)
        let obj = mapXstatToObject(xstat)
        let node = targetNode.tree.createNode(targetNode, obj)
        callback(null, node)
      })
    })
  }

  _importFile(userUUID, srcpath, targetNode, filename) {
    
  }

  // this function may OVERWRITE existing file
  importFile(userUUID, srcpath, targetNode, filename, callback) {

    let targetpath = path.join(this.abspath(targetNode), filename) 
    let existing = targetNode.getChildren().find(c => c.name === filename)
    if (existing) {
      // !!! reverse order
      return copyXattr(srcpath, targetpath, err => {
        if (err) return callback(err)
        fs.rename(srcpath, targetpath, err => {
          if (err) return callback(err)
          readXstat(targetpath, (err, xstat) => {
            if (err) return callback(err)
            let obj = mapXstatToObject(xstat)
            let tree = existing.tree
            tree.updateNode(existing, obj)
            callback(null, existing)
          })
        })
      })
    }

    fs.rename(srcpath, targetpath, err => {
      if (err) return callback(err)
      readXstat(targetpath, { owner: [userUUID] }, (err, xstat) => {
        if (err) return callback(err)
        let obj = mapXstatToObject(xstat)
        let node = targetNode.tree.createNode(targetNode, obj)
        callback(null, node) 
      })
    })
  }


  renameFileOrFolder(node, newName, callback) {
    fs.rename(this.abspath(node),this.abspath(node.parent)+'/'+newName,(err)=>{
      if (err) return callback(err)
      node.name=newName
      callback(null,node)
    })
  }

  deleteFileOrFolder(targetnode, callback){ 
    rimraf(this.abspath(targetnode),err=>{
      if (err) return callback(err)
      let ntree =this.deleteNode(targetnode)
      callback(null,ntree)
    })
  }

  updateDriveFile(node,fruitmix,callback) {
    node.writelist=fruitmix.writelist
    node.readlist = fruitmix.readlist
    node.owner = fruitmix.owner
    node.hash = fruitmix.hash
    node.uuid = fruitmix.uuid
    node.htime = fruitmix.htime
    updateXattrPermissionAsync(this.abspath(node),fruitmix)
    updateXattrHashAsync(this.abspath(node),fruitmix.hash,fruitmix.htime)
    callback(null, node)
  }

  print(uuid) {

    if (!uuid) uuid = this.root.uuid
    
    let node = this.uuidMap.get(uuid)
    if (!node) {
      console.log(`no node found to have uuid: ${uuid}`)
      return
    }

    let queue = []
    node.preVisit(n => {
      let obj = {
        parent: n.parent === null ? null : n.parent.uuid,
        uuid: n.uuid,
        type: n.type,
        owner: n.owner,
        writelist: n.writelist,
        readlist: n.readlist,
        name: n.name
      }
      queue.push(obj)
    })

    return queue
  }
}

export { createDrive }

