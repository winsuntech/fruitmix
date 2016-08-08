# Modeling a File system

## File System Basic

In traditional file system, there are three basic concepts:

1. `path`, the **place** where a file or folder exists. It also implies the hierarchical structure of the file system;
2. `metadata`, including file name, MAC time, size, etc. Metadata can be changed independently without change the real content of the file. For example: renaming a file;
3. `data`, the content of the file.

Furthermore, `path` also plays an important role in the permission design for traditional file system:

1. Every file or folder is assigned a permission, indicating who own(s) it, and who else can read from or write to it;
2. Given a `path`, the permission on every folder/file along the path acts as a chain of **gates**. If a user can pass all those gates, the access is allowed. Otherwise, it is denied.

Such permission design is simple and efficient, at the expense that every file or folder in the system is assigned a permission.

## Network File System

Network File System has a client-server architecture. The client runs on user's computer, providing a file system service, while the 'real' files and folders are stored on the server side. File operations initiated from client side are passed to server for execution.

The main benefit of Network File System is that it enables multiple users to share folders and files over a network. But not all file operations through network file system are as robust or efficient as their counterpart on a local file system.

For example, many document editors read from and write to files frequently. If the file is stored remotely, such operations may be slow. Some network file system (such as samba) tries to ease the problem by caching some part of the file locally. This adds another layer of complexity: a file locking mechanism is required. Such locking mechanism is opportunistic, since there are chances the same files are accessed by another user (or process) from another computer. Also, an notification should be sent from server to client, when a client locked file changed by third party. The client must invalidate local cache, reload latest file content from server, and try their best to merge the latest change made by local user on client computer. They never works as stable and efficient as the file locking mechanism in local file system.

Most network file system service, implemented on Linux, requires a real file system as the back-end. Also, they usually integrate their user account and permission system with existing Linux system users and permissions. This results in the tight coupling between the network file service and the host system.

For a NAS implementation, this also implies that if some Network File Service is provided, and we have no intention to rewrite the service from scratch, there must be a corresponding file system (hierarchy) maintained locally.

## Web Drive

A web drive (in common sense) can be thought of a 'virtual' file system accessed via web interface or web apps.

Unlike a network file system, in web drive's implementation, `path` is not necessarily a real file system path on server.

File operations taking single node (file or folder) rather than the full path as the argument will show better concurrent performance.

For example, if user A is operating on node c, while user B is renaming it's parent folder node b simultaneously. If the full path is used for operation argument, then there must be a mechanism preventing user B from renaming node b. However if b and c are assigned with a unique identifier respectively, then using this identifier as the argument for the operation, user A and user B can fulfill their jobs simultaneously.

This is exactly the way most popular web drive service designing their APIs. They can do this because they don't need to conform to file operation interfaces for any existing file systems.

If such system need not provide any network file service, such as samba or nfs, then it is possible to store the files and folders in any way they wish, say, storing files in a distributed file storage service, and storing the folders, their metadata, as well as their relationships, in database. Most web drive services work in this way.

It is also worth mentioning that there is no need to pre-assign the permission to all files or folders in web drive implementation. Only files or folders with user explicitly stamping a permission setting on require such data. Others may inherit permission settings from their parent folder, or ancestors. Those data can also be stored in database.

# Challenges

For a NAS system, both Network File Services and Web-based File Access are must-have features.

So we need to find a way merging the




In most web driven


By `instance`.

By `content`

\[
\alpha * \beta
\]


## Extended Attribute

Fruitmix uses Linux file system's Extended Attribute (xattr) feature to attach data onto files and folders.

All files and folders in `Universe` has an extended attribute named: `user.fruitmix`, including the root folders.

## Non-Root Node

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


## Xstat

`Xstat` is a data structure merged from a fruitmix xattr and `fs.stat` object, plus a `abspath` property indicating the absolute path for this folder or file.

## readXstat (function)

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
