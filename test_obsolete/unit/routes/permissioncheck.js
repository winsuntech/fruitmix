var mongoose = require('mongoose');
var express = require('express');
var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');

var Checker = require('middleware/permissioncheck');

describe("unit testing middleware/permissioncheck.js------read", function() { 

  const Memtree = require('middleware/treemanager');
  memt = new Memtree();

  // stub mongoose.model() and express.Router()
   // before(function() {

   // });

  // after(function() {
  //   mongoose.model.restore(); 
  //   express.Router.restore();
  // });

  afterEach(function() {
    memt.canread.restore();
    memt.isowner.restore();
    memt.getroot.restore();
    memt.getparent.restore();
 });

  it("11,11 is ture", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);
    sinon.stub(memt, 'canread', function(f,x) {
      return true;
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return true;
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.read(000,11)).to.equal(true);
  });

  it("10,11 is ture", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(true);

    sinon.stub(memt, 'canread', function(f,x) {
      return true;
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.read(000,11)).to.equal(true);
  });

  it("10,01 is ture", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpread= sinon.stub();
    tmpread.onFirstCall().returns(true);
    tmpread.onSecondCall().returns(false);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(true);

    sinon.stub(memt, 'canread', function(f,x) {
      return tmpread();
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.read(000,11)).to.equal(true);
  });

  it("10,00 is false", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpread= sinon.stub();
    tmpread.onFirstCall().returns(true);
    tmpread.onSecondCall().returns(false);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(false);

    sinon.stub(memt, 'canread', function(f,x) {
      return tmpread();
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.read(000,11)).to.equal(false);
  });

  it("00,01 is false", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpread= sinon.stub();
    tmpread.onFirstCall().returns(false);
    tmpread.onSecondCall().returns(false);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(true);

    sinon.stub(memt, 'canread', function(f,x) {
      return tmpread();
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });

    expect(Checker.read(000,11)).to.equal(false);
  });

});

describe("unit testing middleware/permissioncheck.js------write", function() { 

  const Memtree = require('middleware/treemanager');
  memt = new Memtree();

  // stub mongoose.model() and express.Router()
   // before(function() {

   // });

  // after(function() {
  //   mongoose.model.restore(); 
  //   express.Router.restore();
  // });

  afterEach(function() {
    memt.canwrite.restore();
    memt.isowner.restore();
    memt.getroot.restore();
    memt.getparent.restore();
 });

  it("11,11 is ture", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);
    sinon.stub(memt, 'canwrite', function(f,x) {
      return true;
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return true;
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.write(000,11)).to.equal(true);
  });

  it("10,11 is ture", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(true);

    sinon.stub(memt, 'canwrite', function(f,x) {
      return true;
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.write(000,11)).to.equal(true);
  });

  it("10,01 is ture", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpwrite= sinon.stub();
    tmpwrite.onFirstCall().returns(true);
    tmpwrite.onSecondCall().returns(false);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(true);

    sinon.stub(memt, 'canwrite', function(f,x) {
      return tmpwrite();
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.write(000,11)).to.equal(true);
  });

  it("10,00 is false", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpwrite= sinon.stub();
    tmpwrite.onFirstCall().returns(true);
    tmpwrite.onSecondCall().returns(false);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(false);

    sinon.stub(memt, 'canwrite', function(f,x) {
      return tmpwrite();
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.write(000,11)).to.equal(false);
  });

  it("00,01 is false", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpwrite= sinon.stub();
    tmpwrite.onFirstCall().returns(false);
    tmpwrite.onSecondCall().returns(false);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(true);

    sinon.stub(memt, 'canwrite', function(f,x) {
      return tmpwrite();
    });
    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });

    expect(Checker.write(000,11)).to.equal(false);
  });

});

describe("unit testing middleware/permissioncheck.js------owner", function() { 

  const Memtree = require('middleware/treemanager');
  memt = new Memtree();

  // stub mongoose.model() and express.Router()
   // before(function() {

   // });

  // after(function() {
  //   mongoose.model.restore(); 
  //   express.Router.restore();
  // });

  afterEach(function() {
    memt.isowner.restore();
    memt.getroot.restore();
    memt.getparent.restore();
 });

  it("1,1 is ture", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    sinon.stub(memt, 'isowner', function(f,x) {
      return true;
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.owner(000,11)).to.equal(true);
  });

  it("0,1 is false", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(true);

    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.owner(000,11)).to.equal(false);
  });

  it("0,0 is false", function() {
    var tmpparent = sinon.stub();
    tmpparent.onFirstCall().returns(111);
    tmpparent.onSecondCall().returns(222);

    var tmpowner= sinon.stub();
    tmpowner.onFirstCall().returns(false);
    tmpowner.onSecondCall().returns(false);

    sinon.stub(memt, 'isowner', function(f,x) {
      return tmpowner();
    });
    sinon.stub(memt, 'getroot', function(f,x) {
      return 222;
    });
    sinon.stub(memt, 'getparent', function(f) {
      return tmpparent();
    });
    
    expect(Checker.owner(000,11)).to.equal(false);
  });

});
