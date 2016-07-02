let debug = true

import os from 'os'

class Node {

/**
  constructor(object) {
    this.parent = null
    this.children = []
    this.data = object
  }
**/

  constructor(object) {
    Object.assign(object, {
      parent: null,
      children: []
    })
  }

  root() {
    let node = this
    while (node.parent !== null) {
      node = node.parent
    }
    return node
  }

  attach(parent) {

    // TODO this is dangerous for production use
    if (this.parent) {
      if (debug) throw new Error('Node is already attached')
      return
    }

    this.parent = parent
    parent.children.push(this)
  }

  detach() {

    if (node.parent === null) {
      if (debug) throw new Error('Node is already detached')
      return
    }
    
    let index = parent.children.findIndex(c => c === this)
    if (index === -1) {
      if (debug) throw new Error(`Node not found in parent's children`)
      return
    }     

    parent.children.splice(index, 1)
    this.parent = null
  } 

  // iterator
  upEach(func) {
    let node = this
    while (node !== null) {
      func(node)
      node = node.parent
    }
  }

  // iterator, func return truthy or falsy value
  upFind(func) {
    let node = this
    while (node !== null) {
      if (func(node)) return node
      node = node.parent
    }
    return undefined
  } 

  nodepath() {
    let q = []
    this.upEach(node => q.unshift(node))
    return q
  }

  preVisit(func) {
    func(this)
    this.children.forEach(child => child.preVisit(func)) 
  }

  postVisit(func) {
    this.children.forEach(child => child.postVisit(func))
    func(this)
  }

  // also pre visitor, func return truthy for enter and falsy for leave
  preVisitEol(func) {
    if (func(this)) {
      this.children.forEach(child => child.preVisitEol(func))
    }
  } 
}



class MapTree {

  // assumes object has uuid field
  constructor(object) {

    this.root = new Node(object)
    this.uuidMap = new Map()
    this.hashMap = new Map()

    this.uuidMap.set(this.root.uuid, this.root)
    this.hashMapSet(this.root)
  }

  // hash map set
  hashMapSet(node) {

    if (!node.hash) return
    if (this.hashMap.has(node.hash)) {
      this.hashMap.get(node.hash).push(node)
    }
    else {
      this.hashMap.set(node.hash, [node])
    }
  }

  // hash map unset
  hashMapUnset(node) {

    if (!node.hash) return
    if (!this.hashMap.has(node.hash)) return

    let list = this.hashMap.get(node.hash)
    let index = list.findIndex(n => n === node)
    if (index !== -1) {
      list.splice(index, 1)
    }
  }

  // no parent check, caller making sure parent exist
  createNode(parent, object) { 
    let node = new Node(object)
    node.attach(parent)
    this.uuidMap.set(node.uuid, node)
    this.hashMapSet(node)      

    if (this.uuidMap.size % 10000 === 0) {
      console.log(os.freemem())
      console.log(this.uuidMap.size)
    }
    return node
  }

  // new node by uuid, with map set
  createNodeByUUID(parentUUID, content) {
    let parent = this.uuidMap.get(parentUUID)
    return parent ? this.createNode(parent, content) : null
  } 

  // detach subtree, clean maps
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
    return node ? this.deleteNode(node) : null
  }

  // this op does not influence maps
  moveNode(node, parent) {
    node.detach()
    node.attach(parent)
  }

  moveNodeByUUID(nodeUUID, parentUUID) {
    let node = this.uuidMap.get(nodeUUID)
    let parent = this.uuidMap.get(parentUUID)
    if (node && parent) this.move(node, parent)
  }
}

class ProtoMapTree {

  constructor(proto) {

    this.root = null
    this.uuidMap = new Map()
    this.hashMap = new Map()

    console.log(proto)
    console.log(typeof proto)

    this.proto = proto  
    this.proto.tree = () => this
    Object.freeze(this.proto)
  }

  // hash map set
  hashMapSet(node) {

    if (!node.hash) return
    if (this.hashMap.has(node.hash)) {
      this.hashMap.get(node.hash).push(node)
    }
    else {
      this.hashMap.set(node.hash, [node])
    }
  }

  // hash map unset
  hashMapUnset(node) {

    if (!node.hash) return
    if (!this.hashMap.has(node.hash)) return

    let list = this.hashMap.get(node.hash)
    let index = list.findIndex(n => n === node)
    if (index !== -1) {
      list.splice(index, 1)
    }
  }

  // no parent check, caller making sure parent exist
  createNode(parent, object) {

    let overlay = Object.create(this.proto)
    for (let property in object) {
      if (object.hasOwnProperty(property) && object[property] !== this.proto[property])
        overlay[property] = object[property]
    }

    let node = new this.proto(overlay)

    console.log('>>>')
    console.log(node instanceof this.proto)
    console.log('<<<')

    if (parent === null) {
      this.root = node
    }
    else { 
      node.attach(parent) 
    }

    this.uuidMap.set(node.uuid, node)
    this.hashMapSet(node)      

    return node
  }

  // new node by uuid, with map set
  createNodeByUUID(parentUUID, content) {
    let parent = this.uuidMap.get(parentUUID)
    return parent ? this.createNode(parent, content) : null
  } 

  // detach subtree, clean maps
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
    return node ? this.deleteNode(node) : null
  }

  // this op does not influence maps
  moveNode(node, parent) {
    node.detach()
    node.attach(parent)
  }

  moveNodeByUUID(nodeUUID, parentUUID) {
    let node = this.uuidMap.get(nodeUUID)
    let parent = this.uuidMap.get(parentUUID)
    if (node && parent) this.move(node, parent)
  }
}

export { Node, MapTree, ProtoMapTree }

