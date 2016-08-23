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
    .auth('9f93db43-02e6-4b26-8fae-7d6f51da12af', 'world')
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

  describe('test drives api', function() {
  
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
        let dir = paths.path('drives')
        await mkdirpAsync(path.join(dir, drv001UUID))
        await mkdirpAsync(path.join(dir, drv002UUID))
        
        // write model files
        dir = paths.path('models')
        let tmpdir = paths.path('tmp')
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

    it('GET /drives returns conf + runtime info', function(done) {
      request(app)
        .get('/drives')
        .set('Authorization', 'JWT ' + token)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function(err, res) {
          let arr = res.body
          // sort by label
          arr.sort(function(a, b) {
            return a.label.localeCompare(b.label)
          })

          let dir = paths.path('drives')
          let expected = [ 
            { 
              label: 'drv001',
              fixedOwner: true,
              URI: 'fruitmix',
              uuid: 'ceacf710-a414-4b95-be5e-748d73774fc4',
              owner: [ '9f93db43-02e6-4b26-8fae-7d6f51da12af' ],
              writelist: [],
              readlist: [],
              cache: true,
              rootpath: path.join(dir, drv001UUID),
              cacheState: 'CREATED',
              uuidMapSize: 1,
              hashMapSize: 0,
              hashlessSize: 0,
              sharesSize: 0 
            },
            { 
              label: 'drv002',
              fixedOwner: true,
              URI: 'fruitmix',
              uuid: '6586789e-4a2c-4159-b3da-903ae7f10c2a',
              owner: [ '9f93db43-02e6-4b26-8fae-7d6f51da12af' ],
              writelist: [],
              readlist: [],
              cache: true,
              rootpath: path.join(dir, drv002UUID),
              cacheState: 'CREATED',
              uuidMapSize: 1,
              hashMapSize: 0,
              hashlessSize: 0,
              sharesSize: 0 
            } 
          ]
          expect(arr).to.deep.equal(expected) 
          done()
        })
    })
  })
})
