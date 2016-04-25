
var generateGrammars = require('./../nodejs/generateGrammars.js'),
	oncomplete = require('./../nodejs/oncomplete');

var options;// = {force: true, debug: true};//, engine: 'pegjs'};

var runner = new oncomplete();

generateGrammars.run(function(){
	console.log('------------------- finished grammar generation! -------------------');
	runner.setCompleted();
}, options);

module.exports.run = runner.oncomplete;
