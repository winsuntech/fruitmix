# ProtoMapTree

ProtoMapTree is a tree implemented as `Fly Weight Pattern`.

It utilizes JavaScript's prototypal inheritance feature to minimize memory usage.

Other than the common tree/node structure, there is an object, named as proto, acting as the prototype of all node object. Or in terms of JavaScript inheritance, all nodes inherit from this object.

The tree (class) object looks like:

```
{
  root: ,
  proto: ,
  uuidMap: ,
  hashMap: ,
}
constructor(proto) {

  this.root = null
  this.proto = Object.assign(Object.create(protoNode), proto)

  let tree = this
  this.proto.tree = function () {
    return tree
  }   

  this.uuidMap = new Map()
  this.hashMap = new Map()
}
```

During construction, a plain JavaScript object is passed to constructor. `root` is set to null and will be set later.

All properties of `proto` argument, as well as `protoNode`, which holds all node functions, are mixed into the `proto` property. Also, a reference to `tree` object is added to `proto`, which is useful for retrieve the tree object from node.

Tree object also holds a uuid map and a hash map.
