const Paths=require("../../src/lib/paths.js")
import { expect } from 'chai'
import mkdirp from 'mkdirp'
const sinon = require ('sinon')
const child_process=require('child_process')


describe("src/lib/paths.js", function() {
  
  //let myDigester;  

  beforeEach(function() {
    //myDigester=digester.default();
  })
  
  
  describe('setRootAsync(...)', function(done) {
    it('it works!', function(done) {
      (async () => {
        //mkdirp.mkdirp="";
        console.log(mkdirp.mkdirp);
	sinon.stub(mkdirp, 'mkdirp').returns(1);
        console.log(Paths);
        await Paths.default.setRootAsync('/aaa');
	assert(fs.setRootAsync.calledWith('/aaa/models')) 
      })().then(()=>done(), (r)=>done(r))
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

