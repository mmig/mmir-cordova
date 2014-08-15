mmir-tooling
============

This repository hold files, resources etc. for building MMIR-based applications in
combination with Cordova.


The repository is not meant be be used by its own:
for example, this repository is included as a GIT _subtree_ in [MMIR-cordova][1] as
directory ```/build```.


Running the ANT task ```build.xml``` will copy the contents of directory 
```/resources``` into the parent directory, i.e. to ```../```.

When the contents of this repository are located in the sub-directory

    /build

of a Cordova 3.x (CLI generated) project, running the ANT task ```build.xml```
of this repository (within the sub-directory) will set up the resources
(_"tooling"_) for building MMIR-based applications with Cordova 3.x.

--
##### License

If not stated otherwise, the files, resources etc. are provided under the MIT license


[1]: https://github.com/mmig/mmir-cordova
