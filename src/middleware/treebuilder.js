const uuid = require('node-uuid');
const globby = require('globby');
var fs = require('fs');
var xattr = require('fs-xattr');
var socket = require('socket.io-client')('http://localhost:10086');
var dmap1 = new Map();
var helper = require('../middleware/tools');
var adapter = require('../middleware/adapter');
var MTOpermission = require('../middleware/mtopermission');
var MTOattribute = require('../middleware/mtoattribute');
var MTObj = require('../middleware/memtree');
var debug=false

function commoncheck(f){
  debug && console.log(f)
  helper.tattoo(f);
  //console.log(9991)
  var fstat=fs.statSync(f);
  var uid = xattr.getSync(f,'user.uuid').toString('utf-8');
  var readlist = xattr.getSync(f,'user.readlist').toString('utf-8').split(',');
  var writelist = xattr.getSync(f,'user.writelist').toString('utf-8').split(',');
  var owner = xattr.getSync(f,'user.owner').toString('utf-8').split(',');
  var type = xattr.getSync(f,'user.type').toString('utf-8');
  try{
    var hash=xattr.getSync(f,'user.hash').toString('utf-8');
  }
  catch(e){
    var hash=""
  }
  var createtime = fstat.birthtime;
  var changetime = fstat.ctime;
  var modifytime = fstat.mtime;
  var size = fstat.size;
  var mtobj = adapter.treebuilder(uid,readlist,writelist,owner,type,createtime,changetime,modifytime,size,f,'',hash,'');
  
  if(dmap.has(f.substr(0,f.lastIndexOf('/')))){
    var parent = dmap.get(f.substr(0,f.lastIndexOf('/')));
    mtobj.parent=parent;
  }
  if (fstat&&fstat.isDirectory()){ 
    if(!memt.has(mtobj.uid)){
      var mtop=new MTOpermission(mtobj.readlist,mtobj.writelist,mtobj.owner);
      var mtoa= new MTOattribute(mtobj.createtime,mtobj.changetime,mtobj.modifytime,mtobj.size,mtobj.path.substr(mtobj.path.lastIndexOf('/')+1));
      var memobj = new MTObj(mtobj.uid,mtobj.type,mtobj.parent,[],mtobj.path,mtop,mtoa,mtobj.hash);
      memt.add(mtobj.uid,memobj);
      dmap.set(mtobj.path,mtobj.uid);
    }
  }
  else{
    if(!memt.has(mtobj.uid)){
      var mtop=new MTOpermission(mtobj.readlist,mtobj.writelist,mtobj.owner);
      var mtoa= new MTOattribute(mtobj.createtime,mtobj.changetime,mtobj.modifytime,mtobj.size,mtobj.path.substr(mtobj.path.lastIndexOf('/')+1));
      var memobj = new MTObj(mtobj.uid,mtobj.type,mtobj.parent,[],mtobj.path,mtop,mtoa,mtobj.hash,'');
      memt.add(mtobj.uid,memobj);
      var a =helper.pastedetail(mtobj.path,mtobj.uid);
    }
  }

  if(dmap.has(f.substr(0,f.lastIndexOf('/')))){
    socket.emit('addchild',mtobj);
  }
  else{
    memt.setroot(mtobj.uid)
  }
}

function cronjob(tpath){
  var newlist = globby.sync([tpath]);
  newlist.forEach(function(f){
    var tf=f.split('/');
    if(f==='/data/fruitmix'||helper.contains(tf,'library')||helper.contains(tf,'drive')){
      commoncheck(f);
    }
  });
}

socket.on('connect', function () { console.log("socket connected"); });

exports.checkall = cronjob;

exports.docheck = commoncheck;
