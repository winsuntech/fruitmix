import { Router } from 'express'
import auth from '../middleware/auth'

import Models from '../models/models'

const router = Router()

router.get('/', auth.jwt(), (req, res) => {
  
  let User = Models.getModel('user') 
  let Drive = Models.getModel('drive')

  console.log("====")
  console.log(req.user)
  console.log("====")
  return res.status(200).end() 
}) 

export default router
