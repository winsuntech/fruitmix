import fs from 'fs'

import rimraf from 'rimraf'
import mkdirp from 'mkdirp'

export async function rimrafAsync(dirpath) {
  return new Promise(resolve => 
    rimraf(dirpath, err => 
      err ? resolve(err) : resolve(null)))
}

export async function mkdirpAsync(dirpath) {
  return new Promise(resolve => 
    mkdirp(dirpath, err => 
      err ? resolve(err) : resolve(null)))
}

export async function fsReaddirAsync(dirpath) {
  return new Promise(resolve => 
    fs.readdir(dirpath, (err, files) => 
      err ? resolve(err) : resolve(files)))
}

export const mapXstatToObject = (xstat) => {

/* example xstat, xstat instanceof fs.stat
{ dev: 2049,
  mode: 16893,
  nlink: 2,
  uid: 1000,
  gid: 1000,
  rdev: 0,
  blksize: 4096,
  ino: 135577,
  size: 4096,
  blocks: 16,
  atime: 2016-06-27T06:36:58.382Z,
  mtime: 2016-06-27T06:36:58.382Z,
  ctime: 2016-06-27T06:36:58.382Z,
  birthtime: 2016-06-27T06:36:58.382Z,
  uuid: '0924c387-f1c6-4a35-a5db-ae4b7568d5de',
  owner: [ '061a954c-c52a-4aa2-8702-7bc84c72ec84' ],
  writelist: [ '9e7b40bf-f931-4292-8870-9e62b9d5a12c' ],
  readlist: [ 'b7ed9abc-01d3-41f0-80eb-361498025e56' ],
  hash: null,
  abspath: '/home/xenial/Projects/fruitmix/tmptest' } */

  // not very safe TODO
  let name = xstat.abspath.split('/').pop()
  
  let type
  if (xstat.isDirectory()) type = 'folder'
  else if (xstat.isFile()) type = 'file'
  else throw new Error('Only xstat with type of folder or file can be mapped')

  return {
    uuid: xstat.uuid,
    type: type,
    permission: {
      owner: xstat.owner ? xstat.owner[0] : null,
      writelist: xstat.writelist,
      readlist: xstat.readlist,
    },
    attribute: {
      changetime: xstat.ctime,
      modifytime: xstat.mtime,
      createtime: xstat.birthtime,
      size: xstat.size,
      name: name,     
    },
    hash: xstat.hash,
    path: null, // TODO to be removed
    detail: null, // TODO to be removed 
  }
}


