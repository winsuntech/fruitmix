import path from 'path'
import fs from 'fs'

import { writeFileToDisk } from './util'

class MediaShareStore {

  constructor(msroot, tmpdir, docstore) {
    this.rootdir = msroot
    this.tmpdir = tmpdir
    this.docstore = docstore
  }

  store(mshare, callback) {
    let uuid = mshare.uuid
    this.docstore.store(mshare, (err, digest) => {
      if (err) return callback(err)
      let tmppath = path.join(this.tmpdir, uuid) 
      let dstpath = path.join(this.rootdir, uuid)
      writeFileToDisk(tmppath, digest, err => {
        if (err) return callback(err)
        fs.rename(tmppath, dstpath, err => {
          if (err) return callback(err)
          callback(null)
        })
      })
    }) 
  }

  retrieve(uuid, callback) {
    let srcpath = path.join(this.rootdir, uuid)
    fs.readFile(srcpath, (err, data) => {
      if (err) return callback(err)  
      try {
        let obj = JSON.parse(data.toString())
        callback(null, obj)
      }
      catch (e) {
        callback(e)
      }
    })
  }

  retrieveAll(callback) {

    fs.readdir(this.rootdir, (err, entries) => {
      if (err) return callback(err)

      let count = entries.length
      if (!count) return callback(null, [])

      let result = []
      entries.forEach(entry => {
        this.retrieve(entry, (err, obj) => {
          if (!err) result.push(obj)
          if (!--count) callback(null, result)
        })
      })
    })
  }
}

const createMediaShareStore = (msroot, tmpdir, docstore) =>
  new MediaShareStore(msroot, tmpdir, docstore)

export { createMediaShareStore }

