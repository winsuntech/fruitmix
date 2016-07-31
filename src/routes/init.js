const User = require('mongoose').model('User')
const router = require('express').Router()
const uuid = require('node-uuid')
// var spawnSync = require('child_process').spawnSync;
// var xattr = require('fs-xattr');
/*
 * only post method provided for one-time usage
 */
router.post('/', (req, res) => {

  User.count({}, function (err, count) {
    // internal error
    if (err) { return res.status(500).json(null) }
    // user already exists, should be a 403. TODO
    else if (count) { return res.status(403).json(null) }
    // invalide username or password
    else if (typeof req.body.username === 'undefined' ||
      typeof req.body.username !== 'string' ||
      req.body.username.legnth === 0 ||
      typeof req.body.password === 'undefined' ||
      typeof req.body.password !== 'string' ||
      req.body.password.length === 0) {
      return res.status(400).json({ message: 'invalid username or password' })
    }
    else {
      // create first user
      var tmpuuid=uuid.v4()
      var firstUser = new User({
        uuid: tmpuuid,
        username: req.body.username,
        password: req.body.password,
        avatar: 'defaultAvatar.jpg',
        isAdmin: true,
        isFirstUser: true,
        type: 'user',
      })

      firstUser.save((err) => {
        if (err) { return res.status(500).json(null) }
/*** FIXME
        spawnSync('mkdir',['-p','/data/fruitmix/drive/'+tmpuuid]);
        let fm={}
        fm.owner=tmpuuid
        xattr.setSync('/data/fruitmix/drive/'+tmpuuid,'user.fruitmix',fm);
        xattr.setSync('/data/fruitmix/drive/'+tmpuuid,'user.owner',tmpuuid);
        builder.checkall('/data/fruitmix/drive/'+tmpuuid);
***/
        return res.status(200).json(null)
      })
    }
  })
})

module.exports = router


