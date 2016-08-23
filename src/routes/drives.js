import { Router } from 'express'
import auth from '../middleware/auth'

import Models from '../models/models'

const router = Router()

router.get('/', auth.jwt(), (req, res) => {
  
  let repo = Models.getModel('repo')

  console.log(repo)
  return res.status(200).end()
}) 

export default router
