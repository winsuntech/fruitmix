var Version = require('mongoose').model('Version');
var Versionlink = require('mongoose').model('Versionlink');
// var Photolink = require('mongoose').model('Photolink');
// var Group = require('mongoose').model('Group');
var router = require('express').Router();
const auth = require('middleware/auth');
const uuid = require('node-uuid');
var url = require("url");
var sha256 = require('sha256');
var helper = require('middleware/tools');
const readChunk = require('read-chunk');
const fileType = require('file-type');
var fs = require('fs');
var debug=true;

async function getall(docs){
  var data=[];
  console.log(2);
  for (var i of docs){
    console.log(2.1);
    var sv={};
    sv.uuid=i.uuid;
    // try{
    // sv.latest=await versionsearch(i);
    // }
    // catch(e){
    //   console.log(e);
    // }
    await Version.find({_id:i.latest[i.latest.length-1]}, 'docversion creator maintainers viewers album sticky archived tags contents mtime', (err, doc) => {
      if(err)console.log(err);
      console.log(3.2)
      sv.latest=doc;
    })
    data.push(sv);
  }
  console.log(4);
  return data
}

router.get('/*',auth.jwt(), (req, res) => {
  var pathname = url.parse(req.url).pathname;
  var duuid = pathname.substr(1);
  if (pathname!=='/'){
    Versionlink.find({uuid:duuid},'uuid latest',(err,docs) => {
      if(docs.length!==0){
      var tmplist = docs[0].dhashlist;
      var targethash=tmplist[tmplist.length-1];
      Version.find({_id:targethash}, 'docversion creator maintainer viewers album sticky archived tags contents mtime', (err, doc) => {
        if (err) {
          return res.status(500).json(null);
        }
        var data={};
        data.uuid=docs[0].uuid; 
        data.docversion=doc[0].docversion;
        data.creator=doc[0].creator;
        data.maintainers=doc[0].maintainers;
        data.viewers=doc[0].viewers;
        data.album=doc[0].album;
        data.sticky=doc[0].sticky;
        data.archived=doc[0].archived;
        data.tags=doc[0].tags;
        data.contents=doc[0].contents;
        data.mtime=doc[0].mtime;
        return res.status(200).json(data);
        });
      }
    });
  }
  // else if(pathname==='/'&&req.query.type==='photo'){
  //   var tlist=[];
  //   Photolink.find({},'uuid photohash',(err,docs)=>{
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
  //         rdata.photohash=f.photohash;
  //         tlist.push(rdata);
  //       })
  //       return res.status(200).json(tlist);
  //     }
  //     else return res.status(200).json([]);
  //   })
  // }
  else {
    Versionlink.find({},'uuid latest',(err,docs)=>{
      if(docs.length!==0){
        getall(docs)
          .then(r => {
            res.status(200).json(r)
          })
          .catch(e => {
          })
        // console.log(1);
        // var tlist= getall(docs);
        // console.log(5);
        //return res.status(200).json(tlist);
      }
      else return res.status(200).json([]);
    })
  }
});

router.post('/*',auth.jwt(), (req, res) => {
  var data=req.body;
  var tlist=[];
  var ttime=new Date().getTime()
  var tp=JSON.parse(data.contents)
  for (var i of tp){
    i.ctime=ttime;
    i.creator=req.user.uuid;
    tlist.push(i);
  }

  debug && console.log(1);
  var tm=JSON.parse(data.maintainers)
  var tv=JSON.parse(data.viewers)
  var newversion = new Version({
    docversion:"1.0",
    creator:req.user.uuid,
    maintainers:tm,
    viewers:tv,
    album:data.album,
    sticky:false,
    archived:false,
    tags:[],
    contents: tlist,
    mtime: ttime
  });

  newversion.save((err) => {
    if (err) { return res.status(500).json(null);}
  })

  console.log(newversion.get("id"));

  var tmplist =[];
  tmplist.push(newversion.get("id"));
  var tmpuuid=uuid.v4();
  var newversionlink = new Versionlink({
    uuid:tmpuuid,
    latest:tmplist
  });
  var rdata={}
  rdata.uuid=tmpuuid;
  rdata.latest={}
  rdata.latest.docversion="1.0";
  rdata.latest.creator=req.user.uuid;
  rdata.latest.maintainers=tm;
  rdata.latest.viewers=tv;
  rdata.latest.album=data.album;
  rdata.latest.sticky=false;
  rdata.latest.archived=false;
  rdata.latest.tags=[];
  rdata.latest.contents= tlist;
  rdata.latest.mtime= ttime;

  newversionlink.save((err) => {
    if (err) { return res.status(500).json(null); }
    return res.status(200).json(rdata);
  })

});

// router.patch('/*',auth.jwt(), (req, res) => {
//   else{
//     debug && console.log(4);
//     Group.find({ members:{$contains:req.user.uuid}},'uuid groupname members',(err,docs) =>{
//       console.log(docs);
//       if(docs===undefined||docs.length!==0){
//         for (var i in docs){
//           tmplist = docs.members
//         }
//       }
//       else{
//         tmplist = [];
//       }
//         Documentlink.find({uuid:duuid},'uuid dhashlist',(err,doc) => {
//           if(doc.length!==0){
//             var x =doc[0].dhashlist;
//             x.push(datahash);
//             Documentlink.findOneAndUpdate({uuid:duuid}, { $set: { dhashlist: x }}, function (err) {
//               if (err) return handleError(err);
//               else{
//                 newdocument.save((err) => {
//                   if (err) { return res.status(500).json(null); }
//                   return res.status(200).json(null);
//                 });
//               }
//               });
//           }
//           else{
//             return res.status(404).json('invalid uuid');
//           }
//         })
//       //}

//     });



//   }
// });

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

