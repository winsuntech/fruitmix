import rimraf from 'rimraf'

import ProtoMapTree from './protoMapTree'
import { mapXstatToObject } from './tools'

class DriveTree extends ProtoMapTree {

  constructor(xstat) {

    super({owner: xstat.owner, writelist: null, readlist: null})
    
    let rootObj = mapXstatToObject(xstat)
    this.createNode(null, rootObj)     
    this.rootpath = xstat.abspath
  }

  abspath(node) {
    let nodepath = node.nodepath().map(n => n.name)
    let prepend = path.resolve(this.rootpath, '..')
    nodepath.unshift(prepend)
    return path.join(...nodepath)
  },

  scan(callback) {
    visit(this.rootpath, this.root, driveVisitor, () => callback())    
  },

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
  },

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
  },

  renameFileOrFolder(node, newName, callback) {
    fs.rename(this.abspath(node),this.abspath(node.parent)+'/'+newName,(err)=>{
      if (err) return callback(err)
      node.name=newName
      callback(null,node)
    })
  },

  deleteFileOrFolder(targetnode, callback){ 
    rimraf(this.abspath(targetnode),err=>{
      if (err) return callback(err)
      let ntree =this.deleteNode(targetnode)
      callback(null,ntree)
    })
  },

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


