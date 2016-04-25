#!/usr/bin/env node

var path     = require('path'),
    fs       = require('fs'),
	//console = require('console'),
    ROOT     = path.join(__dirname, '..', '..'),
    basePath = ROOT+'/';


var makeDirs = require(basePath + 'build/lib/mmir-build/nodejs/makeDirs.js');
var createDirStructureFile = require(basePath + 'build/lib/mmir-build/nodejs/createDirJson.js');

var doRun = function(runnableModule, success, error, options){
	
	try{
		runnableModule.run(success, options);
	} catch (err){
		error(err);
	}
};

var subTasks = {
    grammar: {path: 'build/lib/mmir-build/nodejs/generateGrammars.js', options: {debug: false}},
    view: {path: 'build/lib/mmir-build/nodejs/generateViews.js', options: {debug: false}},
    scxml: {path: 'build/lib/mmir-build/nodejs/validateStateEngines.js', options: {throwError: true}}
};
var subTaskCount = 0;

//init subTasks:
(function(){
	
	for(var i in subTasks){
		if(subTasks.hasOwnProperty(i)){
			++subTaskCount;
			subTasks[i].exec = require(basePath + subTasks[i].path);
		}
	}
	
})();

module.exports.run = function() {
	
	var completed = 0;

	var doSucceed = function() {
		
//		console.log('finished subtask '+ (completed + 1) +  ' of '+ subTaskCount);
	    
		if(++completed === subTaskCount){
			//update dir-structure file:
			doRun(createDirStructureFile, function(){
				
					console.log('COMPLETED preparing mmir resources, continuing with preparing platforms...');
					process.exit(0);
				}, doFail
			);
	    }
	};
	
	var doFail = function(err) {
	    console.error(err);
	    process.exit(2);
	};

	doRun(makeDirs, function(){
		
		doRun(createDirStructureFile, function(){
			
			for(var i in subTasks){

				doRun(subTasks[i].exec, doSucceed, doFail, subTasks[i].options);
				
			}
		
		}, doFail);
		
	}, doFail);
	
//	spawn('node', ['build/lib/mmir-build/runDirJsonCreate.js']).done(function(){
//		...
//	}, doFail);
	
}


module.exports.help = function() {
    console.log('Usage: ' + path.relative(process.cwd(), path.join(ROOT, 'cordova', 'prepare')));// + ' [build_type]');
//    console.log('Build Types : ');
//    console.log('    \'--debug\': Default build, will build project in using ant debug');
//    console.log('    \'--release\': will build project using ant release');
//    console.log('    \'--nobuild\': will skip build process (can be used with run command)');
    process.exit(0);
}

module.exports.run();
