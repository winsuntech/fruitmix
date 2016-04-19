var passport = require('passport');

require('./passport_http')(passport);
require('./passport_jwt')(passport);

var auth = {};
auth.init = () => passport.initialize();
auth.basic = () => passport.authenticate('basic', { session: false });
auth.jwt = () => passport.authenticate('jwt', { session: false });

module.exports = auth;

