import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'

import { expect } from 'chai'
import UUID from 'node-uuid'
import validator from 'validator'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import xattr from 'fs-xattr'

import { createDrive } from '../../src/lib/drive'

const uuid1 = 'c0765cd5-acd1-4b53-bb17-7834ebdca6c1' 
const uuid2 = 'd7114148-e2bd-42f8-88f9-a980a1a4d29c' 

const rimrafAsync = Promise.promisify(rimraf)
const mkdirpAsync = Promise.promisify(mkdirp)
const createDriveAsync = Promise.promisify(createDrive)

Promise.promisifyAll(xattr)

const cwd = process.cwd()
const FRUITMIX = 'user.fruitmix'
const preset1 = JSON.stringify({
    uuid:uuid1,
    owner:[uuid2],
    writelist: [],
    readlist:[]
  })

describe('test create Drive', function() {
  
  beforeEach(function(done) {
    rimrafAsync('tmptest')
      .then(() => mkdirpAsync('tmptest'))    
      .then(() => done())
      .catch(e => done(e))
  })

  it('should create a drive', function(done) {
    xattr.setAsync('tmptest', FRUITMIX, preset1)
      .then(() => createDriveAsync(path.join(cwd, 'tmptest')))
      .then(drive => {
        expect(drive.root.uuid).to.equal(uuid1)
        expect(drive.root.owner).to.deep.equal([uuid2])
        expect(drive.root.writelist).to.deep.equal([])
        expect(drive.root.readlist).to.deep.equal([])
        expect(drive.rootpath).to.equal(path.join(cwd, 'tmptest')) 
        // throw new Error('need more expects, perhaps') // TODO
        done()
      })
      .catch(e => done(e))
  })
})

describe('test drive scan', function() {

  let drive

  beforeEach(function(done) {
    rimrafAsync('tmptest')
      .then(() => mkdirpAsync('tmptest'))    
      .then(() => xattr.setAsync('tmptest', FRUITMIX, preset1))
      .then(() => createDriveAsync(path.join(cwd, 'tmptest')))
      .then(drv => { drive = drv; done() })
      .catch(e => done(e))
  })

  it('should scan one new folder', function(done) {
    mkdirp('tmptest/folder1', err => {
      drive.scan(() => {

        let children = drive.root.getChildren()
        expect(children.length).to.equal(1)

        let c0 = children[0]
        expect(validator.isUUID(c0.uuid)).to.be.true
        expect(c0.type).to.equal('folder')
        expect(c0.owner).to.deep.equal([])        
        expect(c0.name).to.equal('folder1')
        expect(c0.parent.uuid).to.equal(uuid1)
        done()
      })      
    })
  })

  it('should scan one new file', function(done) {
    fs.writeFile('tmptest/file1', 'hello', err => {
      drive.scan(() => {
      
        let children = drive.root.getChildren()
        expect(children.length).to.equal(1)

        let c0 = children[0]
        expect(validator.isUUID(c0.uuid)).to.be.true
        expect(c0.type).to.equal('file')
        expect(c0.owner).to.deep.equal([])
        expect(c0.name).to.equal('file1')
        expect(c0.size).to.equal(5)
        expect(c0.parent.uuid).to.equal(uuid1)
        done()
      })
    })
  })
})




