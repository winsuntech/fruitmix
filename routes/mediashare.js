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
var debug=false;

async function getall(docs,user){
  var data=[];
  debug && console.log(2);
  for (var i of docs){
    debug && console.log(2.1);
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
      debug && console.log(3.2)
      debug && console.log(doc[0])
      sv.latest=doc[0];
    })
    debug && console.log(sv.latest.viewers)
    debug && console.log(sv)
    if(helper.contains(sv.latest.viewers,user)||helper.contains(sv.latest.maintainers,user)||sv.latest.creator===user){
      data.push(sv);
    }
  }
  console.log(4);
  return data
}

async function dopatch(clist,user){
  for (var x of clist){
    var i=0
    console.log("=========================")
    console.log(i)
    console.log("=========================")
    console.log(x)
    i=i+1
    var tcheck=0;
    //console.log(x)
    //console.log(2)
    if(x.op==='add'){
      console.log(3)
      var tmplist=[]
      var targethash=''
      await Versionlink.find({uuid:x.path},'uuid latest',(err,docs) => {
        if(docs.length!==0){
          console.log(4)
          tmplist = docs[0].latest;
          targethash=tmplist[tmplist.length-1];
          console.log(4.1)
        }
      })
      //console.log(tmplist)
      //console.log(targethash)
      await Version.find({_id:targethash,maintainers:{"$in":[user]}}, 'docversion creator maintainers viewers album sticky archived tags contents mtime', (err, doc) => {
        if(doc.length!==0){
          console.log(5)
          var tlist=doc[0].contents;
          var tplist=doc[0].contents;
          var to=x.value;
          var ttime=new Date().getTime()
          to.ctime=ttime
          to.creator=user
          tlist.push(to);
          var newversion = new Version({
                docversion:doc[0].docversion,
                creator:doc[0].creator,
                maintainers:doc[0].maintainers,
                viewers:doc[0].viewers,
                album:doc[0].album,
                sticky:doc[0].sticky,
                archived:doc[0].archived,
                tags:doc[0].tags,
                contents: tlist,
                mtime: ttime
          })
          newversion.save((err) => {
          })
          console.log(6)
          var sv={}
          sv.uuid=x.path
          sv.key=newversion.get("id")
          sv.creator=doc[0].creator
          var tlist=doc[0].maintainers
          if (!helper.contains(tlist,doc[0].creator)){
            tlist.push(doc[0].creator)
          }
          for(var tx of doc[0].viewers){
            if(!helper.contains(tlist,tx)){
              tlist.push(tx)
            }
          }
          sv.viewers=tlist
          mshare.add(to.digest,sv)
          for(var pp of tplist){
            mshare.updatekey(pp.digest,x.path,newversion.get("id"))
          }
          tmplist.push(newversion.get("id"))
        }
      })
      await Versionlink.findOneAndUpdate({uuid:x.path},{$set:{latest:tmplist}},function (err) {
        console.log(7)
      })
      //mshare.doadd()
    }
    else if(x.op==='remove'){
      var tmplist=[]
      var targethash=''
      await Versionlink.find({uuid:x.path},'uuid latest',(err,docs) => {
        if(docs.length!==0){
          tmplist = docs[0].latest;
          targethash=tmplist[tmplist.length-1];
        }
      })
      await Version.find({_id:targethash,maintainers:{"$in":[user]}}, 'docversion creator maintainers viewers album sticky archived tags contents mtime', (err, doc) => {
        if(doc.length!==0){
          var tlist=doc[0].contents;
          var tplist=doc[0].contents;
          var to=x.value;
          var ttime=new Date().getTime()
          //var tplist=helper.removex(tlist,to)
          for (var i = 0; i < tlist.length; i++) {
            if (tlist[i].digest === to.digest) {
              mshare.deleteone(to.digest,x.path)
              tlist.splice(i, 1);
            }
          }
          var newversion = new Version({
                docversion:doc[0].docversion,
                creator:doc[0].creator,
                maintainers:doc[0].maintainers,
                viewers:doc[0].viewers,
                album:doc[0].album,
                sticky:doc[0].sticky,
                archived:doc[0].archived,
                tags:doc[0].tags,
                contents: tlist,
                mtime: ttime
          })
          newversion.save((err) => {
          })

          for(var pp of tplist){
            mshare.updatekey(pp.digest,x.path,newversion.get("id"))
          }
          tmplist.push(newversion.get("id"))
        }
      })
      await Versionlink.findOneAndUpdate({uuid:x.path},{$set:{latest:tmplist}},function (err) {
      })
    }
    else if(x.op==='replace'){
        //console.log(1)
      var tmplist=[]
      var targethash=''  
      await Versionlink.find({uuid:x.path},'uuid latest',(err,docs) => {
        //console.log(2)
        if(docs.length!==0){
          //console.log(3)
          tmplist = docs[0].latest;
          targethash=tmplist[tmplist.length-1];
        }
      })
      await Version.find({_id:targethash,maintainers:{"$in":[user]}}, 'docversion creator maintainers viewers album sticky archived tags contents mtime', (err, doc) => {
        if(doc.length!==0){
          var tlist=doc[0].contents;
          var tplist=doc[0].contents;
          // console.log(5)
          var to=x.value;
          // console.log(6)
          console.log(x.value.viewers);
          console.log(x.value.maintainers);
          // console.log(7)
          var ttime=new Date().getTime()
          var newversion = new Version({
                docversion:doc[0].docversion,
                creator:doc[0].creator,
                maintainers:to.maintainers,
                viewers:to.viewers,
                album:to.album,
                sticky:doc[0].sticky,
                archived:to.archived,
                tags:to.tags,
                contents: tlist,
                mtime: ttime
          })
          newversion.save((err) => {
          })
          var tlist=to.maintainers
          if (!helper.contains(tlist,doc[0].creator)){
            tlist.push(doc[0].creator)
          }
          for(var tx of to.viewers){
            if(!helper.contains(tlist,tx)){
              tlist.push(tx)
            }
          }
          for(var pp of tplist){
            mshare.updateviewers(pp.digest,x.path,newversion.get("id"),tlist)
          }
          tmplist.push(newversion.get("id"))
        }
      })
      await Versionlink.findOneAndUpdate({uuid:x.path},{$set:{latest:tmplist}},function (err) {

      })
    }
  }
}

