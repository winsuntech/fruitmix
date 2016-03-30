function MTOattribute(){
    this.create = function(_createtime,_changetime,_modifytime,_accesstime,_size,_name){
        this.changetime = _changetime;
        this.modifytime = _modifytime;
        this.accesstime = _accesstime;
        this.createtime = _createtime;
        this.size = _size;
        this.name = _name;
    }

    this.getcreatetime=function() {
        return this.createtime;
    };

    this.getmodifytime=function() {
        return this.modifytime;
    };

    this.getaccesstime=function() {
        return this.accesstime;
    };

    this.getchangetime=function() {
        return this.changetime;
    };

    this.getsize=function() {
        return this.size;
    };

    this.getname=function() {
        return this.name;
    };

    this.setname=function(_value) {
        this.name=_value;
    };
}

module.exports = MTOattribute;