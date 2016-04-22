var visitor = require('middleware/visitor');
var tools = require('middleware/tools');

var root = "";
var elements = new Map(); 
var hashmap = new Map();

function Memtree() { 
   
    this.getroot = function(){
        return root;
    };

    this.setroot = function(value){
        root = value;
    };

    this.gettype = function(key) { 
        return this.get(key).type;
    };

    this.getchildren = function(uuid){
        return this.get(uuid).children;
    };

    this.setchildren = function(uuid,value){
        this.get(uuid).children=value;
    };

    this.gethash = function(uuid){
        return this.get(uuid).hash;
    };

    this.sethash = function(uuid,value){
        this.get(uuid).hash=value;
    };

    this.getparent = function(key){
        return this.get(key).parent;
    };

    this.getowner = function(key){
        return this.get(key).permission.owner;
    };

    this.getname = function(key) { 
        return this.get(key).attribute.name;
    };

    this.setname = function(key,name) { 
        this.get(key).attribute.name=name;
    };

    this.hashash = function(hash){
        return hashmap.has(hash);
    }

    this.getbyhash = function(hash){
        return hashmap.get(hash);
    }

    this.setbyhash = function(hash,tmplist){
        hashmap.set(hash,tmplist);;
    }

    this.gethashmap = function(){
        return hashmap;
    }

    this.getpathobj = function(key){
        return createpathobj(key,[]);
    };

    this.size = function(){
        return elements.size;
    };

    this.clear = function() {  
        elements.clear();  
    };  

    this.deletefilebyuuid=function(key){
        memt.remove(key);
    };

    this.add = function(key,obj) {
        elements.set( key, obj);
    };  
  
    this.remove = function(key) {  
        elements.delete(key);
    };  

    this.get = function(key) { 
        return elements.get(key);
    };  

    this.has = function(key) {  
        return elements.has(key);  
    };  

    this.mtobjs = function() {  
        return elements;  
    };  

    this.deletefile = function(uuid){
        this.parentremove(uuid);
        visitor(uuid,this.deletefilebyuuid(uuid));
        visitor(uuid,this.removehashobj(uuid));
    };

    this.parentremove = function(key){
        var tmpparent=this.get(key).parent;
        this.removechild(tmpparent,key);
    };

    this.getpath = function(key) {
        var realpath='';
        this.getpathobj(key).forEach(function(f){
            realpath='/'+f.attribute.name+realpath;
        });
        return '/mnt'+realpath;
    };

    this.addchild = function(target,value){
        if(!ischild(target,value)||this.get(target).children.length===0){
            this.get(target).children.push(value);
        }
    };

    this.removechild=function(uuid,key) {
        var bln = false;
        try {
            for (i = 0; i < this.get(uuid).children.length; i++) {
                if (this.get(uuid).children[i].uuid === key) {
                    this.get(uuid).children.splice(i, 1);
                    return true;
                }
            }
        } catch (e) {
            bln = false;
        }
        return bln;
    }

    this.removehashobj =function(uuid){
        if(this.hashash(this.get(uuid).hash)){
            var tmplist=this.getbyhash(this.get(uuid).hash);
            for (i = 0; i < tmplist.length; i++) {
                if (tmplist[i] === uuid) {
                    tmplist.splice(i, 1);
                }
            }
        }
    }

    this.getrawchildrenlist = function(uuid){
        var tmplist=this.get(uuid).children;
        var tmparray=[];
        tmplist.forEach(function(f){
            tmparray.push(f.uuid);
        })
        return tmparray;
    };

    this.canread = function(uuid,useruuid){
        var tmplist=this.get(uuid).permission.readlist;
        return tools.contains(tmplist,useruuid);
    };

    this.canwrite = function(uuid,useruuid){
        var tmplist=this.get(uuid).permission.writelist;
        return tools.contains(tmplist,useruuid);
    };

    this.isfile = function(key){
        if (this.gettype(key) ==='file'){
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
        this.get(_key).parent=target;
    };

    this.checkreadpermission = function(uuid,user){
        return readcheck(uuid,user);
    };

    this.checkwritepermission = function(uuid,user){
        return writecheck(uuid,user);
    };

    this.checkownerpermission = function(uuid,user){
        return ownercheck(uuid,user);
    };
}  

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

function ischild(key,value){
    var ist = false;
    memt.get(key).children.forEach(function(f){
        if (f===value){
            ist=true;
        } 
    });
    return ist;
}

function createpathobj(key,array){
    if(key!==memt.getroot()){
        array.push(memt.get(key));
        createpathobj(memt.getparent(key),array);
    }
    return array;
}

module.exports = new Memtree();