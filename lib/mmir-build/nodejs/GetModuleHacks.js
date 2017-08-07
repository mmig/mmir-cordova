
/**
 * HELPER function(NAME): reads files from 
 * <working dir>/build/lib/mmir-build/templates/
 * 
 * with
 *  [NAME]-prefix.template
 *  [NAME]-suffix.template
 *  
 * and returns an object
 * {
 * 	prefix: STRING | void
 * 	suffix: STRING | void
 * }
 * 
 * or VOID if neither prefix nor suffix were present.
 */


var fs = require('fs');
var path = require('path');
var sep = path.sep;


//to project's root (which contains /www, /build etc)
var rootPath = path.join(__dirname, '..', '..', '..', '..');//<- 4 steps up, since this file is located at <root>/bin/lib/mmir-build/nodejs
var moduleHacksDir = rootPath + '/build/lib/mmir-build/templates/';

var moduleHackPrefixName = '-prefix';
var moduleHackSuffixName = '-prefix';
var ext = '.template'

//name prefix for requirejs module-IDs (of mmir framework modules)
var reModuleNamePrefix = /^mmirf\//;


function getCodeHack(moduleName, hackTypeName){
	
	var name = moduleName.replace(reModuleNamePrefix, '');//remove module prefix
	var filePath = moduleHacksDir + sep + name + hackTypeName + ext;
	if(fs.existsSync(filePath)){
		return fs.readFileSync(filePath, 'utf-8');
	}
}

module.exports = function(moduleName){
	
	var hacks = {
		prefix: getCodeHack(moduleName, moduleHackPrefixName),
		suffix: getCodeHack(moduleName, moduleHackSuffixName)
	}
	
	if(!hacks.prefix && !hacks.suffix){
		return;
	}
	
	return hacks;
}
