var fs = require('fs');
var xattr = require('fs-xattr');
const uuid = require('node-uuid');
var clone = require('util')._extend;
var sha256 = require('sha256');
var ExifImage = require('exif').ExifImage;
var id3 = require("jsmediatags");
var probe = require('node-ffprobe');
var gm = require('gm');
var crypto = require('crypto');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;
//var gd = require('easy-gd')


const IMAGE = ["bmp","pcx","tiff","gif","jpeg","jpg","tga","exif","fpx","svg","psd","cdr","pcd","dxf","ufo","eps","ai","png","hdri","raw"]
const MUSIC = ["mp3","wma","wav","mod","ra","cd","md","asf","aac","mp3pro","vqf","flac","ape","mid","vogg","m4a","aac","aiff","au","vqf"]
const VIDEO = ["avi","rmvb","rm","asf","divx","mpg","mpeg","mpe","wmv","mp4","mkv","vob"]
const readChunk = require('read-chunk');
const fileType = require('file-type');
var piexif = require("piexifjs");
var Version = require('mongoose').model('Version');
var Versionlink = require('mongoose').model('Versionlink');

function getHash(path) {
     var Q = require('q');
     var fs = require('fs');
     var crypto = require('crypto');

     var deferred = Q.defer();

     var fd = fs.createReadStream(path);
     var hash = crypto.createHash('sha256');
	fd.on('readable', () => {
		var data = fd.read();
		if (data)
			hash.update(data);
		else {
			//console.log(hash)
			console.log(pp)
			console.log(1)
			deferred.resolve(hash.digest('hex'));
			//return hash;
		}
	});

     fd.pipe(hash);

     return deferred.promise;
};

// async function getHash(path) {
// 	//console.log(3.1)
// 	return new Promise((resolve,reject)=>{
//      var fs = require('fs');
//      var crypto = require('crypto');
//      //console.log(3.2)
//      var fd = fs.createReadStream(path);
//      //console.log(3.21)
//      var hash = crypto.createHash('sha256');
//      //console.log(3.22)
//      hash.setEncoding('hex');
//      //console.log(3.23)
//      var tmpx =fs.readFileSync(path);
//      //console.log(sha256(tmpx));
//      fd.on('data', function (data) {
// 	    hash.update(data, 'hex')
// 	    //console.log(3.3)
// 	 })
//      fd.on('end', function () {
//         hash.end();
//         //console.log(3.4)
//         //console.log(hash.read()); 
//         //resolve(hash.read());
//         return hash.read();
//      });
//      //console.log(3.5)
//      fd.pipe(hash);
// 	})
// };

// function chash(f){
// 	xattr.setSync(f,'user.type','file');
// 		var tmpx =fs.readFileSync(f);
// 		var hash = crypto.createHash('sha256')
// 		var readStream = fs.createReadStream(f);
//       //xattr.setSync(f,'user.hash',sha256(tmpx));
//       	readStream.on('data', function(data){
// 		    hash.update(data, 'utf8')
// 		    console.log(4)
// 		})
//       	var cuuid=xattr.getSync(f,'user.uuid').toString();
// 		readStream.on('end', function(){
// 			console.log(5)
// 			var thash=hash.digest('hex')
// 			console.log(thash)
// 			console.log(cuuid);
//
// 		})
// 	readStream.pipe(hash);
// }



function contains(array, value) {
    var i = array.length;
    while (i--) {
       if (array[i] === value) {
           return true;
       }
    }
    return false;
}

function removex(array, value) {
    for (var i = 0; i < array.length; i++) {
	    if (array[i] === value) {
	        array.splice(i, 1);
	    }
    }
    return array
}

