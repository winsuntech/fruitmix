function MTOpermission(){
    this.create = function(_readlist,_writelist,_owner){
        this.readlist = _readlist;
        this.writelist = _writelist;
        this.owner = _owner;
    }

    this.getreadlist=function() {
        return this.readlist;
    };

    this.getwritelist=function() {
        return this.writelist;
    };

    this.getowner=function() {
        return this.owner;
    };
}

module.exports = MTOpermission;