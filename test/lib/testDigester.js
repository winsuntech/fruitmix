const digester=require("../../src/lib/digester.js")
import { expect } from 'chai'
const sinon = require ('sinon')
const child_process=require('child_process')
/*
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
*/


describe("src/lib/digester.js", function() {
  
  let myDigester;  

  beforeEach(function() {
    myDigester=digester.default();
  })
  
  describe('constructor(...)', function() {
    it('it works!', function(done) {
      expect(myDigester.queue===[]);
      expect(myDigester.current===null);
      expect(myDigester.spawn===null);
      expect(myDigester.hash===null);
      done()
    })
  })
  
  describe('digest(...)', function() {
    it('it works!', function() {
      sinon.stub(myDigester, "openssl")
      myDigester.digest('test/res/test1.txt')
      expect(myDigester.queue).to.deep.equal(['test/res/test1.txt']);
      expect(myDigester.openssl.calledOnce);
      myDigester.openssl.restore();
    })
  })
  
  describe('openssl(...)', function() {
   
    beforeEach(function() {
      myDigester=digester.default();
    })
   
 
   it('returns immediately when the state is in spawn', function() {
      myDigester.spawn = 1;
      sinon.stub(child_process, 'spawn')
      myDigester.digest('test/res/test1.txt')
      expect(myDigester.queue).to.deep.equal(['test/res/test1.txt']);
      expect(child_process.spawn.callCount===0)
      child_process.spawn.restore();
    })
    
    it('returns immediately when queue is empty!', function() {
      sinon.spy(child_process, 'spawn')
      myDigester.openssl()
      expect(child_process.spawn.callCount===0)
      child_process.spawn.restore();
    })

/**   
    it('works fine', function(done) {
      myDigester.digest('test/res/test1.txt')
      setTimeout(()=>{ console.log(myDigester.hash); done()}, 1500); 
    })
**/
  })
})

