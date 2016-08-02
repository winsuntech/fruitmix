
/** simply using a JavaScript plain object as key value pairs for singleton models **/

const models = {}

models.setModel = function(name, model) {
  this[name] = model
}

models.getModel = function(name) {
  return this[name]
}

export default models

