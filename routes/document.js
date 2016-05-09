var Document = require('mongoose').model('Document');
var Documentlink = require('mongoose').model('Documentlink');
var Photolink = require('mongoose').model('Photolink');
var router = require('express').Router();
const auth = require('middleware/auth');
const uuid = require('node-uuid');
var url = require("url");
var sha256 = require('sha256');
var helper = require('middleware/tools');
const readChunk = require('read-chunk');
const fileType = require('file-type');
var fs = require('fs');

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
              if(helper.contains(tlist,req.query.target)){
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
  if (pathname==="/"){
    Document.find({hash:datahash},'hash data',(err,docs) => {
      if (docs.length===0){
        Documentlink.find({uuid:duuid},'uuid dhashlist',(err,docs) => {
          if(docs.length===0){
            newdocument.save((err) => {
            if (err) { return res.status(500).json(null); }
          });
          var tmplist =[];
          tmplist.push(datahash);
          var newdocumentlink = new Documentlink({
            uuid:uuid.v4(),
            dhashlist:tmplist,
          });
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
    Documentlink.find({uuid:duuid},'uuid dhashlist',(err,docs) => {
      if(docs.length!==0){
        var x =docs[0].dhashlist;
        console.log(x);
        x.push(datahash);
        console.log(x);
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

