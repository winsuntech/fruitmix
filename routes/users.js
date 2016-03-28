var User = require('mongoose').model('User');
var router = require('express').Router();
const auth = require('middleware/auth');
const uuid = require('node-uuid');
var url = require("url");

router.get('/',auth.jwt(), (req, res) => {
  console.log(memt.get(0));
  User.find({ type: 'user' }, 'uuid username avatar email isAdmin isFirstUser type', (err, docs) => {
    if (err) {
      return res.status(500).json(null);
    }
    res.json(docs.map(doc => ({
      username: doc.username, 
      uuid: doc.uuid, 
      avatar: doc.avatar,
      email: doc.email,
      isAdmin: doc.isAdmin,
      isFirstUser: doc.isFirstUser,
      type: doc.type
    }))); 
  });
});

router.post('/',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === false ) {
    res.status(403);
    return res.send('403 Permission denied');
  }
  else{
    var newuser = new User({
      uuid: uuid.v4(),
      username: req.body.username,
      password: req.body.password,
      avatar: 'defaultAvatar.jpg',
      isAdmin: req.body.isAdmin,
      email:req.body.email,
      isFirstUser: false,
      type: 'user',
    });
    newuser.save((err) => {
      console.log(err);
      if (err) { return res.status(500).json(null); }
      return res.status(200).json(null);
    });
  }
});

router.delete('/',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === false ) {
    res.status(403)
    return res.send('403 Permission denied');
  }
  else{
    User.remove({ uuid: req.body.uuid }, (err) => {
      if (err) { return res.status(500).json(null); }
      return res.status(200).json(null);
  });
}});

router.put('/',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === false ) {
    res.status(403);
    return res.send('403 Permission denied');
  }
  else{
    console.log(req.body);
      User.update({uuid:req.body.uuid},{$set:{username:req.body.username,isAdmin:req.body.isAdmin,password:req.body.password}},(err) => {
      if (err) { return res.status(500).json(null); }
      return res.status(200).json(null);
  });
}});


module.exports = router;

