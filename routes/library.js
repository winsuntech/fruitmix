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
var Librarylist = require('mongoose').model('Librarylist');
var Udbinding = require('mongoose').model('Udbinding');
var debug=true;


router.post('/*',auth.jwt(),upload.single('file'),(req, res) => {
  debug && console.log('00000000000000');
  var pathname = url.parse(req.url).pathname;
  var fuuid = pathname.substr(1);
  debug && console.log('11111111111111111111');
  if(pathname==='/'){
    var tmpuuid=uuid.v4();
    spawnSync('mkdir',['-p','/mnt/'+tmpuuid]);
    var newlibrarylist = new Librarylist({
      uuid:tmpuuid
    });
    var newudbinding = new Udbinding({
      owner:req.user.uuid,
      uuid:tmpuuid
    });
    newlibrarylist.save((err)=>{
      if (err) { return res.status(500).json(null); }
    })
    newudbinding.save((err)=>{
      if (err) { return res.status(500).json(null); }
    })
    helper.tattoo('/mnt/'+fuuid);
    xattr.setSync('/mnt/'+fuuid,'user.owner',req.user.uuid);
    return res.status(200).json(tmpuuid);
  }
  debug && console.log(2);
  if (req.query.hash===undefined){
    return res.status(400).json('hash is missing');
  }
  if(!req.file){
    return res.status(400).json('file is missing');
  }
  if(!fs.existsSync('/mnt/'+fuuid)){
    return res.status(404).json('invalid uuid');
  }
  debug && console.log(3);
  Librarylist.find({uuid:fuuid},'uuid',(err,docs) => {
      if(docs.length!==0){
        var tmp_path = req.file.path;
        xattr.setSync(tmp_path,'user.owner',req.user.uuid);
        helper.tattoo(tmp_path);
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
      }
      else return res.status(404).json('invalid hash')
  })
});

module.exports = router;

