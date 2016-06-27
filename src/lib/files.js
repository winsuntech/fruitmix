import fs from 'fs'
import path from 'path'

import validator from 'validator'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

import { readXstats, readXstatsAsync, updateXattrPermissionAsync } from './xstats'
import { Node, MapTree } from './maptree'

// nodeWriteList
// nodeReadList
// nodeOwner

const isExplicit = (node) => (nodeWriteList(node) !== null || nodeReadList(node) !== null)

const nearestExplicit = (node) => node.upFind(n => isExplicit(n))

const nodeRootOwner = (node) => {
  let root = node.upFind(n => 
    (n.parent === driveRootParent || n.parent === libRootParent))
  return nodeOwner(root)  
}

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

  retun [...write, ...read] 
}

const nodeUserWritable = (node, user) => {

  if (user === nodeRootOwner(node)) return true

  let ancestor = nearestExplicit(node)
  let writables = nodeWritables(ancestor)

  return writables.find(w => w === user) ? true : false
}

const nodeUserReadable = (node, user) => {

  if (user === nodeRootOwner(node) return true

  let ancestor = nearestExplicit(node)
  let readables = nodeReaables(ancestor)

  return readables.find(r => r === user) ? true : false
}


/***********************************************************/

const visit = (xstat, eol, done) => {

  fs.readdir(xstat.abspath, (err, list) => {
    if (err || list.length === 0) return done()

    let count = list.length 
    list.forEach(entry => {

      readXstats(path.join(xstat.abspath, entry), (err, entryXstat) => {
        if (!err && eol(entryXstat, xstat)) 
          return visit(entryXstat, enter, () => {
            if (!--count) done()
          })

        if (!--count) done() 
      })
    })
  })
}

const nodeEOL = (cxstat, pxstat) => {

  // only process file and folder
  if (cxstat.isFile() || cxstat.isDirectory()) {
    
    // enter only if node created and being directory
    if (tree.createNodeByUUID(pxstat.uuid, cxstat) && cxstat.isDirectory())
      return true
  }
  return false
}










let tree = null
let rootpath = '/data/fruitmix'
let driveRootParent
let libRootParent

async function mkdirpAsync(dirpath) {
  return new Promise(resolve => 
    mkdirp(dirpath, err => 
      err ? resolve(err) : resolve(null)))
}

async function fsReaddirAsync(dirpath) {
  return new Promise(resolve => 
    fs.readdir(dirpath, (err, files) => 
      err ? resolve(err) : resolve(files)))
}

async function initFolders() {

  await mkdirpAsync('/data/fruitmix')
  await mkdirpAsync('/data/fruitmix/drive')
  await mkdirpAsync('/data/fruitmix/library')
}

const validateOwner = (owner, uuid) =>
  (owner && Array.isArray(owner) && owner.length === 1 && owner[0] === uuid)

const validateUserList = (list) => 
  (list && Array.isArray(list) && list.every(w => validator.isUUID(w)))

async function checkDriveXstat(rootpath, uuid) {

  let drivePath = path.join(rootpath, uuid)
  let mix = {
    owner: [uuid],
    writelist: [],
    readlist: [],
  }

  let x = await readXstatsAsync(drivePath, mix)
  let { owner, writelist, readlist } = x

  if (validateOwner(owner) &&
      validateList(writelist) &&
      validateList(readlist)) return

  let perm = {
    owner: [uuid],
    writelist: validateList(writelist) ? writelist : [],
    readlist: validateList(readlist) ? readlist : [] 
  } 

  await updateXattrPermissionAsync(drivepath, perm)
}

// skip owner check for now TODO
async checkLibraryXstat(rootpath, uuid) {

  let libraryPath = path.join(rootpath, uuid)  
  let perm = { writelist: [], readlist: [] }

  // do this anyway
  await updateXattrPermissionAsync(libraryPath, perm)
}

async function inspectDrives(droot) {

  let files = await fsReaddirAsync(droot)
  files = files.filter(f => validator.isUUID(f))

  for (let i = 0; i < files.length; i++) {
    await checkDriveXstat(droot, files[i])
  } 
}

async function inspectLibraries(lroot) {

  let files = await fsReaddirAsync(lroot)
  files = files.filter(f => validator.isUUID(f))

  for (let i = 0; i < files.length; i++) {
    await checkLibraryXstat(lroot, files[i])
  }
}

async function init() {

  await mkdirpAsync('/data/fruitmix')
  await mkdirpAsync('/data/fruitmix/library')
  await mkdirpAsync('/data/fruitmix/drive')

  let rootObj = await readXstatsAsync('/data/fruitmix')
  tree = new Tree(rootObj) 
  let root = tree.root

  let libX = await readXstatsAsync('/data/fruitmix/library')
  let lib = tree.createNode(tree.root, libX)

  let driveX = await readXstatsAsync('/data/fruitmix/drive')
  let drive = tree.createNode(tree.root, driveX)

  visit(driveX, nodeEOL, () => {
    tree._visit_pre(drive, (node) => console.log(node.abspath))
  })

  visit(libX, nodeEOL, () => {
    console.log(lib.children.map(c => c.abspath))
  })
}

init()
  .then(r => console.log(r))
  .catch(e => console.log(e))



