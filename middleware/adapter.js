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

function mediaformat(obj){
	var tmpobj = {};
	tmpobj.createtime=obj.attribute.createtime;
	tmpobj.changetime=obj.attribute.changetime;
	tmpobj.modifytime=obj.attribute.modifytime;
	tmpobj.size=obj.attribute.size;
	tmpobj.name = obj.attribute.name;
	tmpobj.hash = obj.hash;
	tmpobj.detail=obj.detail;

	return tmpobj;
}

exports.treebuilder= treebuilderformat

exports.formatformedia = mediaformat