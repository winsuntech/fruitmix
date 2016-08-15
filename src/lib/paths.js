import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

const mkdirpAsync = Promise.promisify(mkdirp)

// holds fruitmix root path, something like /run/wisnuc/[UUID]/wisnuc/fruitmix
// either absolute path or undefined
let root = undefined

// util functoin
const join = (name) => path.join(root, name)

// set fruitmix root, mkdirp all internal folders
const setRootAsync = async (rootpath) => {

  if (!path.isAbosolute(rootpath)) throw new Error('rootpath must be absolute path')     

  root = rootpath

  await mkdirpAsync(root)
  await mkdirpAsync(join('models'))
  await mkdirpAsync(join('drives'))
  await mkdirpAsync(join('pools'))
  await mkdirpAsync(join('etc'))
  await mkdirpAsync(join('tmp'))
}

// callback version of setRoot
const setRoot = (rootpath, callback) => 
  setSysRootAsync(rootpath)
    .then(r => callback(null, r))
    .catch(e => callback(e))

// discard root
const unsetRoot = () => root = undefined

// get path by name, throw if root unset or name unknown
const _path = (name) => {

  if (!root) throw new Error('fruitmix root not set')

  switch(name) {
  case 'models':
  case 'drives':
  case 'pools':
  case 'tmps':
    return join(name)
  default:
    throw new Error('unknown fruitmix path name')
  }
}

export default { 
  setRoot,
  setRootAsync,
  unsetRoot,
  path: _path
}

