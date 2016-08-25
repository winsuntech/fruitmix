import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { Router } from 'express'

import Busboy from 'busboy'
import UUID from 'node-uuid'
import validator from 'validator'

import auth from '../middleware/auth'
import Models from '../models/models'

const router = Router()

const logE = (err, log) => ({
  errno: err.errno,
  code: err.code,
  message: err.message,
  log
})

let uploader = (req, res, next) => {

  if (!req.is('multipart/form-data')) return next()

  const hash = crypto.createHash('sha256')
  let repo = Models.getModel('repo')

  let abort = false
  let busboyFinished = false
  let ostreamFinished = false

  let target        // must be provided before file event
  let filename      // parsed from file event
  let c_size        // must be provided, can be after file transfer
  let c_digest      // must be provided, can be after file transfer

  let size = 0, digest  // calculated value
  let ostream
  let tmpdir, tmppath
  
  var busboy = new Busboy({ headers: req.headers });

  const finalize = () => {

    console.log('finalizing')

    if (!c_size) {
      return res.status(500).json(logE({}, `size must be provided`))
    }

    if (!c_digest) {
      return res.status(500).json(logE({}, `digest must be provided`))
    }

    if (c_size !== size) {
      return res.status(500).json(logE({}, `size mismatch, client claimed: ${c_size}, server received: ${size}`)) 
    }

    if (c_size !== ostream.bytesWritten) {
      return res.status(500).json(logE({}, `size mismatch, client claimed and received: ${c_size}, actually written to file: ${ostream.bytesWritten}`))
    }

    if (c_digest !== digest) {
      return res.status(500).json(logE({}, `digest mismatch, client claimed: ${c_digest}, server calculated: ${digest}`))
    }

    // now the tmp files is in tmppath and everthing is fine (except filename not checked)
    repo.createFileInDrive(req.user.uuid, tmppath, target, filename, (err, node) => {
      res.status(200).json({ hello: 'world' })
    })

    console.log('====')
    console.log(target)
    console.log(filename)
    console.log(size)
    console.log(digest)
    console.log('====')
  }

  busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {

    console.log(`fieldname: ${fieldname}, val: ${val}`)

    switch (fieldname) {
      case 'target':
        target = val
        if (!validator.isUUID(target)) {
          abort = true
          console.log('not uuid, abort')
          return res.status(200).json(logE({}, 'target must be uuid'))
        }

        let node = repo.findNodeByUUID(target)
        if (!node) {
          abort = true
          return res.status(500).json(logE({}, 'target uuid not found'))
        }
        else if (node.type !== 'folder') {
          abort = true
          return res.status(500).json(logE({}, 'target uuid is not a folder'))
        }
        tmpdir = repo.getTmpDirForDrive(node.tree)
        break

      case 'size':
        c_size = parseInt(val)
        break

      case 'digest':
        c_digest = val
        break

      default:
        break
    }
  })

  busboy.on('file', (fieldname, istream, _filename, encoding, contentType) => {

    if (abort) return

    filename = _filename

    console.log(target)
    console.log(filename)

    if (!target) {
      abort = true
      return res.status(500).json(logE({}, 'target must be set before file'))
    }

    tmppath = path.join(tmpdir, UUID.v4())
    console.log(tmppath)
    ostream = fs.createWriteStream(tmppath)

    istream.on('data', data => {
      console.log('istream data')
      if (abort) return
      size += data.length
      hash.update(data)
      ostream.write(data)
    }) 

    istream.on('error', err => {
      console.log('istreamm error')
      if (abort) return
      abort = true
      res.status(500).json(logE(err, 'read stream error'))
    })

    // input stream end
    istream.on('end', () => {
      console.log('istream end')
      if (abort) return
      digest = hash.digest('hex')
      ostream.end()
    })

    // output stream end (this event occurs after finish)
    ostream.on('close', () => { 

      console.log('ostream finished')

      if (abort) return
      ostreamFinished = true
      if (!busboyFinished) return
      finalize()
    })

    ostream.on('error', err => {
      if (abort) return
      abort = true
      res.status(500).json(logE(err, 'write stream error'))
    })
  })

  busboy.on('finish', () => {

    console.log('busboy finished')

    if (abort) return
    busboyFinished = true
    if (!ostreamFinished) return
    finalize()
  })

  busboy.on('error', err => {

    console.log('busboy error')

    if (abort) return
    abort = true
    res.status(500).json(logE(err, 'busboy error'))
  })

  req.on('close', () => {
    if (ostream) ostream.end() 
  })

  req.pipe(busboy)
}

router.get('/', auth.jwt(), (req, res) => {
  res.status(500).end()
})

router.post('/', auth.jwt(), uploader, (req, res) => {

  let { target, name } = req.body
  // do check TODO

  let repo = Models.getModel('repo')
  repo.createFolder(req.user.uuid, name, target, (err, node) => {
    
    // must be translate manually, since some props may be missing due to fly weight pattern
    let obj = {
      uuid: node.uuid,
      type: node.type,
      owner: node.owner,
      writelist: node.writelist,
      readlist: node.readlist,
      name: node.name
    }
    
    err ? res.status(500).end() : res.status(200).json(obj)
  })
})

export default router
