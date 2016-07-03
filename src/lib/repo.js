import path from 'path'
import fs from 'fs'

import { readXstat2 } from './xstat'
import { mkdirpAsync, fsStatAsync, fsMkdirAsync, mapXstatToObject } from './tools'
import { createProtoMapTree } from './protoMapTree'

class Repo {

  constructor(rootpath) {

    this.rootpath = rootpath
    this.drives = []
    this.libraries = []
  }

  prepend() {
    return path.resolve(this.rootpath, '..')
  }

  driveDirPath() {
    return path.join(this.rootpath, 'drive')
  }

  libraryDirPath() {
    return path.join(this.rootpath, 'library')
  }

  scanDrives(callback) {
    fs.readdir(this.driveDirPath(), (err, entries) => {
      if (err) callback(err)
      if (entries.length === 0) return callback(null)      
      let count = entries.length
      entries.forEach(entry => {
        createProtoMapTree(path.join(this.driveDirPath(), entry), 'drive', (err, tree) => {
          if (!err) this.drives.push(tree)
          if (!--count) callback()
        })
      })      
    }) 
  } 

  scanLibraries(callback) {
    fs.readdir(this.libraryDirPath(), (err, entries) => {
      if (err) callback(err)
      if (entries.length === 0) return callback(null)
      let count = entries.length
      entries.forEach(entry => {
        createProtoMapTree(path.join(this.libraryDirPath(), entry), 'library', (err, tree) => {
          if (!err) this.libraries.push(tree)
          if (!--count) callback()
        })
      })
    })
  }

  scan(callback) {
    let count = 2
    this.scanDrives(() => !--count && callback())
    this.scanLibraries(() => !--count && callback())
  }

  abspath(node) {
    let arr = node.nodepath().map(n => n.attribute.name)
    arr.unshift(this.prepend) // unshift returns array length, can't be chained
    return path.join(...arr)
  } 

  abspathUUID(uuid) {
    let node = this.tree.uuidMap.get(uuid)
    if (!node) return null
    return this.abspath(node) 
  }

  createDrive(userUUID, callback) {
  
    let dirpath = path.join(this.driveDirPath(), userUUID)
    fs.mkdir(dirpath, err => {

      if (err) return callback(err)
      let perm = {
        owner: [userUUID],
        writelist: [],
        readlist: []
      }

      readXstat2(dirpath, perm, (err, xstat) => {
        if (err) return callback(err)

        createProtoMapTree(dirpath, 'drive', (err, tree) => {
          if (err) return callback(err)
          this.drives.push(tree)
          callback(null, tree)    
        }) 
      })
    })
  } 
   
  createLibrary(userUUID, libraryUUID, callback) {
    
    let dirpath = path.join(this.libraryDirPath, libraryUUID)
    fs.mkdir(dirpath, err => {
      if (err) return callback(err)

      let perm = {
        owner: [userUUID],
        writelist: [],
        readlist: []
      }

      readXstat2(dirpath, perm, (err, xstat) => {
        if (err) return callback(err)

        createProtoMapTree(dirpath, 'library', (err, tree) => { 
          if (err) return callback(err)
          this.libraries.push(tree)
          callback(null, tree)
        })
      })
    })
  }

  // import, actually
  createDriveFile(userUUID, extpath, targetDirUUID, filename) {

    let node = this.drives.find(drv => {
      drv.tree.uuidMap.get(targetDirUUID)
    }) 

    
  }

  createDriveFolder(userUUID, folderName, targetDirUUID) {

  }  

  createLibraryFile(userUUID, extpath, targetLibraryUUID) {

  } 

  /** read **/  

  /** update **/

  renameDriveFileOrFilder(uuid, newName) {

  } 

  // overwrite
  updateDriveFile(extpath, targetDirUUID, filename) {

  }

  /** delete **/
  deleteDriveFolder(folderUUID) {
    
  }

  printTree(keys) {

    let queue = []
    if (!this.tree) return console.log('no tree attached')

    this.tree.root.preVisit(node => {

      let obj = {
        parent: node.parent === null ? null : node.parent.uuid,
        parentName: node.parent === null ? null : node.parent.attribute.name,
        children: node.children.map(n => n.uuid),
        childrenName: node.children.map(n => n.attribute.name)
      }
       
      queue.push(obj)
    })
    console.log(queue)
  }
}

async function createRepoAsync(rootpath) {

  mkdirpAsync(path.join(rootpath, 'drive'))
  mkdirpAsync(path.join(rootpath, 'library'))
  return new Repo(rootpath)
}

function createRepo(rootpath, callback) {  

  createRepoAsync(rootpath)
    .then(repo => callback(null, repo))
    .catch(e => callback(e))
}

export { createRepo }

