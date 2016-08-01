import path from 'path'
import fs from 'fs'

import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import chai from 'chai'
import xattr from 'fs-xattr'
import UUID from 'node-uuid'
import validator from 'validator'

import {
  readTimeStampAsync,
  readXstat2,
  readXstatAnyway,
  readXstatAsync,
  updateXattrPermissionAsync,
  updateXattrHashAsync,
  testing
} from '../../src/lib/xstat.js'

const expect = chai.expect

const uuid1 = '0924c387-f1c6-4a35-a5db-ae4b7568d5de'
const uuid2 = '061a954c-c52a-4aa2-8702-7bc84c72ec84'
const uuid3 = '9e7b40bf-f931-4292-8870-9e62b9d5a12c'
const uuid4 = 'b7ed9abc-01d3-41f0-80eb-361498025e56'
const uuid5 = 'ec7212ad-d5fb-40f0-815f-48d6dff3d1bb'
const uuid6 = 'bd00ee56-0468-4723-b18b-94ca7e6c87c1'
const uuid7 = '68d814e1-5051-43de-a579-b228df924302'
const uuid8 = '23affbe4-7040-429b-ac32-1a7fe7fccd1d'
const uuid9 = '80a0959d-568b-4079-936e-0c21d02570af'

const sha256_1 = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'

const defaultXattr = {
  uuid: uuid1,
  owner: [uuid2],
  writelist: [uuid3],
  readlist: [uuid4],
  hash: uuid5,
  htime: -1
}

