var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LibrarylistSchema = new Schema({
	uuid: { type: String,unique: true, required: true},
});

module.exports = mongoose.model('Librarylist', LibrarylistSchema);