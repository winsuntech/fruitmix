import { Router } from 'express'
import auth from '../middleware/auth'

import Models from '../models/models'

const router = Router()

/**

Drive {
 domain: null,
 _events: [Object],
 _eventsCount: 1,
 _maxListeners: undefined,
 proto: [Object],
 uuidMap: [Object],
 hashMap: [Object],
 hashless: [Object],
 shares: [Object],
 root: [Object],
 uuid: '6586789e-4a2c-4159-b3da-903ae7f10c2a',
 owner: [Object],
 writelist: [],
 readlist: [],
 fixedOwner: true,
 cacheState: 'CREATED',
 rootpath: '/home/wisnuc/fruitmix/tmptest/drives/6586789e-4a2c-4159-b3da-903ae7f10c2a' } ],

**/

router.get('/', auth.jwt(), (req, res) => {
  
  let repo = Models.getModel('repo')
  let { drives } = repo

  console.log(repo)
  console.log('hello world!')
  console.log(drives)
  
  let objs = drives.map(drv => {

    let obj = {
      // configuration
      label: drv.label,
      fixedOwner: drv.fixedOwner,
      URI: drv.URI,
      uuid: drv.uuid,
      owner: drv.owner,
      writelist: drv.writelist,
      readlist: drv.readlist,
      cache: drv.cache,
    }

    obj.rootpath = drv.rootpath // storage online/offline
    if (obj.rootpath) {
      obj.cacheState = drv.cacheState
      if (obj.cacheState === 'CREATED') {
        obj.uuidMapSize = drv.uuidMap.size 
        obj.hashMapSize = drv.hashMap.size
        obj.hashlessSize = drv.hashless.size
        obj.sharedSize = drv.shared.size
      }
    }

    return obj
  })

  return res.status(200).json(objs)
}) 

export default router
