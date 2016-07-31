var expect = require('chai').expect
var assert = require('chai').assert

class Router {

  constructor() {
    this.routes = [] 
  }

  push(route) {
    expect(this.routes.find(r => (r.verb === route.verb && r.path === route.path)))
      .to.be.an('undefined')
    this.routes.push(route)
  }

  post (path, ...handlers) {
    this.push({
      verb: 'post',
      path: path,
      handlers: handlers
    }) 
  }

  test (verb, path, req, res) {
    var route = this.routes.find(r => (r.verb === verb && r.path === path)) 
    expect(route).to.not.be.an('undefined')

    var handlers = route.handlers
    for (var i = 0; i < handlers.length; i++) {
      // FIXME how about async?
      handlers[i](req, res) 
    }   
  }
}

class Response {
  
  constructor () {
    this.code = 0
  }

  status(code) {
    this.code = code
    return this
  }

  json(body) {
    this.body = body
    return this
  }
}

module.exports.Router = Router
module.exports.Response = Response


