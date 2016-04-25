
var Dependo = require('dependo'),
 	esprima = require('esprima'),
 	fs = require('fs');

//path that will be parsed for dependencies
var targetPath = './';//use './' if running form root of mmirf-directory; e.g. if running from root of /www, use './mmirf'
//path to the (temp) config-file that will by used for dependency parsing
var configPath = 'dep-req-config.js';
//the basePath to the mmirf-directory
var baseUrl = '';//use '' if running from root of mmirf-directory; e.g. if running from root of /www, use './mmirf'
var outputPath = 'dep.html';
var options = {
		format: 'amd',
		requireConfig: 'dep-req-config.js',
		exclude: '^node_modules|^vendor|^dep-',
//		onParseFile: ,
		findNestedDependencies: true,
		title: 'MMIR Framework Dependencies (v3.6)'
};


//optional command-line arguments
//1. basePath (OPTIONAL)	the path to the mmir-lib directory (default: '')
//2. targetPath (OPTIONAL)	the path that will be parsed for dependencies (default: './')
//3. configPath (OPTIONAL)	the path to the temporary requirejs config (used for dependency parsing)
//3. outputPath (OPTIONAL)	the output path for creating the HTML file
var arguments = process.argv;
var argslen = arguments.length;
if(argslen >= 2){
	baseUrl = arguments[2];
	console.log('non-default basePath: "'+baseUrl+'"');
}
if(argslen >= 3){
	targetPath = arguments[3];
	console.log('non-default targetPath: "'+targetPath+'"');
}
if(argslen >= 4){
	configPath = arguments[4];
	console.log('non-default configPath: "'+configPath+'"');
}
if(argslen >= 5){
	outputPath = arguments[5];
	console.log('non-default outputPath: "'+outputPath+'"');
}

//HELPER find identifier >reqPropName< in parsing >data<
//       and return the range (in the parsed string) for its value-definition.
function getReqireConfigObject(data, reqPropName){
	var obj;
	for(var p in data){
		obj = data[p];
		if(obj === reqPropName){
			
			return obj;
			
		} else if(typeof obj === 'object'){
			
			if(obj !== null){
				obj = getReqireConfigObject(obj, reqPropName);
				if(obj){
					if(typeof data.init === 'object' && data.init !== null){
						return data.init.range;
					}
					return obj;
				}
			}
			
		}
		
	}
}

//HELPER extract & create require-config call from framework's mainConfig.js (i.e. >mmirfMainConfig<)
//       ... and adjust >baseUrl< in require-config
//       -> writes extracted require-config to file >configPath<
function createRequireConfig(mmirfMainConfig, configPath,  baseUrl){
	
	var requireConfigPropName = 'mmirf_config';
	
	//read mmirf mainConfig.js and parse as JavaScript
	var reqConfig = fs.readFileSync(mmirfMainConfig, 'utf8');
	var parsedConfig = esprima.parse(reqConfig, {range: true});

	//get index/range for the requirejs-config property within mainConfig.js:
	var reqRange = getReqireConfigObject(parsedConfig, requireConfigPropName);
	//... and extract the corresponding string:
	var reqConfigStr = reqConfig.substring(reqRange[0], reqRange[1]);
	
	//fix/set base URL for dependency calculation (use baseUrl = '', when executed from within mmirf directory)
	var reqConfigObj = eval('dummy = ' + reqConfigStr +'; dummy');
	reqConfigObj.baseUrl = baseUrl;
	reqConfigStr = JSON.stringify(dummy, null, 4);
	
	var reqStr = 'require.config(' + reqConfigStr + ');';

	fs.writeFileSync(configPath, reqStr, 'utf8');
}

//HELPER wrap source code as AMD module
function wrapAsModule(str, deps){
	
	var depsStr;
	if(deps){
		var list = [];
		for(var p in deps){
			if(deps.hasOwnProperty(p)){
				list.push(deps[p]);
			}
		}
		depsStr = JSON.stringify(list) + ', ';
	} else {
		depsStr = '';
	}
	
	return '\ndefine('+depsStr+'function(){\n\n' + str + '\n\n});';
}

//extract dependencies from "simple" require calls, i.e. sync'ed/non-deps-list call like
//		require('dep')
function extractSimpleReqCalls(str){
	
	var deps = {}, re = /require\s*\(\s*('([^']+)'|"([^"]+)")/g, len = 0, match;
	
	while((match = re.exec(str))){
		if(match[2]){
			++len;
			deps[match[3]] = match[2];
		}
		if(match[3]){
			++len;
			deps[match[3]] = match[3];
		}
	}
	
	return len > 0? deps: void(0);
}

//src-modifier: fix source code, so that dependencies get detected
//	-> used in options.onParseFile
function fixImportScript(file){//{filename: STRING, src: STRING}
	
	var fileName = file.filename.replace(__dirname, '').replace(/\\/gm, '/');
	fileName = fileName.replace(/^\//, '');
	
	//convert importScripts() to require()
	if(/importScripts\s*\(/g.test(file.src)){
		
		console.log('detected importScript for '+fileName);
		
		if(/^workers\//i.test(fileName)){
			
			if(/importScripts\s*\(\s*'/g.test(file.src)){
				file.src = file.src.replace(/importScripts\s*\(\s*(')([^']+)(')/g, function(match, p1, p2, p3){
					return 'require(' + p1 + 'workers/' + p2.replace(/\.js$/i, '') + p3;
				});	
			}
			
			if(/importScripts\s*\(\s*"/g.test(file.src)){
				file.src = file.src.replace(/importScripts\s*\(\s*(")([^"]+)(")/g, function(match, p1, p2, p3){
					return 'require(' + p1 + 'workers/' + p2.replace(/\.js$/i, '') + p3;
				});
			}
			
		}
		file.src = wrapAsModule(file.src.replace(/importScripts\s*\(/g, 'require('));	
		
	}

	if(/^env\/media\//i.test(fileName)){
		
//		//"pull-up" simple require-calls (these seem to to not get detected otherwise)
//		deps = extractSimpleReqCalls(file.src);
		
		file.src = wrapAsModule(file.src);//, deps);
	}
	
	//"convert" any non-modules to modules
	// NOTE: this may fail to detect, if a script is not a module (i.e. if there is any "define(" contained, but script itself is not a module)
	if(!/define\s*\(/g.test(file.src)){
		file.src = wrapAsModule(file.src);
	}
			
	
	return file;
};

var origConfigPath = (baseUrl? baseUrl + '/' : '') + 'mainConfig.js';
console.log('orig conf: '+origConfigPath);
createRequireConfig(origConfigPath, configPath, baseUrl);
options.requireConfig = configPath;
options.onParseFile = fixImportScript;

var dependo;
try {
	
	dependo = new Dependo(targetPath, options);

	var html = dependo.generateHtml();

	//console.log(html);

	fs.writeFileSync(outputPath, html, 'utf8');
	
} catch(err){
	console.error(err.message + ', line '+ err.line + ', col '+ err.col + ', pos '+ err.pos + '\n\t' + err.stack + '\n', err);
}

