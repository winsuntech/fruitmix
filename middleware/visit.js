function Visit(node,callback){  
    if (memt.has(node)){
    	var obj=memt.get(node);
        console.log(obj.getpath());
    	var tmpchildren=obj.getchildren();
		tmpchildren.forEach(function(f){
            Visit(f.getuuid(), callback);
        });
        callback(node);
	}
 }

module.exports = Visit;