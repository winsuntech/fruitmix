var mongoose = require('mongoose');
var express = require('express');

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');

var validator = require('validator');

var Router = require('utils/mock').Router;
var Response = require('utils/mock').Response;

describe("unit testing routes/init.js", function() { 

  // mock User model
  var User = function(doc) {
    this.doc = doc;
  };

  // mock router
  var router = new Router();
  var r, res;

  // stub mongoose.model() and express.Router()
  before(function() {
    sinon.stub(mongoose, 'model', function(model) {
      expect(model).to.equal('User');
      return User;
    });
    sinon.stub(express, 'Router', () => router);
    r = require('routes/init.js');
    assert(r === router);
  });

  after(function() {
    mongoose.model.restore(); 
    express.Router.restore();
  });

  beforeEach(function() {
    User.count = null;
    User.prototype.save = null;
    res = new Response();
  });

  it("should response 500 if User count error", function() {

    User.count = (obj, callback) => { callback(new Error()); }
    r.test('post', '/', {}, res);  
    expect(res.code).to.equal(500);
  });

  it("should response 403 if User exists", function() {

    User.count = function(obj, callback) { callback(null, 100); }
    r.test('post', '/', {}, res);
    expect(res.code).to.equal(403);
  });

  it("should response 400 if username missing", function() {
    
    User.count = function(obj, callback) { callback(null, 0); }
    r.test('post', '/', { body: {} }, res);
    expect(res.code).to.equal(400);
  });

  it("should response 400 if username string length zero", function() {
    
    User.count = function(obj, callback) { callback(null, 0); }
    r.test('post', '/', { body: { username: ''}}, res);
    expect(res.code).to.equal(400);
  });

  it("should response 400 if password missing", function() {
    
    User.count = function(obj, callback) { callback(null, 0); }
    r.test('post', '/', { body: { username: 'xyz'}}, res);
    expect(res.code).to.equal(400); 
  });

  it("should response 400 if password string length zero", function() {

    User.count = function(obj, callback) { callback(null, 0); }
    r.test('post', '/', { body: { username: 'xyz', password: '' }}, res);
    expect(res.code).to.equal(400);
  });

  it("should response 500 if fail to save new user", function() {
    
    User.count = function(obj, cb) { cb(null, 0); }
    User.prototype.save = function(cb) { cb(new Error()); } 
    r.test('post', '/', { body: { username: 'hello', password: 'world' }}, res);
    expect(res.code).to.equal(500);
  });

  it("should response 200 if success", function() {

    var doc;
    User.count = function(obj, cb) { cb(null, 0); }
    User.prototype.save = function(cb) { doc = this.doc; cb(null); }
    r.test('post', '/', { body: { username: 'hello', password: 'world' }}, res);
    expect(res.code).to.equal(200);
    expect(doc.isFirstUser).to.equal(true);
    expect(doc.isAdmin).to.equal(true);
    expect(doc.avatar).to.be.a('string');
    expect(doc.username).to.be.equal('hello');
    expect(validator.isUUID(doc.uuid)).to.be.true; 
  }); 
});




