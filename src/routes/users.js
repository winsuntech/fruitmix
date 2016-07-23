var User = require('mongoose').model('User');
var router = require('express').Router();
const auth = require('../middleware/auth');
const uuid = require('node-uuid');
var url = require("url");
var spawnSync = require('child_process').spawnSync;
var xattr = require('fs-xattr');

router.get('/',auth.jwt(), (req, res) => {
  User.find({ type: 'user' }, 'uuid username avatar email isAdmin isFirstUser type', (err, docs) => {
    if (err) {
      return res.status(500).json(null);
    }
    var data =docs.map(doc => ({
      username: doc.username, 
      uuid: doc.uuid, 
      avatar: doc.avatar,
      email: doc.email,
      isAdmin: doc.isAdmin,
      isFirstUser: doc.isFirstUser,
      type: doc.type
    })) 
    return res.status(200).json(data);
  });
});

router.post('/',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === true ) {
    var tmpuuid=uuid.v4()
    var newuser = new User({
      uuid: tmpuuid,
      username: req.body.username,
      password: req.body.password,
      avatar: 'defaultAvatar.jpg',
      isAdmin: req.body.isAdmin,
      email:req.body.email,
      isFirstUser: false,
      type: 'user',
    });
    newuser.save((err) => {
      if (err) { return res.status(500).json(err); }
      spawnSync('mkdir',['-p','/data/fruitmix/drive/'+tmpuuid]);
      let fm={}
      fm.owner=tmpuuid
      xattr.setSync('/data/fruitmix/drive/'+tmpuuid,'user.fruitmix',fm);
      xattr.setSync('/data/fruitmix/drive/'+tmpuuid,'user.owner',tmpuuid);
      builder.checkall('/data/fruitmix/drive/'+tmpuuid);
      return res.status(200).json(newuser);
    });
  }
  else{
    return res.status(403).json('403 Permission denied');
  }
});

router.delete('/',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === true ) {
    if(!req.body.uuid){return res.status(400).json('uuid is missing');}
    User.remove({ uuid: req.body.uuid }, (err) => {
      if (err) { return res.status(500).json(null); }
      return res.status(200).json(null);
    });
  }
  else{
    return res.status(403).json('403 Permission denied');
}});

router.patch('/',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === true ) {
    if(!req.body.uuid){return res.status(400).json('uuid is missing');}
    User.update({uuid:req.body.uuid},{$set:{username:req.body.username,isAdmin:req.body.isAdmin,password:req.body.password}},(err) => {
    if (err) { return res.status(500).json(null); }
      return res.status(200).json(null);
  })}
  else{
    return res.status(403).json('403 Permission denied');
  }
});


module.exports = router;

