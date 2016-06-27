import fs from 'fs'
import path from 'path'

export const visit = (dir, dirContext, func, done) => { 

  fs.readdir(dir, (err, entries) => {
    if (err || entries.length === 0) return done()
    
    let count = entries.length
    entries.forEach(entry => {

      func(dir, dirContext, entry, (entryContext) => {
        if (context) {
          visit(path.join(dir, entry), entryContext, func, () => {
            count--
            if (count === 0) done()
          })
        }
        else {
          count --
          if (count === 0) done()
        }
      })
    })
  })
}

/** example 

function xyz(dir, dirContext, entry, callback) {

  console.log(entry)
  fs.stat(path.join(dir, entry), (err, stat) => {

    if (err) {
      callback()
    }
    else if (stat.isDirectory()) {
      callback(`${dir}`)
    }
    else {
      callback()
    }
  })
}

visit('/data', xyz, null, () => {

  console.log('finished')
})

**/
