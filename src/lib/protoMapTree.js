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
    let children = this.children
    if (children === undefined) throw new Error('Node has no children')
    let index = children.findIndex(c => c === child)
    if (index === -1) throw new Error('Node has no such child')
    children.splice(index, 1)
    if (children.length === 0) delete this.children 
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

const magicToMeta = (magic) => {

  let meta = {}
  if (magic.startsWith('JPEG image data')) {
    meta.type = 'JPEG'

    // remove exif bracket and split
    let items = magic.replace(/\[.*\]/g, '').split(',').map(item => item.trim())

    // find width x height
    let x = items.find(item => /\d+x\d+/.test(item))
    if (!x) return null
  
    let y = x.split('x')
    meta.width = parseInt(y[0])
    meta.height = parseInt(y[1])

    if (items.find(item => item === 'Exif Standard:')) {
      meta.extended = true
    }
    else {
      meta.extended = false
    }

    return meta // type = JPEG, width, height, extended
  }
  return null
}

// to prevent unexpected modification
Object.freeze(nodeProperties)

class ProtoMapTree extends EventEmitter {

  // proto can be any plain JavaScript object
  // root should have at least the uuid for this general data structure
  // for fruitmix specific usage, root should have owner, writelist and readlist
  constructor(proto) {

    super()    

    this.proto = Object.assign(proto, nodeProperties)
    this.proto.tree = this

    // for accessing node by UUID
    this.uuidMap = new Map()
    // file only, examine magic and conditionally put node into map
    this.hashMap = new Map()
    // file only, for file without hashmagic
    this.hashless = new Set()
    // folder only, for folder with writer/reader other than drive owner
    this.shares = new Set()

    this.root = null
  } 

  uuid() {
    return this.root.uuid
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

    // set uuid indexing
    this.uuidMap.set(node.uuid, node)

    // set digest indexing
    if (node.type === 'file') {
      if (node.magic) {
        let digestObj = this.hashMap.get(node.hash)
        if (digestObj) {
          // if digest obj exists, add node to list
          digestObj.nodes.push(node)
        }
        else {
          // extract meta from magic
          let meta = magicToMeta(node.magic)
          if (meta) {
            // if meta, create new digest obj  
            digestObj = {
              meta: meta,
              nodes: [node]
            }  
            this.hashMap.set(node.hash, digestObj)
          }
          else {
            // no meta, then remove hash and magic, they are not interested anymore
            delete node.hash
            delete node.magic
          }
        }
      }
      else { // hashless
        this.hashless.add(this.node)
      }
    }
    else if (node.type === 'folder') {
      // TODO logic for share
    }
    else {
      // do nothing or throw an error if you wish
    }

    // this.hashMapSet(node)
    return node
  }

  createNodeByUUID(parentUUID, content) {

    let parent = this.uuidMap.get(parentUUID)
    if (!parent) return null
    return this.createProtoNode(parent, content)
  }

  // there are several reasons to change a node
  // 1. structural change, that is, change parent, equivalent to move
  // 2. permission change, writelist, readlist, owner (which is not used probably)
  // 3. file metadata change (name)
  // 4. file data change (mtime, size possibly)
  updateNode(node, props) {
    // this method should be split into several ones. 
  }

  // this function delete one leaf node
  // for delete a sub tree, using higher level method
  deleteNode(node) {
    if (node.children) throw new Error('node has children, cannot be deleted')
    node.detach()
    return node
  }

  deleteNodeByUUID(uuid) {
    let node = this.uuidMap.get(uuid)
    if (!node) return null
    return this.deleteNode(node)
  }
}

export { nodeProperties, ProtoMapTree } 

