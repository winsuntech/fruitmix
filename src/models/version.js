var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bcrypt = require('bcryptjs');

var VersionSchema = new Schema({
  docversion:{type:String},
  creator:{type:String},
  maintainers:{type:Array},
  viewers:{type:Array},
  album:{type:Boolean},
  sticky:{type:Boolean},
  archived:{type:Boolean},
  tags:{type: Array},
  contents: { type: Array},
  mtime:{type:Number}
});

module.exports = mongoose.model('Version', VersionSchema);


