
var child_process = require('child_process');

var libPath = 'build/lib/mmir-build/generator/';
var scripts = [libPath + 'build-standalone-grammar-gen.js', libPath + 'build-standalone-view-gen.js'];

var count = 0;
var size = scripts.length;
var child, args;
for(var i=0; i < size; ++i){

	args = [scripts[i], 'true']; 
	child = child_process.spawn('node', args, {stdio: 'inherit'});
	child.on('exit', function(code) {
		
		++count;
        if (code) {
            console.error('Error code ' + code + ' for command: node');// with args: ' + args);
        } else {
        	
        	if(count === size){
        		console.log('-------------------- Finished creating ANT build scripts ----------------');
        	}
        }
    });
}
		