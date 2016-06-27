let Exif = require('mongoose').model('Exif');
let ExifImage = require('exif').ExifImage;
const IMAGE = ["bmp","pcx","tiff","gif","jpeg","jpg","tga","exif","fpx","svg","psd","cdr","pcd","dxf","ufo","eps","ai","png","hdri","raw"]
const MUSIC = ["mp3","wma","wav","mod","ra","cd","md","asf","aac","mp3pro","vqf","flac","ape","mid","vogg","m4a","aac","aiff","au","vqf"]
const VIDEO = ["avi","rmvb","rm","asf","divx","mpg","mpeg","mpe","wmv","mp4","mkv","vob"]
const readChunk = require('read-chunk');
const fileType = require('file-type');
var helper = require('../middleware/tools');
var fhelp =memt;
function attach(node,exif){
	node.detail=exif
	return node	
}

// async function getexif(node){
	
// }

async function getimageexifA(path){
	return new Promise(resolve => {
		new ExifImage({image:path}, function (error, exifData) {
			if (error){
	            let tmpobj={};
	            let tsize=spawnSync('gm',['identify','-format','%w,%h',path]).stdout.toString()
				let fsize=tsize.split(',')
				let theight=fsize[1].split("\n")
			    tmpobj.height=theight[0]
			    tmpobj.width=fsize[0]
	        }
	        else
	        {
	            let tmpobj=exifData;
	            if (tmpobj.exif.MakerNote!==undefined)tmpobj.exif.MakerNote="";
	            if (tmpobj.exif.UserComment!==undefined)tmpobj.exif.UserComment="";
	        }
	        resolve(tmpobj)
		})
	})
}

async function getmusicexifA(path){
	return new Promise(resolve => {
		id3.read(path, {
		  onSuccess: function(tag) {
		    let tmpobj=tag;
		    resolve(tmpobj)
		  },
		  onError: function(error) {
		    resolve(tmpobj)
		  }
		});
	})
}

async function getvideoexifA(path){
	return new Promise(resolve => {
		probe(path, function(err, probeData) {
		    let tmpobj=probeData;
		    resolve(tmpobj)
		});
	})
}

async function getexif(node){
	await Exif.find({hash:node.hash},'exif', (err, doc) => {
		if(doc.length!==0){
			return doc[0].exif
		}
	})
	let path=fhelp.getpath(node.uuid)
	const buffer = readChunk.sync(path, 0, 262);
    let filetype = fileType(buffer);
    try{
		let ext = filetype.ext;
	}
	catch(e){
		let ext = 'unknown';
	}
	if (helper.contains(IMAGE,ext)){
		let tmpobj=await getimageexifA(path);
	}
	else if(helper.contains(MUSIC,ext)){
		let tmpobj=await getmusicexifA(path);
	}
	else if(helper.contains(VIDEO,ext)){
		let tmpobj=await getvideoexifA(path);
	}
	else{
		let tmpobj='';
	}
	return tmpobj;
}

async function save(node){
	let texif= await getexif(node);
	await Exif.find({hash:node.hash},'exif', (err, doc) => {
		if(doc.length===0){
			let newexif = new Exif({
				hash:node.hash,
				exif:texif
			})

			newexif.save();
		}
	})
}
export{
	attach,
	save,
	getexif
}