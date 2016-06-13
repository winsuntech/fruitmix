
var expect = require('chai').expect;
var assert = require('chai').assert;

var request = require('supertest');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var app = require('app');
var User = require('mongoose').model('User');
var Document = require('mongoose').model('Document');
var Documentlink = require('mongoose').model('Documentlink');
var Photolink = require('mongoose').model('Photolink');


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

    Document.remove({},function(err){
      if (err) throw err;
      var data = { 
        "hash" : "111111",
        "data" : {
                "lastmodifytime": 1462529113345,
                "createtime": 1462529113345,
                "owner": "c31a2e99-987d-4f65-9559-22e22ff603da",
                "permission": "public",
                "kind": "media",
                "content": [
                  "7011699f45568860aee5e2d8ed6bdc6530519ce354da9fdabac30bc5f73ead38"
                ]
                }
      }
      var document = new Document(data);
      document.save();
    });

    Documentlink.remove({},function(err){
      if (err) throw err;
      var data = { 
        "uuid" : "333333",
        "dhashlist" : ["111111"]
      }
      var documentlink = new Documentlink(data);
      documentlink.save();
    });

    Photolink.remove({},function(err){
      if (err) throw err;
      var data = { 
        "uuid" : "444444",
        "photohash":"555555"
      }
      var photolink = new Photolink(data);
      photolink.save();
    });
  });

  after(function(){
    //spawn('bash', ['/trynode/CreateFilesFolderWithxattr.sh','/mnt']);
  });

  it("GET /document should return 200", function(done) {
    request(app)
      .get('/document')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200, [{uuid:"333333",lhash:"111111"}],done);
  });

  it("GET /document/333333?type=listdetail should return 200 ", function(done) {
    request(app)
      .get('/document/333333?type=listdetail')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200, { 
                hash : "111111",
                data : {
                  "lastmodifytime": 1462529113345,
                  "createtime": 1462529113345,
                  "owner": "c31a2e99-987d-4f65-9559-22e22ff603da",
                  "permission": "public",
                  "kind": "media",
                  "content": [
                    "7011699f45568860aee5e2d8ed6bdc6530519ce354da9fdabac30bc5f73ead38"
                  ]
                }
      },done);
  });

  it("GET /document/333333?type=photo should return 404 if missing target ", function(done) {
    request(app)
      .get('/document/333333?type=photo')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404, done);
  });

  it("GET /document/333333?type=photo&target=2323 should return 404 if target is invalid", function(done) {
    request(app)
      .get('/document/333333?type=photo&target=2323')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404, done);
  });

  it("GET /document/?type=photo should return 200 if success", function(done) {
    request(app)
      .get('/document/?type=photo')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200, [{ 
              uuid : "444444",
              photohash : "555555"
      }],done);
  });

  // it("GET /document should return a file if success", function(done) {
  //   request(app)
  //     .get('/document')
  //     .set('Accept', 'application/json')
  //     .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
  //     .expect('Content-Type','text/plain')
  //     .expect(200, done);
  // });

  it("POST /document should return 200", function(done) {
    request(app)
      .post('/document')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"content":"a"}')
      .expect(200,done);
  });

  it("POST /document/333333 should return 200", function(done) {
    request(app)
      .post('/document/333333')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"content":"a"}')
      .expect(200, done);
  });

  it("POST /document/444 should return 404 if uuid is invalid", function(done) {
    request(app)
      .post('/document/444')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"content":"a"}')
      .expect(404, done);
  });
});






