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

    // this.getdetail = function(uuid){
    //     return this.get(uuid).getdetail();
    // };

    // this.setdetail = function(uuid,value){
    //     return this.get(uuid).setdetail(value);
    // };

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

//     this.removechild=function(_key) {
//         var bln = false;
//         try {
//             for (i = 0; i < this.children.length; i++) {
//                 if (this.children[i].getuuid() === _key) {
//                     this.children.splice(i, 1);
//                     return true;
//                 }
//             }
//         } catch (e) {
//             bln = false;
//         }
//         return bln;
//     }
    this.getchildren = function(uuid){
        return this.get(uuid).children;
    };

    this.setchildren = function(uuid,value){
        this.get(uuid).children=value;
    };

    this.gethash = function(uuid){
        return this.get(uuid).gethash();
    };

    this.sethash = function(uuid,value){
        return this.get(uuid).sethash(value);
    };

    this.getrawchildrenlist = function(uuid){
        var tmplist=this.get(uuid).children;
        var tmparray=[];
        tmplist.forEach(function(f){
            tmparray.push(f.uuid);
        })
        return tmparray;
    };

    this.getparent = function(key){
        return this.get(key).parent;
    };

    this.canread = function(uuid,useruuid){
        var tmplist=this.get(uuid).permission.readlist;
        console.log("1111111");
        console.log(tmplist);
        return tools.contains(tmplist,useruuid);
    };

    this.canwrite = function(uuid,useruuid){
        var tmplist=this.get(uuid).permission.writelist;
        console.log("22222222");
        console.log(tmplist);
        return tools.contains(tmplist,useruuid);
    };

    this.getowner = function(key){
        return this.get(key).permission.owner;
    };

    this.getname = function(_key) { 
        return this.get(_key).name;
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
        console.log("3333333");
        console.log(tmplist);
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