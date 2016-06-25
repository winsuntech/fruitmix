var visitor = require('../middleware/visitor');
var tools = require('../middleware/tools');

var root = "";
var elements = new Map(); 
var hashmap = new Map();
var debug = false; 

class Memtree { 
   
    getroot() {
        return root;
    };

    setroot(value){
        console.log('setroot: ' + value)
        root = value;
    };

    gettype(key) { 
        return this.get(key).type;
    };

    getchildren(uuid){
        return this.get(uuid).children;
    };

    gethash(uuid) {
        return this.get(uuid).hash;
    };

    sethash(uuid,value){
        this.get(uuid).hash=value;
    };

    getparent(key){
        return this.get(key).parent;
    };

    getowner(key){
        return this.get(key).permission.owner;
    };

    setwritelist(key,value){
        this.get(key).permission.writelist=value;
    };

    setreadlist(key,value){
        this.get(key).permission.readlist=value;
    };

    getname(key) { 
        return this.get(key).attribute.name;
    };

    setname(key,name) { 
        this.get(key).attribute.name=name;
    };

    hashash(hash){
        return hashmap.has(hash);
    }

    getbyhash(hash){
        return hashmap.get(hash);
    }

    setbyhash(hash,tmplist){
        hashmap.set(hash,tmplist);;
    }

    gethashmap(){
        return hashmap;
    }

    getpathobj(key){
        return createpathobj(key,[]);
    };

    size(){
        return elements.size;
    };

    clear() {  
        elements.clear();  
    };  

    deletefilebyuuid(key){
        memt.remove(key);
    };

    add (key,obj) {
        elements.set(key,obj);
    };  
  
    remove (key) {  
        elements.delete(key);
    };  

    get (key) { 
        return elements.get(key);
    };  

    has (key) {  
        return elements.has(key);  
    };  

    mtobjs() {  
        return elements;  
    };  

    setdetail (uuid,data){
        this.get(uuid).detail=data;
    }

    getdetail (uuid){
        return this.get(uuid).detail;
    }

    deletefile (uuid){
        debug && console.log(uuid);
        debug && console.log(11);
        this.parentremove(uuid);
        debug && console.log(22);
        visitor(uuid,this.removehashobj);
        debug && console.log(33);
        visitor(uuid,this.deletefilebyuuid);
        debug && console.log(44);
    };

    parentremove(key){

        var tmpparent=memt.get(key).parent;
        debug && console.log('----'+tmpparent);
        this.removechild(tmpparent,key);
    };

    getpath(key) {
        var realpath='';
        this.getpathobj(key).forEach(function(f){
            realpath='/'+f.attribute.name+realpath;
        });
        return '/data/fruitmix'+realpath;
    };

    addchild(target,value){
        if(!ischild(target,value)||this.get(target).children.length===0){
            this.get(target).children.push(value);
        }
    };

    removechild(uuid,key) {
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

    removehashobj(uuid){
        if(memt.hashash(memt.get(uuid).hash)){
            var tmplist=memt.getbyhash(memt.get(uuid).hash);
            for (var i = 0; i < tmplist.length; i++) {
                if (tmplist[i] === uuid) {
                    tmplist.splice(i, 1);
                }
            }
        }
    }

    getrawchildrenlist(uuid){
        var tmplist=this.get(uuid).children;
        var tmparray=[];
        tmplist.forEach(function(f){
            tmparray.push(f.uuid);
        })
        return tmparray;
    };

    canread (uuid,useruuid){
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

    canwrite (uuid,useruuid){
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

    isfile (key){
        if (this.gettype(key) ==='file'){
            return true;
        }
        else{
            return false;
        }
    }

    isowner (key,value){
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

    moveto (_key,target){
        this.parentremove(_key);
        this.addchild(target,this.get(_key));
        this.get(_key).parent=target;
    };

    checkreadpermission (uuid,user){
        return readcheck(uuid,user);
    };

    checkwritepermission (uuid,user){
        return writecheck(uuid,user);
    };

    checkownerpermission (uuid,user){
        return ownercheck(uuid,user);
    };

    islibrary (uuid){
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
