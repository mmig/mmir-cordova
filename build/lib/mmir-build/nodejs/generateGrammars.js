

var fs = require('fs'),
	path = require('path'),
	mkdir = require('./mkdir.js'),
	props = require('./loadProperties.js'),
	oncomplete = require('./oncomplete.js'),
	getBool = require('./extractboolean.js'),
	//for creating temporary generator-script:
	grammarGen = require('./../generator/build-standalone-grammar-gen');

var _genLoader = new oncomplete();
var _genExec;

var libDir = '../';
var rootPath = path.join(__dirname, '..', '..', '..', '..');//<- 4 steps up, since this file is located at <root>/bin/lib/mmir-build/nodejs
var basePath = rootPath + '/';

//set a FLAG indicating that the exec-generator script should be loaded/run as a module:
global.isRunAsModule = true;


//set during init with the build-properties:
var _config;
//set during init if something failed:
var _error;

var execGrammarGen = function(config, idList, listener, options){
	
//	var execGrammarFile = config._execGrammarFile;
	var grammarDefDir = config.grammarDefinitionJsonDir;
	var inFileName = config.grammarDefinitionJsonFile;
//	var langCode = config.grammarLanguageCode;
	var outDir = config.outDirCompiledGrammar;
	var outFileName = config.outFileCompiledGrammar;
//	var execLibDir = config.execBuildLibDir;
		
	var size = idList.length;
	var count = 0, langCode;
	
	
	options = options || {};
	
	//TODO clone options and attach config values to clone
	options.jsonGrammarDir = grammarDefDir;
	options.jsonGrammarFile = inFileName;
	options.outPath = outDir;
	options.outFile = outFileName;
//	options.engine = null;			//grammarEngine: null => DEFAULT or config
	
	var callback = function(){
		
		++count;
		
    	if(count === size){
//	    	//update dir structure:
//	    	require('../runDirJsonCreate.js');
    		listener.setCompleted();
    	}
	};
	options.callback = callback;
	
	var settingsForce;
	if(typeof config.ignoreGrammarChecksum !== 'undefined'){
		//DEPRECATED -> treat ignore-checksum-result same as force-generation!
		settingsForce = config.ignoreGrammarChecksum;
	}
	if(typeof config.forceGrammarGeneration !== 'undefined'){
		//NOTE the force-option overwrites the ignore-option (if present)
		settingsForce = config.forceGrammarGeneration;
	}

	
	//only use settings-value, if there is no specific options present for this already
	if(typeof settingsForce !== 'undefined' && typeof options.force === 'undefined'){
		
		options.force = getBool(settingsForce);
	}
	
	for(var i=0; i < size; ++i){
		
		langCode = idList[i];
		
//		function(_theJSONGrammarPath, _theJSONGrammarFileName, _theJSONGrammarLanguageStr, _theCompiledGrammarTargetPath, _theCompiledGrammarTargetFileName, _theGrammarEngine, callback){
//		var execArgs = [grammarDefDir, inFileName, langCode, outDir, outFileName, null/*grammarEngine: null => DEFAULT or config*/, callback, isForceGeneration];

		options.languageCode = langCode;

		//generate compiled views:
		_genExec.generateGrammar(options);
	}
	
};


grammarGen.run(function(){

	props.onloaded(function(config){
		
		_config = config;
		
		var scripts = [ 
            config.jsBuildDirBase + 'nodejs/InitNodeJsEnv.js',
            config.jsBuildDirBase + 'nodejs/InitGrammarGeneratorNodeJsEnv.js',
            config.jsBuildDirBase + 'nodejs/NodeJsFileHandler.js',
            config.buildDirTempJS + config.tempCompileGrammarParserGeneratorJSFile
        ];
		
		var langList;
		var size = scripts.length;
		var loaded = 0;
		var procComplete = function(isIncreaseCount){
			
			if(isIncreaseCount){
				++loaded;
			}
			
			if(langList && loaded === size){
				
				mkdir(config.buildDirTempJS);
				
				var execGrammarFile = config.buildDirTempJS + config.tempCompileGrammarParserGeneratorJSExecFile;
				config._execGrammarFile = execGrammarFile;
				
				
				var execGrammarCode = scripts.join('\n');
				
				fs.writeFile(execGrammarFile, execGrammarCode, 'utf-8', function(err){
					
					_error = err;
					if(err) throw err;
					 
					global.mmir = global.mmir || {};
					global.mmir.nodejs = global.mmir.nodejs || {};
					global.mmir.nodejs.config = global.mmir.nodejs.config || {};
					global.mmir.nodejs.config.grammar = global.mmir.nodejs.config.grammar || {};
					
					global.mmir.nodejs.config.grammar.jsLibPath = config.execBuildLibDir;
					global.mmir.nodejs.config.grammar.appRootDir = config.appRootDir;
					//need callback since the exec-script is initialized asynchronously
					// (i.e. exports are not available immediately)
					global.mmir.nodejs.config.grammar.onModuleInit = function(){
						_genLoader.setCompleted(langList);
					};
					
					_genExec = require(basePath + config._execGrammarFile);
					
				});
			}
		};
		
		
		for(var i=0; i < size; ++i){
			
			(function(){
				
				var index = i;
				fs.readFile(scripts[index], 'utf-8', function(err, content){
					if(err){
						throw err;
					}
					scripts[index] = content;
					procComplete(true);
				});
				
			})();
		}

		var grammarDefDir = config.grammarDefinitionJsonDir;
		var grammarFileName = config.grammarDefinitionJsonFile;
		var dirStructureFile = config.outputDirectoryParseFileJson;
		
		var createLangList = require('./createLanguageList.js');
		
		createLangList.create(grammarDefDir, grammarFileName, dirStructureFile, function(res){
			langList = res;
			procComplete(false);
		});
		
	});

});

/**
 * @param options
 * 			options.languageCodes {Array<String>} OPTIONAL list of grammar IDs (using instead of extracted list from config/directory.json)
 * 			options.force {Boolean} OPTIONAL force re-generation of grammar, even if JSON did not change (DEFAULT: false)
 */
module.exports.run = function(listener, options){
	
	if(_error) throw _error;
	
	_genLoader.oncomplete(function(loadedLangList){

		if(_error) throw _error;
		
		var runner = new oncomplete();
		if(listener){
			runner.oncomplete(listener);
		}

		var langList = options && options.languageCodes? options.languageCodes : loadedLangList;
		execGrammarGen(_config, langList, runner, options);
	});
};
