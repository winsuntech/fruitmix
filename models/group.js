var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GroupSchema = new Schema({
	uuid: { type: String,unique: true, required: true},
	groupname: {type:String},
  	members: { type: Array},
});

module.exports = mongoose.model('Group', GroupSchema);


