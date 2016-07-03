import path from 'path'

import deepEqual from 'deep-equal'

import { readXstatAnyway, readXstat2 } from './xstat'
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
    if (node.parent === null) throw new Error('Node is already detached')
    parent.unsetChild(this)
    this.parent = null   
  },

  upEach(func) {
    let node = this
    while (node !== null) {
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

function createProtoMapTreeV1(rootpath, type, callback) {

  if (!(typeof rootpath === 'string')) return callback(new Error('rootpath must be a string'))
  if (!rootpath.startsWith('/')) return callback(new Error('rootpath must be absolute path'))
  if (rootpath === '/') return callback(new Error('/ can\'t be rootpath'))
  if (type !== 'drive' && type !== 'library') return callback(new Error('type must be drive or library'))

  let split = rootpath.split('/')
  let name = split.pop()
  if (!name.length) name = split.pop() // cope with trailing slash

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

    tree.type = type
    tree.rootpath = rootpath
    
    // proto is different from protoObj passed into tree constructor
    tree.proto.tree = tree

    callback(null, tree)
  })
}

const createProtoMapTree = createProtoMapTreeV1

const driveVisitor = (dir, dirContext, entry, callback) => {

  let entrypath = path.join(dir, entry)
  readXstat2(entrypath, {
    owner: dirContext.tree.root.owner
  }, (err, xstat) => {

    if (err) return callback()
    if (!xstat.isDirectory() && !xstat.isFile()) return callback()

    let { tree, node, owner } = dirContext
    let object = mapXstatToObject(xstat)

    // createNode do no check
    let entryNode = tree.createNode(node, object) 

    if (!xstat.isDirectory()) return callback()  

    // now it's directory
    callback({ tree, node: entryNode })
  })
}

function scanDriveTree(driveTree, callback) {

  let rootContext = {
    tree: driveTree,
    node: driveTree.root,
  }

  visit(driveTree.rootpath, rootContext, driveVisitor, () => callback())
}


export { protoNode, ProtoMapTree, createProtoMapTree, scanDriveTree } 