function getfilehelperbyhash(user,list) {
	var tmpobjlist =[];
	var clist=[]
	memt.gethashmap().forEach((value, key) => {
		value.forEach(function(f){
			if(memt.checkreadpermission(f,user)===1||memt.checkownerpermission(f,user)===1){
				if(!contains(clist,key)){
					tmpobjlist.push(fileformatedetail(f));
					clist.push(key);
				}
			}
		});
	});
	console.log(clist)
	for(var x of list){
		//console.log("-----------------------------");
		//console.log(x);
		var tlist=memt.getbyhash(x);
		if (tlist!==undefined){
			if(!contains(clist,x)){
				tmpobjlist.push(fileformatedetail(tlist[0]));
			}
		}
	}
	return tmpobjlist;
	// tmplist.forEach(function(f){
	// 		// if(Checker.read(f.getuuid(),user)||Checker.owner(f.getuuid(),user)){
	// 		// 	getfilehelper(f.getuuid(),user,tmpobjlist);
	// 		// }
	// 		console.log(f);
 //        });
	// if (memt.has(uuid)){
	// 	console.log(memt.getrawchildrenlist(uuid));
 //    	var tmpobj = clone({},memt.get(uuid));
 //    	tmpobj.setchildren(memt.getrawchildrenlist(uuid));
 //    	tmpobjlist.push(tmpobj);
 //    	var tmpchildren=memt.getchildren(uuid);

		
 //        return tmpobjlist;
	// }
}

function getfilehelper(uuid,user,tmpobjlist) {
	console.log(uuid)
	if (memt.has(uuid)){
    	var tmpobj = clone({},memt.get(uuid));
    	tmpobj.children=memt.getrawchildrenlist(uuid);
    	//var tpl = memt.getpath(uuid).split('/');
    	var tmpchildren=memt.getchildren(uuid);
  //   	console.log("----------");
		// console.log(memt.getpath(uuid));
		// console.log(uuid);
		// console.log(memt.checkreadpermission(uuid,user));
		// console.log(memt.checkownerpermission(uuid,user));
    	//console.log(tmpchildren)
    	if(memt.checkownerpermission(uuid,user)===1||memt.checkreadpermission(uuid,user)===1){
    		tmpobjlist.push(tmpobj);
    	}
    	else if(memt.getpath(tmpobj.uuid)==='/data/fruitmix'||memt.getpath(tmpobj.uuid)==='/data/fruitmix/drive'||memt.getpath(tmpobj.uuid)==='/data/fruitmix/libarary'){
    		tmpobjlist.push(tmpobj);
    	}
		tmpchildren.forEach(function(f){
			// if (f.attribute.name==='444.jpg'){			
			// }
			//memt.getpath(f.uuid)==='/data/fruitmix/drive'||memt.getpath(f.uuid)==='/data/fruitmix/libarary'||
			if(memt.checkreadpermission(f.uuid,user)!==0||memt.checkownerpermission(f.uuid,user)!==0){
				getfilehelper(f.uuid,user,tmpobjlist);
			}
			//console.log("------------------------------");
        });
        //console.log(tmpobjlist);
        return tmpobjlist;
	}
}

function getparentobj(uuid,tlist){
	if (memt.has(uuid)){
		var tmpobj = clone({},memt.get(memt.getparent(uuid)));
		tmpobj.children=memt.getrawchildrenlist(uuid);
		if(!contains(tlist,tmpobj)){
			tlist.push(tmpobj);
		}
		// console.log('-----------------------')
		// console.log(contains(tlist,tmpobj))
		if(tmpobj.parent!==''&&!contains(tlist,tmpobj)){
			//console.log('-----------------------')
			//console.log(memt.getpath(tmpobj.uuid));
			getparentobj(tmpobj.parent,tlist);
		}
	}
	return tlist;
}

function fileformatedetail(uuid){
	if (memt.has(uuid)){
    	var tmpobj = clone({},memt.get(uuid));
    	tmpobj.children=memt.getrawchildrenlist(uuid);
        return tmpobj;
	}
}

