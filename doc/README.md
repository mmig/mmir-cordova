# Generating API Doc for MMIR

For the generating API documentation of the MMIR framework using jsdoc.

The contents of this repository/directory should be placed in the `build/doc`
subdirectory of your project, where you use the MMIR framework. The 
directory structure should look something like the following
```
    /                    the project root directory
    build/doc/           this directory/content
    www/                 the app/assests directory
    www/mmirf/           the MMIR framework directory
    ...
    mmir-build.setings	
```

If the directory structure is different, variable `dir.project.root` in
`doc.properties` needs to updated accordingly. 

The `gulp` script creates docs either for jsdoc2 or jsdoc3 (or a dependency graph)


    PROJECT_PATH/build/doc/api_doc2       (for jsdoc2)
    PROJECT_PATH/build/doc/api_doc3       (for jsdoc3)
    PROJECT_PATH/mmirf-dependencies.html  (for depDoc)
  
with targets (depends on settings) `gulp jsdoc2`, or `gulp jsdoc3`.

In addition, a dependency graph for the mmir-lib modules can be generated using target `gulp depDoc`.


The default target is `jsdoc3`, i.e. this target is selected when running `gulp` without arguments.


See `doc.properties` for more properties/options concerning the 
doc generation.


## Prerequisites


These prerequisites are required for automatically generating the doc-files

 * Node.js
 * Gulp CLI (command line interface)  
   `npm install -g gulp-cli`

Then, for installing the depedencies, run the following command  
`npm install`

### Installation and Configuration Details

If the directory

`PROJECT_PATH/build/doc/node_modules`

is missing, you should run `npm install` in `PROJECT_PATH/build/doc` in order to install

 * gulp
 * jsdoc3
 * jsdoc2 (node-jsdoc-toolkit)
 * template docstrap for jsdoc3
 * template jaguarjs for jsdoc3
 * dependo
 * esprima


Ideally, you should use the latest jsdoc3 version >= v3.4.0-dev;
The `npm install` command will use the current jsdoc3 repository.


jsdoc3 is set to use the [docstrap][1] template by default, which is
automatically installed when `npm install` is run in the doc-dir.


If you want to change templates, edit `doc.properties` and change variable
`template.jsdoc.v2` or/and `template.jsdoc.v3` to point to directory where
your template's `publish.js` file is located.


## Notes

Note that the jsdoc3 generation uses some custom plugins in `/doc/plugins/` which are
referenced via the jsdoc3 configuration file `/doc/conf-jsdoc3.json` (if you use your
own script for generating the docs, you can use the command line parameter `-c CONFIG` 
of jsdoc3 for using the configuration file; take care that the working directory from 
which you call jsdoc3 corresponds to the configuration in `conf-jsdoc3.json`).


[1]: https://github.com/terryweiss/docstrap
