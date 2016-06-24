var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ConfigSchema = new Schema({
	data: {type:Object}
});

module.exports = mongoose.model('Config', ConfigSchema);


