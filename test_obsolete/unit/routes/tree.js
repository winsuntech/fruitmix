var mongoose = require('mongoose');
var express = require('express');
var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
memt = require('middleware/treemanager');

describe("unit testing middleware/treemanager.js", function() { 
  // stub mongoose.model() and express.Router()
  

  beforeEach(function(done) {
    var mtobj1 = {
    hash : "",
    uuid : "root123456",
    type : "folder",
    parent : "",
    children : ["file1111"],
    attribute : {changetime : "111111111111",
                modifytime : "222222222222",
                createtime : "333333333333",
                size : "4444",
                name : "555"},
    permission : {readlist : ["a11"],
                  writelist : ["a22"],
                  owner: ["a33"]}
  }
    var mtobj2 = {
      hash : "012345",
      uuid : "file1111",
      type : "file",
      parent : "root123456",
      children : ["file2222"],
      attribute : {changetime : "44444444444",
                   modifytime : "55555555555",
                   createtime : "66666666666",
                   size : "777",
                   name : "888.png"},
      permission : {readlist : ["b11"],
                    writelist : ["b22"],
                    owner: ["b33"]}
    }
    memt.add("root123456",mtobj1);
    memt.add("file1111",mtobj2);
    memt.setroot('000');
    done();
  });

  afterEach(function(done) {
    memt = require('middleware/treemanager');
    done();
  });
  // after(function() {
  //   mongoose.model.restore(); 
  //   express.Router.restore();
  // });
  it("getroot", function() {
    expect(memt.getroot()).to.equal("000");
  });

  it("getfoldertype", function() {
    expect(memt.gettype('root123456')).to.equal("folder");
  });

  it("getfiletype", function() {
    expect(memt.gettype('file1111')).to.equal("file");
  });

  it("getchildren", function() {
    expect(memt.getchildren('root123456')).to.deep.equal(['file1111']);
  });

  it("gethash", function() {
    expect(memt.gethash('file1111')).to.equal("012345");
  });

  it("getparent", function() {
    expect(memt.getparent('file1111')).to.equal("root123456");
  });

  it("getowner", function() {
    expect(memt.getowner('file1111')).to.deep.equal(['b33']);
  });

  it("getfilename", function() {
    expect(memt.getname('file1111')).to.equal("888.png");
  });

  it("getfoldername", function() {
    expect(memt.getname('root123456')).to.equal("555");
  });

  it("size", function() {
    expect(memt.size()).to.equal(2);
  });

  it("has--false", function() {
    expect(memt.has('1234')).to.equal(false);
  });

  it("has--true", function() {
    expect(memt.has('root123456')).to.equal(true);
  });

  it("get", function() {
    var mtobj = {
    hash : "",
    uuid : "root123456",
    type : "folder",
    parent : "",
    children : ["file1111"],
    attribute : {changetime : "111111111111",
                modifytime : "222222222222",
                createtime : "333333333333",
                size : "4444",
                name : "555"},
    permission : {readlist : ["a11"],
                  writelist : ["a22"],
                  owner: ["a33"]}}
    expect(memt.get('root123456')).to.deep.equal(mtobj);
  });

  it("setchildren", function() {
    expect(memt.getchildren('file1111')).to.deep.equal(['file2222']);
    memt.setchildren('file1111',['file3333'])
    expect(memt.getchildren('file1111')).to.deep.equal(['file3333']);
  });

  it("gethash", function() {
    expect(memt.gethash('file1111')).to.equal("012345");
    memt.sethash('file1111','54321');
    expect(memt.gethash('file1111')).to.equal("54321");
  });

  it("setname", function() {
    expect(memt.getname('file1111')).to.equal("888.png");
    memt.setname('file1111','7777.png');
    expect(memt.getname('file1111')).to.equal("7777.png");
  });

  it("remove", function() {
    var mtobj = {
    hash : "",
    uuid : "root123456",
    type : "folder",
    parent : "",
    children : ["file1111"],
    attribute : {changetime : "111111111111",
                modifytime : "222222222222",
                createtime : "333333333333",
                size : "4444",
                name : "555"},
    permission : {readlist : ["a11"],
                  writelist : ["a22"],
                  owner: ["a33"]}}
    memt.remove('file1111');
    expect(memt.size()).to.equal(1);
    expect(memt.has('file1111')).to.equal(false);
    expect(memt.has('root123456')).to.equal(true);
    expect(memt.get('root123456')).to.deep.equal(mtobj);
  });

  it("addchild", function() {
    expect(memt.getchildren('file1111')).to.deep.equal(['file2222']);
    memt.addchild('file1111','file3333');
    expect(memt.getchildren('file1111')).to.deep.equal(['file2222','file3333']);
  });
});