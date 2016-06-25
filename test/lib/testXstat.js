import path from 'path'
import fs from 'fs'

import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import chai from 'chai'
import xattr from 'fs-xattr'
import UUID from 'node-uuid'
import validator from 'validator'

import {
  readXstatsAsync
} from '../../src/lib/xstats.js'

const expect = chai.expect

const uuid1 = '0924c387-f1c6-4a35-a5db-ae4b7568d5de'
const uuid2 = '061a954c-c52a-4aa2-8702-7bc84c72ec84'
const uuid3 = '9e7b40bf-f931-4292-8870-9e62b9d5a12c'
const uuid4 = 'b7ed9abc-01d3-41f0-80eb-361498025e56'
const uuid5 = 'ec7212ad-d5fb-40f0-815f-48d6dff3d1bb'

const defaultXattr = {
  uuid: uuid1,
  owner: [uuid2],
  writelist: [uuid3],
  readlist: [uuid4],
  hash: uuid5,
  htime: 'htime'
}

describe('Xstats readXstatsAsync', function(){

  let cwd = process.cwd()
  let fpath = path.join(cwd, 'tmptest')

  describe('readXstatsAsync 01', function(){

    before(function(done) {

      let uuid = UUID.v4()
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          xattr.set(fpath, 'user.fruitmix', JSON.stringify(defaultXattr), err => {
            done(err) 
          })
        })
      })  
    })

    it('should readback preset xattrs, with null hash', function(done) {
      readXstatsAsync(fpath)
        .then(r => {
          expect(r.uuid).to.equal(uuid1)
          expect(r.owner[0]).to.equal(uuid2)
          expect(r.writelist[0]).to.equal(uuid3)
          expect(r.readlist[0]).to.equal(uuid4)
          expect(r.hash).to.be.null    // IMPORTANT!
          done() 
        })
        .catch(e => done(e))
    })
  })

  describe('readXstatsAsync 02', function(){

    before(function(done) {

      let uuid = UUID.v4()
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          done(err) 
        })
      })  
    })

    it('should readback default xattrs, with null hash', function(done) {
      readXstatsAsync(fpath)
        .then(r => {
          expect(validator.isUUID(r.uuid)).to.be.true
          expect(r.owner).to.be.null
          expect(r.writelist).to.be.null
          expect(r.readlist).to.be.null
          expect(r.hash).to.be.null    // IMPORTANT!
          done() 
        })
        .catch(e => done(e))
    })
  })

  describe('readXstatsAsync 03', function(){

    before(function(done) {

      let uuid = UUID.v4()
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          fs.stat('tmptest', (err, stats) => {
            if (err) return done(err)
            let attr = Object.assign({}, defaultXattr, { 
              htime: stats.mtime.getTime() 
            })
            xattr.set(fpath, 'user.fruitmix', JSON.stringify(attr), err => {
              done(err)      
            })
          }) 
        })
      })  
    })

    it('should readback preset xattrs, with good hash', function(done) {
      readXstatsAsync(fpath)
        .then(r => {
          expect(r.hash).to.equal(uuid5)
          done() 
        })
        .catch(e => done(e))
    })
  })

})
