import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'

import { expect } from 'chai'
import UUID from 'node-uuid'
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

let cwd = process.cwd()

describe('test create Drive', function() {
  
  beforeEach(function(done) {

    rimrafAsync('tmptest')
      .then(() => mkdirpAsync('tmptest'))    
      .then(() => done())
      .catch(e => done(e))
  })

  it('should create a drive', function(done) {

    xattr.setAsync('tmptest', 'user.fruitmix', JSON.stringify({
        uuid: uuid1, 
        owner: [uuid2],
        writelist: [],
        readlist: [],   
      }))
      .then(() => createDriveAsync(path.join(cwd, 'tmptest')))
      .then(drive => {
        expect(drive.root.uuid).to.equal(uuid1)
        expect(drive.root.owner).to.deep.equal([uuid2])
        expect(drive.root.writelist).to.deep.equal([])
        expect(drive.root.readlist).to.deep.equal([])
        expect(drive.rootpath).to.equal(path.join(cwd, 'tmptest')) 
        // throw new Error('need more expects, perhaps')
        done()
      })
      .catch(e => done(e))
  })
})

