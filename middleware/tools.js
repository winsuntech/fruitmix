var fs = require('fs');
var xattr = require('fs-xattr');
const uuid = require('node-uuid');
var clone = require('util')._extend;
var sha256 = require('sha256');
var ExifImage = require('exif').ExifImage;
var id3 = require("jsmediatags");
var probe = require('node-ffprobe');
var gm = require('gm');
const IMAGE = ["bmp","pcx","tiff","gif","jpeg","jpg","tga","exif","fpx","svg","psd","cdr","pcd","dxf","ufo","eps","ai","png","hdri","raw"]
const MUSIC = ["mp3","wma","wav","mod","ra","cd","md","asf","aac","mp3pro","vqf","flac","ape","mid","vogg","m4a","aac","aiff","au","vqf"]
const VIDEO = ["avi","rmvb","rm","asf","divx","mpg","mpeg","mpe","wmv","mp4","mkv","vob"]
const readChunk = require('read-chunk');
const fileType = require('file-type');
var piexif = require("piexifjs");
var Version = require('mongoose').model('Version');
var Versionlink = require('mongoose').model('Versionlink');


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
}

function getfilehelperbyhash(user) {
	var tmpobjlist =[];
	memt.gethashmap().forEach((value, key) => {
		value.forEach(function(f){
			if(memt.checkreadpermission(f,user)===1||memt.checkownerpermission(f,user)===1){
				tmpobjlist.push(fileformatedetail(f));
			}
		});
	});
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
	if (memt.has(uuid)){
    	var tmpobj = clone({},memt.get(uuid));
    	tmpobj.children=memt.getrawchildrenlist(uuid);
    	tmpobjlist.push(tmpobj);
    	var tmpchildren=memt.getchildren(uuid);
		tmpchildren.forEach(function(f){
			// if (f.attribute.name==='444.jpg'){
			// console.log("----------");
			// console.log(f.attribute.name);
			//console.log(f.uuid);
			//console.log(memt.checkreadpermission(f.uuid,user));
			//console.log(memt.checkownerpermission(f.uuid,user));
			
			// }
			if(memt.checkreadpermission(f.uuid,user)===1||memt.checkownerpermission(f.uuid,user)===1){
				getfilehelper(f.uuid,user,tmpobjlist);
			}
			//console.log("------------------------------");
        });
        return tmpobjlist;
	}
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
    if (fstat&&fstat.isDirectory()){ 
      xattr.setSync(f,'user.type','folder');
    }
    else if(fstat&&!fstat.isDirectory()){
      xattr.setSync(f,'user.type','file');
      var tmpx =fs.readFileSync(f);
      xattr.setSync(f,'user.hash',sha256(tmpx));
    }
}

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
		    new ExifImage({image:path}, function (error, exifData) {
		        if (error){
		            var tmpobj={};
		            gm(path)
					.size(function (err, size) {
					  if (!err){
					  	tmpobj.height=size.height;
					  	tmpobj.width=size.width;
					  }
	            	});
		        }
		        else
		        {
		            var tmpobj=exifData;
		            if (tmpobj.exif.MakerNote!==undefined)tmpobj.exif.MakerNote="";
		            if (tmpobj.exif.UserComment!==undefined)tmpobj.exif.UserComment="";
		        }
		        memt.setdetail(uuid,tmpobj);
		    });
		} catch (error) {
		    var tmpobj='';
		}
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

exports.contains = contains

exports.removex = removex

exports.getfilelist = getfilehelper 

exports.getfilelistbyhash = getfilehelperbyhash

exports.tattoo = tattoo

exports.getfiledetail = fileformatedetail

exports.pastedetail = pastedetail

exports.pastethumbexif = pastethumbexif

exports.buildmediamap = buildmediamap