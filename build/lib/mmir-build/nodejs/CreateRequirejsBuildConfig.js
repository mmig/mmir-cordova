
var path = require('path'),
	fs = require('fs');

var getConfig = require('./../nodejs/GetRequirejsConfig.js');

var rootPath = path.join(__dirname, '..', '..', '..', '..');//<- 4 steps up, since this file is located at <root>/bin/lib/mmir-build/nodejs

var baseUrl = rootPath + '/www/mmirf/';
var buildSubDir = 'mod/';

//console.log(config.shim);

var _apply = function(buildPaths, buildLibUri){
	
	var config = getConfig(baseUrl + 'mainConfig.js');
	
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
			, 'jqueryajax': buildLibDir+'jqueryAjaxDummy'
			, 'env': buildLibDir+'envDetectBuild'
			, 'jqm': buildLibDir+'jqueryMobileDummy'
			
			, 'jqmSimpleModal': buildLibDir+'jqmSimpleModalDummy'
			, 'loadCss': buildLibDir+'loadCssDummy'
			
			, 'stacktrace': buildLibDir+'stacktraceDummy'
			
//			, 'md5': void(0)
			, 'logger': 'tools/logger'
	};
};

//var buildLibDir = './../build/lib/';
//var paths = _getBuildPaths(buildLibDir);
//console.log(_apply(paths, buildLibDir));

module.exports = function(buildLibDir, srcDir){

	var paths = _getBuildPaths(buildLibDir);
	var config = _apply(paths, buildLibDir);
	config.baseUrl = srcDir;
	
	config.config.logger = {
		trace: false
	};
	
	return config;
};

