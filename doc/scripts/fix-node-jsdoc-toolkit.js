#!/usr/bin/env node

/**
 * FIX some minor issues with node-jsdoc-toolkit#fix-tests:
 *  * replace outdated use of nodejs API
 *  * fix wrong declaration for UTF-8
 */
var fs = require('fs');
var console = require('console');

var jsdoc2Run = 'node_modules/jsdoc-toolkit/app/run.js';
fs.readFile(jsdoc2Run, 'utf8', function (err, data) {

  if (err) {
    return console.log(err);
  }
  
  //FIX out-dated nodejs API usage
  var result = data.replace(/var Script = require\('vm'\)\.Script;/g, 'var Script = require(\'vm\');');
  
  //FIX wrong UTF-8 declaration:
  result = result.replace(/IO\.encoding = "utf8";/g, 'IO.encoding = "utf-8";');
  result = result.replace(/encoding: "utf8",/g, 'encoding: "utf-8",');

  fs.writeFile(jsdoc2Run, result, 'utf8', function (err) {
     if (err) return console.log(err);
  });

  console.log('fixed '+jsdoc2Run+'.\n');
  
});
