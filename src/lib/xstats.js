import fs from 'fs'

import xattr from 'fs-xattr'
import UUID from 'node-uuid'
import validator from 'validator'

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
    htime: -1 // epoch time value, i.e. dateObject.getTime()
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

// this function returns extended stats, 
// i.e, merged stats and extended attributes, with hash timestamp verified
async function readXstatsAsync(path, def) {

  let defVal = defaultXattrVal()
  if (def) 
    Object.assign(defVal, def)

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
}

function readXstats(path, callback) {

  readXstatsAsync(path)
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
  xattrGetOrDefault
}

export { 
  readTimeStampAsync,
  readXstats,
  readXstatsAsync,
  updateXattrPermissionAsync,
  updateXattrHashAsync,
  testing
}





















