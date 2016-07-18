import path from 'path'
import fs from 'fs'

import UUID from 'node-uuid'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import xattr from 'fs-xattr'
import { expect } from 'chai'

import { 
  protoNode, 
  ProtoMapTree, 
  createProtoMapTree, 
} from '../../src/lib/protoMapTree'

const testData1 = () => {

  let arr = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .map(c => {
      let node = Object.create(protoNode)
      node.parent = null
      node.name = c
      return node
    })

  let object = {
    a:          null,
      b:        'a',
      c:        'a',
        d:      'c',
      e:        'a',
        f:      'e',
        g:      'e',
      h:        'a',
        i:      'h',
        j:      'h',
          k:    'j',
        l:      'h',
          m:    'l',
          n:    'l'
  } 

  for (let prop in object) {  
    if (object.hasOwnProperty(prop)) {
      if (object[prop] === null) continue
      let node = arr.find(n => n.name === prop)
      let parent = arr.find(n => n.name === object[prop])

      if (!node || !parent) throw new Error('node or parent non-exist')
      node.attach(parent)
    }
  } 

  return arr
}

describe('protoMapTree', function() {
  
  describe('path', function() { 
    it('nodeK path should be a h j k', function(done) { 
      let arr = testData1()
      let nodeK = arr.find(node => node.name === 'k')
      expect(nodeK.nodepath().map(n => n.name)).to.deep.equal(['a', 'h', 'j', 'k'])
      done()
    })

    it ('nodeG path should be a e g', function(done) {
      let arr = testData1()
      let nodeG = arr.find(node => node.name === 'g')
      expect(nodeG.nodepath().map(n => n.name)).to.deep.equal(['a', 'e', 'g'])
      done()
    })
  })
})

describe('createProtoMapTree', function() {

  let cwd = process.cwd()
  let tpath = path.join(cwd, 'tmptest')

  describe('create drive tree', function() {

    it('should create a drive tree', function(done) { 

      let driveUUID = UUID.v4()
      let drivepath = path.join(cwd, `tmptest/${driveUUID}`)

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${driveUUID}`, err => {
          if (err) return done(err)

          let preset = {
            uuid: UUID.v4(),
            owner: [driveUUID],
            writelist: [UUID.v4()],
            readlist: [],
            hash: null,
            htime: -1
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {

            createProtoMapTree(drivepath, 'drive', (err, tree) => {
              if (err) return done(err)

              expect(tree.type).to.equal('drive')
              expect(tree.uuid).to.equal(driveUUID)
              expect(tree.rootpath).to.equal(drivepath)
              expect(tree.proto.tree).to.equal(tree)
              expect(tree.proto.owner).to.deep.equal(preset.owner)
              expect(tree.proto.writelist).to.be.null
              expect(tree.proto.readlist).to.be.null

              expect(tree.root.owner).to.deep.equal(preset.owner)
              expect(tree.root.writelist).to.deep.equal(preset.writelist)
              expect(tree.root.readlist).to.deep.equal(preset.readlist)

              done()
            })
          })
        })        
      })
    })
  })

  describe('create library tree', function(done) {

    it('should create a library tree', function(done) {

      let libraryUUID = UUID.v4()
      let libraryPath = path.join(cwd, `tmptest/${libraryUUID}`)

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${libraryUUID}`, err => {
          if (err) return done(err)
          
          let preset = {
            uuid: UUID.v4(),
            owner: [UUID.v4()],
            writelist: [UUID.v4()],
            readlist: [UUID.v4()],
            hash: null,
            htime: -1
          }

          xattr.set(libraryPath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            
            createProtoMapTree(libraryPath, 'library', (err, tree) => {
              if (err) return done(err)

              expect(tree.type).to.equal('library')
              expect(tree.uuid).to.equal(libraryUUID)
              expect(tree.rootpath).to.equal(libraryPath)

              expect(tree.proto.tree).to.equal(tree)
              expect(tree.proto.owner).to.deep.equal(preset.owner)
              expect(tree.proto.writelist).to.deep.equal([])
              expect(tree.proto.readlist).to.deep.equal(preset.readlist)

              expect(tree.root.owner).to.deep.equal(preset.owner)
              expect(tree.root.writelist).to.deep.equal([])
              expect(tree.root.readlist).to.deep.equal(preset.readlist)

              done()
            }) 
          })
        })
      })
    })
  })
})

