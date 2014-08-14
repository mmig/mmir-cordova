/**
This is a simple script, not a proper js module, which is used to bootstrap the build process for the RequireJS
build system.
It's different from runner.js in that the path to the main module is hardcoded, which is needed for RequireJS
*/


(function(args){
	require(
		["src/javascript/scxml/cgf/main"],
		function(main){
			main(args);
		}
	);
})(Array.prototype.slice.call(arguments));
