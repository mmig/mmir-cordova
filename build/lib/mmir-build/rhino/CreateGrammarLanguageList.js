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


/* NOTE:
 * This script is required to run in Rhino environment.
 * Arguments:
 * [1] LANGUANGE_BASE_DIR
 *     e.g.:
 *     ./www/config/languages/
 * [2] GRAMMAR_FILE_NAME
 *     e.g.:
 *     grammar.json
 * [3] DIRECTORY_LIST_FILE
 *     e.g.:
 *     ./www/config/directories.json
 * 
 * 
 * Script for generating a String that contains a comma-separated list
 * of language codes.
 * The list contains only language code, for which a JSON-grammar file can be found
 * in the respective config/language directory.
 * 
 * The script requires the input produced by AntScriptFileListGenerator.js in 
 * env-variable ${JSONDirString}, that is a "stringified" JSON-object 
 * containing the directory-structure:
 * 
 * This script, then searches for the entry of the "/config/languages" 
 * (from env-variable ${grammarDefinitionJsonDir} ) entry which
 * contains the sub-direcotries for all languages.
 * Then the entries for the found languages are scanned, if they contain a grammar-JSON file
 * (which's name is taken form env-variable ${grammarDefinitionJsonFile}). 
 * 
 *   TODO REFACTOR extract common code base for nodejs & rhino
 * 
 */

importClass(java.io.File);
importClass(java.io.FileInputStream);
importClass(java.io.InputStreamReader);
importClass(java.io.BufferedReader);

var theArguments = arguments;
var baseLanguageDir				= theArguments && theArguments.length > 0? theArguments[0] : null;
var grammarFileName 			= theArguments && theArguments.length > 1? theArguments[1] : null;
var dirListFile					= theArguments && theArguments.length > 2? theArguments[2] : null;

function printResult(resultStr){
	print(resultStr);
}

function readfile(path){
	
	var f = new File(path);
	
	if(f.exists() === false){
		throw new Error('error reading file '+path+': file does not exist!');
	}
	
	var r = new BufferedReader(new InputStreamReader( new FileInputStream(f), 'UTF-8'));
	var buf = java.lang.reflect.Array.newInstance(java.lang.Character.TYPE, 256);
	var len = 0;
	var res = [];
	while ((len = r.read(buf)) !== -1) {
		res.push(new java.lang.String(buf, 0, len));
	}
	r.close();
	
	return res.join('');
}

var strDirList = readFile(dirListFile);

var jsonDirList;
//try to avoid eval() -> use JSON if available
if(typeof JSON !== 'undefined'){
	jsonDirList = JSON.parse(strDirList);
}
else {
	jsonDirList = eval('var dummy='+strDirList+';dummy');
}

var contains = function(array, entry){
	for(var i=0, size = array.length; i < size; ++i){
		if(array[i]==entry){
			return true;
		}
	}
	return false;
};


var result = [];

for(var prop in jsonDirList){
	var len = (""+baseLanguageDir).length - prop.toString().length - 1;
	if( baseLanguageDir.indexOf(prop) === len){
		var list = jsonDirList[prop];
		for(var i=0, size = list.length; i < size; ++i){
			var langSubDir = list[i];
			var dir = prop+'/'+langSubDir;
			
			if(typeof jsonDirList[dir] !== 'undefined'){
				var content = jsonDirList[dir];
				if(contains(content, grammarFileName)){

					result.push(langSubDir);
				}
			}
		}
	}
}

//print result/language-list
printResult(result.join(','));
