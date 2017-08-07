
var path = require('path');
var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');
var gutil = require('gulp-util');
var del = require('del');
var exec = require('child_process').exec;
var execFile = require('child_process').execFile;

var libDir = '../lib/';

var PROPERTIES_FILE = 'doc.properties';
var propsLoader = require(libDir + 'nodejs-properties');

var _properties;
var loadProperties = function(cb){

	if(_properties){
		return cb(_properties);
	}

	var config = {};

	propsLoader.parse(PROPERTIES_FILE, {path: true, variables: true}, function(error, docConfig){

		if(error){
			throw error;
		}

		if(docConfig) for(var name in docConfig){

			if(docConfig.hasOwnProperty(name)){
				// console.log('apply setting '+name+':'+docConfig[name])
				config[name] = docConfig[name];
			}
		}

		_properties = config;
		cb(config);
	});
};

var cleanJsDoc = function(callback, jsdocVer){
	loadProperties(function(settings){

		del([settings['dir.out.jsdoc'] + jsdocVer + '/**/*']);

		callback();
		return gutil.noop();
	});
	return gutil.noop();
};

gulp.task('default', ['jsdoc3']);

gulp.task('jsdoc2', gulpSequence('clean_jsdoc2', 'gen_jsdoc2'));

gulp.task('jsdoc3', gulpSequence('clean_jsdoc3', 'gen_jsdoc3'));

gulp.task('depDoc', gulpSequence('clean_depDoc', 'gen_depDoc'));

gulp.task('gen_jsdoc2', function(callback) {

	loadProperties(function(settings){

		var args = [
			settings['exec.jsdoc.v2'],
			settings['default.options.jsdoc.v2'],
			'-E="' +settings['exclude.config.jsdoc.v3']+'"',
			'-d=' +settings['dir.out.jsdoc'] + '2',
			'-t=' +settings['template.jsdoc.v2'],
			settings['dir.src.in']
		];

		var cmd = 'node '+args.join(' ');
		console.log('run: '+cmd);
		var child = exec(cmd , function(error, stdout, stderr){

			console.error(stderr);
			if (error) {
				callback(error);
				return gutil.noop();
			}
			// console.log(stdout);
			console.log('### wrote jsdoc2 files to '+path.normalize(settings['dir.out.jsdoc'] + '2'));

			callback();
			return gutil.noop();
		});

		//print conosle-output immediately as a way of progress-feedback (since jsdoc2 may take some time to process the files)
		child.stdout.on('data', function(data){
			console.log('	 ' + data.replace(/\r?\n$/, ''));
		});

	});


});

gulp.task('gen_jsdoc3', function(callback) {

	loadProperties(function(settings){

		var args = [
			settings['default.options.jsdoc.v3'],
			'-c ' +settings['file.config.jsdoc.v3'],
			'-d ' +settings['dir.out.jsdoc'] + '3',
			'-t ' +settings['template.jsdoc.v3'],
			settings['dir.src.in']
		];

		var cmd = path.normalize(settings['exec.jsdoc.v3']) + ' ' + args.join(' ');
		var child = exec(cmd, function(error, stdout, stderr){

			console.error(stderr);
			if (error) {
				callback(error);
				return gutil.noop();
			}
			// console.log(stdout);
			console.log('### wrote jsdoc3 files to '+path.normalize(settings['dir.out.jsdoc'] + '3'));

			callback();
			return gutil.noop();
		});

		//print conosle-output immediately as a way of progress-feedback (since jsdoc3 may take some time to process the files)
		child.stdout.on('data', function(data){
			console.log('	 ' + data.replace(/\r?\n$/, ''));
		});


	});


});

gulp.task('gen_depDoc', function(callback) {

	loadProperties(function(settings){

		var args = [
			settings['dep.doc.generator.script'],
			settings['dep.doc.mmirf.base.dir'],
			settings['dep.doc.target.dir'],
			settings['dep.doc.temp.config.file'],
			settings['dep.doc.output.file']
		];

		var cwd = path.normalize(settings['dep.doc.working.dir']);
		var child = execFile('node', args, {cwd: cwd} , function(error, stdout, stderr){

			console.error(stderr);
			if (error) {
				callback(error);
				return gutil.noop();
			}
			console.log(stdout);
			console.log('### created dependency graph visualisation at '+path.normalize(settings['dep.doc.working.dir']+settings['dep.doc.output.file']));

			callback();
			return gutil.noop();
		});

	});


});

gulp.task('clean_jsdoc2', function(callback) {

	cleanJsDoc(callback, 2);
});

gulp.task('clean_jsdoc3', function(callback) {

	cleanJsDoc(callback, 3);
});

gulp.task('clean_depDoc', function(callback) {

	loadProperties(function(settings){

		del([
			 settings['dep.doc.working.dir'] + settings['dep.doc.temp.config.file'] + '/**/*',
			 settings['dep.doc.working.dir'] + settings['dep.doc.output.file'] + '/**/*'
		]);

		callback();
		return gutil.noop();
	});
	return gutil.noop();
});
