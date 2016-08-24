import path from 'path'

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

    before(function() {
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

    it('should build cache on simple folder hierarchy w/o xattr', function() {

      const named = (list, name) => {
        let l = list.find(l => l.name === name)
        if (!l) throw new Error('named item not found in list')
        return l
      }

      return mkdirpAsync('tmptest/folder1/folder2')
        .then(() => mkdirpAsync('tmptest/folder3'))
        .then(() => new Promise((resolve, reject) => {
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
            resolve(null)
          })
          drive.setRootpath(path.join(cwd, 'tmptest'))
        }))
    })
  })
})


