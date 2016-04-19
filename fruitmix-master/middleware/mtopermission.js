'use strict';
module.exports = class MTOpermission{
    constructor(readlist,writelist,owner){
        this.readlist = readlist;
        this.writelist = writelist;
        this.owner = owner;
    }
}