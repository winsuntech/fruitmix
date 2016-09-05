import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

import UUID from 'node-uuid'
import xattr from 'fs-xattr'
import canonicalize from 'canonical-json'
import paths from './paths'

// each media share has an uuid with a digest number
// it is stored in an append-only file (as creator)

// path:  document/objects
//        document/refs
//        document/recycle

class DocumentPool { 

  constructor(documentDir, tmpDir) {
    this.documentDir = documentDir
    this.tmpDir = tmpDir
  }

  objectDir() {
    return path.join(this.documentDir, 'objects')
  }

  refDir() {
    return path.join(this.documentDir, 'refs')
  }

  recycleDir() {
    return path.join(this.documentDir, 'recycle')
  }

  // store an object into pool
  store(object, callback) {

    let text, hash, digest, dirpath, filepath
    let error

    try {
      text = canonicalize(object) 
    }
    catch (e) {
      process.nextTick(() => callback(e))
    }

    // hash digest
    hash = crypto.createHash('sha256')
    hash.update(text)
    digest = hash.digest().toString('hex')

    // assemble path
    dirpath = path.join(this.objectDir(), digest.slice(0, 2))
    filepath = path.join(dirpath, digest.slice(2))
   
    mkdirp(dirpath, err => { 

      if (err) return callback(err)

      let error
      
      // write to file
      let os = fs.createWriteStream(filepath)
      os.write(text).end()

      os.on('error', e => error = e)
      os.on('close', () => error ? callback(error) : callback(null, digest))
    }
  }

  // retrieve a document from pool
  retrieve(digest, callback) {

    if (/[0-9a-f]/.test(digest) === false)
      process.nextTick(() => callback(new TypeError('invalid digest'))

    let dirpath = path.join(this.objectDir(), digest.slice(0,2))
    let filepath = path.join(dirpath, digest.slice(2))

    fs.readFile(filepath, (err, data) => {

      if (err) return callback(err)
      try {
        let object = JSON.parse(data)   
        return callback(null, object)
      }
      catch (e) {
        return callback(e)
      }
    }) 
  }

  createHead(digest, callback) {

    if (/[0-9a-f]/.test(digest) === false)
      process.nextTick(() => callback(new TypeError('invalid digest'))
    
    let dirpath = path.join(this.refDir(), digest.slice(0,2)) 
    let filepath = path.join(dirpath, digest.slice(2))

    mkdirp(dirpath, err => {

      if (err) return callback(err)

      let error, uuid = UUID.v4() 
      let os = fs.createWriteStream(filepath)            
      os.write(uuid).end()

      os.on('error', e => error = e)
      os.on('close', () => error ? callback(err) : callback(null, uuid))
    })
  }

  // input: object
  // return uuid or uuid
  createNewDoc(object, callback) {
    this.store(object, (err, digest) => {
      if (err) return callback(err) 
      createHead(digest, (err, uuid) => 
        err ? callback(err) : callback(null, uuid))
    })
  }

  // input uuid & object
  // return err or null
  updateDoc(uuid, newObj, callback) {
    this.store(newObj, (err, digest) => {
      if (err) return callback(err)
      updateHead(uuid, digest, err => 
        err ? callback(err) : callback(null))
    })
  }

  // remove uuid (HEAD)
  deleteDoc(uuid, callback) {
    // todo this.
  }
}

export default 

