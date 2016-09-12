import { Router } from 'express'
import auth from '../middleware/auth'

import Models from '../models/models'

const router = Router()

router.get('/', auth.jwt(), (req, res) => {

  let repo = Models.getModel('repo')    
  let user = req.user

  let shared = repo.getShared(user.uuid) 
  res.status(200).json({})
})

export default router

