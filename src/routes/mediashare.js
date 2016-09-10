import { Router } from 'express'

import auth from '../middleware/auth'
import Models from '../models/models'

const router = Router()

router.get('/', auth.jwt(), (req, res) => {

  let Media = Models.getModel('media')
  let user = req.user

  let shares = Media.getUserShares(user.uuid)     
  console.log(shares)
  
})

router.post('/', auth.jwt(), (req, res) => {

  console.log('mediashare post')
  let Media = Models.getModel('media')
  console.log(Media)
  let user = req.user

  Media.createMediaShare(user.uuid, req.body, (err, doc) => {

    console.log(doc)
    if (err) return res.status(500).json({}) // TODO
    res.status(200).json(doc)
  }) 
})

export default router

