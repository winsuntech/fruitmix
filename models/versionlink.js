var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VersionlinkSchema = new Schema({
	uuid: { type: String,unique: true, required: true},
  	latest: { type: Array},
});

module.exports = mongoose.model('Versionlink', VersionlinkSchema);


