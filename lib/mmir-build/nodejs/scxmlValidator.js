

var DOMParser = require('./../../nodejs-xmldom').DOMParser,
	fs = require('fs'),
	esprima = require('./../../nodejs-esprima'),
	oncomplete = require('./oncomplete.js');

//range around the (JavaScript) error which should be used for
//the (source code) excerpt that is used in the error description 
var CONTEXT_RANGE = 15;

//option for allowing return statements in the textContent for JavaScript/scripts
//ie. do not treat them as error
var ALLOW_RETRUN = false;

var nl = '\n';//TODO use env-specific NEWLINE char(s)


function _getJsLoc(offsetLine, offsetCol, err, isAttribute){
	
	var line = err.lineNumber - 1, col = err.column;	
	if(line === 0 && !isAttribute){
		col += offsetCol;
	}
	
	line += offsetLine;
	
	return {l: line, c: col};
}

//ctx.range NUMBER context range around the error location which will be used for indicating/"showing" the error in the error-description
function _getJsLocDesc(err, srcText, ctx){
	
	var contextRange = ctx.range;
	var i = err.index;
	var len = srcText.length;
	var start = Math.max(0, i - contextRange);
	var descIndex = start === 0? i : contextRange;
	var end = Math.min(len, len + contextRange);
	
	var desc = srcText.substring(start, end);
	
	if(/\r|\n/.test(desc)){
		
		var adjustStart = -1, adjustEnd = -1, start = 0, end = desc.length;
		
		desc.replace(/\r?\n|\r/gm, function(match, offset){
			if(offset < descIndex) adjustStart = offset + match.length;//<- adjust, so that desc starts at LAST linebreak BEFORE error
			else if(adjustEnd === -1) adjustEnd = offset;//<- adjust so that desc ends at FIRST linebreak AFTER error
			return match;
		});
		
		if(adjustStart !== -1){
			
			start = adjustStart;
			descIndex -= adjustStart;
		}
		
		if(adjustEnd !== -1){
			
			end = adjustEnd;
		}
		
		desc = desc.substring(start, end);

	}
	
	//create description-line (enclosed in quotes) and pointer to error location in next line
	var sb = ['"', desc, '"', nl, ' '];
	for(j=0; j < descIndex; ++j){
		sb.push(desc[j] === '\t'? '\t' : ' ');
	}
	sb.push('^');//<- add error-pointer
	
	return sb.join('');
	
}

function _toString(errorList, node, srcText, isAttribute, ctx){
	
	isAttribute = typeof isAttribute === 'undefined'? false : isAttribute;
	
	var srcLine = node.lineNumber;
	var srcCol = node.columnNumber;
	
	var sb = [], err, loc, locDesc;
	
	for(var i=0,size=errorList.length; i < size; ++i){
		err = errorList[i];
		loc = _getJsLoc(srcLine, srcCol, err, isAttribute);
		locDesc = _getJsLocDesc(err, srcText, ctx);
		
		sb.push(err.description);
		if(!isAttribute){
			sb.push(' (line ', loc.l, ', column ', loc.c, ')');
		} else {
			//there is no exact column/position available for the attribute with the node ...
			// -> just output the attribute-name and the column within the value-string of the attribute
			sb.push(' (at position ', loc.c, ' in line ', loc.l, ' in the value string of attribute ', isAttribute, ')');
		}

		sb.push(nl, locDesc, nl);
	}
	
	return sb.join('');
	
}

//HELPER for processing the allowScriptReturn option (i.e. ignore errors due to return statement in textContent)
function _processReturnStatementErrors(errors, src, ctx, attrib){
	
	var size=errors.length;
	
	//return if there are no ERRORs
	//OR if code is in an attribute
	//OR if option is NOT set, that errors due to return statements in textConent should be ignored
	if(attrib || size === 0 || !ctx.allowScriptReturn){
		return;////////////////////// EARLY EXIT //////////////////////
	}
	
	var err;
	for(var i = size - 1; i >= 0; --i){
		
		err = errors[i];
		//if it is an error due to a return statement:
		if(/Illegal return statement/i.test(err.description)){
			
			try{
				
				//HACK: esprima does not allow custom entry-points for parsing (e.g. parse as function-statement instead of a program)
				//      so wrap the code in a function declaration and parse it
				var wrappedSrc = 'function _(){\n' + src + '\n}';
				syntax = esprima.parse(wrappedSrc, {
					tolerant: true
				});
				//if no error is thrown now, then the original error is due to a return statement
				// -> so "ignore" the error, i.e. remove it from the list
				errors.splice(i,1);
				
			} catch(err2){} //-> error is still thrown, so keep the original error
		}
	}
}