router.get('/*',auth.jwt(), (req, res) => {
  var pathname = url.parse(req.url).pathname;
  var duuid = pathname.substr(1);
  if (pathname!=='/'){
    console.log(duuid)
    console.log(req.user.uuid)
    if(duuid===req.user.uuid){
      console.log(1)
      var tmparray=[];
      helper.getfilelistbyhash(req.user.uuid,[]).forEach(function(f){
        const buffer = readChunk.sync(memt.getpath(f.uuid), 0, 262);
        var filetype = fileType(buffer);
        if (filetype!==null&&helper.filetype(filetype.ext)==='image'){
          tmparray.push(f.hash);
        }
        else if (filetype!==null&&helper.filetype(filetype.ext)==='music'){
          tmparray.push(f.hash);
        }
        else if (filetype!==null&&helper.filetype(filetype.ext)==='video'){
          tmparray.push(f.hash);
        }
      })
      return res.status(200).json(tmparray);
    }
    else{
      Versionlink.find({uuid:duuid},'uuid latest',(err,docs) => {
        if(docs.length!==0){
        var tmplist = docs[0].latest;
        console.log(docs[0])
        var targethash=tmplist[tmplist.length-1];
        Version.find({_id:targethash}, 'docversion creator maintainers viewers album sticky archived tags contents mtime', (err, doc) => {
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
  // else if(req.query.type==='test'){
  //   return res.status(200).json(mshare.getallshare('c31a2e99-987d-4f65-9559-22e22ff603da'));
  // }
  else {
    Versionlink.find({},'uuid latest',(err,docs)=>{
      if(docs.length!==0){
        getall(docs,req.user.uuid)
          .then(r => {
            var data=[]
            var after = Number(req.query.after);
            if(!Number.isNaN(after)){
              for (var x of r){
                if(x.latest.mtime>req.query.after){
                  data.push(x);
                }
              }
            }
            else data=r
            var data1=[];
            if(req.query.format==='key'){
              for(var y of data){
                var ty={}
                ty.uuid=y.uuid
                ty.latest = y.latest._id
                data1.push(ty)
              }
            }
            else data1=data
            res.status(200).json(data1)
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

router.post('/',auth.jwt(),(req, res) => {
  var data=req.body;
  debug && console.log(data);
  console.log(data.contents);
  console.log(data.album);
  var sv={}
  var tmaplist = []
  tmaplist.push(req.user.uuid);
  var tlist=[];
  var ttime=new Date().getTime()
  try{
    var tp=JSON.parse(data.contents)
  }
  catch(e){
    console.log(e);
  }
  debug && console.log(1);
  try{
    var pclist=[]
    for (var i of tp){
      var pcheck=false
      i.ctime=ttime;
      i.creator=req.user.uuid;
      tlist.push(i);
      var objs=memt.getbyhash(i.digest);
      objs.forEach(function(f){
        if(memt.checkreadpermission(f,req.user.uuid)===1||memt.checkwritepermission(f,req.user.uuid)===1||memt.checkownerpermission(f,req.user.uuid)===1){
          pcheck=true;
        }
      })
      pclist.push(pcheck);
    }
    if(helper.contains(pclist,false)){
      return res.status(403).json('Permission denied');
    }
  }
  catch(e){
    console.log(e)
  }
  debug && console.log(2);
  var tm=JSON.parse(data.maintainers)
  var tv=JSON.parse(data.viewers)
  try{
    for (var x of tm){
      if(!helper.contains(tmaplist,x)){
        tmaplist.push(x);
      }
    }
  }
  catch(e){
    console.log(e);
  }
  debug && console.log(3);
  for (var y of tv){
    if(!helper.contains(tmaplist,y)){
      tmaplist.push(y);
    }
  }
  debug && console.log(4);
  var newversion = new Version({
    docversion:"1.0",
    creator:req.user.uuid,
    maintainers:tm,
    viewers:tv,
    album:data.album,
    sticky:false,
    archived:false,
    tags:data.tags,
    contents: tlist,
    mtime: ttime
  });
  debug && console.log(5);
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
  rdata.latest.archived=data.archived;
  rdata.latest.tags=[];
  rdata.latest.contents= tlist;
  rdata.latest.mtime= ttime;

  newversionlink.save((err) => {
    if (err) { return res.status(500).json(null); }
  })
  debug && console.log(6);
  sv.uuid=tmpuuid
  sv.key=newversion.get("id")
  sv.viewers=tmaplist
  sv.creator = req.user.uuid
  for (var t of tlist){
    mshare.add(t.digest,sv);
  }
  return res.status(200).json(rdata);
});

router.patch('/',auth.jwt(), (req, res) => {
  console.log(1)
  //console.log(req.body)
  var clist=JSON.parse(req.body.commands);
  //console.log(clist)
  dopatch(clist,req.user.uuid)
  return res.status(200).json(null);
});



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

