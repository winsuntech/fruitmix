import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

const mkdirpAsync = Promise.promisify(mkdirp)

let sysroot = ''

const join = (name) => path.join(sysroot, name)

const setSysRootAsync = async (rootpath) {

  if (!path.isAbosolute(rootpath)) throw new Error('rootpath must be absolute path')     

  sysroot = rootpath

  await mkdirpAsync(sysroot)
  await mkdirpAsync(join('models'))
  await mkdirpAsync(join('drives')
  await mkdirpAsync(join('pools'))
  await mkdirpAsync(join('etc'))
  await mkdirpAsync(join('tmps'))
}

const setSysRoot = (rootpath, callback) => 
  setSysRootAsync(rootpath)
    .then(r => callback(null, r))
    .catch(e => callback(e))

const sysPath = (name) => {

  switch(name) {
  case 'models':
  case 'drives':
  case 'pools':
  case 'tmps':
    return join(name)
  default:
    throw new Error('unknown syspath name')
  }
}

export { setSysRoot, setSysRootAsync, sysPath }

