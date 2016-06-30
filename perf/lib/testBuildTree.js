import path from 'path'

import UUID from 'node-uuid'

import { rimrafAsync, mkdirpAsync } from '../../src/lib/tools'
import { buildTreeAsync } from '../../src/lib/buildTree'

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

  console.log('preparing array')

  let x1 = 'abcdefghijk'.split('')
  let x2 = multiply(x1, x1)
  let x3 = multiply(x1, x2)
  let x4 = multiply(x1, x3)     
  let x5 = multiply(x1, x4)

  let x = x5
  console.log(x.length)
  console.log('making dirs')
  for (let i = 0; i < x.length; i++) {

    let y = x[i].split('')
    y.unshift(rootpath)
    await mkdirpAsync(path.join(...y))   
  }
  console.log('making dirs done')
}

describe('BuildTree', function() {

  describe('create many folders', function() {

    let rootpath = path.join(process.cwd(), 'tmptest')

    async function prepare() {
      
      let uuid = UUID.v4()
      let drivepath = `tmptest/drive/${uuid}` 

      await rimrafAsync('tmptest')
      await mkdirpAsync('tmptest/drive')
      await mkdirpAsync(`tmptest/drive/${uuid}`)
      await mkdirpAsync('tmptest/library')

      let rpath = path.join(process.cwd(), drivepath) 
      await createfolders(rpath)
    }

    before(function(done) {
      this.timeout(0)
      prepare()
        .then(() => done())
        .catch(e => done(e)) 
    })

    async function test() {
      return await buildTreeAsync(rootpath)
    }

    it('scanned many files', function(done) {
      this.timeout(0)

      test()
        .then(tree => {
          console.log('tree sie')
          console.log(tree.uuidMap.size)
          done()
        })
        .catch(e => done(e))
    })
  })
})




