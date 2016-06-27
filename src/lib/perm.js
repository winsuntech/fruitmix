
// nodeWriteList
// nodeReadList
// nodeRootOwner

// node is Node, or at least, has parent

class PermCheck {

  constructor(nwl, nrl, nro) {
    this.nodeWriteList = nwl // TODO
  }
}

const isExplicit = (node) => (nodeWriteList(node) !== null || nodeReadList(node) !== null)

const nearestExplicit = (node) => node.upFind(n => isExplicit(n))

/**
const nodeRootOwner = (node) => {
  let root = node.upFind(n => 
    (n.parent === driveRootParent || n.parent === libRootParent))
  return nodeOwner(root)  
}
**/

// node must have explicit permission
const nodeWritables = (node) => {

  let write = nodeWriteList(node)
  return write ? write : [] 
}

// node must have explicit permission
const nodeReadables = (node) => {

  let write = nodeWriteList(node)
  if (write === null) write = []

  let read = nodeReadList(node)
  if (read === null) read = []

  return [...write, ...read] // no undup
}

const nodeUserWritable = (node, user) => {

  if (user === nodeRootOwner(node)) return true

  let ancestor = nearestExplicit(node)
  let writables = nodeWritables(ancestor)

  return writables.find(w => w === user) ? true : false
}

const nodeUserReadable = (node, user) => {

  if (user === nodeRootOwner(node)) return true

  let ancestor = nearestExplicit(node)
  let readables = nodeReaables(ancestor)

  return readables.find(r => r === user) ? true : false
}

