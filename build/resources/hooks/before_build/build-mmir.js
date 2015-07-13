#!/usr/bin/env node

/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/

var //shell   = require('shelljs'),
    spawn   = require('./libs/spawn'),
    //Q       = require('q'),
    path    = require('path'),
    fs      = require('fs'),
	//console = require('console'),
    ROOT    = path.join(__dirname, '..', '..');


// function hasCustomRules() {
    // return fs.existsSync(path.join(ROOT, 'custom_rules.xml'));
// }
module.exports.getAntArgs = function(cmd, buildFile) {
    var args = [cmd, '-f', path.join(ROOT, buildFile)];//'mmir-build.xml')];
    // custom_rules.xml is required for incremental builds.
    // if (hasCustomRules()) {
        // args.push('-Dout.dir=ant-build', '-Dgen.absolute.dir=ant-gen');
    // }
    
    //ignore missing node-executable: no need to check for availability of NodeJS
    //                                since we started the ANT task using node...
    args.push('-DdoIgnoreMissingNodeJsPath=true');
    
    return args;
};

/*
 * Builds the project with ant.
 * Returns a promise.
 */
module.exports.run = function(build_type, build_file) {
    //default build type
    // build_type = typeof build_type !== 'undefined' ? build_type : "--debug";
    var args = module.exports.getAntArgs(build_type, build_file);
    // switch(build_type) {
        // case '--debug' :
            // break;
        // case '--release' :
            // args[0] = 'release';
            // break;
        // case '--nobuild' :
            // console.log('Skipping build...');
            // return Q();
        // default :
            // return Q.reject('Build option \'' + build_type + '\' not recognized.');
    // }
    // Without our custom_rules.xml, we need to clean before building.
    // var ret = Q();
    // if (!hasCustomRules()) {
        // ret = require('./clean').run();
    // }
    // return ret.then(function() {
        return spawn('ant', args);
    // });
}


module.exports.help = function() {
    console.log('Usage: ' + path.relative(process.cwd(), path.join(ROOT, 'cordova', 'build')) + ' [build_type]');
    console.log('Build Types : ');
    console.log('    \'--debug\': Default build, will build project in using ant debug');
    console.log('    \'--release\': will build project using ant release');
    console.log('    \'--nobuild\': will skip build process (can be used with run command)');
    process.exit(0);
}

var args  = process.argv;
//module.exports.run(args[2]).done(null, function(err) {
//buildNodeJs
module.exports.run('compileAllNodeJs', 'mmir-build.xml').then(function(){

		return module.exports.run('parseTemplatesNodeJsEnv', 'mmir-parse.xml');
	}).done(function(){
		//return module.exports.run('buildNodeJs');
	}, function(err) {
        console.error(err);
        process.exit(2);
    })
