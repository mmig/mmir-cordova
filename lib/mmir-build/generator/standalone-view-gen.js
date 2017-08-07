
var gen = require('./generator.js');
var oncomplete = require('../nodejs/oncomplete.js');
var props = require('../nodejs/loadProperties.js');

var _run = function(listener){
	
	var runner = new oncomplete();

	var templateFile = 'generate-views.template';
	var renderedTemplateFile = 'generate-views-script.js';
	
	runner.oncomplete(listener);
	
	props.onloaded(function(config){
	
	
		templateFile = config.jsBuildDirBase + 'templates/' + templateFile;
		renderedTemplateFile = config.buildDirTempJS + config.tempCompileTemplateParserGeneratorJSExecFile;
	
		var includeFiles = {
			
			'InitNodeJsEnv.js': 				'${jsBuildDirBase}nodejs/InitNodeJsEnv.js',
			'InitTemplateParserNodeJsEnv.js': 	'${jsBuildDirBase}nodejs/InitTemplateParserNodeJsEnv.js',
			'NodeJsFileHandler.js': 			'${jsBuildDirBase}nodejs/NodeJsFileHandler.js',
			
			'ChecksumHandler.js': 				'${jsBuildDirBase}common/ChecksumHandler.js',
			
			'jsonlint.parser.js': 				'${buildDirLib}jsonlint.parser.js',
			'StandaloneTemplateParserExec.js': 	'${jsBuildDirBase}common/StandaloneTemplateParserExec.js'
		};
		
		//configure replacement / build-stub implementations:
		var buildLibDir = config.buildDirLib+'mmir-build/';
		var appMmirfSrcDir = config.jsSrcDirBase;
		var appSrcDir = config.appRootDir;

		//...determine correct build/ sub-dir by analysing the main-app's dir:
		var appDirParts = appSrcDir.split('/');
		for(var i=0, size=appDirParts.length; i+1 != size; ++i){
			if(appDirParts[i] !== '.'){
				buildLibDir = '../' + buildLibDir;
			}
		}
		
		var buildConfig = require('../nodejs/CreateRequirejsBuildConfig.js')(buildLibDir, appMmirfSrcDir, appSrcDir);
		config._buildConfig = JSON.stringify(buildConfig);
	
		//process(templateFile, targetFile, includeFiles, context)
		gen.process(templateFile, renderedTemplateFile, includeFiles, config, function(){
			runner.setCompleted();
		});
		
	});
};

module.exports.run = _run;
