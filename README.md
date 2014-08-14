mmir-cordova
============

A skeleton project for the MMIR framework.

This repository contains resources that should be added to newly
created Cordova 3.x projects, in order to add the MMIR framework.

--
### Prerequisites
This guide assumes that Cordova 3.x CLI is installed globally
(see Cordova CLI documentation for more details).

--
### Build

after creating a new Cordova project using ```cordova create DIR PACKAGE+APPNAME APPNAME```,
change into the newly created project directory ```DIR``` and:

1. add platforms, e.g. Android:

   ```cordova platform add android```  
   
2. add plugin-dependencies 
   (i.e. Cordova plugins required by MMIR framework; 
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


4. add the MMIR framework and StarterKit

  1. add SCION queue plugin
     
     ```cordova plugin add  https://github.com/mmig/mmir-plugin-scionqueue.git```
     
  2. copy the contents of this repository into the root folder ```DIR```
     of the newly created Cordova project
     * there should not exist a directory ```build/``` yet, so simply copy this directory over
       to ```DIR```
     * integrate the contents of ```hooks/before_build``` into the existing directory
     * copy the files with prefix ```mmir-``` into the root directory of ```DIR```
     
  3. copy the JavaScript application code and the main ```index.html``` into ```DIR/www```
  
  4. copy the  the [MMIR-library][1] files into the sub-directory ```DIR/www/mmirf```
     
5. build the project for all installed platforms using the command ```cordova build```

   NOTE: You may have to create / configure ```mmir-build.settings``` within the project's root
         directory ```DIR```. If this file does not exist yet, it will be created automatically
         as a copy of ```mmir-build.settingsDefault```. You may have to edit 
         ```mmir-build.settings``` to match your build environment (see comments within the 
         file for more information).


[1]: https://github.com/mmig/mmir-lib
   