/******************************************************************************
 *
 * VERY IMPORTANT! Be sure to read and have a thorough understanding of
 * the following documents:
 *
 * https://stormpath.com/blog/jwt-the-right-way
 * https://www.npmjs.com/package/passport-jwt
 * https://github.com/dwyl/learn-json-web-tokens
 *
 *****************************************************************************/

var passportJwt = require('passport-jwt')

var JwtStrategy = passportJwt.Strategy
var ExtractJwt = passportJwt.ExtractJwt

// var User = require('mongoose').model('User')
var jwtConf = require('../config/passport_jwt')

import Models from '../models/models'

const decorator = (passport) => {

  var opts = {
    secretOrKey: jwtConf.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeader()
  }

  var verify = (jwt_payload, done) => {

    let User = Models.getModel('user')    
    let user = User.collection.list.find(u => u.uuid === jwt_payload.uuid)
    user ? done(null, user) : done(null, false)
  }
  passport.use(new JwtStrategy(opts, verify))
}

module.exports = decorator


