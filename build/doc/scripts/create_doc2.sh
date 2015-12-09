#!/usr/bin/env bash

# Linux version (should work, not tested):
_BASEPATH=$PWD
TARGETDIR=$_BASEPATH/../www/mmirf
EXCLUDEDIRS="-E=gen|libs|node_modules|_node_modules"
OUTPUTDIR=$_BASEPATH/api_doc2
JSDOCDIR=./node_modules/jsdoc-toolkit
TEMPLATEDIR=$JSDOCDIR/templates
TEMPLATE=$TEMPLATEDIR/jsdoc
node $JSDOCDIR/app/noderun.js -A -t=$TEMPLATE -p -v -r $EXCLUDEDIRS -d=$OUTPUTDIR -v $TARGETDIR