'use strict';

// function MTObj(){

//     this.create = function(_uuid,_type,_parent,_children,_path,_readlist,_writelist,_owner,_createtime,_changetime,_modifytime,_accesstime,_size,_hash){
//         var mpobj = new MTOpermission(_readlist,_writelist,_owner);
//         var maobj = new MTOattribute(_createtime,_changetime,_modifytime,_accesstime,_size,_);

//         this.hash = _hash;
//         this.uuid = _uuid;
//         this.type = _type;
//         this.parent = _parent;
//         this.children = _children;
//         this.permission = mpobj;
//         this.attribute = maobj;
//         this.path = _path;
//         this.detail = '';
//     }

//     this.getuuid=function() {
//         return this.uuid;
//     };

//     this.gethash=function() {
//         return this.hash;
//     };

//     this.getdetail=function() {
//         return this.detail;
//     };

//     this.setdetail=function(value) {
//         this.detail=value;
//     };

//     this.sethash=function(value) {
//         this.hash=value;
//     };

//     this.ischild=function(_value){
//         var ist = false;
//         this.children.forEach(function(f){
//             if (f===_value){
//                 ist=true;
//             } 
//         });
//         return ist;
//     }

//     this.addchild=function(_value) {
//         //console.log(_value);
//         //console.log('------------------');
//         if(!this.ischild(_value)||this.children.length===0){
//             this.children.push(_value);
//         }
//     };

//     this.removechild=function(_key) {
//         var bln = false;
//         try {
//             for (i = 0; i < this.children.length; i++) {
//                 if (this.children[i].getuuid() === _key) {
//                     this.children.splice(i, 1);
//                     return true;
//                 }
//             }
//         } catch (e) {
//             bln = false;
//         }
//         return bln;
//     }

//     this.getchildren=function() {
//         return this.children;
//     };

//     this.setchildren=function(value) {
//         this.children=value;
//     };

//     this.getparent=function() {
//         return this.parent;
//     };

//     this.setparent=function(value) {
//         this.parent=value;
//     };

//     this.getreadlist=function() {
//         return this.permission.getreadlist();
//     };

//     this.getwritelist=function() {
//         return this.permission.getwritelist();
//     };

//     this.getowner=function() {
//         return this.permission.getowner();
//     };
    
//     this.gettype=function () {
//         return this.type;
//     };

//     this.getpath=function () {
//         return this.path;
//     };

//     this.getcreatetime=function() {
//         return this.attribute.getcreatetime();
//     };

//     this.getchangetime=function() {
//         return this.attribute.getchangetime();
//     };

//     this.getmodifytime=function() {
//         return this.attribute.getmodifytime();
//     };

//     this.getaccesstime=function() {
//         return this.attribute.getaccesstime();
//     };

//     this.getsize=function() {
//         return this.attribute.getsize();
//     };
// }

module.exports = class MTObj{
    constructor(uuid,type,parent,children,path,mtop,mtoa,hash){
        this.hash = hash;
        this.uuid = uuid;
        this.type = type;
        this.parent = parent;
        this.children = children;
        this.permission = mtop;
        this.attribute = mtoa;
        this.path = path;
    }
}