function _getSyntaxErrors(node, ctx, attrib){
	
	var src = attrib? 
			node.getAttribute(attrib) :
			node.textContent;//TODO consider CDATASection <![CDATA[ ... ]]>, etc
	
	try{
		syntax = esprima.parse(src, {
			tolerant: true
		});
		
	} catch(err){
		
		syntax = {
			errors: [err]
		};
	}
	
	if (syntax.errors.length !== 0) {
		_processReturnStatementErrors(syntax.errors, src, ctx, attrib);
		return _toString(syntax.errors, node, src, attrib, ctx);	
	}
	return false;
}

function _getXml(path, callback){
	
	var doc, xml, err;
	fs.readFile(path, 'utf-8', function(e,xml){

		if(e){
			callback(e);
			return;
		}
		
		doc = new DOMParser({
			locator: {},
			errorHandler: function(level, msg) {
				err = new Error(path + "\tnot valid: "+level+", "+msg);
			}
		}).parseFromString(xml, 'text/xml');
		
		callback(err, doc, xml)
	});
}

//TODO add support for src attribute
function _validateScriptTags(doc, ctx){
	var scripts, script, errStr, xmlerror;
	var doFail = ctx.fail;
	
	scripts = doc.getElementsByTagName('script');
	if(scripts){
		
		for(var i=0,size=scripts.length; i < size; ++i){
			
			script = scripts[i];
			errStr = _getSyntaxErrors(script, ctx);
			
			if (!errStr) {
//				if (params.verbose) {
//					grunt.log.ok();
//				}
			} else {
				xmlerror = doFail(ctx.file + "\tJavaScript Syntax Error for <script> at line "+script.lineNumber+", column "+script.columnNumber+": "+ errStr);
//				return console.error(xmlerror);
			}
		}
	}
}

function _validateTransitionTags(doc, ctx){
	var nodes, node, errStr, xmlerror;
	var doFail = ctx.fail;
	
	nodes = doc.getElementsByTagName('transition');
	if(nodes){
		
		for(var i=0,size=nodes.length; i < size; ++i){
			
			node = nodes[i];
			if(node.hasAttribute('cond')){
				
				errStr = _getSyntaxErrors(node, ctx, 'cond');
				
				if (!errStr) {
//					if (params.verbose) {
//						grunt.log.ok();
//					}
				} else {
					xmlerror = doFail(ctx.file + "\tJavaScript Syntax Error for cond attribute at line "+node.lineNumber+", column "+node.columnNumber+": "+ errStr);
//					return console.error(xmlError);
				}
			}
		}
	}
}

function _isJsContent(element, ctx){
	
	//TODO other elements?
	//TODO refactor to config
	if(element.textContent && element.tagName === 'script'){
		return true;
	}
	return false;
}

function _validateTextContent(element, ctx){
	var errStr, error;
	
	if(_isJsContent(element, ctx)){
		
		errStr = _getSyntaxErrors(element, ctx);
		
		if (!errStr) {
//			if (params.verbose) {
//				grunt.log.ok();
//			}
		} else {
			error = ctx.fail(ctx.file + "\tJavaScript Syntax Error for <script> at line "+element.lineNumber+", column "+element.columnNumber+": "+ errStr);
//			return console.error(error);
		}
	}
}

function _getValidateAttrNames(element, ctx){
	
	var tag = element.tagName;
	
	//TODO other attributes
	//  e.g. invoke -> event="": there should exist a transition with that event (print WARNING otherwise)
	//TODO refactor to config
	if(tag === 'transition'){
		return ['cond', 'target'];
	} else if(tag === 'if' || tag === 'elseif'){
		return ['cond'];
	} else if(tag === 'state'){
		return ['initial'];
	} else if(tag === 'scxml'){
		return ['initial'];
	}
}

function _validateAttribute(attr, element, ctx){
	
	var name = attr.name;
	
	//TODO determine validation method by name
	
	if(name === 'target' || name === 'initial'){
		_validateTargetIdAttribute(name, attr.value, element, ctx);
	} else {
		_validateJsAttribute(name, element, ctx);
	}
	
	//is element.tagName === 'raise' => attr event: transition with event must exists
	//is element.tagName === 'transition' AND attr target => attr target: state with id must exists
}

function _validateJsAttribute(name, element, ctx){
	
	var error;
	var errStr = _getSyntaxErrors(element, ctx, name);
	
	if (!errStr) {
//		if (params.verbose) {
//			grunt.log.ok();
//		}
	} else {
		error = ctx.fail(ctx.file + "\tJavaScript Syntax Error for "+name+" attribute in <"+element.tagName+"> at line "+element.lineNumber+", column "+element.columnNumber+": "+ errStr);
//		return console.error(error);
	}
}

