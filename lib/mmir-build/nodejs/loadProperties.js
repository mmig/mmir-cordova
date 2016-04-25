
var fs = require('fs');
var oncomplete = require('./oncomplete.js');
var properties = require('../../nodejs-properties');

var PROPERTIES_FILE = 'mmir-build.properties';
var SETTINGS_FILE = 'mmir-build.settings';
var DEFAULT_SETTINGS_FILE = 'mmir-build.settingsDefault';

var loader = new oncomplete();
var props, _settings, isPropLoaded = false, isSettingsLoaded = false;

function processLoaded(){
	
	if(isPropLoaded && isSettingsLoaded){
		
		if(_settings) for(var name in _settings){
			
			if(_settings.hasOwnProperty(name)){
				console.log('apply setting '+name+':'+_settings[name])
				props[name] = _settings[name];
			}
		}

		loader.setCompleted(props);
	}
	
}

properties.parse(PROPERTIES_FILE, {path: true, variables: true}, function(error, config){
		
	if(error){
		throw error;
	}
	
	props = config;
	isPropLoaded = true;
	
	processLoaded();
});

var _onLoadSettings = function(error, settings){
	
	//NOTE only print message, if loading the settings fails (i.e. continue with default settings)
	if(error){
		console.info('[WARNING] Could not load settings: '+error);
	} else {
		_settings = settings;
	}
	isSettingsLoaded = true;
	processLoaded();
}

var settingsFile;
fs.stat(SETTINGS_FILE, function(error, stat){
	
	if(error){
		
		fs.stat(DEFAULT_SETTINGS_FILE, function(error, stat){
			
			if(error){
				
				_onLoadSettings(error);
				
			} else {
				properties.parse(DEFAULT_SETTINGS_FILE, {path: true, variables: true}, _onLoadSettings);
			}
		});
		
	} else {
		properties.parse(SETTINGS_FILE, {path: true, variables: true}, _onLoadSettings);
	}
	
});



module.exports.onloaded = loader.oncomplete;
