
var oncomplete = require('./oncomplete'),
	mkdir = require('./mkdir.js'),
	props = require('./loadProperties.js');

var runner = new oncomplete();

props.onloaded(function(config){
	
	mkdir(config.buildDirTempJS);
	mkdir(config.jsGenDirBase);
	mkdir(config.outDirCompiledGrammar);
	mkdir(config.outDirCompiledTemplate);
//	mkdir(config.JSOutDialogEngineDir);
//	mkdir(config.JSOutInputEngineDir);
	
	runner.setCompleted();
	
});

module.exports.run = runner.oncomplete;
