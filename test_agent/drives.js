import path from 'path'
import Promise from 'bluebird'

import app from 'src/app'
import models from 'src/models/models'
import { createUserModelAsync } from 'src/models/userModel'
import request from 'supertest'
import { mkdirpAsync, rimrafAsync, fs } from 'test/util/async'

let users = [
  {
    'uuid': '9f93db43-02e6-4b26-8fae-7d6f51da12af',
    'username': 'hello',
    'password': '$2a$10$0kJAT..tF9IihAc6GZfKleZQYBGBHSovhZp5d/DiStQUjpSMnz8CC',
    'avatar': null,
    'email': null,
    'isFirstUser': true,
    'isAdmin': true,
  }
]

const requestToken = (callback) => {

  request(app)
    .get('/token')
    .auth('9f93db43-02e6-4b26-8fae-7d6f51da12af', 'world')
    .set('Accept', 'application/json')
    .end((err, res) => err ? callback(err) : callback(null, res.body.token))
}

const requestTokenAsync = Promise.promisify(requestToken)

describe(path.basename(__filename) + ': impromptu', function() {
  
  let token

  beforeEach(function() {
    return (async () => {
      await rimrafAsync('tmptest')
      await mkdirpAsync('tmptest')
      await fs.writeFileAsync('tmptest/users.json', JSON.stringify(users, null, '  '))
      let umod = await createUserModelAsync('tmptest/users.json', 'tmptest')
      models.setModel('user', umod)
      token = await requestTokenAsync()
    })()     
  })

  it('GET /drives', function(done) {
    request(app)
      .get('/drives')
      .set('Authorization', 'JWT ' + token)
      .set('Accept', 'applicatoin/json')
      .expect(200, done)
  })
})
