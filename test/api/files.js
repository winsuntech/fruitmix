
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
    spawn('bash', ['/trynode/CreateFilesFolderWithxattr.sh','/mnt']);
  });

  it("GET /files should return 404 if uuid is invalid", function(done) {
    request(app)
      .get('/files/xx')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404, done);
  });

  it("GET /files should return 404 if target is invalid and type is media", function(done) {
    request(app)
      .get('/files/xxx?type=media')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404, done);
  });

  it("GET /files should return 501 if target is a folder and type is media", function(done) {
    request(app)
      .get('/files/88eb39b6-519f-46c2-ba3e-051079e9b6ac?type=media')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(501, done);
  });

  it("GET /files should return (root)200 if do not have an uuid", function(done) {
    request(app)
      .get('/files')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200, done);
  });

  it("GET /files should return 200 if success", function(done) {
    request(app)
      .get('/files/d03232a4-9b35-439f-b91b-ff20f6de6dc6')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200, done);
  });

  it("GET /files should return a file if success", function(done) {
    request(app)
      .get('/files/d03232a4-9b35-439f-b91b-ff20f6de6dc6?type=media')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect('Content-Type','text/plain')
      .expect(200, done);
  });

  it("POST /files should return 404 if uuid is invalid", function(done) {
    request(app)
      .post('/files/xx')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404, done);
  });

  it("POST /files should return 400 if target is a file", function(done) {
    request(app)
      .post('/files/ba6823f5-9e8c-47e9-abfd-84cb5d4253ab')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(400, done);
  });

  it("POST /files should return 403 if do not have permission", function(done) {
    request(app)
      .post('/files/88eb39b6-519f-46c2-ba3e-051079e9b6ac')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(403, done);
  });

  it("POST /files should return 400 if post without a file", function(done) {
    request(app)
      .post('/files/854237a4-3582-48c1-8420-4536fa4263c7')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(function(res){
        console.log(res.body);
      })
      .expect(400, done);
  });

  it("POST /files should return 200 if success", function(done) {
    request(app)
      .post('/files/854237a4-3582-48c1-8420-4536fa4263c7')
      .attach('file','/trynode/ts.js')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200, done);
  });

  it("PTACH /files should return 404 if uuid is invalid", function(done) {
    request(app)
      .patch('/files/xx')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404, done);
  });

  it("PTACH /files should return 403 if only send filename and do not have permission", function(done) {
    request(app)
      .patch('/files/6737651f-1420-4696-b6f7-76fba07d95b3')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"filename":"22.txt"}')
      .expect(403, done);
  });

  it("PTACH /files should return 200 if only send filename and have permission", function(done) {
    request(app)
      .patch('/files/ba6823f5-9e8c-47e9-abfd-84cb5d4253ab')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"filename":"22.txt"}')
      .expect(function(res){
        res.body='change name success';
      })
      .expect(200, done);
  });

  it("PTACH /files should return 400 if target is a file with permission and target uuid is vaild", function(done) {
    request(app)
      .patch('/files/7c6b9c6e-01cc-40d2-ad2b-249afef75891')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"ba6823f5-9e8c-47e9-abfd-84cb5d4253ab"}')
      .expect(function(res){
        res.body='can not move into a file';
      })
      .expect(400, done);
  });

  it("PTACH /files should return 404 if target is a file with permission and target uuid is invaild", function(done) {
    request(app)
      .patch('/files/7c6b9c6e-01cc-40d2-ad2b-249afef75891')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"xsaasdx"}')
      .expect(function(res){
        res.body='target folder is not exist';
      })
      .expect(404, done);
  });

  it("PTACH /files should return 403 if target is a folder without permission and target uuid is vaild", function(done) {
    request(app)
      .patch('/files/ba6823f5-9e8c-47e9-abfd-84cb5d4253ab')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"88eb39b6-519f-46c2-ba3e-051079e9b6ac"}')
      .expect(function(res){
        res.body='Permission denied!';
      })
      .expect(403, done);
  });

  it("PTACH /files should return 200 if target is a folder with permission and target uuid is vaild", function(done) {
    request(app)
      .patch('/files/ba6823f5-9e8c-47e9-abfd-84cb5d4253ab')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"854237a4-3582-48c1-8420-4536fa4263c7"}')
      .expect(function(res){
        res.body='success!';
      })
      .expect(200, done);
  });

  it("PTACH /files should return 400 if target is a file with permission and target uuid is vaild(rename+move)", function(done) {
    request(app)
      .patch('/files/7c6b9c6e-01cc-40d2-ad2b-249afef75891')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"ba6823f5-9e8c-47e9-abfd-84cb5d4253ab","filename":"33.txt"}')
      .expect(function(res){
        res.body='can not move into a file';
      })
      .expect(400, done);
  });

  it("PTACH /files should return 403 if target is a folder without permission and target uuid is vaild", function(done) {
    request(app)
      .patch('/files/ba6823f5-9e8c-47e9-abfd-84cb5d4253ab')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"88eb39b6-519f-46c2-ba3e-051079e9b6ac","filename":"33.txt"}')
      .expect(function(res){
        res.body='Permission denied!';
      })
      .expect(403, done);
  });

  it("PTACH /files should return 200 if target is a folder with permission and target uuid is vaild", function(done) {
    request(app)
      .patch('/files/ba6823f5-9e8c-47e9-abfd-84cb5d4253ab')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"7a7c1334-01f3-437d-8088-5e628afb6242","filename":"33.txt"}')
      .expect(function(res){
        res.body='success!';
      })
      .expect(200, done);
  });

  it("DELETE /files should return 404 if uuid is invalid", function(done) {
    request(app)
      .delete('/files/xx')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404, done);
  });

  it("DELETE /files should return 403 if do not have permission", function(done) {
    request(app)
      .delete('/files/88eb39b6-519f-46c2-ba3e-051079e9b6ac')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(function(res){
        res.body='Permission denied!';
      })
      .expect(403, done);
  });

  it("DELETE /files should return 200 if sucess", function(done) {
    request(app)
      .delete('/files/ba6823f5-9e8c-47e9-abfd-84cb5d4253ab')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(function(res){
        res.body='Permission denied!';
      })
      .expect(200, done);
  });
});






