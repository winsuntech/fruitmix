//var User = require('mongoose').model('User');
var router = require('express').Router();
const auth = require('middleware/auth');
const uuid = require('node-uuid');
var url = require("url");
const globby = require('globby');
var fs = require('fs');
var MTObj = require('middleware/memtree');
var xattr = require('fs-xattr');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var socket = require('socket.io-client')('http://localhost:10086');
var Checker = require('middleware/permissioncheck');
var multer  = require('multer')
var upload = multer({ dest: '/mnt/uploads/' })
var helper = require('middleware/tools');

router.get('/*',auth.jwt(), (req, res) => {
    var pathname = url.parse(req.url).pathname;
    var hashvalue = pathname.substr(1);
    if(!hashmap.has(hashvalue)&&pathname!=='/'){
      return res.status(404).json('invalid hash');
    }
    else{
      if (pathname==='/'){
        return res.status(200).json(helper.formatformedia(helper.getfilelistbyhash(req.user.uuid)));
      }
      else{
        var bln =false;
        var objs=hashmap.get(hashvalue);
        console.log(objs);
        objs.forEach(function(f){
          console.log(f);
          if(Checker.read(f,req.user.uuid)||Checker.owner(f,req.user.uuid)){
            bln=true;
          }
        });
        if(bln===true){
          return res.status(200).json(helper.formatformedia(helper.getfiledetail(objs[0])));
        }
        else
          return res.status(403).json('Permission denied');
      }
    }
});

module.exports = router;

