import { Router } from 'express'
import Models from '../models/models'

const router = Router()

router.post('/', (req, res) => {

  let User = Models.getModel('user')

  // if user exists
  if (User.collection.list.length) return res.status(404).end()

  // let Repo = Models.getModel('repo')

  let props = req.body
  props.type = 'local'

  User.createUser(props, (err, user) => {
    if (err) return res.status(err.code === 'EINVAL' ? 400 : 500).json({
      code: err.code,
      message: err.message
    })

    res.status(200).end()
  })
})

export default router

