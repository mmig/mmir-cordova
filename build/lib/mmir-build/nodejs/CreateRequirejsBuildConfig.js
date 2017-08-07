
var path = require('path'),
	fs = require('fs');

var getConfig = require('./../nodejs/GetRequirejsConfig.js');

var rootPath = path.join(__dirname, '..', '..', '..', '..');//<- 4 steps up, since this file is located at <root>/bin/lib/mmir-build/nodejs

var _apply = function(srcDir, buildPaths, buildLibUri){
	
	var requireConfPath = path.join(rootPath, srcDir);
var buildSubDir = 'mod/';

	var config = getConfig(path.join(requireConfPath, 'mainConfig.js'));
	
	var uri, fileName;
	for(var name in config.shim){
		
		//if not specifically "overwritten", use converted AMD module for library instead of shim'ed library:
		if(!buildPaths[name]){
			
			uri = config.paths[name];
			fileName = path.basename(uri);
			
			config.paths[name] = buildLibUri + buildSubDir + fileName + '_amd';
		}
	}
	
	config.shim = void(0);
	
	for(var name in buildPaths){
		config.paths[name] = buildPaths[name];
	}
	
	return config;
};

var _getBuildPaths = function(buildLibDir){
	return {
			  'jquery': buildLibDir+'jqueryDummy'
			, 'mmirf/build/jqueryajax': buildLibDir+'jqueryAjaxDummy'
			, 'mmirf/util/loadFile': buildLibDir+'jqueryLoadFileDummy'
			, 'mmirf/env': buildLibDir+'envDetectBuild'
			
			, 'mmirf/build/viewEngine': buildLibDir+'viewEngineDummy'
			, 'mmirf/loadCss': buildLibDir+'loadCssDummy'
			
//			, 'mmirf/md5': void(0)
			, 'mmirf/core': 'mmirf/core'
			, 'mmirf/logger': 'mmirf/tools/logger'
	};
};

//var buildLibDir = './../build/lib/';
//var paths = _getBuildPaths(buildLibDir);
//console.log(_apply(paths, buildLibDir));

module.exports = function(buildLibDir, mmirDir, srcDir){

	var paths = _getBuildPaths(buildLibDir);
	var config = _apply(mmirDir, paths, buildLibDir);

	//adjust the baseUrl:
	config.baseUrl = srcDir;
	
	config.config['mmirf/logger'] = {
		//set default log-level to info:
		logLevel: 'info',
		//enable tracing for logger:
		trace: true
	};
	
	return config;
};
