import path from 'path'
import crypto from 'crypto'

import Promise from 'bluebird'

import { expect } from 'chai'

import app from 'src/app'
import paths from 'src/lib/paths'
import models from 'src/models/models'
import { createUserModelAsync } from 'src/models/userModel'
import { createDriveModelAsync } from 'src/models/driveModel'
import { createRepo } from 'src/lib/repo'

import request from 'supertest'
import { mkdirpAsync, rimrafAsync, fs } from 'test/util/async'

import validator from 'validator'

let userUUID = '9f93db43-02e6-4b26-8fae-7d6f51da12af'
let drv001UUID = 'ceacf710-a414-4b95-be5e-748d73774fc4'  
let drv002UUID = '6586789e-4a2c-4159-b3da-903ae7f10c2a' 

let users = [
  {
    uuid: userUUID,
    username: 'hello',
    password: '$2a$10$0kJAT..tF9IihAc6GZfKleZQYBGBHSovhZp5d/DiStQUjpSMnz8CC',
    avatar: null,
    email: null,
    isFirstUser: true,
    isAdmin: true,
    home: drv001UUID,
    library: drv002UUID
  }
]

let drives = [
  {
    label: 'drv001',
    fixedOwner: true,
    URI: 'fruitmix',
    uuid: drv001UUID,
    owner: [ userUUID ],
    writelist: [],
    readlist: [],
    cache: true
  },
  {
    label: 'drv002',
    fixedOwner: true,
    URI: 'fruitmix',
    uuid: drv002UUID,
    owner: [ userUUID ],
    writelist: [],
    readlist: [],
    cache: true
  }
]

const requestToken = (callback) => {

  request(app)
    .get('/token')
    .auth(userUUID, 'world')
    .set('Accept', 'application/json')
    .end((err, res) => err ? callback(err) : callback(null, res.body.token))
}

const requestTokenAsync = Promise.promisify(requestToken)

const createRepoCached = (paths, model, callback) => {
  
  let count = 0
  let repo = createRepo(paths, model) 
  repo.on('driveCached', drv => {
    count++
    if (count === repo.drives.length) callback(null)
  })
  repo.init(e => {
    if (e) callback(e)
    else callback(null, repo)
  })
}

const prepare = async () => {
}

const createRepoCachedAsync = Promise.promisify(createRepoCached)

describe(path.basename(__filename) + ': test repo', function() {

  describe('test files api', function() {
  
    let token
    let cwd = process.cwd()

    beforeEach(function() {
      return (async () => {

        // make test dir
        await rimrafAsync('tmptest')
        await mkdirpAsync('tmptest')

        // set path root
        await paths.setRootAsync(path.join(cwd, 'tmptest'))

        // fake drive dir
        let dir = paths.get('drives')
        await mkdirpAsync(path.join(dir, drv001UUID))
        await mkdirpAsync(path.join(dir, drv002UUID))
        
        // write model files
        dir = paths.get('models')
        let tmpdir = paths.get('tmp')
        await fs.writeFileAsync(path.join(dir, 'users.json'), JSON.stringify(users, null, '  '))
        await fs.writeFileAsync(path.join(dir, 'drives.json'), JSON.stringify(drives, null, '  '))

        // create models
        let umod = await createUserModelAsync(path.join(dir, 'users.json'), tmpdir)
        let dmod = await createDriveModelAsync(path.join(dir, 'drives.json'), tmpdir)

        // set models
        models.setModel('user', umod)
        models.setModel('drive', dmod)

        // create repo and wait until drives cached
        let repo = await createRepoCachedAsync(paths, dmod)
        models.setModel('repo', repo)

        // request a token for later use
        token = await requestTokenAsync()
        // console.log(token)
      })()     
    })

    it('owner GET home should return emtpy array', function(done) {
    
      request(app)
        .get(`/files/${drv001UUID}`)
        .set('Authorization', 'JWT ' + token)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)
          console.log(res.body)
          done()
        })
    })

    it('POST /files/[drv001UUID] should create a folder', function(done) {
      request(app)
        .post(`/files/${drv001UUID}`)
        .set('Authorization', 'JWT ' + token)
        .set('Accept', 'applicatoin/json')
        .send({ name: 'hello' }) 
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)
          
          let { uuid, type, name, owner } = res.body
          expect(uuid).to.be.a('string')
          expect(validator.isUUID(uuid)).to.be.true
          expect(type).to.equal('folder')
          expect(name).to.equal('hello') 
          expect(owner).to.deep.equal([userUUID])

          // from the view point of blackbox test, the following is not necessary
          // even if such structural info should be verified, using REST api to do it
          let repo = models.getModel('repo')
          let drv = repo.drives.find(drv => drv.uuid === drv001UUID)
          let list = drv.print(drv001UUID) 
          expect(list.find(node => node.uuid === uuid && node.parent === drv001UUID)).to.be.an('object')
          done()
        }) 
    })

    it('POST /files/[drv001UUID] with a file should return a file object', function(done) {

      /**
      {
        uuid: '836f1f64-c09f-478d-a714-536e80bba482',
        type: 'file',
        name: 'tmpbuf.jpg',
        owner: [ '9f93db43-02e6-4b26-8fae-7d6f51da12af' ],
        size: 8,
        mtime: 1473439008996,
        parent: 'ceacf710-a414-4b95-be5e-748d73774fc4',
      }
      **/

      let buf = Buffer.from('0123456789ABCDEF', 'hex')
      let hash = crypto.createHash('sha256')
      hash.update(buf)
      let sha256 = hash.digest().toString('hex')

      fs.writeFileSync('tmptest/tmpbuf.jpg', buf)
      request(app)
        .post(`/files/${drv001UUID}`)
        .set('Authorization', 'JWT ' + token)
        .set('Accept', 'applicatoin/json')
        .attach('file', 'tmptest/tmpbuf.jpg')
        .field('sha256', sha256)
        .end((err, res) => {
          if (err) return done(err)
          let obj = res.body
          expect(obj.uuid).to.be.a('string')
          expect(validator.isUUID(obj.uuid)).to.be.true
          expect(obj.type).to.equal('file')
          expect(obj.name).to.equal('tmpbuf.jpg')
          expect(obj.owner).to.deep.equal([userUUID])
          expect(obj.writelist).to.be.undefined
          expect(obj.readlist).to.be.undefined
          expect(obj.size).to.equal(8)
          expect(Number.isInteger(obj.mtime)).to.be.true
          expect(obj.parent).to.equal(drv001UUID)
          done()
        })
    })
  })
})
