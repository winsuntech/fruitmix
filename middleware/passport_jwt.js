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

var passportJwt = require('passport-jwt');

var JwtStrategy = passportJwt.Strategy;
var ExtractJwt = passportJwt.ExtractJwt;

var User = require('mongoose').model('User');
var jwtConf = require('config/passport_jwt');

/*
 * This function is used for initialize passport with jwt strategy
 */ 
module.exports = (passport) => {

  var opts = {
    secretOrKey: jwtConf.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeader()
  };

  var verify = (jwt_payload, done) => {

    User.findOne({ uuid: jwt_payload.uuid }, (err, user) => {
    
      if (err) return done(err, false);
      if (user)
        done(null, user);
      else
        done(null, false);
    });
  };

  passport.use(new JwtStrategy(opts, verify));
};


