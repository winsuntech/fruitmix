import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

const Util = require( './util.js')


// holds fruitmix root path, something like /run/wisnuc/[UUID]/wisnuc/fruitmix
// either absolute path or undefined
let root = undefined

// util functoin
const join = (name) => path.join(root, name)

// set fruitmix root, mkdirp all internal folders
const setRootAsync = async (rootpath) => {
  if (!path.isAbsolute(rootpath)) throw new Error('rootpath must be absolute path')     

  root = rootpath

  await Util.mkdirpAsync(root)
  await Util.mkdirpAsync(join('models'))
  await Util.mkdirpAsync(join('drives'))
  await Util.mkdirpAsync(join('documents'))
  await Util.mkdirpAsync(join('mediashare'))
  await Util.mkdirpAsync(join('mediatalk'))
  await Util.mkdirpAsync(join('upload'))
  await Util.mkdirpAsync(join('etc'))
  await Util.mkdirpAsync(join('tmp'))
}

// callback version of setRoot
const setRoot = (rootpath, callback) => 
  setSysRootAsync(rootpath)
    .then(r => callback(null, r))
    .catch(e => callback(e))

// discard root
const unsetRoot = () => root = undefined

// get path by name, throw if root unset or name unknown
const getPath = (name) => {

  if (!root) throw new Error('fruitmix root not set')

  switch(name) {
  case 'models':
  case 'drives':
  case 'documents':
  case 'mediashare':
  case 'mediatalk':
  case 'upload':
  case 'etc':
  case 'tmp':
    return join(name)
  default:
    throw new Error(`unknown fruitmix path name: ${name}`)
  }
}

export default { 
  setRoot,
  setRootAsync,
  unsetRoot,
  get: getPath
}

