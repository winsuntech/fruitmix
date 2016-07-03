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

   

  async scanDriveAsync() {
    
    mkdirpAsync(this.driveDirPath())

    let entries = fsReaddirAsync(this.driveDirPath())
    if (entries instanceof Error) return entries

    // only uuid
    entries = entries.filter(ent => validator.isUUID(ent))    

    // let tree = createProtoMapTree(
  }

  scan(callback) {
    // traverse and build 

    
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
