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
var socket = require('socket.io-client')('http://localhost:10086');

function mtojson(){
  this.uid='';
  this.readlist=[];
  this.writelist=[];
  this.owner=[];
  this.type='';
  this.createtime='';
  this.changetime='';
  this.modifytime='';
  this.accesstime='';
  this.size='';
  this.path='';
  this.parent='';
}


router.get('/*',auth.jwt(), (req, res) => {
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    if (req.query.type==='media'&&memt.has(fuuid)){
      var realpath = memt.getpath(fuuid);
      fstat=fs.statSync(realPath);
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
                  res.writeHead(200, {'Content-Type': 'text/html'});
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
        return res.status(200).json(memt.get(memt.getroot()));
        //return res.status(200).json(mtree);
      }
      else{
        return res.status(200).json(memt.get(fuuid));
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

router.post('/*',auth.jwt(), (req, res) => {
  if (req.body.type==='copy'){
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    if (!memt.has(fuuid)||!memt.has(req.body.target)||memt.isfile(req.body.target)){
      return res.status(404).json('invalid uuid');
    }
    else{
      var realpath = memt.getpath(fuuid);
      var targetpath = memt.getpath(req.body.target);
      spawn('cp', ['-r',realpath,targetpath]);
      var newlist = globby.sync([targetpath+'/'+memt.getname(fuuid)]);
      newlist.forEach(function(f){
        fstat=fs.statSync(f);
        console.log(f);
      });
      return res.status(200).json('success');
    }
  }
    else{
      return res.status(200).json(null);
  }
});

router.move('/*',auth.jwt(), (req, res) => {
  var pathname = url.parse(req.url).pathname;
  var fuuid = pathname.substr(1);
  if (!memt.has(fuuid)||!memt.has(req.body.target)){
    return res.status(404).json('invalid uuid');
  }
  else{
    var realpath = memt.getpath(fuuid);
    var targetpath = memt.getpath(req.body.target);
  }
});

router.delete('/*',auth.jwt(), (req, res) => {
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    var mto = new mtojson();
    if (!memt.has(fuuid)){
      return res.status(404).json('invalid uuid');
    }
    else{
      var realpath = memt.getpath(fuuid);
      spawn('rm', ['-rf',realpath]);
      mto.path = realpath;
      socket.emit('deletefolderorfile',mto);
      return res.status(200).json('success');
    }
});

router.put('/*',auth.jwt(), (req, res) => {
    var pathname = url.parse(req.url).pathname;
    var fuuid = pathname.substr(1);
    if (!memt.has(fuuid)){
      return res.status(404).json('invalid uuid');
    }
    else{
      var realpath = memt.getpath(fuuid);

    }
});

module.exports = router;

