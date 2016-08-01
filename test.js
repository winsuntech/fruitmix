
try {
  var Db = require('tingodb')().Db
  var db = new Db('tmpdb', {nativeObjectID: true})
  var collection = db.collection('test')
}
catch (e) {
  console.log(e)
}

collection.insert({item: 'hello'}, function(err, result) {
  if (err) return console.log(err)

  collection.findOne({item: 'hello'}, function(err, item) {
    console.log(err)
    console.log(item)
  })
})


