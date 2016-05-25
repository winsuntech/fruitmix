var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UdbindingSchema = new Schema({
	owner: { type: String},
	uuid: { type: String,unique: true, required: true},
});

module.exports = mongoose.model('Udbinding', UdbindingSchema);