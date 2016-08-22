import EventEmitter from 'events'
import deepEqual from 'deep-equal'

const nodeProperties = {

  root() {
    let node = this
    while (node.parent !== null) node = node.parent
    return node
  },

  setChild(child) {
    this.children ? this.children.push(child) : this.children = [child]
  },

  unsetChild(child) {
    let children = this.getChildren()
    let index = children.findIndex(c => c === child)
    if (index === -1) throw new Error('Node has no such child')
    children.splice(index, 1)
  },

  getChildren() {
    return this.children ? this.children : []
  },

  attach(parent) {
    if (this.parent) throw new Error('node is already attached')
    this.parent = parent
    parent.setChild(this)
  },

  detach() {
    if (this.parent === null) throw new Error('Node is already detached')
    this.parent.unsetChild(this)
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
      if (func(node)) return node
      node = node.parent
    }
  },

  nodepath() {
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
    if(this.children==undefined) return undefined
    return this.children.find(child => child.preVisitFind(func))
  }
}

Object.freeze(nodeProperties)

class ProtoMapTree extends EventEmitter {

  // proto can be any plain JavaScript object
  // root should have at least the uuid for this general data structure
  // for fruitmix specific usage, root should have owner, writelist and readlist
  constructor(proto) {

    super()    
    this.proto = Object.assign(proto, nodeProperties)
    this.proto.tree = this
    this.uuidMap = new Map()
    this.hashMap = new Map()
    this.root = null
  } 

  uuid() {
    return this.root.uuid
  }

  hashMapSet(node) {
    if (!node.hash || node.type !== 'file') return
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

    if (!flatObject.uuid) throw new Error('node object must have uuid property')
    if (!flatObject.type) throw new Error('node object must have type property')
    if (flatObject.type !== 'file' && flatObject.type !== 'folder') 
      throw new Error('node object type must be either file or folder')

    if (parent === null && flatObject.type !== 'folder')
      throw new Error('root object type must be folder')
  
    let node = Object.create(this.proto)
    for (let prop in flatObject) {
      if (flatObject.hasOwnProperty(prop) && 
          !deepEqual(flatObject[prop], this.proto[prop])) {

        node[prop] = flatObject[prop]
      }
    }

    if (parent === null) {
      if (this.root) throw new Error('root already set')
      node.parent = null // TODO: should have a test case for this !!! this may crash forEach
      this.root = node
    }
    else {
      node.attach(parent)
    }

    this.uuidMap.set(node.uuid, node)
    this.hashMapSet(node)
    this.emit('nodeCreated', node)
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

export { nodeProperties, ProtoMapTree } 

