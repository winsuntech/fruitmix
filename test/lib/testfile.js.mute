
var expect = require('chai').expect;
var assert = require('chai').assert;

var request = require('supertest');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var app = require('../../src/app');
var User = require('mongoose').model('User');
var xattr = require('fs-xattr');

console.log(app)

    console.log(1)
    spawnSync('mkdir',['-p','/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/1/2']);
    console.log(2)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da','user.owner','c31a2e99-987d-4f65-9559-22e22ff603da')
    console.log(3)
    spawnSync('mkdir',['-p','/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/3']);
    console.log(4)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/1','user.uuid','88eb39b6-519f-46c2-ba3e-051079e9b6ac')
    console.log(5)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/1/2','user.uuid','88eb39b6-519f-46c2-ba3e-051079e9b6a0')
    console.log(6)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/3','user.uuid','88eb39b6-519f-46c2-ba3e-051079e9b6a1')
    console.log(7)
    spawnSync('touch',['/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/1/4.txt']);
    console.log(8)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/1/4.txt','user.uuid','88eb39b6-519f-46c2-ba3e-051079e9b6b2')
    console.log(9)
    spawnSync('touch',['/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/5.txt']);
    console.log(10)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/5.txt','user.uuid','d03232a4-9b35-439f-b91b-ff20f6de6dc6')
    console.log(11)
    spawnSync('touch',['/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/3/6.txt']);
    console.log(12)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/3/6.txt','user.uuid','ba6823f5-9e8c-47e9-abfd-84cb5d4253ab')
    console.log(13)
    spawnSync('touch',['/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603da/1/2/7.txt']);
    console.log(14)
    spawnSync('mkdir',['-p','/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603db/1/2']);
    console.log(15)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603db','user.owner','c31a2e99-987d-4f65-9559-22e22ff603db')
    console.log(16)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603db/1','user.uuid','88eb39b6-519f-46c2-ba3e-051079e9b6a2')
    console.log(17)
    spawnSync('touch',['/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603db/1/2/7.txt']);
    console.log(18)
    xattr.setSync('/data/fruitmix/drive/c31a2e99-987d-4f65-9559-22e22ff603db/1/2/7.txt','user.uuid','88eb39b6-519f-46c2-ba3e-051079e9b6a3')
    console.log(19)


describe("test files", function(){
  // beforeEach(function(done){
  //   User.remove({}, function(err){
  //     if (err) throw err;
  //     var userObj = { 
  //       "uuid" : "c31a2e99-987d-4f65-9559-22e22ff603da",
  //       "username" : "admin", 
  //       "password" : "123456", 
  //       "avatar" : "defaultAvatar.jpg", 
  //       "isAdmin" : true, 
  //       "isFirstUser" : true, 
  //       "type" : "user"
  //     }
  //     var user = new User(userObj);
  //     user.save();
  //     done()
  //   });
  // });
//v1
  //before(function(){
    
  //});




//v2


  after(function(){
  //   //spawnSync('rm', ['-rf','/testdir']);
  });

  // it("GET /login", function(done) {
  //   request(app)
  //     .get('/login')
  //     //.set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
  //     .expect(function(res){
  //       console.log("222222"+res);
  //     })
  //     done();
  // });

  // it("GET /token", function(done) {
  //   request(app)
  //     .get('/token')
  //     .set('Authorization','Basic ODE5NDNhMzAtYzIxYi00NDUwLWI2ZDQtY2I4MzMyNTAyZTJjOjEyMzQ1Ng==')
  //     .expect(function(res){
  //       console.log("33333"+res);
  //     })
  //     done()
  // });

  it("GET /files should return 404 if uuid is invalid", function(done) {
    request(app)
      .get('/files/xx')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404);
      done()
  });

  it("GET /files should return 404 if target is invalid and type is media", function(done) {
    request(app)
      .get('/files/xxx?type=media')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404);
      done()
  });

  it("GET /files should return 501 if target is a folder and type is media", function(done) {
    request(app)
      .get('/files/88eb39b6-519f-46c2-ba3e-051079e9b6ac?type=media')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(function(res){
        console.log("33333"+res.body);
      })
      .expect(501);
      done()
  });

  it("GET /files should return (root)200 if do not have an uuid", function(done) {
    request(app)
      .get('/files')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200);
      done()
  });

  it("GET /files should return 200 if success", function(done) {
    request(app)
      .get('/files/d03232a4-9b35-439f-b91b-ff20f6de6dc6')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200);
      done()
  });

  it("GET /files should return a file if success", function(done) {
    request(app)
      .get('/files/d03232a4-9b35-439f-b91b-ff20f6de6dc6?type=media')
      .set('Accept', 'application/json')
      .set('Authorization', 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect('Content-Type','text/plain')
      .expect(200);
      done()
  });

  it("POST /files should return 404 if uuid is invalid", function(done) {
    request(app)
      .post('/files/xx')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404);
      done()
  });

  it("POST /files should return 400 if target is a file", function(done) {
    request(app)
      .post('/files/ba6823f5-9e8c-47e9-abfd-84cb5d4253ab')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(function(res){
        console.log("33333"+res.body);
      })
      .expect(400);
      done()
  });

  it("POST /files should return 403 if do not have permission", function(done) {
    request(app)
      .post('/files/88eb39b6-519f-46c2-ba3e-051079e9b6a2')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(403);
      done()
  });

