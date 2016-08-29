// naiive implementation of invertible bloom lookup table

var UUID = require('node-uuid')

var x = UUID.v4().replace(/-/g, '')

var y = new Buffer(x, 'hex')

var s1 = "eff183a849174628ae1a31ab9487cb60"
var s2 = "21eb937c48c44f04a8dddb3a45b4d4f9"

var b1 = new Buffer(s1, 'hex')
var b2 = new Buffer(s2, 'hex')
var b3 = b1 ^ b2

var u1 = new Uint8Array(b1)
var u2 = new Uint8Array(b2)
var u3 = u1 ^ u2

console.log(s1)
console.log(b1)
console.log(s2)
console.log(b2)

console.log(b3)

console.log(u3)

var m1 = new Uint8Array(2)
m1[0]=1
m1[1]=1

var m2 = new Uint8Array(2)
m2[0]=0
m2[1]=0

var m3 = new Uint8Array(2)

m3 = m1 ^ m2

var m4 = new Uint32Array(2)

console.log(m3)

console.log(JSON.stringify({ value: m2 }, null, '  '))


