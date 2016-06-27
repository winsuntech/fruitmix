import path from 'path'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'

import { expect } from 'chai'
import UUID from 'node-uuid'

import { buildTree } from '../../src/lib/store'
import { rimrafAsync, mkdirpAsync } from '../../src/lib/tools'

async function setup() {

  let r = await rimrafAsync('tmptest')
  if (r instanceof Error) return r

  r = await mkdirp('tmptest/library')
  if (r instanceof Error) return r

  r = await mkdirp('tmptest/drive')
  if (r instanceof Error) return r 

  r = await mkdirp(`tmptest/drive/${UUID.v4()}`)
  if (r instanceof Error) return r

}

describe('store', function() {

  describe('buildTree', function() {
    
    let cwd = process.cwd()
    
    before(function(done) {
      setup()
        .then(r => done(r))
        .catch(e => done(e))      
    })

    it('should do nothing', function(done) { 
      buildTree(path.join(cwd, 'tmptest'))
        .then(r => {
          console.log(r)
          expect(r.root).to.equal(path.join(cwd, 'tmptest'))
          done()
        })
        .catch(e => {
          done(e)
        })
    })
  })
})
