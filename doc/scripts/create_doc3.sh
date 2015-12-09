#!/usr/bin/env bash

# Linux version (should work, not tested):
_BASEPATH=$PWD
TARGETDIR=$_BASEPATH/../www/mmirf

OUTPUTDIR=$_BASEPATH/api_jsdoc3
JSDOCDIR=node_modules/jsdoc
TEMPLATEDIR=$JSDOCDIR/templates
# TEMPLATEDIR=templates
# TEMPLATE=JSDoc-DataTables-master
# TEMPLATE=default
TEMPLATE=docstrap\template

$JSDOCDIR/jsdoc.cmd -t $TEMPLATEDIR/$TEMPLATE -d $OUTPUTDIR -r -p -c $_BASEPATH/conf-jsdoc3.json --verbose $TARGETDIR