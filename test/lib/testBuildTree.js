import path from 'path'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'

import { expect } from 'chai'
import UUID from 'node-uuid'

import { buildTree, buildTreeAsync } from '../../src/lib/buildTree'
import { rimrafAsync, mkdirpAsync } from '../../src/lib/tools'

async function setupRoot() {

  let r
  r = await rimrafAsync('tmptest')
  if (r instanceof Error) return r
  r = await mkdirp('tmptest')
  if (r instanceof Error) return r   
}

async function setup() {

  let r = await setupRoot()
  if (r instanceof Error) return r
  r = await mkdirp('tmptest/library')
  if (r instanceof Error) return r
  r = await mkdirp('tmptest/drive')
  if (r instanceof Error) return r 

  r = await mkdirp(`tmptest/drive/${UUID.v4()}`)
  if (r instanceof Error) return r
}

describe('buildTree', function() {

  let cwd = process.cwd() 

  // 
  describe('buildTree works', function() {
    
   before(function(done) {
      setup()
        .then(r => done(r))
        .catch(e => done(e))      
    })

    it('ad hoc', function(done) { 

      global.testing = true
      buildTree(path.join(cwd, 'tmptest'), (err, tree) => {
        if (err) return done(err)

        let count = 0
        tree.root.preVisit(node => count++)          
        expect(count).to.equal(4)
        done() 
      })   
    })
  })

  describe('empty root', function() {
    
    before(function(done) {
      setupRoot().then(r => done(r)).catch(e => done(e))
    })

    it('should fill empty root', function(done) {

      buildTree(path.join(cwd, 'tmptest'), (err, tree) => {
        if (err) return done(err)
    
        let count = 0
        tree.root.preVisit(node => count++)
        expect(count).to.equal(3)
        expect(tree.uuidMap.size).to.equal(3)
        expect(tree.hashMap.size).to.equal(0)
        done()
      })      
    })
  })
})