describe('scan', function() {

  describe('scan drive', function() {

  // tmptest/${userUUID}/hello
  //          preset       preset2
     
    let userUUID = UUID.v4()
    let drivepath = path.join(process.cwd(), `tmptest/${userUUID}`)
    let hellopath = path.join(drivepath, 'hello')

    it('should scan a single folder', function(done) {

      let preset = {
        uuid: UUID.v4(),
        owner: [userUUID],
        writelist: [],
        readlist: [],
        hash: null,
        htime: -1
      }

      let preset2 = {
        uuid: UUID.v4(),
        owner: [userUUID],
        writelist: null,
        readlist: null,
        hash: null,
        htime: -1
      }

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID}/hello`, err => {
          if (err) return done(err)
          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            xattr.set(hellopath, 'user.fruitmix', JSON.stringify(preset2), err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'drive', (err, tree) => {
                if (err) return done(err)
                // scanDriveTree(tree, () => {
                tree.scan(() => {  
                  let children = tree.root.getChildren() 
                  let child = children[0]
                  expect(children.length).to.equal(1)
                  expect(child.type === 'folder')
                  expect(child.uuid === preset2.uuid)
                  expect(child.name === 'hello')
                  expect(child.writelist === null)
                  expect(child.readlist === null)
                  done()
                })
              })
            })
          })
        })
      })
    })
  })

  describe('scan library', function() {

    // tmptest/${libraryUUID}/hello <- is a file
  
    let userUUID = UUID.v4()
    let libraryUUID = UUID.v4()
    let libraryPath = path.join(process.cwd(), `tmptest/${libraryUUID}`)
    let filepath = path.join(libraryPath, 'hello')

    it('should scan a single file in library', function(done) {
    
      let preset = {
        uuid: UUID.v4(), // folder uuid
        owner: [userUUID],
        writelist: [],
        readlist: [],
        hash: null,
        htime: -1 
      }

      let preset2 = {}

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${libraryUUID}`, err => {
          if (err) return done(err)
          xattr.set(libraryPath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile(filepath, 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(libraryPath, 'library', (err, tree) => {
                if (err) return done(err)
                // scanLibraryTree(tree, () => {
                tree.scan(() => {

                  let children = tree.root.getChildren()
                  let child = children[0]

                  expect(children.length).to.equal(1)
                  expect(child.type === 'file')
                  expect(child.name === 'hello')
                   
                  done()
                })
              }) 
            }) 
          })
        })
      })
    })  
  })
})

