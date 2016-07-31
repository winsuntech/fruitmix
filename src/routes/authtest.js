var router = require('express').Router()
var passport = require('passport')

router.get('/', passport.authenticate('jwt', { session : false }), (req, res) => {
  
  console.log('+++')
  console.log(req.user)
  console.log('+++')

  res.send('test test')
})

module.exports = router


