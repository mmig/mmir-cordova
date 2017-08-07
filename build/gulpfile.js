
var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var preservetime = require('gulp-preservetime');
var rename = require("gulp-rename");
var gulpSequence = require('gulp-sequence');
var gFilter = require('gulp-filter');
var chmod = require('gulp-chmod');

var src_dir = './';

var dest_dir = '../';
//var dest_doc_dir = dest_dir + 'doc/';

var new_hook_location = dest_dir + 'hooks/before_prepare/build-mmir.js';
var old_hook_location = dest_dir + 'hooks/before_build/build-mmir.js';

gulp.task('default', ['copy_resources', 'create_mmir_settings', 'prepare_jsdoc']);

gulp.task('copy_resources', gulpSequence('copy_build_resources', 'check_outdated_hooks'));

gulp.task('copy_build_resources', function() {
	
	console.log(resources_message);
	
	var filter = gFilter(['*.js', '*.xml'], {restore: true});
	
	//copy all resources from /resources
	return gulp.src(src_dir + 'resources/**/*')
		.pipe(filter)
		.pipe(chmod({owner: {execute: true}}))//<- set execute flag for scripts
		.pipe(filter.restore)
		.pipe(gulp.dest(dest_dir))
		.pipe(preservetime());
});

gulp.task('create_mmir_settings', function() {
	
	//create mmir-build.settings from mmir-build.settingsDefault, if none exists yet:
	var mmirSettingsFile = 'mmir-build.settings';
	if(!fs.existsSync(dest_dir + mmirSettingsFile)){
		
		gulp.src(src_dir + 'resources/' + 'mmir-build.settingsDefault')
			.pipe(rename(mmirSettingsFile))
			.pipe(gulp.dest(dest_dir));
			
	} else {
		
		return gutil.noop();
	}
	
});

//gulp.task('copy_jsdoc', function() {
//	
//	console.log(jsdoc_message);
//	
//	var filter = gFilter(['*.js', '*.xml'], {restore: true});
//	
//	//copy all jsdoc resources from /doc
//	return gulp.src(src_dir + 'doc/**/*')
//		.pipe(filter)
//		.pipe(chmod({owner: {execute: true}}))//<- set execute flag for scripts
//		.pipe(filter.restore)
//		.pipe(gulp.dest(dest_doc_dir))
//		.pipe(preservetime());
//	
//});

gulp.task('prepare_jsdoc', function() {
	
	console.log(jsdoc_message);
	
	var filter = gFilter(['*.js', '*.xml'], {restore: true});
	
	//chmod jsdoc resources to allow script execution
	return gulp.src(src_dir + 'doc/**/*')
		.pipe(filter)
		.pipe(chmod({owner: {execute: true}}))//<- set execute flag for scripts
		.pipe(filter.restore);
	
});

gulp.task('check_outdated_hooks', function(callback) {
	
	if(fs.existsSync(new_hook_location) && fs.existsSync(old_hook_location)){
		
		console.log(outdated_hooks_warning);
	}
	callback();
	return gutil.noop();
});

/////////////////////// messages //////////////////////

var resources_message = '\r\n\
  \r\n\
  INFO: When updating files, mmir-build.xml and mmir-parse.xml may provide some new \r\n\
  (default) build options.\r\n\
  \r\n\
  Check, if mmir-build.settingsDefault (compared to mmir-build.settings) has\r\n\
  changed and see its comments for setting specific build options.\r\n\
\r\n\
';

var jsdoc_message = '\r\n\
\r\n\
  INFO: For generating API docs, see [project root]/build/doc:\r\n\
    ant [jsdoc2 | jsdoc3]\r\n\
	\r\n\
  See README.md in [project root]/build/doc for more information\r\n\
  on generating docs.\r\n\
\r\n\
';

var outdated_hooks_warning = '\r\n\
\r\n\
  WARNING: found multiple copies of script build-mmir.js in\r\n\
       \r\n\
       /hooks/before_prepare\r\n\
        	\r\n\
        	and\r\n\
\r\n\
       /hooks/before_build\r\n\
\r\n\
            If you did not explicitly add build-mmir.js to /before_build, you\r\n\
        	should delete this 2nd copy of build-mmir.js!\r\n\
        	(otherwise the build will take longer, because this script gets executed twice)\r\n\
        	\r\n\
\r\n\
  NOTE: previous versions did hook into before_build instead of before_prepare\r\n\
        You should make sure that the script /before_XXX/build-mmir.js\r\n\
        occurs only in one of those to directories.\r\n\
\r\n\
';