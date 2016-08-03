import fs from 'fs'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import request from 'supertest'

import app from 'src/app'
import models from 'src/models/models'

import { createUserModelAsync } from 'src/models/userModel'

describe('test init when no user exists (first time)', function() {

  beforeEach(function(done) {
    mkdirp('tmptest', err => {
      if (err) return done(err)
      rimraf('tmptest/users.json', err => {
        if (err) return done(err)
        createUserModelAsync('tmptest/users.json', 'tmptest')
          .then(mod => {
            models.setModel('user', mod)
            done()
          }) 
          .catch(e => {
            done(e)
          })
      })
    })
  })
  
  it('GET /init should 404', function(done) {
    request(app)
      .get('/init')
      .set('Accept', 'application/json')
      .expect(404, done)
  })

  it('POST /init without username should fail with 400', function(done) {
    request(app)
      .post('/init')
      .send({ password: 'world' })
      .set('Accept', 'application/json')
      .expect(400, done) 
  })

  it('POST /init without password should fail with 400', function(done) {
    request(app)
      .post('/init')
      .send({ username: 'hello'})
      .set('Accept', 'application/json')
      .expect(400, done)
  })

  it('POST /init with username / password should success', function(done) {
    request(app)
      .post('/init')
      .send({ username: 'hello', password: 'world' })
      .set('Accept', 'application/json')
      .expect(200, done)
  })
})

describe('test init when user exists', function() {
 
  let users = [
    {
      'uuid': '9f93db43-02e6-4b26-8fae-7d6f51da12af',
      'username': 'hello',
      'password': '$2a$10$0kJAT..tF9IihAc6GZfKleZQYBGBHSovhZp5d/DiStQUjpSMnz8CC',
      'avatar': null,
      'email': null,
      'isFirstUser': true,
      'isAdmin': true,
      'type': 'user'
    }
  ]
  
  beforeEach(function(done) {
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

  it('GET /init should 404', function(done){
    request(app)
      .get('/init')
      .set('Accept', 'application/json')
      .expect(404, done) 
  })

  it('POST /init should fail with 404', function(done){
    request(app)
      .post('/init')
      .set('Accept', 'application/json')
      .send({ username: 'hello', password: 'world' })
      .expect(404, done)
  })
})






