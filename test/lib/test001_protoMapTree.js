import path from 'path'
import fs from 'fs'

import UUID from 'node-uuid'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import xattr from 'fs-xattr'
import { expect } from 'chai'

import { 
  nodeProperties, 
  ProtoMapTree, 
  createProtoMapTree, 
} from '../../src/lib/protoMapTree'

const testData1 = () => {

  let arr = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .map(c => {
      let node = Object.create(nodeProperties)
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

describe(path.basename(__filename), function() {

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
    
    describe('children', function() {
      
      it ('nodeA children should be b c e h', function(done) {
        let arr = testData1()
        let nodeA = arr.find(node => node.name === 'a')
 	      expect(nodeA.children.map(n => n.name)).to.deep.equal(['b', 'c', 'e', 'h'])
        done()
      })

    })

  })

  describe('new ProtoMapTree()', function() {
   
    let proto = { x: 1, y: 2, z: ['hello', 1] } 
    let t

    beforeEach(function() {
      t = new ProtoMapTree(proto) 
    })
    
    it('should preserve proto object props', function() {
      expect(t.proto.x).to.equal(proto.x)
      expect(t.proto.y).to.equal(proto.y)
      expect(t.proto.z).to.deep.equal(proto.z)
    })

    it('should set itself to proto.tree', function() {
      expect(t.proto.tree).to.equal(t) 
    })

    it('should have an empty uuid Map', function() {
      expect(t.uuidMap instanceof Map).to.be.true
      expect(t.uuidMap.size).to.equal(0)
    })

    it('should have an empty hash Map', function() {
      expect(t.hashMap instanceof Map).to.be.true
      expect(t.hashMap.size).to.equal(0)
    })

    it('should have null root', function() {
      expect(t.root).to.be.null
    })
  })

  describe('create root', function() {

    let uuid1 = '1e15e8ce-7ae4-43f4-8d9f-285c1f28dfac'
    let uuid2 = '5da92303-33a1-4f79-8d8f-a7b6becde6c3'
    let uuid3 = 'b9aa7c34-8b86-4306-9042-396cf8fa1a9c'
    let uuid4 = 'f97f9e1f-848b-4ed4-bd47-1ddfa82b2777'

    let digest1 = 'e14bfc54f20117011c716706ba9c4879a07f6a882d34766eda70ec5bbfe54e0e'
    let root = { uuid: uuid1, hash: digest1, type:'folder' }
    let proto = { x: 1, y: 2, z: ['hello', 1] }
    let t
  
    beforeEach(function() {
      t = new ProtoMapTree(proto)
    })

    it('should throw if root no uuid', function() {

      let root = { type: 'folder' }
      let fn = () => { t.createNode(null, root) }
      expect(fn).to.throw(Error)
    })

    it('should throw if root object no type', function() {
  
      let root = { uuid: uuid1 }
      let fn = () => { t.createNode(null, root) }
      expect(fn).to.throw(Error)
    })

    it('should throw if root is not a folder', function() {

      let root = { uuid: uuid1, type: 'file' }
      let fn = () => { t.createNode(null, root) }
      expect(fn).to.throw(Error)
    })

    it('root should preserve root object props', function() {

      let root = { 
        uuid: uuid1, 
        type: 'folder', 
        owner: [uuid2],  
        writelist: [uuid3],
        readlist: [uuid4],
        name: 'hello',
        mtime: 123456,
        hash: 234567
      }
      t.createNode(null, root)

      expect(t.root.uuid).to.equal(root.uuid)
      expect(t.root.type).to.equal(root.type)
      expect(t.root.owner).to.deep.equal(root.owner)
      expect(t.root.writelist).to.deep.equal(root.writelist)
      expect(t.root.readlist).to.deep.equal(root.readlist)
      expect(t.root.name).to.equal(root.name)
      expect(t.root.hasOwnProperty('mtime')).to.be.false
      expect(t.root.hasOwnProperty('hash')).to.be.false
    }) 

    it('root should have correct parent/children set', function() {
      
      t.createNode(null, root)
      
      expect(t.root.parent).to.be.null
      expect(t.root.getChildren()).to.deep.equal([])
    })

    it('proto should be the prototype of root', function() {
      
      t.createNode(null, root)

      expect(t.proto.isPrototypeOf(t.root)).to.be.true
    })

    it('root should be in uuid map', function() {
      
      t.createNode(null, root)

      expect(t.uuidMap.get(uuid1)).to.equal(t.root)
      expect(t.uuidMap.size).to.equal(1)
    })

    it('root should NOT be in hash map, since it is a folder', function() {
    
      t.createNode(null, root)
      
      expect(t.hashMap.size).to.equal(0)
    })
  })

  describe('modify tree', function() {
    it('set a new child', function() {
      let arr = testData1();
      let nodeA = arr.find(node => node.name === 'a')
      let nodeZ = arr.find(node => node.name === 'z')
      nodeA.setChild(nodeZ);  
      expect(nodeA.children.map(n => n.name)).to.deep.equal(['b', 'c', 'e', 'h', 'z'])
    })
    
    it('unset a new child', function() {
      let arr = testData1();
      let nodeA = arr.find(node => node.name === 'a')
      let nodeB = arr.find(node => node.name === 'b')
      nodeA.unsetChild(nodeB);  
      expect(nodeA.children.map(n => n.name)).to.deep.equal(['c', 'e', 'h'])
    })

    it('attach parent', function() {
      let arr=testData1();
      let nodeA = arr.find(node => node.name === 'a')
      let nodeZ = arr.find(node => node.name === 'z')
      nodeZ.attach(nodeA);  
      expect(nodeA.children.map(n => n.name)).to.deep.equal(['b', 'c', 'e', 'h', 'z'])
    })
    
    it('detach parent', function() {
      let arr=testData1();
      let nodeA = arr.find(node => node.name === 'a')
      let nodeB = arr.find(node => node.name === 'b')
      nodeB.detach();  
      expect(nodeA.children.map(n => n.name)).to.deep.equal(['c', 'e', 'h'])
    })

  })

  describe('get part of tree', function() {
    it('get children by getChildren()', function(){
      let arr = testData1();
      let nodeA = arr.find(node => node.name === 'a')
      expect(nodeA.children.map(n => n.name)).to.deep.equal(['b', 'c', 'e', 'h'])
    })
  })
  
  describe('traversal tree', function() {
    it('upEach', function() { 
        let arr = testData1()
        let nodeG = arr.find(node => node.name === 'g')
        let arr2 = []
        nodeG.upEach(node => arr2.push(node))
        expect(arr2.map(n=>n.name)).to.deep.equal(['g', 'e', 'a'])
    })
    
    it('upFind', function() {
      let arr = testData1()
      let nodeG = arr.find(node => node.name === 'g')

      expect(nodeG.upFind(node => node.name==='e').name==='e');
      expect(nodeG.upFind(node => node.name==='z')===undefined);
 
    }) 
    
    it('preVisit', function() {
      let arr = testData1()
      let nodeA = arr.find(node => node.name === 'a')
      let arr2 = []
      nodeA.preVisit(node => arr2.push(node.name));
      expect(arr2).to.deep.equal([ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n' ]) 
    })
    
   it('postVisit', function() {
      let arr = testData1()
      let nodeA = arr.find(node => node.name === 'a')
      let arr2 = []
      nodeA.postVisit(node => arr2.push(node.name)); 
      expect(arr2).to.deep.equal([ 'b', 'd', 'c', 'f', 'g', 'e', 'i', 'k', 'j', 'm', 'n', 'l', 'h', 'a' ]) 
    })

    it('preVisitEol', function() {
      let arr = testData1()
      let nodeA = arr.find(node => node.name === 'a')
      let arr2 = []
      nodeA.preVisitEol(node => ( arr2.push(node.name), node.name!=='e')); 
      expect(arr2).to.deep.equal([ 'a', 'b', 'c', 'd', 'e', 'h', 'i', 'j', 'k', 'l', 'm', 'n' ]) 
    })
    
    it('preVisitFind', function() {
      let arr = testData1()
      let nodeA = arr.find(node => node.name === 'a')
      expect(nodeA.preVisitFind(node => node.name==='e').name==='e'); 
      expect(nodeA.preVisitFind(node => node.name==='z')===undefined); 
    })

  })
/*
  describe('drive file operation', function() {

    describe('import drive file', function() {
      // tmptest/${userUUID}/ <- target folder
      // tmptest/hello <- file to be moved

      let userUUID1 = UUID.v4()
      let drivepath = path.join(process.cwd(), `tmptest/${userUUID1}`)
      let srcpath = path.join(process.cwd(), 'tmptest', 'hello')

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
              uuid: 'ced8e0b0-071d-442b-94e2-b3574002000a',
              owner: ['ced8e0b0-071d-442b-94e2-b3574002000b'],
              writelist: ['ced8e0b0-071d-442b-94e2-b3574002000c'],
              readlist: ['ced8e0b0-071d-442b-94e2-b3574002000d'],
              hash: null,
              htime: -1
            }

            let newset = {
              uuid: 'ced8e0b0-071d-442b-94e2-b3574002000e',
              owner: ['ced8e0b0-071d-442b-94e2-b3574002000f'],
              writelist: ['ced8e0b0-071d-442b-94e2-b3574002000g'],
              readlist: ['ced8e0b0-071d-442b-94e2-b3574002000h'],
              hash: '123456',
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
              uuid: 'ced8e0b0-071d-442b-94e2-b3574002000a',
              owner: ['ced8e0b0-071d-442b-94e2-b3574002000b'],
              writelist: ['ced8e0b0-071d-442b-94e2-b3574002000c'],
              readlist: ['ced8e0b0-071d-442b-94e2-b3574002000d'],
              hash: null,
              htime: -1
            }

            let newset = {
              uuid: 'ced8e0b0-071d-442b-94e2-b3574002000e',
              owner: ['ced8e0b0-071d-442b-94e2-b3574002000f'],
              writelist: ['ced8e0b0-071d-442b-94e2-b3574002000g'],
              readlist: ['ced8e0b0-071d-442b-94e2-b3574002000h'],
              hash: '123456',
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
              hash: '123456',
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
              uuid: 'ced8e0b0-071d-442b-94e2-b3574002000a',
              owner: ['ced8e0b0-071d-442b-94e2-b3574002000b'],
              writelist: ['ced8e0b0-071d-442b-94e2-b3574002000c'],
              readlist: ['ced8e0b0-071d-442b-94e2-b3574002000d'],
              hash: '654321',
              htime: -1
            }

            let newset = {
              uuid: 'ced8e0b0-071d-442b-94e2-b3574002000e',
              owner: ['ced8e0b0-071d-442b-94e2-b3574002000f'],
              writelist: ['ced8e0b0-071d-442b-94e2-b3574002000g'],
              readlist: ['ced8e0b0-071d-442b-94e2-b3574002000h'],
              hash: '123456',
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
})*/
})
