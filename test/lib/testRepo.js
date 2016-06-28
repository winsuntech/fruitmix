import path from 'path'

import { expect } from 'chai'
import UUID from 'node-uuid'

import { testing as xstatTesting } from '../../src/lib/xstat'
import { rimrafAsync, mkdirpAsync, fsReaddirAsync, fsStatAsync } from '../../src/lib/tools'
import { buildTreeAsync } from '../../src/lib/buildTree'
import Repo from '../../src/lib/repo'

const { xattrGetRaw } = xstatTesting

describe('test repo', function(){

  describe('create drive', function() {

    let root = path.join(process.cwd(), 'tmptest') 
    let userUUID1 = UUID.v4()
    let userUUID2 = UUID.v4()
    let repo

    async function setup(root) {

      let r
      r = await rimrafAsync('tmptest')
      if (r instanceof Error) return r
      
      r = await mkdirpAsync('tmptest')
      if (r instanceof Error) return r

      r = await mkdirpAsync(`tmptest/drive/${userUUID2}`)
      if (r instanceof Error) return r

      return await buildTreeAsync(path.join(root))
    }

    before(function(done) {
      setup(root)
        .then(tree => {
          if (tree instanceof Error) return done(r)
          repo = new Repo(root, tree)
          done()
        }) 
        .catch(e => done(e))
    })   
 
    it('should create new folder if not existing', function(done) {  
      repo.createDrive(userUUID1, (err, result) => {
        if (err) return done(err) 

        let dirpath = path.join(root, 'drive', userUUID1)
        xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
          if (err) return done(err)

          expect(xattr.owner).to.be.an('array')
          expect(xattr.owner.length).to.equal(1) 
          expect(xattr.owner[0]).to.equal(userUUID1)
          expect(xattr.writelist).to.be.an('array')
          expect(xattr.writelist.length).to.equal(0)       
          expect(xattr.readlist).to.be.an('array')
          expect(xattr.readlist.length).to.equal(0)
          done()
        })
      })
    })

    it('shold NOT create new folder if already existing', function(done) {
      repo.createDrive(userUUID2, (err, result) => {
        expect(err).to.be.an('error')
        expect(err.code).to.equal('EEXIST')
        done()
      })
    })
  })
})

