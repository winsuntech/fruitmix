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

router.get('/*',auth.jwt(), (req, res) => {
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    if (req.query.type==='media'&&memt.has(fuuid)){
      var realpath = memt.getpath(fuuid);
      console.log(realpath);
      fstat=fs.statSync(realpath);
      fs.exists(realpath, function (exists) {
        if (!exists) {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.write("File " + fuuid + " was not found on this server.");
          res.end();
        } 
        else {
          if (!fstat.isDirectory()){
            fs.readFile(realpath, "binary", function(err, file) {
              if (err) {
                  res.writeHead(500, {'Content-Type': 'text/plain'});
                  res.end(err);
              } else {
                  const buffer = readChunk.sync(realpath, 0, 262);
                  var filetype =  fileType(buffer);
                  res.writeHead(200, {'Content-Type': filetype.mime});
                  res.write(file, "binary");
                  res.end();
              }
           });
          }
          else{
            return res.status(501).json(fuuid+" is a directory");

          }
        }
      });
    }
    else if(!memt.has(fuuid)&&pathname!=='/'){
      return res.status(404).json('invalid uuid');
    }
    else{
      if (pathname==='/'){
        return res.status(200).json(helper.getfilelist(memt.getroot(),req.user.uuid,[]));
        //return res.status(200).json(mtree);
      }
      else{
        return res.status(200).json(helper.getfiledetail(fuuid));
      }
    }
  // var pathname = url.parse(req.url).pathname;
  // var fmap = new Map();
  // var dmap = new Map();
  //   if (pathname==='/'){
  //     return res.status(200).json(null);
  //   }
  //   else{
  //     filehash = pathname.substr(1);
  //     var fpath='/mnt';
  //     newlist = globby.sync(['/mnt/**']);
  //     newlist.forEach(function(f){
  //       var tmplist=[];
  //       fstat=fs.statSync(f);
  //       if (fstat&&fstat.isDirectory()){ 
  //         console.log(f);
  //         if (f==='/mnt'){
  //           dmap.set(f,'root');
  //         }
  //         else{
  //           dmap.get(f.substr(0,f.lastIndexOf('/')));
            
  //           fmap.set(f,xattr.getSync(f,'user.uuid').toString('utf-8'));
  //         }
  //       }
  //       else{
  //         //console.log(xattr.getSync(f,'user.uuid').toString('utf-8'));
  //         if(!fmap.has(f.substr(f.lastIndexOf('/')))){
  //           tmplist.push(f.substr(0,f.lastIndexOf('/')));
  //           fmap.set(f.substr(f.lastIndexOf('/')),tmplist);
  //         }
  //         else{
  //           tmplist=fmap.get(f.substr(f.lastIndexOf('/')));
  //           var ftmp=f.lastIndexOf('/');
  //           tmplist.push(f.substr(0,f.lastIndexOf('/')));
  //           fmap.set(f.substr(f.lastIndexOf('/')),tmplist);
  //         }
  //       }
  //     });
  //     //console.log(fmap.values());
  //     //console.log(filehash);
  //     return res.status(200).json(fmap);
  //   }
});

