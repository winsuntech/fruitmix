import path from 'path'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)
const { expect } = chai

import uuids from '../util/uuids'
import { rimrafAsync, mkdirpAsync, fs, xattr } from '../util/async'

import { testing } from '../../src/lib/repo'

const { scanSystemDrivesAsync } = testing


const cwd = process.cwd()

describe('stateless functions for repo', function() {

  describe('test scanSystemDrives (async)', function() {

    before(function(){
      return (async () => {
        await rimrafAsync('tmptest')
        await mkdirpAsync('tmptest')
      })()
    })     

    it('should return empty array if drives dir empty', function() {
      return expect(scanSystemDrivesAsync(path.join(cwd, 'tmptest'))).to.eventually.deep.equal([])
    })

    it('should return one valid xstat', function() {

      let preset = {
        uuid: uuids[0],
        owner: [uuids[1]],
        writelist: [uuids[2]],
        readlist: [] 
      }

      return (async () => {

        await mkdirpAsync('tmptest/hello') 
        await xattr.setAsync('tmptest/hello', 'user.fruitmix', JSON.stringify(preset))

        let xstats = await scanSystemDrivesAsync(path.join(cwd, 'tmptest'))
        
        expect(xstats).to.be.an('array')
        expect(xstats.length).to.equal(1)
        
        let x = xstats[0]
        expect(x.uuid).to.equal(preset.uuid)
        expect(x.owner).to.deep.equal(preset.owner)
        expect(x.writelist).to.deep.equal(preset.writelist)
        expect(x.readlist).to.deep.equal(preset.readlist)

      })()
    })
  })
})
