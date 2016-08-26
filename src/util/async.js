import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'

import rimraf from 'rimraf'
import mkdirp from 'mkdirp'

export const rimrafAsync = Promise.promisify(rimraf)
export const mkdirpAsync = Promise.promisify(mkdirp)

Promise.promisifyAll(fs)

export { fs }


