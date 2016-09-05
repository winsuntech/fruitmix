import UUID from 'node-uuid'

class MediaTalk {

  constructor(owner, digest) {
    this.owner = owner
    this.digest = digest
    // each comment has three fields: commenter (uuid), message, and time
    this.comments = []
  }

  addComment(author, message) {
    this.comments.push({
      author: author,
      message: message,
      time: new Date().getTime()
    })
  }

  removeComment(author, time) {
    let index = this.comments.find(c => c.author === author && c.time === time)
    if (index !== -1) this.comments = this.comments.splice(index, 1)
  }
}

/**

  a share

  {
    uuid: [share uuid],
    creator: uuid,
    maintainers: [],
    viewers: [],
    isAlbum: true or false,
    isSticky: true or false,
    media: [
      digest: xxxx
    ]
    mtime: time
  }

**/

class Media {

  // shareMap stores uuid (key) => share (value)
  // mediaMap stores media/content digest (key) => (containing) share Set (value), each containing share Set contains share
  constructor() {
    // using an map instead of an array
    this.shareMap = new Map()
    // using an map instead of an array
    this.mediaMap = new Map()
    // each (local) talk has its creator and media digest, as its unique identifier
    this.talks = []
    // each remote talk has its viewer (a local user), creator, and media digest, as its unique identifier
    this.remoteMap = new Map()      // user -> user's remote talks
                                    // each talsk has creator and media digest as its unique identifier
  }

  createShare(shareObj) {

    let uuid = UUID.v4()
    let timestamp = new Date().getTime()

    shareObj.uuid = uuid
    shareObj.ctime = timestamp
    shareObj.mtime = timestamp

    this.shareMap.set(uuid, shareObj)    

    shareObj.media.forEach(digest => {
      let shareSet  = this.mediaMap.get(digest)
      if (shareSet) {
        shareSet.add(shareObj)
      }
      else {
        shareSet = new Set()
        shareSet.add(shareObj)
        this.mediaMap.set(digest, shareSet)
      }
    })

    return shareObj
  }

  updateShare(uuid, props) {
    let shareObj = this.shareMap.get(uuid)
    if (!shareObj) return null
    Objet.assign(shareObj, props)
    return shareObj
  }

  deleteShare(uuid) {

    let share = this.shareMap.get(uuid)
    
    share.contents.forEach(cont => {
      let shareSet = this.mediaMap.get(cont.digest)
      if (!shareSet) throw new Error('structural error')
      shareSet.delete(share)
      if (shareSet.size === 0) { // the last entries for this media's shareSet has been removed
        this.mediaMap.delete(cont.digest)
      }
    })

    this.shareMap.delete(uuid) 
  }

  createComment(targetUserUUID, targetDigest, userUUID, comment) {
    // check permission first   
  }

  // my share is the one I myself is the creator
  // locally shared to me is the one that I am the viewer but not creator, the creator is a local user
  // remotely shared to me is the one that I am the viewer but not creator, the creator is a remote user
  getUserShares(userUUID) {

    let shares = []
    this.shareMap.forEach((value, key, map) => {
      let share = value
      if (share.creator === userUUID || 
          share.maintainer.find(u => u === userUUID) || 
          share.viewer.find(u => u === userUUID)) 
        shares.push(share) 
    })
    return shares
  }

  
  // retrieves all media talks I can view
  getMediaTalks(userUUID) {

    let localTalks = []
    this.mediaMap.forEach((value, key, map) => {
      let shareSet = value
      // first, the user must be either creator or viewer
      // second, if he is creator, get the whole mediatalk
      // if he is not the creator, get only the part he can view
      // push to queue
    })
    return localTalks + remoteTalks
  }
}

export default () => new Media()
