import fs from 'fs'
import path from 'path'

import Promise from 'bluebird'
import paths from './paths'
import models from '../models/models'

let initialized = false

const avail = (req, res, next) => initialized ? next() : res.status(503).end()  

const initAsync = async (sysroot) => {

  // set sysroot to paths
  await paths.setRootAsync(sysroot)

  // retrieve tmp path
  let repo = createRepo()

  let sysDrivePath = paths.get('drives')
  // scan drives and add to repo

  let tmpPath = paths.get('tmp')

  // create and set user model
  let userFilePath = path.join(paths.get('models'), 'userModel.json')
  let userModel = await createUserModelAsync(userFilePath, repo, tmpPath)
  models.setModel('user', userModel)

  intialized = true
}

const deinit = () => {
  // there will be race conditon !!! FIXME
  models.clear()
  paths.unsetRoot()  
}

const system = {
  avail,
  init: (callback) => initAsync(sysroot).then(r => {}).catch(e => {})
}

export default system

