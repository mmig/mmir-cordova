
var getMmirReqireConfig = (function(){

var fs = require('fs'),
	esprima = require('./../../nodejs-esprima');

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

//HELPER extract require-config object from framework's mainConfig.js (i.e. >mmirfMainConfig<)
return function createRequireConfig(mmirfMainConfig){
	
	var requireConfigPropName = 'mmirf_config';
	
	//read mmirf mainConfig.js and parse as JavaScript
	var reqConfig = fs.readFileSync(mmirfMainConfig, 'utf8');
	var parsedConfig = esprima.parse(reqConfig, {range: true});

	//get index/range for the requirejs-config property within mainConfig.js:
	var reqRange = getReqireConfigObject(parsedConfig, requireConfigPropName);
	//... and extract the corresponding string:
	var reqConfigStr = reqConfig.substring(reqRange[0], reqRange[1]);
	
	//get as object (cannot use JSON.parse, since it is a PlainObject, but not a JSON object)
	var reqConfigObj = eval('dummy = ' + reqConfigStr +'; dummy');
	
	return reqConfigObj;
};

})();

if(typeof module !== 'undefined'){
	module.exports = getMmirReqireConfig;
}
