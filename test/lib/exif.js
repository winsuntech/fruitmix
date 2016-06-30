import path from 'path'

import { expect } from 'chai'
var mongoose = require('mongoose')
var env='development'
console.log(1111111111)
var dbUrl = require('../../config/database').database[env];
ongoose.connect(dbUrl, err => { if (err) throw err; });
var Exif = require('../../models/exif')
console.log(11111222222)

import exif from '../../src/middleware/exif'
var spawnSync = require('child_process').spawnSync;
var nowpath = '../../testdata'
var targetpath = '/data/test'
var sinon = require('sinon');

describe('test exif', function(){

  const Memtree = require('../../middleware/treemanager');
  var memt = new Memtree();

  describe('create test data', function() {

    function setup() {
      spawnSync('mkdir',['-p',targetpath]);
      spawnSync('cp', ['-r',nowpath,targetpath]);
    }

    before(function(done) {
      setup()
    })   
 
    it('attach exif', function(done) {  
      let node={};
      let ef = {a:200,b:300}
      let nn = exif.attach(node,ef)
      expect(nn.detail.a).to.equal(200)
      expect(nn.detail.a).to.equal(300)
    })

  })
})
