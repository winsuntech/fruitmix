import bcrypt from 'bcryptjs'
import UUID from 'node-uuid'
import validator from 'validator'
import Promise from 'bluebird'

import { throwBusy, throwInvalid } from '../util/throw'
import { openOrCreateCollectionAsync} from './collection'

/** Schema
{
  uuid: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  avatar: { type: String, required: true },
  email: { type: String, unique: true },

  isAdmin: { type: Boolean },
  isFirstUser: { type: Boolean },

  // user, device, etc.
  type: { type: String, required: true },
}
**/

Promise.promisifyAll(bcrypt)

// TODO
const validateAvatar = (avatar) => true

class UserModel {

  constructor(collection) {
    this.collection = collection
  }

  async createUser({username, password, avatar, email, isAdmin, type}) {

    if (typeof username !== 'string') throwInvalid('invalid username')
    if (typeof password !== 'string') throwInvalid('invalid password')
    if (!password.length) throwInvalid('password can not be empty')
    
    if (avatar && !validate(avatar)) throwInvalid('invalid avatar')
    avatar = avatar || null

    if (email && !validate(email)) throwInvalid('invalid email')
    email = email || null

    if (isAdmin && typeof isAdmin !== 'boolean') throwInvalid('invalid isAdmin type')
    isAdmin = isAdmin || false
    
    if (type && type !== 'device') throwInvalid('invalid user type')
    type = type || 'user'

    let uuid = UUID.v4()    

    let salt = await bcrypt.genSaltAsync(10)     
    let hash = await bcrypt.hashAsync(password, salt)

    if (this.collection.locked) throwBusy()

    let list = this.collection.list
    let isFirstUser = list.length === 0 ? true : false
    if (isFirstUser) isAdmin = true
    
    let newUser = {
      uuid, username, password: hash, avatar, email,
      isFirstUser, isAdmin, type
    }

    await this.collection.updateAsync(list, [...list, newUser])
    return uuid
  }

  /** change signature **/
  async verifyPassword(useruuid, password) {
    
    let user = this.collection.list.find(u => u.uuid === useruuid)
    if (!user) return null

    let match = bcrypt.compareAsync(password, user.password)
    return match ? user : null
  }
}

const createUserModelAsync = async (filepath, tmpfolder) => {

  let collection = await openOrCreateCollectionAsync(filepath, tmpfolder)
  return new UserModel(collection)
}

export { createUserModelAsync }



