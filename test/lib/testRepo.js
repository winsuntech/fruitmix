import path from 'path'
import fs from 'fs'

import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import xattr from 'fs-xattr'
import { expect } from 'chai'
import validator from 'validator'
import UUID from 'node-uuid'

import { testing as xstatTesting } from '../../src/lib/xstat'
import { rimrafAsync, mkdirpAsync, fsReaddirAsync, fsStatAsync } from '../../src/lib/tools'
import { createRepo } from '../../src/lib/repo'

const { xattrGetRaw } = xstatTesting

describe('repo', function() {

  describe('create repo', function() {

    let rootpath = path.join(process.cwd(), 'tmptest') 
    it('should create a new repo for given folder', function(done) {
      
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err) 
          createRepo(rootpath, (err, repo) => {
            expect(repo.rootpath).to.equal(rootpath)
            expect(repo.drives).to.deep.equal([])
            expect(repo.libraries).to.deep.equal([])
            done()
          })
        })
      }) 
    })

    // TODO negative case
  })

  describe('repo scan', function() {

    let rootpath = path.join(process.cwd(), 'tmptest')
    it('should scan uuid folders in drive and library folder', function(done) {

      let userUUID = UUID.v4()
      let dpath = path.join(rootpath, 'drive', userUUID)
      let preset = {
        uuid: UUID.v4(),
        owner: [userUUID],
        writelist: [],
        readlist: [],
        hash: null,
        htime: -1
      }

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(dpath, err => {
          if (err) return done(err)
          xattr.set(dpath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            createRepo(rootpath, (err, repo) => {
              if (err) return done(err)
              repo.scan(() => {
                expect(repo.rootpath).to.equal(rootpath)
                expect(repo.drives.length).to.equal(1)
                done()
              })
            })
          })
        })
      })
    }) 
  })

  describe('create drive', function() {

    let userUUID1 = UUID.v4()
 
    it('should create drive folder, with proper name and xattr, as well as tree', function(done) {  

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                done()
              })
            })
          })
        })
      })  
    })
  })


