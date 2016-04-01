var MTOpermission = require('middleware/mtopermission');
var MTOattribute = require('middleware/mtoattribute');

function MTObj(){

    this.create = function(_uuid,_type,_parent,_children,_path,_readlist,_writelist,_owner,_createtime,_changetime,_modifytime,_accesstime,_size){
        var mpobj = new MTOpermission();
        var maobj = new MTOattribute();

        mpobj.create(_readlist,_writelist,_owner);
        maobj.create(_createtime,_changetime,_modifytime,_accesstime,_size,_path.substr(_path.lastIndexOf('/')+1));

        this.uuid = _uuid;
        this.type = _type;
        this.parent = _parent;
        this.children = _children;
        this.permission = mpobj;
        this.attribute = maobj;
        this.path = _path;
    }

    this.getuuid=function() {
        return this.uuid;
    };

    this.ischild=function(_value){
        var ist = false;
        this.children.forEach(function(f){
            if (f===_value){
                ist=true;
            } 
        });
        return ist;
    }

    this.addchild=function(_value) {
        //console.log(_value);
        //console.log('------------------');
        if(!this.ischild(_value)||this.children.length===0){
            this.children.push(_value);
        }
    };

    this.removechild=function(_key) {
        var bln = false;
        try {
            for (i = 0; i < this.children.length; i++) {
                if (this.children[i].getuuid() === _key) {
                    this.children.splice(i, 1);
                    return true;
                }
            }
        } catch (e) {
            bln = false;
        }
        return bln;
    }

    this.getchildren=function() {
        return this.children;
    };

    this.setchildren=function(value) {
        this.children=value;
    };

    this.getparent=function() {
        return this.parent;
    };

    this.setparent=function(value) {
        this.parent=value;
    };

    this.getname=function() {
        return this.attribute.getname();
    };

    this.setname=function(value) {
        return this.attribute.setname(value);
    };

    this.getreadlist=function() {
        return this.permission.getreadlist();
    };

    this.getwritelist=function() {
        return this.permission.getwritelist();
    };

    this.getowner=function() {
        return this.permission.getowner();
    };
    
    this.gettype=function () {
        return this.type;
    };

    this.getpath=function () {
        return this.path;
    };

    this.getcreatetime=function() {
        return this.attribute.getcreatetime();
    };

    this.getmodifytime=function() {
        return this.attribute.getmodifytime();
    };

    this.getaccesstime=function() {
        return this.attribute.getaccesstime();
    };

    this.getsize=function() {
        return this.attribute.getsize();
    };
}

module.exports = MTObj;