# Overview

Originally, Fruitmix is a standalone application and deployed as a docker container. Appifi is a thin layer for managing all docker containers, without much knowledge on how application works.

Now, they are going to merge together. So the first question is: how they view the file system?

## Layers

For the sake of simplicity, we assume the following rules as the top level assumption in system design process

### Files and Folders

Only files and folders are considered on the whole file system. Symbolic links, device files, pipes, Unix domain sockets etc. are excluded. They are invisible.

This assumption implies two important things.

First, The whole file system is a tree. Each node has exactly one parent if it is not the root. All parents are folders. The tree is a nested structure without cycles, because we neglect the existence of symbolic link.

**Definition: Host File System**

Host File System is defined as the file system tree rooted at '/' of the system.

**Definition: Virtual Root or VROOT**

Virtual Root is a folder, dominating a subtree from the Host File System.
