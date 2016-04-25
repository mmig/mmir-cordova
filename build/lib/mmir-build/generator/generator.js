
var dust = require('../../nodejs-dust');
var fs = require('fs');
var path = require('path');

//convert to / normalize file-path (with system-dependent path-separators)
var toFilePath = function(uri, name){
	return uri.replace(/\//gm, path.sep);
};



var unresolveAntPropPath = function(value, config){
	return value;
};

var resolveToFilePath = function(value, config){
	
	var resolvedPath = value.replace(/\${([^}]+)}/g, function(match, varName, offset, string){
		return config[varName];
	});
	
	return toFilePath(resolvedPath);
};

//convert to / normalize file-path (with system-dependent path-separators)
var toAntFileTag = function(filePath, name){
	
	var i = filePath.lastIndexOf(path.sep);
	if(i === -1){
		i = filePath.lastIndexOf('/');
	}
	
	var fpath, fname;
	if(i !== -1){
		fpath = filePath.substring(0,i);
		fname = filePath.substring(i+1, filePath.length);
	} else {
		
		//special case: if ANT property, extract string until last ANT prop as file-path an rest as file-name
		var re = /\${([^}]+)}/g, index, m1, m2 = null;
		while(m1 = re.exec(filePath)){
			m2 = m1;
		}
		
		if(m2){
			index = m2.index + m2[0].length;
			fpath = filePath.substring(0,index);
			fname = filePath.substring(index, filePath.length);
		} else {
			fpath = '.' + path.sep;
			fname = filePath;
		}
	}
	
	//<fileset dir="${jsBuildDirBase}ant" includes="StandaloneTemplateParserExec.js" />
	
	return '</string>\r\n<fileset dir="'+fpath+'" includes="'+fname+'" />\r\n<string>';
	
};

//helper: convert all strings in a JSON object
var convertStringsIn = function(dict, toStringFunc){
	for(var p in dict){
		if(dict.hasOwnProperty(p)){
			
			if(typeof dict[p] === 'object'){
				if(dict[p] == null){
					continue;
				} else {
					convertStringsIn(dict[p], toStringFunc);
				}
			} else if(typeof dict[p] === 'string'){
				dict[p] = toStringFunc(dict[p], p);
			}
		}
	}
	return dict;
};

//helper: convert all strings in a JSON object using the path-normalizer
var convertToFilePath = function(dict){
	
	return convertStringsIn(dict, toFilePath);
};

//helper: convert all strings in a JSON object using the path-normalizer
var convertToAntTemplateValues = function(dict, ignoreList){
	
	return convertStringsIn(dict, function toAntProperty(value, name){
		
		//ignore "private" / "protected" variables:
		if(name.charAt(0) === '_'){
			return value;
		}
		
		//to not convert entries from ignore-list:
		for(var i=ignoreList.length-1; i >= 0; --i){
			if(ignoreList[i] === name){
				return value;
			}
		}
		
		return '${'+name+'}';
	});
};

//process DUST template
var processTemplate = function(err, templateStr, context, outputFile, cb){

	if (err) {
		return console.log(err);
	}

	templateStr = templateStr.replace('\u00EF\u00BB\u00BF', '');//<- remove BOM
	templateStr = templateStr.replace(/\r?\n/igm, '\r\n');//<- normalize line-breaks
	
	//console.log('\nloaded template: '+JSON.stringify(templateStr));
	
	var compiled = dust.compile(templateStr, 'parseviews');
	
	//console.log('\ncompiled template: '+JSON.stringify(compiled));
	
	dust.loadSource(compiled);

	console.log('\nloaded and compiled template... ');
	
	//dust.cache

	dust.render('parseviews', context, function onrendered(error, output){
		
		if(error){
			return console.error(error);
		}
		
		if(context.isAntTarget){
			
			output = output.replace(/<string>\s*<\/string>/gm, '');
			
			if(context._prependAnt){
				output = context._prependAnt + output;
			}

			if(context._appendAnt){
				output += context._appendAnt;
			}
		}
		
		console.log('\nrendered template (length '+output.length+')...');
		fs.writeFileSync(outputFile, output);
		console.log('\nwrote contents to file "'+outputFile+'".');
		cb && cb();
	});
};

//load include-files:
var processIncludes = function(name, templateStr, dict, nameList){
	
	name = name.replace(/\.js$/i, '').replace(/[.-]/g, '_');
	dict[name] = templateStr.replace(/\r?\n/igm, '\r\n');//<- normalize line-breaks to \r\n
	
	if(nameList){
		nameList.push(name);
	}

	console.log('\tloaded script '+name+' as string (length: '+templateStr.length+').');
};

//////////////////////////// main processing //////////////////////////


//disable whitespace optimizer:
dust.optimizers.format = function(ctx, node) {
	return node;
};

//convert file-paths to URLs:
dust.filters.url = function(value) {
	return value? value.replace(/\\/gm, '/') : value;
};

var startProcessing = function(templateFile, targetFile, includeFiles, config, cb){
	
	console.log('start creating generator at '+targetFile+' using template file '+templateFile+' ...');
	
	var loaded = 0,
		count = 0,
		isLoopCompleted = false,
		includeNameList = [];
	
	if(!includeFiles){
		includeFiles = [];
	}
	
	var checkProcTemplate = function(){
		//console.log('loaded '+loaded+' scripts from '+count);
		if(isLoopCompleted === true && loaded === count){
			
			if(config.isAntTarget){
				
				convertToAntTemplateValues(config, includeNameList);
			}
			
			startProcessingTemplate(templateFile, targetFile, config, cb);
		}
	};
	
	
	for(var f in includeFiles){

		++count;
		
		(function(){
		
			var fname = f;
			var fpath = config.isAntTarget? unresolveAntPropPath(includeFiles[f], config) : resolveToFilePath(includeFiles[f], config);
			

			if(config.isAntTarget){
				processIncludes(fname, toAntFileTag(fpath), config, includeNameList);
				++loaded;
				return;
			}
			
			fs.readFile(fpath, 'utf8', function(error, content) {
				
				if(error){
					console.error('ERROR failed to load script '+f+' from '+fpath);
				} else {
					content = content.replace('\u00EF\u00BB\u00BF', '');//<- remove BOM
					processIncludes(fname, content, config, includeNameList);
				}
				
				++loaded;
				checkProcTemplate();
				
			});
		})();
	}
	
	isLoopCompleted = true;
	checkProcTemplate();
	
};

var startProcessingTemplate = function(templateFile, targetFile, config, cb){

	fs.readFile(templateFile, 'utf8', function(error, output) {
		processTemplate(error,output,config,targetFile, cb);
	});
	
};

module.exports = {
	process: startProcessing,
	toFilePath: toFilePath,
	normalizeFilePaths: convertToFilePath
};

