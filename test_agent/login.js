import rimraf from 'rimraf'
import request from 'supertest'
import fs from 'fs'
import app from 'src/app'
import models from 'src/models/models'
import { expect } from 'chai'
const UserModel = require('src/models/userModel')
import Promise from 'bluebird'


describe("src/routes/users.js", function() {
  
  let createData={username:"u1", "password":"1122334", "avatar":"", "email":"aaa@bbb.com", "isAdmin":false, "type":""}  
  

  beforeEach((done) => {
    fs.unlink('aaa', (e) => {
      UserModel.createUserModelAsync("aaa", "bbb").then((r)=>{ 
        UserModel.data=r
        done() 
      })
    })
  })


  describe('GET /login', () => {
    it('return empty set when no user exists', (done) => {
      request(app)
        .get('/login')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => { 
           if(err) return done(err);
           expect(res.body).to.deep.equal([]);
           done();
         })
    })
    
    it('return full set when user exists', (done) => {
      UserModel.data.createUser(createData).then(()=>{
        request(app)
          .get('/login')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => { 
             if(err) return done(err);
             expect(res.body).to.deep.equal([{'avatar':'', 'username':'u1', 'uuid':UserModel.data.collection.list[0].uuid}]);
             done();
           })
      })
    })
  })

})

