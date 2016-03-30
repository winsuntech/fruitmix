function readcheck(uuid,user){
	var bln = true;
	if (uuid!==memt.getroot()){
		bln=memt.canread(uuid,user);
		bln=bln&readcheck(ment.getparent(uuid),user);
	}
	return bln
}

function writecheck(uuid,user){  
	var bln = true;
	if (uuid!==memt.getroot()){
		bln = memt.canwrite(uuid,user);
		bln=bln&writecheck(ment.getparent(uuid),user);
	}
	return bln
}

function ownercheck(uuid,user){  
	var bln = true;
	if (uuid!==memt.getroot()){
		bln = memt.isowner(uuid,user);
		bln=bln&ownercheck(ment.getparent(uuid),user);
	}
	return bln
}

exports.read= readcheck;

exports.write= writecheck;

exports.owner= ownercheck;