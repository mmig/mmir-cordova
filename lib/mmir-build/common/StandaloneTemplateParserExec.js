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
 * Standalone script for parsing ehtml-templates (views, layouts, partials):
 *  - trigger initializations
 *  - read ehtml files
 *  - parse the read files
 *  
 *  REQUIRES: 
 *  global function init(): returns an array of "MODULE functions".
 *  A single "MODULE function" is created by wrapping the content of a JS-file into a function,
 *  creating a "closure module".
 *  NOTE that some "MODULE functions" are expected to return (i.e. export) arrays of objects that were created
 *  within; the first element in the array is expected to be a String ID, 
 *         and the following elements the exported objects from the "MODULE function",
 *         e.g.: ['someModule', obj1, obj2]
 */


var $ = require('jquery');
var commonUtils = require('commonUtils');

//"export" isArray to dummy jQuery:
$.isArray = commonUtils.isArray;


//replace getLocalScript: ANT-executed JavaScript environments are DOMless 
//  -> load & eval scripts instead of adding to document header
commonUtils.getLocalScript = function (scriptUrl, success, fail){
	
	var content;
	
	try {
		content = loadLocalFile(scriptUrl, 'text');
	}
	catch(exc){
		console.error('Could not load file/script from "'+scriptUrl+'": '+exc+(exc.stack? exc.stack : ''));
		if(fail) fail(exc);
		return;
	}
	//console.log('loaded from '+scriptUrl+': '+content);
	try{
		eval(content);
		
		//try to export the loaded classes 
		// (at least for controllers and helpers; models are not needed when parsing template files!)
		if( scriptUrl.indexOf('controllers/') !== -1 || scriptUrl.indexOf('helpers/') !== -1){
			var i = scriptUrl.lastIndexOf('/');
			var name = scriptUrl.substring(i+1, scriptUrl.length-3);
			name = name[0].toUpperCase() + name.substring(1);
			window[name] = eval(name);
			//console.log('trying to export Controller: '+ window[name] );
		}
	} catch (exc){
		if(fail) fail(exc);
		return;
	}
	try{
		if(success) success();
	} catch(exc){
		console.error('Failure in success handler for file/script from "'+scriptUrl+'": '+exc+(exc.stack? exc.stack : ''));
	};
};

//initialize (i.e. read directories.json)
commonUtils.init();

		
var context = {};//FIXME
var parserPrintWarningImpl = function(){};//FIXME
var parserPrintErrorImpl = function(){};//FIXME

var org = require('antlr3');

var ES3Lexer = require('ES3Lexer');
var ES3Parser = require('ES3Parser');
var MmirTemplateLexer = require('templateLexer');
var MmirTemplateLexer = require('templateLexer');

var MmirScriptLexer = require('scriptLexer');
var MmirScriptParser = require('scriptParser');

var MmirScriptContentLexer = require('contentLexer');
var MmirScriptContentParser = require('contentParser');
		
		print 				= function() { };//printImpl.apply(context, arguments); }
		printInfo 			= function() { };//printInfoImpl.apply(context, arguments); }
		parserPrintDebug 	= function() { };//parserPrintDebugImpl.apply(context, arguments); }
		parserPrintInfo 	= function() { };//parserPrintInfoImpl.apply(context, arguments); }
		parserPrintWarning 	= function() { parserPrintWarningImpl.apply(context, arguments); };
		parserPrintError 	= function() { parserPrintErrorImpl.apply(context, arguments); };
		//parserCreatePrintMessage = function() { return parserCreatePrintMessageImpl.apply(context, arguments); }

	    MmirTemplateLexer.prototype.emitErrorMessageRRR = function(msg) {
	    	console.error( parserCreatePrintMessage('[ERROR] TemplateLexer: ',msg) );
		};
	//	MmirTemplateParser.prototype.emitErrorMessage = function(msg) {
	//		parserPrintError('[ERROR] TemplateParser: ',msg);
	//	};
		
		ES3Lexer.prototype.emitErrorMessage = function(msg) {
			parserPrintError('[ERROR] JavaScriptLexer_ES3: ',msg);
		};
		ES3Parser.prototype.emitErrorMessage = function(msg) {
			parserPrintError('[ERROR] JavaScriptParser_ES3: ',msg);
		};
		
		MmirScriptLexer.prototype.emitErrorMessage = function(msg) {
			var mode = this.istStatementMode()? 'Statement' : 'Block';
			parserPrintError('[ERROR] Script'+mode+'Lexer: ',msg);
		};
		
		MmirScriptParser.prototype.emitErrorMessage = function(msg) {
			parserPrintError('[ERROR] ScriptStatementParser: ',msg);
		};
		
		MmirScriptContentLexer.prototype.emitErrorMessage = function(msg) {
			parserPrintError('[ERROR] ContentLexer: ',msg);
		};
		MmirScriptContentParser.prototype.emitErrorMessage = function(msg) {
			parserPrintError('[ERROR] ContentParser: ',msg);
		};
