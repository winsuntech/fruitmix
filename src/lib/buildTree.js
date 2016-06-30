import fs from 'fs'
import path from 'path'

import validator from 'validator'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

import { mkdirpAsync, fsReaddirAsync, mapXstatToObject } from './tools'
import { readXstat, readXstatAsync, updateXattrPermissionAsync } from './xstat'
import { Node, MapTree } from './maptree'
import { visit, visitAsync } from './visitors'

const driveDir = (root) => path.join(root, 'drive')
const libraryDir = (root) => path.join(root, 'library')
const uploadDir = (root) => path.join(root, 'uploads')
const thumbDir = (root) => path.join(root, 'thumb')
const predefinedDirs = (root) => 
  [ root, driveDir(root), libraryDir(root), uploadDir(root), thumbDir(root) ]

async function initMkdirs(root) {
  let predefined = predefinedDirs(root) 
  for (let i = 0; i < predefined.length; i++) {
    await mkdirpAsync(predefined[i])
  }
}

/*
 * only one owner allowed
 */
const validateDriveOwner = (owner, uuid) =>
  (owner && Array.isArray(owner) && owner.length === 1 && owner[0] === uuid)

const validateLibraryOwner = (owner) =>
  (owner && Array.isArray(owner) && owner.length === 1 && (typeof owner[0] === 'string') && validator.isUUID(owner[0]))
/*
 * not null, is array, uuid valid
 */
const validateUserList = (list) => 
  (list && Array.isArray(list) && list.every(u => typeof u === 'string') && list.every(u => validator.isUUID(u)))


/*
 * drive permission check, return <entry, owner> pair
 */ 
async function checkDriveXstat(drivedir, uuid) {

  let dir = path.join(drivedir, uuid)

  let x = await readXstatAsync(dir)
  if (x instanceof Error) return x
  let { owner, writelist, readlist } = x

  if (validateDriveOwner(owner) &&
      validateUserList(writelist) &&
      validateUserList(readlist)) return null

  let err = await updateXattrPermissionAsync(dir, {
    owner: [uuid],
    writelist: validateUserList(writelist) ? writelist : [],
    readlist: validateUserList(readlist) ? readlist : [] 
  })

  if (err instanceof Error) return err
  return {
    entry: uuid,
    owner: [uuid]
  } 
}

/*
 * library permission check, return <entry, owner> pair
 */
async function checkLibraryXstat(librarydir, uuid) {

  let dir = path.join(librarydir, uuid)  
  let x = await readXstatAsync(dir)
  if (x instanceof Error) return x

  let { owner, writelist, readlist } = x

  // if no owner, TODO may check database
  if (!validateLibraryOwner(owner))
    return new Error(`${dir} owner invalid`)

  // do this anyway
  let err = await updateXattrPermissionAsync(dir, {
    owner, 
    writelist: [], // force clear
    readlist: validateUserList(readlist) ? readlist : []
  })

  if (err instanceof Error) return err
  return {
    entry: uuid,
    owner: owner
  }
}

async function inspectDrives(driveDir) {

  let files = await fsReaddirAsync(driveDir)
  files = files.filter(f => validator.isUUID(f))

  let valid = []
  for (let i = 0; i < files.length; i++) {
    let uuid = files[i]
    let r = await checkDriveXstat(driveDir, uuid)
    if (!(r instanceof Error)) valid.push(r)
  } 
  return valid
}

async function inspectLibraries(librarydir) {

  let files = await fsReaddirAsync(librarydir)
  files = files.filter(f => validator.isUUID(f))

  let valid = []
  for (let i = 0; i < files.length; i++) {
    let uuid = files[i]
    let r = await checkLibraryXstat(librarydir, files[i])
    if (!(r instanceof Error)) valid.push(r)
  }
  return valid
}

// TODO need more logic to fix ownerless file/folder
const visitor = (dir, dirContext, entry, callback) => {

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

async function visitorAsync(dir, dirContext, entry) {

  let entrypath = path.join(dir, entry)
  let xstat = await readXstatAsync(entrypath) 
  if (xstat instanceof Error) return
  if (!xstat.isDirectory() && !xstat.isFile()) return

  let {tree, node, owner } = dirContext
  let object = mapXstatToObject(xstat)
  let entryNode = tree.createNode(node, object)

  if (!xstat.isDirectory()) return
  return { tree, node: entryNode, owner }
}

function promisifyVisit(dir, dirContext, visitor) {

  return new Promise(resolve => visit(dir, dirContext, visitor, () => resolve()))
}

async function dirToNode(dir, tree, parent) {

  let xstat = await readXstatAsync(dir)
  if (xstat instanceof Error) return xstat
  
  let object = mapXstatToObject(xstat)
  if (!tree) {
    return new MapTree(object)
  }
  else
    return tree.createNode(parent, object)
}

async function buildTreeAsync(root) {

  let promises = [], valid, node, dir
  let tree, driveDirNode, libraryDirNode

  let drivedir = driveDir(root)
  let librarydir = libraryDir(root)

  let r = await initMkdirs(root)

  // root, drive, and library
  tree = await dirToNode(root)
  driveDirNode = await dirToNode(drivedir, tree, tree.root)
  libraryDirNode = await dirToNode(librarydir, tree, tree.root) 

  // drives
  valid = await inspectDrives(drivedir)
  if (!global.testing) console.log(`found ${valid.length} drives`)

  for (let i = 0; i < valid.length; i++) {
    dir = path.join(drivedir, valid[i].entry)
    node = await dirToNode(dir, tree, driveDirNode)
    // promises.push(visitAsync(dir, {tree, node, owner: node.permission.owner}, visitorAsync))
    promises.push(new Promise(resolve => visit(dir, {tree, node, owner: node.permission.owner}, visitor, () => resolve())))
  } 

  // libraries
  valid = await inspectLibraries(librarydir)
  if (!global.testing) console.log(`found ${valid.length} libraries`)

  for (let i = 0; i < valid.length; i++) {
    dir = path.join(librarydir, valid[i].entry)
    node = await dirToNode(dir, tree, libraryDirNode)
    promises.push(visitAsync(dir, {tree, node, owner: node.permiision.owner}, visitorAsync))
  }

  await Promise.all(promises) 
  return tree
}

const buildTree = (root, callback) => {

  buildTreeAsync(root)
    .then(tree => {
      if (tree instanceof Error) return callback(tree)
      callback(null, tree)
    })
    .catch(e => callback(e))
}

export { buildTree, buildTreeAsync }