describe('xstat', function() {

  let cwd = process.cwd()
  let fpath = path.join(cwd, 'tmptest')

  describe('readTimeStampAsync 01', function(){

    let timestamp

    before(function(done) {

      let uuid = UUID.v4()
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          fs.stat(fpath, (err, stats) => {
            if (err) return done(err)
            timestamp = stats.mtime.getTime()
            done() 
          })
        })
      })  
    })

    it('should read timestamp', function(done) {
      readTimeStampAsync(fpath)
        .then(r => {
          expect(r).to.equal(timestamp)
          done() 
        })
        .catch(e => done(e))
    })
  })

  describe('readXstatAnyway', function() {

    let cwd = process.cwd()
    let fpath = path.join(cwd, 'tmptest')

    it('should return null if xattr non-exist', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)

          readXstatAnyway(fpath, (err, attr) => {
            if (err) return done(err)
            expect(attr).to.be.null
            done()
          })
        })
      })
    })

    it('should return null if xattr is not valid josn', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          xattr.set(fpath, 'user.fruitmix', 'hello', err => {
            if (err) return done(err)
            readXstatAnyway(fpath, (err, attr) => {
              if (err) return done(err)
              expect(attr).to.be.null
              done()
            })
          })
        })
      })
    }) 

    it('should return preset object', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          xattr.set(fpath, 'user.fruitmix', JSON.stringify({
            x: 'hello',
            y: 'world'
          }), err => {
            if (err) return done(err)

            readXstatAnyway(fpath, (err, attr) => {
              if (err) return done(err)
              
              expect(attr.x).to.equal('hello')
              expect(attr.y).to.equal('world')
              expect(attr.isDirectory()).to.be.true
              expect(attr.abspath).to.equal(fpath)
              done()
            })
          })
        })
      })
    })
  })

  describe('readXstat2', function() {

    it('should readback definition for empty xattr', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          readXstat2('tmptest', { owner: [uuid1] }, (err, xstat) => {
            if (err) return done(err)   
            expect(validator.isUUID(xstat.uuid)).to.be.true
            expect(xstat.owner).to.deep.equal([uuid1]) 
            expect(xstat.writelist).to.be.null
            expect(xstat.readlist).to.be.null
            expect(xstat.hash).to.be.null
            expect(xstat.htime).to.equal(-1)
            done() 
          })
        })
      })
    }) 

    it('should return error if owner not provided', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          readXstat2('tmptest', {}, (err, xstat) => {
            expect(err).to.be.an('error')
            done() 
          })
        })
      })
    }) 

    it('should return preset valid xattr (without hash)', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          xattr.set('tmptest', 'user.fruitmix', JSON.stringify({
            uuid: uuid3,
            owner: [uuid2],
            writelist: [uuid5],
            readlist: [uuid6],
            hash: null,
            htime: -1 
          }), err => {
            if (err) return done(err)
            readXstat2('tmptest', { owner: [uuid8] }, (err, xstat) => {
              if (err) return done(err)
              expect(xstat.uuid).to.equal(uuid3)
              expect(xstat.owner).to.deep.equal([uuid2])
              expect(xstat.writelist).to.deep.equal([uuid5])
              expect(xstat.readlist).to.deep.equal([uuid6])
              expect(xstat.hash).to.be.null
              expect(xstat.htime).to.equal(-1)
              done() 
            })
          })
        })
      })
    })

    it('should return preset valid xattr (with outdated timestamp), with null hash', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          xattr.set('tmptest', 'user.fruitmix', JSON.stringify({
            uuid: uuid3,
            owner: [uuid2],
            writelist: [uuid5],
            readlist: [uuid6],
            hash: sha256_1,
            htime: -1 
          }), err => {
            if (err) return done(err)
            readXstat2('tmptest', { owner: [uuid8] }, (err, xstat) => {
              if (err) return done(err)
              expect(xstat.uuid).to.equal(uuid3)
              expect(xstat.owner).to.deep.equal([uuid2])
              expect(xstat.writelist).to.deep.equal([uuid5])
              expect(xstat.readlist).to.deep.equal([uuid6])
              expect(xstat.hash).to.be.null
              expect(xstat.htime).to.equal(-1)
              done() 
            })
          })
        })
      })
    })

    it('should return preset valid xattr (with correct timestamp), with good hash', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          fs.stat('tmptest', (err, stat) => {
            if (err) return done(err)

            xattr.set('tmptest', 'user.fruitmix', JSON.stringify({
              uuid: uuid3,
              owner: [uuid2],
              writelist: [uuid5],
              readlist: [uuid6],
              hash: sha256_1,
              htime: stat.mtime.getTime()
            }), err => {
              if (err) return done(err)
              readXstat2('tmptest', { owner: [uuid8] }, (err, xstat) => {
                if (err) return done(err)
                expect(xstat.uuid).to.equal(uuid3)
                expect(xstat.owner).to.deep.equal([uuid2])
                expect(xstat.writelist).to.deep.equal([uuid5])
                expect(xstat.readlist).to.deep.equal([uuid6])
                expect(xstat.hash).to.be.sha256_1
                expect(xstat.htime).to.equal(stat.mtime.getTime())
                done() 
              })
            })
          })
        })
      })
    })

    it('should discard xattr with invalid uuid, create new one', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          fs.stat('tmptest', (err, stat) => {
            if (err) return done(err)

            xattr.set('tmptest', 'user.fruitmix', JSON.stringify({
              uuid: 'hello',
              owner: [uuid1],
              writelist: [uuid2],
              readlist: [uuid3],
              hash: sha256_1,
              htime: stat.mtime.getTime()
            }), err => {
              if (err) return done(err)
              readXstat2('tmptest', { 
                owner: [uuid4],
                writelist: [uuid5],
                readlist: [uuid6]
              }, (err, xstat) => {
                if (err) return done(err)
                expect(validator.isUUID(xstat.uuid)).to.be.true
                expect(xstat.owner).to.deep.equal([uuid4])
                expect(xstat.writelist).to.deep.equal([uuid5])
                expect(xstat.readlist).to.deep.equal([uuid6])
                expect(xstat.hash).to.be.null // hash discarded
                expect(xstat.htime).to.equal(-1)
                done() 
              })
            })
          })
        })
      })
    })

    it('should fix bad xattr with undefined owner, using default', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          fs.stat('tmptest', (err, stat) => {
            if (err) return done(err)

            xattr.set('tmptest', 'user.fruitmix', JSON.stringify({
              uuid: uuid1,
              writelist: [uuid2],
              readlist: [uuid3],
              hash: sha256_1,
              htime: stat.mtime.getTime()
            }), err => {
              if (err) return done(err)
              readXstat2('tmptest', { 
                owner: [uuid4],
                writelist: [uuid5],
                readlist: [uuid6]
              }, (err, xstat) => {
                if (err) return done(err)

                expect(xstat.uuid).to.equal(uuid1)
                expect(xstat.owner).to.deep.equal([uuid4])
                expect(xstat.writelist).to.deep.equal([uuid2])
                expect(xstat.readlist).to.deep.equal([uuid3])
                expect(xstat.hash).to.be.sha256_1 // hash discarded
                expect(xstat.htime).to.equal(stat.mtime.getTime())
                done() 
              })
            })
          })
        })
      })
    })

    it('should fix xattr with bad owner, using default', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          fs.stat('tmptest', (err, stat) => {
            if (err) return done(err)

            xattr.set('tmptest', 'user.fruitmix', JSON.stringify({
              uuid: uuid1,
              owner: ['hello'],
              writelist: [uuid2],
              readlist: [uuid3],
              hash: sha256_1,
              htime: stat.mtime.getTime()
            }), err => {
              if (err) return done(err)
              readXstat2('tmptest', { 
                owner: [uuid4],
                writelist: [uuid5],
                readlist: [uuid6]
              }, (err, xstat) => {
                if (err) return done(err)

                expect(xstat.uuid).to.equal(uuid1)
                expect(xstat.owner).to.deep.equal([uuid4])
                expect(xstat.writelist).to.deep.equal([uuid2])
                expect(xstat.readlist).to.deep.equal([uuid3])
                expect(xstat.hash).to.be.sha256_1 // hash discarded
                expect(xstat.htime).to.equal(stat.mtime.getTime())
                done() 
              })
            })
          })
        })
      })
    })

    it('should fix xattr with bad writer', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          fs.stat('tmptest', (err, stat) => {
            if (err) return done(err)

            xattr.set('tmptest', 'user.fruitmix', JSON.stringify({
              uuid: uuid1,
              owner: [uuid1],
              writelist: ['hello'],
              readlist: [uuid3],
              hash: sha256_1,
              htime: stat.mtime.getTime()
            }), err => {
              if (err) return done(err)
              readXstat2('tmptest', { 
                owner: [uuid4],
                writelist: [uuid5],
                readlist: [uuid6]
              }, (err, xstat) => {
                if (err) return done(err)

                expect(xstat.uuid).to.equal(uuid1)
                expect(xstat.owner).to.deep.equal([uuid1])
                expect(xstat.writelist).to.deep.equal([])
                expect(xstat.readlist).to.deep.equal([uuid3])
                expect(xstat.hash).to.be.sha256_1
                expect(xstat.htime).to.equal(stat.mtime.getTime())
                done() 
              })
            })
          })
        })
      })
    })

    it('should fix xattr with bad reader', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          fs.stat('tmptest', (err, stat) => {
            if (err) return done(err)

            xattr.set('tmptest', 'user.fruitmix', JSON.stringify({
              uuid: uuid1,
              owner: [uuid1],
              writelist: [uuid2],
              readlist: ['hello'],
              hash: sha256_1,
              htime: stat.mtime.getTime()
            }), err => {
              if (err) return done(err)
              readXstat2('tmptest', { 
                owner: [uuid4],
                writelist: [uuid5],
                readlist: [uuid6]
              }, (err, xstat) => {
                if (err) return done(err)

                expect(xstat.uuid).to.equal(uuid1)
                expect(xstat.owner).to.deep.equal([uuid1])
                expect(xstat.writelist).to.deep.equal([uuid2])
                expect(xstat.readlist).to.deep.equal([])
                expect(xstat.hash).to.be.sha256_1
                expect(xstat.htime).to.equal(stat.mtime.getTime())
                done() 
              })
            })
          })
        })
      })
    })

    it('should format explicit rw from null to []', function(done) {
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          fs.stat('tmptest', (err, stat) => {
            if (err) return done(err)

            xattr.set('tmptest', 'user.fruitmix', JSON.stringify({
              uuid: uuid1,
              owner: [uuid1],
              writelist: [uuid2],
              readlist: null,
              hash: sha256_1,
              htime: stat.mtime.getTime()
            }), err => {
              if (err) return done(err)
              readXstat2('tmptest', { 
                owner: [uuid4],
                writelist: [uuid5],
                readlist: [uuid6]
              }, (err, xstat) => {
                if (err) return done(err)

                expect(xstat.uuid).to.equal(uuid1)
                expect(xstat.owner).to.deep.equal([uuid1])
                expect(xstat.writelist).to.deep.equal([uuid2])
                expect(xstat.readlist).to.deep.equal([])
                expect(xstat.hash).to.be.sha256_1
                expect(xstat.htime).to.equal(stat.mtime.getTime())
                done() 
              })
            })
          })
        })
      })
    })
  })

  describe('updateXattrPermissionAsync 01', function() {

    before(function(done) {
      
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
  
    it('shoud readback updated permission', function(done) {

      let perm = {
        owner: [uuid7],
        writelist: [uuid8],
        readlist: [uuid9]
      } 

      async function testAndVerify() {

        let err = await updateXattrPermissionAsync(fpath, perm)
        if (err instanceof Error) return err
        
        let readback = await testing.xattrGetOrDefault(fpath, 'user.fruitmix')
        if (err instanceof Error) return err

        expect(readback instanceof Error).to.be.false
        expect(readback.owner[0]).to.equal(uuid7)
        expect(readback.writelist[0]).to.equal(uuid8)
        expect(readback.readlist[0]).to.equal(uuid9)
      } 

      testAndVerify()
        .then(r => done(r))
        .catch(e => done(e))
    })
  })

  describe('updateXattrHash 01', function() {

    let timestamp

    before(function(done) {
      
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          fs.stat('tmptest', (err, stats) => { 
            if (err) return done(err)
            timestamp = stats.mtime.getTime()
            xattr.set(fpath, 'user.fruitmix', 
              JSON.stringify(defaultXattr), err => done(err))
          })
        })
      })
    })
  
    it('shoud return updated hash if timestamp match', function(done) {

      async function testAndVerify() {

        let err = await updateXattrHashAsync(fpath, 'hashhash', timestamp)
        if (err instanceof Error) return err
        
        let readback = await testing.xattrGetOrDefault(fpath, 'user.fruitmix')
        if (err instanceof Error) return err

        expect(readback.htime).to.equal(timestamp)
        expect(readback.hash).to.equal('hashhash')
      } 

      testAndVerify()
        .then(r => done(r))
        .catch(e => done(e))
    })
  })

  describe('updateXattrHash 02', function() {

    let timestamp

    before(function(done) {
      
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          fs.stat('tmptest', (err, stats) => { 
            if (err) return done(err)
            timestamp = stats.mtime.getTime()
            xattr.set(fpath, 'user.fruitmix', 
              JSON.stringify(defaultXattr), err => done(err))
          })
        })
      })
    })
  
    it('shoud reject with error code ETIMESTAMP_OUTDATED', function(done) {

      updateXattrHashAsync(fpath, 'hashhash', timestamp - 2)
        .then(r => {
          expect(r instanceof Error).to.be.true
          expect(r.code).to.equal('ETIMESTAMP_OUTDATED')
          done()
        })
        .catch(e => done(e))
    })
  })
})

