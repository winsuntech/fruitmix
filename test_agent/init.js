var expect = require('chai').expect;
var assert = require('chai').assert;

var request = require('supertest');

var app = require('src/app');
var User = require('mongoose').model('User');

describe("test init when no user exists (first time)", function() {
  
  beforeEach(function(done){
    User.remove({}, done);
  });

  it("GET /init should 404", function(done) {
    request(app)
      .get('/init')
      .set('Accept', 'application/json')
      .expect(404, done);
  });

  it("POST /init without username should fail with 400", function(done) {
    request(app)
      .post('/init')
      .send({ password: 'world' })
      .set('Accept', 'application/json')
      .expect(400, done); 
  });

  it("POST /init without password should fail with 400", function(done) {
    request(app)
      .post('/init')
      .send({ username: 'hello'})
      .set('Accept', 'application/json')
      .expect(400, done);
  });

  it("POST /init with username / password should success", function(done) {
    request(app)
      .post('/init')
      .send({ username: 'hello', password: 'world' })
      .set('Accept', 'application/json')
      .expect(200, done);
  });
});

describe('test init when user exists', function() {

  beforeEach(function(done){
    User.remove({}, function(err){
      if (err) throw err;
      var userObj = { 
        "uuid" : "5b9258b8-ecc9-414d-bd76-b806c27400d6",
        "username" : "hello", 
        "password" : "world", 
        "avatar" : "defaultAvatar.jpg", 
        "isAdmin" : true, 
        "isFirstUser" : true, 
        "type" : "user"
      }
      var user = new User(userObj);
      user.save(done);
    });
  });

  it("GET /init should 404", function(done){
    request(app)
      .get('/init')
      .set('Accept', 'application/json')
      .expect(404, done); 
  });

  it("POST /init should fail with 403", function(done){
    request(app)
      .post('/init')
      .set('Accept', 'application/json')
      .send({ username: 'hello', password: 'world' })
      .expect(403, done);
  });
});






