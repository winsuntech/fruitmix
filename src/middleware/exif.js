var Exif = require('mongoose').model('Exif');
var ExifImage = require('exif').ExifImage;
const IMAGE = ["bmp","pcx","tiff","gif","jpeg","jpg","tga","exif","fpx","svg","psd","cdr","pcd","dxf","ufo","eps","ai","png","hdri","raw"]
const MUSIC = ["mp3","wma","wav","mod","ra","cd","md","asf","aac","mp3pro","vqf","flac","ape","mid","vogg","m4a","aac","aiff","au","vqf"]
const VIDEO = ["avi","rmvb","rm","asf","divx","mpg","mpeg","mpe","wmv","mp4","mkv","vob"]
const readChunk = require('read-chunk');
const fileType = require('file-type');
var helper = require('../middleware/tools');
var spawnSync = require('child_process').spawnSync;
//var fhelp =memt;
function attachexif(node,exif){
	node.detail=exif
	return node
}

function attachsize(node,size){
	node.height=size.height
	node.width =size.width
	return node
}

function attachdetail(node,exif,size){
	node=attachsize(node,size)
	node = attachexif(node,exif)
	return node
}
//

function attachall(nodes,cb){
  //console.log(nodes);
	let newnodes=nodes.map(node =>{
	return exifp(node)})
	//console.log(newnodes)
	Promise.all(newnodes)
	.then(r=>{
	  //console.log('>>> promise all')
	  //console.log('<<< promise all')
	  cb(r)
	})
	.catch(e => console.log(e))
}


function exifp(node){
	//console.log("!!!!!!"+node.hash)
	return new Promise(resolve => {
		Exif.find({hash:node.hash},'hash exif', (err, doc) => {
			if (err) resolve(err)
			if(doc.length!==0){
				//console.log('>>>')
				//console.log(doc)
				//console.log('<<<')
				let size={width:200,height:200}
				try{
				var size={width:doc[0].exif.exif.ExifImageWidth,height:doc[0].exif.exif.ExifImageHeight}
				}
				catch(e){
				}
				resolve(attachdetail(node,doc[0].exif,size))
			}
			else {
				console.log(node.hash)
				resolve(attachdetail(node,{},{width:200,height:200}))
			}
		})
	})
}

// async function getexif(node){
	
// }

function getimageexifA(path){
	return new Promise(resolve => {
		new ExifImage({image:path}, function (error, exifData) {
			let tmpobj={};
			if (error){
	            let tsize=spawnSync('gm',['identify','-format','%w,%h',path]).stdout.toString()
				let fsize=tsize.split(',')
				let theight=fsize[1].split("\n")
				tmpobj.exif={};
			    tmpobj.exif.ExifImageWidth=theight[0]
			    tmpobj.exif.ExifImageHeight=fsize[0]
	        }
	        else
	        {
	            tmpobj=exifData;
	            if (tmpobj.exif.MakerNote!==undefined)tmpobj.exif.MakerNote="";
	            if (tmpobj.exif.UserComment!==undefined)tmpobj.exif.UserComment="";
	        }
	        resolve(tmpobj)
		})
	})
}

function getmusicexifA(path){
	return new Promise(resolve => {
		id3.read(path, {
		  onSuccess: function(tag) {
		    let tmpobj=tag;
		    resolve(tmpobj)
		  },
		  onError: function(error) {
		  	let tmpobj="";
		    resolve(tmpobj)
		  }
		});
	})
}

function getvideoexifA(path){
	return new Promise(resolve => {
		probe(path, function(err, probeData) {
		    let tmpobj=probeData;
		    resolve(tmpobj)
		});
	})
}

// function getexiffromdb(node){
// 	return new Promise(resolve => {
// 		Exif.find({hash:node.hash},'exif', (err, doc) => {
// 			if(doc.length!==0){
// 				resolve(doc[0].exif)
// 			}
// 		})
// 	})
// }

async function getexifA(node){
	//console.log('1')
	//console.log('3')
	let path=memt.getpath(node.uuid)
	console.log(">>>>>>>>>>>>>>>")
	console.log(path)
	console.log(node.hash)
	console.log("<<<<<<<<<<<<<<<")
	const buffer = readChunk.sync(path, 0, 262);
    let filetype = fileType(buffer);
    let ext = 'unknown';
    try{
		ext = filetype.ext;
	}
	catch(e){
	}
	//console.log('4')
	//console.log(IMAGE)
	//console.log(ext)
	let tmpobj='';
	if (helper.contains(IMAGE,ext)){
		//console.log('5')
		//console.log(path)
		tmpobj=await getimageexifA(path);

	}
	else if(helper.contains(MUSIC,ext)){
		//console.log('6')
		tmpobj=await getmusicexifA(path);
	}
	else if(helper.contains(VIDEO,ext)){
		//console.log('7')
		tmpobj=await getvideoexifA(path);
	}
	//console.log(tmpobj)
	return tmpobj;
}

async function save(node){
	//console.log("11")
	let texif= await getexifA(node);
	//console.log(                   22")
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

// function getexif(node){
// 	//console.log(1)
// 	getexifA(node)
// 	// console.log(2)
// 	// console.log(tp)
// 	// console.log(3)
// }

export{
	attachall,
	save
}