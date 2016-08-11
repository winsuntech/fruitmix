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
    'type': 'user'
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
    done(new Error('not implemented'))
  })
})

describe('test login one user exists', function() {
  
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

  it('should return info of one user', function(done) {
    request(app)
      .get('/login')
      .set('Accept', 'application/json')
      .expect(200)    
      .expect((res) => {
        expect(res.body.uuid === users[0].uuid)
        expect(res.body.username === users[0].username)
        expect(res.body.avatar === users[0].avatar)
      })
      .end(done)
  })
})

describe('test login two users exist', function() {
  it('should return info of two users', function(done) {
    throw new Error('not implemented')
  })
})

describe('test login two users exist with one device user', function() {
  it('should return info of users with type of "user"', function(done) {
    throw new Error('not implemented')
  })
})


