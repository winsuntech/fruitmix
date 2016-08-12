import path from 'path'

import rimraf from 'rimraf'

import { readXstat } from './xstat'
import { ProtoMapTree } from './protoMapTree'
import { mapXstatToObject } from './tools'
import { visit } from './visitors'

const createLibraryProto = (xstat) => {\
  owner: xstat.owner,
  writelist: [],
  readlist: xstat.readlist
})

// never return entryContext
const libraryVisitor = (dir, node, entry, callback) => {

  let entrypath = path.join(dir, entry)
  readXstat2(entrypath, {
    owner: node.tree.root.owner
  }, (err, xstat) => {

    if (err) return callback()
    if (!xstat.isFile()) return callback()

    xstat.owner = node.tree.root.owner
    xstat.writelist = null
    xstat.readlist = null

    let object = mapXstatToObject(xstat)
    let entryNode = node.tree.createNode(node.tree.root, object) 
    return callback()
  })
}

class Library extends ProtoMapTree {

  constructor(xstat) {
    let proto = createLibraryProto(xstat)
    let root = mapXstatToObject(xstat)
    super(proto, root)
    this.rootpath = xstat.abspath
  }
  
  abspath: function(node) {

    let nodepath = node.nodepath().map(n => n.name)
    let prepend = path.resolve(this.rootpath, '..')
    nodepath.unshift(prepend)
    return path.join(...nodepath)
  },

  scan: function(callback) {
    visit(this.rootpath, this.root, libraryVisitor, () => callback())
  },

  importFile: function(srcpath,targetNode,hash,callback) {
    let targetpath = path.join(this.abspath(targetNode),hash)
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

  renameFileOrFolder: function(node, newName, callback) {
    fs.rename(this.abspath(node),this.abspath(node.parent)+'/'+newName,(err)=>{
      if (err) return callback(err)
      node.name=newName
      callback(null,node)
    })
  },

  deleteFile: function(targetnode,callback){ 
    rimraf(this.abspath(targetnode),err=>{
      if (err) return callback(err)
      let ntree =this.deleteNode(targetnode)
      callback(null,ntree)
    })
  },

  async updateLibraryFile(node,fruitmix,callback){
    node.writelist=fruitmix.writelist
    node.readlist = fruitmix.readlist
    node.owner = fruitmix.owner
    node.hash = fruitmix.hash
    node.uuid = fruitmix.uuid
    node.htime = fruitmix.htime

    updateXattrPermissionAsync(this.abspath(node),fruitmix)

    let result=await updateXattrHashAsync(this.abspath(node),fruitmix.hash,fruitmix.htime)

    if(result instanceof Error) callback(result)

    fs.rename(this.abspath(node),this.abspath(node.parent)+'/'+newName,(err)=>{
      if (err) return callback(err)
      node.name=newName
      callback(null,node)
    })
  },
}

export { createLibrary }
