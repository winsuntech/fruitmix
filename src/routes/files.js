//var User = require('mongoose').model('User');
var router = require('express').Router();
const auth = require('../middleware/auth');
const uuid = require('node-uuid');
var url = require("url");
const globby = require('globby');
var fs = require('fs');
var MTObj = require('../middleware/memtree');
var xattr = require('fs-xattr');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
var multer  = require('multer')
var upload = multer({ dest: '/data/fruitmix/uploads/' })
var helper = require('../middleware/tools');
var path = require('path');
const readChunk = require('read-chunk');
const fileType = require('file-type');
var adapter = require('../middleware/adapter')
var debug=false;

router.get('/*',auth.jwt(), (req, res) => {
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    if (req.query.type==='media'&&memt.has(fuuid)){
      var realpath = memt.getpath(fuuid);
      debug && console.log(realpath);
      var fstat=fs.statSync(realpath);
      fs.exists(realpath, function (exists) {
        if (!exists) {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.write("File " + fuuid + " was not found on this server.");
          res.end();
        } 
        else {
          if (!fstat.isDirectory()){
            // fs.readFile(realpath, "binary", function(err, file) {
            //   if (err) {
            //     console.log(1)
            //     res.writeHead(500, {'Content-Type': 'text/plain'});
            //     console.log(2)
            //     console.log(err)
            //     res.end();
            //   } else {
            //     console.log(3)
            //     const buffer = readChunk.sync(realpath, 0, 262);
            //     var filetype =  fileType(buffer);
            //     if (filetype!==null){
            //       res.writeHead(200, {'Content-Type': filetype.mime});
            //       res.write(file, "binary");
            //       res.end();
            //     }
            //     else{
            //       res.writeHead(200, {'Content-Type': 'unknow'});
            //       res.write(file, "binary");
            //       res.end();
            //     }
            //   }
            var readStream = fs.createReadStream(realpath)
            const buffer = readChunk.sync(realpath, 0, 262);
                var filetype =  fileType(buffer);
                if (filetype!==null){
                  res.writeHead(200, {'Content-Type': filetype.mime});
                  //res.write(file, "binary");
                  //res.end();
                  readStream.pipe(res);
                }
                else{
                  res.writeHead(200, {'Content-Type': 'unknow'});
                  //res.write(file, "binary");
                  //res.end();
                  readStream.pipe(res);
                }
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
        var tdata=helper.getfilelist(memt.getroot(),req.user.uuid,[]);
        // console.log("---------------=================");
        // console.log(tdata)
        // var rdata=[];
        // for (var f of tdata){
        //   console.log(memt.getpath(f.uuid))
        //   rdata=helper.getparentobj(f.uuid,rdata);
        // }
        return res.status(200).json(tdata);
        //return res.status(200).json(mtree);
      }
      else{
        return res.status(200).json(helper.getfiledetail(fuuid));
      }
    }
});

router.post('/*',auth.jwt(),upload.single('file'),(req, res) => {
  var pathname = url.parse(req.url).pathname;
  var fuuid = pathname.substr(1);
  if(memt.islibrary(fuuid)){
      return res.status(400).json('this uuid from a library');
  }
  if (req.body.type==='copy'){
    if (!memt.has(fuuid)||!memt.has(req.body.target)||memt.isfile(req.body.target)){
      return res.status(404).json('invalid uuid');
    }
    else{
        debug &&console.log(1);
        if (memt.checkownerpermission(fuuid,req.user.uuid)===1||memt.checkwritepermission(fuuid,req.user.uuid)===1){
          debug &&console.log(2);
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
            builder.docheck(mto.path)
          });
          return res.status(200).json('success');
        }
        else{
          return res.status(403).json('Permission denied');
        }
    }
  }
  else{
    if(!memt.has(fuuid)){
      return res.status(404).json('invalid uuid');
    }
    if(memt.isfile(fuuid)){
      debug && console.log('1');
      return res.status(400).json('target is a file');
    }
    if(memt.checkwritepermission(fuuid,req.user.uuid)!==1&&memt.checkownerpermission(fuuid,req.user.uuid)!==1){
      return res.status(403).json('Permission denied');
    }
    if(req.query.type==='file'){
      if(!req.file){
        debug && console.log('2');
        return res.status(400).json('file is missing');
      }
      var tmp_path = req.file.path;
      if(fs.existsSync(memt.getpath(fuuid)+'/'+req.file.originalname)){
        return res.status(400).json('file already exists');
      }
      //helper.tattoo(tmp_path);
      try{
        spawnSync('mv',[tmp_path,memt.getpath(fuuid)+'/'+req.file.originalname]);
      }
      catch(e){
        return res.status(500).json('failed to upload file');
      }
      var tmpuuid = uuid.v4();
      xattr.setSync(memt.getpath(fuuid)+'/'+req.file.originalname,'user.uuid',tmpuuid);
      xattr.setSync(memt.getpath(fuuid)+'/'+req.file.originalname,'user.owner',req.user.uuid);
      builder.checkall(memt.getpath(fuuid)+'/'+req.file.originalname);
      //spawn('rm',['-rf',tmp_path]);
      debug && console.log(tmp_path);
      return res.status(200).json(tmpuuid);
    }
    else if(req.query.type==='folder'){
      if(req.body.foldername===undefined){
        return res.status(400).json('type is missing');
      }
      if(fs.existsSync(memt.getpath(fuuid)+'/'+req.body.foldername)){
        return res.status(400).json('folder already exists');
      }
      else{
        spawnSync('mkdir',[memt.getpath(fuuid)+'/'+req.body.foldername]);
        var tmpuuid = uuid.v4();
        xattr.setSync(memt.getpath(fuuid)+'/'+req.body.foldername,'user.uuid',tmpuuid);
        xattr.setSync(memt.getpath(fuuid)+'/'+req.body.foldername,'user.owner',req.user.uuid);
        builder.checkall(memt.getpath(fuuid)+'/'+req.body.foldername);
        return res.status(200).json(tmpuuid);
      }
    }
    else return res.status(400).json('type is missing');
  }
});

router.patch('/*',auth.jwt(), (req, res) => {
  var pathname = url.parse(req.url).pathname;
  var fuuid = pathname.substr(1);
  if(memt.islibrary(fuuid)){
    return res.status(400).json('this uuid from a library');
    }
  if (!memt.has(fuuid)){
    return res.status(404).json('invalid uuid');
  }
  else{
    if (memt.checkwritepermission(fuuid,req.user.uuid)===1||memt.checkownerpermission(fuuid,req.user.uuid)===1){
      debug && console.log(req.body)
      if(req.query.type==='permission'&&req.body.readlist!==undefined&&req.body.writelist!==undefined){
        debug && console.log(1);
        memt.setreadlist(fuuid,JSON.parse(req.body.readlist));
        debug && console.log(2);
        memt.setwritelist(fuuid,JSON.parse(req.body.writelist));
        debug && console.log(3);
        debug && console.log(memt.getpath(fuuid));
        debug && console.log(req.body);
        debug && console.log(req.body.writelist);
        debug && console.log(req.body.readlist);
        var tx =JSON.parse(req.body.readlist)
        var rl =''
        for (var i = 0; i < tx.length; i++) {
          if (i === tx.length-1) {
            rl=rl+tx[i];
          }
          else rl=rl+tx[i]+',';
        }
        var ty =JSON.parse(req.body.writelist)
        var wl =''
        for (var i = 0; i < ty.length; i++) {
          if (i === ty.length-1) {
            wl=wl+ty[i];
          }
          else wl=wl+ty[i]+',';
        }
        xattr.setSync(memt.getpath(fuuid),'user.writelist',wl);
        debug && console.log(4);
        xattr.setSync(memt.getpath(fuuid),'user.readlist',rl);
        debug && console.log(5);
        return res.status(200).json('success');
      }
      else if(req.body.filename&&!req.body.target){
        var nowpath = memt.getpath(fuuid);
        var targetpath = nowpath.substr(0,nowpath.lastIndexOf('/'))+'/'+req.body.filename
        if(fs.existsSync(targetpath)){
          return res.status(400).json('folder or file already exists');
        }
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
          if(memt.checkwritepermission(req.body.target,req.user.uuid)!==1&&memt.checkownerpermission(req.body.target,req.user.uuid)!==1){return res.status(403).json('Permission denied!');}
          var targetpath = memt.getpath(req.body.target);
          var nowpath = memt.getpath(fuuid);
          debug && console.log(targetpath+'/'+memt.getname(fuuid))
          if(fs.existsSync(targetpath+'/'+memt.getname(fuuid))){
            return res.status(400).json('folder or file already exists');
          }
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
          if(memt.checkwritepermission(req.body.target,req.user.uuid)!==1&&memt.checkownerpermission(req.body.target,req.user.uuid)!==1){return res.status(403).json('Permission denied!');}
          var nowpath = memt.getpath(fuuid);
          var targetpath = memt.getpath(req.body.target)+"/"+req.body.filename;
          debug && console.log(targetpath)
          debug && console.log(nowpath)
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
    if(memt.islibrary(fuuid)){
      return res.status(400).json('this uuid from a library');
    }
    if (!memt.has(fuuid)){
      return res.status(404).json('invalid uuid');
    }
    else{
      if (memt.checkownerpermission(fuuid,req.user.uuid)===1||memt.checkwritepermission(fuuid,req.user.uuid)===1){
        var realpath = memt.getpath(fuuid);
        var mto = adapter.treebuilder(xattr.getSync(realpath,'user.uuid').toString('utf-8'),'','','','','','','','','','','','');
        spawn('rm', ['-rf',realpath]);
        memt.deletefile(mto.uid); 
        return res.status(200).json('success');
      }
      else{
        return res.status(403).json('Permission denied');
      }
    }
});

module.exports = router;

