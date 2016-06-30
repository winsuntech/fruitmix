var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ExifSchema = new Schema({
	hash:{type:String},
	exif:{type:Object}
});

module.exports = mongoose.model('Exif', ExifSchema);


