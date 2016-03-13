var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;

var User = require('mongoose').model('User');

module.exports = (passport) => {

  var verify = (username, password, done) => {

    User.findOne({ uuid: username }, (err, user) => {

      if (err) { return done(err); }
      if (!user) { return done(null, false); }

      user.verifyPassword(password, (err, isMatch) => {

        if (err) { return done(err); }
        if (!isMatch) { return done(null, false); }
        return done(null, user);
      });
    });
  };

  passport.use(new BasicStrategy(verify));
};


