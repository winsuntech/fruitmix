var visitor = require('middleware/visitor');
var tools = require('middleware/tools');

function Memtree() {  
    this.root=''; 
    this.elements = new Map();  
   
    this.getroot = function(){
        return this.root;
    };

    this.setroot = function(value){
        this.root = value;
    };

    this.getuuid = function(key) {  
        return this.get(key).uuid;  
    };  

    this.gettype = function(key) { 
        return this.get(key).type;
    };
    // this.getdetail = function(uuid){
    //     return this.get(uuid).getdetail();
    // };

    // this.setdetail = function(uuid,value){
    //     return this.get(uuid).setdetail(value);
    // };

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

    this.getpathobj = function(key){
        return createpathobj(key,[]);
    };

    this.size = function(){
        return this.elements.size;
    };

    this.clear = function() {  
        this.elements.clear();  
    };  

    this.deletefilebyuuid=function(key){
        memt.remove(key);
    };

    this.add = function(key,obj) {
        this.elements.set( key, obj);
    };  
  
    this.remove = function(key) {  
        this.elements.delete(key);
    };  

    this.get = function(key) { 
        return this.elements.get(key);
    };  

    this.has = function(key) {  
        return this.elements.has(key);  
    };  

    this.mtobjs = function() {  
        return this.elements;  
    };  


    this.deletefile = function(uuid){
        this.parentremove(uuid);
        visitor(uuid,this.deletefilebyuuid);
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

//this.addchild=function(_value) {
//         //console.log(_value);
//         //console.log('------------------');
//         if(!this.ischild(_value)||this.children.length===0){
//             this.children.push(_value);
//         }
//     };

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
    return array
}

module.exports = Memtree;