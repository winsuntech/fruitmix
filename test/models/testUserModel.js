import path from 'path'

import { rimrafAsync, mkdirpAsync, fs } from 'src/util/async'
import { createUserModelAsync } from 'src/models/userModel'
import filter from 'filter-object'

const UserModel=require("../../src/models/userModel.js")
import { expect } from 'chai'
const sinon = require ('sinon')
import Promise from 'bluebird'
const child_process=require('child_process')
const Collection=require('../../src/models/collection.js')
import UUID from 'node-uuid'


describe(path.basename(__filename), function() {

  const cwd = process.cwd()
  
  let myUserModel  
  let createData = {
    username:"u1", 
    "password":"1122334", 
    "avatar":"", 
    "email":"aaa@bbb.com", 
    "isAdmin":false, 
    "type":""
  }

  describe('test createUserModel', function(done) {

    beforeEach(() => (async () => {
      await rimrafAsync('tmptest')          
      await mkdirpAsync('tmptest/tmp')
    })())

    it('should create a user model with empty colletion and given paths', function(done) {

      let fpath = path.join(cwd, 'tmptest', 'users.json')
      let tmpdir = path.join(cwd, 'tmptest', 'tmp')

      createUserModelAsync(fpath, tmpdir)
        .then(umod => {
          let col = umod.collection  
          expect(col.filepath).to.equal(fpath)
          expect(col.tmpfolder).to.equal(tmpdir)
          expect(col.list).to.deep.equal([])
          done()
        })
        .catch(e => done(e))
    })
  })

  describe('test creating first user', function(done) {  

    const fakeUUID = '99f5644b-9588-47bc-a0e2-b57be75e25cd' 
    let umod 

    let inputMinimal = {
      type: 'local',
      username: 'hello',
      password: 'world',
    }

    let inputSmb = {
      type: 'local',
      username: 'foo',
      password: 'bar',
    }

    beforeEach(() => (async () => {
      const fpath = path.join(cwd, 'tmptest', 'users.json')
      const tmpdir = path.join(cwd, 'tmptest', 'tmp')
      await rimrafAsync('tmptest')
      await mkdirpAsync('tmptest/tmp')
      umod = await createUserModelAsync(fpath, tmpdir) 
    })())

    it('should keep type, username, (input minimal)', function(done) {
      umod.createUser(inputMinimal, (err, user) => {
        if (err) return done(err)
        const f = ['type', 'username']
        expect(filter(user, f)).to.deep.equal(filter(inputMinimal, f))
        done()
      })
    })

    it('should have smbUsername, smbPassword, smbLastChangeTime, avatar, email, as null (input minimal)', function(done) {
      umod.createUser(inputMinimal, (err, user) => {
        expect(user.smbUsername).to.be.null
        expect(user.smbPassword).to.be.null
        expect(user.smbLastChangeTime).to.be.null
        expect(user.avatar).to.be.null
        expect(user.email).to.be.null
        done()
      })
    })

    it('should have uuid as faked (input minimal)', function(done) {

      sinon.stub(UUID, 'v4').returns(fakeUUID)
      umod.createUser(inputMinimal, (err, user) => {
        if (err) {
          UUID.v4.restore()
          return done(err)
        }
        expect(user.uuid).to.equal(fakeUUID)
        UUID.v4.restore()
        done()
      })
    })

    it('should be firstUser and admin (input minimal)', function(done) {
      umod.createUser(inputMinimal, (err, user) => {
        if (err) return done(err)
        expect(user.isFirstUser).to.be.true
        expect(user.isAdmin).to.be.true
        done()
      })
    })

    it('should return an error if username is not a string', function(done) {
      let input = Object.assign({}, inputMinimal, { username: 123 }) 
      umod.createUser(input, (err, user) => {
        expect(err).to.be.an('error')
        done()
      })
    })

    it('should return an error if password is not a string', function(done) {
      let input = Object.assign({}, inputMinimal, { password: 123 }) 
      umod.createUser(input, (err, user) => {
        expect(err).to.be.an('error')
        done()
      })
    })
    
    it('should return an error if password is empty', function(done) {
      let input = Object.assign({}, inputMinimal, { password: '' }) 
      umod.createUser(input, (err, user) => {
        expect(err).to.be.an('error')
        done()
      })
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

