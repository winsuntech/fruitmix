import crypto from 'crypto'

const canonicalize = (comments, author) => 
  comments.filter(cmt => cmt.author === author) 
    .sort((a, b) => a.time - b.time)
    .map(cmt => ({ text: cmt.text, time: cmt.time }))

const hashObject = (obj) => {
  let hash = crypto.createHash('SHA256')
  hash.update(JSON.stringify(obj))
  return hash.digest('hex')
}



const mediaTalkPrototype = {

  updateAuthorHash() {

    let this.authorHash = new Map()

    // create a new set
    let authorSet = new Set()
    // put all authors into set
    this.comments.forEach(cmt => authorSet.add(cmt.author))

    if (authorSet.size === 0) return

    // construct author array from set
    let authors = Array.from(authorSet).sort()
    // for each author, store author => hash in map
    authors.forEach(author => 
      authorHashMap.set(author, hashObject(canonicalize(this.comments, author))))
  }

  addComment(author, message) {
    this.comments.push({
      author: author,
      message: message,
      time: new Date().getTime()
    })

    this.updateAuthorHash()
  }

  removeComment(author, time) {
    let index = this.comments.find(c => c.author === author && c.time === time)
    if (index !== -1) {
      this.comments = this.comments.splice(index, 1)
      this.updateAuthorHash()
    }
  }

  authorsDigest(authors) {

    let filtered = authors.filter(author => this.authorHashMap.has(author)) 
    if (!filtered.length) return null

    let buffers = filtered.map(author => Buffer.from(this.authorHashMap.get(author), 'hex'))
    for (let i = 0; i < 32; i++) 
      for (let j = 1; j < buffers.length; j++) 
        buffers[0][i] ^= buffers[j][i]

    return buffers[0].toString('hex') 
  }

  authorsTalk(authors) {

    let filtered = authors.filter(author => this.authorHashMap.has(author))

    return {
      owner: this.owner,
      digest: this.digest,
      comments: this.comments.filter(cmt => filtered.find(cmt.author))
                  .sort((a, b) => a.time - b.time)
    }
  }
  
  getTalk() {

    return {
      owner: this.owner,
      digest: this.digest,
      comments: this.comments.sort((a, b) => a.time - b.time)
    }
  }
}

const createMediaTalk = (owner, digest) => 
  Object.create(mediaTalkPrototype, {
    owner, digest, comments: [], authorHash: new Map()
  })

const createMediaTalkFromObject = (obj) => 
  Object.create(mediaTalkPrototype, obj)
    .updateAuthorHash()

export { createMediaTalk, createMediaTalkFromObject } 
