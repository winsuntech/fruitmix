var Group = require('mongoose').model('Group');
var router = require('express').Router();
const auth = require('../middleware/auth');
const uuid = require('node-uuid');
var url = require("url");
var sha256 = require('sha256');
var helper = require('../middleware/tools');
const readChunk = require('read-chunk');
const fileType = require('file-type');
var fs = require('fs');

router.get('/*',auth.jwt(), (req, res) => {
  var pathname = url.parse(req.url).pathname;
  var duuid = pathname.substr(1);
  if (req.user.isAdmin === true ) {
  //if (pathname==='/'){
    Group.find({},'uuid groupname members',(err,docs) => {
      if (err) {
        return res.status(500).json(null);
      }
      var data =docs.map(doc => ({
        uuid: doc.uuid, 
        groupname:doc.groupname,
        members:doc.members
      }))
      return res.status(200).json(data);
    })
  }
  else{
    return res.status(403).json('403 Permission denied');
  }
  // }
  // else {
  //   var tlist=[];
  //   Documentlink.find({},'uuid dhashlist',(err,docs)=>{
  //     if(docs.length!==0){
  //       docs.forEach(function(f){
  //         var rdata={}
  //         // Document.find({hash:f.dhashlist[f.dhashlist.length-1]}, 'hash data', (err, docs) => {
  //         //   if (err) {
  //         //     return res.status(500).json(null);
  //         //   }
  //         //   var data={};
  //         //   data.hash=docs[0].hash; 
  //         //   data.data=docs[0].data;
  //         //   rdata.uuid=f.uuid;
  //         //   rdata.lhash=f.dhashlist[f.dhashlist.length-1];
  //         //   rdata.document=data;
  //         //   tlist.push(rdata);
  //         // });
  //         rdata.uuid=f.uuid;
  //         rdata.lhash=f.dhashlist[f.dhashlist.length-1];
  //         tlist.push(rdata);
  //       })
  //       return res.status(200).json(tlist);
  //     }
  //     else return res.status(200).json([]);
  //   })
  // }
});

router.post('/*',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === true ) {
    var pathname = url.parse(req.url).pathname;
    var duuid = pathname.substr(1);

    var tmpuuid=uuid.v4();
    var newgroup = new Group({
      uuid:tmpuuid,
      groupname:req.body.groupname,
      members:req.body.members
    });
    return res.status(200).json(tmpuuid);
  }
  else{
    return res.status(403).json('403 Permission denied');
  }
});

router.delete('/*',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === true ) {
    var pathname = url.parse(req.url).pathname;
    var duuid = pathname.substr(1);
    Group.find({uuid: duuid},'uuid groupname members',(err,docs) => {
      if (docs.length===0){return res.status(404).json('invalid uuid');}
      else{
        Group.remove({ uuid: duuid }, (err) => {
          if (err) { return res.status(500).json(null); }
          return res.status(200).json(null);
        });
      }
    })
  }
  else{
    return res.status(403).json('403 Permission denied');
  }
});

router.patch('/',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === true ) {
    if(!req.body.uuid){return res.status(400).json('uuid is missing');}
    
    Group.find({uuid: duuid},'uuid groupname members',(err,docs) => {
      if (docs.length===0){return res.status(404).json('invalid uuid');}
      else{
        User.update({uuid:duuid},{$set:{groupname:req.body.groupname,members:req.body.members}},(err) => {
          if (err) { return res.status(500).json(null); }
            return res.status(200).json(null);
        })
      }
    })
  }
  else{
    return res.status(403).json('403 Permission denied');
  }
});


module.exports = router;

