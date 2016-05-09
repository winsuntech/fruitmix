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
var path = require('path');
const readChunk = require('read-chunk');
const fileType = require('file-type');
var adapter = require('middleware/adapter')

router.post('/*',auth.jwt(),upload.single('file'),(req, res) => {
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    if(pathname==='/'||req.query.hash==undefined){
      return res.status(400).json('uuid or hash is missing');
    }
    if(!req.file){
      return res.status(400).json('file is missing');
    }
    var tmp_path = req.file.path;
    helper.tattoo(tmp_path);
    xattr.setSync(tmp_path,'user.owner',req.user.uuid);
    try{
      spawnSync('mkdir',['/mnt/'+fuuid]);
      helper.tattoo('/mnt/'+fuuid);
      xattr.setSync('/mnt/'+fuuid,'user.owner',req.user.uuid);
    }
    catch(e){
      console.log(e);
    }
    try{
      if(fs.existsSync('/mnt/'+fuuid+'/'+req.query.hash)){
        spawnSync('rm',['-rf',tmp_path]);
        return res.status(200).json(null);
        //return res.status(403).json("file already exist");
      }
      else spawnSync('mv',[tmp_path,'/mnt/'+fuuid+'/'+req.query.hash]);
    }
    catch(e){
      return res.status(500).json('failed to upload file');
    }
    //builder.checkall(memt.getpath(fuuid)+req.file.originalname);
    console.log(tmp_path);
    return res.status(200).json(null);
});

module.exports = router;

