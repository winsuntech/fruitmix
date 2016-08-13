import fs from 'fs'
import path from 'path'

import Promise from 'bluebird'
import syspath from '../models/paths'

import models from '../models/models'

let initialized = false

const avail = (req, res, next) => initialized ? next() : res.status(503).end()  

const initAsync = async (sysroot) => {

  // set sysroot to syspath
  await syspath.setSysRoot(sysroot)

  // retrieve tmp path
  let tmppath = syspath.get('tmp')

  // create and set user model
  let userModelPath = path.join(syspath.get('models'), 'userModel.json')
  let userModel = await createUserModelAsync(userModelPath, tmppath)
  models.setModel('user', userModel)

  intialized = true
}

const deinit = () => {
  // there will be race conditon !!! FIXME
  models.clear()
  syspath.unsetRoot()  
}

const system = {
  avail,
  init: (callback) => initAsync(sysroot).then(r => {}).catch(e => {})
}

export default system

