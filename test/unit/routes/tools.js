var mongoose = require('mongoose');
var express = require('express');
var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');

var tools = require('middleware/tools.js');
var Checker = require('middleware/permissioncheck');
var MTObj = require('middleware/memtree');

describe("unit testing middleware/tools.js", function() { 

  const Memtree = require('middleware/treemanager');
  memt = new Memtree();

  // stub mongoose.model() and express.Router()
   before(function() {
    hashmap =new Map();
    sinon.stub(Checker, 'read', function(f,s) {
      return true;
    });

    sinon.stub(Checker, 'owner', function(f,s) {
      return true;
    });

    sinon.stub(memt, 'has', function(f) {
      return true;
    });
    sinon.stub(memt, 'getrawchildrenlist', function(f) {
      return [444];
    });
    sinon.stub(memt, 'get', function(f) {
      return new MTObj;
    });
   });

  // after(function() {
  //   mongoose.model.restore(); 
  //   express.Router.restore();
  // });

  // beforeEach(function() {

  // });

  it("should renturn ture(int)", function() {
    expect(tools.contains([1,2],1)).to.equal(true);
  });

  it("should renturn ture(string)", function() {
    expect(tools.contains(['1','2'],'1')).to.equal(true);
  });

  it("should renturn false(string)", function() {
    expect(tools.contains(['1','2'],1)).to.equal(false);
  });

  it("getfilelistbyhash", function() {
    hashmap.set(321,[123]);
    assert(tools.getfilelistbyhash(321),[444]);
  });

  it("getfilelist", function() {
    hashmap.set(321,[123]);
    sinon.stub(memt, 'getchildren', function(f) {
      return [];
    });
    assert(tools.getfilelistbyhash(),[444]);
  });

});




