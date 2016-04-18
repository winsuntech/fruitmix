const uuid = require('node-uuid');
const globby = require('globby');
var fs = require('fs');
var xattr = require('fs-xattr');
var schedule = require('node-schedule');
var socket = require('socket.io-client')('http://localhost:6969');

var dmap = new Map();

var io = require("socket.io").listen(10086);

console.log('333');

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

io.sockets.on('connection', function(socket1){
  socket1.on('deletefolderorfile', function(msg){
    socket.emit('deletefolderorfile',msg);
  });

  socket1.on('checkpath', function(msg){
    commoncheck(msg);
  });
});

function commoncheck(f){
  fstat=fs.statSync(f);
  try{
    xattr.getSync(f,'user.uuid');
  }
  catch(e)
  {
    xattr.setSync(f,'user.uuid',uuid.v4());
    xattr.setSync(f,'user.readlist','');
    xattr.setSync(f,'user.writelist','');
    xattr.setSync(f,'user.owner','');
    if (fstat&&fstat.isDirectory()){ 
      xattr.setSync(f,'user.type','folder');
    }
    else if(fstat&&!fstat.isDirectory()){
      xattr.setSync(f,'user.type','file');
    }
  }

  var uid = xattr.getSync(f,'user.uuid').toString('utf-8');
  var readlist = xattr.getSync(f,'user.readlist').toString('utf-8').split(',');
  var writelist = xattr.getSync(f,'user.writelist').toString('utf-8').split(',');
  var owner = xattr.getSync(f,'user.owner').toString('utf-8').split(',');
  var type = xattr.getSync(f,'user.type').toString('utf-8');
  var createtime = fstat.birthtime;
  var changetime = fstat.ctime;
  var modifytime = fstat.mtime;
  var accesstime = fstat.atime;
  var size = fstat.size;
  var mtobj = new mtojson();
  mtobj.uid=uid;
  mtobj.readlist=readlist;
  mtobj.writelist=writelist;
  mtobj.owner=owner;
  mtobj.type=type;
  mtobj.createtime=createtime;
  mtobj.changetime=changetime;
  mtobj.modifytime=modifytime;
  mtobj.accesstime=accesstime;
  mtobj.size=size;
  mtobj.path=f;

  if(dmap.has(f.substr(0,f.lastIndexOf('/')))){
    var parent = dmap.get(f.substr(0,f.lastIndexOf('/')));
    mtobj.parent=parent;
  }

  if (fstat&&fstat.isDirectory()){ 
    socket.emit('addfoldernode',mtobj);
    dmap.set(f,uid);
  }
  else{
    //console.log(xattr.getSync(f,'user.uuid').toString('utf-8'));
    socket.emit('addfilenode',mtobj);
  }

  if(dmap.has(f.substr(0,f.lastIndexOf('/')))){
    socket.emit('addchild',mtobj);
  }
  else{
    socket.emit('setroot',mtobj);
  }
}

var cronjob = function(tpath){
  newlist = globby.sync([tpath]);
  newlist.forEach(function(f){
   commoncheck(f);
});
}


//cronjob('/mnt/**');

socket.on('connect', function () { console.log("socket connected"); });


var rule = new schedule.RecurrenceRule();
// rule.dayOfWeek = [0, new schedule.Range(1, 6)];
// rule.hour = 6;
// rule.minute =0;
rule.second = 0;
schedule.scheduleJob(rule, function(){
  cronjob('/mnt/**');
});


