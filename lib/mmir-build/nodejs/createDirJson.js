
var oncomplete = require('./oncomplete'),
	props = require('./loadProperties.js'),
	createDirList = require('./createFileList.js'),
	fs = require('fs'),
	path = require('path');

var _onLoad = new oncomplete();

props.onloaded(function(config){
	
	_onLoad.setCompleted(config);
	
});

module.exports.run = function(listener){

	var runner = new oncomplete();
	runner.oncomplete(listener);

	_onLoad.oncomplete(function(config){
		
		var baseDir = config.appRootDir;
		var parseTargetDirs = config.directoriesToParse;
		
		var dirStr = createDirList.create(baseDir, parseTargetDirs, false);
		
		var outFile = path.resolve(config.outputDirectoryParseFileJson);
		
		fs.writeFile(outFile, dirStr, 'utf-8', function(err){
//			console.log('wrote '+outFile+' (size: '+dirStr.length+' chars)');
			runner.setCompleted();
		});
		
	});
};