function _validateTargetIdAttribute(name, value, element, ctx){
	
	var error, errStr;
	
	var target = element.ownerDocument.getElementById(value);
	if(!target){
		errStr = ' target state with ID "'+value+'" does not exist.';
	} else if(target.tagName !== 'state' && target.tagName !== 'parallel'){
		errStr = ' target with ID "'+value+'" is not a <state> or <prallel> element, but <'+target.tagName+'>.';
	}
	
	if (!errStr) {
//		if (params.verbose) {
//			grunt.log.ok();
//		}
	} else {
		error = ctx.fail(ctx.file + "\tError in "+name+" attribute in <"+element.tagName+"> at line "+element.lineNumber+", column "+element.columnNumber+": "+ errStr);
//		return console.error(error);
	}
}

function _validateElementId(element, ctx){
	
	if(!element.hasAttribute('id')){
		//TODO generate errors for element that require an ID
		//if(_requiresId(element) ctx.doFail('ID missing: element <'+ctx[id].tagName+'> must have an id attribute, at line '+ctx[id].lineNumber + ', column' + ctx[id].columnNumber)
		return;
	}
	
//	if(!element.getAttribute)
	
	var id = element.getAttribute('id');
	
	if(!ctx.ids){
		ctx.ids = {};
	}
	
	//TODO evaluate namespaces?
	if(!ctx[id]){
		ctx[id] = element;
	} else {
		ctx.fail('Duplicate element ID "'+id+'" in <'+element.tagName+'> (line '+element.lineNumber+', column '+element.columnNumber+'): already exists for <'+ctx[id].tagName+'> at line '+ctx[id].lineNumber + ', column ' + ctx[id].columnNumber)
	}
}

function _traverse(element, ctx){
	
	var size, i;
	
	//process/validate the element
	
	if(element.tagName){//<- ignore elements without tagName (e.g. comments or text nodes)

		_validateElementId(element, ctx);
		
		_validateTextContent(element, ctx);
		
		var attrNames = _getValidateAttrNames(element, ctx);
		if(attrNames){
			size = attrNames.length;
			for(i=0; i < size; ++i){
				if(element.hasAttribute(attrNames[i])){
					_validateAttribute(element.getAttributeNode(attrNames[i]), element, ctx);
				}
				//TODO for state without initial AND if state is complex (i.e. containg state(s) and/or parallel(s)):
				//     verify that ther is an <initial> containg a <transition> that has no event- nor cond-attribute 
				//     and which's target-attr. links a state(s) and/or prallel(s) within the initial's parent state
			}
		}
		
	}
	
	
	//continue with element's children:
	
	var children = element.childNodes;
	if(children){

		size = children.length;
		for(i=0; i < size; ++i){
			_traverse(children.item(i), ctx);
		}
	}
	
}

function validateScxmlFiles(listener, filesSrc, options){
	
	var fail = false;
	var errors = [];
	var doFail = function(error){
		fail = true, err = error;
		if(typeof error === 'string'){
			err = new Error(err);
		}
		errors.push(err);
		return err;
	}
	
	var contextRange = options && typeof options.errorContextRange === 'number'? options.errorContextRange : CONTEXT_RANGE;
	var allowReturn = options && typeof options.allowScriptReturn === 'boolean'? options.allowScriptReturn : ALLOW_RETURN;

	var runner = new oncomplete();
	if(listener){
		runner.oncomplete(listener);
	}
	
	var totalFiles = filesSrc.length;
	var processedFiles = 0;
	var processComplete = function(){
		
		if(++processedFiles >= totalFiles){
			runner.setCompleted(fail? errors : void(0));
		}
	}
	
	filesSrc.forEach(function(f) { _getXml(f, function(e, doc){
		var scripts, nodes, xmlerror;
		
		if(e){
			doFail(e)
			processComplete();
			return;
		}
		
		var ctx = {
			file: f,
			range: contextRange,
			fail: doFail,
			allowScriptReturn: allowReturn
		};
		
	//	console.log(doc);
		
//		_validateScriptTags(doc, ctx);
//		
//		//TODO parse all possible JS errors, e.g. cond-attribute in <transition>, <if>,... etc
//		_validateTransitionTags(doc, ctx);
//		
//		//TODO validate target-attribute: ensure target state exists
//		//TODO validate data-model expr id, assign expr location
		
		_traverse(doc, ctx);
		
		processComplete();
	});});
}

/**
 * @param {PlainObject} options
 * 			options.files {Array<String>} list of files to validate
 * 			options.allowScriptReturn {Boolean} OPTIONAL if true, JavaScript code in textContent of the SCXML files that contains a return statement will not be treated as an error
 * 														 (since the JavaScript code is usually wrapped in a function statement, return statements usually do not trigger an error)
 */
module.exports.run = function(listener, options){
	
	var fileList = options.files;
	validateScxmlFiles(listener, fileList, options);
};
