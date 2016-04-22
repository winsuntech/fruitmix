'use strict';

module.exports= class MTOattribute{
    constructor(createtime,changetime,modifytime,size,name){
        this.changetime = changetime;
        this.modifytime = modifytime;
        this.createtime = createtime;
        this.size = size;
        this.name = name;
    }
}