router.post('/*',auth.jwt(),upload.single('avatar'),(req, res) => {
  if (req.body.type==='copy'){
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    if (!memt.has(fuuid)||!memt.has(req.body.target)||memt.isfile(req.body.target)){
      return res.status(404).json('invalid uuid');
    }
    else{
        if (memt.checkownerpermission(fuuid,req.user.uuid)||memt.checkwritepermission(fuuid,req.user.uuid)){
          var realpath = memt.getpath(fuuid);
          var targetpath = memt.getpath(req.body.target);
          try{
            spawnSync('cp', ['-r',realpath,targetpath]);
          }
          catch(e){
            return res.status(500).json('failed to copy files');
          }
          var newlist = globby.sync([targetpath+'/'+memt.getname(fuuid)]);
          newlist.forEach(function(f){
            var mto =adapter.treebuilder('','','','','','','','','',f,'','','');
            socket.emit('checkpath',mto);
          });
          return res.status(200).json('success');
        }
        else{
          return res.status(403).json('Permission denied');
        }
    }
  }
  else{
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    if(!memt.has(fuuid)){
      return res.status(404).json('invalid uuid');
    }
    if(memt.isfile(fuuid)){
      console.log('1');
      return res.status(400).json('target is a file');
    }
    if(!memt.checkwritepermission(fuuid,req.user.uuid)&&!memt.checkownerpermission(fuuid,req.user.uuid)){
      return res.status(403).json('Permission denied');
    }
    if(!req.file){
      console.log('2');
      return res.status(400).json('file missing');
    }
    var tmp_path = req.file.path;
    helper.tattoo(tmp_path);
    try{
      spawnSync('mv',[tmp_path,memt.getpath(fuuid)+'/'+req.file.originalname]);
    }
    catch(e){
      return res.status(500).json('failed to upload file');
    }
    builder.checkall(memt.getpath(fuuid)+req.file.originalname);
    //spawn('rm',['-rf',tmp_path]);
    console.log(tmp_path);
    return res.status(200).json(null);
  }
});

router.patch('/*',auth.jwt(), (req, res) => {
  var pathname = url.parse(req.url).pathname;
  var fuuid = pathname.substr(1);
  if (!memt.has(fuuid)){
    return res.status(404).json('invalid uuid');
  }
  else{
    if (memt.checkwritepermission(fuuid,req.user.uuid)){
      if(req.body.filename&&!req.body.target){
        var nowpath = memt.getpath(fuuid);
        var targetpath = nowpath.substr(0,nowpath.lastIndexOf('/'))+'/'+req.body.filename
        try{
          spawn('mv', [nowpath,targetpath]);
        }
        catch(e){
          return res.status(500).json('failed to move file');
        }
        memt.setname(fuuid,req.body.filename);
        return res.status(200).json('change name success');
      }
      else if(req.body.target&&!req.body.filename&&memt.has(req.body.target)){
        if(memt.isfile(req.body.target)){
          return res.status(400).json('can not move into a file');
        }
        else{
          if(!memt.checkwritepermission(req.body.target,req.user.uuid)){return res.status(403).json('Permission denied!');}
          var targetpath = memt.getpath(req.body.target);
          var nowpath = memt.getpath(fuuid);
          try{
            spawn('mv', [nowpath,targetpath]);
          }
          catch(e){
            return res.status(500).json('failed to move file');
          }
          memt.moveto(fuuid,req.body.target);
          return res.status(200).json('move file success');
        }
      }
      else if(req.body.target&&req.body.filename&&memt.has(req.body.target)){
        if(memt.isfile(req.body.target)){
          return res.status(400).json('can not move into a file!');
        }
        else{
          if(!memt.checkwritepermission(req.body.target,req.user.uuid)){return res.status(403).json('Permission denied!');}
          var nowpath = memt.getpath(fuuid);
          var targetpath = memt.getpath(req.body.target)+"/"+req.body.filename;
          console.log(targetpath)
          console.log(nowpath)
          try{
            spawn('mv', [nowpath,targetpath]);
          }
          catch(e){
            return res.status(500).json('failed to move file');
          }
          memt.setname(fuuid,req.body.filename);
          memt.moveto(fuuid,req.body.target);
          return res.status(200).json('move file success!');
        }
      }
      else{
        return res.status(404).json('target folder is not exist');
      }
    }
    else{
      return res.status(403).json('Permission denied');
    }
  }
});

router.delete('/*',auth.jwt(), (req, res) => {
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    if (!memt.has(fuuid)){
      return res.status(404).json('invalid uuid');
    }
    else{
      if (memt.checkownerpermission(fuuid,req.user.uuid)||memt.checkwritepermission(fuuid,req.user.uuid)){
        var realpath = memt.getpath(fuuid);
        var mto = adapter.treebuilder(xattr.getSync(realpath,'user.uuid').toString('utf-8'),'','','','','','','','','','','','');
        spawn('rm', ['-rf',realpath]);
        socket.emit('deletefolderorfile',mto);
        return res.status(200).json('success');
      }
      else{
        return res.status(403).json('Permission denied');
      }
    }
});

module.exports = router;

