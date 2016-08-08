\[
\alpha * \beta
\]

# Extended Attribute

Fruitmix uses Linux file system's Extended Attribute (xattr) feature to attach data onto files and folders.

All files and folders in `Universe` has an extended attribute named: `user.fruitmix`, including the root folders.

# Non-Root Node

There are five propertes in xattr for non-root folders and files.

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

* `uuid`: string, UUID, version 4, required.
* `owner`: string, UUID, version 4, null if not set.
* `writelist`: null or array, containing UUID list
* `readlist`: null or array, containing UUID list
* `hash`: SHA256 string for file, or null, if not computed yet.
* `htime`: hash time, epoch time integer. Reader can compare this with mtime to determine if hash is outdated

Owner property has different interpretation for non-root and root node. For non-root node, it is interpreted as the folder or file **creator**.

It is possible that there is no way to determine this property. For example, the user copies a file into a `VRoot` folder manually, through login shell. Then the file or folder is found by fruitmix, there is no proper logic to determine the `creator` automatically, especially in the case that there are more than one users in corresponding `VRoot` owner. The only thing we can do is to leave it empty, aka, `null`.


# Xstat

`Xstat` is a data structure merged from a fruitmix xattr and `fs.stat` object, plus a `abspath` property indicating the absolute path for this folder or file.

# readXstat (function)

`readXstat` reads the `fs.stat` as well as Extended attributes defined above.

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
