var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
// var mime=require('config/mime');
const globby = require('globby');
var xattr = require('fs-xattr');
var MTObj = require('./middleware/memtree');
const uuid = require('node-uuid');
var schedule = require('node-schedule');
var MediaObj = require('./middleware/mediaobj');
var spawnSync = require('child_process').spawnSync;
/** Express **/
var app = express();
var fs = require("fs");
//var timeout =require('connect-timeout');
//app.use(timeout('10000s'));
/** Database Connection **/
var env = app.get('env');
if (env !== 'production' && env !== 'development' && env !== 'test') {
  console.log('Unrecognized NODE_ENV string: ' + env);
  console.log('exit');
  process.exit(1);
} else {
  console.log('NODE_ENV is set to ' + env);
}

var dbUrl = require('./config/database').database[env];
console.log('Database url: ' + dbUrl);

mongoose.connect(dbUrl, err => { if (err) throw err; });

/** Model Initialization **/
var User = require('./models/user');
//var Document = require('./models/document');
//var Documentlink = require('./models/documentlink');
//var Photolink = require('./models/photolink');
var Version = require('./models/version');
var Versionlink = require('./models/versionlink');
var Comment = require('./models/comment');
var Udbindling = require('./models/udbinding');
var Librarylist = require('./models/librarylist');
//var Group = require('./models/group');
var Config = require('./models/config');
/** Authentication **/
var auth = require('./middleware/auth');
//memt = new Memtree();
var helper = require('./middleware/tools');

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
app.use('/media',require('./routes/media'));

//app.use('/document',require('./routes/document'));
//app.use('/mediashare',require('/routes/mediashare'));
app.use('/authtest', require('./routes/authtest'));
app.use('/library',require('./routes/library'));
//app.use('/group',require('./routes/group'));
app.use('/mediashare',require('./routes/mediashare'));
/** Routing Ends **/
//app.use(fileUpload());

var multer = require('multer');

app.use(multer({
    dest:"/data/fruitmix/files"
}).any());

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
//               res.writeHead(500, {'Content-Type': 'tex t/plain'});
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
spawnSync('rm',['-rf','/data/fruitmix/uploads']);
spawnSync('mkdir',['/data/fruitmix/uploads']);
if(!fs.existsSync('/data/fruitmix/thumbs')){
  spawnSync('mkdir',['/data/fruitmix/thumbs']);
}
if(!fs.existsSync('/data/fruitmix/library')){
  spawnSync('mkdir',['/data/fruitmix/library']);
}
if(!fs.existsSync('/data/fruitmix/drive')){
  spawnSync('mkdir',['/data/fruitmix/drive']);
}
// fmap = new Map();
try{
  var to1=xattr.getSync('/data/fruitmix/library','user.owner').toString('utf-8')
  if(to1!==''){
    xattr.setSync('/data/fruitmix/library','user.owner','')
  }
}
catch(e){
  xattr.setSync('/data/fruitmix/library','user.owner','')
}
try{
  var to1=xattr.getSync('/data/fruitmix/drive','user.owner').toString('utf-8')
  if(to1!==''){
    xattr.setSync('/data/fruitmix/drive','user.owner','')
  }
}
catch(e){
  xattr.setSync('/data/fruitmix/drive','user.owner','')
}
try{
  var to1=xattr.getSync('/data/fruitmix/thumbs','user.owner').toString('utf-8')
  if(to1!==''){
    xattr.setSync('/data/fruitmix/thumbs','user.owner','')
  }
}
catch(e){
  xattr.setSync('/data/fruitmix/thumbs','user.owner','')
}

global.dmap = new Map();
global.memt = require('./middleware/treemanager');
global.builder = require('./middleware/treebuilder');
builder.checkall('/data/fruitmix/**');


global.mshare = require('./middleware/mediamanager');
helper.buildmediamap();

var io = require("socket.io").listen(10086);

var MTOpermission = require('./middleware/mtopermission');
var MTOattribute = require('./middleware/mtoattribute');

io.sockets.on('connection', function(socket){
  socket.on('addfoldernode', function(msg){
    if(!memt.has(msg.uid)){
      var mtop=new MTOpermission(msg.readlist,msg.writelist,msg.owner);
      var mtoa= new MTOattribute(msg.createtime,msg.changetime,msg.modifytime,msg.size,msg.path.substr(msg.path.lastIndexOf('/')+1));
      var memobj = new MTObj(msg.uid,msg.type,msg.parent,[],msg.path,mtop,mtoa,msg.hash);
      memt.add(msg.uid,memobj);
      //console.log(msg.uid);
      //console.log(msg.path);
      dmap.set(msg.path,msg.uid);
    }
  });

  socket.on('addfilenode', function(msg){
    if(!memt.has(msg.uid)){
      var a =helper.pastedetail(msg.path,msg.uid);
      var mtop=new MTOpermission(msg.readlist,msg.writelist,msg.owner);
      var mtoa= new MTOattribute(msg.createtime,msg.changetime,msg.modifytime,msg.size,msg.path.substr(msg.path.lastIndexOf('/')+1));
      var memobj = new MTObj(msg.uid,msg.type,msg.parent,[],msg.path,mtop,mtoa,msg.hash,'');
      //console.log("ttttt")
      memt.add(msg.uid,memobj);
      //console.log(msg.uid);
      //console.log(msg.path);
    }
  });

  socket.on('addchild', function(msg){
    memt.addchild(msg.parent,memt.get(msg.uid));
  });

  socket.on('checkpath', function(msg){
    builder.docheck(msg.path);
  });

  socket.on('rename', function(msg){
    memt.setname(msg.uid,msg.filename);
  });

  socket.on('moveto', function(msg){
    memt.moveto(msg.uid,msg.target);
  });

  socket.on('setroot', function(msg){
    memt.setroot(msg.uid);
  });

  socket.on('deletefolderorfile', function(msg){
    memt.deletefile(msg.uid);
  });
});


var rule = new schedule.RecurrenceRule();
// rule.dayOfWeek = [0, new schedule.Range(1, 6)];
// rule.hour = 6;
// rule.minute =0;
rule.second = 0;
schedule.scheduleJob(rule, function(){
  //builder.checkall('/mnt/**');
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

// module.exports = app;
/**
 * Module dependencies.
 */

// var app = require('../build/app');
var debug = require('debug')('myapp:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '80');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
server.timeout = 100000000000;
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
