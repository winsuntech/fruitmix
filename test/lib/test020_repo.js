import path from 'path'

import Promise from 'bluebird'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const { expect } = chai

import uuids from '../util/uuids'
import { rimrafAsync, mkdirpAsync, fs, xattr } from '../util/async'

import paths from '../../src/lib/paths'
import models from '../../src/models/models'
import { createUserModelAsync } from '../../src/models/userModel'
import { createDriveModelAsync } from '../../src/models/driveModel'
import { createRepo } from '../../src/lib/repo'

const cwd = process.cwd()

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

const prepare = async () => {

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
}

describe(path.basename(__filename), function() {

  describe('repo constructor', function() {

    beforeEach(function() {
      return prepare()
    })      
  
    it('should create a repo, with paths, driveModel, drive, and state properly set', function() {
      let driveModel = models.getModel('drive')
      let repo = createRepo(paths, driveModel)
      expect(repo.paths).to.equal(paths)
      expect(repo.driveModel).to.equal(driveModel)
      expect(repo.drives).to.be.an('array')
      expect(repo.drives.length).to.equal(0)
      expect(repo.initState).to.equal('IDLE')
    })
  })

  describe('repo init', function(done) {
    
    beforeEach(function() {
      return prepare()
    }) 

    it('should transit to INITIALIZING state then INITIALIZED, with two drives with correct uuid', function(done) {
      let driveModel = models.getModel('drive')
      let repo = createRepo(paths, driveModel)
      repo.init(() => {
        expect(repo.initState).to.equal('INITIALIZED')
        expect(repo.drives.length).to.equal(2)
        expect(repo.drives.map(drv => drv.uuid).sort()).to.deep.equal([drv002UUID, drv001UUID])
        done()
      })
      expect(repo.initState).to.equal('INITIALIZING')
    })
  })

  describe('stateless functions for repo', function() {

    describe('test scanSystemDrives (async)', function() {

      before(function(){
        return (async () => {
          await rimrafAsync('tmptest')
          await mkdirpAsync('tmptest')
        })()
      })     
    })
  })
})
