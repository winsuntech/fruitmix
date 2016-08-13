import fs from 'fs'
import request from 'supertest'
import { expect } from 'chai'

import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import app from 'src/app'
import models from 'src/models/models'

import { createUserModelAsync } from 'src/models/userModel' 

let users = [
  {
    'uuid': '9f93db43-02e6-4b26-8fae-7d6f51da12af',
    'username': 'hello',
    'password': '$2a$10$0kJAT..tF9IihAc6GZfKleZQYBGBHSovhZp5d/DiStQUjpSMnz8CC',
    'avatar': 'I am a avatar',
    'email': null,
    'isFirstUser': true,
    'isAdmin': true,
  },
  {
    'uuid': '9f93db43-02e6-4b26-8fae-7d6f51da12af',
    'username': 'hello',
    'password': '$2a$10$0kJAT..tF9IihAc6GZfKleZQYBGBHSovhZp5d/DiStQUjpSMnz8CC',
    'avatar': 'I am a avatar',
    'email': null,
    'isAdmin': true,
  }
]

describe('test login when no user exists', function() {

  before(function(done) {
    mkdirp('tmptest', err => {
      if (err) return done(err)
      fs.writeFile('tmptest/users.json', '[]', err => {
        if (err) return done(err)
        createUserModelAsync('tmptest/users.json', 'tmptest')
          .then(mod => {
            models.setModel('user', mod)
            done()
          })
          .catch(e => done(e))
      })
    })
  })

  it('GET /login should get empty array', function(done){
    // done(new Error('not implemented'))
    request(app)
      .get('/login')
      .set('Accept', 'application/json')
      .expect(200)
      .expect((res) => {
        expect(res.body).to.deep.equal([]) 
      })
      .end(done)
  })
})

describe('test login one user exists', function() {
  
  before(function(done) {
    mkdirp('tmptest', err => {
      if (err) return done(err)
      fs.writeFile('tmptest/users.json', JSON.stringify(users.slice(0,1), null, '  '), err => {
        if (err) return done(err)
        createUserModelAsync('tmptest/users.json', 'tmptest')
          .then(mod => {
            models.setModel('user', mod)
            done() 
          })
          .catch(e => done(e))
      })
    })
  })

  it('should return info of one user', function(done) {
    request(app)
      .get('/login')
      .set('Accept', 'application/json')
      .expect(200)    
      .expect((res) => {
        expect(res.body).to.be.an('array')
        expect(res.body.length).to.equal(1)
        expect(res.body[0].uuid).to.equal(users[0].uuid)
        expect(res.body[0].username).to.equal(users[0].username)
        expect(res.body[0].avatar).to.equal(users[0].avatar)
      })
      .end(done)
  })
})

describe('test login two users exist', function() {

  before(function(done) {
    mkdirp('tmptest', err => {
      if (err) return done(err)
      fs.writeFile('tmptest/users.json', JSON.stringify(users, null, '  '), err => {
        if (err) return done(err)
        createUserModelAsync('tmptest/users.json', 'tmptest')
          .then(mod => {
            models.setModel('user', mod)
            done() 
          })
          .catch(e => done(e))
      })
    })
  })

  it('should return info of two users', function(done) {
    request(app)
      .get('/login')
      .set('Accept', 'application/json')
      .expect(200)    
      .expect((res) => {
        expect(res.body).to.be.an('array')
        expect(res.body.length).to.equal(2)
        expect(res.body[0].uuid).to.equal(users[0].uuid)
        expect(res.body[0].username).to.equal(users[0].username)
        expect(res.body[0].avatar).to.equal(users[0].avatar)
        expect(res.body[1].uuid).to.equal(users[1].uuid)
        expect(res.body[1].username).to.equal(users[1].username)
        expect(res.body[1].avatar).to.equal(users[1].avatar)
      })
      .end(done)
  })
})

