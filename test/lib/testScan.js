import path from 'path'

import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import xattr from 'fs-xattr'

import { scanDrivesAsync} from '../../src/lib/repo'

const cwd = process.cwd()

const uuid01 = '090100c4-0fd9-4582-9fad-86b9cddc66f6'

describe('testing scan drives', function() {

  before(function(done) {
    rimraf('tmptest', err => {
      if (err) return done(err)
      mkdirp('tmptest', err => {
        err ? done(err) : done()
      })
    })
  })

  it('should scan nothing if drives folder empty', function(done) {
    scanDrivesAsync(path.join(cwd, 'tmptest'))
      .then(r => console.log(r) || done())
      .catch(e => console.log(e) || done(e))
  })

  // not finished
  it('should scan one drive folder if xattr legal', function(done) {
    mkdirp('tmptest/drive01', err => {
      if (err) return done(err)
      xattr.set(path.join(cwd, 'tmptest', 'drive01'), 
        'user.fruitmix',
        JSON.stringify({
          uuid: uuid01,
          owner: [uuid01],
          writelist: [],
          readlist: [] 
        }),
        err => {
          if (err) return done(err)
          scanDrivesAsync(path.join(cwd, 'tmptest'))
            .then(r => console.log(r) || done())
            .catch(e => console.log(e) || done(e))
        })
    })
  })
})

