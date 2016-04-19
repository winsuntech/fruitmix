var Checker = require('middleware/permissioncheck');
var fs = require('fs');
var xattr = require('fs-xattr');
const uuid = require('node-uuid');
var clone = require('util')._extend;
var sha256 = require('sha256');
var ExifImage = require('exif').ExifImage;
var id3 = require("jsmediatags");
var probe = require('node-ffprobe');
const IMAGE = [".BMP",".PCX",".TIFF",".GIF",".JPEG",".JPG",".TGA",".EXIF",".FPX",".SVG",".PSD",".CDR",".PCD",".DXF",".UFO",".EPS",".AI",".PNG",".HDRI",".RAW"]
const MUSIC = [".MP3",".WMA",".WAV",".MOD",".RA",".CD",".MD",".ASF",".AAC",".Mp3Pro",".VQF",".FLAC",".APE",".MID",".vOGG",".M4A",".AAC+",".AIFF",".AU",".VQF"]
const VIDEO = [".AVI",".RMVB",".RM",".ASF",".DIVX",".MPG",".MPEG",".MPE",".WMV",".MP4",".MKV",".VOB"]

function contains(array, value) {
    var i = array.length;
    while (i--) {
       if (array[i] === value) {
           return true;
       }
    }
    return false;
}

function getfilehelperbyhash(user) {
	var tmpobjlist =[];
	hashmap.forEach((value, key) => {
		value.forEach(function(f){
			if(Checker.read(f,user)||Checker.owner(f,user)){
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
			if(Checker.read(f.uuid,user)||Checker.owner(f.uuid,user)){
				getfilehelper(f.uuid,user,tmpobjlist);
			}
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
  fstat=fs.statSync(f);
  try{
    xattr.getSync(f,'user.uuid');
  }
  catch(e)
  {
    xattr.setSync(f,'user.uuid',uuid.v4());
    xattr.setSync(f,'user.readlist','');
    xattr.setSync(f,'user.writelist','');
    xattr.setSync(f,'user.owner','');
    if (fstat&&fstat.isDirectory()){ 
      xattr.setSync(f,'user.type','folder');
    }
    else if(fstat&&!fstat.isDirectory()){
      xattr.setSync(f,'user.type','file');
      xattr.setSync(f,'user.hash',sha256(f));
    }
  }
}

function pastedetail(path,uuid){
	var ext = path.substr(path.lastIndexOf('.')).toUpperCase();
	var tmpobj=''
	if (contains(IMAGE,ext)){
		try {
		    new ExifImage({image:path}, function (error, exifData) {
		        if (error)
		            var tmpobj='';
		        else
		        {
		            var tmpobj=exifData;
		            memt.setdetail(uuid,exifData);
		        }
		    });
		} catch (error) {
		    var tmpobj='';
		}
	}
	else if(contains(MUSIC,ext)){
		id3.read(path, {
		  onSuccess: function(tag) {
		    var tmpobj=tag;
		    memt.setdetail(uuid,tag);
		  },
		  onError: function(error) {
		    var tmpobj='';
		  }
		});
	}
	else if(contains(VIDEO,ext)){
		probe(path, function(err, probeData) {
		    var tmpobj=probeData;
		    memt.setdetail(uuid,probeData);
		});
	}
	else{
		var tmpobj='';
	}
	return tmpobj;
}

function formatformedia(obj){
	function mediajson(){
		this.createtime='';
		this.changetime='';
		this.modifytime='';
		this.accesstime='';
		this.size='';
		this.hash = '';
		this.detail='';
	}

	var tmpobj = new mediajson();
	tmpobj.createtime=obj.getcreatetime();
	tmpobj.changetime=obj.getchangetime();
	tmpobj.modifytime=obj.getmodifytime();
	tmpobj.accesstime=obj.getaccesstime();
	tmpobj.size=obj.getsize();
	tmpobj.hash = obj.gethash();
	tmpobj.detail=obj.getdetail();

	return tmpobj;
}

exports.contains = contains

exports.getfilelist = getfilehelper 

exports.getfilelistbyhash = getfilehelperbyhash

exports.tattoo = tattoo

exports.getfiledetail = fileformatedetail

exports.pastedetail = pastedetail

exports.formatformedia = formatformedia