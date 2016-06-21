'use strict';
module.exports = class MediaObj{
    constructor(uuid,key,viewers,creator){
        this.uuid = uuid;
        this.key = key;
        this.viewers = viewers;
        this.creator = creator;
    }
}