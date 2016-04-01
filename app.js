var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mime=require('config/mime');
const globby = require('globby');
var xattr = require('fs-xattr');
var MTObj = require('middleware/memtree');
const uuid = require('node-uuid');
var schedule = require('node-schedule');
var busboy = require('connect-busboy');


/** Express **/
var app = express();
var fs = require("fs");
/** Database Connection **/
var env = app.get('env');
if (env !== 'production' && env !== 'development' && env !== 'test') {
  console.log('Unrecognized NODE_ENV string: ' + env);
  console.log('exit');
  process.exit(1);
} else {
  console.log('NODE_ENV is set to ' + env);
}

var dbUrl = require('config/database').database[env];
console.log('Database url: ' + dbUrl);

mongoose.connect(dbUrl, err => { if (err) throw err; });

/** Model Initialization **/
var User = require('./models/user');

/** Authentication **/
var auth = require('./middleware/auth');
const Memtree = require('./middleware/treemanager');
memt = new Memtree();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(auth.init());
/** Routeing Begins **/
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', require('./routes/index'));
app.use('/init', require('./routes/init'));
app.use('/login', require('./routes/login'));
app.use('/token', require('./routes/token'));
app.use('/users', require('./routes/users'));
app.use('/files',require('./routes/files'));
app.use('/authtest', require('./routes/authtest'));
/** Routing Ends **/
app.use(busboy());

// app.use(auth.jwt(),function(req, res){
//   var pathname = url.parse(req.url).pathname;
//   var realPath = "/mnt" + pathname;
//   console.log(realPath);
//   fs.exists(realPath, function (exists) {
//     if (!exists) {
//       console.log('111');
//       res.writeHead(404, {'Content-Type': 'text/plain'});
//       res.write("This request URL " + pathname + " was not found on this server.");
//       res.end();
//     } 
//     else {
//       console.log('222');
//       fs.readFile(realPath, "binary", function(err, file) {
//           if (err) {
//               res.writeHead(500, {'Content-Type': 'text/plain'});
//               res.end(err);
//           } else {
//               res.writeHead(200, {'Content-Type': 'text/html'});
//               res.write(file, "binary");
//               res.end();
//           }
//        });
//     }
//   });
// });


var io = require("socket.io").listen(10086);
dmap = new Map();
mtree = new MTObj();

io.sockets.on('connection', function(socket){
  socket.on('addfoldernode', function(msg){
    var memobj = new MTObj();
    if(!memt.has(msg.uid)){
      memobj.create(msg.uid,msg.type,msg.parent,[],msg.path,msg.readlist,msg.writelist,msg.owner,msg.createtime,msg.changetime,msg.modifytime,msg.accesstime,msg.size);
      memt.add(msg.uid,memobj);
      console.log(msg.uid);
      console.log(msg.path);
      dmap.set(msg.path,msg.uid);
    }
  });

  socket.on('addfilenode', function(msg){
    if(!memt.has(msg.uid)){
      var memobj = new MTObj();
      memobj.create(msg.uid,msg.type,msg.parent,[],msg.path,msg.readlist,msg.writelist,msg.owner,msg.createtime,msg.changetime,msg.modifytime,msg.accesstime,msg.size);
      memt.add(msg.uid,memobj);
      console.log(msg.uid);
      console.log(msg.path);
    }
  });

  socket.on('addchild', function(msg){
    memt.addchild(msg.parent,memt.get(msg.uid));
  });

  socket.on('setroot', function(msg){
    memt.setroot(msg.uid);
  });

  socket.on('deletefolderorfile', function(msg){
    memt.deletefile(msg.uuid);
  });
});

// var spawn = require('child_process').spawn;
// spawn('node', ['/trynode/scanner.js']);



// fmap = new Map();

// var newlist = globby.sync(['/mnt/**']);
// newlist.forEach(function(f){
//   fstat=fs.statSync(f);

//   try{
//     xattr.getSync(f,'user.uuid');
//   }
//   catch(e)
//   {
//     console.log(e);
//     xattr.setSync(f,'user.uuid',uuid.v4());
//     xattr.setSync(f,'user.readlist','32b84070-238c-4c61-bf1d-ab851cbc1841');
//     xattr.setSync(f,'user.writelist','');
//     xattr.setSync(f,'user.owner','32b84070-238c-4c61-bf1d-ab851cbc1841');
//     if (fstat.isDirectory){
//       xattr.setSync(f,'user.type','folder');
//     }
//     else{
//       xattr.setSync(f,'user.type','file');
//     }
//   }
//   var tuuid = xattr.getSync(f,'user.uuid').toString('utf-8');
//   //console.log(tuuid);
//   var treadlist = xattr.getSync(f,'user.readlist').toString('utf-8').split(',');
//   var twritelist = xattr.getSync(f,'user.writelist').toString('utf-8').split(',');
//   var towner = xattr.getSync(f,'user.owner').toString('utf-8').split(',');
//   var ttype = xattr.getSync(f,'user.type').toString('utf-8');
//   var tcreatetime = fstat.birthtime;
//   var tchangetime = fstat.ctime;
//   var tmodifytime = fstat.mtime;
//   var taccesstime = fstat.atime;
//   var tsize = fstat.size;
//   if(dmap.has(f.substr(0,f.lastIndexOf('/')))){
//     var tparent = dmap.get(f.substr(0,f.lastIndexOf('/')));
//     memt.addchild(tparent,tuuid);
//   }
//   else{
//     var tparent = '';
//     memt.setroot(tuuid);
//   }
//   if (fstat&&fstat.isDirectory()){ 
//     var memobj = new MTObj();
//     var mpobj = new MTOpermission();
//     var maobj = new MTOattribute();
//     mpobj.create(treadlist,twritelist,towner);
//     maobj.create(tcreatetime,tchangetime,tmodifytime,taccesstime,tsize,f.substr(f.lastIndexOf('/')+1));
//     memobj.create(tuuid,ttype,tparent,[],f,treadlist,twritelist,towner,tcreatetime,tchangetime,tmodifytime,taccesstime,tsize);
//     memt.add(tuuid,memobj);
//     dmap.set(f,tuuid);
//   }
//   else{
//     //console.log(xattr.getSync(f,'user.uuid').toString('utf-8'));
//       var memobj = new MTObj();
//       var mpobj = new MTOpermission();
//       var maobj = new MTOattribute();
//       mpobj.create(treadlist,twritelist,towner);
//       maobj.create(tcreatetime,tchangetime,tmodifytime,taccesstime,tsize,f.substr(f.lastIndexOf('/')+1));
//       memobj.create(tuuid,ttype,tparent,[],mpobj,maobj,f);
//       memt.add(tuuid,memobj);
//     }
// });

var builder = require('./middleware/treebuilder');
builder('/mnt/**');

var rule = new schedule.RecurrenceRule();
// rule.dayOfWeek = [0, new schedule.Range(1, 6)];
// rule.hour = 6;
// rule.minute =0;
rule.second = 0;
schedule.scheduleJob(rule, function(){
  builder('/mnt/**');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.type('text/plain');
  res.send(err.status + ' ' + err.message);
});

module.exports = app;

