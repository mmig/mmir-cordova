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


/**
This file serves as an entry-point to SCXMLCompiler when running under Rhino.
It accepts command-line arguments, and converts them to an options hash that it then passes into SCXMLCompiler.compile.
*/

/*
    supported options:
		backend	{switch | table | state}
		beautify	
		log
		verbose
 */

require.def("src/javascript/scxml/cgf/main",
	[ "src/javascript/scxml/cgf/SCXMLCompiler",
		"src/javascript/scxml/cgf/util/commandLine",
		"src/javascript/scxml/cgf/util/xml/rhino",
		"src/javascript/scxml/cgf/util/xsl/rhino"],
	function(SCXMLCompiler,cmdLineUtil,xmlUtil,transform){

		return function(args){

			var optionsMap = {
				backend	: { argName : "backendValue" },
				ie : true,
				noIndexOf : true,
				beautify : true,
				log : true,
				verbose :  true,
				genListenerHooks : true
			}
			var parsedOptionsMap = cmdLineUtil.parseCommandLine(optionsMap,args);
			parsedOptionsMap.inFiles = parsedOptionsMap.args.map(xmlUtil.parseFromPath);
			delete parsedOptionsMap.args;

			//TODO: parse paths in inFiles into documents
			var scArr = SCXMLCompiler.compile(parsedOptionsMap,function(scArr){
				scArr.forEach(function(sc){print(sc)});
			},transform);
		}

});
