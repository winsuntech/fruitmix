import path from 'path'

import UUID from 'node-uuid'

import { rimrafAsync, mkdirpAsync } from './tools'
import { buildTreeAsync } from './buildTree'

function multiply(A, B) {
  let C = []
  A.forEach(a => {
    B.forEach(b => {
      C.push(a + b)
    })
  })
  return C 
}

async function createfolders(rootpath) {

  console.log('prepare array')
  console.time('prepare_array')

  let x1 = 'abcdefghijk'.split('')
  let x2 = multiply(x1, x1)
  let x3 = multiply(x1, x2)
  let x4 = multiply(x1, x3)     
  let x5 = multiply(x1, x4)
  let x6 = multiply(x1, x5)
  let x = x6

  console.timeEnd('prepare_array')
  console.log(`array size ${x.length}`)
  console.log('making folders')

  console.time('making_folders')
  for (let i = 0; i < x.length; i++) {

    let y = x[i].split('')
    y.unshift(rootpath)
    await mkdirpAsync(path.join(...y))   
  }

  console.timeEnd('making_folders')
}

let rootpath = path.join(process.cwd(), 'tmptest')

async function prepare() {
  
  let uuid = UUID.v4()
  let drivepath = `tmptest/drive/${uuid}` 

  console.log('create basic folders')
  await rimrafAsync('tmptest')
  await mkdirpAsync('tmptest/drive')
  await mkdirpAsync(`tmptest/drive/${uuid}`)
  await mkdirpAsync('tmptest/library')

  let rpath = path.join(process.cwd(), drivepath) 
  await createfolders(rpath)
}

async function test() {
  console.log('starting test')
  await prepare()

  console.log('starting buildTree')
  console.time('buildTree')
  let tree = await buildTreeAsync(rootpath)
  console.timeEnd('buildTree')
  return tree
}

test()
  .then(tree => {
    console.log(`tree map size: ${tree.uuidMap.size}`)
    done()
  })
  .catch(e => done(e))


