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
var multer  = require('multer')
var upload = multer({ dest: '/mnt/uploads/' })
var helper = require('middleware/tools');
var gm = require('gm');
var jobq = [];
var path = require('path');
var mime = require('middleware/mime').types;

router.get('/*',auth.jwt(), (req, res) => {
    var pathname = url.parse(req.url).pathname;
    var hashvalue = pathname.substr(1);
    if(memt.hashash(hashvalue)&&req.query.type==='thumb'){
      memt.getbyhash(hashvalue).forEach(function(f){
        if(memt.checkreadpermission(f,req.user.uuid)||memt.checkownerpermission(f,req.user.uuid)){
          var newpath = "/mnt/thumbs/"+hashvalue+".png";
          if(!fs.existsSync(newpath)&&!helper.contains(jobq,hashvalue)){
            jobq.push(hashvalue);
            gm(memt.getpath(f))
            .resize(200,200)
            .noProfile()
            .write(newpath,function(err){
              if(err){console.log(err);}
              helper.removex(jobq,hashvalue);
            });
            return res.status(202).json('createing thumb');
          }
          else if(!fs.existsSync(newpath)&&helper.contains(jobq,hashvalue)){
            return res.status(202).json('please try again later');
          }
          else if(fs.existsSync(newpath)){
            fs.readFile(newpath, "binary", function(err, file) {
              if (err) {
                  res.writeHead(500, {'Content-Type': 'text/plain'});
                  res.end(err);
              } else {
                  res.writeHead(200, {'Content-Type': 'image/png'});
                  res.write(file, "binary");
                  res.end();
              }
            });
          }
        }
      });
    }
    else if(memt.hashash(hashvalue)&&req.query.type==='original'){
      var tmppath='';
      memt.getbyhash(hashvalue).forEach(function(f){
        if(memt.checkreadpermission(f,req.user.uuid)||memt.checkownerpermission(f,req.user.uuid)){
          tmppath=memt.getpath(f);
        }
        if(tmppath!==''){
          fs.readFile(tmppath, "binary", function(err, file) {
              if (err) {
                  res.writeHead(500, {'Content-Type': 'text/plain'});
                  res.end(err);
              } else {
                  var ext = path.extname(tmppath);
                  ext = ext ? ext.slice(1) : 'unknown';
                  var contentType = mime[ext] || "text/plain";
                  res.writeHead(200, {'Content-Type': contentType});
                  res.write(file, "binary");
                  res.end();
              }
          });
        }
        else{
          return res.status(404).json('invalid hash');
        }
      });
    }
    else if(!memt.hashash(hashvalue)&&pathname!=='/'){
      return res.status(404).json('invalid hash');
    }
    else{
      if (pathname==='/'){
        var tmparray=[];
        helper.getfilelistbyhash(req.user.uuid).forEach(function(f){
          tmparray.push(helper.formatformedia(f));
        });
        return res.status(200).json(tmparray);
      }
      else{
        var bln =false;
        var objs=memt.getbyhash(hashvalue);
        objs.forEach(function(f){
          if(memt.checkreadpermission(f,req.user.uuid)||memt.checkownerpermission(f,req.user.uuid)){
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

