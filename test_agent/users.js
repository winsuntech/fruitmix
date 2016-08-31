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
  
  let token  

    let User
  const requestToken = (callback) => {
    User = models.getModel('user') 
    request(app)
      .get('/token')
      .auth(User.collection.list[0].uuid, '11223341')
      .set('Accept', 'application/json')
      .end((err, res) => callback(res.body.token))
  } 

  beforeEach((done) => {
    requestToken((token1) => {
    token=token1
    done()
    }) 
  })


  describe('GET /users', () => {
    /*
    it('return unauthorized when token is not provided', (done) => {
      request(app)
        .get('/users')
        .set('Accept', 'application/json')
        .expect(401)
        .end((err, res) => { 
           if(err) return done(err);
           done();
         })
    })*/
   /* 
    it('return empty set when no user exists', (done) => {
      request(app)
        .get('/users')
        .set('Authorization', 'JWT ' + token)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => { 
           if(err) return done(err);
           expect(res.body).to.deep.equal([]);
           done();
         })
    })
    */
    it('return full set when user exists', (done) => {
        request(app)
          .get('/users')
          .set('Authorization', 'JWT ' + token)
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => { 
             if(err) return done(err);
             expect(res.body).to.deep.equal([{'avatar':'', 'email':'aaa@bbb.com', 'username':'u1', 'uuid':User.collection.list[0].uuid, 'isAdmin':true, 'isFirstUser':true, 'type':'user'} ]);
             done();
           })
    })
  })
  
  /*
  describe('POST /users', () => {
    
    beforeEach((done) => {
      UserModel.data.createUser(createData)
      .then(()=>done())
    })

    it('successfully add a user', (done) => {
      let f2;
      request(app)
        .post('/users')
        .set('Accept', 'application/json')
        .send({'username':'u2', 'email':'bbb@ccc.com', 'password':'111111'})
        .expect(200)
        .end((err, res) => {
          if(err) return done(err)
          f2() 
        })
      f2=() => {
        request(app)
          .get('/users')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => { 
             if(err) return done(err);
             expect(res.body).to.deep.equal([{'avatar':'', 'email':'aaa@bbb.com', 'username':'u1', 'uuid':UserModel.data.collection.list[0].uuid}, {'avatar':'', 'email':'bbb@ccc.com', 'username':'u2', 'uuid':UserModel.data.collection.list[1].uuid}]);
             done();
           })
      }
    })
  })

  
  describe('DELETE /users', () => {
    
    let createData2={username:"u2", "password":"111111", "avatar":"", "email":"bbb@ccc.com", "isAdmin":false, "type":""}  
    
    beforeEach((done) => {
      UserModel.data.createUser(createData)
      .then(()=> UserModel.data.createUser(createData2))
      .then(()=>done())
    })


    it('successfully delete a user', (done) => {
      let f2;
      request(app)
        .delete('/users')
        .set('Accept', 'application/json')
        .send({'uuid':UserModel.data.collection.list[1].uuid})
        .expect(200)
        .end((err, res) => {
          if(err) return done(err)
          f2() 
        })
      f2=() => {
        request(app)
          .get('/users')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => { 
             if(err) return done(err);
             expect(res.body).to.deep.equal([{'avatar':'', 'email':'aaa@bbb.com', 'username':'u1', 'uuid':UserModel.data.collection.list[0].uuid}]);
             done();
           })
      }
    })
  })
*/
})

