import path from 'path'


import { readXstatAsync } from './xstat'
import { fsStatAsync, fsMkdirAsync } from './tools'

class Repo {

  constructor(rootpath, tree) {

    this.rootpath = rootpath
    this.tree = tree
    this.prepend = path.resolve(rootpath, '..')
    this.driveDirNode = tree.root.children.find(node => node.attribute.name === 'drive')
    if (!this.driveDirNode) throw new Error('tree root has no drive dir node')

    this.libraryDirNode = tree.root.children.find(node => node.attribute.name === 'library')
    if (!this.libraryDirNode) throw new Error('tree root has no library dir node')
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

  /** create **/

  async createDriveAsync(userUUID)  { 

    let dirpath = path.join(this.abspath(this.driveDirNode), userUUID)
    let err =  await fsMkdirAsync(dirpath)
    if (err instanceof Error) return err

    let xstat = await readXstatAsync(dirpath, {
      forceOwner: [userUUID],
      forceWritelist: [],
      forceReadlist: []
    })   
  }

  createDrive(userUUID, callback) {
    this.createDriveAsync(userUUID)
      .then(r => callback(r))
      .catch(e => callback(e))      
  } 

  createLibrary(userUUID, libraryUUID) {

  }

  // import, actually
  createDriveFile(extpath, targetDirUUID, filename) {

  }

  createDriveFolder(folderName, targetDirUUID) {

  }  

  createLibraryFile(extpath, targetLibraryUUID) {

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

export default Repo
