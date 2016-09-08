import path from 'path'
import rimraf from 'rimraf'
import request from 'supertest'
import fs from 'fs'
import app from 'src/app'
import models from 'src/models/models'
import { expect } from 'chai'
const UserModel = require('src/models/userModel')
import Models from 'src/models/models'  
import Promise from 'bluebird'


describe(path.basename(__filename), function() {
  
  let createData={username:"u1", "password":"1122334", "avatar":"", "email":"aaa@bbb.com", "isAdmin":false, "type":""}  

  describe('GET /login', () => {
    it('return empty set when no user exists', (done) => {
      let User = Models.getModel('user')
      User.deleteUser("9f93db43-02e6-4b26-8fae-7d6f51da12af")
       .then((r) => {
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
    })
    
    it('return full set when user exists', (done) => {
      let User = Models.getModel('user')
      User.createUser(createData).then(()=>{
        request(app)
          .get('/login')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => { 
             if(err) return done(err);
             expect(res.body).to.deep.equal([{'avatar':'', 'username':'u1', 'uuid':User.collection.list[0].uuid}]);
             done();
           })
      })
    })
  })

})

