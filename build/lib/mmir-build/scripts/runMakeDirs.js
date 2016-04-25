
var makeDirs = require('./../nodejs/makeDirs.js'),
oncomplete = require('./../nodejs/oncomplete');

var runner = new oncomplete();

makeDirs.run(function(){
	console.log('------------------- finished creating directories! -------------------');
	runner.setCompleted();
});

module.exports.run = runner.oncomplete;
