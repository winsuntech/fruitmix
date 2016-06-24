'use strict';
module.exports = class MTObj{
    constructor(uuid,type,parent,children,path,mtop,mtoa,hash,detail){
        this.hash = hash;
        this.uuid = uuid;
        this.type = type;
        this.parent = parent;
        this.children = children;
        this.permission = mtop;
        this.attribute = mtoa;
        this.path = path;
        this.detail =detail;
    }
}