var elements = new Map(); 
var debug = false; 

function Mediamap() { 
    this.size = function(){
        return elements.size;
    };

    this.has = function(key) {  
        return elements.has(key);
    }; 

    this.clear = function() {  
        elements.clear();
    };  

    this.add = function(key,obj) {
        if(!elements.has(key)){
            elements.set(key, obj);
        }
        else{
            var tmplist=mshare.get(key);
            tmplist.push(obj);
            elements.set(key,tmplist);
        }
    };  
  
    this.remove = function(key) {  
        elements.delete(key);
    };  

    this.get = function(key) { 
        return elements.get(key);
    };  


}

module.exports = new Mediamap();