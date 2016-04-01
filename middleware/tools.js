var Checker = require('middleware/permissioncheck');

function contains(array, value) {
    var i = array.length;
    while (i--) {
       if (array[i] === value) {
           return true;
       }
    }
    return false;
}

function getfilehelper(uuid,tmpobjlist) {
	if (memt.has(node)){
    	var tmpobj = memt.get(uuid);
    	tmpobj.setchildren(memt.getrawchildrenlist(uuid));
    	tmpobjlist.push(tmpobj);
    	var tmpchildren=obj.getchildren();
		tmpchildren.forEach(function(f){
            getfilehelper(f.getuuid(), tmpobjlist);
        });
        getfilehelper(f.getuuid(), tmpobjlist);
        return tmpobjlist;
	}
}


exports.contains = contains

exports.getfilehelper = getfilehelper 