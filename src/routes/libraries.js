import { Router } from 'express'
import UUID from 'node-uuid'

import auth from '../middleware/auth'
import Models from '../models/models'

const router = Router()

// this endpoint should return a list of libraries, which is
// acturally a list of folders inside the library drive
router.get('/', auth.jwt(), (req, res) => {

  const User = Models.getModel('user')
  const Repo = Models.getModel('repo')

  let userUUID = req.user.uuid
  let folderUUID = req.user.library

  let list = Repo.listFolder(userUUID, folderUUID)
  
})

// this endpoint should return an upload log
router.get('/:/log', auth.jwt(), (req, res) => {

})

// this endpoints should upload a file into given
// folder
router.post('/:', auth.jwt(), (req, res) => {

})

export default router

