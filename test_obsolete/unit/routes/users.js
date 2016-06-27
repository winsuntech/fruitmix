var mongoose = require('mongoose');
var express = require('express');
var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');

var validator = require('validator');

var Router = require('utils/users').Router;
var Response = require('utils/users').Response;

describe("unit testing routes/users.js", function() { 

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

    r = require('routes/users.js');
    assert(r === router);
  });

  after(function() {
    mongoose.model.restore(); 
    express.Router.restore();
  });

  beforeEach(function() {
    User.find = null;
    User.prototype.save = null;
    User.remove = null;
    User.update = null;
    res = new Response();
  });

  it("should response 500 if User find error------get", function() {

    User.find = (obj, tags ,callback) => { callback(new Error()); }
    r.test('get', '/', '',{}, res);  
    expect(res.code).to.equal(500);
  });

  it("should response 200 if found User------get", function() {
    User.find = (obj, tags ,callback) => { callback(null,[{'username':'a','uuid':'a','avatar':'a','email':'a','isAdmin':'a','isFirstUser':'a','type':'a'}])}
    r.test('get', '/', '',{}, res);  
    expect(res.code).to.equal(200);
  });

  it("should response 403 if user is not an admin------post", function() {
    r.test('post', '/', '',{user:{isAdmin:false}}, res);  
    expect(res.code).to.equal(403);
  });

  it("should response 403 if isAdmin field is missing------post", function() {
    r.test('post', '/', '',{user:{}}, res);  
    expect(res.code).to.equal(403);
  });

  it("should response 500 if fail to save new user------post", function() {
    User.prototype.save = function(cb) { cb(new Error()); } 
    r.test('post', '/','', { user:{isAdmin:true},body: { username: 'aaaa', password: 'bbbb' }}, res);
    expect(res.code).to.equal(500);
  });

  it("should response 200 if success------post", function() {
    var doc;
    User.prototype.save = function(cb) { doc = this.doc; cb(null); }
    r.test('post', '/','', { user:{isAdmin:true},body: { username: 'hello', password: 'world',isAdmin:true,isFirstUser:false}}, res);
    expect(res.code).to.equal(200);
    expect(doc.isFirstUser).to.equal(false);
    expect(doc.isAdmin).to.equal(true);
    expect(doc.username).to.be.equal('hello');
    expect(validator.isUUID(doc.uuid)).to.be.true; 
  }); 

  it("should response 403 if user is not an admin------delete", function() {
    r.test('delete', '/', '',{user:{isAdmin:false}}, res);  
    expect(res.code).to.equal(403);
  });

  it("should response 403 if isAdmin field is missing------delete", function() {
    r.test('delete', '/', '',{user:{}}, res);  
    expect(res.code).to.equal(403);
  });

  it("should response 400 if uuid field is missing------delete", function() {
    User.remove = function(obj,cb) { cb(new Error()); } 
    r.test('delete', '/','', { user:{isAdmin:true},body:{}}, res);
    expect(res.code).to.equal(400);
  });

  it("should response 500 if fail to delete user------delete", function() {
    User.remove = function(obj,cb) { cb(new Error()); } 
    r.test('delete', '/','', { user:{isAdmin:true},body:{uuid:'aaaa'}}, res);
    expect(res.code).to.equal(500);
  });

  it("should response 200 if success------delete", function() {
    User.remove = function(obj,cb) { cb(null,null); }
    r.test('delete', '/','', { user:{isAdmin:true},body:{uuid:'aaaa'}}, res);
    expect(res.code).to.equal(200);
  });

  it("should response 403 if user is not an admin------patch", function() {
    r.test('patch', '/', '',{user:{isAdmin:false}}, res);  
    expect(res.code).to.equal(403);
  });

  it("should response 403 if isAdmin field is missing------patch", function() {
    r.test('patch', '/', '',{user:{}}, res);  
    expect(res.code).to.equal(403);
  });

  it("should response 400 if uuid field is missing------patch", function() {
    User.update = function(obj,tags,cb) { cb(new Error()); } 
    r.test('delete', '/','', { user:{isAdmin:true},body:{}}, res);
    expect(res.code).to.equal(400);
  });

  it("should response 500 if fail to update user------patch", function() {
    User.update = function(obj,tags,cb) { cb(new Error()); } 
    r.test('patch', '/','', { user:{isAdmin:true},body:{uuid:'aaaa'}}, res);
    expect(res.code).to.equal(500);
  });

  it("should response 200 if success------patch", function() {
    var doc;
    User.update = function(obj,tags,cb) { cb(null); }
    r.test('patch', '/','', { user:{isAdmin:true},body: { uuid:'aaaa'}}, res);
    expect(res.code).to.equal(200);
  }); 
});




