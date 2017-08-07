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
 * This script is required to run in Node.js environment.
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
 * The script requires the path to the directory.json file
 * (i.e. output produced by CreateFileListGenerator.js) as an argument, which 
 * contains the directory-structure:
 * 
 * This script, then searches for the entry of the "/config/languages" 
 * which contains the sub-directories for all languages.
 * Then the entries for the found languages are scanned, if they contain a grammar-JSON file
 * (which's name is given by argument grammarFileName). 
 * 
 * 
 */

var theArguments = process.env.callParams || process.argv;
var baseLanguageDir				= theArguments && theArguments.length > 2? theArguments[2] : null;
var grammarFileName 			= theArguments && theArguments.length > 3? theArguments[3] : null;
var dirListFile					= theArguments && theArguments.length > 4? theArguments[4] : null;


var createLanguageList = require('./createLanguageList.js');

var langList = createLanguageList.create(baseLanguageDir, grammarFileName, dirListFile, false);

function printResult(resultStr){
	console.log(resultStr);
}

//print result/language-list
printResult(langList.join(','));
