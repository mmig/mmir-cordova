
var createDirJson = require('./../nodejs/createDirJson.js'),
	oncomplete = require('./../nodejs/oncomplete');

var runner = new oncomplete();

createDirJson.run(function(){
	console.log('----------------- created JSON file containing directory structure! -------------------');
	runner.setCompleted();
});

module.exports.run = runner.oncomplete;
