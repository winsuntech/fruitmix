import { Router } from 'express'
import auth from '../middleware/auth'

import Models from '../models/models'

const router = Router()

router.get('/', auth.jwt(), (req, res) => {

  res.status(500).end()
})

router.post('/', auth.jwt(), (req, res) => {

  let { target, name } = req.body
  // do check TODO

  let repo = Models.getModel('repo')
  repo.createFolder(req.user.uuid, name, target, (err, node) => {
    let obj = Object.assign({}, node, { parent: undefined, children: undefined })
    err ? res.status(500).end() : res.status(200).json(obj)
  })
})

export default router
