function treebuilderformat(uid,readlist,writelist,owner,type,createtime,changetime,modifytime,size,path,parent,hash,detail){
	var mtobj={}
	mtobj.uid=uid;
	mtobj.readlist=readlist;
	mtobj.writelist=writelist;
	mtobj.owner=owner;
	mtobj.type=type;
	mtobj.createtime=createtime;
	mtobj.changetime=changetime;
	mtobj.modifytime=modifytime;
	mtobj.size=size;
	mtobj.path=path;
	mtobj.parent=parent;
	mtobj.hash = hash;
	mtobj.detail=detail;

	return mtobj;
}

function mediaformat(obj,kind,type){
	var tmpobj = {};
	tmpobj.hash = obj.hash
	tmpobj.kind=kind;
	if(obj.detail.exif!==undefined){
		tmpobj.width=obj.detail.exif.ExifImageWidth;
		tmpobj.height=obj.detail.exif.ExifImageHeight;
	}
	else{
		tmpobj.width=obj.detail.width;
		tmpobj.height=obj.detail.height;
	}
	tmpobj.type=type;
	tmpobj.detail=obj.detail;
	return tmpobj;
}

exports.treebuilder= treebuilderformat

exports.formatformedia = mediaformat