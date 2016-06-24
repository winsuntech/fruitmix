function Visitor(node,callback){  
    if (memt.has(node)){
    	var obj=memt.get(node);
    	var tmpchildren=obj.children;
		tmpchildren.forEach(function(f){
			console.log(f);
            Visitor(f.uuid, callback);
        });
        callback(node);
	}
 }

module.exports = Visitor;