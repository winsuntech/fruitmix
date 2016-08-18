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
  })
})
