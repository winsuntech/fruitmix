import { Router } from 'express'
import Models from '../models/models'

const router = Router()


router.get('/', (req, res) => {

  let User = Models.getModel('user')
  let mapped = User.collection.list
                .map(usr => ({
                  uuid: usr.uuid,
                  username: usr.username,
                  avatar: usr.avatar||''
                }))

  res.status(200).json(mapped)
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

