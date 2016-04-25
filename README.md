[mmir-tooling][1]
============

This repository hold files, resources etc. for building MMIR-based applications in
combination with Cordova.


The repository is meant be included as a "sub-project":
for example, this repository is included as a GIT _subtree_ in [MMIR-cordova][2]
and [MMIR-StarterKit][3] as directory ```/build``` using

    git subtree add --prefix build https://github.com/mmig/mmir-tooling master --squash

later updates from this repository can be fetched from wihtin the referencing project using

    git subtree pull --prefix build https://github.com/mmig/mmir-tooling master --squash

----

### Dependencies

The current build process requires the **[MMIR-lib][4] version 3.7.2 or later**

By default the build process will assume that the MMIR-based application is
located at `www/` and the MMIR-library files at `www/mmirf/`:

    ...
    www/mmirf/*
    www/controller/*
    www/views/*
    ...

### Installation

Running the ANT task ```build.xml``` will copy the contents of directory 
```/resources``` into the parent directory, i.e. to ```../```.

When the contents of this repository are located in the sub-directory

    /build

of a Cordova 5.x (CLI generated) project, running the ANT task ```build.xml```
of this repository (within the sub-directory, i.e. `build/build.xml`) will set
 up the resources (_"tooling"_) for building MMIR-based applications with
 Cordova 5.x:
    
    hooks/before_build/**
    mmir-build.properties
    mmir-build.settingsDefault
    mmir-build.xml
    mmir-parse.xml

--
##### License

If not stated otherwise, the files, resources etc. are provided under the MIT license


[1]: https://github.com/mmig/mmir-tooling
[2]: https://github.com/mmig/mmir-cordova
[3]: https://github.com/mmig/mmir-starter-kit
[4]: https://github.com/mmig/mmir-lib
