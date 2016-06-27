import { expect } from 'chai'

import { 
  mapXstatToObject 
} from '../../src/lib/tools'

describe('mapXstatToObject', function() {  

  let xstat = { 
    dev: 2049,
    mode: 16893,
    nlink: 2,
    uid: 1000,
    gid: 1000,
    rdev: 0,
    blksize: 4096,
    ino: 135577,
    size: 4096,
    blocks: 16,
    atime: 2016-06-27T06:36:58.382Z,
    mtime: 2016-06-27T06:36:58.382Z,
    ctime: 2016-06-27T06:36:58.382Z,
    birthtime: 2016-06-27T06:36:58.382Z,
    uuid: '0924c387-f1c6-4a35-a5db-ae4b7568d5de',
    owner: [ '061a954c-c52a-4aa2-8702-7bc84c72ec84' ],
    writelist: [ '9e7b40bf-f931-4292-8870-9e62b9d5a12c' ],
    readlist: [ 'b7ed9abc-01d3-41f0-80eb-361498025e56' ],
    hash: null,
    abspath: '/home/xenial/Projects/fruitmix/tmptest' 
  }

  it('should return Object', function(done) { 

    let result = mapXstatToObject(xstat)
    expect(result.name).to.equal('tmptest')
    
  });

});




