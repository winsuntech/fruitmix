var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bcrypt = require('bcrypt');

var UserSchema = new Schema({

  uuid: { type: String, unique: true, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  avatar: { type: String, required: true },
  email: { type: String, unique: true },

  isAdmin: { type: Boolean },
  isFirstUser: { type: Boolean },

  // user, device, etc.
  type: { type: String, required: true },
});

/*
 * Arrow function cannot be used here!
 */
UserSchema.pre('save', function(next) {

  var user = this;

  if (this.isNew || this.isModified('password')) {

    bcrypt.genSalt(10, (err, salt) => {

      if (err) return next(err);
      bcrypt.hash(user.password, salt, (err, hash) => {

        if (err) return next(err);        
        user.password = hash;
        return next(); 
      });
    });
  }
  else {
    return next();
  }
});

UserSchema.methods.verifyPassword = function(password, cb) {

    bcrypt.compare(password, this.password, (err, isMatch) => {

        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', UserSchema);


