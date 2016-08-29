const Paths=require("../../src/lib/paths.js")
import { expect, assert } from 'chai'
import mkdirp from 'mkdirp'
const sinon = require ('sinon')
const child_process=require('child_process')
const Util = require( '../../src/lib/util.js')

describe("src/lib/paths.js", function() {
  
  //let myDigester;  

  beforeEach(function() {
    //myDigester=digester.default();
  })
  
  
  describe('setRootAsync(...)', (done) => {
    it('it works!', () => {
	    sinon.stub(Util, 'mkdirpAsync').returns(1);
      Paths.default.setRootAsync('/aaa').then((r) => {
	      assert(Util.mkdirpAsync.calledWith('/aaa/models')) 
	      assert(Util.mkdirpAsync.calledWith('/aaa/drives')) 
	      assert(Util.mkdirpAsync.calledWith('/aaa/pools')) 
	      assert(Util.mkdirpAsync.calledWith('/aaa/upload')) 
	      assert(Util.mkdirpAsync.calledWith('/aaa/etc')) 
	      assert(Util.mkdirpAsync.calledWith('/aaa/tmp')) 
        Util.mkdirpAsync.restore()
        done()
      }).catch((e) => {
        Util.mkdirpAsync.restore()
        done()
      }) 
    })
  })
 /* 
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
   
    it('works fine', function(done) {
      myDigester.digest('test/res/test1.txt')
      setTimeout(()=>{ console.log(myDigester.hash); done()}, 1500); 
    })
  })a*/
})

