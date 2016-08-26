import passport from 'passport'
import { BasicStrategy } from 'passport-http'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'

import Models from '../models/models'
import { secret } from '../config/passport_jwt'

const httpBasicVerify = (username, password, done) => 
  Models.getModel('user')
    .verifyPassword(username, password)
    .then(usr => {
      usr ? done(null, usr) : done(null, false)
    })
    .catch(e => done(e))

const jwtOpts = {
  secretOrKey: secret,
  jwtFromRequest: ExtractJwt.fromAuthHeader()
}

const jwtVerify = (jwt_payload, done) => {
  let User = Models.getModel('user')    
  let user = User.collection.list.find(u => u.uuid === jwt_payload.uuid)
  user ? done(null, user) : done(null, false)
}

passport.use(new BasicStrategy(httpBasicVerify))
passport.use(new JwtStrategy(jwtOpts, jwtVerify))

export default {
  init: () => passport.initialize(),
  basic: () => passport.authenticate('basic', { session: false }),
  jwt: () => passport.authenticate('jwt', { session: false })
}

