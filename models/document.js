var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bcrypt = require('bcrypt');

var DocumentSchema = new Schema({
  hash: { type: String, unique: true, required: true },
  data: { type: Object},
  // owner: { type: String, unique: true, required: true },
  // permission: { type: Object, required: true },
  // content: { type: Object, required: true },
  // comment: { type: Object, unique: true },
  // createtime: { type: String },
  // lastmodifytime: { type: String },
});

/*
 * Arrow function cannot be used here!
 */
// UserSchema.pre('save', function(next) {
//   var user = this;
//   if (this.isNew || this.isModified('password')) {
//     bcrypt.genSalt(10, (err, salt) => {
//       if (err) return next(err);
//       bcrypt.hash(user.password, salt, (err, hash) => {
//         if (err) return next(err);        
//         user.password = hash;
//         return next(); 
//       });
//     });
//   }
//   else {
//     return next();
//   }
// });

// UserSchema.methods.verifyPassword = function(password, cb) {
//     bcrypt.compare(password, this.password, (err, isMatch) => {
//         if (err) {
//             return cb(err);
//         }
//         cb(null, isMatch);
//     });
// };

module.exports = mongoose.model('Document', DocumentSchema);


