import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'
import express from 'express'
import favicon from 'serve-favicon'
import logger from 'morgan'
import bodyParser from 'body-parser'

import xattr from 'fs-xattr'

import models from './models/models'
import { createUserModel } from './models/userModel'

import auth from './middleware/auth'

/** Express **/
let app = express()

// this module is not recommended for using on top level
// var timeout =require('connect-timeout');
// app.use(timeout('10000s'));

let env = app.get('env')
if (env !== 'production' && env !== 'development' && env !== 'test') {
  console.log('Unrecognized NODE_ENV string: ' + env)
  console.log('exit')
  process.exit(1)
} else {
  console.log('NODE_ENV is set to ' + env)
}

/**
var User = require('./models/user')
var Version = require('./models/version')
var Versionlink = require('./models/versionlink')
var Comment = require('./models/comment')
var Udbindling = require('./models/udbinding')
var Librarylist = require('./models/librarylist')
var Exif = require('./models/exif')
**/
// var auth = require('./middleware/auth').default
// var helper = require('./middleware/tools')

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (env !== 'test') app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(auth.init())

/** Routeing Begins **/
app.use(express.static(path.join(__dirname, 'public')))
// app.use('/', require('./routes/index'))
app.use('/init', require('./routes/init2').default)
app.use('/login', require('./routes/login').default)
app.use('/token', require('./routes/token'))
// app.use('/users', require('./routes/users'))
// app.use('/files', require('./routes/files'))
// app.use('/media', require('./routes/media'))

app.use('/authtest', require('./routes/authtest'))
// app.use('/library', require('./routes/library'))
// app.use('/mediashare', require('./routes/mediashare'))

/** Routing Ends **/
// app.use(multer({ dest:'/data/fruitmix/files' }).any())
console.log('app started')

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

