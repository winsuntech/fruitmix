var Document = require('mongoose').model('Document');
var Documentlink = require('mongoose').model('Documentlink');
var Photolink = require('mongoose').model('Photolink');
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
var debug=true;

router.get('/*',auth.jwt(), (req, res) => {
  var pathname = url.parse(req.url).pathname;
  var duuid = pathname.substr(1);

  if (pathname!=='/'&&req.query.type==='listdetail'){
    Documentlink.find({uuid:duuid},'dhashlist',(err,docs) => {
        if(docs.length!==0){
        var tmplist = docs[0].dhashlist;
        var targethash=tmplist[tmplist.length-1];
        Document.find({hash:targethash}, 'hash data', (err, docs) => {
          if (err) {
            return res.status(500).json(null);
          }
          var data={};
          data.hash=docs[0].hash; 
          data.data=docs[0].data;
          return res.status(200).json(data);
          });
        }
      });
  }
  else if(pathname!=='/'&&req.query.type==='photo'){
    Documentlink.find({uuid:duuid},'uuid dhashlist',(err,docs) => {
      if(docs.length!==0){
        Document.find({hash:docs[0].dhashlist[docs[0].dhashlist.length-1]}, 'hash data', (err, docs) => {
          if(docs.length!==0){
            var tlist=docs[0].data.content;
            var check=0;
            var tmpobj="";
            for(var d in tlist){
              if(d.digest===req.query.target){
                check=1;
                tmpobj=d;
              }
            }
            if(check===1){
              var pcheck=0;
              for(var x in memt.getbyhash(d.digest)){
                if(memt.checkownerpermission(x,d.creator)===1||memt.checkwritepermission(x,creator)===1){
                  pcheck=1;
                }  
              }
              if(pcheck===1){
                var tuuid=memt.getbyhash(req.query.target);
                var tpath=memt.getpath(tuuid[0]);
                fs.readFile(tpath, "binary", function(err, file) {
                  if (err) {
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end(err);
                  } else {
                    const buffer = readChunk.sync(tpath, 0, 262);
                    var filetype =  fileType(buffer);
                    res.writeHead(200, {'Content-Type': filetype.mime});
                    res.write(file, "binary");
                    res.end();
                  }
                });
              }
              else{
                return res.status(403).json('Permission denied'); 
              }
            }
            else return res.status(404).json('invalid hash');
          }
          else return res.status(404).json('invalid hash');
        })
      }
      else return res.status(404).json('invalid hash');
    });
  }
  else if(pathname==='/'&&req.query.type==='photo'){
    var tlist=[];
    Photolink.find({},'uuid photohash',(err,docs)=>{
      if(docs.length!==0){
        docs.forEach(function(f){
          var rdata={}
          // Document.find({hash:f.dhashlist[f.dhashlist.length-1]}, 'hash data', (err, docs) => {
          //   if (err) {
          //     return res.status(500).json(null);
          //   }
          //   var data={};
          //   data.hash=docs[0].hash; 
          //   data.data=docs[0].data;
          //   rdata.uuid=f.uuid;
          //   rdata.lhash=f.dhashlist[f.dhashlist.length-1];
          //   rdata.document=data;
          //   tlist.push(rdata);
          // });
          rdata.uuid=f.uuid;
          rdata.photohash=f.photohash;
          tlist.push(rdata);
        })
        return res.status(200).json(tlist);
      }
      else return res.status(200).json([]);
    })
  }
  else {
    var tlist=[];
    Documentlink.find({},'uuid dhashlist',(err,docs)=>{
      if(docs.length!==0){
        docs.forEach(function(f){
          var rdata={}
          // Document.find({hash:f.dhashlist[f.dhashlist.length-1]}, 'hash data', (err, docs) => {
          //   if (err) {
          //     return res.status(500).json(null);
          //   }
          //   var data={};
          //   data.hash=docs[0].hash; 
          //   data.data=docs[0].data;
          //   rdata.uuid=f.uuid;
          //   rdata.lhash=f.dhashlist[f.dhashlist.length-1];
          //   rdata.document=data;
          //   tlist.push(rdata);
          // });
          rdata.uuid=f.uuid;
          rdata.lhash=f.dhashlist[f.dhashlist.length-1];
          tlist.push(rdata);
        })
        return res.status(200).json(tlist);
      }
      else return res.status(200).json([]);
    })
  }
});