function tattoo(f){
	var fstat=fs.statSync(f);
	//console.log(1)
	try{
		xattr.getSync(f,'user.uuid');
	}
	catch(e)
	{
		xattr.setSync(f,'user.uuid',uuid.v4());
	}
	try{
		xattr.getSync(f,'user.readlist');
	}
	catch(e)
	{
		xattr.setSync(f,'user.readlist','');
	}
	try{
    	xattr.getSync(f,'user.writelist');
    }
    catch(e)
    {
    	xattr.setSync(f,'user.writelist','');
    }
    try{
    	xattr.getSync(f,'user.owner');
    }
    catch(e){
    	xattr.setSync(f,'user.owner','');
    }
    //console.log(2)
    if (fstat&&fstat.isDirectory()){ 
      xattr.setSync(f,'user.type','folder');
    }
    else if(fstat&&!fstat.isDirectory()){
    	try{
    		var thash=xattr.getSync(f,'user.hash').toString('utf-8');
    		var cuuid=xattr.getSync(f,'user.uuid').toString('utf-8');
    		console.log(thash)
			if(memt.hashash(thash)){
		        var tmplist=memt.getbyhash(thash);
		        tmplist.push(cuuid);
		        memt.setbyhash(thash,tmplist);
		      }
		      else{
		        var tmplist = [];
		        tmplist.push(cuuid);
		        memt.setbyhash(thash,tmplist);
			}
    	}
    	catch(e)
    	{
	    	xattr.setSync(f,'user.type','file');
	    	console.log(3)
			var fd = fs.createReadStream(f);
		    var hash = crypto.createHash('sha256');
			fd.on('readable', () => {
				var data = fd.read();
				if (data)
					hash.update(data);
				else {
					//console.log(hash)
					console.log(f)
					var cuuid=xattr.getSync(f,'user.uuid').toString('utf-8');
					var tlist=hash.digest('hex');
					//return hash;
					xattr.setSync(f,'user.hash',tlist);
	   				memt.sethash(cuuid,tlist)
					if(memt.hashash(tlist)){
				        var tmplist=memt.getbyhash(tlist);
				        tmplist.push(cuuid);
				        memt.setbyhash(tlist,tmplist);
				      }
				      else{
				        var tmplist = [];
				        tmplist.push(cuuid);
				        memt.setbyhash(tlist,tmplist);
				     }
				}
			});
	   				
	   				//var cuuid=xattr.getSync(f,'user.uuid').toString('utf-8');
	   				//console.log("-----------")
	   				//console.log(r)
	   		
   		}
    }
    //console.log(6)
}

// var dopastedetail =function(path){
// 	return new Promise(function(resolve,reject){
// 		console.log("22222222")
// 		new ExifImage({image:path}, function (error, exifData) {
// 	        if (error){
// 	            var tmpobj={};
// 	            console.log("3333333333")
// 	            var tsize=spawnSync('gm',['identify','-format','%w,%h',path]).stdout.toString()
// 	            //var tsize=spawn('gm',['identify','-format','%w,%h',path])
// 	            console.log("4444444444")
// 	            var fsize=tsize.split(',')
// 	            tmpobj.height=fsize[1]
// 	            tmpobj.width=fsize[0]
// 	   //          gm(path)
// 				// .size(function (err, size) {
// 				//   if (!err){
// 				//   	tmpobj.height=size.height;
// 				//   	tmpobj.width=size.width;
// 				//   }
//     //         	});
// 	        }
// 	        else
// 	        {
// 	            var tmpobj=exifData;
// 	            if (tmpobj.exif.MakerNote!==undefined)tmpobj.exif.MakerNote="";
// 	            if (tmpobj.exif.UserComment!==undefined)tmpobj.exif.UserComment="";
// 	        }
// 	        memt.setdetail(uuid,tmpobj);

// 	    });
// 	})
// }