describe('drive file operation', function() {

  describe('import drive file', function() {
    // tmptest/${userUUID}/ <- target folder
    // tmptest/hello <- file to be moved

    let userUUID1 = UUID.v4()
    let drivepath = path.join(process.cwd(), `tmptest/${userUUID1}`)
    let srcpath = path.join(process.cwd(), 'tmptest', 'hello')

    it('should import a file into given drive folder', function(done) {

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID1}`, err => {
          if (err) return done(err)
          let preset = {
            uuid: UUID.v4(),
            owner: [UUID.v4()],
            writelist: [UUID.v4()],
            readlist: [UUID.v4()],
            hash: null,
            htime: -1
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile('tmptest/hello', 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'drive', (err, tree) => {
                if (err) return done(err)

                tree.importFile(srcpath, tree.root, 'hello', (err, node) => {
                  if (err) return done(err) 
                  fs.stat(path.join(drivepath, 'hello'), (err, stat) => {
                    if (err) return done(err)

                    let children = tree.root.children
                    let child = children[0]
                    expect(children.length).to.equal(1)
                    expect(child.type).to.equal('file')
                    expect(child.name).to.equal('hello')
                    done()
                  })
                })
              })
            })
          })
        })
      }) 
    })

    it('should import a file into drive non-root folder', function(done) {

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID1}/world`, err => {
          if (err) return done(err)
          let preset = {
            uuid: UUID.v4(),
            owner: [UUID.v4()],
            writelist: [UUID.v4()],
            readlist: [UUID.v4()],
            hash: null,
            htime: -1
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile('tmptest/hello', 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'drive', (err, tree) => {
                if (err) return done(err)
                tree.scan(() => {

                  tree.importFile(srcpath, tree.root.children[0], 'hello', (err, node) => {
                    if (err) return done(err) 
                    fs.stat(path.join(drivepath, 'world', 'hello'), (err, stat) => {
                      if (err) return done(err)

                      let children = tree.root.children[0].children
                      let child = children[0]
                      expect(children.length).to.equal(1)
                      expect(child.type).to.equal('file')
                      expect(child.name).to.equal('hello')
                      done()
                    })
                  })
                })
              })
            })
          })
        })
      }) 
    })

    it('should delete a file from drive folder', function(done) {

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID1}/world`, err => {
          if (err) return done(err)
          let preset = {
            uuid: UUID.v4(),
            owner: [UUID.v4()],
            writelist: [UUID.v4()],
            readlist: [UUID.v4()],
            hash: null,
            htime: -1
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile('tmptest/hello', 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'drive', (err, tree) => {
                if (err) return done(err)
                tree.scan(() => {

                  tree.importFile(srcpath, tree.root.children[0], 'hello', (err, node) => {
                    if (err) return done(err) 
                    fs.stat(path.join(drivepath, 'world', 'hello'), (err, stat) => {
                      if (err) return done(err)

                      let children = tree.root.children[0].children
                      let child = children[0]
                      expect(children.length).to.equal(1)
                      expect(child.type).to.equal('file')
                      expect(child.name).to.equal('hello')    
                      tree.deleteFileOrFolder(tree.root.children[0].children[0],(err,node) =>{
                        expect(tree.root.children[0].children.length).to.equal(0)
                        done()
                      })
                      
                    })
                  })
                })
              })
            })
          })
        })
      }) 
    })

    it('should delete a folder from drive folder', function(done) {

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID1}/world`, err => {
          if (err) return done(err)
          let preset = {
            uuid: UUID.v4(),
            owner: [UUID.v4()],
            writelist: [UUID.v4()],
            readlist: [UUID.v4()],
            hash: null,
            htime: -1
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile('tmptest/hello', 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'drive', (err, tree) => {
                if (err) return done(err)
                tree.scan(() => {

                  tree.importFile(srcpath, tree.root.children[0], 'hello', (err, node) => {
                    if (err) return done(err) 
                    fs.stat(path.join(drivepath, 'world', 'hello'), (err, stat) => {
                      if (err) return done(err)

                      let children = tree.root.children[0].children
                      let child = children[0]
                      expect(children.length).to.equal(1)
                      expect(child.type).to.equal('file')
                      expect(child.name).to.equal('hello')    
                      tree.deleteFileOrFolder(tree.root.children[0],(err,node) =>{
                        expect(tree.root.children.length).to.equal(0)
                        done()
                      })
                      
                    })
                  })
                })
              })
            })
          })
        })
      }) 
    })

    it('should rename a file', function(done) {

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID1}/world`, err => {
          if (err) return done(err)
          let preset = {
            uuid: UUID.v4(),
            owner: [UUID.v4()],
            writelist: [UUID.v4()],
            readlist: [UUID.v4()],
            hash: null,
            htime: -1
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile('tmptest/hello', 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'drive', (err, tree) => {
                if (err) return done(err)
                tree.scan(() => {

                  tree.importFile(srcpath, tree.root.children[0], 'hello', (err, node) => {
                    if (err) return done(err) 
                    fs.stat(path.join(drivepath, 'world', 'hello'), (err, stat) => {
                      if (err) return done(err)

                      let children = tree.root.children[0].children
                      let child = children[0]
                      expect(children.length).to.equal(1)
                      expect(child.type).to.equal('file')
                      expect(child.name).to.equal('hello')
                      tree.renameFileOrFolder(tree.root.children[0].children[0],'mother fker',err=>{
                        expect(tree.root.children[0].children[0].name).to.equal('mother fker')
                        done()
                      })
                    })
                  })
                })
              })
            })
          })
        })
      }) 
    })

    it('should rename a folder', function(done) {

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID1}/world`, err => {
          if (err) return done(err)
          let preset = {
            uuid: UUID.v4(),
            owner: [UUID.v4()],
            writelist: [UUID.v4()],
            readlist: [UUID.v4()],
            hash: null,
            htime: -1
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile('tmptest/hello', 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'drive', (err, tree) => {
                if (err) return done(err)
                tree.scan(() => {

                  tree.importFile(srcpath, tree.root.children[0], 'hello', (err, node) => {
                    if (err) return done(err) 
                    fs.stat(path.join(drivepath, 'world', 'hello'), (err, stat) => {
                      if (err) return done(err)

                      let children = tree.root.children[0].children
                      let child = children[0]
                      expect(children.length).to.equal(1)
                      expect(child.type).to.equal('file')
                      expect(child.name).to.equal('hello')
                      tree.renameFileOrFolder(tree.root.children[0],'ppppp',err=>{
                        expect(tree.root.children[0].name).to.equal('ppppp')
                        done()
                      })
                    })
                  })
                })
              })
            })
          })
        })
      }) 
    })

    it('should update a file', function(done) {

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID1}/world`, err => {
          if (err) return done(err)
          let preset = {
            uuid: "ced8e0b0-071d-442b-94e2-b3574002000a",
            owner: ["ced8e0b0-071d-442b-94e2-b3574002000b"],
            writelist: ["ced8e0b0-071d-442b-94e2-b3574002000c"],
            readlist: ["ced8e0b0-071d-442b-94e2-b3574002000d"],
            hash: null,
            htime: -1
          }

          let newset = {
            uuid: "ced8e0b0-071d-442b-94e2-b3574002000e",
            owner: ["ced8e0b0-071d-442b-94e2-b3574002000f"],
            writelist: ["ced8e0b0-071d-442b-94e2-b3574002000g"],
            readlist: ["ced8e0b0-071d-442b-94e2-b3574002000h"],
            hash: "123456",
            htime: 0
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile('tmptest/hello', 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'drive', (err, tree) => {
                if (err) return done(err)
                tree.scan(() => {

                  tree.importFile(srcpath, tree.root.children[0], 'hello', (err, node) => {
                    if (err) return done(err) 
                    fs.stat(path.join(drivepath, 'world', 'hello'), (err, stat) => {
                      if (err) return done(err)

                      let children = tree.root.children[0].children
                      let child = children[0]
                      expect(children.length).to.equal(1)
                      expect(child.type).to.equal('file')
                      expect(child.name).to.equal('hello')
                      tree.updateDriveFile(tree.root.children[0].children[0],newset,err=>{
                        expect(tree.root.children[0].children[0].uuid).to.equal('ced8e0b0-071d-442b-94e2-b3574002000e')
                        expect(tree.root.children[0].children[0].owner).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000f'])
                        expect(tree.root.children[0].children[0].writelist).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000g'])
                        expect(tree.root.children[0].children[0].readlist).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000h'])
                        expect(tree.root.children[0].children[0].hash).to.equal('123456')
                        expect(tree.root.children[0].children[0].htime).to.equal(0)
                        done()
                      })
                    })
                  })
                })
              })
            })
          })
        })
      }) 
    })

    it('should update a folder', function(done) {

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID1}/world`, err => {
          if (err) return done(err)
          let preset = {
            uuid: "ced8e0b0-071d-442b-94e2-b3574002000a",
            owner: ["ced8e0b0-071d-442b-94e2-b3574002000b"],
            writelist: ["ced8e0b0-071d-442b-94e2-b3574002000c"],
            readlist: ["ced8e0b0-071d-442b-94e2-b3574002000d"],
            hash: null,
            htime: -1
          }

          let newset = {
            uuid: "ced8e0b0-071d-442b-94e2-b3574002000e",
            owner: ["ced8e0b0-071d-442b-94e2-b3574002000f"],
            writelist: ["ced8e0b0-071d-442b-94e2-b3574002000g"],
            readlist: ["ced8e0b0-071d-442b-94e2-b3574002000h"],
            hash: "123456",
            htime: 0
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile('tmptest/hello', 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'drive', (err, tree) => {
                if (err) return done(err)
                tree.scan(() => {

                  tree.importFile(srcpath, tree.root.children[0], 'hello', (err, node) => {
                    if (err) return done(err) 
                    fs.stat(path.join(drivepath, 'world', 'hello'), (err, stat) => {
                      if (err) return done(err)

                      let children = tree.root.children[0].children
                      let child = children[0]
                      expect(children.length).to.equal(1)
                      expect(child.type).to.equal('file')
                      expect(child.name).to.equal('hello')
                      tree.updateDriveFile(tree.root.children[0],newset,err=>{
                        expect(tree.root.children[0].uuid).to.equal('ced8e0b0-071d-442b-94e2-b3574002000e')
                        expect(tree.root.children[0].owner).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000f'])
                        expect(tree.root.children[0].writelist).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000g'])
                        expect(tree.root.children[0].readlist).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000h'])
                        expect(tree.root.children[0].hash).to.equal('123456')
                        expect(tree.root.children[0].htime).to.equal(0)
                        done()
                      })
                    })
                  })
                })
              })
            })
          })
        })
      }) 
    })


  }) // end of create drive file 
})

