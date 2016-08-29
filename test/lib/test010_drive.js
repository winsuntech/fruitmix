import path from 'path'
import crypto from 'crypto'

import Promise from 'bluebird'

import { expect } from 'chai'
import UUID from 'node-uuid'
import validator from 'validator'

import mkdirp from 'mkdirp' // FIXME

import uuids from '../util/uuids'
import { rimrafAsync, mkdirpAsync, fs, xattr } from '../util/async'
import { createDrive } from '../../src/lib/drive'

const uuid1 = 'c0765cd5-acd1-4b53-bb17-7834ebdca6c1' 
const uuid2 = 'd7114148-e2bd-42f8-88f9-a980a1a4d29c' 

const cwd = process.cwd()
const FRUITMIX = 'user.fruitmix'
const preset1 = JSON.stringify({
    uuid:uuid1,
    owner:[uuid2],
    writelist: [],
    readlist:[]
  })

const fixed01 = {
  label: 'fixed01',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: uuids[0],
  owner: [uuids[1]],
  writelist: [],
  readlist: [],
  cache: true
}

const variable01 = {
  label: 'variable01',
  fixedOwner: false,
  URI: 'fruitmix',
  uuid: uuids[0],
  owner: [uuids[1]],
  writelist: [],
  readlist: [],
  cache: true
}

