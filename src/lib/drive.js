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

const createDrive = (uuid, owner, writelist, readlist, fixedOwner) => {

  // 
  return new Drive(uuid, owner, writelist, readlist, fixedOwner)
}  

/**
  memcache state: 

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

  constructor(uuid, owner, writelist, readlist, fixedOwner) {

    let proto = { 
      owner: fixedOwner ? owner : [],
      writelist: undefined,
      readlist: undefined
    }

    super(proto)

    this.uuid = uuid
    this.owner = owner
    this.writelist = writelist
    this.readlist = readlist
    this.fixedOwner = fixedOwner

    this.cacheState = 'NONE'

    this.rootpath = null
  }

  setRootpath(rootpath) {
    this.rootpath = rootpath
  }

  async buildMemTreeAsync() {

    this.cacheState = 'CREATING'
  
    // create root node
    this.createNode(null, {
      uuid: this.uuid,
      type: 'folder',
      writelist: this.writelist,
      readlist: this.readlist
    })

    let drive = this

    return new Promise(resolve => {
      visit(this.rootpath, this.root, driveVisitor, () => {
        drive.cacheState = 'CREATED'
        drive.emit('driveCached', drive)
        resolve()
      })
    })
  }

  startBuildCache() {

    console.log('startBuildCache <<<<')

    this.cacheState = 'CREATING'
    this.createNode(null, {
      uuid: this.uuid,
      type: 'folder',
      owner: this.owner,
      writelist: this.writelist,
      readlist: this.readlist,
      name: '' // FIXME
    })

    let drive = this
    visit(this.rootpath, this.root, driveVisitor, () => {
      console.log('endBuildCache >>>>')
      drive.cacheState = 'CREATED'
      drive.emit('driveCached', drive)
    })
  }

  removeMemTree() {
  } 

  unsetRootpath() {
    this.rootpath = null
  }

  abspath(node) {
    let nodepath = node.nodepath().map(n => n.name)
    let prepend = path.resolve(this.rootpath, '..')
    nodepath.unshift(prepend)
    return path.join(...nodepath)
  }

  scan(callback) {
    visit(this.rootpath, this.root, driveVisitor, () => callback())    
  }

  importFile(srcpath, targetNode, filename, callback) {

    let targetpath = path.join(this.abspath(targetNode), filename) 
    fs.rename(srcpath, targetpath, err => {
      if (err) return callback(err)
      readXstat2(targetpath, { owner: targetNode.tree.root.owner }, (err, xstat) => {
        if (err) return callback(err) // FIXME should fake xstat
        let obj = mapXstatToObject(xstat)
        let node = targetNode.tree.createNode(targetNode, obj)
        callback(null, node) 
      })
    })
  }

  createFolder(targetNode, folderName, callback) {
    
    let nodepath = targetNode.nodepath().map(n => n.name)
    let prepend = path.resolve(targetNode.tree.rootpath, '..')
    nodepath.unshift(prepend)
    nodepath.push(folderName)
    let targetpath = path.join(...nodepath)

    fs.mkdir(targetpath, err => {
      if (err) return callback(err)
      readXstat2(targetpath, { owner: targetNode.tree.root.owner }, (err, xstat) => {
        if (err) return callback(err) // FIXME 
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
}

export { createDrive }

