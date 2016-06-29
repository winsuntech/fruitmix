var visitor = require('../middleware/visitor');
var tools = require('../middleware/tools');

var root = "";
var elements = new Map(); 
var hashmap = new Map();
var debug = false; 
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

    this.setwritelist = function(key,value){
        this.get(key).permission.writelist=value;
    };

    this.setreadlist = function(key,value){
        this.get(key).permission.readlist=value;
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
        elements.set(key,obj);
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

    this.setdetail= function(uuid,data){
        this.get(uuid).detail=data;
    }

    this.getdetail= function(uuid){
        return this.get(uuid).detail;
    }

    this.deletefile = function(uuid){
        debug && console.log(uuid);
        debug && console.log(11);
        this.parentremove(uuid);
        debug && console.log(22);
        visitor(uuid,this.removehashobj);
        debug && console.log(33);
        visitor(uuid,this.deletefilebyuuid);
        debug && console.log(44);
    };

    this.parentremove = function(key){

        var tmpparent=memt.get(key).parent;
        debug && console.log('----'+tmpparent);
        this.removechild(tmpparent,key);
    };

    this.getpath = function(key) {
        var realpath='';
        this.getpathobj(key).forEach(function(f){
            // console.log("---------")
            // console.log(f.uuid)
            // console.log(f.attribute.name)
            realpath='/'+f.attribute.name+realpath;
        });
        return '/data/fruitmix'+realpath;
    };

    this.addchild = function(target,value){
        if(!ischild(target,value)||this.get(target).children.length===0){
            this.get(target).children.push(value);
        }
    };

    this.removechild=function(uuid,key) {
        var bln = false;
        try {
            for (var i = 0; i < this.get(uuid).children.length; i++) {
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
        if(memt.hashash(memt.get(uuid).hash)){
            var tmplist=memt.getbyhash(memt.get(uuid).hash);
            for (var i = 0; i < tmplist.length; i++) {
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
        var re=0;
        // if(uuid==='a0207fb9-eeb3-41fe-82d4-aed75e05bb74'){
        //     console.log(tmplist[0]);
        // }
        if(tmplist[0]===''){
            // if(uuid==='a0207fb9-eeb3-41fe-82d4-aed75e05bb74'){
            // console.log(111111);
            // }
            re=2;
        }
        else{
            var result=tools.contains(tmplist,useruuid);
            if(result===true)re=1;
            else re=0;
        }
        return re;
    };

    this.canwrite = function(uuid,useruuid){
        var tmplist=this.get(uuid).permission.writelist;
        var re=0;
        if(tmplist[0]===''){
            re=2;
        }
        else{
            var result=tools.contains(tmplist,useruuid);
            if(result===true)re=1;
            else re=0;
        }
        return re;
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
        var re=0;
        if(tmplist[0]===''){
            re=2;
        }
        else{
            var result=tools.contains(tmplist,value);
            if(result===true)re=1;
            else re=0;
        }
        return re;
    }

    this.moveto = function(_key,target){
        this.parentremove(_key);
        this.addchild(target,this.get(_key));
        this.get(_key).parent=target;
    };

    this.checkreadpermission = function(uuid,user){
        // console.log(":::::::::::::::::");
        // console.log(readcheck(uuid,user));
        // console.log(":::::::::::::::::");
        return readcheck(uuid,user);
    };

    this.checkwritepermission = function(uuid,user){
        return writecheck(uuid,user);
    };

    this.checkownerpermission = function(uuid,user){
        return ownercheck(uuid,user);
    };

    this.islibrary = function(uuid){
        var result=false;
        var tpl=memt.getpath(uuid).split('/');
        if(tools.contains(tpl,'library')){
            result=true;
        }
        return result;
    }
}  

function readcheck(uuid,user){
    var bln = 2;
    if (uuid!==memt.getroot()){
        var c1=memt.canread(uuid,user);
        var c2=memt.isowner(uuid,user);
        if(c1===1&&c2===1){
            bln = 1;
        }
        else{
            bln = c1+c2;
        }
        var t=readcheck(memt.getparent(uuid),user);
        // if(uuid==='47d560c3-80d6-460f-81b1-7d446f63cfe1'){
        // console.log("++++++++++");
        // console.log(c1);
        // console.log(c2);
        // console.log(bln);
        // console.log(t);
        // console.log("++++++++++");
        // }
        if(bln<2&&t>1){
            t=1
        }
        else if(t<2&&bln>1){
            bln=1
        }
        bln=bln*t;
    }
    //console.log(bln);
    return bln
}

function writecheck(uuid,user){  
    var bln = 2;
    if (uuid!==memt.getroot()){
        var c1=memt.canwrite(uuid,user);
        var c2=memt.isowner(uuid,user);
        if(c1===1&&c2===1){
            bln = 1;
        }
        else{
            bln = c1+c2;
        }
        var t=writecheck(memt.getparent(uuid),user);
        if(bln<2&&t>1){
            t=1
        }
        else if(t<2&&bln>1){
            bln=1
        }
        bln=bln*t;
    }
    return bln
}

function ownercheck(uuid,user){
    var bln = 2;
    if (uuid!==memt.getroot()){
        bln = memt.isowner(uuid,user);
        var t=ownercheck(memt.getparent(uuid),user);
        if(bln<2&&t>1){
            t=1
        }
        else if(t<2&&bln>1){
            bln=1
        }
        bln=bln*t;
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