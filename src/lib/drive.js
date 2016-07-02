class Drive {

  constructor() {
    this.rootpath = rootpath,
    this.proto = proto
    this.owner = owner
    this.writelist = writelist
    this.readlist = readlist
  }
}

function createDrive(rootpath, owner, writelist, readlist) {
  
  let driveProto = {
    type: 'drive',
    owner
  }
}
