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

/**
 * Standalone script for generating the parsing-code for the semantic/SemanticInterpreter:
 *  * read grammar definition in JSON format
 *  * generate JSCC grammar from JSON definition, and compile it to parser code
 *  * store parser code into >theCompiledGrammarTargetPath< (e.g. "gen/grammar.js", see build.settings)
 */

var compiledParser;
var compileCount = 0;

var IS_DEBUG_ENABLED = true;

var theJSONGrammarDir 			= theJSONGrammarPath;
var theJSONGrammarFile			= theJSONGrammarFileName;
var theJSONGrammarLanguage 		= theJSONGrammarLanguageStr;
var theCompiledOutputPath 		= theCompiledGrammarTargetPath;
var theCompiledOutputFileName 	= theCompiledGrammarTargetFileName;

//var checksumUtils = mobileDS.ChecksumUtils.init();
checksumUtils.getFileExt();

var semanticInterpreter = require('mmirf/semanticInterpreter');

var theGrammarGenerator 		= typeof theGrammarEngine !== 'undefined' && theGrammarEngine? theGrammarEngine : void(0);

function _setGrammarEngine(theGrammarEngine, theGrammarGenerator){
	
	//try to retrieve setting for grammar-engine from app's config (i.e. www/config/configuration.json)
	var configManager;
	if(typeof theGrammarEngine !== 'string'){
		if(!configManager)
			configManager = require('mmirf/configurationManager');
		theGrammarGenerator = configManager.get('grammarCompiler');
	}
	
	if(theGrammarGenerator){
		if(isDebugOutput) console.info('setting grammar engine to: '+theGrammarGenerator);
		semanticInterpreter.setGrammarEngine(theGrammarGenerator);
	}
	
};


function _loadJsonGrammar(theJSONGrammarURL){

	var text = loadLocalFile(theJSONGrammarURL, 'text');
	try{
		var theJSONgrammar = JSON.parse(text);
	} catch(error){
		var errStr = error.stack? error.stack : error;
		var msg = 'Error parsing "'+theJSONGrammarURL+'" to a JSON object: '+ errStr;
		console.error(msg);
	
		//try to trigger a more detailed error
		try{
			var result = jsl.parser.parse(text);
		
			//this should not happen (error should be trigger above)
			if (result) {
				//THIS SHOULD NOT HAPPEN, since we already encountered an error when parsing a string to JSON
				// ... but since we now have a parsed JSON-object, we will just print a warning to the console and continue...
				console.error('recovered from parse-error using non-native JSON parser ...');
				theJSONgrammar = result;
			} else {
				//THIS SHOULD NOT HAPPEN -> instead catch-block below should be executed
				throw new Error(msg);
			}
		} catch(parseError){
			msg = msg + '\n' + parseError.toString().replace(/\r/igm,' ');
			console.error(msg);
			throw new Error(msg);
		}
	}
	
	return {data: theJSONgrammar, text: text};
};

