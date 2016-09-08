import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'
import rimraf from 'rimraf'

import { readXstat } from './xstat'
import { IndexedTree } from './indexedTree'
import { mapXstatToObject } from './util'
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

/****

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


****/

// a drive tree is a in-memory caching and indexing layer for given virtual drive.
class Drive extends IndexedTree {

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

  // v createFolder   targetNode (parent), new name
  // x createFile     targetNode (parent), new name, file, optional digest?
  //   renameFolder   targetNode, new name (not conflicting) 
  //   renameFile     targetNode, new name (not conflicting)
  //   deleteFolder   targetNode, 
  //   deleteFile     targetNode,
  //   listFolder     get node is enough, no operation
  //   readFile       get a path is enough, no operation
  // x overwriteFile  overwrite but preserve uuid
  //   chmod


  // this function tried to create a new folder
  // perm: user must have write permission on targetNode
  createFolder(userUUID, targetNode, name, callback) {

    // if not directory, EINVAL
    if (!targetNode.isDirectory()) {
      let error = new Error('createFolder: target should be a folder')
      error.code = 'EINVAL' 
      return process.nextTick(callback, error)
    }

    // if not writable, EPERM
    if (!targetNode.userWritable(userUUID)) {
      let error = new Error('createFolder: operation not permitted')
      error.code = 'EPERM'
      return process.nextTick(callback, error)
    }

    // if already exists, EEXIST
    if (targetNode.getChildren().find(c => c.name === name)) {
      let error = new Error('createFolder: file or folder already exists')
      error.code = 'EEXIST'
      return process.nextTick(callback, error)
    }

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

  createFile(userUUID, srcpath, targetNode, filename, callback) {
    
    if (!targetNode.isDirectory()) {
      let error = new Error('createFile: target must be a folder')
      error.code = 'EINVAL'
      return process.nextTick(callback, error)
    }

    if (!targetNode.userWritable(userUUID)) {
      let error = new Error('createFile: operation not permitted')
      error.code = 'EPERM'
      return process.nextTick(callback, error)
    } 

    if (targetNode.getChildren().find(c => c.name === filename)) {
      let error = new Error('createFile: file or folder already exists')
      error.code = 'EEXIST'
      return process.nextTick(callback, error)
    }

    fs.rename(srcpath, targetpath, err => {
      if (err) return callback(err)
      readXstat(targetpath, { owner: [userUUID] }, (err, xstat) => {
        if (err) return callback(err)
        let obj = mapXstatToObject(xstat)
        let node = this.createNode(targetNode, obj)
        callback(null, node)
      })
    }) 
  }

  overwriteFile(userUUID, srcpath, targetNode, callback) {
     
    if (!targetNode.isFile()) {
      let error = new Error('overwriteFile: target must be a file')
      error.code = 'EINVAL'
      return process.nextTick(callback, error)
    }

    if (!targetNode.userWritable(userUUID)) {
      let error = new Error('overwriteFile: operation not permitted')
      error.code = 'EPERM'
      return process.nextTick(callback, error)
    }

    copyXattr(srcpath, targetpath, err => {
      if (err) return callback(err)
      fs.rename(srcpath, targetpath, err => {
        if (err) return callback(err)
        readXstat(targetpath, (err, xstat) => {
          if (err) return callback(err)
          let obj = mapXstatToObject(xstat)
          this.updateNode(targetNode, obj) // TODO
          callback(null, targetNode) 
        })
      })
    })
  }

  // this function is used to check if it is allowed and viable to do importFile
  // return true or false
  importFileCheck(userUUID, targetNode, filename) {
    
    return true
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

  // rename 
  renameFileOrFolder(userUUID, targetNode, newName, opts, callback) {

    if (typeof opts === 'function') {
      callback = opts
      opts = {}
    }

    if (!this.uuidMap.has(targetNode.uuid))
      return process.netTick(callback, new Error('node does not belong to this drive'))

    if (targetNode === this.root)
      return process.nextTick(callback, new Error('root node cannot be renamed'))

    if (!opts.priviledged) {
      // do permission check here TODO
    }

    let targetpath = this.abspath(targetNode)
    let parentpath = this.abspath(targetNode.parent)
    let newpath = path.join(parentpath, newName)

    // rename file first
    fs.rename(targetpath, newpath, err => {
      if (err) return callback(err)
      this.updateName(targetNode)
      callback(null,targetNode)
    })
  }

  deleteFileOrFolder(targetnode, callback){ 
    rimraf(this.abspath(targetnode),err=>{
      if (err) return callback(err)
      let ntree =this.deleteNode(targetnode)
      callback(null,ntree)
    })
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

  // indexedTree already has a function named 'updateHashMagic'
  fileUpdateHashMagic(uuid, hash, magic) {
    
  }
}

export { createDrive }

