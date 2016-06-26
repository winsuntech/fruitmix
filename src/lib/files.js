import fs from 'fs'
import path from 'path'

import mkdirp from 'mkdirp'
import rimraf from 'rimraf'

import { readXstats, readXstatsAsync } from './xstats'
import Tree from './tree'

let tree = null

let rootpath = '/data/fruitmix'

/** the faster but more coupled version 

var walk = function(parent, done) {
  fs.readdir(parent.abspath, (err, list) => {
    if (err || list.length === 0) return done()

    let pending = list.length;
    list.forEach(entry => {
      readXstats(path.join(parent.abspath, entry), (err, xstat) => {
        if (err || !(xstat.isDirectory() || xstat.isFile()))
          return (!--pending) ? done() : null
 
        let node = tree.createNode(parent, xstat)
        if (node && xstat.isDirectory()) 
          walk(node, () => (!--pending) ? done() : null) 
        else if (!--pending) 
          done()      
      })
    })
  })
}

**/

var visit = function(xstat, enter, done) {

  fs.readdir(xstat.abspath, (err, list) => {
    if (err || list.length === 0) return done()

    let count = list.length 
    list.forEach(entry => {

      readXstats(path.join(xstat.abspath, entry), (err, entryXstat) => {
        if (!err && enter(entryXstat, xstat)) 
          return visit(entryXstat, enter, () => {
            if (!--count) done()
          })

        if (!--count) done() 
      })
    })
  })
}

function nodeEnter(cxstat, pxstat) {

  // only process file and folder
  if (cxstat.isFile() || cxstat.isDirectory()) {
    
    // enter only if node created and being directory
    if (tree.createNodeByUUID(pxstat.uuid, cxstat) && cxstat.isDirectory())
      return true
  }
  return false
}

async function init() {

  await mkdirpAsync('/data/fruitmix')
  await mkdirpAsync('/data/fruitmix/library')
  await mkdirpAsync('/data/fruitmix/drive')

  let rootObj = await readXstatsAsync('/data/fruitmix')
  tree = new Tree(rootObj) 
  let root = tree.root

  let libX = await readXstatsAsync('/data/fruitmix/library')
  let lib = tree.createNode(tree.root, libX)

  let driveX = await readXstatsAsync('/data/fruitmix/drive')
  let drive = tree.createNode(tree.root, driveX)

  visit(driveX, nodeEnter, () => {
    tree._visit_pre(drive, (node) => console.log(node.abspath))
  })

  visit(libX, nodeEnter, () => {
    console.log(lib.children.map(c => c.abspath))
  })
}

init()
  .then(r => console.log(r))
  .catch(e => console.log(e))


