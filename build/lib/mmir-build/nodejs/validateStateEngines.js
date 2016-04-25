
var validateScxmls = require('./../nodejs/scxmlValidator.js'),
	oncomplete = require('./../nodejs/oncomplete'),
	props = require('./../nodejs/loadProperties.js'),
	getBool = require('./extractboolean.js');

var nl = '\n';

var onConfig = new oncomplete();

function _get(config, name, defaultValue){
	
	if(typeof config[name] !== 'undefined'){
		return getBool(typeof config[name])
	}
	return defaultValue;
}

function _createErrMsg(errorList){
	
	var msg = ['Error validating SCXML files: ',nl];
	for(var i in errorList){
		msg.push(errorList[i].toString());
	}
	
	return msg.join(nl);
}

function _run(config, listener, options){
	
	var fileList = [];
	//fileList.push('www/config/statedef/test.xml', 'www/config/statedef/inputDescriptionSCXML.xm', 'www/config/statedef/dialogDescriptionSCXML.xml');

//	<property name="file.in.DialogEngine"  location="${SCXMLDialogEngineDir}${SCXMLDialogEngineXMLFile}" />
//	<property name="file.in.InputEngine"   location="${SCXMLInputEngineDir}${SCXMLInputEngineXMLFile}" />
	var scxmlDialogEngine = config.SCXMLDialogEngineDir + config.SCXMLDialogEngineXMLFile;
	var scxmlInputEngine = config.SCXMLInputEngineDir + config.SCXMLInputEngineXMLFile;
	
	options = options || {};
	
//	#ignoreDialogEngineCompilation=true
//	#ignoreInputEngineCompilation=true
	
	
	var isIgnoreDialog = false;
	if(typeof options.ignoreDialogXml === 'undefined'){
		
		//DEPRECATED ignoreDialogEngineCompilation: use ignoreDialogEngineValidation instead!
		isIgnoreDialog = _get(config, 'ignoreDialogEngineCompilation', isIgnoreDialog);

		isIgnoreDialog = _get(config, 'ignoreDialogEngineValidation', isIgnoreDialog);
	}
	
	if(!isIgnoreDialog){
		fileList.push(scxmlDialogEngine);
	}
	
	var isIgnoreInput = false;
	if(typeof options.ignoreInputXml){

		//DEPRECATED ignoreInputEngineCompilation: use ignoreInputEngineValidation instead!
		isIgnoreInput = _get(config, 'ignoreInputEngineCompilation', isIgnoreInput);
		
		isIgnoreInput = _get(config, 'ignoreInputEngineValidation', isIgnoreInput);
	}
	
	if(!isIgnoreInput){
		fileList.push(scxmlInputEngine);
	}
	
	if(fileList.length === 0){
		return runner && runner.setCompleted();
	}
	
	console.log('validating '+ fileList.join(', '));
	
	var opt = {files: fileList, allowScriptReturn: true};
	
	var runner;
	if(listener){
		runner = new oncomplete();
		runner.oncomplete(listener);
	}
	
	validateScxmls.run(function(err){
		
		if(err && options.throwError){
			var error = new Error(_createErrMsg(err));
			error.errors = err;
			throw error;
		}
		
		runner && runner.setCompleted(err);
		
	}, opt);
	
}

props.onloaded(function(config){
	onConfig.setCompleted(config);
});

module.exports.run = function(listener, options){
	
	onConfig.oncomplete(function(config){
		_run(config, listener, options)
	});
	
};
