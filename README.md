[mmir-tooling][1]
============

This repository hold files, resources etc. for building MMIR-based applications in
combination with Cordova.


The repository is meant be included as a "sub-project":
for example, this repository is included as a GIT _subtree_ in [MMIR-cordova][2]
and [MMIR-StarterKit][3] as directory `/build` using

    git subtree add --prefix build https://github.com/mmig/mmir-tooling master --squash

later updates from this repository can be fetched from wihtin the referencing project using

    git subtree pull --prefix build https://github.com/mmig/mmir-tooling master --squash

----

### Dependencies

The current build process requires the **[MMIR-lib][4] version 4.0.0 or later**

By default the build process will assume that the MMIR-based application is
located at `www/` and the MMIR-library files at `www/mmirf/`:

    build/<this directory>
    ...
    www/mmirf/*
    www/controller/*
    www/views/*
    ...

### Installation Prerequisites

These prerequisites are required for automatically installing/setting-up the _mmir-tooling_
in a MMIR project (see section _Installation_ below)

 * Node.js
 * Gulp CLI (command line interface)  
   `npm install -g gulp-cli`
   
### Installation


Running `npm install` and then `gulp` will copy the contents of directory 
`/resources` into the parent directory, i.e. to `../`.

When the contents of this repository are located in the sub-directory

    /build

of a Cordova >= 5.x (CLI generated) project, running `gulp`
of this repository (within the sub-directory, i.e. `/build`) will set
 up the resources (_"tooling"_) for building MMIR-based applications with
 Cordova >= 5.x:
    
    hooks/before_build/**
    mmir-build.properties
    mmir-build.settingsDefault

### Development

NOTE this section is only relevant for working/developing the MMIR library (or its tooling) itself
     (e.g. modifying contents of `www/mmirf/*`), i.e. it can be safely ignored, if the MMIR 
     library is only used.


In general, the build process will load/extract the "raw" requirejs configuration-object (i.e. the JSON-like
object containing the paths, shims etc.) from `mainConfig.js` and do some additional initialization that
is specific to the execution environment (e.g. nodejs).
Changes in `mainConfig.js` that are not contained in the JSON-like configuration object probably require
changes in the build scripts `build/lib/mmir-build/templates/generate-[grammars|views].template`.


#### Prerequisites

The following sections/descripts assume that the build-scripts have been installed as described in the
section [Installation](#installation), where the contents of this directory (i.e. the mmir-tooling sources)
have been placed in the directory `/build` and the mmir-library has been placed in the directory `/www/mmirf`:

    ...
    /build/<contents of this directory>
    /www/mmirf/<contents of mmir-library>
    ...

and `gulp` has been executed in `/build/`.

#### Adding New Libraries

After adding new libraries and/or modules, the build process may need to be updated too.

This will probably be necessary, if there are changes in `mainConfig.js`, especially if the
new library is not nodejs compatible (may need to add/implement a dummy-module that is used during build)
or is not an AMD module and needs a requirejs shim configuration (see also section below).


##### Adding New Vendor Libraries

Vendor libraries should be "requirejs compatible" (i.e. an AMD module):
This can be achieved either by the library itself being an AMD module, or by adding
a requirejs shim configuration in `mainConfig.js` (see documentation of requirejs for more details).

If a vendor library is added with a shim configuration, then the helper script(*)

    node build/lib/mmir-build/scripts/processRequirejsShimConfig.js
     
must be executed which will create an AMD module for the library in `build/lib/mmir-build/mod/`. 
This AMD library will then be used during build (i.e. `cordova prepare`) in the nodejs environment 
(since requirejs shims do not work in nodejs).

NOTE: if the license of the added libraries allow it, you could also use the AMD modules instead
      of the original library and remove the shim configuration
      
> (*): if the web-app root directory is different than `<project dir>/www`, then the direcotry needs
>    to be added as an argument, e.g. if its located in `<project dir>/src/assets`, then run the script with
>
>     node build/lib/mmir-build/scripts/processRequirejsShimConfig.js src/assets

--
### License

If not stated otherwise, the files, resources etc. are provided under the MIT license (see also details in
[library_origins.txt](lib/library_origins.txt))


[1]: https://github.com/mmig/mmir-tooling
[2]: https://github.com/mmig/mmir-cordova
[3]: https://github.com/mmig/mmir-starter-kit
[4]: https://github.com/mmig/mmir-lib
