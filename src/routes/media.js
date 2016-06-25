//var User = require('mongoose').model('User');
var Comment = require('mongoose').model('Comment');
var router = require('express').Router();
const auth = require('../middleware/auth');
const uuid = require('node-uuid');
var url = require("url");
const globby = require('globby');
var fs = require('fs');
var MTObj = require('../middleware/memtree');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var multer  = require('multer')
var upload = multer({ dest: '/data/fruitmix/uploads/' })
var helper = require('../middleware/tools');
var adapter = require('../middleware/adapter');
var gm = require('gm');
var jobq = [];
var path = require('path');
var mime = require('../middleware/mime').types;
var debug =false
const readChunk = require('read-chunk');
const fileType = require('file-type');

router.get('/*',auth.jwt(), (req, res) => {
  var pathname = url.parse(req.url).pathname;
  var hashvalue = pathname.substr(1);
  debug && console.log(1);
  var passuuid="";
  var pcheck=false;
  var width = Number(req.query.width);
  var height = Number(req.query.height);
  if(memt.hashash(hashvalue)&&req.query.type==='thumb'){
    if(width<=0||height<=0||Number.isNaN(height)||Number.isNaN(width)){
      return res.status(406).json('error');
    }
    debug && console.log(memt.getbyhash(hashvalue));
    memt.getbyhash(hashvalue).forEach(function(f){
      debug && console.log(f);
      debug && console.log(2);
      debug && console.log(memt.checkreadpermission(f,req.user.uuid));
      debug && console.log(memt.checkownerpermission(f,req.user.uuid));
      debug && console.log(mshare.checkreadpermission(hashvalue,req.user.uuid));
      debug && console.log(mshare.checkwritepermission(hashvalue,req.user.uuid));
      if (memt.checkreadpermission(f,req.user.uuid)===1||memt.checkownerpermission(f,req.user.uuid)===1||mshare.checkreadpermission(hashvalue,req.user.uuid)===1||mshare.checkwritepermission(hashvalue,req.user.uuid)===1){
        pcheck=true;
        passuuid=f;
      }
    });
    debug && console.log(pcheck)
    if(pcheck===true){
      var newpath = "/data/fruitmix/thumbs/"+hashvalue+"&&"+width+"@"+height+".jpeg";
      debug && console.log(3);
      if(!fs.existsSync(newpath)&&!helper.contains(jobq,hashvalue)){
        jobq.push(hashvalue);
        gm(memt.getpath(passuuid))
        .resize(width,height,'!')
        .noProfile()
        .write(newpath,function(err){
          if(err){console.log(err);
            helper.removex(jobq,hashvalue);
          }
          else{
            helper.pastethumbexif(passuuid,newpath);
            helper.removex(jobq,hashvalue);
          }
        });
        debug && console.log(4);
        return res.status(202).json('creating thumb');
      }
      else if(!fs.existsSync(newpath)&&helper.contains(jobq,hashvalue)&&pcheck==true){
        debug && console.log(5);
        return res.status(202).json('please try again later');
      }
      else if(fs.existsSync(newpath)&&pcheck==true){
        debug && console.log(6);
        fs.readFile(newpath, "binary", function(err, file) {
          if (err) {
              debug && console.log(7);
              res.writeHead(500, {'Content-Type': 'text/plain'});
              res.end(err);
          } else {
              debug && console.log(8);
              res.writeHead(200, {'Content-Type': 'image/jpeg'});
              res.write(file, "binary");
              res.end();
          }
        });
      }
      else{
        return res.status(403).json('Permission denied'); 
      }
    }
    else{
        return res.status(403).json('Permission denied'); 
    }
  }
  else if(memt.hashash(hashvalue)&&req.query.type==='original'){
    debug && console.log(9);
    var tmppath='';
    memt.getbyhash(hashvalue).forEach(function(f){
      debug && console.log(f)
      if(memt.checkreadpermission(f,req.user.uuid)===1||memt.checkownerpermission(f,req.user.uuid)===1||mshare.checkreadpermission(hashvalue,req.user.uuid)===1||mshare.checkwritepermission(hashvalue,req.user.uuid)===1){
        pcheck=true;
        tmppath=memt.getpath(f);
    }});
    debug && console.log(9.1)
    if(tmppath!==''&&pcheck===true){
      debug && console.log(9.2)
      fs.readFile(tmppath, "binary", function(err, file) {
          if (err) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end(err);
          } else {
            const buffer = readChunk.sync(tmppath, 0, 262);
            var filetype =  fileType(buffer);
            res.writeHead(200, {'Content-Type': filetype.mime});
            res.write(file, "binary");
            res.end();
          }
      });
    }
    else{
      return res.status(404).json('invalid hash');
    }
  }
  else if(!memt.hashash(hashvalue)&&pathname!=='/'){
    debug && console.log(10);
    
    return res.status(404).json('invalid hash');
  }
  else if(memt.hashash(hashvalue)&&req.query.type==='comments'){
    Comment.find({hash:hashvalue},'creator datatime text shareid',(err,docs) => {
      //console.log(222);
      var data =docs.map(doc => ({
        creator: doc.creator,
        datatime: doc.datatime,
        text: doc.text,
        shareid: doc.shareid
      })) 
      debug && console.log(data);
      var rdata=mshare.getallcomments(hashvalue,data,req.user.uuid);
      debug && console.log("===============================================")
      debug && console.log(rdata);
      return res.status(200).json(rdata);
    });
  }
  else{
    debug && console.log(11);
    if (pathname==='/'){
      var tmparray=[];
      var tlist=helper.getfilelistbyhash(req.user.uuid,mshare.getallshare(req.user.uuid))
      tlist.forEach(function(f){
        debug&&console.log(12)
        const buffer = readChunk.sync(memt.getpath(f.uuid), 0, 262);
        var filetype = fileType(buffer);
        debug&&console.log(12.1)
        if(req.query.filter==='photo'){
          debug&&console.log(13)
          debug&&console.log(filetype)
          if (filetype!==null&&helper.filetype(filetype.ext)==='image'){
            debug&&console.log(14)
            tmparray.push(adapter.formatformedia(f,'image',filetype.ext));
          }
        }
        else{
          if (filetype!==null&&helper.filetype(filetype.ext)==='image'){
            debug&&console.log(12.2)
            debug && console.log(f);
            tmparray.push(adapter.formatformedia(f,'image',filetype.ext));
            debug&&console.log(filetype.ext)
          }
          else if (filetype!==null&&helper.filetype(filetype.ext)==='music'){
            debug&&console.log(12.3)
            tmparray.push(adapter.formatformedia(f,'music',filetype.ext));
          }
          else if (filetype!==null&&helper.filetype(filetype.ext)==='video'){
            debug&&console.log(12.4)
            tmparray.push(adapter.formatformedia(f,'video',filetype.ext));
          }
          // else if (filetype!==null&&helper.filetype(filetype.ext)==='unknown'){
          //   debug&&console.log(12.5)
          //   tmparray.push(adapter.formatformedia(f,'unknown',filetype.ext));
          // }
          // else{
          //   debug&&console.log(12.6)
          //   tmparray.push(adapter.formatformedia(f,'unknown','unknown'));
          // }
        }
      });
      // tmparray.sort(function(a,b){
      //   var a1 = a.createtime.split('-');
      //   var tmpa = parseInt(a1[0])*10000+parseInt(a1[1])*100+parseInt(a1[2]);
      //   var b1 = b.createtime.split('-');
      //   var tmpb = parseInt(b1[0])*10000+parseInt(b1[1])*100+parseInt(b1[2]);
      //   if(tmpa<tmpb) return 1;
      //   else return -1;
      // });
      // tmparray.forEach(function(f){
      //   console.log(f.createtime);
      // })
      return res.status(200).json(tmparray);
    }
    else{
      var bln =false;
      var objs=memt.getbyhash(hashvalue);
      objs.forEach(function(f){
        if(memt.checkreadpermission(f,req.user.uuid)===1||memt.checkownerpermission(f,req.user.uuid)===1||mshare.checkreadpermission(hashvalue,req.user.uuid)===1||mshare.checkwritepermission(hashvalue,req.user.uuid)===1){
          bln=true;
        }
      });
      if(bln===true){
        return res.status(200).json(adapter.formatformedia(helper.getfiledetail(objs[0])));
      }
      else
        return res.status(403).json('Permission denied');
    }
  }
});

router.post('/*',auth.jwt(), (req, res) => {
  var pathname = url.parse(req.url).pathname;
  var hashvalue = pathname.substr(1);
  if(memt.hashash(hashvalue)){
    var newcomment = new Comment({
      hash:hashvalue,
      creator:req.user.uuid,
      datatime: new Date().getTime(),
      text:req.body.text,
      shareid:req.body.shareid
    })
    newcomment.save((err)=>{
      if (err) { return res.status(500).json(null); }
      return res.status(200).json(newcomment);
    })
  }
  else{
    return res.status(404).json('invalid hash');
  }
})

module.exports = router;

