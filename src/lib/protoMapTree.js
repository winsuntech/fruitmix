
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
      if (flatObject.hasOwnProperty(prop) && flatObject[prop] !== this.proto[prop]) { // FIXME 
        node[prop] = flatObject[prop]
      }
    }

    if (parent === null) {
      // this.root = Object.assign(Object.create(this.proto), flatObject)
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

export { protoNode, ProtoMapTree } 

