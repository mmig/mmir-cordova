/*
 * 	Copyright (C) 2012-2013 DFKI GmbH
 * 	Deutsches Forschungszentrum fuer Kuenstliche Intelligenz
 * 	German Research Center for Artificial Intelligence
 * 	http://www.dfki.de
 * 
 * 	Permission is hereby granted, free of charge, to any person obtaining a 
 * 	copy of this software and associated documentation files (the 
 * 	"Software"), to deal in the Software without restriction, including 
 * 	without limitation the rights to use, copy, modify, merge, publish, 
 * 	distribute, sublicense, and/or sell copies of the Software, and to 
 * 	permit persons to whom the Software is furnished to do so, subject to 
 * 	the following conditions:
 * 
 * 	The above copyright notice and this permission notice shall be included 
 * 	in all copies or substantial portions of the Software.
 * 
 * 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
 * 	OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
 * 	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * 	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
 * 	CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * 	TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
 * 	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * Initializer for Standalone Template Parser script (StandaloneTemplateParserExec.js)
 * in Rhino environment.
 * 
 */


//disable console-output during "initialization"
// -> re-enable before actually running the parser
consoleLogImpl = console.log; 
console.log = function(){};
consoleDebugImpl = console.debug; 
console.debug = function(){};

//retrieve command-line argument for assets-path -> create base-path
var theBasePath =      arguments && arguments.length > 0? arguments[0] : '';
var theLibPath  =      arguments && arguments.length > 1? arguments[1] : '';
var theAppSubDirPath = arguments && arguments.length > 2? arguments[2] : 'www';

theBasePath += theAppSubDirPath;
if(!/\/$/.test(theBasePath)){
	theBasePath += '/';
}

forBrowser = theBasePath;

IS_DEBUG_ENABLED = false;
isDebugOutput = false;

//initialize requirejs
load('build/lib/r.js');//FIXME use: ${buildDirLib}r.js

////STUB need requirejs' define() as definejs() in NodeJS environment,
////   since NodeJS has its own require() / define() functions
////(for Rhino: just "copy" requirejs' define into definejs)
var definejs = define;
require.define = define;

var requiren = require;

module = {};

jqueryDeferredModuleUri = 'lib/jquery-deferred';
jqueryDeferred = null;

require(['./build/lib/nodejs-jquery-deferred/lib/jquery-core.js'], function(jqcore){
	definejs('jquery-core.js', ['module'], function(){ return jQuery;});
	require(['jquery-core.js', './build/lib/nodejs-jquery-deferred/lib/jquery-callbacks.js'], function(jqcallbacks){
		definejs('jquery-callbacks.js', ['module'], function(){ return jQuery;});
		require(['jquery-callbacks.js','./build/lib/nodejs-jquery-deferred/lib/jquery-deferred.js'], function(){
			
			definejs(jqueryDeferredModuleUri, ['module'], function(){ return jQuery;});
			require([jqueryDeferredModuleUri], function(){ jqueryDeferred = jQuery; return jQuery;});
		});
	});
});
