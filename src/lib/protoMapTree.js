import path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'

import deepEqual from 'deep-equal'
import validator from 'validator'

import { readXstatAnyway, readXstat2 ,updateXattrPermissionAsync,updateXattrHashAsync} from './xstat'
import { mapXstatToObject } from './tools'
import { visit } from './visitors'

const protoNode = {

  root: function() {
    let node = this
    while (node.parent !== null) node = node.parent
    return node
  },

  setChild: function(child) {
    this.children ? this.children.push(child) : this.children = [child]
  },

  unsetChild: function(child) {
    let children = this.getChildren()
    let index = children.findIndex(c => c === child)
    if (index === -1) throw new Error('Node has no such child')
    children.splice(index, 1)
  },

  getChildren: function() {
    return this.children ? this.children : []
  },

  attach: function(parent) {
    if (this.parent) throw new Error('node is already attached')
    this.parent = parent
    parent.setChild(this)
  },

  detach: function() {

    if (this.parent === null) throw new Error('Node is already detached')
    this.parent.unsetChild(this)
    this.parent = null   
  },

  upEach(func) {
    let node = this
    while (node !== null) {
      if (node.parent === undefined) {
        console.log(node)
        console.log(node.tree)
      }
      func(node)
      node = node.parent
    }
  },

  upFind(func) {
    let node = this
    while (node !== null) {
      if (func(node)) return ndoe
      node = node.parent
    }
  },

  nodepath: function() {
    let q = []
    this.upEach(node => q.unshift(node))
    return q
  }, 

  preVisit(func) {
    func(this)
    if (this.children) 
      this.children.forEach(child => child.preVisit(func)) 
  },

  postVisit(func) {
    if (this.children)
      this.children.forEach(child => child.postVisit(func))
    func(this) 
  },

  preVisitEol(func) {
    if (func(this) && this.children)
      this.children.forEach(child => child.preVisitEol(func))  
  },

  preVisitFind(func) {
    if (func(this)) return this
    return this.children.find(child => child.preVisitFind(func))
  }
}

Object.freeze(protoNode)

class ProtoMapTree {

  constructor(proto) {
    
    this.root = null
    this.proto = Object.assign(Object.create(protoNode), proto)
    
    let tree = this

    this.proto.tree = function () {
      return tree
    }

    // ! IMPORTANT DONT DO THIS
    // Object.freeze(this.proto)

    this.uuidMap = new Map()
    this.hashMap = new Map()
  } 

  hashMapSet(node) {
    if (!node.hash) return
    if (this.hashMap.has(node.hash)) {
      this.hashMap.get(node.hash).push(node)
    }
    else {
      this.hashMap.set(node.hash, [node])
    }
  } 

  hashMapUnset(node) {

    if (!node.hash) return
    if (!this.hashMap.has(node.hash)) return
    
    let list = this.hashMap.get(node.hash)
    let index = list.findIndex(n => n === node)
    if (index !== -1) {
      list.splice(index, 1) 
    }
  }

  createNode(parent, flatObject) {
  
    let node = Object.create(this.proto)
    for (let prop in flatObject) {
      if (flatObject.hasOwnProperty(prop) && 
          !deepEqual(flatObject[prop], this.proto[prop])) {

        node[prop] = flatObject[prop]
      }
    }

    if (parent === null) {
      node.parent = null // TODO: should have a test case for this !!! this may crash forEach
      this.root = node
    }
    else {
      node.attach(parent)
    }

    this.uuidMap.set(node.uuid, node)
    this.hashMapSet(node)

    if (this.uuidMap.size % 5000 === 0) {
      console.log(this.uuidMap.size)
      console.log(process.memoryUsage().rss)
    }
    return node
  }

  createNodeByUUID(parentUUID, content) {

    let parent = this.uuidMap.get(parentUUID)
    if (!parent) return null
    return parentthis.createNode(parent, content)
  }

  deleteNode(node) {
    console.log(node.__proto__)
    node.detach()
    node.postVisit(n => {
      this.uuidMap.delete(n.uuid)
      this.hashMapUnset(n)
    })
    return node
  }

  deleteNodeByUUID(uuid) {
    let node = this.uuidMap.get(uuid)
    if (!node) return null
    return this.deleteNode(node)
  }
}

