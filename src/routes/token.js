const router = require('express').Router()
const jwt = require('jwt-simple')
const conf = require('../config/passport_jwt')
import auth from '../middleware/auth'

router.get('/', auth.basic(), (req, res) => {
  res.status(200).json({
    type: 'JWT',
    token: jwt.encode({ uuid: req.user.uuid }, conf.secret)
  })  
})

module.exports = router

