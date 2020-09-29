[mmir-cordova][0]
============

----
----

<h1 style="color: red;">
DEPRECATED this example <code>cordova</code> integration that targets <code>MMIR</code> version 4.x is outdated - for instructions on how to inegrate current versions of <code>MMIR</code> (version >= 5.x) with <code>cordova</code> see <a href="https://github.com/mmig/mmir-tooling#cordova-build-integration">mmir-tooling#cordova-build-integration</a>
</h1>

```diff
- DEPRECATED this example integration for <code>cordova</code> is an outdated (targeted at old <code>mmir</code> version 4.x)  
- for current instructions on integrating <code>mmir</code> with `cordova` go to https://github.com/mmig/mmir-tooling#cordova-build-integration
```

----
----


A skeleton / boilerplate project for the MMIR framework.

This repository contains resources that should be added to newly
created Cordova 5.x projects, in order to add the MMIR framework.

NOTE: the directory `www-example/` contains a somewhat _minimal_
      MMIR-based application.


WARNING: this is only an example project - files in `build/` and
         and `www-example/mmirf/` may be **out of date**.
For your own project, you should instead use current resources from the [mmir-lib][1] and
[mmir-tooling][2] repositories:

    /build                  <- [mmir-tooling]
    /hooks/
    /merges/
    /platforms/
    /plugins/
    /www/mmirf/             <- [mmir-lib]


 * [mmir-lib][1]
   _(place these files in your `www/mmirf/` directory)_
 * and [mmir-tooling][2]
   _(place these files in your `build/` directory and initialize the
     build-tools by running `npm install` and then `gulp`)_

--
### Prerequisites

* Node.js
* Cordova CLI, version >= 5  
  `npm install -g cordova`
* gulp (npm package):  
  `npm install -g gulp-cli`
* platform development tools

This guide assumes that Cordova 5.x or later CLI is installed globally
(see Cordova CLI documentation for more details), i.e. that the `cordova` command
is available on the terminal/command line.

If you want to initialize the `mmir-tooling`, the [gulp][3] CLI also needs to be installed, i.e. the `gulp` command
is available on the terminal/command line.

In addition, the necessary development tools for your targeted (Cordova) platforms
have to be installed.

--

### Add MMIR Resources To An Existing Cordova Project

Starting with your Cordova 5 (or later version) project which should look something like this

    hooks/
    merges/
    platforms/
    plugins/
    www/
    config.xml

create a new sub-direcotry `build/`.

Then, copy the the contents of the [MMIR tooling][2] repository into
sub-directory `build/`.

Go into the new sub-directory and execute `npm install` and then `gulp` (i.e. execute these commands in directory `build/`).

This will copy some files into the Cordova-project's root directory
(as well as some files into `hooks/before_prepare/`):

    build/
    mmir-build.properties
    mmir-build.settingsDefault

Then you can use the contents of `www-example/` from [mmir-tooling][0] as starting point for
your application code in `www/`.

_NOTE_: You should replace the contents of `www/mmirf/` with a current version from [mmir-lib][1].

### Create A New Cordova Project (Cordova CLI)

after creating a new Cordova project using `cordova create DIR PACKAGE+APPNAME APPNAME`,
change into the newly created project directory `DIR`.

The contents of `DIR` should look something like:

    hooks/
    merges/
    platforms/
    plugins/
    www/
    config.xml

Now, in order to add the MMIR framework, do the following:

1. add platforms, e.g. Android:

   `cordova platform add android`

   and you may also want to add the whitelist plugin

   `cordova-plugin-whitelist` _(the recommended whitelist plugin)__

   or

   `cordova-plugin-legacy-whitelist` _(the backwards-compatible whitelist plugin)__

2. add plugin-dependencies
   (i.e. Cordova plugins required by the MMIR framework;
    for specific dependency details see below)

   `cordova plugin add cordova-plugin-media`

   `cordova plugin add cordova-plugin-network-information`

   `cordova plugin add cordova-plugin-vibration`

3. edit `config.xml`: the `src` attribute of the `content` tag should
   be modified to set the query parameter of the URL:
   ```xml
   <content src="index.html?env=cordova" />
   ```  
  and add / modify other tags in `config.xml` as needed, e.g. set CORS filter
  to allow HTTPS access to domain `www.some-site.com`:
   ```xml
   <access origin="https://www.some-site.com*"/>
   ```


4. add the MMIR framework

  1. add the _SCION queue plugin_

     `cordova plugin add  https://github.com/mmig/mmir-plugin-scionqueue.git`

  2. copy the [MMIR tooling][2] files into sub-directory `build/`
     of the newly created Cordova project at `DIR`
     * there should not exist a directory `build/` yet, so you should create it
     * after copying the files into `build/`, go into this new sub-direcotry and
       exectue `npm install` and then `gulp`.
       This will copy some scripts into `hooks/before_prepare` as well as
       several configuration files into the root directory `DIR`
       (these will have the prefix `mmir-` in their file name):

       ```
       ...
       hooks/before_prepare/**
       mmir-build.properties
       mmir-build.settingsDefault
       mmir-build.settings
       ...
       ```

  3. copy the JavaScript application code and the main `index.html` into `DIR/www`
     (you can use the
       [example index.html](https://github.com/mmig/mmir-cordova/blob/master/www-example/index.html) and
       [app.js](https://github.com/mmig/mmir-cordova/blob/master/www-example/app.js)
      as starting point)

  4. copy the the [MMIR-library][1] files into the sub-directory `DIR/www/mmirf`

  5. you may also want to add platform specific _speech modules_ for speech input (recognition)
     and speech output (synthesis), e.g. the [Android Speech Plugin][4]:

     `cordova plugin add  https://github.com/mmig/mmir-plugin-speech-android.git`

    or the [Nuance Speech Plugin][5] (besides Android also supports iOS but
    requires credentials, i.e. developer account ect.; see the plugin's
    [README][6] file for more details)

5. build the project for all installed platforms using the command `cordova build`

   NOTE: You may have to create / configure `mmir-build.settings` within the project's root
         directory `DIR`. If this file does not exist yet, it will be created automatically
         as a copy of `mmir-build.settingsDefault`. You may have to edit
         `mmir-build.settings` to match your build environment (see comments within the
         file for more information).

   NOTE: If you want to update the platforms (with changes you made in `/www`) without triggering
         a complete build, you can use the command `cordova prepare`.

--
### Use Cordova Platform-Specific Resources

See the [Cordova documentation][7] for platform specific
development guides, .e.g. the guide for [Android][8].

--
### License
If not stated otherwise, files, resources etc. from here are provided under the MIT license.

Copyright (C) DFKI GmbH 2012 - 2017

[0]: https://github.com/mmig/mmir-cordova
[1]: https://github.com/mmig/mmir-lib
[2]: https://github.com/mmig/mmir-tooling
[3]: https://gulpjs.com/
[4]: https://github.com/mmig/mmir-plugin-speech-android
[5]: https://github.com/mmig/mmir-plugin-speech-nuance
[6]: https://github.com/mmig/mmir-plugin-speech-nuance/blob/master/README.md
[7]: https://cordova.apache.org/docs
[8]: https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html
