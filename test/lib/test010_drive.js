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
  uuid: uuids[0],
  owner: [uuids[1]],
  writelist: [],
  readlist: []
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

      let { uuid, owner, writelist, readlist } = fixed01
      let drv = createDrive(uuid, owner, writelist, readlist, true)
      expect(drv.proto.owner).to.deep.equal(owner)
      expect(drv.fixedOwner).to.be.true
      expectInitialState(drv, uuid)
    })

    it('proto should have no owner for variable owner, with w/r list undefined', function() {

      let { uuid, owner, writelist, readlist } = fixed01
      let drv = createDrive(uuid, owner, writelist, readlist, false)
      expect(drv.proto.owner).to.deep.equal([])
      expect(drv.fixedOwner).to.be.false
      expectInitialState(drv, uuid)
    })
  })

  describe('test memtree for drive', function() {

    let { uuid, owner, writelist, readlist } = fixed01

    before(function() {
      return (async () => {
        await rimrafAsync('tmptest')
        await mkdirpAsync('tmptest')
      })()
    })

    it('should build memtree on empty folder', function() {

      let expected = { uuid, owner, writelist, readlist, type: 'folder' }
      let drive = createDrive(uuid, owner, writelist, readlist, true)
      drive.setRootpath('tmptest')
      
      return (async () => {
        await drive.buildMemTreeAsync()
        expect(drive.memtreeState).to.equal('CREATED')
        expect(drive.uuidMap.size).to.equal(1)
        expect(drive.root.uuid).to.deep.equal(expected.uuid)
        expect(drive.root.type).to.equal('folder')
        expect(drive.root.owner).to.deep.equal(expected.owner)
        expect(drive.root.writelist).to.deep.equal(expected.writelist)
        expect(drive.root.readlist).to.deep.equal(expected.readlist)
      })()
    })

    it('should build memtree on single folder w/o xattr', function() {
      
      return (async () => {
        await mkdirpAsync('tmptest/folder1/folder3')
        await mkdirpAsync('tmptest/folder2')

        let drive = createDrive(uuid, owner, writelist, readlist, true)
        drive.setRootpath('tmptest')
        drive.on('nodeCreated', node => console.log(node))
        await drive.buildMemTreeAsync()
       
        // FIXME 
        expect(drive.uuidMap.size).to.equal(2)
      })()
    })
  })
})


