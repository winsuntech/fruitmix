import path from 'path'

import Promise from 'bluebird'
import { expect } from 'chai'
import { rimrafAsync, mkdirpAsync, fs } from 'src/util/async'

import { createDocumentStore } from 'src/lib/documentStore'
import { createMediaShareStore } from 'src/lib/mediaShareStore'

describe(path.basename(__filename), function() {

  const cwd = process.cwd()
  const docroot = path.join(cwd, 'tmptest', 'documents')
  const msroot = path.join(cwd, 'tmptest', 'mediashare')
  const tmpdir = path.join(cwd, 'tmptest', 'tmp')

  const createDocumentStoreAsync = Promise.promisify(createDocumentStore)

  let docstore

  beforeEach(function() {
    return (async () => {
      await rimrafAsync(path.join(cwd, 'tmptest'))
      await mkdirpAsync(docroot)
      await mkdirpAsync(msroot)
      await mkdirpAsync(tmpdir)
      docstore = await createDocumentStoreAsync(docroot)
    })()
  })

  it('should create a mediashare store (nonsense example)', function() {
    let mstore = createMediaShareStore(msroot, tmpdir, docstore)
    expect(mstore.rootdir).to.equal(msroot) 
    expect(mstore.tmpdir).to.equal(tmpdir)
    expect(mstore.docstore).to.equal(docstore)
  })

  it('should store an object with uuid (no check yet)', function(done) {
    let share = {
      uuid: 'f889ec47-6092-4a6d-9647-3d6ef5fe2cab',
      x: 1,
      y: 2
    }
    let mstore = createMediaShareStore(msroot, tmpdir, docstore)
    mstore.store(share, err => {
      done()
    })
  })
})


