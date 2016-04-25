/**
 * HELPER for converting requirejs shims into AMD modules:
 * 
 * reads the MMIR framework's requirejs config and tries to convert all shim-entries
 * to a AMD modules and stores them at buildUrl (/build/lib/mmir-build/mod/), appending
 * the suffix "_amd" to file name.
 * 
 * 
 */

var path = require('path'),
	fs = require('fs');

var esprima = require('./../../nodejs-esprima');

//HELPER for retrieving the requirejs config object 
//(extracts the corresponding variable within the JavaScript config-file)
var getConfig = require('./../nodejs/GetRequirejsConfig.js');

//HELPER for retrieving module-HACKS: either to prepend or append to the module code
//-> use the module-id from the requirejs config
//-> the HACKS are located in the templates directory:
//  * for prepending stored in file: <module name>-prefix.template
//  * for appending stored in file: <module name>-suffix.template
var getModuleHacks = require('./../nodejs/GetModuleHacks.js');

//to project's root (which contains /www, /build etc)
var rootPath = path.join(__dirname, '..', '..', '..', '..');//<- 4 steps up, since this file is located at <root>/bin/lib/mmir-build/nodejs

//path to the mmir framework (from project's root)
var baseUrl = rootPath + '/www/mmirf/';
var configFileName = 'mainConfig.js';
//path where the "converted shims", i.e. AMD modularized versions of the libraries should be stored
var buildUrl = rootPath + '/build/lib/mmir-build/mod/';

//newline char/String that will be used when creating the AMD modules
var nl = '\n';


///////////////////////////////// start conversion code: //////////////////////////////////

var config = getConfig(baseUrl + configFileName);

//console.log(config.shim);

var getInitArgsList = function(parsedFunc){
	
	//NOTE the parsed function was prefixed with "var init = "
	// -> the function will be available at parsedFunc.body.declarations...
	var params = parsedFunc.body[0].declarations[0].init.params;
	
	var list = [];
	for(var i=0,size=params.length; i < size; ++i){
		list.push(params[i].name);
	}
	
	return list;
};

var getInitCode = function(parsedFunc, funcStr){
	
	//NOTE the parsed function was prefixed with "var init = "
	// -> the function will be available at parsedFunc.body.declarations...
	var funcBody = parsedFunc.body[0].declarations[0].init.body.body;
	var size = funcBody.length;
	
	if(size > 0){
		
		var start = funcBody[0].range[0];
		var end = funcBody[size-1].range[1];

		return funcStr.substring(start, end);
	}
	
	return '';
};

var hasInitExports = function(parsedFunc){
	
	//NOTE the parsed function was prefixed with "var init = "
	// -> the function will be available at parsedFunc.body.declarations...
	var funcBody = parsedFunc.body[0].declarations[0].init.body.body;
	
	for(var i=0,size=funcBody.length; i < size; ++i){
		if(funcBody[i].type = 'ReturnStatement'){
			
			//TODO verify/check, if this is the last (non-comment) entry?
			return true;
		}
	}
};

var wrapAsModule = function(name, deps, code, exports, depArgNames, initCode){
	
	//console.log('wrappping module ', name, ' with dependencies ', deps, ', exports ', exports, ', depNames '+ depArgNames, ', initCode ' + initCode);
	
	var depArray = '';
	var depArgs = '';
	
	var preModuleCode = '';
	
	if(deps){
			depArray = '[\'' +  deps.join('\', \'') + '\'], ';
			depArgs = depArgNames? depArgNames.join(', ') : deps.join(', ');
	}
	
	if(exports){
		exports = nl+'return '+exports+';'+nl;
	} else {
		exports = '';
	}
	
	var moduleHacks = getModuleHacks(name);
	if(moduleHacks){
		
		if(moduleHacks.prefix){
			preModuleCode = nl + moduleHacks.prefix + nl;
		}
		
		if(moduleHacks.suffix){
			exports = nl + moduleHacks.suffix + nl + exports;
		}
	}
	
	if(initCode){
		exports = nl+ initCode + nl + (exports? exports + ';' + nl : '');
	}
	
	return nl +'define('+depArray+'function('+depArgs+'){' + nl + preModuleCode + nl + code + nl + exports + nl + '});' + nl;
};

var getAsModule = function(name, shim, code){
	
	//EXAMPLE shim-object:
//	{
//		ES3Lexer: { deps: [ 'antlr3' ], exports: 'ES3Lexer' },
//		jqm: [ 'jquery' ],
//	    ...
//	}
	
	if(Array.isArray(shim)){
		shim = {deps: shim};
	}
	
	var argNames;
	if(shim.init){
		
		var funcStr = 'var init = ' + shim.init.toString();
		var parsedInit = esprima.parse(funcStr, {range: true});
//		console.log(JSON.stringify(parsedInit, null, 4));
		
		argNames = getInitArgsList(parsedInit);
		
		if(shim.exports && hasInitExports(parsedInit, funcStr)){
			shim.exports = '';
		}
		
		shim.init = getInitCode(parsedInit, funcStr);
	}
	
	return wrapAsModule(name, shim.deps, code, shim.exports, argNames, shim.init);
};

for(var name in config.shim){
	
	var shim = config.shim[name];
	var uri = config.paths[name];
	
	var fileName = path.basename(uri);
	
	var filePath = baseUrl + uri + '.js';
	var outPath = buildUrl + fileName + '_amd.js';
	
	var code = fs.readFileSync(filePath, 'utf-8');
	
	code = getAsModule(name, shim, code);
	
	console.log('writing converted AMD module to '+outPath);
	fs.writeFileSync(outPath, code, 'utf-8');
	
}
