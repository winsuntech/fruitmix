import Promise from 'bluebird'
import mkdirp from 'mkdirp'

import { readXstatAnyway } from './xstat'

const mkdirpAsync = Promise.promisify(mkdirp)
const readXstatAnywayAsync = Promise.promisify(readXstatAnyway)

async function test() {

  return readXstatAnywayAsync('test123')
}

test()
  .then(r => console.log(r))
  .catch(e => console.log(e))
  
