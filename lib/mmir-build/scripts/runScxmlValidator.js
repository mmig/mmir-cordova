
var validateScxmls = require('./../nodejs/validateStateEngines.js'),
	oncomplete = require('./../nodejs/oncomplete'),
	props = require('./../nodejs/loadProperties.js');


//TODO get file-list from command line
var options;// = {throwError: true};

var runner = new oncomplete();

validateScxmls.run(function(err){
	err? console.error('FAILED: '+err) : console.log('SUCCESS: SCXML files are VALID.');
	console.log('------------------- finished validating SCXML files! -------------------');
	runner && runner.setCompleted();
}, options);

module.exports.run = runner.oncomplete
