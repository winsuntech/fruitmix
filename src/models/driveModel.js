import Promise from 'bluebird'

import validator from 'validator'

/** 

Schema

{
  label: a string

  fixedOwner: true: only one owner, cannot be changed; false: shared drive

  URI: 'fruitmix', 'appifi', 'peripheral:uuid=', 'peripheral:label=', 
      noticing that the uuid or label are file system uuid or label, not partition uuid or label, 
      the former are stored inside file system, if you reformat the file system, they are changed.
      the latter are GUID partition table uuid, they persists after reformatting the partition. 
      they are only changed when the partition table updated.

  uuid: drive uuid
  owner: []
  writelist: []
  readlist: []

  memCache: true or false
}

**/

class DriveModel {

  constructor(collection) {
    this.collection = collection
  }

  async createDrive({ label, fixedOwner, URI, uuid, writelist, readlist, memCache }) {
    // TODO
    let def = {label, ownership, URI, uuid, writelist, readlist, memCache}
    await this.collection.updateAsync(list, [...list, def])   
    return uuid
  }
}

const openDriveModelAsync = async (filepath, tmpfolder) => {

  let collection = await openOrCreateCollectionAsync(filepath, tmpfolder)
  if (collection) 
    return new DriveConfs(collection)
  return null
}

export { createDriveModelAsync }