/** TODO

    it('shold NOT create new folder if already existing', function(done) {
      repo.createDrive(userUUID2, (err, result) => {
        expect(err).to.be.an('error')
        expect(err.code).to.equal('EEXIST')
        done()
      })
    })

**/

  describe('create library', function() {

    let userUUID1 = UUID.v4()
    let libraryUUID = UUID.v4()
 
    it('should create library folder, with proper name and xattr, as well as tree', function(done) {  

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)

            repo.createLibrary(userUUID1, libraryUUID, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'library', libraryUUID)

              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)

                let folderUUID = xattr.uuid

                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)

                expect(repo.libraries.length).to.equal(1)
                expect(repo.libraries[0]).to.equal(tree)

                expect(tree.type).to.equal('library')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(libraryUUID)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                done()
              })
            })
          })
        })
      })  
    })
  })

  describe('create folder in drive', function() {
    let userUUID1 = UUID.v4()
 
    it('should create folder in a drive', function(done) {  

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createDriveFolder(userUUID1,"OYES",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("OYES")
                  expect(tree.root.children[0].type).to.equal("folder")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  done()
                })
              })
            })
          })
        })
      })  
    })
  })

  describe('create file in a drive folder', function() {
    let userUUID1 = UUID.v4()

    it('should create drive folder', function(done) {  
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createDriveFolder(userUUID1,"OYES",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("OYES")
                  expect(tree.root.children[0].type).to.equal("folder")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  done()
                })
              })
            })
          })
        })
      })  
    })
  })

  describe('create file in a drive folder', function() {
    let userUUID1 = UUID.v4()
    fs.writeFileSync("/tmptest/aba","11")
    it('should create drive folder', function(done) {  
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createfileInDrive(userUUID1,"/tmptest/aba",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("aba")
                  expect(tree.root.children[0].type).to.equal("file")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  done()
                })
              })
            })
          })
        })
      })  
    })
  })

  describe('create file in library', function() {

    let userUUID1 = UUID.v4()
    let libraryUUID = UUID.v4()
 
    it('should create file in alibrary', function(done) {  

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)

            repo.createLibrary(userUUID1, libraryUUID, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'library', libraryUUID)

              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)

                let folderUUID = xattr.uuid

                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)

                expect(repo.libraries.length).to.equal(1)
                expect(repo.libraries[0]).to.equal(tree)

                expect(tree.type).to.equal('library')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(libraryUUID)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])

                createfileInDrive(userUUID1,"/tmptest/aba","12345ab",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("12345ab")
                  expect(tree.root.children[0].type).to.equal("file")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  done()
                })
              })
            })
          })
        })
      })  
    })
  })

 describe('rename file in a drive folder', function() {
    let userUUID1 = UUID.v4()
    fs.writeFileSync("/tmptest/aba","11")
    it('should rename file in a drive', function(done) {  
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createfileInDrive(userUUID1,"/tmptest/aba",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("aba")
                  expect(tree.root.children[0].type).to.equal("file")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  renameDriveFileOrFolder(tree.root.children[0].uuid,"bcd",(err,r)=>{
                    expect(tree.root.children[0].name).to.equal("bcd")
                    expect(tree.root.children[0].type).to.equal("file")
                    expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                    done()
                  })
                })
              })
            })
          })
        })
      })  
    })
  })

 describe('rename folder in a drive folder', function() {
    let userUUID1 = UUID.v4()
    fs.writeFileSync("/tmptest/aba","11")
    it('should rename file in a drive', function(done) {  
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createDriveFolder(userUUID1,"aba",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("aba")
                  expect(tree.root.children[0].type).to.equal("folder")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  renameDriveFileOrFolder(tree.root.children[0].uuid,"bcd",(err,r)=>{
                    expect(tree.root.children[0].name).to.equal("bcd")
                    expect(tree.root.children[0].type).to.equal("folder")
                    expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                    done()
                  })
                })
              })
            })
          })
        })
      })  
    })
  })

 describe('update file in a drive folder', function() {
    let preset = {
      uuid: "123456", // folder uuid
      owner: ["222222"],
      writelist: ["111111"],
      readlist: ["000000"],
      hash: "654321",
      htime: 0
    }

    let userUUID1 = UUID.v4()
    fs.writeFileSync("/tmptest/aba","11")
    it('should rename file in a drive', function(done) {  
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createfileInDrive(userUUID1,"/tmptest/aba",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("aba")
                  expect(tree.root.children[0].type).to.equal("file")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  updateDriveFile(tree.root.children[0].uuid,preset,(err,r)=>{
                    expect(tree.root.children[0].name).to.equal("aba")
                    expect(tree.root.children[0].type).to.equal("file")
                    expect(tree.root.children[0].owner).deep.to.equal(["222222"])
                    expect(tree.root.children[0].writelist).deep.to.equal(["111111"])
                    expect(tree.root.children[0].readlist).deep.to.equal(["000000"])
                    expect(tree.root.children[0].uuid).deep.to.equal("123456")
                    expect(tree.root.children[0].hash).deep.to.equal("654321")
                    expect(tree.root.children[0].htime).deep.to.equal(0)
                    done()
                  })
                })
              })
            })
          })
        })
      })  
    })
  })

  describe('delete folder from a drive folder', function() {
    let userUUID1 = UUID.v4()
    fs.writeFileSync("/tmptest/aba","11")
    it('should delete a folder from a drive', function(done) {  
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createDriveFolder(userUUID1,"aba",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("aba")
                  expect(tree.root.children[0].type).to.equal("folder")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  deleteDriveFolder(tree.root.children[0].uuid,(err,r)=>{
                    expect(tree.root.children.length).to.equal(0)
                    done()
                  })
                })
              })
            })
          })
        })
      })  
    })
  })

  describe('delete file form a drive folder', function() {
    let userUUID1 = UUID.v4()
    fs.writeFileSync("/tmptest/aba","11")
    it('should delete file from a drive', function(done) {  
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createfileInDrive(userUUID1,"/tmptest/aba",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("aba")
                  expect(tree.root.children[0].type).to.equal("file")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  deleteDriveFolder(tree.root.children[0].uuid,(err,r)=>{
                    expect(tree.root.children.length).to.equal(0)
                    done()
                  })
                })
              })
            })
          })
        })
      })  
    })
  })

  describe('delete file form a library folder', function() {
    let userUUID1 = UUID.v4()
    fs.writeFileSync("/tmptest/aba","11")
    it('should delete file from a drive', function(done) {  
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createfileInDrive(userUUID1,"/tmptest/aba",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("aba")
                  expect(tree.root.children[0].type).to.equal("file")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  deletelibraryFile(tree.root.children[0].uuid,(err,r)=>{
                    expect(tree.root.children.length).to.equal(0)
                    done()
                  })
                })
              })
            })
          })
        })
      })  
    })
  })

  describe('read folder info info in drive', function() {
    let userUUID1 = UUID.v4()
 
    it('should read folder info in a drive', function(done) {  

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                let nodeinfo = readdrivefileorfolderinfo(folderUUID)
                expect(nodeinfo.name).deep.to.equal(folderUUID)
                expect(nodeinfo.type).to.equal("folder")
                expect(nodeinfo.owner).deep.to.equal([userUUID1])
                done()
              })
            })
          })
        })
      })  
    })
  })

  describe('read file info from a drive folder', function() {
    let userUUID1 = UUID.v4()
    fs.writeFileSync("/tmptest/aba","11")
    it('should read file info from a drive', function(done) {  
      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)
            repo.createDrive(userUUID1, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'drive', userUUID1)
              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)
                let folderUUID = xattr.uuid
                // TODO to much expectations !!!
                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)
                expect(repo.drives.length).to.equal(1)
                expect(repo.drives[0]).to.equal(tree)
                expect(tree.type).to.equal('drive')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(userUUID1)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])
                createfileInDrive(userUUID1,"/tmptest/aba",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("aba")
                  expect(tree.root.children[0].type).to.equal("file")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  let nodeinfo = readdrivefileorfolderinfo(folderUUID)
                  expect(nodeinfo.name).deep.to.equal("aba")
                  expect(nodeinfo.type).to.equal("file")
                  expect(nodeinfo.owner).deep.to.equal([userUUID1])
                  done()
                })
              })
            })
          })
        })
      })  
    })
  })

  describe('read file info from library', function() {

    let userUUID1 = UUID.v4()
    let libraryUUID = UUID.v4()
 
    it('should read file info from a library', function(done) {  

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp('tmptest', err => {
          if (err) return done(err)
          let repopath = path.join(process.cwd(), 'tmptest')
          createRepo(repopath, (err, repo) => {
            if (err) return done(err)

            repo.createLibrary(userUUID1, libraryUUID, (err, tree) => {
              if (err) return done(err) 
              let dirpath = path.join(repopath, 'library', libraryUUID)

              xattrGetRaw(dirpath, 'user.fruitmix', (err, xattr) => { 
                if (err) return done(err)

                let folderUUID = xattr.uuid

                expect(validator.isUUID(folderUUID)).to.be.true
                expect(xattr.owner).to.deep.equal([userUUID1])
                expect(xattr.writelist).to.deep.equal([])
                expect(xattr.readlist).to.deep.equal([])
                expect(xattr.hash).to.be.null
                expect(xattr.htime).to.equal(-1)

                expect(repo.libraries.length).to.equal(1)
                expect(repo.libraries[0]).to.equal(tree)

                expect(tree.type).to.equal('library')
                expect(tree.rootpath).to.equal(dirpath)
                expect(tree.root.name).to.equal(libraryUUID)
                expect(tree.root.uuid).to.equal(folderUUID)
                expect(tree.root.owner).to.deep.equal([userUUID1])
                expect(tree.proto.owner).to.deep.equal([userUUID1])

                createfileInDrive(userUUID1,"/tmptest/aba","12345ab",folderUUID,(err,r)=>{
                  expect(tree.root.children[0].name).to.equal("12345ab")
                  expect(tree.root.children[0].type).to.equal("file")
                  expect(tree.root.children[0].owner).deep.to.equal([userUUID1])
                  let nodeinfo = readlibraryfileinfo(folderUUID)
                  expect(nodeinfo.name).deep.to.equal("12345ab")
                  expect(nodeinfo.type).to.equal("file")
                  expect(nodeinfo.owner).deep.to.equal([userUUID1])
                  done()
                })
              })
            })
          })
        })
      })  
    })
  })
})