//	}
//}
		
		
//after initializing:
//  re-enable log-messages for parsing templates
console.log = consoleLogImpl;
console.debug = consoleDebugImpl;
//for ANT it makes no difference, if messages are written into the std-out or err-out
//		-> "normalize" messages into std-out 
//		(-> this avoids synchronization problems when both streams are displayed in same output stream)
console.info  = console.log;
console.warn  = console.log;
console.error = console.log;

var configurationManager = require('configurationManager');

//force view-generation (i.e. disable change-check for compiled views)
configurationManager.set('usePrecompiledViews', 'false');

console.log('------------------------------------------------ completed initialization, start parsing *.ehtml files... ---------------------------');

var controllerManager = require('controllerManager');

//modify loadImpl-function, so that stub Controllers are loaded instead of actual controllers
//(for creating template JS code, the controllers are not really required, only the paths etc. they contain for loading
//the templates)
var constants = require('constants');

var Helper = require('helper');
var Controller = require('controller');
Controller.prototype.__loadHelper = Controller.prototype.loadHelper;
Controller.prototype.loadHelper = function(name, helperPath){
	
	//create stub class for the helper:
	eval.call(window, 'window.'+name+' = function(){};');

	//initialize the helper for the controller:
	this.helper =   new Helper(this, name);
	
};

commonUtils.__loadImpl = commonUtils.loadImpl;
commonUtils.loadImpl = function _loadStubCtrlImpl(librariesPath, isSerial, completedCallback, checkIsAlreadyLoadedFunc, statusCallback){
	
	//if loading controllers, use stub controller classes instead of real impl.
	// (in order to avoid exception etc. that may get triggered due to the fact, that we
	//  do not load the complete framework / app-code here)
	var isLoadCtrl = librariesPath === constants.getControllerPath();
	if(isLoadCtrl){
		
		
		//mock loading controller implementation files: use stubs instead
		var list = commonUtils.getDirectoryContentsWithFilter(librariesPath, "*.js");
		
		var fn;
		for(var i=0,size=list.length; i < size; ++i){
			fn = /^(.+?)\.\w+$/.exec(list[i]);
			if(fn){
				
				//convert name to start with upper-case character:
				fn = fn[1].charAt(0).toUpperCase() + fn[1].substring(1);
				
				//create stub class for controller:
				eval.call(window, 'window.'+fn+' = function(){ this.on_page_load = function(){}; };');
				
				//simulate callback invocations of original loadImpl():
				if(statusCallback){
					statusCallback('info', list[i], 'loaded');
				}
			}
			else {
				//simulate callback invocations of original loadImpl():
				// do signal that there was an error
				statusCallback('error', list[i], 'invalid file name: '+list[i]);
			}
		}

		//simulate callback invocations of original loadImpl():
		// do signal that we are finished now (i.e. have loaded all controllers)
		if(completedCallback){
			completedCallback();
		}
		
		//simulate returned deferredof original loadImpl()...
		var _defer = $.Deferred();
		// ...resolve as completed...
		_defer.resolve();
		// ... and return the resolved promise
		return _defer.promise();
		
	} else {
		
		//use original loadImpl(), if not loading controllers:
		this.__loadImpl.apply(this, arguments);
	}
	
};

var checksumUtils = require('checksumUtils');


