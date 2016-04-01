function Visitor(node,callback){  
    if (memt.has(node)){
    	var obj=memt.get(node);
    	var tmpchildren=obj.getchildren();
		tmpchildren.forEach(function(f){
            Visit(f.getuuid(), callback);
        });
        callback(node);
	}
 }

module.exports = Visitor;