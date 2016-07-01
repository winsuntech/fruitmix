import fs from 'fs'
import path from 'path'

import { readXstat } from './xstat'
import { mapXstatToObject } from './tools'
import { protoNode, ProtoMapTree } from './protoMapTree'
import { visit } from './visitors'

let driveProto = {

  type: 'drive',

  owner: ['ddd'],
  writelst: null,
  readlist: null,

  rootOwner: [],
  rootWritelist: [],
  rootReadlist: [],
}

// TODO need more logic to fix ownerless file/folder
const driveVisitor = (dir, dirContext, entry, callback) => {

  let entrypath = path.join(dir, entry)
  readXstat(entrypath, (err, xstat) => {

    if (err) return callback()
    if (!xstat.isDirectory() && !xstat.isFile()) return callback()

    let { tree, node, owner } = dirContext
    let object = mapXstatToObject(xstat)

    // createNode do no check
    let entryNode = tree.createNode(node, object) 

    if (!xstat.isDirectory()) return callback()  

    // now it's directory
    callback({ tree, node: entryNode, owner })
  })
}

function buildProtoTree(rootpath, proto, callback) {

  let tree = new ProtoMapTree(proto)
  readXstat(rootpath, (err, xstat) => {
    if (err) return callback(err)
    if (!xstat.isDirectory()) return callback(new Error('must be directory'))
    let object = mapXstatToObject(xstat)
    let node = tree.createNode(null, object)

    visit(rootpath, { tree, node, owner: null }, driveVisitor, () => callback(null, tree))
  })
}

export { buildProtoTree }

