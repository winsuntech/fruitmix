const uuid = require('node-uuid');
const globby = require('globby');
var fs = require('fs');
var xattr = require('fs-xattr');
var socket = require('socket.io-client')('http://localhost:10086');
var dmap1 = new Map();
var helper = require('middleware/tools');
var adapter = require('middleware/adapter');
var MTOpermission = require('middleware/mtopermission');
var MTOattribute = require('middleware/mtoattribute');
var MTObj = require('middleware/memtree');
// io.sockets.on('connection', function(socket1){
//   socket1.on('deletefolderorfile', function(msg){
//     socket.emit('deletefolderorfile',msg);
//   });

//   socket1.on('checkpath', function(msg){
//     commoncheck(msg);
//   });
// });



function commoncheck(f){
  console.log(f)
  helper.tattoo(f);
  //console.log(9991)
  var fstat=fs.statSync(f);
  var uid = xattr.getSync(f,'user.uuid').toString('utf-8');
  var readlist = xattr.getSync(f,'user.readlist').toString('utf-8').split(',');
  var writelist = xattr.getSync(f,'user.writelist').toString('utf-8').split(',');
  var owner = xattr.getSync(f,'user.owner').toString('utf-8').split(',');
  var type = xattr.getSync(f,'user.type').toString('utf-8');
  var createtime = fstat.birthtime;
  //var createtime = "2015-"+parseInt(Math.random()*12+1,10).toString()+"-"+parseInt(Math.random()*31+1,10).toString();
  //console.log(createtime);
  var changetime = fstat.ctime;
  var modifytime = fstat.mtime;
  var size = fstat.size;
  //console.log(9992)
  var mtobj = adapter.treebuilder(uid,readlist,writelist,owner,type,createtime,changetime,modifytime,size,f,'','','');
  
  if(dmap.has(f.substr(0,f.lastIndexOf('/')))){
    var parent = dmap.get(f.substr(0,f.lastIndexOf('/')));
    mtobj.parent=parent;
  }
  //console.log(9993)
  if (fstat&&fstat.isDirectory()){ 
    //socket.emit('addfoldernode',mtobj);
    if(!memt.has(mtobj.uid)){
      var mtop=new MTOpermission(mtobj.readlist,mtobj.writelist,mtobj.owner);
      var mtoa= new MTOattribute(mtobj.createtime,mtobj.changetime,mtobj.modifytime,mtobj.size,mtobj.path.substr(mtobj.path.lastIndexOf('/')+1));
      var memobj = new MTObj(mtobj.uid,mtobj.type,mtobj.parent,[],mtobj.path,mtop,mtoa,mtobj.hash);
      memt.add(mtobj.uid,memobj);
      //console.log(mtobj.uid);
      //console.log(mtobj.path);
      dmap.set(mtobj.path,mtobj.uid);
    }
    //dmap.set(f,mtobj.uid);
  }
  else{
    if(!memt.has(mtobj.uid)){
      var a =helper.pastedetail(mtobj.path,mtobj.uid);
      var mtop=new MTOpermission(mtobj.readlist,mtobj.writelist,mtobj.owner);
      var mtoa= new MTOattribute(mtobj.createtime,mtobj.changetime,mtobj.modifytime,mtobj.size,mtobj.path.substr(mtobj.path.lastIndexOf('/')+1));
      var memobj = new MTObj(mtobj.uid,mtobj.type,mtobj.parent,[],mtobj.path,mtop,mtoa,mtobj.hash,'');
      //console.log("ttttt")
      //console.log(mtobj.uid);
      memt.add(mtobj.uid,memobj);
      //console.log(msg.uid);
      //console.log(msg.path);
    }
    //mtobj.hash=xattr.getSync(f,'user.hash').toString('utf-8');
    //console.log(xattr.getSync(f,'user.uuid').toString('utf-8'));
    //socket.emit('addfilenode',mtobj);

  }

  if(dmap.has(f.substr(0,f.lastIndexOf('/')))){
    socket.emit('addchild',mtobj);
  }
  else{
    socket.emit('setroot',mtobj);
  }
}

function cronjob(tpath){
  var newlist = globby.sync([tpath]);
  newlist.forEach(function(f){
    console.log("----")
    console.log(f)
    console.log("----")
    var tf=f.split('/');
    if(f==='/data/fruitmix'||helper.contains(tf,'library')||helper.contains(tf,'drive')){
      commoncheck(f);
    }
  });
  //console.log('done');
}


//cronjob('/mnt/**');

socket.on('connect', function () { console.log("socket connected"); });

exports.checkall = cronjob;

exports.docheck = commoncheck;