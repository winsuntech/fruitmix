import path from 'path'

import UUID from 'node-uuid'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import xattr from 'fs-xattr'
import { expect } from 'chai'

import { protoNode, ProtoMapTree, createProtoMapTree, scanDriveTree } from '../../src/lib/protoMapTree'

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

  describe('createProtoMapTree', function() {

    let cwd = process.cwd()
    let tpath = path.join(cwd, 'tmptest')

    describe('create drive tree', function() {

      it('should create a drive tree', function(done) { 
        rimraf('tmptest', err => {
          if (err) return done(err)
          mkdirp('tmptest', err => {
            if (err) return done(err)

            let preset = {
              uuid: UUID.v4(),
              owner: [UUID.v4()],
              writelist: [UUID.v4()],
              readlist: [],
              hash: null,
              htime: -1
            }

            xattr.set(tpath, 'user.fruitmix', JSON.stringify(preset), err => {

              createProtoMapTree(tpath, 'drive', (err, tree) => {
                if (err) return done(err)

                expect(tree.type).to.equal('drive')

                expect(tree.rootpath).to.equal(tpath)
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

      it('should create a library tree', function(done) {
        rimraf('tmptest', err => {
          if (err) return done(err)
          mkdirp('tmptest', err => {
            if (err) return done(err)
            
            let preset = {
              uuid: UUID.v4(),
              owner: [UUID.v4()],
              writelist: [UUID.v4()],
              readlist: [UUID.v4()],
              hash: null,
              htime: -1
            }

            xattr.set(tpath, 'user.fruitmix', JSON.stringify(preset), err => {
              if (err) return done(err)
              
              createProtoMapTree(tpath, 'library', (err, tree) => {

                expect(tree.type).to.equal('library')
                expect(tree.rootpath).to.equal(tpath)
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

  describe('scan drive', function() {
     
    let userUUID = UUID.v4()
    let drivepath = path.join(process.cwd(), `tmptest/${userUUID}`)
    let hellopath = path.join(drivepath, 'hello')

    it('should a single folder', function(done) {

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
                scanDriveTree(tree, () => {
                
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
})