// create proto tree for either drive or library
// for drive, folder name is considered to be drive uuid
// for library, folder name is considered to be library uuid

function createProtoMapTreeV1(rootpath, type, callback) {

  if (!(typeof rootpath === 'string')) return callback(new Error('rootpath must be a string'))
  if (!rootpath.startsWith('/')) return callback(new Error('rootpath must be absolute path'))
  if (rootpath === '/') return callback(new Error('/ can\'t be rootpath'))
  if (type !== 'drive' && type !== 'library') return callback(new Error('type must be drive or library'))

  let split = rootpath.split('/')
  let dirname = split.pop()
  if (!dirname.length) dirname = split.pop() // cope with trailing slash

  if (!validator.isUUID(dirname)) return callback(new Error('folder name must be valid uuid'))

  readXstatAnyway(rootpath, (err, xstat) => {

    if (err) return callback(err)
    if (!xstat.isDirectory()) 
      return callback(new Error('rootpath must be a directory')) 

    if (!xstat.uuid)
      return callback(new Error('drive root must have a uuid'))

    if (!xstat.owner || xstat.owner.length === 0) 
      return callback(new Error('drive root must have owner')) 

    let proto = {}
    proto.owner = xstat.owner

    switch (type) {
    case 'drive':
      proto.writelist = null
      proto.readlist = null
      if (xstat.writelist === null) xstat.writelist = []
      if (xstat.readlist === null) xstat.readlist = []
      break

    case 'library':
      proto.writelist = []
      proto.readlist = xstat.readlist
      xstat.writelist = proto.writelist
      xstat.readlist = proto.readlist
      break
    default:
      throw new Error('type must be drive or library')
    }

    let tree = new ProtoMapTree(proto)
    let rootObj = mapXstatToObject(xstat)
    let root = tree.createNode(null, rootObj)

    tree.uuid = dirname
    tree.type = type
    tree.rootpath = rootpath
    
    switch (type) {
    case 'drive':
      Object.assign(tree, driveTreeMethods)
      break
    case 'library':
      Object.assign(tree, libraryTreeMethods)
      break
    default:
      throw new Error('type must be drive or library')
    }
    
    // proto is different from protoObj passed into tree constructor
    tree.proto.tree = tree
    callback(null, tree)
  })
}

const createProtoMapTree = createProtoMapTreeV1

const driveVisitor = (dir, node, entry, callback) => {

  let entrypath = path.join(dir, entry)
  readXstat2(entrypath, {
    owner: node.tree.root.owner
  }, (err, xstat) => {

    if (err) return callback()
    if (!xstat.isDirectory() && !xstat.isFile()) return callback()

    let object = mapXstatToObject(xstat)
    let entryNode = node.tree.createNode(node, object) 
    if (!xstat.isDirectory()) return callback()  
    callback(entryNode)
  })
}

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

const driveTreeMethods = {

  abspath: function(node) {

    let nodepath = node.nodepath().map(n => n.name)
    let prepend = path.resolve(this.rootpath, '..')
    nodepath.unshift(prepend)
    return path.join(...nodepath)
  },

  scan: function(callback) {
    visit(this.rootpath, this.root, driveVisitor, () => callback())    
  },

  importFile: function(srcpath, targetNode, filename, callback) {

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

  createFolder: function(targetNode, folderName, callback) {
    
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

  renameFileOrFolder: function(node, newName, callback) {
    fs.rename(this.abspath(node),this.abspath(node.parent)+"/"+newName,(err)=>{
      if (err) return callback(err)
      node.name=newName
      callback(null,node)
    })
  },

  deleteFileOrFolder: function(targetnode,callback){ 
    rimraf(this.abspath(targetnode),err=>{
      if (err) return callback(err)
      let ntree =this.deleteNode(targetnode)
      callback(null,ntree)
    })
  },

  updateDriveFile: function(node,fruitmix,callback){
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

const libraryTreeMethods = {
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
    fs.rename(this.abspath(node),this.abspath(node.parent)+"/"+newName,(err)=>{
      if (err) return callback(err)
      node.name=newName
      callback(null,node)
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

    fs.rename(this.abspath(node),this.abspath(node.parent)+"/"+newName,(err)=>{
      if (err) return callback(err)
      node.name=newName
      callback(null,node)
    })
  },
}

export { protoNode, ProtoMapTree, createProtoMapTree } 

