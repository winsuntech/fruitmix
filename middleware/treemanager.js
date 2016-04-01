var visitor = require('middleware/visit');
var tools = require('middleware/tools');

function Memtree() {  
    this.root=''; 
    this.elements = new Map();  

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

    this.deletefile = function(uuid){
        this.parentremove(uuid);
        visitor(uuid,this.deletefilebyuuid);
    };

    this.parentremove = function(_key){
        var tmpparent=this.get(_key).getparent();
        this.get(tmpparent).removechild(_key);
    };

    this.add = function(_key,_obj) {
        this.elements.set( _key, _obj);
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
        var realpath='';
        this.getpathobj(_key).forEach(function(f){
            realpath='/'+f.getname()+realpath;
        });
        return '/mnt'+realpath;
    };

    this.gettype = function(_key) { 
        return this.get(_key).gettype();
    };

    this.addchild = function(_target,_values){
        this.get(_target).addchild(_values);
    };

    this.getchildren = function(uuid){
        return this.get(uuid).getchildren();
    };

    this.getchildren = function(uuid,value){
        this.get(uuid).setchildren(value);
    };

    this.getrawchildrenlist = function(uuid){
        var tmplist=this.get(uuid).getchildren();
        var tmparray=[];
        tmplist.forEach(function(f){
            tmparray.push(f.getuuid());
        })
        return tmparray;
    };

    this.getparent = function(key){
        return this.get(key).getparent();
    };

    this.canread = function(uuid,useruuid){
        var tmplist=this.get(uuid).getreadlist();
        return tools.contains(tmplist,useruuid);
    };

    this.canwrite = function(uuid,useruuid){
        var tmplist=this.get(uuid).getwritelist();
        return tools.contains(tmplist,useruuid);
    };

    this.getowner = function(key){
        return this.get(key).getowner();
    };

    this.getname = function(_key) { 
        return this.get(_key).getname();
    };

    this.setname = function(_key,name) { 
        return this.get(_key).setname(name);
    };

    this.isfile = function(_key){
        if (this.gettype(_key) ==='file'){
            return true;
        }
        else{
            return false;
        }
    }

    this.isowner = function(key,value){
        var tmplist=this.getowner(key);
        return tools.contains(tmplist,value);
    }

    this.moveto = function(_key,target){
        this.parentremove(_key);
        this.addchild(target,this.get(_key));
        this.get(_key).setparent(target);
    };

    this.getpathobj = function(key){
        return createpathobj(key,[]);
    };
}  

function createpathobj(key,array){
    if(key!==memt.getroot()){
        array.push(memt.get(key));
        createpathobj(memt.getparent(key),array);
    }
    return array
}

module.exports = Memtree;