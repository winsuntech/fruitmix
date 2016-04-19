var User = require('mongoose').model('User');
var router = require('express').Router();

router.get('/', function(req, res, next) {

  User.find({ type: 'user' }, 'uuid username avatar', (err, docs) => {
    if (err) {
      return res.status(500).json(null);
    }
    res.json(docs.map(doc => ({
      username: doc.username, 
      uuid: doc.uuid, 
      avatar: doc.avatar
    }))); 
  });
});

module.exports = router;

