function readcheck(uuid,user){
	var bln = true;
	if (uuid!==memt.getroot()){
		var c1=memt.canread(uuid,user);
		var c2=memt.isowner(uuid,user);
		bln = c1||c2;
		var t=readcheck(memt.getparent(uuid),user);
		bln=bln&&t;
	}
	return bln
}

function writecheck(uuid,user){  
	var bln = true;
	if (uuid!==memt.getroot()){
		var c1=memt.canwrite(uuid,user);
		var c2=memt.isowner(uuid,user);
		bln = c1||c2;
		var t=writecheck(memt.getparent(uuid),user);
		bln=bln&&t;
	}
	return bln
}

function ownercheck(uuid,user){  
	var bln = true;
	if (uuid!==memt.getroot()){
		bln = memt.isowner(uuid,user);
		var t=ownercheck(memt.getparent(uuid),user);
		bln=bln&&t;
	}
	return bln
}

exports.read= readcheck;

exports.write= writecheck;

exports.owner= ownercheck;