//-----/3
  it("POST /files should return 400 if post without a file", function(done) {
    request(app)
      .post('/files/88eb39b6-519f-46c2-ba3e-051079e9b6a1')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(function(res){
        console.log(res.body);
      })
      .expect(400);
      done()
  });
//-----/3
  it("POST /files should return 200 if success", function(done) {
    request(app)
      .post('/files/88eb39b6-519f-46c2-ba3e-051079e9b6a1')
      .attach('file','/trynode/ts.js')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(200);
      done()
  });

  it("PTACH /files should return 404 if uuid is invalid", function(done) {
    request(app)
      .patch('/files/xx')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404);
      done()
  });

  it("PTACH /files should return 403 if only send filename and do not have permission", function(done) {
    request(app)
      .patch('/files/88eb39b6-519f-46c2-ba3e-051079e9b6a2')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"filename":"22.txt"}')
      .expect(403);
      done()
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
      .expect(200);
      done()
  });
//---------1/4.txt
  it("PTACH /files should return 400 if target is a file with permission and target uuid is vaild(rename+move)", function(done) {
    request(app)
      .patch('/files/88eb39b6-519f-46c2-ba3e-051079e9b6b2')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"ba6823f5-9e8c-47e9-abfd-84cb5d4253ab","filename":"33.txt"}')
      .expect(function(res){
        res.body='can not move into a file';
      })
      .expect(400);
      done()
  });

  it("PTACH /files should return 403 if target is a folder without permission and target uuid is vaild", function(done) {
    request(app)
      .patch('/files/88eb39b6-519f-46c2-ba3e-051079e9b6a2')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"88eb39b6-519f-46c2-ba3e-051079e9b6ac","filename":"33.txt"}')
      .expect(function(res){
        res.body='Permission denied!';
      })
      .expect(403);
      done()
  });

  it("PTACH /files should return 200 if target is a folder with permission and target uuid is vaild", function(done) {
    request(app)
      .patch('/files/88eb39b6-519f-46c2-ba3e-051079e9b6b2')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .type('json')
      .send('{"target":"88eb39b6-519f-46c2-ba3e-051079e9b6a0","filename":"33.txt"}')
      .expect(function(res){
        res.body='success!';
      })
      .expect(200);
      done()
  });

  it("DELETE /files should return 404 if uuid is invalid", function(done) {
    request(app)
      .delete('/files/xx')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(404);
      done()
  });

  it("DELETE /files should return 403 if do not have permission", function(done) {
    request(app)
      .delete('/files/88eb39b6-519f-46c2-ba3e-051079e9b6a2')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(function(res){
        res.body='Permission denied!';
      })
      .expect(403);
      done()
  });

  it("DELETE /files should return 200 if sucess", function(done) {
    request(app)
      .delete('/files/88eb39b6-519f-46c2-ba3e-051079e9b6a0')
      .set('Authorization','JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiYzMxYTJlOTktOTg3ZC00ZjY1LTk1NTktMjJlMjJmZjYwM2RhIn0.C7j5pmnGXSr2ZB2NTHJHMNw2HGDrZlmgXbNa-TtSUoU')
      .expect(function(res){
        res.body='success!';
      })
      .expect(200);
      done()
  });

})