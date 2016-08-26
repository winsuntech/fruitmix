import { Router } from 'express'
import Models from '../models/models'

const UserModel = require('src/models/userModel')
const router = Router()



router.get('/', (req, res) => {
  let r = UserModel.data.collection.list.reduce((pre, cur) => pre.concat([{'uuid':cur.uuid, 'avatar':cur.avatar==null?'':cur.avatar, 'username':cur.username}]), [])
  res.status(200).json(r)
})


router.post('/', (req, res) => {

  let User = Models.getModel('user')

  // if user exists
  if (User.collection.list.length) return res.status(404).end()
  User.createUser(req.body) 
    .then(() => res.status(200).end())
    .catch(e => res.status(e.code === 'EINVAL' ? 400 : 500).json({
      code: e.code,
      message: e.message
    }))
})

export default router

