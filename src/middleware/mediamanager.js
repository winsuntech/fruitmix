var helper = require('../middleware/tools');

var elements = new Map(); 
var debug = false; 

function Mediamap() { 
    this.size = function(){
        return elements.size;
    };

    this.has = function(key) {  
        return elements.has(key);
    }; 

    this.clear = function() {  
        elements.clear();
    };  

    this.add = function(key,obj) {
        var tmplist=[]
        if(elements.has(key)){
            var tmplist=mshare.get(key);
        }
        tmplist.push(obj)
        elements.set(key, tmplist);
    };  
  
    this.remove = function(key) {  
        elements.delete(key);
    };  

    this.get = function(key) { 
        return elements.get(key);
    };  

    this.mshares=function(){
        return elements;
    }    

    this.getallshare=function(uuid){
        var tlist=[]
        elements.forEach((value, key) => {
            for(var x of value){
                if(helper.contains(x.viewers,uuid)&&!helper.contains(tlist,key)){
                    tlist.push(key)
                }
            }
        });
        return tlist; 
    }

    this.checkreadpermission=function(hash,uuid){
        var pcheck=0
        if(elements.has(hash)){
            elements.get(hash).forEach((value) => {
                // console.log("-----------");
                console.log(value);
                if (helper.contains(value.viewers,uuid))pcheck=1
            });
        }
        return pcheck;
    }

    this.checkwritepermission=function(hash,uuid){
        var pcheck=0
        if(elements.has(hash)){
            elements.get(hash).forEach((value) => {
                // console.log("-----------");
                console.log(value);
                if (helper.contains(value.viewers,uuid))pcheck=1
            });
        }
        return pcheck;
    }

    this.getallcomments=function(hash,objs,uuid){
        var tlist=[]
        if(elements.get(hash)!==undefined){
            elements.get(hash).forEach((value) => {
                debug && console.log("--------------------------")
                debug && console.log(value);
                for (var y of objs){
                    debug && console.log("-------------------")
                    debug && console.log(y)
                    debug && console.log(uuid)
                    debug && console.log(value)
                    debug && console.log("--------")
                    debug && console.log(helper.contains(value.viewers,y.creator))
                    debug && console.log(helper.contains(value.viewers,uuid))
                    debug && console.log(y.shareid===value.uuid)
                    if (helper.contains(value.viewers,y.creator)&&helper.contains(value.viewers,uuid)&&y.shareid===value.uuid){
                        tlist.push(y)
                    }
                }
            })
        }
        return tlist;
    }

    // this.doadd=function(hash,objs,uuid){

    // }

    this.deleteone=function(hash,uuid){
        if(elements.get(hash)!==undefined){
            var tlist=elements.get(hash)
            for (var i = 0; i < tlist.length; i++) {
                if (tlist[i].uuid === uuid) {
                  tlist.splice(i, 1);
                }
            }
            elements.set(hash,tlist)
        }
    }

    // this.doreplace=function(hash,objs,uuid){

    // }

    this.updatekey=function(hash,uuid,versionid){
        if(elements.get(hash)!==undefined){
            elements.get(hash).forEach((value) => {
                if(value.uuid===uuid){
                    value.key=versionid
                }
            })
        }
    }

    this.updateviewers=function(hash,uuid,versionid,viewers){
        if(elements.get(hash)!==undefined){
            elements.get(hash).forEach((value) => {
                if(value.uuid===uuid){
                    value.viewers=viewers
                    value.key=versionid
                }
            })
        }
    }
}

module.exports = new Mediamap();