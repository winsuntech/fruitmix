import { Router } from 'express'

import auth from '../middleware/auth'
import Models from '../models/models'

const router = Router()

router.get('/', auth.jwt(), (req, res) => {
  
  let repo = Models.getModel('repo')
  let user = req.user

  let media = repo.getMedia(user.uuid)
  console.log(media)

  res.status(200).json(media)
})

export default router