describe('library file operation', function() {

    describe('import library file', function() {
      // tmptest/${userUUID}/ <- target folder
      // tmptest/hello <- file to be moved

      let userUUID1 = UUID.v4()
      let drivepath = path.join(process.cwd(), `tmptest/${userUUID1}`)
      let srcpath = path.join(process.cwd(), 'tmptest', 'hello')

      it('should import a file into given library folder', function(done) {

        rimraf('tmptest', err => {
          if (err) return done(err)
          mkdirp(`tmptest/${userUUID1}/`, err => {
            if (err) return done(err)
            let preset = {
              uuid: UUID.v4(),
              owner: [UUID.v4()],
              writelist: [UUID.v4()],
              readlist: [UUID.v4()],
              hash: "123456",
              htime: -1
            }

            xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
              if (err) return done(err)
              fs.writeFile('tmptest/hello', preset.hash, err => {
                if (err) return done(err) 
                createProtoMapTree(drivepath, 'library', (err, tree) => {
                  if (err) return done(err)

                  tree.importFile(srcpath, tree.root, preset.hash, (err, node) => {
                    if (err) return done(err) 
                    fs.stat(path.join(drivepath, preset.hash), (err, stat) => {
                      if (err) return done(err)

                      let children = tree.root.children
                      let child = children[0]
                      expect(children.length).to.equal(1)
                      expect(child.type).to.equal('file')
                      expect(child.name).to.equal('123456')
                      done()
                    })
                  })
                })
              })
            })
          })
        }) 
      })

      it('should update a file', function(done) {

      rimraf('tmptest', err => {
        if (err) return done(err)
        mkdirp(`tmptest/${userUUID1}/`, err => {
          if (err) return done(err)
          let preset = {
            uuid: "ced8e0b0-071d-442b-94e2-b3574002000a",
            owner: ["ced8e0b0-071d-442b-94e2-b3574002000b"],
            writelist: ["ced8e0b0-071d-442b-94e2-b3574002000c"],
            readlist: ["ced8e0b0-071d-442b-94e2-b3574002000d"],
            hash: "654321",
            htime: -1
          }

          let newset = {
            uuid: "ced8e0b0-071d-442b-94e2-b3574002000e",
            owner: ["ced8e0b0-071d-442b-94e2-b3574002000f"],
            writelist: ["ced8e0b0-071d-442b-94e2-b3574002000g"],
            readlist: ["ced8e0b0-071d-442b-94e2-b3574002000h"],
            hash: "123456",
            htime: 0
          }

          xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
            if (err) return done(err)
            fs.writeFile('tmptest/hello', 'world', err => {
              if (err) return done(err) 
              createProtoMapTree(drivepath, 'library', (err, tree) => {
                if (err) return done(err)
                tree.scan(() => {
  
                  tree.importFile(srcpath, tree.root.children[0], '654321', (err, node) => {
                    if (err) return done(err) 
                    fs.stat(path.join(drivepath, '654321'), (err, stat) => {
                      if (err) return done(err)

                      let children = tree.root.children[0].children
                      let child = children[0]
                      expect(children.length).to.equal(1)
                      expect(child.type).to.equal('file')
                      expect(child.name).to.equal('654321')
                      tree.updateLibraryFile(tree.root.children[0].children[0],newset,err=>{
                        expect(tree.root.children[0].children[0].uuid).to.equal('ced8e0b0-071d-442b-94e2-b3574002000e')
                        expect(tree.root.children[0].children[0].owner).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000f'])
                        expect(tree.root.children[0].children[0].writelist).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000g'])
                        expect(tree.root.children[0].children[0].readlist).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000h'])
                        expect(tree.root.children[0].children[0].hash).to.equal('123456')
                        expect(tree.root.children[0].children[0].name).to.equal('123456')
                        expect(tree.root.children[0].children[0].htime).to.equal(0)
                        done()
                      })
                    })
                  })
                })
              })
            })
          })
        })
      }) 
    })

    // it('should update a folder', function(done) {

    //   rimraf('tmptest', err => {
    //     if (err) return done(err)
    //     mkdirp(`tmptest/${userUUID1}/world`, err => {
    //       if (err) return done(err)
    //       let preset = {
    //         uuid: "ced8e0b0-071d-442b-94e2-b3574002000a",
    //         owner: ["ced8e0b0-071d-442b-94e2-b3574002000b"],
    //         writelist: ["ced8e0b0-071d-442b-94e2-b3574002000c"],
    //         readlist: ["ced8e0b0-071d-442b-94e2-b3574002000d"],
    //         hash: null,
    //         htime: -1
    //       }

    //       let newset = {
    //         uuid: "ced8e0b0-071d-442b-94e2-b3574002000e",
    //         owner: ["ced8e0b0-071d-442b-94e2-b3574002000f"],
    //         writelist: ["ced8e0b0-071d-442b-94e2-b3574002000g"],
    //         readlist: ["ced8e0b0-071d-442b-94e2-b3574002000h"],
    //         hash: "123456",
    //         htime: 0
    //       }

    //       xattr.set(drivepath, 'user.fruitmix', JSON.stringify(preset), err => {
    //         if (err) return done(err)
    //         fs.writeFile('tmptest/hello', 'world', err => {
    //           if (err) return done(err) 
    //           createProtoMapTree(drivepath, 'drive', (err, tree) => {
    //             if (err) return done(err)
    //             tree.scan(() => {

    //               tree.importFile(srcpath, tree.root.children[0], 'hello', (err, node) => {
    //                 if (err) return done(err) 
    //                 fs.stat(path.join(drivepath, 'world', 'hello'), (err, stat) => {
    //                   if (err) return done(err)

    //                   let children = tree.root.children[0].children
    //                   let child = children[0]
    //                   expect(children.length).to.equal(1)
    //                   expect(child.type).to.equal('file')
    //                   expect(child.name).to.equal('hello')
    //                   tree.updateDriveFile(tree.root.children[0],newset,err=>{
    //                     expect(tree.root.children[0].uuid).to.equal('ced8e0b0-071d-442b-94e2-b3574002000e')
    //                     expect(tree.root.children[0].owner).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000f'])
    //                     expect(tree.root.children[0].writelist).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000g'])
    //                     expect(tree.root.children[0].readlist).to.deep.equal(['ced8e0b0-071d-442b-94e2-b3574002000h'])
    //                     expect(tree.root.children[0].hash).to.equal('123456')
    //                     expect(tree.root.children[0].htime).to.equal(0)
    //                     done()
    //                   })
    //                 })
    //               })
    //             })
    //           })
    //         })
    //       })
    //     })
    //   }) 
    // })



    }) // end of create library file 
  
})
