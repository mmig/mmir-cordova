
var gen = require('./generator.js');
var oncomplete = require('../nodejs/oncomplete.js');
var props = require('../nodejs/loadProperties.js');


var _run = function(listener, isGenertateAntTarget){
	
	var runner = new oncomplete();

	var templateFile = 'generate-grammars.template';
	var renderedTemplateFile = 'generate-grammars-script.js';

	var isAntTarget = isGenertateAntTarget;
	
	runner.oncomplete(listener);
	
	props.onloaded(function(config){
		
		templateFile = config.jsBuildDirBase + 'templates/' + templateFile;
		renderedTemplateFile = config.buildDirTempJS + config.tempCompileGrammarParserGeneratorJSFile;
		
		config.isAntTarget = !!isAntTarget;
		config.isAntTargetStr = '' + config.isAntTarget;
		
		if(isAntTarget){
			
			config.isAntTarget = true;
			
			renderedTemplateFile = config.antScriptGrammarsTemplate;
	
			var fs = require('fs');
			var prefixFile = config.jsBuildDirBase + 'templates/ant-script-grammar-prefix.template';
			var suffixFile = config.jsBuildDirBase + 'templates/ant-script-grammar-suffix.template';
			config._prependAnt = fs.readFileSync(prefixFile, 'utf8');
			config._appendAnt  = fs.readFileSync(suffixFile, 'utf8');
			
		}
	
		var includeFiles = {
		
			'InitNodeJsEnv.js': 						'${jsBuildDirBase}'+ (!isAntTarget? 'nodejs/InitNodeJsEnv.js' 					: 'rhino/InitRhinoEnv.js'),
			'InitGrammarGeneratorNodeJsEnv.js': 		'${jsBuildDirBase}'+ (!isAntTarget? 'nodejs/InitGrammarGeneratorNodeJsEnv.js' 	: 'rhino/InitGrammarGeneratorRhinoEnv.js'),
			'NodeJsFileHandler.js': 					'${jsBuildDirBase}'+ (!isAntTarget? 'nodejs/NodeJsFileHandler.js' 				: 'rhino/RhinoFileHandler.js'),

			'ChecksumHandler.js': 						'${jsBuildDirBase}common/ChecksumHandler.js',
			
//			'mainConfig.js': 							'${jsSrcDirBase}mainConfig.js',
//			'peg-0.9.0.js': 							'${jsSrcDirBase}vendor/libs/peg-0.9.0.js',
//			'jison.js': 								'${jsSrcDirBase}vendor/libs/jison.js',
//			'md5.js': 									'${jsSrcDirBase}vendor/libs/md5.js',
			
			'jsonlint.parser.js': 						'${buildDirLib}jsonlint.parser.js',
			'StandaloneSemanticParserCompileExec.js': 	'${jsBuildDirBase}common/StandaloneSemanticParserCompileExec.js'
		};

		//configure replacement / build-stub implementations:
		var buildLibDir = config.buildDirLib+'mmir-build/';
		var appSrcDir = config.jsSrcDirBase;

		//...determine correct build/ sub-dir by analysing the main-app's dir:
		var appDirParts = appSrcDir.split('/');
		for(var i=0, size=appDirParts.length; i+1 != size; ++i){
			if(appDirParts[i] !== '.'){
				buildLibDir = '../' + buildLibDir;
			}
		}
		
		var buildConfig = require('../nodejs/CreateRequirejsBuildConfig.js')(buildLibDir,  appSrcDir);
		config._buildConfig = JSON.stringify(buildConfig);
	
		//process(templateFile, targetFile, includeFiles, context)
		gen.process(templateFile, renderedTemplateFile, includeFiles, config, function(){
			runner.setCompleted();
		});
	
	});
};

module.exports.run = _run;
