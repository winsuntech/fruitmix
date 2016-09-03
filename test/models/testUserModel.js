import path from 'path'
const UserModel=require("../../src/models/userModel.js")
import { expect } from 'chai'
const sinon = require ('sinon')
import Promise from 'bluebird'
const child_process=require('child_process')
const Collection=require('../../src/models/collection.js')
import fs from 'fs'
import UUID from 'node-uuid'


describe(path.basename(__filename), function() {
  
  let myUserModel;  
  let createData={username:"u1", "password":"1122334", "avatar":"", "email":"aaa@bbb.com", "isAdmin":false, "type":""}

  beforeEach(function(done) {
    (async () => {
      myUserModel=await UserModel.createUserModelAsync("aaa", "bbb"); 
    })().then(()=>done(), (r)=>done())
  })
  
  afterEach(function(done) {
    fs.unlink("aaa", (r) => {done()});
  }) 
  
  describe('createUserModelAsync(...)', function() {  
    it('collections should be of Collection type', function(done) {
      expect(myUserModel.collection.filepath).to.equal("aaa");
      expect(myUserModel.collection.tmpfolder).to.equal("bbb");
      expect(myUserModel.collection.list).to.be.deep.equal([]);
      expect(myUserModel.collection.locked).to.equal(false);
      
      //expect(myUserModel.collection).to.be.an.instanceof(Collection.Collection);
      done();
    })
  })

  describe('createUser(...)', function(done) {  
    
    
    beforeEach(function(done) {
      (async () => {
        myUserModel=await UserModel.createUserModelAsync("aaa", "bbb"); 
      })().then(()=>done(), (r)=>done())
    })
  
    afterEach(function(done) {
      fs.unlink("aaa", (r) => {done()});
    }) 


    it('should report an error when username is not a string', function(done) {
      (async () => {
	let createData2=Object.assign({},createData);
        createData2.username=1;
        await myUserModel.createUser(createData2);
      })().then(()=>done(new Error()), (r)=>done())
    })
    

    it('should report an error when password is not a string', function(done) {
      (async () => {
	let createData2=Object.assign({},createData);
        createData2.password=1;
        await myUserModel.createUser(createData2);
      })().then(()=>done(new Error()), (r)=>done())
    })
    
    it('should report an error when password is empty', function(done) {
      (async () => {
	let createData2=Object.assign({},createData);
        createData2.password='';
        await myUserModel.createUser(createData2);
      })().then(()=>done(new Error()), (r)=>done())
    })
    
    it('should report an error when email is invalid', function(done) {
      (async () => {
	let createData2=Object.assign({},createData);
        createData2.email='aaa333';
        await myUserModel.createUser(createData2);
      })().then(()=>done(new Error()), (r)=>done())
    })

    it('should report an error when isAdmin is not a bool value', function(done) {
      (async () => {
	let createData2=Object.assign({},createData);
        createData2.isAdmin='aa';
        await myUserModel.createUser(createData2);
      })().then(()=>done(new Error()), (r)=>done())
    })
    
    it('should report an error when type is a string other than device', function(done) {
      (async () => {
	let createData2=Object.assign({},createData);
        createData2.type='aa';
        await myUserModel.createUser(createData2);
      })().then(()=>done(new Error()), (r)=>done())
    })
    
    it('should report an error when collection is busy', function(done) {
      (async () => {
        myUserModel.collection.locked=true
        await myUserModel.createUser(createData);
      })().then(()=>done(new Error()), (r)=>done())
    })
    
    it('always set the first user as an admin ', function(done) {
      (async () => {
        sinon.spy(myUserModel.collection, 'updateAsync');
        await myUserModel.createUser(createData);
        let newUser=myUserModel.collection.updateAsync.firstCall.args[1][0];
        expect(newUser.isFirstUser).to.be(true);
        expect(newUser.isAdmin).to.be(true);
        myUserModel.collection.updateAsync.restore();
      })().then(()=>done(new Error()), (r)=>done())
    })
    
    it('never set the second user as an admin ', function(done) {
      (async () => {
        sinon.spy(myUserModel.collection, 'updateAsync');
        await myUserModel.createUser(createData);
        await myUserModel.createUser(Object.assign({}, createData, {'username':'second'}));
        let secondUser=myUserModel.collection.updateAsync.getCall(1).args[1][1];
        expect(secondUser.isFirstUser).to.be(false);
        expect(secondUser.isAdmin).to.be(false);
        myUserModel.collection.updateAsync.restore();
      })().then(()=>done(new Error()), (r)=>done())
    })
  })
  
   
  describe('verifyPassword(...)', function() {  
    it('should return user when user-pin pair is correct' , function(done) {
      (async () => {
        sinon.stub(UUID, 'v4').returns('11111111-1111-1111-1111-111111111111')
        await myUserModel.createUser(createData);
        let user=await myUserModel.verifyPassword('11111111-1111-1111-1111-111111111111', '1122334');
        expect(user).not.to.be.null;
        UUID.v4.restore();
      })().then(()=>done(), (r)=>done(r))
    })
    
   it('should return null when user does NOT exist' , function(done) {
      (async () => {
        let user=await myUserModel.verifyPassword('21111111-1111-1111-1111-111111111111', '1122334');
        expect(user).to.be.null;
      })().then(()=>done(), (r)=>done(r))
    })
   
  it('should return null when pass is wrong' , function(done) {
      (async () => {
        let user=await myUserModel.verifyPassword('11111111-1111-1111-1111-111111111111', '2122334');
        expect(user).to.be.null;
      })().then(()=>done(), (r)=>done(r))
    })
  })
  
})