// var start=async function(path){
// 	console.log("1111111111")
// 	await dopastedetail(path)
// 	console.log("5555555555")
// }
function pastedetail(path,uuid){
	const buffer = readChunk.sync(path, 0, 262);
    var filetype = fileType(buffer);
    try{
		var ext = filetype.ext;
	}
	catch(e){
		var ext = 'unknown';
	}
	var tmpobj=''
	if (contains(IMAGE,ext)){
		try {
			//start(path)
		   //  new ExifImage({image:path}, function (error, exifData) {
		   //      if (error){
		   //          var tmpobj={};
		   //          console.log("************")
		   //          if(fs.existsSync(path)){
		   //          	console.log(11111)
		   //          }
		   //          else console.log(22222)
		   //          console.log(path)
		   //          console.log("************")
		   //          var tsize=spawnSync('gm',['identify','-format','%w,%h',path]).stdout.toString()
		   //          //var tsize=spawn('gm',['identify','-format','%w,%h',path])
		   //          console.log(tsize)
		   //          var fsize=tsize.split(',')
		   //          tmpobj.height=fsize[1]
		   //          tmpobj.width=fsize[0]
		   // //          gm(path)
					// // .size(function (err, size) {
					// //   if (!err){
					// //   	tmpobj.height=size.height;
					// //   	tmpobj.width=size.width;
					// //   }
	    // //         	});
		   //      }
		   //      else
		   //      {
		   //          var tmpobj=exifData;
		   //          if (tmpobj.exif.MakerNote!==undefined)tmpobj.exif.MakerNote="";
		   //          if (tmpobj.exif.UserComment!==undefined)tmpobj.exif.UserComment="";
		   //      }
		   //      memt.setdetail(uuid,tmpobj);
		   //  });
			var tmpobj={};
			var tsize=spawnSync('gm',['identify','-format','%w,%h',path]).stdout.toString()
			var fsize=tsize.split(',')
			var theight=fsize[1].split("\n")
		    tmpobj.height=theight[0]
		    tmpobj.width=fsize[0]
		    memt.setdetail(uuid,tmpobj);
		} catch (error) {
		    var tmpobj='';
		}
		// try {
		//   var image = gd.open(path)
		//   console.log("************")
		//   console.log(image)
		//   console.log("------------")
		// } catch (error) {
		  
		// }

	}
	else if(contains(MUSIC,ext)){
		id3.read(path, {
		  onSuccess: function(tag) {
		    var tmpobj=tag;
		    memt.setdetail(uuid,tmpobj);
		  },
		  onError: function(error) {
		    var tmpobj='';
		  }
		});
	}
	else if(contains(VIDEO,ext)){
		probe(path, function(err, probeData) {
		    var tmpobj=probeData;
		    memt.setdetail(uuid,tmpobj);
		});
	}
	else{
		var tmpobj='';
	}
	return tmpobj;
}

function pastethumbexif(uuid,path){
	var jpeg = fs.readFileSync(path);
	var data = jpeg.toString("binary");

	var zeroth = {};
	var exif = {};
	var gps = {};
	const buffer = readChunk.sync(memt.getpath(uuid), 0, 262);
    var filetype = fileType(buffer);
	var ext = filetype.ext;
	var tmpobj=''
	if (contains(IMAGE,ext)){
		try {
		    new ExifImage({image:memt.getpath(uuid)}, function (error, exifData) {
		    	if(exifData!==undefined){
			        zeroth[piexif.ImageIFD.Orientation] = exifData.image.Orientation;
					var exifObj = {"0th":zeroth, "Exif":exif, "GPS":gps};
					var exifbytes = piexif.dump(exifObj);
					var newData = piexif.insert(exifbytes, data);
					var newJpeg = new Buffer(newData, "binary");
					fs.writeFileSync(path, newJpeg);
				}
		    });
		} catch (error) {
		}
	}
}

async function getall2(docs){
  	var data=[];
	for (var i of docs){
		await Version.find({_id:i.latest[i.latest.length-1]}, '_id docversion creator maintainers viewers album sticky archived tags contents mtime', (err, doc) => {
			if(err)console.log(err);
			for (var p of doc[0].contents){
				var sv={};
				sv.uuid=i.uuid;
				sv.key = doc[0]._id;
				sv.creator = doc[0].creator
				var tlist=doc[0].maintainers
				if (!contains(tlist,doc[0].creator)){
					tlist.push(doc[0].creator)
				}
				for(var x of doc[0].viewers){
					if(!contains(tlist,x)){
						tlist.push(x)
					}
				}
				if(!contains(tlist,p.creator)){
					tlist.push(p.creator)
				}
				sv.viewers=tlist
				mshare.add(p.digest,sv);
			}
		})
	}
}

async function getall1(){
  	await Versionlink.find({},'uuid latest',(err,docs)=>{
		getall2(docs)
			.then(r => {
			})
			.catch(e => {
			})
	})
}

function buildmediamap(){
	getall1()
		.then(r => {
		})
		.catch(e => {
		})
}

function filetype(ext){
	if(contains(IMAGE,ext)){
		return 'image'
	}
	else if(contains(VIDEO,ext)){
		return 'video'
	}
	else if(contains(MUSIC,ext)){
		return 'music'
	}
	else{
		return 'unknown'
	}
}

exports.contains = contains

exports.removex = removex

exports.getfilelist = getfilehelper 

exports.getfilelistbyhash = getfilehelperbyhash

exports.tattoo = tattoo

exports.getfiledetail = fileformatedetail

exports.pastedetail = pastedetail

exports.pastethumbexif = pastethumbexif

exports.buildmediamap = buildmediamap

exports.filetype = filetype

exports.getparentobj = getparentobj