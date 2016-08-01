import bcrypt from 'bcryptjs'

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

const createFirstUser = () => {

}

