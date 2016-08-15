import path from 'path'

import Promise from 'bluebird'
import chai from 'chai'
import chaiAsPromised from "chai-as-promised"

import { rimrafAsync, mkdirpAsync, fs, xattr } from '../util/async'
import uuids from '../util/uuids'
import { scanDrivesAsync } from '../../src/lib/repo'

chai.use(chaiAsPromised)
const expect = chai.expect

const cwd = process.cwd()

describe('testing scan drives', function() {

  beforeEach(function() { 
    return (async () => { 
      await rimrafAsync('tmptest')
      await mkdirpAsync('tmptest')
    })()
  })

  it('should scan nothing if drives folder empty', function() {
    return expect(scanDrivesAsync(path.join(cwd, 'tmptest')))
      .to.eventually.deep.equal([])
  })

  // not finished
  it('should scan one drive folder if xattr legal', function() {

    let dpath = path.join(cwd, 'tmptest', 'drive01')
    let preset = JSON.stringify({
      uuid: uuids[0], 
      owner: [uuids[1]], 
      writelist:[], 
      readlist:[] 
    })

    return (async () => {
      await mkdirpAsync('tmptest/drive01')
      await xattr.setAsync(dpath, 'user.fruitmix', preset)
      let drives = await scanDrivesAsync(path.join(cwd, 'tmptest'))
      expect(drives.length).to.equal(1)
      throw new Error('need more assertion')
    })()
  })
})

