import bcrypt from 'bcryptjs'
import UUID from 'node-uuid'
import validator from 'validator'

import { openOrCreateList, saveList } from './list'

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

// const throwErr(text) => throw new Error(text)

const createFirstUser = async ({
  username, 
  password,
  avatar,
  email,
  type,
}) => {

  if (typeof username !== 'string') throw new Error('invalid username type')
  if (typeof password !== 'string') throw new Error('invalid password type')
  if (!password.length) throw new Error('password can not be empty')
  
   
}

