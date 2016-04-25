
var oncomplete = require('../nodejs/oncomplete.js');

var runner = new oncomplete();

var generator = require('./standalone-grammar-gen.js');

var isAntTarget = false;

//command line param 1: STRING 'true': if present and true, ANT build-script will be generated instead of Node.js build script
if(process.argv.length > 2){
	isAntTarget = /true/.test(process.argv[2]);
}

var callback = function(){
	runner.setCompleted();
};

generator.run(callback, isAntTarget);

module.exports.run = runner.oncomplete;
