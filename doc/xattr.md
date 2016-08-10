# Extended Attribute

Fruitmix uses Linux file system's Extended Attribute (xattr) feature to store `File Instance` data.

All files and folders in `Universe` has an extended attribute named: `user.fruitmix`, including the root folders.

# Non-Root Node

There are five properties in xattr for non-root folders and files.

```
{
  uuid: UUID.v4(),
  owner: null,
  writelist: null,
  readlist: null,
  hash: null,   // file only
  htime: null   // epoch time value, i.e. Date object.getTime(), file only
}
```

* `uuid`: string, UUID, version 4, required
* `owner`: string, UUID, version 4, null if not set, required
* `writelist`: null or array, containing UUID list, required
* `readlist`: null or array, containing UUID list, required
* `hash`: SHA256 string for file, or null, if not computed yet, required
* `htime`: hash time, epoch time integer. Reader can compare this with mtime to determine if hash is outdated, required.

Notice that owner property has different interpretation for non-root and root node. For non-root node, it is interpreted as the **creator**.

In most cases when user put files into system, either through web interface, or via some sort of network file service, such as samba, fruitmix can determine who is the creator of the file. But there are chances that user put a file into the system manually, bypassing the fruitmix. In such situation, there is no proper logic to force the `creator` to be someone, especially in multiple user owned drives or libraries. The only thing we can do is to leave it empty (`null`).

# Xstat

`Xstat` is a data structure merged from a fruitmix xattr and `fs.Stats` object, plus a `abspath` property indicating the absolute path for this folder or file.

Example:

```
# there are also functions on the object, see nodejs documents

{
  dev: 2114,
  ino: 48064969,
  mode: 33188,
  nlink: 1,
  uid: 85,
  gid: 100,
  rdev: 0,
  size: 527,
  blksize: 4096,
  blocks: 8,
  atime: Mon, 10 Oct 2011 23:24:11 GMT,
  mtime: Mon, 10 Oct 2011 23:24:11 GMT,
  ctime: Mon, 10 Oct 2011 23:24:11 GMT,
  birthtime: Mon, 10 Oct 2011 23:24:11 GMT,

  uuid: ,
  owner: ,
  writelist: ,
  readlist: ,
  hash: ,
  htime: ,

  abspath:
}
```
# readXstat (path, callback)

`readXstat` reads the xstat object for given path.

If xattr does not exist, or it's not valid JSON, `readXstat` will construct a new one filled with default value.

The default value is:

```
{
  uuid: UUID.v4(),
  owner: null,
  writelist: null,
  readlist: null,
  hash: null,
  htime: null
}
```

If the xattr on file containing invalid properties, `readXstat` will fix it and save it back.

Here is the list of constraints on xattr object:

* uuid: non-exists or not a uuid, fixed with a new one
* owner: non-exists, or not a uuid or null, fixed with null or default
* writelist: non-exists, or not a uuid array, fixed with null or default
* readlist: non-exists, or not a uuid array, fixed with null or default
* writelist & readlist: both null, or both array, can be fixed with empty array if one of them is null
* hash: must be valid hash string, correct length and regex test [0-9a-f], can be fixed with null
* htime: must be valid integer (epoch time), can be fixed with -1
* hash & htime: both be valid, if one invalid, fix both
* htime & mtime: if htime !== mtime, invalidate both hash & htime

There are two versions of this function.

`readXstat` is used for reading files or folders exclusively inside a `Virtual Root`. This version must be provided with a permission object, which will be used as the default permission settings for the files or folders without Extended Attributes.

`readXstatAnyway` is used for reading the folder of `Virtual Root`.

This version does NOT assume the target folder is a valid `Virtual Root`. If the target does not have valid Virtual Root settings, it simply returns null.

For `Virtual Root`, there are extra rules for validation:

1. The owner property can not be null. It must contains at least one owner.
2. Type, valid value is `homeDrive`, `drive`, `homeLibrary`, `deviceLibrary`

`homeDrive` allows exactly one owner. Cannot be changed. Cannot be deleted unless the user is deleted. Each user has only one `homeDrive`. It is recommended to create `homeDrive` on System Drive and name the folder as the same uuid with user, suffixed by `-drv`.

`drive` allows one or more owners. Admin can add or remove owner. Can be deleted by SysAdmin.

`homeLibrary` allows exactly one owner. Cannot be changed. Cannot be deleted unless the user is deleted. Each user has only one `homeLibrary`. It is recommended to create `homeLibrary` on System Drive and name the folder as same uuid with user, suffixed by `-lib`

```
{
  uuid: UUID.v4(),
  owner: [...], // non-empty!
  writelist: [...], // non-empty!
  readlist: [...], // non-empty!
  roottype: 'drive', 'library'
}
```
