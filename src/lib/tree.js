
// create a dangling new node for given object
function _newNode(object) {
  return Object.assign({}, object, {
    parent: null,
    children: []
  })
}

function _root(node) { 
  while(node.parent !== null) node = node.parent
  return node
}

function _attachNode(parent, child) {
  child.parent = parent
  if (!parent.children.find(c => c === child))
    parent.children.push(child)

  return child
}

function _detachNode(node) {

  if (node.parent === null) return node 

  let parent = node.parent
  let index = parent.children.find(c => c === node)
  if (index !== -1) {
    parent.children.splice(index, 1)
  }
  node.parent = null
  return node
}

class Tree {

  constructor(object) {
    this.root = _newNode(object)
    this.uuidMap = new Map()
    this.hashMap = new Map()

    this.uuidMap.set(this.root.uuid, this.root)
    this.hashMapSet(this.root)
  }

  // this is actually two ops, _newNode and _attachTreeNode
  _newTreeNode(parent, object) {
    return this._attachTreeNode(parent, _newNode(object))
  }

  // attach a subtree, with parent validation
  _attachTreeNode(parent, node) { 

    if (node.parent) return null // fail
    if (_root(parent) !== this.root) return null
    return _attachNode(parent, node)    
  }

  // detach a subtree, with arg check
  _detachTreeNode(node) {

    if (node === this.root) return null // detach root is forbidden
    if (_root(node) !== this.root) return null
    return _detachNode(node)
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

  // pre visitor
  _visit_pre(node, func) {
    func(node)
    node.children.forEach(child => this._visit_pre(child, func)) 
  }

  // post visitor
  _visit_post(node, func) {
    node.children.forEach(child => this._visit_post(child, func))
    func(node)
  }

  // new node, with map set
  createNode(parent, content) {
   
    console.log('>>>>')
    console.log(parent) 
    console.log('<<<<')
    let node = this._newTreeNode(parent, content)
    if (node) {
      this.uuidMap.set(node.uuid, node)
      this.hashMapSet(node)      
    }  
    return node
  }

  // new node by uuid, with map set
  createNodeByUUID(parentUUID, content) {

    let parent = this.uuidMap.get(parentUUID)
    if (parent) {
      return this.createNode(parent, content) 
    }
    return null
  } 

  // detach subtree, clean maps
  deleteNode(node) {
 
    node = _detachTreeNode(node)
    if (node) {
      this._visit_post(node, _node => {
        this.uuidMap.delete(_node.uuid)
        this.hashMapUnset(_node)
      })
    }
  }

  deleteNodeByUUID(uuid) {

    let node = this.uuidMap.get(uuid)
    if (node) {
      this.deleteNode(node)
    }
  }

  // this op does not influence maps
  moveTreeNode(node, newParent) {

    if (node === this.root) return null // forbidden
    if (_root(node) !== this.root) return null 
    if (_root(parent) !== this.root) return null
    node.parent = newParent
  }


}

module.exports = Tree
