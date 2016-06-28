import fs from 'fs'

import xattr from 'fs-xattr'
import UUID from 'node-uuid'
import validator from 'validator'
import shallowequal from 'shallowequal'

function parseJSON(string) {

  let json
  try {
    json = JSON.parse(string) 
    return json
  }
  catch (e) {
    return
  }
}

function defaultXattrVal() {

  return {
    uuid: UUID.v4(),
    owner: null,
    writelist: null,
    readlist: null,
    hash: null,
    htime: -1 // epoch time value, i.e. Date object.getTime()
  }
}

// caution! validator validates string only
function validateXattr(attrs) {

  // TODO
  return true
}

// path must be absolute path, never reject
async function fsStatAsync(path) {
  return new Promise(resolve => {
    fs.stat(path, (err, stats) => {
      err ? resolve(err) : resolve(stats)
    }) 
  })
}

async function readTimeStampAsync(path) {

  let stats = await fsStatAsync(path)
  if (stats instanceof Error) return stats

  return stats.mtime.getTime()
}

async function xattrGetAsync(path, attr) {
  return new Promise(resolve => {
    xattr.get(path, attr, (err, val) => {
      err ? resolve(err) : resolve(val)
    })
  })
}

async function xattrSetAsync(path, attr, val) {
  return new Promise(resolve => {
    xattr.set(path, attr, val, err => {
      err ? resolve(err) : resolve(null)
    })
  })
}

async function xattrGetRawAsync(path, attr) {

  let val = await xattrGetAsync(path, attr)
  if (val instanceof Error) return val

  let parsed = parseJSON(val)
  return parsed
}

function xattrGetRaw(path, attr, callback) {

  xattrGetRawAsync(path, attr)
    .then(r => {
      if (r instanceof Error) callback(r)
      else callback(null, r)  
    })
    .catch(e => callback(e))
}

// get xattr, parsed, 
// defval: if provided, will be set if there is no valid xattr; 
// if not provided (undefined or null), won't try to set
async function xattrGetOrDefault(path, attr, defVal) {

  let defJsonVal = JSON.stringify(defVal)

  let val = await xattrGetAsync(path, attr)
  if (val instanceof Error) {

    if (!defVal) return val

    let err = await xattrSetAsync(path, attr, defJsonVal)
    if (err instanceof Error) return err
    return defVal
  }

  let parsed = parseJSON(val)
  if (parsed === undefined) {
    let err = await xattrSetAsync(path, attr, defJsonVal)
    if (err instanceof Error) return err
    return defVal
  }
  
  return parsed
}

//
// opts
//
// forceOwner: if exists, overwrite existing
// defaultOwner: 
// forcePermission: 
// defaultPermission:

// this function returns extended stats, 
// i.e, merged stats and extended attributes, with hash timestamp verified
async function readXstatAsync(path, opts) {

  let props = {
    uuid: UUID.v4(),
    owner: null,
    writelist: null,
    readlist: null,
    hash: null,
    htime: -1 // epoch time value, i.e. Date object.getTime()
  }

  let stats = await fsStatAsync(path)
  if (stats instanceof Error) return stats

  let attr = await xattrGetAsync(path, 'user.fruitmix')
  if (attr instanceof Error && attr.code !== 'ENODATA') return attr

  if (attr instanceof Error) { // ENODATA

    if (opts) {
      if (opts.forceOwner) props.owner = opts.forceOwner
      else if (opts.owner) props.owner = opts.owner

      if (opts.forceWritelist) props.writelist = opts.forceWritelist
      else if (opts.writelist) props.writelist = opts.writelist

      if (opts.forceReadlist) props.readlist = opts.forceReadlist
      else if (opts.readlist) props.readlist = opts.readlist
    }   

    await xattrSetAsync(path, 'user.fruitmix', JSON.stringify(props)) 
    return Object.assign(stats, props, { abspath: path})
  }

  // DANGER! FIXME
  attr = parseJSON(attr)

  if (opts && opts.forceOwner) props.owner = opts.forceOwner
  else if (opts && opts.owner && !attr.owner) props.owner = opts.owner
  else if (attr.owner) props.owner = attr.owner

  if (opts && opts.forceWritelist) props.writelist = opts.writelist
  else if (opts && opts.writelist && !attr.writelist) props.writelist = opts.writelist
  else if (attr.writelist) props.writelist = attr.writelist

  if (opts && opts.forceReadlist) props.readlist = opts.readlist
  else if (opts && opts.readlist && !attr.readlist) props.readlist= opts.readlist
  else if (attr.readlist) props.readlist = attr.readlist

  props.uuid = attr.uuid

  if (attr.htime === stats.mtime.getTime()) {
    props.hash = attr.hash
    props.htime = attr.htime
  }

  if (!shallowequal(props, attr)) {
    await xattrSetAsync(path, 'user.fruitmix', JSON.stringify(props))
  } 

  return Object.assign(stats, props, { abspath: path })

/*
  let defVal = defaultXattrVal()

  let stats = await fsStatAsync(path)
  if (stats instanceof Error) return stats

  let attr = await xattrGetOrDefault(path, 'user.fruitmix', defVal)
  if (attr instanceof Error) return attr

  // verify hash timestamp
  if (attr.htime !== stats.mtime.getTime()) {
     attr.hash = null 
  } 

  // remove htime
  delete attr.htime

  return Object.assign(stats, attr, {
    abspath: path
  })
*/
}

function readXstat(path, callback) {

  readXstatAsync(path)
    .then(r => (r instanceof Error) ? callback(r) : callback(null, r))
    .catch(e => callback(e))
}

async function updateXattrPermissionAsync(path, permission) {
  
  let defVal = defaultXattrVal()

  let attr = await xattrGetOrDefault(path, 'user.fruitmix', defVal) 
  if (attr instanceof Error) return attr

  let perm = {}
  if (permission.owner) perm.owner = permission.owner
  if (permission.readlist) perm.readlist = permission.readlist
  if (permission.writelist) perm.writelist = permission.writelist

  let newattr = Object.assign({}, attr, perm) 
  let err = await xattrSetAsync(path, 'user.fruitmix', JSON.stringify(newattr))
  return err
}

async function updateXattrHashAsync(path, hash, htime) {
  
  let defVal = defaultXattrVal()

  let stats = await fsStatAsync(path)
  if (stats instanceof Error) return stats

  if (stats.mtime.getTime() !== htime) {

    let e = new Error('htime outdated')
    e.code = 'ETIMESTAMP_OUTDATED'
    return e 
  }

  let attr = await xattrGetOrDefault(path, 'user.fruitmix', defVal)
  if (attr instanceof Error) return attr

  attr.hash = hash
  attr.htime = htime 

  return await xattrSetAsync(path, 'user.fruitmix', JSON.stringify(attr))
}

let testing = {
  xattrGetRaw,
  xattrGetRawAsync,
  xattrGetOrDefault
}

export { 
  readTimeStampAsync,
  readXstat,
  readXstatAsync,
  updateXattrPermissionAsync,
  updateXattrHashAsync,
  testing
}





















