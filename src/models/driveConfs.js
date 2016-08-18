import Promise from 'bluebird'

import validator from 'validator'

/** 

Schema

{
  label: a string
  ownership: 'fixed', exactly one owner allowed, only visible to this owner,
             'variable', zero to many owner allowed, visible to all owners, as well as system administrator.

  fixedOwner: 

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

class DriveConfs {

  constructor(collection) {
    this.collection = collection
  }

  async create({ label, ownership, URI, uuid, writelist, readlist, indexing }) {
    let def = {label, ownership, URI, uuid, writelist, readlist, indexing}
    await this.collection.updateAsync(list, [...list, def])   
  }
}

const openDriveConfsAsync = async (filepath, tmpfolder) => {

  let collection = await openOrCreateCollectionAsync(filepath, tmpfolder)
  if (collection) return new DriveConfs(collection)
  return null
}

export { openDriveConfsAsync }

