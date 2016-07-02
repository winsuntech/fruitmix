import { expect } from 'chai'

import { protoNode, ProtoMapTree } from '../../src/lib/protoMapTree'

const testData1 = () => {

  let arr = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .map(c => {
      let node = Object.create(protoNode)
      node.parent = null
      node.name = c
      return node
    })

  let object = {
    a:          null,
      b:        'a',
      c:        'a',
        d:      'c',
      e:        'a',
        f:      'e',
        g:      'e',
      h:        'a',
        i:      'h',
        j:      'h',
          k:    'j',
        l:      'h',
          m:    'l',
          n:    'l'
  } 

  for (let prop in object) {
    if (object.hasOwnProperty(prop)) {
      if (object[prop] === null) continue
      let node = arr.find(n => n.name === prop)
      let parent = arr.find(n => n.name === object[prop])

      if (!node || !parent) throw new Error('node or parent non-exist')
      node.attach(parent)
    }
  } 

  return arr
}

describe('protoMapTree', function() {
  
  describe('path', function() { 
    it('nodeK path should be a h j k', function(done) { 
      let arr = testData1()
      let nodeK = arr.find(node => node.name === 'k')
      expect(nodeK.nodepath().map(n => n.name)).to.deep.equal(['a', 'h', 'j', 'k'])
      done()
    })

    it ('nodeG path should be a e g', function(done) {
      let arr = testData1()
      let nodeG = arr.find(node => node.name === 'g')
      expect(nodeG.nodepath().map(n => n.name)).to.deep.equal(['a', 'e', 'g'])
      done()
    })
  })
})
