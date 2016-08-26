import path from 'path'
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
    // console.log('repo driveCached')
    count++
    // console.log('count: ' + count)
    // console.log('repo drives length: ' + repo.drives.length)
    if (count === repo.drives.length) callback(null)
  })
  repo.init(e => {
    // console.log('repo initialized')
    if (e) callback(e)
    else callback(null, repo)
  })
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

    it('POST /files should create a folder', function(done) {
      request(app)
        .post('/files')
        .set('Authorization', 'JWT ' + token)
        .set('Accept', 'applicatoin/json')
        .send({ target: drv001UUID, name: 'hello' }) 
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

    it('POST /files (multipart) should create a file', function(done) {
      request(app)
        .post('/files') 
        .set('Authorization', 'JWT ' + token)
        .set('Accept', 'application/json')
        .field('target', drv001UUID)
        .attach('file', 'graph.png')
        .field('size', 7744)
        .field('digest', '7a44a28d1da4e2b99eda6060aab85168fe9d09fa7f91831f9ef7c137cdca5751')
        .end((err, res) => {
          console.log(res.body)
          if (err) return done(err)
          done()
        })
    })

  })
})
