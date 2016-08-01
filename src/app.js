import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'

import express from 'express'
import favicon from 'serve-favicon'
import logger from 'morgan'
import bodyParser from 'body-parser'
// var mime=require('config/mime');

import xattr from 'fs-xattr'
// var schedule = require('node-schedule');
// var MediaObj = require('./middleware/mediaobj');
// var spawnSync = require('child_process').spawnSync;
import multer from 'multer'

import mongoose from 'mongoose'
mongoose.Promise = Promise
/** Express **/
let app = express()
//var timeout =require('connect-timeout');
//app.use(timeout('10000s'));

/** Database Connection **/
let env = app.get('env')
if (env !== 'production' && env !== 'development' && env !== 'test') {
  console.log('Unrecognized NODE_ENV string: ' + env)
  console.log('exit')
  process.exit(1)
} else {
  console.log('NODE_ENV is set to ' + env)
}

var dbUrl = require('./config/database').database[env]
console.log('Database url: ' + dbUrl)
mongoose.connect(dbUrl, err => { if (err) throw err })

/** Model Initialization **/
var User = require('./models/user')
var Version = require('./models/version')
var Versionlink = require('./models/versionlink')
var Comment = require('./models/comment')
var Udbindling = require('./models/udbinding')
var Librarylist = require('./models/librarylist')
var Exif = require('./models/exif')
var Config = require('./models/config')
var auth = require('./middleware/auth')
var helper = require('./middleware/tools')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (env !== 'test') app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(auth.init())

/** Routeing Begins **/
app.use(express.static(path.join(__dirname, 'public')))
app.use('/', require('./routes/index'))
app.use('/init', require('./routes/init'))
app.use('/login', require('./routes/login'))
app.use('/token', require('./routes/token'))
app.use('/users', require('./routes/users'))
app.use('/files',require('./routes/files'))
app.use('/media',require('./routes/media'))

app.use('/authtest', require('./routes/authtest'))
app.use('/library',require('./routes/library'))
app.use('/mediashare',require('./routes/mediashare'))

/** Routing Ends **/
// app.use(multer({ dest:'/data/fruitmix/files' }).any())

/****
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
let protomaptree = require('./lib/protoMapTree');
protomaptree.createProtoMapTree('/data/fruitmix/drive/b0695859-fa4e-4eda-b1cf-296e470b70e0/','drive',(res)=>{
  console.log('-------')
  console.log(res);
  console.log('-------')
})
global.builder = require('./middleware/treebuilder');
builder.checkall('/data/fruitmix/**');


global.mshare = require('./middleware/mediamanager');
helper.buildmediamap();

****/

console.log('app started')
/**
var rule = new schedule.RecurrenceRule();
rule.second = 0;
schedule.scheduleJob(rule, function(){ });
**/
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers
app.use(function(err, req, res, next) {
  res.status(err.status || 500)
  res.type('text/plain')
  res.send(err.status + ' ' + err.message)
})

module.exports = app