function _generateCompiledViews(options){

	var cbFunc, isForceGen = false;
	isDebugOutput = true;
	
	if(options){
		
		cbFunc		= options.callback;
		isForceGen	= options.force;
		
		if(typeof options.debug !== 'undefined'){
			isDebugOutput = options.debug;
		}
	}
	
	//trigger parsing of templates by initializing the presentationManager:
	commonUtils.init().then(function(){
		
		controllerManager.init().then(function afterLoadingControllers(ctrlManager){
			
			//TODO make isForceGeneration this thread-safe(?)
			var usePrecompiledViewsVal = isForceGeneration? 'false' : 'true';
			configurationManager.set('usePrecompiledViews', usePrecompiledViewsVal);
			
			var callback = cbFunc, isForceGeneration = isForceGen;
			
			controllerManager = ctrlManager;
			
			//FIX: halt execution -> do not allow to continue, in case a template file could not be read!
			var isError = false;
			var errorList = [];
			var originalAjax = $.ajax;
			$.ajax = function(options){
				var originalErrorFunc = options.error;
				options.error = function(loadContext, status, exc){
					if(originalErrorFunc){
						originalErrorFunc(exc);
					}
					
					//ignore errors for reading checksum-files:
					if(new RegExp('\\'+checksumUtils.getFileExt()+'$', 'i').test(this.url)){
						return;
					}
					
//					console.log('Standalone-Template-Parser.ajax-shim: '+(exc.stack?exc.stack:exc));
//					console.error('Standalone-Template-Parser.ajax-shim ERROR for URL: '+options.url);
//					throw(exc);
					errorList.push(exc);
					isError = true;
				};
				return originalAjax(options);
			};
			
			//do trigger loading of the template files (*.ehtml) by requesting the PresentationManager instance:
		    var pm = require('presentationManager');
		    pm.init().then(function(){

				if(isError){
					var msg = ' Details: \n';
					for(var err_i in errorList){
						var error = errorList[err_i];
						msg += (error.stack ? error.stack : error.toString()) + '\n';
					}
					throw(new Error('Encountered errors while reading templates files: abort parsing!'+msg));
				}
			    
			    console.log('------------------------------------------------------- finished parsing *.ehtml templates -----------------------------------------');
			    
			    var storageBasePath = compiledViewGenPath;
			    
			    var View = require('view');
			    var Partial = require('partial');
			    var Layout = require('layout');
			    
			    console.log(' \n ');
			    console.log(
			    	'--------------------------- writing to "'
			    		+storageBasePath
			    		+'" compiled *.ehtml templates (as JavaScript files)...'
			    		+' --------------------------'
			    );
			    
			    var wroteFileCounter = 0;

				// stringify and store the views, ie. store "compiled" views
				var utils = commonUtils;//mobileDS.CommonUtils.getInstance();
			    var partialPrefix = utils.getPartialsPrefix();
			    var isPartialView = function(name){
			    	return name.charAt(0) == partialPrefix;
			    };
			    var regExprFileExt = /\.ehtml$/igm;
			    
			    var constants = require('constants');
			    
				var viewList = utils.getDirectoryContents('views');
				
				//prepare view-list and compute total count of views that will be compiled
				var counter = 0;
				var total = 0;
				for(var i=0, size=viewList.length; i < size; ++i){
					
					var name = viewList[i];
					
					if(!name){
						continue;
					}
					
					var views = utils.getDirectoryContents('views/'+name);
					
					viewList[i] = {
						name: name,
						views: views
					};
					
					for(var j=0, jsize=views.length; j < jsize; ++j){
						
						if(views[j]){
							++total;
						}
					}
				}
			    
				for(i=0, size=viewList.length; i < size; ++i){
					
					var viewEntry = viewList[i];
					var name = viewEntry.name;
					
					if(!name){
						console.error('Invalid view-directory in directory-structure at views/['+i+']!');
						continue;
					}
					
					var views = viewEntry.views;
					
					if(!views){
						console.info('Found non-directory entry (i.e. file) in views/['+i+']: "'+name+'"');
						continue;
					}
					
					var isLayout = false;
					var ctrlName;
					if(name === 'layouts'){
						isLayout = true;
					}
					else {
						ctrlName = name.charAt(0).toUpperCase() + name.substring(1);
					}
					
					for(j=0, jsize=views.length; j < jsize; ++j){
						
						var viewFileName = views[j];
						
						if(!viewFileName){
							console.error('Invalid view-name in directory-structure at views/'+name+'/['+j+']!');
							continue;
						}
						
						var viewName;
						if(! regExprFileExt.test(viewFileName) ){
							console.warn('Unknown file-extension for view in directory-structure at views/'+name+'/'+viewFileName);
							viewName = viewFileName;
						}
						else {
							//remove file extension ".ehtml"
							viewName = viewFileName.substring(0, viewFileName.length - 6);
						}
						regExprFileExt.lastIndex = 0;
						
						console.log(' ');
						console.log('preparing view (ehtml) in directory-structure at views/'+name+'/'+viewName+' for storage...');
						
						var isPartial = isPartialView(viewName);
						
						var view;
						if( isLayout ){
							//layouts are specific to controllers, so the layout's lookup-key is actually the controller-name
							// --> "convert" layout name to controller-name format (i.e. first letter to upper case)
							var layoutKey = viewName.charAt(0).toUpperCase() + viewName.substring(1);
							view = pm.getLayout(layoutKey);
						} 
						else if( isPartial ){
							//remove partial's name-prefix:
							var partialName =  viewName.substring(partialPrefix.length);
							view = pm.getPartial(ctrlName, partialName);
						}
						else {
							view = pm.getView(ctrlName, viewName);
						}
						
						++counter;
						
						if(!view){
							
							console.error('Could not create compiled view '+(isLayout? '(layout) ':' ')+(isPartial? '(partial) ':' ')+'for '+ctrlName+'/'+viewName);
							
							if(counter === total) callback && callback();
							
							continue;
						}
						
						var stringifiedView = view.stringify();
						var path = storageBasePath + 'views/'+name+'/'+viewName;
						
						var viewEHtmlPath = constants.getViewPath()+name+'/'+viewName + '.ehtml';

						var rawViewContent = loadLocalFile(viewEHtmlPath, 'text');
						
						if(!isForceGeneration && !_isNeedCompile(rawViewContent, path + '.js', path, true)){
							
							if(isDebugOutput) console.log('----------------------------------- did nothing: view is unchanged! ---------------------------');
							
							if(counter === total) callback && callback();
							
							continue;
							
						} else if(isForceGeneration && !_isNeedCompile(rawViewContent, path + '.js', path, true)){
							
							//if generation is forced, but the content seems unchanged, then the compiled view was loaded
							// -> force re-compiling the source (ehtml) file, before continuing:
							if( isLayout ){
								view = new Layout(view.getName(), rawViewContent, view.remoteaccess, true);
							} 
							else if( isPartial ){
								view = new Partial(view.getController(), view.getName(), rawViewContent);
							}
							else {
								view = new View(view.getController(), view.getName(), rawViewContent);
							}
							
							stringifiedView = view.stringify();
						}

						var wasWritten = saveToFile(stringifiedView, path + '.js');
						if(wasWritten){
							
							++wroteFileCounter;

							//create checksum files to be used on loading pre-compiled templates
							// (in order to check up-to-date status)
							var digestContent = checksumUtils.createContent(rawViewContent);
							saveToFile(digestContent, path + checksumUtils.getFileExt());

							if(counter === total) callback && callback();
							
						} else {
							
							console.error('Could not store compiled view at '+path + '.js');

							if(counter === total) callback && callback();	
						}
						
					}//END: for( view-subdir-list )
					
				}//END: for( views-list )
				
				console.log(' ');
				console.log('------------------------------------------------ wrote '+wroteFileCounter+' file(s) to '+storageBasePath+' ---------------------------');
				
		    });//END:  presentationManager.init().then(...
		    
		});//END: afterLoadingControllers()
		
	});//END: commonUtils.init().then(...
	
}

if(typeof isRunAsModule === 'undefined' || !isRunAsModule){
	_generateCompiledViews();
} else if(isRunAsModule){
	
	module.exports.generateViews = _generateCompiledViews;
	
	onNodeModuleInit && onNodeModuleInit();
}
