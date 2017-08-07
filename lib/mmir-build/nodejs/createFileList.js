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
 * Script for generating a JSON formatted String
 * of a file-list.
 *
 *
 * example (reformatted for better readability; the result is actually a String, not a JSON object!):
<pre>{
	"/controllers" : ["application.js", "calendar.js"],
	"/views" : ["application", "calendar", "layouts"],
	"/views/application" : ["login.ehtml", "registration.ehtml", "welcome.ehtml", "~languagemenu.ehtml"],
	"/views/calendar" : ["create_appointment.ehtml"],
	"/views/layouts" : ["application.ehtml"],
	"/models" : ["calendarmodel.js", "user.js"],
	"/config" : ["languages", "statedef", "configuration.json", "directories.json"],
	"/config/languages" : ["de", "en"],
	"/config/languages/de" : ["dictionary.json", "grammar.json", "speech.json"],
	"/config/languages/en" : ["dictionary.json", "speech.json"],
	"/config/statedef" : ["dialogDescriptionSCXML.xml", "dialogDescriptionSCXML.xml.MD5", "inputDescriptionSCXML.xml", "inputDescriptionSCXML.xml.MD5", "readme.txt"],
	"/helpers" : ["applicationHelper.js"]
}</pre>
 *
 */

var fs = require('fs');
var sep = require('path').sep;


/**
 * HELPER get contents of dir (files and sub-dirs)
 */
function getDir(dir){

	if(fs.existsSync(dir))
		return fs.readdirSync(dir);
	else {
		console.error('  WARNING Cannot read MMIR resource directory, because it does not exist: '+dir);
		return [];
	}
}

/**
 * HELPER get list-String for files OR for sub-directories (entries are separated by a semicolon ;)
 * @param dir
 * 			the directory
 * @param list
 * 			the list of files and sub-directories for dir
 * @param isGetFiles
 * 			if TRUE, returns list of files; otherwise list of sub-dirs
 * @param [filter]
 * 			a RegExpr: only include file / sub-dirs which's names match the RegExpr
 * 			DEFAULT: filter hidden files / sub-dirs (i.e. names starting with a dot)
 * @returns
 */
function getListForDir(dir, list, isGetFiles, filter){

	if (list == null){
		return null;
	}

	var result = [];
	var re;
	if(filter){
		re = RegExp(filter);
	} else {
		//default filter: ignore hidden files / directories (i.e. starting with dot)
		re = /^[^.]/;
	}

	var inf;
	for(var i=0,size=list.length; i < size; ++i){
		inf = fs.statSync(dir + sep +list[i]);
		if((isGetFiles && inf.isFile()) || (!isGetFiles && inf.isDirectory())){

			if(re.test(list[i])){
				result.push(list[i]);
			}
		}
	}

	return result.join(';');
}

function getFileListForDir(dir, list, filter){

	return getListForDir(dir, list, true, filter);

}

/**
 * Generates a List of directories for a given directory
 */
function getDirListForDir(dir, list, filter){

	return getListForDir(dir, list, false, filter);
}

/**
 * Generates JSON-String from dir and fileString:
 *  * by splitting the string at ";" and creating a JSON string entry
 *  * normalizing path separators to "/"
 *
 * @param dir
 * 			e.g. "/controllers"
 * @param fileString
 * 			e.g. "application\\login.ehtml;application\\registration.ehtml"
 *
 * @returns the JSON string entry for dir and fileString
 * 			e.g. "\"/controllers\":[\"application/login.ehtml\",\"application/registration.ehtml\"]"
 */
function getJSONFromFileList(dir, fileString){
	// split fileString to array
	var fileArray = fileString.split(";");
	var dirString = dir+'';
	//normalize path separators to "/"
	dirString = "/" + dirString.replace(/\\/g, "/");
	// create JSON-Element/Property with dir as name and an array as value
	var jsonString = '"'+dirString+'":[';

	var boolFirst = true;
	for (var i=0,size=fileArray.length; i<size;i++){

		if(!fileArray[i]){
			continue;
		}

		if (boolFirst === false){
			jsonString = jsonString + ',';
		} else {
			boolFirst = false;
		}

		jsonString = jsonString + '"' + fileArray[i] + '"';
	}
	jsonString = jsonString+']';

	return jsonString;
}

function parseDirectoriesRecursively(basedir,dir){

	var targetDir = basedir+dir;
	var list = getDir(targetDir);
	var subDirList = getDirListForDir(targetDir, list);
	var filelist = getFileListForDir(targetDir, list);

	//create JSON entry for directory:
	//
	//		"dir-name" : [<list of dir contents, i.e. sub-dirs and files>]
	//
	var jsonFileContents = getJSONFromFileList(dir, subDirList + ';' + filelist );

	//process the sub-directories
	var dirlistArray = subDirList.split(";");
	for (var j=0; j<dirlistArray.length;j++){
		if (dirlistArray[j]){
			jsonFileContents = jsonFileContents + ",";
			jsonFileContents = jsonFileContents + parseDirectoriesRecursively(basedir, dir+sep+dirlistArray[j]);
		}
	}
	return jsonFileContents;
}

module.exports.create = function(basedir, directoriesToParse, callback){

	// parse comma-separated list with directories to search
	var directoriesToParseArray = directoriesToParse.split(",");

	var JSONDirString = "{";

	for (var i=0,size=directoriesToParseArray.length; i < size; ++i){
		if (i > 0){
			JSONDirString = JSONDirString + ',';
		}
		JSONDirString = JSONDirString + parseDirectoriesRecursively(basedir, directoriesToParseArray[i]);
	}
	JSONDirString = JSONDirString + "}";

	return JSONDirString;
};
