import passport from 'passport'
var BasicStrategy = require('passport-http').BasicStrategy

import Models from '../models/models'

const decorator = (passport) => {

  let verify = (username, password, done) => 
    Models.getModel('user')
      .verifyPassword(username, password)
      .then(usr => {
        usr ? done(null, usr) : done(null, false)
      })
      .catch(e => done(e))
  
  passport.use(new BasicStrategy(verify))
}

module.exports = decorator 


