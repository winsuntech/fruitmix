var expect = require('chai').expect

async function hello(string) {
  return 'hello ' + string
}

describe('hello', function() {  
  it('should return hello + input', function(done) {
    hello('world')
      .then(function(result) {
        expect(result).to.equal('hello world');
        done();
      })
      .catch(done);
  });
});

