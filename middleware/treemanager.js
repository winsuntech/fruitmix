var visit = require('middleware/visit');

function Memtree() {  
    this.root=''; 
    this.pathmap = new Map();
    this.elements = new Map();  
    this.all = [];

    this.size = function(){
        return this.elements.size;
    };

    this.clear = function() {  
        this.elements.clear();  
    };  
   
    this.getroot = function(){
        return this.root;
    };

    this.setroot = function(_value){
        this.root = _value;
    };

    this.deletefilebyuuid=function(_key){
        memt.remove(_key);
    };

    this.deletefilebypath = function(_key){
        this.parentremove(this.pathmap.get(_key));
        visit(this.pathmap.get(_key),this.deletefilebyuuid);
    };

    this.parentremove = function(_key){
        var tmpparent=this.get(_key).getparent();
        this.get(tmpparent).removechild(_key);
    }

    this.add = function(_key,_obj) {
        this.elements.set( _key, _obj);
        this.all.push(_obj);
        this.pathmap.set(_obj.getpath(),_key);
    };  
  
    this.remove = function(_key) {  
        this.elements.delete(_key);
    };  

    this.get = function(_key) { 
        return this.elements.get(_key);
    };  

    this.has = function(_key) {  
        return this.elements.has(_key);  
    };  

    this.mtobjs = function() {  
        return this.elements;  
    };  

    this.getuuid = function(_key) {  
        return this.get(_key).getuuid();  
    };  

    this.getpath = function(_key) {
        return this.get(_key).getpath(); 
    };

    this.gettype = function(_key) { 
        return this.get(_key).gettype();
    };

    this.addchild = function(_target,_values){
        this.get(_target).addchild(_values);
    };

    this.getall = function(){
        return this.all;
    }

    this.getname = function(_key) { 
        return this.get(_key).getname();
    };

    this.isfile = function(_key){
        if (this.gettype(_key)==='file'){
            return true;
        }
        else{
            return false;
        }
    }
}  

module.exports = Memtree;