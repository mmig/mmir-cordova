
var oncomplete = require('../nodejs/oncomplete.js');

var runner = new oncomplete();

var generator = require('./standalone-grammar-gen.js');

var callback = function(){
	runner.setCompleted();
};

generator.run(callback);

module.exports.run = runner.oncomplete;
