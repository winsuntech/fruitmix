import { Router } from 'express'

import auth from '../middleware/auth'
import Models from '../models/models'

const router = Router()

// return meta data of all I can view
router.get('/', auth.jwt(), (req, res) => {
  
  let repo = Models.getModel('repo')
  let user = req.user

  let media = repo.getMedia(user.uuid)
  res.status(200).json(media)
})

router.get('/:digest', auth.jwt(), (req, res) => {

  let repo = Models.getModel('repo')
  let user = req.user
  let digest = req.params.digest

  repo.getMediaPath(user.uuid, digest) 
})

export default router
