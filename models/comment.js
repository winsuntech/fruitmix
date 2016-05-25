var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
	hash:{type:String},
	creator: {type:String},
	datatime:{type:Number},
	text:{type:String},
	shareid:{type:String}
});

module.exports = mongoose.model('Comment', CommentSchema);