router.post('/*',auth.jwt(), (req, res) => {
  var data=req.body;
  data.owner = req.user.uuid;
  data.createtime = new Date().getTime();
  data.lastmodifytime = new Date().getTime();
  var datahash = sha256(JSON.stringify(data));
  debug && console.log(1);
  var newdocument = new Document({
    hash:datahash,
    data:data,
    // username: req.body.username,
    // password: req.body.password,
    // avatar: 'defaultAvatar.jpg',
    // isAdmin: req.body.isAdmin,
    // email:req.body.email,
    // isFirstUser: false,
    // type: 'user',
  });
  var pathname = url.parse(req.url).pathname;
  var duuid = pathname.substr(1);
  debug && console.log(2);
  if (pathname==="/"){
    debug && console.log(3);
    Document.find({hash:datahash},'hash data',(err,docs) => {
      if (docs.length===0){
        Documentlink.find({uuid:duuid},'uuid dhashlist',(err,docs) => {
          if(docs.length===0){
            newdocument.save((err) => {
            if (err) { return res.status(500).json(null); }
          });
          var tmplist =[];
          tmplist.push(datahash);
          var tmpuuid=uuid.v4();
          var newdocumentlink = new Documentlink({
            uuid:tmpuuid,
            dhashlist:tmplist
          });
          if(req.body.doctype==='photolink'){
            var newphotolink = new Photolink({
              uuid:tmpuuid,
              photohash:req.body.contents.digest
            });
            newphotolink.save((err)=>{
              if (err) { return res.status(500).json(null); }
            })
          }
          newdocumentlink.save((err) => {
            if (err) { return res.status(500).json(null); }
          });
          return res.status(200).json(null);
                }
              })
          }
      else return res.status(200).json(null);
    })
  }
  else{
    debug && console.log(4);
    Group.find({ members:{$contains:req.user.uuid}},'uuid groupname members',(err,docs) =>{
      console.log(docs);
      if(docs===undefined||docs.length!==0){
        for (var i in docs){
          tmplist = docs.members
        }
      }
      else{
        tmplist = [];
      }

      //(&&req.body.doctype==='album')
        Documentlink.find({uuid:duuid},'uuid dhashlist',(err,doc) => {
          if(doc.length!==0){
            var x =doc[0].dhashlist;
            x.push(datahash);
            Documentlink.findOneAndUpdate({uuid:duuid}, { $set: { dhashlist: x }}, function (err) {
              if (err) return handleError(err);
              else{
                newdocument.save((err) => {
                  if (err) { return res.status(500).json(null); }
                  return res.status(200).json(null);
                });
              }
              });
          }
          else{
            return res.status(404).json('invalid uuid');
          }
        })
      //}

    });



  }
});

// router.delete('/',auth.jwt(), (req, res) => {
//   if (req.user.isAdmin === true ) {
//     if(!req.body.uuid){return res.status(400).json('uuid is missing');}
//     User.remove({ uuid: req.body.uuid }, (err) => {
//       if (err) { return res.status(500).json(null); }
//       return res.status(200).json(null);
//     });
//   }
//   else{
//     return res.status(403).json('403 Permission denied');
// }});

// router.patch('/',auth.jwt(), (req, res) => {
//   if (req.user.isAdmin === true ) {
//     if(!req.body.uuid){return res.status(400).json('uuid is missing');}
//     User.update({uuid:req.body.uuid},{$set:{username:req.body.username,isAdmin:req.body.isAdmin,password:req.body.password}},(err) => {
//     if (err) { return res.status(500).json(null); }
//       return res.status(200).json(null);
//   })}
//   else{
//     return res.status(403).json('403 Permission denied');
//   }
// });



module.exports = router;

