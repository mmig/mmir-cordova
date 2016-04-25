

var generateViews = require('./../nodejs/generateViews.js'),
	oncomplete = require('./../nodejs/oncomplete');

var options = {force: true, debug: true};

var runner = new oncomplete();

generateViews.run(function(){
	console.log('------------------- finished views generation! -------------------');
	runner.setCompleted();
}, options);

module.exports.run = runner.oncomplete;
