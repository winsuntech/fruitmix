import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import UUID from 'node-uuid'
import validator from 'validator'
import Promise from 'bluebird'

import { throwBusy, throwInvalid } from '../util/throw'
import { openOrCreateCollectionAsync} from './collection'

const isUUID = (x) => typeof x === 'string' && validator.isUUID(x)

const validateUnixUserName = (text) => 
  /[a-zA-Z][a-zA-Z0-9_-]*/.test(text)

const smbEncryptPassword = (text) => 
  crypto.createHash('md4')
    .update(Buffer.from(text, 'utf16le'))
    .digest('hex')
    .toUpperCase()

const epochTimeInSeconds = () => 
  Math.floor((new Date().getTime() / 1000))

/** Schema
{

*   type: // string, 'local' or 'remote'

    uuid: { type: String, unique: true, required: true },
*   username: { type: String, unique: true, required: true },
x   password: { type: String, required: true },

*   smbUsername: 
x   smbpassword:
x   smblct:

o   avatar: { type: String, required: true },
o   email: { type: String, unique: true },

o1  isAdmin: { type: Boolean },
    isFirstUser: { type: Boolean },

    home: // home drive uuid (auto generated when creating)
    library: // library drive uuid (auto generated when creating)
}

Note: 
o1  neglected for first user 

**/

Promise.promisifyAll(bcrypt)

// TODO
const validateAvatar = (avatar) => true

class UserModel {

  constructor(collection) {
    this.collection = collection
  }

  createUser(props, callback) {

    const einval = (text) => callback(Object.assign(new Error(text), { code: 'EINVAL' }))
    const ebusy = (text) => callback(Object.assign(new Error(text), { code: 'EBUSY' }))

    let {
      type,         // *
      username,     // *
      password,     // *
      smbUsername,  // o 
      smbpassword,  // o
      avatar,       // o
      email,        // o
      isAdmin,      // o
    } = props

    if (type !== 'local' && type !== 'remote')
      return einval('invalid user type')
    if (typeof username !== 'string' || !username.length)
      return einval('invalid username')
    if (typeof password !== 'string' || !password.length)
      return einval('invalid password')

    if (smbUsername && (typeof smbUsername !== 'string' || !validateUnixUserName(smbUsername)))
      return einval('invalid smbUsername')
    if (smbpassword && (typeof smbpassword !== 'string' || !smbpassword))
      return einval('invalid smbpassword')
    if (!!smbUsername !== !!smbpassword)
      return einval('smbUsername and smbpassword must be provided together')

    smbUsername = smbUsername || null
    smbpassword = smbpassword || null

    if (avatar && (typeof avatar !== 'string' || avatar.length === 0))
      return einval('invalid avatar')

    avatar = avatar || null

    if (email && (typeof email !== 'string' || !validator.isEmail(email)))
      return einval('invalid email')
    
    email = email || null

    if (isAdmin && typeof isAdmin !== 'boolean')    
      return einval('invalid isAdmin, must be true or false')

    isAdmin = isAdmin || false

    let uuid = UUID.v4()
    let salt = bcrypt.genSaltSync(10) 
    let passwordEncrypted = bcrypt.hashSync(password, salt)

    let smbpasswordEncrypted = null
    let smbLastChangeTime = null

    if (smbpassword) {
      smbpasswordEncrypted = smbEncryptPassword(smbpassword)
      smbLastChangeTime = epochTimeInSeconds()
    }    

    if (this.collection.locked) 
      return ebusy('locked')

    let list = this.collection.list
    let isFirstUser = list.length === 0 ? true : false  
    if (isFirstUser) isAdmin = true

    let newUser = {
      type, 
      uuid: UUID.v4(),
      username, 
      password: passwordEncrypted, 
      smbUsername,
      smbPassword: smbpasswordEncrypted,
      smbLastChangeTime,
      avatar,
      email,
      isAdmin,
      isFirstUser,
      home: UUID.v4(),
      library: UUID.v4()
    }

    this.collection.updateAsync(list, [...list, newUser]) 
      .then(() => callback(null, newUser))
      .catch(e => callback(e))
  }

  async createUserAsync({
    type,         // *
    username,     // *
    password,     // *
    smbUsername,  // o 
    smbpassword,  // o
    avatar,       // o
    email,        // o
    isAdmin,      // o
    home,         // *
    library,      // *
  }) {

    if (type !== 'local' && type !== 'remote') throwInvalid('invalid type')
    if (typeof username !== 'string' || !validateUnixUserName(username)) throwInvalid('invalid username')
    if (typeof password !== 'string') throwInvalid('invalid password')
    if (!password.length) throwInvalid('password can not be empty')

/**
    if (avatar && !validate(avatar)) throwInvalid('invalid avatar')
    avatar = avatar || null
**/

    avatar = null

    if (email && !validator.isEmail(email)) throwInvalid('invalid email')
    email = email || null

    if (isAdmin && typeof isAdmin !== 'boolean') throwInvalid('invalid isAdmin type')
    isAdmin = isAdmin || false

    if (!typeof home !== 'string' || !validator.isUUID(home)) throwInvalid('invalid home')
    if (!typeof library !== 'string' || !validator.isUUID(library)) throwInvalid('invalid library')

    if (smb === undefined || smb === null)
      smb = null 

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

  // to be refactored
  async deleteUser(uuid) {
    if(typeof uuid !== 'string') throwInvalid('invalid uuid')
    if(this.collection.locked) throwBusy()
    if(this.collection.list.find((v)=>v.uuid==uuid).length==0) throwInvalid('invalid uuid')
    await this.collection.updateAsync(this.collection.list, this.collection.list.filter((v)=>v.uuid!==uuid))
    return true 
  }

  // 
  async verifyPassword(useruuid, password) {
    
    let user = this.collection.list.find(u => u.uuid === useruuid)
    if (!user) return null

    let match = bcrypt.compareAsync(password, user.password)
    return match ? user : null
  }
}

const createUserModel = (filepath, tmpdir, callback) => {
  
  openOrCreateCollectionAsync(filepath, tmpdir)
    .then(collection => callback(null, new UserModel(collection)))
    .catch(e => callback(e))
}

const createUserModelAsync = async (filepath, tmpfolder) => {

  let collection = await openOrCreateCollectionAsync(filepath, tmpfolder) 
  if (collection)
    return new UserModel(collection)
  return null
}

export { createUserModelAsync, createUserModel }



