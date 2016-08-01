import fs from 'fs'

const openOrCreateList = (filepath, tmpfolder, callback) => { 

  fs.readFile(filepath, (err, data) => {
    if (err && err.code === 'ENOENT')  // not exist
      fs.writeFile(filepath, '[]', err => err ? callback(err) : 
        callback(null, { filepath, tmpfolder, elements: [], lock: false }))
    else if (err)  // err
      callback(err)
    else { // exist
      try {
        let elements = JSON.parse(data.toString()) // parse JSON
        if (!Array.isArray(list)) return callback(new Error('not an array')) // if not array
        callback(null, { filepath, tmpfolder, elements, lock: false }) // return list objects
      }
      catch (e) {
        callback(e)
      }
    }
  }) 
}

const saveList = (list, newElements, callback) => {
  
  if (list.lock) 
    return setTimeout(() => {
      let err = new Error('list busy')
      err.code = 'EBUSY'
      callback(err) 
    }, 0) 

  list.lock = true
  let tmpfolder, tmpfile
  
  Promise.promisify(fs.mkdtemp)(list.tmpfolder)
    .then(folder => {
      tmpfolder = folder
      tmpfile = folder + '/tmpfile'
    })
    .then(() => Promise.promisify(fs.writeFile)(tmpfile, JSON.stringify(newElements, null, '  ')))
    .then(() => Promise.promisify(fs.rename)(tmpfile, list.filepath))
    .then(() => {
      fs.rmdir(tmpfolder, () => {}) // it doesn't matter if this fails
      list.lock = false
      list.elements = newElements
      callback(null, list) 
    }) 
    .catch(e => {
      list.lock = false
      callback(e)
    })
}

export { openOrCreateList, saveList }

