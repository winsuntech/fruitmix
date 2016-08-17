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
    // if (!xstat.isDirectory() && !xstat.isFile()) return callback()

    let object = mapXstatToObject(xstat)
    let entryNode = node.tree.createNode(node, object) 
    if (!xstat.isDirectory()) return callback()  
    callback(entryNode)
  })
}

// a drive tree is a in-memory caching and indexing layer for given virtual drive.
class DriveTree extends ProtoMapTree {

  constructor(rootObj, rootpath) {

    let proto = { 
      // for drive with single owner this should be the owner
      // for drive with multiple owner, owner can be [] or undefined
      owner: rootObj.owner.length === 1 ? rootObj.owner : [],
      writelist: undefined,
      readlist: undefined
    }

    super(proto, rootObj)
    this.rootpath = rootpath
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

const createDriveTree = (rootObj, rootpath) => {

  if (typeof rootObj !== 'object') throw new Error('invalid rootObj')
  if (!path.isAbsolute(rootpath)) throw new Error('rootpath must be absolute path')

  return new DriveTree(rootObj, rootpath)
}  

export { createDriveTree }

