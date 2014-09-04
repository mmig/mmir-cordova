mmir-cordova
============

A skeleton / boilerplate project for the MMIR framework.

This repository contains resources that should be added to newly
created Cordova 3.x projects, in order to add the MMIR framework.

NOTE: the directory `www-example/` contains a somewhat _minimal_
      MMIR-based application.


WARNING: this is only an example project - files in `build/` and
         and `www-example/mmirf/` may be outdated.
         For your own project, you should use current versions from
         [mmir-lib][1] (for `www-example/mmirf/`) and [mmir-tooling][2]
         (for `build/` and `mmir-*` files in root directory).

--
### Prerequisites
This guide assumes that Cordova 3.x CLI is installed globally
(see Cordova CLI documentation for more details), i.e. that the `cordova` command
is available on the terminal/command line.

--

### Add MMIR Resources to an existing Cordova Project

Simply Add the files of this repository to the root directory
of the Cordova project.

The project should then look something like this

    hooks/
    merges/
    platforms/
    plugins/
    www/
    config.xml
    
    build/
    www-example/
    mmir-build.properties
    mmir-build.settingsDefault
    mmir-build.xml
    mmir-parse.xml
    
Then use the example from `www-example/` as starting point for
your application code in `www/`.

### Create A New Cordova Project (Cordova CLI)

after creating a new Cordova project using ```cordova create DIR PACKAGE+APPNAME APPNAME```,
change into the newly created project directory ```DIR```.

The contents of ```DIR``` should look something like:

    hooks/
    merges/
    platforms/
    plugins/
    www/
    config.xml

Now, in order to add the MMIR framework, do the following:

1. add platforms, e.g. Android:

   ```cordova platform add android```  
   
2. add plugin-dependencies 
   (i.e. Cordova plugins required by the MMIR framework; 
    for specific dependency details see below)
    
   ```cordova plugin add org.apache.cordova.media```
   
   ```cordova plugin add org.apache.cordova.network-information```
   
   ```cordova plugin add org.apache.cordova.vibration```
   
3. edit ```config.xml```: the ```src``` attribute of the ```content``` tag should
   be modified to set the query parameter of the URL:
   ```xml
   <content src="index.html?env=cordova" />
   ```  
  and add / modify other tags in ```config.xml``` as needed, e.g. set CORS filter
  to allow HTTPS access to domain ```www.some-site.com```:
   ```xml
   <access origin="https://www.some-site.com*"/>
   ``` 


4. add the MMIR framework

  1. add the _SCION queue plugin_
     
     ```cordova plugin add  https://github.com/mmig/mmir-plugin-scionqueue.git```
     
  2. copy the [MMIR tooling][2] files into sub-directory ```build/```
     of the newly created Cordova project at ```DIR```
     * there should not exist a directory ```build/``` yet, so you should create it
     * after copying the files into ```build/```, go into this new sub-direcotry and
       exectue the default ANT build task from ```build/build.xml```.
       This will copy some scripts into ```hooks/before_build``` as well as
       several ANT build / configuration files into the root directory ```DIR```
       (these will have the prefix ```mmir-``` in their file name):
       
       ```
       ...
       hooks/before_build/**
       mmir-build.properties
       mmir-build.settingsDefault
       mmir-build.xml
       mmir-parse.xml
       ...
       ```
     
  3. copy the JavaScript application code and the main ```index.html``` into ```DIR/www```
     (you can use the [example index.html](./www-example/index.html) and 
      [app.js](./www-example/app.js) as starting point)
  
  4. copy the the [MMIR-library][1] files into the sub-directory ```DIR/www/mmirf```
     
5. build the project for all installed platforms using the command ```cordova build```

   NOTE: You may have to create / configure ```mmir-build.settings``` within the project's root
         directory ```DIR```. If this file does not exist yet, it will be created automatically
         as a copy of ```mmir-build.settingsDefault```. You may have to edit 
         ```mmir-build.settings``` to match your build environment (see comments within the 
         file for more information).

--
### Use Cordova Platform-Specific Resources

If, after the first build, you want to continue the development with platform-specific
tools (i.e. only work on / modify resources located under the ```/platform``` directory
of the Cordova project), you can _transfer_ the build-tools for the MMIR framework / resources
into the platform-specific sub-directories and use them there (see also the Cordova 
documentation for more details about platform specific development).

Firstly, copy the ANT build files and settings for MMIR (i.e. the files in the root directory
with prefix  ```mmir-```) over to the root directory of the platform-specific project, along
with the ```/build``` directory.

You may need to modify the settings in ```build.properties``` to match the platform-specific
file structure.


#### Android Platform

For _Android_ you have to copy the files/directories into the
platform-specific project in ```platform/android/```.

The you have to change the property ```baseDir``` in the file ```build.properties```.
This property specifies the location for the web resources (i.e. the ```/www``` directory):
change this from

    baseDir=./
    
to

    baseDir=assets/
    
in order to specify, that the project's web resources can be found in directory ```assets/www```
of the platform-specific project.



For Android, Cordova automatically generates ```build.xml``` and ```custom_rules.xml```. In order
to integrate the MMIR build process, you can modify ```custom_rules.xml``` by adding the 
following target:
```xml
<target name="-pre-build">
	<ant antfile="mmir-build.xml" target="compileAllNodeJs"></ant>
	<ant antfile="mmir-parse.xml" target="parseTemplatesNodeJsEnv"></ant>
</target>
```

This will trigger the same build processes, as the _hooks_ in the (platform-independent) Cordova
root project, that are triggered by using the command ```cordova build```
(i.e. the hooks specified in ```hooks/before_build```).

--
### License
If not stated otherwise, files, resources from here are provided under the MIT license.

Copyright (C) DFKI GmbH 2012 - 2014 

[1]: https://github.com/mmig/mmir-lib
[2]: https://github.com/mmig/mmir-tooling
