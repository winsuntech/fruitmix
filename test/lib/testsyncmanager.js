import path from 'path'
import fs from 'fs'

import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import xattr from 'fs-xattr'
import { expect } from 'chai'

import { createSyncManager } from '../../src/lib/syncmanager'

describe('syncmanager', function() {

  describe('create syncmanager', function() {

    let rootpath = path.join(process.cwd(), 'synctest') 
    console.log(rootpath)
    it('should create a new syncmanager', function(done) {
      
      rimraf('synctest', err => {
        if (err) return done(err)
        mkdirp('synctest', err => {
          if (err) return done(err) 
          createSyncManager(rootpath, (syncm) => {
            expect(syncm.rootpath).to.equal(rootpath)
            done()
          })
        })
      }) 
    })
  })

  describe('canonicalJson', function() {
    let testnode={a:1,c:2,b:3}
    let rootpath = path.join(process.cwd(), 'synctest') 
    console.log(rootpath)
    it('should return a canonicalJson', function(done) {
      
      rimraf('synctest', err => {
        if (err) return done(err)
        mkdirp('synctest', err => {
          if (err) return done(err) 
          createSyncManager(rootpath, (syncm) => {
            expect(syncm.rootpath).to.equal(rootpath)
            let newnode=syncm.canonicalJson(testnode)
            expect(newnode).deep.to.equal({"a":1,"b":2,"c":3})
            done()
          })
        })
      }) 
    })
  })


  // describe('repo scan', function() {

  //   let rootpath = path.join(process.cwd(), 'tmptest')
  //   it('should scan uuid folders in drive and library folder', function(done) {

  //     let userUUID = UUID.v4()
  //     let dpath = path.join(rootpath, 'drive', userUUID)
  //     let preset = {
  //       uuid: UUID.v4(),
  //       owner: [userUUID],
  //       writelist: [],
  //       readlist: [],
  //       hash: null,
  //       htime: -1
  //     }

  //     rimraf('tmptest', err => {
  //       if (err) return done(err)
  //       mkdirp(dpath, err => {
  //         if (err) return done(err)
  //         xattr.set(dpath, 'user.fruitmix', JSON.stringify(preset), err => {
  //           if (err) return done(err)
  //           createRepo(rootpath, (err, repo) => {
  //             if (err) return done(err)
  //             repo.scan(() => {
  //               expect(repo.rootpath).to.equal(rootpath)
  //               expect(repo.drives.length).to.equal(1)
  //               done()
  //             })
  //           })
  //         })
  //       })
  //     })
  //   }) 
  // })
  
})

