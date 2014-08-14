<?xml version="1.0" encoding="UTF-8"?><!-- generate javascript backend in the format of requirejs module --><stylesheet xmlns="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.w3.org/2005/07/scxml" xmlns:c="http://commons.apache.org/scxml-js" version="1.0">
	<output method="text"/>

	<param name="module-path"/>
	<param name="xsl-base-dir" select="'src/xslt/'"/>


	<template match="/c:topologicallySortedDependencyList">
	<text>cat $1 | </text>
	<for-each select="c:stylesheet">
		<text>xsltproc </text><value-of select="$xsl-base-dir"/><value-of select="@path"/><text> - | \
</text>
	</for-each> 
	<text>xsltproc </text><value-of select="$xsl-base-dir"/><value-of select="@source-path"/><text> - 
</text>
	</template>
</stylesheet>