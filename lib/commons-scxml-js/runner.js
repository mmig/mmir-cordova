/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



//evil things happen if we do not make this global
//default xml namespace = "http://www.w3.org/2005/07/scxml";


(function(){
/*
this is the top-level script, which serves as an entry-point when run from the command-line under rhino
it can be used to call the build.js build script, or to run the compiler directly
it is responsible for 
	bootstrapping the dojo module system when running under rhino
	parsing command-line arguments into a js object

In general, this script is used as follows:
main.js <absolute path to directory where script is executing> <module to import> <class to instantiate> <method to call on class instance> <command-line args to pass into method call>

the question is, do I make this general, or specific? If I make it general, then we either need to put a lot of information into the command-line options, or use general interfaces on the objects (e.g. SCXMLCompiler.main)... 
Then, there is the fact that it's not clear we should create SCXMLCompiler instances... a singleton would be more appropriate... which could be done fairly easily, by just instantiating him, and assigning his intance to where his class was. This could be done in the SCXMLCompiler module. Pretty easy.  
The only reason we're using dojo.declare as well is to set up the namespace. I'm not a big fan of that namespace-setting up code...
On the other hand, I'm not a big fan of dojo.declare
We could give them a standard interface, a method called main. But then it would maybe make sense to pass a stringlist, as opposed to a kwArgs. 
But that's not so bad... although, actually, build would prefer a stringlis, as opposed to a kwArgs. Because build just wants a list of tasks.  
I guess we could make it so that main takes an options kwArgs, and then a list of targets as well...
*/


function prepareArguments(args){
	var toReturn = [];
	//skip the first two args, and put him in a real js array:w
	for(var i = 2; i < args.length; i++){
		toReturn[i-2] = args[i];	
	}
	return toReturn;
}

if(arguments.length){
	var preparedArguments = prepareArguments(arguments);

	//if we only have one big argument with at least one space in it, assume we're being called by ant or maven, 
	//which, due to passing multiple args in as -D"arg1 arg2 arg3", shows up here as one big string with spaces 
	if(preparedArguments.length == 1 && preparedArguments[0].search(" ")){
		preparedArguments = preparedArguments[0].replace(/^\s+|\s+$/g, '').split(/ +/); 
	}

	var absoluteScriptDir = arguments[0];
	var mainFunction = arguments[1]; 

	//make sure we have an absolute path to the script directory, as a relative path can mess dojo up
	//var scriptDirFile = new java.io.File(scriptDir);
	//var absoluteScriptDir = scriptDirFile.getAbsolutePath();

	//may need this later for unit testing
	var pathToDojoBase = absoluteScriptDir + "/lib/test-js/dojo-release-1.4.2-src/dojo/";
	//var pathToDojo = pathToDojoBase + "dojo.js";

	//this is a bit weird, but we define this here in case we need to load dojo later using the RequireJS loader
	djConfig = {
		"baseUrl" : pathToDojoBase 
	}


	var pathToRequireJsDir = absoluteScriptDir + "/lib/js/requirejs/";

	load(pathToRequireJsDir + "require.js");
	load(pathToRequireJsDir + "require/rhino.js");
	load(pathToRequireJsDir + "require/text.js");
	load(pathToRequireJsDir + "require/xml.js");
	
	//bootstrap require.js
	require({
		baseUrl : absoluteScriptDir 	//fixme: needs absolute path?  
		},
		[mainFunction],
		function(fn){
			fn(preparedArguments);
		}
	);

}

}).apply(this,arguments);
