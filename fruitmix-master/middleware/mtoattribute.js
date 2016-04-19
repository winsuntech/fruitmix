'use strict';

module.exports= class MTOattribute{
    constructor(createtime,changetime,modifytime,accesstime,size,name){
        this.changetime = changetime;
        this.modifytime = modifytime;
        this.accesstime = accesstime;
        this.createtime = createtime;
        this.size = size;
        this.name = name;
    }
}