function _generateGrammar(_theJSONGrammarPath, _theJSONGrammarFileName, _theJSONGrammarLanguageStr, _theCompiledGrammarTargetPath, _theCompiledGrammarTargetFileName, _theGrammarEngine, callback, isForceGeneration){

//	console.log('Path to JSON grammar: "'+theJSONGrammarPath+'"');
	
	var theJSONGrammarDir 			= _theJSONGrammarPath? _theJSONGrammarPath : theJSONGrammarPath;
	var theJSONGrammarFile			= _theJSONGrammarFileName? _theJSONGrammarFileName : theJSONGrammarFileName;
	var theJSONGrammarLanguage 		= _theJSONGrammarLanguageStr? _theJSONGrammarLanguageStr : theJSONGrammarLanguageStr;
	var theCompiledOutputPath 		= _theCompiledGrammarTargetPath? _theCompiledGrammarTargetPath : theCompiledGrammarTargetPath;
	var theCompiledOutputFileName 	= _theCompiledGrammarTargetFileName? _theCompiledGrammarTargetFileName: theCompiledGrammarTargetFileName;
	var theGrammarGenerator 		= _theGrammarEngine? _theGrammarEngine : void(0);
	
	if(_theJSONGrammarPath && typeof _theJSONGrammarPath !== 'string'){
		
		var opt = _theJSONGrammarPath;
		
		theJSONGrammarDir 			= opt.jsonGrammarDir;
		theJSONGrammarFile			= opt.jsonGrammarFile;
		theJSONGrammarLanguage 		= opt.languageCode;
		theCompiledOutputPath 		= opt.outPath;
		theCompiledOutputFileName 	= opt.outFile;
		theGrammarGenerator 		= opt.engine;
		
		callback					= opt.callback;
		isForceGeneration			= opt.force;
		
		if(typeof opt.debug !== 'undefined'){
			isDebugOutput = opt.debug;
		}

		if(theGrammarGenerator){
			_theGrammarEngine = theGrammarGenerator;
		}
	}

	_setGrammarEngine(_theGrammarEngine, theGrammarGenerator);
	
	var theJSONGrammarURL = theJSONGrammarDir + theJSONGrammarLanguage + '/' + theJSONGrammarFile;
	if(isDebugOutput) console.info('Created source/input path for JSON grammar file (for language '+theJSONGrammarLanguage+'): "'+theJSONGrammarURL+'"');

	var grammar = _loadJsonGrammar(theJSONGrammarURL);
	var theJSONgrammar = grammar.data;
	
	//create checksum-filename: build from original JSON-file and add language-code as postfix
	//	NOTE: this filename-format 
	//          <original filename>_<language code><checksum file extentsion>
	//        allows usage of the checksum-files by ANT's <checksum>-task (cannot be done 
	//        if e.g. using language-code as prefix in filename)
	var checksumFilePath = theCompiledOutputPath + theJSONGrammarFile + '_' + theJSONGrammarLanguage;
	
	var theCompiledOutputFile = theCompiledOutputPath + theJSONGrammarLanguage + '_' + theCompiledOutputFileName;
	if(isDebugOutput) console.info('Created target/output path for JavaScript grammar file (for language '+theJSONGrammarLanguage+'): "'+theCompiledOutputFile+'"');

	
	if(!isForceGeneration && !_isNeedCompile(grammar.text, theCompiledOutputFile, checksumFilePath, true)){
		
		if(isDebugOutput) console.log('----------------------------------- did nothing: JSON definition for '+theJSONGrammarLanguage+' is unchanged! ---------------------------');
		
		callback && callback();
		return;
	}
	

	semanticInterpreter.createGrammar(theJSONgrammar, theJSONGrammarLanguage, function(){
		var compiledParser = semanticInterpreter.getGrammarParserText( theJSONGrammarLanguage );
	
		//normalize newlines:
		// convert to windows style newlines:
		compiledParser = compiledParser.replace(/\r?\n/gm,'\r\n');
		//append an empty last line:
		compiledParser += '\r\n';
	
	
		if(isDebugOutput) console.log('------------------------------------------------ finished compiling ---------------------------');
	
		saveToFile(compiledParser, theCompiledOutputFile);
		
		//generate checksum-info for the original JSON-grammar and store it to a checksum-file:
		// (in order to allow up-to-date checking in reference to the JSON-definition file)
		var checksumInfo = checksumUtils.createContent(grammar.text);
				
		//store checksum-file along with the compiled grammar-file:
		saveToFile(checksumInfo, checksumFilePath + checksumUtils.getFileExt() );
	
		if(isDebugOutput) console.log('------------------------------------------------ finished! ---------------------------');
		
		callback && callback();
	});
	
};



if(typeof isRunAsModule === 'undefined' || !isRunAsModule){
	_generateGrammar();
} else if(isRunAsModule){
	
	module.exports.generateGrammar = _generateGrammar;
	module.exports.setGrammarEngine = _setGrammarEngine;
	
	onNodeModuleInit && onNodeModuleInit();
}
