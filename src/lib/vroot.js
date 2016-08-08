
const validateVrootXstat = (xstat) {

  if (typeof xstat !== 'object' || xstat === null) return null
  if (!xstat.isDirectory()) return null 

  switch (xstat.type) {
  case 'homeDrive':
    break

  case 'drive':
    break

  case 'homeLibrary':
    break

  case 'deviceLibrary':
    break

  default
    return null
  }
}


// given a path
const readVRootXstat = (target, callback) {
  fs.stat(target, (err, stat) => {
        
  }) 
}

const rootify = (target) {

}


