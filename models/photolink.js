var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PhotolinkSchema = new Schema({
	uuid: { type: String,unique: true, required: true},
  	photohash: { type: String},
});

module.exports = mongoose.model('Photolink', PhotolinkSchema);