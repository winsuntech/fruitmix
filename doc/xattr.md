## Extended Attribute

All files in Universe has an extended attribute named: user.Fruitmix

```
{
  uuid: UUID.v4(),
  owner: null,
  writelist: null,
  readlist: null,
  hash: null,
  htime: -1 // epoch time value, i.e. Date object.getTime()
}
```
uuid: string, UUID, version 4

owner: null or array, containing UUID list

writelist: null or array, containing UUID list

readlist: null or array, containing UUID list

hash: SHA256 string for file, or null, if not computed yet or for folders

htime: hash time, epoch time integer, reader can compare this file with mtime, to determine if hash is valid

## readXstat

`readXstat` reads the `fs.stat` as well as Extended attributes defined above.

There are two versions of this function.

`readXstat` is used for reading files or folders inside a `Virtual Root`. This version must be provided with a permission object, which will be used as the default permission settings for the files or folders without Extended Attributes.

`readXstatAnyway` is used for reading the root folder of `Virtual Root`. This version does NOT assume the target folder is a valid `Virtual Root`. If the target does not have valid Virtual Root settings, it simply returns null.

For `Virtual Root`, there are extra rules for validation:

1. The owner property can not be null. It must contains at least one owner.
