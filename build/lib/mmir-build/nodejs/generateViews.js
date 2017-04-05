
var child_process = require('child_process');

var fs = require('fs'),
	path = require('path'),
	mkdir = require('./mkdir.js'),
	props = require('./loadProperties.js'),
	oncomplete = require('./oncomplete.js'),
	getBool = require('./extractboolean.js'),
	//for creating temporary generator-script:
	viewGen = require('./../generator/build-standalone-view-gen');
	
var _genLoader = new oncomplete();
var _genExec;

var rootPath = path.join(__dirname, '..', '..', '..', '..');//<- 4 steps up, since this file is located at <root>/bin/lib/mmir-build/nodejs
var basePath = rootPath + '/';

//set a FLAG indicating that the exec-generator script should be loaded/run as a module:
global.isRunAsModule = true;

//set during init with the build-properties:
var _config;
//set during init if something failed:
var _error;

var generateViews = function(config, listener, options){
	
//	var baseAppDir = config.baseDir;
//	var execLibDir = config.execBuildLibDir;
	
//	var args = [baseAppDir, execLibDir];
	
//	//TODO clone options and attach config values to clone
//	options.appPath = baseAppDir;

	options = options || {};
	
	var callback = function(){
		
		listener.setCompleted();
	};
	options.callback = callback;
	

	var settingsForce;
	if(typeof config.forceViewGeneration !== 'undefined'){
		settingsForce = config.forceViewGeneration;
	}
	
	//only use settings-value, if there is no specific options present for this already
	if(typeof settingsForce !== 'undefined' && typeof options.force === 'undefined'){
		
		options.force = getBool(settingsForce);
	}
	
	_genExec.generateViews(options);
	
};

viewGen.run(function(){

	props.onloaded(function(config){
		
		var execCompileViewGen = basePath + config.buildDirTempJS + config.tempCompileTemplateParserGeneratorJSExecFile;
		
		_config = config;
		
		global.mmir = global.mmir || {};
		global.mmir.nodejs = global.mmir.nodejs || {};
		global.mmir.nodejs.config = global.mmir.nodejs.config || {};
		global.mmir.nodejs.config.view = global.mmir.nodejs.config.view || {};
		
		global.mmir.nodejs.config.view.jsLibPath = config.execBuildLibDir;
		global.mmir.nodejs.config.view.basePath = config.baseDir;
		global.mmir.nodejs.config.view.appRootDir = config.appRootDir;
		//need callback since the exec-script is initialized asynchronously
		// (i.e. exports are not available immediately)
		global.mmir.nodejs.config.view.onModuleInit = function(){
			_genLoader.setCompleted();
		};
		
		_genExec = require(execCompileViewGen);
	});

});

/**
 * @param options
 * 			options.languageCodes {Array<String>} OPTIONAL list of grammar IDs (using instead of extracted list from config/directory.json)
 * 			options.force {Boolean} OPTIONAL force re-generation of grammar, even if JSON did not change (DEFAULT: false)
 */
module.exports.run = function(listener, options){
	
	if(_error) throw _error;
	
	_genLoader.oncomplete(function(){

		if(_error) throw _error;
		
		var runner = new oncomplete();
		runner.oncomplete(listener);
		generateViews(_config, runner, options);
	});
};