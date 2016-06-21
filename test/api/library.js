
var expect = require('chai').expect;
var assert = require('chai').assert;

var request = require('supertest');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var app = require('app');
var User = require('mongoose').model('User');

describe("test files", function() {
  beforeEach(function(done){
    User.remove({}, function(err){
      if (err) throw err;
      var userObj = { 
        "uuid" : "c31a2e99-987d-4f65-9559-22e22ff603da",
        "username" : "admin", 
        "password" : "123456", 
        "avatar" : "defaultAvatar.jpg", 
        "isAdmin" : true, 
        "isFirstUser" : true, 
        "type" : "user"
      }
      var user = new User(userObj);
      user.save(done);
    });
  });

  after(function(){
    //spawn('bash', ['/trynode/CreateFilesFolderWithxattr.sh','/mnt']);
  });

  it("POST /library should return 400 if uuid is missing", function(done) {
    request(app)
      .post('/library/?hash=12313123213')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(400, done);
  });

  it("POST /library should return 400 if hash is missing", function(done) {
    request(app)
      .post('/library/1234123123')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(400, done);
  });

  it("POST /library should return 400 if post without a file", function(done) {
    request(app)
      .post('/library')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(function(res){
        console.log(res.body);
      })
      .expect(400, done);
  });

  it("POST /library should return 200 if success", function(done) {
    request(app)
      .post('/library/1111111111111?hash=22222222222')
      .attach('file','/trynode/ts.js')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200, done);
  });
});