describe(path.basename(__filename), function() {

  describe('test create drive', function() {

    const expectInitialState = (drv, uuid) => {
  
      expect(drv.proto.writelist).to.be.undefined
      expect(drv.proto.readlist).to.be.undefined

      expect(drv.uuid).to.equal(uuid)
      expect(drv.rootpath).to.be.null
      expect(drv.memtreeState).to.equal('NONE')
    }

    it('proto should have owner for fixed owner, with w/r list undefined', function() {

      let drv = createDrive(fixed01)
      expect(drv.proto.owner).to.deep.equal(fixed01.owner)
      expect(drv.proto.writelist).to.be.undefined
      expect(drv.proto.readlist).to.be.undefined

      for (let prop in fixed01) {
        if (fixed01.hasOwnProperty(prop)) {
          expect(drv[prop]).to.deep.equal(fixed01[prop])
        }
      }
    })

    it('proto should have no owner for variable owner, with w/r list undefined', function() {

      let drv = createDrive(variable01)
      expect(drv.proto.owner).to.deep.equal([])
      expect(drv.proto.writelist).to.be.undefined
      expect(drv.proto.readlist).to.be.undefined

      for (let prop in variable01) {
        if (variable01.hasOwnProperty(prop)) {
          expect(drv[prop]).to.deep.equal(variable01[prop])
        }
      }
    })
  })

  describe('test cache for drive', function() {

    let { uuid, owner, writelist, readlist } = fixed01

    beforeEach(function() {
      return (async () => {
        await rimrafAsync('tmptest')
        await mkdirpAsync('tmptest')
      })()
    })

    it('should emit, have correct root props, cacheState, after buildCache finishes', function(done) {

      let { uuid, owner, writelist, readlist } = fixed01
      let type = 'folder'

      let drive = createDrive(fixed01)
      drive.on('driveCached', drv => {

        expect(drv).to.equal(drive)

        expect(drv.rootpath).to.equal(path.join(cwd, 'tmptest'))
        expect(drv.cacheState).to.equal('CREATED')

        expect(drv.root.uuid).to.deep.equal(uuid)
        expect(drv.root.type).to.equal('folder')
        expect(drv.root.owner).to.deep.equal(owner)
        expect(drv.root.writelist).to.deep.equal(writelist)
        expect(drv.root.readlist).to.deep.equal(readlist)
        expect(drv.root.name).to.deep.equal('tmptest')

        done()
      })

      drive.setRootpath(path.join(cwd, 'tmptest'))
    })

    it('should build cache on simple folder hierarchy w/o xattr', function(done) {

      const named = (list, name) => {
        let l = list.find(l => l.name === name)
        if (!l) throw new Error('named item not found in list')
        return l
      }

      mkdirpAsync('tmptest/folder1/folder2')
        .then(() => mkdirpAsync('tmptest/folder3'))
        .then(() => {

          let drive = createDrive(fixed01)
          drive.on('driveCached', drv => {

            let list = drv.print()
            expect(named(list, 'folder1').parent).to.equal(fixed01.uuid)
            expect(named(list, 'folder2').parent).to.equal(named(list, 'folder1').uuid)
            expect(named(list, 'folder3').parent).to.equal(fixed01.uuid)

            expect(list.filter(l => !!l.parent).length).to.equal(3)
            list.filter(l => !!l.parent)
              .forEach(l => {
                expect(l.type).to.equal('folder')
                expect(l.owner).to.deep.equal([])
                expect(l.writelist).to.be.undefined
                expect(l.readlist).to.be.undefined
              })
            done()
          })

          drive.setRootpath(path.join(cwd, 'tmptest'))
        })
        .catch(e => done(e))
    })

    // FIXME this test case should be moved to protoMapTree
    it('should emit hashlessNonEmpty event for single (hashless) file in root', function(done) {
    
      fs.writeFileAsync('tmptest/testfile', 'hello world!')
        .then(() => {

          let hashlessEmitted = false
          let cachedEmitted = false

          let drive = createDrive(fixed01)
          drive.on('hashlessNonEmpty', () => {
            hashlessEmitted = true
            if (cachedEmitted) done()
          })
          drive.on('driveCached', () => {
            cachedEmitted = true
            if (hashlessEmitted) done()
          })

          drive.setRootpath(path.join(cwd, 'tmptest'))
        })
        .catch(e => done(e))
    })

    // FIXME this test case should be moved to protoMapTree
    it('should emit hashlessEmpty event for single (hashless) file in root, after hash update', function(done) {

      let hash = crypto.createHash('sha256')
      hash.update('hello world!')
      let digest = hash.digest('hex')

      fs.writeFileAsync('tmptest/testfile', 'hello world!')
        .then(() => {
          let drive = createDrive(fixed01)
          drive.on('hashlessEmpty', () => {
            expect(drive.hashless.size).to.equal(0)
            done()
          })
          drive.on('driveCached', () => {
            expect(drive.hashless.size).to.equal(1)
            drive.updateHashMagic(drive.root.children[0], digest, 'ASCII text, with no line terminators')
          })

          drive.setRootpath(path.join(cwd, 'tmptest'))
        })
        .catch(e => done(e))
    })
  })

  describe('test abspath', function() {

    beforeEach(function(done) {
      rimrafAsync('tmptest')
        .then(() => mkdirpAsync('tmptest'))
        .then(() => done())
        .catch(e => done(e))
    })

    it('should return absolute path of node', function(done) {      
      mkdirpAsync('tmptest/folder1')
        .then(() => {
          
          let drive = createDrive(fixed01)
          drive.on('driveCached', drv => {
            let root = drive.root
            expect(drive.abspath(root)).to.equal(path.join(cwd, 'tmptest'))
            let child = root.children[0]
            expect(drive.abspath(child)).to.equal(path.join(cwd, 'tmptest/folder1'))
            done()
          })

          drive.setRootpath(path.join(cwd, 'tmptest'))
        })
    })
  })

  describe('test createFolder', function() {

    let drive

    beforeEach(function(done) {
      rimrafAsync('tmptest')
        .then(() => mkdirpAsync('tmptest/folder1/folder3'))
        .then(() => mkdirpAsync('tmptest/folder2'))
        .then(() => {
          drive = createDrive(fixed01)
          drive.on('driveCached', drv => {
            done()
          })
          drive.setRootpath(path.join(cwd, 'tmptest'))
        })
        .catch(e => done(e))
    })

    afterEach(function() {
      drive = undefined
    })

    it('should create a folder in root folder with given owner', function(done) {

      drive.createFolder(uuid1, drive.root, 'hello', (err, node) => {

        expect(node.parent).to.equal(drive.root)
        expect(node.name).to.equal('hello')
        expect(node.writelist).to.be.undefined
        expect(node.readlist).to.be.undefined
        expect(node.owner).to.deep.equal([uuid1])

        xattr.get(path.join(cwd, 'tmptest', 'hello'), 'user.fruitmix', (err, attr) => {
          try { 
            let stamp = JSON.parse(attr)
            expect(stamp.owner).to.deep.equal([uuid1])
            expect(stamp.uuid).to.equal(node.uuid)
            expect(stamp.hasOwnProperty('writelist')).to.be.false
            expect(stamp.hasOwnProperty('readlist')).to.be.false
            done()
          }
          catch(e) {
            done(e)
          }
        })
      })
    }) 

    it('should create a folder in subfolder with given owner', function(done) {

      let folder1 = drive.root.children.find(c => c.name === 'folder1')
      
      drive.createFolder(uuid1, folder1, 'hello', (err, node) => {
        
        expect(node.parent).to.equal(folder1)
        expect(node.name).to.equal('hello')
        expect(node.writelist).to.be.undefined
        expect(node.readlist).to.be.undefined
        expect(node.owner).to.deep.equal([uuid1])

        xattr.get(path.join(cwd, 'tmptest', 'folder1', 'hello'), 'user.fruitmix', (err, attr) => {
          if (err) return done(err)
          try { // TODO use deep equal !
            let stamp = JSON.parse(attr)
            expect(stamp.owner).to.deep.equal([uuid1])
            expect(stamp.uuid).to.equal(node.uuid)
            expect(stamp.hasOwnProperty('writelist')).to.be.false
            expect(stamp.hasOwnProperty('readlist')).to.be.false
            done()
          }
          catch(e) {
            done(e)
          }
        })
      }) 
    })

    it('should return error if folder exists (in root)', function(done) {
      drive.createFolder(uuid1, drive.root, 'folder2', (err, node) => {
        expect(err).to.be.an('Error')
        done()
      })
    })

    it('should return error if folder exists (in subfolder)', function(done) {

      let folder1 = drive.root.children.find(c => c.name === 'folder1') 
      drive.createFolder(uuid1, folder1, 'folder3', (err, node) => {
        expect(err).to.be.an('Error')
        done()
      }) 
    })
  })

  describe('test import file', function() {
    
    let drive

    beforeEach(function(done) {
      rimrafAsync('tmptest')
        .then(() => mkdirpAsync('tmptest/driveroot/folder1'))
        .then(() => mkdirpAsync('tmptest/tmp'))
        .then(() => fs.writeFileAsync('tmptest/tmp/testfile', 'hello world'))
        .then(() => {
          drive = createDrive(fixed01)
          drive.on('driveCached', drv => {
            done()
          })
          drive.setRootpath(path.join(cwd, 'tmptest/driveroot'))
        })
        .catch(e => done(e))
    })

    afterEach(function() {
      drive = undefined
    })

    it('should import a new file into root folder', function(done) {
      let srcpath = path.join(cwd, 'tmptest/tmp/testfile')
      let dstpath = path.join(cwd, 'tmptest/driveroot/test')
      drive.importFile(uuid1, srcpath, drive.root, 'test', (err, node) => {
        expect(node.parent).to.equal(drive.root)
        expect(node.name).to.equal('test')
        expect(node.owner).to.deep.equal([uuid1])
        expect(node.hasOwnProperty('writelist')).to.be.false
        expect(node.hasOwnProperty('readlist')).to.be.false

        xattr.get(dstpath, 'user.fruitmix', (err, attr) => {
          if (err) return done(err)
          expect(JSON.parse(attr)).to.deep.equal({
            owner: [uuid1],
            uuid: node.uuid
          })
          done()
        })
      })
    })

    it('should import a new file into non-root folder', function(done) {
      let srcpath = path.join(cwd, 'tmptest/tmp/testfile')
      let dstpath = path.join(cwd, 'tmptest/driveroot/folder1/test')
      let folder1 = drive.root.children[0]
      drive.importFile(uuid1, srcpath, folder1, 'test', (err, node) => {
        expect(node.parent).to.equal(folder1)
        expect(node.name).to.equal('test')
        expect(node.owner).to.deep.equal([uuid1])
        expect(node.hasOwnProperty('writelist')).to.be.false
        expect(node.hasOwnProperty('readlist')).to.be.false

        xattr.get(dstpath, 'user.fruitmix', (err, attr) => {
          if (err) return done(err)
          expect(JSON.parse(attr)).to.deep.equal({
            owner: [uuid1],
            uuid: node.uuid
          })
          done()
        })
      })
    })
  })

  /* end of all groups */
})


